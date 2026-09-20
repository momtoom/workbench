import type { WorkbenchProjectSnapshot } from '@domain/project/workbenchProjectLoader';
import { getWorkbenchHostStatus } from '@domain/project/workbenchHostTransport';

const WORKBENCH_CORE_PROTOCOL_VERSION = 1;

export type WorkbenchCoreStorageKind = 'cloud-project' | 'local-folder' | 'same-origin' | 'bundled-files';

export type WorkbenchCoreClientMode = 'local-fallback' | 'remote';

export type WorkbenchCoreClientOptions = {
  baseUrl?: string | null;
  fetchImpl?: typeof fetch;
};

export type WorkbenchCoreProjectSummary = {
  projectId: string;
  projectName: string;
  storageKind: WorkbenchCoreStorageKind;
  configPath: string;
  counts: {
    assets: number;
    comments: number;
    components: number;
    pages: number;
    tokenCollections: number;
    tokens: number;
  };
};

export type WorkbenchCoreBootstrapRequest = {
  protocolVersion: 1;
  client: {
    shell: 'browser';
    storageKind: WorkbenchCoreStorageKind;
  };
  project: WorkbenchCoreProjectSummary | null;
};

export type WorkbenchCoreFeature = {
  id: string;
  enabled: boolean;
  reason?: string;
};

export type WorkbenchCoreBootstrapResponse = {
  ok: true;
  mode: WorkbenchCoreClientMode;
  protocolVersion: 1;
  features: WorkbenchCoreFeature[];
};

export type WorkbenchCoreOperationIntent =
  | 'analyze-selection'
  | 'plan-edit'
  | 'validate-edit'
  | 'suggest-component'
  | 'suggest-token';

export type WorkbenchCoreOperationPlanRequest = {
  protocolVersion: 1;
  intent: WorkbenchCoreOperationIntent;
  project: WorkbenchCoreProjectSummary;
  prompt?: string;
  selection?: {
    activeTargetKind?: string;
    sourceFile?: string;
    nodeId?: string;
  };
  constraints?: {
    allowSourceWrites: boolean;
    allowAssetWrites: boolean;
    maxPatchBytes?: number;
  };
  operation?: {
    byteLength?: number;
    contentHash?: string;
    kind: 'source.write';
    label?: string;
    sourceFile: string;
    subjectId?: string;
    subjectKind?: 'component' | 'page';
    subjectName?: string;
    trigger?: 'auto' | 'manual' | 'navigation' | 'beforeunload';
  };
};

export type WorkbenchCoreOperationPlanStep =
  | {
      kind: 'message';
      body: string;
    }
  | {
      kind: 'source.patch';
      path: string;
      patch: string;
      baseRevision?: string;
    }
  | {
      kind: 'source.write';
      path: string;
      contents: string;
      overwrite: boolean;
    }
  | {
      kind: 'asset.write';
      path: string;
      base64: string;
      mimeType: string;
    };

export type WorkbenchCoreOperationPlan = {
  id: string;
  createdAt: string;
  summary: string;
  steps: WorkbenchCoreOperationPlanStep[];
};

