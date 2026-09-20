/**
 * Why a block dropped into a grid cell can stop being movable.
 *
 * The reporter's header block was dropped into the first cell of a
 * `grid grid-cols-3` by the drawer press-through bug. Every drag of a span
 * inside it since then reaches the writeback and comes back
 * `ok: false, "span could not be matched to an editable source range."` --
 * nothing is written, and the preview snaps back to the unchanged source.
 *
 * The fixture is that cell's shape verbatim: the dropped `<div>` shares the
 * cell with element siblings, and the drop left it on the same line as the
 * cell's opening tag.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { applySourceMoveNodeWriteback } from '@domain/document/editableTreeSourceWriteback';
import type { EditableTreeNode } from '@domain/document/editableTree';
import { parseEditableSource } from './testHelpers';

const SOURCE_FILE = 'src/workbench-pages/StrayBlockFixture.tsx';

const STRAY_BLOCK_SOURCE = `export default function StrayBlockFixture() {
  return (
    <main>
      <aside aria-label="info">
        <div className="head"><h2 className="title">Heading</h2></div>
        <div className="grid grid-cols-3">
          <div className="p-4">                  <div className="moved">
                    <span className="a">OP LANTERN</span>
                    <span className="b">/ subtitle</span>
                  </div>
<span className="label">Floor</span><strong className="value">180 m</strong></div>
          <div className="p-4"><span className="label">Ceiling</span><strong className="value">640 m</strong></div>
          <div className="p-4"><span className="label">End</span><strong className="value">19:00Z</strong></div>
        </div>
      </aside>
    </main>
  )
}
`;

function walk(node: EditableTreeNode): EditableTreeNode[] {
  return [node, ...(node.children ?? []).flatMap(walk)];
}

test('a span inside a block dropped into a grid cell can still be moved out', async () => {
  const tree = await parseEditableSource({
    contents: STRAY_BLOCK_SOURCE,
    label: 'StrayBlockFixture',
    sourceFile: SOURCE_FILE,
  });
  const nodes = walk(tree.root);
  const describe = (node: EditableTreeNode) => ({
    id: node.id.split(':').pop(),
    jsx: node.source?.jsxName,
    text: (node.textContent ?? '').slice(0, 20),
  });
  console.log('[test] parsed tree:');
  for (const node of nodes) console.log('   ', JSON.stringify(describe(node)));

  // Text lives in child text nodes, not on the element node itself.
  const span = nodes.find((node) => (
    node.source?.jsxName === 'span' &&
    walk(node).some((child) => (child.textContent ?? '').includes('subtitle'))
  ));
  const heading = nodes.find((node) => node.source?.jsxName === 'h2');
  assert.ok(span, 'the stray subtitle span is in the tree');
  assert.ok(heading, 'the heading is in the tree');

  const result = await applySourceMoveNodeWriteback({
    contents: STRAY_BLOCK_SOURCE,
    node: span,
    sourceFile: SOURCE_FILE,
    targetIndex: 1,
    targetParentNode: heading,
  });
  console.log('[test] writeback:', { ok: result.ok, diagnostic: result.diagnostic });
  assert.equal(result.ok, true, result.diagnostic);
});

// Diagnostic against a real page, opt-in so the suite stays hermetic:
//   WB_PAGE_PATH=/abs/path/to/Page.tsx WB_PAGE_NODE_ID=0-1-1-0-1-0-0-1 npm run test:editable-tree
test('a real page hands the canvas the node ids the parser produces', async (t) => {
  const pagePath = process.env.WB_PAGE_PATH;
  const wantedId = process.env.WB_PAGE_NODE_ID;
  if (!pagePath || !wantedId) return t.skip('WB_PAGE_PATH / WB_PAGE_NODE_ID not set');

  const { readFile } = await import('node:fs/promises');
  const contents = await readFile(pagePath, 'utf8');
  const tree = await parseEditableSource({
    contents,
    label: 'RealPage',
    sourceFile: process.env.WB_PAGE_SOURCE_FILE ?? 'src/workbench-pages/Page.tsx',
  });
  const nodes = walk(tree.root);
  const match = nodes.find((node) => node.id.endsWith(`:${wantedId}`) || node.id === wantedId);
  console.log('[test] parser produced', nodes.length, 'nodes');
  console.log(`[test] node ${wantedId} exists in a fresh parse:`, Boolean(match));
  if (match) {
    console.log('[test] it is:', { jsx: match.source?.jsxName, label: match.label });
    const parentId = process.env.WB_PAGE_TARGET_ID;
    const parent = parentId
      ? nodes.find((node) => node.id.endsWith(`:${parentId}`) || node.id === parentId)
      : null;
    console.log(`[test] drop target ${parentId} exists:`, Boolean(parent));
    if (parent) {
      // Sweep several candidates against the same target: whichever ones fail
      // localize the unmappable region.
      const sweep = (process.env.WB_PAGE_SWEEP_IDS ?? wantedId).split(',').map((id) => id.trim());
      for (const id of sweep) {
        const candidate = nodes.find((node) => node.id.endsWith(`:${id}`) || node.id === id);
        if (!candidate) {
          console.log(`[test] ${id.padEnd(20)} -> not in tree`);
          continue;
        }
        const moved = await applySourceMoveNodeWriteback({
          contents,
          node: candidate,
          sourceFile: process.env.WB_PAGE_SOURCE_FILE ?? 'src/workbench-pages/Page.tsx',
          targetIndex: 1,
          targetParentNode: parent,
        });
        console.log(
          `[test] ${id.padEnd(20)} ${String(candidate.source?.jsxName).padEnd(8)}`,
          moved.ok ? 'OK' : `FAIL: ${moved.diagnostic}`,
        );
      }
    }
  } else {
    const near = nodes.filter((node) => node.id.includes(wantedId.slice(0, wantedId.lastIndexOf('-'))));
    console.log('[test] siblings under the same parent path:');
    for (const node of near.slice(0, 12)) console.log('   ', node.id.split(':').pop(), node.source?.jsxName);
  }
});
