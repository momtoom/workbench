import assert from 'node:assert/strict';
import test from 'node:test';
import { getHistoryLaneId } from '@domain/history/historyController';
import {
  createDefaultWorkbenchSelectionState,
  createRecoverableWorkbenchHistoryFile,
  sanitizeWorkbenchHistoryFile,
  sanitizeWorkbenchSelectionState,
} from '@domain/project/workbenchSessionState';
import type {
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
  WorkbenchSelectionExtensions,
  WorkbenchTokenRegistry,
} from '@domain/project/workbenchProject';

const NOW = '2026-07-31T12:00:00.000Z';
const PAGE_SOURCE = 'src/workbench-pages/Home.tsx';
const PAGE_SOURCE_VALUE = 'export default function Home() { return null; }\n';
const COMPONENT_SOURCE = 'src/components/Card.tsx';
const TOKEN_PATH = '.workbench/tokens.json';
const PROJECT_ID = 'session-contract-project';

const pages: WorkbenchPageRegistry = {
  schemaVersion: '0.1',
  pages: [{
    id: 'home',
    name: 'Home',
    route: '/',
    sourceFile: PAGE_SOURCE,
    rootNodeId: 'home-root',
    status: 'ready',
  }],
  extensions: {},
};

const components: WorkbenchComponentRegistry = {
  schemaVersion: '0.1',
  components: [{
    id: 'card',
    name: 'Card',
    sourceFile: COMPONENT_SOURCE,
    variants: [],
  }],
  extensions: {},
};

const tokens: WorkbenchTokenRegistry = {
  schemaVersion: '0.1',
  collections: [{
    id: 'colors',
    name: 'Colors',
    modes: [{ id: 'default', name: 'Default' }],
    groups: [],
    tokens: [{
      id: 'surface',
      name: 'Surface',
      type: 'color',
      values: { default: { kind: 'raw', value: '#ffffff' } },
      sortOrder: 0,
    }],
  }],
  extensions: {},
};

const sessionContext = {
  components,
  pages,
  projectId: PROJECT_ID,
  tokenPath: TOKEN_PATH,
  tokens,
  updatedAt: NOW,
};

test('default and malformed selection state recovery are deterministic and contain no fabricated target', () => {
  const result = createDefaultWorkbenchSelectionState({ components, pages, updatedAt: NOW });

  assert.deepEqual(result, {
    schemaVersion: '0.1',
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      activeWorkbenchSurface: 'design',
      activeDesignTargetKind: null,
      activeDesignTargetId: null,
      activeDesignSourceFile: null,
      activeDesignLayerId: null,
      selectedDesignLayerIds: [],
      openDesignTargetKeys: [],
    },
  });
  assert.deepEqual(sanitizeWorkbenchSelectionState('invalid-selection', sessionContext), result);
});

test('valid design session state keeps workspace extensions and normalizes collection fields', () => {
  const designExtensions: WorkbenchSelectionExtensions = {
    activeDesignTargetKind: 'page',
    activeDesignTargetId: 'home',
    activeDesignSourceFile: 'stale/Home.tsx',
    activeDesignLayerId: 'button-1',
    selectedDesignLayerIds: [' button-1 ', 'button-1', ''],
    collapsedDesignLayerIds: ['section-1', 'section-1'],
    designPreviewDrillPath: ['instance-1', ' instance-2 '],
    openDesignTargetKeys: ['component:card', 'page:removed'],
    designPreviewAppearance: 'dark',
  };
  const result = sanitizeWorkbenchSelectionState({
    schemaVersion: '0.1',
    activeTarget: { kind: 'page', pageId: 'home', sourceFile: 'stale/Home.tsx' },
    selectedTargets: [
      { kind: 'page', pageId: 'home' },
      { kind: 'page', pageId: 'home' },
      { kind: 'page', pageId: 'removed' },
    ],
    updatedAt: '2026-07-31T11:00:00.000Z',
    extensions: {
      ...designExtensions,
      activeWorkbenchSurface: 'design',
    },
  }, sessionContext);

  assert.deepEqual(result.activeTarget, {
    kind: 'page',
    pageId: 'home',
    sourceFile: PAGE_SOURCE,
    extensions: {},
  });
  assert.equal(result.selectedTargets.length, 1);
  assert.equal(result.extensions.activeDesignSourceFile, PAGE_SOURCE);
  assert.equal(result.extensions.activeDesignLayerId, 'button-1');
  assert.deepEqual(result.extensions.selectedDesignLayerIds, ['button-1']);
  assert.deepEqual(result.extensions.collapsedDesignLayerIds, ['section-1']);
  assert.deepEqual(result.extensions.designPreviewDrillPath, ['instance-1', 'instance-2']);
  assert.deepEqual(result.extensions.openDesignTargetKeys, ['page:home', 'component:card']);
  assert.equal(result.extensions.designPreviewAppearance, 'dark');
});

