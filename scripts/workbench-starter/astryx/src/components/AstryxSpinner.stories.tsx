import { AstryxSpinner as AstryxSpinnerComponent } from './AstryxSpinner';

type Args = Record<string, string>;

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;
const SHADES = ['default', 'onMedia', 'subtle', 'inherit'] as const;

const DEFAULT_PROPS = {
  label: 'Loading components',
  ariaLabel: 'Loading components',
  size: 'md',
  shade: 'default',
} as const;

const meta = {
  title: 'Astryx/Spinner',
  component: AstryxSpinnerComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    ariaLabel: { control: 'text' },
    size: { control: 'select', options: SIZES },
    shade: { control: 'select', options: SHADES },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSpinner = {
  name: 'AstryxSpinner',
  render: (args: Args) => (
    <AstryxSpinnerComponent
      ariaLabel={asText(args.ariaLabel, DEFAULT_PROPS.ariaLabel)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      shade={asOption(args.shade, SHADES, DEFAULT_PROPS.shade)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
