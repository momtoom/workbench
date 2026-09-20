#!/usr/bin/env node
// Install Figma-sourced files into a Workbench project and register them in
// .workbench/assets.json in the same pass, so page source can reference a real
// /workbench-assets/ URL that survives `workbench_verify_page`.
//
//   node scripts/install-figma-assets.mjs --project <projectRoot> --manifest <manifest.json> [--dry-run]
//
// Manifest shape:
//   {
//     "fileKey": "15VxIdUD5ZubXck4rocQlz",
//     "fileName": "Blank v.2.6",
//     "assets": [{
//       "name": "K-Maven Track Icons",
//       "kind": "icon",                       // icon | image | font | video
//       "id": "asset-kmaven-track-icons",     // optional, derived from name
//       "collection": "kmaven-track",         // optional folder, derived from name
//       "nodeId": "737:78373",
//       "nodeName": "Track icons",
//       "tags": ["kmaven"],                   // optional, merged with defaults
//       "files": [{
//         "path": "./downloads/track.svg",    // relative to the manifest
//         "name": "track.svg",                // optional, defaults to basename
//         "importName": "KmavenTrack",        // optional, icon preview only
//         "label": "Track icon",              // optional preview label
//         "style": "outline"                  // optional, icon preview only
//       }]
//     }]
//   }
//
// Re-running with the same manifest is idempotent: files are overwritten in
// place, the record is replaced by id, and createdAt is preserved.

import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';

const KIND_FOLDERS = { icon: 'icons', image: 'images', font: 'fonts', video: 'videos' };
const MIME_TYPES = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

const options = parseArgs(process.argv.slice(2));
const projectRoot = resolve(options.project);
const manifestPath = resolve(options.manifest);
const manifestRoot = dirname(manifestPath);
const registryPath = join(projectRoot, '.workbench', 'assets.json');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const registry = JSON.parse(await readFile(registryPath, 'utf8'));
if (!Array.isArray(registry.assets)) throw new Error(`${registryPath} has no assets array.`);
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  throw new Error('Manifest must contain a non-empty assets array.');
}

const installed = [];
for (const entry of manifest.assets) {
  installed.push(await installAsset(entry));
}

if (!options.dryRun) {
  registry.extensions = registry.extensions ?? {};
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  dryRun: options.dryRun,
  project: projectRoot,
  registry: relative(projectRoot, registryPath),
  assets: installed,
}, null, 2));

if (!options.dryRun) {
  console.error('\nRegistry written. If the Workbench app has this project open, reopen it so the app hydrates from disk instead of overwriting these records from its in-memory snapshot.');
}

async function installAsset(entry) {
  const kind = String(entry.kind ?? '').toLowerCase();
  const folder = KIND_FOLDERS[kind];
  if (!folder) throw new Error(`Asset "${entry.name}" has unsupported kind "${entry.kind}". Use one of: ${Object.keys(KIND_FOLDERS).join(', ')}.`);
  if (!entry.name) throw new Error('Every asset entry needs a name.');
  if (!Array.isArray(entry.files) || entry.files.length === 0) throw new Error(`Asset "${entry.name}" has no files.`);

  const collection = safeFolderName(entry.collection || entry.name);
  const assetRoot = `public/workbench-assets/${folder}/${collection}`;
  if (!options.dryRun) await mkdir(join(projectRoot, assetRoot), { recursive: true });

  const previews = [];
  let totalSize = 0;
  for (const file of entry.files) {
    if (!file?.path) throw new Error(`Asset "${entry.name}" has a file entry without a path.`);
    const sourcePath = isAbsolute(file.path) ? file.path : resolve(manifestRoot, file.path);
    const fileName = safeFileName(file.name || basename(sourcePath));
    const relativeFilePath = `${assetRoot}/${fileName}`;
    if (!options.dryRun) await copyFile(sourcePath, join(projectRoot, relativeFilePath));
    totalSize += (await stat(sourcePath)).size;
    previews.push({
      ...(kind === 'icon' ? { importName: file.importName || toPascalCase(file.label || fileName) } : {}),
      name: file.label || basename(fileName, extname(fileName)),
      sourceFile: fileName,
      ...(kind === 'icon' && file.style ? { style: file.style } : {}),
      value: `/workbench-assets/${folder}/${collection}/${fileName}`,
    });
  }

  const id = entry.id || `asset-${safeFolderName(entry.name)}`;
  const existing = registry.assets.find((asset) => asset.id === id);
  const now = new Date().toISOString();
  const record = {
    id,
    name: entry.name,
    kind,
    source: {
      type: 'project-file',
      value: previews[0].value,
      filePath: `${assetRoot}/${previews[0].sourceFile}`,
    },
    fileName: previews.length > 1 ? `${collection}.${extname(previews[0].sourceFile).slice(1)}-set` : previews[0].sourceFile,
    mimeType: MIME_TYPES[extname(previews[0].sourceFile).toLowerCase()] ?? 'application/octet-stream',
    size: totalSize,
    tags: [...new Set([kind, 'figma', ...(entry.tags ?? [])])],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    extensions: {
      ...(manifest.fileKey ? { sourceFigmaFileKey: manifest.fileKey } : {}),
      ...(manifest.fileName ? { sourceFigmaFileName: manifest.fileName } : {}),
      ...(entry.nodeId ? { sourceFigmaNodeId: entry.nodeId } : {}),
      ...(entry.nodeName ? { sourceFigmaNodeName: entry.nodeName } : {}),
      installedAs: 'project-assets',
      sourceAssetRoot: assetRoot,
      ...(kind === 'icon' ? { previewIcons: previews } : {}),
      ...(kind === 'image' ? { previewImages: previews } : {}),
    },
  };

  registry.assets = [...registry.assets.filter((asset) => asset.id !== id), record];
  return { id, kind, fileCount: previews.length, assetRoot, totalSize, urls: previews.map((preview) => preview.value) };
}

function parseArgs(argv) {
  const parsed = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--dry-run') parsed.dryRun = true;
    else if (argv[index] === '--project') parsed.project = argv[index += 1];
    else if (argv[index] === '--manifest') parsed.manifest = argv[index += 1];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!parsed.project || !parsed.manifest) {
    throw new Error('Usage: node scripts/install-figma-assets.mjs --project <projectRoot> --manifest <manifest.json> [--dry-run]');
  }
  return parsed;
}

// Deterministic on purpose: the app's own installer appends a timestamp, but
// page source has to reference these URLs, so they must stay stable across runs.
function safeFileName(value) {
  const cleaned = basename(String(value).trim()).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (!cleaned) throw new Error(`Cannot derive a safe file name from "${value}".`);
  const dotIndex = cleaned.lastIndexOf('.');
  return dotIndex > 0 ? `${cleaned.slice(0, dotIndex).slice(0, 72)}${cleaned.slice(dotIndex).slice(0, 16)}` : cleaned.slice(0, 72);
}

// Lower-cased so the public URL behaves the same on case-sensitive hosts as it
// does on macOS, matching the existing workbench-assets folders.
function safeFolderName(value) {
  const cleaned = basename(String(value).trim().toLowerCase()).replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return (cleaned || 'collection').slice(0, 72);
}

function toPascalCase(value) {
  return String(value).replace(/\.[^.]+$/, '').split(/[^a-zA-Z0-9]+/).filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('') || 'Asset';
}
