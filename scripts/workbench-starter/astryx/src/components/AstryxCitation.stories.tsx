import { AstryxCitation as AstryxCitationComponent } from './AstryxCitation';

type Args = Record<string, number | string>;

const VARIANTS = ['label', 'number'] as const;

const DEFAULT_PROPS = {
  title: 'Astryx documentation',
  icon: '',
  variant: 'label',
  number: 1,
  url: 'https://astryx.atmeta.com',
} as const;

const meta = {
  title: 'Astryx/Citation',
  component: AstryxCitationComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    icon: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Icon source',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    variant: { control: 'select', options: VARIANTS },
    number: { control: 'number' },
    url: { control: 'text' },
  },
  authoring: {
    group: 'Content',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxCitation = {
  name: 'AstryxCitation',
  render: (args: Args) => (
    <AstryxCitationComponent
      icon={asText(args.icon)}
      number={asNumber(args.number, DEFAULT_PROPS.number)}
      title={asText(args.title, DEFAULT_PROPS.title)}
      url={asText(args.url, DEFAULT_PROPS.url)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};

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