test('malformed design navigation fields are normalized without changing the active owner', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: { kind: 'page', pageId: 'home' },
    selectedTargets: [{ kind: 'page', pageId: 'home' }],
    updatedAt: NOW,
    extensions: {
      activeDesignTargetKind: 'page',
      activeDesignTargetId: 'home',
      activeDesignSourceFile: PAGE_SOURCE,
      activeDesignLayerId: 42,
      selectedDesignLayerIds: 'not-an-array',
      collapsedDesignLayerIds: [1, ' section-1 ', 'section-1'],
      designPreviewDrillPath: [null, ' instance-1 '],
      futureDesignNavigationState: { retained: true },
    },
  }, sessionContext);

  assert.equal(result.activeTarget?.pageId, 'home');
  assert.equal(result.extensions.activeDesignLayerId, null);
  assert.deepEqual(result.extensions.selectedDesignLayerIds, []);
  assert.deepEqual(result.extensions.collapsedDesignLayerIds, ['section-1']);
  assert.deepEqual(result.extensions.designPreviewDrillPath, ['instance-1']);
  assert.deepEqual(result.extensions.futureDesignNavigationState, { retained: true });
});

test('a deleted active owner falls back to a valid selected owner and resets node-local state', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: { kind: 'page', pageId: 'removed' },
    selectedTargets: [{ kind: 'component', componentId: 'card' }],
    updatedAt: NOW,
    extensions: {
      activeDesignTargetKind: 'page',
      activeDesignTargetId: 'home',
      activeDesignLayerId: 'stale-layer',
      selectedDesignLayerIds: ['stale-layer'],
      collapsedDesignLayerIds: ['stale-section'],
      designPreviewDrillPath: ['stale-instance'],
      openDesignTargetKeys: ['page:home'],
    },
  }, sessionContext);

  assert.deepEqual(result.activeTarget, {
    kind: 'component',
    componentId: 'card',
    sourceFile: COMPONENT_SOURCE,
    extensions: {},
  });
  assert.equal(result.extensions.activeDesignTargetKind, 'component');
  assert.equal(result.extensions.activeDesignTargetId, 'card');
  assert.equal(result.extensions.activeDesignLayerId, 'preview-frame');
  assert.deepEqual(result.extensions.selectedDesignLayerIds, []);
  assert.deepEqual(result.extensions.collapsedDesignLayerIds, []);
  assert.deepEqual(result.extensions.designPreviewDrillPath, []);
  assert.deepEqual(result.extensions.openDesignTargetKeys, ['component:card', 'page:home']);
});

test('an explicit null active target is not resurrected from persisted design extensions', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      activeDesignTargetKind: 'page',
      activeDesignTargetId: 'home',
      activeDesignSourceFile: PAGE_SOURCE,
      activeDesignLayerId: 'stale-layer',
      selectedDesignLayerIds: ['stale-layer'],
    },
  }, sessionContext);

  assert.equal(result.activeTarget, null);
  assert.equal(result.extensions.activeDesignTargetKind, null);
  assert.equal(result.extensions.activeDesignTargetId, null);
  assert.equal(result.extensions.activeDesignSourceFile, null);
  assert.equal(result.extensions.activeDesignLayerId, null);
  assert.deepEqual(result.extensions.selectedDesignLayerIds, []);
});

