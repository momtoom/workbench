import { AstryxTimeInput as AstryxTimeInputComponent } from './AstryxTimeInput';

type Args = Record<string, boolean | number | string>;

const FORMATS = ['12h', '24h'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'success', 'warning', 'error'] as const;

const DEFAULT_PROPS = {
  label: 'Start time',
  description: 'Choose a schedule start.',
  placeholder: 'Select a time',
  defaultValue: '09:30',
  status: 'none',
  size: 'md',
  width: '240px',
  hasAutoFocus: false,
  hasClear: true,
  hasSeconds: false,
  hourFormat: '12h',
  increment: 15,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  max: '',
  min: '',
  statusMessage: '',
} as const;

const meta = {
  title: 'Astryx/TimeInput',
  component: AstryxTimeInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    hasAutoFocus: { control: 'boolean' },
    hasClear: { control: 'boolean' },
    hasSeconds: { control: 'boolean' },
    hourFormat: { control: 'select', options: FORMATS },
    increment: { control: 'number' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    max: { control: 'text' },
    min: { control: 'text' },
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

export const AstryxTimeInput = {
  name: 'AstryxTimeInput',
  render: (args: Args) => (
    <AstryxTimeInputComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasAutoFocus={asBoolean(args.hasAutoFocus)}
      hasClear={asBoolean(args.hasClear)}
      hasSeconds={asBoolean(args.hasSeconds)}
      hourFormat={asOption(args.hourFormat, FORMATS, DEFAULT_PROPS.hourFormat)}
      increment={asNumber(args.increment, DEFAULT_PROPS.increment)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      max={asText(args.max, DEFAULT_PROPS.max)}
      min={asText(args.min, DEFAULT_PROPS.min)}
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

function asNumber(value: unknown, fallback: number): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
