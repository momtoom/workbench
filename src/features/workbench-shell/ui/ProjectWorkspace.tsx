import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, FolderOpen, FolderPlus, LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/primitives';
import {
  notifyWorkbenchProjectChange,
  subscribeWorkbenchProjectChangeEvents,
} from '@domain/project/workbenchHostTransport';
import type {
  WorkbenchProjectClassCatalog,
  WorkbenchProjectClassSource,
} from '@domain/project/workbenchProjectClassCatalog';
import {
  getWorkbenchAssetsPath,
  getWorkbenchHistoryPath,
  getWorkbenchNotesPath,
  getWorkbenchTokenCssPath,
  readWorkbenchProjectDependencyInstall,
  readWorkbenchProjectJson,
  readWorkbenchDiskImportFiles,
  readWorkbenchSourceFile,
  saveWorkbenchAssets,
  saveWorkbenchComponents,
  saveWorkbenchComments,
  saveWorkbenchSelection,
  saveWorkbenchTokenCss,
  saveWorkbenchTokens,
  writeWorkbenchSourceFile,
  type WorkbenchProjectLoadResult,
  type WorkbenchProjectSnapshot,
  type WorkbenchSourceReadOptions,
} from '@domain/project/workbenchProjectLoader';
import type { WorkbenchSelectionSnapshot } from '@domain/history/historyController';
import type {
  WorkbenchCommentRegistry,
  WorkbenchComponentRegistry,
  WorkbenchLibraryRegistryEntry,
  WorkbenchSelectionExtensions,
  WorkbenchSelectionState,
  WorkbenchSelectionTarget,
} from '@domain/project/workbenchProject';
import type { TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';
import type { TokenUsageSourceInput } from '@domain/design-system/tokens/usageIndex';
import { areTokenRegistriesEqual, cloneTokenRegistry } from '@domain/design-system/tokens/registryEquality';
import { normalizeImportedRegistry } from '@domain/design-system/tokens/operations';
import { getImportableComponentSummariesFromTsxSource } from '@domain/document/editableTreeSourceParser';
import type {
  WorkbenchComponentLibraryImportItem,
  WorkbenchComponentLibraryImportResult,
} from '@domain/project/workbenchComponentLibraryImport';
import { hydrateProjectLocalLibraries } from '@domain/project/workbenchProjectLocalLibraries';
import { getLibraryCssFileNameById } from '@domain/project/workbenchLibraryOwnership';
import {
  isProjectLocalImportSource,
  normalizeProjectSourceFileReference,
  resolveProjectLocalImportSourcePath,
} from '@domain/document/sourceImportRouting';
import {
  clearRegisteredSourceChildAllowlists,
  clearRegisteredSourceSlotKinds,
  registerSourceChildAllowlist,
  registerSourceSlotKind,
  type DeclaredSourceSlotKind,
} from '@domain/document/sourceSlotContainers';
import {
  clearRegisteredLibraryScopes,
  registerLibraryScope,
} from '@domain/document/libraryScopeRegistry';
import type { TokenEditorSaveStatus, TokenEditorSessionState } from './TokenEditor';
import type { StorybookActiveTarget } from './StorybookLibrary';
import type { SourceTreePreviewTailwindCssMode } from './sourceTreePreviewTailwindRuntime';
import { WorkbenchSurfaceNav, type WorkbenchSurface } from './WorkbenchSurfaceNav';
import { useWorkbenchPanelWidths, type WorkbenchPanelWidths } from './useWorkbenchPanelWidths';

const PROJECT_LIBRARY_CSS_HOST_MEDIA = 'not all';
const PROJECT_TAILWIND_CSS_DATA_ATTRIBUTE = 'wbProjectTailwindCss';
const PROJECT_DEPENDENCY_INSTALL_STATUS_PATH = '.workbench/dependency-install.json';
const PROJECT_HTML_ENTRY_PATH = 'index.html';
const PROJECT_DEFAULT_ENTRY_SOURCE_FILES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/main.ts',
  'src/main.js',
  'src/index.tsx',
  'src/index.jsx',
  'src/index.ts',
  'src/index.js',
];
const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];
const PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH = 8;

function createEmptyProjectClassCatalog(): WorkbenchProjectClassCatalog {
  return { classes: [], diagnostics: [] };
}

const AssetManager = lazy(() => import('./AssetManager').then((module) => ({ default: module.AssetManager })));
const DesignEditor = lazy(() => import('./DesignEditor').then((module) => ({ default: module.DesignEditor })));
const StorybookLibrary = lazy(() => import('./StorybookLibrary').then((module) => ({ default: module.StorybookLibrary })));
const TokenEditor = lazy(() => import('./TokenEditor').then((module) => ({ default: module.TokenEditor })));

type ProjectWorkspaceProps = {
  activeSurface: WorkbenchSurface;
  onSurfaceChange: (surface: WorkbenchSurface) => void;
  onInitializeProject: () => void;
  onOpenLicenses: () => void;
  onOpenProject: () => void;
  onRetryProject: () => void;
  onTokenStatusChange: (status: TokenEditorSaveStatus) => void;
  projectLoadResult: WorkbenchProjectLoadResult;
};

