import { getHistoryLaneId, type EditOwner, type HistoryLaneId } from '@domain/history/historyController';
import { TOKEN_TYPES } from '@domain/design-system/tokens/metadata';
import type { TokenType } from '@domain/design-system/tokens/types';
import {
  createEmptyWorkbenchHistoryFile,
  normalizeWorkbenchHistoryFile,
  type PersistedHistoryLane,
  type WorkbenchHistoryFile,
} from '@domain/history/historyPersistence';
import type {
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
  WorkbenchSelectionExtensions,
  WorkbenchSelectionState,
  WorkbenchSelectionTarget,
  WorkbenchTokenEditorSessionState,
  WorkbenchTokenRegistry,
} from './workbenchProject';
import { sanitizePersistedInspectorTokenPickerFilters } from './workbenchInspectorSession';
import {
  sanitizePersistedDesignPreviewAppearance,
  sanitizePersistedDesignPreviewViewport,
  sanitizePersistedPreviewTokenModes,
} from './workbenchPreviewSession';
import { sanitizeWorkbenchStoryArgs } from './workbenchStoryArgs';

const ACTIVE_DESIGN_LAYER_ID_EXTENSION = 'activeDesignLayerId';
const ACTIVE_DESIGN_STORY_COMPONENT_ID_EXTENSION = 'activeDesignStoryComponentId';
const ACTIVE_DESIGN_STORY_ARGS_EXTENSION = 'activeDesignStoryArgs';
const ACTIVE_DESIGN_SOURCE_FILE_EXTENSION = 'activeDesignSourceFile';
const ACTIVE_DESIGN_TARGET_ID_EXTENSION = 'activeDesignTargetId';
const ACTIVE_DESIGN_TARGET_KIND_EXTENSION = 'activeDesignTargetKind';
const ACTIVE_STORYBOOK_TARGET_ID_EXTENSION = 'activeStorybookTargetId';
const ACTIVE_STORYBOOK_TARGET_KIND_EXTENSION = 'activeStorybookTargetKind';
const COLLAPSED_DESIGN_LAYER_IDS_EXTENSION = 'collapsedDesignLayerIds';
const DESIGN_PREVIEW_DRILL_PATH_EXTENSION = 'designPreviewDrillPath';
const OPEN_DESIGN_TARGET_KEYS_EXTENSION = 'openDesignTargetKeys';
const SELECTED_DESIGN_LAYER_IDS_EXTENSION = 'selectedDesignLayerIds';
const DEPRECATED_WORKSPACE_SESSION_EXTENSION_KEYS = [
  'activeQaTargetUrl',
  'designPreviewBreakpointSizes',
  'designResponsiveBreakpoints',
  'designEditResponsiveBreakpoint',
  'designPageStateModes',
  'designEditPageStateMode',
] as const;

type SessionRegistryContext = {
  components: WorkbenchComponentRegistry;
  pages: WorkbenchPageRegistry;
  projectId: string;
  tokens: WorkbenchTokenRegistry;
  tokenPath: string;
  updatedAt?: string;
};

type DesignEntityTarget =
  | { kind: 'page'; id: string; sourceFile: string }
  | { kind: 'component'; id: string; sourceFile: string };

export function createDefaultWorkbenchSelectionState(
  context: Pick<SessionRegistryContext, 'components' | 'pages'> & { updatedAt?: string } = {
    components: { schemaVersion: '0.1', components: [], extensions: {} },
    pages: { schemaVersion: '0.1', pages: [], extensions: {} },
  },
): WorkbenchSelectionState {
  return {
    schemaVersion: '0.1',
    activeTarget: null,
    selectedTargets: [],
    updatedAt: context.updatedAt ?? new Date().toISOString(),
    extensions: {
      activeWorkbenchSurface: 'design',
      ...createDesignTargetExtensions(null),
      activeDesignLayerId: null,
      selectedDesignLayerIds: [],
      openDesignTargetKeys: [],
    },
  };
}

