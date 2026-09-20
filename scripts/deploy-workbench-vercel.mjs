import { cp, mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');

const rootFiles = [
  '.vercelignore',
  'index.html',
  'package-lock.json',
  'package.json',
  'page-preview.html',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'THIRD_PARTY_NODE_MODULE_NOTICES.md',
  'THIRD_PARTY_NOTICES.md',
  'THIRD_PARTY_RUNTIME_NOTICES.md',
  'vercel.json',
  'vite.config.d.ts',
  'vite.config.js',
  'vite.config.ts',
];

const rootDirs = [
  'api',
  'electron',
  'public',
  'renderer',
  'scripts',
  'server',
  'src',
];

const requiredStagedBuildFiles = [
  'host/local-bridge/previewCssFreshness.ts',
  'host/local-bridge/server.ts',
  'host/local-preview/server.ts',
  'scripts/workbench-local-project-host.d.mts',
  'THIRD_PARTY_NODE_MODULE_NOTICES.md',
  'THIRD_PARTY_NOTICES.md',
  'THIRD_PARTY_RUNTIME_NOTICES.md',
];

const excludedRootNames = new Set([
  '.claude',
  '.git',
  'dist',
  'dist-host',
  'node_modules',
  'projects',
  'release',
]);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const preview = args.includes('--preview');
const keepCache = args.includes('--with-cache');
const noForce = args.includes('--no-force');
const noLogs = args.includes('--no-logs');
const passthroughIndex = args.indexOf('--');
const passthroughArgs = passthroughIndex >= 0 ? args.slice(passthroughIndex + 1) : [];

const stagingDir = await mkdtemp(join(tmpdir(), 'workbench-v1-vercel-src.'));

await copyFiles(stagingDir);
await writeStagingVercelIgnore(stagingDir);
await assertExcludedRoots(stagingDir);
await assertRequiredBuildInputs(stagingDir);

console.log(`Staged Workbench Vercel source at ${stagingDir}`);
printSize(stagingDir);

if (dryRun) {
  console.log('Dry run complete; no Vercel deploy was started.');
  process.exit(0);
}

const deployArgs = ['vercel', 'deploy', stagingDir, '--yes'];
if (!preview) deployArgs.push('--prod');
if (!noForce) deployArgs.push('--force');
if (!noLogs) deployArgs.push('--logs');
if (keepCache) deployArgs.push('--with-cache');
deployArgs.push(...passthroughArgs);

const deploy = spawnSync('npx', deployArgs, {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
});

process.exit(deploy.status ?? 1);

async function copyFiles(targetRoot) {
  await mkdir(join(targetRoot, '.vercel'), { recursive: true });
  await cp(join(repoRoot, '.vercel', 'project.json'), join(targetRoot, '.vercel', 'project.json'));

  for (const file of rootFiles) {
    await cp(join(repoRoot, file), join(targetRoot, file));
  }

  for (const dir of rootDirs) {
    await cp(join(repoRoot, dir), join(targetRoot, dir), {
      recursive: true,
      filter: (source) => !excludedRootNames.has(basename(source)),
    });
  }
}

async function writeStagingVercelIgnore(targetRoot) {
  await writeFile(
    join(targetRoot, '.vercelignore'),
    [
      '.vercel/',
      'node_modules/',
      'dist/',
      'dist-host/',
      'projects/',
      'release/',
      '.git/',
      '.claude/',
      '*.log',
      '*.tsbuildinfo',
      '*.dmg',
      '*.blockmap',
      '*.zip',
      '',
    ].join('\n'),
  );
}

async function assertExcludedRoots(targetRoot) {
  for (const rootName of excludedRootNames) {
    try {
      await stat(join(targetRoot, rootName));
    } catch {
      continue;
    }
    throw new Error(`Staging directory unexpectedly contains ${rootName}`);
  }
}

async function assertRequiredBuildInputs(targetRoot) {
  for (const filePath of requiredStagedBuildFiles) {
    try {
      const fileStat = await stat(join(targetRoot, filePath));
      if (fileStat.isFile()) continue;
    } catch {
      // Fall through to the actionable staging error below.
    }
    throw new Error(`Staging directory is missing required Vercel build input ${filePath}`);
  }
}

function printSize(path) {
  const result = spawnSync('du', ['-sh', path], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}
