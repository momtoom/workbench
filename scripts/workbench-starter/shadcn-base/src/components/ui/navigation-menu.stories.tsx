import type { ReactNode } from 'react';
import {
  NavigationMenu as ShadcnNavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkItem,
  NavigationMenuList,
  NavigationMenuPanelItem,
  NavigationMenuTrigger,
} from './navigation-menu';
import { asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  defaultValue?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'item-1',
  align: 'start',
} as const;

function NavigationMenuRootPreview({
  align = DEFAULT_PROPS.align,
  children,
  defaultValue = DEFAULT_PROPS.defaultValue,
}: {
  align?: string;
  children: ReactNode;
  defaultValue?: string;
}) {
  return (
    <ShadcnNavigationMenu align={asOption(align, ALIGNS, DEFAULT_PROPS.align)} defaultValue={defaultValue}>
      <NavigationMenuList>{children}</NavigationMenuList>
      <NavigationMenuIndicator />
    </ShadcnNavigationMenu>
  );
}

const meta = {
  title: 'shadcn/Base UI/Navigation Menu',
  component: ShadcnNavigationMenu,
  authoring: {
    group: 'Navigation',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    align: { control: 'select', options: ALIGNS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['NavigationMenuPanelItem', 'NavigationMenuLink', 'NavigationMenuLinkItem'],
        sourceFile: 'src/components/ui/navigation-menu.tsx',
      },
    ],
    jsxChildren:
      '<NavigationMenuPanelItem value="item-1" trigger="Item"><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuPanelItem><NavigationMenuLinkItem value="item-2" href="#">Link</NavigationMenuLinkItem>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const NavigationMenu = {
  name: 'NavigationMenu',
  render: (args: Args) => {
    const defaultValue = asText(args.defaultValue, DEFAULT_PROPS.defaultValue);
    return (
      <ShadcnNavigationMenu
        key={`${asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}-${defaultValue}`}
        align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
        defaultValue={defaultValue}
      >
        <NavigationMenuPanelItem value="item-1" trigger="Item">
          <NavigationMenuLink href="#">Link</NavigationMenuLink>
        </NavigationMenuPanelItem>
        <NavigationMenuLinkItem value="item-2" href="#">Link</NavigationMenuLinkItem>
      </ShadcnNavigationMenu>
    );
  },
};

export const NavigationMenuListStory = {
  name: 'NavigationMenuList',
  sourceInsert: {
    imports: [
      {
        names: ['NavigationMenuLinkItem'],
        sourceFile: 'src/components/ui/navigation-menu.tsx',
      },
    ],
    jsxChildren: '<NavigationMenuLinkItem value="item-1" href="#">Link</NavigationMenuLinkItem>',
  },
  render: () => (
    <ShadcnNavigationMenu>
      <NavigationMenuList>
        <NavigationMenuLinkItem value="item-1" href="#">Link</NavigationMenuLinkItem>
      </NavigationMenuList>
    </ShadcnNavigationMenu>
  ),
};

export const NavigationMenuPanelItemStory = {
  name: 'NavigationMenuPanelItem',
  sourceInsert: {
    imports: [
      {
        names: ['NavigationMenuLink'],
        sourceFile: 'src/components/ui/navigation-menu.tsx',
      },
    ],
    jsxChildren: '<NavigationMenuLink href="#">Link</NavigationMenuLink>',
    props: {
      value: 'item-1',
      trigger: 'Item',
    },
  },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuPanelItem value="item-1" trigger="Item">
        <NavigationMenuLink href="#">Link</NavigationMenuLink>
      </NavigationMenuPanelItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuLinkItemStory = {
  name: 'NavigationMenuLinkItem',
  sourceInsert: {
    props: {
      children: 'Link',
      value: 'item-1',
      href: '#',
    },
  },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuLinkItem value="item-1" href="#">Link</NavigationMenuLinkItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuItemStory = {
  name: 'NavigationMenuItem',
  sourceInsert: {
    imports: [
      {
        names: ['NavigationMenuLink'],
        sourceFile: 'src/components/ui/navigation-menu.tsx',
      },
    ],
    jsxChildren: '<NavigationMenuLink href="#">Link</NavigationMenuLink>',
    props: {
      value: 'item-1',
    },
  },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuItem value="item-1"><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuTriggerStory = {
  name: 'NavigationMenuTrigger',
  sourceInsert: { props: { children: 'Item' } },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuItem value="item-1">
        <NavigationMenuTrigger>Item</NavigationMenuTrigger>
        <NavigationMenuContent><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuContentStory = {
  name: 'NavigationMenuContent',
  sourceInsert: {
    imports: [
      {
        names: ['NavigationMenuLink'],
        sourceFile: 'src/components/ui/navigation-menu.tsx',
      },
    ],
    jsxChildren: '<NavigationMenuLink href="#">Link</NavigationMenuLink>',
  },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuItem value="item-1">
        <NavigationMenuTrigger>Item</NavigationMenuTrigger>
        <NavigationMenuContent><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuLinkStory = {
  name: 'NavigationMenuLink',
  sourceInsert: { props: { children: 'Link', href: '#' } },
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuItem><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuRootPreview>
  ),
};

export const NavigationMenuIndicatorStory = {
  name: 'NavigationMenuIndicator',
  sourceInsert: {},
  render: () => (
    <NavigationMenuRootPreview>
      <NavigationMenuItem value="item-1">
        <NavigationMenuTrigger>Item</NavigationMenuTrigger>
        <NavigationMenuContent><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuRootPreview>
  ),
};
