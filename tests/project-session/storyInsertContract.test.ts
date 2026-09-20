import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseWorkbenchStoryInsertContracts,
  resolveWorkbenchStoryInsertContract,
} from '@domain/project/workbenchStoryInsertContract';
import {
  canAddSourceChildIntoParent,
  canInsertSourceChildTemplateIntoElement,
  clearRegisteredSourceChildAllowlists,
  clearRegisteredSourceSlotKinds,
  registerSourceChildAllowlist,
  registerSourceSlotKind,
} from '@domain/document/sourceSlotContainers';

const TABLE_STORY = `
import { AstryxTable as AstryxTableComponent } from './AstryxTable';

const meta = {
  title: 'Astryx/Table',
  component: AstryxTableComponent,
  authoring: {
    allowedChildren: ['AstryxTableHeader', 'AstryxTableBody', 'AstryxTableFooter'],
  },
  sourceInsert: { props: {} },
};
export default meta;

export const AstryxTable = { name: 'AstryxTable', render: () => null };
`;

const CELL_STORY = `
const meta = {
  title: 'Astryx/TableCell',
  authoring: {
    hiddenFromInsert: true,
  },
};
export default meta;

export const AstryxTableCell = { name: 'AstryxTableCell', render: () => null };
`;

test('reads allowedChildren and hiddenFromInsert from a story meta block', async () => {
  const tableContracts = await parseWorkbenchStoryInsertContracts(TABLE_STORY);
  assert.deepEqual(resolveWorkbenchStoryInsertContract(tableContracts, 'AstryxTable'), {
    allowedChildren: ['AstryxTableHeader', 'AstryxTableBody', 'AstryxTableFooter'],
    group: null,
    hiddenFromInsert: null,
  });

  const cellContracts = await parseWorkbenchStoryInsertContracts(CELL_STORY);
  assert.deepEqual(resolveWorkbenchStoryInsertContract(cellContracts, 'AstryxTableCell'), {
    allowedChildren: [],
    group: null,
    hiddenFromInsert: true,
  });
});

test('a story export authoring block overrides the module meta block', async () => {
  const contracts = await parseWorkbenchStoryInsertContracts(`
    const meta = { authoring: { allowedChildren: ['FromMeta'] } };
    export default meta;
    export const Thing = { authoring: { allowedChildren: ['FromExport'] } };
    export const Other = { name: 'Other' };
  `);
  assert.deepEqual(resolveWorkbenchStoryInsertContract(contracts, 'Thing')?.allowedChildren, ['FromExport']);
  assert.deepEqual(resolveWorkbenchStoryInsertContract(contracts, 'Other')?.allowedChildren, ['FromMeta']);
});

test('resolves hoisted consts and spreads in allowedChildren', async () => {
  const contracts = await parseWorkbenchStoryInsertContracts(`
    const ROWS = ['AstryxTableRow'];
    const AUTHORING = { allowedChildren: [...ROWS, 'AstryxTableHead'] };
    const meta = { authoring: AUTHORING } as const;
    export default meta;
  `);
  assert.deepEqual(contracts.meta?.allowedChildren, ['AstryxTableRow', 'AstryxTableHead']);
});

test('reads a picker group, including a group-only authoring block', async () => {
  const contracts = await parseWorkbenchStoryInsertContracts(`
    const meta = { title: 'Astryx/Stack', authoring: { group: 'Layout' } };
    export default meta;
  `);
  assert.deepEqual(contracts.meta, { allowedChildren: [], group: 'Layout', hiddenFromInsert: null });
});

test('story files with no authoring block parse to nothing', async () => {
  const contracts = await parseWorkbenchStoryInsertContracts(`
    const meta = { title: 'Astryx/Stack', argTypes: { gap: { control: 'number' } } };
    export default meta;
  `);
  assert.equal(contracts.meta, null);
  assert.equal(contracts.byExportName.size, 0);
});

test('a declared allowlist constrains a parent that source inference calls a block slot', () => {
  clearRegisteredSourceSlotKinds();
  clearRegisteredSourceChildAllowlists();
  try {
    // What project load does for a locally imported design system Workbench
    // has no built-in knowledge of: inference says "renders children", which
    // on its own means "accepts anything".
    registerSourceSlotKind('VendorDataGrid', 'block');
    registerSourceSlotKind('VendorDataGridRow', 'block');
    registerSourceSlotKind('VendorChatComposer', 'block');
    assert.equal(canAddSourceChildIntoParent('VendorDataGrid', 'VendorChatComposer', []), true);

    registerSourceChildAllowlist('VendorDataGrid', ['VendorDataGridHeader', 'VendorDataGridRow']);
    assert.equal(canAddSourceChildIntoParent('VendorDataGrid', 'VendorDataGridRow', []), true);
    assert.equal(canAddSourceChildIntoParent('VendorDataGrid', 'VendorChatComposer', []), false);
    // A strict parent takes component children only, never a raw HTML tag.
    assert.equal(canInsertSourceChildTemplateIntoElement('VendorDataGrid', 'div'), false);

    // Clearing the declaration returns the parent to inference-only behavior.
    clearRegisteredSourceChildAllowlists();
    assert.equal(canAddSourceChildIntoParent('VendorDataGrid', 'VendorChatComposer', []), true);
  } finally {
    clearRegisteredSourceSlotKinds();
    clearRegisteredSourceChildAllowlists();
  }
});

test('a story declaration restores a contract that source inference overrides', () => {
  clearRegisteredSourceSlotKinds();
  clearRegisteredSourceChildAllowlists();
  try {
    // A project-local component deliberately overrides a same-name built-in
    // allowlist, so AstryxTableRow registered from inference accepts anything
    // — that is why the Astryx starter's Add child picker offered the whole
    // registry, and why the fix belongs in the component's own story.
    registerSourceSlotKind('AstryxTableRow', 'block');
    assert.equal(canAddSourceChildIntoParent('AstryxTableRow', 'AstryxChatComposer', []), true);

    registerSourceChildAllowlist('AstryxTableRow', ['AstryxTableHead', 'AstryxTableCell']);
    assert.equal(canAddSourceChildIntoParent('AstryxTableRow', 'AstryxTableCell', []), true);
    assert.equal(canAddSourceChildIntoParent('AstryxTableRow', 'AstryxChatComposer', []), false);
  } finally {
    clearRegisteredSourceSlotKinds();
    clearRegisteredSourceChildAllowlists();
  }
});

test('a bundled parent keeps its built-in contract when inference registers it', () => {
  clearRegisteredSourceSlotKinds();
  clearRegisteredSourceChildAllowlists();
  try {
    registerSourceSlotKind('Select', 'block', { preserveKnownChildContract: true });
    assert.equal(canAddSourceChildIntoParent('Select', 'SelectItem', []), true);
    assert.equal(canAddSourceChildIntoParent('Select', 'Button', []), false);
  } finally {
    clearRegisteredSourceSlotKinds();
    clearRegisteredSourceChildAllowlists();
  }
});
