import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { initializeWorkbenchProject } from './workbench-local-project-host.mjs';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const args = parseArgs(process.argv.slice(2));
const appUrl = args.url ?? 'http://127.0.0.1:5175';
const shouldOpen = args.open !== false;
const shouldPrepare = args.prepare !== false;
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '');
const projectRoot = resolve(args.project ?? join(repoRoot, 'artifacts', `manual-shadcn-contracts-${timestamp}`));
const reportDir = resolve(repoRoot, 'artifacts', 'manual-shadcn-contract-checks');
const reportPath = join(reportDir, `${timestamp}.json`);

const manualCases = [
  {
    id: 'button-size',
    component: 'Button',
    surface: 'Storybook and Design Editor',
    steps: [
      'Use the generated smoke page and select the Button default instance.',
      'Open Props and change Size from default to lg, then to xs.',
      'Confirm the rendered button height/text scale changes.',
      'Confirm source writeback uses size="lg" or size="xs" on the Button instance.',
    ],
    expected: [
      'Size options are exactly the Button story enum, including xs, sm, lg, icon, icon-xs, icon-sm, and icon-lg.',
      'No generic fallback size options replace the story enum.',
    ],
  },
  {
    id: 'command-complete-root',
    component: 'Command',
    surface: 'Generated smoke page and Storybook',
    steps: [
      'Use the generated smoke page and select the Command instance.',
      'Inspect the generated source once; do not insert a new Command for every run.',
      'Select the Command instance and inspect Props.',
      'Open the rendered preview.',
    ],
    expected: [
      'Smoke page JSX contains CommandInput and CommandList explicitly.',
      'The preview includes the search input plus the Options section.',
      'Props do not show label, className, or Classes; source styling belongs to the CSS Classes surface.',
    ],
  },
  {
    id: 'select-combobox-values',
    component: 'Select and Combobox',
    surface: 'Generated smoke page and Storybook',
    steps: [
      'Use the generated smoke page and select Select, then Combobox.',
      'Change Default Value from item-1 to item-2.',
      'Blur the text field by selecting another layer before reading source.',
      'Confirm source writeback uses defaultValue="item-2" while child item values and labels remain Item 1 and Item 2.',
    ],
    expected: [
      'Select defaultValue writes to the Select root and displays the matching item.',
      'Combobox defaultValue writes to the Combobox root after field commit.',
      'Item labels and values remain paired; no dashboard/report/sample business labels appear.',
    ],
  },
  {
    id: 'input-group-root-props',
    component: 'InputGroup',
    surface: 'Generated smoke page and Storybook',
    steps: [
      'Use the generated smoke page and select InputGroup.',
      'Inspect Props.',
      'Change Control from input to textarea.',
      'Change Leading label, Placeholder, Shortcut, Disabled, and Invalid.',
    ],
    expected: [
      'InputGroup exposes semantic root props instead of requiring private slot assembly.',
      'Control changes the rendered control type.',
      'Text props change the rendered label, placeholder, and trailing shortcut.',
      'Disabled and Invalid visibly change state.',
    ],
  },
  {
    id: 'carousel-orientation',
    component: 'Carousel',
    surface: 'Generated smoke page and Storybook',
    steps: [
      'Use the generated smoke page and select the horizontal Carousel.',
      'Change Orientation to horizontal.',
      'Change Orientation to vertical.',
      'Inspect the generated source after each change.',
    ],
    expected: [
      'Horizontal renders slides along the x axis.',
      'Vertical renders slides along the y axis with a fixed starter height.',
      'Source writeback preserves orientation="horizontal" and orientation="vertical" correctly.',
    ],
  },
  {
    id: 'canvas-browser-parity',
    component: 'Select, Combobox, Carousel, and Command',
    surface: 'Design canvas and Browser preview',
    steps: [
      'Use the generated smoke page with all candidates placed once.',
      'Compare the Design canvas against Browser preview for the same page.',
      'Confirm Select and Combobox render as closed controls in both surfaces.',
      'Confirm the first Carousel renders horizontally and the second Carousel renders vertically in both surfaces.',
    ],
    expected: [
      'Design canvas passes real runtime child elements into structure-sensitive roots instead of wrapper children.',
      'Select and Combobox do not render their option lists inline while closed.',
      'Carousel slide detection works in the Design canvas and Browser preview.',
    ],
  },
  {
    id: 'source-style-props-hidden',
    component: 'Generated smoke page components',
    surface: 'Storybook, Design Editor, and Inspector',
    steps: [
      'Select Button, Select, Combobox, Command, Carousel, and InputGroup on the generated smoke page.',
      'Inspect Storybook Controls and Design Props.',
      'Inspect unmanaged props on source-backed selections.',
    ],
    expected: [
      'className and Classes are not shown as normal component Props.',
      'CSS classes remain editable through the dedicated source/style surface.',
    ],
  },
];

