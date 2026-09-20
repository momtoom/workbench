import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import {
  WORKBENCH_AGENT_SKILLS_DIR,
  WORKBENCH_PROJECT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
  createInitialComponentRegistry,
  createWorkbenchProjectFiles,
  createWorkbenchProjectGuideFiles,
  createWorkbenchProjectSourceFiles,
} from './workbench-template.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const traverse = traverseModule.default ?? traverseModule;

checkStarterRegistry();
checkGeneratedProjectFiles();
checkAstryxStarterAssetProvenance();
checkShadcnStarterFixtureParity();
checkShadcnBaseThemeBackedStyling();
checkProjectTemplateInstallFreeContracts();
checkBaseUiBackedStarterComponents();
checkStarterStories();
checkShadcnBasePrimaryStoryArgContracts();
checkShadcnBaseSourceInsertJsxProps();
checkShadcnBaseSourceInsertImportCoverage();
checkShadcnBaseSourceInsertPropValueTypes();
checkShadcnBaseAspectRatioContract();
checkShadcnBaseSourceInsertSelectableValueContracts();
checkShadcnBaseRootSourceInsertChildAllowlists();
checkSourceSlotAllowlistRegistryCoverage();
checkAllowlistPickerFiltering();
checkSourceTreePreviewPortalSelectionPerformance();
checkCsfStoryVisibilityHydration();
checkElectronPreviewVendorRuntime();

console.log('Workbench starter component checks passed.');

function checkShadcnStarterFixtureParity() {
  const starterRoot = path.join(root, 'scripts/workbench-starter/shadcn-base');
  const fixtureRoot = path.join(root, 'projects/SHADCN-002');
  if (!existsSync(fixtureRoot)) {
    console.log('Skipping shadcn-base fixture parity: projects/SHADCN-002 is not in this checkout.');
    return;
  }
  const componentRelativeDir = 'src/components/ui';
  const starterComponentDir = path.join(starterRoot, componentRelativeDir);
  const fixtureComponentDir = path.join(fixtureRoot, componentRelativeDir);
  const starterComponentFiles = readdirSync(starterComponentDir).sort();
  const fixtureComponentFiles = readdirSync(fixtureComponentDir).sort();

  assert(
    JSON.stringify(starterComponentFiles) === JSON.stringify(fixtureComponentFiles),
    'shadcn-base starter and SHADCN-002 should expose the same component and story files',
  );

  for (const fileName of starterComponentFiles) {
    assert(
      readFileSync(path.join(starterComponentDir, fileName), 'utf8') ===
        readFileSync(path.join(fixtureComponentDir, fileName), 'utf8'),
      `shadcn-base starter component fixture drifted from SHADCN-002: ${fileName}`,
    );
  }

  for (const pageFileName of ['ComponentsCatalog.tsx', 'SaasDashboard.tsx']) {
    const relativePath = path.join('src/workbench-pages', pageFileName);
    assert(
      readFileSync(path.join(starterRoot, relativePath), 'utf8') ===
        readFileSync(path.join(fixtureRoot, relativePath), 'utf8'),
      `shadcn-base starter page fixture drifted from SHADCN-002: ${pageFileName}`,
    );
  }
}

function checkAstryxStarterAssetProvenance() {
  const astryxStarterRoot = path.join(root, 'scripts/workbench-starter/astryx');
  const auditedSources = [
    '.workbench/assets.json',
    'src/workbench-pages/SamplePage/MusicSample.tsx',
    'src/workbench-pages/SamplePage/CompGallery.tsx',
  ].map((relativePath) => readFileSync(path.join(astryxStarterRoot, relativePath), 'utf8')).join('\n');

  assert(
    !/(?:i\.pinimg\.com|night-drive\.jpg|late-night-glow\.jpg|road-warmers\.jpg)/i.test(auditedSources),
    'Astryx starter should use only the bundled generated album artwork',
  );

  // Provenance is about where the pixels come from, not which host served them.
  // Match on the image-bearing prop so a CDN URL without a file extension —
  // the shape that let Unsplash and lookaside links back in — is caught too.
  const externalImageProps = new Set(
    collectAstryxStarterImageProps(astryxStarterRoot)
      .filter((reference) => /^["']https?:\/\//i.test(reference.split('=')[1] ?? '')),
  );
  assert(
    externalImageProps.size === 0,
    `Astryx starter image props must reference registered project assets: ${[...externalImageProps].join(', ')}`,
  );

  for (const removedFileName of ['night-drive.jpg', 'late-night-glow.jpg', 'road-warmers.jpg']) {
    assert(
      !existsSync(path.join(astryxStarterRoot, 'public/workbench-assets/images/album-samples', removedFileName)),
      `Astryx starter should not package Pinterest-sourced artwork: ${removedFileName}`,
    );
  }
}

function collectAstryxStarterImageProps(starterRoot) {
  const imagePropPattern = /\b(?:src|logoSrc|symbolSrc|fallbackSrc|imageSrc|avatarImage|posterSrc|thumbnailSrc)\s*[=:]\s*["'][^"']*["']/g;
  const references = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
      const contents = readFileSync(entryPath, 'utf8');
      for (const match of contents.match(imagePropPattern) ?? []) {
        references.push(match.replace(/\s*[=:]\s*/, '='));
      }
    }
  };
  walk(path.join(starterRoot, 'src'));
  return references;
}

