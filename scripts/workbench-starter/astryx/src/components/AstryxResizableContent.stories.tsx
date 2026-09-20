import { AstryxText } from './AstryxText';
import { AstryxResizableContent as Component } from './AstryxResizableContent';

const meta = {
  title: 'Astryx/ResizableContent',
  component: Component,
  args: {},
  argTypes: {},
  authoring: {
    group: 'Layout',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' }],
    props: {},
    jsxChildren: '<AstryxText>Flexible content</AstryxText>',
  },
};
export default meta;
export const AstryxResizableContent = {
  name: 'AstryxResizableContent',
  render: () => (
    <Component>
      <AstryxText>Flexible content</AstryxText>
    </Component>
  ),
};
