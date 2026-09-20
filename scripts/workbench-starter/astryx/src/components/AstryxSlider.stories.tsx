import { AstryxSlider as AstryxSliderComponent } from './AstryxSlider';

type Args = Record<string, boolean | number | string>;

const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const VALUE_DISPLAYS = ['tooltip', 'text', 'none'] as const;
const MARKS = ['none', 'quarters', 'ends'] as const;
const STATUSES = ['none', 'warning', 'error', 'success'] as const;

const DEFAULT_PROPS = {
  label: 'Coverage',
  description: 'Slider state is local while source props stay editable.',
  defaultValue: 48,
  status: 'none',
  orientation: 'horizontal',
  width: '100%',
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
  marks: 'quarters',
  max: 100,
  min: 0,
  statusMessage: '',
  step: 1,
  valueDisplay: 'text',
  valueSuffix: '%',
} as const;

const meta = {
  title: 'Astryx/Slider',
  component: AstryxSliderComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    defaultValue: { control: 'number' },
    status: { control: 'select', options: STATUSES },
    orientation: { control: 'select', options: ORIENTATIONS },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    marks: { control: 'select', options: MARKS },
    max: { control: 'number' },
    min: { control: 'number' },
    statusMessage: { control: 'text' },
    step: { control: 'number' },
    valueDisplay: { control: 'select', options: VALUE_DISPLAYS },
    valueSuffix: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSlider = {
  name: 'AstryxSlider',
  render: (args: Args) => (
    <AstryxSliderComponent
      defaultValue={asNumber(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      marks={asOption(args.marks, MARKS, DEFAULT_PROPS.marks)}
      max={asNumber(args.max, DEFAULT_PROPS.max)}
      min={asNumber(args.min, DEFAULT_PROPS.min)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage)}
      step={asNumber(args.step, DEFAULT_PROPS.step)}
      valueDisplay={asOption(args.valueDisplay, VALUE_DISPLAYS, DEFAULT_PROPS.valueDisplay)}
      valueSuffix={asText(args.valueSuffix, DEFAULT_PROPS.valueSuffix)}
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
