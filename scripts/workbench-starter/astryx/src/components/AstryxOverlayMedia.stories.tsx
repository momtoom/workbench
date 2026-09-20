import { AstryxOverlayMedia as Component } from './AstryxOverlayMedia';

type Args = Record<string, string>;
const DEFAULT_PROPS = {
  src: '/workbench-assets/images/album-samples/geometric-cube.png',
  alt: 'Mountain landscape',
} as const;

const meta = {
  title: 'Astryx/OverlayMedia',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    src: { assetKinds: ['image'], control: 'text', picker: 'asset-token', tokenTypes: ['string'] },
    alt: { control: 'text' },
  },
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxOverlayMedia = {
  name: 'AstryxOverlayMedia',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
