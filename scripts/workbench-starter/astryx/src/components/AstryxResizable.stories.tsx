import { AstryxResizable as Component } from './AstryxResizable';
import { AstryxResizableContent } from './AstryxResizableContent';
import { AstryxResizablePanel } from './AstryxResizablePanel';
import { AstryxText } from './AstryxText';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Resize panel',
  direction: 'horizontal',
  minSize: 160,
  collapsedSize: 48,
  defaultSize: 240,
  hasDivider: true,
  hasHandle: true,
  isAlwaysVisible: true,
  isCollapsible: true,
  isDisabled: false,
  isReversed: false,
  maxSize: 480,
  pillPlacement: 'auto',
} as const;
const meta = {
  title: 'Astryx/Resizable', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    direction: { control: 'select', options: ['horizontal', 'vertical'] },
    minSize: { control: 'number' },
    collapsedSize: { control: 'number' },
    defaultSize: { control: 'number' },
    hasDivider: { control: 'boolean' },
    hasHandle: { control: 'boolean' },
    isAlwaysVisible: { control: 'boolean' },
    isCollapsible: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isReversed: { control: 'boolean' },
    maxSize: { control: 'number' },
    pillPlacement: { control: 'select', options: ['auto', 'start', 'end', 'center'] },
  },
  authoring: {
    allowedChildren: ['AstryxResizablePanel', 'AstryxResizableContent'],
    group: 'Layout',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxResizablePanel>\n  <AstryxText>Component panel</AstryxText>\n</AstryxResizablePanel>\n<AstryxResizableContent>\n  <AstryxText>Flexible canvas</AstryxText>\n</AstryxResizableContent>',
    imports: [
      { names: ['AstryxResizableContent'], sourceFile: 'src/components/AstryxResizableContent.tsx' },
      { names: ['AstryxResizablePanel'], sourceFile: 'src/components/AstryxResizablePanel.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
  },
};
export default meta;
export const AstryxResizable = {
  name: 'AstryxResizable',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxResizablePanel>
        <AstryxText>Component panel</AstryxText>
      </AstryxResizablePanel>
      <AstryxResizableContent>
        <AstryxText>Flexible canvas</AstryxText>
      </AstryxResizableContent>
    </Component>
  ),
};
