/**
 * CSS scroll snapping must treat one trackpad / Magic Mouse momentum stream as
 * one gesture. The preview wheel bridges used to call scrollBy for every wheel
 * event, so five small deltas snapped through five cards in a single swipe.
 *
 * Exercise both preview owners because the Design canvas and standalone
 * browser preview install separate wheel bridges.
 */
import {
  assert,
  canvasFrameOffset,
  openCanvas,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'NEW SG Design System Test';

async function readSnapScrollerMetrics(surface) {
  return surface.evaluate(() => {
    const track = [...document.querySelectorAll('.card-grid-track')]
      .find((element) => element.scrollWidth > element.clientWidth + 100);
    if (!track) return null;
    track.scrollIntoView({ block: 'center', inline: 'nearest' });
    track.scrollTo({ left: 0, behavior: 'auto' });
    const cells = [...track.querySelectorAll('.card-grid-cell')];
    const firstRect = cells[0]?.getBoundingClientRect();
    const secondRect = cells[1]?.getBoundingClientRect();
    const rect = track.getBoundingClientRect();
    return {
      clientWidth: track.clientWidth,
      maxScroll: track.scrollWidth - track.clientWidth,
      point: {
        x: rect.x + Math.min(rect.width / 2, 120),
        y: rect.y + Math.min(rect.height / 2, 80),
      },
      snapType: getComputedStyle(track).scrollSnapType,
      step: firstRect && secondRect
        ? Math.abs(secondRect.x - firstRect.x)
        : firstRect?.width ?? 0,
    };
  });
}

async function readSnapScrollerPosition(surface) {
  return surface.evaluate(() => {
    const track = [...document.querySelectorAll('.card-grid-track')]
      .find((element) => element.scrollWidth > element.clientWidth + 100);
    return track?.scrollLeft ?? 0;
  });
}

function assertSingleSnapAdvance({ scrollLeft, step, label, inputLabel }) {
  assert(scrollLeft > 1, `${label} responds to the ${inputLabel} (${scrollLeft}px)`);
  assert(
    scrollLeft <= step * 1.5,
    `${label} advances at most one card for the ${inputLabel} ` +
      `(${scrollLeft}px, card step ${step}px)`,
  );
}

async function exerciseSnapScroller({ page, surface, offset, label, includeLargePacket = false }) {
  const metrics = await readSnapScrollerMetrics(surface);
  assert(metrics, `${label} exposes a horizontally scrollable CardGrid track`);
  assert(metrics.snapType.startsWith('x'), `${label} track uses horizontal CSS snap (${metrics.snapType})`);
  assert(metrics.step > 40, `${label} track has a measurable card step (${metrics.step})`);
  assert(metrics.maxScroll > metrics.step * 2, `${label} track has room for multiple snap advances`);

  if (includeLargePacket) {
    // Some browser bridges collapse one physical swipe into a single large
    // wheel packet. That first packet must also advance only one snap point.
    await sleep(350);
    const largeInputMetrics = await surface.evaluate(() => {
      const track = [...document.querySelectorAll('.card-grid-track')]
        .find((element) => element.scrollWidth > element.clientWidth + 100);
      track?.scrollTo({ left: 0, behavior: 'auto' });
      const rect = track?.getBoundingClientRect();
      return rect ? {
        point: {
          x: rect.x + Math.min(rect.width / 2, 120),
          y: rect.y + Math.min(rect.height / 2, 80),
        },
      } : null;
    });
    assert(largeInputMetrics, `${label} track remains available for a large wheel packet`);
    await sleep(100);
    await page.mouse.move(
      offset.x + largeInputMetrics.point.x,
      offset.y + largeInputMetrics.point.y,
    );
    await page.mouse.wheel({ deltaX: 600, deltaY: 0 });
    await sleep(700);
    assertSingleSnapAdvance({
      scrollLeft: await readSnapScrollerPosition(surface),
      step: metrics.step,
      label,
      inputLabel: 'single large wheel packet',
    });
  }

  // A later gesture can instead arrive as many small momentum packets. Wait
  // past the gesture boundary, reset the fixture, and verify the stream is
  // coalesced without losing the first valid advance.
  await sleep(350);
  const momentumMetrics = await surface.evaluate(() => {
    const track = [...document.querySelectorAll('.card-grid-track')]
      .find((element) => element.scrollWidth > element.clientWidth + 100);
    track?.scrollTo({ left: 0, behavior: 'auto' });
    const rect = track?.getBoundingClientRect();
    return rect ? {
      point: {
        x: rect.x + Math.min(rect.width / 2, 120),
        y: rect.y + Math.min(rect.height / 2, 80),
      },
    } : null;
  });
  assert(momentumMetrics, `${label} track remains available for a momentum stream`);
  await sleep(100);
  await page.mouse.move(
    offset.x + momentumMetrics.point.x,
    offset.y + momentumMetrics.point.y,
  );
  for (const deltaX of [160, 120, 80, 40, 20]) {
    await page.mouse.wheel({ deltaX, deltaY: 0 });
  }
  await sleep(700);
  assertSingleSnapAdvance({
    scrollLeft: await readSnapScrollerPosition(surface),
    step: metrics.step,
    label,
    inputLabel: 'momentum stream',
  });
}

export default async function snapWheelMomentumSpec({ page, baseUrl }) {
  // The runner defaults to 1680x1000, where the canvas frame's right edge sits
  // behind the Inspector aside and elementFromPoint there answers shell chrome
  // rather than the canvas iframe (2026-09-03 handoff, §3.2). A point measured
  // inside the frame then presses nothing, which reads as an editor failure.
  // 1980x1000 is the first size that contains the frame and clears the aside.
  await page.setViewport({ width: 1980, height: 1000 });
  const frame = await openCanvas(page, baseUrl, { readySelector: '.card-grid-track' });
  await exerciseSnapScroller({
    page,
    surface: frame,
    offset: await canvasFrameOffset(page),
    label: 'Design canvas',
  });

  const source = encodeURIComponent('src/workbench-pages/temporary/Creator.tsx');
  await page.goto(
    `${baseUrl}/page-preview.html?appearance=light&source=${source}&title=Creator`,
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );
  await waitFor(
    () => page.evaluate(() => !!document.querySelector('.card-grid-track')),
    { label: 'standalone page preview CardGrid', timeoutMs: 60000 },
  );
  await exerciseSnapScroller({
    page,
    surface: page,
    offset: { x: 0, y: 0 },
    label: 'Browser preview',
    includeLargePacket: true,
  });
}
