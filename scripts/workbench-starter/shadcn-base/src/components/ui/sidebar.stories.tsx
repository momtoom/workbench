import {
  RiHomeLine,
  RiMore2Line,
  RiSideBarLine,
} from '@remixicon/react';
import {
  Sidebar as ShadcnSidebar,
  SidebarBrand,
  SidebarBrandContent,
  SidebarBrandImage,
  SidebarBrandMark,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuButtonContent,
  SidebarMenuButtonPersistent,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarTriggerCollapsedIcon,
  SidebarTriggerExpandedIcon,
} from './sidebar';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  collapsedSurface?: boolean | string;
  collapsedSize?: boolean | string;
  collapsible?: boolean | string;
  contained?: boolean | string;
  expanded?: boolean | string;
  fit?: boolean | string;
  imageAlt?: boolean | string;
  imageSrc?: boolean | string;
  isActive?: boolean | string;
  label?: boolean | string;
  resizable?: boolean | string;
  side?: boolean | string;
  size?: boolean | string;
  variant?: boolean | string;
};

const SIDES = ['left', 'right'] as const;
const VARIANTS = ['sidebar', 'floating', 'inset'] as const;
const COLLAPSIBLE_VALUES = ['offcanvas', 'icon', 'none'] as const;
const COLLAPSED_SIZES = ['sm', 'md', 'lg'] as const;
const MENU_BUTTON_SIZES = ['inherit', 'default', 'sm', 'lg'] as const;
const SUB_BUTTON_SIZES = ['sm', 'md'] as const;

const meta = {
  title: 'shadcn/Base UI/Sidebar',
  component: ShadcnSidebar,
  authoring: {
    group: 'Navigation',
  },
  args: {
    variant: 'sidebar',
    collapsedSize: 'md',
    collapsible: 'none',
    contained: false,
    expanded: true,
    resizable: false,
    side: 'left',
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    collapsedSize: { control: 'select', options: COLLAPSED_SIZES },
    collapsible: { control: 'select', options: COLLAPSIBLE_VALUES },
    contained: { control: 'boolean' },
    expanded: { control: 'boolean', name: 'Expanded' },
    resizable: { control: 'boolean', name: 'Resizable' },
    side: { control: 'select', options: SIDES },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'SidebarContent',
          'SidebarGroup',
          'SidebarGroupContent',
          'SidebarGroupLabel',
          'SidebarMenu',
          'SidebarMenuButton',
          'SidebarMenuButtonContent',
          'SidebarMenuButtonPersistent',
          'SidebarMenuItem',
        ],
        sourceFile: 'src/components/ui/sidebar.tsx',
      },
      {
        importSource: '@remixicon/react',
        names: ['RiHomeLine'],
      },
    ],
    jsxChildren: '<SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive><RiHomeLine />Home</SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent>',
    props: {
      variant: 'sidebar',
      className: 'w-64 rounded-xl border',
      collapsedSize: 'md',
      collapsible: 'none',
      contained: false,
      expanded: true,
      resizable: false,
      side: 'left',
    },
  },
};

export default meta;

