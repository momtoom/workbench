import { AstryxDropdownMenuItem as AstryxDropdownMenuItemComponent } from './AstryxDropdownMenuItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', 'copy', 'settings', 'viewColumns', 'warning'] as const;

const DEFAULT_PROPS = {
  label: 'Duplicate',
  description: 'Create another copy',
  icon: 'copy',
  endLabel: '⌘D',
  isDisabled: false,
} as const;

const meta = {
  title: 'Astryx/DropdownMenuItem',
  component: AstryxDropdownMenuItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    endLabel: { control: 'text' },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxDropdownMenuItem = {
  name: 'AstryxDropdownMenuItem',
  render: (args: Args) => (
    <AstryxDropdownMenuItemComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      endLabel={asText(args.endLabel, DEFAULT_PROPS.endLabel)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
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
