export type WorkbenchLocalBridgeDescriptor = {
  previewUrl?: string;
  protocolVersion: number;
  token?: string;
  url: string;
};

export type WorkbenchLocalPreviewDescriptor = {
  protocolVersion: number;
  url: string;
};

export type WorkbenchRuntimeAssetUrlOptions = {
  baseURI?: string | null;
  document?: Pick<Document, 'baseURI'> | null;
};

export type WorkbenchRuntimeAssetUrlResolver = (
  value: string,
  options?: WorkbenchRuntimeAssetUrlOptions,
) => string;

const BRIDGE_EVENTS_PATH = '/__workbench-bridge/events';
const LOCAL_GATEWAY_CONFIG_PATH = '/__workbench/gateway.json';
const PROJECT_PREVIEW_DATA_CHANGED_EVENT = 'workbench:project-preview-data-changed';
const BRIDGE_EXACT_ROUTES = new Set([
  BRIDGE_EVENTS_PATH,
  '/__workbench-bridge/capabilities.json',
  '/__workbench-bridge/health.json',
  '/__workbench-bridge/project/validate-root.json',
  '/__workbench-bridge/token/rotate.json',
  '/__workbench/folder-dialog.json',
  '/__workbench/project.json',
  '/__workbench/project/dependencies/install.json',
  '/__workbench/assets/delete.json',
  '/__workbench/assets/install.json',
  '/__workbench/assets/write.json',
  '/__workbench/assets/google-fonts.json',
  '/__workbench/source/import-tree.json',
  '/__workbench/source/read.json',
  '/__workbench/source/write.json',
  '/__workbench/source/delete.json',
  '/__workbench/source/mkdir.json',
  '/__workbench/source/move.json',
  '/__workbench/source/rmdir.json',
]);
const BRIDGE_PROJECT_FILE_PREFIX = '/__workbench/files/';
const BRIDGE_ASSET_FILE_PREFIXES = ['/assets/', '/workbench-assets/'];
const PREVIEW_EXACT_ROUTES = new Set([
  '/__workbench/preview/module.json',
  '/__workbench/preview/runtime-bundle.json',
  '/__workbench/preview/source-module.json',
]);
const WORKBENCH_LOCAL_BRIDGE_SESSION_KEY = 'workbench-v1.localBridge';

type WorkbenchRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_RESOLVE_ASSET_URL__?: WorkbenchRuntimeAssetUrlResolver;
};

export type WorkbenchHostKind = 'local-bridge' | 'same-origin';
export type WorkbenchHostPairingKind = 'session-pairing' | 'same-origin';

export type WorkbenchHostStatus = {
  bridgeUrl: string | null;
  canDisconnect: boolean;
  canRotateToken: boolean;
  kind: WorkbenchHostKind;
  label: string;
  pairingKind: WorkbenchHostPairingKind;
};

export type WorkbenchHostConnectionCheck = {
  checkedAt: string;
  message: string;
  state: 'connected' | 'offline' | 'same-origin';
};

export type WorkbenchHostPairingInput = {
  previewUrl?: string;
  token: string;
  url: string;
};

export type WorkbenchHostEvent =
  | {
      emittedAt: string;
      rootPath: string | null;
      type: 'project-opened';
    }
  | {
      emittedAt: string;
      eventType: string;
      path: string | null;
      rootPath: string;
      type: 'project-changed';
    }
  | {
      emittedAt: string;
      message: string;
      rootPath: string | null;
      type: 'watch-error';
    }
  | {
      emittedAt: string;
      previewCss: WorkbenchPreviewCssStatus;
      rootPath: string;
      type: 'preview-css-status';
    };

