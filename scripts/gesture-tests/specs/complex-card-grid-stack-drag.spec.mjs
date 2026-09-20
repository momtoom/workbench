/**
 * Regression: a Stack that owns a rich CardGrid must start dragging without
 * synchronously copying every computed CSS property from hundreds of rendered
 * descendants. Complex subtrees use a bounded, radial-fade visual snapshot;
 * small nodes keep the full-fidelity computed-style clone.
 */
import { assert, canvasFrameOffset, openCanvas, readFixtureSelection, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'NEW SG Design System Test';

export default async function complexCardGridStackDragSpec({ page, baseUrl, projectDir }) {
  // The runner defaults to 1680x1000, where the canvas frame's right edge sits
  // behind the Inspector aside and elementFromPoint there answers shell chrome
  // rather than the canvas iframe (2026-09-03 handoff, §3.2). A point measured
  // inside the frame then presses nothing, which reads as an editor failure.
  // 1980x1000 is the first size that contains the frame and clears the aside.
  await page.setViewport({ width: 1980, height: 1000 });
  let frame = await openCanvas(page, baseUrl, { readySelector: '.card-grid' });

  const readCandidate = () => frame.evaluate(() => {
    const candidates = [];
    for (const grid of document.querySelectorAll('.card-grid')) {
      for (let element = grid.parentElement; element && element !== document.body; element = element.parentElement) {
        const id = element.getAttribute?.('data-wb-preview-node-id');
        if (!id || id.endsWith('-text') || !element.classList.contains('stack')) continue;
        const descendantElements = element.querySelectorAll('*').length;
        if (descendantElements <= 120) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 20 || rect.height <= 20) continue;
        const ancestorIds = [];
        const seenIds = new Set([id]);
        for (
          let ancestor = element.parentElement;
          ancestor && ancestor !== document.body;
          ancestor = ancestor.parentElement
        ) {
          const ancestorId = ancestor.getAttribute?.('data-wb-preview-node-id');
          if (!ancestorId || ancestorId.endsWith('-text') || seenIds.has(ancestorId)) continue;
          seenIds.add(ancestorId);
          ancestorIds.push(ancestorId);
        }
        candidates.push({
          ancestorIds: ancestorIds.reverse(),
          descendantElements,
          id,
          markupCharacters: element.outerHTML.length,
        });
        break;
      }
    }
    candidates.sort((left, right) => left.descendantElements - right.descendantElements);
    return candidates[0] ?? null;
  });

  const candidate = await waitFor(readCandidate, {
    label: 'a Stack containing a complex CardGrid',
    timeoutMs: 60000,
  });
  assert(
    candidate.descendantElements > 120,
    `the target Stack is complex enough for snapshot mode (${candidate.descendantElements} descendants)`,
  );

  const { readFile, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const selectionState = await readFixtureSelection(projectDir);
  selectionState.extensions = {
    ...selectionState.extensions,
    activeDesignLayerId: candidate.id,
    designPreviewDrillPath: candidate.ancestorIds,
    selectedDesignLayerIds: [],
  };
  await writeFixtureSelection(projectDir, selectionState);

  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  frame = await waitFor(
    async () => {
      const candidateFrame = page.frames().find((entry) => entry !== page.mainFrame());
      if (!candidateFrame) return null;
      const ready = await candidateFrame
        .evaluate(() => !!document.querySelector('.wb-source-visual-preview'))
        .catch(() => false);
      return ready ? candidateFrame : null;
    },
    { label: 'the canvas to come back after selecting the Stack', timeoutMs: 60000 },
  );

  await frame.evaluate((id) => {
    document
      .querySelector(`[data-wb-preview-node-id="${id}"]`)
      ?.scrollIntoView({ block: 'center', inline: 'center' });
  }, candidate.id);
  await sleep(900);

  const target = await frame.evaluate((id) => {
    const element = document.querySelector(`[data-wb-preview-node-id="${id}"]`);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    let pressPoint = null;
    for (let y = rect.top + 4; y < rect.bottom - 4 && !pressPoint; y += 4) {
      for (let x = rect.left + 4; x < rect.right - 4; x += 4) {
        const selectable = document
          .elementsFromPoint(x, y)
          .find((candidate) => candidate.hasAttribute?.('data-wb-preview-node-id'));
        if (selectable?.getAttribute('data-wb-preview-node-id') !== id) continue;
        pressPoint = { x, y };
        break;
      }
    }
    return {
      descendantElements: element.querySelectorAll('*').length,
      h: rect.height,
      left: rect.left,
      pressPoint,
      top: rect.top,
      w: rect.width,
    };
  }, candidate.id);
  assert(target, `selected Stack ${candidate.id} is rendered after reload`);
  assert(target.pressPoint, 'the selected Stack exposes a direct drag surface between its children');

  const offset = await canvasFrameOffset(page);
  const from = {
    x: offset.x + target.pressPoint.x,
    y: offset.y + target.pressPoint.y,
  };
  await page.mouse.move(from.x, from.y);
  await sleep(120);
  await page.mouse.down();
  await sleep(120);

  const activationStartedAt = Date.now();
  await Promise.race([
    page.mouse.move(from.x + 8, from.y),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('complex Stack drag activation blocked the app for over 3000ms')), 3000);
    }),
  ]);
  const activationMs = Date.now() - activationStartedAt;

  const ghost = await waitFor(
    () => frame.evaluate(() => {
      const element = document.querySelector('.wb-source-visual-drag-ghost');
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        height: rect.height,
        left: rect.left,
        maskImage: style.maskImage || style.webkitMaskImage,
        maskOriginX: Number.parseFloat(
          style.getPropertyValue('--wb-source-visual-drag-ghost-origin-x'),
        ),
        maskOriginY: Number.parseFloat(
          style.getPropertyValue('--wb-source-visual-drag-ghost-origin-y'),
        ),
        opacity: Number.parseFloat(style.opacity),
        preview: element.classList.contains('wb-source-visual-drag-ghost--preview'),
        snapshot: element.classList.contains('wb-source-visual-drag-ghost--snapshot'),
        top: rect.top,
        width: rect.width,
      };
    }),
    { label: 'the complex Stack snapshot ghost', timeoutMs: 2500, intervalMs: 40 },
  );

  assert(activationMs < 1500, `drag activation stays responsive (${activationMs}ms)`);
  assert(ghost.preview, 'the drag uses a visual preview instead of the text fallback');
  assert(ghost.snapshot, 'the complex Stack uses bounded snapshot mode');
  assert(ghost.width <= 420.5, `snapshot width is bounded (${ghost.width}px)`);
  assert(ghost.height <= 280.5, `snapshot height is bounded (${ghost.height}px)`);
  assert(ghost.opacity <= 0.35, `snapshot alpha stays subdued (${ghost.opacity})`);
  assert(
    Math.abs(ghost.maskOriginX) <= 0.5 && Math.abs(ghost.maskOriginY) <= 0.5,
    `the component origin anchors the quarter-pie mask at the cursor ` +
      `(${ghost.maskOriginX}, ${ghost.maskOriginY} in ${ghost.width}×${ghost.height})`,
  );
  assert(
    Math.abs(ghost.left - (target.pressPoint.x + 8)) <= 1 &&
      Math.abs(ghost.top - target.pressPoint.y) <= 1,
    `the ghost component origin follows the pointer ` +
      `(ghost ${ghost.left},${ghost.top}; pointer ${target.pressPoint.x + 8},${target.pressPoint.y})`,
  );
  assert(
    ghost.maskImage.includes('radial-gradient') && ghost.maskImage.includes('circle'),
    `snapshot edges use a circular radial fade (${ghost.maskImage || 'none'})`,
  );

  await page.keyboard.press('Escape');
  await waitFor(
    () => frame.evaluate(() => (
      !document.querySelector('.wb-source-visual-drag-ghost') &&
      !document.querySelector('[data-wb-drop-layout-transition]')
    )),
    { label: 'Escape to restore the authored layout', timeoutMs: 5000, intervalMs: 40 },
  );

  const responsive = await frame.evaluate(() => document.querySelectorAll('.card-grid-cell').length);
  assert(responsive > 0, `the canvas remains responsive after Escape (${responsive} card cells)`);
}