export function ProjectWorkspace({
  activeSurface,
  onSurfaceChange,
  onInitializeProject,
  onOpenLicenses,
  onOpenProject,
  onRetryProject,
  onTokenStatusChange,
  projectLoadResult,
}: ProjectWorkspaceProps) {
  if (projectLoadResult.status === 'ready') {
    return (
      <ReadyProjectWorkspace
        activeSurface={activeSurface}
        onRetryProject={onRetryProject}
        onSurfaceChange={onSurfaceChange}
        snapshot={projectLoadResult.snapshot}
        onTokenStatusChange={onTokenStatusChange}
      />
    );
  }

  if (projectLoadResult.status === 'loading') {
    return (
      <section className="wb-project-panel wb-project-panel--loading" aria-label="Loading project">
        <div className="wb-project-loading">
          <LoaderCircle size={16} aria-hidden="true" />
          <div className="wb-project-loading-text">
            <p className="wb-kicker">Local project</p>
            <strong>{projectLoadResult.message}</strong>
          </div>
        </div>
      </section>
    );
  }

  if (projectLoadResult.status === 'error') {
    const retryLabel = projectLoadResult.recovery === 'retry-dependency-install'
      ? 'Retry dependency install'
      : 'Try again';
    return (
      <section className="wb-project-panel wb-project-panel--disconnected" aria-label="Project error">
        <div className="wb-project-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            <p className="wb-kicker">Could not load project</p>
            <strong>{projectLoadResult.message}</strong>
          </div>
          <div className="wb-project-panel-actions wb-project-panel-actions--center">
            <Button className="wb-icon-text-button wb-project-start-button" tone="primary" onClick={onRetryProject}>
              <RefreshCw size={15} />
              <span>{retryLabel}</span>
            </Button>
            <Button className="wb-icon-text-button wb-project-start-button" tone="ghost" onClick={onOpenProject}>
              <FolderOpen size={15} />
              <span>Open another project</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wb-project-panel wb-project-panel--disconnected" aria-label="Choose a local project">
      <div className="wb-project-panel-actions wb-project-panel-actions--center">
        <Button className="wb-icon-text-button wb-project-start-button" tone="primary" onClick={onOpenProject}>
          <FolderOpen size={15} />
          <span>Open project</span>
        </Button>
        <Button className="wb-icon-text-button wb-project-start-button" tone="ghost" onClick={onInitializeProject}>
          <FolderPlus size={15} />
          <span>Create project</span>
        </Button>
      </div>
      <button
        type="button"
        className="wb-open-source-license-link"
        onClick={onOpenLicenses}
      >
        Open-source licenses
      </button>
    </section>
  );
}

function ProjectDependencyInstallNotice({
  onRetry,
  status,
}: {
  onRetry: () => void;
  status: NonNullable<WorkbenchProjectSnapshot['location']['dependencyInstall']>;
}) {
  const installing = status.status === 'installing';
  return (
    <div
      className={installing ? 'wb-workspace-notice wb-workspace-notice--installing' : 'wb-workspace-notice'}
      role={installing ? 'status' : 'alert'}
      aria-live="polite"
    >
      {installing ? <LoaderCircle size={14} aria-hidden="true" /> : <CircleAlert size={14} aria-hidden="true" />}
      <span>
        {installing
          ? 'Installing project dependencies. This can take a minute; component previews will appear automatically when ready.'
          : status.message || 'Project dependency installation failed. Preview rendering stays incomplete.'}
      </span>
      {installing ? null : (
        <Button className="wb-icon-text-button" tone="ghost" onClick={onRetry}>
          <RefreshCw size={13} />
          <span>Retry dependency install</span>
        </Button>
      )}
    </div>
  );
}

function ReadyProjectWorkspace({
  activeSurface,
  onRetryProject,
  onSurfaceChange,
  onTokenStatusChange,
  snapshot,
}: {
  activeSurface: WorkbenchSurface;
  onRetryProject: () => void;
  onSurfaceChange: (surface: WorkbenchSurface) => void;
  onTokenStatusChange: (status: TokenEditorSaveStatus) => void;
  snapshot: WorkbenchProjectSnapshot;
}) {
  const { config, selection, tokens } = snapshot;
  const notesPath = getWorkbenchNotesPath(config);
  const tokenCssPath = getWorkbenchTokenCssPath(config);
  const [workspaceSelection, setWorkspaceSelection] = useState(selection);
  const workspaceSelectionRef = useRef(selection);
  const pendingSelectionSaveRef = useRef<WorkbenchSelectionState | null>(null);
  const selectionSaveTimeoutRef = useRef<number | null>(null);
  const [liveAssets, setLiveAssets] = useState(snapshot.assets);
  const [liveDependencyInstall, setLiveDependencyInstall] = useState(snapshot.location.dependencyInstall);
  const assetRegistrySaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [liveComments, setLiveComments] = useState(snapshot.comments);
  const [livePages, setLivePages] = useState(snapshot.pages);
  const [liveComponents, setLiveComponents] = useState(snapshot.components);
  const [tokenUsageSources, setTokenUsageSources] = useState<TokenUsageSourceInput[]>([]);
  const [projectClassCatalog, setProjectClassCatalog] = useState<WorkbenchProjectClassCatalog>(
    createEmptyProjectClassCatalog,
  );
  const [storybookActiveTarget, setStorybookActiveTarget] = useState<StorybookActiveTarget | null>(
    () => getStorybookActiveTargetFromSelection(selection),
  );
  const snapshotTokenRegistry = useMemo(() => normalizeImportedRegistry(tokens), [tokens]);
  const [liveTokenRegistry, setLiveTokenRegistry] = useState<TokenRegistry>(() => cloneTokenRegistry(snapshotTokenRegistry));
  const [libraryCssRefreshKey, setLibraryCssRefreshKey] = useState(0);
  const projectPreviewStyleNodesRef = useRef(new Map<string, HTMLStyleElement>());
  const failedProjectPreviewCssPathsRef = useRef(new Set<string>());
  const projectLocalLibraryHydrationSignatureRef = useRef<string | null>(
    getProjectLocalLibraryHydrationSignature(snapshot.components, snapshot.pages),
  );
  const sourceReadCacheRef = useRef(new Map<string, Promise<Awaited<ReturnType<typeof readWorkbenchSourceFile>>>>());
  // Shared by the preview and class-catalog CSS crawls so each extensionless import
  // is probed once. Any project change can add or remove a candidate file, so every
  // invalidation drops the whole map.
  const moduleResolutionCacheRef = useRef(new Map<string, Promise<string | null>>());
  const clearCachedWorkbenchSourceFile = useCallback((path?: string) => {
    moduleResolutionCacheRef.current.clear();
    if (!path) {
      sourceReadCacheRef.current.clear();
      return;
    }
    sourceReadCacheRef.current.delete(normalizeProjectPath(path));
  }, []);
  const readCachedWorkbenchSourceFile = useCallback((path: string, options?: WorkbenchSourceReadOptions) => {
    const cacheKey = normalizeProjectPath(path);
    const cached = sourceReadCacheRef.current.get(cacheKey);
    if (cached) return cached;
    const request = readWorkbenchSourceFile(path, options).then((result) => {
      if (!result.ok) sourceReadCacheRef.current.delete(cacheKey);
      return result;
    });
    sourceReadCacheRef.current.set(cacheKey, request);
    return request;
  }, []);
  const liveSnapshot = useMemo(
    (): WorkbenchProjectSnapshot => ({
      ...snapshot,
      assets: liveAssets,
      comments: liveComments,
      components: liveComponents,
      pages: livePages,
    }),
    [liveAssets, liveComments, liveComponents, livePages, snapshot],
  );
  const designSelection = useMemo(
    () => createSelectionForSurface(workspaceSelection, 'design', liveSnapshot, { updateTimestamp: false }),
    [liveSnapshot, workspaceSelection],
  );
  const activeDesignSourceFile = designSelection.activeTarget?.sourceFile ?? null;
  useEffect(() => {
    clearCachedWorkbenchSourceFile();
    setTokenUsageSources([]);
    setProjectClassCatalog(createEmptyProjectClassCatalog());
    // The blocking loader intentionally skips maintenance for larger registries.
    // Start one cached, background hydration pass after a project is mounted so
    // contextual story components and stale duplicates are still reconciled.
    projectLocalLibraryHydrationSignatureRef.current = null;
  }, [clearCachedWorkbenchSourceFile, config.projectId, snapshot.components, snapshot.pages]);
  useEffect(() => {
    let cancelled = false;

    async function syncProjectLocalLibraries() {
      const inputSignature = getProjectLocalLibraryHydrationSignature(liveComponents, livePages);
      if (projectLocalLibraryHydrationSignatureRef.current === inputSignature) return;
      const nextComponents = await hydrateProjectLocalLibraries({
        pages: livePages,
        projectTemplateId: getProjectTemplateId(config.extensions),
        readSourceFile: readCachedWorkbenchSourceFile,
        readSourceTree: readWorkbenchDiskImportFiles,
        registry: liveComponents,
      });
      if (cancelled) return;
      projectLocalLibraryHydrationSignatureRef.current = getProjectLocalLibraryHydrationSignature(nextComponents, livePages);
      if (nextComponents === liveComponents) return;
      try {
        await saveWorkbenchComponents(config.paths.components, nextComponents);
      } catch (error) {
        console.warn('[workbench] Failed to persist hydrated component registry:', error);
      }
      setLiveComponents(nextComponents);
    }

    void syncProjectLocalLibraries();

    return () => {
      cancelled = true;
    };
  }, [config.extensions, config.paths.components, liveComponents, livePages, readCachedWorkbenchSourceFile]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectLibraryCss() {
      const tailwindCompiledCssPath = getConfiguredProjectTailwindCompiledCssPath(config);
      const optionalLibraryCssPaths = new Set(getProjectLibraryCssPaths(liveComponents));
      const eagerCssPaths = getEagerProjectPreviewCssPaths({
        components: liveComponents,
        config,
      });
      const eagerCss = await readProjectPreviewCssFiles(
        eagerCssPaths,
        readCachedWorkbenchSourceFile,
        failedProjectPreviewCssPathsRef.current,
        optionalLibraryCssPaths,
        () => cancelled,
      );
      if (cancelled) return;
      syncProjectPreviewCssNodes(
        projectPreviewStyleNodesRef.current,
        eagerCss,
        tailwindCompiledCssPath,
      );

      const cssPaths = await getProjectPreviewCssPaths({
        activeSurface,
        activeDesignSourceFile,
        components: liveComponents,
        config,
        moduleResolutionCache: moduleResolutionCacheRef.current,
        readSourceFile: readCachedWorkbenchSourceFile,
        storybookActiveTarget,
      });
      const nextCss = await readProjectPreviewCssFiles(
        cssPaths,
        readCachedWorkbenchSourceFile,
        failedProjectPreviewCssPathsRef.current,
        optionalLibraryCssPaths,
        () => cancelled,
      );
      if (cancelled) return;

      syncProjectPreviewCssNodes(
        projectPreviewStyleNodesRef.current,
        nextCss,
        tailwindCompiledCssPath,
      );
    }

    void loadProjectLibraryCss();

    return () => {
      cancelled = true;
    };
  }, [activeDesignSourceFile, activeSurface, config, libraryCssRefreshKey, liveComponents, readCachedWorkbenchSourceFile, storybookActiveTarget]);

  useEffect(() => () => {
    for (const styleNode of projectPreviewStyleNodesRef.current.values()) styleNode.remove();
    projectPreviewStyleNodesRef.current.clear();
  }, []);

  useEffect(() => {
    if (activeSurface !== 'design') return undefined;
    let cancelled = false;

    async function loadProjectClassCatalog() {
      const catalogModulePromise = import('@domain/project/workbenchProjectClassCatalog');
      const cssPaths = await getProjectClassCatalogCssPaths({
        components: liveComponents,
        config,
        moduleResolutionCache: moduleResolutionCacheRef.current,
        pages: livePages,
        readSourceFile: readCachedWorkbenchSourceFile,
      });
      const sources = await readProjectClassCatalogSources(
        cssPaths,
        readCachedWorkbenchSourceFile,
        () => cancelled,
      );
      const { createWorkbenchProjectClassCatalog } = await catalogModulePromise;
      if (!cancelled) setProjectClassCatalog(createWorkbenchProjectClassCatalog(sources));
    }

    void loadProjectClassCatalog();
    return () => { cancelled = true; };
  }, [activeSurface, config, libraryCssRefreshKey, liveComponents, livePages, readCachedWorkbenchSourceFile]);

  const snapshotDependencyInstall = snapshot.location.dependencyInstall;
  const previousDependencyInstallStatusRef = useRef(snapshotDependencyInstall?.status);
  useEffect(() => {
    setLiveDependencyInstall(snapshotDependencyInstall);
  }, [snapshotDependencyInstall]);

  const refreshLiveDependencyInstall = useCallback(async () => {
    try {
      setLiveDependencyInstall(await readWorkbenchProjectDependencyInstall());
    } catch {
      // Keep the last host-reported state until the next event or poll succeeds.
    }
  }, []);

  // The snapshot's install status is read once at project load, so a project
  // opened mid-install would otherwise report "installing" until a manual
  // refresh. Re-read immediately, then poll the host while the install runs;
  // the same GET also keeps the host-side install queue alive if interrupted.
  const liveDependencyInstallStatus = liveDependencyInstall?.status;
  useEffect(() => {
    const previousStatus = previousDependencyInstallStatusRef.current;
    previousDependencyInstallStatusRef.current = liveDependencyInstallStatus;
    if (previousStatus === 'installing' && liveDependencyInstallStatus !== 'installing') {
      // The host normally emits this change when installation finishes. Polling is the
      // recovery path for a browser that connected after that event, so mirror it locally
      // and let every preview surface retry without requiring a page reload.
      notifyWorkbenchProjectChange(PROJECT_DEPENDENCY_INSTALL_STATUS_PATH);
    }
  }, [liveDependencyInstallStatus]);

  useEffect(() => {
    if (liveDependencyInstallStatus !== 'installing') return undefined;
    void refreshLiveDependencyInstall();
    const timer = window.setInterval(() => {
      void refreshLiveDependencyInstall();
    }, 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [liveDependencyInstallStatus, refreshLiveDependencyInstall]);

  useEffect(() => {
    const assetsPath = getWorkbenchAssetsPath(config);

    return subscribeWorkbenchProjectChangeEvents((event) => {
      const path = event.path;
      const normalizedPath = normalizeProjectPath(path);
      clearCachedWorkbenchSourceFile(path);
      if (normalizedPath === PROJECT_DEPENDENCY_INSTALL_STATUS_PATH) {
        void refreshLiveDependencyInstall();
        return;
      }
      if (isProjectPreviewCssRefreshPath(config, path) || isProjectClassCatalogRefreshPath(path)) {
        setLibraryCssRefreshKey((version) => version + 1);
        return;
      }
      if (normalizedPath !== normalizeProjectPath(assetsPath)) return;
      void readWorkbenchProjectJson<WorkbenchProjectSnapshot['assets']>(assetsPath).then((result) => {
        if (result.ok) setLiveAssets(result.value);
      });
    });
  }, [clearCachedWorkbenchSourceFile, config, refreshLiveDependencyInstall]);

  // Replay every imported library's scope class into the shared scope
  // registry so preview canvases and generated page templates know which
  // `--<lib>-*` token namespaces are active in this project.
  useEffect(() => {
    clearRegisteredLibraryScopes();
    const libraries = liveComponents.extensions.libraries ?? {};
    for (const library of Object.values(libraries)) {
      if (library?.id) registerLibraryScope(library.id);
    }
  }, [liveComponents]);

  useEffect(() => {
    let cancelled = false;
    clearRegisteredSourceSlotKinds();
    clearRegisteredSourceChildAllowlists();
    async function syncSlotKinds() {
      const tasks = liveComponents.components.map(async (component) => {
        const importName = getStringExtension(component.extensions, 'importName') ??
          getStringExtension(component.extensions, 'sourceExportName') ?? component.name;
        if (!importName) return;
        const preserveKnownChildContract = getStringExtension(component.extensions, 'libraryId') === 'shadcn-base';

        // The child contract the component's own story declared. Registering
        // it before the slot-kind work below means an "Add child" picker only
        // offers what the parent actually accepts, instead of falling back to
        // "a block slot accepts anything".
        registerSourceChildAllowlist(importName, getStringArrayExtension(component.extensions, 'allowedChildren'));

        const declaredKind = getSourceChildrenSlotKindExtension(component.extensions);
        if (declaredKind) {
          if (!cancelled) registerSourceSlotKind(importName, declaredKind, { preserveKnownChildContract });
          return;
        }

        const readResult = await readCachedWorkbenchSourceFile(component.sourceFile);
        if (!readResult.ok) return;
        const summaries = await getImportableComponentSummariesFromTsxSource({
          contents: readResult.contents,
          fallbackName: getImportedComponentFallbackName(component.sourceFile, component.sourceFile.split('/').pop() ?? component.name),
        });
        const inferred = summaries.find((summary) => summary.name === importName);
        if (cancelled || !inferred) return;
        registerSourceSlotKind(importName, inferred.childrenSlotKind ?? 'leaf', { preserveKnownChildContract });
      });
      await Promise.allSettled(tasks);
    }
    void syncSlotKinds();
    return () => { cancelled = true; };
  }, [liveComponents, readCachedWorkbenchSourceFile]);
  useEffect(() => {
    let cancelled = false;

    async function loadTokenUsageSources() {
      if (activeSurface !== 'tokens') return;
      const componentsBySourceFile = new Map<string, WorkbenchProjectSnapshot['components']['components']>();
      for (const component of liveComponents.components) {
        const components = componentsBySourceFile.get(component.sourceFile) ?? [];
        components.push(component);
        componentsBySourceFile.set(component.sourceFile, components);
      }

      const sources: TokenUsageSourceInput[] = [];
      await Promise.all([...componentsBySourceFile.entries()].map(async ([sourceFile, components]) => {
        const result = await readCachedWorkbenchSourceFile(sourceFile);
        if (!result.ok) return;
        sources.push({
          contents: result.contents,
          sourceFile,
          sourceId: sourceFile,
          sourceLabel: components.map((component) => component.name).join(', '),
        });
      }));

      if (!cancelled) {
        sources.sort((left, right) => left.sourceLabel.localeCompare(right.sourceLabel));
        setTokenUsageSources(sources);
      }
    }

    void loadTokenUsageSources();
    return () => { cancelled = true; };
  }, [activeSurface, liveComponents, readCachedWorkbenchSourceFile]);

  const flushPendingSelectionSave = useCallback(() => {
    if (selectionSaveTimeoutRef.current !== null) {
      window.clearTimeout(selectionSaveTimeoutRef.current);
      selectionSaveTimeoutRef.current = null;
    }
    const pendingSelection = pendingSelectionSaveRef.current;
    pendingSelectionSaveRef.current = null;
    if (!pendingSelection) return;
    void saveWorkbenchSelection(config.paths.selection, pendingSelection).catch((error) => {
      console.error(error instanceof Error ? error.message : 'Selection save failed.');
    });
  }, [config.paths.selection]);
  const scheduleSelectionSave = useCallback((nextSelection: WorkbenchSelectionState) => {
    pendingSelectionSaveRef.current = nextSelection;
    if (selectionSaveTimeoutRef.current !== null) {
      window.clearTimeout(selectionSaveTimeoutRef.current);
    }
    selectionSaveTimeoutRef.current = window.setTimeout(() => {
      selectionSaveTimeoutRef.current = null;
      const pendingSelection = pendingSelectionSaveRef.current;
      pendingSelectionSaveRef.current = null;
      if (!pendingSelection) return;
      void saveWorkbenchSelection(config.paths.selection, pendingSelection).catch((error) => {
        console.error(error instanceof Error ? error.message : 'Selection save failed.');
      });
    }, 500);
  }, [config.paths.selection]);
  const persistSelection = useCallback((nextSelection: WorkbenchSelectionState) => {
    workspaceSelectionRef.current = nextSelection;
    setWorkspaceSelection(nextSelection);
    scheduleSelectionSave(nextSelection);
  }, [scheduleSelectionSave]);
  useEffect(() => () => {
    flushPendingSelectionSave();
  }, [flushPendingSelectionSave]);
  const persistedPanelWidths = useMemo(() => ({
    initialDesignSourceListHeight: workspaceSelection.extensions.workbenchDesignSourceListHeight,
    initialInspectorWidth: workspaceSelection.extensions.workbenchInspectorWidth,
    initialSidebarWidth: workspaceSelection.extensions.workbenchSidebarWidth,
    initialTokenCollectionListHeight: workspaceSelection.extensions.workbenchTokenCollectionListHeight,
  }), [workspaceSelection.extensions]);
  const persistPanelWidths = useCallback((nextWidths: WorkbenchPanelWidths) => {
    const currentSelection = workspaceSelectionRef.current;
    persistSelection({
      ...currentSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        workbenchInspectorWidth: nextWidths.inspectorWidth,
        workbenchSidebarWidth: nextWidths.sidebarWidth,
      },
    });
  }, [persistSelection]);
  const persistDesignSourceListHeight = useCallback((height: number) => {
    const currentSelection = workspaceSelectionRef.current;
    persistSelection({
      ...currentSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        workbenchDesignSourceListHeight: height,
      },
    });
  }, [persistSelection]);
  const persistTokenCollectionListHeight = useCallback((height: number) => {
    const currentSelection = workspaceSelectionRef.current;
    persistSelection({
      ...currentSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        workbenchTokenCollectionListHeight: height,
      },
    });
  }, [persistSelection]);
  const persistTokenEditorSessionState = useCallback((state: TokenEditorSessionState) => {
    const currentSelection = workspaceSelectionRef.current;
    persistSelection({
      ...currentSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        workbenchTokenEditorSession: cloneTokenEditorSessionState(state),
      },
    });
  }, [persistSelection]);
  const {
    inspectorWidth,
    sidebarWidth,
    startInspectorWidthResize,
    startSidebarWidthResize,
  } = useWorkbenchPanelWidths({
    ...persistedPanelWidths,
    onPanelWidthsChange: persistPanelWidths,
  });
  const initialTokenSelection = useMemo(() => getTokenSelectionSnapshot(workspaceSelection), [workspaceSelection]);
  const initialTokenEditorSessionState = useMemo(
    () => getTokenEditorSessionState(workspaceSelection.extensions),
    [workspaceSelection.extensions],
  );

  useEffect(() => {
    setWorkspaceSelection((currentSelection) => {
      const nextSelection = isWorkbenchSelectionStale(selection, currentSelection)
        ? currentSelection
        : selection;
      workspaceSelectionRef.current = nextSelection;
      return nextSelection;
    });
    setStorybookActiveTarget(getStorybookActiveTargetFromSelection(selection));
  }, [selection]);
  useEffect(() => {
    setLivePages(snapshot.pages);
  }, [config.paths.pages, config.projectId, snapshot.pages]);
  useEffect(() => {
    setLiveAssets(snapshot.assets);
  }, [config.paths.assets, config.projectId, snapshot.assets]);
  useEffect(() => {
    setLiveComments(snapshot.comments);
  }, [config.projectId, notesPath, snapshot.comments]);
  useEffect(() => {
    setLiveTokenRegistry((currentRegistry) => (
      // Avoid autosave poll echo replacing the live registry when token content is unchanged.
      areTokenRegistriesEqual(currentRegistry, snapshotTokenRegistry)
        ? currentRegistry
        : cloneTokenRegistry(snapshotTokenRegistry)
    ));
  }, [config.paths.tokens, config.projectId, snapshotTokenRegistry]);
  useEffect(() => {
    if (areTokenRegistriesEqual(tokens, snapshotTokenRegistry)) return;
    void saveWorkbenchTokens(config.paths.tokens, snapshotTokenRegistry).catch((error) => {
      console.error(error instanceof Error ? error.message : 'Token registry normalization save failed.');
    });
  }, [config.paths.tokens, config.projectId, snapshotTokenRegistry, tokens]);
  useEffect(() => {
    void saveWorkbenchTokenCss(tokenCssPath, snapshotTokenRegistry).catch((error) => {
      console.error(error instanceof Error ? error.message : 'Token CSS sync failed.');
    });
  }, [config.projectId, snapshotTokenRegistry, tokenCssPath]);

  const handleSurfaceChange = useCallback((surface: WorkbenchSurface) => {
    const currentSelection = workspaceSelectionRef.current;
    onSurfaceChange(surface);
    persistSelection(createSelectionForSurface(currentSelection, surface, liveSnapshot));
  }, [liveSnapshot, onSurfaceChange, persistSelection]);

  const handleTokenSelectionChange = useCallback((nextSelection: WorkbenchSelectionSnapshot) => {
    const currentSelection = workspaceSelectionRef.current;
    const activeReference = getActiveTokenReference(nextSelection);
    const selectedReferences = getSelectedTokenReferences(nextSelection, activeReference);
    const activeTarget = activeReference ? createTokenSelectionTarget(activeReference) : null;
    persistSelection({
      schemaVersion: '0.1',
      activeTarget,
      selectedTargets: selectedReferences.map(createTokenSelectionTarget),
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        activeWorkbenchSurface: 'tokens',
        activeTokenCollectionId: nextSelection.activeTokenCollectionId ?? null,
        activeTokenGroupId: nextSelection.activeTokenGroupId ?? 'all',
        tokenSelectionAnchorCollectionId: nextSelection.tokenSelectionAnchorRef?.collectionId ?? null,
        tokenSelectionAnchorId: nextSelection.tokenSelectionAnchorRef?.tokenId ?? null,
      },
    });
  }, [persistSelection]);
  const handleDesignSelectionChange = useCallback((nextSelection: WorkbenchSelectionState) => {
    persistSelection({
      ...nextSelection,
      extensions: {
        ...nextSelection.extensions,
        activeWorkbenchSurface: 'design',
      },
    });
  }, [persistSelection]);
  const handleStorybookActiveTargetChange = useCallback((target: StorybookActiveTarget | null) => {
    const currentSelection = workspaceSelectionRef.current;
    setStorybookActiveTarget(target);
    persistSelection({
      ...currentSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...currentSelection.extensions,
        activeWorkbenchSurface: 'storybook',
        activeStorybookTargetKind: target?.kind ?? null,
        activeStorybookTargetId: target?.id ?? null,
      },
    });
  }, [persistSelection]);
  const importComponentLibraryItems = useCallback(async (
    files: WorkbenchComponentLibraryImportItem[],
  ): Promise<WorkbenchComponentLibraryImportResult> => {
    const { importWorkbenchComponentLibrary } = await import('@domain/project/workbenchComponentLibraryImport');
    const outcome = await importWorkbenchComponentLibrary({
      componentRegistryPath: config.paths.components,
      files,
      liveComponents,
      liveTokenRegistry,
      tokenCssPath,
      tokenRegistryPath: config.paths.tokens,
    });
    if (outcome.result.ok) {
      if (outcome.nextComponents) setLiveComponents(outcome.nextComponents);
      if (outcome.nextTokenRegistry) {
        setLiveTokenRegistry(cloneTokenRegistry(outcome.nextTokenRegistry));
      }
    }
    return outcome.result;
  }, [config.paths.components, config.paths.tokens, liveComponents, liveTokenRegistry, tokenCssPath]);
  const handleImportComponentLibrary = useCallback(async (files: File[]): Promise<WorkbenchComponentLibraryImportResult> => (
    importComponentLibraryItems(files.map((file) => ({
      name: file.name,
      relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '',
      readText: () => file.text(),
    })))
  ), [importComponentLibraryItems]);
  const handleImportComponentLibraryPath = useCallback(async (sourcePath: string): Promise<WorkbenchComponentLibraryImportResult> => {
    const result = await readWorkbenchDiskImportFiles(sourcePath);
    if (!result.ok) return result;
    return importComponentLibraryItems(result.files.map((file) => ({
      name: file.name,
      relativePath: file.relativePath,
      readText: async () => file.contents,
      sourcePath,
    })));
  }, [importComponentLibraryItems]);
  const handleRelinkLibraryCss = useCallback(async (): Promise<{ ok: true; changedCount: number } | { ok: false; message: string }> => {
    const sourceFiles = getLibraryCssRelinkSourceFiles(livePages, liveComponents);
    let changedCount = 0;

    for (const sourceFile of sourceFiles) {
      const readResult = await readWorkbenchSourceFile(sourceFile);
      if (!readResult.ok) return { ok: false, message: readResult.message };

      const nextContents = relinkLibraryImportsToEntrypoint(readResult.contents);
      if (nextContents === readResult.contents) continue;

      const writeResult = await writeWorkbenchSourceFile(sourceFile, nextContents, { overwrite: true, normalize: false });
      if (!writeResult.ok) return { ok: false, message: writeResult.message };
      changedCount += 1;
    }

    return { ok: true, changedCount };
  }, [liveComponents, livePages]);
  const handleTokenRegistryChange = useCallback((nextRegistry: TokenRegistry) => {
    setLiveTokenRegistry(cloneTokenRegistry(nextRegistry));
    setLibraryCssRefreshKey((version) => version + 1);
  }, []);
  const handleAssetRegistryChange = useCallback((nextAssets: WorkbenchProjectSnapshot['assets']) => {
    setLiveAssets(nextAssets);
    const assetsPath = getWorkbenchAssetsPath(config);
    assetRegistrySaveQueueRef.current = assetRegistrySaveQueueRef.current
      .catch(() => undefined)
      .then(() => saveWorkbenchAssets(assetsPath, nextAssets));
    void assetRegistrySaveQueueRef.current.catch((error) => {
      console.error(error instanceof Error ? error.message : 'Asset registry save failed.');
    });
  }, [config]);
  const handleCommentsChange = useCallback((nextComments: WorkbenchCommentRegistry) => {
    setLiveComments(nextComments);
    void saveWorkbenchComments(notesPath, nextComments).catch((error) => {
      console.error(error instanceof Error ? error.message : 'Notes save failed.');
    });
  }, [notesPath]);
  const surfaceNav: ReactNode = (
    <WorkbenchSurfaceNav activeSurface={activeSurface} onChange={handleSurfaceChange} />
  );
  const dependencyInstall = liveDependencyInstall;
  return (
    <section className="wb-workspace" aria-label={`${config.projectName} workspace`}>
      {dependencyInstall && (dependencyInstall.status === 'installing' || dependencyInstall.status === 'failed') ? (
        <ProjectDependencyInstallNotice onRetry={onRetryProject} status={dependencyInstall} />
      ) : null}
      {activeSurface === 'tokens' ? (
        <Suspense
          fallback={(
            <WorkspaceSurfaceLoadingState
              ariaLabel="Loading token editor"
              kicker="Tokens"
              label="Loading editor"
            />
          )}
        >
          <TokenEditor
            key={config.projectId}
            history={snapshot.history}
            historyPath={getWorkbenchHistoryPath(config)}
            initialCollectionListHeight={persistedPanelWidths.initialTokenCollectionListHeight}
            initialRegistry={liveTokenRegistry}
            initialSelection={initialTokenSelection}
            initialSessionState={initialTokenEditorSessionState}
            onCollectionListHeightChange={persistTokenCollectionListHeight}
            onRegistryChange={handleTokenRegistryChange}
            onSelectionChange={handleTokenSelectionChange}
            onSessionStateChange={persistTokenEditorSessionState}
            onTokenStatusChange={onTokenStatusChange}
            sidebarWidth={sidebarWidth}
            startSidebarWidthResize={startSidebarWidthResize}
            surfaceNav={surfaceNav}
            tokenCssPath={tokenCssPath}
            tokenPath={config.paths.tokens}
            tokenUsageSources={tokenUsageSources}
          />
        </Suspense>
      ) : activeSurface === 'assets' ? (
        <Suspense
          fallback={(
            <WorkspaceSurfaceLoadingState
              ariaLabel="Loading asset manager"
              kicker="Assets"
              label="Loading manager"
            />
          )}
        >
          <AssetManager
            assets={liveAssets}
            onAssetsChange={handleAssetRegistryChange}
            sidebarWidth={sidebarWidth}
            startSidebarWidthResize={startSidebarWidthResize}
            surfaceNav={surfaceNav}
          />
        </Suspense>
      ) : activeSurface === 'storybook' ? (
        <Suspense
          fallback={(
            <WorkspaceSurfaceLoadingState
              ariaLabel="Loading component library"
              kicker="Components"
              label="Loading library"
            />
          )}
        >
          <StorybookLibrary
            activeTarget={storybookActiveTarget}
            assets={liveAssets}
            components={liveComponents}
            inspectorWidth={inspectorWidth}
            onActiveTargetChange={handleStorybookActiveTargetChange}
            onImportComponentLibrary={handleImportComponentLibrary}
            onImportComponentLibraryPath={handleImportComponentLibraryPath}
            onRelinkLibraryCss={handleRelinkLibraryCss}
            sidebarWidth={sidebarWidth}
            startInspectorWidthResize={startInspectorWidthResize}
            startSidebarWidthResize={startSidebarWidthResize}
            surfaceNav={surfaceNav}
            tailwindCssMode={getConfiguredProjectTailwindCssMode(config)}
            tokenRegistry={liveTokenRegistry}
          />
        </Suspense>
      ) : (
        <Suspense
          fallback={(
            <WorkspaceSurfaceLoadingState
              ariaLabel="Loading design editor"
              kicker="Design"
              label="Loading editor"
            />
          )}
        >
          <DesignEditor
            commentPath={notesPath}
            componentPath={config.paths.components}
            components={liveComponents}
            configPath={snapshot.location.configPath}
            comments={liveComments}
            history={snapshot.history}
            historyPath={getWorkbenchHistoryPath(config)}
            initialSourceListHeight={persistedPanelWidths.initialDesignSourceListHeight}
            inspectorWidth={inspectorWidth}
            onSelectionChange={handleDesignSelectionChange}
            onPagesChange={setLivePages}
            onCommentsChange={handleCommentsChange}
            onSourceListHeightChange={persistDesignSourceListHeight}
            pagePath={config.paths.pages}
            pages={livePages}
            projectId={config.projectId}
            projectName={config.projectName}
            projectClassCatalog={projectClassCatalog}
            selection={designSelection}
            sidebarWidth={sidebarWidth}
            startInspectorWidthResize={startInspectorWidthResize}
            startSidebarWidthResize={startSidebarWidthResize}
            surfaceNav={surfaceNav}
            assets={liveAssets}
            tailwindCssMode={getConfiguredProjectTailwindCssMode(config)}
            tokenRegistry={liveTokenRegistry}
          />
        </Suspense>
      )}
    </section>
  );
}

