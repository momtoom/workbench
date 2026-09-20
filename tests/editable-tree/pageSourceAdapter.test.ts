import assert from 'node:assert/strict';
import test from 'node:test';
import { createEditableDocumentTreeFromPageSource } from '@domain/document/pageSourceAdapter';

test('page source facade keeps routing .tsx files to the react parser', async () => {
  const result = await createEditableDocumentTreeFromPageSource({
    contents: `export default function Page() {\n  return <main className="shell"><p>Hello</p></main>\n}\n`,
    label: 'React fixture',
    sourceFile: 'src/workbench-pages/ReactFixture.tsx',
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);
  assert.equal(result.tree.root.source?.jsxName, 'main');
});

// The public build registers no Vue adapter but keeps the framework seam,
// so a .vue page reports the missing adapter instead of reaching the React parser.
test('page source facade reports a .vue page as having no registered adapter', async () => {
  const result = await createEditableDocumentTreeFromPageSource({
    contents: '<template>\n  <main class="shell"><p>Hello</p></main>\n</template>\n',
    label: 'Vue fixture',
    sourceFile: 'src/workbench-pages/VueFixture.vue',
  });
  assert.equal(result.ok, false);
  assert.equal(result.tree, null);
  assert.match(result.diagnostic, /no vue source adapter is registered/);
});