test('token selections require a real collection and token reference', () => {
  const valid = sanitizeWorkbenchSelectionState({
    activeTarget: {
      kind: 'token',
      tokenId: 'surface',
      extensions: { collectionId: 'colors', ignored: 'value' },
    },
    selectedTargets: [
      { kind: 'token', tokenId: 'surface', extensions: { collectionId: 'colors' } },
      { kind: 'token', tokenId: 'missing', extensions: { collectionId: 'colors' } },
    ],
    updatedAt: NOW,
    extensions: { activeWorkbenchSurface: 'tokens' },
  }, sessionContext);
  const invalid = sanitizeWorkbenchSelectionState({
    activeTarget: {
      kind: 'token',
      tokenId: 'missing',
      extensions: { collectionId: 'colors' },
    },
    selectedTargets: [],
    updatedAt: NOW,
    extensions: { activeWorkbenchSurface: 'tokens' },
  }, sessionContext);

  assert.deepEqual(valid.activeTarget, {
    kind: 'token',
    tokenId: 'surface',
    extensions: { collectionId: 'colors' },
  });
  assert.equal(valid.selectedTargets.length, 1);
  assert.equal(valid.extensions.activeWorkbenchSurface, 'tokens');
  assert.equal(invalid.activeTarget, null);
});

test('invalid Storybook component state is cleared without removing unrelated workspace state', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      activeStorybookTargetKind: 'component',
      activeStorybookTargetId: 'removed-component',
      activeDesignStoryComponentId: 'removed-component',
      activeDesignStoryArgs: { density: 'compact' },
      workbenchInspectorWidth: 320,
    },
  }, sessionContext);

  assert.equal(result.extensions.activeStorybookTargetKind, null);
  assert.equal(result.extensions.activeStorybookTargetId, null);
  assert.equal(result.extensions.activeDesignStoryComponentId, null);
  assert.equal(result.extensions.activeDesignStoryArgs, null);
  assert.equal(result.extensions.workbenchInspectorWidth, 320);
});

test('design story session args keep scalar props and remove malformed values', () => {
  const typedExtensions: WorkbenchSelectionExtensions = {
    activeDesignStoryComponentId: 'card',
    activeDesignStoryArgs: {
      enabled: true,
      label: 'Card',
      count: 2,
    },
  };
  const valid = sanitizeWorkbenchSelectionState({
    activeTarget: { kind: 'component', componentId: 'card' },
    selectedTargets: [{ kind: 'component', componentId: 'card' }],
    updatedAt: NOW,
    extensions: {
      ...typedExtensions,
      activeDesignTargetKind: 'component',
      activeDesignTargetId: 'card',
      activeDesignSourceFile: COMPONENT_SOURCE,
    },
  }, sessionContext);
  const malformed = sanitizeWorkbenchSelectionState({
    activeTarget: { kind: 'component', componentId: 'card' },
    selectedTargets: [{ kind: 'component', componentId: 'card' }],
    updatedAt: NOW,
    extensions: {
      activeDesignTargetKind: 'component',
      activeDesignTargetId: 'card',
      activeDesignSourceFile: COMPONENT_SOURCE,
      activeDesignStoryComponentId: ' card ',
      activeDesignStoryArgs: {
        enabled: false,
        label: 'Compact card',
        count: 3,
        infinite: Number.POSITIVE_INFINITY,
        nested: { unsupported: true },
        '': 'empty-key',
      },
      futureStorySessionState: { retained: true },
    },
  }, sessionContext);

  assert.equal(valid.extensions.activeDesignStoryComponentId, 'card');
  assert.deepEqual(valid.extensions.activeDesignStoryArgs, {
    enabled: true,
    label: 'Card',
    count: 2,
  });
  assert.equal(malformed.extensions.activeDesignStoryComponentId, 'card');
  assert.deepEqual(malformed.extensions.activeDesignStoryArgs, {
    enabled: false,
    label: 'Compact card',
    count: 3,
  });
  assert.deepEqual(malformed.extensions.futureStorySessionState, { retained: true });
});

