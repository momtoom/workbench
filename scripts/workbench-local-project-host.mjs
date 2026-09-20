import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import {
  createWorkbenchProjectFiles,
  createWorkbenchProjectGuideFiles,
  createWorkbenchProjectSampleFiles,
  createWorkbenchProjectSourceFiles,
  WORKBENCH_PROJECT_TEMPLATE_ASTRYX,
  WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE,
  WORKBENCH_PROJECT_TEMPLATE_STANDARD,
  WORKBENCH_PROJECT_TEMPLATE_TAILWIND,
} from './workbench-template.mjs';

export const CONFIG_PATH = '.workbench/workbench.config.json';
export const ASSET_PUBLIC_ROOT = 'public/workbench-assets';
export const DEPENDENCY_INSTALL_STATUS_PATH = '.workbench/dependency-install.json';
// The registry hydration reads a project's whole `src/components` through the
// import-tree endpoint, so these caps must hold a full design-system starter.
export const MAX_IMPORT_TREE_FILES = 4096;
export const MAX_IMPORT_TREE_BYTES = 32 * 1024 * 1024;
export const WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN = /\.(?:css|html?|json|jsx?|tsx?|vue)$/i;
export const BLOCKED_SOURCE_PATH_PARTS = new Set(['.git', '.workbench', 'build', 'dist', 'dist-host', 'node_modules']);
const BLOCKED_GIT_ASSET_PATH_PARTS = new Set(['.git', '.github', '.workbench', 'node_modules']);
const MAX_GIT_ASSET_FILES = 2500;
const GOOGLE_FONTS_METADATA_URLS = [
  'https://fonts.google.com/metadata/fonts',
  'https://fonts.grida.co/webfonts.json',
  'https://gwfh.mranftl.com/api/fonts',
];
const GOOGLE_FONTS_CACHE_TTL_MS = 1000 * 60 * 30;
const FEATURED_GOOGLE_FONT_FAMILIES = [
  'Noto Sans KR',
  'Noto Serif KR',
  'IBM Plex Sans KR',
  'Gowun Dodum',
  'Gowun Batang',
  'Black Han Sans',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans 3',
  'Roboto Serif',
  'Playfair Display',
  'Merriweather',
  'Source Code Pro',
  'Roboto Mono',
];
const execFileAsync = promisify(execFile);
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NODE_COMMAND = process.platform === 'win32' ? 'node.exe' : 'node';
const NPM_INSTALL_TIMEOUT_MS = 1000 * 60 * 5;
// A desktop app launched from Finder, Dock, or Launchpad inherits only
// /usr/bin:/bin:/usr/sbin:/sbin, so a Homebrew or nvm toolchain is invisible to the
// PATH lookup execFile does for a bare command name. Probe the usual install roots,
// then ask a login shell, so the same host code works from a terminal and from the GUI.
const EXECUTABLE_FALLBACK_DIRECTORIES = process.platform === 'win32'
  ? []
  : ['/opt/homebrew/bin', '/usr/local/bin', '/opt/local/bin'];
const EXECUTABLE_LOOKUP_TIMEOUT_MS = 1000 * 5;
const activeDependencyInstalls = new Map();
const executablePathPromises = new Map();
let googleFontsCatalogCache = null;