function WorkspaceSurfaceLoadingState({
  ariaLabel,
  kicker,
  label,
}: {
  ariaLabel: string;
  kicker: string;
  label: string;
}) {
  return (
    <div className="wb-project-loading" role="status" aria-label={ariaLabel}>
      <LoaderCircle size={16} aria-hidden="true" />
      <div className="wb-project-loading-text">
        <p className="wb-kicker">{kicker}</p>
        <strong>{label}</strong>
      </div>
    </div>
  );
}

function getTokenSelectionSnapshot(selection: WorkbenchSelectionState): WorkbenchSelectionSnapshot {
  const activeReference = tokenReferenceFromTarget(selection.activeTarget);
  const selectedReferences = selection.selectedTargets.flatMap((target) => {
    const reference = tokenReferenceFromTarget(target);
    return reference ? [reference] : [];
  });
  const selectedTokenRefs = dedupeTokenReferences([
    ...(activeReference ? [activeReference] : []),
    ...selectedReferences,
  ]);
  const fallbackReference = activeReference ?? selectedTokenRefs[0] ?? null;

  return {
    activeTokenCollectionId: selection.extensions.activeTokenCollectionId ?? fallbackReference?.collectionId ?? null,
    activeTokenGroupId: selection.extensions.activeTokenGroupId ?? 'all',
    selectedTokenCollectionId: fallbackReference?.collectionId ?? null,
    selectedTokenId: fallbackReference?.tokenId ?? null,
    selectedTokenRefs,
    tokenSelectionAnchorRef: getTokenSelectionAnchor(selection) ?? fallbackReference,
  };
}

