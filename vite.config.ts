import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { generate } from '@babel/generator';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { execFile, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';
import { compileProjectModule, compileProjectRuntimeBundle } from './host/local-preview/server';
import * as workbenchHost from './scripts/workbench-local-project-host.mjs';

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
const PROJECT_PREVIEW_MODULE_PATH = '/__workbench/preview/module.json';
const PROJECT_RUNTIME_MODULE_PATH = '/__workbench/preview/source-module.json';
const PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH = '/__workbench/preview/runtime-bundle.json';
const PROJECT_RUNTIME_BUNDLE_PREFIX = '/__workbench/preview/runtime-bundle/';
const PROJECT_IMAGE_PROXY_PATH = '/__workbench/image-proxy';
const VITE_FS_PREFIX = '/@fs/';
const PROJECT_PUBLIC_ASSET_PREFIXES = ['/assets/', '/workbench-assets/'];
const LEGACY_WORKBENCH_PREFIX = '/.workbench/';
const PROJECT_PREVIEW_DATA_CHANGED_EVENT = 'workbench:project-preview-data-changed';
const PROJECT_PREVIEW_DATA_CHANGE_PATHS = new Set([
  '.workbench/assets.json',
  '.workbench/dependency-install.json',
  '.workbench/selection.json',
  '.workbench/tokens.json',
  'src/workbench-tokens.css',
]);
const TAILWIND_AUTO_SYNC_DEBOUNCE_MS = 600;
const WORKBENCH_ROOT = fileURLToPath(new URL('.', import.meta.url));
const WORKBENCH_PROJECT_RUNTIME_NODE_MODULE_ROOTS = [resolve(WORKBENCH_ROOT, 'node_modules')];
const WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH = resolve(WORKBENCH_ROOT, 'scripts', 'workbench-tailwind-sync.mjs');
const WORKBENCH_BUILD_INFO = createWorkbenchBuildInfo();
// Overridable so test harnesses (scripts/gesture-tests) can run an isolated
// dev-server instance without sharing the developer's active-project state.
const WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH = process.env.WORKBENCH_DEV_SERVER_STATE_PATH
  ? resolve(process.env.WORKBENCH_DEV_SERVER_STATE_PATH)
  : resolve(WORKBENCH_ROOT, '.workbench', 'dev-server-project.json');
const MAX_WORKBENCH_REQUEST_BODY_BYTES = 32 * 1024 * 1024;
const MAX_WORKBENCH_IMAGE_PROXY_BYTES = 24 * 1024 * 1024;
const WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN = /\.(?:css|html?|json|jsx?|tsx?|vue)$/i;
const BLOCKED_SOURCE_PATH_PARTS = new Set(['.git', '.workbench', 'build', 'dist', 'node_modules']);
const BLOCKED_GIT_ASSET_PATH_PARTS = new Set(['.git', '.github', '.workbench', 'node_modules']);
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
const MAX_GIT_ASSET_FILES = 2500;
const GOOGLE_FONTS_METADATA_URLS = [
  'https://fonts.google.com/metadata/fonts',
  'https://fonts.grida.co/webfonts.json',
  'https://gwfh.mranftl.com/api/fonts',
];
const GOOGLE_FONTS_CACHE_TTL_MS = 1000 * 60 * 30;
const WORKBENCH_REACT_RUNTIME_MODULE_IDS = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom',
  'react-dom/client',
  'use-sync-external-store/shim',
  'use-sync-external-store/shim/with-selector',
]);
const WORKBENCH_PROJECT_RUNTIME_OPTIMIZE_DEP_EXCLUDES = [
  '@astryxdesign/core',
  '@astryxdesign/theme-butter',
  '@astryxdesign/theme-chocolate',
  '@astryxdesign/theme-gothic',
  '@astryxdesign/theme-matcha',
  '@astryxdesign/theme-neutral',
  '@astryxdesign/theme-stone',
  '@astryxdesign/theme-y2k',
  '@base-ui/react',
  '@base-ui/react/accordion',
  '@base-ui/react/alert-dialog',
  '@base-ui/react/avatar',
  '@base-ui/react/button',
  '@base-ui/react/checkbox',
  '@base-ui/react/collapsible',
  '@base-ui/react/context-menu',
  '@base-ui/react/dialog',
  '@base-ui/react/direction-provider',
  '@base-ui/react/input',
  '@base-ui/react/menu',
  '@base-ui/react/menubar',
  '@base-ui/react/merge-props',
  '@base-ui/react/navigation-menu',
  '@base-ui/react/popover',
  '@base-ui/react/preview-card',
  '@base-ui/react/progress',
  '@base-ui/react/radio',
  '@base-ui/react/radio-group',
  '@base-ui/react/scroll-area',
  '@base-ui/react/select',
  '@base-ui/react/separator',
  '@base-ui/react/slider',
  '@base-ui/react/switch',
  '@base-ui/react/tabs',
  '@base-ui/react/toggle',
  '@base-ui/react/toggle-group',
  '@base-ui/react/tooltip',
  '@base-ui/react/use-render',
  'cmdk',
  'embla-carousel-react',
  'input-otp',
  'maplibre-gl',
  'react-day-picker',
  'sonner',
  'vaul',
];
const WORKBENCH_PROJECT_RUNTIME_REACT_DEPENDENCY_PACKAGES = [
  '@base-ui/react',
  '@base-ui/utils',
  'cmdk',
  'embla-carousel-react',
  'input-otp',
  'react-day-picker',
  'sonner',
  'vaul',
];
const WORKBENCH_REACT_RUNTIME_PROXY_PREFIX = '\0workbench-react-runtime:';
const WORKBENCH_RUNTIME_PREVIEW_NODE_ID_ATTRIBUTE = 'data-wb-preview-node-id';
const FEATURED_GOOGLE_FONT_FAMILIES = [
  'Noto Sans KR',
  'Noto Serif KR',
  'IBM Plex Sans KR',
  'Gowun Dodum',
  'Gowun Batang',
  'Black Han Sans',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans 3',
  'Roboto Serif',
  'Playfair Display',
  'Merriweather',
  'Source Code Pro',
  'Roboto Mono',
];
const execFileAsync = promisify(execFile);
let googleFontsCatalogCache: { expiresAt: number; fonts: GoogleFontCatalogItem[]; source: 'fallback' | 'google-fonts' } | null = null;
let activeProjectRoot: string | null = null;

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        pagePreview: fileURLToPath(new URL('page-preview.html', import.meta.url)),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    /* strictPort intentionally off: another Workbench dev server may already
       be holding 5174 on this machine, so let Vite fall back to the next free
       port instead of failing the boot. */
    strictPort: false,
    /* Native filesystem events are the default. Polling this repository every
       250ms keeps four libuv workers saturated on large icon/project trees and
       can delay even tiny asset responses by more than a second. Network or
       container filesystems that genuinely need polling can opt in explicitly. */
    watch: {
      usePolling: process.env.WORKBENCH_VITE_USE_POLLING === '1',
      interval: 1_000,
      ignored: [
        '**/.git/**',
        '**/.workbench/history.json',
        '**/build/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/public/workbench-assets/**',
        '**/projects/**/.git/**',
        '**/projects/**/.workbench/history.json',
        '**/projects/**/build/**',
        '**/projects/**/dist/**',
        '**/projects/**/node_modules/**',
      ],
    },
    /* Allow reading files from sibling project/library folders so the Import
       Library flow can inspect source files outside the active project root. */
    fs: {
      allow: ['..'],
    },
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  },
  plugins: [
    workbenchProjectRuntimeSourceMapPlugin(),
    react(),
    {
      name: 'workbench-react-runtime-dedupe',
      enforce: 'pre',
      resolveId(source, importer) {
        const reactRuntimeId = getReactRuntimeModuleId(source);
        if (!reactRuntimeId) return null;

        const sourcePath = normalizeViteFsImporterPath(source);
        const importerPath = importer ? normalizeViteFsImporterPath(importer) : null;
        if (!shouldDedupeWorkbenchReactRuntimeImport(importerPath, sourcePath)) return null;

        return `${WORKBENCH_REACT_RUNTIME_PROXY_PREFIX}${reactRuntimeId}`;
      },
      load(id) {
        const reactRuntimeId = getWorkbenchReactRuntimeProxyModuleId(id);
        return reactRuntimeId ? getWorkbenchReactRuntimeProxyModule(reactRuntimeId) : null;
      },
    },
    {
      name: 'workbench-project-runtime-aliases',
      async resolveId(source, importer) {
        if (!source.startsWith('@/') || !importer) return null;
        const importerPath = normalizeViteFsImporterPath(importer);
        if (!importerPath) return null;

        const projectRoot = resolveProjectRuntimeAliasRoot(importer, importerPath);
        if (!projectRoot) return null;

        const targetPath = resolve(projectRoot, 'src', source.slice(2));
        if (!isPathInsideDirectory(targetPath, resolve(projectRoot, 'src'))) return null;

        const resolved = await this.resolve(targetPath, importer, { skipSelf: true });
        return resolved?.id ?? targetPath;
      },
    },
    {
      name: 'workbench-local-project-files',
      handleHotUpdate(context) {
        if (!activeProjectRoot) return undefined;
        const projectPath = toProjectRelativePath(activeProjectRoot, context.file);
        if (!projectPath || !isWorkbenchProjectRuntimeHotUpdatePath(projectPath)) return undefined;

        emitWorkbenchProjectPreviewDataChange(context.server, projectPath);
        return [];
      },
      configureServer(server) {
        const tailwindAutoSync = createWorkbenchTailwindAutoSync(server);
        const runtimeBundles = new Map<string, string>();
        const observeDependencyInstall = (
          projectRoot: string,
          queuedInstall: {
            completion: Promise<unknown>;
            started: boolean;
          },
        ) => {
          if (!queuedInstall.started) return;
          void queuedInstall.completion
            .then(() => {
              if (activeProjectRoot === projectRoot) {
                emitWorkbenchProjectPreviewDataChange(
                  server,
                  workbenchHost.DEPENDENCY_INSTALL_STATUS_PATH,
                );
                // Mirror the local bridge: dependencies landing is a dependency-tree
                // change, so resync preview CSS and refresh renderer hydration.
                emitWorkbenchProjectPreviewDataChange(server, 'package.json');
                tailwindAutoSync.handleProjectPathChange('package.json');
              }
            })
            .catch((error) => {
              server.config.logger.warn(`[workbench] Project dependency install status failed: ${error instanceof Error ? error.message : String(error)}`);
            });
        };
        void hydrateActiveProjectRootForVite(server, tailwindAutoSync);

        server.middlewares.use(async (request, response, next) => {
          const pathname = getRequestPathname(request);
          if (isWorkbenchMutationRequest(request, pathname) && !isTrustedWorkbenchRequest(request)) {
            response.statusCode = 403;
            response.end('Workbench local project requests must come from the current dev-server origin');
            return;
          }

          if ((request.method === 'GET' || request.method === 'HEAD') && isProjectPublicAssetPathname(pathname)) {
            if (activeProjectRoot && activeProjectRoot !== server.config.root) {
              const served = await tryServeProjectPublicAsset(activeProjectRoot, pathname, response, request.method === 'HEAD');
              if (served) return;
            }
          }

          if (request.method === 'GET' && pathname === PROJECT_LOCATION_PATH) {
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
              observeDependencyInstall(activeProjectRoot, queuedInstall);
            }
            sendJson(response, workbenchHost.createProjectLocation(activeProjectRoot, 'dev-server', dependencyInstall));
            return;
          }

          if (request.method === 'DELETE' && pathname === PROJECT_LOCATION_PATH) {
            activeProjectRoot = null;
            await tailwindAutoSync.setProjectRoot(null);
            await persistActiveProjectRootForVite(null);
            sendJson(response, { ok: true });
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_DEPENDENCY_INSTALL_PATH) {
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
            observeDependencyInstall(activeProjectRoot, queuedInstall);
            sendJson(
              response,
              workbenchHost.createProjectLocation(activeProjectRoot, 'dev-server', queuedInstall.status),
            );
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

          if (request.method === 'GET' && pathname === PROJECT_IMAGE_PROXY_PATH) {
            try {
              const url = new URL(request.url ?? '/', 'http://workbench.local');
              await proxyWorkbenchImageUrl(url.searchParams.get('url') ?? '', response);
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Image could not be proxied');
            }
            return;
          }

          if (request.method === 'GET' && pathname === PROJECT_PREVIEW_MODULE_PATH) {
            if (!activeProjectRoot) {
              response.statusCode = 409;
              response.end('No Workbench project is open');
              return;
            }
            try {
              const url = new URL(request.url ?? '/', 'http://workbench.local');
              const sourcePath = url.searchParams.get('source') ?? '';
              const normalizedSourcePath = normalizeWorkbenchPreviewPageSourcePath(sourcePath);
              if (!normalizedSourcePath) {
                response.statusCode = 400;
                response.end('Browser preview only supports workbench page source files');
                return;
              }
              const filePath = workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot!, normalizedSourcePath);
              if (!filePath) {
                response.statusCode = 400;
                response.end('Invalid preview source file path');
                return;
              }

              const cssModuleUrls = await collectProjectCssModuleUrls(activeProjectRoot!, normalizedSourcePath);
              const tailwindCssConfig = await readProjectTailwindPreviewCssConfig(activeProjectRoot!);
              sendJson(response, {
                ok: true,
                sourceFile: normalizedSourcePath,
                moduleUrl: toViteFileSystemModuleUrl(filePath),
                cssModuleUrls,
                tailwindCssMode: getProjectTailwindPreviewCssMode(tailwindCssConfig),
              });
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Preview module could not be resolved');
            }
            return;
          }

          if (request.method === 'GET' && pathname === PROJECT_RUNTIME_MODULE_PATH) {
            if (!activeProjectRoot) {
              response.statusCode = 409;
              response.end('No Workbench project is open');
              return;
            }
            try {
              const url = new URL(request.url ?? '/', 'http://workbench.local');
              const sourcePath = url.searchParams.get('source') ?? '';
              const dependencyPath = url.searchParams.get('dependency') ?? '';
              const filePath = workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot, sourcePath);
              const dependencyFilePath = dependencyPath
                ? workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot, dependencyPath)
                : null;
              if (!filePath || (dependencyPath && !dependencyFilePath)) {
                response.statusCode = 400;
                response.end('Invalid runtime module source path');
                return;
              }

              const sourceContents = readFileSync(filePath);
              const dependencyContents = dependencyFilePath ? readFileSync(dependencyFilePath) : null;
              const sourceVersion = createHash('sha256')
                .update(sourcePath.replace(/\\/g, '/'))
                .update(sourceContents)
                .update(dependencyPath.replace(/\\/g, '/'))
                .update(dependencyContents ?? '')
                // A module URL that failed to import stays failed in the browser's
                // module map for the document's lifetime, so the URL must change
                // when the dependency tree changes (e.g. npm install finishing).
                .update(getProjectDependencyTreeFingerprint(activeProjectRoot))
                .digest('hex')
                .slice(0, 16);
              sendJson(response, {
                ok: true,
                sourceFile: sourcePath,
                moduleUrl: `${toViteFileSystemModuleUrl(filePath)}?wb_source_version=${sourceVersion}`,
              });
            } catch (error) {
              response.statusCode = 404;
              response.end(error instanceof Error ? error.message : 'Runtime module could not be resolved');
            }
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH) {
            await sendViteRuntimeBundleManifest(request, response, activeProjectRoot, runtimeBundles);
            return;
          }

          if (request.method === 'GET' && pathname.startsWith(PROJECT_RUNTIME_BUNDLE_PREFIX)) {
            sendViteRuntimeBundle(response, pathname, runtimeBundles);
            return;
          }

          if (
            (request.method === 'GET' || request.method === 'HEAD') &&
            pathname.startsWith(VITE_FS_PREFIX) &&
            activeProjectRoot
          ) {
            const filePath = normalizeViteFsImporterPath(pathname);
            if (
              filePath &&
              isPathInsideDirectory(filePath, activeProjectRoot) &&
              /\.(?:css|jsx?|tsx?)$/i.test(filePath)
            ) {
              if (request.method === 'HEAD') {
                response.setHeader('Cache-Control', 'no-store, max-age=0');
                response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
                response.end();
                return;
              }
              try {
                sendJavaScript(response, await compileProjectModule({
                  filePath,
                  nodeModuleRoots: WORKBENCH_PROJECT_RUNTIME_NODE_MODULE_ROOTS,
                  projectRoot: activeProjectRoot,
                }));
              } catch (error) {
                response.statusCode = 422;
                response.end(error instanceof Error ? error.message : 'Runtime module could not be built');
              }
              return;
            }
          }

          if (request.method === 'POST' && pathname === FOLDER_DIALOG_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isFolderDialogAction(body)) {
              response.statusCode = 400;
              response.end('Invalid folder dialog action');
              return;
            }

            const result = await chooseFolder(body.purpose);
            sendJson(response, result);
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_LOCATION_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isProjectRootAction(body)) {
              response.statusCode = 400;
              response.end('Invalid workbench project action');
              return;
            }

            try {
              const createdProject = body.action === 'create'
                ? await workbenchHost.scaffoldWorkbenchProjectFolder(
                  body.parentPath,
                  body.projectName,
                  body.templateId,
                )
                : null;
              const rootPath = body.action === 'create' ? createdProject.rootPath : resolve(body.rootPath);
              const validation = await workbenchHost.validateWorkbenchProjectRoot(rootPath);
              if (!validation.ok) {
                response.statusCode = body.action === 'open' ? 404 : 500;
                sendJson(response, validation);
                return;
              }
              activeProjectRoot = validation.rootPath;
              allowWorkbenchProjectRootForVite(server, activeProjectRoot);
              tailwindAutoSync.setProjectRoot(activeProjectRoot);
              void persistActiveProjectRootForVite(activeProjectRoot);
              if (body.action === 'create') {
                setImmediate(() => {
                  void workbenchHost.queueWorkbenchProjectDependencyInstall(validation.rootPath, body.templateId)
                    .then((queuedInstall) => {
                      observeDependencyInstall(validation.rootPath, queuedInstall);
                    })
                    .catch((error) => {
                      server.config.logger.warn(`[workbench] Project dependency install status failed: ${error instanceof Error ? error.message : String(error)}`);
                    });
                });
              }
              const dependencyInstall = body.action === 'create'
                ? createdProject.dependencyInstall
                : await workbenchHost.readWorkbenchProjectDependencyInstallStatus(activeProjectRoot);
              sendJson(
                response,
                workbenchHost.createProjectLocation(activeProjectRoot, 'dev-server', dependencyInstall),
              );
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Workbench project action failed';
              response.statusCode = body.action === 'open'
                ? 404
                : message === 'Project folder already exists.' ? 409 : 500;
              sendJson(response, { message, ok: false });
            }
            return;
          }

          if (!activeProjectRoot && requiresActiveWorkbenchProject(pathname)) {
            response.statusCode = 409;
            response.end('No Workbench project is open');
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_SOURCE_READ_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isSourceReadAction(body)) {
              response.statusCode = 400;
              response.end('Invalid source read action');
              return;
            }

            const filePath = workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot!, body.path);
            if (!filePath) {
              response.statusCode = 400;
              response.end('Invalid source file path');
              return;
            }

            try {
              sendJson(response, { ok: true, contents: readFileSync(filePath, 'utf8') });
            } catch (error) {
              // Existence probes (module extension candidates, optional sidecars) expect
              // misses; answer them in-band so the browser does not log each one as a 404.
              if (body.allowMissing && isMissingFileError(error)) {
                sendJson(response, { ok: false, missing: true, message: 'Source file not found' });
                return;
              }
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
                allowAppRootImports: true,
                appRoot: server.config.root,
                includeContents: body.includeContents,
                includePresetTokens: true,
                projectRoot: activeProjectRoot!,
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
              sendJson(response, await workbenchHost.writeWorkbenchAssetFile(activeProjectRoot!, body));
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Asset file could not be written');
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
              sendJson(response, await workbenchHost.deleteWorkbenchAssetPaths(activeProjectRoot!, body));
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Asset paths could not be deleted');
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
              sendJson(response, await workbenchHost.installWorkbenchAssets(activeProjectRoot!, body));
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Assets could not be installed');
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

            const filePath = workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot!, body.path);
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
              // File does not exist, which is fine for a create action.
            }

            await workbenchHost.writeFileAtomic(filePath, body.contents);
            emitWorkbenchProjectPreviewDataChange(server, body.path);
            tailwindAutoSync.handleProjectPathChange(body.path);
            sendJson(response, { ok: true });
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_SOURCE_DELETE_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isSourceDeleteAction(body)) {
              response.statusCode = 400;
              response.end('Invalid source delete action');
              return;
            }

            const filePath = workbenchHost.resolveWorkbenchSourcePath(activeProjectRoot!, body.path);
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
            tailwindAutoSync.handleProjectPathChange(body.path);
            sendJson(response, { ok: true });
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_SOURCE_MKDIR_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isSourceDirAction(body)) {
              response.statusCode = 400;
              response.end('Invalid source mkdir action');
              return;
            }

            const dirPath = workbenchHost.resolveWorkbenchSourceDirPath(activeProjectRoot!, body.path);
            if (!dirPath) {
              response.statusCode = 400;
              response.end('Invalid source folder path');
              return;
            }

            try {
              await mkdir(dirPath, { recursive: true });
              sendJson(response, { ok: true });
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Source folder could not be created');
            }
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_SOURCE_MOVE_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isSourceMoveAction(body)) {
              response.statusCode = 400;
              response.end('Invalid source move action');
              return;
            }

            // The source endpoint accepts both files and directories, so we resolve
            // each side as a file path when it carries a supported extension and as
            // a directory path otherwise.
            const fromPath = workbenchHost.resolveWorkbenchSourcePathOrDir(activeProjectRoot!, body.from);
            const toPath = workbenchHost.resolveWorkbenchSourcePathOrDir(activeProjectRoot!, body.to);
            if (!fromPath || !toPath) {
              response.statusCode = 400;
              response.end('Invalid source move path');
              return;
            }

            try {
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
              emitWorkbenchProjectPreviewDataChange(server, body.from);
              emitWorkbenchProjectPreviewDataChange(server, body.to);
              tailwindAutoSync.handleProjectPathChange(body.from);
              tailwindAutoSync.handleProjectPathChange(body.to);
              sendJson(response, { ok: true });
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Source path could not be moved');
            }
            return;
          }

          if (request.method === 'POST' && pathname === PROJECT_SOURCE_RMDIR_PATH) {
            const body = await readJsonRequestBody(request);
            if (!isSourceRmdirAction(body)) {
              response.statusCode = 400;
              response.end('Invalid source rmdir action');
              return;
            }

            const dirPath = workbenchHost.resolveWorkbenchSourceDirPath(activeProjectRoot!, body.path);
            if (!dirPath) {
              response.statusCode = 400;
              response.end('Invalid source folder path');
              return;
            }

            try {
              if (body.recursive) {
                await rm(dirPath, { recursive: true, force: true });
              } else {
                // Non-recursive delete only succeeds on an empty directory.
                await rm(dirPath, { recursive: false });
              }
              sendJson(response, { ok: true });
            } catch (error) {
              response.statusCode = 400;
              response.end(error instanceof Error ? error.message : 'Source folder could not be removed');
            }
            return;
          }

          const projectPath = getWorkbenchProjectPath(pathname);
          if (!projectPath) {
            next();
            return;
          }

          const filePath = workbenchHost.resolveWorkbenchProjectPath(activeProjectRoot!, projectPath);
          if (!filePath) {
            response.statusCode = 400;
            response.end('Invalid workbench project file path');
            return;
          }

            try {
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
              emitWorkbenchProjectPreviewDataChange(server, projectPath);
              sendJson(response, { ok: true });
              return;
            }

            if (request.method !== 'GET' && request.method !== 'HEAD') {
              response.statusCode = 405;
              response.end('Unsupported workbench project file method');
              return;
            }

            const contents = await readFile(filePath, 'utf8');
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            if (request.method === 'HEAD') {
              response.end();
              return;
            }
            response.end(contents);
          } catch (error) {
            // Optional project files (the prop registry, for one) are read with
            // ?allowMissing=1, so their absence is a 204 rather than a logged 404.
            if (
              (request.method === 'GET' || request.method === 'HEAD') &&
              new URL(request.url ?? '/', 'http://workbench.local').searchParams.get('allowMissing') === '1' &&
              isMissingFileError(error)
            ) {
              response.statusCode = 204;
              response.end();
              return;
            }
            response.statusCode = 404;
            response.end('Workbench project file not found');
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@renderer': fileURLToPath(new URL('./renderer', import.meta.url)),
    },
    // Dedupe React so dynamically-imported library stories (loaded via /@fs/
    // URLs from project sub-roots like projects/<name>/src/libraries/...) share
    // the host's single React instance. Without this, stateful CSF stories
    // (Dialog, Toast, Radio) get a duplicate React copy whose useState updates
    // never reach the host renderer — clicks on Open dialog buttons appear to
    // do nothing.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: WORKBENCH_PROJECT_RUNTIME_OPTIMIZE_DEP_EXCLUDES,
  },
  define: {
    /* @babel/generator (and a few transitive babel packages) reference
       `process.env.NODE_ENV` at module-eval time. Browsers have no `process`
       global, so we shim it via Vite's `define` so the workbench export modal
       can prettify TSX. */
    'process.env.NODE_ENV': JSON.stringify('production'),
    __WORKBENCH_BUILD_INFO__: JSON.stringify(WORKBENCH_BUILD_INFO),
  },
});

