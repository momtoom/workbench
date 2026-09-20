import { AstryxTreeList as Component } from './AstryxTreeList';
import { AstryxTreeListItem } from './AstryxTreeListItem';
type Args = Record<string, string>;
const DEFAULT_PROPS = {
  density: 'balanced',
  header: 'Project files',
} as const;
const meta = {
  title: 'Astryx/TreeList', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    header: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxTreeListItem'],
    group: 'Data',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxTreeListItem id="workspace" isExpanded label="Workspace">\n  <AstryxTreeListItem id="pages" isExpanded label="Pages">\n    <AstryxTreeListItem id="home" label="Home" />\n    <AstryxTreeListItem id="analytics" label="Analytics" />\n  </AstryxTreeListItem>\n  <AstryxTreeListItem id="components" label="Components" />\n</AstryxTreeListItem>\n<AstryxTreeListItem id="settings" label="Settings" />',
    imports: [{ names: ['AstryxTreeListItem'], sourceFile: 'src/components/AstryxTreeListItem.tsx' }],
  },
};
export default meta;
export const AstryxTreeList = {
  name: 'AstryxTreeList',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxTreeListItem id="workspace" isExpanded label="Workspace">
        <AstryxTreeListItem id="pages" isExpanded label="Pages">
          <AstryxTreeListItem id="home" label="Home" />
          <AstryxTreeListItem id="analytics" label="Analytics" />
        </AstryxTreeListItem>
        <AstryxTreeListItem id="components" label="Components" />
      </AstryxTreeListItem>
      <AstryxTreeListItem id="settings" label="Settings" />
    </Component>
  ),
};