export type WorkbenchCoreOperationPlanResponse =
  | {
      ok: true;
      mode: WorkbenchCoreClientMode;
      plan: WorkbenchCoreOperationPlan;
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchCoreSourceAnalysisRequest = {
  protocolVersion: 1;
  source: {
    contents: string;
    preferredComponentNames?: string[];
    sourceFile: string;
  };
};

export type WorkbenchCoreSourceAnalysis = {
  byteLength: number;
  diagnostic: string;
  exportedComponents: string[];
  jsx: {
    componentInstances: number;
    elements: number;
    intrinsicElements: number;
    maxDepth: number;
    textNodes: number;
  } | null;
  parseable: boolean;
  primaryComponentName: string | null;
  sourceFile: string;
};

export type WorkbenchCoreSourceAnalysisResponse =
  | {
      analysis: WorkbenchCoreSourceAnalysis;
      mode: WorkbenchCoreClientMode;
      ok: true;
      protocolVersion: 1;
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchCoreTemplateSummary = {
  id: string;
  name: string;
  kind: 'page' | 'component' | 'token-set';
  description?: string;
};

export type WorkbenchCoreClient = {
  mode: WorkbenchCoreClientMode;
  bootstrap: (request: WorkbenchCoreBootstrapRequest) => Promise<WorkbenchCoreBootstrapResponse>;
  getFeatures: () => Promise<WorkbenchCoreFeature[]>;
  listTemplates: () => Promise<WorkbenchCoreTemplateSummary[]>;
  planOperation: (request: WorkbenchCoreOperationPlanRequest) => Promise<WorkbenchCoreOperationPlanResponse>;
  analyzeSource: (request: WorkbenchCoreSourceAnalysisRequest) => Promise<WorkbenchCoreSourceAnalysisResponse>;
};

export function createWorkbenchCoreClient(options: WorkbenchCoreClientOptions = {}): WorkbenchCoreClient {
  const baseUrl = normalizeCoreBaseUrl(options.baseUrl ?? getConfiguredCoreBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!baseUrl) {
    return createLocalFallbackWorkbenchCoreClient();
  }

  return {
    mode: 'remote',
    bootstrap: (request) => postCoreJson(fetchImpl, baseUrl, '/api/workbench/session/bootstrap', request, options),
    getFeatures: () => getCoreJson(fetchImpl, baseUrl, '/api/workbench/features', options),
    listTemplates: () => getCoreJson(fetchImpl, baseUrl, '/api/workbench/templates', options),
    planOperation: (request) => postCoreJson(fetchImpl, baseUrl, '/api/workbench/operations/plan', request, options),
    analyzeSource: (request) => postCoreJson(fetchImpl, baseUrl, '/api/workbench/source/analyze', request, options),
  };
}

export function createWorkbenchCoreBootstrapRequest(
  snapshot: WorkbenchProjectSnapshot | null,
): WorkbenchCoreBootstrapRequest {
  const hostStatus = getWorkbenchHostStatus();
  return {
    protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
    client: {
      shell: getWorkbenchShellKind(),
      storageKind: snapshot
        ? getWorkbenchCoreStorageKind(snapshot.location.source, hostStatus.kind)
        : hostStatus.kind === 'local-bridge' ? 'local-folder' : 'cloud-project',
    },
    project: snapshot ? createWorkbenchCoreProjectSummary(snapshot) : null,
  };
}

export function createWorkbenchCoreProjectSummary(
  snapshot: WorkbenchProjectSnapshot,
): WorkbenchCoreProjectSummary {
  const tokenCollections = snapshot.tokens.collections.length;
  const tokens = snapshot.tokens.collections.reduce((total, collection) => total + collection.tokens.length, 0);
  return {
    projectId: snapshot.config.projectId,
    projectName: snapshot.config.projectName,
    storageKind: getWorkbenchCoreStorageKind(snapshot.location.source, getWorkbenchHostStatus().kind),
    configPath: snapshot.location.configPath,
    counts: {
      assets: snapshot.assets.assets.length,
      comments: snapshot.comments.comments.length,
      components: snapshot.components.components.length,
      pages: snapshot.pages.pages.length,
      tokenCollections,
      tokens,
    },
  };
}

function createLocalFallbackWorkbenchCoreClient(): WorkbenchCoreClient {
  const features = createLocalFallbackFeatures();
  return {
    mode: 'local-fallback',
    bootstrap: async () => ({
      ok: true,
      mode: 'local-fallback',
      protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
      features,
    }),
    getFeatures: async () => features,
    listTemplates: async () => [],
    planOperation: async (request) => ({
      ok: true,
      mode: 'local-fallback',
      plan: {
        id: `local-plan-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        summary: `Local fallback accepted ${request.intent}; no remote core operation was run.`,
        steps: [
          {
            kind: 'message',
            body: 'Hosted Workbench core is not configured. The editor will use local-only behavior.',
          },
        ],
      },
    }),
    analyzeSource: async (request) => ({
      analysis: {
        byteLength: new TextEncoder().encode(request.source.contents).byteLength,
        diagnostic: 'Hosted Workbench core is not configured. Source analysis stayed in local fallback mode.',
        exportedComponents: [],
        jsx: null,
        parseable: false,
        primaryComponentName: null,
        sourceFile: request.source.sourceFile,
      },
      mode: 'local-fallback',
      ok: true,
      protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
    }),
  };
}

function createLocalFallbackFeatures(): WorkbenchCoreFeature[] {
  return [
    {
      enabled: true,
      id: 'local-folder-storage',
      reason: 'Local bridge and same-origin project storage continue to run without hosted core.',
    },
    {
      enabled: false,
      id: 'remote-operation-planning',
      reason: 'Set VITE_WORKBENCH_CORE_URL to enable hosted operation planning.',
    },
    {
      enabled: false,
      id: 'remote-source-write-validation',
      reason: 'Set VITE_WORKBENCH_CORE_URL to validate source writes through hosted core.',
    },
    {
      enabled: false,
      id: 'remote-source-write-required',
      reason: 'Set VITE_WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN=true with a hosted core URL to require remote validation.',
    },
    {
      enabled: false,
      id: 'remote-template-catalog',
      reason: 'Set VITE_WORKBENCH_CORE_URL to enable hosted templates.',
    },
  ];
}

async function getCoreJson<T>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  options: WorkbenchCoreClientOptions,
): Promise<T> {
  const headers = await createCoreHeaders(options);
  const response = await fetchImpl(toCoreUrl(baseUrl, path), {
    cache: 'no-store',
    headers,
  });
  return readCoreJsonResponse<T>(response);
}

async function postCoreJson<TResponse, TRequest>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  body: TRequest,
  options: WorkbenchCoreClientOptions,
): Promise<TResponse> {
  const headers = await createCoreHeaders(options);
  headers.set('Content-Type', 'application/json');
  const response = await fetchImpl(toCoreUrl(baseUrl, path), {
    body: JSON.stringify(body),
    cache: 'no-store',
    headers,
    method: 'POST',
  });
  return readCoreJsonResponse<TResponse>(response);
}

async function createCoreHeaders(options: WorkbenchCoreClientOptions): Promise<Headers> {
  const headers = new Headers({
    Accept: 'application/json',
    'X-Workbench-Core-Protocol': String(WORKBENCH_CORE_PROTOCOL_VERSION),
  });
  return headers;
}

async function readCoreJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Workbench core responded with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getConfiguredCoreBaseUrl(): string | null {
  return import.meta.env.VITE_WORKBENCH_CORE_URL ?? getHostedSameOriginCoreBaseUrl();
}

function getHostedSameOriginCoreBaseUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const { protocol, origin, hostname } = window.location;
  if (protocol !== 'https:') return null;
  if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') return null;
  return origin;
}

function normalizeCoreBaseUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && !isLoopbackHttpUrl(url)) return null;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isLoopbackHttpUrl(url: URL): boolean {
  return url.protocol === 'http:' && (
    url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost' ||
    url.hostname === '::1' ||
    url.hostname === '[::1]'
  );
}

function toCoreUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getWorkbenchCoreStorageKind(
  source: WorkbenchProjectSnapshot['location']['source'],
  hostKind: ReturnType<typeof getWorkbenchHostStatus>['kind'],
): WorkbenchCoreStorageKind {
  if (source === 'local-bridge' || hostKind === 'local-bridge') return 'local-folder';
  if (source === 'static-fallback') return 'bundled-files';
  return 'same-origin';
}

function getWorkbenchShellKind(): 'browser' {
  return 'browser';
}