function createWorkbenchBuildInfo(): {
  channel: string;
  dirty: boolean;
  revision: string;
  version: string;
} {
  const packageJson = JSON.parse(readFileSync(resolve(WORKBENCH_ROOT, 'package.json'), 'utf8')) as { version?: unknown };
  const environmentRevision = (
    process.env.WORKBENCH_BUILD_REVISION
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
  )?.trim();
  const revision = environmentRevision || readGitBuildValue(['rev-parse', '--verify', 'HEAD']) || 'unknown';
  const rendererSourcePaths = [
    'src',
    'public',
    'index.html',
    'page-preview.html',
    'workbench-source-preview.html',
    'vite.config.ts',
    'package.json',
    'THIRD_PARTY_NOTICES.md',
    'THIRD_PARTY_NODE_MODULE_NOTICES.md',
    'THIRD_PARTY_RUNTIME_NOTICES.md',
  ];
  const dirty = environmentRevision
    ? false
    : Boolean(readGitBuildValue(['status', '--porcelain', '--untracked-files=normal', '--', ...rendererSourcePaths]));

  return {
    channel: getWorkbenchBuildChannel(),
    dirty,
    revision,
    version: typeof packageJson.version === 'string' ? packageJson.version : '0.0.0',
  };
}

function readGitBuildValue(args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd: WORKBENCH_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

function getWorkbenchBuildChannel(): string {
  const configured = process.env.WORKBENCH_BUILD_CHANNEL?.trim();
  if (configured) return configured;
  const vercelEnvironment = process.env.VERCEL_ENV?.trim();
  if (vercelEnvironment) return `vercel-${vercelEnvironment}`;
  return process.env.NODE_ENV === 'production' ? 'local-build' : 'local-development';
}

function getRequestPathname(request: IncomingMessage): string {
  return new URL(request.url ?? '/', 'http://workbench.local').pathname;
}

function emitWorkbenchProjectPreviewDataChange(server: ViteDevServer, projectPath: string): void {
  const normalizedPath = projectPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!isWorkbenchProjectPreviewDataChangePath(normalizedPath)) return;
  emitWorkbenchProjectPreviewDataChangedPath(server, normalizedPath);
}

function isWorkbenchProjectPreviewDataChangePath(path: string): boolean {
  const normalizedPath = normalizeProjectPathLoose(path);
  if (PROJECT_PREVIEW_DATA_CHANGE_PATHS.has(normalizedPath)) return true;
  return isWorkbenchProjectRuntimeHotUpdatePath(normalizedPath);
}

function isWorkbenchProjectRuntimeHotUpdatePath(path: string): boolean {
  const normalizedPath = normalizeProjectPathLoose(path);
  if (!WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN.test(normalizedPath)) return false;
  if (normalizedPath.startsWith('.workbench/')) return false;
  if (normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || BLOCKED_SOURCE_PATH_PARTS.has(part))) {
    return false;
  }
  return true;
}

