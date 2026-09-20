import { AstryxIcon as AstryxIconComponent } from './AstryxIcon';

type Args = Record<string, string>;

const COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'disabled',
  'accent',
  'success',
  'error',
  'warning',
  'inherit',
  'blue',
  'red',
  'green',
  'gray',
  'cyan',
  'teal',
  'yellow',
  'orange',
  'pink',
  'purple',
] as const;
const SIZES = ['xsm', 'sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  icon: 'info',
  size: 'md',
  color: 'primary',
} as const;

const meta = {
  title: 'Astryx/Icon',
  component: AstryxIconComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    icon: { control: 'icon' },
    size: { control: 'select', options: SIZES },
    color: { control: 'select', options: COLORS },
  },
  authoring: {
    group: 'Media',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxIcon = {
  name: 'AstryxIcon',
  render: (args: Args) => (
    <AstryxIconComponent
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}
