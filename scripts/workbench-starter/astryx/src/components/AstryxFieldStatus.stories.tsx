import { AstryxFieldStatus as AstryxFieldStatusComponent } from './AstryxFieldStatus';

type Args = Record<string, string>;

const TYPES = ['success', 'warning', 'error'] as const;
const VARIANTS = ['attached', 'detached'] as const;

const DEFAULT_PROPS = {
  message: 'Saved successfully.',
  type: 'success',
  variant: 'detached',
} as const;

const meta = {
  title: 'Astryx/FieldStatus',
  component: AstryxFieldStatusComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    message: { control: 'text' },
    type: { control: 'select', options: TYPES },
    variant: { control: 'select', options: VARIANTS },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxFieldStatus = {
  name: 'AstryxFieldStatus',
  render: (args: Args) => (
    <AstryxFieldStatusComponent
      message={asText(args.message, DEFAULT_PROPS.message)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
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
