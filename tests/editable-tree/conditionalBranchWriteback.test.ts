/**
 * Why a layer reorder could write a page that no longer parses.
 *
 * The parser projects a conditional's rendered branch into its parent's own
 * child slot, so `{open ? <aside/> : <aside/>}` shows up in the layer tree as
 * a plain `aside` sibling. Every structural writeback then spliced text at
 * that branch's own offset -- which sits *inside* `{open ? (` -- so dragging
 * the sibling above it produced two adjacent JSX elements in a slot that holds
 * exactly one expression, and the page stopped opening.
 *
 * The fixture is the reported page's shape: a positioned wrapper holding a
 * conditional inspector panel and a map that renders in both states.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySourceMoveNodeWriteback,
  applySourceStructureWriteback,
} from '@domain/document/editableTreeSourceWriteback';
import type { EditableDocumentTree, EditableTreeNode } from '@domain/document/editableTree';
import { findNodeByJsxName, parseEditableSource } from './testHelpers';

const SOURCE_FILE = 'src/workbench-pages/ConditionalBranchFixture.tsx';
const CONDITIONAL_SOURCE = `import { useState } from "react"

export default function ConditionalBranchFixture() {
  const [inspectorOpen, setInspectorOpen] = useState(true)

  return (
    <main>
      <div className="relative min-h-0 flex-1">
        {inspectorOpen ? (
          <aside className="w-80">
            <button onClick={() => setInspectorOpen(false)}>Close</button>
          </aside>
        ) : (
          <aside className="w-12">
            <button onClick={() => setInspectorOpen(true)}>Open</button>
          </aside>
        )}
        <TerrainMap className="absolute inset-0" zoom={12.8} />
      </div>
    </main>
  )
}
`;

// Duplicate refuses any subtree carrying event handlers, so the duplicate case
// needs a branch without them to reach the range logic at all.
const HANDLER_FREE_SOURCE = `export default function ConditionalBranchFixture({ inspectorOpen }: { inspectorOpen: boolean }) {
  return (
    <main>
      <div className="relative min-h-0 flex-1">
        {inspectorOpen ? (
          <aside className="w-80">Expanded</aside>
        ) : (
          <aside className="w-12">Collapsed</aside>
        )}
        <TerrainMap className="absolute inset-0" zoom={12.8} />
      </div>
    </main>
  )
}
`;

async function parseFixture(contents: string): Promise<EditableDocumentTree> {
  return parseEditableSource({
    contents,
    label: 'ConditionalBranchFixture',
    sourceFile: SOURCE_FILE,
  });
}

function findWrapper(tree: EditableDocumentTree): EditableTreeNode {
  return findNodeByJsxName(tree, 'div');
}

test('the layer tree shows a conditional branch as an ordinary sibling', async () => {
  const tree = await parseFixture(CONDITIONAL_SOURCE);
  const wrapper = findWrapper(tree);
  const childNames = (wrapper.children ?? []).map((child) => child.source?.jsxName);

  // Two children, not three: the conditional itself is invisible here. That
  // projection is what makes the offsets below easy to get wrong.
  assert.deepEqual(childNames, ['aside', 'TerrainMap']);
});

test('moving a sibling above a conditional branch keeps it outside the conditional', async () => {
  const tree = await parseFixture(CONDITIONAL_SOURCE);
  const wrapper = findWrapper(tree);
  const map = findNodeByJsxName(tree, 'TerrainMap');

  const moved = await applySourceMoveNodeWriteback({
    contents: CONDITIONAL_SOURCE,
    node: map,
    sourceFile: SOURCE_FILE,
    targetIndex: 0,
    targetParentNode: wrapper,
  });

  assert.equal(moved.ok, true, moved.diagnostic);
  assert.equal(moved.changed, true);
  assert.match(
    moved.nextContents,
    /<TerrainMap[^>]*\/>\s*\n\s*\{inspectorOpen \?/,
    'the map should land before the conditional, not inside its branch',
  );

  // The real regression: the written file has to still parse.
  const reparsed = await parseFixture(moved.nextContents);
  const childNames = (findWrapper(reparsed).children ?? []).map((child) => child.source?.jsxName);
  assert.deepEqual(childNames, ['TerrainMap', 'aside']);
});

test('moving the conditional branch itself carries the whole conditional', async () => {
  const tree = await parseFixture(CONDITIONAL_SOURCE);
  const main = findNodeByJsxName(tree, 'main');
  const aside = findNodeByJsxName(tree, 'aside');

  const moved = await applySourceMoveNodeWriteback({
    contents: CONDITIONAL_SOURCE,
    node: aside,
    sourceFile: SOURCE_FILE,
    targetIndex: 0,
    targetParentNode: main,
  });

  assert.equal(moved.ok, true, moved.diagnostic);
  assert.equal(moved.changed, true);
  assert.match(moved.nextContents, /\{inspectorOpen \?/, 'the conditional moves with its branch');
  assert.doesNotMatch(
    moved.nextContents,
    /\{inspectorOpen \?\s*\)/,
    'the conditional must not be left with a missing arm',
  );

  const reparsed = await parseFixture(moved.nextContents);
  assert.equal((findWrapper(reparsed).children ?? []).length, 1, 'only the map is left in the wrapper');
});

test('deleting a conditional branch removes the whole conditional', async () => {
  const tree = await parseFixture(CONDITIONAL_SOURCE);
  const aside = findNodeByJsxName(tree, 'aside');

  const deleted = await applySourceStructureWriteback({
    action: 'delete',
    contents: CONDITIONAL_SOURCE,
    node: aside,
    sourceFile: SOURCE_FILE,
  });

  assert.equal(deleted.ok, true, deleted.diagnostic);
  assert.equal(deleted.changed, true);
  assert.doesNotMatch(deleted.nextContents, /inspectorOpen \?/, 'no dangling ternary is left behind');

  const reparsed = await parseFixture(deleted.nextContents);
  const childNames = (findWrapper(reparsed).children ?? []).map((child) => child.source?.jsxName);
  assert.deepEqual(childNames, ['TerrainMap']);
});

test('duplicating a conditional branch duplicates the whole conditional', async () => {
  const tree = await parseFixture(HANDLER_FREE_SOURCE);
  const aside = findNodeByJsxName(tree, 'aside');

  const duplicated = await applySourceStructureWriteback({
    action: 'duplicate',
    contents: HANDLER_FREE_SOURCE,
    node: aside,
    sourceFile: SOURCE_FILE,
  });

  assert.equal(duplicated.ok, true, duplicated.diagnostic);
  assert.equal(duplicated.changed, true);

  const reparsed = await parseFixture(duplicated.nextContents);
  const childNames = (findWrapper(reparsed).children ?? []).map((child) => child.source?.jsxName);
  assert.deepEqual(childNames, ['aside', 'aside', 'TerrainMap']);
});

test('reordering past a conditional branch swaps whole siblings', async () => {
  const tree = await parseFixture(CONDITIONAL_SOURCE);
  const map = findNodeByJsxName(tree, 'TerrainMap');

  const reordered = await applySourceStructureWriteback({
    action: 'move-up',
    contents: CONDITIONAL_SOURCE,
    node: map,
    sourceFile: SOURCE_FILE,
  });

  assert.equal(reordered.ok, true, reordered.diagnostic);
  assert.equal(reordered.changed, true);

  // Swapping the inner ranges also produces a parseable file -- one where the
  // map became the conditional branch and the panel became unconditional. So
  // check which element the conditional still governs, not just the order.
  assert.match(
    reordered.nextContents,
    /\{inspectorOpen \?[\s\S]{0,40}<aside className="w-80"/,
    'the conditional still governs the expanded panel',
  );
  assert.match(
    reordered.nextContents,
    /<TerrainMap[^>]*\/>[\s\S]*\{inspectorOpen \?/,
    'the map is now above the conditional, and outside it',
  );

  const reparsed = await parseFixture(reordered.nextContents);
  const childNames = (findWrapper(reparsed).children ?? []).map((child) => child.source?.jsxName);
  assert.deepEqual(childNames, ['TerrainMap', 'aside']);
});
