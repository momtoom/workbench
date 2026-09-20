import type { ReactNode } from 'react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarRadioSection,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubmenu,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  alignOffset?: number | string;
  children?: boolean | string;
  disabled?: boolean | string;
  loopFocus?: boolean | string;
  orientation?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  variant?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const ITEM_VARIANTS = ['default', 'destructive'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  disabled: false,
  orientation: 'horizontal',
  loopFocus: true,
} as const;

function MenubarContentPreview({ children }: { children: ReactNode }) {
  return (
    <Menubar>
      <MenubarMenu defaultOpen>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>{children}</MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const meta = {
  title: 'shadcn/Base UI/Menubar',
  component: Menubar,
  authoring: {
    group: 'Navigation',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ORIENTATIONS },
    loopFocus: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'MenubarCheckboxItem',
          'MenubarContent',
          'MenubarItem',
          'MenubarLabel',
          'MenubarMenu',
          'MenubarRadioItem',
          'MenubarRadioSection',
          'MenubarSeparator',
          'MenubarSub',
          'MenubarSubContent',
          'MenubarSubTrigger',
          'MenubarTrigger',
        ],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren:
      '<MenubarMenu defaultOpen><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarLabel>Options</MenubarLabel><MenubarItem>New</MenubarItem><MenubarSeparator /><MenubarCheckboxItem defaultChecked>Show grid</MenubarCheckboxItem><MenubarSub><MenubarSubTrigger>Export</MenubarSubTrigger><MenubarSubContent><MenubarItem>PNG</MenubarItem></MenubarSubContent></MenubarSub><MenubarRadioSection defaultValue="item-1"><MenubarRadioItem value="item-1">Item 1</MenubarRadioItem><MenubarRadioItem value="item-2">Item 2</MenubarRadioItem></MenubarRadioSection></MenubarContent></MenubarMenu>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const MenubarStory = {
  name: 'Menubar',
  render: (args: Args) => {
    return (
      <Menubar
        disabled={asBoolean(args.disabled, DEFAULT_PROPS.disabled)}
        loopFocus={asBoolean(args.loopFocus, DEFAULT_PROPS.loopFocus)}
        orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      >
        <MenubarMenu defaultOpen>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Options</MenubarLabel>
            <MenubarItem>New</MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem defaultChecked>Show grid</MenubarCheckboxItem>
            <MenubarSub>
              <MenubarSubTrigger>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PNG</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarRadioSection defaultValue="item-1">
              <MenubarRadioItem value="item-1">Item 1</MenubarRadioItem>
              <MenubarRadioItem value="item-2">Item 2</MenubarRadioItem>
            </MenubarRadioSection>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
};

export const MenubarMenuStory = {
  name: 'MenubarMenu',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarContent', 'MenubarItem', 'MenubarTrigger'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New</MenubarItem></MenubarContent>',
    props: {
      defaultOpen: true,
    },
  },
  render: () => (
    <Menubar>
      <MenubarMenu defaultOpen>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent><MenubarItem>New</MenubarItem></MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

export const MenubarTriggerStory = {
  name: 'MenubarTrigger',
  sourceInsert: { props: { children: 'File' } },
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent><MenubarItem>New</MenubarItem></MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

export const MenubarContentStory = {
  name: 'MenubarContent',
  args: {
    align: 'start',
    alignOffset: -4,
    sideOffset: 8,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    alignOffset: { control: { type: 'number', min: -32, max: 32, step: 1 } },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['MenubarItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarItem>New</MenubarItem><MenubarItem>Export</MenubarItem>',
    props: {
      align: 'start',
      alignOffset: -4,
      sideOffset: 8,
    },
  },
  render: (args: Args) => (
    <Menubar>
      <MenubarMenu defaultOpen>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent
          align={asOption(args.align, ALIGNS, 'start')}
          alignOffset={asNumber(args.alignOffset, -4, { min: -32, max: 32 })}
          sideOffset={asNumber(args.sideOffset, 8, { min: 0, max: 32 })}
        >
          <MenubarItem>New</MenubarItem>
          <MenubarItem>Export</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

export const MenubarGroupStory = {
  name: 'MenubarGroup',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarItem>New</MenubarItem>',
  },
  render: () => (
    <MenubarContentPreview>
      <MenubarGroup><MenubarItem>New</MenubarItem></MenubarGroup>
    </MenubarContentPreview>
  ),
};

export const MenubarLabelStory = {
  name: 'MenubarLabel',
  sourceInsert: { props: { children: 'Options' } },
  render: () => (
    <MenubarContentPreview>
      <MenubarLabel>Options</MenubarLabel>
    </MenubarContentPreview>
  ),
};

export const MenubarItemStory = {
  name: 'MenubarItem',
  args: {
    children: 'New',
    variant: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: ITEM_VARIANTS },
  },
  sourceInsert: { props: { children: 'New', variant: 'default' } },
  render: (args: Args) => (
    <MenubarContentPreview>
      <MenubarItem variant={asOption(args.variant, ITEM_VARIANTS, 'default')}>
        {asText(args.children, 'New')}
      </MenubarItem>
    </MenubarContentPreview>
  ),
};

export const MenubarCheckboxItemStory = {
  name: 'MenubarCheckboxItem',
  sourceInsert: { props: { children: 'Show grid', defaultChecked: true } },
  render: () => (
    <MenubarContentPreview>
      <MenubarCheckboxItem defaultChecked>Show grid</MenubarCheckboxItem>
    </MenubarContentPreview>
  ),
};

export const MenubarRadioGroupStory = {
  name: 'MenubarRadioGroup',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarRadioItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarRadioItem value="item-1">Item</MenubarRadioItem>',
    props: { defaultValue: 'item-1' },
  },
  render: () => (
    <MenubarContentPreview>
      <MenubarRadioGroup defaultValue="item-1">
        <MenubarRadioItem value="item-1">Item</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContentPreview>
  ),
};

export const MenubarRadioSectionStory = {
  name: 'MenubarRadioSection',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarRadioItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarRadioItem value="item-1">Item 1</MenubarRadioItem><MenubarRadioItem value="item-2">Item 2</MenubarRadioItem>',
    props: { defaultValue: 'item-1' },
  },
  render: () => (
    <MenubarContentPreview>
      <MenubarRadioSection defaultValue="item-1">
        <MenubarRadioItem value="item-1">Item 1</MenubarRadioItem>
        <MenubarRadioItem value="item-2">Item 2</MenubarRadioItem>
      </MenubarRadioSection>
    </MenubarContentPreview>
  ),
};

export const MenubarRadioItemStory = {
  name: 'MenubarRadioItem',
  sourceInsert: { props: { children: 'Item', value: 'item-1' } },
  render: () => (
    <MenubarContentPreview>
      <MenubarRadioGroup defaultValue="item-1">
        <MenubarRadioItem value="item-1">Item</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContentPreview>
  ),
};

export const MenubarSeparatorStory = {
  name: 'MenubarSeparator',
  sourceInsert: {},
  render: () => (
    <MenubarContentPreview>
      <MenubarSeparator />
    </MenubarContentPreview>
  ),
};

export const MenubarShortcutStory = {
  name: 'MenubarShortcut',
  sourceInsert: { props: { children: '⌘N' } },
  render: () => (
    <MenubarContentPreview>
      <MenubarItem>
        New
        <MenubarShortcut>⌘N</MenubarShortcut>
      </MenubarItem>
    </MenubarContentPreview>
  ),
};

export const MenubarSubStory = {
  name: 'MenubarSub',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarSubTrigger', 'MenubarSubContent', 'MenubarItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarSubTrigger>Export</MenubarSubTrigger><MenubarSubContent><MenubarItem>PNG</MenubarItem></MenubarSubContent>',
  },
  render: () => (
    <MenubarContentPreview>
      <MenubarSub>
        <MenubarSubTrigger>Export</MenubarSubTrigger>
        <MenubarSubContent><MenubarItem>PNG</MenubarItem></MenubarSubContent>
      </MenubarSub>
    </MenubarContentPreview>
  ),
};

export const MenubarSubmenuStory = {
  name: 'MenubarSubmenu',
  sourceInsert: {
    imports: [
      {
        names: ['MenubarItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarItem>PNG</MenubarItem>',
    props: { trigger: 'Export' },
  },
  render: () => (
    <MenubarContentPreview>
      <MenubarSubmenu trigger="Export">
        <MenubarItem>PNG</MenubarItem>
      </MenubarSubmenu>
    </MenubarContentPreview>
  ),
};

export const MenubarSubTriggerStory = {
  name: 'MenubarSubTrigger',
  sourceInsert: { props: { children: 'Export' } },
  render: () => (
    <MenubarContentPreview>
      <MenubarSub>
        <MenubarSubTrigger>Export</MenubarSubTrigger>
        <MenubarSubContent><MenubarItem>PNG</MenubarItem></MenubarSubContent>
      </MenubarSub>
    </MenubarContentPreview>
  ),
};

export const MenubarSubContentStory = {
  name: 'MenubarSubContent',
  args: {
    align: 'start',
    side: 'right',
    sideOffset: 4,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['MenubarItem'],
        sourceFile: 'src/components/ui/menubar.tsx',
      },
    ],
    jsxChildren: '<MenubarItem>PNG</MenubarItem>',
    props: {
      align: 'start',
      side: 'right',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <MenubarContentPreview>
      <MenubarSub>
        <MenubarSubTrigger>Export</MenubarSubTrigger>
        <MenubarSubContent
          align={asOption(args.align, ALIGNS, 'start')}
          side={asOption(args.side, SIDES, 'right')}
          sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
        >
          <MenubarItem>PNG</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
    </MenubarContentPreview>
  ),
};