function checkShadcnBaseThemeBackedStyling() {
  const componentDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const officialInstallableComponents = [
    'accordion', 'alert', 'alert-dialog', 'aspect-ratio', 'attachment', 'avatar',
    'badge', 'breadcrumb', 'bubble', 'button', 'button-group', 'calendar', 'card',
    'carousel', 'chart', 'checkbox', 'collapsible', 'combobox', 'command',
    'context-menu', 'date-picker', 'dialog', 'direction', 'drawer', 'dropdown-menu',
    'empty', 'field', 'hover-card', 'icon', 'input', 'input-group', 'input-otp', 'item',
    'kbd', 'label', 'marker', 'menubar', 'message', 'message-scroller', 'native-select',
    'navigation-menu', 'pagination', 'popover', 'progress', 'radio-group', 'resizable',
    'scroll-area', 'select', 'separator', 'sheet', 'sidebar', 'skeleton', 'slider',
    'spinner', 'switch', 'table', 'tabs', 'textarea', 'theme', 'toast', 'toggle',
    'toggle-group', 'tooltip',
  ];
  const componentFiles = new Set(readdirSync(componentDir));
  for (const componentName of officialInstallableComponents) {
    assert(
      componentFiles.has(`${componentName}.tsx`) &&
        componentFiles.has(`${componentName}.stories.tsx`),
      `official shadcn Base UI component should include source and Workbench story contracts: ${componentName}`,
    );
  }
  const componentSources = readdirSync(componentDir)
    .filter((fileName) => fileName.endsWith('.tsx') && !fileName.endsWith('.stories.tsx') && fileName !== 'chart.tsx')
    .map((fileName) => `${fileName}\n${readFileSync(path.join(componentDir, fileName), 'utf8')}`)
    .join('\n');

  assert(
    !/text-\[(?:\d|\.)/.test(componentSources),
    'shadcn-base components should use Tailwind theme typography utilities instead of raw arbitrary font sizes',
  );
  assert(
    !/(?:oklch|rgba?|hsla?)\(/.test(componentSources),
    'shadcn-base component TSX should use Tailwind theme colors instead of raw color functions',
  );

  const switchSource = readFileSync(path.join(componentDir, 'switch.tsx'), 'utf8');
  for (const expectedThemeReference of [
    '--ds-token-workbench-components-switch-track-width',
    '--ds-token-workbench-components-switch-track-height',
    '--ds-token-workbench-components-switch-thumb-size',
    'calc(var(--spacing)*6)',
  ]) {
    assert(
      switchSource.includes(expectedThemeReference),
      `shadcn-base Switch should use theme-backed sizing: ${expectedThemeReference}`,
    );
  }
  assert(
    !/--wb-switch-(?:track-width|track-height|thumb-size):\d/.test(switchSource),
    'shadcn-base Switch should not replace Workbench theme sizing with raw numeric variables',
  );
  const directionSource = readFileSync(path.join(componentDir, 'direction.tsx'), 'utf8');
  assert(
    directionSource.includes('<BaseDirectionProvider direction={direction}>') &&
      directionSource.includes('data-slot="direction-provider"') &&
      directionSource.includes('dir={direction}') &&
      directionSource.includes('{...props}'),
    'shadcn-base DirectionProvider should expose a selectable DOM root whose native direction follows the Inspector prop',
  );
  const toggleSource = readFileSync(path.join(componentDir, 'toggle.tsx'), 'utf8');
  for (const selectedHoverClass of [
    'aria-pressed:hover:bg-primary',
    'aria-pressed:hover:text-primary-foreground',
    'data-pressed:hover:bg-primary',
    'data-pressed:hover:text-primary-foreground',
    'data-[state=on]:hover:bg-primary',
    'data-[state=on]:hover:text-primary-foreground',
  ]) {
    assert(
      toggleSource.includes(selectedHoverClass),
      `shadcn-base Toggle should preserve selected colors on hover: ${selectedHoverClass}`,
    );
  }
  assert(
    toggleSource.includes('data-icon-only:p-0!') &&
      toggleSource.includes('data-icon-only={isToggleIconOnlyChildren(children) ? "" : undefined}') &&
      toggleSource.includes('childArray.length === 1 && isWorkbenchElementOfType(childArray[0], Icon, "Icon")'),
    'shadcn-base Toggle should keep icon-only controls centered with symmetric padding',
  );
  const toggleGroupSource = readFileSync(path.join(componentDir, 'toggle-group.tsx'), 'utf8');
  assert(
    toggleGroupSource.includes('data-icon-only={isToggleGroupIconOnlyChildren(children) ? "" : undefined}') &&
      toggleGroupSource.includes('childArray.length === 1 && isWorkbenchElementOfType(childArray[0], Icon, "Icon")'),
    'shadcn-base ToggleGroupItem should use the Toggle icon-only centering contract',
  );
  const separatorSource = readFileSync(path.join(componentDir, 'separator.tsx'), 'utf8');
  assert(
    separatorSource.includes('data-vertical:my-auto') &&
      separatorSource.includes('data-vertical:self-stretch'),
    'shadcn-base vertical Separator should center an explicit height while stretching when height is automatic',
  );
  const comboboxSource = readFileSync(path.join(componentDir, 'combobox.tsx'), 'utf8');
  assert(
    comboboxSource.includes('overscroll-contain p-1"') &&
      !comboboxSource.includes('data-empty:p-0'),
    'shadcn-base ComboboxList should retain its item inset when grouped Base UI options mark the list data-empty',
  );
  assert(
    comboboxSource.includes('w-full min-w-0 cursor-default') &&
      comboboxSource.includes('overflow-hidden rounded-md') &&
      comboboxSource.includes('<span className="min-w-0 flex-1 truncate">{children}</span>'),
    'shadcn-base Combobox items should truncate long option labels inside the popup width',
  );
  const calendarSource = readFileSync(path.join(componentDir, 'calendar.tsx'), 'utf8');
  assert(
    calendarSource.includes('after:w-4 after:bg-muted') &&
      calendarSource.includes('data-[range-middle=true]:bg-muted') &&
      calendarSource.includes('[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)') &&
      calendarSource.includes('[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)') &&
      !calendarSource.includes('after:w-1/2 after:bg-muted') &&
      !calendarSource.includes('data-[range-middle=true]:bg-transparent'),
    'shadcn-base Calendar should follow the official base range styling: button-painted band with week-edge rounding',
  );
  const messageScrollerSource = readFileSync(path.join(componentDir, 'message-scroller.tsx'), 'utf8');
  const messageScrollerCss = readFileSync(path.join(componentDir, 'message-scroller.css'), 'utf8');
  const messageScrollerStory = readFileSync(path.join(componentDir, 'message-scroller.stories.tsx'), 'utf8');
  assert(
    messageScrollerSource.includes('className={cn("min-w-0 shrink-0", className)}') &&
      messageScrollerSource.includes('data-animation={animation === "none" ? undefined : animation}') &&
      messageScrollerSource.includes('element.scrollHeight - element.scrollTop - element.clientHeight') &&
      messageScrollerSource.includes('viewportElement.ownerDocument.defaultView') &&
      messageScrollerSource.includes('data-active={active ? "true" : "false"}') &&
      messageScrollerSource.includes('import { RiArrowDownLine } from "@remixicon/react"') &&
      messageScrollerSource.includes('<RiArrowDownLine />') &&
      messageScrollerSource.includes('absolute z-20 inset-s-1/2') &&
      messageScrollerSource.includes('rounded-full border-border bg-background') &&
      messageScrollerSource.includes('dark:bg-background') &&
      !messageScrollerSource.includes('content-visibility:auto') &&
      !messageScrollerSource.includes('contain-intrinsic-size'),
    'shadcn-base MessageScroller should use stable native scroll metrics and the iframe owner realm in the editable Design preview',
  );
  assert(
    messageScrollerCss.includes('[data-animation="spring-bounce"]') &&
      messageScrollerCss.includes('[data-animation="blur-fade"]') &&
      messageScrollerCss.includes('@media (prefers-reduced-motion: reduce)') &&
      messageScrollerStory.includes("const ANIMATIONS = ['none', 'fade', 'slide-up', 'slide-side', 'pop', 'spring-bounce', 'blur-fade', 'scale-fade'] as const;") &&
      messageScrollerStory.includes("animation: { control: 'select', options: ANIMATIONS }") &&
      messageScrollerStory.includes("animation: 'fade'") &&
    messageScrollerStory.includes("defaultScrollPosition: 'last-anchor'") &&
      messageScrollerStory.includes('export const AnchoredTurns = {') &&
      messageScrollerStory.includes('export const LiveEdge = {') &&
      messageScrollerStory.includes('export const GroupHandoff = {') &&
      messageScrollerStory.includes('<MessageScrollerItem messageId="follow-up" scrollAnchor>') &&
      messageScrollerStory.includes('<MessageScrollerContent aria-busy className="gap-5 pb-8">'),
    'shadcn-base MessageScroller stories should expose item animation presets and cover saved anchors, live-edge streaming, and group handoffs with stable message ids',
  );
  const sidebarSource = readFileSync(path.join(componentDir, 'sidebar.tsx'), 'utf8');
  assert(
    sidebarSource.includes('sidebar-collapsed-item-size-lg') &&
      !sidebarSource.includes('sidebar-brand-size-lg') &&
      sidebarSource.includes('mx-2 w-auto! bg-sidebar-border') &&
      sidebarSource.includes('data-slot="sidebar-footer"\n      data-sidebar="footer"\n      className={cn("flex flex-col gap-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2"'),
    'shadcn-base Sidebar branding, separator, and collapsed footer should fit the rail with even padding',
  );
  const inputSource = readFileSync(path.join(componentDir, 'input.tsx'), 'utf8');
  assert(
    inputSource.includes('file:h-6') &&
      !inputSource.includes('leading-[calc(var(--ds-token-workbench-components-input-height'),
    'shadcn-base file Input should use the standard inline file control metrics without a synthetic full-height line box',
  );
  for (const dialogFileName of ['dialog.tsx', 'alert-dialog.tsx']) {
    const dialogSource = readFileSync(path.join(componentDir, dialogFileName), 'utf8');
    assert(
      dialogSource.includes('"[&>*]:min-w-20"') &&
        !dialogSource.includes('[&>*]:flex-1'),
      `shadcn-base ${dialogFileName} footer actions should share compact minimum widths instead of stretching`,
    );
  }
}

function checkStarterRegistry() {
  const registry = createInitialComponentRegistry({
    createdAt: '2026-01-01T00:00:00.000Z',
    templateId: 'shadcn-base',
  });
  const components = Array.isArray(registry.components) ? registry.components : [];
  const byImportName = new Map(components.map((component) => [component.extensions?.importName, component]));
  assert(
    !byImportName.has('Text') && !byImportName.has('Stack'),
    'shadcn-base registry should not include custom Text or Stack primitives',
  );
  assert(
    byImportName.get('TableCaption')?.name === 'TableCaption',
    'shadcn-base registry should use the story name instead of nested argTypes labels',
  );
  const projectLocalLibrariesSource = read('src/domain/project/workbenchProjectLocalLibraries.ts');
  assert(
    projectLocalLibrariesSource.includes('const storyName = getTopLevelCsfStoryName(body);') &&
      projectLocalLibrariesSource.includes('property.indent === topLevelIndent'),
    'project component hydration should ignore nested story control name labels',
  );
  const structuralComponents = [
    'AlertTitle',
    'AlertDescription',
    'AccordionItem',
    'AccordionTrigger',
    'AccordionContent',
    'CardHeader',
    'CardTitle',
    'CardDescription',
    'CardContent',
    'CardFooter',
    'TabsList',
    'TabsTrigger',
    'TabsContent',
    'TableCaption',
    'TableHeader',
    'TableBody',
    'TableFooter',
    'TableRow',
    'TableHead',
    'TableCell',
    'ResizablePanelGroup',
    'SelectValue',
  ];
  const expectedAuthoringSlots = {
    Accordion: 'block',
    AccordionItem: 'block',
    AccordionPanel: 'block',
    AccordionTrigger: 'inline',
    AlertDialog: 'block',
    AlertDialogContent: 'block',
    AlertDialogTitle: 'inline',
    Attachment: 'block',
    AttachmentAction: 'inline',
    AttachmentActions: 'block',
    AttachmentContent: 'block',
    AttachmentDescription: 'inline',
    AttachmentGroup: 'block',
    AttachmentMedia: 'inline',
    AttachmentTitle: 'inline',
    AttachmentTrigger: 'inline',
    Bubble: 'block',
    BubbleContent: 'inline',
    BubbleGroup: 'block',
    BubbleReactions: 'inline',
    Button: 'inline',
    ButtonGroup: 'block',
    Card: 'block',
    CardHeader: 'block',
    CardTitle: 'inline',
    Carousel: 'block',
    CarouselSlide: 'block',
    Combobox: 'block',
    ComboboxContent: 'block',
    ComboboxOption: 'block',
    ComboboxSection: 'block',
    Command: 'block',
    CommandItem: 'block',
    CommandOption: 'block',
    CommandSection: 'block',
    ContextMenu: 'block',
    ContextMenuRadioSection: 'block',
    ContextMenuSubmenu: 'block',
    Dialog: 'block',
    DialogContent: 'block',
    DialogMedia: 'inline',
    DialogPreset: 'block',
    Drawer: 'block',
    DropdownMenu: 'block',
    DropdownMenuRadioSection: 'block',
    DropdownMenuSubmenu: 'block',
    Empty: 'block',
    Field: 'block',
    FieldLabel: 'block',
    HoverCard: 'block',
    InputGroup: 'block',
    InputOTP: 'block',
    InputOTPDigitGroup: 'block',
    Item: 'block',
    Marker: 'block',
    MarkerContent: 'inline',
    MarkerIcon: 'inline',
    Menubar: 'block',
    MenubarRadioSection: 'block',
    MenubarSubmenu: 'block',
    Message: 'block',
    MessageAvatar: 'inline',
    MessageContent: 'block',
    MessageFooter: 'inline',
    MessageGroup: 'block',
    MessageHeader: 'inline',
    MessageScroller: 'block',
    MessageScrollerButton: 'inline',
    MessageScrollerContent: 'block',
    MessageScrollerItem: 'block',
    MessageScrollerViewport: 'block',
    NativeSelect: 'block',
    NativeSelectOptGroup: 'block',
    NativeSelectOption: 'inline',
    NavigationMenu: 'block',
    NavigationMenuLinkItem: 'inline',
    NavigationMenuPanelItem: 'block',
    Pagination: 'block',
    Popover: 'block',
    Progress: 'block',
    RadioGroup: 'block',
    RadioGroupOption: 'block',
    ResizablePanelGroup: 'block',
    ResizableSplit: 'block',
    Select: 'block',
    SelectValue: 'inline',
    Sheet: 'block',
    Table: 'block',
    TableRow: 'block',
    Tabs: 'block',
    TabsPane: 'block',
    TabsTrigger: 'inline',
    Theme: 'block',
    ToggleGroup: 'block',
    ToggleGroupItem: 'inline',
    Tooltip: 'block',
  };
  const visibleRootComponents = [
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
    'Command',
    'Combobox',
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
    'ScatterChartCard',
    'ScrollArea',
    'Select',
    'Separator',
    'Sheet',
    'Sidebar',
    'Skeleton',
    'Slider',
    'Spinner',
    'Switch',
    'SwitchField',
    'Table',
    'Tabs',
    'Textarea',
    'Theme',
    'ToastTrigger',
    'Toggle',
    'ToggleGroup',
    'Tooltip',
  ];
  const forcedHiddenComponents = [
    'ChartContainer',
    'DirectionProvider',
    'Toaster',
    'TooltipProvider',
  ];

  assert(components.length >= 250, 'shadcn-base registry should include the full generated UI component set');
  assert(registry.extensions?.libraries?.['shadcn-base'], 'shadcn-base registry should declare the shadcn-base library');

  for (const importName of structuralComponents) {
    const component = byImportName.get(importName);
    assert(component, `starter registry should include ${importName}`);
    assert(component.extensions?.hiddenFromInsert === true, `${importName} should stay hidden from root insert pickers`);
    assert(typeof component.extensions?.storySourceFile === 'string', `${importName} should keep a CSF story source`);
  }

  for (const [importName, slotKind] of Object.entries(expectedAuthoringSlots)) {
    const component = byImportName.get(importName);
    assert(component, `starter registry should include ${importName}`);
    assert(
      component.extensions?.childrenSlotKind === slotKind,
      `${importName} should declare a ${slotKind} children slot for source authoring`,
    );
  }

  for (const importName of visibleRootComponents) {
    const component = byImportName.get(importName);
    assert(component, `starter registry should include visible root ${importName}`);
    assert(component.extensions?.hiddenFromInsert !== true, `${importName} should stay visible in root insert pickers`);
  }
  const expectedVisibleRootComponents = new Set(visibleRootComponents);
  const unexpectedVisibleRootComponents = components
    .filter((component) => component.extensions?.libraryId === 'shadcn-base')
    .map((component) => component.extensions?.importName)
    .filter((importName) => importName && !expectedVisibleRootComponents.has(importName) && byImportName.get(importName)?.extensions?.hiddenFromInsert !== true);
  assert(
    unexpectedVisibleRootComponents.length === 0,
    `slot-only shadcn components should stay hidden from root insert pickers: ${unexpectedVisibleRootComponents.join(', ')}`,
  );

  for (const importName of forcedHiddenComponents) {
    const component = byImportName.get(importName);
    assert(component, `starter registry should include internal ${importName}`);
    assert(component.extensions?.hiddenFromInsert === true, `${importName} should stay hidden from designer insert pickers`);
  }
}

function checkGeneratedProjectFiles() {
  const sourceFiles = new Map(createWorkbenchProjectSourceFiles({ projectName: 'Radix Base Components' }));
  for (const expectedFile of [
    'package.json',
    'index.html',
    'tsconfig.json',
    'vite.config.ts',
    'src/main.tsx',
    'src/site.css',
    'scripts/workbench-verify-pages.mjs',
  ]) {
    assert(sourceFiles.has(expectedFile), `starter project should generate ${expectedFile}`);
  }

  const packageJson = JSON.parse(sourceFiles.get('package.json'));
  assert(packageJson.dependencies?.['@base-ui/react'], 'starter package.json should include @base-ui/react');
  assert(packageJson.dependencies?.react, 'starter package.json should include react');
  assert(packageJson.dependencies?.['react-dom'], 'starter package.json should include react-dom');
  assert(
    packageJson.scripts?.check === 'tsc -p tsconfig.json --noEmit && node scripts/workbench-verify-pages.mjs' &&
      packageJson.scripts?.['workbench:check'] === undefined &&
      packageJson.scripts?.prebuild === undefined,
    'starter projects should run the portable page authoring interlock from check without coupling it to build',
  );
  assert(
    sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-UNREGISTERED-COMPONENT') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-LOCAL-JSX-FUNCTION') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-MAP') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-SEMANTIC-COMPONENT') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-UNREGISTERED-ASSET') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-ASSET-FILE-MISSING') &&
      sourceFiles.get('scripts/workbench-verify-pages.mjs')?.includes('WB-AUTH-EXTERNAL-ASSET'),
    'starter projects should include a portable page verifier for direct filesystem edits',
  );
  assert(packageJson.scripts?.build === 'vite build', 'starter package.json should include a Vite build script');
  assert(
    sourceFiles.get('src/main.tsx')?.includes("import { createRoot } from 'react-dom/client';"),
    'starter main entry should render through react-dom/client',
  );

  const shadcnSourceFiles = new Map(createWorkbenchProjectSourceFiles({
    projectName: 'Tailwind shadcn Project',
    templateId: 'shadcn-base',
  }));
  const shadcnPackageJson = JSON.parse(shadcnSourceFiles.get('package.json'));
  const shadcnAssets = new Map(createWorkbenchProjectFiles({
    projectId: 'shadcn-gallery-assets-check',
    projectName: 'Tailwind shadcn Project',
    createdAt: '2026-07-14T00:00:00.000Z',
    templateId: 'shadcn-base',
  })).get('assets.json');
  for (const expectedFile of [
    'src/components/ui/button.tsx',
    'src/components/ui/button.stories.tsx',
    'src/components/ui/alert.css',
    'src/components/ui/attachment.css',
    'src/components/ui/avatar.css',
    'src/components/ui/badge.css',
    'src/components/ui/breadcrumb.css',
    'src/components/ui/table.tsx',
    'src/components/ui/table.stories.tsx',
    'src/lib/utils.ts',
    'src/hooks/use-mobile.ts',
    'src/workbench-pages/SaasDashboard.tsx',
    'src/workbench-pages/ComponentsCatalog.tsx',
    'scripts/workbench-verify-pages.mjs',
  ]) {
    assert(shadcnSourceFiles.has(expectedFile), `shadcn-base project should generate ${expectedFile}`);
  }
  assert(
    !shadcnSourceFiles.has('src/workbench-pages/ComponentGallery.tsx') &&
      !shadcnSourceFiles.has('public/workbench-assets/icons/ledger-connect-qr.svg') &&
      !shadcnAssets.assets?.some((asset) => asset.id === 'asset-ledger-connect-qr'),
    'shadcn-base should replace the legacy ComponentGallery and its page-only QR asset with ComponentsCatalog',
  );
  assert(
    !shadcnSourceFiles.has('src/components/ui/stack.tsx') &&
      !shadcnSourceFiles.has('src/components/ui/stack.stories.tsx') &&
      !shadcnSourceFiles.has('src/components/ui/text.tsx') &&
      !shadcnSourceFiles.has('src/components/ui/text.stories.tsx'),
    'shadcn-base projects should not generate custom Text or Stack primitives',
  );
  const shadcnButtonSource = shadcnSourceFiles.get('src/components/ui/button.tsx') ?? '';
  const shadcnButtonStory = shadcnSourceFiles.get('src/components/ui/button.stories.tsx') ?? '';
  const shadcnButtonSiteCss = shadcnSourceFiles.get('src/site.css') ?? '';
  const shadcnCompiledCss = shadcnSourceFiles.get('src/workbench-shadcn.css') ?? '';
  const shadcnIconSource = shadcnSourceFiles.get('src/components/ui/icon.tsx') ?? '';
  assert(
    [
      '[data-slot="sheet-content"][data-side="right"]',
      '[data-slot="sheet-content"][data-side="left"]',
      '[data-slot="sheet-content"][data-side="top"]',
      '[data-slot="sheet-content"][data-side="bottom"]',
      '[data-slot="drawer-content"][data-state="open"][data-vaul-drawer-direction="bottom"]',
      '@keyframes wb-drawer-slide-in-bottom',
      '@keyframes wb-drawer-slide-out-bottom',
      'var(--wb-component-foreground) 12%',
      'var(--wb-component-surface)',
    ].every((contract) => shadcnButtonSiteCss.includes(contract)),
    'shadcn-base overlay CSS should keep modal borders opaque, Sheet attachment edges square, and own Drawer motion inside preview iframes',
  );
  assert(
    shadcnButtonSiteCss.includes('var(--ds-token-workbench-components-calendar-day-selected-background) 16%') &&
      shadcnButtonSiteCss.includes('var(--ds-token-workbench-components-calendar-surface)') &&
      shadcnButtonSiteCss.includes('[data-calendar-day-button="true"][data-range-middle="true"]') &&
      !shadcnButtonSiteCss.includes('.rdp-range_middle') &&
      !shadcnButtonSiteCss.includes('--wb-calendar-range-background-strong'),
    'shadcn-base Calendar range CSS should paint the middle-day band once on the day button so week edges keep the official rounding',
  );
  assert(
    shadcnCompiledCss.includes('wb-drawer-slide-in-bottom') &&
      shadcnCompiledCss.includes('wb-drawer-slide-out-bottom') &&
      /\[data-slot=sheet-content\]\[data-side=right\]/.test(shadcnCompiledCss),
    'shadcn-base compiled preview CSS should include Drawer motion and direction-aware Sheet radii',
  );
  assert(
    shadcnButtonSource.includes('shape: "rounded"') &&
      shadcnButtonSource.includes('shape = "rounded"') &&
      shadcnButtonSource.includes('rounded: "rounded-[var(--ds-token-workbench-components-button-radius)]"') &&
      shadcnButtonSource.includes('pill: "rounded-full"') &&
      !shadcnButtonSource.includes('default: null'),
    'shadcn-base Button should expose only rounded and pill shape variants with rounded as the default',
  );
  assert(
    shadcnButtonStory.includes("const SHAPES = ['rounded', 'pill'] as const") &&
      shadcnButtonStory.includes("shape: 'rounded'") &&
      !shadcnButtonStory.includes("shape: 'default'"),
    'shadcn-base Button stories should expose only rounded and pill shape options',
  );
  assert(
    shadcnButtonSiteCss.includes('border-color: var(--ds-token-workbench-components-button-outline-border) !important;'),
    'shadcn-base outline buttons should preserve their token-backed border over the transparent base utility',
  );
  assert(
    /\[data-slot=["']pagination-link["']\]\[data-size=["']icon["']\]\s*\{[^}]*width:\s*var\(--ds-token-workbench-components-pagination-item-size\);[^}]*height:\s*var\(--ds-token-workbench-components-pagination-item-size\);/s.test(shadcnButtonSiteCss) &&
      !/\[data-slot=["']pagination-link["']\]\s*\{[^}]*\bwidth:/s.test(shadcnButtonSiteCss),
    'shadcn-base Pagination should reserve the square item token for icon-sized page links so Previous and Next can fit their labels',
  );
  assert(
    shadcnCompiledCss.includes('[data-slot=pagination-link][data-size=icon]{width:var(--ds-token-workbench-components-pagination-item-size);height:var(--ds-token-workbench-components-pagination-item-size)}') &&
      !shadcnCompiledCss.includes('[data-slot=pagination-link]{width:'),
    'shadcn-base compiled preview CSS should preserve intrinsic widths for labeled Pagination links',
  );
  assert(
    /\[data-slot=["']scroll-area-scrollbar["']\]\[data-orientation=["']vertical["']\]\s*\{[^}]*width:\s*var\(--ds-token-workbench-components-scroll-area-scrollbar-size\);/s.test(shadcnButtonSiteCss) &&
      /\[data-slot=["']scroll-area-scrollbar["']\]\[data-orientation=["']horizontal["']\]\s*\{[^}]*height:\s*var\(--ds-token-workbench-components-scroll-area-scrollbar-size\);/s.test(shadcnButtonSiteCss) &&
      !/\[data-slot=["']scroll-area-scrollbar["']\]\s*\{[^}]*\bwidth:/s.test(shadcnButtonSiteCss),
    'shadcn-base ScrollArea should apply the thickness token on the orientation axis without collapsing a horizontal track',
  );
  assert(
    shadcnCompiledCss.includes('[data-slot=scroll-area-scrollbar][data-orientation=vertical]{width:var(--ds-token-workbench-components-scroll-area-scrollbar-size)}') &&
      shadcnCompiledCss.includes('[data-slot=scroll-area-scrollbar][data-orientation=horizontal]{height:var(--ds-token-workbench-components-scroll-area-scrollbar-size)}') &&
      !shadcnCompiledCss.includes('[data-slot=scroll-area-scrollbar]{width:'),
    'shadcn-base compiled preview CSS should preserve the full horizontal ScrollArea track width',
  );
  assert(
    shadcnIconSource.includes('WebkitMaskImage: toCssUrl(iconSource)') &&
      shadcnIconSource.includes('maskImage: toCssUrl(iconSource)') &&
      shadcnIconSource.includes('const needsInlineSvg = nonScalingStroke || (') &&
      shadcnIconSource.includes('useWorkbenchIconSvg(needsInlineSvg ? iconSource : null)') &&
      !shadcnIconSource.includes('if (!iconSource || !svgMarkup)'),
    'shadcn-base Icon should paint requested icons through a native mask immediately and reserve async SVG parsing for custom stroke behavior',
  );
  const shadcnAlertCss = shadcnSourceFiles.get('src/components/ui/alert.css') ?? '';
  for (const expectedAlertCssSnippet of [
    ':where(.wb-alert)',
    'padding-right: var(--ds-token-workbench-components-alert-action-space);',
    'font-size: var(--ds-token-workbench-components-alert-title-font-size);',
    'font-size: var(--ds-token-workbench-components-alert-description-font-size);',
    'background-color: currentColor;',
    'position: absolute;',
  ]) {
    assert(
      shadcnAlertCss.includes(expectedAlertCssSnippet),
      `shadcn-base Alert CSS should include ${expectedAlertCssSnippet}`,
    );
  }
  const shadcnAttachmentSource = shadcnSourceFiles.get('src/components/ui/attachment.tsx') ?? '';
  const shadcnAttachmentCss = shadcnSourceFiles.get('src/components/ui/attachment.css') ?? '';
  for (const expectedAttachmentSourceSnippet of [
    'import "./attachment.css"',
    'const isUploading = state === "uploading"',
    'loading={isUploading}',
    'if (state === "uploading") return "loader-circle"',
  ]) {
    assert(
      shadcnAttachmentSource.includes(expectedAttachmentSourceSnippet),
      `shadcn-base Attachment source should include ${expectedAttachmentSourceSnippet}`,
    );
  }
  for (const expectedAttachmentCssSnippet of [
    '@keyframes attachment-title-shimmer',
    ':where([data-slot="attachment"][data-state="uploading"] [data-slot="attachment-title"])',
    ':where([data-slot="attachment"][data-state="processing"] [data-slot="attachment-title"])',
    '--attachment-title-shimmer-duration: calc(',
    'var(--duration-1000, var(--ds-token-tailwind-primitives-duration-1000, 1000ms))',
    'var(--duration-700, var(--ds-token-tailwind-primitives-duration-700, 700ms))',
    '--attachment-title-shimmer-interval: var(',
    '--attachment-title-shimmer-cycle: calc(',
    '--attachment-title-shimmer-easing: var(',
    '--ease-linear,',
    'var(--ds-token-tailwind-primitives-ease-linear, linear)',
    'background-size: 320% 100%;',
    'animation: attachment-title-shimmer var(--attachment-title-shimmer-cycle) var(--attachment-title-shimmer-easing) infinite;',
    'will-change: background-position;',
  ]) {
    assert(
      shadcnAttachmentCss.includes(expectedAttachmentCssSnippet),
      `shadcn-base Attachment CSS should include ${expectedAttachmentCssSnippet}`,
    );
  }
  const shadcnBreadcrumbCss = shadcnSourceFiles.get('src/components/ui/breadcrumb.css') ?? '';
  for (const expectedBreadcrumbCssSnippet of [
    ':where(.wb-breadcrumb-separator-text)',
    ':where(.wb-breadcrumb-separator-dot)',
    'height: 0.1875rem;',
    'width: 0.1875rem;',
  ]) {
    assert(
      shadcnBreadcrumbCss.includes(expectedBreadcrumbCssSnippet),
      `shadcn-base Breadcrumb CSS should include ${expectedBreadcrumbCssSnippet}`,
    );
  }
  const shadcnBadgeSource = shadcnSourceFiles.get('src/components/ui/badge.tsx') ?? '';
  const shadcnBadgeStory = shadcnSourceFiles.get('src/components/ui/badge.stories.tsx') ?? '';
  const shadcnBadgeCss = shadcnSourceFiles.get('src/components/ui/badge.css') ?? '';
  for (const expectedBadgeSourceSnippet of [
    'import "./badge.css"',
    '"wb-badge"',
    'default: "wb-badge--default"',
    '"data-slot": "badge"',
    '"data-variant": resolvedVariant',
  ]) {
    assert(
      shadcnBadgeSource.includes(expectedBadgeSourceSnippet),
      `shadcn-base Badge source should include ${expectedBadgeSourceSnippet}`,
    );
  }
  for (const blockedBadgeSourceSnippet of [
    'has-data-[icon=inline-end]',
    '[a]:hover',
    'focus-visible:ring-[3px]',
    '[&>svg]:size-3',
    'rounded-4xl',
  ]) {
    assert(
      !shadcnBadgeSource.includes(blockedBadgeSourceSnippet),
      `shadcn-base Badge source should not depend on Tailwind advanced variant ${blockedBadgeSourceSnippet}`,
    );
  }
  for (const expectedBadgeCssSnippet of [
    ':where(.wb-badge)',
    'height: var(--ds-token-workbench-components-badge-height);',
    'font-size: var(--ds-token-workbench-components-font-size-xs);',
    'font-weight: var(--ds-token-workbench-components-font-weight-medium);',
    'line-height: var(--ds-token-workbench-components-line-height-xs);',
    'padding-inline: var(--ds-token-workbench-components-badge-padding-x);',
    '.wb-badge > [data-slot="spinner"]',
    'line-height: 0;',
    'inline-size: 0.75rem !important;',
    ':where(.wb-badge--default)',
    ':where(a.wb-badge--default:hover)',
    ':where(.wb-badge--link:hover)',
  ]) {
    assert(
      shadcnBadgeCss.includes(expectedBadgeCssSnippet),
      `shadcn-base Badge CSS should include ${expectedBadgeCssSnippet}`,
    );
  }
  for (const expectedBadgeStorySnippet of [
    'function BadgeArrowUpRightIcon',
    'export const BadgeWithSpinner',
    "names: ['Spinner']",
    "jsxChildren: '<Spinner />Deleting'",
    'export const BadgeAsLink',
    "jsxProps: { render: '<a href=\"#link\" />' }",
    'data-icon="inline-end"',
    'strokeWidth="2"',
  ]) {
    assert(
      shadcnBadgeStory.includes(expectedBadgeStorySnippet),
      `shadcn-base Badge story should include ${expectedBadgeStorySnippet}`,
    );
  }
  for (const blockedBadgeStorySnippet of [
    '@remixicon/react',
    "importSource: '@remixicon/react'",
    'RiCheckboxCircleLine',
    'RiErrorWarningLine',
  ]) {
    assert(
      !shadcnBadgeStory.includes(blockedBadgeStorySnippet),
      `shadcn-base Badge story should not use external icon import ${blockedBadgeStorySnippet}`,
    );
  }
  const shadcnAvatarSource = shadcnSourceFiles.get('src/components/ui/avatar.tsx') ?? '';
  const shadcnAvatarStory = shadcnSourceFiles.get('src/components/ui/avatar.stories.tsx') ?? '';
  const shadcnAvatarCss = shadcnSourceFiles.get('src/components/ui/avatar.css') ?? '';
  for (const expectedAvatarSourceSnippet of [
    'import "./avatar.css"',
    'badge?: AvatarBadgeKind',
    'className={cn("wb-avatar", className)}',
    'className={cn("wb-avatar__image", className)}',
    'className={cn("wb-avatar__badge", className)}',
    'className={cn("wb-avatar-group", className)}',
    'className={cn("wb-avatar-group__count", className)}',
    'function formatAvatarGroupCount',
    'function resolveWorkbenchAvatarIconSource',
  ]) {
    assert(
      shadcnAvatarSource.includes(expectedAvatarSourceSnippet),
      `shadcn-base Avatar source should include ${expectedAvatarSourceSnippet}`,
    );
  }
  for (const blockedAvatarSourceSnippet of [
    'group-data-[size=sm]/avatar',
    'group-has-data-[size=lg]/avatar-group',
    '*:data-[slot=avatar]',
    'data-[size=lg]:size-10',
  ]) {
    assert(
      !shadcnAvatarSource.includes(blockedAvatarSourceSnippet),
      `shadcn-base Avatar source should not depend on Tailwind advanced variant ${blockedAvatarSourceSnippet}`,
    );
  }
  for (const expectedAvatarCssSnippet of [
    ':where(.wb-avatar)',
    'height: var(--ds-token-workbench-components-avatar-size-md);',
    ':where(.wb-avatar__badge)',
    ':where(.wb-avatar__badge[data-badge="number"])',
    ':where(.wb-avatar__badge-icon)',
    ':where(.wb-avatar-group > * + *)',
    ':where(.wb-avatar-group__count)',
  ]) {
    assert(
      shadcnAvatarCss.includes(expectedAvatarCssSnippet),
      `shadcn-base Avatar CSS should include ${expectedAvatarCssSnippet}`,
    );
  }
  for (const expectedAvatarStorySnippet of [
    "badge: { control: 'select', options: BADGES }",
    "badgeIcon: { control: 'icon' }",
    "src: DEFAULT_IMAGE_SRC",
    'export const AvatarWithBadge',
    'export const AvatarNumberBadge',
    'export const AvatarIconBadge',
    'export const AvatarGroupStory',
    'avatar1Src: DEFAULT_IMAGE_SRC',
    'count: 3',
    'showCount: true',
  ]) {
    assert(
      shadcnAvatarStory.includes(expectedAvatarStorySnippet),
      `shadcn-base Avatar story should include ${expectedAvatarStorySnippet}`,
    );
  }
  checkShadcnBaseRootDesignPropContracts(shadcnSourceFiles);
  assert(
    !sourceFiles.has('src/components/Text.tsx') &&
      !sourceFiles.has('src/components/Stack.tsx') &&
      !sourceFiles.has('src/components/ui/text.tsx') &&
      !sourceFiles.has('src/components/ui/stack.tsx'),
    'standard projects should not generate Text/Stack component primitives',
  );
  for (const expectedDependency of [
    '@remixicon/react',
    'embla-carousel-react',
    'react-day-picker',
    'recharts',
    'vaul',
  ]) {
    assert(
      shadcnPackageJson.dependencies?.[expectedDependency],
      `shadcn-base package.json should include ${expectedDependency}`,
    );
  }
  const shadcnStarterPageSource = shadcnSourceFiles.get('src/workbench-pages/SaasDashboard.tsx') ?? '';
  const shadcnCatalogPageSource = shadcnSourceFiles.get('src/workbench-pages/ComponentsCatalog.tsx') ?? '';
  for (const expectedPageSnippet of [
    'aria-label="Pulseboard SaaS dashboard"',
    '<SidebarProvider className="min-h-screen bg-muted dark:bg-background">',
    'max-w-[1320px]',
    'aria-label="View synchronization status"',
    '<Drawer direction="right" dismissible>',
    'aria-label="Change reporting period"',
    'aria-label="Morning command deck"',
    'August operating position',
    'Growth is compounding faster than plan.',
    'aria-label="Key metrics"',
    'grid-cols-12',
    '<Card className="col-span-12 min-h-[340px] border-0 bg-blue-600 py-6 text-white shadow-lg dark:bg-blue-700 xl:col-span-8">',
    '<AreaChartCard',
    'title="Recurring revenue velocity"',
    'aria-label="Revenue performance"',
    'aria-label="Customer operations"',
    'aria-label="Pipeline actions"',
    'title="Acquisition efficiency"',
    'aria-label="Weekly execution"',
  ]) {
    assert(
      shadcnStarterPageSource.includes(expectedPageSnippet),
      `shadcn-base starter page should compose its example with registered component boundaries and Tailwind theme utilities: ${expectedPageSnippet}`,
    );
  }
  for (const expectedCatalogSnippet of [
    'SHADCN-002 — Component Ledger',
    '66 families · 09 sections',
    '<article id="cl-theme" data-family="theme">',
    '<article id="cl-button" data-family="button">',
    '<article id="cl-input-group" data-family="input-group">',
    '<article id="cl-dialog" data-family="dialog">',
    '<article id="cl-message-scroller" data-family="message-scroller">',
    '<article id="cl-sidebar" data-family="sidebar">',
    '<InputGroupButton aria-label="Search now" size="icon-xs"><Icon name="arrow-right" /></InputGroupButton>',
    '<DialogCancel size="sm">Cancel</DialogCancel>',
    '<DialogAction size="sm">Save entry</DialogAction>',
    '<Sheet><SheetTrigger render={<Button variant="outline" />}>Right inspector</SheetTrigger>',
    '<Drawer direction="right">',
    '<Attachment fileName="report.svg" fileMeta="SVG · 12 KB" iconName="/workbench-assets/icons/workbench-dashboard/report.svg" state="done" />',
    '<MessageScroller defaultScrollPosition="start" className="h-full">',
    '<div className="grid min-w-0 gap-4 lg:grid-cols-3">',
    '<Card className="relative h-[35rem] min-w-0 gap-0 overflow-hidden py-0">',
    '<Card className="h-[35rem] min-w-0 gap-0 overflow-hidden py-0">',
    'messageId="catalog-scroll-8"',
    '<MessageScrollerItem animation="spring-bounce" messageId="stream-follow-up" scrollAnchor>',
    'messageId="stream-ready"',
    'messageId="group-next-step"',
    'messageId="group-status"',
    '<MessageScroller autoScroll defaultScrollPosition="end" className="h-full">',
    '<MessageScrollerButton direction="start" variant="outline" />',
    '<MessageScrollerContent className="gap-6 pb-16">',
    '<MessageScrollerButton className="data-[direction=end]:bottom-6" direction="end" />',
    'bottom-0 z-10 h-12 bg-[linear-gradient(to_bottom,transparent_0%,var(--card)_100%)]',
    '<CardFooter className="relative z-20 border-t-0 bg-transparent p-4 pt-0">',
    '<InputGroup className="h-auto min-h-24 rounded-2xl border-transparent bg-muted dark:bg-muted">',
    '<DropdownMenuTrigger aria-label="Add files" className="rounded-full" render={<InputGroupButton className="rounded-full" size="icon-sm" type="button" variant="outline" />} size="icon-sm" variant="outline">',
    '<DropdownMenuItem><Icon name="paperclip" />Add photos &amp; files</DropdownMenuItem>',
    '<DropdownMenuItem><Icon name="image" />Create image</DropdownMenuItem>',
    '<DropdownMenuItem><Icon name="globe" />Web search</DropdownMenuItem>',
    'aria-label="Send" className="ml-auto rounded-full"',
    '<MessageScrollerItem messageId="group-handoff" scrollAnchor>',
    '<MessageScrollerButton direction="end" />',
    'Some examples on this page are adapted from the',
    'https://ui.shadcn.com/docs/components/base/message-scroller',
    '<SidebarProvider contained className="relative min-h-[28rem] overflow-hidden rounded-lg border border-border/60 bg-muted/30">',
    '<Toaster />',
  ]) {
    assert(
      shadcnCatalogPageSource.includes(expectedCatalogSnippet),
      `shadcn-base components catalog should preserve its source-backed family specimen: ${expectedCatalogSnippet}`,
    );
  }
  assert(
    !shadcnSourceFiles.has('src/components/ui/message-scroller-demo.tsx') &&
      !shadcnSourceFiles.has('src/components/ui/message-scroller-demo.stories.tsx') &&
      !shadcnCatalogPageSource.includes('MessageScrollerDemo'),
    'shadcn-base should keep the long transcript and static composer as page composition instead of registering a demo component',
  );
  assert(
    !shadcnCatalogPageSource.includes('mediaVariant="image" imageSrc="/workbench-assets/icons/workbench-dashboard/report.svg"'),
    'shadcn-base Attachment catalog should render icon assets through the icon media contract instead of stretching them as image previews',
  );
  const shadcnFieldSource = shadcnSourceFiles.get('src/components/ui/field.tsx') ?? '';
  const shadcnThemeSource = shadcnSourceFiles.get('src/components/ui/theme.tsx') ?? '';
  const shadcnThemeStory = shadcnSourceFiles.get('src/components/ui/theme.stories.tsx') ?? '';
  const shadcnThemePaletteCss = shadcnSourceFiles.get('src/components/ui/theme.css') ?? '';
  const shadcnThemeCss = shadcnSourceFiles.get('src/site.css') ?? '';
  assert(
    shadcnFieldSource.includes('? "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2"') &&
      shadcnFieldSource.includes(': "relative -my-2 h-px"') &&
      shadcnFieldSource.includes('children ? "absolute inset-0 top-1/2" : "h-px"'),
    'shadcn-base FieldSeparator should collapse empty separators to the visible one-pixel rule while preserving labeled separators',
  );
  assert(
    shadcnThemeCss.includes('[data-slot="input-group"] {\n    min-height: var(--ds-token-workbench-components-input-height);') &&
      shadcnThemeCss.includes('[data-slot="calendar"] {') &&
      shadcnThemeCss.includes('[data-slot="empty"] {\n    background: transparent;\n    box-shadow: none;'),
    'shadcn-base controls should share input height tokens and non-overlay Calendar/Empty surfaces should not inherit popover elevation',
  );
  assert(
      shadcnCatalogPageSource.includes('as="main"') &&
      shadcnCatalogPageSource.includes('mode="auto"') &&
      shadcnCatalogPageSource.includes('surface="none"') &&
      shadcnCatalogPageSource.includes('theme="neutral"') &&
      shadcnThemeSource.includes('type ThemeMode = "inherit" | "auto" | ThemeResolvedMode') &&
      shadcnThemeSource.includes('type ThemeSurface = "inherit" | "none" | "background" | "card" | "muted"') &&
      shadcnThemeSource.includes('mode === "inherit"\n    ? parentTheme.mode ?? autoMode') &&
      shadcnThemeSource.includes('popover === "inherit" ? parentTheme.popover : popover') &&
      shadcnThemeSource.includes('theme === "inherit" ? parentTheme.theme : theme') &&
      shadcnThemeSource.includes('radius === "inherit" ? null : `workbench-semantic-radius=${radius}`') &&
      shadcnThemeSource.includes('data-wb-token-modes={tokenModes || undefined}') &&
      shadcnThemeSource.includes('`workbench-semantic-color=${resolvedMode}`') &&
      shadcnThemeSource.includes('`tailwind-theme=${resolvedMode}`') &&
      shadcnThemeSource.includes('data-shadcn-theme={shouldProjectTheme ? resolvedTheme : undefined}') &&
      shadcnThemeStory.includes("const MODES = ['inherit', 'auto', 'light', 'dark'] as const") &&
      shadcnThemeStory.includes("const SURFACES = ['inherit', 'none', 'background', 'card', 'muted'] as const") &&
      shadcnThemeStory.includes("const THEMES = ['inherit', 'neutral', 'slate', 'blue', 'rose', 'indigo', 'amber', 'violet'] as const") &&
      shadcnThemeStory.includes("const EFFECTS = ['inherit', 'auto', 'light', 'dark'] as const") &&
      shadcnThemeStory.includes("const POPOVERS = ['inherit', 'default', 'inverted'] as const") &&
      shadcnThemeStory.includes("const RADII = ['inherit', 'base', 'compact', 'flat'] as const") &&
      shadcnThemeStory.includes("const SPACING = ['inherit', 'base', 'compact'] as const") &&
      shadcnThemeStory.includes("const TYPOGRAPHY = ['inherit', 'base', 'compact'] as const") &&
      shadcnThemeStory.includes("name: 'Inherited theme'") &&
      shadcnThemePaletteCss.includes('[data-shadcn-theme="blue"][data-theme="light"]') &&
      shadcnThemePaletteCss.includes(
        '[data-shadcn-theme="amber"][data-theme="light"] {\n  --wb-theme-primary: #d97706;\n  --wb-theme-primary-foreground: #fffbeb;',
      ) &&
      shadcnThemePaletteCss.includes(
        '[data-shadcn-theme="amber"][data-theme="dark"] {\n  --wb-theme-primary: #fbbf24;\n  --wb-theme-primary-foreground: #451a03;',
      ) &&
      shadcnThemePaletteCss.includes('[data-shadcn-radius="compact"]') &&
      shadcnThemePaletteCss.includes('--radius: 0.375rem;') &&
      shadcnThemePaletteCss.includes('[data-workbench-theme-portal-root="true"] > * {\n  pointer-events: auto;\n}'),
    'shadcn-base components catalog should use registered Theme boundaries, expose palette presets, and project visibly distinct radius modes',
  );
  assert(
    shadcnCatalogPageSource.includes("import { Icon } from '../components/ui/icon'") &&
      (shadcnCatalogPageSource.match(/<Icon(?:\s|>)/g) ?? []).length >= 45 &&
      !shadcnCatalogPageSource.includes("from 'lucide-react'"),
    'shadcn-base components catalog should render registered editable Icon instances instead of direct third-party icon components',
  );
  assert(
    (shadcnCatalogPageSource.match(/<article(?:\s|>)/g) ?? []).length === 66 &&
      (shadcnCatalogPageSource.match(/data-family=/g) ?? []).length === 66 &&
      (shadcnCatalogPageSource.match(/<section(?:\s|>)/g) ?? []).length === 9,
    'shadcn-base components catalog should preserve 66 component families across nine sections',
  );
  assert(
    (shadcnCatalogPageSource.match(/<(?:Area|Bar|Composed|Line|Pie|Radar|Radial)ChartCard(?:\s|>)/g) ?? []).length === 7 &&
      !shadcnCatalogPageSource.includes('<ChartContainer') &&
      !shadcnCatalogPageSource.includes("from 'recharts'") &&
      (shadcnCatalogPageSource.match(/<Calendar(?:\s|>)/g) ?? []).length === 2,
    'shadcn-base components catalog should render registered chart-pattern and calendar boundaries instead of package internals',
  );
  assert(
    !/<i(?:\s|>)/.test(shadcnCatalogPageSource) &&
      !shadcnCatalogPageSource.includes('src="/workbench-assets/icons/ledger-connect-qr.svg"'),
    'shadcn-base components catalog should stay on registered component and icon contracts without the removed gallery asset',
  );
  assert(
    !/components\/ui\/stack(?:['"]|\.tsx)/.test(shadcnStarterPageSource) &&
      !/components\/ui\/text(?:['"]|\.tsx)/.test(shadcnStarterPageSource) &&
      !/<(?:Stack|Text)\b/.test(shadcnStarterPageSource) &&
      !/components\/ui\/stack(?:['"]|\.tsx)/.test(shadcnCatalogPageSource) &&
      !/components\/ui\/text(?:['"]|\.tsx)/.test(shadcnCatalogPageSource) &&
      !/<(?:Stack|Text)\b/.test(shadcnCatalogPageSource),
    'shadcn-base pages should not import or render custom Stack and Text primitives',
  );
  assert(
    !shadcnCatalogPageSource.includes('.map(') &&
      !shadcnCatalogPageSource.includes('style={{'),
    'shadcn-base components catalog should keep repeated designer-editable UI explicit and class-backed',
  );
  const shadcnProjectFiles = new Map(createWorkbenchProjectFiles({
    projectId: 'shadcn-pages-check',
    projectName: 'Tailwind shadcn Project',
    createdAt: '2026-07-14T00:00:00.000Z',
    templateId: 'shadcn-base',
  }));
  const shadcnPages = shadcnProjectFiles.get('pages.json')?.pages ?? [];
  assert(
    shadcnPages.some((page) => page.name === 'SaaS dashboard' && page.route === '/dashboard' && page.sourceFile === 'src/workbench-pages/SaasDashboard.tsx') &&
      shadcnPages.some((page) => page.name === 'Components catalog' && page.route === '/components-catalog' && page.sourceFile === 'src/workbench-pages/ComponentsCatalog.tsx') &&
      !shadcnPages.some((page) => page.sourceFile === 'src/workbench-pages/ComponentGallery.tsx'),
    'shadcn-base projects should register SaaS dashboard and Components catalog without the legacy Component gallery page',
  );
  assert(
    !shadcnStarterPageSource.includes('@remixicon/react') &&
      !shadcnStarterPageSource.includes('@tabler/icons-react'),
    'shadcn-base starter page should use project-owned icon assets instead of external icon imports',
  );
  assert(
      shadcnStarterPageSource.includes("import { Icon } from '../components/ui/icon'") &&
      (shadcnStarterPageSource.match(/<Icon(?:\s|>)/g) ?? []).length >= 20 &&
      !shadcnStarterPageSource.includes("from 'lucide-react'"),
    'shadcn-base starter page should use registered editable Icon instances',
  );
  assert(
    shadcnSourceFiles.get('vite.config.ts')?.includes("'@': fileURLToPath(new URL('./src', import.meta.url))"),
    'shadcn-base Vite config should alias @ to src',
  );
  assert(
    shadcnSourceFiles.get('tsconfig.json')?.includes('"@/*"'),
    'shadcn-base tsconfig should alias @ to src',
  );
  const shadcnSiteCss = shadcnSourceFiles.get('src/site.css') ?? '';
  assert(
    shadcnSiteCss.includes('--font-heading: var(--wb-font-heading') &&
      shadcnSiteCss.includes('--font-sans: var(--wb-font-sans') &&
      shadcnSiteCss.includes('--font-mono: var(--wb-font-mono'),
    'shadcn-base theme fonts should bridge Workbench font defaults into Tailwind font utilities',
  );

  const viteConfig = read('vite.config.ts');
  assert(
    viteConfig.includes('body.projectName,') && viteConfig.includes('body.templateId,'),
    'Vite dev-server project creation should forward the selected templateId',
  );
}

function checkShadcnBaseRootDesignPropContracts(shadcnSourceFiles) {
  const shadcnSelectSource = shadcnSourceFiles.get('src/components/ui/select.tsx') ?? '';
  const shadcnSelectStory = shadcnSourceFiles.get('src/components/ui/select.stories.tsx') ?? '';
  assert(
    shadcnSelectSource.includes('{children}') &&
      shadcnSelectSource.includes('const SelectWorkbenchLabelContext =') &&
      shadcnSelectSource.includes('renderSelectFallbackValue(selectedValue, placeholder, labelRegistry)') &&
      shadcnSelectSource.includes('collectSelectItemLabels(children)') &&
      shadcnSelectSource.includes('authoredLabelsByValue.get(registryKey)') &&
      shadcnSelectSource.includes('const [, bumpLabelVersion] = React.useReducer') &&
      shadcnSelectSource.includes('setLabelForValue(registryKey, itemLabel)') &&
      shadcnSelectSource.includes('clearLabelForValue(registryKey, itemLabel)') &&
      shadcnSelectSource.includes('const fallbackValue = React.useId()') &&
      shadcnSelectSource.includes('const itemValue = value ?? fallbackValue') &&
      shadcnSelectSource.includes('value={itemValue}') &&
      shadcnSelectSource.includes('label={itemLabel}') &&
      shadcnSelectSource.includes('getSelectSimpleModeChildren(children)') &&
      shadcnSelectSource.includes('<SelectTrigger {...runtimeRootProps}><SelectValue placeholder={placeholder} /></SelectTrigger>') &&
      shadcnSelectSource.includes('splitWorkbenchRuntimeRootProps') &&
      shadcnSelectSource.includes('<SelectContent>{simpleModeChildren}</SelectContent>') &&
      shadcnSelectSource.includes('min-w-36 max-w-full items-center justify-between') &&
      shadcnSelectSource.includes('className={cn("min-w-0 flex-1 truncate text-left", className)}') &&
      shadcnSelectSource.includes('className="block min-w-0 flex-1 truncate"') &&
      !shadcnSelectSource.includes('flex flex-1 shrink-0 gap-2 whitespace-nowrap') &&
      !shadcnSelectSource.includes('type SelectWorkbenchProps') &&
      !shadcnSelectSource.includes('defaultOption') &&
      !shadcnSelectSource.includes('firstOptionLabel') &&
      !shadcnSelectSource.includes('secondOptionLabel') &&
      !shadcnSelectSource.includes('hasAuthoredChildren') &&
      !shadcnSelectSource.includes('shouldUseDesignDefaultValue') &&
      !shadcnSelectSource.includes('<SelectItem value={firstOptionValue}>{firstOptionLabel}</SelectItem>') &&
      !shadcnSelectSource.includes('<SelectItem value={secondOptionValue}>{secondOptionLabel}</SelectItem>'),
    'shadcn-base Select should preserve editable options and truncate trigger and item labels within the available width',
  );
  assert(
    shadcnSelectStory.includes('jsxChildren:\n      \'<SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Options</SelectLabel><SelectItem value="item-1">Item 1</SelectItem><SelectSeparator /><SelectItem value="item-2">Item 2</SelectItem></SelectGroup></SelectContent>\'') &&
      shadcnSelectStory.includes("'SelectTrigger'") &&
      shadcnSelectStory.includes("'SelectValue'") &&
      shadcnSelectStory.includes("'SelectContent'") &&
      shadcnSelectStory.includes("placeholder: 'Select an option'") &&
      shadcnSelectStory.includes('<SelectItem value="item-1">Item 1</SelectItem>') &&
      shadcnSelectStory.includes('<SelectItem value="item-2">Item 2</SelectItem>') &&
      shadcnSelectStory.includes("value: 'item-1'") &&
      !shadcnSelectStory.includes("defaultOption: { control: 'select'") &&
      !shadcnSelectStory.includes("firstOptionLabel: '") &&
      !shadcnSelectStory.includes("secondOptionLabel: '") &&
      !shadcnSelectStory.includes('value="option-1"') &&
      !shadcnSelectStory.includes('defaultValue="option-1"') &&
      !shadcnSelectSource.includes('"Base UI"') &&
      !shadcnSelectSource.includes('"Radix UI"') &&
      !shadcnSelectStory.includes("firstOptionLabel: 'Base UI'") &&
      !shadcnSelectStory.includes("secondOptionLabel: 'Radix UI'") &&
      !shadcnSelectStory.includes('value="base">Base UI') &&
      !shadcnSelectStory.includes('value="radix">Radix UI') &&
      !shadcnSelectStory.includes('placeholder="Choose a base"'),
    'shadcn-base Select story should insert editable children rather than root fallback option props',
  );

  const shadcnDatePickerSource = shadcnSourceFiles.get('src/components/ui/date-picker.tsx') ?? '';
  const shadcnDatePickerStory = shadcnSourceFiles.get('src/components/ui/date-picker.stories.tsx') ?? '';
  assert(
    shadcnDatePickerSource.includes('defaultValue?: Date | string') &&
      shadcnDatePickerSource.includes('value?: Date | string') &&
      shadcnDatePickerSource.includes('splitWorkbenchRuntimeRootProps') &&
      shadcnDatePickerSource.includes('{...runtimeRootProps}') &&
      shadcnDatePickerSource.includes('normalizeDatePickerDate(defaultValue)') &&
      shadcnDatePickerSource.includes('new Date(Number(year), Number(month) - 1, Number(day))') &&
      shadcnDatePickerStory.includes("defaultValue: '2026-06-21'") &&
      shadcnDatePickerStory.includes("defaultValue: { control: 'text' }") &&
      shadcnDatePickerStory.includes('defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}') &&
      !shadcnDatePickerStory.includes('defaultValue={new Date('),
    'shadcn-base DatePicker should use serializable date source insert defaults while preserving Date support',
  );

  const shadcnDateRangePickerSource = shadcnSourceFiles.get('src/components/ui/date-range-picker.tsx') ?? '';
  const shadcnDateRangePickerStory = shadcnSourceFiles.get('src/components/ui/date-range-picker.stories.tsx') ?? '';
  assert(
    shadcnDateRangePickerSource.includes('type DateInput = Date | string') &&
      shadcnDateRangePickerSource.includes('defaultFrom?: DateInput') &&
      shadcnDateRangePickerSource.includes('defaultTo?: DateInput') &&
      shadcnDateRangePickerSource.includes('splitWorkbenchRuntimeRootProps') &&
      shadcnDateRangePickerSource.includes('{...runtimeRootProps}') &&
      shadcnDateRangePickerSource.includes('normalizeDateRangePickerRange({ from: defaultFrom, to: defaultTo })') &&
      shadcnDateRangePickerStory.includes("defaultFrom: '2026-06-09'") &&
      shadcnDateRangePickerStory.includes("defaultTo: '2026-06-18'") &&
      shadcnDateRangePickerStory.includes("defaultFrom: { control: 'text' }") &&
      shadcnDateRangePickerStory.includes('defaultFrom={asText(args.defaultFrom, DEFAULT_PROPS.defaultFrom)}') &&
      !shadcnDateRangePickerStory.includes('defaultValue={{ from: new Date('),
    'shadcn-base DateRangePicker should expose serializable from/to source insert defaults while preserving DateRange support',
  );

  const forbiddenGenericStoryCopy = [
    'Dashboard',
    'Reports',
    'dashboard',
    'reports',
    'Designer',
    'Developer',
    'designer',
    'developer',
    'Base UI primitive',
    'Base UI handles',
    'Use Base UI behavior',
    'Project synced',
    'Theme tokens',
    'Token sync complete',
    'Publish component set',
    'Search components',
    'Select project',
    'Project drawer',
    'Project name',
    'Project details',
    'Library settings',
    'Review component metadata',
    'Tailwind classes',
    'Search workbench',
    'placeholder="Add project"',
    "placeholder: 'Add project'",
  ];
  for (const [fileName, source] of shadcnSourceFiles) {
    if (!fileName.startsWith('src/components/ui/') || !fileName.endsWith('.stories.tsx')) continue;
    for (const snippet of forbiddenGenericStoryCopy) {
      assert(
        !source.includes(snippet),
        `${fileName} should avoid hard-coded generic demo copy: ${snippet}`,
      );
    }
  }

  const compoundRootContracts = [
    {
      component: 'Accordion',
      sourceFile: 'src/components/ui/accordion.tsx',
      storyFile: 'src/components/ui/accordion.stories.tsx',
      requiredSourceSnippets: [
        'showDividers?: boolean',
        'contentGap?: AccordionContentGap',
        'type AccordionContentGap = "none" | "xs" | "sm" | "md" | "lg"',
        'type AccordionTypographySize = "xs" | "sm" | "md" | "lg" | "xl" | "display"',
        'const AccordionTypographyContext = React.createContext(DEFAULT_ACCORDION_TYPOGRAPHY)',
        'accordionContentGapClasses[typography.contentGap]',
        'renderAccordionContentChildren(children)',
        'data-slot="accordion-content-text"',
        'getAccordionTypographyOverrideClasses({',
        'type AccordionValueInput = AccordionPrimitive.Root.Props["defaultValue"] | string',
        'function normalizeAccordionValue(',
        'const normalizedDefaultValue = normalizeAccordionValue(defaultValue)',
        'const accordionValueKey = getAccordionValueKey(',
        'key={accordionValueKey}',
        '? { value: normalizedValue ?? [] }',
        ': { defaultValue: normalizedDefaultValue }',
        'size: typography.titleSize',
        'size: typography.contentSize',
        'function AccordionPanel',
        'const itemValue = value ?? fallbackValue',
        'divide-y-[length:var(--ds-token-workbench-components-accordion-divider-width)]',
      ],
      blockedSourceSnippets: [
        'children = "Item content"',
        'title = "Item title"',
      ],
      requiredStorySnippets: [
        'showDividers: true',
        "showDividers: { control: 'boolean' }",
        "contentGap: 'sm'",
        "contentGap: { control: 'select', options: GAP_OPTIONS }",
        'ACCORDION_TYPOGRAPHY_ARG_TYPES',
        'contentSize: { control: \'select\', options: SIZE_OPTIONS }',
        'titleWeight: { control: \'select\', options: WEIGHT_OPTIONS }',
        "defaultValue: ''",
        "defaultValue: { control: 'text' }",
        'function parseAccordionDefaultValue',
        'defaultValue={parseAccordionDefaultValue(asText(args.defaultValue, DEFAULT_PROPS.defaultValue))}',
        "names: ['AccordionPanel']",
        '<AccordionPanel value="item-1" title="Item 1"><p>Content 1</p></AccordionPanel><AccordionPanel value="item-2" title="Item 2"><p>Content 2</p></AccordionPanel>',
        "children: 'Content'",
        "title: 'Item'",
        'export const AccordionPanelStory',
      ],
      blockedStorySnippets: [
        'defaultValue: "[\'item-1\']"',
        '<AccordionItem value="item-1"><AccordionTrigger>Item title</AccordionTrigger><AccordionContent>Item content</AccordionContent></AccordionItem>',
      ],
    },
    {
      component: 'Tabs',
      sourceFile: 'src/components/ui/tabs.tsx',
      storyFile: 'src/components/ui/tabs.stories.tsx',
      requiredSourceSnippets: [
        'function TabsPane',
        'React.Children.toArray(children).filter(isMeaningfulTabsChild)',
        '{child.props.title}',
      ],
      blockedSourceSnippets: [
        '`Item ${index + 1}`',
      ],
      requiredStorySnippets: [
        "names: ['TabsPane']",
        '<TabsPane value="item-1" title="Item 1">Content 1</TabsPane><TabsPane value="item-2" title="Item 2">Content 2</TabsPane>',
        'export const TabsPaneStory',
      ],
      blockedStorySnippets: [
        "jsxChildren:\n      '<TabsList>",
        '<TabsPane value="item-1" title="Item">Content</TabsPane><TabsPane value="item-2" title="Item">Content</TabsPane>',
      ],
    },
    {
      component: 'Carousel',
      sourceFile: 'src/components/ui/carousel.tsx',
      storyFile: 'src/components/ui/carousel.stories.tsx',
      requiredSourceSnippets: [
        'function CarouselSlide',
        'React.Children.toArray(children).filter(isMeaningfulCarouselChild)',
        'const useSlideMode =',
        'layoutWidth?: string',
        'controlOffset?: string',
        'controlPosition?: CarouselControlPosition',
        'controlShape?: CarouselControlShape',
        'controlSize?: CarouselControlSize',
        'controlTone?: CarouselControlTone',
        'controlVariant?: CarouselControlVariant',
        'radius?: CarouselRadius',
        '"--carousel-layout-width"',
        'w-[var(--carousel-layout-width)]',
        'DEFAULT_CAROUSEL_CONTROL_OFFSET = "3rem"',
        'DEFAULT_CAROUSEL_CONTROL_SHAPE: CarouselControlShape = "pill"',
        'DEFAULT_CAROUSEL_CONTROL_SIZE: CarouselControlSize = "icon-sm"',
        'DEFAULT_CAROUSEL_CONTROL_TONE: CarouselControlTone = "default"',
        'DEFAULT_CAROUSEL_CONTROL_VARIANT: CarouselControlVariant = "outline"',
        'getCarouselControlButtonStyle',
        'getCarouselControlToneClassName',
        '--ds-token-workbench-components-carousel-control-diff-background',
        '--ds-token-workbench-components-carousel-control-diff-foreground',
        '--ds-token-workbench-components-carousel-control-diff-hover-background',
        'data-control-tone={controlTone}',
        'type CarouselControlTone = "default" | "diff"',
        'getCarouselRadiusClassName',
        'getCarouselRadiusStyle',
        'clipPath: `inset(0 round ${borderRadius})`',
        'rounded-[var(--ds-token-workbench-components-carousel-radius)]',
        'frame?: boolean',
        'const shouldFrameContent = frame || Boolean(contentClassName)',
        'isWorkbenchElementOfType(child, CarouselSlide, "CarouselSlide")',
        'api.reInit()',
        'data-orientation={orientation}',
        'orientation === "vertical" && "h-full"',
        '<CarouselContent>{children}</CarouselContent>',
      ],
      blockedSourceSnippets: [
        'children = "Slide"',
      ],
      requiredStorySnippets: [
        "layoutWidth: '360px'",
        "controlOffset: '3rem'",
        "controlPosition: 'outside'",
        "controlShape: 'pill'",
        "controlSize: 'icon-sm'",
        "controlTone: 'default'",
        "controlVariant: 'outline'",
        "radius: 'default'",
        "const CONTROL_SHAPES = ['rounded', 'pill'] as const",
        "controlPosition: { control: 'select', options: CONTROL_POSITIONS }",
        "controlShape: { control: 'select', options: CONTROL_SHAPES }",
        "controlSize: { control: 'select', options: CONTROL_SIZES }",
        "controlTone: { control: 'select', options: CONTROL_TONES }",
        "controlVariant: { control: 'select', options: CONTROL_VARIANTS }",
        "radius: { control: 'select', options: RADII }",
        "layoutWidth: { control: 'text' }",
        "verticalPaddingY: '3rem'",
        "names: ['CarouselSlide']",
        '<CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 1</div></CarouselSlide><CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 2</div></CarouselSlide><CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 3</div></CarouselSlide>',
        'export const CarouselSlideStory',
      ],
      blockedStorySnippets: [
        'DEFAULT_CAROUSEL_CLASS_NAME',
        'w-[360px] px-12 py-10 data-[orientation=vertical]:h-[360px]',
        '<CarouselSlide>Slide 1</CarouselSlide><CarouselSlide>Slide 2</CarouselSlide><CarouselSlide>Slide 3</CarouselSlide>',
        '<CarouselContent><CarouselItem>Slide 1</CarouselItem><CarouselItem>Slide 2</CarouselItem><CarouselItem>Slide 3</CarouselItem></CarouselContent><CarouselPrevious /><CarouselNext />',
      ],
    },
    {
      component: 'Combobox',
      sourceFile: 'src/components/ui/combobox.tsx',
      storyFile: 'src/components/ui/combobox.stories.tsx',
      requiredSourceSnippets: [
        'const ComboboxWorkbenchLabelContext',
        'itemToStringLabel={getItemLabel}',
        'collectComboboxItemLabels(children)',
        'authoredLabelsByValue.get(registryKey)',
        'label?: string',
        'const ComboboxTrigger = React.forwardRef',
        'ref={ref}',
        'function ComboboxOption',
        'function ComboboxSection',
        'getComboboxSimpleModeChildren(children)',
        'splitWorkbenchRuntimeRootProps',
        'useWorkbenchPortalContainer',
        'container={portalContainer}',
        'positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}',
        'data-highlighted:bg-foreground/10 data-highlighted:text-foreground data-highlighted:**:text-foreground',
        '<ComboboxInput placeholder={placeholder} {...runtimeRootProps} />',
        'render={<InputGroup className={cn("w-auto", className)} {...runtimeRootProps} />}',
        '<ComboboxList>{simpleModeChildren}</ComboboxList>',
        'labelRegistry.setLabelForValue(registryKey, itemLabel)',
      ],
      blockedSourceSnippets: [
        'children ?? <ComboboxOption value="item-1">Item</ComboboxOption>',
        'label = "Options"',
        'data-highlighted:text-accent-foreground',
      ],
      requiredStorySnippets: [
        '<ComboboxInput placeholder="Select an item" /><ComboboxContent><ComboboxList><ComboboxSection label="Options"><ComboboxOption value="item-1">Item 1</ComboboxOption><ComboboxSeparator /><ComboboxOption value="item-2">Item 2</ComboboxOption></ComboboxSection></ComboboxList></ComboboxContent>',
        "'ComboboxInput'",
        "'ComboboxContent'",
        "'ComboboxList'",
        'export const ComboboxOptionStory',
        'export const ComboboxSectionStory',
        "defaultValue: 'item-1'",
        "placeholder: 'Select an item'",
      ],
      blockedStorySnippets: [
        '<ComboboxOption value="item-3">Item 3</ComboboxOption>',
        'value="dashboard"',
        'value="reports"',
      ],
    },
    {
      component: 'Select',
      sourceFile: 'src/components/ui/select.tsx',
      storyFile: 'src/components/ui/select.stories.tsx',
      requiredSourceSnippets: [
        'const SelectWorkbenchLabelContext',
        'getSelectSimpleModeChildren(children)',
        'splitWorkbenchRuntimeRootProps',
        '<SelectTrigger {...runtimeRootProps}><SelectValue placeholder={placeholder} /></SelectTrigger>',
        '<SelectContent>{simpleModeChildren}</SelectContent>',
        'collectSelectItemLabels(children)',
        'authoredLabelsByValue.get(registryKey)',
        'value={itemValue}',
        'label={itemLabel}',
        'setLabelForValue(registryKey, itemLabel)',
        'clearLabelForValue(registryKey, itemLabel)',
        'renderSelectFallbackValue',
      ],
      blockedSourceSnippets: [
        'children ?? <SelectItem value="item-1">Item</SelectItem>',
        'firstOptionLabel',
        'secondOptionLabel',
      ],
      requiredStorySnippets: [
        "'SelectTrigger'",
        "'SelectValue'",
        "'SelectContent'",
        '<SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Options</SelectLabel><SelectItem value="item-1">Item 1</SelectItem><SelectSeparator /><SelectItem value="item-2">Item 2</SelectItem></SelectGroup></SelectContent>',
        "defaultValue: 'item-1'",
        "placeholder: 'Select an option'",
        'defaultValue={defaultValue}',
        'export const SelectItemStory',
        'export const SelectGroupStory',
      ],
      blockedStorySnippets: [
        '<SelectItem value="item-3">Item 3</SelectItem>',
        'defaultOption',
        'firstOptionLabel',
        'secondOptionLabel',
      ],
    },
    {
      component: 'DropdownMenu',
      sourceFile: 'src/components/ui/dropdown-menu.tsx',
      storyFile: 'src/components/ui/dropdown-menu.stories.tsx',
      requiredSourceSnippets: [
        'getDropdownMenuSimpleModeChildren(children as React.ReactNode)',
        'getDropdownMenuExplicitTriggerModeChildren(children as React.ReactNode)',
        '{explicitTriggerModeChildren.trigger}',
        '{explicitTriggerModeChildren.contentChildren}',
        'const modalProp = Object.prototype.hasOwnProperty.call(allProps, "modal")',
        'modal={modalProp}',
        'variant="outline"',
        'nativeButton={nativeButton ?? true}',
        'data-button=""',
        'className={render ? className : cn(buttonVariants({ size, variant, shape: "rounded" }), className)}',
        'render={render}',
        '<DropdownMenuContent className={contentClassName}>',
        'data-token-trigger-gap={usesTokenTriggerGap ? "" : undefined}',
        'sideOffset={sideOffset ?? 0}',
        'w-max min-w-32 max-w-(--available-width)',
        'gap-1.5 whitespace-nowrap rounded-md',
        'defaultValue = "item-1"',
      ],
      blockedSourceSnippets: [
        'checked={checked}',
        'value={value} {...props}',
        'children ?? <DropdownMenuItem>Item</DropdownMenuItem>',
        'children ?? <DropdownMenuRadioItem value="item-1">Item</DropdownMenuRadioItem>',
      ],
      requiredStorySnippets: [
        "'DropdownMenuTrigger'",
        "'DropdownMenuContent'",
        "'DropdownMenuSubTrigger'",
        "'DropdownMenuSubContent'",
        '<DropdownMenuTrigger variant="outline">Open menu</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem>Duplicate</DropdownMenuItem><DropdownMenuItem>Rename</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuCheckboxItem defaultChecked>Show option</DropdownMenuCheckboxItem><DropdownMenuSub><DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>PNG</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub><DropdownMenuRadioSection defaultValue="item-1"><DropdownMenuRadioItem value="item-1">Item 1</DropdownMenuRadioItem><DropdownMenuRadioItem value="item-2">Item 2</DropdownMenuRadioItem></DropdownMenuRadioSection></DropdownMenuContent>',
        'defaultChecked: true',
        "defaultValue: 'item-1'",
        "trigger: 'Open menu'",
        "size: 'default'",
        "variant: 'outline'",
      ],
      blockedStorySnippets: [
        '<DropdownMenuCheckboxItem checked>',
        '<DropdownMenuRadioSection value="item-1">',
        '<DropdownMenuRadioGroup value="item-1">',
        '<DropdownMenuItem>SVG</DropdownMenuItem>',
        'checked: true',
        "props: {\n      value: 'item-1',",
        '<DropdownMenuTrigger render={<button type="button" />}>Open menu</DropdownMenuTrigger><DropdownMenuContent>',
      ],
    },
    {
      component: 'ContextMenu',
      sourceFile: 'src/components/ui/context-menu.tsx',
      storyFile: 'src/components/ui/context-menu.stories.tsx',
      requiredSourceSnippets: [
        'getContextMenuSimpleModeChildren(children as React.ReactNode)',
        'splitWorkbenchRuntimeRootProps',
        'useWorkbenchPortalContainer',
        '? portalContainer',
        'positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}',
        '<ContextMenuTrigger',
        '{...runtimeRootProps}',
        '<ContextMenuContent className={contentClassName}>',
        'defaultValue = "item-1"',
        'focus:bg-foreground/10 focus:text-foreground',
        'group-focus/context-menu-item:text-foreground',
        '<ContextMenuSub {...componentProps}>',
        'inset={inset}\n        {...runtimeRootProps}',
      ],
      blockedSourceSnippets: [
        'checked={checked}',
        'value={value} {...props}',
        'children ?? <ContextMenuItem>Item</ContextMenuItem>',
        'children ?? <ContextMenuRadioItem value="item-1">Item</ContextMenuRadioItem>',
        'focus:text-accent-foreground',
        'group-focus/context-menu-item:text-accent-foreground',
      ],
      requiredStorySnippets: [
        "'ContextMenuTrigger'",
        "'ContextMenuContent'",
        "'ContextMenuSubTrigger'",
        "'ContextMenuSubContent'",
        '<ContextMenuTrigger className="flex h-16 w-48 items-center justify-center rounded-lg border border-dashed text-sm">Right click target</ContextMenuTrigger><ContextMenuContent><ContextMenuLabel>Actions</ContextMenuLabel><ContextMenuItem>Duplicate</ContextMenuItem><ContextMenuItem>Rename</ContextMenuItem><ContextMenuSeparator /><ContextMenuCheckboxItem defaultChecked>Show option</ContextMenuCheckboxItem><ContextMenuSub><ContextMenuSubTrigger>Export</ContextMenuSubTrigger><ContextMenuSubContent><ContextMenuItem>PNG</ContextMenuItem></ContextMenuSubContent></ContextMenuSub><ContextMenuRadioSection defaultValue="item-1"><ContextMenuRadioItem value="item-1">Item 1</ContextMenuRadioItem><ContextMenuRadioItem value="item-2">Item 2</ContextMenuRadioItem></ContextMenuRadioSection></ContextMenuContent>',
        'defaultChecked: true',
        "defaultValue: 'item-1'",
        "target: 'Right click target'",
      ],
      blockedStorySnippets: [
        '<ContextMenuCheckboxItem checked>',
        '<ContextMenuRadioSection value="item-1">',
        '<ContextMenuRadioGroup value="item-1">',
        '<ContextMenuItem>SVG</ContextMenuItem>',
        'checked: true',
        "props: { value: 'item-1' }",
        '<ContextMenuTrigger>Right click target</ContextMenuTrigger><ContextMenuContent>',
      ],
    },
    {
      component: 'Dialog',
      sourceFile: 'src/components/ui/dialog.tsx',
      storyFile: 'src/components/ui/dialog.stories.tsx',
      requiredSourceSnippets: [
        'getDialogFooterChildren(children)',
        'splitWorkbenchRuntimeRootProps',
        'title = "Dialog title"',
        'description = "Make changes to this dialog and confirm when you are ready."',
        'showTrigger = false',
        'renderDialogFooter({',
        'type DialogTriggerProps = DialogPrimitive.Trigger.Props',
        'render={render ?? <Button variant={variant} size={size} />}',
        '{...runtimeRootProps}',
        'variant="outline"',
        'function DialogCancel({',
        'function DialogAction({',
        'data-slot="dialog-cancel"',
        'data-slot="dialog-action"',
        'render={<Button variant={variant} size={size} />}',
        '<DialogCancel>{cancelText}</DialogCancel>',
        '<DialogAction>{actionText}</DialogAction>',
        'showCloseButton={showCloseButton}',
        'type DialogSize = "default" | "sm"',
        'DialogContentSizeContext',
        '<DialogContentSizeContext.Provider value={size}>',
        'DialogHeaderMediaContext',
        'function DialogPreset({',
        'function DialogMedia({',
        'const usesDefaultMediaGrid = contentSize === "default" && hasMedia',
        'gridTemplateColumns: "auto minmax(0, 1fr)"',
        'usesDefaultMediaGrid ? "col-start-2" : null',
        'contentSize === "sm"',
        'flex-row justify-end',
        '"[&>*]:min-w-20"',
      ],
      requiredStorySnippets: [
        'DialogPreset,',
        'DialogMedia,',
        'DialogAction,',
        'DialogCancel,',
        "import { Icon } from './icon';",
        "'DialogClose',",
        "const BUTTON_SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const",
        "const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const",
        "const CONTENT_SIZES = ['default', 'sm'] as const",
        "size: { control: 'select', options: CONTENT_SIZES }",
        '<DialogContent size="default" showCloseButton={false}>',
        '<DialogTitle>Dialog title</DialogTitle>',
        '<DialogDescription>Make changes to this dialog and confirm when you are ready.</DialogDescription>',
        '<DialogCancel>Cancel</DialogCancel><DialogAction>Save changes</DialogAction>',
        "name: 'DialogCancel'",
        "name: 'DialogAction'",
        "name: 'DialogPreset'",
        "media: '<Icon name=\"circle-fading-plus\" size={20} />'",
        'size={asOption(args.size, CONTENT_SIZES, DEFAULT_PROPS.size)}',
        "title: 'Dialog title'",
        "description: 'Make changes to this dialog and confirm when you are ready.'",
        'showTrigger: false',
        'asBoolean(args.showTrigger, false) ? (',
        '<DialogTrigger variant="outline">',
        "props: {\n      children: 'Open dialog',\n      variant: 'outline',\n      size: 'default',",
        "trigger: 'Open dialog'",
      ],
      blockedStorySnippets: [
        "from './text'",
        '<Text',
        '<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button>Save changes</Button>',
        '<DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>',
        '<DialogTrigger render={<button type="button" />}>Open dialog</DialogTrigger><DialogContent>',
      ],
    },
    {
      component: 'Popover',
      sourceFile: 'src/components/ui/popover.tsx',
      storyFile: 'src/components/ui/popover.stories.tsx',
      requiredSourceSnippets: [
        'getPopoverSimpleModeChildren(children as React.ReactNode)',
        'render={<Button variant="outline" />}',
        'useWorkbenchPortalContainer',
        'container={portalContainer}',
        'positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}',
        '<PopoverContent',
      ],
      requiredStorySnippets: [
        "'PopoverTrigger'",
        "'PopoverContent'",
        "names: ['Button']",
        '<PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger><PopoverContent align="center" side="bottom" sideOffset={4}><PopoverHeader><PopoverTitle>Popover title</PopoverTitle><PopoverDescription>Popover description</PopoverDescription></PopoverHeader></PopoverContent>',
      ],
      blockedStorySnippets: [
        '<PopoverTrigger render={<button type="button" />}>Open popover</PopoverTrigger><PopoverContent>',
      ],
    },
    {
      component: 'Sheet',
      sourceFile: 'src/components/ui/sheet.tsx',
      storyFile: 'src/components/ui/sheet.stories.tsx',
      requiredSourceSnippets: [
        'getSheetSimpleModeChildren(children as React.ReactNode)',
        'render={<Button variant="outline" />}',
        'showCloseButton={showCloseButton}',
        'side={side}',
      ],
      requiredStorySnippets: [
        "'SheetTrigger'",
        "'SheetContent'",
        "names: ['Button']",
        '<SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger><SheetContent className="" showCloseButton side="right"><SheetHeader><SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description</SheetDescription></SheetHeader><SheetFooter><Button size="sm">Save</Button></SheetFooter></SheetContent>',
      ],
      blockedStorySnippets: [
        '<SheetTrigger render={<button type="button" />}>Open sheet</SheetTrigger><SheetContent>',
      ],
    },
    {
      component: 'Drawer',
      sourceFile: 'src/components/ui/drawer.tsx',
      storyFile: 'src/components/ui/drawer.stories.tsx',
      requiredSourceSnippets: [
        'getDrawerSimpleModeChildren(children)',
        'DRAWER_TRIGGER_CLASS_NAME',
        '<DrawerContent className={contentClassName}>',
      ],
      requiredStorySnippets: [
        "'DrawerTrigger'",
        "'DrawerContent'",
        '<DrawerTrigger className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Open drawer</DrawerTrigger><DrawerContent className=""><DrawerHeader><DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description</DrawerDescription></DrawerHeader><p className="text-sm text-muted-foreground">Review the details before continuing.</p><DrawerFooter><DrawerClose className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Close</DrawerClose></DrawerFooter></DrawerContent>',
      ],
      blockedStorySnippets: [
      ],
    },
    {
      component: 'Tooltip',
      sourceFile: 'src/components/ui/tooltip.tsx',
      storyFile: 'src/components/ui/tooltip.stories.tsx',
      requiredSourceSnippets: [
        'getTooltipSimpleModeChildren(children as React.ReactNode)',
        'splitWorkbenchRuntimeRootProps',
        'const useSimpleMode = simpleModeChildren !== null || children == null || content !== undefined',
        'useWorkbenchPortalContainer',
        'container={portalContainer}',
        'positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}',
        '{...runtimeRootProps}',
      ],
      blockedSourceSnippets: [
        'content = "Tooltip content"',
      ],
      requiredStorySnippets: [
        "names: ['TooltipContent', 'TooltipTrigger']",
        "names: ['Button']",
        '<TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger><TooltipContent align="center" side="top" sideOffset={4}>Tooltip content</TooltipContent>',
      ],
      blockedStorySnippets: [
        '<TooltipTrigger render={<button type="button" />}>Hover me</TooltipTrigger><TooltipContent side="top">',
      ],
    },
    {
      component: 'HoverCard',
      sourceFile: 'src/components/ui/hover-card.tsx',
      storyFile: 'src/components/ui/hover-card.stories.tsx',
      requiredSourceSnippets: [
        'getHoverCardSimpleModeChildren(children as React.ReactNode)',
        'splitWorkbenchRuntimeRootProps',
        'const useSimpleMode = simpleModeChildren !== null || children == null || content !== undefined',
        'render={<Button variant="outline" />}',
        'useWorkbenchPortalContainer',
        'container={portalContainer}',
        'positionMethod={positionMethod ?? (portalContainer ? "fixed" : undefined)}',
        '{...runtimeRootProps}',
      ],
      blockedSourceSnippets: [
        'content = "Hover card content"',
      ],
      requiredStorySnippets: [
        "names: ['HoverCardContent', 'HoverCardTrigger']",
        "names: ['Button']",
        '<HoverCardTrigger render={<Button variant="outline" />}>Preview</HoverCardTrigger><HoverCardContent align="center" side="bottom" sideOffset={4}>Hover card content</HoverCardContent>',
      ],
      blockedStorySnippets: [
        '<HoverCardTrigger render={<button type="button" />}>Preview</HoverCardTrigger><HoverCardContent>',
      ],
    },
    {
      component: 'Attachment',
      sourceFile: 'src/components/ui/attachment.tsx',
      storyFile: 'src/components/ui/attachment.stories.tsx',
      allowsGeneratedChildren: true,
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"',
        'type AttachmentMediaVariant = "icon" | "image"',
        'type AttachmentGroupGap = "sm" | "md" | "lg"',
        'type AttachmentGroupLayout = "scroll" | "wrap" | "stack"',
        'relative flex h-fit w-fit max-w-full min-w-0 shrink-0 self-start',
        'fileName?: string',
        'fileMeta?: string',
        'progress?: number',
        'statusText?: string',
        'mediaVariant?: AttachmentMediaVariant',
        'iconName?: string',
        'imageSrc?: string',
        'imageAlt?: string',
        'showAction?: boolean',
        'vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30"',
        'const effectiveSize = orientation === "horizontal" ? size : "default"',
        'data-size={orientation === "horizontal" ? size : undefined}',
        'data-progress={normalizedProgress ?? undefined}',
        'const hasAuthoredChildren = React.Children.count(children) > 0',
        '<AttachmentTrigger aria-label={`Open ${fileName}`} />',
        '<AttachmentMedia',
        '<AttachmentTitle>{fileName}</AttachmentTitle>',
        '<AttachmentDescription>{description}</AttachmentDescription>',
        'group-data-[size=xs]/attachment:hidden',
        'const isUploading = state === "uploading"',
        'loading={isUploading}',
        'function getAttachmentDescriptionText',
        'return progress === null ? label : `${label} · ${progress}%`',
        'function normalizeAttachmentProgress',
        'function AttachmentIconGlyph',
        '<AttachmentIconGlyph className="size-3" name={iconName} />',
        'getAttachmentMediaIconName(state, iconName, variant)',
        'if (state === "uploading") return "loader-circle"',
        'const attachmentGroupVariants = cva("min-w-0 py-1"',
        'layout?: AttachmentGroupLayout',
        'snap?: boolean',
        'data-layout={layout}',
        'attachmentGroupVariants({ gap, layout })',
        'import "./attachment.css"',
        'render?: React.ReactElement | ((props: React.ComponentProps<"button">) => React.ReactElement)',
      ],
      blockedSourceSnippets: [
        'RiFileTextLine',
        'RiCloseLine',
        '@remixicon/react',
        'group-data-[state=processing]/attachment:animate-pulse',
        'group-data-[state=uploading]/attachment:animate-pulse',
        'loading={state === "uploading"}',
        'has-data-[slot=attachment-content]:w-full',
        'vertical: "w-60',
        'group-data-[orientation=vertical]/attachment:rounded-xl',
      ],
      requiredStorySnippets: [
        'fileName: \'sales-report.pdf\'',
        'fileMeta: \'PDF · 2.4 MB\'',
        'progress: 64',
        'statusText: \'\'',
        "mediaVariant: 'icon'",
        "iconName: 'file-text'",
        "imageSrc: DEFAULT_IMAGE_SRC",
        "showAction: true",
        "actionIconName: 'x'",
        "const GROUP_LAYOUTS = ['scroll', 'wrap', 'stack'] as const",
        "const GROUP_GAPS = ['sm', 'md', 'lg'] as const",
        "const GROUP_PROPS = {\n  layout: 'scroll',\n  gap: 'md',\n  snap: true,",
        "progress: {\n      control: { max: 100, min: 0, step: 1, type: 'number' }",
        "when: { key: 'state', value: 'uploading' }",
        "when: { key: 'state', value: ['idle', 'uploading', 'processing', 'error'] }",
        "mediaVariant: { control: 'select'",
        "iconName: { control: 'icon'",
        "picker: 'asset-token'",
        "assetKinds: ['image']",
        "when: { key: 'mediaVariant', value: 'image' }",
        "showAction: { control: 'boolean'",
        "actionIconName: { control: 'icon'",
        'sourceInsert: {\n    props: DEFAULT_PROPS',
        'progress={asNumber(args.progress, DEFAULT_PROPS.progress, { max: 100, min: 0 })}',
        'showAction={asBoolean(args.showAction, DEFAULT_PROPS.showAction)}',
        'fileName={asText(args.fileName, DEFAULT_PROPS.fileName)}',
        'fileMeta={asText(args.fileMeta, DEFAULT_PROPS.fileMeta)}',
        'mediaVariant={mediaVariant}',
        'export const AttachmentGroupStory =',
        'args: GROUP_PROPS',
        'props: GROUP_PROPS',
        "layout: { control: 'select'",
        "gap: { control: 'select'",
        "snap: { control: 'boolean'",
        'layout={asOption(args.layout, GROUP_LAYOUTS, GROUP_PROPS.layout)}',
        'gap={asOption(args.gap, GROUP_GAPS, GROUP_PROPS.gap)}',
        'snap={asBoolean(args.snap, GROUP_PROPS.snap)}',
        '<Attachment orientation="vertical" mediaVariant="image"',
        'fileName="workspace.png"',
        'fileName="desk-reference.jpg"',
        'fileName="office-reference.jpg"',
        'export const AttachmentStates',
      ],
      blockedStorySnippets: [
        '@remixicon/react',
        'RiFileTextLine',
        'RiCloseLine',
        '<AttachmentTrigger aria-label="Open attachment" /><AttachmentMedia /><AttachmentContent>',
      ],
    },
    {
      component: 'AlertDialog',
      sourceFile: 'src/components/ui/alert-dialog.tsx',
      storyFile: 'src/components/ui/alert-dialog.stories.tsx',
      requiredSourceSnippets: [
        'getAlertDialogFooterChildren(children)',
        'splitWorkbenchRuntimeRootProps',
        'title = "Are you absolutely sure?"',
        'description = "This action cannot be undone. This will permanently delete your account from our servers."',
        'showTrigger = false',
        'renderAlertDialogFooter({',
        'type AlertDialogTriggerProps = AlertDialogPrimitive.Trigger.Props',
        'render={render ?? <Button variant={variant} size={size} />}',
        '{...runtimeRootProps}',
        'variant="outline"',
        'render={<Button variant={variant} size={size} />}',
        '<AlertDialogContent className={contentClassName} size={size}>',
        'fixed inset-0 isolate z-50 bg-black/10',
        'const contentStyle = {',
        'maxWidth: size === "sm" ? "min(calc(100% - 2rem), 20rem)" : "min(calc(100% - 2rem), 24rem)"',
        'rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10',
        '-mx-4 -mb-4 flex gap-2 rounded-b-xl border-t bg-muted/50 p-4',
        'font-heading text-base leading-none font-medium',
        'type AlertDialogSize = "default" | "sm"',
        'AlertDialogContentSizeContext',
        '<AlertDialogContentSizeContext.Provider value={size}>',
        'AlertDialogHeaderMediaContext',
        'const usesDefaultMediaGrid = contentSize === "default" && hasMedia',
        'gridTemplateColumns: "auto minmax(0, 1fr)"',
        'usesDefaultMediaGrid ? "col-start-2" : null',
        'contentSize === "sm"',
        'flex-row justify-end',
        '"[&>*]:min-w-20"',
        'items-start gap-x-4 text-left',
        'size-10 items-center justify-center rounded-md bg-muted',
        'contentSize === "sm" ? "mb-3" : "row-span-2 row-start-1"',
        "*:[svg:not([class*='size-'])]:size-6",
      ],
      blockedSourceSnippets: [
        'gap: "var(--ds-token-workbench-components-alert-dialog-gap)"',
      ],
      requiredStorySnippets: [
        "title: 'Are you absolutely sure?'",
        "description: 'This action cannot be undone. This will permanently delete your account from our servers.'",
        'showMedia: true',
        'showTrigger: false',
        "size: { control: 'select', options: CONTENT_SIZES }",
        "'AlertDialogTrigger',",
        '<AlertDialogTrigger variant="outline">Open alert dialog</AlertDialogTrigger><AlertDialogContent size="default"><AlertDialogHeader><AlertDialogMedia>!',
        '<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>',
        '<AlertDialogDescription>This action cannot be undone. This will permanently delete your account from our servers.</AlertDialogDescription>',
        '<AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Continue</AlertDialogAction>',
        'showTrigger ? (',
        '<AlertDialogTrigger variant="outline">',
        "props: { children: 'Open alert dialog', variant: 'outline', size: 'default' }",
        "{showMedia ? <AlertDialogMedia>{asText(args.media, '!')}</AlertDialogMedia> : null}",
      ],
      blockedStorySnippets: [
        '<AlertDialogTitle><Text',
        '<AlertDialogDescription><Text',
        '<AlertDialogTrigger render={<Button variant="outline" />}>Open alert dialog</AlertDialogTrigger>',
        '<AlertDialogTrigger render={<button type="button" />}>Open alert dialog</AlertDialogTrigger><AlertDialogContent>',
      ],
    },
    {
      component: 'Collapsible',
      sourceFile: 'src/components/ui/collapsible.tsx',
      storyFile: 'src/components/ui/collapsible.stories.tsx',
      requiredSourceSnippets: [
        'getCollapsibleSimpleModeChildren(children)',
        '<CollapsibleTrigger className={triggerClassName}>',
        '<CollapsibleContent className={contentClassName}>',
      ],
      blockedSourceSnippets: [
        'simpleModeChildren ?? "Hidden implementation details."',
      ],
      requiredStorySnippets: [
        "jsxChildren:\n      'Hidden implementation details.'",
        "trigger: 'Advanced details'",
      ],
      blockedStorySnippets: [
        'Hidden implementation details stay available when the user expands this section.',
        '<CollapsibleTrigger>Advanced details</CollapsibleTrigger><CollapsibleContent>',
      ],
    },
    {
      component: 'Command',
      sourceFile: 'src/components/ui/command.tsx',
      storyFile: 'src/components/ui/command.stories.tsx',
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'type CommandProps = Omit<React.ComponentProps<typeof CommandPrimitive>, "label">',
        'label="Command menu"',
        'getCommandSimpleModeChildren(children)',
        '<CommandInput placeholder={placeholder} />',
        '<CommandList>{simpleModeChildren}</CommandList>',
        'function CommandOption',
        'function CommandSection',
        'const itemValue = value ?? itemLabel',
      ],
      blockedSourceSnippets: [
        'children ?? <CommandOption value="item-1">Item</CommandOption>',
      ],
      requiredStorySnippets: [
        '<CommandInput placeholder="Placeholder" /><CommandList><CommandEmpty>No results found.</CommandEmpty><CommandSection heading="Options"><CommandOption value="item-1" shortcut="⌘1">Item 1</CommandOption><CommandOption value="item-2" shortcut="⌘2">Item 2</CommandOption></CommandSection></CommandList>',
        '<CommandInput placeholder={DEFAULT_COMMAND_INPUT_PLACEHOLDER} />',
        '<CommandList>',
        'export const CommandOptionStory',
        'export const CommandSectionStory',
      ],
      blockedStorySnippets: [
        "label: 'Command menu'",
        'label={DEFAULT_PROPS.label}',
        'value="components"',
        'value="docs"',
        '<CommandOption>Create component</CommandOption>',
        '<CommandOption>Open asset manager</CommandOption>',
        'jsxChildren:\n      \'<CommandEmpty>No results found.</CommandEmpty><CommandSection',
      ],
    },
    {
      component: 'NativeSelect',
      sourceFile: 'src/components/ui/native-select.tsx',
      storyFile: 'src/components/ui/native-select.stories.tsx',
      blockedSourceSnippets: [
        'type NativeSelectWorkbenchProps',
        'defaultOption',
        'firstOptionLabel',
        'secondOptionLabel',
        'shouldUseDesignDefaultValue',
      ],
      requiredStorySnippets: [
        'jsxChildren:\n      \'<NativeSelectOptGroup label="Options"><NativeSelectOption value="item-1">Item 1</NativeSelectOption><NativeSelectOption value="item-2">Item 2</NativeSelectOption></NativeSelectOptGroup>\'',
        "defaultValue: 'item-1'",
      ],
      blockedStorySnippets: [
        "defaultOption: 'first'",
        'firstOptionLabel',
        'secondOptionLabel',
      ],
    },
    {
      component: 'InputOTP',
      sourceFile: 'src/components/ui/input-otp.tsx',
      storyFile: 'src/components/ui/input-otp.stories.tsx',
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'function InputOTPDigitGroup',
        'arrangeInputOTPDigitGroups(children)',
        'getInputOTPChildrenMaxLength(arrangedChildren)',
        'const effectiveMaxLength = inferredMaxLength',
        'React.Children.toArray(children).filter(isMeaningfulInputOTPChild)',
        'React.cloneElement(child, { count, start })',
      ],
      requiredStorySnippets: [
        "names: ['InputOTPDigitGroup', 'InputOTPSeparator']",
        '<InputOTPDigitGroup count={3} /><InputOTPSeparator /><InputOTPDigitGroup count={3} />',
        'defaultValue: DEFAULT_PROPS.defaultValue',
        'maxLength: DEFAULT_PROPS.maxLength',
        "defaultValue: '123456'",
        'defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue).slice(0, maxLength)}',
        'export const InputOTPDigitGroupStory',
      ],
      blockedStorySnippets: [
        'props: {\n      ...DEFAULT_PROPS,\n    }',
        "value: '123456'",
        'value={asText(args.value',
        'value="123456"',
        'value="123"',
        'value="12"',
        'value="1"',
        '<InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup><InputOTPSeparator /><InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>',
      ],
    },
    {
      component: 'NavigationMenu',
      sourceFile: 'src/components/ui/navigation-menu.tsx',
      storyFile: 'src/components/ui/navigation-menu.stories.tsx',
      requiredSourceSnippets: [
        'function NavigationMenuPanelItem',
        'function NavigationMenuLinkItem',
        'getNavigationMenuSimpleModeChildren(children)',
        '<NavigationMenuList>{simpleModeChildren}</NavigationMenuList>',
        '<NavigationMenuIndicator />',
      ],
      blockedSourceSnippets: [
        'children ?? <NavigationMenuLink href="#">Link</NavigationMenuLink>',
        'children = "Link"',
        'trigger = "Item"',
      ],
      requiredStorySnippets: [
        "names: ['NavigationMenuPanelItem', 'NavigationMenuLink', 'NavigationMenuLinkItem']",
        "defaultValue: 'item-1'",
        'defaultValue={defaultValue}',
        '<NavigationMenuPanelItem value="item-1" trigger="Item"><NavigationMenuLink href="#">Link</NavigationMenuLink></NavigationMenuPanelItem><NavigationMenuLinkItem value="item-2" href="#">Link</NavigationMenuLinkItem>',
        '<NavigationMenuPanelItem value="item-1" trigger="Item">',
        '<NavigationMenuLinkItem value="item-2" href="#">Link</NavigationMenuLinkItem>',
      ],
      blockedStorySnippets: [
        "const DEFAULT_PROPS = {\n  align: 'start',\n  value: 'item-1'",
        'value={value}',
        '<div className="grid w-64 gap-1 p-1">',
        '<NavigationMenuList><NavigationMenuPanelItem',
        '</NavigationMenuList><NavigationMenuIndicator />',
        '<NavigationMenuItem value="item-1"><NavigationMenuTrigger>Item</NavigationMenuTrigger>',
      ],
    },
    {
      component: 'Breadcrumb',
      sourceFile: 'src/components/ui/breadcrumb.tsx',
      storyFile: 'src/components/ui/breadcrumb.stories.tsx',
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'import "./breadcrumb.css"',
        'type BreadcrumbSeparatorKind = "chevron" | "slash" | "dot"',
        'type BreadcrumbProps = React.ComponentProps<"nav">',
        'separator = "chevron"',
        'showEllipsis = false',
        'getBreadcrumbDirectChildren(children)',
        'getDefaultBreadcrumbChildren()',
        'function renderBreadcrumbDirectChildren',
        'function renderBreadcrumbSeparatorByKind',
        'wb-breadcrumb-separator-dot',
        'BREADCRUMB_DIRECT_CHILD_TYPES',
        'className: cn("wb-breadcrumb-link", className)',
        'function BreadcrumbSeparatorIcon',
        'function BreadcrumbEllipsisIcon',
      ],
      blockedSourceSnippets: [
        '@remixicon/react',
        '[&>svg]:size-3.5',
        '[&>svg]:size-4',
        'wrap-break-word',
        'homeLabel = "Home"',
        'showParent = true',
        'function renderFinishedBreadcrumbItems',
      ],
      requiredStorySnippets: [
        "const SEPARATORS = ['chevron', 'slash', 'dot'] as const",
        "separator: { control: 'select', options: SEPARATORS }",
        "showEllipsis: { control: 'boolean' }",
        "names: ['BreadcrumbLink', 'BreadcrumbPage']",
        '<BreadcrumbLink href="#">Home</BreadcrumbLink><BreadcrumbLink href="#">Parent</BreadcrumbLink><BreadcrumbPage>Current page</BreadcrumbPage>',
        'export const BreadcrumbCompound',
        "names: ['BreadcrumbList', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbSeparator', 'BreadcrumbPage']",
        'href: textArgType',
        "href: '#'",
        'export const BreadcrumbCustomSeparator',
      ],
      blockedStorySnippets: [
        '<BreadcrumbLink href="#">Section</BreadcrumbLink>',
        '<BreadcrumbLink render={<a href="#" />}>Home</BreadcrumbLink>',
        'const ROOT_PROPS = {',
        'homeHref: DEFAULT_PROPS.homeHref',
      ],
    },
    {
      component: 'Pagination',
      sourceFile: 'src/components/ui/pagination.tsx',
      storyFile: 'src/components/ui/pagination.stories.tsx',
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'getPaginationSimpleModeChildren(children)',
        '<PaginationContent>{renderPaginationSimpleModeChildren(simpleModeChildren)}</PaginationContent>',
        'PAGINATION_DIRECT_ITEM_CHILD_TYPES',
      ],
      requiredStorySnippets: [
        "names: ['PaginationPrevious', 'PaginationLink', 'PaginationNext']",
        '<PaginationPrevious href="#" /><PaginationLink href="#" isActive>1</PaginationLink><PaginationNext href="#" />',
      ],
      blockedStorySnippets: [
        '<PaginationLink href="#" isActive>2</PaginationLink>',
        '<PaginationLink href="#">3</PaginationLink>',
        '<PaginationContent><PaginationItem><PaginationPrevious href="#" /></PaginationItem><PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem><PaginationItem><PaginationNext href="#" /></PaginationItem></PaginationContent>',
      ],
    },
    {
      component: 'Menubar',
      sourceFile: 'src/components/ui/menubar.tsx',
      storyFile: 'src/components/ui/menubar.stories.tsx',
      requiredSourceSnippets: [
        'getMenubarMenuSimpleModeChildren(children as React.ReactNode)',
        'splitWorkbenchRuntimeRootProps',
        'modal: _modal',
        '<DropdownMenu data-slot="menubar-menu" {...componentProps} modal={undefined}>',
        '<MenubarTrigger className={triggerClassName} {...runtimeRootProps}>{trigger}</MenubarTrigger>',
        '<MenubarContent className={contentClassName}>',
        'defaultValue = "item-1"',
        '<MenubarSub {...componentProps}>',
        'inset={inset}\n        {...runtimeRootProps}',
      ],
      blockedSourceSnippets: [
        'checked={checked}',
        'value={value} {...props}',
        'children ?? <MenubarItem>Item</MenubarItem>',
        'children ?? <MenubarRadioItem value="item-1">Item</MenubarRadioItem>',
      ],
      requiredStorySnippets: [
        "'MenubarTrigger'",
        "'MenubarContent'",
        "'MenubarSubTrigger'",
        "'MenubarSubContent'",
        '<MenubarMenu defaultOpen><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarLabel>Options</MenubarLabel><MenubarItem>New</MenubarItem><MenubarSeparator /><MenubarCheckboxItem defaultChecked>Show grid</MenubarCheckboxItem><MenubarSub><MenubarSubTrigger>Export</MenubarSubTrigger><MenubarSubContent><MenubarItem>PNG</MenubarItem></MenubarSubContent></MenubarSub><MenubarRadioSection defaultValue="item-1"><MenubarRadioItem value="item-1">Item 1</MenubarRadioItem><MenubarRadioItem value="item-2">Item 2</MenubarRadioItem></MenubarRadioSection></MenubarContent></MenubarMenu>',
        'defaultChecked: true',
        "defaultValue: 'item-1'",
        "props: {\n      defaultOpen: true,",
      ],
      blockedStorySnippets: [
        '<MenubarCheckboxItem checked>',
        '<MenubarRadioSection value="item-1">',
        '<MenubarRadioGroup value="item-1">',
        '<MenubarItem>Duplicate</MenubarItem>',
        '<MenubarItem>SVG</MenubarItem>',
        '<MenubarMenu trigger="Edit">',
        'checked: true',
        "props: { value: 'item-1' }",
      ],
    },
    {
      component: 'RadioGroup',
      sourceFile: 'src/components/ui/radio-group.tsx',
      storyFile: 'src/components/ui/radio-group.stories.tsx',
      blockedSourceSnippets: [
        'children = "Item"',
        'type RadioGroupWorkbenchProps',
        'defaultOption',
        'firstOptionLabel',
        'secondOptionLabel',
        'shouldUseDesignDefaultValue',
      ],
      requiredStorySnippets: [
        'jsxChildren:\n      \'<RadioGroupOption value="item-1">Item 1</RadioGroupOption><RadioGroupOption value="item-2">Item 2</RadioGroupOption>\'',
        "defaultValue: 'item-1'",
        "names: ['RadioGroupOption']",
      ],
      blockedStorySnippets: [
        "defaultOption: 'first'",
        'firstOptionLabel',
        'secondOptionLabel',
      ],
    },
    {
      component: 'ToggleGroup',
      sourceFile: 'src/components/ui/toggle-group.tsx',
      storyFile: 'src/components/ui/toggle-group.stories.tsx',
      requiredSourceSnippets: [
        'function ToggleGroup',
        'function ToggleGroupItem',
        'spacing = 2',
        'orientation = "horizontal"',
      ],
      requiredStorySnippets: [
        "names: ['ToggleGroupItem']",
        '<ToggleGroupItem value="item-1">Item 1</ToggleGroupItem><ToggleGroupItem value="item-2">Item 2</ToggleGroupItem>',
        "defaultValue: 'item-1'",
        'multiple: false',
        'disabled: false',
        "size: 'default'",
        'spacing: 2',
        'export const ToggleGroupItemStory',
      ],
      blockedStorySnippets: [
        '<ToggleGroupItem value="item-2">Item</ToggleGroupItem>',
        '<ToggleGroupItem value="item-3">Item 3</ToggleGroupItem>',
        'defaultValue: "[\'item-1\']"',
      ],
    },
    {
      component: 'Resizable',
      sourceFile: 'src/components/ui/resizable.tsx',
      storyFile: 'src/components/ui/resizable.stories.tsx',
      requiredSourceSnippets: [
        'function ResizableSplit',
        'renderResizableSplitChildren(children, withHandle, handleClassName)',
        'return childArray.flatMap((child, index) => (',
        '<ResizableHandle',
      ],
      blockedSourceSnippets: [
        '<ResizablePanel key="preview"',
        '<ResizablePanel key="inspector"',
      ],
      requiredStorySnippets: [
        'component: ResizableSplit',
        "names: ['ResizablePanel']",
        '<ResizablePanel defaultSize={55}>Preview</ResizablePanel><ResizablePanel defaultSize={45}>Inspector</ResizablePanel>',
        'export const ResizableSplitStory',
      ],
      blockedStorySnippets: [
        '<ResizablePanel defaultSize={55}>Preview</ResizablePanel><ResizableHandle withHandle /><ResizablePanel defaultSize={45}>Inspector</ResizablePanel>',
      ],
    },
    {
      component: 'FieldSet',
      sourceFile: 'src/components/ui/field.tsx',
      storyFile: 'src/components/ui/field.stories.tsx',
      requiresDefaultProps: false,
      requiredSourceSnippets: [
        'function FieldSet',
        'function FieldGroup',
        'function Field',
      ],
      requiredStorySnippets: [
        "names: ['FieldLegend', 'FieldGroup', 'Field', 'FieldLabel', 'FieldDescription']",
        '<FieldLegend>Details</FieldLegend><FieldGroup><Field><FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription></Field></FieldGroup>',
        "names: ['Field', 'FieldLabel', 'FieldDescription']",
        '<Field><FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription></Field>',
      ],
      blockedStorySnippets: [
        '<FieldLegend>Details</FieldLegend><FieldGroup />',
        '<Field><FieldLabel>Name</FieldLabel></Field>',
      ],
    },
    {
      component: 'Field',
      sourceFile: 'src/components/ui/field.tsx',
      storyFile: 'src/components/ui/field.stories.tsx',
      requiredSourceSnippets: [
        'function Field({',
        'className,',
        'data-slot="field"',
      ],
      requiredStorySnippets: [
        "names: ['FieldLabel', 'FieldDescription']",
        '<FieldLabel>Name</FieldLabel><Input placeholder="Enter a name" /><FieldDescription>Helper text</FieldDescription>',
        "'data-invalid': false",
      ],
      blockedStorySnippets: [
        "asBoolean(args['data-invalid']) ? <FieldError>Name is required.</FieldError> : null",
      ],
    },
    {
      component: 'Empty',
      sourceFile: 'src/components/ui/empty.tsx',
      storyFile: 'src/components/ui/empty.stories.tsx',
      requiresDefaultProps: false,
      requiresExplicitChildren: false,
      requiredSourceSnippets: [
        'function EmptyMedia',
        'variant = "default"',
      ],
      requiredStorySnippets: [
        "importSource: '@remixicon/react'",
        "names: ['RiFolderOpenLine']",
        '<EmptyMedia variant="icon"><RiFolderOpenLine /></EmptyMedia><EmptyTitle>No items yet</EmptyTitle>',
        '<Button size="sm">Create item</Button>',
        "jsxChildren: '<RiFolderOpenLine />'",
      ],
      blockedStorySnippets: [
        '<EmptyMedia variant="icon" />',
      ],
    },
    {
      component: 'Item',
      sourceFile: 'src/components/ui/item.tsx',
      storyFile: 'src/components/ui/item.stories.tsx',
      requiresExplicitChildren: false,
      requiredSourceSnippets: [
        'function ItemMedia',
        'function ItemContent',
        'size-8 rounded-sm border bg-muted',
      ],
      requiredStorySnippets: [
        "names: ['RiCheckboxCircleLine']",
        '<ItemMedia variant="icon"><RiCheckboxCircleLine /></ItemMedia><ItemContent><ItemTitle>Item title</ItemTitle><ItemDescription>Item description</ItemDescription></ItemContent>',
        "names: ['RiPaletteLine']",
        "jsxChildren: '<RiPaletteLine />'",
      ],
      blockedStorySnippets: [
        '<ItemMedia variant="icon" />',
      ],
    },
    {
      component: 'CheckboxField',
      sourceFile: 'src/components/ui/checkbox.tsx',
      storyFile: 'src/components/ui/checkbox.stories.tsx',
      requiresExplicitChildren: false,
      requiredSourceSnippets: [
        'function CheckboxField',
        'label?: React.ReactNode',
        'label || description ?',
        'export { Checkbox, CheckboxField }',
      ],
      blockedSourceSnippets: [
        'label = "Checkbox label"',
      ],
      requiredStorySnippets: [
        'component: ShadcnCheckboxField',
        "name: 'CheckboxField'",
        "name: 'Checkbox'",
        'defaultChecked: true',
        "label: 'Checkbox label'",
      ],
      blockedStorySnippets: [
        'component: ShadcnCheckbox,',
        'checked: true',
        "checked: { control: 'boolean' }",
      ],
    },
    {
      component: 'SwitchField',
      sourceFile: 'src/components/ui/switch.tsx',
      storyFile: 'src/components/ui/switch.stories.tsx',
      requiresExplicitChildren: false,
      requiredSourceSnippets: [
        'function SwitchField',
        'label?: React.ReactNode',
        'label || description ?',
        'data-checked:[--wb-switch-thumb-x:calc(var(--wb-switch-track-width)_-_var(--wb-switch-thumb-size)_-_var(--wb-switch-thumb-inset)_-_var(--wb-switch-border-width))]',
        '[transform:translateX(var(--wb-switch-thumb-x))]',
        'export { Switch, SwitchField }',
      ],
      blockedSourceSnippets: [
        'label = "Enable option"',
        'translate-x-[calc(100%-2px)]',
      ],
      requiredStorySnippets: [
        'component: ShadcnSwitchField',
        "name: 'SwitchField'",
        "name: 'Switch'",
        'defaultChecked: true',
        "label: 'Enable preview mode'",
      ],
      blockedStorySnippets: [
        'component: ShadcnSwitch,',
        'checked: true',
        "checked: { control: 'boolean' }",
      ],
    },
    {
      component: 'ButtonGroup',
      sourceFile: 'src/components/ui/button-group.tsx',
      storyFile: 'src/components/ui/button-group.stories.tsx',
      blockedSourceSnippets: [
        'primaryLabel?: string',
        'secondaryLabel?: string',
        '<Button variant="outline">{primaryLabel}</Button>',
        '<Button variant="outline">{secondaryLabel}</Button>',
      ],
      requiredStorySnippets: [
        'jsxChildren: \'<Button variant="outline">Action 1</Button><Button variant="outline">Action 2</Button>\'',
        "names: ['Button']",
      ],
      blockedStorySnippets: [
        'primaryLabel',
        'secondaryLabel',
        '<Button variant="outline">Action</Button><Button variant="outline">Action</Button>',
      ],
    },
    {
      component: 'Table',
      sourceFile: 'src/components/ui/table.tsx',
      storyFile: 'src/components/ui/table.stories.tsx',
      requiresDefaultProps: false,
      requiresExplicitChildren: false,
      requiredSourceSnippets: [
        'function Table({ className, ...props }, ref)',
        'function TableRow({ className, ...props }, ref)',
        'function TableCell({ className, ...props }, ref)',
      ],
      requiredStorySnippets: [
        "names: ['TableCaption', 'TableHeader', 'TableBody', 'TableFooter', 'TableRow', 'TableHead', 'TableCell']",
        '<TableCaption>Table caption</TableCaption><TableHeader><TableRow><TableHead className="w-[180px]">Name</TableHead><TableHead>Status</TableHead><TableHead className="w-24 text-right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="w-[180px]">Item 1</TableCell><TableCell>Ready</TableCell><TableCell className="w-24 text-right">24</TableCell></TableRow><TableRow><TableCell className="w-[180px]">Item 2</TableCell><TableCell>Review</TableCell><TableCell className="w-24 text-right">16</TableCell></TableRow></TableBody><TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">40</TableCell></TableRow></TableFooter>',
        '<TableCell className="w-[180px]">Item 1</TableCell>',
        '<TableCell className="w-[180px]">Item 2</TableCell>',
        '<TableCell className="w-24 text-right">24</TableCell>',
        '<TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">40</TableCell></TableRow></TableFooter>',
      ],
      blockedStorySnippets: [
        '<TableCell className="w-[180px]">Item</TableCell>\n          <TableCell>Ready</TableCell>',
      ],
    },
    {
      component: 'InputGroup',
      sourceFile: 'src/components/ui/input-group.tsx',
      storyFile: 'src/components/ui/input-group.stories.tsx',
      requiredSourceSnippets: [
        'type InputGroupProps',
        'clearLabel?: string',
        'control?: "input" | "textarea"',
        'leadingLabel?: string',
        'placeholder?: string',
        'readOnly?: boolean',
        'showClearButton?: boolean',
        'shortcut?: string',
        'const hasCustomChildren = React.Children.toArray(children).some(isMeaningfulInputGroupChild)',
        '<InputGroupAddon>{leadingLabel}</InputGroupAddon>',
        'placeholder={placeholder}',
        'readOnly={readOnly}',
        'disabled={disabled || readOnly || value.length === 0}',
        '<Icon name="x" position="none" size={14} />',
        'order-first px-2 has-[>button]:pl-1 has-[>kbd]:pl-1.5',
        'order-last px-2 has-[>button]:pr-1 has-[>kbd]:pr-1.5',
        'has-data-[icon=inline-end]:pr-0',
        'has-data-[icon=inline-start]:pl-0',
        'rounded-lg border border-input transition-colors',
        'has-disabled:bg-input/50',
        'dark:bg-input/30',
        'flex items-center gap-2 text-sm shadow-none',
      ],
      requiredStorySnippets: [
        "const CONTROLS = ['input', 'textarea'] as const",
        "control: 'input'",
        "leadingLabel: 'Search'",
        "placeholder: 'Search items'",
        'readOnly: false',
        'showClearButton: false',
        "shortcut: '⌘K'",
        "control: { control: 'select', options: CONTROLS }",
        "readOnly: { control: 'boolean' }",
        "showClearButton: { control: 'boolean' }",
        "sourceInsert: {\n    props: {",
      ],
      blockedStorySnippets: [
        'RiSettings3Line',
        "className: { control: 'text' }",
        'jsxChildren:\n      \'<InputGroupAddon>Search</InputGroupAddon>',
      ],
    },
    {
      component: 'Progress',
      sourceFile: 'src/components/ui/progress.tsx',
      storyFile: 'src/components/ui/progress.stories.tsx',
      requiredStorySnippets: [
        "className: 'w-[min(22rem,100%)]'",
        "className: { control: 'text' }",
        "jsxChildren: '<ProgressLabel>Progress</ProgressLabel><ProgressValue />'",
        'className={asText(args.className, DEFAULT_PROPS.className)}',
      ],
      blockedStorySnippets: [
        "className: 'w-64'",
        '<ShadcnProgress className="w-[min(22rem,100%)]" value={value}>',
      ],
    },
    {
      component: 'Alert',
      sourceFile: 'src/components/ui/alert.tsx',
      storyFile: 'src/components/ui/alert.stories.tsx',
      requiredSourceSnippets: [
        'type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>',
        'icon?: string',
        'showIcon?: boolean',
        'showIcon ? <AlertIcon name={icon} /> : null',
        'data-slot="alert-icon"',
        '__WORKBENCH_DEFAULT_ICON_SOURCES__',
        'import "./alert.css"',
        'data-has-action={hasAction ? "true" : undefined}',
        'normalizedName.startsWith("ri-")',
        'className={cn(alertVariants({ variant }), "wb-alert", className)}',
        'className={cn("wb-alert__action flex items-center", className)}',
        'wb-alert__title',
      ],
      blockedSourceSnippets: [
        'type AlertWorkbenchProps',
        'alertTitle?: string',
        '<AlertTitle>{alertTitle}</AlertTitle>',
        '<AlertDescription>{description}</AlertDescription>',
        'paddingRight: "var(--ds-token-workbench-components-alert-action-space)"',
        'position: "absolute"',
        'top-[var(--ds-token-workbench-components-alert-action-offset-y)]',
        'right-[var(--ds-token-workbench-components-alert-action-offset-x)]',
        'text-[length:var(--ds-token-workbench-components-alert-title-font-size)]',
        'px-[var(--ds-token-workbench-components-alert-padding-x)]',
      ],
      requiredStorySnippets: [
        "icon: { control: 'icon' }",
        "showIcon: { control: 'boolean' }",
        "icon: 'alert-circle'",
        "showIcon: true",
        "names: ['AlertTitle', 'AlertDescription', 'AlertAction']",
        "names: ['Button']",
        "const DEFAULT_TITLE = 'Text'",
        "const DEFAULT_DESCRIPTION = 'Title'",
        "const ACTION_BUTTON_LABEL = 'Button'",
        '<AlertTitle>Text</AlertTitle><AlertDescription>Title</AlertDescription><AlertAction><Button size="xs" variant="default">Button</Button></AlertAction>',
        'export const AlertWithIcon',
        'export const AlertWithAction',
        'export const AlertCustomColor',
        'border-amber-200 bg-amber-50 text-amber-900',
      ],
      blockedStorySnippets: [
        'alertTitle',
        'actionLabel',
        'showAction',
        'RiCheckboxCircleLine',
      ],
    },
    {
      component: 'Card',
      sourceFile: 'src/components/ui/card.tsx',
      storyFile: 'src/components/ui/card.stories.tsx',
      requiredSourceSnippets: [
        'grid shrink-0 auto-rows-min items-start',
        'min-h-0 flex-1 px-(--card-spacing)',
        'mt-auto flex shrink-0 items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)',
      ],
      blockedSourceSnippets: [
        'type CardWorkbenchProps',
        'cardTitle?: string',
        '<CardTitle>{cardTitle}</CardTitle>',
        '<CardContent>{body}</CardContent>',
      ],
      requiredStorySnippets: [
        'jsxChildren:\n      \'<img src="/workbench-assets/icons/lucide-preview/image.svg" alt="Image placeholder" className="aspect-video w-full bg-muted object-contain p-12" /><CardHeader><CardTitle>Quick edit</CardTitle><CardDescription>Use the card slots for structured content and actions.</CardDescription></CardHeader><CardContent><Input defaultValue="Design system" aria-label="Project label" /></CardContent><CardFooter><Button className="w-full" variant="secondary">Save changes</Button></CardFooter>\'',
        "names: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter']",
        "names: ['Input']",
        "names: ['Button']",
      ],
      blockedStorySnippets: [
        'cardTitle',
        'actionLabel',
        'showFooter',
      ],
    },
  ];

  for (const contract of compoundRootContracts) {
    const source = shadcnSourceFiles.get(contract.sourceFile) ?? '';
    const story = shadcnSourceFiles.get(contract.storyFile) ?? '';
    const blockedSourceSnippets = contract.blockedSourceSnippets ?? [];
    const requiredSourceSnippets = contract.requiredSourceSnippets ?? [];
    assert(
      (contract.requiresExplicitChildren === false || source.includes('{children}') || source.includes('children,')) &&
        (contract.allowsGeneratedChildren === true || !source.includes('hasAuthoredChildren')) &&
        requiredSourceSnippets.every((snippet) => source.includes(snippet)) &&
        blockedSourceSnippets.every((snippet) => !source.includes(snippet)),
      `shadcn-base ${contract.component} should keep root props aligned with its source insert contract`,
    );
    assert(
      (contract.requiresDefaultProps === false || story.includes('const DEFAULT_PROPS')) &&
        contract.requiredStorySnippets.every((snippet) => story.includes(snippet)) &&
        contract.blockedStorySnippets.every((snippet) => !story.includes(snippet)),
      `shadcn-base ${contract.component} story should insert real child/API structure instead of fake root content props`,
    );
  }
}

function checkProjectTemplateInstallFreeContracts() {
  const templates = {
    standard: new Map(createWorkbenchProjectSourceFiles({ projectName: 'Default Project', templateId: 'standard' })),
    tailwind: new Map(createWorkbenchProjectSourceFiles({ projectName: 'Legacy Alias Project', templateId: 'tailwind' })),
    'shadcn-base': new Map(createWorkbenchProjectSourceFiles({ projectName: 'Shadcn Project', templateId: 'shadcn-base' })),
    astryx: new Map(createWorkbenchProjectSourceFiles({ projectName: 'Astryx Project', templateId: 'astryx' })),
  };
  const tailwindAliasConfig = new Map(createWorkbenchProjectFiles({
    projectId: 'project-tailwind-alias',
    projectName: 'Tailwind Alias',
    createdAt: '2026-01-01T00:00:00.000Z',
    templateId: 'tailwind',
  })).get('workbench.config.json');
  assert(
    tailwindAliasConfig?.extensions?.projectTemplate?.id === 'standard',
    'legacy tailwind template id should normalize to the default project setup instead of creating a separate mode',
  );

  const projectChrome = read('src/features/workbench-shell/ui/ProjectChrome.tsx');
  assert(
    !projectChrome.includes("id: 'tailwind'") && !projectChrome.includes("label: 'General'"),
    'Initialize project modal should not expose separate General and Tailwind modes',
  );
  assert(
    projectChrome.includes("id: 'astryx'") && projectChrome.includes("label: 'Astryx'"),
    'Initialize project modal should expose the Astryx project template',
  );
  const defaultGuideFiles = new Map(createWorkbenchProjectGuideFiles({ templateId: 'standard' }));
  const defaultProjectGuide = defaultGuideFiles.get('docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md') ?? '';
  const defaultComponentGuide = defaultGuideFiles.get('docs/workbench-agent/WORKBENCH-COMPONENT-AUTHORING.md') ?? '';
  const projectAuthoringSkill = defaultGuideFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/SKILL.md`) ?? '';
  const componentAuthoringSkill = defaultGuideFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/SKILL.md`) ?? '';
  const previewRuntimeSkill = defaultGuideFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/SKILL.md`) ?? '';
  assert(
    defaultProjectGuide.includes('Workbench does not separate General and Tailwind authoring modes') &&
      defaultProjectGuide.includes('Tailwind utility classes and project-owned CSS classes are both valid `className` source'),
    'Default project guide should state that Tailwind and regular classes are one authoring model',
  );
  assert(
    defaultProjectGuide.includes('Do not rewrite custom classes into Tailwind utilities, or Tailwind utilities into custom classes') &&
      defaultProjectGuide.includes('define it in project CSS instead of relying on Workbench host styles'),
    'Default project guide should preserve custom class ownership alongside Tailwind utilities',
  );
  assert(
    defaultProjectGuide.includes('Do not add temporary State or Breakpoint override systems in source') &&
      defaultProjectGuide.includes('Changing a chart type must not overwrite authored CSV/data props') &&
      defaultProjectGuide.includes('Canvas multi-selection uses Shift for additive selection'),
    'Default project guide should document Workbench-safe source editing, chart data preservation, and current selection behavior',
  );
  assert(
    defaultProjectGuide.includes('## Continuous Guide Loop') &&
      defaultProjectGuide.includes('Do not treat this guide as a one-time startup checklist') &&
      defaultProjectGuide.includes('Before final handoff, scan the changed files against the guide'),
    'Default project guide should require agents to keep the AI guide in the loop throughout the task',
  );
  assert(
    defaultProjectGuide.includes('Do not introduce `.map(...)` merely for DRY') &&
      defaultProjectGuide.includes('`{Map expression}` in the Design canvas is a failed result') &&
      defaultProjectGuide.includes('Components, barrels, and stories must never import or re-export their implementation from `src/workbench-pages/`') &&
      defaultProjectGuide.includes('Do not create a runtime island for ordinary lists, card grids, track rows') &&
      defaultProjectGuide.includes('## Semantic Component Selection Gate') &&
      defaultProjectGuide.includes('A volume or range control should use the registered `Slider`') &&
      defaultProjectGuide.includes('Repeated media rows or track-board entries should use the registered `Item`') &&
      defaultProjectGuide.includes('Reporting is not authorization to implement it') &&
      defaultProjectGuide.includes('Only an approved component-authoring task may change component source') &&
      defaultProjectGuide.includes('Registration is part of creating the asset') &&
      defaultProjectGuide.includes('Use only assets registered in `.workbench/assets.json`'),
    'Default project guide should prioritize designer-editable JSX, forbid reverse page-component ownership, and restrict runtime islands',
  );
  assert(
    defaultComponentGuide.includes('Prefer Tailwind utilities, project-owned classes, and token-backed CSS'),
    'Component authoring guide should allow Tailwind utilities and project-owned classes together',
  );
  assert(
    defaultComponentGuide.includes('Use a local runtime island for Recharts') &&
      defaultComponentGuide.includes('Prefer explicit CSV-like props such as `dataCsv` and `seriesCsv`') &&
      defaultComponentGuide.includes('Selection overlays must not change component layout'),
    'Component authoring guide should document runtime islands, chart CSV props, and non-layout-affecting selection overlays',
  );
  assert(
    defaultComponentGuide.includes('## Continuous Guide Loop') &&
      defaultComponentGuide.includes('Do not read this guide once and then ignore it') &&
      defaultComponentGuide.includes('Before handoff, verify the component still has one honest editable contract'),
    'Component authoring guide should require agents to re-check the guide while component contracts change',
  );
  assert(
    defaultComponentGuide.includes('local arrays and `.map(...)` are not the default for visible repeated UI') &&
      defaultComponentGuide.includes('Do not use an island to hide ordinary cards, lists, rows, controls, forms, navigation') &&
      defaultComponentGuide.includes('A component entry or barrel must not re-export implementation from `src/workbench-pages/`'),
    'Component authoring guide should default design implementation to explicit JSX, reject ordinary runtime islands, and preserve component ownership',
  );
  assert(
    defaultGuideFiles.has(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/agents/openai.yaml`) &&
      defaultGuideFiles.has(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/agents/openai.yaml`) &&
      defaultGuideFiles.has(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/agents/openai.yaml`),
    'Generated Workbench projects should include project-scoped Codex skill UI metadata',
  );
  assert(
    projectAuthoringSkill.includes('name: workbench-project-authoring') &&
      projectAuthoringSkill.includes('docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md') &&
      projectAuthoringSkill.includes('Do not hand-edit `.workbench/components.json`') &&
      projectAuthoringSkill.includes('When source, rendered DOM, or a design artifact is supplied') &&
      projectAuthoringSkill.includes('Search the registered project components by semantic role before coding') &&
      projectAuthoringSkill.includes('Prefer Slider for range/volume, Item for repeated media rows, Carousel for horizontal browsing') &&
      projectAuthoringSkill.includes('Do not create, promote, or extend a component contract from a broad page, catalog, redesign, editability, or cleanup request') &&
      projectAuthoringSkill.includes('Report useful component-promotion candidates without implementing them') &&
      projectAuthoringSkill.includes('Any asset created, copied, downloaded, or generated') &&
      projectAuthoringSkill.includes('Treat `{Map expression}` in the Design canvas as a failed design implementation') &&
      projectAuthoringSkill.includes('Reusable components, barrels, and stories must not import or re-export implementation from `src/workbench-pages`'),
    'Generated Workbench projects should include a project authoring skill with registry hard stops',
  );
  assert(
    componentAuthoringSkill.includes('name: workbench-project-component-authoring') &&
      componentAuthoringSkill.includes('sourceInsert') &&
      componentAuthoringSkill.includes('Do not put Storybook control fields') &&
      componentAuthoringSkill.includes('Reconcile `.workbench` metadata through Workbench import') &&
      componentAuthoringSkill.includes('Explicit JSX is preferred over DRY') &&
      componentAuthoringSkill.includes('Do not create runtime islands for ordinary cards, lists, rows') &&
      componentAuthoringSkill.includes('Stop if the file owns a registered component implementation'),
    'Generated Workbench projects should include a component authoring skill for source/story contracts',
  );
  assert(
    previewRuntimeSkill.includes('name: workbench-project-preview-runtime') &&
      previewRuntimeSkill.includes('Generated CSS comments must never contain raw `*/`') &&
      previewRuntimeSkill.includes('No story preview') &&
      previewRuntimeSkill.includes('CSS order'),
    'Generated Workbench projects should include a preview runtime skill for CSS and story failures',
  );

  for (const templateName of ['standard', 'tailwind']) {
    const files = templates[templateName];
    const packageJson = JSON.parse(files.get('package.json'));
    assert(packageJson.dependencies?.tailwindcss, `${templateName} project should declare Tailwind for developer handoff`);
    assert(packageJson.dependencies?.['@tailwindcss/vite'], `${templateName} project should declare the Tailwind Vite plugin for developer handoff`);
    assert(files.has('src/workbench-tailwind.css'), `${templateName} project should include a Workbench preview CSS snapshot`);
    assert(!files.has('src/workbench-shadcn.css'), `${templateName} project should not include shadcn preview CSS`);
    assert(
      files.get('src/workbench-pages/UntitledPage.tsx')?.includes('className="min-h-screen bg-background'),
      `${templateName} starter page should be composed with Tailwind utility classes`,
    );
    assert(
      !files.get('src/workbench-pages/UntitledPage.tsx')?.includes('wb-basic-page'),
      `${templateName} starter page should not use Workbench-specific sample classes`,
    );
    assert(
      !files.get('src/site.css')?.includes('.wb-basic-page'),
      `${templateName} starter CSS should not include the non-Tailwind sample class stylesheet`,
    );
    assert(
      (files.get('src/workbench-tailwind.css')?.length ?? 0) > 4000,
      `${templateName} preview CSS should include install-free theme/base CSS, not only a header comment`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('--background: var(--ds-token-workbench-semantic-color-background')
        && files.get('src/workbench-tailwind.css')?.includes('--card: var(--ds-token-workbench-semantic-color-card')
        && files.get('src/workbench-tailwind.css')?.includes('--chart-2: var(--ds-token-workbench-semantic-color-chart-2')
        && files.get('src/workbench-tailwind.css')?.includes('--sidebar-primary: var(--ds-token-workbench-semantic-color-sidebar-primary'),
      `${templateName} preview CSS should expose all semantic Tailwind theme color roles while dependency install is pending`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('--color-wb-surface: var(--ds-token-workbench-semantic-color-surface'),
      `${templateName} preview CSS should expose Workbench semantic Tailwind aliases while dependency install is pending`,
    );
    for (const expectedAlias of [
      '--color-blue-500: var(--ds-token-tailwind-primitives-blue-500',
      '--spacing: var(--ds-token-tailwind-primitives-space-1',
      '--radius: var(--ds-token-workbench-semantic-radius-radius',
      '--text-3xl: var(--ds-token-tailwind-primitives-text-3xl',
      '--font-weight-medium: var(--ds-token-workbench-semantic-typography-weight-medium',
      '--leading-normal: var(--ds-token-workbench-semantic-typography-line-normal',
      '--tracking-wide: var(--ds-token-tailwind-primitives-tracking-wide',
      '--shadow-lg: var(--ds-token-workbench-semantic-effect-shadow-lg',
      '--duration-150: var(--ds-token-tailwind-primitives-duration-150',
      '--ease-out: var(--ds-token-tailwind-primitives-ease-out',
    ]) {
      assert(
        files.get('src/workbench-tailwind.css')?.includes(expectedAlias),
        `${templateName} preview CSS should connect ${expectedAlias} to Workbench tokens while dependency install is pending`,
      );
    }
    assert(
      files.get('src/workbench-tailwind.css')?.includes('border: 0 solid;'),
      `${templateName} preview CSS should include the preflight border reset while dependency install is pending`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('font-size: inherit;')
        && files.get('src/workbench-tailwind.css')?.includes('font-weight: inherit;'),
      `${templateName} preview CSS should reset heading typography while dependency install is pending`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('border-collapse: collapse;'),
      `${templateName} preview CSS should reset table borders while dependency install is pending`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('max-width: 100%;')
        && files.get('src/workbench-tailwind.css')?.includes('height: auto;'),
      `${templateName} preview CSS should reset replaced media sizing while dependency install is pending`,
    );
    assert(
      files.get('src/workbench-tailwind.css')?.includes('background-color: transparent;')
        && files.get('src/workbench-tailwind.css')?.includes('border-radius: 0;'),
      `${templateName} preview CSS should reset form control styling while dependency install is pending`,
    );
    assert(
      !files.get('src/workbench-tailwind.css')?.includes('.wb-basic-page'),
      `${templateName} preview CSS should not include non-Tailwind sample class styles`,
    );
  }

  const shadcnPackageJson = JSON.parse(templates['shadcn-base'].get('package.json'));
  assert(shadcnPackageJson.dependencies?.tailwindcss, 'shadcn-base project should declare Tailwind for developer handoff');
  assert(shadcnPackageJson.dependencies?.['@tailwindcss/vite'], 'shadcn-base project should declare the Tailwind Vite plugin for developer handoff');
  assert(templates['shadcn-base'].has('src/workbench-shadcn.css'), 'shadcn-base project should copy a Workbench shadcn preview CSS snapshot');
  assert(!templates['shadcn-base'].has('src/workbench-tailwind.css'), 'shadcn-base project should use the shadcn preview CSS path only');
  assert(
    templates['shadcn-base'].has('public/workbench-assets/fonts/public-sans/public-sans-latin-wght-normal.woff2'),
    'shadcn-base project should include the Public Sans variable font used by its typography tokens',
  );
  assert(
    templates['shadcn-base'].has('public/workbench-assets/fonts/public-sans/OFL-1.1.txt'),
    'shadcn-base project should include the Public Sans license beside the bundled font',
  );
  assert(
    templates['shadcn-base'].get('src/site.css')?.includes("font-family: 'Public Sans Variable';")
      && templates['shadcn-base'].get('src/site.css')?.includes("url('/workbench-assets/fonts/public-sans/public-sans-latin-wght-normal.woff2')"),
    'shadcn-base project CSS should register the bundled Public Sans font for browser and Workbench previews',
  );
  assert(
    !/\[data-slot=["']?card["']?\]\s*\{[^}]*box-shadow:/s.test(templates['shadcn-base'].get('src/site.css') ?? '') &&
      !/\[data-slot=card\]\{[^}]*box-shadow:/s.test(templates['shadcn-base'].get('src/workbench-shadcn.css') ?? ''),
    'shadcn-base Card should preserve the source component default with no forced shadow in source or preview CSS',
  );
  const shadcnAssets = new Map(createWorkbenchProjectFiles({
    projectId: 'shadcn-font-project',
    projectName: 'Shadcn Font Project',
    createdAt: '2026-01-01T00:00:00.000Z',
    templateId: 'shadcn-base',
  })).get('assets.json');
  assert(
    shadcnAssets.assets?.some((asset) => asset.id === 'asset-public-sans-variable' && asset.kind === 'font'),
    'shadcn-base asset registry should include Public Sans as a project font',
  );
  assert(
    shadcnAssets.extensions?.assetDefaults?.fonts?.bodyAssetId === 'asset-public-sans-variable'
      && shadcnAssets.extensions?.assetDefaults?.fonts?.headingAssetId === 'asset-public-sans-variable'
      && shadcnAssets.extensions?.assetDefaults?.fonts?.sansAssetId === 'asset-public-sans-variable',
    'shadcn-base font defaults should use Public Sans for body, heading, and sans slots',
  );

  const astryxPackageJson = JSON.parse(templates.astryx.get('package.json'));
  assert(
    astryxPackageJson.dependencies?.['@astryxdesign/core'] === '0.1.8' &&
      astryxPackageJson.dependencies?.['@astryxdesign/theme-stone'] === '0.1.8' &&
      astryxPackageJson.dependencies?.react === '19.2.7' &&
      astryxPackageJson.dependencies?.['react-dom'] === '19.2.7',
    'Astryx projects should pin the component and React runtime versions used by the bundled wrappers',
  );
  assert(
    templates.astryx.has('src/workbench-pages/SamplePage/CompGallery.tsx') &&
      templates.astryx.has('src/workbench-pages/SamplePage/MusicSample.tsx') &&
      !templates.astryx.has('src/workbench-pages/UntitledPage.tsx'),
    'Astryx projects should start with the two SamplePage examples instead of Untitled page',
  );
  assert(
    templates.astryx.get('src/main.tsx')?.includes(
      "import WorkbenchDesignPage from './workbench-pages/SamplePage/CompGallery';",
    ),
    'Astryx standalone preview should open Comp Gallery by default',
  );
  const astryxCardSource = templates.astryx.get('src/components/AstryxCard.tsx') ?? '';
  const astryxCardStorySource = templates.astryx.get('src/components/AstryxCard.stories.tsx') ?? '';
  assert(
    astryxCardSource.includes('backgroundColor?: string;')
      && astryxCardSource.includes('function isCardFrameUtility')
      && astryxCardSource.includes('function isCardFrameStyleProperty')
      && astryxCardStorySource.includes("backgroundColor: { control: 'color' }")
      && astryxCardStorySource.includes('backgroundColor: DEFAULT_PROPS.backgroundColor,'),
    'Astryx starter cards should preserve the current prop contract and frame/inner layout ownership',
  );
  const astryxTextInputSource = templates.astryx.get('src/components/AstryxTextInput.tsx') ?? '';
  const astryxTextInputStorySource = templates.astryx.get('src/components/AstryxTextInput.stories.tsx') ?? '';
  assert(
    astryxTextInputSource.includes('isLabelHidden?: boolean;')
      && astryxTextInputSource.includes('const resolvedIsLabelHidden = isLabelHidden || !normalizedLabel;')
      && astryxTextInputSource.includes('const inputGroup = useInputGroup();')
      && astryxTextInputSource.includes('if (inputGroup) return input;')
      && astryxTextInputStorySource.includes("isLabelHidden: { control: 'boolean' }"),
    'Astryx starter text inputs should preserve the current first-render label and input-group contracts',
  );
  const astryxWorkbenchFiles = new Map(createWorkbenchProjectFiles({
    projectId: 'astryx-pages-check',
    projectName: 'Astryx Project',
    createdAt: '2026-07-27T00:00:00.000Z',
    templateId: 'astryx',
  }));
  const astryxPagesJson = astryxWorkbenchFiles.get('pages.json');
  assert(
    astryxPagesJson?.pages?.length === 2 &&
      astryxPagesJson.pages.some((page) =>
        page.name === 'Comp Gallery' &&
        page.route === '/comp-gallery' &&
        page.sourceFile === 'src/workbench-pages/SamplePage/CompGallery.tsx'
      ) &&
      astryxPagesJson.pages.some((page) =>
        page.name === 'Music Sample' &&
        page.route === '/music-sample' &&
        page.sourceFile === 'src/workbench-pages/SamplePage/MusicSample.tsx'
      ) &&
      astryxPagesJson.extensions?.pageFolders?.includes('SamplePage'),
    'Astryx pages registry should contain only the two registered SamplePage examples',
  );
  assert(templates.astryx.has('src/components/AstryxTheme.tsx'), 'Astryx project should include project-owned wrapper components');
  const astryxRequiredOfficialWrappers = [
    'AstryxAlertDialog',
    'AstryxCalendar',
    'AstryxChat',
    'AstryxCommandPalette',
    'AstryxContextMenu',
    'AstryxDateRangeInput',
    'AstryxDateTimeInput',
    'AstryxDialog',
    'AstryxLightbox',
    'AstryxMobileNav',
    'AstryxMoreMenu',
    'AstryxNavHeadingMenu',
    'AstryxNavIcon',
    'AstryxOutline',
    'AstryxOverflowList',
    'AstryxOverlay',
    'AstryxPowerSearch',
    'AstryxResizable',
    'AstryxToast',
    'AstryxTokenizer',
    'AstryxTreeList',
    'AstryxTypeahead',
    'AstryxVisuallyHidden',
  ];
  for (const componentName of astryxRequiredOfficialWrappers) {
    assert(
      templates.astryx.has(`src/components/${componentName}.tsx`) &&
        templates.astryx.has(`src/components/${componentName}.stories.tsx`),
      `Astryx starter should include the current official ${componentName} source and story contracts`,
    );
  }
  const astryxComponentGallerySource =
    templates.astryx.get('src/workbench-pages/SamplePage/CompGallery.tsx') ?? '';
  for (const componentName of astryxRequiredOfficialWrappers) {
    assert(
      astryxComponentGallerySource.includes(`<${componentName}`),
      `Astryx starter component gallery should render an editable ${componentName} example`,
    );
  }
  assert(templates.astryx.has('src/astryx.css'), 'Astryx project should include install-free compiled preview CSS');
  assert(
    !templates.astryx.has('src/components/ParticleStage.tsx'),
    'Astryx starter should not ship the ParticleStage demo as a registered component',
  );
  const astryxSourceCss = templates.astryx.get('src/astryx.source.css') ?? '';
  const astryxResizableSource = templates.astryx.get('src/components/AstryxResizable.tsx') ?? '';
  const astryxResizableStory = templates.astryx.get('src/components/AstryxResizable.stories.tsx') ?? '';
  assert(
    astryxResizableSource.includes('const resizeHandle = (')
      && astryxResizableSource.includes('data-astryx-wb-resizable-unresolved="true"')
      && astryxResizableSource.includes('const [projectedPanel, ...projectedContent] = projectedChildren;')
      && astryxResizableSource.includes('{projectedPanel}\n        {resizeHandle}\n        {projectedContent}')
      && astryxResizableSource.includes('const projectedRootStyle = { ...panelStyle, ...rootProps.style };')
      && astryxResizableSource.includes('style={projectedRootStyle}')
      && astryxSourceCss.includes(".astryx-wb-resizable > [role='separator'] .astryx-resize-handle-pill")
      && astryxSourceCss.includes('width: 5px;')
      && astryxSourceCss.includes('height: 40px;'),
    'Astryx resizable should keep a visible runtime separator when Design projection hides child component identity',
  );
  assert(
    astryxResizableSource.includes('hasHandle?: boolean;')
      && astryxResizableSource.includes('hasHandle = true,')
      && astryxResizableSource.includes("data-astryx-wb-resizable-handle={hasHandle ? 'visible' : 'hidden'}")
      && astryxResizableStory.includes('hasHandle: true,')
      && astryxResizableStory.includes("hasHandle: { control: 'boolean' }")
      && astryxSourceCss.includes("[data-astryx-wb-resizable-handle='hidden']")
      && astryxSourceCss.includes('display: none;'),
    'Astryx resizable should let authors hide only the grip pill while preserving the divider contract',
  );
  assert(
    astryxSourceCss.includes("[data-astryx-theme='butter']")
      && astryxSourceCss.includes("[data-astryx-theme='chocolate']")
      && astryxSourceCss.includes("[data-astryx-theme='matcha']")
      && astryxSourceCss.includes("[data-astryx-theme='neutral']")
      && astryxSourceCss.includes("[data-astryx-theme='y2k']")
      && astryxSourceCss.includes('> .astryx-wb-chat-composer-drawer:not(#\\#):not(#\\#):not(#\\#)')
      && astryxSourceCss.includes('> :last-child:not(#\\#):not(#\\#):not(#\\#)')
      && astryxSourceCss.includes('var(--color-background-surface) 88%')
      && astryxSourceCss.includes('var(--color-background-popover) 96%')
      && astryxSourceCss.includes('var(--color-background-surface) 80%')
      && astryxSourceCss.includes('var(--color-background-popover) 92%')
      && astryxSourceCss.includes("[data-astryx-theme='stone']")
      && astryxSourceCss.includes('light-dark(var(--color-warning), var(--color-on-warning))')
      && astryxSourceCss.includes('color: var(--color-on-warning);')
      && astryxSourceCss.includes(".astryx-toast[data-type='info']:not(#\\#):not(#\\#):not(#\\#)")
      && astryxSourceCss.includes('--color-on-dark: var(--color-on-light);')
      && astryxSourceCss.includes("[data-astryx-wb-card-variant='subtle']")
      && astryxSourceCss.includes('var(--color-background-surface) 90%')
      && astryxSourceCss.includes('[data-astryx-theme="butter"] .astryx-badge.neutral {')
      && astryxSourceCss.includes('light-dark(var(--color-text-primary), var(--color-on-accent))'),
    'Astryx composer and toast should preserve layered surfaces and theme-specific foreground contrast',
  );
  assert(
    astryxSourceCss.includes('.astryx-wb-chat-tokenized-text > .astryx-badge {')
      && astryxSourceCss.includes('vertical-align: middle;'),
    'Astryx tokenized message badges should align with adjacent text across theme fonts',
  );
  assert(
    astryxSourceCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr));')
      && astryxSourceCss.includes('.astryx-gallery-card--span-2 {')
      && astryxSourceCss.includes('grid-column: span 2;')
      && astryxSourceCss.includes('.astryx-gallery-grid > .astryx-wb-card-frame > .astryx-wb-card {')
      && astryxSourceCss.includes('height: 100%;')
      && astryxSourceCss.includes('family=Manufacturing+Consent')
      && astryxSourceCss.includes('[data-astryx-theme="gothic"] {')
      && astryxSourceCss.includes('--astryx-theme-name-font-family: "Manufacturing Consent"'),
    'Astryx sample page CSS should preserve the current three-column gallery and equal-height cards',
  );
  assert(
    astryxSourceCss.includes('.astryx-wb-button > span > span:has(> .astryx-wb-button-content) {')
      && astryxSourceCss.includes('overflow: visible;'),
    'Astryx buttons with custom cap-sized label content should preserve descenders',
  );
  assert(
    astryxSourceCss.includes('.astryx-wb-carousel[data-astryx-wb-carousel-snap="true"] > :first-child {')
      && astryxSourceCss.includes('overflow-x: auto !important;')
      && !astryxSourceCss.includes('overflow-x: hidden !important;'),
    'Astryx snap carousels should preserve native horizontal touch scrolling',
  );
  assert(
    astryxSourceCss.includes('.astryx-wb-carousel > :first-child::-webkit-scrollbar {')
      && astryxSourceCss.includes('-ms-overflow-style: none;')
      && astryxSourceCss.includes('scrollbar-width: none;'),
    'Astryx carousel scrollbars should stay hidden without disabling native scrolling',
  );
  assert(
    [...templates.astryx.keys()].filter((fileName) => fileName.startsWith('public/workbench-assets/images/album-samples/') && /\.(?:jpe?g|png)$/i.test(fileName)).length === 5,
    'Astryx project should include only the five bundled geometric samples',
  );
  assert(
    (templates.astryx.get('src/components/AstryxLightbox.stories.tsx') ?? '').includes('/workbench-assets/images/album-samples/geometric-cube.png')
      && (templates.astryx.get('src/workbench-pages/SamplePage/MusicSample.tsx') ?? '').includes('/workbench-assets/images/album-samples/geometric-cube.png'),
    'Astryx stories and sample pages should use bundled geometric artwork',
  );
  assert(
    [...templates.astryx.keys()].filter((fileName) => fileName.startsWith('public/workbench-assets/icons/lucide-preview/') && fileName.endsWith('.svg')).length >= 1900,
    'Astryx project should include the Lucide preview SVG files referenced by its asset registry',
  );
  const astryxIconSource = templates.astryx.get('src/components/AstryxIcon.tsx') ?? '';
  assert(
    astryxIconSource.includes("const defaultWorkbenchIconRoot = '/workbench-assets/icons/lucide-preview';")
      && astryxIconSource.includes('function createDefaultWorkbenchIconSourceKeys(key: string): string[]')
      && astryxIconSource.includes('for (const iconSource of currentSources)')
      && astryxIconSource.includes('`${defaultWorkbenchIconRoot}/${sourceKey}.svg`'),
    'Astryx icons should resolve canonical and aliased Lucide names without the Workbench preview runtime map',
  );
  assert(
    read('scripts/workbench-template.mjs').includes("'dist', 'workbench-assets', 'icons', 'lucide-preview'"),
    'Packaged Workbench should seed Lucide preview SVGs from the bundled renderer assets',
  );
  assert(!templates.astryx.has('src/workbench-pages/Applemusic/AppleMusicApiPage.tsx'), 'Astryx project should not include credential-dependent Apple Music API pages');
  assert(
    ![...templates.astryx.keys()].some((fileName) => /apple-music-token|AppleMusicLoginPage/i.test(fileName)),
    'Astryx project should not include Apple Music token or login setup files',
  );

  for (const [templateId, files] of Object.entries(templates)) {
    assert(!files.has('package-lock.json'), `${templateId} template file list should not ship a package-lock; npm install creates it on disk`);
    assert(files.get('.gitignore')?.includes('node_modules/'), `${templateId} project should ignore installed node_modules`);
    assert(files.get('.gitignore')?.includes('.workbench/.npm-cache/'), `${templateId} project should ignore the project-local npm cache`);
    for (const [fileName, contents] of files) {
      if (!fileName.endsWith('.css')) continue;
      assert(!contents.includes('\\n'), `${templateId} generated ${fileName} should not contain literal escaped newlines`);
    }
  }

  assert(
    templates['shadcn-base'].get('src/site.css')?.includes('@custom-variant data-open {\n'),
    'shadcn-base site CSS should inline shadcn Tailwind helpers with real newlines',
  );
  assert(
      templates['shadcn-base'].get('src/site.css')?.includes('@keyframes attachment-title-shimmer') &&
      templates['shadcn-base'].get('src/site.css')?.includes('[data-slot="attachment"][data-state="uploading"] [data-slot="attachment-title"]') &&
      templates['shadcn-base'].get('src/site.css')?.includes('[data-slot="attachment"][data-state="processing"] [data-slot="attachment-title"]') &&
      templates['shadcn-base'].get('src/site.css')?.includes('--attachment-title-shimmer-interval: var(') &&
      templates['shadcn-base'].get('src/site.css')?.includes('--attachment-title-shimmer-cycle: calc(') &&
      templates['shadcn-base'].get('src/site.css')?.includes('--ease-linear,') &&
      templates['shadcn-base'].get('src/site.css')?.includes('animation: attachment-title-shimmer var(--attachment-title-shimmer-cycle) var(--attachment-title-shimmer-easing) infinite;'),
    'shadcn-base site CSS should include Attachment title shimmer for uploading and processing states',
  );
  assert(
      templates['shadcn-base'].get('src/site.css')?.includes('svg[data-icon="inline-start"][aria-hidden]') &&
      templates['shadcn-base'].get('src/site.css')?.includes('width: 0.875em;') &&
      templates['shadcn-base'].get('src/site.css')?.includes('display: inline-block;') &&
      templates['shadcn-base'].get('src/site.css')?.includes('vertical-align: -0.06em;') &&
      !templates['shadcn-base'].get('src/site.css')?.includes('width: 1rem;'),
    'shadcn-base site CSS should keep inline icon fallback rules text-relative and inline at 0.875em',
  );
  assert(
    (templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('svg[data-icon=inline-start][aria-hidden]') ||
      templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('svg[data-icon="inline-start"][aria-hidden]')) &&
      (templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('width:.875em') ||
        templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('width:0.875em') ||
        templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('width: 0.875em;')) &&
      (templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('display:inline-block') ||
        templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('display: inline-block;')) &&
      (templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('vertical-align:-.06em') ||
        templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('vertical-align: -0.06em;')) &&
      !templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('width:1rem;height:1rem'),
    'shadcn-base preview CSS should keep inline icon fallback rules text-relative and inline at 0.875em',
  );
  assert(
    (templates['shadcn-base'].get('src/workbench-shadcn.css')?.length ?? 0) > 100000,
    'shadcn-base preview CSS should include the compiled Tailwind/shadcn snapshot, not only fallback rules',
  );
  assert(
    templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('.bg-background'),
    'shadcn-base preview CSS should include generated Tailwind color utilities',
  );
  assert(
    templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('.grid'),
    'shadcn-base preview CSS should include generated Tailwind layout utilities',
  );
  for (const expectedAlias of [
    '--background: var(--ds-token-workbench-semantic-color-background',
    '--foreground: var(--ds-token-workbench-semantic-color-foreground',
    '--card: var(--ds-token-workbench-semantic-color-card',
    '--primary: var(--ds-token-workbench-semantic-color-primary',
    '--chart-2: var(--ds-token-workbench-semantic-color-chart-2',
    '--sidebar-primary: var(--ds-token-workbench-semantic-color-sidebar-primary',
  ]) {
    assert(
      templates['shadcn-base'].get('src/site.css')?.includes(expectedAlias),
      `shadcn-base site CSS should connect ${expectedAlias} to semantic Workbench tokens`,
    );
    assert(
      templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes(expectedAlias),
      `shadcn-base preview CSS should connect ${expectedAlias} to semantic Workbench tokens`,
    );
  }
  for (const expectedAlias of [
    '--radius: var(--ds-token-workbench-semantic-radius-radius',
    '--radius-md: calc(var(--radius) * 0.8)',
    '--text-sm: var(--ds-token-workbench-semantic-typography-text-sm-size',
    '--font-weight-medium: var(--ds-token-workbench-semantic-typography-weight-medium',
    '--shadow-lg: var(--ds-token-workbench-semantic-effect-shadow-lg',
    '--color-wb-surface: var(--ds-token-workbench-components-surface',
    '--spacing-wb-dialog-padding: var(--ds-token-workbench-components-dialog-padding',
    '--spacing-wb-select-trigger-height: var(--ds-token-workbench-components-select-trigger-height',
  ]) {
    assert(
      templates['shadcn-base'].get('src/site.css')?.includes(expectedAlias),
      `shadcn-base site CSS should connect ${expectedAlias} to Workbench component tokens`,
    );
    assert(
      templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes(expectedAlias),
      `shadcn-base preview CSS should connect ${expectedAlias} to Workbench component tokens`,
    );
  }
  const shadcnWorkbenchFiles = new Map(createWorkbenchProjectFiles({
    projectId: 'shadcn-project',
    projectName: 'Shadcn Project',
    createdAt: '2026-01-01T00:00:00.000Z',
    templateId: 'shadcn-base',
  }));
  const defaultWorkbenchFiles = new Map(createWorkbenchProjectFiles({
    projectId: 'default-project',
    projectName: 'Default Project',
    createdAt: '2026-01-01T00:00:00.000Z',
    templateId: 'standard',
  }));
  const shadcnTokens = shadcnWorkbenchFiles.get('tokens.json');
  const componentCollection = shadcnTokens.collections.find((collection) => collection.id === 'workbench-components');
  const semanticSpacingCollection = shadcnTokens.collections.find((collection) => collection.id === 'workbench-semantic-spacing');
  const semanticTypographyCollection = shadcnTokens.collections.find((collection) => collection.id === 'workbench-semantic-typography');
  const defaultTokens = defaultWorkbenchFiles.get('tokens.json');
  const defaultComponentCollection = defaultTokens.collections.find((collection) => collection.id === 'workbench-components');
  const defaultPrimitiveCollection = defaultTokens.collections.find((collection) => collection.id === 'tailwind-primitives');
  assert(defaultPrimitiveCollection?.tokens.length >= 400, 'default project should include Tailwind primitive tokens');
  assert(defaultComponentCollection, 'default project should include an empty component token collection');
  assert(defaultComponentCollection.tokens.length === 0, 'default project should not seed shadcn component tokens');
  assert(
    !defaultWorkbenchFiles.get('src/workbench-tokens.css')?.includes('--ds-token-workbench-components-button-height-md'),
    'default project token CSS should not export shadcn component token variables',
  );
  assert(
    templates.standard.get('src/site.css')?.includes('--color-wb-accent: var(--ds-token-workbench-semantic-color-action-primary'),
    'default project site CSS should connect Tailwind aliases to semantic tokens',
  );
  assert(
    read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes('var(--ds-token-tailwind-primitives-${name}'),
    'Tailwind runtime color fallback should resolve default palette classes through primitive tokens',
  );
  assert(
    read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes("utility.startsWith('placeholder-')"),
    'Tailwind runtime should support placeholder color utilities',
  );
  assert(
    read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes("utility.startsWith('caret-')")
      && read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes("utility.startsWith('accent-')"),
    'Tailwind runtime should support common form color utilities',
  );
  assert(
    read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes('isTailwindStrokeWidthValue(value)')
      && read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes("return [`stroke-width: ${value}`];")
      && read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes("if (prefix === 'stroke')")
      && read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes('stroke-width: ${arbitrary.cssValue}'),
    'Tailwind runtime should treat numeric and arbitrary stroke-* utilities as stroke-width, not stroke color',
  );
  assert(
    read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts').includes('getTailwindDivideColorDeclarations'),
    'Tailwind runtime should support divide color utilities on child selectors',
  );
  assert(componentCollection?.groups.length >= 55, 'shadcn-base project should include component token groups for the full catalog');
  assert(componentCollection?.tokens.length >= 550, 'shadcn-base project should include an expanded component token preset');
  assert(semanticSpacingCollection?.tokens.length >= 20, 'shadcn-base project should include semantic spacing tokens');
  assert(
    componentCollection?.tokens.some((token) => token.id === 'badge-height'
      && token.values.default?.kind === 'ref'
      && token.values.default.collectionId === 'workbench-semantic-spacing'
      && token.values.default.tokenId === 'inline-label-height-sm'),
    'shadcn-base Badge height should use the 20px inline-label semantic role instead of the 24px xs control role',
  );
  assert(
    componentCollection?.tokens.some((token) => token.id === 'line-height-xs'
      && token.values.default?.kind === 'ref'
      && token.values.default.collectionId === 'workbench-semantic-typography'
      && token.values.default.tokenId === 'line-xs'),
    'shadcn-base Badge typography should expose the official 16px extra-small line height through the token chain',
  );
  assert(
    semanticSpacingCollection?.tokens.some((token) => token.id === 'inline-label-height-sm'
      && token.values.base?.kind === 'ref'
      && token.values.base.tokenId === 'space-5'
      && token.values.compact?.kind === 'ref'
      && token.values.compact.tokenId === 'space-5'),
    'shadcn-base inline label height should resolve to 20px in both density modes',
  );
  assert(
    semanticTypographyCollection?.tokens.some((token) => token.id === 'line-xs'
      && token.values.base?.kind === 'ref'
      && token.values.base.tokenId === 'leading-4'
      && token.values.compact?.kind === 'ref'
      && token.values.compact.tokenId === 'leading-4'),
    'shadcn-base extra-small line height should resolve to 16px in both typography modes',
  );
  assert(
    semanticSpacingCollection?.tokens.some((token) => token.id === 'floating-layer-gap-sm'),
    'shadcn-base project should include the floating layer spacing role',
  );
  for (const expectedToken of [
    'dialog-padding',
    'dropdown-menu-item-height',
    'dropdown-menu-trigger-gap',
    'tabs-trigger-height',
    'select-trigger-height',
    'checkbox-size',
    'switch-track-width',
    'tooltip-background',
    'alert-title-font-size',
    'accordion-content-gap',
    'navigation-menu-item-height',
    'command-item-height',
    'context-menu-item-height',
    'menubar-item-height',
    'input-group-addon-background',
    'input-otp-slot-size',
    'pagination-item-size',
    'sidebar-width',
    'toggle-selected-background',
    'textarea-min-height',
  ]) {
    assert(
      componentCollection?.tokens.some((token) => token.id === expectedToken),
      `shadcn-base component tokens should include ${expectedToken}`,
    );
  }
  assert(
    templates['shadcn-base'].get('src/workbench-shadcn.css')?.includes('Workbench design-preview CSS snapshot'),
    'shadcn-base preview CSS should identify itself as a copied Workbench snapshot',
  );
  assert(
    !templates['shadcn-base'].get('src/workbench-pages/SaasDashboard.tsx')?.includes('style={{'),
    'shadcn-base starter page should not use inline styles for static layout',
  );
}

function checkBaseUiBackedStarterComponents() {
  const baseUiBackedComponents = {
    Accordion: "@base-ui/react/accordion",
    Avatar: "@base-ui/react/avatar",
    Checkbox: "@base-ui/react/checkbox",
    Input: "@base-ui/react/input",
    Progress: "@base-ui/react/progress",
    RadioGroup: "@base-ui/react/radio-group",
    Separator: "@base-ui/react/separator",
    Slider: "@base-ui/react/slider",
    Switch: "@base-ui/react/switch",
    Tabs: "@base-ui/react/tabs",
  };

  for (const [componentName, importPath] of Object.entries(baseUiBackedComponents)) {
    const source = read(`scripts/workbench-starter/components/${componentName}.tsx`);
    assert(
      source.includes(`from '${importPath}'`),
      `${componentName}.tsx should render through ${importPath}`,
    );
  }
}

function checkStarterStories() {
  const rootInsertStories = ['Alert', 'Accordion', 'Card', 'Tabs', 'Table'];
  for (const componentName of rootInsertStories) {
    const source = read(`scripts/workbench-starter/components/${componentName}.stories.tsx`);
    assert(source.includes('jsxChildren:'), `${componentName} root insertion should create meaningful children`);
  }

  const storyExports = {
    Alert: ['AlertTitle', 'AlertDescription'],
    Card: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    Tabs: ['TabsList', 'TabsTrigger', 'TabsContent'],
    Table: ['TableCaption', 'TableHeader', 'TableBody', 'TableFooter', 'TableRow', 'TableHead', 'TableCell'],
  };

  for (const [componentName, exports] of Object.entries(storyExports)) {
    const source = read(`scripts/workbench-starter/components/${componentName}.stories.tsx`);
    for (const exportName of exports) {
      assert(source.includes(`export const ${exportName} =`), `${componentName}.stories.tsx should expose ${exportName}`);
    }
  }

  const chartPatternStories = read('scripts/workbench-starter/shadcn-base/src/components/ui/chart-patterns.stories.tsx');
  const chartPatterns = read('scripts/workbench-starter/shadcn-base/src/components/ui/chart-patterns.tsx');
  const cardSource = read('scripts/workbench-starter/shadcn-base/src/components/ui/card.tsx');
  for (const exportName of ['AreaChartCard', 'BarChartCard', 'ComposedChartCard', 'LineChartCard', 'PieChartCard', 'RadialChartCard', 'RadarChartCard', 'ScatterChartCard']) {
    assert(chartPatternStories.includes(`export const ${exportName} =`), `chart patterns should expose ${exportName}`);
  }
  assert(
    cardSource.includes('border border-border') &&
      !cardSource.includes('ring-1 ring-foreground/10'),
    'Card should use a real border so chart cards do not clip outline rings inside scrollable layout containers',
  );
  assert(
    chartPatterns.includes('type ChartCardRootProps = React.ComponentProps<"div">') &&
      chartPatterns.includes('}: ChartCardRootProps & {') &&
      chartPatterns.includes('<Card className={className} {...props}>') &&
      !chartPatterns.includes('<section className={className} {...props}>'),
    'Chart card style/className props should land on the visible shadcn Card root',
  );
  for (const expectedProp of [
    'badge',
    'categoryKey',
    'className',
    'dataCsv',
    'footerDescription',
    'footerTitle',
    'height',
    'hideIndicator',
    'hideLabel',
    'primaryColor',
    'primaryKey',
    'primaryLabel',
    'secondaryColor',
    'secondaryKey',
    'secondaryLabel',
    'showGrid',
    'showLegend',
    'showSecondary',
    'showTooltip',
    'seriesCsv',
    'tooltipIndicator',
  ]) {
    assert(chartPatternStories.includes(`${expectedProp}:`), `chart pattern source inserts should expose ${expectedProp}`);
  }
  for (const chartSpecificProp of ['barRadius', 'cornerRadius', 'curveType', 'innerRadius', 'nameKey', 'outerRadius', 'paddingAngle', 'seriesKey', 'showArea', 'showBars', 'showLine', 'showRadiusAxis', 'startAngle', 'endAngle', 'strokeWidth', 'valueKey', 'xKey', 'yKey', 'zKey']) {
    assert(chartPatternStories.includes(`${chartSpecificProp}:`), `chart pattern source inserts should expose ${chartSpecificProp}`);
  }
  assert(chartPatternStories.includes('const barChartArgTypes') && chartPatternStories.includes("layout: { control: 'select', options: LAYOUTS }"), 'Bar chart stories should expose the layout select control');
  assert(chartPatternStories.includes('argTypes: barChartArgTypes'), 'BarChartCard should use bar-specific controls');
  for (const [exportName, argTypeName] of [
    ['AreaChartCard', 'areaChartArgTypes'],
    ['ComposedChartCard', 'composedChartArgTypes'],
    ['LineChartCard', 'lineChartArgTypes'],
    ['PieChartCard', 'pieChartArgTypes'],
    ['RadialChartCard', 'radialChartArgTypes'],
    ['RadarChartCard', 'radarChartArgTypes'],
    ['ScatterChartCard', 'scatterChartArgTypes'],
  ]) {
    assert(chartPatternStories.includes(`export const ${exportName} =`) && chartPatternStories.includes(`argTypes: ${argTypeName}`), `${exportName} should use ${argTypeName} instead of inheriting bar-only controls`);
  }
  assert(
    chartPatterns.includes('const horizontalBars = layout === "horizontal"') &&
      chartPatterns.includes('const rechartsLayout = horizontalBars ? "vertical" : "horizontal"') &&
      chartPatterns.includes('layout={rechartsLayout}'),
    'BarChartCard layout control should map designer-facing horizontal/vertical labels to the correct Recharts layout values',
  );
  assert(
    chartPatterns.includes('dataCsv?: string') &&
      chartPatterns.includes('seriesCsv?: string') &&
      chartPatterns.includes('const defaultCartesianSeriesCsv = "seriesA,Series A; seriesB,Series B"') &&
      chartPatterns.includes('const defaultComposedSeriesCsv = "seriesA,Series A; seriesB,Series B; seriesC,Series C,var(--chart-3)"') &&
      chartPatterns.includes('const defaultScatterSeriesCsv = "groupA,Group A; groupB,Group B"') &&
      chartPatterns.includes('nameKey = "segment"') &&
      chartPatterns.includes('valueKey = "value"') &&
      chartPatterns.includes('function resolveCartesianSeries') &&
      chartPatterns.includes('function resolveCartesianData') &&
      chartPatterns.includes('function resolvePieData') &&
      chartPatterns.includes('function resolveRadialData') &&
      chartPatterns.includes('function resolveScatterData') &&
      chartPatterns.includes('function parseDataRows'),
    'Chart pattern components should expose editable string data props that render real chart data',
  );
  for (const forbiddenChartSnippet of [
    'desktop',
    'mobile',
    'Desktop',
    'Mobile',
    'campaignA',
    'campaignB',
    'Campaign A',
    'Campaign B',
    'Chrome',
    'Safari',
    'Firefox',
    'Browser share',
    'visitors',
  ]) {
    assert(
      !chartPatternStories.includes(forbiddenChartSnippet) &&
        !chartPatterns.includes(forbiddenChartSnippet),
      `chart pattern data contracts should not use old business/sample keys: ${forbiddenChartSnippet}`,
    );
  }
  const chartStories = read('scripts/workbench-starter/shadcn-base/src/components/ui/chart.stories.tsx');
  assert(
    chartStories.includes('seriesA') &&
      chartStories.includes('seriesB') &&
      chartStories.includes("value: 'Series A'") &&
      chartStories.includes("value: 'Series B'") &&
      !chartStories.includes('desktop') &&
      !chartStories.includes('mobile') &&
      !chartStories.includes('Desktop') &&
      !chartStories.includes('Mobile'),
    'Chart utility stories should use neutral series keys consistently across dataKey, config, and legend payloads',
  );
  for (const editableUtilityStory of [
    'scripts/workbench-starter/shadcn-base/src/components/ui/badge.stories.tsx',
    'scripts/workbench-starter/shadcn-base/src/components/ui/button.stories.tsx',
    'scripts/workbench-starter/shadcn-base/src/components/ui/card.stories.tsx',
  ]) {
    assert(read(editableUtilityStory).includes('className'), `${editableUtilityStory} should expose className for designer composition`);
  }
}

function checkShadcnBasePrimaryStoryArgContracts() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const allowedJsxChildrenArgsByFile = new Map([
    ['alert-dialog.stories.tsx', new Set(['description', 'media', 'showMedia', 'showTrigger', 'size', 'title', 'trigger'])],
    ['dialog.stories.tsx', new Set(['actionText', 'cancelText', 'description', 'showAction', 'showCancel', 'showCloseButton', 'showFooter', 'showTrigger', 'size', 'title', 'trigger'])],
  ]);

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const source = read(`scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`);
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const objectByName = collectTopLevelStoryObjects(ast);
    const meta = getDefaultStoryMetaObject(ast, objectByName);
    if (!isStoryObjectExpression(meta)) continue;

    const sourceInsert = getStoryObjectProperty(meta, 'sourceInsert');
    if (!isStoryObjectExpression(sourceInsert)) continue;

    const argKeys = getStoryObjectKeys(getStoryObjectProperty(meta, 'args'), objectByName);
    if (argKeys.length === 0) continue;

    const propKeys = new Set(getStoryObjectKeys(getStoryObjectProperty(sourceInsert, 'props'), objectByName));
    const hasJsxChildren = Boolean(getStoryObjectProperty(sourceInsert, 'jsxChildren'));
    const allowedJsxChildrenArgs = allowedJsxChildrenArgsByFile.get(fileName) ?? new Set();
    const contractLeaks = argKeys.filter((key) => (
      !propKeys.has(key) &&
      !(hasJsxChildren && allowedJsxChildrenArgs.has(key))
    ));

    assert(
      contractLeaks.length === 0,
      `${fileName} root story args should match sourceInsert.props; move child text/content into jsxChildren or child stories: ${contractLeaks.join(', ')}`,
    );
  }
}

function checkShadcnBaseSourceInsertJsxProps() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const jsxPropsByFile = new Map();

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const source = read(`scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`);
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const jsxProps = [];
    traverse(ast, {
      ObjectProperty(pathRef) {
        if (getStoryPropertyName(pathRef.node) !== 'jsxProps') return;
        const value = unwrapStoryExpression(pathRef.node.value);
        if (!isStoryObjectExpression(value)) return;
        for (const property of value.properties) {
          if (property.type !== 'ObjectProperty') continue;
          const propName = getStoryPropertyName(property);
          const propValue = unwrapStoryExpression(property.value);
          if (!propName || propValue?.type !== 'StringLiteral') {
            jsxProps.push(`${propName ?? '(unknown)'}=(non-string)`);
            continue;
          }
          if (!isSafeStoryJsxPropExpression(propValue.value)) jsxProps.push(`${propName}=${propValue.value}`);
        }
      },
    });
    if (jsxProps.length > 0) jsxPropsByFile.set(fileName, jsxProps);
  }

  assert(
    jsxPropsByFile.size === 0,
    `shadcn-base sourceInsert.jsxProps should use safe JSX/literal expressions: ${[...jsxPropsByFile.entries()]
      .map(([fileName, values]) => `${fileName}: ${values.join(', ')}`)
      .join('; ')}`,
  );

  const writebackSource = read('src/domain/document/editableTreeSourceWriteback.ts');
  assert(
    writebackSource.includes('function isSafeJsxLiteralPropExpression') &&
      writebackSource.includes("value.startsWith('[')") &&
      writebackSource.includes('splitSafeJsxArrayItems'),
    'source writeback should allow safe literal JSX prop expressions such as defaultValue arrays',
  );
}

function checkShadcnBaseSourceInsertImportCoverage() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const violations = [];

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const source = read(`scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`);
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const objectByName = collectTopLevelStoryObjects(ast);

    for (const [exportName, storyObject] of objectByName.entries()) {
      const sourceInsert = resolveStoryObjectExpression(getStoryObjectProperty(storyObject, 'sourceInsert'), objectByName);
      if (!isStoryObjectExpression(sourceInsert)) continue;

      const jsxChildren = getStoryObjectStringProperty(sourceInsert, 'jsxChildren');
      if (!jsxChildren) continue;

      const componentName = getStorySourceInsertComponentName(fileName, storyObject, objectByName);
      const importedNames = getSourceInsertImportedComponentNames(sourceInsert, objectByName);
      const missingNames = collectSourceInsertComponentNames(jsxChildren)
        .filter((name) => name !== componentName && !importedNames.has(name));

      if (missingNames.length > 0) {
        violations.push(`${fileName}:${exportName} missing sourceInsert imports for ${missingNames.join(', ')}`);
      }
    }
  }

  assert(
    violations.length === 0,
    `shadcn-base sourceInsert.jsxChildren component tags should be backed by imports: ${violations.join('; ')}`,
  );
}

function getStorySourceInsertComponentName(fileName, storyObject, objectByName) {
  const storyName = getStoryObjectStringProperty(storyObject, 'name');
  if (storyName && /^[A-Z][A-Za-z0-9_$]*$/.test(storyName)) return storyName;
  return getShadcnComponentNameFromStoryFile(fileName, objectByName);
}

function getSourceInsertImportedComponentNames(sourceInsert, objectByName) {
  const imports = resolveStoryObjectExpression(getStoryObjectProperty(sourceInsert, 'imports'), objectByName);
  const names = new Set();
  if (imports?.type !== 'ArrayExpression') return names;

  for (const element of imports.elements) {
    const importObject = resolveStoryObjectExpression(element, objectByName);
    if (!isStoryObjectExpression(importObject)) continue;
    const namesNode = resolveStoryObjectExpression(getStoryObjectProperty(importObject, 'names'), objectByName);
    if (namesNode?.type !== 'ArrayExpression') continue;
    for (const nameNode of namesNode.elements) {
      const value = unwrapStoryExpression(nameNode);
      if (value?.type === 'StringLiteral') names.add(value.value);
    }
  }

  return names;
}

function checkShadcnBaseSourceInsertPropValueTypes() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const violations = [];

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const source = read(`scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`);
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const objectByName = collectTopLevelStoryObjects(ast);

    for (const [storyName, storyObject] of objectByName.entries()) {
      const sourceInsert = getStoryObjectProperty(storyObject, 'sourceInsert');
      if (!isStoryObjectExpression(resolveStoryObjectExpression(sourceInsert, objectByName))) continue;

      const argTypes = getStoryObjectValueTypeMap(getStoryObjectProperty(storyObject, 'args'), objectByName);
      const propTypes = getStoryObjectValueTypeMap(
        getStoryObjectProperty(resolveStoryObjectExpression(sourceInsert, objectByName), 'props'),
        objectByName,
      );

      for (const [propName, propInfo] of propTypes.entries()) {
        if (propInfo.type === 'string' && /^(?:true|false)$/i.test(String(propInfo.value))) {
          violations.push(`${fileName}:${storyName}.${propName} should be a boolean, not ${JSON.stringify(propInfo.value)}`);
          continue;
        }

        const argInfo = argTypes.get(propName);
        if (!argInfo || argInfo.type === propInfo.type) continue;
        violations.push(`${fileName}:${storyName}.${propName} sourceInsert ${propInfo.type} does not match args ${argInfo.type}`);
      }
    }
  }

  assert(
    violations.length === 0,
    `shadcn-base sourceInsert.props should preserve component API value types: ${violations.join('; ')}`,
  );
}

function checkShadcnBaseAspectRatioContract() {
  const component = read('scripts/workbench-starter/shadcn-base/src/components/ui/aspect-ratio.tsx');
  const story = read('scripts/workbench-starter/shadcn-base/src/components/ui/aspect-ratio.stories.tsx');
  const tailwindRuntime = read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts');

  assert(
      component.includes('type AspectRatioValue = number | string') &&
      component.includes('function normalizeAspectRatio') &&
      component.includes('width: "100%"') &&
      component.includes('aspectRatio: resolvedRatio') &&
      !component.includes('className={cn(') &&
      !component.includes('"relative aspect-(--ratio)"'),
    'AspectRatio should accept string ratios and keep the component itself as an unstyled full-width ratio wrapper',
  );
  assert(
    story.includes("ratio: '16/9'") &&
      story.includes("ratio: { control: 'text' }") &&
      story.includes('jsxChildren:') &&
      story.includes('flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-muted') &&
      !story.includes("className: 'w-full overflow-hidden rounded-lg border bg-muted'") &&
      !story.includes('asNumber'),
    'AspectRatio story/sourceInsert should expose ratio as text and keep visual preview styling on explicit children',
  );
  assert(
    tailwindRuntime.includes("utility.startsWith('aspect-(')") &&
      tailwindRuntime.includes('aspect-ratio: var(${value})'),
    'Workbench Tailwind runtime should support Tailwind aspect-(--ratio) variable shorthand',
  );
}

function checkShadcnBaseSourceInsertSelectableValueContracts() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const genericSelectableValueElements = new Set([
    'AccordionItem',
    'AccordionPanel',
    'ComboboxItem',
    'ComboboxOption',
    'CommandItem',
    'CommandOption',
    'ContextMenuRadioItem',
    'DropdownMenuRadioItem',
    'MenubarRadioItem',
    'NativeSelectOption',
    'NavigationMenuItem',
    'NavigationMenuLinkItem',
    'NavigationMenuPanelItem',
    'RadioGroupItem',
    'RadioGroupOption',
    'SelectItem',
    'TabsContent',
    'TabsPane',
    'TabsTrigger',
    'ToggleGroupItem',
  ]);
  const selectableValueStoryNames = new Set(genericSelectableValueElements);
  const forbiddenValueSnippets = [
    'value="dashboard"',
    'value="reports"',
    'value="designer"',
    'value="developer"',
    'value="base"',
    'value="radix"',
    'value="components"',
    'value="docs"',
    'value="overview"',
    'value="settings"',
    'value="new-tab"',
    'value="new-item"',
    'value="left"',
    'value="center"',
    'value="right"',
    "value: 'dashboard'",
    "value: 'reports'",
    "value: 'designer'",
    "value: 'developer'",
    "value: 'base'",
    "value: 'radix'",
    "value: 'components'",
    "value: 'docs'",
    "value: 'overview'",
    "value: 'settings'",
    "value: 'new-tab'",
    "value: 'new-item'",
    "value: 'left'",
    "value: 'center'",
    "value: 'right'",
    "defaultValue: 'dashboard'",
    "defaultValue: 'reports'",
    "defaultValue: 'designer'",
    "defaultValue: 'developer'",
    "defaultValue: 'base'",
    "defaultValue: 'radix'",
    "defaultValue: 'components'",
    "defaultValue: 'docs'",
    "defaultValue: 'overview'",
    "defaultValue: 'settings'",
    'defaultValue: "[\'left\']"',
    'defaultValue: "[\'center\']"',
    'defaultValue: "[\'right\']"',
  ];
  const violations = [];

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const relativePath = `scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`;
    const source = read(relativePath);
    for (const snippet of forbiddenValueSnippets) {
      if (source.includes(snippet)) violations.push(`${fileName} contains legacy selectable value ${snippet}`);
    }
    const indistinctGenericLabelPattern = /<([A-Z][A-Za-z0-9_$]*)[^>]*\svalue="item-([2-9]\d*)"[^>]*>\s*Item\s*<\/\1>/g;
    for (const match of source.matchAll(indistinctGenericLabelPattern)) {
      const elementName = match[1];
      const itemIndex = match[2];
      if (elementName && genericSelectableValueElements.has(elementName)) {
        violations.push(`${fileName}:${elementName} value item-${itemIndex} should use a distinct visible label, not "Item"`);
      }
    }

    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const objectByName = collectTopLevelStoryObjects(ast);

    for (const [storyName, storyObject] of objectByName.entries()) {
      const sourceInsert = resolveStoryObjectExpression(getStoryObjectProperty(storyObject, 'sourceInsert'), objectByName);
      if (!isStoryObjectExpression(sourceInsert)) continue;

      const props = getStoryObjectValueTypeMap(getStoryObjectProperty(sourceInsert, 'props'), objectByName);
      const jsxProps = getStoryObjectStringRecord(getStoryObjectProperty(sourceInsert, 'jsxProps'), objectByName);
      const jsxChildren = getStoryObjectStringProperty(sourceInsert, 'jsxChildren');
      const selectableValues = collectSourceInsertSelectableValues(jsxChildren, genericSelectableValueElements);

      for (const { elementName, value } of selectableValues) {
        if (!/^item-\d+$/.test(value)) {
          violations.push(`${fileName}:${storyName}.${elementName} should use item-* value, not ${JSON.stringify(value)}`);
        }
      }

      const jsxValueSet = new Set(selectableValues.map((item) => item.value));
      for (const propName of ['defaultValue', 'value']) {
        const propInfo = props.get(propName);
        if (!propInfo || propInfo.type !== 'string' || jsxValueSet.size === 0) continue;
        if (propName === 'defaultValue' && propInfo.value === '') continue;
        if (!jsxValueSet.has(propInfo.value)) {
          violations.push(`${fileName}:${storyName}.${propName}=${JSON.stringify(propInfo.value)} is not present in sourceInsert.jsxChildren values`);
        }
      }
      for (const propName of ['defaultValue', 'value']) {
        const propValue = jsxProps[propName];
        if (!propValue || jsxValueSet.size === 0) continue;
        for (const selectableValue of parseSafeJsxSelectablePropValues(propValue)) {
          if (!jsxValueSet.has(selectableValue)) {
            violations.push(`${fileName}:${storyName}.jsxProps.${propName}=${JSON.stringify(selectableValue)} is not present in sourceInsert.jsxChildren values`);
          }
        }
      }

      const componentName = storyName.endsWith('Story') ? storyName.slice(0, -'Story'.length) : storyName;
      if (selectableValueStoryNames.has(componentName)) {
        const propInfo = props.get('value');
        if (!propInfo || propInfo.type !== 'string') {
          violations.push(`${fileName}:${storyName} should provide sourceInsert.props.value`);
        } else if (!/^item-\d+$/.test(propInfo.value)) {
          violations.push(`${fileName}:${storyName}.value should use item-* value, not ${JSON.stringify(propInfo.value)}`);
        }
      }
    }
  }

  assert(
    violations.length === 0,
    `shadcn-base selectable sourceInsert values should stay generic and match default values: ${violations.join('; ')}`,
  );
}

