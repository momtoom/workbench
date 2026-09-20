import { importTokensFromSource } from '@domain/design-system/tokens/importSource';
import { mergeTokenRegistryImports, normalizeImportedRegistry } from '@domain/design-system/tokens/operations';
import type { TokenRegistry } from '@domain/design-system/tokens/types';
import type { ImportableComponentSummary } from '@domain/document/editableTreeSourceParser';
import { getImportableComponentSummariesFromComponentSource } from '@domain/document/pageSourceAdapter';
import {
  applyWorkbenchPropRegistry,
} from '../../workbench-stories/propRegistry';
import { sortWorkbenchStoryControls } from '../../workbench-stories/storyPropOrder';
import {
  isWorkbenchStorySelectOption,
  type WorkbenchStoryArgs,
  type WorkbenchStoryControl,
  type WorkbenchStoryControlAssetKind,
  type WorkbenchStoryControlPicker,
  type WorkbenchStoryControlTokenType,
  type WorkbenchStoryMetadata,
} from '../../workbench-stories/storyTypes';
import {
  addProjectLocalLibraryCssImport,
  getImportedLibraryTokenSourcePath,
  getProjectLocalLibraryCssImportName,
  inferImportedLibraryFromComponentFolderRelativePath,
  inferImportedLibraryFromRelativePath,
  resolveImportedLibraryMetadata,
  resolveImportedLibraryOriginPath,
  resolveImportedLibraryProjectPath,
  shouldAddProjectLocalLibraryCssImport,
  shouldSkipImportedLibraryCssScan,
  upsertImportedLibraryRegistryMetadata,
  type WorkbenchImportedLibraryMetadata,
} from './workbenchLibraryOwnership';
import type { WorkbenchComponentRegistry } from './workbenchProject';
import {
  readWorkbenchDiskImportFiles,
  readWorkbenchSourceFile,
  saveWorkbenchComponents,
  saveWorkbenchTokenCss,
  saveWorkbenchTokens,
  writeWorkbenchSourceFile,
} from './workbenchProjectLoader';
import {
  getWorkbenchImportedComponentDisplayName,
  getWorkbenchImportedComponentRegistryId,
  reconcileWorkbenchComponentLibrary,
  type WorkbenchComponentLibraryCandidate,
} from './workbenchProjectRegistryOperations';
import { findCsfStoryForComponent } from './workbenchComponentStorySource';

const IMPORTABLE_LIBRARY_FILE_PATTERN = /\.(?:css|json|jsx?|tsx?|vue)$/i;

export type WorkbenchComponentLibraryImportItem = {
  name: string;
  relativePath: string;
  readText: () => Promise<string>;
  sourcePath?: string;
};

export type WorkbenchComponentLibraryImportResult =
  | {
      ok: true;
      addedCount: number;
      count: number;
      tokenCollectionCount: number;
      unchangedCount: number;
      updatedCount: number;
    }
  | { ok: false; message: string };

export type WorkbenchComponentLibraryImportOutcome = {
  nextComponents?: WorkbenchComponentRegistry;
  nextTokenRegistry?: TokenRegistry;
  result: WorkbenchComponentLibraryImportResult;
};

type ComponentLibraryStagedFile = {
  componentNames: string[];
  componentSummaries: ImportableComponentSummary[];
  contents: string;
  fallbackName: string;
  isSourceModule: boolean;
  libraryMetadata: WorkbenchImportedLibraryMetadata | null;
  originalPath: string;
  path: string;
};

