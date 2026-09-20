import assert from 'node:assert/strict';
import test from 'node:test';
import type { EditableDocumentTree, EditableTreeNode } from '@domain/document/editableTree';
import { createEditableDocumentTreeFromTsxSource } from '@domain/document/editableTreeSourceParser';
import { walkEditableTree } from './testHelpers';

const SOURCE_FILE = 'src/workbench-pages/DesignStateProjectionFixture.tsx';
const SOURCE = `import { useState } from 'react'

export const workbenchDesignStateGroups = [
  {
    id: 'story',
    label: 'Story preview',
    description: 'Choose the component branch shown in the preview.',
    defaultOpen: true,
    states: [
      {
        name: 'storyComponent',
        label: 'Story component',
        description: 'Select the component example rendered on the canvas.',
      },
    ],
  },
  {
    id: 'runtime',
    label: 'Runtime internals',
    visibility: 'internal',
    states: ['isDragging'],
  },
] as const

export default function DesignStateProjectionFixture() {
  const [storyComponent, setStoryComponent] = useState(0)
  const [isDragging] = useState(false)
  const storyCode = storyComponent === 0
    ? 'count-up-code'
    : storyComponent === 2
      ? 'slider-code'
      : 'other-code'

  return (
    <main>
      <button onClick={() => setStoryComponent(0)}>CountUp</button>
      <button onClick={() => setStoryComponent(1)}>ProgressBar</button>
      <button onClick={() => setStoryComponent(2)}>Slider</button>
      {storyComponent === 0 ? <CountUpControls /> : null}
      {storyComponent === 1 ? <ProgressBarControls /> : null}
      {storyComponent === 2 ? <SliderControls /> : null}
      <code>{storyCode}</code>
    </main>
  )
}
`;

const STATIC_COLLECTION_STATE_SOURCE = `import { useState } from 'react'

export default function StaticCollectionStateFixture() {
  const [activeCase] = useState('grid')
  const [orderByCase] = useState({
    grid: ['A', 'B'],
    table: ['C'],
  })
  const currentOrder = orderByCase[activeCase]

  return (
    <main>
      {currentOrder.map((id) => <Card key={id} label={id} />)}
    </main>
  )
}
`;

const ORDERED_JSX_LOOKUP_SOURCE = `import { useState } from 'react'

function OrderedCard({ order }: { order?: readonly string[] }) {
  const childrenByKey = {
    label: <Text>Label</Text>,
    value: <Heading>42</Heading>,
  }
  return <Card>{(order ?? ['label']).map((key) => childrenByKey[key])}</Card>
}

export default function OrderedJsxLookupFixture() {
  const [orders] = useState({ grid: ['label', 'value'] })
  const activeCase = 'grid'
  const orderFor = () => orders[activeCase]
  return <OrderedCard order={orderFor()} />
}
`;

const LOCAL_PROP_FALLBACK_SOURCE = `import { useState } from 'react'

const items = [
  { id: 'A', label: 'Visible label' },
  { id: 'B', label: 'Second label' },
]

function LocalCard({ id, overrides }: { id: string; overrides: Record<string, string> }) {
  const p = (key: string, fallback: string) => overrides[key] ?? fallback
  const item = items.find((entry) => entry.id === id)
  if (!item) return null
  return <Card><Text>{p('label', item.label)}</Text></Card>
}

export default function LocalPropFallbackFixture() {
  const [allOverrides] = useState<Record<string, string>>({})
  const overridesFor = () => {
    const overrides: Record<string, string> = {}
    for (const [key, value] of Object.entries(allOverrides)) overrides[key] = value
    return overrides
  }
  return <LocalCard id="A" overrides={overridesFor()} />
}
`;

const NULL_RUNTIME_STATE_SOURCE = `import { useState } from 'react'

function MeasureOverlay({ measure }: { measure: { bands: string[] } }) {
  return <aside>{measure.bands.map((band) => <span key={band}>{band}</span>)}</aside>
}

export default function NullRuntimeStateFixture() {
  const [measure] = useState<{ bands: string[] } | null>(null)
  const [ghost] = useState<{ label: string } | null>(null)
  const [selectedId] = useState<string | null>(null)
  return (
    <main>
      <Card>Visible card</Card>
      {measure ? <MeasureOverlay measure={measure} /> : null}
      {ghost && <div>{ghost.label}</div>}
      {['A', 'B'].map((id) => selectedId === id ? <SelectionRing key={id} /> : null)}
    </main>
  )
}
`;

async function parseFixture(storyComponent?: number): Promise<EditableDocumentTree> {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: SOURCE,
    label: 'Design state projection fixture',
    ...(storyComponent === undefined ? {} : { scopedValues: { storyComponent } }),
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);
  return result.tree;
}

function projectedControlNames(tree: EditableDocumentTree): string[] {
  return walkEditableTree(tree.root)
    .map((node: EditableTreeNode) => node.source?.jsxName)
    .filter((name): name is string => Boolean(name?.endsWith('Controls')));
}

