import { AstryxTimestamp as AstryxTimestampComponent } from './AstryxTimestamp';

type Args = Record<string, boolean | number | string>;

const FORMATS = ['relative', 'auto', 'date', 'date_time', 'time', 'system_date', 'system_date_time', 'system_time'] as const;
const TYPES = ['body', 'large', 'label', 'supporting', 'code', 'display-1', 'display-2', 'display-3', 'inherit'] as const;
const SIZES = ['4xs', '3xs', '2xs', 'xsm', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
const COLORS = ['primary', 'secondary', 'disabled', 'placeholder', 'accent', 'inherit', 'inverted', 'static-light', 'static-dark'] as const;
const WEIGHTS = ['normal', 'medium', 'semibold', 'bold'] as const;

const DEFAULT_PROPS = {
  value: '2026-07-04T09:00:00Z',
  type: 'supporting',
  weight: 'normal',
  size: 'sm',
  autoThreshold: 604800,
  color: 'secondary',
  format: 'date_time',
  hasTooltip: true,
  isLive: false,
  isTimezoneShown: false,
} as const;

const meta = {
  title: 'Astryx/Timestamp',
  component: AstryxTimestampComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    value: { control: 'text' },
    type: { control: 'select', options: TYPES },
    weight: { control: 'select', options: WEIGHTS },
    size: { control: 'select', options: SIZES },
    autoThreshold: { control: 'number' },
    color: { control: 'select', options: COLORS },
    format: { control: 'select', options: FORMATS },
    hasTooltip: { control: 'boolean' },
    isLive: { control: 'boolean' },
    isTimezoneShown: { control: 'boolean' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxTimestamp = {
  name: 'AstryxTimestamp',
  render: (args: Args) => (
    <AstryxTimestampComponent
      autoThreshold={asNumber(args.autoThreshold, DEFAULT_PROPS.autoThreshold)}
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      format={asOption(args.format, FORMATS, DEFAULT_PROPS.format)}
      hasTooltip={asBoolean(args.hasTooltip)}
      isLive={asBoolean(args.isLive)}
      isTimezoneShown={asBoolean(args.isTimezoneShown)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
      value={asText(args.value, DEFAULT_PROPS.value)}
      weight={asOption(args.weight, WEIGHTS, DEFAULT_PROPS.weight)}
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
