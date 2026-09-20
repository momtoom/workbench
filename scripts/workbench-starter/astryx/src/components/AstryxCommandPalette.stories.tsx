import { AstryxCommandPalette as Component } from './AstryxCommandPalette';
import { AstryxButton } from './AstryxButton';
import { AstryxCommandPaletteFooter } from './AstryxCommandPaletteFooter';
import { AstryxCommandPaletteInput } from './AstryxCommandPaletteInput';
import { AstryxHStack } from './AstryxHStack';
import { AstryxKbd } from './AstryxKbd';
import { AstryxText } from './AstryxText';
const DEFAULT_ITEMS = [
  { id: 'open-project', label: 'Open project', description: '', group: 'Navigation', icon: 'folder-open', endLabel: '', isDefaultSelected: false },
  { id: 'search-components', label: 'Search components', description: '', group: 'Navigation', icon: 'search', endLabel: '', isDefaultSelected: false },
  { id: 'create-page', label: 'Create page', description: '', group: 'Create', icon: 'file-plus', endLabel: '', isDefaultSelected: false },
  { id: 'manage-tokens', label: 'Manage tokens', description: '', group: 'Settings', icon: 'settings', endLabel: '', isDefaultSelected: false },
  { id: 'export-code', label: 'Export code', description: '', group: 'Actions', icon: 'download', endLabel: '', isDefaultSelected: false },
] as const;
const DEFAULT_PROPS = {
  label: 'Command palette',
  width: '640px',
  maxHeight: '480px',
  emptyBootstrapText: 'Type to search commands',
  emptySearchText: 'No commands found',
  isDefaultOpen: true,
  isInline: true,
  items: DEFAULT_ITEMS,
} as const;
type Args = typeof DEFAULT_PROPS;
const meta = {
  title: 'Astryx/CommandPalette', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    width: { control: 'text' },
    maxHeight: { control: 'text' },
    emptyBootstrapText: { control: 'text' },
    emptySearchText: { control: 'text' },
    isDefaultOpen: { control: 'boolean' },
    isInline: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxButton', 'AstryxCommandPaletteInput', 'AstryxCommandPaletteFooter'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxCommandPaletteInput'], sourceFile: 'src/components/AstryxCommandPaletteInput.tsx' },
      { names: ['AstryxCommandPaletteFooter'], sourceFile: 'src/components/AstryxCommandPaletteFooter.tsx' },
      { names: ['AstryxHStack'], sourceFile: 'src/components/AstryxHStack.tsx' },
      { names: ['AstryxKbd'], sourceFile: 'src/components/AstryxKbd.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxButton label="Open command palette" variant="secondary" />\n<AstryxCommandPaletteInput placeholder="Search commands..." />\n<AstryxCommandPaletteFooter>\n  <AstryxHStack align="center" gap={1}>\n    <AstryxKbd keys="up" />\n    <AstryxKbd keys="down" />\n    <AstryxText as="span" color="inherit" type="inherit">Navigate</AstryxText>\n  </AstryxHStack>\n  <AstryxHStack align="center" gap={1}>\n    <AstryxKbd keys="enter" />\n    <AstryxText as="span" color="inherit" type="inherit">Select</AstryxText>\n  </AstryxHStack>\n  <AstryxHStack align="center" gap={1}>\n    <AstryxKbd keys="escape" />\n    <AstryxText as="span" color="inherit" type="inherit">Close</AstryxText>\n  </AstryxHStack>\n</AstryxCommandPaletteFooter>',
  },
};
export default meta;
export const AstryxCommandPalette = {
  name: 'AstryxCommandPalette',
  render: (args: Args) => (
    <Component {...args}>
      <AstryxButton label="Open command palette" variant="secondary" />
      <AstryxCommandPaletteInput placeholder="Search commands..." />
      <AstryxCommandPaletteFooter>
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
      </AstryxCommandPaletteFooter>
    </Component>
  ),
};
