import { AstryxTable } from './AstryxTable';
import { AstryxTableHead as AstryxTableHeadComponent } from './AstryxTableHead';
import { AstryxTableHeader } from './AstryxTableHeader';
import { AstryxTableRow } from './AstryxTableRow';

type Args = Record<string, number | string>;

const ALIGNS = ['start', 'center', 'end'] as const;
const SCOPES = ['col', 'row', 'colgroup', 'rowgroup'] as const;

const DEFAULT_PROPS = {
  align: 'start',
  colSpan: 1,
  rowSpan: 1,
  scope: 'col',
} as const;

const SOURCE_INSERT_PROPS = {
  align: DEFAULT_PROPS.align,
  colSpan: DEFAULT_PROPS.colSpan,
  rowSpan: DEFAULT_PROPS.rowSpan,
  scope: DEFAULT_PROPS.scope,
} as const;

const meta = {
  title: 'Astryx/TableHead',
  component: AstryxTableHeadComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    colSpan: { control: 'number', min: 1, step: 1 },
    rowSpan: { control: 'number', min: 1, step: 1 },
    scope: { control: 'select', options: SCOPES },
  },
  authoring: {
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: SOURCE_INSERT_PROPS,
    jsxChildren: 'Metric',
  },
};
export default meta;

export const AstryxTableHead = {
  name: 'AstryxTableHead',
  render: (args: Args) => (
    <AstryxTable>
      <AstryxTableHeader>
        <AstryxTableRow isHeaderRow>
          <AstryxTableHeadComponent
            align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
            colSpan={asSpan(args.colSpan, DEFAULT_PROPS.colSpan)}
            rowSpan={asSpan(args.rowSpan, DEFAULT_PROPS.rowSpan)}
            scope={asOption(args.scope, SCOPES, DEFAULT_PROPS.scope)}
          >
            Metric
          </AstryxTableHeadComponent>
        </AstryxTableRow>
      </AstryxTableHeader>
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
