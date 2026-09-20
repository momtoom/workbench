/**
 * Regression: Command-click resolves the deepest authored node under the
 * pointer, then climbs only through a single-child chain until that node has
 * siblings. Parent div event targeting must not hide empty spans or
 * pointer-events:none Icon roots.
 */
import {
  altClick,
  assert,
  canvasPagePoint,
  metaClick,
  openCanvas,
  readActiveDesignLayerId,
  selectFixtureDesignPage,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'SHADCN-002';

// These waits sit behind runtime animations (the Drawer opens and closes) and
// behind selection reaching selection.json. Five seconds was enough alone and
// not under a full-suite run, which read as a shared-state ordering problem and
// was really just a machine under load.
const RUNTIME_SETTLE_TIMEOUT_MS = 15000;

function decodeRuntimeRootNodeId(className) {
  const encoded = className.match(/(?:^|\s)wb-source-runtime-root-([0-9a-f-]+)/)?.[1] ?? null;
  if (!encoded) return null;
  return encoded
    .split('-')
    .map((value) => String.fromCharCode(Number.parseInt(value, 16)))
    .join('');
}

async function waitForExactSelection(projectDir, expectedId, label) {
  return waitFor(
    async () => {
      const selectedId = await readActiveDesignLayerId(projectDir);
      return selectedId === expectedId ? selectedId : null;
    },
    { label, timeoutMs: RUNTIME_SETTLE_TIMEOUT_MS, intervalMs: 80 },
  );
}

async function commandSelectTrigger({ frame, label, page, projectDir }) {
  const trigger = await frame.evaluate((wantedLabel) => {
    const element = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === wantedLabel);
    if (!element) return null;
    element.scrollIntoView({ block: 'center', inline: 'center' });
    return {
      className: element.className,
      id:
        element.getAttribute('data-wb-runtime-owner-node-id') ??
        element.getAttribute('data-wb-preview-node-id'),
    };
  }, label);
  const triggerId = trigger?.id ?? (trigger ? decodeRuntimeRootNodeId(trigger.className) : null);
  assert(triggerId, `${label} forwards its authored root identity to the visible trigger`);
  await sleep(350);
  const framePoint = await frame.evaluate((wantedLabel) => {
    const element = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === wantedLabel);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, label);
  assert(framePoint, `${label} exposes visible trigger geometry`);
  const pagePoint = await canvasPagePoint(page, framePoint);
  assert(pagePoint.onCanvas, `${label} is visible through the Workbench canvas`);
  await metaClick(page, pagePoint);
  await waitForExactSelection(projectDir, triggerId, `${label} authored root selection`);
}