function resolveStoryObjectExpression(node, objectByName, seen = new Set()) {
  const object = unwrapStoryExpression(node);
  if (object?.type === 'Identifier' && objectByName.has(object.name) && !seen.has(object.name)) {
    seen.add(object.name);
    return resolveStoryObjectExpression(objectByName.get(object.name), objectByName, seen);
  }
  return object;
}

function getStoryObjectStringProperty(object, propertyName) {
  const property = getStoryObjectProperty(object, propertyName);
  const value = unwrapStoryExpression(property);
  return value?.type === 'StringLiteral' ? value.value : null;
}

function getStoryObjectStringRecord(node, objectByName) {
  const object = resolveStoryObjectExpression(node, objectByName);
  if (!isStoryObjectExpression(object)) return {};
  const entries = [];
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty') continue;
    const key = getStoryPropertyName(property);
    const value = unwrapStoryExpression(property.value);
    if (key && value?.type === 'StringLiteral') entries.push([key, value.value]);
  }
  return Object.fromEntries(entries);
}

function parseSafeJsxSelectablePropValues(value) {
  const trimmed = value.trim();
  if (isSafeStoryQuotedJsxLiteral(trimmed)) return [unquoteSafeStoryLiteral(trimmed)];
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [];
  return splitSafeStoryJsxArrayItems(trimmed.slice(1, -1).trim())
    .filter(isSafeStoryQuotedJsxLiteral)
    .map(unquoteSafeStoryLiteral);
}

