export type SourceChildrenSlotKind = 'block' | 'inline';

const SOURCE_SHADCN_BLOCK_SLOT_CONTAINER_NAMES = [
  'Accordion',
  'AccordionContent',
  'AccordionItem',
  'AccordionPanel',
  'Alert',
  'AlertDialog',
  'AlertDialogContent',
  'AlertDialogFooter',
  'AlertDialogHeader',
  'AspectRatio',
  'Attachment',
  'AttachmentActions',
  'AttachmentContent',
  'AttachmentGroup',
  'Avatar',
  'AvatarGroup',
  'Breadcrumb',
  'BreadcrumbItem',
  'BreadcrumbList',
  'Bubble',
  'BubbleGroup',
  'ButtonGroup',
  'Card',
  'CardContent',
  'CardFooter',
  'CardHeader',
  'Carousel',
  'CarouselCards',
  'CarouselContent',
  'CarouselItem',
  'CarouselSlide',
  'Collapsible',
  'CollapsibleContent',
  'Command',
  'CommandDialog',
  'CommandGroup',
  'CommandItem',
  'CommandList',
  'CommandOption',
  'CommandSection',
  'Combobox',
  'ComboboxChips',
  'ComboboxCollection',
  'ComboboxContent',
  'ComboboxGroup',
  'ComboboxItem',
  'ComboboxList',
  'ComboboxOption',
  'ComboboxSection',
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuRadioGroup',
  'ContextMenuRadioSection',
  'ContextMenuSub',
  'ContextMenuSubContent',
  'ContextMenuSubmenu',
  'Dialog',
  'DialogContent',
  'DialogFooter',
  'DialogHeader',
  'DialogPreset',
  'Drawer',
  'DrawerContent',
  'DrawerFooter',
  'DrawerHeader',
  'DropdownMenu',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioSection',
  'DropdownMenuSub',
  'DropdownMenuSubContent',
  'DropdownMenuSubmenu',
  'Empty',
  'EmptyContent',
  'EmptyHeader',
  'Field',
  'FieldContent',
  'FieldGroup',
  'FieldLabel',
  'FieldSet',
  'HoverCard',
  'HoverCardContent',
  'InputGroup',
  'InputGroupAddon',
  'InputOTP',
  'InputOTPDigitGroup',
  'InputOTPGroup',
  'Item',
  'ItemActions',
  'ItemContent',
  'ItemFooter',
  'ItemGroup',
  'ItemHeader',
  'KbdGroup',
  'Marker',
  'Menubar',
  'MenubarContent',
  'MenubarGroup',
  'MenubarMenu',
  'MenubarRadioGroup',
  'MenubarRadioSection',
  'MenubarSub',
  'MenubarSubContent',
  'MenubarSubmenu',
  'Message',
  'MessageContent',
  'MessageGroup',
  'MessageScroller',
  'MessageScrollerContent',
  'MessageScrollerItem',
  'MessageScrollerViewport',
  'NativeSelect',
  'NativeSelectOptGroup',
  'NavigationMenu',
  'NavigationMenuContent',
  'NavigationMenuItem',
  'NavigationMenuPanelItem',
  'NavigationMenuList',
  'Pagination',
  'PaginationContent',
  'PaginationItem',
  'Popover',
  'PopoverContent',
  'PopoverHeader',
  'Progress',
  'RadioGroup',
  'RadioGroupOption',
  'ResizablePanel',
  'ResizablePanelGroup',
  'ResizableSplit',
  'ScrollArea',
  'Select',
  'SelectContent',
  'SelectGroup',
  'Sheet',
  'SheetContent',
  'SheetFooter',
  'SheetHeader',
  'Sidebar',
  'SidebarBrand',
  'SidebarBrandContent',
  'SidebarContent',
  'SidebarFooter',
  'SidebarGroup',
  'SidebarGroupContent',
  'SidebarHeader',
  'SidebarInset',
  'SidebarMenu',
  'SidebarMenuItem',
  'SidebarMenuSub',
  'SidebarMenuSubItem',
  'SidebarProvider',
  'Table',
  'TableBody',
  'TableCell',
  'TableFooter',
  'TableHead',
  'TableHeader',
  'TableRow',
  'Tabs',
  'TabsContent',
  'TabsList',
  'TabsPane',
  'ToggleGroup',
  'Tooltip',
  'TooltipContent',
  'TooltipProvider',
] as const;

const SOURCE_SHADCN_INLINE_SLOT_CONTAINER_NAMES = [
  'AccordionTrigger',
  'AlertAction',
  'AlertDescription',
  'AlertDialogAction',
  'AlertDialogCancel',
  'AlertDialogDescription',
  'AlertDialogMedia',
  'AlertDialogTitle',
  'AlertDialogTrigger',
  'AlertTitle',
  'AttachmentAction',
  'AttachmentDescription',
  'AttachmentMedia',
  'AttachmentTitle',
  'AttachmentTrigger',
  'AvatarBadge',
  'AvatarFallback',
  'AvatarGroupCount',
  'Badge',
  'BreadcrumbEllipsis',
  'BreadcrumbLink',
  'BreadcrumbPage',
  'BubbleContent',
  'BubbleReactions',
  'Button',
  'ButtonGroupText',
  'CardAction',
  'CardDescription',
  'CardTitle',
  'CarouselCardItem',
  'CarouselNext',
  'CarouselPrevious',
  'CollapsibleTrigger',
  'CommandEmpty',
  'CommandShortcut',
  'ComboboxChip',
  'ComboboxEmpty',
  'ComboboxLabel',
  'ComboboxTrigger',
  'ComboboxValue',
  'ContextMenuCheckboxItem',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuRadioItem',
  'ContextMenuShortcut',
  'ContextMenuSubTrigger',
  'ContextMenuTrigger',
  'DialogClose',
  'DialogDescription',
  'DialogMedia',
  'DialogTitle',
  'DialogTrigger',
  'DrawerClose',
  'DrawerDescription',
  'DrawerTitle',
  'DrawerTrigger',
  'DropdownMenuCheckboxItem',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuRadioItem',
  'DropdownMenuShortcut',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
  'EmptyDescription',
  'EmptyMedia',
  'EmptyTitle',
  'FieldDescription',
  'FieldError',
  'FieldLegend',
  'FieldSeparator',
  'FieldTitle',
  'HoverCardTrigger',
  'InputGroupButton',
  'InputGroupText',
  'ItemDescription',
  'ItemMedia',
  'ItemTitle',
  'Kbd',
  'Label',
  'MarkerContent',
  'MarkerIcon',
  'MenubarCheckboxItem',
  'MenubarItem',
  'MenubarLabel',
  'MenubarRadioItem',
  'MenubarShortcut',
  'MenubarSubTrigger',
  'MenubarTrigger',
  'MessageAvatar',
  'MessageFooter',
  'MessageHeader',
  'MessageScrollerButton',
  'NativeSelectOption',
  'NavigationMenuLink',
  'NavigationMenuLinkItem',
  'NavigationMenuTrigger',
  'PaginationEllipsis',
  'PaginationLink',
  'PaginationNext',
  'PaginationPrevious',
  'PopoverDescription',
  'PopoverTitle',
  'PopoverTrigger',
  'ProgressLabel',
  'ProgressValue',
  'SelectItem',
  'SelectLabel',
  'SelectTrigger',
  'SelectValue',
  'SheetClose',
  'SheetDescription',
  'SheetTitle',
  'SheetTrigger',
  'SidebarBrandMark',
  'SidebarGroupAction',
  'SidebarGroupLabel',
  'SidebarMenuAction',
  'SidebarMenuBadge',
  'SidebarMenuButton',
  'SidebarMenuButtonContent',
  'SidebarMenuButtonPersistent',
  'SidebarMenuSubButton',
  'SidebarTrigger',
  'SidebarTriggerCollapsedIcon',
  'SidebarTriggerExpandedIcon',
  'Spinner',
  'TableCaption',
  'TabsTrigger',
  'Toggle',
  'ToggleGroupItem',
  'TooltipTrigger',
] as const;

