import { AstryxToggleButton as AstryxToggleButtonComponent } from './AstryxToggleButton';
import { ASTRYX_ICON_NAMES } from './AstryxIcon';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'Preview',
  value: 'preview',
  icon: 'eyeSlash',
  size: 'md',
  defaultPressed: true,
  isDisabled: false,
  isIconOnly: false,
  isLoading: false,
  pressedIcon: 'check',
  tooltip: 'Toggle preview',
} as const;

const meta = {
  title: 'Astryx/ToggleButton',
  component: AstryxToggleButtonComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    size: { control: 'select', options: SIZES },
    defaultPressed: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isIconOnly: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    pressedIcon: { control: 'icon', options: ICONS },
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

export const AstryxToggleButton = {
  name: 'AstryxToggleButton',
  render: (args: Args) => (
    <AstryxToggleButtonComponent
      defaultPressed={asBoolean(args.defaultPressed)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      isIconOnly={asBoolean(args.isIconOnly)}
      isLoading={asBoolean(args.isLoading)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      pressedIcon={asOption(args.pressedIcon, ICONS, DEFAULT_PROPS.pressedIcon)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      tooltip={asText(args.tooltip, DEFAULT_PROPS.tooltip)}
      value={asText(args.value, DEFAULT_PROPS.value)}
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