async function verifyDrawerCanClose(page, frame) {
  const triggerPoint = await frame.evaluate(() => {
    const trigger = [...document.querySelectorAll('button')]
      .find((candidate) => candidate.textContent?.trim() === 'Bottom drawer');
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  assert(triggerPoint, 'the Drawer trigger can activate the runtime surface');
  const triggerPagePoint = await canvasPagePoint(page, triggerPoint);
  assert(triggerPagePoint.onCanvas, 'the Drawer trigger is visible through the Workbench canvas');
  await altClick(page, triggerPagePoint);
  await waitFor(
    () => frame.evaluate(() => Boolean(
      document.querySelector('[data-slot="drawer-content"][data-state="open"]') &&
      [...document.querySelectorAll('[data-slot="drawer-close"]')]
        .some((candidate) => candidate.textContent?.trim() === 'Close drawer'),
    )),
    { label: 'the Drawer exposes a visible close control', timeoutMs: RUNTIME_SETTLE_TIMEOUT_MS, intervalMs: 80 },
  );
  const closePagePoint = await waitFor(
    async () => {
      const closePoint = await frame.evaluate(() => {
        const close = [...document.querySelectorAll('[data-slot="drawer-close"]')]
          .find((candidate) => candidate.textContent?.trim() === 'Close drawer');
        if (!(close instanceof HTMLElement)) return null;
        const rect = close.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      if (!closePoint) return null;
      const pagePoint = await canvasPagePoint(page, closePoint);
      return pagePoint.onCanvas ? pagePoint : null;
    },
    {
      label: 'the animated Drawer close control to enter the visible Workbench canvas',
      timeoutMs: RUNTIME_SETTLE_TIMEOUT_MS,
      intervalMs: 80,
    },
  );
  await altClick(page, closePagePoint);
  await waitFor(
    () => frame.evaluate(() => !document.querySelector('[data-slot="drawer-content"][data-state="open"]')),
    { label: 'the Drawer closes from its visible close control', timeoutMs: RUNTIME_SETTLE_TIMEOUT_MS, intervalMs: 80 },
  );
}

export default async function divChildCommandSelectionSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-shadcn-catalog',
    sourceFile: 'src/workbench-pages/ShadcnCatalog.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: '.wb-source-visual-preview' });

  // The catalog is long and its source ids are attached as the projection
  // lands, so querying straight after the canvas mounts races the render.
  const swatch = await waitFor(
    () => frame.evaluate(() => {
      const element = document.querySelector('[aria-label="Neutral theme colors"] > span');
      if (!element) return null;
      element.scrollIntoView({ block: 'center', inline: 'center' });
      const id =
        element.getAttribute('data-wb-runtime-owner-node-id') ??
        element.getAttribute('data-wb-preview-node-id');
      return id ? { id } : null;
    }),
    { label: 'the authored theme swatch span to render with a source id', timeoutMs: 20000 },
  );
  assert(swatch?.id, 'the authored theme swatch span is rendered with a source id');
  await sleep(350);
  const swatchFramePoint = await frame.evaluate((id) => {
    const element = document.querySelector(`[data-wb-preview-node-id="${id}"]`);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, swatch.id);
  assert(swatchFramePoint, 'the authored theme swatch exposes visible geometry');
  const swatchPagePoint = await canvasPagePoint(page, swatchFramePoint);
  assert(swatchPagePoint.onCanvas, 'the theme swatch is visible through the Workbench canvas');
  await metaClick(page, swatchPagePoint);
  await waitForExactSelection(projectDir, swatch.id, 'the exact sibling swatch selection');

  const icon = await frame.evaluate(() => {
    const element = document.querySelector('.wb-icon[class*="wb-source-runtime-root-"]');
    if (!element) return null;
    element.scrollIntoView({ block: 'center', inline: 'center' });
    return { className: element.className };
  });
  const iconId = icon ? decodeRuntimeRootNodeId(icon.className) : null;
  assert(iconId, 'the authored Icon root is rendered with a runtime source marker');
  await sleep(350);
  const iconHit = await frame.evaluate((expectedIconId) => {
    const element = [...document.querySelectorAll('.wb-icon[class*="wb-source-runtime-root-"]')]
      .find((candidate) => candidate.className.includes(
        [...expectedIconId].map((character) => character.charCodeAt(0).toString(16).padStart(2, '0')).join('-'),
      ));
    if (!element) return null;
    const siblingBoundary = element.parentElement?.closest('[data-wb-preview-node-id]');
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const nativeTarget = document.elementFromPoint(x, y);
    return {
      nativeTargetId: nativeTarget?.getAttribute?.('data-wb-preview-node-id') ?? null,
      siblingBoundaryId: siblingBoundary?.getAttribute('data-wb-preview-node-id') ?? null,
      x,
      y,
    };
  }, iconId);
  assert(iconHit, 'the authored Icon exposes visible geometry');
  assert(iconHit.nativeTargetId !== iconId, 'the Icon reproduces parent-div native event targeting');
  assert(iconHit.siblingBoundaryId, 'the single-child Icon has an authored parent boundary with siblings');
  const iconPagePoint = await canvasPagePoint(page, iconHit);
  assert(iconPagePoint.onCanvas, 'the Icon is visible through the Workbench canvas');
  await metaClick(page, iconPagePoint);
  await waitForExactSelection(
    projectDir,
    iconHit.siblingBoundaryId,
    'the Icon smart-deep selection to stop at the first parent boundary with siblings',
  );

  await commandSelectTrigger({
    frame,
    label: 'Bottom drawer',
    page,
    projectDir,
  });
  await verifyDrawerCanClose(page, frame);
  await commandSelectTrigger({
    frame,
    label: 'Right inspector',
    page,
    projectDir,
  });
}
