/**
 * Regression: arrow keys move the selected node while a Drawer is open.
 *
 * Reported as "드로워 선택 후 화살표키가 노드를 안 옮기고 레이어 트리가
 * 스크롤된다" — after selecting in the drawer, arrow keys scroll the layer tree
 * instead of moving the node.
 *
 * The move was refused for any target inside an interactive element, and an
 * open drawer makes that everything: opening one leaves focus on its trigger, a
 * button, and its content is a dialog. Neither does anything with arrow keys.
 * A selection is explicit intent and now outranks them; only surfaces that
 * genuinely navigate with arrows still keep the keys.
 *
 * The selection is seeded rather than clicked because a press inside the drawer
 * still lands on the page's top-level node — a separate defect, measured in
 * `drawer-portal-hit-test-probe.spec.mjs`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { altClick, assert, openCanvas, pagePointFor, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Tactics-001/TACTICS-002';

const DRAWER_TRIGGER_SELECTOR = '[aria-label="작전 도구 및 레이어 열기"]';
const DRAWER_CONTENT_SELECTOR = '[data-slot="drawer-content"]';
const PAGE_ID = 'page-mission-planning-workspace';
const SOURCE_FILE = 'src/workbench-pages/MissionPlanningWorkspace.tsx';
// A layer toggle row in the drawer's 표시 레이어 list — it has siblings above
// and below, so a reorder is visible in its own id.
const DRAWER_ROW_NODE_ID = '0-0-1-1-2-1-0-1-1-5';

export default async function drawerArrowKeyMoveSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });
  const layerId = `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:${DRAWER_ROW_NODE_ID}`;
  await setActiveDesignLayer(projectDir, layerId);
  await page.setViewport({ width: 1600, height: 900 });

  const frame = await openCanvas(page, baseUrl, { readySelector: DRAWER_TRIGGER_SELECTOR });
  await sleep(1000);
  assert(
    (await readActiveDesignLayerId(projectDir)) === layerId,
    'the drawer row is the selected layer before the drawer opens',
  );

  // Alt+click is the runtime chord; a plain click would only select the trigger.
  const triggerPoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="작전 도구 및 레이어 열기"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  assert(triggerPoint, 'the drawer trigger is visible in the canvas');
  await altClick(page, triggerPoint);
  await waitFor(
    () => frame.evaluate((selector) => {
      const content = document.querySelector(selector);
      return Boolean(content && content.getBoundingClientRect().width > 0);
    }, DRAWER_CONTENT_SELECTOR),
    { label: 'the drawer opened in the canvas', timeoutMs: 15000 },
  );
  await sleep(1000);

  // Where focus lands after opening is exactly what used to refuse the move.
  console.log('[spec] focus inside the preview:', await frame.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}` : null;
  }));

  const before = await readActiveDesignLayerId(projectDir);
  await page.keyboard.press('ArrowDown');
  const after = await waitFor(
    async () => {
      const selected = await readActiveDesignLayerId(projectDir);
      return selected && selected !== before ? selected : null;
    },
    { label: 'ArrowDown to move the selected drawer row', timeoutMs: 15000 },
  );
  console.log('[spec] selection before ArrowDown:', before);
  console.log('[spec] selection after  ArrowDown:', after);

  const drawerStillOpen = await frame.evaluate(
    (selector) => Boolean(document.querySelector(selector)),
    DRAWER_CONTENT_SELECTOR,
  );
  assert(drawerStillOpen, 'moving a node did not close the drawer');
}

async function setActiveDesignLayer(projectDir, layerId) {
  const selection = await readFixtureSelection(projectDir);
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [],
  };
  await writeFixtureSelection(projectDir, selection);
}
