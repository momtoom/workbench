import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const bridgeModulePath = join(root, 'dist-host', 'local-bridge', 'server.js');
const defaultProjectRoot = getDefaultProjectRoot();
const projectRoot = resolve(getArgValue('--project') ?? process.env.WORKBENCH_BRIDGE_PROJECT_ROOT ?? defaultProjectRoot);
const hostedAppUrl = getArgValue('--hosted-url') ?? process.env.WORKBENCH_BRIDGE_HOSTED_URL;
const host = parseBridgeHost(getArgValue('--host') ?? process.env.WORKBENCH_BRIDGE_HOST ?? '127.0.0.1');
const port = parseOptionalPort(getArgValue('--port') ?? process.env.WORKBENCH_BRIDGE_PORT);
const shouldOpen = hasFlag('--open') || process.env.WORKBENCH_BRIDGE_OPEN === '1';
const allowedOrigins = [
  ...getArgValues('--allow-origin'),
  ...getArgValues('--origin'),
  ...getOriginsForHostedUrl(hostedAppUrl),
];

let bridge = null;
let shuttingDown = false;

try {
  await assertCompiledBridgeExists();

  const { startWorkbenchLocalBridge } = await import(pathToFileURL(bridgeModulePath).href);
  bridge = await startWorkbenchLocalBridge({
    allowedOrigins,
    host,
    port,
  });
  const activeProjectRoot = await openProject(bridge, projectRoot);

  const hostedPairingUrl = hostedAppUrl ? createPairingUrl(hostedAppUrl, bridge) : null;
  printBridgeSession({
    allowedOrigins,
    bridge,
    hostedAppUrl,
    hostedPairingUrl,
    projectRoot: activeProjectRoot,
  });

  if (shouldOpen) {
    if (!hostedPairingUrl) {
      console.log('No --hosted-url was provided, so there is no pairing page to open.');
    } else {
      openUrl(hostedPairingUrl);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await shutdown(1);
}

process.on('SIGINT', () => {
  void shutdown(130);
});

process.on('SIGTERM', () => {
  void shutdown(143);
});

await new Promise(() => {});

async function assertCompiledBridgeExists() {
  try {
    await access(bridgeModulePath);
  } catch {
    throw new Error('Compiled bridge was not found. Run npm run workbench:compile-host before starting the launcher.');
  }
}

async function openProject(localBridge, rootPath) {
  const response = await fetch(`${localBridge.url}/__workbench/project.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localBridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'open',
      rootPath,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not open Workbench project ${rootPath}: ${await response.text()}`);
  }

  const location = await response.json();
  if (!location || typeof location.rootPath !== 'string' || !location.rootPath) {
    throw new Error(`Workbench project ${rootPath} opened without a normalized project root.`);
  }
  return location.rootPath;
}

function printBridgeSession({
  allowedOrigins,
  bridge: localBridge,
  hostedAppUrl: hostedUrl,
  hostedPairingUrl,
  projectRoot: rootPath,
}) {
  console.log('');
  console.log('Workbench local bridge launcher');
  console.log(`Project root: ${rootPath}`);
  console.log(`Bridge URL:   ${localBridge.url}`);
  console.log(`Bridge token: ${localBridge.token}`);
  if (hostedUrl) {
    console.log(`Hosted URL:   ${hostedUrl}`);
    console.log(`Hosted Pair:  ${hostedPairingUrl}`);
  }
  if (allowedOrigins.length > 0) {
    console.log(`Allowed web origins: ${[...new Set(allowedOrigins)].join(', ')}`);
  }
  console.log('');
  console.log('Paste the Bridge URL and token into Workbench, or open the Hosted Pair URL.');
  console.log('The bridge token grants local file access for this session. Do not share it.');
  console.log('Press Ctrl-C to stop the bridge.');
}

function getArgValue(name) {
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex !== -1) return process.argv[exactIndex + 1];

  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function getArgValues(name) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === name) {
      const value = process.argv[index + 1];
      if (value && !value.startsWith('--')) values.push(value);
      continue;
    }

    const prefix = `${name}=`;
    if (arg?.startsWith(prefix)) values.push(arg.slice(prefix.length));
  }
  return values.flatMap(splitCsvValues).map((value) => value.trim()).filter(Boolean);
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function splitCsvValues(value) {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function getOriginsForHostedUrl(url) {
  if (!url) return [];
  try {
    return [new URL(url).origin];
  } catch {
    throw new Error(`Invalid --hosted-url value: ${url}`);
  }
}

function parseOptionalPort(value) {
  if (!value) return undefined;
  const portValue = Number(value);
  if (!Number.isInteger(portValue) || portValue < 0 || portValue > 65535) {
    throw new Error(`Invalid --port value: ${value}`);
  }
  return portValue;
}

function parseBridgeHost(value) {
  const hostValue = value.trim();
  if (hostValue !== '127.0.0.1' && hostValue !== 'localhost') {
    throw new Error('Workbench bridge launcher only binds to 127.0.0.1 or localhost.');
  }
  return hostValue;
}

function getDefaultProjectRoot() {
  const designopsProjectRoot = join(root, 'projects', 'DESIGNOPS2');
  return existsSync(designopsProjectRoot) ? designopsProjectRoot : root;
}

function createPairingUrl(hostedUrl, localBridge) {
  const url = new URL(hostedUrl);
  url.searchParams.set('workbenchBridgeUrl', localBridge.url);
  url.searchParams.set('workbenchBridgeToken', localBridge.token);
  return url.toString();
}

function openUrl(url) {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  bridge?.close();
  bridge = null;
  process.exit(exitCode);
}