export function sanitizeWorkbenchSelectionState(
  value: unknown,
  context: SessionRegistryContext,
): WorkbenchSelectionState {
  const updatedAt = getStringField(value, 'updatedAt') ?? context.updatedAt ?? new Date().toISOString();
  const fallback = createDefaultWorkbenchSelectionState({ ...context, updatedAt });
  if (!isRecord(value)) return fallback;

  const extensions = isRecord(value.extensions) ? { ...value.extensions } : {};
  const normalizedSelectedTargets = Array.isArray(value.selectedTargets)
    ? dedupeSelectionTargets(value.selectedTargets.flatMap((target) => {
      const normalized = normalizeSelectionTarget(target, context);
      return normalized ? [normalized] : [];
    }))
    : [];

  const normalizedActiveTarget = normalizeSelectionTarget(value.activeTarget, context);
  const activeTargetWasExplicitlyEmpty = Object.prototype.hasOwnProperty.call(value, 'activeTarget')
    && value.activeTarget === null;
  const activeTarget = normalizedActiveTarget
    ?? (activeTargetWasExplicitlyEmpty
      ? null
      : normalizedSelectedTargets[0]
        ?? getDesignTargetFromExtensions(extensions, context)
        ?? fallback.activeTarget);

  const selectedTargets = activeTarget
    ? ensureSelectionTarget(dedupeSelectionTargets(normalizedSelectedTargets), activeTarget)
    : normalizedSelectedTargets;

  const activeDesignTarget = getDesignEntityFromSelectionTarget(activeTarget, context)
    ?? (activeTargetWasExplicitlyEmpty
      ? null
      : getDesignEntityFromSelectionTarget(selectedTargets[0] ?? null, context)
        ?? getDesignEntityFromExtensions(extensions, context));

  const previousDesignTarget = getDesignEntityFromExtensions(extensions, context);
  const designTargetRepaired = !areDesignTargetsEqual(previousDesignTarget, activeDesignTarget);
  const selectionTargetRepaired = !areSelectionTargetsEquivalent(
    normalizedActiveTarget,
    activeTarget,
  );
  const shouldResetNodeState = designTargetRepaired || selectionTargetRepaired;

  return {
    schemaVersion: '0.1',
    activeTarget,
    selectedTargets,
    updatedAt,
    extensions: sanitizeSelectionExtensions({
      activeDesignTarget,
      context,
      extensions,
      resetNodeState: shouldResetNodeState,
    }),
  };
}

export function sanitizeWorkbenchHistoryFile(
  value: unknown,
  context: Pick<SessionRegistryContext, 'components' | 'pages' | 'projectId' | 'tokenPath'> & { updatedAt?: string },
): WorkbenchHistoryFile {
  const history = normalizeWorkbenchHistoryFile(value);
  const validLaneIds = getValidHistoryLaneIds(context);
  let droppedStacks = false;
  const lanes = history.lanes
    .filter((lane) => (
      validLaneIds.has(lane.laneId) || lane.owner.type === 'css-class'
    ) && isHistoryLaneOwnerValid(lane, context))
    .map((lane) => {
      const next = dropSessionOnlyStacks(lane);
      if (next !== lane) droppedStacks = true;
      return next;
    });
  const keptLaneIds = new Set(lanes.map((lane) => lane.laneId));
  const timeline = history.timeline.filter((entry) => keptLaneIds.has(entry.laneId));

  if (
    !droppedStacks
    && lanes.length === history.lanes.length
    && timeline.length === history.timeline.length
  ) return history;

  return {
    ...history,
    updatedAt: context.updatedAt ?? new Date().toISOString(),
    lanes,
    timeline,
  };
}

export function createRecoverableWorkbenchHistoryFile(updatedAt = new Date().toISOString()): WorkbenchHistoryFile {
  return createEmptyWorkbenchHistoryFile(updatedAt);
}

// Source and token lanes stopped writing their stacks: one controller owns each
// lane for the session, and nothing hydrates them. Files written before that
// still carry them, and a write only rewrites the lane it touched — so drop
// them on read instead, and the next write emits a lean file for every lane at
// once. The lane's `value` and revisions stay: they are unsaved-work recovery,
// not undo.
//
// `workspace` lanes are excluded on purpose: spec notes still rebuild their memo
// within a session and rehydrate from the in-memory file, so that lane's stacks
// are still its transport.
const SESSION_ONLY_STACK_OWNER_TYPES = new Set(['page', 'component', 'tokens']);

function dropSessionOnlyStacks(lane: PersistedHistoryLane): PersistedHistoryLane {
  if (!SESSION_ONLY_STACK_OWNER_TYPES.has(lane.owner.type)) return lane;
  if (lane.undoStack === undefined && lane.redoStack === undefined) return lane;

  const { undoStack, redoStack, ...rest } = lane;
  void undoStack;
  void redoStack;
  return rest;
}

