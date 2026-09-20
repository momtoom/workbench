import { AstryxButton } from './AstryxButton';
import { AstryxOverlayContent as Component } from './AstryxOverlayContent';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

const meta = {
  title: 'Astryx/OverlayContent',
  component: Component,
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxStack'], sourceFile: 'src/components/AstryxStack.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
    ],
    jsxChildren:
      '<AstryxStack gap="sm">\n  <AstryxText color="inherit">Mountain studio</AstryxText>\n  <AstryxButton label="Quick view" variant="ghost" />\n</AstryxStack>',
  },
};

export default meta;
export const AstryxOverlayContent = {
  name: 'AstryxOverlayContent',
  render: () => (
    <Component>
      <AstryxStack gap="sm">
        <AstryxText color="inherit">Mountain studio</AstryxText>
        <AstryxButton label="Quick view" variant="ghost" />
      </AstryxStack>
    </Component>
  ),
};
