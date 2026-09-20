/**
 * Regression: ending an active canvas drag with Escape must remount the
 * selection overlay at the selected node's current geometry. The overlay
 * effect keys off drag-active state so it cannot retain the hidden or stale
 * snapshot that existed while the ghost was visible.
 */
import {
  assert,
  canvasFrameOffset,
  metaClick,
  openCanvas,
  readActiveDesignLayerId,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'Astryx-003';

export default async function selectionRingDragExitSpec({ page, baseUrl, projectDir }) {
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  const target = await waitFor(
    () => frame.evaluate(() => {
      for (const element of document.querySelectorAll('[data-wb-preview-node-id]')) {
        const id = element.getAttribute('data-wb-preview-node-id');
        const rect = element.getBoundingClientRect();
        if (!id || id.endsWith('-text') || rect.width < 80 || rect.height < 40) continue;
        if (rect.width > innerWidth * 0.85 && rect.height > innerHeight * 0.85) continue;
        const parent = element.parentElement?.closest('[data-wb-preview-node-id]');
        if (!parent) continue;
        const parentRect = parent.getBoundingClientRect();
        const outside = [
          { x: parentRect.left - 24, y: parentRect.top + parentRect.height / 2 },
          { x: parentRect.right + 24, y: parentRect.top + parentRect.height / 2 },
          { x: parentRect.left + parentRect.width / 2, y: parentRect.top - 24 },
          { x: parentRect.left + parentRect.width / 2, y: parentRect.bottom + 24 },
        ].find((point) => (
          point.x > 8 &&
          point.x < innerWidth - 8 &&
          point.y > 8 &&
          point.y < innerHeight - 8 &&
          !parent.contains(document.elementFromPoint(point.x, point.y))
        ));
        if (!outside) continue;
        if (rect.right < 20 || rect.bottom < 20 || rect.left > innerWidth - 20 || rect.top > innerHeight - 20) continue;
        const x = Math.max(8, Math.min(innerWidth - 8, rect.left + 12));
        const y = Math.max(8, Math.min(innerHeight - 8, rect.top + 12));
        const selectable = document.elementsFromPoint(x, y)
          .find((candidate) => candidate.hasAttribute?.('data-wb-preview-node-id'));
        const selectableId = selectable?.getAttribute('data-wb-preview-node-id');
        if (!selectableId || selectableId.endsWith('-text')) continue;
        return { outside, x, y };
      }
      return null;
    }),
    { label: 'a visible source-backed drag target', timeoutMs: 60000 },
  );
  const offset = await canvasFrameOffset(page);
  const point = { x: offset.x + target.x, y: offset.y + target.y };

  const selectedBeforeClick = await readActiveDesignLayerId(projectDir);
  await metaClick(page, point);
  const selectedId = await waitFor(
    async () => {
      const selected = await readActiveDesignLayerId(projectDir);
      return selected && selected !== selectedBeforeClick ? selected : null;
    },
    { label: 'the exact canvas selection to persist', timeoutMs: 5000, intervalMs: 80 },
  );

  const readAlignment = () => frame.evaluate((id) => {
    const selected = document.querySelector(`[data-wb-preview-node-id="${id}"]`);
    const ring = document.querySelector(
      '.wb-source-visual-selection-overlay:not(.wb-source-visual-selection-overlay--hover) ' +
        '.wb-source-visual-selection-ring--primary',
    );
    if (!selected || !ring) return null;
    const overlay = ring.closest('.wb-source-visual-selection-overlay');
    const ringRect = ring.getBoundingClientRect();
    return {
      dragging: document.querySelector('.wb-source-visual-preview')
        ?.classList.contains('wb-source-visual-node-drag-active') ?? false,
      height: ringRect.height,
      left: ringRect.left,
      opacity: overlay ? Number.parseFloat(getComputedStyle(overlay).opacity) : -1,
      top: ringRect.top,
      width: ringRect.width,
    };
  }, selectedId);
  const before = await waitFor(readAlignment, {
    label: 'the selection ring before dragging',
    timeoutMs: 5000,
    intervalMs: 50,
  });
  assert(before.opacity > 0.9, `the selection ring is visible before dragging (${before.opacity})`);

  await page.mouse.move(point.x, point.y);
  await sleep(120);
  await page.mouse.down();
  await page.mouse.move(point.x + 8, point.y);
  await waitFor(
    () => frame.evaluate(() => !!document.querySelector('.wb-source-visual-drag-ghost')),
    { label: 'the active visual drag ghost', timeoutMs: 2500, intervalMs: 40 },
  );
  await page.mouse.move(offset.x + target.outside.x, offset.y + target.outside.y);
  await sleep(220);
  await page.mouse.move(point.x, point.y);
  await sleep(220);
  const originAfterReentry = await frame.evaluate((id, targetPoint) => {
    const candidates = Array.from(
      document.querySelectorAll(`[data-wb-preview-node-id="${id}"]`),
    );
    const nearest = candidates.sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      return Math.hypot(
        leftRect.left + leftRect.width / 2 - targetPoint.x,
        leftRect.top + leftRect.height / 2 - targetPoint.y,
      ) - Math.hypot(
        rightRect.left + rightRect.width / 2 - targetPoint.x,
        rightRect.top + rightRect.height / 2 - targetPoint.y,
      );
    })[0];
    return nearest
      ? {
          connected: nearest.isConnected,
          inlineOpacity: nearest.style.opacity,
          opacity: Number.parseFloat(getComputedStyle(nearest).opacity),
        }
      : null;
  }, selectedId, { x: target.x, y: target.y });
  const hiddenOriginIds = await frame.evaluate(() => Array.from(
    document.querySelectorAll('[data-wb-preview-node-id]'),
  ).filter((element) => element.style.opacity === '0').map((element) => (
    element.getAttribute('data-wb-preview-node-id')
  )));
  const dropDecision = await page.evaluate(
    () => window.__workbenchCanvasDiagnostics?.getLastDropDecision?.() ?? null,
  );
  assert(
    originAfterReentry?.connected &&
      originAfterReentry.inlineOpacity === '0' &&
      originAfterReentry.opacity === 0,
    `the recreated drag origin stays hidden after leaving and re-entering its parent ` +
      `(${JSON.stringify({ originAfterReentry, hiddenOriginIds, selectedId, dropDecision })})`,
  );
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await waitFor(
    () => frame.evaluate(() => !document.querySelector('.wb-source-visual-drag-ghost')),
    { label: 'Escape to remove the visual drag ghost', timeoutMs: 2500, intervalMs: 40 },
  );

  const originAfterEscape = await waitFor(
    () => frame.evaluate((id, targetPoint) => {
      const candidates = Array.from(
        document.querySelectorAll(`[data-wb-preview-node-id="${id}"]`),
      );
      const nearest = candidates.sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        return Math.hypot(
          leftRect.left + leftRect.width / 2 - targetPoint.x,
          leftRect.top + leftRect.height / 2 - targetPoint.y,
        ) - Math.hypot(
          rightRect.left + rightRect.width / 2 - targetPoint.x,
          rightRect.top + rightRect.height / 2 - targetPoint.y,
        );
      })[0];
      if (!nearest) return null;
      return {
        inlineOpacity: nearest.style.opacity,
        opacity: Number.parseFloat(getComputedStyle(nearest).opacity),
        placeholderHidden: nearest.hasAttribute('data-wb-drop-placeholder-hidden'),
      };
    }, selectedId, { x: target.x, y: target.y }),
    { label: 'the drag origin after Escape', timeoutMs: 5000, intervalMs: 40 },
  );
  assert(
    originAfterEscape.inlineOpacity !== '0' &&
      originAfterEscape.opacity > 0.9 &&
      !originAfterEscape.placeholderHidden,
    `Escape restores the dragged node itself (${JSON.stringify(originAfterEscape)})`,
  );

  const after = await waitFor(readAlignment, {
    label: 'the selection ring after Escape',
    timeoutMs: 5000,
    intervalMs: 40,
  });
  assert(
    after.opacity > 0.9 &&
      !after.dragging &&
      Math.max(
        Math.abs(after.left - before.left),
        Math.abs(after.top - before.top),
        Math.abs(after.width - before.width),
        Math.abs(after.height - before.height),
      ) <= 3,
    `Escape restores the selection ring at the selected node ` +
      `(before ${JSON.stringify(before)}, after ${JSON.stringify(after)})`,
  );
}
