import assert from 'node:assert/strict';
import test from 'node:test';
import { createEditableDocumentTreeFromTsxSource } from '@domain/document/editableTreeSourceParser';
import { isSourceIntrinsicElementTagName } from '@domain/document/sourceAttributeSafety';
import {
  applySourceAttributeWriteback,
  applySourceComponentPropWriteback,
  applySourceReferencedArrayPropWriteback,
  applySourceStyleDeclarationWriteback,
  applySourceTextContentWriteback,
  applySourceTokenBindingWriteback,
} from '@domain/document/editableTreeSourceWriteback';
import {
  findNodeByJsxName,
  findTextContent,
  parseEditableSource,
  walkEditableTree,
} from './testHelpers';

const SOURCE_FILE = 'src/workbench-pages/ParserWritebackFixture.tsx';
const INITIAL_SOURCE = `import { Button } from '../components/Button'

export default function ParserWritebackFixture() {
  return (
    <main className="page-shell" data-testid="shell">
      <Button variant="outline" className="h-10" aria-label="Save changes">Save</Button>
      <p style={{ color: 'red', marginTop: '4px' }}>Ready</p>
    </main>
  )
}
`;

const ARRAY_SOURCE = `const items = [
  { title: 'First', featured: false },
  { title: 'Second', featured: true },
]

export default function ParserWritebackFixture() {
  return <CardList heading="Queue" items={items} />
}
`;

const INLINE_SVG_SOURCE = `export default function InlineSvgFixture() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="glow" cx="72%" cy="18%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--background)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0" spreadMethod="pad">
          <stop offset="35%" stopColor="currentColor" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="96" height="94" rx="8" ry="6" fill="url(#glow)" />
      <polygon points="0,0 100,0 50,100" fillRule="evenodd" clipRule="evenodd" />
      <path d="M0 50 H100" stroke="url(#fade)" strokeOpacity="0.4" transform="translate(100 0) scale(-1 1)" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">Label</text>
    </svg>
  )
}
`;

const STATE_CONTROLLED_PROP_SOURCE = `import { useState } from 'react'

export default function StateControlledPropFixture() {
  const [themeName, setThemeName] = useState('neutral')
  return <Theme theme={themeName} onThemeChange={setThemeName} />
}
`;

const EXPRESSION_BOUNDARY_SOURCE = `export default function ExpressionBoundaryFixture({ ready }) {
  const records = loadRecords()
  return (
    <main>
      {records.map((record) => renderRecord(record))}
      {ready && <aside>Ready</aside>}
    </main>
  )
}
`;

test('attribute and component prop writeback survive reparsing without changing neighboring source', async () => {
  let contents = INITIAL_SOURCE;
  let tree = await parseFixture(contents);
  let button = findNodeByJsxName(tree, 'Button');

  const classNameWrite = await applySourceAttributeWriteback({
    attributeName: 'className',
    contents,
    node: button,
    sourceFile: SOURCE_FILE,
    value: 'h-12 ring-2',
  });
  assert.equal(classNameWrite.ok, true, classNameWrite.diagnostic);
  assert.equal(classNameWrite.changed, true);
  contents = classNameWrite.nextContents;

  tree = await parseFixture(contents);
  button = findNodeByJsxName(tree, 'Button');
  assert.equal(button.sourceAttributes?.className, 'h-12 ring-2');
  assert.equal(button.sourceProps?.variant, 'outline');

  const variantWrite = await applySourceComponentPropWriteback({
    contents,
    node: button,
    propName: 'variant',
    sourceFile: SOURCE_FILE,
    value: 'secondary',
  });
  assert.equal(variantWrite.ok, true, variantWrite.diagnostic);
  assert.equal(variantWrite.changed, true);
  contents = variantWrite.nextContents;

  tree = await parseFixture(contents);
  button = findNodeByJsxName(tree, 'Button');
  assert.equal(button.sourceAttributes?.className, 'h-12 ring-2');
  assert.equal(button.sourceProps?.variant, 'secondary');
  assert.match(contents, /import \{ Button \} from '\.\.\/components\/Button'/);
  assert.match(contents, /data-testid="shell"/);
  assert.match(contents, /aria-label="Save changes"/);
});

