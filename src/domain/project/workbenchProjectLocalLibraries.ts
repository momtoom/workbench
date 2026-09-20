import type {
  WorkbenchComponentRegistry,
  WorkbenchLibraryRegistryEntry,
  WorkbenchPageRegistry,
} from './workbenchProject';
import {
  getWorkbenchImportedComponentDisplayName,
  reconcileWorkbenchComponentLibrary,
  type WorkbenchComponentLibraryCandidate,
} from './workbenchProjectRegistryOperations';
import type { ImportableComponentSummary } from '@domain/document/editableTreeSourceParser';
import { getImportableComponentSummariesFromComponentSource } from '@domain/document/pageSourceAdapter';
import {
  parseWorkbenchStoryInsertContracts,
  resolveWorkbenchStoryInsertContract,
  type WorkbenchStoryInsertContract,
  type WorkbenchStoryInsertContracts,
} from './workbenchStoryInsertContract';
import {
  findCsfStoryForComponent,
  getWorkbenchCsfStoryNameAliases,
} from './workbenchComponentStorySource';

type ProjectSourceReader = (path: string) => Promise<{ ok: true; contents: string } | { ok: false; message: string }>;

type ProjectSourceTreeReader = (path: string) => Promise<
  | { ok: true; files: Array<{ contents: string; relativePath: string }> }
  | { ok: false; message: string; notFound?: boolean }
>;

type LocalLibraryExport = {
  exportName: string;
  moduleSource: string;
};

type LocalLibraryModule = {
  contents: string | null;
  sourceFile: string;
};

type CsfStoryComponentExport = {
  exportName: string;
  name: string | null;
};

type ProjectLocalLibraryStoryInventory = {
  complete: boolean;
  stories: Array<{ contents: string; path: string }>;
};