function getTokenEditorSessionState(extensions: WorkbenchSelectionExtensions | undefined): TokenEditorSessionState {
  const value = extensions?.workbenchTokenEditorSession;
  return value ? cloneTokenEditorSessionState(value) : createDefaultTokenEditorSessionState();
}

function cloneTokenEditorSessionState(state: TokenEditorSessionState): TokenEditorSessionState {
  return {
    ...state,
    query: state.query,
    sidebarSearchQuery: state.sidebarSearchQuery,
    tableColumnWidthsByCollection: Object.fromEntries(
      Object.entries(state.tableColumnWidthsByCollection).map(([collectionId, widths]) => (
        [collectionId, { ...widths }]
      )),
    ),
    typeFilter: state.typeFilter,
  };
}

function createDefaultTokenEditorSessionState(): TokenEditorSessionState {
  return {
    query: '',
    sidebarSearchQuery: '',
    tableColumnWidthsByCollection: {},
    typeFilter: 'all',
  };
}

function isWorkbenchSelectionStale(
  incomingSelection: WorkbenchSelectionState,
  currentSelection: WorkbenchSelectionState,
): boolean {
  const incomingTime = Date.parse(incomingSelection.updatedAt ?? '');
  const currentTime = Date.parse(currentSelection.updatedAt ?? '');
  return Number.isFinite(incomingTime) &&
    Number.isFinite(currentTime) &&
    incomingTime < currentTime;
}

