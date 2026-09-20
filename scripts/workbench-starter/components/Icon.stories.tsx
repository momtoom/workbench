import { Icon as WorkbenchIcon } from './Icon';

type Args = Record<string, boolean | number | string>;
const RENDER_MODES = ['auto', 'mask', 'image'] as const;
const SIZES = ['inherit', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
const DEFAULT_ICON_SOURCE = '/workbench-assets/icons/lucide/sparkles.svg';

const DEFAULT_PROPS = {
  decorative: true,
  label: '',
  renderMode: 'auto',
  size: 'inherit',
  source: DEFAULT_ICON_SOURCE,
} as const;

const INSERT_PROPS = {
  decorative: true,
  source: DEFAULT_ICON_SOURCE,
} as const;

const meta = {
  title: 'Local/Icon',
  component: WorkbenchIcon,
  args: DEFAULT_PROPS,
  argTypes: {
    source: {
      control: 'text',
      label: 'Asset',
      groupId: 'icon',
      groupLabel: 'Icon',
      groupOrder: 10,
      order: 10,
      picker: 'asset',
      assetKinds: ['image', 'icon'],
    },
    size: {
      control: 'select',
      options: SIZES,
      label: 'Size',
      groupId: 'icon',
      groupLabel: 'Icon',
      groupOrder: 10,
      order: 20,
    },
    renderMode: {
      control: 'select',
      options: RENDER_MODES,
      label: 'Render mode',
      groupId: 'icon',
      groupLabel: 'Icon',
      groupOrder: 10,
      order: 30,
    },
    decorative: {
      control: 'boolean',
      label: 'Decorative',
      groupId: 'accessibility',
      groupLabel: 'Accessibility',
      groupOrder: 40,
      order: 10,
    },
    label: {
      control: 'text',
      label: 'Accessible label',
      groupId: 'accessibility',
      groupLabel: 'Accessibility',
      groupOrder: 40,
      order: 20,
      when: { key: 'decorative', value: false },
    },
  },
  sourceInsert: {
    props: INSERT_PROPS,
  },
};
export default meta;

export const Icon = {
  name: 'Icon',
  render: (args: Args) => (
    <WorkbenchIcon
      decorative={asBoolean(args.decorative, true)}
      label={asText(args.label)}
      renderMode={asOption(args.renderMode, RENDER_MODES, 'auto')}
      size={asOption(args.size, SIZES, 'inherit')}
      source={asText(args.source, DEFAULT_ICON_SOURCE)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