const LOCAL_LIBRARY_IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?(['"])([^'"]*\/libraries\/([a-z][a-z0-9-]*)\/components(?:\/index(?:\.(?:tsx?|jsx?))?)?)\1/g;
const LOCAL_LIBRARY_SOURCE_PATTERN = /(?:^|\/)src\/libraries\/([a-z][a-z0-9-]*)\/components(?:\/|$)/i;
const BARREL_EXPORT_PATTERN = /\bexport\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2\s*;?/g;
const CSF_STORY_EXPORT_PATTERN = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\{([\s\S]*?)(?=\nexport\s+const\s+[A-Za-z0-9_]+\s*=|\nexport\s+default\s+|$)/g;
const PROJECT_COMPONENT_IMPORT_PATTERN = /\bimport\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?(['"])([^'"]+)\1/g;
const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.vue'] as const;
const PROJECT_STORY_HYDRATION_CONCURRENCY = 12;
const PROJECT_LOCAL_COMPONENT_SET_ID = 'component-set-local';
const PROJECT_LOCAL_LIBRARY_ID = 'local';
const PROJECT_LOCAL_COMPONENTS_ROOT = 'src/components';
const SHADCN_BASE_LIBRARY_ID = 'shadcn-base';
const SHADCN_BASE_COMPONENT_SET_ID = 'component-set-shadcn-base';
const SHADCN_BASE_COMPONENTS_ROOT = 'src/components/ui';
const SHADCN_BASE_ROOT_INSERT_COMPONENTS = new Set([
  'Accordion',
  'Alert',
  'AlertDialog',
  'AreaChartCard',
  'AspectRatio',
  'Avatar',
  'AvatarGroup',
  'Badge',
  'BarChartCard',
  'Breadcrumb',
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
  'Drawer',
  'DropdownMenu',
  'Empty',
  'Field',
  'FieldSet',
  'HoverCard',
  'Input',
  'InputGroup',
  'InputOTP',
  'Item',
  'ItemGroup',
  'Kbd',
  'KbdGroup',
  'Label',
  'LineChartCard',
  'Menubar',
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
  'Stack',
  'Switch',
  'SwitchField',
  'Table',
  'Tabs',
  'Textarea',
  'Text',
  'Toggle',
  'ToggleGroup',
  'Tooltip',
  'TooltipProvider',
]);
export async function hydrateProjectLocalLibraries({
  pages,
  readSourceFile,
  readSourceTree,
  registry,
  projectTemplateId,
}: {
  pages: WorkbenchPageRegistry;
  readSourceFile: ProjectSourceReader;
  readSourceTree?: ProjectSourceTreeReader;
  registry: WorkbenchComponentRegistry;
  projectTemplateId?: string | null;
}): Promise<WorkbenchComponentRegistry> {
  let nextRegistry = await hydrateShadcnBaseStoryComponents({
    projectTemplateId,
    readSourceFile,
    readSourceTree,
    registry,
  });
  const libraryIds = await collectProjectLocalLibraryIds({ pages, readSourceFile, registry: nextRegistry });

  if (libraryIds.length > 0) {
    const candidates: WorkbenchComponentLibraryCandidate[] = [];
    const blockedCandidateSourceFiles = new Set<string>();
    const libraries: Record<string, WorkbenchLibraryRegistryEntry> = {
      ...(nextRegistry.extensions?.libraries ?? {}),
    };
    const now = new Date().toISOString();

    for (const libraryId of libraryIds) {
      const snapshotRoot = `src/libraries/${libraryId}`;
      const componentsRoot = `${snapshotRoot}/components`;
      const barrelRead = await readSourceFile(`${componentsRoot}/index.ts`);
      if (!barrelRead.ok) continue;

      const barrelExports = parseLocalLibraryBarrelExports(barrelRead.contents);
      if (barrelExports.length === 0) continue;
      const storyInventory = await collectProjectLocalLibraryStorySources({
        readSourceTree,
        snapshotRoot,
      });

      const previousLibrary = libraries[libraryId];
      libraries[libraryId] = {
        id: libraryId,
        kind: 'project-local',
        sourcePath: snapshotRoot,
        snapshotRoot,
        updatePolicy: 'manual',
        mergePolicy: 'overwrite',
        createdAt: previousLibrary?.createdAt ?? now,
        updatedAt: previousLibrary?.updatedAt ?? now,
      };

      for (const barrelExport of barrelExports) {
        const module = await resolveLocalLibraryModule({
          componentsRoot,
          moduleSource: barrelExport.moduleSource,
          readSourceFile,
        });
        const displayName = getWorkbenchImportedComponentDisplayName(
          barrelExport.exportName,
          getLocalLibraryModuleFallbackName(module.sourceFile),
        );
        const moduleSummaries = module.contents
          ? await getImportableComponentSummariesFromComponentSource({
              contents: module.contents,
              fallbackName: displayName,
              sourceFile: module.sourceFile,
            })
          : [];
        const summaryByName = new Map(moduleSummaries.map((summary) => [summary.name, summary]));
        const childrenSlotKind = summaryByName.get(barrelExport.exportName)?.childrenSlotKind ?? null;
        const candidate: WorkbenchComponentLibraryCandidate = {
          componentName: barrelExport.exportName,
          displayName,
          sourceFile: module.sourceFile,
          extensions: {
            currentSourceFile: module.sourceFile,
            importedFrom: module.sourceFile,
            libraryId,
            librarySourcePath: snapshotRoot,
            librarySnapshotRoot: snapshotRoot,
            libraryUpdatePolicy: 'manual',
            sourceTruth: 'project-local',
            syncStatus: 'pinned',
            ...(childrenSlotKind ? { childrenSlotKind } : {}),
          },
        };

        const configuredStorySources = nextRegistry.components.flatMap((component) => {
          if (normalizeProjectComponentPath(component.sourceFile) !== normalizeProjectComponentPath(module.sourceFile)) {
            return [];
          }
          const configured = getStringExtension(component.extensions, 'storySourceFile');
          return configured ? [{ path: normalizeProjectComponentPath(configured) }] : [];
        });
        const availableStorySources = [...new Map(
          [
            ...storyInventory.stories,
            ...(storyInventory.complete ? [] : configuredStorySources),
          ].map((story) => [story.path, story]),
        ).values()];
        const csfStory = findCsfStoryForComponent({
          componentName: barrelExport.exportName,
          displayName,
          sourceFile: module.sourceFile,
          stories: availableStorySources,
        });
        let storyExtensions: Record<string, unknown> = {};
        if (csfStory) {
          const inventoriedStory = storyInventory.stories.find((story) => story.path === csfStory.path);
          const storyRead = inventoriedStory
            ? { ok: true as const, contents: inventoriedStory.contents }
            : await readSourceFile(csfStory.path);
          if (!storyRead.ok) {
            blockedCandidateSourceFiles.add(normalizeProjectComponentPath(module.sourceFile));
            continue;
          }
          const storyComponentNames = new Set(
            parseCsfStoryComponentExports(storyRead.contents)
              .map((storyExport) => resolveCsfStoryComponentName(storyExport, summaryByName))
              .filter((componentName): componentName is string => Boolean(componentName)),
          );
          if (storyComponentNames.size === 0) {
            blockedCandidateSourceFiles.add(normalizeProjectComponentPath(module.sourceFile));
            continue;
          }
          if (!storyComponentNames.has(barrelExport.exportName)) {
            const existingStoryOwner = nextRegistry.components.some((component) => {
              if (normalizeProjectComponentPath(component.sourceFile) !== normalizeProjectComponentPath(module.sourceFile)) {
                return false;
              }
              const componentName = getStringExtension(component.extensions, 'sourceExportName') ??
                getStringExtension(component.extensions, 'importName') ??
                component.name;
              const storySourceFile = getStringExtension(component.extensions, 'storySourceFile');
              return componentName === barrelExport.exportName &&
                normalizeProjectComponentPath(storySourceFile ?? '') === normalizeProjectComponentPath(csfStory.path);
            });
            if (existingStoryOwner) {
              blockedCandidateSourceFiles.add(normalizeProjectComponentPath(module.sourceFile));
              continue;
            }
            candidates.push(candidate);
            continue;
          }
          const insertContract = resolveWorkbenchStoryInsertContract(
            await parseWorkbenchStoryInsertContracts(storyRead.contents),
            barrelExport.exportName,
          );
          storyExtensions = {
            storyFormat: 'csf',
            storySourceFile: csfStory.path,
            ...(insertContract && insertContract.allowedChildren.length > 0
              ? { allowedChildren: insertContract.allowedChildren }
              : {}),
            ...(insertContract?.group ? { componentGroup: insertContract.group } : {}),
            ...(insertContract?.hiddenFromInsert ? { hiddenFromInsert: true } : {}),
          };
        }

        candidates.push({
          ...candidate,
          extensions: {
            ...(candidate.extensions ?? {}),
            ...storyExtensions,
          },
        });
      }
    }

    const safeCandidates = candidates.filter((candidate) => (
      !blockedCandidateSourceFiles.has(normalizeProjectComponentPath(candidate.sourceFile))
    ));
    if (safeCandidates.length > 0) {
      const reconciled = reconcileWorkbenchComponentLibrary(nextRegistry, safeCandidates).nextRegistry;
      nextRegistry = {
        ...reconciled,
        extensions: {
          ...(reconciled.extensions ?? {}),
          libraries,
        },
      };
    }
  }

  nextRegistry = await hydratePageImportedStoryComponents({ pages, readSourceFile, registry: nextRegistry });
  nextRegistry = await hydrateProjectRegisteredStoryComponents({ readSourceFile, registry: nextRegistry });
  nextRegistry = await registerComponentsFoundInLibrarySource({ readSourceTree, registry: nextRegistry });
  nextRegistry = await removeComponentsWithMissingLibrarySource({ readSourceTree, registry: nextRegistry });
  nextRegistry = removeUnusedDefaultLocalLibrary(nextRegistry);
  return areComponentRegistriesEqual(registry, nextRegistry) ? registry : nextRegistry;
}

async function collectProjectLocalLibraryStorySources({
  readSourceTree,
  snapshotRoot,
}: {
  readSourceTree?: ProjectSourceTreeReader;
  snapshotRoot: string;
}): Promise<ProjectLocalLibraryStoryInventory> {
  if (!readSourceTree) return { complete: false, stories: [] };
  const treeRead = await readSourceTree(snapshotRoot);
  if (!treeRead.ok) return { complete: false, stories: [] };
  return {
    complete: true,
    stories: treeRead.files
      .map((file) => ({
        contents: file.contents,
        path: normalizeProjectComponentPath(file.relativePath),
      }))
      .filter((story) => /\.(?:stories|story)\.(?:tsx|jsx)$/i.test(story.path))
      .sort((left, right) => left.path.localeCompare(right.path)),
  };
}

/**
 * Register story-backed components that exist under a library's source root
 * but never made it into the registry.
 *
 * This is the mirror of the prune below, and the reason it is needed is the
 * same: nothing rediscovers a library root. `hydrateProjectRegisteredStoryComponents`
 * only refreshes entries the registry already lists, and the import flow takes
 * a file list from the app UI, so a project created from an older starter
 * snapshot can never pick up components added to the kit afterwards. The
 * Astryx starter shipped nine such components (AstryxTableFooter, the Stepper
 * family, the Selector parts) that no amount of reloading would register.
 *
 * A component qualifies exactly the way the import flow qualifies one: it
 * needs a source file under the library root and a matching CSF story that
 * names it. Files with an already-registered component are skipped, because
 * the registered-story pass owns those and registers their siblings too.
 */
async function registerComponentsFoundInLibrarySource({
  readSourceTree,
  registry,
}: {
  readSourceTree?: ProjectSourceTreeReader;
  registry: WorkbenchComponentRegistry;
}): Promise<WorkbenchComponentRegistry> {
  if (!readSourceTree) return registry;
  const libraries = registry.extensions?.libraries ?? {};
  const candidates: WorkbenchComponentLibraryCandidate[] = [];

  for (const [libraryId, library] of Object.entries(libraries)) {
    const sourcePath = typeof library?.sourcePath === 'string' ? normalizeProjectComponentPath(library.sourcePath) : '';
    if (!sourcePath) continue;
    // Only extend a library that already owns components. Discovering into an
    // empty library would invent a component set the project never imported.
    const owned = registry.components.filter((component) => component.extensions?.libraryId === libraryId);
    if (owned.length === 0) continue;

    const treeRead = await readSourceTree(sourcePath);
    if (!treeRead.ok || treeRead.files.length === 0) continue;

    const fileContents = new Map(
      treeRead.files.map((file) => [normalizeProjectComponentPath(file.relativePath), file.contents]),
    );
    const registeredSourceFiles = new Set(owned.map((component) => normalizeProjectComponentPath(component.sourceFile)));
    const template = owned[0];

    for (const storySourceFile of [...fileContents.keys()].sort()) {
      if (!storySourceFile.startsWith(`${sourcePath}/`) || !storySourceFile.endsWith('.stories.tsx')) continue;
      const sourceFile = storySourceFile.replace(/\.stories\.tsx$/, '.tsx');
      if (registeredSourceFiles.has(sourceFile)) continue;
      const source = fileContents.get(sourceFile);
      const storySource = fileContents.get(storySourceFile);
      if (!source || !storySource) continue;

      const fallbackName = getLocalLibraryModuleFallbackName(sourceFile);
      const summaries = await getImportableComponentSummariesFromComponentSource({ contents: source, fallbackName, sourceFile });
      const summaryByName = new Map(summaries.map((summary) => [summary.name, summary]));
      if (summaryByName.size === 0) continue;
      const insertContracts = await parseWorkbenchStoryInsertContracts(storySource);

      for (const storyExport of parseCsfStoryComponentExports(storySource)) {
        const componentName = resolveCsfStoryComponentName(storyExport, summaryByName);
        if (!componentName) continue;
        const summary = summaryByName.get(componentName);
        candidates.push({
          componentName,
          componentSetId: template.componentSetId,
          displayName: storyExport.name ?? getWorkbenchImportedComponentDisplayName(componentName, fallbackName),
          sourceFile,
          extensions: {
            source: getStringExtension(template.extensions, 'source') ?? 'local',
            currentSourceFile: sourceFile,
            importedFrom: sourceFile,
            sourceTruth: getStringExtension(template.extensions, 'sourceTruth') ?? 'project-local',
            syncStatus: getStringExtension(template.extensions, 'syncStatus') ?? 'pinned',
            storyFormat: 'csf',
            storySourceFile,
            libraryId,
            librarySourcePath: getStringExtension(template.extensions, 'librarySourcePath') ?? sourcePath,
            librarySnapshotRoot: getStringExtension(template.extensions, 'librarySnapshotRoot') ?? 'src',
            libraryUpdatePolicy: getStringExtension(template.extensions, 'libraryUpdatePolicy') ?? 'manual',
            ...(getStringExtension(template.extensions, 'sourcePreset') ? { sourcePreset: getStringExtension(template.extensions, 'sourcePreset') } : {}),
            ...(getStringExtension(template.extensions, 'sourceBase') ? { sourceBase: getStringExtension(template.extensions, 'sourceBase') } : {}),
            ...(getStringExtension(template.extensions, 'sourceTemplate') ? { sourceTemplate: getStringExtension(template.extensions, 'sourceTemplate') } : {}),
            ...(summary?.childrenSlotKind ? { childrenSlotKind: summary.childrenSlotKind } : {}),
            ...createStoryInsertExtensions({ componentName, contracts: insertContracts, storyExport }),
          },
        });
      }
    }
  }

  if (candidates.length === 0) return registry;
  const nextRegistry = reconcileWorkbenchComponentLibrary(registry, candidates).nextRegistry;
  return areComponentRegistriesEqual(registry, nextRegistry) ? registry : nextRegistry;
}

/**
 * Drop registry entries whose backing source is gone, using a scan of the
 * owning library's source root as the authority.
 *
 * Per-file reconciliation cannot do this: it only replaces entries for files
 * it just re-scanned, so an entry whose source was deleted survives forever
 * and keeps showing up in the component and Add child pickers. Two real cases
 * this clears:
 *
 * - An Astryx project carrying a `shadcn-base` library whose entire
 *   `src/components/ui` root no longer exists. The library and its components
 *   go together.
 * - The Astryx starter snapshot, whose `src/components` root does exist but
 *   which still lists ~105 components from a retired generic set
 *   (`Display.tsx`, `Data.tsx`, `Forms.tsx`, …) that shipped no source.
 *
 * A component is only removed when its source file sits under a library root
 * that scanned successfully and is absent from that scan, or when the host
 * positively reports the root missing or empty. A read the host could not
 * complete — a tree past its import cap, a timeout — proves nothing and
 * keeps the library: treating it as gone once emptied a whole registry the
 * moment a starter's component tree outgrew the cap.
 */
async function removeComponentsWithMissingLibrarySource({
  readSourceTree,
  registry,
}: {
  readSourceTree?: ProjectSourceTreeReader;
  registry: WorkbenchComponentRegistry;
}): Promise<WorkbenchComponentRegistry> {
  if (!readSourceTree) return registry;
  const libraries = registry.extensions?.libraries ?? {};
  const staleLibraryIds = new Set<string>();
  const scannedRoots: Array<{ files: Set<string>; root: string }> = [];

  for (const [libraryId, library] of Object.entries(libraries)) {
    const sourcePath = typeof library?.sourcePath === 'string' ? normalizeProjectComponentPath(library.sourcePath) : '';
    if (!sourcePath) continue;
    const hasComponents = registry.components.some((component) => (
      component.extensions?.libraryId === libraryId
    ));
    if (!hasComponents) continue;

    const treeRead = await readSourceTree(sourcePath);
    if (!treeRead.ok) {
      if (treeRead.notFound) staleLibraryIds.add(libraryId);
      continue;
    }
    if (treeRead.files.length === 0) {
      staleLibraryIds.add(libraryId);
      continue;
    }
    scannedRoots.push({
      files: new Set(treeRead.files.map((file) => normalizeProjectComponentPath(file.relativePath))),
      root: sourcePath,
    });
  }

  const hasMissingSource = (sourceFile: string): boolean => {
    const normalized = normalizeProjectComponentPath(sourceFile);
    const owner = scannedRoots.find((scanned) => normalized.startsWith(`${scanned.root}/`));
    return Boolean(owner) && !owner!.files.has(normalized);
  };

  const nextComponents = registry.components.filter((component) => {
    const libraryId = component.extensions?.libraryId;
    if (typeof libraryId === 'string' && staleLibraryIds.has(libraryId)) return false;
    return !hasMissingSource(component.sourceFile);
  });

  if (staleLibraryIds.size === 0 && nextComponents.length === registry.components.length) return registry;

  const nextLibraries = { ...libraries };
  for (const libraryId of staleLibraryIds) delete nextLibraries[libraryId];
  return {
    ...registry,
    components: nextComponents,
    extensions: {
      ...(registry.extensions ?? {}),
      libraries: nextLibraries,
    },
  };
}

function removeUnusedDefaultLocalLibrary(
  registry: WorkbenchComponentRegistry,
): WorkbenchComponentRegistry {
  const localLibrary = registry.extensions?.libraries?.[PROJECT_LOCAL_LIBRARY_ID];
  if (!localLibrary) return registry;
  const isReferenced = registry.components.some((component) => (
    component.extensions?.libraryId === PROJECT_LOCAL_LIBRARY_ID
  ));
  if (isReferenced) return registry;

  const libraries = { ...(registry.extensions?.libraries ?? {}) };
  delete libraries[PROJECT_LOCAL_LIBRARY_ID];
  return {
    ...registry,
    extensions: {
      ...(registry.extensions ?? {}),
      libraries,
    },
  };
}

async function hydratePageImportedStoryComponents({
  pages,
  readSourceFile,
  registry,
}: {
  pages: WorkbenchPageRegistry;
  readSourceFile: ProjectSourceReader;
  registry: WorkbenchComponentRegistry;
}): Promise<WorkbenchComponentRegistry> {
  const sourceFiles = (await collectPageImportedProjectComponentSourceFiles({ pages, readSourceFile }))
    .filter((sourceFile) => !isShadcnBaseComponentSourceFile(sourceFile, registry));
  if (sourceFiles.length === 0) return registry;

  const moduleCandidates = await mapWithConcurrency(
    sourceFiles,
    PROJECT_STORY_HYDRATION_CONCURRENCY,
    async (sourceFile) => {
      const storySourceFile = getDefaultComponentStorySourceFile(sourceFile);
      const [sourceRead, storyRead] = await Promise.all([
        readSourceFile(sourceFile),
        readSourceFile(storySourceFile),
      ]);
      if (!sourceRead.ok || !storyRead.ok) return [];

      const fallbackName = getLocalLibraryModuleFallbackName(sourceFile);
      const summaries = await getImportableComponentSummariesFromComponentSource({
        contents: sourceRead.contents,
        fallbackName: fallbackName,
        sourceFile,
      });
      const summaryByName = new Map(summaries.map((summary) => [summary.name, summary]));
      if (summaryByName.size === 0) return [];
      const insertContracts = await parseWorkbenchStoryInsertContracts(storyRead.contents);

      const candidates: WorkbenchComponentLibraryCandidate[] = [];
      for (const storyExport of parseCsfStoryComponentExports(storyRead.contents)) {
        const componentName = resolveCsfStoryComponentName(storyExport, summaryByName);
        if (!componentName) continue;
        const summary = summaryByName.get(componentName);
        candidates.push({
          componentName,
          componentSetId: PROJECT_LOCAL_COMPONENT_SET_ID,
          displayName: storyExport.name ?? getWorkbenchImportedComponentDisplayName(componentName, fallbackName),
          sourceFile,
          extensions: {
            source: 'local',
            currentSourceFile: sourceFile,
            importedFrom: sourceFile,
            sourceTruth: 'project-local',
            syncStatus: 'pinned',
            storyFormat: 'csf',
            storySourceFile,
            libraryId: PROJECT_LOCAL_LIBRARY_ID,
            librarySourcePath: PROJECT_LOCAL_COMPONENTS_ROOT,
            librarySnapshotRoot: 'src',
            libraryUpdatePolicy: 'manual',
            ...(summary?.childrenSlotKind ? { childrenSlotKind: summary.childrenSlotKind } : {}),
            ...createStoryInsertExtensions({ componentName, contracts: insertContracts, storyExport }),
          },
        });
      }
      return candidates;
    },
  );

  const candidates = moduleCandidates.flat();
  if (candidates.length === 0) return registry;
  const previousLocalLibrary = registry.extensions?.libraries?.[PROJECT_LOCAL_LIBRARY_ID];
  const now = new Date().toISOString();
  const registryWithLocalLibrary: WorkbenchComponentRegistry = {
    ...registry,
    extensions: {
      ...(registry.extensions ?? {}),
      libraries: {
        ...(registry.extensions?.libraries ?? {}),
        [PROJECT_LOCAL_LIBRARY_ID]: {
          id: PROJECT_LOCAL_LIBRARY_ID,
          kind: 'project-local',
          sourcePath: PROJECT_LOCAL_COMPONENTS_ROOT,
          snapshotRoot: 'src',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: previousLocalLibrary?.createdAt ?? now,
          updatedAt: previousLocalLibrary?.updatedAt ?? now,
        },
      },
    },
  };
  const nextRegistry = reconcileWorkbenchComponentLibrary(registryWithLocalLibrary, candidates).nextRegistry;
  return areComponentRegistriesEqual(registry, nextRegistry) ? registry : nextRegistry;
}

async function hydrateShadcnBaseStoryComponents({
  projectTemplateId,
  readSourceFile,
  readSourceTree,
  registry,
}: {
  projectTemplateId?: string | null;
  readSourceFile: ProjectSourceReader;
  readSourceTree?: ProjectSourceTreeReader;
  registry: WorkbenchComponentRegistry;
}): Promise<WorkbenchComponentRegistry> {
  if (!readSourceTree || !shouldBootstrapShadcnBaseComponents(registry, projectTemplateId)) {
    return registry;
  }

  const treeRead = await readSourceTree(SHADCN_BASE_COMPONENTS_ROOT);
  if (!treeRead.ok) return registry;

  const fileContents = new Map(
    treeRead.files.map((file) => [normalizeProjectComponentPath(file.relativePath), file.contents]),
  );
  const storyFiles = [...fileContents.keys()]
    .filter((sourceFile) => sourceFile.startsWith(`${SHADCN_BASE_COMPONENTS_ROOT}/`) && sourceFile.endsWith('.stories.tsx'))
    .sort();
  if (storyFiles.length === 0) return registry;

  const candidates: WorkbenchComponentLibraryCandidate[] = [];

  for (const storySourceFile of storyFiles) {
    const storySource = fileContents.get(storySourceFile);
    if (!storySource) continue;

    const sourceFile = storySourceFile.replace(/\.stories\.tsx$/, '.tsx');
    let source = fileContents.get(sourceFile) ?? null;
    if (!source) {
      const sourceRead = await readSourceFile(sourceFile);
      source = sourceRead.ok ? sourceRead.contents : null;
    }
    if (!source) continue;

    const fallbackName = getLocalLibraryModuleFallbackName(sourceFile);
    const summaries = await getImportableComponentSummariesFromComponentSource({
      contents: source,
      fallbackName,
      sourceFile,
    });
    const summaryByName = new Map(summaries.map((summary) => [summary.name, summary]));
    if (summaryByName.size === 0) continue;
    const insertContracts = await parseWorkbenchStoryInsertContracts(storySource);

    for (const storyExport of parseCsfStoryComponentExports(storySource)) {
      const componentName = resolveCsfStoryComponentName(storyExport, summaryByName);
      if (!componentName) continue;
      const summary = summaryByName.get(componentName);
      candidates.push({
        componentName,
        componentSetId: SHADCN_BASE_COMPONENT_SET_ID,
        displayName: storyExport.name ?? getWorkbenchImportedComponentDisplayName(componentName, fallbackName),
        sourceFile,
        extensions: {
          source: 'local',
          currentSourceFile: sourceFile,
          importedFrom: sourceFile,
          sourceTruth: 'project-local',
          syncStatus: 'pinned',
          libraryId: SHADCN_BASE_LIBRARY_ID,
          librarySourcePath: SHADCN_BASE_COMPONENTS_ROOT,
          librarySnapshotRoot: 'src',
          libraryUpdatePolicy: 'manual',
          sourcePreset: 'shadcn',
          sourceBase: 'base',
          sourceTemplate: 'vite',
          storyFormat: 'csf',
          storySourceFile,
          ...(summary?.childrenSlotKind ? { childrenSlotKind: summary.childrenSlotKind } : {}),
          ...createStoryInsertExtensions({ componentName, contracts: insertContracts, storyExport }),
        },
      });
    }
  }

  if (candidates.length === 0) return registry;
  const now = new Date().toISOString();
  const previousLibrary = registry.extensions?.libraries?.[SHADCN_BASE_LIBRARY_ID];
  const registryWithLibrary: WorkbenchComponentRegistry = {
    ...registry,
    extensions: {
      ...(registry.extensions ?? {}),
      libraries: {
        ...(registry.extensions?.libraries ?? {}),
        [SHADCN_BASE_LIBRARY_ID]: {
          id: SHADCN_BASE_LIBRARY_ID,
          kind: 'project-local',
          sourcePath: SHADCN_BASE_COMPONENTS_ROOT,
          snapshotRoot: 'src',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: previousLibrary?.createdAt ?? now,
          updatedAt: previousLibrary?.updatedAt ?? now,
        },
      },
    },
  };
  const nextRegistry = reconcileWorkbenchComponentLibrary(registryWithLibrary, candidates).nextRegistry;
  return areComponentRegistriesEqual(registry, nextRegistry) ? registry : nextRegistry;
}

function isShadcnBaseComponentSourceFile(
  sourceFile: string,
  registry: WorkbenchComponentRegistry,
): boolean {
  if (!registry.extensions?.libraries?.[SHADCN_BASE_LIBRARY_ID]) return false;
  const normalized = normalizeProjectComponentPath(sourceFile);
  return normalized === SHADCN_BASE_COMPONENTS_ROOT ||
    normalized.startsWith(`${SHADCN_BASE_COMPONENTS_ROOT}/`);
}

function shouldBootstrapShadcnBaseComponents(
  registry: WorkbenchComponentRegistry,
  projectTemplateId?: string | null,
): boolean {
  const hasShadcnTemplate = projectTemplateId === SHADCN_BASE_LIBRARY_ID ||
    Boolean(registry.extensions?.libraries?.[SHADCN_BASE_LIBRARY_ID]);
  return hasShadcnTemplate;
}

async function hydrateProjectRegisteredStoryComponents({
  readSourceFile,
  registry,
}: {
  readSourceFile: ProjectSourceReader;
  registry: WorkbenchComponentRegistry;
}): Promise<WorkbenchComponentRegistry> {
  const seenModules = new Set<string>();
  const modules: Array<{
    component: WorkbenchComponentRegistry['components'][number];
    sourceFile: string;
    storySourceFile: string;
  }> = [];

  for (const component of registry.components) {
    const sourceFile = normalizeProjectComponentPath(component.sourceFile);
    if (!isSourceModulePath(sourceFile)) continue;
    const storySourceFile = getComponentStorySourceFile(component, sourceFile);
    if (!storySourceFile) continue;

    const moduleKey = `${sourceFile}::${storySourceFile}`;
    if (seenModules.has(moduleKey)) continue;
    seenModules.add(moduleKey);
    modules.push({ component, sourceFile, storySourceFile });
  }

  const moduleResults = await mapWithConcurrency(
    modules,
    PROJECT_STORY_HYDRATION_CONCURRENCY,
    async ({ component, sourceFile, storySourceFile }) => {
      const [sourceRead, storyRead] = await Promise.all([
        readSourceFile(sourceFile),
        readSourceFile(storySourceFile),
      ]);
      if (!sourceRead.ok || !storyRead.ok) {
        return { candidates: [], reconcileBlocked: true, sourceFile };
      }

      const fallbackName = getLocalLibraryModuleFallbackName(sourceFile);
      const summaries = await getImportableComponentSummariesFromComponentSource({
        contents: sourceRead.contents,
        fallbackName: fallbackName,
        sourceFile,
      });
      const summaryByName = new Map(summaries.map((summary) => [summary.name, summary]));
      if (summaryByName.size === 0) return { candidates: [], reconcileBlocked: true, sourceFile };
      const insertContracts = await parseWorkbenchStoryInsertContracts(storyRead.contents);

      const candidates: WorkbenchComponentLibraryCandidate[] = [];
      const libraryContext = getComponentHydrationLibraryContext(registry, component);
      for (const storyExport of parseCsfStoryComponentExports(storyRead.contents)) {
        const componentName = resolveCsfStoryComponentName(storyExport, summaryByName);
        if (!componentName) continue;
        const summary = summaryByName.get(componentName);
        candidates.push({
          componentName,
          componentSetId: component.componentSetId,
          displayName: storyExport.name ?? getWorkbenchImportedComponentDisplayName(componentName, fallbackName),
          sourceFile,
          extensions: {
            source: getStringExtension(component.extensions, 'source') ?? 'local',
            currentSourceFile: sourceFile,
            importedFrom: sourceFile,
            sourceTruth: getStringExtension(component.extensions, 'sourceTruth') ?? 'project-local',
            syncStatus: getStringExtension(component.extensions, 'syncStatus') ?? 'pinned',
            storyFormat: 'csf',
            storySourceFile,
            ...(libraryContext.libraryId ? { libraryId: libraryContext.libraryId } : {}),
            ...(libraryContext.librarySourcePath ? { librarySourcePath: libraryContext.librarySourcePath } : {}),
            ...(libraryContext.librarySnapshotRoot ? { librarySnapshotRoot: libraryContext.librarySnapshotRoot } : {}),
            ...(libraryContext.libraryUpdatePolicy ? { libraryUpdatePolicy: libraryContext.libraryUpdatePolicy } : {}),
            ...(getStringExtension(component.extensions, 'sourcePreset') ? { sourcePreset: getStringExtension(component.extensions, 'sourcePreset') } : {}),
            ...(getStringExtension(component.extensions, 'sourceBase') ? { sourceBase: getStringExtension(component.extensions, 'sourceBase') } : {}),
            ...(getStringExtension(component.extensions, 'sourceTemplate') ? { sourceTemplate: getStringExtension(component.extensions, 'sourceTemplate') } : {}),
            ...(summary?.childrenSlotKind ? { childrenSlotKind: summary.childrenSlotKind } : {}),
            ...createStoryInsertExtensions({ componentName, contracts: insertContracts, storyExport }),
          },
        });
      }
      const candidateNames = new Set(candidates.map((candidate) => candidate.componentName));
      const hasUnresolvedSourceComponent = registry.components.some((registered) => {
        const registeredSourceFile = normalizeProjectComponentPath(registered.sourceFile);
        if (registeredSourceFile !== normalizeProjectComponentPath(sourceFile)) return false;
        if (getComponentStorySourceFile(registered, registeredSourceFile) !== storySourceFile) return false;
        const componentName = getStringExtension(registered.extensions, 'sourceExportName') ??
          getStringExtension(registered.extensions, 'importName') ??
          registered.name;
        return summaryByName.has(componentName) && !candidateNames.has(componentName);
      });
      return { candidates, reconcileBlocked: hasUnresolvedSourceComponent, sourceFile };
    },
  );

  const blockedSourceFiles = new Set(moduleResults
    .filter((result) => result.reconcileBlocked)
    .map((result) => normalizeProjectComponentPath(result.sourceFile)));
  const candidates = moduleResults.flatMap((result) => (
    blockedSourceFiles.has(normalizeProjectComponentPath(result.sourceFile)) ? [] : result.candidates
  ));
  if (candidates.length === 0) return registry;
  const nextRegistry = reconcileWorkbenchComponentLibrary(registry, candidates).nextRegistry;
  return areComponentRegistriesEqual(registry, nextRegistry) ? registry : nextRegistry;
}

async function collectProjectLocalLibraryIds({
  pages,
  readSourceFile,
  registry,
}: {
  pages: WorkbenchPageRegistry;
  readSourceFile: ProjectSourceReader;
  registry: WorkbenchComponentRegistry;
}): Promise<string[]> {
  const libraryIds = new Set<string>();

  const registeredLibraries = registry.extensions?.libraries ?? {};
  for (const [libraryId, library] of Object.entries(registeredLibraries)) {
    if (shouldHydrateRegisteredProjectLocalLibrary(libraryId, library)) libraryIds.add(libraryId.toLowerCase());
  }

  for (const component of registry.components) {
    const match = LOCAL_LIBRARY_SOURCE_PATTERN.exec(component.sourceFile);
    if (match?.[1]) libraryIds.add(match[1].toLowerCase());
    const extensionLibraryId = component.extensions?.libraryId;
    const registeredLibrary = typeof extensionLibraryId === 'string' ? registeredLibraries[extensionLibraryId] : undefined;
    if (
      typeof extensionLibraryId === 'string' &&
      shouldHydrateRegisteredProjectLocalLibrary(extensionLibraryId, registeredLibrary)
    ) {
      libraryIds.add(extensionLibraryId.toLowerCase());
    }
  }

  await Promise.all(pages.pages.map(async (page) => {
    const sourceRead = await readSourceFile(page.sourceFile);
    if (!sourceRead.ok) return;
    for (const libraryId of getProjectLocalLibraryIdsFromSource(sourceRead.contents)) {
      libraryIds.add(libraryId);
    }
  }));

  return [...libraryIds].sort();
}

function shouldHydrateRegisteredProjectLocalLibrary(
  libraryId: string,
  library: WorkbenchLibraryRegistryEntry | undefined,
): boolean {
  if (!isSafeLocalLibraryId(libraryId) || !library) return false;
  const id = libraryId.toLowerCase();
  const expectedRoot = `src/libraries/${id}`;
  const snapshotRoot = normalizeProjectComponentPath(library.snapshotRoot ?? '').replace(/\/+$/, '');
  const sourcePath = normalizeProjectComponentPath(library.sourcePath ?? '').replace(/\/+$/, '');
  return snapshotRoot === expectedRoot ||
    sourcePath === expectedRoot ||
    sourcePath === `${expectedRoot}/components`;
}

function getProjectLocalLibraryIdsFromSource(contents: string): string[] {
  const ids = new Set<string>();
  for (const match of contents.matchAll(LOCAL_LIBRARY_IMPORT_PATTERN)) {
    if (match[3]) ids.add(match[3].toLowerCase());
  }
  return [...ids];
}

async function collectPageImportedProjectComponentSourceFiles({
  pages,
  readSourceFile,
}: {
  pages: WorkbenchPageRegistry;
  readSourceFile: ProjectSourceReader;
}): Promise<string[]> {
  const sourceFiles = new Set<string>();

  await Promise.all(pages.pages.map(async (page) => {
    const sourceRead = await readSourceFile(page.sourceFile);
    if (!sourceRead.ok) return;
    const pageDirectory = getProjectSourceDirectory(page.sourceFile);

    await Promise.all(getProjectComponentImportsFromSource(sourceRead.contents).map(async (importSource) => {
      const sourceFile = await resolvePageImportedProjectComponentSourceFile({
        importSource,
        pageDirectory,
        readSourceFile,
      });
      if (sourceFile) sourceFiles.add(sourceFile);
    }));
  }));

  return [...sourceFiles].sort();
}

function getProjectComponentImportsFromSource(contents: string): string[] {
  const imports = new Set<string>();
  for (const match of contents.matchAll(PROJECT_COMPONENT_IMPORT_PATTERN)) {
    const importSource = match[2]?.trim();
    if (importSource) imports.add(importSource);
  }
  return [...imports];
}

async function resolvePageImportedProjectComponentSourceFile({
  importSource,
  pageDirectory,
  readSourceFile,
}: {
  importSource: string;
  pageDirectory: string;
  readSourceFile: ProjectSourceReader;
}): Promise<string | null> {
  if (!importSource.startsWith('.')) return null;

  const basePath = normalizeProjectComponentPath(resolveProjectRelativePath(pageDirectory, importSource));
  if (
    basePath === PROJECT_LOCAL_COMPONENTS_ROOT ||
    basePath === `${PROJECT_LOCAL_COMPONENTS_ROOT}/index` ||
    !basePath.startsWith(`${PROJECT_LOCAL_COMPONENTS_ROOT}/`)
  ) {
    return null;
  }

  if (isSourceModulePath(basePath)) {
    const read = await readSourceFile(basePath);
    return read.ok ? basePath : null;
  }

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    const read = await readSourceFile(candidate);
    if (read.ok) return candidate;
  }

  return null;
}

function getProjectSourceDirectory(sourceFile: string): string {
  const normalized = normalizeProjectComponentPath(sourceFile);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash < 0 ? '' : normalized.slice(0, lastSlash);
}

function parseCsfStoryComponentExports(contents: string): CsfStoryComponentExport[] {
  const exports: CsfStoryComponentExport[] = [];
  for (const match of contents.matchAll(CSF_STORY_EXPORT_PATTERN)) {
    const exportName = match[1] ?? '';
    const body = match[2] ?? '';
    if (!exportName || !/^[A-Z][A-Za-z0-9_]*$/.test(exportName)) continue;
    const storyName = getTopLevelCsfStoryName(body);
    exports.push({
      exportName,
      name: storyName,
    });
  }
  return exports;
}

function getTopLevelCsfStoryName(body: string): string | null {
  const properties: Array<{ indent: number; key: string; value: string | null }> = [];
  const propertyPattern = /^([ \t]*)([A-Za-z_$][A-Za-z0-9_$]*):(?:\s*['"]([^'"]+)['"])?/gm;
  for (const match of body.matchAll(propertyPattern)) {
    properties.push({
      indent: (match[1] ?? '').replace(/\t/g, '  ').length,
      key: match[2] ?? '',
      value: match[3] ?? null,
    });
  }
  if (properties.length === 0) return null;
  const topLevelIndent = Math.min(...properties.map((property) => property.indent));
  return properties.find((property) => (
    property.indent === topLevelIndent && property.key === 'name' && property.value
  ))?.value ?? null;
}

function resolveCsfStoryComponentName(
  storyExport: CsfStoryComponentExport,
  summaryByName: Map<string, ImportableComponentSummary>,
): string | null {
  const candidates = [
    storyExport.name,
    storyExport.exportName,
    storyExport.exportName.replace(/Story$/, ''),
  ].filter((candidate): candidate is string => Boolean(candidate && isComponentIdentifierName(candidate)));
  const exact = candidates.find((candidate) => summaryByName.has(candidate));
  if (exact) return exact;

  for (const candidate of candidates) {
    const matches = [...summaryByName.keys()].filter((componentName) => (
      getWorkbenchCsfStoryNameAliases({ componentName }).includes(candidate)
    ));
    if (matches.length === 1) return matches[0];
  }
  return null;
}

/**
 * Insert-picker extensions for one story-backed component.
 *
 * A story-declared `authoring` block is authoritative in both directions: it
 * can hide a sub-part the name heuristic would expose, and it can expose a
 * component the heuristic would hide. That matters for libraries whose
 * convention is one story export named exactly like its component — the
 * heuristic reads every such export as a root component, which is how the
 * Astryx starter ended up with 297 components and zero hidden sub-parts.
 */
function createStoryInsertExtensions({
  componentName,
  contracts,
  storyExport,
}: {
  componentName: string;
  contracts: WorkbenchStoryInsertContracts;
  storyExport: CsfStoryComponentExport;
}): Record<string, unknown> {
  const contract: WorkbenchStoryInsertContract | null =
    resolveWorkbenchStoryInsertContract(contracts, storyExport.exportName);
  const hiddenFromInsert = contract?.hiddenFromInsert ?? isHiddenCsfStoryComponent(storyExport, componentName);
  return {
    ...(contract && contract.allowedChildren.length > 0 ? { allowedChildren: contract.allowedChildren } : {}),
    ...(contract?.group ? { componentGroup: contract.group } : {}),
    ...(hiddenFromInsert ? { hiddenFromInsert: true } : {}),
  };
}

function isHiddenCsfStoryComponent(storyExport: CsfStoryComponentExport, componentName: string): boolean {
  const componentNameAliases = getWorkbenchCsfStoryNameAliases({ componentName });
  if (componentNameAliases.includes(storyExport.exportName)) return false;
  if (SHADCN_BASE_ROOT_INSERT_COMPONENTS.has(componentName)) {
    const storyComponentName = storyExport.name && isComponentIdentifierName(storyExport.name)
      ? storyExport.name
      : storyExport.exportName.replace(/Story$/, '');
    if (componentNameAliases.includes(storyComponentName)) return false;
  }
  if (storyExport.exportName.endsWith('Story')) return true;
  if (storyExport.name && isComponentIdentifierName(storyExport.name)) {
    return !componentNameAliases.includes(storyExport.name);
  }
  return true;
}

function isComponentIdentifierName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*$/.test(value);
}

function parseLocalLibraryBarrelExports(contents: string): LocalLibraryExport[] {
  const exports: LocalLibraryExport[] = [];
  for (const match of contents.matchAll(BARREL_EXPORT_PATTERN)) {
    const specifierList = match[1] ?? '';
    const moduleSource = match[3] ?? '';
    if (!moduleSource.startsWith('.')) continue;
    for (const rawSpecifier of specifierList.split(',')) {
      const exportName = getLocalLibraryExportName(rawSpecifier);
      if (!exportName) continue;
      exports.push({ exportName, moduleSource });
    }
  }
  return exports;
}

function getLocalLibraryExportName(rawSpecifier: string): string | null {
  const specifier = rawSpecifier.trim();
  if (!specifier) return null;
  const parts = specifier.split(/\s+as\s+/i).map((part) => part.trim()).filter(Boolean);
  const exportName = parts[parts.length - 1] ?? '';
  return /^[A-Z][A-Za-z0-9]*$/.test(exportName) ? exportName : null;
}

async function resolveLocalLibraryModule({
  componentsRoot,
  moduleSource,
  readSourceFile,
}: {
  componentsRoot: string;
  moduleSource: string;
  readSourceFile: ProjectSourceReader;
}): Promise<LocalLibraryModule> {
  const basePath = resolveProjectRelativePath(componentsRoot, moduleSource);
  if (/\.(tsx?|jsx?)$/i.test(basePath)) {
    const read = await readSourceFile(basePath);
    return { contents: read.ok ? read.contents : null, sourceFile: basePath };
  }

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    const read = await readSourceFile(candidate);
    if (read.ok) return { contents: read.contents, sourceFile: candidate };
  }

  return { contents: null, sourceFile: `${basePath}.tsx` };
}

function resolveProjectRelativePath(fromDirectory: string, relativeSource: string): string {
  const parts = fromDirectory.split('/').filter(Boolean);
  for (const part of relativeSource.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join('/');
}

function getLocalLibraryModuleFallbackName(sourceFile: string): string {
  const fileName = sourceFile.split('/').pop() ?? sourceFile;
  return fileName.replace(/\.(tsx?|jsx?|vue)$/i, '') || 'ImportedComponent';
}

function getComponentStorySourceFile(
  component: WorkbenchComponentRegistry['components'][number],
  sourceFile: string,
): string | null {
  const configured = getStringExtension(component.extensions, 'storySourceFile');
  if (configured && isSourceModulePath(configured)) return normalizeProjectComponentPath(configured);
  return getDefaultComponentStorySourceFile(sourceFile);
}

// Vue SFC components pair with a JSX-free `.stories.ts` CSF module: a
// `.stories.tsx` file would fail the vue project's own vue-tsc check.
function getDefaultComponentStorySourceFile(sourceFile: string): string {
  if (/\.vue$/i.test(sourceFile)) return sourceFile.replace(/\.vue$/i, '.stories.ts');
  return `${sourceFile.replace(/\.(tsx?|jsx?)$/i, '')}.stories.tsx`;
}

function getComponentHydrationLibraryContext(
  registry: WorkbenchComponentRegistry,
  component: WorkbenchComponentRegistry['components'][number],
): {
  libraryId: string | null;
  librarySnapshotRoot: string | null;
  librarySourcePath: string | null;
  libraryUpdatePolicy: string | null;
} {
  const libraryId = getStringExtension(component.extensions, 'libraryId');
  const library = libraryId ? registry.extensions?.libraries?.[libraryId] : null;
  return {
    libraryId,
    librarySourcePath: getStringExtension(component.extensions, 'librarySourcePath') ?? library?.sourcePath ?? null,
    librarySnapshotRoot: getStringExtension(component.extensions, 'librarySnapshotRoot') ?? library?.snapshotRoot ?? null,
    libraryUpdatePolicy: getStringExtension(component.extensions, 'libraryUpdatePolicy') ?? library?.updatePolicy ?? null,
  };
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }));

  return results;
}

function normalizeProjectComponentPath(path: string): string {
  return path.trim().replace(/^[/\\]+/, '').replace(/\\/g, '/').replace(/\/+/g, '/');
}

function isSourceModulePath(path: string): boolean {
  return /\.(tsx?|jsx?|vue)$/i.test(path);
}

function isSafeLocalLibraryId(libraryId: string): boolean {
  return /^[a-z][a-z0-9-]*$/i.test(libraryId.trim());
}

function areComponentRegistriesEqual(
  previous: WorkbenchComponentRegistry,
  next: WorkbenchComponentRegistry,
): boolean {
  if (previous === next) return true;
  return JSON.stringify(previous.components) === JSON.stringify(next.components) &&
    JSON.stringify(previous.extensions ?? {}) === JSON.stringify(next.extensions ?? {});
}
