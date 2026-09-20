import { AstryxProgressBar as AstryxProgressBarComponent } from './AstryxProgressBar';

type Args = Record<string, boolean | number | string>;

const VARIANTS = ['accent', 'success', 'warning', 'neutral', 'error'] as const;

const DEFAULT_PROPS = {
  label: 'Setup progress',
  value: 64,
  variant: 'accent',
  hasValueLabel: true,
  isDisabled: false,
  isIndeterminate: false,
  isLabelHidden: false,
  max: 100,
} as const;

const meta = {
  title: 'Astryx/ProgressBar',
  component: AstryxProgressBarComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'number' },
    variant: { control: 'select', options: VARIANTS },
    hasValueLabel: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isIndeterminate: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    max: { control: 'number' },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxProgressBar = {
  name: 'AstryxProgressBar',
  render: (args: Args) => (
    <AstryxProgressBarComponent
      hasValueLabel={asBoolean(args.hasValueLabel)}
      isDisabled={asBoolean(args.isDisabled)}
      isIndeterminate={asBoolean(args.isIndeterminate)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      max={asNumber(args.max, DEFAULT_PROPS.max)}
      value={asNumber(args.value, DEFAULT_PROPS.value)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
