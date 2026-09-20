import { ASTRYX_ICON_NAMES } from './AstryxIcon';
import { AstryxRadioList } from './AstryxRadioList';
import { AstryxRadioListItem as AstryxRadioListItemComponent } from './AstryxRadioListItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'Balanced',
  value: 'balanced',
  description: 'Default spacing for mixed content.',
  endText: '',
  isDisabled: false,
  startIcon: 'none',
} as const;

const meta = {
  title: 'Astryx/RadioListItem',
  component: AstryxRadioListItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    endText: { control: 'text' },
    isDisabled: { control: 'boolean' },
    startIcon: { control: 'icon', options: ICONS },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxRadioListItem = {
  name: 'AstryxRadioListItem',
  render: (args: Args) => (
    <AstryxRadioList defaultValue={asText(args.value, DEFAULT_PROPS.value)}>
      <AstryxRadioListItemComponent
        description={asText(args.description, DEFAULT_PROPS.description)}
        endText={asText(args.endText)}
        isDisabled={asBoolean(args.isDisabled)}
        label={asText(args.label, DEFAULT_PROPS.label)}
        startIcon={asOption(args.startIcon, ICONS, DEFAULT_PROPS.startIcon)}
        value={asText(args.value, DEFAULT_PROPS.value)}
      />
    </AstryxRadioList>
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
