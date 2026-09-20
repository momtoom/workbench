import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

const runtimeScanRoots = [
  'electron',
  'src',
  'scripts',
];

const runtimeScanFiles = [
  'package.json',
  'vite.config.ts',
];

const skippedPathParts = new Set([
  'node_modules',
  'projects',
  'release',
  'workbench-starter',
]);

const scannedExtensions = new Set([
  '.cjs',
  '.css',
  '.js',
  '.json',
  '.mjs',
  '.ts',
  '.tsx',
]);

const forbiddenRuntimePatterns = [
  {
    message: 'personal macOS home paths must not be embedded in runtime code',
    pattern: /\/Users\/tom\b|\/Users\/[^/\s"'`]+\/Desktop\/WB-PJ\b/,
  },
  {
    message: 'Windows home paths must not be embedded in runtime code',
    pattern: /[A-Z]:\\Users\\/i,
  },
  {
    message: 'ad hoc external test project names must not be embedded in runtime code',
    pattern: /\btest-electron-shad-\d+\b/i,
  },
  {
    message: 'absolute Vite @fs user paths must not be embedded in runtime code',
    pattern: /@fs\/Users\//,
  },
];

const files = [];
for (const root of runtimeScanRoots) {
  await collectFiles(join(repoRoot, root), files);
}
for (const file of runtimeScanFiles) {
  files.push(join(repoRoot, file));
}

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  const displayPath = relative(repoRoot, file);
  for (const { message, pattern } of forbiddenRuntimePatterns) {
    if (pattern.test(contents)) {
      fail(`${displayPath}: ${message}`);
    }
  }
}

const sharedAgentGuide = await read('docs/WORKBENCH-V1-AGENT-GUIDE.md');
assert(
  sharedAgentGuide.includes('Treat these docs as working references, not a one-time startup ritual') &&
    sharedAgentGuide.includes('Re-check the guide again before handoff') &&
    sharedAgentGuide.includes('Keep the relevant guide in the loop while implementing'),
  'Shared Workbench agent guide must require agents to keep docs in the loop, not only read them at startup',
);
assert(
  sharedAgentGuide.includes('## Provided Artifact Handling') &&
    sharedAgentGuide.includes('exact conversion') &&
    sharedAgentGuide.includes('not an immutable DOM tree') &&
    sharedAgentGuide.includes('Keep requested page boundaries') &&
    sharedAgentGuide.includes('Compare against the reference'),
  'Shared Workbench agent guide must preserve requested fidelity without imposing a manifest ceremony',
);
const workflowSkill = await read('.agents/skills/workbench-v1-agent-workflow/SKILL.md');
const componentAuthoringSkill = await read('.agents/skills/workbench-component-authoring/SKILL.md');
assert(
  workflowSkill.includes('Preserve exact source structure when exact conversion is') &&
    workflowSkill.includes('not an immutable DOM contract') &&
    componentAuthoringSkill.includes('do not substitute a screenshot-based') &&
    componentAuthoringSkill.includes('Convert rendered slots to registered component contracts'),
  'Workbench workflow must use practical reference handling while component conversion preserves explicit source contracts',
);

const sourceTreePreview = await read('src/features/workbench-shell/ui/SourceTreePreview.tsx');
assert(
  sourceTreePreview.includes('normalizeProjectSourceFileReference(sourceFile)') &&
    sourceTreePreview.includes('normalizeProjectSourceFileReference(resolved)'),
  'Source preview runtime imports must rebase stale absolute source paths onto the active project root',
);

const hostTransport = await read('src/domain/project/workbenchHostTransport.ts');
assert(
  hostTransport.includes('export function resolveWorkbenchHostAssetUrl(value: string): string') &&
    hostTransport.includes('const preview = getWorkbenchLocalPreview();') &&
    hostTransport.includes('if (preview) return toLocalHostUrl(preview.url, pathname);'),
  'Runtime asset URLs must rebase project asset paths through the active bridge or local preview origin',
);
assert(
  hostTransport.includes("const previewUrl = params.get('workbenchPreviewUrl');") &&
    hostTransport.includes("params.delete('workbenchPreviewUrl');") &&
    hostTransport.includes('const storedBridge = getStoredWorkbenchLocalBridge();'),
  'Browser bridge pairing must carry the packaged local preview service without persisting it in project metadata',
);

const pagePreview = await read('src/page-preview.tsx');
assert(
  !pagePreview.includes('rebasePreviewAssetRegistry') &&
    !pagePreview.includes('rebasePreviewAssetRuntimeValue') &&
    !pagePreview.includes('sourceProjectRoot}/public'),
  'Page preview asset registries must preserve portable /workbench-assets values instead of rebasing them to absolute file paths',
);

