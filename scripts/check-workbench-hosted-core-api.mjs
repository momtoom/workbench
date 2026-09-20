import { strict as assert } from 'node:assert';
import { handleWorkbenchCoreRequest } from '../server/workbenchCoreApi.js';

const WORKBENCH_HOST = 'workbench-v1-rho.vercel.app';
const WORKBENCH_ORIGIN = `https://${WORKBENCH_HOST}`;

await checkHealth();
await checkAllowedCors();
await checkBlockedCors();
await checkAuthConfig();
await checkBootstrap();
await checkFeatures();
await checkTemplates();
await checkSourceAnalysis();
await checkOperationPlan();

console.log('Workbench hosted core API check passed');

async function checkHealth() {
  const response = await invokeCore('GET', '/api/workbench/health.json', null, {});
  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.protocolVersion, 1);
  assert.equal(response.json.service, 'workbench-hosted-core');
}

async function checkAllowedCors() {
  const response = await invokeCore('GET', '/api/workbench/features', null, {
    host: WORKBENCH_HOST,
    origin: WORKBENCH_ORIGIN,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['access-control-allow-origin'], WORKBENCH_ORIGIN);
}

async function checkBlockedCors() {
  const response = await invokeCore('GET', '/api/workbench/features', null, {
    host: WORKBENCH_HOST,
    origin: 'https://example.com',
  });
  assert.equal(response.statusCode, 403);
}

async function checkAuthConfig() {
  const response = await invokeCore('GET', '/api/workbench/auth/config', null, {
    host: WORKBENCH_HOST,
    origin: WORKBENCH_ORIGIN,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(typeof response.json.auth.enabled, 'boolean');
}

async function checkBootstrap() {
  const response = await invokeCore('POST', '/api/workbench/session/bootstrap', {
    client: {
      shell: 'browser',
      storageKind: 'local-folder',
    },
    project: {
      projectName: 'Core API Check Project',
    },
    protocolVersion: 1,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.mode, 'remote');
  assert.ok(response.json.features.some((feature) => feature.id === 'remote-operation-planning' && feature.enabled));
  assert.ok(response.json.features.some((feature) => feature.id === 'remote-source-write-validation' && feature.enabled));
}

async function checkFeatures() {
  const response = await invokeCore('GET', '/api/workbench/features');
  assert.equal(response.statusCode, 200);
  assert.ok(response.json.some((feature) => feature.id === 'remote-template-catalog' && feature.enabled));
  assert.ok(response.json.some((feature) => feature.id === 'remote-source-write-validation' && feature.enabled));
  assert.ok(response.json.some((feature) => (
    feature.id === 'remote-source-write-required' &&
    feature.enabled === isRemoteSourceWritePlanRequired()
  )));
}

async function checkTemplates() {
  const response = await invokeCore('GET', '/api/workbench/templates');
  assert.equal(response.statusCode, 200);
  assert.ok(response.json.some((template) => template.id === 'hosted-core-message-plan' && template.kind === 'page'));
}

async function checkSourceAnalysis() {
  const response = await invokeCore('POST', '/api/workbench/source/analyze', {
    protocolVersion: 1,
    source: {
      contents: [
        'export function HostedSmokePage() {',
        '  return <main><h1>Hello hosted core</h1><SmokeCard /></main>;',
        '}',
        'function SmokeCard() {',
        '  return <section>Card</section>;',
        '}',
      ].join('\n'),
      preferredComponentNames: ['HostedSmokePage'],
      sourceFile: 'src/workbench-pages/HostedSmokePage.tsx',
    },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.mode, 'remote');
  assert.equal(response.json.analysis.parseable, true);
  assert.equal(response.json.analysis.primaryComponentName, 'HostedSmokePage');
  assert.ok(response.json.analysis.exportedComponents.includes('HostedSmokePage'));
  assert.equal(response.json.analysis.jsx.elements, 3);
  assert.equal(response.json.analysis.jsx.componentInstances, 1);
}

async function checkOperationPlan() {
  const response = await invokeCore('POST', '/api/workbench/operations/plan', {
    intent: 'analyze-selection',
    project: {
      projectName: 'Core API Check Project',
    },
    protocolVersion: 1,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.mode, 'remote');
  assert.ok(response.json.plan.id.startsWith('hosted-plan-'));
  assert.ok(response.json.plan.steps.some((step) => step.kind === 'message' && step.body.includes('analyze-selection')));

  const sourceWriteResponse = await invokeCore('POST', '/api/workbench/operations/plan', {
    constraints: {
      allowAssetWrites: false,
      allowSourceWrites: true,
      maxPatchBytes: 1024,
    },
    intent: 'validate-edit',
    operation: {
      byteLength: 64,
      contentHash: '64:1234',
      kind: 'source.write',
      label: 'Smoke source write',
      sourceFile: 'src/workbench-pages/HostedSmokePage.tsx',
      subjectId: 'hosted-smoke-page',
      subjectKind: 'page',
      subjectName: 'Hosted Smoke Page',
      trigger: 'auto',
    },
    project: {
      projectName: 'Core API Check Project',
    },
    protocolVersion: 1,
  });
  assert.equal(sourceWriteResponse.statusCode, 200);
  assert.equal(sourceWriteResponse.json.ok, true);
  assert.equal(sourceWriteResponse.json.mode, 'remote');
  assert.ok(sourceWriteResponse.json.plan.id.startsWith('hosted-source-write-'));
  assert.ok(sourceWriteResponse.json.plan.summary.includes('HostedSmokePage.tsx'));
}

async function invokeCore(method, url, body = null, headers = {}) {
  const chunks = body ? [Buffer.from(JSON.stringify(body), 'utf8')] : [];
  const request = {
    headers,
    method,
    url,
    async *[Symbol.asyncIterator]() {
      yield* chunks;
    },
  };
  const response = createFakeResponse();
  await handleWorkbenchCoreRequest(request, response, getRoute(url));
  return response.snapshot();
}

function createFakeResponse() {
  const headers = {};
  let statusCode = 200;
  let body = '';
  return {
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    status(nextStatusCode) {
      statusCode = nextStatusCode;
      return this;
    },
    send(nextBody) {
      body = String(nextBody ?? '');
      return this;
    },
    snapshot() {
      let json = null;
      try {
        json = JSON.parse(body);
      } catch {
        json = null;
      }
      return {
        body,
        headers,
        json,
        statusCode,
      };
    },
  };
}

function getRoute(url) {
  if (url.endsWith('/health.json')) return 'health';
  if (url.endsWith('/auth/config')) return 'auth-config';
  if (url.endsWith('/session/bootstrap')) return 'bootstrap';
  if (url.endsWith('/features')) return 'features';
  if (url.endsWith('/templates')) return 'templates';
  if (url.endsWith('/source/analyze')) return 'source-analyze';
  if (url.endsWith('/operations/plan')) return 'plan-operation';
  throw new Error(`Unknown core route: ${url}`);
}

function isRemoteSourceWritePlanRequired() {
  const value = process.env.WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN;
  return typeof value === 'string' && ['1', 'true', 'yes', 'required'].includes(value.trim().toLowerCase());
}
