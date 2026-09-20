/** TEMP debug: dump what the projected canvas renders inside .wb-play-frame. */
import { openCanvas, selectFixtureDesignPage, sleep } from '../helpers.mjs';

export const fixture = 'Test-0010';

export default async function zzTmpPlayFrameDebugSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-untitled-page-3',
    sourceFile: 'src/workbench-pages/DesignProcessWithAI.tsx',
  });
  const frame = await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });
  await sleep(4000);
  const info = await frame.evaluate(() => {
    const play = document.querySelector('.wb-play-frame');
    const seps = [...document.querySelectorAll('[role="separator"]')].map((s) => s.getAttribute('aria-label'));
    if (!play) return { play: false, seps, bodyLen: document.body.innerHTML.length };
    const cta = [...play.querySelectorAll('button')].find((b) => b.textContent.trim() === '데모 열기');
    return {
      play: true,
      offsetWidth: play.offsetWidth,
      rectWidth: Math.round(play.getBoundingClientRect().width),
      childCount: play.childElementCount,
      firstChildClass: (play.firstElementChild?.className || '').toString().slice(0, 80),
      cta: Boolean(cta),
      seps,
      buttons: [...play.querySelectorAll('button')].slice(0, 6).map((b) => b.textContent.trim().slice(0, 12)),
    };
  });
  console.log('[debug]', JSON.stringify(info));
}
