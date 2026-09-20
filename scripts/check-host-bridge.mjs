import { startWorkbenchLocalBridge } from '../dist-host/local-bridge/server.js';
import { rotateWorkbenchLocalBridgeToken } from '../dist-host/local-bridge/client.js';
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const ALLOWED_TEST_ORIGIN = 'https://workbench.example.test';
process.env.WORKBENCH_SKIP_PROJECT_INSTALL = '1';

const tempProjectRoot = await createTempWorkbenchProject();
const tempTailwindProjectRoot = await createTempTailwindWorkbenchProject();
const activeProjectRootChanges = [];
const bridge = await startWorkbenchLocalBridge({
  allowedOrigins: [ALLOWED_TEST_ORIGIN],
  chooseFolder: async () => ({
    ok: true,
    rootPath: tempProjectRoot,
  }),
  onActiveProjectRootChange: (rootPath) => {
    activeProjectRootChanges.push(rootPath);
  },
});

try {
  const health = await fetch(`${bridge.url}/__workbench-bridge/health.json`);
  if (!health.ok) {
    throw new Error(`Health check failed with ${health.status}`);
  }

  const unauthenticatedCapabilities = await fetch(`${bridge.url}/__workbench-bridge/capabilities.json`);
  if (unauthenticatedCapabilities.status !== 401) {
    throw new Error(`Capabilities should require a token, got ${unauthenticatedCapabilities.status}`);
  }

  const capabilities = await fetch(`${bridge.url}/__workbench-bridge/capabilities.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
  });
  if (!capabilities.ok) {
    throw new Error(`Authorized capabilities check failed with ${capabilities.status}`);
  }

  const payload = await capabilities.json();
  if (payload.protocolVersion !== 1 || !Array.isArray(payload.capabilities)) {
    throw new Error('Capabilities payload is not shaped like a Workbench bridge response');
  }
  if (!payload.capabilities.includes('project.folder-picker')) {
    throw new Error('Capabilities payload does not include the folder picker capability');
  }
  if (!payload.capabilities.includes('bridge.token-rotation')) {
    throw new Error('Capabilities payload does not include the token rotation capability');
  }
  if (!payload.capabilities.includes('bridge.project-events')) {
    throw new Error('Capabilities payload does not include the project events capability');
  }
  if (!payload.capabilities.includes('project.preview-css-freshness')) {
    throw new Error('Capabilities payload does not include preview CSS freshness');
  }
  if (!payload.capabilities.includes('project.close')) {
    throw new Error('Capabilities payload does not include the project close capability');
  }

  const allowedOriginCapabilities = await fetch(`${bridge.url}/__workbench-bridge/capabilities.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      Origin: ALLOWED_TEST_ORIGIN,
    },
  });
  if (!allowedOriginCapabilities.ok) {
    throw new Error(`Allowed origin capabilities check failed with ${allowedOriginCapabilities.status}`);
  }
  if (allowedOriginCapabilities.headers.get('access-control-allow-origin') !== ALLOWED_TEST_ORIGIN) {
    throw new Error('Allowed origin did not receive the expected CORS allow-origin header');
  }

  const blockedOriginCapabilities = await fetch(`${bridge.url}/__workbench-bridge/capabilities.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      Origin: 'https://not-workbench.example.test',
    },
  });
  if (blockedOriginCapabilities.status !== 403) {
    throw new Error(`Unlisted origin should be blocked, got ${blockedOriginCapabilities.status}`);
  }

  const oldToken = bridge.token;
  const rotationPayload = await rotateWorkbenchLocalBridgeToken(bridge);
  if (
    rotationPayload.protocolVersion !== 1 ||
    typeof rotationPayload.token !== 'string' ||
    rotationPayload.token === oldToken ||
    bridge.token !== rotationPayload.token
  ) {
    throw new Error('Token rotation payload did not expose a fresh active bridge token');
  }

  const staleTokenCapabilities = await fetch(`${bridge.url}/__workbench-bridge/capabilities.json`, {
    headers: {
      Authorization: `Bearer ${oldToken}`,
    },
  });
  if (staleTokenCapabilities.status !== 401) {
    throw new Error(`Old bridge token should be rejected after rotation, got ${staleTokenCapabilities.status}`);
  }

  const folder = await fetch(`${bridge.url}/__workbench/folder-dialog.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purpose: 'open-project',
    }),
  });
  if (!folder.ok) {
    throw new Error(`Folder picker check failed with ${folder.status}: ${await folder.text()}`);
  }

  const folderPayload = await folder.json();
  if (folderPayload.rootPath !== tempProjectRoot) {
    throw new Error('Folder picker payload did not return the injected temp project root');
  }

  const openProject = await fetch(`${bridge.url}/__workbench/project.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'open',
      rootPath: process.cwd(),
    }),
  });
  if (!openProject.ok) {
    throw new Error(`Project open check failed with ${openProject.status}: ${await openProject.text()}`);
  }

  const location = await openProject.json();
  if (location.source !== 'local-bridge' || location.rootPath !== process.cwd()) {
    throw new Error('Project location did not round-trip through the local bridge');
  }
  if (activeProjectRootChanges.at(-1) !== process.cwd()) {
    throw new Error('Project root change callback did not receive the opened project root');
  }

  await verifyInvalidWorkbenchProjectRejected(bridge, process.cwd(), activeProjectRootChanges);

  const config = await fetch(`${bridge.url}/__workbench/files/.workbench/workbench.config.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
  });
  if (!config.ok) {
    throw new Error(`Project config read check failed with ${config.status}`);
  }

  const configPayload = await config.json();
  if (configPayload.workbench?.app !== 'workbench-v1') {
    throw new Error('Project config payload did not look like a Workbench V1 project');
  }

  const sourceRead = await fetch(`${bridge.url}/__workbench/source/read.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'src/main.tsx',
    }),
  });
  if (!sourceRead.ok) {
    throw new Error(`Source read check failed with ${sourceRead.status}: ${await sourceRead.text()}`);
  }

  const sourcePayload = await sourceRead.json();
  if (!sourcePayload.contents?.includes('ReactDOM.createRoot')) {
    throw new Error('Source read payload did not contain the expected app entry');
  }

  await verifyTempProjectCreate(bridge);
  await verifyNestedProjectOpen(bridge, activeProjectRootChanges);
  await verifyTempProjectIo(bridge, tempProjectRoot);
  await verifyEditableAuthoringGateway(bridge, tempProjectRoot);
  await verifyTailwindPreviewCssFreshness(bridge, tempTailwindProjectRoot);
  await verifyProjectClose(bridge, activeProjectRootChanges);

  console.log(`Workbench bridge check passed on ${bridge.url}`);
} finally {
  bridge.close();
  await rm(tempProjectRoot, { force: true, recursive: true });
  await rm(tempTailwindProjectRoot, { force: true, recursive: true });
}

async function verifyProjectClose(bridge, activeProjectRootChanges) {
  const closeResult = await fetch(`${bridge.url}/__workbench/project.json`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
  });
  if (!closeResult.ok) {
    throw new Error(`Project close check failed with ${closeResult.status}: ${await closeResult.text()}`);
  }
  if (activeProjectRootChanges.at(-1) !== null) {
    throw new Error('Project root change callback did not receive the closed project state');
  }

  const activeProjectResult = await fetch(`${bridge.url}/__workbench/project.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
  });
  if (!activeProjectResult.ok) {
    throw new Error(`Closed project read failed with ${activeProjectResult.status}: ${await activeProjectResult.text()}`);
  }
  const activeProject = await activeProjectResult.json();
  if (activeProject.rootPath !== null) {
    throw new Error('Closed project should not retain an active root path');
  }
}

async function createTempWorkbenchProject() {
  const root = await mkdtemp(join(tmpdir(), 'workbench-bridge-'));
  await writeTempWorkbenchProjectFiles(root, {
    projectId: 'bridge-test',
    projectName: 'Bridge Test',
  });
  return root;
}

