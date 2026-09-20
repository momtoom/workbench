import type { ReactNode } from 'react';
import {
  ContextMenu as ShadcnContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRadioSection,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubmenu,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  children?: boolean | string;
  defaultOpen?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  target?: boolean | string;
  variant?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const ITEM_VARIANTS = ['default', 'destructive'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  defaultOpen: true,
  target: 'Right click target',
} as const;

function ContextMenuContentPreview({ children }: { children: ReactNode }) {
  return (
    <ShadcnContextMenu defaultOpen>
      <ContextMenuTrigger className="flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm">
        Right click target
      </ContextMenuTrigger>
      <ContextMenuContent>{children}</ContextMenuContent>
    </ShadcnContextMenu>
  );
}

const meta = {
  title: 'shadcn/Base UI/Context Menu',
  component: ShadcnContextMenu,
  authoring: {
    group: 'Overlays',
  },
  args: {
    defaultOpen: DEFAULT_PROPS.defaultOpen,
  },
  argTypes: {
    defaultOpen: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'ContextMenuCheckboxItem',
          'ContextMenuContent',
          'ContextMenuItem',
          'ContextMenuLabel',
          'ContextMenuRadioItem',
          'ContextMenuRadioSection',
          'ContextMenuSeparator',
          'ContextMenuSub',
          'ContextMenuSubContent',
          'ContextMenuSubTrigger',
          'ContextMenuTrigger',
        ],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren:
      '<ContextMenuTrigger className="flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm">Right click target</ContextMenuTrigger><ContextMenuContent><ContextMenuLabel>Actions</ContextMenuLabel><ContextMenuItem>Duplicate</ContextMenuItem><ContextMenuItem>Rename</ContextMenuItem><ContextMenuSeparator /><ContextMenuCheckboxItem defaultChecked>Show option</ContextMenuCheckboxItem><ContextMenuSub><ContextMenuSubTrigger>Export</ContextMenuSubTrigger><ContextMenuSubContent><ContextMenuItem>PNG</ContextMenuItem></ContextMenuSubContent></ContextMenuSub><ContextMenuRadioSection defaultValue="item-1"><ContextMenuRadioItem value="item-1">Item 1</ContextMenuRadioItem><ContextMenuRadioItem value="item-2">Item 2</ContextMenuRadioItem></ContextMenuRadioSection></ContextMenuContent>',
    props: { defaultOpen: DEFAULT_PROPS.defaultOpen },
  },
};
export default meta;

export const ContextMenu = {
  name: 'ContextMenu',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnContextMenu
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        <ContextMenuTrigger className="flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm">
          {DEFAULT_PROPS.target}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Actions</ContextMenuLabel>
          <ContextMenuItem>Duplicate</ContextMenuItem>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem defaultChecked>Show option</ContextMenuCheckboxItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>PNG</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuRadioSection defaultValue="item-1">
            <ContextMenuRadioItem value="item-1">Item 1</ContextMenuRadioItem>
            <ContextMenuRadioItem value="item-2">Item 2</ContextMenuRadioItem>
          </ContextMenuRadioSection>
        </ContextMenuContent>
      </ShadcnContextMenu>
    );
  },
};

export const ContextMenuTriggerStory = {
  name: 'ContextMenuTrigger',
  sourceInsert: { props: { children: 'Right click target' } },
  render: () => (
    <ShadcnContextMenu>
      <ContextMenuTrigger className="flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm">
        Right click target
      </ContextMenuTrigger>
      <ContextMenuContent><ContextMenuItem>Duplicate</ContextMenuItem></ContextMenuContent>
    </ShadcnContextMenu>
  ),
};

export const ContextMenuContentStory = {
  name: 'ContextMenuContent',
  args: {
    align: 'start',
    side: 'right',
    sideOffset: 0,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuItem>Duplicate</ContextMenuItem><ContextMenuItem>Rename</ContextMenuItem>',
    props: {
      align: 'start',
      side: 'right',
      sideOffset: 0,
    },
  },
  render: (args: Args) => (
    <ShadcnContextMenu defaultOpen>
      <ContextMenuTrigger>Target</ContextMenuTrigger>
      <ContextMenuContent
        align={asOption(args.align, ALIGNS, 'start')}
        side={asOption(args.side, SIDES, 'right')}
        sideOffset={asNumber(args.sideOffset, 0, { min: 0, max: 32 })}
      >
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
      </ContextMenuContent>
    </ShadcnContextMenu>
  ),
};