function getLibraryCssRelinkSourceFiles(
  pages: WorkbenchProjectSnapshot['pages'],
  components: WorkbenchProjectSnapshot['components'],
): string[] {
  const sourceFiles = new Set<string>();
  for (const page of pages.pages) {
    if (shouldRelinkLibraryCssInSourceFile(page.sourceFile)) sourceFiles.add(page.sourceFile);
  }
  for (const component of components.components) {
    if (shouldRelinkLibraryCssInSourceFile(component.sourceFile)) sourceFiles.add(component.sourceFile);
  }
  return [...sourceFiles];
}

function shouldRelinkLibraryCssInSourceFile(sourceFile: string): boolean {
  const normalized = sourceFile.replace(/\\/g, '/');
  return /\.(tsx|jsx)$/i.test(normalized) && !normalized.startsWith('src/libraries/');
}

function relinkLibraryImportsToEntrypoint(contents: string): string {
  return contents.replace(
    /(from\s*)(['"])([^'"]*\/libraries\/[a-z][a-z0-9-]*\/components)\/(?!index(?:\.(?:tsx?|jsx?))?['"])[^'"]+\2/g,
    (_match, prefix: string, quote: string, entrypoint: string) => `${prefix}${quote}${entrypoint}${quote}`,
  );
}

async function getProjectPreviewCssPaths({
  activeSurface,
  activeDesignSourceFile,
  components,
  config,
  moduleResolutionCache,
  readSourceFile,
  storybookActiveTarget,
}: {
  activeSurface: WorkbenchSurface;
  activeDesignSourceFile: string | null;
  components: WorkbenchProjectSnapshot['components'];
  config: WorkbenchProjectSnapshot['config'];
  moduleResolutionCache: Map<string, Promise<string | null>>;
  readSourceFile: typeof readWorkbenchSourceFile;
  storybookActiveTarget: StorybookActiveTarget | null;
}): Promise<string[]> {
  const paths = new Set<string>();
  const shouldIncludeCssPath = createProjectPreviewCssPathFilter(config);
  for (const cssPath of getConfiguredProjectPreviewCssPaths(config)) {
    if (shouldIncludeCssPath(cssPath)) paths.add(cssPath);
  }
  await collectProjectEntryCssPaths(paths, readSourceFile, shouldIncludeCssPath, moduleResolutionCache);
  for (const cssPath of getProjectLibraryCssPaths(components)) paths.add(cssPath);
  const sourceFiles = getActiveProjectPreviewCssSourceFiles({
    activeSurface,
    activeDesignSourceFile,
    components,
    storybookActiveTarget,
  });
  // Crawl the active source's CSS imports transitively so component-local CSS
  // appears in the iframe without making every registered page/component part
  // of the hot-path. Heavy catalog or archive pages stay cold until opened.
  await collectCssImportsFromSourceFiles(paths, sourceFiles, readSourceFile, shouldIncludeCssPath, moduleResolutionCache);
  return [...paths];
}

async function getProjectClassCatalogCssPaths({
  components,
  config,
  moduleResolutionCache,
  pages,
  readSourceFile,
}: {
  components: WorkbenchProjectSnapshot['components'];
  config: WorkbenchProjectSnapshot['config'];
  moduleResolutionCache: Map<string, Promise<string | null>>;
  pages: WorkbenchProjectSnapshot['pages'];
  readSourceFile: typeof readWorkbenchSourceFile;
}): Promise<string[]> {
  const paths = new Set<string>();
  const shouldIncludeCssPath = createProjectClassCatalogCssPathFilter(config);
  const sourceCssPath = getConfiguredProjectTailwindSourceCssPath(config);
  if (sourceCssPath) paths.add(sourceCssPath);

  await collectProjectEntryCssPaths(paths, readSourceFile, shouldIncludeCssPath, moduleResolutionCache);
  const sourceFiles = new Set<string>();
  for (const page of pages.pages) sourceFiles.add(page.sourceFile);
  for (const component of components.components) sourceFiles.add(component.sourceFile);
  await collectCssImportsFromSourceFiles(
    paths,
    [...sourceFiles],
    readSourceFile,
    shouldIncludeCssPath,
    moduleResolutionCache,
  );

  return [...paths]
    .filter(shouldIncludeCssPath)
    .sort();
}

async function readProjectClassCatalogSources(
  cssPaths: string[],
  readSourceFile: typeof readWorkbenchSourceFile,
  isCancelled: () => boolean,
): Promise<WorkbenchProjectClassSource[]> {
  const sources: WorkbenchProjectClassSource[] = [];
  await Promise.all(cssPaths.map(async (sourceFile) => {
    const result = await readSourceFile(sourceFile);
    if (isCancelled() || !result.ok) return;
    sources.push({ contents: result.contents, sourceFile });
  }));
  return sources.sort((left, right) => left.sourceFile.localeCompare(right.sourceFile));
}

function getActiveProjectPreviewCssSourceFiles({
  activeSurface,
  activeDesignSourceFile,
  components,
  storybookActiveTarget,
}: {
  activeSurface: WorkbenchSurface;
  activeDesignSourceFile: string | null;
  components: WorkbenchProjectSnapshot['components'];
  storybookActiveTarget: StorybookActiveTarget | null;
}): string[] {
  const sourceFiles = new Set<string>();
  if (activeSurface === 'design') {
    const sourceFile = activeDesignSourceFile;
    if (sourceFile) sourceFiles.add(sourceFile);
  }
  if (activeSurface === 'storybook' && storybookActiveTarget?.kind === 'component') {
    const component = components.components.find((candidate) => candidate.id === storybookActiveTarget.id);
    if (component?.sourceFile) sourceFiles.add(component.sourceFile);
  }
  return [...sourceFiles];
}

function getConfiguredProjectPreviewCssPaths(config: WorkbenchProjectSnapshot['config']): string[] {
  const paths = new Set<string>();
  const compiledCss = getConfiguredProjectTailwindCompiledCssPath(config);
  const tokenCss = getTrimmedString(config.paths.tokenCss);
  const normalizedTokenCss = normalizeProjectCssConfigPath(tokenCss);
  const orderedPaths = getConfiguredProjectTailwindProvider(config) === 'astryx'
    ? [normalizedTokenCss, compiledCss]
    : [compiledCss, normalizedTokenCss];
  for (const path of orderedPaths) {
    if (path) paths.add(path);
  }
  return [...paths].filter(Boolean);
}

function getEagerProjectPreviewCssPaths({
  components,
  config,
}: {
  components: WorkbenchProjectSnapshot['components'];
  config: WorkbenchProjectSnapshot['config'];
}): string[] {
  const paths = new Set<string>();
  for (const cssPath of getConfiguredProjectPreviewCssPaths(config)) paths.add(cssPath);
  for (const cssPath of getProjectLibraryCssPaths(components)) paths.add(cssPath);
  return [...paths];
}

async function readProjectPreviewCssFiles(
  cssPaths: string[],
  readSourceFile: typeof readWorkbenchSourceFile,
  failedCssPaths: Set<string>,
  optionalMissingCssPaths: ReadonlySet<string>,
  isCancelled: () => boolean,
): Promise<Map<string, string>> {
  const cssByPath = new Map<string, string>();
  await Promise.all(cssPaths.map(async (path) => {
    const result = await readSourceFile(path);
    if (isCancelled()) return;
    if (!result.ok) {
      if (optionalMissingCssPaths.has(path)) {
        failedCssPaths.delete(path);
        return;
      }
      if (!failedCssPaths.has(path)) {
        console.warn(`Project library CSS could not be loaded: ${path}: ${result.message}`);
        failedCssPaths.add(path);
      }
      return;
    }
    failedCssPaths.delete(path);
    cssByPath.set(path, normalizeProjectPreviewCssForWorkbench(result.contents));
  }));
  return cssByPath;
}

function syncProjectPreviewCssNodes(
  styleNodes: Map<string, HTMLStyleElement>,
  nextCss: Map<string, string>,
  tailwindCompiledCssPath: string | null,
) {
  for (const [path, contents] of nextCss) {
    const existingStyleNode = styleNodes.get(path);
    if (existingStyleNode) {
      if (existingStyleNode.textContent !== contents) existingStyleNode.textContent = contents;
      syncProjectPreviewCssNodeMetadata(existingStyleNode, path, tailwindCompiledCssPath);
      continue;
    }
    const styleNode = document.createElement('style');
    styleNode.media = PROJECT_LIBRARY_CSS_HOST_MEDIA;
    styleNode.textContent = contents;
    syncProjectPreviewCssNodeMetadata(styleNode, path, tailwindCompiledCssPath);
    document.head.appendChild(styleNode);
    styleNodes.set(path, styleNode);
  }

  for (const [path, styleNode] of styleNodes) {
    if (nextCss.has(path)) continue;
    styleNode.remove();
    styleNodes.delete(path);
  }
}

function getConfiguredProjectTailwindCompiledCssPath(config: WorkbenchProjectSnapshot['config']): string | null {
  const tailwind = isRecord(config.extensions.tailwind) ? config.extensions.tailwind : null;
  const compiledCss = getTrimmedString(tailwind?.compiledCss);
  return normalizeProjectCssConfigPath(compiledCss);
}

function getConfiguredProjectTailwindProvider(config: WorkbenchProjectSnapshot['config']): string | null {
  const tailwind = isRecord(config.extensions.tailwind) ? config.extensions.tailwind : null;
  return getTrimmedString(tailwind?.provider);
}

function getConfiguredProjectTailwindCssMode(
  config: WorkbenchProjectSnapshot['config'],
): SourceTreePreviewTailwindCssMode {
  const tailwind = isRecord(config.extensions.tailwind) ? config.extensions.tailwind : null;
  if (!tailwind || tailwind.enabled === false) return 'disabled';
  return getConfiguredProjectTailwindCompiledCssPath(config) ? 'compiled' : 'fallback';
}

function getConfiguredProjectTailwindSourceCssPath(config: WorkbenchProjectSnapshot['config']): string | null {
  const tailwind = isRecord(config.extensions.tailwind) ? config.extensions.tailwind : null;
  const sourceCss = getTrimmedString(tailwind?.sourceCss);
  return normalizeProjectCssConfigPath(sourceCss);
}

function createProjectPreviewCssPathFilter(config: WorkbenchProjectSnapshot['config']): (path: string) => boolean {
  const compiledCss = getConfiguredProjectTailwindCompiledCssPath(config);
  const sourceCss = getConfiguredProjectTailwindSourceCssPath(config);
  if (!compiledCss || !sourceCss) return () => true;
  const normalizedSourceCss = normalizeProjectPath(sourceCss);
  return (path: string) => normalizeProjectPath(path) !== normalizedSourceCss;
}

function createProjectClassCatalogCssPathFilter(config: WorkbenchProjectSnapshot['config']): (path: string) => boolean {
  const sourceCss = getConfiguredProjectTailwindSourceCssPath(config);
  const excludedPaths = new Set([
    getConfiguredProjectTailwindCompiledCssPath(config),
    normalizeProjectCssConfigPath(getTrimmedString(config.paths.tokenCss)),
  ].filter((path): path is string => Boolean(path)));
  if (sourceCss) excludedPaths.delete(sourceCss);

  return (path: string) => {
    const normalizedPath = normalizeProjectCssConfigPath(path) ?? normalizeProjectPath(path);
    return /\.css$/i.test(normalizedPath) && !excludedPaths.has(normalizedPath);
  };
}

function isProjectPreviewCssRefreshPath(config: WorkbenchProjectSnapshot['config'], path: string): boolean {
  const normalizedPath = normalizeProjectCssConfigPath(path) ?? normalizeProjectPath(path);
  if (!normalizedPath) return false;
  const compiledCss = getConfiguredProjectTailwindCompiledCssPath(config);
  if (compiledCss && normalizedPath === compiledCss) return true;
  const tokenCss = getTrimmedString(config.paths.tokenCss);
  const normalizedTokenCss = normalizeProjectCssConfigPath(tokenCss);
  return Boolean(normalizedTokenCss && normalizedPath === normalizedTokenCss);
}

function isProjectClassCatalogRefreshPath(path: string): boolean {
  return /\.css$/i.test(normalizeProjectPath(path));
}

function syncProjectPreviewCssNodeMetadata(
  styleNode: HTMLStyleElement,
  path: string,
  tailwindCompiledCssPath: string | null,
) {
  styleNode.dataset.wbProjectLibraryCss = path;
  if (tailwindCompiledCssPath && normalizeProjectPath(path) === tailwindCompiledCssPath) {
    styleNode.dataset[PROJECT_TAILWIND_CSS_DATA_ATTRIBUTE] = 'true';
  } else {
    delete styleNode.dataset[PROJECT_TAILWIND_CSS_DATA_ATTRIBUTE];
  }
}

async function collectProjectEntryCssPaths(
  paths: Set<string>,
  readSourceFile: typeof readWorkbenchSourceFile,
  shouldIncludeCssPath: (path: string) => boolean,
  moduleResolutionCache: Map<string, Promise<string | null>>,
): Promise<void> {
  const entrySourceFiles = new Set<string>();
  const htmlResult = await readSourceFile(PROJECT_HTML_ENTRY_PATH, { allowMissing: true });
  if (htmlResult.ok) {
    for (const stylesheetPath of getHtmlStylesheetPaths(htmlResult.contents)) {
      if (shouldIncludeCssPath(stylesheetPath)) paths.add(stylesheetPath);
    }
    for (const sourceFile of getHtmlModuleScriptPaths(htmlResult.contents)) {
      entrySourceFiles.add(sourceFile);
    }
  }

  const sourceFiles = entrySourceFiles.size > 0
    ? [...entrySourceFiles]
    : PROJECT_DEFAULT_ENTRY_SOURCE_FILES;
  await collectCssImportsFromSourceFiles(paths, sourceFiles, readSourceFile, shouldIncludeCssPath, moduleResolutionCache);
}

async function collectCssImportsFromSourceFiles(
  paths: Set<string>,
  sourceFiles: string[],
  readSourceFile: typeof readWorkbenchSourceFile,
  shouldIncludeCssPath: (path: string) => boolean,
  moduleResolutionCache: Map<string, Promise<string | null>>,
): Promise<void> {
  const visited = new Set<string>();
  await Promise.all(sourceFiles.map((sourceFile) => (
    collectCssImportsFromSourceFile(paths, sourceFile, visited, moduleResolutionCache, 0, readSourceFile, shouldIncludeCssPath)
  )));
}

async function collectCssImportsFromSourceFile(
  paths: Set<string>,
  sourceFile: string,
  visited: Set<string>,
  moduleResolutionCache: Map<string, Promise<string | null>>,
  depth: number,
  readSourceFile: typeof readWorkbenchSourceFile,
  shouldIncludeCssPath: (path: string) => boolean,
): Promise<void> {
  if (depth > PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH) return;
  const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);
  if (!normalizedSourceFile || visited.has(normalizedSourceFile)) return;
  visited.add(normalizedSourceFile);

  // The crawl skips absent sources (most default entry candidates, for one), so it
  // reads every source as a probe.
  const result = await readSourceFile(normalizedSourceFile, { allowMissing: true });
  if (!result.ok) return;

  for (const cssPath of getSourceCssImportPaths(normalizedSourceFile, result.contents)) {
    if (shouldIncludeCssPath(cssPath)) paths.add(cssPath);
  }

  const moduleSourceFiles = await getSourceLocalModuleImportSourceFiles(
    normalizedSourceFile,
    result.contents,
    moduleResolutionCache,
    readSourceFile,
  );
  await Promise.all(moduleSourceFiles.map((moduleSourceFile) => (
    collectCssImportsFromSourceFile(paths, moduleSourceFile, visited, moduleResolutionCache, depth + 1, readSourceFile, shouldIncludeCssPath)
  )));
}

