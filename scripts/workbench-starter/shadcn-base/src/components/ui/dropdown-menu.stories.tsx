import type { ReactNode } from 'react';
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioSection,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubmenu,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  children?: boolean | string;
  defaultOpen?: boolean | string;
  size?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  trigger?: boolean | string;
  variant?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const BUTTON_SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;
const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const ITEM_VARIANTS = ['default', 'destructive'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  trigger: 'Open menu',
  defaultOpen: true,
} as const;

function DropdownMenuContentPreview({ children }: { children: ReactNode }) {
  return (
    <ShadcnDropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </ShadcnDropdownMenu>
  );
}

const meta = {
  title: 'shadcn/Base UI/Dropdown Menu',
  component: ShadcnDropdownMenu,
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
          'DropdownMenuCheckboxItem',
          'DropdownMenuContent',
          'DropdownMenuItem',
          'DropdownMenuLabel',
          'DropdownMenuRadioItem',
          'DropdownMenuRadioSection',
          'DropdownMenuSeparator',
          'DropdownMenuSub',
          'DropdownMenuSubContent',
          'DropdownMenuSubTrigger',
          'DropdownMenuTrigger',
        ],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren:
      '<DropdownMenuTrigger variant="outline">Open menu</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem>Duplicate</DropdownMenuItem><DropdownMenuItem>Rename</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuCheckboxItem defaultChecked>Show option</DropdownMenuCheckboxItem><DropdownMenuSub><DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>PNG</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub><DropdownMenuRadioSection defaultValue="item-1"><DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem><DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem></DropdownMenuRadioSection></DropdownMenuContent>',
    props: {
      defaultOpen: DEFAULT_PROPS.defaultOpen,
    },
  },
};
export default meta;

export const DropdownMenu = {
  name: 'DropdownMenu',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnDropdownMenu
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        <DropdownMenuTrigger variant="outline">{DEFAULT_PROPS.trigger}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem defaultChecked>Show option</DropdownMenuCheckboxItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>PNG</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuRadioSection defaultValue="item-1">
            <DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem>
          </DropdownMenuRadioSection>
        </DropdownMenuContent>
      </ShadcnDropdownMenu>
    );
  },
};

export const DropdownMenuTriggerStory = {
  name: 'DropdownMenuTrigger',
  args: {
    children: 'Open menu',
    variant: 'outline',
    size: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    size: { control: 'select', options: BUTTON_SIZES },
  },
  sourceInsert: {
    props: {
      children: 'Open menu',
      variant: 'outline',
      size: 'default',
    },
  },
  render: (args: Args) => (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger
        size={asOption(args.size, BUTTON_SIZES, 'default')}
        variant={asOption(args.variant, BUTTON_VARIANTS, 'outline')}
      >
        {asText(args.children, 'Open menu')}
      </DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuItem>Duplicate</DropdownMenuItem></DropdownMenuContent>
    </ShadcnDropdownMenu>
  ),
};