test('workspace session extensions keep typed values and remove malformed top-level fields', () => {
  const typedExtensions: WorkbenchSelectionExtensions = {
    activeTokenCollectionId: null,
    activeTokenGroupId: 'all',
    activeWorkbenchSurface: 'design',
    collapsedDesignLayerSection: false,
    collapsedDesignPageFolders: ['SamplePage'],
    collapsedDesignSourceGroups: ['pages'],
    collapsedDesignSourceSection: true,
    designPreviewAppearance: 'dark',
    designPreviewViewport: { height: 844, presetId: 'mobile', width: 390 },
    futureWorkspaceState: { retained: true },
    inspectorTokenPickerFilters: {
      background: { collectionId: 'colors', groupId: 'semantic' },
    },
    previewTokenModes: { colors: 'default' },
    tokenSelectionAnchorCollectionId: 'colors',
    tokenSelectionAnchorId: 'surface',
    workbenchInspectorWidth: 320,
    workbenchSidebarWidth: 240,
    workbenchTokenEditorSession: {
      query: 'surface',
      sidebarSearchQuery: 'semantic',
      tableColumnWidthsByCollection: { colors: { name: 240 } },
      typeFilter: 'color',
    },
  };
  const valid = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: typedExtensions,
  }, sessionContext);
  const malformed = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      activeQaTargetUrl: 5174,
      activeTokenCollectionId: 42,
      activeWorkbenchSurface: 'canvas',
      collapsedDesignLayerSection: 'false',
      collapsedDesignPageFolders: {},
      collapsedDesignSourceGroups: null,
      collapsedDesignSourceSection: 1,
      designPreviewAppearance: 42,
      designPreviewViewport: { height: 844, presetId: '', width: null },
      futureWorkspaceState: { retained: true },
      inspectorTokenPickerFilters: [],
      previewTokenModes: [],
      tokenSelectionAnchorId: false,
      workbenchInspectorWidth: '320',
      workbenchSidebarWidth: Number.POSITIVE_INFINITY,
      workbenchTokenEditorSession: [],
    },
  }, sessionContext);

  assert.equal(valid.extensions.activeWorkbenchSurface, 'design');
  assert.equal(valid.extensions.collapsedDesignLayerSection, false);
  assert.deepEqual(valid.extensions.collapsedDesignPageFolders, ['SamplePage']);
  assert.deepEqual(valid.extensions.collapsedDesignSourceGroups, ['pages']);
  assert.equal(valid.extensions.collapsedDesignSourceSection, true);
  assert.equal(valid.extensions.designPreviewAppearance, 'dark');
  assert.deepEqual(valid.extensions.designPreviewViewport, { height: 844, presetId: 'mobile', width: 390 });
  assert.deepEqual(valid.extensions.inspectorTokenPickerFilters, {
    background: { collectionId: 'colors', groupId: 'semantic' },
  });
  assert.deepEqual(valid.extensions.previewTokenModes, { colors: 'default' });
  assert.equal(valid.extensions.workbenchInspectorWidth, 320);
  assert.equal(valid.extensions.workbenchSidebarWidth, 240);
  assert.deepEqual(valid.extensions.workbenchTokenEditorSession, {
    query: 'surface',
    sidebarSearchQuery: 'semantic',
    tableColumnWidthsByCollection: { colors: { name: 240 } },
    typeFilter: 'color',
  });
  assert.deepEqual(valid.extensions.futureWorkspaceState, { retained: true });

  assert.equal('activeQaTargetUrl' in malformed.extensions, false);
  assert.equal('activeTokenCollectionId' in malformed.extensions, false);
  assert.equal('activeWorkbenchSurface' in malformed.extensions, false);
  assert.equal('collapsedDesignLayerSection' in malformed.extensions, false);
  assert.equal('collapsedDesignPageFolders' in malformed.extensions, false);
  assert.equal('collapsedDesignSourceGroups' in malformed.extensions, false);
  assert.equal('collapsedDesignSourceSection' in malformed.extensions, false);
  assert.equal('designPreviewAppearance' in malformed.extensions, false);
  assert.equal('designPreviewViewport' in malformed.extensions, false);
  assert.equal('inspectorTokenPickerFilters' in malformed.extensions, false);
  assert.equal('previewTokenModes' in malformed.extensions, false);
  assert.equal('tokenSelectionAnchorId' in malformed.extensions, false);
  assert.equal('workbenchInspectorWidth' in malformed.extensions, false);
  assert.equal('workbenchSidebarWidth' in malformed.extensions, false);
  assert.equal('workbenchTokenEditorSession' in malformed.extensions, false);
  assert.deepEqual(malformed.extensions.futureWorkspaceState, { retained: true });
});

