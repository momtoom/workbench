import type {
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
} from './workbenchProject';
import { WORKBENCH_PAGES_ROOT } from './workbenchPageFolders';

export type WorkbenchComponentLibraryCandidate = {
  componentSetId?: string;
  componentName: string;
  displayName: string;
  extensions?: Record<string, unknown>;
  sourceFile: string;
};

export type WorkbenchComponentLibraryReconcileResult = {
  addedCount: number;
  nextRegistry: WorkbenchComponentRegistry;
  registeredComponents: WorkbenchComponentRegistry['components'];
  unchangedCount: number;
  updatedCount: number;
};

export type WorkbenchPageRegistryReconcileResult = {
  nextRegistry: WorkbenchPageRegistry;
  prunedPageNames: string[];
  registeredPages: WorkbenchPageRegistry['pages'];
  relinkedPages: Array<{
    from: string;
    id: string;
    name: string;
    to: string;
  }>;
};

export type WorkbenchRegistryRenameResult<TRegistry> =
  | {
      ok: true;
      nextRegistry: TRegistry;
      nextName: string;
      previousName: string;
    }
  | {
      ok: false;
      message: string;
    };

export function reconcileWorkbenchComponentLibrary(
  registry: WorkbenchComponentRegistry,
  candidates: WorkbenchComponentLibraryCandidate[],
): WorkbenchComponentLibraryReconcileResult {
  const rawRegisteredComponents = dedupeWorkbenchRegisteredComponents(
    candidates.map((candidate) => ({
      id: getWorkbenchImportedComponentRegistryId(candidate.sourceFile, candidate.componentName),
      name: candidate.displayName,
      sourceFile: candidate.sourceFile,
      componentSetId: candidate.componentSetId ?? 'component-set-imported',
      variants: [],
      extensions: {
        source: 'imported',
        importedFrom: candidate.sourceFile,
        importName: candidate.componentName,
        sourceExportName: candidate.componentName,
        sourceTruth: 'project-local',
        currentSourceFile: candidate.sourceFile,
        syncStatus: 'detached',
        ...(candidate.extensions ?? {}),
      },
    })),
  );
  const registeredComponents = rawRegisteredComponents.map((registered) => {
    const existing = registry.components.find((candidate) =>
      areWorkbenchComponentRegistryEntriesSameImport(candidate, registered),
    );
    if (!existing) return registered;
    // A declared childrenSlotKind is a pinned editing contract. Wrappers such
    // as AstryxHStack forward `{...props}` without a visible `children`
    // expression, so source inference cannot re-derive their block slot;
    // reconciliation keeps the declared kind and inference only fills entries
    // that never declared one.
    const declaredSlotKind = existing.extensions?.childrenSlotKind;
    const merged = typeof declaredSlotKind === 'string' && declaredSlotKind.length > 0
      ? { ...registered, extensions: { ...registered.extensions, childrenSlotKind: declaredSlotKind } }
      : registered;
    return existing.id !== merged.id ? { ...merged, id: existing.id } : merged;
  });
  const registeredSourceFiles = new Set(registeredComponents.map((component) => component.sourceFile));
  const usedRegisteredIds = new Set<string>();
  const nextComponents = registry.components.flatMap((existing) => {
    const replacement = registeredComponents.find((registered) =>
      areWorkbenchComponentRegistryEntriesSameImport(existing, registered),
    );
    if (replacement) {
      if (usedRegisteredIds.has(replacement.id)) return [];
      usedRegisteredIds.add(replacement.id);
      return [replacement];
    }
    return existing.extensions?.source === 'imported' && registeredSourceFiles.has(existing.sourceFile)
      ? []
      : [existing];
  });
  const appendedComponents = registeredComponents.filter((registered) => !usedRegisteredIds.has(registered.id));
  const nextRegistry: WorkbenchComponentRegistry = {
    ...registry,
    schemaVersion: registry.schemaVersion ?? '0.1',
    components: [
      ...nextComponents,
      ...appendedComponents,
    ],
    extensions: registry.extensions ?? {},
  };

  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  for (const registered of registeredComponents) {
    const existing = registry.components.find((candidate) =>
      areWorkbenchComponentRegistryEntriesSameImport(candidate, registered),
    );
    if (!existing) {
      addedCount += 1;
    } else if (JSON.stringify(existing) === JSON.stringify(registered)) {
      unchangedCount += 1;
    } else {
      updatedCount += 1;
    }
  }

  return {
    addedCount,
    nextRegistry,
    registeredComponents,
    unchangedCount,
    updatedCount,
  };
}

