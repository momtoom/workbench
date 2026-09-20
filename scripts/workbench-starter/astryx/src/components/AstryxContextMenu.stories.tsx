import { AstryxContextMenu as Component } from './AstryxContextMenu';
import { AstryxDivider } from './AstryxDivider';
import { AstryxDropdownMenuItem } from './AstryxDropdownMenuItem';
type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'Card actions',
  size: 'md',
  isDisabled: false,
  menuWidth: '200px',
  triggerLabel: 'Right-click this card',
} as const;
const meta = {
  title: 'Astryx/ContextMenu', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    menuWidth: { control: 'text' },
    triggerLabel: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxDropdownMenuItem', 'AstryxDivider'],
    group: 'Overlays',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxDropdownMenuItem label="Open" />\n<AstryxDropdownMenuItem label="Rename" />\n<AstryxDropdownMenuItem label="Duplicate" />\n<AstryxDivider />\n<AstryxDropdownMenuItem label="Delete" />',
    imports: [
      { names: ['AstryxDivider'], sourceFile: 'src/components/AstryxDivider.tsx' },
      { names: ['AstryxDropdownMenuItem'], sourceFile: 'src/components/AstryxDropdownMenuItem.tsx' },
    ],
  },
};
export default meta;
export const AstryxContextMenu = {
  name: 'AstryxContextMenu',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxDropdownMenuItem label="Open" />
      <AstryxDropdownMenuItem label="Rename" />
      <AstryxDropdownMenuItem label="Duplicate" />
      <AstryxDivider />
      <AstryxDropdownMenuItem label="Delete" />
    </Component>
  ),
};