function sanitizeSelectionExtensions({
  activeDesignTarget,
  context,
  extensions,
  resetNodeState,
}: {
  activeDesignTarget: DesignEntityTarget | null;
  context: SessionRegistryContext;
  extensions: Record<string, unknown>;
  resetNodeState: boolean;
}): WorkbenchSelectionExtensions {
  const nextExtensions: WorkbenchSelectionExtensions = { ...extensions };
  sanitizeWorkspaceSessionExtensions(nextExtensions, extensions);
  Object.assign(nextExtensions, createDesignTargetExtensions(activeDesignTarget));

  nextExtensions[OPEN_DESIGN_TARGET_KEYS_EXTENSION] = getSanitizedOpenDesignTargetKeys(
    extensions[OPEN_DESIGN_TARGET_KEYS_EXTENSION],
    activeDesignTarget,
    context,
  );

  const storybookTarget = getValidStorybookTarget(extensions, context);
  nextExtensions[ACTIVE_STORYBOOK_TARGET_KIND_EXTENSION] = storybookTarget?.kind ?? null;
  nextExtensions[ACTIVE_STORYBOOK_TARGET_ID_EXTENSION] = storybookTarget?.id ?? null;

  sanitizeActiveDesignStorySession(nextExtensions, extensions, context);

  if (resetNodeState) {
    nextExtensions[ACTIVE_DESIGN_LAYER_ID_EXTENSION] = activeDesignTarget ? 'preview-frame' : null;
    nextExtensions[SELECTED_DESIGN_LAYER_IDS_EXTENSION] = [];
    nextExtensions[COLLAPSED_DESIGN_LAYER_IDS_EXTENSION] = [];
    nextExtensions[DESIGN_PREVIEW_DRILL_PATH_EXTENSION] = [];
  } else {
    sanitizeActiveDesignLayerId(nextExtensions, extensions);
    nextExtensions[SELECTED_DESIGN_LAYER_IDS_EXTENSION] = normalizeStringArray(extensions[SELECTED_DESIGN_LAYER_IDS_EXTENSION]);
    nextExtensions[COLLAPSED_DESIGN_LAYER_IDS_EXTENSION] = normalizeStringArray(extensions[COLLAPSED_DESIGN_LAYER_IDS_EXTENSION]);
    nextExtensions[DESIGN_PREVIEW_DRILL_PATH_EXTENSION] = normalizeStringArray(extensions[DESIGN_PREVIEW_DRILL_PATH_EXTENSION]);
  }

  return nextExtensions;
}

function sanitizeActiveDesignStorySession(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
  context: Pick<SessionRegistryContext, 'components'>,
): void {
  const componentId = getStringExtension(extensions, ACTIVE_DESIGN_STORY_COMPONENT_ID_EXTENSION);
  if (!componentId || !context.components.components.some((component) => component.id === componentId)) {
    nextExtensions.activeDesignStoryComponentId = null;
    nextExtensions.activeDesignStoryArgs = null;
    return;
  }

  nextExtensions.activeDesignStoryComponentId = componentId;
  if (!Object.prototype.hasOwnProperty.call(extensions, ACTIVE_DESIGN_STORY_ARGS_EXTENSION)) {
    delete nextExtensions.activeDesignStoryArgs;
    return;
  }
  const value = extensions[ACTIVE_DESIGN_STORY_ARGS_EXTENSION];
  nextExtensions.activeDesignStoryArgs = isRecord(value)
    ? sanitizeWorkbenchStoryArgs(value)
    : null;
}

function sanitizeActiveDesignLayerId(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
): void {
  if (!Object.prototype.hasOwnProperty.call(extensions, ACTIVE_DESIGN_LAYER_ID_EXTENSION)) {
    delete nextExtensions.activeDesignLayerId;
    return;
  }
  const value = extensions[ACTIVE_DESIGN_LAYER_ID_EXTENSION];
  nextExtensions.activeDesignLayerId = typeof value === 'string' && value.trim().length > 0
    ? value
    : null;
}

