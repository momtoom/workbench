import { AstryxFileInput as AstryxFileInputComponent } from './AstryxFileInput';

type Args = Record<string, boolean | number | string | undefined>;

const MODES = ['input', 'dropzone'] as const;
const STATUSES = ['none', 'success', 'warning', 'error'] as const;

const DEFAULT_PROPS = {
  label: 'Project asset',
  description: 'Upload a source image, icon, or document.',
  placeholder: 'Choose file',
  status: 'none',
  width: '360px',
  accept: 'image/*,.pdf',
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isMultiple: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  maxFiles: undefined,
  maxSize: undefined,
  mode: 'input',
  statusMessage: '',
} as const;

const meta = {
  title: 'Astryx/FileInput',
  component: AstryxFileInputComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    accept: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isMultiple: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    maxFiles: { control: 'number' },
    maxSize: { control: 'number' },
    mode: { control: 'select', options: MODES },
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

export const AstryxFileInput = {
  name: 'AstryxFileInput',
  render: (args: Args) => (
    <AstryxFileInputComponent
      accept={asText(args.accept, DEFAULT_PROPS.accept)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isLoading={asBoolean(args.isLoading)}
      isMultiple={asBoolean(args.isMultiple)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelTooltip={asText(args.labelTooltip, DEFAULT_PROPS.labelTooltip)}
      maxFiles={asOptionalNumber(args.maxFiles)}
      maxSize={asOptionalNumber(args.maxSize)}
      mode={asOption(args.mode, MODES, DEFAULT_PROPS.mode)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusMessage={asText(args.statusMessage, DEFAULT_PROPS.statusMessage)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value == null) return undefined;
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