export const SOURCE_COMPONENT_BLOCK_SLOT_CONTAINER_NAMES = new Set([
  'Fragment',
  'FactfulnessQuizCountryInsights',
  'FactfulnessQuizIntro',
  'FactfulnessQuizIntroContent',
  'FactfulnessQuizIntroLayout',
  'FactfulnessQuizIntroStat',
  'FactfulnessQuizIntroStats',
  'FactfulnessQuizOptions',
  'FactfulnessQuizOption',
  'FactfulnessQuizProvider',
  'FactfulnessQuizQuestion',
  'FactfulnessQuizQuestionHeader',
  'FactfulnessQuizScore',
  'FactfulnessQuizScoreFacts',
  'FactfulnessQuizScoreFactContent',
  'FactfulnessQuizScoreFactItem',
  'FactfulnessQuizScoreSummary',
  'FactfulnessQuizCountryIntro',
  'FactfulnessQuizCountryPersonalScore',
  'FactfulnessQuizCountryRow',
  'FactfulnessQuizCountryRowHead',
  'FactfulnessQuizCountryRows',
  'AstryxTable',
  'AstryxTableBody',
  'AstryxTableFooter',
  'AstryxTableHeader',
  'AstryxTableRow',
  'WbdsFlickingPage',
  'WbdsFlickingPages',
  'WbdsText',
  'WorkbenchCard',
  ...SOURCE_SHADCN_BLOCK_SLOT_CONTAINER_NAMES,
]);

export const SOURCE_COMPONENT_INLINE_SLOT_CONTAINER_NAMES = new Set<string>([
  ...SOURCE_SHADCN_INLINE_SLOT_CONTAINER_NAMES,
  'AstryxTableCell',
  'AstryxTableHead',
]);

/**
 * Runtime-populated registry that maps a JSX element name to the children slot
 * kind inferred from its component source. The import flow records whether an
 * exported component renders `children`, and project load replays that source
 * fact here so layer actions and source writeback make the same decision.
 */
type RegisteredSourceSlotContract = {
  kind: SourceChildrenSlotKind | null;
  preserveKnownChildContract: boolean;
};

const REGISTERED_SLOT_KINDS = new Map<string, RegisteredSourceSlotContract>();

export type DeclaredSourceSlotKind = SourceChildrenSlotKind | 'leaf';

export function registerSourceSlotKind(
  elementName: string,
  kind: DeclaredSourceSlotKind | null,
  options?: { preserveKnownChildContract?: boolean },
): void {
  if (!elementName) return;
  if (kind === null) {
    REGISTERED_SLOT_KINDS.delete(elementName);
    return;
  }
  REGISTERED_SLOT_KINDS.set(elementName, {
    kind: kind === 'leaf' ? null : kind,
    preserveKnownChildContract: options?.preserveKnownChildContract === true,
  });
}

export function clearRegisteredSourceSlotKinds(): void {
  REGISTERED_SLOT_KINDS.clear();
}

/**
 * Runtime-populated child allowlists declared by a component's CSF story
 * (`meta.authoring.allowedChildren`). A declared allowlist is a strict
 * contract: the parent accepts exactly those component children and no raw
 * HTML templates, matching how the Workbench-owned strict map behaves.
 *
 * This is the project-authored path. Without it the only way to constrain a
 * container is to hand-edit the maps below, so every locally imported design
 * system falls through to "a block slot accepts anything".
 */
const REGISTERED_CHILD_ALLOWLISTS = new Map<string, Set<string>>();

export function registerSourceChildAllowlist(
  elementName: string,
  allowedChildren: readonly string[] | null,
): void {
  if (!elementName) return;
  const names = (allowedChildren ?? []).filter((name) => Boolean(name && name.trim()));
  if (names.length === 0) {
    REGISTERED_CHILD_ALLOWLISTS.delete(elementName);
    return;
  }
  REGISTERED_CHILD_ALLOWLISTS.set(elementName, new Set(names));
}

export function clearRegisteredSourceChildAllowlists(): void {
  REGISTERED_CHILD_ALLOWLISTS.clear();
}

/**
 * Story-declared allowlists win over the Workbench-owned strict map so a
 * project can correct or extend a bundled contract from its own source
 * without waiting on an app release.
 */
function getStrictSourceChildAllowlist(elementName: string): Set<string> | null {
  return REGISTERED_CHILD_ALLOWLISTS.get(elementName) ??
    SOURCE_COMPONENT_STRICT_CHILD_ALLOWLIST.get(elementName) ??
    null;
}

function getRegisteredSlotKind(elementName: string): ({
  kind: SourceChildrenSlotKind | null;
  preserveKnownChildContract: boolean;
  registered: true;
} | { registered: false }) {
  if (!REGISTERED_SLOT_KINDS.has(elementName)) return { registered: false };
  const contract = REGISTERED_SLOT_KINDS.get(elementName);
  return {
    kind: contract?.kind ?? null,
    preserveKnownChildContract: contract?.preserveKnownChildContract === true,
    registered: true,
  };
}

export function hasRegisteredSourceSlotContract(elementName: string): boolean {
  return getRegisteredSlotKind(elementName).registered;
}

export const SOURCE_HTML_TEXT_CONTAINER_TAG_NAMES = new Set([
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'legend',
  'i',
  'ins',
  'kbd',
  'mark',
  'p',
  'pre',
  'q',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
]);

export const SOURCE_HTML_INTERACTIVE_INLINE_CONTAINER_TAG_NAMES = new Set([
  'a',
  'button',
  'summary',
]);

export const SOURCE_INLINE_CHILD_TEMPLATE_IDS = new Set([
  'abbr',
  'bold',
  'bdi',
  'bdo',
  'span',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'definition',
  'deleted',
  'emphasis',
  'inserted',
  'italic',
  'keyboard',
  'link',
  'mark',
  'quote',
  'ruby',
  'sample',
  'small',
  'strikethrough',
  'subscript',
  'superscript',
  'time',
  'underline',
  'variable',
  'wbr',
  'image',
  'svg',
  'icon',
]);

const SOURCE_MEDIA_CHILD_TEMPLATE_IDS = new Set([
  'image',
  'svg',
  'icon',
]);