function emitWorkbenchProjectPreviewDataChangedPath(server: ViteDevServer, projectPath: string): void {
  const normalizedPath = projectPath.replace(/\\/g, '/').replace(/^\/+/, '');

  server.ws.send({
    type: 'custom',
    event: PROJECT_PREVIEW_DATA_CHANGED_EVENT,
    data: { path: normalizedPath },
  });
}

function getProjectDependencyTreeFingerprint(projectRoot: string): string {
  return ['package.json', 'package-lock.json', join('node_modules', '.package-lock.json')].map((candidate) => {
    try {
      const stats = statSync(join(projectRoot, candidate));
      return `${Math.trunc(stats.mtimeMs)}:${stats.size}`;
    } catch {
      return 'missing';
    }
  }).join('|');
}

function allowWorkbenchProjectRootForVite(server: ViteDevServer, projectRoot: string): void {
  const normalizedProjectRoot = resolve(projectRoot);
  const allowList = server.config.server.fs.allow ?? [];
  const rootAlreadyAllowed = allowList.some((allowedRoot) => {
    const normalizedAllowedRoot = resolve(server.config.root, allowedRoot);
    return isPathInsideDirectory(normalizedProjectRoot, normalizedAllowedRoot);
  });

  if (rootAlreadyAllowed) return;

  allowList.push(normalizedProjectRoot);
  server.config.server.fs.allow = allowList;
  server.config.logger.info(`[workbench] allowed active project files: ${normalizedProjectRoot}`);
}

async function hydrateActiveProjectRootForVite(
  server: ViteDevServer,
  tailwindAutoSync: ReturnType<typeof createWorkbenchTailwindAutoSync>,
): Promise<void> {
  if (activeProjectRoot) return;
  const restoredProjectRoot = await readPersistedActiveProjectRootForVite();
  if (!restoredProjectRoot) return;

  try {
    const validation = await workbenchHost.validateWorkbenchProjectRoot(restoredProjectRoot);
    if (!validation.ok) {
      await persistActiveProjectRootForVite(null);
      return;
    }
    activeProjectRoot = validation.rootPath;
    allowWorkbenchProjectRootForVite(server, activeProjectRoot);
    await tailwindAutoSync.setProjectRoot(activeProjectRoot);
    server.config.logger.info(`[workbench] restored active project: ${activeProjectRoot}`);
  } catch {
    await persistActiveProjectRootForVite(null);
  }
}

async function readPersistedActiveProjectRootForVite(): Promise<string | null> {
  try {
    const raw = await readFile(WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || typeof parsed.rootPath !== 'string' || parsed.rootPath.trim().length === 0) {
      return null;
    }
    return resolve(parsed.rootPath);
  } catch {
    return null;
  }
}

async function persistActiveProjectRootForVite(projectRoot: string | null): Promise<void> {
  try {
    if (!projectRoot) {
      await rm(WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH, { force: true });
      return;
    }

    await mkdir(dirname(WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH), { recursive: true });
    await writeFile(
      WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH,
      `${JSON.stringify({ rootPath: resolve(projectRoot), updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8',
    );
  } catch {
    // The in-memory project stays active even if this local dev convenience file cannot be written.
  }
}

function createWorkbenchTailwindAutoSync(server: ViteDevServer) {
  let projectRoot: string | null = null;
  let syncConfig: ProjectTailwindPreviewCssConfig = EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  let syncRunning = false;
  let syncPending = false;

  server.watcher.on('all', (_event, filePath) => {
    if (!projectRoot) return;
    const projectPath = toProjectRelativePath(projectRoot, filePath);
    if (!projectPath) return;
    emitWorkbenchProjectPreviewDataChange(server, projectPath);
    scheduleIfTailwindSourcePath(projectPath);
  });

  async function setProjectRoot(nextProjectRoot: string | null): Promise<void> {
    projectRoot = nextProjectRoot;
    clearScheduledSync();
    syncConfig = EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
    if (!projectRoot) return;

    syncConfig = await readProjectTailwindPreviewCssConfig(projectRoot);
    if (!syncConfig.enabled) return;

    const watchPaths = new Set([
      'components.json',
      'package.json',
      '.workbench/workbench.config.json',
      '.workbench/assets.json',
      '.workbench/selection.json',
      '.workbench/tokens.json',
      syncConfig.sourceCss,
      syncConfig.compiledCss,
      syncConfig.tokenCss,
    ].filter((path): path is string => Boolean(path)));
    for (const watchPath of watchPaths) {
      server.watcher.add(resolve(projectRoot, watchPath));
    }

    scheduleSync('project-opened');
  }

  function handleProjectPathChange(projectPath: string): void {
    scheduleIfTailwindSourcePath(projectPath);
  }

  function scheduleIfTailwindSourcePath(projectPath: string): void {
    if (!projectRoot || !syncConfig.enabled) return;
    const normalizedPath = normalizeProjectCssConfigPath(projectPath) ?? normalizeProjectPathLoose(projectPath);
    if (!shouldTailwindAutoSyncForProjectPath(normalizedPath, syncConfig)) return;
    scheduleSync(normalizedPath);
  }

  function scheduleSync(reason: string): void {
    if (!projectRoot) return;
    if (syncRunning) {
      syncPending = true;
      return;
    }
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void runSync(reason);
    }, TAILWIND_AUTO_SYNC_DEBOUNCE_MS);
  }

  async function runSync(reason: string): Promise<void> {
    if (!projectRoot || syncRunning) return;
    const rootAtStart = projectRoot;
    const configAtStart = await readProjectTailwindPreviewCssConfig(rootAtStart);
    syncConfig = configAtStart;
    if (!configAtStart.enabled || !configAtStart.sourceCss || !configAtStart.compiledCss) return;

    syncRunning = true;
    try {
      await execFileAsync(
        process.execPath,
        [WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', rootAtStart, '--preview-only'],
        { env: createWorkbenchTailwindSyncEnvironment() },
      );
      if (projectRoot !== rootAtStart) return;
      syncConfig = await readProjectTailwindPreviewCssConfig(rootAtStart);
      emitTailwindAutoSyncPreviewEvents(server, syncConfig);
      server.config.logger.info(`[workbench] synced Tailwind preview CSS (${reason})`);
    } catch (error) {
      server.config.logger.warn(`[workbench] Tailwind preview CSS sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      syncRunning = false;
      if (syncPending) {
        syncPending = false;
        scheduleSync('pending-change');
      }
    }
  }

  function clearScheduledSync(): void {
    syncPending = false;
    if (!syncTimer) return;
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  return {
    handleProjectPathChange,
    setProjectRoot,
  };
}

function emitTailwindAutoSyncPreviewEvents(server: ViteDevServer, config: ProjectTailwindPreviewCssConfig): void {
  if (config.compiledCss) emitWorkbenchProjectPreviewDataChangedPath(server, config.compiledCss);
}

function shouldTailwindAutoSyncForProjectPath(path: string, config: ProjectTailwindPreviewCssConfig): boolean {
  const normalizedPath = normalizeProjectPathLoose(path);
  if (!normalizedPath) return false;
  if (normalizedPath === config.compiledCss || normalizedPath === config.tokenCss) return false;
  if (normalizedPath === '.workbench/workbench.config.json') return true;
  if (normalizedPath.startsWith('.workbench/') && normalizedPath !== '.workbench/workbench.config.json') return false;
  if (normalizedPath.startsWith('dist/') || normalizedPath.startsWith('node_modules/')) return false;
  if (normalizedPath === config.sourceCss || normalizedPath === 'components.json' || normalizedPath === 'package.json') return true;
  return normalizedPath.startsWith('src/') && /\.(tsx?|jsx?|html?|vue)$/i.test(normalizedPath);
}

function normalizeProjectPathLoose(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

function toProjectRelativePath(projectRoot: string, filePath: string): string | null {
  const relativePath = relative(projectRoot, filePath).replace(/\\/g, '/');
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return relativePath;
}

function getWorkbenchProjectPath(pathname: string): string | null {
  if (pathname.startsWith(PROJECT_FILE_PREFIX)) {
    return decodeURIComponent(pathname.slice(PROJECT_FILE_PREFIX.length));
  }

  if (pathname.startsWith(LEGACY_WORKBENCH_PREFIX) && pathname.endsWith('.json')) {
    return `.workbench/${decodeURIComponent(pathname.slice(LEGACY_WORKBENCH_PREFIX.length))}`;
  }

  return null;
}

function isWorkbenchMutationRequest(request: IncomingMessage, pathname: string): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return false;
  return pathname === PROJECT_LOCATION_PATH ||
    pathname === PROJECT_DEPENDENCY_INSTALL_PATH ||
    pathname === FOLDER_DIALOG_PATH ||
    pathname === PROJECT_SOURCE_READ_PATH ||
    pathname === PROJECT_SOURCE_WRITE_PATH ||
    pathname === PROJECT_SOURCE_IMPORT_TREE_PATH ||
    pathname === PROJECT_SOURCE_DELETE_PATH ||
    pathname === PROJECT_SOURCE_MKDIR_PATH ||
    pathname === PROJECT_SOURCE_MOVE_PATH ||
    pathname === PROJECT_SOURCE_RMDIR_PATH ||
    pathname === PROJECT_ASSET_WRITE_PATH ||
    pathname === PROJECT_ASSET_INSTALL_PATH ||
    pathname === PROJECT_ASSET_DELETE_PATH ||
    pathname === PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH ||
    getWorkbenchProjectPath(pathname) !== null;
}

function isProjectPublicAssetPathname(pathname: string): boolean {
  return PROJECT_PUBLIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isTrustedWorkbenchRequest(request: IncomingMessage): boolean {
  const fetchSite = getHeaderValue(request, 'sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
    return false;
  }

  const origin = getHeaderValue(request, 'origin');
  if (!origin) return true;

  const host = getHeaderValue(request, 'host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function createWorkbenchTailwindSyncEnvironment(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.ESBUILD_BINARY_NAME;
  delete environment.ESBUILD_BINARY_PATH;
  return environment;
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
  if (headOnly) {
    response.end();
    return true;
  }
  response.end(asset.buffer);
  return true;
}

async function proxyWorkbenchImageUrl(rawUrl: string, response: ServerResponse): Promise<void> {
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
    if (Number.isFinite(contentLength) && contentLength > MAX_WORKBENCH_IMAGE_PROXY_BYTES) {
      response.statusCode = 413;
      response.end('Image is too large');
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_WORKBENCH_IMAGE_PROXY_BYTES) {
      response.statusCode = 413;
      response.end('Image is too large');
      return;
    }

    const contentType = getWorkbenchImageProxyContentType(buffer, upstreamContentType);
    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

function getWorkbenchImageProxyContentType(buffer: Buffer, upstreamContentType: string): string {
  return sniffWorkbenchImageContentType(buffer) ?? upstreamContentType;
}

function sniffWorkbenchImageContentType(buffer: Buffer): string | null {
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

function sendJson(response: ServerResponse, value: unknown) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(value));
}

function sendJavaScript(response: ServerResponse, contents: string) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  response.end(contents);
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      size += Buffer.byteLength(chunk, 'utf8');
      if (size > MAX_WORKBENCH_REQUEST_BODY_BYTES) {
        reject(new Error('Workbench request body is too large.'));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function readJsonRequestBody(request: IncomingMessage): Promise<unknown> {
  if (!hasJsonContentType(request)) return null;
  let body;
  try {
    body = await readRequestBody(request);
  } catch {
    return null;
  }
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

type ViteRuntimeBundleImportRequest = {
  importSource: string;
  key: string;
  sourceFile: string;
};

async function sendViteRuntimeBundleManifest(
  request: IncomingMessage,
  response: ServerResponse,
  projectRoot: string | null,
  runtimeBundles: Map<string, string>,
): Promise<void> {
  if (!projectRoot) {
    response.statusCode = 409;
    response.end('No Workbench project is open');
    return;
  }

  const imports = normalizeViteRuntimeBundleImports(await readJsonRequestBody(request));
  if (!imports || imports.length === 0) {
    response.statusCode = 400;
    response.end('Runtime bundle request must include project-local imports');
    return;
  }

  const resolvedImports: Array<ViteRuntimeBundleImportRequest & { exportName: string; resolvedSourceFile: string }> = [];
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
    sendJson(response, { failures, imports: [], ok: false });
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
      nodeModuleRoots: WORKBENCH_PROJECT_RUNTIME_NODE_MODULE_ROOTS,
      projectRoot,
    });
    const bundleId = createHash('sha256').update(contents).digest('hex').slice(0, 24);
    runtimeBundles.set(bundleId, contents);
    while (runtimeBundles.size > 8) {
      const oldestBundleId = runtimeBundles.keys().next().value as string | undefined;
      if (!oldestBundleId) break;
      runtimeBundles.delete(oldestBundleId);
    }

    sendJson(response, {
      failures,
      imports: resolvedImports.map(({ exportName, key }) => ({ exportName, key })),
      moduleUrl: `${PROJECT_RUNTIME_BUNDLE_PREFIX}${bundleId}.js`,
      ok: true,
    });
  } catch (error) {
    response.statusCode = 422;
    response.end(error instanceof Error ? error.message : 'Runtime bundle could not be built');
  }
}

function normalizeViteRuntimeBundleImports(payload: unknown): ViteRuntimeBundleImportRequest[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.imports) || payload.imports.length === 0 || payload.imports.length > 512) {
    return null;
  }

  const imports: ViteRuntimeBundleImportRequest[] = [];
  const keys = new Set<string>();
  for (const value of payload.imports) {
    if (!isRecord(value)) return null;
    const key = typeof value.key === 'string' ? value.key.trim() : '';
    const importSource = typeof value.importSource === 'string' ? value.importSource.trim() : '';
    const sourceFile = typeof value.sourceFile === 'string' ? normalizeProjectPathLoose(value.sourceFile) : '';
    if (
      !key ||
      key.length > 1024 ||
      keys.has(key) ||
      !sourceFile ||
      !/\.(?:jsx?|tsx?|vue)$/i.test(sourceFile) ||
      sourceFile.split('/').some(isBlockedProjectPathPart) ||
      !isProjectLocalImportSource(importSource)
    ) {
      return null;
    }
    keys.add(key);
    imports.push({ importSource, key, sourceFile });
  }
  return imports;
}

