import { AstryxMoreMenu as Component } from './AstryxMoreMenu';
import { AstryxDivider } from './AstryxDivider';
import { AstryxDropdownMenuItem } from './AstryxDropdownMenuItem';
type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'More options',
  variant: 'ghost',
  size: 'md',
  isDefaultOpen: false,
  isDisabled: false,
} as const;
const meta = {
  title: 'Astryx/MoreMenu', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    isDefaultOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxDropdownMenuItem', 'AstryxDivider'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxDivider'], sourceFile: 'src/components/AstryxDivider.tsx' },
      { names: ['AstryxDropdownMenuItem'], sourceFile: 'src/components/AstryxDropdownMenuItem.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxDropdownMenuItem label="Edit" />\n<AstryxDropdownMenuItem label="Duplicate" />\n<AstryxDivider />\n<AstryxDropdownMenuItem label="Archive" />\n<AstryxDropdownMenuItem label="Delete" />',
  },
};
export default meta;
export const AstryxMoreMenu = {
  name: 'AstryxMoreMenu',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxDropdownMenuItem label="Edit" />
      <AstryxDropdownMenuItem label="Duplicate" />
      <AstryxDivider />
      <AstryxDropdownMenuItem label="Archive" />
      <AstryxDropdownMenuItem label="Delete" />
    </Component>
  ),
};
