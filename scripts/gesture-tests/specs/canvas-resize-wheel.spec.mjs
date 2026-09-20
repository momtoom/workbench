/**
 * Canvas wheel scrolling must keep working immediately after a window resize:
 * the shell re-measures and rescales the preview on resize, and the very next
 * wheel gesture over the canvas still has to reach the preview scroller.
 */
import { assert, openCanvas, sleep } from '../helpers.mjs';

async function wheelAtCanvasCenter(page, deltaY) {
  const rect = await page.evaluate(() => {
    const iframe = document.querySelector('iframe.wb-source-visual-preview-frame');
    const r = iframe.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.mouse.move(rect.x + rect.width / 2, rect.y + Math.min(rect.height / 2, 380));
  await page.mouse.wheel({ deltaX: 0, deltaY });
}

async function readCanvasScrollTop(frame) {
  return frame.evaluate(
    () => document.querySelector('.wb-source-visual-preview')?.scrollTop ?? -1,
  );
}

export default async function resizeWheelProbeSpec({ page, baseUrl }) {
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  await sleep(600);

  const room = await frame.evaluate(() => {
    const scroller = document.querySelector('.wb-source-visual-preview');
    scroller.scrollTop = 0;
    return scroller.scrollHeight - scroller.clientHeight;
  });
  assert(room > 600, `canvas page is scrollable enough to probe (${room}px)`);

  const before0 = await readCanvasScrollTop(frame);
  await wheelAtCanvasCenter(page, 300);
  await sleep(400);
  const before1 = await readCanvasScrollTop(frame);
  assert(before1 > before0 + 50, `wheel scrolls before resize (${before0} -> ${before1})`);

  await page.setViewport({ width: 1280, height: 800 });
  await sleep(700);

  const after0 = await readCanvasScrollTop(frame);
  await wheelAtCanvasCenter(page, 300);
  await sleep(400);
  const after1 = await readCanvasScrollTop(frame);
  console.log(`[probe] first post-resize wheel: ${after0} -> ${after1}`);
  await wheelAtCanvasCenter(page, 300);
  await sleep(400);
  const after2 = await readCanvasScrollTop(frame);
  console.log(`[probe] second post-resize wheel: ${after1} -> ${after2}`);

  assert(after1 > after0 + 50, `first wheel after resize scrolls (${after0} -> ${after1})`);
  assert(after2 > after1 + 50, `second wheel after resize scrolls (${after1} -> ${after2})`);
}