export async function importWorkbenchComponentLibrary({
  componentRegistryPath,
  files,
  liveComponents,
  liveTokenRegistry,
  tokenCssPath,
  tokenRegistryPath,
}: {
  componentRegistryPath: string;
  files: WorkbenchComponentLibraryImportItem[];
  liveComponents: WorkbenchComponentRegistry;
  liveTokenRegistry: TokenRegistry;
  tokenCssPath: string;
  tokenRegistryPath: string;
}): Promise<WorkbenchComponentLibraryImportOutcome> {
  if (files.length === 0) {
    return { result: { ok: false, message: 'No files selected.' } };
  }

  type TokenRegistryImport = { contents: string; isLibrarySnapshot: boolean; path: string; registry: TokenRegistry };
  type TokenSourceImport = { contents: string; path: string };
  type StoryMetadataImport = { path: string; stories: WorkbenchStoryMetadata[] };
  type CsfStoryImport = { path: string };
  const stagedFiles: ComponentLibraryStagedFile[] = [];
  const tokenRegistryImports: TokenRegistryImport[] = [];
  const tokenSourceImports: TokenSourceImport[] = [];
  const storyMetadataImports: StoryMetadataImport[] = [];
  const csfStoryImports: CsfStoryImport[] = [];
  const fileSelectionLibraryMetadata = inferImportedLibraryMetadataFromFileSelection(files);
  const inferredFileSelectionLibraries = new Map<string, WorkbenchImportedLibraryMetadata>();

  for (const file of files) {
    if (!IMPORTABLE_LIBRARY_FILE_PATTERN.test(file.name)) continue;
    const raw = file.relativePath;
    let rel = raw.length > 0 ? raw : `components/${file.name}`;
    let effectiveSourcePath = file.sourcePath;
    let libraryMetadata = resolveImportedLibraryMetadata(effectiveSourcePath);
    if (!libraryMetadata) {
      const inferred = inferImportedLibraryFromRelativePath(rel);
      if (inferred) {
        libraryMetadata = inferred.libraryMetadata;
        effectiveSourcePath = inferred.libraryMetadata.librarySourcePath;
        rel = inferred.relativeInsideSnapshot || `components/${file.name}`;
      }
    }
    if (!libraryMetadata && !effectiveSourcePath && fileSelectionLibraryMetadata && rel.replace(/\\/g, '/').startsWith('components/')) {
      libraryMetadata = fileSelectionLibraryMetadata;
      effectiveSourcePath = fileSelectionLibraryMetadata.librarySourcePath;
    }
    if (libraryMetadata) inferredFileSelectionLibraries.set(libraryMetadata.libraryId, libraryMetadata);

    const path = resolveImportedLibraryProjectPath(rel, libraryMetadata);
    const contents = await file.readText();
    const isLibraryTokenRegistry = Boolean(libraryMetadata && path.endsWith('/tokens.json'));
    const isSourceModule = /\.(tsx|jsx|vue)$/i.test(file.name) && !isStoryPreviewPath(path) && !isCsfStoryPath(path);
    const fallbackName = getImportedComponentFallbackName(path, file.name);
    const componentSummaries = isSourceModule
      ? await getImportableComponentSummariesFromComponentSource({ contents, fallbackName, sourceFile: path })
      : [];
    const componentNames = componentSummaries.map((component) => component.name);
    const originalPath = resolveImportedLibraryOriginPath(effectiveSourcePath, raw.length > 0 ? raw : file.name);
    const libraryOwnedFile = { componentNames, contents, originalPath, path };
    const cssImportName = getProjectLocalLibraryCssImportName(libraryOwnedFile);
    const stagedContents = cssImportName && shouldAddProjectLocalLibraryCssImport(libraryOwnedFile)
      ? addProjectLocalLibraryCssImport(contents, cssImportName)
      : contents;

    if (!isLibraryTokenRegistry) {
      stagedFiles.push({
        path,
        contents: stagedContents,
        componentNames,
        componentSummaries,
        fallbackName,
        isSourceModule,
        libraryMetadata,
        originalPath,
      });
    }
    const storyMetadata = parseStoryMetadataImport(contents, path);
    if (storyMetadata) {
      storyMetadataImports.push({ path, stories: storyMetadata });
      continue;
    }
    if (isCsfStoryPath(path)) {
      csfStoryImports.push({ path });
      continue;
    }
    const tokenRegistry = parseTokenRegistryImport(contents, path);
    if (tokenRegistry) {
      tokenRegistryImports.push({
        contents,
        isLibrarySnapshot: isLibraryTokenRegistry,
        path,
        registry: tokenRegistry,
      });
    } else if (/\.(css|json)$/i.test(file.name)) {
      tokenSourceImports.push({ contents, path });
    }
  }

  for (const metadata of inferredFileSelectionLibraries.values()) {
    const tokenSnapshotPath = `${metadata.snapshotRoot}/tokens.json`;
    if (tokenRegistryImports.some((tokenImport) => tokenImport.path === tokenSnapshotPath)) continue;
    const tokenSourcePath = getImportedLibraryTokenSourcePath(metadata);
    const tokenRead = await readWorkbenchDiskImportFiles(tokenSourcePath);
    if (!tokenRead.ok) continue;
    const tokenFile = tokenRead.files.find((file) => file.name === 'tokens.json');
    if (!tokenFile) continue;
    const tokenRegistry = parseTokenRegistryImport(tokenFile.contents, tokenSnapshotPath);
    if (!tokenRegistry) continue;
    tokenRegistryImports.push({
      contents: tokenFile.contents,
      isLibrarySnapshot: true,
      path: tokenSnapshotPath,
      registry: tokenRegistry,
    });
  }

  if (stagedFiles.length === 0 && tokenRegistryImports.length === 0 && tokenSourceImports.length === 0) {
    return { result: { ok: false, message: 'No importable component or token files were found.' } };
  }

  for (const staged of stagedFiles) {
    const result = await writeWorkbenchSourceFile(staged.path, staged.contents, { overwrite: true, normalize: false });
    if (!result.ok) return { result: { ok: false, message: result.message } };
  }

  const componentCandidates: WorkbenchComponentLibraryCandidate[] = stagedFiles
    .flatMap((staged) => staged.componentSummaries.map((componentSummary) => {
      const componentName = componentSummary.name;
      const displayName = getWorkbenchImportedComponentDisplayName(componentName, staged.fallbackName);
      const storyMetadata = findStoryMetadataForComponent({
        componentName,
        displayName,
        sourceFile: staged.path,
        stories: storyMetadataImports,
      });
      const csfStory = findCsfStoryForComponent({
        componentName,
        displayName,
        sourceFile: staged.path,
        stories: csfStoryImports,
      });
      return {
        componentName,
        displayName,
        sourceFile: staged.path,
        extensions: {
          sourceTruth: 'project-local',
          originSourceFile: staged.originalPath,
          currentSourceFile: staged.path,
          syncStatus: 'detached',
          ...(componentSummary.childrenSlotKind ? { childrenSlotKind: componentSummary.childrenSlotKind } : {}),
          ...(staged.libraryMetadata ? {
            libraryId: staged.libraryMetadata.libraryId,
            librarySourcePath: staged.libraryMetadata.librarySourcePath,
            librarySnapshotRoot: staged.libraryMetadata.snapshotRoot,
            libraryUpdatePolicy: staged.libraryMetadata.updatePolicy,
            sourceTruth: 'library-snapshot',
            syncStatus: 'pinned',
          } : {}),
          ...(storyMetadata ? {
            story: resolveStoryMetadataPaths(storyMetadata.story, storyMetadata.path),
            storySourceFile: storyMetadata.path,
          } : {}),
          ...(csfStory ? { storyFormat: 'csf', storySourceFile: csfStory.path } : {}),
        },
      };
    }));
  const componentReconcile = reconcileWorkbenchComponentLibrary(liveComponents, componentCandidates);
  const nextComponents = upsertImportedLibraryRegistryMetadata(componentReconcile.nextRegistry, stagedFiles);

  let importedTokenCount = 0;
  let nextTokens: TokenRegistry | null = null;
  try {
    await reconcileProjectComponentBarrelExports(stagedFiles);
    const previousTokenRegistryImports: Array<TokenRegistry | null> = [];
    for (const tokenImport of tokenRegistryImports) {
      const previous = tokenImport.isLibrarySnapshot
        ? await readWorkbenchSourceFile(tokenImport.path)
        : null;
      previousTokenRegistryImports.push(previous?.ok ? parseTokenRegistryImport(previous.contents, tokenImport.path) : null);
      if (!tokenImport.isLibrarySnapshot) continue;
      const result = await writeWorkbenchSourceFile(tokenImport.path, tokenImport.contents, { overwrite: true, normalize: false });
      if (!result.ok) return { result: { ok: false, message: result.message } };
    }
    await saveWorkbenchComponents(componentRegistryPath, nextComponents);
    if (tokenRegistryImports.length > 0) {
      nextTokens = mergeTokenRegistryImports(
        nextTokens ?? liveTokenRegistry,
        tokenRegistryImports.map((tokenImport) => tokenImport.registry),
        previousTokenRegistryImports,
      );
    }
    for (const tokenSource of tokenSourceImports) {
      if (shouldSkipPartialImportedCssTokenImport(nextTokens ?? liveTokenRegistry, tokenSource.path)) continue;
      const result = importTokensFromSource(nextTokens ?? liveTokenRegistry, tokenSource.contents, tokenSource.path);
      if (result.importedCount === 0) continue;
      nextTokens = result.registry;
      importedTokenCount += result.importedCount;
    }
    if (nextTokens) {
      await saveWorkbenchTokens(tokenRegistryPath, nextTokens);
      await saveWorkbenchTokenCss(tokenCssPath, nextTokens);
    }
  } catch (error) {
    return {
      result: {
        ok: false,
        message: error instanceof Error ? error.message : 'Library registry save failed.',
      },
    };
  }

  return {
    nextComponents,
    ...(nextTokens ? { nextTokenRegistry: nextTokens } : {}),
    result: {
      ok: true,
      addedCount: componentReconcile.addedCount,
      count: componentReconcile.registeredComponents.length,
      tokenCollectionCount: tokenRegistryImports.reduce(
        (total, tokenImport) => total + tokenImport.registry.collections.length,
        0,
      ) + (importedTokenCount > 0 ? 1 : 0),
      unchangedCount: componentReconcile.unchangedCount,
      updatedCount: componentReconcile.updatedCount,
    },
  };
}

