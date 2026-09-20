export type WorkbenchGroupableComponent = {
  componentSetId?: string | null;
  extensions?: Record<string, unknown>;
  name: string;
  sourceFile?: string;
};

const IMPORTED_COMPONENT_SET_ID = 'component-set-imported';
const UNGROUPED_COMPONENT_SET_ID = 'component-set-ungrouped';

const COMPONENT_GROUP_LABELS: Record<string, string> = {
  'component-set-actions': 'Actions',
  'component-set-chat': 'Chat',
  'component-set-content': 'Content',
  'component-set-data': 'Data',
  'component-set-feedback': 'Feedback',
  'component-set-foundation': 'Foundation',
  'component-set-inputs': 'Inputs',
  'component-set-layout': 'Layout',
  'component-set-media': 'Media',
  'component-set-navigation': 'Navigation',
  'component-set-overlays': 'Overlays',
  'component-set-typography': 'Typography',
  [UNGROUPED_COMPONENT_SET_ID]: 'Ungrouped',
};

export function getWorkbenchComponentGroupId(component: WorkbenchGroupableComponent): string {
  const explicitGroup = getStringExtension(component.extensions, 'componentGroup')
    ?? getStringExtension(component.extensions, 'category')
    ?? getStringExtension(component.extensions, 'group');
  if (explicitGroup) return toComponentSetId(explicitGroup);

  const componentSetId = component.componentSetId?.trim();
  if (componentSetId && componentSetId !== IMPORTED_COMPONENT_SET_ID) return componentSetId;

  return toComponentSetId(inferWorkbenchComponentGroup(component));
}