export function reconcileWorkbenchPagesWithSourceFiles(
  registry: WorkbenchPageRegistry,
  sourceFiles: string[],
): WorkbenchPageRegistryReconcileResult {
  const registryPages = registry.pages ?? [];
  const diskSourceFiles = dedupeWorkbenchPageSourceFiles(sourceFiles);
  const diskSourceFileSet = new Set(diskSourceFiles);
  const diskSourceFilesByBasename = groupWorkbenchPageSourceFilesByBasename(diskSourceFiles);
  const claimedSourceFiles = new Set<string>();
  const seenPageIds = new Set<string>();
  const prunedPageNames: string[] = [];
  const registeredPages: WorkbenchPageRegistry['pages'] = [];
  const relinkedPages: WorkbenchPageRegistryReconcileResult['relinkedPages'] = [];
  const retainedPages: WorkbenchPageRegistry['pages'] = [];

  for (const page of registryPages) {
    if (!page.id || seenPageIds.has(page.id)) {
      prunedPageNames.push(page.name || page.sourceFile || 'Untitled page');
      continue;
    }
    seenPageIds.add(page.id);

    const sourceFile = normalizeWorkbenchPageSourceFile(page.sourceFile);
    let nextSourceFile: string | null = null;

    if (sourceFile && diskSourceFileSet.has(sourceFile) && !claimedSourceFiles.has(sourceFile)) {
      nextSourceFile = sourceFile;
    } else {
      const basename = getWorkbenchPageSourceBasename(sourceFile);
      const candidates = basename
        ? (diskSourceFilesByBasename.get(basename) ?? []).filter((candidate) => !claimedSourceFiles.has(candidate))
        : [];
      if (candidates.length === 1) {
        nextSourceFile = candidates[0];
        relinkedPages.push({
          from: sourceFile,
          id: page.id,
          name: page.name,
          to: nextSourceFile,
        });
      }
    }

    if (!nextSourceFile) {
      prunedPageNames.push(page.name || sourceFile || page.id);
      continue;
    }

    claimedSourceFiles.add(nextSourceFile);
    retainedPages.push(
      nextSourceFile === page.sourceFile
        ? page
        : { ...page, sourceFile: nextSourceFile },
    );
  }

  const existingPageIds = new Set(retainedPages.map((page) => page.id));
  const existingPageRoutes = new Set(retainedPages.map((page) => page.route).filter(Boolean));
  for (const sourceFile of diskSourceFiles) {
    if (claimedSourceFiles.has(sourceFile)) continue;
    const registeredPage = createWorkbenchPageRegistryEntryFromSourceFile(
      sourceFile,
      existingPageIds,
      existingPageRoutes,
    );
    registeredPages.push(registeredPage);
    claimedSourceFiles.add(sourceFile);
    existingPageIds.add(registeredPage.id);
    existingPageRoutes.add(registeredPage.route);
  }

  if (
    retainedPages.length === registryPages.length &&
    registeredPages.length === 0 &&
    relinkedPages.length === 0 &&
    prunedPageNames.length === 0
  ) {
    return { nextRegistry: registry, prunedPageNames: [], registeredPages: [], relinkedPages: [] };
  }

  return {
    nextRegistry: {
      ...registry,
      schemaVersion: registry.schemaVersion ?? '0.1',
      pages: [
        ...retainedPages,
        ...registeredPages,
      ],
      extensions: registry.extensions ?? {},
    },
    prunedPageNames,
    registeredPages,
    relinkedPages,
  };
}

