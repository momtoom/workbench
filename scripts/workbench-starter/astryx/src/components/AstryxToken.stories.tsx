import { AstryxToken as AstryxTokenComponent } from './AstryxToken';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const COLORS = ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink', 'gray'] as const;

const DEFAULT_PROPS = {
  label: 'Theme token',
  description: 'Astryx token label',
  href: '',
  icon: 'wrench',
  size: 'md',
  color: 'blue',
  endText: '',
  isClickable: false,
  isDisabled: false,
  isLabelHidden: false,
  isRemovable: false,
} as const;

const meta = {
  title: 'Astryx/Token',
  component: AstryxTokenComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    href: { control: 'text' },
    icon: { control: 'icon' },
    size: { control: 'select', options: SIZES },
    color: { control: 'select', options: COLORS },
    endText: { control: 'text' },
    isClickable: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isRemovable: { control: 'boolean' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxToken = {
  name: 'AstryxToken',
  render: (args: Args) => (
    <AstryxTokenComponent
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      endText={asText(args.endText)}
      href={asText(args.href)}
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      isClickable={asBoolean(args.isClickable)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isRemovable={asBoolean(args.isRemovable)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
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
