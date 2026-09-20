import { AstryxFieldLabel as AstryxFieldLabelComponent } from './AstryxFieldLabel';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  label: 'Repository',
  description: 'Standalone label for custom controls.',
  inputID: 'repository',
  isDisabled: false,
  isLabelHidden: false,
  isOptional: true,
  isRequired: false,
  labelTooltip: 'This label can be paired with any editable input.',
} as const;

const meta = {
  title: 'Astryx/FieldLabel',
  component: AstryxFieldLabelComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    inputID: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
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

export const AstryxFieldLabel = {
  name: 'AstryxFieldLabel',
  render: (args: Args) => (
    <AstryxFieldLabelComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      inputID={asText(args.inputID, DEFAULT_PROPS.inputID)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
