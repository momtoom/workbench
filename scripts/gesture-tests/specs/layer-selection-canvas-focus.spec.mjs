/** A Layers-panel selection should reveal its source node in the canvas. */
import {
  assert,
  openCanvas,
  selectFixtureDesignPage,
  sleep,
  waitFor,
  waitForCanvasFrame,
} from '../helpers.mjs';

export const fixture = 'SHADCN-002';

export default async function layerSelectionCanvasFocusSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-shadcn-catalog',
    sourceFile: 'src/workbench-pages/ShadcnCatalog.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  await waitFor(
    () => frame.evaluate(() => {
      const canvas = document.querySelector('.wb-source-visual-preview');
      return canvas instanceof HTMLElement && canvas.scrollHeight - canvas.clientHeight > 1000;
    }),
    { label: 'the catalog canvas to expose offscreen content', timeoutMs: 30000 },
  );
  const initialScrollTop = await frame.evaluate(() => (
    document.querySelector('.wb-source-visual-preview')?.scrollTop ?? -1
  ));
  assert(initialScrollTop === 0, 'the page still opens at its authored top');

  await page.evaluate(() => {
    const list = document.querySelector('#wb-design-layer-list');
    if (list instanceof HTMLElement) list.scrollTop = list.scrollHeight;
  });
  await sleep(250);
  const visibleLayerIds = await page.evaluate(() => (
    [...document.querySelectorAll('#wb-design-layer-list [data-wb-sidebar-row-id]')]
      .map((row) => row.getAttribute('data-wb-sidebar-row-id'))
      .filter(Boolean)
  ));
  const targetLayerId = await frame.evaluate((layerIds) => {
    const canvas = document.querySelector('.wb-source-visual-preview');
    if (!(canvas instanceof HTMLElement)) return null;
    const viewport = canvas.getBoundingClientRect();
    return layerIds.find((layerId) => {
      const target = document.querySelector(`[data-wb-preview-node-id="${CSS.escape(layerId)}"]`);
      if (!(target instanceof HTMLElement)) return false;
      const rect = target.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top > viewport.bottom + 100;
    }) ?? null;
  }, visibleLayerIds);
  assert(targetLayerId, 'the bottom of Layers exposes a rendered node below the canvas viewport');

  const clickedTargetRow = await page.evaluate((layerId) => {
    const row = [...document.querySelectorAll('[data-wb-sidebar-row-id]')]
      .find((candidate) => candidate.getAttribute('data-wb-sidebar-row-id') === layerId);
    if (!(row instanceof HTMLButtonElement)) return false;
    row.click();
    return true;
  }, targetLayerId);
  assert(clickedTargetRow, 'the target layer row remains addressable after virtualization');

  const focused = await waitFor(
    async () => {
      const activeFrame = await waitForCanvasFrame(page, 1500);
      return activeFrame.evaluate((layerId) => {
        const canvas = document.querySelector('.wb-source-visual-preview');
        const target = document.querySelector(`[data-wb-preview-node-id="${CSS.escape(layerId)}"]`);
        if (!(canvas instanceof HTMLElement) || !(target instanceof HTMLElement)) return null;
        const viewport = canvas.getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        return canvas.scrollTop > 0 && rect.bottom > viewport.top && rect.top < viewport.bottom
          ? { scrollTop: canvas.scrollTop, targetTop: rect.top, viewportBottom: viewport.bottom }
          : null;
      }, targetLayerId).catch(() => null);
    },
    { label: 'the Layers selection to scroll into the Design canvas viewport', timeoutMs: 5000 },
  );
  assert(focused.scrollTop > 0, 'selecting an offscreen layer scrolls the canvas to its visual source node');
}