function getProjectLibraryCssPaths(components: WorkbenchProjectSnapshot['components']): string[] {
  const paths = new Set<string>();
  const libraries = components.extensions.libraries ?? {};
  for (const library of Object.values(libraries)) {
    if (!library.snapshotRoot) continue;
    if (!shouldInferProjectLibraryCssPath(library)) continue;
    const cssFileName = getLibraryCssFileNameById(library.id);
    if (!cssFileName) continue;
    const snapshotRoot = normalizeProjectSourceFileReference(library.snapshotRoot).replace(/\/+$/, '');
    if (snapshotRoot) paths.add(`${snapshotRoot}/components/${cssFileName}`);
  }
  return [...paths];
}

function shouldInferProjectLibraryCssPath(library: WorkbenchLibraryRegistryEntry): boolean {
  const snapshotRoot = normalizeProjectSourceFileReference(library.snapshotRoot).replace(/\/+$/, '');
  const sourcePath = normalizeProjectSourceFileReference(library.sourcePath).replace(/\/+$/, '');
  const expectedProjectComponentsRoot = `${snapshotRoot}/components`;
  if (sourcePath === expectedProjectComponentsRoot) return true;
  return snapshotRoot === `src/libraries/${library.id}`;
}

function getProjectLocalLibraryHydrationSignature(
  components: WorkbenchProjectSnapshot['components'],
  pages: WorkbenchProjectSnapshot['pages'],
): string {
  const pageSourceFiles = pages.pages.map((page) => page.sourceFile).sort().join('|');
  const libraries = Object.keys(components.extensions.libraries ?? {}).sort().join('|');
  const componentImports = components.components
    .map((component) => [
      component.sourceFile,
      typeof component.extensions?.importName === 'string' ? component.extensions.importName : '',
      typeof component.extensions?.libraryId === 'string' ? component.extensions.libraryId : '',
    ].join(':'))
    .sort()
    .join('|');
  return `${pageSourceFiles}::${libraries}::${componentImports}`;
}

