import {
  Table as WorkbenchTable,
  TableBody as WorkbenchTableBody,
  TableCaption as WorkbenchTableCaption,
  TableCell as WorkbenchTableCell,
  TableFooter as WorkbenchTableFooter,
  TableHead as WorkbenchTableHead,
  TableHeader as WorkbenchTableHeader,
  TableRow as WorkbenchTableRow,
} from './Table';
import { Badge } from './Badge';

const meta = {
  title: 'Local/Table',
  component: WorkbenchTable,
  args: {},
  argTypes: {},
  sourceInsert: {
    imports: [
      {
        names: ['TableCaption', 'TableHeader', 'TableRow', 'TableHead', 'TableBody', 'TableCell'],
        sourceFile: 'src/components/Table.tsx',
      },
      {
        names: ['Badge'],
        sourceFile: 'src/components/Badge.tsx',
      },
    ],
    jsxChildren: '<TableCaption>Registered starter components</TableCaption>\n<TableHeader>\n  <TableRow>\n    <TableHead>Component</TableHead>\n    <TableHead>Status</TableHead>\n    <TableHead>Layer</TableHead>\n  </TableRow>\n</TableHeader>\n<TableBody>\n  <TableRow>\n    <TableCell>Button</TableCell>\n    <TableCell><Badge>Ready</Badge></TableCell>\n    <TableCell>Source</TableCell>\n  </TableRow>\n  <TableRow>\n    <TableCell>Tabs</TableCell>\n    <TableCell><Badge variant="secondary">Native</Badge></TableCell>\n    <TableCell>Source</TableCell>\n  </TableRow>\n</TableBody>',
    props: {},
  },
};
export default meta;

export const Table = {
  name: 'Table',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableCaption>Registered starter components</WorkbenchTableCaption>
      <WorkbenchTableHeader>
        <WorkbenchTableRow>
          <WorkbenchTableHead>Component</WorkbenchTableHead>
          <WorkbenchTableHead>Status</WorkbenchTableHead>
          <WorkbenchTableHead>Layer</WorkbenchTableHead>
        </WorkbenchTableRow>
      </WorkbenchTableHeader>
      <WorkbenchTableBody>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Button</WorkbenchTableCell>
          <WorkbenchTableCell><Badge>Ready</Badge></WorkbenchTableCell>
          <WorkbenchTableCell>Source</WorkbenchTableCell>
        </WorkbenchTableRow>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Tabs</WorkbenchTableCell>
          <WorkbenchTableCell><Badge variant="secondary">Native</Badge></WorkbenchTableCell>
          <WorkbenchTableCell>Source</WorkbenchTableCell>
        </WorkbenchTableRow>
      </WorkbenchTableBody>
    </WorkbenchTable>
  ),
};

export const TableCaption = {
  name: 'TableCaption',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableCaption>Registered starter components</WorkbenchTableCaption>
    </WorkbenchTable>
  ),
  sourceInsert: {
    jsxChildren: 'Registered starter components',
  },
};

export const TableHeader = {
  name: 'TableHeader',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableHeader>
        <WorkbenchTableRow>
          <WorkbenchTableHead>Component</WorkbenchTableHead>
          <WorkbenchTableHead>Status</WorkbenchTableHead>
        </WorkbenchTableRow>
      </WorkbenchTableHeader>
    </WorkbenchTable>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableHead'],
        sourceFile: 'src/components/Table.tsx',
      },
    ],
    jsxChildren: '<TableRow>\n  <TableHead>Component</TableHead>\n  <TableHead>Status</TableHead>\n</TableRow>',
  },
};

export const TableBody = {
  name: 'TableBody',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableBody>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Button</WorkbenchTableCell>
          <WorkbenchTableCell>Ready</WorkbenchTableCell>
        </WorkbenchTableRow>
      </WorkbenchTableBody>
    </WorkbenchTable>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableCell'],
        sourceFile: 'src/components/Table.tsx',
      },
    ],
    jsxChildren: '<TableRow>\n  <TableCell>Button</TableCell>\n  <TableCell>Ready</TableCell>\n</TableRow>',
  },
};

export const TableFooter = {
  name: 'TableFooter',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableFooter>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Total</WorkbenchTableCell>
          <WorkbenchTableCell>2 components</WorkbenchTableCell>
        </WorkbenchTableRow>
      </WorkbenchTableFooter>
    </WorkbenchTable>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['TableRow', 'TableCell'],
        sourceFile: 'src/components/Table.tsx',
      },
    ],
    jsxChildren: '<TableRow>\n  <TableCell>Total</TableCell>\n  <TableCell>2 components</TableCell>\n</TableRow>',
  },
};

export const TableRow = {
  name: 'TableRow',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableBody>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Button</WorkbenchTableCell>
          <WorkbenchTableCell>Ready</WorkbenchTableCell>
        </WorkbenchTableRow>
      </WorkbenchTableBody>
    </WorkbenchTable>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['TableCell'],
        sourceFile: 'src/components/Table.tsx',
      },
    ],
    jsxChildren: '<TableCell>Button</TableCell>\n<TableCell>Ready</TableCell>',
  },
};

export const TableHead = {
  name: 'TableHead',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableHeader>
        <WorkbenchTableRow>
          <WorkbenchTableHead>Component</WorkbenchTableHead>
        </WorkbenchTableRow>
      </WorkbenchTableHeader>
    </WorkbenchTable>
  ),
  sourceInsert: {
    jsxChildren: 'Component',
  },
};

export const TableCell = {
  name: 'TableCell',
  render: () => (
    <WorkbenchTable>
      <WorkbenchTableBody>
        <WorkbenchTableRow>
          <WorkbenchTableCell>Button</WorkbenchTableCell>
        </WorkbenchTableRow>
      </WorkbenchTableBody>
    </WorkbenchTable>
  ),
  sourceInsert: {
    jsxChildren: 'Button',
  },
};