test('state-controlled component props remain expression-backed instead of becoming writable literals', async () => {
  const tree = await parseEditableSource({
    contents: STATE_CONTROLLED_PROP_SOURCE,
    label: 'State controlled prop fixture',
    preferredComponentNames: ['StateControlledPropFixture'],
    sourceFile: SOURCE_FILE,
  });
  const theme = findNodeByJsxName(tree, 'Theme');

  assert.equal(theme.sourceProps?.theme, 'neutral');
  assert.deepEqual(theme.sourceValueMetadata?.props?.theme, {
    code: 'themeName',
    detachableValue: 'neutral',
    kind: 'expression',
    writable: false,
  });
  assert.deepEqual(theme.sourceValueMetadata?.props?.onThemeChange, {
    code: 'setThemeName',
    detachableValue: undefined,
    kind: 'expression',
    writable: false,
  });
});

test('runtime expressions expose concise visual boundary labels without losing exact source', async () => {
  const tree = await parseEditableSource({
    contents: EXPRESSION_BOUNDARY_SOURCE,
    label: 'Expression boundary fixture',
    preferredComponentNames: ['ExpressionBoundaryFixture'],
    sourceFile: SOURCE_FILE,
  });
  const expressions = walkEditableTree(tree.root).filter((node) => node.sourceExpression);
  const map = expressions.find((node) => node.sourceExpression?.kind === 'map');
  const logical = expressions.find((node) => node.sourceExpression?.kind === 'logical');

  assert.ok(map);
  assert.equal(map.label, 'Map · records');
  assert.equal(map.textContent, '{Map · records}');
  assert.equal(map.sourceExpression?.code, 'records.map((record) => renderRecord(record))');
  assert.ok(logical);
  assert.match(logical.label, /^Logic · ready &&/);
  assert.equal(logical.sourceExpression?.code, 'ready && <aside>Ready</aside>');
});

test('inline SVG gradients preserve camelCase intrinsic tags and paint attributes', async () => {
  const sourceFile = 'src/workbench-pages/InlineSvgFixture.tsx';
  const tree = await parseEditableSource({
    contents: INLINE_SVG_SOURCE,
    label: 'Inline SVG fixture',
    preferredComponentNames: ['InlineSvgFixture'],
    sourceFile,
  });
  const svg = findNodeByJsxName(tree, 'svg');
  const radialGradient = findNodeByJsxName(tree, 'radialGradient');
  const linearGradient = findNodeByJsxName(tree, 'linearGradient');
  const stop = findNodeByJsxName(tree, 'stop');
  const rect = findNodeByJsxName(tree, 'rect');
  const polygon = findNodeByJsxName(tree, 'polygon');
  const path = findNodeByJsxName(tree, 'path');
  const text = findNodeByJsxName(tree, 'text');

  assert.equal(isSourceIntrinsicElementTagName('radialGradient'), true);
  assert.equal(svg.sourceAttributes?.preserveAspectRatio, 'xMidYMid slice');
  assert.deepEqual(radialGradient.sourceAttributes, {
    id: 'glow',
    cx: '72%',
    cy: '18%',
    r: '70%',
    gradientUnits: 'objectBoundingBox',
  });
  assert.deepEqual(linearGradient.sourceAttributes, {
    id: 'fade',
    x1: '0',
    y1: '0',
    x2: '1',
    y2: '0',
    spreadMethod: 'pad',
  });
  assert.deepEqual(stop.sourceAttributes, {
    offset: '0%',
    stopColor: 'var(--foreground)',
    stopOpacity: '0.3',
  });
  assert.deepEqual(rect.sourceAttributes, {
    x: '2',
    y: '3',
    width: '96',
    height: '94',
    rx: '8',
    ry: '6',
    fill: 'url(#glow)',
  });
  assert.deepEqual(polygon.sourceAttributes, {
    points: '0,0 100,0 50,100',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
  });
  assert.equal(path.sourceAttributes?.strokeOpacity, '0.4');
  assert.equal(path.sourceAttributes?.transform, 'translate(100 0) scale(-1 1)');
  assert.deepEqual(text.sourceAttributes, {
    x: '50%',
    y: '50%',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
  });

  const stopOpacityWrite = await applySourceAttributeWriteback({
    attributeName: 'stopOpacity',
    contents: INLINE_SVG_SOURCE,
    node: stop,
    sourceFile,
    value: '0.45',
  });
  assert.equal(stopOpacityWrite.ok, true, stopOpacityWrite.diagnostic);
  assert.equal(stopOpacityWrite.changed, true);
  const reparsed = await parseEditableSource({
    contents: stopOpacityWrite.nextContents,
    label: 'Inline SVG fixture',
    preferredComponentNames: ['InlineSvgFixture'],
    sourceFile,
  });
  const reparsedStop = findNodeByJsxName(reparsed, 'stop');
  assert.equal(reparsedStop.sourceAttributes?.stopOpacity, '0.45');
  assert.equal(reparsedStop.sourceAttributes?.stopColor, 'var(--foreground)');
  assert.match(stopOpacityWrite.nextContents, /stopColor="var\(--foreground\)" stopOpacity="0\.45"/);
});

