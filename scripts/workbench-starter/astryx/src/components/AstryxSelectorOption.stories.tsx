import { AstryxSelectorOption as AstryxSelectorOptionComponent } from './AstryxSelectorOption';

type Args = Record<string, boolean | string>;

const ICONS = ['none', 'info', 'success', 'warning', 'wrench', 'search'] as const;

const DEFAULT_PROPS = {
  label: 'Neutral',
  value: 'neutral',
  description: 'Muted product UI',
  icon: 'info',
  endLabel: 'Default',
  isDisabled: false,
} as const;

const meta = {
  title: 'Astryx/SelectorOption',
  component: AstryxSelectorOptionComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'icon', options: ICONS },
    endLabel: { control: 'text' },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSelectorOption = {
  name: 'AstryxSelectorOption',
  render: (args: Args) => (
    <AstryxSelectorOptionComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      endLabel={asText(args.endLabel, DEFAULT_PROPS.endLabel)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      value={asText(args.value, DEFAULT_PROPS.value)}
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