test('removed QA workspace session state is discarded on reload', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      activeQaTargetUrl: 'http://127.0.0.1:5174/dashboard',
      activeWorkbenchSurface: 'qa',
      futureWorkspaceState: { retained: true },
    },
  }, sessionContext);

  assert.equal('activeQaTargetUrl' in result.extensions, false);
  assert.equal('activeWorkbenchSurface' in result.extensions, false);
  assert.deepEqual(result.extensions.futureWorkspaceState, { retained: true });
});

test('inspector token picker filters normalize known fields and preserve future fields and scope ids', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      inspectorTokenPickerFilters: {
        background: { collectionId: ' colors ', groupId: ' semantic ' },
        radius: { collectionId: 'all', groupId: 'ignored' },
        spacing: { collectionId: 'future-collection', groupId: '' },
        fontSize: null,
        futureInspectorField: { collectionId: 'colors', groupId: 'all' },
      },
    },
  }, sessionContext);

  assert.deepEqual(result.extensions.inspectorTokenPickerFilters, {
    background: { collectionId: 'colors', groupId: 'semantic' },
    radius: { collectionId: 'all', groupId: 'all' },
    spacing: { collectionId: 'future-collection', groupId: 'all' },
    futureInspectorField: { collectionId: 'colors', groupId: 'all' },
  });
});

test('design panel collapse preferences normalize without discarding future source groups', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      collapsedDesignLayerSection: true,
      collapsedDesignPageFolders: [' SamplePage ', '', 'SamplePage', 42],
      collapsedDesignSourceGroups: ['pages', 'future-group', 'pages', false],
      collapsedDesignSourceSection: false,
    },
  }, sessionContext);

  assert.equal(result.extensions.collapsedDesignLayerSection, true);
  assert.deepEqual(result.extensions.collapsedDesignPageFolders, ['SamplePage']);
  assert.deepEqual(result.extensions.collapsedDesignSourceGroups, ['pages', 'future-group']);
  assert.equal(result.extensions.collapsedDesignSourceSection, false);
});

test('iframe viewport size remains a standalone normalized session field', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      designEditPageStateMode: { 'page:sample': 'hover' },
      designEditResponsiveBreakpoint: 'mobile',
      designPageStateModes: { 'page:sample': [{ id: 'hover', label: 'Hover' }] },
      designPreviewBreakpointSizes: { mobile: { height: 844, width: 390 } },
      designPreviewViewport: {
        height: '756',
        presetId: ' responsive ',
        width: '400',
      },
      designResponsiveBreakpoints: [{ id: 'mobile', label: 'Mobile', minWidth: 0, maxWidth: 767 }],
    },
  }, sessionContext);

  assert.deepEqual(result.extensions.designPreviewViewport, {
    height: 756,
    presetId: 'responsive',
    width: 400,
  });
  assert.equal('designPreviewBreakpointSizes' in result.extensions, false);
  assert.equal('designResponsiveBreakpoints' in result.extensions, false);
  assert.equal('designEditResponsiveBreakpoint' in result.extensions, false);
  assert.equal('designPageStateModes' in result.extensions, false);
  assert.equal('designEditPageStateMode' in result.extensions, false);
});