const sourceImportRouting = await read('src/domain/document/sourceImportRouting.ts');
assert(
  sourceImportRouting.includes('export function normalizeProjectSourceFileReference') &&
    sourceImportRouting.includes("const PROJECT_SOURCE_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public'];") &&
    sourceImportRouting.includes('if (isLikelyAbsoluteSourceReference(rawPath)) return') &&
    sourceImportRouting.includes('return normalizeProjectSourceFileReference(importSource) || null;') &&
    sourceImportRouting.includes('if (segments.length === 0) return null;'),
  'Project source import routing must normalize stale absolute file references, reject unrecoverable absolute paths, and block root-escaping relative imports',
);

const projectWorkspace = await read('src/features/workbench-shell/ui/ProjectWorkspace.tsx');
assert(
  projectWorkspace.includes('normalizeProjectSourceFileReference(sourceFile)') &&
    projectWorkspace.includes('normalizeProjectSourceFileReference(library.snapshotRoot)') &&
    projectWorkspace.includes('normalizeProjectSourceFileReference(library.sourcePath)') &&
    projectWorkspace.includes('normalizeProjectSourceFileReference(resolvedPath)') &&
    projectWorkspace.includes('function normalizeProjectCssConfigPath(value: string | null): string | null') &&
    projectWorkspace.includes('const PROJECT_CSS_CONFIG_ROOT_SEGMENTS =') &&
    projectWorkspace.includes('isLikelyAbsoluteProjectCssPath'),
  'Project CSS and local module import scans must use normalized project-relative source and Tailwind CSS references',
);

const designEditor = await read('src/features/workbench-shell/ui/DesignEditor.tsx');
assert(
  designEditor.includes('normalizeProjectSourceFileReference(component.sourceFile)') &&
    designEditor.includes('normalizeProjectSourceFileReference(sourceFile).replace') &&
    designEditor.includes('normalizeProjectSourceFileReference(candidate.sourceFile) === normalizedSourceFile'),
  'Design editor source tree and story matching must normalize stale absolute source references',
);

const viteConfig = await read('vite.config.ts');
assert(
  viteConfig.includes("const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];") &&
    viteConfig.includes('function normalizeConfiguredProjectCssPath(rawPath: string): string | null') &&
    viteConfig.includes('function isLikelyAbsoluteProjectCssPath(path: string): boolean') &&
    viteConfig.includes('if (segments.length === 0) return null;'),
  'Vite project CSS scanning must rebase portable Tailwind CSS config paths and reject root-escaping local imports',
);
assert(
  viteConfig.includes('realpathSync.native(existingPath)') &&
    viteConfig.includes('function toBoundaryComparablePath(filePath: string): string') &&
    viteConfig.includes('relative(toBoundaryComparablePath(directory), toBoundaryComparablePath(pathname))'),
  'Vite preview import boundary checks must compare canonical filesystem paths so symlinked project roots stay portable',
);
assert(
  viteConfig.includes('function createWorkbenchTailwindSyncEnvironment(): NodeJS.ProcessEnv') &&
    viteConfig.includes('delete environment.ESBUILD_BINARY_PATH;'),
  'Vite Tailwind preview sync must not leak the Workbench esbuild binary override into the active project build',
);

