/**
 * Regression: a node rendered inside a JSX conditional must be movable.
 *
 * The parser projects `{open ? <aside/> : <aside/>}`'s rendered branch into the
 * parent's own child slot, so the canvas addresses the `<aside>` directly. The
 * move writeback used to treat the conditional as one opaque child and walk the
 * index path into it, which never matched — so every node inside a
 * conditionally rendered region could be dropped INTO but never moved OUT of.
 * The failure was silent: `resolved: true` at the drag, then no file write, no
 * history entry, and therefore nothing to undo. It read as "this area is not
 * editable".
 *
 * `tests/editable-tree` covers the writeback directly. This drives the whole
 * path — canvas press, drag, commit, disk — because that is where it was found.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, openCanvas, pagePointFor, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, slowDrag, waitFor, waitForCanvasFrame, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Tactics-001/TACTICS-002';

const PAGE_ID = 'page-mission-planning-workspace';
const SOURCE_FILE = 'src/workbench-pages/MissionPlanningWorkspace.tsx';
const PANEL_SELECTOR = '[aria-label="선택 객체 정보"]';
// The panel is the consequent of `{inspectorOpen ? … : …}`; this heading is a
// node inside it, three levels down.
const HEADING_NODE_ID = '0-1-1-0-0-1-2';

export default async function conditionalBranchNodeMoveSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });
  // The artboard is 1440x900, so the canvas frame lays out 1438x898 whatever
  // the window is and its right edge sits at 1670. At 1600x900 the frame
  // overflowed the window on both axes, and a drag whose points fall outside
  // it presses nothing at all — which reads exactly like the silent writeback
  // failure this spec exists to catch. 1980x1000 is the first size that both
  // contains the frame and clears the Inspector aside at its right edge.
  await page.setViewport({ width: 1980, height: 1000 });
  await openCanvas(page, baseUrl, { readySelector: PANEL_SELECTOR });

  const sourcePath = join(projectDir, SOURCE_FILE);
  const before = await readFile(sourcePath, 'utf8');

  // A canvas click does not select this node, so seed the selection and reload
  // rather than trying to press it into existence.
  const layerId = `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:${HEADING_NODE_ID}`;
  await setActiveDesignLayer(projectDir, layerId);
  await page.reload({ waitUntil: 'networkidle2' });
  const frame = await waitForCanvasFrame(page, 60000);
  await frame.waitForSelector(PANEL_SELECTOR, { timeout: 30000 });
  await sleep(1500);
  assert(
    (await readActiveDesignLayerId(projectDir)) === layerId,
    'the heading inside the conditional is the selected layer',
  );

  const from = await pagePointFor(page, frame, () => {
    const el = [...document.querySelectorAll('h2')].find((node) => (node.textContent ?? '').includes('UAS 감시 구역'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  // Upwards, onto the label above it: a real reorder rather than a drop that
  // resolves back to the index it already has.
  const to = await pagePointFor(page, frame, () => {
    const el = [...document.querySelectorAll('p')].find((node) => (node.textContent ?? '').includes('선택 객체 / 공역 통제'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  assert(from && to, 'both ends of the drag are visible on the canvas');

  await page.evaluate(() => { window.__wbDragProbe = []; });
  await slowDrag(page, from, to);

  const records = await waitFor(
    async () => {
      const all = await page.evaluate(() => window.__wbDragProbe ?? []);
      return all.some((record) => record.phase === 'moveResult') ? all : null;
    },
    { label: 'the move to reach the source writeback', timeoutMs: 15000 },
  );
  const moveResult = records.find((record) => record.phase === 'moveResult');
  console.log('[spec] move result:', JSON.stringify(moveResult?.detail ?? null));
  assert(
    moveResult?.detail?.ok,
    `the writeback accepted a node inside a conditional (${moveResult?.detail?.diagnostic})`,
  );

  // The source path sits behind an async queue and a debounced save, so poll.
  await waitFor(
    async () => (await readFile(sourcePath, 'utf8')) !== before,
    { label: 'the move to reach the page source on disk', timeoutMs: 15000 },
  );
}

async function setActiveDesignLayer(projectDir, layerId) {
  const selection = await readFixtureSelection(projectDir);
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [layerId],
  };
  await writeFixtureSelection(projectDir, selection);
}
