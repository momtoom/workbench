import { ASTRYX_ICON_NAMES } from './AstryxIcon';
import { AstryxCheckboxListItem as AstryxCheckboxListItemComponent } from './AstryxCheckboxListItem';

type Args = Record<string, boolean | string>;

const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'Email',
  value: 'email',
  description: 'Digest and transactional updates',
  defaultChecked: true,
  endIcon: 'none',
  endText: '',
  isDisabled: false,
  isLoading: false,
} as const;

const meta = {
  title: 'Astryx/CheckboxListItem',
  component: AstryxCheckboxListItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    endIcon: { control: 'icon', options: ICONS },
    endText: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
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

export const AstryxCheckboxListItem = {
  name: 'AstryxCheckboxListItem',
  render: (args: Args) => (
    <AstryxCheckboxListItemComponent
      defaultChecked={asBoolean(args.defaultChecked)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      endIcon={asOption(args.endIcon, ICONS, DEFAULT_PROPS.endIcon)}
      endText={asText(args.endText, DEFAULT_PROPS.endText)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      label={asText(args.label, DEFAULT_PROPS.label)}
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
