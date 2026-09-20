import '../workbench-tokens.css'

import { Accordion, AccordionPanel } from '../components/ui/accordion';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger } from '../components/ui/attachment';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '../components/ui/bubble';
import { Button } from '../components/ui/button';
import { ButtonGroup, ButtonGroupText } from '../components/ui/button-group';
import { Calendar } from '../components/ui/calendar';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Carousel, CarouselSlide } from '../components/ui/carousel';
import { CarouselCards } from '../components/ui/carousel-cards';
import { AreaChartCard, BarChartCard, ComposedChartCard, LineChartCard, PieChartCard, RadarChartCard, RadialChartCard } from '../components/ui/chart-patterns';
import { Checkbox } from '../components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxList, ComboboxOption, ComboboxSection } from '../components/ui/combobox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '../components/ui/command';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../components/ui/context-menu';
import { DatePicker } from '../components/ui/date-picker';
import { DateRangePicker } from '../components/ui/date-range-picker';
import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DirectionProvider } from '../components/ui/direction';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../components/ui/drawer';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../components/ui/field';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';
import { Icon } from '../components/ui/icon';
import { Input } from '../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '../components/ui/input-group';
import { InputOTP, InputOTPDigitGroup, InputOTPSeparator } from '../components/ui/input-otp';
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from '../components/ui/item';
import { Kbd, KbdGroup } from '../components/ui/kbd';
import { Label } from '../components/ui/label';
import { Marker, MarkerContent, MarkerIcon } from '../components/ui/marker';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '../components/ui/menubar';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from '../components/ui/message';
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerViewport } from '../components/ui/message-scroller';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '../components/ui/native-select';
import { NavigationMenu, NavigationMenuLinkItem, NavigationMenuPanelItem } from '../components/ui/navigation-menu';
import { Pagination, PaginationEllipsis, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../components/ui/popover';
import { Progress, ProgressLabel, ProgressValue } from '../components/ui/progress';
import { RadioGroup, RadioGroupItem, RadioGroupOption } from '../components/ui/radio-group';
import { ResizablePanel, ResizableSplit } from '../components/ui/resizable';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Sidebar, SidebarBrand, SidebarBrandContent, SidebarBrandMark, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuButtonContent, SidebarMenuButtonPersistent, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from '../components/ui/sidebar';
import { Skeleton } from '../components/ui/skeleton';
import { Slider } from '../components/ui/slider';
import { Spinner } from '../components/ui/spinner';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsPane, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Theme } from '../components/ui/theme';
import { Toaster, ToastTrigger } from '../components/ui/toast';
import { Toggle } from '../components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

