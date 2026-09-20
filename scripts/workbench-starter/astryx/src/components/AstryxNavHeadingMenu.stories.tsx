import { AstryxNavHeadingMenu as Component } from './AstryxNavHeadingMenu';
import { AstryxNavHeadingMenuItem } from './AstryxNavHeadingMenuItem';
type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  size: 'md', minWidth: '',
} as const;
const meta = {
  title: 'Astryx/NavHeadingMenu', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    minWidth: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxNavHeadingMenuItem', 'AstryxDivider'],
    group: 'Navigation',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxNavHeadingMenuItem description="Workspace overview" icon="home" label="Dashboard" />\n<AstryxNavHeadingMenuItem description="Reports and metrics" icon="chart" label="Analytics" />\n<AstryxNavHeadingMenuItem description="Preferences and access" icon="settings" label="Settings" />',
    imports: [{ names: ['AstryxNavHeadingMenuItem'], sourceFile: 'src/components/AstryxNavHeadingMenuItem.tsx' }],
  },
};
export default meta;
export const AstryxNavHeadingMenu = {
  name: 'AstryxNavHeadingMenu',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxNavHeadingMenuItem description="Workspace overview" icon="home" label="Dashboard" />
      <AstryxNavHeadingMenuItem description="Reports and metrics" icon="chart" label="Analytics" />
      <AstryxNavHeadingMenuItem description="Preferences and access" icon="settings" label="Settings" />
    </Component>
  ),
};
