import { AstryxTable } from './AstryxTable';
import { AstryxTableBody } from './AstryxTableBody';
import { AstryxTableCell } from './AstryxTableCell';
import { AstryxTableRow as AstryxTableRowComponent } from './AstryxTableRow';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  isHeaderRow: false,
} as const;

const meta = {
  title: 'Astryx/TableRow',
  component: AstryxTableRowComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    isHeaderRow: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxTableHead', 'AstryxTableCell'],
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxTableCell'],
        sourceFile: 'src/components/AstryxTableCell.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxTableCell>Primitive wrappers</AstryxTableCell>\n' +
      '<AstryxTableCell>Registered</AstryxTableCell>',
  },
};
export default meta;

export const AstryxTableRow = {
  name: 'AstryxTableRow',
  render: (args: Args) => (
    <AstryxTable>
      <AstryxTableBody>
        <AstryxTableRowComponent isHeaderRow={asBoolean(args.isHeaderRow)}>
          <AstryxTableCell>Primitive wrappers</AstryxTableCell>
          <AstryxTableCell>Registered</AstryxTableCell>
        </AstryxTableRowComponent>
      </AstryxTableBody>
    </AstryxTable>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}