export default function ClaudeCatalogPage() {
  return (
    <Theme
      as="main"
      theme="neutral"
      mode="auto"
      surface="none"
      typography="base"
      spacing="base"
      radius="base"
      popover="default"
      effect="auto"
      className="bg-background text-foreground"
      aria-label="ComponentsCatalog"
    >
      <Toaster />

      <header id="cl-top" className="mx-auto w-full max-w-[88rem] px-6 pt-10 md:px-10">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-border pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>SHADCN-002 — Component Ledger</span>
            <span className="hidden sm:inline">66 families · 09 sections</span>
            <span>Tokens only · auto light / dark</span>
          </div>

          <h1 className="mt-12 font-heading text-5xl font-semibold tracking-[-0.04em] md:text-7xl">Component Ledger</h1>

          <nav className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12" aria-label="Ledger index">
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">01 · Foundations · 7</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-theme">Theme</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-direction">Direction</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-icon">Icon</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-separator">Separator</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-aspect-ratio">Aspect Ratio</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-scroll-area">Scroll Area</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-kbd">Kbd</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">02 · Actions &amp; commands · 6</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-button">Button</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-button-group">Button Group</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-toggle">Toggle</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-toggle-group">Toggle Group</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-command">Command</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-menubar">Menubar</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">03 · Form inputs · 16</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-label">Label</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-field">Field</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-input">Input</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-input-group">Input Group</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-input-otp">Input OTP</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-textarea">Textarea</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-select">Select</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-native-select">Native Select</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-combobox">Combobox</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-checkbox">Checkbox</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-radio-group">Radio Group</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-switch">Switch</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-slider">Slider</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-calendar">Calendar</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-date-picker">Date Picker</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-date-range-picker">Date Range Picker</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">04 · Wayfinding · 3</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-breadcrumb">Breadcrumb</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-pagination">Pagination</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-navigation-menu">Navigation Menu</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">05 · Overlays · 9</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-tooltip">Tooltip</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-hover-card">Hover Card</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-popover">Popover</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-dropdown-menu">Dropdown Menu</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-context-menu">Context Menu</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-dialog">Dialog</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-alert-dialog">Alert Dialog</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-sheet">Sheet</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-drawer">Drawer</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">06 · Content &amp; data · 12</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-card">Card</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-item">Item</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-avatar">Avatar</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-attachment">Attachment</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-table">Table</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-tabs">Tabs</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-accordion">Accordion</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-collapsible">Collapsible</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-carousel">Carousel</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-carousel-cards">Carousel Cards</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-chart">Chart</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-chart-patterns">Chart Patterns</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">07 · Status &amp; feedback · 7</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-badge">Badge</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-alert">Alert</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-progress">Progress</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-skeleton">Skeleton</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-spinner">Spinner</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-empty">Empty</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-toast">Toast</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">08 · Conversation · 4</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-marker">Marker</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-bubble">Bubble</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-message">Message</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-message-scroller">Message Scroller</a>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-[0.18em] text-xs">09 · Shell &amp; structure · 2</p>
              <p className="mt-3 flex flex-wrap text-[13px] leading-6 gap-x-2">
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-resizable">Resizable</a>
                <a className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-sidebar">Sidebar</a>
              </p>
            </div>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[88rem] gap-24 px-6 pb-32 pt-20 md:px-10">

        <section id="cl-s01" aria-label="Foundations" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Foundations</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">7 families · 001–007</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-theme" data-family="theme">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">001</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Theme</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Token scope. Everything below inherits palette, radius, and mode from its nearest Theme ancestor.</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Theme theme="neutral" mode="auto" surface="none" radius="base" className="grid content-between gap-4 rounded-lg border border-border/60 p-4">
                  <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Neutral</span><span className="font-mono text-[10px] text-muted-foreground">light</span></div>
                  <div className="grid grid-cols-4 gap-1" aria-label="Neutral scope colors"><span className="h-8 rounded-sm bg-primary" /><span className="h-8 rounded-sm bg-accent" /><span className="h-8 rounded-sm bg-[var(--chart-2)]" /><span className="h-8 rounded-sm bg-[var(--chart-3)]" /></div>
                  <div className="flex items-center gap-2"><Button size="xs">Act</Button><Badge variant="secondary">Tag</Badge></div>
                </Theme>
                <Theme theme="indigo" mode="auto" surface="none" radius="base" className="grid content-between gap-4 rounded-lg border border-border/60 p-4">
                  <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Indigo</span><span className="font-mono text-[10px] text-muted-foreground">light</span></div>
                  <div className="grid grid-cols-4 gap-1" aria-label="Indigo scope colors"><span className="h-8 rounded-sm bg-primary" /><span className="h-8 rounded-sm bg-accent" /><span className="h-8 rounded-sm bg-[var(--chart-2)]" /><span className="h-8 rounded-sm bg-[var(--chart-3)]" /></div>
                  <div className="flex items-center gap-2"><Button size="xs">Act</Button><Badge variant="secondary">Tag</Badge></div>
                </Theme>
                <Theme theme="rose" mode="auto" surface="none" radius="base" className="grid content-between gap-4 rounded-lg border border-border/60 p-4">
                  <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Rose</span><span className="font-mono text-[10px] text-muted-foreground">compact radius</span></div>
                  <div className="grid grid-cols-4 gap-1" aria-label="Rose scope colors"><span className="h-8 rounded-sm bg-primary" /><span className="h-8 rounded-sm bg-accent" /><span className="h-8 rounded-sm bg-[var(--chart-2)]" /><span className="h-8 rounded-sm bg-[var(--chart-3)]" /></div>
                  <div className="flex items-center gap-2"><Button size="xs">Act</Button><Badge variant="secondary">Tag</Badge></div>
                </Theme>
                <Theme theme="amber" mode="auto" surface="none" effect="dark" radius="base" className="grid content-between gap-4 rounded-lg border border-border/60 p-4">
                  <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">Amber</span><span className="font-mono text-[10px] text-muted-foreground">fixed dark</span></div>
                  <div className="grid grid-cols-4 gap-1" aria-label="Amber dark scope colors"><span className="h-8 rounded-sm bg-primary" /><span className="h-8 rounded-sm bg-accent" /><span className="h-8 rounded-sm bg-[var(--chart-2)]" /><span className="h-8 rounded-sm bg-[var(--chart-3)]" /></div>
                  <div className="flex items-center gap-2"><Button size="xs">Act</Button><Badge variant="outline">Scoped</Badge></div>
                </Theme>
              </div>
            </article>

            <article id="cl-direction" data-family="direction">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">002</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Direction</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Writing-direction scope; mirrors layout for RTL locales without touching component code.</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-2">
                <DirectionProvider direction="ltr">
                  <div className="rounded-lg bg-muted/40 p-5">
                    <p className="text-sm font-medium">Left to right</p>
                    <p className="mt-1 text-sm text-muted-foreground">Browse → configure → confirm</p>
                  </div>
                </DirectionProvider>
                <DirectionProvider direction="rtl">
                  <div className="rounded-lg bg-muted/40 p-5">
                    <p className="text-sm font-medium">من اليمين إلى اليسار</p>
                    <p className="mt-1 text-sm text-muted-foreground">تأكيد ← إعداد ← تصفح</p>
                  </div>
                </DirectionProvider>
              </div>
            </article>

            <article id="cl-icon" data-family="icon">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">003</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Icon</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Lucide symbol wrapper with accessible naming, sizing, stroke, and color control.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <div className="flex flex-wrap items-end gap-6">
                  <div className="grid justify-items-center gap-2"><Icon name="search" size={12} /><span className="font-mono text-[10px] text-muted-foreground">12</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="settings" size={16} /><span className="font-mono text-[10px] text-muted-foreground">16</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="info" size={20} /><span className="font-mono text-[10px] text-muted-foreground">20</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="folder" size={24} /><span className="font-mono text-[10px] text-muted-foreground">24</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="layout-grid" size={32} /><span className="font-mono text-[10px] text-muted-foreground">32</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="check" size={24} strokeWidth={3} /><span className="font-mono text-[10px] text-muted-foreground">stroke 3</span></div>
                  <div className="grid justify-items-center gap-2"><Icon decorative name="sparkles" color="var(--primary)" size={24} /><span className="font-mono text-[10px] text-muted-foreground">primary</span></div>
                  <div className="grid justify-items-center gap-2"><Icon name="alert-triangle" decorative={false} size={24} title="Warning" /><span className="font-mono text-[10px] text-muted-foreground">titled</span></div>
                </div>
              </div>
            </article>

            <article id="cl-separator" data-family="separator">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">004</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Separator</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The quietest structure: a hairline in either axis.</p>
              </header>
              <div className="grid gap-5 rounded-lg bg-muted/40 p-5">
                <div className="flex items-center gap-5 text-sm">
                  <span className="font-medium">Ledger</span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-muted-foreground">Sections</span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-muted-foreground">Families</span>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">Content resumes after a horizontal break.</p>
              </div>
            </article>

            <article id="cl-aspect-ratio" data-family="aspect-ratio">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">005</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Aspect Ratio</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Reserved proportional space for media before it loads.</p>
              </header>
              <div className="grid max-w-xl gap-3 sm:grid-cols-3">
                <AspectRatio ratio="16/9" className="flex items-center justify-center rounded-lg bg-muted/60 font-mono text-xs">16 : 9</AspectRatio>
                <AspectRatio ratio="4/3" className="flex items-center justify-center rounded-lg bg-muted/60 font-mono text-xs">4 : 3</AspectRatio>
                <AspectRatio ratio="1" className="flex items-center justify-center rounded-lg bg-muted/60 font-mono text-xs">1 : 1</AspectRatio>
              </div>
            </article>

            <article id="cl-scroll-area" data-family="scroll-area">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">006</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Scroll Area</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Overflow with styled, unobtrusive scrollbars in both axes.</p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                <ScrollArea className="h-36 rounded-lg bg-muted/40 p-5">
                  <div className="grid gap-3 text-sm">
                    <p>01 — Foundations set the scopes.</p>
                    <p>02 — Actions state intent.</p>
                    <p>03 — Inputs collect structure.</p>
                    <p>04 — Wayfinding places the user.</p>
                    <p>05 — Overlays interrupt in order.</p>
                    <p>06 — Content organizes knowledge.</p>
                  </div>
                </ScrollArea>
                <ScrollArea className="rounded-lg bg-muted/40 p-4">
                  <div className="flex w-max gap-3 pb-3">
                    <div className="w-36 rounded-md bg-background p-4 font-mono text-xs">strip 01</div>
                    <div className="w-36 rounded-md bg-background p-4 font-mono text-xs">strip 02</div>
                    <div className="w-36 rounded-md bg-background p-4 font-mono text-xs">strip 03</div>
                    <div className="w-36 rounded-md bg-background p-4 font-mono text-xs">strip 04</div>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </article>

            <article id="cl-kbd" data-family="kbd">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">007</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Kbd</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Keycap notation for shortcuts, alone or chorded.</p>
              </header>
              <div className="flex flex-wrap items-center gap-8 rounded-lg bg-muted/40 p-5 text-sm">
                <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
                <span className="text-muted-foreground">opens the command palette · <Kbd>Esc</Kbd> dismisses · <KbdGroup><Kbd>⌘</Kbd><Kbd>Shift</Kbd><Kbd>P</Kbd></KbdGroup> chords</span>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s02" aria-label="Actions and commands" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Actions &amp; commands</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">6 families · 008–013</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-button" data-family="button">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">008</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Button</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The primary verb. Six intents, five text sizes, four icon sizes, and a pill shape.</p>
              </header>
              <div className="grid gap-4 rounded-lg bg-muted/40 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs" variant="outline">xs</Button>
                  <Button size="sm" variant="outline">sm</Button>
                  <Button variant="outline">base</Button>
                  <Button size="lg" variant="outline">lg</Button>
                  <Button disabled>Disabled</Button>
                  <Button shape="pill"><Icon name="plus" />New entry</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="icon-xs" variant="outline" aria-label="Search"><Icon name="search" /></Button>
                  <Button size="icon-sm" variant="secondary" aria-label="Settings"><Icon name="settings" /></Button>
                  <Button size="icon" variant="ghost" aria-label="More"><Icon name="ellipsis" /></Button>
                  <Button size="icon-lg" variant="destructive" aria-label="Delete"><Icon name="trash" /></Button>
                </div>
              </div>
            </article>

            <article id="cl-button-group" data-family="button-group">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">009</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Button Group</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Related actions fused into one control, with optional text cells and separators.</p>
              </header>
              <div className="flex flex-wrap items-start gap-10 rounded-lg bg-muted/40 p-5">
                <ButtonGroup>
                  <Button variant="outline"><Icon name="arrow-up" />Prev</Button>
                  <ButtonGroupText>14 / 66</ButtonGroupText>
                  <Button variant="outline">Next<Icon name="arrow-down" /></Button>
                </ButtonGroup>
                <ButtonGroup>
                  <Button variant="secondary" aria-label="Bold"><Icon name="bold" /></Button>
                  <Button variant="secondary" aria-label="Italic"><Icon name="italic" /></Button>
                  <Button variant="secondary" aria-label="Underline"><Icon name="underline" /></Button>
                </ButtonGroup>
                <ButtonGroup orientation="vertical">
                  <Button variant="outline">Move up</Button>
                  <Button variant="outline">Move to top</Button>
                  <Button variant="outline" disabled>Pinned</Button>
                </ButtonGroup>
              </div>
            </article>

            <article id="cl-toggle" data-family="toggle">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">010</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Toggle</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">A press that stays pressed; state lives in the control itself.</p>
              </header>
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-5">
                <Toggle aria-label="Toggle bold"><Icon name="bold" /></Toggle>
                <Toggle aria-label="Toggle italic" defaultPressed><Icon name="italic" /></Toggle>
                <Toggle aria-label="Outlined toggle" variant="outline">Outline</Toggle>
                <Toggle aria-label="Locked toggle" disabled><Icon name="lock" /></Toggle>
              </div>
            </article>

            <article id="cl-toggle-group" data-family="toggle-group">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">011</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Toggle Group</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Exclusive or additive selection across sibling toggles.</p>
              </header>
              <div className="flex flex-wrap items-start gap-10 rounded-lg bg-muted/40 p-5">
                <ToggleGroup defaultValue="ledger" spacing={0} variant="outline">
                  <ToggleGroupItem value="ledger">Ledger</ToggleGroupItem>
                  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
                  <ToggleGroupItem value="index">Index</ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup defaultValue="bold,underline" multiple size="sm">
                  <ToggleGroupItem value="bold" aria-label="Bold on"><Icon name="bold" /></ToggleGroupItem>
                  <ToggleGroupItem value="italic" aria-label="Italic"><Icon name="italic" /></ToggleGroupItem>
                  <ToggleGroupItem value="underline" aria-label="Underline on"><Icon name="underline" /></ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup defaultValue="top" disabled orientation="vertical" spacing={0} variant="outline">
                  <ToggleGroupItem value="top">Top</ToggleGroupItem>
                  <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </article>

            <article id="cl-command" data-family="command">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">012</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Command</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The keyboard-first surface: filter, group, shortcut, and an honest empty state.</p>
              </header>
              <Command className="max-w-xl rounded-lg border border-border/60">
                <CommandInput placeholder="Jump to a family…" />
                <CommandList>
                  <CommandEmpty>No family matches.</CommandEmpty>
                  <CommandGroup heading="Sections">
                    <CommandItem><Icon name="layout-grid" />Foundations<CommandShortcut>⌘1</CommandShortcut></CommandItem>
                    <CommandItem><Icon name="mouse-pointer" />Actions<CommandShortcut>⌘2</CommandShortcut></CommandItem>
                    <CommandItem disabled><Icon name="lock" />Archived section</CommandItem>
                  </CommandGroup>
                  <CommandGroup heading="Families">
                    <CommandItem><Icon name="panel-top" />Dialog</CommandItem>
                    <CommandItem><Icon name="message-square" />Bubble</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </article>

            <article id="cl-menubar" data-family="menubar">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">013</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Menubar</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Desktop-style persistent command strip.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <Menubar>
                  <MenubarMenu><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New page</MenubarItem><MenubarItem>Duplicate</MenubarItem></MenubarContent></MenubarMenu>
                  <MenubarMenu><MenubarTrigger>Edit</MenubarTrigger><MenubarContent><MenubarItem>Undo</MenubarItem><MenubarItem>Redo</MenubarItem></MenubarContent></MenubarMenu>
                  <MenubarMenu><MenubarTrigger>View</MenubarTrigger><MenubarContent><MenubarItem>Zoom to fit</MenubarItem><MenubarItem>Toggle grid</MenubarItem></MenubarContent></MenubarMenu>
                </Menubar>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s03" aria-label="Form inputs" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Form inputs</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">16 families · 014–029</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-label" data-family="label">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">014</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Label</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The accessible name a control answers to.</p>
              </header>
              <div className="grid max-w-xl gap-5 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="cl-label-a">Family name</Label><Input id="cl-label-a" placeholder="Button" /></div>
                <div className="grid gap-2"><Label htmlFor="cl-label-b">Section <span className="text-destructive">*</span></Label><Input id="cl-label-b" defaultValue="Actions" /></div>
              </div>
            </article>

            <article id="cl-field" data-family="field">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">015</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Field</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Label, control, help, and error composed into one accessible unit.</p>
              </header>
              <FieldGroup className="grid gap-6 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <Field data-invalid={false}>
                  <FieldLabel htmlFor="cl-field-owner">Catalog owner</FieldLabel>
                  <Input id="cl-field-owner" type="email" placeholder="design@ledger.dev" />
                  <FieldDescription>Change requests are routed to this address.</FieldDescription>
                </Field>
                <Field data-invalid>
                  <FieldLabel htmlFor="cl-field-slug">Family slug</FieldLabel>
                  <Input defaultValue="Button Grup!" placeholder="Placeholder" type="email" id="cl-field-slug" aria-invalid={true} />
                  <FieldError>Lowercase letters, numbers, and hyphens only.</FieldError>
                </Field>
              </FieldGroup>
            </article>

            <article id="cl-input" data-family="input">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">016</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Input</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Single-line text in every state a form review will ask about.</p>
              </header>
              <div className="grid max-w-2xl gap-3 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <Input defaultValue="Filled value" aria-label="Filled input" />
                <Input placeholder="Placeholder" aria-label="Empty input" />
                <Input type="password" defaultValue="secret" aria-label="Password input" />
                <Input defaultValue="Read only" readOnly aria-label="Read-only input" />
                <Input aria-invalid defaultValue="Invalid value" aria-label="Invalid input" />
                <Input placeholder="Disabled" disabled aria-label="Disabled input" />
              </div>
            </article>

            <article id="cl-input-group" data-family="input-group">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">017</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Input Group</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Inputs with affixes: text, icons, buttons, and block-level addons.</p>
              </header>
              <div className="grid max-w-2xl gap-4 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <InputGroup>
                  <InputGroupAddon>ledger/</InputGroupAddon>
                  <InputGroupInput defaultValue="button" aria-label="Family path" />
                  <InputGroupAddon align="inline-end"><InputGroupText>.tsx</InputGroupText></InputGroupAddon>
                </InputGroup>
                <InputGroup>
                  <InputGroupAddon><Icon name="search" /></InputGroupAddon>
                  <InputGroupInput placeholder="Find a family" aria-label="Find a family" />
                  <InputGroupAddon align="inline-end"><InputGroupButton aria-label="Search now" size="icon-xs"><Icon name="arrow-right" /></InputGroupButton></InputGroupAddon>
                </InputGroup>
                <InputGroup className="sm:col-span-2">
                  <InputGroupTextarea defaultValue="A catalog is a promise: what is listed here works." aria-label="Ledger note" />
                  <InputGroupAddon align="block-start" className="border-b">Ledger note</InputGroupAddon>
                  <InputGroupAddon align="block-end" className="border-t"><InputGroupText>48 / 200</InputGroupText></InputGroupAddon>
                </InputGroup>
              </div>
            </article>

            <article id="cl-input-otp" data-family="input-otp">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">018</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Input OTP</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Fixed-length code entry, grouped and separated.</p>
              </header>
              <div className="flex flex-wrap items-end gap-10 rounded-lg bg-muted/40 p-5">
                <div className="grid gap-2"><Label>Six digits</Label><InputOTP defaultValue="066214" maxLength={6}><InputOTPDigitGroup count={3} /><InputOTPSeparator /><InputOTPDigitGroup count={3} /></InputOTP></div>
                <div className="grid gap-2"><Label>Invalid</Label><InputOTP aria-invalid defaultValue="41" maxLength={4}><InputOTPDigitGroup count={4} /></InputOTP></div>
                <div className="grid gap-2"><Label>Disabled</Label><InputOTP defaultValue="0000" disabled maxLength={4}><InputOTPDigitGroup count={4} /></InputOTP></div>
              </div>
            </article>

            <article id="cl-textarea" data-family="textarea">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">019</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Textarea</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Multi-line text with the same state grammar as Input.</p>
              </header>
              <div className="grid max-w-2xl gap-3 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <Textarea className="min-h-24" defaultValue="Specimens should show the states a reviewer will ask about." />
                <Textarea className="min-h-24" placeholder="Add a review note" />
                <Textarea className="min-h-24" aria-invalid defaultValue="Too short" />
                <Textarea className="min-h-24" placeholder="Disabled" disabled />
              </div>
            </article>

            <article id="cl-select" data-family="select">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">020</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Select</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Portal-based choice with groups, labels, and a compact prop-driven form.</p>
              </header>
              <div className="grid max-w-xl gap-3 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <Select defaultValue="actions">
                  <SelectTrigger><SelectValue placeholder="Choose a section" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sections</SelectLabel>
                      <SelectItem value="foundations">Foundations</SelectItem>
                      <SelectItem value="actions">Actions</SelectItem>
                      <SelectSeparator />
                      <SelectItem value="shell">Shell</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select defaultValue="dense">
                  <SelectTrigger><SelectValue placeholder="Density" /></SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value="dense">Dense</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="minimal" disabled>Minimal · unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </article>

            <article id="cl-native-select" data-family="native-select">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">021</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Native Select</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The platform control, styled — for forms that must never break.</p>
              </header>
              <div className="grid max-w-xl items-center gap-3 rounded-lg bg-muted/40 p-5 sm:grid-cols-3">
                <NativeSelect defaultValue="button">
                  <NativeSelectOptGroup label="Actions">
                    <NativeSelectOption value="button">Button</NativeSelectOption>
                    <NativeSelectOption value="toggle">Toggle</NativeSelectOption>
                  </NativeSelectOptGroup>
                  <NativeSelectOptGroup label="Inputs">
                    <NativeSelectOption value="input">Input</NativeSelectOption>
                  </NativeSelectOptGroup>
                </NativeSelect>
                <NativeSelect defaultValue="sm" size="sm">
                  <NativeSelectOption value="sm">Small size</NativeSelectOption>
                </NativeSelect>
                <NativeSelect defaultValue="locked" disabled>
                  <NativeSelectOption value="locked">Disabled</NativeSelectOption>
                </NativeSelect>
              </div>
            </article>

            <article id="cl-combobox" data-family="combobox">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">022</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Combobox</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Type-to-filter selection for lists too long to scan.</p>
              </header>
              <div className="grid max-w-2xl gap-3 rounded-lg bg-muted/40 p-5 sm:grid-cols-3">
                <Combobox defaultValue="tooltip">
                  <ComboboxInput placeholder="Pick an overlay" />
                  <ComboboxContent><ComboboxList>
                    <ComboboxSection label="Passive">
                      <ComboboxOption value="tooltip">Tooltip</ComboboxOption>
                      <ComboboxOption value="hover-card">Hover Card</ComboboxOption>
                    </ComboboxSection>
                    <ComboboxSection label="Blocking">
                      <ComboboxOption value="dialog">Dialog</ComboboxOption>
                    </ComboboxSection>
                  </ComboboxList></ComboboxContent>
                </Combobox>
                <Combobox>
                  <ComboboxInput placeholder="Nothing chosen yet" />
                  <ComboboxContent><ComboboxList>
                    <ComboboxSection label="Long labels">
                      <ComboboxOption value="ledger">A deliberately long option label that must truncate</ComboboxOption>
                    </ComboboxSection>
                  </ComboboxList></ComboboxContent>
                </Combobox>
                <Combobox disabled defaultValue="locked">
                  <ComboboxInput placeholder="Unavailable" />
                  <ComboboxContent><ComboboxList>
                    <ComboboxSection label="Disabled">
                      <ComboboxOption value="locked">Locked</ComboboxOption>
                    </ComboboxSection>
                  </ComboboxList></ComboboxContent>
                </Combobox>
              </div>
            </article>

            <article id="cl-checkbox" data-family="checkbox">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">023</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Checkbox</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Independent yes/no, in all four state combinations.</p>
              </header>
              <div className="grid max-w-xl gap-4 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <div className="flex items-center gap-3"><Checkbox id="cl-check-a" defaultChecked /><Label htmlFor="cl-check-a">Checked</Label></div>
                <div className="flex items-center gap-3"><Checkbox id="cl-check-b" /><Label htmlFor="cl-check-b">Unchecked</Label></div>
                <div className="flex items-center gap-3"><Checkbox id="cl-check-c" disabled /><Label htmlFor="cl-check-c">Disabled</Label></div>
                <div className="flex items-center gap-3"><Checkbox id="cl-check-d" defaultChecked disabled /><Label htmlFor="cl-check-d">Disabled · checked</Label></div>
              </div>
            </article>

            <article id="cl-radio-group" data-family="radio-group">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">024</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Radio Group</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">One of N. Prebuilt option rows or hand-composed items.</p>
              </header>
              <div className="grid max-w-2xl gap-8 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <RadioGroup defaultValue="ledger">
                  <RadioGroupOption value="ledger">Ledger layout</RadioGroupOption>
                  <RadioGroupOption value="grid">Card grid</RadioGroupOption>
                  <RadioGroupOption value="list">Plain list</RadioGroupOption>
                </RadioGroup>
                <RadioGroup defaultValue="on">
                  <div className="flex items-center gap-2"><RadioGroupItem value="on" id="cl-radio-on" /><Label htmlFor="cl-radio-on">Composed item</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="off" id="cl-radio-off" disabled /><Label htmlFor="cl-radio-off">Disabled item</Label></div>
                </RadioGroup>
              </div>
            </article>

            <article id="cl-switch" data-family="switch">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">025</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Switch</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Immediate on/off — no submit step implied.</p>
              </header>
              <div className="grid max-w-sm gap-4 rounded-lg bg-muted/40 p-5">
                <div className="flex items-center justify-between"><Label htmlFor="cl-switch-a">Show part counts</Label><Switch id="cl-switch-a" defaultChecked /></div>
                <div className="flex items-center justify-between"><Label htmlFor="cl-switch-b">Compact rows</Label><Switch id="cl-switch-b" size="sm" /></div>
                <div className="flex items-center justify-between"><Label htmlFor="cl-switch-c">Locked setting</Label><Switch id="cl-switch-c" defaultChecked disabled /></div>
              </div>
            </article>

            <article id="cl-slider" data-family="slider">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">026</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Slider</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Continuous or stepped values, single or range, in either axis.</p>
                <p className="mt-3 font-mono text-[11px] text-muted-foreground/80">1 part · range · min/max/step · orientation</p>
              </header>
              <div className="grid max-w-2xl gap-8 rounded-lg bg-muted/40 p-5 sm:grid-cols-[1fr_1fr_auto]">
                <div className="grid content-start gap-3">
                  <div className="flex justify-between text-sm"><span>Coverage</span><span className="font-mono text-xs text-muted-foreground">66%</span></div>
                  <Slider defaultValue={66} aria-label="Coverage" />
                </div>
                <div className="grid content-start gap-3">
                  <div className="flex justify-between text-sm"><span>Specimen range</span><span className="font-mono text-xs text-muted-foreground">14–52</span></div>
                  <Slider defaultValue="14,52" aria-label="Specimen range" />
                </div>
                <div className="flex gap-8 pb-2">
                  <div className="grid content-start gap-3"><span className="text-sm">Vertical</span><Slider className="h-20" orientation="vertical" defaultValue={40} aria-label="Vertical value" /></div>
                  <div className="grid content-start gap-3"><span className="text-sm">Disabled</span><Slider className="w-24" defaultValue={30} disabled aria-label="Disabled value" /></div>
                </div>
              </div>
            </article>

            <article id="cl-calendar" data-family="calendar">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">027</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Calendar</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Inline month grid for single dates and spans.</p>
              </header>
              <div className="grid gap-6 rounded-lg bg-muted/40 p-5 lg:grid-cols-[auto_1fr]">
                <div className="grid content-start gap-2"><span className="font-mono text-[11px] text-muted-foreground">single</span><Calendar mode="single" defaultMonthDate="2026-08-01" selectedDate="2026-08-02" /></div>
                <div className="grid content-start gap-2"><span className="font-mono text-[11px] text-muted-foreground">range · two months · dropdown caption</span><Calendar buttonVariant="outline" captionLayout="dropdown" mode="range" numberOfMonths={2} defaultMonthDate="2026-08-01" /></div>
              </div>
            </article>

            <article id="cl-date-picker" data-family="date-picker">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">028</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Date Picker</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Calendar behind a trigger, for forms.</p>
              </header>
              <div className="flex max-w-xl flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <DatePicker defaultValue="2026-08-02" placeholder="Pick a date" />
                <DatePicker captionLayout="dropdown" placeholder="Dropdown caption" side="top" />
                <DatePicker disabled placeholder="Disabled" />
              </div>
            </article>

            <article id="cl-date-range-picker" data-family="date-range-picker">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">029</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Date Range Picker</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Two-ended spans with open-ended and disabled states.</p>
              </header>
              <div className="flex max-w-xl flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <DateRangePicker defaultFrom="2026-08-02" defaultTo="2026-08-16" numberOfMonths={2} />
                <DateRangePicker defaultFrom="2026-08-20" formatPattern="MMM d" placeholder="Open-ended" side="top" />
                <DateRangePicker disabled placeholder="Disabled" />
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s04" aria-label="Wayfinding" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Wayfinding</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">3 families · 030–032</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-breadcrumb" data-family="breadcrumb">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">030</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Breadcrumb</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The trail back up the hierarchy; the last crumb is the page itself.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink>Ledger</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink>Wayfinding</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </article>

            <article id="cl-pagination" data-family="pagination">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">031</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Pagination</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Walking a numbered result set, with honest ellipsis.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <Pagination>
                  <PaginationPrevious />
                  <PaginationLink isActive>1</PaginationLink>
                  <PaginationLink>2</PaginationLink>
                  <PaginationLink>3</PaginationLink>
                  <PaginationEllipsis />
                  <PaginationLink>9</PaginationLink>
                  <PaginationNext />
                </Pagination>
              </div>
            </article>

            <article id="cl-navigation-menu" data-family="navigation-menu">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">032</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Navigation Menu</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Top-level destinations: plain links beside rich panel items.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <NavigationMenu align="start">
                  <NavigationMenuPanelItem value="sections" trigger="Sections">Nine functional sections, escalating from foundations to shell.</NavigationMenuPanelItem>
                  <NavigationMenuLinkItem value="index">Index</NavigationMenuLinkItem>
                  <NavigationMenuLinkItem value="colophon">Colophon</NavigationMenuLinkItem>
                </NavigationMenu>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s05" aria-label="Overlays" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Overlays</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">9 families · 033–041</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-tooltip" data-family="tooltip">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">033</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Tooltip</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 1 — a hint on hover, gone on move.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <TooltipProvider delay={0}>
                  <div className="flex flex-wrap gap-3">
                    <Tooltip><TooltipTrigger render={<Button size="sm" variant="outline" />}>Top</TooltipTrigger><TooltipContent side="top">Appears above the trigger.</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger render={<Button size="sm" variant="outline" />}>Right</TooltipTrigger><TooltipContent side="right">Sits beside compact controls.</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger render={<Button size="sm" variant="outline" />}>Shortcut</TooltipTrigger><TooltipContent side="bottom">Press ⌘K to jump.</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger render={<Button size="sm" variant="outline" />}>Left</TooltipTrigger><TooltipContent side="left">Checks edge placement.</TooltipContent></Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </article>

            <article id="cl-hover-card" data-family="hover-card">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">034</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Hover Card</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 2 — a rich preview behind a reference.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5 text-sm">
                <span className="text-muted-foreground">Maintained by </span>
                <HoverCard>
                  <HoverCardTrigger render={<Button variant="link" />}>@ledger-core</HoverCardTrigger>
                  <HoverCardContent>
                    <p className="font-medium">Ledger Core</p>
                    <p className="mt-1 text-sm text-muted-foreground">Owns the 66-family contract and its specimens.</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </article>

            <article id="cl-popover" data-family="popover">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">035</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Popover</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 3 — a small anchored panel that holds focus lightly.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" />}>Bottom start</PopoverTrigger>
                  <PopoverContent align="start" side="bottom"><PopoverHeader><PopoverTitle>Display density</PopoverTitle><PopoverDescription>Anchored below, aligned to the leading edge.</PopoverDescription></PopoverHeader></PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" />}>Right end</PopoverTrigger>
                  <PopoverContent align="end" side="right"><PopoverHeader><PopoverTitle>Edge case</PopoverTitle><PopoverDescription>Flips when the viewport runs out.</PopoverDescription></PopoverHeader></PopoverContent>
                </Popover>
              </div>
            </article>

            <article id="cl-dropdown-menu" data-family="dropdown-menu">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">036</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Dropdown Menu</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 3 — commands under a trigger: items, checks, submenus.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <DropdownMenu>
                  <DropdownMenuTrigger variant="outline">Family actions</DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Specimen</DropdownMenuLabel>
                    <DropdownMenuItem><Icon name="copy" />Duplicate<DropdownMenuShortcut>⌘D</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuItem><Icon name="pencil" />Rename<DropdownMenuShortcut>↵</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem defaultChecked>Show part counts</DropdownMenuCheckboxItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Export as</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>PNG</DropdownMenuItem>
                        <DropdownMenuItem>SVG</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive"><Icon name="trash" />Remove from ledger</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>

            <article id="cl-context-menu" data-family="context-menu">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">037</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Context Menu</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The same menu grammar, summoned in place with a right click.</p>
              </header>
              <ContextMenu>
                <ContextMenuTrigger className="flex h-28 max-w-md items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Right-click this plate
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Copy specimen</ContextMenuItem>
                  <ContextMenuItem>Inspect source</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </article>

            <article id="cl-dialog" data-family="dialog">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">038</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Dialog</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 4 — modal focus until dismissed or completed.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <Dialog>
                  <DialogTrigger variant="outline">Edit family entry</DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Family entry</DialogTitle><DialogDescription>Composed form: header, body, and footer are yours.</DialogDescription></DialogHeader>
                    <DialogFooter>
                      <DialogCancel size="sm">Cancel</DialogCancel>
                      <DialogAction size="sm">Save entry</DialogAction>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger variant="outline">Quick rename</DialogTrigger>
                  <DialogContent size="sm" showCloseButton>
                    <DialogHeader><DialogTitle>Rename family</DialogTitle><DialogDescription>Compound source keeps every visible control selectable.</DialogDescription></DialogHeader>
                    <DialogFooter><DialogCancel>Cancel</DialogCancel><DialogAction>Rename</DialogAction></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </article>

            <article id="cl-alert-dialog" data-family="alert-dialog">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">039</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Alert Dialog</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Interruption level 5 — a decision that cannot be clicked away.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <AlertDialog>
                  <AlertDialogTrigger variant="outline">Delete family</AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete this family?</AlertDialogTitle><AlertDialogDescription>Its specimens and index entry are removed. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger variant="outline">Discard edits</AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogMedia><Icon name="triangle-alert" /></AlertDialogMedia>
                      <AlertDialogTitle>Discard unsaved edits?</AlertDialogTitle>
                      <AlertDialogDescription>The current specimen changes will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction>Discard</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>

            <article id="cl-sheet" data-family="sheet">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">040</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Sheet</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">A modal panel docked to any edge — inspector-grade surface area.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <Sheet><SheetTrigger render={<Button variant="outline" />}>Right inspector</SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Specimen inspector</SheetTitle><SheetDescription>The default side for detail panels.</SheetDescription></SheetHeader></SheetContent></Sheet>
                <Sheet><SheetTrigger render={<Button variant="outline" />}>Left</SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>Ledger navigation</SheetTitle><SheetDescription>Mirrored placement.</SheetDescription></SheetHeader></SheetContent></Sheet>
                <Sheet><SheetTrigger render={<Button variant="outline" />}>Top</SheetTrigger><SheetContent side="top"><SheetHeader><SheetTitle>Notice</SheetTitle><SheetDescription>Edge banner behavior.</SheetDescription></SheetHeader></SheetContent></Sheet>
                <Sheet><SheetTrigger render={<Button variant="outline" />}>Bottom · no close</SheetTrigger><SheetContent side="bottom" showCloseButton={false}><SheetHeader><SheetTitle>Bulk actions</SheetTitle><SheetDescription>Dismissal is the caller&rsquo;s job here.</SheetDescription></SheetHeader></SheetContent></Sheet>
              </div>
            </article>

            <article id="cl-drawer" data-family="drawer">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">041</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Drawer</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The gesture-friendly takeover, at home on touch viewports.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <Drawer direction="bottom">
                  <DrawerTrigger className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Bottom drawer</DrawerTrigger>
                  <DrawerContent><DrawerHeader><DrawerTitle>Mobile controls</DrawerTitle><DrawerDescription>The canonical touch position.</DrawerDescription></DrawerHeader>
                    <div className="grid gap-3"><Label htmlFor="cl-drawer-name">Family</Label><Input id="cl-drawer-name" defaultValue="Drawer" /></div>
                    <DrawerFooter><DrawerClose className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Done</DrawerClose></DrawerFooter></DrawerContent>
                </Drawer>
                <Drawer direction="right">
                  <DrawerTrigger className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Right drawer</DrawerTrigger>
                  <DrawerContent><DrawerHeader><DrawerTitle>Review changes</DrawerTitle><DrawerDescription>Side-docked variant.</DrawerDescription></DrawerHeader>
                    <DrawerFooter><DrawerClose className="inline-flex h-8 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground">Close</DrawerClose></DrawerFooter></DrawerContent>
                </Drawer>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s06" aria-label="Content and data" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Content &amp; data</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">12 families · 042–053</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-card" data-family="card">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">042</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Card</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The independent unit of content: header, body, footer, corner action.</p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Rename specimen</CardTitle>
                    <CardDescription>Cards can host live controls.</CardDescription>
                    <CardAction><Button size="icon-sm" variant="ghost" aria-label="Card options"><Icon name="ellipsis" /></Button></CardAction>
                  </CardHeader>
                  <CardContent><Input defaultValue="Component Ledger" aria-label="Specimen name" /></CardContent>
                  <CardFooter><Button className="w-full" variant="secondary">Save</Button></CardFooter>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Families</CardTitle>
                    <CardDescription>Catalogued this release.</CardDescription>
                    <CardAction><Badge variant="secondary">100%</Badge></CardAction>
                  </CardHeader>
                  <CardContent><p className="font-heading text-4xl font-semibold tracking-tight">66</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>Review checklist</CardTitle>
                    <CardDescription>Bordered header variant.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2"><Checkbox defaultChecked id="cl-card-check-a" /><Label htmlFor="cl-card-check-a">States covered</Label></div>
                    <div className="flex items-center gap-2"><Checkbox id="cl-card-check-b" /><Label htmlFor="cl-card-check-b">Dark mode pass</Label></div>
                  </CardContent>
                  <CardFooter className="justify-between"><span className="text-xs text-muted-foreground">1 of 2</span><Button size="sm">Continue</Button></CardFooter>
                </Card>
              </div>
            </article>

            <article id="cl-item" data-family="item">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">043</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Item</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The list row grammar: media, content, actions, and optional frame.</p>
              </header>
              <ItemGroup className="max-w-2xl">
                <Item variant="muted">
                  <ItemMedia><Avatar><AvatarFallback>CL</AvatarFallback></Avatar></ItemMedia>
                  <ItemContent>
                    <ItemTitle>Claude catalog pass <Badge variant="secondary">Live</Badge></ItemTitle>
                    <ItemDescription>66 of 66 families with specimen coverage.</ItemDescription>
                  </ItemContent>
                  <ItemActions><Button size="sm" variant="outline">Open</Button></ItemActions>
                </Item>
                <Item variant="outline">
                  <ItemHeader><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Report</span><Badge variant="outline">PDF</Badge></ItemHeader>
                  <ItemMedia variant="icon"><Icon name="file-text" /></ItemMedia>
                  <ItemContent>
                    <ItemTitle>State coverage audit</ItemTitle>
                    <ItemDescription>Disabled, invalid, and long-content checks per family.</ItemDescription>
                  </ItemContent>
                  <ItemFooter><span className="text-xs text-muted-foreground">Generated today</span><Button size="xs" variant="ghost">Download</Button></ItemFooter>
                </Item>
                <ItemSeparator />
                <Item size="xs">
                  <ItemMedia variant="icon"><Icon name="circle-check" /></ItemMedia>
                  <ItemContent><ItemTitle>Compact row</ItemTitle></ItemContent>
                  <ItemActions><Icon name="chevron-right" /></ItemActions>
                </Item>
              </ItemGroup>
            </article>

            <article id="cl-avatar" data-family="avatar">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">044</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Avatar</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Identity at three sizes, stacked groups, and status badges.</p>
              </header>
              <div className="flex flex-wrap items-center gap-8 rounded-lg bg-muted/40 p-5">
                <AvatarGroup size="sm">
                  <Avatar><AvatarFallback>CL</AvatarFallback></Avatar>
                  <Avatar><AvatarFallback>WB</AvatarFallback></Avatar>
                  <Avatar><AvatarFallback>DS</AvatarFallback></Avatar>
                  <AvatarGroupCount>+9</AvatarGroupCount>
                </AvatarGroup>
                <Avatar size="sm" badge="dot"><AvatarFallback>ON</AvatarFallback></Avatar>
                <Avatar badge="number" badgeText="4"><AvatarFallback>NB</AvatarFallback></Avatar>
                <Avatar size="lg" badge="icon" badgeIcon="check"><AvatarFallback>OK</AvatarFallback></Avatar>
              </div>
            </article>

            <article id="cl-attachment" data-family="attachment">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">045</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Attachment</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Files across their whole lifecycle: idle, uploading, processing, done, failed.</p>
              </header>
              <div className="grid gap-5 rounded-lg bg-muted/40 p-5">
                <AttachmentGroup layout="wrap" gap="sm">
                  <Attachment fileName="specimen-audit.pdf" fileMeta="PDF · 1.8 MB" iconName="file-text" state="done" />
                  <Attachment fileName="tokens.json" iconName="braces" progress={58} state="uploading" />
                  <Attachment fileName="coverage.docx" iconName="file-search" state="processing" />
                  <Attachment fileName="render.png" iconName="image" state="error" />
                  <Attachment fileName="notes.md" iconName="clock" state="idle" />
                </AttachmentGroup>
                <AttachmentGroup layout="wrap" gap="sm">
                  <Attachment fileName="ledger.tsx" fileMeta="TSX · 41 KB" iconName="file-code" size="sm" state="done" />
                  <Attachment fileName="cover.png" fileMeta="PNG · 2.2 MB" iconName="image" orientation="vertical" state="done" />
                </AttachmentGroup>
                <AttachmentGroup layout="wrap" gap="sm">
                  <Attachment fileName="report.svg" fileMeta="SVG · 12 KB" iconName="/workbench-assets/icons/workbench-dashboard/report.svg" state="done" />
                  <Dialog>
                    <Attachment className="max-w-xs">
                      <AttachmentMedia iconName="file-text" />
                      <AttachmentContent>
                        <AttachmentTitle>specimen-audit.pdf</AttachmentTitle>
                        <AttachmentDescription>Click the card to preview</AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions><AttachmentAction aria-label="Remove specimen-audit.pdf" iconName="x" /></AttachmentActions>
                      <DialogTrigger render={<AttachmentTrigger aria-label="Preview specimen-audit.pdf" />} />
                    </Attachment>
                    <DialogContent>
                      <DialogHeader><DialogTitle>specimen-audit.pdf</DialogTitle><DialogDescription>The full-card trigger opened this dialog while the remove action stayed independently clickable.</DialogDescription></DialogHeader>
                    </DialogContent>
                  </Dialog>
                </AttachmentGroup>
              </div>
            </article>

            <article id="cl-table" data-family="table">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">046</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Table</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Dense truth: caption, header, selected row, and a footer that adds up.</p>
              </header>
              <Table>
                <TableCaption>Section sizes across the ledger.</TableCaption>
                <TableHeader>
                  <TableRow><TableHead>Section</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Families</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-mono text-xs">01</TableCell><TableCell>Foundations</TableCell><TableCell className="text-right">7</TableCell></TableRow>
                  <TableRow data-state="selected"><TableCell className="font-mono text-xs">03</TableCell><TableCell>Form inputs</TableCell><TableCell className="text-right">16</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">05</TableCell><TableCell>Overlays</TableCell><TableCell className="text-right">9</TableCell></TableRow>
                  <TableRow><TableCell className="font-mono text-xs">06</TableCell><TableCell>Content &amp; data</TableCell><TableCell className="text-right">12</TableCell></TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow><TableCell colSpan={2}>All nine sections</TableCell><TableCell className="text-right">66</TableCell></TableRow>
                </TableFooter>
              </Table>
            </article>


            <article id="cl-accordion" data-family="accordion">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">048</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Accordion</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Stacked disclosure — exclusive by default, additive by choice.</p>
              </header>
              <div className="grid max-w-2xl gap-8 sm:grid-cols-2">
                <Accordion defaultValue="why">
                  <AccordionPanel value="why" title="Why a ledger?">A flat document scans faster than a wall of cards.</AccordionPanel>
                  <AccordionPanel value="order" title="Why this order?">Sections follow escalation, not the alphabet.</AccordionPanel>
                </Accordion>
                <Accordion defaultValue="a,b" multiple showDividers={false}>
                  <AccordionPanel value="a" title="Both open at once">Additive mode keeps context.</AccordionPanel>
                  <AccordionPanel value="b" title="No dividers">Hairlines removed for nested use.</AccordionPanel>
                </Accordion>
              </div>
            </article>

            <article id="cl-collapsible" data-family="collapsible">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">049</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Collapsible</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">One region, revealed in place — disclosure without the stack.</p>
              </header>
              <div className="rounded-lg bg-muted/40 p-5">
                <Collapsible className="max-w-xl">
                  <CollapsibleTrigger render={<Button variant="ghost" />}>Show the fine print</CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 text-sm leading-6 text-muted-foreground">
                    Collapsed content stays in document flow, so nothing below it jumps sideways when revealed.
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </article>

            <article id="cl-tabs" data-family="tabs">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">047</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Tabs</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Sibling views in one region — pane shorthand or explicit list, either axis.</p>
              </header>
              <div className="grid gap-8 rounded-lg bg-muted/40 p-5 lg:grid-cols-2">
                <Tabs defaultValue="anatomy">
                  <TabsPane value="anatomy" title="Anatomy" className="pt-4 text-sm text-muted-foreground">Rail, name, parts, specimen.</TabsPane>
                  <TabsPane value="states" title="States" className="pt-4 text-sm text-muted-foreground">Default, invalid, disabled, long content.</TabsPane>
                  <TabsPane value="tokens" title="Tokens" className="pt-4 text-sm text-muted-foreground">Only semantic color roles.</TabsPane>
                </Tabs>
                <Tabs defaultValue="open">
                  <TabsList>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    <TabsTrigger value="archived" disabled>Archived</TabsTrigger>
                  </TabsList>
                  <TabsContent value="open" className="pt-4"><Badge>3 review notes</Badge></TabsContent>
                  <TabsContent value="resolved" className="pt-4"><Badge variant="secondary">12 resolved</Badge></TabsContent>
                  <TabsContent value="archived" className="pt-4">Unavailable</TabsContent>
                </Tabs>
              </div>
            </article>
            <article id="cl-carousel" data-family="carousel">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">050</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Carousel</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Sequenced slides. Two canonical setups shown; axis, alignment, looping, and control placement are all props.</p>
              </header>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="grid content-start gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">single view · inside controls</span>
                  <Carousel align="start" controlPosition="inside" itemsPerView={1} layoutWidth="100%" paddingX="2.75rem">
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-12 text-center font-mono text-xs">slide 01</div></CarouselSlide>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-12 text-center font-mono text-xs">slide 02</div></CarouselSlide>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-12 text-center font-mono text-xs">slide 03</div></CarouselSlide>
                  </Carousel>
                </div>
                <div className="grid content-start gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">two-up · loop · no controls</span>
                  <Carousel align="center" itemsPerView={2} layoutWidth="100%" loop paddingX="1rem" showControls={false}>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-8 text-center font-mono text-xs">a</div></CarouselSlide>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-8 text-center font-mono text-xs">b</div></CarouselSlide>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-8 text-center font-mono text-xs">c</div></CarouselSlide>
                    <CarouselSlide><div className="rounded-lg bg-muted/60 p-8 text-center font-mono text-xs">d</div></CarouselSlide>
                  </Carousel>
                </div>
              </div>
            </article>

            <article id="cl-carousel-cards" data-family="carousel-cards">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">051</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Carousel Cards</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The packaged editorial pattern on top of Carousel.</p>
              </header>
              <div className="overflow-hidden">
                <CarouselCards title="Pattern shelf" description="Prebuilt content cards riding the base carousel." itemSize="third" showBadges showControls />
              </div>
            </article>

            <article id="cl-chart" data-family="chart">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">052</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Chart</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The charting base: tokened series colors, one canonical area readout.</p>
              </header>
              <AreaChartCard className="w-full" title="Specimens rendered" description="Catalog activity over six months" height={240} showLegend />
            </article>

            <article id="cl-chart-patterns" data-family="chart-patterns">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">053</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Chart Patterns</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Eight packaged shapes; six shown, every one reading from the same chart tokens.</p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <BarChartCard title="Bar" description="Category comparison" height={260} />
                <LineChartCard title="Line" description="Continuous trend" height={260} />
                <PieChartCard innerRadius={0} outerRadius={100} title="Pie" description="Share of whole" height={260} />
                <RadarChartCard title="Radar" description="Multivariate profile" height={260} />
                <ComposedChartCard title="Composed" description="Bars, line, and area" height={260} />
                <RadialChartCard
                  badge="3 stages"
                  dataCsv="Authored,100,var(--chart-1); Verified,82,var(--chart-2); Published,64,var(--chart-3)"
                  title="Radial"
                  description="Pipeline completion"
                  footerTitle="Verification trails authorship"
                  footerDescription="Custom series flow in as CSV."
                  height={260}
                />
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s07" aria-label="Status and feedback" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Status &amp; feedback</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">7 families · 054–060</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-badge" data-family="badge">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">054</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Badge</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The smallest status vocabulary — six intents in a row.</p>
              </header>
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-5">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="ghost">Ghost</Badge>
                <Badge variant="link">Link</Badge>
              </div>
            </article>

            <article id="cl-alert" data-family="alert">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">055</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Alert</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Inline notices that stay on the page, with an optional action slot.</p>
              </header>
              <div className="grid max-w-2xl gap-3">
                <Alert showIcon icon="info">
                  <AlertTitle>Ledger complete</AlertTitle>
                  <AlertDescription>All 66 families carry at least one specimen.</AlertDescription>
                </Alert>
                <Alert showIcon icon="triangle-alert">
                  <AlertTitle>Two families need a dark-mode pass</AlertTitle>
                  <AlertDescription>Chart tokens should be re-checked against the dark palette.</AlertDescription>
                  <AlertAction><Button size="sm" variant="outline">Review</Button></AlertAction>
                </Alert>
                <Alert showIcon icon="circle-x" variant="destructive">
                  <AlertTitle>Specimen failed to render</AlertTitle>
                  <AlertDescription>The source import is broken; the plate falls back to this notice.</AlertDescription>
                  <AlertAction><Button size="sm" variant="destructive">Retry</Button></AlertAction>
                </Alert>
              </div>
            </article>

            <article id="cl-progress" data-family="progress">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">056</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Progress</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Determinate completion with its label and value as parts.</p>
              </header>
              <div className="grid max-w-2xl gap-6 rounded-lg bg-muted/40 p-5 sm:grid-cols-4">
                <Progress value={0}><ProgressLabel>Queued</ProgressLabel><ProgressValue /></Progress>
                <Progress value={34}><ProgressLabel>Authoring</ProgressLabel><ProgressValue /></Progress>
                <Progress value={82}><ProgressLabel>Verifying</ProgressLabel><ProgressValue /></Progress>
                <Progress value={100}><ProgressLabel>Published</ProgressLabel><ProgressValue /></Progress>
              </div>
            </article>

            <article id="cl-skeleton" data-family="skeleton">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">057</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Skeleton</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The shape of content before the content — mirror real layout, never generic bars.</p>
              </header>
              <div className="grid max-w-2xl gap-8 rounded-lg bg-muted/40 p-5 sm:grid-cols-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-2/5" /></div>
                </div>
                <div className="space-y-2"><Skeleton className="aspect-[3/1] w-full" /><Skeleton className="h-3 w-4/5" /></div>
              </div>
            </article>

            <article id="cl-spinner" data-family="spinner">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">058</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Spinner</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Indeterminate wait, alone or inside a busy control.</p>
              </header>
              <div className="flex flex-wrap items-center gap-8 rounded-lg bg-muted/40 p-5">
                <div className="flex items-center gap-2"><Spinner className="size-3" /><span className="font-mono text-[11px] text-muted-foreground">12</span></div>
                <div className="flex items-center gap-2"><Spinner /><span className="font-mono text-[11px] text-muted-foreground">base</span></div>
                <div className="flex items-center gap-2"><Spinner className="size-6" /><span className="font-mono text-[11px] text-muted-foreground">24</span></div>
                <Button disabled><Spinner />Publishing</Button>
              </div>
            </article>

            <article id="cl-empty" data-family="empty">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">059</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Empty</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Absence as a designed state, with a way forward.</p>
              </header>
              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <Empty className="bg-muted/40">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Icon name="search" /></EmptyMedia>
                    <EmptyTitle>No family matches</EmptyTitle>
                    <EmptyDescription>Try a shorter name or browse by section.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent><Button size="sm" variant="ghost">Clear search</Button></EmptyContent>
                </Empty>
                <Empty className="bg-muted/40">
                  <EmptyHeader>
                    <EmptyMedia><Icon name="folder" size={32} /></EmptyMedia>
                    <EmptyTitle>A deliberately long empty-state title that wraps</EmptyTitle>
                    <EmptyDescription>Long copy checks balanced wrapping and action spacing on narrow plates.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent><Button className="w-full">Add the first specimen</Button></EmptyContent>
                </Empty>
              </div>
            </article>

            <article id="cl-toast" data-family="toast">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">060</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Toast</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Transient stacked messages; five status types plus an inline action.</p>
              </header>
              <div className="flex flex-wrap gap-3 rounded-lg bg-muted/40 p-5">
                <ToastTrigger toastType="success" title="Specimen published" description="The plate is live in the ledger.">
                  <Button slot="trigger" variant="outline">Success toast</Button>
                </ToastTrigger>
                <ToastTrigger toastType="info" title="Registry synced" description="66 families reconciled.">
                  <Button slot="trigger" variant="outline">Info toast</Button>
                </ToastTrigger>
                <ToastTrigger toastType="warning" title="Tokens drifted" description="Two component tokens fell out of range.">
                  <Button slot="trigger" variant="outline">Warning toast</Button>
                </ToastTrigger>
                <ToastTrigger toastType="error" title="Publish failed" description="The source contract did not verify.">
                  <Button slot="trigger" variant="destructive">Error toast</Button>
                </ToastTrigger>
                <ToastTrigger toastType="loading" title="Publishing components" description="Reconciling the component registry.">
                  <Button slot="trigger" variant="outline">Loading toast</Button>
                </ToastTrigger>
                <ToastTrigger title="Event created" description="Sunday, December 3 at 9:00 AM" actionLabel="Undo">
                  <Button slot="trigger" variant="secondary">Toast with action</Button>
                </ToastTrigger>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s08" aria-label="Conversation" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Conversation</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">4 families · 061–064</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-marker" data-family="marker">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">061</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Marker</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Timeline punctuation between messages.</p>
              </header>
              <div className="grid max-w-xl gap-5 rounded-lg bg-muted/40 p-5">
                <Marker><MarkerIcon><Icon name="sparkles" /></MarkerIcon><MarkerContent>Thread summarized</MarkerContent></Marker>
                <Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>
                <Marker variant="border"><MarkerIcon><Icon name="lock" /></MarkerIcon><MarkerContent>End-to-end encrypted</MarkerContent></Marker>
                <Marker role="status"><MarkerIcon><Spinner /></MarkerIcon><MarkerContent className="shimmer">Thinking…</MarkerContent></Marker>
                <Marker asChild><a href="#cl-marker"><MarkerIcon><Icon name="file-text" /></MarkerIcon><MarkerContent>Explored 4 files</MarkerContent></a></Marker>
                <Marker aria-label="Synced"><MarkerIcon><Icon name="check" /></MarkerIcon></Marker>
              </div>
            </article>

            <article id="cl-bubble" data-family="bubble">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">062</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Bubble</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">One utterance. Variants map to speakers; alignment maps to ownership.</p>
              </header>
              <div className="grid max-w-2xl items-start gap-4 rounded-lg bg-muted/40 p-5 pb-9 sm:grid-cols-2">
                <Bubble variant="secondary"><BubbleContent>Incoming — secondary surface.</BubbleContent></Bubble>
                <Bubble align="end"><BubbleContent>Outgoing — primary, end-aligned.</BubbleContent></Bubble>
                <Bubble variant="tinted" className="mb-4"><BubbleContent>Assistant — tinted voice. Reactions overlap the bubble corner, so the thread leaves room below.</BubbleContent><BubbleReactions align="end" side="bottom">👍 2 </BubbleReactions></Bubble>
                <Bubble variant="destructive"><BubbleContent>Not delivered.</BubbleContent></Bubble>
                <Bubble variant="muted"><BubbleContent>Muted — quiet system voice.</BubbleContent></Bubble>
                <Bubble variant="outline"><BubbleContent>Outline — bordered on the background.</BubbleContent></Bubble>
                <Bubble variant="ghost"><BubbleContent>Ghost — prose without a surface, for long-form assistant turns.</BubbleContent></Bubble>
                <BubbleGroup>
                  <Bubble variant="secondary"><BubbleContent>Grouped —</BubbleContent></Bubble>
                  <Bubble variant="secondary"><BubbleContent>consecutive bubbles</BubbleContent></Bubble>
                  <Bubble variant="secondary"><BubbleContent>share one flow.</BubbleContent></Bubble>
                </BubbleGroup>
                <Bubble variant="muted"><BubbleContent asChild><button type="button">Interactive — a bubble can be a real button or link.</button></BubbleContent></Bubble>
                <Bubble variant="outline" className="mb-4">
                  <BubbleContent>Interactive reactions render real labeled buttons.</BubbleContent>
                  <BubbleReactions align="end" side="bottom">
                    <Button aria-label="Thumbs up" variant="secondary" size="icon-xs"><Icon name="thumbs-up" /></Button>
                    <Button aria-label="Add reaction" variant="secondary" size="icon-xs"><Icon name="smile-plus" /></Button>
                  </BubbleReactions>
                </Bubble>
                <Bubble variant="secondary" className="sm:col-span-2">
                  <BubbleContent>
                    <Collapsible>
                      <p>The registry rebuild finished with all 66 families intact.</p>
                      <CollapsibleContent>Every story compiled, the prop registry reconciled without drift, and the preview snapshot was refreshed from the host project build.</CollapsibleContent>
                      <CollapsibleTrigger render={<Button variant="ghost" size="xs" className="mt-1 -ml-2" />}>Show more</CollapsibleTrigger>
                    </Collapsible>
                  </BubbleContent>
                </Bubble>
              </div>
            </article>

            <article id="cl-message" data-family="message">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">063</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Message</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Bubble plus identity: avatar, header, delivery footer.</p>
              </header>
              <MessageGroup className="max-w-xl gap-6">
                <Message>
                  <MessageAvatar><Avatar className="size-8"><AvatarFallback>RV</AvatarFallback></Avatar></MessageAvatar>
                  <MessageContent>
                    <MessageHeader>Reviewer</MessageHeader>
                    <Bubble variant="secondary"><BubbleContent>Does every family show a disabled state?</BubbleContent></Bubble>
                    <MessageFooter>09:12 · Delivered</MessageFooter>
                  </MessageContent>
                </Message>
                <Message align="end">
                  <MessageContent>
                    <MessageHeader>Claude</MessageHeader>
                    <Bubble><BubbleContent>Wherever the API exposes one — forms show invalid too.</BubbleContent></Bubble>
                    <MessageFooter>09:13 · Read</MessageFooter>
                  </MessageContent>
                  <MessageAvatar><Avatar className="size-8"><AvatarFallback>CL</AvatarFallback></Avatar></MessageAvatar>
                </Message>
                <Message align="end">
                  <MessageContent>
                    <AttachmentGroup layout="wrap" gap="sm">
                      <Attachment fileName="specimen-audit.pdf" fileMeta="PDF · 1.8 MB" iconName="file-text" state="done" />
                    </AttachmentGroup>
                    <Bubble><BubbleContent>Attachments ride inside the content column.</BubbleContent></Bubble>
                    <MessageFooter>09:14 · Delivered</MessageFooter>
                  </MessageContent>
                </Message>
                <Message>
                  <MessageAvatar><Avatar className="size-8"><AvatarFallback>CL</AvatarFallback></Avatar></MessageAvatar>
                  <MessageContent>
                    <Bubble variant="ghost"><BubbleContent>Assistant turns drop the surface and keep the actions: copy, retry, and feedback live in the footer.</BubbleContent></Bubble>
                    <MessageFooter>
                      <Button variant="ghost" size="icon-xs" aria-label="Copy"><Icon name="copy" /></Button>
                      <Button variant="ghost" size="icon-xs" aria-label="Retry"><Icon name="refresh-cw" /></Button>
                      <Button variant="ghost" size="icon-xs" aria-label="Good response"><Icon name="thumbs-up" /></Button>
                      <Button variant="ghost" size="icon-xs" aria-label="Bad response"><Icon name="thumbs-down" /></Button>
                    </MessageFooter>
                  </MessageContent>
                </Message>
                <Message>
                  <MessageAvatar />
                  <MessageContent><Bubble variant="secondary"><BubbleContent>Same-sender turns stack in one group.</BubbleContent></Bubble></MessageContent>
                </Message>
                <Message className="-mt-4">
                  <MessageAvatar><Avatar className="size-8"><AvatarFallback>RV</AvatarFallback></Avatar></MessageAvatar>
                  <MessageContent><Bubble variant="secondary"><BubbleContent>An empty MessageAvatar keeps the earlier rows aligned with the avatar on the last one.</BubbleContent></Bubble></MessageContent>
                </Message>
              </MessageGroup>
            </article>

            <article id="cl-message-scroller" data-family="message-scroller">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">064</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Message Scroller</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Reader-controlled transcript patterns: reopen at the last turn, follow the live edge, and anchor group handoffs.</p>
              </header>
              <div className="grid min-w-0 gap-4 lg:grid-cols-3">
                <Card className="relative h-[35rem] min-w-0 gap-0 overflow-hidden py-0">
                  <CardHeader className="gap-1 border-b px-5 py-4">
                    <CardTitle>New Chat</CardTitle>
                    <CardDescription>How can I help you today?</CardDescription>
                  </CardHeader>
                  <CardContent className="relative min-h-0 flex-1 overflow-hidden p-0">
                    <MessageScroller defaultScrollPosition="start" className="h-full">
                      <MessageScrollerViewport className="px-5 py-5">
                        <MessageScrollerContent className="gap-6 pb-16">
                          <MessageScrollerItem messageId="catalog-scroll-1" scrollAnchor>
                            <Message align="end"><MessageContent><Bubble variant="muted"><BubbleContent>I'm building a chat for our app and the scroll behavior is driving me nuts. Every streamed reply makes the whole thread jump.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-2">
                            <Message><MessageContent><Bubble variant="ghost"><BubbleContent>Wrap the transcript in MessageScroller. It preserves the reader's position and follows new output only while they remain at the live edge.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-3" scrollAnchor>
                            <Message align="end"><MessageContent><Bubble variant="muted"><BubbleContent>What happens when I scroll upward to read an earlier answer?</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-4">
                            <Message><MessageContent><Bubble variant="ghost"><BubbleContent>That movement is treated as reader intent. Auto-follow pauses, new content may arrive offscreen, and the jump button offers a deliberate return to the latest turn.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-5" scrollAnchor>
                            <Message align="end"><MessageContent><Bubble variant="muted"><BubbleContent>Can older history load above without moving the paragraph I'm reading?</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-6">
                            <Message><MessageContent><Bubble variant="ghost"><BubbleContent>Yes. Prepended rows preserve the visible message boundary, so the transcript grows upward while the current reading position stays stable.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-7" scrollAnchor>
                            <Message align="end"><MessageContent><Bubble variant="muted"><BubbleContent>Keep the composer visible while I inspect the long transcript.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="catalog-scroll-8">
                            <Message><MessageContent><Bubble variant="ghost"><BubbleContent>The transcript now scrolls inside the frame. Its lower edge fades behind the stationary composer instead of ending at a hard divider.</BubbleContent></Bubble></MessageContent></Message>
                          </MessageScrollerItem>
                        </MessageScrollerContent>
                      </MessageScrollerViewport>
                      <MessageScrollerButton direction="start" variant="outline" />
                      <MessageScrollerButton className="data-[direction=end]:bottom-6" direction="end" />
                    </MessageScroller>
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-[linear-gradient(to_bottom,transparent_0%,var(--card)_100%)]" />
                  </CardContent>
                  <CardFooter className="relative z-20 border-t-0 bg-transparent p-4 pt-0">
                    <InputGroup className="h-auto min-h-24 rounded-2xl border-transparent bg-muted dark:bg-muted">
                      <div className="min-h-14 w-full px-3 py-2.5 text-sm leading-relaxed">Okay, but when someone sends a new message the view still feels jarring — like the whole…</div>
                      <InputGroupAddon align="block-end" className="pt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Add files" className="rounded-full" render={<InputGroupButton className="rounded-full" size="icon-sm" type="button" variant="outline" />} size="icon-sm" variant="outline"><Icon name="plus" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56" side="top" sideOffset={8}>
                            <DropdownMenuItem><Icon name="paperclip" />Add photos &amp; files</DropdownMenuItem>
                            <DropdownMenuItem><Icon name="image" />Create image</DropdownMenuItem>
                            <DropdownMenuItem><Icon name="globe" />Web search</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <InputGroupButton aria-label="Send" className="ml-auto rounded-full" size="icon-sm" type="button" variant="default"><Icon name="arrow-up" /></InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </CardFooter>
                </Card>

                  <Card className="h-[35rem] min-w-0 gap-0 overflow-hidden py-0">
                    <CardHeader className="gap-1 border-b px-4 py-3">
                      <CardTitle className="text-sm">Following the live edge</CardTitle>
                      <CardDescription>Stream only while the reader stays at the end.</CardDescription>
                      <CardAction><Badge variant="secondary">autoScroll</Badge></CardAction>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 p-0">
                      <MessageScroller autoScroll defaultScrollPosition="end" className="h-full">
                        <MessageScrollerViewport className="px-4 py-4">
                          <MessageScrollerContent aria-busy className="gap-4 pb-7">
                            <MessageScrollerItem messageId="stream-question" scrollAnchor>
                              <Message align="end"><MessageContent><Bubble><BubbleContent>Summarize launch readiness.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="stream-answer">
                              <Message>
                                <MessageContent>
                                  <MessageHeader>Assistant · streaming</MessageHeader>
                                  <Bubble variant="secondary"><BubbleContent>Core checks are green. One accessibility pass and a mobile viewport review remain…</BubbleContent></Bubble>
                                </MessageContent>
                              </Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem animation="spring-bounce" messageId="stream-follow-up" scrollAnchor>
                              <Message align="end"><MessageContent><Bubble><BubbleContent>Which check should the team run next?</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="stream-detail">
                              <Message><MessageContent><MessageHeader>Assistant</MessageHeader><Bubble variant="secondary"><BubbleContent>Run the keyboard navigation pass, then confirm the compact viewport before release.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="stream-ready">
                              <Message align="end"><MessageContent><Bubble><BubbleContent>I’ll send the result back to this thread.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="stream-status">
                              <Marker><MarkerIcon><Spinner /></MarkerIcon><MarkerContent>Following new output</MarkerContent></Marker>
                            </MessageScrollerItem>
                          </MessageScrollerContent>
                        </MessageScrollerViewport>
                        <MessageScrollerButton direction="start" variant="outline" />
                        <MessageScrollerButton direction="end" />
                      </MessageScroller>
                    </CardContent>
                  </Card>

                  <Card className="h-[35rem] min-w-0 gap-0 overflow-hidden py-0">
                    <CardHeader className="gap-1 border-b px-4 py-3">
                      <CardTitle className="text-sm">Group handoff</CardTitle>
                      <CardDescription>A marker can define the next turn boundary.</CardDescription>
                      <CardAction><Badge variant="outline">marker anchor</Badge></CardAction>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 p-0">
                      <MessageScroller defaultScrollPosition="last-anchor" scrollPreviousItemPeek={32} className="h-full">
                        <MessageScrollerViewport className="px-4 py-4">
                          <MessageScrollerContent className="gap-4 pb-7">
                            <MessageScrollerItem messageId="group-question">
                              <Message align="end"><MessageContent><Bubble><BubbleContent>@Mina, verify the release window.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="group-answer">
                              <Message><MessageContent><MessageHeader>Mina</MessageHeader><Bubble variant="secondary"><BubbleContent>The window is clear after 14:00 UTC.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="group-handoff" scrollAnchor>
                              <Marker variant="separator"><MarkerContent>Sam joined and took the handoff</MarkerContent></Marker>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="group-confirmation">
                              <Message><MessageContent><MessageHeader>Sam</MessageHeader><Bubble variant="tinted"><BubbleContent>I have the checklist and will post status here.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="group-next-step">
                              <Message align="end"><MessageContent><Bubble><BubbleContent>Please tag the release owner when the final check lands.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                            <MessageScrollerItem messageId="group-status">
                              <Message><MessageContent><MessageHeader>Release owner</MessageHeader><Bubble variant="secondary"><BubbleContent>Acknowledged. I’m watching the final verification window.</BubbleContent></Bubble></MessageContent></Message>
                            </MessageScrollerItem>
                          </MessageScrollerContent>
                        </MessageScrollerViewport>
                        <MessageScrollerButton direction="start" variant="outline" />
                        <MessageScrollerButton direction="end" />
                      </MessageScroller>
                    </CardContent>
                  </Card>
              </div>
            </article>
          </div>
        </section>

        <section id="cl-s09" aria-label="Shell and structure" className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-1 border-muted pt-6">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Shell &amp; structure</h2>
            <span className="ml-auto font-mono text-xs text-muted-foreground">2 families · 065–066</span>
          </div>

          <div className="mt-6 grid divide-y divide-border/60 [&>article]:grid [&>article]:min-w-0 [&>article]:scroll-mt-24 [&>article]:gap-6 [&>article]:py-10 xl:[&>article]:grid-cols-[15rem_minmax(0,1fr)] xl:[&>article]:gap-12">
            <article id="cl-resizable" data-family="resizable">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">065</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Resizable</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">User-owned space: draggable splits in either axis.</p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-40 min-w-0">
                  <ResizableSplit className="overflow-hidden rounded-lg bg-muted/40" withHandle>
                    <ResizablePanel defaultSize={60}><div className="flex h-full items-center justify-center font-mono text-xs">canvas · 60</div></ResizablePanel>
                    <ResizablePanel defaultSize={40}><div className="flex h-full items-center justify-center bg-muted/60 font-mono text-xs text-muted-foreground">inspector · 40</div></ResizablePanel>
                  </ResizableSplit>
                </div>
                <div className="h-40 min-w-0">
                  <ResizableSplit className="overflow-hidden rounded-lg bg-muted/40" orientation="vertical" withHandle>
                    <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center font-mono text-xs">top · 50</div></ResizablePanel>
                    <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center bg-muted/60 font-mono text-xs text-muted-foreground">bottom · 50</div></ResizablePanel>
                  </ResizableSplit>
                </div>
              </div>
            </article>

            <article id="cl-sidebar" data-family="sidebar">
              <header>
                <p className="font-mono text-[11px] text-muted-foreground/70">066</p>
                <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">Sidebar</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">The largest family — 24 parts of app chrome. One contained shell: brand, search, nested menu, badge, rail, inset.</p>
              </header>
              <SidebarProvider contained className="relative min-h-[28rem] overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                <Sidebar resizable={true} collapsible="icon" contained className="h-[28rem]">
                  <SidebarHeader>
                    <SidebarBrand>
                      <SidebarBrandMark variant="framed"><Icon name="blocks" /></SidebarBrandMark>
                      <SidebarBrandContent>
                        <p className="text-xs text-muted-foreground">Workspace</p>
                        <p className="font-semibold">Component Ledger</p>
                      </SidebarBrandContent>
                    </SidebarBrand>
                    <SidebarInput placeholder="Search 66 families" />
                  </SidebarHeader>
                  <SidebarSeparator />
                  <SidebarContent>
                    <SidebarGroup>
                      <SidebarGroupLabel>Sections</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          <SidebarMenuItem>
                            <SidebarMenuButton isActive tooltip="Families">
                              <SidebarMenuButtonPersistent><Icon name="layout-grid" /></SidebarMenuButtonPersistent>
                              <SidebarMenuButtonContent>Families</SidebarMenuButtonContent>
                            </SidebarMenuButton>
                            <SidebarMenuBadge>66</SidebarMenuBadge>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem><SidebarMenuSubButton>Foundations</SidebarMenuSubButton></SidebarMenuSubItem>
                              <SidebarMenuSubItem><SidebarMenuSubButton isActive>Overlays</SidebarMenuSubButton></SidebarMenuSubItem>
                            </SidebarMenuSub>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Tokens">
                              <SidebarMenuButtonPersistent><Icon name="palette" /></SidebarMenuButtonPersistent>
                              <SidebarMenuButtonContent>Tokens</SidebarMenuButtonContent>
                            </SidebarMenuButton>
                            <SidebarMenuBadge>9</SidebarMenuBadge>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </SidebarContent>
                  <SidebarFooter>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="p-1" tooltip="Account">
                          <SidebarMenuButtonPersistent><Avatar size="sm"><AvatarFallback>TM</AvatarFallback></Avatar></SidebarMenuButtonPersistent>
                          <SidebarMenuButtonContent>Tom</SidebarMenuButtonContent>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarFooter>
                  <SidebarRail />
                </Sidebar>
                <SidebarInset className="min-h-[28rem] overflow-hidden bg-background">
                  <header className="flex h-14 shrink-0 items-center gap-3 px-4">
                    <SidebarTrigger />
                    <Separator className="h-5" orientation="vertical" />
                    <div>
                      <p className="text-sm font-medium">Ledger workspace</p>
                      <p className="text-xs text-muted-foreground">Collapse the rail — the shell answers.</p>
                    </div>
                  </header>
                  <div className="grid flex-1 content-start gap-4 bg-muted/30 p-4 sm:grid-cols-2">
                    <Card className="bg-background" size="sm">
                      <CardHeader><CardTitle>Coverage</CardTitle><CardDescription>Families with live specimens.</CardDescription></CardHeader>
                      <CardContent><Progress value={100}><ProgressValue /></Progress></CardContent>
                    </Card>
                    <Card className="bg-background" size="sm">
                      <CardHeader><CardTitle>Mode</CardTitle><CardDescription>Shell inherits the page scope.</CardDescription></CardHeader>
                      <CardContent><div className="flex items-center gap-2"><Badge variant="outline">auto</Badge><Badge variant="secondary">tokens</Badge></div></CardContent>
                    </Card>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </article>
          </div>
        </section>

        <footer className="border-foreground pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">066 / 066 families · composed by Claude</p>
            <a className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="#cl-top">Back to index ↑</a>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every specimen on this page is live project source, editable in Workbench, and styled exclusively through
            semantic tokens — switch the app to dark mode and the ledger follows.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Some examples on this page are adapted from the{' '}
            <a className="underline underline-offset-4 hover:text-foreground" href="https://ui.shadcn.com/docs/components/base/message-scroller" rel="noreferrer" target="_blank">official shadcn/ui component documentation</a>.
          </p>
        </footer>
      </div>
    </Theme>
  )
}
