import { AstryxBadge } from './AstryxBadge';
import { AstryxTopNavItem as AstryxTopNavItemComponent } from './AstryxTopNavItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', 'component', 'search', 'settings', 'viewColumns'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: 'Components',
  href: '#',
  icon: 'none',
  size: 'md',
  isDisabled: false,
  isIconOnly: false,
  isSelected: true,
} as const;

const meta = {
  title: 'Astryx/TopNavItem',
  component: AstryxTopNavItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    href: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    size: { control: 'select', options: SIZES },
    isDisabled: { control: 'boolean' },
    isIconOnly: { control: 'boolean' },
    isSelected: { control: 'boolean' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxBadge'], sourceFile: 'src/components/AstryxBadge.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '',
  },
};
export default meta;

export const AstryxTopNavItem = {
  name: 'AstryxTopNavItem',
  render: (args: Args) => (
    <AstryxTopNavItemComponent
      href={asText(args.href, DEFAULT_PROPS.href)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      isIconOnly={asBoolean(args.isIconOnly)}
      isSelected={asBoolean(args.isSelected)}
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
