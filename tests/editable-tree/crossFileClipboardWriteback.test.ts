import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySourcePasteNodeWriteback,
  createSourceNodeClipboardPayload,
} from '@domain/document/editableTreeSourceWriteback';
import { findNodeByJsxName, parseEditableSource } from './testHelpers';

const COPY_SOURCE_FILE = 'src/workbench-pages/CrossFileClipboardSource.tsx';
const COPY_SOURCE = `export default function CrossFileClipboardSource() {
  const [mode, setMode] = useState('auto');
  return (
    <main>
      <header aria-label="Gnb">
        <button onClick={() => setMode('auto')}>Auto</button>
        <span>{mode === 'auto' ? 'A' : 'B'}</span>
      </header>
      <section aria-label="Plain"><p>Static content</p></section>
    </main>
  )
}
`;

const PASTE_SOURCE_FILE = 'src/workbench-pages/CrossFileClipboardTarget.tsx';
const PASTE_SOURCE = `export default function CrossFileClipboardTarget() {
  return (
    <main>
      <section aria-label="Target"><p>Landing zone</p></section>
    </main>
  )
}
`;

test('a payload with source-local bindings reports its reasons and still pastes into another file', async () => {
  const copyTree = await parseEditableSource({
    contents: COPY_SOURCE,
    label: 'Copy fixture',
    sourceFile: COPY_SOURCE_FILE,
  });
  const header = findNodeByJsxName(copyTree, 'header');

  const copied = await createSourceNodeClipboardPayload({
    contents: COPY_SOURCE,
    nodes: [header],
    sourceFile: COPY_SOURCE_FILE,
  });
  assert.equal(copied.ok, true, copied.ok ? '' : copied.diagnostic);
  assert.ok(copied.ok);
  assert.equal(copied.payload.requiresSameSourceFile, true);
  assert.ok(
    copied.payload.sameFileRiskReasons.includes('event handler code'),
    `risk reasons should name the handler (got: ${copied.payload.sameFileRiskReasons.join(', ')})`,
  );

  const pasteTree = await parseEditableSource({
    contents: PASTE_SOURCE,
    label: 'Paste fixture',
    sourceFile: PASTE_SOURCE_FILE,
  });
  const target = findNodeByJsxName(pasteTree, 'section');

  const pasted = await applySourcePasteNodeWriteback({
    clipboardSourceFile: copied.payload.sourceFile,
    contents: PASTE_SOURCE,
    imports: copied.payload.imports,
    items: copied.payload.items,
    node: target,
    requiresSameSourceFile: copied.payload.requiresSameSourceFile,
    sourceFile: PASTE_SOURCE_FILE,
  });

  assert.equal(pasted.ok, true, pasted.diagnostic);
  assert.ok(pasted.ok);
  assert.equal(pasted.changed, true);
  assert.ok(
    pasted.nextContents.includes("onClick={() => setMode('auto')}"),
    'the pasted block keeps its bindings verbatim for the user to rewrite',
  );
});

test('a payload without bindings carries no risk reasons', async () => {
  const copyTree = await parseEditableSource({
    contents: COPY_SOURCE,
    label: 'Copy fixture',
    sourceFile: COPY_SOURCE_FILE,
  });
  const plain = findNodeByJsxName(copyTree, 'section');

  const copied = await createSourceNodeClipboardPayload({
    contents: COPY_SOURCE,
    nodes: [plain],
    sourceFile: COPY_SOURCE_FILE,
  });
  assert.equal(copied.ok, true, copied.ok ? '' : copied.diagnostic);
  assert.ok(copied.ok);
  assert.equal(copied.payload.requiresSameSourceFile, false);
  assert.deepEqual(copied.payload.sameFileRiskReasons, []);
});
