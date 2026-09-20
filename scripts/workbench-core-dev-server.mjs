import { createServer } from 'node:http';
import {
  createOperationPlanResponse,
  createSourceAnalysisResponse,
} from '../server/workbenchCoreApi.js';
import {
  createAuthConfigResponse,
  createAuthSessionResponse,
  createGoogleAuthSessionResponse,
  getWorkbenchAuthContext,
  isWorkbenchRequestAuthorized,
} from '../server/workbenchAuth.js';

const host = parseHost(getArgValue('--host') ?? '127.0.0.1');
const port = parsePort(getArgValue('--port') ?? '0');
const allowedOrigins = [
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/localhost:\d+$/,
  ...getArgValues('--allow-origin'),
  ...getArgValues('--origin'),
];

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(port, host, resolve);
});

const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Workbench core dev server did not bind to a TCP port.');
}

const baseUrl = `http://${host}:${address.port}`;
console.log('');
console.log('Workbench hosted core dev server');
console.log(`Core URL: ${baseUrl}`);
console.log('');
console.log(`VITE_WORKBENCH_CORE_URL=${baseUrl} npm run dev`);
console.log('Press Ctrl-C to stop the core dev server.');

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

async function handleRequest(request, response) {
  if (!applyCorsHeaders(request, response)) {
    response.statusCode = 403;
    response.end('Workbench core origin is not allowed');
    return;
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  const pathname = new URL(request.url ?? '/', baseUrl).pathname;

  if (request.method === 'GET' && pathname === '/api/workbench/health.json') {
    sendJson(response, {
      ok: true,
      protocolVersion: 1,
      service: 'workbench-core-dev',
    });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/workbench/session/bootstrap') {
    const body = await readJsonBody(request);
    const authContext = getWorkbenchAuthContext(request);
    sendJson(response, {
      ok: true,
      mode: 'remote',
      protocolVersion: 1,
      features: createFeatures(body?.client?.storageKind, authContext),
    });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/workbench/features') {
    sendJson(response, createFeatures('local-folder', getWorkbenchAuthContext(request)));
    return;
  }

  if (request.method === 'GET' && pathname === '/api/workbench/auth/config') {
    sendJson(response, createAuthConfigResponse());
    return;
  }

  if (request.method === 'GET' && pathname === '/api/workbench/auth/session') {
    sendJson(response, createAuthSessionResponse(request));
    return;
  }

  if (request.method === 'POST' && pathname === '/api/workbench/auth/google') {
    sendJson(response, await createGoogleAuthSessionResponse(await readJsonBody(request)));
    return;
  }

  if (request.method === 'GET' && pathname === '/api/workbench/templates') {
    const authContext = getWorkbenchAuthContext(request);
    if (!isWorkbenchRequestAuthorized(authContext)) {
      response.statusCode = authContext.authenticated ? 403 : 401;
      response.end(authContext.message ?? 'Workbench authentication is required');
      return;
    }
    sendJson(response, [
      {
        description: 'Server catalog sample that returns a message-only plan.',
        id: 'core-dev-message-page',
        kind: 'page',
        name: 'Core dev message page',
      },
    ]);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/workbench/operations/plan') {
    const authContext = getWorkbenchAuthContext(request);
    if (!isWorkbenchRequestAuthorized(authContext)) {
      response.statusCode = authContext.authenticated ? 403 : 401;
      response.end(authContext.message ?? 'Workbench authentication is required');
      return;
    }
    sendJson(response, createOperationPlanResponse(await readJsonBody(request), authContext));
    return;
  }

  if (request.method === 'POST' && pathname === '/api/workbench/source/analyze') {
    const authContext = getWorkbenchAuthContext(request);
    if (!isWorkbenchRequestAuthorized(authContext)) {
      response.statusCode = authContext.authenticated ? 403 : 401;
      response.end(authContext.message ?? 'Workbench authentication is required');
      return;
    }
    sendJson(response, createSourceAnalysisResponse(await readJsonBody(request)));
    return;
  }

  response.statusCode = 404;
  response.end('Workbench core route not found');
}

function createFeatures(storageKind, authContext = null) {
  return [
    {
      enabled: true,
      id: 'remote-operation-planning',
      reason: `Core dev server is active for ${storageKind ?? 'unknown storage'}.`,
    },
    {
      enabled: true,
      id: 'remote-source-write-validation',
      reason: 'Core dev server validates source-write plan metadata.',
    },
    {
      enabled: isRemoteSourceWritePlanRequired(),
      id: 'remote-source-write-required',
      reason: isRemoteSourceWritePlanRequired()
        ? 'Source writes are configured to require hosted core validation.'
        : 'Source writes currently use hosted validation as an advisory gate.',
    },
    {
      enabled: true,
      id: 'remote-template-catalog',
    },
    {
      enabled: true,
      id: 'local-folder-storage',
    },
    ...createAuthFeaturesForDev(authContext),
  ];
}

function createAuthFeaturesForDev(authContext) {
  const enabled = Boolean(process.env.WORKBENCH_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
  return [
    {
      enabled,
      id: 'authenticated-user-gate',
    },
    {
      enabled: Boolean(authContext?.authorized),
      id: 'authorized-user-session',
    },
  ];
}

function isRemoteSourceWritePlanRequired() {
  const value = process.env.WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN;
  return typeof value === 'string' && ['1', 'true', 'yes', 'required'].includes(value.trim().toLowerCase());
}

function applyCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (!isAllowedOrigin(origin)) return false;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-workbench-core-protocol');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Max-Age', '300');
  response.setHeader('Vary', 'Origin');
  return true;
}

function isAllowedOrigin(origin) {
  return allowedOrigins.some((allowedOrigin) => {
    if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
    return allowedOrigin.test(origin);
  });
}

function sendJson(response, payload) {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
    if (rawBody.length > 1024 * 1024) {
      throw new Error('Workbench core request body is too large');
    }
  }
  return rawBody ? JSON.parse(rawBody) : null;
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

function splitCsvValues(value) {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function parseHost(value) {
  const hostValue = value.trim();
  if (hostValue !== '127.0.0.1' && hostValue !== 'localhost') {
    throw new Error('Workbench core dev server only binds to 127.0.0.1 or localhost.');
  }
  return hostValue;
}

function parsePort(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`Invalid --port value: ${value}`);
  }
  return parsed;
}

function shutdown(exitCode) {
  server.close(() => {
    process.exit(exitCode);
  });
}
