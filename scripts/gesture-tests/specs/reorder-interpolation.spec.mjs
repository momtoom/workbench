/**
 * Regression: reorder projections must interpolate displaced rows, not jump
 * them. (Bug reported 2026-07-29: portal-projected collection rows moved
 * instantly because the FLIP second phase was scheduled on a rAF that never
 * fired in the drag path; both transition appliers now commit the start state
 * and apply the transition target synchronously.)
 *
 * Asserts that while dragging a dropdown item over its sibling, the displaced
 * sibling's computed translate passes through intermediate values instead of
 * snapping from 0 to the target offset.
 */
import { altClick, assert, canvasFrameOffset, metaClick, openCanvas, pagePointFor, scrollFrameSelectorIntoView, selectFixtureDesignPage, sleep, waitFor } from '../helpers.mjs';

export default async function reorderInterpolationSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-component-gallery',
    sourceFile: 'src/workbench-pages/ComponentGallery.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: '[aria-label="Account options"]' });
  await scrollFrameSelectorIntoView(frame, '[aria-label="Account options"]');

  const triggerPoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="Account options"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await altClick(page, triggerPoint);
  await waitFor(
    () => frame.evaluate(() => !!document.querySelector('[role="menu"]')),
    { label: 'dropdown to open' },
  );
  await sleep(600);

  // Order-agnostic: drag the FIRST row below the LAST row, and watch the
  // SECOND row (always displaced upward by one slot). Earlier specs may have
  // committed reorders to the shared fixture, so don't assume label order.
  const points = await frame.evaluate(() => {
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    if (items.length < 3) return null;
    const first = items[0].getBoundingClientRect();
    const last = items[items.length - 1].getBoundingClientRect();
    return {
      from: { x: first.x + first.width / 2, y: first.y + first.height / 2 },
      to: { x: last.x + last.width / 2, y: last.y + last.height * 1.2 },
      watchText: (items[1].textContent ?? '').trim(),
    };
  });
  assert(points, 'menu has at least three rows');
  const offset = await canvasFrameOffset(page);
  const from = { x: offset.x + points.from.x, y: offset.y + points.from.y };
  const to = { x: offset.x + points.to.x, y: offset.y + points.to.y };

  await metaClick(page, from);
  await sleep(800);

  // Sample the displaced sibling's computed translate at rAF cadence while
  // the drag crosses it.
  await frame.evaluate((watchText) => {
    window.__interpSamples = [];
    const start = performance.now();
    const tick = () => {
      const el = [...document.querySelectorAll('[role="menuitem"]')]
        .find((item) => (item.textContent ?? '').trim() === watchText);
      if (el) window.__interpSamples.push(getComputedStyle(el).translate);
      if (performance.now() - start < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, points.watchText);

  await page.mouse.move(from.x, from.y);
  await sleep(120);
  await page.mouse.down();
  await sleep(120);
  for (let i = 1; i <= 6; i += 1) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 6, from.y + ((to.y - from.y) * i) / 6);
    await sleep(250);
  }
  await page.mouse.up();
  await sleep(600);

  const samples = await frame.evaluate(() => window.__interpSamples);
  const yValues = samples
    .map((value) => {
      if (!value || value === 'none') return 0;
      const parts = value.split(' ');
      return Math.abs(parseFloat(parts[1] ?? parts[0]) || 0);
    });
  const maxOffset = Math.max(...yValues);
  assert(maxOffset > 8, `displaced row was projected (max offset ${maxOffset}px)`);
  // Interpolation proof: several distinct values strictly between rest and target.
  const intermediates = new Set(
    yValues.filter((y) => y > 1 && y < maxOffset - 1).map((y) => Math.round(y)),
  );
  assert(
    intermediates.size >= 3,
    `displaced row interpolated instead of jumping (intermediate offsets: ${[...intermediates].join(', ') || 'none'})`,
  );
}
