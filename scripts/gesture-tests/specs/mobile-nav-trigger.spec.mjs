/**
 * MobileNav exposes its trigger as an authored AstryxButton child.
 *
 * The wrapper must not synthesize a hidden/default vendor button because the
 * trigger is part of the page composition designers need to replace or style.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  altClick,
  assert,
  canvasPagePoint,
  metaClick,
  openCanvas,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'Astryx-003';

// The Astryx-003 fixture page is spelled "CompGallary". de9ef2000, a release
// snapshot, tidied that typo here without renaming the fixture, and these three
// specs have failed on ENOENT ever since. The fixture is what main.tsx,
// pages.json and selection.json all reference, so it wins.
const GALLERY_SOURCE = 'src/workbench-pages/SamplePage/CompGallary.tsx';
const MOBILE_NAV_SOURCE = 'src/components/AstryxMobileNav.tsx';
const MOBILE_NAV_TRIGGER_SOURCE = 'src/components/AstryxMobileNavTrigger.tsx';

export default async function mobileNavTriggerSpec({ page, baseUrl, projectDir }) {
  const [gallerySource, mobileNavSource, mobileNavTriggerSource] = await Promise.all([
    readFile(join(projectDir, GALLERY_SOURCE), 'utf8'),
    readFile(join(projectDir, MOBILE_NAV_SOURCE), 'utf8'),
    readFile(join(projectDir, MOBILE_NAV_TRIGGER_SOURCE), 'utf8'),
  ]);
  assert(
    gallerySource.includes('<AstryxMobileNavTrigger>') &&
      gallerySource.includes('<AstryxButton label="Open navigation" variant="secondary" />'),
    'the gallery authors MobileNav > MobileNavTrigger > Button',
  );
  assert(
    !mobileNavSource.includes('@astryxdesign/core/Button') &&
      mobileNavSource.includes('{triggerSlot}') &&
      mobileNavTriggerSource.includes('openNavigation?.();'),
    'the wrapper does not synthesize a vendor trigger button',
  );

  // The runner defaults to 1680x1000, where the canvas frame's right edge sits
  // behind the Inspector aside and elementFromPoint there answers shell chrome
  // rather than the canvas iframe (2026-09-03 handoff, §3.2). A point measured
  // inside the frame then presses nothing, which reads as an editor failure.
  // 1980x1000 is the first size that contains the frame and clears the aside.
  await page.setViewport({ width: 1980, height: 1000 });
  const frame = await openCanvas(page, baseUrl, {
    readySelector: '.astryx-wb-mobile-nav',
  });
  const trigger = await frame.evaluate(() => {
    const button = [...document.querySelectorAll('button.astryx-wb-button')].find((candidate) => (
      candidate.textContent?.trim() === 'Open navigation'
    ));
    if (!button) return null;
    button.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = button.getBoundingClientRect();
    const trigger = button.closest('.astryx-wb-mobile-nav-trigger');
    return {
      nodeId: button.getAttribute('data-wb-preview-node-id'),
      triggerNodeId: trigger?.getAttribute('data-wb-preview-node-id') ?? null,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };
  });
  assert(trigger?.nodeId, 'the authored trigger remains a source-backed button layer');
  assert(trigger?.triggerNodeId, 'the button is nested inside a source-backed MobileNavTrigger layer');

  await sleep(350);
  const point = await canvasPagePoint(page, {
    x: trigger.rect.x + trigger.rect.width / 2,
    y: trigger.rect.y + trigger.rect.height / 2,
  });
  assert(point.onCanvas, 'the mobile navigation trigger is visible inside the canvas');

  await altClick(page, point);
  await waitFor(
    () => frame.evaluate(() => (
      document.querySelector('dialog.astryx-wb-mobile-nav')?.open === true
    )),
    { label: 'the authored mobile navigation trigger to open the drawer' },
  );
  const openState = await frame.evaluate(() => {
    const dialog = document.querySelector('dialog.astryx-wb-mobile-nav');
    return {
      header: dialog?.querySelector('h2')?.textContent?.trim() ?? null,
      open: dialog?.open === true,
    };
  });
  assert(
    openState.open && openState.header === 'Workspace',
    `the authored trigger opens the configured drawer (${JSON.stringify(openState)})`,
  );

  await page.keyboard.press('Escape');
  await waitFor(
    () => frame.evaluate(() => (
      document.querySelector('dialog.astryx-wb-mobile-nav')?.open !== true
    )),
    { label: 'the mobile navigation drawer to close' },
  );

  await metaClick(page, point);
  const triggerRow = await waitFor(
    () => page.evaluate(() => {
      const row = [...document.querySelectorAll('.wb-design-layer-list .wb-sidebar-row')].find((candidate) => (
        candidate.textContent?.includes('AstryxMobileNavTrigger')
      ));
      if (!row) return null;
      const rect = row.getBoundingClientRect();
      const mainRect = row.querySelector('.wb-sidebar-row-main')?.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        mainX: mainRect?.x ?? rect.x,
        mainY: mainRect?.y ?? rect.y,
        mainHeight: mainRect?.height ?? rect.height,
      };
    }),
    { label: 'the MobileNavTrigger layer row' },
  );
  await page.mouse.click(
    triggerRow.mainX + 24,
    triggerRow.mainY + triggerRow.mainHeight / 2,
  );
  await page.mouse.move(point.x, point.y);
  await sleep(120);

  const hiddenAddAction = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.wb-design-layer-list .wb-sidebar-row')].find((candidate) => (
      candidate.textContent?.includes('AstryxMobileNavTrigger')
    ));
    const actions = row?.querySelector('.wb-row-overlay-actions');
    const style = actions ? getComputedStyle(actions) : null;
    return {
      opacity: style?.opacity ?? null,
      pointerEvents: style?.pointerEvents ?? null,
    };
  });
  assert(
    hiddenAddAction.opacity === '0' && hiddenAddAction.pointerEvents === 'none',
    `a selected layer keeps Add child hidden away from hover (${JSON.stringify(hiddenAddAction)})`,
  );

  await page.mouse.move(
    triggerRow.x + Math.min(triggerRow.width - 8, 180),
    triggerRow.y + triggerRow.height / 2,
  );
  await sleep(120);
  const hoveredAddAction = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.wb-design-layer-list .wb-sidebar-row')].find((candidate) => (
      candidate.textContent?.includes('AstryxMobileNavTrigger')
    ));
    const actions = row?.querySelector('.wb-row-overlay-actions');
    const style = actions ? getComputedStyle(actions) : null;
    return {
      opacity: style?.opacity ?? null,
      pointerEvents: style?.pointerEvents ?? null,
    };
  });
  assert(
    hoveredAddAction.opacity === '1' && hoveredAddAction.pointerEvents === 'auto',
    `hover reveals the selected layer Add child action (${JSON.stringify(hoveredAddAction)})`,
  );
}