function getSourceCssImportPaths(sourceFile: string, contents: string): string[] {
  const paths = new Set<string>();
  const importPattern = /\bimport\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+\.css)\1\s*;?/g;
  for (const match of contents.matchAll(importPattern)) {
    const importSource = match[2];
    if (!importSource || !isProjectLocalImportSource(importSource)) continue;
    const resolved = resolveProjectLocalImportSourcePath(sourceFile, importSource);
    if (resolved) paths.add(resolved);
  }
  return [...paths];
}

async function getSourceLocalModuleImportSourceFiles(
  sourceFile: string,
  contents: string,
  moduleResolutionCache: Map<string, Promise<string | null>>,
  readSourceFile: typeof readWorkbenchSourceFile,
): Promise<string[]> {
  const sourceFiles = new Set<string>();
  const importPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+)\1\s*;?/g;
  for (const match of contents.matchAll(importPattern)) {
    const importSource = match[2];
    if (!importSource || !isProjectLocalImportSource(importSource) || /\.css(?:$|[?#])/i.test(importSource)) continue;
    const resolved = resolveProjectLocalImportSourcePath(sourceFile, importSource);
    if (!resolved) continue;
    const resolvedSourceFile = await resolveProjectSourceModulePathCached(resolved, moduleResolutionCache, readSourceFile);
    if (resolvedSourceFile) sourceFiles.add(resolvedSourceFile);
  }
  return [...sourceFiles];
}

function resolveProjectSourceModulePathCached(
  resolvedPath: string,
  moduleResolutionCache: Map<string, Promise<string | null>>,
  readSourceFile: typeof readWorkbenchSourceFile,
): Promise<string | null> {
  const normalized = normalizeProjectSourceFileReference(resolvedPath);
  if (!normalized) return Promise.resolve(null);
  const cached = moduleResolutionCache.get(normalized);
  if (cached) return cached;
  const promise = resolveProjectSourceModulePath(normalized, readSourceFile);
  moduleResolutionCache.set(normalized, promise);
  return promise;
}

async function resolveProjectSourceModulePath(
  resolvedPath: string,
  readSourceFile: typeof readWorkbenchSourceFile,
): Promise<string | null> {
  const normalized = normalizeProjectSourceFileReference(resolvedPath);
  if (!normalized) return null;
  const candidates = hasProjectSourceExtension(normalized)
    ? [normalized]
    : [
        `${normalized}.tsx`,
        `${normalized}.jsx`,
        `${normalized}.ts`,
        `${normalized}.js`,
        `${normalized}/index.tsx`,
        `${normalized}/index.jsx`,
        `${normalized}/index.ts`,
        `${normalized}/index.js`,
      ];
  for (const candidate of candidates) {
    const result = await readSourceFile(candidate, { allowMissing: true });
    if (result.ok) return candidate;
  }
  return null;
}

function getHtmlModuleScriptPaths(contents: string): string[] {
  const paths = new Set<string>();
  for (const attributes of getHtmlTagAttributes(contents, 'script')) {
    const type = attributes.get('type')?.toLowerCase() ?? '';
    if (type && type !== 'module') continue;
    const source = attributes.get('src');
    const path = source ? normalizeHtmlProjectAssetPath(source) : null;
    if (path && hasProjectSourceExtension(path)) paths.add(path);
  }
  return [...paths];
}

function getHtmlStylesheetPaths(contents: string): string[] {
  const paths = new Set<string>();
  for (const attributes of getHtmlTagAttributes(contents, 'link')) {
    const rel = attributes.get('rel')?.toLowerCase() ?? '';
    if (!rel.split(/\s+/).includes('stylesheet')) continue;
    const href = attributes.get('href');
    const path = href ? normalizeHtmlProjectAssetPath(href) : null;
    if (path && /\.css$/i.test(path)) paths.add(path);
  }
  return [...paths];
}

function getHtmlTagAttributes(contents: string, tagName: string): Array<Map<string, string>> {
  const attributesList: Array<Map<string, string>> = [];
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  for (const tagMatch of contents.matchAll(tagPattern)) {
    attributesList.push(parseHtmlAttributes(tagMatch[1] ?? ''));
  }
  return attributesList;
}

function parseHtmlAttributes(attributesSource: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of attributesSource.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function normalizeHtmlProjectAssetPath(rawPath: string): string | null {
  const path = normalizeProjectPath(rawPath.split(/[?#]/, 1)[0] ?? '');
  if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return null;
  const withoutLeadingSlash = path.replace(/^\/+/, '');
  const normalized = withoutLeadingSlash.replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('../')) return null;
  return normalized;
}

function hasProjectSourceExtension(path: string): boolean {
  return /\.(tsx|jsx|ts|js)$/i.test(path);
}

function normalizeProjectPath(path: string): string {
  return path.trim().replace(/\\/g, '/');
}

function normalizeProjectCssConfigPath(value: string | null): string | null {
  if (!value) return null;
  const rawPath = value.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const normalizedPath = normalizeConfiguredProjectCssPath(rawPath);
  if (!normalizedPath || !normalizedPath.toLowerCase().endsWith('.css') || normalizedPath.startsWith('../')) {
    return null;
  }
  if (normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || ['.git', '.workbench', 'dist', 'node_modules'].includes(part))) {
    return null;
  }
  return normalizedPath;
}

function normalizeConfiguredProjectCssPath(rawPath: string): string | null {
  const normalized = rawPath.replace(/^\.\//, '');
  if (!isLikelyAbsoluteProjectCssPath(normalized)) return normalized.replace(/^\/+/, '');
  const withoutProtocolPrefix = normalized
    .replace(/^file:\/+/i, '')
    .replace(/^@fs\//, '')
    .replace(/^\/+/, '');
  if (isKnownProjectCssRootPath(withoutProtocolPrefix)) return withoutProtocolPrefix;
  return getProjectCssRootSuffix(withoutProtocolPrefix);
}

function isLikelyAbsoluteProjectCssPath(path: string): boolean {
  return path.startsWith('/') ||
    path.startsWith('@fs/') ||
    path.startsWith('file:/') ||
    /^[a-z]:\//i.test(path);
}

function isKnownProjectCssRootPath(path: string): boolean {
  const firstSegment = path.split('/')[0] ?? '';
  return PROJECT_CSS_CONFIG_ROOT_SEGMENTS.includes(firstSegment);
}

function getProjectCssRootSuffix(path: string): string | null {
  const normalized = `/${path.replace(/^\/+/, '')}`;
  for (const segment of PROJECT_CSS_CONFIG_ROOT_SEGMENTS) {
    const marker = `/${segment}/`;
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) return normalized.slice(index + 1);
  }
  return null;
}

function normalizeProjectPreviewCssForWorkbench(css: string): string {
  return css
    .replace(/container:([_a-zA-Z][\w-]*)\/inline-size/g, 'container: $1 / inline-size')
    .replace(/container-type:inline-size/g, 'container-type: inline-size')
    .replace(/\((?:width|inline-size)\s*>=\s*([^)]+?)\)/g, '(min-width: $1)')
    .replace(/\((?:width|inline-size)\s*<=\s*([^)]+?)\)/g, '(max-width: $1)')
    .replace(/\((?:height|block-size)\s*>=\s*([^)]+?)\)/g, '(min-height: $1)')
    .replace(/\((?:height|block-size)\s*<=\s*([^)]+?)\)/g, '(max-height: $1)')
    .replace(/\((width|height|inline-size|block-size)\s*([<>]=?|=)\s*([^)]+?)\)/g, '($1 $2 $3)');
}