function sendViteRuntimeBundle(
  response: ServerResponse,
  pathname: string,
  runtimeBundles: Map<string, string>,
): void {
  const bundleId = pathname.slice(PROJECT_RUNTIME_BUNDLE_PREFIX.length).replace(/\.js$/, '');
  if (!/^[a-f0-9]{24}$/.test(bundleId)) {
    response.statusCode = 400;
    response.end('Invalid runtime bundle id');
    return;
  }
  const contents = runtimeBundles.get(bundleId);
  if (!contents) {
    response.statusCode = 404;
    response.end('Runtime bundle expired');
    return;
  }
  sendJavaScript(response, contents);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function requiresActiveWorkbenchProject(pathname: string): boolean {
  return pathname === PROJECT_DEPENDENCY_INSTALL_PATH ||
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
    pathname === PROJECT_PREVIEW_MODULE_PATH ||
    pathname === PROJECT_RUNTIME_MODULE_PATH ||
    pathname === PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH ||
    Boolean(getWorkbenchProjectPath(pathname));
}

type ProjectRootAction =
  | { action: 'open'; rootPath: string }
  | { action: 'create'; parentPath: string; projectName: string; templateId?: WorkbenchProjectTemplateId };

type WorkbenchProjectTemplateId = 'standard' | 'tailwind' | 'shadcn-base' | 'astryx';

type FolderDialogAction = {
  purpose: 'open-project' | 'create-parent';
};

type SourceReadAction = {
  path: string;
  allowMissing?: boolean;
};

type SourceWriteAction = {
  path: string;
  contents: string;
  overwrite?: boolean;
};

type SourceDeleteAction = {
  path: string;
};

type SourceDirAction = {
  path: string;
};

type SourceMoveAction = {
  from: string;
  to: string;
  overwrite?: boolean;
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

type AssetDeleteAction = {
  paths: string[];
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

type GoogleFontCatalogItem = {
  category?: string;
  family: string;
  subsets: string[];
  variants: string[];
  weights: string[];
};

function isProjectRootAction(value: unknown): value is ProjectRootAction {
  if (typeof value !== 'object' || value === null) return false;
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
      (
        candidate.templateId === undefined ||
        candidate.templateId === 'standard' ||
        candidate.templateId === 'tailwind' ||
        candidate.templateId === 'shadcn-base' ||
        candidate.templateId === 'astryx'
      )
    );
  }

  return false;
}

function isFolderDialogAction(value: unknown): value is FolderDialogAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.purpose === 'open-project' || candidate.purpose === 'create-parent';
}

function isSourceReadAction(value: unknown): value is SourceReadAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.trim().length > 0 &&
    (candidate.allowMissing === undefined || typeof candidate.allowMissing === 'boolean')
  );
}

function isMissingFileError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null ? (error as NodeJS.ErrnoException).code : undefined;
  return code === 'ENOENT' || code === 'ENOTDIR' || code === 'EISDIR';
}

function isSourceWriteAction(value: unknown): value is SourceWriteAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.trim().length > 0 &&
    typeof candidate.contents === 'string' &&
    (candidate.overwrite === undefined || typeof candidate.overwrite === 'boolean')
  );
}

function isSourceDeleteAction(value: unknown): value is SourceDeleteAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.path === 'string' && candidate.path.trim().length > 0;
}

function isSourceDirAction(value: unknown): value is SourceDirAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.path === 'string' && candidate.path.trim().length > 0;
}

function isSourceMoveAction(value: unknown): value is SourceMoveAction {
  if (typeof value !== 'object' || value === null) return false;
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
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.path === 'string' &&
    candidate.path.trim().length > 0 &&
    (candidate.recursive === undefined || typeof candidate.recursive === 'boolean')
  );
}

function isDiskImportAction(value: unknown): value is DiskImportAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.sourcePath === 'string' &&
    candidate.sourcePath.trim().length > 0 &&
    (candidate.includeContents === undefined || typeof candidate.includeContents === 'boolean');
}

function isAssetDeleteAction(value: unknown): value is AssetDeleteAction {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.paths) &&
    candidate.paths.length > 0 &&
    candidate.paths.every((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function isAssetWriteAction(value: unknown): value is AssetWriteAction {
  if (typeof value !== 'object' || value === null) return false;
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
  if (typeof value !== 'object' || value === null) return false;
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

async function installWorkbenchAssets(projectRoot: string, action: AssetInstallAction) {
  if (action.source === 'google-fonts') return installGoogleFonts(projectRoot, action);
  return installWorkbenchAssetsFromGit(projectRoot, action);
}

async function installWorkbenchAssetsFromGit(projectRoot: string, action: AssetGitInstallAction) {
  const rawUrl = action.url.trim();
  const parsed = parseGitAssetUrl(rawUrl);
  if (!parsed || !isAllowedGitAssetUrl(parsed.cloneUrl)) {
    throw new Error('Enter an https, ssh, or git@ repository URL.');
  }
  const { cloneUrl, branch, subPath } = parsed;

  const tempRoot = await mkdtemp(join(tmpdir(), 'workbench-assets-'));
  const repoPath = join(tempRoot, 'repo');
  try {
    if (subPath) {
      const cloneArgs = [
        'clone',
        '--depth', '1',
        '--filter=blob:none',
        '--sparse',
        '--no-checkout',
      ];
      if (branch) cloneArgs.push('--branch', branch);
      cloneArgs.push(cloneUrl, repoPath);
      await execFileAsync('git', cloneArgs, {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
      await execFileAsync('git', ['-C', repoPath, 'sparse-checkout', 'init', '--cone'], {
        timeout: 60000,
      });
      await execFileAsync('git', ['-C', repoPath, 'sparse-checkout', 'set', subPath], {
        timeout: 60000,
      });
      await execFileAsync('git', ['-C', repoPath, 'checkout'], {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
    } else {
      const cloneArgs = ['clone', '--depth', '1'];
      if (branch) cloneArgs.push('--branch', branch);
      cloneArgs.push(cloneUrl, repoPath);
      await execFileAsync('git', cloneArgs, {
        maxBuffer: 1024 * 1024 * 8,
        timeout: 120000,
      });
    }

    let scanRoot = repoPath;
    if (subPath) {
      const candidate = resolve(repoPath, subPath);
      const rel = relative(repoPath, candidate);
      if (rel.startsWith('..') || isAbsolute(rel)) {
        throw new Error('Sub-path is outside the cloned repository.');
      }
      try {
        const candidateStats = await stat(candidate);
        if (!candidateStats.isDirectory()) {
          throw new Error('Sub-path is not a directory in the repository.');
        }
        scanRoot = candidate;
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Sub-path')) throw error;
        throw new Error(`Sub-path '${subPath}' not found in repository.`);
      }
    }

    const files = await collectGitAssetFiles(scanRoot, action.kind);
    if (files.length === 0) {
      throw new Error(action.kind === 'icon'
        ? 'No SVG files were found in this repository.'
        : 'No font files were found in this repository.');
    }

    const installed = action.kind === 'icon'
      ? [await installGitIconSet(projectRoot, scanRoot, cloneUrl, action.name, files)]
      : await installGitFonts(projectRoot, scanRoot, cloneUrl, action.name, files);

    return {
      ok: true,
      assets: installed,
    };
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function installGoogleFonts(projectRoot: string, action: AssetGoogleFontInstallAction) {
  const googleFamilyName = action.family.trim().replace(/\s+/g, ' ');
  const familyName = action.name?.trim() || googleFamilyName;
  const weights = normalizeGoogleFontWeights(action.weights);
  const cssUrl = createGoogleFontsCssUrl(googleFamilyName, weights);
  const cssResponse = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Workbench-V1',
    },
  });

  if (!cssResponse.ok) {
    throw new Error(`Google Fonts returned ${cssResponse.status} for ${googleFamilyName}.`);
  }

  const css = await cssResponse.text();
  const faces = parseGoogleFontFaces(css);
  if (faces.length === 0) {
    throw new Error(`No font files were found for ${googleFamilyName}.`);
  }

  const now = new Date().toISOString();
  const familySlug = createSlug(familyName) || `google-font-${Date.now().toString(36)}`;
  const destinationRoot = `${workbenchHost.ASSET_PUBLIC_ROOT}/fonts/${familySlug}-${Date.now().toString(36)}`;
  const fontFaces = [];
  let totalSize = 0;
  let firstSourceValue: string | null = null;
  let firstFileName: string | null = null;

  for (let index = 0; index < faces.length; index += 1) {
    const face = faces[index];
    const fontResponse = await fetch(face.url);
    if (!fontResponse.ok) {
      throw new Error(`Google Fonts file download failed for ${googleFamilyName}.`);
    }

    const buffer = Buffer.from(await fontResponse.arrayBuffer());
    const extension = getFontExtensionFromUrl(face.url);
    const safeFileName = workbenchHost.createSafeAssetFileName(`${familySlug}-${face.weight || 'regular'}-${face.style || 'normal'}-${index}${extension}`);
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await workbenchHost.writeProjectAssetBuffer(projectRoot, buffer, relativeFilePath);
    const sourceValue = `/${relativeFilePath.replace(/^public\//, '')}`;
    firstSourceValue ??= sourceValue;
    firstFileName ??= safeFileName;
    totalSize += buffer.byteLength;

    fontFaces.push({
      filePath: relativeFilePath,
      fontStyle: face.style,
      fontWeight: face.weight,
      mimeType: getFontMimeType(safeFileName),
      source: sourceValue,
      unicodeRange: face.unicodeRange,
    });
  }

  const asset = {
    id: createAssetId(familyName, now),
    name: familyName,
    kind: 'font',
    source: {
      type: 'project-file',
      value: firstSourceValue ?? '',
      filePath: `${destinationRoot}/${firstFileName ?? `${familySlug}.woff2`}`,
    },
    fileName: `${familySlug}.google-font`,
    mimeType: 'font/collection',
    size: totalSize,
    tags: ['font', 'google-fonts'],
    createdAt: now,
    updatedAt: now,
    extensions: {
      fontFaces,
      fontFamily: familyName,
      sourceGoogleCssUrl: cssUrl,
      sourceGoogleFontFamily: googleFamilyName,
    },
  };

  return {
    ok: true,
    assets: [asset],
  };
}

async function searchGoogleFontsCatalog(query: string, limit: number) {
  const normalizedQuery = normalizeGoogleFontSearchText(query);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.round(limit), 1), 96) : 48;
  const catalog = await getGoogleFontsCatalog();
  const matches = normalizedQuery
    ? catalog.fonts
      .filter((font) => doesGoogleFontMatchQuery(font, normalizedQuery))
      .sort((left, right) => compareGoogleFontSearchMatch(left, right, normalizedQuery))
    : getFeaturedGoogleFonts(catalog.fonts);

  return {
    ok: true,
    fonts: matches.slice(0, safeLimit),
    message: catalog.source === 'fallback'
      ? 'Google Fonts metadata could not be reached, so Workbench is showing a small fallback list.'
      : undefined,
    source: catalog.source,
  };
}

async function getGoogleFontsCatalog(): Promise<{ fonts: GoogleFontCatalogItem[]; source: 'fallback' | 'google-fonts' }> {
  const now = Date.now();
  if (googleFontsCatalogCache && googleFontsCatalogCache.expiresAt > now) {
    return {
      fonts: googleFontsCatalogCache.fonts,
      source: googleFontsCatalogCache.source,
    };
  }

  try {
    for (const url of GOOGLE_FONTS_METADATA_URLS) {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 Workbench-V1',
        },
      });
      if (!response.ok) continue;
      const fonts = parseGoogleFontsMetadata(await response.text());
      if (fonts.length === 0) continue;
      googleFontsCatalogCache = {
        expiresAt: now + GOOGLE_FONTS_CACHE_TTL_MS,
        fonts,
        source: 'google-fonts',
      };
      return { fonts, source: 'google-fonts' };
    }
    throw new Error('Google Fonts metadata contained no fonts.');
  } catch {
    const fonts = getFallbackGoogleFontsCatalog();
    googleFontsCatalogCache = {
      expiresAt: now + 1000 * 60 * 5,
      fonts,
      source: 'fallback',
    };
    return { fonts, source: 'fallback' };
  }
}

function parseGoogleFontsMetadata(contents: string): GoogleFontCatalogItem[] {
  const parsed = JSON.parse(contents.replace(/^\)\]\}'\s*/, '').trim()) as unknown;
  if (!isObjectRecord(parsed)) return [];

  const developerApiItems = parsed.items;
  if (Array.isArray(developerApiItems)) {
    return developerApiItems.flatMap((item) => normalizeDeveloperApiGoogleFontItem(item));
  }

  const metadataItems = parsed.familyMetadataList;
  if (Array.isArray(metadataItems)) {
    return metadataItems.flatMap((item) => normalizeMetadataGoogleFontItem(item));
  }

  return [];
}

function normalizeDeveloperApiGoogleFontItem(item: unknown): GoogleFontCatalogItem[] {
  if (!isObjectRecord(item) || typeof item.family !== 'string' || !item.family.trim()) return [];
  const variants = getStringArray(item.variants);
  return [normalizeGoogleFontCatalogItem({
    category: typeof item.category === 'string' ? item.category : undefined,
    family: item.family,
    subsets: getStringArray(item.subsets),
    variants,
    weights: getGoogleFontWeightsFromVariants(variants),
  })];
}

function normalizeMetadataGoogleFontItem(item: unknown): GoogleFontCatalogItem[] {
  if (!isObjectRecord(item) || typeof item.family !== 'string' || !item.family.trim()) return [];
  const fontKeys = isObjectRecord(item.fonts) ? Object.keys(item.fonts) : [];
  const variants = fontKeys.map(formatGoogleFontVariantKey);
  return [normalizeGoogleFontCatalogItem({
    category: typeof item.category === 'string' ? item.category : undefined,
    family: item.family,
    subsets: getStringArray(item.subsets),
    variants,
    weights: getGoogleFontWeightsFromVariants(variants.length > 0 ? variants : fontKeys),
  })];
}

