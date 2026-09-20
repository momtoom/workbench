import { AstryxCard } from './AstryxCard';
import { AstryxGrid } from './AstryxGrid';
import { AstryxGridSpan as AstryxGridSpanComponent } from './AstryxGridSpan';
import { AstryxText } from './AstryxText';

type Args = Record<string, number | string>;

const COLUMNS = ['1', '2', '3', '4', 'full'] as const;

const DEFAULT_PROPS = {
  rows: 1,
  columns: 'full',
} as const;

const meta = {
  title: 'Astryx/GridSpan',
  component: AstryxGridSpanComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    rows: { control: 'number' },
    columns: { control: 'select', options: COLUMNS },
  },
  authoring: {
    group: 'Layout',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxCard'], sourceFile: 'src/components/AstryxCard.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxCard padding="sm"><AstryxText as="span" display="block" type="label">Spanning grid item</AstryxText></AstryxCard>',
  },
};
export default meta;

export const AstryxGridSpan = {
  name: 'AstryxGridSpan',
  render: (args: Args) => (
    <AstryxGrid columns={3} gap="sm">
      <AstryxCard padding="sm">
        <AstryxText as="span" display="block" type="label">
          Regular
        </AstryxText>
      </AstryxCard>
      <AstryxGridSpanComponent columns={asOption(args.columns, COLUMNS, DEFAULT_PROPS.columns)} rows={asNumber(args.rows, DEFAULT_PROPS.rows)}>
        <AstryxCard padding="sm">
          <AstryxText as="span" display="block" type="label">
            Spanning grid item
          </AstryxText>
        </AstryxCard>
      </AstryxGridSpanComponent>
      <AstryxCard padding="sm">
        <AstryxText as="span" display="block" type="label">
          Regular
        </AstryxText>
      </AstryxCard>
    </AstryxGrid>
  ),
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
