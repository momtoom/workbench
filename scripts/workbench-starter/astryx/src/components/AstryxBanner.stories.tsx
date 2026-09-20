import { AstryxBanner as AstryxBannerComponent } from './AstryxBanner';

type Args = Record<string, boolean | string>;

const STATUSES = ['info', 'warning', 'error', 'success'] as const;
const CONTAINERS = ['card', 'section'] as const;

const DEFAULT_PROPS = {
  title: 'Source-backed component ready',
  description: 'Astryx is wrapped behind simple Workbench-editable props.',
  actionLabel: 'Review',
  status: 'info',
  container: 'card',
  defaultIsExpanded: true,
  details: 'Use details for short guidance, validation notes, or release context.',
  isDismissable: false,
} as const;

const meta = {
  title: 'Astryx/Banner',
  component: AstryxBannerComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    container: { control: 'select', options: CONTAINERS },
    defaultIsExpanded: { control: 'boolean' },
    details: { control: 'text' },
    isDismissable: { control: 'boolean' },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxBanner = {
  name: 'AstryxBanner',
  render: (args: Args) => (
    <AstryxBannerComponent
      actionLabel={asText(args.actionLabel, DEFAULT_PROPS.actionLabel)}
      container={asOption(args.container, CONTAINERS, DEFAULT_PROPS.container)}
      defaultIsExpanded={asBoolean(args.defaultIsExpanded)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      details={asText(args.details, DEFAULT_PROPS.details)}
      isDismissable={asBoolean(args.isDismissable)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      title={asText(args.title, DEFAULT_PROPS.title)}
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
