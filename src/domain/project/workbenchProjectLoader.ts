import type {
  WorkbenchCommentRegistry,
  WorkbenchAssetRegistry,
  WorkbenchDesignAsset,
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
  WorkbenchProjectConfig,
  WorkbenchProjectFramework,
  WorkbenchProjectLocation,
  WorkbenchSelectionState,
  WorkbenchTokenRegistry,
} from './workbenchProject';
import {
  type WorkbenchHistoryFile,
} from '@domain/history/historyPersistence';
import type { WorkbenchSavePointFile } from '@domain/history/historySavePoints';
import {
  createRecoverableWorkbenchHistoryFile,
  sanitizeWorkbenchHistoryFile,
  sanitizeWorkbenchSelectionState,
} from './workbenchSessionState';
import { buildWorkbenchTokenCss } from '@domain/design-system/tokens/cssExport';
import {
  pruneOrphanedComponentsFromDisk,
  reconcileWorkbenchPagesWithSourceFiles,
} from './workbenchProjectRegistryOperations';
import { hydrateProjectLocalLibraries } from './workbenchProjectLocalLibraries';
import { WORKBENCH_PAGES_ROOT } from './workbenchPageFolders';
import { describeOutdatedWorkbenchHost, getWorkbenchHostKind, workbenchFetch } from './workbenchHostTransport';

export type WorkbenchProjectSnapshot = {
  location: WorkbenchProjectLocation;
  config: WorkbenchProjectConfig;
  tokens: WorkbenchTokenRegistry;
  pages: WorkbenchPageRegistry;
  components: WorkbenchComponentRegistry;
  assets: WorkbenchAssetRegistry;
  comments: WorkbenchCommentRegistry;
  selection: WorkbenchSelectionState;
  history: WorkbenchHistoryFile;
};

export type WorkbenchProjectLoadResult =
  | {
      status: 'ready';
      snapshot: WorkbenchProjectSnapshot;
    }
  | {
      status: 'loading';
      message: string;
    }
  | {
      status: 'missing';
      message: string;
    }
  | {
      status: 'error';
      message: string;
      recovery: 'reload' | 'retry-dependency-install';
    };