function normalizeGoogleFontCatalogItem(item: GoogleFontCatalogItem): GoogleFontCatalogItem {
  const variants = item.variants.length > 0 ? item.variants : ['regular'];
  const weights = item.weights.length > 0 ? item.weights : getGoogleFontWeightsFromVariants(variants);
  return {
    category: item.category,
    family: item.family.trim(),
    subsets: uniqueStrings(item.subsets).sort((left, right) => left.localeCompare(right)),
    variants: uniqueStrings(variants),
    weights: uniqueStrings(weights.length > 0 ? weights : ['400']).sort((left, right) => Number(left) - Number(right)),
  };
}

function getFallbackGoogleFontsCatalog(): GoogleFontCatalogItem[] {
  return getFallbackGoogleFontTuples().map(([family, category, subsets, variants]) => normalizeGoogleFontCatalogItem({
    category: category as string,
    family: family as string,
    subsets: subsets as string[],
    variants: variants as string[],
    weights: getGoogleFontWeightsFromVariants(variants as string[]),
  }));
}

function getFeaturedGoogleFonts(fonts: GoogleFontCatalogItem[]): GoogleFontCatalogItem[] {
  const byFamily = new Map(fonts.map((font) => [normalizeGoogleFontSearchText(font.family), font]));
  const selected: GoogleFontCatalogItem[] = [];
  const selectedKeys = new Set<string>();

  for (const family of FEATURED_GOOGLE_FONT_FAMILIES) {
    const key = normalizeGoogleFontSearchText(family);
    const font = byFamily.get(key) ?? getFallbackGoogleFontsCatalog().find((candidate) => normalizeGoogleFontSearchText(candidate.family) === key);
    if (!font || selectedKeys.has(key)) continue;
    selected.push(font);
    selectedKeys.add(key);
  }

  if (selected.length > 0) return selected;
  return getFallbackGoogleFontsCatalog();
}

function getFallbackGoogleFontTuples(): Array<[string, string, string[], string[]]> {
  return [
    ['Noto Sans KR', 'sans-serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['Noto Serif KR', 'serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['IBM Plex Sans KR', 'sans-serif', ['korean', 'latin'], ['regular', '500', '700']],
    ['Black Han Sans', 'sans-serif', ['korean', 'latin'], ['regular']],
    ['Gowun Dodum', 'sans-serif', ['korean', 'latin'], ['regular']],
    ['Gowun Batang', 'serif', ['korean', 'latin'], ['regular', '700']],
    ['Inter', 'sans-serif', ['latin'], ['regular', '500', '600', '700']],
    ['Roboto', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Roboto Serif', 'serif', ['latin'], ['regular', '500', '700']],
    ['Open Sans', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Lato', 'sans-serif', ['latin'], ['regular', '700']],
    ['Montserrat', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Poppins', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Source Sans 3', 'sans-serif', ['latin'], ['regular', '500', '700']],
    ['Playfair Display', 'serif', ['latin'], ['regular', '700']],
    ['Merriweather', 'serif', ['latin'], ['regular', '700']],
    ['Source Code Pro', 'monospace', ['latin'], ['regular', '500', '700']],
    ['Roboto Mono', 'monospace', ['latin'], ['regular', '500', '700']],
  ];
}

function doesGoogleFontMatchQuery(font: GoogleFontCatalogItem, normalizedQuery: string): boolean {
  return [
    font.family,
    font.category ?? '',
    ...font.subsets,
  ].some((value) => normalizeGoogleFontSearchText(value).includes(normalizedQuery));
}

function compareGoogleFontSearchMatch(left: GoogleFontCatalogItem, right: GoogleFontCatalogItem, normalizedQuery: string): number {
  const leftFamily = normalizeGoogleFontSearchText(left.family);
  const rightFamily = normalizeGoogleFontSearchText(right.family);
  const leftScore = leftFamily === normalizedQuery ? 0 : leftFamily.startsWith(normalizedQuery) ? 1 : 2;
  const rightScore = rightFamily === normalizedQuery ? 0 : rightFamily.startsWith(normalizedQuery) ? 1 : 2;
  return leftScore - rightScore || left.family.localeCompare(right.family);
}

function normalizeGoogleFontSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function formatGoogleFontVariantKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '400') return 'regular';
  if (/^400(?:italic|i)$/i.test(trimmed)) return 'italic';
  return trimmed.replace(/i$/i, 'italic');
}

function getGoogleFontWeightsFromVariants(variants: string[]): string[] {
  const weights = variants.flatMap((variant) => {
    if (variant === 'regular' || variant === 'italic') return ['400'];
    const match = variant.match(/[1-9]00/);
    return match ? [match[0]] : [];
  });
  return uniqueStrings(weights.length > 0 ? weights : ['400']);
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function collectGitAssetFiles(root: string, kind: AssetGitInstallAction['kind']) {
  const files: Array<{ relativePath: string; size: number }> = [];
  const extensionPattern = kind === 'icon'
    ? /\.svg$/i
    : /\.(?:woff2?|ttf|otf)$/i;

  async function visit(directory: string) {
    if (files.length >= MAX_GIT_ASSET_FILES) return;
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= MAX_GIT_ASSET_FILES) break;
      if (entry.name.startsWith('.') || BLOCKED_GIT_ASSET_PATH_PARTS.has(entry.name)) continue;
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile() || !extensionPattern.test(entry.name)) continue;
      const entryStats = await stat(entryPath);
      files.push({
        relativePath: relative(root, entryPath).replace(/\\/g, '/'),
        size: entryStats.size,
      });
    }
  }

  await visit(root);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function installGitIconSet(
  projectRoot: string,
  repoPath: string,
  gitUrl: string,
  name: string | undefined,
  files: Array<{ relativePath: string; size: number }>,
) {
  const now = new Date().toISOString();
  const setName = name?.trim() || inferGitRepoName(gitUrl) || 'Git icon set';
  const setSlug = createSlug(setName) || `icon-set-${Date.now().toString(36)}`;
  const destinationRoot = `${workbenchHost.ASSET_PUBLIC_ROOT}/icons/${setSlug}-${Date.now().toString(36)}`;
  const previewIcons = [];

  for (const file of files) {
    const sourcePath = join(repoPath, file.relativePath);
    const iconName = formatAssetLabel(basename(file.relativePath).replace(/\.[^.]+$/, ''));
    const iconStyle = inferGitIconStyle(file.relativePath);
    const iconVariant = inferGitIconVariant(file.relativePath);
    const sourceSlug = createSlug(file.relativePath.replace(/\.[^.]+$/, '')) || createSlug(iconName) || 'icon';
    const sourceExtension = basename(file.relativePath).match(/\.[^.]+$/)?.[0] ?? '.svg';
    const safeFileName = workbenchHost.createSafeAssetFileName(`${sourceSlug}${sourceExtension}`);
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await workbenchHost.writeProjectAssetCopy(projectRoot, sourcePath, relativeFilePath);
    previewIcons.push({
      importName: toPascalIdentifier(iconVariant ? `${iconName} ${iconVariant}` : iconName),
      name: iconName,
      sourceFile: file.relativePath,
      style: iconStyle,
      value: `/${relativeFilePath.replace(/^public\//, '')}`,
    });
  }
  previewIcons.sort((left, right) => (
    getGitIconStyleSortOrder(left.style) - getGitIconStyleSortOrder(right.style) ||
    left.name.localeCompare(right.name) ||
    left.sourceFile.localeCompare(right.sourceFile)
  ));

  const firstIcon = previewIcons[0]!;
  return {
    id: createAssetId(setName, now),
    name: setName,
    kind: 'icon',
    source: {
      type: 'project-file',
      value: firstIcon.value,
      filePath: `${destinationRoot}/${basename(firstIcon.value)}`,
    },
    fileName: `${setSlug}.svg-set`,
    mimeType: 'image/svg+xml',
    size: files.reduce((total, file) => total + file.size, 0),
    tags: ['icon', 'git', 'icon-set'],
    createdAt: now,
    updatedAt: now,
    extensions: {
      sourceGitUrl: gitUrl,
      previewIcons,
    },
  };
}

async function installGitFonts(
  projectRoot: string,
  repoPath: string,
  gitUrl: string,
  name: string | undefined,
  files: Array<{ relativePath: string; size: number }>,
) {
  const now = new Date().toISOString();
  const familyName = name?.trim() || inferGitRepoName(gitUrl) || 'Git font';
  const familySlug = createSlug(familyName) || `font-${Date.now().toString(36)}`;
  const destinationRoot = `${workbenchHost.ASSET_PUBLIC_ROOT}/fonts/${familySlug}-${Date.now().toString(36)}`;

  return Promise.all(files.map(async (file) => {
    const sourcePath = join(repoPath, file.relativePath);
    const fileLabel = formatAssetLabel(basename(file.relativePath).replace(/\.[^.]+$/, ''));
    const assetName = files.length === 1 ? familyName : `${familyName} ${fileLabel}`;
    const safeFileName = workbenchHost.createSafeAssetFileName(basename(file.relativePath));
    const relativeFilePath = `${destinationRoot}/${safeFileName}`;
    await workbenchHost.writeProjectAssetCopy(projectRoot, sourcePath, relativeFilePath);
    return {
      id: createAssetId(assetName, now),
      name: assetName,
      kind: 'font',
      source: {
        type: 'project-file',
        value: `/${relativeFilePath.replace(/^public\//, '')}`,
        filePath: relativeFilePath,
      },
      fileName: basename(file.relativePath),
      mimeType: getFontMimeType(file.relativePath),
      size: file.size,
      tags: ['font', 'git'],
      createdAt: now,
      updatedAt: now,
      extensions: {
        fontFamily: familyName,
        sourceGitUrl: gitUrl,
        sourceFile: file.relativePath,
      },
    };
  }));
}

function parseGitAssetUrl(rawUrl: string): { cloneUrl: string; branch: string | null; subPath: string | null } | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^git@[\w.-]+:[\w./-]+(?:\.git)?$/i.test(trimmed) || trimmed.startsWith('ssh://')) {
    return { cloneUrl: trimmed, branch: null, subPath: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segments.length < 2) return null;
  const owner = segments[0];
  const repoPart = segments[1].replace(/\.git$/i, '');

  if (segments.length === 2) {
    return { cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`, branch: null, subPath: null };
  }

  const navKind = segments[2];
  if (navKind === 'tree' || navKind === 'blob') {
    if (segments.length < 4) return null;
    const branch = decodeURIComponent(segments[3]);
    const subPath = segments.slice(4).map((part) => decodeURIComponent(part)).join('/') || null;
    return {
      cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`,
      branch,
      subPath,
    };
  }

  return { cloneUrl: `${parsed.protocol}//${parsed.host}/${owner}/${repoPart}.git`, branch: null, subPath: null };
}

function isAllowedGitAssetUrl(url: string): boolean {
  if (/^git@[\w.-]+:[\w./-]+(?:\.git)?$/i.test(url)) return true;
  if (/^ssh:\/\/[\w.@:/-]+(?:\.git)?$/i.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function inferGitRepoName(url: string): string | null {
  const normalized = url.replace(/\.git$/i, '').replace(/\/+$/, '');
  const name = normalized.split(/[/:]/).filter(Boolean).pop();
  return name ? formatAssetLabel(name) : null;
}

function createAssetId(name: string, now: string): string {
  return `asset-${createSlug(name) || 'asset'}-${Date.parse(now).toString(36)}-${randomUUID().slice(0, 8)}`;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
}

function formatAssetLabel(value: string): string {
  return value
    .split(/[\\/]/)
    .filter(Boolean)
    .pop()!
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Asset';
}

function toPascalIdentifier(value: string): string {
  const identifier = value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
  return /^[A-Za-z]/.test(identifier) ? identifier : `Icon${identifier || 'Asset'}`;
}

function inferGitIconStyle(relativePath: string): string | undefined {
  const segments = getGitIconSourceFolderSegments(relativePath);
  const styleKey = segments.find((segment) => ICON_STYLE_SEGMENTS.has(segment));
  return styleKey ? formatAssetLabel(styleKey) : undefined;
}

function inferGitIconVariant(relativePath: string): string | undefined {
  const segments = getGitIconSourceFolderSegments(relativePath);
  const sizeSegment = segments.find((segment) => /^\d+(?:px)?$/.test(segment));
  const styleSegment = segments.find((segment) => ICON_STYLE_SEGMENTS.has(segment));
  return [sizeSegment, styleSegment].filter(Boolean).map((segment) => formatAssetLabel(segment!)).join(' ') || undefined;
}

function getGitIconSourceFolderSegments(relativePath: string): string[] {
  return relativePath
    .split(/[\\/]/)
    .slice(0, -1)
    .map((segment) => createSlug(segment.replace(/\.[^.]+$/, '')))
    .filter(Boolean);
}

function getGitIconStyleSortOrder(style: string | undefined): number {
  const key = createSlug(style ?? '');
  if (key === 'outline' || key === 'line' || key === 'regular') return 0;
  if (key === 'mini' || key === 'micro') return 1;
  if (key === 'solid' || key === 'fill' || key === 'filled') return 2;
  if (key === 'duotone' || key === 'two-tone' || key === 'twotone') return 3;
  return style ? 4 : 5;
}

const ICON_STYLE_SEGMENTS = new Set([
  'bold',
  'duotone',
  'fill',
  'filled',
  'line',
  'micro',
  'mini',
  'outline',
  'regular',
  'sharp',
  'solid',
  'thin',
  'two-tone',
  'twotone',
]);

function createGoogleFontsCssUrl(family: string, weights: string[]): string {
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', weights.length > 0 ? `${family}:wght@${weights.join(';')}` : family);
  url.searchParams.set('display', 'swap');
  return url.toString();
}

function normalizeGoogleFontWeights(weights: string[] | undefined): string[] {
  const normalized = (weights && weights.length > 0 ? weights : ['400', '500', '600', '700'])
    .map((weight) => weight.trim())
    .filter((weight) => /^[1-9]00$/.test(weight));
  return Array.from(new Set(normalized)).sort((left, right) => Number(left) - Number(right));
}

function parseGoogleFontFaces(css: string): Array<{
  style: string;
  unicodeRange: string | null;
  url: string;
  weight: string;
}> {
  const faces = [];
  const matcher = /@font-face\s*\{([\s\S]*?)\}/gi;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(css))) {
    const body = match[1] ?? '';
    const url = readCssUrlDeclaration(body, 'src');
    if (!url) continue;
    faces.push({
      style: readCssDeclaration(body, 'font-style') ?? 'normal',
      unicodeRange: readCssDeclaration(body, 'unicode-range'),
      url,
      weight: readCssDeclaration(body, 'font-weight') ?? '400',
    });
  }
  return faces;
}