const SOURCE_COMPONENT_MEDIA_CHILD_SLOT_NAMES = new Set([
  'AlertDialogMedia',
  'AttachmentMedia',
  'EmptyMedia',
  'ItemMedia',
]);

const SOURCE_EXACT_MEDIA_CHILD_NAMES = new Set([
  'Avatar',
  'AvatarGroup',
  'Icon',
  'Spinner',
  'WbdsIcon',
  'WbdsSpinner',
  'img',
  'picture',
  'svg',
]);

/**
 * Components whose rendered root is inline-level (span/a), so they can sit
 * inside text-flow slots without breaking the line box.
 * Inline icons are the canonical case — an Icon inside a Text run inherits
 * currentColor and participates in truncation, unlike a block drop-in.
 */
export const SOURCE_COMPONENT_INLINE_CHILD_NAMES = new Set([
  'WbdsBadge',
  'WbdsButton',
  'WbdsCaption',
  'WbdsChip',
  'WbdsEyebrow',
  'WbdsIcon',
  'WbdsIconButton',
  'WbdsSpinner',
  'WbdsTag',
  'WbdsBadge',
  'WbdsCaption',
  'WbdsChip',
  'WbdsEyebrow',
  'WbdsIcon',
  'WbdsTag',
  'WbdsTypingKeyword',
  'WbdsVerifiedDot',
  ...SOURCE_SHADCN_INLINE_SLOT_CONTAINER_NAMES,
]);

const SOURCE_COMPONENT_INLINE_CHILD_BASE_NAMES = new Set([
  'Badge',
  'Icon',
  'Kbd',
  'Spinner',
  'StatusDot',
  'Token',
]);

const SOURCE_COMPONENT_STRICT_CHILD_ALLOWLIST = new Map<string, Set<string>>([
  ['AstryxAlertDialog', new Set(['AstryxLayout'])],
  ['AstryxChat', new Set([
    'AstryxChatMessage',
    'AstryxChatSystemMessage',
    'AstryxChatComposer',
  ])],
  ['AstryxChatComposer', new Set([
    'AstryxChatComposerDrawer',
    'AstryxChatComposerInput',
    'AstryxChatComposerSlot',
    'AstryxChatDictationButton',
    'AstryxChatSendButton',
    'AstryxButton',
    'AstryxIconButton',
  ])],
  ['AstryxChatComposerDrawer', new Set([
    'AstryxChatComposerFeedback',
    'AstryxChatComposerTokenElement',
    'AstryxStack',
    'AstryxVStack',
    'AstryxHStack',
    'AstryxCarousel',
    'AstryxList',
    'AstryxToken',
    'AstryxBadge',
    'AstryxThumbnail',
    'AstryxText',
  ])],
  ['AstryxChatComposerFeedback', new Set([
    'AstryxChatComposerFeedbackOption',
  ])],
  ['AstryxChatComposerInput', new Set([
    'AstryxChatComposerSuggestion',
  ])],
  ['AstryxChatComposerSlot', new Set([
    'AstryxIconButton',
    'AstryxButton',
    'AstryxProgressBar',
    'AstryxText',
    'AstryxBadge',
    'AstryxToken',
  ])],
  ['AstryxChatLayout', new Set([
    'AstryxChatMessageList',
    'AstryxChatLayoutScrollButton',
    'AstryxChatComposer',
  ])],
  ['AstryxChatMessage', new Set([
    'AstryxChatMessageBubble',
    'AstryxChatToolCalls',
    'AstryxChatMessageMetadata',
    'AstryxChatTokenizedText',
    'AstryxMarkdown',
    'AstryxCode',
    'AstryxCodeBlock',
  ])],
  ['AstryxChatMessageBubble', new Set([
    'AstryxChatTokenizedText',
    'AstryxText',
    'AstryxMarkdown',
    'AstryxCode',
    'AstryxCodeBlock',
    'AstryxLink',
  ])],
  ['AstryxChatMessageList', new Set([
    'AstryxChatMessage',
    'AstryxChatSystemMessage',
  ])],
  ['AstryxChatMessageMetadata', new Set([
    'AstryxIconButton',
    'AstryxButton',
    'AstryxText',
    'AstryxBadge',
    'AstryxLink',
  ])],
  ['AstryxChatToolCall', new Set([
    'AstryxCodeBlock',
    'AstryxCode',
    'AstryxMarkdown',
    'AstryxText',
    'AstryxBadge',
  ])],
  ['AstryxChatToolCalls', new Set(['AstryxChatToolCall'])],
  ['AstryxCommandPalette', new Set([
    'AstryxButton',
    'AstryxCommandPaletteInput',
    'AstryxCommandPaletteFooter',
  ])],
  ['AstryxContextMenu', new Set(['AstryxDropdownMenuItem', 'AstryxDivider'])],
  ['AstryxDateRangeInput', new Set(['AstryxDateRangePreset'])],
  ['AstryxDialog', new Set(['AstryxLayout'])],
  ['AstryxLightbox', new Set(['AstryxThumbnail'])],
  ['AstryxList', new Set(['AstryxListItem'])],
  ['AstryxMobileNav', new Set(['AstryxMobileNavTrigger', 'AstryxSideNavItem', 'AstryxSideNavSection'])],
  ['AstryxMobileNavTrigger', new Set(['AstryxButton'])],
  ['AstryxMoreMenu', new Set(['AstryxDropdownMenuItem', 'AstryxDivider'])],
  ['AstryxNavHeadingMenu', new Set(['AstryxNavHeadingMenuItem', 'AstryxDivider'])],
  ['AstryxOutline', new Set(['AstryxOutlineItem'])],
  ['AstryxOverlay', new Set(['AstryxOverlayMedia', 'AstryxOverlayContent'])],
  ['AstryxOverflowList', new Set(['AstryxButton'])],
  ['AstryxPagination', new Set([
    'AstryxPaginationPageSize',
    'AstryxPaginationButton',
    'AstryxPaginationIndicator',
  ])],
  ['AstryxPowerSearch', new Set(['AstryxPowerSearchInput', 'AstryxPowerSearchMenu'])],
  ['AstryxPowerSearchMenu', new Set(['AstryxPowerSearchItem'])],
  ['AstryxPowerSearchItem', new Set(['AstryxPowerSearchEditor'])],
  ['AstryxPowerSearchField', new Set(['AstryxPowerSearchOption', 'AstryxPowerSearchEditor'])],
  ['AstryxPowerSearchEditor', new Set([
    'AstryxPowerSearchFieldControl',
    'AstryxPowerSearchOperatorControl',
    'AstryxPowerSearchValueControl',
    'AstryxPowerSearchActions',
  ])],
  ['AstryxPowerSearchFieldControl', new Set(['AstryxPowerSearchFieldOption'])],
  ['AstryxPowerSearchOperatorControl', new Set(['AstryxPowerSearchOperatorOption'])],
  ['AstryxPowerSearchActions', new Set(['AstryxPowerSearchAction'])],
  ['AstryxPowerSearchValueControl', new Set(['AstryxPowerSearchOption'])],
  ['AstryxResizable', new Set(['AstryxResizablePanel', 'AstryxResizableContent'])],
  ['AstryxStepper', new Set(['AstryxStepperRail'])],
  ['AstryxStepperRail', new Set(['AstryxStepperItem'])],
  ['AstryxTokenizer', new Set(['AstryxTokenizerItem'])],
  ['AstryxTreeList', new Set(['AstryxTreeListItem'])],
  ['AstryxTreeListItem', new Set(['AstryxTreeListItem'])],
  ['AstryxToast', new Set(['AstryxToastBody', 'AstryxToastActions'])],
  ['AstryxTypeahead', new Set(['AstryxSearchItem'])],
]);