export type WorkbenchPreviewCssStatus = {
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

export type WorkbenchProjectChangeEvent = {
  emittedAt: string;
  eventType: string;
  path: string;
  rootPath: string | null;
  source: 'host' | 'vite';
};

const localWorkbenchProjectChangeListeners = new Set<(event: WorkbenchProjectChangeEvent) => void>();

export function getWorkbenchHostKind(): WorkbenchHostKind {
  return getWorkbenchLocalBridge() ? 'local-bridge' : 'same-origin';
}

export function getWorkbenchHostStatus(): WorkbenchHostStatus {
  const { descriptor: bridge, pairingKind } = getWorkbenchLocalBridgeWithPairingKind();
  if (bridge) {
    return {
      bridgeUrl: bridge.url,
      canDisconnect: pairingKind === 'session-pairing',
      canRotateToken: canRotateWorkbenchLocalBridgeToken(pairingKind),
      kind: 'local-bridge',
      label: 'Local folder',
      pairingKind,
    };
  }

  return {
    bridgeUrl: null,
    canDisconnect: false,
    canRotateToken: false,
    kind: 'same-origin',
    label: 'App host',
    pairingKind: 'same-origin',
  };
}

export async function rotateWorkbenchLocalBridgeToken(): Promise<WorkbenchHostConnectionCheck> {
  const { descriptor, pairingKind } = getWorkbenchLocalBridgeWithPairingKind();
  const checkedAt = new Date().toISOString();
  if (!descriptor) {
    return {
      checkedAt,
      message: 'No bridge is paired',
      state: 'offline',
    };
  }
  if (pairingKind !== 'session-pairing') {

    return {
      checkedAt,
      message: 'Token rotation is available for browser pairing',
      state: 'offline',
    };
  }

  if (!hasWorkbenchLocalBridgeToken(descriptor)) {
    return {
      checkedAt,
      message: 'Bridge token is unavailable',
      state: 'offline',
    };
  }

  try {
    const response = await fetch(toBridgeUrl(descriptor.url, '/__workbench-bridge/token/rotate.json'), {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${descriptor.token}`,
      },
      method: 'POST',
      mode: 'cors',
    });
    if (!response.ok) {
      return {
        checkedAt,
        message: `Bridge responded with ${response.status}`,
        state: 'offline',
      };
    }

    const payload = await response.json() as { protocolVersion?: unknown; token?: unknown };
    const nextDescriptor = normalizeWorkbenchLocalBridgeDescriptor({
      previewUrl: descriptor.previewUrl,
      token: typeof payload.token === 'string' ? payload.token : '',
      url: descriptor.url,
    });
    if (payload.protocolVersion !== 1 || !nextDescriptor) {
      return {
        checkedAt,
        message: 'Bridge returned an invalid token',
        state: 'offline',
      };
    }

    if (!pairWorkbenchLocalBridge(nextDescriptor)) {
      return {
        checkedAt,
        message: 'Browser session storage is unavailable',
        state: 'offline',
      };
    }

    return {
      checkedAt,
      message: 'Bridge token rotated',
      state: 'connected',
    };
  } catch (error) {
    return {
      checkedAt,
      message: error instanceof Error ? error.message : 'Bridge could not be reached',
      state: 'offline',
    };
  }
}

export function hydrateWorkbenchLocalBridgePairingFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const bridgeUrl = params.get('workbenchBridgeUrl');
  const bridgeToken = params.get('workbenchBridgeToken');
  const previewUrl = params.get('workbenchPreviewUrl');
  if (!bridgeUrl && !bridgeToken) return false;

  const paired = bridgeUrl && bridgeToken
    ? pairWorkbenchLocalBridge({
      protocolVersion: 1,
      ...(previewUrl ? { previewUrl } : {}),
      token: bridgeToken,
      url: bridgeUrl,
    })
    : false;

  if (!paired) clearWorkbenchLocalBridgePairing();
  removeWorkbenchLocalBridgePairingParamsFromUrl(params);

  return paired;
}

export function isWorkbenchLocalBridgePairingUrl(value: string): boolean {
  return readWorkbenchLocalBridgePairingUrl(value) !== null;
}

export async function workbenchFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (shouldRouteThroughLocalPreview(input)) {
    const preview = getWorkbenchLocalPreview();
    if (preview) {
      return fetch(toLocalHostUrl(preview.url, input), {
        ...init,
        mode: 'cors',
      });
    }
  }

  if (!shouldRouteThroughBridge(input)) {
    return fetch(input, init);
  }

  const { descriptor: bridge, pairingKind } = getWorkbenchLocalBridgeWithPairingKind();
  if (!bridge) {
    return fetch(input, init);
  }

  const headers = new Headers(init.headers);
  if (!bridge.token) {
    throw new Error('Local bridge token is not available for direct browser fetch.');
  }
  headers.set('Authorization', `Bearer ${bridge.token}`);

  return fetch(toBridgeUrl(bridge.url, input), {
    ...init,
    headers,
    mode: 'cors',
  });
}

export function toWorkbenchPreviewUrl(path: string): string {
  const preview = getWorkbenchLocalPreview();
  return preview ? toLocalHostUrl(preview.url, path) : path;
}

export function withWorkbenchLocalBridgePairingParams(value: string): string {
  if (typeof window === 'undefined') return value;
  const bridge = getWorkbenchLocalBridge();
  if (!bridge?.token) return value;

  try {
    const url = new URL(value, window.location.href);
    url.searchParams.set('workbenchBridgeUrl', bridge.url);
    url.searchParams.set('workbenchBridgeToken', bridge.token);
    if (bridge.previewUrl) url.searchParams.set('workbenchPreviewUrl', bridge.previewUrl);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch {
    return value;
  }
}

export function toWorkbenchProjectAssetBaseUrl(): string {
  const bridge = getWorkbenchLocalBridge();
  if (bridge) return toLocalHostUrl(bridge.url, '/');
  const preview = getWorkbenchLocalPreview();
  if (preview) return toLocalHostUrl(preview.url, '/');
  if (typeof window !== 'undefined') return new URL('/', window.location.origin).toString();
  return '/';
}

export function subscribeWorkbenchHostEvents(
  onEvent: (event: WorkbenchHostEvent) => void,
  onError?: (message: string) => void,
): () => void {
  const bridge = getWorkbenchLocalBridge();
  const controller = new AbortController();
  if (bridge?.token) {
    void readWorkbenchHostEventStream(
      toBridgeUrl(bridge.url, BRIDGE_EVENTS_PATH),
      { Authorization: `Bearer ${bridge.token}` },
      controller.signal,
      onEvent,
      onError,
    );
  } else {
    void readSameOriginWorkbenchHostEventStream(controller.signal, onEvent, onError);
  }
  return () => controller.abort();
}

export function subscribeWorkbenchProjectChangeEvents(
  onEvent: (event: WorkbenchProjectChangeEvent) => void,
  onError?: (message: string) => void,
): () => void {
  let lastSignature = '';
  let lastEmittedAt = 0;

  const emit = (event: WorkbenchProjectChangeEvent) => {
    const signature = `${event.eventType}:${normalizeWorkbenchProjectChangePath(event.path)}`;
    const now = Date.now();
    if (signature === lastSignature && now - lastEmittedAt < 150) return;
    lastSignature = signature;
    lastEmittedAt = now;
    onEvent(event);
  };

  const unsubscribeHost = subscribeWorkbenchHostEvents((event) => {
    if (event.type !== 'project-changed' || !event.path) return;
    emit({
      emittedAt: event.emittedAt,
      eventType: event.eventType,
      path: event.path,
      rootPath: event.rootPath,
      source: 'host',
    });
  }, onError);

  localWorkbenchProjectChangeListeners.add(emit);

  const hot = import.meta.hot;
  const handleViteChange = (event: { path?: unknown }) => {
    if (typeof event.path !== 'string' || !event.path.trim()) return;
    emit({
      emittedAt: new Date().toISOString(),
      eventType: 'change',
      path: event.path,
      rootPath: null,
      source: 'vite',
    });
  };
  hot?.on(PROJECT_PREVIEW_DATA_CHANGED_EVENT, handleViteChange);

  return () => {
    localWorkbenchProjectChangeListeners.delete(emit);
    unsubscribeHost();
    hot?.off(PROJECT_PREVIEW_DATA_CHANGED_EVENT, handleViteChange);
  };
}

export function notifyWorkbenchProjectChange(path: string, eventType = 'change'): void {
  const normalizedPath = normalizeWorkbenchProjectChangePath(path);
  if (!normalizedPath) return;
  const event: WorkbenchProjectChangeEvent = {
    emittedAt: new Date().toISOString(),
    eventType,
    path: normalizedPath,
    rootPath: null,
    source: 'host',
  };
  for (const listener of localWorkbenchProjectChangeListeners) listener(event);
}

function normalizeWorkbenchProjectChangePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

export async function checkWorkbenchHostConnection(): Promise<WorkbenchHostConnectionCheck> {
  const hostStatus = getWorkbenchHostStatus();
  const checkedAt = new Date().toISOString();
  if (hostStatus.kind === 'same-origin') {
    return {
      checkedAt,
      message: 'Same-origin project host',
      state: 'same-origin',
    };
  }

  try {
    const response = await workbenchFetch('/__workbench-bridge/capabilities.json', { cache: 'no-store' });
    if (!response.ok) {
      return {
        checkedAt,
        message: `Bridge responded with ${response.status}`,
        state: 'offline',
      };
    }
    const payload = await response.json() as { protocolVersion?: unknown };
    return {
      checkedAt,
      message: payload.protocolVersion === 1 ? 'Bridge protocol v1 ready' : 'Bridge responded',
      state: 'connected',
    };
  } catch (error) {
    return {
      checkedAt,
      message: error instanceof Error ? error.message : 'Bridge could not be reached',
      state: 'offline',
    };
  }
}

export async function readWorkbenchBridgeCapabilities(): Promise<string[] | null> {
  if (getWorkbenchHostStatus().kind === 'same-origin') return null;

  try {
    const response = await workbenchFetch('/__workbench-bridge/capabilities.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json() as { capabilities?: unknown };
    if (!Array.isArray(payload.capabilities)) return null;
    return payload.capabilities.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return null;
  }
}

/**
 * Bridge routes ship with the desktop app while the renderer can be newer than the
 * installed build. When a request 404s, ask the bridge which capabilities it advertises
 * so the shell can report the version skew instead of a bare route-not-found error.
 */
export async function describeOutdatedWorkbenchHost(capability: string): Promise<string | null> {
  const capabilities = await readWorkbenchBridgeCapabilities();
  if (!capabilities || capabilities.includes(capability)) return null;
  return 'This Workbench desktop app is out of date and does not support this action. Update the desktop app, then try again.';
}

async function readWorkbenchHostEventStream(
  url: string,
  headers: HeadersInit | undefined,
  signal: AbortSignal,
  onEvent: (event: WorkbenchHostEvent) => void,
  onError?: (message: string) => void,
): Promise<void> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers,
      mode: 'cors',
      signal,
    });
    if (!response.ok || !response.body) {
      onError?.(`Bridge event stream responded with ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });

      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const event = parseWorkbenchHostEventFrame(frame);
        if (event) onEvent(event);
        frameEnd = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    onError?.(error instanceof Error ? error.message : 'Bridge event stream failed');
  }
}

async function readSameOriginWorkbenchHostEventStream(
  signal: AbortSignal,
  onEvent: (event: WorkbenchHostEvent) => void,
  onError?: (message: string) => void,
): Promise<void> {
  try {
    const configResponse = await fetch(LOCAL_GATEWAY_CONFIG_PATH, {
      cache: 'no-store',
      signal,
    });
    if (!configResponse.ok) return;
    const config = await configResponse.json() as { bridgeEventsPath?: unknown; ok?: unknown };
    if (
      config.ok !== true ||
      typeof config.bridgeEventsPath !== 'string' ||
      !config.bridgeEventsPath.startsWith('/__workbench-bridge/')
    ) {
      return;
    }
    await readWorkbenchHostEventStream(
      new URL(config.bridgeEventsPath, window.location.origin).toString(),
      undefined,
      signal,
      onEvent,
      onError,
    );
  } catch (error) {
    if (signal.aborted) return;
    if (error instanceof SyntaxError) return;
    onError?.(error instanceof Error ? error.message : 'Gateway event stream failed');
  }
}

function parseWorkbenchHostEventFrame(frame: string): WorkbenchHostEvent | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n');
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as unknown;
    return isWorkbenchHostEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isWorkbenchHostEvent(value: unknown): value is WorkbenchHostEvent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.emittedAt === 'string' &&
    (
      (candidate.type === 'project-opened' && (candidate.rootPath === null || typeof candidate.rootPath === 'string')) ||
      (
        candidate.type === 'project-changed' &&
        typeof candidate.rootPath === 'string' &&
        typeof candidate.eventType === 'string' &&
        (candidate.path === null || typeof candidate.path === 'string')
      ) ||
      (
        candidate.type === 'watch-error' &&
        (candidate.rootPath === null || typeof candidate.rootPath === 'string') &&
        typeof candidate.message === 'string'
      ) ||
      (
        candidate.type === 'preview-css-status' &&
        typeof candidate.rootPath === 'string' &&
        isWorkbenchPreviewCssStatus(candidate.previewCss)
      )
    )
  );
}