function unquoteSafeStoryLiteral(value) {
  return value.slice(1, -1).replace(/\\(['"\\])/g, '$1');
}

function collectSourceInsertSelectableValues(jsxChildren, selectableElements) {
  if (!jsxChildren) return [];
  const values = [];
  const pattern = /<([A-Z][A-Za-z0-9_$]*)[^<>]*\svalue="([^"]+)"/g;
  for (const match of jsxChildren.matchAll(pattern)) {
    const elementName = match[1];
    const value = match[2]?.trim();
    if (elementName && value && selectableElements.has(elementName)) values.push({ elementName, value });
  }
  return values;
}

function checkShadcnBaseRootSourceInsertChildAllowlists() {
  const storyDir = path.join(root, 'scripts/workbench-starter/shadcn-base/src/components/ui');
  const childAllowlist = parseSourceComponentChildAllowlist();
  const violations = [];

  for (const fileName of readdirSync(storyDir).filter((file) => file.endsWith('.stories.tsx')).sort()) {
    const componentName = getShadcnComponentNameFromStoryFile(fileName);
    const allowedChildren = childAllowlist.get(componentName);
    if (!allowedChildren) continue;

    const source = read(`scripts/workbench-starter/shadcn-base/src/components/ui/${fileName}`);
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const objectByName = collectTopLevelStoryObjects(ast);
    const meta = getDefaultStoryMetaObject(ast, objectByName);
    if (!isStoryObjectExpression(meta)) continue;
    const sourceInsert = resolveStoryObjectExpression(getStoryObjectProperty(meta, 'sourceInsert'), objectByName);
    const jsxChildren = getStoryObjectStringProperty(sourceInsert, 'jsxChildren');
    if (!jsxChildren) continue;

    const disallowedChildren = collectTopLevelSourceInsertComponentNames(jsxChildren)
      .filter((childName) => !allowedChildren.has(childName));
    if (disallowedChildren.length > 0) {
      violations.push(`${fileName}:${componentName} root sourceInsert cannot directly insert ${disallowedChildren.join(', ')}`);
    }
  }

  assert(
    violations.length === 0,
    `shadcn-base root sourceInsert children should match source slot allowlists: ${violations.join('; ')}`,
  );
}

function checkSourceSlotAllowlistRegistryCoverage() {
  const componentNames = new Set(
    ['shadcn-base', 'astryx']
      .flatMap((templateId) => createInitialComponentRegistry({
        createdAt: '2026-01-01T00:00:00.000Z',
        templateId,
      }).components)
      .map((component) => component.extensions?.importName)
      .filter(Boolean),
  );
  const childAllowlist = parseSourceComponentChildAllowlist();
  const missing = [];

  for (const [parentName, childNames] of childAllowlist.entries()) {
    if (!componentNames.has(parentName)) missing.push(`${parentName} parent`);
    for (const childName of childNames) {
      if (!componentNames.has(childName)) missing.push(`${parentName} -> ${childName}`);
    }
  }

  assert(
    missing.length === 0,
    `source slot allowlist should only reference registered project components: ${missing.join(', ')}`,
  );
}

function parseSourceComponentChildAllowlist() {
  const sourceSlotContainers = read('src/domain/document/sourceSlotContainers.ts');
  const start = sourceSlotContainers.indexOf('const SOURCE_COMPONENT_CHILD_ALLOWLIST');
  const end = sourceSlotContainers.indexOf('const SOURCE_COMPONENT_SINGLE_CHILD_ALLOWLIST');
  assert(start >= 0 && end > start, 'source slot allowlist section should be readable');

  const childAllowlist = new Map();
  const section = sourceSlotContainers.slice(start, end);
  const entryPattern = /\['([^']+)', new Set\(\[([^\]]*)\]\)\]/g;
  for (const match of section.matchAll(entryPattern)) {
    childAllowlist.set(
      match[1],
      new Set([...match[2].matchAll(/'([^']+)'/g)].map((childMatch) => childMatch[1])),
    );
  }
  return childAllowlist;
}

function getShadcnComponentNameFromStoryFile(fileName) {
  const rawName = fileName.replace(/\.stories\.tsx$/, '');
  return rawName
    .split('-')
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
    .join('')
    .replace(/Otp/g, 'OTP');
}

function collectTopLevelSourceInsertComponentNames(jsxChildren) {
  const names = [];
  const stack = [];
  const tagPattern = /<\/?([A-Z][A-Za-z0-9_$]*)\b[^>]*>/g;

  for (const match of jsxChildren.matchAll(tagPattern)) {
    const fullMatch = match[0];
    const tagName = match[1];
    if (fullMatch.startsWith('</')) {
      if (stack.at(-1) === tagName) stack.pop();
      continue;
    }

    if (stack.length === 0 && !names.includes(tagName)) names.push(tagName);
    if (!fullMatch.endsWith('/>')) stack.push(tagName);
  }

  return names;
}

function collectSourceInsertComponentNames(jsxChildren) {
  const names = [];
  const tagPattern = /<\/?([A-Z][A-Za-z0-9_$]*)\b[^>]*>/g;

  for (const match of jsxChildren.matchAll(tagPattern)) {
    const tagName = match[1];
    if (tagName && !names.includes(tagName)) names.push(tagName);
  }

  return names;
}

function getStoryObjectValueTypeMap(node, objectByName, seen = new Set()) {
  const object = resolveStoryObjectExpression(node, objectByName, seen);
  const values = new Map();
  if (!isStoryObjectExpression(object)) return values;

  for (const property of object.properties) {
    if (property.type === 'SpreadElement') {
      for (const [key, value] of getStoryObjectValueTypeMap(property.argument, objectByName, seen)) {
        values.set(key, value);
      }
      continue;
    }
    if (property.type !== 'ObjectProperty') continue;
    const key = getStoryPropertyName(property);
    const value = getStoryLiteralValueType(property.value, objectByName);
    if (key && value) values.set(key, value);
  }

  return values;
}

function getStoryLiteralValueType(node, objectByName) {
  const value = unwrapStoryExpression(node);
  if (!value) return null;
  if (value.type === 'StringLiteral') return { type: 'string', value: value.value };
  if (value.type === 'BooleanLiteral') return { type: 'boolean', value: value.value };
  if (value.type === 'NumericLiteral') return { type: 'number', value: value.value };
  if (value.type === 'NullLiteral') return { type: 'null', value: null };
  if (value.type === 'Identifier' && objectByName.has(value.name)) return { type: 'object', value: value.name };
  if (value.type === 'ArrayExpression') return { type: 'array', value: null };
  return null;
}

function isSafeStoryJsxPropExpression(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('<')) {
    return trimmed.endsWith('>') &&
      !trimmed.includes('\n') &&
      !trimmed.includes('\r') &&
      !trimmed.includes(';');
  }
  return isSafeStoryJsxLiteralPropExpression(trimmed);
}

