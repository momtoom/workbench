import { AstryxTextArea as AstryxTextAreaComponent } from './AstryxTextArea';

type Args = Record<string, boolean | number | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const STATUSES = ['none', 'warning', 'error', 'success'] as const;

const DEFAULT_PROPS = {
  label: 'Description',
  description: 'Multi-line input with controlled local state.',
  placeholder: 'Write a longer note',
  defaultValue: 'Astryx components stay editable through Workbench wrapper props.',
  status: 'none',
  size: 'md',
  width: '100%',
  rows: 4,
  hasSpellCheck: true,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  maxLength: 180,
  statusMessage: '',
} as const;

const meta = {
  title: 'Astryx/TextArea',
  component: AstryxTextAreaComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    rows: { control: 'number' },
    hasSpellCheck: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    maxLength: { control: 'number' },
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

export const AstryxTextArea = {
  name: 'AstryxTextArea',
  render: (args: Args) => (
    <AstryxTextAreaComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      hasSpellCheck={asBoolean(args.hasSpellCheck)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      maxLength={asNumber(args.maxLength, DEFAULT_PROPS.maxLength)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      rows={asNumber(args.rows, DEFAULT_PROPS.rows)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage)}
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