test('style and text writeback preserve unmanaged sibling values after each reparse', async () => {
  let contents = INITIAL_SOURCE;
  let tree = await parseFixture(contents);
  let paragraph = findNodeByJsxName(tree, 'p');

  const styleWrite = await applySourceStyleDeclarationWriteback({
    contents,
    node: paragraph,
    property: 'color',
    sourceFile: SOURCE_FILE,
    value: 'blue',
  });
  assert.equal(styleWrite.ok, true, styleWrite.diagnostic);
  assert.equal(styleWrite.changed, true);
  contents = styleWrite.nextContents;

  tree = await parseFixture(contents);
  paragraph = findNodeByJsxName(tree, 'p');
  assert.equal(paragraph.sourceStyleDeclarations?.color, 'blue');
  assert.equal(paragraph.sourceStyleDeclarations?.['margin-top'], '4px');

  const textWrite = await applySourceTextContentWriteback({
    contents,
    node: paragraph,
    sourceFile: SOURCE_FILE,
    text: 'Published',
  });
  assert.equal(textWrite.ok, true, textWrite.diagnostic);
  assert.equal(textWrite.changed, true);
  contents = textWrite.nextContents;

  tree = await parseFixture(contents);
  paragraph = findNodeByJsxName(tree, 'p');
  assert.equal(findTextContent(paragraph), 'Published');
  assert.equal(paragraph.sourceStyleDeclarations?.color, 'blue');
  assert.equal(paragraph.sourceStyleDeclarations?.['margin-top'], '4px');
  assert.doesNotMatch(contents, />Ready<\/p>/);
});

test('an identical source value is an explicit no-op', async () => {
  const tree = await parseFixture(INITIAL_SOURCE);
  const button = findNodeByJsxName(tree, 'Button');
  const result = await applySourceAttributeWriteback({
    attributeName: 'className',
    contents: INITIAL_SOURCE,
    node: button,
    sourceFile: SOURCE_FILE,
    value: 'h-10',
  });

  assert.equal(result.ok, true, result.diagnostic);
  assert.equal(result.changed, false);
  assert.equal(result.nextContents, INITIAL_SOURCE);
});

test('a fabricated source target is rejected without changing source', async () => {
  const tree = await parseFixture(INITIAL_SOURCE);
  const button = findNodeByJsxName(tree, 'Button');
  const fabricatedNode = {
    ...button,
    id: 'fabricated-node-without-source-path',
    sourceLocation: {
      endColumn: 1,
      endLine: 100,
      startColumn: 0,
      startLine: 100,
    },
  };
  const result = await applySourceAttributeWriteback({
    attributeName: 'className',
    contents: INITIAL_SOURCE,
    node: fabricatedNode,
    sourceFile: SOURCE_FILE,
    value: 'should-not-apply',
  });

  assert.equal(result.ok, false);
  assert.equal(result.nextContents, INITIAL_SOURCE);
  assert.match(result.diagnostic, /could not be matched/);
});

test('token binding writeback preserves collection identity, style, and neighboring attributes', async () => {
  const tree = await parseFixture(INITIAL_SOURCE);
  const main = findNodeByJsxName(tree, 'main');
  const result = await applySourceTokenBindingWriteback({
    contents: INITIAL_SOURCE,
    field: 'background',
    node: main,
    sourceFile: SOURCE_FILE,
    token: {
      collectionId: 'semantic-colors',
      tokenId: 'surface-default',
    },
    tokenStyleValue: 'var(--surface-default)',
  });

  assert.equal(result.ok, true, result.diagnostic);
  assert.equal(result.changed, true);
  const reparsed = await parseFixture(result.nextContents);
  const reparsedMain = findNodeByJsxName(reparsed, 'main');
  assert.deepEqual(reparsedMain.tokenBindingReferences?.background, {
    collectionId: 'semantic-colors',
    tokenId: 'surface-default',
  });
  assert.equal(reparsedMain.sourceStyleDeclarations?.background, 'var(--surface-default)');
  assert.equal(reparsedMain.sourceAttributes?.className, 'page-shell');
  assert.match(result.nextContents, /data-wb-bg-token="surface-default"/);
  assert.match(result.nextContents, /data-wb-bg-token-collection="semantic-colors"/);
});

