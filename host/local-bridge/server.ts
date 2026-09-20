import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { existsSync, watch, type FSWatcher } from 'node:fs';
import { access, mkdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { delimiter, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import * as workbenchHost from '../../scripts/workbench-local-project-host.mjs';
import {
  createWorkbenchAuthoringService,
  serializeWorkbenchAuthoringError,
  type WorkbenchAuthoringService,
} from '../../scripts/workbench-authoring-core.mjs';
import {
  createInitialWorkbenchPreviewCssStatus,
  createWorkbenchPreviewCssCoordinator,
  createWorkbenchPreviewCssRenderFreshness,
  createWorkbenchPreviewCssResult,
  readWorkbenchPreviewCssConfig,
  shouldWorkbenchPreviewCssSyncForProjectPath,
  WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES,
  WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
  type ProjectTailwindPreviewCssConfig,
  type WorkbenchPreviewCssCoordinator,
  type WorkbenchPreviewCssSyncResult,
} from './previewCssFreshness.js';

const BRIDGE_PROTOCOL_VERSION = 1;
const BRIDGE_EVENTS_PATH = '/__workbench-bridge/events';
const BRIDGE_TOKEN_ROTATE_PATH = '/__workbench-bridge/token/rotate.json';
const PROJECT_PREVIEW_CSS_STATUS_PATH = '/__workbench/preview-css/status.json';
const PROJECT_LOCATION_PATH = '/__workbench/project.json';
const PROJECT_DEPENDENCY_INSTALL_PATH = '/__workbench/project/dependencies/install.json';
const FOLDER_DIALOG_PATH = '/__workbench/folder-dialog.json';
const PROJECT_FILE_PREFIX = '/__workbench/files/';
const PROJECT_IMAGE_PROXY_PATH = '/__workbench/image-proxy';
const PROJECT_SOURCE_READ_PATH = '/__workbench/source/read.json';
const PROJECT_SOURCE_WRITE_PATH = '/__workbench/source/write.json';
const PROJECT_SOURCE_DELETE_PATH = '/__workbench/source/delete.json';
const PROJECT_SOURCE_IMPORT_TREE_PATH = '/__workbench/source/import-tree.json';
const PROJECT_SOURCE_MKDIR_PATH = '/__workbench/source/mkdir.json';
const PROJECT_SOURCE_MOVE_PATH = '/__workbench/source/move.json';
const PROJECT_SOURCE_RMDIR_PATH = '/__workbench/source/rmdir.json';
const PROJECT_AUTHORING_DESIGN_CONTEXT_PATH = '/__workbench/authoring/design-context.json';
const PROJECT_AUTHORING_REQUIREMENTS_CONFIRM_PATH = '/__workbench/authoring/requirements/confirm.json';
const PROJECT_AUTHORING_EXECUTION_PROMPT_PATH = '/__workbench/authoring/execution-prompt.json';
const PROJECT_AUTHORING_EXECUTION_PROMPT_CONFIRM_PATH = '/__workbench/authoring/execution-prompt/confirm.json';
const PROJECT_AUTHORING_COMPONENTS_PATH = '/__workbench/authoring/components.json';
const PROJECT_AUTHORING_PLAN_PATH = '/__workbench/authoring/plan.json';
const PROJECT_AUTHORING_APPLY_PATH = '/__workbench/authoring/apply.json';
const PROJECT_AUTHORING_RENDER_EVIDENCE_PATH = '/__workbench/authoring/render-evidence.json';
const PROJECT_AUTHORING_VISUAL_REVIEW_PATH = '/__workbench/authoring/visual-review.json';
const PROJECT_AUTHORING_VISUAL_APPROVAL_CONFIRM_PATH = '/__workbench/authoring/visual-approval/confirm.json';
const PROJECT_AUTHORING_VERIFY_PATH = '/__workbench/authoring/verify.json';
const PROJECT_AUTHORING_TOKENS_PATH = '/__workbench/authoring/tokens.json';
const PROJECT_AUTHORING_TOKENS_UPSERT_PATH = '/__workbench/authoring/tokens/upsert.json';
const PROJECT_AUTHORING_ASSETS_UPSERT_PATH = '/__workbench/authoring/assets/upsert.json';
const PROJECT_AUTHORING_COMPONENT_PATH = '/__workbench/authoring/component.json';
const PROJECT_AUTHORING_COMPONENT_UPSERT_PATH = '/__workbench/authoring/component/upsert.json';
const PROJECT_ASSET_WRITE_PATH = '/__workbench/assets/write.json';
const PROJECT_ASSET_INSTALL_PATH = '/__workbench/assets/install.json';
const PROJECT_ASSET_DELETE_PATH = '/__workbench/assets/delete.json';
const PROJECT_GOOGLE_FONTS_PATH = '/__workbench/assets/google-fonts.json';
const PROJECT_PUBLIC_ASSET_PREFIXES = ['/assets/', '/workbench-assets/'];
const DEFAULT_ALLOWED_ORIGINS = [
  'null',
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/localhost:\d+$/,
];
const MAX_BRIDGE_REQUEST_BODY_BYTES = 32 * 1024 * 1024;
const MAX_BRIDGE_IMAGE_PROXY_BYTES = 24 * 1024 * 1024;
const TAILWIND_AUTO_SYNC_DEBOUNCE_MS = 600;
const currentDir = dirname(fileURLToPath(import.meta.url));
const WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH = resolvePackagedNodeScriptPath(resolve(currentDir, '..', '..', 'scripts', 'workbench-tailwind-sync.mjs'));
const execFileAsync = promisify(execFile);

function resolvePackagedNodeScriptPath(scriptPath: string): string {
  const unpackedPath = scriptPath.replace(/([\\/])app\.asar([\\/])/, '$1app.asar.unpacked$2');
  return unpackedPath !== scriptPath && existsSync(unpackedPath) ? unpackedPath : scriptPath;
}

export type WorkbenchLocalBridge = {
  readonly authoringToken: string;
  close: () => void;
  host: string;
  port: number;
  token: string;
  url: string;
};

export type WorkbenchLocalBridgeOptions = {
  allowedOrigins?: string[];
  chooseFolder?: (purpose: WorkbenchBridgeFolderDialogPurpose) => Promise<WorkbenchBridgeFolderDialogResult>;
  host?: string;
  onActiveProjectRootChange?: (root: string | null) => void;
  port?: number;
};

export type WorkbenchBridgeFolderDialogPurpose = 'open-project' | 'create-parent';

export type WorkbenchBridgeFolderDialogResult =
  | {
      ok: true;
      rootPath: string;
    }
  | {
      cancelled?: boolean;
      message: string;
      ok: false;
    };

type BridgeRouteContext = {
  authoringService: WorkbenchAuthoringService;
  chooseFolder?: (purpose: WorkbenchBridgeFolderDialogPurpose) => Promise<WorkbenchBridgeFolderDialogResult>;
  getActiveProjectRoot: () => string | null;
  getAuthoringToken: () => string;
  getPreviewCssStatus: (projectRoot: string) => Promise<WorkbenchPreviewCssSyncResult>;
  getToken: () => string;
  notifyProjectChanged: (path: string, eventType?: string, synchronizeTailwind?: boolean) => void;
  openEventStream: (request: IncomingMessage, response: ServerResponse) => void;
  request: IncomingMessage;
  response: ServerResponse;
  rotateToken: () => string;
  setActiveProjectRoot: (root: string | null) => void;
  synchronizePreviewCss: (projectRoot: string, changedPath: string) => Promise<WorkbenchPreviewCssSyncResult>;
};

export async function startWorkbenchLocalBridge(
  options: WorkbenchLocalBridgeOptions = {},
): Promise<WorkbenchLocalBridge> {
  const host = options.host ?? '127.0.0.1';
  let token = createBridgeToken();
  const authoringToken = createBridgeToken();
  const eventHub = new WorkbenchBridgeEventHub();
  const authoringService = createWorkbenchAuthoringService({
    writeFileAtomic: workbenchHost.writeFileAtomic,
    getPreviewCssStatus: (projectRoot) => eventHub.getPreviewCssStatus(projectRoot),
    synchronizePreviewCss: (projectRoot, changedPath) => eventHub.synchronizePreviewCss(projectRoot, changedPath),
  });
  const allowedOrigins = parseAllowedOrigins([
    ...readAllowedOriginsFromEnv(),
    ...(options.allowedOrigins ?? []),
  ]);
  const chooseFolder = options.chooseFolder;
  let activeProjectRoot: string | null = null;
  const server = createServer((request, response) => {
    void handleBridgeRequest({
      authoringService,
      chooseFolder,
      getActiveProjectRoot: () => activeProjectRoot,
      getAuthoringToken: () => authoringToken,
      getPreviewCssStatus: (projectRoot) => eventHub.getPreviewCssStatus(projectRoot),
      getToken: () => token,
      notifyProjectChanged: (path, eventType, synchronizeTailwind) => {
        eventHub.notifyProjectChanged(path, eventType, synchronizeTailwind);
      },
      openEventStream: (eventRequest, eventResponse) => {
        eventHub.openEventStream(eventRequest, eventResponse);
      },
      request,
      response,
      rotateToken: () => {
        token = createBridgeToken();
        return token;
      },
      setActiveProjectRoot: (root) => {
        activeProjectRoot = root;
        eventHub.setActiveProjectRoot(root);
        try {
          options.onActiveProjectRootChange?.(root);
        } catch (error) {
          console.warn(error instanceof Error ? error.message : 'Workbench active project callback failed.');
        }
      },
      synchronizePreviewCss: (projectRoot, changedPath) => eventHub.synchronizePreviewCss(projectRoot, changedPath),
    }, allowedOrigins);
  });

  await listen(server, options.port ?? 0, host);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Workbench local bridge did not bind to a TCP port.');
  }

  return {
    get authoringToken() {
      return authoringToken;
    },
    close: () => {
      eventHub.close();
      server.close();
    },
    host,
    port: address.port,
    get token() {
      return token;
    },
    url: `http://${host}:${address.port}`,
  };
}

async function handleBridgeRequest(
  context: BridgeRouteContext,
  allowedOrigins: Array<RegExp | string>,
): Promise<void> {
  const { request, response } = context;
  const pathname = getRequestPathname(request);

  if (!applyCorsHeaders(request, response, allowedOrigins)) {
    response.statusCode = 403;
    response.end('Workbench bridge origin is not allowed');
    return;
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === 'GET' && pathname === '/__workbench-bridge/health.json') {
    sendJson(response, {
      ok: true,
      protocolVersion: BRIDGE_PROTOCOL_VERSION,
      service: 'workbench-local-bridge',
    });
    return;
  }

  if ((request.method === 'GET' || request.method === 'HEAD') && isProjectPublicAssetPathname(pathname)) {
    const projectRoot = context.getActiveProjectRoot();
    if (!projectRoot) {
      response.statusCode = 409;
      response.end('No Workbench project is open');
      return;
    }

    const served = await tryServeProjectPublicAsset(projectRoot, pathname, response, request.method === 'HEAD');
    if (!served) {
      response.statusCode = 404;
      response.end('Workbench asset not found');
    }
    return;
  }

  if (isAuthoringPathname(pathname)) {
    if (!isAuthorizedAuthoringRequest(request, context.getAuthoringToken())) {
      response.statusCode = 401;
      response.end('Workbench authoring token is required');
      return;
    }
    await handleWorkbenchAuthoringRequest(context, pathname);
    return;
  }

  if (!isAuthorizedBridgeRequest(request, context.getToken())) {
    response.statusCode = 401;
    response.end('Workbench bridge token is required');
    return;
  }

  if (request.method === 'GET' && pathname === PROJECT_IMAGE_PROXY_PATH) {
    try {
      const url = new URL(request.url ?? '/', 'http://workbench.local');
      await proxyWorkbenchBridgeImageUrl(url.searchParams.get('url') ?? '', response);
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Image could not be proxied');
    }
    return;
  }

  if (request.method === 'GET' && pathname === BRIDGE_EVENTS_PATH) {
    context.openEventStream(request, response);
    return;
  }

  if (request.method === 'GET' && pathname === PROJECT_PREVIEW_CSS_STATUS_PATH) {
    sendJson(response, await context.getPreviewCssStatus(context.getActiveProjectRoot()!));
    return;
  }

  if (request.method === 'POST' && pathname === BRIDGE_TOKEN_ROTATE_PATH) {
    sendJson(response, {
      ok: true,
      protocolVersion: BRIDGE_PROTOCOL_VERSION,
      token: context.rotateToken(),
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/__workbench-bridge/capabilities.json') {
    sendJson(response, {
      ok: true,
      capabilities: [
        'bridge.token-rotation',
        'bridge.project-events',
        'project.open',
        'project.close',
        ...(context.chooseFolder ? ['project.folder-picker'] : []),
        'project.dependency-install',
        'project.location',
        'project.preview-css-freshness',
        'project.workbench-json',
        'workspace.asset-files',
        'workspace.asset-install',
        'workspace.import-tree',
        'workspace.scoped-files',
        'workspace.file-watch',
        'authoring.structured-pages',
        'authoring.component-creation-disabled',
      ],
      protocolVersion: BRIDGE_PROTOCOL_VERSION,
    });
    return;
  }

  if (request.method === 'GET' && pathname === PROJECT_GOOGLE_FONTS_PATH) {
    try {
      const url = new URL(request.url ?? '/', 'http://workbench.local');
      const query = url.searchParams.get('q') ?? '';
      const limit = Number(url.searchParams.get('limit') ?? '48');
      sendJson(response, await workbenchHost.searchGoogleFontsCatalog(query, limit));
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Google Fonts could not be searched');
    }
    return;
  }

  if (request.method === 'POST' && pathname === FOLDER_DIALOG_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isFolderDialogAction(body)) {
      response.statusCode = 400;
      response.end('Invalid folder dialog action');
      return;
    }

    if (!context.chooseFolder) {
      sendJson(response, {
        cancelled: true,
        message: 'Workbench bridge folder picker is not available in this host.',
        ok: false,
      });
      return;
    }

    sendJson(response, await context.chooseFolder(body.purpose));
    return;
  }

  if (request.method === 'GET' && pathname === PROJECT_LOCATION_PATH) {
    const activeProjectRoot = context.getActiveProjectRoot();
    let dependencyInstall = await workbenchHost.readWorkbenchProjectDependencyInstallStatus(activeProjectRoot);
    const needsDependencyInstall = activeProjectRoot && (
      dependencyInstall?.status === 'installing'
      || (
        (!dependencyInstall || dependencyInstall.status === 'installed')
        && await workbenchHost.workbenchProjectDependenciesNeedInstall(activeProjectRoot)
      )
    );
    if (needsDependencyInstall) {
      const queuedInstall = await workbenchHost.queueWorkbenchProjectDependencyInstall(
        activeProjectRoot,
        dependencyInstall?.templateId
          ?? await workbenchHost.readWorkbenchProjectTemplateId(activeProjectRoot),
      );
      dependencyInstall = queuedInstall.status;
      observeBridgeDependencyInstall(context, activeProjectRoot, queuedInstall);
    }
    sendJson(response, workbenchHost.createProjectLocation(activeProjectRoot, 'local-bridge', dependencyInstall));
    return;
  }

  if (request.method === 'DELETE' && pathname === PROJECT_LOCATION_PATH) {
    context.setActiveProjectRoot(null);
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_DEPENDENCY_INSTALL_PATH) {
    const activeProjectRoot = context.getActiveProjectRoot();
    if (!activeProjectRoot) {
      response.statusCode = 409;
      response.end('No Workbench project is open');
      return;
    }
    const currentStatus = await workbenchHost.readWorkbenchProjectDependencyInstallStatus(activeProjectRoot);
    const queuedInstall = await workbenchHost.queueWorkbenchProjectDependencyInstall(
      activeProjectRoot,
      currentStatus?.templateId,
    );
    observeBridgeDependencyInstall(context, activeProjectRoot, queuedInstall);
    sendJson(
      response,
      workbenchHost.createProjectLocation(activeProjectRoot, 'local-bridge', queuedInstall.status),
    );
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_LOCATION_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isProjectRootAction(body)) {
      response.statusCode = 400;
      response.end('Invalid workbench project action');
      return;
    }

    let projectRoot: string;
    let pendingDependencyInstall = null;
    if (body.action === 'create') {
      let scaffoldResult: Awaited<ReturnType<typeof workbenchHost.scaffoldWorkbenchProjectFolder>>;
      try {
        scaffoldResult = await workbenchHost.scaffoldWorkbenchProjectFolder(
          body.parentPath,
          body.projectName,
          body.templateId,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Project could not be initialized.';
        response.statusCode = message === 'Project folder already exists.' ? 409 : 400;
        sendJson(response, { message, ok: false });
        return;
      }
      projectRoot = scaffoldResult.rootPath;
      pendingDependencyInstall = scaffoldResult.dependencyInstall;
    } else {
      projectRoot = resolve(body.rootPath);
    }
    const validation = await workbenchHost.validateWorkbenchProjectRoot(projectRoot);
    if (!validation.ok) {
      response.statusCode = 404;
      sendJson(response, validation);
      return;
    }

    context.setActiveProjectRoot(validation.rootPath);
    if (body.action === 'create') {
      setImmediate(() => {
        void workbenchHost.queueWorkbenchProjectDependencyInstall(validation.rootPath, body.templateId)
          .then((queuedInstall) => {
            observeBridgeDependencyInstall(context, validation.rootPath, queuedInstall);
          })
          .catch((error) => {
            console.warn(`[workbench] Project dependency install status failed: ${error instanceof Error ? error.message : String(error)}`);
          });
      });
    }
    const dependencyInstall = body.action === 'create'
      ? pendingDependencyInstall
      : await workbenchHost.readWorkbenchProjectDependencyInstallStatus(validation.rootPath);
    sendJson(response, workbenchHost.createProjectLocation(validation.rootPath, 'local-bridge', dependencyInstall));
    return;
  }

  if (requiresActiveWorkbenchProject(pathname) && !context.getActiveProjectRoot()) {
    response.statusCode = 409;
    response.end('No Workbench project is open');
    return;
  }

  if (request.method === 'POST' && pathname === '/__workbench-bridge/project/validate-root.json') {
    const body = await readJsonRequestBody(request);
    if (!isValidateRootRequest(body)) {
      response.statusCode = 400;
      response.end('Invalid project root validation request');
      return;
    }

    const rootPath = resolve(body.rootPath);
    const validation = await workbenchHost.validateWorkbenchProjectRoot(rootPath);
    if (!validation.ok) {
      response.statusCode = 404;
      sendJson(response, validation);
      return;
    }

    sendJson(response, validation);
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_READ_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isPathBody(body)) {
      response.statusCode = 400;
      response.end('Invalid source read action');
      return;
    }

    const filePath = workbenchHost.resolveWorkbenchSourcePath(context.getActiveProjectRoot()!, body.path);
    if (!filePath) {
      response.statusCode = 400;
      response.end('Invalid source file path');
      return;
    }

    try {
      sendJson(response, { ok: true, contents: await readFile(filePath, 'utf8') });
    } catch {
      response.statusCode = 404;
      response.end('Source file not found');
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_IMPORT_TREE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isDiskImportAction(body)) {
      response.statusCode = 400;
      response.end('Invalid import path action');
      return;
    }

    try {
      sendJson(response, await workbenchHost.readWorkbenchImportTree({
        includeContents: body.includeContents,
        projectRoot: context.getActiveProjectRoot()!,
        sourcePath: body.sourcePath,
      }));
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Import path could not be read');
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_ASSET_WRITE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isAssetWriteAction(body)) {
      response.statusCode = 400;
      response.end('Invalid asset write action');
      return;
    }

    try {
      sendJson(response, await workbenchHost.writeWorkbenchAssetFile(context.getActiveProjectRoot()!, body));
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Asset file could not be written');
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_ASSET_INSTALL_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isAssetInstallAction(body)) {
      response.statusCode = 400;
      response.end('Invalid asset install action');
      return;
    }

    try {
      sendJson(response, await workbenchHost.installWorkbenchAssets(context.getActiveProjectRoot()!, body));
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Assets could not be installed');
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_ASSET_DELETE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isAssetDeleteAction(body)) {
      response.statusCode = 400;
      response.end('Invalid asset delete action');
      return;
    }

    try {
      sendJson(response, await workbenchHost.deleteWorkbenchAssetPaths(context.getActiveProjectRoot()!, body));
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : 'Asset paths could not be deleted');
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_WRITE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isSourceWriteAction(body)) {
      response.statusCode = 400;
      response.end('Invalid source write action');
      return;
    }

    const filePath = workbenchHost.resolveWorkbenchSourcePath(context.getActiveProjectRoot()!, body.path);
    if (!filePath) {
      response.statusCode = 400;
      response.end('Invalid source file path');
      return;
    }

    try {
      if (!body.overwrite) {
        await access(filePath);
        response.statusCode = 409;
        response.end('Source file already exists');
        return;
      }
    } catch {
      // Missing files are fine for create writes.
    }

    await workbenchHost.writeFileAtomic(filePath, body.contents);
    try {
      const previewCss = await context.synchronizePreviewCss(context.getActiveProjectRoot()!, body.path);
      context.notifyProjectChanged(body.path, 'change', false);
      sendJson(response, { ok: true, previewCss });
    } catch (error) {
      context.notifyProjectChanged(body.path, 'change', false);
      response.statusCode = 409;
      sendJson(response, {
        code: 'WB-PREVIEW-CSS-SYNC',
        message: `Source was written, but Workbench preview CSS synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
        ok: false,
      });
    }
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_DELETE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isPathBody(body)) {
      response.statusCode = 400;
      response.end('Invalid source delete action');
      return;
    }

    const filePath = workbenchHost.resolveWorkbenchSourcePath(context.getActiveProjectRoot()!, body.path);
    if (!filePath) {
      response.statusCode = 400;
      response.end('Invalid source file path');
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      // Missing files are already deleted from the project source view.
    }
    context.notifyProjectChanged(body.path, 'rename');
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_MKDIR_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isPathBody(body)) {
      response.statusCode = 400;
      response.end('Invalid source mkdir action');
      return;
    }

    const dirPath = workbenchHost.resolveWorkbenchSourceDirPath(context.getActiveProjectRoot()!, body.path);
    if (!dirPath) {
      response.statusCode = 400;
      response.end('Invalid source folder path');
      return;
    }

    await mkdir(dirPath, { recursive: true });
    context.notifyProjectChanged(body.path, 'rename');
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_MOVE_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isSourceMoveAction(body)) {
      response.statusCode = 400;
      response.end('Invalid source move action');
      return;
    }

    const fromPath = workbenchHost.resolveWorkbenchSourcePathOrDir(context.getActiveProjectRoot()!, body.from);
    const toPath = workbenchHost.resolveWorkbenchSourcePathOrDir(context.getActiveProjectRoot()!, body.to);
    if (!fromPath || !toPath) {
      response.statusCode = 400;
      response.end('Invalid source move path');
      return;
    }

    if (!body.overwrite) {
      try {
        await access(toPath);
        response.statusCode = 409;
        response.end('Destination already exists');
        return;
      } catch {
        // Destination does not exist, which is the expected case.
      }
    }
    await mkdir(dirname(toPath), { recursive: true });
    await rename(fromPath, toPath);
    context.notifyProjectChanged(body.from, 'rename');
    context.notifyProjectChanged(body.to, 'rename');
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === 'POST' && pathname === PROJECT_SOURCE_RMDIR_PATH) {
    const body = await readJsonRequestBody(request);
    if (!isSourceRmdirAction(body)) {
      response.statusCode = 400;
      response.end('Invalid source rmdir action');
      return;
    }

    const dirPath = workbenchHost.resolveWorkbenchSourceDirPath(context.getActiveProjectRoot()!, body.path);
    if (!dirPath) {
      response.statusCode = 400;
      response.end('Invalid source folder path');
      return;
    }

    await rm(dirPath, { recursive: body.recursive === true, force: body.recursive === true });
    context.notifyProjectChanged(body.path, 'rename');
    sendJson(response, { ok: true });
    return;
  }

  const projectPath = getWorkbenchProjectPath(pathname);
  if (projectPath) {
    const filePath = workbenchHost.resolveWorkbenchProjectPath(context.getActiveProjectRoot()!, projectPath);
    if (!filePath) {
      response.statusCode = 400;
      response.end('Invalid workbench project file path');
      return;
    }

    if (request.method === 'PUT') {
      if (!hasJsonContentType(request)) {
        response.statusCode = 415;
        response.end('Workbench project file writes require application/json');
        return;
      }

      const body = await readRequestBody(request);
      try {
        JSON.parse(body);
      } catch {
        response.statusCode = 400;
        response.end('Workbench project files must be valid JSON');
        return;
      }

      await workbenchHost.writeFileAtomic(filePath, body);
      context.notifyProjectChanged(`.workbench/${projectPath}`, 'change');
      sendJson(response, { ok: true });
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.statusCode = 405;
      response.end('Unsupported workbench project file method');
      return;
    }

    try {
      const contents = await readFile(filePath, 'utf8');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store, max-age=0');
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      response.end(contents);
    } catch {
      response.statusCode = 404;
      response.end('Workbench project file not found');
    }
    return;
  }

  response.statusCode = 404;
  response.end('Workbench bridge route not found');
}

function observeBridgeDependencyInstall(
  context: BridgeRouteContext,
  projectRoot: string,
  queuedInstall: {
    completion: Promise<unknown>;
    started: boolean;
  },
) {
  if (!queuedInstall.started) return;
  void queuedInstall.completion
    .then(() => {
      if (context.getActiveProjectRoot() === projectRoot) {
        context.notifyProjectChanged(workbenchHost.DEPENDENCY_INSTALL_STATUS_PATH, 'change');
        // The project can open before its dependencies land, so the open-time Tailwind
        // sync may only have seeded preview CSS. The dependency tree just changed for
        // real; report it as a package.json change so the preview CSS resynchronizes
        // and the renderer refreshes component hydration.
        context.notifyProjectChanged('package.json', 'change');
      }
    })
    .catch((error) => {
      console.warn(`[workbench] Project dependency install status failed: ${error instanceof Error ? error.message : String(error)}`);
    });
}

function isProjectPublicAssetPathname(pathname: string): boolean {
  return PROJECT_PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function proxyWorkbenchBridgeImageUrl(rawUrl: string, response: ServerResponse): Promise<void> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    response.statusCode = 400;
    response.end('Missing image URL');
    return;
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    response.statusCode = 400;
    response.end('Only http and https image URLs are supported');
    return;
  }
  if (!(await isSafeImageProxyTargetUrl(parsed))) {
    response.statusCode = 400;
    response.end('Image URL is not allowed');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const upstream = await fetch(parsed.href, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 Workbench-V1 Image Proxy',
      },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      response.statusCode = upstream.status;
      response.end('Image request failed');
      return;
    }

    const upstreamContentType = upstream.headers.get('content-type') ?? '';
    if (!upstreamContentType.toLowerCase().startsWith('image/')) {
      response.statusCode = 415;
      response.end('URL did not return an image');
      return;
    }

    const contentLength = Number(upstream.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BRIDGE_IMAGE_PROXY_BYTES) {
      response.statusCode = 413;
      response.end('Image is too large');
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_BRIDGE_IMAGE_PROXY_BYTES) {
      response.statusCode = 413;
      response.end('Image is too large');
      return;
    }

    const contentType = getBridgeImageProxyContentType(buffer, upstreamContentType);
    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Length', String(buffer.byteLength));
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(buffer);
  } catch (error) {
    response.statusCode = 502;
    response.end(error instanceof Error ? error.message : 'Image request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function isSafeImageProxyTargetUrl(url: URL): Promise<boolean> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (isBlockedImageProxyHostname(url.hostname)) return false;

  const literalIp = normalizeIpLiteral(url.hostname);
  if (literalIp && isBlockedImageProxyIp(literalIp)) return false;

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((address) => !isBlockedImageProxyIp(address.address));
  } catch {
    return false;
  }
}

function isBlockedImageProxyHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local');
}

function normalizeIpLiteral(hostname: string): string | null {
  const normalized = hostname.replace(/^\[|\]$/g, '');
  return isIP(normalized) ? normalized : null;
}

function isBlockedImageProxyIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) return isBlockedImageProxyIp(normalized.slice('::ffff:'.length));
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

function getBridgeImageProxyContentType(buffer: Buffer, upstreamContentType: string): string {
  return sniffBridgeImageContentType(buffer) ?? upstreamContentType;
}

function sniffBridgeImageContentType(buffer: Buffer): string | null {
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

function listen(server: Server, port: number, host: string): Promise<void> {
  return new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolveListen();
    });
  });
}

function createBridgeToken(): string {
  return randomBytes(32).toString('base64url');
}

type WorkbenchBridgeEvent =
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
      previewCss: WorkbenchPreviewCssSyncResult;
      rootPath: string;
      type: 'preview-css-status';
    };

class WorkbenchBridgeEventHub {
  #activeProjectRoot: string | null = null;
  #clients = new Set<ServerResponse>();
  #keepAliveTimer: ReturnType<typeof setInterval>;
  #tailwindAutoSync = new WorkbenchTailwindAutoSync((event) => this.#broadcast(event));
  #watcher: FSWatcher | null = null;

  constructor() {
    this.#keepAliveTimer = setInterval(() => {
      for (const client of this.#clients) {
        client.write(': keepalive\n\n');
      }
    }, 15000);
    this.#keepAliveTimer.unref?.();
  }

  setActiveProjectRoot(root: string | null): void {
    if (root === this.#activeProjectRoot) return;

    this.#watcher?.close();
    this.#watcher = null;
    this.#activeProjectRoot = root;
    this.#tailwindAutoSync.setProjectRoot(root);

    if (root) {
      try {
        this.#watcher = watch(root, { recursive: true }, (eventType, filename) => {
          const path = normalizeWatchedPath(filename);
          if (shouldIgnoreWatchedPath(path)) return;
          this.#tailwindAutoSync.handleProjectPathChange(path);

          this.#broadcast({
            emittedAt: new Date().toISOString(),
            eventType,
            path,
            rootPath: root,
            type: 'project-changed',
          });
        });
        this.#watcher.on('error', (error) => {
          this.#broadcast({
            emittedAt: new Date().toISOString(),
            message: error instanceof Error ? error.message : 'Workbench file watcher failed',
            rootPath: this.#activeProjectRoot,
            type: 'watch-error',
          });
        });
      } catch (error) {
        this.#broadcast({
          emittedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : 'Workbench file watcher could not start',
          rootPath: root,
          type: 'watch-error',
        });
      }
    }

    this.#broadcast({
      emittedAt: new Date().toISOString(),
      rootPath: root,
      type: 'project-opened',
    });
  }

  openEventStream(request: IncomingMessage, response: ServerResponse): void {
    response.writeHead(200, {
      'Cache-Control': 'no-store, max-age=0',
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no',
    });
    response.write('retry: 2000\n\n');
    this.#clients.add(response);
    writeSseEvent(response, {
      emittedAt: new Date().toISOString(),
      rootPath: this.#activeProjectRoot,
      type: 'project-opened',
    });
    const previewCss = this.#tailwindAutoSync.getCurrentStatus();
    if (this.#activeProjectRoot && previewCss) {
      writeSseEvent(response, {
        emittedAt: new Date().toISOString(),
        previewCss,
        rootPath: this.#activeProjectRoot,
        type: 'preview-css-status',
      });
    }

    const close = () => {
      this.#clients.delete(response);
    };
    request.on('close', close);
    response.on('close', close);
  }

  notifyProjectChanged(path: string, eventType = 'change', synchronizeTailwind = true): void {
    if (!this.#activeProjectRoot) return;
    const normalizedPath = normalizeWatchedPath(path);
    if (shouldIgnoreWatchedPath(normalizedPath)) return;
    if (synchronizeTailwind) this.#tailwindAutoSync.handleProjectPathChange(normalizedPath);
    this.#broadcast({
      emittedAt: new Date().toISOString(),
      eventType,
      path: normalizedPath,
      rootPath: this.#activeProjectRoot,
      type: 'project-changed',
    });
  }

  synchronizePreviewCss(projectRoot: string, changedPath: string): Promise<WorkbenchPreviewCssSyncResult> {
    const normalizedPath = normalizeWatchedPath(changedPath);
    return this.#tailwindAutoSync.synchronizeProject(projectRoot, `authoring:${normalizedPath ?? 'source-write'}`, normalizedPath);
  }

  getPreviewCssStatus(projectRoot: string): Promise<WorkbenchPreviewCssSyncResult> {
    return this.#tailwindAutoSync.getProjectStatus(projectRoot);
  }

  close(): void {
    clearInterval(this.#keepAliveTimer);
    this.#tailwindAutoSync.close();
    this.#watcher?.close();
    this.#watcher = null;
    for (const client of this.#clients) {
      client.end();
    }
    this.#clients.clear();
  }

  #broadcast(event: WorkbenchBridgeEvent): void {
    for (const client of this.#clients) {
      writeSseEvent(client, event);
    }
  }
}

const EMPTY_TAILWIND_PREVIEW_CSS_CONFIG: ProjectTailwindPreviewCssConfig = {
  compiledCss: null,
  enabled: false,
  sourceCss: null,
  tokenCss: null,
};

class WorkbenchTailwindAutoSync {
  #broadcast: (event: WorkbenchBridgeEvent) => void;
  #currentStatus: WorkbenchPreviewCssSyncResult | null = null;
  #previewCssCoordinator: WorkbenchPreviewCssCoordinator;
  #projectRoot: string | null = null;
  #syncConfig: ProjectTailwindPreviewCssConfig = EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
  #syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(broadcast: (event: WorkbenchBridgeEvent) => void) {
    this.#broadcast = broadcast;
    this.#previewCssCoordinator = createWorkbenchPreviewCssCoordinator({
      onInputsChangedDuringSync: ({ projectRoot }) => {
        if (this.#projectRoot === projectRoot) this.#scheduleSync('inputs-changed-during-sync');
      },
      onStatus: (projectRoot, status) => this.#setStatus(projectRoot, status),
      onSynchronized: ({ config, projectRoot, result }) => {
        if (this.#projectRoot !== projectRoot) return;
        this.#syncConfig = config;
        this.#broadcastTailwindChangedPath(config.compiledCss);
        this.#broadcastTailwindChangedPath(config.tokenCss);
        console.info(`[workbench] synced Tailwind preview CSS; render ready=${result.renderFreshness.ready}`);
      },
      runTailwindSync: async ({ projectRoot }) => {
        const nodeCommandPath = await workbenchHost.resolveWorkbenchNodeCommandPath();
        if (!nodeCommandPath) {
          throw new Error('Node.js was not found, so Tailwind preview CSS could not be rebuilt.');
        }
        return execFileAsync(
          nodeCommandPath,
          [WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', projectRoot, '--preview-only'],
          {
            env: createWorkbenchTailwindSyncEnvironment(nodeCommandPath),
            maxBuffer: WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES,
            timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
          },
        );
      },
    });
  }

  setProjectRoot(root: string | null): void {
    this.#projectRoot = root;
    this.#clearScheduledSync();
    this.#currentStatus = null;
    this.#syncConfig = EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
    if (!root) return;

    void this.#refreshConfig(root).then(async () => {
      if (this.#projectRoot !== root) return;
      this.#setStatus(root, await createInitialWorkbenchPreviewCssStatus(root, this.#syncConfig));
      if (!this.#syncConfig.enabled || !this.#syncConfig.compiledCss) return;
      this.#scheduleSync('project-opened');
    });
  }

  handleProjectPathChange(path: string | null): void {
    if (!this.#projectRoot || !this.#syncConfig.enabled || !path) return;
    if (!shouldWorkbenchPreviewCssSyncForProjectPath(path, this.#syncConfig)) return;
    const current = this.#currentStatus;
    if (current) {
      this.#setStatus(this.#projectRoot, createWorkbenchPreviewCssResult({
        config: this.#syncConfig,
        freshness: createWorkbenchPreviewCssRenderFreshness({
          fresh: false,
          inputRevision: null,
          outputRevision: current.renderFreshness.outputRevision,
          reason: `Preview CSS inputs changed at ${path}; synchronization is pending.`,
          representative: current.renderFreshness.representative,
          state: 'stale',
        }),
        status: 'stale',
      }));
    }
    this.#scheduleSync(path);
  }

  getCurrentStatus(): WorkbenchPreviewCssSyncResult | null {
    return this.#currentStatus;
  }

  async getProjectStatus(projectRoot: string): Promise<WorkbenchPreviewCssSyncResult> {
    const root = resolve(projectRoot);
    if (this.#projectRoot === root && this.#currentStatus) return this.#currentStatus;
    const config = await readWorkbenchPreviewCssConfig(root);
    const status = await this.#previewCssCoordinator.getProjectStatus(root);
    if (this.#projectRoot === root) {
      this.#syncConfig = config;
      this.#setStatus(root, status);
    }
    return status;
  }

  close(): void {
    this.setProjectRoot(null);
  }

  async #refreshConfig(root: string): Promise<void> {
    this.#syncConfig = await readWorkbenchPreviewCssConfig(root);
  }

  #scheduleSync(reason: string): void {
    if (!this.#projectRoot) return;
    if (this.#syncTimer) clearTimeout(this.#syncTimer);
    this.#syncTimer = setTimeout(() => {
      this.#syncTimer = null;
      const root = this.#projectRoot;
      if (!root) return;
      void this.synchronizeProject(root, reason).catch((error) => {
        console.warn(`[workbench] Tailwind preview CSS sync failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, TAILWIND_AUTO_SYNC_DEBOUNCE_MS);
  }

  async synchronizeProject(projectRoot: string, reason: string, changedPath: string | null = null): Promise<WorkbenchPreviewCssSyncResult> {
    const root = resolve(projectRoot);
    this.#clearScheduledSync();
    const config = await readWorkbenchPreviewCssConfig(root);
    if (this.#projectRoot === root) this.#syncConfig = config;
    return this.#previewCssCoordinator.synchronizeProject(root, { changedPath, reason });
  }

  #broadcastTailwindChangedPath(path: string | null): void {
    if (!this.#projectRoot || !path) return;
    this.#broadcast({
      emittedAt: new Date().toISOString(),
      eventType: 'change',
      path,
      rootPath: this.#projectRoot,
      type: 'project-changed',
    });
  }

  #setStatus(root: string, status: WorkbenchPreviewCssSyncResult): void {
    if (this.#projectRoot !== root) return;
    this.#currentStatus = status;
    this.#broadcast({
      emittedAt: new Date().toISOString(),
      previewCss: status,
      rootPath: root,
      type: 'preview-css-status',
    });
  }

  #clearScheduledSync(): void {
    if (!this.#syncTimer) return;
    clearTimeout(this.#syncTimer);
    this.#syncTimer = null;
  }
}