const previewCssRuntime = await read('scripts/workbench-preview-css.mjs');
const electronBridge = await read('host/local-bridge/server.ts');
const authoringMcp = await read('scripts/workbench-authoring-mcp.mjs');
assert(
  previewCssRuntime.includes("const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];") &&
    previewCssRuntime.includes('function normalizeConfiguredProjectCssPath(rawPath)') &&
    previewCssRuntime.includes('function isLikelyAbsoluteProjectCssPath(path)') &&
    previewCssRuntime.includes('WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES') &&
    previewCssRuntime.includes('WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS') &&
    electronBridge.includes('createWorkbenchPreviewCssCoordinator({') &&
    electronBridge.includes('this.#previewCssCoordinator.synchronizeProject(root, { changedPath, reason })') &&
    electronBridge.includes("[WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', projectRoot, '--preview-only']") &&
    electronBridge.includes('maxBuffer: WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES') &&
    electronBridge.includes('timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS'),
  'Shared preview CSS coordination must normalize portable config paths and bound Electron synchronization',
);
assert(
  authoringMcp.includes('createWorkbenchPreviewCssCoordinator({') &&
    authoringMcp.includes('getPreviewCssStatus: (projectRoot) => directPreviewCssCoordinator.getProjectStatus(projectRoot)') &&
    authoringMcp.includes('synchronizePreviewCss: (projectRoot, changedPath) => directPreviewCssCoordinator.synchronizeProject(') &&
    authoringMcp.includes("previewCssSynchronization: bridgeConnected ? 'bridge-managed' : 'direct-managed'") &&
    authoringMcp.includes('localBridgeConnected: bridgeConnected') &&
    authoringMcp.includes("[WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', projectRoot, '--preview-only']") &&
    authoringMcp.includes('maxBuffer: WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES') &&
    authoringMcp.includes('timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS') &&
    authoringMcp.includes('delete environment.ESBUILD_BINARY_PATH;'),
  'Direct authoring MCP must use bounded shared preview CSS coordination in preview-only mode with a sanitized project-build environment',
);
assert(
  electronBridge.includes("const PROJECT_ASSET_INSTALL_PATH = '/__workbench/assets/install.json';") &&
    electronBridge.includes("const PROJECT_GOOGLE_FONTS_PATH = '/__workbench/assets/google-fonts.json';") &&
    electronBridge.includes('workbenchHost.installWorkbenchAssets(') &&
    electronBridge.includes('workbenchHost.searchGoogleFontsCatalog(query, limit)') &&
    electronBridge.includes('function resolvePackagedNodeScriptPath(scriptPath: string): string') &&
    electronBridge.includes('app.asar.unpacked'),
  'Electron bridge must host asset install/search routes and resolve external Node scripts from app.asar.unpacked when packaged',
);
assert(
  electronBridge.includes('function createWorkbenchTailwindSyncEnvironment(nodeCommandPath: string): NodeJS.ProcessEnv') &&
    electronBridge.includes('delete environment.ESBUILD_BINARY_PATH;'),
  'Electron Tailwind preview sync must not leak the packaged Workbench esbuild binary override into the active project build',
);
assert(
  electronBridge.includes('workbenchHost.resolveWorkbenchNodeCommandPath()') &&
    electronBridge.includes('environment.PATH = [dirname(nodeCommandPath), process.env.PATH ?? \'\']'),
  'Electron Tailwind preview sync must resolve Node explicitly and keep it on PATH, because a GUI-launched app inherits no toolchain PATH',
);

const electronLocalPreview = await read('host/local-preview/server.ts');
assert(
  electronLocalPreview.includes("const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];") &&
    electronLocalPreview.includes('function normalizeConfiguredProjectCssPath(rawPath: string): string | null') &&
    electronLocalPreview.includes('function isLikelyAbsoluteProjectCssPath(path: string): boolean') &&
    electronLocalPreview.includes('if (segments.length === 0) return null;'),
  'Electron browser preview must share portable CSS path recovery and reject root-escaping local imports',
);
assert(
  electronLocalPreview.includes('realpathSync.native(existingPath)') &&
    electronLocalPreview.includes('function toBoundaryComparablePath(filePath: string): string') &&
    electronLocalPreview.includes('relative(toBoundaryComparablePath(rootPath), toBoundaryComparablePath(candidatePath))') &&
    electronLocalPreview.includes("'/__workbench/assets/install.json'") &&
    electronLocalPreview.includes("'/__workbench/assets/google-fonts.json'"),
  'Electron local preview must compare canonical filesystem paths and proxy asset install/search bridge routes',
);

const workbenchHostTransport = await read('src/domain/project/workbenchHostTransport.ts');
assert(
  workbenchHostTransport.includes("'/__workbench/assets/install.json'") &&
    workbenchHostTransport.includes("'/__workbench/assets/google-fonts.json'"),
  'Workbench host transport must send asset install and Google Fonts routes through the Electron local bridge',
);

const tailwindSync = await read('scripts/workbench-tailwind-sync.mjs');
assert(
    tailwindSync.includes("const PROJECT_CONFIG_ROOT_SEGMENTS = ['.workbench', 'src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];") &&
    tailwindSync.includes('function normalizeConfiguredProjectPath(rawPath)') &&
    tailwindSync.includes('Invalid project-relative Tailwind path') &&
    tailwindSync.includes('const recovery = buildResult.recoverable') &&
    tailwindSync.includes("createPreviewCssReceipt(compiledCssPath, 'install-free-seed', true, false)") &&
    tailwindSync.includes('timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS') &&
    tailwindSync.includes('recoverable: false'),
  'Tailwind sync must reject unsafe paths, rebase stale absolute paths, bound project builds, distinguish static seeds from project builds, and report real build failures',
);

assert(
  previewCssRuntime.includes('const ready = input.fresh && input.representative && !error;') &&
    previewCssRuntime.includes('WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER') &&
    previewCssRuntime.includes("if (mode === 'disabled') return true;") &&
    previewCssRuntime.includes("if (mode === 'fallback' || !config.compiledCss) return false;") &&
    previewCssRuntime.includes('inputRevisionBefore !== inputRevisionAfter') &&
    previewCssRuntime.includes("receipt.compiledCss === synchronizedConfig.compiledCss"),
  'Preview CSS readiness must require both current inputs and project-representative output while allowing non-Tailwind projects',
);

