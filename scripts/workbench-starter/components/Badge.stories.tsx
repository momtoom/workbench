import { Badge as WorkbenchBadge } from './Badge';

type Args = Record<string, string>;

const VARIANTS = ['default', 'secondary', 'outline', 'destructive'] as const;

const DEFAULT_PROPS = {
  children: 'Badge',
  variant: 'default',
} as const;

const meta = {
  title: 'Local/Badge',
  component: WorkbenchBadge,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Badge = {
  name: 'Badge',
  render: (args: Args) => (
    <WorkbenchBadge variant={asOption(args.variant, VARIANTS, 'default')}>
      {asText(args.children, 'Badge')}
    </WorkbenchBadge>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
