import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySourceMoveNodeWriteback,
  applySourceStructureWriteback,
} from '@domain/document/editableTreeSourceWriteback';
import {
  findNodeByJsxName,
  findNodesByJsxName,
  parseEditableSource,
} from './testHelpers';

const SOURCE_FILE = 'src/workbench-pages/StructureWritebackFixture.tsx';
const INITIAL_SOURCE = `export default function StructureWritebackFixture() {
  return (
    <main>
      <section aria-label="Alpha"><p>First</p></section>
      <section aria-label="Beta"><p>Second</p></section>
    </main>
  )
}
`;

test('duplicate and delete structure edits survive reparsing and preserve sibling order', async () => {
  let contents = INITIAL_SOURCE;
  let tree = await parseFixture(contents);
  const alpha = findSectionByLabel(tree, 'Alpha');
  const duplicate = await applySourceStructureWriteback({
    action: 'duplicate',
    contents,
    node: alpha,
    sourceFile: SOURCE_FILE,
  });

  assert.equal(duplicate.ok, true, duplicate.diagnostic);
  assert.equal(duplicate.changed, true);
  contents = duplicate.nextContents;
  tree = await parseFixture(contents);
  assert.deepEqual(readSectionLabels(tree), ['Alpha', 'Alpha', 'Beta']);

  const duplicatedAlpha = findSectionsByLabel(tree, 'Alpha')[1];
  assert.ok(duplicatedAlpha);
  const deletion = await applySourceStructureWriteback({
    action: 'delete',
    contents,
    node: duplicatedAlpha,
    sourceFile: SOURCE_FILE,
  });

  assert.equal(deletion.ok, true, deletion.diagnostic);
  assert.equal(deletion.changed, true);
  tree = await parseFixture(deletion.nextContents);
  assert.deepEqual(readSectionLabels(tree), ['Alpha', 'Beta']);
  assert.match(deletion.nextContents, /<p>First<\/p>/);
  assert.match(deletion.nextContents, /<p>Second<\/p>/);
});

test('move structure edit commits authored order and reparses to the same order', async () => {
  const tree = await parseFixture(INITIAL_SOURCE);
  const main = findNodeByJsxName(tree, 'main');
  const beta = findSectionByLabel(tree, 'Beta');
  const result = await applySourceMoveNodeWriteback({
    contents: INITIAL_SOURCE,
    node: beta,
    sourceFile: SOURCE_FILE,
    targetIndex: 0,
    targetParentNode: main,
  });

  assert.equal(result.ok, true, result.diagnostic);
  assert.equal(result.changed, true);
  const reparsed = await parseFixture(result.nextContents);
  assert.deepEqual(readSectionLabels(reparsed), ['Beta', 'Alpha']);
  assert.ok(result.nextContents.indexOf('aria-label="Beta"') < result.nextContents.indexOf('aria-label="Alpha"'));
});

async function parseFixture(contents: string) {
  return parseEditableSource({
    contents,
    label: 'Structure writeback fixture',
    preferredComponentNames: ['StructureWritebackFixture'],
    sourceFile: SOURCE_FILE,
  });
}

function findSectionByLabel(tree: Awaited<ReturnType<typeof parseFixture>>, label: string) {
  const section = findSectionsByLabel(tree, label)[0];
  assert.ok(section, `${label} section should be present in the parsed editable tree`);
  return section;
}

function findSectionsByLabel(tree: Awaited<ReturnType<typeof parseFixture>>, label: string) {
  return findNodesByJsxName(tree, 'section')
    .filter((node) => node.sourceAttributes?.['aria-label'] === label);
}

function readSectionLabels(tree: Awaited<ReturnType<typeof parseFixture>>): string[] {
  return findNodesByJsxName(tree, 'section')
    .map((node) => node.sourceAttributes?.['aria-label'] ?? '');
}