function sanitizeWorkspaceSessionExtensions(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
): void {
  DEPRECATED_WORKSPACE_SESSION_EXTENSION_KEYS.forEach((key) => {
    delete nextExtensions[key];
  });

  const activeSurface = extensions.activeWorkbenchSurface;
  if (isWorkbenchSurface(activeSurface)) {
    nextExtensions.activeWorkbenchSurface = activeSurface;
  } else {
    delete nextExtensions.activeWorkbenchSurface;
  }

  sanitizeOptionalStringExtension(nextExtensions, extensions, 'activeTokenCollectionId', true);
  sanitizeOptionalStringExtension(nextExtensions, extensions, 'activeTokenGroupId', true);
  sanitizeOptionalStringExtension(nextExtensions, extensions, 'tokenSelectionAnchorCollectionId', true);
  sanitizeOptionalStringExtension(nextExtensions, extensions, 'tokenSelectionAnchorId', true);

  sanitizeOptionalNumberExtension(nextExtensions, extensions, 'workbenchDesignSourceListHeight');
  sanitizeOptionalNumberExtension(nextExtensions, extensions, 'workbenchInspectorWidth');
  sanitizeOptionalNumberExtension(nextExtensions, extensions, 'workbenchSidebarWidth');
  sanitizeOptionalNumberExtension(nextExtensions, extensions, 'workbenchTokenCollectionListHeight');
  sanitizeOptionalBooleanExtension(nextExtensions, extensions, 'collapsedDesignLayerSection');
  sanitizeOptionalBooleanExtension(nextExtensions, extensions, 'collapsedDesignSourceSection');
  sanitizeOptionalStringArrayExtension(nextExtensions, extensions, 'collapsedDesignPageFolders');
  sanitizeOptionalStringArrayExtension(nextExtensions, extensions, 'collapsedDesignSourceGroups');

  const inspectorTokenPickerFilters = sanitizePersistedInspectorTokenPickerFilters(extensions.inspectorTokenPickerFilters);
  if (inspectorTokenPickerFilters) {
    nextExtensions.inspectorTokenPickerFilters = inspectorTokenPickerFilters;
  } else {
    delete nextExtensions.inspectorTokenPickerFilters;
  }

  const previewAppearance = sanitizePersistedDesignPreviewAppearance(extensions.designPreviewAppearance);
  if (previewAppearance) {
    nextExtensions.designPreviewAppearance = previewAppearance;
  } else {
    delete nextExtensions.designPreviewAppearance;
  }

  const previewViewport = sanitizePersistedDesignPreviewViewport(extensions.designPreviewViewport);
  if (previewViewport) {
    nextExtensions.designPreviewViewport = previewViewport;
  } else {
    delete nextExtensions.designPreviewViewport;
  }

  const previewTokenModes = sanitizePersistedPreviewTokenModes(extensions.previewTokenModes);
  if (previewTokenModes) {
    nextExtensions.previewTokenModes = previewTokenModes;
  } else {
    delete nextExtensions.previewTokenModes;
  }

  const tokenEditorSession = sanitizeTokenEditorSession(extensions.workbenchTokenEditorSession);
  if (tokenEditorSession) {
    nextExtensions.workbenchTokenEditorSession = tokenEditorSession;
  } else {
    delete nextExtensions.workbenchTokenEditorSession;
  }
}

function sanitizeTokenEditorSession(value: unknown): WorkbenchTokenEditorSessionState | undefined {
  if (!isRecord(value)) return undefined;
  return {
    ...value,
    query: typeof value.query === 'string' ? value.query : '',
    sidebarSearchQuery: typeof value.sidebarSearchQuery === 'string' ? value.sidebarSearchQuery : '',
    tableColumnWidthsByCollection: sanitizeTokenTableColumnWidthsByCollection(value.tableColumnWidthsByCollection),
    typeFilter: isTokenTypeFilter(value.typeFilter) ? value.typeFilter : 'all',
  };
}

function sanitizeTokenTableColumnWidthsByCollection(value: unknown): Record<string, Record<string, number>> {
  if (!isRecord(value)) return {};
  const next: Record<string, Record<string, number>> = {};
  for (const [collectionId, rawWidths] of Object.entries(value)) {
    if (!collectionId.trim() || !isRecord(rawWidths)) continue;
    const widths = Object.fromEntries(
      Object.entries(rawWidths).filter((entry): entry is [string, number] => (
        entry[0].trim().length > 0
        && typeof entry[1] === 'number'
        && Number.isFinite(entry[1])
        && entry[1] > 0
      )),
    );
    if (Object.keys(widths).length > 0) next[collectionId] = widths;
  }
  return next;
}