export function formatWorkbenchComponentGroupLabel(componentSetId: string): string {
  const known = COMPONENT_GROUP_LABELS[componentSetId];
  if (known) return known;
  const label = componentSetId.replace(/^component-set-/, '').replace(/[-_]+/g, ' ');
  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compareWorkbenchComponentGroupIds(left: string, right: string): number {
  const leftOrder = getWorkbenchComponentGroupOrder(left);
  const rightOrder = getWorkbenchComponentGroupOrder(right);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return formatWorkbenchComponentGroupLabel(left).localeCompare(formatWorkbenchComponentGroupLabel(right));
}

function inferWorkbenchComponentGroup(component: WorkbenchGroupableComponent): string {
  const name = normalizeWorkbenchComponentGroupName(component.name.trim());
  if ([
    'Button',
    'CountButton',
    'IconButton',
    'FloatButton',
    'ActionBar',
  ].includes(name)) return 'Actions';
  if ([
    'CommentInput',
    'Input',
    'InputField',
    'ReplyCommentInput',
    'TextField',
    'Textarea',
    'Checkbox',
    'Radio',
    'RadioGroup',
    'Switch',
    'Select',
    'SelectBox',
    'SelectItem',
    'SearchField',
  ].includes(name)) return 'Inputs';
  if ([
    'Breadcrumb',
    'BreadcrumbCurrent',
    'BreadcrumbItem',
    'BreadcrumbLink',
    'CollapsibleSidebar',
    'Link',
    'MagentaSidebarGroup',
    'MagentaSidebarItem',
    'NavItem',
    'Pagination',
    'PaginationEllipsis',
    'PaginationItem',
    'Rail',
    'RailFooter',
    'RailGroup',
    'Sidebar',
    'SidebarFollowRow',
    'SidebarFooter',
    'SidebarGroup',
    'SidebarItem',
    'Tabs',
    'TabsBar',
    'TabsList',
    'TabsPanel',
    'TabsItem',
    'Tab',
  ].includes(name)) return 'Navigation';
  if ([
    'Alert',
    'Badge',
    'Chip',
    'Dialog',
    'DialogBody',
    'DialogClose',
    'DialogDescription',
    'DialogFooter',
    'DialogHeader',
    'DialogTitle',
    'EmptyState',
    'Popover',
    'PopoverContent',
    'PopoverItem',
    'PopoverList',
    'Toast',
    'ToastDismiss',
    'ToastRegion',
    'ToastStack',
    'Tooltip',
    'VerifiedDot',
  ].includes(name)) return 'Feedback';
  if ([
    'Drawer',
    'Modal',
    'Popover',
    'PopoverGroup',
    'PopoverItem',
  ].includes(name)) return 'Overlays';
  if ([
    'Container',
    'Divider',
    'FlickingPage',
    'FlickingPages',
    'GlassPanel',
    'Grid',
    'ImageGrid',
    'Spacer',
    'Stack',
  ].includes(name)) return 'Layout';
  if ([
    'Caption',
    'Display',
    'Eyebrow',
    'Heading',
    'Text',
  ].includes(name)) return 'Typography';
  if ([
    'Avatar',
    'AvatarGroup',
    'AudioBlock',
    'AudioFrame',
    'AudioPlayer',
    'BrandMark',
    'Icon',
    'LiveStream',
    'LiveStreamBadge',
    'LiveStreamViewerCount',
    'Media',
    'MediaFrame',
    'Octahedron',
    'Story',
    'StoryStrip',
    'VideoCard',
    'VideoListCard',
  ].includes(name)) return 'Media';
  if ([
    'Card',
    'CardGrid',
    'Carousel',
    'CollabCreditItem',
    'CollabCredits',
    'CollabCreditsGroup',
    'Comment',
    'CreatorSpotlight',
    'CreditBalanceCard',
    'CreditBalanceCardBalance',
    'CreditBalanceCardRow',
    'FollowRow',
    'PostCard',
    'PostListItem',
    'PostStack',
    'PostStackNewPill',
    'ReplyComment',
    'SectionTitle',
    'SectionTitleGroup',
    'Stat',
    'StatList',
    'Toolbar',
    'ToolbarGroup',
    'TopicRow',
    'TopComment',
    'UserBlock',
    'UserCard',
    'UserCardHead',
    'UserCardSection',
    'UserCardStats',
    'Skeleton',
    'Spinner',
    'Tag',
  ].includes(name)) return 'Content';

  return 'Ungrouped';
}

function normalizeWorkbenchComponentGroupName(name: string): string {
  const knownNames = [
    'LiveStreamViewerCount',
    'CollabCreditsGroup',
    'CreditBalanceCardRow',
    'CollabCreditItem',
    'LiveStreamBadge',
    'PaginationEllipsis',
    'PostStackNewPill',
    'ReplyCommentInput',
    'CommentInput',
    'ReplyComment',
    'CreatorSpotlight',
    'SectionTitleGroup',
    'DialogDescription',
    'CreditBalanceCardBalance',
    'CreditBalanceCard',
    'LiveStreamViewerCount',
    'BreadcrumbCurrent',
    'BreadcrumbItem',
    'BreadcrumbLink',
    'DialogHeader',
    'DialogFooter',
    'PopoverContent',
    'PopoverItem',
    'PopoverList',
    'ToastDismiss',
    'ToastRegion',
    'UserCardSection',
    'UserCardStats',
    'PaginationItem',
    'PostListItem',
    'SectionTitle',
    'UserCardHead',
    'TabsPanel',
    'TabsList',
    'StoryStrip',
    'DialogBody',
    'DialogClose',
    'DialogTitle',
    'EmptyState',
    'FollowRow',
    'Rail',
    'RailFooter',
    'RailGroup',
    'Sidebar',
    'SidebarFollowRow',
    'SidebarFooter',
    'SidebarGroup',
    'SidebarItem',
    'UserCard',
    'PostStack',
    'Breadcrumb',
    'NavItem',
    'Pagination',
    'Popover',
    'Dialog',
    'ToolbarGroup',
    'RadioGroup',
    'Button',
    'IconButton',
    'FloatButton',
    'ActionBar',
    'Input',
    'InputField',
    'TextField',
    'Textarea',
    'Checkbox',
    'Radio',
    'Switch',
    'Select',
    'SelectBox',
    'SelectItem',
    'SearchField',
    'CollapsibleSidebar',
    'Link',
    'MagentaSidebarGroup',
    'MagentaSidebarItem',
    'Tabs',
    'TabsItem',
    'Tab',
    'Alert',
    'Badge',
    'Chip',
    'Toast',
    'ToastStack',
    'Tooltip',
    'VerifiedDot',
    'Drawer',
    'Modal',
    'Popover',
    'PopoverGroup',
    'PopoverItem',
    'Container',
    'Divider',
    'GlassPanel',
    'Grid',
    'ImageGrid',
    'Spacer',
    'Stack',
    'Caption',
    'Display',
    'Eyebrow',
    'Heading',
    'Text',
    'Avatar',
    'AvatarGroup',
    'AudioBlock',
    'AudioFrame',
    'AudioPlayer',
    'BrandMark',
    'Icon',
    'LiveStream',
    'Media',
    'MediaFrame',
    'VideoCard',
    'VideoListCard',
    'Card',
    'CardGrid',
    'Carousel',
    'CollabCredits',
    'Comment',
    'PostCard',
    'TopicRow',
    'Stat',
    'StatList',
    'Toolbar',
    'TopComment',
    'UserBlock',
    'Skeleton',
    'Spinner',
    'Tag',
  ].sort((left, right) => right.length - left.length);
  return knownNames.find((candidate) => name === candidate || name.endsWith(candidate)) ?? name;
}

function getWorkbenchComponentGroupOrder(componentSetId: string): number {
  const order = [
    'component-set-actions',
    'component-set-inputs',
    'component-set-navigation',
    'component-set-feedback',
    'component-set-overlays',
    'component-set-layout',
    'component-set-typography',
    'component-set-media',
    'component-set-data',
    'component-set-content',
    'component-set-chat',
    'component-set-foundation',
    UNGROUPED_COMPONENT_SET_ID,
  ];
  const index = order.indexOf(componentSetId);
  return index >= 0 ? index : order.length;
}

function toComponentSetId(value: string): string {
  const slug = value
    .trim()
    .replace(/^component-set-/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug ? `component-set-${slug}` : UNGROUPED_COMPONENT_SET_ID;
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}
