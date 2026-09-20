import { createHash, randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { existsSync, realpathSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { createRequire } from 'node:module';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import type { Plugin } from 'esbuild';
import type { WorkbenchLocalBridge } from '../local-bridge/server.js';

const PROJECT_PREVIEW_MODULE_PATH = '/__workbench/preview/module.json';
const PROJECT_RUNTIME_MODULE_PATH = '/__workbench/preview/source-module.json';
const PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH = '/__workbench/preview/runtime-bundle.json';
const PROJECT_RUNTIME_BUNDLE_PREFIX = '/__workbench/preview/runtime-bundle/';
const LOCAL_GATEWAY_CONFIG_PATH = '/__workbench/gateway.json';
const LOCAL_BROWSER_PRESENCE_PATH = '/__workbench/browser-presence';
const LOCAL_AUTH_HANDOFF_PATH = '/__workbench/auth-handoff';
const LOCAL_EXTERNAL_AUTH_START_PATH = '/__workbench/auth/external/start';
const LOCAL_EXTERNAL_AUTH_SESSION_PATH = '/__workbench/auth/external/session';
const LOCAL_AUTH_HANDOFF_MAX_BODY_BYTES = 8 * 1024;
const LOCAL_EXTERNAL_AUTH_HANDOFF_TTL_MS = 5 * 60_000;
const PROJECT_IMAGE_PROXY_PATH = '/__workbench/image-proxy';
const PROJECT_FILE_PREFIX = '/__workbench/files/';
const PROJECT_ASSET_PREFIX = '/workbench-assets/';
const PROJECT_VITE_ASSET_PREFIX = '/assets/';
const VITE_FS_PREFIX = '/@fs';
const VENDOR_REACT_PATH = '/__workbench-preview/vendor/react.js';
const VENDOR_REACT_DOM_PATH = '/__workbench-preview/vendor/react-dom.js';
const VENDOR_REACT_DOM_CLIENT_PATH = '/__workbench-preview/vendor/react-dom-client.js';
const VENDOR_REACT_JSX_RUNTIME_PATH = '/__workbench-preview/vendor/react-jsx-runtime.js';
const VENDOR_REACT_JSX_DEV_RUNTIME_PATH = '/__workbench-preview/vendor/react-jsx-dev-runtime.js';
const VENDOR_VUE_PATH = '/__workbench-preview/vendor/vue.js';
const VENDOR_RUNTIME_NAMESPACE = 'workbench-preview-vendor-runtime';
const MAX_PREVIEW_REQUEST_BODY_BYTES = 32 * 1024 * 1024;
const MAX_PREVIEW_IMAGE_PROXY_BYTES = 24 * 1024 * 1024;
const HOSTED_RENDERER_PROXY_TIMEOUT_MS = 12_000;
// Names which renderer actually answered, so "is this the packaged build or the
// hosted one?" is answerable from the response alone.
const RENDERER_SOURCE_HEADER = 'X-Workbench-Renderer-Source';
const LOCAL_BROWSER_SESSION_COOKIE = 'workbench_local_session';
const DEFAULT_ALLOWED_ORIGINS = [
  'null',
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/localhost:\d+$/,
];
const PREVIEW_SOURCE_EXTENSIONS = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.vue']);
const BLOCKED_SOURCE_PATH_PARTS = new Set(['.git', '.workbench', 'build', 'dist', 'node_modules']);
const PROJECT_ENV_MODE = 'production';
const PROJECT_ENV_FILES = ['.env', '.env.local', `.env.${PROJECT_ENV_MODE}`, `.env.${PROJECT_ENV_MODE}.local`];
const PROJECT_PUBLIC_ENV_PREFIX = 'VITE_';
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
const PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH = 8;
const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];
const BRIDGE_EXACT_ROUTES = new Set([
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
const BRIDGE_PREFIX_ROUTES = [
  PROJECT_FILE_PREFIX,
  PROJECT_ASSET_PREFIX,
];

export type WorkbenchLocalPreviewServer = {
  close: () => void;
  hasActiveBrowserSession: () => boolean;
  host: string;
  port: number;
  url: string;
};

export type WorkbenchLocalPreviewServerOptions = {
  allowedOrigins?: string[];
  authorizeBrowserSession?: () => Promise<boolean>;
  bridge: WorkbenchLocalBridge;
  distRoot: string;
  getActiveProjectRoot: () => string | null;
  host?: string;
  openExternalBrowserSignIn?: (handoffId: string) => Promise<void>;
  // When true, the packaged dist/ answers app-shell requests before the hosted
  // renderer is consulted. Hosted stays as the fallback so an asset missing from
  // dist/ still resolves.
  preferLocalRenderer?: boolean;
  resolveHostedRendererUrl?: () => Promise<string | undefined>;
  claimBrowserSignInHandoff?: (handoffId: string, session: unknown) => boolean;
  nodeModuleRoots?: string[];
  onBrowserPresenceChange?: (active: boolean) => void;
  fallbackToRandomPort?: boolean;
  port?: number;
};

type PreviewRouteContext = {
  allowedOrigins: Array<RegExp | string>;
  authorizeBrowserSession?: () => Promise<boolean>;
  browserSessionTokens: Set<string>;
  browserPresenceSessions: Map<string, ServerResponse>;
  bridge: WorkbenchLocalBridge;
  distRoot: string;
  getActiveProjectRoot: () => string | null;
  externalBrowserSignInHandoffs: Map<string, ExternalBrowserSignInHandoff>;
  openExternalBrowserSignIn?: (handoffId: string) => Promise<void>;
  preferLocalRenderer: boolean;
  resolveHostedRendererUrl?: () => Promise<string | undefined>;
  claimBrowserSignInHandoff?: (handoffId: string, session: unknown) => boolean;
  nodeModuleRoots: string[];
  onBrowserPresenceChange?: (active: boolean) => void;
  request: IncomingMessage;
  response: ServerResponse;
  runtimeBundles: Map<string, string>;
};
type ExternalBrowserSignInHandoff = {
  expiresAt: number;
  session?: unknown;
};
let esbuildImportPromise: Promise<typeof import('esbuild')> | null = null;

export async function startWorkbenchLocalPreviewServer(
  options: WorkbenchLocalPreviewServerOptions,
): Promise<WorkbenchLocalPreviewServer> {
  const host = options.host ?? '127.0.0.1';
  const distRoot = resolve(options.distRoot);
  const nodeModuleRoots = (options.nodeModuleRoots ?? [])
    .map((root) => resolve(root))
    .filter((root) => existsSync(root));
  const allowedOrigins = parseAllowedOrigins(options.allowedOrigins ?? []);
  const browserSessionTokens = new Set<string>();
  const browserPresenceSessions = new Map<string, ServerResponse>();
  const externalBrowserSignInHandoffs = new Map<string, ExternalBrowserSignInHandoff>();
  const runtimeBundles = new Map<string, string>();
  configureEsbuildBinaryPath(nodeModuleRoots);
  const server = createServer((request, response) => {
    void handlePreviewRequest({
      allowedOrigins,
      authorizeBrowserSession: options.authorizeBrowserSession,
      browserSessionTokens,
      browserPresenceSessions,
      bridge: options.bridge,
      distRoot,
      getActiveProjectRoot: options.getActiveProjectRoot,
      externalBrowserSignInHandoffs,
      openExternalBrowserSignIn: options.openExternalBrowserSignIn,
      preferLocalRenderer: options.preferLocalRenderer === true,
      resolveHostedRendererUrl: options.resolveHostedRendererUrl,
      claimBrowserSignInHandoff: options.claimBrowserSignInHandoff,
      nodeModuleRoots,
      onBrowserPresenceChange: options.onBrowserPresenceChange,
      request,
      response,
      runtimeBundles,
    });
  });

  const preferredPort = options.port ?? 0;
  try {
    await listen(server, preferredPort, host);
  } catch (error) {
    if (!options.fallbackToRandomPort || preferredPort === 0 || !isAddressInUseError(error)) throw error;
    console.warn(`Workbench local gateway port ${preferredPort} is already in use; falling back to an ephemeral port.`);
    await listen(server, 0, host);
  }
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Workbench local preview server did not bind to a TCP port.');
  }

  return {
    close: () => {
      for (const response of browserPresenceSessions.values()) response.end();
      browserPresenceSessions.clear();
      externalBrowserSignInHandoffs.clear();
      options.onBrowserPresenceChange?.(false);
      server.close();
    },
    hasActiveBrowserSession: () => browserPresenceSessions.size > 0,
    host,
    port: address.port,
    url: `http://${host}:${address.port}/`,
  };
}

async function handlePreviewRequest(context: PreviewRouteContext): Promise<void> {
  const { request, response } = context;
  const pathname = getRequestPathname(request);

  try {
    if (!(await authorizeLocalBrowserRequest(context, pathname))) return;

    if (!applyCorsHeaders(request, response, context.allowedOrigins)) {
      response.statusCode = 403;
      response.end('Workbench preview origin is not allowed');
      return;
    }

    if (request.method === 'OPTIONS') {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (request.method === 'POST' && pathname === LOCAL_AUTH_HANDOFF_PATH) {
      await claimBrowserSignInHandoff(context);
      return;
    }

    if (request.method === 'POST' && pathname === LOCAL_EXTERNAL_AUTH_START_PATH) {
      await startExternalBrowserSignIn(context);
      return;
    }

    if (request.method === 'GET' && pathname === LOCAL_EXTERNAL_AUTH_SESSION_PATH) {
      readExternalBrowserSignInSession(context);
      return;
    }

    if (request.method === 'GET' && pathname === LOCAL_GATEWAY_CONFIG_PATH) {
      const hostedRendererUrl = await context.resolveHostedRendererUrl?.();
      sendJson(response, {
        browserPresencePath: LOCAL_BROWSER_PRESENCE_PATH,
        bridgeEventsPath: '/__workbench-bridge/events',
        externalBrowserSignIn: Boolean(context.openExternalBrowserSignIn),
        hostedRendererOrigin: hostedRendererUrl
          ? new URL(hostedRendererUrl).origin
          : null,
        ok: true,
      });
      return;
    }

    if (request.method === 'GET' && pathname === LOCAL_BROWSER_PRESENCE_PATH) {
      openLocalBrowserPresence(context);
      return;
    }

    if (request.method === 'GET' && isVendorRuntimePath(pathname)) {
      sendJavaScript(response, getVendorRuntimeModule(pathname));
      return;
    }

    if (request.method === 'GET' && pathname === PROJECT_PREVIEW_MODULE_PATH) {
      await sendPreviewModuleManifest(context);
      return;
    }

    if (request.method === 'GET' && pathname === PROJECT_RUNTIME_MODULE_PATH) {
      await sendRuntimeModuleManifest(context);
      return;
    }

    if (request.method === 'POST' && pathname === PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH) {
      await sendRuntimeBundleManifest(context);
      return;
    }

    if (request.method === 'GET' && pathname.startsWith(PROJECT_RUNTIME_BUNDLE_PREFIX)) {
      sendRuntimeBundle(context, pathname);
      return;
    }

    if (request.method === 'GET' && pathname === PROJECT_IMAGE_PROXY_PATH) {
      await sendProxiedPreviewImage(context);
      return;
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && pathname.startsWith(VITE_FS_PREFIX)) {
      await sendProjectFsModule(context, request.method === 'HEAD');
      return;
    }

    if (shouldProxyToBridge(pathname)) {
      await proxyToLocalBridge(context);
      return;
    }

    // Renderer source priority. Hosted-first is the default so the desktop app
    // keeps picking up renderer updates without a reinstall. With
    // preferLocalRenderer the packaged dist/ wins instead, which is what lets a
    // freshly built package be verified while a hosted deploy is unavailable.
    const isReadRequest = request.method === 'GET' || request.method === 'HEAD';
    if (context.preferLocalRenderer) {
      if (isReadRequest && await tryServeStaticDistFile(context, request.method === 'HEAD')) return;
      if (await proxyToHostedRenderer(context)) return;
      if (isReadRequest) {
        await serveStaticDistFile(context, request.method === 'HEAD');
        return;
      }
    } else {
      if (await proxyToHostedRenderer(context)) return;
      if (isReadRequest) {
        await serveStaticDistFile(context, request.method === 'HEAD');
        return;
      }
    }

    response.statusCode = 405;
    response.end('Unsupported Workbench preview method');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workbench local preview request failed';
    if (!response.headersSent) response.statusCode = response.statusCode >= 400 ? response.statusCode : 500;
    response.end(message);
  }
}

function openLocalBrowserPresence(context: PreviewRouteContext): void {
  const sessionId = new URL(context.request.url ?? '/', 'http://workbench.local').searchParams.get('session') ?? '';
  if (!/^[a-zA-Z0-9_-]{12,128}$/.test(sessionId)) {
    context.response.statusCode = 400;
    context.response.end('Invalid browser presence session');
    return;
  }

  const previousResponse = context.browserPresenceSessions.get(sessionId);
  if (previousResponse && previousResponse !== context.response) previousResponse.end();

  context.response.writeHead(200, {
    'Cache-Control': 'no-store, max-age=0',
    'Connection': 'keep-alive',
    'Content-Type': 'text/event-stream; charset=utf-8',
    'X-Accel-Buffering': 'no',
  });
  context.response.write('event: ready\ndata: {}\n\n');
  context.browserPresenceSessions.set(sessionId, context.response);
  context.onBrowserPresenceChange?.(true);

  const keepAliveTimer = setInterval(() => {
    context.response.write(': keepalive\n\n');
  }, 15_000);
  keepAliveTimer.unref?.();

  const close = () => {
    clearInterval(keepAliveTimer);
    if (context.browserPresenceSessions.get(sessionId) === context.response) {
      context.browserPresenceSessions.delete(sessionId);
      if (context.browserPresenceSessions.size === 0) context.onBrowserPresenceChange?.(false);
    }
  };
  context.request.on('close', close);
  context.response.on('close', close);
}

async function claimBrowserSignInHandoff(context: PreviewRouteContext): Promise<void> {
  let payload: unknown;
  try {
    const body = await readRequestBodyBuffer(context.request);
    if (body.byteLength > LOCAL_AUTH_HANDOFF_MAX_BODY_BYTES) throw new Error('Handoff payload is too large');
    payload = JSON.parse(body.toString('utf8'));
  } catch {
    context.response.statusCode = 400;
    context.response.end('Invalid browser sign-in handoff request');
    return;
  }

  const handoff = payload as { handoffId?: unknown; session?: unknown } | null;
  if (!handoff || typeof handoff.handoffId !== 'string' || !handoff.session) {
    context.response.statusCode = 400;
    context.response.end('Browser sign-in handoff request must include a handoff id and session');
    return;
  }

  // A handoff id is single-use and short-lived; a stale or replayed one is not an error the
  // browser can recover from, so report it as gone rather than retrying.
  const claimedByDesktopWindow = context.claimBrowserSignInHandoff?.(handoff.handoffId, handoff.session) === true;
  const claimedByExternalBrowser = completeExternalBrowserSignInHandoff(context, handoff.handoffId, handoff.session);
  if (!claimedByDesktopWindow && !claimedByExternalBrowser) {
    context.response.statusCode = 410;
    sendJson(context.response, { ok: false });
    return;
  }

  sendJson(context.response, { ok: true });
}

async function startExternalBrowserSignIn(context: PreviewRouteContext): Promise<void> {
  const openExternalBrowserSignIn = context.openExternalBrowserSignIn;
  if (!openExternalBrowserSignIn) {
    context.response.statusCode = 404;
    sendJson(context.response, { message: 'External browser sign-in is not available.', ok: false });
    return;
  }

  pruneExternalBrowserSignInHandoffs(context.externalBrowserSignInHandoffs);
  const handoffId = randomBytes(32).toString('base64url');
  context.externalBrowserSignInHandoffs.set(handoffId, {
    expiresAt: Date.now() + LOCAL_EXTERNAL_AUTH_HANDOFF_TTL_MS,
  });

  try {
    await openExternalBrowserSignIn(handoffId);
  } catch (error) {
    context.externalBrowserSignInHandoffs.delete(handoffId);
    context.response.statusCode = 502;
    sendJson(context.response, {
      message: error instanceof Error ? error.message : 'The system browser could not be opened.',
      ok: false,
    });
    return;
  }

  sendJson(context.response, {
    expiresInMs: LOCAL_EXTERNAL_AUTH_HANDOFF_TTL_MS,
    handoffId,
    ok: true,
  });
}

function readExternalBrowserSignInSession(context: PreviewRouteContext): void {
  pruneExternalBrowserSignInHandoffs(context.externalBrowserSignInHandoffs);
  const handoffId = new URL(context.request.url ?? '/', 'http://workbench.local').searchParams.get('handoffId') ?? '';
  if (!/^[a-zA-Z0-9_-]{32,128}$/.test(handoffId)) {
    context.response.statusCode = 400;
    sendJson(context.response, { message: 'Invalid browser sign-in handoff.', ok: false });
    return;
  }

  const handoff = context.externalBrowserSignInHandoffs.get(handoffId);
  if (!handoff) {
    context.response.statusCode = 410;
    sendJson(context.response, { message: 'Browser sign-in expired. Try again.', ok: false });
    return;
  }
  if (!handoff.session) {
    context.response.statusCode = 202;
    sendJson(context.response, { ok: false, state: 'pending' });
    return;
  }

  context.externalBrowserSignInHandoffs.delete(handoffId);
  sendJson(context.response, { ok: true, session: handoff.session });
}

function completeExternalBrowserSignInHandoff(
  context: PreviewRouteContext,
  handoffId: string,
  session: unknown,
): boolean {
  pruneExternalBrowserSignInHandoffs(context.externalBrowserSignInHandoffs);
  const handoff = context.externalBrowserSignInHandoffs.get(handoffId);
  if (!handoff || handoff.session) return false;
  handoff.session = session;
  return true;
}

function pruneExternalBrowserSignInHandoffs(
  handoffs: Map<string, ExternalBrowserSignInHandoff>,
): void {
  const now = Date.now();
  for (const [handoffId, handoff] of handoffs) {
    if (handoff.expiresAt <= now) handoffs.delete(handoffId);
  }
}

async function authorizeLocalBrowserRequest(
  context: PreviewRouteContext,
  pathname: string,
): Promise<boolean> {
  if (!context.authorizeBrowserSession) return true;
  const token = readCookie(context.request, LOCAL_BROWSER_SESSION_COOKIE);
  if (token && context.browserSessionTokens.has(token)) return true;

  if (context.request.method !== 'GET' || pathname !== '/') {
    context.response.statusCode = 401;
    context.response.end('Open the Workbench local URL to approve this browser session');
    return false;
  }

  const approved = await context.authorizeBrowserSession();
  if (!approved) {
    context.response.statusCode = 403;
    context.response.end('Workbench browser session was not approved');
    return false;
  }

  const nextToken = randomBytes(32).toString('base64url');
  context.browserSessionTokens.add(nextToken);
  context.response.setHeader(
    'Set-Cookie',
    `${LOCAL_BROWSER_SESSION_COOKIE}=${nextToken}; HttpOnly; SameSite=Strict; Path=/`,
  );
  return true;
}

function readCookie(request: IncomingMessage, name: string): string | null {
  const cookieHeader = request.headers.cookie ?? '';
  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim() || null;
  }
  return null;
}

async function sendPreviewModuleManifest(context: PreviewRouteContext): Promise<void> {
  const projectRoot = context.getActiveProjectRoot();
  if (!projectRoot) {
    context.response.statusCode = 409;
    context.response.end('No Workbench project is open');
    return;
  }

  const url = new URL(context.request.url ?? '/', 'http://workbench.local');
  const sourcePath = normalizeWorkbenchPreviewPageSourcePath(url.searchParams.get('source') ?? '');
  if (!sourcePath) {
    context.response.statusCode = 400;
    context.response.end('Browser preview only supports workbench page source files');
    return;
  }

  const sourceFilePath = resolve(projectRoot, sourcePath);
  if (!isPathInside(projectRoot, sourceFilePath)) {
    context.response.statusCode = 400;
    context.response.end('Invalid preview source file path');
    return;
  }

  const cssModuleUrls = await collectProjectCssModuleUrls(projectRoot, sourcePath);
  const tailwindCssConfig = await readProjectTailwindPreviewCssConfig(projectRoot);
  sendJson(context.response, {
    cssModuleUrls: cssModuleUrls.map((moduleUrl) => toPublicPreviewUrl(context.request, moduleUrl)),
    moduleUrl: toPublicPreviewUrl(context.request, toWorkbenchFileSystemModuleUrl(sourceFilePath)),
    ok: true,
    sourceFile: sourcePath,
    tailwindCssMode: getProjectTailwindPreviewCssMode(tailwindCssConfig),
  });
}

async function sendRuntimeModuleManifest(context: PreviewRouteContext): Promise<void> {
  const projectRoot = context.getActiveProjectRoot();
  if (!projectRoot) {
    context.response.statusCode = 409;
    context.response.end('No Workbench project is open');
    return;
  }

  const url = new URL(context.request.url ?? '/', 'http://workbench.local');
  const sourcePath = normalizeWorkbenchRuntimeSourcePath(url.searchParams.get('source') ?? '');
  const dependencyPath = normalizeWorkbenchRuntimeSourcePath(url.searchParams.get('dependency') ?? '', true);
  if (!sourcePath || dependencyPath === null) {
    context.response.statusCode = 400;
    context.response.end('Invalid runtime module source path');
    return;
  }

  const sourceFilePath = resolve(projectRoot, sourcePath);
  const dependencyFilePath = dependencyPath ? resolve(projectRoot, dependencyPath) : null;
  if (
    !isPathInside(projectRoot, sourceFilePath) ||
    (dependencyFilePath && !isPathInside(projectRoot, dependencyFilePath))
  ) {
    context.response.statusCode = 400;
    context.response.end('Invalid runtime module source path');
    return;
  }

  try {
    const [sourceContents, dependencyContents, projectEnv, dependencyTreeFingerprint] = await Promise.all([
      readFile(sourceFilePath),
      dependencyFilePath ? readFile(dependencyFilePath) : Promise.resolve(null),
      readProjectPublicEnv(projectRoot),
      getProjectDependencyTreeFingerprint(projectRoot),
    ]);
    const sourceVersion = createHash('sha256')
      .update(sourcePath)
      .update(sourceContents)
      .update(dependencyPath ?? '')
      .update(dependencyContents ?? '')
      .update(createProjectPublicEnvFingerprint(projectEnv))
      // A module URL that failed to import stays failed in the browser's module
      // map for the document's lifetime, so the URL must change when the
      // dependency tree changes (e.g. npm install finishing).
      .update(dependencyTreeFingerprint)
      .digest('hex')
      .slice(0, 16);
    const modulePath = `${toWorkbenchFileSystemModuleUrl(sourceFilePath)}?wb_source_version=${sourceVersion}`;
    sendJson(context.response, {
      moduleUrl: modulePath,
      ok: true,
      sourceFile: sourcePath,
    });
  } catch (error) {
    context.response.statusCode = 404;
    context.response.end(error instanceof Error ? error.message : 'Runtime module could not be resolved');
  }
}

type RuntimeBundleImportRequest = {
  importSource: string;
  key: string;
  sourceFile: string;
};

async function sendRuntimeBundleManifest(context: PreviewRouteContext): Promise<void> {
  const projectRoot = context.getActiveProjectRoot();
  if (!projectRoot) {
    context.response.statusCode = 409;
    context.response.end('No Workbench project is open');
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse((await readRequestBodyBuffer(context.request)).toString('utf8'));
  } catch {
    context.response.statusCode = 400;
    context.response.end('Invalid runtime bundle request');
    return;
  }

  const imports = normalizeRuntimeBundleImports(payload);
  if (!imports || imports.length === 0) {
    context.response.statusCode = 400;
    context.response.end('Runtime bundle request must include project-local imports');
    return;
  }

  const resolvedImports: Array<RuntimeBundleImportRequest & { exportName: string; resolvedSourceFile: string }> = [];
  const failures: Array<{ key: string; reason: string }> = [];
  for (const [index, runtimeImport] of imports.entries()) {
    const resolvedImportPath = resolveProjectLocalImportSourcePath(runtimeImport.sourceFile, runtimeImport.importSource);
    const resolvedSourceFile = resolvedImportPath
      ? await resolveProjectSourceModulePath(projectRoot, resolvedImportPath)
      : null;
    if (!resolvedSourceFile) {
      failures.push({
        key: runtimeImport.key,
        reason: `Workbench could not resolve ${runtimeImport.importSource} from ${runtimeImport.sourceFile}.`,
      });
      continue;
    }
    resolvedImports.push({
      ...runtimeImport,
      exportName: `__workbench_runtime_module_${index}`,
      resolvedSourceFile,
    });
  }

  if (resolvedImports.length === 0) {
    sendJson(context.response, { failures, imports: [], ok: false });
    return;
  }

  try {
    const entrySource = resolvedImports.map(({ exportName, resolvedSourceFile }) => (
      `import * as ${exportName} from ${JSON.stringify(`./${resolvedSourceFile}`)};`
    )).concat(
      `export { ${resolvedImports.map(({ exportName }) => exportName).join(', ')} };`,
    ).join('\n');
    const contents = await compileProjectRuntimeBundle({
      entrySource,
      nodeModuleRoots: context.nodeModuleRoots,
      projectRoot,
    });
    const bundleId = createHash('sha256').update(contents).digest('hex').slice(0, 24);
    context.runtimeBundles.set(bundleId, contents);
    while (context.runtimeBundles.size > 8) {
      const oldestBundleId = context.runtimeBundles.keys().next().value as string | undefined;
      if (!oldestBundleId) break;
      context.runtimeBundles.delete(oldestBundleId);
    }
    sendJson(context.response, {
      failures,
      imports: resolvedImports.map(({ exportName, key }) => ({ exportName, key })),
      moduleUrl: toPublicPreviewUrl(
        context.request,
        `${PROJECT_RUNTIME_BUNDLE_PREFIX}${bundleId}.js`,
      ),
      ok: true,
    });
  } catch (error) {
    context.response.statusCode = 422;
    context.response.end(error instanceof Error ? error.message : 'Runtime bundle could not be built');
  }
}

function normalizeRuntimeBundleImports(payload: unknown): RuntimeBundleImportRequest[] | null {
  if (!payload || typeof payload !== 'object' || !('imports' in payload) || !Array.isArray(payload.imports)) return null;
  if (payload.imports.length === 0 || payload.imports.length > 512) return null;
  const imports: RuntimeBundleImportRequest[] = [];
  const keys = new Set<string>();
  for (const value of payload.imports) {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const key = typeof record.key === 'string' ? record.key.trim() : '';
    const importSource = typeof record.importSource === 'string' ? record.importSource.trim() : '';
    const sourceFile = typeof record.sourceFile === 'string'
      ? normalizeWorkbenchRuntimeSourcePath(record.sourceFile.trim())
      : null;
    if (!key || key.length > 1024 || keys.has(key) || !sourceFile || !isProjectLocalImportSource(importSource)) return null;
    keys.add(key);
    imports.push({ importSource, key, sourceFile });
  }
  return imports;
}

function sendRuntimeBundle(context: PreviewRouteContext, pathname: string): void {
  const bundleId = pathname.slice(PROJECT_RUNTIME_BUNDLE_PREFIX.length).replace(/\.js$/, '');
  if (!/^[a-f0-9]{24}$/.test(bundleId)) {
    context.response.statusCode = 400;
    context.response.end('Invalid runtime bundle id');
    return;
  }
  const contents = context.runtimeBundles.get(bundleId);
  if (!contents) {
    context.response.statusCode = 404;
    context.response.end('Runtime bundle expired');
    return;
  }
  context.response.setHeader('Cache-Control', 'no-store, max-age=0');
  sendJavaScript(context.response, contents);
}

async function sendProxiedPreviewImage(context: PreviewRouteContext): Promise<void> {
  const url = new URL(context.request.url ?? '/', 'http://workbench.local');
  const rawImageUrl = url.searchParams.get('url')?.trim() ?? '';
  if (!rawImageUrl) {
    context.response.statusCode = 400;
    context.response.end('Missing image URL');
    return;
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(rawImageUrl);
  } catch {
    context.response.statusCode = 400;
    context.response.end('Invalid image URL');
    return;
  }

  if (imageUrl.protocol !== 'http:' && imageUrl.protocol !== 'https:') {
    context.response.statusCode = 400;
    context.response.end('Only http and https image URLs are supported');
    return;
  }
  if (!(await isSafePreviewImageProxyTargetUrl(imageUrl))) {
    context.response.statusCode = 400;
    context.response.end('Image URL is not allowed');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const upstream = await fetch(imageUrl.href, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 Workbench-V1 Image Proxy',
      },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      context.response.statusCode = upstream.status;
      context.response.end('Image request failed');
      return;
    }

    const upstreamContentType = upstream.headers.get('content-type') ?? '';
    if (!upstreamContentType.toLowerCase().startsWith('image/')) {
      context.response.statusCode = 415;
      context.response.end('URL did not return an image');
      return;
    }

    const contentLength = Number(upstream.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_PREVIEW_IMAGE_PROXY_BYTES) {
      context.response.statusCode = 413;
      context.response.end('Image is too large');
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_PREVIEW_IMAGE_PROXY_BYTES) {
      context.response.statusCode = 413;
      context.response.end('Image is too large');
      return;
    }

    const contentType = getPreviewImageProxyContentType(buffer, upstreamContentType);
    context.response.setHeader('Access-Control-Allow-Origin', '*');
    context.response.setHeader('Cache-Control', 'public, max-age=300');
    context.response.setHeader('Content-Length', String(buffer.byteLength));
    context.response.setHeader('Content-Type', contentType);
    context.response.end(buffer);
  } catch (error) {
    context.response.statusCode = 502;
    context.response.end(error instanceof Error ? error.message : 'Image request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function isSafePreviewImageProxyTargetUrl(url: URL): Promise<boolean> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (isBlockedPreviewImageProxyHostname(url.hostname)) return false;

  const literalIp = normalizePreviewIpLiteral(url.hostname);
  if (literalIp && isBlockedPreviewImageProxyIp(literalIp)) return false;

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((address) => !isBlockedPreviewImageProxyIp(address.address));
  } catch {
    return false;
  }
}

function isBlockedPreviewImageProxyHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local');
}

function normalizePreviewIpLiteral(hostname: string): string | null {
  const normalized = hostname.replace(/^\[|\]$/g, '');
  return isIP(normalized) ? normalized : null;
}

function isBlockedPreviewImageProxyIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) return isBlockedPreviewImageProxyIp(normalized.slice('::ffff:'.length));
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    const [first = 0, second = 0] = normalized.split('.').map((part) => Number(part));
    return first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224;
  }
  if (ipVersion === 6) {
    return normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:');
  }
  return true;
}