function readCssDeclaration(body: string, property: string): string | null {
  const matcher = new RegExp(`${property}\\s*:\\s*([^;]+);`, 'i');
  const match = matcher.exec(body);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null;
}

function readCssUrlDeclaration(body: string, property: string): string | null {
  const value = readCssDeclaration(body, property);
  const match = value ? /url\((['"]?)([^'")]+)\1\)/i.exec(value) : null;
  return match?.[2] ?? null;
}

function getFontExtensionFromUrl(value: string): string {
  try {
    const extension = new URL(value).pathname.match(/\.(woff2?|ttf|otf)$/i)?.[0];
    return extension ?? '.woff2';
  } catch {
    return '.woff2';
  }
}

function getFontMimeType(filePath: string): string {
  if (/\.woff2$/i.test(filePath)) return 'font/woff2';
  if (/\.woff$/i.test(filePath)) return 'font/woff';
  if (/\.ttf$/i.test(filePath)) return 'font/ttf';
  if (/\.otf$/i.test(filePath)) return 'font/otf';
  return 'font/*';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

  // Imported local libraries own a conventional bundled stylesheet even when
  // their TS/TSX barrels do not import it. The Design canvas eagerly projects
  // these files from the component registry; Browser preview must receive the
  // same CSS modules or valid library components render as unstyled HTML.
  for (const libraryCssPath of await collectProjectLibraryCssFilePaths(projectRoot)) {
    await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, libraryCssPath);
  }

  const sourceCssPath = resolveProjectCssConfigPath(projectRoot, tailwindCssConfig.sourceCss);
  if (compiledCssPath && sourceCssPath) {
    skippedCssFilePaths.add(sourceCssPath);
  }

  if (!compiledCssPath) {
    for (const cssPath of await collectProjectHtmlStylesheetFilePaths(projectRoot)) {
      await addProjectCssModulePath(projectRoot, cssFilePaths, skippedCssFilePaths, cssPath);
    }

    await collectDirectCssImportsFromProjectSourceFiles(
      projectRoot,
      await collectProjectHtmlModuleScriptSourceFiles(projectRoot),
      cssFilePaths,
      skippedCssFilePaths,
    );
  }
  await collectProjectDependencyCssImports(
    projectRoot,
    [
      ...getAppRouteLayoutSourceFiles(sourcePath),
      sourcePath,
    ],
    cssFilePaths,
    skippedCssFilePaths,
  );

  return Array.from(cssFilePaths).map(toViteFileSystemModuleUrl);
}

async function collectProjectLibraryCssFilePaths(projectRoot: string): Promise<string[]> {
  try {
    const configContents = await readFile(
      resolve(projectRoot, '.workbench', 'workbench.config.json'),
      'utf8',
    );
    const config: unknown = JSON.parse(configContents);
    const paths = isObjectRecord(config) && isObjectRecord(config.paths) ? config.paths : null;
    const configuredRegistryPath = typeof paths?.components === 'string'
      ? normalizeProjectPathLoose(paths.components)
      : '.workbench/components.json';
    if (
      !configuredRegistryPath ||
      configuredRegistryPath.split('/').some((part) => !part || part === '.' || part === '..')
    ) {
      return [];
    }
    const registryPath = resolve(projectRoot, configuredRegistryPath);
    if (!isPathInsideDirectory(registryPath, projectRoot)) return [];
    const registry: unknown = JSON.parse(await readFile(registryPath, 'utf8'));
    if (!isObjectRecord(registry) || !isObjectRecord(registry.extensions)) return [];
    const libraries = isObjectRecord(registry.extensions.libraries)
      ? registry.extensions.libraries
      : {};
    const cssFilePaths = new Set<string>();
    for (const value of Object.values(libraries)) {
      if (!isObjectRecord(value)) continue;
      const libraryId = typeof value.id === 'string' ? value.id.trim().toLowerCase() : '';
      const snapshotRoot = typeof value.snapshotRoot === 'string'
        ? normalizeProjectPathLoose(value.snapshotRoot).replace(/\/+$/, '')
        : '';
      const sourcePath = typeof value.sourcePath === 'string'
        ? normalizeProjectPathLoose(value.sourcePath).replace(/\/+$/, '')
        : '';
      if (!/^[a-z][a-z0-9-]*$/.test(libraryId) || !snapshotRoot) continue;
      if (
        snapshotRoot !== `src/libraries/${libraryId}` &&
        sourcePath !== `${snapshotRoot}/components`
      ) {
        continue;
      }
      const cssPath = resolveProjectSourceFilePath(
        projectRoot,
        `${snapshotRoot}/components/${libraryId}.css`,
      );
      if (cssPath && existsSync(cssPath)) cssFilePaths.add(cssPath);
    }
    return [...cssFilePaths];
  } catch {
    return [];
  }
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

async function collectProjectDependencyCssImports(
  projectRoot: string,
  sourceFiles: string[],
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
): Promise<void> {
  const normalizedSourceFiles = Array.from(new Set(sourceFiles.map(normalizeProjectPathLoose).filter(Boolean)));
  await collectDirectCssImportsFromProjectSourceFiles(
    projectRoot,
    normalizedSourceFiles,
    cssFilePaths,
    skippedCssFilePaths,
  );

  const dependencySourceFiles = await collectProjectLocalDependencySourceFiles(projectRoot, normalizedSourceFiles);
  await collectDirectCssImportsFromProjectSourceFiles(
    projectRoot,
    dependencySourceFiles,
    cssFilePaths,
    skippedCssFilePaths,
  );

  const reExportedSourceFiles = await collectProjectLocalDependencySourceFiles(
    projectRoot,
    dependencySourceFiles,
    true,
  );
  await collectDirectCssImportsFromProjectSourceFiles(
    projectRoot,
    reExportedSourceFiles,
    cssFilePaths,
    skippedCssFilePaths,
  );
}

async function collectProjectLocalDependencySourceFiles(
  projectRoot: string,
  sourceFiles: string[],
  reExportsOnly = false,
): Promise<string[]> {
  const dependencySourceFiles = new Set<string>();
  await Promise.all(sourceFiles.map(async (sourceFile) => {
    const filePath = resolveProjectSourceFilePath(projectRoot, sourceFile);
    if (!filePath || !existsSync(filePath)) return;
    let contents: string;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch {
      return;
    }
    const moduleSources = reExportsOnly
      ? getProjectModuleReExportSources(contents)
      : getProjectModuleImportSources(contents);
    await Promise.all(moduleSources.map(async (importSource) => {
      if (!isProjectLocalImportSource(importSource) || /\.css(?:$|[?#])/i.test(importSource)) return;
      const resolved = resolveProjectLocalImportSourcePath(sourceFile, importSource);
      if (!resolved) return;
      const resolvedSourceFile = await resolveProjectSourceModulePath(projectRoot, resolved);
      if (resolvedSourceFile) dependencySourceFiles.add(resolvedSourceFile);
    }));
  }));
  return Array.from(dependencySourceFiles);
}

async function addProjectCssModulePath(
  projectRoot: string,
  cssFilePaths: Set<string>,
  skippedCssFilePaths: Set<string>,
  filePath: string,
): Promise<void> {
  const normalizedFilePath = resolve(filePath);
  if (!isPathInsideDirectory(normalizedFilePath, projectRoot)) return;
  if (skippedCssFilePaths.has(normalizedFilePath)) return;
  if (!existsSync(normalizedFilePath)) return;
  if (cssFilePaths.has(normalizedFilePath)) return;

  cssFilePaths.add(normalizedFilePath);
}

function getProjectModuleImportSources(contents: string): string[] {
  const importSources = new Set<string>();
  const patterns = [
    /\bimport\s*(['"])([^'"\r\n]+)\1/g,
    /\bimport\s+(?:type\s+)?(?:[\w$]+|\*\s+as\s+[\w$]+|\{[^}]*\})(?:\s*,\s*(?:\*\s+as\s+[\w$]+|\{[^}]*\}))?\s+from\s*(['"])([^'"\r\n]+)\1/g,
    /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})(?:\s+as\s+[\w$]+)?\s+from\s*(['"])([^'"\r\n]+)\1/g,
  ];
  for (const pattern of patterns) {
    for (const match of contents.matchAll(pattern)) {
      const source = match[2]?.trim();
      if (source) importSources.add(source);
    }
  }
  return Array.from(importSources);
}

function getProjectModuleReExportSources(contents: string): string[] {
  const sources = new Set<string>();
  const pattern = /\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})(?:\s+as\s+[\w$]+)?\s+from\s*(['"])([^'"\r\n]+)\1/g;
  for (const match of contents.matchAll(pattern)) {
    const source = match[2]?.trim();
    if (source) sources.add(source);
  }
  return Array.from(sources);
}

function isProjectLocalImportSource(importSource: string | undefined): boolean {
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/');
  return rawImport.startsWith('.') ||
    rawImport === '@' ||
    rawImport.startsWith('@/') ||
    (rawImport.startsWith('/') && !rawImport.startsWith('//'));
}

function resolveProjectLocalImportSourcePath(ownerSourceFile: string | undefined, importSource: string | undefined): string | null {
  if (!isProjectLocalImportSource(importSource)) return null;
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
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
  return isPathInsideDirectory(filePath, projectRoot) ? filePath : null;
}

function resolveProjectSourceFilePath(projectRoot: string, sourceFile: string): string | null {
  const normalizedSourceFile = normalizeProjectPathLoose(sourceFile);
  if (!normalizedSourceFile || normalizedSourceFile.split('/').some(isBlockedProjectPathPart)) return null;
  const filePath = resolve(projectRoot, normalizedSourceFile);
  return isPathInsideDirectory(filePath, projectRoot) ? filePath : null;
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
  const relativePath = relative(projectRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return filePath;
}

async function collectProjectHtmlStylesheetFilePaths(projectRoot: string): Promise<string[]> {
  let htmlContents: string;
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
  let htmlContents: string;
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
  const relativePath = relative(projectRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return null;
  return filePath;
}

function toViteFileSystemModuleUrl(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `/@fs${absolutePath.split('/').map((segment, index) => (
    index === 0 ? '' : encodeURIComponent(segment)
  )).join('/')}`;
}

function workbenchProjectRuntimeSourceMapPlugin() {
  return {
    name: 'workbench-project-runtime-source-map',
    enforce: 'post' as const,
    transform(code: string, id: string) {
      const target = getWorkbenchProjectRuntimeSourceMapTarget(id);
      if (!target) return null;

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
          errorRecovery: false,
        });
        const changed = instrumentWorkbenchProjectRuntimeReactCallAst(ast.program, target);
        if (!changed) return null;

        const output = generate(ast, {
          jsescOption: { minimal: true },
          retainLines: true,
        }, code);
        return {
          code: output.code,
          map: output.map ?? null,
        };
      } catch {
        return null;
      }
    },
  };
}

type WorkbenchProjectRuntimeSourceMapTarget = {
  importName: string | null;
  sourceFile: string;
};

type WorkbenchRuntimeComponentBody = t.BlockStatement | t.Expression;

function getWorkbenchProjectRuntimeSourceMapTarget(id: string): WorkbenchProjectRuntimeSourceMapTarget | null {
  const filePath = normalizeViteFsImporterPath(id);
  if (!filePath || !/\.[jt]sx$/i.test(filePath)) return null;
  const projectRoot = activeProjectRoot && isPathInsideDirectory(filePath, activeProjectRoot)
    ? activeProjectRoot
    : inferWorkbenchProjectRootFromImporterPath(filePath);
  if (!projectRoot || !isPathInsideDirectory(filePath, projectRoot)) return null;

  const sourceFile = relative(projectRoot, filePath).replace(/\\/g, '/');
  if (!sourceFile || sourceFile.startsWith('..') || sourceFile.includes('/node_modules/')) return null;
  if (sourceFile.startsWith('src/components/ui/')) return null;

  const query = id.includes('?') ? id.slice(id.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);
  const importName = params.get('wb_import_name')?.trim() || null;
  return { importName, sourceFile };
}

function instrumentWorkbenchProjectRuntimeSourceMapAst(
  program: t.Program,
  target: WorkbenchProjectRuntimeSourceMapTarget,
): boolean {
  const bodies = getWorkbenchRuntimeComponentBodies(program, target);
  let changed = false;
  for (const body of bodies) {
    const jsx = getWorkbenchRuntimeReturnedJsx(body);
    if (!jsx) continue;
    if (instrumentWorkbenchRuntimeJsxRoot(jsx, [], target.sourceFile)) changed = true;
  }
  return changed;
}

function instrumentWorkbenchProjectRuntimeReactCallAst(
  program: t.Program,
  target: WorkbenchProjectRuntimeSourceMapTarget,
): boolean {
  const bodies = getWorkbenchRuntimeComponentBodies(program, target);
  let changed = false;

  for (const body of bodies) {
    const expressions = getWorkbenchRuntimeReturnedExpressions(body);
    for (const expression of expressions) {
      if (instrumentWorkbenchRuntimeReactExpression(expression, [], target.sourceFile) === true) {
        changed = true;
      }
    }
  }

  return changed;
}

function getWorkbenchRuntimeComponentBodies(
  program: t.Program,
  target: WorkbenchProjectRuntimeSourceMapTarget,
): WorkbenchRuntimeComponentBody[] {
  const names = getWorkbenchRuntimeTargetNames(program, target);
  const bodies: WorkbenchRuntimeComponentBody[] = [];

  for (const statement of program.body) {
    collectWorkbenchRuntimeComponentBodiesFromStatement(statement, names, bodies);
  }

  return bodies;
}

function getWorkbenchRuntimeTargetNames(
  program: t.Program,
  target: WorkbenchProjectRuntimeSourceMapTarget,
): Set<string> {
  const names = new Set<string>();
  if (target.importName && target.importName !== 'default' && target.importName !== '*') {
    names.add(target.importName);
  }

  for (const statement of program.body) {
    if (statement.type !== 'ExportNamedDeclaration') continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ExportSpecifier') continue;
      const exportedName = specifier.exported.type === 'Identifier'
        ? specifier.exported.name
        : specifier.exported.value;
      if (target.importName && exportedName !== target.importName) continue;
      const localName = specifier.local.name;
      names.add(localName);
    }
  }

  if (target.importName === 'default') {
    for (const statement of program.body) {
      if (statement.type !== 'ExportDefaultDeclaration') continue;
      const declaration = statement.declaration;
      if (declaration.type === 'Identifier') names.add(declaration.name);
      if ((declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') && declaration.id) {
        names.add(declaration.id.name);
      }
    }
  }

  if (names.size === 0) {
    const fallbackName = getPascalCaseFileName(target.sourceFile);
    if (fallbackName) names.add(fallbackName);
    if (target.sourceFile.endsWith('/page.tsx') || target.sourceFile.endsWith('/page.jsx')) names.add('Page');
  }

  return names;
}

function collectWorkbenchRuntimeComponentBodiesFromStatement(
  statement: t.Statement,
  names: Set<string>,
  bodies: WorkbenchRuntimeComponentBody[],
) {
  if (statement.type === 'ExportDefaultDeclaration') {
    const declaration = statement.declaration;
    if (declaration.type === 'FunctionDeclaration' && declaration.body) {
      bodies.push(declaration.body);
      return;
    }
    const unwrapped = declaration.type === 'CallExpression'
      ? unwrapWorkbenchRuntimeComponentInitializer(declaration)
      : declaration.type === 'ArrowFunctionExpression' || declaration.type === 'FunctionExpression'
        ? declaration
        : null;
    if (unwrapped && isWorkbenchRuntimeFunctionBody(unwrapped)) bodies.push(getWorkbenchRuntimeFunctionBody(unwrapped));
    return;
  }

  if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
    collectWorkbenchRuntimeComponentBodiesFromStatement(statement.declaration, names, bodies);
    return;
  }

  if (statement.type === 'FunctionDeclaration' && statement.id && names.has(statement.id.name)) {
    bodies.push(statement.body);
    return;
  }

  if (statement.type !== 'VariableDeclaration') return;
  for (const declaration of statement.declarations) {
    if (declaration.id.type !== 'Identifier' || !names.has(declaration.id.name) || !declaration.init) continue;
    const initializer = unwrapWorkbenchRuntimeComponentInitializer(declaration.init);
    if (initializer && isWorkbenchRuntimeFunctionBody(initializer)) {
      bodies.push(getWorkbenchRuntimeFunctionBody(initializer));
    }
  }
}

function unwrapWorkbenchRuntimeComponentInitializer(node: t.Expression): t.Expression | null {
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TypeCastExpression') {
    return unwrapWorkbenchRuntimeComponentInitializer(node.expression);
  }
  if (node.type !== 'CallExpression') return node;
  const calleeName = getWorkbenchRuntimeExpressionName(node.callee);
  if (calleeName !== 'memo' && calleeName !== 'forwardRef' && calleeName !== 'React.memo' && calleeName !== 'React.forwardRef') {
    return node;
  }
  const firstArgument = node.arguments[0];
  return firstArgument && firstArgument.type !== 'SpreadElement' ? unwrapWorkbenchRuntimeComponentInitializer(firstArgument as t.Expression) : null;
}

function getWorkbenchRuntimeExpressionName(node: t.Expression | t.V8IntrinsicIdentifier): string {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
    const objectName = node.object.type === 'Identifier' ? node.object.name : '';
    return objectName ? `${objectName}.${node.property.name}` : node.property.name;
  }
  return '';
}

function isWorkbenchRuntimeFunctionBody(node: t.Expression): node is t.ArrowFunctionExpression | t.FunctionExpression {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function getWorkbenchRuntimeFunctionBody(node: t.ArrowFunctionExpression | t.FunctionExpression): WorkbenchRuntimeComponentBody {
  return node.body;
}

function getWorkbenchRuntimeReturnedJsx(body: WorkbenchRuntimeComponentBody): t.JSXElement | t.JSXFragment | null {
  if (body.type === 'JSXElement' || body.type === 'JSXFragment') return body;
  if (body.type !== 'BlockStatement') return null;

  const returns = collectWorkbenchRuntimeReturnStatements(body.body);
  for (const returnStatement of returns) {
    const argument = unwrapWorkbenchRuntimeTransparentExpression(returnStatement.argument);
    if (argument?.type === 'JSXElement' || argument?.type === 'JSXFragment') return argument;
  }
  return null;
}

function getWorkbenchRuntimeReturnedExpressions(body: WorkbenchRuntimeComponentBody): t.Expression[] {
  if (body.type !== 'BlockStatement') {
    const expression = unwrapWorkbenchRuntimeTransparentExpression(body);
    return expression ? [expression] : [];
  }

  const expressions: t.Expression[] = [];
  const returns = collectWorkbenchRuntimeReturnStatements(body.body);
  for (const returnStatement of returns) {
    const expression = unwrapWorkbenchRuntimeTransparentExpression(returnStatement.argument);
    if (expression) expressions.push(expression);
  }
  return expressions;
}

function collectWorkbenchRuntimeReturnStatements(statements: t.Statement[]): t.ReturnStatement[] {
  const returns: t.ReturnStatement[] = [];

  function visit(statement: t.Statement) {
    switch (statement.type) {
      case 'ReturnStatement':
        returns.push(statement);
        break;
      case 'BlockStatement':
        for (const child of statement.body) visit(child);
        break;
      case 'IfStatement':
        visit(statement.consequent);
        if (statement.alternate && statement.alternate.type !== 'FunctionDeclaration') visit(statement.alternate);
        break;
      case 'SwitchStatement':
        for (const switchCase of statement.cases) {
          for (const consequent of switchCase.consequent) visit(consequent);
        }
        break;
      case 'TryStatement':
        visit(statement.block);
        if (statement.handler) visit(statement.handler.body);
        if (statement.finalizer) visit(statement.finalizer);
        break;
      default:
        break;
    }
  }

  for (const statement of statements) visit(statement);
  return returns;
}

function unwrapWorkbenchRuntimeTransparentExpression(
  node: t.ReturnStatement['argument'] | t.Expression,
): t.Expression | null {
  if (!node) return null;
  if (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TypeCastExpression'
  ) {
    return unwrapWorkbenchRuntimeTransparentExpression(node.expression);
  }
  return node;
}

function instrumentWorkbenchRuntimeReactExpression(
  expression: t.Expression,
  path: number[],
  sourceFile: string,
): boolean | 'ignored' {
  const unwrapped = unwrapWorkbenchRuntimeTransparentExpression(expression);
  if (!unwrapped) return 'ignored';

  if (unwrapped.type === 'StringLiteral' || unwrapped.type === 'NumericLiteral' || unwrapped.type === 'BooleanLiteral') {
    return unwrapped.type === 'StringLiteral' && !unwrapped.value.trim() ? 'ignored' : false;
  }

  if (unwrapped.type === 'NullLiteral') return 'ignored';

  if (unwrapped.type === 'ConditionalExpression') {
    const consequent = instrumentWorkbenchRuntimeReactExpression(unwrapped.consequent, path, sourceFile);
    const alternate = instrumentWorkbenchRuntimeReactExpression(unwrapped.alternate, path, sourceFile);
    if (consequent === 'ignored' && alternate === 'ignored') return 'ignored';
    return consequent === true || alternate === true ? true : false;
  }

  if (unwrapped.type === 'LogicalExpression') {
    const right = instrumentWorkbenchRuntimeReactExpression(unwrapped.right, path, sourceFile);
    return right === 'ignored' ? false : right;
  }

  if (unwrapped.type === 'ArrayExpression') {
    return instrumentWorkbenchRuntimeReactChildrenArray(unwrapped, path, sourceFile);
  }

  if (unwrapped.type !== 'CallExpression') return false;
  if (!isWorkbenchRuntimeReactJsxCall(unwrapped)) return false;
  return instrumentWorkbenchRuntimeReactCall(unwrapped, path, sourceFile);
}

function instrumentWorkbenchRuntimeReactCall(
  call: t.CallExpression,
  path: number[],
  sourceFile: string,
): boolean {
  const props = getWorkbenchRuntimeReactCallPropsObject(call);
  if (!props) return false;

  const isFragment = isWorkbenchRuntimeReactFragmentArgument(call.arguments[0]);
  let changed = isFragment ? false : addWorkbenchRuntimePreviewNodeIdProperty(props, path, sourceFile);
  const children = getWorkbenchRuntimeObjectPropertyValue(props, 'children');
  if (!children) return changed;

  const childrenChanged = instrumentWorkbenchRuntimeReactChildrenValue(children, path, sourceFile);
  if (childrenChanged === true) changed = true;
  return changed;
}

function instrumentWorkbenchRuntimeReactChildrenValue(
  value: t.Expression,
  parentPath: number[],
  sourceFile: string,
): boolean | 'ignored' {
  const unwrapped = unwrapWorkbenchRuntimeTransparentExpression(value);
  if (!unwrapped) return 'ignored';

  if (unwrapped.type === 'ArrayExpression') {
    return instrumentWorkbenchRuntimeReactChildrenArray(unwrapped, parentPath, sourceFile);
  }

  return instrumentWorkbenchRuntimeReactExpression(unwrapped, [...parentPath, 0], sourceFile);
}

function instrumentWorkbenchRuntimeReactChildrenArray(
  arrayExpression: t.ArrayExpression,
  parentPath: number[],
  sourceFile: string,
): boolean | 'ignored' {
  let changed = false;
  let childIndex = 0;
  let sawChild = false;

  for (const element of arrayExpression.elements) {
    if (!element || element.type === 'SpreadElement') continue;
    const childChanged = instrumentWorkbenchRuntimeReactExpression(element, [...parentPath, childIndex], sourceFile);
    if (childChanged !== 'ignored') {
      sawChild = true;
      childIndex += 1;
    }
    if (childChanged === true) changed = true;
  }

  return sawChild ? changed : 'ignored';
}

function isWorkbenchRuntimeReactJsxCall(call: t.CallExpression): boolean {
  const calleeName = getWorkbenchRuntimeExpressionName(call.callee);
  return (
    calleeName === 'jsx' ||
    calleeName === 'jsxs' ||
    calleeName === 'jsxDEV' ||
    calleeName === '_jsx' ||
    calleeName === '_jsxs' ||
    calleeName === '_jsxDEV' ||
    calleeName.endsWith('.jsx') ||
    calleeName.endsWith('.jsxs') ||
    calleeName.endsWith('.jsxDEV')
  );
}

function getWorkbenchRuntimeReactCallPropsObject(call: t.CallExpression): t.ObjectExpression | null {
  const props = call.arguments[1];
  if (!props) {
    const nextProps = t.objectExpression([]);
    call.arguments[1] = nextProps;
    return nextProps;
  }

  if (props.type === 'ObjectExpression') return props;
  if (props.type === 'NullLiteral') {
    const nextProps = t.objectExpression([]);
    call.arguments[1] = nextProps;
    return nextProps;
  }

  return null;
}

function addWorkbenchRuntimePreviewNodeIdProperty(
  objectExpression: t.ObjectExpression,
  path: number[],
  sourceFile: string,
): boolean {
  if (hasWorkbenchRuntimeObjectProperty(objectExpression, WORKBENCH_RUNTIME_PREVIEW_NODE_ID_ATTRIBUTE)) {
    return false;
  }

  objectExpression.properties.push(t.objectProperty(
    t.stringLiteral(WORKBENCH_RUNTIME_PREVIEW_NODE_ID_ATTRIBUTE),
    t.stringLiteral(getWorkbenchRuntimePreviewNodeId(sourceFile, path)),
  ));
  return true;
}

function getWorkbenchRuntimeObjectPropertyValue(
  objectExpression: t.ObjectExpression,
  key: string,
): t.Expression | null {
  for (const property of objectExpression.properties) {
    if (property.type !== 'ObjectProperty') continue;
    if (!isWorkbenchRuntimeObjectPropertyKey(property.key, key)) continue;
    return t.isExpression(property.value) ? property.value : null;
  }
  return null;
}

function hasWorkbenchRuntimeObjectProperty(objectExpression: t.ObjectExpression, key: string): boolean {
  return objectExpression.properties.some((property) => (
    property.type === 'ObjectProperty' && isWorkbenchRuntimeObjectPropertyKey(property.key, key)
  ));
}

function isWorkbenchRuntimeObjectPropertyKey(keyNode: t.ObjectProperty['key'], key: string): boolean {
  if (keyNode.type === 'Identifier') return keyNode.name === key;
  if (keyNode.type === 'StringLiteral') return keyNode.value === key;
  return false;
}

function isWorkbenchRuntimeReactFragmentArgument(argument: t.CallExpression['arguments'][number] | undefined): boolean {
  if (!argument || argument.type === 'SpreadElement') return false;
  if (argument.type === 'ArgumentPlaceholder') return false;
  if (argument.type === 'Identifier') return argument.name === 'Fragment';
  return getWorkbenchRuntimeExpressionName(argument).endsWith('.Fragment');
}

function instrumentWorkbenchRuntimeJsxRoot(
  node: t.JSXElement | t.JSXFragment,
  path: number[],
  sourceFile: string,
): boolean {
  return node.type === 'JSXElement'
    ? instrumentWorkbenchRuntimeJsxElement(node, path, sourceFile)
    : instrumentWorkbenchRuntimeJsxFragment(node, path, sourceFile);
}

function instrumentWorkbenchRuntimeJsxElement(
  element: t.JSXElement,
  path: number[],
  sourceFile: string,
): boolean {
  let changed = addWorkbenchRuntimePreviewNodeIdAttribute(element, path, sourceFile);
  let childIndex = 0;
  for (const child of element.children) {
    const childPath = [...path, childIndex];
    const childChanged = instrumentWorkbenchRuntimeJsxChild(
      child,
      childPath,
      sourceFile,
      getWorkbenchRuntimeElementName(element.openingElement.name),
    );
    if (childChanged !== 'ignored') childIndex += 1;
    if (childChanged === true) changed = true;
  }
  return changed;
}

function instrumentWorkbenchRuntimeJsxFragment(
  fragment: t.JSXFragment,
  path: number[],
  sourceFile: string,
): boolean {
  let changed = false;
  let childIndex = 0;
  for (const child of fragment.children) {
    const childPath = [...path, childIndex];
    const childChanged = instrumentWorkbenchRuntimeJsxChild(child, childPath, sourceFile, 'Fragment');
    if (childChanged !== 'ignored') childIndex += 1;
    if (childChanged === true) changed = true;
  }
  return changed;
}

function instrumentWorkbenchRuntimeJsxChild(
  child: t.JSXElement['children'][number],
  path: number[],
  sourceFile: string,
  parentJsxName: string,
): boolean | 'ignored' {
  if (child.type === 'JSXElement') return instrumentWorkbenchRuntimeJsxElement(child, path, sourceFile);
  if (child.type === 'JSXFragment') return instrumentWorkbenchRuntimeJsxFragment(child, path, sourceFile);
  if (child.type === 'JSXText') {
    return isWorkbenchRuntimeEditableJsxText(normalizeWorkbenchRuntimeJsxText(child.value), parentJsxName)
      ? false
      : 'ignored';
  }
  if (child.type !== 'JSXExpressionContainer') return 'ignored';
  return instrumentWorkbenchRuntimeJsxExpression(child.expression, path, sourceFile);
}

function instrumentWorkbenchRuntimeJsxExpression(
  expression: t.JSXExpressionContainer['expression'],
  path: number[],
  sourceFile: string,
): boolean | 'ignored' {
  if (expression.type === 'JSXEmptyExpression') return 'ignored';
  const unwrapped = unwrapWorkbenchRuntimeTransparentExpression(expression);
  if (!unwrapped) return 'ignored';
  if (unwrapped.type === 'JSXElement') return instrumentWorkbenchRuntimeJsxElement(unwrapped, path, sourceFile);
  if (unwrapped.type === 'JSXFragment') return instrumentWorkbenchRuntimeJsxFragment(unwrapped, path, sourceFile);
  if (unwrapped.type === 'ConditionalExpression') {
    const left = instrumentWorkbenchRuntimeJsxExpression(unwrapped.consequent, path, sourceFile);
    const right = instrumentWorkbenchRuntimeJsxExpression(unwrapped.alternate, path, sourceFile);
    return left === true || right === true ? true : false;
  }
  if (unwrapped.type === 'LogicalExpression') {
    const right = instrumentWorkbenchRuntimeJsxExpression(unwrapped.right, path, sourceFile);
    return right === true ? true : false;
  }
  return false;
}

function addWorkbenchRuntimePreviewNodeIdAttribute(
  element: t.JSXElement,
  path: number[],
  sourceFile: string,
): boolean {
  const attributes = element.openingElement.attributes;
  if (attributes.some((attribute) => (
    attribute.type === 'JSXAttribute' &&
    getWorkbenchRuntimeJsxAttributeName(attribute.name) === WORKBENCH_RUNTIME_PREVIEW_NODE_ID_ATTRIBUTE
  ))) {
    return false;
  }
  attributes.push(t.jsxAttribute(
    t.jsxIdentifier(WORKBENCH_RUNTIME_PREVIEW_NODE_ID_ATTRIBUTE),
    t.stringLiteral(getWorkbenchRuntimePreviewNodeId(sourceFile, path)),
  ));
  return true;
}

function getWorkbenchRuntimePreviewNodeId(sourceFile: string, path: number[]): string {
  const serializedPath = path.length > 0 ? path.join('-') : 'root';
  return `source:${sanitizeWorkbenchRuntimePreviewNodeIdSource(sourceFile)}:${serializedPath}`;
}

function sanitizeWorkbenchRuntimePreviewNodeIdSource(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'source';
}

function getWorkbenchRuntimeElementName(
  name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): string {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
  return `${getWorkbenchRuntimeElementName(name.object)}.${name.property.name}`;
}

function getWorkbenchRuntimeJsxAttributeName(name: t.JSXIdentifier | t.JSXNamespacedName): string {
  return name.type === 'JSXIdentifier' ? name.name : `${name.namespace.name}:${name.name.name}`;
}

function normalizeWorkbenchRuntimeJsxText(text: string): string {
  return text
    .replace(/^[ \t]*\r?\n\s*/, '')
    .replace(/\s*\r?\n[ \t]*$/, '')
    .replace(/[ \t]*\r?\n\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

function isWorkbenchRuntimeEditableJsxText(text: string, parentJsxName: string): boolean {
  if (!text) return false;
  if (text.trim()) return true;
  return ['a', 'abbr', 'b', 'button', 'code', 'em', 'i', 'label', 'span', 'strong', 'textarea'].includes(parentJsxName);
}

function getPascalCaseFileName(sourceFile: string): string | null {
  const fileName = basename(sourceFile).replace(/\.[^.]+$/, '');
  const parts = fileName.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('');
}

function getReactRuntimeModuleId(source: string): string | null {
  if (WORKBENCH_REACT_RUNTIME_MODULE_IDS.has(source)) return source;

  const sourcePath = normalizeViteFsImporterPath(source);
  if (!sourcePath || !sourcePath.includes('/node_modules/')) return null;
  const normalizedPath = sourcePath.replace(/\\/g, '/');

  if (normalizedPath.endsWith('/node_modules/react/index.js')) return 'react';
  if (normalizedPath.endsWith('/node_modules/react/jsx-runtime.js')) return 'react/jsx-runtime';
  if (normalizedPath.endsWith('/node_modules/react/jsx-dev-runtime.js')) return 'react/jsx-dev-runtime';
  if (normalizedPath.endsWith('/node_modules/react-dom/index.js')) return 'react-dom';
  if (normalizedPath.endsWith('/node_modules/react-dom/client.js')) return 'react-dom/client';
  if (normalizedPath.endsWith('/node_modules/use-sync-external-store/shim/index.js')) return 'use-sync-external-store/shim';
  if (normalizedPath.endsWith('/node_modules/use-sync-external-store/shim/with-selector.js')) return 'use-sync-external-store/shim/with-selector';

  return null;
}

function getWorkbenchReactRuntimeProxyModuleId(id: string): string | null {
  if (!id.startsWith(WORKBENCH_REACT_RUNTIME_PROXY_PREFIX)) return null;
  const reactRuntimeId = id.slice(WORKBENCH_REACT_RUNTIME_PROXY_PREFIX.length);
  return WORKBENCH_REACT_RUNTIME_MODULE_IDS.has(reactRuntimeId) ? reactRuntimeId : null;
}

function shouldDedupeWorkbenchReactRuntimeImport(
  importerPath: string | null,
  sourcePath: string | null,
): boolean {
  if (sourcePath && isWorkbenchProjectRuntimePath(sourcePath)) return true;
  if (importerPath && isWorkbenchProjectRuntimePath(importerPath)) return true;
  if (importerPath && isWorkbenchProjectRuntimeReactDependencyPath(importerPath)) return true;
  return false;
}

function isWorkbenchProjectRuntimePath(pathname: string): boolean {
  return Boolean(activeProjectRoot && isPathInsideDirectory(pathname, activeProjectRoot));
}

function isWorkbenchProjectRuntimeReactDependencyPath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\\/g, '/');
  if (!normalizedPath.includes('/node_modules/')) return false;
  return WORKBENCH_PROJECT_RUNTIME_REACT_DEPENDENCY_PACKAGES.some((packageName) => (
    normalizedPath.includes(`/node_modules/${packageName}/`) ||
    normalizedPath.endsWith(`/node_modules/${packageName}`)
  ));
}

function getWorkbenchReactRuntimeProxyModule(reactRuntimeId: string): string {
  switch (reactRuntimeId) {
    case 'react':
      return `
const React = globalThis.__WORKBENCH_REACT__;
if (!React) throw new Error('Workbench React runtime is not installed.');
export default React;
export const Children = React.Children;
export const Component = React.Component;
export const Fragment = React.Fragment;
export const Profiler = React.Profiler;
export const PureComponent = React.PureComponent;
export const StrictMode = React.StrictMode;
export const Suspense = React.Suspense;
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
export const act = React.act;
export const cache = React.cache;
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
export const unstable_act = React.unstable_act;
export const use = React.use;
export const useActionState = React.useActionState;
export const useCallback = React.useCallback;
export const useContext = React.useContext;
export const useDebugValue = React.useDebugValue;
export const useDeferredValue = React.useDeferredValue;
export const useEffect = React.useEffect;
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
`;
    case 'react/jsx-runtime':
      return `
const jsxRuntime = globalThis.__WORKBENCH_REACT_JSX_RUNTIME__;
if (!jsxRuntime) throw new Error('Workbench React JSX runtime is not installed.');
export default jsxRuntime;
export const Fragment = jsxRuntime.Fragment;
export const jsx = jsxRuntime.jsx;
export const jsxs = jsxRuntime.jsxs;
`;
    case 'react/jsx-dev-runtime':
      return `
const jsxDevRuntime = globalThis.__WORKBENCH_REACT_JSX_DEV_RUNTIME__;
if (!jsxDevRuntime) throw new Error('Workbench React JSX dev runtime is not installed.');
export default jsxDevRuntime;
export const Fragment = jsxDevRuntime.Fragment;
export const jsxDEV = jsxDevRuntime.jsxDEV;
`;
    case 'react-dom':
      return `
const ReactDOM = globalThis.__WORKBENCH_REACT_DOM__;
if (!ReactDOM) throw new Error('Workbench React DOM runtime is not installed.');
export default ReactDOM;
export const createPortal = ReactDOM.createPortal;
export const findDOMNode = ReactDOM.findDOMNode;
export const flushSync = ReactDOM.flushSync;
export const hydrate = ReactDOM.hydrate;
export const render = ReactDOM.render;
export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode;
export const unstable_batchedUpdates = ReactDOM.unstable_batchedUpdates;
export const version = ReactDOM.version;
`;
    case 'react-dom/client':
      return `
const ReactDOMClient = globalThis.__WORKBENCH_REACT_DOM_CLIENT__;
if (!ReactDOMClient) throw new Error('Workbench React DOM client runtime is not installed.');
export default ReactDOMClient;
export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;
`;
    case 'use-sync-external-store/shim':
      return `
const React = globalThis.__WORKBENCH_REACT__;
if (!React) throw new Error('Workbench React runtime is not installed.');
export const useSyncExternalStore = React.useSyncExternalStore;
export default { useSyncExternalStore };
`;
    case 'use-sync-external-store/shim/with-selector':
      return `
const React = globalThis.__WORKBENCH_REACT__;
if (!React) throw new Error('Workbench React runtime is not installed.');
export function useSyncExternalStoreWithSelector(
  subscribe,
  getSnapshot,
  getServerSnapshot,
  selector,
  isEqual,
) {
  const [getSelection, getServerSelection] = React.useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot;
    let memoizedSelection;
    const isSelectionEqual = isEqual ?? Object.is;
    const memoizedSelector = (nextSnapshot) => {
      if (hasMemo && Object.is(memoizedSnapshot, nextSnapshot)) {
        return memoizedSelection;
      }
      const nextSelection = selector(nextSnapshot);
      if (hasMemo && isSelectionEqual(memoizedSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection;
      }
      hasMemo = true;
      memoizedSnapshot = nextSnapshot;
      memoizedSelection = nextSelection;
      return nextSelection;
    };
    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
    const getServerSnapshotWithSelector = typeof getServerSnapshot === 'function'
      ? () => memoizedSelector(getServerSnapshot())
      : getSnapshotWithSelector;
    return [getSnapshotWithSelector, getServerSnapshotWithSelector];
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);
  return React.useSyncExternalStore(subscribe, getSelection, getServerSelection);
    }
export default { useSyncExternalStoreWithSelector };
`;
    default:
      return '';
  }
}

function normalizeViteFsImporterPath(importer: string): string | null {
  const withoutQuery = importer.split(/[?#]/, 1)[0] ?? '';
  const fsPath = withoutQuery.startsWith('/@fs/')
    ? withoutQuery.slice('/@fs'.length)
    : withoutQuery;

  try {
    const decoded = decodeURIComponent(fsPath).replace(/\\/g, '/');
    return decoded.startsWith('/') ? decoded : resolve(WORKBENCH_ROOT, decoded).replace(/\\/g, '/');
  } catch {
    const normalized = fsPath.replace(/\\/g, '/');
    return normalized.startsWith('/') ? normalized : resolve(WORKBENCH_ROOT, normalized).replace(/\\/g, '/');
  }
}

function resolveProjectRuntimeAliasRoot(importer: string, importerPath: string): string | null {
  if (activeProjectRoot && isPathInsideDirectory(importerPath, activeProjectRoot)) {
    return activeProjectRoot;
  }
  return inferWorkbenchProjectRootFromImporterPath(importerPath);
}

function inferWorkbenchProjectRootFromImporterPath(importerPath: string): string | null {
  let candidate = dirname(importerPath);
  while (candidate && candidate !== dirname(candidate)) {
    const hasWorkbenchConfig = existsSync(join(candidate, '.workbench', 'workbench.config.json'));
    const hasShadcnConfig = existsSync(join(candidate, 'components.json'));
    const hasSrc = existsSync(join(candidate, 'src'));
    if (hasSrc && (hasWorkbenchConfig || hasShadcnConfig)) return candidate;
    candidate = dirname(candidate);
  }
  return null;
}

function isPathInsideDirectory(pathname: string, directory: string): boolean {
  const relativePath = relative(toBoundaryComparablePath(directory), toBoundaryComparablePath(pathname));
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

async function chooseFolder(purpose: FolderDialogAction['purpose']) {
  const prompt = purpose === 'open-project'
    ? 'Choose a Workbench project folder'
    : 'Choose where to create the Workbench project folder';

  try {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      `POSIX path of (choose folder with prompt "${prompt}")`,
    ]);
    return {
      ok: true,
      rootPath: stdout.trim().replace(/\/$/, ''),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Folder selection failed.';
    return {
      ok: false,
      cancelled: message.includes('User canceled'),
      message: message.includes('User canceled') ? 'Folder selection cancelled.' : message,
    };
  }
}
