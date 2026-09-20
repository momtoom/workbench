import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const sources = {
  bridge: await read('host/local-bridge/server.ts'),
  buildInfo: await read('src/domain/core/workbenchBuildInfo.ts'),
  hostPanel: await read('src/features/workbench-shell/ui/HostConnectionPanel.tsx'),
  localPreview: await read('host/local-preview/server.ts'),
  transport: await read('src/domain/project/workbenchHostTransport.ts'),
  vite: await read('vite.config.ts'),
};

const routeContracts = [
  route('GET', 'PROJECT_LOCATION_PATH', '/__workbench/project.json', 'bridge'),
  route('POST', 'PROJECT_LOCATION_PATH', '/__workbench/project.json', 'bridge'),
  route('DELETE', 'PROJECT_LOCATION_PATH', '/__workbench/project.json', 'bridge'),
  route('POST', 'PROJECT_DEPENDENCY_INSTALL_PATH', '/__workbench/project/dependencies/install.json', 'bridge'),
  route('GET', 'PROJECT_GOOGLE_FONTS_PATH', '/__workbench/assets/google-fonts.json', 'bridge'),
  route('GET', 'PROJECT_IMAGE_PROXY_PATH', '/__workbench/image-proxy', 'localPreview'),
  route('GET', 'PROJECT_PREVIEW_MODULE_PATH', '/__workbench/preview/module.json', 'localPreview'),
  route('GET', 'PROJECT_RUNTIME_MODULE_PATH', '/__workbench/preview/source-module.json', 'localPreview'),
  route('POST', 'PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH', '/__workbench/preview/runtime-bundle.json', 'localPreview'),
  route('POST', 'PROJECT_SOURCE_READ_PATH', '/__workbench/source/read.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_IMPORT_TREE_PATH', '/__workbench/source/import-tree.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_WRITE_PATH', '/__workbench/source/write.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_DELETE_PATH', '/__workbench/source/delete.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_MKDIR_PATH', '/__workbench/source/mkdir.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_MOVE_PATH', '/__workbench/source/move.json', 'bridge'),
  route('POST', 'PROJECT_SOURCE_RMDIR_PATH', '/__workbench/source/rmdir.json', 'bridge'),
  route('POST', 'PROJECT_ASSET_WRITE_PATH', '/__workbench/assets/write.json', 'bridge'),
  route('POST', 'PROJECT_ASSET_INSTALL_PATH', '/__workbench/assets/install.json', 'bridge'),
  route('POST', 'PROJECT_ASSET_DELETE_PATH', '/__workbench/assets/delete.json', 'bridge'),
];

for (const contract of routeContracts) {
  assertConstant(sources.vite, contract.constant, contract.path, 'Vite web host');
  assertRouteHandler(sources.vite, contract.method, contract.constant, 'Vite web host');
  const desktopSource = sources[contract.desktopOwner];
  assertConstant(desktopSource, contract.constant, contract.path, `Electron ${contract.desktopOwner}`);
  assertRouteHandler(desktopSource, contract.method, contract.constant, `Electron ${contract.desktopOwner}`);
}

assertSetIncludes(
  sources.transport,
  'BRIDGE_EXACT_ROUTES',
  '/__workbench/project/dependencies/install.json',
  'renderer bridge routing',
);
assertSetIncludes(
  sources.localPreview,
  'BRIDGE_EXACT_ROUTES',
  '/__workbench/project/dependencies/install.json',
  'browser-first gateway bridge proxy',
);
assertSetIncludes(
  sources.transport,
  'PREVIEW_EXACT_ROUTES',
  '/__workbench/preview/runtime-bundle.json',
  'renderer local-preview routing',
);

assertIncludes(
  sources.vite,
  "import * as workbenchHost from './scripts/workbench-local-project-host.mjs';",
  'Vite web host must use the shared project-host operations.',
);
assertIncludes(
  sources.bridge,
  "import * as workbenchHost from '../../scripts/workbench-local-project-host.mjs';",
  'Electron bridge must use the shared project-host operations.',
);
assertIncludes(
  sources.vite,
  "import { compileProjectModule, compileProjectRuntimeBundle } from './host/local-preview/server';",
  'Vite and Electron must use the same project runtime compiler.',
);
assertIncludes(
  sources.vite,
  '__WORKBENCH_BUILD_INFO__: JSON.stringify(WORKBENCH_BUILD_INFO)',
  'Vite must embed the renderer build identity.',
);
assertIncludes(
  sources.vite,
  'process.env.VERCEL_GIT_COMMIT_SHA',
  'Hosted builds must use the deployed Git revision.',
);
assertIncludes(
  sources.buildInfo,
  'getWorkbenchBuildRevisionLabel',
  'The renderer build identity must have a shared display formatter.',
);
assertIncludes(
  sources.hostPanel,
  '<dt>Renderer</dt>',
  'The host panel must display the renderer revision.',
);
assertIncludes(
  sources.hostPanel,
  '<dt>Build</dt>',
  'The host panel must display the renderer build channel.',
);

console.log(`Workbench host parity check passed (${routeContracts.length} route contracts)`);

function route(method, constant, path, desktopOwner) {
  return { method, constant, path, desktopOwner };
}

async function read(relativePath) {
  return readFile(join(repoRoot, relativePath), 'utf8');
}

function assertConstant(source, name, expectedPath, owner) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*['\"]([^'\"]+)['\"]`));
  if (match?.[1] !== expectedPath) {
    fail(`${owner} must define ${name} as ${expectedPath}`);
  }
}

function assertRouteHandler(source, method, constant, owner) {
  const routePattern = new RegExp(
    `request\\.method\\s*===\\s*['\"]${method}['\"]\\s*&&\\s*pathname\\s*===\\s*${constant}`,
  );
  if (!routePattern.test(source)) {
    fail(`${owner} is missing ${method} ${constant}`);
  }
}

function assertSetIncludes(source, setName, expectedPath, owner) {
  const match = source.match(new RegExp(`const\\s+${setName}\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match?.[1]?.includes(`'${expectedPath}'`) && !match?.[1]?.includes(`"${expectedPath}"`)) {
    fail(`${owner} must allow ${expectedPath} through ${setName}`);
  }
}

function assertIncludes(source, expected, message) {
  if (!source.includes(expected)) fail(message);
}

function fail(message) {
  console.error(`Workbench host parity check failed: ${message}`);
  process.exit(1);
}