function getPreviewImageProxyContentType(buffer: Buffer, upstreamContentType: string): string {
  return sniffPreviewImageContentType(buffer) ?? upstreamContentType;
}

function sniffPreviewImageContentType(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(buffer.toString('ascii', 8, 12))
  ) {
    return 'image/avif';
  }
  return null;
}

async function sendProjectFsModule(context: PreviewRouteContext, headOnly: boolean): Promise<void> {
  const projectRoot = context.getActiveProjectRoot();
  if (!projectRoot) {
    context.response.statusCode = 409;
    context.response.end('No Workbench project is open');
    return;
  }

  const filePath = resolveWorkbenchFileSystemModulePath(getRequestPathname(context.request));
  if (!filePath || !isPathInside(projectRoot, filePath)) {
    context.response.statusCode = 403;
    context.response.end('Workbench preview modules must stay inside the active project');
    return;
  }

  if (!PREVIEW_SOURCE_EXTENSIONS.has(extname(filePath).toLowerCase())) {
    context.response.statusCode = 415;
    context.response.end('Unsupported Workbench preview module type');
    return;
  }

  const contents = headOnly
    ? ''
    : await compileProjectModule({
      filePath,
      nodeModuleRoots: context.nodeModuleRoots,
      projectRoot,
    });
  context.response.setHeader('Cache-Control', 'no-store, max-age=0');
  context.response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  if (headOnly) {
    context.response.end();
    return;
  }
  context.response.end(contents);
}

