/**
 * Copy on one page must stay pastable after switching to another page.
 *
 * The clipboard payload lives on DesignEditor state, not on a history lane,
 * so a page switch must not invalidate it: the paste writeback only refuses a
 * cross-file paste when the copied node carries source-local bindings
 * (`requiresSameSourceFile`). This spec guards the full in-session round trip:
 * copy on page A, switch pages through the shell UI, paste into a layer on
 * page B, and require the pasted JSX to land in page B's source file.
 *
 * When paste fails, the inspector notice says which guard refused it; the
 * assertion message carries that text so a regression names its own cause.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, openCanvas, readActiveDesignLayerId, readFixtureSelection, selectFixtureDesignPage, sleep, waitFor, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'SHADCN-002';

const COPY_SOURCE_FILE = 'src/workbench-pages/ComponentsCatalog.tsx';
const COPY_PAGE_ID = 'page-claude-catalog';
// Same interaction-safe layer the source-history spec edits.
const COPY_LAYER_ID = `source:${COPY_SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:2-2-1-0-1-0-1`;

const PASTE_SOURCE_FILE = 'src/workbench-pages/EnergyReview.tsx';
const PASTE_NODE_PREFIX = `source:${PASTE_SOURCE_FILE.replace(/[^A-Za-z0-9]+/g, '-')}:`;

export default async function crossPageCopyPasteSpec({ page, baseUrl, projectDir }) {
  const pasteSourcePath = join(projectDir, PASTE_SOURCE_FILE);
  const pasteSourceBefore = await readFile(pasteSourcePath, 'utf8');
  const copySourceBefore = await readFile(join(projectDir, COPY_SOURCE_FILE), 'utf8');

  await selectFixtureDesignPage(projectDir, {
    pageId: COPY_PAGE_ID,
    sourceFile: COPY_SOURCE_FILE,
  });
  await seedFixtureDesignLayer(projectDir, COPY_LAYER_ID);

  await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });
  await waitFor(
    async () => (await readActiveDesignLayerId(projectDir)) === COPY_LAYER_ID,
    { label: 'the fixture to restore the copy-page selection' },
  );

  // --- Copy on page A -------------------------------------------------------
  // Copy has no disk side effect and its notice sits in a collapsed section,
  // so give the async payload build a beat instead of polling for it. The
  // paste assertion downstream is the real observable.
  await pressDesignShortcut(page, 'c');
  await sleep(750);

  // --- Switch pages through the shell, as a user does -----------------------
  await switchToPage(page, PASTE_SOURCE_FILE);
  const pasteFrame = await waitFor(
    async () => {
      const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
      if (!frame) return null;
      const ready = await frame.evaluate(
        (prefix) => !!document.querySelector(`[data-wb-preview-node-id^="${prefix}"]`),
        PASTE_NODE_PREFIX,
      ).catch(() => false);
      return ready ? frame : null;
    },
    { label: 'the paste page to render source-backed nodes', timeoutMs: 30000 },
  );

  // --- Select a source-backed layer on page B via the canvas ----------------
  const targetNodeId = await pasteFrame.evaluate((prefix) => {
    const node = document.querySelector(`[data-wb-preview-node-id^="${prefix}"]`);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    node.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, clientX: rect.x + 4, clientY: rect.y + 4, isPrimary: true, pointerId: 1,
    }));
    node.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, clientX: rect.x + 4, clientY: rect.y + 4, isPrimary: true, pointerId: 1,
    }));
    return node.getAttribute('data-wb-preview-node-id');
  }, PASTE_NODE_PREFIX);
  assert(targetNodeId, 'page B renders a source-backed node to paste onto');

  await waitFor(
    async () => {
      const active = await readActiveDesignLayerId(projectDir);
      return typeof active === 'string' && active.startsWith(PASTE_NODE_PREFIX) ? active : null;
    },
    { label: 'the canvas press to select a source layer on the paste page', timeoutMs: 15000 },
  );

  // --- Paste ----------------------------------------------------------------
  await pressDesignShortcut(page, 'v');

  let pasteLanded = true;
  try {
    await waitFor(
      async () => {
        const contents = await readFile(pasteSourcePath, 'utf8');
        return contents !== pasteSourceBefore ? contents : null;
      },
      { intervalMs: 200, label: 'the cross-page paste to reach the target source file', timeoutMs: 15000 },
    );
  } catch {
    pasteLanded = false;
  }

  if (!pasteLanded) {
    const status = await readInspectorStatus(page);
    assert(
      false,
      `pasting a layer copied from another page reaches the target source file (inspector status: ${status ?? 'unavailable'})`,
    );
  }

  const copySourceAfter = await readFile(join(projectDir, COPY_SOURCE_FILE), 'utf8');
  assert(
    copySourceAfter === copySourceBefore,
    'a cross-page paste leaves the copy-source page untouched',
  );
}

async function seedFixtureDesignLayer(projectDir, layerId) {
  const selection = await readFixtureSelection(projectDir);
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [layerId],
  };
  const { writeFile } = await import('node:fs/promises');
  await writeFixtureSelection(projectDir, selection);
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

async function switchToPage(page, sourceFile) {
  const clicked = await page.evaluate((file) => {
    const candidates = [...document.querySelectorAll('button, [role="button"]')];
    const match = candidates.find((el) => (el.title || el.textContent || '').includes(file))
      ?? candidates.find((el) => (el.textContent || '').includes(file.split('/').pop()));
    if (!match) return false;
    match.click();
    return true;
  }, sourceFile);
  assert(clicked, `the shell exposes a control that opens ${sourceFile}`);
}

/** Open the collapsed Context section and read its Status field for diagnosis. */
async function readInspectorStatus(page) {
  return page.evaluate(() => {
    const header = [...document.querySelectorAll('button, summary, [role="button"]')]
      .find((el) => (el.textContent || '').trim().toLowerCase() === 'context');
    header?.click();
    const fields = [...document.querySelectorAll('*')]
      .filter((el) => el.children.length === 0)
      .map((el) => (el.textContent || '').trim());
    const statusIndex = fields.findIndex((text) => text === 'Status');
    return statusIndex >= 0 ? fields.slice(statusIndex, statusIndex + 3).join(' ') : null;
  });
}
