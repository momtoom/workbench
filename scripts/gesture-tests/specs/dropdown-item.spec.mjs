/**
 * Regression: dropdown menu items projected into the theme portal must
 * resolve to their authored component node — not their text leaf — for both
 * Command+click selection and drag reordering.
 * (Bug reported 2026-07-29: Cmd+click selected the text node; dragging a menu
 * item never produced a drop target and reorder silently failed.)
 */
import {
  altClick,
  assert,
  dragBetween,
  metaClick,
  openCanvas,
  pagePointFor,
  readActiveDesignLayerId,
  selectFixtureDesignPage,
  scrollFrameSelectorIntoView,
  sleep,
  waitFor,
} from '../helpers.mjs';

export default async function dropdownItemSpec({ page, baseUrl, projectDir }) {
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-component-gallery',
    sourceFile: 'src/workbench-pages/ComponentGallery.tsx',
  });
  const frame = await openCanvas(page, baseUrl, { readySelector: '[aria-label="Account options"]' });
  await scrollFrameSelectorIntoView(frame, '[aria-label="Account options"]');

  const triggerPoint = await pagePointFor(page, frame, () => {
    const el = document.querySelector('[aria-label="Account options"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await altClick(page, triggerPoint);
  await waitFor(
    () => frame.evaluate(() => !!document.querySelector('[role="menu"]')),
    { label: 'dropdown menu to open' },
  );
  // Let the open/positioning animation settle before measuring item rects —
  // clicking against a mid-animation rect can land on the trigger instead.
  await sleep(600);

  // --- Command+click resolves the authored menu item, not its text leaf.
  const itemPoint = await pagePointFor(page, frame, () => {
    const el = [...document.querySelectorAll('[role="menuitem"]')]
      .find((item) => /Profile/.test(item.textContent ?? ''));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await metaClick(page, itemPoint);
  const expectedItemId = await frame.evaluate(() => (
    [...document.querySelectorAll('[role="menuitem"]')]
      .find((item) => /Profile/.test(item.textContent ?? ''))
      ?.getAttribute('data-wb-preview-node-id') ?? null
  ));
  assert(expectedItemId, 'menu item carries a preview node id');
  const selectedId = await waitFor(async () => {
    const id = await readActiveDesignLayerId(projectDir);
    return id && id !== 'source:src-workbench-pages-ComponentGallery-tsx:0' ? id : null;
  }, { label: 'selection to be committed', timeoutMs: 10000 });
  assert(!selectedId.endsWith('-text'), `selection is not the text leaf (got ${selectedId})`);
  assert(selectedId === expectedItemId, `selection is the menu item node (got ${selectedId}, want ${expectedItemId})`);

  // --- Dragging the selected item shows a drop target and commits a reorder.
  const menuStillOpen = await frame.evaluate(() => !!document.querySelector('[role="menu"]'));
  assert(menuStillOpen, 'menu stays open across editor selection');
  const points = await frame.evaluate(() => {
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    const profile = items.find((item) => /Profile/.test(item.textContent ?? ''));
    const documents = items.find((item) => /Documents/.test(item.textContent ?? ''));
    if (!profile || !documents) return null;
    const a = profile.getBoundingClientRect();
    const b = documents.getBoundingClientRect();
    return {
      from: { x: a.x + a.width / 2, y: a.y + a.height / 2 },
      to: { x: b.x + b.width / 2, y: b.y + b.height * 0.85 },
    };
  });
  assert(points, 'both menu items are visible');
  const { canvasFrameOffset } = await import('../helpers.mjs');
  const offset = await canvasFrameOffset(page);
  const seen = await dragBetween(
    page,
    frame,
    { x: offset.x + points.from.x, y: offset.y + points.from.y },
    { x: offset.x + points.to.x, y: offset.y + points.to.y },
  );
  assert(seen.ghost, 'drag ghost appeared');
  // Reorder drags show a live reflow projection rather than an indicator
  // line, so the observable contract is the committed order, not the chrome.
  await sleep(700);
  const order = await frame.evaluate(() => (
    [...document.querySelectorAll('[role="menuitem"]')].map((item) => (item.textContent ?? '').trim())
  ));
  assert(
    order.indexOf('Profile') > order.indexOf('Statements'),
    `menu order changed after drop (got ${JSON.stringify(order)})`,
  );

  // The reorder must round-trip into the page source, not just the DOM.
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const source = await readFile(
    join(projectDir, 'src', 'workbench-pages', 'ComponentGallery.tsx'),
    'utf8',
  );
  const profileAt = source.indexOf('DropdownMenuItem>Profile<');
  const statementsAt = source.indexOf('DropdownMenuItem>Statements<');
  assert(
    profileAt > statementsAt && statementsAt >= 0,
    'reorder was committed to the authored source file',
  );
}
