/**
 * Regression: opening a modal overlay from a project component inside the
 * Design canvas must not kill wheel scrolling in the editor chrome.
 *
 * Project modules execute in the Workbench window while their DOM lives in the
 * preview iframe. Modal scroll locks (vaul / Radix Dialog via
 * react-remove-scroll) grab the module realm's `document` — the Workbench
 * document — and preventDefault every wheel event outside the lock node. The
 * lock node is in the iframe, so with a drawer open the whole editor (layer
 * tree, Inspector) stopped wheel-scrolling until the drawer closed.
 */
import { altClick, altClickInFrame, assert, openCanvas, pagePointFor, selectFixtureDesignPage, sleep, waitFor } from '../helpers.mjs';

export const fixture = 'Tactics-001/TACTICS-002';

const DRAWER_TRIGGER_SELECTOR = '[aria-label="작전 도구 및 레이어 열기"]';
const DRAWER_CONTENT_SELECTOR = '[data-slot="drawer-content"]';
const LAYER_LIST_SELECTOR = '#wb-design-layer-list';

async function readLayerList(page) {
  return page.evaluate((selector) => {
    const list = document.querySelector(selector);
    if (!list) return null;
    const rect = list.getBoundingClientRect();
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      scrollTop: list.scrollTop,
      maxScroll: list.scrollHeight - list.clientHeight,
    };
  }, LAYER_LIST_SELECTOR);
}

async function resetLayerListScroll(page) {
  await page.evaluate((selector) => {
    const list = document.querySelector(selector);
    if (list) list.scrollTop = 0;
  }, LAYER_LIST_SELECTOR);
}

async function wheelOverLayerList(page, description) {
  const list = await readLayerList(page);
  assert(list, `${description}: layer list present`);
  assert(list.maxScroll > 8, `${description}: layer list overflows (max ${list.maxScroll}px)`);
  await page.mouse.move(list.x, list.y);
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel({ deltaY: 240 });
    await sleep(120);
  }
  await sleep(400);
  const after = await readLayerList(page);
  return after.scrollTop - list.scrollTop;
}

export default async function drawerScrollLockIsolationSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-mission-planning-workspace',
    sourceFile: 'src/workbench-pages/MissionPlanningWorkspace.tsx',
  });
  // Short viewport so the layer tree overflows once ancestors expand.
  await page.setViewport({ width: 1440, height: 720 });
  const frame = await openCanvas(page, baseUrl, { readySelector: DRAWER_TRIGGER_SELECTOR });
  await sleep(600);

  // Plain click = editor selection: selecting the drawer trigger expands its
  // ancestor rows in the layer tree so the list has somewhere to scroll.
  const triggerPoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="작전 도구 및 레이어 열기"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  assert(triggerPoint, 'drawer trigger visible in canvas');
  await page.mouse.click(triggerPoint.x, triggerPoint.y);
  await waitFor(async () => {
    const list = await readLayerList(page);
    return list && list.maxScroll > 8 ? list : null;
  }, { label: 'layer tree overflows after selection', timeoutMs: 10000 });

  // Baseline: with the drawer closed, wheel over the layer tree scrolls it.
  await resetLayerListScroll(page);
  const closedDelta = await wheelOverLayerList(page, 'drawer closed');
  assert(closedDelta > 8, `layer tree wheel-scrolls with drawer closed (moved ${closedDelta}px)`);

  // Alt+click = runtime interaction: actually open the drawer.
  await altClick(page, triggerPoint);
  await waitFor(
    () => frame.evaluate((selector) => {
      const content = document.querySelector(selector);
      return Boolean(content && content.getBoundingClientRect().width > 0);
    }, DRAWER_CONTENT_SELECTOR),
    { label: 'drawer opened in canvas', timeoutMs: 8000 },
  );
  await sleep(800); // let the scroll lock install + open animation settle

  await resetLayerListScroll(page);
  const openDelta = await wheelOverLayerList(page, 'drawer open');
  assert(
    openDelta > 8,
    `layer tree wheel-scrolls while the project drawer is open (moved ${openDelta}px)`,
  );

  // Close the drawer through its own runtime close control. The control is
  // anchored to the bottom of the drawer, and this spec runs a deliberately
  // short viewport (720) while the canvas frame lays out at 898 tall, so the
  // control's page point falls outside the browser window entirely --
  // elementFromPoint there is null and a real click reaches nothing. Closing is
  // setup for the final assertion, not the behaviour under test, so dispatch
  // the chord inside the frame; the wheel assertions above and below still go
  // through real pointer input.
  const closed = await altClickInFrame(frame, () => [...document.querySelectorAll('[data-slot="drawer-close"]')]
    .find((node) => (node.textContent || '').includes('지도 복귀')));
  assert(closed, 'drawer close control found in canvas');
  await waitFor(
    () => frame.evaluate(
      (selector) => !document.querySelector(selector),
      DRAWER_CONTENT_SELECTOR,
    ),
    { label: 'drawer closed', timeoutMs: 8000 },
  );
  await sleep(600);

  await resetLayerListScroll(page);
  const reopenedDelta = await wheelOverLayerList(page, 'drawer closed again');
  assert(reopenedDelta > 8, `layer tree wheel-scrolls after the drawer closes (moved ${reopenedDelta}px)`);
}