async function reconcileProjectComponentBarrelExports(stagedFiles: ComponentLibraryStagedFile[]): Promise<void> {
  const requests = collectComponentBarrelExportRequests(stagedFiles);
  for (const [barrelPath, sourceRequests] of requests) {
    const current = await readWorkbenchSourceFile(barrelPath);
    let nextContents = current.ok ? current.contents : '';
    for (const [exportSource, names] of sourceRequests) {
      nextContents = upsertNamedBarrelExport(nextContents, exportSource, names);
    }
    if (current.ok && current.contents === nextContents) continue;
    const result = await writeWorkbenchSourceFile(barrelPath, ensureTrailingNewline(nextContents), {
      normalize: false,
      overwrite: true,
    });
    if (!result.ok) throw new Error(result.message);
  }
}

function collectComponentBarrelExportRequests(
  stagedFiles: ComponentLibraryStagedFile[],
): Map<string, Map<string, string[]>> {
  const requests = new Map<string, Map<string, string[]>>();
  for (const staged of stagedFiles) {
    if (!staged.isSourceModule || staged.componentNames.length === 0) continue;
    const barrelPath = getProjectLibraryBarrelPath(staged.path);
    if (!barrelPath) continue;
    const exportSource = getRelativeBarrelExportSource(barrelPath, staged.path);
    if (!exportSource) continue;
    const sourceRequests = requests.get(barrelPath) ?? new Map<string, string[]>();
    const names = sourceRequests.get(exportSource) ?? [];
    for (const name of staged.componentNames) {
      if (!names.includes(name)) names.push(name);
    }
    sourceRequests.set(exportSource, names);
    requests.set(barrelPath, sourceRequests);
  }
  return requests;
}

