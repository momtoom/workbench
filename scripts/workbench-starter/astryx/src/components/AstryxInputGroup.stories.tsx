import { AstryxInputGroup as AstryxInputGroupComponent } from './AstryxInputGroup';
import { AstryxInputGroupText } from './AstryxInputGroupText';
import { AstryxTextInput } from './AstryxTextInput';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'error', 'warning', 'success'] as const;

const DEFAULT_PROPS = {
  label: 'Project URL',
  description: 'Prefix and input stay in one editable group.',
  status: 'none',
  size: 'md',
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: 'Use child components to edit prefix, input, or suffix.',
} as const;

const meta = {
  title: 'Astryx/InputGroup',
  component: AstryxInputGroupComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxInputGroupText'], sourceFile: 'src/components/AstryxInputGroupText.tsx' },
      { names: ['AstryxTextInput'], sourceFile: 'src/components/AstryxTextInput.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxInputGroupText>https://</AstryxInputGroupText>\n<AstryxTextInput isLabelHidden label="Project URL" defaultValue="astryx.atmeta.com" />',
  },
};
export default meta;

export const AstryxInputGroup = {
  name: 'AstryxInputGroup',
  render: (args: Args) => (
    <AstryxInputGroupComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
    >
      <AstryxInputGroupText>https://</AstryxInputGroupText>
      <AstryxTextInput isLabelHidden label="Project URL" defaultValue="astryx.atmeta.com" />
    </AstryxInputGroupComponent>
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