function createWorkbenchTailwindSyncEnvironment(nodeCommandPath: string): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.ESBUILD_BINARY_NAME;
  delete environment.ESBUILD_BINARY_PATH;
  // The sync script shells out to the project's own Vite build, so the resolved Node
  // location has to stay on PATH for those grandchildren, not just for the spawn above.
  environment.PATH = [dirname(nodeCommandPath), process.env.PATH ?? '']
    .filter(Boolean)
    .join(delimiter);
  return environment;
}

function normalizeProjectPath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function writeSseEvent(response: ServerResponse, event: WorkbenchBridgeEvent): void {
  response.write('event: workbench\n');
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

function normalizeWatchedPath(filename: string | Buffer | null): string | null {
  if (!filename) return null;
  const rawPath = Buffer.isBuffer(filename) ? filename.toString('utf8') : filename;
  const normalized = rawPath.split(/[\\/]+/).filter(Boolean).join('/');
  return normalized || null;
}

function shouldIgnoreWatchedPath(path: string | null): boolean {
  if (!path) return false;
  const parts = path.split('/');
  return parts.includes('.git') ||
    parts.includes('node_modules') ||
    parts.includes('.vite') ||
    parts[0] === 'dist' ||
    parts[0] === 'dist-host' ||
    parts.some((part) => part === '.DS_Store' || part.endsWith('~'));
}

function getRequestPathname(request: IncomingMessage): string {
  return new URL(request.url ?? '/', 'http://workbench.local').pathname;
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
  response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-workbench-authoring-token, x-workbench-bridge-token');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, OPTIONS');
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

function requiresActiveWorkbenchProject(pathname: string): boolean {
  return pathname === PROJECT_PREVIEW_CSS_STATUS_PATH ||
    pathname === PROJECT_SOURCE_READ_PATH ||
    pathname === PROJECT_SOURCE_WRITE_PATH ||
    pathname === PROJECT_SOURCE_DELETE_PATH ||
    pathname === PROJECT_SOURCE_IMPORT_TREE_PATH ||
    pathname === PROJECT_SOURCE_MKDIR_PATH ||
    pathname === PROJECT_SOURCE_MOVE_PATH ||
    pathname === PROJECT_SOURCE_RMDIR_PATH ||
    pathname === PROJECT_ASSET_WRITE_PATH ||
    pathname === PROJECT_ASSET_INSTALL_PATH ||
    pathname === PROJECT_ASSET_DELETE_PATH ||
    Boolean(getWorkbenchProjectPath(pathname));
}

function isAuthoringPathname(pathname: string): boolean {
  return pathname === PROJECT_AUTHORING_DESIGN_CONTEXT_PATH ||
    pathname === PROJECT_AUTHORING_REQUIREMENTS_CONFIRM_PATH ||
    pathname === PROJECT_AUTHORING_EXECUTION_PROMPT_PATH ||
    pathname === PROJECT_AUTHORING_EXECUTION_PROMPT_CONFIRM_PATH ||
    pathname === PROJECT_AUTHORING_COMPONENTS_PATH ||
    pathname === PROJECT_AUTHORING_PLAN_PATH ||
    pathname === PROJECT_AUTHORING_APPLY_PATH ||
    pathname === PROJECT_AUTHORING_RENDER_EVIDENCE_PATH ||
    pathname === PROJECT_AUTHORING_VISUAL_REVIEW_PATH ||
    pathname === PROJECT_AUTHORING_VISUAL_APPROVAL_CONFIRM_PATH ||
    pathname === PROJECT_AUTHORING_VERIFY_PATH ||
    pathname === PROJECT_AUTHORING_TOKENS_PATH ||
    pathname === PROJECT_AUTHORING_TOKENS_UPSERT_PATH ||
    pathname === PROJECT_AUTHORING_ASSETS_UPSERT_PATH ||
    pathname === PROJECT_AUTHORING_COMPONENT_PATH ||
    pathname === PROJECT_AUTHORING_COMPONENT_UPSERT_PATH;
}

function getWorkbenchProjectPath(pathname: string): string | null {
  if (pathname.startsWith(PROJECT_FILE_PREFIX)) {
    return decodeURIComponent(pathname.slice(PROJECT_FILE_PREFIX.length));
  }

  return null;
}

async function tryServeProjectPublicAsset(
  projectRoot: string,
  pathname: string,
  response: ServerResponse,
  headOnly: boolean,
): Promise<boolean> {
  const asset = await workbenchHost.readProjectPublicAsset(projectRoot, pathname);
  if (!asset) return false;
  response.setHeader('Content-Type', asset.contentType);
  response.setHeader('Content-Length', String(asset.size));
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  if (headOnly) {
    response.end();
    return true;
  }
  response.end(asset.buffer);
  return true;
}

function parseAllowedOrigins(origins: string[]): Array<RegExp | string> {
  return [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...origins.map((origin) => origin.trim()).filter(Boolean),
  ];
}

function readAllowedOriginsFromEnv(): string[] {
  return (process.env.WORKBENCH_BRIDGE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAuthorizedBridgeRequest(request: IncomingMessage, token: string): boolean {
  const authorization = getHeaderValue(request, 'authorization');
  if (authorization === `Bearer ${token}`) return true;
  return getHeaderValue(request, 'x-workbench-bridge-token') === token;
}

function isAuthorizedAuthoringRequest(request: IncomingMessage, token: string): boolean {
  const authorization = getHeaderValue(request, 'authorization');
  if (authorization === `Bearer ${token}`) return true;
  return getHeaderValue(request, 'x-workbench-authoring-token') === token;
}

async function handleWorkbenchAuthoringRequest(
  context: BridgeRouteContext,
  pathname: string,
): Promise<void> {
  const projectRoot = context.getActiveProjectRoot();
  if (!projectRoot) {
    context.response.statusCode = 409;
    context.response.end('No Workbench project is open');
    return;
  }

  try {
    const isProjectBindingRequest = context.request.method === 'POST' && pathname === PROJECT_AUTHORING_DESIGN_CONTEXT_PATH;
    if (!isProjectBindingRequest) {
      const expectedProjectId = getHeaderValue(context.request, 'x-workbench-authoring-project-id');
      if (!expectedProjectId) {
        const error = new Error('Authoring requests require a project-bound MCP session. Inspect the intended project first.');
        (error as Error & { code?: string }).code = 'WB-AUTH-PROJECT-SESSION-UNBOUND';
        throw error;
      }
      await context.authoringService.assertProjectTarget(projectRoot, { projectId: expectedProjectId });
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_DESIGN_CONTEXT_PATH) {
      sendJson(context.response, await context.authoringService.inspectDesignContext(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_REQUIREMENTS_CONFIRM_PATH) {
      sendJson(context.response, await context.authoringService.confirmRequirements(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_EXECUTION_PROMPT_PATH) {
      sendJson(context.response, await context.authoringService.prepareExecutionPrompt(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_EXECUTION_PROMPT_CONFIRM_PATH) {
      sendJson(context.response, await context.authoringService.confirmExecutionPrompt(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'GET' && pathname === PROJECT_AUTHORING_COMPONENTS_PATH) {
      const url = new URL(context.request.url ?? '/', 'http://workbench.local');
      const roles = (url.searchParams.get('roles') ?? '').split(',').map((role) => role.trim()).filter(Boolean);
      const limit = Number(url.searchParams.get('limit') ?? '24');
      sendJson(context.response, await context.authoringService.search(projectRoot, {
        query: url.searchParams.get('query') ?? '',
        roles,
        limit,
      }));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_PLAN_PATH) {
      sendJson(context.response, await context.authoringService.plan(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_APPLY_PATH) {
      const result = await context.authoringService.apply(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged(result.sourceFile, 'change', false);
      context.notifyProjectChanged('.workbench/pages.json', 'change');
      sendJson(context.response, result);
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_RENDER_EVIDENCE_PATH) {
      sendJson(context.response, await context.authoringService.submitRenderEvidence(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_VISUAL_REVIEW_PATH) {
      const result = await context.authoringService.submitVisualReview(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged('.workbench/pages.json', 'change');
      sendJson(context.response, result);
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_VISUAL_APPROVAL_CONFIRM_PATH) {
      const result = await context.authoringService.confirmVisualApproval(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged('.workbench/pages.json', 'change');
      sendJson(context.response, result);
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_VERIFY_PATH) {
      sendJson(context.response, await context.authoringService.verify(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'GET' && pathname === PROJECT_AUTHORING_TOKENS_PATH) {
      sendJson(context.response, await context.authoringService.inspectTokens(projectRoot));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_TOKENS_UPSERT_PATH) {
      const result = await context.authoringService.upsertTokens(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged(result.tokensPath, 'change');
      context.notifyProjectChanged(result.tokenCssPath, 'change');
      sendJson(context.response, result);
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_ASSETS_UPSERT_PATH) {
      const result = await context.authoringService.upsertAssets(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged(result.assetsPath, 'change');
      sendJson(context.response, result);
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_COMPONENT_PATH) {
      sendJson(context.response, await context.authoringService.inspectComponent(projectRoot, await readJsonRequestBody(context.request)));
      return;
    }

    if (context.request.method === 'POST' && pathname === PROJECT_AUTHORING_COMPONENT_UPSERT_PATH) {
      const result = await context.authoringService.upsertComponent(projectRoot, await readJsonRequestBody(context.request));
      context.notifyProjectChanged(result.sourceFile, 'change', false);
      context.notifyProjectChanged(result.storyFile, 'change', false);
      sendJson(context.response, result);
      return;
    }

    context.response.statusCode = 405;
    context.response.end('Unsupported Workbench authoring method');
  } catch (error) {
    const payload = serializeWorkbenchAuthoringError(error);
    context.response.statusCode = payload.code === 'WB-AUTH-SOURCE-STALE' || payload.code === 'WB-AUTH-CATALOG-STALE' || payload.code === 'WB-AUTH-TOKENS-STALE'
      ? 409
      : 400;
    sendJson(context.response, payload);
  }
}

function sendJson(response: ServerResponse, value: unknown): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.end(JSON.stringify(value));
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let body = '';
    let size = 0;

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      size += Buffer.byteLength(chunk, 'utf8');
      if (size > MAX_BRIDGE_REQUEST_BODY_BYTES) {
        reject(new Error('Workbench bridge request body is too large.'));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => resolveBody(body));
    request.on('error', reject);
  });
}

async function readJsonRequestBody(request: IncomingMessage): Promise<unknown> {
  if (!hasJsonContentType(request)) return null;

  try {
    return JSON.parse(await readRequestBody(request));
  } catch {
    return null;
  }
}

function hasJsonContentType(request: IncomingMessage): boolean {
  const contentType = getHeaderValue(request, 'content-type');
  return contentType?.toLowerCase().split(';', 1)[0]?.trim() === 'application/json';
}

function getHeaderValue(request: IncomingMessage, name: string): string | null {
  const value = request.headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

function isValidateRootRequest(value: unknown): value is { rootPath: string } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.rootPath === 'string' && candidate.rootPath.trim().length > 0;
}

type ProjectRootAction =
  | { action: 'open'; rootPath: string }
  | { action: 'create'; parentPath: string; projectName: string; templateId?: WorkbenchProjectTemplateId };

type WorkbenchProjectTemplateId = 'standard' | 'tailwind' | 'shadcn-base' | 'astryx';

type SourceWriteAction = {
  contents: string;
  overwrite?: boolean;
  path: string;
};

type SourceMoveAction = {
  from: string;
  overwrite?: boolean;
  to: string;
};

type SourceRmdirAction = {
  path: string;
  recursive?: boolean;
};

type DiskImportAction = {
  includeContents?: boolean;
  sourcePath: string;
};

type AssetWriteAction = {
  collection?: string;
  dataUrl: string;
  fileName: string;
  kind: 'image' | 'video' | 'font' | 'icon';
};

type AssetGitInstallAction = {
  kind: 'font' | 'icon';
  name?: string;
  source?: 'git';
  url: string;
};

type AssetGoogleFontInstallAction = {
  family: string;
  kind: 'font';
  name?: string;
  source: 'google-fonts';
  weights?: string[];
};

type AssetInstallAction = AssetGitInstallAction | AssetGoogleFontInstallAction;

type AssetDeleteAction = {
  paths: string[];
};

function isProjectRootAction(value: unknown): value is ProjectRootAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.action === 'open') {
    return typeof candidate.rootPath === 'string' && candidate.rootPath.trim().length > 0;
  }

  if (candidate.action === 'create') {
    return (
      typeof candidate.parentPath === 'string' &&
      candidate.parentPath.trim().length > 0 &&
      typeof candidate.projectName === 'string' &&
      candidate.projectName.trim().length > 0 &&
      (candidate.templateId === undefined || isWorkbenchProjectTemplateId(candidate.templateId))
    );
  }

  return false;
}

function isWorkbenchProjectTemplateId(value: unknown): value is WorkbenchProjectTemplateId {
  return value === 'standard' || value === 'tailwind' || value === 'shadcn-base' || value === 'astryx';
}

function isFolderDialogAction(value: unknown): value is { purpose: WorkbenchBridgeFolderDialogPurpose } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.purpose === 'open-project' || candidate.purpose === 'create-parent';
}

function isPathBody(value: unknown): value is { path: string } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.path === 'string' && candidate.path.trim().length > 0;
}

function isSourceWriteAction(value: unknown): value is SourceWriteAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.trim().length > 0 &&
    typeof candidate.contents === 'string' &&
    (candidate.overwrite === undefined || typeof candidate.overwrite === 'boolean')
  );
}

function isSourceMoveAction(value: unknown): value is SourceMoveAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.from === 'string' &&
    candidate.from.trim().length > 0 &&
    typeof candidate.to === 'string' &&
    candidate.to.trim().length > 0 &&
    (candidate.overwrite === undefined || typeof candidate.overwrite === 'boolean')
  );
}

function isSourceRmdirAction(value: unknown): value is SourceRmdirAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.trim().length > 0 &&
    (candidate.recursive === undefined || typeof candidate.recursive === 'boolean')
  );
}

function isDiskImportAction(value: unknown): value is DiskImportAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.sourcePath === 'string' &&
    candidate.sourcePath.trim().length > 0 &&
    (candidate.includeContents === undefined || typeof candidate.includeContents === 'boolean');
}

function isAssetWriteAction(value: unknown): value is AssetWriteAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.dataUrl === 'string' &&
    candidate.dataUrl.startsWith('data:') &&
    typeof candidate.fileName === 'string' &&
    candidate.fileName.trim().length > 0 &&
    (candidate.collection === undefined || typeof candidate.collection === 'string') &&
    (candidate.kind === 'image' || candidate.kind === 'video' || candidate.kind === 'font' || candidate.kind === 'icon')
  );
}

function isAssetInstallAction(value: unknown): value is AssetInstallAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.source === 'google-fonts') {
    return (
      candidate.kind === 'font' &&
      typeof candidate.family === 'string' &&
      candidate.family.trim().length > 0 &&
      (candidate.name === undefined || typeof candidate.name === 'string') &&
      (candidate.weights === undefined || isStringArray(candidate.weights))
    );
  }

  return (
    typeof candidate.url === 'string' &&
    candidate.url.trim().length > 0 &&
    (candidate.kind === 'font' || candidate.kind === 'icon') &&
    (candidate.name === undefined || typeof candidate.name === 'string') &&
    (candidate.source === undefined || candidate.source === 'git')
  );
}

function isAssetDeleteAction(value: unknown): value is AssetDeleteAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.paths) &&
    candidate.paths.length > 0 &&
    candidate.paths.every((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
