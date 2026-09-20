import { AstryxAvatar as AstryxAvatarComponent } from './AstryxAvatar';

type Args = Record<string, string>;

const SIZES = ['xsm', 'sm', 'md', 'lg', 'xl'] as const;
const STATUSES = ['none', 'success', 'neutral', 'error'] as const;

const DEFAULT_PROPS = {
  name: 'Ada Lovelace',
  src: '',
  alt: '',
  status: 'success',
  size: 'md',
  fallbackSrc: '',
  statusLabel: 'Online',
} as const;

const meta = {
  title: 'Astryx/Avatar',
  component: AstryxAvatarComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    name: { control: 'text' },
    src: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Avatar image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    alt: { control: 'text' },
    status: { control: 'select', options: STATUSES },
    size: { control: 'select', options: SIZES },
    fallbackSrc: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Fallback image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    statusLabel: { control: 'text' },
  },
  authoring: {
    group: 'Media',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxAvatar = {
  name: 'AstryxAvatar',
  render: (args: Args) => (
    <AstryxAvatarComponent
      alt={asText(args.alt)}
      fallbackSrc={asText(args.fallbackSrc)}
      name={asText(args.name, DEFAULT_PROPS.name)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      src={asText(args.src)}
      status={asOption(args.status, STATUSES, DEFAULT_PROPS.status)}
      statusLabel={asText(args.statusLabel, DEFAULT_PROPS.statusLabel)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