function dedupeWorkbenchPageSourceFiles(sourceFiles: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const sourceFile of sourceFiles) {
    const normalized = normalizeWorkbenchPageSourceFile(sourceFile);
    if (!isWorkbenchPageSourceFile(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function groupWorkbenchPageSourceFilesByBasename(sourceFiles: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const sourceFile of sourceFiles) {
    const basename = getWorkbenchPageSourceBasename(sourceFile);
    if (!basename) continue;
    result.set(basename, [...(result.get(basename) ?? []), sourceFile]);
  }
  return result;
}

function normalizeWorkbenchPageSourceFile(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/^[/\\]+/, '').replace(/\\/g, '/').replace(/\/+/g, '/');
}

function isWorkbenchPageSourceFile(sourceFile: string): boolean {
  return sourceFile.startsWith(`${WORKBENCH_PAGES_ROOT}/`) && /\.(?:tsx|jsx|ts|js|mts|cts|mjs|cjs|vue)$/i.test(sourceFile);
}

function getWorkbenchPageSourceBasename(sourceFile: string): string {
  const slashIndex = sourceFile.lastIndexOf('/');
  return slashIndex < 0 ? sourceFile : sourceFile.slice(slashIndex + 1);
}

function createWorkbenchPageRegistryEntryFromSourceFile(
  sourceFile: string,
  existingPageIds: Set<string>,
  existingPageRoutes: Set<string>,
): WorkbenchPageRegistry['pages'][number] {
  const normalizedSourceFile = normalizeWorkbenchPageSourceFile(sourceFile);
  const name = deriveWorkbenchPageNameFromSourceFile(normalizedSourceFile);
  const route = deriveWorkbenchPageRoute(
    name,
    deriveWorkbenchPageFallbackRouteFromSourceFile(normalizedSourceFile),
    existingPageRoutes,
  );

  return {
    id: deriveUniqueWorkbenchPageRegistryId(name, normalizedSourceFile, existingPageIds),
    name,
    route,
    sourceFile: normalizedSourceFile,
    rootNodeId: getWorkbenchPageRootNodeId(normalizedSourceFile),
    status: 'draft',
    extensions: {},
  };
}

function deriveWorkbenchPageNameFromSourceFile(sourceFile: string): string {
  const filename = getWorkbenchPageSourceBasename(sourceFile).replace(/\.[^.]+$/, '');
  const readableName = filename
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  return normalizeWorkbenchEntityName(readableName) || 'Untitled page';
}

function deriveWorkbenchPageFallbackRouteFromSourceFile(sourceFile: string): string {
  const filename = getWorkbenchPageSourceBasename(sourceFile).replace(/\.[^.]+$/, '');
  const slug = getWorkbenchEntitySlug(filename);
  return `/${slug || 'page'}`;
}

function deriveUniqueWorkbenchPageRegistryId(
  name: string,
  sourceFile: string,
  existingPageIds: Set<string>,
): string {
  const filename = getWorkbenchPageSourceBasename(sourceFile).replace(/\.[^.]+$/, '');
  const slug = getWorkbenchEntitySlug(name) || getWorkbenchEntitySlug(filename) || 'page';
  const baseId = `page-${slug}`;
  let candidate = baseId;
  for (let index = 2; existingPageIds.has(candidate); index += 1) {
    candidate = `${baseId}-${index}`;
  }
  return candidate;
}

function getWorkbenchPageRootNodeId(sourceFile: string): string {
  return `source:${sanitizeWorkbenchPageRootNodeIdSource(sourceFile)}:root`;
}

function sanitizeWorkbenchPageRootNodeIdSource(sourceFile: string): string {
  return sourceFile.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'source';
}

type WorkbenchRegisteredComponent = WorkbenchComponentRegistry['components'][number];

function dedupeWorkbenchRegisteredComponents(
  components: WorkbenchRegisteredComponent[],
): WorkbenchRegisteredComponent[] {
  const componentByKey = new Map<string, WorkbenchRegisteredComponent>();
  const orderedKeys: string[] = [];
  for (const component of components) {
    const key = getWorkbenchImportedComponentDedupeKey(component) ?? `id:${component.id}`;
    if (!componentByKey.has(key)) orderedKeys.push(key);
    componentByKey.set(key, component);
  }
  return orderedKeys.map((key) => componentByKey.get(key)!);
}

function areWorkbenchComponentRegistryEntriesSameImport(
  left: WorkbenchRegisteredComponent,
  right: WorkbenchRegisteredComponent,
): boolean {
  if (left.id === right.id) return true;
  if (left.sourceFile === right.sourceFile && left.name === right.name) return true;

  const leftImportName = getWorkbenchImportedComponentImportName(left);
  const rightImportName = getWorkbenchImportedComponentImportName(right);
  if (
    leftImportName &&
    rightImportName &&
    leftImportName === rightImportName &&
    normalizeWorkbenchComponentPath(left.sourceFile) === normalizeWorkbenchComponentPath(right.sourceFile)
  ) {
    return true;
  }

  const leftKey = getWorkbenchImportedComponentDedupeKey(left);
  const rightKey = getWorkbenchImportedComponentDedupeKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

function getWorkbenchImportedComponentDedupeKey(component: WorkbenchRegisteredComponent): string | null {
  const importName = getWorkbenchImportedComponentImportName(component);
  if (!importName) return null;

  const libraryId = getWorkbenchImportedComponentLibraryId(component);
  if (libraryId) return `library:${libraryId}:${importName}`;

  const sourcePath = getWorkbenchImportedComponentOriginPath(component);
  if (sourcePath) return `source:${normalizeWorkbenchComponentPath(sourcePath)}:${importName}`;

  return null;
}

function getWorkbenchImportedComponentImportName(component: WorkbenchRegisteredComponent): string | null {
  return getWorkbenchComponentStringExtension(component, 'importName') ??
    getWorkbenchComponentStringExtension(component, 'sourceExportName') ??
    null;
}

function getWorkbenchImportedComponentLibraryId(component: WorkbenchRegisteredComponent): string | null {
  const explicit = normalizeWorkbenchLibraryId(getWorkbenchComponentStringExtension(component, 'libraryId'));
  if (explicit) return explicit;

  const paths = [
    getWorkbenchComponentStringExtension(component, 'librarySourcePath'),
    getWorkbenchComponentStringExtension(component, 'librarySnapshotRoot'),
    getWorkbenchComponentStringExtension(component, 'originSourceFile'),
    getWorkbenchComponentStringExtension(component, 'currentSourceFile'),
    getWorkbenchComponentStringExtension(component, 'importedFrom'),
    component.sourceFile,
  ];
  for (const path of paths) {
    const inferred = inferWorkbenchLibraryIdFromComponentPath(path);
    if (inferred) return inferred;
  }
  return null;
}

function getWorkbenchImportedComponentOriginPath(component: WorkbenchRegisteredComponent): string | null {
  return getWorkbenchComponentStringExtension(component, 'originSourceFile') ??
    getWorkbenchComponentStringExtension(component, 'importedFrom') ??
    getWorkbenchComponentStringExtension(component, 'currentSourceFile') ??
    component.sourceFile ??
    null;
}

function getWorkbenchComponentStringExtension(
  component: WorkbenchRegisteredComponent,
  key: string,
): string | null {
  const value = component.extensions?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function inferWorkbenchLibraryIdFromComponentPath(path: string | null | undefined): string | null {
  const normalized = normalizeWorkbenchComponentPath(path);
  if (!normalized) return null;

  const presetMatch = /(?:^|\/)([a-z][a-z0-9-]*)-preset\/components(?:\/|$)/i.exec(normalized);
  if (presetMatch?.[1]) return presetMatch[1].toLowerCase();

  const librarySnapshotMatch = /(?:^|\/)src\/libraries\/([a-z][a-z0-9-]*)(?:\/|$)/i.exec(normalized);
  if (librarySnapshotMatch?.[1]) return librarySnapshotMatch[1].toLowerCase();

  const legacyProjectLibraryMatch = /^src\/([a-z][a-z0-9-]*)\/components(?:\/|$)/i.exec(normalized);
  if (legacyProjectLibraryMatch?.[1]) return legacyProjectLibraryMatch[1].toLowerCase();

  const legacyOriginMatch = /^([a-z][a-z0-9-]*)\/components(?:\/|$)/i.exec(normalized);
  if (legacyOriginMatch?.[1]) return legacyOriginMatch[1].toLowerCase();

  return null;
}

function normalizeWorkbenchLibraryId(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return /^[a-z][a-z0-9-]*$/.test(normalized) ? normalized : null;
}

function normalizeWorkbenchComponentPath(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^[/\\]+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .toLowerCase();
}

export function getWorkbenchImportedComponentRegistryId(sourceFile: string, componentName: string): string {
  return `imported-${sanitizeWorkbenchImportedComponentId(`${sourceFile}-${componentName}`)}`;
}

export type WorkbenchComponentLibraryPruneResult = {
  nextRegistry: WorkbenchComponentRegistry;
  prunedComponentNames: string[];
  prunedLibraryIds: string[];
};

/**
 * Drop registry entries whose backing files have disappeared from disk (e.g.
 * the user deleted them via Finder). Also drop library snapshot entries when
 * no component still references their snapshotRoot.
 *
 * The probe function returns true when the path exists. Callers can implement
 * it however they like (fs stat in node, HTTP HEAD-style check via the dev
 * server, etc.) — this module stays platform-agnostic.
 */
export async function pruneOrphanedComponentsFromDisk(
  registry: WorkbenchComponentRegistry,
  pathExists: (path: string) => Promise<boolean>,
): Promise<WorkbenchComponentLibraryPruneResult> {
  const components = registry.components ?? [];
  if (components.length === 0) {
    return { nextRegistry: registry, prunedComponentNames: [], prunedLibraryIds: [] };
  }

  // Probe every unique sourceFile in parallel so total time stays close to a
  // single round-trip even with 50+ components.
  const uniqueSourceFiles = [...new Set(components.map((c) => c.sourceFile).filter((p): p is string => typeof p === 'string' && p.length > 0))];
  const probeResults = await Promise.all(uniqueSourceFiles.map(async (path) => [path, await pathExists(path)] as const));
  const existenceBySourceFile = new Map(probeResults);

  const prunedComponentNames: string[] = [];
  const retainedComponents = components.filter((component) => {
    const sourceFile = component.sourceFile;
    if (!sourceFile) return true;
    const exists = existenceBySourceFile.get(sourceFile);
    if (exists === false) {
      prunedComponentNames.push(component.name ?? sourceFile);
      return false;
    }
    return true;
  });

  // Library entries are kept only when at least one retained component still
  // points into that library's snapshotRoot.
  const retainedSourceFiles = retainedComponents.map((c) => c.sourceFile).filter((p): p is string => typeof p === 'string');
  const libraries = registry.extensions?.libraries ?? {};
  const prunedLibraryIds: string[] = [];
  const retainedLibraries: typeof libraries = {};
  for (const [id, entry] of Object.entries(libraries)) {
    const root = entry.snapshotRoot?.replace(/\/+$/, '');
    if (!root) {
      retainedLibraries[id] = entry;
      continue;
    }
    const stillReferenced = retainedSourceFiles.some((p) => p.startsWith(`${root}/`));
    if (stillReferenced) {
      retainedLibraries[id] = entry;
    } else {
      prunedLibraryIds.push(id);
    }
  }

  if (prunedComponentNames.length === 0 && prunedLibraryIds.length === 0) {
    return { nextRegistry: registry, prunedComponentNames: [], prunedLibraryIds: [] };
  }

  const nextExtensions = { ...(registry.extensions ?? {}) };
  if (prunedLibraryIds.length > 0) nextExtensions.libraries = retainedLibraries;

  return {
    nextRegistry: {
      ...registry,
      components: retainedComponents,
      extensions: nextExtensions,
    },
    prunedComponentNames,
    prunedLibraryIds,
  };
}

export function getWorkbenchImportedComponentDisplayName(componentName: string, fallbackName: string): string {
  const normalizedFallback = fallbackName.trim();
  if (!normalizedFallback) return componentName;
  // Strip any PascalCase library prefix when the component name ends with the
  // fallback (filename-derived) base. e.g. AcmeButton → Button, LocalButton →
  // Button. Generic — no preset-specific list to maintain.
  if (
    componentName !== normalizedFallback &&
    componentName.endsWith(normalizedFallback) &&
    /^[A-Z][a-zA-Z0-9]+$/.test(componentName)
  ) {
    return normalizedFallback;
  }
  const readableSuffix = getReadableComponentSuffix(componentName, normalizedFallback);
  if (readableSuffix) return readableSuffix;
  return componentName;
}

function getReadableComponentSuffix(componentName: string, fallbackName: string): string | null {
  const candidates = [
    fallbackName,
    fallbackName.endsWith('s') ? fallbackName.slice(0, -1) : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (componentName === candidate || componentName.startsWith(candidate)) return componentName;
    const index = componentName.indexOf(candidate);
    if (index > 0) return componentName.slice(index);
  }

  return null;
}

export function renameWorkbenchPage(
  registry: WorkbenchPageRegistry,
  pageId: string,
  name: string,
): WorkbenchRegistryRenameResult<WorkbenchPageRegistry> {
  const nextName = normalizeWorkbenchEntityName(name);
  if (!nextName) return { ok: false, message: 'Page name is required.' };

  const page = registry.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, message: 'Page could not be found.' };
  if (page.name === nextName) {
    return {
      ok: true,
      nextRegistry: registry,
      nextName,
      previousName: page.name,
    };
  }

  // The route doubles as the source-tree row meta. Keep it in sync with the
  // name so a renamed page no longer shows its auto-generated "/untitled-page-N"
  // slug. The route is display-only (not used for navigation or as a key).
  const nextRoute = deriveWorkbenchPageRoute(
    nextName,
    page.route,
    new Set(registry.pages.filter((candidate) => candidate.id !== pageId).map((candidate) => candidate.route)),
  );

  return {
    ok: true,
    nextRegistry: {
      ...registry,
      pages: registry.pages.map((candidate) => (
        candidate.id === pageId ? { ...candidate, name: nextName, route: nextRoute } : candidate
      )),
    },
    nextName,
    previousName: page.name,
  };
}

// Builds a unique kebab route slug from a page name, keeping Unicode letters so
// Korean names still produce a readable route. Falls back to the existing route
// when the name yields no usable slug (pure punctuation).
function deriveWorkbenchPageRoute(name: string, currentRoute: string, existingRoutes: Set<string>): string {
  const slug = getWorkbenchEntitySlug(name);
  if (!slug) return currentRoute;

  let candidate = `/${slug}`;
  for (let index = 2; existingRoutes.has(candidate); index += 1) {
    candidate = `/${slug}-${index}`;
  }
  return candidate;
}

function getWorkbenchEntitySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function renameWorkbenchComponent(
  registry: WorkbenchComponentRegistry,
  componentId: string,
  name: string,
): WorkbenchRegistryRenameResult<WorkbenchComponentRegistry> {
  const nextName = normalizeWorkbenchEntityName(name);
  if (!nextName) return { ok: false, message: 'Component name is required.' };

  const component = registry.components.find((candidate) => candidate.id === componentId);
  if (!component) return { ok: false, message: 'Component could not be found.' };
  if (component.name === nextName) {
    return {
      ok: true,
      nextRegistry: registry,
      nextName,
      previousName: component.name,
    };
  }

  return {
    ok: true,
    nextRegistry: {
      ...registry,
      components: registry.components.map((candidate) => (
        candidate.id === componentId ? { ...candidate, name: nextName } : candidate
      )),
    },
    nextName,
    previousName: component.name,
  };
}

function normalizeWorkbenchEntityName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function sanitizeWorkbenchImportedComponentId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'component';
}