export async function compileProjectModule(options: {
  filePath: string;
  nodeModuleRoots: string[];
  projectRoot: string;
}): Promise<string> {
  const esbuild = await loadEsbuild(options.nodeModuleRoots);
  const projectEnv = await readProjectPublicEnv(options.projectRoot);
  const result = await esbuild.build({
    absWorkingDir: options.projectRoot,
    bundle: true,
    conditions: ['browser', 'import', 'module', 'default'],
    define: createProjectPreviewDefine(projectEnv),
    entryPoints: [options.filePath],
    format: 'esm',
    jsx: 'automatic',
    logLevel: 'silent',
    mainFields: ['browser', 'module', 'main'],
    nodePaths: options.nodeModuleRoots,
    outfile: 'workbench-preview-module.js',
    platform: 'browser',
    plugins: [
      createWorkbenchPreviewVendorPlugin(),
      createWorkbenchPreviewProjectAliasPlugin(options.projectRoot),
      createWorkbenchPreviewProjectBoundaryPlugin(options.projectRoot, options.nodeModuleRoots),
      createWorkbenchPreviewVuePlugin(options.projectRoot, options.nodeModuleRoots),
      createWorkbenchPreviewCssPlugin(),
    ],
    sourcemap: 'inline',
    target: ['es2020'],
    write: false,
  });
  const output = result.outputFiles?.find((file) => file.path.endsWith('.js')) ?? result.outputFiles?.[0];
  if (!output) throw new Error('Workbench preview module did not produce JavaScript.');
  return output.text;
}

