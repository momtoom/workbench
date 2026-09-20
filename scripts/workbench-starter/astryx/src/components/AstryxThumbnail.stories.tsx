import { AstryxThumbnail as AstryxThumbnailComponent } from './AstryxThumbnail';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  label: 'attachment.png',
  src: '',
  alt: 'Attachment preview',
  isClickable: false,
  isDisabled: false,
  isLoading: false,
  isRemovable: false,
} as const;

const meta = {
  title: 'Astryx/Thumbnail',
  component: AstryxThumbnailComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    src: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Image source',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    alt: { control: 'text' },
    isClickable: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isRemovable: { control: 'boolean' },
  },
  authoring: {
    group: 'Media',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxThumbnail = {
  name: 'AstryxThumbnail',
  render: (args: Args) => (
    <AstryxThumbnailComponent
      alt={asText(args.alt, DEFAULT_PROPS.alt)}
      isClickable={asBoolean(args.isClickable)}
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      isRemovable={asBoolean(args.isRemovable)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      src={asText(args.src)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
