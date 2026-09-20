import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import {
  chooseWorkbenchProjectFolder,
  closeWorkbenchProject,
  createWorkbenchProject,
  loadWorkbenchProject,
  openWorkbenchProject,
  retryWorkbenchProjectDependencies,
  type WorkbenchProjectTemplateId,
  type WorkbenchProjectLoadResult,
} from '@domain/project/workbenchProjectLoader';
import {
  createWorkbenchCoreBootstrapRequest,
  createWorkbenchCoreClient,
  type WorkbenchCoreBootstrapResponse,
} from '@domain/core/workbenchCoreClient';
import {
  checkWorkbenchHostConnection,
  clearWorkbenchLocalBridgePairing,
  connectWorkbenchLocalBridgePairing,
  getWorkbenchHostStatus,
  hydrateWorkbenchLocalBridgePairingFromUrl,
  rotateWorkbenchLocalBridgeToken,
  subscribeWorkbenchHostEvents,
  type WorkbenchHostPairingInput,
  type WorkbenchHostConnectionCheck,
} from '@domain/project/workbenchHostTransport';
import type { WorkbenchSelectionState } from '@domain/project/workbenchProject';
import type { TokenEditorSaveStatus } from './TokenEditor';
import { ProjectWorkspace } from './ProjectWorkspace';
import { ThemeModeToggle, type WorkbenchThemeMode } from './ThemeModeToggle';
import { WorkbenchTopbarActionsProvider } from './WorkbenchTopbarActions';
import type { WorkbenchSurface } from './WorkbenchSurfaceNav';
import { IconButton } from '@shared/ui/primitives';

type AppTopbarStatus = TokenEditorSaveStatus;
const THEME_STORAGE_KEY = 'workbench-v1.themeMode';
// Focus/visibility re-sync is a fallback for hosts with no change-event channel. Where the
// local bridge does deliver project-changed events, this is how often a focus is still
// allowed to force a full reload so a dropped event heals on its own.
const PROJECT_FOCUS_SYNC_FALLBACK_INTERVAL_MS = 60_000;
const PROJECT_FOLDER_ALREADY_EXISTS_MESSAGE = 'Project folder already exists.';
const OpenSourceLicensesModal = lazy(() => import('./OpenSourceLicensesModal').then((module) => ({
  default: module.OpenSourceLicensesModal,
})));
const InitializeProjectModal = lazy(() => import('./ProjectChrome').then((module) => ({
  default: module.InitializeProjectModal,
})));
const ProjectInfoLayer = lazy(() => import('./ProjectChrome').then((module) => ({
  default: module.ProjectInfoLayer,
})));
const ProjectMenu = lazy(() => import('./ProjectChrome').then((module) => ({
  default: module.ProjectMenu,
})));
const ProjectMessageModal = lazy(() => import('./ProjectChrome').then((module) => ({
  default: module.ProjectMessageModal,
})));
const HostConnectionPanel = lazy(() => import('./HostConnectionPanel').then((module) => ({
  default: module.HostConnectionPanel,
})));