export async function compileProjectRuntimeBundle(options: {
  entrySource: string;
  nodeModuleRoots: string[];
  projectRoot: string;
}): Promise<string> {
  const esbuild = await loadEsbuild(options.nodeModuleRoots);
  const projectEnv = await readProjectPublicEnv(options.projectRoot);
  const result = await esbuild.build({
    absWorkingDir: options.projectRoot,
    bundle: true,
    conditions: ['browser', 'import', 'module', 'default'],
    define: createProjectPreviewDefine(projectEnv),
    format: 'esm',
    jsx: 'automatic',
    logLevel: 'silent',
    mainFields: ['browser', 'module', 'main'],
    nodePaths: options.nodeModuleRoots,
    outfile: 'workbench-preview-runtime-bundle.js',
    platform: 'browser',
    plugins: [
      createWorkbenchPreviewVendorPlugin(),
      createWorkbenchPreviewProjectAliasPlugin(options.projectRoot),
      createWorkbenchPreviewProjectBoundaryPlugin(options.projectRoot, options.nodeModuleRoots),
      createWorkbenchPreviewVuePlugin(options.projectRoot, options.nodeModuleRoots),
      createWorkbenchPreviewCssPlugin(),
    ],
    sourcemap: 'inline',
    stdin: {
      contents: options.entrySource,
      loader: 'ts',
      resolveDir: options.projectRoot,
      sourcefile: 'workbench-preview-runtime-entry.ts',
    },
    target: ['es2020'],
    write: false,
  });
  const output = result.outputFiles?.find((file) => file.path.endsWith('.js')) ?? result.outputFiles?.[0];
  if (!output) throw new Error('Workbench preview runtime bundle did not produce JavaScript.');
  return output.text;
}

function createProjectPreviewDefine(projectEnv: Record<string, string>): Record<string, string> {
  return {
    'import.meta.env': JSON.stringify({
      BASE_URL: '/',
      DEV: false,
      MODE: PROJECT_ENV_MODE,
      PROD: true,
      SSR: false,
      ...projectEnv,
    }),
    'process.env.NODE_ENV': JSON.stringify(PROJECT_ENV_MODE),
  };
}

async function readProjectPublicEnv(projectRoot: string): Promise<Record<string, string>> {
  const publicEnv: Record<string, string> = {};
  for (const envFile of PROJECT_ENV_FILES) {
    let contents: string;
    try {
      contents = await readFile(join(projectRoot, envFile), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }

    for (const [key, value] of parseProjectEnvEntries(contents)) {
      if (key.startsWith(PROJECT_PUBLIC_ENV_PREFIX)) publicEnv[key] = value;
    }
  }
  return publicEnv;
}

function parseProjectEnvEntries(contents: string): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const rawLine of contents.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trimStart();

    const separator = line.indexOf('=');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    entries.push([key, parseProjectEnvValue(line.slice(separator + 1))]);
  }
  return entries;
}

function parseProjectEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'" || quote === '`') && value.endsWith(quote)) {
    const unquoted = value.slice(1, -1);
    if (quote !== '"') return unquoted;
    return unquoted
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  const commentIndex = value.search(/\s+#/);
  return (commentIndex >= 0 ? value.slice(0, commentIndex) : value).trim();
}

function createProjectPublicEnvFingerprint(projectEnv: Record<string, string>): string {
  return JSON.stringify(Object.entries(projectEnv).sort(([left], [right]) => left.localeCompare(right)));
}

async function getProjectDependencyTreeFingerprint(projectRoot: string): Promise<string> {
  const parts = await Promise.all(
    ['package.json', 'package-lock.json', join('node_modules', '.package-lock.json')].map(async (candidate) => {
      try {
        const stats = await stat(join(projectRoot, candidate));
        return `${Math.trunc(stats.mtimeMs)}:${stats.size}`;
      } catch {
        return 'missing';
      }
    }),
  );
  return parts.join('|');
}

function loadEsbuild(nodeModuleRoots: string[]): Promise<typeof import('esbuild')> {
  configureEsbuildBinaryPath(nodeModuleRoots);
  esbuildImportPromise ??= import('esbuild');
  return esbuildImportPromise;
}

function configureEsbuildBinaryPath(nodeModuleRoots: string[]): void {
  if (process.env.ESBUILD_BINARY_PATH) return;

  const packageName = getEsbuildPlatformPackageName();
  if (!packageName) return;

  const executableName = process.platform === 'win32' ? 'esbuild.exe' : 'esbuild';
  for (const root of nodeModuleRoots) {
    const candidate = join(root, '@esbuild', packageName, 'bin', executableName);
    if (existsSync(candidate)) {
      process.env.ESBUILD_BINARY_PATH = candidate;
      return;
    }
  }
}

function getEsbuildPlatformPackageName(): string | null {
  if (process.platform === 'darwin') {
    if (process.arch === 'arm64') return 'darwin-arm64';
    if (process.arch === 'x64') return 'darwin-x64';
  }
  if (process.platform === 'linux') {
    if (process.arch === 'arm64') return 'linux-arm64';
    if (process.arch === 'x64') return 'linux-x64';
  }
  if (process.platform === 'win32') {
    if (process.arch === 'arm64') return 'win32-arm64';
    if (process.arch === 'x64') return 'win32-x64';
  }
  return null;
}

function createWorkbenchPreviewVendorPlugin(): Plugin {
  const vendorModules = new Map([
    ['react', VENDOR_REACT_PATH],
    ['react-dom', VENDOR_REACT_DOM_PATH],
    ['react-dom/client', VENDOR_REACT_DOM_CLIENT_PATH],
    ['react/jsx-runtime', VENDOR_REACT_JSX_RUNTIME_PATH],
    ['react/jsx-dev-runtime', VENDOR_REACT_JSX_DEV_RUNTIME_PATH],
    ['vue', VENDOR_VUE_PATH],
  ]);

  return {
    name: 'workbench-preview-vendor',
    setup(build) {
      build.onResolve({ filter: /^(?:react(?:\/jsx-runtime|\/jsx-dev-runtime)?|react-dom(?:\/client)?|vue)$/ }, (args) => ({
        namespace: VENDOR_RUNTIME_NAMESPACE,
        path: args.path,
        pluginData: {
          publicPath: vendorModules.get(args.path),
        },
      }));
      build.onResolve({ filter: /^react-dom\/(?:server|static)(?:\.[\w-]+)?$/ }, (args) => ({
        errors: [{
          text: `Workbench preview cannot bundle "${args.path}": server rendering APIs are not available in the preview runtime. Use react-dom/client for client rendering instead.`,
        }],
      }));
      build.onLoad({ filter: /.*/, namespace: VENDOR_RUNTIME_NAMESPACE }, (args) => ({
        contents: getVendorRuntimeModuleForSpecifier(args.path),
        loader: 'js',
        resolveDir: '/',
      }));
    },
  };
}

function createWorkbenchPreviewProjectAliasPlugin(projectRoot: string): Plugin {
  return {
    name: 'workbench-preview-project-alias',
    setup(build) {
      build.onResolve({ filter: /^@\// }, (args) => {
        const targetPath = resolveProjectAliasImportPath(projectRoot, args.path);
        if (!targetPath) {
          return {
            errors: [{ text: `Workbench preview could not resolve project alias import: ${args.path}` }],
          };
        }
        return { path: targetPath };
      });
    },
  };
}

function resolveProjectAliasImportPath(projectRoot: string, source: string): string | null {
  const srcRoot = resolve(projectRoot, 'src');
  const targetPath = resolve(srcRoot, source.slice(2));
  if (!isPathInside(srcRoot, targetPath)) return null;

  const candidates = extname(targetPath)
    ? [targetPath]
    : [
      `${targetPath}.tsx`,
      `${targetPath}.ts`,
      `${targetPath}.jsx`,
      `${targetPath}.js`,
      `${targetPath}.vue`,
      join(targetPath, 'index.tsx'),
      join(targetPath, 'index.ts'),
      join(targetPath, 'index.jsx'),
      join(targetPath, 'index.js'),
      join(targetPath, 'index.vue'),
    ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function createWorkbenchPreviewProjectBoundaryPlugin(
  projectRoot: string,
  nodeModuleRoots: string[],
): Plugin {
  return {
    name: 'workbench-preview-project-boundary',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (!args.path.startsWith('.') && !isAbsolute(args.path)) return undefined;

        const candidate = resolve(args.resolveDir || projectRoot, args.path);
        if (isPathInside(projectRoot, candidate)) return undefined;
        if (nodeModuleRoots.some((root) => isPathInside(root, candidate))) return undefined;
        if (hasNodeModulesPathPart(candidate)) return undefined;

        return {
          errors: [{ text: `Workbench preview import escapes the active project: ${args.path}` }],
        };
      });
    },
  };
}

function hasNodeModulesPathPart(filePath: string): boolean {
  return filePath.split(/[\\/]+/).includes('node_modules');
}

// Structural view of the project's own vue/compiler-sfc — the compiler ships
// with the project's `vue` install so the compiled output always matches the
// Vue version the page actually runs against.
type VueCompilerSfcModule = {
  compileScript: (descriptor: unknown, options: Record<string, unknown>) => { content: string };
  compileStyle: (options: Record<string, unknown>) => { code: string; errors: unknown[] };
  compileTemplate: (options: Record<string, unknown>) => { code: string; errors: unknown[] };
  parse: (source: string, options: { filename: string }) => {
    descriptor: {
      script: { content: string } | null;
      scriptSetup: { content: string } | null;
      styles: Array<{ content: string; scoped?: boolean }>;
      template: { content: string } | null;
    };
    errors: unknown[];
  };
};

const projectVueCompilerSfcCache = new Map<string, VueCompilerSfcModule>();

function loadProjectVueCompilerSfc(projectRoot: string, nodeModuleRoots: string[]): VueCompilerSfcModule {
  const projectRequire = createRequire(join(projectRoot, 'package.json'));
  let resolvedPath: string | null = null;
  try {
    resolvedPath = projectRequire.resolve('vue/compiler-sfc');
  } catch {
    for (const moduleRoot of nodeModuleRoots) {
      try {
        resolvedPath = projectRequire.resolve(join(moduleRoot, 'vue', 'compiler-sfc'));
        break;
      } catch {
        // Keep looking through the remaining module roots.
      }
    }
  }
  if (!resolvedPath) {
    throw new Error('Vue preview modules need the project to install "vue" (vue/compiler-sfc was not found).');
  }
  const cached = projectVueCompilerSfcCache.get(resolvedPath);
  if (cached) return cached;
  const loaded = projectRequire(resolvedPath) as VueCompilerSfcModule;
  projectVueCompilerSfcCache.set(resolvedPath, loaded);
  return loaded;
}

function createWorkbenchPreviewVuePlugin(projectRoot: string, nodeModuleRoots: string[]): Plugin {
  return {
    name: 'workbench-preview-vue',
    setup(build) {
      build.onLoad({ filter: /\.vue$/i }, async (args) => ({
        contents: compileVueSfcModule(
          loadProjectVueCompilerSfc(projectRoot, nodeModuleRoots),
          await readFile(args.path, 'utf8'),
          args.path,
        ),
        loader: 'ts',
        resolveDir: dirname(args.path),
      }));
    },
  };
}

function compileVueSfcModule(compilerSfc: VueCompilerSfcModule, source: string, filePath: string): string {
  const { descriptor, errors } = compilerSfc.parse(source, { filename: filePath });
  if (errors.length > 0) {
    throw new Error(`Failed to parse Vue SFC ${filePath}: ${String(errors[0])}`);
  }
  const id = createHash('sha256').update(filePath).digest('hex').slice(0, 8);
  const scoped = descriptor.styles.some((style) => style.scoped);
  const scopeId = `data-v-${id}`;
  let code = '';
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compilerSfc.compileScript(descriptor, {
      genDefaultAs: '_sfc_main',
      id,
      inlineTemplate: Boolean(descriptor.scriptSetup),
      templateOptions: {
        compilerOptions: { scopeId: scoped ? scopeId : undefined },
        scoped,
      },
    });
    code += `${script.content}\n`;
  } else {
    code += 'const _sfc_main = {};\n';
  }
  if (descriptor.template && !descriptor.scriptSetup) {
    const template = compilerSfc.compileTemplate({
      compilerOptions: { scopeId: scoped ? scopeId : undefined },
      filename: filePath,
      id,
      scoped,
      source: descriptor.template.content,
    });
    if (template.errors.length > 0) {
      throw new Error(`Failed to compile Vue template ${filePath}: ${String(template.errors[0])}`);
    }
    code += `${template.code}\n_sfc_main.render = render;\n`;
  }
  if (scoped) {
    code += `_sfc_main.__scopeId = ${JSON.stringify(scopeId)};\n`;
  }
  const cssText = descriptor.styles
    .map((style) => {
      const compiled = compilerSfc.compileStyle({
        filename: filePath,
        id: scopeId,
        scoped: Boolean(style.scoped),
        source: style.content,
      });
      if (compiled.errors.length > 0) {
        throw new Error(`Failed to compile Vue style ${filePath}: ${String(compiled.errors[0])}`);
      }
      return compiled.code;
    })
    .join('\n');
  if (cssText.trim()) {
    // Scoped in an IIFE so the injection locals cannot collide with SFC
    // script bindings when concatenated into the same module. The leading
    // semicolon matters: compileScript's output ends without one, so a bare
    // `(() => {…})()` on the next line would parse as a call on the
    // component definition — `defineComponent({…})(() => {…})()` — and every
    // SFC with both a <script setup> and a <style> block failed to load.
    code += `;(() => {
  const styleId = ${JSON.stringify(`workbench-preview-vue-css-${id}`)};
  let style = document.querySelector(\`style[data-workbench-preview-css="\${styleId}"]\`);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-workbench-preview-css", styleId);
    document.head.appendChild(style);
  }
  style.textContent = ${JSON.stringify(cssText)};
})();\n`;
  }
  code += 'export default _sfc_main;\n';
  return code;
}

function createWorkbenchPreviewCssPlugin(): Plugin {
  return {
    name: 'workbench-preview-css',
    setup(build) {
      build.onLoad({ filter: /\.css$/i }, async (args) => ({
        contents: createCssInjectionModule(args.path, await readFile(args.path, 'utf8')),
        loader: 'js',
        resolveDir: dirname(args.path),
      }));
    },
  };
}

function createCssInjectionModule(filePath: string, cssText: string): string {
  const id = createHash('sha256').update(filePath).digest('hex').slice(0, 16);
  return `
const cssText = ${JSON.stringify(cssText)};
const styleId = "workbench-preview-css-${id}";
let style = document.querySelector(\`style[data-workbench-preview-css="\${styleId}"]\`);
if (!style) {
  style = document.createElement("style");
  style.setAttribute("data-workbench-preview-css", styleId);
  document.head.appendChild(style);
}
style.textContent = cssText;
export default cssText;
`;
}

// Writes the response and returns true only when the file exists under dist/.
// Returning false leaves the response untouched so the caller can fall through
// to the hosted renderer.
async function tryServeStaticDistFile(context: PreviewRouteContext, headOnly: boolean): Promise<boolean> {
  const { distRoot, request, response } = context;
  const pathname = getRequestPathname(request);
  const filePath = resolveStaticDistFilePath(distRoot, pathname);
  if (!filePath) return false;

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('Content-Length', String(info.size));
    response.setHeader('Content-Type', getContentType(filePath));
    response.setHeader(RENDERER_SOURCE_HEADER, 'local');
    if (headOnly) {
      response.end();
      return true;
    }
    response.end(await readFile(filePath));
    return true;
  } catch {
    return false;
  }
}

async function serveStaticDistFile(context: PreviewRouteContext, headOnly: boolean): Promise<void> {
  const { distRoot, request, response } = context;
  const pathname = getRequestPathname(request);
  if (!resolveStaticDistFilePath(distRoot, pathname)) {
    response.statusCode = 403;
    response.end('Invalid Workbench app asset path');
    return;
  }

  if (await tryServeStaticDistFile(context, headOnly)) return;

  if (pathname.startsWith(PROJECT_VITE_ASSET_PREFIX)) {
    await proxyToLocalBridge(context);
    return;
  }
  response.statusCode = 404;
  response.end('Workbench app asset not found');
}

