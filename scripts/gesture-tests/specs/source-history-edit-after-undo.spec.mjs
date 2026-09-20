/**
 * Undo must not poison the edits that follow it.
 *
 * The failure this guards is silent: if an undo leaves the lane's controller
 * holding a value the file no longer has, the next edit commits into the
 * controller and never reaches disk — no notice, no console error, the file
 * simply stops changing. It only appears once an undo has happened earlier in
 * the same session, which is what makes it easy to misread as "undo is broken".
 *
 * Three paths, because they reach disk through different persist calls:
 * an Inspector prop edit, a structure edit (Cmd+D), and an outside change that
 * undo must refuse to overwrite.
 *
 * Two timing rules, both learned the hard way:
 *
 * - Never read the source file once after a fixed delay. The source path sits
 *   behind an async edit queue and a debounced save, so an early read looks
 *   exactly like a failure. Poll until the expected state appears.
 * - The file landing is not the end of an undo. Selection is restored after the
 *   write, and until it is, a layer the undo removed resolves to the document
 *   root — an edit issued in that window targets nothing and reads as data
 *   loss. Wait for the selection to come back too.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, openCanvas, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'SHADCN-002';

const SOURCE_FILE = 'src/workbench-pages/ComponentsCatalog.tsx';
// The structure shortcut handler drops a repeat of the same action inside 120ms.
const SHORTCUT_REPEAT_GUARD_MS = 250;

export default async function sourceHistoryEditAfterUndoSpec({ page, baseUrl, projectDir }) {
  const sourcePath = join(projectDir, SOURCE_FILE);
  const originalSource = await readSource(sourcePath);

  // Seed the page and the layer rather than inheriting the fixture's committed
  // session state: with no page selected the canvas never mounts and the run
  // fails at setup, which reads like a behaviour regression and is not one.
  // The layer is the one whose Inspector exposes the Disabled prop this spec
  // edits.
  await selectFixtureDesignPage(projectDir, {
    pageId: 'page-claude-catalog',
    sourceFile: SOURCE_FILE,
  });
  await selectFixtureDesignLayer(projectDir, `source:${SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:2-2-1-0-1-0-1`);

  await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });

  const selectedLayerId = await waitFor(
    () => readActiveDesignLayerId(projectDir),
    { label: 'the fixture to restore a selected design layer' },
  );
  assert(
    typeof selectedLayerId === 'string' && selectedLayerId.startsWith('source:'),
    `the fixture restores a source-backed selection (${String(selectedLayerId)})`,
  );

  const settled = {
    original: originalSource,
    projectDir,
    selectedLayerId,
    sourcePath,
  };

  // --- Prop path, on a freshly loaded editor ---------------------------------
  // Step 1 is the precondition, not the thing under test: if it fails, the
  // fixture's selection is wrong rather than the history path.
  await toggleDisabledProp(page);
  const afterPropEdit = await waitForSource(
    sourcePath,
    (contents) => contents !== originalSource,
    'the first prop edit to reach disk',
  );
  // The catalog page mentions "disabled" in plenty of other places, so count
  // rather than search: the toggle has to add exactly one occurrence.
  assert(
    countOccurrences(afterPropEdit, 'disabled') === countOccurrences(originalSource, 'disabled') + 1,
    'toggling the Disabled prop writes exactly one new prop into the source',
  );

  await pressDesignShortcut(page, 'z');
  await waitForUndoToSettle(page, settled, 'the prop edit');

  // The step that used to lose the write.
  await toggleDisabledProp(page);
  await waitForSource(
    sourcePath,
    (contents) => contents !== originalSource,
    'a prop edit made after an undo to reach disk',
  );
  await pressDesignShortcut(page, 'z');
  await waitForUndoToSettle(page, settled, 'the second prop edit');

  // --- Structure path -------------------------------------------------------
  await pressDesignShortcut(page, 'd');
  const afterDuplicate = await waitForSource(
    sourcePath,
    (contents) => contents !== originalSource,
    'the first duplicate to reach disk',
  );
  assert(
    afterDuplicate.length > originalSource.length,
    'duplicating a layer grows the source file',
  );

  await pressDesignShortcut(page, 'z');
  await waitForUndoToSettle(page, settled, 'the duplicate');

  await sleep(SHORTCUT_REPEAT_GUARD_MS);
  await pressDesignShortcut(page, 'd');
  const afterSecondDuplicate = await waitForSource(
    sourcePath,
    (contents) => contents !== originalSource,
    'a structure edit made after an undo to reach disk',
  );
  assert(
    afterSecondDuplicate.length > originalSource.length,
    'the structure edit after an undo grows the source file the same way the first one did',
  );

  await pressDesignShortcut(page, 'z');
  await waitForUndoToSettle(page, settled, 'the second duplicate');

  // --- No window between an undo's write and its selection ------------------
  // The two phases above wait for the selection before editing again. A user
  // does not. Undoing a duplicate removes the node that was selected, and if the
  // restored selection lands in a later render than the restored tree, the
  // layer resolves to the document root for that gap — an edit issued there
  // targets nothing and is silently dropped. Edit as soon as the file lands.
  //
  // This was ~60% reproducible before the tree and its selection were applied
  // together, so it is repeated: three attempts make a surviving window very
  // unlikely to pass unnoticed.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await pressDesignShortcut(page, 'd');
    await waitForSource(
      sourcePath,
      (contents) => contents !== originalSource,
      `duplicate ${attempt} of the no-wait round to reach disk`,
    );

    await pressDesignShortcut(page, 'z');
    await waitForSource(
      sourcePath,
      (contents) => contents === originalSource,
      `undo ${attempt} of the no-wait round to revert the file`,
    );

    await pressDesignShortcut(page, 'd');
    await waitForSource(
      sourcePath,
      (contents) => contents !== originalSource,
      `an edit issued the moment undo ${attempt} landed to reach disk`,
    );

    await pressDesignShortcut(page, 'z');
    await waitForUndoToSettle(page, settled, `no-wait round ${attempt}`);
  }

  // --- An outside change must survive --------------------------------------
  // The lane keeps its stack across all of the above, so undo has somewhere to
  // go. It must still refuse to go there once the file has moved underneath it.
  await toggleDisabledProp(page);
  await waitForSource(
    sourcePath,
    (contents) => contents !== originalSource,
    'a prop edit to reach disk before the file is changed from outside',
  );

  const outsideSource = `${originalSource}\n// edited outside Workbench\n`;
  await writeFile(sourcePath, outsideSource, 'utf8');
  await pressDesignShortcut(page, 'z');
  await sleep(3000);
  assert(
    (await readSource(sourcePath)) === outsideSource,
    'undo declines to overwrite a change made outside Workbench',
  );
}

async function readSource(sourcePath) {
  return readFile(sourcePath, 'utf8');
}

function countOccurrences(contents, needle) {
  return contents.split(needle).length - 1;
}

async function pressDesignShortcut(page, key) {
  await page.evaluate((shortcutKey) => {
    const target = document.querySelector('.wb-design-editor') ?? document.body;
    target.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: `Key${shortcutKey.toUpperCase()}`,
      key: shortcutKey,
      metaKey: true,
    }));
  }, key);
}

async function waitForSource(sourcePath, matches, label) {
  return waitFor(
    async () => {
      const contents = await readSource(sourcePath);
      return matches(contents) ? contents : null;
    },
    { intervalMs: 200, label, timeoutMs: 15000 },
  );
}

async function waitForUndoToSettle(page, { original, projectDir, selectedLayerId, sourcePath }, what) {
  await waitForSource(sourcePath, (contents) => contents === original, `undo to revert ${what} on disk`);
  await waitFor(
    async () => (await readActiveDesignLayerId(projectDir)) === selectedLayerId,
    { label: `undo of ${what} to restore the selection it recorded`, timeoutMs: 15000 },
  );
  await waitFor(
    () => page.evaluate(
      (selector) => document.querySelector(selector)?.checked === false,
      DISABLED_PROP_SELECTOR,
    ),
    { label: `the Inspector to reproject after undoing ${what}` },
  );
}

async function selectFixtureDesignLayer(projectDir, layerId) {
  const selection = await readFixtureSelection(projectDir);
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [layerId],
  };
  await writeFixtureSelection(projectDir, selection);
}

const DISABLED_PROP_SELECTOR = 'input[type="checkbox"][aria-label="Disabled prop"]';

async function toggleDisabledProp(page) {
  await page.waitForSelector(DISABLED_PROP_SELECTOR, { timeout: 30000 });
  await page.click(DISABLED_PROP_SELECTOR);
}
