import type {
  WorkbenchComponentRegistry,
  WorkbenchLibraryRegistryEntry,
} from './workbenchProject';

export type WorkbenchImportedLibraryMetadata = {
  libraryId: string;
  librarySourcePath: string;
  snapshotRoot: string;
  updatePolicy: 'manual';
  cssImportFileName: string;
};

export type WorkbenchLibraryOwnedFile = {
  componentNames: string[];
  contents: string;
  originalPath: string;
  path: string;
};

/**
 * Any folder shaped like `<libraryId>-preset/components` or
 * `src/libraries/<libraryId>/components` is treated as an importable library.
 * The library id is derived from the folder name, the project snapshot lives
 * at `src/libraries/<libraryId>`, and the bundled stylesheet is named
 * `<libraryId>.css`. No preset is special-cased — adding a new preset folder
 * Just Works without code changes.
 */
const PRESET_SOURCE_PATTERN = /(?:^|\/)([a-z][a-z0-9-]*)-preset\/components$/i;
const PROJECT_LIBRARY_SOURCE_PATTERN = /(?:^|\/)src\/libraries\/([a-z][a-z0-9-]*)\/components$/i;
// Captures (libraryId, pathInsideSnapshot). The "pathInsideSnapshot" portion
// is the path under the preset root (e.g. `components/Button.tsx`,
// `tokens.json`, `i18n.json`) — the snapshot keeps the same shape as the
// authored preset, so source files map 1:1 to project files.
const PRESET_RELATIVE_PATH_PATTERN = /^([a-z][a-z0-9-]*)-preset\/(.+)$/i;
const PRESET_ORIGINAL_PATH_PATTERN = /^([a-z][a-z0-9-]*)-preset\/components\//i;
const LIBRARY_CSS_FILE_PATTERN = /\/?([a-z][a-z0-9-]*)\.css$/i;

function metadataForLibraryId(libraryId: string, sourcePath: string): WorkbenchImportedLibraryMetadata {
  return {
    libraryId,
    librarySourcePath: sourcePath,
    snapshotRoot: `src/libraries/${libraryId}`,
    updatePolicy: 'manual',
    cssImportFileName: `${libraryId}.css`,
  };
}

export function resolveImportedLibraryMetadata(sourcePath: string | undefined): WorkbenchImportedLibraryMetadata | null {
  const source = normalizeLibrarySourcePath(sourcePath);
  const presetMatch = PRESET_SOURCE_PATTERN.exec(source);
  if (presetMatch?.[1]) return metadataForLibraryId(presetMatch[1].toLowerCase(), source);
  const projectLibraryMatch = PROJECT_LIBRARY_SOURCE_PATTERN.exec(source);
  if (projectLibraryMatch?.[1]) return metadataForLibraryId(projectLibraryMatch[1].toLowerCase(), source);
  return null;
}

/**
 * Detect library metadata from a file's *relative path* (typically the
 * `webkitRelativePath` from a folder file-picker). When the user picks a
 * folder that includes the preset directory itself, library context can be
 * inferred from the path prefix even when no explicit sourcePath is provided.
 *
 * Returns the inferred metadata and the file path *inside* the library
 * snapshot (with the `<libraryId>-preset/components/` prefix stripped).
 */
export function inferImportedLibraryFromRelativePath(
  relativePath: string,
): { libraryMetadata: WorkbenchImportedLibraryMetadata; relativeInsideSnapshot: string } | null {
  const normalized = normalizeLibraryPath(relativePath);
  const match = PRESET_RELATIVE_PATH_PATTERN.exec(normalized);
  if (!match) return null;
  const libraryId = match[1].toLowerCase();
  const sourcePath = `${libraryId}-preset/components`;
  const inside = match[2];
  return {
    libraryMetadata: metadataForLibraryId(libraryId, sourcePath),
    relativeInsideSnapshot: inside,
  };
}

export function inferImportedLibraryFromComponentFolderRelativePath(
  relativePath: string,
): WorkbenchImportedLibraryMetadata | null {
  const normalized = normalizeLibraryPath(relativePath);
  const match = /^components\/([a-z][a-z0-9-]*)\.css$/i.exec(normalized);
  if (!match?.[1]) return null;
  const libraryId = match[1].toLowerCase();
  return metadataForLibraryId(libraryId, `${libraryId}-preset/components`);
}

export function getImportedLibraryTokenSourcePath(metadata: WorkbenchImportedLibraryMetadata): string {
  return metadata.librarySourcePath.replace(/\/components$/i, '/tokens.json');
}

export function resolveImportedLibraryProjectPath(
  relativePath: string,
  libraryMetadata: WorkbenchImportedLibraryMetadata | null = null,
): string {
  const normalized = normalizeLibraryPath(relativePath);
  if (libraryMetadata && normalized === 'tokens.json') return `${libraryMetadata.snapshotRoot}/tokens.json`;
  if (libraryMetadata) return `${libraryMetadata.snapshotRoot}/${normalized}`;
  if (normalized.startsWith('src/')) return normalized;
  if (PRESET_RELATIVE_PATH_PATTERN.test(normalized)) return normalized;
  return `src/${normalized}`;
}

