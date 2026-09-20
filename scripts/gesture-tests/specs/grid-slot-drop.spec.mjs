/**
 * Two-dimensional (wrapping) containers are addressed by SLOT, not by sibling
 * edge.
 *
 * Edge-sector insertion could not describe a grid: "after the card on my left"
 * and "before the card below me" are the same source index, so the outcome
 * depended on which card was addressed and on how many columns the current
 * width produced. The slot model states it directly — drop on slot k and the
 * dragged node ends up at visual position k — and deliberately shows no sibling
 * reflow or glide, only the translucent slot grid.
 *
 * This spec pins both halves: the overlay appears with one active slot and no
 * layout transition runs, and the committed order puts the dragged card exactly
 * at the addressed slot.
 */
import { assert, canvasFrameOffset, openCanvas, readFixtureSelection, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'Astryx-003';

export default async function gridSlotDropSpec({ page, baseUrl, projectDir }) {
  let frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });

  /** The theme-card grid: a grid whose cells wrap into rows and columns. */
  const readGrid = () => frame.evaluate(() => {
    const trackCount = (centers) => {
      const tracks = [];
      for (const center of centers) {
        if (tracks.some((track) => Math.abs(track - center) <= 4)) continue;
        tracks.push(center);
      }
      return tracks.length;
    };
    for (const element of document.querySelectorAll('[data-wb-preview-node-id]')) {
      if (!getComputedStyle(element).display.includes('grid')) continue;
      const cells = [...element.children].filter((child) => {
        const id = child.getAttribute?.('data-wb-preview-node-id');
        const rect = child.getBoundingClientRect();
        return id && !id.endsWith('-text') && rect.width > 20 && rect.height > 20;
      });
      if (cells.length < 3) continue;
      const rects = cells.map((cell) => cell.getBoundingClientRect());
      const rows = trackCount(rects.map((rect) => rect.top + rect.height / 2));
      const columns = trackCount(rects.map((rect) => rect.left + rect.width / 2));
      if (rows < 2 || columns < 2) continue;
      return {
        id: element.getAttribute('data-wb-preview-node-id'),
        cells: cells.map((cell, index) => {
          const rect = rects[index];
          return {
            id: cell.getAttribute('data-wb-preview-node-id'),
            label: (cell.textContent || '').trim().slice(0, 14),
            left: rect.x,
            top: rect.y,
            w: rect.width,
            h: rect.height,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };
        }),
      };
    }
    return null;
  });

  const grid = await waitFor(readGrid, { label: 'a wrapping grid to hydrate', timeoutMs: 60000 });
  assert(grid.cells.length >= 4, `grid has enough cells (${grid.cells.length})`);

  // Selecting the cell itself needs a drill (an ordinary press selects at the
  // current drill depth, and unmodified double-clicks do not reach the canvas
  // iframe in this harness), so seed the editor's selection state and reload.
  const { readFile, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const selectionState = await readFixtureSelection(projectDir);
  selectionState.extensions = {
    ...selectionState.extensions,
    activeDesignLayerId: grid.cells[0].id,
    selectedDesignLayerIds: [],
  };
  await writeFixtureSelection(projectDir, selectionState);
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  const reloadedFrame = await waitFor(
    async () => {
      const candidate = page.frames().find((entry) => entry !== page.mainFrame());
      if (!candidate) return null;
      const ready = await candidate
        .evaluate(() => !!document.querySelector('.wb-source-visual-preview'))
        .catch(() => false);
      return ready ? candidate : null;
    },
    { label: 'the canvas to come back after reload', timeoutMs: 60000 },
  );
  frame = reloadedFrame;
  await waitFor(readGrid, { label: 'the grid to hydrate after reload', timeoutMs: 60000 });
  await frame.evaluate((gridId) => {
    document.querySelector(`[data-wb-preview-node-id="${gridId}"]`)?.scrollIntoView({ block: 'center' });
  }, grid.id);
  await sleep(900);

  const positioned = await readGrid();
  const order = positioned.cells.map((cell) => cell.label);
  // Move the first card onto the third slot: with slot semantics it must land
  // at visual position 2, which edge-insertion got wrong by one.
  const dragged = positioned.cells[0];
  const destinationSlot = 2;
  const destination = positioned.cells[destinationSlot];
  const offset = await canvasFrameOffset(page);

  await page.mouse.move(offset.x + dragged.left + 12, offset.y + dragged.top + 12);
  await sleep(140);
  await page.mouse.down();
  await sleep(160);
  const from = { x: offset.x + dragged.left + 12, y: offset.y + dragged.top + 12 };
  const to = { x: offset.x + destination.x, y: offset.y + destination.y };
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * step) / 8,
      from.y + ((to.y - from.y) * step) / 8,
    );
    await sleep(120);
  }
  await sleep(400);

  // Editor chrome for the canvas is portaled INTO the preview document.
  const overlay = await frame.evaluate(() => ({
    slots: document.querySelectorAll('.wb-source-visual-drop-grid-slot').length,
    active: document.querySelectorAll('.wb-source-visual-drop-grid-slot--active').length,
    indicators: document.querySelectorAll('.wb-source-visual-drop-indicator').length,
    dragging: !!document.querySelector('.wb-source-visual-drag-ghost'),
    ghost: (() => {
      const element = document.querySelector('.wb-source-visual-drag-ghost');
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        maskImage: style.maskImage || style.webkitMaskImage,
        opacity: Number.parseFloat(style.opacity),
        preview: element.classList.contains('wb-source-visual-drag-ghost--preview'),
        snapshot: element.classList.contains('wb-source-visual-drag-ghost--snapshot'),
      };
    })(),
  }));
  assert(overlay.dragging, 'the drag is still active when the overlay is measured');
  assert(overlay.ghost?.preview, 'a small grid cell uses the visual ghost');
  assert(!overlay.ghost?.snapshot, 'a small grid cell does not need bounded snapshot mode');
  assert(
    overlay.ghost?.opacity <= 0.35 &&
      overlay.ghost?.maskImage.includes('radial-gradient'),
    `small and complex visual ghosts share the subdued radial mask ` +
      `(opacity ${overlay.ghost?.opacity ?? 'none'}, mask ${overlay.ghost?.maskImage ?? 'none'})`,
  );
  const decision = await page.evaluate(
    () => window.__workbenchCanvasDiagnostics?.getLastDropDecision?.() ?? null,
  );
  assert(
    decision?.draggedNodeId && grid.cells.some((cell) => cell.id === decision.draggedNodeId),
    `the gesture moves a grid cell, not a node inside one ` +
    `(dragging ${decision?.draggedNodeId ?? 'nothing'}, target ${decision?.parentId ?? 'none'}/${decision?.operation ?? '-'})`,
  );
  const glide = await frame.evaluate(
    () => document.querySelectorAll('[data-wb-drop-layout-transition]').length,
  );
  assert(
    overlay.slots >= positioned.cells.length + 1,
    `slot grid is drawn for every authored cell plus the append slot ` +
    `(slots ${overlay.slots}, cells ${positioned.cells.length})`,
  );
  assert(overlay.active === 1, `exactly one slot is addressed (active ${overlay.active})`);
  assert(overlay.indicators === 0, `no edge indicator is drawn (found ${overlay.indicators})`);
  assert(glide === 0, `no sibling reflow/glide runs during a slot drag (found ${glide})`);

  await page.mouse.up();

  const expected = order.filter((_, index) => index !== 0);
  expected.splice(destinationSlot, 0, order[0]);
  await waitFor(
    async () => {
      const current = await readGrid();
      if (!current) return null;
      const labels = current.cells.map((cell) => cell.label);
      return labels.join('|') === expected.join('|') ? labels : null;
    },
    {
      label: `"${dragged.label}" lands on slot ${destinationSlot} ` +
        `(expected ${expected.join(' → ')})`,
      timeoutMs: 20000,
      intervalMs: 500,
    },
  );

}