async function createTempTailwindWorkbenchProject() {
  const root = await mkdtemp(join(tmpdir(), 'workbench-bridge-tailwind-'));
  await writeTempWorkbenchProjectFiles(root, {
    projectId: 'bridge-tailwind-test',
    projectName: 'Bridge Tailwind Test',
  });
  const configPath = join(root, '.workbench', 'workbench.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.paths.tokenCss = 'src/workbench-tokens.css';
  config.extensions = {
    projectTemplate: { id: 'tailwind', name: 'React + Tailwind' },
    tailwind: {
      enabled: true,
      provider: 'tailwind',
      style: null,
      sourceCss: 'src/index.css',
      compiledCss: 'src/workbench-tailwind.css',
      tokenCss: 'src/workbench-tokens.css',
    },
  };
  await writeJson(configPath, config);
  await writeJson(join(root, 'package.json'), {
    name: 'bridge-tailwind-test',
    private: true,
    dependencies: { tailwindcss: '4.0.0' },
  });
  await writeFile(join(root, 'src', 'index.css'), ':root { --background: #ffffff; --foreground: #111111; }\n', 'utf8');
  await writeFile(join(root, 'src', 'Page.tsx'), 'export function Page() { return <main className="grid">seed</main>; }\n', 'utf8');
  return root;
}

async function writeTempWorkbenchProjectFiles(root, { projectId, projectName }) {
  await mkdir(join(root, '.workbench'), { recursive: true });
  await mkdir(join(root, 'src'), { recursive: true });
  await writeJson(join(root, '.workbench', 'workbench.config.json'), {
    schemaVersion: '0.1',
    projectId,
    projectName,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    workbench: {
      app: 'workbench-v1',
      devCommand: 'npm run dev',
      installMode: 'local-project',
    },
    paths: {
      comments: '.workbench/comments.json',
      components: '.workbench/components.json',
      pages: '.workbench/pages.json',
      selection: '.workbench/selection.json',
      tokens: '.workbench/tokens.json',
      workspaceState: '.workbench/workspace-state.json',
    },
    capabilities: {
      codexDesktopPreview: true,
      localFiles: true,
      optionalCloudSync: false,
    },
    extensions: {},
  });
  await writeJson(join(root, '.workbench', 'selection.json'), {
    schemaVersion: '0.1',
    activeTarget: null,
    selectedTargets: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    extensions: {},
  });
  await writeJson(join(root, '.workbench', 'components.json'), {
    schemaVersion: '0.1',
    components: [
      {
        id: 'component-bridge-button',
        name: 'BridgeButton',
        sourceFile: 'src/components/ui/BridgeButton.tsx',
        componentSetId: 'component-set-local',
        variants: [],
        extensions: {
          importName: 'BridgeButton',
          sourceExportName: 'BridgeButton',
          childrenSlotKind: 'inline',
          authoring: {
            roles: ['control.action'],
            nativeReplacements: ['button'],
          },
        },
      },
    ],
    extensions: {},
  });
  await writeJson(join(root, '.workbench', 'tokens.json'), {
    schemaVersion: '0.1',
    collections: [],
    extensions: {},
  });
  await writeJson(join(root, '.workbench', 'pages.json'), {
    schemaVersion: '0.1',
    pages: [
      {
        id: 'page-bridge',
        name: 'Bridge Page',
        route: '/bridge',
        sourceFile: 'src/BridgePage.tsx',
        rootNodeId: 'root-bridge',
        status: 'draft',
      },
    ],
    extensions: {},
  });
  await writeFile(join(root, 'src', 'BridgePage.tsx'), 'export function BridgePage() {\n  return <div>before</div>;\n}\n', 'utf8');
  await mkdir(join(root, 'src', 'components', 'ui'), { recursive: true });
  await writeFile(join(root, 'src', 'components', 'ui', 'BridgeButton.tsx'), 'export function BridgeButton() {\n  return <button>bridge</button>;\n}\n', 'utf8');
}

async function verifyEditableAuthoringGateway(bridge, tempRoot) {
  const unauthenticated = await fetch(`${bridge.url}/__workbench/authoring/components.json`);
  if (unauthenticated.status !== 401) {
    throw new Error(`Authoring catalog should require its scoped token, got ${unauthenticated.status}`);
  }

  const bridgeTokenCatalog = await fetch(`${bridge.url}/__workbench/authoring/components.json`, {
    headers: { Authorization: `Bearer ${bridge.token}` },
  });
  if (bridgeTokenCatalog.status !== 401) {
    throw new Error(`General bridge token should not authorize authoring, got ${bridgeTokenCatalog.status}`);
  }

  const authoringRawWrite = await fetch(`${bridge.url}/__workbench/source/write.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'src/AuthoringBypass.tsx', contents: 'export const bypass = true;\n', overwrite: true }),
  });
  if (authoringRawWrite.status !== 401) {
    throw new Error(`Authoring token should not authorize raw source writes, got ${authoringRawWrite.status}`);
  }

  const contextResponse = await fetch(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectTarget: {
        projectId: 'bridge-test',
        projectName: 'Bridge Test',
        rootPath: tempRoot,
        evidence: { source: 'project', reference: 'Electron bridge fixture project.' },
      },
      brief: { experienceType: 'screen' },
    }),
  });
  if (!contextResponse.ok) {
    throw new Error(`Editable authoring context failed with ${contextResponse.status}: ${await contextResponse.text()}`);
  }
  const contextPayload = await contextResponse.json();
  if (contextPayload.projectBinding?.projectId !== 'bridge-test' || contextPayload.procedure?.length !== 6) {
    throw new Error('Editable authoring did not bind the requested project or expose the practical procedure');
  }
  if (contextPayload.procedure?.[1]?.id !== 'product-thinking' || contextPayload.procedure?.[3]?.id !== 'design-identity') {
    throw new Error('Editable authoring procedure lost the default design-effort steps');
  }

  const catalogResponse = await fetch(`${bridge.url}/__workbench/authoring/components.json?roles=control.action`, {
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'X-Workbench-Authoring-Project-Id': 'bridge-test' },
  });
  if (!catalogResponse.ok) {
    throw new Error(`Editable authoring catalog failed with ${catalogResponse.status}: ${await catalogResponse.text()}`);
  }
  const catalog = await catalogResponse.json();
  if (!catalog.components?.some((component) => component.id === 'component-bridge-button')) {
    throw new Error('Editable authoring catalog did not return the optional BridgeButton component');
  }

  await mkdir(join(tempRoot, 'src', 'workbench-pages'), { recursive: true });
  const planResponse = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'X-Workbench-Authoring-Project-Id': 'bridge-test', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageName: 'Editable Bridge Page',
      route: '/editable-bridge',
      sourceFile: 'src/workbench-pages/EditableBridgePage.tsx',
      exportName: 'EditableBridgePage',
    }),
  });
  if (!planResponse.ok) {
    throw new Error(`Editable authoring plan failed with ${planResponse.status}: ${await planResponse.text()}`);
  }
  const planPayload = await planResponse.json();
  if (!planPayload.plan?.id || planPayload.plan.requirementsId !== null || planPayload.plan.approvedPromptId !== null) {
    throw new Error('Editable authoring plan unexpectedly required design evidence or approval');
  }

  const applyResponse = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'X-Workbench-Authoring-Project-Id': 'bridge-test', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: planPayload.plan.id,
      root: {
        kind: 'element',
        tag: 'main',
        purpose: 'layout',
        props: { className: 'grid gap-4' },
        children: [
          { kind: 'element', tag: 'p', purpose: 'content', children: [{ kind: 'text', value: 'Native editable copy' }] },
          {
            kind: 'element',
            tag: 'button',
            purpose: 'semantic',
            intent: 'control.action',
            props: { type: 'button' },
            children: [{ kind: 'text', value: 'Continue' }],
          },
        ],
      },
    }),
  });
  if (!applyResponse.ok) {
    throw new Error(`Editable authoring apply failed with ${applyResponse.status}: ${await applyResponse.text()}`);
  }
  const applyPayload = await applyResponse.json();
  if (!applyPayload.verification?.ok || applyPayload.visualQualityGate?.required !== false) {
    throw new Error('Editable authoring still required the legacy visual-quality gate');
  }
  const source = await readFile(join(tempRoot, 'src', 'workbench-pages', 'EditableBridgePage.tsx'), 'utf8');
  if (!source.includes('<button') || source.includes('BridgeButton')) {
    throw new Error('Native primitive was replaced merely because a registered component exists');
  }

  const verifyResponse = await fetch(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'X-Workbench-Authoring-Project-Id': 'bridge-test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ exportName: 'EditableBridgePage', sourceFile: 'src/workbench-pages/EditableBridgePage.tsx' }),
  });
  if (!verifyResponse.ok) {
    throw new Error(`Editable authoring verify failed with ${verifyResponse.status}: ${await verifyResponse.text()}`);
  }
  const verification = await verifyResponse.json();
  if (!verification.ok || verification.editabilityContract?.version !== 'editable-v1') {
    throw new Error('Editable authoring verification did not finish without evidence or approval');
  }
}

async function verifyStructuredAuthoringGateway(bridge, tempRoot) {
  const unauthenticated = await fetch(`${bridge.url}/__workbench/authoring/components.json`);
  if (unauthenticated.status !== 401) {
    throw new Error(`Structured authoring catalog should require its scoped token, got ${unauthenticated.status}`);
  }

  const bridgeTokenCatalog = await fetch(`${bridge.url}/__workbench/authoring/components.json`, {
    headers: { Authorization: `Bearer ${bridge.token}` },
  });
  if (bridgeTokenCatalog.status !== 401) {
    throw new Error(`General bridge token should not authorize structured authoring, got ${bridgeTokenCatalog.status}`);
  }

  const authoringRawWrite = await fetch(`${bridge.url}/__workbench/source/write.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: 'src/AuthoringBypass.tsx',
      contents: 'export const bypass = true;\n',
      overwrite: true,
    }),
  });
  if (authoringRawWrite.status !== 401) {
    throw new Error(`Authoring token should not authorize raw source writes, got ${authoringRawWrite.status}`);
  }

  const catalogResponse = await fetch(`${bridge.url}/__workbench/authoring/components.json?roles=control.action`, {
    headers: { Authorization: `Bearer ${bridge.authoringToken}` },
  });
  if (!catalogResponse.ok) {
    throw new Error(`Structured authoring catalog failed with ${catalogResponse.status}: ${await catalogResponse.text()}`);
  }
  const catalog = await catalogResponse.json();
  if (!catalog.components?.some((component) => component.id === 'component-bridge-button')) {
    throw new Error('Structured authoring catalog did not return the registered BridgeButton');
  }

  const contextResponse = await fetch(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief: createBridgeReadyBrief() }),
  });
  if (!contextResponse.ok) {
    throw new Error(`Structured authoring design context failed with ${contextResponse.status}: ${await contextResponse.text()}`);
  }
  const contextPayload = await contextResponse.json();
  if (contextPayload.briefReadiness?.status !== 'ready') {
    throw new Error('Structured authoring design context did not accept the complete high-impact brief');
  }

  const requirementsResponse = await fetch(`${bridge.url}/__workbench/authoring/requirements/confirm.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(createBridgeRequirementsConfirmation(contextPayload.revision)),
  });
  if (!requirementsResponse.ok) {
    throw new Error(`Structured authoring requirements confirmation failed with ${requirementsResponse.status}: ${await requirementsResponse.text()}`);
  }
  const requirementsPayload = await requirementsResponse.json();
  if (!requirementsPayload.requirements?.id) {
    throw new Error('Structured authoring requirements confirmation did not return a requirementsId');
  }

  const executionPromptResponse = await fetch(`${bridge.url}/__workbench/authoring/execution-prompt.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirementsId: requirementsPayload.requirements.id,
      pageName: 'Structured Page', route: '/structured', sourceFile: 'src/workbench-pages/StructuredPage.tsx',
      compositionApproach: 'One direct task surface with a strict primary action hierarchy.',
      contentOutline: ['Task context', 'Continue action', 'Blocked-state explanation'],
      interactionOutline: ['Continue is primary; task context remains supporting.'],
      responsiveOutline: ['Wide keeps action first.', 'Compact stacks action before context.'],
      authoringConstraints: ['Explicit JSX and registered components only.'],
    }),
  });
  if (!executionPromptResponse.ok) throw new Error(`Structured authoring prompt preparation failed with ${executionPromptResponse.status}: ${await executionPromptResponse.text()}`);
  const executionPromptPayload = await executionPromptResponse.json();
  if (!executionPromptPayload.executionPrompt?.prompt?.includes('Do not generate design images')) throw new Error('Structured authoring prompt did not prefer source composition over automatic image generation');

  const promptApprovalResponse = await fetch(`${bridge.url}/__workbench/authoring/execution-prompt/confirm.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptId: executionPromptPayload.executionPrompt.id, approvalEvidence: { source: 'user', reference: 'Bridge test user approved the exact prompt.' } }),
  });
  if (!promptApprovalResponse.ok) throw new Error(`Structured authoring prompt approval failed with ${promptApprovalResponse.status}: ${await promptApprovalResponse.text()}`);
  const promptApprovalPayload = await promptApprovalResponse.json();

  const planResponse = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requirementsId: requirementsPayload.requirements.id,
      approvedPromptId: promptApprovalPayload.approval.id,
      pageName: 'Structured Page',
      route: '/structured',
      sourceFile: 'src/workbench-pages/StructuredPage.tsx',
      exportName: 'StructuredPage',
      intents: ['control.action'],
      ...createBridgeDesignContract(),
    }),
  });
  if (!planResponse.ok) {
    throw new Error(`Structured authoring plan failed with ${planResponse.status}: ${await planResponse.text()}`);
  }
  const planPayload = await planResponse.json();
  if (!planPayload.plan?.id || !planPayload.componentMatches?.[0]?.components?.some((component) => component.id === 'component-bridge-button')) {
    throw new Error('Structured authoring plan did not bind the requested action intent to BridgeButton');
  }

  const rejectedNativeButton = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: planPayload.plan.id,
      root: {
        kind: 'element',
        tag: 'button',
        purpose: 'semantic',
        children: [{ kind: 'text', value: 'Bypass' }],
      },
    }),
  });
  if (rejectedNativeButton.status !== 400) {
    throw new Error(`Structured authoring should reject native button replacement, got ${rejectedNativeButton.status}`);
  }
  const rejectedPayload = await rejectedNativeButton.json();
  if (!rejectedPayload.violations?.some((violation) => violation.code === 'WB-AUTH-NATIVE-REPLACED')) {
    throw new Error('Native button rejection did not recommend the registered component boundary');
  }

  const applyResponse = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: planPayload.plan.id,
      root: {
        kind: 'element',
        tag: 'main',
        purpose: 'layout',
        props: { className: 'grid gap-4' },
        children: [
          {
            kind: 'element',
            tag: 'p',
            purpose: 'content',
            children: [{ kind: 'text', value: 'Native editable copy' }],
          },
          {
            kind: 'component',
            componentId: 'component-bridge-button',
            intent: 'control.action',
            children: [{ kind: 'text', value: 'Continue' }],
          },
        ],
      },
    }),
  });
  if (!applyResponse.ok) {
    throw new Error(`Structured authoring apply failed with ${applyResponse.status}: ${await applyResponse.text()}`);
  }
  const applyPayload = await applyResponse.json();
  if (!applyPayload.verification?.ok || applyPayload.verification.summary.registeredComponentInstances !== 1) {
    throw new Error('Structured authoring apply did not verify the registered component instance');
  }
  if (!applyPayload.visualQualityGate?.required) {
    throw new Error('Structured authoring apply did not require rendered visual review');
  }

  const wideBefore = await submitBridgeRenderEvidence(bridge, { sourceRevision: applyPayload.revision, renderRevision: applyPayload.renderRevision, phase: 'before-refinement', width: 1440, height: 1024, seed: 51 });
  const compactBefore = await submitBridgeRenderEvidence(bridge, { sourceRevision: applyPayload.revision, renderRevision: applyPayload.renderRevision, phase: 'before-refinement', width: 390, height: 844, seed: 52 });
  const refinedPlanResponse = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirementsId: requirementsPayload.requirements.id,
      approvedPromptId: promptApprovalPayload.approval.id,
      pageName: 'Structured Page', route: '/structured', sourceFile: 'src/workbench-pages/StructuredPage.tsx', exportName: 'StructuredPage', intents: ['control.action'],
      ...createBridgeDesignContract(),
    }),
  });
  if (!refinedPlanResponse.ok) throw new Error(`Structured authoring refinement plan failed with ${refinedPlanResponse.status}: ${await refinedPlanResponse.text()}`);
  const refinedPlanPayload = await refinedPlanResponse.json();
  const refinedApplyResponse = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: refinedPlanPayload.plan.id,
      root: {
        kind: 'element', tag: 'main', purpose: 'layout', props: { className: 'grid gap-6' },
        children: [
          { kind: 'element', tag: 'p', purpose: 'content', children: [{ kind: 'text', value: 'Native editable copy' }] },
          { kind: 'component', componentId: 'component-bridge-button', intent: 'control.action', children: [{ kind: 'text', value: 'Continue' }] },
        ],
      },
    }),
  });
  if (!refinedApplyResponse.ok) throw new Error(`Structured authoring refinement apply failed with ${refinedApplyResponse.status}: ${await refinedApplyResponse.text()}`);
  const refinedApplyPayload = await refinedApplyResponse.json();
  const wideAfter = await submitBridgeRenderEvidence(bridge, { sourceRevision: refinedApplyPayload.revision, renderRevision: refinedApplyPayload.renderRevision, phase: 'after-refinement', width: 1440, height: 1024, seed: 61 });
  const compactAfter = await submitBridgeRenderEvidence(bridge, { sourceRevision: refinedApplyPayload.revision, renderRevision: refinedApplyPayload.renderRevision, phase: 'after-refinement', width: 390, height: 844, seed: 62 });

  const source = await readFile(join(tempRoot, 'src', 'workbench-pages', 'StructuredPage.tsx'), 'utf8');
  if (!source.includes('import { BridgeButton }') || !source.includes('<BridgeButton>') || source.includes('.map(')) {
    throw new Error('Structured authoring output did not preserve explicit registered-component JSX');
  }
  const pages = JSON.parse(await readFile(join(tempRoot, '.workbench', 'pages.json'), 'utf8'));
  if (!pages.pages?.some((page) => page.sourceFile === 'src/workbench-pages/StructuredPage.tsx' && page.route === '/structured')) {
    throw new Error('Structured authoring did not register the generated page');
  }

  const unreviewedResponse = await fetch(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      exportName: 'StructuredPage',
      sourceFile: 'src/workbench-pages/StructuredPage.tsx',
    }),
  });
  if (!unreviewedResponse.ok) {
    throw new Error(`Structured authoring pre-review verify request failed with ${unreviewedResponse.status}: ${await unreviewedResponse.text()}`);
  }
  const unreviewed = await unreviewedResponse.json();
  if (unreviewed.ok || !unreviewed.violations?.some((violation) => violation.code === 'WB-AUTH-VISUAL-REVIEW-MISSING')) {
    throw new Error('Structured-v8 page verification should remain incomplete before rendered review');
  }

  const visualReviewResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBridgeAcceptedVisualReview({
      sourceRevision: refinedApplyPayload.revision,
      renderRevision: refinedApplyPayload.renderRevision,
      wideBeforeId: wideBefore.receipt.id,
      wideAfterId: wideAfter.receipt.id,
      compactBeforeId: compactBefore.receipt.id,
      compactAfterId: compactAfter.receipt.id,
    })),
  });
  if (!visualReviewResponse.ok) {
    throw new Error(`Structured authoring visual review failed with ${visualReviewResponse.status}: ${await visualReviewResponse.text()}`);
  }

  const visualReviewPayload = await visualReviewResponse.json();
  const visualApprovalResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-approval/confirm.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceFile: 'src/workbench-pages/StructuredPage.tsx', sourceRevision: visualReviewPayload.sourceRevision,
      renderRevision: visualReviewPayload.renderRevision, reviewId: visualReviewPayload.reviewId,
      approvalEvidence: { source: 'user', reference: 'Bridge test user approved the exact visual summary.' },
    }),
  });
  if (!visualApprovalResponse.ok) throw new Error(`Structured authoring visual approval failed with ${visualApprovalResponse.status}: ${await visualApprovalResponse.text()}`);

  const verifyResponse = await fetch(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.authoringToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      exportName: 'StructuredPage',
      sourceFile: 'src/workbench-pages/StructuredPage.tsx',
    }),
  });
  if (!verifyResponse.ok) {
    throw new Error(`Structured authoring verify failed with ${verifyResponse.status}: ${await verifyResponse.text()}`);
  }
  const verification = await verifyResponse.json();
  if (!verification.ok || verification.summary.localJsxFunctions !== 0 || verification.summary.mapExpressions !== 0) {
    throw new Error('Structured authoring verification reported an opaque page structure');
  }
}

function createBridgeReadyBrief() {
  return {
    experienceType: 'screen', productName: 'Bridge Operations', servicePurpose: 'Complete one protected operational action.',
    audience: 'Operations user', journeyMoment: 'After opening a known task and before confirming it', surfaceRole: 'task-flow',
    defaultState: 'The known task and action are visible.', healthyState: 'The task can proceed normally.',
    exceptionState: 'The action is blocked and an error explanation is visible.',
    commonElements: ['Product navigation'], pageElements: ['Task context', 'continue action'], exceptionElements: ['Blocking error'],
    primaryOutcome: 'Complete the task.', primaryAction: 'Continue.', actionConsequence: 'Mark the task complete.', nextStep: 'Open the completed task.',
    workflowModel: 'Known task -> availability check -> continue -> completion.',
    domainObjects: ['Task', 'action availability', 'completion result'],
    keyDecisions: ['Whether the task can proceed.'], actionHierarchy: ['Primary: Continue', 'Secondary: inspect task context'],
    operationalRules: ['If availability fails, block Continue and expose the retry condition.'],
    failureModes: ['Action availability fails'],
    sampleContent: ['Task BR-104', 'Action available now', 'Completion opens the task detail'],
    nonGoals: ['Do not add unrelated dashboard metrics.'], successSignals: ['The user understands the action consequence before continuing.'],
    dataRequirements: ['Task identity and action availability'], contentPriorities: ['Continue action', 'task context'],
    creativeDirection: 'Calm, direct, and operational.',
    surfaceModel: 'single-surface', density: 'minimal', borderPolicy: 'borderless', cardPolicy: 'avoid', overlayPolicy: 'none', dividerPolicy: 'none',
    disclosureStrategy: 'Keep the task context inline and show no secondary overlay.',
    persistentRegions: ['Product navigation'], forbiddenPartitions: ['Full-height content split'], constraints: ['One primary action'],
    responsivePriorities: ['Keep Continue before supporting context.', 'Avoid horizontal overflow.'],
    accessibilityRequirements: ['Continue is keyboard operable.', 'Announce blocked state.'],
    referenceStatus: 'none', referenceArtifacts: [],
  };
}

function createBridgeRequirementsConfirmation(contextRevision) {
  const required = (description, trigger, visibleChanges, recovery) => ({ applicability: 'required', rationale: 'Required by the bridge test workflow.', description, trigger, visibleChanges, recovery });
  const notApplicable = (rationale) => ({ applicability: 'not-applicable', rationale });
  const fields = ['product.name', 'product.purpose', 'product.primaryUser', 'surface.role', 'surface.primaryOutcome', 'surface.primaryAction', 'surface.actionConsequence', 'surface.nextStep', 'designIntelligence.workflow', 'designIntelligence.decisions', 'designIntelligence.operationalRules', 'designIntelligence.content', 'designIntelligence.reference', 'ownership.common', 'ownership.page', 'ownership.exception', 'states.default', 'states.healthy', 'states.incident', 'sections', 'dataRequirements', 'visualComposition.surfaceModel', 'visualComposition.borderPolicy', 'visualComposition.disclosures'];
  return {
    contextRevision,
    product: { name: 'Bridge Operations', purpose: 'Complete one protected operational action.', primaryUser: 'Operations user' },
    surface: { role: 'task-flow', entryContext: 'A known task is opened.', primaryOutcome: 'Complete the task.', primaryAction: 'Continue.', actionConsequence: 'The task is marked complete.', nextStep: 'Open the completed task.' },
    ownership: { common: ['Product navigation'], page: ['Task context', 'Continue action'], exception: ['Blocking error'] },
    states: {
      default: required('Known task and action.', 'Surface entry', ['Show task context and action.'], 'Remain on task.'),
      healthy: required('Task is actionable.', 'Task data is valid.', ['Enable continue action.'], 'Return to default.'),
      warning: notApplicable('No warning state in this test.'),
      incident: required('Task action is blocked.', 'Action availability fails.', ['Show blocking error.'], 'Retry after the issue clears.'),
      empty: notApplicable('Task context is known.'), loading: notApplicable('Shared shell owns loading.'), error: notApplicable('Incident owns the relevant error.'),
    },
    sections: [
      { id: 'shell', name: 'Shell', intent: 'Global navigation.', ownership: 'common', visibleStates: ['default', 'healthy', 'incident'], requiredInformation: ['Product location'], decisionSupported: 'Confirm context.', primaryAction: 'Navigate.', nextStep: 'Open destination.', emphasis: 'low' },
      { id: 'task', name: 'Task', intent: 'Complete the task.', ownership: 'page', visibleStates: ['default', 'healthy', 'incident'], requiredInformation: ['Task identity', 'action availability'], decisionSupported: 'Decide whether to continue.', primaryAction: 'Continue.', nextStep: 'Open completed task.', emphasis: 'high' },
      { id: 'blocker', name: 'Blocker', intent: 'Explain why the action cannot proceed.', ownership: 'exception', visibleStates: ['incident'], requiredInformation: ['Failure reason'], decisionSupported: 'Decide whether to retry.', primaryAction: 'Retry.', nextStep: 'Return to task.', emphasis: 'medium' },
    ],
    dataRequirements: [{ id: 'task-data', name: 'Task status', source: 'Task service', freshness: 'Current request', requiredStates: ['default', 'healthy', 'incident'], fallback: 'Block action and show incident.' }],
    designIntelligence: {
      workflow: { model: 'Known task -> availability check -> continue -> completion.', domainObjects: ['Task', 'availability', 'completion result'], failureModes: ['Availability fails'] },
      decisions: { keyDecisions: ['Whether to continue.'], actionHierarchy: ['Primary: Continue', 'Secondary: task context'], operationalRules: ['If unavailable, block Continue and show retry condition.'] },
      content: { sampleContent: ['Task BR-104', 'Action available', 'Completion opens detail'], nonGoals: ['No dashboard metrics.'], successSignals: ['Consequence is understood before action.'] },
      reference: { status: 'none', artifacts: [], implementationMode: 'not-applicable', sourcePrecedence: 'No supplied reference; use confirmed project language.', pageLandmarks: [], repeatedPatterns: [], hierarchyObservations: [], interactionPatterns: [], responsiveBehavior: [], deliberateDeviations: [] },
    },
    visualComposition: {
      surfaceModel: 'single-surface', density: 'minimal', borderPolicy: 'borderless', cardPolicy: 'avoid', overlayPolicy: 'none', dividerPolicy: 'none',
      limits: { contentSurfaceCount: 1, persistentRegionCount: 1, outlinedContainerCount: 0, cardCount: 0, fullHeightPartitionCount: 0 },
      persistentRegions: ['Product navigation'], forbiddenPartitions: ['Full-height content split'],
      disclosures: [{ content: 'Task context', owner: 'inline', trigger: 'Surface entry', rationale: 'The primary action depends on this context.' }],
      constraints: [{ id: 'single-action', requirement: 'Continue is the only high-emphasis action.', verification: 'Wide and compact renders show one primary action.' }],
    },
    responsiveAccessibility: { wide: 'Keep action first.', compact: 'Stack without overflow.', keyboard: 'Action is keyboard operable.', screenReader: 'Announce task and incident status.' },
    fieldEvidence: fields.map((field) => ({ field, source: 'project', reference: `Bridge fixture ${field}` })),
    unresolvedQuestions: [],
  };
}

function createBridgeDesignContract() {
  return {
    authoringSessionId: 'bridge-authoring-session',
    geometryContract: {
      gridUnitPx: 8,
      geometryTolerancePx: 0,
      minimumPositivePaddingPx: 8,
      uniformPadding: true,
      opticalBalanceTolerancePx: 1,
    },
    designEvidence: {
      skill: 'workbench-design-authoring',
      mode: 'focused',
      presentationSetId: 'bridge-source-composition-v1',
      modeRationale: 'The product direction is settled, so one source-composition target is more useful than generated image variants.',
      options: [
        {
          id: 'source-composition',
          displayOrder: 1,
          experienceHypothesis: 'A single decision-first task surface makes the protected action and its consequence immediately legible.',
          primaryDecision: 'Continue only after understanding the action consequence.',
          dominantEvidence: 'Task availability and the completion consequence.',
          interactionModel: 'decision-first',
          disclosureModel: 'inline-progressive',
          informationArchitecture: ['Task context', 'Continue action', 'Blocked-state explanation'],
          serviceTradeoff: 'Supporting context stays quiet so the primary action remains unambiguous.',
          visualLanguage: 'Calm source-composed operational UI',
          reference: 'composition-brief:bridge-structured-page',
        },
      ],
      differentiation: [],
      selectedOptionId: 'source-composition',
      selectionRationale: 'The bridge test needs one unambiguous primary action and does not need image generation.',
      constraintAssessments: [
        {
          constraintId: 'single-action',
          status: 'pass',
          note: 'The source-composition target contains exactly one high-emphasis action.',
        },
      ],
    },
    visualHierarchy: {
      attentionOrder: ['Continue action', 'Native editable copy', 'Supporting context'],
      primaryFocus: 'Continue action',
      quietRegions: ['Supporting context'],
      gestalt: {
        figureGround: 'Separate one action from the quiet page field.',
        proximity: 'Keep action copy adjacent to the control.',
        similarity: 'Use repeated treatment only for comparable items.',
        continuity: 'Read from action to copy to context.',
        visualRelief: 'Leave open space around supporting context.',
      },
      emphasis: {
        highEmphasisLimit: 1,
        highEmphasisElements: ['Continue action'],
        borderStrategy: 'Use no container border unless spacing fails.',
        typographyStrategy: 'Use strong weight only on the action anchor.',
        spacingStrategy: 'Use a larger gap before supporting context.',
      },
    },
  };
}

function createBridgeAcceptedVisualReview({ sourceRevision, renderRevision, wideBeforeId, wideAfterId, compactBeforeId, compactAfterId }) {
  const pass = (note) => ({ status: 'pass', note });
  const score = (note) => ({ score: 86, status: 'pass', note });
  return {
    sourceFile: 'src/workbench-pages/StructuredPage.tsx',
    sourceRevision,
    renderRevision,
    outcome: 'accept',
    targetReference: 'composition-brief:bridge-structured-page',
    reviewer: { kind: 'independent', sessionId: 'bridge-review-session', method: 'separate-agent', reference: 'bridge-test-independent-review' },
    comparisons: [
      { beforeEvidenceId: wideBeforeId, afterEvidenceId: wideAfterId, observedAttentionOrder: ['Continue action', 'Native editable copy', 'Supporting context'], findings: ['The action is visually dominant.'] },
      { beforeEvidenceId: compactBeforeId, afterEvidenceId: compactAfterId, observedAttentionOrder: ['Continue action', 'Native editable copy', 'Supporting context'], findings: ['The compact order remains intact.'] },
    ],
    scorecard: {
      visualHierarchy: score('The Continue action owns the first read.'), compositionRhythm: score('Spacing separates action and support.'),
      typography: score('Type hierarchy is restrained.'), color: score('Color remains semantic and quiet.'),
      componentCoherence: score('The registered control fits the native structure.'), responsiveContinuity: score('The compact view preserves direction.'),
      briefSpecificity: score('The screen remains task-specific.'), interactionClarity: score('The action and consequence are explicit.'),
    },
    blockers: [],
    gestaltAssessment: {
      figureGround: pass('The action separates from the base surface.'),
      proximity: pass('Related copy remains adjacent.'),
      similarity: pass('No unrelated items share emphasis.'),
      continuity: pass('The reading order is stable.'),
      visualRelief: pass('Open space separates supporting context.'),
    },
    refinement: { changes: ['Reduced secondary emphasis after rendering.'], rationale: 'Preserve one clear focal point.', sourceChangesReference: 'source-diff:bridge-refinement' },
    constraintAssessments: [
      {
        constraintId: 'single-action',
        status: 'pass',
        note: 'Both rendered viewports contain one high-emphasis Continue action.',
      },
    ],
    warningResolutions: [],
  };
}

async function submitBridgeRenderEvidence(bridge, { sourceRevision, renderRevision, phase, width, height, seed }) {
  const response = await fetch(`${bridge.url}/__workbench/authoring/render-evidence.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.authoringToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceFile: 'src/workbench-pages/StructuredPage.tsx', sourceRevision, renderRevision, phase,
      viewport: { width, height, deviceScaleFactor: 1 },
      capture: {
        renderer: 'workbench-design-canvas', route: '/structured', capturedAt: new Date().toISOString(),
        domSnapshotHash: `sha256:${String(seed).padStart(64, 'a').slice(-64)}`,
        computedStyleHash: `sha256:${String(seed).padStart(64, 'b').slice(-64)}`,
        metrics: { documentScrollWidth: width, documentClientWidth: width, clippedElementCount: 0, contrastViolationCount: 0, focusIndicatorViolationCount: 0, touchTargetViolationCount: 0, missingAltTextCount: 0 },
        geometry: createBridgeGeometryMeasurements(width, height),
      },
      artifact: { mediaType: 'image/png', dataBase64: createBridgePngBase64(width, height, seed) },
    }),
  });
  if (!response.ok) throw new Error(`Structured authoring render evidence failed with ${response.status}: ${await response.text()}`);
  return response.json();
}

