export type ProjectTailwindPreviewCssConfig = {
  compiledCss: string | null;
  enabled: boolean;
  sourceCss: string | null;
  tokenCss: string | null;
};

export type WorkbenchPreviewCssMode = 'compiled' | 'disabled' | 'fallback';
export type WorkbenchPreviewCssFreshnessState =
  | 'failed'
  | 'ready'
  | 'stale'
  | 'syncing'
  | 'unavailable'
  | 'unrepresentative';

export type WorkbenchPreviewCssRenderFreshness = {
  error: string | null;
  fresh: boolean;
  inputRevision: string | null;
  outputRevision: string | null;
  ready: boolean;
  reason: string;
  representative: boolean;
  state: WorkbenchPreviewCssFreshnessState;
};

export type WorkbenchPreviewCssSyncResult = {
  compiledCss: string | null;
  mode: WorkbenchPreviewCssMode;
  renderFreshness: WorkbenchPreviewCssRenderFreshness;
  status: 'failed' | 'not-configured' | 'not-required' | 'stale' | 'synchronized' | 'unavailable' | 'unrepresentative';
  tokenCss: string | null;
};

export type WorkbenchPreviewCssBuildReceipt = {
  compiledCss: string;
  fresh: boolean;
  provenance: 'existing' | 'install-free-seed' | 'project-build' | 'stale-existing';
  representative: boolean;
  version: 1;
};

export type WorkbenchPreviewCssSyncExecution = string | { stdout?: string };

export type WorkbenchPreviewCssCoordinator = {
  getProjectStatus(projectRoot: string): Promise<WorkbenchPreviewCssSyncResult>;
  synchronizeProject(
    projectRoot: string,
    input?: { changedPath?: string | null; reason?: string },
  ): Promise<WorkbenchPreviewCssSyncResult>;
};

export const WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX: 'WORKBENCH_PREVIEW_CSS_RECEIPT=';
export const WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER: 'Workbench design-preview CSS snapshot';
export const WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES: number;
export const WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS: number;

export function createWorkbenchPreviewCssCoordinator(input: {
  onInputsChangedDuringSync?: ((input: { projectRoot: string }) => void) | null;
  onStatus?: ((projectRoot: string, status: WorkbenchPreviewCssSyncResult) => void) | null;
  onSynchronized?: ((input: {
    config: ProjectTailwindPreviewCssConfig;
    projectRoot: string;
    result: WorkbenchPreviewCssSyncResult;
  }) => void) | null;
  runTailwindSync(input: {
    changedPath: string | null;
    projectRoot: string;
    reason: string;
  }): Promise<WorkbenchPreviewCssSyncExecution>;
}): WorkbenchPreviewCssCoordinator;

export function getWorkbenchPreviewCssMode(config: ProjectTailwindPreviewCssConfig): WorkbenchPreviewCssMode;
export function createWorkbenchPreviewCssRenderFreshness(input: {
  error?: string | null;
  fresh: boolean;
  inputRevision?: string | null;
  outputRevision?: string | null;
  reason: string;
  representative: boolean;
  state?: WorkbenchPreviewCssFreshnessState;
}): WorkbenchPreviewCssRenderFreshness;
export function createWorkbenchPreviewCssResult(input: {
  config: ProjectTailwindPreviewCssConfig;
  freshness: WorkbenchPreviewCssRenderFreshness;
  status: WorkbenchPreviewCssSyncResult['status'];
}): WorkbenchPreviewCssSyncResult;
export function createInitialWorkbenchPreviewCssStatus(
  projectRoot: string,
  config: ProjectTailwindPreviewCssConfig,
  input?: { inputRevision?: string | null; outputRevision?: string | null; reason?: string },
): Promise<WorkbenchPreviewCssSyncResult>;
export function readWorkbenchPreviewCssConfig(projectRoot: string): Promise<ProjectTailwindPreviewCssConfig>;
export function shouldWorkbenchPreviewCssSyncForProjectPath(
  path: string,
  config: ProjectTailwindPreviewCssConfig,
): boolean;
export function createWorkbenchPreviewCssInputRevision(
  projectRoot: string,
  config: ProjectTailwindPreviewCssConfig,
): Promise<string>;
export function createWorkbenchPreviewCssOutputRevision(
  projectRoot: string,
  compiledCss: string | null,
): Promise<string | null>;
export function isWorkbenchPreviewCssRepresentative(
  projectRoot: string,
  config: ProjectTailwindPreviewCssConfig,
): Promise<boolean>;
export function parseWorkbenchPreviewCssBuildReceipt(stdout: string): WorkbenchPreviewCssBuildReceipt | null;
