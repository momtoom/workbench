import { ASTRYX_ICON_NAMES } from './AstryxIcon';
import { AstryxMetadataList } from './AstryxMetadataList';
import { AstryxMetadataListItem as AstryxMetadataListItemComponent } from './AstryxMetadataListItem';

type Args = Record<string, string>;

const ICONS = ['none', ...ASTRYX_ICON_NAMES] as const;

const DEFAULT_PROPS = {
  label: 'Status',
  value: 'Registered',
  icon: 'none',
} as const;

const meta = {
  title: 'Astryx/MetadataListItem',
  component: AstryxMetadataListItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
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

export const AstryxMetadataListItem = {
  name: 'AstryxMetadataListItem',
  render: (args: Args) => (
    <AstryxMetadataList>
      <AstryxMetadataListItemComponent
        icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
        label={asText(args.label, DEFAULT_PROPS.label)}
        value={asText(args.value, DEFAULT_PROPS.value)}
      />
    </AstryxMetadataList>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