test('numeric design state projects only its default strict-equality branch', async () => {
  const tree = await parseFixture();
  assert.deepEqual(projectedControlNames(tree), ['CountUpControls']);
});

test('numeric design state override projects only the selected strict-equality branch', async () => {
  const tree = await parseFixture(2);
  assert.deepEqual(projectedControlNames(tree), ['SliderControls']);
  const code = walkEditableTree(tree.root).find((node) => node.source?.jsxName === 'code');
  assert.ok(code);
  assert.equal(walkEditableTree(code).map((node) => node.textContent ?? '').join(''), 'slider-code');
});

test('numeric comparison values become selectable design-state options', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: SOURCE,
    label: 'Design state projection fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.deepEqual(
    result.designStates?.find((state) => state.name === 'storyComponent')?.options,
    [0, 2, 1],
  );
  assert.deepEqual(
    result.designStates?.find((state) => state.name === 'storyComponent'),
    {
      defaultValue: 0,
      description: 'Select the component example rendered on the canvas.',
      group: {
        defaultOpen: true,
        description: 'Choose the component branch shown in the preview.',
        id: 'story',
        label: 'Story preview',
        order: 0,
        status: 'preview',
        visibility: 'default',
      },
      kind: 'number',
      label: 'Story component',
      name: 'storyComponent',
      options: [0, 2, 1],
      setter: 'setStoryComponent',
    },
  );
  assert.deepEqual(
    result.designStates?.find((state) => state.name === 'isDragging')?.group,
    {
      defaultOpen: false,
      id: 'runtime',
      label: 'Runtime internals',
      order: 1,
      status: 'runtime',
      visibility: 'internal',
    },
  );
});

test('static object and array useState initializers project their first-render collection', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: STATIC_COLLECTION_STATE_SOURCE,
    label: 'Static collection state fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);

  const nodes = walkEditableTree(result.tree.root);
  const map = nodes.find((node) => node.sourceMapBinding?.scope === 'collection');
  assert.ok(map);
  assert.equal(map.sourceMapBinding?.itemCount, 2);
  assert.deepEqual(
    nodes.filter((node) => node.source?.jsxName === 'Card').map((node) => node.sourceProps?.label),
    ['A', 'B'],
  );
  assert.deepEqual(result.designStates?.map((state) => state.name), ['activeCase']);
});

test('ordered JSX lookup maps project their authored visual children', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: ORDERED_JSX_LOOKUP_SOURCE,
    label: 'Ordered JSX lookup fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);

  const nodes = walkEditableTree(result.tree.root);
  assert.deepEqual(
    nodes.filter((node) => node.source?.jsxName === 'Text' || node.source?.jsxName === 'Heading')
      .map((node) => node.source?.jsxName),
    ['Text', 'Heading'],
  );
});

test('local prop reader helpers project their authored fallback text', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: LOCAL_PROP_FALLBACK_SOURCE,
    label: 'Local prop fallback fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);

  const text = walkEditableTree(result.tree.root)
    .map((node) => node.textContent ?? '')
    .filter(Boolean);
  assert.deepEqual(text, ['Visible label']);
});

const MEASURED_WIDTH_BRANCH_SOURCE = `import { useState } from 'react'

export default function MeasuredWidthBranchFixture() {
  const [frameWidth] = useState<number | null>(null)
  const layoutWidth = frameWidth ?? 1160
  const isMobile = layoutWidth < 720
  return (
    <main>
      {isMobile ? <MobileFallback /> : <DesktopDemo />}
      {layoutWidth >= 720 ? <WideBadge /> : null}
    </main>
  )
}
`;

test('null measured width projects the authored fallback width branch', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: MEASURED_WIDTH_BRANCH_SOURCE,
    label: 'Measured width branch fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);

  const nodes = walkEditableTree(result.tree.root);
  assert.equal(nodes.some((node) => node.source?.jsxName === 'DesktopDemo'), true, 'desktop branch');
  assert.equal(nodes.some((node) => node.source?.jsxName === 'MobileFallback'), false, 'mobile fallback');
  assert.equal(nodes.some((node) => node.source?.jsxName === 'WideBadge'), true, 'relational branch');
});

test('null runtime state keeps transient overlay branches out of the first-render projection', async () => {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents: NULL_RUNTIME_STATE_SOURCE,
    label: 'Null runtime state fixture',
    sourceFile: SOURCE_FILE,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);

  const nodes = walkEditableTree(result.tree.root);
  assert.equal(nodes.some((node) => node.source?.jsxName === 'MeasureOverlay'), false, 'measure overlay');
  assert.equal(nodes.some((node) => node.source?.jsxName === 'SelectionRing'), false, 'selection ring');
  assert.deepEqual(
    nodes.map((node) => node.textContent ?? '').filter(Boolean),
    ['Visible card'],
  );
});
