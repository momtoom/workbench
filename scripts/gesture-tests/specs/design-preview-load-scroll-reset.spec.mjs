/** Regression: reloading a Design page always starts its canvas at the top. */
import {
  assert,
  openCanvas,
  selectFixtureDesignPage,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'SHADCN-002';

export default async function designPreviewLoadScrollResetSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-shadcn-catalog',
    sourceFile: 'src/workbench-pages/ShadcnCatalog.tsx',
  });
  let frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  // The canvas element exists before the page's runtime module has rendered
  // into it, so measuring straight after `openCanvas` races an empty canvas and
  // reads as "the fixture has no content".
  await waitFor(
    () => frame.evaluate(() => {
      const canvas = document.querySelector('.wb-source-visual-preview');
      return canvas instanceof HTMLElement && canvas.scrollHeight - canvas.clientHeight > 0;
    }),
    { label: 'the fixture page to render enough content to scroll', timeoutMs: 30000 },
  );
  const scrolled = await frame.evaluate(() => {
    const canvas = document.querySelector('.wb-source-visual-preview');
    if (!(canvas instanceof HTMLElement)) return null;
    canvas.scrollTop = canvas.scrollHeight;
    return canvas.scrollTop;
  });
  assert(scrolled && scrolled > 0, 'the fixture canvas has enough content to reproduce nested scroll restoration');

  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  await waitFor(
    () => frame.evaluate(() => {
      const canvas = document.querySelector('.wb-source-visual-preview');
      return canvas instanceof HTMLElement && canvas.scrollTop === 0;
    }),
    { label: 'the refreshed Design canvas to reset to its authored top', timeoutMs: 5000, intervalMs: 80 },
  );
}
