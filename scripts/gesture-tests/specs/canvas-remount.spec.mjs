/**
 * Regression: the canvas must not remount its rendered tree outside of the
 * single placeholder→runtime swap that happens when the page's runtime module
 * finishes loading. (Bug reported 2026-07-29: the canvas remounted right
 * after mount because the matchMedia patch bumped a key version.)
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, selectFixtureDesignPage, sleep, waitForCanvasFrame } from '../helpers.mjs';

export default async function canvasRemountSpec({ page, baseUrl, projectDir }) {
  // Seed the page instead of inheriting whatever the fixture's committed
  // session state happens to be. With no page selected the canvas never
  // mounts and this reads as "canvas frame did not appear" — a setup failure
  // wearing a regression's clothes.
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-claude-catalog',
    sourceFile: 'src/workbench-pages/ComponentsCatalog.tsx',
  });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const frame = await waitForCanvasFrame(page);

  // Attach as early as possible; anything we miss before this point is
  // covered by the swap-budget assertion below staying at ≤1 total.
  await frame.evaluate(() => {
    const wrapper = document.querySelector('.wb-source-visual-preview');
    window.__wbRemounts = { removed: 0, added: 0 };
    if (!wrapper) return;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) window.__wbRemounts.added += 1;
        }
        for (const node of mutation.removedNodes) {
          if (node.nodeType === 1) window.__wbRemounts.removed += 1;
        }
      }
    }).observe(wrapper, { childList: true });
  });

  // Wait for the page runtime to hydrate (the one allowed swap), then demand
  // stability for a further 10 seconds.
  let hydrated = false;
  for (let i = 0; i < 60; i += 1) {
    const nodes = await frame.evaluate(() => document.querySelectorAll('[data-wb-preview-node-id]').length);
    if (nodes > 100) { hydrated = true; break; }
    await sleep(500);
  }
  assert(hydrated, 'canvas hydrated with page content');

  const afterHydration = await frame.evaluate(() => ({ ...window.__wbRemounts }));
  assert(
    afterHydration.removed <= 1,
    `at most one root swap during initial load (got ${JSON.stringify(afterHydration)})`,
  );

  await sleep(10000);
  const settled = await frame.evaluate(() => ({ ...window.__wbRemounts }));
  assert(
    settled.removed === afterHydration.removed,
    `no further canvas remounts while idle (got ${JSON.stringify(settled)})`,
  );

  await frame.evaluate(() => {
    window.__wbRuntimeRemounts = 0;
    const wrapper = document.querySelector('.wb-source-visual-preview');
    if (!wrapper) return;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node.nodeType !== 1) continue;
          if (
            node.hasAttribute?.('data-wb-preview-node-id') ||
            node.querySelector?.('[data-wb-preview-node-id]')
          ) {
            window.__wbRuntimeRemounts += 1;
          }
        }
      }
    }).observe(wrapper, { childList: true, subtree: true });
  });

  // An unrelated project source event still asks the runtime bundle host for
  // a freshness check. When the content hash is unchanged, the canvas must
  // reuse the existing module namespace instead of importing a timestamped
  // copy and remounting every stateful component later.
  await writeFile(
    join(projectDir, 'src', '__wb-runtime-refresh-probe.ts'),
    'export const runtimeRefreshProbe = true;\n',
    'utf8',
  );
  await sleep(3500);
  const runtimeRemounts = await frame.evaluate(() => window.__wbRuntimeRemounts);
  assert(
    runtimeRemounts === 0,
    `content-identical runtime refresh preserved mounted preview nodes (removed ${runtimeRemounts})`,
  );
}
