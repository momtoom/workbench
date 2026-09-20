import { AstryxEmptyState as AstryxEmptyStateComponent } from './AstryxEmptyState';

type Args = Record<string, boolean | number | string>;

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

const DEFAULT_PROPS = {
  title: 'No components selected',
  description: 'Choose a source-backed Astryx wrapper from the component shelf.',
  icon: 'search',
  headingLevel: 3,
  isCompact: false,
  primaryActionLabel: 'Browse components',
  secondaryActionLabel: 'View docs',
} as const;

const meta = {
  title: 'Astryx/EmptyState',
  component: AstryxEmptyStateComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'icon' },
    headingLevel: { control: 'select', options: HEADING_LEVELS },
    isCompact: { control: 'boolean' },
    primaryActionLabel: { control: 'text' },
    secondaryActionLabel: { control: 'text' },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxEmptyState = {
  name: 'AstryxEmptyState',
  render: (args: Args) => (
    <AstryxEmptyStateComponent
      description={asText(args.description, DEFAULT_PROPS.description)}
      headingLevel={asNumberOption(args.headingLevel, HEADING_LEVELS, DEFAULT_PROPS.headingLevel)}
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      isCompact={asBoolean(args.isCompact)}
      primaryActionLabel={asText(args.primaryActionLabel, DEFAULT_PROPS.primaryActionLabel)}
      secondaryActionLabel={asText(args.secondaryActionLabel, DEFAULT_PROPS.secondaryActionLabel)}
      title={asText(args.title, DEFAULT_PROPS.title)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number>(value: unknown, options: readonly T[], fallback: T): T {
  if (typeof value === 'number' && options.includes(value as T)) return value as T;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (options.includes(parsed as T)) return parsed as T;
  }
  return fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