await mkdir(reportDir, { recursive: true });

const staticChecks = await runStaticChecks();
if (shouldPrepare) {
  await mkdir(projectRoot, { recursive: true });
  await initializeWorkbenchProject(projectRoot, 'Manual shadcn contracts', { templateId: 'shadcn-base' });
  await writeFile(
    join(projectRoot, 'src/workbench-pages/SaasDashboard.tsx'),
    createManualShadcnContractSmokePage(),
    'utf8',
  );
}

const openResult = shouldOpen && shouldPrepare
  ? await openProjectInWorkbench(appUrl, projectRoot)
  : { ok: false, skipped: true, message: 'Project open skipped.' };

const report = {
  appUrl,
  generatedAt: new Date().toISOString(),
  manualCases,
  openResult,
  projectRoot: shouldPrepare ? projectRoot : null,
  staticChecks,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('');
console.log('Manual shadcn contract inspection');
console.log(`Static checks: ${staticChecks.filter((check) => check.ok).length}/${staticChecks.length} passed`);
if (shouldPrepare) console.log(`Smoke project: ${projectRoot}`);
console.log(`Workbench URL: ${appUrl}`);
console.log(`Report: ${reportPath}`);
if (openResult.ok) {
  console.log('Workbench project open request: ok');
} else if (!openResult.skipped) {
  console.log(`Workbench project open request: failed (${openResult.message})`);
}
console.log('');
for (const testCase of manualCases) {
  console.log(`${testCase.id} :: ${testCase.component}`);
  console.log(`Surface: ${testCase.surface}`);
  console.log('Steps:');
  testCase.steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
  console.log('Expected:');
  testCase.expected.forEach((expected) => console.log(`  - ${expected}`));
  console.log('');
}

if (staticChecks.some((check) => !check.ok)) {
  console.error('Static contract checks failed:');
  for (const check of staticChecks.filter((item) => !item.ok)) {
    console.error(`- ${check.id}: ${check.message}`);
  }
  process.exitCode = 1;
}

async function runStaticChecks() {
  const files = {
    buttonStory: await read('scripts/workbench-starter/shadcn-base/src/components/ui/button.stories.tsx'),
    carousel: await read('scripts/workbench-starter/shadcn-base/src/components/ui/carousel.tsx'),
    carouselStory: await read('scripts/workbench-starter/shadcn-base/src/components/ui/carousel.stories.tsx'),
    commandStory: await read('scripts/workbench-starter/shadcn-base/src/components/ui/command.stories.tsx'),
    csfRuntimeLoader: await read('src/workbench-stories/csfRuntimeLoader.ts'),
    designInspectorPanel: await read('src/features/workbench-shell/ui/DesignInspectorPanel.tsx'),
    inputGroup: await read('scripts/workbench-starter/shadcn-base/src/components/ui/input-group.tsx'),
    inputGroupStory: await read('scripts/workbench-starter/shadcn-base/src/components/ui/input-group.stories.tsx'),
    projectWorkspace: await read('src/features/workbench-shell/ui/ProjectWorkspace.tsx'),
    sourceSlotContainers: await read('src/domain/document/sourceSlotContainers.ts'),
    sourceTreePreview: await read('src/features/workbench-shell/ui/SourceTreePreview.tsx'),
    sourceStoryMetadata: await read('src/workbench-stories/sourceStoryMetadata.ts'),
    storybookLibrary: await read('src/features/workbench-shell/ui/StorybookLibrary.tsx'),
  };

  const checks = [];
  addCheck(checks, 'button-size-story-enum', files.buttonStory.includes("const SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const"), 'Button story must declare the full size enum.');
  addCheck(checks, 'button-size-story-argtype', files.buttonStory.includes("size: { control: 'select', options: SIZES }"), 'Button size control must use the story enum.');
  addCheck(checks, 'runtime-explicit-options-first', explicitOptionsBeforeFallback(files.csfRuntimeLoader), 'Runtime controls must prefer explicit story options before generic fallback options.');
  addCheck(checks, 'metadata-explicit-options-first', explicitOptionsBeforeFallback(files.sourceStoryMetadata), 'Metadata controls must prefer explicit story options before generic fallback options.');
  addCheck(checks, 'runtime-numbered-placeholder-labels', keepsStablePlaceholderLabels(files.csfRuntimeLoader), 'Runtime source insert normalization must preserve numbered generic placeholder labels.');
  addCheck(checks, 'metadata-numbered-placeholder-labels', keepsStablePlaceholderLabels(files.sourceStoryMetadata), 'Metadata source insert normalization must preserve numbered generic placeholder labels.');

  addCheck(checks, 'command-insert-explicit-input', files.commandStory.includes('<CommandInput placeholder="Placeholder" />'), 'Command sourceInsert must include CommandInput.');
  addCheck(checks, 'command-insert-explicit-list', files.commandStory.includes('<CommandList><CommandEmpty>No results found.</CommandEmpty>'), 'Command sourceInsert must include CommandList.');
  addCheck(checks, 'command-no-label-prop', !files.commandStory.includes("label: 'Command menu'") && !files.commandStory.includes('label={DEFAULT_PROPS.label}'), 'Command story/source insert must not expose invisible label as a design prop.');
  addCheck(checks, 'command-child-allowlist', files.sourceSlotContainers.includes("['Command', new Set(['CommandInput', 'CommandList', 'CommandEmpty', 'CommandSection', 'CommandOption', 'CommandSeparator'])]"), 'Command direct child allowlist must match both explicit and simple root shapes.');

  addCheck(checks, 'input-group-root-props', files.inputGroup.includes('type InputGroupProps') && files.inputGroup.includes('control?: "input" | "textarea"') && files.inputGroup.includes('leadingLabel?: string') && files.inputGroup.includes('shortcut?: string'), 'InputGroup must expose semantic root props.');
  addCheck(checks, 'input-group-default-slots', files.inputGroup.includes('<InputGroupAddon>{leadingLabel}</InputGroupAddon>') && files.inputGroup.includes('placeholder={placeholder}') && files.inputGroup.includes('<InputGroupText>{shortcut}</InputGroupText>'), 'InputGroup must render complete default slots from root props.');
  addCheck(checks, 'input-group-story-props', files.inputGroupStory.includes("control: { control: 'select', options: CONTROLS }") && files.inputGroupStory.includes("leadingLabel: { control: 'text' }") && files.inputGroupStory.includes("shortcut: { control: 'text' }"), 'InputGroup story must expose root prop controls.');
  addCheck(checks, 'input-group-no-class-control', !files.inputGroupStory.includes("className: { control: 'text' }"), 'InputGroup story must not expose className as a normal prop.');

  addCheck(checks, 'carousel-orientation-data', files.carousel.includes('data-orientation={orientation}'), 'Carousel root must expose data-orientation for orientation-specific sizing.');
  addCheck(checks, 'carousel-vertical-content-height', files.carousel.includes('orientation === "vertical" && "h-full"'), 'Carousel vertical content must receive a usable height.');
  addCheck(checks, 'carousel-story-root-sizing', files.carouselStory.includes("layoutWidth: '360px'") && files.carouselStory.includes("verticalPaddingY: '3rem'"), 'Carousel story/source insert must expose starter sizing as editable props.');
  addCheck(checks, 'canvas-runtime-owned-root-set', keepsCanvasRuntimeOwnedRootSet(files.sourceTreePreview), 'Design canvas must pass runtime-owned children into structure-sensitive shadcn roots.');
  addCheck(checks, 'canvas-runtime-owned-child-elements', files.sourceTreePreview.includes('createSourceTreePreviewRuntimeOwnedChild') && files.sourceTreePreview.includes('getSourceTreePreviewRuntimeChildContent(children)'), 'Design canvas must synthesize real runtime child elements instead of passing SourceTreePreviewNode wrappers.');
  addCheck(checks, 'canvas-runtime-owned-selection-props', files.sourceTreePreview.includes('getSourceTreePreviewRuntimeOwnedChildSelectionProps') && files.sourceTreePreview.includes("'data-wb-preview-node-id': selectable ? node.id : undefined"), 'Design canvas runtime-owned children must keep preview node ids for layer selection.');

  addCheck(checks, 'source-style-filter-metadata', hidesSourceStyleProps(files.sourceStoryMetadata), 'Source story metadata must hide className from design props.');
  addCheck(checks, 'source-style-filter-runtime', hidesSourceStyleProps(files.csfRuntimeLoader), 'Runtime story metadata must hide className from design props.');
  addCheck(checks, 'source-style-filter-storybook', files.storybookLibrary.includes("if (key === 'className') return [];"), 'Storybook controls must hide className.');
  addCheck(checks, 'source-style-filter-workspace', files.projectWorkspace.includes("if (key === 'className') return [];"), 'Workspace controls must hide className.');
  addCheck(checks, 'source-style-filter-unmanaged', files.designInspectorPanel.includes("const skip = new Set(['children', 'className', 'key', 'ref']);"), 'Unmanaged props must hide className.');

  return checks;
}

async function read(fileName) {
  return readFile(resolve(repoRoot, fileName), 'utf8');
}

function addCheck(checks, id, ok, message) {
  checks.push({ id, ok: Boolean(ok), message });
}

function explicitOptionsBeforeFallback(source) {
  return source.includes('if (options.length > 0) return [{ ...base, options, type:') &&
    !/KnownFallbackControlOptions|COMMON_ENUM_PROP_OPTIONS/.test(source);
}

function hidesSourceStyleProps(source) {
  return source.includes("function isSourceStylePropKey(key: string): boolean") &&
    source.includes("return key === 'className';") &&
    source.includes('.filter((key) => !isSourceStylePropKey(key))') &&
    source.includes('.filter((control) => !isSourceStylePropKey(control.key))') &&
    source.includes('if (isSourceStylePropKey(key)) return [];');
}

function keepsStablePlaceholderLabels(source) {
  return source.includes('function isShadcnBaseStablePlaceholderText(value: string): boolean') &&
    source.includes("value === 'No results found.'") &&
    source.includes('(?:Content|Item|Option|Page|Panel|Row|Slide|Step|Tab)');
}

function keepsCanvasRuntimeOwnedRootSet(source) {
  const requiredRootNames = [
    'AlertDialog',
    'Breadcrumb',
    'ButtonGroup',
    'Carousel',
    'Collapsible',
    'Combobox',
    'Command',
    'ContextMenu',
    'Dialog',
    'DropdownMenu',
    'Drawer',
    'HoverCard',
    'InputGroup',
    'InputOTP',
    'Menubar',
    'NativeSelect',
    'NavigationMenu',
    'Pagination',
    'Popover',
    'RadioGroup',
    'Select',
    'Sheet',
    'Tabs',
    'ToggleGroup',
    'Tooltip',
  ];
  return source.includes('SOURCE_TREE_PREVIEW_RUNTIME_OWNED_CHILD_ROOT_NAMES') &&
    requiredRootNames.every((name) => source.includes(`'${name}'`)) &&
    source.includes('runtimeOwnedChildren ?? renderedChildren');
}

function createManualShadcnContractSmokePage() {
  return `import '../workbench-tokens.css';
import { Button } from '../components/ui/button';
import {
  Carousel,
  CarouselSlide,
} from '../components/ui/carousel';
import {
  Combobox,
  ComboboxOption,
  ComboboxSection,
  ComboboxSeparator,
} from '../components/ui/combobox';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandOption,
  CommandSection,
} from '../components/ui/command';
import { InputGroup } from '../components/ui/input-group';
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from '../components/ui/select';

export default function WorkbenchDesignPage() {
  return (
    <main className="min-h-screen bg-background p-8 text-foreground">
      <section className="mx-auto grid w-full max-w-5xl gap-6" aria-label="Shadcn contract smoke">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">Shadcn contract smoke</h1>
          <p className="text-sm text-muted-foreground">All contract candidates are placed once on this page for manual inspection.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="default">Button default</Button>
          <Button size="lg">Button large</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select defaultValue="item-1" placeholder="Select an option">
            <SelectGroup>
              <SelectLabel>Options</SelectLabel>
              <SelectItem value="item-1">Item 1</SelectItem>
              <SelectSeparator />
              <SelectItem value="item-2">Item 2</SelectItem>
            </SelectGroup>
          </Select>

          <Combobox defaultValue="item-1" placeholder="Select an item">
            <ComboboxSection label="Options">
              <ComboboxOption value="item-1">Item 1</ComboboxOption>
              <ComboboxSeparator />
              <ComboboxOption value="item-2">Item 2</ComboboxOption>
            </ComboboxSection>
          </Combobox>
        </div>

        <InputGroup
          control="input"
          leadingLabel="Search"
          placeholder="Search items"
          shortcut="⌘K"
        />

        <Command className="w-[360px] border shadow-sm">
          <CommandInput placeholder="Placeholder" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandSection heading="Options">
              <CommandOption value="item-1" shortcut="⌘1">Item 1</CommandOption>
              <CommandOption value="item-2" shortcut="⌘2">Item 2</CommandOption>
            </CommandSection>
          </CommandList>
        </Command>

        <div className="grid gap-6 md:grid-cols-2">
          <Carousel
            align="start"
            itemsPerView={1}
            layoutHeight="360px"
            layoutWidth="360px"
            loop={false}
            orientation="horizontal"
            paddingX="3rem"
            paddingY="2.5rem"
            showControls={true}
            verticalPaddingX="2.5rem"
            verticalPaddingY="3rem"
          >
            <CarouselSlide>Slide 1</CarouselSlide>
            <CarouselSlide>Slide 2</CarouselSlide>
            <CarouselSlide>Slide 3</CarouselSlide>
          </Carousel>

          <Carousel
            align="start"
            itemsPerView={1}
            layoutHeight="360px"
            layoutWidth="360px"
            loop={false}
            orientation="vertical"
            paddingX="3rem"
            paddingY="2.5rem"
            showControls={true}
            verticalPaddingX="2.5rem"
            verticalPaddingY="3rem"
          >
            <CarouselSlide>Slide 1</CarouselSlide>
            <CarouselSlide>Slide 2</CarouselSlide>
            <CarouselSlide>Slide 3</CarouselSlide>
          </Carousel>
        </div>
      </section>
    </main>
  );
}
`;
}

async function openProjectInWorkbench(url, rootPath) {
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/__workbench/project.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: url.replace(/\/$/, ''),
      },
      body: JSON.stringify({ action: 'open', rootPath }),
    });
    if (!response.ok) {
      return { ok: false, status: response.status, message: await response.text() };
    }
    return { ok: true, location: await response.json() };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not open project in Workbench.',
    };
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (arg === '--no-open') {
      parsed.open = false;
      continue;
    }
    if (arg === '--no-prepare') {
      parsed.prepare = false;
      continue;
    }
    if (arg === '--url') {
      parsed.url = values[index + 1];
      index += 1;
      continue;
    }
    if (arg?.startsWith('--url=')) {
      parsed.url = arg.slice('--url='.length);
      continue;
    }
    if (arg === '--project') {
      parsed.project = values[index + 1];
      index += 1;
      continue;
    }
    if (arg?.startsWith('--project=')) {
      parsed.project = arg.slice('--project='.length);
    }
  }
  return parsed;
}