/**
 * Scope classes for every imported library, e.g. `['library-a-scope', 'library-b-scope']`.
 * Used to wrap design previews and seed new page templates so each library's
 * custom properties resolve in cascade.
 */
function getProjectLibraryScopeClasses(components: WorkbenchProjectSnapshot['components']): string[] {
  const scopes = new Set<string>();
  const libraries = components.extensions.libraries ?? {};
  for (const library of Object.values(libraries)) {
    if (!library.id) continue;
    scopes.add(`${library.id}-scope`);
  }
  return [...scopes];
}

function getProjectTemplateId(extensions: Record<string, unknown>): string | null {
  const projectTemplate = extensions.projectTemplate;
  if (!isRecord(projectTemplate)) return null;
  const id = projectTemplate.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getSourceChildrenSlotKindExtension(extensions: Record<string, unknown> | undefined): DeclaredSourceSlotKind | null {
  const value = getStringExtension(extensions, 'childrenSlotKind');
  return value === 'block' || value === 'inline' || value === 'leaf' ? value : null;
}

function getStringArrayExtension(extensions: Record<string, unknown> | undefined, key: string): string[] {
  const value = extensions?.[key];
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => getTrimmedString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function getImportedComponentFallbackName(projectPath: string, fileName: string): string {
  const baseName = fileName.replace(/\.(tsx|jsx|ts|js|css|json)$/i, '');
  const pathParts = projectPath.split('/').filter(Boolean);
  const sourceName = baseName.toLowerCase() === 'index'
    ? pathParts[pathParts.length - 2] ?? baseName
    : baseName;
  return toPascalCaseIdentifier(sourceName) || 'ImportedComponent';
}

function toPascalCaseIdentifier(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9_$]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
  const candidate = words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join('');
  return /^[A-Za-z_$][\w$]*$/.test(candidate) ? candidate : '';
}

function createSelectionForSurface(
  selection: WorkbenchSelectionState,
  surface: WorkbenchSurface,
  snapshot: WorkbenchProjectSnapshot,
  options: { updateTimestamp?: boolean } = {},
): WorkbenchSelectionState {
  const updatedAt = options.updateTimestamp === false ? selection.updatedAt : new Date().toISOString();
  if (surface === 'tokens') {
    return {
      ...selection,
      updatedAt,
      extensions: {
        ...selection.extensions,
        activeWorkbenchSurface: 'tokens',
      },
    };
  }

  if (surface === 'storybook') {
    return {
      ...selection,
      updatedAt,
      extensions: {
        ...selection.extensions,
        activeWorkbenchSurface: 'storybook',
      },
    };
  }

  if (surface === 'assets') {
    return {
      ...selection,
      updatedAt,
      extensions: {
        ...selection.extensions,
        activeWorkbenchSurface: 'assets',
      },
    };
  }

  const target = getDesignTargetFromSelection(selection, snapshot);
  return {
    ...selection,
    activeTarget: target,
    selectedTargets: target ? [target] : [],
    updatedAt,
    extensions: {
      ...selection.extensions,
      ...getDesignTargetExtensions(target),
      activeWorkbenchSurface: 'design',
    },
  };
}

function getDesignTargetFromSelection(
  selection: WorkbenchSelectionState,
  snapshot: WorkbenchProjectSnapshot,
): WorkbenchSelectionTarget | null {
  if (selection.activeTarget?.kind === 'page' && selection.activeTarget.pageId) {
    const page = snapshot.pages.pages.find((candidate) => candidate.id === selection.activeTarget?.pageId);
    if (page) return createPageSelectionTarget(page.id, page.sourceFile);
  }

  if (selection.activeTarget?.kind === 'component' && selection.activeTarget.componentId) {
    const component = snapshot.components.components.find((candidate) => candidate.id === selection.activeTarget?.componentId);
    if (component) return createComponentSelectionTarget(component.id, component.sourceFile);
  }

  const extensionKind = selection.extensions.activeDesignTargetKind;
  const extensionId = selection.extensions.activeDesignTargetId;
  if (extensionKind === 'page' && extensionId) {
    const page = snapshot.pages.pages.find((candidate) => candidate.id === extensionId);
    if (page) return createPageSelectionTarget(page.id, page.sourceFile);
  }
  if (extensionKind === 'component' && extensionId) {
    const component = snapshot.components.components.find((candidate) => candidate.id === extensionId);
    if (component) return createComponentSelectionTarget(component.id, component.sourceFile);
  }

  return null;
}

function getDesignTargetExtensions(target: WorkbenchSelectionTarget | null): Record<string, unknown> {
  if (!target) {
    return {
      activeDesignTargetKind: null,
      activeDesignTargetId: null,
      activeDesignSourceFile: null,
      activeDesignStoryArgs: null,
      activeDesignStoryComponentId: null,
      activeDesignLayerId: null,
      selectedDesignLayerIds: [],
    };
  }
  if (target.kind === 'page') {
    return {
      activeDesignTargetKind: 'page',
      activeDesignTargetId: target.pageId ?? null,
      activeDesignSourceFile: target.sourceFile ?? null,
    };
  }
  if (target.kind === 'component') {
    return {
      activeDesignTargetKind: 'component',
      activeDesignTargetId: target.componentId ?? null,
      activeDesignSourceFile: target.sourceFile ?? null,
    };
  }
  return {};
}

function getStorybookActiveTargetFromSelection(selection: WorkbenchSelectionState): StorybookActiveTarget | null {
  const kind = selection.extensions.activeStorybookTargetKind;
  const id = selection.extensions.activeStorybookTargetId;
  if (!id) return null;
  if (kind === 'component' || kind === 'foundation') return { kind, id };
  return null;
}

function createPageSelectionTarget(pageId: string, sourceFile: string): WorkbenchSelectionTarget {
  return {
    kind: 'page',
    pageId,
    sourceFile,
  };
}

function createComponentSelectionTarget(componentId: string, sourceFile: string): WorkbenchSelectionTarget {
  return {
    kind: 'component',
    componentId,
    sourceFile,
  };
}

function getTokenSelectionAnchor(selection: WorkbenchSelectionState): TokenReference | null {
  const collectionId = selection.extensions.tokenSelectionAnchorCollectionId;
  const tokenId = selection.extensions.tokenSelectionAnchorId;
  return collectionId && tokenId ? { collectionId, tokenId } : null;
}

function getActiveTokenReference(selection: WorkbenchSelectionSnapshot): TokenReference | null {
  return typeof selection.selectedTokenCollectionId === 'string' && typeof selection.selectedTokenId === 'string'
    ? { collectionId: selection.selectedTokenCollectionId, tokenId: selection.selectedTokenId }
    : selection.selectedTokenRefs?.[0] ?? null;
}

function getSelectedTokenReferences(
  selection: WorkbenchSelectionSnapshot,
  activeReference: TokenReference | null,
): TokenReference[] {
  return dedupeTokenReferences([
    ...(activeReference ? [activeReference] : []),
    ...(selection.selectedTokenRefs ?? []),
  ]);
}

function createTokenSelectionTarget(reference: TokenReference): WorkbenchSelectionTarget {
  return {
    kind: 'token',
    tokenId: reference.tokenId,
    extensions: { collectionId: reference.collectionId },
  };
}

function tokenReferenceFromTarget(target: WorkbenchSelectionTarget | null): TokenReference | null {
  if (target?.kind !== 'token' || typeof target.tokenId !== 'string') return null;
  const collectionId = getStringExtension(target.extensions, 'collectionId');
  return collectionId ? { collectionId, tokenId: target.tokenId } : null;
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' ? value : null;
}

function dedupeTokenReferences(references: TokenReference[]): TokenReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.collectionId}:${reference.tokenId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