function isTokenTypeFilter(value: unknown): value is TokenType | 'all' {
  return value === 'all' || (
    typeof value === 'string'
    && TOKEN_TYPES.includes(value as TokenType)
  );
}

function sanitizeOptionalStringExtension(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
  key: 'activeTokenCollectionId' | 'activeTokenGroupId' | 'tokenSelectionAnchorCollectionId' | 'tokenSelectionAnchorId',
  allowNull: boolean,
): void {
  const value = extensions[key];
  if (typeof value === 'string') {
    nextExtensions[key] = value;
  } else if (allowNull && value === null) {
    nextExtensions[key] = null;
  } else {
    delete nextExtensions[key];
  }
}

function sanitizeOptionalNumberExtension(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
  key: 'workbenchDesignSourceListHeight' | 'workbenchInspectorWidth' | 'workbenchSidebarWidth' | 'workbenchTokenCollectionListHeight',
): void {
  const value = extensions[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    nextExtensions[key] = value;
  } else {
    delete nextExtensions[key];
  }
}

function sanitizeOptionalBooleanExtension(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
  key: 'collapsedDesignLayerSection' | 'collapsedDesignSourceSection',
): void {
  const value = extensions[key];
  if (typeof value === 'boolean') {
    nextExtensions[key] = value;
  } else {
    delete nextExtensions[key];
  }
}

function sanitizeOptionalStringArrayExtension(
  nextExtensions: WorkbenchSelectionExtensions,
  extensions: Record<string, unknown>,
  key: 'collapsedDesignPageFolders' | 'collapsedDesignSourceGroups',
): void {
  const value = extensions[key];
  if (Array.isArray(value)) {
    nextExtensions[key] = normalizeStringArray(value);
  } else {
    delete nextExtensions[key];
  }
}

function isWorkbenchSurface(value: unknown): value is NonNullable<WorkbenchSelectionExtensions['activeWorkbenchSurface']> {
  return value === 'tokens' || value === 'assets' || value === 'storybook' || value === 'design';
}

function normalizeSelectionTarget(
  value: unknown,
  context: SessionRegistryContext,
): WorkbenchSelectionTarget | null {
  if (!isRecord(value)) return null;
  const kind = value.kind;

  if (kind === 'project') {
    return { kind: 'project', extensions: normalizeTargetExtensions(value.extensions) };
  }

  if (kind === 'page') {
    const pageId = getTrimmedString(value.pageId);
    if (!pageId) return null;
    const page = context.pages.pages.find((candidate) => candidate.id === pageId);
    if (!page) return null;
    return { kind: 'page', pageId: page.id, sourceFile: page.sourceFile, extensions: normalizeTargetExtensions(value.extensions) };
  }

  if (kind === 'component') {
    const componentId = getTrimmedString(value.componentId);
    if (!componentId) return null;
    const component = context.components.components.find((candidate) => candidate.id === componentId);
    if (!component) return null;
    return { kind: 'component', componentId: component.id, sourceFile: component.sourceFile, extensions: normalizeTargetExtensions(value.extensions) };
  }

  if (kind === 'node') {
    const owner = getNodeOwnerTarget(value, context);
    if (!owner) return null;
    return {
      ...owner,
      kind: 'node',
      nodeId: getTrimmedString(value.nodeId) ?? undefined,
      extensions: normalizeTargetExtensions(value.extensions),
    };
  }

  if (kind === 'token') {
    const tokenId = getTrimmedString(value.tokenId);
    const collectionId = getStringExtension(normalizeTargetExtensions(value.extensions), 'collectionId');
    if (!tokenId || !collectionId || !hasTokenReference(context.tokens, collectionId, tokenId)) return null;
    return { kind: 'token', tokenId, extensions: { collectionId } };
  }

  return null;
}

