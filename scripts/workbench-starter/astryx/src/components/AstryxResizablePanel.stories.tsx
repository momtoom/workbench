import { AstryxText } from './AstryxText';
import { AstryxResizablePanel as Component } from './AstryxResizablePanel';

const meta = {
  title: 'Astryx/ResizablePanel',
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
    jsxChildren: '<AstryxText>Resizable panel</AstryxText>',
  },
};
export default meta;
export const AstryxResizablePanel = {
  name: 'AstryxResizablePanel',
  render: () => (
    <Component>
      <AstryxText>Resizable panel</AstryxText>
    </Component>
  ),
};
