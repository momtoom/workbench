/**
 * Conformance sweep: every interactive item rendered inside a runtime overlay
 * (dropdowns, selects, context menus, ...) opened from the gallery page must
 * resolve to an authored source node — and never to a bare text leaf. This is
 * the class of bug behind the 2026-07-29 dropdown regression; the sweep
 * exists to find its siblings before a user does.
 *
 * Uses the dev-only `window.__workbenchCanvasDiagnostics` hook instead of real
 * gestures so dozens of overlays can be checked quickly.
 */
import { altClick, assert, canvasFrameOffset, openCanvas, selectFixtureDesignPage, sleep, waitFor } from '../helpers.mjs';

const OVERLAY_ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
].join(', ');

export default async function overlayConformanceSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-component-gallery',
    sourceFile: 'src/workbench-pages/ComponentGallery.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: '[aria-label="Account options"]' });

  const triggerCount = await frame.evaluate(() => {
    window.__wbSweepTriggers = [...document.querySelectorAll('[aria-haspopup]')]
      .filter((el) => el.getAttribute('aria-haspopup') !== 'false');
    return window.__wbSweepTriggers.length;
  });
  assert(triggerCount > 0, 'gallery exposes overlay triggers');

  const failures = [];
  let checkedItems = 0;
  let openedOverlays = 0;

  for (let index = 0; index < triggerCount; index += 1) {
    const triggerInfo = await frame.evaluate((i) => {
      const el = window.__wbSweepTriggers[i];
      if (!el || !el.isConnected) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      return {
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40) || `trigger#${i}`,
      };
    }, index);
    if (!triggerInfo || triggerInfo.rect.w === 0) continue;
    await sleep(250);
    const offset = await canvasFrameOffset(page);
    const rect = await frame.evaluate((i) => {
      const el = window.__wbSweepTriggers[i];
      if (!el || !el.isConnected) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, index);
    if (!rect) continue;
    await altClick(page, { x: offset.x + rect.x + rect.w / 2, y: offset.y + rect.y + rect.h / 2 });

    let opened = false;
    try {
      await waitFor(
        () => frame.evaluate((sel) => document.querySelectorAll(sel).length > 0, OVERLAY_ITEM_SELECTOR),
        { label: 'overlay items', timeoutMs: 2500 },
      );
      opened = true;
    } catch {
      opened = false;
    }
    if (!opened) {
      await page.keyboard.press('Escape');
      continue;
    }
    openedOverlays += 1;

    const results = await page.evaluate((itemSelector) => {
      const doc = document.querySelector('iframe.wb-source-visual-preview-frame').contentDocument;
      const diagnostics = window.__workbenchCanvasDiagnostics;
      if (!diagnostics) return { error: 'diagnostics hook missing (DEV build only)' };
      return {
        items: [...doc.querySelectorAll(itemSelector)].map((item) => ({
          text: (item.textContent ?? '').trim().slice(0, 40),
          role: item.getAttribute('role'),
          resolved: diagnostics.resolveOverlayItemLayerId(item),
        })),
      };
    }, OVERLAY_ITEM_SELECTOR);
    assert(!results.error, results.error ?? '');

    for (const item of results.items) {
      checkedItems += 1;
      if (!item.resolved) {
        failures.push(`${triggerInfo.label} → "${item.text}" (${item.role}): unresolved`);
      } else if (item.resolved.endsWith('-text')) {
        failures.push(`${triggerInfo.label} → "${item.text}" (${item.role}): resolved to text leaf ${item.resolved}`);
      }
    }

    await page.keyboard.press('Escape');
    await sleep(300);
  }

  console.log(`[gesture-tests]      overlay sweep: ${openedOverlays} overlays, ${checkedItems} items checked`);
  assert(openedOverlays >= 3, `swept a meaningful number of overlays (got ${openedOverlays})`);
  assert(
    failures.length === 0,
    `all overlay items resolve to authored nodes:\n  ${failures.join('\n  ')}`,
  );
}