async function proxyToHostedRenderer(context: PreviewRouteContext): Promise<boolean> {
  const { request, response } = context;
  const hostedRendererUrl = await context.resolveHostedRendererUrl?.();
  if (!hostedRendererUrl) return false;

  const method = request.method ?? 'GET';
  const targetUrl = new URL(request.url ?? '/', hostedRendererUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HOSTED_RENDERER_PROXY_TIMEOUT_MS);

  try {
    const bodyBuffer = method === 'GET' || method === 'HEAD'
      ? undefined
      : await readRequestBodyBuffer(request);
    const upstream = await fetch(targetUrl, {
      body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
      headers: createHostedRendererProxyHeaders(request),
      method,
      redirect: 'manual',
      signal: controller.signal,
    });

    if (upstream.status === 404 && (method === 'GET' || method === 'HEAD')) return false;

    response.statusCode = upstream.status;
    response.statusMessage = upstream.statusText;
    upstream.headers.forEach((value, name) => {
      if (isHostedRendererResponseHeader(name)) response.setHeader(name, value);
    });
    response.setHeader('X-Workbench-Renderer-Upstream', new URL(hostedRendererUrl).origin);
    response.setHeader(RENDERER_SOURCE_HEADER, 'hosted');

    if (method === 'HEAD' || upstream.status === 204 || upstream.status === 205 || upstream.status === 304) {
      response.end();
      return true;
    }

    response.end(Buffer.from(await upstream.arrayBuffer()));
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function createHostedRendererProxyHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, rawValue] of Object.entries(request.headers)) {
    if (!rawValue || !isHostedRendererRequestHeader(name)) continue;
    headers.set(name, Array.isArray(rawValue) ? rawValue.join(', ') : rawValue);
  }
  return headers;
}

function isHostedRendererRequestHeader(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized === 'accept' ||
    normalized === 'accept-language' ||
    normalized === 'authorization' ||
    normalized === 'content-type' ||
    normalized === 'user-agent';
}

function isHostedRendererResponseHeader(name: string): boolean {
  const normalized = name.toLowerCase();
  return !isHopByHopHeader(normalized) &&
    normalized !== 'content-encoding' &&
    normalized !== 'content-length' &&
    normalized !== 'set-cookie';
}

