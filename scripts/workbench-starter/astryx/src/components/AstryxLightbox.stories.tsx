import { AstryxLightbox as Component } from './AstryxLightbox';
import { AstryxThumbnail } from './AstryxThumbnail';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Open lightbox',
  defaultIndex: 0,
  hasAutoPlay: false,
  hasZoom: true,
  isDefaultOpen: false,
} as const;
const meta = {
  title: 'Astryx/Lightbox', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    defaultIndex: { control: 'number' },
    hasAutoPlay: { control: 'boolean' },
    hasZoom: { control: 'boolean' },
    isDefaultOpen: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxThumbnail'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxThumbnail'], sourceFile: 'src/components/AstryxThumbnail.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxThumbnail alt="Cylinder grid artwork" label="Cylinder grid" src="/workbench-assets/images/album-samples/cylinder-grid.png" />\n<AstryxThumbnail alt="Geometric cube artwork" label="Geometric cube" src="/workbench-assets/images/album-samples/geometric-cube.png" />',
  },
};
export default meta;
export const AstryxLightbox = {
  name: 'AstryxLightbox',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxThumbnail
        alt="Cylinder grid artwork"
        label="Cylinder grid"
        src="/workbench-assets/images/album-samples/cylinder-grid.png"
      />
      <AstryxThumbnail
        alt="Geometric cube artwork"
        label="Geometric cube"
        src="/workbench-assets/images/album-samples/geometric-cube.png"
      />
    </Component>
  ),
};