export const DropdownMenuContentStory = {
  name: 'DropdownMenuContent',
  args: {
    align: 'start',
    side: 'bottom',
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
        names: ['DropdownMenuItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuItem>Duplicate</DropdownMenuItem><DropdownMenuItem>Rename</DropdownMenuItem>',
    props: {
      align: 'start',
      side: 'bottom',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <ShadcnDropdownMenu defaultOpen>
      <DropdownMenuContent
        align={asOption(args.align, ALIGNS, 'start')}
        side={asOption(args.side, SIDES, 'bottom')}
        sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
      >
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  ),
};

export const DropdownMenuGroupStory = {
  name: 'DropdownMenuGroup',
  sourceInsert: {
    imports: [
      {
        names: ['DropdownMenuItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuItem>Duplicate</DropdownMenuItem>',
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuGroup><DropdownMenuItem>Duplicate</DropdownMenuItem></DropdownMenuGroup>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuItemStory = {
  name: 'DropdownMenuItem',
  args: {
    children: 'Duplicate',
    variant: 'default',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: ITEM_VARIANTS },
  },
  sourceInsert: {
    props: {
      children: 'Duplicate',
      variant: 'default',
    },
  },
  render: (args: Args) => (
    <DropdownMenuContentPreview>
      <DropdownMenuItem variant={asOption(args.variant, ITEM_VARIANTS, 'default')}>
        {asText(args.children, 'Duplicate')}
      </DropdownMenuItem>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuLabelStory = {
  name: 'DropdownMenuLabel',
  sourceInsert: {
    props: {
      children: 'Actions',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuSeparatorStory = {
  name: 'DropdownMenuSeparator',
  sourceInsert: {},
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuSeparator />
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuShortcutStory = {
  name: 'DropdownMenuShortcut',
  sourceInsert: {
    props: {
      children: '⌘D',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuItem>
        Duplicate
        <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuCheckboxItemStory = {
  name: 'DropdownMenuCheckboxItem',
  sourceInsert: {
    props: {
      children: 'Show option',
      defaultChecked: true,
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuCheckboxItem defaultChecked>Show option</DropdownMenuCheckboxItem>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuRadioGroupStory = {
  name: 'DropdownMenuRadioGroup',
  sourceInsert: {
    imports: [
      {
        names: ['DropdownMenuRadioItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuRadioItem value="item-1">Item</DropdownMenuRadioItem>',
    props: {
      defaultValue: 'item-1',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuRadioGroup defaultValue="item-1">
        <DropdownMenuRadioItem value="item-1">Item</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuRadioSectionStory = {
  name: 'DropdownMenuRadioSection',
  sourceInsert: {
    imports: [
      {
        names: ['DropdownMenuRadioItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem><DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem>',
    props: {
      defaultValue: 'item-1',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuRadioSection defaultValue="item-1">
        <DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem>
      </DropdownMenuRadioSection>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuRadioItemStory = {
  name: 'DropdownMenuRadioItem',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuRadioGroup defaultValue="item-1">
        <DropdownMenuRadioItem value="item-1">Item</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuSubStory = {
  name: 'DropdownMenuSub',
  sourceInsert: {
    imports: [
      {
        names: ['DropdownMenuSubTrigger', 'DropdownMenuSubContent', 'DropdownMenuItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren:
      '<DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>PNG</DropdownMenuItem></DropdownMenuSubContent>',
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
        <DropdownMenuSubContent><DropdownMenuItem>PNG</DropdownMenuItem></DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuSubmenuStory = {
  name: 'DropdownMenuSubmenu',
  sourceInsert: {
    imports: [
      {
        names: ['DropdownMenuItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuItem>PNG</DropdownMenuItem>',
    props: {
      trigger: 'Export',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuSubmenu trigger="Export">
        <DropdownMenuItem>PNG</DropdownMenuItem>
      </DropdownMenuSubmenu>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuSubTriggerStory = {
  name: 'DropdownMenuSubTrigger',
  sourceInsert: {
    props: {
      children: 'Export',
    },
  },
  render: () => (
    <DropdownMenuContentPreview>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
        <DropdownMenuSubContent><DropdownMenuItem>PNG</DropdownMenuItem></DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContentPreview>
  ),
};

export const DropdownMenuSubContentStory = {
  name: 'DropdownMenuSubContent',
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
        names: ['DropdownMenuItem'],
        sourceFile: 'src/components/ui/dropdown-menu.tsx',
      },
    ],
    jsxChildren: '<DropdownMenuItem>PNG</DropdownMenuItem>',
    props: {
      align: 'start',
      side: 'right',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <DropdownMenuContentPreview>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          align={asOption(args.align, ALIGNS, 'start')}
          side={asOption(args.side, SIDES, 'right')}
          sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
        >
          <DropdownMenuItem>PNG</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContentPreview>
  ),
};
