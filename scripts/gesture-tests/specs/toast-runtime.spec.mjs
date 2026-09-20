/** Regression: the source-backed ToastTrigger activates inside Design preview. */
import {
  altClick,
  assert,
  canvasPagePoint,
  openCanvas,
  selectFixtureDesignPage,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'SHADCN-002';

export default async function toastRuntimeSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-shadcn-catalog',
    sourceFile: 'src/workbench-pages/ShadcnCatalog.tsx',
  });
  // The runner defaults to 1680x1000, where the canvas frame's right edge sits
  // behind the Inspector aside and elementFromPoint there answers shell chrome
  // rather than the canvas iframe (2026-09-03 handoff, §3.2). A point measured
  // inside the frame then presses nothing, which reads as an editor failure.
  // 1980x1000 is the first size that contains the frame and clears the aside.
  await page.setViewport({ width: 1980, height: 1000 });
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });
  // The canvas mounts before the page's runtime module renders into it, so
  // looking for the trigger straight away races an empty canvas and reads as
  // "the trigger does not render".
  await waitFor(
    () => frame.evaluate(() => [...document.querySelectorAll('button')]
      .some((candidate) => candidate.textContent?.trim() === 'Success toast')),
    { label: 'the fixture page to render its toast triggers', timeoutMs: 30000 },
  );
  const triggerPoint = await frame.evaluate(() => {
    const trigger = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === 'Success toast');
    if (!trigger) return null;
    trigger.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = trigger.getBoundingClientRect();
    return {
      componentName: trigger.getAttribute('data-wb-source-component-name'),
      id:
        trigger.getAttribute('data-wb-runtime-owner-node-id') ??
        trigger.getAttribute('data-wb-preview-node-id'),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
  assert(triggerPoint, 'the ToastTrigger trigger renders in the Design preview');
  assert(triggerPoint.id, 'the ToastTrigger trigger forwards its authored root identity');
  await sleep(350);
  const pagePoint = await canvasPagePoint(page, triggerPoint);
  assert(pagePoint.onCanvas, 'the ToastTrigger trigger is visible through the Workbench canvas');
  await altClick(page, pagePoint);
  const toastState = await waitFor(
    () => frame.evaluate(() => {
      const toast = [...document.querySelectorAll('[data-slot="toast"]')]
        .find((candidate) => candidate.textContent?.includes('Component catalog updated'));
      const viewport = toast?.closest('[data-slot="toast-viewport"]');
      if (!toast || !viewport) return null;
      const rect = toast.getBoundingClientRect();
      const toastStyle = getComputedStyle(toast);
      const viewportStyle = getComputedStyle(viewport);
      if (viewportStyle.position !== 'fixed' || toastStyle.position !== 'absolute') return null;
      if (rect.right > innerWidth || rect.bottom > innerHeight) return null;
      return {
        height: rect.height,
        toasterPosition: viewportStyle.position,
        toastPosition: toastStyle.position,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      };
    }),
    { label: 'the styled toast to open inside the Design viewport', timeoutMs: 5000, intervalMs: 80 },
  );
  assert(toastState.width >= 280 && toastState.width <= 420, 'the toast keeps its compact component width');
  assert(toastState.height >= 40, 'the toast keeps its styled component height');
  assert(toastState.x > 0 && toastState.y > 0, 'the toast stays inside the visible Design viewport');

  const actionPoint = await frame.evaluate(() => {
    const action = [...document.querySelectorAll('[data-slot="toast-action"]')]
      .find((candidate) => candidate.textContent?.trim() === 'View');
    if (!action) return null;
    const rect = action.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  assert(actionPoint, 'the authored toast action button renders inside the toast');
  await altClick(page, await canvasPagePoint(page, actionPoint));
  await waitFor(
    () => frame.evaluate(() => document.querySelectorAll('[data-slot="toast"]').length === 0),
    { label: 'the toast action to dismiss the toast', timeoutMs: 5000, intervalMs: 80 },
  );

  await altClick(page, pagePoint);
  const reopenedToastState = await waitFor(
    () => frame.evaluate(() => {
      const toast = [...document.querySelectorAll('[data-slot="toast"]')]
        .find((candidate) => candidate.textContent?.includes('Component catalog updated'));
      if (!toast) return null;
      const content = toast.querySelector('[data-slot="toast-content"]');
      if (!content) return null;
      const rect = toast.getBoundingClientRect();
      const style = getComputedStyle(toast);
      const contentStyle = getComputedStyle(content);
      if (style.position !== 'absolute') return null;
      if (contentStyle.padding === '0px' || style.backgroundColor === 'rgba(0, 0, 0, 0)') return null;
      return { backgroundColor: style.backgroundColor, height: rect.height, padding: contentStyle.padding, width: rect.width };
    }),
    { label: 'the styled toast to reopen after dismissal', timeoutMs: 5000, intervalMs: 80 },
  );
  assert(reopenedToastState.width >= 280 && reopenedToastState.width <= 420, 'the reopened toast keeps its compact width');
  assert(reopenedToastState.height >= 40, 'the reopened toast keeps its styled height');
}