function getNodeOwnerTarget(value: Record<string, unknown>, context: SessionRegistryContext): WorkbenchSelectionTarget | null {
  const pageId = getTrimmedString(value.pageId);
  if (pageId) {
    const page = context.pages.pages.find((candidate) => candidate.id === pageId);
    if (page) return { kind: 'page', pageId: page.id, sourceFile: page.sourceFile };
  }

  const componentId = getTrimmedString(value.componentId);
  if (componentId) {
    const component = context.components.components.find((candidate) => candidate.id === componentId);
    if (component) return { kind: 'component', componentId: component.id, sourceFile: component.sourceFile };
  }

  return null;
}

function getDesignTargetFromExtensions(
  extensions: Record<string, unknown>,
  context: SessionRegistryContext,
): WorkbenchSelectionTarget | null {
  const designEntity = getDesignEntityFromExtensions(extensions, context);
  return designEntity ? createSelectionTargetFromDesignEntity(designEntity) : null;
}

function getDesignEntityFromExtensions(
  extensions: Record<string, unknown>,
  context: Pick<SessionRegistryContext, 'components' | 'pages'>,
): DesignEntityTarget | null {
  const kind = getStringExtension(extensions, ACTIVE_DESIGN_TARGET_KIND_EXTENSION);
  const id = getStringExtension(extensions, ACTIVE_DESIGN_TARGET_ID_EXTENSION);

  if (kind === 'page' && id) {
    const page = context.pages.pages.find((candidate) => candidate.id === id);
    return page ? { kind: 'page', id: page.id, sourceFile: page.sourceFile } : null;
  }

  if (kind === 'component' && id) {
    const component = context.components.components.find((candidate) => candidate.id === id);
    return component ? { kind: 'component', id: component.id, sourceFile: component.sourceFile } : null;
  }

  return null;
}

function getDesignEntityFromSelectionTarget(
  target: WorkbenchSelectionTarget | null,
  context: Pick<SessionRegistryContext, 'components' | 'pages'>,
): DesignEntityTarget | null {
  if (target?.kind === 'page' && target.pageId) {
    const page = context.pages.pages.find((candidate) => candidate.id === target.pageId);
    return page ? { kind: 'page', id: page.id, sourceFile: page.sourceFile } : null;
  }

  if (target?.kind === 'component' && target.componentId) {
    const component = context.components.components.find((candidate) => candidate.id === target.componentId);
    return component ? { kind: 'component', id: component.id, sourceFile: component.sourceFile } : null;
  }

  if (target?.kind === 'node') {
    if (target.pageId) {
      const page = context.pages.pages.find((candidate) => candidate.id === target.pageId);
      return page ? { kind: 'page', id: page.id, sourceFile: page.sourceFile } : null;
    }
    if (target.componentId) {
      const component = context.components.components.find((candidate) => candidate.id === target.componentId);
      return component ? { kind: 'component', id: component.id, sourceFile: component.sourceFile } : null;
    }
  }

  return null;
}

function createSelectionTargetFromDesignEntity(target: DesignEntityTarget): WorkbenchSelectionTarget {
  return target.kind === 'page'
    ? { kind: 'page', pageId: target.id, sourceFile: target.sourceFile }
    : { kind: 'component', componentId: target.id, sourceFile: target.sourceFile };
}

function createDesignTargetExtensions(target: DesignEntityTarget | null): WorkbenchSelectionExtensions {
  if (!target) {
    return {
      [ACTIVE_DESIGN_TARGET_KIND_EXTENSION]: null,
      [ACTIVE_DESIGN_TARGET_ID_EXTENSION]: null,
      [ACTIVE_DESIGN_SOURCE_FILE_EXTENSION]: null,
    };
  }

  return {
    [ACTIVE_DESIGN_TARGET_KIND_EXTENSION]: target.kind,
    [ACTIVE_DESIGN_TARGET_ID_EXTENSION]: target.id,
    [ACTIVE_DESIGN_SOURCE_FILE_EXTENSION]: target.sourceFile,
  };
}

function getSanitizedOpenDesignTargetKeys(
  value: unknown,
  activeTarget: DesignEntityTarget | null,
  context: Pick<SessionRegistryContext, 'components' | 'pages'>,
): string[] {
  const availableKeys = new Set([
    ...context.pages.pages.map((page) => `page:${page.id}`),
    ...context.components.components.map((component) => `component:${component.id}`),
  ]);
  const persistedKeys = normalizeStringArray(value).filter((key) => availableKeys.has(key));
  const activeKey = activeTarget ? getDesignEntityTargetKey(activeTarget) : null;
  if (!activeKey || persistedKeys.includes(activeKey)) return persistedKeys;
  return [activeKey, ...persistedKeys];
}

