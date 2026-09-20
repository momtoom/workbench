/**
 * Diagnostic for "canvas drag moves the wrong node".
 *
 * Drives the repro from `NEXT-STEPS-2026-08-07-CANVAS-DRAG-TARGET.md` against
 * the committed fixture and prints what the editor decided. What it established:
 *
 *   - the drag starts in `handleDocumentPointerDown`, NOT the
 *     `handlePointerDownCapture` branch the handoff pointed at -- probes added
 *     there never fire for this gesture;
 *   - at drag start `layerId` and `selectedNodeId` are already the same node,
 *     so nothing diverges later in the move path;
 *   - that node is the same one whichever cell is pressed. Set `WB_PROBE_CELL`
 *     to compare: cell 0 and cell 3 both drag `…1-0-2-0-1-0`.
 *
 * Together that confirms the handoff's unverified hypothesis: pressing a bare
 * `<div>` does not change the selection, and the drag moves whatever was
 * already selected.
 *
 * It asserts only what would make the readout meaningless -- that the cell was
 * pressable and that a drag was actually delivered -- rather than encoding
 * today's behavior as the expectation. Once the product decision lands, the
 * assertion to add is that the dragged node is the node that was pressed.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, canvasPagePoint, openCanvas, readActiveDesignLayerId, readFixtureSelection, scrollFrameSelectorIntoView, selectFixtureDesignPage, sleep, slowDrag, waitForCanvasFrame, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Test-0005';

// The Ledger index nav in ComponentsCatalog. Cells are bare `display: block`
// divs with no authored class, which is what makes them lose the hit test.
const NAV_SELECTOR = 'nav[aria-label="Ledger index"]';
const PAGE_ID = 'page-components-catalog';
const SOURCE_FILE = 'src/workbench-pages/ComponentsCatalog.tsx';

export default async function canvasDragTargetProbeSpec({ page, baseUrl, projectDir }) {
  // The fixture is committed without session state on purpose, so nothing
  // selects a page and the canvas never mounts. Seed the selection the repro
  // describes instead of relying on whatever the last developer had open.
  await seedSelection(projectDir);
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });

  let frame = await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });

  await frame.waitForSelector(NAV_SELECTOR, { timeout: 30000 });
  // The nav sits thousands of pixels down the catalog page. `elementFromPoint`
  // only answers for points in the viewport, so measure after scrolling.
  await scrollFrameSelectorIntoView(frame, NAV_SELECTOR);
  await sleep(500);

  const cells = await frame.evaluate((selector) => {
    const nav = document.querySelector(selector);
    if (!nav) return [];
    return Array.from(nav.children).map((child, index) => {
      const rect = child.getBoundingClientRect();
      return {
        index,
        tag: child.tagName.toLowerCase(),
        className: child.className || '',
        text: (child.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    });
  }, NAV_SELECTOR);

  assert(cells.length > 0, `the Ledger index nav has children (found ${cells.length})`);
  const wantedIndex = Number(process.env.WB_PROBE_CELL ?? '0');
  const foundations = cells[wantedIndex] ?? cells[0];
  console.log('[probe] nav cells:', JSON.stringify(cells.map((c) => ({ i: c.index, t: c.text })), null, 0));
  console.log('[probe] pressing cell:', JSON.stringify(foundations));

  // Every point the browser agrees belongs to the div itself. The handoff
  // measured Foundations at 36/96 self-hits, so the centre is not guaranteed —
  // and a self-hit near the frame's left edge still sits behind the shell's
  // sidebar, where real pointer input never reaches the canvas.
  const selfHits = await frame.evaluate((args) => {
    const { rect } = args;
    const nav = document.querySelector(args.selector);
    const cell = nav?.children?.[args.index];
    if (!cell) return [];
    const points = [];
    for (let row = 1; row <= 12; row += 1) {
      for (let column = 1; column <= 12; column += 1) {
        const x = rect.x + (rect.width * column) / 13;
        const y = rect.y + (rect.height * row) / 13;
        if (document.elementFromPoint(x, y) === cell) points.push({ x, y });
      }
    }
    return points;
  }, { rect: foundations.rect, selector: NAV_SELECTOR, index: foundations.index });

  assert(
    selfHits.length > 0,
    `the pressed cell has at least one point it owns (cell ${foundations.index})`,
  );
  console.log(`[probe] self-hits: ${selfHits.length}/144 points inside the cell`);

  const from = await firstVisibleCanvasPoint(page, selfHits);
  const hitPoint = selfHits.find((point) => {
    const candidate = point;
    return candidate;
  }) ?? selfHits[0];
  assert(
    from,
    `at least one of the cell's ${selfHits.length} self-hit points is visible on the canvas`,
  );
  console.log('[probe] pressing page point:', JSON.stringify({ x: from.x, y: from.y }));

  // Read the selection at every stage. Without this the run cannot tell
  // "the press selected the cell and the drag moved something else" from
  // "the press never selected anything and the drag moved the old selection".
  const selectionBeforeClick = await readActiveDesignLayerId(projectDir);
  if (process.env.WB_PROBE_PRESELECT !== '0') {
    // Canvas click does not select the pressed node, so it cannot be used to set
    // up "given this selection, what gets dragged". Write the selection the
    // editor reads on load instead, and reopen.
    await setActiveDesignLayer(projectDir, `1-0-2-${foundations.index}`);
    await page.reload({ waitUntil: 'networkidle2' });
    // The reload detaches the old preview frame; every later frame.evaluate
    // would throw "detached Frame" against the stale handle.
    frame = await waitForCanvasFrame(page, 60000);
    await frame.waitForSelector(NAV_SELECTOR, { timeout: 30000 });
    await scrollFrameSelectorIntoView(frame, NAV_SELECTOR);
    await sleep(1200);
    console.log('[probe] preselected layer:', await readActiveDesignLayerId(projectDir));
  } else {
    await page.mouse.click(from.x, from.y);
  }
  await sleep(1200);
  const selectionAfterClick = await readActiveDesignLayerId(projectDir);
  console.log('[probe] selection before click:', selectionBeforeClick);
  console.log('[probe] selection after  click:', selectionAfterClick);
  console.log('[probe] click selected the pressed cell:',
    String(selectionAfterClick ?? '').endsWith(`1-0-2-${foundations.index}`));

  const target = cells.find((cell) => cell.index === foundations.index + 3) ?? cells[cells.length - 1];
  const to = await firstVisibleCanvasPoint(page, [
    { x: target.rect.x + target.rect.width / 2, y: target.rect.y + target.rect.height / 2 },
    { x: target.rect.x + target.rect.width * 0.75, y: target.rect.y + target.rect.height / 2 },
    { x: target.rect.x + target.rect.width * 0.9, y: target.rect.y + target.rect.height / 2 },
  ]);
  assert(to, 'the drop target is visible on the canvas');
  console.log('[probe] dropping on cell', target.index, JSON.stringify({ x: to.x, y: to.y }));

  // The preview runs in its own document, so `SourceTreePreview`'s pointerdown
  // handler and `DesignEditor`'s move handler write to two different windows.
  // Arm and read both, or the pointerdown half is silently missing.
  await page.evaluate(() => { window.__wbDragProbe = []; });
  await frame.evaluate(() => { window.__wbDragProbe = []; });
  await slowDrag(page, from, to);
  await sleep(1500);

  const selectionAfterDrag = await readActiveDesignLayerId(projectDir);
  console.log('[probe] selection after   drag:', selectionAfterDrag);
  const hostRecords = await page.evaluate(() => window.__wbDragProbe ?? []);
  const frameRecords = await frame.evaluate(() => window.__wbDragProbe ?? []);
  const records = [...frameRecords, ...hostRecords];
  console.log('[probe] frame records:', JSON.stringify(frameRecords, null, 2));
  console.log('[probe] host records:', JSON.stringify(hostRecords, null, 2));

  // The editor already records which press branch started the drag, including a
  // stack. That is the question the two probes were meant to answer.
  const decision = await page.evaluate(() => (
    window.__workbenchCanvasDiagnostics?.getLastDropDecision?.() ?? null
  ));
  console.log('[probe] last drop decision:', JSON.stringify(decision, null, 2));

  // Why that node? Ask the resolver what it sees at the press point, and
  // measure whose rects actually contain it.
  const resolution = await page.evaluate(({ x, y }) => (
    window.__workbenchCanvasDiagnostics?.describePointResolution?.(x, y) ?? null
  ), { x: from.x, y: from.y });
  console.log('[probe] point resolution at press:', JSON.stringify(resolution, null, 2));

  const containing = await frame.evaluate((args) => {
    const nodes = Array.from(document.querySelectorAll('[data-wb-preview-node-id]'));
    const hits = [];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (args.x >= rect.x && args.x <= rect.right && args.y >= rect.y && args.y <= rect.bottom) {
        hits.push({
          id: node.getAttribute('data-wb-preview-node-id'),
          tag: node.tagName.toLowerCase(),
          area: Math.round(rect.width * rect.height),
          rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
          text: (node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 22),
        });
      }
    }
    return hits.sort((a, b) => a.area - b.area);
  }, { x: hitPoint.x, y: hitPoint.y });
  console.log('[probe] nodes whose rect contains the press point (smallest first):');
  for (const hit of containing) console.log('   ', JSON.stringify(hit));

  const move = records.find((record) => record.phase === 'move');
  assert(move, `the drag reached moveDesignPreviewNodeToParent (got ${records.length} records)`);
  assert(decision?.dragStart, 'the editor recorded which press branch started the drag');

  const pressedNodeSuffix = `1-0-2-${foundations.index}`;
  const draggedNodeId = move.detail.committedNodeId ?? '';
  console.log('[probe] drag started at:', decision.dragStart.stack.trim());
  console.log('[probe] VERDICT:', draggedNodeId.endsWith(pressedNodeSuffix)
    ? `the pressed cell ${foundations.index} is the node that moved`
    : `pressed cell ${foundations.index} (…${pressedNodeSuffix}) but moved …${draggedNodeId.split(':').pop()}`);

  // The regression this guards: the compact-shell heuristic used to treat the
  // whole nav as one control and drag its first link in document order, so a
  // selected cell was discarded and every cell moved the same node.
  assert(
    draggedNodeId.endsWith(pressedNodeSuffix),
    `the selected cell ${foundations.index} is what moved, not ${draggedNodeId.split(':').pop()}`,
  );
}

/** The first candidate the host document agrees is on the canvas, or null. */
async function firstVisibleCanvasPoint(page, framePoints) {
  for (const framePoint of framePoints) {
    const point = await canvasPagePoint(page, framePoint);
    if (point.onCanvas) return point;
  }
  return null;
}

async function setActiveDesignLayer(projectDir, nodeId) {
  const { readFile } = await import('node:fs/promises');
  const selection = await readFixtureSelection(projectDir);
  const layerId = `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:${nodeId}`;
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [layerId],
  };
  await writeFixtureSelection(projectDir, selection);
}

async function seedSelection(projectDir) {
  const workbenchDir = join(projectDir, '.workbench');
  await mkdir(workbenchDir, { recursive: true });
  const selection = {
    schemaVersion: '0.1',
    activeTarget: null,
    selectedTargets: [],
    updatedAt: new Date().toISOString(),
    extensions: {},
  };
  await writeFixtureSelection(projectDir, selection);
}
