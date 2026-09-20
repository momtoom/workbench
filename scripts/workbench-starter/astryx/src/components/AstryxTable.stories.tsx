import { AstryxTable as AstryxTableComponent } from './AstryxTable';
import { AstryxTableBody } from './AstryxTableBody';
import { AstryxTableCell } from './AstryxTableCell';
import { AstryxTableHead } from './AstryxTableHead';
import { AstryxTableHeader } from './AstryxTableHeader';
import { AstryxTableRow } from './AstryxTableRow';

type Args = Record<string, boolean | string>;

const DENSITIES = ['compact', 'balanced', 'spacious'] as const;
const DIVIDERS = ['rows', 'columns', 'grid', 'none'] as const;
const OVERFLOWS = ['wrap', 'truncate'] as const;
const VERTICAL_ALIGNS = ['middle', 'top', 'bottom'] as const;

const DEFAULT_PROPS = {
  density: 'balanced',
  dividers: 'rows',
  hasHover: true,
  isStriped: false,
  textOverflow: 'wrap',
  verticalAlign: 'middle',
} as const;

const DEFAULT_CHILDREN =
  '<AstryxTableHeader>\n' +
  '  <AstryxTableRow isHeaderRow>\n' +
  '    <AstryxTableHead>Metric</AstryxTableHead>\n' +
  '    <AstryxTableHead>Owner</AstryxTableHead>\n' +
  '    <AstryxTableHead>Status</AstryxTableHead>\n' +
  '  </AstryxTableRow>\n' +
  '</AstryxTableHeader>\n' +
  '<AstryxTableBody>\n' +
  '  <AstryxTableRow>\n' +
  '    <AstryxTableCell>Primitive wrappers</AstryxTableCell>\n' +
  '    <AstryxTableCell>Component source</AstryxTableCell>\n' +
  '    <AstryxTableCell>Registered</AstryxTableCell>\n' +
  '  </AstryxTableRow>\n' +
  '  <AstryxTableRow>\n' +
  '    <AstryxTableCell>Theme CSS</AstryxTableCell>\n' +
  '    <AstryxTableCell>Astryx packages</AstryxTableCell>\n' +
  '    <AstryxTableCell>Scoped</AstryxTableCell>\n' +
  '  </AstryxTableRow>\n' +
  '</AstryxTableBody>';

const meta = {
  title: 'Astryx/Table',
  component: AstryxTableComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    density: { control: 'select', options: DENSITIES },
    dividers: { control: 'select', options: DIVIDERS },
    hasHover: { control: 'boolean' },
    isStriped: { control: 'boolean' },
    textOverflow: { control: 'select', options: OVERFLOWS },
    verticalAlign: { control: 'select', options: VERTICAL_ALIGNS },
  },
  authoring: {
    allowedChildren: ['AstryxTableHeader', 'AstryxTableBody', 'AstryxTableFooter'],
    group: 'Data',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxTableBody'],
        sourceFile: 'src/components/AstryxTableBody.tsx',
      },
      {
        names: ['AstryxTableCell'],
        sourceFile: 'src/components/AstryxTableCell.tsx',
      },
      {
        names: ['AstryxTableHead'],
        sourceFile: 'src/components/AstryxTableHead.tsx',
      },
      {
        names: ['AstryxTableHeader'],
        sourceFile: 'src/components/AstryxTableHeader.tsx',
      },
      {
        names: ['AstryxTableRow'],
        sourceFile: 'src/components/AstryxTableRow.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: DEFAULT_CHILDREN,
  },
};
export default meta;

export const AstryxTable = {
  name: 'AstryxTable',
  render: (args: Args) => (
    <AstryxTableComponent
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      dividers={asOption(args.dividers, DIVIDERS, DEFAULT_PROPS.dividers)}
      hasHover={asBoolean(args.hasHover)}
      isStriped={asBoolean(args.isStriped)}
      textOverflow={asOption(args.textOverflow, OVERFLOWS, DEFAULT_PROPS.textOverflow)}
      verticalAlign={asOption(args.verticalAlign, VERTICAL_ALIGNS, DEFAULT_PROPS.verticalAlign)}
    >
      <AstryxTableHeader>
        <AstryxTableRow isHeaderRow>
          <AstryxTableHead>Metric</AstryxTableHead>
          <AstryxTableHead>Owner</AstryxTableHead>
          <AstryxTableHead>Status</AstryxTableHead>
        </AstryxTableRow>
      </AstryxTableHeader>
      <AstryxTableBody>
        <AstryxTableRow>
          <AstryxTableCell>Primitive wrappers</AstryxTableCell>
          <AstryxTableCell>Component source</AstryxTableCell>
          <AstryxTableCell>Registered</AstryxTableCell>
        </AstryxTableRow>
        <AstryxTableRow>
          <AstryxTableCell>Theme CSS</AstryxTableCell>
          <AstryxTableCell>Astryx packages</AstryxTableCell>
          <AstryxTableCell>Scoped</AstryxTableCell>
        </AstryxTableRow>
      </AstryxTableBody>
    </AstryxTableComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
