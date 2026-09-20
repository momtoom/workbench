import { AstryxTable } from './AstryxTable';
import { AstryxTableBody } from './AstryxTableBody';
import { AstryxTableCell as AstryxTableCellComponent } from './AstryxTableCell';
import { AstryxTableRow } from './AstryxTableRow';

type Args = Record<string, number | string>;

const ALIGNS = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  align: 'start',
  colSpan: 1,
  rowSpan: 1,
} as const;

const SOURCE_INSERT_PROPS = {
  align: DEFAULT_PROPS.align,
  colSpan: DEFAULT_PROPS.colSpan,
  rowSpan: DEFAULT_PROPS.rowSpan,
} as const;

const meta = {
  title: 'Astryx/TableCell',
  component: AstryxTableCellComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    colSpan: { control: 'number', min: 1, step: 1 },
    rowSpan: { control: 'number', min: 1, step: 1 },
  },
  authoring: {
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: SOURCE_INSERT_PROPS,
    jsxChildren: 'Registered',
  },
};
export default meta;

export const AstryxTableCell = {
  name: 'AstryxTableCell',
  render: (args: Args) => (
    <AstryxTable>
      <AstryxTableBody>
        <AstryxTableRow>
          <AstryxTableCellComponent
            align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
            colSpan={asSpan(args.colSpan, DEFAULT_PROPS.colSpan)}
            rowSpan={asSpan(args.rowSpan, DEFAULT_PROPS.rowSpan)}
          >
            Registered
          </AstryxTableCellComponent>
        </AstryxTableRow>
      </AstryxTableBody>
    </AstryxTable>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asSpan(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : fallback;
}
