import { AstryxSwitch as AstryxSwitchComponent } from './AstryxSwitch';

type Args = Record<string, boolean | string>;

const LABEL_POSITIONS = ['start', 'end'] as const;
const LABEL_SPACING = ['default', 'spread'] as const;

const DEFAULT_PROPS = {
  label: 'Enable theme preview',
  description: 'Switch state is local to the wrapper, while source props stay simple.',
  defaultValue: true,
  labelPosition: 'end',
  width: '100%',
  isDisabled: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelSpacing: 'default',
} as const;

const meta = {
  title: 'Astryx/Switch',
  component: AstryxSwitchComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    defaultValue: { control: 'boolean' },
    labelPosition: { control: 'select', options: LABEL_POSITIONS },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelSpacing: { control: 'select', options: LABEL_SPACING },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSwitch = {
  name: 'AstryxSwitch',
  render: (args: Args) => (
    <AstryxSwitchComponent
      defaultValue={asBoolean(args.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      labelPosition={asOption(args.labelPosition, LABEL_POSITIONS, DEFAULT_PROPS.labelPosition)}
      labelSpacing={asOption(args.labelSpacing, LABEL_SPACING, DEFAULT_PROPS.labelSpacing)}
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
