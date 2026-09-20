import { AstryxNumberInput as AstryxNumberInputComponent } from './AstryxNumberInput';

type Args = Record<string, boolean | number | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'warning', 'error', 'success'] as const;

const DEFAULT_PROPS = {
  label: 'Coverage',
  description: 'Numeric input with min, max, step, and units.',
  placeholder: '0',
  defaultValue: 72,
  status: 'none',
  size: 'md',
  width: '100%',
  hasClear: true,
  isDisabled: false,
  isIntegerOnly: true,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
  max: 100,
  min: 0,
  statusMessage: '',
  step: 1,
  units: '%',
} as const;

const meta = {
  title: 'Astryx/NumberInput',
  component: AstryxNumberInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'number' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    hasClear: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isIntegerOnly: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    max: { control: 'number' },
    min: { control: 'number' },
    statusMessage: { control: 'text' },
    step: { control: 'number' },
    units: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxNumberInput = {
  name: 'AstryxNumberInput',
  render: (args: Args) => (
    <AstryxNumberInputComponent
      defaultValue={asNumber(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasClear={asBoolean(args.hasClear)}
      isDisabled={asBoolean(args.isDisabled)}
      isIntegerOnly={asBoolean(args.isIntegerOnly)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      max={asNumber(args.max, DEFAULT_PROPS.max)}
      min={asNumber(args.min, DEFAULT_PROPS.min)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage)}
      step={asNumber(args.step, DEFAULT_PROPS.step)}
      units={asText(args.units, DEFAULT_PROPS.units)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