test('preview appearance and token modes remain separate normalized session fields', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      designPreviewAppearance: 'sepia',
      previewTokenModes: {
        colors: 'default',
        futureCollection: 'dark',
        '': 'light',
        surface: 42,
      },
    },
  }, sessionContext);

  assert.equal(result.extensions.designPreviewAppearance, 'system');
  assert.deepEqual(result.extensions.previewTokenModes, {
    colors: 'default',
    futureCollection: 'dark',
  });
});

test('token editor session state normalizes nested fields and preserves future extensions', () => {
  const result = sanitizeWorkbenchSelectionState({
    activeTarget: null,
    selectedTargets: [],
    updatedAt: NOW,
    extensions: {
      workbenchTokenEditorSession: {
        query: 42,
        sidebarSearchQuery: 'semantic',
        tableColumnWidthsByCollection: {
          colors: {
            name: 240,
            default: 0,
            infinite: Number.POSITIVE_INFINITY,
            label: 'wide',
            '': 12,
          },
          empty: { value: -1 },
          invalid: 'not-widths',
        },
        typeFilter: 'unsupported',
        futureTokenEditorState: { retained: true },
      },
    },
  }, sessionContext);

  assert.deepEqual(result.extensions.workbenchTokenEditorSession, {
    query: '',
    sidebarSearchQuery: 'semantic',
    tableColumnWidthsByCollection: { colors: { name: 240 } },
    typeFilter: 'all',
    futureTokenEditorState: { retained: true },
  });
});

test('history recovery removes orphaned lanes and their timeline entries', () => {
  const pageLaneId = getHistoryLaneId({ type: 'page', filePath: PAGE_SOURCE });
  const orphanLaneId = getHistoryLaneId({ type: 'page', filePath: 'src/workbench-pages/Removed.tsx' });
  const workspaceLaneId = getHistoryLaneId({ type: 'workspace', projectId: PROJECT_ID });
  const cssLaneId = getHistoryLaneId({ type: 'css-class', registryPath: '.workbench/classes.json' });
  const history = {
    schemaVersion: '0.1',
    updatedAt: '2026-07-31T10:00:00.000Z',
    lanes: [
      // A source lane no longer persists its stacks. Recovery must keep it for
      // its `value`, not drop it for the fields it stopped writing.
      createLane(pageLaneId, { type: 'page', filePath: PAGE_SOURCE }, 'session-only'),
      createLane(orphanLaneId, { type: 'page', filePath: 'src/workbench-pages/Removed.tsx' }, 'session-only'),
      createLane(workspaceLaneId, { type: 'workspace', projectId: PROJECT_ID }),
      createLane(cssLaneId, { type: 'css-class', registryPath: '.workbench/classes.json' }),
    ],
    timeline: [
      createTimelineEntry('page-entry', pageLaneId),
      createTimelineEntry('orphan-entry', orphanLaneId),
      createTimelineEntry('workspace-entry', workspaceLaneId),
      createTimelineEntry('css-entry', cssLaneId),
    ],
    extensions: { retained: true },
  };

  const result = sanitizeWorkbenchHistoryFile(history, sessionContext);

  assert.deepEqual(result.lanes.map((lane) => lane.laneId), [pageLaneId, workspaceLaneId, cssLaneId]);
  assert.equal(result.lanes[0]?.value, PAGE_SOURCE_VALUE);
  assert.deepEqual(result.timeline.map((entry) => entry.transactionId), ['page-entry', 'workspace-entry', 'css-entry']);
  assert.equal(result.updatedAt, NOW);
  assert.deepEqual(result.extensions, { retained: true });
  assert.deepEqual(createRecoverableWorkbenchHistoryFile(NOW), {
    schemaVersion: '0.1',
    updatedAt: NOW,
    lanes: [],
    timeline: [],
    extensions: {},
  });
});