function createBridgeGeometryMeasurements(viewportWidth, viewportHeight) {
  const rectWidth = Math.min(400, Math.floor((viewportWidth - 16) / 8) * 8);
  const rectHeight = Math.min(240, Math.floor((viewportHeight - 16) / 8) * 8);
  return {
    measurementVersion: 'dom-geometry-v1',
    eligibleElementCount: 1,
    elements: [{
      id: 'bridge-primary-surface', kind: 'surface',
      rect: { x: 8, y: 8, width: rectWidth, height: rectHeight },
      paddingExpectation: 'uniform', padding: { top: 16, right: 16, bottom: 16, left: 16 },
      opticalBalanceExpectation: 'symmetric',
      inkBounds: { x: 24, y: 24, width: rectWidth - 32, height: rectHeight - 32 },
      opticalCentroid: { x: 8 + rectWidth / 2, y: 8 + rectHeight / 2 },
    }],
    spacing: [{ id: 'bridge-primary-gap', kind: 'gap', axis: 'vertical', value: 24 }],
  };
}

function createBridgePngBase64(width, height, seed) {
  const color = Number(seed) % 251;
  const rowLength = 1 + width * 4;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const offset = y * rowLength;
    raw[offset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = offset + 1 + x * 4;
      raw[pixel] = color; raw[pixel + 1] = (color + x) % 251; raw[pixel + 2] = (color + y) % 251; raw[pixel + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header.set([8, 6, 0, 0, 0], 8);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, createBridgePngChunk('IHDR', header), createBridgePngChunk('IDAT', deflateSync(raw)), createBridgePngChunk('IEND', Buffer.alloc(0))]).toString('base64');
}

function createBridgePngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(bridgeCrc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function bridgeCrc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}

async function verifyInvalidWorkbenchProjectRejected(bridge, expectedActiveRoot, activeProjectRootChanges) {
  const root = await mkdtemp(join(tmpdir(), 'workbench-bridge-invalid-config-'));
  try {
    await mkdir(join(root, '.workbench'), { recursive: true });
    await writeJson(join(root, '.workbench', 'workbench.config.json'), {
      projectName: 'Coincidental Config',
      paths: {},
    });

    const invalidOpen = await fetch(`${bridge.url}/__workbench/project.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'open',
        rootPath: root,
      }),
    });
    if (invalidOpen.status !== 404) {
      throw new Error(`Invalid Workbench project should be rejected with 404, got ${invalidOpen.status}: ${await invalidOpen.text()}`);
    }

    const payload = await invalidOpen.json();
    if (payload.ok !== false || typeof payload.message !== 'string' || payload.message.length === 0) {
      throw new Error('Invalid Workbench project rejection did not include a readable message');
    }
    if (activeProjectRootChanges.at(-1) !== expectedActiveRoot) {
      throw new Error('Invalid Workbench project changed the active project root');
    }

    const activeProject = await fetch(`${bridge.url}/__workbench/project.json`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!activeProject.ok) {
      throw new Error(`Active project read failed after invalid open with ${activeProject.status}: ${await activeProject.text()}`);
    }

    const activeLocation = await activeProject.json();
    if (activeLocation.rootPath !== expectedActiveRoot) {
      throw new Error('Invalid Workbench project open replaced the active project location');
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

async function verifyNestedProjectOpen(bridge, activeProjectRootChanges) {
  const parentRoot = await mkdtemp(join(tmpdir(), 'workbench-bridge-nested-parent-'));
  const nestedRoot = join(parentRoot, basename(parentRoot));
  try {
    await writeTempWorkbenchProjectFiles(nestedRoot, {
      projectId: 'nested-bridge-test',
      projectName: 'Nested Bridge Test',
    });

    const openNestedParent = await fetch(`${bridge.url}/__workbench/project.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'open',
        rootPath: parentRoot,
      }),
    });
    if (!openNestedParent.ok) {
      throw new Error(`Nested project open check failed with ${openNestedParent.status}: ${await openNestedParent.text()}`);
    }

    const location = await openNestedParent.json();
    if (location.source !== 'local-bridge' || location.rootPath !== nestedRoot) {
      throw new Error('Nested project open did not return the normalized child project root');
    }
    if (activeProjectRootChanges.at(-1) !== nestedRoot) {
      throw new Error('Nested project root change callback did not receive the normalized child project root');
    }

    const activeProject = await fetch(`${bridge.url}/__workbench/project.json`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!activeProject.ok) {
      throw new Error(`Nested active project read failed with ${activeProject.status}: ${await activeProject.text()}`);
    }

    const activeLocation = await activeProject.json();
    if (activeLocation.rootPath !== nestedRoot) {
      throw new Error('Nested active project read did not retain the normalized child project root');
    }
  } finally {
    await rm(parentRoot, { force: true, recursive: true });
  }
}

