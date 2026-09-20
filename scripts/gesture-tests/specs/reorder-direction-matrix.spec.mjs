/**
 * Direction × round-trip reorder matrix.
 *
 * The 2026-07-29/30 drag-interpolation regressions were direction-dependent:
 * moving an item toward the end of its container glided while moving it back
 * inward/toward the start snapped (decision boundaries chased the in-flight
 * FLIP offsets and flapped the target). This spec pins all four cases on two
 * authored surfaces:
 *
 *   H1  horizontal button pair, drag right (toward end)
 *   H2  same pair, drag back left (toward start)
 *   V1  vertical radio list, drag down (toward end)
 *   V2  same list, drag back up (toward start)
 *
 * Every gesture must (a) interpolate the displaced sibling (≥3 intermediate
 * translate magnitudes) and (b) commit the expected order to authored source.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  assert,
  assertInterpolatedSamples,
  assertOscillatingSamples,
  canvasFrameOffset,
  metaClick,
  openCanvas,
  readTranslateSamples,
  scrollLabelIntoView,
  slowDrag,
  startTranslateSampler,
  sleep,
  visibleLabelTarget,
  waitFor,
  wanderDrag,
} from '../helpers.mjs';

export const fixture = 'Astryx-003';

// The Astryx-003 fixture page is spelled "CompGallary". de9ef2000, a release
// snapshot, tidied that typo here without renaming the fixture, and these three
// specs have failed on ENOENT ever since. The fixture is what main.tsx,
// pages.json and selection.json all reference, so it wins.
const GALLERY_SOURCE = 'src/workbench-pages/SamplePage/CompGallary.tsx';

export default async function reorderDirectionMatrixSpec({ page, baseUrl, projectDir }) {
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  await waitFor(
    () => visibleLabelTarget(frame, 'Keep project'),
    { label: 'gallery content to hydrate', timeoutMs: 60000 },
  );

  const readSource = () => readFile(join(projectDir, GALLERY_SOURCE), 'utf8');

  /** Order of two source tokens inside the slice around `anchorText`. */
  const sourceOrder = async (anchorText, tokenA, tokenB, sliceRadius = 1500) => {
    const source = await readSource();
    const anchorAt = source.indexOf(anchorText);
    if (anchorAt < 0) return null;
    const slice = source.slice(Math.max(0, anchorAt - sliceRadius), anchorAt + sliceRadius);
    const aAt = slice.indexOf(tokenA);
    const bAt = slice.indexOf(tokenB);
    if (aAt < 0 || bAt < 0) return null;
    return aAt < bAt ? [tokenA, tokenB] : [tokenB, tokenA];
  };

  async function gesture({
    description, dragLabel, pastLabel, direction, anchorText, expectOrder, orderTokens, sliceRadius,
    ancestorLevels = 0, grab = 'center', wander = false,
  }) {
    await scrollLabelIntoView(frame, dragLabel);
    const offset = await canvasFrameOffset(page);
    const grabPoint = (target) => (grab === 'corner'
      ? { x: offset.x + target.left + 10, y: offset.y + target.top + 10 }
      : { x: offset.x + target.x, y: offset.y + target.y });
    let dragTarget = await visibleLabelTarget(frame, dragLabel, { ancestorLevels });
    assert(dragTarget, `${description}: drag target "${dragLabel}" visible`);
    const pastTarget = await visibleLabelTarget(frame, pastLabel, { near: dragTarget, ancestorLevels });
    assert(pastTarget, `${description}: displaced sibling "${pastLabel}" visible`);

    await metaClick(page, grabPoint(dragTarget));
    await sleep(900);
    dragTarget = await visibleLabelTarget(frame, dragLabel, { near: dragTarget, ancestorLevels });
    assert(dragTarget, `${description}: drag target still visible after selection`);

    // Land just past the displaced sibling's midpoint: overshoot by ~45% of
    // the sibling pitch (label boxes can be much smaller than their rows),
    // capped inside the sibling's own box so the gesture can never spill into
    // a neighbouring container and become a reparent.
    const from = grabPoint(dragTarget);
    const deltaX = pastTarget.x - dragTarget.x;
    const deltaY = pastTarget.y - dragTarget.y;
    const horizontal = direction === 'left' || direction === 'right';
    const overshoot = horizontal
      ? Math.sign(deltaX || (direction === 'right' ? 1 : -1)) *
        Math.min(Math.abs(deltaX) * 0.45, Math.max(pastTarget.w * 0.4, 12))
      : Math.sign(deltaY || (direction === 'down' ? 1 : -1)) *
        Math.min(Math.abs(deltaY) * 0.45, Math.max(pastTarget.h * 0.4, 12));
    const to = horizontal
      ? { x: offset.x + pastTarget.x + overshoot, y: offset.y + pastTarget.y }
      : { x: offset.x + pastTarget.x, y: offset.y + pastTarget.y + overshoot };

    await startTranslateSampler(frame, { x: pastTarget.x, y: pastTarget.y });
    if (wander) {
      // People do not beeline: they cross the boundary, drift back over the
      // origin, then cross again before releasing. Every crossing must glide.
      await wanderDrag(page, from, [to, from, to], { steps: 6, stepDelayMs: 110 });
    } else {
      await slowDrag(page, from, to, { steps: 8, stepDelayMs: 140 });
    }
    await sleep(400);
    const samples = await readTranslateSamples(frame);
    if (wander) assertOscillatingSamples(samples, description);
    else assertInterpolatedSamples(samples, description);

    const expectedTokens = orderTokens ?? expectOrder.map((label) => `label="${label}"`);
    await waitFor(async () => {
      const order = await sourceOrder(anchorText, expectedTokens[0], expectedTokens[1], sliceRadius);
      return order && order[0] === expectedTokens[0] ? order : null;
    }, { label: `${description}: source order ${expectOrder.join(' → ')}`, timeoutMs: 15000, intervalMs: 500 });

    // A successful source refresh replaces the projected drag DOM. Both the
    // moved node and the sibling that inherits its old path-based slot must be
    // visible and free of placeholder state after cleanup.
    for (const [label, nearTarget] of [
      [dragLabel, dragTarget],
      [pastLabel, pastTarget],
    ]) {
      let lastVisibilityState = null;
      try {
        await waitFor(async () => {
          const currentTarget = await visibleLabelTarget(frame, label, {
            ancestorLevels,
            near: nearTarget,
          });
          if (!currentTarget) {
            lastVisibilityState = { currentTarget: null };
            return null;
          }
          const visibilityState = await frame.evaluate((nodeId, wantedLabel, point) => {
            const leaf = [...document.querySelectorAll('*')]
              .filter((element) => (
                element.children.length === 0 &&
                (element.textContent || '').trim() === wantedLabel
              ))
              .sort((left, right) => {
                const leftRect = left.getBoundingClientRect();
                const rightRect = right.getBoundingClientRect();
                return Math.hypot(
                  leftRect.left + leftRect.width / 2 - point.x,
                  leftRect.top + leftRect.height / 2 - point.y,
                ) - Math.hypot(
                  rightRect.left + rightRect.width / 2 - point.x,
                  rightRect.top + rightRect.height / 2 - point.y,
                );
              })[0];
            if (!leaf) return null;
            const elements = [];
            for (let element = leaf; element && element !== document.body; element = element.parentElement) {
              elements.push(element);
              if (element.getAttribute('data-wb-preview-node-id') === nodeId) break;
            }
            const leafRect = leaf.getBoundingClientRect();
            const state = elements.map((element) => ({
                inlineOpacity: element.style.opacity,
                opacity: Number.parseFloat(getComputedStyle(element).opacity),
                placeholderHidden: element.hasAttribute('data-wb-drop-placeholder-hidden'),
              }));
            return {
              state,
              visible:
                leafRect.width > 1 &&
                leafRect.height > 1 &&
                state.every((entry) => (
                entry.inlineOpacity !== '0' &&
                entry.opacity > 0.9 &&
                !entry.placeholderHidden
                )),
            };
          }, currentTarget.id, label, { x: currentTarget.x, y: currentTarget.y });
          lastVisibilityState = { currentTarget, visibilityState };
          return visibilityState?.visible ? visibilityState : null;
        }, {
          label: `${description}: ${label} to be visible after drop`,
          timeoutMs: 5000,
          intervalMs: 40,
        });
      } catch (error) {
        throw new Error(
          `${error instanceof Error ? error.message : String(error)}; ` +
            `visibility: ${JSON.stringify(lastVisibilityState)}`,
        );
      }
    }

    // Let the canvas absorb the source refresh before the next gesture.
    await sleep(2500);
  }

  await gesture({
    description: 'H1 right/toward-end',
    dragLabel: 'Keep project',
    pastLabel: 'Remove',
    direction: 'right',
    anchorText: 'Keep project',
    expectOrder: ['Remove', 'Keep project'],
  });
  await gesture({
    description: 'H2 left/back-inward',
    dragLabel: 'Keep project',
    pastLabel: 'Remove',
    direction: 'left',
    anchorText: 'Keep project',
    expectOrder: ['Keep project', 'Remove'],
  });
  await gesture({
    description: 'V1 down/toward-end',
    dragLabel: 'Balanced',
    pastLabel: 'Spacious',
    direction: 'down',
    anchorText: 'Choose how densely',
    expectOrder: ['Spacious', 'Balanced'],
  });
  await gesture({
    description: 'V2 up/back-inward',
    dragLabel: 'Balanced',
    pastLabel: 'Spacious',
    direction: 'up',
    anchorText: 'Choose how densely',
    expectOrder: ['Balanced', 'Spacious'],
  });
  await gesture({
    description: 'W1 right, wandering back and forth',
    dragLabel: 'Keep project',
    pastLabel: 'Remove',
    direction: 'right',
    anchorText: 'Keep project',
    expectOrder: ['Remove', 'Keep project'],
    wander: true,
  });
  await gesture({
    description: 'W2 left, wandering back and forth',
    dragLabel: 'Keep project',
    pastLabel: 'Remove',
    direction: 'left',
    anchorText: 'Keep project',
    expectOrder: ['Keep project', 'Remove'],
    wander: true,
  });
  await gesture({
    description: 'W3 down, wandering back and forth',
    dragLabel: 'Balanced',
    pastLabel: 'Spacious',
    direction: 'down',
    anchorText: 'Choose how densely',
    expectOrder: ['Spacious', 'Balanced'],
    wander: true,
  });
  await gesture({
    description: 'W4 up, wandering back and forth',
    dragLabel: 'Balanced',
    pastLabel: 'Spacious',
    direction: 'up',
    anchorText: 'Choose how densely',
    expectOrder: ['Balanced', 'Spacious'],
    wander: true,
  });
  // FUTURE: grid-cell (2D wrap) cases need a purpose-built fixture page —
  // the gallery's wrap grids either collapse to one column at the harness
  // viewport or their cells are fully covered by inner content, so a pointer
  // grab cannot select the cell itself. Add a dedicated gesture-test page
  // with bare grid cells before pinning G1/G2 here.
}