test('history recovery drops the stacks a session-owned lane no longer persists', () => {
  const pageLaneId = getHistoryLaneId({ type: 'page', filePath: PAGE_SOURCE });
  const componentLaneId = getHistoryLaneId({ type: 'component', filePath: COMPONENT_SOURCE });
  const tokenLaneId = getHistoryLaneId({ type: 'tokens', target: TOKEN_PATH });
  const transaction = {
    id: 'edit-1',
    laneId: pageLaneId,
    owner: { type: 'page', filePath: PAGE_SOURCE },
    label: 'Set rotation component prop',
    scope: 'page',
    kind: 'patch',
    before: 'rotation={0}',
    after: 'rotation={45}',
    affectedFiles: [PAGE_SOURCE],
    createdAt: NOW,
  };
  const withStacks = (laneId: string, owner: Record<string, unknown>) => ({
    ...createLane(laneId, owner),
    undoStack: [transaction],
    redoStack: [transaction],
  });

  // A file written before undo stopped being persisted. Only the lanes an edit
  // touches get rewritten, so the weight has to come off on read instead.
  const result = sanitizeWorkbenchHistoryFile({
    schemaVersion: '0.1',
    updatedAt: '2026-07-31T10:00:00.000Z',
    lanes: [
      withStacks(pageLaneId, { type: 'page', filePath: PAGE_SOURCE }),
      withStacks(componentLaneId, { type: 'component', filePath: COMPONENT_SOURCE }),
      withStacks(tokenLaneId, { type: 'tokens', target: TOKEN_PATH }),
    ],
    timeline: [],
    extensions: {},
  }, sessionContext);

  // Page, component and token lanes each own one controller for the session, so
  // nothing hydrates their stacks any more.
  assert.deepEqual(result.lanes.map((lane) => lane.undoStack === undefined), [true, true, true]);
  assert.deepEqual(result.lanes.map((lane) => lane.redoStack === undefined), [true, true, true]);
  // Unsaved-work recovery is untouched on every lane.
  assert.deepEqual(result.lanes.map((lane) => lane.value), [PAGE_SOURCE_VALUE, {}, {}]);
});

test('history recovery leaves a workspace lane its stacks', () => {
  const workspaceLaneId = getHistoryLaneId({ type: 'workspace', projectId: sessionContext.projectId });
  const transaction = {
    id: 'edit-note-1',
    laneId: workspaceLaneId,
    owner: { type: 'workspace', projectId: sessionContext.projectId },
    label: 'Edit spec note',
    scope: 'page',
    kind: 'patch',
    before: {},
    after: {},
    affectedFiles: [],
    createdAt: NOW,
  };

  const result = sanitizeWorkbenchHistoryFile({
    schemaVersion: '0.1',
    updatedAt: '2026-07-31T10:00:00.000Z',
    lanes: [{
      ...createLane(workspaceLaneId, { type: 'workspace', projectId: sessionContext.projectId }),
      undoStack: [transaction],
      redoStack: [transaction],
    }],
    timeline: [],
    extensions: {},
  }, sessionContext);

  // Spec notes still rebuild their memo within a session and rehydrate from the
  // in-memory file, so this lane's stacks are still its transport.
  assert.equal(result.lanes[0]?.undoStack?.length, 1);
  assert.equal(result.lanes[0]?.redoStack?.length, 1);
});

function createLane(
  laneId: string,
  owner: Record<string, unknown>,
  stackPersistence: 'persist' | 'session-only' = 'persist',
) {
  return {
    laneId,
    owner,
    value: owner.type === 'page' ? PAGE_SOURCE_VALUE : {},
    workingRevision: 0,
    savedRevision: 0,
    updatedAt: NOW,
    maxEntries: 10,
    ...(stackPersistence === 'persist' ? { undoStack: [], redoStack: [] } : {}),
    extensions: {},
  };
}

function createTimelineEntry(transactionId: string, laneId: string) {
  return {
    transactionId,
    laneId,
    label: transactionId,
    affectedFiles: [],
    createdAt: NOW,
  };
}
