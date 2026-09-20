import { AstryxDropdownMenu as AstryxDropdownMenuComponent } from './AstryxDropdownMenu';
import { AstryxDropdownMenuItem } from './AstryxDropdownMenuItem';
import { ASTRYX_ICON_NAMES } from './AstryxIcon';

type Args = Record<string, boolean | string>;

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const PLACEMENTS = ['above', 'below', 'start', 'end'] as const;
const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'Actions',
  icon: 'none',
  variant: 'secondary',
  placement: 'below',
  size: 'md',
  hasChevron: true,
  isDefaultOpen: false,
  isIconOnly: false,
  menuWidth: '240px',
  tooltip: '',
} as const;

const meta = {
  title: 'Astryx/DropdownMenu',
  component: AstryxDropdownMenuComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    variant: { control: 'select', options: VARIANTS },
    placement: { control: 'select', options: PLACEMENTS },
    size: { control: 'select', options: SIZES },
    hasChevron: { control: 'boolean' },
    isDefaultOpen: { control: 'boolean' },
    isIconOnly: { control: 'boolean' },
    menuWidth: { control: 'text' },
    tooltip: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxDropdownMenuItem', 'AstryxDivider'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxDropdownMenuItem'], sourceFile: 'src/components/AstryxDropdownMenuItem.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxDropdownMenuItem icon="copy" label="Duplicate" />\n<AstryxDropdownMenuItem icon="settings" label="Settings" />\n<AstryxDropdownMenuItem icon="warning" label="Delete" />',
  },
};
export default meta;

export const AstryxDropdownMenu = {
  name: 'AstryxDropdownMenu',
  render: (args: Args) => (
    <AstryxDropdownMenuComponent
      hasChevron={asBoolean(args.hasChevron)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isIconOnly={asBoolean(args.isIconOnly)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      menuWidth={asText(args.menuWidth, DEFAULT_PROPS.menuWidth)}
      placement={asOption(args.placement, PLACEMENTS, DEFAULT_PROPS.placement)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      tooltip={asText(args.tooltip, DEFAULT_PROPS.tooltip)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxDropdownMenuItem icon="copy" label="Duplicate" />
      <AstryxDropdownMenuItem icon="settings" label="Settings" />
      <AstryxDropdownMenuItem icon="warning" label="Delete" />
    </AstryxDropdownMenuComponent>
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
