/**
 * The playground's four-panel split must keep its runtime separator inside the
 * real Design canvas. Workbench projects authored Resizable children through
 * source selection anchors, so this covers the unresolved-slot fallback rather
 * than the simpler standalone page-preview path.
 */
import {
  altDrag,
  assert,
  canvasPagePoint,
  openCanvas,
  readActiveDesignLayerId,
  selectFixtureDesignPage,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'Test-0010';

export default async function test0010ResizableDesignPreviewSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-untitled-page-3',
    sourceFile: 'src/workbench-pages/DesignProcessWithAI.tsx',
    // The playground is a four-panel split that collapses to a single column on
    // a phone, where no drag can widen the Layers panel by 30px. The artboard
    // has to be a desktop one for the separator to mean anything, and the
    // fixture cannot supply it: selection.json is untracked, so the preview size
    // is whatever the project was last left on in the app.
    viewport: { height: 900, presetId: 'full', width: 1440 },
  });
  const frame = await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });

  const readSeparator = () => frame.evaluate(() => {
    const separator = document.querySelector('[role="separator"][aria-label="레이어 트리 너비 조절"]');
    const root = separator?.closest('.astryx-wb-resizable');
    const panel = root?.querySelector('.astryx-wb-resizable__panel');
    const pill = separator?.querySelector('.astryx-resize-handle-pill');
    if (!separator || !panel || !pill) return null;
    const separatorRect = separator.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const separatorStyle = getComputedStyle(separator);
    const pillStyle = getComputedStyle(pill);
    return {
      center: {
        x: separatorRect.left + separatorRect.width / 2,
        y: separatorRect.top + separatorRect.height / 2,
      },
      panelWidth: panelRect.width,
      separatorBackground: separatorStyle.backgroundColor,
      separatorBoxShadow: separatorStyle.boxShadow,
      separatorWidth: separatorStyle.width,
      pill: {
        boxShadow: pillStyle.boxShadow,
        display: pillStyle.display,
        height: pillRect.height,
        opacity: Number.parseFloat(pillStyle.opacity),
        visibility: pillStyle.visibility,
        width: pillRect.width,
      },
      separatorCount: document.querySelectorAll('.wb-play-frame [role="separator"]').length,
    };
  });

  const before = await waitFor(readSeparator, {
    label: 'the projected playground resize separator',
    timeoutMs: 10000,
    intervalMs: 80,
  });
  assert(before.separatorCount === 3, `all three panel separators render in Design (${before.separatorCount})`);
  assert(
    before.separatorWidth === '1px' && before.separatorBackground !== 'rgba(0, 0, 0, 0)',
    `the quiet 1px separator line remains visible (${before.separatorWidth}, ${before.separatorBackground})`,
  );
  assert(
    before.pill.display === 'none' && before.pill.width === 0 && before.pill.height === 0,
    `the floating separator pill stays hidden (${JSON.stringify(before.pill)})`,
  );
  assert(
    before.separatorBoxShadow === 'none' && before.pill.boxShadow === 'none',
    `the separator and pill have no shadow (${before.separatorBoxShadow}, ${before.pill.boxShadow})`,
  );

  // Center the separator through every scroll-owning ancestor inside the
  // projected page. Pages may mix an iframe document scroller with their own
  // full-height preview scroller, so relying on scrollIntoView alone is not a
  // stable real-input setup.
  await frame.evaluate(() => {
    const target = document.querySelector('[role="separator"][aria-label="레이어 트리 너비 조절"]');
    if (!(target instanceof HTMLElement)) return;
    const owners = [];
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight + 1) owners.push(node);
    }
    if (
      document.scrollingElement instanceof HTMLElement &&
      !owners.includes(document.scrollingElement) &&
      document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 1
    ) owners.push(document.scrollingElement);
    for (const owner of owners) {
      const targetRect = target.getBoundingClientRect();
      const ownerRect = owner.getBoundingClientRect();
      owner.scrollTop += targetRect.top - ownerRect.top - (owner.clientHeight - targetRect.height) / 2;
    }
  });
  await sleep(120);
  const centered = await readSeparator();
  // If the iframe itself sits inside an overflowing Design viewport, center
  // the already-scrolled frame point in that exact iframe's host ancestor.
  await page.evaluate((frameY) => {
    const iframe = document.querySelector('iframe.wb-source-visual-preview-frame');
    const scroller = iframe?.closest('.wb-design-viewport-frame');
    if (!(iframe instanceof HTMLIFrameElement) || !(scroller instanceof HTMLElement)) return;
    const iframeRect = iframe.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    scroller.scrollTop += iframeRect.top - scrollerRect.top + frameY - scroller.clientHeight / 2;
  }, centered.center.y);
  await sleep(350);
  const visible = await readSeparator();
  const from = await canvasPagePoint(page, visible.center);
  assert(from.onCanvas, `the visible resize handle belongs to the canvas (${JSON.stringify(from)})`);
  const selectionBefore = await readActiveDesignLayerId(projectDir);
  await altDrag(page, from, { x: from.x + 48, y: from.y }, { steps: 8, stepDelayMs: 35 });
  await sleep(250);
  const after = await waitFor(
    async () => {
      const current = await readSeparator();
      return current && current.panelWidth >= before.panelWidth + 30 ? current : null;
    },
    { label: 'the Layers panel to resize in Design', timeoutMs: 5000, intervalMs: 80 },
  );
  assert(
    after.panelWidth >= before.panelWidth + 30,
    `Option-drag resizes the projected panel (${before.panelWidth}px -> ${after.panelWidth}px)`,
  );
  assert(
    await readActiveDesignLayerId(projectDir) === selectionBefore,
    'runtime panel resizing leaves the editor selection unchanged',
  );
}
