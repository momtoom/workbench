import { AstryxCard } from './AstryxCard';
import { AstryxGrid as AstryxGridComponent } from './AstryxGrid';
import { AstryxText } from './AstryxText';

type Args = Record<string, number | string>;

const GAPS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;

const DEFAULT_PROPS = {
  align: 'stretch',
  justify: 'stretch',
  gap: 'md',
  width: '100%',
  height: '',
  columnGap: 'inherit',
  columns: 3,
  minChildWidth: 0,
  rowGap: 'inherit',
  rowHeight: 0,
} as const;

const meta = {
  title: 'Astryx/Grid',
  component: AstryxGridComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    justify: { control: 'select', options: ALIGNS },
    gap: { control: 'select', options: GAPS },
    width: { control: 'text' },
    height: { control: 'text' },
    columnGap: { control: 'select', options: GAPS },
    columns: { control: 'number' },
    minChildWidth: { control: 'number' },
    rowGap: { control: 'select', options: GAPS },
    rowHeight: { control: 'number' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxCard'],
        sourceFile: 'src/components/AstryxCard.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxCard padding="sm"><AstryxText as="span" display="block" type="label">Grid item 1</AstryxText></AstryxCard>\n<AstryxCard padding="sm"><AstryxText as="span" display="block" type="label">Grid item 2</AstryxText></AstryxCard>\n<AstryxCard padding="sm"><AstryxText as="span" display="block" type="label">Grid item 3</AstryxText></AstryxCard>',
  },
};
export default meta;

export const AstryxGrid = {
  name: 'AstryxGrid',
  render: (args: Args) => (
    <AstryxGridComponent
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      columnGap={asNumberOption(args.columnGap, GAPS, DEFAULT_PROPS.columnGap)}
      columns={asNumber(args.columns, DEFAULT_PROPS.columns)}
      gap={asNumberOption(args.gap, GAPS, DEFAULT_PROPS.gap)}
      height={asText(args.height)}
      justify={asOption(args.justify, ALIGNS, DEFAULT_PROPS.justify)}
      minChildWidth={asNumber(args.minChildWidth, DEFAULT_PROPS.minChildWidth)}
      rowGap={asNumberOption(args.rowGap, GAPS, DEFAULT_PROPS.rowGap)}
      rowHeight={asNumber(args.rowHeight, DEFAULT_PROPS.rowHeight)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxCard padding="sm">
        <AstryxText as="span" display="block" type="label">
          Grid item 1
        </AstryxText>
      </AstryxCard>
      <AstryxCard padding="sm">
        <AstryxText as="span" display="block" type="label">
          Grid item 2
        </AstryxText>
      </AstryxCard>
      <AstryxCard padding="sm">
        <AstryxText as="span" display="block" type="label">
          Grid item 3
        </AstryxText>
      </AstryxCard>
    </AstryxGridComponent>
  ),
};

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