export type WorkbenchProjectActionResult =
  | {
      ok: true;
      location: WorkbenchProjectLocation;
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchProjectTemplateId = 'standard' | 'tailwind' | 'shadcn-base' | 'astryx';

export type WorkbenchFolderDialogResult =
  | {
      ok: true;
      rootPath: string;
    }
  | {
      ok: false;
      cancelled?: boolean;
      message: string;
    };

export type WorkbenchDiskImportFile = {
  contents: string;
  name: string;
  relativePath: string;
  size: number;
};

export type WorkbenchDiskImportResult =
  | {
      ok: true;
      files: WorkbenchDiskImportFile[];
      rootPath: string;
    }
  | {
      ok: false;
      message: string;
      // The import root does not exist (a positive answer from the host), as
      // opposed to a read the host could not complete.
      notFound?: boolean;
    };

export type WorkbenchAssetWriteResult =
  | {
      ok: true;
      filePath: string;
      publicPath: string;
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchAssetInstallResult =
  | {
      ok: true;
      assets: WorkbenchDesignAsset[];
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchGoogleFontOption = {
  category?: string;
  family: string;
  subsets: string[];
  variants: string[];
  weights: string[];
};

export type WorkbenchGoogleFontSearchResult =
  | {
      ok: true;
      fonts: WorkbenchGoogleFontOption[];
      message?: string;
      source: 'fallback' | 'google-fonts';
    }
  | {
      ok: false;
      message: string;
    };

const PROJECT_LOCATION_PATH = '/__workbench/project.json';
const PROJECT_DEPENDENCY_INSTALL_PATH = '/__workbench/project/dependencies/install.json';
const FOLDER_DIALOG_PATH = '/__workbench/folder-dialog.json';
const PROJECT_FILE_PREFIX = '/__workbench/files/';
const PROJECT_SOURCE_READ_PATH = '/__workbench/source/read.json';
const PROJECT_SOURCE_WRITE_PATH = '/__workbench/source/write.json';
const PROJECT_SOURCE_DELETE_PATH = '/__workbench/source/delete.json';
const PROJECT_SOURCE_IMPORT_TREE_PATH = '/__workbench/source/import-tree.json';
const PROJECT_SOURCE_MKDIR_PATH = '/__workbench/source/mkdir.json';
const PROJECT_SOURCE_MOVE_PATH = '/__workbench/source/move.json';
const PROJECT_SOURCE_RMDIR_PATH = '/__workbench/source/rmdir.json';
const PROJECT_ASSET_WRITE_PATH = '/__workbench/assets/write.json';
const PROJECT_ASSET_INSTALL_PATH = '/__workbench/assets/install.json';
const PROJECT_ASSET_DELETE_PATH = '/__workbench/assets/delete.json';
const PROJECT_GOOGLE_FONTS_PATH = '/__workbench/assets/google-fonts.json';
const CONFIG_PATH = '.workbench/workbench.config.json';
const DEFAULT_HISTORY_PATH = '.workbench/history.json';
const DEFAULT_ASSETS_PATH = '.workbench/assets.json';
const DEFAULT_NOTES_PATH = '.workbench/comments.json';
const DEFAULT_PROP_REGISTRY_PATH = '.workbench/prop-registry.json';
const DEFAULT_TOKEN_CSS_PATH = 'src/workbench-tokens.css';
const SOURCE_READ_TIMEOUT_MS = 15000;
const SOURCE_WRITE_TIMEOUT_MS = 60000;
const SOURCE_READ_RETRY_COUNT = 2;
const SOURCE_READ_RETRY_DELAY_MS = 250;
const BLOCKING_COMPONENT_REGISTRY_MAINTENANCE_LIMIT = 24;

export type WorkbenchProjectLoadOptions = {
  // Undo history is app-owned session state: rewritten constantly, never edited
  // outside Workbench, and by far the largest file in a project load. A re-sync
  // driven by a disk change has it in memory already, so it passes it back here
  // instead of refetching it.
  reuseHistory?: WorkbenchHistoryFile;
};

export async function loadWorkbenchProject(
  options: WorkbenchProjectLoadOptions = {},
): Promise<WorkbenchProjectLoadResult> {
  try {
    const location = await fetchProjectLocation();
    if (!location.rootPath) {
      return {
        status: 'missing',
        message: 'No Workbench project is open. Choose a project folder or initialize a new one.',
      };
    }
    // Dependency install state belongs to the preview/runtime boundary, not to project
    // load. Registries, source, and Inspector data all read from .workbench and src
    // without node_modules, so the project opens while installation runs or fails and
    // the workspace surfaces the install state on its own.
    const configPath = location.configPath || CONFIG_PATH;
    const configResponse = await fetchProjectJson<WorkbenchProjectConfig>(configPath, location);

    if (!configResponse.ok) {
      return {
        status: 'missing',
        message: `No ${configPath} found for this project.`,
      };
    }

    const config = configResponse.value;
    const historyPath = config.paths.history ?? DEFAULT_HISTORY_PATH;
    const assetsPath = config.paths.assets ?? DEFAULT_ASSETS_PATH;
    const notesPath = getWorkbenchNotesPath(config);
    const [tokens, pages, components, assets, comments, selection, history] = await Promise.all([
      fetchProjectJson<WorkbenchTokenRegistry>(config.paths.tokens, location),
      fetchProjectJson<WorkbenchPageRegistry>(config.paths.pages, location),
      fetchProjectJson<WorkbenchComponentRegistry>(config.paths.components, location),
      fetchOptionalProjectJson<WorkbenchAssetRegistry>(assetsPath, createEmptyWorkbenchAssetRegistry(), location),
      fetchProjectJson<WorkbenchCommentRegistry>(notesPath, location),
      fetchRecoverableProjectJson<unknown>(config.paths.selection, null, location),
      options.reuseHistory
        ? Promise.resolve(options.reuseHistory as unknown)
        : fetchRecoverableProjectJson<unknown>(historyPath, createRecoverableWorkbenchHistoryFile(), location),
    ]);

    if (!tokens.ok) return { status: 'error', message: tokens.message, recovery: 'reload' };
    if (!pages.ok) return { status: 'error', message: pages.message, recovery: 'reload' };
    if (!components.ok) return { status: 'error', message: components.message, recovery: 'reload' };
    if (!comments.ok) return { status: 'error', message: comments.message, recovery: 'reload' };

    // Reconcile the registry with the filesystem: recover moved pages when
    // possible, register page source files that were added out-of-band, and
    // drop component/library entries whose backing files were deleted
    // out-of-band (e.g. removed via Finder). Persist the cleaned state so it
    // survives the next load.
    const normalizedPages = normalizeWorkbenchPageRegistry(pages.value, location.rootPath);
    const normalizedComponents = normalizeWorkbenchComponentRegistry(components.value, location.rootPath);
    const projectLoadSourceReadCache = new Map<string, ReturnType<typeof readWorkbenchSourceFile>>();
    const readProjectLoadSourceFile = (path: string): ReturnType<typeof readWorkbenchSourceFile> => {
      const cacheKey = path.trim().replace(/\\/g, '/');
      const cached = projectLoadSourceReadCache.get(cacheKey);
      if (cached) return cached;
      const request = readWorkbenchSourceFile(path).then((result) => {
        if (!result.ok) projectLoadSourceReadCache.delete(cacheKey);
        return result;
      });
      projectLoadSourceReadCache.set(cacheKey, request);
      return request;
    };
    const pageSourceFiles = await readWorkbenchPageSourceFilesFromDisk();
    const pageReconcileResult = pageSourceFiles
      ? reconcileWorkbenchPagesWithSourceFiles(normalizedPages, pageSourceFiles)
      : { nextRegistry: normalizedPages, prunedPageNames: [], registeredPages: [], relinkedPages: [] };
    const reconciledPages = pageReconcileResult.nextRegistry;
    const pagesWereNormalized = JSON.stringify(reconciledPages) !== JSON.stringify(pages.value);
    const componentsWereNormalized = JSON.stringify(normalizedComponents) !== JSON.stringify(components.value);
    if (pagesWereNormalized) {
      try {
        await putJson(config.paths.pages, reconciledPages);
        if (
          pageReconcileResult.registeredPages.length > 0 ||
          pageReconcileResult.relinkedPages.length > 0 ||
          pageReconcileResult.prunedPageNames.length > 0
        ) {
          const registeredNames = pageReconcileResult.registeredPages.map((page) => page.name);
          const relinkedNames = pageReconcileResult.relinkedPages.map((page) => page.name);
          console.info(
            `[workbench] Reconciled page registry: registered ${pageReconcileResult.registeredPages.length} page(s), relinked ${pageReconcileResult.relinkedPages.length} page(s), pruned ${pageReconcileResult.prunedPageNames.length} stale page(s). ${[...registeredNames, ...relinkedNames, ...pageReconcileResult.prunedPageNames].join(', ')}`,
          );
        }
      } catch (error) {
        console.warn('[workbench] Failed to persist normalized page registry:', error);
      }
    }
    const shouldRunBlockingComponentMaintenance =
      normalizedComponents.components.length <= BLOCKING_COMPONENT_REGISTRY_MAINTENANCE_LIMIT;
    const pruneResult = shouldRunBlockingComponentMaintenance
      ? await pruneOrphanedComponentsFromDisk(
          normalizedComponents,
          async (path) => (await readProjectLoadSourceFile(path)).ok,
        )
      : { nextRegistry: normalizedComponents, prunedComponentNames: [], prunedLibraryIds: [] };
    const hydratedComponents = shouldRunBlockingComponentMaintenance
      ? await hydrateProjectLocalLibraries({
          pages: reconciledPages,
          projectTemplateId: getWorkbenchProjectTemplateId(config),
          readSourceFile: readProjectLoadSourceFile,
          readSourceTree: readWorkbenchDiskImportFiles,
          registry: pruneResult.nextRegistry,
        })
      : pruneResult.nextRegistry;
    const componentsWereHydrated = JSON.stringify(hydratedComponents) !== JSON.stringify(pruneResult.nextRegistry);
    if (
      componentsWereNormalized ||
      componentsWereHydrated ||
      pruneResult.prunedComponentNames.length > 0 ||
      pruneResult.prunedLibraryIds.length > 0
    ) {
      try {
        await putJson(config.paths.components, hydratedComponents);
        if (
          componentsWereHydrated ||
          pruneResult.prunedComponentNames.length > 0 ||
          pruneResult.prunedLibraryIds.length > 0
        ) {
          console.info(
            `[workbench] Reconciled component registry: hydrated ${componentsWereHydrated ? 'project-local components' : '0 component(s)'}, pruned ${pruneResult.prunedComponentNames.length} orphaned component(s) and ${pruneResult.prunedLibraryIds.length} library entry(ies): ${[...pruneResult.prunedComponentNames, ...pruneResult.prunedLibraryIds].join(', ')}`,
          );
        }
      } catch (error) {
        console.warn('[workbench] Failed to persist normalized component registry:', error);
      }
    }
    const sanitizedSelection = sanitizeWorkbenchSelectionState(selection, {
      components: hydratedComponents,
      pages: reconciledPages,
      projectId: config.projectId,
      tokens: tokens.value,
      tokenPath: config.paths.tokens,
    });
    const sanitizedHistory = sanitizeWorkbenchHistoryFile(history, {
      components: hydratedComponents,
      pages: reconciledPages,
      projectId: config.projectId,
      tokenPath: config.paths.tokens,
    });

    return {
      status: 'ready',
      snapshot: {
        location,
        config,
        tokens: tokens.value,
        pages: reconciledPages,
        components: hydratedComponents,
        assets: normalizeWorkbenchAssetRegistry(assets),
        comments: comments.value,
        selection: sanitizedSelection,
        history: sanitizedHistory,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown project load error.',
      recovery: 'reload',
    };
  }
}

async function readWorkbenchPageSourceFilesFromDisk(): Promise<string[] | null> {
  const result = await readWorkbenchDiskImportFiles(WORKBENCH_PAGES_ROOT, { includeContents: false });
  return result.ok ? result.files.map((file) => file.relativePath) : null;
}

export async function saveWorkbenchTokens(
  path: string,
  tokens: WorkbenchTokenRegistry,
): Promise<void> {
  await putJson(path, tokens);
}

export async function saveWorkbenchTokenCss(
  path: string,
  tokens: WorkbenchTokenRegistry,
): Promise<void> {
  const contents = buildWorkbenchTokenCss(tokens);
  const current = await readWorkbenchSourceFile(path);
  if (current.ok && current.contents === contents) return;
  const result = await writeWorkbenchSourceFile(path, contents, {
    normalize: false,
    overwrite: true,
  });
  if (!result.ok) throw new Error(result.message);
}

export async function saveWorkbenchPages(
  path: string,
  pages: WorkbenchPageRegistry,
): Promise<void> {
  await putJson(path, pages);
}

export async function saveWorkbenchComponents(
  path: string,
  components: WorkbenchComponentRegistry,
): Promise<void> {
  await putJson(path, components);
}

export async function saveWorkbenchAssets(
  path: string,
  assets: WorkbenchAssetRegistry,
): Promise<void> {
  await putJson(path, assets);
}

export async function saveWorkbenchComments(
  path: string,
  comments: WorkbenchCommentRegistry,
): Promise<void> {
  await putJson(path, comments);
}

export async function saveWorkbenchSelection(
  path: string,
  selection: WorkbenchSelectionState,
): Promise<void> {
  await putJson(path, selection);
}

export async function saveWorkbenchHistory(
  path: string,
  history: WorkbenchHistoryFile,
): Promise<void> {
  await putJson(path, history);
}

export async function loadWorkbenchSavePoints(path: string): Promise<unknown | null> {
  const response = await workbenchFetch(toProjectFileUrl(path), { cache: 'no-store' });
  // A lane that has never taken a save point has no file, which is not an error.
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  return response.json();
}

export async function saveWorkbenchSavePoints(
  path: string,
  file: WorkbenchSavePointFile,
): Promise<void> {
  await putJson(path, file);
}

export async function saveWorkbenchCodexDesignHandoff(
  path: string,
  handoff: unknown,
): Promise<void> {
  await putJson(path, handoff);
}

export async function loadWorkbenchPropRegistry(path: string): Promise<unknown | null> {
  // The registry is optional. With allowMissing the dev server reports its absence
  // as 204 instead of a 404 the browser would log; other hosts still answer 404.
  const response = await workbenchFetch(`${toProjectFileUrl(path)}?allowMissing=1`, { cache: 'no-store' });
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  return response.json();
}

export async function saveWorkbenchPropRegistry(path: string, registry: unknown): Promise<void> {
  await putJson(path, registry);
}

export async function readWorkbenchProjectJson<T>(
  path: string,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  return fetchProjectJson<T>(path);
}

export function getWorkbenchProjectFramework(config: WorkbenchProjectConfig): WorkbenchProjectFramework {
  return config.workbench.framework ?? 'react';
}

export function getWorkbenchHistoryPath(config: WorkbenchProjectConfig): string {
  return config.paths.history ?? DEFAULT_HISTORY_PATH;
}

export function getWorkbenchAssetsPath(config: WorkbenchProjectConfig): string {
  return config.paths.assets ?? DEFAULT_ASSETS_PATH;
}

export function getWorkbenchNotesPath(config: WorkbenchProjectConfig): string {
  return config.paths.notes ?? config.paths.comments ?? DEFAULT_NOTES_PATH;
}

export function getWorkbenchTokenCssPath(config: WorkbenchProjectConfig): string {
  return config.paths.tokenCss ?? DEFAULT_TOKEN_CSS_PATH;
}

export function getWorkbenchPropRegistryPath(): string {
  return DEFAULT_PROP_REGISTRY_PATH;
}

function getWorkbenchProjectTemplateId(config: WorkbenchProjectConfig): string | null {
  const projectTemplate = config.extensions?.projectTemplate;
  if (!isRecord(projectTemplate)) return null;
  const id = projectTemplate.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function createEmptyWorkbenchAssetRegistry(): WorkbenchAssetRegistry {
  return {
    schemaVersion: '0.1',
    assets: [],
    extensions: {},
  };
}

function normalizeWorkbenchAssetRegistry(registry: WorkbenchAssetRegistry): WorkbenchAssetRegistry {
  return {
    schemaVersion: '0.1',
    assets: Array.isArray(registry.assets) ? registry.assets : [],
    extensions: registry.extensions ?? {},
  };
}

function normalizeWorkbenchPageRegistry(
  registry: WorkbenchPageRegistry,
  projectRoot: string | null,
): WorkbenchPageRegistry {
  return {
    schemaVersion: registry.schemaVersion,
    pages: Array.isArray(registry.pages)
      ? registry.pages.map((page) => ({
        ...page,
        sourceFile: normalizeWorkbenchProjectFileReference(page.sourceFile, projectRoot),
        extensions: isRecord(page.extensions) ? normalizeWorkbenchPathExtensions(page.extensions, projectRoot) : {},
      }))
      : [],
    extensions: isRecord(registry.extensions) ? registry.extensions : {},
  };
}

function normalizeWorkbenchComponentRegistry(
  registry: WorkbenchComponentRegistry,
  projectRoot: string | null,
): WorkbenchComponentRegistry {
  const rawRegistry: Record<string, unknown> = isPlainRecord(registry) ? registry : {};
  const rawComponents: unknown[] = Array.isArray(rawRegistry.components) ? rawRegistry.components : [];
  return {
    schemaVersion: rawRegistry.schemaVersion === '0.1' ? rawRegistry.schemaVersion : '0.1',
    components: rawComponents.flatMap((component, index) => {
      const normalized = normalizeWorkbenchComponentRegistryEntry(component, index, projectRoot);
      return normalized ? [normalized] : [];
    }),
    extensions: isPlainRecord(rawRegistry.extensions) ? rawRegistry.extensions : {},
  };
}

function normalizeWorkbenchComponentRegistryEntry(
  component: unknown,
  index: number,
  projectRoot: string | null,
): WorkbenchComponentRegistry['components'][number] | null {
  if (!isPlainRecord(component)) return null;

  const extensions = isPlainRecord(component.extensions)
    ? normalizeWorkbenchPathExtensions(component.extensions, projectRoot)
    : {};
  const sourceFile = getTrimmedString(component.sourceFile) ??
    getTrimmedString(extensions.currentSourceFile) ??
    getTrimmedString(extensions.importedFrom) ??
    getTrimmedString(extensions.originSourceFile);
  if (!sourceFile) return null;

  const normalizedSourceFile = normalizeWorkbenchProjectFileReference(sourceFile, projectRoot);
  const importName = getTrimmedString(extensions.importName) ??
    getTrimmedString(extensions.sourceExportName);
  const fallbackName = importName ??
    getWorkbenchComponentNameFromSourceFile(normalizedSourceFile) ??
    `Component ${index + 1}`;
  const name = getTrimmedString(component.name) ?? fallbackName;
  const id = getTrimmedString(component.id) ??
    getWorkbenchComponentFallbackId(normalizedSourceFile, importName ?? name, index);
  const componentSetId = getTrimmedString(component.componentSetId);

  return {
    id,
    name,
    sourceFile: normalizedSourceFile,
    ...(componentSetId ? { componentSetId } : {}),
    variants: normalizeWorkbenchComponentVariants(component.variants),
    extensions,
  };
}

function getWorkbenchComponentNameFromSourceFile(sourceFile: string): string | null {
  const fileName = sourceFile.split('/').pop()?.replace(/\.[^.]+$/, '').trim();
  return fileName || null;
}

function getWorkbenchComponentFallbackId(sourceFile: string, name: string, index: number): string {
  const slug = `${sourceFile}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `component-${slug}` : `component-${index + 1}`;
}

const WORKBENCH_PATH_EXTENSION_KEYS = new Set([
  'currentSourceFile',
  'importedFrom',
  'librarySnapshotRoot',
  'originSourceFile',
  'previewSourceFile',
  'sourceFile',
  'storySourceFile',
]);

function normalizeWorkbenchPathExtensions(
  extensions: Record<string, unknown>,
  projectRoot: string | null,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(extensions).map(([key, value]) => {
    if (!WORKBENCH_PATH_EXTENSION_KEYS.has(key) || typeof value !== 'string') return [key, value];
    return [key, normalizeWorkbenchProjectFileReference(value, projectRoot)];
  }));
}

function normalizeWorkbenchProjectFileReference(value: string, projectRoot: string | null): string {
  const normalizedValue = value.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
  const normalizedRoot = projectRoot?.trim().replace(/\\/g, '/').replace(/\/+$/, '');
  if (normalizedRoot && normalizedValue.startsWith(`${normalizedRoot}/`)) {
    return normalizedValue.slice(normalizedRoot.length + 1).replace(/^\/+/, '');
  }
  if (normalizedValue.startsWith('/src/') || normalizedValue.startsWith('/.workbench/')) {
    return normalizedValue.replace(/^\/+/, '');
  }
  if (/^(?:\/|[a-zA-Z]:\/)/.test(normalizedValue)) return normalizedValue;
  return normalizedValue.replace(/^\/+/, '');
}

function normalizeWorkbenchComponentVariants(
  variants: unknown,
): WorkbenchComponentRegistry['components'][number]['variants'] {
  if (!Array.isArray(variants)) return [];
  return variants
    .filter(isRecord)
    .map((variant, index) => ({
      id: typeof variant.id === 'string' && variant.id.trim() ? variant.id : `variant-${index}`,
      axes: normalizeStringRecord(variant.axes),
      state: typeof variant.state === 'string' && variant.state.trim() ? variant.state : 'base',
    }));
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, recordValue]) => (
    typeof recordValue === 'string' ? [[key, recordValue]] : []
  )));
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function openWorkbenchProject(rootPath: string): Promise<WorkbenchProjectActionResult> {
  return setWorkbenchProjectRoot('open', rootPath);
}

export async function closeWorkbenchProject(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await workbenchFetch(PROJECT_LOCATION_PATH, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const outdatedHost = response.status === 404
        ? await describeOutdatedWorkbenchHost('project.close')
        : null;
      return {
        ok: false,
        message: outdatedHost
          ?? await readWorkbenchErrorMessage(response, `Failed to close project (${response.status})`),
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to close project.',
    };
  }
}

export async function createWorkbenchProject(
  parentPath: string,
  projectName: string,
  templateId: WorkbenchProjectTemplateId = 'standard',
): Promise<WorkbenchProjectActionResult> {
  return setWorkbenchProjectRoot('create', { parentPath, projectName, templateId });
}

export async function retryWorkbenchProjectDependencies(): Promise<WorkbenchProjectActionResult> {
  try {
    const response = await workbenchFetch(PROJECT_DEPENDENCY_INSTALL_PATH, {
      method: 'POST',
    });
    if (!response.ok) {
      return {
        ok: false,
        message: await readWorkbenchErrorMessage(
          response,
          `Failed to retry project dependency installation (${response.status})`,
        ),
      };
    }
    return {
      ok: true,
      location: normalizeProjectLocation(await response.json()),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to retry project dependency installation.',
    };
  }
}

export async function chooseWorkbenchProjectFolder(
  purpose: 'open-project' | 'create-parent',
): Promise<WorkbenchFolderDialogResult> {
  try {
    const response = await workbenchFetch(FOLDER_DIALOG_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purpose }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to choose folder (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchFolderDialogResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to choose folder.',
    };
  }
}

export type WorkbenchSourceReadOptions = {
  /**
   * The caller is probing for a file that may legitimately be absent (a module
   * extension candidate, an optional sidecar). The host then reports a missing
   * file in-band as `missing: true` instead of answering with HTTP 404.
   */
  allowMissing?: boolean;
};

export type WorkbenchSourceReadResult =
  | { ok: true; contents: string }
  | { ok: false; message: string; missing?: boolean };

export async function readWorkbenchSourceFile(
  path: string,
  options: WorkbenchSourceReadOptions = {},
): Promise<WorkbenchSourceReadResult> {
  let lastResult: Extract<WorkbenchSourceReadResult, { ok: false }> | null = null;
  for (let attempt = 0; attempt <= SOURCE_READ_RETRY_COUNT; attempt += 1) {
    const result = await readWorkbenchSourceFileOnce(path, options);
    if (result.ok) return result;
    lastResult = result;
    if (!isRetryableSourceReadMessage(result.message) || attempt === SOURCE_READ_RETRY_COUNT) return result;
    await wait(SOURCE_READ_RETRY_DELAY_MS * (attempt + 1));
  }
  return lastResult ?? { ok: false, message: `Failed to read ${path}.` };
}

/**
 * Lightweight presence check for a project file. Currently piggybacks on
 * `readWorkbenchSourceFile` (the dev server has no HEAD endpoint) but only
 * exposes a boolean so callers don't accidentally rely on file contents from
 * an existence probe.
 */
export async function pathExists(path: string): Promise<boolean> {
  const result = await readWorkbenchSourceFileOnce(path, { allowMissing: true });
  return result.ok;
}

async function readWorkbenchSourceFileOnce(
  path: string,
  options: WorkbenchSourceReadOptions = {},
): Promise<WorkbenchSourceReadResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SOURCE_READ_TIMEOUT_MS);
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_READ_PATH, {
      cache: 'no-store',
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options.allowMissing ? { path, allowMissing: true } : { path }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to read ${path} (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchSourceReadResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof DOMException && error.name === 'AbortError'
        ? `Timed out reading ${path}`
        : error instanceof Error ? error.message : `Failed to read ${path}.`,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function isRetryableSourceReadMessage(message: string): boolean {
  return message.startsWith('Timed out reading ') || message === 'Failed to fetch' || message.includes('NetworkError');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function readWorkbenchDiskImportFiles(
  sourcePath: string,
  options: { includeContents?: boolean } = {},
): Promise<WorkbenchDiskImportResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SOURCE_READ_TIMEOUT_MS);
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_IMPORT_TREE_PATH, {
      cache: 'no-store',
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourcePath, ...options }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to read import path (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchDiskImportResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof DOMException && error.name === 'AbortError'
        ? `Timed out reading ${sourcePath}`
        : error instanceof Error ? error.message : `Failed to read ${sourcePath}.`,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function writeWorkbenchSourceFile(
  path: string,
  contents: string,
  options: { overwrite?: boolean; normalize?: boolean } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SOURCE_WRITE_TIMEOUT_MS);
  try {
    const normalizedContents = options.normalize === false ? contents : normalizeWorkbenchSourceWriteContents(contents);
    const response = await workbenchFetch(PROJECT_SOURCE_WRITE_PATH, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, contents: normalizedContents, overwrite: options.overwrite === true }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to write ${path} (${response.status})`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof DOMException && error.name === 'AbortError'
        ? `Timed out writing ${path}`
        : error instanceof Error ? error.message : `Failed to write ${path}.`,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function deleteWorkbenchSourceFile(path: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_DELETE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to delete ${path} (${response.status})`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to delete ${path}.`,
    };
  }
}

export async function createWorkbenchSourceFolder(path: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_MKDIR_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to create folder ${path} (${response.status})`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to create folder ${path}.`,
    };
  }
}

export async function moveWorkbenchSourcePath(
  from: string,
  to: string,
  options: { overwrite?: boolean } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_MOVE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, overwrite: options.overwrite === true }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to move ${from} to ${to} (${response.status})`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to move ${from} to ${to}.`,
    };
  }
}

