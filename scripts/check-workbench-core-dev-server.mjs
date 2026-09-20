import { spawn } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { terminateChildProcess } from './workbench-dev-process-utils.mjs';

const root = process.cwd();
const allowedOrigin = 'http://127.0.0.1:5174';
const blockedOrigin = 'https://example.com';

let coreProcess = null;

try {
  const coreUrl = await startCoreDevServer();

  await checkHealth(coreUrl);
  await checkAllowedCors(coreUrl);
  await checkBlockedCors(coreUrl);
  await checkAuthConfig(coreUrl);
  await checkBootstrap(coreUrl);
  await checkFeatures(coreUrl);
  await checkTemplates(coreUrl);
  await checkSourceAnalysis(coreUrl);
  await checkOperationPlan(coreUrl);

  console.log(`Workbench core dev server check passed on ${coreUrl}`);
} finally {
  await terminateChildProcess(coreProcess);
}

function startCoreDevServer() {
  return new Promise((resolveStart, reject) => {
    coreProcess = spawn(process.execPath, ['scripts/workbench-core-dev-server.mjs', '--port', '0'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let settled = false;
    let stderr = '';

    coreProcess.stdout.setEncoding('utf8');
    coreProcess.stderr.setEncoding('utf8');
    coreProcess.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    coreProcess.stdout.on('data', (chunk) => {
      const match = chunk.match(/Core URL:\s+(http:\/\/[^\s]+)/);
      if (match && !settled) {
        settled = true;
        resolveStart(match[1]);
      }
    });

    coreProcess.on('error', (error) => {
      if (!settled) reject(error);
    });

    coreProcess.on('exit', (code, signal) => {
      if (!settled) {
        reject(new Error(`Workbench core dev server exited with ${signal ?? code}: ${stderr.trim()}`));
      }
    });
  });
}

async function checkHealth(coreUrl) {
  const payload = await getJson(`${coreUrl}/api/workbench/health.json`);
  assert.equal(payload.ok, true);
  assert.equal(payload.protocolVersion, 1);
  assert.equal(payload.service, 'workbench-core-dev');
}

async function checkAllowedCors(coreUrl) {
  const response = await fetch(`${coreUrl}/api/workbench/health.json`, {
    headers: {
      Origin: allowedOrigin,
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
}

async function checkBlockedCors(coreUrl) {
  const response = await fetch(`${coreUrl}/api/workbench/health.json`, {
    headers: {
      Origin: blockedOrigin,
    },
  });
  assert.equal(response.status, 403);
}

async function checkAuthConfig(coreUrl) {
  const payload = await getJson(`${coreUrl}/api/workbench/auth/config`);
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.auth.enabled, 'boolean');
}

async function checkBootstrap(coreUrl) {
  const payload = await postJson(`${coreUrl}/api/workbench/session/bootstrap`, {
    client: {
      storageKind: 'local-folder',
    },
    project: {
      projectName: 'Core Check Project',
    },
  });
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'remote');
  assert.equal(payload.protocolVersion, 1);
  assert.ok(payload.features.some((feature) => feature.id === 'remote-operation-planning' && feature.enabled));
  assert.ok(payload.features.some((feature) => feature.id === 'remote-source-write-validation' && feature.enabled));
}

async function checkFeatures(coreUrl) {
  const payload = await getJson(`${coreUrl}/api/workbench/features`);
  assert.ok(Array.isArray(payload));
  assert.ok(payload.some((feature) => feature.id === 'remote-template-catalog' && feature.enabled));
  assert.ok(payload.some((feature) => feature.id === 'remote-source-write-validation' && feature.enabled));
  assert.ok(payload.some((feature) => (
    feature.id === 'remote-source-write-required' &&
    feature.enabled === isRemoteSourceWritePlanRequired()
  )));
}

async function checkTemplates(coreUrl) {
  const payload = await getJson(`${coreUrl}/api/workbench/templates`);
  assert.ok(Array.isArray(payload));
  assert.ok(payload.some((template) => template.id === 'core-dev-message-page' && template.kind === 'page'));
}

async function checkSourceAnalysis(coreUrl) {
  const payload = await postJson(`${coreUrl}/api/workbench/source/analyze`, {
    protocolVersion: 1,
    source: {
      contents: 'export function CoreDevPage() { return <main><CoreDevCard /></main>; }',
      preferredComponentNames: ['CoreDevPage'],
      sourceFile: 'src/workbench-pages/CoreDevPage.tsx',
    },
  });
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'remote');
  assert.equal(payload.analysis.parseable, true);
  assert.equal(payload.analysis.primaryComponentName, 'CoreDevPage');
  assert.equal(payload.analysis.jsx.componentInstances, 1);
}

async function checkOperationPlan(coreUrl) {
  const payload = await postJson(`${coreUrl}/api/workbench/operations/plan`, {
    intent: 'core-contract-smoke',
    project: {
      projectName: 'Core Check Project',
    },
    protocolVersion: 1,
  });
  assert.equal(payload.ok, true);
  assert.equal(payload.mode, 'remote');
  assert.ok(payload.plan.id.startsWith('hosted-plan-'));
  assert.ok(payload.plan.steps.some((step) => step.kind === 'message' && step.body.includes('core-contract-smoke')));

  const sourceWritePayload = await postJson(`${coreUrl}/api/workbench/operations/plan`, {
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
      label: 'Core dev source write',
      sourceFile: 'src/workbench-pages/CoreDevPage.tsx',
      subjectId: 'core-dev-page',
      subjectKind: 'page',
      subjectName: 'Core Dev Page',
      trigger: 'auto',
    },
    project: {
      projectName: 'Core Check Project',
    },
    protocolVersion: 1,
  });
  assert.equal(sourceWritePayload.ok, true);
  assert.equal(sourceWritePayload.mode, 'remote');
  assert.ok(sourceWritePayload.plan.id.startsWith('hosted-source-write-'));
  assert.ok(sourceWritePayload.plan.summary.includes('CoreDevPage.tsx'));
}

async function getJson(url) {
  const response = await fetch(url);
  await assertOkResponse(response);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: allowedOrigin,
    },
    body: JSON.stringify(body),
  });
  await assertOkResponse(response);
  return response.json();
}

async function assertOkResponse(response) {
  if (response.status === 200) return;
  assert.fail(`Expected 200, received ${response.status}: ${await response.text()}`);
}

function isRemoteSourceWritePlanRequired() {
  const value = process.env.WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN;
  return typeof value === 'string' && ['1', 'true', 'yes', 'required'].includes(value.trim().toLowerCase());
}