function isSafeStoryJsxLiteralPropExpression(value) {
  if (/^(?:true|false|null|-?\d+(?:\.\d+)?)$/.test(value)) return true;
  if (isSafeStoryQuotedJsxLiteral(value)) return true;
  if (!value.startsWith('[') || !value.endsWith(']')) return false;

  const inner = value.slice(1, -1).trim();
  if (!inner) return true;
  return splitSafeStoryJsxArrayItems(inner).every((item) => (
    /^(?:true|false|null|-?\d+(?:\.\d+)?)$/.test(item) ||
    isSafeStoryQuotedJsxLiteral(item)
  ));
}

function isSafeStoryQuotedJsxLiteral(value) {
  return /^'(?:[^'\\]|\\['\\])*'$/.test(value) ||
    /^"(?:[^"\\]|\\["\\])*"$/.test(value);
}

function splitSafeStoryJsxArrayItems(value) {
  const items = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      current += character;
      quote = character;
      continue;
    }
    if (character === ',') {
      items.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }

  if (quote || escaped) return ['__unsafe__'];
  items.push(current.trim());
  return items.filter(Boolean);
}

function collectTopLevelStoryObjects(ast) {
  const objectByName = new Map();
  traverse(ast, {
    VariableDeclarator(pathRef) {
      if (pathRef.node.id.type !== 'Identifier') return;
      const init = unwrapStoryExpression(pathRef.node.init);
      if (isStoryObjectExpression(init)) objectByName.set(pathRef.node.id.name, init);
    },
  });
  return objectByName;
}