function MenuPreview() {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <SidebarMenuButtonPersistent><RiHomeLine /></SidebarMenuButtonPersistent>
                <SidebarMenuButtonContent>Home</SidebarMenuButtonContent>
              </SidebarMenuButton>
              <SidebarMenuBadge>4</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

export const Sidebar = {
  name: 'Sidebar',
  render: (args: Args) => (
    <ShadcnSidebar
      className="w-64 rounded-xl border"
      collapsible={asOption(args.collapsible, COLLAPSIBLE_VALUES, 'none')}
      contained={asBoolean(args.contained, false)}
      collapsedSize={asOption(args.collapsedSize, COLLAPSED_SIZES, 'md')}
      expanded={asBoolean(args.expanded, true)}
      resizable={asBoolean(args.resizable, false)}
      side={asOption(args.side, SIDES, 'left')}
      variant={asOption(args.variant, VARIANTS, 'sidebar')}
    >
      <MenuPreview />
    </ShadcnSidebar>
  ),
};

export const SidebarProviderStory = {
  name: 'SidebarProvider',
  sourceInsert: {
    imports: [
      {
        names: [
          'Sidebar',
          'SidebarContent',
          'SidebarGroup',
          'SidebarGroupContent',
          'SidebarGroupLabel',
          'SidebarInset',
          'SidebarMenu',
          'SidebarMenuButton',
          'SidebarMenuButtonContent',
          'SidebarMenuButtonPersistent',
          'SidebarMenuItem',
          'SidebarRail',
          'SidebarTrigger',
        ],
        sourceFile: 'src/components/ui/sidebar.tsx',
      },
      { importSource: '@remixicon/react', names: ['RiHomeLine'] },
    ],
    jsxChildren: '<Sidebar collapsible="icon"><SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive><SidebarMenuButtonPersistent><RiHomeLine /></SidebarMenuButtonPersistent><SidebarMenuButtonContent>Home</SidebarMenuButtonContent></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarRail /></Sidebar><SidebarInset><header className="flex h-14 items-center px-4"><SidebarTrigger /></header><main className="p-4">Main content</main></SidebarInset>',
    props: {
      className: 'relative min-h-[28rem] overflow-hidden rounded-xl bg-muted/30',
      contained: true,
    },
  },
  render: () => (
    <SidebarProvider className="relative min-h-[28rem] overflow-hidden rounded-xl bg-muted/30" contained>
      <ShadcnSidebar className="h-[28rem]" collapsible="icon" contained>
        <MenuPreview />
        <SidebarRail />
      </ShadcnSidebar>
      <SidebarInset className="min-h-[28rem]">
        <header className="flex h-14 items-center gap-3 px-4">
          <SidebarTrigger />
          <span className="font-medium">App shell</span>
        </header>
        <main className="grid flex-1 place-items-center bg-muted/30 p-4 text-sm text-muted-foreground">Main content</main>
      </SidebarInset>
    </SidebarProvider>
  ),
};

export const SidebarContentStory = {
  name: 'SidebarContent',
  sourceInsert: {
    imports: [{ names: ['SidebarGroup'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarGroup />',
  },
  render: () => <ShadcnSidebar className="w-64 rounded-xl border" collapsible="none"><MenuPreview /></ShadcnSidebar>,
};

export const SidebarGroupStory = {
  name: 'SidebarGroup',
  sourceInsert: {
    imports: [{ names: ['SidebarGroupLabel', 'SidebarGroupContent'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent>Group content</SidebarGroupContent>',
  },
  render: () => <SidebarGroup className="w-64"><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent>Group content</SidebarGroupContent></SidebarGroup>,
};

export const SidebarGroupLabelStory = {
  name: 'SidebarGroupLabel',
  sourceInsert: { props: { children: 'Workspace' } },
  render: () => <SidebarGroupLabel>Workspace</SidebarGroupLabel>,
};

export const SidebarGroupContentStory = {
  name: 'SidebarGroupContent',
  sourceInsert: {
    imports: [{ names: ['SidebarMenu'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarMenu />',
  },
  render: () => <SidebarGroupContent className="w-64"><SidebarMenu /></SidebarGroupContent>,
};

export const SidebarMenuStory = {
  name: 'SidebarMenu',
  sourceInsert: {
    imports: [{ names: ['SidebarMenuButton', 'SidebarMenuItem'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarMenuItem><SidebarMenuButton>Home</SidebarMenuButton></SidebarMenuItem>',
  },
  render: () => <SidebarMenu className="w-64"><SidebarMenuItem><SidebarMenuButton>Home</SidebarMenuButton></SidebarMenuItem></SidebarMenu>,
};

export const SidebarMenuItemStory = {
  name: 'SidebarMenuItem',
  sourceInsert: {
    imports: [{ names: ['SidebarMenuButton'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarMenuButton>Home</SidebarMenuButton>',
  },
  render: () => <SidebarMenuItem className="w-64"><SidebarMenuButton>Home</SidebarMenuButton></SidebarMenuItem>,
};

export const SidebarMenuButtonStory = {
  name: 'SidebarMenuButton',
  args: { variant: 'default', size: 'inherit', collapsedSurface: 'preserve', isActive: false },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'panel'] },
    size: { control: 'select', options: MENU_BUTTON_SIZES },
    collapsedSurface: { control: 'select', options: ['preserve', 'transparent'] },
    isActive: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      { names: ['SidebarMenuButtonContent', 'SidebarMenuButtonPersistent'], sourceFile: 'src/components/ui/sidebar.tsx' },
      { importSource: '@remixicon/react', names: ['RiHomeLine'] },
    ],
    jsxChildren: '<SidebarMenuButtonPersistent><RiHomeLine /></SidebarMenuButtonPersistent><SidebarMenuButtonContent>Home</SidebarMenuButtonContent>',
    props: { variant: 'default', size: 'inherit', collapsedSurface: 'preserve', isActive: false },
  },
  render: (args: Args) => <SidebarMenuButton className="w-64" collapsedSurface={asOption(args.collapsedSurface, ['preserve', 'transparent'] as const, 'preserve')} isActive={asBoolean(args.isActive, false)} size={asOption(args.size, MENU_BUTTON_SIZES, 'inherit')} variant={asOption(args.variant, ['default', 'outline', 'panel'] as const, 'default')}><SidebarMenuButtonPersistent><RiHomeLine /></SidebarMenuButtonPersistent><SidebarMenuButtonContent>Home</SidebarMenuButtonContent></SidebarMenuButton>,
};

export const SidebarMenuButtonPersistentStory = {
  name: 'SidebarMenuButtonPersistent',
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiHomeLine'] }],
    jsxChildren: '<RiHomeLine />',
  },
  render: () => <SidebarMenuButtonPersistent><RiHomeLine /></SidebarMenuButtonPersistent>,
};

export const SidebarMenuButtonContentStory = {
  name: 'SidebarMenuButtonContent',
  sourceInsert: { props: { children: 'Home' } },
  render: () => <SidebarMenuButtonContent>Home</SidebarMenuButtonContent>,
};

export const SidebarHeaderStory = {
  name: 'SidebarHeader',
  sourceInsert: {
    imports: [
      { names: ['SidebarBrand', 'SidebarBrandContent', 'SidebarBrandImage', 'SidebarBrandMark'], sourceFile: 'src/components/ui/sidebar.tsx' },
    ],
    jsxChildren: '<SidebarBrand><SidebarBrandMark><SidebarBrandImage src="/workbench-assets/icons/lucide-preview/audio-waveform.svg" alt="Acme" /></SidebarBrandMark><SidebarBrandContent><p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p></SidebarBrandContent></SidebarBrand>',
  },
  render: () => <SidebarHeader className="w-64"><SidebarBrand><SidebarBrandMark><SidebarBrandImage src="/workbench-assets/icons/lucide-preview/audio-waveform.svg" alt="Acme" /></SidebarBrandMark><SidebarBrandContent><p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p></SidebarBrandContent></SidebarBrand></SidebarHeader>,
};

export const SidebarBrandStory = {
  name: 'SidebarBrand',
  sourceInsert: {
    imports: [
      { names: ['SidebarBrandContent', 'SidebarBrandImage', 'SidebarBrandMark'], sourceFile: 'src/components/ui/sidebar.tsx' },
    ],
    jsxChildren: '<SidebarBrandMark><SidebarBrandImage src="/workbench-assets/icons/lucide-preview/audio-waveform.svg" alt="Acme" /></SidebarBrandMark><SidebarBrandContent><p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p></SidebarBrandContent>',
  },
  render: () => <SidebarBrand className="w-64"><SidebarBrandMark><SidebarBrandImage src="/workbench-assets/icons/lucide-preview/audio-waveform.svg" alt="Acme" /></SidebarBrandMark><SidebarBrandContent><p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p></SidebarBrandContent></SidebarBrand>,
};

export const SidebarBrandMarkStory = {
  name: 'SidebarBrandMark',
  args: { variant: 'plain' },
  argTypes: { variant: { control: 'select', options: ['plain', 'framed'] } },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiHomeLine'] }],
    jsxChildren: '<RiHomeLine />',
    props: { variant: 'plain' },
  },
  render: (args: Args) => <SidebarBrandMark variant={asOption(args.variant, ['plain', 'framed'] as const, 'plain')}><RiHomeLine /></SidebarBrandMark>,
};

export const SidebarBrandImageStory = {
  name: 'SidebarBrandImage',
  args: { src: '/workbench-assets/icons/lucide-preview/audio-waveform.svg', alt: 'Brand mark', fit: 'contain' },
  argTypes: {
    src: { assetKinds: ['image'], control: 'text', name: 'Image source', picker: 'asset-token', tokenTypes: ['string'] },
    alt: { control: 'text', name: 'Alt text' },
    fit: { control: 'select', options: ['contain', 'cover'] },
  },
  sourceInsert: { props: { src: '/workbench-assets/icons/lucide-preview/audio-waveform.svg', alt: 'Brand mark', fit: 'contain' } },
  render: (args: Args) => <SidebarBrandImage alt={typeof args.alt === 'string' ? args.alt : 'Brand mark'} fit={asOption(args.fit, ['contain', 'cover'] as const, 'contain')} src={typeof args.src === 'string' ? args.src : '/workbench-assets/icons/lucide-preview/audio-waveform.svg'} />,
};

export const SidebarBrandContentStory = {
  name: 'SidebarBrandContent',
  sourceInsert: { jsxChildren: '<p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p>' },
  render: () => <SidebarBrandContent><p className="text-xs text-muted-foreground">Workspace</p><p className="font-semibold">Acme</p></SidebarBrandContent>,
};

export const SidebarFooterStory = {
  name: 'SidebarFooter',
  sourceInsert: { props: { children: 'Footer' } },
  render: () => <SidebarFooter className="w-64">Footer</SidebarFooter>,
};

export const SidebarInputStory = {
  name: 'SidebarInput',
  args: { placeholder: 'Search' },
  sourceInsert: { props: { placeholder: 'Search' } },
  render: (args: Args) => <SidebarInput className="w-64" placeholder={asText(args.placeholder, 'Search')} />,
};

export const SidebarSeparatorStory = {
  name: 'SidebarSeparator',
  sourceInsert: {},
  render: () => <SidebarSeparator className="w-64" />,
};

export const SidebarTriggerStory = {
  name: 'SidebarTrigger',
  args: { label: 'Toggle Sidebar' },
  argTypes: { label: { control: 'text' } },
  sourceInsert: {
    imports: [
      { names: ['SidebarTriggerCollapsedIcon', 'SidebarTriggerExpandedIcon'], sourceFile: 'src/components/ui/sidebar.tsx' },
      { importSource: '@remixicon/react', names: ['RiHomeLine', 'RiSideBarLine'] },
    ],
    jsxChildren: '<SidebarTriggerCollapsedIcon><RiHomeLine /></SidebarTriggerCollapsedIcon><SidebarTriggerExpandedIcon><RiSideBarLine /></SidebarTriggerExpandedIcon>',
    props: { label: 'Toggle Sidebar' },
  },
  render: (args: Args) => <SidebarProvider className="min-h-0"><SidebarTrigger label={typeof args.label === 'string' ? args.label : 'Toggle Sidebar'}><SidebarTriggerCollapsedIcon><RiHomeLine /></SidebarTriggerCollapsedIcon><SidebarTriggerExpandedIcon><RiSideBarLine /></SidebarTriggerExpandedIcon></SidebarTrigger></SidebarProvider>,
};

export const SidebarTriggerCollapsedIconStory = {
  name: 'SidebarTriggerCollapsedIcon',
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiHomeLine'] }],
    jsxChildren: '<RiHomeLine />',
  },
  render: () => <SidebarTriggerCollapsedIcon><RiHomeLine /></SidebarTriggerCollapsedIcon>,
};

export const SidebarTriggerExpandedIconStory = {
  name: 'SidebarTriggerExpandedIcon',
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiSideBarLine'] }],
    jsxChildren: '<RiSideBarLine />',
  },
  render: () => <SidebarTriggerExpandedIcon className="inline-flex"><RiSideBarLine /></SidebarTriggerExpandedIcon>,
};

export const SidebarInsetStory = {
  name: 'SidebarInset',
  sourceInsert: { props: { children: 'Main content' } },
  render: () => <SidebarInset className="min-h-24 rounded-xl border p-4">Main content</SidebarInset>,
};

export const SidebarGroupActionStory = {
  name: 'SidebarGroupAction',
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiMore2Line'] }],
    jsxChildren: '<RiMore2Line />',
  },
  render: () => <SidebarGroup className="w-64"><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupAction aria-label="More"><RiMore2Line /></SidebarGroupAction></SidebarGroup>,
};

export const SidebarMenuActionStory = {
  name: 'SidebarMenuAction',
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiMore2Line'] }],
    jsxChildren: '<RiMore2Line />',
  },
  render: () => <SidebarMenuItem className="w-64"><SidebarMenuButton>Home</SidebarMenuButton><SidebarMenuAction aria-label="More"><RiMore2Line /></SidebarMenuAction></SidebarMenuItem>,
};

export const SidebarMenuBadgeStory = {
  name: 'SidebarMenuBadge',
  sourceInsert: { props: { children: '4' } },
  render: () => <SidebarMenuItem className="w-64"><SidebarMenuButton>Home</SidebarMenuButton><SidebarMenuBadge>4</SidebarMenuBadge></SidebarMenuItem>,
};

export const SidebarMenuSkeletonStory = {
  name: 'SidebarMenuSkeleton',
  args: { showIcon: true },
  argTypes: { showIcon: { control: 'boolean' } },
  sourceInsert: { props: { showIcon: true } },
  render: (args: Args) => <SidebarMenuSkeleton className="w-64" showIcon={asBoolean(args.showIcon, true)} />,
};

export const SidebarMenuSubStory = {
  name: 'SidebarMenuSub',
  sourceInsert: {
    imports: [{ names: ['SidebarMenuSubButton', 'SidebarMenuSubItem'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarMenuSubItem><SidebarMenuSubButton href="#">Details</SidebarMenuSubButton></SidebarMenuSubItem>',
  },
  render: () => <SidebarMenuSub className="w-64"><SidebarMenuSubItem><SidebarMenuSubButton href="#">Details</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub>,
};

export const SidebarMenuSubItemStory = {
  name: 'SidebarMenuSubItem',
  sourceInsert: {
    imports: [{ names: ['SidebarMenuSubButton'], sourceFile: 'src/components/ui/sidebar.tsx' }],
    jsxChildren: '<SidebarMenuSubButton href="#">Details</SidebarMenuSubButton>',
  },
  render: () => <SidebarMenuSubItem className="w-64"><SidebarMenuSubButton href="#">Details</SidebarMenuSubButton></SidebarMenuSubItem>,
};

export const SidebarMenuSubButtonStory = {
  name: 'SidebarMenuSubButton',
  args: { href: '#', size: 'md', isActive: false },
  argTypes: { href: { control: 'text' }, size: { control: 'select', options: SUB_BUTTON_SIZES }, isActive: { control: 'boolean' } },
  sourceInsert: { props: { children: 'Details', href: '#', size: 'md', isActive: false } },
  render: (args: Args) => <SidebarMenuSubButton href={asText(args.href, '#')} isActive={asBoolean(args.isActive, false)} size={asOption(args.size, SUB_BUTTON_SIZES, 'md')}>Details</SidebarMenuSubButton>,
};

export const SidebarRailStory = {
  name: 'SidebarRail',
  sourceInsert: {},
  render: () => <div className="relative h-32 w-64 rounded-xl border"><SidebarRail className="flex" /></div>,
};