export const ContextMenuGroupStory = {
  name: 'ContextMenuGroup',
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuItem>Duplicate</ContextMenuItem>',
  },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuGroup><ContextMenuItem>Duplicate</ContextMenuItem></ContextMenuGroup>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuLabelStory = {
  name: 'ContextMenuLabel',
  sourceInsert: { props: { children: 'Actions' } },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuLabel>Actions</ContextMenuLabel>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuItemStory = {
  name: 'ContextMenuItem',
  args: {
    children: 'Duplicate',
    variant: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: ITEM_VARIANTS },
  },
  sourceInsert: { props: { children: 'Duplicate', variant: 'default' } },
  render: (args: Args) => (
    <ContextMenuContentPreview>
      <ContextMenuItem variant={asOption(args.variant, ITEM_VARIANTS, 'default')}>
        {asText(args.children, 'Duplicate')}
      </ContextMenuItem>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuCheckboxItemStory = {
  name: 'ContextMenuCheckboxItem',
  sourceInsert: { props: { children: 'Show option', defaultChecked: true } },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuCheckboxItem defaultChecked>Show option</ContextMenuCheckboxItem>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuRadioGroupStory = {
  name: 'ContextMenuRadioGroup',
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuRadioItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuRadioItem value="item-1">Item</ContextMenuRadioItem>',
    props: { defaultValue: 'item-1' },
  },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuRadioGroup defaultValue="item-1">
        <ContextMenuRadioItem value="item-1">Item</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuRadioSectionStory = {
  name: 'ContextMenuRadioSection',
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuRadioItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuRadioItem value="item-1">Item 1</ContextMenuRadioItem><ContextMenuRadioItem value="item-2">Item 2</ContextMenuRadioItem>',
    props: { defaultValue: 'item-1' },
  },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuRadioSection defaultValue="item-1">
        <ContextMenuRadioItem value="item-1">Item 1</ContextMenuRadioItem>
        <ContextMenuRadioItem value="item-2">Item 2</ContextMenuRadioItem>
      </ContextMenuRadioSection>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuRadioItemStory = {
  name: 'ContextMenuRadioItem',
  sourceInsert: { props: { children: 'Item', value: 'item-1' } },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuRadioGroup defaultValue="item-1">
        <ContextMenuRadioItem value="item-1">Item</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuSeparatorStory = {
  name: 'ContextMenuSeparator',
  sourceInsert: {},
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuSeparator />
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuShortcutStory = {
  name: 'ContextMenuShortcut',
  sourceInsert: { props: { children: '⌘D' } },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuItem>
        Duplicate
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuSubStory = {
  name: 'ContextMenuSub',
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuSubTrigger', 'ContextMenuSubContent', 'ContextMenuItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuSubTrigger>Export</ContextMenuSubTrigger><ContextMenuSubContent><ContextMenuItem>PNG</ContextMenuItem></ContextMenuSubContent>',
  },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent><ContextMenuItem>PNG</ContextMenuItem></ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuSubmenuStory = {
  name: 'ContextMenuSubmenu',
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuItem>PNG</ContextMenuItem>',
    props: { trigger: 'Export' },
  },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuSubmenu trigger="Export">
        <ContextMenuItem>PNG</ContextMenuItem>
      </ContextMenuSubmenu>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuSubTriggerStory = {
  name: 'ContextMenuSubTrigger',
  sourceInsert: { props: { children: 'Export' } },
  render: () => (
    <ContextMenuContentPreview>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent><ContextMenuItem>PNG</ContextMenuItem></ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContentPreview>
  ),
};

export const ContextMenuSubContentStory = {
  name: 'ContextMenuSubContent',
  args: {
    align: 'start',
    side: 'right',
    sideOffset: 0,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ContextMenuItem'],
        sourceFile: 'src/components/ui/context-menu.tsx',
      },
    ],
    jsxChildren: '<ContextMenuItem>PNG</ContextMenuItem>',
    props: {
      align: 'start',
      side: 'right',
      sideOffset: 0,
    },
  },
  render: (args: Args) => (
    <ContextMenuContentPreview>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent
          align={asOption(args.align, ALIGNS, 'start')}
          side={asOption(args.side, SIDES, 'right')}
          sideOffset={asNumber(args.sideOffset, 0, { min: 0, max: 32 })}
        >
          <ContextMenuItem>PNG</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContentPreview>
  ),
};