const workbenchTemplate = await read('scripts/workbench-template.mjs');
assert(
  workbenchTemplate.includes("['README.md', createWorkbenchProjectReadme(templateId)]") &&
    workbenchTemplate.includes('function createWorkbenchProjectReadme') &&
    !workbenchTemplate.includes('WORKBENCH_DEFAULT_PREVIEW_URL') &&
    !workbenchTemplate.includes('previewUrl: WORKBENCH_DEFAULT_PREVIEW_URL') &&
    workbenchTemplate.includes('# Workbench 프로젝트') &&
    workbenchTemplate.includes('이 폴더는 Workbench가 편집하는 사용자 프로젝트입니다') &&
    workbenchTemplate.includes('빨간 선택 또는 편집 불가로 표시될 수 있는 대상') &&
    workbenchTemplate.includes('docs/workbench-agent/') &&
    workbenchTemplate.includes('가이드는 시작할 때 한 번만 확인하지 말고') &&
    workbenchTemplate.includes('Keep those guides in the loop throughout the task') &&
    workbenchTemplate.includes('## Continuous Guide Loop') &&
    workbenchTemplate.includes('Do not treat this guide as a one-time startup checklist') &&
    workbenchTemplate.includes('Do not read this guide once and then ignore it') &&
    workbenchTemplate.includes('### Portable Path Rules') &&
    workbenchTemplate.includes('## AI Code Generation Anti-Patterns') &&
    workbenchTemplate.includes('Avoid code that renders in a browser but becomes opaque, brittle, or hard to edit in Workbench') &&
    workbenchTemplate.includes('Random IDs, generated class names, time-based keys') &&
    workbenchTemplate.includes('Project metadata must survive being moved to another folder') &&
    workbenchTemplate.includes('Keep Tailwind config paths project-relative in `.workbench/workbench.config.json`') &&
    workbenchTemplate.includes('## Source, CSS, And Story Paths') &&
    workbenchTemplate.includes('## Workbench-Unfriendly Component Patterns') &&
    workbenchTemplate.includes('## When Workbench Should Be Read-Only') &&
    workbenchTemplate.includes('Expected read-only or limited-edit cases') &&
    workbenchTemplate.includes('Data-rendered rows from `.map(...)`, imported JSON, fetched data, or local arrays') &&
    workbenchTemplate.includes('source binding diagnostic, or wrapper-level control') &&
    workbenchTemplate.includes('All component metadata paths must be project-relative and portable'),
  'Generated project docs must include a Korean user README plus AI guide documents for portable paths, Workbench-unfriendly code patterns, and expected read-only editing boundaries',
);

for (const storyRuntimeFile of ['src/workbench-stories/sourceStoryMetadata.ts', 'src/workbench-stories/csfRuntimeLoader.ts']) {
  const storyRuntime = await read(storyRuntimeFile);
  assert(
    storyRuntime.includes("import { resolveWorkbenchRuntimeModuleUrl } from './runtimeModuleUrl';") &&
      storyRuntime.includes("import { normalizeProjectSourceFileReference } from '@domain/document/sourceImportRouting';") &&
      storyRuntime.includes('const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);') &&
      storyRuntime.includes('resolveWorkbenchRuntimeModuleUrl(candidate'),
    `${storyRuntimeFile} must normalize CSF story source paths before resolving runtime import URLs`,
  );
}

const storyRuntimeModuleUrl = await read('src/workbench-stories/runtimeModuleUrl.ts');
assert(
  storyRuntimeModuleUrl.includes("import { normalizeProjectSourceFileReference } from '@domain/document/sourceImportRouting';") &&
    storyRuntimeModuleUrl.includes('const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);') &&
    storyRuntimeModuleUrl.includes('normalizeProjectSourceFileReference(dependencySourceFile)') &&
    storyRuntimeModuleUrl.includes('new URLSearchParams({ source: normalizedSourceFile })'),
  'Shared CSF runtime URL resolution must normalize source and dependency paths before requesting runtime modules',
);

console.log('Workbench portability checks passed');

async function collectFiles(directory, target) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    const displayPath = relative(repoRoot, fullPath);
    if ([...skippedPathParts].some((part) => displayPath.split('/').includes(part))) continue;
    if (entry.isDirectory()) {
      await collectFiles(fullPath, target);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!scannedExtensions.has(getExtension(entry.name))) continue;
    target.push(fullPath);
  }
}

function getExtension(fileName) {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index) : '';
}

async function read(path) {
  return await readFile(join(repoRoot, path), 'utf8');
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function fail(message) {
  throw new Error(message);
}
