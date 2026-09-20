import { AstryxStatusDot as AstryxStatusDotComponent } from './AstryxStatusDot';

type Args = Record<string, boolean | string>;

const VARIANTS = ['success', 'warning', 'error', 'accent', 'neutral'] as const;

const DEFAULT_PROPS = {
  label: 'Online',
  variant: 'success',
  isPulsing: false,
  tooltip: 'Service is online',
  visibleLabel: 'Online',
} as const;

const meta = {
  title: 'Astryx/StatusDot',
  component: AstryxStatusDotComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    isPulsing: { control: 'boolean' },
    tooltip: { control: 'text' },
    visibleLabel: { control: 'text' },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxStatusDot = {
  name: 'AstryxStatusDot',
  render: (args: Args) => (
    <AstryxStatusDotComponent
      isPulsing={asBoolean(args.isPulsing)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      tooltip={asText(args.tooltip, DEFAULT_PROPS.tooltip)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
      visibleLabel={asText(args.visibleLabel, DEFAULT_PROPS.visibleLabel)}
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