async function verifyTailwindPreviewCssFreshness(bridge, tempRoot) {
  const openResult = await fetch(`${bridge.url}/__workbench/project.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'open', rootPath: tempRoot }),
  });
  if (!openResult.ok) throw new Error(`Tailwind fixture open failed with ${openResult.status}: ${await openResult.text()}`);

  let seedWrite;
  const seedEvent = await withBridgeProjectEvent(
    bridge,
    (event) => event.type === 'preview-css-status' && event.previewCss?.renderFreshness?.state === 'unrepresentative',
    async () => {
      seedWrite = await fetch(`${bridge.url}/__workbench/source/write.json`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${bridge.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: 'export function Page() { return <main className="grid">static seed</main>; }\n',
          overwrite: true,
          path: 'src/Page.tsx',
        }),
      });
    },
  );
  if (seedEvent.previewCss?.renderFreshness?.ready !== false) {
    throw new Error('Preview CSS status event did not expose the non-ready static seed state');
  }
  if (!seedWrite.ok) throw new Error(`Install-free Tailwind synchronization failed with ${seedWrite.status}: ${await seedWrite.text()}`);
  const seedPayload = await seedWrite.json();
  const seedFreshness = seedPayload.previewCss?.renderFreshness;
  if (
    seedPayload.previewCss?.mode !== 'compiled'
    || seedPayload.previewCss?.status !== 'unrepresentative'
    || seedFreshness?.fresh !== true
    || seedFreshness?.representative !== false
    || seedFreshness?.ready !== false
    || seedFreshness?.state !== 'unrepresentative'
  ) {
    throw new Error('Install-free preview CSS seed was incorrectly accepted as render-ready project CSS');
  }

  const seedStatus = await fetch(`${bridge.url}/__workbench/preview-css/status.json`, {
    headers: { Authorization: `Bearer ${bridge.token}` },
  });
  if (!seedStatus.ok) throw new Error(`Preview CSS status read failed with ${seedStatus.status}: ${await seedStatus.text()}`);
  const seedStatusPayload = await seedStatus.json();
  if (seedStatusPayload.renderFreshness?.ready !== false || seedStatusPayload.renderFreshness?.state !== 'unrepresentative') {
    throw new Error('Preview CSS status endpoint did not retain the install-free seed disposition');
  }

  const viteBin = join(tempRoot, 'node_modules', '.bin', 'vite');
  await mkdir(join(tempRoot, 'node_modules', '.bin'), { recursive: true });
  await writeFile(viteBin, `#!/usr/bin/env node
const fs = require('node:fs');
fs.mkdirSync('dist/assets', { recursive: true });
fs.writeFileSync('dist/assets/fixture.css', '/* project build */ .grid { display: grid; }\\n');
`, 'utf8');
  await chmod(viteBin, 0o755);

  const compiledWrite = await fetch(`${bridge.url}/__workbench/source/write.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: 'export function Page() { return <main className="grid">project build</main>; }\n',
      overwrite: true,
      path: 'src/Page.tsx',
    }),
  });
  if (!compiledWrite.ok) throw new Error(`Project Tailwind synchronization failed with ${compiledWrite.status}: ${await compiledWrite.text()}`);
  const compiledPayload = await compiledWrite.json();
  const compiledFreshness = compiledPayload.previewCss?.renderFreshness;
  if (
    compiledFreshness?.fresh !== true
    || compiledFreshness?.representative !== true
    || compiledFreshness?.ready !== true
    || compiledFreshness?.state !== 'ready'
    || !compiledFreshness?.inputRevision
    || !compiledFreshness?.outputRevision
  ) {
    throw new Error('Project-built Tailwind CSS was not reported as fresh, representative, and render-ready');
  }

  await rm(viteBin, { force: true });
  const staleWrite = await fetch(`${bridge.url}/__workbench/source/write.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bridge.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: 'export function Page() { return <main className="grid">stale output</main>; }\n',
      overwrite: true,
      path: 'src/Page.tsx',
    }),
  });
  if (!staleWrite.ok) throw new Error(`Stale Tailwind preservation check failed with ${staleWrite.status}: ${await staleWrite.text()}`);
  const stalePayload = await staleWrite.json();
  const staleFreshness = stalePayload.previewCss?.renderFreshness;
  if (
    stalePayload.previewCss?.status !== 'stale'
    || staleFreshness?.fresh !== false
    || staleFreshness?.representative !== true
    || staleFreshness?.ready !== false
    || staleFreshness?.state !== 'unavailable'
  ) {
    throw new Error('Preserved compiled CSS was not exposed as a terminal stale, non-ready render state');
  }
}

async function verifyTempProjectIo(bridge, tempRoot) {
  const openTemp = await fetch(`${bridge.url}/__workbench/project.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'open',
      rootPath: tempRoot,
    }),
  });
  if (!openTemp.ok) {
    throw new Error(`Temp project open check failed with ${openTemp.status}: ${await openTemp.text()}`);
  }

  const previewCssStatus = await fetch(`${bridge.url}/__workbench/preview-css/status.json`, {
    headers: { Authorization: `Bearer ${bridge.token}` },
  });
  if (!previewCssStatus.ok) {
    throw new Error(`Disabled preview CSS status failed with ${previewCssStatus.status}: ${await previewCssStatus.text()}`);
  }
  const previewCssPayload = await previewCssStatus.json();
  if (
    previewCssPayload.mode !== 'disabled'
    || previewCssPayload.renderFreshness?.fresh !== true
    || previewCssPayload.renderFreshness?.representative !== true
    || previewCssPayload.renderFreshness?.ready !== true
  ) {
    throw new Error('Non-Tailwind project was not accepted as render-ready without a Tailwind layer');
  }

  await withBridgeProjectEvent(bridge, (event) => event.type === 'project-changed', async () => {
    const writeResult = await fetch(`${bridge.url}/__workbench/source/write.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: 'export function BridgePage() {\n  return <div>after</div>;\n}\n',
        overwrite: true,
        path: 'src/BridgePage.tsx',
      }),
    });
    if (!writeResult.ok) {
      throw new Error(`Temp source write check failed with ${writeResult.status}: ${await writeResult.text()}`);
    }
  });

  const updatedSource = await readFile(join(tempRoot, 'src', 'BridgePage.tsx'), 'utf8');
  if (!updatedSource.includes('after')) {
    throw new Error('Bridge source write did not update the selected temp project file');
  }

  const blockedWorkbenchSource = await fetch(`${bridge.url}/__workbench/source/read.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: '.workbench/workbench.config.json',
    }),
  });
  if (blockedWorkbenchSource.status !== 400) {
    throw new Error(`Bridge should block source reads from .workbench, got ${blockedWorkbenchSource.status}`);
  }

  const blockedTraversal = await fetch(`${bridge.url}/__workbench/source/read.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: '../package.json',
    }),
  });
  if (blockedTraversal.status !== 400) {
    throw new Error(`Bridge should block traversal outside the selected root, got ${blockedTraversal.status}`);
  }

  const selectionWrite = await fetch(`${bridge.url}/__workbench/files/.workbench/selection.json`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      activeTarget: { kind: 'project' },
      extensions: { bridgeCheck: true },
      schemaVersion: '0.1',
      selectedTargets: [{ kind: 'project' }],
      updatedAt: '2026-01-01T00:01:00.000Z',
    }),
  });
  if (!selectionWrite.ok) {
    throw new Error(`Workbench project JSON write check failed with ${selectionWrite.status}: ${await selectionWrite.text()}`);
  }

  const selectionPayload = JSON.parse(await readFile(join(tempRoot, '.workbench', 'selection.json'), 'utf8'));
  if (selectionPayload.extensions?.bridgeCheck !== true) {
    throw new Error('Bridge project JSON write did not update the selected temp project file');
  }

  const importTree = await fetch(`${bridge.url}/__workbench/source/import-tree.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourcePath: 'src',
    }),
  });
  if (!importTree.ok) {
    throw new Error(`Import tree check failed with ${importTree.status}: ${await importTree.text()}`);
  }

  const importPayload = await importTree.json();
  if (!importPayload.files?.some((file) => file.relativePath === 'src/BridgePage.tsx' && file.contents.includes('after'))) {
    throw new Error('Import tree payload did not include the updated source file');
  }

  const metadataImportTree = await fetch(`${bridge.url}/__workbench/source/import-tree.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeContents: false,
      sourcePath: 'src',
    }),
  });
  if (!metadataImportTree.ok) {
    throw new Error(`Metadata import tree check failed with ${metadataImportTree.status}: ${await metadataImportTree.text()}`);
  }

  const metadataImportPayload = await metadataImportTree.json();
  if (!metadataImportPayload.files?.some((file) => file.relativePath === 'src/BridgePage.tsx' && file.contents === '')) {
    throw new Error('Metadata import tree payload should preserve source paths without reading file contents');
  }

  const nestedImportTree = await fetch(`${bridge.url}/__workbench/source/import-tree.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourcePath: 'src/components/ui',
    }),
  });
  if (!nestedImportTree.ok) {
    throw new Error(`Nested import tree check failed with ${nestedImportTree.status}: ${await nestedImportTree.text()}`);
  }

  const nestedImportPayload = await nestedImportTree.json();
  if (!nestedImportPayload.files?.some((file) => file.relativePath === 'src/components/ui/BridgeButton.tsx')) {
    throw new Error('Nested import tree payload did not preserve the project-relative source path');
  }

  const blockedImport = await fetch(`${bridge.url}/__workbench/source/import-tree.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourcePath: '../',
    }),
  });
  if (blockedImport.status !== 400) {
    throw new Error(`Bridge should block import-tree traversal outside the selected root, got ${blockedImport.status}`);
  }

  const unauthenticatedImageProxy = await fetch(`${bridge.url}/__workbench/image-proxy?url=${encodeURIComponent('https://example.com/image.png')}`);
  if (unauthenticatedImageProxy.status !== 401) {
    throw new Error(`Image proxy should require bridge auth, got ${unauthenticatedImageProxy.status}`);
  }

  const blockedImageProxy = await fetch(`${bridge.url}/__workbench/image-proxy?url=${encodeURIComponent('http://127.0.0.1/image.png')}`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
  });
  if (blockedImageProxy.status !== 400) {
    throw new Error(`Image proxy should block localhost/private targets, got ${blockedImageProxy.status}`);
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (url.startsWith(bridge.url)) return originalFetch(input, init);
    throw new Error(`Blocked external fetch during bridge check: ${url}`);
  };
  try {
    const googleFonts = await fetch(`${bridge.url}/__workbench/assets/google-fonts.json?q=Inter&limit=5`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!googleFonts.ok) {
      throw new Error(`Google Fonts search check failed with ${googleFonts.status}: ${await googleFonts.text()}`);
    }

    const googleFontsPayload = await googleFonts.json();
    if (
      googleFontsPayload.ok !== true ||
      googleFontsPayload.source !== 'fallback' ||
      !googleFontsPayload.fonts?.some((font) => font.family === 'Inter')
    ) {
      throw new Error('Google Fonts bridge search did not return the offline fallback catalog');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  const blockedAssetInstall = await fetch(`${bridge.url}/__workbench/assets/install.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: 'icon',
      source: 'git',
      url: 'http://example.com/workbench-icons.git',
    }),
  });
  if (blockedAssetInstall.status !== 400) {
    throw new Error(`Asset install should reject plain HTTP Git URLs, got ${blockedAssetInstall.status}`);
  }

  const assetWrite = await fetch(`${bridge.url}/__workbench/assets/write.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection: 'Bridge Test',
      dataUrl: `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>').toString('base64')}`,
      fileName: 'bridge.svg',
      kind: 'image',
    }),
  });
  if (!assetWrite.ok) {
    throw new Error(`Asset write check failed with ${assetWrite.status}: ${await assetWrite.text()}`);
  }

  const assetPayload = await assetWrite.json();
  if (!assetPayload.filePath?.startsWith('public/workbench-assets/images/Bridge-Test/')) {
    throw new Error('Asset write returned an unexpected project file path');
  }

  const writtenAsset = await readFile(join(tempRoot, assetPayload.filePath), 'utf8');
  if (!writtenAsset.includes('<svg')) {
    throw new Error('Asset write did not create the expected file in the selected temp project');
  }

  const servedAsset = await fetch(`${bridge.url}${assetPayload.publicPath}`);
  if (!servedAsset.ok) {
    throw new Error(`Served asset check failed with ${servedAsset.status}: ${await servedAsset.text()}`);
  }
  if (!servedAsset.headers.get('content-type')?.includes('image/svg+xml')) {
    throw new Error('Served asset did not include the expected SVG content type');
  }

  const assetDelete = await fetch(`${bridge.url}/__workbench/assets/delete.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paths: [assetPayload.filePath],
    }),
  });
  if (!assetDelete.ok) {
    throw new Error(`Asset delete check failed with ${assetDelete.status}: ${await assetDelete.text()}`);
  }

  const deletePayload = await assetDelete.json();
  if (!deletePayload.removed?.includes(assetPayload.filePath.replace(/^public\//, ''))) {
    throw new Error('Asset delete did not report the expected removed path');
  }
}

async function verifyTempProjectCreate(bridge) {
  const parentRoot = await mkdtemp(join(tmpdir(), 'workbench-bridge-create-parent-'));
  try {
    const createResult = await fetch(`${bridge.url}/__workbench/project.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        parentPath: parentRoot,
        projectName: 'Created Bridge Project',
        templateId: 'shadcn-base',
      }),
    });
    if (!createResult.ok) {
      throw new Error(`Project create check failed with ${createResult.status}: ${await createResult.text()}`);
    }

    const location = await createResult.json();
    if (!location.rootPath?.endsWith('/Created Bridge Project') || location.source !== 'local-bridge') {
      throw new Error('Project create did not return the expected local-bridge location');
    }
    if (location.dependencyInstall?.status !== 'installing') {
      throw new Error('Project create should return immediately with an installing dependency status');
    }

    const duplicateCreateResult = await fetch(`${bridge.url}/__workbench/project.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        parentPath: parentRoot,
        projectName: 'Created Bridge Project',
        templateId: 'shadcn-base',
      }),
    });
    if (duplicateCreateResult.status !== 409) {
      throw new Error(`Duplicate project create should return 409, received ${duplicateCreateResult.status}`);
    }
    const duplicateCreatePayload = await duplicateCreateResult.json();
    if (duplicateCreatePayload.ok !== false || duplicateCreatePayload.message !== 'Project folder already exists.') {
      throw new Error('Duplicate project create should return a readable folder-exists failure');
    }

    const activeProjectResult = await fetch(`${bridge.url}/__workbench/project.json`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!activeProjectResult.ok) {
      throw new Error(`Active project check failed with ${activeProjectResult.status}: ${await activeProjectResult.text()}`);
    }
    const activeProject = await activeProjectResult.json();
    if (activeProject.rootPath !== location.rootPath) {
      throw new Error('Created project was not activated before the create response completed');
    }

    const config = JSON.parse(await readFile(join(location.rootPath, '.workbench', 'workbench.config.json'), 'utf8'));
    if (config.projectName !== 'Created Bridge Project' || config.workbench?.app !== 'workbench-v1') {
      throw new Error('Created project config did not match the expected Workbench project shape');
    }
    const dependencyInstall = await waitForJsonFile(
      join(location.rootPath, '.workbench', 'dependency-install.json'),
      5000,
      (value) => value.status !== 'installing',
    );
    if (dependencyInstall.status !== 'skipped') {
      throw new Error('Created project did not write the dependency install status file');
    }
    await new Promise((resolve) => setImmediate(resolve));

    const dependencyStatusPath = join(location.rootPath, '.workbench', 'dependency-install.json');
    await waitForResumedDependencyInstall(bridge, dependencyStatusPath);
    const resumedDependencyInstall = await waitForJsonFile(
      dependencyStatusPath,
      5000,
      (value) => value.status !== 'installing',
    );
    if (resumedDependencyInstall.status !== 'skipped') {
      throw new Error('Interrupted dependency install did not resume through the host queue');
    }

    await writeJson(dependencyStatusPath, {
      finishedAt: new Date().toISOString(),
      message: 'Simulated install failure.',
      ok: false,
      schemaVersion: '0.1',
      startedAt: new Date().toISOString(),
      status: 'failed',
      templateId: 'shadcn-base',
    });
    const retryResult = await fetch(`${bridge.url}/__workbench/project/dependencies/install.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!retryResult.ok) {
      throw new Error(`Dependency install retry check failed with ${retryResult.status}: ${await retryResult.text()}`);
    }
    const retryLocation = await retryResult.json();
    if (retryLocation.dependencyInstall?.status !== 'installing') {
      throw new Error('Dependency retry should return immediately with an installing status');
    }
    const retriedDependencyInstall = await waitForJsonFile(
      dependencyStatusPath,
      5000,
      (value) => value.status !== 'installing',
    );
    if (retriedDependencyInstall.status !== 'skipped') {
      throw new Error('Dependency retry did not complete through the host queue');
    }

    await writeJson(dependencyStatusPath, {
      finishedAt: new Date().toISOString(),
      ok: true,
      schemaVersion: '0.1',
      startedAt: new Date().toISOString(),
      status: 'installed',
      templateId: 'shadcn-base',
    });
    const staleProjectResult = await fetch(`${bridge.url}/__workbench/project.json`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!staleProjectResult.ok) {
      throw new Error(`Stale dependency recovery check failed with ${staleProjectResult.status}: ${await staleProjectResult.text()}`);
    }
    const staleProject = await staleProjectResult.json();
    if (staleProject.dependencyInstall?.status !== 'installing') {
      throw new Error('A stale installed dependency tree should be repaired as an active install');
    }
    const repairedDependencyInstall = await waitForJsonFile(
      dependencyStatusPath,
      5000,
      (value) => value.status !== 'installing',
    );
    if (repairedDependencyInstall.status !== 'skipped') {
      throw new Error('A stale installed dependency tree did not re-enter the host install queue');
    }

    const pageSource = await readFile(join(location.rootPath, 'src', 'workbench-pages', 'SaasDashboard.tsx'), 'utf8');
    if (!pageSource.includes('SaasDashboardPage')) {
      throw new Error('Created project did not include the default Workbench page source');
    }
    const packageJson = JSON.parse(await readFile(join(location.rootPath, 'package.json'), 'utf8'));
    if (packageJson.scripts?.check !== 'tsc -p tsconfig.json --noEmit && node scripts/workbench-verify-pages.mjs' || packageJson.scripts?.['workbench:check']) {
      throw new Error('Created project unexpectedly included an authoring interlock');
    }
  } finally {
    await rm(parentRoot, { force: true, recursive: true });
  }
}