function isWorkbenchPreviewCssStatus(value: unknown): value is WorkbenchPreviewCssStatus {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (!candidate.renderFreshness || typeof candidate.renderFreshness !== 'object') return false;
  const freshness = candidate.renderFreshness as Record<string, unknown>;
  return (
    ['compiled', 'disabled', 'fallback'].includes(String(candidate.mode))
    && ['failed', 'not-configured', 'not-required', 'stale', 'synchronized', 'unavailable', 'unrepresentative'].includes(String(candidate.status))
    && typeof freshness.fresh === 'boolean'
    && typeof freshness.ready === 'boolean'
    && typeof freshness.representative === 'boolean'
    && typeof freshness.reason === 'string'
    && ['failed', 'ready', 'stale', 'syncing', 'unavailable', 'unrepresentative'].includes(String(freshness.state))
  );
}

export async function connectWorkbenchLocalBridgePairing(
  input: WorkbenchHostPairingInput,
): Promise<WorkbenchHostConnectionCheck> {
  const checkedAt = new Date().toISOString();
  const descriptor = normalizeWorkbenchLocalBridgeDescriptor(input);
  if (!descriptor) {
    return {
      checkedAt,
      message: 'Use a local bridge URL and token',
      state: 'offline',
    };
  }
  if (!hasWorkbenchLocalBridgeToken(descriptor)) {
    return {
      checkedAt,
      message: 'Use a local bridge URL and token',
      state: 'offline',
    };
  }

  try {
    const response = await fetch(toBridgeUrl(descriptor.url, '/__workbench-bridge/capabilities.json'), {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${descriptor.token}`,
      },
      mode: 'cors',
    });
    if (!response.ok) {
      return {
        checkedAt,
        message: `Bridge responded with ${response.status}`,
        state: 'offline',
      };
    }

    const payload = await response.json() as { protocolVersion?: unknown };
    if (payload.protocolVersion !== 1) {
      return {
        checkedAt,
        message: 'Bridge protocol is not supported',
        state: 'offline',
      };
    }

    if (!pairWorkbenchLocalBridge(descriptor)) {
      return {
        checkedAt,
        message: 'Browser session storage is unavailable',
        state: 'offline',
      };
    }

    return {
      checkedAt,
      message: 'Bridge protocol v1 ready',
      state: 'connected',
    };
  } catch (error) {
    return {
      checkedAt,
      message: error instanceof Error ? error.message : 'Bridge could not be reached',
      state: 'offline',
    };
  }
}

export function pairWorkbenchLocalBridge(descriptor: WorkbenchLocalBridgeDescriptor): boolean {
  if (!isWorkbenchLocalBridgeDescriptor(descriptor) || !hasWorkbenchLocalBridgeToken(descriptor)) return false;
  try {
    window.sessionStorage.setItem(WORKBENCH_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify(descriptor));
    return true;
  } catch {
    return false;
  }
}

function normalizeWorkbenchLocalBridgeDescriptor(
  input: WorkbenchHostPairingInput,
): WorkbenchLocalBridgeDescriptor | null {
  const pairingUrl = readWorkbenchLocalBridgePairingUrl(input.url);
  const descriptor = {
    protocolVersion: 1,
    previewUrl: pairingUrl?.previewUrl ?? input.previewUrl?.trim(),
    token: pairingUrl?.token ?? input.token.trim(),
    url: (pairingUrl?.url ?? input.url).trim().replace(/\/+$/, ''),
  };
  return isWorkbenchLocalBridgeDescriptor(descriptor) ? descriptor : null;
}

function readWorkbenchLocalBridgePairingUrl(value: string): WorkbenchHostPairingInput | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, window.location.href);
    const url = parsed.searchParams.get('workbenchBridgeUrl')?.trim() ?? '';
    const token = parsed.searchParams.get('workbenchBridgeToken')?.trim() ?? '';
    const previewUrl = parsed.searchParams.get('workbenchPreviewUrl')?.trim() ?? '';
    return url && token ? { ...(previewUrl ? { previewUrl } : {}), token, url } : null;
  } catch {
    return null;
  }
}

export function clearWorkbenchLocalBridgePairing(): void {
  try {
    window.sessionStorage.removeItem(WORKBENCH_LOCAL_BRIDGE_SESSION_KEY);
  } catch {
    // Session storage may be unavailable in locked-down browser contexts.
  }
}

function removeWorkbenchLocalBridgePairingParamsFromUrl(params: URLSearchParams): void {
  params.delete('workbenchBridgeUrl');
  params.delete('workbenchBridgeToken');
  params.delete('workbenchPreviewUrl');
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

export function resolveWorkbenchHostAssetUrl(value: string): string {
  const pathname = getWorkbenchAssetPathname(value);
  if (!pathname) return value;

  const bridge = getWorkbenchLocalBridge();
  if (bridge) return toBridgeUrl(bridge.url, pathname);

  const preview = getWorkbenchLocalPreview();
  if (preview) return toLocalHostUrl(preview.url, pathname);

  return value;
}

export function installWorkbenchRuntimeAssetUrlResolver(target: typeof globalThis = globalThis): void {
  (target as WorkbenchRuntimeGlobal).__WORKBENCH_RESOLVE_ASSET_URL__ = resolveWorkbenchRuntimeAssetUrl;
}

export function resolveWorkbenchRuntimeAssetUrl(
  value: string,
  options: WorkbenchRuntimeAssetUrlOptions = {},
): string {
  const hostResolved = resolveWorkbenchHostAssetUrl(value);
  if (hostResolved !== value) return hostResolved;

  const baseURI = options.baseURI ?? options.document?.baseURI ?? getCurrentDocumentBaseURI();
  if (!baseURI) return value;

  try {
    return new URL(value, baseURI).toString();
  } catch {
    return value;
  }
}

function getCurrentDocumentBaseURI(): string | null {
  if (typeof document === 'undefined') return null;
  return document.baseURI || null;
}

function getWorkbenchLocalBridge(): WorkbenchLocalBridgeDescriptor | null {
  return getWorkbenchLocalBridgeWithPairingKind().descriptor;
}

function getWorkbenchLocalBridgeWithPairingKind(): {
  descriptor: WorkbenchLocalBridgeDescriptor | null;
  pairingKind: WorkbenchHostPairingKind;
} {
  if (typeof window === 'undefined') {
    return {
      descriptor: null,
      pairingKind: 'same-origin',
    };
  }
  const stored = getStoredWorkbenchLocalBridge();
  return stored
    ? { descriptor: stored, pairingKind: 'session-pairing' }
    : { descriptor: null, pairingKind: 'same-origin' };
}

function canRotateWorkbenchLocalBridgeToken(pairingKind: WorkbenchHostPairingKind): boolean {
  return pairingKind === 'session-pairing';
}

function getWorkbenchLocalPreview(): WorkbenchLocalPreviewDescriptor | null {
  if (typeof window === 'undefined') return null;
  const storedBridge = getStoredWorkbenchLocalBridge();
  return storedBridge?.previewUrl
    ? { protocolVersion: 1, url: storedBridge.previewUrl }
    : null;
}

function getStoredWorkbenchLocalBridge(): WorkbenchLocalBridgeDescriptor | null {
  try {
    const rawValue = window.sessionStorage.getItem(WORKBENCH_LOCAL_BRIDGE_SESSION_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as unknown;
    return isWorkbenchLocalBridgeDescriptor(parsed) && hasWorkbenchLocalBridgeToken(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isWorkbenchLocalBridgeDescriptor(value: unknown): value is WorkbenchLocalBridgeDescriptor {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.protocolVersion === 1 &&
    (candidate.token === undefined || (typeof candidate.token === 'string' && candidate.token.length > 0)) &&
    (
      candidate.previewUrl === undefined ||
      (typeof candidate.previewUrl === 'string' && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/i.test(candidate.previewUrl))
    ) &&
    typeof candidate.url === 'string' &&
    /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/i.test(candidate.url.replace(/\/+$/, ''))
  );
}

function hasWorkbenchLocalBridgeToken(
  descriptor: WorkbenchLocalBridgeDescriptor,
): descriptor is WorkbenchLocalBridgeDescriptor & { token: string } {
  return typeof descriptor.token === 'string' && descriptor.token.length > 0;
}

function isWorkbenchLocalPreviewDescriptor(value: unknown): value is WorkbenchLocalPreviewDescriptor {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.protocolVersion === 1 &&
    typeof candidate.url === 'string' &&
    /^http:\/\/(?:127\.0\.0\.1|localhost):\d+\/?$/i.test(candidate.url)
  );
}

function shouldRouteThroughBridge(input: string): boolean {
  const pathname = getFetchPathname(input);
  return BRIDGE_EXACT_ROUTES.has(pathname) ||
    pathname.startsWith(BRIDGE_PROJECT_FILE_PREFIX) ||
    BRIDGE_ASSET_FILE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function shouldRouteThroughLocalPreview(input: string): boolean {
  const pathname = getFetchPathname(input);
  return PREVIEW_EXACT_ROUTES.has(pathname);
}

function getFetchPathname(input: string): string {
  try {
    return new URL(input, window.location.href).pathname;
  } catch {
    return input.split('?', 1)[0] ?? input;
  }
}

function getWorkbenchAssetPathname(value: string): string | null {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (BRIDGE_ASSET_FILE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return normalized;
  try {
    const parsed = new URL(trimmed, window.location.href);
    return BRIDGE_ASSET_FILE_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix)) ? parsed.pathname : null;
  } catch {
    return null;
  }
}

function toBridgeUrl(bridgeUrl: string, input: string): string {
  return toLocalHostUrl(bridgeUrl, input);
}

function toLocalHostUrl(baseUrl: string, input: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${input.startsWith('/') ? input : `/${input}`}`;
}
