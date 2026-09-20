import { AstryxDateInput as AstryxDateInputComponent } from './AstryxDateInput';

type Args = Record<string, boolean | number | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'success', 'warning', 'error'] as const;
const MONTH_COUNTS = [1, 2] as const;

const DEFAULT_PROPS = {
  label: 'Due date',
  description: 'Pick the milestone date.',
  placeholder: 'Select a date',
  defaultValue: '2026-07-05',
  status: 'none',
  size: 'md',
  width: '320px',
  hasClear: true,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  max: '',
  min: '',
  numberOfMonths: 1,
  statusMessage: '',
} as const;

const meta = {
  title: 'Astryx/DateInput',
  component: AstryxDateInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    hasClear: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    max: { control: 'text' },
    min: { control: 'text' },
    numberOfMonths: { control: 'select', options: MONTH_COUNTS },
    statusMessage: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxDateInput = {
  name: 'AstryxDateInput',
  render: (args: Args) => (
    <AstryxDateInputComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasClear={asBoolean(args.hasClear)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      max={asText(args.max, DEFAULT_PROPS.max)}
      min={asText(args.min, DEFAULT_PROPS.min)}
      numberOfMonths={asNumberOption(args.numberOfMonths, MONTH_COUNTS, DEFAULT_PROPS.numberOfMonths)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage, DEFAULT_PROPS.statusMessage)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number>(value: unknown, options: readonly T[], fallback: T): T {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return options.includes(numericValue as T) ? (numericValue as T) : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