function getProjectLibraryBarrelPath(sourceFile: string): string | null {
  const parts = sourceFile.split('/').filter(Boolean);
  if (parts[0] !== 'src' || parts.length < 3) return null;
  if (/^index\.(tsx?|jsx?)$/i.test(parts[parts.length - 1] ?? '')) return null;
  if (parts[1] === 'libraries' && parts.length >= 5) return `${parts.slice(0, -1).join('/')}/index.ts`;
  return `src/${parts[1]}/index.ts`;
}

function getRelativeBarrelExportSource(barrelPath: string, sourceFile: string): string | null {
  const sourceWithoutExtension = sourceFile.replace(/\.(tsx?|jsx?)$/i, '');
  if (sourceWithoutExtension === sourceFile) return null;
  const barrelDirParts = barrelPath.split('/').slice(0, -1);
  const sourceParts = sourceWithoutExtension.split('/');
  let shared = 0;
  while (barrelDirParts[shared] && barrelDirParts[shared] === sourceParts[shared]) shared += 1;
  const upward = barrelDirParts.slice(shared).map(() => '..');
  const downward = sourceParts.slice(shared);
  const relative = [...upward, ...downward].join('/');
  if (!relative) return null;
  return relative.startsWith('..') ? relative : `./${relative}`;
}

function upsertNamedBarrelExport(contents: string, exportSource: string, names: string[]): string {
  const uniqueNames = [...new Set(names)].filter(Boolean);
  if (uniqueNames.length === 0) return contents;
  const exportPattern = new RegExp(
    `^export\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escapeRegExp(exportSource)}['"];?\\s*$`,
    'm',
  );
  const match = exportPattern.exec(contents);
  if (!match) return `${ensureTrailingNewline(contents)}${formatNamedBarrelExport(uniqueNames, exportSource)}\n`;
  const nextSpecifiers = [...parseNamedExportSpecifiers(match[1] ?? '')];
  for (const name of uniqueNames) {
    if (!nextSpecifiers.includes(name)) nextSpecifiers.push(name);
  }
  return contents.replace(match[0], formatNamedBarrelExport(nextSpecifiers, exportSource));
}

