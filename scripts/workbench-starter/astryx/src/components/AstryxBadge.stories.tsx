import { AstryxBadge as AstryxBadgeComponent } from './AstryxBadge';

type Args = Record<string, string>;

const VARIANTS = [
  'neutral',
  'info',
  'success',
  'warning',
  'error',
  'blue',
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;

const DEFAULT_PROPS = {
  label: 'Ready',
  variant: 'success',
} as const;

const meta = {
  title: 'Astryx/Badge',
  component: AstryxBadgeComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
  },
  authoring: {
    group: 'Content',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxBadge = {
  name: 'AstryxBadge',
  render: (args: Args) => (
    <AstryxBadgeComponent
      label={asText(args.label, DEFAULT_PROPS.label)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