export function resolveImportedLibraryOriginPath(sourcePath: string | undefined, relativePath: string): string {
  const normalizedRelativePath = normalizeLibraryPath(relativePath);
  const normalizedSourcePath = normalizeLibraryPath(sourcePath);
  if (!normalizedSourcePath) return normalizedRelativePath;
  const presetMatch = PRESET_SOURCE_PATTERN.exec(normalizedSourcePath);
  if (presetMatch && normalizedRelativePath === 'tokens.json') {
    return `${presetMatch[1]}-preset/tokens.json`;
  }
  if (presetMatch) {
    return `${presetMatch[1]}-preset/${normalizedRelativePath}`;
  }
  if (normalizedSourcePath.endsWith('/components') && normalizedRelativePath.startsWith('components/')) {
    return `${normalizedSourcePath.slice(0, -'components'.length)}${normalizedRelativePath}`;
  }
  return `${normalizedSourcePath.replace(/\/+$/, '')}/${normalizedRelativePath}`;
}

function inferLibraryFromOriginalPath(originalPath: string): { libraryId: string; cssImportFileName: string } | null {
  const match = PRESET_ORIGINAL_PATH_PATTERN.exec(originalPath);
  if (!match) return null;
  const libraryId = match[1].toLowerCase();
  return { libraryId, cssImportFileName: `${libraryId}.css` };
}

export function shouldAddProjectLocalLibraryCssImport(file: WorkbenchLibraryOwnedFile): boolean {
  if (file.componentNames.length === 0) return false;
  if (!file.path.startsWith('src/components/')) return false;
  if (!/\.(tsx|jsx)$/i.test(file.path)) return false;
  if (/\.stories\.(tsx|jsx)$/i.test(file.path)) return false;
  const inferred = inferLibraryFromOriginalPath(file.originalPath);
  if (!inferred) return false;
  const cssName = inferred.cssImportFileName;
  return !file.contents.includes(`import './${cssName}'`) && !file.contents.includes(`import "./${cssName}"`);
}

export function addProjectLocalLibraryCssImport(contents: string, cssImportFileName: string): string {
  const importStatement = `import './${cssImportFileName}';\n`;
  const importMatches = [...contents.matchAll(/^import[\s\S]*?;\n/gm)];
  if (importMatches.length === 0) return `${importStatement}${contents}`;
  const lastImport = importMatches[importMatches.length - 1];
  const insertAt = (lastImport.index ?? 0) + lastImport[0].length;
  return `${contents.slice(0, insertAt)}${importStatement}${contents.slice(insertAt)}`;
}

export function getProjectLocalLibraryCssImportName(file: WorkbenchLibraryOwnedFile): string | null {
  return inferLibraryFromOriginalPath(file.originalPath)?.cssImportFileName ?? null;
}

export function getLibraryCssFileNameById(libraryId: string): string {
  return `${libraryId}.css`;
}

/**
 * If a CSS file's basename matches a library id whose tokens already live in
 * the registry, the workbench's CSS-variable scanner should skip it — those
 * tokens are authoritative through tokens.json, not through CSS scraping.
 */
export function shouldSkipImportedLibraryCssScan(
  sourcePath: string,
  hasMatchingTokenCollection: (libraryId: string) => boolean,
): boolean {
  const normalized = sourcePath.replace(/\\/g, '/');
  const match = LIBRARY_CSS_FILE_PATTERN.exec(normalized);
  if (!match) return false;
  return hasMatchingTokenCollection(match[1].toLowerCase());
}

export function upsertImportedLibraryRegistryMetadata(
  registry: WorkbenchComponentRegistry,
  stagedFiles: Array<{ libraryMetadata: WorkbenchImportedLibraryMetadata | null }>,
): WorkbenchComponentRegistry {
  const libraries = { ...(registry.extensions?.libraries ?? {}) };
  for (const staged of stagedFiles) {
    const metadata = staged.libraryMetadata;
    if (!metadata) continue;
    libraries[metadata.libraryId] = {
      id: metadata.libraryId,
      kind: 'library-snapshot',
      sourcePath: metadata.librarySourcePath,
      snapshotRoot: metadata.snapshotRoot,
      updatePolicy: metadata.updatePolicy,
      mergePolicy: 'overwrite',
      updatedAt: new Date().toISOString(),
    } satisfies WorkbenchLibraryRegistryEntry;
  }
  if (Object.keys(libraries).length === 0) return registry;
  return {
    ...registry,
    extensions: {
      ...(registry.extensions ?? {}),
      libraries,
    },
  };
}

function normalizeLibraryPath(path: string | undefined): string {
  return (path ?? '').trim().replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

function normalizeLibrarySourcePath(path: string | undefined): string {
  return (path ?? '').trim().replace(/\\/g, '/').replace(/\/+$/, '');
}
