/**
 * Runtime gesture ownership (see "Canvas Interaction Invariants" in
 * docs/WORKBENCH-V1-AGENT-GUIDE.md):
 *
 *  - Option/Alt+click is the explicit runtime-interaction chord: the previewed
 *    component owns the complete gesture (the dropdown opens) and the editor
 *    selection must NOT change.
 *  - (Not yet asserted — see the KNOWN GAP note at the end.) An ordinary
 *    click on the same semantic control belongs to the editor: it selects the
 *    authored node without activating the component.
 *
 * This area regressed repeatedly (Option/Alt ownership fix commits 36f48150c,
 * bc515c0a3).
 */
import {
  altClick,
  assert,
  openCanvas,
  pagePointFor,
  readActiveDesignLayerId,
  scrollFrameSelectorIntoView,
  selectFixtureDesignPage,
  sleep,
  waitFor,
} from '../helpers.mjs';

const TRIGGER_SELECTOR = '[aria-label="Account options"]';

export default async function runtimeChordSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-component-gallery',
    sourceFile: 'src/workbench-pages/ComponentGallery.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: TRIGGER_SELECTOR });
  await scrollFrameSelectorIntoView(frame, TRIGGER_SELECTOR);

  const triggerPoint = () => pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="Account options"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const triggerNodeId = await frame.evaluate((sel) => (
    document.querySelector(sel)?.closest('[data-wb-preview-node-id]')
      ?.getAttribute('data-wb-preview-node-id') ?? null
  ), TRIGGER_SELECTOR);
  assert(triggerNodeId, 'trigger resolves to an authored node id');

  // --- Part 1: Alt+click is runtime-owned — menu opens, selection untouched.
  const selectionBefore = await readActiveDesignLayerId(projectDir);
  await altClick(page, await triggerPoint());
  await waitFor(
    () => frame.evaluate(() => !!document.querySelector('[role="menu"]')),
    { label: 'dropdown to open on Alt+click' },
  );
  // Selection writes are debounced; give a violation time to surface.
  await sleep(4000);
  const selectionAfterAlt = await readActiveDesignLayerId(projectDir);
  assert(
    selectionAfterAlt === selectionBefore,
    `Alt+click must not change editor selection (was ${selectionBefore}, now ${selectionAfterAlt})`,
  );

  // Close the menu with the same runtime chord (trigger toggles).
  await altClick(page, await triggerPoint());
  await waitFor(
    () => frame.evaluate(() => !document.querySelector('[role="menu"]')),
    { label: 'dropdown to close on second Alt+click' },
  );

  // KNOWN GAP (2026-07-29): the editor-owned half of the invariant — an
  // ordinary click on the same semantic control selecting the authored node
  // without activating the component — is not asserted here yet. In this
  // headless environment, UNMODIFIED synthetic clicks (mouse.click and
  // explicit move/down/up alike) never reach the canvas iframe document at
  // all, while Alt/Meta-modified clicks and unmodified drag sequences do; the
  // app never receives the press, so its behavior cannot be observed. Verify
  // by hand in the app, and extend this spec once the delivery quirk is
  // understood (see the canvas-repro memory note).
}
