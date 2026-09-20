import {
  Table as ShadcnTable,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { asNumber, asText } from './story-utils';

type Args = {
  className?: boolean | string;
};

type TableCellArgs = {
  children?: boolean | string;
  className?: boolean | string;
  colSpan?: boolean | number | string;
};

const DEFAULT_PROPS = {
  className: 'w-[min(32rem,100%)] table-auto',
} as const;

const TABLE_CELL_ARG_TYPES = {
  children: { control: 'text', name: 'Text', order: 10 },
  className: { control: 'text', name: 'Width / classes', order: 20 },
  colSpan: { control: { type: 'number', min: 1, max: 12, step: 1 }, name: 'Col span', order: 30 },
} as const;

const meta = {
  title: 'shadcn/Base UI/Table',
  component: ShadcnTable,
  authoring: {
    group: 'Data',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    className: { control: 'text', name: 'Table classes' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['TableCaption', 'TableHeader', 'TableBody', 'TableFooter', 'TableRow', 'TableHead', 'TableCell'],
        sourceFile: 'src/components/ui/table.tsx',
      },
    ],
    jsxChildren:
      '<TableCaption>Table caption</TableCaption><TableHeader><TableRow><TableHead className="w-[180px]">Name</TableHead><TableHead>Status</TableHead><TableHead className="w-24 text-right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="w-[180px]">Item 1</TableCell><TableCell>Ready</TableCell><TableCell className="w-24 text-right">24</TableCell></TableRow><TableRow><TableCell className="w-[180px]">Item 2</TableCell><TableCell>Review</TableCell><TableCell className="w-24 text-right">16</TableCell></TableRow></TableBody><TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">40</TableCell></TableRow></TableFooter>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Table = {
  name: 'Table',
  render: (args: Args) => (
    <ShadcnTable className={asText(args.className, DEFAULT_PROPS.className)}>
      <TableCaption>Table caption</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24 text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="w-[180px]">Item 1</TableCell>
          <TableCell>Ready</TableCell>
          <TableCell className="w-24 text-right">24</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="w-[180px]">Item 2</TableCell>
          <TableCell>Review</TableCell>
          <TableCell className="w-24 text-right">16</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">40</TableCell>
        </TableRow>
      </TableFooter>
    </ShadcnTable>
  ),
};

export const TableHeaderStory = {
  name: 'TableHeader',
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableHead'],
        sourceFile: 'src/components/ui/table.tsx',
      },
    ],
    jsxChildren: '<TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow>',
    props: {
      className: '',
    },
  },
  render: () => <ShadcnTable><TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader></ShadcnTable>,
};

export const TableBodyStory = {
  name: 'TableBody',
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableCell'],
        sourceFile: 'src/components/ui/table.tsx',
      },
    ],
    jsxChildren: '<TableRow><TableCell>Item</TableCell><TableCell>Ready</TableCell></TableRow>',
    props: {
      className: '',
    },
  },
  render: () => <ShadcnTable><TableBody><TableRow><TableCell>Item</TableCell></TableRow></TableBody></ShadcnTable>,
};

export const TableFooterStory = {
  name: 'TableFooter',
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableCell'],
        sourceFile: 'src/components/ui/table.tsx',
      },
    ],
    jsxChildren: '<TableRow><TableCell>Total</TableCell></TableRow>',
    props: {
      className: '',
    },
  },
  render: () => <ShadcnTable><TableFooter><TableRow><TableCell>Total</TableCell></TableRow></TableFooter></ShadcnTable>,
};

export const TableRowStory = {
  name: 'TableRow',
  sourceInsert: {
    imports: [
      {
        names: ['TableCell'],
        sourceFile: 'src/components/ui/table.tsx',
      },
    ],
    jsxChildren: '<TableCell>Item</TableCell><TableCell>Ready</TableCell>',
    props: {
      className: '',
    },
  },
  render: () => <ShadcnTable><TableBody><TableRow><TableCell>Item</TableCell></TableRow></TableBody></ShadcnTable>,
};

export const TableHeadStory = {
  args: {
    children: 'Name',
    className: 'w-[180px]',
    colSpan: 1,
  },
  argTypes: TABLE_CELL_ARG_TYPES,
  name: 'TableHead',
  sourceInsert: {
    props: {
      children: 'Name',
      className: 'w-[180px]',
      colSpan: 1,
    },
  },
  render: (args: TableCellArgs) => (
    <ShadcnTable>
      <TableHeader>
        <TableRow>
          <TableHead
            className={asText(args.className, 'w-[180px]')}
            colSpan={asNumber(args.colSpan, 1, { min: 1, max: 12 })}
          >
            {asText(args.children, 'Name')}
          </TableHead>
        </TableRow>
      </TableHeader>
    </ShadcnTable>
  ),
};

export const TableCellStory = {
  args: {
    children: 'Item',
    className: 'w-[180px]',
    colSpan: 1,
  },
  argTypes: TABLE_CELL_ARG_TYPES,
  name: 'TableCell',
  sourceInsert: {
    props: {
      children: 'Item',
      className: 'w-[180px]',
      colSpan: 1,
    },
  },
  render: (args: TableCellArgs) => (
    <ShadcnTable>
      <TableBody>
        <TableRow>
          <TableCell
            className={asText(args.className, 'w-[180px]')}
            colSpan={asNumber(args.colSpan, 1, { min: 1, max: 12 })}
          >
            {asText(args.children, 'Item')}
          </TableCell>
        </TableRow>
      </TableBody>
    </ShadcnTable>
  ),
};

export const TableCaptionStory = {
  args: {
    children: 'Table caption',
    className: '',
  },
  argTypes: {
    children: { control: 'text', name: 'Text', order: 10 },
    className: { control: 'text', name: 'Classes', order: 20 },
  },
  name: 'TableCaption',
  sourceInsert: {
    props: {
      children: 'Table caption',
      className: '',
    },
  },
  render: (args: TableCellArgs) => (
    <ShadcnTable>
      <TableCaption className={asText(args.className, '')}>
        {asText(args.children, 'Table caption')}
      </TableCaption>
    </ShadcnTable>
  ),
};
