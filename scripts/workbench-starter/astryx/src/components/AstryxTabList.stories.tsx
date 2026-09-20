import { AstryxTabList as AstryxTabListComponent } from './AstryxTabList';

type Args = Record<string, boolean | string>;

const VALUES = ['first', 'second', 'third'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const LAYOUTS = ['hug', 'fill'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'first',
  layout: 'hug',
  size: 'md',
  firstLabel: 'Overview',
  hasDivider: true,
  secondLabel: 'Components',
  thirdLabel: 'Tokens',
} as const;

const meta = {
  title: 'Astryx/TabList',
  component: AstryxTabListComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'select', options: VALUES },
    layout: { control: 'select', options: LAYOUTS },
    size: { control: 'select', options: SIZES },
    firstLabel: { control: 'text' },
    hasDivider: { control: 'boolean' },
    secondLabel: { control: 'text' },
    thirdLabel: { control: 'text' },
  },
  authoring: {
    group: 'Navigation',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxTabList = {
  name: 'AstryxTabList',
  render: (args: Args) => (
    <AstryxTabListComponent
      defaultValue={asOption(args.defaultValue, VALUES, DEFAULT_PROPS.defaultValue)}
      firstLabel={asText(args.firstLabel, DEFAULT_PROPS.firstLabel)}
      hasDivider={asBoolean(args.hasDivider)}
      layout={asOption(args.layout, LAYOUTS, DEFAULT_PROPS.layout)}
      secondLabel={asText(args.secondLabel, DEFAULT_PROPS.secondLabel)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      thirdLabel={asText(args.thirdLabel, DEFAULT_PROPS.thirdLabel)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