function getDefaultStoryMetaObject(ast, objectByName) {
  let meta = null;
  traverse(ast, {
    ExportDefaultDeclaration(pathRef) {
      const declaration = unwrapStoryExpression(pathRef.node.declaration);
      meta = declaration?.type === 'Identifier'
        ? objectByName.get(declaration.name) ?? null
        : declaration;
    },
  });
  return meta;
}

function getStoryObjectProperty(objectExpression, name) {
  const object = unwrapStoryExpression(objectExpression);
  if (!isStoryObjectExpression(object)) return null;
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty') continue;
    if (getStoryPropertyName(property) === name) return property.value;
  }
  return null;
}

function getStoryObjectKeys(node, objectByName, seen = new Set()) {
  const object = unwrapStoryExpression(node);
  if (object?.type === 'Identifier' && objectByName.has(object.name) && !seen.has(object.name)) {
    seen.add(object.name);
    return getStoryObjectKeys(objectByName.get(object.name), objectByName, seen);
  }
  if (!isStoryObjectExpression(object)) return [];

  const keys = [];
  for (const property of object.properties) {
    if (property.type === 'SpreadElement') {
      for (const key of getStoryObjectKeys(property.argument, objectByName, seen)) {
        if (!keys.includes(key)) keys.push(key);
      }
      continue;
    }
    if (property.type !== 'ObjectProperty') continue;
    const key = getStoryPropertyName(property);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

function getStoryPropertyName(property) {
  if (property?.type !== 'ObjectProperty') return null;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'StringLiteral') return property.key.value;
  return null;
}

function unwrapStoryExpression(node) {
  let current = node;
  while (current && ['TSAsExpression', 'TSSatisfiesExpression'].includes(current.type)) {
    current = current.expression;
  }
  return current;
}

function isStoryObjectExpression(node) {
  return unwrapStoryExpression(node)?.type === 'ObjectExpression';
}

function checkAllowlistPickerFiltering() {
  const sourceSlotContainers = read('src/domain/document/sourceSlotContainers.ts');
  for (const expected of [
    "['Accordion', new Set(['AccordionPanel', 'AccordionItem'])]",
    "['Alert', new Set(['AlertTitle', 'AlertDescription', 'AlertAction'])]",
    "['AlertDialog', new Set(['AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])]",
    "['AlertDialogContent', new Set(['AlertDialogHeader', 'AlertDialogTitle', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogCancel', 'AlertDialogAction', 'Button'])]",
    "['AlertDialogHeader', new Set(['AlertDialogMedia', 'AlertDialogTitle', 'AlertDialogDescription'])]",
    "['Attachment', new Set(['AttachmentMedia', 'AttachmentContent', 'AttachmentActions', 'AttachmentTrigger'])]",
    "['AttachmentContent', new Set(['AttachmentTitle', 'AttachmentDescription'])]",
    "['AttachmentActions', new Set(['AttachmentAction', 'Button'])]",
    "['AttachmentGroup', new Set(['Attachment'])]",
    "['Bubble', new Set(['BubbleContent', 'BubbleReactions', 'Attachment', 'AttachmentGroup'])]",
    "['CardHeader', new Set(['CardTitle', 'CardDescription', 'CardAction'])]",
    "['Breadcrumb', new Set(['BreadcrumbLink', 'BreadcrumbPage'])]",
    "['Command', new Set(['CommandInput', 'CommandList', 'CommandEmpty', 'CommandSection', 'CommandOption', 'CommandSeparator'])]",
    "['CommandSection', new Set(['CommandOption', 'CommandSeparator'])]",
    "['Combobox', new Set(['ComboboxInput', 'ComboboxSection', 'ComboboxOption', 'ComboboxEmpty', 'ComboboxSeparator', 'ComboboxTrigger', 'ComboboxContent', 'ComboboxChips'])]",
    "['ComboboxTrigger', new Set(['ComboboxValue'])]",
    "['ComboboxContent', new Set(['ComboboxEmpty', 'ComboboxList', 'ComboboxSection', 'ComboboxOption', 'ComboboxSeparator'])]",
    "['ComboboxSection', new Set(['ComboboxOption', 'ComboboxSeparator'])]",
    "['Carousel', new Set(['CarouselSlide', 'CarouselContent', 'CarouselPrevious', 'CarouselNext'])]",
    "['CarouselContent', new Set(['CarouselItem', 'CarouselSlide'])]",
    "['Collapsible', new Set(['Item', 'ItemGroup', 'Button'])]",
    "['ContextMenu', new Set(['ContextMenuTrigger', 'ContextMenuContent', 'ContextMenuGroup', 'ContextMenuLabel', 'ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])]",
    "['ContextMenuContent', new Set(['ContextMenuGroup', 'ContextMenuLabel', 'ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator', 'ContextMenuSub', 'ContextMenuSubmenu'])]",
    "['ContextMenuRadioSection', new Set(['ContextMenuRadioItem'])]",
    "['ContextMenuSubmenu', new Set(['ContextMenuItem', 'ContextMenuCheckboxItem', 'ContextMenuRadioSection', 'ContextMenuSeparator'])]",
    "['DropdownMenu', new Set(['DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuGroup', 'DropdownMenuLabel', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSubmenu'])]",
    "['DropdownMenuContent', new Set(['DropdownMenuGroup', 'DropdownMenuLabel', 'DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator', 'DropdownMenuSub', 'DropdownMenuSubmenu'])]",
    "['DropdownMenuRadioSection', new Set(['DropdownMenuRadioItem'])]",
    "['DropdownMenuSubmenu', new Set(['DropdownMenuItem', 'DropdownMenuCheckboxItem', 'DropdownMenuRadioSection', 'DropdownMenuSeparator'])]",
    "['Dialog', new Set(['DialogTrigger', 'DialogContent', 'DialogPreset', 'DialogFooter', 'DialogClose', 'Button'])]",
    "['DialogContent', new Set(['DialogHeader', 'DialogMedia', 'DialogTitle', 'DialogDescription', 'DialogFooter'])]",
    "['DialogHeader', new Set(['DialogMedia', 'DialogTitle', 'DialogDescription'])]",
    "['DialogPreset', new Set(['Button', 'DialogClose'])]",
    "['Drawer', new Set(['DrawerTrigger', 'DrawerContent', 'DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter', 'DrawerClose', 'Button', 'Item', 'ItemGroup'])]",
    "['FieldSet', new Set(['FieldLegend', 'FieldGroup', 'Field', 'FieldSeparator'])]",
    "['HoverCard', new Set(['HoverCardTrigger', 'HoverCardContent', 'Item', 'ItemGroup', 'Button', 'Badge'])]",
    "['Marker', new Set(['MarkerIcon', 'MarkerContent'])]",
    "['MenubarMenu', new Set(['MenubarTrigger', 'MenubarContent', 'MenubarGroup', 'MenubarLabel', 'MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])]",
    "['MenubarContent', new Set(['MenubarGroup', 'MenubarLabel', 'MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator', 'MenubarSub', 'MenubarSubmenu'])]",
    "['MenubarRadioSection', new Set(['MenubarRadioItem'])]",
    "['MenubarSubmenu', new Set(['MenubarItem', 'MenubarCheckboxItem', 'MenubarRadioSection', 'MenubarSeparator'])]",
    "['Message', new Set(['MessageAvatar', 'MessageContent'])]",
    "['MessageContent', new Set(['MessageHeader', 'Bubble', 'BubbleGroup', 'Attachment', 'AttachmentGroup', 'MessageFooter', 'Marker'])]",
    "['MessageScroller', new Set(['MessageScrollerViewport', 'MessageScrollerButton'])]",
    "['MessageScrollerViewport', new Set(['MessageScrollerContent'])]",
    "['MessageScrollerContent', new Set(['MessageScrollerItem', 'Message', 'MessageGroup', 'Marker'])]",
    "['NativeSelect', new Set(['NativeSelectOption', 'NativeSelectOptGroup'])]",
    "['NativeSelectOptGroup', new Set(['NativeSelectOption'])]",
    "['NavigationMenu', new Set(['NavigationMenuPanelItem', 'NavigationMenuLinkItem'])]",
    "['NavigationMenuList', new Set(['NavigationMenuPanelItem', 'NavigationMenuLinkItem'])]",
    "['NavigationMenuPanelItem', new Set(['NavigationMenuLink', 'Item', 'ItemGroup', 'Button'])]",
    "['Pagination', new Set(['PaginationItem', 'PaginationPrevious', 'PaginationLink', 'PaginationNext', 'PaginationEllipsis'])]",
    "['Popover', new Set(['PopoverTrigger', 'PopoverContent', 'PopoverHeader', 'PopoverTitle', 'PopoverDescription', 'Button', 'Item', 'ItemGroup'])]",
    "['RadioGroup', new Set(['RadioGroupOption', 'RadioGroupItem'])]",
    "['ResizablePanelGroup', new Set(['ResizablePanel', 'ResizableHandle'])]",
    "['ResizableSplit', new Set(['ResizablePanel'])]",
    "['Select', new Set(['SelectGroup', 'SelectItem', 'SelectSeparator', 'SelectTrigger', 'SelectContent'])]",
    "['Sheet', new Set(['SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter', 'SheetClose', 'Button', 'Item', 'ItemGroup'])]",
    "['ToastTrigger', new Set(['Button'])]",
    "['InputOTP', new Set(['InputOTPDigitGroup', 'InputOTPSeparator'])]",
    "['Tabs', new Set(['TabsPane', 'TabsList', 'TabsContent'])]",
    "['TabsList', new Set(['TabsTrigger'])]",
    "['Table', new Set(['TableCaption', 'TableHeader', 'TableBody', 'TableFooter'])]",
    "['TableRow', new Set(['TableHead', 'TableCell'])]",
    "['ToggleGroup', new Set(['ToggleGroupItem'])]",
    "['Tooltip', new Set(['TooltipTrigger', 'TooltipContent', 'Kbd'])]",
  ]) {
    assert(sourceSlotContainers.includes(expected), `source slot allowlist should include ${expected}`);
  }
  assert(
    !sourceSlotContainers.includes("['Card', new Set("),
    'Card should stay an open block container so tables, charts, forms, and other children can be inserted directly',
  );
  assert(
    !sourceSlotContainers.includes("['DialogPortal', new Set("),
    'DialogPortal should stay an internal overlay implementation detail, not a Workbench child slot target',
  );
  assert(
    sourceSlotContainers.includes('if (SOURCE_COMPONENT_CHILD_ALLOWLIST.has(elementName)) return false;'),
    'allowlisted compound parents should not expose generic HTML template insertion',
  );
  assert(
    sourceSlotContainers.includes('SOURCE_COMPONENT_SINGLE_CHILD_ALLOWLIST') &&
      sourceSlotContainers.includes("['Select', new Set(['SelectGroup', 'SelectItem', 'SelectSeparator', 'SelectTrigger', 'SelectContent'])]") &&
      sourceSlotContainers.includes("['Combobox', new Set(['ComboboxInput', 'ComboboxSection', 'ComboboxOption', 'ComboboxEmpty', 'ComboboxSeparator', 'ComboboxTrigger', 'ComboboxContent', 'ComboboxChips'])]") &&
      sourceSlotContainers.includes('SOURCE_COMPONENT_EXCLUSIVE_CHILD_GROUPS') &&
      sourceSlotContainers.includes("['DialogHeader', new Set(['DialogMedia', 'DialogTitle', 'DialogDescription'])]") &&
      sourceSlotContainers.includes("['SheetHeader', new Set(['SheetTitle', 'SheetDescription'])]") &&
      sourceSlotContainers.includes("['DrawerHeader', new Set(['DrawerTitle', 'DrawerDescription'])]") &&
      sourceSlotContainers.includes("['Field', new Set(['FieldLabel', 'FieldContent', 'FieldTitle', 'FieldDescription', 'FieldError'])]") &&
      sourceSlotContainers.includes("['InputGroup', [new Set(['InputGroupInput', 'InputGroupTextarea'])]]") &&
      sourceSlotContainers.includes("['Tabs', new Set(['TabsList'])]") &&
      sourceSlotContainers.includes("['SelectTrigger', new Set(['SelectValue'])]") &&
      sourceSlotContainers.includes("['DropdownMenu', new Set(['DropdownMenuTrigger', 'DropdownMenuContent'])]") &&
      sourceSlotContainers.includes("['DropdownMenuSub', new Set(['DropdownMenuSubTrigger', 'DropdownMenuSubContent'])]") &&
      sourceSlotContainers.includes("['ContextMenu', new Set(['ContextMenuTrigger', 'ContextMenuContent'])]") &&
      sourceSlotContainers.includes("['MenubarMenu', new Set(['MenubarTrigger', 'MenubarContent'])]") &&
      sourceSlotContainers.includes("['Tooltip', new Set(['TooltipTrigger', 'TooltipContent'])]") &&
      sourceSlotContainers.includes('SOURCE_COMPONENT_NESTED_CONTENT_MODES') &&
      sourceSlotContainers.includes("contentName: 'DropdownMenuContent'") &&
      sourceSlotContainers.includes('if (childElementName === nestedContentMode.contentName && hasDirectContent) return false;') &&
      sourceSlotContainers.includes('if (nestedContentMode.directChildNames.has(childElementName) && hasNestedContent) return false;') &&
      sourceSlotContainers.includes("'Spinner'") &&
      sourceSlotContainers.includes('export function canAddSourceChildIntoParent') &&
      sourceSlotContainers.includes('return !existingChildElementNames.includes(childElementName);'),
    'Compound single-slot and exclusive children should not be insertable twice',
  );

  const projectWorkspaceHydrationSource = read('src/features/workbench-shell/ui/ProjectWorkspace.tsx');
  assert(
    projectWorkspaceHydrationSource.includes('projectLocalLibraryHydrationSignatureRef.current = null;') &&
      projectWorkspaceHydrationSource.includes('hydrateProjectLocalLibraries({') &&
      !projectWorkspaceHydrationSource.includes('PROJECT_LOCAL_LIBRARY_AUTO_HYDRATION_COMPONENT_LIMIT'),
    'Background project-local story hydration should run for every registry size behind the input-signature guard',
  );
  const editableTreeParserSource = read('src/domain/document/editableTreeSourceParser.ts');
  assert(
    editableTreeParserSource.includes('importableComponentSummaryCache'),
    'Importable component summaries should be memoized so uncapped hydration re-parses only changed files',
  );
  const registryOperationsSource = read('src/domain/project/workbenchProjectRegistryOperations.ts');
  assert(
    registryOperationsSource.includes('const declaredSlotKind = existing.extensions?.childrenSlotKind;'),
    'Registry reconciliation should preserve declared childrenSlotKind pins that source inference cannot re-derive',
  );

  const designEditor = read('src/features/workbench-shell/ui/DesignEditor.tsx');
  assert(
    designEditor.includes('canAddSourceChildIntoParent(parentJsxName, getComponentSourceExportName(component), existingChildElementNames)') &&
      designEditor.includes('function getSourceChildElementNames') &&
      designEditor.includes('function canAddComponentToSourceParent') &&
      designEditor.includes('SOURCE_INSERT_UNIQUE_VALUE_COMPONENTS') &&
      designEditor.includes("'ComboboxOption'") &&
      designEditor.includes("'CommandOption'") &&
      designEditor.includes("'AccordionPanel'") &&
      designEditor.includes('function prepareSourceInsertComponentProps') &&
      designEditor.includes('function prepareSourceInsertJsxChildren') &&
      designEditor.includes('type PreparedSourceInsertJsxChildren') &&
      designEditor.includes('function prepareSourceInsertPropsWithValueReplacements') &&
      designEditor.includes('function prepareSourceInsertDefaultValueAttributes') &&
      designEditor.includes('valueReplacements.set(currentValue, nextValue)') &&
      designEditor.includes('nextProps.defaultValue = valueReplacements.get(defaultValue.trim()) ?? defaultValue') &&
      designEditor.includes('prepareSourceInsertDefaultValueAttributes(nextJsxChildren, valueReplacements)') &&
      designEditor.includes('function prepareSourceInsertGenericDisplayProps') &&
      designEditor.includes('function prepareSourceInsertGenericDisplayAttributes') &&
      designEditor.includes('function createNextSourceInsertDisplayText') &&
      designEditor.includes('function createNextSourceInsertShortcutText') &&
      designEditor.includes('const preparedJsxChildren = prepareSourceInsertJsxChildren') &&
      designEditor.includes('preparedJsxChildren.valueReplacements') &&
      designEditor.includes('const jsxChildren = preparedJsxChildren.jsxChildren') &&
      designEditor.includes('function createNextSourceInsertChildValue') &&
      designEditor.includes("for (const propName of ['children', 'title', 'trigger'] as const)") &&
      designEditor.includes('setInspectorNotice(`${sourceComponentName} already exists inside ${targetNode.label}.`);'),
    'DesignEditor source insert picker should filter component candidates and keep inserted selectable values/display labels unique, including nested jsxChildren presets',
  );

  const sourceStoryMetadata = read('src/workbench-stories/sourceStoryMetadata.ts');
  assert(
      sourceStoryMetadata.includes('normalizeWorkbenchStorySourceInsertDefaults') &&
      sourceStoryMetadata.includes('normalizeShadcnBaseSourceInsertSelectableValues') &&
      sourceStoryMetadata.includes('getShadcnBaseMappedSourceInsertValue') &&
      sourceStoryMetadata.includes('SHADCN_SOURCE_INSERT_SELECTABLE_VALUE_ELEMENTS') &&
      sourceStoryMetadata.includes('normalizeShadcnBaseSourceInsertJsxProps') &&
      sourceStoryMetadata.includes('replaceQuotedShadcnSourceInsertValues') &&
      sourceStoryMetadata.includes("component.extensions?.sourcePreset") &&
      sourceStoryMetadata.includes("if (componentName.endsWith('Title')) return 'Title';") &&
      sourceStoryMetadata.includes("if (componentName.endsWith('Description')) return 'Description';"),
    'CSF source insert metadata should normalize shadcn default copy and legacy selectable values to neutral contracts',
  );
  assert(
    sourceStoryMetadata.includes('if (options.length > 0) return [{ ...base, options, type:'),
    'CSF controls should expose explicit story enum options as a select',
  );
  assert(
    !/KnownFallbackControlOptions|COMMON_ENUM_PROP_OPTIONS/.test(sourceStoryMetadata),
    'CSF controls must not guess enum options from the prop name -- expose the declared contract, or fall back to the value type',
  );
  assert(
    sourceStoryMetadata.includes('config.options.filter(isWorkbenchStorySelectOption)'),
    'CSF metadata controls should preserve finite numeric select options instead of silently dropping them',
  );
  assert(
    sourceStoryMetadata.includes('normalizeCsfControlSuggestions(config.suggestions)') &&
      sourceStoryMetadata.includes('...(suggestions ? { suggestions } : {})') &&
      sourceStoryMetadata.includes("if (controlType === 'text' && suggestions) return [textControl];"),
    'CSF metadata controls should preserve text suggestions without converting freeform controls into selects',
  );
  assert(
    sourceStoryMetadata.includes('normalizeCsfControlGroupMetadata(config)') &&
      sourceStoryMetadata.includes('normalizeCsfControlBindingMetadata(config)') &&
      sourceStoryMetadata.includes("'assetKinds' | 'picker' | 'tokenTypes'") &&
      sourceStoryMetadata.includes("const validCsfControlPickers: readonly WorkbenchStoryControlPicker[] = ['asset', 'asset-token', 'auto', 'none', 'token']") &&
      sourceStoryMetadata.includes('const assetKinds = normalizeCsfControlAssetKinds(config.assetKinds)') &&
      sourceStoryMetadata.includes('const picker = normalizeCsfControlPicker(config.picker)') &&
      sourceStoryMetadata.includes('const tokenTypes = normalizeCsfControlTokenTypes(config.tokenTypes)'),
    'CSF metadata extraction should preserve grouped controls and asset/token picker bindings from story argTypes',
  );
  assert(
    sourceStoryMetadata.includes('shouldExposeAllCsfControlsForDesign') &&
      sourceStoryMetadata.includes('component.extensions?.designExposeStoryControls === true') &&
      sourceStoryMetadata.includes("function isSourceStylePropKey(key: string): boolean") &&
      sourceStoryMetadata.includes("return key === 'className';") &&
      sourceStoryMetadata.includes('function isShadcnBaseStablePlaceholderText(value: string): boolean') &&
      sourceStoryMetadata.includes("value === 'No results found.'") &&
      sourceStoryMetadata.includes('(?:Content|Item|Option|Page|Panel|Row|Slide|Step|Tab)') &&
      sourceStoryMetadata.includes(".filter((key) => !isSourceStylePropKey(key))") &&
      sourceStoryMetadata.includes(".filter((control) => !isSourceStylePropKey(control.key))") &&
      sourceStoryMetadata.includes("if (isSourceStylePropKey(key)) return [];") &&
      sourceStoryMetadata.includes('mergeDesignStoryControls(exposeStoryControls ? controls : [], sourceInsertControls)') &&
      sourceStoryMetadata.includes('normalizeWorkbenchStoryDesignDefaultArgs(defaultArgs, component)'),
    'CSF source insert metadata should scope design controls to sourceInsert props unless explicitly opted into full story controls, excluding source style props',
  );

  const csfRuntimeLoader = read('src/workbench-stories/csfRuntimeLoader.ts');
  assert(
    csfRuntimeLoader.includes('if (options.length > 0) return [{ ...base, options, type:'),
    'CSF runtime controls should expose explicit story enum options as a select',
  );
  assert(
    !/KnownFallbackControlOptions|COMMON_ENUM_PROP_OPTIONS/.test(csfRuntimeLoader),
    'CSF runtime controls must not guess enum options from the prop name -- expose the declared contract, or fall back to the value type',
  );
  assert(
    csfRuntimeLoader.includes('config.options.filter(isWorkbenchStorySelectOption)'),
    'CSF runtime controls should preserve finite numeric select options instead of silently dropping them',
  );
  assert(
    csfRuntimeLoader.includes('normalizeCsfControlSuggestions(config.suggestions)') &&
      csfRuntimeLoader.includes('...(suggestions ? { suggestions } : {})') &&
      csfRuntimeLoader.includes("if (controlType === 'text' && suggestions) return [textControl];"),
    'CSF runtime controls should preserve text suggestions without converting freeform controls into selects',
  );
  assert(
    csfRuntimeLoader.includes('normalizeCsfControlGroupMetadata(config)') &&
      csfRuntimeLoader.includes('normalizeCsfControlBindingMetadata(config)') &&
      csfRuntimeLoader.includes("'assetKinds' | 'picker' | 'tokenTypes'") &&
      csfRuntimeLoader.includes("const validCsfControlPickers: readonly WorkbenchStoryControlPicker[] = ['asset', 'asset-token', 'auto', 'none', 'token']") &&
      csfRuntimeLoader.includes('const assetKinds = normalizeCsfControlAssetKinds(config.assetKinds)') &&
      csfRuntimeLoader.includes('const picker = normalizeCsfControlPicker(config.picker)') &&
      csfRuntimeLoader.includes('const tokenTypes = normalizeCsfControlTokenTypes(config.tokenTypes)'),
    'CSF runtime loader should preserve grouped controls and asset/token picker bindings from story argTypes',
  );
  assert(
    csfRuntimeLoader.includes('shouldExposeAllCsfControlsForDesign') &&
      csfRuntimeLoader.includes('component.extensions?.designExposeStoryControls === true') &&
      csfRuntimeLoader.includes('normalizeWorkbenchStorySourceInsertDefaults') &&
      csfRuntimeLoader.includes('normalizeShadcnBaseSourceInsertSelectableValues') &&
      csfRuntimeLoader.includes('getShadcnBaseMappedSourceInsertValue') &&
      csfRuntimeLoader.includes('SHADCN_SOURCE_INSERT_SELECTABLE_VALUE_ELEMENTS') &&
      csfRuntimeLoader.includes('normalizeShadcnBaseSourceInsertJsxChildren') &&
      csfRuntimeLoader.includes('normalizeShadcnBaseSourceInsertJsxProps') &&
      csfRuntimeLoader.includes('replaceQuotedShadcnSourceInsertValues') &&
      csfRuntimeLoader.includes("function isSourceStylePropKey(key: string): boolean") &&
      csfRuntimeLoader.includes("return key === 'className';") &&
      csfRuntimeLoader.includes('function isShadcnBaseStablePlaceholderText(value: string): boolean') &&
      csfRuntimeLoader.includes("value === 'No results found.'") &&
      csfRuntimeLoader.includes('(?:Content|Item|Option|Page|Panel|Row|Slide|Step|Tab)') &&
      csfRuntimeLoader.includes(".filter((key) => !isSourceStylePropKey(key))") &&
      csfRuntimeLoader.includes(".filter((control) => !isSourceStylePropKey(control.key))") &&
      csfRuntimeLoader.includes("if (isSourceStylePropKey(key)) return [];") &&
      csfRuntimeLoader.includes('mergeDesignStoryControls(exposeStoryControls ? controls : [], sourceInsertControls)') &&
      csfRuntimeLoader.includes('normalizeWorkbenchStoryDesignDefaultArgs(defaultArgs, component)'),
    'CSF runtime loader should scope design controls to sourceInsert props unless explicitly opted into full story controls, excluding source style props',
  );
  assert(
    csfRuntimeLoader.includes('importStorybookComponentSourceFallback') &&
      csfRuntimeLoader.includes("component.sourceFile") &&
      csfRuntimeLoader.includes("previewSourceFile: component.sourceFile") &&
      csfRuntimeLoader.includes("getTrimmedString(component.extensions?.importName)") &&
      csfRuntimeLoader.includes("getTrimmedString(component.extensions?.sourceExportName)"),
    'CSF runtime loader should fall back to importing the component source when a story module cannot provide a preview',
  );

  const storybookLibrary = read('src/features/workbench-shell/ui/StorybookLibrary.tsx');
  const componentLibraryImport = read('src/domain/project/workbenchComponentLibraryImport.ts');
  assert(
    storybookLibrary.includes("if (key === 'className') return [];") &&
      componentLibraryImport.includes("if (key === 'className' || !key || !label) return [];"),
    'Storybook and component import normalization should keep className out of story controls; className belongs to the CSS Classes surface',
  );
  assert(
    storybookLibrary.includes('candidate.options.filter(isWorkbenchStorySelectOption)'),
    'Storybook control normalization should preserve numeric select options across serialized metadata',
  );
  assert(
    componentLibraryImport.includes('candidate.options.filter(isWorkbenchStorySelectOption)'),
    'Component import normalization should preserve numeric select options across serialized metadata',
  );
  const designInspectorPanel = read('src/features/workbench-shell/ui/DesignInspectorPanel.tsx');
  assert(
    designInspectorPanel.includes("const skip = new Set(['children', 'className', 'key', 'ref']);"),
    'Inspector unmanaged props should also keep className out of Props; className belongs to the CSS Classes surface',
  );
  assert(
    designInspectorPanel.includes('const exactOptionIndex = control.options.findIndex((option) => Object.is(option, value));') &&
      designInspectorPanel.includes('control.options.findIndex((option) => String(option) === String(value))') &&
      designInspectorPanel.includes('const optionIndex = Number(nextValue);') &&
      designInspectorPanel.includes('const option = control.options[optionIndex];') &&
      designInspectorPanel.includes('if (option !== undefined) onCommit(option);'),
    'Inspector select controls should display and write the original numeric or string option type',
  );

  const propRegistry = read('src/workbench-stories/propRegistry.json');
  for (const expected of [
    '"chart": { "label": "Chart"',
    '"dataCsv": { "group": "chart", "label": "Data rows", "order": 5, "picker": "none" }',
    '"seriesCsv": { "group": "chart", "label": "Series rows", "order": 6, "picker": "none" }',
    '"primaryColor": { "group": "appearance", "label": "Primary color", "order": 70, "picker": "token", "tokenTypes": ["color", "string"] }',
    '"secondaryColor": { "group": "appearance", "label": "Secondary color", "order": 80, "picker": "token", "tokenTypes": ["color", "string"] }',
    '"categoryKey": { "group": "chart", "label": "Category key", "order": 10, "picker": "none" }',
    '"primaryLabel": { "group": "chart", "label": "Primary label", "order": 30, "picker": "token", "tokenTypes": ["string"] }',
    '"Avatar": {',
    '"src": { "group": "media", "label": "Image source", "order": 10, "picker": "asset-token", "assetKinds": ["image", "icon"], "tokenTypes": ["string"] }',
    '"badgeIcon": { "group": "badge", "label": "Badge icon", "order": 30, "picker": "asset-token", "assetKinds": ["icon"], "tokenTypes": ["string"] }',
    '"AvatarGroup": {',
    '"avatar1Src": { "group": "avatar1", "label": "Image source", "order": 10, "picker": "asset-token", "assetKinds": ["image", "icon"], "tokenTypes": ["string"] }',
    '"avatar1BadgeIcon": { "group": "avatar1", "label": "Badge icon", "order": 60, "picker": "asset-token", "assetKinds": ["icon"], "tokenTypes": ["string"] }',
  ]) {
    assert(propRegistry.includes(expected), `default prop registry should include ${expected}`);
  }

  // This file used to carry a name-keyed enum table (`size` -> xs/sm/md/lg/xl,
  // `side` -> top/right/bottom/left, ...) lifted from the retired SGDS library
  // import. Applied across every library it outranked controls the stories
  // themselves declared and wrote values components could not accept. The
  // fallback may only infer from the arg's own runtime value now.
  const storyControlFallbacks = read('src/workbench-stories/storyControlFallbacks.ts');
  assert(
    !/COMMON_ENUM_PROP_OPTIONS|getKnownFallbackControlOptions/.test(storyControlFallbacks),
    'story control fallbacks must not reintroduce a prop-name-keyed enum table',
  );
  assert(
    storyControlFallbacks.includes('export function createValueTypeFallbackControl') &&
      storyControlFallbacks.includes("if (typeof value === 'boolean')") &&
      storyControlFallbacks.includes("if (typeof value === 'number')"),
    'story control fallbacks should infer only from the arg value type',
  );
}

function checkSourceTreePreviewPortalSelectionPerformance() {
  const sourceTreePreview = read('src/features/workbench-shell/ui/SourceTreePreview.tsx');
  const runtimeGlobals = read('src/runtime/workbenchReactRuntimeGlobals.ts');
  const starterPortalHelper = read('scripts/workbench-starter/shadcn-base/src/lib/workbench-portal.ts');
  assert(
    runtimeGlobals.includes('__WORKBENCH_PORTAL_SCOPE_CONTEXT__') &&
      runtimeGlobals.includes('React.createContext<HTMLElement | null | undefined>(undefined)') &&
      sourceTreePreview.includes('<div id="wb-source-preview-stage"></div>') &&
      sourceTreePreview.includes('<WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>') &&
      sourceTreePreview.includes('previewStage ?? previewDocument.body') &&
      starterPortalHelper.includes('__WORKBENCH_PORTAL_SCOPE_CONTEXT__') &&
      starterPortalHelper.includes('scopedPortalContainer === undefined ? portalContainer : scopedPortalContainer'),
    'SourceTreePreview should provide its exact iframe portal root to project runtime components and fail closed while a scoped root is unresolved',
  );
  assert(
    sourceTreePreview.includes("const SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR = '[data-workbench-portal-root=\"true\"]';") &&
      sourceTreePreview.includes('function getSourceTreePreviewNodeQueryRoots(container: HTMLElement): HTMLElement[]') &&
      sourceTreePreview.includes('const directRootMutationOptions = {') &&
      sourceTreePreview.includes('const missingTargetRootMutationOptions = {') &&
      sourceTreePreview.includes('if (targets.length === 0)') &&
      sourceTreePreview.includes('roots.forEach((root) => mutationObserver.observe(root, directRootMutationOptions));') &&
      sourceTreePreview.includes('targets.forEach((target) => mutationObserver.observe(target, targetMutationOptions));'),
    'SourceTreePreview portal selection should observe portal roots without watching the full subtree when selected targets exist',
  );
  assert(
    !sourceTreePreview.includes('roots.forEach((root) => mutationObserver.observe(root, {\n    childList: true,\n    subtree: true,\n  }));\n  targets.forEach'),
    'SourceTreePreview should not observe every portal/root subtree while selected overlay targets already exist',
  );
}

function checkCsfStoryVisibilityHydration() {
  const localLibraries = read('src/domain/project/workbenchProjectLocalLibraries.ts');
  assert(
    localLibraries.includes('SHADCN_BASE_ROOT_INSERT_COMPONENTS') &&
      localLibraries.includes("'AvatarGroup'") &&
      localLibraries.includes("'Checkbox'") &&
      localLibraries.includes('const componentNameAliases = getWorkbenchCsfStoryNameAliases({ componentName });') &&
      localLibraries.includes('if (componentNameAliases.includes(storyExport.exportName)) return false;') &&
      localLibraries.includes('const storyComponentName = storyExport.name && isComponentIdentifierName(storyExport.name)') &&
      localLibraries.includes('if (componentNameAliases.includes(storyComponentName)) return false;') &&
      localLibraries.includes('if (storyExport.exportName.endsWith') &&
      localLibraries.includes('isComponentIdentifierName(storyExport.name)'),
    'CSF hydration should keep shadcn root Story exports visible while hiding slot-only Story exports',
  );
  assert(
    localLibraries.includes('return hasShadcnTemplate;') &&
      !localLibraries.includes('SHADCN_BASE_EXPECTED_CHART_CARDS'),
    'shadcn-base hydration should rescan local story/source files so later-added components register',
  );
  const projectRegistryOperations = read('src/domain/project/workbenchProjectRegistryOperations.ts');
  assert(
    projectRegistryOperations.includes('const usedRegisteredIds = new Set<string>();') &&
      projectRegistryOperations.includes('const nextComponents = registry.components.flatMap') &&
      projectRegistryOperations.includes('if (usedRegisteredIds.has(replacement.id)) return [];') &&
      projectRegistryOperations.includes('normalizeWorkbenchComponentPath(left.sourceFile) === normalizeWorkbenchComponentPath(right.sourceFile)') &&
      projectRegistryOperations.includes('const appendedComponents = registeredComponents.filter') &&
      projectRegistryOperations.indexOf('...nextComponents') < projectRegistryOperations.indexOf('...appendedComponents'),
    'component registry reconciliation should preserve component order, collapse duplicate source/export entries, and append only newly discovered entries',
  );
}

function checkElectronPreviewVendorRuntime() {
  const localPreviewServer = read('host/local-preview/server.ts');
  assert(
    localPreviewServer.includes("['react-dom', VENDOR_REACT_DOM_PATH]"),
    'Electron local preview should alias react-dom to the Workbench vendor runtime',
  );
  assert(
    localPreviewServer.includes("namespace: VENDOR_RUNTIME_NAMESPACE"),
    'Electron local preview should bundle vendor runtime shims as esbuild virtual modules',
  );
  assert(
    localPreviewServer.includes('WORKBENCH_PREVIEW_PORTAL_BOUNDARY_SELECTOR') &&
      localPreviewServer.includes('isInsideWorkbenchPreviewPortalBoundary(container)') &&
      localPreviewServer.includes('Workbench preview blocked a project portal outside its preview boundary.'),
    'Project runtime react-dom portals should fail closed outside registered Workbench preview roots',
  );
  assert(
    !localPreviewServer.includes('external: true,'),
    'Electron local preview should not leave React vendor shims as external dynamic require targets',
  );
  assert(
    localPreviewServer.includes('globalThis.__WORKBENCH_REACT_DOM__'),
    'Electron local preview should serve a React DOM vendor module',
  );

  const runtimeGlobals = read('src/runtime/workbenchReactRuntimeGlobals.ts');
  assert(
    runtimeGlobals.includes('__WORKBENCH_REACT_DOM__'),
    'page preview should install the React DOM runtime global',
  );
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
