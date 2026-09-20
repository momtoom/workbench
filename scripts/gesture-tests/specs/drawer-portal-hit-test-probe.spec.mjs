/**
 * Regression: a press on empty space inside an open Drawer must not reach a
 * node behind it. From `NEXT-STEPS-2026-08-07-DRAWER-PORTAL-HIT-TEST.md`.
 *
 * The browser's hit test already stops at the drawer — the modal surface puts
 * `pointer-events: none` on the body behind it. Point resolution used to
 * override that by sweeping the whole preview for any node whose rect contained
 * the point, so a small node behind the drawer won the smallest-area sort.
 *
 * A node behind the drawer is left selected on purpose, so the press also has
 * to survive the second route: "the selection owns presses inside its own box"
 * is true of a wide section sitting under the drawer. It passes today because
 * point resolution answers inside the drawer, not because anything stops the
 * selection from claiming it — see the note on
 * `resolveSourceTreePreviewDragSubject`.
 *
 * The run also prints the full readout the diagnosis needed: every node whose
 * rect contains the point flagged inside/behind, what `describePointResolution`
 * resolves, and which node the drag actually moves.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { altClick, assert, canvasFrameOffset, canvasPagePoint, openCanvas, pagePointFor, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, slowDrag, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Tactics-001/TACTICS-002';

const DRAWER_TRIGGER_SELECTOR = '[aria-label="작전 도구 및 레이어 열기"]';
const DRAWER_CONTENT_SELECTOR = '[data-slot="drawer-content"]';
const PAGE_ID = 'page-mission-planning-workspace';
const SOURCE_FILE = 'src/workbench-pages/MissionPlanningWorkspace.tsx';

// A section behind the drawer, large enough that its box contains points inside
// the open drawer. Selecting it is the second way the press can fall through:
// not via point resolution, but via "the selection owns presses inside its box".
const BEHIND_DRAWER_NODE_ID = '0-1-2';

export default async function drawerPortalHitTestProbeSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });
  await setActiveDesignLayer(
    projectDir,
    `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:${BEHIND_DRAWER_NODE_ID}`,
  );
  // This probe presses points inside a drawer that opens as a right-hand panel,
  // so the window has to show the canvas frame's right edge rather than the
  // shell's Inspector. Measured at this page: the frame's right edge sits at
  // 1670 and elementFromPoint there returns the Inspector aside at 1680 wide
  // and a chrome span at 1860; 1980 is the first width where it returns the
  // canvas iframe itself. Height 1000 also clears the 898-tall frame. Below
  // that the probe's own reachability assertions fail on a window too small to
  // show the canvas rather than on anything the editor did.
  await page.setViewport({ width: 1980, height: 1000 });
  const frame = await openCanvas(page, baseUrl, { readySelector: DRAWER_TRIGGER_SELECTOR });
  await sleep(800);

  // Alt+click = the runtime chord. A plain click is editor selection and would
  // never open the drawer.
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
    { label: 'the drawer opened in the canvas', timeoutMs: 10000 },
  );
  await sleep(1000); // open animation + scroll lock settle

  // Where is the diagnostics object? SourceTreePreview's module realm and the
  // preview document are not guaranteed to be the same window.
  const diagnosticsHomes = {
    host: await page.evaluate(() => Boolean(window.__workbenchCanvasDiagnostics)),
    frame: await frame.evaluate(() => Boolean(window.__workbenchCanvasDiagnostics)),
  };
  console.log('[probe] diagnostics available on:', JSON.stringify(diagnosticsHomes));

  const emptyPoints = await frame.evaluate((selector) => {
    const content = document.querySelector(selector);
    if (!content) return { rect: null, own: [], filler: [] };
    const rect = content.getBoundingClientRect();
    const own = [];
    const filler = [];
    for (let row = 1; row <= 24; row += 1) {
      for (let column = 1; column <= 12; column += 1) {
        const x = rect.x + (rect.width * column) / 13;
        const y = rect.y + (rect.height * row) / 25;
        const top = document.elementFromPoint(x, y);
        if (!top || !content.contains(top)) continue;
        // The drawer's own box: nothing inside it claims this point.
        if (top === content) own.push({ x, y });
        // Or a layout wrapper with no text of its own -- still "empty space"
        // to the reporter, and still inside the drawer.
        else if ((top.textContent ?? '').trim() === '') filler.push({ x, y, tag: top.tagName.toLowerCase() });
      }
    }
    return { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, own, filler };
  }, DRAWER_CONTENT_SELECTOR);

  console.log('[probe] drawer content rect:', JSON.stringify(emptyPoints.rect));
  console.log(`[probe] points the drawer itself owns: ${emptyPoints.own.length}`);
  console.log(`[probe] empty-wrapper points inside the drawer: ${emptyPoints.filler.length}`);

  const candidates = [...emptyPoints.own, ...emptyPoints.filler];
  assert(candidates.length > 0, 'the drawer has at least one point of empty space');

  let from = null;
  let framePoint = null;
  for (const candidate of candidates) {
    const point = await canvasPagePoint(page, candidate);
    if (point.onCanvas) {
      from = point;
      framePoint = candidate;
      break;
    }
  }
  assert(from, `at least one empty drawer point is visible on the canvas (of ${candidates.length})`);
  console.log('[probe] pressing frame point:', JSON.stringify(framePoint));
  console.log('[probe] pressing page  point:', JSON.stringify({ x: from.x, y: from.y }));

  // Who claims this point, and which side of the drawer boundary are they on?
  const containing = await frame.evaluate((args) => {
    const content = document.querySelector(args.selector);
    const hits = [];
    for (const node of document.querySelectorAll('[data-wb-preview-node-id]')) {
      const rect = node.getBoundingClientRect();
      if (args.x < rect.x || args.x > rect.right || args.y < rect.y || args.y > rect.bottom) continue;
      hits.push({
        id: (node.getAttribute('data-wb-preview-node-id') ?? '').slice(-16),
        tag: node.tagName.toLowerCase(),
        area: Math.round(rect.width * rect.height),
        inDrawer: Boolean(content && content.contains(node)),
        text: (node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 24),
      });
    }
    return hits.sort((a, b) => a.area - b.area);
  }, { selector: DRAWER_CONTENT_SELECTOR, x: framePoint.x, y: framePoint.y });

  console.log('[probe] authored nodes whose rect contains the press point (smallest first):');
  for (const hit of containing) console.log('   ', JSON.stringify(hit));
  const smallest = containing[0];
  console.log('[probe] smallest claimant is',
    smallest ? (smallest.inDrawer ? 'INSIDE the drawer' : 'BEHIND the drawer') : '(none)');

  // The resolver's own answer. Try both coordinate spaces: whether the
  // diagnostics window shares a document with the preview decides which is
  // right, and guessing wrong prints a plausible but meaningless stack.
  const offset = await canvasFrameOffset(page);
  for (const [space, point] of [['frame', framePoint], ['page', from]]) {
    const resolution = await page.evaluate(({ x, y }) => (
      window.__workbenchCanvasDiagnostics?.describePointResolution?.(x, y) ?? null
    ), { x: point.x, y: point.y });
    console.log(`[probe] describePointResolution (${space} coords, offset ${JSON.stringify(offset)}):`,
      JSON.stringify(resolution, null, 2));
  }

  // Does the press commit a canvas selection at all? The arrow-key symptom says
  // it does not, which is the half worth confirming before fixing anything.
  const selectionBefore = await readActiveDesignLayerId(projectDir);
  await page.mouse.click(from.x, from.y);
  await sleep(1200);
  const selectionAfterClick = await readActiveDesignLayerId(projectDir);
  console.log('[probe] selection before press:', selectionBefore);
  console.log('[probe] selection after  press:', selectionAfterClick);

  const stillOpen = await frame.evaluate((selector) => Boolean(document.querySelector(selector)), DRAWER_CONTENT_SELECTOR);
  console.log('[probe] drawer still open after the press:', stillOpen);

  // And what does a drag from that point move?
  await page.evaluate(() => { window.__wbDragProbe = []; });
  await frame.evaluate(() => { window.__wbDragProbe = []; });
  const to = { x: from.x, y: from.y + 140 };
  await slowDrag(page, from, to);
  await sleep(1500);

  const hostRecords = await page.evaluate(() => window.__wbDragProbe ?? []);
  const frameRecords = await frame.evaluate(() => window.__wbDragProbe ?? []);
  console.log('[probe] frame drag records:', JSON.stringify(frameRecords, null, 2));
  console.log('[probe] host  drag records:', JSON.stringify(hostRecords, null, 2));
  const decision = await page.evaluate(() => (
    window.__workbenchCanvasDiagnostics?.getLastDropDecision?.() ?? null
  ));
  console.log('[probe] last drop decision:', JSON.stringify(decision, null, 2));
  console.log('[probe] selection after   drag:', await readActiveDesignLayerId(projectDir));

  // The regression this guards: candidate collection swept the whole preview
  // and kept any node whose rect contained the point, so a small node behind
  // the open drawer won the smallest-area sort and a press on the drawer
  // dragged page content out from under it.
  const drawerNodeId = await frame.evaluate((selector) => (
    document.querySelector(selector)?.getAttribute('data-wb-preview-node-id') ?? null
  ), DRAWER_CONTENT_SELECTOR);
  assert(drawerNodeId, 'the drawer content carries an authored node id');
  const dragged = decision?.draggedNodeId ?? '';
  console.log('[probe] drawer node id:', drawerNodeId);
  console.log('[probe] VERDICT:', dragged.startsWith(drawerNodeId)
    ? 'the press stayed inside the drawer'
    : `the press reached ${dragged} — outside the drawer`);
  assert(
    dragged.startsWith(drawerNodeId),
    `a press on empty drawer space resolves inside the drawer, not to ${dragged}`,
  );

  // --- the arrow-key face -------------------------------------------------
  // Reported as "after selecting in the drawer, arrow keys scroll the layer
  // tree instead of moving the node". Separate the two things that could cause
  // it: no selection was committed, or the selection exists and the key never
  // reaches the move handler.
  // This page's drawer does not use DrawerTitle — it heads its content with a
  // plain h2. Looking for `[data-slot="drawer-title"]` matched nothing and
  // skipped this whole half silently on every previous run.
  const titlePoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('#tool-heading');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!titlePoint) {
    console.log('[probe] no drawer heading to press; skipping the arrow-key half');
    return;
  }
  await page.mouse.click(titlePoint.x, titlePoint.y);
  await sleep(1200);
  const selectionAfterTitle = await readActiveDesignLayerId(projectDir);
  console.log('[probe] selection after pressing the drawer heading:', selectionAfterTitle);
  console.log('[probe] the heading press selected something inside the drawer:',
    selectionAfterTitle?.includes('0-0-1-1-2-1') ?? false);
  // Note: it does not. A press inside the drawer lands on the page's top-level
  // node. Arrow-key movement is measured on its own in
  // `drawer-arrow-key-move.spec.mjs`, which seeds a real drawer node instead of
  // depending on that press.

  const focusBefore = {
    host: await page.evaluate(() => {
      const el = document.activeElement;
      return el ? `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}` : null;
    }),
    frame: await frame.evaluate(() => {
      const el = document.activeElement;
      return el ? `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}` : null;
    }),
  };
  console.log('[probe] activeElement:', JSON.stringify(focusBefore, null, 2));

  const layerListBefore = await page.evaluate(() => {
    const list = document.querySelector('#wb-design-layer-list');
    return list ? { scrollTop: list.scrollTop, maxScroll: list.scrollHeight - list.clientHeight } : null;
  });
  await page.keyboard.press('ArrowDown');
  await sleep(1200);
  const layerListAfter = await page.evaluate(() => {
    const list = document.querySelector('#wb-design-layer-list');
    return list ? { scrollTop: list.scrollTop, maxScroll: list.scrollHeight - list.clientHeight } : null;
  });
  const selectionAfterArrow = await readActiveDesignLayerId(projectDir);
  console.log('[probe] layer list before ArrowDown:', JSON.stringify(layerListBefore));
  console.log('[probe] layer list after  ArrowDown:', JSON.stringify(layerListAfter));
  console.log('[probe] selection after  ArrowDown:', selectionAfterArrow);
  console.log('[probe] ArrowDown moved the node:', selectionAfterTitle !== selectionAfterArrow);
  console.log('[probe] ArrowDown scrolled the layer tree:',
    Boolean(layerListBefore && layerListAfter && layerListAfter.scrollTop !== layerListBefore.scrollTop));
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
