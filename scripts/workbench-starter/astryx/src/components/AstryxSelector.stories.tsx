import { AstryxSelector as AstryxSelectorComponent } from './AstryxSelector';
import { AstryxSelectorDivider } from './AstryxSelectorDivider';
import { AstryxSelectorOption } from './AstryxSelectorOption';
import { AstryxSelectorSection } from './AstryxSelectorSection';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'warning', 'error', 'success'] as const;
const ICONS = ['none', 'search', 'info', 'success', 'warning', 'wrench'] as const;

const DEFAULT_PROPS = {
  label: 'Role',
  description: 'Choose access for this member.',
  placeholder: 'Choose a role...',
  defaultValue: 'editor',
  size: 'md',
  width: '100%',
  hasClear: true,
  hasSearch: false,
  isDefaultOpen: false,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: 'Selector options are editable children.',
  searchPlaceholder: 'Search roles',
  startIcon: 'none',
  statusMessage: '',
  statusType: 'none',
} as const;

const meta = {
  title: 'Astryx/Selector',
  component: AstryxSelectorComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    size: { control: 'select', options: SIZES },
    width: { control: 'text' },
    hasClear: { control: 'boolean' },
    hasSearch: { control: 'boolean' },
    isDefaultOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    searchPlaceholder: { control: 'text' },
    startIcon: { control: 'icon', options: ICONS },
    statusMessage: { control: 'text' },
    statusType: { control: 'select', options: STATUSES },
  },
  authoring: {
    allowedChildren: ['AstryxSelectorOption', 'AstryxSelectorSection', 'AstryxSelectorDivider'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxSelectorDivider'], sourceFile: 'src/components/AstryxSelectorDivider.tsx' },
      { names: ['AstryxSelectorOption'], sourceFile: 'src/components/AstryxSelectorOption.tsx' },
      { names: ['AstryxSelectorSection'], sourceFile: 'src/components/AstryxSelectorSection.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSelectorSection title="Workspace roles">\n  <AstryxSelectorOption value="admin" label="Admin" description="Full access to all resources" icon="info" />\n  <AstryxSelectorOption value="editor" label="Editor" description="Can edit and publish content" icon="wrench" endLabel="Current" />\n  <AstryxSelectorOption value="viewer" label="Viewer" description="Read-only access" icon="search" />\n</AstryxSelectorSection>\n<AstryxSelectorDivider />\n<AstryxSelectorOption value="billing" label="Billing" description="Manage plans and payments" icon="success" />',
  },
};
export default meta;

export const AstryxSelector = {
  name: 'AstryxSelector',
  render: (args: Args) => (
    <AstryxSelectorComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasClear={asBoolean(args.hasClear)}
      hasSearch={asBoolean(args.hasSearch)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      searchPlaceholder={asText(args.searchPlaceholder, DEFAULT_PROPS.searchPlaceholder)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      startIcon={asOption(args.startIcon, ICONS, DEFAULT_PROPS.startIcon)}
      statusMessage={asText(args.statusMessage)}
      statusType={asOption(args.statusType, STATUSES, DEFAULT_PROPS.statusType)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxSelectorSection title="Workspace roles">
        <AstryxSelectorOption value="admin" label="Admin" description="Full access to all resources" icon="info" />
        <AstryxSelectorOption value="editor" label="Editor" description="Can edit and publish content" icon="wrench" endLabel="Current" />
        <AstryxSelectorOption value="viewer" label="Viewer" description="Read-only access" icon="search" />
      </AstryxSelectorSection>
      <AstryxSelectorDivider />
      <AstryxSelectorOption value="billing" label="Billing" description="Manage plans and payments" icon="success" />
    </AstryxSelectorComponent>
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