function parseNamedExportSpecifiers(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function formatNamedBarrelExport(names: string[], exportSource: string): string {
  return `export { ${names.join(', ')} } from '${exportSource}';`;
}

function ensureTrailingNewline(contents: string): string {
  return contents.endsWith('\n') || contents.length === 0 ? contents : `${contents}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseStoryMetadataImport(contents: string, projectPath: string): WorkbenchStoryMetadata[] | null {
  if (!isStoryMetadataPath(projectPath)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return null;
  }
  const candidates = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.stories)
      ? parsed.stories
      : isRecord(parsed) && Array.isArray(parsed.components)
        ? parsed.components
        : [parsed];
  const stories = candidates.map(normalizeStoryMetadata).filter((story): story is WorkbenchStoryMetadata => Boolean(story));
  return stories.length > 0 ? stories : null;
}

function isStoryMetadataPath(projectPath: string): boolean {
  const lower = projectPath.toLowerCase();
  return lower.endsWith('.stories.json') ||
    lower.endsWith('.story.json') ||
    lower.endsWith('/workbench.stories.json') ||
    lower.endsWith('workbench.stories.json');
}

function isStoryPreviewPath(projectPath: string): boolean {
  const lower = projectPath.toLowerCase();
  return lower.endsWith('.preview.tsx') ||
    lower.endsWith('.preview.jsx') ||
    lower.endsWith('.story-preview.tsx') ||
    lower.endsWith('.story-preview.jsx');
}

function isCsfStoryPath(projectPath: string): boolean {
  const lower = projectPath.toLowerCase();
  return lower.endsWith('.stories.tsx') ||
    lower.endsWith('.stories.jsx') ||
    lower.endsWith('.stories.ts') ||
    lower.endsWith('.story.tsx') ||
    lower.endsWith('.story.jsx') ||
    lower.endsWith('.story.ts');
}

function normalizeStoryMetadata(value: unknown): WorkbenchStoryMetadata | null {
  if (!isRecord(value)) return null;
  const name = getTrimmedString(value.name) ?? getTrimmedString(value.componentName);
  const componentId = getTrimmedString(value.componentId) ?? (name ? `story-${sanitizeImportedComponentId(name)}` : null);
  if (!name || !componentId) return null;
  const componentContext = {
    componentId,
    componentName: getTrimmedString(value.componentName) ?? undefined,
    name,
    previewExportName: getTrimmedString(value.previewExportName) ?? undefined,
    sourceFile: getTrimmedString(value.sourceFile) ?? undefined,
  };
  return {
    componentId,
    componentName: componentContext.componentName,
    controls: sortWorkbenchStoryControls(applyWorkbenchPropRegistry(normalizeStoryControls(value.controls), componentContext)),
    defaultArgs: normalizeStoryArgs(value.defaultArgs),
    description: getTrimmedString(value.description) ?? '',
    name,
    previewExportName: componentContext.previewExportName,
    previewSourceFile: getTrimmedString(value.previewSourceFile) ?? undefined,
    sourceFile: componentContext.sourceFile,
    variants: normalizeStoryVariants(value.variants),
  };
}

function normalizeStoryArgs(value: unknown): WorkbenchStoryArgs {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string | number | boolean] => (
    typeof entry[0] === 'string' &&
    (typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean')
  )));
}

function normalizeStoryControls(value: unknown): WorkbenchStoryControl[] {
  return getStoryControlCandidates(value).flatMap((candidate): WorkbenchStoryControl[] => {
    if (!isRecord(candidate)) return [];
    const key = getTrimmedString(candidate.key);
    const label = getTrimmedString(candidate.label) ?? key;
    const type = getStoryControlType(candidate);
    if (key === 'className' || !key || !label) return [];
    const base = {
      ...normalizeStoryControlRegistryMetadata(candidate),
      key,
      label,
      multiline: candidate.multiline === true ? true : undefined,
      order: getFiniteNumber(candidate.order) ?? undefined,
      when: normalizeStoryControlCondition(candidate.when),
      whenAll: normalizeStoryControlConditions(candidate.whenAll),
    };
    if (type === 'select') {
      const options = Array.isArray(candidate.options) ? candidate.options.filter(isWorkbenchStorySelectOption) : [];
      return options.length > 0 ? [{ ...base, options, type }] : [];
    }
    if (type === 'boolean' || type === 'icon' || type === 'text') return [{ ...base, type }];
    if (type === 'number') {
      return [{
        ...base,
        leading: getTrimmedString(candidate.leading) ?? undefined,
        max: getFiniteNumber(candidate.max) ?? undefined,
        min: getFiniteNumber(candidate.min) ?? undefined,
        scrubStep: getFiniteNumber(candidate.scrubStep) ?? undefined,
        step: getFiniteNumber(candidate.step) ?? undefined,
        type,
      }];
    }
    return [];
  });
}

function getStoryControlCandidates(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  return Object.entries(value).map(([key, config]) => (
    isRecord(config) ? { ...config, key } : { key, type: config }
  ));
}

function getStoryControlType(candidate: Record<string, unknown>): string | null {
  const type = getTrimmedString(candidate.type);
  if (type) return type;
  const control = candidate.control;
  if (typeof control === 'string' && control.trim()) return control.trim();
  if (isRecord(control)) return getTrimmedString(control.type);
  return null;
}

function normalizeStoryControlRegistryMetadata(candidate: Record<string, unknown>): Pick<
  WorkbenchStoryControl,
  'assetKinds' | 'groupId' | 'groupLabel' | 'groupOrder' | 'picker' | 'tokenTypes'
> {
  return {
    assetKinds: normalizeStoryControlAssetKinds(candidate.assetKinds),
    groupId: getTrimmedString(candidate.groupId) ?? undefined,
    groupLabel: getTrimmedString(candidate.groupLabel) ?? undefined,
    groupOrder: getFiniteNumber(candidate.groupOrder) ?? undefined,
    picker: normalizeStoryControlPicker(candidate.picker),
    tokenTypes: normalizeStoryControlTokenTypes(candidate.tokenTypes),
  };
}

function normalizeStoryControlPicker(value: unknown): WorkbenchStoryControlPicker | undefined {
  const picker = getTrimmedString(value);
  return picker === 'asset' || picker === 'asset-token' || picker === 'auto' || picker === 'none' || picker === 'token'
    ? picker
    : undefined;
}

function normalizeStoryControlAssetKinds(value: unknown): WorkbenchStoryControlAssetKind[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter((item): item is WorkbenchStoryControlAssetKind => (
    item === 'font' || item === 'icon' || item === 'image' || item === 'video'
  ));
  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeStoryControlTokenTypes(value: unknown): WorkbenchStoryControlTokenType[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter((item): item is WorkbenchStoryControlTokenType => (
    item === 'angle' ||
    item === 'boolean' ||
    item === 'color' ||
    item === 'dimension' ||
    item === 'duration' ||
    item === 'gradient' ||
    item === 'number' ||
    item === 'opacity' ||
    item === 'string'
  ));
  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeStoryControlCondition(value: unknown): WorkbenchStoryControl['when'] {
  if (!isRecord(value)) return undefined;
  const key = getTrimmedString(value.key);
  if (!key) return undefined;
  const values = Array.isArray(value.value) ? value.value : [value.value];
  const normalized = values.filter((item): item is string | number | boolean => (
    typeof item === 'string' ||
    typeof item === 'boolean' ||
    (typeof item === 'number' && Number.isFinite(item))
  ));
  if (normalized.length === 0) return undefined;
  return { key, value: normalized.length === 1 ? normalized[0]! : normalized };
}

function normalizeStoryControlConditions(value: unknown): WorkbenchStoryControl['whenAll'] {
  if (!Array.isArray(value)) return undefined;
  const conditions = value
    .map(normalizeStoryControlCondition)
    .filter((condition): condition is NonNullable<WorkbenchStoryControl['when']> => Boolean(condition));
  return conditions.length > 0 ? conditions : undefined;
}

function normalizeStoryVariants(value: unknown): WorkbenchStoryMetadata['variants'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate, index) => {
    if (!isRecord(candidate)) return [];
    const name = getTrimmedString(candidate.name);
    if (!name) return [];
    return [{
      args: normalizeStoryArgs(candidate.args),
      id: getTrimmedString(candidate.id) ?? `variant-${index + 1}`,
      name,
    }];
  });
}

function findStoryMetadataForComponent({
  componentName,
  displayName,
  sourceFile,
  stories,
}: {
  componentName: string;
  displayName: string;
  sourceFile: string;
  stories: Array<{ path: string; stories: WorkbenchStoryMetadata[] }>;
}): { path: string; story: WorkbenchStoryMetadata } | null {
  const normalizedSourceFile = normalizeStorySourcePath(sourceFile);
  const allStories = stories.flatMap((entry) => entry.stories.map((story) => ({ path: entry.path, story })));
  return allStories.find(({ story }) => (
    normalizeStorySourcePath(story.sourceFile) === normalizedSourceFile ||
    story.componentName === componentName ||
    story.componentName === displayName ||
    story.name === componentName ||
    story.name === displayName ||
    story.componentId === getWorkbenchImportedComponentRegistryId(sourceFile, componentName)
  )) ?? null;
}

function normalizeStorySourcePath(value: string | undefined): string {
  return value ? resolveImportedLibraryProjectPath(value).replace(/\\/g, '/').toLowerCase() : '';
}

function resolveStoryMetadataPaths(story: WorkbenchStoryMetadata, storyPath: string): WorkbenchStoryMetadata {
  return {
    ...story,
    previewSourceFile: story.previewSourceFile
      ? resolveStoryRelativeProjectPath(story.previewSourceFile, storyPath)
      : undefined,
    sourceFile: story.sourceFile
      ? resolveStoryRelativeProjectPath(story.sourceFile, storyPath)
      : undefined,
  };
}

function resolveStoryRelativeProjectPath(referencePath: string, storyPath: string): string {
  const normalizedReference = referencePath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  if (normalizedReference.startsWith('src/') || /^[a-z][a-z0-9-]*-preset\//i.test(normalizedReference)) return normalizedReference;
  const storyDirectory = storyPath.split('/').slice(0, -1).join('/');
  const joined = storyDirectory ? `${storyDirectory}/${normalizedReference}` : normalizedReference;
  const segments: string[] = [];
  for (const segment of joined.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

function parseTokenRegistryImport(contents: string, projectPath: string): TokenRegistry | null {
  if (!projectPath.toLowerCase().endsWith('.json')) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return null;
  }
  if (!isTokenRegistryLike(parsed)) return null;
  return normalizeImportedRegistry(parsed as TokenRegistry);
}

function isTokenRegistryLike(value: unknown): value is TokenRegistry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TokenRegistry>;
  return Array.isArray(candidate.collections) &&
    candidate.collections.every((collection) =>
      collection &&
      typeof collection === 'object' &&
      typeof collection.id === 'string' &&
      typeof collection.name === 'string' &&
      Array.isArray(collection.modes) &&
      Array.isArray(collection.groups) &&
      Array.isArray(collection.tokens),
    );
}

function shouldSkipPartialImportedCssTokenImport(registry: TokenRegistry, sourcePath: string): boolean {
  return shouldSkipImportedLibraryCssScan(sourcePath, (libraryId) => (
    registry.collections.some((collection) => {
      const source = collection.extensions?.source;
      const importKind = collection.extensions?.importKind;
      return typeof source === 'string' && source.toLowerCase() === libraryId && importKind !== 'library-css';
    })
  ));
}

function inferImportedLibraryMetadataFromFileSelection(
  files: WorkbenchComponentLibraryImportItem[],
): WorkbenchImportedLibraryMetadata | null {
  for (const file of files) {
    const relativePath = file.relativePath || `components/${file.name}`;
    const metadata = inferImportedLibraryFromComponentFolderRelativePath(relativePath);
    if (metadata) return metadata;
  }
  return null;
}

function getImportedComponentFallbackName(projectPath: string, fileName: string): string {
  const baseName = fileName.replace(/\.(tsx|jsx|ts|js|css|json)$/i, '');
  const pathParts = projectPath.split('/').filter(Boolean);
  const sourceName = baseName.toLowerCase() === 'index'
    ? pathParts[pathParts.length - 2] ?? baseName
    : baseName;
  return toPascalCaseIdentifier(sourceName) || 'ImportedComponent';
}

function sanitizeImportedComponentId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'component';
}

function toPascalCaseIdentifier(value: string): string {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9_$]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
  const candidate = words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join('');
  return /^[A-Za-z_$][\w$]*$/.test(candidate) ? candidate : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
