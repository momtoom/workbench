import { AstryxSideNavCollapseButton as AstryxSideNavCollapseButtonComponent } from './AstryxSideNavCollapseButton';

type Args = Record<string, boolean | string>;

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: '',
  variant: 'ghost',
  size: 'md',
  collapsedIcon: 'chevronRight',
  expandedIcon: 'chevronLeft',
  isDisabled: false,
  isLoading: false,
  tooltip: '',
} as const;

const meta = {
  title: 'Astryx/SideNavCollapseButton',
  component: AstryxSideNavCollapseButtonComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    collapsedIcon: { control: 'icon' },
    expandedIcon: { control: 'icon' },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    tooltip: { control: 'text' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [],
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSideNavCollapseButton = {
  name: 'AstryxSideNavCollapseButton',
  render: (args: Args) => (
    <AstryxSideNavCollapseButtonComponent
      collapsedIcon={asText(args.collapsedIcon, DEFAULT_PROPS.collapsedIcon)}
      expandedIcon={asText(args.expandedIcon, DEFAULT_PROPS.expandedIcon)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      label={asOptionalText(args.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      tooltip={asOptionalText(args.tooltip)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