function resolveStaticDistFilePath(distRoot: string, pathname: string): string | null {
  const cleanPath = decodeURIComponent(pathname.split(/[?#]/, 1)[0] ?? '/');
  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const filePath = resolve(distRoot, relativePath);
  return isPathInside(distRoot, filePath) ? filePath : null;
}

async function proxyToLocalBridge(context: PreviewRouteContext): Promise<void> {
  const { bridge, request, response } = context;
  const method = request.method ?? 'GET';
  const targetUrl = new URL(request.url ?? '/', bridge.url);
  const headers = createProxyHeaders(request, bridge.token);
  const bodyBuffer = method === 'GET' || method === 'HEAD'
    ? undefined
    : await readRequestBodyBuffer(request);
  const body: BodyInit | undefined = bodyBuffer ? new Uint8Array(bodyBuffer) : undefined;
  const upstream = await fetch(targetUrl, {
    body,
    headers,
    method,
  });

  response.statusCode = upstream.status;
  response.statusMessage = upstream.statusText;
  upstream.headers.forEach((value, name) => {
    if (!isHopByHopHeader(name)) response.setHeader(name, value);
  });

  if (method === 'HEAD' || upstream.status === 204 || upstream.status === 205 || upstream.status === 304) {
    response.end();
    return;
  }

  if (!upstream.body) {
    response.end();
    return;
  }

  await pipeFetchResponseBody(upstream.body, response);
}

async function pipeFetchResponseBody(body: ReadableStream<Uint8Array>, response: ServerResponse): Promise<void> {
  const reader = body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  response.once('close', cancel);

  try {
    while (!response.destroyed) {
      const { done, value } = await reader.read();
      if (done) break;
      response.write(Buffer.from(value));
    }
  } finally {
    response.off('close', cancel);
    if (!response.writableEnded && !response.destroyed) response.end();
  }
}

function createProxyHeaders(request: IncomingMessage, token: string): Headers {
  const headers = new Headers();
  for (const [name, rawValue] of Object.entries(request.headers)) {
    if (!rawValue || isHopByHopHeader(name)) continue;
    const value = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue;
    headers.set(name, value);
  }
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

function isHopByHopHeader(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized === 'authorization' ||
    normalized === 'connection' ||
    normalized === 'content-length' ||
    normalized === 'cookie' ||
    normalized === 'host' ||
    normalized === 'keep-alive' ||
    normalized === 'proxy-authenticate' ||
    normalized === 'proxy-authorization' ||
    normalized === 'te' ||
    normalized === 'trailer' ||
    normalized === 'transfer-encoding' ||
    normalized === 'upgrade';
}

function shouldProxyToBridge(pathname: string): boolean {
  return BRIDGE_EXACT_ROUTES.has(pathname) ||
    BRIDGE_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

function isVendorRuntimePath(pathname: string): boolean {
  return pathname === VENDOR_REACT_PATH ||
    pathname === VENDOR_REACT_DOM_PATH ||
    pathname === VENDOR_REACT_DOM_CLIENT_PATH ||
    pathname === VENDOR_REACT_JSX_RUNTIME_PATH ||
    pathname === VENDOR_REACT_JSX_DEV_RUNTIME_PATH ||
    pathname === VENDOR_VUE_PATH;
}

function getVendorRuntimeModule(pathname: string): string {
  if (pathname === VENDOR_REACT_DOM_PATH) {
    return getVendorRuntimeModuleForSpecifier('react-dom');
  }

  if (pathname === VENDOR_REACT_DOM_CLIENT_PATH) {
    return getVendorRuntimeModuleForSpecifier('react-dom/client');
  }

  if (pathname === VENDOR_REACT_JSX_RUNTIME_PATH) {
    return getVendorRuntimeModuleForSpecifier('react/jsx-runtime');
  }

  if (pathname === VENDOR_REACT_JSX_DEV_RUNTIME_PATH) {
    return getVendorRuntimeModuleForSpecifier('react/jsx-dev-runtime');
  }

  if (pathname === VENDOR_VUE_PATH) {
    return getVendorRuntimeModuleForSpecifier('vue');
  }

  return getVendorRuntimeModuleForSpecifier('react');
}

function getVendorRuntimeModuleForSpecifier(specifier: string): string {
  if (specifier === 'vue') {
    // CommonJS on purpose: esbuild's interop resolves named imports from a
    // CJS module at runtime, so compiled SFC helper imports (createElementBlock,
    // renderList, ...) all read the renderer-installed Vue instance without
    // enumerating Vue's export surface here. One shared instance also keeps
    // per-copy symbols (Fragment, Text) consistent between the page module
    // and the host mount.
    return `
const Vue = globalThis.__WORKBENCH_VUE__;
if (!Vue) throw new Error("Workbench Vue runtime is not installed.");
module.exports = Vue;
`;
  }

  if (specifier === 'react-dom') {
    return `
const ReactDOM = globalThis.__WORKBENCH_REACT_DOM__;
if (!ReactDOM) throw new Error("Workbench React DOM runtime is not installed.");
const WORKBENCH_PREVIEW_PORTAL_BOUNDARY_SELECTOR = [
  '[data-workbench-preview-root="true"]',
  '[data-workbench-portal-root="true"]',
  '[data-workbench-theme-portal-root="true"]',
].join(', ');
function isInsideWorkbenchPreviewPortalBoundary(container) {
  if (!container || typeof container !== 'object') return false;
  const element = container.nodeType === 1
    ? container
    : container.nodeType === 11 && container.host?.nodeType === 1
      ? container.host
      : null;
  return Boolean(element?.closest?.(WORKBENCH_PREVIEW_PORTAL_BOUNDARY_SELECTOR));
}
export function createPortal(children, container, key) {
  if (!isInsideWorkbenchPreviewPortalBoundary(container)) {
    throw new Error("Workbench preview blocked a project portal outside its preview boundary.");
  }
  return ReactDOM.createPortal(children, container, key);
}
export const findDOMNode = ReactDOM.findDOMNode;
export const flushSync = ReactDOM.flushSync;
export const hydrate = ReactDOM.hydrate;
export const render = ReactDOM.render;
export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode;
export const unstable_batchedUpdates = ReactDOM.unstable_batchedUpdates;
export const version = ReactDOM.version;
export default ReactDOM;
`;
  }

  if (specifier === 'react-dom/client') {
    return `
const ReactDOMClient = globalThis.__WORKBENCH_REACT_DOM_CLIENT__;
if (!ReactDOMClient) throw new Error("Workbench React DOM client runtime is not installed.");
export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;
export default ReactDOMClient;
`;
  }

  if (specifier === 'react/jsx-runtime') {
    return `
const runtime = globalThis.__WORKBENCH_REACT_JSX_RUNTIME__;
if (!runtime) throw new Error("Workbench React JSX runtime is not installed.");
export const Fragment = runtime.Fragment;
export const jsx = runtime.jsx;
export const jsxs = runtime.jsxs;
export default runtime;
`;
  }

  if (specifier === 'react/jsx-dev-runtime') {
    return `
const runtime = globalThis.__WORKBENCH_REACT_JSX_DEV_RUNTIME__;
if (!runtime) throw new Error("Workbench React JSX dev runtime is not installed.");
export const Fragment = runtime.Fragment;
export const jsxDEV = runtime.jsxDEV;
export default runtime;
`;
  }

  return `
const React = globalThis.__WORKBENCH_REACT__;
if (!React) throw new Error("Workbench React runtime is not installed.");
export const Activity = React.Activity;
export const Children = React.Children;
export const Component = React.Component;
export const Fragment = React.Fragment;
export const Profiler = React.Profiler;
export const PureComponent = React.PureComponent;
export const StrictMode = React.StrictMode;
export const Suspense = React.Suspense;
export const act = React.act;
export const cache = React.cache;
export const cacheSignal = React.cacheSignal;
export const captureOwnerStack = React.captureOwnerStack;
export const cloneElement = React.cloneElement;
export const createContext = React.createContext;
export const createElement = React.createElement;
export const createFactory = React.createFactory;
export const createRef = React.createRef;
export const forwardRef = React.forwardRef;
export const isValidElement = React.isValidElement;
export const lazy = React.lazy;
export const memo = React.memo;
export const startTransition = React.startTransition;
export const use = React.use;
export const useActionState = React.useActionState;
export const useCallback = React.useCallback;
export const useContext = React.useContext;
export const useDebugValue = React.useDebugValue;
export const useDeferredValue = React.useDeferredValue;
export const useEffect = React.useEffect;
export const useEffectEvent = React.useEffectEvent;
export const useId = React.useId;
export const useImperativeHandle = React.useImperativeHandle;
export const useInsertionEffect = React.useInsertionEffect;
export const useLayoutEffect = React.useLayoutEffect;
export const useMemo = React.useMemo;
export const useOptimistic = React.useOptimistic;
export const useReducer = React.useReducer;
export const useRef = React.useRef;
export const useState = React.useState;
export const useSyncExternalStore = React.useSyncExternalStore;
export const useTransition = React.useTransition;
export const version = React.version;
export default React;
`;
}

async function collectProjectCssModuleUrls(projectRoot: string, sourcePath: string): Promise<string[]> {
  const cssFilePaths = new Set<string>();
  const skippedCssFilePaths = new Set<string>();
  const tailwindCssConfig = await readProjectTailwindPreviewCssConfig(projectRoot);

  const compiledCssPath = resolveProjectCssConfigPath(projectRoot, tailwindCssConfig.compiledCss);
  if (compiledCssPath && existsSync(compiledCssPath)) {
    await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, compiledCssPath);
  }

  const tokenCssPath = resolveProjectCssConfigPath(projectRoot, tailwindCssConfig.tokenCss);
  if (tokenCssPath && existsSync(tokenCssPath)) {
    await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, tokenCssPath);
  }

  const sourceCssPath = resolveProjectCssConfigPath(projectRoot, tailwindCssConfig.sourceCss);
  if (compiledCssPath && sourceCssPath) {
    skippedCssFilePaths.add(sourceCssPath);
  }

  for (const cssPath of await collectProjectHtmlStylesheetFilePaths(projectRoot)) {
    await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, cssPath);
  }

  await collectDirectCssImportsFromProjectSourceFiles(
    projectRoot,
    await collectProjectHtmlModuleScriptSourceFiles(projectRoot),
    cssFilePaths,
    skippedCssFilePaths,
  );
  await collectDirectCssImportsFromProjectSourceFiles(
    projectRoot,
    [
      ...getAppRouteLayoutSourceFiles(sourcePath),
      sourcePath,
    ],
    cssFilePaths,
    skippedCssFilePaths,
  );

  return Array.from(cssFilePaths)
    .sort((left, right) => left.localeCompare(right))
    .map(toWorkbenchFileSystemModuleUrl);
}

async function collectDirectCssImportsFromProjectSourceFiles(
  projectRoot: string,
  sourceFiles: string[],
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
): Promise<void> {
  const normalizedSourceFiles = Array.from(new Set(sourceFiles.map(normalizeProjectPathLoose).filter(Boolean)));
  await Promise.all(normalizedSourceFiles.map(async (sourceFile) => {
    const filePath = resolveProjectSourceFilePath(projectRoot, sourceFile);
    if (!filePath || !existsSync(filePath)) return;

    let contents: string;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch {
      return;
    }

    await Promise.all(getProjectModuleImportSources(contents).map(async (importSource) => {
      if (!/\.css(?:$|[?#])/i.test(importSource)) return;
      const cssFilePath = resolveProjectCssImportFilePath(projectRoot, sourceFile, importSource);
      if (cssFilePath) await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, cssFilePath);
    }));
  }));
}

async function collectCssImportsFromProjectSourceFiles(
  projectRoot: string,
  sourceFiles: string[],
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
): Promise<void> {
  const visited = new Set<string>();
  const normalizedSourceFiles = Array.from(new Set(sourceFiles.map(normalizeProjectPathLoose).filter(Boolean)));
  await Promise.all(normalizedSourceFiles.map((sourceFile) => (
    collectCssImportsFromProjectSourceFile(projectRoot, sourceFile, cssFilePaths, skippedCssFilePaths, visited, 0)
  )));
}

async function collectCssImportsFromProjectSourceFile(
  projectRoot: string,
  sourceFile: string,
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
  visited: Set<string>,
  depth: number,
): Promise<void> {
  if (depth > PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH) return;
  const normalizedSourceFile = normalizeProjectPathLoose(sourceFile);
  if (!normalizedSourceFile || visited.has(normalizedSourceFile)) return;
  visited.add(normalizedSourceFile);

  const filePath = resolveProjectSourceFilePath(projectRoot, normalizedSourceFile);
  if (!filePath || !existsSync(filePath)) return;

  let contents: string;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch {
    return;
  }

  for (const importSource of getProjectModuleImportSources(contents)) {
    if (!isProjectLocalImportSource(importSource)) continue;
    const resolved = resolveProjectLocalImportSourcePath(normalizedSourceFile, importSource);
    if (!resolved) continue;

    if (/\.css(?:$|[?#])/i.test(importSource)) {
      const cssFilePath = resolveProjectCssImportFilePath(projectRoot, normalizedSourceFile, importSource);
      if (cssFilePath) await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, cssFilePath);
      continue;
    }

    const resolvedSourceFile = await resolveProjectSourceModulePath(projectRoot, resolved);
    if (resolvedSourceFile) {
      await collectCssImportsFromProjectSourceFile(
        projectRoot,
        resolvedSourceFile,
        cssFilePaths,
        skippedCssFilePaths,
        visited,
        depth + 1,
      );
    }
  }
}

async function addProjectCssModulePath(
  projectRoot: string,
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
  filePath: string,
): Promise<void> {
  const normalizedFilePath = resolve(filePath);
  if (!isPathInside(projectRoot, normalizedFilePath)) return;
  if (skippedCssFilePaths.has(normalizedFilePath)) return;
  if (!existsSync(normalizedFilePath)) return;
  if (cssFilePaths.has(normalizedFilePath)) return;

  cssFilePaths.add(normalizedFilePath);
}

function getProjectModuleImportSources(contents: string): string[] {
  const importSources = new Set<string>();
  const importPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+)\1\s*;?/g;
  for (const match of Array.from(contents.matchAll(importPattern))) {
    const source = match[2]?.trim();
    if (source) importSources.add(source);
  }
  return Array.from(importSources);
}

function isProjectLocalImportSource(importSource: string | undefined): boolean {
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/');
  return rawImport.startsWith('.') ||
    rawImport === '@' ||
    rawImport.startsWith('@/') ||
    (rawImport.startsWith('/') && !rawImport.startsWith('//'));
}

function resolveProjectLocalImportSourcePath(ownerSourceFile: string | undefined, importSource: string | undefined): string | null {
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  if (!isProjectLocalImportSource(rawImport)) return null;
  const normalizedImport = normalizeProjectPathLoose(rawImport);
  if (!normalizedImport) return null;
  if (rawImport.startsWith('/') && !rawImport.startsWith('//')) return normalizedImport;
  if (rawImport === '@') return 'src';
  if (rawImport.startsWith('@/')) return normalizeProjectPathLoose(`src/${rawImport.slice(2)}`);
  if (!rawImport.startsWith('.')) return normalizedImport;

  const ownerDirectory = normalizeProjectPathLoose(ownerSourceFile ?? '').split('/').slice(0, -1);
  const segments: string[] = [];
  for (const segment of [...ownerDirectory, ...rawImport.split('/')]) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) return null;
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

function resolveProjectCssImportFilePath(projectRoot: string, ownerSourceFile: string, importSource: string): string | null {
  const resolved = resolveProjectLocalImportSourcePath(ownerSourceFile, importSource);
  if (!resolved || !resolved.toLowerCase().endsWith('.css')) return null;
  const filePath = resolve(projectRoot, resolved);
  return isPathInside(projectRoot, filePath) ? filePath : null;
}

function resolveProjectSourceFilePath(projectRoot: string, sourceFile: string): string | null {
  const normalizedSourceFile = normalizeProjectPathLoose(sourceFile);
  if (!normalizedSourceFile || normalizedSourceFile.split('/').some(isBlockedProjectPathPart)) return null;
  const filePath = resolve(projectRoot, normalizedSourceFile);
  return isPathInside(projectRoot, filePath) ? filePath : null;
}

async function resolveProjectSourceModulePath(projectRoot: string, resolvedPath: string): Promise<string | null> {
  const normalized = normalizeProjectPathLoose(resolvedPath);
  if (!normalized || normalized.split('/').some(isBlockedProjectPathPart)) return null;
  const candidates = /\.(tsx?|jsx?|vue)$/i.test(normalized)
    ? [normalized]
    : [
        `${normalized}.tsx`,
        `${normalized}.jsx`,
        `${normalized}.ts`,
        `${normalized}.js`,
        `${normalized}.vue`,
        `${normalized}/index.tsx`,
        `${normalized}/index.jsx`,
        `${normalized}/index.ts`,
        `${normalized}/index.js`,
        `${normalized}/index.vue`,
      ];
  for (const candidate of candidates) {
    const filePath = resolveProjectSourceFilePath(projectRoot, candidate);
    if (filePath && existsSync(filePath)) return candidate;
  }
  return null;
}

function getAppRouteLayoutSourceFiles(sourcePath: string): string[] {
  const normalizedSourcePath = normalizeProjectPathLoose(sourcePath);
  if (!normalizedSourcePath.startsWith('src/app/') || !/\/page\.(?:tsx|jsx|ts|js)$/i.test(normalizedSourcePath)) {
    return [];
  }

  const routeDirectory = normalizedSourcePath.split('/').slice(0, -1);
  const layouts: string[] = [];
  for (let index = 2; index <= routeDirectory.length; index += 1) {
    const directory = routeDirectory.slice(0, index).join('/');
    layouts.push(
      `${directory}/layout.tsx`,
      `${directory}/layout.jsx`,
      `${directory}/layout.ts`,
      `${directory}/layout.js`,
    );
  }
  return layouts;
}

function isBlockedProjectPathPart(part: string): boolean {
  return !part || part === '.' || part === '..' || BLOCKED_SOURCE_PATH_PARTS.has(part);
}

function normalizeProjectPathLoose(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

type ProjectTailwindPreviewCssConfig = {
  compiledCss: string | null;
  enabled: boolean;
  sourceCss: string | null;
  tokenCss: string | null;
};

async function readProjectTailwindPreviewCssConfig(projectRoot: string): Promise<ProjectTailwindPreviewCssConfig> {
  try {
    const contents = await readFile(resolve(projectRoot, '.workbench', 'workbench.config.json'), 'utf8');
    const config: unknown = JSON.parse(contents);
    if (!isObjectRecord(config)) return EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
    const paths = isObjectRecord(config.paths) ? config.paths : null;
    const configuredTokenCss = normalizeProjectCssConfigPath(paths?.tokenCss);
    const extensions = isObjectRecord(config.extensions) ? config.extensions : null;
    const tailwind = extensions && isObjectRecord(extensions.tailwind) ? extensions.tailwind : null;
    if (!tailwind) {
      return {
        ...EMPTY_TAILWIND_PREVIEW_CSS_CONFIG,
        tokenCss: configuredTokenCss,
      };
    }
    return {
      compiledCss: normalizeProjectCssConfigPath(tailwind.compiledCss),
      enabled: tailwind.enabled !== false,
      sourceCss: normalizeProjectCssConfigPath(tailwind.sourceCss),
      tokenCss: normalizeProjectCssConfigPath(tailwind.tokenCss) ?? configuredTokenCss,
    };
  } catch {
    return EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
  }
}

const EMPTY_TAILWIND_PREVIEW_CSS_CONFIG: ProjectTailwindPreviewCssConfig = {
  compiledCss: null,
  enabled: false,
  sourceCss: null,
  tokenCss: null,
};

function getProjectTailwindPreviewCssMode(
  config: ProjectTailwindPreviewCssConfig,
): 'compiled' | 'disabled' | 'fallback' {
  if (!config.enabled) return 'disabled';
  return config.compiledCss ? 'compiled' : 'fallback';
}

function normalizeProjectCssConfigPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const rawPath = value.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const normalizedPath = normalizeConfiguredProjectCssPath(rawPath);
  if (!normalizedPath || !normalizedPath.toLowerCase().endsWith('.css') || normalizedPath.startsWith('../')) {
    return null;
  }
  if (normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || BLOCKED_SOURCE_PATH_PARTS.has(part))) {
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

function resolveProjectCssConfigPath(projectRoot: string, configPath: string | null): string | null {
  if (!configPath) return null;
  const filePath = resolve(projectRoot, configPath);
  return isPathInside(projectRoot, filePath) ? filePath : null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function collectProjectHtmlStylesheetFilePaths(projectRoot: string): Promise<string[]> {
  let htmlContents;
  try {
    htmlContents = await readFile(resolve(projectRoot, PROJECT_HTML_ENTRY_PATH), 'utf8');
  } catch {
    return [];
  }

  const paths = new Set<string>();
  for (const href of getHtmlStylesheetHrefs(htmlContents)) {
    const filePath = resolveProjectStylesheetPath(projectRoot, href);
    if (filePath) paths.add(filePath);
  }
  return Array.from(paths);
}

async function collectProjectHtmlModuleScriptSourceFiles(projectRoot: string): Promise<string[]> {
  let htmlContents;
  try {
    htmlContents = await readFile(resolve(projectRoot, PROJECT_HTML_ENTRY_PATH), 'utf8');
  } catch {
    return PROJECT_DEFAULT_ENTRY_SOURCE_FILES;
  }

  const sourceFiles = new Set<string>();
  const scriptPattern = /<script\b([^>]*)>/gi;
  let match = scriptPattern.exec(htmlContents);
  while (match) {
    const attributes = parseHtmlTagAttributes(match[1] ?? '');
    const type = attributes.get('type')?.toLowerCase() ?? '';
    if (type && type !== 'module') {
      match = scriptPattern.exec(htmlContents);
      continue;
    }
    const source = attributes.get('src')?.trim();
    const normalized = source ? normalizeHtmlProjectAssetPath(source) : null;
    if (normalized && /\.(tsx?|jsx?)$/i.test(normalized)) sourceFiles.add(normalized);
    match = scriptPattern.exec(htmlContents);
  }

  return sourceFiles.size > 0 ? Array.from(sourceFiles) : PROJECT_DEFAULT_ENTRY_SOURCE_FILES;
}

function getHtmlStylesheetHrefs(contents: string): string[] {
  const hrefs = new Set<string>();
  const linkPattern = /<link\b([^>]*)>/gi;
  let match = linkPattern.exec(contents);
  while (match) {
    const attributes = parseHtmlTagAttributes(match[1] ?? '');
    const rel = attributes.get('rel')?.toLowerCase() ?? '';
    if (rel.split(/\s+/).includes('stylesheet')) {
      const href = attributes.get('href')?.trim();
      if (href) hrefs.add(href);
    }
    match = linkPattern.exec(contents);
  }
  return Array.from(hrefs);
}

function parseHtmlTagAttributes(attributesSource: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = attributePattern.exec(attributesSource);
  while (match) {
    const name = match[1]?.toLowerCase();
    if (name) attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '');
    match = attributePattern.exec(attributesSource);
  }
  return attributes;
}

function normalizeHtmlProjectAssetPath(rawPath: string): string | null {
  const path = normalizeProjectPathLoose(rawPath.split(/[?#]/, 1)[0] ?? '');
  if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return null;
  const withoutLeadingSlash = path.replace(/^\/+/, '');
  const normalized = withoutLeadingSlash.replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('../') || normalized.split('/').some(isBlockedProjectPathPart)) return null;
  return normalized;
}

function resolveProjectStylesheetPath(projectRoot: string, href: string): string | null {
  const normalizedHref = href.split(/[?#]/, 1)[0]?.trim().replace(/\\/g, '/') ?? '';
  if (
    !normalizedHref ||
    /^[a-z][a-z0-9+.-]*:/i.test(normalizedHref) ||
    normalizedHref.startsWith('//') ||
    !normalizedHref.toLowerCase().endsWith('.css')
  ) {
    return null;
  }

  const projectPath = normalizeHtmlProjectAssetPath(normalizedHref);
  if (!projectPath) return null;

  const filePath = resolve(projectRoot, projectPath);
  return isPathInside(projectRoot, filePath) ? filePath : null;
}

function normalizeWorkbenchPreviewPageSourcePath(value: string): string | null {
  const normalizedPath = value.replace(/\\/g, '/').replace(/^\/+/, '');
  const isWorkbenchPage =
    normalizedPath.startsWith('src/workbench-pages/') &&
    (normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.vue'));
  const isAppRoutePage =
    normalizedPath.startsWith('src/app/') && /\/page\.tsx$/.test(normalizedPath);
  if (!isWorkbenchPage && !isAppRoutePage) {
    return null;
  }
  if (normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || BLOCKED_SOURCE_PATH_PARTS.has(part))) {
    return null;
  }
  return normalizedPath;
}

function normalizeWorkbenchRuntimeSourcePath(value: string, allowEmpty = false): string | null {
  const normalizedPath = normalizeProjectPathLoose(value);
  if (!normalizedPath) return allowEmpty ? '' : null;
  if (!PREVIEW_SOURCE_EXTENSIONS.has(extname(normalizedPath).toLowerCase())) return null;
  if (normalizedPath.split('/').some(isBlockedProjectPathPart)) return null;
  return normalizedPath;
}

function resolveWorkbenchFileSystemModulePath(pathname: string): string | null {
  const rawPath = pathname.slice(VITE_FS_PREFIX.length);
  if (!rawPath.startsWith('/')) return null;
  try {
    return resolve(decodePathSegments(rawPath.replace(/^\/+/, '/')));
  } catch {
    return null;
  }
}

function toWorkbenchFileSystemModuleUrl(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${VITE_FS_PREFIX}${absolutePath.split('/').map((segment, index) => (
    index === 0 ? '' : encodeURIComponent(segment)
  )).join('/')}`;
}

function decodePathSegments(pathname: string): string {
  return pathname.split('/').map((segment) => decodeURIComponent(segment)).join('/');
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(toBoundaryComparablePath(rootPath), toBoundaryComparablePath(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function toBoundaryComparablePath(filePath: string): string {
  const resolvedPath = resolve(filePath);
  let existingPath = resolvedPath;
  while (!existsSync(existingPath)) {
    const parentPath = dirname(existingPath);
    if (parentPath === existingPath) return resolvedPath;
    existingPath = parentPath;
  }

  try {
    const realExistingPath = realpathSync.native(existingPath);
    const suffix = relative(existingPath, resolvedPath);
    return suffix ? resolve(realExistingPath, suffix) : realExistingPath;
  } catch {
    return resolvedPath;
  }
}

function sendJson(response: ServerResponse, value: unknown): void {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(value));
}

function sendJavaScript(response: ServerResponse, contents: string): void {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  response.end(contents);
}

function readRequestBodyBuffer(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => {
      size += chunk.byteLength;
      if (size > MAX_PREVIEW_REQUEST_BODY_BYTES) {
        reject(new Error('Workbench preview request body is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolveBody(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function getRequestPathname(request: IncomingMessage): string {
  return new URL(request.url ?? '/', 'http://workbench.local').pathname;
}

function toPublicPreviewUrl(request: IncomingMessage, pathname: string): string {
  return new URL(pathname, getRequestPublicOrigin(request)).toString();
}

function getRequestPublicOrigin(request: IncomingMessage): string {
  const host = request.headers.host ?? '127.0.0.1';
  return `http://${host}`;
}

function parseAllowedOrigins(origins: string[]): Array<RegExp | string> {
  return [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...origins.map((origin) => origin.trim()).filter(Boolean),
  ];
}

function applyCorsHeaders(
  request: IncomingMessage,
  response: ServerResponse,
  allowedOrigins: Array<RegExp | string>,
): boolean {
  const origin = getHeaderValue(request, 'origin');
  if (!origin) return true;
  if (!isAllowedOrigin(origin, allowedOrigins)) return false;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-workbench-preview-token');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.setHeader('Access-Control-Max-Age', '300');
  response.setHeader('Vary', 'Origin');
  return true;
}

function isAllowedOrigin(origin: string, allowedOrigins: Array<RegExp | string>): boolean {
  return allowedOrigins.some((allowedOrigin) => {
    if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
    return allowedOrigin.test(origin);
  });
}

function getHeaderValue(request: IncomingMessage, name: string): string | null {
  const value = request.headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function getContentType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.gif':
      return 'image/gif';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.json':
    case '.map':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml; charset=utf-8';
    case '.webp':
      return 'image/webp';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function listen(server: Server, port: number, host: string): Promise<void> {
  return new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolveListen();
    });
  });
}

function isAddressInUseError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'EADDRINUSE',
  );
}