export async function removeWorkbenchSourceFolder(
  path: string,
  options: { recursive?: boolean } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await workbenchFetch(PROJECT_SOURCE_RMDIR_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, recursive: options.recursive === true }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to remove folder ${path} (${response.status})`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to remove folder ${path}.`,
    };
  }
}

export async function writeWorkbenchAssetFile(input: {
  collection?: string;
  dataUrl: string;
  fileName: string;
  kind: 'image' | 'video' | 'font' | 'icon';
}): Promise<WorkbenchAssetWriteResult> {
  try {
    const response = await workbenchFetch(PROJECT_ASSET_WRITE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to write asset (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchAssetWriteResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to write asset.',
    };
  }
}

export async function installWorkbenchAssetsFromGit(input: {
  kind: 'font' | 'icon';
  name?: string;
  url: string;
}): Promise<WorkbenchAssetInstallResult> {
  try {
    const response = await workbenchFetch(PROJECT_ASSET_INSTALL_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to install assets (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchAssetInstallResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to install assets.',
    };
  }
}

export async function deleteWorkbenchAssetFiles(paths: string[]): Promise<{ ok: true; removed: string[] } | { ok: false; message: string }> {
  const trimmed = paths.map((entry) => entry?.trim()).filter((entry): entry is string => !!entry);
  if (trimmed.length === 0) return { ok: true, removed: [] };
  try {
    const response = await workbenchFetch(PROJECT_ASSET_DELETE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: trimmed }),
    });

    if (!response.ok) {
      const message = await response.text();
      return { ok: false, message: message || `Failed to delete asset files (${response.status})` };
    }

    return (await response.json()) as { ok: true; removed: string[] };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Failed to delete asset files.' };
  }
}

