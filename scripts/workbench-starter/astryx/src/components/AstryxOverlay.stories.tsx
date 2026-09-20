import { AstryxButton } from './AstryxButton';
import { AstryxOverlay as Component } from './AstryxOverlay';
import { AstryxOverlayContent } from './AstryxOverlayContent';
import { AstryxOverlayMedia } from './AstryxOverlayMedia';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  position: 'bottom',
  align: 'start',
  scrim: 'dark',
  showOn: 'always',
} as const;

const OVERLAY_CHILDREN = `<AstryxOverlayMedia
  alt="Mountain landscape"
  src="/workbench-assets/images/album-samples/geometric-cube.png"
/>
<AstryxOverlayContent>
  <AstryxStack gap="sm">
    <AstryxText color="inherit">Mountain studio</AstryxText>
    <AstryxButton label="Quick view" variant="ghost" />
  </AstryxStack>
</AstryxOverlayContent>`;

const meta = {
  title: 'Astryx/Overlay',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    position: { control: 'select', options: ['fill', 'bottom', 'top'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    scrim: { control: 'select', options: ['dark', 'light', 'none'] },
    showOn: { control: 'select', options: ['hover', 'always', 'focus', 'hover-or-focus'] },
  },
  authoring: {
    allowedChildren: ['AstryxOverlayMedia', 'AstryxOverlayContent'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxOverlayMedia'], sourceFile: 'src/components/AstryxOverlayMedia.tsx' },
      { names: ['AstryxOverlayContent'], sourceFile: 'src/components/AstryxOverlayContent.tsx' },
      { names: ['AstryxStack'], sourceFile: 'src/components/AstryxStack.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: OVERLAY_CHILDREN,
  },
};

export default meta;
export const AstryxOverlay = {
  name: 'AstryxOverlay',
  render: (args: Args) => (
    <div className="astryx-wb-story-frame astryx-wb-story-frame--overlay">
      <Component {...(args as typeof DEFAULT_PROPS)}>
        <AstryxOverlayMedia
          alt="Mountain landscape"
          src="/workbench-assets/images/album-samples/geometric-cube.png"
        />
        <AstryxOverlayContent>
          <AstryxStack gap="sm">
            <AstryxText color="inherit">Mountain studio</AstryxText>
            <AstryxButton label="Quick view" variant="ghost" />
          </AstryxStack>
        </AstryxOverlayContent>
      </Component>
    </div>
  ),
};