export function WorkbenchShell() {
  const [projectLoadResult, setProjectLoadResult] =
    useState<WorkbenchProjectLoadResult>({
      status: 'loading',
      message: 'Loading project...',
    });
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [openSourceLicensesOpen, setOpenSourceLicensesOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [hostPanelOpen, setHostPanelOpen] = useState(false);
  const [hostCheck, setHostCheck] = useState<WorkbenchHostConnectionCheck | null>(null);
  const [hostChecking, setHostChecking] = useState(false);
  const [hostConnecting, setHostConnecting] = useState(false);
  const [hostRotating, setHostRotating] = useState(false);
  const [coreBootstrap, setCoreBootstrap] = useState<WorkbenchCoreBootstrapResponse | null>(null);
  const [coreError, setCoreError] = useState<string | null>(null);
  const [initializeModalOpen, setInitializeModalOpen] = useState(false);
  const [projectActionState, setProjectActionState] = useState<'idle' | 'opening' | 'initializing' | 'closing'>('idle');
  const [projectMessage, setProjectMessage] = useState<{ title: string; message: string } | null>(null);
  const [activeSurface, setActiveSurface] = useState<WorkbenchSurface | null>(null);
  const [topbarStatus, setTopbarStatus] = useState<AppTopbarStatus>(null);
  const [topbarActionsHost, setTopbarActionsHost] = useState<HTMLElement | null>(null);
  const [themeMode, setThemeMode] = useState<WorkbenchThemeMode>(() => readStoredThemeMode());
  const projectControlsRef = useRef<HTMLDivElement | null>(null);
  const hostControlsRef = useRef<HTMLDivElement | null>(null);
  const coreClientRef = useRef(createWorkbenchCoreClient());
  const projectLoadResultRef = useRef(projectLoadResult);
  const activeSurfaceRef = useRef<WorkbenchSurface | null>(activeSurface);
  const latestLocalSurfaceChangeAtRef = useRef(0);
  const previewCssIssueKeyRef = useRef<string | null>(null);
  const syncProjectSnapshotFromDiskRef = useRef<() => Promise<void>>(async () => {});

  const checkHostConnection = useCallback(async () => {
    setHostChecking(true);
    const result = await checkWorkbenchHostConnection();
    setHostCheck(result);
    setHostChecking(false);
  }, []);

  useEffect(() => {
    hydrateWorkbenchLocalBridgePairingFromUrl();
    void checkHostConnection();
  }, [checkHostConnection]);

  const bootstrapCoreForProject = useCallback((result: WorkbenchProjectLoadResult) => {
    if (result.status !== 'ready') {
      setCoreBootstrap(null);
      setCoreError(null);
      return () => {};
    }

    let cancelled = false;
    const request = createWorkbenchCoreBootstrapRequest(result.snapshot);
    coreClientRef.current.bootstrap(request)
      .then((result) => {
        if (cancelled) return;
        setCoreBootstrap(result);
        setCoreError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setCoreBootstrap(null);
        setCoreError(error instanceof Error ? error.message : 'Workbench core bootstrap failed');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => bootstrapCoreForProject(projectLoadResult), [bootstrapCoreForProject, projectLoadResult]);

  useEffect(() => {
    if (projectLoadResult.status !== 'loading') return undefined;

    let cancelled = false;
    let timeout: number | undefined;
    const pollProjectLoad = () => {
      timeout = window.setTimeout(() => {
        void loadWorkbenchProject().then((result) => {
          if (cancelled) return;
          if (result.status === 'loading') {
            pollProjectLoad();
            return;
          }
          if (result.status === 'ready') {
            applySurfaceFromSelection(result.snapshot.selection);
          }
          setProjectLoadResult(result);
        });
      }, 500);
    };
    pollProjectLoad();

    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [projectLoadResult.status]);

  useEffect(() => {
    projectLoadResultRef.current = projectLoadResult;
  }, [projectLoadResult]);
  useEffect(() => {
    activeSurfaceRef.current = activeSurface;
  }, [activeSurface]);

  useEffect(() => {
    if (!topbarStatus || topbarStatus.state === 'pending' || topbarStatus.state === 'saving') return undefined;

    const timeout = window.setTimeout(() => {
      setTopbarStatus(null);
    }, topbarStatus.state === 'error' ? 4500 : 2200);

    return () => window.clearTimeout(timeout);
  }, [topbarStatus?.message, topbarStatus?.state]);

  const handleTopbarTokenStatusChange = useCallback((status: AppTopbarStatus) => {
    setTopbarStatus(status);
  }, []);

  const refreshCoreAfterAuthChange = useCallback(() => {
    bootstrapCoreForProject(projectLoadResultRef.current);
  }, [bootstrapCoreForProject]);

  useEffect(() => {
    document.documentElement.dataset.wbTheme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));
  }, []);
  const applySurfaceFromSelection = useCallback((selection: WorkbenchSelectionState) => {
    if (!shouldApplySurfaceFromSelection(selection, latestLocalSurfaceChangeAtRef.current)) return;
    const nextSurface = getWorkbenchSurfaceFromSelection(selection);
    if (activeSurfaceRef.current === nextSurface) return;
    activeSurfaceRef.current = nextSurface;
    setActiveSurface(nextSurface);
  }, []);
  const handleSurfaceChange = useCallback((surface: WorkbenchSurface) => {
    latestLocalSurfaceChangeAtRef.current = Date.now();
    activeSurfaceRef.current = surface;
    setActiveSurface(surface);
  }, []);

  useEffect(() => {
    if (!projectInfoOpen && !projectMenuOpen && !hostPanelOpen) return undefined;

    function closeProjectLayersOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        projectControlsRef.current?.contains(target) ||
        hostControlsRef.current?.contains(target)
      ) {
        return;
      }
      setProjectInfoOpen(false);
      setProjectMenuOpen(false);
      setHostPanelOpen(false);
    }

    function closeProjectLayersOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setProjectInfoOpen(false);
      setProjectMenuOpen(false);
      setHostPanelOpen(false);
    }

    document.addEventListener('pointerdown', closeProjectLayersOnOutsidePointer, true);
    document.addEventListener('keydown', closeProjectLayersOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeProjectLayersOnOutsidePointer, true);
      document.removeEventListener('keydown', closeProjectLayersOnEscape);
    };
  }, [hostPanelOpen, projectInfoOpen, projectMenuOpen]);

  useEffect(() => {
    if (hostPanelOpen) void checkHostConnection();
  }, [checkHostConnection, hostPanelOpen]);

  async function refreshProject(options: { message?: string; silent?: boolean } = {}) {
    if (!options.silent) {
      setProjectLoadResult({
        status: 'loading',
        message: options.message ?? 'Loading project...',
      });
    }
    const result = await loadWorkbenchProject();
    if (result.status === 'ready') {
      applySurfaceFromSelection(result.snapshot.selection);
    }
    setProjectLoadResult(result);
    if (result.status !== 'ready') {
      setProjectInfoOpen(false);
      setProjectMenuOpen(false);
    }
  }

  async function recoverProject() {
    const current = projectLoadResultRef.current;
    // An open project reports a failed install on its snapshot; only a project that
    // could not load at all still carries the recovery hint on the error result.
    const shouldRetryDependencyInstall = current.status === 'ready'
      ? current.snapshot.location.dependencyInstall?.status === 'failed'
      : current.status === 'error' && current.recovery === 'retry-dependency-install';

    if (shouldRetryDependencyInstall) {
      const retryResult = await retryWorkbenchProjectDependencies();
      if (!retryResult.ok) {
        setProjectMessage({ title: 'Could not reinstall dependencies', message: retryResult.message });
      }
      await refreshProject();
      return;
    }
    await refreshProject();
  }

  async function syncProjectSnapshotFromDisk() {
    const current = projectLoadResultRef.current;
    if (current.status !== 'ready') return;

    const result = await loadWorkbenchProject({ reuseHistory: current.snapshot.history });
    const resultSignature = result.status === 'ready'
      ? JSON.stringify(result.snapshot)
      : JSON.stringify({ status: result.status, message: result.message });
    const currentSignature = JSON.stringify(current.snapshot);
    if (resultSignature === currentSignature) return;

    if (result.status === 'ready') {
      applySurfaceFromSelection(result.snapshot.selection);
    }
    setProjectLoadResult(result);
    if (result.status !== 'ready') {
      setProjectInfoOpen(false);
      setProjectMenuOpen(false);
    }
  }

  useEffect(() => {
    syncProjectSnapshotFromDiskRef.current = syncProjectSnapshotFromDisk;
  });

  async function openProjectFromFinder(currentRootPath: string | null) {
    setProjectMenuOpen(false);
    setProjectActionState('opening');

    const folder = await chooseWorkbenchProjectFolder('open-project');
    if (!folder.ok) {
      setProjectActionState('idle');
      if (!folder.cancelled) {
        setProjectMessage({ title: 'Could not open project', message: folder.message });
      }
      return;
    }

    if (currentRootPath && areProjectRootsEqual(folder.rootPath, currentRootPath)) {
      setProjectActionState('idle');
      setProjectMessage({ title: 'Project already open', message: 'The selected project is already open.' });
      return;
    }

    const result = await openWorkbenchProject(folder.rootPath);
    if (!result.ok) {
      setProjectActionState('idle');
      setProjectMessage({ title: 'Could not open project', message: result.message });
      return;
    }

    await refreshProject();
    if (result.location.dependencyInstall?.status === 'failed') {
      setProjectMessage({
        title: 'Project initialized, dependencies not installed',
        message: result.location.dependencyInstall.message
          ? `The project was created, but npm install did not finish. ${result.location.dependencyInstall.message}`
          : 'The project was created, but npm install did not finish. Run npm install in the project folder and try again.',
      });
    }
    setProjectInfoOpen(false);
    setProjectActionState('idle');
  }

  async function initializeProjectFromFinder(projectName: string, templateId: WorkbenchProjectTemplateId) {
    const trimmedProjectName = projectName.trim();
    if (!trimmedProjectName) {
      setProjectMessage({ title: 'Project name required', message: 'Enter a project name before initializing.' });
      return;
    }

    setInitializeModalOpen(false);
    setProjectActionState('initializing');

    const folder = await chooseWorkbenchProjectFolder('create-parent');
    if (!folder.ok) {
      setProjectActionState('idle');
      if (!folder.cancelled) {
        setProjectMessage({ title: 'Could not initialize project', message: folder.message });
      }
      return;
    }

    const result = await createWorkbenchProject(folder.rootPath, trimmedProjectName, templateId);
    if (!result.ok) {
      setProjectActionState('idle');
      setProjectMessage(result.message === PROJECT_FOLDER_ALREADY_EXISTS_MESSAGE
        ? {
            title: 'Project already exists',
            message: `A folder named “${trimmedProjectName}” already exists in the selected location. Choose another project name or location.`,
          }
        : { title: 'Could not initialize project', message: result.message });
      return;
    }

    await refreshProject({
      message: `Project “${trimmedProjectName}” was created. Installing dependencies and preparing the workspace…`,
    });
    setProjectInfoOpen(false);
    setProjectActionState('idle');
  }

  async function closeCurrentProject() {
    setProjectActionState('closing');
    const result = await closeWorkbenchProject();
    if (!result.ok) {
      setProjectActionState('idle');
      setProjectMessage({ title: 'Could not close project', message: result.message });
      return;
    }

    setProjectInfoOpen(false);
    setProjectMenuOpen(false);
    activeSurfaceRef.current = null;
    setActiveSurface(null);
    setProjectLoadResult({
      status: 'missing',
      message: 'No Workbench project is open. Choose a project folder or initialize a new one.',
    });
    setProjectActionState('idle');
  }

  function disconnectBridgePairing() {
    if (!getWorkbenchHostStatus().canDisconnect) return;
    clearWorkbenchLocalBridgePairing();
    setHostPanelOpen(false);
    setHostCheck(null);
    window.location.reload();
  }

  async function connectBridgePairing(input: WorkbenchHostPairingInput) {
    setHostConnecting(true);
    const result = await connectWorkbenchLocalBridgePairing(input);
    setHostCheck(result);
    setHostConnecting(false);
    if (result.state === 'connected') {
      setHostPanelOpen(false);
      window.location.reload();
    }
  }

  async function rotateBridgeToken() {
    setHostRotating(true);
    const result = await rotateWorkbenchLocalBridgeToken();
    setHostCheck(result);
    setHostRotating(false);
  }

  useEffect(() => {
    let cancelled = false;

    loadWorkbenchProject().then((result) => {
      if (cancelled) return;
      if (result.status === 'ready') {
        applySurfaceFromSelection(result.snapshot.selection);
      }
      setProjectLoadResult(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (projectLoadResult.status !== 'ready') return undefined;

    let cancelled = false;
    let syncInFlight = false;
    let lastSyncAt = Date.now();
    const sync = () => {
      if (cancelled || syncInFlight) return;
      // A re-sync refetches the whole registry — assets.json alone is ~1MB on a real
      // project — and then throws it away when the JSON signature matches. Under the local
      // bridge, project-changed events already drive re-sync, so paying that on every
      // window focus and visibility change is pure waste. Keep a widely spaced fallback so
      // a dropped event still heals, and leave hosts without an event channel unthrottled.
      const throttleMs = getWorkbenchHostStatus().kind === 'local-bridge'
        ? PROJECT_FOCUS_SYNC_FALLBACK_INTERVAL_MS
        : 0;
      const now = Date.now();
      if (throttleMs > 0 && now - lastSyncAt < throttleMs) return;
      lastSyncAt = now;
      syncInFlight = true;
      void syncProjectSnapshotFromDisk().finally(() => {
        syncInFlight = false;
      });
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };

    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [projectLoadResult.status]);

  useEffect(() => {
    if (projectLoadResult.status !== 'ready' || getWorkbenchHostStatus().kind !== 'local-bridge') return undefined;

    let syncTimeout: number | null = null;
    const scheduleSync = () => {
      if (syncTimeout !== null) window.clearTimeout(syncTimeout);
      syncTimeout = window.setTimeout(() => {
        syncTimeout = null;
        void syncProjectSnapshotFromDiskRef.current();
      }, 180);
    };

    const unsubscribe = subscribeWorkbenchHostEvents(
      (event) => {
        if (event.type === 'project-opened') {
          previewCssIssueKeyRef.current = null;
          scheduleSync();
          return;
        }
        if (event.type === 'project-changed') {
          scheduleSync();
          return;
        }
        if (event.type === 'preview-css-status') {
          const freshness = event.previewCss.renderFreshness;
          if (freshness.ready) {
            previewCssIssueKeyRef.current = null;
            return;
          }
          if (!['failed', 'unavailable', 'unrepresentative'].includes(freshness.state)) return;
          const issueKey = `${event.rootPath}:${freshness.state}:${freshness.reason}:${freshness.error ?? ''}`;
          if (previewCssIssueKeyRef.current === issueKey) return;
          previewCssIssueKeyRef.current = issueKey;
          setProjectMessage({
            title: freshness.state === 'failed'
              ? 'Preview CSS synchronization failed'
              : freshness.state === 'unrepresentative'
                ? 'Preview CSS is not project-representative'
                : 'Preview CSS could not be verified',
            message: freshness.error
              ? `${freshness.reason} ${freshness.error}`
              : freshness.reason,
          });
          return;
        }

        setHostCheck({
          checkedAt: event.emittedAt,
          message: event.message,
          state: 'offline',
        });
      },
      (message) => {
        setHostCheck({
          checkedAt: new Date().toISOString(),
          message,
          state: 'offline',
        });
      },
    );

    return () => {
      unsubscribe();
      if (syncTimeout !== null) window.clearTimeout(syncTimeout);
    };
  }, [projectLoadResult.status]);

  const resolvedActiveSurface = projectLoadResult.status === 'ready'
    ? activeSurface ?? getWorkbenchSurfaceFromSelection(projectLoadResult.snapshot.selection)
    : activeSurface ?? 'tokens';
  const hostStatus = getWorkbenchHostStatus();
  const hostStatusTone = hostCheck?.state === 'offline' ? 'offline' : hostStatus.kind;
  const coreStatusLabel = coreBootstrap
    ? getWorkbenchCoreModeLabel(coreBootstrap.mode)
    : coreError ? 'Core unavailable' : 'Checking core';
  const reloadWorkbenchApp = useCallback(() => {
    window.location.reload();
  }, []);
  const renderShellUtilityControls = (placement: 'titlebar' | 'topbar') => (
    <div className={`wb-shell-utility-controls wb-shell-utility-controls--${placement}`}>
      <div className="wb-host-controls" ref={hostControlsRef}>
        <button
          type="button"
          className={`wb-host-status wb-host-status--${hostStatusTone}`}
          aria-expanded={hostPanelOpen}
          aria-haspopup="dialog"
          title={hostStatus.bridgeUrl ? `Local bridge: ${hostStatus.bridgeUrl}` : 'Same-origin local project host'}
          onClick={() => {
            setHostPanelOpen((open) => !open);
            setProjectInfoOpen(false);
            setProjectMenuOpen(false);
          }}
        >
          <span className="wb-host-status-dot" aria-hidden="true" />
          {hostStatus.label}
        </button>
        {hostPanelOpen ? (
          <Suspense fallback={null}>
            <HostConnectionPanel
              checking={hostChecking}
              connecting={hostConnecting}
              checkResult={hostCheck}
              coreStatusLabel={coreStatusLabel}
              hostStatus={hostStatus}
              rotating={hostRotating}
              themeMode={themeMode}
              onCheck={() => void checkHostConnection()}
              onClose={() => setHostPanelOpen(false)}
              onConnect={(input) => void connectBridgePairing(input)}
              onDisconnect={disconnectBridgePairing}
              onRotateToken={() => void rotateBridgeToken()}
            />
          </Suspense>
        ) : null}
      </div>
      <IconButton
        className="wb-app-refresh-button"
        label="Reload app"
        title="Reload app"
        onClick={reloadWorkbenchApp}
      >
        <RefreshCw size={13} />
      </IconButton>
      <ThemeModeToggle mode={themeMode} onToggle={toggleThemeMode} />
      {topbarStatus ? (
        <span className={`wb-topbar-note wb-topbar-note--${topbarStatus.state}`}>
          {topbarStatus.message}
        </span>
      ) : null}
      <div className="wb-topbar-surface-actions" ref={setTopbarActionsHost} />
    </div>
  );
  const renderProjectControls = (placement: 'titlebar' | 'topbar') => {
    if (projectLoadResult.status !== 'ready') {
      return placement === 'topbar' ? <span className="wb-project-topbar-placeholder" aria-hidden="true" /> : null;
    }

    return (
      <div className={`wb-project-controls wb-project-controls--${placement}`} ref={projectControlsRef}>
        <button
          type="button"
          className="wb-project-trigger"
          aria-expanded={projectInfoOpen}
          aria-haspopup="dialog"
          onClick={() => {
            setProjectInfoOpen((open) => !open);
            setProjectMenuOpen(false);
            setHostPanelOpen(false);
          }}
        >
          {projectLoadResult.snapshot.config.projectName}
        </button>
        <button
          type="button"
          className="wb-project-menu-trigger"
          aria-expanded={projectMenuOpen}
          aria-haspopup="menu"
          aria-label="Project menu"
          title="Project menu"
          onClick={() => {
            setProjectMenuOpen((open) => !open);
            setProjectInfoOpen(false);
            setHostPanelOpen(false);
          }}
        >
          <ChevronDown size={13} />
        </button>
        {projectInfoOpen ? (
          <Suspense fallback={null}>
            <ProjectInfoLayer
              closing={projectActionState === 'closing'}
              snapshot={projectLoadResult.snapshot}
              onClose={() => setProjectInfoOpen(false)}
              onCloseProject={() => void closeCurrentProject()}
              onOpenLicenses={() => {
                setProjectInfoOpen(false);
                setOpenSourceLicensesOpen(true);
              }}
            />
          </Suspense>
        ) : null}
        {projectMenuOpen ? (
          <Suspense fallback={null}>
            <ProjectMenu
              busyState={projectActionState}
              onInitializeProject={() => {
                setProjectMenuOpen(false);
                setInitializeModalOpen(true);
              }}
              onOpenProject={() => void openProjectFromFinder(projectLoadResult.snapshot.location.rootPath)}
            />
          </Suspense>
        ) : null}
      </div>
    );
  };

  return (
    <main className="wb-root" data-wb-shell="browser" data-wb-theme={themeMode}>
      <header className="wb-topbar">
        <div className="wb-brand">
          {renderProjectControls('topbar')}
        </div>
        <div className="wb-topbar-right">
          {renderShellUtilityControls('topbar')}
        </div>
      </header>

      <section className="wb-main">
        <WorkbenchTopbarActionsProvider host={topbarActionsHost}>
          <ProjectWorkspace
            onTokenStatusChange={handleTopbarTokenStatusChange}
            onInitializeProject={() => setInitializeModalOpen(true)}
            onOpenLicenses={() => setOpenSourceLicensesOpen(true)}
            onOpenProject={() => void openProjectFromFinder(null)}
            onRetryProject={() => void recoverProject()}
            activeSurface={resolvedActiveSurface}
            onSurfaceChange={handleSurfaceChange}
            projectLoadResult={projectLoadResult}
          />
        </WorkbenchTopbarActionsProvider>
      </section>
      {initializeModalOpen ? (
        <Suspense fallback={null}>
          <InitializeProjectModal
            busy={projectActionState === 'initializing'}
            onClose={() => setInitializeModalOpen(false)}
            onInitialize={(projectName, templateId) => void initializeProjectFromFinder(projectName, templateId)}
          />
        </Suspense>
      ) : null}
      {openSourceLicensesOpen ? (
        <Suspense fallback={null}>
          <OpenSourceLicensesModal onClose={() => setOpenSourceLicensesOpen(false)} />
        </Suspense>
      ) : null}
      {projectMessage ? (
        <Suspense fallback={null}>
          <ProjectMessageModal
            message={projectMessage.message}
            title={projectMessage.title}
            onClose={() => setProjectMessage(null)}
          />
        </Suspense>
      ) : null}
    </main>
  );
}

function getWorkbenchCoreModeLabel(mode: WorkbenchCoreBootstrapResponse['mode']): string {
  if (mode === 'remote') return 'Remote core';
  return 'Local fallback';
}

function readStoredThemeMode(): WorkbenchThemeMode {
  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedMode === 'light' || storedMode === 'dark' ? storedMode : 'dark';
  } catch {
    return 'dark';
  }
}

function getWorkbenchSurfaceFromSelection(selection: WorkbenchSelectionState): WorkbenchSurface {
  const storedSurface = selection.extensions.activeWorkbenchSurface;
  if (storedSurface === 'tokens' || storedSurface === 'assets' || storedSurface === 'storybook' || storedSurface === 'design') {
    return storedSurface;
  }

  const activeKind = selection.activeTarget?.kind;
  if (activeKind === 'page' || activeKind === 'component' || activeKind === 'node') return 'design';
  return 'tokens';
}

function shouldApplySurfaceFromSelection(
  selection: WorkbenchSelectionState,
  latestLocalSurfaceChangeAt: number,
): boolean {
  if (latestLocalSurfaceChangeAt <= 0) return true;
  const selectionTime = Date.parse(selection.updatedAt ?? '');
  return Number.isFinite(selectionTime) && selectionTime >= latestLocalSurfaceChangeAt;
}

function areProjectRootsEqual(left: string, right: string): boolean {
  return normalizeProjectRootPath(left) === normalizeProjectRootPath(right);
}

function normalizeProjectRootPath(path: string): string {
  const trimmed = path.trim();
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, '') : trimmed;
}
