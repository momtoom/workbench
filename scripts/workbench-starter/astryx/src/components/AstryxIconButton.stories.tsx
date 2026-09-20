import { AstryxIconButton as AstryxIconButtonComponent } from './AstryxIconButton';

type Args = Record<string, boolean | string>;

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: 'Configure component',
  icon: 'wrench',
  variant: 'ghost',
  size: 'md',
  isDisabled: false,
  isLoading: false,
  tooltip: 'Configure component',
} as const;

const meta = {
  title: 'Astryx/IconButton',
  component: AstryxIconButtonComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    tooltip: { control: 'text' },
  },
  authoring: {
    group: 'Actions',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxIconButton = {
  name: 'AstryxIconButton',
  render: (args: Args) => (
    <AstryxIconButtonComponent
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      tooltip={asText(args.tooltip, DEFAULT_PROPS.tooltip)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
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