export async function writeFileAtomic(filePath, contents) {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
  const tempPath = join(directory, `.${basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);

  try {
    await writeFile(tempPath, contents, 'utf8');
    await rename(tempPath, filePath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {
      // Best-effort cleanup; the original file is left untouched.
    }
    throw error;
  }
}

export function createProjectLocation(projectRoot, source = 'dev-server', dependencyInstall = null) {
  const location = {
    kind: 'local',
    rootPath: projectRoot,
    workbenchDir: projectRoot ? join(projectRoot, '.workbench') : null,
    configPath: CONFIG_PATH,
    source,
  };
  if (dependencyInstall) {
    location.dependencyInstall = dependencyInstall;
  }
  return location;
}

export async function validateWorkbenchProjectRoot(rootPath) {
  const requestedRoot = resolve(rootPath);
  const exactValidation = await validateExactWorkbenchProjectRoot(requestedRoot);
  if (exactValidation.ok) return exactValidation;
  if (exactValidation.configFound) {
    return {
      ok: false,
      message: exactValidation.message,
    };
  }

  const nestedRoot = await findSingleNestedWorkbenchProjectRoot(requestedRoot);
  if (nestedRoot) return validateExactWorkbenchProjectRoot(nestedRoot);

  return {
    ok: false,
    message: 'No Workbench project config was found at this root.',
  };
}

async function validateExactWorkbenchProjectRoot(rootPath) {
  const configPath = join(rootPath, CONFIG_PATH);
  let parsedConfig;
  try {
    parsedConfig = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return {
        ok: false,
        message: 'No Workbench project config was found at this root.',
      };
    }

    return {
      configFound: true,
      ok: false,
      message: 'Workbench project config could not be read as valid JSON.',
    };
  }

  const configValidation = validateWorkbenchProjectConfig(parsedConfig);
  if (!configValidation.ok) {
    return {
      ...configValidation,
      configFound: true,
    };
  }

  return {
    ok: true,
    configPath,
    rootPath,
    workbenchDir: join(rootPath, '.workbench'),
  };
}

function validateWorkbenchProjectConfig(value) {
  if (!value || typeof value !== 'object') {
    return {
      ok: false,
      message: 'Workbench project config is not a Workbench V1 project config.',
    };
  }

  const config = value;
  if (config.schemaVersion !== '0.1') {
    return {
      ok: false,
      message: 'Workbench project config has an unsupported schemaVersion.',
    };
  }

  if (typeof config.projectId !== 'string' || config.projectId.trim().length === 0) {
    return {
      ok: false,
      message: 'Workbench project config is missing projectId.',
    };
  }

  if (typeof config.projectName !== 'string' || config.projectName.trim().length === 0) {
    return {
      ok: false,
      message: 'Workbench project config is missing projectName.',
    };
  }

  if (!config.workbench || typeof config.workbench !== 'object') {
    return {
      ok: false,
      message: 'Workbench project config is missing workbench metadata.',
    };
  }

  if (config.workbench.app !== 'workbench-v1' || config.workbench.installMode !== 'local-project') {
    return {
      ok: false,
      message: 'Selected folder is not a Workbench V1 local project.',
    };
  }

  const requiredPaths = ['tokens', 'pages', 'components', 'comments', 'selection', 'workspaceState'];
  if (!config.paths || typeof config.paths !== 'object') {
    return {
      ok: false,
      message: 'Workbench project config is missing registry paths.',
    };
  }

  const missingPath = requiredPaths.find((key) => (
    typeof config.paths[key] !== 'string' || config.paths[key].trim().length === 0
  ));
  if (missingPath) {
    return {
      ok: false,
      message: `Workbench project config is missing paths.${missingPath}.`,
    };
  }

  return { ok: true };
}

function isFileNotFoundError(error) {
  return Boolean(error && typeof error === 'object' && error.code === 'ENOENT');
}

async function findSingleNestedWorkbenchProjectRoot(rootPath) {
  const rootStats = await stat(rootPath).catch(() => null);
  if (!rootStats?.isDirectory()) return null;

  const entries = await readdir(rootPath, { withFileTypes: true }).catch(() => []);
  const childDirectories = entries
    .filter((entry) => entry.isDirectory() && !BLOCKED_SOURCE_PATH_PARTS.has(entry.name))
    .map((entry) => resolve(rootPath, entry.name));

  const sameNameChild = childDirectories.find((childPath) => basename(childPath) === basename(rootPath));
  if (sameNameChild) {
    const validation = await validateExactWorkbenchProjectRoot(sameNameChild);
    if (validation.ok) return sameNameChild;
  }

  const projectChildren = [];
  for (const childPath of childDirectories) {
    const validation = await validateExactWorkbenchProjectRoot(childPath);
    if (validation.ok) projectChildren.push(childPath);
  }

  return projectChildren.length === 1 ? projectChildren[0] : null;
}

export async function scaffoldWorkbenchProjectFolder(parentPath, projectName, templateId) {
  const parentRoot = resolve(parentPath);
  const parentStats = await stat(parentRoot).catch(() => null);
  if (!parentStats?.isDirectory()) {
    throw new Error('Parent folder does not exist.');
  }

  const folderName = normalizeProjectFolderName(projectName);
  if (!folderName) {
    throw new Error('Project name is required.');
  }

  const projectRoot = resolve(parentRoot, folderName);
  const relativeProjectPath = relative(parentRoot, projectRoot);
  if (relativeProjectPath.startsWith('..') || isAbsolute(relativeProjectPath)) {
    throw new Error('Project folder must be created inside the selected folder.');
  }

  try {
    await access(projectRoot);
    throw new Error('Project folder already exists.');
  } catch (error) {
    if (error instanceof Error && error.message === 'Project folder already exists.') throw error;
  }

  await mkdir(projectRoot);
  await initializeWorkbenchProject(projectRoot, projectName.trim(), { templateId });
  const dependencyInstall = createPendingDependencyInstallStatus(templateId);
  await writeDependencyInstallStatus(projectRoot, dependencyInstall);
  return {
    dependencyInstall,
    rootPath: projectRoot,
  };
}

export async function createWorkbenchProjectFolder(parentPath, projectName, templateId) {
  const { rootPath } = await scaffoldWorkbenchProjectFolder(parentPath, projectName, templateId);
  const dependencyInstall = await installWorkbenchProjectDependencies(rootPath, templateId);
  return {
    dependencyInstall,
    rootPath,
  };
}

export async function initializeWorkbenchProject(projectRoot, projectNameOverride, options = {}) {
  const rootStats = await stat(projectRoot).catch(() => null);
  if (!rootStats?.isDirectory()) {
    throw new Error('Project path must be a folder.');
  }

  const workbenchDir = join(projectRoot, '.workbench');
  const createdAt = new Date().toISOString();
  const packageName = await readPackageName(projectRoot);
  const projectName = projectNameOverride?.trim() || packageName || basename(projectRoot);
  const projectId = `wb_${basename(projectRoot).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;

  await mkdir(workbenchDir, { recursive: true });

  const files = createWorkbenchProjectFiles({ projectId, projectName, createdAt, templateId: options.templateId });
  const sourceFiles = createWorkbenchProjectSourceFiles({ projectName, templateId: options.templateId });
  const guideFiles = createWorkbenchProjectGuideFiles({ templateId: options.templateId });
  const sampleFiles = createWorkbenchProjectSampleFiles({ templateId: options.templateId });

  await Promise.all([
    ...files.map(async ([fileName, value]) => {
      const filePath = join(workbenchDir, fileName);
      try {
        await access(filePath);
      } catch {
        await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
      }
    }),
    ...sourceFiles.map(async ([fileName, contents]) => {
      const filePath = join(projectRoot, fileName);
      try {
        await access(filePath);
      } catch {
        await writeFileAtomic(filePath, contents);
      }
    }),
    ...guideFiles.map(async ([fileName, contents]) => {
      const filePath = join(projectRoot, fileName);
      try {
        await access(filePath);
      } catch {
        await writeFileAtomic(filePath, contents);
      }
    }),
    ...sampleFiles.map(async ([fileName, contents]) => {
      const filePath = join(projectRoot, fileName);
      try {
        await access(filePath);
      } catch {
        await writeFileAtomic(filePath, contents);
      }
    }),
  ]);
}

export async function queueWorkbenchProjectDependencyInstall(projectRoot, templateId) {
  const normalizedProjectRoot = resolve(projectRoot);
  const activeInstall = activeDependencyInstalls.get(normalizedProjectRoot);
  if (activeInstall) {
    return {
      completion: activeInstall,
      started: false,
      status: await readWorkbenchProjectDependencyInstallStatus(normalizedProjectRoot)
        ?? createPendingDependencyInstallStatus(templateId),
    };
  }

  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const startedAt = new Date().toISOString();
  const cachePath = join(projectRoot, '.workbench', '.npm-cache');
  const statusBase = {
    schemaVersion: '0.1',
    cachePath: '.workbench/.npm-cache',
    command: 'npm install --no-audit --no-fund --cache .workbench/.npm-cache',
    manager: 'npm',
    startedAt,
    templateId: normalizedTemplateId,
  };
  const pendingStatus = {
    ...statusBase,
    ok: false,
    status: 'installing',
  };
  await writeDependencyInstallStatus(normalizedProjectRoot, pendingStatus);
  const completion = runWorkbenchProjectDependencyInstall(
    normalizedProjectRoot,
    cachePath,
    statusBase,
  );
  activeDependencyInstalls.set(normalizedProjectRoot, completion);
  void completion.then(
    () => {
      if (activeDependencyInstalls.get(normalizedProjectRoot) === completion) {
        activeDependencyInstalls.delete(normalizedProjectRoot);
      }
    },
    () => {
      if (activeDependencyInstalls.get(normalizedProjectRoot) === completion) {
        activeDependencyInstalls.delete(normalizedProjectRoot);
      }
    },
  );

  return {
    completion,
    started: true,
    status: pendingStatus,
  };
}

export async function installWorkbenchProjectDependencies(projectRoot, templateId) {
  const queuedInstall = await queueWorkbenchProjectDependencyInstall(projectRoot, templateId);
  return queuedInstall.completion;
}

async function findExecutableInDirectories(command, directories) {
  for (const directory of directories) {
    if (!directory) continue;
    const candidate = join(directory, command);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Keep probing; an unreadable or missing entry is not an error here.
    }
  }
  return null;
}

async function findExecutablePathFromLoginShell(command) {
  const shell = process.env.SHELL;
  if (process.platform === 'win32' || !shell) return null;
  try {
    const { stdout } = await execFileAsync(shell, ['-lc', `command -v ${command}`], {
      timeout: EXECUTABLE_LOOKUP_TIMEOUT_MS,
    });
    const resolved = stdout.split('\n').map((line) => line.trim()).filter(Boolean).pop();
    if (!resolved || !isAbsolute(resolved)) return null;
    await access(resolved, fsConstants.X_OK);
    return resolved;
  } catch {
    return null;
  }
}

export async function resolveWorkbenchExecutablePath(command) {
  if (!executablePathPromises.has(command)) {
    executablePathPromises.set(command, (async () => {
      const pathDirectories = (process.env.PATH ?? '').split(delimiter);
      return await findExecutableInDirectories(command, [...pathDirectories, ...EXECUTABLE_FALLBACK_DIRECTORIES])
        ?? await findExecutablePathFromLoginShell(command);
    })());
  }

  const resolved = await executablePathPromises.get(command);
  // Never cache a failed lookup: the toolchain may be installed while Workbench stays open.
  if (!resolved) executablePathPromises.delete(command);
  return resolved;
}

export async function resolveWorkbenchNodeCommandPath() {
  return process.env.WORKBENCH_NODE_BINARY || await resolveWorkbenchExecutablePath(NODE_COMMAND);
}

async function resolveNpmCommandPath() {
  return resolveWorkbenchExecutablePath(NPM_COMMAND);
}

async function runWorkbenchProjectDependencyInstall(projectRoot, cachePath, statusBase) {

  if (process.env.WORKBENCH_SKIP_PROJECT_INSTALL === '1') {
    const status = {
      ...statusBase,
      finishedAt: new Date().toISOString(),
      message: 'Skipped because WORKBENCH_SKIP_PROJECT_INSTALL=1.',
      ok: true,
      status: 'skipped',
    };
    await writeDependencyInstallStatus(projectRoot, status);
    return status;
  }

  const npmCommandPath = await resolveNpmCommandPath();
  if (!npmCommandPath) {
    const status = {
      ...statusBase,
      finishedAt: new Date().toISOString(),
      message: 'npm was not found. Install Node.js, then reopen this project.',
      ok: false,
      status: 'failed',
    };
    await writeDependencyInstallStatus(projectRoot, status);
    return status;
  }

  try {
    const installEnvironment = {
      ...process.env,
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      // npm re-invokes node and its own bin shims, so the resolved location has to be
      // on PATH for the child too, not just used as the executable path here.
      PATH: [dirname(npmCommandPath), process.env.PATH ?? ''].filter(Boolean).join(delimiter),
    };
    // The Workbench host pins its own esbuild binary for preview compilation.
    // A generated project may install a different esbuild version, so the host
    // override must never leak into that project's npm lifecycle scripts.
    delete installEnvironment.ESBUILD_BINARY_PATH;

    await execFileAsync(npmCommandPath, ['install', '--no-audit', '--no-fund', '--cache', cachePath], {
      cwd: projectRoot,
      env: installEnvironment,
      maxBuffer: 1024 * 1024 * 8,
      timeout: NPM_INSTALL_TIMEOUT_MS,
    });

    const status = {
      ...statusBase,
      finishedAt: new Date().toISOString(),
      ok: true,
      status: 'installed',
    };
    await writeDependencyInstallStatus(projectRoot, status);
    return status;
  } catch (error) {
    const status = {
      ...statusBase,
      finishedAt: new Date().toISOString(),
      message: getDependencyInstallErrorMessage(error),
      ok: false,
      status: 'failed',
    };
    await writeDependencyInstallStatus(projectRoot, status);
    return status;
  }
}

export async function readWorkbenchProjectDependencyInstallStatus(projectRoot) {
  if (!projectRoot) return null;
  try {
    const value = JSON.parse(await readFile(join(projectRoot, DEPENDENCY_INSTALL_STATUS_PATH), 'utf8'));
    if (
      !value ||
      typeof value !== 'object' ||
      !['installing', 'installed', 'failed', 'skipped'].includes(value.status)
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export async function workbenchProjectDependenciesNeedInstall(projectRoot) {
  if (!projectRoot) return false;

  let packageManifest;
  try {
    packageManifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    return false;
  }

  const directDependencies = {
    ...(packageManifest.dependencies && typeof packageManifest.dependencies === 'object'
      ? packageManifest.dependencies
      : {}),
    ...(packageManifest.devDependencies && typeof packageManifest.devDependencies === 'object'
      ? packageManifest.devDependencies
      : {}),
  };
  const dependencyEntries = Object.entries(directDependencies);
  if (dependencyEntries.length === 0) return false;

  let packageLock;
  try {
    packageLock = JSON.parse(await readFile(join(projectRoot, 'package-lock.json'), 'utf8'));
  } catch {
    const nodeModulesStats = await stat(join(projectRoot, 'node_modules')).catch(() => null);
    return !nodeModulesStats?.isDirectory();
  }

  const lockedRoot = packageLock?.packages?.[''];
  const lockedRootDependencies = {
    ...(lockedRoot?.dependencies && typeof lockedRoot.dependencies === 'object'
      ? lockedRoot.dependencies
      : {}),
    ...(lockedRoot?.devDependencies && typeof lockedRoot.devDependencies === 'object'
      ? lockedRoot.devDependencies
      : {}),
  };

  for (const [dependencyName, requestedVersion] of dependencyEntries) {
    if (lockedRootDependencies[dependencyName] !== requestedVersion) return true;
    const lockedVersion = packageLock?.packages?.[`node_modules/${dependencyName}`]?.version;
    if (typeof lockedVersion !== 'string' || !lockedVersion) return true;

    try {
      const installedManifest = JSON.parse(
        await readFile(join(projectRoot, 'node_modules', dependencyName, 'package.json'), 'utf8'),
      );
      if (installedManifest?.version !== lockedVersion) return true;
    } catch {
      return true;
    }
  }

  return false;
}

export async function readWorkbenchProjectTemplateId(projectRoot) {
  if (!projectRoot) return WORKBENCH_PROJECT_TEMPLATE_STANDARD;
  try {
    const config = JSON.parse(await readFile(join(projectRoot, CONFIG_PATH), 'utf8'));
    return normalizeWorkbenchProjectTemplateId(config?.extensions?.projectTemplate?.id);
  } catch {
    return WORKBENCH_PROJECT_TEMPLATE_STANDARD;
  }
}

function createPendingDependencyInstallStatus(templateId) {
  return {
    schemaVersion: '0.1',
    cachePath: '.workbench/.npm-cache',
    command: 'npm install --no-audit --no-fund --cache .workbench/.npm-cache',
    manager: 'npm',
    ok: false,
    startedAt: new Date().toISOString(),
    status: 'installing',
    templateId: normalizeWorkbenchProjectTemplateId(templateId),
  };
}

async function writeDependencyInstallStatus(projectRoot, status) {
  await writeFileAtomic(join(projectRoot, DEPENDENCY_INSTALL_STATUS_PATH), `${JSON.stringify(status, null, 2)}\n`);
}

function normalizeWorkbenchProjectTemplateId(templateId) {
  return templateId === WORKBENCH_PROJECT_TEMPLATE_TAILWIND
    || templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    || templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
    ? templateId
    : WORKBENCH_PROJECT_TEMPLATE_STANDARD;
}

function getDependencyInstallErrorMessage(error) {
  if (!error || typeof error !== 'object') return 'npm install failed.';
  const stderr = typeof error.stderr === 'string' ? error.stderr.trim() : '';
  const stdout = typeof error.stdout === 'string' ? error.stdout.trim() : '';
  const message = error instanceof Error ? error.message : '';
  const details = stderr || stdout || message || 'npm install failed.';
  return details.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 8).join('\n');
}

export function resolveWorkbenchProjectPath(projectRoot, projectPath) {
  const normalizedPath = projectPath.replace(/^[/\\]+/, '');
  if (!normalizedPath.startsWith('.workbench/') || !normalizedPath.endsWith('.json')) {
    return null;
  }

  const workbenchRoot = resolve(projectRoot, '.workbench');
  const filePath = resolve(projectRoot, normalizedPath);
  const relativePath = relative(workbenchRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return filePath;
}

export function resolveWorkbenchSourcePath(projectRoot, sourcePath) {
  const normalizedPath = sourcePath.replace(/^[/\\]+/, '');
  if (!normalizedPath || normalizedPath.startsWith('.workbench/')) return null;
  if (!WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN.test(normalizedPath)) return null;
  if (hasUnsafeOrBlockedPathPart(normalizedPath)) return null;

  const filePath = resolve(projectRoot, normalizedPath);
  const relativePath = relative(projectRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return filePath;
}

export function resolveWorkbenchSourceDirPath(projectRoot, dirPath) {
  const normalizedPath = dirPath.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
  if (!normalizedPath || normalizedPath.startsWith('.workbench')) return null;
  if (WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN.test(normalizedPath)) return null;
  if (hasUnsafeOrBlockedPathPart(normalizedPath)) return null;

  const filePath = resolve(projectRoot, normalizedPath);
  const relativePath = relative(projectRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return filePath;
}

export function resolveWorkbenchSourcePathOrDir(projectRoot, sourcePath) {
  if (WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN.test(sourcePath)) {
    return resolveWorkbenchSourcePath(projectRoot, sourcePath);
  }
  return resolveWorkbenchSourceDirPath(projectRoot, sourcePath);
}

export async function readWorkbenchImportTree(options) {
  let importRoot;
  try {
    importRoot = await resolveDiskImportRoot(options);
  } catch (error) {
    // A root that does not exist is a result, not a failure: the registry
    // hydration drops a library only on this positive answer, while any
    // other failed read (a cap, a blocked path) proves nothing about it.
    if (error instanceof Error && error.message.startsWith('Import path not found:')) {
      return { ok: false, message: error.message, notFound: true };
    }
    throw error;
  }
  const importRootStats = await stat(importRoot);
  const projectRelativeImportRoot = getProjectRelativeImportPath(options.projectRoot, importRoot);
  const files = [];
  let totalBytes = 0;

  async function addFile(filePath, relativePath) {
    if (!WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN.test(filePath)) return;
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) return;
    totalBytes += fileStats.size;
    if (files.length >= MAX_IMPORT_TREE_FILES) {
      throw new Error(`Import path contains more than ${MAX_IMPORT_TREE_FILES} supported files.`);
    }
    if (totalBytes > MAX_IMPORT_TREE_BYTES) {
      throw new Error('Import path is too large.');
    }
    files.push({
      contents: options.includeContents === false ? '' : await readFile(filePath, 'utf8'),
      name: basename(filePath),
      relativePath: normalizeImportRelativePath(relativePath),
      size: fileStats.size,
    });
  }

  async function walk(directoryPath) {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || BLOCKED_SOURCE_PATH_PARTS.has(entry.name)) continue;
      const entryPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = projectRelativeImportRoot
        ? relative(options.projectRoot, entryPath)
        : join(basename(importRoot), relative(importRoot, entryPath));
      await addFile(entryPath, relativePath);
    }
  }

  if (importRootStats.isFile()) {
    await addFile(importRoot, projectRelativeImportRoot ?? basename(importRoot));
  } else if (importRootStats.isDirectory()) {
    await walk(importRoot);
    if (options.includePresetTokens) {
      const presetTokensPath = await resolvePresetTokensImportPath(options.appRoot, importRoot, options.sourcePath);
      if (presetTokensPath) await addFile(presetTokensPath, 'tokens.json');
    }
  } else {
    throw new Error('Import path must be a file or folder.');
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return {
    ok: true,
    files,
    rootPath: importRoot,
  };
}

function getProjectRelativeImportPath(projectRoot, importRoot) {
  const relativePath = relative(resolve(projectRoot), resolve(importRoot));
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return relativePath;
}

export async function readProjectPublicAsset(projectRoot, pathname) {
  const decoded = decodeURIComponent(pathname.replace(/^\/+/, ''));
  if (decoded.split('/').some((segment) => segment === '..' || segment === '')) return null;
  const publicRoot = resolve(projectRoot, 'public');
  const filePath = resolve(publicRoot, decoded);
  const rel = relative(publicRoot, filePath);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) return null;
    return {
      buffer: await readFile(filePath),
      contentType: getAssetContentType(filePath),
      size: fileStats.size,
    };
  } catch {
    return null;
  }
}

export async function writeWorkbenchAssetFile(projectRoot, action) {
  const parsed = parseDataUrl(action.dataUrl);
  const folderName = action.kind === 'font' ? 'fonts' : action.kind === 'icon' ? 'icons' : action.kind === 'video' ? 'videos' : 'images';
  const collectionName = action.collection?.trim() ? createSafeAssetFolderName(action.collection) : '';
  const safeName = createSafeAssetFileName(action.fileName);
  const relativeFilePath = collectionName
    ? `${ASSET_PUBLIC_ROOT}/${folderName}/${collectionName}/${safeName}`
    : `${ASSET_PUBLIC_ROOT}/${folderName}/${safeName}`;

  await writeProjectAssetBuffer(projectRoot, parsed.buffer, relativeFilePath);

  return {
    ok: true,
    filePath: relativeFilePath,
    publicPath: collectionName
      ? `/workbench-assets/${folderName}/${collectionName}/${safeName}`
      : `/workbench-assets/${folderName}/${safeName}`,
  };
}

export async function deleteWorkbenchAssetPaths(projectRoot, action) {
  const assetRoot = resolve(projectRoot, ASSET_PUBLIC_ROOT);
  const removed = [];
  const parentDirs = new Set();

  for (const inputPath of action.paths) {
    const normalized = inputPath.replace(/^[/\\]+/, '').replace(/^public\//, '');
    if (!normalized.startsWith('workbench-assets/')) continue;
    if (normalized.split(/[\\/]+/).some((part) => part === '..' || part === '')) continue;

    const targetPath = resolve(projectRoot, 'public', normalized);
    const rel = relative(assetRoot, targetPath);
    if (rel.startsWith('..') || isAbsolute(rel) || rel === '') continue;

    try {
      const targetStats = await stat(targetPath);
      if (targetStats.isDirectory()) {
        await rm(targetPath, { force: true, recursive: true });
      } else {
        await unlink(targetPath);
      }
      removed.push(normalized);
      parentDirs.add(dirname(targetPath));
    } catch {
      // Missing files are already gone; continue.
    }
  }

  for (const dir of Array.from(parentDirs)) {
    let current = dir;
    while (current.startsWith(assetRoot) && current !== assetRoot) {
      try {
        const entries = await readdir(current);
        if (entries.length > 0) break;
        await rm(current, { force: true, recursive: false });
      } catch {
        break;
      }
      current = dirname(current);
    }
  }

  return { ok: true, removed };
}

export async function installWorkbenchAssets(projectRoot, action) {
  if (action.source === 'google-fonts') return installGoogleFonts(projectRoot, action);
  return installWorkbenchAssetsFromGit(projectRoot, action);
}

export async function searchGoogleFontsCatalog(query, limit) {
  const normalizedQuery = normalizeGoogleFontSearchText(query);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.round(limit), 1), 96) : 48;
  const catalog = await getGoogleFontsCatalog();
  const matches = normalizedQuery
    ? catalog.fonts
      .filter((font) => doesGoogleFontMatchQuery(font, normalizedQuery))
      .sort((left, right) => compareGoogleFontSearchMatch(left, right, normalizedQuery))
    : getFeaturedGoogleFonts(catalog.fonts);

  return {
    ok: true,
    fonts: matches.slice(0, safeLimit),
    message: catalog.source === 'fallback'
      ? 'Google Fonts metadata could not be reached, so Workbench is showing a small fallback list.'
      : undefined,
    source: catalog.source,
  };
}

async function installWorkbenchAssetsFromGit(projectRoot, action) {
  const rawUrl = action.url.trim();
  const parsed = parseGitAssetUrl(rawUrl);
  if (!parsed || !isAllowedGitAssetUrl(parsed.cloneUrl)) {
    throw new Error('Enter an https, ssh, or git@ repository URL.');
  }
  const { cloneUrl, branch, subPath } = parsed;

  const tempRoot = await mkdtemp(join(tmpdir(), 'workbench-assets-'));
  const repoPath = join(tempRoot, 'repo');
  try {
    if (subPath) {
      const cloneArgs = [
        'clone',
        '--depth', '1',
        '--filter=blob:none',
        '--sparse',
        '--no-checkout',
      ];
      if (branch) cloneArgs.push('--branch', branch);
      cloneArgs.push(cloneUrl, repoPath);
      await execFileAsync('git', cloneArgs, {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
      await execFileAsync('git', ['-C', repoPath, 'sparse-checkout', 'init', '--cone'], {
        timeout: 60000,
      });
      await execFileAsync('git', ['-C', repoPath, 'sparse-checkout', 'set', subPath], {
        timeout: 60000,
      });
      await execFileAsync('git', ['-C', repoPath, 'checkout'], {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
    } else {
      const cloneArgs = ['clone', '--depth', '1'];
      if (branch) cloneArgs.push('--branch', branch);
      cloneArgs.push(cloneUrl, repoPath);
      await execFileAsync('git', cloneArgs, {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
    }

    let scanRoot = repoPath;
    if (subPath) {
      const candidate = resolve(repoPath, subPath);
      const rel = relative(repoPath, candidate);
      if (rel.startsWith('..') || isAbsolute(rel)) {
        throw new Error('Sub-path is outside the cloned repository.');
      }
      try {
        const candidateStats = await stat(candidate);
        if (!candidateStats.isDirectory()) {
          throw new Error('Sub-path is not a directory in the repository.');
        }
        scanRoot = candidate;
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Sub-path')) throw error;
        throw new Error(`Sub-path '${subPath}' not found in repository.`);
      }
    }

    const files = await collectGitAssetFiles(scanRoot, action.kind);
    if (files.length === 0) {
      throw new Error(action.kind === 'icon'
        ? 'No SVG files were found in this repository.'
        : 'No font files were found in this repository.');
    }

    const installed = action.kind === 'icon'
      ? [await installGitIconSet(projectRoot, scanRoot, cloneUrl, action.name, files)]
      : await installGitFonts(projectRoot, scanRoot, cloneUrl, action.name, files);

    return {
      ok: true,
      assets: installed,
    };
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function installGoogleFonts(projectRoot, action) {
  const googleFamilyName = action.family.trim().replace(/\s+/g, ' ');
  const familyName = action.name?.trim() || googleFamilyName;
  const weights = normalizeGoogleFontWeights(action.weights);
  const cssUrl = createGoogleFontsCssUrl(googleFamilyName, weights);
  const cssResponse = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Workbench-V1',
    },
  });

  if (!cssResponse.ok) {
    throw new Error(`Google Fonts returned ${cssResponse.status} for ${googleFamilyName}.`);
  }

  const css = await cssResponse.text();
  const faces = parseGoogleFontFaces(css);
  if (faces.length === 0) {
    throw new Error(`No font files were found for ${googleFamilyName}.`);
  }

  const now = new Date().toISOString();
  const familySlug = createSlug(familyName) || `google-font-${Date.now().toString(36)}`;
  const destinationRoot = `${ASSET_PUBLIC_ROOT}/fonts/${familySlug}-${Date.now().toString(36)}`;
  const fontFaces = [];
  let totalSize = 0;
  let firstSourceValue = null;
  let firstFileName = null;

  for (let index = 0; index < faces.length; index += 1) {
    const face = faces[index];
    const fontResponse = await fetch(face.url);
    if (!fontResponse.ok) {
      throw new Error(`Google Fonts file download failed for ${googleFamilyName}.`);
    }

    const buffer = Buffer.from(await fontResponse.arrayBuffer());
    const extension = getFontExtensionFromUrl(face.url);
    const safeFileName = createSafeAssetFileName(`${familySlug}-${face.weight || 'regular'}-${face.style || 'normal'}-${index}${extension}`);
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await writeProjectAssetBuffer(projectRoot, buffer, relativeFilePath);
    const sourceValue = `/${relativeFilePath.replace(/^public\//, '')}`;
    firstSourceValue ??= sourceValue;
    firstFileName ??= safeFileName;
    totalSize += buffer.byteLength;

    fontFaces.push({
      filePath: relativeFilePath,
      fontStyle: face.style,
      fontWeight: face.weight,
      mimeType: getFontMimeType(safeFileName),
      source: sourceValue,
      unicodeRange: face.unicodeRange,
    });
  }

  const asset = {
    id: createAssetId(familyName, now),
    name: familyName,
    kind: 'font',
    source: {
      type: 'project-file',
      value: firstSourceValue ?? '',
      filePath: `${destinationRoot}/${firstFileName ?? `${familySlug}.woff2`}`,
    },
    fileName: `${familySlug}.google-font`,
    mimeType: 'font/collection',
    size: totalSize,
    tags: ['font', 'google-fonts'],
    createdAt: now,
    updatedAt: now,
    extensions: {
      fontFaces,
      fontFamily: familyName,
      sourceGoogleCssUrl: cssUrl,
      sourceGoogleFontFamily: googleFamilyName,
    },
  };

  return {
    ok: true,
    assets: [asset],
  };
}

async function getGoogleFontsCatalog() {
  const now = Date.now();
  if (googleFontsCatalogCache && googleFontsCatalogCache.expiresAt > now) {
    return {
      fonts: googleFontsCatalogCache.fonts,
      source: googleFontsCatalogCache.source,
    };
  }

  try {
    for (const url of GOOGLE_FONTS_METADATA_URLS) {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 Workbench-V1',
        },
      });
      if (!response.ok) continue;
      const fonts = parseGoogleFontsMetadata(await response.text());
      if (fonts.length === 0) continue;
      googleFontsCatalogCache = {
        expiresAt: now + GOOGLE_FONTS_CACHE_TTL_MS,
        fonts,
        source: 'google-fonts',
      };
      return { fonts, source: 'google-fonts' };
    }
    throw new Error('Google Fonts metadata contained no fonts.');
  } catch {
    const fonts = getFallbackGoogleFontsCatalog();
    googleFontsCatalogCache = {
      expiresAt: now + 1000 * 60 * 5,
      fonts,
      source: 'fallback',
    };
    return { fonts, source: 'fallback' };
  }
}

function parseGoogleFontsMetadata(contents) {
  const parsed = JSON.parse(contents.replace(/^\)\]\}'\s*/, '').trim());
  if (!isObjectRecord(parsed)) return [];

  const developerApiItems = parsed.items;
  if (Array.isArray(developerApiItems)) {
    return developerApiItems.flatMap((item) => normalizeDeveloperApiGoogleFontItem(item));
  }

  const metadataItems = parsed.familyMetadataList;
  if (Array.isArray(metadataItems)) {
    return metadataItems.flatMap((item) => normalizeMetadataGoogleFontItem(item));
  }

  return [];
}

function normalizeDeveloperApiGoogleFontItem(item) {
  if (!isObjectRecord(item) || typeof item.family !== 'string' || !item.family.trim()) return [];
  const variants = getStringArray(item.variants);
  return [normalizeGoogleFontCatalogItem({
    category: typeof item.category === 'string' ? item.category : undefined,
    family: item.family,
    subsets: getStringArray(item.subsets),
    variants,
    weights: getGoogleFontWeightsFromVariants(variants),
  })];
}

function normalizeMetadataGoogleFontItem(item) {
  if (!isObjectRecord(item) || typeof item.family !== 'string' || !item.family.trim()) return [];
  const fontKeys = isObjectRecord(item.fonts) ? Object.keys(item.fonts) : [];
  const variants = fontKeys.map(formatGoogleFontVariantKey);
  return [normalizeGoogleFontCatalogItem({
    category: typeof item.category === 'string' ? item.category : undefined,
    family: item.family,
    subsets: getStringArray(item.subsets),
    variants,
    weights: getGoogleFontWeightsFromVariants(variants.length > 0 ? variants : fontKeys),
  })];
}

function normalizeGoogleFontCatalogItem(item) {
  const variants = item.variants.length > 0 ? item.variants : ['regular'];
  const weights = item.weights.length > 0 ? item.weights : getGoogleFontWeightsFromVariants(variants);
  return {
    category: item.category,
    family: item.family.trim(),
    subsets: uniqueStrings(item.subsets).sort((left, right) => left.localeCompare(right)),
    variants: uniqueStrings(variants),
    weights: uniqueStrings(weights.length > 0 ? weights : ['400']).sort((left, right) => Number(left) - Number(right)),
  };
}

function getFallbackGoogleFontsCatalog() {
  return getFallbackGoogleFontTuples().map(([family, category, subsets, variants]) => normalizeGoogleFontCatalogItem({
    category,
    family,
    subsets,
    variants,
    weights: getGoogleFontWeightsFromVariants(variants),
  }));
}

function getFeaturedGoogleFonts(fonts) {
  const byFamily = new Map(fonts.map((font) => [normalizeGoogleFontSearchText(font.family), font]));
  const selected = [];
  const selectedKeys = new Set();

  for (const family of FEATURED_GOOGLE_FONT_FAMILIES) {
    const key = normalizeGoogleFontSearchText(family);
    const font = byFamily.get(key) ?? getFallbackGoogleFontsCatalog().find((candidate) => normalizeGoogleFontSearchText(candidate.family) === key);
    if (!font || selectedKeys.has(key)) continue;
    selected.push(font);
    selectedKeys.add(key);
  }

  if (selected.length > 0) return selected;
  return getFallbackGoogleFontsCatalog();
}

function getFallbackGoogleFontTuples() {
  return [
    ['Noto Sans KR', 'sans-serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['Noto Serif KR', 'serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['IBM Plex Sans KR', 'sans-serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['Black Han Sans', 'sans-serif', ['korean', 'latin'], ['regular']],
    ['Gowun Dodum', 'sans-serif', ['korean', 'latin'], ['regular']],
    ['Gowun Batang', 'serif', ['korean', 'latin'], ['regular', '700']],
    ['Inter', 'sans-serif', ['latin'], ['regular', '500', '600', '700']],
    ['Roboto', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Roboto Serif', 'serif', ['latin'], ['regular', '500', '700']],
    ['Open Sans', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Lato', 'sans-serif', ['latin'], ['regular', '700']],
    ['Montserrat', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Poppins', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Source Sans 3', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Playfair Display', 'serif', ['latin'], ['regular', '700']],
    ['Merriweather', 'serif', ['latin'], ['regular', '700']],
    ['Source Code Pro', 'monospace', ['latin'], ['regular', '500', '700']],
    ['Roboto Mono', 'monospace', ['latin'], ['regular', '500', '700']],
  ];
}

function doesGoogleFontMatchQuery(font, normalizedQuery) {
  return [
    font.family,
    font.category ?? '',
    ...font.subsets,
  ].some((value) => normalizeGoogleFontSearchText(value).includes(normalizedQuery));
}

function compareGoogleFontSearchMatch(left, right, normalizedQuery) {
  const leftFamily = normalizeGoogleFontSearchText(left.family);
  const rightFamily = normalizeGoogleFontSearchText(right.family);
  const leftScore = leftFamily === normalizedQuery ? 0 : leftFamily.startsWith(normalizedQuery) ? 1 : 2;
  const rightScore = rightFamily === normalizedQuery ? 0 : rightFamily.startsWith(normalizedQuery) ? 1 : 2;
  return leftScore - rightScore || left.family.localeCompare(right.family);
}

function normalizeGoogleFontSearchText(value) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function formatGoogleFontVariantKey(value) {
  const trimmed = value.trim();
  if (trimmed === '400') return 'regular';
  if (/^400(?:italic|i)$/i.test(trimmed)) return 'italic';
  return trimmed.replace(/i$/i, 'italic');
}

function getGoogleFontWeightsFromVariants(variants) {
  const weights = variants.flatMap((variant) => {
    if (variant === 'regular' || variant === 'italic') return ['400'];
    const match = variant.match(/[1-9]00/);
    return match ? [match[0]] : [];
  });
  return uniqueStrings(weights.length > 0 ? weights : ['400']);
}

function getStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim().length > 0) : [];
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function collectGitAssetFiles(root, kind) {
  const files = [];
  const extensionPattern = kind === 'icon'
    ? /\.svg$/i
    : /\.(?:woff2?|ttf|otf)$/i;

  async function visit(directory) {
    if (files.length >= MAX_GIT_ASSET_FILES) return;
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= MAX_GIT_ASSET_FILES) break;
      if (entry.name.startsWith('.') || BLOCKED_GIT_ASSET_PATH_PARTS.has(entry.name)) continue;
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile() || !extensionPattern.test(entry.name)) continue;
      const entryStats = await stat(entryPath);
      files.push({
        relativePath: relative(root, entryPath).replace(/\\/g, '/'),
        size: entryStats.size,
      });
    }
  }

  await visit(root);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function installGitIconSet(projectRoot, repoPath, gitUrl, name, files) {
  const now = new Date().toISOString();
  const setName = name?.trim() || inferGitRepoName(gitUrl) || 'Git icon set';
  const setSlug = createSlug(setName) || `icon-set-${Date.now().toString(36)}`;
  const destinationRoot = `${ASSET_PUBLIC_ROOT}/icons/${setSlug}-${Date.now().toString(36)}`;
  const previewIcons = [];

  for (const file of files) {
    const sourcePath = join(repoPath, file.relativePath);
    const iconName = formatAssetLabel(basename(file.relativePath).replace(/\.[^.]+$/, ''));
    const iconStyle = inferGitIconStyle(file.relativePath);
    const iconVariant = inferGitIconVariant(file.relativePath);
    const sourceSlug = createSlug(file.relativePath.replace(/\.[^.]+$/, '')) || createSlug(iconName) || 'icon';
    const sourceExtension = basename(file.relativePath).match(/\.[^.]+$/)?.[0] ?? '.svg';
    const safeFileName = createSafeAssetFileName(`${sourceSlug}${sourceExtension}`);
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await writeProjectAssetCopy(projectRoot, sourcePath, relativeFilePath);
    previewIcons.push({
      importName: toPascalIdentifier(iconVariant ? `${iconName} ${iconVariant}` : iconName),
      name: iconName,
      sourceFile: file.relativePath,
      style: iconStyle,
      value: `/${relativeFilePath.replace(/^public\//, '')}`,
    });
  }
  previewIcons.sort((left, right) => (
    getGitIconStyleSortOrder(left.style) - getGitIconStyleSortOrder(right.style) ||
    left.name.localeCompare(right.name) ||
    left.sourceFile.localeCompare(right.sourceFile)
  ));

  const firstIcon = previewIcons[0];
  return {
    id: createAssetId(setName, now),
    name: setName,
    kind: 'icon',
    source: {
      type: 'project-file',
      value: firstIcon.value,
      filePath: `${destinationRoot}/${basename(firstIcon.value)}`,
    },
    fileName: `${setSlug}.svg-set`,
    mimeType: 'image/svg+xml',
    size: files.reduce((total, file) => total + file.size, 0),
    tags: ['icon', 'git', 'icon-set'],
    createdAt: now,
    updatedAt: now,
    extensions: {
      sourceGitUrl: gitUrl,
      previewIcons,
    },
  };
}

async function installGitFonts(projectRoot, repoPath, gitUrl, name, files) {
  const now = new Date().toISOString();
  const familyName = name?.trim() || inferGitRepoName(gitUrl) || 'Git font';
  const familySlug = createSlug(familyName) || `font-${Date.now().toString(36)}`;
  const destinationRoot = `${ASSET_PUBLIC_ROOT}/fonts/${familySlug}-${Date.now().toString(36)}`;

  return Promise.all(files.map(async (file) => {
    const sourcePath = join(repoPath, file.relativePath);
    const fileLabel = formatAssetLabel(basename(file.relativePath).replace(/\.[^.]+$/, ''));
    const assetName = files.length === 1 ? familyName : `${familyName} ${fileLabel}`;
    const safeFileName = createSafeAssetFileName(basename(file.relativePath));
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await writeProjectAssetCopy(projectRoot, sourcePath, relativeFilePath);
    return {
      id: createAssetId(assetName, now),
      name: assetName,
      kind: 'font',
      source: {
        type: 'project-file',
        value: `/${relativeFilePath.replace(/^public\//, '')}`,
        filePath: relativeFilePath,
      },
      fileName: basename(file.relativePath),
      mimeType: getFontMimeType(file.relativePath),
      size: file.size,
      tags: ['font', 'git'],
      createdAt: now,
      updatedAt: now,
      extensions: {
        fontFamily: familyName,
        sourceGitUrl: gitUrl,
        sourceFile: file.relativePath,
      },
    };
  }));
}

export async function writeProjectAssetCopy(projectRoot, sourcePath, relativeFilePath) {
  await writeProjectAssetBuffer(projectRoot, await readFile(sourcePath), relativeFilePath);
}

export async function writeProjectAssetBuffer(projectRoot, buffer, relativeFilePath) {
  const filePath = resolve(projectRoot, relativeFilePath);
  const assetRoot = resolve(projectRoot, ASSET_PUBLIC_ROOT);
  const relativeAssetPath = relative(assetRoot, filePath);
  if (relativeAssetPath.startsWith('..') || isAbsolute(relativeAssetPath)) {
    throw new Error('Invalid asset file path');
  }
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export function getAssetContentType(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.ogv') || lower.endsWith('.ogg')) return 'video/ogg';
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.woff')) return 'font/woff';
  if (lower.endsWith('.ttf')) return 'font/ttf';
  if (lower.endsWith('.otf')) return 'font/otf';
  return 'application/octet-stream';
}

export function createSafeAssetFileName(fileName) {
  const trimmed = basename(fileName.trim()).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const compact = trimmed.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const fallback = compact || `asset-${Date.now()}`;
  const dotIndex = fallback.lastIndexOf('.');
  const name = dotIndex > 0 ? fallback.slice(0, dotIndex) : fallback;
  const extension = dotIndex > 0 ? fallback.slice(dotIndex) : '';
  return `${name.slice(0, 72)}-${Date.now().toString(36)}${extension.slice(0, 16)}`;
}

export function createSafeAssetFolderName(name) {
  const trimmed = basename(name.trim()).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const compact = trimmed.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const fallback = compact || 'collection';
  return fallback.slice(0, 72);
}

function normalizeProjectFolderName(projectName) {
  return projectName
    .trim()
    .replace(/[/:\\]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

async function readPackageName(projectRoot) {
  try {
    const packageJson = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
    return typeof packageJson.name === 'string' ? packageJson.name : null;
  } catch {
    return null;
  }
}

async function resolveDiskImportRoot(options) {
  const trimmedSourcePath = options.sourcePath.trim();
  if (!trimmedSourcePath) throw new Error('Import path is required.');
  const normalizedSourcePath = trimmedSourcePath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (!options.allowAppRootImports) {
    if (hasUnsafeOrBlockedPathPart(normalizedSourcePath)) {
      throw new Error('Import path cannot be inside a blocked folder.');
    }
    const candidate = resolve(options.projectRoot, normalizedSourcePath);
    const relativePath = relative(options.projectRoot, candidate);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error('Import path must be inside the active Workbench project.');
    }
    await access(candidate);
    return candidate;
  }

  const candidates = isAbsolute(trimmedSourcePath)
    ? [resolve(trimmedSourcePath)]
    : /^[a-z][a-z0-9-]*-preset\//i.test(normalizedSourcePath)
      ? [
          resolve(options.appRoot, trimmedSourcePath),
          resolve(options.projectRoot, trimmedSourcePath),
        ]
      : normalizedSourcePath.startsWith('src/')
        ? [resolve(options.projectRoot, trimmedSourcePath)]
        : [
            resolve(options.projectRoot, trimmedSourcePath),
            resolve(options.appRoot, trimmedSourcePath),
          ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      if (candidate.split(/[\\/]+/).some((part) => BLOCKED_SOURCE_PATH_PARTS.has(part))) {
        throw new Error('Import path cannot be inside a blocked folder.');
      }
      return candidate;
    } catch (error) {
      if (error instanceof Error && error.message === 'Import path cannot be inside a blocked folder.') throw error;
    }
  }

  throw new Error(`Import path not found: ${options.sourcePath}`);
}

async function resolvePresetTokensImportPath(appRoot, importRoot, sourcePath) {
  if (!appRoot) return null;
  const normalizedSourcePath = sourcePath.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const match = /^([a-z][a-z0-9-]*)-preset\/components$/i.exec(normalizedSourcePath);
  if (!match?.[1]) return null;
  const expectedImportRoot = resolve(appRoot, `${match[1]}-preset/components`);
  if (importRoot !== expectedImportRoot) return null;
  const tokensPath = resolve(appRoot, `${match[1]}-preset/tokens.json`);
  try {
    const tokenStats = await stat(tokensPath);
    return tokenStats.isFile() ? tokensPath : null;
  } catch {
    return null;
  }
}

function normalizeImportRelativePath(value) {
  return value.split(/[\\/]+/g).filter(Boolean).join('/');
}

function hasUnsafeOrBlockedPathPart(pathname) {
  return pathname.split(/[\\/]+/).some((part) => !part || part === '.' || part === '..' || BLOCKED_SOURCE_PATH_PARTS.has(part));
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL');
  const mimeType = match[1] ?? 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const data = match[3] ?? '';
  return {
    buffer: isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data), 'utf8'),
    mimeType,
  };
}

function parseGitAssetUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^git@[\w.-]+:[\w./-]+(?:\.git)?$/i.test(trimmed) || trimmed.startsWith('ssh://')) {
    return { cloneUrl: trimmed, branch: null, subPath: null };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length < 2) return null;
  const owner = segments[0];
  const repoPart = segments[1].replace(/\.git$/i, '');

  if (segments.length === 2) {
    return { cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`, branch: null, subPath: null };
  }

  const navKind = segments[2];
  if (navKind === 'tree' || navKind === 'blob') {
    if (segments.length < 4) return null;
    const branch = decodeURIComponent(segments[3]);
    const subPath = segments.slice(4).map((part) => decodeURIComponent(part)).join('/') || null;
    return {
      cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`,
      branch,
      subPath,
    };
  }

  return { cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`, branch: null, subPath: null };
}

function isAllowedGitAssetUrl(url) {
  if (/^git@[\w.-]+:[\w./-]+(?:\.git)?$/i.test(url)) return true;
  if (/^ssh:\/\/[\w.@:/-]+(?:\.git)?$/i.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferGitRepoName(url) {
  const normalized = url.replace(/\.git$/i, '').replace(/\/+$/, '');
  const name = normalized.split(/[/:]/).filter(Boolean).pop();
  return name ? formatAssetLabel(name) : null;
}

function createAssetId(name, now) {
  return `asset-${createSlug(name) || 'asset'}-${Date.parse(now).toString(36)}-${randomUUID().slice(0, 8)}`;
}

function createSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function formatAssetLabel(value) {
  const source = value
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() ?? 'Asset';
  return source
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Asset';
}

function toPascalIdentifier(value) {
  const identifier = value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
  return /^[A-Za-z]/.test(identifier) ? identifier : `Icon${identifier || 'Asset'}`;
}

function inferGitIconStyle(relativePath) {
  const segments = getGitIconSourceFolderSegments(relativePath);
  const styleKey = segments.find((segment) => ICON_STYLE_SEGMENTS.has(segment));
  return styleKey ? formatAssetLabel(styleKey) : undefined;
}

function inferGitIconVariant(relativePath) {
  const segments = getGitIconSourceFolderSegments(relativePath);
  const sizeSegment = segments.find((segment) => /^\d+(?:px)?$/.test(segment));
  const styleSegment = segments.find((segment) => ICON_STYLE_SEGMENTS.has(segment));
  return [sizeSegment, styleSegment].filter(Boolean).map((segment) => formatAssetLabel(segment)).join(' ') || undefined;
}

function getGitIconSourceFolderSegments(relativePath) {
  return relativePath
    .split(/[\\/]/)
    .slice(0, -1)
    .map((segment) => createSlug(segment.replace(/\.[^.]+$/, '')))
    .filter(Boolean);
}

function getGitIconStyleSortOrder(style) {
  const key = createSlug(style ?? '');
  if (key === 'outline' || key === 'line' || key === 'regular') return 0;
  if (key === 'mini' || key === 'micro') return 1;
  if (key === 'solid' || key === 'fill' || key === 'filled') return 2;
  if (key === 'duotone' || key === 'two-tone' || key === 'twotone') return 3;
  return style ? 4 : 5;
}

const ICON_STYLE_SEGMENTS = new Set([
  'bold',
  'duotone',
  'fill',
  'filled',
  'line',
  'micro',
  'mini',
  'outline',
  'regular',
  'sharp',
  'solid',
  'thin',
  'two-tone',
  'twotone',
]);

function createGoogleFontsCssUrl(family, weights) {
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', weights.length > 0 ? `${family}:wght@${weights.join(';')}` : family);
  url.searchParams.set('display', 'swap');
  return url.toString();
}

function normalizeGoogleFontWeights(weights) {
  const normalized = (weights && weights.length > 0 ? weights : ['400', '500', '600', '700'])
    .map((weight) => weight.trim())
    .filter((weight) => /^[1-9]00$/.test(weight));
  return Array.from(new Set(normalized)).sort((left, right) => Number(left) - Number(right));
}

function parseGoogleFontFaces(css) {
  const faces = [];
  const matcher = /@font-face\s*\{([\s\S]*?)\}/gi;
  let match;
  while ((match = matcher.exec(css))) {
    const body = match[1] ?? '';
    const url = readCssUrlDeclaration(body, 'src');
    if (!url) continue;
    faces.push({
      style: readCssDeclaration(body, 'font-style') ?? 'normal',
      unicodeRange: readCssDeclaration(body, 'unicode-range'),
      url,
      weight: readCssDeclaration(body, 'font-weight') ?? '400',
    });
  }
  return faces;
}

function readCssDeclaration(body, property) {
  const matcher = new RegExp(`${property}\\s*:\\s*([^;]+);`, 'i');
  const match = matcher.exec(body);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null;
}

function readCssUrlDeclaration(body, property) {
  const value = readCssDeclaration(body, property);
  const match = value ? /url\((['"]?)([^'")]+)\1\)/i.exec(value) : null;
  return match?.[2] ?? null;
}

function getFontExtensionFromUrl(value) {
  try {
    const extension = new URL(value).pathname.match(/\.(woff2?|ttf|otf)$/i)?.[0];
    return extension ?? '.woff2';
  } catch {
    return '.woff2';
  }
}

function getFontMimeType(filePath) {
  if (/\.woff2$/i.test(filePath)) return 'font/woff2';
  if (/\.woff$/i.test(filePath)) return 'font/woff';
  if (/\.ttf$/i.test(filePath)) return 'font/ttf';
  if (/\.otf$/i.test(filePath)) return 'font/otf';
  return 'font/*';
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null;
}
