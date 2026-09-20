import { AstryxTextInput as AstryxTextInputComponent } from './AstryxTextInput';

type Args = Record<string, boolean | string>;

const TYPES = ['text', 'password', 'email'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: 'Project name',
  description: 'Controlled internally so page source stays simple.',
  placeholder: 'Name this project',
  defaultValue: 'Astryx PJ',
  type: 'text',
  size: 'md',
  width: '100%',
  hasClear: true,
  isDisabled: false,
  isLabelHidden: false,
  isRequired: false,
} as const;

const meta = {
  title: 'Astryx/TextInput',
  component: AstryxTextInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    type: { control: 'select', options: TYPES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    hasClear: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isRequired: { control: 'boolean' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxTextInput = {
  name: 'AstryxTextInput',
  render: (args: Args) => (
    <AstryxTextInputComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasClear={asBoolean(args.hasClear)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
      width={asText(args.width, DEFAULT_PROPS.width)}
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