async function waitForJsonFile(path, timeoutMs = 5000, predicate = () => true) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = JSON.parse(await readFile(path, 'utf8'));
      if (predicate(value)) return value;
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for JSON file: ${path}`);
}

async function waitForResumedDependencyInstall(bridge, dependencyStatusPath, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    await writeJson(dependencyStatusPath, {
      ok: false,
      schemaVersion: '0.1',
      startedAt: new Date(0).toISOString(),
      status: 'installing',
      templateId: 'shadcn-base',
    });
    const response = await fetch(`${bridge.url}/__workbench/project.json`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Interrupted install recovery check failed with ${response.status}: ${await response.text()}`);
    }
    const project = await response.json();
    lastStatus = project.dependencyInstall?.status ?? null;
    if (lastStatus === 'installing') return project;
    // An install still registered from the previous step makes the bridge re-read the
    // status file, so it can overwrite the interrupted marker before the read lands.
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Interrupted dependency install should resume as an active install; last reported status was ${lastStatus}`);
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function withBridgeProjectEvent(bridge, predicate, action) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${bridge.url}/__workbench-bridge/events`, {
      headers: {
        Authorization: `Bearer ${bridge.token}`,
      },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Bridge event stream failed with ${response.status}`);
    }

    await action();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const event = parseBridgeEventFrame(frame);
        if (event && predicate(event)) return event;
        frameEnd = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Timed out waiting for a bridge project event');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }

  throw new Error('Bridge event stream ended before a matching event arrived');
}

function parseBridgeEventFrame(frame) {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n');
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
