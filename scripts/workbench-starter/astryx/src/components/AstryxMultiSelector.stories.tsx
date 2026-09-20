import { AstryxMultiSelector as AstryxMultiSelectorComponent } from './AstryxMultiSelector';
import { AstryxSelectorOption } from './AstryxSelectorOption';

type Args = Record<string, boolean | number | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'warning', 'error', 'success'] as const;
const TRIGGER_DISPLAYS = ['count', 'labels', 'badges'] as const;

const DEFAULT_PROPS = {
  label: 'Visible columns',
  description: 'Choose table columns to display.',
  placeholder: 'Select columns',
  size: 'md',
  width: '100%',
  defaultValues: 'name,status',
  hasClear: true,
  hasSearch: true,
  hasSelectAll: true,
  isDefaultOpen: false,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: 'Options are child nodes.',
  maxBadges: 3,
  searchPlaceholder: 'Search columns',
  selectAllLabel: 'Select all columns',
  statusMessage: '',
  statusType: 'none',
  triggerDisplay: 'badges',
} as const;

const meta = {
  title: 'Astryx/MultiSelector',
  component: AstryxMultiSelectorComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'select', options: SIZES },
    width: { control: 'text' },
    defaultValues: { control: 'text' },
    hasClear: { control: 'boolean' },
    hasSearch: { control: 'boolean' },
    hasSelectAll: { control: 'boolean' },
    isDefaultOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    maxBadges: { control: 'number' },
    searchPlaceholder: { control: 'text' },
    selectAllLabel: { control: 'text' },
    statusMessage: { control: 'text' },
    statusType: { control: 'select', options: STATUSES },
    triggerDisplay: { control: 'select', options: TRIGGER_DISPLAYS },
  },
  authoring: {
    allowedChildren: ['AstryxSelectorOption', 'AstryxSelectorSection', 'AstryxSelectorDivider'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxSelectorOption'], sourceFile: 'src/components/AstryxSelectorOption.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSelectorOption value="name" label="Name" description="Primary title column" />\n<AstryxSelectorOption value="status" label="Status" description="Workflow state" />\n<AstryxSelectorOption value="owner" label="Owner" description="Responsible person" />',
  },
};
export default meta;

export const AstryxMultiSelector = {
  name: 'AstryxMultiSelector',
  render: (args: Args) => (
    <AstryxMultiSelectorComponent
      defaultValues={asText(args.defaultValues, DEFAULT_PROPS.defaultValues)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasClear={asBoolean(args.hasClear)}
      hasSearch={asBoolean(args.hasSearch)}
      hasSelectAll={asBoolean(args.hasSelectAll)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      maxBadges={asNumber(args.maxBadges, DEFAULT_PROPS.maxBadges)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      searchPlaceholder={asText(args.searchPlaceholder, DEFAULT_PROPS.searchPlaceholder)}
      selectAllLabel={asText(args.selectAllLabel, DEFAULT_PROPS.selectAllLabel)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      statusMessage={asText(args.statusMessage)}
      statusType={asOption(args.statusType, STATUSES, DEFAULT_PROPS.statusType)}
      triggerDisplay={asOption(args.triggerDisplay, TRIGGER_DISPLAYS, DEFAULT_PROPS.triggerDisplay)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxSelectorOption value="name" label="Name" description="Primary title column" />
      <AstryxSelectorOption value="status" label="Status" description="Workflow state" />
      <AstryxSelectorOption value="owner" label="Owner" description="Responsible person" />
    </AstryxMultiSelectorComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
