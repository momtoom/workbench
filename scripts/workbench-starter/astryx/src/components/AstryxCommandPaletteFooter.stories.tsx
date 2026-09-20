import { AstryxCommandPaletteFooter as Component } from './AstryxCommandPaletteFooter';
import { AstryxHStack } from './AstryxHStack';
import { AstryxKbd } from './AstryxKbd';
import { AstryxText } from './AstryxText';

const meta = {
  title: 'Astryx/CommandPaletteFooter',
  component: Component,
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxHStack'], sourceFile: 'src/components/AstryxHStack.tsx' },
      { names: ['AstryxKbd'], sourceFile: 'src/components/AstryxKbd.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    jsxChildren:
      '<AstryxHStack align="center" gap={1}>\n  <AstryxKbd keys="up" />\n  <AstryxKbd keys="down" />\n  <AstryxText as="span" color="inherit" type="inherit">Navigate</AstryxText>\n</AstryxHStack>\n<AstryxHStack align="center" gap={1}>\n  <AstryxKbd keys="enter" />\n  <AstryxText as="span" color="inherit" type="inherit">Select</AstryxText>\n</AstryxHStack>\n<AstryxHStack align="center" gap={1}>\n  <AstryxKbd keys="escape" />\n  <AstryxText as="span" color="inherit" type="inherit">Close</AstryxText>\n</AstryxHStack>',
  },
};

export default meta;
export const AstryxCommandPaletteFooter = {
  name: 'AstryxCommandPaletteFooter',
  render: () => (
    <Component>
      <AstryxHStack align="center" gap={1}>
        <AstryxKbd keys="up" />
        <AstryxKbd keys="down" />
        <AstryxText as="span" color="inherit" type="inherit">Navigate</AstryxText>
      </AstryxHStack>
      <AstryxHStack align="center" gap={1}>
        <AstryxKbd keys="enter" />
        <AstryxText as="span" color="inherit" type="inherit">Select</AstryxText>
      </AstryxHStack>
      <AstryxHStack align="center" gap={1}>
        <AstryxKbd keys="escape" />
        <AstryxText as="span" color="inherit" type="inherit">Close</AstryxText>
      </AstryxHStack>
    </Component>
  ),
};