test('referenced local array writeback survives reparsing without changing other component props', async () => {
  let tree = await parseFixture(ARRAY_SOURCE);
  let cardList = findNodeByJsxName(tree, 'CardList');
  assert.ok(cardList.sourcePropArrayReferences?.items);

  const nextItems = [
    { title: 'Updated', featured: true },
    { title: 'Second', featured: false },
    { title: 'Third', featured: false },
  ];
  const result = await applySourceReferencedArrayPropWriteback({
    contents: ARRAY_SOURCE,
    node: cardList,
    propName: 'items',
    sourceFile: SOURCE_FILE,
    value: nextItems,
  });

  assert.equal(result.ok, true, result.diagnostic);
  assert.equal(result.changed, true);
  tree = await parseFixture(result.nextContents);
  cardList = findNodeByJsxName(tree, 'CardList');
  assert.deepEqual(cardList.sourceProps?.items, nextItems);
  assert.equal(cardList.sourceProps?.heading, 'Queue');
});

test('invalid TSX returns an explicit parse diagnostic without fabricating a tree', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: 'export default function Broken() { return <main>Broken</section> }',
    label: 'Broken fixture',
    preferredComponentNames: ['Broken'],
    sourceFile: SOURCE_FILE,
  });

  assert.equal(result.ok, false);
  assert.equal(result.tree, null);
  assert.match(result.diagnostic, /could not be parsed/);
});

async function parseFixture(contents: string) {
  return parseEditableSource({
    contents,
    label: 'Parser writeback fixture',
    preferredComponentNames: ['ParserWritebackFixture'],
    sourceFile: SOURCE_FILE,
  });
}

const NESTED_SOURCE = `const tree = [
  { id: 'docs', label: 'Documents', children: [{ id: 'report', label: 'Report.pdf' }] },
  { id: 'readme', label: 'README.md' },
]

export default function ParserWritebackFixture() {
  return (
    <TreeList
      items={tree}
      layout={{ columns: { sm: 1, md: 2 } }}
      selected={null}
      expandedIds={['docs']}
      density="balanced"
    />
  )
}
`;

test('keeps nested static props as read-only runtime props beside the expression', async () => {
  const tree = await parseFixture(NESTED_SOURCE);
  const treeList = findNodeByJsxName(tree, 'TreeList');
  // The Inspector projection keeps the flat fields of each item (the array
  // editing contract); the complete value, children included, rides the
  // runtime channel so the canvas renders the whole tree. A plain object and
  // a null literal have no projection at all and take the channel alone.
  assert.deepEqual(treeList.sourceProps, {
    density: 'balanced',
    expandedIds: ['docs'],
    items: [{ id: 'docs', label: 'Documents' }, { id: 'readme', label: 'README.md' }],
  });
  assert.deepEqual(treeList.sourceRuntimeProps, {
    items: [
      { id: 'docs', label: 'Documents', children: [{ id: 'report', label: 'Report.pdf' }] },
      { id: 'readme', label: 'README.md' },
    ],
    layout: { columns: { sm: 1, md: 2 } },
    selected: null,
  });

  const edit = await applySourceComponentPropWriteback({
    contents: NESTED_SOURCE,
    node: treeList,
    propName: 'density',
    sourceFile: SOURCE_FILE,
    value: 'compact',
  });
  assert.equal(edit.ok, true, edit.ok ? '' : edit.diagnostic);
  assert.ok(edit.ok && edit.changed);
  assert.match(edit.nextContents, /items=\{tree\}/);
  assert.match(edit.nextContents, /layout=\{\{ columns: \{ sm: 1, md: 2 \} \}\}/);
  assert.match(edit.nextContents, /selected=\{null\}/);
  assert.match(edit.nextContents, /density="compact"/);
});
