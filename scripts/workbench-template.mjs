import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORKBENCH_SCHEMA_VERSION = '0.1';
export const WORKBENCH_APP_ID = 'workbench-v1';
export const WORKBENCH_DEFAULT_DEV_COMMAND = 'npm run dev';
export const WORKBENCH_DEFAULT_PAGE_ID = 'page-untitled-page';
export const WORKBENCH_DEFAULT_PAGE_NAME = 'Untitled page';
export const WORKBENCH_DEFAULT_PAGE_SOURCE_FILE = 'src/workbench-pages/UntitledPage.tsx';
export const WORKBENCH_DEFAULT_PAGE_ROUTE = '/untitled-page';
const WORKBENCH_SHADCN_CATALOG_PAGE_ID = 'page-components-catalog';
const WORKBENCH_SHADCN_CATALOG_PAGE_NAME = 'Components catalog';
const WORKBENCH_SHADCN_CATALOG_PAGE_SOURCE_FILE = 'src/workbench-pages/ComponentsCatalog.tsx';
const WORKBENCH_SHADCN_CATALOG_PAGE_ROUTE = '/components-catalog';
const WORKBENCH_SHADCN_DASHBOARD_PAGE_ID = 'page-saas-dashboard';
const WORKBENCH_SHADCN_DASHBOARD_PAGE_NAME = 'SaaS dashboard';
const WORKBENCH_SHADCN_DASHBOARD_PAGE_SOURCE_FILE = 'src/workbench-pages/SaasDashboard.tsx';
const WORKBENCH_SHADCN_DASHBOARD_PAGE_ROUTE = '/dashboard';
const WORKBENCH_ASTRYX_COMP_GALLARY_PAGE_SOURCE_FILE =
  'src/workbench-pages/SamplePage/CompGallery.tsx';
const WORKBENCH_ASTRYX_MUSIC_SAMPLE_PAGE_SOURCE_FILE =
  'src/workbench-pages/SamplePage/MusicSample.tsx';
export const WORKBENCH_DEFAULT_TOKEN_CSS_FILE = 'src/workbench-tokens.css';
export const WORKBENCH_DEFAULT_SITE_CSS_FILE = 'src/site.css';
export const WORKBENCH_DEFAULT_TAILWIND_COMPILED_CSS_FILE = 'src/workbench-tailwind.css';
export const WORKBENCH_SHADCN_BASE_COMPILED_CSS_FILE = 'src/workbench-shadcn.css';
export const WORKBENCH_DEFAULT_MAIN_FILE = 'src/main.tsx';
export const WORKBENCH_BUNDLED_COMPONENT_DIR = 'src/components';
export const WORKBENCH_LUCIDE_PREVIEW_ICON_DIR = 'public/workbench-assets/icons/lucide-preview';
export const WORKBENCH_SAMPLE_DIR = 'sample';
export const WORKBENCH_AGENT_GUIDE_DIR = 'docs/workbench-agent';
export const WORKBENCH_PROJECT_AGENT_GUIDE_FILE = `${WORKBENCH_AGENT_GUIDE_DIR}/WORKBENCH-PROJECT-GUIDE.md`;
export const WORKBENCH_COMPONENT_AGENT_GUIDE_FILE = `${WORKBENCH_AGENT_GUIDE_DIR}/WORKBENCH-COMPONENT-AUTHORING.md`;
export const WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE = `${WORKBENCH_AGENT_GUIDE_DIR}/WORKBENCH-ORGANIZATIONAL-CONTEXT.md`;
export const WORKBENCH_AGENT_SKILLS_DIR = '.agents/skills';
export const WORKBENCH_CLAUDE_SKILLS_DIR = '.claude/skills';
export const WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL = 'workbench-design-authoring';
export const WORKBENCH_PROJECT_AUTHORING_SKILL = 'workbench-project-authoring';
export const WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL = 'workbench-project-component-authoring';
export const WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL = 'workbench-project-preview-runtime';

const WORKBENCH_SHADCN_BASE_TEMPLATE_PATH = ['workbench-starter', 'shadcn-base'];
const WORKBENCH_ASTRYX_TEMPLATE_PATH = ['workbench-starter', 'astryx'];
const WORKBENCH_ASTRYX_SOURCE_DIRS = ['src/components'];
const WORKBENCH_ASTRYX_TEXT_EXTENSIONS = new Set(['.css', '.ts', '.tsx']);
const WORKBENCH_ASTRYX_ASSET_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png']);
const WORKBENCH_SHADCN_BASE_SOURCE_DIRS = ['src/components/ui', 'src/lib', 'src/hooks'];
const WORKBENCH_SHADCN_BASE_TEXT_EXTENSIONS = new Set(['.css', '.json', '.ts', '.tsx']);
const WORKBENCH_SHADCN_BASE_ASSET_EXTENSIONS = new Set(['', '.svg']);
const WORKBENCH_SHADCN_BASE_FONT_BINARY_EXTENSIONS = new Set(['.woff2']);
const WORKBENCH_SHADCN_BASE_FONT_TEXT_EXTENSIONS = new Set(['.txt']);

const WORKBENCH_SHADCN_BASE_ROOT_INSERT_COMPONENTS = new Set([
  'Accordion',
  'Alert',
  'AlertDialog',
  'AreaChartCard',
  'AspectRatio',
  'Attachment',
  'AttachmentGroup',
  'Avatar',
  'AvatarGroup',
  'Badge',
  'BarChartCard',
  'Breadcrumb',
  'Bubble',
  'BubbleGroup',
  'Button',
  'ButtonGroup',
  'Calendar',
  'Card',
  'Carousel',
  'CarouselCards',
  'Checkbox',
  'CheckboxField',
  'Collapsible',
  'Combobox',
  'Command',
  'ComposedChartCard',
  'ContextMenu',
  'DatePicker',
  'DateRangePicker',
  'Dialog',
  'DialogPreset',
  'Drawer',
  'DropdownMenu',
  'Empty',
  'Field',
  'FieldSet',
  'HoverCard',
  'Icon',
  'Input',
  'InputGroup',
  'InputOTP',
  'Item',
  'ItemGroup',
  'Kbd',
  'KbdGroup',
  'Label',
  'LineChartCard',
  'Marker',
  'Menubar',
  'Message',
  'MessageGroup',
  'MessageScroller',
  'NativeSelect',
  'NavigationMenu',
  'Pagination',
  'PieChartCard',
  'Popover',
  'Progress',
  'RadialChartCard',
  'RadarChartCard',
  'RadioGroup',
  'ResizableSplit',
  'ScrollArea',
  'Select',
  'Separator',
  'ScatterChartCard',
  'Sheet',
  'Skeleton',
  'Slider',
  'Spinner',
  'Switch',
  'SwitchField',
  'Table',
  'Tabs',
  'Textarea',
  'Theme',
  'Toggle',
  'ToggleGroup',
  'Tooltip',
  'TooltipProvider',
]);

const WORKBENCH_SHADCN_BASE_INSERT_HIDDEN_COMPONENTS = new Set([
  'ChartContainer',
  'DirectionProvider',
  'Toaster',
  'TooltipProvider',
]);

const WORKBENCH_SHADCN_BASE_BLOCK_SLOT_COMPONENTS = new Set([
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
  'NavigationMenuList',
  'NavigationMenuPanelItem',
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
  'Theme',
  'ToggleGroup',
  'Tooltip',
  'TooltipContent',
  'TooltipProvider',
]);

const WORKBENCH_SHADCN_BASE_INLINE_SLOT_COMPONENTS = new Set([
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
  'TableCaption',
  'TabsTrigger',
  'Toggle',
  'ToggleGroupItem',
  'TooltipTrigger',
]);

export const WORKBENCH_PROJECT_TEMPLATE_STANDARD = 'standard';
export const WORKBENCH_PROJECT_TEMPLATE_TAILWIND = 'tailwind';
export const WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE = 'shadcn-base';
export const WORKBENCH_PROJECT_TEMPLATE_ASTRYX = 'astryx';
const WORKBENCH_BUNDLED_COMPONENT_TEMPLATE_FILES = [
  'Accordion.stories.tsx',
  'Accordion.tsx',
  'Alert.stories.tsx',
  'Alert.tsx',
  'Avatar.stories.tsx',
  'Avatar.tsx',
  'Badge.stories.tsx',
  'Badge.tsx',
  'Button.stories.tsx',
  'Button.tsx',
  'Card.stories.tsx',
  'Card.tsx',
  'Checkbox.stories.tsx',
  'Checkbox.tsx',
  'Icon.stories.tsx',
  'Icon.tsx',
  'Input.stories.tsx',
  'Input.tsx',
  'Label.stories.tsx',
  'Label.tsx',
  'Progress.stories.tsx',
  'Progress.tsx',
  'RadioGroup.stories.tsx',
  'RadioGroup.tsx',
  'Separator.stories.tsx',
  'Separator.tsx',
  'Slider.stories.tsx',
  'Slider.tsx',
  'Skeleton.stories.tsx',
  'Skeleton.tsx',
  'Switch.stories.tsx',
  'Switch.tsx',
  'Table.stories.tsx',
  'Table.tsx',
  'Tabs.stories.tsx',
  'Tabs.tsx',
  'Textarea.stories.tsx',
  'Textarea.tsx',
  'index.ts',
  'local.css',
];

export function createWorkbenchProjectFiles({ projectId, projectName, createdAt, templateId }) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const defaultPage = createDefaultWorkbenchPage();
  const pages = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
    ? createWorkbenchAstryxSamplePages()
    : normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? [createWorkbenchShadcnDashboardPage(), createWorkbenchShadcnCatalogPage()]
      : [defaultPage];
  const pageFolders = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
    ? ['SamplePage']
    : [];

  return [
    [
      'workbench.config.json',
      createWorkbenchConfig({ projectId, projectName, createdAt, templateId: normalizedTemplateId }),
    ],
    ['tokens.json', createInitialTokenRegistry({ templateId: normalizedTemplateId })],
    ['assets.json', createInitialAssetRegistry({ createdAt, templateId: normalizedTemplateId })],
    [
      'pages.json',
      {
        schemaVersion: WORKBENCH_SCHEMA_VERSION,
        pages,
        extensions: pageFolders.length > 0 ? { pageFolders } : {},
      },
    ],
    ['components.json', createInitialComponentRegistry({ createdAt, templateId: normalizedTemplateId })],
    ['notes.json', { schemaVersion: WORKBENCH_SCHEMA_VERSION, comments: [], extensions: {} }],
    [
      'selection.json',
      {
        schemaVersion: WORKBENCH_SCHEMA_VERSION,
        activeTarget: null,
        selectedTargets: [],
        updatedAt: createdAt,
        extensions: {
          activeWorkbenchSurface: 'design',
          activeDesignTargetKind: null,
          activeDesignTargetId: null,
          activeDesignSourceFile: null,
          activeDesignLayerId: null,
          selectedDesignLayerIds: [],
          openDesignTargetKeys: [],
        },
      },
    ],
    [
      'workspace-state.json',
      {
        schemaVersion: WORKBENCH_SCHEMA_VERSION,
        activePageId: null,
        activeComponentId: null,
        activeMode: 'preview-edit',
        updatedAt: createdAt,
        extensions: {},
      },
    ],
    [
      'history.json',
      {
        schemaVersion: WORKBENCH_SCHEMA_VERSION,
        updatedAt: createdAt,
        lanes: [],
        timeline: [],
        extensions: {},
      },
    ],
  ];
}

export function createWorkbenchProjectSourceFiles(options = {}) {
  const projectName = typeof options.projectName === 'string' && options.projectName.trim()
    ? options.projectName.trim()
    : 'Workbench project';
  const templateId = normalizeWorkbenchProjectTemplateId(options.templateId);

  return dedupeWorkbenchProjectFileEntries([
    ['.gitignore', createWorkbenchProjectGitignore()],
    ['package.json', createWorkbenchProjectPackageJson(projectName, templateId)],
    ['index.html', createWorkbenchProjectIndexHtml(projectName)],
    ['tsconfig.json', createWorkbenchProjectTsconfig(templateId)],
    ['vite.config.ts', createWorkbenchProjectViteConfig(templateId)],
    [WORKBENCH_DEFAULT_MAIN_FILE, createWorkbenchProjectMainSource(templateId)],
    [WORKBENCH_DEFAULT_SITE_CSS_FILE, createWorkbenchProjectSiteCss(templateId)],
    ...(usesWorkbenchTailwindTemplate(templateId)
      && templateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      && templateId !== WORKBENCH_PROJECT_TEMPLATE_ASTRYX
      ? [[WORKBENCH_DEFAULT_TAILWIND_COMPILED_CSS_FILE, createInitialWorkbenchTailwindCompiledCss(templateId)]]
      : []),
    [WORKBENCH_DEFAULT_TOKEN_CSS_FILE, createInitialWorkbenchTokenCss({ templateId })],
    ...(templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
      ? []
      : templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
        ? [[WORKBENCH_SHADCN_DASHBOARD_PAGE_SOURCE_FILE, createWorkbenchShadcnDashboardPageSource(WORKBENCH_SHADCN_DASHBOARD_PAGE_NAME)]]
        : [[WORKBENCH_DEFAULT_PAGE_SOURCE_FILE, createWorkbenchDesignPageSource(WORKBENCH_DEFAULT_PAGE_NAME, templateId)]]),
    ['scripts/workbench-verify-pages.mjs', createWorkbenchPageVerifierSource()],
    ...(templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? [[WORKBENCH_SHADCN_CATALOG_PAGE_SOURCE_FILE, createWorkbenchShadcnComponentsCatalogPageSource(WORKBENCH_SHADCN_CATALOG_PAGE_NAME)]]
      : []),
    ...(templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? createWorkbenchShadcnBaseSourceFiles()
      : []),
    ...(templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
      ? createWorkbenchAstryxSourceFiles()
      : []),
    ['THIRD_PARTY_NOTICES.md', createWorkbenchThirdPartyNotices()],
  ]);
}

function createWorkbenchPageVerifierSource() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(moduleDir, 'workbench-starter', 'verify-pages.mjs'),
    join(moduleDir, '..', 'scripts', 'workbench-starter', 'verify-pages.mjs'),
  ];
  const sourcePath = candidates.find((candidate) => existsSync(candidate));
  if (!sourcePath) throw new Error('Workbench page verifier source is missing.');
  return readFileSync(sourcePath, 'utf8');
}

function createWorkbenchProjectGitignore() {
  return [
    'node_modules/',
    'dist/',
    '.workbench/.npm-cache/',
    '.workbench/guidance-backups/',
    '.DS_Store',
    '',
  ].join('\n');
}

export function createWorkbenchProjectPackageJson(projectName, templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return `${JSON.stringify({
    name: createWorkbenchProjectPackageName(projectName),
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite --host 127.0.0.1 --port 5173',
      check: 'tsc -p tsconfig.json --noEmit && node scripts/workbench-verify-pages.mjs',
      build: 'vite build',
      preview: 'vite preview --host 127.0.0.1 --port 4173',
    },
    dependencies: {
      '@base-ui/react': '^1.6.0',
      ...(usesWorkbenchTailwindTemplate(normalizedTemplateId) ? {
        '@tailwindcss/vite': '^4',
        tailwindcss: '^4',
      } : {}),
      ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? {
        ...createWorkbenchShadcnBaseDependencyMap(),
        'class-variance-authority': '^0.7.1',
        clsx: '^2.1.1',
        'lucide-react': '^1.11.0',
        shadcn: '^4.11.0',
        'tailwind-merge': '^3.6.0',
        'tw-animate-css': '^1.4.0',
      } : {}),
      ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX ? {
        '@astryxdesign/core': '0.1.8',
        '@astryxdesign/theme-butter': '0.1.8',
        '@astryxdesign/theme-chocolate': '0.1.8',
        '@astryxdesign/theme-gothic': '0.1.8',
        '@astryxdesign/theme-matcha': '0.1.8',
        '@astryxdesign/theme-neutral': '0.1.8',
        '@astryxdesign/theme-stone': '0.1.8',
        '@astryxdesign/theme-y2k': '0.1.8',
      } : {}),
      react: normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX ? '19.2.7' : '^19.2.7',
      'react-dom': normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX ? '19.2.7' : '^19.2.7',
    },
    devDependencies: {
      ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? {
        '@types/node': '^25.6.0',
      } : {}),
      '@types/react': '^19.2.17',
      '@types/react-dom': '^19.2.3',
      '@vitejs/plugin-react': '^4.3.1',
      typescript: '^5.6.3',
      vite: '^6.4.3',
    },
  }, null, 2)}\n`;
}

function createWorkbenchProjectPackageName(projectName) {
  const normalized = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 214);
  return normalized || 'workbench-project';
}

export function createWorkbenchProjectIndexHtml(projectName, entryModule = '/src/main.tsx') {
  return [
    '<!doctype html>',
    '<html lang="ko">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${escapeHtmlText(projectName)}</title>`,
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    `    <script type="module" src="${entryModule}"></script>`,
    '  </body>',
    '</html>',
    '',
  ].join('\n');
}

export function createWorkbenchProjectTsconfig(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return `${JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: 'ESNext',
      moduleResolution: 'Bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? {
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
        },
      } : {}),
    },
    include: ['src'],
    ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? {
      exclude: ['src/**/*.stories.tsx'],
    } : {}),
    references: [],
  }, null, 2)}\n`;
}

export function createWorkbenchProjectViteConfig(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const usesTailwind = usesWorkbenchTailwindTemplate(normalizedTemplateId);
  const usesShadcnBase = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE;
  return [
    "import { defineConfig } from 'vite';",
    "import react from '@vitejs/plugin-react';",
    ...(usesTailwind ? ["import tailwindcss from '@tailwindcss/vite';"] : []),
    "import { fileURLToPath } from 'node:url';",
    '',
    "const projectRoot = fileURLToPath(new URL('.', import.meta.url));",
    '',
    'export default defineConfig({',
    '  root: projectRoot,',
    "  base: './',",
    `  plugins: [react()${usesTailwind ? ', tailwindcss()' : ''}],`,
    ...(usesShadcnBase
      ? [
          '  resolve: {',
          '    alias: {',
          "      '@': fileURLToPath(new URL('./src', import.meta.url)),",
          '    },',
          '  },',
        ]
      : []),
    '  server: {',
    "    host: '127.0.0.1',",
    '    port: 5173,',
    '    strictPort: false,',
    '  },',
    '  preview: {',
    "    host: '127.0.0.1',",
    '    port: 4173,',
    '    strictPort: false,',
    '  },',
    '  build: {',
    "    outDir: 'dist',",
    '    emptyOutDir: true,',
    '    sourcemap: false,',
    '  },',
    '});',
    '',
  ].join('\n');
}

export function createWorkbenchProjectMainSource(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const designPageSourceFile = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
    ? './workbench-pages/SamplePage/CompGallery'
    : normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? './workbench-pages/SaasDashboard'
      : './workbench-pages/UntitledPage';
  return [
    "import { StrictMode } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import './site.css';",
    `import WorkbenchDesignPage from '${designPageSourceFile}';`,
    '',
    "const rootElement = document.getElementById('root');",
    '',
    'if (!rootElement) {',
    "  throw new Error('Workbench project root element was not found.');",
    '}',
    '',
    'createRoot(rootElement).render(',
    '  <StrictMode>',
    '    <WorkbenchDesignPage />',
    '  </StrictMode>,',
    ');',
    '',
  ].join('\n');
}

export function createWorkbenchProjectSiteCss(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    return [
      "@import './astryx.source.css';",
      "@import './workbench-tokens.css';",
      "@import './astryx.theme-overrides.css';",
      '',
    ].join('\n');
  }
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) {
    const shadcnSiteCss = createWorkbenchShadcnBaseSiteCss();
    if (shadcnSiteCss) return shadcnSiteCss;
  }

  const imports = usesWorkbenchTailwindTemplate(normalizedTemplateId)
    ? [
        '@import "tailwindcss";',
        ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
          ? [
              '@import "tw-animate-css";',
              '@import "shadcn/tailwind.css";',
            ]
          : []),
        '',
      ]
    : [];
  const shadcnTheme = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    ? createWorkbenchShadcnThemeCssLines()
    : [];
  return [
    ...imports,
    ...shadcnTheme,
    ...(normalizedTemplateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? [
          '@theme inline {',
          ...createWorkbenchSemanticTailwindThemeAliasCssDeclarationLines(),
          '}',
          '',
        ]
      : []),
    '* {',
    '  box-sizing: border-box;',
    '  border: 0 solid;',
    '}',
    '',
    'html,',
    'body,',
    '#root {',
    '  width: 100%;',
    '  min-width: 320px;',
    '  min-height: 100%;',
    '  margin: 0;',
    '}',
    '',
    'html {',
    '  background: var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9);',
    '  color-scheme: light;',
    '}',
    '',
    'body {',
    '  font-family:',
    '    Inter,',
    '    "Noto Sans KR",',
    '    system-ui,',
    '    -apple-system,',
    '    BlinkMacSystemFont,',
    '    "Segoe UI",',
    '    sans-serif;',
    '}',
    '',
    'button,',
    'input,',
    'select,',
    'textarea {',
    '  font: inherit;',
    '  color: inherit;',
    '  background: transparent;',
    '}',
    '',
    '#root {',
    '  min-height: 100vh;',
    '}',
    '',
    ...(normalizedTemplateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? []
      : createWorkbenchBasicPageCssLines()),
  ].join('\n');
}

export function createInitialWorkbenchTailwindCompiledCss(templateId = WORKBENCH_PROJECT_TEMPLATE_TAILWIND) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return [
    '/*',
    ' * Workbench design-preview CSS snapshot.',
    ' * Project creation can run npm install, but does not wait for a Tailwind build.',
    ' * Regenerate this file from the host project when Tailwind source changes.',
    ` * Template: ${normalizedTemplateId}`,
    ' */',
    '',
    ...(normalizedTemplateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? createWorkbenchTailwindInstallFreePreviewCssLines()
      : []),
    ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? createWorkbenchShadcnPreviewIconCssLines()
      : []),
  ].join('\n');
}

function createWorkbenchTailwindInstallFreePreviewCssLines() {
  return [
    ':root {',
    ...createWorkbenchTailwindCoreTokenAliasCssDeclarationLines(),
    '  --background: var(--ds-token-workbench-semantic-color-background, var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9));',
    '  --foreground: var(--ds-token-workbench-semantic-color-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --card: var(--ds-token-workbench-semantic-color-card, var(--ds-token-workbench-semantic-color-surface, #ffffff));',
    '  --card-foreground: var(--ds-token-workbench-semantic-color-card-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --popover: var(--ds-token-workbench-semantic-color-popover, var(--ds-token-workbench-semantic-color-surface, #ffffff));',
    '  --popover-foreground: var(--ds-token-workbench-semantic-color-popover-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --primary: var(--ds-token-workbench-semantic-color-primary, var(--ds-token-workbench-semantic-color-action-primary, #2563eb));',
    '  --primary-foreground: var(--ds-token-workbench-semantic-color-primary-foreground, var(--ds-token-workbench-semantic-color-text-on-action, #ffffff));',
    '  --secondary: var(--ds-token-workbench-semantic-color-secondary, var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9));',
    '  --secondary-foreground: var(--ds-token-workbench-semantic-color-secondary-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --muted: var(--ds-token-workbench-semantic-color-muted, var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9));',
    '  --muted-foreground: var(--ds-token-workbench-semantic-color-muted-foreground, var(--ds-token-workbench-semantic-color-text-muted, #64748b));',
    '  --accent: var(--ds-token-workbench-semantic-color-accent, var(--ds-token-workbench-semantic-color-action-primary, #2563eb));',
    '  --accent-foreground: var(--ds-token-workbench-semantic-color-accent-foreground, var(--ds-token-workbench-semantic-color-text-on-action, #ffffff));',
    '  --destructive: var(--ds-token-workbench-semantic-color-destructive, #dc2626);',
    '  --border: var(--ds-token-workbench-semantic-color-border, #d8dee8);',
    '  --input: var(--ds-token-workbench-semantic-color-input, var(--ds-token-workbench-semantic-color-border, #d8dee8));',
    '  --ring: var(--ds-token-workbench-semantic-color-ring, var(--ds-token-workbench-semantic-color-focus-ring, #93c5fd));',
    '  --chart-1: var(--ds-token-workbench-semantic-color-chart-1, var(--ds-token-workbench-semantic-color-action-primary, #2563eb));',
    '  --chart-2: var(--ds-token-workbench-semantic-color-chart-2, var(--ds-token-tailwind-primitives-blue-400, #60a5fa));',
    '  --chart-3: var(--ds-token-workbench-semantic-color-chart-3, var(--ds-token-tailwind-primitives-emerald-400, #34d399));',
    '  --chart-4: var(--ds-token-workbench-semantic-color-chart-4, var(--ds-token-workbench-semantic-color-destructive, #dc2626));',
    '  --chart-5: var(--ds-token-workbench-semantic-color-chart-5, var(--ds-token-workbench-semantic-color-text-muted, #64748b));',
    '  --sidebar: var(--ds-token-workbench-semantic-color-sidebar, var(--ds-token-workbench-semantic-color-surface, #ffffff));',
    '  --sidebar-foreground: var(--ds-token-workbench-semantic-color-sidebar-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --sidebar-primary: var(--ds-token-workbench-semantic-color-sidebar-primary, var(--ds-token-workbench-semantic-color-action-primary, #2563eb));',
    '  --sidebar-primary-foreground: var(--ds-token-workbench-semantic-color-sidebar-primary-foreground, var(--ds-token-workbench-semantic-color-text-on-action, #ffffff));',
    '  --sidebar-accent: var(--ds-token-workbench-semantic-color-sidebar-accent, var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9));',
    '  --sidebar-accent-foreground: var(--ds-token-workbench-semantic-color-sidebar-accent-foreground, var(--ds-token-workbench-semantic-color-text-primary, #17202a));',
    '  --sidebar-border: var(--ds-token-workbench-semantic-color-sidebar-border, var(--ds-token-workbench-semantic-color-border, #d8dee8));',
    '  --sidebar-ring: var(--ds-token-workbench-semantic-color-sidebar-ring, var(--ds-token-workbench-semantic-color-focus-ring, #93c5fd));',
    '  --color-background: var(--background);',
    '  --color-foreground: var(--foreground);',
    '  --color-card: var(--card);',
    '  --color-card-foreground: var(--card-foreground);',
    '  --color-popover: var(--popover);',
    '  --color-popover-foreground: var(--popover-foreground);',
    '  --color-primary: var(--primary);',
    '  --color-primary-foreground: var(--primary-foreground);',
    '  --color-secondary: var(--secondary);',
    '  --color-secondary-foreground: var(--secondary-foreground);',
    '  --color-muted: var(--muted);',
    '  --color-muted-foreground: var(--muted-foreground);',
    '  --color-accent: var(--accent);',
    '  --color-accent-foreground: var(--accent-foreground);',
    '  --color-destructive: var(--destructive);',
    '  --color-border: var(--border);',
    '  --color-input: var(--input);',
    '  --color-ring: var(--ring);',
    ...createWorkbenchSemanticTailwindThemeAliasCssDeclarationLines(),
    '}',
    '',
    ...createWorkbenchTailwindPreflightPreviewCssLines(),
    'html,',
    'body,',
    '#root {',
    '  width: 100%;',
    '  min-width: 320px;',
    '  min-height: 100%;',
    '  margin: 0;',
    '}',
    '',
    'html {',
    '  background: var(--background);',
    '  color-scheme: light;',
    '}',
    '',
    'body {',
    '  color: var(--foreground);',
    '  font-family:',
    '    Inter,',
    '    "Noto Sans KR",',
    '    system-ui,',
    '    -apple-system,',
    '    BlinkMacSystemFont,',
    '    "Segoe UI",',
    '    sans-serif;',
    '}',
    '',
    'button,',
    'input,',
    'select,',
    'textarea {',
    '  font: inherit;',
    '  color: inherit;',
    '  background: transparent;',
    '}',
    '',
    '#root {',
    '  min-height: 100vh;',
    '}',
  ];
}

function createWorkbenchTailwindPreflightPreviewCssLines() {
  return [
    '*,',
    '::after,',
    '::before,',
    '::backdrop,',
    '::file-selector-button {',
    '  box-sizing: border-box;',
    '  margin: 0;',
    '  padding: 0;',
    '  border: 0 solid;',
    '}',
    '',
    'html,',
    ':host {',
    '  line-height: 1.5;',
    '  -webkit-text-size-adjust: 100%;',
    '  tab-size: 4;',
    '  font-family:',
    '    Inter,',
    '    "Noto Sans KR",',
    '    ui-sans-serif,',
    '    system-ui,',
    '    -apple-system,',
    '    BlinkMacSystemFont,',
    '    "Segoe UI",',
    '    sans-serif;',
    '  font-feature-settings: normal;',
    '  font-variation-settings: normal;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    'hr {',
    '  height: 0;',
    '  color: inherit;',
    '  border-top-width: 1px;',
    '}',
    '',
    'abbr:where([title]) {',
    '  -webkit-text-decoration: underline dotted;',
    '  text-decoration: underline dotted;',
    '}',
    '',
    'h1,',
    'h2,',
    'h3,',
    'h4,',
    'h5,',
    'h6 {',
    '  font-size: inherit;',
    '  font-weight: inherit;',
    '}',
    '',
    'a {',
    '  color: inherit;',
    '  -webkit-text-decoration: inherit;',
    '  text-decoration: inherit;',
    '}',
    '',
    'b,',
    'strong {',
    '  font-weight: bolder;',
    '}',
    '',
    'code,',
    'kbd,',
    'samp,',
    'pre {',
    '  font-family:',
    '    ui-monospace,',
    '    SFMono-Regular,',
    '    Menlo,',
    '    Monaco,',
    '    Consolas,',
    '    "Liberation Mono",',
    '    "Courier New",',
    '    monospace;',
    '  font-feature-settings: normal;',
    '  font-variation-settings: normal;',
    '  font-size: 1em;',
    '}',
    '',
    'small {',
    '  font-size: 80%;',
    '}',
    '',
    'sub,',
    'sup {',
    '  position: relative;',
    '  vertical-align: baseline;',
    '  font-size: 75%;',
    '  line-height: 0;',
    '}',
    '',
    'sub {',
    '  bottom: -0.25em;',
    '}',
    '',
    'sup {',
    '  top: -0.5em;',
    '}',
    '',
    'table {',
    '  text-indent: 0;',
    '  border-color: inherit;',
    '  border-collapse: collapse;',
    '}',
    '',
    ':-moz-focusring {',
    '  outline: auto;',
    '}',
    '',
    'progress {',
    '  vertical-align: baseline;',
    '}',
    '',
    'summary {',
    '  display: list-item;',
    '}',
    '',
    'ol,',
    'ul,',
    'menu {',
    '  list-style: none;',
    '}',
    '',
    'img,',
    'svg,',
    'video,',
    'canvas,',
    'audio,',
    'iframe,',
    'embed,',
    'object {',
    '  display: block;',
    '  vertical-align: middle;',
    '}',
    '',
    'img,',
    'video {',
    '  max-width: 100%;',
    '  height: auto;',
    '}',
    '',
    'button,',
    'input,',
    'select,',
    'optgroup,',
    'textarea,',
    '::file-selector-button {',
    '  font: inherit;',
    '  font-feature-settings: inherit;',
    '  font-variation-settings: inherit;',
    '  letter-spacing: inherit;',
    '  color: inherit;',
    '  border-radius: 0;',
    '  background-color: transparent;',
    '  opacity: 1;',
    '}',
    '',
    ':where(select:is([multiple], [size])) optgroup {',
    '  font-weight: bolder;',
    '}',
    '',
    ':where(select:is([multiple], [size])) optgroup option {',
    '  padding-inline-start: 20px;',
    '}',
    '',
    '::file-selector-button {',
    '  margin-inline-end: 4px;',
    '}',
    '',
    '::placeholder {',
    '  opacity: 1;',
    '  color: color-mix(in oklab, currentcolor 50%, transparent);',
    '}',
    '',
    'textarea {',
    '  resize: vertical;',
    '}',
    '',
    '::-webkit-search-decoration {',
    '  -webkit-appearance: none;',
    '}',
    '',
    '::-webkit-date-and-time-value {',
    '  min-height: 1lh;',
    '  text-align: inherit;',
    '}',
    '',
    '::-webkit-datetime-edit {',
    '  display: inline-flex;',
    '}',
    '',
    '::-webkit-datetime-edit-fields-wrapper {',
    '  padding: 0;',
    '}',
    '',
    '::-webkit-datetime-edit,',
    '::-webkit-datetime-edit-year-field,',
    '::-webkit-datetime-edit-month-field,',
    '::-webkit-datetime-edit-day-field,',
    '::-webkit-datetime-edit-hour-field,',
    '::-webkit-datetime-edit-minute-field,',
    '::-webkit-datetime-edit-second-field,',
    '::-webkit-datetime-edit-millisecond-field,',
    '::-webkit-datetime-edit-meridiem-field {',
    '  padding-block: 0;',
    '}',
    '',
    '::-webkit-calendar-picker-indicator {',
    '  line-height: 1;',
    '}',
    '',
    ':-moz-ui-invalid {',
    '  box-shadow: none;',
    '}',
    '',
    'button,',
    'input:where([type="button"], [type="reset"], [type="submit"]),',
    '::file-selector-button {',
    '  appearance: button;',
    '}',
    '',
    '::-webkit-inner-spin-button,',
    '::-webkit-outer-spin-button {',
    '  height: auto;',
    '}',
    '',
    '[hidden]:where(:not([hidden="until-found"])) {',
    '  display: none !important;',
    '}',
    '',
  ];
}

function createWorkbenchBasicPageCssLines() {
  return [
    'body > #root > main {',
    '  min-height: 100vh;',
    '  display: grid;',
    '  place-items: center;',
    '  padding: clamp(32px, 6vw, 72px);',
    '  color: var(--ds-token-workbench-semantic-color-text-primary, #17202a);',
    '  background: var(--ds-token-workbench-semantic-color-muted-surface, #f6f7f9);',
    '}',
    '',
    'body > #root > main > section {',
    '  width: min(720px, 100%);',
    '  display: grid;',
    '  gap: 18px;',
    '}',
    '',
    'body > #root > main > section > p:first-child {',
    '  margin: 0;',
    '  color: var(--ds-token-workbench-semantic-color-action-primary, #2563eb);',
    '  font-size: 13px;',
    '  font-weight: 700;',
    '  text-transform: uppercase;',
    '}',
    '',
    'body > #root > main h1 {',
    '  margin: 0;',
    '  font-size: clamp(40px, 7vw, 76px);',
    '  line-height: 0.95;',
    '}',
    '',
    'body > #root > main p:not(:first-child) {',
    '  max-width: 620px;',
    '  margin: 0;',
    '  color: var(--ds-token-workbench-semantic-color-muted-text, #64748b);',
    '  font-size: 17px;',
    '  line-height: 1.65;',
    '}',
    '',
    'body > #root > main div {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 10px;',
    '}',
    '',
    'body > #root > main button {',
    '  min-height: 40px;',
    '  border: 1px solid var(--ds-token-workbench-semantic-color-border, #d8dee8);',
    '  border-radius: var(--ds-token-workbench-semantic-radius-surface-md, 8px);',
    '  padding: 0 16px;',
    '  color: #fff;',
    '  background: var(--ds-token-workbench-semantic-color-action-primary, #2563eb);',
    '  font-weight: 700;',
    '}',
    '',
    'body > #root > main button + button {',
    '  color: var(--ds-token-workbench-semantic-color-text-primary, #17202a);',
    '  background: var(--ds-token-workbench-semantic-color-surface, #fff);',
    '}',
    '',
  ];
}

function createWorkbenchShadcnThemeCssLines() {
  return [
    '@custom-variant dark (&:is(.dark *));',
    '',
    '@theme inline {',
    '  --color-background: var(--background);',
    '  --color-foreground: var(--foreground);',
    '  --color-card: var(--card);',
    '  --color-card-foreground: var(--card-foreground);',
    '  --color-popover: var(--popover);',
    '  --color-popover-foreground: var(--popover-foreground);',
    '  --color-primary: var(--primary);',
    '  --color-primary-foreground: var(--primary-foreground);',
    '  --color-secondary: var(--secondary);',
    '  --color-secondary-foreground: var(--secondary-foreground);',
    '  --color-muted: var(--muted);',
    '  --color-muted-foreground: var(--muted-foreground);',
    '  --color-accent: var(--accent);',
    '  --color-accent-foreground: var(--accent-foreground);',
    '  --color-destructive: var(--destructive);',
    '  --color-border: var(--border);',
    '  --color-input: var(--input);',
    '  --color-ring: var(--ring);',
    '  --radius-sm: calc(var(--radius) - 4px);',
    '  --radius-md: calc(var(--radius) - 2px);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) + 4px);',
    ...createWorkbenchTailwindThemeAliasCssDeclarationLines(),
    '}',
    '',
    ':root {',
    ...createWorkbenchShadcnLightTokenAliasCssDeclarationLines(),
    '}',
    '',
    '@layer base {',
    '  * {',
    '    @apply border-border outline-ring/50;',
    '  }',
    '  body {',
    '    @apply bg-background text-foreground;',
    '  }',
    '}',
    '',
  ];
}

function createWorkbenchTailwindThemeAliasCssDeclarationLines() {
  return [
    '  --color-wb-surface: var(--ds-token-workbench-components-surface);',
    '  --color-wb-surface-muted: var(--ds-token-workbench-components-muted);',
    '  --color-wb-border: var(--ds-token-workbench-components-border);',
    '  --color-wb-accent: var(--ds-token-workbench-components-accent);',
    '  --color-wb-accent-hover: var(--ds-token-workbench-components-accent-hover);',
    '  --color-wb-accent-foreground: var(--ds-token-workbench-components-text-color-on-accent);',
    '  --color-wb-destructive: var(--ds-token-workbench-components-destructive);',
    '  --color-wb-text: var(--ds-token-workbench-components-text-color-primary);',
    '  --color-wb-text-muted: var(--ds-token-workbench-components-text-color-muted);',
    '  --radius-wb-sm: var(--ds-token-workbench-components-radius-sm);',
    '  --radius-wb-md: var(--ds-token-workbench-components-radius-md);',
    '  --text-wb-xs: var(--ds-token-workbench-components-font-size-xs);',
    '  --text-wb-sm: var(--ds-token-workbench-components-font-size-sm);',
    '  --text-wb-md: var(--ds-token-workbench-components-font-size-md);',
    '  --text-wb-lg: var(--ds-token-workbench-components-font-size-lg);',
    '  --text-wb-title: var(--ds-token-workbench-components-font-size-title);',
    '  --font-weight-wb-regular: var(--ds-token-workbench-components-font-weight-regular);',
    '  --font-weight-wb-medium: var(--ds-token-workbench-components-font-weight-medium);',
    '  --font-weight-wb-semibold: var(--ds-token-workbench-components-font-weight-semibold);',
    '  --font-weight-wb-bold: var(--ds-token-workbench-components-font-weight-bold);',
    '  --leading-wb-tight: var(--ds-token-workbench-components-line-height-tight);',
    '  --leading-wb-normal: var(--ds-token-workbench-components-line-height-normal);',
    '  --leading-wb-body: var(--ds-token-workbench-components-line-height-body);',
    '  --leading-wb-relaxed: var(--ds-token-workbench-components-line-height-relaxed);',
    '  --shadow-wb-card: var(--ds-token-workbench-components-card-shadow);',
    '  --spacing-wb-button-height-sm: var(--ds-token-workbench-components-button-height-sm);',
    '  --spacing-wb-button-height-md: var(--ds-token-workbench-components-button-height-md);',
    '  --spacing-wb-button-height-lg: var(--ds-token-workbench-components-button-height-lg);',
    '  --spacing-wb-button-padding-x: var(--ds-token-workbench-components-button-padding-x);',
    '  --spacing-wb-card-padding: var(--ds-token-workbench-components-card-padding);',
    '  --spacing-wb-card-gap: var(--ds-token-workbench-components-card-gap);',
    '  --spacing-wb-input-height: var(--ds-token-workbench-components-input-height);',
    '  --spacing-wb-dialog-padding: var(--ds-token-workbench-components-dialog-padding);',
    '  --spacing-wb-popover-padding: var(--ds-token-workbench-components-popover-padding);',
    '  --spacing-wb-dropdown-item-height: var(--ds-token-workbench-components-dropdown-menu-item-height);',
    '  --spacing-wb-tabs-trigger-height: var(--ds-token-workbench-components-tabs-trigger-height);',
    '  --spacing-wb-select-trigger-height: var(--ds-token-workbench-components-select-trigger-height);',
    '  --spacing-wb-checkbox-size: var(--ds-token-workbench-components-checkbox-size);',
    '  --spacing-wb-switch-track-width: var(--ds-token-workbench-components-switch-track-width);',
    '  --spacing-wb-switch-track-height: var(--ds-token-workbench-components-switch-track-height);',
    '  --spacing-wb-avatar-size-md: var(--ds-token-workbench-components-avatar-size-md);',
  ];
}

function createWorkbenchSemanticTailwindThemeAliasCssDeclarationLines() {
  return [
    '  --color-wb-surface: var(--ds-token-workbench-semantic-color-surface);',
    '  --color-wb-surface-muted: var(--ds-token-workbench-semantic-color-muted-surface);',
    '  --color-wb-border: var(--ds-token-workbench-semantic-color-border);',
    '  --color-wb-accent: var(--ds-token-workbench-semantic-color-action-primary);',
    '  --color-wb-accent-hover: var(--ds-token-workbench-semantic-color-action-primary-hover);',
    '  --color-wb-accent-foreground: var(--ds-token-workbench-semantic-color-text-on-action);',
    '  --color-wb-destructive: var(--ds-token-workbench-semantic-color-destructive);',
    '  --color-wb-text: var(--ds-token-workbench-semantic-color-text-primary);',
    '  --color-wb-text-muted: var(--ds-token-workbench-semantic-color-text-muted);',
    '  --radius-wb-sm: var(--ds-token-workbench-semantic-radius-control-sm);',
    '  --radius-wb-md: var(--ds-token-workbench-semantic-radius-surface-md);',
    '  --text-wb-xs: var(--ds-token-workbench-semantic-typography-text-xs-size);',
    '  --text-wb-sm: var(--ds-token-workbench-semantic-typography-text-sm-size);',
    '  --text-wb-md: var(--ds-token-workbench-semantic-typography-text-md-size);',
    '  --text-wb-lg: var(--ds-token-workbench-semantic-typography-body-size);',
    '  --text-wb-title: var(--ds-token-workbench-semantic-typography-title-size);',
    '  --font-weight-wb-regular: var(--ds-token-workbench-semantic-typography-weight-normal);',
    '  --font-weight-wb-medium: var(--ds-token-workbench-semantic-typography-weight-medium);',
    '  --font-weight-wb-semibold: var(--ds-token-workbench-semantic-typography-weight-semibold);',
    '  --font-weight-wb-bold: var(--ds-token-workbench-semantic-typography-weight-bold);',
    '  --leading-wb-tight: var(--ds-token-workbench-semantic-typography-line-tight);',
    '  --leading-wb-normal: var(--ds-token-workbench-semantic-typography-line-normal);',
    '  --leading-wb-body: var(--ds-token-workbench-semantic-typography-line-body);',
    '  --leading-wb-relaxed: var(--ds-token-workbench-semantic-typography-line-relaxed);',
    '  --shadow-wb-card: var(--ds-token-workbench-semantic-effect-shadow-lg);',
    '  --spacing-wb-control-height-sm: var(--ds-token-workbench-semantic-spacing-control-height-sm);',
    '  --spacing-wb-control-height-md: var(--ds-token-workbench-semantic-spacing-control-height-md);',
    '  --spacing-wb-control-height-lg: var(--ds-token-workbench-semantic-spacing-control-height-lg);',
    '  --spacing-wb-control-padding-x-md: var(--ds-token-workbench-semantic-spacing-control-padding-x-md);',
    '  --spacing-wb-surface-padding-md: var(--ds-token-workbench-semantic-spacing-surface-padding-md);',
    '  --spacing-wb-surface-padding-lg: var(--ds-token-workbench-semantic-spacing-surface-padding-lg);',
    '  --spacing-wb-surface-gap-md: var(--ds-token-workbench-semantic-spacing-surface-gap-md);',
  ];
}

function createWorkbenchTailwindCoreTokenAliasCssDeclarationLines() {
  return [
    ...createWorkbenchTailwindPrimitiveThemeAliasCssDeclarationLines(),
    '  --spacing: var(--ds-token-tailwind-primitives-space-1, 0.25rem);',
    '  --radius: var(--ds-token-workbench-semantic-radius-radius, var(--ds-token-tailwind-primitives-theme-radius-light, 0.625rem));',
    '  --radius-none: var(--ds-token-tailwind-primitives-radius-none, 0);',
    '  --radius-sm: calc(var(--radius) * 0.6);',
    '  --radius-md: calc(var(--radius) * 0.8);',
    '  --radius-lg: var(--radius);',
    '  --radius-xl: calc(var(--radius) * 1.4);',
    '  --radius-2xl: calc(var(--radius) * 1.8);',
    '  --radius-3xl: calc(var(--radius) * 2.2);',
    '  --radius-4xl: calc(var(--radius) * 2.6);',
    '  --radius-full: var(--ds-token-tailwind-primitives-radius-full, 9999px);',
    '  --text-xs: var(--ds-token-workbench-semantic-typography-text-xs-size, var(--ds-token-tailwind-primitives-text-xs, 0.75rem));',
    '  --text-sm: var(--ds-token-workbench-semantic-typography-text-sm-size, var(--ds-token-tailwind-primitives-text-sm, 0.875rem));',
    '  --text-base: var(--ds-token-workbench-semantic-typography-text-md-size, var(--ds-token-tailwind-primitives-text-base, 1rem));',
    '  --text-lg: var(--ds-token-workbench-semantic-typography-body-size, var(--ds-token-tailwind-primitives-text-lg, 1.125rem));',
    '  --text-xl: var(--ds-token-tailwind-primitives-text-xl, 1.25rem);',
    '  --text-2xl: var(--ds-token-workbench-semantic-typography-title-size, var(--ds-token-tailwind-primitives-text-2xl, 1.5rem));',
    '  --text-3xl: var(--ds-token-tailwind-primitives-text-3xl, 1.875rem);',
    '  --text-4xl: var(--ds-token-tailwind-primitives-text-4xl, 2.25rem);',
    '  --text-5xl: var(--ds-token-tailwind-primitives-text-5xl, 3rem);',
    '  --text-6xl: var(--ds-token-workbench-semantic-typography-display-size, var(--ds-token-tailwind-primitives-text-6xl, 3.75rem));',
    '  --text-7xl: var(--ds-token-tailwind-primitives-text-7xl, 4.5rem);',
    '  --text-8xl: var(--ds-token-tailwind-primitives-text-8xl, 6rem);',
    '  --text-9xl: var(--ds-token-tailwind-primitives-text-9xl, 8rem);',
    '  --font-weight-thin: var(--ds-token-tailwind-primitives-font-thin, 100);',
    '  --font-weight-extralight: var(--ds-token-tailwind-primitives-font-extralight, 200);',
    '  --font-weight-light: var(--ds-token-tailwind-primitives-font-light, 300);',
    '  --font-weight-normal: var(--ds-token-workbench-semantic-typography-weight-normal, var(--ds-token-tailwind-primitives-font-normal, 400));',
    '  --font-weight-medium: var(--ds-token-workbench-semantic-typography-weight-medium, var(--ds-token-tailwind-primitives-font-medium, 500));',
    '  --font-weight-semibold: var(--ds-token-workbench-semantic-typography-weight-semibold, var(--ds-token-tailwind-primitives-font-semibold, 600));',
    '  --font-weight-bold: var(--ds-token-workbench-semantic-typography-weight-bold, var(--ds-token-tailwind-primitives-font-bold, 700));',
    '  --font-weight-extrabold: var(--ds-token-tailwind-primitives-font-extrabold, 800);',
    '  --font-weight-black: var(--ds-token-tailwind-primitives-font-black, 900);',
    '  --leading-none: var(--ds-token-tailwind-primitives-leading-none, 1);',
    '  --leading-tight: var(--ds-token-workbench-semantic-typography-line-tight, var(--ds-token-tailwind-primitives-leading-tight, 1.25));',
    '  --leading-snug: var(--ds-token-tailwind-primitives-leading-snug, 1.375);',
    '  --leading-normal: var(--ds-token-workbench-semantic-typography-line-normal, var(--ds-token-tailwind-primitives-leading-normal, 1.5));',
    '  --leading-relaxed: var(--ds-token-workbench-semantic-typography-line-relaxed, var(--ds-token-tailwind-primitives-leading-relaxed, 1.625));',
    '  --leading-loose: var(--ds-token-tailwind-primitives-leading-loose, 2);',
    '  --leading-3: var(--ds-token-tailwind-primitives-leading-3, 0.75rem);',
    '  --leading-4: var(--ds-token-tailwind-primitives-leading-4, 1rem);',
    '  --leading-5: var(--ds-token-tailwind-primitives-leading-5, 1.25rem);',
    '  --leading-6: var(--ds-token-tailwind-primitives-leading-6, 1.5rem);',
    '  --leading-7: var(--ds-token-tailwind-primitives-leading-7, 1.75rem);',
    '  --leading-8: var(--ds-token-tailwind-primitives-leading-8, 2rem);',
    '  --leading-9: var(--ds-token-tailwind-primitives-leading-9, 2.25rem);',
    '  --leading-10: var(--ds-token-tailwind-primitives-leading-10, 2.5rem);',
    '  --tracking-tighter: var(--ds-token-tailwind-primitives-tracking-tighter, -0.05em);',
    '  --tracking-tight: var(--ds-token-tailwind-primitives-tracking-tight, -0.025em);',
    '  --tracking-normal: var(--ds-token-tailwind-primitives-tracking-normal, 0em);',
    '  --tracking-wide: var(--ds-token-tailwind-primitives-tracking-wide, 0.025em);',
    '  --tracking-wider: var(--ds-token-tailwind-primitives-tracking-wider, 0.05em);',
    '  --tracking-widest: var(--ds-token-tailwind-primitives-tracking-widest, 0.1em);',
    '  --shadow-sm: var(--ds-token-tailwind-primitives-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));',
    '  --shadow: var(--ds-token-tailwind-primitives-shadow-DEFAULT, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1));',
    '  --shadow-md: var(--ds-token-tailwind-primitives-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));',
    '  --shadow-lg: var(--ds-token-workbench-semantic-effect-shadow-lg, var(--ds-token-tailwind-primitives-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)));',
    '  --shadow-xl: var(--ds-token-workbench-semantic-effect-shadow-xl, var(--ds-token-tailwind-primitives-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)));',
    '  --shadow-2xl: var(--ds-token-tailwind-primitives-shadow-2xl, 0 25px 50px -12px rgb(0 0 0 / 0.25));',
    '  --shadow-inner: var(--ds-token-tailwind-primitives-shadow-inner, inset 0 2px 4px 0 rgb(0 0 0 / 0.05));',
    '  --shadow-none: var(--ds-token-tailwind-primitives-shadow-none, none);',
  ];
}

function createWorkbenchTailwindPrimitiveThemeAliasCssDeclarationLines() {
  return createWorkbenchPrimitiveTokenCollection().tokens.flatMap((token) => {
    const themeVariable = getWorkbenchTailwindPrimitiveThemeVariableName(token);
    const fallback = getWorkbenchTailwindPrimitiveTokenCssFallback(token);
    if (!themeVariable || !fallback) return [];
    return [`  ${themeVariable}: var(--ds-token-tailwind-primitives-${token.id}, ${fallback});`];
  });
}

function getWorkbenchTailwindPrimitiveThemeVariableName(token) {
  const groupId = token.groupId;
  const id = token.id;
  if (!groupId || !id) return null;
  if (groupId.startsWith('colors-')) return `--color-${id}`;
  if (groupId === 'border-radius') return id === 'radius-DEFAULT' ? '--radius' : `--${id}`;
  if (groupId === 'border-width') return id === 'border-DEFAULT' ? '--border-width' : `--border-width-${id.slice('border-'.length)}`;
  if (groupId === 'opacity') return `--${id}`;
  if (groupId === 'font-size') return `--${id}`;
  if (groupId === 'font-weight') return `--font-weight-${id.slice('font-'.length)}`;
  if (groupId === 'line-height') return `--${id}`;
  if (groupId === 'letter-spacing') return `--${id}`;
  if (groupId === 'box-shadow') return id === 'shadow-DEFAULT' ? '--shadow' : `--${id}`;
  if (groupId === 'blur') return id === 'blur-DEFAULT' ? '--blur' : `--${id}`;
  if (groupId === 'screens') return `--breakpoint-${id.slice('screen-'.length)}`;
  if (groupId === 'duration') return `--${id}`;
  if (groupId === 'easing') return `--${id}`;
  return null;
}

function getWorkbenchTailwindPrimitiveTokenCssFallback(token) {
  const value = token.values?.default;
  if (!value || value.kind !== 'raw') return null;
  const rawValue = value.value;
  if (token.type === 'color' && typeof rawValue === 'string') return rawValue;
  if (token.type === 'string' && typeof rawValue === 'string') return rawValue;
  if (token.type === 'number' && typeof rawValue === 'number') return String(rawValue);
  if (token.type === 'dimension' || token.type === 'duration' || token.type === 'angle' || token.type === 'opacity') {
    return formatWorkbenchPrimitiveUnitValue(rawValue);
  }
  return null;
}

function formatWorkbenchPrimitiveUnitValue(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.value !== 'number' || typeof value.unit !== 'string') return null;
  return value.unit ? `${value.value}${value.unit}` : String(value.value);
}

function createWorkbenchShadcnTokenAliasCssLines() {
  return [
    '/* Connect shadcn/Tailwind theme variables to Workbench Token Editor output. */',
    ':root,',
    '[data-theme="light"] {',
    ...createWorkbenchShadcnLightTokenAliasCssDeclarationLines(),
    '}',
    '',
    '[data-theme="dark"],',
    '.dark {',
    ...createWorkbenchShadcnDarkTokenAliasCssDeclarationLines(),
    '}',
    '',
  ];
}

function createWorkbenchShadcnPreviewIconCssLines() {
  return [
    '/* Keep shadcn icon SVGs visible when Workbench uses the copied preview CSS snapshot. */',
    '[data-slot="button"] svg,',
    'svg[data-icon="inline-start"],',
    'svg[data-icon="inline-end"],',
    'svg[data-icon="inline-start"][aria-hidden],',
    'svg[data-icon="inline-end"][aria-hidden] {',
    '  display: inline-block;',
    '  width: 0.875em;',
    '  height: 0.875em;',
    '  flex: 0 0 auto;',
    '  vertical-align: -0.06em;',
    '  color: currentColor;',
    '  stroke: currentColor;',
    '  pointer-events: none;',
    '}',
    '',
  ];
}

function createWorkbenchShadcnLightTokenAliasCssDeclarationLines() {
  return [
    '  --background: var(--ds-token-workbench-semantic-color-background, var(--ds-token-workbench-components-muted, #ffffff));',
    '  --foreground: var(--ds-token-workbench-semantic-color-foreground, var(--ds-token-workbench-components-text-color-primary, #0a0a0a));',
    '  --card: var(--ds-token-workbench-semantic-color-card, var(--ds-token-workbench-components-surface, #ffffff));',
    '  --card-foreground: var(--ds-token-workbench-semantic-color-card-foreground, var(--ds-token-workbench-components-text-color-primary, #0a0a0a));',
    '  --popover: var(--ds-token-workbench-semantic-color-popover, var(--ds-token-workbench-components-surface, #ffffff));',
    '  --popover-foreground: var(--ds-token-workbench-semantic-color-popover-foreground, var(--ds-token-workbench-components-text-color-primary, #0a0a0a));',
    '  --primary: var(--ds-token-workbench-semantic-color-primary, var(--ds-token-workbench-semantic-color-action-primary, var(--ds-token-workbench-components-accent, #171717)));',
    '  --primary-foreground: var(--ds-token-workbench-semantic-color-primary-foreground, var(--ds-token-workbench-semantic-color-text-on-action, var(--ds-token-workbench-components-text-color-on-accent, #fafafa)));',
    '  --secondary: var(--ds-token-workbench-semantic-color-secondary, var(--ds-token-workbench-components-muted, #f5f5f5));',
    '  --secondary-foreground: var(--ds-token-workbench-semantic-color-secondary-foreground, var(--ds-token-workbench-components-text-color-primary, #171717));',
    '  --muted: var(--ds-token-workbench-semantic-color-muted, var(--ds-token-workbench-components-muted, #f5f5f5));',
    '  --muted-foreground: var(--ds-token-workbench-semantic-color-muted-foreground, var(--ds-token-workbench-components-text-color-muted, #737373));',
    '  --accent: var(--ds-token-workbench-semantic-color-accent, var(--ds-token-workbench-semantic-color-action-primary, var(--ds-token-workbench-components-accent, #171717)));',
    '  --accent-foreground: var(--ds-token-workbench-semantic-color-accent-foreground, var(--ds-token-workbench-semantic-color-text-on-action, var(--ds-token-workbench-components-text-color-on-accent, #fafafa)));',
    '  --destructive: var(--ds-token-workbench-semantic-color-destructive, var(--ds-token-workbench-components-destructive, oklch(0.577 0.245 27.325)));',
    '  --border: var(--ds-token-workbench-semantic-color-border, var(--ds-token-workbench-components-border, #e5e5e5));',
    '  --input: var(--ds-token-workbench-semantic-color-input, var(--ds-token-workbench-components-border, #e5e5e5));',
    '  --ring: var(--ds-token-workbench-semantic-color-ring, var(--ds-token-workbench-components-focus-ring, #a3a3a3));',
    ...createWorkbenchTailwindCoreTokenAliasCssDeclarationLines(),
    ...createWorkbenchTailwindThemeAliasCssDeclarationLines(),
    '  --chart-1: var(--ds-token-workbench-semantic-color-chart-1, var(--ds-token-tailwind-primitives-neutral-300, #d4d4d4));',
    '  --chart-2: var(--ds-token-workbench-semantic-color-chart-2, var(--ds-token-tailwind-primitives-neutral-500, #737373));',
    '  --chart-3: var(--ds-token-workbench-semantic-color-chart-3, var(--ds-token-tailwind-primitives-neutral-600, #525252));',
    '  --chart-4: var(--ds-token-workbench-semantic-color-chart-4, var(--ds-token-tailwind-primitives-neutral-700, #404040));',
    '  --chart-5: var(--ds-token-workbench-semantic-color-chart-5, var(--ds-token-tailwind-primitives-neutral-800, #262626));',
    '  --sidebar: var(--ds-token-workbench-semantic-color-sidebar, var(--ds-token-workbench-components-surface, #ffffff));',
    '  --sidebar-foreground: var(--ds-token-workbench-semantic-color-sidebar-foreground, var(--ds-token-workbench-components-text-color-primary, #0a0a0a));',
    '  --sidebar-primary: var(--ds-token-workbench-semantic-color-sidebar-primary, var(--ds-token-workbench-semantic-color-action-primary, var(--ds-token-workbench-components-accent, #171717)));',
    '  --sidebar-primary-foreground: var(--ds-token-workbench-semantic-color-sidebar-primary-foreground, var(--ds-token-workbench-semantic-color-text-on-action, var(--ds-token-workbench-components-text-color-on-accent, #fafafa)));',
    '  --sidebar-accent: var(--ds-token-workbench-semantic-color-sidebar-accent, var(--ds-token-workbench-components-muted, #f5f5f5));',
    '  --sidebar-accent-foreground: var(--ds-token-workbench-semantic-color-sidebar-accent-foreground, var(--ds-token-workbench-components-text-color-primary, #171717));',
    '  --sidebar-border: var(--ds-token-workbench-semantic-color-sidebar-border, var(--ds-token-workbench-components-border, #e5e5e5));',
    '  --sidebar-ring: var(--ds-token-workbench-semantic-color-sidebar-ring, var(--ds-token-workbench-components-focus-ring, #a3a3a3));',
  ];
}

function createWorkbenchShadcnDarkTokenAliasCssDeclarationLines() {
  return [
    '  --background: var(--ds-token-workbench-semantic-color-background, var(--ds-token-tailwind-primitives-neutral-950, #0a0a0a));',
    '  --foreground: var(--ds-token-workbench-semantic-color-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --card: var(--ds-token-workbench-semantic-color-card, var(--ds-token-tailwind-primitives-neutral-900, #171717));',
    '  --card-foreground: var(--ds-token-workbench-semantic-color-card-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --popover: var(--ds-token-workbench-semantic-color-popover, var(--ds-token-tailwind-primitives-neutral-900, #171717));',
    '  --popover-foreground: var(--ds-token-workbench-semantic-color-popover-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --primary: var(--ds-token-workbench-semantic-color-primary, var(--ds-token-workbench-semantic-color-action-primary, var(--ds-token-tailwind-primitives-neutral-200, #e5e5e5)));',
    '  --primary-foreground: var(--ds-token-workbench-semantic-color-primary-foreground, var(--ds-token-workbench-semantic-color-text-on-action, var(--ds-token-tailwind-primitives-neutral-900, #171717)));',
    '  --secondary: var(--ds-token-workbench-semantic-color-secondary, var(--ds-token-tailwind-primitives-neutral-800, #262626));',
    '  --secondary-foreground: var(--ds-token-workbench-semantic-color-secondary-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --muted: var(--ds-token-workbench-semantic-color-muted, var(--ds-token-tailwind-primitives-neutral-800, #262626));',
    '  --muted-foreground: var(--ds-token-workbench-semantic-color-muted-foreground, var(--ds-token-tailwind-primitives-neutral-400, #a3a3a3));',
    '  --accent: var(--ds-token-workbench-semantic-color-accent, var(--ds-token-workbench-semantic-color-action-primary, var(--ds-token-tailwind-primitives-neutral-200, #e5e5e5)));',
    '  --accent-foreground: var(--ds-token-workbench-semantic-color-accent-foreground, var(--ds-token-workbench-semantic-color-text-on-action, var(--ds-token-tailwind-primitives-neutral-900, #171717)));',
    '  --destructive: var(--ds-token-workbench-semantic-color-destructive, oklch(0.704 0.191 22.216));',
    '  --border: var(--ds-token-workbench-semantic-color-border, oklch(1 0 0 / 10%));',
    '  --input: var(--ds-token-workbench-semantic-color-input, oklch(1 0 0 / 15%));',
    '  --ring: var(--ds-token-workbench-semantic-color-ring, var(--ds-token-tailwind-primitives-neutral-500, #737373));',
    ...createWorkbenchTailwindCoreTokenAliasCssDeclarationLines(),
    ...createWorkbenchTailwindThemeAliasCssDeclarationLines(),
    '  --chart-1: var(--ds-token-workbench-semantic-color-chart-1, var(--ds-token-tailwind-primitives-neutral-300, #d4d4d4));',
    '  --chart-2: var(--ds-token-workbench-semantic-color-chart-2, var(--ds-token-tailwind-primitives-neutral-500, #737373));',
    '  --chart-3: var(--ds-token-workbench-semantic-color-chart-3, var(--ds-token-tailwind-primitives-neutral-600, #525252));',
    '  --chart-4: var(--ds-token-workbench-semantic-color-chart-4, var(--ds-token-tailwind-primitives-neutral-700, #404040));',
    '  --chart-5: var(--ds-token-workbench-semantic-color-chart-5, var(--ds-token-tailwind-primitives-neutral-800, #262626));',
    '  --sidebar: var(--ds-token-workbench-semantic-color-sidebar, var(--ds-token-tailwind-primitives-neutral-900, #171717));',
    '  --sidebar-foreground: var(--ds-token-workbench-semantic-color-sidebar-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --sidebar-primary: var(--ds-token-workbench-semantic-color-sidebar-primary, var(--ds-token-tailwind-primitives-blue-700, #1d4ed8));',
    '  --sidebar-primary-foreground: var(--ds-token-workbench-semantic-color-sidebar-primary-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --sidebar-accent: var(--ds-token-workbench-semantic-color-sidebar-accent, var(--ds-token-tailwind-primitives-neutral-800, #262626));',
    '  --sidebar-accent-foreground: var(--ds-token-workbench-semantic-color-sidebar-accent-foreground, var(--ds-token-tailwind-primitives-neutral-50, #fafafa));',
    '  --sidebar-border: var(--ds-token-workbench-semantic-color-sidebar-border, oklch(1 0 0 / 10%));',
    '  --sidebar-ring: var(--ds-token-workbench-semantic-color-sidebar-ring, var(--ds-token-tailwind-primitives-neutral-500, #737373));',
  ];
}

function normalizeWorkbenchProjectTemplateId(templateId) {
  return templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    || templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
    ? templateId
    : WORKBENCH_PROJECT_TEMPLATE_STANDARD;
}

function formatWorkbenchProjectTemplateLabel(templateId) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) return 'shadcn (Vite + Base UI)';
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) return 'Astryx design system';
  return 'Default React + Tailwind';
}

function usesWorkbenchTailwindTemplate(templateId) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_STANDARD
    || normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    || normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX;
}

export function createWorkbenchProjectGuideFiles(options = {}) {
  const templateId = normalizeWorkbenchProjectTemplateId(options.templateId);
  return [
    ['README.md', createWorkbenchProjectReadme(templateId)],
    ['AGENTS.md', createWorkbenchAgentEntrypoint('AGENTS.md')],
    ['CLAUDE.md', createWorkbenchAgentEntrypoint('CLAUDE.md')],
    [WORKBENCH_PROJECT_AGENT_GUIDE_FILE, createWorkbenchProjectAgentGuide(templateId)],
    [WORKBENCH_COMPONENT_AGENT_GUIDE_FILE, createWorkbenchComponentAuthoringGuide(templateId)],
    [WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE, createWorkbenchOrganizationalContextGuide()],
    ...createWorkbenchProjectAgentSkillFiles(templateId),
  ];
}

export function createWorkbenchProjectSampleFiles(options = {}) {
  normalizeWorkbenchProjectTemplateId(options.templateId);
  return [];
}

function createWorkbenchProjectAgentSkillFiles(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return [
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchProjectDesignAuthoringSkill(normalizedTemplateId),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/agents/openai.yaml`,
      createWorkbenchProjectSkillOpenAiYaml({
        displayName: 'Workbench Design Authoring',
        shortDescription: 'Create distinctive, editable Workbench experiences.',
        defaultPrompt: 'Use $workbench-design-authoring to turn this product or service brief into a distinctive, editable Workbench design.',
      }),
    ],
    [
      `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchClaudeDesignAuthoringSkillWrapper(),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchProjectAuthoringSkill(normalizedTemplateId),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/agents/openai.yaml`,
      createWorkbenchProjectSkillOpenAiYaml({
        displayName: 'Workbench Project Authoring',
        shortDescription: 'Edit Workbench local project source while preserving editability.',
        defaultPrompt: 'Use $workbench-project-authoring to modify this Workbench local project safely.',
      }),
    ],
    [
      `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchClaudeProjectSkillWrapper({
        skillName: WORKBENCH_PROJECT_AUTHORING_SKILL,
        title: 'Workbench Project Authoring',
        description: 'Edit Workbench local project source while preserving project ownership, preview behavior, and editability.',
      }),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchProjectComponentAuthoringSkill(normalizedTemplateId),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/agents/openai.yaml`,
      createWorkbenchProjectSkillOpenAiYaml({
        displayName: 'Workbench Project Component Authoring',
        shortDescription: 'Create or repair editable Workbench project components.',
        defaultPrompt: 'Use $workbench-project-component-authoring to edit this Workbench project component contract.',
      }),
    ],
    [
      `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/SKILL.md`,
      createWorkbenchClaudeProjectSkillWrapper({
        skillName: WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
        title: 'Workbench Project Component Authoring',
        description: 'Create, edit, or repair Workbench project component, story, prop, and sourceInsert contracts.',
      }),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/SKILL.md`,
      createWorkbenchProjectPreviewRuntimeSkill(normalizedTemplateId),
    ],
    [
      `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/agents/openai.yaml`,
      createWorkbenchProjectSkillOpenAiYaml({
        displayName: 'Workbench Project Preview Runtime',
        shortDescription: 'Debug Workbench local project preview, CSS, assets, and stories.',
        defaultPrompt: 'Use $workbench-project-preview-runtime to debug this Workbench project preview or styling issue.',
      }),
    ],
    [
      `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/SKILL.md`,
      createWorkbenchClaudeProjectSkillWrapper({
        skillName: WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
        title: 'Workbench Project Preview Runtime',
        description: 'Debug Workbench project preview, CSS, asset, font, portal, and story-runtime failures.',
      }),
    ],
  ];
}

export function createDefaultWorkbenchPage() {
  return {
    id: WORKBENCH_DEFAULT_PAGE_ID,
    name: WORKBENCH_DEFAULT_PAGE_NAME,
    route: WORKBENCH_DEFAULT_PAGE_ROUTE,
    sourceFile: WORKBENCH_DEFAULT_PAGE_SOURCE_FILE,
    rootNodeId: 'source:untitled-page:root',
    status: 'draft',
    extensions: {},
  };
}

function createWorkbenchShadcnCatalogPage() {
  return {
    id: WORKBENCH_SHADCN_CATALOG_PAGE_ID,
    name: WORKBENCH_SHADCN_CATALOG_PAGE_NAME,
    route: WORKBENCH_SHADCN_CATALOG_PAGE_ROUTE,
    sourceFile: WORKBENCH_SHADCN_CATALOG_PAGE_SOURCE_FILE,
    rootNodeId: 'source:components-catalog:root',
    status: 'draft',
    extensions: {},
  };
}

function createWorkbenchShadcnDashboardPage() {
  return {
    id: WORKBENCH_SHADCN_DASHBOARD_PAGE_ID,
    name: WORKBENCH_SHADCN_DASHBOARD_PAGE_NAME,
    route: WORKBENCH_SHADCN_DASHBOARD_PAGE_ROUTE,
    sourceFile: WORKBENCH_SHADCN_DASHBOARD_PAGE_SOURCE_FILE,
    rootNodeId: 'source:saas-dashboard:root',
    status: 'draft',
    extensions: {},
  };
}

function createWorkbenchAstryxSamplePages() {
  return [
    {
      id: 'page-astryx-comp-gallery',
      name: 'Comp Gallery',
      route: '/comp-gallery',
      sourceFile: WORKBENCH_ASTRYX_COMP_GALLARY_PAGE_SOURCE_FILE,
      rootNodeId: 'source:astryx-comp-gallery:root',
      status: 'draft',
      extensions: {},
    },
    {
      id: 'page-astryx-music-sample',
      name: 'Music Sample',
      route: '/music-sample',
      sourceFile: WORKBENCH_ASTRYX_MUSIC_SAMPLE_PAGE_SOURCE_FILE,
      rootNodeId: 'source:astryx-music-sample:root',
      status: 'draft',
      extensions: {},
    },
  ];
}

export function createWorkbenchConfig({ projectId, projectName, createdAt, templateId }) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return {
    schemaVersion: WORKBENCH_SCHEMA_VERSION,
    projectId,
    projectName,
    createdAt,
    updatedAt: createdAt,
    workbench: {
      app: WORKBENCH_APP_ID,
      installMode: 'local-project',
      devCommand: WORKBENCH_DEFAULT_DEV_COMMAND,
    },
    paths: {
      assets: '.workbench/assets.json',
      notes: '.workbench/notes.json',
      tokens: '.workbench/tokens.json',
      tokenCss: WORKBENCH_DEFAULT_TOKEN_CSS_FILE,
      pages: '.workbench/pages.json',
      components: '.workbench/components.json',
      comments: '.workbench/notes.json',
      selection: '.workbench/selection.json',
      workspaceState: '.workbench/workspace-state.json',
      history: '.workbench/history.json',
    },
    capabilities: {
      localFiles: true,
      codexDesktopPreview: true,
      optionalCloudSync: false,
    },
    extensions: {
      projectTemplate: createWorkbenchProjectTemplateExtension(normalizedTemplateId),
      ...(usesWorkbenchTailwindTemplate(normalizedTemplateId) ? {
        tailwind: {
          enabled: true,
          ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
            ? {
                provider: 'astryx',
                sourceCss: 'src/astryx.source.css',
                compiledCss: 'src/astryx.css',
              }
            : {
                sourceCss: WORKBENCH_DEFAULT_SITE_CSS_FILE,
                compiledCss: normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
                  ? WORKBENCH_SHADCN_BASE_COMPILED_CSS_FILE
                  : WORKBENCH_DEFAULT_TAILWIND_COMPILED_CSS_FILE,
              }),
          tokenCss: WORKBENCH_DEFAULT_TOKEN_CSS_FILE,
        },
      } : {}),
    },
  };
}

function createWorkbenchProjectTemplateExtension(templateId) {
  if (templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    return {
      id: templateId,
      label: 'Astryx',
      basis: 'React source with Astryx components, themes, tokens, and local visual samples',
    };
  }
  if (templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) {
    return {
      id: templateId,
      label: 'shadcn',
      basis: 'Vite project with Base UI based shadcn-style components',
    };
  }
  return {
    id: WORKBENCH_PROJECT_TEMPLATE_STANDARD,
    label: 'Default',
    basis: 'React source with Workbench tokens and Tailwind utilities',
  };
}

export function createInitialTokenRegistry(options = {}) {
  const templateId = normalizeWorkbenchProjectTemplateId(options.templateId);
  if (templateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    const registry = readWorkbenchAstryxRegistrySnapshot('tokens.json');
    if (registry) return registry;
  }
  return {
    schemaVersion: WORKBENCH_SCHEMA_VERSION,
    collections: createWorkbenchBundledTokenCollections(templateId),
    extensions: {
      bundledComponentSet: {
        id: 'workbench-starter-components',
        name: 'Workbench Starter Components',
        source: templateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? 'shadcn-inspired' : 'none',
      },
    },
  };
}

export function createInitialAssetRegistry({ createdAt, templateId }) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    const registry = readWorkbenchAstryxRegistrySnapshot('assets.json');
    if (registry) {
      return {
        ...registry,
        assets: Array.isArray(registry.assets)
          ? registry.assets.map((asset) => ({ ...asset, createdAt, updatedAt: createdAt }))
          : [],
      };
    }
  }
  const iconAssetId = 'asset-lucide-preview';
  const publicSansAssetId = 'asset-public-sans-variable';
  const defaultFontAssetId = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    ? publicSansAssetId
    : null;
  const fontAssets = normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
    ? [{
      id: publicSansAssetId,
      name: 'Public Sans Variable',
      kind: 'font',
      source: {
        type: 'project-file',
        value: '/workbench-assets/fonts/public-sans/public-sans-latin-wght-normal.woff2',
        filePath: 'public/workbench-assets/fonts/public-sans/public-sans-latin-wght-normal.woff2',
      },
      fileName: 'public-sans-latin-wght-normal.woff2',
      mimeType: 'font/woff2',
      size: 26832,
      tags: ['font', 'variable', 'public-sans'],
      createdAt,
      updatedAt: createdAt,
      extensions: {
        fontFamily: 'Public Sans Variable',
        fontStyle: 'normal',
        fontWeight: '100 900',
        license: 'SIL Open Font License 1.1',
        licenseFile: 'public/workbench-assets/fonts/public-sans/OFL-1.1.txt',
        sourcePackage: '@fontsource-variable/public-sans',
      },
    }]
    : [];
  return {
    schemaVersion: WORKBENCH_SCHEMA_VERSION,
    assets: [
      ...fontAssets,
      {
        id: iconAssetId,
        name: 'Lucide',
        kind: 'icon',
        source: {
          type: 'project-file',
          value: '/workbench-assets/icons/lucide-preview/sparkles.svg',
          filePath: 'public/workbench-assets/icons/lucide-preview/sparkles.svg',
        },
        fileName: 'lucide-preview.svg-set',
        mimeType: 'image/svg+xml',
        size: 0,
        tags: ['icon', 'icon-set', 'lucide'],
        createdAt,
        updatedAt: createdAt,
        extensions: {
          sourcePackage: 'lucide-react',
          previewIcons: createWorkbenchLucidePreviewIcons(),
        },
      },
    ],
    extensions: {
      assetDefaults: {
        fonts: {
          bodyAssetId: defaultFontAssetId,
          headingAssetId: defaultFontAssetId,
          sansAssetId: defaultFontAssetId,
          serifAssetId: null,
          monoAssetId: null,
        },
        iconAssetId,
      },
    },
  };
}

function createWorkbenchLucidePreviewIcons() {
  return getWorkbenchLucidePreviewIconSourceFiles().map((sourceFile) => ({
    importName: createWorkbenchLucideImportName(sourceFile),
    name: createWorkbenchLucideDisplayName(sourceFile),
    sourceFile,
    value: `/workbench-assets/icons/lucide-preview/${sourceFile}`,
  }));
}

function createWorkbenchShadcnBaseSourceFiles() {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  if (!templateRoot) {
    return [
      ...createWorkbenchBundledComponentSourceFiles(),
      ...createWorkbenchLucidePreviewIconFiles(),
    ];
  }

  return [
    ...WORKBENCH_SHADCN_BASE_SOURCE_DIRS.flatMap((relativeDir) =>
      readWorkbenchTemplateDirectoryTextFiles(templateRoot, relativeDir, WORKBENCH_SHADCN_BASE_TEXT_EXTENSIONS)
    ),
    ...createWorkbenchShadcnBaseCompiledCssFile(templateRoot),
    ...readWorkbenchTemplateDirectoryTextFiles(
      templateRoot,
      'public/workbench-assets/icons',
      WORKBENCH_SHADCN_BASE_ASSET_EXTENSIONS
    ),
    ...readWorkbenchTemplateDirectoryBinaryFiles(
      templateRoot,
      'public/workbench-assets/fonts',
      WORKBENCH_SHADCN_BASE_FONT_BINARY_EXTENSIONS
    ),
    ...readWorkbenchTemplateDirectoryTextFiles(
      templateRoot,
      'public/workbench-assets/fonts',
      WORKBENCH_SHADCN_BASE_FONT_TEXT_EXTENSIONS
    ),
    ...createWorkbenchLucidePreviewIconFiles(),
  ];
}

function createWorkbenchAstryxSourceFiles() {
  const templateRoot = getWorkbenchAstryxTemplateProjectRoot();
  if (!templateRoot) return [];

  return [
    ...WORKBENCH_ASTRYX_SOURCE_DIRS.flatMap((relativeDir) =>
      readWorkbenchTemplateDirectoryTextFiles(templateRoot, relativeDir, WORKBENCH_ASTRYX_TEXT_EXTENSIONS)
    ),
    ...[
      'src/astryx.css',
      'src/astryx.source.css',
      'src/astryx.tailwind-theme.css',
      'src/astryx.theme-overrides.css',
      'src/workbench-tokens.css',
      WORKBENCH_ASTRYX_COMP_GALLARY_PAGE_SOURCE_FILE,
      WORKBENCH_ASTRYX_MUSIC_SAMPLE_PAGE_SOURCE_FILE,
    ].map((relativePath) => [relativePath, readFileSync(join(templateRoot, relativePath), 'utf8')]),
    ...readWorkbenchTemplateDirectoryBinaryFiles(
      templateRoot,
      'public/workbench-assets/images/album-samples',
      WORKBENCH_ASTRYX_ASSET_EXTENSIONS
    ),
    ...createWorkbenchLucidePreviewIconFiles(),
  ];
}

function getWorkbenchShadcnBaseTemplateProjectRoot() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(moduleDir, '..', ...WORKBENCH_SHADCN_BASE_TEMPLATE_PATH),
    join(moduleDir, ...WORKBENCH_SHADCN_BASE_TEMPLATE_PATH),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function getWorkbenchAstryxTemplateProjectRoot() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(moduleDir, '..', ...WORKBENCH_ASTRYX_TEMPLATE_PATH),
    join(moduleDir, ...WORKBENCH_ASTRYX_TEMPLATE_PATH),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function readWorkbenchAstryxRegistrySnapshot(fileName) {
  return readWorkbenchTemplateRegistrySnapshot(getWorkbenchAstryxTemplateProjectRoot(), fileName);
}

function readWorkbenchTemplateRegistrySnapshot(templateRoot, fileName) {
  if (!templateRoot) return null;

  try {
    return JSON.parse(readFileSync(join(templateRoot, '.workbench', fileName), 'utf8'));
  } catch {
    return null;
  }
}

function readWorkbenchShadcnBaseTemplatePackageJson() {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  if (!templateRoot) return null;

  try {
    return JSON.parse(readFileSync(join(templateRoot, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
}

function createWorkbenchShadcnBaseDependencyMap() {
  const packageJson = readWorkbenchShadcnBaseTemplatePackageJson();
  if (packageJson?.dependencies && typeof packageJson.dependencies === 'object') {
    const dependencies = { ...packageJson.dependencies };
    delete dependencies.react;
    delete dependencies['react-dom'];
    return dependencies;
  }

  return {
    '@dnd-kit/core': '^6.3.1',
    '@dnd-kit/modifiers': '^9.0.0',
    '@dnd-kit/sortable': '^10.0.0',
    '@dnd-kit/utilities': '^3.2.2',
    '@fontsource-variable/public-sans': '^5.2.7',
    '@remixicon/react': '^4.9.0',
    '@shadcn/react': '^0.2.0',
    '@tanstack/react-table': '^8.21.3',
    cmdk: '^1.1.1',
    'date-fns': '^4.4.0',
    'embla-carousel-react': '^8.6.0',
    'input-otp': '^1.4.2',
    'next-themes': '^0.4.6',
    'react-day-picker': '^10.0.1',
    'react-resizable-panels': '^4.11.2',
    'react-is': '^19.2.7',
    recharts: '^3.8.1',
    vaul: '^1.1.2',
    zod: '^4.4.3',
  };
}

function createWorkbenchShadcnBaseSiteCss() {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  if (!templateRoot) return null;

  try {
    const css = readFileSync(join(templateRoot, 'src', 'index.css'), 'utf8');
    const withWorkbenchShadcnCss = css
      .replace('@import "shadcn/tailwind.css";', createWorkbenchShadcnBaseTailwindCss());
    const withWorkbenchTailwindThemeAliases = insertWorkbenchTailwindThemeAliases(withWorkbenchShadcnCss);
    return [
      withWorkbenchTailwindThemeAliases.trimEnd(),
      '',
      ...createWorkbenchShadcnTokenAliasCssLines(),
      ...createWorkbenchShadcnPreviewIconCssLines(),
      'html,',
      'body,',
      '#root {',
      '  min-width: 320px;',
      '  min-height: 100%;',
      '  margin: 0;',
      '}',
      '',
      '#root {',
      '  min-height: 100vh;',
      '}',
      '',
    ].join('\n');
  } catch {
    return null;
  }
}

function insertWorkbenchTailwindThemeAliases(css) {
  const marker = '@theme inline';
  const markerIndex = css.indexOf(marker);
  if (markerIndex === -1 || css.includes('--color-wb-surface:')) return css;
  const openIndex = css.indexOf('{', markerIndex);
  if (openIndex === -1) return css;

  let depth = 0;
  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth !== 0) continue;

    const aliases = createWorkbenchTailwindThemeAliasCssDeclarationLines()
      .map((line) => (line ? `  ${line.trim()}` : line))
      .join('\n');
    return `${css.slice(0, index).trimEnd()}\n${aliases}\n${css.slice(index)}`;
  }

  return css;
}

function createWorkbenchShadcnBaseTailwindCss() {
  return [
    '@theme inline {',
    '  @keyframes accordion-down {',
    '    from {',
    '      height: 0;',
    '    }',
    '    to {',
    '      height: var(--radix-accordion-content-height, var(--accordion-panel-height, auto));',
    '    }',
    '  }',
    '',
    '  @keyframes accordion-up {',
    '    from {',
    '      height: var(--radix-accordion-content-height, var(--accordion-panel-height, auto));',
    '    }',
    '    to {',
    '      height: 0;',
    '    }',
    '  }',
    '}',
    '',
    '@custom-variant data-open {',
    '  &:where([data-state="open"]),',
    '  &:where([data-open]:not([data-open="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-closed {',
    '  &:where([data-state="closed"]),',
    '  &:where([data-closed]:not([data-closed="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-checked {',
    '  &:where([data-state="checked"]),',
    '  &:where([data-checked]:not([data-checked="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-unchecked {',
    '  &:where([data-state="unchecked"]),',
    '  &:where([data-unchecked]:not([data-unchecked="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-selected {',
    '  &:where([data-selected="true"]) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-disabled {',
    '  &:where([data-disabled="true"]),',
    '  &:where([data-disabled]:not([data-disabled="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-active {',
    '  &:where([data-state="active"]),',
    '  &:where([data-active]:not([data-active="false"])) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-horizontal {',
    '  &:where([data-orientation="horizontal"]) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@custom-variant data-vertical {',
    '  &:where([data-orientation="vertical"]) {',
    '    @slot;',
    '  }',
    '}',
    '',
    '@utility no-scrollbar {',
    '  -ms-overflow-style: none;',
    '  scrollbar-width: none;',
    '',
    '  &::-webkit-scrollbar {',
    '    display: none;',
    '  }',
    '}',
  ].join('\n');
}

function createWorkbenchShadcnBaseCompiledCssFile(templateRoot) {
  const relativePath = WORKBENCH_SHADCN_BASE_COMPILED_CSS_FILE;
  const absolutePath = join(templateRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return [[relativePath, createInitialWorkbenchTailwindCompiledCss(WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE)]];
  }

  const css = readFileSync(absolutePath, 'utf8');
  return [[relativePath, createWorkbenchDesignPreviewCssSnapshot(css, WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE)]];
}

function createWorkbenchDesignPreviewCssSnapshot(css, templateId) {
  const normalizedCss = String(css ?? '').replace(/\r\n?/g, '\n').trimEnd();
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const header = [
    '/*',
    ' * Workbench design-preview CSS snapshot.',
    ' * Project creation copies this file instead of waiting for a Tailwind build.',
    ` * Template: ${normalizedTemplateId}`,
    ' */',
    '',
  ].join('\n');
  if (!normalizedCss) return appendWorkbenchShadcnPreviewCssAdditions(header, normalizedTemplateId);
  if (normalizedCss.startsWith('/*') && normalizedCss.includes('Workbench design-preview CSS snapshot')) {
    return appendWorkbenchShadcnPreviewCssAdditions(normalizedCss, normalizedTemplateId);
  }
  return appendWorkbenchShadcnPreviewCssAdditions(`${header}${normalizedCss}`, normalizedTemplateId);
}

function appendWorkbenchShadcnPreviewCssAdditions(css, templateId) {
  if (templateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) return `${css}\n`;

  const additions = [];
  if (!css.includes('Connect shadcn/Tailwind theme variables to Workbench Token Editor output.')) {
    additions.push(createWorkbenchShadcnTokenAliasCssLines().join('\n'));
  }
  if (!css.includes('svg[data-icon="inline-start"][aria-hidden]') && !css.includes('svg[data-icon=inline-start][aria-hidden]')) {
    additions.push(createWorkbenchShadcnPreviewIconCssLines().join('\n'));
  }
  return additions.length > 0
    ? `${css}\n${additions.join('\n')}\n`
    : `${css}\n`;
}

function readWorkbenchTemplateDirectoryTextFiles(templateRoot, relativeDir, allowedExtensions) {
  const absoluteDir = join(templateRoot, relativeDir);
  if (!existsSync(absoluteDir)) return [];

  const files = [];
  const visit = (currentDir) => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const extension = extname(entry.name).toLowerCase();
      if (!allowedExtensions.has(extension)) continue;

      const relativePath = normalizeWorkbenchTemplateRelativePath(relative(templateRoot, absolutePath));
      files.push([relativePath, readFileSync(absolutePath, 'utf8')]);
    }
  };

  visit(absoluteDir);
  return files.sort(([left], [right]) => left.localeCompare(right));
}

function readWorkbenchTemplateDirectoryBinaryFiles(templateRoot, relativeDir, allowedExtensions) {
  const absoluteDir = join(templateRoot, relativeDir);
  if (!existsSync(absoluteDir)) return [];

  const files = [];
  const visit = (currentDir) => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || !allowedExtensions.has(extname(entry.name).toLowerCase())) continue;
      const relativePath = normalizeWorkbenchTemplateRelativePath(relative(templateRoot, absolutePath));
      files.push([relativePath, readFileSync(absolutePath)]);
    }
  };

  visit(absoluteDir);
  return files.sort(([left], [right]) => left.localeCompare(right));
}

function readWorkbenchTemplateTextFiles(templateRoot, relativePaths) {
  return relativePaths.flatMap((relativePath) => {
    const absolutePath = join(templateRoot, relativePath);
    if (!existsSync(absolutePath)) return [];
    return [[relativePath, readFileSync(absolutePath, 'utf8')]];
  });
}

function normalizeWorkbenchTemplateRelativePath(path) {
  return sep === '/' ? path : path.split(sep).join('/');
}

function dedupeWorkbenchProjectFileEntries(entries) {
  const fileMap = new Map();
  for (const entry of entries) {
    fileMap.set(entry[0], entry);
  }
  return [...fileMap.values()];
}

function createWorkbenchBundledComponentSourceFiles() {
  const sourceDir = getWorkbenchBundledComponentTemplateDir();
  if (!sourceDir) {
    return createLegacyWorkbenchBundledComponentSourceFiles();
  }
  return WORKBENCH_BUNDLED_COMPONENT_TEMPLATE_FILES.map((fileName) => [
    `${WORKBENCH_BUNDLED_COMPONENT_DIR}/${fileName}`,
    readFileSync(join(sourceDir, fileName), 'utf8'),
  ]);
}

function createLegacyWorkbenchBundledComponentSourceFiles() {
  return [
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Button.tsx`, createWorkbenchBundledButtonSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Button.stories.tsx`, createWorkbenchBundledButtonStoriesSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Card.tsx`, createWorkbenchBundledCardSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Card.stories.tsx`, createWorkbenchBundledCardStoriesSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Icon.tsx`, createWorkbenchBundledIconSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Icon.stories.tsx`, createWorkbenchBundledIconStoriesSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Input.tsx`, createWorkbenchBundledInputSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/Input.stories.tsx`, createWorkbenchBundledInputStoriesSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/index.ts`, createWorkbenchBundledComponentIndexSource()],
    [`${WORKBENCH_BUNDLED_COMPONENT_DIR}/local.css`, createWorkbenchBundledComponentCss()],
  ];
}

function getWorkbenchBundledComponentTemplateDir() {
  const candidate = join(dirname(fileURLToPath(import.meta.url)), 'workbench-starter', 'components');
  return existsSync(candidate) ? candidate : null;
}

function createWorkbenchLucidePreviewIconFiles() {
  return getWorkbenchLucidePreviewIconSourceFiles().map((sourceFile) => [
    `${WORKBENCH_LUCIDE_PREVIEW_ICON_DIR}/${sourceFile}`,
    getWorkbenchLucidePreviewIconSvg(sourceFile),
  ]);
}

function getWorkbenchLucidePreviewIconSourceFiles() {
  const iconDir = getWorkbenchLucidePreviewIconSourceDir();
  if (!iconDir) return Object.keys(WORKBENCH_LUCIDE_PREVIEW_ICON_SVGS).sort();
  return readdirSync(iconDir)
    .filter((fileName) => fileName.endsWith('.svg'))
    .sort((left, right) => left.localeCompare(right));
}

function getWorkbenchLucidePreviewIconSvg(sourceFile) {
  const iconDir = getWorkbenchLucidePreviewIconSourceDir();
  if (iconDir) {
    const iconPath = join(iconDir, sourceFile);
    if (existsSync(iconPath)) return readFileSync(iconPath, 'utf8');
  }
  return WORKBENCH_LUCIDE_PREVIEW_ICON_SVGS[sourceFile] ?? WORKBENCH_LUCIDE_PREVIEW_ICON_SVGS['sparkles.svg'];
}

function getWorkbenchLucidePreviewIconSourceDir() {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), '..', WORKBENCH_LUCIDE_PREVIEW_ICON_DIR),
    join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'workbench-assets', 'icons', 'lucide-preview'),
    join(dirname(fileURLToPath(import.meta.url)), WORKBENCH_LUCIDE_PREVIEW_ICON_DIR),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function createWorkbenchLucideImportName(sourceFile) {
  return sourceFile
    .replace(/\.svg$/i, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => /^[0-9]/.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function createWorkbenchLucideDisplayName(sourceFile) {
  return sourceFile
    .replace(/\.svg$/i, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const WORKBENCH_LUCIDE_PREVIEW_ICON_SVGS = {
  'arrow-right.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14"/>
  <path d="m12 5 7 7-7 7"/>
</svg>
`,
  'check.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 6 9 17l-5-5"/>
</svg>
`,
  'chevron-down.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m6 9 6 6 6-6"/>
</svg>
`,
  'loader-circle.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
</svg>
`,
  'menu.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 5h16"/>
  <path d="M4 12h16"/>
  <path d="M4 19h16"/>
</svg>
`,
  'plus.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14"/>
  <path d="M12 5v14"/>
</svg>
`,
  'search.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m21 21-4.34-4.34"/>
  <circle cx="11" cy="11" r="8"/>
</svg>
`,
  'settings.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
`,
  'sparkles.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
  <path d="M20 2v4"/>
  <path d="M22 4h-4"/>
  <circle cx="4" cy="20" r="2"/>
</svg>
`,
  'x.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 6 6 18"/>
  <path d="m6 6 12 12"/>
</svg>
`,
};

export function createInitialWorkbenchTokenCss(options = {}) {
  const registry = options.registry ?? createInitialTokenRegistry({ templateId: options.templateId });
  const lines = [
    '/* Generated by Workbench from .workbench/tokens.json. Do not edit by hand. */',
    '',
    // Token-mode scope roots re-declare alias var() chains so nested theme
    // scopes resolve them with their own mode (mirrors cssExport.ts).
    ':root,',
    '[data-wb-token-modes] {',
  ];

  for (const collection of registry.collections) {
    for (const token of collection.tokens) {
      const activeMode = collection.activeMode ?? collection.modes[0]?.id ?? 'default';
      const value = token.values[activeMode] ?? token.values.default ?? Object.values(token.values)[0];
      const cssValue = serializeWorkbenchTokenCssValue(value);
      if (!cssValue) continue;
      lines.push(`  --ds-token-${collection.id}-${token.id}: ${cssValue};`);
    }
  }

  lines.push('}', '');
  return lines.join('\n');
}

function serializeWorkbenchTokenCssValue(value) {
  if (!value) return null;
  if (value.kind === 'ref') return `var(--ds-token-${value.collectionId}-${value.tokenId})`;
  if (value.kind !== 'raw') return null;
  const raw = value.value;
  if (raw && typeof raw === 'object' && typeof raw.value === 'number' && typeof raw.unit === 'string') {
    return `${raw.value}${raw.unit}`;
  }
  return String(raw);
}

function createLegacyInitialWorkbenchTokenCss() {
  return [
    '/* Generated by Workbench from .workbench/tokens.json. Do not edit by hand. */',
    '',
    ':root {',
    '  --ds-token-workbench-components-accent: #2563eb;',
    '  --ds-token-workbench-components-accent-foreground: #ffffff;',
    '  --ds-token-workbench-components-accent-hover: #1d4ed8;',
    '  --ds-token-workbench-components-border: #d8dee8;',
    '  --ds-token-workbench-components-button-height-lg: 44px;',
    '  --ds-token-workbench-components-button-height-md: 38px;',
    '  --ds-token-workbench-components-button-height-sm: 32px;',
    '  --ds-token-workbench-components-button-padding-x: 16px;',
    '  --ds-token-workbench-components-card-gap: 16px;',
    '  --ds-token-workbench-components-card-padding: 24px;',
    '  --ds-token-workbench-components-card-shadow: 0 16px 44px rgba(15, 23, 42, 0.12);',
    '  --ds-token-workbench-components-destructive: #dc2626;',
    '  --ds-token-workbench-components-destructive-hover: #b91c1c;',
    '  --ds-token-workbench-components-focus-ring: #93c5fd;',
    '  --ds-token-workbench-components-input-height: 40px;',
    '  --ds-token-workbench-components-muted: #f6f7f9;',
    '  --ds-token-workbench-components-muted-foreground: #64748b;',
    '  --ds-token-workbench-components-radius-md: 8px;',
    '  --ds-token-workbench-components-radius-sm: 6px;',
    '  --ds-token-workbench-components-ring-offset: 2px;',
    '  --ds-token-workbench-components-surface: #ffffff;',
    '  --ds-token-workbench-components-text: #17202a;',
    '}',
    '',
  ].join('\n');
}

export function createInitialComponentRegistry({ createdAt, templateId }) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    const registry = readWorkbenchAstryxRegistrySnapshot('components.json');
    if (registry) {
      const libraries = registry.extensions?.libraries ?? {};
      return {
        ...registry,
        extensions: {
          ...(registry.extensions ?? {}),
          libraries: {
            ...libraries,
            local: {
              ...(libraries.local ?? {}),
              id: 'local',
              name: 'Astryx local components',
              kind: 'project-local',
              sourcePath: WORKBENCH_BUNDLED_COMPONENT_DIR,
              snapshotRoot: 'src',
              updatePolicy: 'manual',
              mergePolicy: 'project-wins',
              createdAt,
              updatedAt: createdAt,
            },
          },
        },
      };
    }
  }
  if (normalizedTemplateId !== WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) {
    return {
      schemaVersion: WORKBENCH_SCHEMA_VERSION,
      components: [],
      extensions: {},
    };
  }

  const shadcnBaseRegistry = createWorkbenchShadcnBaseComponentRegistry({ createdAt });
  if (shadcnBaseRegistry) return shadcnBaseRegistry;

  return {
    schemaVersion: WORKBENCH_SCHEMA_VERSION,
    components: createWorkbenchBundledComponentRegistryEntries(),
    extensions: {
      libraries: {
        local: {
          id: 'local',
          name: 'Local Library',
          kind: 'project-local',
          sourcePath: WORKBENCH_BUNDLED_COMPONENT_DIR,
          snapshotRoot: 'src',
          updatePolicy: 'manual',
          mergePolicy: 'project-wins',
          createdAt,
          updatedAt: createdAt,
        },
      },
    },
  };
}

function createWorkbenchShadcnBaseComponentRegistry({ createdAt }) {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  if (!templateRoot) return null;

  let registry = {};
  try {
    const registryPath = join(templateRoot, '.workbench', 'components.json');
    if (existsSync(registryPath)) {
      registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    }
  } catch {
    registry = {};
  }

  const seedComponents = Array.isArray(registry.components)
    ? registry.components.filter((component) => typeof component?.sourceFile === 'string'
      && component.sourceFile.startsWith('src/components/ui/'))
    : [];
  const components = createWorkbenchShadcnBaseAugmentedComponents(templateRoot, seedComponents);
  if (components.length === 0) return null;

  return {
    schemaVersion: WORKBENCH_SCHEMA_VERSION,
    components,
    extensions: {
      ...(registry.extensions && typeof registry.extensions === 'object' ? registry.extensions : {}),
      libraries: {
        'shadcn-base': {
          id: 'shadcn-base',
          kind: 'project-local',
          sourcePath: 'src/components/ui',
          snapshotRoot: 'src',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt,
          updatedAt: createdAt,
        },
      },
    },
  };
}

function createWorkbenchShadcnBaseAugmentedComponents(templateRoot, seedComponents) {
  const componentMap = new Map();
  for (const component of seedComponents) {
    const importName = component.extensions?.importName;
    if (typeof importName !== 'string' || !importName) continue;
    if (!existsSync(join(templateRoot, component.sourceFile))) continue;
    componentMap.set(createWorkbenchShadcnBaseRegistryKey(component.sourceFile, importName), component);
  }

  const storyFiles = readWorkbenchTemplateDirectoryTextFiles(
    templateRoot,
    'src/components/ui',
    new Set(['.tsx'])
  ).filter(([relativePath]) => relativePath.endsWith('.stories.tsx'));

  for (const [storySourceFile, storySource] of storyFiles) {
    const sourceFile = storySourceFile.replace(/\.stories\.tsx$/, '.tsx');
    const sourcePath = join(templateRoot, sourceFile);
    if (!existsSync(sourcePath)) continue;

    const sourceExportNames = getWorkbenchSourceExportNames(readFileSync(sourcePath, 'utf8'));
    if (sourceExportNames.size === 0) continue;

    // A story export without its own `authoring` block inherits the module
    // `meta` block, the same way registry hydration resolves it at load.
    const metaBody = getCsfStoryMetaBody(storySource);
    const metaAllowedChildren = getCsfStoryAllowedChildren(metaBody);
    const metaComponentGroup = getCsfStoryAuthoringString(metaBody, 'group');

    for (const story of getWorkbenchStoryComponentExports(storySource)) {
      const importName = resolveWorkbenchStoryImportName(story, sourceExportNames);
      if (!importName) continue;

      const key = createWorkbenchShadcnBaseRegistryKey(sourceFile, importName);
      if (componentMap.has(key)) continue;

      const hasOwnAuthoring = story.allowedChildren.length > 0 || story.componentGroup !== null;
      componentMap.set(key, createWorkbenchShadcnBaseRegistryEntry({
        displayName: story.name ?? formatWorkbenchComponentDisplayName(importName),
        exportName: importName,
        sourceFile,
        storySourceFile,
        allowedChildren: hasOwnAuthoring ? story.allowedChildren : metaAllowedChildren,
        componentGroup: story.componentGroup ?? metaComponentGroup,
        hiddenFromInsert: story.exportName.endsWith('Story') || story.name !== importName,
      }));
    }
  }

  return [...componentMap.values()].sort((left, right) => {
    const sourceCompare = left.sourceFile.localeCompare(right.sourceFile);
    if (sourceCompare !== 0) return sourceCompare;
    return String(left.extensions?.importName ?? left.name).localeCompare(String(right.extensions?.importName ?? right.name));
  });
}

function createWorkbenchShadcnBaseRegistryEntry({ allowedChildren, componentGroup, displayName, exportName, sourceFile, storySourceFile, hiddenFromInsert }) {
  const authoring = createWorkbenchShadcnBaseAuthoringMetadata(exportName, hiddenFromInsert, allowedChildren, componentGroup);
  return {
    id: `shadcn-${sourceFile.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-${exportName.toLowerCase()}`,
    name: displayName,
    sourceFile,
    componentSetId: 'component-set-shadcn-base',
    variants: [],
    extensions: {
      source: 'local',
      importedFrom: sourceFile,
      importName: exportName,
      sourceExportName: exportName,
      sourceTruth: 'project-local',
      currentSourceFile: sourceFile,
      syncStatus: 'pinned',
      libraryId: 'shadcn-base',
      librarySourcePath: 'src/components/ui',
      librarySnapshotRoot: 'src',
      libraryUpdatePolicy: 'manual',
      storyFormat: 'csf',
      storySourceFile,
      sourcePreset: 'shadcn',
      sourceBase: 'base',
      sourceTemplate: 'vite',
      ...authoring,
    },
  };
}

function createWorkbenchShadcnBaseAuthoringMetadata(exportName, hiddenFromInsert, allowedChildren = [], componentGroup = null) {
  const slotKind = WORKBENCH_SHADCN_BASE_BLOCK_SLOT_COMPONENTS.has(exportName)
    ? 'block'
    : WORKBENCH_SHADCN_BASE_INLINE_SLOT_COMPONENTS.has(exportName)
      ? 'inline'
      : null;
  const rootVisible = WORKBENCH_SHADCN_BASE_ROOT_INSERT_COMPONENTS.has(exportName);
  const forceHidden = WORKBENCH_SHADCN_BASE_INSERT_HIDDEN_COMPONENTS.has(exportName);
  return {
    ...(slotKind ? { childrenSlotKind: slotKind } : {}),
    ...(allowedChildren.length > 0 ? { allowedChildren } : {}),
    ...(componentGroup ? { componentGroup } : {}),
    ...(forceHidden || (!rootVisible && hiddenFromInsert) ? { hiddenFromInsert: true } : {}),
  };
}

function createWorkbenchShadcnBaseRegistryKey(sourceFile, importName) {
  return `${sourceFile}::${importName}`;
}

function getWorkbenchStoryComponentExports(storySource) {
  const stories = [];
  const exportPattern = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\{([\s\S]*?)(?=\nexport\s+const\s+[A-Za-z0-9_]+\s*=|\nexport\s+default\s+|$)/g;
  let match;
  while ((match = exportPattern.exec(storySource))) {
    const exportName = match[1];
    const body = match[2] ?? '';
    const storyName = getTopLevelCsfStoryName(body);
    stories.push({
      allowedChildren: getCsfStoryAllowedChildren(body),
      componentGroup: getCsfStoryAuthoringString(body, 'group'),
      exportName,
      name: storyName,
    });
  }
  return stories;
}

/**
 * Read `authoring.allowedChildren` off a story body so a freshly created
 * project already carries the parent's child contract, rather than waiting
 * for the first registry hydration to derive it.
 */
function getCsfStoryAllowedChildren(body) {
  const match = /\bauthoring\s*:\s*\{[\s\S]*?\ballowedChildren\s*:\s*\[([\s\S]*?)\]/.exec(body);
  if (!match) return [];
  return [...new Set([...match[1].matchAll(/'([^']+)'|"([^"]+)"/g)]
    .map((entry) => (entry[1] ?? entry[2] ?? '').trim())
    .filter(Boolean))];
}

function getCsfStoryMetaBody(storySource) {
  const match = /\bconst meta\s*(?::[^=]*)?=\s*\{/.exec(storySource);
  if (!match) return '';
  let depth = 0;
  const openIndex = match.index + match[0].length - 1;
  for (let index = openIndex; index < storySource.length; index += 1) {
    const character = storySource[index];
    if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return storySource.slice(openIndex + 1, index);
    }
  }
  return '';
}

function getCsfStoryAuthoringString(body, key) {
  const match = new RegExp(`\\bauthoring\\s*:\\s*\\{[\\s\\S]*?\\b${key}\\s*:\\s*'([^']+)'`).exec(body);
  return match ? match[1].trim() || null : null;
}

function getTopLevelCsfStoryName(body) {
  const properties = [];
  const propertyPattern = /^([ \t]*)([A-Za-z_$][A-Za-z0-9_$]*):(?:\s*['"]([^'"]+)['"])?/gm;
  let match;
  while ((match = propertyPattern.exec(body))) {
    properties.push({
      indent: match[1].replace(/\t/g, '  ').length,
      key: match[2],
      value: match[3] ?? null,
    });
  }
  if (properties.length === 0) return null;
  const topLevelIndent = Math.min(...properties.map((property) => property.indent));
  return properties.find((property) => (
    property.indent === topLevelIndent && property.key === 'name' && property.value
  ))?.value ?? null;
}

function resolveWorkbenchStoryImportName(story, sourceExportNames) {
  const candidates = [
    story.name,
    story.exportName,
    story.exportName.replace(/Story$/, ''),
  ].filter((candidate) => typeof candidate === 'string' && /^[A-Za-z_$][\w$]*$/.test(candidate));
  return candidates.find((candidate) => sourceExportNames.has(candidate)) ?? null;
}

function getWorkbenchSourceExportNames(source) {
  const exportNames = new Set();

  for (const match of source.matchAll(/\bexport\s+(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
    exportNames.add(match[1]);
  }

  for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    const names = match[1].split(',');
    for (const rawName of names) {
      const normalized = rawName
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (normalized && /^[A-Za-z_$][\w$]*$/.test(normalized)) {
        exportNames.add(normalized);
      }
    }
  }

  return exportNames;
}

function formatWorkbenchComponentDisplayName(importName) {
  return importName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

function createWorkbenchBundledComponentRegistryEntries() {
  return [
    createWorkbenchBundledComponentRegistryEntry('Button', 'Button', 'src/components/Button.tsx', 'src/components/Button.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Card', 'Card', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'block',
    }),
    createWorkbenchBundledComponentRegistryEntry('Icon', 'Icon', 'src/components/Icon.tsx', 'src/components/Icon.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Input', 'Input', 'src/components/Input.tsx', 'src/components/Input.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Badge', 'Badge', 'src/components/Badge.tsx', 'src/components/Badge.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Alert', 'Alert', 'src/components/Alert.tsx', 'src/components/Alert.stories.tsx', {
      childrenSlotKind: 'block',
    }),
    createWorkbenchBundledComponentRegistryEntry('AlertTitle', 'AlertTitle', 'src/components/Alert.tsx', 'src/components/Alert.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('AlertDescription', 'AlertDescription', 'src/components/Alert.tsx', 'src/components/Alert.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('Textarea', 'Textarea', 'src/components/Textarea.tsx', 'src/components/Textarea.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Label', 'Label', 'src/components/Label.tsx', 'src/components/Label.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Separator', 'Separator', 'src/components/Separator.tsx', 'src/components/Separator.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Skeleton', 'Skeleton', 'src/components/Skeleton.tsx', 'src/components/Skeleton.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Avatar', 'Avatar', 'src/components/Avatar.tsx', 'src/components/Avatar.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Checkbox', 'Checkbox', 'src/components/Checkbox.tsx', 'src/components/Checkbox.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Switch', 'Switch', 'src/components/Switch.tsx', 'src/components/Switch.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('CardHeader', 'CardHeader', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('CardTitle', 'CardTitle', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('CardDescription', 'CardDescription', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('CardContent', 'CardContent', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('CardFooter', 'CardFooter', 'src/components/Card.tsx', 'src/components/Card.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('Tabs', 'Tabs', 'src/components/Tabs.tsx', 'src/components/Tabs.stories.tsx', {
      childrenSlotKind: 'block',
    }),
    createWorkbenchBundledComponentRegistryEntry('TabsList', 'TabsList', 'src/components/Tabs.tsx', 'src/components/Tabs.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TabsTrigger', 'TabsTrigger', 'src/components/Tabs.tsx', 'src/components/Tabs.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TabsContent', 'TabsContent', 'src/components/Tabs.tsx', 'src/components/Tabs.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('Progress', 'Progress', 'src/components/Progress.tsx', 'src/components/Progress.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Slider', 'Slider', 'src/components/Slider.tsx', 'src/components/Slider.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('RadioGroup', 'RadioGroup', 'src/components/RadioGroup.tsx', 'src/components/RadioGroup.stories.tsx'),
    createWorkbenchBundledComponentRegistryEntry('Accordion', 'Accordion', 'src/components/Accordion.tsx', 'src/components/Accordion.stories.tsx', {
      childrenSlotKind: 'block',
    }),
    createWorkbenchBundledComponentRegistryEntry('AccordionItem', 'AccordionItem', 'src/components/Accordion.tsx', 'src/components/Accordion.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('AccordionTrigger', 'AccordionTrigger', 'src/components/Accordion.tsx', 'src/components/Accordion.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('AccordionContent', 'AccordionContent', 'src/components/Accordion.tsx', 'src/components/Accordion.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('Table', 'Table', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
    }),
    createWorkbenchBundledComponentRegistryEntry('TableCaption', 'TableCaption', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'inline',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableHeader', 'TableHeader', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableBody', 'TableBody', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableFooter', 'TableFooter', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableRow', 'TableRow', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableHead', 'TableHead', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
    createWorkbenchBundledComponentRegistryEntry('TableCell', 'TableCell', 'src/components/Table.tsx', 'src/components/Table.stories.tsx', {
      childrenSlotKind: 'block',
      hiddenFromInsert: true,
    }),
  ];
}

function createWorkbenchBundledComponentRegistryEntry(name, exportName, sourceFile, storySourceFile, extraExtensions = {}) {
  return {
    id: `local-${sourceFile.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-${exportName.toLowerCase()}`,
    name,
    sourceFile,
    componentSetId: 'component-set-local',
    variants: [],
    extensions: {
      source: 'local',
      importedFrom: sourceFile,
      importName: exportName,
      sourceExportName: exportName,
      sourceTruth: 'project-local',
      currentSourceFile: sourceFile,
      syncStatus: 'pinned',
      libraryId: 'local',
      librarySourcePath: WORKBENCH_BUNDLED_COMPONENT_DIR,
      librarySnapshotRoot: 'src',
      libraryUpdatePolicy: 'manual',
      storyFormat: 'csf',
      storySourceFile,
      bundledComponentSet: 'workbench-starter-components',
      ...extraExtensions,
    },
  };
}

export function createWorkbenchDesignPageSource(pageName, templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX) {
    const templateRoot = getWorkbenchAstryxTemplateProjectRoot();
    if (templateRoot) {
      return readFileSync(
        join(templateRoot, WORKBENCH_ASTRYX_COMP_GALLARY_PAGE_SOURCE_FILE),
        'utf8',
      );
    }
  }
  if (normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) return createWorkbenchShadcnDesignPageSource(pageName);
  return createWorkbenchTailwindDesignPageSource(pageName);
}

function createWorkbenchTailwindDesignPageSource(pageName) {
  return [
    "import '../workbench-tokens.css';",
    '',
    'export default function WorkbenchDesignPage() {',
    '  return (',
    '    <main className="min-h-screen bg-background px-6 py-10 text-foreground">',
    `      <section className="mx-auto grid w-full max-w-5xl gap-8" aria-label="${escapeJsxAttribute(pageName)}">`,
    '        <div className="grid gap-5 rounded-3xl border border-border bg-card p-8 shadow-lg">',
    '          <p className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tailwind starter</p>',
    `          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal sm:text-5xl">${escapeJsxText(pageName)}</h1>`,
    '          <p className="max-w-2xl text-base leading-7 text-muted-foreground">',
    '            Compose directly with Tailwind utility classes, Workbench tokens, and source-visible React.',
    '          </p>',
    '          <div className="flex flex-wrap gap-3">',
    '            <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md" type="button">',
    '              Primary action',
    '            </button>',
    '            <button className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground" type="button">',
    '              Secondary',
    '            </button>',
    '          </div>',
    '        </div>',
    '',
    '        <div className="grid gap-4 md:grid-cols-3">',
    '          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">',
    '            <p className="text-sm font-semibold text-primary">01</p>',
    '            <h2 className="mt-3 text-lg font-semibold">Utility-first layout</h2>',
    '            <p className="mt-2 text-sm leading-6 text-muted-foreground">Spacing, radius, color, and type are all visible in className.</p>',
    '          </article>',
    '          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">',
    '            <p className="text-sm font-semibold text-primary">02</p>',
    '            <h2 className="mt-3 text-lg font-semibold">Token-backed theme</h2>',
    '            <p className="mt-2 text-sm leading-6 text-muted-foreground">Semantic colors like background, card, primary, and border stay editable.</p>',
    '          </article>',
    '          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">',
    '            <p className="text-sm font-semibold text-primary">03</p>',
    '            <h2 className="mt-3 text-lg font-semibold">Install-free preview</h2>',
    '            <p className="mt-2 text-sm leading-6 text-muted-foreground">Workbench can render this while dependencies are installing.</p>',
    '          </article>',
    '        </div>',
    '      </section>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchShadcnDesignPageSource(pageName) {
  return [
    "import '../workbench-tokens.css';",
    "import { Badge } from '../components/ui/badge';",
    "import { Button } from '../components/ui/button';",
    "import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';",
    "import { Input } from '../components/ui/input';",
    "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';",
    '',
    'export default function WorkbenchDesignPage() {',
    '  return (',
    '    <main className="min-h-screen bg-background p-8 text-foreground">',
    `      <section className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-5" aria-label="${escapeJsxAttribute(pageName)}">`,
    '        <div className="flex flex-wrap items-start justify-between gap-5">',
    '          <div className="flex min-w-0 max-w-2xl flex-1 flex-col gap-2">',
    '            <Badge variant="secondary" className="w-fit">shadcn</Badge>',
    `            <h1 className="text-4xl leading-tight font-semibold tracking-normal">${escapeJsxText(pageName)}</h1>`,
    '            <p className="text-sm leading-6 text-muted-foreground">',
    '              Base UI 기반 shadcn 컴포넌트와 Tailwind 유틸리티가 바로 편집 가능한 프로젝트입니다.',
    '            </p>',
    '          </div>',
    '          <div className="flex w-auto flex-wrap items-center gap-2">',
    `            <Button variant="outline">${createWorkbenchShadcnInlineIconSvg('search', 'inline-start')}Search</Button>`,
    `            <Button>${createWorkbenchShadcnInlineIconSvg('plus', 'inline-start')}New item</Button>`,
    '          </div>',
    '        </div>',
    '        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]">',
    '          <Card>',
    '            <CardHeader>',
    '              <CardTitle>Component inventory</CardTitle>',
    '              <CardDescription>Buttons, inputs, badges, tables, and composed slots are imported from src/components/ui.</CardDescription>',
    '            </CardHeader>',
    '            <CardContent>',
    '              <Table>',
    '                <TableHeader>',
    '                  <TableRow>',
    '                    <TableHead>Component</TableHead>',
    '                    <TableHead>Status</TableHead>',
    '                    <TableHead className="text-right">Options</TableHead>',
    '                  </TableRow>',
    '                </TableHeader>',
    '                <TableBody>',
    '                  <TableRow>',
    '                    <TableCell>Button</TableCell>',
    '                    <TableCell><Badge variant="outline">Slot based</Badge></TableCell>',
    '                    <TableCell className="text-right">6 variants</TableCell>',
    '                  </TableRow>',
    '                  <TableRow>',
    '                    <TableCell>Input</TableCell>',
    '                    <TableCell><Badge variant="secondary">Editable</Badge></TableCell>',
    '                    <TableCell className="text-right">Token backed</TableCell>',
    '                  </TableRow>',
    '                  <TableRow>',
    '                    <TableCell>Card</TableCell>',
    '                    <TableCell><Badge>Ready</Badge></TableCell>',
    '                    <TableCell className="text-right">Composed</TableCell>',
    '                  </TableRow>',
    '                </TableBody>',
    '              </Table>',
    '            </CardContent>',
    '            <CardFooter>',
    `              <Button variant="ghost">Open library${createWorkbenchShadcnInlineIconSvg('arrow-right', 'inline-end')}</Button>`,
    '            </CardFooter>',
    '          </Card>',
    '          <Card>',
    '            <img src="/workbench-assets/icons/lucide-preview/image.svg" alt="Image placeholder" className="aspect-video w-full bg-muted object-contain p-12" />',
    '            <CardHeader>',
    '              <CardTitle>Quick edit</CardTitle>',
    '              <CardDescription>Use children for icons and nested content.</CardDescription>',
    '            </CardHeader>',
    '            <CardContent>',
    '              <Input defaultValue="Design system" aria-label="Project label" />',
    '            </CardContent>',
    '            <CardFooter>',
    '              <Button className="w-full" variant="secondary">Save changes</Button>',
    '            </CardFooter>',
    '          </Card>',
    '        </div>',
    '      </section>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchShadcnComponentsCatalogPageSource(pageName) {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  const catalogSourceFile = templateRoot
    ? join(templateRoot, WORKBENCH_SHADCN_CATALOG_PAGE_SOURCE_FILE)
    : null;
  if (catalogSourceFile && existsSync(catalogSourceFile)) {
    return readFileSync(catalogSourceFile, 'utf8');
  }

  throw new Error(
    `Missing canonical shadcn components catalog source for ${pageName}: ${catalogSourceFile ?? 'template root unavailable'}`,
  );
}

function createWorkbenchShadcnDashboardPageSource(pageName) {
  const templateRoot = getWorkbenchShadcnBaseTemplateProjectRoot();
  const dashboardSourceFile = templateRoot
    ? join(templateRoot, WORKBENCH_SHADCN_DASHBOARD_PAGE_SOURCE_FILE)
    : null;
  if (dashboardSourceFile && existsSync(dashboardSourceFile)) {
    return readFileSync(dashboardSourceFile, 'utf8');
  }

  throw new Error(
    `Missing canonical shadcn SaaS dashboard source for ${pageName}: ${dashboardSourceFile ?? 'template root unavailable'}`,
  );
}

function createWorkbenchShadcnInlineIconSvg(iconName, position) {
  const iconChildren = {
    'arrow-right': '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
    plus: '<path d="M5 12h14" /><path d="M12 5v14" />',
    search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  }[iconName] ?? '<path d="M5 12h14" /><path d="M12 5v14" />';
  return `<svg data-icon="${position}" data-wb-asset-kind="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="0.875em" height="0.875em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">${iconChildren}</svg>`;
}

function createWorkbenchBasicDesignPageSource(pageName) {
  return [
    "import '../workbench-tokens.css';",
    '',
    'export default function WorkbenchDesignPage() {',
    '  return (',
    '    <main>',
    `      <section aria-label="${escapeJsxAttribute(pageName)}">`,
    '        <p>Workbench source project</p>',
    `        <h1>${escapeJsxText(pageName)}</h1>`,
    '        <p>',
    '          Start with source-visible React, project tokens, and CSS that',
    '          stays editable in Workbench.',
    '        </p>',
    '        <div>',
    '          <button type="button">Primary action</button>',
    '          <button type="button">Secondary</button>',
    '        </div>',
    '      </section>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledTokenCollections(templateId = WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return [
    createWorkbenchPrimitiveTokenCollection(),
    normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? createWorkbenchComponentTokenCollection()
      : createWorkbenchEmptyComponentTokenCollection(),
    createWorkbenchSemanticColorTokenCollection(),
    createWorkbenchSemanticRadiusTokenCollection(),
    createWorkbenchSemanticEffectTokenCollection(),
    createWorkbenchSemanticTypographyTokenCollection(),
    createWorkbenchSemanticSpacingTokenCollection(),
  ];
}

function createWorkbenchPrimitiveTokenCollection() {
  return {
    "id": "tailwind-primitives",
    "name": "Tailwind Primitives",
    "description": "Tailwind default theme primitive scale values used by semantic tokens.",
    "modes": [
      {
        "id": "default",
        "name": "Default"
      }
    ],
    "activeMode": "default",
    "groups": [
      {
        "id": "colors-core",
        "name": "Colors / Core"
      },
      {
        "id": "colors-slate",
        "name": "Colors / Slate"
      },
      {
        "id": "colors-gray",
        "name": "Colors / Gray"
      },
      {
        "id": "colors-zinc",
        "name": "Colors / Zinc"
      },
      {
        "id": "colors-neutral",
        "name": "Colors / Neutral"
      },
      {
        "id": "colors-stone",
        "name": "Colors / Stone"
      },
      {
        "id": "colors-red",
        "name": "Colors / Red"
      },
      {
        "id": "colors-orange",
        "name": "Colors / Orange"
      },
      {
        "id": "colors-amber",
        "name": "Colors / Amber"
      },
      {
        "id": "colors-yellow",
        "name": "Colors / Yellow"
      },
      {
        "id": "colors-lime",
        "name": "Colors / Lime"
      },
      {
        "id": "colors-green",
        "name": "Colors / Green"
      },
      {
        "id": "colors-emerald",
        "name": "Colors / Emerald"
      },
      {
        "id": "colors-teal",
        "name": "Colors / Teal"
      },
      {
        "id": "colors-cyan",
        "name": "Colors / Cyan"
      },
      {
        "id": "colors-sky",
        "name": "Colors / Sky"
      },
      {
        "id": "colors-blue",
        "name": "Colors / Blue"
      },
      {
        "id": "colors-indigo",
        "name": "Colors / Indigo"
      },
      {
        "id": "colors-violet",
        "name": "Colors / Violet"
      },
      {
        "id": "colors-purple",
        "name": "Colors / Purple"
      },
      {
        "id": "colors-fuchsia",
        "name": "Colors / Fuchsia"
      },
      {
        "id": "colors-pink",
        "name": "Colors / Pink"
      },
      {
        "id": "colors-rose",
        "name": "Colors / Rose"
      },
      {
        "id": "spacing",
        "name": "Spacing"
      },
      {
        "id": "sizing",
        "name": "Sizing"
      },
      {
        "id": "border-radius",
        "name": "Border Radius"
      },
      {
        "id": "border-width",
        "name": "Border Width"
      },
      {
        "id": "opacity",
        "name": "Opacity"
      },
      {
        "id": "font-size",
        "name": "Font Size"
      },
      {
        "id": "font-weight",
        "name": "Font Weight"
      },
      {
        "id": "line-height",
        "name": "Line Height"
      },
      {
        "id": "letter-spacing",
        "name": "Letter Spacing"
      },
      {
        "id": "box-shadow",
        "name": "Box Shadow"
      },
      {
        "id": "blur",
        "name": "Blur"
      },
      {
        "id": "screens",
        "name": "Screens"
      },
      {
        "id": "z-index",
        "name": "Z Index"
      },
      {
        "id": "duration",
        "name": "Duration"
      },
      {
        "id": "easing",
        "name": "Easing"
      }
    ],
    "tokens": [
      {
        "id": "inherit",
        "name": "inherit",
        "type": "color",
        "groupId": "colors-core",
        "description": "Tailwind primitive color inherit.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "inherit"
          }
        },
        "sortOrder": 0
      },
      {
        "id": "current",
        "name": "current",
        "type": "color",
        "groupId": "colors-core",
        "description": "Tailwind primitive color current.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "currentColor"
          }
        },
        "sortOrder": 1
      },
      {
        "id": "transparent",
        "name": "transparent",
        "type": "color",
        "groupId": "colors-core",
        "description": "Tailwind primitive color transparent.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "transparent"
          }
        },
        "sortOrder": 2
      },
      {
        "id": "black",
        "name": "black",
        "type": "color",
        "groupId": "colors-core",
        "description": "Tailwind primitive color black.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#000000"
          }
        },
        "sortOrder": 3
      },
      {
        "id": "white",
        "name": "white",
        "type": "color",
        "groupId": "colors-core",
        "description": "Tailwind primitive color white.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ffffff"
          }
        },
        "sortOrder": 4
      },
      {
        "id": "shadcn-border-dark",
        "name": "shadcn-border-dark",
        "type": "color",
        "groupId": "colors-core",
        "description": "Primitive shadcn dark border color.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "oklch(1 0 0 / 10%)"
          }
        },
        "sortOrder": 4.1
      },
      {
        "id": "shadcn-input-dark",
        "name": "shadcn-input-dark",
        "type": "color",
        "groupId": "colors-core",
        "description": "Primitive shadcn dark input border color.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "oklch(1 0 0 / 15%)"
          }
        },
        "sortOrder": 4.2
      },
      {
        "id": "shadcn-destructive-light",
        "name": "shadcn-destructive-light",
        "type": "color",
        "groupId": "colors-core",
        "description": "Primitive shadcn light destructive color.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "oklch(0.577 0.245 27.325)"
          }
        },
        "sortOrder": 4.3
      },
      {
        "id": "shadcn-destructive-dark",
        "name": "shadcn-destructive-dark",
        "type": "color",
        "groupId": "colors-core",
        "description": "Primitive shadcn dark destructive color.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "oklch(0.704 0.191 22.216)"
          }
        },
        "sortOrder": 4.4
      },
      {
        "id": "slate-50",
        "name": "slate-50",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f8fafc"
          }
        },
        "sortOrder": 5
      },
      {
        "id": "slate-100",
        "name": "slate-100",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f1f5f9"
          }
        },
        "sortOrder": 6
      },
      {
        "id": "slate-200",
        "name": "slate-200",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e2e8f0"
          }
        },
        "sortOrder": 7
      },
      {
        "id": "slate-300",
        "name": "slate-300",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#cbd5e1"
          }
        },
        "sortOrder": 8
      },
      {
        "id": "slate-400",
        "name": "slate-400",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#94a3b8"
          }
        },
        "sortOrder": 9
      },
      {
        "id": "slate-500",
        "name": "slate-500",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#64748b"
          }
        },
        "sortOrder": 10
      },
      {
        "id": "slate-600",
        "name": "slate-600",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#475569"
          }
        },
        "sortOrder": 11
      },
      {
        "id": "slate-700",
        "name": "slate-700",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#334155"
          }
        },
        "sortOrder": 12
      },
      {
        "id": "slate-800",
        "name": "slate-800",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1e293b"
          }
        },
        "sortOrder": 13
      },
      {
        "id": "slate-900",
        "name": "slate-900",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0f172a"
          }
        },
        "sortOrder": 14
      },
      {
        "id": "slate-950",
        "name": "slate-950",
        "type": "color",
        "groupId": "colors-slate",
        "description": "Tailwind primitive color slate-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#020617"
          }
        },
        "sortOrder": 15
      },
      {
        "id": "gray-50",
        "name": "gray-50",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f9fafb"
          }
        },
        "sortOrder": 16
      },
      {
        "id": "gray-100",
        "name": "gray-100",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f3f4f6"
          }
        },
        "sortOrder": 17
      },
      {
        "id": "gray-200",
        "name": "gray-200",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e5e7eb"
          }
        },
        "sortOrder": 18
      },
      {
        "id": "gray-300",
        "name": "gray-300",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d1d5db"
          }
        },
        "sortOrder": 19
      },
      {
        "id": "gray-400",
        "name": "gray-400",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#9ca3af"
          }
        },
        "sortOrder": 20
      },
      {
        "id": "gray-500",
        "name": "gray-500",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#6b7280"
          }
        },
        "sortOrder": 21
      },
      {
        "id": "gray-600",
        "name": "gray-600",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4b5563"
          }
        },
        "sortOrder": 22
      },
      {
        "id": "gray-700",
        "name": "gray-700",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#374151"
          }
        },
        "sortOrder": 23
      },
      {
        "id": "gray-800",
        "name": "gray-800",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1f2937"
          }
        },
        "sortOrder": 24
      },
      {
        "id": "gray-900",
        "name": "gray-900",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#111827"
          }
        },
        "sortOrder": 25
      },
      {
        "id": "gray-950",
        "name": "gray-950",
        "type": "color",
        "groupId": "colors-gray",
        "description": "Tailwind primitive color gray-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#030712"
          }
        },
        "sortOrder": 26
      },
      {
        "id": "zinc-50",
        "name": "zinc-50",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fafafa"
          }
        },
        "sortOrder": 27
      },
      {
        "id": "zinc-100",
        "name": "zinc-100",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f4f4f5"
          }
        },
        "sortOrder": 28
      },
      {
        "id": "zinc-200",
        "name": "zinc-200",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e4e4e7"
          }
        },
        "sortOrder": 29
      },
      {
        "id": "zinc-300",
        "name": "zinc-300",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d4d4d8"
          }
        },
        "sortOrder": 30
      },
      {
        "id": "zinc-400",
        "name": "zinc-400",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a1a1aa"
          }
        },
        "sortOrder": 31
      },
      {
        "id": "zinc-500",
        "name": "zinc-500",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#71717a"
          }
        },
        "sortOrder": 32
      },
      {
        "id": "zinc-600",
        "name": "zinc-600",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#52525b"
          }
        },
        "sortOrder": 33
      },
      {
        "id": "zinc-700",
        "name": "zinc-700",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#3f3f46"
          }
        },
        "sortOrder": 34
      },
      {
        "id": "zinc-800",
        "name": "zinc-800",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#27272a"
          }
        },
        "sortOrder": 35
      },
      {
        "id": "zinc-900",
        "name": "zinc-900",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#18181b"
          }
        },
        "sortOrder": 36
      },
      {
        "id": "zinc-950",
        "name": "zinc-950",
        "type": "color",
        "groupId": "colors-zinc",
        "description": "Tailwind primitive color zinc-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#09090b"
          }
        },
        "sortOrder": 37
      },
      {
        "id": "neutral-50",
        "name": "neutral-50",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fafafa"
          }
        },
        "sortOrder": 38
      },
      {
        "id": "neutral-100",
        "name": "neutral-100",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f5f5f5"
          }
        },
        "sortOrder": 39
      },
      {
        "id": "neutral-200",
        "name": "neutral-200",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e5e5e5"
          }
        },
        "sortOrder": 40
      },
      {
        "id": "neutral-300",
        "name": "neutral-300",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d4d4d4"
          }
        },
        "sortOrder": 41
      },
      {
        "id": "neutral-400",
        "name": "neutral-400",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a3a3a3"
          }
        },
        "sortOrder": 42
      },
      {
        "id": "neutral-500",
        "name": "neutral-500",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#737373"
          }
        },
        "sortOrder": 43
      },
      {
        "id": "neutral-600",
        "name": "neutral-600",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#525252"
          }
        },
        "sortOrder": 44
      },
      {
        "id": "neutral-700",
        "name": "neutral-700",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#404040"
          }
        },
        "sortOrder": 45
      },
      {
        "id": "neutral-800",
        "name": "neutral-800",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#262626"
          }
        },
        "sortOrder": 46
      },
      {
        "id": "neutral-900",
        "name": "neutral-900",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#171717"
          }
        },
        "sortOrder": 47
      },
      {
        "id": "neutral-950",
        "name": "neutral-950",
        "type": "color",
        "groupId": "colors-neutral",
        "description": "Tailwind primitive color neutral-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0a0a0a"
          }
        },
        "sortOrder": 48
      },
      {
        "id": "stone-50",
        "name": "stone-50",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fafaf9"
          }
        },
        "sortOrder": 49
      },
      {
        "id": "stone-100",
        "name": "stone-100",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f5f5f4"
          }
        },
        "sortOrder": 50
      },
      {
        "id": "stone-200",
        "name": "stone-200",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e7e5e4"
          }
        },
        "sortOrder": 51
      },
      {
        "id": "stone-300",
        "name": "stone-300",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d6d3d1"
          }
        },
        "sortOrder": 52
      },
      {
        "id": "stone-400",
        "name": "stone-400",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a8a29e"
          }
        },
        "sortOrder": 53
      },
      {
        "id": "stone-500",
        "name": "stone-500",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#78716c"
          }
        },
        "sortOrder": 54
      },
      {
        "id": "stone-600",
        "name": "stone-600",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#57534e"
          }
        },
        "sortOrder": 55
      },
      {
        "id": "stone-700",
        "name": "stone-700",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#44403c"
          }
        },
        "sortOrder": 56
      },
      {
        "id": "stone-800",
        "name": "stone-800",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#292524"
          }
        },
        "sortOrder": 57
      },
      {
        "id": "stone-900",
        "name": "stone-900",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1c1917"
          }
        },
        "sortOrder": 58
      },
      {
        "id": "stone-950",
        "name": "stone-950",
        "type": "color",
        "groupId": "colors-stone",
        "description": "Tailwind primitive color stone-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0c0a09"
          }
        },
        "sortOrder": 59
      },
      {
        "id": "red-50",
        "name": "red-50",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fef2f2"
          }
        },
        "sortOrder": 60
      },
      {
        "id": "red-100",
        "name": "red-100",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fee2e2"
          }
        },
        "sortOrder": 61
      },
      {
        "id": "red-200",
        "name": "red-200",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fecaca"
          }
        },
        "sortOrder": 62
      },
      {
        "id": "red-300",
        "name": "red-300",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fca5a5"
          }
        },
        "sortOrder": 63
      },
      {
        "id": "red-400",
        "name": "red-400",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f87171"
          }
        },
        "sortOrder": 64
      },
      {
        "id": "red-500",
        "name": "red-500",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ef4444"
          }
        },
        "sortOrder": 65
      },
      {
        "id": "red-600",
        "name": "red-600",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#dc2626"
          }
        },
        "sortOrder": 66
      },
      {
        "id": "red-700",
        "name": "red-700",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#b91c1c"
          }
        },
        "sortOrder": 67
      },
      {
        "id": "red-800",
        "name": "red-800",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#991b1b"
          }
        },
        "sortOrder": 68
      },
      {
        "id": "red-900",
        "name": "red-900",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#7f1d1d"
          }
        },
        "sortOrder": 69
      },
      {
        "id": "red-950",
        "name": "red-950",
        "type": "color",
        "groupId": "colors-red",
        "description": "Tailwind primitive color red-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#450a0a"
          }
        },
        "sortOrder": 70
      },
      {
        "id": "orange-50",
        "name": "orange-50",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fff7ed"
          }
        },
        "sortOrder": 71
      },
      {
        "id": "orange-100",
        "name": "orange-100",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ffedd5"
          }
        },
        "sortOrder": 72
      },
      {
        "id": "orange-200",
        "name": "orange-200",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fed7aa"
          }
        },
        "sortOrder": 73
      },
      {
        "id": "orange-300",
        "name": "orange-300",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fdba74"
          }
        },
        "sortOrder": 74
      },
      {
        "id": "orange-400",
        "name": "orange-400",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fb923c"
          }
        },
        "sortOrder": 75
      },
      {
        "id": "orange-500",
        "name": "orange-500",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f97316"
          }
        },
        "sortOrder": 76
      },
      {
        "id": "orange-600",
        "name": "orange-600",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ea580c"
          }
        },
        "sortOrder": 77
      },
      {
        "id": "orange-700",
        "name": "orange-700",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#c2410c"
          }
        },
        "sortOrder": 78
      },
      {
        "id": "orange-800",
        "name": "orange-800",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#9a3412"
          }
        },
        "sortOrder": 79
      },
      {
        "id": "orange-900",
        "name": "orange-900",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#7c2d12"
          }
        },
        "sortOrder": 80
      },
      {
        "id": "orange-950",
        "name": "orange-950",
        "type": "color",
        "groupId": "colors-orange",
        "description": "Tailwind primitive color orange-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#431407"
          }
        },
        "sortOrder": 81
      },
      {
        "id": "amber-50",
        "name": "amber-50",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fffbeb"
          }
        },
        "sortOrder": 82
      },
      {
        "id": "amber-100",
        "name": "amber-100",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fef3c7"
          }
        },
        "sortOrder": 83
      },
      {
        "id": "amber-200",
        "name": "amber-200",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fde68a"
          }
        },
        "sortOrder": 84
      },
      {
        "id": "amber-300",
        "name": "amber-300",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fcd34d"
          }
        },
        "sortOrder": 85
      },
      {
        "id": "amber-400",
        "name": "amber-400",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fbbf24"
          }
        },
        "sortOrder": 86
      },
      {
        "id": "amber-500",
        "name": "amber-500",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f59e0b"
          }
        },
        "sortOrder": 87
      },
      {
        "id": "amber-600",
        "name": "amber-600",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d97706"
          }
        },
        "sortOrder": 88
      },
      {
        "id": "amber-700",
        "name": "amber-700",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#b45309"
          }
        },
        "sortOrder": 89
      },
      {
        "id": "amber-800",
        "name": "amber-800",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#92400e"
          }
        },
        "sortOrder": 90
      },
      {
        "id": "amber-900",
        "name": "amber-900",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#78350f"
          }
        },
        "sortOrder": 91
      },
      {
        "id": "amber-950",
        "name": "amber-950",
        "type": "color",
        "groupId": "colors-amber",
        "description": "Tailwind primitive color amber-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#451a03"
          }
        },
        "sortOrder": 92
      },
      {
        "id": "yellow-50",
        "name": "yellow-50",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fefce8"
          }
        },
        "sortOrder": 93
      },
      {
        "id": "yellow-100",
        "name": "yellow-100",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fef9c3"
          }
        },
        "sortOrder": 94
      },
      {
        "id": "yellow-200",
        "name": "yellow-200",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fef08a"
          }
        },
        "sortOrder": 95
      },
      {
        "id": "yellow-300",
        "name": "yellow-300",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fde047"
          }
        },
        "sortOrder": 96
      },
      {
        "id": "yellow-400",
        "name": "yellow-400",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#facc15"
          }
        },
        "sortOrder": 97
      },
      {
        "id": "yellow-500",
        "name": "yellow-500",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#eab308"
          }
        },
        "sortOrder": 98
      },
      {
        "id": "yellow-600",
        "name": "yellow-600",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ca8a04"
          }
        },
        "sortOrder": 99
      },
      {
        "id": "yellow-700",
        "name": "yellow-700",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a16207"
          }
        },
        "sortOrder": 100
      },
      {
        "id": "yellow-800",
        "name": "yellow-800",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#854d0e"
          }
        },
        "sortOrder": 101
      },
      {
        "id": "yellow-900",
        "name": "yellow-900",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#713f12"
          }
        },
        "sortOrder": 102
      },
      {
        "id": "yellow-950",
        "name": "yellow-950",
        "type": "color",
        "groupId": "colors-yellow",
        "description": "Tailwind primitive color yellow-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#422006"
          }
        },
        "sortOrder": 103
      },
      {
        "id": "lime-50",
        "name": "lime-50",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f7fee7"
          }
        },
        "sortOrder": 104
      },
      {
        "id": "lime-100",
        "name": "lime-100",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ecfccb"
          }
        },
        "sortOrder": 105
      },
      {
        "id": "lime-200",
        "name": "lime-200",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d9f99d"
          }
        },
        "sortOrder": 106
      },
      {
        "id": "lime-300",
        "name": "lime-300",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#bef264"
          }
        },
        "sortOrder": 107
      },
      {
        "id": "lime-400",
        "name": "lime-400",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a3e635"
          }
        },
        "sortOrder": 108
      },
      {
        "id": "lime-500",
        "name": "lime-500",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#84cc16"
          }
        },
        "sortOrder": 109
      },
      {
        "id": "lime-600",
        "name": "lime-600",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#65a30d"
          }
        },
        "sortOrder": 110
      },
      {
        "id": "lime-700",
        "name": "lime-700",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4d7c0f"
          }
        },
        "sortOrder": 111
      },
      {
        "id": "lime-800",
        "name": "lime-800",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#3f6212"
          }
        },
        "sortOrder": 112
      },
      {
        "id": "lime-900",
        "name": "lime-900",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#365314"
          }
        },
        "sortOrder": 113
      },
      {
        "id": "lime-950",
        "name": "lime-950",
        "type": "color",
        "groupId": "colors-lime",
        "description": "Tailwind primitive color lime-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1a2e05"
          }
        },
        "sortOrder": 114
      },
      {
        "id": "green-50",
        "name": "green-50",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f0fdf4"
          }
        },
        "sortOrder": 115
      },
      {
        "id": "green-100",
        "name": "green-100",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#dcfce7"
          }
        },
        "sortOrder": 116
      },
      {
        "id": "green-200",
        "name": "green-200",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#bbf7d0"
          }
        },
        "sortOrder": 117
      },
      {
        "id": "green-300",
        "name": "green-300",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#86efac"
          }
        },
        "sortOrder": 118
      },
      {
        "id": "green-400",
        "name": "green-400",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4ade80"
          }
        },
        "sortOrder": 119
      },
      {
        "id": "green-500",
        "name": "green-500",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#22c55e"
          }
        },
        "sortOrder": 120
      },
      {
        "id": "green-600",
        "name": "green-600",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#16a34a"
          }
        },
        "sortOrder": 121
      },
      {
        "id": "green-700",
        "name": "green-700",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#15803d"
          }
        },
        "sortOrder": 122
      },
      {
        "id": "green-800",
        "name": "green-800",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#166534"
          }
        },
        "sortOrder": 123
      },
      {
        "id": "green-900",
        "name": "green-900",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#14532d"
          }
        },
        "sortOrder": 124
      },
      {
        "id": "green-950",
        "name": "green-950",
        "type": "color",
        "groupId": "colors-green",
        "description": "Tailwind primitive color green-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#052e16"
          }
        },
        "sortOrder": 125
      },
      {
        "id": "emerald-50",
        "name": "emerald-50",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ecfdf5"
          }
        },
        "sortOrder": 126
      },
      {
        "id": "emerald-100",
        "name": "emerald-100",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d1fae5"
          }
        },
        "sortOrder": 127
      },
      {
        "id": "emerald-200",
        "name": "emerald-200",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a7f3d0"
          }
        },
        "sortOrder": 128
      },
      {
        "id": "emerald-300",
        "name": "emerald-300",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#6ee7b7"
          }
        },
        "sortOrder": 129
      },
      {
        "id": "emerald-400",
        "name": "emerald-400",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#34d399"
          }
        },
        "sortOrder": 130
      },
      {
        "id": "emerald-500",
        "name": "emerald-500",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#10b981"
          }
        },
        "sortOrder": 131
      },
      {
        "id": "emerald-600",
        "name": "emerald-600",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#059669"
          }
        },
        "sortOrder": 132
      },
      {
        "id": "emerald-700",
        "name": "emerald-700",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#047857"
          }
        },
        "sortOrder": 133
      },
      {
        "id": "emerald-800",
        "name": "emerald-800",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#065f46"
          }
        },
        "sortOrder": 134
      },
      {
        "id": "emerald-900",
        "name": "emerald-900",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#064e3b"
          }
        },
        "sortOrder": 135
      },
      {
        "id": "emerald-950",
        "name": "emerald-950",
        "type": "color",
        "groupId": "colors-emerald",
        "description": "Tailwind primitive color emerald-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#022c22"
          }
        },
        "sortOrder": 136
      },
      {
        "id": "teal-50",
        "name": "teal-50",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f0fdfa"
          }
        },
        "sortOrder": 137
      },
      {
        "id": "teal-100",
        "name": "teal-100",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ccfbf1"
          }
        },
        "sortOrder": 138
      },
      {
        "id": "teal-200",
        "name": "teal-200",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#99f6e4"
          }
        },
        "sortOrder": 139
      },
      {
        "id": "teal-300",
        "name": "teal-300",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#5eead4"
          }
        },
        "sortOrder": 140
      },
      {
        "id": "teal-400",
        "name": "teal-400",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#2dd4bf"
          }
        },
        "sortOrder": 141
      },
      {
        "id": "teal-500",
        "name": "teal-500",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#14b8a6"
          }
        },
        "sortOrder": 142
      },
      {
        "id": "teal-600",
        "name": "teal-600",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0d9488"
          }
        },
        "sortOrder": 143
      },
      {
        "id": "teal-700",
        "name": "teal-700",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0f766e"
          }
        },
        "sortOrder": 144
      },
      {
        "id": "teal-800",
        "name": "teal-800",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#115e59"
          }
        },
        "sortOrder": 145
      },
      {
        "id": "teal-900",
        "name": "teal-900",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#134e4a"
          }
        },
        "sortOrder": 146
      },
      {
        "id": "teal-950",
        "name": "teal-950",
        "type": "color",
        "groupId": "colors-teal",
        "description": "Tailwind primitive color teal-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#042f2e"
          }
        },
        "sortOrder": 147
      },
      {
        "id": "cyan-50",
        "name": "cyan-50",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ecfeff"
          }
        },
        "sortOrder": 148
      },
      {
        "id": "cyan-100",
        "name": "cyan-100",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#cffafe"
          }
        },
        "sortOrder": 149
      },
      {
        "id": "cyan-200",
        "name": "cyan-200",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a5f3fc"
          }
        },
        "sortOrder": 150
      },
      {
        "id": "cyan-300",
        "name": "cyan-300",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#67e8f9"
          }
        },
        "sortOrder": 151
      },
      {
        "id": "cyan-400",
        "name": "cyan-400",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#22d3ee"
          }
        },
        "sortOrder": 152
      },
      {
        "id": "cyan-500",
        "name": "cyan-500",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#06b6d4"
          }
        },
        "sortOrder": 153
      },
      {
        "id": "cyan-600",
        "name": "cyan-600",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0891b2"
          }
        },
        "sortOrder": 154
      },
      {
        "id": "cyan-700",
        "name": "cyan-700",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0e7490"
          }
        },
        "sortOrder": 155
      },
      {
        "id": "cyan-800",
        "name": "cyan-800",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#155e75"
          }
        },
        "sortOrder": 156
      },
      {
        "id": "cyan-900",
        "name": "cyan-900",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#164e63"
          }
        },
        "sortOrder": 157
      },
      {
        "id": "cyan-950",
        "name": "cyan-950",
        "type": "color",
        "groupId": "colors-cyan",
        "description": "Tailwind primitive color cyan-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#083344"
          }
        },
        "sortOrder": 158
      },
      {
        "id": "sky-50",
        "name": "sky-50",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f0f9ff"
          }
        },
        "sortOrder": 159
      },
      {
        "id": "sky-100",
        "name": "sky-100",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e0f2fe"
          }
        },
        "sortOrder": 160
      },
      {
        "id": "sky-200",
        "name": "sky-200",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#bae6fd"
          }
        },
        "sortOrder": 161
      },
      {
        "id": "sky-300",
        "name": "sky-300",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#7dd3fc"
          }
        },
        "sortOrder": 162
      },
      {
        "id": "sky-400",
        "name": "sky-400",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#38bdf8"
          }
        },
        "sortOrder": 163
      },
      {
        "id": "sky-500",
        "name": "sky-500",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0ea5e9"
          }
        },
        "sortOrder": 164
      },
      {
        "id": "sky-600",
        "name": "sky-600",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0284c7"
          }
        },
        "sortOrder": 165
      },
      {
        "id": "sky-700",
        "name": "sky-700",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0369a1"
          }
        },
        "sortOrder": 166
      },
      {
        "id": "sky-800",
        "name": "sky-800",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#075985"
          }
        },
        "sortOrder": 167
      },
      {
        "id": "sky-900",
        "name": "sky-900",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#0c4a6e"
          }
        },
        "sortOrder": 168
      },
      {
        "id": "sky-950",
        "name": "sky-950",
        "type": "color",
        "groupId": "colors-sky",
        "description": "Tailwind primitive color sky-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#082f49"
          }
        },
        "sortOrder": 169
      },
      {
        "id": "blue-50",
        "name": "blue-50",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#eff6ff"
          }
        },
        "sortOrder": 170
      },
      {
        "id": "blue-100",
        "name": "blue-100",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#dbeafe"
          }
        },
        "sortOrder": 171
      },
      {
        "id": "blue-200",
        "name": "blue-200",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#bfdbfe"
          }
        },
        "sortOrder": 172
      },
      {
        "id": "blue-300",
        "name": "blue-300",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#93c5fd"
          }
        },
        "sortOrder": 173
      },
      {
        "id": "blue-400",
        "name": "blue-400",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#60a5fa"
          }
        },
        "sortOrder": 174
      },
      {
        "id": "blue-500",
        "name": "blue-500",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#3b82f6"
          }
        },
        "sortOrder": 175
      },
      {
        "id": "blue-600",
        "name": "blue-600",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#2563eb"
          }
        },
        "sortOrder": 176
      },
      {
        "id": "blue-700",
        "name": "blue-700",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1d4ed8"
          }
        },
        "sortOrder": 177
      },
      {
        "id": "blue-800",
        "name": "blue-800",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1e40af"
          }
        },
        "sortOrder": 178
      },
      {
        "id": "blue-900",
        "name": "blue-900",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1e3a8a"
          }
        },
        "sortOrder": 179
      },
      {
        "id": "blue-950",
        "name": "blue-950",
        "type": "color",
        "groupId": "colors-blue",
        "description": "Tailwind primitive color blue-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#172554"
          }
        },
        "sortOrder": 180
      },
      {
        "id": "indigo-50",
        "name": "indigo-50",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#eef2ff"
          }
        },
        "sortOrder": 181
      },
      {
        "id": "indigo-100",
        "name": "indigo-100",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e0e7ff"
          }
        },
        "sortOrder": 182
      },
      {
        "id": "indigo-200",
        "name": "indigo-200",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#c7d2fe"
          }
        },
        "sortOrder": 183
      },
      {
        "id": "indigo-300",
        "name": "indigo-300",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a5b4fc"
          }
        },
        "sortOrder": 184
      },
      {
        "id": "indigo-400",
        "name": "indigo-400",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#818cf8"
          }
        },
        "sortOrder": 185
      },
      {
        "id": "indigo-500",
        "name": "indigo-500",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#6366f1"
          }
        },
        "sortOrder": 186
      },
      {
        "id": "indigo-600",
        "name": "indigo-600",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4f46e5"
          }
        },
        "sortOrder": 187
      },
      {
        "id": "indigo-700",
        "name": "indigo-700",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4338ca"
          }
        },
        "sortOrder": 188
      },
      {
        "id": "indigo-800",
        "name": "indigo-800",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#3730a3"
          }
        },
        "sortOrder": 189
      },
      {
        "id": "indigo-900",
        "name": "indigo-900",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#312e81"
          }
        },
        "sortOrder": 190
      },
      {
        "id": "indigo-950",
        "name": "indigo-950",
        "type": "color",
        "groupId": "colors-indigo",
        "description": "Tailwind primitive color indigo-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#1e1b4b"
          }
        },
        "sortOrder": 191
      },
      {
        "id": "violet-50",
        "name": "violet-50",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f5f3ff"
          }
        },
        "sortOrder": 192
      },
      {
        "id": "violet-100",
        "name": "violet-100",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ede9fe"
          }
        },
        "sortOrder": 193
      },
      {
        "id": "violet-200",
        "name": "violet-200",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ddd6fe"
          }
        },
        "sortOrder": 194
      },
      {
        "id": "violet-300",
        "name": "violet-300",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#c4b5fd"
          }
        },
        "sortOrder": 195
      },
      {
        "id": "violet-400",
        "name": "violet-400",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a78bfa"
          }
        },
        "sortOrder": 196
      },
      {
        "id": "violet-500",
        "name": "violet-500",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#8b5cf6"
          }
        },
        "sortOrder": 197
      },
      {
        "id": "violet-600",
        "name": "violet-600",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#7c3aed"
          }
        },
        "sortOrder": 198
      },
      {
        "id": "violet-700",
        "name": "violet-700",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#6d28d9"
          }
        },
        "sortOrder": 199
      },
      {
        "id": "violet-800",
        "name": "violet-800",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#5b21b6"
          }
        },
        "sortOrder": 200
      },
      {
        "id": "violet-900",
        "name": "violet-900",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4c1d95"
          }
        },
        "sortOrder": 201
      },
      {
        "id": "violet-950",
        "name": "violet-950",
        "type": "color",
        "groupId": "colors-violet",
        "description": "Tailwind primitive color violet-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#2e1065"
          }
        },
        "sortOrder": 202
      },
      {
        "id": "purple-50",
        "name": "purple-50",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#faf5ff"
          }
        },
        "sortOrder": 203
      },
      {
        "id": "purple-100",
        "name": "purple-100",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f3e8ff"
          }
        },
        "sortOrder": 204
      },
      {
        "id": "purple-200",
        "name": "purple-200",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e9d5ff"
          }
        },
        "sortOrder": 205
      },
      {
        "id": "purple-300",
        "name": "purple-300",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d8b4fe"
          }
        },
        "sortOrder": 206
      },
      {
        "id": "purple-400",
        "name": "purple-400",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#c084fc"
          }
        },
        "sortOrder": 207
      },
      {
        "id": "purple-500",
        "name": "purple-500",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a855f7"
          }
        },
        "sortOrder": 208
      },
      {
        "id": "purple-600",
        "name": "purple-600",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#9333ea"
          }
        },
        "sortOrder": 209
      },
      {
        "id": "purple-700",
        "name": "purple-700",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#7e22ce"
          }
        },
        "sortOrder": 210
      },
      {
        "id": "purple-800",
        "name": "purple-800",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#6b21a8"
          }
        },
        "sortOrder": 211
      },
      {
        "id": "purple-900",
        "name": "purple-900",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#581c87"
          }
        },
        "sortOrder": 212
      },
      {
        "id": "purple-950",
        "name": "purple-950",
        "type": "color",
        "groupId": "colors-purple",
        "description": "Tailwind primitive color purple-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#3b0764"
          }
        },
        "sortOrder": 213
      },
      {
        "id": "fuchsia-50",
        "name": "fuchsia-50",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fdf4ff"
          }
        },
        "sortOrder": 214
      },
      {
        "id": "fuchsia-100",
        "name": "fuchsia-100",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fae8ff"
          }
        },
        "sortOrder": 215
      },
      {
        "id": "fuchsia-200",
        "name": "fuchsia-200",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f5d0fe"
          }
        },
        "sortOrder": 216
      },
      {
        "id": "fuchsia-300",
        "name": "fuchsia-300",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f0abfc"
          }
        },
        "sortOrder": 217
      },
      {
        "id": "fuchsia-400",
        "name": "fuchsia-400",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e879f9"
          }
        },
        "sortOrder": 218
      },
      {
        "id": "fuchsia-500",
        "name": "fuchsia-500",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#d946ef"
          }
        },
        "sortOrder": 219
      },
      {
        "id": "fuchsia-600",
        "name": "fuchsia-600",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#c026d3"
          }
        },
        "sortOrder": 220
      },
      {
        "id": "fuchsia-700",
        "name": "fuchsia-700",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#a21caf"
          }
        },
        "sortOrder": 221
      },
      {
        "id": "fuchsia-800",
        "name": "fuchsia-800",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#86198f"
          }
        },
        "sortOrder": 222
      },
      {
        "id": "fuchsia-900",
        "name": "fuchsia-900",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#701a75"
          }
        },
        "sortOrder": 223
      },
      {
        "id": "fuchsia-950",
        "name": "fuchsia-950",
        "type": "color",
        "groupId": "colors-fuchsia",
        "description": "Tailwind primitive color fuchsia-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4a044e"
          }
        },
        "sortOrder": 224
      },
      {
        "id": "pink-50",
        "name": "pink-50",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fdf2f8"
          }
        },
        "sortOrder": 225
      },
      {
        "id": "pink-100",
        "name": "pink-100",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fce7f3"
          }
        },
        "sortOrder": 226
      },
      {
        "id": "pink-200",
        "name": "pink-200",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fbcfe8"
          }
        },
        "sortOrder": 227
      },
      {
        "id": "pink-300",
        "name": "pink-300",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f9a8d4"
          }
        },
        "sortOrder": 228
      },
      {
        "id": "pink-400",
        "name": "pink-400",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f472b6"
          }
        },
        "sortOrder": 229
      },
      {
        "id": "pink-500",
        "name": "pink-500",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ec4899"
          }
        },
        "sortOrder": 230
      },
      {
        "id": "pink-600",
        "name": "pink-600",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#db2777"
          }
        },
        "sortOrder": 231
      },
      {
        "id": "pink-700",
        "name": "pink-700",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#be185d"
          }
        },
        "sortOrder": 232
      },
      {
        "id": "pink-800",
        "name": "pink-800",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#9d174d"
          }
        },
        "sortOrder": 233
      },
      {
        "id": "pink-900",
        "name": "pink-900",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#831843"
          }
        },
        "sortOrder": 234
      },
      {
        "id": "pink-950",
        "name": "pink-950",
        "type": "color",
        "groupId": "colors-pink",
        "description": "Tailwind primitive color pink-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#500724"
          }
        },
        "sortOrder": 235
      },
      {
        "id": "rose-50",
        "name": "rose-50",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fff1f2"
          }
        },
        "sortOrder": 236
      },
      {
        "id": "rose-100",
        "name": "rose-100",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#ffe4e6"
          }
        },
        "sortOrder": 237
      },
      {
        "id": "rose-200",
        "name": "rose-200",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fecdd3"
          }
        },
        "sortOrder": 238
      },
      {
        "id": "rose-300",
        "name": "rose-300",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fda4af"
          }
        },
        "sortOrder": 239
      },
      {
        "id": "rose-400",
        "name": "rose-400",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-400.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#fb7185"
          }
        },
        "sortOrder": 240
      },
      {
        "id": "rose-500",
        "name": "rose-500",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#f43f5e"
          }
        },
        "sortOrder": 241
      },
      {
        "id": "rose-600",
        "name": "rose-600",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-600.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#e11d48"
          }
        },
        "sortOrder": 242
      },
      {
        "id": "rose-700",
        "name": "rose-700",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#be123c"
          }
        },
        "sortOrder": 243
      },
      {
        "id": "rose-800",
        "name": "rose-800",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-800.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#9f1239"
          }
        },
        "sortOrder": 244
      },
      {
        "id": "rose-900",
        "name": "rose-900",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-900.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#881337"
          }
        },
        "sortOrder": 245
      },
      {
        "id": "rose-950",
        "name": "rose-950",
        "type": "color",
        "groupId": "colors-rose",
        "description": "Tailwind primitive color rose-950.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "#4c0519"
          }
        },
        "sortOrder": 246
      },
      {
        "id": "space-0",
        "name": "space-0",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 0.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 247
      },
      {
        "id": "space-1",
        "name": "space-1",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 1.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 248
      },
      {
        "id": "space-2",
        "name": "space-2",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 2.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 249
      },
      {
        "id": "space-3",
        "name": "space-3",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 3.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 250
      },
      {
        "id": "space-4",
        "name": "space-4",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 4.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 251
      },
      {
        "id": "space-5",
        "name": "space-5",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 252
      },
      {
        "id": "space-6",
        "name": "space-6",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 6.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 253
      },
      {
        "id": "space-7",
        "name": "space-7",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 7.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 254
      },
      {
        "id": "space-8",
        "name": "space-8",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 8.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 255
      },
      {
        "id": "space-9",
        "name": "space-9",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 9.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 256
      },
      {
        "id": "space-10",
        "name": "space-10",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 10.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 257
      },
      {
        "id": "space-11",
        "name": "space-11",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 11.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 258
      },
      {
        "id": "space-12",
        "name": "space-12",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 12.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 3,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 259
      },
      {
        "id": "space-14",
        "name": "space-14",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 14.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 3.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 260
      },
      {
        "id": "space-16",
        "name": "space-16",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 16.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 4,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 261
      },
      {
        "id": "space-20",
        "name": "space-20",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 20.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 262
      },
      {
        "id": "space-24",
        "name": "space-24",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 24.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 6,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 263
      },
      {
        "id": "space-28",
        "name": "space-28",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 28.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 7,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 264
      },
      {
        "id": "space-32",
        "name": "space-32",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 32.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 8,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 265
      },
      {
        "id": "space-36",
        "name": "space-36",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 36.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 9,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 266
      },
      {
        "id": "space-40",
        "name": "space-40",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 40.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 10,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 267
      },
      {
        "id": "space-44",
        "name": "space-44",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 44.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 11,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 268
      },
      {
        "id": "space-48",
        "name": "space-48",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 48.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 12,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 269
      },
      {
        "id": "space-52",
        "name": "space-52",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 52.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 13,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 270
      },
      {
        "id": "space-56",
        "name": "space-56",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 56.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 14,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 271
      },
      {
        "id": "space-60",
        "name": "space-60",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 60.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 15,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 272
      },
      {
        "id": "space-64",
        "name": "space-64",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 64.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 16,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 273
      },
      {
        "id": "space-72",
        "name": "space-72",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 72.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 18,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 274
      },
      {
        "id": "space-80",
        "name": "space-80",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 80.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 20,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 275
      },
      {
        "id": "space-96",
        "name": "space-96",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 96.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 24,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 276
      },
      {
        "id": "space-px",
        "name": "space-px",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive px.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "px"
            }
          }
        },
        "sortOrder": 277
      },
      {
        "id": "space-0-5",
        "name": "space-0-5",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 0-5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.125,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 278
      },
      {
        "id": "space-1-5",
        "name": "space-1-5",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 1-5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.375,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 279
      },
      {
        "id": "space-2-5",
        "name": "space-2-5",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 2-5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.625,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 280
      },
      {
        "id": "space-3-5",
        "name": "space-3-5",
        "type": "dimension",
        "groupId": "spacing",
        "description": "Tailwind spacing primitive 3-5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.875,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 281
      },
      {
        "id": "size-auto",
        "name": "size-auto",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive auto.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "auto"
          }
        },
        "sortOrder": 282
      },
      {
        "id": "size-full",
        "name": "size-full",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive full.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "100%"
          }
        },
        "sortOrder": 283
      },
      {
        "id": "size-screen",
        "name": "size-screen",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive screen.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "100vw"
          }
        },
        "sortOrder": 284
      },
      {
        "id": "size-svw",
        "name": "size-svw",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive svw.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "100svw"
          }
        },
        "sortOrder": 285
      },
      {
        "id": "size-lvw",
        "name": "size-lvw",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive lvw.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "100lvw"
          }
        },
        "sortOrder": 286
      },
      {
        "id": "size-dvw",
        "name": "size-dvw",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive dvw.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "100dvw"
          }
        },
        "sortOrder": 287
      },
      {
        "id": "size-min",
        "name": "size-min",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive min.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "min-content"
          }
        },
        "sortOrder": 288
      },
      {
        "id": "size-max",
        "name": "size-max",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive max.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "max-content"
          }
        },
        "sortOrder": 289
      },
      {
        "id": "size-fit",
        "name": "size-fit",
        "type": "string",
        "groupId": "sizing",
        "description": "Tailwind sizing primitive fit.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "fit-content"
          }
        },
        "sortOrder": 290
      },
      {
        "id": "radius-none",
        "name": "radius-none",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive none.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "px"
            }
          }
        },
        "sortOrder": 291
      },
      {
        "id": "radius-sm",
        "name": "radius-sm",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive sm.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.125,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 292
      },
      {
        "id": "radius-DEFAULT",
        "name": "radius-DEFAULT",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive DEFAULT.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 293
      },
      {
        "id": "radius-md",
        "name": "radius-md",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive md.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.375,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 294
      },
      {
        "id": "radius-lg",
        "name": "radius-lg",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive lg.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 295
      },
      {
        "id": "radius-xl",
        "name": "radius-xl",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 296
      },
      {
        "id": "radius-2xl",
        "name": "radius-2xl",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive 2xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 297
      },
      {
        "id": "radius-3xl",
        "name": "radius-3xl",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive 3xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 298
      },
      {
        "id": "radius-full",
        "name": "radius-full",
        "type": "dimension",
        "groupId": "border-radius",
        "description": "Tailwind border radius primitive full.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 9999,
              "unit": "px"
            }
          }
        },
        "sortOrder": 299
      },
      {
        "id": "border-0",
        "name": "border-0",
        "type": "dimension",
        "groupId": "border-width",
        "description": "Tailwind border width primitive 0.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "px"
            }
          }
        },
        "sortOrder": 300
      },
      {
        "id": "border-2",
        "name": "border-2",
        "type": "dimension",
        "groupId": "border-width",
        "description": "Tailwind border width primitive 2.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2,
              "unit": "px"
            }
          }
        },
        "sortOrder": 301
      },
      {
        "id": "border-4",
        "name": "border-4",
        "type": "dimension",
        "groupId": "border-width",
        "description": "Tailwind border width primitive 4.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 4,
              "unit": "px"
            }
          }
        },
        "sortOrder": 302
      },
      {
        "id": "border-8",
        "name": "border-8",
        "type": "dimension",
        "groupId": "border-width",
        "description": "Tailwind border width primitive 8.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 8,
              "unit": "px"
            }
          }
        },
        "sortOrder": 303
      },
      {
        "id": "border-DEFAULT",
        "name": "border-DEFAULT",
        "type": "dimension",
        "groupId": "border-width",
        "description": "Tailwind border width primitive DEFAULT.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "px"
            }
          }
        },
        "sortOrder": 304
      },
      {
        "id": "opacity-0",
        "name": "opacity-0",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 0.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "%"
            }
          }
        },
        "sortOrder": 305
      },
      {
        "id": "opacity-5",
        "name": "opacity-5",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 5,
              "unit": "%"
            }
          }
        },
        "sortOrder": 306
      },
      {
        "id": "opacity-10",
        "name": "opacity-10",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 10.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 10,
              "unit": "%"
            }
          }
        },
        "sortOrder": 307
      },
      {
        "id": "opacity-15",
        "name": "opacity-15",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 15.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 15,
              "unit": "%"
            }
          }
        },
        "sortOrder": 308
      },
      {
        "id": "opacity-20",
        "name": "opacity-20",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 20.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 20,
              "unit": "%"
            }
          }
        },
        "sortOrder": 309
      },
      {
        "id": "opacity-25",
        "name": "opacity-25",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 25.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 25,
              "unit": "%"
            }
          }
        },
        "sortOrder": 310
      },
      {
        "id": "opacity-30",
        "name": "opacity-30",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 30.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 30,
              "unit": "%"
            }
          }
        },
        "sortOrder": 311
      },
      {
        "id": "opacity-35",
        "name": "opacity-35",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 35.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 35,
              "unit": "%"
            }
          }
        },
        "sortOrder": 312
      },
      {
        "id": "opacity-40",
        "name": "opacity-40",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 40.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 40,
              "unit": "%"
            }
          }
        },
        "sortOrder": 313
      },
      {
        "id": "opacity-45",
        "name": "opacity-45",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 45.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 45,
              "unit": "%"
            }
          }
        },
        "sortOrder": 314
      },
      {
        "id": "opacity-50",
        "name": "opacity-50",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 50,
              "unit": "%"
            }
          }
        },
        "sortOrder": 315
      },
      {
        "id": "opacity-55",
        "name": "opacity-55",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 55.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 55,
              "unit": "%"
            }
          }
        },
        "sortOrder": 316
      },
      {
        "id": "opacity-60",
        "name": "opacity-60",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 60.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 60,
              "unit": "%"
            }
          }
        },
        "sortOrder": 317
      },
      {
        "id": "opacity-65",
        "name": "opacity-65",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 65.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 65,
              "unit": "%"
            }
          }
        },
        "sortOrder": 318
      },
      {
        "id": "opacity-70",
        "name": "opacity-70",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 70.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 70,
              "unit": "%"
            }
          }
        },
        "sortOrder": 319
      },
      {
        "id": "opacity-75",
        "name": "opacity-75",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 75.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 75,
              "unit": "%"
            }
          }
        },
        "sortOrder": 320
      },
      {
        "id": "opacity-80",
        "name": "opacity-80",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 80.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 80,
              "unit": "%"
            }
          }
        },
        "sortOrder": 321
      },
      {
        "id": "opacity-85",
        "name": "opacity-85",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 85.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 85,
              "unit": "%"
            }
          }
        },
        "sortOrder": 322
      },
      {
        "id": "opacity-90",
        "name": "opacity-90",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 90.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 90,
              "unit": "%"
            }
          }
        },
        "sortOrder": 323
      },
      {
        "id": "opacity-95",
        "name": "opacity-95",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 95.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 95,
              "unit": "%"
            }
          }
        },
        "sortOrder": 324
      },
      {
        "id": "opacity-100",
        "name": "opacity-100",
        "type": "opacity",
        "groupId": "opacity",
        "description": "Tailwind opacity primitive 100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 100,
              "unit": "%"
            }
          }
        },
        "sortOrder": 325
      },
      {
        "id": "text-xs",
        "name": "text-xs",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive xs.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 326
      },
      {
        "id": "text-sm",
        "name": "text-sm",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive sm.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.875,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 327
      },
      {
        "id": "text-base",
        "name": "text-base",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive base.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 328
      },
      {
        "id": "text-lg",
        "name": "text-lg",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive lg.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.125,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 329
      },
      {
        "id": "text-xl",
        "name": "text-xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 330
      },
      {
        "id": "text-2xl",
        "name": "text-2xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 2xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 331
      },
      {
        "id": "text-3xl",
        "name": "text-3xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 3xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.875,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 332
      },
      {
        "id": "text-4xl",
        "name": "text-4xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 4xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 333
      },
      {
        "id": "text-5xl",
        "name": "text-5xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 5xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 3,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 334
      },
      {
        "id": "text-6xl",
        "name": "text-6xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 6xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 3.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 335
      },
      {
        "id": "text-7xl",
        "name": "text-7xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 7xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 4.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 336
      },
      {
        "id": "text-8xl",
        "name": "text-8xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 8xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 6,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 337
      },
      {
        "id": "text-9xl",
        "name": "text-9xl",
        "type": "dimension",
        "groupId": "font-size",
        "description": "Tailwind font size primitive 9xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 8,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 338
      },
      {
        "id": "font-thin",
        "name": "font-thin",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive thin.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 100
          }
        },
        "sortOrder": 339
      },
      {
        "id": "font-extralight",
        "name": "font-extralight",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive extralight.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 200
          }
        },
        "sortOrder": 340
      },
      {
        "id": "font-light",
        "name": "font-light",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive light.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 300
          }
        },
        "sortOrder": 341
      },
      {
        "id": "font-normal",
        "name": "font-normal",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive normal.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 400
          }
        },
        "sortOrder": 342
      },
      {
        "id": "font-medium",
        "name": "font-medium",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive medium.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 500
          }
        },
        "sortOrder": 343
      },
      {
        "id": "font-semibold",
        "name": "font-semibold",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive semibold.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 600
          }
        },
        "sortOrder": 344
      },
      {
        "id": "font-bold",
        "name": "font-bold",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive bold.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 700
          }
        },
        "sortOrder": 345
      },
      {
        "id": "font-extrabold",
        "name": "font-extrabold",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive extrabold.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 800
          }
        },
        "sortOrder": 346
      },
      {
        "id": "font-black",
        "name": "font-black",
        "type": "number",
        "groupId": "font-weight",
        "description": "Tailwind font weight primitive black.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 900
          }
        },
        "sortOrder": 347
      },
      {
        "id": "leading-none",
        "name": "leading-none",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive none.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 1
          }
        },
        "sortOrder": 348
      },
      {
        "id": "leading-tight",
        "name": "leading-tight",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive tight.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 1.25
          }
        },
        "sortOrder": 349
      },
      {
        "id": "leading-snug",
        "name": "leading-snug",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive snug.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 1.375
          }
        },
        "sortOrder": 350
      },
      {
        "id": "leading-normal",
        "name": "leading-normal",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive normal.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 1.5
          }
        },
        "sortOrder": 351
      },
      {
        "id": "leading-relaxed",
        "name": "leading-relaxed",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive relaxed.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 1.625
          }
        },
        "sortOrder": 352
      },
      {
        "id": "leading-loose",
        "name": "leading-loose",
        "type": "number",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive loose.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 2
          }
        },
        "sortOrder": 353
      },
      {
        "id": "leading-3",
        "name": "leading-3",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 3.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 354
      },
      {
        "id": "leading-4",
        "name": "leading-4",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 4.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 355
      },
      {
        "id": "leading-5",
        "name": "leading-5",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 5.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 356
      },
      {
        "id": "leading-6",
        "name": "leading-6",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 6.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 357
      },
      {
        "id": "leading-7",
        "name": "leading-7",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 7.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1.75,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 358
      },
      {
        "id": "leading-8",
        "name": "leading-8",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 8.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 359
      },
      {
        "id": "leading-9",
        "name": "leading-9",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 9.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.25,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 360
      },
      {
        "id": "leading-10",
        "name": "leading-10",
        "type": "dimension",
        "groupId": "line-height",
        "description": "Tailwind line-height primitive 10.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 2.5,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 361
      },
      {
        "id": "tracking-tighter",
        "name": "tracking-tighter",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive tighter.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": -0.05,
              "unit": "em"
            }
          }
        },
        "sortOrder": 362
      },
      {
        "id": "tracking-tight",
        "name": "tracking-tight",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive tight.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": -0.025,
              "unit": "em"
            }
          }
        },
        "sortOrder": 363
      },
      {
        "id": "tracking-normal",
        "name": "tracking-normal",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive normal.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "em"
            }
          }
        },
        "sortOrder": 364
      },
      {
        "id": "tracking-wide",
        "name": "tracking-wide",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive wide.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.025,
              "unit": "em"
            }
          }
        },
        "sortOrder": 365
      },
      {
        "id": "tracking-wider",
        "name": "tracking-wider",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive wider.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.05,
              "unit": "em"
            }
          }
        },
        "sortOrder": 366
      },
      {
        "id": "tracking-widest",
        "name": "tracking-widest",
        "type": "dimension",
        "groupId": "letter-spacing",
        "description": "Tailwind letter-spacing primitive widest.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0.1,
              "unit": "em"
            }
          }
        },
        "sortOrder": 367
      },
      {
        "id": "shadow-sm",
        "name": "shadow-sm",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive sm.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 1px 2px 0 rgb(0 0 0 / 0.05)"
          }
        },
        "sortOrder": 368
      },
      {
        "id": "shadow-DEFAULT",
        "name": "shadow-DEFAULT",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive DEFAULT.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
          }
        },
        "sortOrder": 369
      },
      {
        "id": "shadow-md",
        "name": "shadow-md",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive md.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
          }
        },
        "sortOrder": 370
      },
      {
        "id": "shadow-lg",
        "name": "shadow-lg",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive lg.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
          }
        },
        "sortOrder": 371
      },
      {
        "id": "shadow-xl",
        "name": "shadow-xl",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
          }
        },
        "sortOrder": 372
      },
      {
        "id": "shadow-2xl",
        "name": "shadow-2xl",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive 2xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
          }
        },
        "sortOrder": 373
      },
      {
        "id": "shadow-inner",
        "name": "shadow-inner",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive inner.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
          }
        },
        "sortOrder": 374
      },
      {
        "id": "shadow-none",
        "name": "shadow-none",
        "type": "string",
        "groupId": "box-shadow",
        "description": "Tailwind box-shadow primitive none.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "none"
          }
        },
        "sortOrder": 375
      },
      {
        "id": "blur-none",
        "name": "blur-none",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive none.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 0,
              "unit": "px"
            }
          }
        },
        "sortOrder": 376
      },
      {
        "id": "blur-sm",
        "name": "blur-sm",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive sm.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 4,
              "unit": "px"
            }
          }
        },
        "sortOrder": 377
      },
      {
        "id": "blur-DEFAULT",
        "name": "blur-DEFAULT",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive DEFAULT.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 8,
              "unit": "px"
            }
          }
        },
        "sortOrder": 378
      },
      {
        "id": "blur-md",
        "name": "blur-md",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive md.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 12,
              "unit": "px"
            }
          }
        },
        "sortOrder": 379
      },
      {
        "id": "blur-lg",
        "name": "blur-lg",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive lg.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 16,
              "unit": "px"
            }
          }
        },
        "sortOrder": 380
      },
      {
        "id": "blur-xl",
        "name": "blur-xl",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 24,
              "unit": "px"
            }
          }
        },
        "sortOrder": 381
      },
      {
        "id": "blur-2xl",
        "name": "blur-2xl",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive 2xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 40,
              "unit": "px"
            }
          }
        },
        "sortOrder": 382
      },
      {
        "id": "blur-3xl",
        "name": "blur-3xl",
        "type": "dimension",
        "groupId": "blur",
        "description": "Tailwind blur primitive 3xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 64,
              "unit": "px"
            }
          }
        },
        "sortOrder": 383
      },
      {
        "id": "screen-sm",
        "name": "screen-sm",
        "type": "dimension",
        "groupId": "screens",
        "description": "Tailwind screen breakpoint primitive sm.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 40,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 384
      },
      {
        "id": "screen-md",
        "name": "screen-md",
        "type": "dimension",
        "groupId": "screens",
        "description": "Tailwind screen breakpoint primitive md.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 48,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 385
      },
      {
        "id": "screen-lg",
        "name": "screen-lg",
        "type": "dimension",
        "groupId": "screens",
        "description": "Tailwind screen breakpoint primitive lg.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 64,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 386
      },
      {
        "id": "screen-xl",
        "name": "screen-xl",
        "type": "dimension",
        "groupId": "screens",
        "description": "Tailwind screen breakpoint primitive xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 80,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 387
      },
      {
        "id": "screen-2xl",
        "name": "screen-2xl",
        "type": "dimension",
        "groupId": "screens",
        "description": "Tailwind screen breakpoint primitive 2xl.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 96,
              "unit": "rem"
            }
          }
        },
        "sortOrder": 388
      },
      {
        "id": "z-0",
        "name": "z-0",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 0.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 0
          }
        },
        "sortOrder": 389
      },
      {
        "id": "z-10",
        "name": "z-10",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 10.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 10
          }
        },
        "sortOrder": 390
      },
      {
        "id": "z-20",
        "name": "z-20",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 20.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 20
          }
        },
        "sortOrder": 391
      },
      {
        "id": "z-30",
        "name": "z-30",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 30.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 30
          }
        },
        "sortOrder": 392
      },
      {
        "id": "z-40",
        "name": "z-40",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 40.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 40
          }
        },
        "sortOrder": 393
      },
      {
        "id": "z-50",
        "name": "z-50",
        "type": "number",
        "groupId": "z-index",
        "description": "Tailwind z-index primitive 50.",
        "values": {
          "default": {
            "kind": "raw",
            "value": 50
          }
        },
        "sortOrder": 394
      },
      {
        "id": "duration-75",
        "name": "duration-75",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 75.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 75,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 395
      },
      {
        "id": "duration-100",
        "name": "duration-100",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 100.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 100,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 396
      },
      {
        "id": "duration-150",
        "name": "duration-150",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 150.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 150,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 397
      },
      {
        "id": "duration-200",
        "name": "duration-200",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 200.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 200,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 398
      },
      {
        "id": "duration-300",
        "name": "duration-300",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 300.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 300,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 399
      },
      {
        "id": "duration-500",
        "name": "duration-500",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 500.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 500,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 400
      },
      {
        "id": "duration-700",
        "name": "duration-700",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 700.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 700,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 401
      },
      {
        "id": "duration-1000",
        "name": "duration-1000",
        "type": "duration",
        "groupId": "duration",
        "description": "Tailwind duration primitive 1000.",
        "values": {
          "default": {
            "kind": "raw",
            "value": {
              "value": 1000,
              "unit": "ms"
            }
          }
        },
        "sortOrder": 402
      },
      {
        "id": "ease-linear",
        "name": "ease-linear",
        "type": "string",
        "groupId": "easing",
        "description": "Tailwind easing primitive linear.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "linear"
          }
        },
        "sortOrder": 403
      },
      {
        "id": "ease-in",
        "name": "ease-in",
        "type": "string",
        "groupId": "easing",
        "description": "Tailwind easing primitive in.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "cubic-bezier(0.4, 0, 1, 1)"
          }
        },
        "sortOrder": 404
      },
      {
        "id": "ease-out",
        "name": "ease-out",
        "type": "string",
        "groupId": "easing",
        "description": "Tailwind easing primitive out.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "cubic-bezier(0, 0, 0.2, 1)"
          }
        },
        "sortOrder": 405
      },
      {
        "id": "ease-in-out",
        "name": "ease-in-out",
        "type": "string",
        "groupId": "easing",
        "description": "Tailwind easing primitive in-out.",
        "values": {
          "default": {
            "kind": "raw",
            "value": "cubic-bezier(0.4, 0, 0.2, 1)"
          }
        },
        "sortOrder": 406
      }
    ],
    "extensions": {
      "source": "tailwind-default-theme-primitives",
      "layer": "primitive",
      "inspiredBy": "tailwindcss"
    }
  };
}

function createWorkbenchComponentTokenCollection() {
  const groups = [
    ['accordion', 'Accordion'],
    ['alert', 'Alert'],
    ['alert-dialog', 'Alert dialog'],
    ['aspect-ratio', 'Aspect ratio'],
    ['attachment', 'Attachment'],
    ['avatar', 'Avatar'],
    ['badge', 'Badge'],
    ['breadcrumb', 'Breadcrumb'],
    ['button', 'Button'],
    ['button-group', 'Button group'],
    ['calendar', 'Calendar'],
    ['card', 'Card'],
    ['carousel', 'Carousel'],
    ['chart', 'Chart'],
    ['checkbox', 'Checkbox'],
    ['collapsible', 'Collapsible'],
    ['combobox', 'Combobox'],
    ['command', 'Command'],
    ['context-menu', 'Context menu'],
    ['date-picker', 'Date picker'],
    ['date-range-picker', 'Date range picker'],
    ['dialog', 'Dialog'],
    ['drawer', 'Drawer'],
    ['dropdown-menu', 'Dropdown menu'],
    ['empty', 'Empty'],
    ['field', 'Field'],
    ['focus', 'Focus'],
    ['hover-card', 'Hover card'],
    ['input', 'Input'],
    ['input-group', 'Input group'],
    ['input-otp', 'Input OTP'],
    ['item', 'Item'],
    ['kbd', 'Kbd'],
    ['label', 'Label'],
    ['menubar', 'Menubar'],
    ['native-select', 'Native select'],
    ['navigation-menu', 'Navigation menu'],
    ['pagination', 'Pagination'],
    ['popover', 'Popover'],
    ['progress', 'Progress'],
    ['radio', 'Radio group'],
    ['resizable', 'Resizable'],
    ['scroll-area', 'Scroll area'],
    ['select', 'Select'],
    ['separator', 'Separator'],
    ['shared', 'Shared component roles'],
    ['sheet', 'Sheet'],
    ['sidebar', 'Sidebar'],
    ['skeleton', 'Skeleton'],
    ['slider', 'Slider'],
    ['spinner', 'Spinner'],
    ['table', 'Table'],
    ['tabs', 'Tabs'],
    ['textarea', 'Textarea'],
    ['toast', 'Toast'],
    ['toggle', 'Toggle'],
    ['toggle-group', 'Toggle group'],
    ['switch', 'Switch'],
    ['tooltip', 'Tooltip'],
  ].map(([id, name], sortOrder) => ({ id, name, sortOrder }));

  const tokens = [
    refToken('surface', 'Surface', 'color', 'shared', 'workbench-semantic-color', 'surface', 0),
    refToken('text', 'Text', 'color', 'shared', 'workbench-semantic-color', 'text', 1),
    refToken('muted', 'Muted surface', 'color', 'shared', 'workbench-semantic-color', 'muted-surface', 2),
    refToken('muted-foreground', 'Muted foreground', 'color', 'shared', 'workbench-semantic-color', 'muted-text', 3),
    refToken('border', 'Border', 'color', 'shared', 'workbench-semantic-color', 'border', 4),
    refToken('accent', 'Accent', 'color', 'shared', 'workbench-semantic-color', 'action-primary', 5),
    refToken('accent-hover', 'Accent hover', 'color', 'shared', 'workbench-semantic-color', 'action-primary-hover', 6),
    refToken('accent-foreground', 'Accent foreground', 'color', 'shared', 'workbench-semantic-color', 'action-primary-text', 7),
    refToken('destructive', 'Destructive', 'color', 'shared', 'workbench-semantic-color', 'destructive', 8),
    refToken('destructive-hover', 'Destructive hover', 'color', 'shared', 'workbench-semantic-color', 'destructive-hover', 9),
    refToken('focus-ring', 'Focus ring', 'color', 'focus', 'workbench-semantic-color', 'focus-ring', 10),
    refToken('radius-sm', 'Radius small', 'dimension', 'shared', 'workbench-semantic-radius', 'control-sm', 11),
    refToken('radius-md', 'Radius medium', 'dimension', 'shared', 'workbench-semantic-radius', 'surface-md', 12),
    refToken('text-color-primary', 'Text color primary', 'color', 'shared', 'workbench-semantic-color', 'text-primary', 13),
    refToken('text-color-muted', 'Text color muted', 'color', 'shared', 'workbench-semantic-color', 'text-muted', 14),
    refToken('text-color-on-accent', 'Text color on accent', 'color', 'shared', 'workbench-semantic-color', 'text-on-action', 15),
    refToken('text-color-danger', 'Text color danger', 'color', 'shared', 'workbench-semantic-color', 'text-danger', 16),
    refToken('font-size-xs', 'Font size extra small', 'dimension', 'shared', 'workbench-semantic-typography', 'text-xs-size', 17),
    refToken('font-size-sm', 'Font size small', 'dimension', 'shared', 'workbench-semantic-typography', 'text-sm-size', 18),
    refToken('font-size-md', 'Font size medium', 'dimension', 'shared', 'workbench-semantic-typography', 'text-md-size', 19),
    refToken('font-size-lg', 'Font size large', 'dimension', 'shared', 'workbench-semantic-typography', 'body-size', 20),
    refToken('font-size-title', 'Font size title', 'dimension', 'shared', 'workbench-semantic-typography', 'title-size', 21),
    refToken('font-size-display', 'Font size display', 'string', 'shared', 'workbench-semantic-typography', 'display-size', 22),
    refToken('font-weight-regular', 'Font weight regular', 'number', 'shared', 'workbench-semantic-typography', 'weight-normal', 22.5),
    refToken('font-weight-medium', 'Font weight medium', 'number', 'shared', 'workbench-semantic-typography', 'weight-medium', 23),
    refToken('font-weight-semibold', 'Font weight semibold', 'number', 'shared', 'workbench-semantic-typography', 'weight-semibold', 24),
    refToken('font-weight-bold', 'Font weight bold', 'number', 'shared', 'workbench-semantic-typography', 'weight-bold', 25),
    refToken('line-height-tight', 'Line height tight', 'number', 'shared', 'workbench-semantic-typography', 'line-tight', 26),
    refToken('line-height-display', 'Line height display', 'number', 'shared', 'workbench-semantic-typography', 'line-display', 27),
    refToken('line-height-title', 'Line height title', 'number', 'shared', 'workbench-semantic-typography', 'line-title', 28),
    refToken('line-height-normal', 'Line height normal', 'number', 'shared', 'workbench-semantic-typography', 'line-normal', 29),
    refToken('line-height-body', 'Line height body', 'number', 'shared', 'workbench-semantic-typography', 'line-body', 30),
    refToken('line-height-relaxed', 'Line height relaxed', 'number', 'shared', 'workbench-semantic-typography', 'line-relaxed', 31),
    refToken('line-height-xs', 'Line height extra small', 'dimension', 'shared', 'workbench-semantic-typography', 'line-xs', 31.1),
    dimensionToken('ring-offset', 'Ring offset', 'focus', 2, 'px', 32),
    refToken('button-height-sm', 'Button height small', 'dimension', 'button', 'workbench-semantic-spacing', 'control-height-sm', 33),
    refToken('button-height-md', 'Button height medium', 'dimension', 'button', 'workbench-semantic-spacing', 'control-height-md', 34),
    refToken('button-height-lg', 'Button height large', 'dimension', 'button', 'workbench-semantic-spacing', 'control-height-lg', 35),
    refToken('button-padding-x', 'Button horizontal padding', 'dimension', 'button', 'workbench-semantic-spacing', 'control-padding-x-lg', 36),
    refToken('button-height-xs', 'Button height extra small', 'dimension', 'button', 'workbench-semantic-spacing', 'control-height-xs', 36.1),
    refToken('button-padding-x-xs', 'Button horizontal padding extra small', 'dimension', 'button', 'workbench-semantic-spacing', 'control-padding-x-sm', 36.2),
    refToken('button-padding-x-sm', 'Button horizontal padding small', 'dimension', 'button', 'workbench-semantic-spacing', 'control-padding-x-md', 36.3),
    refToken('button-padding-x-lg', 'Button horizontal padding large', 'dimension', 'button', 'workbench-semantic-spacing', 'control-padding-x-xl', 36.4),
    dimensionToken('card-padding', 'Card padding', 'card', 24, 'px', 37),
    dimensionToken('card-gap', 'Card gap', 'card', 16, 'px', 38),
    refToken('card-shadow', 'Card shadow', 'string', 'card', 'workbench-semantic-effect', 'shadow-lg', 39),
    dimensionToken('input-height', 'Input height', 'input', 40, 'px', 40),
    refToken('progress-track', 'Progress track', 'color', 'progress', 'workbench-semantic-color', 'muted-surface', 41),
    refToken('progress-indicator', 'Progress indicator', 'color', 'progress', 'workbench-semantic-color', 'action-primary', 42),
    dimensionToken('progress-track-height', 'Progress track height', 'progress', 10, 'px', 43),
    refToken('progress-radius', 'Progress radius', 'dimension', 'progress', 'workbench-semantic-radius', 'pill', 44),
    refToken('slider-track', 'Slider track', 'color', 'slider', 'workbench-semantic-color', 'muted-surface', 45),
    refToken('slider-range', 'Slider range', 'color', 'slider', 'workbench-semantic-color', 'action-primary', 46),
    refToken('slider-thumb', 'Slider thumb', 'color', 'slider', 'workbench-semantic-color', 'surface', 47),
    refToken('slider-thumb-border', 'Slider thumb border', 'color', 'slider', 'workbench-semantic-color', 'action-primary', 48),
    dimensionToken('slider-track-height', 'Slider track height', 'slider', 6, 'px', 49),
    dimensionToken('slider-thumb-size', 'Slider thumb size', 'slider', 18, 'px', 50),
    dimensionToken('slider-control-height', 'Slider control height', 'slider', 28, 'px', 51),
    refToken('radio-background', 'Radio background', 'color', 'radio', 'workbench-semantic-color', 'surface', 52),
    refToken('radio-border', 'Radio border', 'color', 'radio', 'workbench-semantic-color', 'border', 53),
    refToken('radio-selected', 'Radio selected', 'color', 'radio', 'workbench-semantic-color', 'action-primary', 54),
    dimensionToken('radio-size', 'Radio size', 'radio', 18, 'px', 55),
    dimensionToken('radio-indicator-size', 'Radio indicator size', 'radio', 8, 'px', 56),
    refToken('accordion-surface', 'Accordion surface', 'color', 'accordion', 'workbench-semantic-color', 'surface', 57),
    refToken('accordion-border', 'Accordion border', 'color', 'accordion', 'workbench-semantic-color', 'border', 58),
    dimensionToken('accordion-trigger-height', 'Accordion trigger height', 'accordion', 42, 'px', 59),
    dimensionToken('accordion-padding-x', 'Accordion horizontal padding', 'accordion', 14, 'px', 60),
    refToken('accordion-title-color', 'Accordion title color', 'color', 'accordion', 'workbench-semantic-color', 'text-primary', 60.1),
    refToken('accordion-title-font-size', 'Accordion title font size', 'dimension', 'accordion', 'workbench-semantic-typography', 'text-sm-size', 60.2),
    refToken('accordion-title-line-height', 'Accordion title line height', 'number', 'accordion', 'workbench-semantic-typography', 'line-normal', 60.3),
    refToken('accordion-title-font-weight', 'Accordion title font weight', 'number', 'accordion', 'workbench-semantic-typography', 'weight-medium', 60.4),
    refToken('accordion-content-color', 'Accordion content color', 'color', 'accordion', 'workbench-semantic-color', 'text-muted', 60.5),
    refToken('accordion-content-font-size', 'Accordion content font size', 'dimension', 'accordion', 'workbench-semantic-typography', 'text-sm-size', 60.6),
    refToken('accordion-content-line-height', 'Accordion content line height', 'number', 'accordion', 'workbench-semantic-typography', 'line-normal', 60.7),
    refToken('accordion-content-font-weight', 'Accordion content font weight', 'number', 'accordion', 'workbench-semantic-typography', 'weight-normal', 60.8),
    dimensionToken('accordion-content-gap', 'Accordion content gap', 'accordion', 10, 'px', 60.9),
    dimensionToken('accordion-content-padding-y', 'Accordion content vertical padding', 'accordion', 10, 'px', 60.95),
    refToken('accordion-divider-color', 'Accordion divider color', 'color', 'accordion', 'workbench-semantic-color', 'border', 60.96),
    dimensionToken('accordion-divider-width', 'Accordion divider width', 'accordion', 1, 'px', 60.97),
    refToken('table-surface', 'Table surface', 'color', 'table', 'workbench-semantic-color', 'surface', 61),
    refToken('table-border', 'Table border', 'color', 'table', 'workbench-semantic-color', 'border', 62),
    dimensionToken('table-cell-padding-x', 'Table cell horizontal padding', 'table', 12, 'px', 63),
    dimensionToken('table-cell-padding-y', 'Table cell vertical padding', 'table', 11, 'px', 64),
    refToken('badge-background', 'Badge background', 'color', 'badge', 'workbench-semantic-color', 'muted-surface', 65),
    refToken('badge-foreground', 'Badge foreground', 'color', 'badge', 'workbench-semantic-color', 'text-primary', 66),
    refToken('badge-primary-background', 'Badge primary background', 'color', 'badge', 'workbench-semantic-color', 'action-primary', 67),
    refToken('badge-primary-foreground', 'Badge primary foreground', 'color', 'badge', 'workbench-semantic-color', 'text-on-action', 68),
    refToken('badge-destructive-background', 'Badge destructive background', 'color', 'badge', 'workbench-semantic-color', 'destructive', 69),
    refToken('badge-radius', 'Badge radius', 'dimension', 'badge', 'workbench-semantic-radius', 'pill', 70),
    refToken('badge-padding-x', 'Badge horizontal padding', 'dimension', 'badge', 'workbench-semantic-spacing', 'control-padding-x-sm', 71),
    refToken('badge-height', 'Badge height', 'dimension', 'badge', 'workbench-semantic-spacing', 'inline-label-height-sm', 72),
    refToken('alert-background', 'Alert background', 'color', 'alert', 'workbench-semantic-color', 'surface', 73),
    refToken('alert-foreground', 'Alert foreground', 'color', 'alert', 'workbench-semantic-color', 'text-primary', 74),
    refToken('alert-border', 'Alert border', 'color', 'alert', 'workbench-semantic-color', 'border', 75),
    refToken('alert-destructive-border', 'Alert destructive border', 'color', 'alert', 'workbench-semantic-color', 'destructive', 76),
    refToken('alert-destructive-foreground', 'Alert destructive foreground', 'color', 'alert', 'workbench-semantic-color', 'text-danger', 76.1),
    refToken('alert-icon-color', 'Alert icon color', 'color', 'alert', 'workbench-semantic-color', 'text-primary', 76.2),
    refToken('alert-title-color', 'Alert title color', 'color', 'alert', 'workbench-semantic-color', 'text-primary', 76.3),
    refToken('alert-description-color', 'Alert description color', 'color', 'alert', 'workbench-semantic-color', 'text-muted', 76.4),
    refToken('alert-radius', 'Alert radius', 'dimension', 'alert', 'workbench-semantic-radius', 'surface-md', 77),
    refToken('alert-padding', 'Alert padding', 'dimension', 'alert', 'workbench-semantic-spacing', 'surface-padding-md', 78),
    dimensionToken('alert-padding-x', 'Alert horizontal padding', 'alert', 16, 'px', 78.1),
    dimensionToken('alert-padding-y', 'Alert vertical padding', 'alert', 12, 'px', 78.2),
    dimensionToken('alert-gap-x', 'Alert icon gap', 'alert', 12, 'px', 78.3),
    dimensionToken('alert-gap-y', 'Alert content gap', 'alert', 2, 'px', 78.4),
    dimensionToken('alert-icon-size', 'Alert icon size', 'alert', 16, 'px', 78.5),
    dimensionToken('alert-action-offset-x', 'Alert action offset x', 'alert', 8, 'px', 78.6),
    dimensionToken('alert-action-offset-y', 'Alert action offset y', 'alert', 8, 'px', 78.7),
    dimensionToken('alert-action-gap', 'Alert action gap', 'alert', 8, 'px', 78.8),
    dimensionToken('alert-action-space', 'Alert action reserved space', 'alert', 72, 'px', 78.9),
    refToken('alert-title-font-size', 'Alert title font size', 'dimension', 'alert', 'workbench-semantic-typography', 'text-md-size', 78.91),
    refToken('alert-title-line-height', 'Alert title line height', 'number', 'alert', 'workbench-semantic-typography', 'line-tight', 78.92),
    refToken('alert-title-font-weight', 'Alert title font weight', 'number', 'alert', 'workbench-semantic-typography', 'weight-medium', 78.93),
    refToken('alert-description-font-size', 'Alert description font size', 'dimension', 'alert', 'workbench-semantic-typography', 'text-sm-size', 78.94),
    refToken('alert-description-line-height', 'Alert description line height', 'number', 'alert', 'workbench-semantic-typography', 'line-normal', 78.95),
    refToken('alert-description-font-weight', 'Alert description font weight', 'number', 'alert', 'workbench-semantic-typography', 'weight-normal', 78.96),
    refToken('dialog-background', 'Dialog background', 'color', 'dialog', 'workbench-semantic-color', 'surface', 79),
    refToken('dialog-foreground', 'Dialog foreground', 'color', 'dialog', 'workbench-semantic-color', 'text-primary', 80),
    refToken('dialog-border', 'Dialog border', 'color', 'dialog', 'workbench-semantic-color', 'border', 81),
    refToken('dialog-radius', 'Dialog radius', 'dimension', 'dialog', 'workbench-semantic-radius', 'surface-lg', 82),
    refToken('dialog-padding', 'Dialog padding', 'dimension', 'dialog', 'workbench-semantic-spacing', 'surface-padding-md', 83),
    refToken('dialog-gap', 'Dialog gap', 'dimension', 'dialog', 'workbench-semantic-spacing', 'surface-gap-md', 84),
    refToken('dialog-shadow', 'Dialog shadow', 'string', 'dialog', 'workbench-semantic-effect', 'shadow-lg', 85),
    refToken('popover-background', 'Popover background', 'color', 'popover', 'workbench-semantic-color', 'popover', 86),
    refToken('popover-foreground', 'Popover foreground', 'color', 'popover', 'workbench-semantic-color', 'popover-foreground', 87),
    refToken('popover-border', 'Popover border', 'color', 'popover', 'workbench-semantic-color', 'border', 88),
    refToken('popover-radius', 'Popover radius', 'dimension', 'popover', 'workbench-semantic-radius', 'surface-md', 89),
    refToken('popover-padding', 'Popover padding', 'dimension', 'popover', 'workbench-semantic-spacing', 'surface-padding-sm', 90),
    refToken('shadow-xl', 'Popover shadow', 'string', 'popover', 'workbench-semantic-effect', 'shadow-xl', 91),
    refToken('dropdown-menu-background', 'Dropdown menu background', 'color', 'dropdown-menu', 'workbench-semantic-color', 'popover', 92),
    refToken('dropdown-menu-foreground', 'Dropdown menu foreground', 'color', 'dropdown-menu', 'workbench-semantic-color', 'popover-foreground', 93),
    refToken('dropdown-menu-border', 'Dropdown menu border', 'color', 'dropdown-menu', 'workbench-semantic-color', 'border', 94),
    refToken('dropdown-menu-item-hover-background', 'Dropdown menu item hover background', 'color', 'dropdown-menu', 'workbench-semantic-color', 'muted-surface', 95),
    refToken('dropdown-menu-item-hover-foreground', 'Dropdown menu item hover foreground', 'color', 'dropdown-menu', 'workbench-semantic-color', 'popover-foreground', 95.5),
    refToken('dropdown-menu-item-height', 'Dropdown menu item height', 'dimension', 'dropdown-menu', 'workbench-semantic-spacing', 'control-height-sm', 96),
    refToken('dropdown-menu-item-padding-x', 'Dropdown menu item horizontal padding', 'dimension', 'dropdown-menu', 'workbench-semantic-spacing', 'control-padding-x-md', 97),
    refToken('dropdown-menu-radius', 'Dropdown menu radius', 'dimension', 'dropdown-menu', 'workbench-semantic-radius', 'surface-md', 98),
    refToken('dropdown-menu-trigger-gap', 'Dropdown menu trigger gap', 'dimension', 'dropdown-menu', 'workbench-semantic-spacing', 'floating-layer-gap-sm', 98.5),
    refToken('tabs-list-background', 'Tabs list background', 'color', 'tabs', 'workbench-semantic-color', 'muted-surface', 99),
    refToken('tabs-trigger-background', 'Tabs trigger background', 'color', 'tabs', 'workbench-semantic-color', 'surface', 100),
    refToken('tabs-trigger-foreground', 'Tabs trigger foreground', 'color', 'tabs', 'workbench-semantic-color', 'text-primary', 101),
    refToken('tabs-trigger-muted-foreground', 'Tabs trigger muted foreground', 'color', 'tabs', 'workbench-semantic-color', 'text-muted', 102),
    refToken('tabs-radius', 'Tabs radius', 'dimension', 'tabs', 'workbench-semantic-radius', 'control-sm', 103),
    refToken('tabs-trigger-height', 'Tabs trigger height', 'dimension', 'tabs', 'workbench-semantic-spacing', 'control-height-sm', 104),
    refToken('tabs-trigger-padding-x', 'Tabs trigger horizontal padding', 'dimension', 'tabs', 'workbench-semantic-spacing', 'control-padding-x-md', 105),
    refToken('select-trigger-height', 'Select trigger height', 'dimension', 'select', 'workbench-semantic-spacing', 'control-height-md', 106),
    refToken('select-trigger-background', 'Select trigger background', 'color', 'select', 'workbench-semantic-color', 'surface', 107),
    refToken('select-trigger-foreground', 'Select trigger foreground', 'color', 'select', 'workbench-semantic-color', 'text-primary', 108),
    refToken('select-trigger-border', 'Select trigger border', 'color', 'select', 'workbench-semantic-color', 'border', 109),
    refToken('select-content-background', 'Select content background', 'color', 'select', 'workbench-components', 'dropdown-menu-background', 110),
    refToken('select-item-foreground', 'Select item foreground', 'color', 'select', 'workbench-components', 'dropdown-menu-foreground', 110.25),
    refToken('select-item-hover-background', 'Select item hover background', 'color', 'select', 'workbench-components', 'dropdown-menu-item-hover-background', 111),
    refToken('select-item-hover-foreground', 'Select item hover foreground', 'color', 'select', 'workbench-components', 'dropdown-menu-item-hover-foreground', 111.25),
    refToken('select-radius', 'Select radius', 'dimension', 'select', 'workbench-semantic-radius', 'control-sm', 112),
    refToken('checkbox-size', 'Checkbox size', 'dimension', 'checkbox', 'workbench-semantic-spacing', 'control-indicator-md', 113),
    refToken('checkbox-background', 'Checkbox background', 'color', 'checkbox', 'workbench-semantic-color', 'surface', 114),
    refToken('checkbox-border', 'Checkbox border', 'color', 'checkbox', 'workbench-semantic-color', 'border', 115),
    refToken('checkbox-selected-background', 'Checkbox selected background', 'color', 'checkbox', 'workbench-semantic-color', 'action-primary', 116),
    refToken('checkbox-selected-foreground', 'Checkbox selected foreground', 'color', 'checkbox', 'workbench-semantic-color', 'text-on-action', 117),
    refToken('checkbox-radius', 'Checkbox radius', 'dimension', 'checkbox', 'workbench-semantic-radius', 'control-xs', 118),
    refToken('switch-track-width', 'Switch track width', 'dimension', 'switch', 'workbench-semantic-spacing', 'switch-track-width', 119),
    refToken('switch-track-height', 'Switch track height', 'dimension', 'switch', 'workbench-semantic-spacing', 'switch-track-height', 120),
    refToken('switch-thumb-size', 'Switch thumb size', 'dimension', 'switch', 'workbench-semantic-spacing', 'switch-thumb-size', 121),
    refToken('switch-track-background', 'Switch track background', 'color', 'switch', 'workbench-semantic-color', 'muted-surface', 122),
    refToken('switch-track-checked-background', 'Switch track checked background', 'color', 'switch', 'workbench-semantic-color', 'action-primary', 123),
    refToken('switch-thumb-background', 'Switch thumb background', 'color', 'switch', 'workbench-semantic-color', 'surface', 124),
    refToken('tooltip-background', 'Tooltip background', 'color', 'tooltip', 'workbench-semantic-color', 'inverse-surface', 125),
    refToken('tooltip-foreground', 'Tooltip foreground', 'color', 'tooltip', 'workbench-semantic-color', 'inverse-text', 126),
    refToken('tooltip-radius', 'Tooltip radius', 'dimension', 'tooltip', 'workbench-semantic-radius', 'control-sm', 127),
    refToken('tooltip-padding-x', 'Tooltip horizontal padding', 'dimension', 'tooltip', 'workbench-semantic-spacing', 'control-padding-x-sm', 128),
    refToken('tooltip-padding-y', 'Tooltip vertical padding', 'dimension', 'tooltip', 'workbench-semantic-spacing', 'control-padding-y-xs', 129),
    refToken('avatar-size-sm', 'Avatar size small', 'dimension', 'avatar', 'workbench-semantic-spacing', 'avatar-size-sm', 130),
    refToken('avatar-size-md', 'Avatar size medium', 'dimension', 'avatar', 'workbench-semantic-spacing', 'avatar-size-md', 131),
    refToken('avatar-size-lg', 'Avatar size large', 'dimension', 'avatar', 'workbench-semantic-spacing', 'avatar-size-lg', 132),
    refToken('avatar-background', 'Avatar background', 'color', 'avatar', 'workbench-semantic-color', 'muted-surface', 133),
    refToken('avatar-foreground', 'Avatar foreground', 'color', 'avatar', 'workbench-semantic-color', 'text-muted', 134),
    refToken('avatar-radius', 'Avatar radius', 'dimension', 'avatar', 'workbench-semantic-radius', 'pill', 135),
    refToken('skeleton-background', 'Skeleton background', 'color', 'skeleton', 'workbench-semantic-color', 'muted-surface', 136),
    refToken('skeleton-radius', 'Skeleton radius', 'dimension', 'skeleton', 'workbench-semantic-radius', 'surface-md', 137),
    refToken('toast-background', 'Toast background', 'color', 'toast', 'workbench-semantic-color', 'surface', 138),
    refToken('toast-foreground', 'Toast foreground', 'color', 'toast', 'workbench-semantic-color', 'text-primary', 139),
    refToken('toast-border', 'Toast border', 'color', 'toast', 'workbench-semantic-color', 'border', 140),
    refToken('toast-radius', 'Toast radius', 'dimension', 'toast', 'workbench-semantic-radius', 'surface-md', 141),
    refToken('toast-padding', 'Toast padding', 'dimension', 'toast', 'workbench-semantic-spacing', 'surface-padding-md', 142),
    refToken('toast-shadow', 'Toast shadow', 'string', 'toast', 'workbench-semantic-effect', 'shadow-xl', 143),
    refToken('sheet-background', 'Sheet background', 'color', 'sheet', 'workbench-semantic-color', 'surface', 144),
    refToken('sheet-foreground', 'Sheet foreground', 'color', 'sheet', 'workbench-semantic-color', 'text-primary', 145),
    refToken('sheet-border', 'Sheet border', 'color', 'sheet', 'workbench-semantic-color', 'border', 146),
    refToken('sheet-padding', 'Sheet padding', 'dimension', 'sheet', 'workbench-semantic-spacing', 'surface-padding-lg', 147),
    refToken('sheet-shadow', 'Sheet shadow', 'string', 'sheet', 'workbench-semantic-effect', 'shadow-xl', 148),
    ...createWorkbenchAdditionalComponentTokens(149),
  ];

  return {
    id: 'workbench-components',
    name: 'Workbench Components',
    description: 'Component-scoped tokens for the bundled source component set.',
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups,
    tokens,
    extensions: {
      source: 'workbench-template',
      inspiredBy: 'shadcn/ui',
      registration: 'optional',
    },
  };
}

function createWorkbenchAdditionalComponentTokens(startSortOrder) {
  let sortOrder = startSortOrder;
  const next = () => sortOrder++;
  const color = (id, name, groupId, tokenId) => refToken(id, name, 'color', groupId, 'workbench-semantic-color', tokenId, next());
  const radius = (id, name, groupId, tokenId = 'surface-md') => refToken(id, name, 'dimension', groupId, 'workbench-semantic-radius', tokenId, next());
  const spacing = (id, name, groupId, tokenId) => refToken(id, name, 'dimension', groupId, 'workbench-semantic-spacing', tokenId, next());
  const shadow = (id, name, groupId, tokenId = 'shadow-xl') => refToken(id, name, 'string', groupId, 'workbench-semantic-effect', tokenId, next());
  const fontSize = (id, name, groupId, tokenId = 'text-sm-size') => refToken(id, name, 'dimension', groupId, 'workbench-semantic-typography', tokenId, next());
  const fontWeight = (id, name, groupId, tokenId = 'weight-medium') => refToken(id, name, 'number', groupId, 'workbench-semantic-typography', tokenId, next());
  const lineHeight = (id, name, groupId, tokenId = 'line-normal') => refToken(id, name, 'number', groupId, 'workbench-semantic-typography', tokenId, next());
  const dim = (id, name, groupId, value, unit = 'px') => dimensionToken(id, name, groupId, value, unit, next());
  const number = (id, name, groupId, value) => rawToken(id, name, 'number', groupId, value, next());

  const textRoleTokens = (groupId, label, titleSize = 'text-sm-size', titleWeight = 'weight-medium') => [
    color(`${groupId}-title-color`, `${label} title color`, groupId, 'text-primary'),
    color(`${groupId}-description-color`, `${label} description color`, groupId, 'text-muted'),
    fontSize(`${groupId}-title-font-size`, `${label} title font size`, groupId, titleSize),
    fontWeight(`${groupId}-title-font-weight`, `${label} title font weight`, groupId, titleWeight),
    lineHeight(`${groupId}-title-line-height`, `${label} title line height`, groupId, 'line-tight'),
    fontSize(`${groupId}-description-font-size`, `${label} description font size`, groupId, 'text-sm-size'),
    fontWeight(`${groupId}-description-font-weight`, `${label} description font weight`, groupId, 'weight-normal'),
    lineHeight(`${groupId}-description-line-height`, `${label} description line height`, groupId, 'line-normal'),
  ];

  const surfaceTokens = (groupId, label, options = {}) => {
    const {
      padding = 'surface-padding-md',
      gap = 'surface-gap-sm',
      radiusToken = 'surface-md',
      includeShadow = false,
      shadowToken = 'shadow-xl',
      titleSize = 'text-sm-size',
      titleWeight = 'weight-medium',
    } = options;
    return [
      color(`${groupId}-surface`, `${label} surface`, groupId, 'surface'),
      color(`${groupId}-foreground`, `${label} foreground`, groupId, 'text-primary'),
      color(`${groupId}-muted-foreground`, `${label} muted foreground`, groupId, 'text-muted'),
      color(`${groupId}-border`, `${label} border`, groupId, 'border'),
      radius(`${groupId}-radius`, `${label} radius`, groupId, radiusToken),
      spacing(`${groupId}-padding`, `${label} padding`, groupId, padding),
      spacing(`${groupId}-gap`, `${label} gap`, groupId, gap),
      ...textRoleTokens(groupId, label, titleSize, titleWeight),
      ...(includeShadow ? [shadow(`${groupId}-shadow`, `${label} shadow`, groupId, shadowToken)] : []),
    ];
  };

  const menuTokens = (groupId, label) => [
    color(`${groupId}-background`, `${label} background`, groupId, 'popover'),
    color(`${groupId}-foreground`, `${label} foreground`, groupId, 'popover-foreground'),
    color(`${groupId}-border`, `${label} border`, groupId, 'border'),
    color(`${groupId}-item-hover-background`, `${label} item hover background`, groupId, 'muted-surface'),
    color(`${groupId}-item-muted-foreground`, `${label} item muted foreground`, groupId, 'text-muted'),
    spacing(`${groupId}-item-height`, `${label} item height`, groupId, 'control-height-sm'),
    spacing(`${groupId}-item-padding-x`, `${label} item horizontal padding`, groupId, 'control-padding-x-md'),
    radius(`${groupId}-radius`, `${label} radius`, groupId, 'surface-md'),
    fontSize(`${groupId}-item-font-size`, `${label} item font size`, groupId, 'text-sm-size'),
    fontWeight(`${groupId}-item-font-weight`, `${label} item font weight`, groupId, 'weight-normal'),
    lineHeight(`${groupId}-item-line-height`, `${label} item line height`, groupId, 'line-normal'),
    dim(`${groupId}-icon-size`, `${label} icon size`, groupId, 16),
  ];

  const formControlTokens = (groupId, label) => [
    color(`${groupId}-background`, `${label} background`, groupId, 'surface'),
    color(`${groupId}-foreground`, `${label} foreground`, groupId, 'text-primary'),
    color(`${groupId}-placeholder`, `${label} placeholder`, groupId, 'text-muted'),
    color(`${groupId}-border`, `${label} border`, groupId, 'border'),
    radius(`${groupId}-radius`, `${label} radius`, groupId, 'control-sm'),
    spacing(`${groupId}-height`, `${label} height`, groupId, 'control-height-md'),
    spacing(`${groupId}-padding-x`, `${label} horizontal padding`, groupId, 'control-padding-x-md'),
    spacing(`${groupId}-padding-y`, `${label} vertical padding`, groupId, 'control-padding-y-sm'),
    fontSize(`${groupId}-font-size`, `${label} font size`, groupId, 'text-sm-size'),
    lineHeight(`${groupId}-line-height`, `${label} line height`, groupId, 'line-normal'),
  ];

  return [
    color('button-background', 'Button background', 'button', 'action-primary'),
    color('button-foreground', 'Button foreground', 'button', 'text-on-action'),
    color('button-hover-background', 'Button hover background', 'button', 'action-primary-hover'),
    color('button-outline-background', 'Button outline background', 'button', 'surface'),
    color('button-outline-border', 'Button outline border', 'button', 'border'),
    color('button-muted-background', 'Button muted background', 'button', 'muted-surface'),
    color('button-danger-background', 'Button danger background', 'button', 'destructive'),
    color('button-secondary-background', 'Button secondary background', 'button', 'secondary'),
    color('button-secondary-foreground', 'Button secondary foreground', 'button', 'secondary-foreground'),
    color('button-secondary-hover-background', 'Button secondary hover background', 'button', 'secondary-hover'),
    color('button-outline-foreground', 'Button outline foreground', 'button', 'text-primary'),
    color('button-outline-hover-background', 'Button outline hover background', 'button', 'muted-surface'),
    color('button-ghost-foreground', 'Button ghost foreground', 'button', 'text-primary'),
    color('button-ghost-hover-background', 'Button ghost hover background', 'button', 'muted-surface'),
    color('button-danger-foreground', 'Button danger foreground', 'button', 'text-danger'),
    color('button-danger-hover-background', 'Button danger hover background', 'button', 'destructive-hover'),
    color('button-link-foreground', 'Button link foreground', 'button', 'action-primary'),
    color('button-focus-ring', 'Button focus ring', 'button', 'focus-ring'),
    radius('button-radius', 'Button radius', 'button', 'control-sm'),
    spacing('button-gap', 'Button gap', 'button', 'surface-gap-sm'),
    fontSize('button-font-size', 'Button font size', 'button', 'text-sm-size'),
    fontWeight('button-font-weight', 'Button font weight', 'button', 'weight-medium'),
    lineHeight('button-line-height', 'Button line height', 'button', 'line-normal'),
    spacing('button-icon-size', 'Button icon size', 'button', 'control-icon-md'),
    spacing('button-icon-size-xs', 'Button icon size extra small', 'button', 'control-icon-xs'),
    spacing('button-icon-size-sm', 'Button icon size small', 'button', 'control-icon-sm'),
    spacing('button-press-offset', 'Button pressed vertical offset', 'button', 'control-press-offset'),
    number('button-disabled-opacity', 'Button disabled opacity', 'button', 0.5),

    spacing('popover-gap', 'Popover gap', 'popover', 'surface-gap-sm'),
    spacing('sheet-gap', 'Sheet gap', 'sheet', 'surface-gap-md'),
    fontSize('dropdown-menu-item-font-size', 'Dropdown menu item font size', 'dropdown-menu', 'text-sm-size'),
    fontWeight('dropdown-menu-item-font-weight', 'Dropdown menu item font weight', 'dropdown-menu', 'weight-normal'),
    lineHeight('dropdown-menu-item-line-height', 'Dropdown menu item line height', 'dropdown-menu', 'line-normal'),
    dim('dropdown-menu-icon-size', 'Dropdown menu icon size', 'dropdown-menu', 16),

    radius('card-radius', 'Card radius', 'card', 'surface-lg'),
    color('card-foreground', 'Card foreground', 'card', 'text-primary'),
    color('card-border', 'Card border', 'card', 'border'),
    color('card-footer-background', 'Card footer background', 'card', 'muted-surface'),
    fontSize('card-title-font-size', 'Card title font size', 'card', 'text-md-size'),
    fontWeight('card-title-font-weight', 'Card title font weight', 'card', 'weight-medium'),
    lineHeight('card-title-line-height', 'Card title line height', 'card', 'line-tight'),
    fontSize('card-description-font-size', 'Card description font size', 'card', 'text-sm-size'),
    color('card-description-color', 'Card description color', 'card', 'text-muted'),

    color('input-background', 'Input background', 'input', 'surface'),
    color('input-foreground', 'Input foreground', 'input', 'text-primary'),
    color('input-placeholder', 'Input placeholder', 'input', 'text-muted'),
    color('input-border', 'Input border', 'input', 'border'),
    radius('input-radius', 'Input radius', 'input', 'control-sm'),
    spacing('input-padding-x', 'Input horizontal padding', 'input', 'control-padding-x-md'),
    spacing('input-padding-y', 'Input vertical padding', 'input', 'control-padding-y-sm'),
    fontSize('input-font-size', 'Input font size', 'input', 'text-sm-size'),
    lineHeight('input-line-height', 'Input line height', 'input', 'line-normal'),

    refToken('alert-dialog-surface', 'Alert dialog surface', 'color', 'alert-dialog', 'workbench-components', 'dialog-background', next()),
    refToken('alert-dialog-foreground', 'Alert dialog foreground', 'color', 'alert-dialog', 'workbench-components', 'dialog-foreground', next()),
    refToken('alert-dialog-border', 'Alert dialog border', 'color', 'alert-dialog', 'workbench-components', 'dialog-border', next()),
    refToken('alert-dialog-radius', 'Alert dialog radius', 'dimension', 'alert-dialog', 'workbench-components', 'dialog-radius', next()),
    refToken('alert-dialog-padding', 'Alert dialog padding', 'dimension', 'alert-dialog', 'workbench-components', 'dialog-padding', next()),
    refToken('alert-dialog-gap', 'Alert dialog gap', 'dimension', 'alert-dialog', 'workbench-components', 'dialog-gap', next()),
    ...textRoleTokens('alert-dialog', 'Alert dialog', 'text-md-size', 'weight-medium'),
    refToken('alert-dialog-shadow', 'Alert dialog shadow', 'string', 'alert-dialog', 'workbench-components', 'dialog-shadow', next()),
    rawToken('alert-dialog-title-font-family', 'Alert dialog title font family', 'string', 'alert-dialog', 'var(--font-heading, var(--wb-font-heading, var(--font-sans, var(--wb-font-sans, "Public Sans Variable", sans-serif))))', next()),
    rawToken('alert-dialog-description-font-family', 'Alert dialog description font family', 'string', 'alert-dialog', 'var(--font-sans, var(--wb-font-sans, "Public Sans Variable", sans-serif))', next()),
    dim('alert-dialog-media-size', 'Alert dialog media size', 'alert-dialog', 40),
    color('alert-dialog-overlay', 'Alert dialog overlay', 'alert-dialog', 'inverse-surface'),

    color('aspect-ratio-background', 'Aspect ratio background', 'aspect-ratio', 'muted-surface'),
    color('aspect-ratio-border', 'Aspect ratio border', 'aspect-ratio', 'border'),
    radius('aspect-ratio-radius', 'Aspect ratio radius', 'aspect-ratio', 'surface-md'),
    dim('aspect-ratio-min-height', 'Aspect ratio minimum height', 'aspect-ratio', 160),

    color('attachment-background', 'Attachment background', 'attachment', 'surface'),
    color('attachment-foreground', 'Attachment foreground', 'attachment', 'text-primary'),
    color('attachment-muted-foreground', 'Attachment muted foreground', 'attachment', 'text-muted'),
    color('attachment-border', 'Attachment border', 'attachment', 'border'),
    color('attachment-hover-background', 'Attachment hover background', 'attachment', 'muted-surface'),
    radius('attachment-radius', 'Attachment radius', 'attachment', 'surface-lg'),
    color('attachment-media-background', 'Attachment media background', 'attachment', 'muted-surface'),
    color('attachment-media-foreground', 'Attachment media foreground', 'attachment', 'text-primary'),
    radius('attachment-media-radius', 'Attachment media radius', 'attachment', 'surface-md'),

    ...surfaceTokens('breadcrumb', 'Breadcrumb', { padding: 'control-padding-x-sm', gap: 'surface-gap-sm' }),
    color('breadcrumb-current-color', 'Breadcrumb current color', 'breadcrumb', 'text-primary'),
    color('breadcrumb-separator-color', 'Breadcrumb separator color', 'breadcrumb', 'text-muted'),
    dim('breadcrumb-icon-size', 'Breadcrumb icon size', 'breadcrumb', 16),

    color('button-group-border', 'Button group border', 'button-group', 'border'),
    color('button-group-background', 'Button group background', 'button-group', 'surface'),
    radius('button-group-radius', 'Button group radius', 'button-group', 'control-sm'),
    spacing('button-group-gap', 'Button group gap', 'button-group', 'surface-gap-sm'),
    spacing('button-group-item-height', 'Button group item height', 'button-group', 'control-height-sm'),

    ...surfaceTokens('calendar', 'Calendar', { padding: 'surface-padding-sm', gap: 'surface-gap-sm' }),
    dim('calendar-day-size', 'Calendar day size', 'calendar', 32),
    color('calendar-day-selected-background', 'Calendar selected day background', 'calendar', 'action-primary'),
    color('calendar-day-selected-foreground', 'Calendar selected day foreground', 'calendar', 'text-on-action'),
    radius('calendar-day-radius', 'Calendar day radius', 'calendar', 'control-sm'),

    ...surfaceTokens('carousel', 'Carousel', { padding: 'surface-padding-sm', gap: 'surface-gap-md' }),
    color('carousel-control-diff-background', 'Carousel control diff background', 'carousel', 'inverse-surface'),
    color('carousel-control-diff-foreground', 'Carousel control diff foreground', 'carousel', 'inverse-text'),
    color('carousel-control-diff-hover-background', 'Carousel control diff hover background', 'carousel', 'inverse-surface'),
    color('carousel-control-background', 'Carousel control background', 'carousel', 'surface'),
    color('carousel-control-border', 'Carousel control border', 'carousel', 'border'),
    color('carousel-control-hover-background', 'Carousel control hover background', 'carousel', 'muted-surface'),
    dim('carousel-control-size', 'Carousel control size', 'carousel', 36),
    dim('carousel-control-offset', 'Carousel control offset', 'carousel', 12),

    ...surfaceTokens('chart', 'Chart', { padding: 'surface-padding-md', gap: 'surface-gap-md' }),
    color('chart-grid-color', 'Chart grid color', 'chart', 'border'),
    color('chart-tooltip-background', 'Chart tooltip background', 'chart', 'surface'),
    color('chart-tooltip-border', 'Chart tooltip border', 'chart', 'border'),

    ...surfaceTokens('collapsible', 'Collapsible', { padding: 'surface-padding-sm', gap: 'surface-gap-sm' }),
    spacing('collapsible-trigger-height', 'Collapsible trigger height', 'collapsible', 'control-height-sm'),

    ...formControlTokens('combobox', 'Combobox'),
    refToken('combobox-content-background', 'Combobox content background', 'color', 'combobox', 'workbench-components', 'dropdown-menu-background', next()),
    refToken('combobox-item-hover-background', 'Combobox item hover background', 'color', 'combobox', 'workbench-components', 'dropdown-menu-item-hover-background', next()),
    spacing('combobox-item-height', 'Combobox item height', 'combobox', 'control-height-sm'),
    dim('combobox-chip-height', 'Combobox chip height', 'combobox', 24),

    ...surfaceTokens('command', 'Command', { padding: 'surface-padding-sm', gap: 'surface-gap-sm' }),
    spacing('command-input-height', 'Command input height', 'command', 'control-height-md'),
    spacing('command-item-height', 'Command item height', 'command', 'control-height-sm'),
    color('command-item-hover-background', 'Command item hover background', 'command', 'muted-surface'),

    ...menuTokens('context-menu', 'Context menu'),
    ...menuTokens('menubar', 'Menubar'),

    ...formControlTokens('date-picker', 'Date picker'),
    ...formControlTokens('date-range-picker', 'Date range picker'),

    ...surfaceTokens('drawer', 'Drawer', { padding: 'surface-padding-lg', gap: 'surface-gap-md', includeShadow: true, titleSize: 'text-md-size' }),
    color('drawer-overlay', 'Drawer overlay', 'drawer', 'inverse-surface'),

    ...surfaceTokens('empty', 'Empty', { padding: 'surface-padding-lg', gap: 'surface-gap-md', titleSize: 'text-md-size' }),
    dim('empty-icon-size', 'Empty icon size', 'empty', 40),

    color('field-label-color', 'Field label color', 'field', 'text-primary'),
    color('field-description-color', 'Field description color', 'field', 'text-muted'),
    color('field-error-color', 'Field error color', 'field', 'text-danger'),
    spacing('field-gap', 'Field gap', 'field', 'surface-gap-sm'),
    spacing('field-group-gap', 'Field group gap', 'field', 'surface-gap-md'),
    fontSize('field-label-font-size', 'Field label font size', 'field', 'text-sm-size'),
    fontWeight('field-label-font-weight', 'Field label font weight', 'field', 'weight-medium'),
    fontSize('field-description-font-size', 'Field description font size', 'field', 'text-sm-size'),
    lineHeight('field-line-height', 'Field line height', 'field', 'line-normal'),

    ...surfaceTokens('hover-card', 'Hover card', { padding: 'surface-padding-md', gap: 'surface-gap-sm', includeShadow: true }),

    ...formControlTokens('input-group', 'Input group'),
    color('input-group-addon-background', 'Input group addon background', 'input-group', 'muted-surface'),
    color('input-group-addon-foreground', 'Input group addon foreground', 'input-group', 'text-muted'),
    spacing('input-group-gap', 'Input group gap', 'input-group', 'surface-gap-sm'),

    color('input-otp-background', 'Input OTP background', 'input-otp', 'surface'),
    color('input-otp-foreground', 'Input OTP foreground', 'input-otp', 'text-primary'),
    color('input-otp-border', 'Input OTP border', 'input-otp', 'border'),
    radius('input-otp-radius', 'Input OTP radius', 'input-otp', 'control-sm'),
    dim('input-otp-slot-size', 'Input OTP slot size', 'input-otp', 40),
    spacing('input-otp-gap', 'Input OTP gap', 'input-otp', 'surface-gap-sm'),
    fontSize('input-otp-font-size', 'Input OTP font size', 'input-otp', 'text-sm-size'),

    ...surfaceTokens('item', 'Item', { padding: 'surface-padding-sm', gap: 'surface-gap-sm' }),
    color('item-hover-background', 'Item hover background', 'item', 'muted-surface'),
    dim('item-media-size', 'Item media size', 'item', 40),

    color('kbd-background', 'Kbd background', 'kbd', 'muted-surface'),
    color('kbd-foreground', 'Kbd foreground', 'kbd', 'text-primary'),
    color('kbd-border', 'Kbd border', 'kbd', 'border'),
    radius('kbd-radius', 'Kbd radius', 'kbd', 'control-xs'),
    spacing('kbd-padding-x', 'Kbd horizontal padding', 'kbd', 'control-padding-x-sm'),
    spacing('kbd-padding-y', 'Kbd vertical padding', 'kbd', 'control-padding-y-xs'),
    fontSize('kbd-font-size', 'Kbd font size', 'kbd', 'text-xs-size'),

    color('label-foreground', 'Label foreground', 'label', 'text-primary'),
    color('label-required-color', 'Label required color', 'label', 'text-danger'),
    fontSize('label-font-size', 'Label font size', 'label', 'text-sm-size'),
    fontWeight('label-font-weight', 'Label font weight', 'label', 'weight-medium'),
    lineHeight('label-line-height', 'Label line height', 'label', 'line-normal'),

    ...formControlTokens('native-select', 'Native select'),
    dim('native-select-icon-size', 'Native select icon size', 'native-select', 16),

    ...surfaceTokens('navigation-menu', 'Navigation menu', { padding: 'surface-padding-sm', gap: 'surface-gap-sm', includeShadow: true }),
    color('navigation-menu-item-hover-background', 'Navigation menu item hover background', 'navigation-menu', 'muted-surface'),
    spacing('navigation-menu-item-height', 'Navigation menu item height', 'navigation-menu', 'control-height-sm'),
    spacing('navigation-menu-panel-padding', 'Navigation menu panel padding', 'navigation-menu', 'surface-padding-md'),

    color('pagination-foreground', 'Pagination foreground', 'pagination', 'text-primary'),
    color('pagination-active-background', 'Pagination active background', 'pagination', 'action-primary'),
    color('pagination-active-foreground', 'Pagination active foreground', 'pagination', 'text-on-action'),
    color('pagination-hover-background', 'Pagination hover background', 'pagination', 'muted-surface'),
    radius('pagination-radius', 'Pagination radius', 'pagination', 'control-sm'),
    dim('pagination-item-size', 'Pagination item size', 'pagination', 32),
    spacing('pagination-gap', 'Pagination gap', 'pagination', 'surface-gap-sm'),

    color('resizable-handle-color', 'Resizable handle color', 'resizable', 'border'),
    color('resizable-handle-hover-color', 'Resizable handle hover color', 'resizable', 'action-primary'),
    dim('resizable-handle-size', 'Resizable handle size', 'resizable', 8),
    dim('resizable-hit-area', 'Resizable hit area', 'resizable', 16),

    color('scroll-area-track', 'Scroll area track', 'scroll-area', 'muted-surface'),
    color('scroll-area-thumb', 'Scroll area thumb', 'scroll-area', 'border'),
    radius('scroll-area-radius', 'Scroll area radius', 'scroll-area', 'pill'),
    dim('scroll-area-scrollbar-size', 'Scroll area scrollbar size', 'scroll-area', 10),

    color('separator-color', 'Separator color', 'separator', 'border'),
    dim('separator-thickness', 'Separator thickness', 'separator', 1),

    color('sidebar-background', 'Sidebar background', 'sidebar', 'sidebar'),
    color('sidebar-foreground', 'Sidebar foreground', 'sidebar', 'sidebar-foreground'),
    color('sidebar-border', 'Sidebar border', 'sidebar', 'sidebar-border'),
    color('sidebar-accent', 'Sidebar accent', 'sidebar', 'sidebar-accent'),
    color('sidebar-accent-foreground', 'Sidebar accent foreground', 'sidebar', 'sidebar-accent-foreground'),
    dim('sidebar-width', 'Sidebar width', 'sidebar', 256),
    spacing('sidebar-width-mobile', 'Sidebar mobile width', 'sidebar', 'navigation-sidebar-width-mobile'),
    spacing('sidebar-collapsed-width-sm', 'Sidebar collapsed width small', 'sidebar', 'navigation-rail-width-sm'),
    spacing('sidebar-collapsed-width-md', 'Sidebar collapsed width medium', 'sidebar', 'navigation-rail-width-md'),
    spacing('sidebar-collapsed-width-lg', 'Sidebar collapsed width large', 'sidebar', 'navigation-rail-width-lg'),
    spacing('sidebar-collapsed-item-size-sm', 'Sidebar collapsed item size small', 'sidebar', 'navigation-rail-item-size-sm'),
    spacing('sidebar-collapsed-item-size-md', 'Sidebar collapsed item size medium', 'sidebar', 'navigation-rail-item-size-md'),
    spacing('sidebar-collapsed-item-size-lg', 'Sidebar collapsed item size large', 'sidebar', 'navigation-rail-item-size-lg'),
    spacing('sidebar-item-height-sm', 'Sidebar item height small', 'sidebar', 'control-height-xs'),
    spacing('sidebar-item-height-md', 'Sidebar item height medium', 'sidebar', 'control-height-sm'),
    spacing('sidebar-item-height-lg', 'Sidebar item height large', 'sidebar', 'control-height-md'),
    spacing('sidebar-item-padding-x-sm', 'Sidebar item horizontal padding small', 'sidebar', 'control-padding-x-sm'),
    spacing('sidebar-item-padding-x-md', 'Sidebar item horizontal padding medium', 'sidebar', 'control-padding-x-md'),
    spacing('sidebar-item-padding-x-lg', 'Sidebar item horizontal padding large', 'sidebar', 'control-padding-x-lg'),
    spacing('sidebar-item-gap-sm', 'Sidebar item gap small', 'sidebar', 'control-gap-sm'),
    spacing('sidebar-item-gap-md', 'Sidebar item gap medium', 'sidebar', 'control-gap-md'),
    spacing('sidebar-item-gap-lg', 'Sidebar item gap large', 'sidebar', 'control-gap-lg'),
    fontSize('sidebar-item-font-size-sm', 'Sidebar item font size small', 'sidebar', 'text-xs-size'),
    fontSize('sidebar-item-font-size-md', 'Sidebar item font size medium', 'sidebar', 'text-sm-size'),
    fontSize('sidebar-item-font-size-lg', 'Sidebar item font size large', 'sidebar', 'text-md-size'),
    spacing('sidebar-item-icon-size-sm', 'Sidebar item icon size small', 'sidebar', 'control-icon-sm'),
    spacing('sidebar-item-icon-size-md', 'Sidebar item icon size medium', 'sidebar', 'control-icon-md'),
    spacing('sidebar-item-icon-size-lg', 'Sidebar item icon size large', 'sidebar', 'control-icon-lg'),
    spacing('sidebar-gap', 'Sidebar gap', 'sidebar', 'surface-gap-sm'),
    spacing('sidebar-item-height', 'Sidebar item height', 'sidebar', 'control-height-sm'),
    spacing('sidebar-item-padding-x', 'Sidebar item horizontal padding', 'sidebar', 'control-padding-x-md'),
    radius('sidebar-item-radius', 'Sidebar item radius', 'sidebar', 'control-sm'),

    color('spinner-color', 'Spinner color', 'spinner', 'action-primary'),
    dim('spinner-size', 'Spinner size', 'spinner', 20),
    dim('spinner-stroke-width', 'Spinner stroke width', 'spinner', 2),

    ...formControlTokens('textarea', 'Textarea'),
    dim('textarea-min-height', 'Textarea minimum height', 'textarea', 96),

    color('toggle-background', 'Toggle background', 'toggle', 'surface'),
    color('toggle-foreground', 'Toggle foreground', 'toggle', 'text-primary'),
    color('toggle-hover-background', 'Toggle hover background', 'toggle', 'muted-surface'),
    color('toggle-selected-background', 'Toggle selected background', 'toggle', 'action-primary'),
    color('toggle-selected-foreground', 'Toggle selected foreground', 'toggle', 'text-on-action'),
    radius('toggle-radius', 'Toggle radius', 'toggle', 'control-sm'),
    spacing('toggle-height', 'Toggle height', 'toggle', 'control-height-sm'),
    spacing('toggle-padding-x', 'Toggle horizontal padding', 'toggle', 'control-padding-x-md'),
    fontSize('toggle-font-size', 'Toggle font size', 'toggle', 'text-sm-size'),

    color('toggle-group-border', 'Toggle group border', 'toggle-group', 'border'),
    color('toggle-group-background', 'Toggle group background', 'toggle-group', 'surface'),
    radius('toggle-group-radius', 'Toggle group radius', 'toggle-group', 'control-sm'),
    spacing('toggle-group-gap', 'Toggle group gap', 'toggle-group', 'surface-gap-sm'),
  ];
}

function createWorkbenchEmptyComponentTokenCollection() {
  return {
    id: 'workbench-components',
    name: 'Workbench Components',
    description: 'Project component tokens. Tailwind-only projects start with this collection empty.',
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: [],
    extensions: {
      source: 'workbench-template',
      registration: 'optional',
      state: 'empty',
    },
  };
}

function createWorkbenchSemanticColorTokenCollection() {
  const groups = [
    ['surface', 'Surface'],
    ['text', 'Text'],
    ['border', 'Border'],
    ['action', 'Action'],
    ['feedback', 'Feedback'],
    ['focus', 'Focus'],
    ['chart', 'Chart'],
    ['sidebar', 'Sidebar'],
  ].map(([id, name], sortOrder) => ({ id, name, sortOrder }));

  return {
    id: 'workbench-semantic-color',
    name: 'Workbench Semantic Color',
    description: 'Role-based color tokens referenced by bundled component tokens.',
    modes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    activeMode: 'light',
    groups,
    tokens: [
      modeRefToken('surface', 'Surface', 'color', 'surface', { light: 'white', dark: 'neutral-900' }, 0),
      modeRefToken('muted-surface', 'Muted surface', 'color', 'surface', { light: 'neutral-100', dark: 'neutral-800' }, 1),
      modeRefToken('text', 'Text', 'color', 'text', { light: 'neutral-950', dark: 'neutral-50' }, 2),
      modeRefToken('muted-text', 'Muted text', 'color', 'text', { light: 'neutral-500', dark: 'neutral-400' }, 3),
      modeRefToken('border', 'Border', 'color', 'border', { light: 'neutral-200', dark: 'shadcn-border-dark' }, 4),
      modeRefToken('action-primary', 'Action primary', 'color', 'action', { light: 'neutral-900', dark: 'neutral-200' }, 5),
      modeRefToken('action-primary-hover', 'Action primary hover', 'color', 'action', { light: 'neutral-800', dark: 'neutral-300' }, 6),
      modeRefToken('action-primary-text', 'Action primary text', 'color', 'action', { light: 'neutral-50', dark: 'neutral-900' }, 7),
      modeRefToken('destructive', 'Destructive', 'color', 'feedback', { light: 'shadcn-destructive-light', dark: 'shadcn-destructive-dark' }, 8),
      modeRefToken('destructive-hover', 'Destructive hover', 'color', 'feedback', { light: 'red-700', dark: 'red-600' }, 9),
      modeRefToken('focus-ring', 'Focus ring', 'color', 'focus', { light: 'neutral-400', dark: 'neutral-500' }, 10),
      modeRefToken('text-primary', 'Text primary', 'color', 'text', { light: 'neutral-950', dark: 'neutral-50' }, 11),
      modeRefToken('text-muted', 'Text muted', 'color', 'text', { light: 'neutral-500', dark: 'neutral-400' }, 12),
      modeRefToken('text-on-action', 'Text on action', 'color', 'text', { light: 'neutral-50', dark: 'neutral-900' }, 13),
      modeRefToken('text-danger', 'Text danger', 'color', 'text', { light: 'red-600', dark: 'red-400' }, 14),
      modeRefToken('inverse-surface', 'Inverse surface', 'color', 'surface', { light: 'neutral-950', dark: 'neutral-50' }, 15),
      modeRefToken('inverse-text', 'Inverse text', 'color', 'text', { light: 'neutral-50', dark: 'neutral-900' }, 16),
      modeRefToken('background', 'Background', 'color', 'surface', { light: 'white', dark: 'neutral-950' }, 17),
      modeRefToken('foreground', 'Foreground', 'color', 'surface', { light: 'neutral-950', dark: 'neutral-50' }, 18),
      modeRefToken('card', 'Card', 'color', 'surface', { light: 'white', dark: 'neutral-900' }, 19),
      modeRefToken('card-foreground', 'Card foreground', 'color', 'surface', { light: 'neutral-950', dark: 'neutral-50' }, 20),
      modeRefToken('popover', 'Popover', 'color', 'surface', { light: 'white', dark: 'neutral-900' }, 21),
      modeRefToken('popover-foreground', 'Popover foreground', 'color', 'surface', { light: 'neutral-950', dark: 'neutral-50' }, 22),
      modeRefToken('muted', 'Muted', 'color', 'surface', { light: 'neutral-100', dark: 'neutral-800' }, 23),
      modeRefToken('muted-foreground', 'Muted foreground', 'color', 'surface', { light: 'neutral-500', dark: 'neutral-400' }, 24),
      modeRefToken('primary', 'Primary', 'color', 'action', { light: 'neutral-900', dark: 'neutral-200' }, 25),
      modeRefToken('primary-foreground', 'Primary foreground', 'color', 'action', { light: 'neutral-50', dark: 'neutral-900' }, 26),
      modeRefToken('secondary', 'Secondary', 'color', 'action', { light: 'neutral-100', dark: 'neutral-800' }, 27),
      modeRefToken('secondary-foreground', 'Secondary foreground', 'color', 'action', { light: 'neutral-900', dark: 'neutral-50' }, 28),
      modeRefToken('secondary-hover', 'Secondary hover', 'color', 'action', { light: 'neutral-200', dark: 'neutral-700' }, 28.5),
      modeRefToken('accent', 'Accent', 'color', 'action', { light: 'neutral-900', dark: 'neutral-200' }, 29),
      modeRefToken('accent-foreground', 'Accent foreground', 'color', 'action', { light: 'neutral-50', dark: 'neutral-900' }, 30),
      modeRefToken('destructive-foreground', 'Destructive foreground', 'color', 'feedback', { light: 'neutral-50', dark: 'neutral-50' }, 31),
      modeRefToken('input', 'Input', 'color', 'border', { light: 'neutral-200', dark: 'shadcn-input-dark' }, 32),
      modeRefToken('ring', 'Ring', 'color', 'focus', { light: 'neutral-400', dark: 'neutral-500' }, 33),
      modeRefToken('chart-1', 'Chart 1', 'color', 'chart', { light: 'neutral-300', dark: 'neutral-300' }, 34),
      modeRefToken('chart-2', 'Chart 2', 'color', 'chart', { light: 'neutral-500', dark: 'neutral-500' }, 35),
      modeRefToken('chart-3', 'Chart 3', 'color', 'chart', { light: 'neutral-600', dark: 'neutral-600' }, 36),
      modeRefToken('chart-4', 'Chart 4', 'color', 'chart', { light: 'neutral-700', dark: 'neutral-700' }, 37),
      modeRefToken('chart-5', 'Chart 5', 'color', 'chart', { light: 'neutral-800', dark: 'neutral-800' }, 38),
      modeRefToken('sidebar', 'Sidebar', 'color', 'sidebar', { light: 'neutral-50', dark: 'neutral-900' }, 39),
      modeRefToken('sidebar-foreground', 'Sidebar foreground', 'color', 'sidebar', { light: 'neutral-950', dark: 'neutral-50' }, 40),
      modeRefToken('sidebar-primary', 'Sidebar primary', 'color', 'sidebar', { light: 'neutral-900', dark: 'blue-700' }, 41),
      modeRefToken('sidebar-primary-foreground', 'Sidebar primary foreground', 'color', 'sidebar', { light: 'neutral-50', dark: 'neutral-50' }, 42),
      modeRefToken('sidebar-accent', 'Sidebar accent', 'color', 'sidebar', { light: 'neutral-100', dark: 'neutral-800' }, 43),
      modeRefToken('sidebar-accent-foreground', 'Sidebar accent foreground', 'color', 'sidebar', { light: 'neutral-900', dark: 'neutral-50' }, 44),
      modeRefToken('sidebar-border', 'Sidebar border', 'color', 'sidebar', { light: 'neutral-200', dark: 'shadcn-border-dark' }, 45),
      modeRefToken('sidebar-ring', 'Sidebar ring', 'color', 'sidebar', { light: 'neutral-400', dark: 'neutral-500' }, 46),
    ],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'color',
    },
  };
}

function createWorkbenchSemanticRadiusTokenCollection() {
  return {
    id: 'workbench-semantic-radius',
    name: 'Workbench Semantic Radius',
    description: 'Role-based radius tokens referenced by bundled component tokens.',
    modes: [
      { id: 'base', name: 'Base' },
      { id: 'compact', name: 'Compact' },
      { id: 'flat', name: 'Flat' },
    ],
    activeMode: 'base',
    groups: [
      { id: 'control', name: 'Control', sortOrder: 0 },
      { id: 'surface', name: 'Surface', sortOrder: 1 },
    ],
    tokens: [
      modeRefToken('control-sm', 'Control small', 'dimension', 'control', { base: 'radius-lg', compact: 'radius-md', flat: 'radius-none' }, 0),
      modeRefToken('control-xs', 'Control extra small', 'dimension', 'control', { base: 'radius-md', compact: 'radius-sm', flat: 'radius-none' }, 1),
      modeRefToken('surface-md', 'Surface medium', 'dimension', 'surface', { base: 'radius-lg', compact: 'radius-md', flat: 'radius-none' }, 2),
      modeRefToken('surface-lg', 'Surface large', 'dimension', 'surface', { base: 'radius-lg', compact: 'radius-md', flat: 'radius-none' }, 3),
      modeRefToken('pill', 'Pill', 'dimension', 'surface', { base: 'radius-full', compact: 'radius-full', flat: 'radius-full' }, 4),
    ],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'radius',
    },
  };
}

function createWorkbenchSemanticTypographyTokenCollection() {
  return {
    id: 'workbench-semantic-typography',
    name: 'Workbench Semantic Typography',
    description: 'Role-based typography tokens referenced by bundled component tokens.',
    modes: [
      { id: 'base', name: 'Base' },
      { id: 'compact', name: 'Compact' },
    ],
    activeMode: 'base',
    groups: [
      { id: 'size', name: 'Size', sortOrder: 0 },
      { id: 'weight', name: 'Weight', sortOrder: 1 },
      { id: 'line-height', name: 'Line height', sortOrder: 2 },
    ],
    tokens: [
      modeRefToken('text-xs-size', 'Text extra small size', 'dimension', 'size', { base: 'text-xs', compact: 'text-xs' }, 0),
      modeRefToken('text-sm-size', 'Text small size', 'dimension', 'size', { base: 'text-sm', compact: 'text-xs' }, 1),
      modeRefToken('text-md-size', 'Text medium size', 'dimension', 'size', { base: 'text-base', compact: 'text-sm' }, 2),
      modeRefToken('body-size', 'Body size', 'dimension', 'size', { base: 'text-lg', compact: 'text-base' }, 3),
      modeRefToken('title-size', 'Title size', 'dimension', 'size', { base: 'text-2xl', compact: 'text-lg' }, 4),
      modeRefToken('display-size', 'Display size', 'string', 'size', { base: 'text-6xl', compact: 'text-2xl' }, 5),
      modeRefToken('weight-normal', 'Weight normal', 'number', 'weight', { base: 'font-normal', compact: 'font-normal' }, 5.5),
      modeRefToken('weight-medium', 'Weight medium', 'number', 'weight', { base: 'font-medium', compact: 'font-medium' }, 6),
      modeRefToken('weight-semibold', 'Weight semibold', 'number', 'weight', { base: 'font-semibold', compact: 'font-semibold' }, 7),
      modeRefToken('weight-bold', 'Weight bold', 'number', 'weight', { base: 'font-bold', compact: 'font-bold' }, 8),
      modeRefToken('line-xs', 'Line extra small', 'dimension', 'line-height', { base: 'leading-4', compact: 'leading-4' }, 8.5),
      modeRefToken('line-tight', 'Line tight', 'number', 'line-height', { base: 'leading-tight', compact: 'leading-tight' }, 9),
      modeRefToken('line-display', 'Line display', 'number', 'line-height', { base: 'leading-none', compact: 'leading-tight' }, 10),
      modeRefToken('line-title', 'Line title', 'number', 'line-height', { base: 'leading-tight', compact: 'leading-tight' }, 11),
      modeRefToken('line-normal', 'Line normal', 'number', 'line-height', { base: 'leading-normal', compact: 'leading-normal' }, 12),
      modeRefToken('line-body', 'Line body', 'number', 'line-height', { base: 'leading-normal', compact: 'leading-normal' }, 13),
      modeRefToken('line-relaxed', 'Line relaxed', 'number', 'line-height', { base: 'leading-relaxed', compact: 'leading-normal' }, 14),
    ],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'typography',
    },
  };
}

function createWorkbenchSemanticSpacingTokenCollection() {
  return {
    id: 'workbench-semantic-spacing',
    name: 'Workbench Semantic Spacing',
    description: 'Role-based spacing and sizing tokens referenced by shadcn-style component tokens.',
    modes: [
      { id: 'base', name: 'Base' },
      { id: 'compact', name: 'Compact' },
    ],
    activeMode: 'base',
    groups: [
      { id: 'control', name: 'Control', sortOrder: 0 },
      { id: 'surface', name: 'Surface', sortOrder: 1 },
      { id: 'component-size', name: 'Component size', sortOrder: 2 },
    ],
    tokens: [
      modeRefToken('control-height-xs', 'Control height extra small', 'dimension', 'control', { base: 'space-6', compact: 'space-5' }, 0),
      modeRefToken('control-height-sm', 'Control height small', 'dimension', 'control', { base: 'space-8', compact: 'space-6' }, 1),
      modeRefToken('control-height-md', 'Control height medium', 'dimension', 'control', { base: 'space-10', compact: 'space-8' }, 2),
      modeRefToken('control-height-lg', 'Control height large', 'dimension', 'control', { base: 'space-11', compact: 'space-10' }, 3),
      modeRefToken('control-height-xl', 'Control height extra large', 'dimension', 'control', { base: 'space-12', compact: 'space-11' }, 3.1),
      modeRefToken('control-height-2xl', 'Control height 2 extra large', 'dimension', 'control', { base: 'space-14', compact: 'space-12' }, 3.2),
      modeRefToken('control-padding-x-sm', 'Control horizontal padding small', 'dimension', 'control', { base: 'space-2', compact: 'space-2' }, 4),
      modeRefToken('control-padding-x-md', 'Control horizontal padding medium', 'dimension', 'control', { base: 'space-3', compact: 'space-2' }, 5),
      modeRefToken('control-padding-x-lg', 'Control horizontal padding large', 'dimension', 'control', { base: 'space-4', compact: 'space-3' }, 6),
      modeRefToken('control-padding-x-xl', 'Control horizontal padding extra large', 'dimension', 'control', { base: 'space-5', compact: 'space-4' }, 6.1),
      modeRefToken('control-padding-x-2xl', 'Control horizontal padding 2 extra large', 'dimension', 'control', { base: 'space-6', compact: 'space-5' }, 6.2),
      modeRefToken('control-padding-y-xs', 'Control vertical padding extra small', 'dimension', 'control', { base: 'space-1', compact: 'space-1' }, 7),
      modeRefToken('control-padding-y-sm', 'Control vertical padding small', 'dimension', 'control', { base: 'space-2', compact: 'space-1' }, 8),
      modeRefToken('control-indicator-sm', 'Control indicator small', 'dimension', 'control', { base: 'space-3', compact: 'space-3' }, 9),
      modeRefToken('control-indicator-md', 'Control indicator medium', 'dimension', 'control', { base: 'space-4', compact: 'space-4' }, 10),
      modeRefToken('control-gap-sm', 'Control gap small', 'dimension', 'control', { base: 'space-1-5', compact: 'space-1' }, 10.1),
      modeRefToken('control-gap-md', 'Control gap medium', 'dimension', 'control', { base: 'space-2', compact: 'space-1-5' }, 10.2),
      modeRefToken('control-gap-lg', 'Control gap large', 'dimension', 'control', { base: 'space-3', compact: 'space-2' }, 10.3),
      modeRefToken('control-icon-xs', 'Control icon extra small', 'dimension', 'control', { base: 'space-3', compact: 'space-3' }, 10.4),
      modeRefToken('control-icon-sm', 'Control icon small', 'dimension', 'control', { base: 'space-3-5', compact: 'space-3' }, 10.5),
      modeRefToken('control-icon-md', 'Control icon medium', 'dimension', 'control', { base: 'space-4', compact: 'space-3-5' }, 10.6),
      modeRefToken('control-icon-lg', 'Control icon large', 'dimension', 'control', { base: 'space-5', compact: 'space-4' }, 10.7),
      modeRefToken('control-press-offset', 'Control pressed vertical offset', 'dimension', 'control', { base: 'space-px', compact: 'space-px' }, 10.8),
      modeRefToken('surface-padding-sm', 'Surface padding small', 'dimension', 'surface', { base: 'space-3', compact: 'space-2' }, 11),
      modeRefToken('surface-padding-md', 'Surface padding medium', 'dimension', 'surface', { base: 'space-4', compact: 'space-3' }, 12),
      modeRefToken('surface-padding-lg', 'Surface padding large', 'dimension', 'surface', { base: 'space-6', compact: 'space-4' }, 13),
      modeRefToken('surface-gap-sm', 'Surface gap small', 'dimension', 'surface', { base: 'space-2', compact: 'space-1' }, 14),
      modeRefToken('floating-layer-gap-sm', 'Floating layer gap small', 'dimension', 'surface', { base: 'space-1', compact: 'space-1' }, 14.5),
      modeRefToken('surface-gap-md', 'Surface gap medium', 'dimension', 'surface', { base: 'space-4', compact: 'space-3' }, 15),
      modeRefToken('avatar-size-sm', 'Avatar size small', 'dimension', 'component-size', { base: 'space-8', compact: 'space-6' }, 16),
      modeRefToken('avatar-size-md', 'Avatar size medium', 'dimension', 'component-size', { base: 'space-10', compact: 'space-8' }, 17),
      modeRefToken('avatar-size-lg', 'Avatar size large', 'dimension', 'component-size', { base: 'space-12', compact: 'space-10' }, 18),
      modeRefToken('switch-track-width', 'Switch track width', 'dimension', 'component-size', { base: 'space-10', compact: 'space-9' }, 19),
      modeRefToken('switch-track-height', 'Switch track height', 'dimension', 'component-size', { base: 'space-6', compact: 'space-5' }, 20),
      modeRefToken('switch-thumb-size', 'Switch thumb size', 'dimension', 'component-size', { base: 'space-5', compact: 'space-4' }, 21),
      modeRefToken('inline-label-height-sm', 'Inline label height small', 'dimension', 'component-size', { base: 'space-5', compact: 'space-5' }, 21.5),
      modeRefToken('navigation-sidebar-width-mobile', 'Navigation sidebar mobile width', 'dimension', 'component-size', { base: 'space-72', compact: 'space-72' }, 22),
      modeRefToken('navigation-rail-width-sm', 'Navigation rail width small', 'dimension', 'component-size', { base: 'space-10', compact: 'space-10' }, 23),
      modeRefToken('navigation-rail-width-md', 'Navigation rail width medium', 'dimension', 'component-size', { base: 'space-12', compact: 'space-12' }, 24),
      modeRefToken('navigation-rail-width-lg', 'Navigation rail width large', 'dimension', 'component-size', { base: 'space-14', compact: 'space-14' }, 25),
      modeRefToken('navigation-rail-item-size-sm', 'Navigation rail item size small', 'dimension', 'component-size', { base: 'space-6', compact: 'space-6' }, 26),
      modeRefToken('navigation-rail-item-size-md', 'Navigation rail item size medium', 'dimension', 'component-size', { base: 'space-8', compact: 'space-8' }, 27),
      modeRefToken('navigation-rail-item-size-lg', 'Navigation rail item size large', 'dimension', 'component-size', { base: 'space-10', compact: 'space-10' }, 28),
    ],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'spacing',
    },
  };
}

function createWorkbenchSemanticEffectTokenCollection() {
  return {
    id: 'workbench-semantic-effect',
    name: 'Workbench Semantic Effect',
    description: 'Role-based effect tokens referenced by bundled component tokens.',
    modes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    activeMode: 'light',
    groups: [{ id: 'shadow', name: 'Shadow', sortOrder: 0 }],
    tokens: [
      modeRefToken('shadow-lg', 'Card shadow', 'string', 'shadow', { light: 'shadow-lg', dark: 'shadow-2xl' }, 0),
      modeRefToken('shadow-xl', 'Popover shadow', 'string', 'shadow', { light: 'shadow-xl', dark: 'shadow-2xl' }, 1),
    ],
    extensions: {
      source: 'workbench-template',
      layer: 'semantic',
      role: 'effect',
    },
  };
}

function colorToken(id, name, groupId, value, sortOrder) {
  return rawToken(id, name, 'color', groupId, value, sortOrder);
}

function dimensionToken(id, name, groupId, value, unit, sortOrder) {
  return rawToken(id, name, 'dimension', groupId, { value, unit }, sortOrder);
}

function stringToken(id, name, groupId, value, sortOrder) {
  return rawToken(id, name, 'string', groupId, value, sortOrder);
}

function numberToken(id, name, groupId, value, sortOrder) {
  return rawToken(id, name, 'number', groupId, value, sortOrder);
}

function refToken(id, name, type, groupId, collectionId, tokenId, sortOrder) {
  return {
    id,
    name,
    type,
    groupId,
    values: {
      default: {
        kind: 'ref',
        collectionId,
        tokenId,
      },
    },
    sortOrder,
    extensions: {
      componentSet: 'workbench-starter-components',
    },
  };
}

function modeRefToken(id, name, type, groupId, primitiveTokenByMode, sortOrder) {
  return {
    id,
    name,
    type,
    groupId,
    values: Object.fromEntries(
      Object.entries(primitiveTokenByMode).map(([modeId, tokenId]) => [
        modeId,
        {
          kind: 'ref',
          collectionId: 'tailwind-primitives',
          tokenId,
        },
      ]),
    ),
    sortOrder,
    extensions: {
      componentSet: 'workbench-starter-components',
    },
  };
}

function modeValueToken(id, name, type, groupId, valueByMode, sortOrder) {
  return {
    id,
    name,
    type,
    groupId,
    values: Object.fromEntries(
      Object.entries(valueByMode).map(([modeId, value]) => [
        modeId,
        typeof value === 'string'
          ? {
              kind: 'ref',
              collectionId: 'tailwind-primitives',
              tokenId: value,
            }
          : value,
      ]),
    ),
    sortOrder,
    extensions: {
      componentSet: 'workbench-starter-components',
    },
  };
}

function rawToken(id, name, type, groupId, value, sortOrder) {
  return {
    id,
    name,
    type,
    groupId,
    values: {
      default: {
        kind: 'raw',
        value,
      },
    },
    sortOrder,
    extensions: {
      componentSet: 'workbench-starter-components',
    },
  };
}

function createWorkbenchBundledButtonSource() {
  return [
    "import type { ButtonHTMLAttributes, ReactNode } from 'react';",
    "import { Icon } from './Icon';",
    "import './local.css';",
    '',
    "export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';",
    "export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';",
    '',
    'export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {',
    '  children?: ReactNode;',
    '  leadingIcon?: string;',
    '  loading?: boolean;',
    '  size?: ButtonSize;',
    '  trailingIcon?: string;',
    '  variant?: ButtonVariant;',
    '};',
    '',
    'export function Button({',
    '  children,',
    "  className = '',",
    '  disabled,',
    '  leadingIcon,',
    '  loading = false,',
    "  size = 'md',",
    '  trailingIcon,',
    "  type = 'button',",
    "  variant = 'default',",
    '  ...props',
    '}: ButtonProps) {',
    '  return (',
    '    <button',
    '      {...props}',
    '      className={[\'wb-button\', `wb-button--${variant}`, `wb-button--${size}`, className].filter(Boolean).join(\' \')}',
    '      data-loading={loading ? \'true\' : undefined}',
    '      disabled={disabled || loading}',
    '      type={type}',
    '    >',
    '      {loading ? <span className="wb-button__spinner" aria-hidden="true" /> : null}',
    '      {!loading && leadingIcon ? <Icon className="wb-button__icon" name={leadingIcon} size={16} /> : null}',
    '      <span className="wb-button__label">{children}</span>',
    '      {trailingIcon ? <Icon className="wb-button__icon" name={trailingIcon} size={16} /> : null}',
    '    </button>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledButtonStoriesSource() {
  return [
    "import { Button as WorkbenchButton } from './Button';",
    '',
    "type Args = Record<string, boolean | string>;",
    '',
    "const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const;",
    "const SIZES = ['sm', 'md', 'lg', 'icon'] as const;",
    '',
    'const DEFAULT_PROPS = {',
    "  children: 'Button',",
    "  variant: 'default',",
    "  size: 'md',",
    "  leadingIcon: '',",
    "  trailingIcon: 'arrow-right',",
    '  loading: false,',
    '} as const;',
    '',
    'const meta = {',
    "  title: 'Local/Button',",
    '  component: Button,',
    '  args: DEFAULT_PROPS,',
    '  argTypes: {',
    "    children: { control: 'text' },",
    "    variant: { control: 'select', options: VARIANTS },",
    "    size: { control: 'select', options: SIZES },",
    "    leadingIcon: { control: 'icon' },",
    "    trailingIcon: { control: 'icon' },",
    "    loading: { control: 'boolean' },",
    '  },',
    '  sourceInsert: {',
    '    props: DEFAULT_PROPS,',
    '  },',
    '};',
    'export default meta;',
    '',
    'export const Button = {',
    "  name: 'Button',",
    '  render: (args: Args) => (',
    '    <WorkbenchButton',
    '      leadingIcon={asOptionalIcon(args.leadingIcon)}',
    '      loading={asBoolean(args.loading)}',
    "      size={asOption(args.size, SIZES, 'md')}",
    '      trailingIcon={asOptionalIcon(args.trailingIcon)}',
    "      variant={asOption(args.variant, VARIANTS, 'default')}",
    '    >',
    "      {asText(args.children, 'Button')}",
    '    </WorkbenchButton>',
    '  ),',
    '};',
    '',
    'function asBoolean(value: unknown): boolean {',
    "  return typeof value === 'boolean' ? value : value === 'true';",
    '}',
    '',
    'function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {',
    '  return typeof value === \'string\' && options.includes(value as T) ? (value as T) : fallback;',
    '}',
    '',
    'function asText(value: unknown, fallback = \'\'): string {',
    "  return typeof value === 'string' ? value : fallback;",
    '}',
    '',
    'function asOptionalIcon(value: unknown) {',
    "  return typeof value === 'string' && value.trim() ? value : undefined;",
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledIconSource() {
  return [
    "import type { CSSProperties, HTMLAttributes } from 'react';",
    "import './local.css';",
    '',
    "export type IconRenderMode = 'auto' | 'mask' | 'image';",
    "export type IconSize = 'inherit' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;",
    '',
    'export interface IconProps extends HTMLAttributes<HTMLSpanElement> {',
    '  decorative?: boolean;',
    '  label?: string;',
    '  renderMode?: IconRenderMode;',
    '  size?: IconSize;',
    '  source?: string;',
    '}',
    '',
    "const DEFAULT_ICON_SOURCE = '/workbench-assets/icons/lucide/sparkles.svg';",
    '',
    'export function Icon({',
    "  className = '',",
    '  decorative = true,',
    '  label,',
    "  renderMode = 'auto',",
    '  size,',
    '  source = DEFAULT_ICON_SOURCE,',
    '  style,',
    '  ...rest',
    '}: IconProps) {',
    '  const iconSource = normalizeAssetSource(source) ?? DEFAULT_ICON_SOURCE;',
    '  const resolvedSize = normalizeIconSize(size);',
    '  const resolvedRenderMode = normalizeIconRenderMode(renderMode, iconSource);',
    '  const iconStyle = {',
    '    \'--wb-icon-url\': `url("${escapeCssUrl(iconSource)}")`,',
    '    ...(resolvedSize ? { inlineSize: resolvedSize, blockSize: resolvedSize } : {}),',
    '    ...style,',
    '  } as CSSProperties;',
    '  return (',
    '    <span',
    '      {...rest}',
    '      aria-hidden={decorative ? true : undefined}',
    '      aria-label={decorative ? undefined : label ?? formatIconLabel(iconSource)}',
    '      className={[\'wb-icon\', `wb-icon--${resolvedRenderMode}`, className].filter(Boolean).join(\' \')}',
    '      data-wb-asset-kind="icon"',
    '      data-wb-asset-src={iconSource}',
    '      data-wb-icon-name={formatIconLabel(iconSource)}',
    '      role={decorative ? undefined : \'img\'}',
    '      style={iconStyle}',
    '    />',
    '  );',
    '}',
    '',
    'function normalizeAssetSource(value: string | undefined): string | null {',
    '  const trimmed = value?.trim();',
    '  if (!trimmed) return null;',
    "  if (trimmed.startsWith('/')) return trimmed;",
    "  if (trimmed.startsWith('workbench-assets/')) return `/${trimmed}`;",
    '  if (/^https?:\\/\\//i.test(trimmed)) return trimmed;',
    '  if (/^data:image\\//i.test(trimmed)) return trimmed;',
    '  return null;',
    '}',
    '',
    'function normalizeIconSize(size: IconSize | undefined): string | null {',
    "  if (typeof size === 'number' && Number.isFinite(size)) return `${size}px`;",
    "  const trimmed = String(size ?? '').trim();",
    "  if (!trimmed || trimmed === 'inherit') return null;",
    '  const preset = ICON_SIZE_PRESETS[trimmed.toLowerCase()];',
    '  if (preset) return preset;',
    '  return trimmed;',
    '}',
    '',
    'const ICON_SIZE_PRESETS: Record<string, string> = {',
    "  xs: '12px',",
    "  sm: '16px',",
    "  md: '20px',",
    "  lg: '24px',",
    "  xl: '32px',",
    '};',
    '',
    "function normalizeIconRenderMode(value: IconRenderMode | undefined, source: string): Exclude<IconRenderMode, 'auto'> {",
    "  if (value === 'image' || value === 'mask') return value;",
    '  return isImageAssetSource(source) ? \'image\' : \'mask\';',
    '}',
    '',
    'function isImageAssetSource(source: string): boolean {',
    '  const normalized = source.trim().toLowerCase();',
    "  return normalized.startsWith('data:image/') ||",
    "    normalized.includes('/workbench-assets/images/') ||",
    "    normalized.includes('/workbench-assets/icons/clova-color/');",
    '}',
    '',
    'function escapeCssUrl(value: string): string {',
    "  return value.replace(/\\\\/g, '\\\\\\\\').replace(/\"/g, '\\\\\"');",
    '}',
    '',
    'function formatIconLabel(source: string): string {',
    "  const fileName = source.split(/[?#]/, 1)[0]?.split('/').pop() ?? 'icon';",
    "  return fileName.replace(/\\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'icon';",
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledIconStoriesSource() {
  return [
    "import { Icon as WorkbenchIcon } from './Icon';",
    '',
    'type Args = Record<string, boolean | number | string>;',
    "const RENDER_MODES = ['auto', 'mask', 'image'] as const;",
    "const SIZES = ['inherit', 'xs', 'sm', 'md', 'lg', 'xl'] as const;",
    "const DEFAULT_ICON_SOURCE = '/workbench-assets/icons/lucide/sparkles.svg';",
    '',
    'const DEFAULT_PROPS = {',
    '  decorative: true,',
    "  label: '',",
    "  renderMode: 'auto',",
    "  size: 'inherit',",
    '  source: DEFAULT_ICON_SOURCE,',
    '} as const;',
    '',
    'const INSERT_PROPS = {',
    '  decorative: true,',
    '  source: DEFAULT_ICON_SOURCE,',
    '} as const;',
    '',
    'const meta = {',
    "  title: 'Local/Icon',",
    '  component: WorkbenchIcon,',
    '  args: DEFAULT_PROPS,',
    '  argTypes: {',
    '    source: {',
    "      control: 'text',",
    "      label: 'Asset',",
    "      groupId: 'icon',",
    "      groupLabel: 'Icon',",
    '      groupOrder: 10,',
    '      order: 10,',
    "      picker: 'asset',",
    "      assetKinds: ['image', 'icon'],",
    '    },',
    '    size: {',
    "      control: 'select',",
    '      options: SIZES,',
    "      label: 'Size',",
    "      groupId: 'icon',",
    "      groupLabel: 'Icon',",
    '      groupOrder: 10,',
    '      order: 20,',
    '    },',
    '    renderMode: {',
    "      control: 'select',",
    '      options: RENDER_MODES,',
    "      label: 'Render mode',",
    "      groupId: 'icon',",
    "      groupLabel: 'Icon',",
    '      groupOrder: 10,',
    '      order: 30,',
    '    },',
    '    decorative: {',
    "      control: 'boolean',",
    "      label: 'Decorative',",
    "      groupId: 'accessibility',",
    "      groupLabel: 'Accessibility',",
    '      groupOrder: 40,',
    '      order: 10,',
    '    },',
    '    label: {',
    "      control: 'text',",
    "      label: 'Accessible label',",
    "      groupId: 'accessibility',",
    "      groupLabel: 'Accessibility',",
    '      groupOrder: 40,',
    '      order: 20,',
    "      when: { key: 'decorative', value: false },",
    '    },',
    '  },',
    '  sourceInsert: {',
    '    props: INSERT_PROPS,',
    '  },',
    '};',
    'export default meta;',
    '',
    'export const Icon = {',
    "  name: 'Icon',",
    '  render: (args: Args) => (',
    '    <WorkbenchIcon',
    '      decorative={asBoolean(args.decorative, true)}',
    '      label={asText(args.label)}',
    "      renderMode={asOption(args.renderMode, RENDER_MODES, 'auto')}",
    "      size={asOption(args.size, SIZES, 'inherit')}",
    '      source={asText(args.source, DEFAULT_ICON_SOURCE)}',
    '    />',
    '  ),',
    '};',
    '',
    'function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {',
    "  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;",
    '}',
    '',
    'function asText(value: unknown, fallback = \'\'): string {',
    "  return typeof value === 'string' && value.trim() ? value : fallback;",
    '}',
    '',
    'function asBoolean(value: unknown, fallback: boolean): boolean {',
    "  return typeof value === 'boolean' ? value : fallback;",
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledCardSource() {
  return [
    "import type { HTMLAttributes } from 'react';",
    "import './local.css';",
    '',
    'export function Card({ className = \'\', ...props }: HTMLAttributes<HTMLElement>) {',
    '  return <article {...props} className={[\'wb-card\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
    'export function CardHeader({ className = \'\', ...props }: HTMLAttributes<HTMLDivElement>) {',
    '  return <div {...props} className={[\'wb-card__header\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
    'export function CardTitle({ className = \'\', ...props }: HTMLAttributes<HTMLHeadingElement>) {',
    '  return <h2 {...props} className={[\'wb-card__title\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
    'export function CardDescription({ className = \'\', ...props }: HTMLAttributes<HTMLParagraphElement>) {',
    '  return <p {...props} className={[\'wb-card__description\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
    'export function CardContent({ className = \'\', ...props }: HTMLAttributes<HTMLDivElement>) {',
    '  return <div {...props} className={[\'wb-card__content\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
    'export function CardFooter({ className = \'\', ...props }: HTMLAttributes<HTMLDivElement>) {',
    '  return <div {...props} className={[\'wb-card__footer\', className].filter(Boolean).join(\' \')} />;',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledCardStoriesSource() {
  return [
    "import { Button } from './Button';",
    "import { Card as WorkbenchCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';",
    '',
    'type Args = Record<string, string>;',
    '',
    'const DEFAULT_PROPS = {',
    "  title: 'Starter card',",
    "  description: 'A source-backed card with component tokens and editable children.',",
    "  body: 'Use this as a small, registered Workbench component test case.',",
    '} as const;',
    '',
    'const meta = {',
    "  title: 'Local/Card',",
    '  component: Card,',
    '  args: DEFAULT_PROPS,',
    '  argTypes: {',
    "    title: { control: 'text' },",
    "    description: { control: 'text' },",
    "    body: { control: 'text' },",
    '  },',
    '  sourceInsert: {',
    '    props: {},',
    '  },',
    '};',
    'export default meta;',
    '',
    'export const Card = {',
    "  name: 'Card',",
    '  render: (args: Args) => (',
    '    <WorkbenchCard>',
    '      <CardHeader>',
    "        <CardTitle>{asText(args.title, 'Starter card')}</CardTitle>",
    "        <CardDescription>{asText(args.description, DEFAULT_PROPS.description)}</CardDescription>",
    '      </CardHeader>',
    '      <CardContent>',
    "        <p>{asText(args.body, DEFAULT_PROPS.body)}</p>",
    '      </CardContent>',
    '      <CardFooter>',
    '        <Button size="sm">Action</Button>',
    '        <Button size="sm" variant="ghost">Dismiss</Button>',
    '      </CardFooter>',
    '    </WorkbenchCard>',
    '  ),',
    '};',
    '',
    'function asText(value: unknown, fallback = \'\'): string {',
    "  return typeof value === 'string' ? value : fallback;",
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledInputSource() {
  return [
    "import type { InputHTMLAttributes } from 'react';",
    "import './local.css';",
    '',
    'export type InputProps = InputHTMLAttributes<HTMLInputElement> & {',
    '  description?: string;',
    '  error?: string;',
    '  label?: string;',
    '};',
    '',
    'export function Input({',
    "  className = '',",
    '  description,',
    '  error,',
    '  id,',
    '  label,',
    '  ...props',
    '}: InputProps) {',
    '  const inputId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, \'-\').replace(/^-|-$/g, \'\') : undefined);',
    '  const descriptionId = inputId && description ? `${inputId}-description` : undefined;',
    '  const errorId = inputId && error ? `${inputId}-error` : undefined;',
    '  return (',
    '    <label className="wb-field">',
    '      {label ? <span className="wb-field__label">{label}</span> : null}',
    '      <input',
    '        {...props}',
    '        aria-describedby={[descriptionId, errorId].filter(Boolean).join(\' \') || undefined}',
    '        aria-invalid={error ? true : props[\'aria-invalid\']}',
    '        className={[\'wb-input\', className].filter(Boolean).join(\' \')}',
    '        id={inputId}',
    '      />',
    '      {description ? <span className="wb-field__description" id={descriptionId}>{description}</span> : null}',
    '      {error ? <span className="wb-field__error" id={errorId}>{error}</span> : null}',
    '    </label>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledInputStoriesSource() {
  return [
    "import { Input as WorkbenchInput } from './Input';",
    '',
    'type Args = Record<string, string>;',
    '',
    'const DEFAULT_PROPS = {',
    "  label: 'Project name',",
    "  placeholder: 'Workbench project',",
    "  description: 'This field is rendered from a registered source component.',",
    "  error: '',",
    '} as const;',
    '',
    'const meta = {',
    "  title: 'Local/Input',",
    '  component: Input,',
    '  args: DEFAULT_PROPS,',
    '  argTypes: {',
    "    label: { control: 'text' },",
    "    placeholder: { control: 'text' },",
    "    description: { control: 'text' },",
    "    error: { control: 'text' },",
    '  },',
    '  sourceInsert: {',
    '    props: DEFAULT_PROPS,',
    '  },',
    '};',
    'export default meta;',
    '',
    'export const Input = {',
    "  name: 'Input',",
    '  render: (args: Args) => (',
    '    <WorkbenchInput',
    '      description={asText(args.description)}',
    '      error={asText(args.error)}',
    "      label={asText(args.label, 'Project name')}",
    "      placeholder={asText(args.placeholder, 'Workbench project')}",
    '    />',
    '  ),',
    '};',
    '',
    'function asText(value: unknown, fallback = \'\'): string {',
    "  return typeof value === 'string' ? value : fallback;",
    '}',
    '',
  ].join('\n');
}

function createWorkbenchBundledComponentIndexSource() {
  return [
    "export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';",
    "export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';",
    "export { Icon, type IconProps } from './Icon';",
    "export { Input, type InputProps } from './Input';",
    '',
  ].join('\n');
}

function createWorkbenchBundledComponentCss() {
  return [
    '.wb-starter-page {',
    '  min-height: 100vh;',
    '  padding: clamp(32px, 6vw, 72px);',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: var(--ds-token-workbench-components-muted);',
    '  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '}',
    '',
    '.wb-starter-page__hero {',
    '  display: grid;',
    '  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);',
    '  align-items: center;',
    '  gap: clamp(28px, 5vw, 64px);',
    '  max-width: 1080px;',
    '  margin: 0 auto;',
    '}',
    '',
    '.wb-starter-page__copy {',
    '  display: grid;',
    '  gap: 18px;',
    '}',
    '',
    '.wb-starter-page__eyebrow {',
    '  margin: 0;',
    '  color: var(--ds-token-workbench-components-accent);',
    '  font-size: 13px;',
    '  font-weight: 700;',
    '  text-transform: uppercase;',
    '}',
    '',
    '.wb-starter-page h1 {',
    '  max-width: 720px;',
    '  margin: 0;',
    '  font-size: clamp(40px, 7vw, 76px);',
    '  line-height: 0.95;',
    '}',
    '',
    '.wb-starter-page p {',
    '  max-width: 620px;',
    '  margin: 0;',
    '  color: var(--ds-token-workbench-components-muted-foreground);',
    '  font-size: 17px;',
    '  line-height: 1.65;',
    '}',
    '',
    '.wb-starter-page__actions,',
    '.wb-card__footer {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: 10px;',
    '}',
    '',
    '.wb-button {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  min-width: 0;',
    '  border: 1px solid transparent;',
    '  border-radius: var(--ds-token-workbench-components-radius-sm);',
    '  font: inherit;',
    '  font-size: 14px;',
    '  font-weight: 650;',
    '  cursor: pointer;',
    '  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;',
    '}',
    '',
    '.wb-button:focus-visible,',
    '.wb-input:focus-visible {',
    '  outline: none;',
    '  box-shadow: 0 0 0 var(--ds-token-workbench-components-ring-offset) var(--ds-token-workbench-components-focus-ring);',
    '}',
    '',
    '.wb-button:disabled {',
    '  cursor: not-allowed;',
    '  opacity: 0.58;',
    '}',
    '',
    '.wb-button__label {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: inherit;',
    '  min-width: 0;',
    '}',
    '',
    '.wb-button__label > svg,',
    '.wb-button__label > img {',
    '  inline-size: 1em;',
    '  block-size: 1em;',
    '  flex: 0 0 auto;',
    '  display: block;',
    '}',
    '',
    '.wb-button--sm {',
    '  min-height: var(--ds-token-workbench-components-button-height-sm);',
    '  padding: 0 12px;',
    '}',
    '',
    '.wb-button--md {',
    '  min-height: var(--ds-token-workbench-components-button-height-md);',
    '  padding: 0 var(--ds-token-workbench-components-button-padding-x);',
    '}',
    '',
    '.wb-button--lg {',
    '  min-height: var(--ds-token-workbench-components-button-height-lg);',
    '  padding: 0 20px;',
    '}',
    '',
    '.wb-button--icon {',
    '  inline-size: var(--ds-token-workbench-components-button-height-md);',
    '  min-height: var(--ds-token-workbench-components-button-height-md);',
    '  padding: 0;',
    '}',
    '',
    '.wb-button--default {',
    '  color: var(--ds-token-workbench-components-accent-foreground);',
    '  background: var(--ds-token-workbench-components-accent);',
    '}',
    '',
    '.wb-button--default:hover {',
    '  background: var(--ds-token-workbench-components-accent-hover);',
    '}',
    '',
    '.wb-button--secondary {',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: var(--ds-token-workbench-components-muted);',
    '}',
    '',
    '.wb-button--outline {',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: var(--ds-token-workbench-components-surface);',
    '  border-color: var(--ds-token-workbench-components-border);',
    '}',
    '',
    '.wb-button--ghost {',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: transparent;',
    '}',
    '',
    '.wb-button--destructive {',
    '  color: #ffffff;',
    '  background: var(--ds-token-workbench-components-destructive);',
    '}',
    '',
    '.wb-button--destructive:hover {',
    '  background: var(--ds-token-workbench-components-destructive-hover);',
    '}',
    '',
    '.wb-button__spinner {',
    '  inline-size: 14px;',
    '  block-size: 14px;',
    '  border: 2px solid currentColor;',
    '  border-right-color: transparent;',
    '  border-radius: 999px;',
    '}',
    '',
    '.wb-button__icon,',
    '.wb-icon {',
    '  flex: 0 0 auto;',
    '  display: inline-block;',
    '  background-color: currentColor;',
    '  background-position: center;',
    '  background-repeat: no-repeat;',
    '  background-size: contain;',
    '  color: currentColor;',
    '  mask-image: var(--wb-icon-url);',
    '  mask-position: center;',
    '  mask-repeat: no-repeat;',
    '  mask-size: contain;',
    '  vertical-align: -0.125em;',
    '  -webkit-mask-image: var(--wb-icon-url);',
    '  -webkit-mask-position: center;',
    '  -webkit-mask-repeat: no-repeat;',
    '  -webkit-mask-size: contain;',
    '}',
    '',
    '.wb-icon--image {',
    '  background-color: transparent;',
    '  background-image: var(--wb-icon-url);',
    '  mask-image: none;',
    '  -webkit-mask-image: none;',
    '}',
    '',
    '.wb-icon--missing {',
    '  border: 1px dashed currentColor;',
    '  border-radius: 4px;',
    '  opacity: 0.48;',
    '}',
    '',
    '.wb-card {',
    '  display: grid;',
    '  gap: var(--ds-token-workbench-components-card-gap);',
    '  padding: var(--ds-token-workbench-components-card-padding);',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: var(--ds-token-workbench-components-surface);',
    '  border: 1px solid var(--ds-token-workbench-components-border);',
    '  border-radius: var(--ds-token-workbench-components-radius-md);',
    '  box-shadow: var(--ds-token-workbench-components-card-shadow);',
    '}',
    '',
    '.wb-card__header,',
    '.wb-card__content {',
    '  display: grid;',
    '  gap: 8px;',
    '}',
    '',
    '.wb-card__title {',
    '  margin: 0;',
    '  font-size: 22px;',
    '  line-height: 1.25;',
    '}',
    '',
    '.wb-card__description {',
    '  margin: 0;',
    '  color: var(--ds-token-workbench-components-muted-foreground);',
    '  line-height: 1.55;',
    '}',
    '',
    '.wb-field {',
    '  display: grid;',
    '  gap: 7px;',
    '}',
    '',
    '.wb-field__label {',
    '  color: var(--ds-token-workbench-components-text);',
    '  font-size: 13px;',
    '  font-weight: 650;',
    '}',
    '',
    '.wb-field__description,',
    '.wb-field__error {',
    '  font-size: 12px;',
    '  line-height: 1.4;',
    '}',
    '',
    '.wb-field__description {',
    '  color: var(--ds-token-workbench-components-muted-foreground);',
    '}',
    '',
    '.wb-field__error {',
    '  color: var(--ds-token-workbench-components-destructive);',
    '}',
    '',
    '.wb-input {',
    '  inline-size: 100%;',
    '  min-height: var(--ds-token-workbench-components-input-height);',
    '  padding: 0 12px;',
    '  color: var(--ds-token-workbench-components-text);',
    '  background: var(--ds-token-workbench-components-surface);',
    '  border: 1px solid var(--ds-token-workbench-components-border);',
    '  border-radius: var(--ds-token-workbench-components-radius-sm);',
    '  font: inherit;',
    '}',
    '',
    '.wb-input::placeholder {',
    '  color: var(--ds-token-workbench-components-muted-foreground);',
    '}',
    '',
    '@media (max-width: 760px) {',
    '  .wb-starter-page__hero {',
    '    grid-template-columns: 1fr;',
    '  }',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchThirdPartyNotices() {
  return [
    '# Third Party Notices',
    '',
    '## shadcn/ui',
    '',
    'The bundled starter components are inspired by shadcn/ui component API and design patterns, adapted for Workbench source components, token CSS, and project-local editing.',
    '',
    'shadcn/ui is licensed under the MIT License.',
    '',
    'Copyright (c) 2023 shadcn',
    '',
    'See: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md',
    '',
    '## Base UI',
    '',
    'Several bundled starter components render through @base-ui/react primitives inside Workbench-owned wrapper components.',
    '',
    'Base UI is licensed under the MIT License.',
    '',
    'See: https://github.com/mui/base-ui/blob/master/LICENSE',
    '',
  ].join('\n');
}

function escapeJsxAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeJsxText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtmlText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createWorkbenchProjectReadme(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  const templateLabel =
    normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? 'shadcn(Base UI 기반)'
      : normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
        ? 'Astryx 디자인 시스템'
      : '기본 React + Tailwind';

  return [
    '# Workbench 프로젝트',
    '',
    '이 폴더는 Workbench가 편집하는 사용자 프로젝트입니다. Workbench 앱 자체의 소스가 아니라, 사용자가 만들고 수정하는 실제 React/TSX 프로젝트 폴더입니다.',
    '',
    '## Workbench에서 여는 방법',
    '',
    '1. Workbench에서 이 프로젝트 폴더를 엽니다.',
    '2. Design 화면에서 페이지나 컴포넌트를 선택합니다.',
    '3. Canvas, Layers, Inspector를 오가며 구조, 스타일, 토큰, 데이터, props를 수정합니다.',
    '4. 저장된 변경은 이 폴더의 소스 파일과 `.workbench` 메타데이터에 반영됩니다.',
    '',
    '자주 쓰는 흐름:',
    '',
    '- 선택한 노드에 요소를 추가하려면 `I` 단축키나 레이어 트리의 추가 버튼을 사용합니다.',
    '- 여러 노드는 `Shift`로 추가 선택합니다. `Cmd/Ctrl` 클릭은 보통 더 깊은 실제 노드를 고르는 스마트 선택 용도입니다.',
    '- 위치 이동은 가능한 경우 `Alt+Arrow`로 처리됩니다.',
    '- 화면 크기 확인은 Workbench preview size 옵션이나 브라우저 개발 서버에서 확인합니다.',
    '',
    '## 폴더 구조',
    '',
    '```text',
    '.workbench/',
    '  workbench.config.json   # 프로젝트 설정',
    '  pages.json              # Workbench 페이지 등록',
    '  components.json         # 컴포넌트 등록',
    '  tokens.json             # 디자인 토큰',
    '  assets.json             # 에셋 등록',
    'src/',
    '  workbench-pages/        # Workbench가 만든 페이지',
    '  components/             # 프로젝트 컴포넌트',
    '  workbench-tokens.css    # 토큰 CSS 변수',
    'public/workbench-assets/  # 이미지, 아이콘, 폰트 등 프로젝트 에셋',
    'docs/workbench-agent/     # Codex, Claude Code 같은 코드 에이전트용 가이드',
    '```',
    '',
    `이 프로젝트는 ${templateLabel} 템플릿으로 생성되었습니다.`,
    '',
    normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE
      ? 'shadcn 스타일 컴포넌트는 Base UI 기반의 프로젝트 소유 wrapper를 편집 계약으로 사용합니다. Workbench는 dependency 내부 DOM이 아니라 이 프로젝트의 wrapper props, children, className, 토큰을 중심으로 편집합니다.'
      : normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_ASTRYX
        ? 'Astryx 공식 테마와 프로젝트 소유 wrapper, 컴포넌트 갤러리가 포함됩니다.'
        : '기본 템플릿은 Tailwind 유틸리티와 프로젝트 CSS 클래스를 함께 사용할 수 있습니다. Workbench는 `className`을 실제 소스 편집 대상으로 다룹니다.',
    '',
    '## Workbench용 코딩 철학',
    '',
    'Workbench 프로젝트의 TSX는 최종 프로덕트 앱 아키텍처를 완성하는 코드라기보다, 디자이너가 화면을 해석하고 선택하고 편집할 수 있게 만드는 디자인 편집 소스입니다.',
    '',
    'AI 코드 에이전트에게는 다음 기준을 우선 요청하세요:',
    '',
    '- 화면에서 중요한 구조는 `section`, `header`, `main`, `aside`, 카드, 표, 폼처럼 명확한 JSX와 이름 있는 컴포넌트로 표현합니다.',
    '- 정적인 디자인 값은 `className`, 프로젝트 CSS, 토큰으로 둡니다. inline style은 측정값, drag 위치, canvas 크기 같은 런타임 지오메트리에만 제한적으로 씁니다.',
    '- 차트, 지도, 에디터, 가상화 테이블, drag/drop, 복잡한 provider/context는 local component island로 감싸고, Workbench가 편집할 데이터와 외형은 props, CSV, 토큰, Binding 가능한 배열로 노출합니다.',
    '- provider, router, auth, data client, render callback, opaque config object로 화면 전체를 숨기지 않습니다. 이런 고급 상태/데이터 구조는 개발자 핸드오프 영역으로 두고, 화면 편집용 소스는 읽기 쉽게 유지합니다.',
    '- Workbench가 안전하게 되돌려 쓸 수 없는 내부 DOM은 억지로 편집 가능한 것처럼 만들지 않습니다. 부모 props, Binding, 데이터 표, wrapper 컴포넌트, read-only 안내로 다루는 편이 안전합니다.',
    '',
    '## 편집 가능한 것과 편집 불가인 것',
    '',
    'Workbench는 실제 소스를 최대한 그대로 유지하면서 편집합니다. 그래서 보이는 모든 DOM이 항상 직접 편집 가능한 것은 아닙니다.',
    '',
    '편집하기 좋은 대상:',
    '',
    '- 페이지의 `section`, `header`, `main`, `aside` 같은 명확한 JSX 구조',
    '- 프로젝트 컴포넌트의 공개 props, text, label, className',
    '- Tailwind 클래스와 프로젝트 CSS 클래스',
    '- `.workbench/tokens.json`과 `src/workbench-tokens.css`에 있는 디자인 토큰',
    '- Workbench가 지원하는 chart/table의 CSV 또는 표 데이터 props',
    '- `public/workbench-assets/`에 등록된 이미지, 아이콘, 폰트 에셋',
    '',
    '빨간 선택 또는 편집 불가로 표시될 수 있는 대상:',
    '',
    '- 차트, 지도, canvas/WebGL, 가상화 테이블, 리치 에디터 같은 런타임 island 내부',
    '- Base UI, shadcn, Radix 계열 primitive가 생성한 내부 DOM과 portal 내용',
    '- `.map(...)`, JSON, fetch 데이터에서 렌더링된 행 중 안전한 원본 데이터 writer가 없는 경우',
    '- 함수, 템플릿 문자열, 번역 함수, 포맷터, 계산식으로 만들어진 텍스트나 className',
    '- SVG path, canvas 그림, iframe, video, 외부 embed 내부',
    '- router, auth, provider, theme, data client 같은 런타임 배관 노드',
    '- 생성 파일, 패키지 내부 파일, 프로젝트 루트 밖의 파일',
    '',
    '이런 경우에는 내부 DOM을 억지로 편집하기보다 부모 컴포넌트의 props, 토큰, 데이터 표, CSV, wrapper 컴포넌트, 원본 에셋을 수정하는 것이 안전합니다.',
    '',
    '## Tailwind, CSS, 토큰',
    '',
    '- Tailwind utility와 프로젝트 CSS class를 `className`에 그대로 둘 수 있습니다.',
    '- 반복해서 쓰는 색상, 간격, radius, typography, shadow 값은 토큰으로 관리하는 것을 권장합니다.',
    '- Tailwind 설정 경로는 프로젝트 상대 경로여야 합니다. 예: `src/index.css`, `src/workbench-tailwind.css`, `src/workbench-tokens.css`.',
    '- `/Users/...`, `C:\\Users\\...`, Vite `@fs/...`, localhost URL, Workbench 앱 설치 경로를 `.workbench` 설정이나 메타데이터에 저장하지 마세요.',
    '- 프로젝트를 다른 폴더로 옮겨도 열릴 수 있도록 에셋과 CSS는 프로젝트 내부 경로를 기준으로 관리합니다.',
    '',
    '## 로컬 개발 명령',
    '',
    'Workbench는 프로젝트 생성 시 의존성 설치를 자동으로 시도합니다. 네트워크, npm, 권한 문제로 실패하면 `.workbench/dependency-install.json`에 상태가 남습니다. 이 폴더를 일반 React 앱처럼 실행하거나 검증할 때 설치를 다시 해야 하면 아래 명령을 사용합니다.',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    'npm run check',
    'npm run build',
    '```',
    '',
    '템플릿이나 프로젝트에 따라 일부 명령이 없을 수 있습니다. 그 경우 `package.json`의 scripts를 확인하세요.',
    '',
    '## AI 코드 에이전트와 함께 쓸 때',
    '',
    'Codex나 Claude Code에게 이 프로젝트를 수정하게 할 때는 이 README가 있는 프로젝트 루트 폴더를 작업 경로로 열게 하세요. Workbench 앱 설치 경로나 개별 TSX 파일 하나가 아니라, `.workbench/`, `src/`, `public/`, `docs/`가 함께 있는 폴더 전체가 작업 루트입니다.',
    '',
    '경로를 지정할 때는 이렇게 말하면 좋습니다:',
    '',
    '```text',
    '작업 폴더는 $HOME/Desktop/WB-PJ/my-workbench-project 입니다.',
    '이 폴더를 프로젝트 루트로 보고, 루트 밖 파일은 제가 요청하지 않는 한 수정하지 마세요.',
    '```',
    '',
    'Claude Code 같은 터미널 기반 에이전트는 해당 폴더로 이동한 뒤 실행하는 편이 가장 안전합니다:',
    '',
    '```bash',
    'cd "$HOME/Desktop/WB-PJ/my-workbench-project"',
    'claude',
    '```',
    '',
    'Codex Desktop처럼 폴더를 여는 도구에서는 이 프로젝트 루트 폴더를 워크스페이스로 선택한 뒤 요청하세요. 에이전트가 경로를 저장해야 할 때는 프로젝트 내부에서는 `src/workbench-pages/Home.tsx`처럼 상대 경로를 쓰고, `.workbench` 메타데이터나 소스에 `/Users/...`, `@fs/...`, localhost URL을 남기지 않게 요청하는 것이 좋습니다.',
    '',
    '첫 요청은 아래처럼 시작하면 에이전트가 Workbench 작업 방식을 더 잘 이해합니다:',
    '',
    '```text',
    '이 폴더는 Workbench 프로젝트입니다. 먼저 AGENTS.md와 docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md를 읽고 작업해 주세요.',
    '가이드는 시작할 때 한 번만 확인하지 말고, 구조/경로/컴포넌트 계약/CSS/에셋/registry를 바꾸기 전과 최종 답변 전에 다시 참고해 주세요.',
    '화면은 Workbench에서 선택하고 편집 가능한 TSX 구조로 만들고, 중요한 레이아웃은 명확한 JSX와 className, 토큰, props로 표현해 주세요.',
    '복잡한 상태 관리, provider, chart/map/editor 같은 런타임 의존성은 local component island로 분리하고, 디자이너가 편집할 값은 props, CSV/table, Binding 가능한 배열, 토큰으로 노출해 주세요.',
    '작업 후 가능하면 npm run check를 실행하고, 수정한 파일과 확인 결과를 알려주세요.',
    '```',
    '',
    '상황별 요청 예시:',
    '',
    '화면을 먼저 만들고 싶을 때:',
    '',
    '```text',
    'Workbench에서 편집 가능한 새 페이지를 만들어 주세요. src/workbench-pages/ 아래에 페이지 TSX를 만들고 .workbench/pages.json도 맞춰 주세요. 중요한 구조는 section/header/main/card/table/form 같은 명확한 JSX로 두고, 정적 디자인은 className과 토큰을 우선 사용해 주세요.',
    '```',
    '',
    '디자인 시스템을 만들고 싶을 때:',
    '',
    '```text',
    '이 프로젝트에 Workbench 친화적인 디자인 시스템 기초를 만들어 주세요. 먼저 토큰 구조, src/workbench-tokens.css, 공통 CSS, Button/Card/Input/Badge 같은 기본 컴포넌트와 story/control metadata, .workbench/components.json 등록을 함께 정리해 주세요. 컴포넌트는 className과 semantic props가 실제 렌더링에 반영되게 해 주세요.',
    '```',
    '',
    '컴포넌트를 추가하고 싶을 때:',
    '',
    '```text',
    'docs/workbench-agent/WORKBENCH-COMPONENT-AUTHORING.md를 읽고, Workbench에서 삽입/선택/Inspector 편집이 가능한 컴포넌트를 추가해 주세요. TSX만 만들지 말고 필요한 export, CSS, token, story/control metadata, .workbench/components.json 등록까지 맞춰 주세요.',
    '```',
    '',
    '기존 화면을 다듬고 싶을 때:',
    '',
    '```text',
    '이 화면을 Workbench에서 더 잘 편집되도록 정리해 주세요. provider-heavy root, render callback, opaque config, 과한 inline style, 안전하게 write-back 되지 않는 mapped/runtime DOM이 있으면 명확한 JSX, props, Binding-friendly data, local component island로 정리해 주세요.',
    '```',
    '',
    '짧게 요청할 때 유용한 표현:',
    '',
    '- "Workbench에서 선택하고 편집 가능한 TSX 구조로 만들어 주세요."',
    '- "inline style 대신 className, CSS 변수, 토큰을 우선 사용해 주세요."',
    '- "차트나 복잡한 런타임 라이브러리는 local component island로 감싸고, 데이터는 props나 CSV로 노출해 주세요."',
    '- "절대 경로나 로컬 개발 서버 URL을 프로젝트 메타데이터에 저장하지 마세요."',
    '',
    '꿀팁: 컴포넌트를 쓰다가 Inspector에서 바꾸고 싶은 값이 props에 없거나 표현력이 부족하다면, AI에게 컴포넌트의 편집 계약을 확장해 달라고 요청하세요.',
    '',
    '```text',
    '이 컴포넌트를 Workbench에서 더 잘 편집할 수 있게 props를 추가해 주세요.',
    '예: [원하는 값: variant, tone, size, title, description, icon, image, actions, dataCsv, seriesCsv 등]',
    'TSX에서 실제 렌더링에 반영하고, story/control metadata와 .workbench/components.json의 props 계약도 함께 맞춰 주세요.',
    '기존 사용처가 깨지지 않도록 기본값과 className merge도 유지해 주세요.',
    '```',
    '',
    'Workbench는 인앱 AI 채팅 제품이 아닙니다. AI는 이 프로젝트의 소스를 바깥에서 수정하고, Workbench는 그 소스를 시각적으로 선택, 검사, 편집, 검증하는 도구입니다.',
    '',
    '## 문제가 생겼을 때',
    '',
    '- Canvas에서 보이지만 편집되지 않는 요소는 read-only boundary일 수 있습니다. Inspector의 Binding 또는 부모 props를 먼저 확인하세요.',
    '- Preview가 브라우저와 다르면 Tailwind compiled CSS, token CSS, project-relative CSS 경로를 확인하세요.',
    '- 컴포넌트를 추가했는데 Insert 목록에 없으면 `.workbench/components.json` 등록 후 프로젝트를 다시 여세요.',
    '- 에셋이 깨지면 `public/workbench-assets/` 아래에 파일이 있고 `.workbench/assets.json` 또는 source path가 프로젝트 상대 경로인지 확인하세요.',
    '- undo/redo가 예상과 다르면 한 번의 의도적 편집이 한 history transaction으로 저장되는지 확인하고, 표/CSV 편집은 Apply 단위로 커밋하는 것이 안전합니다.',
    '',
    '문제가 애매하면 AI 코드 에이전트에게 코드 검토와 수정을 요청해 보세요. Workbench는 소스, registry, CSS, 토큰, preview가 연결된 도구라서 문제 원인이 코드 안에 드러나는 경우가 많습니다.',
    '',
    '```text',
    '이 폴더는 Workbench 프로젝트입니다. 현재 이런 문제가 있습니다: [증상 설명]',
    'AGENTS.md와 docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md를 읽고, 관련 TSX, .workbench registry, CSS/Tailwind/token 경로, import 경로, 컴포넌트 props 계약을 검토한 뒤 원인을 찾아 수정해 주세요.',
    '수정 후 가능한 체크를 실행하고, 어떤 파일을 고쳤는지와 왜 문제가 해결되는지 설명해 주세요.',
    '```',
    '',
    '대부분의 편집/프리뷰/경로 문제는 이 방식으로 빠르게 좁혀볼 수 있습니다.',
    '',
  ].join('\n');
}

function createWorkbenchAgentEntrypoint(fileName) {
  return [
    '# Workbench Project Agent Instructions',
    '',
    'This folder is a Workbench local project. It is the user-owned project',
    'workspace, not the Workbench application source.',
    '',
    'Load context through project skills, not by reading every guide:',
    '',
    `- \`${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}\` for new pages and substantial visual redesigns`,
    `- \`${WORKBENCH_PROJECT_AUTHORING_SKILL}\` for general project source, routes, CSS, assets, and metadata`,
    `- \`${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}\` for components, stories, props, and sourceInsert contracts`,
    `- \`${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}\` for preview, CSS, asset, font, and story-runtime failures`,
    '',
    'Shared project skills live under `.agents/skills`; Codex discovers them',
    'there, and Claude Code receives thin discovery wrappers under',
    '`.claude/skills`. Start with the matching skill and read only the guide',
    'sections it requires. If skill discovery is unavailable, open that shared',
    'SKILL.md directly.',
    '',
    'Keep those guides in the loop throughout the task. Re-check them before',
    'changing source shape, registry metadata, component contracts, CSS/token',
    'paths, assets, imports, or final handoff notes.',
    '',
    'Hard stops:',
    '',
    '- Do not inspect, decompile, or rely on the packaged Workbench app internals.',
    '- Do not add in-app AI prompt bars, AI API keys, or generation surfaces unless the user explicitly asks.',
    '- Do not treat placeholder UI as finished product progress.',
    '- Do not hand-edit `.workbench/components.json` or `.workbench/prop-registry.json` for component creation or ordinary component changes.',
    '- Keep Workbench registry files, source files, and sidecar notes consistent when you change pages or components.',
    '',
    `${fileName} should stay thin. Put shared project guidance in \`${WORKBENCH_PROJECT_AGENT_GUIDE_FILE}\`.`,
    '',
  ].join('\n');
}

function createWorkbenchProjectSkillOpenAiYaml({ displayName, shortDescription, defaultPrompt }) {
  return [
    'interface:',
    `  display_name: "${displayName}"`,
    `  short_description: "${shortDescription}"`,
    `  default_prompt: "${defaultPrompt}"`,
    '',
    'policy:',
    '  allow_implicit_invocation: true',
    '',
  ].join('\n');
}

export function createWorkbenchProjectDesignAuthoringSkill(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const templateLabel = formatWorkbenchProjectTemplateLabel(templateId);
  return [
    '---',
    `name: ${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}`,
    'description: Create or substantially redesign distinctive, source-backed Workbench pages and product or service touchpoints. Use when a user asks to design, build, explore, rework, or art-direct a screen, flow, landing page, dashboard, application, consumer service, commerce experience, or other visual frontend artifact where the result must remain editable in Workbench.',
    '---',
    '',
    '# Workbench Design Authoring',
    '',
    `Template: ${templateLabel}.`,
    '',
    'Implement the result in this project\'s real source and leave it editable through Workbench. That is the hard contract. Design exploration, detailed requirements, prompt approval, component search, render evidence, scorecards, and final approval are optional tools.',
    '',
    '## Required Context',
    '',
    '- Read `AGENTS.md` and `docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md`.',
    `- Read \`${WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE}\` when product intent, rationale, constraints, limitations, lessons, or improvement priorities affect the task. Treat it as the only project-owned public-safe organizational context; do not substitute raw chats, personal memory, session logs, or private history.`,
    '- When the Workbench authoring MCP is available for a new page or substantial redesign, pass an explicit `projectTarget` to `workbench_inspect_design_context`, verify the returned `projectBinding`, and never authorize writes from a stale last-opened project or ambient browser tab. Use the default compact response first; request `responseProfile: "full"` only when the full inventory is genuinely needed.',
    '- If the authoring MCP is unavailable, direct source editing remains valid under the same source, editability, preview, and verification contract. Focused fixes and refactors may edit source directly.',
    '- Inspect the project handoff, active source, adjacent source patterns, configured CSS, assets, and supplied references that materially affect the task.',
    '',
    '## Reference Intent Gate',
    '',
    '- Before the first write for any supplied Figma node, screenshot, design export, rendered HTML, or code reference, classify it as `exact-conversion` or `adapt-to-project`.',
    '- Resolve the mode from explicit user wording first, then the project handoff, active source, and adjacent source patterns. Record it as `referenceAnalysis.implementationMode` when using the authoring MCP.',
    '- If those sources do not settle the mode, stop before writing and ask the user. `agent-may-assume` does not bypass this gate.',
    '- `exact-conversion` makes the artifact the observable structure and composition contract. `adapt-to-project` keeps the project frame, responsive structure, and component language while transferring only identified content and visual properties.',
    '- A Figma URL alone does not authorize copying its outer canvas, labels, device chrome, or layout topology.',
    '',
    '## Default Design Effort',
    '',
    'Apply these defaults on every design task without being asked; an explicit user instruction overrides any of them for that task.',
    '',
    '- Product thinking first: name the service\'s core loop and this page\'s role in it. Keep only what that loop needs on the surface, and move secondary or rare actions into popovers, sheets, dropdowns, drawers, or menus. Navigation chrome and the primary work area stay separate concerns.',
    '- Borderless by default: separate regions with surface tones, elevation, and spacing rather than border or divider lines. Use a bordered or filled surface only where tone and spacing genuinely cannot carry the separation.',
    '- Simple must not mean bland: commit to one deliberate identity per page — a signature color used sparingly for meaning, a typographic anchor, or an oversized motif — and include at least one visual-relief element (a scale jump, a color moment, an asymmetric composition).',
    '- Design interaction states: hover, focus-visible, active/current, and the open/closed states of any disclosure surface you add.',
    '- Never silently accept tool findings: every `workbench_verify_page` violation or warning (and any authoring-check finding) is either fixed or reported to the user with a one-line reason it stays.',
    '',
    '## Flexible Authoring',
    '',
    '- Use the host model\'s strongest design judgment. A design plugin or multiple visual options may help, but they are never mandatory.',
    '- Native semantic HTML and project primitives are first-class. Registered components are optional and useful for behavior, accessibility, reuse, or Inspector props; a catalog match never forces replacement.',
    '- Ordinary React patterns such as local helpers, arrays, `.map(...)`, conditions, callbacks, and data props are allowed. Use explicit JSX when per-item layer manipulation is actually required, and keep unsupported expressions as honest Binding/source boundaries.',
    '- If a registered component is used or changed, follow its source and matching CSF story prop contract.',
    '',
    '## Source Lifecycle Approval Gate',
    '',
    '- Before creating a page/component path, inspect scoped Git status, target existence, imports, registries, and relevant Workbench history. If a name, route, or path points to a missing artifact, check repository history before treating it as a blank slot.',
    '- Do not create a reusable/registered component or extend a component contract unless the current user request explicitly authorizes that exact component work. Broad page, catalog, redesign, editability, cleanup, or "all components" requests are not authorization. Name the proposed component and source/story/export/token impact, then wait for approval before writing.',
    '- Never restore or reconstruct a deleted or missing page/component from Workbench history, Git history, a stash, backup, generated output, another branch, or another project unless the user explicitly requests restoration of that exact artifact. A new-page or redesign request is not restoration approval.',
    '- If deletion versus accidental absence is ambiguous, stop before writing and ask. Do not create provisional files while waiting.',
    '',
    '## Workflow',
    '',
    '1. Inspect and bind the exact project, then resolve the Reference Intent Gate before the first write.',
    '2. Implement the requested design in real project source using native elements, primitives, ordinary React, and optional registered components.',
    '3. Keep routes, metadata, CSS, and assets coherent for Workbench preview.',
    '4. Open the exact page in Workbench and verify representative selection or honest Binding/source boundaries.',
    '5. Fix parse/render failures, stale styling, broken interactions, obvious overflow or clipping, unreadable contrast, missing essential accessible names, and request-specific fidelity or responsive defects.',
    '',
    'Detailed requirements contracts, prompt approval, component search, visual alternatives, render receipts, independent reviews, numeric scores, fixed refinement counts, and final approval loops are optional.',
    '',
    '## Quality Bar',
    '',
    'Judge the result against the brief, content, reference, and intended viewport. There is no mandatory 8px grid, equal-padding rule, optical-centroid proof, three-option exploration, score threshold, or approval ritual. The same result must render from current source and remain editable in Workbench.',
    '',
  ].join('\n');
}

function createWorkbenchClaudeDesignAuthoringSkillWrapper() {
  return [
    '---',
    `name: ${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}`,
    'description: Create or substantially redesign distinctive, source-backed Workbench pages and product or service touchpoints. Use for open-ended visual frontend, product design, service design, landing page, dashboard, application, commerce, or flow requests that must remain editable in Workbench.',
    '---',
    '',
    '# Workbench Design Authoring',
    '',
    'Use an installed visual-design capability when it materially helps the requested design. It is optional; do not require multiple visual options or a separate approval gate.',
    '',
    'Read and follow `../../../.agents/skills/workbench-design-authoring/SKILL.md` completely before acting.',
    '',
  ].join('\n');
}

function createWorkbenchClaudeProjectSkillWrapper({
  skillName,
  title,
  description,
}) {
  return [
    '---',
    `name: ${skillName}`,
    `description: ${description}`,
    '---',
    '',
    `# ${title}`,
    '',
    `Read and follow \`../../../.agents/skills/${skillName}/SKILL.md\` completely before acting.`,
    '',
  ].join('\n');
}

function createWorkbenchProjectAuthoringSkill(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const templateLabel = formatWorkbenchProjectTemplateLabel(templateId);
  return [
    '---',
    `name: ${WORKBENCH_PROJECT_AUTHORING_SKILL}`,
    'description: Use when editing a Workbench local project including pages, TSX source, CSS, Tailwind classes, token CSS, assets, routes, .workbench metadata, project AGENTS or CLAUDE guidance, and project-level editability or handoff issues.',
    '---',
    '',
    '# Workbench Project Authoring',
    '',
    '## Required Reading',
    '',
    'Read before non-trivial work:',
    '',
    '- `AGENTS.md`',
    `- \`${WORKBENCH_PROJECT_AGENT_GUIDE_FILE}\``,
    `- \`${WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE}\` when product intent, constraints, limitations, lessons, or improvement priorities affect the task`,
    `- \`${WORKBENCH_COMPONENT_AGENT_GUIDE_FILE}\` when touching components, CSF stories, sourceInsert metadata, or registry contracts`,
    '',
    `Template: ${templateLabel}.`,
    '',
    '## Hard Stops',
    '',
    '### Source Lifecycle Approval Gate',
    '',
    '- Treat this folder as the user-owned project root. Do not inspect, decompile, or rely on packaged Workbench app internals.',
    '- Do not add in-app AI prompt bars, AI API keys, or generation surfaces unless the user explicitly asks.',
    '- Do not treat placeholder UI as finished product progress.',
    '- Do not hand-edit `.workbench/components.json` or `.workbench/prop-registry.json` for component creation or ordinary component changes.',
    '- Keep TSX source, project CSS, token CSS, assets, notes, and `.workbench` sidecars consistent when a change crosses those boundaries.',
    '- Use only assets registered in `.workbench/assets.json`. Any asset created, copied, downloaded, or generated during an authorized task must be installed under the project public asset space and registered in the same change before source references it.',
    '- For design implementation, do not replace designer-editable repeated JSX with `.map(...)`, render callbacks, config objects, private helpers, or runtime islands merely to reduce code repetition.',
    '- Do not recreate an available registered semantic component with page-local markup. Inventory the project component library before coding and use the component whose role matches the design.',
    '- Do not create, promote, or extend a component contract from a broad page, catalog, redesign, editability, or cleanup request. Those mutations require explicit user approval for that exact component-authoring task.',
    '- Before creating a page/component path, inspect scoped Git status, target existence, imports, registries, and relevant Workbench history. If a name, route, or path points to a missing artifact, check repository history before treating it as a blank slot.',
    '- Never restore or reconstruct a deleted or missing page/component from Workbench history, Git history, a stash, backup, generated output, another branch, or another project unless the user explicitly requests restoration of that exact artifact. A new-page or redesign request is not restoration approval. If deletion versus accidental absence is ambiguous, stop before writing and ask.',
    '- Keep dependency direction one-way: pages import reusable components. Reusable components, barrels, and stories must not import or re-export implementation from `src/workbench-pages`.',
    '',
    '## Workflow',
    '',
    '1. Locate the owning source file before editing registry metadata.',
    '2. When source, rendered DOM, or a design artifact is supplied, inventory its structure, controls, repeated items, collections, menus, surfaces, assets, typography, and allowed deviations before writing page source.',
    '3. Search the registered project components by semantic role before coding. Prefer Slider for range/volume, Item for repeated media rows, Carousel for horizontal browsing, DropdownMenu or Popover for action menus, and Card for card surfaces when those components exist.',
    '4. Keep visible UI editable through explicit JSX, stable className strings, project CSS, tokens, and registered components. Repetition is acceptable when it preserves designer selection and editing.',
    '5. Use `.map(...)` only for an explicitly data-driven/read-only region with a verified backing-data writer. Treat `{Map expression}` in the Design canvas as a failed design implementation.',
    '6. Use runtime islands only for the smallest genuinely heavy runtime leaf; never for ordinary cards, lists, rows, controls, forms, navigation, galleries, or static visual composition.',
    '7. Preserve project-relative paths for CSS, assets, fonts, and icons.',
    '8. Before referencing a newly created or copied asset, add its project-file record to `.workbench/assets.json`; never leave asset registration as a later cleanup step.',
    '9. Before deleting or moving source, scan reverse imports, stories, barrel exports, and `.workbench` linkage fields so a page deletion cannot remove a component implementation.',
    '10. Report useful component-promotion candidates without implementing them. Include source location, reuse evidence, proposed semantic API, expected source/story/token impact, and approval-required status.',
    '11. Update docs or notes when the user-facing authoring contract changes.',
    '12. Run the narrowest project check available, usually `npm run check`, then verify in the Design canvas that semantic components appear as component instances with their Layers and Inspector props.',
    '13. When a durable product lesson changes, propose a public-safe update to the organizational context. Do not copy raw chats, personal memory, private incidents, secrets, customer data, or unreviewed speculation into it.',
    '',
  ].join('\n');
}

function createWorkbenchProjectComponentAuthoringSkill(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const templateLabel = formatWorkbenchProjectTemplateLabel(templateId);
  return [
    '---',
    `name: ${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}`,
    'description: Use when creating, editing, importing, or debugging components in a Workbench local project including component props, CSF stories, argTypes, sourceInsert metadata, local.css, .workbench components, prop registry metadata, Add child behavior, No story preview, 0 variants, missing Inspector props, or stale component imports.',
    '---',
    '',
    '# Workbench Project Component Authoring',
    '',
    '## Required Reading',
    '',
    '- `AGENTS.md`',
    `- \`${WORKBENCH_COMPONENT_AGENT_GUIDE_FILE}\``,
    `- \`${WORKBENCH_PROJECT_AGENT_GUIDE_FILE}\` for project-wide CSS, token, asset, and path rules`,
    '',
    `Template: ${templateLabel}.`,
    '',
    '## Hard Stops',
    '',
    '### Source Lifecycle Approval Gate',
    '',
    '- Do not create a new reusable/registered component, add its story-backed contract, or extend an existing component API unless the current user request explicitly authorizes that exact component work. Broad page, catalog, redesign, editability, or cleanup requests are not authorization. Name the proposed component and source/story/export/token impact, then wait for approval before writing.',
    '- Before creating a component path, inspect scoped Git status, target existence, imports, registry linkage, and relevant Workbench/repository history. Never restore or reconstruct a deleted or missing page/component from Workbench history, Git history, a stash, backup, generated output, another branch, or another project unless the user explicitly requests restoration of that exact artifact. If deletion versus accidental absence is ambiguous, stop before writing and ask.',
    '- Do not create or change components by manually editing `.workbench/components.json` or `.workbench/prop-registry.json` first.',
    '- Do not put Storybook control fields such as `control`, `assetId`, `extensions`, or picker-only metadata into component registry entries.',
    '- Do not bypass broken previews by deleting stories, hiding variants, or weakening the component contract.',
    '- Direct registry edits are allowed only for explicit repair or migration tasks after reading the current schema and preserving unrelated entries.',
    '- Do not use `.map(...)`, render callbacks, config-generated children, private page helpers, or runtime islands for ordinary designer-editable repeated UI. Explicit JSX is preferred over DRY when designers need per-item selection, reorder, deletion, or styling.',
    '- Do not create runtime islands for ordinary cards, lists, rows, controls, forms, navigation, galleries, or static visual composition. Islands are limited to the smallest genuinely heavy runtime leaf.',
    '- Do not let reusable components, component barrels, or stories import or re-export implementation from `src/workbench-pages`. Pages may import components; the reverse dependency is forbidden.',
    '- Before deleting or moving a page/component source file, scan reverse imports, matching stories, barrel exports, and `.workbench` linkage fields. Stop if the file owns a registered component implementation.',
    '',
    '## Component Contract Triage Gate',
    '',
    '- Prove the component contract before blaming Workbench app code: TSX props/defaults, `children`, exports, `className` merge behavior, matching stories, `argTypes`, `sourceInsert`, first/default story, registry linkage, CSS, and page usage must agree.',
    '- Keep the prop surface intentionally small. Add only props that a designer actually needs to understand and edit; do not expose implementation details, Tailwind/CSS longhands, or values already expressible through `className`, tokens, project CSS, or existing layout/style controls. A prop should represent a meaningful product/design choice and visibly affect the rendered component.',
    '- Respect the component kind before styling it. A `Button` needs real button/link semantics, label text, explicit leading/trailing icon slots, disabled/loading/focus behavior, semantic variants, size/shape controls, and a children contract that can accept added inline icons/images without breaking layout; child icons/images should default to `1em`.',
    '- For Figma-derived components, map Figma variants/properties into real props, stories, `sourceInsert`, CSS tokens, and child allowlists. Do not stop at a visually similar wrapper.',
    '- If Inspector props are missing, check whether the selected node is the registered component instance, a native element, a parsed child, a read-only dependency boundary, or stale registry metadata.',
    '',
    '## Component Workflow',
    '',
    '1. Update the component TSX, exports, CSS, and className merge behavior first.',
    '2. Update the matching `*.stories.tsx` contract: `args`, `argTypes`, `sourceInsert`, optional `designDefaultArgs`, and child imports.',
    '3. Audit reusable visual values. Add or reuse component tokens for component-owned colors, radii, spacing, dimensions, shadows, typography, and motion before leaving anonymous CSS values in the stylesheet.',
    '4. Update `.workbench/tokens.json` and generated token CSS together when new component tokens are introduced. Preserve the chain: component token -> semantic role token -> primitive raw token.',
    '5. Use standard controls such as `text`, `boolean`, `number`, `select`, and `icon` in story metadata.',
    '6. Reconcile `.workbench` metadata through Workbench import, re-import, or an explicit repair path after source, stories, and tokens agree.',
    '7. Verify Add child insertion, Story preview, Inspector props, and rendered preview behavior together.',
    '8. Inspect the Design canvas for `{Map expression}`, opaque runtime islands, and missing per-item layers. Any of those in ordinary design UI means the source shape is not done.',
    '',
  ].join('\n');
}

function createWorkbenchProjectPreviewRuntimeSkill(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const templateLabel = formatWorkbenchProjectTemplateLabel(templateId);
  return [
    '---',
    `name: ${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}`,
    'description: Use when debugging Workbench local project preview rendering, Vite dev server behavior, Story preview failures, Tailwind or local CSS loading, token CSS output, generated local.css comments, asset or icon URLs, fonts, overlays, portals, and browser-versus-Workbench preview mismatches.',
    '---',
    '',
    '# Workbench Project Preview Runtime',
    '',
    '## Required Reading',
    '',
    '- `AGENTS.md`',
    `- \`${WORKBENCH_PROJECT_AGENT_GUIDE_FILE}\``,
    `- \`${WORKBENCH_COMPONENT_AGENT_GUIDE_FILE}\` when the preview issue involves a component or story`,
    '',
    `Template: ${templateLabel}.`,
    '',
    '## Runtime Rules',
    '',
    '- Resolve CSS, asset, font, and icon paths relative to the project root.',
    '- Keep token CSS, project CSS, Tailwind CSS, and component CSS ownership explicit.',
    '- A `No story preview` or `0 variants` symptom is not a reason to delete stories or weaken metadata. Fix the source/story/runtime import contract.',
    '- Generated CSS comments must never contain raw `*/`; names such as `alias/*/disabled` need escaping before entering a CSS comment.',
    '- Portal and overlay content should render inside the preview stage when the component is being inspected.',
    '',
    '## Debug Workflow',
    '',
    '1. Identify the failing surface: page preview, component story preview, Add child thumbnail, or browser-only runtime.',
    '2. Check source import paths, export names, story module errors, and Vite project-root URLs.',
    '3. Check CSS order: token CSS, project CSS, component CSS, and Tailwind output.',
    '4. Check assets, icons, and fonts for project-relative URLs and registry/source agreement.',
    '5. Verify the visible preview and editable layer/Inspector contract after the render fix.',
    '',
  ].join('\n');
}

function createWorkbenchOrganizationalContextGuide() {
  return [
    '# Workbench Organizational Context',
    '',
    'Audience: public',
    'Status: curated',
    '',
    'This file is the project-owned, public-safe context that coding agents may use',
    'when reasoning about product intent, constraints, limitations, and future work.',
    'It is deliberately not a transcript, memory dump, incident log, or substitute',
    'for private internal documentation.',
    '',
    '## Disclosure policy',
    '',
    '- Include only reviewed statements that would be acceptable in a public repository, case study, or product document.',
    '- Generalize lessons so they explain the reusable principle without naming people, accounts, customers, unreleased partners, or private incidents.',
    '- Exclude secrets, credentials, security-sensitive implementation details, personal data, raw conversations, session logs, local machine paths, and private repository history.',
    '- Exclude speculation presented as fact. Mark uncertain material for human review outside this file.',
    '- Agents may propose edits, but a durable context change requires the same review as other public-facing product documentation.',
    '',
    '## Purpose and product principles',
    '',
    '- Keep the project\'s real frontend source editable, inspectable, and verifiable through Workbench.',
    '- Preserve an honest relationship between rendered output and the source, component, token, asset, or Binding boundary that owns it.',
    '',
    '## Decision rationale',
    '',
    '- Decision: Treat source-backed round-trip editing as the quality test. Rationale: a visual result alone does not prove that another person or agent can continue the work safely.',
    '',
    '## Known constraints',
    '',
    '- Project source, metadata, assets, and CSS paths must remain project-relative and portable.',
    '- Registered component behavior and editable props are defined by source plus the matching story authoring contract.',
    '',
    '## Known limitations',
    '',
    '- Some runtime-heavy or expression-backed regions may remain read-only and should expose an honest component, Binding, data, asset, or source boundary.',
    '',
    '## Lessons learned',
    '',
    '- Browser rendering is necessary but insufficient; representative Layers selection, Inspector ownership, source writeback, and reload behavior are part of verification.',
    '',
    '## Improvement priorities',
    '',
    '- Reduce gaps between valid React source and the structures that Workbench can parse, select, inspect, and write back safely.',
    '',
    '## Non-goals',
    '',
    '- Do not make private history or a specific person\'s AI account a required source of product knowledge.',
    '- Do not expose internal-sensitive detail merely to make agent context more complete.',
    '',
  ].join('\n');
}

function createWorkbenchProjectAgentGuide(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return [
    '# Workbench Project Guide',
    '',
    'This project is intended to be edited by Workbench plus external coding',
    'agents such as Codex Desktop or Claude Code. The goal is to produce real',
    'frontend source that stays editable in Workbench.',
    '',
    '## Project Boundary',
    '',
    '- Treat this folder as the project root and only edit files inside it unless the user explicitly asks otherwise.',
    '- The Workbench desktop app is a bridge and visual editor. Do not inspect or depend on its packaged source.',
    '- Project source, assets, notes, and `.workbench` registries are user-owned and may be shared with other agents.',
    '- Do not write secrets, API keys, credentials, or private tokens into project source or Workbench metadata.',
    `- Keep durable, externally shareable product knowledge in \`${WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE}\`; do not treat personal AI memory, raw conversations, session logs, or Git history as an automatically publishable knowledge source.`,
    '',
    '## Coding Agent Startup',
    '',
    'When a user asks Codex Desktop, Claude Code, or another coding agent to work on this project, the agent should treat the folder containing this file as the workspace root. Do not use the packaged Workbench app path, a Vite `@fs` URL, a localhost preview URL, or a single TSX file as the project boundary.',
    '',
    'A good initial user request looks like this:',
    '',
    '```text',
    'This folder is a Workbench project. First read AGENTS.md and docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md.',
    'Do not treat the guide as a one-time startup checklist; re-check it before changing structure, paths, component contracts, CSS/assets, registries, and before final handoff.',
    'Work only inside this project root unless I explicitly ask otherwise.',
    'Author TSX that remains selectable and editable in Workbench: explicit JSX structure, source-backed className, tokens, semantic props, and Binding-friendly data.',
    'Use a runtime island only for the smallest genuinely heavy leaf such as canvas/WebGL, a chart engine, geographic map engine, rich editor, or virtualized grid. Never hide ordinary designer-editable UI in an island.',
    'After changes, run the available checks and summarize changed files plus verification.',
    '```',
    '',
    '## Continuous Guide Loop',
    '',
    'Do not treat this guide as a one-time startup checklist. Keep it open as a working contract while editing.',
    '',
    '- Re-check this guide before changing page structure, component props, registry metadata, source paths, CSS/Tailwind/token paths, assets, imports, or preview/runtime boundaries.',
    '- Re-check `WORKBENCH-COMPONENT-AUTHORING.md` before creating or editing reusable components, stories, exports, control metadata, or component registry entries.',
    '- If an implementation starts drifting toward provider-heavy roots, opaque config objects, static inline styles, absolute paths, generated IDs, fake editability, or hidden runtime state, pause and compare against the relevant sections before continuing.',
    '- Before final handoff, scan the changed files against the guide: source remains Workbench-editable, paths are project-relative, registries match files, CSS/assets load from the project, and any read-only/runtime islands are honest boundaries.',
    '',
    'Prompt patterns that usually produce better Workbench output:',
    '',
    '- New screen first: ask for a page under `src/workbench-pages/`, matching `.workbench/pages.json`, explicit visible sections, class-backed styling, and realistic content.',
    '- Design system first: ask for tokens, token CSS, shared component CSS, component TSX, exports, story/control metadata, and `.workbench/components.json` together.',
    '- New component: ask the agent to read `WORKBENCH-COMPONENT-AUTHORING.md` and produce the full component file set, not only TSX.',
    '- Existing screen cleanup: ask the agent to reduce provider-heavy roots, render callbacks, opaque config objects, unsupported inline design styles, and unsafe runtime-mapped DOM in favor of editable JSX, props, Binding data, and runtime islands.',
    '',
    'When the user reports a Workbench problem, start with code review instead of guessing from the canvas alone. Inspect the relevant TSX, `.workbench` registries, CSS/Tailwind/token paths, import paths, component props, source diagnostics, and preview/runtime boundaries. Most editor, preview, import, or editability issues are caused by a mismatch between those source contracts.',
    '',
    'If a registered component cannot express what the user wants because it lacks props, do not silently extend its API during an ordinary page task. Use the narrowest honest page-level fallback that preserves editability, then report the proposed component extension for explicit user approval. Only an approved component-authoring task may change component source, stories, tokens, exports, or hydrated registry contracts.',
    '',
    '## Source Lifecycle Approval Gate',
    '',
    '- Before creating a page/component path, inspect scoped Git status, target existence, imports, registries, and relevant Workbench history. If a name, route, or path points to a missing artifact, check repository history before treating it as a blank slot.',
    '- A new reusable/registered component, its story-backed contract, or an extension of an existing component API requires explicit user authorization for that exact component work. Broad page, catalog, redesign, editability, cleanup, or "all components" requests are not authorization.',
    '- Never restore or reconstruct a deleted or missing page/component from Workbench history, Git history, a stash, backup, generated output, another branch, or another project unless the user explicitly requests restoration of that exact artifact. A new-page or redesign request is not restoration approval.',
    '- If deletion versus accidental absence is ambiguous, stop before writing and ask. Do not create provisional files, stories, routes, or registry entries while waiting.',
    '',
    '## Semantic Component Selection Gate',
    '',
    'Before writing page JSX, inventory every interactive control, repeated item, collection, menu, and surface in the design, then search the registered project components for the matching semantic role.',
    '',
    '- A volume or range control should use the registered `Slider`, not a styled bar or native range substitute.',
    '- Repeated media rows or track-board entries should use the registered `Item` family when available, while remaining explicit JSX when each entry must be editable.',
    '- Horizontal browsing should use the registered `Carousel`; overflow actions should use `DropdownMenu` or `Popover`; card surfaces should use `Card` when those roles exist in the project library.',
    '- If the matching component lacks a needed capability, use the narrowest honest page-level fallback and report an extension candidate. Do not change its source or story contract without explicit user approval.',
    '- If no matching component exists, keep the page editable with explicit native JSX. Report a promotion candidate only when repetition, cross-page reuse, interaction/accessibility behavior, or Inspector value justifies it.',
    '- A promotion-candidate report must include current source location, reuse evidence, proposed semantic API, expected source/story/token impact, and `approval required` status. Reporting is not authorization to implement it.',
    '- Final verification is not only visual: inspect the Design canvas Layers and Inspector and confirm these are real component instances with editable props and children.',
    '',
    '## Project Shape',
    '',
    'Workbench projects usually contain:',
    '',
    '```text',
    '.workbench/',
    '  workbench.config.json',
    '  pages.json',
    '  components.json',
    '  tokens.json',
    '  assets.json',
    '  notes.json',
    '  selection.json',
    '  workspace-state.json',
    '  history.json',
    'src/',
    '  workbench-pages/',
    '  workbench-tokens.css',
    '  components/ or libraries/local/',
    'public/workbench-assets/',
    '```',
    '',
    'Use project-relative paths in registries and source metadata. Keep `.workbench` files valid JSON with the current `schemaVersion`.',
    '',
    '### Portable Path Rules',
    '',
    '- Project metadata must survive being moved to another folder, another user account, another volume, or another machine.',
    '- Store source paths as project-relative values such as `src/workbench-pages/Home.tsx`, `src/components/Button.tsx`, or `src/workbench-tokens.css`.',
    '- Do not persist local machine paths such as `/Users/...`, `C:\\Users\\...`, mounted volume paths, Electron app bundle paths, Vite `@fs/...` paths, or localhost module URLs in `.workbench` metadata or source comments.',
    '- Do not make source, CSS, asset, or story metadata depend on the current Workbench app install location or hosted Workbench URL.',
    '- Relative imports that climb above the project root are invalid. Do not replace `../../outside` with a different in-project path just to make an import resolve.',
    '- Asset references for public project assets should use stable project URLs such as `/workbench-assets/...`, with file metadata pointing to project-relative files under `public/workbench-assets/`.',
    '',
    '## Project Template',
    '',
    `- This project was initialized with the ${formatWorkbenchProjectTemplateLabel(normalizedTemplateId)} setup.`,
    '- Project creation runs `npm install` automatically when the local host can reach npm. If installation fails, Workbench records `.workbench/dependency-install.json` and the project can still be opened.',
    '- Workbench does not separate General and Tailwind authoring modes. Tailwind utility classes and project-owned CSS classes are both valid `className` source.',
    ...(usesWorkbenchTailwindTemplate(normalizedTemplateId) ? [
      '- Workbench preview uses the generated CSS snapshot in this project plus the Workbench host runtime, so design editing should still work while dependencies install or when installation must be retried.',
      '- Developers can rerun `npm install` and regenerate Tailwind CSS when they turn this folder into a standalone app.',
    ] : []),
    ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? [
      '- Treat shadcn-style components as project-owned wrappers built on Base UI behavior primitives.',
      '- Keep the wrapper props and source imports as the editable contract; do not depend on third-party generated DOM as the design model.',
    ] : [
      '- This setup starts with Tailwind-compatible source and preview CSS. Use utility classes or project-owned CSS classes as the product needs.',
    ]),
    '- Keep authored pages concise and source-backed. Use local component islands for dependency-heavy widgets.',
    '',
    '## Workbench Editing Philosophy',
    '',
    'Workbench project source is a designer-editable screen model. It should be real React, but it is not the place to hide the visible UI behind final production architecture patterns when those patterns make the screen opaque to Workbench.',
    '',
    '- Optimize first for interpretation, selection, inspection, Binding, token editing, and source-backed undo/redo.',
    '- Keep visual hierarchy explicit in TSX with named sections, readable component boundaries, stable keys, and source-backed `className` values.',
    '- Use runtime islands or developer handoff for provider-heavy architecture, complex state machines, data fetching, virtualization, measurement, drag sensors, charts, maps, and rich editors.',
    '- Expose designer-editable values as semantic props, children, token-compatible strings, simple arrays, CSV/table props, or wrapper controls.',
    '- Do not create fake editability. If Workbench cannot safely round-trip a child node, keep that child read-only and explain the parent prop, Binding, data table, asset, or wrapper contract that should be edited instead.',
    '',
    '## Source Authoring Rules',
    '',
    '- Author real React/TSX source, not opaque generated blobs.',
    '- Keep page and component default exports parseable by Workbench.',
    '- Prefer clear JSX structure over clever dynamic expression trees when the UI should remain visually editable.',
    '- Use stable semantic component names and readable prop names.',
    '- Keep imports project-relative or package-based; avoid absolute local machine paths.',
    '- Keep component `sourceFile`, story `sourceFile`, `snapshotRoot`, local library paths, and sidecar note paths project-relative.',
    '- Preserve genuinely data-driven source when the user explicitly wants a data/binding contract. For design implementation, ordinary repeated cards, rows, controls, dividers, labels, and media must default to explicit JSX when designers should select, reorder, delete, or restyle each item. Do not introduce `.map(...)` merely for DRY; `{Map expression}` in the Design canvas is a failed result unless a verified backing-data writer owns the region.',
    '- Do not add temporary State or Breakpoint override systems in source unless the user explicitly asks. Workbench uses viewport sizing for preview; responsive behavior should live in real source classes, CSS, or component props.',
    '- When moving or renaming files, update Workbench registries and any sidecar notes that point at those files.',
    '',
    '## AI Code Generation Anti-Patterns',
    '',
    'Avoid code that renders in a browser but becomes opaque, brittle, or hard to edit in Workbench:',
    '',
    '- One giant page component with hundreds of anonymous `div` elements and no semantic sections, component boundaries, or readable labels.',
    '- Provider-heavy page roots where the visible layout is hidden behind router, auth, data-client, theme, sidebar, drag/drop, or measurement providers.',
    '- Important visible UI generated only inside render callbacks, nested helper functions, `useMemo` closures, template strings, `dangerouslySetInnerHTML`, or opaque config objects.',
    '- Static visual styling stored mostly in JSX inline `style={{ ... }}` objects, CSS-in-JS object maps, or runtime-calculated style props instead of `className`, project CSS, and tokens.',
    '- Tailwind or project CSS replaced by fallback inline dimensions because preview CSS is missing. Fix the CSS path or compiled CSS snapshot instead.',
    '- Random IDs, generated class names, time-based keys, array indexes as persistent identity, or remount-on-edit patterns that make selection and history unstable.',
    '- Hardcoded sample data buried inside chart/table internals when the user should edit rows, series, labels, colors, or CSV data from the Inspector.',
    '- Duplicated static JSX rows created from data just to make layers look selectable. Preserve data shape and expose editable data props instead.',
    '- Imports from absolute disk paths, Vite `@fs` URLs, `node_modules` internals, app bundle paths, or a specific localhost/Vercel deployment.',
    '- Selection, focus, or scroll fixes that add wrapper boxes, change layout geometry, or hide the real selectable element.',
    '- Fake editability where Inspector writes are routed to a fallback node or unrelated prop while the visible runtime output does not respond.',
    '',
    'Prefer Workbench-friendly code: semantic page sections, small local components, explicit props, stable keys, project-relative imports, `className` strings, token-backed CSS variables, simple editable arrays/CSV props, and runtime islands for dependency-heavy widgets.',
    '',
    '## Pages',
    '',
    '- Put Workbench-authored pages under `src/workbench-pages/` unless the project already has a stronger convention.',
    '- Source-first page creation is preferred: create a parseable TSX file under `src/workbench-pages/`, then reload Workbench so `.workbench/pages.json` can be reconciled automatically.',
    '- Hand-edit `.workbench/pages.json` only for rename, route/status migration, deletion cleanup, or recovery work.',
    '- Keep each page route, name, root node id, and `sourceFile` aligned with the actual project-relative TSX file.',
    '- Update `src/main.tsx` only when the standalone app should open a different page; Workbench page registration is controlled by the registry and source files.',
    '- Use realistic content when building a screen. Placeholder-only layouts are not complete work.',
    '- Keep the visible page shell source-visible with ordinary elements such as `aside`, `header`, `main`, and `section` when possible.',
    '- Avoid making the page root a provider-heavy app shell. Providers, routers, auth wrappers, and layout managers are weak visual editing boundaries; hide them inside local runtime islands only when they are truly runtime plumbing.',
    '- Put charts, maps, rich editors, virtualized tables, canvas/WebGL, and measurement-heavy widgets behind project-local component islands with semantic props.',
    '- Do not create a runtime island for ordinary lists, card grids, track rows, toolbars, forms, navigation, galleries, or static visual composition. Islands are only for the smallest genuinely heavy runtime leaf.',
    '',
    '## Components',
    '',
    '- Read `WORKBENCH-COMPONENT-AUTHORING.md` before adding or changing reusable components.',
    '- Components that should appear in Workbench need source, styles, exports, story/control metadata, and registry metadata.',
    '- Reusable implementation belongs under `src/components/` or the established library component root. Pages may import components. Components, barrels, and stories must never import or re-export their implementation from `src/workbench-pages/`; deleting a page must not remove component source.',
    '- Before moving or deleting a page/component file, scan reverse imports across `src`, matching stories, barrel exports, and `.workbench` linkage fields. Stop if the file owns a registered component implementation.',
    '- Source-first component registration is preferred: create component source, add a matching CSF story, export it from the library `index.ts`, and reload Workbench so `.workbench/components.json` can be hydrated.',
    '- For project-local libraries, use `src/libraries/<library-id>/components/` with `<library-id>.css`, component files, story files, and `index.ts` barrel exports.',
    '- Make the library discoverable through a page import, an existing component entry, or `.workbench/components.json` `extensions.libraries` metadata.',
    '- Hand-edit component registry entries only when hydration cannot run, and keep `sourceFile`, `importName`, `sourceExportName`, `storySourceFile`, `libraryId`, and `librarySnapshotRoot` aligned.',
    '- Keep component APIs semantic. Do not add one-off styling props only to match a single page.',
    '- Base UI primitives can be used for behavior, accessibility, focus, keyboard, or compound state when available. Keep the editable API in the Workbench-owned wrapper component.',
    '- Treat shadcn-style files as project source. Preserve wrapper props, `className`, `asChild`, data attributes, compound sub-components, and child structure instead of editing dependency DOM assumptions.',
    '- For structure-sensitive families such as Card, Table, Tabs, Accordion, Select, Dialog, Sheet, Drawer, Menu, and Sidebar, keep sub-components importable and registered consistently.',
    '',
    '## Styling And Tokens',
    '',
    '- Prefer `className` and CSS custom properties over static inline styles.',
    '- Mix Tailwind utility classes and project-owned CSS classes freely when it makes the source clearer.',
    '- Do not rewrite custom classes into Tailwind utilities, or Tailwind utilities into custom classes, unless the user asks for that refactor.',
    '- If a custom class should render outside Workbench preview, define it in project CSS instead of relying on Workbench host styles.',
    '- `.workbench/tokens.json` is the canonical token registry. `src/workbench-tokens.css` is generated project CSS and must stay in sync with the registry.',
    '- Keep Tailwind config paths project-relative in `.workbench/workbench.config.json`: `sourceCss`, `compiledCss`, and `tokenCss` should look like `src/index.css`, `src/workbench-tailwind.css`, or `src/workbench-tokens.css`.',
    '- Do not write Vite dev-server CSS URLs, `@fs` paths, app bundle paths, or copied absolute CSS paths into Tailwind config. Workbench may recover from older absolute paths, but new AI-authored work must not rely on recovery.',
    '- When Tailwind output differs between browser preview and Workbench preview, regenerate or resync the compiled CSS instead of switching the component to inline styles.',
    '- Add new reusable values as tokens before using them repeatedly. Component styles should usually consume component-token CSS variables, not primitive raw values directly.',
    '- Component-token registration is part of production component authoring. If a new visual component adds no component tokens, explicitly verify that every visual value is inherited, one-off runtime geometry, or already covered by an existing component token.',
    '- Starter/library token references should flow component token -> semantic role token -> primitive raw token.',
    '- Raw values are acceptable for one-off runtime geometry, measurements, or integration data, but leave the surrounding structure readable.',
    '- If Workbench suggestions do not list a valid Tailwind utility, the source class can still be correct. Prefer valid project source over forcing a weaker class from the picker.',
    '- Do not fix selection rings, focus outlines, or scroll clipping by adding layout-affecting wrapper boxes. Selection and QA overlays should not change page geometry.',
    '',
    '## Design Preview CSS',
    '',
    '- Workbench Design preview runs in an isolated iframe. It loads project CSS from configured Tailwind compiled CSS, `src/workbench-tokens.css`, `index.html` stylesheet links, project-local `.css` imports, and inferred library CSS.',
    '- Component CSS should be project-local and imported from the component source or library barrel, for example `import "./Button.css";` or `import "./local.css";`.',
    '- CSS files may `@import` other project-local CSS files. Keep these imports relative or project-root based.',
    '- Do not rely on bare package CSS imports such as `import "some-package/dist/style.css";` as the only design-preview styling path. Wrap or copy required package CSS into a project-owned stylesheet.',
    '- Keep CSS paths project-relative. Avoid absolute machine paths, Vite `@fs` paths, `file://` URLs, localhost stylesheet URLs, and paths into `node_modules`, `.workbench`, `dist`, or the Workbench app package.',
    '- For project-local libraries, Workbench can infer `<snapshotRoot>/components/<libraryId>.css`. With `snapshotRoot: "src"` and `libraryId: "local"`, that means `src/components/local.css`.',
    '',
    '## Data, Charts, And Tables',
    '',
    '- Keep editable chart data in explicit source props such as `dataCsv` and `seriesCsv` when the component contract supports them.',
    '- Treat chart series as table columns when possible: labels are editable inline, color chips belong near the series header, and row/column reorder should preserve the CSV data shape.',
    '- Changing a chart type must not overwrite authored CSV/data props or unrelated appearance props. Preserve unmanaged props unless the user explicitly requests a reset.',
    '- Use token-compatible values in data tables when a cell represents display text, label, or color that may need localization or design-token binding.',
    '- For heavy charting libraries such as Recharts, keep the dependency inside a local component island and expose a small semantic prop contract to the page.',
    '',
    '## Workbench Editing Behavior',
    '',
    '- Source-backed edits should flow through Workbench/source files, not through hidden runtime state.',
    '- Undo/redo should treat one intentional user action as one history entry. Batch table edits on Apply instead of committing every cell draft separately.',
    '- Do not remount or swap preview rendering modes just because part of a component is not editable. Prefer honest read-only selection or a runtime island boundary.',
    '- Red read-only selection means the node is visible but not source-editable through the current path; do not route edits to an unrelated fallback node.',
    '- Canvas multi-selection uses Shift for additive selection. Cmd/Ctrl should be treated as deep/smart selection, not duplicate additive selection.',
    '- Keep keyboard flows predictable: `I` inserts into the selected node when the Workbench surface owns focus, and Alt+Arrow moves source-backed layers when possible.',
    '',
    '## When Workbench Should Be Read-Only',
    '',
    'Some visible UI is intentionally selectable but not directly editable. Make that boundary clear instead of creating fake controls.',
    '',
    'Expected read-only or limited-edit cases:',
    '',
    '- Runtime island internals such as charts, maps, canvas/WebGL, virtualized tables, rich editors, and drag sensor DOM. Edit the island through semantic props, CSV/data props, or component controls instead.',
    '- Third-party primitive internals from Base UI, shadcn-style wrappers, Radix-like compound controls, and portal content. Workbench edits the project-owned wrapper API and slot structure, not dependency DOM.',
    '- Data-rendered rows from `.map(...)`, imported JSON, fetched data, or local arrays when Workbench cannot safely write the backing data shape. Show the binding or expose a table/CSV prop rather than duplicating JSX.',
    '- Text or styling produced by expressions, function calls, template strings, translation helpers, formatters, or computed class builders that cannot be safely round-tripped.',
    '- SVG paths, canvas drawings, background images, videos, iframes, and external embeds. Edit their source asset, props, or wrapper component, not arbitrary internal pixels or DOM.',
    '- Provider, router, auth, theme, data-client, and layout manager wrappers whose children are visible but whose own implementation is runtime plumbing.',
    '- Locked/generated files, dependency snapshots, package internals, or files outside the project root.',
    '',
    'If the user selects one of these nodes, prefer a read-only selection state, Binding/diagnostic explanation, or an editable parent/component prop. Do not silently switch rendering modes, remount the app, or redirect Inspector writes to a different visible node.',
    '',
    '## Assets',
    '',
    '- Store project-owned assets under `public/workbench-assets/`.',
    '- Use only assets registered in `.workbench/assets.json` for project media. Do not reference an unregistered file or arbitrary external asset URL from page/component source.',
    '- If an authorized task creates, copies, downloads, or generates an asset, register its project-file source, stable URL, kind, file name, MIME type, size, and useful tags in the same change before using it.',
    '- Registration is part of creating the asset, not a separate optional cleanup or promotion step.',
    '- Reference assets with stable project URLs such as `/workbench-assets/images/name.png`.',
    '- Do not assume assets from the Workbench app package are available to the project.',
    '- If icons or illustrations are project-owned, keep their source files in the project.',
    '- When importing a component library, keep copied files, CSS imports, registry paths, and asset references under the project root.',
    '',
    '## Notes And QA Handoff',
    '',
    '- Prefer source-adjacent notes such as `Home.workbench-notes.json` when a note belongs to one page or component.',
    '- Use notes to preserve visual QA requests, selected element context, expected behavior, and handoff decisions.',
    '- Keep notes concise and actionable for the next agent or human reviewer.',
    '',
    '## Verification',
    '',
    'Use the project scripts when available. Common checks are:',
    '',
    '```bash',
    'npm run check',
    'npm run build',
    '```',
    '',
    'If the project has no scripts, at least verify the changed files are syntactically valid and that Workbench can still load the project.',
    '',
    'For UI or component work, also open the page in Workbench and verify:',
    '',
    '- layer selection and canvas selection target the expected source nodes',
    '- Inspector edits update the visible component without remounting the app',
    '- undo/redo works for the edited source path',
    '- responsive preview sizes exercise real source responsiveness, not hidden Workbench override state',
    '',
    '## Product Direction',
    '',
    'Workbench is a visual editor for real frontend UI artifacts. It is not an',
    'in-app AI chat product. External agents can write source, and Workbench',
    'turns that source into an editable visual tree, preview, layers, inspector,',
    'and source-backed edits.',
    '',
  ].join('\n');
}

function createWorkbenchComponentAuthoringGuide(templateId = WORKBENCH_PROJECT_TEMPLATE_STANDARD) {
  const normalizedTemplateId = normalizeWorkbenchProjectTemplateId(templateId);
  return [
    '# Workbench Component Authoring Guide',
    '',
    'Use this guide whenever an agent creates or edits a source-backed component',
    'that should remain inspectable and editable in Workbench.',
    '',
    '## Source Lifecycle Approval Gate',
    '',
    '- Confirm that the current user request explicitly authorizes creation or extension of the exact component contract. Broad page, catalog, redesign, editability, cleanup, or "all components" requests do not authorize support components. Name the proposed component and source/story/export/token impact, then wait for approval before writing.',
    '- Inspect scoped Git status, target existence, imports, registry linkage, and relevant Workbench/repository history. Never restore or reconstruct a deleted or missing page/component from Workbench history, Git history, a stash, backup, generated output, another branch, or another project unless the user explicitly requests restoration of that exact artifact.',
    '- If deletion versus accidental absence is ambiguous, stop before writing and ask. Do not create provisional files, stories, exports, tokens, routes, or registry entries while waiting.',
    '',
    '## Core Contract',
    '',
    '- Follow the project template contract instead of copying legacy sample component names or sample CSS.',
    ...(normalizedTemplateId === WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE ? [
      '- For shadcn-style components, keep a project-owned wrapper API around Base UI primitives.',
      '- The wrapper source, stories, and prop registry are the Workbench editing contract.',
    ] : []),
    '- Components must remain valid React/TSX source.',
    '- Static visual styling should use classes and tokens, not static inline styles.',
    '- Story/control metadata should describe the same public props that users edit in Workbench.',
    '- All component metadata paths must be project-relative and portable. Do not write `/Users/...`, `C:\\Users\\...`, Vite `@fs/...`, localhost module URLs, or packaged Workbench app paths into `sourceFile`, `storySourceFile`, `snapshotRoot`, CSS path, or asset fields.',
    '- Reusable values belong in tokens before repeated use.',
    '- Component APIs should be semantic and durable.',
    '- Placeholder UI is not finished product work.',
    '',
    '## Continuous Guide Loop',
    '',
    'Do not read this guide once and then ignore it. Re-check it while authoring whenever the component contract changes.',
    '',
    '- Revisit this guide before changing public props, `children` shape, `className` handling, slot structure, story/control metadata, exports, registry entries, CSS imports, tokens, or asset paths.',
    '- Revisit the project guide before moving files, changing `.workbench` metadata, adding runtime islands, or deciding that part of the component should be read-only.',
    '- Before handoff, verify the component still has one honest editable contract: rendered behavior, props, stories, controls, registry metadata, CSS, tokens, and default insert markup all describe the same thing.',
    '',
    '## Workbench Editing Philosophy',
    '',
    'A Workbench component is a source-backed design contract. It can be used by a production app later, but its authored shape should first let a designer select the right boundary and edit the expected props, text, data, classes, tokens, and slots without guessing.',
    '',
    '- Keep the visible component contract shallow, named, and semantic.',
    '- Preserve `className`, `children`, labels, IDs, token-compatible props, and editable data props on the slot where edits should apply.',
    '- Use component islands for charts, maps, editors, virtualized grids, drag/drop, measurements, and dependency-heavy behavior; expose small semantic props around them.',
    '- Treat provider context, render callbacks, opaque config objects, and computed expressions as advanced source boundaries. They are valid React, but they should not be the default way to express editable visual UI.',
    '- In design implementation, local arrays and `.map(...)` are not the default for visible repeated UI. Use explicit JSX when designers need per-item selection, reorder, deletion, or styling. A map is allowed only for an explicitly data-driven/read-only region with a verified Binding writer for the backing shape.',
    '- If a production optimization would make the component opaque in Workbench, prefer the editable source shape and leave a clear developer handoff point.',
    '',
    '## Component Kind Contract',
    '',
    '- Respect the semantic kind of the component before styling it.',
    '- A `Button` is an interactive control, not just a rounded rectangle. It needs a real `button` element unless it is explicitly a navigation link, `type` defaulting to `button`, disabled/loading behavior, focus-visible styling, a stable accessible name, semantic variants, size/shape controls, and explicit leading/trailing icon slots.',
    '- Keep component props meaningful to designers. Ordinary spacing, sizing, color, border, layout, and typography tweaks should usually live in Tailwind utilities, project CSS, tokens, or `className`, not as one-off component props created from a technical reading of the design.',
    '- Button labels should be editable as text or `children`, and React children are part of Workbench extensibility. The component should tolerate added children gracefully while keeping the accessible name, control sizing, selection behavior, and intended button flow intact. If the design requires icons, support explicit icon props and inline child icons/images that default to `1em` so they follow the label size.',
    '- Treat recurring icons as asset-backed `Icon` components, not raw inline SVG path trees. The component should expose one asset `source` picker plus meaningful rendering/accessibility props such as `size`, `renderMode`, `decorative`, and `label`; do not duplicate identity through both `name` and `source`. Default inserted icons should omit `size`, use CSS/default `1em`, and follow the parent context; use `size` only as an explicit override for standalone or special cases. It should render as one glyph so Workbench layers stay at the designer-meaningful icon boundary.',
    "- Keep picker semantics explicit: `control: 'icon'` is the icon-name/glyph picker for the default icon set, while `picker: 'asset'` is the asset-source picker for URLs such as `Icon.source`, `img.src`, and media/SVG source fields. Do not classify every `.svg` as an icon; color SVG sets and illustration SVGs are image assets when the asset registry says `kind: image`.",
    '- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, and similar controls must preserve expected native or ARIA semantics, label relationship, controlled/uncontrolled state contract, keyboard behavior, and disabled/error/required states.',
    '- `Card`, `Dialog`, `Tabs`, `Accordion`, `Table`, and menu-like components need honest slot/compound structure. Do not flatten them into a single visual wrapper or expose fake children that the runtime component cannot own.',
    '- When importing from Figma, derive the component contract from the component role first, then map Figma variants/properties into props, stories, `sourceInsert`, CSS tokens, and child allowlists.',
    '',
    '## Recommended File Set',
    '',
    'A reusable component usually needs:',
    '',
    '- Component source, for example `ComponentName.tsx`.',
    '- Stylesheet or CSS module source.',
    '- Story or metadata source, for example `ComponentName.stories.tsx`.',
    '- Library export updates such as `index.ts`.',
    '- Token updates when new reusable visual values are introduced.',
    '',
    'Do not create only a TSX file when the component needs stories, exports, styles, or token updates to work in Workbench.',
    '',
    '- The canonical implementation must live in this component/library file set. A component entry or barrel must not re-export implementation from `src/workbench-pages/`.',
    '- Pages are deletable composition and may import reusable components; they are never the source-of-truth for a registered component.',
    '- Before deleting or moving a page/component file, scan reverse imports, matching stories, barrel exports, and `.workbench` linkage fields.',
    '',
    '## Source, CSS, And Story Paths',
    '',
    '- Keep component `sourceFile`, story files, local library exports, and source insert defaults under project-relative paths.',
    '- Workbench can rebase some stale absolute paths when they contain known project folders such as `src/`, but new source should never depend on that fallback.',
    '- Keep library CSS discoverable from the project registry. For the default local library, `snapshotRoot: "src"` plus `src/components/local.css` is the expected shape.',
    '- If a component imports CSS, use local imports such as `./local.css`, `../styles/card.css`, or `@/components/local.css`; do not import CSS from an absolute disk path.',
    '- Tailwind `sourceCss`, `compiledCss`, and `tokenCss` in `.workbench/workbench.config.json` must stay project-relative. Use compiled CSS snapshots for Workbench preview fidelity instead of writing inline styles to compensate for missing Tailwind output.',
    '',
    '## Workbench-Unfriendly Component Patterns',
    '',
    'Avoid component implementations that look polished but cannot be inspected or edited predictably:',
    '',
    '- Rendering all meaningful UI through a single `config` object, render prop, function-as-children API, or deeply nested helper function.',
    '- Swallowing `className`, `children`, text labels, IDs, or token-compatible props instead of applying them to the intended root or slot.',
    '- Making a component appear editable while internally ignoring the prop shown in story/control metadata.',
    '- Using generated IDs, random keys, array-index identity, or remounting wrappers as normal render behavior.',
    '- Hiding editable copy inside SVG paths, canvas drawings, background images, or `dangerouslySetInnerHTML` when real text nodes would work.',
    '- Encoding design variants only as raw CSS class soup without semantic props, story controls, or stable component tokens.',
    '- Treating dependency DOM from Base UI, shadcn-style primitives, charts, or drag libraries as the editable model instead of exposing a Workbench-owned wrapper contract.',
    '- Fixing preview failures by replacing real component source with unrelated fallback HTML. Use a runtime island or explicit read-only boundary instead.',
    '',
    '## Base UI And Behavior Primitives',
    '',
    'Base UI primitives are valid building blocks for Workbench source components. Prefer Base UI when it provides expected accessibility, keyboard behavior, focus management, portal behavior, or compound component state.',
    '',
    'Use Base UI through Workbench-owned wrapper components:',
    '',
    '- The wrapper component owns public props, styles, tokens, stories, source insert defaults, registry metadata, and child allowlists.',
    '- Workbench edits the wrapper contract, not Base UI internals or generated DOM.',
    '- Keep imports explicit, such as `@base-ui/react/tabs`, instead of replacing primitive behavior with unrelated native HTML just to simplify preview.',
    '- When Base UI has no matching primitive, implement a source-native wrapper with the same Workbench authoring standards.',
    '- Verify dependency-backed components in Workbench Design Editor and packaged Electron preview, not only in a standalone browser.',
    '',
    '## Compound Components And Slots',
    '',
    '- Keep compound component families represented as families, not disconnected leaf components.',
    '- Register sub-components and child allowlists for structure-sensitive roots such as Card, Table, Tabs, Accordion, Select, Dialog, Sheet, Drawer, DropdownMenu, Menubar, NavigationMenu, and Sidebar.',
    '- Keep children slots honest. Do not make a component appear editable by accepting arbitrary children if the runtime component requires a specific structure.',
    '- For inline components such as Button, Badge, and Label, keep text-flow children insertable without breaking accessible names. Use native semantic text with theme-backed Tailwind utilities when the component system does not provide a typography primitive.',
    '',
    '## Runtime Islands',
    '',
    '- Use a local runtime island for Recharts, maps, rich text/code editors, canvas/WebGL, virtualized tables, drag sensors, or other measurement-heavy packages.',
    '- Do not use an island to hide ordinary cards, lists, rows, controls, forms, navigation, media galleries, or static layout. Component abstraction is not permission to make designer-editable structure opaque.',
    '- Keep the page around the island source-visible and editable. The island should be a deliberate boundary with semantic props such as `data`, `variant`, `range`, or `compact`.',
    '- Do not set a heavy island to inline source hydration unless Workbench should truly parse its internals into the layer tree.',
    '- Give islands stable explicit sizing with classes such as `h-[320px] w-full` so preview layout and selection are deterministic.',
    '',
    '## Overlay And Portal Components',
    '',
    '- Dropdowns, selects, popovers, dialogs, sheets, drawers, tooltips, context menus, and hover cards must render floating content into the Workbench-safe portal container when previewed.',
    '- Keep standalone app behavior intact by falling back to the normal document body outside Workbench preview.',
    '- Avoid modal/focus settings that prevent preview selection unless the component truly needs modal behavior.',
    '',
    '## Inline Style Rules',
    '',
    'Avoid static inline styles:',
    '',
    '```tsx',
    '<div style={{ padding: "12px 16px", borderRadius: 12 }} />',
    '```',
    '',
    'Prefer Tailwind utilities, project-owned classes, and token-backed CSS:',
    '',
    '```tsx',
    '<div className="example-card" />',
    '```',
    '',
    '```css',
    '.example-card {',
    '  padding: var(--space-3) var(--space-4);',
    '  border-radius: var(--radius-md);',
    '}',
    '```',
    '',
    'Inline style is acceptable for CSS variable assignment from props, runtime geometry, measured drag state, canvas sizing, or third-party integration values.',
    '',
    '## Props And Controls',
    '',
    '- Public props should have clear names and practical defaults.',
    '- Use finite variants for size, tone, state, layout, or emphasis choices.',
    '- Use booleans for real binary behavior.',
    '- Use text props for copy, URLs, labels, and token-bindable string values.',
    '- Keep Storybook controls and Workbench inspector metadata aligned.',
    '- If a prop appears in a story/control surface, it must visibly affect the rendered component or be removed from the editable contract.',
    '- Preserve `className` and merge it into the intended root or slot. Do not swallow user-authored utility classes.',
    '- Prefer token-bindable string props for labels and display copy so localization and token picker workflows can use the same Inspector cells.',
    '',
    '## Chart And Data Component Props',
    '',
    '- Prefer explicit CSV-like props such as `dataCsv` and `seriesCsv` for chart cards that need Workbench table editing.',
    '- Keep series metadata and data values editable together when the component uses both.',
    '- When adding a chart type conversion path, preserve authored `dataCsv`, `seriesCsv`, labels, colors, and unmanaged appearance props unless the user chooses a reset.',
    '- Series colors should accept token-compatible color values and render through the same props that the Inspector edits.',
    '- Do not bake sample chart data into the runtime if the source prop is meant to be edited by Workbench.',
    '',
    '## Tokens',
    '',
    'Tokenize reusable colors, spacing, radius, border width, shadow, typography, dimensions, motion, and z-index values.',
    '',
    'When a value belongs to one component, add it as a component token instead of a generic global token. Use the component name in the token name, update `.workbench/tokens.json`, and keep `src/workbench-tokens.css` in sync when token CSS is checked in.',
    '',
    'Use semantic token names such as:',
    '',
    '- `badge-height-sm`',
    '- `card-gap-horizontal`',
    '- `media-frame-radius`',
    '- `surface-accent-subtle`',
    '',
    'Avoid anonymous names such as `pink-1`, `new-gap`, or `12px`.',
    '',
    '## Workbench Registration',
    '',
    'The bundled starter Button, Card, and Input are registered by default so a new project can test component insertion and inspection immediately. When adding more source components that should be tested the same way:',
    '',
    '- Export the component from its source file and the local library `index.ts` when the project uses one.',
    '- Import project-local component CSS from the component file or the library `index.ts`, for example `import "./local.css";`.',
    '- For project-local libraries, keep the inferred CSS path aligned with registry metadata: `<snapshotRoot>/components/<libraryId>.css`.',
    '- Do not depend on bare package CSS imports as the only styling path for Design preview. Wrap or copy required external CSS into a project-owned stylesheet.',
    '- Add story/control metadata for the same public props users should edit in Workbench.',
    '- Register or reconcile the component in `.workbench/components.json`; prefer the Workbench import/re-import flow over hand-editing when available.',
    '- Keep source path, export name, story name, `libraryId`, `snapshotRoot`, and CSS path aligned.',
    '- Reload the project after registry changes so Workbench reads the updated `components.json`.',
    '',
    'For project-local libraries, Workbench loads preview CSS from `<snapshotRoot>/components/<libraryId>.css`. The common default is `snapshotRoot: "src"` and `src/components/local.css` for the `local` library.',
    '',
    '## Source Component Checklist',
    '',
    '- TSX, styles, and tokens are aligned.',
    '- Component-scoped reusable values are component tokens, not anonymous raw CSS values.',
    '- The component has realistic defaults and remains parseable by Workbench.',
    '- Props, story controls, source insert defaults, and rendered behavior describe one contract.',
    '- `className` and token-bound values survive Inspector edits and chart/type conversion actions.',
    '- Project sidecar notes are updated when paths, names, or component contracts change.',
    '- For components that should be tested in Workbench, add exports, story/control metadata, registry entries, and reload the project.',
    '',
    '## Motion',
    '',
    '- Animate both entering and leaving states.',
    '- Define the animated property in resting and active states.',
    '- Transition the exact property that changes.',
    '- Respect reduced-motion needs for large movement or long durations.',
    '',
    '## Workbench Editability',
    '',
    '- Prefer explicit JSX nodes for structure the user should select or edit.',
    '- Keep repeated dynamic lists simple and predictable.',
    '- Keep prop-driven variants discoverable through story/control metadata.',
    '- Do not hide important editable content in unparseable string templates.',
    '- Read-only/runtime-only internals are acceptable when the component boundary is clear. Do not fake editability by routing edits to unrelated fallback nodes.',
    '- Expected read-only cases include runtime island internals, third-party primitive DOM, generated data rows without a safe backing-data writer, computed expressions, SVG/canvas/media/embed internals, provider/runtime plumbing, generated files, package internals, and files outside the project root.',
    '- When a child is read-only, expose an editable parent prop, slot, token, table/CSV data surface, source binding diagnostic, or wrapper-level control rather than pretending the child DOM is directly editable.',
    '- Selection overlays must not change component layout, scroll size, or runtime behavior.',
    '',
  ].join('\n');
}

function createWorkbenchSampleReadme() {
  return [
    '# Workbench Project Samples',
    '',
    'Use these files as implementation references when creating or editing',
    'project components, styles, and token-backed UI.',
    '',
    '## How To Use',
    '',
    '- Read `styles/sample-tokens.css` for token naming and CSS variable patterns.',
    '- Read `styles/sample-component.css` for class-based component styling.',
    '- Read `components/SampleButton.tsx` for a small semantic component API.',
    '- Read `components/SampleCard.tsx` for a composed component with slots and actions.',
    '- Do not register or ship these sample components as production UI unless the user explicitly asks.',
    '',
    '## Production Component Checklist',
    '',
    '- Create production components under the project source convention, usually `src/components/` or `src/libraries/local/`.',
    '- Add component-scoped tokens to `.workbench/tokens.json` and keep `src/workbench-tokens.css` aligned when token CSS is checked in.',
    '- Confirm component CSS consumes the component-token variables it registers; do not leave reusable visual values only as local CSS numbers.',
    '- Keep components usable as normal project source and add Workbench registry metadata when the component should be tested in the editor.',
    '- Add exports, story/control metadata, and `.workbench/components.json` entries for testable Workbench components.',
    '- Keep the project library CSS path aligned with `components.json`; for the default local library this is usually `src/components/local.css` with `snapshotRoot: "src"`.',
    '- Reload the project after registry changes.',
    '',
    '## Expectations',
    '',
    '- Prefer semantic props and finite variants.',
    '- Prefer classes and CSS custom properties over static inline styles.',
    '- Keep names readable for Workbench layers, inspector controls, and future agents.',
    '- Update Workbench registries and sidecar notes when production pages or components change.',
    '',
  ].join('\n');
}

function createWorkbenchSampleTokenCss() {
  return [
    '/* Reference only. Production tokens belong in .workbench/tokens.json and src/workbench-tokens.css. */',
    '',
    ':root {',
    '  --sample-color-surface: #ffffff;',
    '  --sample-color-surface-muted: #f6f7f9;',
    '  --sample-color-text: #17202a;',
    '  --sample-color-text-muted: #5d6875;',
    '  --sample-color-accent: #2563eb;',
    '  --sample-color-accent-strong: #1d4ed8;',
    '  --sample-color-border: #d9dee7;',
    '  --sample-space-1: 4px;',
    '  --sample-space-2: 8px;',
    '  --sample-space-3: 12px;',
    '  --sample-space-4: 16px;',
    '  --sample-space-6: 24px;',
    '  --sample-radius-sm: 4px;',
    '  --sample-radius-md: 8px;',
    '  --sample-shadow-card: 0 12px 32px rgba(23, 32, 42, 0.12);',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchSampleComponentCss() {
  return [
    '@import "./sample-tokens.css";',
    '',
    '.sample-button {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  min-height: 36px;',
    '  gap: var(--sample-space-2);',
    '  padding: 0 var(--sample-space-4);',
    '  border: 1px solid transparent;',
    '  border-radius: var(--sample-radius-sm);',
    '  font: inherit;',
    '  font-weight: 600;',
    '  cursor: pointer;',
    '}',
    '',
    '.sample-button--primary {',
    '  color: #ffffff;',
    '  background: var(--sample-color-accent);',
    '}',
    '',
    '.sample-button--primary:hover {',
    '  background: var(--sample-color-accent-strong);',
    '}',
    '',
    '.sample-button--secondary {',
    '  color: var(--sample-color-text);',
    '  background: var(--sample-color-surface);',
    '  border-color: var(--sample-color-border);',
    '}',
    '',
    '.sample-card {',
    '  display: grid;',
    '  gap: var(--sample-space-4);',
    '  max-width: 420px;',
    '  padding: var(--sample-space-6);',
    '  color: var(--sample-color-text);',
    '  background: var(--sample-color-surface);',
    '  border: 1px solid var(--sample-color-border);',
    '  border-radius: var(--sample-radius-md);',
    '  box-shadow: var(--sample-shadow-card);',
    '}',
    '',
    '.sample-card__eyebrow {',
    '  margin: 0;',
    '  color: var(--sample-color-accent);',
    '  font-size: 12px;',
    '  font-weight: 700;',
    '  text-transform: uppercase;',
    '}',
    '',
    '.sample-card__title {',
    '  margin: 0;',
    '  font-size: 22px;',
    '  line-height: 1.2;',
    '}',
    '',
    '.sample-card__body {',
    '  margin: 0;',
    '  color: var(--sample-color-text-muted);',
    '  line-height: 1.55;',
    '}',
    '',
    '.sample-card__actions {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: var(--sample-space-2);',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchSampleButtonSource() {
  return [
    "import '../styles/sample-component.css';",
    '',
    'type SampleButtonTone = "primary" | "secondary";',
    '',
    'export type SampleButtonProps = {',
    '  label: string;',
    '  tone?: SampleButtonTone;',
    '  disabled?: boolean;',
    '  onClick?: () => void;',
    '};',
    '',
    'export function SampleButton({',
    '  label,',
    '  tone = "primary",',
    '  disabled = false,',
    '  onClick,',
    '}: SampleButtonProps) {',
    '  return (',
    '    <button',
    '      className={`sample-button sample-button--${tone}`}',
    '      type="button"',
    '      disabled={disabled}',
    '      onClick={onClick}',
    '    >',
    '      {label}',
    '    </button>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function createWorkbenchSampleCardSource() {
  return [
    "import '../styles/sample-component.css';",
    "import { SampleButton } from './SampleButton';",
    '',
    'export type SampleCardProps = {',
    '  eyebrow?: string;',
    '  title: string;',
    '  body: string;',
    '  primaryActionLabel?: string;',
    '  secondaryActionLabel?: string;',
    '};',
    '',
    'export function SampleCard({',
    '  eyebrow = "Reference pattern",',
    '  title,',
    '  body,',
    '  primaryActionLabel = "Continue",',
    '  secondaryActionLabel = "Details",',
    '}: SampleCardProps) {',
    '  return (',
    '    <article className="sample-card">',
    '      <div>',
    '        <p className="sample-card__eyebrow">{eyebrow}</p>',
    '        <h2 className="sample-card__title">{title}</h2>',
    '      </div>',
    '      <p className="sample-card__body">{body}</p>',
    '      <div className="sample-card__actions">',
    '        <SampleButton label={primaryActionLabel} />',
    '        <SampleButton label={secondaryActionLabel} tone="secondary" />',
    '      </div>',
    '    </article>',
    '  );',
    '}',
    '',
  ].join('\n');
}
