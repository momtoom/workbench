export type WorkbenchAuthoringService = {
  assertProjectTarget(projectRoot: string, input: unknown): Promise<unknown>;
  inspectDesignContext(projectRoot: string, input?: unknown): Promise<unknown>;
  confirmRequirements(projectRoot: string, input: unknown): Promise<unknown>;
  prepareExecutionPrompt(projectRoot: string, input: unknown): Promise<unknown>;
  confirmExecutionPrompt(projectRoot: string, input: unknown): Promise<unknown>;
  search(projectRoot: string, input?: unknown): Promise<unknown>;
  plan(projectRoot: string, input: unknown): Promise<unknown>;
  apply(projectRoot: string, input: unknown): Promise<WorkbenchAuthoringApplyResult>;
  submitRenderEvidence(projectRoot: string, input: unknown): Promise<unknown>;
  submitVisualReview(projectRoot: string, input: unknown): Promise<WorkbenchAuthoringVisualReviewResult>;
  confirmVisualApproval(projectRoot: string, input: unknown): Promise<unknown>;
  verify(projectRoot: string, input: unknown): Promise<unknown>;
  inspectTokens(projectRoot: string): Promise<WorkbenchAuthoringTokenInspection>;
  upsertTokens(projectRoot: string, input: unknown): Promise<WorkbenchAuthoringTokenWriteResult>;
  upsertAssets(projectRoot: string, input: unknown): Promise<WorkbenchAuthoringAssetWriteResult>;
  inspectComponent(projectRoot: string, input: unknown): Promise<unknown>;
  upsertComponent(projectRoot: string, input: unknown): Promise<WorkbenchAuthoringComponentWriteResult>;
};

export type WorkbenchAuthoringTokenInspection = {
  ok: true;
  revision: string;
  collections: unknown[];
};

export type WorkbenchAuthoringTokenWriteResult = {
  ok: true;
  operations: number;
  revision: string;
  tokensPath: string;
  tokenCssPath: string;
};

export type WorkbenchAuthoringAssetWriteResult = {
  ok: true;
  assets: Array<{
    id: string;
    kind: string;
    fileCount: number;
    assetRoot: string;
    size: number;
    urls: string[];
  }>;
  assetsPath: string;
  revision: string;
};

export type WorkbenchAuthoringComponentWriteResult = {
  ok: true;
  sourceFile: string;
  storyFile: string;
  sourceRevision: string;
  storyRevision: string;
  previewCss: WorkbenchPreviewCssSyncResult;
  reconciliation: 'reload-required';
};

export type WorkbenchPreviewCssSyncResult = {
  compiledCss: string | null;
  mode: 'compiled' | 'disabled' | 'fallback';
  renderFreshness: {
    error: string | null;
    fresh: boolean;
    inputRevision: string | null;
    outputRevision: string | null;
    ready: boolean;
    reason: string;
    representative: boolean;
    state: 'failed' | 'ready' | 'stale' | 'syncing' | 'unavailable' | 'unrepresentative';
  };
  status: 'failed' | 'not-configured' | 'not-required' | 'stale' | 'synchronized' | 'unavailable' | 'unrepresentative';
  tokenCss: string | null;
};

export type WorkbenchAuthoringApplyResult = {
  ok: true;
  page: unknown;
  revision: string;
  renderRevision: string;
  sourceFile: string;
  previewCss: WorkbenchPreviewCssSyncResult;
  verification: unknown;
  visualQualityGate: unknown;
};

export type WorkbenchAuthoringVisualReviewResult = {
  ok: boolean;
  outcome: 'accept' | 'revise';
  sourceFile: string;
  sourceRevision: string;
  renderRevision: string;
  reviewId: string;
  approvalRequired: boolean;
  approvalSummary: string;
  instruction: string;
};

export function createWorkbenchAuthoringService(options: {
  writeFileAtomic(filePath: string, contents: string): Promise<void>;
  getPreviewCssStatus?: (projectRoot: string) => Promise<WorkbenchPreviewCssSyncResult>;
  synchronizePreviewCss?: (
    projectRoot: string,
    changedPath: string,
  ) => Promise<WorkbenchPreviewCssSyncResult>;
}): WorkbenchAuthoringService;

export function serializeWorkbenchAuthoringError(error: unknown): {
  code: string;
  message: string;
  ok: false;
  violations: unknown[];
};
