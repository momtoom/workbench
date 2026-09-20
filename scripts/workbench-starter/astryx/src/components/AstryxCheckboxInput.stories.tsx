import { AstryxCheckboxInput as AstryxCheckboxInputComponent } from './AstryxCheckboxInput';
import type { AstryxCheckboxInputValue } from './AstryxCheckboxInput';

type Args = Record<string, boolean | string>;

const VALUES = [false, true, 'indeterminate'] as const;
const SIZES = ['sm', 'md'] as const;

const DEFAULT_PROPS = {
  label: 'Keep component editable',
  description: 'The wrapper owns internal checkbox state for preview-safe editing.',
  defaultValue: true,
  size: 'md',
  width: '100%',
  isDisabled: false,
  isLoading: false,
  isOptional: false,
  isReadOnly: false,
  isRequired: false,
} as const;

const meta = {
  title: 'Astryx/CheckboxInput',
  component: AstryxCheckboxInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    defaultValue: { control: 'select', options: VALUES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
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

export const AstryxCheckboxInput = {
  name: 'AstryxCheckboxInput',
  render: (args: Args) => (
    <AstryxCheckboxInputComponent
      defaultValue={asCheckboxValue(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isReadOnly={asBoolean(args.isReadOnly)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asCheckboxValue(value: unknown, fallback: AstryxCheckboxInputValue): AstryxCheckboxInputValue {
  if (typeof value === 'boolean' || value === 'indeterminate') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