const SOURCE_COMPONENT_CHILD_ALLOWLIST = new Map<string, Set<string>>([
  ['Alert', new Set(['AlertTitle', 'AlertDescription', 'AlertAction'])],
  ['AlertDialog', new Set(['AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])],
  ['AlertDialogContent', new Set(['AlertDialogHeader', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])],
  ['AlertDialogHeader', new Set(['AlertDialogMedia', 'AlertDialogTitle', 'AlertDialogDescription'])],
  ['AlertDialogFooter', new Set(['AlertDialogCancel', 'AlertDialogAction', 'Button'])],
  ['Accordion', new Set(['AccordionPanel', 'AccordionItem'])],
  ['AccordionItem', new Set(['AccordionTrigger', 'AccordionContent'])],
  ['AttachmentGroup', new Set(['Attachment'])],
  ['Attachment', new Set(['AttachmentMedia', 'AttachmentContent', 'AttachmentActions', 'AttachmentTrigger'])],
  ['AttachmentContent', new Set(['AttachmentTitle', 'AttachmentDescription'])],
  ['AttachmentActions', new Set(['AttachmentAction', 'Button'])],
  ['Avatar', new Set(['AvatarImage', 'AvatarFallback', 'AvatarBadge'])],
  ['AvatarGroup', new Set(['Avatar', 'AvatarGroupCount'])],
  ['Breadcrumb', new Set(['BreadcrumbLink', 'BreadcrumbPage'])],
  ['BreadcrumbList', new Set(['BreadcrumbItem', 'BreadcrumbSeparator'])],
  ['BreadcrumbItem', new Set(['BreadcrumbLink', 'BreadcrumbPage', 'BreadcrumbSeparator', 'BreadcrumbEllipsis'])],
  ['BubbleGroup', new Set(['Bubble'])],
  ['Bubble', new Set(['BubbleContent', 'BubbleReactions', 'Attachment', 'AttachmentGroup'])],
  ['BubbleContent', new Set(['Attachment', 'AttachmentGroup', 'Button', 'Marker'])],
  ['BubbleReactions', new Set(['Button', 'Badge'])],
  ['ButtonGroup', new Set(['Button', 'ButtonGroupText', 'ButtonGroupSeparator', 'Input', 'InputGroup', 'NativeSelect'])],
  ['Calendar', new Set(['CalendarDayButton'])],
  ['CardHeader', new Set(['CardTitle', 'CardDescription', 'CardAction'])],
  ['Carousel', new Set(['CarouselSlide', 'CarouselContent', 'CarouselPrevious', 'CarouselNext'])],
  ['CarouselContent', new Set(['CarouselItem', 'CarouselSlide'])],
  ['Collapsible', new Set(['Item', 'ItemGroup', 'Button'])],
  ['Command', new Set(['CommandInput', 'CommandList', 'CommandEmpty', 'CommandSection', 'CommandOption', 'CommandSeparator'])],
  ['CommandList', new Set(['CommandEmpty', 'CommandSection', 'CommandOption', 'CommandSeparator'])],
  ['CommandGroup', new Set(['CommandItem', 'CommandSeparator'])],
  ['CommandItem', new Set(['CommandShortcut'])],
  ['CommandOption', new Set(['CommandShortcut'])],
  ['CommandSection', new Set(['CommandOption', 'CommandSeparator'])],
  ['Combobox', new Set(['ComboboxInput', 'ComboboxSection', 'ComboboxOption', 'ComboboxEmpty', 'ComboboxSeparator', 'ComboboxTrigger', 'ComboboxContent', 'ComboboxChips'])],
  ['ComboboxChips', new Set(['ComboboxChip', 'ComboboxChipsInput'])],
  ['ComboboxContent', new Set(['ComboboxEmpty', 'ComboboxList', 'ComboboxSection', 'ComboboxOption', 'ComboboxSeparator'])],
  ['ComboboxList', new Set(['ComboboxEmpty', 'ComboboxSection', 'ComboboxOption', 'ComboboxSeparator'])],
  ['ComboboxGroup', new Set(['ComboboxLabel', 'ComboboxItem', 'ComboboxSeparator'])],
  ['ComboboxSection', new Set(['ComboboxOption', 'ComboboxSeparator'])],
  ['ComboboxTrigger', new Set(['ComboboxValue'])],
  ['ContextMenu', new Set(['ContextMenuTrigger', 'ContextMenuContent', 'ContextMenuGroup', 'ContextMenuLabel', 'ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])],
  ['ContextMenuContent', new Set(['ContextMenuGroup', 'ContextMenuLabel', 'ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])],
  ['ContextMenuGroup', new Set(['ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])],
  ['ContextMenuItem', new Set(['ContextMenuShortcut'])],
  ['ContextMenuCheckboxItem', new Set(['ContextMenuShortcut'])],
  ['ContextMenuRadioGroup', new Set(['ContextMenuRadioItem'])],
  ['ContextMenuRadioSection', new Set(['ContextMenuRadioItem'])],
  ['ContextMenuRadioItem', new Set(['ContextMenuShortcut'])],
  ['ContextMenuSub', new Set(['ContextMenuSubTrigger', 'ContextMenuSubContent'])],
  ['ContextMenuSubContent', new Set(['ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])],
  ['ContextMenuSubmenu', new Set(['ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator'])],
  ['Dialog', new Set(['DialogTrigger', 'DialogContent', 'DialogPreset', 'DialogFooter', 'DialogClose', 'Button'])],
  ['DialogContent', new Set(['DialogHeader', 'DialogMedia', 'DialogTitle', 'DialogDescription', 'DialogFooter', 'DialogClose'])],
  ['DialogHeader', new Set(['DialogMedia', 'DialogTitle', 'DialogDescription'])],
  ['DialogFooter', new Set(['Button', 'DialogClose'])],
  ['DialogPreset', new Set(['Button', 'DialogClose'])],
  ['DropdownMenu', new Set(['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuGroup', 'DropdownMenuLabel', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSubmenu'])],
  ['DropdownMenuContent', new Set(['DropdownMenuGroup', 'DropdownMenuLabel', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSub', 'DropdownMenuSubmenu'])],
  ['DropdownMenuGroup', new Set(['DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSub', 'DropdownMenuSubmenu'])],
  ['DropdownMenuTrigger', new Set(['Button'])],
  ['DropdownMenuItem', new Set(['DropdownMenuShortcut'])],
  ['DropdownMenuCheckboxItem', new Set(['DropdownMenuShortcut'])],
  ['DropdownMenuRadioGroup', new Set(['DropdownMenuRadioItem'])],
  ['DropdownMenuRadioSection', new Set(['DropdownMenuRadioItem'])],
  ['DropdownMenuRadioItem', new Set(['DropdownMenuShortcut'])],
  ['DropdownMenuSub', new Set(['DropdownMenuSubTrigger', 'DropdownMenuSubContent'])],
  ['DropdownMenuSubContent', new Set(['DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSub', 'DropdownMenuSubmenu'])],
  ['DropdownMenuSubmenu', new Set(['DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator'])],
  ['Drawer', new Set(['DrawerTrigger', 'DrawerContent', 'DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter', 'DrawerClose', 'Button', 'Item', 'ItemGroup'])],
  ['DrawerContent', new Set(['DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter', 'DrawerClose', 'Button', 'Item', 'ItemGroup'])],
  ['DrawerHeader', new Set(['DrawerTitle', 'DrawerDescription'])],
  ['DrawerFooter', new Set(['Button', 'DrawerClose'])],
  ['Empty', new Set(['EmptyHeader', 'EmptyContent'])],
  ['EmptyHeader', new Set(['EmptyMedia', 'EmptyTitle', 'EmptyDescription'])],
  ['EmptyContent', new Set(['Button', 'ButtonGroup', 'Item', 'ItemGroup'])],
  ['FieldSet', new Set(['FieldLegend', 'FieldGroup', 'Field', 'FieldSeparator'])],
  ['FieldGroup', new Set(['Field', 'FieldSeparator'])],
  ['Field', new Set(['FieldLabel', 'FieldContent', 'FieldTitle', 'FieldDescription', 'FieldError', 'Checkbox', 'Input', 'NativeSelect', 'Textarea'])],
  ['FieldContent', new Set(['FieldTitle', 'FieldDescription'])],
  ['FieldLabel', new Set(['Checkbox', 'Input', 'NativeSelect', 'RadioGroupItem', 'Switch'])],
  ['HoverCard', new Set(['HoverCardTrigger', 'HoverCardContent', 'Item', 'ItemGroup', 'Button', 'Badge'])],
  ['HoverCardContent', new Set(['Item', 'ItemGroup', 'Button', 'Badge'])],
  ['InputGroup', new Set(['InputGroupAddon', 'InputGroupButton', 'InputGroupText', 'InputGroupInput', 'InputGroupTextarea'])],
  ['InputGroupAddon', new Set(['InputGroupButton', 'InputGroupText', 'Kbd'])],
  ['InputOTP', new Set(['InputOTPDigitGroup', 'InputOTPSeparator'])],
  ['InputOTPGroup', new Set(['InputOTPSlot'])],
  ['ItemGroup', new Set(['Item', 'ItemSeparator'])],
  ['Item', new Set(['ItemHeader', 'ItemMedia', 'ItemContent', 'ItemActions', 'ItemFooter'])],
  ['ItemContent', new Set(['ItemTitle', 'ItemDescription'])],
  ['ItemActions', new Set(['Button', 'ButtonGroup', 'Badge'])],
  ['ItemHeader', new Set(['ItemTitle', 'ItemDescription', 'Badge'])],
  ['ItemFooter', new Set(['ItemTitle', 'ItemDescription', 'Badge', 'Button'])],
  ['KbdGroup', new Set(['Kbd'])],
  ['Marker', new Set(['MarkerIcon', 'MarkerContent'])],
  ['MarkerContent', new Set(['Button'])],
  ['Menubar', new Set(['MenubarMenu'])],
  ['MenubarMenu', new Set(['MenubarTrigger', 'MenubarContent', 'MenubarGroup', 'MenubarLabel', 'MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])],
  ['MenubarContent', new Set(['MenubarGroup', 'MenubarLabel', 'MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])],
  ['MenubarGroup', new Set(['MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])],
  ['MenubarItem', new Set(['MenubarShortcut'])],
  ['MenubarCheckboxItem', new Set(['MenubarShortcut'])],
  ['MenubarRadioGroup', new Set(['MenubarRadioItem'])],
  ['MenubarRadioSection', new Set(['MenubarRadioItem'])],
  ['MenubarRadioItem', new Set(['MenubarShortcut'])],
  ['MenubarSub', new Set(['MenubarSubTrigger', 'MenubarSubContent'])],
  ['MenubarSubContent', new Set(['MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])],
  ['MenubarSubmenu', new Set(['MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator'])],
  ['MessageGroup', new Set(['Message', 'Marker'])],
  ['Message', new Set(['MessageAvatar', 'MessageContent'])],
  ['MessageAvatar', new Set(['Avatar'])],
  ['MessageContent', new Set(['MessageHeader', 'Bubble', 'BubbleGroup', 'Attachment', 'AttachmentGroup', 'MessageFooter', 'Marker'])],
  ['MessageHeader', new Set(['Badge'])],
  ['MessageFooter', new Set(['Marker'])],
  ['MessageScroller', new Set(['MessageScrollerViewport', 'MessageScrollerButton'])],
  ['MessageScrollerViewport', new Set(['MessageScrollerContent'])],
  ['MessageScrollerContent', new Set(['MessageScrollerItem', 'Message', 'MessageGroup', 'Marker'])],
  ['MessageScrollerItem', new Set(['Message', 'MessageGroup', 'Marker'])],
  ['NativeSelect', new Set(['NativeSelectOption', 'NativeSelectOptGroup'])],
  ['NativeSelectOptGroup', new Set(['NativeSelectOption'])],
  ['NavigationMenu', new Set(['NavigationMenuPanelItem', 'NavigationMenuLinkItem'])],
  ['NavigationMenuList', new Set(['NavigationMenuPanelItem', 'NavigationMenuLinkItem'])],
  ['NavigationMenuItem', new Set(['NavigationMenuTrigger', 'NavigationMenuContent', 'NavigationMenuLink'])],
  ['NavigationMenuPanelItem', new Set(['NavigationMenuLink', 'Item', 'ItemGroup', 'Button'])],
  ['NavigationMenuContent', new Set(['NavigationMenuLink', 'Item', 'ItemGroup', 'Button'])],
  ['Pagination', new Set(['PaginationItem', 'PaginationPrevious', 'PaginationLink', 'PaginationNext', 'PaginationEllipsis'])],
  ['PaginationContent', new Set(['PaginationItem'])],
  ['PaginationItem', new Set(['PaginationLink', 'PaginationPrevious', 'PaginationNext', 'PaginationEllipsis'])],
  ['Popover', new Set(['PopoverTrigger', 'PopoverContent', 'PopoverHeader', 'PopoverTitle', 'PopoverDescription', 'Button', 'Item', 'ItemGroup'])],
  ['PopoverContent', new Set(['PopoverHeader', 'PopoverTitle', 'PopoverDescription', 'Button', 'Item', 'ItemGroup'])],
  ['PopoverHeader', new Set(['PopoverTitle', 'PopoverDescription'])],
  ['Progress', new Set(['ProgressLabel', 'ProgressValue'])],
  ['RadioGroup', new Set(['RadioGroupOption', 'RadioGroupItem'])],
  ['ResizablePanelGroup', new Set(['ResizablePanel', 'ResizableHandle'])],
  ['ResizableSplit', new Set(['ResizablePanel'])],
  ['ScrollArea', new Set(['ScrollBar'])],
  ['Select', new Set(['SelectGroup', 'SelectItem', 'SelectSeparator', 'SelectTrigger', 'SelectContent'])],
  ['SelectTrigger', new Set(['SelectValue'])],
  ['SelectContent', new Set(['SelectGroup', 'SelectItem', 'SelectLabel', 'SelectSeparator'])],
  ['SelectGroup', new Set(['SelectLabel', 'SelectItem', 'SelectSeparator'])],
  ['Sheet', new Set(['SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetClose', 'Button', 'Item', 'ItemGroup'])],
  ['SheetContent', new Set(['SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetClose', 'Button', 'Item', 'ItemGroup'])],
  ['SheetHeader', new Set(['SheetTitle', 'SheetDescription'])],
  ['SheetFooter', new Set(['Button', 'SheetClose'])],
  ['SidebarProvider', new Set(['Sidebar', 'SidebarInset'])],
  ['Sidebar', new Set(['SidebarHeader', 'SidebarContent', 'SidebarFooter', 'SidebarRail'])],
  ['SidebarHeader', new Set(['SidebarBrand', 'SidebarInput', 'SidebarSeparator'])],
  ['SidebarBrand', new Set(['SidebarBrandMark', 'SidebarBrandContent'])],
  ['SidebarBrandMark', new Set(['Icon', 'Avatar', 'SidebarBrandImage'])],
  ['SidebarContent', new Set(['SidebarGroup', 'SidebarSeparator'])],
  ['SidebarGroup', new Set(['SidebarGroupLabel', 'SidebarGroupAction', 'SidebarGroupContent'])],
  ['SidebarGroupContent', new Set(['SidebarMenu', 'SidebarMenuSkeleton'])],
  ['SidebarMenu', new Set(['SidebarMenuItem'])],
  ['SidebarMenuItem', new Set(['SidebarMenuButton', 'SidebarMenuAction', 'SidebarMenuBadge', 'SidebarMenuSub'])],
  ['SidebarMenuButton', new Set(['SidebarMenuButtonPersistent', 'SidebarMenuButtonContent', 'Icon', 'Avatar'])],
  ['SidebarMenuButtonPersistent', new Set(['Icon', 'Avatar'])],
  ['SidebarMenuSub', new Set(['SidebarMenuSubItem'])],
  ['SidebarMenuSubItem', new Set(['SidebarMenuSubButton'])],
  ['SidebarTrigger', new Set(['SidebarTriggerCollapsedIcon', 'SidebarTriggerExpandedIcon', 'Icon'])],
  ['ToastTrigger', new Set(['Button'])],
  ['Tabs', new Set(['TabsPane', 'TabsList', 'TabsContent'])],
  ['TabsList', new Set(['TabsTrigger'])],
  ['TooltipProvider', new Set(['Tooltip'])],
  ['Tooltip', new Set(['TooltipTrigger', 'TooltipContent', 'Kbd'])],
  ['Table', new Set(['TableCaption', 'TableHeader', 'TableBody', 'TableFooter'])],
  ['TableHeader', new Set(['TableRow'])],
  ['TableBody', new Set(['TableRow'])],
  ['TableFooter', new Set(['TableRow'])],
  ['TableRow', new Set(['TableHead', 'TableCell'])],
  ['AstryxTable', new Set(['AstryxTableHeader', 'AstryxTableBody', 'AstryxTableFooter'])],
  ['AstryxTableHeader', new Set(['AstryxTableRow'])],
  ['AstryxTableBody', new Set(['AstryxTableRow'])],
  ['AstryxTableFooter', new Set(['AstryxTableRow'])],
  ['AstryxTableRow', new Set(['AstryxTableHead', 'AstryxTableCell'])],
  ['ToggleGroup', new Set(['ToggleGroupItem'])],
]);

const SOURCE_COMPONENT_SINGLE_CHILD_ALLOWLIST = new Map<string, Set<string>>([
  ['AccordionItem', new Set(['AccordionTrigger', 'AccordionContent'])],
  ['Alert', new Set(['AlertTitle', 'AlertDescription', 'AlertAction'])],
  ['AlertDialog', new Set(['AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])],
  ['AlertDialogContent', new Set(['AlertDialogHeader', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])],
  ['AlertDialogHeader', new Set(['AlertDialogMedia', 'AlertDialogTitle', 'AlertDialogDescription'])],
  ['Attachment', new Set(['AttachmentMedia', 'AttachmentContent', 'AttachmentActions', 'AttachmentTrigger'])],
  ['AttachmentContent', new Set(['AttachmentTitle', 'AttachmentDescription'])],
  ['Avatar', new Set(['AvatarImage', 'AvatarFallback', 'AvatarBadge'])],
  ['Bubble', new Set(['BubbleContent', 'BubbleReactions'])],
  ['Marker', new Set(['MarkerIcon', 'MarkerContent'])],
  ['CardHeader', new Set(['CardTitle', 'CardDescription', 'CardAction'])],
  ['ComboboxContent', new Set(['ComboboxList', 'ComboboxEmpty'])],
  ['Combobox', new Set(['ComboboxInput', 'ComboboxTrigger', 'ComboboxContent', 'ComboboxChips'])],
  ['ComboboxGroup', new Set(['ComboboxLabel'])],
  ['Command', new Set(['CommandInput', 'CommandList', 'CommandEmpty'])],
  ['CommandList', new Set(['CommandEmpty'])],
  ['Dialog', new Set(['DialogTrigger', 'DialogContent', 'DialogPreset', 'DialogFooter', 'DialogClose', 'Button'])],
  ['DialogContent', new Set(['DialogHeader', 'DialogMedia', 'DialogTitle', 'DialogDescription', 'DialogFooter'])],
  ['DialogHeader', new Set(['DialogMedia', 'DialogTitle', 'DialogDescription'])],
  ['DropdownMenu', new Set(['DropdownMenuTrigger', 'DropdownMenuContent'])],
  ['DropdownMenuTrigger', new Set(['Button'])],
  ['DropdownMenuSub', new Set(['DropdownMenuSubTrigger', 'DropdownMenuSubContent'])],
  ['ContextMenu', new Set(['ContextMenuTrigger', 'ContextMenuContent'])],
  ['ContextMenuSub', new Set(['ContextMenuSubTrigger', 'ContextMenuSubContent'])],
  ['Message', new Set(['MessageAvatar', 'MessageContent'])],
  ['MessageContent', new Set(['MessageHeader', 'MessageFooter'])],
  ['MessageScroller', new Set(['MessageScrollerViewport'])],
  ['MessageScrollerViewport', new Set(['MessageScrollerContent'])],
  ['Drawer', new Set(['DrawerTrigger', 'DrawerContent', 'DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter'])],
  ['DrawerContent', new Set(['DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter'])],
  ['DrawerHeader', new Set(['DrawerTitle', 'DrawerDescription'])],
  ['EmptyHeader', new Set(['EmptyMedia', 'EmptyTitle', 'EmptyDescription'])],
  ['Field', new Set(['FieldLabel', 'FieldContent', 'FieldTitle', 'FieldDescription', 'FieldError'])],
  ['FieldContent', new Set(['FieldTitle', 'FieldDescription'])],
  ['InputGroup', new Set(['InputGroupInput', 'InputGroupTextarea'])],
  ['HoverCard', new Set(['HoverCardTrigger', 'HoverCardContent'])],
  ['MenubarMenu', new Set(['MenubarTrigger', 'MenubarContent'])],
  ['MenubarSub', new Set(['MenubarSubTrigger', 'MenubarSubContent'])],
  ['Popover', new Set(['PopoverTrigger', 'PopoverContent', 'PopoverHeader', 'PopoverTitle', 'PopoverDescription'])],
  ['PopoverContent', new Set(['PopoverHeader', 'PopoverTitle', 'PopoverDescription'])],
  ['PopoverHeader', new Set(['PopoverTitle', 'PopoverDescription'])],
  ['Progress', new Set(['ProgressLabel', 'ProgressValue'])],
  ['SelectGroup', new Set(['SelectLabel'])],
  ['SelectTrigger', new Set(['SelectValue'])],
  ['Select', new Set(['SelectTrigger', 'SelectContent'])],
  ['Sheet', new Set(['SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter'])],
  ['SheetContent', new Set(['SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter'])],
  ['SheetHeader', new Set(['SheetTitle', 'SheetDescription'])],
  ['SidebarProvider', new Set(['Sidebar', 'SidebarInset'])],
  ['Sidebar', new Set(['SidebarHeader', 'SidebarContent', 'SidebarFooter', 'SidebarRail'])],
  ['SidebarHeader', new Set(['SidebarBrand', 'SidebarInput', 'SidebarSeparator'])],
  ['SidebarBrand', new Set(['SidebarBrandMark', 'SidebarBrandContent'])],
  ['SidebarGroup', new Set(['SidebarGroupLabel', 'SidebarGroupAction', 'SidebarGroupContent'])],
  ['SidebarMenuItem', new Set(['SidebarMenuButton', 'SidebarMenuAction', 'SidebarMenuBadge', 'SidebarMenuSub'])],
  ['SidebarTrigger', new Set(['SidebarTriggerCollapsedIcon', 'SidebarTriggerExpandedIcon', 'Icon'])],
  ['Tabs', new Set(['TabsList'])],
  ['Carousel', new Set(['CarouselContent'])],
  ['Tooltip', new Set(['TooltipTrigger', 'TooltipContent'])],
]);

const SOURCE_COMPONENT_EXCLUSIVE_CHILD_GROUPS = new Map<string, Array<Set<string>>>([
  ['InputGroup', [new Set(['InputGroupInput', 'InputGroupTextarea'])]],
]);

const SOURCE_COMPONENT_NESTED_CONTENT_MODES = new Map<string, {
  contentName: string;
  directChildNames: Set<string>;
}>([
  ['DropdownMenu', {
    contentName: 'DropdownMenuContent',
    directChildNames: new Set([
      'DropdownMenuGroup',
      'DropdownMenuLabel',
      'DropdownMenuItem',
      'DropdownMenuCheckboxItem',
      'DropdownMenuRadioSection',
      'DropdownMenuSeparator',
      'DropdownMenuSub',
      'DropdownMenuSubmenu',
    ]),
  }],
  ['ContextMenu', {
    contentName: 'ContextMenuContent',
    directChildNames: new Set([
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuItem',
      'ContextMenuCheckboxItem',
      'ContextMenuRadioSection',
      'ContextMenuSeparator',
      'ContextMenuSub',
      'ContextMenuSubmenu',
    ]),
  }],
  ['MenubarMenu', {
    contentName: 'MenubarContent',
    directChildNames: new Set([
      'MenubarGroup',
      'MenubarLabel',
      'MenubarItem',
      'MenubarCheckboxItem',
      'MenubarRadioSection',
      'MenubarSeparator',
      'MenubarSub',
      'MenubarSubmenu',
    ]),
  }],
  ['Combobox', {
    contentName: 'ComboboxContent',
    directChildNames: new Set([
      'ComboboxSection',
      'ComboboxOption',
      'ComboboxEmpty',
      'ComboboxSeparator',
    ]),
  }],
  ['Drawer', {
    contentName: 'DrawerContent',
    directChildNames: new Set([
      'DrawerHeader',
      'DrawerTitle',
      'DrawerDescription',
      'DrawerFooter',
      'DrawerClose',
      'Button',
      'Item',
      'ItemGroup',
    ]),
  }],
  ['HoverCard', {
    contentName: 'HoverCardContent',
    directChildNames: new Set(['Item', 'ItemGroup', 'Button', 'Badge']),
  }],
  ['Popover', {
    contentName: 'PopoverContent',
    directChildNames: new Set(['PopoverHeader', 'PopoverTitle', 'PopoverDescription', 'Button', 'Item', 'ItemGroup']),
  }],
  ['Sheet', {
    contentName: 'SheetContent',
    directChildNames: new Set(['SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetClose', 'Button', 'Item', 'ItemGroup']),
  }],
  ['Tooltip', {
    contentName: 'TooltipContent',
    directChildNames: new Set(['Kbd']),
  }],
  ['Select', {
    contentName: 'SelectContent',
    directChildNames: new Set(['SelectGroup', 'SelectItem', 'SelectSeparator']),
  }],
  ['Carousel', {
    contentName: 'CarouselContent',
    directChildNames: new Set(['CarouselSlide']),
  }],
]);

export const SOURCE_INLINE_CHILD_TAG_NAMES = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'i',
  'img',
  'ins',
  'kbd',
  'label',
  'mark',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'text',
  'time',
  'u',
  'var',
  'wbr',
]);

export function getSourceChildrenSlotKind(elementName: string): SourceChildrenSlotKind | null {
  // 1. Project component source inference normally owns the contract. Bundled
  // shadcn components are the exception: wrappers that forward `...props`
  // can look leaf-like to source inference even though the public family
  // contract intentionally exposes children (for example
  // MessageScrollerContent). Preserve the known public slot in that case.
  const registered = getRegisteredSlotKind(elementName);
  if (registered.registered && registered.preserveKnownChildContract) {
    if (SOURCE_COMPONENT_INLINE_SLOT_CONTAINER_NAMES.has(elementName)) return 'inline';
    if (SOURCE_COMPONENT_BLOCK_SLOT_CONTAINER_NAMES.has(elementName)) return 'block';
  }
  if (registered.registered) return registered.kind;

  // 2. Explicit Workbench-owned allowlist.
  if (SOURCE_COMPONENT_INLINE_SLOT_CONTAINER_NAMES.has(elementName)) return 'inline';
  if (SOURCE_COMPONENT_BLOCK_SLOT_CONTAINER_NAMES.has(elementName)) return 'block';

  // 3. HTML tag fallbacks.
  const htmlName = elementName.toLowerCase();
  if (SOURCE_HTML_TEXT_CONTAINER_TAG_NAMES.has(htmlName)) return 'inline';
  if (SOURCE_HTML_INTERACTIVE_INLINE_CONTAINER_TAG_NAMES.has(htmlName)) return 'inline';

  // 4. Unknown PascalCase components without source inference are conservative
  // null (no children slot) because writeback cannot know whether `children`
  // would be rendered.
  if (isComponentName(elementName)) return null;
  return 'block';
}

export function componentSupportsChildrenSlot(componentName: string): boolean {
  const slotKind = getSourceChildrenSlotKind(componentName);
  if (slotKind === 'block' || slotKind === 'inline') return true;
  return false;
}

export function componentSupportsBlockChildrenSlot(componentName: string): boolean {
  return getSourceChildrenSlotKind(componentName) === 'block';
}

export function canInsertSourceChildTemplateIntoElement(
  elementName: string,
  templateId: string,
): boolean {
  if (getStrictSourceChildAllowlist(elementName)) return false;
  const registered = getRegisteredSlotKind(elementName);
  if (registered.registered && registered.preserveKnownChildContract) {
    if (SOURCE_COMPONENT_MEDIA_CHILD_SLOT_NAMES.has(elementName)) {
      return SOURCE_MEDIA_CHILD_TEMPLATE_IDS.has(templateId);
    }
    if (SOURCE_COMPONENT_CHILD_ALLOWLIST.has(elementName)) return false;
  }
  if (registered.registered) {
    if (!registered.kind) return false;
    return registered.kind === 'block' || SOURCE_INLINE_CHILD_TEMPLATE_IDS.has(templateId);
  }
  if (SOURCE_COMPONENT_MEDIA_CHILD_SLOT_NAMES.has(elementName)) {
    return SOURCE_MEDIA_CHILD_TEMPLATE_IDS.has(templateId);
  }
  if (SOURCE_COMPONENT_CHILD_ALLOWLIST.has(elementName)) return false;
  const slotKind = getSourceChildrenSlotKind(elementName);
  if (!slotKind) return false;
  if (slotKind === 'inline') return SOURCE_INLINE_CHILD_TEMPLATE_IDS.has(templateId);
  return true;
}

export function canInsertComponentChildrenIntoElement(elementName: string): boolean {
  const slotKind = getSourceChildrenSlotKind(elementName);
  // Inline slots accept components too, but only inline-safe ones — the
  // per-child check in canMoveSourceChildIntoParent stays authoritative.
  return slotKind === 'block' || slotKind === 'inline';
}

export function canMoveSourceChildIntoParent(parentElementName: string, childElementName: string): boolean {
  // A story-declared allowlist is the parent's own contract, so it outranks
  // both source inference and the Workbench-owned maps. Everything below it
  // keeps the established precedence: a project component that happens to
  // share a name with a bundled one still overrides the built-in allowlist.
  const strictAllowedChildren = getStrictSourceChildAllowlist(parentElementName);
  if (strictAllowedChildren) return strictAllowedChildren.has(childElementName);

  const registeredParent = getRegisteredSlotKind(parentElementName);
  if (registeredParent.registered && !registeredParent.preserveKnownChildContract) {
    if (!registeredParent.kind) return false;
    if (registeredParent.kind === 'block') return true;
    const registeredChild = getRegisteredSlotKind(childElementName);
    return SOURCE_INLINE_CHILD_TAG_NAMES.has(childElementName.toLowerCase()) ||
      isSourceInlineChildComponentName(childElementName) ||
      (registeredChild.registered && registeredChild.kind === 'inline');
  }

  if (SOURCE_COMPONENT_MEDIA_CHILD_SLOT_NAMES.has(parentElementName)) {
    return isSourceMediaChildName(childElementName);
  }

  const allowedChildren = SOURCE_COMPONENT_CHILD_ALLOWLIST.get(parentElementName);
  if (allowedChildren) return allowedChildren.has(childElementName);

  const parentSlotKind = getSourceChildrenSlotKind(parentElementName);
  if (!parentSlotKind) return false;
  if (parentSlotKind === 'block') return true;
  const registeredChild = getRegisteredSlotKind(childElementName);
  return SOURCE_INLINE_CHILD_TAG_NAMES.has(childElementName.toLowerCase()) ||
    isSourceInlineChildComponentName(childElementName) ||
    (registeredChild.registered && registeredChild.kind === 'inline');
}

export function canAddSourceChildIntoParent(
  parentElementName: string,
  childElementName: string,
  existingChildElementNames: readonly string[],
): boolean {
  if (!canMoveSourceChildIntoParent(parentElementName, childElementName)) return false;
  const registeredParent = getRegisteredSlotKind(parentElementName);
  // Source inference cannot derive uniqueness rules, so a purely inferred
  // parent imposes none. A parent that declared its own allowlist opted into
  // a real child contract, so the uniqueness rules below still apply to it.
  const hasDeclaredChildContract = REGISTERED_CHILD_ALLOWLISTS.has(parentElementName);
  if (registeredParent.registered && !registeredParent.preserveKnownChildContract && !hasDeclaredChildContract) return true;
  const exclusiveGroups = SOURCE_COMPONENT_EXCLUSIVE_CHILD_GROUPS.get(parentElementName);
  if (exclusiveGroups?.some((group) => (
    group.has(childElementName) && existingChildElementNames.some((name) => group.has(name))
  ))) return false;
  const nestedContentMode = SOURCE_COMPONENT_NESTED_CONTENT_MODES.get(parentElementName);
  if (nestedContentMode) {
    const hasNestedContent = existingChildElementNames.includes(nestedContentMode.contentName);
    const hasDirectContent = existingChildElementNames.some((name) => nestedContentMode.directChildNames.has(name));
    if (childElementName === nestedContentMode.contentName && hasDirectContent) return false;
    if (nestedContentMode.directChildNames.has(childElementName) && hasNestedContent) return false;
  }
  const singleChildNames = SOURCE_COMPONENT_SINGLE_CHILD_ALLOWLIST.get(parentElementName);
  if (!singleChildNames?.has(childElementName)) return true;
  return !existingChildElementNames.includes(childElementName);
}

function isComponentName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Z][A-Za-z0-9_$]*)*$/.test(value);
}

function isSourceInlineChildComponentName(elementName: string): boolean {
  if (SOURCE_COMPONENT_INLINE_CHILD_NAMES.has(elementName)) return true;
  const componentName = elementName.split('.').pop() ?? elementName;
  for (const baseName of SOURCE_COMPONENT_INLINE_CHILD_BASE_NAMES) {
    if (componentName === baseName || componentName.endsWith(baseName)) return true;
  }
  return false;
}

function isSourceMediaChildName(value: string): boolean {
  if (SOURCE_EXACT_MEDIA_CHILD_NAMES.has(value)) return true;
  const htmlName = value.toLowerCase();
  if (SOURCE_EXACT_MEDIA_CHILD_NAMES.has(htmlName)) return true;
  return /^[A-Z][A-Za-z0-9_$]*Icon$/.test(value) ||
    /^Ri[A-Z][A-Za-z0-9_$]*(?:Fill|Line)$/.test(value);
}
