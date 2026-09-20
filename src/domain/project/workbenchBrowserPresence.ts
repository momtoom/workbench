const WORKBENCH_GATEWAY_CONFIG_PATH = '/__workbench/gateway.json';

type WorkbenchGatewayConfig = {
  browserPresencePath?: unknown;
  ok?: unknown;
};

export function installWorkbenchLocalBrowserPresence(): void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  const sessionId = createBrowserPresenceSessionId();
  let eventSource: EventSource | null = null;
  let presencePath: string | null = null;
  let disposed = false;

  const closePresence = () => {
    eventSource?.close();
    eventSource = null;
  };
  const openPresence = () => {
    if (disposed || eventSource || !presencePath) return;
    const url = new URL(presencePath, window.location.origin);
    url.searchParams.set('session', sessionId);
    eventSource = new EventSource(url);
  };
  const handlePageHide = () => closePresence();
  const handlePageShow = () => openPresence();

  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);

  void fetch(WORKBENCH_GATEWAY_CONFIG_PATH, { cache: 'no-store' })
    .then(async (response) => response.ok ? await response.json() as WorkbenchGatewayConfig : null)
    .then((config) => {
      if (
        disposed ||
        config?.ok !== true ||
        typeof config.browserPresencePath !== 'string' ||
        !config.browserPresencePath.startsWith('/__workbench/')
      ) {
        return;
      }
      presencePath = config.browserPresencePath;
      openPresence();
    })
    .catch(() => {
      // A direct hosted renderer has no local companion presence endpoint.
    });

  window.addEventListener('beforeunload', () => {
    disposed = true;
    closePresence();
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
  }, { once: true });
}

function createBrowserPresenceSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const values = crypto.getRandomValues(new Uint32Array(4));
  return Array.from(values, (value) => value.toString(36)).join('-');
}
