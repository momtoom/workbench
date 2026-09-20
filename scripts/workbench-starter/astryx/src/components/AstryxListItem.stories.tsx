import { ASTRYX_ICON_NAMES } from './AstryxIcon';
import { AstryxListItem as AstryxListItemComponent } from './AstryxListItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'List item',
  description: 'Use inside AstryxList for editable collection rows.',
  href: '',
  endText: '',
  isClickable: false,
  isDisabled: false,
  isSelected: false,
  startIcon: 'success',
  target: '_self',
} as const;

const meta = {
  title: 'Astryx/ListItem',
  component: AstryxListItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    href: { control: 'text' },
    endText: { control: 'text' },
    isClickable: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    startIcon: { control: 'icon', options: ICONS },
    target: { control: 'select', options: ['_self', '_blank'] },
  },
  authoring: {
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxListItem = {
  name: 'AstryxListItem',
  render: (args: Args) => (
    <AstryxListItemComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      endText={asText(args.endText)}
      href={asText(args.href)}
      isClickable={asBoolean(args.isClickable)}
      isDisabled={asBoolean(args.isDisabled)}
      isSelected={asBoolean(args.isSelected)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      startIcon={asOption(args.startIcon, ICONS, DEFAULT_PROPS.startIcon)}
      target={asOption(args.target, ['_self', '_blank'] as const, DEFAULT_PROPS.target)}
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