export async function installWorkbenchGoogleFont(input: {
  family: string;
  name?: string;
  weights?: string[];
}): Promise<WorkbenchAssetInstallResult> {
  try {
    const response = await workbenchFetch(PROJECT_ASSET_INSTALL_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'google-fonts',
        kind: 'font',
        ...input,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to install Google Font (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchAssetInstallResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to install Google Font.',
    };
  }
}

export async function searchWorkbenchGoogleFonts(input: {
  limit?: number;
  query?: string;
} = {}): Promise<WorkbenchGoogleFontSearchResult> {
  const params = new URLSearchParams();
  const query = input.query?.trim();
  if (query) params.set('q', query);
  if (input.limit) params.set('limit', String(input.limit));
  const queryString = params.toString();

  try {
    const response = await workbenchFetch(`${PROJECT_GOOGLE_FONTS_PATH}${queryString ? `?${queryString}` : ''}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        message: message || `Failed to search Google Fonts (${response.status})`,
      };
    }

    return (await response.json()) as WorkbenchGoogleFontSearchResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to search Google Fonts.',
    };
  }
}

const NAMED_IMPORT_DECLARATION_PATTERN = /^import\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+(['"])([^'"]+)\3;?[ \t]*\n?/gm;
const DEFAULT_IMPORT_DECLARATION_PATTERN = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"])([^'"]+)\2;?[ \t]*\n?/gm;

export function normalizeWorkbenchSourceWriteContents(contents: string): string {
  const referenceContents = contents
    .replace(NAMED_IMPORT_DECLARATION_PATTERN, '')
    .replace(DEFAULT_IMPORT_DECLARATION_PATTERN, '');

  return contents
    .replace(NAMED_IMPORT_DECLARATION_PATTERN, (_statement, typePrefix: string | undefined, specifierText: string, quote: string, importSource: string) => {
      const specifiers = parseNamedImportSpecifiers(specifierText);
      const keptSpecifiers = specifiers.filter((specifier) => hasIdentifierReference(referenceContents, specifier.localName));
      if (keptSpecifiers.length === 0) return '';
      const importKind = typePrefix ? 'type ' : '';
      return `import ${importKind}{ ${keptSpecifiers.map((specifier) => specifier.sourceText).join(', ')} } from ${quote}${importSource}${quote};\n`;
    })
    .replace(DEFAULT_IMPORT_DECLARATION_PATTERN, (statement: string, localName: string) => (
      hasIdentifierReference(referenceContents, localName) ? statement : ''
    ))
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}$/, '\n');
}

function parseNamedImportSpecifiers(specifierText: string): Array<{ localName: string; sourceText: string }> {
  return specifierText
    .split(',')
    .map((specifier) => specifier.trim())
    .filter(Boolean)
    .map((sourceText) => ({
      localName: getNamedImportLocalName(sourceText),
      sourceText,
    }))
    .filter((specifier) => /^[A-Za-z_$][\w$]*$/.test(specifier.localName));
}

function getNamedImportLocalName(sourceText: string): string {
  const normalizedSourceText = sourceText.replace(/^type\s+/, '');
  const aliasMatch = /\s+as\s+([A-Za-z_$][\w$]*)$/.exec(normalizedSourceText);
  if (aliasMatch) return aliasMatch[1] ?? normalizedSourceText;
  return normalizedSourceText;
}

function hasIdentifierReference(contents: string, identifier: string): boolean {
  return new RegExp(`\\b${escapeRegExp(identifier)}\\b`).test(contents);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function putJson(path: string, value: unknown): Promise<void> {
  const response = await workbenchFetch(toProjectFileUrl(path), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: `${JSON.stringify(value, null, 2)}\n`,
  });

  if (!response.ok) {
    throw new Error(`Failed to save ${path} (${response.status})`);
  }
}

async function setWorkbenchProjectRoot(
  action: 'open' | 'create',
  input: string | { parentPath: string; projectName: string; templateId?: WorkbenchProjectTemplateId },
): Promise<WorkbenchProjectActionResult> {
  try {
    const response = await workbenchFetch(PROJECT_LOCATION_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typeof input === 'string' ? { action, rootPath: input } : { action, ...input }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readWorkbenchErrorMessage(response, `Failed to ${action} project (${response.status})`),
      };
    }

    return {
      ok: true,
      location: normalizeProjectLocation(await response.json()),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to ${action} project.`,
    };
  }
}

async function readWorkbenchErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { message?: unknown }).message === 'string'
    ) {
      return (parsed as { message: string }).message;
    }
  } catch {
    // Plain-text server errors are already readable.
  }

  return text;
}