function getDesignEntityTargetKey(target: DesignEntityTarget): string {
  return `${target.kind}:${target.id}`;
}

function getValidStorybookTarget(
  extensions: Record<string, unknown>,
  context: Pick<SessionRegistryContext, 'components'>,
): { kind: 'component' | 'foundation'; id: string } | null {
  const kind = getStringExtension(extensions, ACTIVE_STORYBOOK_TARGET_KIND_EXTENSION);
  const id = getStringExtension(extensions, ACTIVE_STORYBOOK_TARGET_ID_EXTENSION);
  if (!kind || !id) return null;
  if (kind === 'foundation') return { kind, id };
  if (kind === 'component' && context.components.components.some((component) => component.id === id)) return { kind, id };
  return null;
}

function getValidHistoryLaneIds(
  context: Pick<SessionRegistryContext, 'components' | 'pages' | 'projectId' | 'tokenPath'>,
): Set<HistoryLaneId> {
  return new Set([
    getHistoryLaneId({ type: 'tokens', target: context.tokenPath }),
    getHistoryLaneId({ type: 'workspace', projectId: context.projectId }),
    ...context.pages.pages.map((page) => getHistoryLaneId({ type: 'page', filePath: page.sourceFile })),
    ...context.components.components.map((component) => getHistoryLaneId({ type: 'component', filePath: component.sourceFile })),
  ]);
}

function isHistoryLaneOwnerValid(
  lane: PersistedHistoryLane,
  context: Pick<SessionRegistryContext, 'components' | 'pages' | 'projectId' | 'tokenPath'>,
): boolean {
  const owner = lane.owner as EditOwner;
  if (!isRecord(owner)) return false;

  if (owner.type === 'tokens') return owner.target === context.tokenPath;
  if (owner.type === 'workspace') return owner.projectId === context.projectId;
  if (owner.type === 'page') return context.pages.pages.some((page) => page.sourceFile === owner.filePath);
  if (owner.type === 'component') return context.components.components.some((component) => component.sourceFile === owner.filePath);
  if (owner.type === 'css-class') return typeof owner.registryPath === 'string' && owner.registryPath.trim().length > 0;
  return false;
}

function hasTokenReference(registry: WorkbenchTokenRegistry, collectionId: string, tokenId: string): boolean {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  return Boolean(collection?.tokens.some((token) => token.id === tokenId));
}

function dedupeSelectionTargets(targets: WorkbenchSelectionTarget[]): WorkbenchSelectionTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = getSelectionTargetKey(target);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ensureSelectionTarget(targets: WorkbenchSelectionTarget[], target: WorkbenchSelectionTarget): WorkbenchSelectionTarget[] {
  return targets.some((candidate) => areSelectionTargetsEquivalent(candidate, target))
    ? targets
    : [target, ...targets];
}

function areSelectionTargetsEquivalent(left: WorkbenchSelectionTarget | null, right: WorkbenchSelectionTarget | null): boolean {
  if (!left || !right) return left === right;
  return getSelectionTargetKey(left) === getSelectionTargetKey(right);
}

function getSelectionTargetKey(target: WorkbenchSelectionTarget): string {
  if (target.kind === 'page') return `page:${target.pageId ?? ''}`;
  if (target.kind === 'component') return `component:${target.componentId ?? ''}`;
  if (target.kind === 'node') return `node:${target.pageId ?? ''}:${target.componentId ?? ''}:${target.nodeId ?? ''}`;
  if (target.kind === 'token') return `token:${getStringExtension(target.extensions, 'collectionId') ?? ''}:${target.tokenId ?? ''}`;
  return 'project';
}

function areDesignTargetsEqual(left: DesignEntityTarget | null, right: DesignEntityTarget | null): boolean {
  if (!left || !right) return left === right;
  return left.kind === right.kind && left.id === right.id && left.sourceFile === right.sourceFile;
}

function normalizeTargetExtensions(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (typeof entry !== 'string') return [];
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) return [];
    seen.add(trimmed);
    return [trimmed];
  });
}

function getStringField(value: unknown, key: string): string | null {
  return isRecord(value) ? getTrimmedString(value[key]) : null;
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  return getTrimmedString(extensions?.[key]);
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
