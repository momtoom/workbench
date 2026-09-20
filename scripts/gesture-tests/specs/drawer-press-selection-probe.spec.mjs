/**
 * What does a plain press inside an open Drawer actually select?
 *
 * `NEXT-STEPS-2026-08-07-CONDITIONAL-WRITEBACK.md` opens with "a press inside a
 * drawer selects the page's top-level node" and files it as the last portal
 * defect. Two things make that evidence unsafe:
 *
 *  - `drawer-portal-hit-test-probe.spec.mjs` drags before it presses, and the
 *    drag already leaves the selection at `:0`. Its readout cannot separate
 *    "the press selected `:0`" from "the press changed nothing".
 *  - it never presses anything *outside* a drawer, so it cannot tell a portal
 *    defect from the ordinary press rule.
 *
 * This probe presses from a known distinct selection, never drags, reads the
 * expected node id off the DOM under the pointer, and presses outside the
 * drawer as a control.
 *
 * Cmd+click only. A plain click cannot be measured this way: seeding
 * `selection.json` mid-run does not reach the editor, which reads that file at
 * load, so "the selection did not change" would be indistinguishable from "the
 * editor was already there". Cmd+click is safe to read because only the editor
 * ever writes a *new* value back.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { altClick, assert, canvasFrameOffset, metaClick, openCanvas, pagePointFor, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Tactics-001/TACTICS-002';

const DRAWER_TRIGGER_SELECTOR = '[aria-label="작전 도구 및 레이어 열기"]';
const DRAWER_CONTENT_SELECTOR = '[data-slot="drawer-content"]';
const PAGE_ID = 'page-mission-planning-workspace';
const SOURCE_FILE = 'src/workbench-pages/MissionPlanningWorkspace.tsx';
const LAYER_PREFIX = `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}`;

// A section behind the drawer. Distinct from `:0` and from anything in the
// drawer, so whatever a press does to the selection is visible.
const BEHIND_DRAWER_NODE_ID = '0-1-2';

export default async function drawerPressSelectionProbeSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });
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

  const results = [];

  // --- control: the same press with no drawer anywhere near it --------------
  // If this also lands on `:0`, the drawer is not what makes the press behave
  // this way and the open item is misfiled.
  const pageContent = await frameRectOf(frame, () => {
    const nodes = Array.from(document.querySelectorAll('[data-wb-preview-node-id]'));
    // Something deep, comfortably inside the viewport, big enough to hit.
    const hit = nodes
      .map((el) => ({ el, r: el.getBoundingClientRect(), depth: el.getAttribute('data-wb-preview-node-id').split('-').length }))
      .filter(({ r }) => r.width > 40 && r.height > 24 && r.y > 80 && r.y + r.height < window.innerHeight - 40)
      .sort((a, b) => b.depth - a.depth)[0];
    if (!hit) return null;
    return { x: hit.r.x, y: hit.r.y, w: hit.r.width, h: hit.r.height };
  });
  assert(pageContent, 'the page renders content deep enough to press outside any drawer');
  results.push(await pressAt(page, frame, projectDir, 'Cmd+click page content, drawer closed', pageContent, { meta: true }));

  // --- the drawer ------------------------------------------------------------
  await openDrawer(page, frame);

  const headingRect = await frameRectOf(frame, () => {
    const el = document.querySelector('#tool-heading');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  assert(headingRect, 'the drawer heading (#tool-heading) is visible');
  results.push(await pressAt(page, frame, projectDir, 'Cmd+click the drawer heading', headingRect, { meta: true }));

  if (!(await isDrawerOpen(frame))) {
    console.log('[probe] the press closed the drawer; reopening');
    await openDrawer(page, frame);
  }

  const rowRect = await frameRectOf(frame, () => {
    const el = document.querySelector('[data-slot="drawer-content"] button');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (rowRect) {
    results.push(await pressAt(page, frame, projectDir, 'Cmd+click a control inside the drawer', rowRect, { meta: true }));
  }

  console.log('\n[probe] ==== what Cmd+click selects ====');
  for (const result of results) {
    console.log(`[probe] ${result.label}`);
    console.log(`[probe]   deepest node under the pointer: ${short(result.deepestNodeId)}`);
    // `before` is what this probe wrote to selection.json, not necessarily what
    // the editor holds — it only reads that file at load. `after` is
    // trustworthy: nothing but the editor writes it back.
    console.log(`[probe]   seeded into selection.json    : ${short(result.before)}`);
    console.log(`[probe]   selection after  the press    : ${short(result.after)}`);
    console.log(`[probe]   VERDICT: ${result.verdict}`);
  }

  const cmdOutside = results.find((r) => r.label === 'Cmd+click page content, drawer closed');
  const cmdInside = results.find((r) => r.label === 'Cmd+click the drawer heading');
  console.log('\n[probe] CONCLUSION');
  console.log(`[probe]   Cmd+click outside a drawer: ${cmdOutside.verdict}`);
  console.log(`[probe]   Cmd+click inside  a drawer: ${cmdInside.verdict}`);
  console.log(`[probe]   ${cmdOutside.verdict === cmdInside.verdict
    ? 'Same rule on both surfaces.'
    : 'The portal surface resolves differently — see resolveSourceTreePreviewSelectionHit, ' +
      "which returns normalization 'visual' for every portal hit and so always applies the " +
      'component-boundary clamp.'}`);

  assert(
    cmdInside.after && cmdInside.after !== `${LAYER_PREFIX}:0`,
    `Cmd+click inside the drawer resolves into the drawer, not to the page's top-level node ` +
    `(got ${short(cmdInside.after)})`,
  );
}

async function pressAt(page, frame, projectDir, label, frameRect, { meta = false, seedNodeId = BEHIND_DRAWER_NODE_ID } = {}) {
  // Start from a node behind the drawer — never `:0`, which is the value being
  // tested for, and never a drawer node, so a no-op press is distinguishable.
  await setActiveDesignLayer(projectDir, `${LAYER_PREFIX}:${seedNodeId}`);
  const before = await readActiveDesignLayerId(projectDir);

  const offset = await canvasFrameOffset(page);
  const point = {
    x: offset.x + frameRect.x + frameRect.w / 2,
    y: offset.y + frameRect.y + frameRect.h / 2,
  };
  const onCanvas = await page.evaluate(({ x, y }) => (
    document.elementFromPoint(x, y)?.classList?.contains('wb-source-visual-preview-frame') ?? false
  ), point);
  assert(onCanvas, `${label} is reachable on the canvas, not behind the shell chrome`);

  const deepestNodeId = await frame.evaluate(({ x, y }) => {
    for (const el of document.elementsFromPoint(x, y)) {
      let owner = el;
      while (owner && !owner.getAttribute?.('data-wb-preview-node-id')) owner = owner.parentElement;
      const id = owner?.getAttribute('data-wb-preview-node-id');
      if (id) return id;
    }
    return null;
  }, { x: frameRect.x + frameRect.w / 2, y: frameRect.y + frameRect.h / 2 });

  if (meta) await metaClick(page, point);
  else await page.mouse.click(point.x, point.y);
  const after = await waitFor(
    async () => {
      const selected = await readActiveDesignLayerId(projectDir);
      return selected && selected !== before ? selected : null;
    },
    { label: `${label} press to change the selection`, timeoutMs: 6000 },
  ).catch(() => null) ?? await readActiveDesignLayerId(projectDir);

  return { label, deepestNodeId, before, after, verdict: verdictFor(after, deepestNodeId, before) };
}

function verdictFor(after, deepestNodeId, before) {
  if (!after) return 'no selection at all';
  if (after === before) return 'left the previous selection untouched';
  if (after === deepestNodeId) return 'selected exactly what was pressed';
  if (after === `${LAYER_PREFIX}:0`) return "selected the page's top-level node";
  if (deepestNodeId && deepestNodeId.startsWith(`${after}-`)) {
    return 'selected an ancestor of what was pressed';
  }
  return 'selected something unrelated to the pointer';
}

async function frameRectOf(frame, getRect) {
  return frame.evaluate(getRect);
}

async function isDrawerOpen(frame) {
  return frame.evaluate((selector) => {
    const content = document.querySelector(selector);
    return Boolean(content && content.getBoundingClientRect().width > 0);
  }, DRAWER_CONTENT_SELECTOR);
}

async function openDrawer(page, frame) {
  const triggerPoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="작전 도구 및 레이어 열기"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  assert(triggerPoint, 'the drawer trigger is visible in the canvas');
  await altClick(page, triggerPoint);
  await waitFor(() => isDrawerOpen(frame), {
    label: 'the drawer opened in the canvas',
    timeoutMs: 15000,
  });
  await sleep(1000); // open animation + scroll lock settle
}

function short(layerId) {
  return layerId ? layerId.replace(`${LAYER_PREFIX}:`, '') : String(layerId);
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
