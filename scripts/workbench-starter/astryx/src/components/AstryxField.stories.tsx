import { AstryxField as AstryxFieldComponent } from './AstryxField';
import { AstryxTextInput } from './AstryxTextInput';

type Args = Record<string, boolean | string>;

const STATUS_TYPES = ['none', 'warning', 'error', 'success'] as const;
const STATUS_VARIANTS = ['attached', 'detached'] as const;

const DEFAULT_PROPS = {
  label: 'Project name',
  description: 'A field wrapper keeps label, helper text, input, and status together.',
  width: '100%',
  inputID: 'project-name',
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: true,
  labelTooltip: 'Used for source-backed project metadata.',
  statusMessage: 'Looks ready.',
  statusType: 'success',
  statusVariant: 'attached',
} as const;

const meta = {
  title: 'Astryx/Field',
  component: AstryxFieldComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    inputID: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    statusMessage: { control: 'text' },
    statusType: { control: 'select', options: STATUS_TYPES },
    statusVariant: { control: 'select', options: STATUS_VARIANTS },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxTextInput'], sourceFile: 'src/components/AstryxTextInput.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxTextInput hasClear isLabelHidden label="Project name" defaultValue="Astryx PJ" />',
  },
};
export default meta;

export const AstryxField = {
  name: 'AstryxField',
  render: (args: Args) => (
    <AstryxFieldComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      inputID={asText(args.inputID, DEFAULT_PROPS.inputID)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      statusMessage={asText(args.statusMessage, DEFAULT_PROPS.statusMessage)}
      statusType={asOption(args.statusType, STATUS_TYPES, DEFAULT_PROPS.statusType)}
      statusVariant={asOption(args.statusVariant, STATUS_VARIANTS, DEFAULT_PROPS.statusVariant)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxTextInput hasClear isLabelHidden label="Project name" defaultValue="Astryx PJ" />
    </AstryxFieldComponent>
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
