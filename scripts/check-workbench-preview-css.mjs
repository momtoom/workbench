import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX,
  WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER,
  createWorkbenchPreviewCssCoordinator,
} from './workbench-preview-css.mjs';

const root = await mkdtemp(join(tmpdir(), 'workbench-preview-css-'));
let runnerMode = 'project-build';
let inputsChangedCallbackCount = 0;

try {
  await mkdir(join(root, '.workbench'), { recursive: true });
  await mkdir(join(root, 'src'), { recursive: true });
  await writeProjectConfig({ compiledCss: 'src/workbench-tailwind.css', enabled: true });
  await writeJson(join(root, 'package.json'), { dependencies: { tailwindcss: '4.0.0' } });
  await writeFile(join(root, 'index.html'), '<div id="root"></div>\n', 'utf8');
  await writeFile(join(root, 'src', 'index.css'), '@import "tailwindcss";\n', 'utf8');
  await writeFile(join(root, 'src', 'Page.tsx'), 'export function Page() { return <main className="grid">one</main>; }\n', 'utf8');
  await writeFile(join(root, 'src', 'workbench-tailwind.css'), '.grid { display: grid; }\n', 'utf8');

  const coordinator = createWorkbenchPreviewCssCoordinator({
    onInputsChangedDuringSync: () => {
      inputsChangedCallbackCount += 1;
    },
    runTailwindSync: async ({ projectRoot }) => {
      if (runnerMode === 'failed') throw new Error('fixture build failed');
      if (runnerMode === 'inputs-changed') {
        await writeFile(join(projectRoot, 'src', 'Page.tsx'), 'export function Page() { return <main className="grid">changed during build</main>; }\n', 'utf8');
      }
      const seed = runnerMode === 'seed';
      await writeFile(
        join(projectRoot, 'src', 'workbench-tailwind.css'),
        seed ? `/* ${WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER} */\n` : '.grid { display: grid; gap: 1rem; }\n',
        'utf8',
      );
      return `${WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX}${JSON.stringify({
        compiledCss: runnerMode === 'wrong-path' ? 'src/other.css' : 'src/workbench-tailwind.css',
        fresh: true,
        provenance: seed ? 'install-free-seed' : 'project-build',
        representative: !seed,
        version: 1,
      })}\n`;
    },
  });

  const initial = await coordinator.getProjectStatus(root);
  assert(initial.status === 'stale' && initial.renderFreshness.ready === false, 'Compiled CSS without a session receipt must start stale');
  assert(initial.renderFreshness.inputRevision && initial.renderFreshness.outputRevision, 'Initial status must expose input and output revisions');

  const ready = await coordinator.synchronizeProject(root, { changedPath: 'src/Page.tsx', reason: 'fixture-ready' });
  assert(ready.status === 'synchronized' && ready.renderFreshness.ready === true, 'Project build receipt must produce render-ready CSS');
  assert((await coordinator.getProjectStatus(root)).renderFreshness.ready === true, 'Verified readiness must survive a same-session status read');

  await writeFile(join(root, 'src', 'Page.tsx'), 'export function Page() { return <main className="grid">two</main>; }\n', 'utf8');
  const stale = await coordinator.getProjectStatus(root);
  assert(stale.status === 'stale' && stale.renderFreshness.ready === false, 'Source changes must invalidate cached preview CSS readiness');

  runnerMode = 'seed';
  const seed = await coordinator.synchronizeProject(root, { changedPath: 'src/Page.tsx', reason: 'fixture-seed' });
  assert(seed.status === 'unrepresentative' && seed.renderFreshness.fresh === true, 'Install-free seed must remain fresh as a file');
  assert(seed.renderFreshness.representative === false && seed.renderFreshness.ready === false, 'Install-free seed must not become render-ready');

  runnerMode = 'wrong-path';
  const wrongPath = await coordinator.synchronizeProject(root, { changedPath: 'src/Page.tsx', reason: 'fixture-wrong-path' });
  assert(wrongPath.status === 'unavailable' && wrongPath.renderFreshness.ready === false, 'A receipt for another compiled path must be rejected');

  runnerMode = 'inputs-changed';
  const changedDuringSync = await coordinator.synchronizeProject(root, { changedPath: 'src/Page.tsx', reason: 'fixture-input-race' });
  assert(changedDuringSync.status === 'stale' && changedDuringSync.renderFreshness.ready === false, 'Inputs changed during a build must remain stale');
  assert(inputsChangedCallbackCount === 1, 'Input races must request exactly one follow-up synchronization');

  runnerMode = 'failed';
  await assertRejects(
    coordinator.synchronizeProject(root, { changedPath: 'src/Page.tsx', reason: 'fixture-failure' }),
    'fixture build failed',
  );
  const failed = await coordinator.getProjectStatus(root);
  assert(failed.status === 'failed' && failed.renderFreshness.state === 'failed', 'Failed build status must remain observable');
  assert(failed.renderFreshness.error?.includes('fixture build failed'), 'Failed build status must retain its bounded error');

  await writeProjectConfig({ compiledCss: null, enabled: true });
  const fallback = await coordinator.getProjectStatus(root);
  assert(fallback.mode === 'fallback' && fallback.renderFreshness.fresh === true, 'Fallback mode must report its generated layer as available');
  assert(fallback.renderFreshness.representative === false && fallback.renderFreshness.ready === false, 'Fallback mode must remain unrepresentative');

  await writeProjectConfig({ compiledCss: 'src/workbench-tailwind.css', enabled: false });
  const disabled = await coordinator.getProjectStatus(root);
  assert(disabled.mode === 'disabled' && disabled.renderFreshness.ready === true, 'Disabled Tailwind must not block render readiness');

  console.log('Workbench shared preview CSS coordinator check passed');
} finally {
  await rm(root, { force: true, recursive: true });
}

async function writeProjectConfig({ compiledCss, enabled }) {
  await writeJson(join(root, '.workbench', 'workbench.config.json'), {
    schemaVersion: '0.1',
    projectId: 'preview-css-check',
    projectName: 'Preview CSS Check',
    extensions: {
      tailwind: {
        enabled,
        sourceCss: 'src/index.css',
        compiledCss,
        tokenCss: 'src/workbench-tokens.css',
      },
    },
  });
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRejects(promise, expectedMessage) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedMessage)) return;
    throw error;
  }
  throw new Error(`Expected rejection containing: ${expectedMessage}`);
}