function toProjectFileUrl(path: string, location?: WorkbenchProjectLocation): string {
  const normalizedPath = normalizeProjectPath(path);
  if (location?.source === 'static-fallback') return `/${normalizedPath}`;
  return `${PROJECT_FILE_PREFIX}${normalizedPath.split('/').map(encodeURIComponent).join('/')}`;
}

function normalizeProjectPath(path: string): string {
  return path.replace(/^\/+/, '');
}

/**
 * Re-read the host's dependency install status. The GET also re-queues the
 * install host-side when dependencies are still missing, so polling this while
 * a project installs keeps both the status and the install itself alive.
 */
export async function readWorkbenchProjectDependencyInstall(): Promise<WorkbenchProjectLocation['dependencyInstall']> {
  const location = await fetchProjectLocation();
  return location.dependencyInstall;
}

async function fetchProjectLocation(): Promise<WorkbenchProjectLocation> {
  try {
    const response = await workbenchFetch(PROJECT_LOCATION_PATH, { cache: 'no-store' });
    if (!response.ok) return createFallbackProjectLocation();

    return normalizeProjectLocation(await response.json());
  } catch {
    return createFallbackProjectLocation();
  }
}

function normalizeProjectLocation(value: unknown): WorkbenchProjectLocation {
  if (!isRecord(value)) return createFallbackProjectLocation();

  return {
    kind: 'local',
    rootPath: typeof value.rootPath === 'string' ? value.rootPath : null,
    workbenchDir: typeof value.workbenchDir === 'string' ? value.workbenchDir : null,
    configPath: typeof value.configPath === 'string' ? value.configPath : CONFIG_PATH,
    source: value.source === 'dev-server' || value.source === 'local-bridge'
      ? value.source
      : getWorkbenchHostKind() === 'local-bridge' ? 'local-bridge' : 'static-fallback',
    dependencyInstall: normalizeDependencyInstallStatus(value.dependencyInstall),
  };
}

