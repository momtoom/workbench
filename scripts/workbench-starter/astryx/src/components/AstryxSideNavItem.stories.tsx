import { AstryxSideNavItem as AstryxSideNavItemComponent } from './AstryxSideNavItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', 'component', 'settings', 'viewColumns', 'search'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const EMPHASES = ['default', 'button'] as const;

const DEFAULT_PROPS = {
  label: 'Components',
  href: '#',
  icon: 'component',
  size: 'md',
  collapsible: false,
  defaultIsCollapsed: false,
  emphasis: 'default',
  endLabel: 'New',
  isDisabled: false,
  isSelected: true,
} as const;

const meta = {
  title: 'Astryx/SideNavItem',
  component: AstryxSideNavItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    href: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    size: { control: 'select', options: SIZES },
    collapsible: { control: 'boolean' },
    defaultIsCollapsed: { control: 'boolean' },
    emphasis: { control: 'select', options: EMPHASES },
    endLabel: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSideNavItem = {
  name: 'AstryxSideNavItem',
  render: (args: Args) => (
    <AstryxSideNavItemComponent
      collapsible={asBoolean(args.collapsible)}
      defaultIsCollapsed={asBoolean(args.defaultIsCollapsed)}
      emphasis={asOption(args.emphasis, EMPHASES, DEFAULT_PROPS.emphasis)}
      endLabel={asText(args.endLabel, DEFAULT_PROPS.endLabel)}
      href={asText(args.href, DEFAULT_PROPS.href)}
      icon={asIcon(args.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      isSelected={asBoolean(args.isSelected)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asIcon(value: unknown): (typeof ICONS)[number] {
  if (typeof value !== 'string' || !value.trim()) return 'none';
  return asOption(value, ICONS, DEFAULT_PROPS.icon);
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