function createFallbackProjectLocation(): WorkbenchProjectLocation {
  return {
    kind: 'local',
    rootPath: null,
    workbenchDir: null,
    configPath: CONFIG_PATH,
    source: 'static-fallback',
  };
}

function normalizeDependencyInstallStatus(value: unknown): WorkbenchProjectLocation['dependencyInstall'] | undefined {
  if (!isRecord(value)) return undefined;
  const status = value.status === 'installing' || value.status === 'installed' || value.status === 'failed' || value.status === 'skipped'
    ? value.status
    : null;
  if (!status) return undefined;
  return {
    message: typeof value.message === 'string' ? value.message : undefined,
    ok: value.ok === true,
    status,
  };
}

async function fetchProjectJson<T>(
  path: string,
  location?: WorkbenchProjectLocation,
): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
  const response = await workbenchFetch(toProjectFileUrl(path, location), { cache: 'no-store' });

  if (!response.ok) {
    return {
      ok: false,
      message: `Failed to load ${path} (${response.status})`,
    };
  }

  return {
    ok: true,
    value: (await response.json()) as T,
  };
}

async function fetchOptionalProjectJson<T>(
  path: string,
  fallback: T,
  location?: WorkbenchProjectLocation,
): Promise<T> {
  const response = await workbenchFetch(toProjectFileUrl(path, location), { cache: 'no-store' });
  if (!response.ok) return fallback;
  return (await response.json()) as T;
}

async function fetchRecoverableProjectJson<T>(
  path: string,
  fallback: T,
  location?: WorkbenchProjectLocation,
): Promise<T> {
  try {
    return await fetchOptionalProjectJson(path, fallback, location);
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
