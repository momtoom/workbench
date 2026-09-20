import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const workbenchSpecNotesSource = read('src/domain/project/workbenchSpecNotes.ts');
const workbenchSpecNotesModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    workbenchSpecNotesSource,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const legacyScopedSpecNotesRegistry = {
  schemaVersion: '0.1',
  comments: [{
    id: 'note-legacy-scope',
    body: 'Keep this note body.',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'open',
    target: { kind: 'project' },
    updatedAt: '2026-01-01T00:00:00.000Z',
    extensions: {
      scope: { responsiveBreakpointId: 'mobile', pageStateModeId: 'hover' },
      title: 'Legacy scoped note',
      type: 'intent',
    },
  }],
  extensions: {
    specNoteFolders: [{
      id: 'folder-legacy-scope',
      name: 'Legacy folder',
      parentFolderId: null,
      scope: { responsiveBreakpointId: 'mobile', pageStateModeId: 'hover' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }],
  },
};
const commonSpecNotesModel = workbenchSpecNotesModule.getWorkbenchSpecNotesModel(legacyScopedSpecNotesRegistry);
const commonSpecNotesRegistry = workbenchSpecNotesModule.createWorkbenchCommentRegistryFromSpecNotes(
  legacyScopedSpecNotesRegistry,
  commonSpecNotesModel,
);
assert(
  commonSpecNotesModel.notes[0]?.body === 'Keep this note body.' &&
    !('scope' in commonSpecNotesModel.notes[0]) &&
    !('scope' in commonSpecNotesModel.folders[0]) &&
    !('scope' in commonSpecNotesRegistry.comments[0].extensions) &&
    !('scope' in commonSpecNotesRegistry.extensions.specNoteFolders[0]),
  'Spec note normalization should preserve note content while discarding removed breakpoint and page-state scope metadata',
);
const storyControlFallbacksSource = read('src/workbench-stories/storyControlFallbacks.ts');
assert(
  !/COMMON_ENUM_PROP_OPTIONS|getKnownFallbackControlOptions/.test(storyControlFallbacksSource) &&
    storyControlFallbacksSource.includes('export function createValueTypeFallbackControl'),
  'Story control fallbacks should infer only from the arg value type, never from the prop name.',
);
const openDesignTargetOrderSource = read('src/domain/project/openDesignTargetOrder.ts');
const openDesignTargetOrderModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    openDesignTargetOrderSource,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const { reorderWorkbenchOpenDesignTargetKeys } = openDesignTargetOrderModule;
assert(
  JSON.stringify(reorderWorkbenchOpenDesignTargetKeys(
    ['page:music', 'page:gallery', 'page:settings'],
    'page:settings',
    'page:music',
    'before',
  )) === JSON.stringify(['page:settings', 'page:music', 'page:gallery']) &&
    JSON.stringify(reorderWorkbenchOpenDesignTargetKeys(
      ['page:music', 'page:gallery', 'page:settings'],
      'page:music',
      'page:settings',
      'after',
    )) === JSON.stringify(['page:gallery', 'page:settings', 'page:music']) &&
    JSON.stringify(reorderWorkbenchOpenDesignTargetKeys(
      ['page:music', 'page:gallery'],
      'page:music',
      'page:missing',
      'before',
    )) === JSON.stringify(['page:music', 'page:gallery']),
  'Design target tab ordering should move one persisted open-target key before or after another without inventing targets',
);
const sourceCanvasDropGeometry = read('src/domain/document/sourceCanvasDropGeometry.ts');
const sourceCanvasDropGeometryModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    sourceCanvasDropGeometry,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const {
  getSourceCanvasDropBoundaryActivationSize,
  inferSourceCanvasDropFlow,
  isSourceCanvasDropRectUsable,
  isSourceCanvasNoopReorder,
  resolveSourceCanvasRectProjection,
  resolveSourceCanvasDropInsertion,
  shouldHoldSourceCanvasDragOrigin,
} = sourceCanvasDropGeometryModule;
assert(
  getSourceCanvasDropBoundaryActivationSize({
    dimension: 100,
    flow: { axis: 'horizontal', grid: true, reverse: false },
    prefersInside: true,
    sameParentReorder: true,
  }) === 50 &&
    getSourceCanvasDropBoundaryActivationSize({
      dimension: 100,
      flow: { axis: 'vertical', reverse: false },
      prefersInside: false,
      sameParentReorder: true,
    }) === 30 &&
    getSourceCanvasDropBoundaryActivationSize({
      dimension: 100,
      flow: { axis: 'vertical', reverse: false },
      prefersInside: true,
      sameParentReorder: false,
    }) === 3,
  'Canvas drop activation should cover the full nearest-edge half of grid cells while preserving linear nesting bands',
);
const previewTreeMoveSimulationModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    read('src/domain/preview/previewTreeMoveSimulation.ts'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const { simulatePreviewTreeMove } = previewTreeMoveSimulationModule;
const previewMoveFixture = {
  id: 'root',
  children: [
    {
      id: 'source',
      children: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      label: 'Source',
    },
    {
      id: 'target',
      children: [{ id: 'd', label: 'D' }],
      label: 'Target',
    },
  ],
  label: 'Root',
};
const sameParentPreviewMove = simulatePreviewTreeMove({
  nodeIds: ['b'],
  root: previewMoveFixture,
  targetIndex: 3,
  targetParentId: 'source',
});
const crossParentPreviewMove = simulatePreviewTreeMove({
  nodeIds: ['a'],
  root: previewMoveFixture,
  targetIndex: 1,
  targetParentId: 'target',
});
const multiPreviewMove = simulatePreviewTreeMove({
  nodeIds: ['c', 'b'],
  root: previewMoveFixture,
  targetIndex: 0,
  targetParentId: 'target',
});
assert(
  sameParentPreviewMove?.children?.[0]?.children?.map((node) => node.id).join(',') === 'a,c,b' &&
    crossParentPreviewMove?.children?.[0]?.children?.map((node) => node.id).join(',') === 'b,c' &&
    crossParentPreviewMove?.children?.[1]?.children?.map((node) => node.id).join(',') === 'd,a' &&
    multiPreviewMove?.children?.[0]?.children?.map((node) => node.id).join(',') === 'a' &&
    multiPreviewMove?.children?.[1]?.children?.map((node) => node.id).join(',') === 'b,c,d',
  'Transient preview tree moves should match source writeback index semantics for sibling, cross-parent, and ordered multi-selection moves',
);
const sourceNodeCapabilitiesModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    read('src/domain/selection-scope/sourceNodeCapabilities.ts'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const { resolveEditableTreeSourceCapabilities } = sourceNodeCapabilitiesModule;
const sourceTreePreviewRuntimeProps = read(
  'src/features/workbench-shell/ui/sourceTreePreviewRuntimeProps.ts',
);
const sourceTreePreviewSource = read(
  'src/features/workbench-shell/ui/SourceTreePreview.tsx',
);
const designEditorSource = read(
  'src/features/workbench-shell/ui/DesignEditor.tsx',
);
const designSourceNavigatorSource = read(
  'src/features/workbench-shell/ui/DesignSourceNavigator.tsx',
);
const cssClassEffectivenessSource = read(
  'src/domain/preview/cssClassEffectiveness.ts',
);
const cssClassEffectivenessResolverSource = sourceTreePreviewSource.slice(
  sourceTreePreviewSource.indexOf('function resolveSourceTreePreviewClassEffectivenessElement('),
  sourceTreePreviewSource.indexOf('const SOURCE_TREE_PREVIEW_DEGENERATE_ANCHOR_SIZE_PX'),
);
const cssClassEffectivenessObserverSource = sourceTreePreviewSource.slice(
  sourceTreePreviewSource.indexOf('const nodeTouchesSelection = (node: Node) => {'),
  sourceTreePreviewSource.indexOf('const commandHoverPointRef = useRef'),
);
const cssClassEffectivenessAsyncSource = cssClassEffectivenessSource.slice(
  cssClassEffectivenessSource.indexOf('export async function analyzeCssClassEffectivenessAsync('),
  cssClassEffectivenessSource.indexOf('function createSelectedElementRuleIndex('),
);
assert(
  cssClassEffectivenessResolverSource.includes('[data-wb-preview-node-id=') &&
    cssClassEffectivenessResolverSource.includes('getSourceTreePreviewRuntimeRootClassName(layerId)') &&
    !cssClassEffectivenessResolverSource.includes('getSourceTreePreviewNodeFootprintElements') &&
    !cssClassEffectivenessResolverSource.includes('getPreviewNodeVisualRect') &&
    !cssClassEffectivenessResolverSource.includes('SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE'),
  'CSS class effectiveness should resolve only the selected node root without measuring delegated descendants or visual footprints.',
);
assert(
  cssClassEffectivenessObserverSource.includes('target !== observedElement') &&
    !cssClassEffectivenessObserverSource.includes("node.querySelectorAll('[data-wb-preview-node-id]')") &&
    !cssClassEffectivenessObserverSource.includes('observedElement.contains(node)'),
  'CSS class effectiveness should only remeasure for the selected root instead of descendant events or subtree mutations.',
);
assert(
  sourceTreePreviewSource.includes('getSourceTreePreviewTailwindClassRulesForClassNames') &&
    cssClassEffectivenessAsyncSource.includes('createSelectedElementRuleIndex(localRules') &&
    !cssClassEffectivenessAsyncSource.includes('buildCssRuleIndexForElementAsync') &&
    !cssClassEffectivenessAsyncSource.includes('document.styleSheets') &&
    cssClassEffectivenessSource.includes('CSS_SELECTED_ELEMENT_ANALYSIS_BUDGET_MS') &&
    cssClassEffectivenessSource.includes('element.classList.contains(rule.selectedElementClassName)') &&
    sourceTreePreviewSource.includes('analysis stopped after exceeding its safe interaction budget') &&
    sourceTreePreviewSource.includes('if (analysisSuspended) return;') &&
    sourceTreePreviewSource.includes('SOURCE_TREE_PREVIEW_CLASS_EFFECTIVENESS_MAX_SOURCE_TOKENS'),
  'CSS class effectiveness should compare selected-root class declarations and inline styles without opening the page stylesheet CSSOM.',
);
assert(
  sourceTreePreviewSource.includes(
    'childNodes: hasHydratedRuntimeChildren ? node.children ?? [] : childNodes',
  ),
  'SourceTreePreview must pass authored sourcePreviewChildren through compound runtime component boundaries.',
);
assert(
  designEditorSource.includes('authoredPreviewChildren.length === 0'),
  'DesignEditor must not replace authored sourcePreviewChildren with imported implementation hydration.',
);
assert(
  designEditorSource.includes("from './DesignSourceNavigator'") &&
    designEditorSource.includes('<DesignSourceTargetList') &&
    designEditorSource.includes('<DesignSourceTargetTabs') &&
    !designEditorSource.includes('function DesignSourceTargetList(') &&
    !designEditorSource.includes('function DesignSourceTargetTabs(') &&
    designSourceNavigatorSource.includes('export function DesignSourceTargetList(') &&
    designSourceNavigatorSource.includes('export function DesignSourceTargetTabs(') &&
    designSourceNavigatorSource.includes('onSelectTarget: (target: DesignSourceTarget) => void;') &&
    !designSourceNavigatorSource.includes('WorkbenchSelectionState') &&
    !designSourceNavigatorSource.includes('workbenchProjectLoader') &&
    !designSourceNavigatorSource.includes('editableTreeSourceParser'),
  'Design source navigation presentation must stay extracted behind callbacks without taking workspace session, loader, or parser ownership.',
);
const sourceTreePreviewRuntimePropsModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    sourceTreePreviewRuntimeProps,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const {
  getSourceTreePreviewProjectComponentProps,
  getSourceTreePreviewRuntimeRootClassName,
  getSourceTreePreviewRuntimeRootNodeId,
  isSourceTreePreviewProjectRuntimeSourceChange,
  mergeSourceTreePreviewProjectComponentProps,
} = sourceTreePreviewRuntimePropsModule;
const { runSourceTreePreviewRuntimeLifecycleFixture } = await import(
  './fixtures/source-tree-preview-runtime-lifecycle.mjs'
);
const sourceTreePreviewRuntimeLifecycleFixture =
  runSourceTreePreviewRuntimeLifecycleFixture(
    getSourceTreePreviewProjectComponentProps,
    {
      getRuntimeRootNodeId: getSourceTreePreviewRuntimeRootNodeId,
      mergeProjectComponentProps: mergeSourceTreePreviewProjectComponentProps,
    },
  );
let sourceTreePreviewRuntimeLifecycleRegressionDetected = false;
try {
  runSourceTreePreviewRuntimeLifecycleFixture((runtimeNodeProps) => runtimeNodeProps);
} catch (error) {
  sourceTreePreviewRuntimeLifecycleRegressionDetected =
    error instanceof Error &&
    (
      error.message === 'Project runtime component props retained the editor instrumentation ref.' ||
      error.message === 'Project runtime component props retained editor interaction instrumentation.'
    );
}
assert(
  sourceTreePreviewRuntimeLifecycleFixture.internalRefPreserved &&
    sourceTreePreviewRuntimeLifecycleFixture.editorRefIsolated &&
    sourceTreePreviewRuntimeLifecycleFixture.editorHandlersIsolated &&
    sourceTreePreviewRuntimeLifecycleFixture.effectRan &&
    sourceTreePreviewRuntimeLifecycleFixture.dataPropsForwarded &&
    sourceTreePreviewRuntimeLifecycleFixture.realmResizeObserverUsed &&
    sourceTreePreviewRuntimeLifecycleFixture.realmAnimationFrameUsed &&
    sourceTreePreviewRuntimeLifecycleFixture.runtimeRootMatched &&
    sourceTreePreviewRuntimeLifecycleFixture.sourceClassNamePreserved &&
    sourceTreePreviewRuntimeLifecycleFixture.sourceHandlerPreserved &&
    sourceTreePreviewRuntimeLifecycleFixture.canvasBuffer[0] === 640 &&
    sourceTreePreviewRuntimeLifecycleFixture.canvasBuffer[1] === 360,
  'SourceTreePreview project component props should isolate editor refs and interaction handlers while preserving source-owned handlers, classes, effects, iframe realm APIs, canvas sizing, metadata, and a measurable runtime root marker',
);
assert(
  sourceTreePreviewRuntimeLifecycleRegressionDetected,
  'SourceTreePreview runtime lifecycle fixture should fail when editor instrumentation refs leak into project component props',
);
const runtimeRootMarkerFixtureId = 'source:src/workbench-pages/페이지.tsx:1-2';
const runtimeRootMarkerFixtureClassName =
  getSourceTreePreviewRuntimeRootClassName(runtimeRootMarkerFixtureId);
assert(
  getSourceTreePreviewRuntimeRootNodeId(runtimeRootMarkerFixtureClassName) ===
    runtimeRootMarkerFixtureId &&
    getSourceTreePreviewRuntimeRootNodeId(`authored ${runtimeRootMarkerFixtureClassName}`) ===
      runtimeRootMarkerFixtureId &&
    getSourceTreePreviewRuntimeRootNodeId({ baseVal: runtimeRootMarkerFixtureClassName }) ===
      runtimeRootMarkerFixtureId &&
    getSourceTreePreviewRuntimeRootNodeId('wb-source-runtime-root-invalid') === null,
  'SourceTreePreview runtime root marker classes should round-trip source node ids for HTML and SVG className values without relying on DOM data-attribute forwarding',
);
assert(
  !isSourceTreePreviewProjectRuntimeSourceChange(
    'src/workbench-pages/FACTFULNESS.tsx',
    'src/workbench-pages/FACTFULNESS.tsx',
  ) &&
    isSourceTreePreviewProjectRuntimeSourceChange(
      'src/components/FactfulnessQuiz.tsx',
      'src/workbench-pages/FACTFULNESS.tsx',
    ) &&
    isSourceTreePreviewProjectRuntimeSourceChange(
      '.workbench/dependency-install.json',
      'src/workbench-pages/FACTFULNESS.tsx',
    ) &&
    isSourceTreePreviewProjectRuntimeSourceChange(
      'package.json',
      'src/workbench-pages/FACTFULNESS.tsx',
    ) &&
    !isSourceTreePreviewProjectRuntimeSourceChange(
      'src/workbench-pages/FACTFULNESS.css',
      'src/workbench-pages/FACTFULNESS.tsx',
    ) &&
    !isSourceTreePreviewProjectRuntimeSourceChange(
      '.workbench/pages.json',
      'src/workbench-pages/FACTFULNESS.tsx',
    ),
  'SourceTreePreview should preserve runtime component identity for active page prop writes while rebuilding for component module changes',
);

const sourceLocation = {
  endColumn: 10,
  endLine: 1,
  startColumn: 0,
  startLine: 1,
};
const sourceCapabilityTree = {
  id: 'page-root',
  kind: 'frame',
  label: 'Page',
  source: {
    jsxName: 'main',
    sourceFile: 'src/workbench-pages/Page.tsx',
  },
  sourceLocation,
  children: [
    {
      id: 'scroll-area-runtime',
      kind: 'component-instance',
      label: 'ScrollArea runtime',
      sourcePreviewChildren: [
        {
          id: 'recent-card',
          kind: 'component-instance',
          label: 'RecentChatCard',
          source: {
            jsxName: 'RecentChatCard',
            sourceFile: 'src/workbench-pages/Page.tsx',
          },
          sourceLocation,
          sourcePreviewOrigin: 'forwarded-source-child',
          children: [
            {
              id: 'recent-card-label',
              kind: 'text',
              label: 'Card label',
              source: {
                jsxName: 'span',
                sourceFile: 'src/workbench-pages/Page.tsx',
              },
              sourceLocation,
            },
            {
              id: 'nested-runtime',
              kind: 'component-instance',
              label: 'Nested runtime',
              sourcePreviewChildren: [
                {
                  id: 'nested-runtime-button',
                  kind: 'frame',
                  label: 'Nested button',
                  source: {
                    jsxName: 'button',
                    sourceFile: 'src/components/RecentChatCard.tsx',
                  },
                  sourceLocation,
                },
              ],
            },
          ],
        },
        {
          id: 'scroll-area-viewport',
          kind: 'frame',
          label: 'ScrollArea viewport',
          source: {
            jsxName: 'div',
            sourceFile: 'src/components/ScrollArea.tsx',
          },
          sourceLocation,
        },
      ],
    },
    {
      id: 'mapped-collection',
      kind: 'frame',
      label: 'Map · ITEMS · 2 items',
      source: {
        jsxName: 'Fragment',
        sourceFile: 'src/workbench-pages/Page.tsx',
      },
      sourceLocation,
      sourceExpression: {
        code: 'ITEMS.map((item) => <button>{item.title}</button>)',
        kind: 'map',
        label: 'ITEMS.map(...)',
      },
      sourceMapBinding: {
        expression: {
          code: 'ITEMS.map((item) => <button>{item.title}</button>)',
          kind: 'map',
          label: 'ITEMS.map(...)',
        },
        itemCount: 2,
        items: [{ title: 'One' }, { title: 'Two' }],
        scope: 'collection',
        source: {
          code: 'ITEMS',
          label: 'ITEMS',
          writable: true,
        },
      },
      children: [
        {
          id: 'mapped-row-preview',
          kind: 'frame',
          label: 'button',
          source: {
            jsxName: 'button',
            sourceFile: 'src/workbench-pages/Page.tsx',
          },
          sourceLocation,
        },
      ],
    },
  ],
};
const forwardedCardCapabilities = resolveEditableTreeSourceCapabilities({
  activeEntityId: 'page',
  root: sourceCapabilityTree,
  selectedNodeId: 'recent-card',
});
const forwardedLabelCapabilities = resolveEditableTreeSourceCapabilities({
  activeEntityId: 'page',
  root: sourceCapabilityTree,
  selectedNodeId: 'recent-card-label',
});
const scrollViewportCapabilities = resolveEditableTreeSourceCapabilities({
  activeEntityId: 'page',
  root: sourceCapabilityTree,
  selectedNodeId: 'scroll-area-viewport',
});
const nestedImplementationCapabilities = resolveEditableTreeSourceCapabilities({
  activeEntityId: 'page',
  root: sourceCapabilityTree,
  selectedNodeId: 'nested-runtime-button',
});
const mappedCollectionCapabilities = resolveEditableTreeSourceCapabilities({
  activeEntityId: 'page',
  root: sourceCapabilityTree,
  selectedNodeId: 'mapped-collection',
});
assert(
  forwardedCardCapabilities.ownership.kind === 'forwarded-slot-child' &&
    forwardedCardCapabilities.ownerInstanceId === null &&
    forwardedCardCapabilities.capabilities.canCopy &&
    forwardedCardCapabilities.capabilities.canEditStructure &&
    forwardedLabelCapabilities.ownership.kind === 'forwarded-slot-child' &&
    forwardedLabelCapabilities.ownerInstanceId === null,
  'Forwarded authored slot children should retain page source ownership through component runtime wrappers',
);
assert(
  scrollViewportCapabilities.ownership.kind === 'component-implementation' &&
    scrollViewportCapabilities.ownerInstanceId === 'scroll-area-runtime' &&
    !scrollViewportCapabilities.capabilities.canCopy &&
    !scrollViewportCapabilities.capabilities.canEditStructure &&
    nestedImplementationCapabilities.ownership.kind === 'component-implementation' &&
    nestedImplementationCapabilities.ownerInstanceId === 'nested-runtime' &&
    !nestedImplementationCapabilities.capabilities.canEditFields,
  'Component implementation nodes should remain behind their nearest runtime instance boundary',
);
assert(
  mappedCollectionCapabilities.capabilities.canEditFields &&
    !mappedCollectionCapabilities.capabilities.canInsertChildren,
  'A writable map collection should keep Binding edits while refusing fake JSX child insertion',
);

assert(
  shouldHoldSourceCanvasDragOrigin({
    activationDistance: 14,
    dragDistance: 8,
  }) &&
    !shouldHoldSourceCanvasDragOrigin({
      activationDistance: 14,
      dragDistance: 14,
    }),
  'Canvas drag should preserve the origin slot until the pointer clears the drop activation distance',
);
const shrinkingFlowProjection = resolveSourceCanvasRectProjection({
  actualRect: { left: 20, top: 10, width: 100, height: 40 },
  desiredRect: { left: 44, top: 16, width: 75, height: 60 },
});
const growingFlowProjection = resolveSourceCanvasRectProjection({
  actualRect: { left: 44, top: 16, width: 75, height: 60 },
  desiredRect: { left: 20, top: 10, width: 100, height: 40 },
});
assert(
  shrinkingFlowProjection.hasPositionChange &&
    shrinkingFlowProjection.hasSizeChange &&
    shrinkingFlowProjection.x === 24 &&
    shrinkingFlowProjection.y === 6 &&
    shrinkingFlowProjection.scaleX === 0.75 &&
    shrinkingFlowProjection.scaleY === 1.5 &&
    growingFlowProjection.hasPositionChange &&
    growingFlowProjection.hasSizeChange &&
    Math.abs(growingFlowProjection.scaleX - 4 / 3) < 0.0001 &&
    Math.abs(growingFlowProjection.scaleY - 2 / 3) < 0.0001,
  'Canvas reflow projection should capture flex siblings that shrink, grow, move, or change height after insertion',
);
assert(
  isSourceCanvasNoopReorder({
    currentIndex: 1,
    siblingCount: 3,
    targetIndex: 1,
  }) &&
    isSourceCanvasNoopReorder({
      currentIndex: 1,
      siblingCount: 3,
      targetIndex: 2,
    }) &&
    !isSourceCanvasNoopReorder({
      currentIndex: 1,
      siblingCount: 3,
      targetIndex: 0,
    }) &&
    !isSourceCanvasNoopReorder({
      currentIndex: 1,
      siblingCount: 3,
      targetIndex: 3,
    }),
  'Canvas drag should suppress both insertion boundaries that resolve to the current sibling position',
);

const oneColumnGridRects = [
  { left: 0, top: 0, width: 160, height: 36 },
  { left: 0, top: 44, width: 160, height: 36 },
  { left: 0, top: 88, width: 160, height: 36 },
];
assert(
  inferSourceCanvasDropFlow({
    childRects: oneColumnGridRects,
    display: 'grid',
  }).axis === 'vertical',
  'Canvas drop flow should infer a one-column grid from rendered child coordinates',
);
assert(
  resolveSourceCanvasDropInsertion({
    clientX: 80,
    clientY: 46,
    fallbackFlow: { axis: 'horizontal', reverse: false },
    previousRect: oneColumnGridRects[0],
    nextRect: oneColumnGridRects[2],
    targetIndex: 1,
    targetRect: oneColumnGridRects[1],
  }).position === 'before',
  'Canvas drop insertion should resolve the top edge of a vertical grid item as before',
);
assert(
  resolveSourceCanvasDropInsertion({
    clientX: 80,
    clientY: 78,
    fallbackFlow: { axis: 'horizontal', reverse: false },
    previousRect: oneColumnGridRects[0],
    nextRect: oneColumnGridRects[2],
    targetIndex: 1,
    targetRect: oneColumnGridRects[1],
  }).index === 2,
  'Canvas drop insertion should resolve the bottom edge of a vertical grid item as after',
);

const wrappedGridRects = [
  { left: 0, top: 0, width: 80, height: 80 },
  { left: 100, top: 0, width: 80, height: 80 },
  { left: 0, top: 100, width: 80, height: 80 },
  { left: 100, top: 100, width: 80, height: 80 },
];
const wrappedRowStart = resolveSourceCanvasDropInsertion({
  clientX: 40,
  clientY: 102,
  fallbackFlow: { axis: 'horizontal', reverse: false },
  previousRect: wrappedGridRects[1],
  nextRect: wrappedGridRects[3],
  targetIndex: 2,
  targetRect: wrappedGridRects[2],
});
assert(
  wrappedRowStart.axis === 'vertical' &&
    wrappedRowStart.position === 'before' &&
    wrappedRowStart.index === 2,
  'Canvas drop insertion should use the top edge before the first item of a wrapped row',
);
const wrappedRowEnd = resolveSourceCanvasDropInsertion({
  clientX: 78,
  clientY: 140,
  fallbackFlow: { axis: 'horizontal', reverse: false },
  previousRect: wrappedGridRects[1],
  nextRect: wrappedGridRects[3],
  targetIndex: 2,
  targetRect: wrappedGridRects[2],
});
assert(
  wrappedRowEnd.axis === 'horizontal' &&
    wrappedRowEnd.position === 'after' &&
    wrappedRowEnd.index === 3,
  'Canvas drop insertion should use the next source sibling edge within a wrapped row',
);
const gridTopInsertion = resolveSourceCanvasDropInsertion({
  clientX: 140,
  clientY: 102,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
const gridRightInsertion = resolveSourceCanvasDropInsertion({
  clientX: 178,
  clientY: 140,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
const gridBottomInsertion = resolveSourceCanvasDropInsertion({
  clientX: 40,
  clientY: 178,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 2,
  targetRect: wrappedGridRects[2],
});
const gridLeftInsertion = resolveSourceCanvasDropInsertion({
  clientX: 102,
  clientY: 140,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
const gridTopRightCornerInsertion = resolveSourceCanvasDropInsertion({
  clientX: 178,
  clientY: 102,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
const gridTopRightCornerColumnFlowInsertion = resolveSourceCanvasDropInsertion({
  clientX: 178,
  clientY: 102,
  fallbackFlow: { axis: 'vertical', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
const gridRightDominantCornerInsertion = resolveSourceCanvasDropInsertion({
  clientX: 178,
  clientY: 116,
  fallbackFlow: { axis: 'horizontal', grid: true, reverse: false },
  siblingRects: wrappedGridRects.map((rect, index) => ({ index, rect })),
  targetIndex: 3,
  targetRect: wrappedGridRects[3],
});
assert(
  gridTopInsertion.axis === 'vertical' &&
    gridTopInsertion.position === 'before' &&
    gridTopInsertion.index === 3 &&
    gridRightInsertion.axis === 'horizontal' &&
    gridRightInsertion.position === 'after' &&
    gridRightInsertion.index === 4 &&
    gridBottomInsertion.axis === 'vertical' &&
    gridBottomInsertion.position === 'after' &&
    gridBottomInsertion.index === 3 &&
    gridLeftInsertion.axis === 'horizontal' &&
    gridLeftInsertion.position === 'before' &&
    gridLeftInsertion.index === 3 &&
    gridTopRightCornerInsertion.axis === 'vertical' &&
    gridTopRightCornerInsertion.position === 'before' &&
    gridTopRightCornerColumnFlowInsertion.axis === 'horizontal' &&
    gridTopRightCornerColumnFlowInsertion.position === 'after' &&
    gridRightDominantCornerInsertion.axis === 'horizontal' &&
    gridRightDominantCornerInsertion.position === 'after',
  'Canvas grid drop insertion should use four exclusive dominant-axis sectors instead of horizontal and vertical edge bands',
);
assert(
  isSourceCanvasNoopReorder({
    currentIndex: 2,
    siblingCount: 4,
    targetIndex: gridTopInsertion.index,
  }) &&
    !isSourceCanvasNoopReorder({
      currentIndex: 2,
      siblingCount: 4,
      targetIndex: gridRightInsertion.index,
    }),
  'Dragging grid card 3 over card 4 should keep card 4 top as a no-op and use card 4 right or bottom as the one-step forward reorder',
);

const rtlInsertionBefore = resolveSourceCanvasDropInsertion({
  clientX: 198,
  clientY: 20,
  fallbackFlow: { axis: 'horizontal', reverse: true },
  previousRect: { left: 200, top: 0, width: 100, height: 40 },
  nextRect: { left: 0, top: 0, width: 100, height: 40 },
  targetIndex: 1,
  targetRect: { left: 100, top: 0, width: 100, height: 40 },
});
const rtlInsertionAfter = resolveSourceCanvasDropInsertion({
  clientX: 102,
  clientY: 20,
  fallbackFlow: { axis: 'horizontal', reverse: true },
  previousRect: { left: 200, top: 0, width: 100, height: 40 },
  nextRect: { left: 0, top: 0, width: 100, height: 40 },
  targetIndex: 1,
  targetRect: { left: 100, top: 0, width: 100, height: 40 },
});
assert(
  rtlInsertionBefore.position === 'before' &&
    rtlInsertionBefore.index === 1 &&
    rtlInsertionAfter.position === 'after' &&
    rtlInsertionAfter.index === 2,
  'Canvas drop insertion should preserve source order in RTL and reverse visual flows',
);
assert(
  !isSourceCanvasDropRectUsable({ left: 20, top: 20, width: 0, height: 36 }) &&
    resolveSourceCanvasDropInsertion({
      clientX: 20,
      clientY: 20,
      fallbackFlow: { axis: 'vertical', reverse: false },
      targetIndex: 0,
      targetRect: { left: 20, top: 20, width: 0, height: 36 },
    }) === null &&
    inferSourceCanvasDropFlow({
      childRects: [
        { left: 0, top: 0, width: 0, height: 0 },
        { left: 0, top: 40, width: 120, height: 30 },
        { left: 0, top: 80, width: 120, height: 30 },
      ],
      display: 'grid',
    }).axis === 'vertical' &&
    inferSourceCanvasDropFlow({
      childRects: [{ left: 0, top: 0, width: 120, height: 30 }],
      display: 'flex',
      flexDirection: 'row',
    }).axis === 'horizontal',
  'Canvas drop geometry should reject zero-size anchors instead of deriving an ambiguous fallback slot',
);

const sourceSlotContainersRuntime = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    read('src/domain/document/sourceSlotContainers.ts'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
sourceSlotContainersRuntime.clearRegisteredSourceSlotKinds();
sourceSlotContainersRuntime.registerSourceSlotKind('ConversationItem', 'leaf');
assert(
  sourceSlotContainersRuntime.hasRegisteredSourceSlotContract('ConversationItem') &&
    sourceSlotContainersRuntime.getSourceChildrenSlotKind('ConversationItem') === null &&
    !sourceSlotContainersRuntime.componentSupportsChildrenSlot('ConversationItem'),
  'Source slot registry should preserve an inferred leaf contract without treating it as an editable children slot',
);
sourceSlotContainersRuntime.clearRegisteredSourceSlotKinds();
sourceSlotContainersRuntime.registerSourceSlotKind('ScrollArea', 'block');
assert(
  sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('ScrollArea', 'div') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('ScrollArea', 'RecentChatCard') &&
    sourceSlotContainersRuntime.canAddSourceChildIntoParent('ScrollArea', 'RecentChatCard', []),
  'Source-inferred project component slots should override same-name built-in child allowlists',
);
sourceSlotContainersRuntime.clearRegisteredSourceSlotKinds();
sourceSlotContainersRuntime.registerSourceSlotKind('Select', 'block', { preserveKnownChildContract: true });
sourceSlotContainersRuntime.registerSourceSlotKind('SelectGroup', 'block', { preserveKnownChildContract: true });
sourceSlotContainersRuntime.registerSourceSlotKind('SelectItem', 'inline', { preserveKnownChildContract: true });
sourceSlotContainersRuntime.registerSourceSlotKind('MessageScrollerContent', 'leaf', { preserveKnownChildContract: true });
assert(
  !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('Select', 'div') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('Select', 'SelectGroup') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('Select', 'SelectItem') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('Select', 'Button') &&
    !sourceSlotContainersRuntime.canAddSourceChildIntoParent('Select', 'SelectTrigger', ['SelectTrigger']) &&
    sourceSlotContainersRuntime.getSourceChildrenSlotKind('MessageScrollerContent') === 'block' &&
    sourceSlotContainersRuntime.componentSupportsChildrenSlot('MessageScrollerContent') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('MessageScrollerContent', 'MessageScrollerItem'),
  'Registered shadcn component slots should preserve their family allowlist and single-child contract.',
);
assert(
  sourceSlotContainersRuntime.canMoveSourceChildIntoParent('SidebarProvider', 'Sidebar') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('SidebarProvider', 'SidebarInset') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('SidebarProvider', 'Button') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('Sidebar', 'SidebarContent') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('Sidebar', 'Card') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('SidebarMenuItem', 'SidebarMenuButton') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('SidebarMenuItem', 'Button'),
  'Sidebar Add child contracts should expose only the app-shell family at each structural level.',
);
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxStepper', 'block');
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxStepperRail', 'block');
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxStepperItem', 'leaf');
assert(
  !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('AstryxStepper', 'div') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxStepper', 'AstryxStepperRail') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxStepper', 'AstryxStepperItem') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxStepperRail', 'AstryxStepperItem') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxStepperRail', 'Button'),
  'Astryx Stepper should preserve its strict Stepper -> Rail -> Item source structure.',
);
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxMoreMenu', 'block');
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxDropdownMenuItem', 'leaf');
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxDivider', 'leaf');
assert(
  !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('AstryxMoreMenu', 'div') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxMoreMenu', 'AstryxDropdownMenuItem') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxMoreMenu', 'AstryxDivider') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxMoreMenu', 'Button'),
  'AstryxMoreMenu should expose only editable menu items and dividers as source children.',
);
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxLightbox', 'block');
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxThumbnail', 'leaf');
assert(
  !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('AstryxLightbox', 'div') &&
    sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxLightbox', 'AstryxThumbnail') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxLightbox', 'AstryxButton'),
  'AstryxLightbox should expose only asset-editable thumbnails as source children.',
);
for (const [parent, allowedChildren] of [
  ['AstryxChat', ['AstryxChatMessage', 'AstryxChatSystemMessage']],
  ['AstryxCommandPalette', ['AstryxButton', 'AstryxCommandPaletteInput', 'AstryxCommandPaletteFooter']],
  ['AstryxContextMenu', ['AstryxDropdownMenuItem', 'AstryxDivider']],
  ['AstryxDateRangeInput', ['AstryxDateRangePreset']],
  ['AstryxMobileNav', ['AstryxSideNavItem', 'AstryxSideNavSection']],
  ['AstryxNavHeadingMenu', ['AstryxNavHeadingMenuItem', 'AstryxDivider']],
  ['AstryxOutline', ['AstryxOutlineItem']],
  ['AstryxOverflowList', ['AstryxButton']],
  ['AstryxPowerSearch', ['AstryxPowerSearchInput', 'AstryxPowerSearchMenu']],
  ['AstryxPowerSearchMenu', ['AstryxPowerSearchItem']],
  ['AstryxPowerSearchItem', ['AstryxPowerSearchEditor']],
  ['AstryxPowerSearchField', ['AstryxPowerSearchOption', 'AstryxPowerSearchEditor']],
  ['AstryxPowerSearchEditor', [
    'AstryxPowerSearchFieldControl',
    'AstryxPowerSearchOperatorControl',
    'AstryxPowerSearchValueControl',
    'AstryxPowerSearchActions',
  ]],
  ['AstryxPowerSearchFieldControl', ['AstryxPowerSearchFieldOption']],
  ['AstryxPowerSearchOperatorControl', ['AstryxPowerSearchOperatorOption']],
  ['AstryxPowerSearchActions', ['AstryxPowerSearchAction']],
  ['AstryxPowerSearchValueControl', ['AstryxPowerSearchOption']],
  ['AstryxResizable', ['AstryxResizablePanel', 'AstryxResizableContent']],
  ['AstryxTokenizer', ['AstryxTokenizerItem']],
  ['AstryxTreeList', ['AstryxTreeListItem']],
  ['AstryxTypeahead', ['AstryxSearchItem']],
]) {
  sourceSlotContainersRuntime.registerSourceSlotKind(parent, 'block');
  for (const child of allowedChildren) {
    sourceSlotContainersRuntime.registerSourceSlotKind(child, child.endsWith('Section') || child.endsWith('Panel') || child.endsWith('Content') ? 'block' : 'leaf');
  }
  assert(
    !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement(parent, 'div') &&
      allowedChildren.every((child) => sourceSlotContainersRuntime.canMoveSourceChildIntoParent(parent, child)) &&
      !sourceSlotContainersRuntime.canMoveSourceChildIntoParent(parent, 'AstryxUnknownChild'),
    `${parent} should expose only its registered designer-editable child contract.`,
  );
}
sourceSlotContainersRuntime.registerSourceSlotKind('AstryxTreeListItem', 'block');
assert(
  sourceSlotContainersRuntime.canMoveSourceChildIntoParent('AstryxTreeListItem', 'AstryxTreeListItem') &&
    !sourceSlotContainersRuntime.canInsertSourceChildTemplateIntoElement('AstryxTreeListItem', 'div'),
  'AstryxTreeListItem should preserve recursive source-backed tree branches.',
);
sourceSlotContainersRuntime.clearRegisteredSourceSlotKinds();
assert(
  sourceSlotContainersRuntime.canMoveSourceChildIntoParent('ScrollArea', 'ScrollBar') &&
    !sourceSlotContainersRuntime.canMoveSourceChildIntoParent('ScrollArea', 'RecentChatCard'),
  'Built-in ScrollArea should retain its ScrollBar-only contract when no project source contract overrides it',
);

const sourceFilesThatMustStayLibraryNeutral = [
  'src/domain/document/developerExport.ts',
  'src/domain/document/editableTreeDomProjection.ts',
  'src/domain/document/editableTreeSourceWriteback.ts',
  'src/domain/document/libraryScopeRegistry.ts',
  'src/domain/document/sourceImportRouting.ts',
  'src/domain/document/sourceCanvasDropGeometry.ts',
  'src/domain/document/sourceSlotContainers.ts',
  'src/domain/project/workbenchProjectLoader.ts',
  'src/domain/project/workbenchComponentLibraryImport.ts',
  'src/domain/design-system/tokens/importSource.ts',
  'src/domain/project/workbenchProjectRegistryOperations.ts',
  'src/features/workbench-shell/ui/DesignEditor.tsx',
  'src/features/workbench-shell/ui/DesignInspectorPanel.tsx',
  'src/features/workbench-shell/ui/ProjectWorkspace.tsx',
  'src/features/workbench-shell/ui/SourceTreePreview.tsx',
  'src/features/workbench-shell/ui/sourceTreePreviewFrame.css',
  'src/features/workbench-shell/ui/StorybookLibrary.tsx',
  'src/features/workbench-shell/ui/WorkbenchShell.tsx',
  'src/features/workbench-shell/ui/useTokenCollectionCommands.ts',
  'src/workbench-foundations/foundationPreviews.tsx',
  'src/workbench-stories/stories.tsx',
  'src/styles.css',
  'vite.config.ts',
];

for (const file of sourceFilesThatMustStayLibraryNeutral) {
  const source = read(file);
  assert(!/(?:sgds|SGDS|Sgds)/.test(source), `${file} must not hard-code the SGDS library as a Workbench default`);
}

const designEditor = read('src/features/workbench-shell/ui/DesignEditor.tsx');
const workbenchEditorShell = read('src/features/workbench-shell/ui/WorkbenchEditorShell.tsx');
const serialEditQueueSource = read('src/domain/editing/serialEditQueue.ts');
const editableTreeSourceInspector = read('src/domain/document/editableTreeSourceInspector.ts');
const projectClassCatalog = read('src/domain/project/workbenchProjectClassCatalog.ts');
const projectLoaderSource = read('src/domain/project/workbenchProjectLoader.ts');
const projectLocalLibraries = read('src/domain/project/workbenchProjectLocalLibraries.ts');
const projectRegistryOperations = read('src/domain/project/workbenchProjectRegistryOperations.ts');
const figmaPublisher = read('scripts/figma-publisher/publish-library.mjs');
assert(
  projectRegistryOperations.includes('registeredPages: WorkbenchPageRegistry[\'pages\']') &&
    projectRegistryOperations.includes('createWorkbenchPageRegistryEntryFromSourceFile') &&
    projectRegistryOperations.includes('deriveWorkbenchPageNameFromSourceFile') &&
    projectRegistryOperations.includes('getWorkbenchPageRootNodeId') &&
    projectRegistryOperations.includes('registeredPages.length === 0') &&
    projectLoaderSource.includes('register page source files that were added out-of-band') &&
    projectLoaderSource.includes('readWorkbenchDiskImportFiles(WORKBENCH_PAGES_ROOT, { includeContents: false })') &&
    !projectLoaderSource.includes('normalizedPages.pages.length === 0') &&
    projectLoaderSource.includes('registeredPages: []') &&
    projectLoaderSource.includes('pageReconcileResult.registeredPages.length'),
  'Page registry reconciliation should auto-register source files found under src/workbench-pages even when pages.json already contains pages',
);
assert(
  projectLoaderSource.includes('normalizeWorkbenchComponentRegistryEntry') &&
    projectLoaderSource.includes('getTrimmedString(component.name) ?? fallbackName') &&
    projectLoaderSource.includes('getTrimmedString(extensions.importName)') &&
    projectLoaderSource.includes('isPlainRecord(component)'),
  'Component registry loading should recover polluted id/name/sourceFile fields instead of letting one bad entry break all component props',
);
assert(
  projectLocalLibraries.includes('!isShadcnBaseComponentSourceFile(sourceFile, registry)') &&
    projectLocalLibraries.includes('normalized.startsWith(`${SHADCN_BASE_COMPONENTS_ROOT}/`)') &&
    projectLocalLibraries.includes('updatedAt: previousLibrary?.updatedAt ?? now') &&
    projectLocalLibraries.includes('removeUnusedDefaultLocalLibrary(nextRegistry)') &&
    projectLocalLibraries.includes("component.extensions?.libraryId === PROJECT_LOCAL_LIBRARY_ID"),
  'Page story hydration should preserve shadcn-base ownership and keep unchanged library metadata stable instead of rewriting components.json',
);
assert(
  projectLoaderSource.includes('const current = await readWorkbenchSourceFile(path);') &&
    projectLoaderSource.includes('if (current.ok && current.contents === contents) return;'),
  'Token CSS sync should skip identical writes so project snapshot echoes do not invalidate the preview',
);
assert(
  !projectClassCatalog.includes("from 'postcss'") &&
    projectClassCatalog.includes('function collectCssRules(css: string): CollectedCssRule[]'),
  'The browser-side project class catalog should not bundle PostCSS Node filesystem and source-map helpers',
);
assert(
  designEditor.includes("if (getComponentCsfStorySourceFile(component)) return 'CSF story';") &&
    designEditor.includes('const CSF_STORY_METADATA_RETRY_DELAYS_MS = [0, 160, 480] as const;') &&
    designEditor.includes('importWorkbenchCsfStoryMetadataWithRetry') &&
    designEditor.includes('isWorkbenchCsfRuntimeDependencyChangePath(event.path)') &&
    designEditor.includes('setComponentStoryMetadataRetryRevision((revision) => revision + 1)') &&
    designEditor.includes('if (cancelled || !story) return;') &&
    designEditor.includes('componentStoryMetadataRetryRevision,') &&
    designEditor.includes('return `${projectId}:${runtimeRevision}:${component.id}:${component.sourceFile}:') &&
    designEditor.includes("console.warn('[workbench] CSF story metadata load failed:', error);"),
  'Design component picker should label CSF-backed components as story-backed and retry failed metadata after project dependencies become available',
);
assert(
  figmaPublisher.includes("replace(/\\*\\//g, '* /')") &&
    figmaPublisher.includes('/* End ${commentText} generated by scripts/figma-publisher. */') &&
    figmaPublisher.includes('findGeneratedCssEndMarker') &&
    figmaPublisher.includes('findNextGeneratedCssStartMarker') &&
    figmaPublisher.includes('findGeneratedCssSelectorBlockEnd') &&
    figmaPublisher.includes('findCssRuleEnd'),
  'Figma publisher local.css output should escape generated comment text and replace bounded generated CSS blocks without swallowing hand-authored CSS',
);
assert(designEditor.includes('isPresetComponentSourceFile'), 'DesignEditor should use generic preset source routing');
assert(!designEditor.includes('sourceInsert: get'), 'Built-in source insert templates should not be library-specific');
assert(designEditor.includes('const sourcePreviewDocument = previewSourceTreeResult?.tree ?? projectTreeSource.tree ?? null'), 'Design editor preview should prefer freshly parsed source over stale registry editableTree snapshots');
assert(
  designEditor.includes('automatically falling back here remounts stateful pages') &&
    designEditor.includes('const activeRuntimePageProjection = useMemo<RuntimePageProjectionTarget | null>(() => {\n    return null;\n  }, []);'),
  'Design editor should not switch page preview into runtime fallback when source projection is incomplete',
);
assert(
  designEditor.includes('const selectedLayerReadOnly = Boolean(') &&
    designEditor.includes('selectedLayerReadOnly={selectedLayerReadOnly}') &&
    designEditor.includes('onMoveLayer={canEditSourceStructure ? onMoveLayer : undefined}') &&
    designEditor.includes('onStyleDeclarationsChange={canEditSourceFields ? onStyleDeclarationsChange : undefined}'),
  'Design preview should show read-only source selections without wiring canvas edit handlers',
);
assert(
  designEditor.includes('isReadOnlyDesignLayer(layer, layerMetadata)') &&
    designEditor.includes('metadata.selectableNodeId !== layer.id') &&
    designEditor.includes('metadata.hasReadOnlySourceMapAncestor') &&
    designEditor.includes('const canDragLayer = canEditSourceFields && !layerReadOnly && canDragSourceLayer(layer);') &&
    designEditor.includes('const showLayerAddAction = !layerReadOnly && canEditSourceFields') &&
    designEditor.includes('muted={layerReadOnly}') &&
    read('src/features/workbench-shell/ui/WorkbenchSidebarPrimitives.tsx').includes('muted?: boolean') &&
    read('src/styles.css').includes('.wb-design-layer-list .wb-sidebar-row--muted'),
  'Layer tree rows should visibly dim preview-only and read-only data-source nodes while keeping them selectable',
);
assert(
  designEditor.includes('getDesignLayerListWindow') &&
    designEditor.includes('createDesignLayerNodeMetadataMap') &&
    designEditor.includes('layerMetadataById') &&
    designEditor.includes('layerMetadata?.connectedArrayContext') &&
    designEditor.includes('isReadOnlyDesignLayer(layer, layerMetadata)') &&
    designEditor.includes('scheduleLayerListViewportUpdate') &&
    designEditor.includes('DESIGN_LAYER_WINDOW_MIN_ROWS') &&
    designEditor.includes('layerWindow.virtualized') &&
    designEditor.includes('layers.slice(startIndex, endIndex)') &&
    designEditor.includes('listRef={layerListRef}') &&
    designEditor.includes('onScroll={scheduleLayerListViewportUpdate}') &&
    read('src/features/workbench-shell/ui/WorkbenchSidebarPrimitives.tsx').includes('listRef?: Ref<HTMLDivElement>') &&
    read('src/features/workbench-shell/ui/WorkbenchSidebarPrimitives.tsx').includes('onScroll?: UIEventHandler<HTMLDivElement>') &&
    read('src/styles.css').includes('.wb-design-layer-list-window-content'),
  'Design layer list should precompute row metadata and window large source trees so catalog pages do not redo tree walks or rerender every layer row on each selection change',
);
const selectionScopeService = read('src/domain/selection-scope/selectionScopeService.ts');
const sourceNodeCapabilities = read('src/domain/selection-scope/sourceNodeCapabilities.ts');
assert(
  selectionScopeService.includes('export type SelectionEditabilityDiagnostic') &&
    selectionScopeService.includes('editabilityDiagnostic: SelectionEditabilityDiagnostic | null') &&
    selectionScopeService.includes('sourceCapabilities: SourceNodeCapabilities') &&
    selectionScopeService.includes('sourceOwnership: SourceNodeOwnership') &&
    selectionScopeService.includes('sourcePreviewOnly') &&
    selectionScopeService.includes('read-only-data-source') &&
    selectionScopeService.includes('resolveEditableTreeSourceCapabilities(input)') &&
    selectionScopeService.includes('Edit exposed instance props, open the source component') &&
    selectionScopeService.includes('No source-backed edit path') &&
    sourceNodeCapabilities.includes("kind: forwardedSlotBoundary ? 'forwarded-slot-child' : 'authored'") &&
    sourceNodeCapabilities.includes('forwardedSourceChild ? [] : descendantInstanceChain') &&
    sourceNodeCapabilities.includes("ownership.kind === 'authored' || ownership.kind === 'forwarded-slot-child'") &&
    designEditor.includes('editabilityDiagnostic={selectionScope.editabilityDiagnostic}') &&
    designEditor.includes('selectionScope.sourceCapabilities.canEditFields &&\n    !selectedSourceNodeIsPreviewOnly') &&
    designEditor.includes('selectionScope.sourceCapabilities.canEditStructure &&') &&
    designEditor.includes('selectionScope.sourceCapabilities.canInsertChildren') &&
    designEditor.includes('selectionScope.sourceCapabilities.canMove') &&
    designEditor.includes('selectionScope.sourceCapabilities.canPaste') &&
    !designEditor.includes('if (selectionScope.ownerInstanceId)') &&
    designEditor.includes("hasDesignSourceNodeCapability(root, node.id, 'canCopy')"),
  'Selection scope should preserve forwarded slot source ownership, centralize source capabilities, and explain why other selections remain read-only',
);
assert(!designEditor.includes('?? designTargets[0]'), 'Design editor should allow no page/component to be open instead of falling back to the first target');
assert(designEditor.includes("if (previewLoadState.status === 'empty')"), 'Design editor should render an empty preview stage when no source target is open');
assert(
  designEditor.includes("case 'component-instance':\n      return <Diamond size={13} />;") &&
    !designEditor.includes('return <MousePointer2 size={13} />;'),
  'Layer tree component instances should use the diamond icon instead of the cursor icon',
);
const previewControlbarRightIndex = designEditor.indexOf('<div className="wb-design-preview-controlbar-right">');
const previewViewportControlIndex = designEditor.indexOf('wb-design-responsive-preview-control');
const previewModeButtonIndex = designEditor.indexOf('wb-design-preview-mode-button');
assert(
  previewControlbarRightIndex !== -1 &&
    previewViewportControlIndex > previewControlbarRightIndex &&
    previewModeButtonIndex > previewViewportControlIndex &&
    !designEditor.includes('editResponsiveBreakpoint:') &&
    !designEditor.includes('editPageStateMode:') &&
    !designEditor.includes('previewResponsiveBreakpoint') &&
    !designEditor.includes('previewPageStateMode') &&
    !designEditor.includes('wb-design-state-edit-control') &&
    !designEditor.includes('wb-design-responsive-edit-control') &&
    !designEditor.includes('wb-design-preview-actionbar-promote'),
  'Design preview should omit state/breakpoint projection and preserve independent viewport sizing on the right before Modes',
);

const designInspectorPanelSource = read('src/features/workbench-shell/ui/DesignInspectorPanel.tsx');
const editableTreeSourceParserSource = read('src/domain/document/editableTreeSourceParser.ts');
const editableTreeSourceLayerTreeSource = read('src/domain/document/editableTreeSourceLayerTree.ts');
const inspectorTailwindUtilitiesSource = read('src/features/workbench-shell/ui/inspectorTailwindUtilities.ts');
const inspectorPrimitivesSource = read('src/features/workbench-shell/ui/WorkbenchInspectorPrimitives.tsx');
const styles = read('src/styles.css');
assert(
  designInspectorPanelSource.includes(
    "const shouldCollectCurrentPageClassUsage = classPickerOpen && classPickerTab === 'project';",
  ) &&
    designInspectorPanelSource.includes('() => shouldCollectCurrentPageClassUsage') &&
    designInspectorPanelSource.includes(': []'),
  'Design Inspector should defer page-wide class usage traversal until the Project class picker is open.',
);
assert(
  !/\.wb-design-layer-list \.wb-sidebar-row > \.wb-sidebar-row-collapse\s*\{[^}]*position:\s*sticky/s.test(styles) &&
    /\.wb-design-layer-list \.wb-sidebar-row > \.wb-sidebar-row-collapse\s*\{[^}]*margin-right:\s*0/s.test(styles) &&
    /\.wb-design-layer-list \.wb-sidebar-row-main\s*\{[^}]*padding-left:\s*2px/s.test(styles) &&
    !designEditor.includes('--wb-design-layer-mask-left-') &&
    !styles.includes('--wb-design-layer-mask-left-'),
  'Layer tree disclosure controls should scroll with their rows and stay tightly grouped with layer icons',
);
assert(
  !designInspectorPanelSource.includes('title="Advanced"') &&
    !designInspectorPanelSource.includes('key={`advanced:') &&
    designInspectorPanelSource.includes('const registryControls = useMemo('),
  'Design Inspector should keep editing sections directly accessible while memoizing component prop registry controls for selection responsiveness',
);
assert(
  designInspectorPanelSource.includes('function InspectorEditabilityNotice') &&
    designInspectorPanelSource.includes('wb-inspector-editability-notice') &&
    designInspectorPanelSource.includes('diagnostic.action') &&
    styles.includes('.wb-inspector-editability-notice') &&
    styles.includes('.wb-inspector-editability-notice__action'),
  'Design Inspector should show read-only editability guidance in the field list instead of leaving users to infer the red selection ring',
);
assert(
  designInspectorPanelSource.includes('function readPreviewEnvironmentProbe(selectedSourceNodeId: string | null)') &&
    designInspectorPanelSource.includes('PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE') &&
    designInspectorPanelSource.includes('const effectiveScope = selectedScope ?? previewScope;') &&
    !designInspectorPanelSource.includes('frameDocument.querySelectorAll(`[${SOURCE_TOKEN_MODE_ATTRIBUTE}]`)'),
  'Design Inspector environment notices should follow the selected source node instead of unrelated theme scopes elsewhere on the page',
);
assert(
  designInspectorPanelSource.includes("suggestions={control.type === 'text' ? control.suggestions : undefined}") &&
    designInspectorPanelSource.includes('list={suggestions?.length ? suggestionListId : undefined}') &&
    designInspectorPanelSource.includes('<datalist id={suggestionListId}>'),
  'Design Inspector text props should expose story suggestions while preserving the freeform source attribute input',
);
assert(
  designInspectorPanelSource.includes('value={String(selectedOptionIndex)}') &&
    designInspectorPanelSource.includes('selectedOptionIndex < 0 ? (') &&
    designInspectorPanelSource.includes('<option value="-1">{String(value)}</option>') &&
    designInspectorPanelSource.includes('if (optionIndex < 0) return;'),
  'Design Inspector select props should preserve an authored value that is not part of the current preset options.',
);
assert(
  inspectorPrimitivesSource.includes('export function WorkbenchInspectorSectionList') &&
    designInspectorPanelSource.includes('<WorkbenchInspectorSectionList ariaLabel="Inspector fields" density="compact">') &&
    designInspectorPanelSource.includes('<WorkbenchInspectorFieldList ariaLabel="Inline style fields" density="compact">') &&
    /\.wb-inspector-field-list--compact\s*\{[^}]*gap:\s*4px/s.test(styles) &&
    /\.wb-inspector-section-list--compact\s*\{[^}]*gap:\s*12px/s.test(styles),
  'Compact Inspector field rows should use dense spacing without collapsing the larger gap between top-level sections',
);
assert(
  designInspectorPanelSource.includes('function InspectorSourcePatternGuidanceSection') &&
    designInspectorPanelSource.includes('getSourcePatternGuidance') &&
    designInspectorPanelSource.includes('Provider context') &&
    designInspectorPanelSource.includes('Render callback or helper') &&
    designInspectorPanelSource.includes('Render callback prop') &&
    designInspectorPanelSource.includes('Config expression') &&
    designInspectorPanelSource.includes('Opaque config prop') &&
    designInspectorPanelSource.includes('Computed inline style') &&
    designInspectorPanelSource.includes('Literal inline style') &&
    designInspectorPanelSource.includes('Mapped runtime collection') &&
    designInspectorPanelSource.includes('findEditableTreeNodePreviewPath') &&
    styles.includes('.wb-inspector-source-patterns') &&
    styles.includes('.wb-inspector-source-pattern__head'),
  'Binding tab should explain edit routes for provider, callback, config, inline-style, and mapped data patterns',
);
assert(
  editableTreeSourceParserSource.includes("scope: 'collection'") &&
    editableTreeSourceParserSource.includes("jsxName: 'Fragment'") &&
    editableTreeSourceParserSource.includes('label: `Map · ${sourceLabel} · ${sourceItems.length}') &&
    designEditor.includes("if (node?.sourceMapBinding?.scope === 'collection') return 'Map';") &&
    designInspectorPanelSource.includes('const moveItem = (itemIndex: number, offset: -1 | 1) =>') &&
    designInspectorPanelSource.includes('Move item ${itemIndex + 1} up') &&
    designInspectorPanelSource.includes('Move item ${itemIndex + 1} down') &&
    designInspectorPanelSource.includes("if (bindingSelectionKey) setActiveInspectorTab('binding');"),
  'Static maps should project as one wrapperless collection boundary with visible structure and Binding-based row reordering',
);
assert(
  editableTreeSourceParserSource.includes('formatSourceExpressionBoundaryLabel') &&
    sourceTreePreviewSource.includes("sourceExpression ? 'wb-source-visual-expression' : ''") &&
    sourceTreePreviewSource.includes('data-wb-source-expression-kind={sourceExpression?.kind}') &&
    sourceTreePreviewSource.includes('scrollSourceTreePreviewSelectionIntoView(container, renderedRoot, selectedLayerId)') &&
    sourceTreePreviewSource.includes('const previousSelectedLayerIdRef = useRef(selectedLayerId);') &&
    read('src/features/workbench-shell/ui/sourceTreePreviewFrame.css').includes('.wb-source-visual-expression') &&
    designInspectorPanelSource.includes('const bindingSelectionKey = selectedSourceNode && (') &&
    designInspectorPanelSource.includes('Binding or source') &&
    designInspectorPanelSource.indexOf('<InspectorSourceExpressionSection selectedSourceNode={selectedSourceNode} />') <
      designInspectorPanelSource.indexOf('<InspectorDesignStatesSection'),
  'Dynamic source boundaries should stay visually identifiable, focusable from Layers, and routed to selection-specific Binding guidance before page states',
);
assert(
  editableTreeSourceLayerTreeSource.includes('if (node?.sourceMapBinding) return [];') &&
    editableTreeSourceLayerTreeSource.includes('if (node?.sourceMapBinding) return false;') &&
    editableTreeSourceLayerTreeSource.includes("if (node.source.importSource || /^[A-Z]/.test(sourceJsxName)) return false;") &&
    editableTreeSourceLayerTreeSource.includes('if (parentNode.sourceMapBinding) return false;'),
  'Map boundaries and custom components without an explicit slot contract should not advertise child insertion or inside drops',
);
assert(
  designInspectorPanelSource.includes('getTailwindUtilityPickerResults') &&
    designInspectorPanelSource.includes("from './inspectorTailwindUtilities'") &&
    inspectorTailwindUtilitiesSource.includes('createExpandedTailwindUtilitySuggestions') &&
    inspectorTailwindUtilitiesSource.includes('dedupeTailwindUtilitySuggestions') &&
    inspectorTailwindUtilitiesSource.includes('TAILWIND_DEFAULT_UTILITY_CLASS_NAMES') &&
    inspectorTailwindUtilitiesSource.includes('getDefaultTailwindUtilityPickerResults(activeClassNames)') &&
    inspectorTailwindUtilitiesSource.includes("const spacingScale = ['0', 'px', '0.5'") &&
    inspectorTailwindUtilitiesSource.includes('const gridColumnCounts = Array.from({ length: 12 }') &&
    inspectorTailwindUtilitiesSource.includes("'bg-card'") &&
    inspectorTailwindUtilitiesSource.includes("'chart-5'") &&
    inspectorTailwindUtilitiesSource.includes("'h-dvh'") &&
    inspectorTailwindUtilitiesSource.includes("'data-[state=open]:animate-in'") &&
    inspectorTailwindUtilitiesSource.includes("'@md:grid-cols-2'"),
  'Design inspector Tailwind class picker should keep broad utility suggestions for spacing, grid, shadcn tokens, state variants, and container queries',
);
assert(
  designInspectorPanelSource.includes('function ComponentCsvPropControl') &&
    designInspectorPanelSource.includes("control.key === 'dataCsv' || control.key === 'seriesCsv'") &&
    designInspectorPanelSource.includes('getInspectorCsvTableConfig(control, value, sourceProps)') &&
    designInspectorPanelSource.includes('function CombinedChartCsvPropControl') &&
    designInspectorPanelSource.includes('const csvVisibilityProps = { ...effectiveDefaultArgs, ...effectiveSourceProps }') &&
    designInspectorPanelSource.includes('shouldUseCombinedChartCsvControlSet(visibleControls, csvVisibilityProps)') &&
    designInspectorPanelSource.includes("visibleControls.filter((control) => control.key !== 'seriesCsv')") &&
    designInspectorPanelSource.includes('moveInspectorCsvColumnInRows(current, sourceIndex + 1, targetIndex + 1') &&
    designInspectorPanelSource.includes('function InspectorCsvSeriesColumnHeader') &&
    designInspectorPanelSource.includes('function InspectorCsvSeriesColorChip') &&
    designInspectorPanelSource.includes('createInspectorSeriesCsvRow(current)') &&
    designInspectorPanelSource.includes('onCommitBatch(updates)') &&
    designInspectorPanelSource.includes('onSourceComponentPropsChange(updates)') &&
    designInspectorPanelSource.includes('hasLinkedSeriesColumns ? `${Math.max(0, dataColumns.length - 1)} series`') &&
    designInspectorPanelSource.includes('function InspectorCsvCellEditor') &&
    designInspectorPanelSource.includes('INSPECTOR_CSV_COLOR_TOKEN_TYPES') &&
    designInspectorPanelSource.includes('isInspectorCsvColorColumn(control, column)') &&
    designInspectorPanelSource.includes('selectedKey={value}') &&
    designInspectorPanelSource.includes('onSelect={(selection) => onUpdateCell(rowIndex, columnIndex, selection.key)}') &&
    designInspectorPanelSource.includes('serializeInspectorCsvRows(draftRows)') &&
    designInspectorPanelSource.includes('getChartSeriesColorBindings(effectiveSourceProps, effectiveDefaultArgs, visibleControls)') &&
    designInspectorPanelSource.includes('updateChartSeriesCsvColorValue(binding.seriesCsv, binding, normalizedValue)') &&
    styles.includes('.wb-csv-editor-table-wrap') &&
    styles.includes('.wb-csv-editor-table .wb-ui-text-field-frame') &&
    styles.includes('.wb-csv-editor-token-frame .wb-ui-text-field-slot--trailing') &&
    styles.includes('.wb-csv-editor-toolbar__actions .wb-ui-button') &&
    styles.includes('.wb-csv-editor-table__actions') &&
    styles.includes('wb-csv-editor-table__actions-column') &&
    styles.includes('border-left: 1px solid var(--wb-line);') &&
    styles.includes('display: flex;') &&
    styles.includes('.wb-csv-editor-drag-button') &&
    styles.includes('color: var(--wb-text-faint);') &&
    styles.includes('.wb-csv-editor-series-header') &&
    styles.includes('grid-template-columns: 24px minmax(136px, 1fr) 48px 28px;') &&
    styles.includes('.wb-csv-editor-table th.wb-csv-editor-table__series-column') &&
    styles.includes('min-width: 264px;') &&
    styles.includes('.wb-csv-editor-series-color-chip') &&
    styles.includes('.wb-csv-editor-series-color-picker'),
  'Design inspector chart CSV props should open a combined draggable table editor with token pickers for every cell, inline series column headers, and chart series colors from parsed series rows',
);
assert(
  designInspectorPanelSource.includes('getInspectorChartTypeConversion(selectedSourceNode, effectiveSourceProps)') &&
    designInspectorPanelSource.includes('label="Chart type"') &&
    designInspectorPanelSource.includes('getInspectorChartPropNamesWithTokenCompanions') &&
    designInspectorPanelSource.includes("'seriesCsv',\n  'title',") &&
    !designInspectorPanelSource.includes('fallbackProps.seriesCsv') &&
    !designInspectorPanelSource.includes('propOverrides.seriesCsv') &&
    designInspectorPanelSource.includes('onSourceComponentTypeChange(option.name') &&
    designEditor.includes('commitAndPersistSourceInspectorComponentType') &&
    designEditor.includes('function updateDesignInspectorComponentType') &&
    designEditor.includes('function commitSourceInspectorComponentType'),
  'Design inspector chart cards should expose a source-backed chart type conversion action without overwriting chart CSV props',
);
assert(
  designEditor.includes('function updateDesignInspectorComponentProps') &&
    designEditor.includes('function commitSourceInspectorComponentProps') &&
    designEditor.includes('function applySourceComponentPropUpdates') &&
    designEditor.includes("if (propNames.has('dataCsv') && propNames.has('seriesCsv')) return 'Chart data table';") &&
    designEditor.includes('applySourceComponentPropUpdates({') &&
    designEditor.includes('label,') &&
    designEditor.includes('historyController.commit(nextContents'),
  'CSV data table edits should batch dataCsv and seriesCsv into one source history transaction so undo/redo treats Apply as one edit',
);

const sourceSlotContainers = read('src/domain/document/sourceSlotContainers.ts');
const sourceLayerTree = read('src/domain/document/editableTreeSourceLayerTree.ts');
assert(
  sourceSlotContainers.includes('SOURCE_SHADCN_BLOCK_SLOT_CONTAINER_NAMES') &&
    sourceSlotContainers.includes("'CardContent'") &&
    sourceSlotContainers.includes("'CardFooter'") &&
    sourceSlotContainers.includes("'TableCell'") &&
    sourceSlotContainers.includes("'TableHead'"),
  'Shadcn block containers should stay open for designer-authored children even when older registries lack childrenSlotKind metadata',
);
assert(
  sourceSlotContainers.includes('SOURCE_SHADCN_INLINE_SLOT_CONTAINER_NAMES') &&
    sourceSlotContainers.includes("'Badge'") &&
    sourceSlotContainers.includes("'Button'"),
  'Shadcn inline components should stay insertable inside text-flow slots',
);
assert(
  (sourceSlotContainers.match(/\['DropdownMenuTrigger', new Set\(\['Button'\]\)\]/g) ?? []).length >= 2,
  'DropdownMenuTrigger should accept one Button child for the asChild trigger contract',
);
assert(
  sourceLayerTree.includes('function isSourceTextLeafNode') &&
    sourceLayerTree.includes("node.kind === 'text' && node.source?.jsxName === 'text'") &&
    !sourceLayerTree.includes("!jsxName || jsxName === 'text'") &&
    !sourceLayerTree.includes("parentJsxName === 'text'"),
  'Source layer insert rules should not confuse the shadcn Text component with literal source text leaf nodes',
);
assert(
  sourceSlotContainers.includes('export function hasRegisteredSourceSlotContract') &&
    sourceLayerTree.includes('if (hasRegisteredSourceSlotContract(sourceJsxName)) return false;') &&
    read('src/domain/document/editableTreeSourceWriteback.ts').includes('if (hasRegisteredSourceSlotContract(sourceJsxName)) return false;'),
  'Registered leaf components should not fall back to explicit unknown children containers in layer targeting or source writeback',
);

const storyRegistry = read('src/workbench-stories/stories.tsx');
assert(storyRegistry.includes('const builtInStories: WorkbenchStory[] = []'), 'Built-in story registry should start empty and be filled by imported libraries');

const storybookLibrary = read('src/features/workbench-shell/ui/StorybookLibrary.tsx');
assert(storybookLibrary.includes("useState('src/libraries/local/components')"), 'Library import dialog should default to a local generic library path');
assert(storybookLibrary.includes('createPortal') && storybookLibrary.includes('syncSourceTreePreviewFrameHead'), 'Storybook runtime previews should render through the isolated preview iframe head boundary');
assert(storybookLibrary.includes('syncSourceTreePreviewFrameTokenVariables(previewDocument, tokenVariables)'), 'Storybook runtime previews should push live token variables into the isolated iframe document');
assert(storybookLibrary.includes('data-workbench-preview-root="true"'), 'Storybook runtime previews should mark their mounted component subtree as an allowed project portal boundary');
assert(
  storybookLibrary.includes('function getStoryControlCandidates') &&
    storybookLibrary.includes('function getStoryControlType') &&
    storybookLibrary.includes('const control = candidate.control') &&
    storybookLibrary.includes("if (typeof control === 'string' && control.trim()) return control.trim();"),
  'Storybook metadata should normalize legacy control fields such as control: icon without preserving custom asset-manager fields in component props',
);
assert(
  storybookLibrary.includes('const activeComponentCsfStorySourceFile = activeComponent ? getComponentCsfStorySourceFile(activeComponent) : null') &&
    storybookLibrary.includes('const activeComponentRuntimeExportName = activeComponent ? getComponentRuntimeExportName(activeComponent) : null') &&
    !storybookLibrary.includes('activeComponent?.extensions,\n    propRegistryRevision'),
  'Storybook runtime imports should depend on stable component source/export fields instead of the extensions object identity',
);

assert(styles.includes('.wb-storybook-runtime-stage') && styles.includes('position: relative') && styles.includes('overflow: hidden'), 'Storybook runtime stage should contain library modal overlays');
assert(styles.includes('.wb-storybook-runtime-preview-frame') && styles.includes('body.wb-host-pointer-gesture .wb-storybook-runtime-preview-frame'), 'Storybook runtime iframe should share preview sizing and host pointer gesture handling');
assert(!/\.wb-inspector-(?:source-input|source-textarea|style-value-input)--tokenized\s*\{[^}]*box-shadow/s.test(styles), 'Tokenized inspector values should not use the blue override outline');

const sourceTreePreview = read('src/features/workbench-shell/ui/SourceTreePreview.tsx');
const previewLayerService = read('src/domain/preview/previewLayerService.ts');
const editableTreeSourceWriteback = read('src/domain/document/editableTreeSourceWriteback.ts');
assert(
  editableTreeSourceParserSource.includes('let semanticChildIndex = 0;') &&
    editableTreeSourceParserSource.includes('isPreservedSourceWhitespaceText(text, parentJsxName)') &&
    editableTreeSourceParserSource.includes('whitespace: true') &&
    /function isEditableJsxText\([^)]*\)[^{]*\{[^}]*return Boolean\(text\.trim\(\)\);/s.test(editableTreeSourceParserSource) &&
    /function isEditableJsxText\([^)]*\)[^{]*\{[^}]*return Boolean\(text\.trim\(\)\);/s.test(editableTreeSourceWriteback) &&
    editableTreeSourceLayerTreeSource.includes("child.source?.whitespace !== true") &&
    previewLayerService.includes("node.source?.whitespace !== true") &&
    sourceTreePreview.includes('if (isSourceWhitespaceTextLeaf(node)) return resolvedText;') &&
    sourceTreePreview.includes('if (!context.selectable || isSourceWhitespaceTextLeaf(node)) return text;'),
  'Inline JSX whitespace should remain renderable without becoming an editable Text layer or shifting semantic source paths',
);
assert(
  serialEditQueueSource.includes('await beforeOperation?.();') &&
    designEditor.includes('sourceInspectorEditPreflightRef.current = ensureSourceInspectorEditUsesLatestDiskContents;') &&
    designEditor.includes('const currentDiskContents = await readWorkbenchSourceFile(subject.sourceFile);') &&
    designEditor.includes('areSourceContentsEqual(currentDiskContents.contents, transaction.before)') &&
    designEditor.includes('Skipped stale edit for ${transaction.label}'),
  'Source mutations should rebase from disk before editing and reject a stale write if the file changes during the mutation',
);
const sourceTreePreviewCanvasDropCandidateSource = sourceTreePreview.slice(
  sourceTreePreview.indexOf('function resolveSourceTreePreviewCanvasDropCandidate('),
  sourceTreePreview.indexOf('function resolveSourceTreePreviewAncestorInnerEdgeDropTarget('),
);
assert(
  sourceTreePreview.includes('function getSourceTreePreviewVirtualBoundaryRect(') &&
    sourceTreePreview.includes("node?.sourceMapBinding?.scope !== 'collection'") &&
    sourceTreePreview.includes('const virtualBoundaryRect = root') &&
    sourceTreePreview.includes("if (node.sourceMapBinding?.scope === 'collection')") &&
    sourceTreePreview.includes("if (node.source?.jsxName === 'Fragment')") &&
    sourceTreePreview.includes('return <>{guardedNodeContent}</>;'),
  'Wrapperless map collection selections should draw one virtual union boundary around their rendered items',
);
assert(
  sourceTreePreview.includes('function getSourceTreePreviewComponentNodeProps(') &&
    sourceTreePreview.includes('getSourceTreePreviewProjectComponentProps(') &&
    (sourceTreePreview.match(/typeof event\.stopPropagation !== 'function'/g) ?? []).length >= 6 &&
  sourceTreePreviewRuntimeProps.includes('ref: _editorInstrumentationRef') &&
    sourceTreePreviewRuntimeProps.includes('onClick: _editorClick') &&
    sourceTreePreviewRuntimeProps.includes('onPointerDownCapture: _editorPointerDownCapture') &&
    sourceTreePreviewRuntimeProps.includes('role: _editorRole') &&
    sourceTreePreviewRuntimeProps.includes('tabIndex: _editorTabIndex') &&
    sourceTreePreviewRuntimeProps.includes('SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX') &&
    sourceTreePreviewRuntimeProps.includes('mergeSourceTreePreviewProjectComponentProps') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeRootNodeId(element.className)') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeRootClassName(layerId)') &&
    sourceTreePreview.includes('? getSourceTreePreviewComponentNodeProps(nodeElementProps)'),
  'SourceTreePreview should preserve component-owned refs while identifying real runtime roots through merged neutral class markers',
);
const sourceTreePreviewFrameCss = read('src/features/workbench-shell/ui/sourceTreePreviewFrame.css');
const sourceTreePreviewTailwindRuntime = read('src/features/workbench-shell/ui/sourceTreePreviewTailwindRuntime.ts');
const sourceTreePreviewTailwindRuntimeModule = await import(
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(
    sourceTreePreviewTailwindRuntime,
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText).toString('base64')}`
);
const pagePreviewTailwindCssRuntime = read('src/page-preview.tsx');
const projectWorkspaceTailwindCssRuntime = read('src/features/workbench-shell/ui/ProjectWorkspace.tsx');
const workbenchHostTransport = read('src/domain/project/workbenchHostTransport.ts');
assert(
  sourceTreePreviewTailwindRuntime.includes('TAILWIND_CLASS_EFFECTIVENESS_RULE_BUDGET_MS') &&
    sourceTreePreviewTailwindRuntime.includes('TAILWIND_CLASS_EFFECTIVENESS_MAX_CLASS_TOKENS') &&
    sourceTreePreviewTailwindRuntime.includes('throwTailwindClassRuleBudgetExceeded()'),
  'Selected-root Tailwind rule extraction should stop on bounded time and input limits.',
);
assert(
  sourceTreePreviewTailwindRuntime.includes("if (options.mode && options.mode !== 'fallback') return '';") &&
    sourceTreePreview.includes("{ layerName: null, mode: tailwindCssMode }") &&
    sourceTreePreview.includes("tailwindCssMode === 'fallback'") &&
    pagePreviewTailwindCssRuntime.includes('mode: pagePreviewTailwindCssMode') &&
    projectWorkspaceTailwindCssRuntime.includes("return getConfiguredProjectTailwindCompiledCssPath(config) ? 'compiled' : 'fallback'"),
  'Compiled project Tailwind CSS should be exclusive, while Workbench-generated utilities stay isolated to explicit fallback mode',
);
assert(
  sourceTreePreview.includes("if (tailwindCssMode !== 'fallback') return null;") &&
    sourceTreePreview.includes('...projectStylesheetNodes,') &&
    sourceTreePreview.includes('...(tailwindRuntimeStyle ? [tailwindRuntimeStyle] : [])') &&
    sourceTreePreview.includes('...(tailwindFallbackStyle ? [tailwindFallbackStyle] : [])'),
  'Source preview should not inject fallback or generated Tailwind CSS when compiled project CSS is authoritative',
);
const {
  getSourceTreePreviewTailwindRuntimeCssForClassNames,
} = sourceTreePreviewTailwindRuntimeModule;
const fallbackUtilityCoverageCss = getSourceTreePreviewTailwindRuntimeCssForClassNames(
  ['absolute', 'overflow-hidden', 'w-[60vw]'],
  {
    layerName: null,
    mode: 'fallback',
  },
);
assert(
  fallbackUtilityCoverageCss.includes('{position: absolute;}') &&
    fallbackUtilityCoverageCss.includes('{overflow: hidden;}') &&
    fallbackUtilityCoverageCss.includes('{width: 60vw;}'),
  'Explicit Tailwind fallback mode should retain broad source-class utility coverage',
);
const compiledUtilityCoverageCss = getSourceTreePreviewTailwindRuntimeCssForClassNames(
  ['absolute', 'overflow-hidden', 'w-[60vw]'],
  { layerName: null, mode: 'compiled' },
);
const disabledUtilityCoverageCss = getSourceTreePreviewTailwindRuntimeCssForClassNames(
  ['absolute', 'overflow-hidden', 'w-[60vw]'],
  { layerName: null, mode: 'disabled' },
);
assert(
  compiledUtilityCoverageCss === '' && disabledUtilityCoverageCss === '',
  'Compiled and disabled Tailwind modes must never mix Workbench-generated utility CSS into the preview',
);
const objectPositionRuntimeCss = getSourceTreePreviewTailwindRuntimeCssForClassNames(
  ['object-center', 'object-right-bottom', 'object-[10%_34%]'],
  { layerName: null, mode: 'fallback' },
);
assert(
  objectPositionRuntimeCss.includes('{object-position: center;}') &&
    objectPositionRuntimeCss.includes('{object-position: right bottom;}') &&
    objectPositionRuntimeCss.includes('{object-position: 10% 34%;}'),
  'Preview Tailwind runtime should support named and arbitrary object-position utilities used by image-heavy project pages',
);
assert(
    pagePreviewTailwindCssRuntime.includes("const PAGE_PREVIEW_BUNDLED_PROJECT_CSS_STYLE_ATTR = 'data-workbench-preview-css'") &&
    pagePreviewTailwindCssRuntime.includes('getPagePreviewProjectCssStyleElements()') &&
    pagePreviewTailwindCssRuntime.includes('appendPagePreviewModuleCacheKey(cssModuleUrl, refreshKey)') &&
    pagePreviewTailwindCssRuntime.includes('tailwindCssMode: manifest.tailwindCssMode') &&
    pagePreviewTailwindCssRuntime.includes('syncPagePreviewTailwindFallbackStyle(pagePreviewTailwindCssMode)'),
  'Browser preview should receive an explicit Tailwind CSS mode and keep fallback CSS out of compiled project previews',
);
assert(
  workbenchHostTransport.includes('export function subscribeWorkbenchProjectChangeEvents') &&
    workbenchHostTransport.includes('export function notifyWorkbenchProjectChange') &&
    workbenchHostTransport.includes('localWorkbenchProjectChangeListeners.add(emit)') &&
    workbenchHostTransport.includes("hot?.on(PROJECT_PREVIEW_DATA_CHANGED_EVENT, handleViteChange)") &&
    workbenchHostTransport.includes("source: 'host'") &&
    workbenchHostTransport.includes("source: 'vite'"),
  'Project source refresh should unify Electron host events, Vite custom change events, and install-poll recovery behind one subscription boundary',
);
assert(
  sourceTreePreview.includes('subscribeWorkbenchProjectChangeEvents((event) =>') &&
    sourceTreePreview.includes('isSourceTreePreviewProjectRuntimeSourceChange(event.path, activeSourceFile)') &&
    sourceTreePreviewRuntimeProps.includes("part === 'node_modules' || part === 'dist' || part === 'build'"),
  'Design runtime components should preserve identity for active page prop writes while rebuilding for transitive component source changes',
);
assert(
  sourceTreePreview.includes('const runtimeModule = await import(/* @vite-ignore */ manifest.moduleUrl)') &&
    !sourceTreePreview.includes('wbRuntimeBundle=') &&
    sourceTreePreview.includes('areProjectRuntimeComponentsEqual(current, nextComponents)') &&
    sourceTreePreview.includes('? current\n          : nextComponents'),
  'Content-identical runtime bundle refreshes should preserve component identity instead of remounting stateful preview subtrees',
);
assert(
  designEditor.includes('const unsubscribeProjectChanges = subscribeWorkbenchProjectChangeEvents((event) =>') &&
    designEditor.includes('void refreshActiveSourceFileFromDisk();') &&
    designEditor.includes('unsubscribeProjectChanges();'),
  'Design source trees should refresh from disk when the active page source changes outside the editor',
);
assert(
  pagePreviewTailwindCssRuntime.includes('subscribeWorkbenchProjectChangeEvents((event) =>') &&
    pagePreviewTailwindCssRuntime.includes('if (isPagePreviewSourceDataPath(event.path))') &&
    pagePreviewTailwindCssRuntime.includes('void refreshSourceModule();') &&
    pagePreviewTailwindCssRuntime.includes('sourceRefreshPending = true;') &&
    !pagePreviewTailwindCssRuntime.includes('window.location.reload()'),
  'Page preview should refresh source modules in place without blanking the browser preview for a full-page reload',
);
const previewSelectionService = read('src/domain/preview/previewSelectionService.ts');
const editableTreeDomProjection = read('src/domain/document/editableTreeDomProjection.ts');
const previewWheelGesture = read('src/domain/preview/previewWheelGesture.ts');
const pagePreview = read('src/page-preview.tsx');
assert(
  pagePreview.includes("if (window.location.href.endsWith('#'))") &&
    pagePreview.includes("window.history.scrollRestoration = 'manual';") &&
    pagePreview.includes('resetPagePreviewInitialScroll(container);'),
  'Standalone page preview should discard empty fragments and reset restored scroll positions on reload',
);
assert(
  previewWheelGesture.includes('function handlePreviewSnapWheelGesture({') &&
    previewWheelGesture.includes('function isPreviewWheelOwnedByScrollTarget(') &&
    previewWheelGesture.includes('if (state.handled) return true;') &&
    previewWheelGesture.includes('scrollTarget.scrollBy({') &&
    sourceTreePreview.includes('if (isPreviewWheelOwnedByScrollTarget(event, scrollTarget)) return;') &&
    pagePreview.includes('if (isPreviewWheelOwnedByScrollTarget(event, scrollTarget)) return;') &&
    sourceTreePreview.includes('states: snapWheelGestureStates,') &&
    pagePreview.includes('states: snapWheelGestureStates,'),
  'Design canvas and standalone page preview should coalesce CSS snap scrolling into one advance per physical wheel gesture',
);
assert(sourceTreePreview.includes('return props;'), 'SourceTreePreview should pass component props through without preset-specific overrides');
assert(
  sourceTreePreview.includes('sourceFile: normalizeProjectSourceFileReference(sourceFile) || sourceFile,'),
  'SourceTreePreview runtime imports should resolve stale absolute source paths against the active project root',
);
assert(
  sourceTreePreview.includes('selectedLayerReadOnly = false') &&
    sourceTreePreview.includes("selectedLayerReadOnly || isEditableTreeSourcePreviewOnlyNode(root, selectedLayerId) ? 'source-preview' : 'selection'") &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-selection-ring--source-preview') &&
    sourceTreePreviewFrameCss.includes('var(--wb-danger)'),
  'SourceTreePreview should reuse the red source-preview selection ring for read-only selected layers',
);
assert(
  sourceTreePreview.includes("rect.root ? 'wb-source-visual-selection-ring--root' : ''") &&
    sourceTreePreview.includes('if (layerId === root.id) return [{ layerId, primaryLayerId: layerId }];') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-selection-ring--root') &&
    styles.includes('.wb-design-viewport-frame--root-selected:not(.wb-design-viewport-frame--full) .wb-source-visual-selection-ring'),
  'SourceTreePreview should keep the root selection ring visible inside full-screen previews',
);
assert(
  sourceTreePreview.includes("if (event.key === 'ArrowUp') return { kind: 'reorder', offset: -1 };") &&
    sourceTreePreview.includes("if (event.key === 'ArrowDown') return { kind: 'reorder', offset: 1 };") &&
    sourceTreePreview.includes("if (event.key === 'ArrowLeft') return { kind: 'outdent' };") &&
    sourceTreePreview.includes("if (event.key === 'ArrowRight') return { kind: 'indent' };"),
  'SourceTreePreview should support the same Alt+Arrow keyboard move commands as the host design editor',
);
assert(
  designEditor.includes('resolveDesignPreviewAdditiveSelectionTarget(') &&
    designEditor.includes('if (additive && !additiveTarget) return previousSelection;') &&
    designEditor.includes('additive ? drillPath : resolution.drillPath') &&
    designEditor.includes('previousSelectedIds: currentSelectedIds') &&
    designEditor.includes('selectedNodeId: clickedNode.id') &&
    !designEditor.includes('resolveDesignPreviewNodeAtSiblingScope(') &&
    !designEditor.includes('getDesignPreviewCommonAncestorLength(') &&
    designEditor.includes('selectionBaseIds ?? getDesignLayerIdsFromSelection(previousSelection)') &&
    designEditor.includes('const nextSelectedIds = new Set(previousSelectedIds);') &&
    designEditor.includes('containsEditableTreeNode(previousNode, selectedNode.id)') &&
    designEditor.includes('containsEditableTreeNode(selectedNode, previousNode.id)'),
  'Design Editor additive selection should preserve exact clicked nodes across parents while removing only redundant ancestor-descendant pairs',
);
assert(
  sourceTreePreview.includes("isSourceTreePreviewShortcutKey(event, 'i', 'KeyI') && shortcuts.onInsertChild") &&
    sourceTreePreview.includes('shortcuts.onInsertChild();') &&
    sourceTreePreview.includes("if (key === 'c' && shortcuts.onCopySelection)") &&
    sourceTreePreview.includes("if (key === 'x' && shortcuts.onCutSelection)") &&
    sourceTreePreview.includes("if (key === 'v' && shortcuts.onPasteNode)") &&
    sourceTreePreview.includes("if (key === 'd' && shortcuts.onDuplicateSelection)"),
  'SourceTreePreview should handle insert, copy, cut, paste, and duplicate shortcuts when canvas focus is inside the preview surface',
);
assert(
  sourceTreePreview.includes('const selectionOwnRectCandidates = getSourceTreePreviewPointHitCandidates(') &&
    sourceTreePreview.includes('selectionOwnRectCandidates.length > 0') &&
    sourceTreePreview.includes('getSourceTreePreviewOwnHitRects') &&
    sourceTreePreview.includes('function isSourceTreePreviewAdditiveSelectionEvent') &&
    sourceTreePreview.includes('return event.shiftKey;') &&
    sourceTreePreview.includes('const smartDeep = event.metaKey || event.ctrlKey;') &&
    sourceTreePreview.includes("  'label',") &&
    sourceTreePreview.includes('getSourceTreePreviewModifierSelectionMode(event)') &&
    sourceTreePreview.includes('function getSourceTreePreviewModifierSelectionMode(') &&
    sourceTreePreview.includes('modifierPressed = event.metaKey || event.ctrlKey,') &&
    sourceTreePreview.includes("if (!modifierPressed) return 'direct';") &&
    sourceTreePreview.includes("return 'smart-deep';") &&
    sourceTreePreview.includes('const pointIsAuthoredDescendant = Boolean(') &&
    sourceTreePreview.includes('getSourceTreePreviewNodeSubtreeIds(targetRuntimeOwnerNode).has(pointNode.id)') &&
    sourceTreePreview.includes("!element.classList.contains('wb-source-visual-text')") &&
    sourceTreePreview.includes('normalization: pointNormalization,') &&
    sourceTreePreview.includes("if (mode === 'deep' || mode === 'exact') return element;") &&
    sourceTreePreview.includes("if (mode !== 'direct' && mode !== 'exact') return null;") &&
    sourceTreePreview.includes('const controlledRuntimeOwnerNodeId = controlledRuntimeOwnerNode') &&
    sourceTreePreview.includes('if (controlledRuntimeOwnerNodeId) return controlledRuntimeOwnerNodeId;') &&
    sourceTreePreview.includes(
      'const pointerLayerId = smartDeep || additive\n' +
      '      ? resolveSourceTreePreviewCommandHoverLayerId(',
    ) &&
    sourceTreePreview.includes('if ((smartDeep || additive) && pointerLayerId && pointerNode) {') &&
    sourceTreePreview.includes('getSourceTreePreviewModifierSelectionMode(event, smartDeep),\n        additive,') &&
    !sourceTreePreview.includes(
      'event.ctrlKey ||\n      commandHoverModifierPressedRef.current',
    ) &&
    sourceTreePreview.includes('!additive &&\n      !smartDeep') &&
    !sourceTreePreview.includes('projectSourceTreePreviewFollowupOverlayToLayer') &&
    sourceTreePreview.includes('const bridgeRuntimeClickToHostDocument = (event: MouseEvent) => {') &&
    sourceTreePreview.includes('hostDocument.dispatchEvent(new hostWindow.MouseEvent') &&
    sourceTreePreview.includes(
      "selectLayerFromClick(layerId, 'exact', false, true);",
    ) &&
    sourceTreePreview.includes('if (!preserveFocusedRuntimeControl) {') &&
    sourceTreePreview.includes('getSourceTreePreviewActiveRuntimeFocusTarget(container)') &&
    sourceTreePreview.includes(
      "// Prevent the browser's native popover light-dismiss and the trigger's",
    ) &&
    sourceTreePreview.includes(
      'const focusedRuntimeTarget = getSourceTreePreviewActiveRuntimeFocusTarget(container);',
    ) &&
    sourceTreePreview.includes(
      "// interpreting that same click as light-dismiss; Option/Alt retains the",
    ) &&
    sourceTreePreview.includes(
      'if (sourceTreePreviewHandledSelectionEvents.has(event)) return;',
    ) &&
    sourceTreePreview.includes(
      '!portalTarget &&\n' +
      '        !runtimeInteractionTarget &&\n' +
      '        container.contains(target) &&\n' +
      '        focusedRuntimeTarget',
    ) &&
    sourceTreePreview.includes(
      'restoreSourceTreePreviewRuntimeFocusAfterEditorClick(\n' +
      '          container,\n' +
      '          focusedRuntimeTarget,',
    ) &&
    sourceTreePreview.includes(
      'requestsSourceTreePreviewExactRuntimeSelection(target, container)\n' +
      "              ? 'exact'\n" +
      "              : 'direct',",
    ) &&
    sourceTreePreview.includes(
      'function getSourceTreePreviewActiveRuntimeFocusTarget(',
    ) &&
    sourceTreePreview.includes(
      'if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) {\n' +
      '          // Capture has already assigned this click to the runtime control.',
    ) &&
    sourceTreePreview.includes('const pendingRuntimeActivationGestureRef = useRef<{') &&
    sourceTreePreview.includes('const latchRuntimeActivationGesture = useCallback((') &&
    sourceTreePreview.includes(
      'const interactionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(\n' +
      '      target,\n' +
      '      container,\n' +
      '    );',
    ) &&
    sourceTreePreview.includes(
      "runtimeInteractionTarget.dispatchEvent(new RuntimeMouseEvent('click', {",
    ) &&
    sourceTreePreview.includes('altKey: true,') &&
    sourceTreePreview.includes('const isRuntimeActivationGesture = useCallback((') &&
    sourceTreePreview.includes('if (latchRuntimeActivationGesture(event, event.currentTarget)) return;') &&
    sourceTreePreview.includes('if (isRuntimeActivationGesture(event, eventTarget)) return;') &&
    sourceTreePreview.includes(
      'target\n' +
      '    // containment is not a reliable ownership boundary across portals',
    ) &&
    sourceTreePreview.includes('const portalRoot = getSourceTreePreviewPortalRoot(container);') &&
    sourceTreePreview.includes('Boolean(portalRoot?.contains(element))') &&
    sourceTreePreview.includes('// Component libraries can subscribe to document pointerdown before') &&
    sourceTreePreview.includes('event.stopImmediatePropagation();') &&
    sourceTreePreview.includes('ownerWindow?.setTimeout(clearPendingRuntimeActivationGesture, 0);') &&
    sourceTreePreview.includes('const runtimeActivation = isRuntimeActivationGesture(event, target);') &&
    !sourceTreePreview.includes('|| !nativeEvent.isTrusted') &&
    read('src/features/workbench-shell/ui/WorkbenchSidebarPrimitives.tsx').includes(
      'const nativeTarget = event.nativeEvent.composedPath?.()[0] ?? event.target;',
    ) &&
    sourceTreePreview.includes("if (delegatedNodeId) {\n          event.stopPropagation();\n          sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);") &&
    !sourceTreePreview.includes('event.metaKey || event.ctrlKey || additive'),
  'SourceTreePreview canvas selection should keep Shift additive, resolve authored children inside parent div hit areas, and use smart-deep Cmd/Ctrl selection from the deepest rendered source boundary',
);
assert(
  pagePreview.includes("mode: 'deep' | 'direct' | 'exact' | 'smart-deep';") &&
    pagePreview.includes("const mode = event.metaKey || event.ctrlKey\n      ? 'smart-deep'\n      : 'direct';") &&
    designEditor.includes("const mode = event.metaKey || event.ctrlKey\n          ? 'smart-deep'\n          : 'direct';") &&
    designEditor.includes('findEditableTreeNodeInPreviewTree(tree.root, layerId)') &&
    editableTreeDomProjection.includes("if (mode === 'deep' || mode === 'exact') return element;"),
  'Runtime story and page previews should use the same smart-deep Command-click selection contract',
);
assert(
  sourceTreePreview.includes("ownerDocument.addEventListener('beforetoggle', handleRuntimeSurfaceBeforeToggle, true)") &&
    sourceTreePreview.includes('getSourceTreePreviewOpenControlledSurfaceTriggers(container)') &&
    sourceTreePreview.includes('captureSourceTreePreviewOpenRuntimeSurfaceRestoreTargets(') &&
    sourceTreePreview.includes('restoreSourceTreePreviewRuntimeSurfaces(') &&
    sourceTreePreview.includes('const lockedRuntimeSurfaceParentId = draggedRuntimeSurfaceHost') &&
    sourceTreePreview.includes('const preserveRuntimeFocusOnActive = Boolean(') &&
    sourceTreePreview.includes('isSourceTreePreviewPortalPointerTarget(eventTarget, container)') &&
    sourceTreePreview.includes('if (!preserveRuntimeFocusOnActive) {') &&
    sourceTreePreview.includes('lockedParentId: lockedRuntimeSurfaceParentId,') &&
    sourceTreePreview.includes('(options.lockedParentId && target.parentId !== options.lockedParentId)') &&
    sourceTreePreview.includes('hasActionableCandidate || lockedRuntimeSurfaceParentId') &&
    sourceTreePreview.includes('applySourceTreePreviewPortalReorderProjection({') &&
    sourceTreePreview.includes('project the same destination through position-only sibling transforms.') &&
    sourceTreePreview.includes(
      'if (!lockedRuntimeSurfaceParentId && !projectedTarget.gridSlots) {',
    ) &&
    sourceTreePreview.includes('if (isReorder) return null;') &&
    !sourceTreePreview.includes('showReorderIndicator?: boolean;'),
  'SourceTreePreview should preserve open runtime surfaces during editor gestures, lock portal drags to their source parent, and use the normal interpolated reorder preview inside portals',
);
assert(
    sourceTreePreview.includes('!selectedSubtreeNodeIds.has(pointerLayerId)') &&
    sourceTreePreview.includes(
      '!insideLayer &&\n      !resizeEdge &&\n      pointerLayerId &&',
    ) &&
    sourceTreePreview.includes('if (onOtherLayer && !insideLayer) {') &&
    !sourceTreePreview.includes(
      '!selectedSubtreeNodeIds.has(pointerLayerId) ||\n        pointerDescendantOwnsDrag',
    ) &&
    sourceTreePreview.includes('function shouldSourceTreePreviewPointerDescendantOwnDrag({') &&
    sourceTreePreview.includes("pointerNode.kind === 'text'") &&
    sourceTreePreview.includes("pointerNode.sourcePreviewOrigin === 'forwarded-source-child'") &&
    sourceTreePreview.includes('isEditableTreeSourcePreviewOnlyNode(root, pointerNode.id)') &&
    sourceTreePreview.includes('pointerNode.source?.sourceFile === selectedSourceFile') &&
    sourceTreePreview.includes('function isSourceTreePreviewPortalPointerTarget(') &&
    sourceTreePreview.includes(
      'isSourceTreePreviewPortalPointerTarget(event.target, container) &&\n' +
      '      !overlayItemLayerId',
    ) &&
    sourceTreePreview.includes('if (overlayItemLayerId && overlayItemNode) {') &&
    sourceTreePreview.includes(
      'layerId: overlayItemLayerId,\n' +
      '        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,\n' +
      '        preserveClickUntilActive: true,',
    ) &&
    sourceTreePreview.includes(
      '// Let the React canvas recognizer observe this same press.',
    ) &&
    sourceTreePreview.includes(
      'const overlayItemLayerId = resolveSourceTreePreviewRuntimeOverlayItemLayerId(\n      target,\n      container,\n      root,\n    );',
    ) &&
    sourceTreePreview.includes('if (portalRuntimeTarget && runtimeActivation && !smartDeep && !additive) {') &&
    sourceTreePreview.indexOf('const pointerDescendantOwnsDrag = selectedNode && pointerNode') <
      sourceTreePreview.indexOf('shouldSourceTreePreviewRuntimeOwnPointerGesture(event, container, selectedNode)') &&
    sourceTreePreview.includes('!pointerDescendantOwnsDrag &&') &&
    sourceTreePreview.includes('preserveClickUntilActive = false') &&
    sourceTreePreview.includes('if (!preserveClickUntilActive) {') &&
    sourceTreePreview.includes('deferPointerCaptureUntilActive: preserveClickUntilActive') &&
    sourceTreePreview.includes('Option/Alt is the explicit') &&
    sourceTreePreview.includes('if (isSourceTreePreviewRuntimeActivationEvent(event)) return;') &&
    sourceTreePreview.includes('const runtimeInteractionLayerId = runtimeInteractionTarget') &&
    sourceTreePreview.includes(
      'resolveSourceTreePreviewClosestRuntimeOwnerNodeId(\n' +
      '            runtimeInteractionTarget,\n' +
      '            container,\n' +
      '          )',
    ) &&
    sourceTreePreview.includes(
      'requestsSourceTreePreviewExactRuntimeSelection(eventTarget, container)\n' +
      "            ? 'exact'\n" +
      "            : 'direct',",
    ) &&
    sourceTreePreview.includes('preserveClickUntilActive: true') &&
    sourceTreePreview.includes('deferPointerCaptureUntilActive = false') &&
    sourceTreePreview.includes('const capturePointer = () => {') &&
    sourceTreePreview.includes('if (!deferPointerCaptureUntilActive) {') &&
    sourceTreePreview.includes('active = true;\n      capturePointer();') &&
    sourceTreePreview.includes(
      'resolveSourceTreePreviewRuntimeInteractionTarget(eventTarget, container)',
    ) &&
    sourceTreePreview.includes('if ((smartDeep || additive) && pointerLayerId && pointerNode) {') &&
    sourceTreePreview.includes(
      'const pointerLayerId = smartDeep || additive\n' +
      '      ? resolveSourceTreePreviewCommandHoverLayerId(',
    ) &&
    sourceTreePreview.indexOf('if ((smartDeep || additive) && pointerLayerId && pointerNode) {') <
      sourceTreePreview.indexOf('const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(') &&
    sourceTreePreview.indexOf('const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(') <
      sourceTreePreview.indexOf('shouldSourceTreePreviewRuntimeOwnPointerGesture(event, container, selectedNode)') &&
    sourceTreePreview.includes(
      'const controlledRuntimeOwnerNode = resolveSourceTreePreviewControlledRuntimeOwnerNode(',
    ) &&
    sourceTreePreview.includes('if (controlledRuntimeOwnerNode) return controlledRuntimeOwnerNode;') &&
    sourceTreePreview.includes(
      'return runtimeOwnerNode ? getSourceTreePreviewElementNodeId(runtimeOwnerNode) : null;',
    ) &&
    sourceTreePreview.includes('function resolveSourceTreePreviewVisualBoundsRuntimeOwnerNode(') &&
    sourceTreePreview.includes('getSourceTreePreviewSelectionBoundsElement(candidate, currentTarget) === current') &&
    sourceTreePreview.includes('if (outermostCandidates.length === 1) return outermostCandidates[0] ?? null;') &&
    sourceTreePreview.includes(
      'const closestSelectableNode = element.closest<HTMLElement>(\n    SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,\n  );',
    ) &&
    sourceTreePreview.includes(
      'currentTarget.ownerDocument.body.contains(closestSelectableNode)',
    ) &&
    sourceTreePreview.indexOf('const closestSelectableNode = element.closest<HTMLElement>(') <
      sourceTreePreview.indexOf('if (controlledRuntimeOwnerNode) return controlledRuntimeOwnerNode;') &&
    sourceTreePreview.indexOf('const closestSelectableNode = element.closest<HTMLElement>(') <
      sourceTreePreview.indexOf('const closestRuntimeOwnerNode = element.closest<HTMLElement>(') &&
    sourceTreePreview.includes("const trigger = element.closest<HTMLElement>('[aria-controls]');") &&
    sourceTreePreview.includes('getSourceTreePreviewControlledElementIds(trigger)') &&
    sourceTreePreview.includes('getSourceTreePreviewControllingElements(element)') &&
    sourceTreePreview.includes('const structuralRuntimeRoots = elements.filter((element) => {') &&
    sourceTreePreview.includes('const isNestedRuntimeProjection = (element: HTMLElement) => (') &&
    sourceTreePreview.includes('!isNestedRuntimeProjection(element) &&') &&
    sourceTreePreview.includes('!isNestedRuntimeProjection(candidate)') &&
    sourceTreePreview.includes('getSourceTreePreviewControlledRuntimeRootVisualRects(element)') &&
    sourceTreePreview.includes('if (controlledRuntimeRootRects.length > 0) return controlledRuntimeRootRects;') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeRootNodeId(element.className)') &&
    sourceTreePreview.includes('`[aria-controls~="${escapedId}"]`') &&
    sourceTreePreview.includes('getSourceTreePreviewControllingElements(element)\n    .flatMap(getSourceTreePreviewVisibleClientRects)') &&
    sourceTreePreview.includes('function getSourceTreePreviewSelectionBoundsElement(') &&
    sourceTreePreview.includes(
      'element.closest<HTMLElement>(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR)',
    ) &&
    sourceTreePreview.includes('return overlayItem;') &&
    sourceTreePreview.indexOf('return overlayItem;') <
      sourceTreePreview.indexOf(
        'if (getSourceTreePreviewTopLayerSelectionHost(element, container)) return element;',
      ) &&
    sourceTreePreview.includes(
      'const runtimeRootNodeId = getSourceTreePreviewRuntimeRootNodeId(element.className);',
    ) &&
    sourceTreePreview.includes('runtimeRootNodeId === layerId &&') &&
    sourceTreePreview.indexOf('return overlayItem;') <
      sourceTreePreview.indexOf('runtimeRootNodeId === layerId &&') &&
    sourceTreePreview.includes('const hasForeignSourceMarker = Array.from(') &&
    sourceTreePreview.includes('!current.contains(candidate) &&') &&
    sourceTreePreview.includes('getSourceTreePreviewSelectionVisualRect(element, container)') &&
    sourceTreePreview.includes('function getSourceTreePreviewNativeTopLayerHost(element: HTMLElement)') &&
    sourceTreePreview.includes("current.matches('dialog[open]')") &&
    sourceTreePreview.includes("current.matches('[popover]:popover-open')") &&
    sourceTreePreview.includes('return nativeTopLayerHost;') &&
    sourceTreePreview.includes("topLayer ? 'wb-source-visual-selection-overlay--top-layer' : ''") &&
    styles.includes('.wb-source-visual-selection-overlay--top-layer') &&
    styles.includes('z-index: 2147483646;') &&
    styles.includes('z-index: 2147483647;') &&
    sourceTreePreview.includes('if (blockPointerEvents && active) blockSourceTreePreviewPointerEvent(upEvent);') &&
    sourceTreePreview.includes('move(moveEvent);\n    if (blockPointerEvents && active) blockSourceTreePreviewPointerEvent(moveEvent);') &&
    sourceTreePreview.includes('getSourceTreePreviewNodeDragElements(container, selectedNode)') &&
    sourceTreePreview.includes('function getSourceTreePreviewDragElementVisualRect(') &&
    sourceTreePreview.includes('function isSourceTreePreviewCanvasFlowElement(container: HTMLElement, element: HTMLElement)') &&
    sourceTreePreview.includes("if (position === 'absolute' || position === 'fixed') return false;") &&
    sourceTreePreview.includes('isSourceTreePreviewCanvasFlowElement(container, element)') &&
    sourceTreePreview.includes('return canvasFlowTargets.length > 0 ? canvasFlowTargets : targets;') &&
    !sourceTreePreview.includes('SOURCE_TREE_PREVIEW_MAX_REFLOW_PREVIEW_PX') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MIN_PX = 14') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_OUTDENT_TRIGGER_PX = 10') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_OUTDENT_ACTIVATION_PX = 30') &&
    sourceTreePreview.includes('resolveSourceTreePreviewAncestorInnerEdgeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('const resolveAncestorInnerEdgeTarget = () => resolveSourceTreePreviewAncestorInnerEdgeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('return resolveAncestorInnerEdgeTarget() ?? resolveSourceTreePreviewDraggedParentDropTarget({') &&
    !sourceTreePreviewCanvasDropCandidateSource.includes('if (ancestorInnerEdgeTarget) return ancestorInnerEdgeTarget;') &&
    sourceTreePreview.includes('getSourceTreePreviewVirtualBoundarySnapSize(flowDimension)') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('const currentParentScopeTarget = resolveSourceTreePreviewDraggedParentDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('if (currentParentScopeTarget) return currentParentScopeTarget;') &&
    sourceTreePreview.includes('function resolveSourceTreePreviewNearestAncestorScopeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('const nearestAncestorScopeTarget = resolveSourceTreePreviewNearestAncestorScopeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('if (nearestAncestorScopeTarget) return nearestAncestorScopeTarget;') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('const nearestExternalParentScopeTarget = resolveSourceTreePreviewNearestExternalParentScopeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.includes('if (nearestExternalParentScopeTarget) return nearestExternalParentScopeTarget;') &&
    sourceTreePreviewCanvasDropCandidateSource.indexOf('if (currentParentScopeTarget) return currentParentScopeTarget;') <
      sourceTreePreviewCanvasDropCandidateSource.indexOf('const nearestExternalParentScopeTarget = resolveSourceTreePreviewNearestExternalParentScopeDropTarget({') &&
    sourceTreePreviewCanvasDropCandidateSource.indexOf('if (nearestExternalParentScopeTarget) return nearestExternalParentScopeTarget;') <
      sourceTreePreviewCanvasDropCandidateSource.indexOf('const nearestAncestorScopeTarget = resolveSourceTreePreviewNearestAncestorScopeDropTarget({') &&
    sourceTreePreview.includes('let scopeNode = currentParentNode;') &&
    sourceTreePreview.includes('scopeNode = findEditableTreeParent(root, scopeNode.id);') &&
    sourceTreePreview.includes('scopeNode.id === currentParentNode?.id ||') &&
    sourceTreePreview.includes('function resolveSourceTreePreviewNearestExternalParentScopeDropTarget({') &&
    sourceTreePreview.includes('right.depth - left.depth ||\n      left.area - right.area') &&
    sourceTreePreview.includes('draggedParentSubtreeIds.has(nodeId)') &&
    sourceTreePreview.includes('isEditableTreeSourcePreviewOnlyNode(root, nodeId)') &&
    sourceTreePreview.includes('!canMoveSourceNodeIntoParent(draggedNode, node)') &&
    sourceTreePreview.includes('resolveSourceTreePreviewAncestorExitDropTarget({') &&
    sourceTreePreview.includes('if (!outsideStart && !outsideEnd) return null;') &&
    sourceTreePreview.includes('resolveSourceTreePreviewAncestorBoundaryDropTarget({') &&
    sourceTreePreview.indexOf('const ancestorBoundaryTarget = resolveSourceTreePreviewAncestorBoundaryDropTarget({') <
      sourceTreePreview.indexOf('// Once sibling-boundary intent has been ruled out') &&
    sourceTreePreview.includes('getSourceTreePreviewNodeDragElements(container, candidateNode)') &&
    sourceTreePreview.includes('getSourceTreePreviewVisualBounds(container, candidateElements)') &&
    sourceTreePreview.includes('getSourceCanvasDropBoundaryActivationSize({') &&
    sourceCanvasDropGeometry.includes('if (flow.grid) return dimension / 2;') &&
    sourceCanvasDropGeometry.includes('if (sameParentReorder && !prefersInside) return dimension * 0.3;') &&
    sourceCanvasDropGeometry.includes('return dimension * 0.3;') &&
    !sourceTreePreview.includes('dimension * 0.42') &&
    sourceTreePreview.includes('if (canDropIntoTarget) {') &&
    sourceTreePreview.includes('Number(right.sameParentReorder) - Number(left.sameParentReorder)') &&
    sourceTreePreview.includes('left.level - right.level ||\n    left.distance - right.distance') &&
    !sourceTreePreview.includes('left.distance - right.distance ||\n    left.level - right.level') &&
    sourceTreePreview.includes("intent: 'outdent'") &&
    sourceTreePreview.includes('scopeLabel: ancestorNode.label') &&
    sourceTreePreview.includes('dragNodes.flatMap((node) => getSourceTreePreviewNodeDragElements(container, node))') &&
    sourceTreePreview.includes('function resolveSourceTreePreviewDragOriginElements({') &&
    sourceTreePreview.includes('const resolveCurrentDragOriginElements = () => {') &&
    sourceTreePreview.includes('eventTargetLayerElement?.isConnected') &&
    sourceTreePreview.includes('const refreshDragOriginPreview = () => {') &&
    sourceTreePreview.includes('dragOriginRefreshFrameId = ownerWindow.requestAnimationFrame(() => {') &&
    sourceTreePreview.includes('eventTargetLayerId === selectedNode.id') &&
    sourceTreePreview.includes('return [eventTargetLayerElement];') &&
    sourceTreePreview.includes('applySourceTreePreviewDragOriginPreview(originElements)') &&
    sourceTreePreview.includes('applySourceTreePreviewDragChromePreview(container)') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE') &&
    sourceTreePreview.includes('element.hasAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE)') &&
    sourceTreePreview.includes("element.setAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE, 'true')") &&
    sourceTreePreview.includes("setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'opacity', '0')") &&
    sourceTreePreview.includes('const previewRoot = simulatePreviewTreeMove({') &&
    sourceTreePreview.includes('nodeIds: dragNodes.map((node) => node.id)') &&
    sourceTreePreview.includes('getSourceTreePreviewDragGhostTransitionOrigins(') &&
    sourceTreePreview.includes('committedReflowCleanup = () => onPreviewRootChange(null);') &&
    sourceTreePreview.includes('applySourceTreePreviewDropPlaceholderPreview(previewDocument, hiddenNodeIds)') &&
    sourceTreePreview.includes('dragNodes.map((node) => node.id),') &&
    sourceTreePreview.includes('structural slot plus the translucent visual ghost') &&
    sourceTreePreview.includes('resolveSourceTreePreviewDragGhostHost(candidateGhostHost, container)') &&
    sourceTreePreview.includes('function resolveSourceTreePreviewDragGhostHost(') &&
    sourceTreePreview.includes('getSourceTreePreviewNativeTopLayerHost(candidateHost) === candidateHost') &&
    sourceTreePreview.includes("candidateHost.matches('.sidebar-drawer-root.is-open')") &&
    sourceTreePreview.includes('function getSourceTreePreviewRuntimeOverlayVisualHost(') &&
    sourceTreePreview.includes(
      'getSourceTreePreviewComputedStyle(current).position === \'fixed\'',
    ) &&
    sourceTreePreview.includes(
      'getSourceTreePreviewRuntimeOverlayVisualHost(visualHostElement, container)',
    ) &&
    sourceTreePreview.includes(
      '`${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`',
    ) &&
    sourceTreePreview.includes('? { ...dropTarget, topLayerHost: null }') &&
    sourceTreePreview.includes('const renderedRoot = dropPreviewRoot ?? root;') &&
    sourceTreePreview.includes('node={renderedRoot}') &&
    sourceTreePreview.includes('getSourceTreePreviewLayoutSnapshot(previewDocument)') &&
    sourceTreePreview.includes('lockSourceTreePreviewLayoutScrollPositions(previewDocument)') &&
    sourceTreePreview.includes("entry.element.style.setProperty('overflow-anchor', 'none', 'important')") &&
    sourceTreePreview.includes("entry.element.style.setProperty('scroll-snap-type', 'none', 'important')") &&
    sourceTreePreview.includes('scrollLock?.restorePositions();') &&
    sourceTreePreview.includes('animateSourceTreePreviewLayoutTransition(') &&
    sourceTreePreview.includes("SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE = 'data-wb-drop-layout-transition'") &&
    sourceTreePreview.includes(
      "animations.push(target.animate(\n          [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }],",
    ) &&
    sourceTreePreview.includes('for (const animation of animations) animation.cancel();') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS = 180') &&
    !sourceTreePreview.includes('startViewTransition') &&
    sourceTreePreview.includes('flushSync(() => {') &&
    !sourceTreePreview.includes('const reflowPreview = applySourceTreePreviewDropReflowPreview({') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DROP_ACTIVATION_DISTANCE_PX = 14') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DROP_CANDIDATE_CONFIRMATION_MS = 60') &&
    sourceTreePreview.includes("dropTarget?.operation === 'reorder'") &&
    sourceTreePreview.includes("only cross-parent moves need dwell") &&
    sourceTreePreview.includes('dropTarget = activeProjectedDropTarget;') &&
    sourceTreePreview.includes('Re-resolve against the currently painted layout.') &&
    sourceTreePreview.includes('Keep the current slot visible while a different structural parent') &&
    !sourceTreePreview.includes('if (!canReuseProjectedDecision && clearDropReflowPreview)') &&
    sourceTreePreview.includes('isSourceTreePreviewPointerNearDropTargetScopeEdge({') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DROP_DECISION_HYSTERESIS_PX = 12') &&
    sourceTreePreview.includes('shouldHoldSourceCanvasDragOrigin({') &&
    sourceTreePreview.includes('dragDistance: Math.hypot(dx, dy)') &&
    sourceTreePreview.includes('const clearPendingDropCandidate = () => {') &&
    sourceTreePreview.includes('const applyConfirmedDropProjection = (') &&
    sourceTreePreview.includes('const waitForStableDropCandidate = (') &&
    sourceTreePreview.includes('ownerWindow.setTimeout(') &&
    sourceTreePreview.includes('confirmPendingDropCandidate,') &&
    sourceTreePreview.includes('waitForStableDropCandidate(dropTarget, point);') &&
    sourceTreePreview.includes('container.ownerDocument.elementsFromPoint?.(clientX, clientY)') &&
    sourceTreePreview.includes('getSourceTreePreviewChildDropGeometry(container, parentNode, ignoredNodeIds)') &&
    sourceTreePreview.includes('function isSourceTreePreviewElementInFlowScope(') &&
    sourceTreePreview.includes('while (current && current !== scopeElement)') &&
    sourceTreePreview.includes('function getSourceTreePreviewLogicalChildDropGeometry(') &&
    sourceTreePreview.includes('return getSourceTreePreviewLayerChildren(parentNode).flatMap((child, index) => {') &&
    sourceTreePreview.includes('isSourceTreePreviewElementInFlowScope(flowScopeElement, entry.element)') &&
    sourceTreePreview.includes('const pointerChild = childGeometry.find(({ rect }) => (') &&
    sourceTreePreview.includes('if (!pointerInsideParent && !pointerChild) return null;') &&
    sourceTreePreview.includes('childGeometry: providedChildGeometry,') &&
    sourceTreePreview.includes('function getSourceTreePreviewStructuralDropHitElement(') &&
    sourceTreePreview.includes('const inFlowCandidates = candidates.filter((candidate) => (') &&
    sourceTreePreview.includes('const structuralCandidates = inFlowCandidates.length > 0') &&
    sourceTreePreview.includes('isSourceTreePreviewElementInFlowScope(container, candidate.element)') &&
    !sourceTreePreview.includes('left.scopeRank - right.scopeRank') &&
    !sourceTreePreviewCanvasDropCandidateSource.includes('const pointerInsideDraggedParent = Boolean(') &&
    sourceTreePreviewCanvasDropCandidateSource.indexOf('const draggedParentNode =') <
      sourceTreePreviewCanvasDropCandidateSource.indexOf(
        'const targetElement = getSourceTreePreviewStructuralDropHitElement(',
      ) &&
    sourceTreePreview.includes('resolveSourceCanvasDropInsertion({') &&
    sourceTreePreview.includes('inferSourceCanvasDropFlow({') &&
    sourceTreePreview.includes('if (unignoredChildren.length > 0 && childGeometry.length === 0) return null;') &&
    sourceTreePreview.includes('hasSourceTreePreviewUnmeasuredDropChildren(') &&
    sourceTreePreview.includes('getSourceTreePreviewDropFlowForChildGeometry(') &&
    sourceTreePreview.includes('getSourceTreePreviewDropFlowElementForChildGeometry(') &&
    sourceTreePreview.includes('isSourceTreePreviewRectVisibleThroughOverflowAncestors(') &&
    sourceTreePreview.includes("value === 'auto' || value === 'clip' || value === 'hidden' || value === 'scroll'") &&
    sourceTreePreview.includes('getSourceTreePreviewDropDecisionVisualRect(targetElement)') &&
    sourceTreePreview.includes('restoreSourceTreePreviewTemporaryInlineStyles(snapshots)') &&
    sourceTreePreview.includes('previewRect?: SourceTreePreviewOverlayRect;') &&
    sourceTreePreview.includes('let projectedTarget = activeProjectedDropTarget;') &&
    sourceTreePreview.includes('!projectedTarget &&') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DROP_ACTIVATION_DISTANCE_PX') &&
    sourceTreePreview.includes('projectedTarget = resolveSourceTreePreviewCanvasDropTarget({') &&
    sourceTreePreview.includes("ownerDocument.addEventListener('scroll', invalidateDropProjection, true)") &&
    sourceTreePreview.includes("ownerDocument.addEventListener('visibilitychange', handleVisibilityChange)") &&
    sourceTreePreview.includes("ownerWindow.addEventListener('blur', abortDrag)") &&
    sourceTreePreview.includes("ownerWindow.addEventListener('pagehide', abortDrag)") &&
    sourceTreePreview.includes("ownerWindow.addEventListener('resize', invalidateDropProjection)") &&
    sourceTreePreview.includes('const handleCanvasDragEscape = (event: KeyboardEvent) => {') &&
    sourceTreePreview.includes("event.key !== 'Escape'") &&
    sourceTreePreview.includes("ownerWindow.addEventListener('keydown', handleCanvasDragEscape, true)") &&
    sourceTreePreview.includes("hostWindow.addEventListener('keydown', handleCanvasDragEscape, true)") &&
    sourceTreePreview.includes('target.style.top = startInlineTop;') &&
    sourceTreePreview.includes('target.style.left = startInlineLeft;') &&
    sourceTreePreview.includes('restoreSourceTreePreviewInlineSize(target, startInlineSize);') &&
    sourceTreePreview.includes('activeProjectedDropTarget = null;') &&
    sourceTreePreview.includes('move(upEvent);') &&
    sourceTreePreview.includes('onLoad={handlePreviewFrameLoad}') &&
    sourceTreePreview.includes('clearCanvasDrag();\n    // Patch the host globals BEFORE the state commit') &&
    sourceTreePreview.includes('setPreviewDocument(event.currentTarget.contentDocument);') &&
    sourceTreePreview.includes('}, [clearCanvasDrag, root]);') &&
    sourceTreePreview.includes('let committedReflowCleanup = clearDropReflowPreview;') &&
    sourceTreePreview.includes('let committedOriginCleanup = clearDragOriginPreview;') &&
    sourceTreePreview.includes('deferSourceTreePreviewCommittedReflowCleanup({') &&
    sourceTreePreview.includes('flushSourceTreePreviewCommittedReflowCleanup(container);') &&
    sourceTreePreview.includes('commit: () => onCommit(projectedTarget),') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS + 40,') &&
    sourceTreePreview.includes('Promise.resolve(commitResult).finally(() => {') &&
    sourceTreePreview.includes(
      'onCommit: (target) => {\n        suppressNextClick();\n        return onMoveLayerToParent(layerId, target.parentId, target.index);',
    ) &&
    designEditor.includes('return updateSourceInspectorMoveNode(targetLayer, targetNode, targetParentNode, targetIndex);') &&
    designEditor.includes('onSessionCommitted: async (nextContents) => {') &&
    designEditor.includes('return previewReady;') &&
    editableTreeSourceInspector.includes('Promise.all([persistence, sessionCommitNotification])') &&
    sourceTreePreview.includes('const hitIsExternalBranch = Boolean(') &&
    sourceTreePreview.includes('const ancestorExitTarget = hitIsExternalBranch') &&
    sourceTreePreview.includes('function projectSourceTreePreviewRuntimeOverlayCollection(') &&
    sourceTreePreview.includes('const projectedRuntimeOverlayItems = elements.filter(') &&
    sourceTreePreview.includes('return projectedRuntimeOverlayItems;') &&
    sourceTreePreview.includes('current === nativeTopLayerHost || current === stopAt') &&
    !styles.includes('.wb-source-visual-drop-slot') &&
    styles.includes('.wb-source-visual-drop-scope--inside') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-drop-scope--inside') &&
    styles.includes('.wb-source-visual-drop-scope--blocked') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-drop-scope--blocked') &&
    !styles.includes('.wb-source-visual-drop-reflow-node') &&
    !styles.includes('.wb-source-visual-drag-origin') &&
    styles.includes('.wb-source-visual-drop-scope--outdent') &&
    styles.includes('.wb-source-visual-drop-intent--inside') &&
    styles.includes('.wb-source-visual-drop-intent--outdent') &&
    /\.wb-source-visual-drop-intent\s*\{[^}]*color:\s*#fff;[^}]*font-family:\s*var\(--wb-editor-font-sans\);/s.test(styles) &&
    /\.wb-source-visual-drop-intent\s*\{[^}]*color:\s*#fff;[^}]*font-family:\s*var\(--wb-editor-font-sans\);/s.test(sourceTreePreviewFrameCss) &&
    !styles.includes('.wb-source-visual-drop-indicator--line') &&
    !sourceTreePreviewFrameCss.includes('.wb-source-visual-drop-indicator--line') &&
    !styles.includes('.wb-source-visual-drop-indicator--horizontal') &&
    !styles.includes('.wb-source-visual-drop-indicator--vertical') &&
    sourceTreePreview.includes('if (isReorder) return null;') &&
    !sourceTreePreview.includes('순서 이동') &&
    sourceTreePreview.includes('안에 넣기') &&
    sourceTreePreview.includes("const isReorder = value.operation === 'reorder'") &&
    sourceTreePreview.includes("operation?: 'outdent' | 'reorder' | 'reparent'") &&
    sourceTreePreview.includes("target.parentId === currentParent?.id") &&
    sourceTreePreview.includes("operation === 'reorder' && target.position === 'inside'") &&
    sourceTreePreview.includes('scopeLabel: parentNode.label') &&
    sourceTreePreview.includes('scopeLabel: targetParentNode.label') &&
    sourceTreePreview.includes('scopeLabel: candidateParentNode.label') &&
    sourceTreePreview.includes('isSourceTreePreviewNoopDropTarget(') &&
    sourceTreePreview.includes('isSourceCanvasNoopReorder({') &&
    sourceTreePreview.includes('resolveSourceTreePreviewBlockedDropHint({') &&
    sourceTreePreview.includes("value.reason === 'unmeasured' ? '위치 확인 불가' : '하위 배치 불가'") &&
    sourceTreePreview.includes('밖으로 · {value.scopeLabel}') &&
    sourceTreePreview.includes("container.classList.add('wb-source-visual-node-drag-active')") &&
    sourceTreePreview.includes("container.classList.remove('wb-source-visual-node-drag-active')") &&
    styles.includes('.wb-source-visual-node-drag-active .wb-source-visual-selection-overlay'),
  'SourceTreePreview canvas drag should keep the selected subtree root as its move target, prefer in-flow structural targets over absolute overlays, promote nested hits to reachable ancestor boundaries, and preserve a usable inside target for childless containers',
);
assert(
  sourceTreePreview.includes('function isSourceTreePreviewScrollContainerForAxis(') &&
    sourceTreePreview.includes('element === container ||') &&
    sourceTreePreview.includes(
      '// The innermost scroll container owns the wheel gesture for its axis even',
    ) &&
    sourceTreePreview.includes(
      'if (isSourceTreePreviewScrollContainerForAxis(element, deltaX, deltaY)) {',
    ),
  'SourceTreePreview wheel routing should stop at the innermost scroll container boundary instead of chaining into the outer canvas',
);
assert(
  /\.wb-row-overlay-actions\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s.test(styles) &&
    styles.includes('.wb-sidebar-row:hover .wb-row-overlay-actions') &&
    styles.includes('.wb-sidebar-row:has(.wb-row-overlay-actions .wb-ui-icon-button:focus-visible) .wb-row-overlay-actions') &&
    !styles.includes('.wb-sidebar-row--selected .wb-row-overlay-actions') &&
    !styles.includes('.wb-sidebar-row--multi-primary .wb-row-overlay-actions'),
  'Sidebar row actions should stay hidden until row hover, keyboard focus, or an open menu',
);
assert(
    styles.includes('.wb-source-visual-drag-ghost') &&
    styles.includes('.wb-source-visual-drag-ghost--preview') &&
    styles.includes('.wb-source-visual-drag-ghost--snapshot') &&
    styles.includes('mask-image: radial-gradient(') &&
    styles.includes('opacity: 0.34;') &&
    styles.includes('var(--wb-source-visual-drag-ghost-origin-x, 0px)') &&
    styles.includes('var(--wb-source-visual-drag-ghost-origin-y, 0px)') &&
    styles.includes('filter: saturate(0.9) drop-shadow(') &&
    /\.wb-source-visual-drag-ghost--fallback\s*\{[^}]*font-family:\s*var\(--wb-editor-font-sans\);/s.test(styles) &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-drag-ghost') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-drag-ghost--preview') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-drag-ghost--snapshot') &&
    sourceTreePreviewFrameCss.includes('mask-image: radial-gradient(') &&
    sourceTreePreviewFrameCss.includes('opacity: 0.34;') &&
    sourceTreePreviewFrameCss.includes('var(--wb-source-visual-drag-ghost-origin-x, 0px)') &&
    sourceTreePreviewFrameCss.includes('var(--wb-source-visual-drag-ghost-origin-y, 0px)') &&
    sourceTreePreviewFrameCss.includes('filter: saturate(0.9) drop-shadow(') &&
    /\.wb-source-visual-drag-ghost--fallback\s*\{[^}]*font-family:\s*var\(--wb-editor-font-sans\);/s.test(sourceTreePreviewFrameCss) &&
    sourceTreePreview.includes(
      'const visibleCommandHoverLayerId = dragGhost ? null : commandHoverLayerId;',
    ) &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DRAG_GHOST_FULL_STYLE_NODE_LIMIT') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_WIDTH') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_HEIGHT') &&
    sourceTreePreview.includes('pointerOffsetX: 0,') &&
    sourceTreePreview.includes('pointerOffsetY: 0,') &&
    sourceTreePreview.includes('cloneSourceTreePreviewDragGhostElement(element, !snapshot)') &&
    sourceTreePreview.includes("value.preview.snapshot ? 'wb-source-visual-drag-ghost--snapshot' : ''") &&
    sourceTreePreview.includes('setCommandHoverLayerId(null);'),
  'SourceTreePreview visual drag ghosts should anchor their component origin at the pointer, share the subdued radial mask, use a bounded lightweight snapshot for complex subtrees, and retain a readable editor-label fallback in host and iframe contexts',
);
assert(
  sourceTreePreview.includes(
    "!container.classList.contains('wb-source-visual-node-drag-active')",
  ) &&
    sourceTreePreview.includes('dragActive={Boolean(dragGhost)}') &&
    sourceTreePreview.includes(
      '[containerRef, dragActive, layoutKey, root, selectedLayerId, selectedLayerKey, selectionLabel]',
    ) &&
    sourceTreePreview.includes(
      'container.ownerDocument.querySelector(`[${SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE}]`)',
    ) &&
    sourceTreePreview.includes('frameId = ownerWindow.requestAnimationFrame(update);'),
  'Selection chrome should follow post-drag WAAPI layout interpolation through its final frame after commit or Escape',
);
assert(
  sourceTreePreview.includes('className.startsWith(SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX)') &&
    sourceTreePreview.includes('cloneElement.classList.remove(className);'),
  'SourceTreePreview drag ghost clones should remove runtime node identity classes so placeholder hiding and layout interpolation cannot treat the ghost as authored content',
);
assert(
  sourceTreePreview.includes('return target ? `${target.parentId}:${target.index}` : null;') &&
    !sourceTreePreview.includes('`${target.intent}:${target.parentId}:${target.index}:${target.position}`'),
  'SourceTreePreview should key drag interpolation by the structural destination so equivalent before/after hits do not restart the same reflow',
);
assert(
  previewSelectionService.includes("mode === 'direct' || mode === 'smart-deep' || mode === 'exact'") &&
    previewSelectionService.includes("if (mode === 'exact') {") &&
    previewSelectionService.includes('const nextSelectedNodeId = getPreviewDirectSelectionId(root, clickedPath, effectiveDrillPath);') &&
    previewSelectionService.includes('const targetDepth = getPreviewCommonPathLength(selectionScopePath, clickedPath);') &&
    previewSelectionService.includes('drillPath: getPreviewDrillPathForSelection(root, nextSelectedNodeId),') &&
    previewSelectionService.includes('selectedNodeId: nextSelectedNodeId,'),
  'Direct preview selection should stay at the current drill depth while exact modifier selection remains independent',
);
assert(
  sourceTreePreview.includes(
    "const SOURCE_TREE_PREVIEW_RUNTIME_DIRECT_SELECTION_ATTRIBUTE = 'data-wb-runtime-direct-select';",
  ) &&
    sourceTreePreview.includes('function requestsSourceTreePreviewExactRuntimeSelection(') &&
    sourceTreePreview.includes(
      '(overlayItemLayerId && !smartDeep) || requestsExactRuntimeSelection',
    ) &&
    sourceTreePreview.includes(
      'requestsSourceTreePreviewExactRuntimeSelection(target, container)',
    ),
  'Visible runtime rows that explicitly represent authored children should be able to request exact ordinary-click selection without changing the default drill-depth contract',
);
assert(
  previewSelectionService.includes('if (!candidateParent || getSelectablePreviewChildCount(candidateParent) >= 2) {') &&
    previewSelectionService.includes('return clickedPath[candidateIndex]!.id;') &&
    previewSelectionService.includes('candidateIndex -= 1;') &&
    previewSelectionService.includes('...(node.sourcePreviewChildren ?? [])'),
  'Cmd/Ctrl preview selection should count authored and source-preview children, keep the deepest sibling, and climb only through single-child ancestors',
);
assert(
  editableTreeDomProjection.includes('function getRuntimeVisualLeafSelectionElement') &&
    editableTreeDomProjection.includes('svg[${RUNTIME_NODE_ID_ATTRIBUTE}]') &&
    editableTreeDomProjection.includes('const hitElements = Array.from(rootElement.querySelectorAll<Element>') &&
    editableTreeDomProjection.includes('if (stackedElement) hitElements.push(stackedElement);') &&
    editableTreeDomProjection.includes('.flatMap((child) => isRuntimeDomElement(child) ? getRuntimeElementHitRects(child) : [])') &&
    sourceTreePreview.includes('function getSourceTreePreviewVisualLeafSelectionElement') &&
    sourceTreePreview.includes('svg[data-wb-preview-node-id]') &&
    sourceTreePreview.includes('...Array.from(currentTarget.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR))'),
  'Preview hit testing should include pointer-inert visual leaves, treat inline SVG as one selectable node, and preserve non-HTMLElement descendant geometry',
);
assert(sourceTreePreview.includes("sourceTreePreviewFrame.css?raw") && sourceTreePreview.includes('cloneProjectPreviewStylesheetNode'), 'Shared preview iframe head sync should use explicit frame CSS plus project-only stylesheet clones');
assert(sourceTreePreviewFrameCss.includes('#wb-source-preview-stage > .wb-source-visual-preview') && sourceTreePreviewFrameCss.includes('#wb-source-preview-stage > .wb-storybook-runtime-preview'), 'Shared preview iframe frame CSS should size source and storybook runtime roots inside the iframe stage');
assert(
  /\.base-ui-disable-scrollbar\s*\{[^}]*scrollbar-width:\s*none;/s.test(sourceTreePreviewFrameCss) &&
    /\.base-ui-disable-scrollbar::\-webkit-scrollbar\s*\{[^}]*display:\s*none;/s.test(sourceTreePreviewFrameCss),
  'Source preview iframe CSS should preserve Base UI native-scrollbar suppression for vertical and horizontal ScrollArea viewports',
);
assert(
  storybookLibrary.includes("const previewStage = previewDocument?.getElementById('wb-source-preview-stage') ?? null;") &&
    storybookLibrary.includes('<WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>') &&
    storybookLibrary.includes('previewStage\n            ?? previewDocument.getElementById(\'wb-source-preview-root\')') &&
    designEditor.includes("const previewFrameStage = previewDocument?.getElementById('wb-source-preview-stage') ?? null;") &&
    designEditor.includes('<WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>') &&
    designEditor.includes('previewFrameStage\n            ?? previewDocument.getElementById(\'wb-source-preview-root\')'),
  'Storybook and component-picker previews should mount into the iframe stage and pass the exact portal boundary to project runtime components',
);
assert(
  /\.wb-source-visual-node--button\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*gap:\s*10px;/s.test(sourceTreePreviewFrameCss) &&
    !/\.wb-source-visual-node--button\s*\{[^}]*display:\s*inline-block;/s.test(sourceTreePreviewFrameCss),
  'Source preview iframe buttons should use inline-flex so inserted HTML children render in a row instead of block-stacking',
);
assert(sourceTreePreview.includes('syncSourceTreePreviewFrameTokenVariables') && sourceTreePreview.includes('root.style.setProperty(name, String(value))'), 'SourceTreePreview should sync live token variables onto the iframe root instead of relying on stale token CSS files');
assert(
  sourceTreePreview.includes('resolveSourceTreePreviewComponentPropToken') &&
    sourceTreePreview.includes('getTokenPreviewCss(result, tokenRegistry) ?? result.previewText') &&
    !sourceTreePreview.includes("allowedTypes: ['string'],\n    collectionId: reference.collectionId"),
  'SourceTreePreview should resolve component prop tokens across token types, not only string tokens',
);
assert(
  sourceTreePreview.includes('SOURCE_TREE_PREVIEW_FRAME_STRUCTURE_SIGNATURES') &&
    sourceTreePreview.includes('syncSourceTreePreviewTailwindRuntimeStyleNode(targetDocument, tailwindRuntimeCss);') &&
    sourceTreePreview.includes('existing.textContent = css') &&
    sourceTreePreview.includes('targetDocument.head.append(style)'),
  'Source preview iframe head sync should update runtime Tailwind CSS in place when the static head structure has not changed',
);
assert(
  sourceTreePreview.includes('const trackingRoot = previewDocument.body ?? container') &&
    sourceTreePreview.includes('observer.observe(trackingRoot, {') &&
    sourceTreePreview.includes('createSourceTreePreviewRenderedClassNameTracker(trackingRoot)'),
  'SourceTreePreview should collect rendered Tailwind classes from the whole preview iframe body so portal content gets runtime CSS',
);
assert(sourceTreePreview.includes('getSourceTreePreviewAuthoredClassName'), 'SourceTreePreview should apply authored className values to source-backed intrinsic wrappers');
assert(sourceTreePreview.includes("const previewNodeBaseClassName = wrapperAuthoredClassName ? 'wb-source-visual-authored-node' : 'wb-source-visual-node'"), 'SourceTreePreview should keep non-runtime authored className nodes away from the generic node positioning class while runtime wrappers use their own forwarder');
assert(sourceTreePreview.includes("isRuntimeWrapper ? 'wb-source-visual-node--runtime-component' : previewAuthoredClassName ? '' : getSourceTreePreviewNodeClass(node)"), 'SourceTreePreview should not let generic intrinsic classes override authored component className styling');
assert(sourceTreePreview.includes('getSourceTreePreviewIconMaskStyle') && sourceTreePreview.includes('wb-source-visual-intrinsic-icon'), 'SourceTreePreview should render source icon images through currentColor mask previews');
assert(
  !sourceTreePreview.includes("jsxName === 'svg' && isSourceTreePreviewInlineSvgIcon(attributes)") &&
    !sourceTreePreview.includes("'img', 'input', 'svg', 'video'") &&
    !sourceTreePreview.includes('SOURCE_TREE_PREVIEW_SPECIAL_INTRINSIC_TAG_NAMES') &&
    sourceTreePreview.includes('function getSourceTreePreviewHostTagName(node: EditableTreeNode): string | null') &&
    sourceTreePreview.includes("attributes.src ?? attributes[SOURCE_ASSET_SOURCE_ATTRIBUTE] ?? ''") &&
    sourceTreePreview.includes('resolveWorkbenchDefaultIconSource(assetRegistry, iconName)'),
  'SourceTreePreview should project every valid native JSX tag generically while preserving source-authored inline SVG geometry and specialized asset previews',
);
assert(
  sourceTreePreview.includes("const REMIXICON_REACT_IMPORT_SOURCE = '@remixicon/react'") &&
    sourceTreePreview.includes("const LUCIDE_REACT_IMPORT_SOURCE = 'lucide-react'") &&
    sourceTreePreview.includes('resolveSourceTreePreviewPackageIconSource') &&
    sourceTreePreview.includes('return resolveWorkbenchDefaultIconSource(assetRegistry, importName)') &&
    sourceTreePreview.includes('isTablerIconRuntimeImport({ importName, importSource })') &&
    sourceTreePreview.includes('isRemixIconRuntimeImport') &&
    sourceTreePreview.includes('isLucideIconRuntimeImport') &&
    !sourceTreePreview.includes('importIconPackageRuntimeComponent') &&
    !sourceTreePreview.includes('getIconPackageRuntimeImportCandidates'),
  'SourceTreePreview should render Remixicon and Lucide component imports from registered icon assets instead of dynamically importing whole icon packages',
);
assert(
  sourceTreePreview.includes('isSourceTreePreviewRuntimeTailwindClassToken') &&
    sourceTreePreview.includes("token.startsWith('wb-')") &&
    sourceTreePreview.includes("token.startsWith('tabler-icon-')") &&
    sourceTreePreview.includes("token.startsWith('lucide-')") &&
    sourceTreePreview.includes("token === 'remixicon'"),
  'Source preview Tailwind runtime class scanning should ignore Workbench and icon runtime classes so editor overlay changes do not resync iframe styles',
);
assert(
  sourceTreePreview.includes('createSourceTreePreviewRenderedClassNameTracker') &&
    sourceTreePreview.includes('applyMutationRecords') &&
    sourceTreePreview.includes('shouldTrackRenderedTailwindClassNames') &&
    sourceTreePreview.includes('hasSourceTreePreviewProjectRuntimeImports') &&
    sourceTreePreview.includes('record.addedNodes.forEach(trackSubtree)') &&
    sourceTreePreview.includes('record.removedNodes.forEach(untrackSubtree)') &&
    !sourceTreePreview.includes('container.querySelectorAll(\'[class]\').forEach(addElementClassNames)'),
  'Source preview Tailwind runtime class scanning should update rendered class signatures incrementally instead of rescanning the full preview DOM on every class mutation',
);
assert(
  sourceTreePreview.includes('memo(SourceTreePreviewNodeComponent, areSourceTreePreviewNodePropsEqual)') &&
    sourceTreePreview.includes('getCachedSourceTreePreviewNodeSubtreeIds') &&
    sourceTreePreview.includes('isSourceTreePreviewIdSetChangeRelevantToNode') &&
    sourceTreePreview.includes('Selection chrome is rendered by SourceTreePreviewSelectionOverlay') &&
    !sourceTreePreview.includes('getSourceTreePreviewSelectionCandidateIds'),
  'SourceTreePreview selection chrome should not rerender live project components or reset uncontrolled overlays; drill and authored visibility changes should remain subtree-aware',
);
assert(
  sourceTreePreview.includes('observeSourceTreePreviewOverlayMutationTargets') &&
    sourceTreePreview.includes('resizeTargets.forEach((element) => resizeObserver.observe(element))') &&
    !sourceTreePreview.includes("mutationObserver.observe(container, {\n      attributes: true,\n      attributeFilter: ['class', 'data-wb-preview-node-id', 'style'],\n      childList: true,\n      subtree: true,\n    });"),
  'Source preview overlays should observe selected resize targets instead of the entire preview subtree whenever targets are mounted',
);
assert(
  sourceTreePreview.includes('isSourceTreePreviewOutOfFlowVisualDescendant') &&
    sourceTreePreview.includes("style.position === 'absolute' || style.position === 'fixed'") &&
    (sourceTreePreview.match(/!isSourceTreePreviewOutOfFlowVisualDescendant\(target\)/g) ?? []).length >= 2,
  'Source preview parent bounds should exclude absolute and fixed runtime overlays without making the overlay itself unselectable',
);
assert(sourceTreePreview.includes('dismissedPreviewModalNodeIds') && sourceTreePreview.includes('handleSourceTreePreviewModalDismissClick') && sourceTreePreview.includes("removeSourceTreePreviewClassNameToken(wrapperAuthoredClassName ?? '', 'is-open')"), 'SourceTreePreview should let source-backed modal overlays and close buttons dismiss without runtime component state');
assert(sourceTreePreview.includes('watchSourceTreePreviewModalScrollState') && sourceTreePreview.includes('modal--scrolling') && sourceTreePreview.includes('modal--can-scroll-down'), 'SourceTreePreview should mirror modal body scroll state for source-backed modal fades');
assert(sourceTreePreview.includes('onClickCapture={handleClickCapture}') && sourceTreePreview.includes('preventSourceTreePreviewAnchorNavigation(event)') && sourceTreePreview.includes("event.target.closest<HTMLAnchorElement>('a[href]')"), 'SourceTreePreview should prevent preview anchor clicks from navigating/hash-scrolling the iframe');
assert(
  sourceTreePreview.includes('const sourceTreePreviewHandledSelectionEvents = new WeakSet<Event>()') &&
    sourceTreePreview.includes('resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, container)') &&
    sourceTreePreview.includes('getSourceTreePreviewOwnerWindow(container).queueMicrotask(() => {') &&
    sourceTreePreview.includes('if (sourceTreePreviewHandledSelectionEvents.has(nativeEvent)) return;') &&
    sourceTreePreview.includes('sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);'),
  'SourceTreePreview should recover source component selection in capture when a runtime child stops bubbling or replaces the injected click handler',
);
assert(
  sourceTreePreview.includes('resolveSourceTreePreviewDirectAuthoredDescendantNodeId') &&
    sourceTreePreview.includes('`[${SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE}]`') &&
    sourceTreePreview.includes('eventCurrentTarget.contains(authoredDescendant)'),
  'SourceTreePreview direct selection should prefer the nearest authored descendant component before an outer runtime frame claims the hit',
);
assert(
  sourceTreePreview.includes('getSourceTreePreviewInlineSize(target)') &&
    sourceTreePreview.includes('restoreSourceTreePreviewInlineSize(target, startInlineSize);'),
  'SourceTreePreview resize drags should restore transient inline size before committing to source history',
);
assert(styles.includes('.wb-source-visual-authored-node {\n  min-width: 0;\n  outline: 0;\n}'), 'Authored source preview nodes should not reset component positioning or overflow');
assert(styles.includes('.wb-source-visual-node--heading {\n  display: block;\n  color: inherit;'), 'Source preview headings should inherit parent component foreground colors');
assert(sourceTreePreviewFrameCss.includes('.wb-source-visual-intrinsic-icon') && sourceTreePreviewFrameCss.includes('mask: var(--wb-source-visual-icon-url)'), 'Source preview iframe CSS should let source icon assets inherit currentColor');

const sourceParser = read('src/domain/document/editableTreeSourceParser.ts');
assert(sourceParser.includes('getImportableComponentSummariesFromTsxSource'), 'Component imports should infer editable children slots from component source');
assert(sourceParser.includes('childrenSlotKind: inferComponentChildrenSlotKind'), 'Imported component registry metadata should include source-inferred children slot kind');
assert(sourceParser.includes('readClassNameAttributeValue') && sourceParser.includes('collectStaticClassNameFragments'), 'Source parser should keep static className fragments from dynamic className expressions');
assert(sourceParser.includes('sourceMapBinding') && sourceParser.includes('createSourceMapArrayReference'), 'Source parser should preserve static map provenance for Binding instead of losing it when rendering repeated results');
assert(
  read('src/domain/document/editableTree.ts').includes('getEditableTreeReferencedArrayProp') &&
    designInspectorPanelSource.includes('getEditableTreeReferencedArrayProp(candidate)') &&
    designEditor.includes('getEditableTreeReferencedArrayProp(candidate)') &&
    designInspectorPanelSource.includes('isConnectedArrayIconField(field)') &&
    designInspectorPanelSource.includes('assetRegistry={assetRegistry}') &&
    designInspectorPanelSource.includes('checked={item[field] === true}') &&
    designInspectorPanelSource.includes('wb-inspector-connected-array-source-scroll') &&
    /\.wb-inspector-connected-array-source-scroll\s*\{[^}]*overflow:\s*auto;/s.test(styles) &&
    /\.wb-inspector-connected-array-source-scroll > pre\s*\{[^}]*border:\s*0;/s.test(styles) &&
    /\.wb-inspector-connected-array\s*\{[^}]*margin-top:\s*10px;/s.test(styles) &&
    styles.includes('grid-template-columns: 108px minmax(0, 1fr);'),
  'Binding should expose safe referenced array props, icon pickers, and typed boolean fields even when a registered component performs its map internally',
);
assert(
  sourceParser.includes('staticChildrenFallbacks') &&
    sourceParser.includes("sourcePreviewOrigin: 'forwarded-source-child'") &&
    sourceParser.includes('collectStaticFunctionComponentScopeEntries') &&
    sourceParser.includes('copyStaticComponentPropFallback') &&
    sourceParser.includes('convertStaticJsxFunctionCallExpression') &&
    sourceParser.includes("expression.callee.name === 'String'"),
  'Source parser should project local static component props, children, render callback props, and computed style strings without switching to runtime fallback',
);
assert(
  read('src/domain/document/editableTree.ts').includes('getEditableTreePreviewChildSourcePreviewOnly') &&
    sourceNodeCapabilities.includes("if (child.sourcePreviewOrigin === 'forwarded-source-child') return false;") &&
    read('src/domain/preview/previewLayerService.ts').includes('getEditableTreePreviewChildSourcePreviewOnly') &&
    sourceTreePreview.includes('getEditableTreePreviewChildSourcePreviewOnly'),
  'Forwarded authored children inside local source-preview wrappers should keep source editability instead of becoming preview-only',
);
assert(
  read('src/domain/preview/previewLayerService.ts').includes('label: getPreviewLayerLabel(node)') &&
    read('src/domain/preview/previewLayerService.ts').includes("node.kind === 'component-instance'") &&
    read('src/domain/preview/previewLayerService.ts').includes('getPreviewLayerComponentContentLabel(node)') &&
    read('src/domain/preview/previewLayerService.ts').includes("node.kind !== 'text' || node.source?.jsxName === 'text'") &&
    read('src/domain/preview/previewLayerService.ts').includes('collectPreviewLayerText(node)'),
  'Layer rows should include authored component content labels and native child text instead of repeating opaque component or tag names',
);
assert(
  !sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_OWNED_CHILD_ROOT_NAMES') &&
    sourceTreePreview.includes("node.kind === 'component-instance' &&") &&
    sourceTreePreview.includes('getSourceTreePreviewRenderableChildren(node).length > 0') &&
    sourceTreePreview.includes('runtimeOwnedChildren ?? renderedChildren') &&
    sourceTreePreview.includes('shouldRenderRuntimeOwnedChildren && runtimeOwnedChildren !== null') &&
    sourceTreePreview.includes('childNodes: hasHydratedRuntimeChildren ? node.children ?? [] : childNodes') &&
    sourceTreePreview.includes('sourcePreviewChildren: false') &&
    sourceTreePreview.includes('createSourceTreePreviewRuntimeOwnedChild') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeOwnedChildSelectionProps') &&
    sourceTreePreview.includes('const childNodes = node.children ?? [];') &&
    sourceTreePreview.includes('const renderingSourcePreviewChildren = false;') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR') &&
    sourceTreePreview.includes(
      "const SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR = '[role=\"separator\"][aria-valuenow]';",
    ) &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR,\n].join(\', \');') &&
    sourceTreePreview.includes('Boolean(target.closest(SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR))') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_POINTER_GESTURE_TARGET_SELECTOR') &&
    sourceTreePreview.includes("const SOURCE_TREE_PREVIEW_RUNTIME_GESTURE_SURFACE_SELECTOR = '[data-wb-runtime-interactive=\"true\"]';") &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_GESTURE_SURFACE_SELECTOR,') &&
    sourceTreePreview.includes("'[data-slot=\"carousel\"]'") &&
    sourceTreePreview.includes("'[data-slot=\"carousel-content\"]'") &&
    sourceTreePreview.includes('shouldSourceTreePreviewRuntimeOwnPointerGesture') &&
    sourceTreePreview.includes('resolveSourceTreePreviewRuntimePointerGestureSurface') &&
    sourceTreePreview.includes('function resolveSourceTreePreviewRuntimeInteractionTarget(') &&
    (sourceTreePreview.match(/resolveSourceTreePreviewRuntimeInteractionTarget\(/g) ?? []).length >= 5 &&
    sourceTreePreview.includes('const interactiveLeft = Math.min(') &&
    sourceTreePreview.includes('const interactiveRight = Math.max(') &&
    sourceTreePreview.includes('shellRect.width <= interactiveRight - interactiveLeft + 72') &&
    sourceTreePreview.includes('shellRect.height <= interactiveBottom - interactiveTop + 28') &&
    sourceTreePreview.includes("element.matches('[aria-haspopup], [aria-controls]')") &&
    sourceTreePreview.includes('!directRuntimeTarget') &&
    sourceTreePreview.includes(
      "runtimeInteractionTarget.dispatchEvent(new RuntimeMouseEvent('click', {",
    ) &&
  sourceTreePreview.includes('function resolveSourceTreePreviewRuntimeOverlayItemLayerId(') &&
    sourceTreePreview.includes('const directAuthoredWrapper = item.parentElement;') &&
    sourceTreePreview.includes('directAuthoredWrapper?.dataset.wbPreviewNodeId ?? null') &&
    sourceTreePreview.includes('return directAuthoredWrapperNode.id;') &&
    sourceTreePreview.includes('currentTarget.ownerDocument.body.contains(closestSelectableNode)') &&
    sourceTreePreview.includes(
      'runtimeOverlayItemLayerId ??\n          interactionLayerId ??',
    ) &&
    sourceTreePreview.includes(
      'runtimeInteractionLayerId ??\n          resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, container) ??',
    ) &&
    (sourceTreePreview.match(/resolveSourceTreePreviewRuntimeOverlayItemLayerId\(/g) ?? []).length >= 4 &&
    sourceTreePreview.includes(
      'isSourceTreePreviewPortalPointerTarget(target, container) ||\n' +
      '          runtimeOverlayItemLayerId',
    ) &&
    sourceTreePreview.includes('Portal DOM can be rendered by a separate React root') &&
    sourceTreePreview.includes(
      'container.contains(target) &&\n' +
      '          !runtimeOverlayItemLayerId &&\n' +
      '          !runtimeInteractionTarget',
    ) &&
    sourceTreePreview.includes(
      'layerId: runtimeOverlayItemLayerId,\n' +
      '            listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,\n' +
      '            preserveClickUntilActive: true,\n' +
      '            selectLayer: true,',
    ) &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR') &&
    sourceTreePreview.includes('projectSourceTreePreviewRuntimeOverlayItem(item, bestCandidate);') &&
    sourceTreePreview.includes('projectSourceTreePreviewRuntimeOverlayCollection(') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeOverlayItemCandidateScore') &&
    sourceTreePreview.includes('An ordinary runtime click selects its authored control or portal row') &&
    sourceTreePreview.includes('sourceTreePreviewHandledSelectionEvents.add(event);') &&
    sourceTreePreview.includes('Option/Alt-click is reserved for the live') &&
    sourceTreePreview.includes('selectRuntimeOverlayItemFromClick(overlayItemLayerId);') &&
    sourceTreePreview.includes('if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;') &&
    !sourceTreePreview.includes('data-wb-runtime-selection-bound') &&
    sourceTreePreview.includes('if (containsRuntimeComponent) return;') &&
    sourceTreePreview.includes('resolveSourceTreePreviewVisualBoundsPointOwnerNode') &&
    sourceTreePreview.includes('Selection already\n  // promotes that marker') &&
    (sourceTreePreview.match(/preserveClickUntilActive: true,\n\s+selectLayer: true,/g) ?? []).length >= 4 &&
    sourceTreePreview.includes('surface.contains(element)') &&
    sourceTreePreview.includes('isPointInsideSourceTreePreviewNode(') &&
    sourceTreePreview.includes('container.ownerDocument.elementsFromPoint(event.clientX, event.clientY)') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_TARGET_SELECTOR') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_TAIL_DELTA') &&
    sourceTreePreview.includes('restartedAfterMomentumTail') &&
    sourceTreePreview.includes('if (state.handled) return true;') &&
    sourceTreePreview.includes('if (event.cancelable) event.preventDefault();') &&
    !sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_REPEAT_MS') &&
    sourceTreePreview.includes('getSourceTreePreviewRuntimeWheelGestureTarget') &&
    sourceTreePreview.includes('handleSourceTreePreviewRuntimeWheelGesture') &&
    sourceTreePreview.includes("carousel.dispatchEvent(new KeyboardEventConstructor('keydown'") &&
    (sourceTreePreview.match(/shouldSourceTreePreviewRuntimeOwnPointerGesture\(event, container, selectedNode\)/g) ?? []).length >= 2 &&
    sourceTreePreview.includes("'[role=\"menuitem\"]'") &&
    sourceTreePreview.includes("'[role=\"menuitemcheckbox\"]'") &&
    sourceTreePreview.includes("'[role=\"menuitemradio\"]'") &&
    sourceTreePreview.includes("'[role=\"option\"]'") &&
    sourceTreePreview.includes("'dialog'") &&
    sourceTreePreview.includes("'[role=\"dialog\"]'") &&
    sourceTreePreview.includes("'[role=\"menu\"]'") &&
    sourceTreePreview.includes("'[role=\"tooltip\"]'") &&
    sourceTreePreview.includes("'[role=\"listbox\"]'") &&
    (sourceTreePreview.match(/runtimeInteractionTarget && runtimeActivation && !smartDeep && !additive/g) ?? []).length >= 1 &&
    sourceTreePreview.includes('isSourceTreePreviewRuntimeActivationEvent(event)') &&
    sourceTreePreview.includes('if (runtimeInteractionTarget) {\n      if (runtimeActivation && !smartDeep && !additive) {') &&
    sourceTreePreview.includes(
      'event.preventDefault();\n      event.stopPropagation();\n      if (overlayItemLayerId && !smartDeep && !additive) {',
    ) &&
    sourceTreePreview.includes("return node.kind === 'component-instance'") &&
    sourceTreePreview.includes('runtimeInteractionTarget && runtimeActivation && !smartDeep && !additive') &&
    sourceTreePreview.includes('resolveSourceTreePreviewRuntimeInteractionTarget(') &&
    sourceTreePreview.includes('findSourceTreePreviewRenderedDescendantAnchorLayerId') &&
    sourceTreePreview.includes('primaryLayerId: layerId') &&
    sourceTreePreview.includes('preserveRuntimeInteraction: false') &&
    sourceTreePreview.includes('context.preserveRuntimeInteraction ||') &&
    sourceTreePreview.includes('context.preserveRuntimeInteraction ? null') &&
    sourceTreePreview.includes('preserveRuntimeInteraction,') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_RUNTIME_PLAIN_TEXT_CHILD_NAMES'),
  'SourceTreePreview should pass real authored runtime children into structure-sensitive, child-parsing, and template-cloning roots while preserving trigger interaction, auxiliary visual-bound ownership, and native overlay light-dismiss through selectable descendants',
);
const runtimeOwnedChildProjection = sourceTreePreview.slice(
  sourceTreePreview.indexOf('function createSourceTreePreviewRuntimeOwnedChild('),
  sourceTreePreview.indexOf('function getSourceTreePreviewRuntimeTextContent('),
);
assert(
  runtimeOwnedChildProjection.includes('if (isSourceTextLeaf(node)) {') &&
    !runtimeOwnedChildProjection.includes("if (node.kind === 'text') {"),
  'Runtime-owned component children should render only source text leaves as strings and preserve authored text-bearing elements such as span and paragraph nodes',
);
assert(
  sourceTreePreview.includes("const SOURCE_TREE_PREVIEW_RUNTIME_RAW_TEXT_DESCENDANT_NAMES = new Set([") &&
    sourceTreePreview.includes("'WbdsTypingKeyword',") &&
    sourceTreePreview.includes('renderTextLeavesAsRawText: shouldRenderSourceTreePreviewRuntimeRawTextDescendants(node)') &&
    runtimeOwnedChildProjection.includes('const renderTextLeavesAsRawText = context.renderTextLeavesAsRawText ||') &&
    runtimeOwnedChildProjection.includes('selectable: childSelectable && !(renderTextLeavesAsRawText && isSourceTextLeaf(child))'),
  'Runtime-owned TypingKeyword children should keep authored element boundaries selectable while passing text leaves without editor-only wrappers',
);
const svgSourceAttributeSafety = read('src/domain/document/sourceAttributeSafety.ts');
assert(svgSourceAttributeSafety.includes("'className'"), 'Source attributes should preserve JSX className for source-backed component previews');
for (const svgAttributeName of ['d', 'gradientUnits', 'id', 'offset', 'preserveAspectRatio', 'spreadMethod', 'stopColor', 'stopOpacity', 'strokeOpacity', 'viewBox', 'x1', 'x2', 'y1', 'y2']) {
  assert(svgSourceAttributeSafety.includes(`'${svgAttributeName}'`), `Source attributes should preserve inline SVG ${svgAttributeName}`);
}
assert(
  sourceTreePreview.includes('if (!isSourceIntrinsicElementTagName(jsxName)) return null;') &&
    sourceTreePreview.includes('return jsxName;') &&
    !sourceTreePreview.includes('const hostTagName = jsxName.toLowerCase();'),
  'Source preview should preserve camelCase intrinsic SVG tag names such as radialGradient and linearGradient',
);
assert(
  sourceTreePreview.includes('const runtimePreviewNodeProps = injectRuntimePreviewNodeProps') &&
    sourceTreePreview.includes('? sourceComponent') &&
    sourceTreePreview.includes('? getSourceTreePreviewComponentNodeProps(nodeElementProps)') &&
    sourceTreePreview.includes(': getSourceTreePreviewDirectNodeProps(nodeElementProps)') &&
    sourceTreePreview.includes('(sourceComponent || intrinsicElement) &&') &&
    sourceTreePreview.includes('const runtimeIntrinsicElement = intrinsicElement && runtimePreviewNodeProps') &&
    sourceTreePreview.includes('cloneElement(intrinsicElement, runtimePreviewNodeProps)') &&
    sourceTreePreview.includes('runtimeIntrinsicElement ?? (renderedChildren.length > 0 ? renderedChildren : null)') &&
    sourceTreePreview.includes('if (injectRuntimePreviewNodeProps) {\n    return guardedNodeContent;\n  }') &&
    sourceTreePreview.includes('syncSourceTreePreviewDirectNodeAttributes(element, runtimeNodeProps, ownerNodeId)') &&
    sourceTreePreview.includes('const delegatedNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, event.currentTarget)') &&
    !sourceTreePreview.includes('data-wb-runtime-selection-anchor') &&
    !sourceTreePreview.includes('shouldInjectSourceTreePreviewRuntimeNodeProps'),
  'SourceTreePreview should project selection metadata directly onto every source-backed runtime component and intrinsic element instead of inserting DOM anchors',
);
assert(
  sourceTreePreview.includes('const hostProps = getSourceTreePreviewNativeSourceProps(sourceProps);') &&
    sourceTreePreview.includes("typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'") &&
    sourceTreePreview.includes('const nativeSourceProps = getSourceTreePreviewNativeSourceProps(node.sourceProps);') &&
    sourceTreePreview.includes('{...nativeSourceProps}') &&
    sourceTreePreview.includes('node.sourceProps,') &&
    sourceTreePreview.includes('context.assetRegistry,') &&
    sourceTreePreview.includes('node: cloneElement(intrinsicElement, {') &&
    !sourceTreePreview.includes('getSourceTreePreviewHostTagName(node, false)'),
  'Native JSX preview projection should preserve safe static props and use the same direct intrinsic path inside runtime-owned component children without tag allowlists',
);
assert(
  sourceTreePreview.includes('function useSourceTreePreviewEventCallback<Args extends unknown[], Result>') &&
    sourceTreePreview.includes('const selectLayerEvent = useSourceTreePreviewEventCallback(onSelectLayer);') &&
    sourceTreePreview.includes('const nodeDragStartEvent = useSourceTreePreviewEventCallback(handlePointerDownCapture);') &&
    sourceTreePreview.includes('onNodeDragStart={nodeDragStartEvent}') &&
    sourceTreePreview.includes('onSourceNodeComponentPropChange={sourceNodeComponentPropChangeEvent}') &&
    !sourceTreePreview.includes('onNodeDragStart={handlePointerDownCapture}'),
  'Source preview selection should keep node callback identities stable so memoized preview nodes only rerender along changed selection and drill paths',
);
assert(
  sourceTreePreview.includes('const doubleClickDrillOriginRef = useRef<SourceTreePreviewDrillOrigin | null>(null);') &&
    sourceTreePreview.includes('const pendingSingleClickSelectionRef = useRef<') &&
    sourceTreePreview.includes('SOURCE_TREE_PREVIEW_SINGLE_CLICK_COMMIT_DELAY_MS') &&
    sourceTreePreview.includes('clearPendingSingleClickSelection();') &&
    sourceTreePreview.includes("onActive: () => {\n        if (selectLayer) {") &&
    sourceTreePreview.includes('if (event.detail === 1) {') &&
    sourceTreePreview.includes('drillIntoLayerEvent(layerId, origin ?? undefined);') &&
    previewSelectionService.includes('const drillBaseIndex = getPreviewDrillBaseIndex(clickedPath, selectedNodeId, effectiveDrillPath);') &&
    previewSelectionService.includes('if (selectedNodeIndex >= 0) return selectedNodeIndex;') &&
    designEditor.includes('if (!resolution.drillTargetNodeId) return;') &&
    designEditor.includes('origin?.previewDrillPath ?? getDesignPreviewDrillPathFromSelection(currentSelection)') &&
    designEditor.includes('origin?.selectedLayerId ?? getDesignLayerIdFromSelection(currentSelection)'),
  'Canvas double-click drill-in should resolve exactly one level from the selection that existed before the first click',
);
assert(
  sourceTreePreview.includes('const copySelectionEvent = useOptionalSourceTreePreviewEventCallback(onCopySelection);') &&
    sourceTreePreview.includes('const cutSelectionEvent = useOptionalSourceTreePreviewEventCallback(onCutSelection);') &&
    sourceTreePreview.includes("previewDocument.addEventListener('keydown', handlePreviewDocumentShortcut, true)") &&
    sourceTreePreview.includes('const isDocumentRootTarget = target === previewDocument.body || target === previewDocument.documentElement;') &&
    sourceTreePreview.includes('onCopySelection: copySelectionEvent') &&
    sourceTreePreview.includes('onCutSelection: cutSelectionEvent') &&
    sourceTreePreview.includes('onPasteNode: pasteNodeEvent') &&
    sourceTreePreview.includes('onDuplicateSelection: duplicateSelectionEvent') &&
    sourceTreePreview.includes('isSourceTreePreviewEditableTarget(event.target)'),
  'Preview document shortcuts should reach source edit intents from iframe body, source nodes, and portals without hijacking editable fields',
);
assert(
  sourceTreePreview.includes("element.getAttribute('data-workbench-theme-portal-root') === 'true'"),
  'Theme portal hosts should not expand component selection geometry to the full preview viewport',
);
assert(
  sourceTreePreview.includes('SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR') &&
    sourceTreePreview.includes('primarySelectionHosts.set(rect, topLayerHost)') &&
    sourceTreePreview.includes('primarySelectionHosts.get(labelAnchorRect)') &&
    /\.wb-source-visual-selection-label\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*10001;/s.test(sourceTreePreviewFrameCss),
  'Selection rings and labels should render above content in the selected element\'s scoped Theme portal',
);
assert(
  sourceTreePreview.includes("ownerDocument.addEventListener('pointerdown', handleDocumentPointerDown, true)") &&
  sourceTreePreview.includes("ownerDocument.addEventListener('pointerup', handleDocumentPointerUp, true)") &&
  sourceTreePreview.includes("ownerDocument.addEventListener('click', handlePortalModifierClick, true)") &&
    sourceTreePreview.includes('selectPortalModifierTarget(event, modifierPressed)') &&
    sourceTreePreview.includes('const layerId = resolveSourceTreePreviewCommandHoverLayerId(') &&
    sourceTreePreview.includes('getSourceTreePreviewModifierSelectionMode(event, modifierPressed),') &&
    sourceTreePreview.includes('const modifierPressed = event.metaKey || event.ctrlKey;') &&
    sourceTreePreview.includes('suppressNextClickRef.current') &&
    sourceTreePreview.includes('pendingRuntimeGestureSelection') &&
    sourceTreePreview.includes("selectLayerFromClick(pending.layerId, 'direct', false);") &&
    sourceTreePreview.includes('sourceTreePreviewHandledSelectionEvents.add(event);') &&
    sourceTreePreview.includes(
      'const overlayItemLayerId = resolveSourceTreePreviewRuntimeOverlayItemLayerId(',
    ) &&
    sourceTreePreview.includes('type SourceTreePreviewSelectionHit = {') &&
    sourceTreePreview.includes("normalization: 'authored' | 'visual';") &&
    sourceTreePreview.includes('function resolveSourceTreePreviewSelectionHit(') &&
    sourceTreePreview.includes("hit.normalization === 'authored'") &&
    sourceTreePreview.includes("normalization: 'authored',") &&
    sourceTreePreview.includes("normalization: 'visual'") &&
    sourceTreePreview.includes(
      '// The visible control is the editor selection target by default.',
    ) &&
    sourceTreePreview.includes("'[aria-roledescription=\"carousel\"]'") &&
    sourceTreePreview.includes('previewPortalRoot === getSourceTreePreviewPortalRoot(container)') &&
    sourceTreePreview.includes('const selectionMode = getSourceTreePreviewModifierSelectionMode(event);') &&
    sourceTreePreview.includes('selectLayerEvent(layerId, selectionMode, event.shiftKey)') &&
    sourceTreePreview.includes('container.contains(themePortalRoot)') &&
    sourceTreePreview.includes(
      'projectSourceTreePreviewControlledSurfaceOwnership(container, root);',
    ) &&
    sourceTreePreview.includes('}, [previewDocument, root]);') &&
    sourceTreePreview.includes(
      "attributeFilter: ['aria-controls', 'id', 'open', 'popover', 'class']",
    ) &&
    sourceTreePreview.includes(
      'function projectSourceTreePreviewControlledSurfaceOwnership(',
    ) &&
    sourceTreePreview.includes(
      "for (const trigger of container.querySelectorAll<HTMLElement>('[aria-controls]'))",
    ) &&
    sourceTreePreview.includes(
      'projectSourceTreePreviewRuntimeOverlayCollection(\n          controlledSurface,\n          projectedOwnerNode,\n          root,',
    ) &&
    sourceTreePreview.includes(
      'SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS',
    ) &&
    sourceTreePreview.includes(
      '// A portal event belongs to the preview even during the brief interval',
    ),
  'Command-click should directly select source nodes inside open preview and scoped Theme portals without firing their runtime action',
);
assert(
  sourceTreePreview.includes('getSourceTreePreviewSelectionLabelOverlay(container, labelHost, labelAnchorRect, label)') &&
    sourceTreePreview.includes('getSourceTreePreviewSelectionLabelViewport(container)') &&
    sourceTreePreview.includes('createPortal(\n        <span\n          aria-hidden="true"\n          className="wb-source-visual-selection-label"') &&
    sourceTreePreviewFrameCss.includes('--wb-editor-font-sans: Inter, system-ui') &&
    /\.wb-source-visual-selection-label\s*\{[^}]*position:\s*fixed;[^}]*font:\s*400 11px\/1\.25 var\(--wb-editor-font-sans\);/s.test(sourceTreePreviewFrameCss) &&
    !/\.wb-source-visual-selection-label\s*\{[^}]*font:[^}]*var\(--wb-font-sans/s.test(sourceTreePreviewFrameCss) &&
    !sourceTreePreviewFrameCss.includes('.wb-source-visual-selection-label--inside') &&
    !sourceTreePreviewFrameCss.includes('.wb-source-visual-selection-label--align-right'),
  'Selection labels should stay readable and clamp to the preview viewport through a non-layout portal overlay',
);
assert(
  sourceTreePreview.includes('commandHoverModifierPressedRef') &&
    sourceTreePreview.includes('resolveSourceTreePreviewCommandHoverLayerId') &&
    sourceTreePreview.includes(
      'const targetRuntimeOwner = resolveSourceTreePreviewClosestRuntimeOwnerNode(target, container);',
    ) &&
    sourceTreePreview.includes(
      "getSourceTreePreviewSelectionElement(targetRuntimeOwner, container, 'direct')",
    ) &&
    sourceTreePreview.includes('resolveSourceTreePreviewVisualSelectionBoundaryId') &&
    sourceTreePreview.includes('resolveEditableTreeSelectionBoundary(root, nodeId)?.selectableNode.id') &&
    sourceTreePreview.includes("if (selectableNode?.kind !== 'text') return selectableNodeId;") &&
    sourceTreePreview.includes('findEditableTreeParent(root, selectableNodeId)?.id ?? selectableNodeId') &&
    sourceTreePreview.includes("event.metaKey || event.ctrlKey") &&
    sourceTreePreview.includes('variant="hover"') &&
    sourceTreePreview.includes('SourceTreePreviewMeasurementOverlay') &&
    sourceTreePreview.includes('getSourceTreePreviewBoxModelBands') &&
    sourceTreePreview.includes('getSourceTreePreviewMeasurementElement') &&
    sourceTreePreview.includes('getSourceTreePreviewInternalGapLines') &&
    sourceTreePreview.includes('getSourceTreePreviewAxisDistance') &&
    sourceTreePreview.includes('const selectedContainsHovered = selectedStart <= hoveredStart && hoveredEnd <= selectedEnd;') &&
    sourceTreePreview.includes("if (childLayerId && childLayerId !== layerId) break;") &&
    sourceTreePreview.includes('getSourceTreePreviewDistanceLines') &&
    sourceTreePreview.includes("kind: isGap ? 'gap' : 'distance'") &&
    sourceTreePreview.includes('const hoveredCenterX = hoveredRect.left + hoveredRect.width / 2;') &&
    sourceTreePreview.includes('const hoveredCenterY = hoveredRect.top + hoveredRect.height / 2;') &&
    sourceTreePreview.includes("kind: 'guide'") &&
    sourceTreePreview.includes('selectedConnectionY = clampSourceTreePreviewRange(hoveredCenterY, selectedRect.top, selectedRect.bottom)') &&
    sourceTreePreview.includes('selectedConnectionX = clampSourceTreePreviewRange(hoveredCenterX, selectedRect.left, selectedRect.right)') &&
    sourceTreePreview.includes("height: line.orientation === 'vertical' ? line.length : 1") &&
    sourceTreePreview.includes("width: line.orientation === 'horizontal' ? line.length : 1") &&
    sourceTreePreview.includes('const commandHoverSelectionLayerId = commandHoverLayerId &&') &&
    sourceTreePreview.includes('const resolvedLayerId = nextLayerId && nextLayer ? nextLayerId : null;') &&
    sourceTreePreview.includes('if (selectedLayerId === hoveredLayerId) return { bands, lines: internalGapLines };') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-selection-ring--hover') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-measurement-band--padding') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-measurement-band--margin') &&
    /\.wb-source-visual-measurement-band\s*\{[^}]*overflow:\s*visible;/s.test(sourceTreePreviewFrameCss) &&
    /\.wb-source-visual-selection-label\[data-variant='hover'\]\s*\{[^}]*background:[^}]*color:[^}]*\}/s.test(sourceTreePreviewFrameCss) &&
    !/\.wb-source-visual-selection-label\[data-variant='hover'\]\s*\{[^}]*(?:border|box-shadow):/s.test(sourceTreePreviewFrameCss) &&
    /\.wb-source-visual-measurement-line\s*\{[^}]*background:\s*var\(--wb-measurement\);/s.test(sourceTreePreviewFrameCss) &&
    /\.wb-source-visual-measurement-band > span,[^{]*\.wb-source-visual-measurement-line > span\s*\{[^}]*border-radius:\s*0;[^}]*padding:\s*1px 3px;[^}]*background:\s*var\(--wb-measurement\);[^}]*font:\s*400 10px\/1\.2 var\(--wb-editor-font-sans\);/s.test(sourceTreePreviewFrameCss) &&
    /\.wb-source-visual-measurement-band--padding > span\s*\{[^}]*background:\s*var\(--wb-measurement-padding\);/s.test(sourceTreePreviewFrameCss) &&
    /\.wb-source-visual-measurement-band--margin > span\s*\{[^}]*background:\s*var\(--wb-measurement-margin\);/s.test(sourceTreePreviewFrameCss) &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-measurement-line--guide.wb-source-visual-measurement-line--horizontal') &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-measurement-line--guide.wb-source-visual-measurement-line--vertical') &&
    !/\.wb-source-visual-measurement-(?:band|line)[^{]*\{[^}]*text-shadow:/s.test(sourceTreePreviewFrameCss) &&
    sourceTreePreviewFrameCss.includes('.wb-source-visual-measurement-line--gap'),
  'Command-hover should measure selected nodes without duplicating their ring and expose anchored, high-contrast live distance, gap, padding, and margin measurements',
);
assert(
  designEditor.includes('[selection.extensions.previewTokenModes, tokenRegistry]') &&
    !designEditor.includes('PREVIEW_TOKEN_MODES_EXTENSION') &&
    !designEditor.includes('[selection, tokenRegistry],\n  );\n  const previewAppearance'),
  'Design selection changes should not recreate unchanged preview token mode objects and invalidate every memoized preview node',
);
assert(
  sourceTreePreview.includes('className="wb-source-visual-runtime-loading-spinner"') &&
    sourceTreePreview.includes('aria-label={`Loading ${label} preview`}') &&
    /\.wb-source-visual-runtime-diagnostic--loading\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*max-width:\s*none;[^}]*border:\s*0;[^}]*padding:\s*0;/s.test(sourceTreePreviewFrameCss) &&
    sourceTreePreviewFrameCss.includes('@media (prefers-reduced-motion: reduce)'),
  'Runtime component loading should use a compact accessible spinner instead of the full diagnostic box',
);
assert(
  sourceTreePreview.includes('getSourceTreePreviewRuntimeWrapperForwardClassName(authoredClassName)') &&
    sourceTreePreview.includes('runtimeWrapperForwardClassName') &&
    sourceTreePreviewTailwindRuntime.includes('export function getSourceTreePreviewRuntimeWrapperForwardClassName') &&
    sourceTreePreviewTailwindRuntime.includes('isTailwindRuntimeWrapperForwardUtility(utility)') &&
    sourceTreePreviewTailwindRuntime.includes('`${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > *${selectorSuffix ?? \'\'}'),
  'Runtime source-preview wrappers should forward layout-sensitive authored className utilities to the real rendered child instead of swallowing flex/sizing/position classes',
);

const sourceWriteback = read('src/domain/document/editableTreeSourceWriteback.ts');
assert(
  sourceWriteback.includes('applySourceReferencedArrayExpressionWriteback') &&
    sourceWriteback.includes('findReferencedArrayExpressionBySourceCode') &&
    read('src/domain/document/editableTreeSourceSession.ts').includes("'referenced-array-expression'") &&
    designInspectorPanelSource.includes('sourceMapBinding') &&
    designInspectorPanelSource.includes('Editable source array') &&
    designInspectorPanelSource.includes('Read-only data source'),
  'Binding should route static map arrays through source provenance, writer availability, and source history',
);
for (const tagName of ['article', 'aside', 'fieldset', 'footer', 'form', 'header', 'main', 'nav']) {
  assert(sourceWriteback.includes(`| '${tagName}'`) && sourceWriteback.includes(`jsxName: '${tagName}'`) && sourceWriteback.includes(`<${tagName}>`), `${tagName} should be a first-class source child template, not only a parsed raw HTML fallback`);
}
assert(sourceWriteback.includes("| 'unordered-list'") && sourceWriteback.includes("jsxName: 'ul'") && sourceWriteback.includes('<ul>'), 'ul should be a first-class source child template with a valid list item snippet');
assert(sourceWriteback.includes("| 'ordered-list'") && sourceWriteback.includes("jsxName: 'ol'") && sourceWriteback.includes('<ol>'), 'ol should be a first-class source child template with a valid list item snippet');
assert(sourceWriteback.includes("| 'text'") && sourceWriteback.includes("label: 'Text'") && sourceWriteback.includes('<p>New text</p>'), 'Text should be a searchable source child template alias for paragraph text in shadcn-style stacks');
assert(sourceWriteback.includes("| 'svg'") && sourceWriteback.includes("jsxName: 'svg'") && sourceWriteback.includes('<svg aria-hidden="true"'), 'svg should be a first-class source child template for currentColor icons');
assert(
  sourceWriteback.includes("{ id: 'icon', label: 'Icon', jsxName: 'svg' }") &&
    sourceWriteback.includes('svg?: string;') &&
    sourceWriteback.includes('formatSourceIconChildSnippet') &&
    sourceWriteback.includes('isSafeInlineSvgSnippet(iconDefault.svg)') &&
    sourceWriteback.includes('formatAttributeText(\'data-icon\', \'inline-start\')') &&
    sourceWriteback.includes('SOURCE_ASSET_SOURCE_ATTRIBUTE') &&
    sourceWriteback.includes('applySourceInlineSvgIconWriteback') &&
    sourceWriteback.includes('formatAttributeText(\'width\', \'0.875em\')') &&
    sourceWriteback.includes('formatAttributeText(\'height\', \'0.875em\')') &&
    sourceWriteback.includes('stroke="currentColor"') &&
    !sourceWriteback.includes("return `<img ${attributes.join(' ')} />`;"),
  'Icon child insertion should create replaceable inline currentColor 0.875em SVG, not an image tag',
);
assert(
  sourceWriteback.includes('function isSafePlainTextJsxChildren') &&
    sourceWriteback.includes('escapeJsxTextContent(jsxChildren)'),
  'Component sourceInsert should allow safe plain text jsxChildren so shadcn Text inserts visible text instead of being rejected',
);
assert(
  sourceWriteback.includes("| 'grid-template-columns'") &&
    sourceWriteback.includes("| 'grid-template-rows'") &&
    sourceWriteback.includes("'grid-template-columns',") &&
    sourceWriteback.includes("'grid-template-rows',"),
  'Source style writeback should allow grid template columns and rows from the Inspector',
);
assert(
  sourceWriteback.includes("| 'stroke'") &&
    sourceWriteback.includes("| 'stroke-width'") &&
    sourceWriteback.includes("| 'stroke-linecap'") &&
    sourceWriteback.includes("| 'stroke-linejoin'") &&
    sourceWriteback.includes("'stroke-width',"),
  'Source style writeback should allow SVG stroke style declarations from the Inspector',
);
assert(
  sourceWriteback.includes('applySourceComponentTypeWriteback') &&
    sourceWriteback.includes('function createSourceComponentTypeEdit') &&
    sourceWriteback.includes('managedPropNames') &&
    sourceWriteback.includes('propOverrides') &&
    sourceWriteback.includes("kind: 'source-jsx-component-type'"),
  'Source writeback should support JSX component type conversion while preserving unmanaged props and migrating managed chart props',
);
assert(
  read('src/domain/document/editableTreeSourceSession.ts').includes('commitSourceComponentTypeSessionEdit') &&
    read('src/domain/document/editableTreeSourceInspector.ts').includes('commitAndPersistSourceInspectorComponentType'),
  'Chart type conversion should travel through the same source inspector session, persistence, and history path as other source-backed edits',
);
const htmlInspectorSchema = read('src/domain/inspector/htmlInspectorSchema.ts');
for (const tagName of ['article', 'aside', 'fieldset', 'footer', 'form', 'header', 'main', 'nav', 'ol', 'ul']) {
  assert(htmlInspectorSchema.includes(`'${tagName}'`), `${tagName} should be recognized as an inspectable HTML container`);
}
assert(
  htmlInspectorSchema.includes("| 'stroke'") &&
    htmlInspectorSchema.includes("| 'fill'") &&
    htmlInspectorSchema.includes('SVG_GRAPHIC_TAGS') &&
    htmlInspectorSchema.includes('hasVectorStyleFields'),
  'HTML inspector schema should expose Fill and Stroke sections for SVG graphic elements',
);
const vectorFieldRegistry = read('src/domain/inspector/inspectorFieldRegistry.ts');
assert(
  vectorFieldRegistry.includes("styleProperty: 'fill'") &&
    vectorFieldRegistry.includes("styleProperty: 'fill-opacity'") &&
    vectorFieldRegistry.includes("styleProperty: 'stroke-opacity'") &&
    vectorFieldRegistry.includes("styleProperty: 'stroke-dasharray'"),
  'Inspector field registry should expose SVG paint properties as source-style fields',
);
assert(
  /id: 'fill\.color'[\s\S]{0,240}tokenField: 'bgColor'/.test(vectorFieldRegistry) &&
    /id: 'stroke\.color'[\s\S]{0,240}tokenField: 'borderColor'/.test(vectorFieldRegistry),
  'SVG fill and stroke colors should bind to color tokens so the Inspector offers a token picker',
);
const tokenPreviewPanel = read('src/features/workbench-shell/ui/DesignInspectorPanel.tsx');
assert(
  tokenPreviewPanel.includes('function getSelectedNodePreviewTokenContext') &&
    tokenPreviewPanel.includes('getCollectionModeSelectorAttribute') &&
    tokenPreviewPanel.includes('getPreviewColorSchemeSide'),
  'Inspector token previews should derive their mode and colour scheme from the rendered preview',
);
assert(
  !/findSourceStyleTokenResult\(tokenRegistry, tokenField, value, previewTokenModes\)/.test(tokenPreviewPanel) &&
    tokenPreviewPanel.includes('findSourceStyleTokenResult(tokenRegistry, tokenField, value, resolvedTokenModes)'),
  'Token swatches must resolve against the modes the selected node renders under, not the panel-level mode selection',
);
assert(
  /function formatSourceStyleTokenRawValue\([\s\S]{0,200}colorSchemeSide: WorkbenchColorSchemeSide/.test(tokenPreviewPanel),
  'Token preview values must fold light-dark() with the previewed colour scheme instead of always using the light side',
);
const sourceStyleWriteback = read('src/domain/document/editableTreeSourceWriteback.ts');
for (const property of ['fill', 'fill-opacity', 'fill-rule', 'stroke-opacity', 'stroke-dasharray']) {
  assert(
    sourceStyleWriteback.includes(`| '${property}'`) && sourceStyleWriteback.includes(`  '${property}',`),
    `Source style writeback should accept ${property} in both the type union and the runtime allowlist`,
  );
}
assert(
  htmlInspectorSchema.includes('SVG_DEFINITION_TAGS') &&
    htmlInspectorSchema.includes("'lineargradient'") &&
    htmlInspectorSchema.includes("'radialgradient'") &&
    htmlInspectorSchema.includes("'stop'"),
  'SVG definition elements should be classified separately from generic layout containers',
);
assert(
  designInspectorPanelSource.includes('function InspectorSvgSourceSection') &&
    designInspectorPanelSource.includes('isSvgInspectorElementName(elementName)') &&
    designInspectorPanelSource.includes('Object.keys(attributes)') &&
    designInspectorPanelSource.includes('wb-inspector-svg-source-attributes') &&
    designInspectorPanelSource.includes('onSourceAttributeChange(attributeName'),
  'The Inspector should expose authored SVG source attributes and route edits through source writeback',
);
assert(
  read('src/domain/inspector/inspectorFieldRegistry.ts').includes("model.sections.includes('content') ? resolveContentFields(context) : []"),
  'Inspector content fields should respect the model so inline SVG roots do not expose an unrelated media source control',
);

const historyController = read('src/domain/history/historyController.ts');
assert(
  historyController.includes('const FALLBACK_MERGE_WINDOW_MS = 2000') &&
    historyController.includes('if (previous.mergeSessionId || next.mergeSessionId)') &&
    historyController.includes('return areTransactionsInFallbackMergeWindow(previous, next);'),
  'History merge keys without an explicit merge session should not merge undo entries forever',
);
assert(
  designEditor.includes("function shouldIgnoreDesignHistoryShortcut(target: EventTarget | null): boolean {\n  if (document.querySelector('.wb-modal-backdrop')) return true;") &&
    designEditor.includes("window.addEventListener('keydown', handleDesignHistoryShortcut, true)") &&
    designEditor.includes("window.addEventListener('beforeinput', handleDesignHistoryBeforeInput, true)"),
  'Design history shortcuts should not leak into open modal editors such as chart CSV tables',
);
const sourcePersistence = read('src/domain/document/editableTreeSourcePersistence.ts');
assert(
  sourcePersistence.includes('normalize: false') &&
    sourcePersistence.includes('adapters.writeSourceFile(subject.sourceFile, plan.contents'),
  'Source history persistence should write the exact history snapshot so undo/redo is not invalidated by write normalization',
);
assert(
  designEditor.includes('normalizeWorkbenchSourceWriteContents(left) === normalizeWorkbenchSourceWriteContents(right)'),
  'Design source history hydration should tolerate legacy histories that differ only by source write normalization',
);
assert(
  designEditor.includes('closeDesignTarget(activeDesignTarget);') &&
    designEditor.includes("event.altKey && !event.shiftKey && isDesignShortcutKey(event, 'w', 'KeyW')") &&
    designEditor.includes('closeActiveDesignTargetCommandRef.current();'),
  'Design editor should close the active source target tab from the Alt+W shortcut',
);
assert(
  designEditor.includes('reorderWorkbenchOpenDesignTargetKeys(') &&
    designEditor.includes('function reorderDesignTargetTab(') &&
    designSourceNavigatorSource.includes("return draggedIndex < targetIndex ? 'after' : 'before';") &&
    designSourceNavigatorSource.includes('draggedTargetKeyRef.current = targetKey;') &&
    designSourceNavigatorSource.includes('onReorderTarget(draggedTargetKey, targetKey, position);') &&
    workbenchEditorShell.includes('draggable={draggable}') &&
    workbenchEditorShell.indexOf('className="wb-editor-target-tab-close"') <
      workbenchEditorShell.indexOf('{editingControl ? ('),
  'Design target tabs should persist drag ordering with whole-tab directional drop zones and render close before title',
);
assert(
  designEditor.includes('moveSelectedDesignLayerFromKeyboard(globalMoveIntent)') &&
    designEditor.includes('allowUnmodifiedVertical: isStructureShortcutTarget') &&
    designEditor.includes('if (!isStructureShortcutTarget) return;') &&
    designEditor.includes('.wb-popover-panel, .wb-modal, .wb-modal-backdrop') &&
    designEditor.includes("if (event.key === 'ArrowUp' && (event.altKey || allowUnmodifiedVertical)) return { kind: 'reorder', offset: -1 };"),
  'Design editor should provide a focus-independent Alt+Arrow keyboard move path while preserving editable/modal exclusions',
);
assert(
  designEditor.includes("!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && isDesignShortcutKey(event, 'i', 'KeyI')") &&
    designEditor.includes('openSelectedComponentPicker();') &&
    designEditor.includes('target === document.body || target === document.documentElement') &&
    designEditor.includes('htmlTemplates={getSourceInsertTemplatesForNode(selectedSourceNode)}') &&
    designEditor.includes('onSelectHtmlTemplate={(template) => {') &&
    designEditor.includes('Add child node (I)'),
  'Design editor should use unmodified I as the host-safe insert shortcut and open the same child picker surface as the layer tree add button',
);
assert(
  designEditor.includes("isModifierPressed && !event.altKey && !event.shiftKey && key === 'c'") &&
    designEditor.includes("isModifierPressed && !event.altKey && !event.shiftKey && key === 'x'") &&
    designEditor.includes("isModifierPressed && !event.altKey && key === 'v'") &&
    designEditor.includes("isModifierPressed && !event.altKey && !event.shiftKey && key === 'd'") &&
    designEditor.includes("target.closest('.wb-design-layer-list, .wb-source-visual-preview, .wb-runtime-design-preview')") &&
    designEditor.includes('async function cutSourceSelectionToClipboard()') &&
    designEditor.includes("await updateSourceInspectorStructure('delete');") &&
    designEditor.includes('const lastDesignSourceEditShortcutRef = useRef<') &&
    designEditor.includes('if (previous?.action === action && timestamp - previous.timestamp < 120) return;') &&
    designEditor.includes("executeDesignSourceEditShortcut('copy')") &&
    designEditor.includes("executeDesignSourceEditShortcut('cut')") &&
    designEditor.includes("executeDesignSourceEditShortcut('duplicate')") &&
    designEditor.includes("value.action === 'copy' || value.action === 'cut'") &&
    read('src/page-preview.tsx').includes("if (!event.shiftKey && key === 'x') return { action: 'cut' };"),
  'Design editor source shortcuts should expose copy, cut, paste, and duplicate across layer, source preview, runtime story, and runtime page contexts',
);
assert(
  designEditor.includes('async function duplicateSourceSelection()') &&
    designEditor.includes("await commitSourceInspectorPasteNode(clipboard, 'below', selectedLayer, selectedSourceNode);") &&
    designEditor.indexOf("isModifierPressed && !event.altKey && !event.shiftKey && key === 'd'") <
      designEditor.indexOf('const isStructureShortcutTarget = isDesignStructureShortcutTarget(event.target);'),
  'Cmd/Ctrl+D should duplicate through the same-file clipboard paste path before applying layer-tree-only focus filtering',
);
assert(
  designEditor.includes('applySourceMoveNodesWriteback({') &&
    designEditor.includes('getPredictedSourceMoveSelectionIds(nodes, currentTargetParentNode, targetIndex)') &&
    designEditor.includes('resolveDesignMovableSourceNodes({') &&
    designEditor.includes('Move selection requires editable, non-overlapping source-backed layers.') &&
    sourceWriteback.includes('const targetSourceEntries = sourceEntries') &&
    sourceWriteback.includes('Move selection cannot contain both a source layer and one of its descendants.') &&
    sourceWriteback.includes(
      'getEditableJsxClosingInsertionPoint(command.contents, targetInfo.closingStart)',
    ) &&
    editableTreeSourceLayerTreeSource.includes('const targetSourceIndexes = resolvedSourcePaths') &&
    designEditor.includes('restoreMovedDesignLayerSelectionAfterSourceRefresh(') &&
    sourceTreePreview.includes('const pointerIsMultiSelected = Boolean(') &&
    sourceTreePreview.includes('resolveSourceTreePreviewPointerMultiSelectedNode(') &&
    sourceTreePreview.includes('selectedNodes: multiDragNodes'),
  'Layer-tree and canvas drags should move exact multi-selected source layers across parents while rejecting only overlapping ancestor-descendant selections',
);
assert(
  !designEditor.includes('Nested instance source layers cannot be copied from the preview yet.') &&
    designEditor.includes('Authored slot children can sit under a component') &&
    designEditor.includes("hasDesignSourceNodeCapability(root, node.id, 'canCopy')") &&
    designEditor.includes("hasDesignSourceNodeCapability(root, selectedNode.id, 'canCopy')") &&
    sourceWriteback.includes('requiresSameSourceFile: boolean;') &&
    sourceWriteback.includes('sameFileRiskReasons: string[]') &&
    sourceWriteback.includes('if (isSourceClipboardSameFileRisk(interactionRisk))') &&
    !sourceWriteback.includes('can only be pasted into its original source file') &&
    editableTreeSourceInspector.includes('clipboardSourceFile?: string;') &&
    read('src/domain/document/editableTreeSourceSession.ts').includes('requiresSameSourceFile: command.requiresSameSourceFile') &&
    designEditor.includes('clipboardSourceFile: clipboard.sourceFile') &&
    designEditor.includes('requiresSameSourceFile: clipboard.requiresSameSourceFile') &&
    designEditor.includes('formatCrossFileClipboardWarning(clipboard, pasteTargetSourceFile)') &&
    designEditor.includes('showDesignEditorWarningToast(crossFileWarning)') &&
    designEditor.includes('wb-design-editor-toast'),
  'Copy should allow source-local bindings inside payloads, and a cross-file paste should land with a visible warning toast instead of being refused',
);
assert(
  designEditor.includes('function isDesignLayerAdditiveSelectionEvent') &&
    designEditor.includes('return event.shiftKey;') &&
    designEditor.includes("const mode = event.metaKey || event.ctrlKey\n          ? 'smart-deep'\n          : 'direct';") &&
    !designEditor.includes('event.metaKey || event.ctrlKey || additive'),
  'Design preview selection should keep Shift additive while Command uses smart-deep selection',
);

const projectWorkspace = read('src/features/workbench-shell/ui/ProjectWorkspace.tsx');
const componentLibraryImport = read('src/domain/project/workbenchComponentLibraryImport.ts');
assert(
  projectWorkspace.includes("const AssetManager = lazy(() => import('./AssetManager')") &&
    projectWorkspace.includes("const DesignEditor = lazy(() => import('./DesignEditor')") &&
    projectWorkspace.includes("const StorybookLibrary = lazy(() => import('./StorybookLibrary')") &&
    projectWorkspace.includes("const TokenEditor = lazy(() => import('./TokenEditor')") &&
    projectWorkspace.includes("import type { TokenEditorSaveStatus, TokenEditorSessionState } from './TokenEditor';") &&
    !projectWorkspace.includes("import { AssetManager } from './AssetManager';") &&
    !projectWorkspace.includes("import { StorybookLibrary, type StorybookActiveTarget } from './StorybookLibrary';") &&
    !projectWorkspace.includes("import { TokenEditor, type TokenEditorSaveStatus"),
  'Project workspace should keep each heavy authoring surface out of the initial shell bundle',
);
assert(
  projectWorkspace.includes("await import('@domain/project/workbenchComponentLibraryImport')") &&
    projectWorkspace.includes('WorkbenchComponentLibraryImportItem,') &&
    componentLibraryImport.includes('export async function importWorkbenchComponentLibrary') &&
    !projectWorkspace.includes("from '@domain/project/workbenchProjectRegistryOperations'") &&
    !projectWorkspace.includes("from '../../../workbench-stories/propRegistry'") &&
    !projectWorkspace.includes("from '@domain/design-system/tokens/importSource'"),
  'Project workspace should load the explicit component-library import pipeline only after an import or re-import action',
);
assert(
  projectWorkspace.includes("if (activeSurface !== 'design') return undefined;") &&
    projectWorkspace.includes("import('@domain/project/workbenchProjectClassCatalog')") &&
    projectWorkspace.includes('createWorkbenchProjectClassCatalog(sources)') &&
    !projectWorkspace.includes('createWorkbenchProjectClassCatalog,') &&
    !projectWorkspace.includes('createEmptyWorkbenchProjectClassCatalog,'),
  'Project workspace should load the CSS class catalog parser only when the Design surface needs it',
);
const lazyWorkbenchShell = read('src/features/workbench-shell/ui/WorkbenchShell.tsx');
const hostConnectionPanel = read('src/features/workbench-shell/ui/HostConnectionPanel.tsx');
assert(
  lazyWorkbenchShell.includes("const OpenSourceLicensesModal = lazy(() => import('./OpenSourceLicensesModal')") &&
    lazyWorkbenchShell.includes('openSourceLicensesOpen ? (') &&
    lazyWorkbenchShell.includes('<Suspense fallback={null}>') &&
    !lazyWorkbenchShell.includes("import { OpenSourceLicensesModal } from './OpenSourceLicensesModal';"),
  'Workbench shell should load the open-source license notices only after the licenses modal is opened',
);

assert(
  projectWorkspace.includes("if (projectLoadResult.status === 'error')") &&
    projectWorkspace.includes('role="alert"') &&
    projectWorkspace.includes('onRetryProject'),
  'Project workspace should expose project load errors and a visible recovery action',
);
assert(
  projectWorkspace.includes("const PROJECT_DEPENDENCY_INSTALL_STATUS_PATH = '.workbench/dependency-install.json';") &&
    projectWorkspace.includes('const previousDependencyInstallStatusRef = useRef(snapshotDependencyInstall?.status);') &&
    projectWorkspace.includes('const refreshLiveDependencyInstall = useCallback(async () => {') &&
    projectWorkspace.includes('notifyWorkbenchProjectChange(PROJECT_DEPENDENCY_INSTALL_STATUS_PATH);') &&
    projectWorkspace.includes('void refreshLiveDependencyInstall();\n    const timer = window.setInterval') &&
    projectWorkspace.includes('if (normalizedPath === PROJECT_DEPENDENCY_INSTALL_STATUS_PATH) {') &&
    projectWorkspace.includes('setLiveDependencyInstall(await readWorkbenchProjectDependencyInstall());'),
  'Project workspace should clear the dependency-install notice from status transitions, immediate host reads, and install status file events',
);
assert(projectWorkspace.includes('PROJECT_LIBRARY_CSS_HOST_MEDIA') && projectWorkspace.includes('styleNode.media = PROJECT_LIBRARY_CSS_HOST_MEDIA'), 'Project library CSS should be inert in the Workbench host and enabled only inside preview iframes');
assert(projectWorkspace.includes('libraryCssRefreshKey') && projectWorkspace.includes('setLibraryCssRefreshKey((version) => version + 1)'), 'Project library CSS should be reloaded after live token registry changes so preview iframes do not keep stale CSS clones');
assert(
  projectWorkspace.includes('const optionalLibraryCssPaths = new Set(getProjectLibraryCssPaths(liveComponents));') &&
    projectWorkspace.includes('if (optionalMissingCssPaths.has(path))'),
  'Missing inferred library CSS should remain optional while configured and explicitly imported project CSS still reports load failures',
);
assert(
  componentLibraryImport.includes('function getStoryControlCandidates') &&
    componentLibraryImport.includes('function getStoryControlType') &&
    componentLibraryImport.includes('const control = candidate.control') &&
    componentLibraryImport.includes("if (typeof control === 'string' && control.trim()) return control.trim();"),
  'Project import metadata should normalize legacy control fields before writing component story props',
);
assert(
  projectWorkspace.includes('pendingSelectionSaveRef') &&
    projectWorkspace.includes('selectionSaveTimeoutRef') &&
    projectWorkspace.includes('scheduleSelectionSave') &&
    projectWorkspace.includes('window.setTimeout(() =>') &&
    projectWorkspace.includes('}, 500);') &&
    projectWorkspace.includes('flushPendingSelectionSave'),
  'Project workspace should debounce selection file writes so layer selection and prop editing do not trigger project watchers on every click',
);
assert(
  projectWorkspace.includes('const moduleResolutionCacheRef = useRef(new Map<string, Promise<string | null>>());') &&
    projectWorkspace.includes('moduleResolutionCacheRef.current.clear();') &&
    projectWorkspace.includes('moduleResolutionCache: moduleResolutionCacheRef.current,') &&
    projectWorkspace.includes('resolveProjectSourceModulePathCached') &&
    projectWorkspace.includes('moduleResolutionCache.set(normalized, promise)') &&
    projectWorkspace.includes('await readSourceFile(candidate, { allowMissing: true })'),
  'Project CSS import crawling should share one local module resolution cache across the preview and class-catalog scans, drop it on every project change, and probe extension candidates as allow-missing reads',
);
assert(
  projectWorkspace.includes('getActiveProjectPreviewCssSourceFiles') &&
    projectWorkspace.includes('designSelection.activeTarget?.sourceFile') &&
    projectWorkspace.includes("activeSurface === 'storybook' && storybookActiveTarget?.kind === 'component'") &&
    !projectWorkspace.includes('...pages.pages.map((page) => page.sourceFile)') &&
    !projectWorkspace.includes('getProjectComponentSourceFiles(components)'),
  'Project preview CSS import crawling should follow only the active design/storybook source instead of every registered page/component',
);
assert(
  projectWorkspace.includes("getStringExtension(extensions, 'childrenSlotKind')") &&
    projectWorkspace.includes("registerSourceSlotKind(importName, inferred.childrenSlotKind ?? 'leaf', { preserveKnownChildContract })") &&
    projectWorkspace.includes("getStringExtension(component.extensions, 'libraryId') === 'shadcn-base'") &&
    projectWorkspace.includes("value === 'block' || value === 'inline' || value === 'leaf'"),
  'Project workspace should replay source-inferred children slot metadata, including explicit leaf contracts',
);
assert(componentLibraryImport.includes('stagedFiles.length === 0 && tokenRegistryImports.length === 0'), 'Library import should allow token registry reimports without component file changes');
assert(componentLibraryImport.includes('writeWorkbenchSourceFile(tokenImport.path, tokenImport.contents'), 'Library import should refresh the library snapshot tokens.json on reimport');
assert(componentLibraryImport.includes('tokenRegistryImports.map((tokenImport) => tokenImport.registry)'), 'Library import should merge parsed token registries into the live token registry');
assert(projectWorkspace.includes('isWorkbenchSelectionStale(selection, currentSelection)'), 'Project workspace should ignore older disk selection snapshots so sync cannot roll back the latest selection');
assert(!projectWorkspace.includes('const firstPage = snapshot.pages.pages[0]') && !projectWorkspace.includes('const firstComponent = snapshot.components.components[0]'), 'Project workspace design selection should allow no active page/component instead of falling back to the first target');
assert(projectWorkspace.includes("createSelectionForSurface(workspaceSelection, 'design', liveSnapshot, { updateTimestamp: false })"), 'Derived design selection should preserve updatedAt so project load does not look like a new selection every render');

const editableTreeProjectSource = read('src/domain/document/editableTreeProjectSource.ts');
assert(!editableTreeProjectSource.includes('const firstReadyPage') && !editableTreeProjectSource.includes('const firstComponent'), 'Editable project source should not fall back to the first page/component when selection is empty');
assert(editableTreeProjectSource.includes("diagnostic: 'No page or component is open.'"), 'Editable project source should represent empty design selection as an intentional no-open-target state');

const workbenchShell = read('src/features/workbench-shell/ui/WorkbenchShell.tsx');
assert(!workbenchShell.includes('setInterval(sync'), 'Project snapshot sync should not poll on an interval because stale disk reads can overwrite live registry/selection state');
assert(
  workbenchShell.includes("const PROJECT_FOLDER_ALREADY_EXISTS_MESSAGE = 'Project folder already exists.'") &&
    workbenchShell.includes("title: 'Project already exists'") &&
    workbenchShell.includes('Choose another project name or location.') &&
    workbenchShell.includes("setProjectActionState('idle');"),
  'Duplicate project creation should stop the busy state and explain how to recover',
);
assert(
  workbenchShell.includes('retryWorkbenchProjectDependencies') &&
    workbenchShell.includes("current.recovery === 'retry-dependency-install'"),
  'Workbench shell should route dependency-install failures through the host retry path',
);
assert(
  workbenchShell.includes('options.message ??') &&
    workbenchShell.includes('Installing dependencies and preparing the workspace…') &&
    projectWorkspace.includes('wb-workspace-notice--installing') &&
    projectWorkspace.includes('component previews will appear automatically when ready.') &&
    styles.includes('.wb-workspace-notice--installing > svg') &&
    styles.includes('animation: wb-spin 0.8s linear infinite;'),
  'Project creation should visibly explain dependency installation before and after the workspace becomes ready',
);
const mainEntrypoint = read('src/main.tsx');
assert(!mainEntrypoint.includes('React.StrictMode'), 'Workbench shell should not run under StrictMode because double-mounted effects are visible as preview remounts in the editor');

assert(!designEditor.includes('SOURCE_EXTERNAL_REFRESH_INTERVAL_MS') && !designEditor.includes('setInterval(() =>'), 'Design source refresh should not poll on an interval because it can race source-backed inspector edits');
assert(designEditor.includes('isWorkbenchSelectionStale(selection, latestSelectionRef.current)'), 'Design editor should ignore older selection props so rapid clicks do not revert to the previous selected layer');
assert(
  designEditor.includes('const projectTreeSourceKey = getDesignProjectTreeSourceKey(projectTreeSource);') &&
    designEditor.includes('projectTreeSourceKey, readSourceTreeFromDisk'),
  'Design source loading should depend on a stable source key rather than the whole projectTreeSource object',
);
assert(
  designEditor.includes('const [resizeDraftViewport, setResizeDraftViewport]') &&
    designEditor.includes('if (commit && committed) onChange(latestViewport);') &&
    designEditor.includes("ownerWindow.removeEventListener('pointercancel', handlePointerCancel);"),
  'Preview viewport drag resize should preview locally and commit a single undoable viewport change on pointerup',
);

const workbenchLibraryOwnership = read('src/domain/project/workbenchLibraryOwnership.ts');
assert(workbenchLibraryOwnership.includes('PROJECT_LIBRARY_SOURCE_PATTERN'), 'Library imports should recognize existing project library snapshot component folders');
assert(workbenchLibraryOwnership.includes('getImportedLibraryTokenSourcePath'), 'Library imports should resolve a matching tokens.json source for every recognized library component folder');

const previewSettings = read('src/features/workbench-shell/ui/designPreviewSettings.ts');
assert(previewSettings.includes('getSurfaceCompanionCollectionId'), 'Preview token mode reconciliation should keep preset surface modes aligned with color theme modes');
assert(
  previewSettings.includes('DESIGN_PREVIEW_VIEWPORT_PRESETS') &&
    previewSettings.includes('reconcileDesignPreviewViewport') &&
    !previewSettings.includes('DesignResponsiveBreakpoint') &&
    !previewSettings.includes('DesignPageStateMode') &&
    !previewSettings.includes('reconcileDesignResponsiveBreakpoints') &&
    !previewSettings.includes('reconcileDesignPageStateModes') &&
    !previewSettings.includes('DesignPreviewBreakpointSizes') &&
    !previewSettings.includes('reconcileDesignPreviewBreakpointSizes') &&
    !previewSettings.includes('applyDesignPreviewBreakpointSizes') &&
    !previewSettings.includes('getDesignResponsiveBreakpointFromViewport'),
  'Iframe viewport presets should remain independent from removed responsive branch size mappings',
);

const sourceTreePreviewTokens = read('src/features/workbench-shell/ui/sourceTreePreviewTokens.ts');
assert(sourceTreePreviewTokens.includes('resolveTokenValue(token, collection, registry, modeId, previewTokenModes)'), 'Preview token variables should resolve directly from the selected mode map instead of inheriting app/root token CSS');
assert(!sourceTreePreviewTokens.includes('queryTokens(registry, { field'), 'Preview token variables should not depend on inspector field-scope filtering');
assert(sourceTreePreviewTokens.includes('getProjectTokenCssVariableName') && sourceTreePreviewTokens.includes('getProjectCollectionTokenCssVariableName'), 'Preview token variables should use the project design-system CSS namespace instead of Workbench app globals');
assert(
  sourceTreePreviewTokens.includes('getSourceTreePreviewDirectTokenCssVariableName') &&
    sourceTreePreviewTokens.includes('extensions?.cssVariable') &&
    sourceTreePreviewTokens.includes('tailwind?.cssVariable'),
  'Preview token variables should include direct token-owned CSS variables such as shadcn --primary and --primary-foreground',
);
assert(
  sourceTreePreviewTokens.includes("collection.id !== 'tailwind-primitives'") &&
    sourceTreePreviewTokens.includes('`--color-${tokenId}`'),
  'Preview token variables should expose tailwind-primitives color aliases such as --color-amber-800 for compiled Tailwind utilities',
);
assert(
  sourceTreePreviewTokens.includes('isDimensionValue(resolved)') &&
    sourceTreePreviewTokens.includes('isDurationValue(resolved)') &&
    sourceTreePreviewTokens.includes('isAngleValue(resolved)') &&
    sourceTreePreviewTokens.includes('isOpacityValue(resolved)') &&
    sourceTreePreviewTokens.includes("tokenType === 'number'") &&
    sourceTreePreviewTokens.includes("tokenType === 'string'"),
  'Preview token variables should serialize every CSS-exportable token type, not only color tokens',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('var(--font-heading, var(--wb-font-heading, inherit))') &&
    sourceTreePreviewTailwindRuntime.includes('var(--font-sans, var(--wb-font-sans') &&
    sourceTreePreviewTailwindRuntime.includes('var(--font-mono, var(--wb-font-mono'),
  'Preview Tailwind runtime font utilities should fall back to Workbench font default variables',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('function getTailwindArbitraryValueDeclarations') &&
    sourceTreePreviewTailwindRuntime.includes('parseTailwindArbitraryValue(rawValue)') &&
    sourceTreePreviewTailwindRuntime.includes('TAILWIND_ARBITRARY_VALUE_HINTS') &&
    sourceTreePreviewTailwindRuntime.includes('isTailwindArbitraryCssVariableLikelyNonColor') &&
    sourceTreePreviewTailwindRuntime.includes("stripTailwindArbitraryTypeHint(unwrapTailwindArbitraryValue(value))") &&
    sourceTreePreviewTailwindRuntime.includes('if (isLikelyTailwindArbitraryColorValue(value)) return []') &&
    sourceTreePreviewTailwindRuntime.includes("if (prefix === 'shadow') return getTailwindShadowDeclarations(arbitrary.cssValue)") &&
    sourceTreePreviewTailwindRuntime.includes("if (value.startsWith('[')) return [`font-weight:") &&
    sourceTreePreviewTailwindRuntime.includes("value.startsWith('(number:')"),
  'Preview Tailwind runtime should classify arbitrary value utilities centrally so shadcn text length/color, shadow, and font-weight token variables render in the design canvas',
);
assert(
  sourceTreePreviewTailwindRuntime.includes("SOURCE_TREE_PREVIEW_INTRINSIC_ICON_CLASS_NAME = 'wb-source-visual-intrinsic-icon'") &&
    sourceTreePreviewTailwindRuntime.includes('function getTailwindIntrinsicIconArbitrarySelectorAliases') &&
    sourceTreePreviewTailwindRuntime.includes("aliases.add(arbitrarySelector.replace(/\\bsvg\\b/g, intrinsicIconSelector))") &&
    sourceTreePreviewTailwindRuntime.includes('SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > ${intrinsicIconSelector}'),
  'Preview Tailwind runtime should apply shadcn svg selector variants to Workbench intrinsic icon spans so canvas icons match browser previews',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('var(--ds-token-tailwind-primitives-space-${tokenId}') &&
    sourceTreePreviewTailwindRuntime.includes('var(--text-sm, var(--ds-token-tailwind-primitives-text-sm') &&
    sourceTreePreviewTailwindRuntime.includes('var(--radius-md, var(--ds-token-tailwind-primitives-radius-md') &&
    sourceTreePreviewTailwindRuntime.includes('var(--shadow-lg, var(--ds-token-tailwind-primitives-shadow-lg') &&
    sourceTreePreviewTailwindRuntime.includes('var(--duration-150, var(--ds-token-tailwind-primitives-duration-150') &&
    sourceTreePreviewTailwindRuntime.includes('var(--ease-out, var(--ds-token-tailwind-primitives-ease-out'),
  'Preview Tailwind runtime utilities should resolve spacing, radius, type, effect, duration, and easing through Workbench primitive token variables',
);
assert(
  sourceTreePreviewTailwindRuntime.includes("'3xs': 'var(--container-3xs, 16rem)'") &&
    sourceTreePreviewTailwindRuntime.includes('TAILWIND_CONTAINER_SCALE_VALUES') &&
    sourceTreePreviewTailwindRuntime.includes("const widthSizeValues = [...spacingSizeValues, 'auto', ...TAILWIND_CONTAINER_SCALE_VALUES]") &&
    sourceTreePreviewTailwindRuntime.includes("const maxWidthSizeValues = [...spacingSizeValues, 'none', ...TAILWIND_CONTAINER_SCALE_VALUES]") &&
    sourceTreePreviewTailwindRuntime.includes("container: prefix === 'w' || prefix === 'min-w' || prefix === 'max-w'"),
  'Preview Tailwind runtime should support Tailwind container-scale sizing utilities such as w-lg, min-w-lg, and max-w-lg',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('function getTailwindSemanticColorVariable') &&
    sourceTreePreviewTailwindRuntime.includes('var(--${name}, var(--ds-color-${name}, var(--color-${name}, ${fallback})))'),
  'Preview Tailwind runtime color utilities should fall back from shadcn semantic variables to Workbench token variables',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('function getTailwindBorderValueDeclarations') &&
    sourceTreePreviewTailwindRuntime.includes("if (utility === 'border') return ['border-style: solid', 'border-width: 1px']") &&
    sourceTreePreviewTailwindRuntime.includes('border-bottom-style') &&
    sourceTreePreviewTailwindRuntime.includes('border-bottom-color') &&
    sourceTreePreviewTailwindRuntime.includes('function getTailwindDivideWidthValue') &&
    sourceTreePreviewTailwindRuntime.includes('isLikelyTailwindArbitraryColorValue') &&
    sourceTreePreviewTailwindRuntime.includes('isTailwindArbitraryCssVariableLikelyColor'),
  'Preview Tailwind runtime should support side-specific border and divide width, style, and color utilities such as border-b, border-b-2, border-b-blue-600, and divide-y',
);
assert(
  !sourceTreePreviewTailwindRuntime.includes('coverage.has(classToken)'),
  'Preview Tailwind runtime should always emit rules for live className tokens instead of trusting project CSS coverage during editing',
);
assert(
  sourceTreePreviewTailwindRuntime.includes("utility.startsWith('flex-[')") &&
    sourceTreePreviewTailwindRuntime.includes('flex: ${normalizeTailwindCssValue(unwrapTailwindArbitraryValue'),
  'Preview Tailwind runtime should support live arbitrary flex shorthand classes such as flex-[2_2_0%]',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('.sort(compareTailwindRuntimeRulePrecedence)') &&
    sourceTreePreviewTailwindRuntime.includes('left.variantCount - right.variantCount') &&
    sourceTreePreviewTailwindRuntime.includes('left.responsiveOrder - right.responsiveOrder'),
  'Preview Tailwind runtime should emit base utilities before variants and responsive breakpoints in ascending order so md overrides can win the cascade',
);
assert(
  sourceTreePreviewTailwindRuntime.includes('getTailwindVariantWithoutModifier(variant)') &&
    sourceTreePreviewTailwindRuntime.includes("modifierIndex === -1 ? variant : variant.slice(0, modifierIndex)"),
  'Preview Tailwind runtime should strip named peer modifiers before generating arbitrary peer data attribute selectors',
);
assert(
  read('src/page-preview.tsx').includes('if (nextStyle.nextSibling) document.head.append(nextStyle);'),
  'Page preview Tailwind runtime style should stay after project CSS injected by Vite so live className edits do not flash and get overwritten',
);
assert(
  read('src/page-preview.tsx').includes('observer.observe(document.body, {') &&
    read('src/page-preview.tsx').includes("document.body.querySelectorAll('[class]').forEach((element) => {") &&
    read('src/page-preview.tsx').includes('addPagePreviewElementClassName(element, classNames);') &&
    read('src/page-preview.tsx').includes('observer.disconnect();'),
  'Standalone page preview should collect Tailwind runtime classes from document.body so body-level dialog portals are styled',
);

const tokenEditorHistory = read('src/features/workbench-shell/ui/useTokenEditorHistory.ts');
assert(tokenEditorHistory.includes('tokenHistory.replaceValue(nextRegistry, { saved: true })'), 'Token editor should refresh its internal history registry when an external token import updates the live registry');
assert(tokenEditorHistory.includes('areTokenRegistriesEqual(registry, initialRegistry)'), 'Token editor should compare rendered registry state against external registry updates');
assert(tokenEditorHistory.includes('[initialRegistry, registry, tokenHistory]'), 'Token editor should rerender when external registry updates arrive while it is mounted');
const tokenEditorSidebar = read('src/features/workbench-shell/ui/TokenEditorSidebar.tsx');
assert(
  tokenEditorSidebar.includes('function TokenSidebarRenameControl') &&
    tokenEditorSidebar.includes('<InlineEditFrame>') &&
    tokenEditorSidebar.includes('<InlineEditActions onCancel={cancelDraft} onCommit={commitDraft} />') &&
    tokenEditorSidebar.includes('actions={isEditing ? null : (') &&
    styles.includes('.wb-sidebar-row--editing .wb-sidebar-row-main') &&
    styles.includes('.wb-sidebar-row-main--editing .wb-inline-edit-input'),
  'Token editor collection and group rename rows should use full-width draft editing with explicit cancel/done actions instead of narrow live TextField edits',
);

assert(
  pagePreview.includes('function isRuntimePageAdditiveSelectionEvent') &&
    pagePreview.includes('return event.shiftKey;') &&
    pagePreview.includes("const mode = event.metaKey || event.ctrlKey\n      ? 'smart-deep'\n      : 'direct';"),
  'Standalone page preview selection should keep Shift additive while Command uses smart-deep selection',
);
assert(pagePreview.includes("const TOKEN_MODES_QUERY_PARAM = 'tokenModes'") && pagePreview.includes('resolvePagePreviewTokenModes'), 'Standalone page preview should accept preview token modes from the browser preview URL');
assert(
  !designEditor.includes('previewResponsiveBreakpoint') &&
    !designEditor.includes('previewPageStateMode') &&
    !designEditor.includes('applySourceResponsive') &&
    !designEditor.includes('applySourceState') &&
    !designEditor.includes('applySourceCompound') &&
    !designEditor.includes('applySourceNodeResponsiveOverridesForInspector') &&
    !designEditor.includes('applySourceNodeStateOverridesForInspector') &&
    !designEditor.includes('applySourceNodeCompoundOverridesForInspector') &&
    !sourceTreePreview.includes('responsiveBreakpoint') &&
    !sourceTreePreview.includes('stateMode') &&
    !sourceTreePreview.includes('getSourceTreePreviewResponsiveOverrides') &&
    !sourceTreePreview.includes('getSourceTreePreviewStateOverrides') &&
    !sourceTreePreview.includes('getSourceTreePreviewCompoundOverrides') &&
    !designEditor.includes('designResponsiveBreakpoints') &&
    !designEditor.includes('designPageStateModes') &&
    !designEditor.includes('specNoteResponsiveBreakpoints') &&
    !designEditor.includes('specNotePageStateModes') &&
    !designInspectorPanelSource.includes('responsiveBreakpointId') &&
    !designInspectorPanelSource.includes('pageStateModeId') &&
    !designInspectorPanelSource.includes('getSpecNoteScopeGroups') &&
    !designInspectorPanelSource.includes('createWorkbenchSpecNoteScope') &&
    designEditor.includes('const selectedSourceNodeForInspector = selectedSourceNode;') &&
    designEditor.includes('parseTokenModeOverride(node.sourceAttributes?.[SOURCE_TOKEN_MODE_ATTRIBUTE])'),
  'Design Editor, SourceTreePreview, Inspector, and spec notes should consume common source context without legacy breakpoint or page-state projection',
);
const sourceAttributeSafety = read('src/domain/document/sourceAttributeSafety.ts');
const editableTreeSourceParser = read('src/domain/document/editableTreeSourceParser.ts');
assert(
  !sourceWriteback.includes('applySourceResponsive') &&
    !sourceWriteback.includes('applySourceState') &&
    !sourceWriteback.includes('applySourceCompound') &&
    !sourceWriteback.includes('SOURCE_RESPONSIVE_ATTRIBUTE') &&
    !sourceWriteback.includes('SOURCE_STATE_ATTRIBUTE') &&
    !sourceWriteback.includes('SOURCE_COMPOUND_ATTRIBUTE') &&
    !sourceAttributeSafety.includes('data-wb-responsive') &&
    !sourceAttributeSafety.includes('data-wb-state') &&
    !sourceAttributeSafety.includes('data-wb-compound') &&
    !editableTreeSourceParser.includes('SOURCE_RESPONSIVE_ATTRIBUTE') &&
    !editableTreeSourceParser.includes('SOURCE_STATE_ATTRIBUTE') &&
    !editableTreeSourceParser.includes('SOURCE_COMPOUND_ATTRIBUTE') &&
    !sourceTreePreview.includes('SOURCE_RESPONSIVE_ATTRIBUTE') &&
    !sourceTreePreview.includes('SOURCE_STATE_ATTRIBUTE') &&
    !sourceTreePreview.includes('SOURCE_COMPOUND_ATTRIBUTE') &&
    !workbenchSpecNotesSource.includes('WorkbenchSpecNoteScope') &&
    !workbenchSpecNotesSource.includes('responsiveBreakpointId') &&
    !workbenchSpecNotesSource.includes('pageStateModeId') &&
    !styles.includes('wb-responsive-breakpoint-') &&
    !styles.includes('wb-page-state-mode-') &&
    true,
  'Source writeback, parsing, preview, and preset runtime should not retain the removed breakpoint or page-state override protocol',
);
assert(
  pagePreview.includes("fetchWorkbenchProjectFileJson<WorkbenchSelectionState>('.workbench/selection.json')") &&
    pagePreview.includes('workbenchFetch(`/__workbench/files/${encodePreviewPath(normalizedPath)}`') &&
    pagePreview.includes('selection?.extensions.previewTokenModes') &&
    !pagePreview.includes('PREVIEW_TOKEN_MODES_EXTENSION'),
  'Standalone page preview should fall back to persisted preview token modes from selection.json',
);
assert(
  pagePreview.includes("const APPEARANCE_QUERY_PARAM = 'appearance'") &&
    pagePreview.includes('resolvePagePreviewAppearance') &&
    pagePreview.includes('getPagePreviewEffectiveTokenModes') &&
    pagePreview.includes('getDesignPreviewAppearanceThemeMode(previewAppearance)') &&
    pagePreview.includes('data-wb-preview-appearance={previewAppearance}') &&
    pagePreview.includes('data-theme={previewThemeMode}'),
  'Standalone page preview should apply explicit preview appearance independently from preview token modes',
);
assert(
  designEditor.includes('useSystemDesignPreviewAppearance') &&
    designEditor.includes("previewAppearance === 'system'") &&
    designEditor.includes('getPreviewTokenModesForAppearance(tokenRegistry, selectedPreviewTokenModes, systemPreviewAppearance)') &&
    designEditor.includes('data-wb-token-modes={previewTokenModeAttribute}'),
  'Design preview System appearance should render light/dark token collections using the current system color scheme',
);
assert(
  pagePreview.includes('loadProjectCssForSource(sourceParam, previewModule.cssModuleUrls)') &&
    pagePreview.includes('for (const cssModuleUrl of cssModuleUrls)') &&
    pagePreview.includes('await importPreviewCssModule(') &&
    pagePreview.includes('appendPagePreviewModuleCacheKey(cssModuleUrl, refreshKey)') &&
    pagePreview.includes('fetchPagePreviewModuleManifest(sourcePath)') &&
    !pagePreview.includes("import.meta.glob('/projects/*/src/**/*.css', { eager: true })"),
  'Standalone page preview should load only the selected project CSS in cascade order instead of eager-loading every project global',
);
assert(
  pagePreview.includes('pagePreviewTailwindRuntimeClassNames = new Set(collectPagePreviewClassNames(container))') &&
    pagePreview.includes('addPagePreviewNodeClassNames(node, pagePreviewTailwindRuntimeClassNames)') &&
    pagePreview.includes('if (!discoveredNewClassName) return;') &&
    pagePreview.includes('if (renderKey === pagePreviewTailwindRuntimeRenderKey) return;'),
  'Standalone page preview should incrementally discover portal/runtime classes instead of rebuilding Tailwind CSS for every DOM mutation',
);

const foundationPreviews = read('src/workbench-foundations/foundationPreviews.tsx');
assert(foundationPreviews.includes('resolveTokenValue(token, collection, registry, modeId, previewTokenModes)'), 'Foundation previews should resolve tokens with the full preview mode map');

const viteConfig = read('vite.config.ts');
const localProjectHost = read('scripts/workbench-local-project-host.mjs');
assert(
  viteConfig.includes('for (const libraryCssPath of await collectProjectLibraryCssFilePaths(projectRoot))') &&
    viteConfig.includes('snapshotRoot !== `src/libraries/${libraryId}`') &&
    viteConfig.includes('`${snapshotRoot}/components/${libraryId}.css`'),
  'Standalone Browser preview should load the same registry-owned local library CSS convention as the Design canvas',
);
assert(
  viteConfig.includes('await collectProjectDependencyCssImports(') &&
    viteConfig.includes('const dependencySourceFiles = await collectProjectLocalDependencySourceFiles(') &&
    viteConfig.includes('const reExportedSourceFiles = await collectProjectLocalDependencySourceFiles(') &&
    viteConfig.includes('return Array.from(cssFilePaths).map(toViteFileSystemModuleUrl);'),
  'Browser preview manifest should include component-local CSS dependencies while preserving configured CSS cascade order',
);
assert(viteConfig.includes('let activeProjectRoot: string | null = null'), 'Dev server should not auto-open the repository root as the active Workbench project');
assert(
  viteConfig.includes('if (body.allowMissing && isMissingFileError(error))') &&
    viteConfig.includes("sendJson(response, { ok: false, missing: true, message: 'Source file not found' });") &&
    viteConfig.includes(".searchParams.get('allowMissing') === '1'") &&
    projectLoaderSource.includes('await readWorkbenchSourceFileOnce(path, { allowMissing: true })') &&
    projectLoaderSource.includes('`${toProjectFileUrl(path)}?allowMissing=1`') &&
    projectLoaderSource.includes('if (response.status === 204 || response.status === 404) return null;'),
  'Dev server should answer allow-missing probes (source reads, the optional prop registry) without HTTP 404s, and pathExists should always probe that way',
);
assert(
  viteConfig.includes('WORKBENCH_DEV_SERVER_PROJECT_STATE_PATH') &&
    viteConfig.includes('hydrateActiveProjectRootForVite(server, tailwindAutoSync)') &&
    viteConfig.includes('persistActiveProjectRootForVite(activeProjectRoot)'),
  'Dev server should persist and restore the explicitly opened project across Vite restarts',
);
assert(
  viteConfig.includes('? await workbenchHost.scaffoldWorkbenchProjectFolder(') &&
    viteConfig.includes("workbenchHost.createProjectLocation(activeProjectRoot, 'dev-server', dependencyInstall)") &&
    viteConfig.includes('await workbenchHost.readWorkbenchProjectDependencyInstallStatus(activeProjectRoot)') &&
    viteConfig.includes('await workbenchHost.workbenchProjectDependenciesNeedInstall(activeProjectRoot)') &&
    viteConfig.includes('pathname === PROJECT_DEPENDENCY_INSTALL_PATH') &&
    viteConfig.includes('workbenchHost.queueWorkbenchProjectDependencyInstall(') &&
    viteConfig.includes('setImmediate(() => {') &&
    viteConfig.includes('void workbenchHost.queueWorkbenchProjectDependencyInstall(validation.rootPath, body.templateId)'),
  'Dev server project creation should activate the scaffold, repair stale installs, resume interrupted installs, and expose dependency retry',
);
assert(
  localProjectHost.includes('export async function workbenchProjectDependenciesNeedInstall(projectRoot)') &&
    localProjectHost.includes("packageLock?.packages?.[`node_modules/${dependencyName}`]?.version") &&
    localProjectHost.includes('installedManifest?.version !== lockedVersion'),
  'Project dependency recovery should compare direct installed versions with the active package lock.',
);
assert(viteConfig.includes("candidate.kind === 'video'"), 'Asset writes should accept video assets');
assert(
  viteConfig.includes("usePolling: process.env.WORKBENCH_VITE_USE_POLLING === '1'") &&
    !viteConfig.includes('usePolling: true') &&
    viteConfig.includes('interval: 1_000'),
  'Dev server file polling should be opt-in so idle Workbench servers do not saturate libuv workers',
);
assert(!viteConfig.includes("server.watcher.add(resolve(projectRoot, 'src'))"), 'Tailwind preview auto-sync should not watch the entire active project src tree');
assert(
  viteConfig.includes("return normalizedPath.startsWith('src/') && /\\.(tsx?|jsx?|html?|vue)$/i.test(normalizedPath);") &&
    !viteConfig.includes("Source edits are covered by the preview runtime's Tailwind utility fallback"),
  'Tailwind preview auto-sync should rebuild authoritative compiled CSS for source class changes instead of relying on synthetic preview rules',
);
assert(
  viteConfig.includes("[WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', rootAtStart, '--preview-only']") &&
    !viteConfig.includes('if (config.tokenCss) emitWorkbenchProjectPreviewDataChangedPath(server, config.tokenCss);'),
  'Tailwind preview auto-sync should refresh compiled CSS without rewriting or re-emitting token-editor-owned CSS',
);
assert(
  viteConfig.includes("'**/public/workbench-assets/**'"),
  'Dev server should ignore generated public assets instead of processing immutable HMR events during project creation',
);
assert(
  viteConfig.includes("'.workbench/assets.json'") &&
    viteConfig.includes("'.workbench/selection.json'") &&
    viteConfig.includes('syncConfig.compiledCss') &&
    viteConfig.includes('syncConfig.tokenCss'),
  'Tailwind preview auto-sync should watch exact project metadata and CSS files only',
);
assert(localProjectHost.includes("action.kind === 'video' ? 'videos'"), 'Video assets should be written to the public videos asset folder');
assert(localProjectHost.includes("return 'video/webm'"), 'Dev server should serve WebM assets with a video MIME type');

const projectLoader = read('src/domain/project/workbenchProjectLoader.ts');
assert(projectLoader.includes('if (!location.rootPath)'), 'Project loader should stay disconnected when no project root is selected');
assert(projectLoader.includes("kind: 'image' | 'video' | 'font' | 'icon'"), 'Project asset writes should expose the video asset kind');

const workbenchProject = read('src/domain/project/workbenchProject.ts');
assert(workbenchProject.includes("'image' | 'video' | 'font' | 'icon'"), 'Project asset model should include video assets');

const assetRegistry = read('src/domain/design-system/assets/assetRegistry.ts');
assert(assetRegistry.includes("'video/*'") && assetRegistry.includes("'.webm'"), 'Asset picker accept list should include WebM video files');
assert(assetRegistry.includes('isVideoDesignAssetSource'), 'Asset registry should expose video source detection for inspector routing');
assert(assetRegistry.includes('inferDesignAssetKindFromSource'), 'URL assets should be classifiable from their source extension');
assert(
  assetRegistry.includes('const defaultIconPreviewOptionsCache = new WeakMap<WorkbenchAssetRegistry') &&
    assetRegistry.includes('const defaultIconSourceMapCache = new WeakMap<WorkbenchAssetRegistry') &&
    assetRegistry.includes('const defaultIconAsset = getWorkbenchDefaultIconAsset(registry);') &&
    assetRegistry.includes('return getWorkbenchDefaultIconSourceMap(registry)[key] ?? null;'),
  'Default icon lookup should cache one selected icon-set index instead of rebuilding every installed icon set on preview renders',
);
assert(
  assetRegistry.includes('--font-heading: var(--wb-font-heading') &&
    assetRegistry.includes('--font-sans: var(--wb-font-sans') &&
    assetRegistry.includes('--font-mono: var(--wb-font-mono'),
  'Workbench font defaults should bridge into Tailwind font-heading/font-sans/font-mono variables for non-heading component titles',
);

const assetManager = read('src/features/workbench-shell/ui/AssetManager.tsx');
assert(assetManager.includes('<option value="video">Videos</option>'), 'Asset Manager should filter video assets');
assert(assetManager.includes('<option value="video">Video</option>'), 'Asset Manager URL import should allow video assets');
assert(assetManager.includes('function VideoPreview'), 'Asset Manager should render video previews with a video element');
assert(assetManager.includes('getEffectiveDesignAssetKind(asset)'), 'Asset Manager should render existing WebM image assets as videos');
assert(
  assetManager.includes('setGitNameDraft(font.family);'),
  'Selecting a different Google Fonts family should refresh the install name instead of keeping the first selected family name',
);
assert(
  styles.includes('.wb-assets-preview--font span {') &&
    styles.includes('color: var(--wb-text);'),
  'Asset Manager font previews should use the app foreground color in light and dark themes',
);

const designInspectorPanel = read('src/features/workbench-shell/ui/DesignInspectorPanel.tsx');
const inspectorEditService = read('src/domain/inspector/inspectorEditService.ts');
assert(designInspectorPanel.includes("key={`${selectedSourceNode?.id ?? 'none'}:${field.id}`"), 'Inspector style controls should be keyed by selected source node so child selection cannot reuse the parent gap draft');
assert(designInspectorPanel.includes("key={`${selectedSourceNode?.id ?? 'none'}:${fillField.id}:${fillProperty}`"), 'Inspector fill style controls should be keyed by selected source node and fill property so container selection cannot reuse stale style drafts');
assert((designInspectorPanel.match(/<SourceStyleDeclarationControl/g) ?? []).length === (designInspectorPanel.match(/<SourceStyleDeclarationControl\n\s+key=\{`\$\{selectedSourceNode\?\.id \?\? 'none'\}:/g) ?? []).length, 'Every source style declaration control should remount per selected source node to avoid dropping container styles during selection changes');
assert(designInspectorPanel.includes('const draftDirtyRef = useRef(false);'), 'Inspector style text inputs should only flush drafts that the user actually edited');
assert(
  designInspectorPanel.includes('function commitRawClassName(value: string) {') &&
    designInspectorPanel.includes('commitOnBlur\n            commitOnEnter') &&
    designInspectorPanel.includes("if (commitOnEnter && event.key === 'Enter' && !event.shiftKey)") &&
    !designInspectorPanel.includes('aria-label="Apply className changes?"'),
  'Raw className should apply through one commit path on blur or Enter while keeping Shift+Enter available for multiline editing',
);
assert(designInspectorPanel.includes('hasSourceStyleDeclaration(field, selectedSourceNode)'), 'Authored source border detail declarations should surface in the main Inspector section instead of hiding behind options');
assert(
  designInspectorPanel.includes("const strokeFields = getInspectorSectionFields(inspectorFields, 'stroke');") &&
    designInspectorPanel.includes('<InspectorStrokeSection') &&
    designInspectorPanel.includes('title="Stroke"'),
  'Design Inspector should render a Stroke section for SVG stroke style fields',
);
assert(
  designInspectorPanel.includes("field.id === 'layout.gridColumns' || field.id === 'layout.gridRows'") &&
    designInspectorPanel.includes("baseClass === 'grid'") &&
    designInspectorPanel.includes("baseClass === 'inline-grid'") &&
    designInspectorPanel.includes('formatGridTemplateTrackCommitValue') &&
    designInspectorPanel.includes('return `repeat(${count}, minmax(0, 1fr))`;') &&
    designInspectorPanel.includes('return `repeat(${count}, auto)`;'),
  'Layout Inspector should reveal grid template controls for CSS grid and turn simple counts into grid template declarations',
);
assert(designInspectorPanel.includes("['image', 'video', 'icon']"), 'Component asset props should allow video assets for media-like source fields');
assert(designInspectorPanel.includes('isVideoComponentAssetProp') && designInspectorPanel.includes("'background'"), 'Component prop asset detection should recognize video/background media prop names');
assert(designInspectorPanel.includes("terms.every((term) => ['source', 'src'].includes(term))"), 'Component prop asset detection should recognize duplicated Src key/label controls');
assert(designInspectorPanel.includes('getEffectiveDesignAssetKind(asset)'), 'Inspector asset picker should route existing WebM image assets as videos');
assert(
  designInspectorPanel.includes("assetKinds?.length === 1 && assetKinds[0] === 'icon'") &&
    designInspectorPanel.includes('return preview.key || preview.value'),
  'Inspector icon asset picker should commit icon preview keys for icon-only component props',
);
assert(
  designInspectorPanel.includes('onSelectPreview={(preview) => onCommit(formatPreviewAssetValueForComponentProp(control, preview))}'),
  'Component icon controls should use the shared icon preview value formatter',
);
assert(
  designInspectorPanel.includes('onSelectPreview?: (preview: AssetPreviewOption, kind: WorkbenchDesignAssetKind) => void;') &&
    designInspectorPanel.includes('onSelectPreview?.(option.preview, selectedKind)') &&
    designInspectorPanel.includes('onSelectPreview={(preview, previewKind) => {') &&
    designInspectorPanel.includes("if (previewKind === 'icon')") &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, null);') &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, null);') &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ASSET_KIND_ATTRIBUTE, previewKind)'),
  'Inspector asset picker previews should commit the selected asset kind so image source attributes do not get mislabeled as icons',
);
assert(
  designInspectorPanel.includes("if (attributeName === 'src' && value === null) {") &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ASSET_SOURCE_ATTRIBUTE, null);') &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ASSET_KIND_ATTRIBUTE, null);') &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, null);') &&
    designInspectorPanel.includes('onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, null);'),
  'Clearing an image src in the Inspector should also clear asset and icon identity metadata so preview cannot restore the removed icon',
);
assert(
  designInspectorPanel.includes('findComponentPropTokenResultByRawValue') &&
    designInspectorPanel.includes('normalizeComponentPropCssVariableValue') &&
    designInspectorPanel.includes('return result.cssVariable ?? `var(${getProjectCollectionTokenCssVariableName(result.collection.id, result.token.id)})`;') &&
    designInspectorPanel.includes('formatComponentPropDetachedTokenValue'),
  'Component prop token controls should commit exported token CSS variables while still treating raw CSS variables such as var(--chart-1) as token picker selections',
);
assert(
  inspectorEditService.includes("['border-radius', 'radius']") &&
    inspectorEditService.includes("['padding', 'spacing']") &&
    !inspectorEditService.includes("['border-top-left-radius', 'radius']") &&
    !inspectorEditService.includes("['padding-top', 'spacing']"),
  'Source style token binding should only route canonical shorthand fields through source token bindings; longhands should commit direct style token values',
);

assert(
  designEditor.includes('if (isEditableTreeHtmlTagNode(node)) return <Code2 size={13} />') &&
    designEditor.includes('function isEditableTreeHtmlTagNode') &&
    designEditor.includes("return <Box size={13} />;"),
  'Layer tree should render source HTML tag nodes with the code icon while keeping generic frames on the box icon',
);
assert(
  designEditor.includes("const SOURCE_ICON_IMPORT_SOURCES = new Set(['@tabler/icons-react', '@remixicon/react', 'lucide-react'])") &&
    designEditor.includes('if (isSourceIconPackageNode(node)) return \'Icon\';') &&
    designEditor.includes('function isSourceIconPackageNode'),
  'Layer tree should label supported icon package components as icons instead of unknown component instances',
);
assert(
    designEditor.includes('function getSourceInsertPickerInitialMode') &&
    designEditor.includes("return canInsertComponent ? 'component' : 'html';") &&
    designEditor.includes('initialMode: getSourceInsertPickerInitialMode(canInsertComponent)') &&
    designEditor.includes('initialMode={getSourceInsertPickerInitialMode(canInsertComponentIntoSourceNode(selectedSourceNode))}') &&
    designEditor.includes('initialMode={pickerState.initialMode}'),
  'Source add-child picker should default to Component when source components can be inserted, falling back to HTML only when components are unavailable',
);
assert(
    designEditor.includes('await getProjectDefaultSourceInsertIcon(assets)') &&
    designEditor.includes('async function readSourceInsertIconSvg') &&
    designEditor.includes("workbenchFetch(normalizedSource)") &&
    designEditor.includes('formatSourceInsertIconSvg(await response.text(),') &&
    designEditor.includes('SOURCE_ASSET_SOURCE_ATTRIBUTE') &&
    designEditor.includes('applySourceInlineSvgIconWriteback') &&
    designEditor.includes('onSourceInlineSvgIconChange={updateSourceInspectorInlineSvgIcon}') &&
    designEditor.includes('SOURCE_INSERT_SVG_CHILD_TAGS') &&
    designEditor.includes('formatSourceInsertSvgAttribute') &&
    designEditor.includes("const rootStroke = svg.getAttribute('stroke')") &&
    !designEditor.includes("svg.getAttribute('stroke') || 'currentColor'") &&
    !designEditor.includes("svg.getAttribute('stroke-width') || svg.getAttribute('strokeWidth') || '2'"),
  'Source icon insertion should inline sanitized SVG asset contents and keep icon asset replacement metadata when the project default icon is an SVG file',
);
assert(
  designInspectorPanelSource.includes('const replaceInlineSvgIconFromAttribute = (') &&
    designInspectorPanelSource.includes("inlineSvgIconSource === null || attributeName !== 'src' || !isIconAssetSourceValue(source)") &&
    designInspectorPanelSource.includes('onSourceInlineSvgIconChange(source, iconName || inferInlineSvgIconName(source));') &&
    designInspectorPanelSource.includes('const commitSourceAttribute = (attributeName: SourceAttributeName, value: string | null) => {') &&
    designInspectorPanelSource.includes('if (replaceInlineSvgIconFromAttribute(attributeName, source, asset.name)) return;') &&
    designInspectorPanelSource.includes("if (previewKind === 'icon' && replaceInlineSvgIconFromAttribute(attributeName, preview.value, preview.key || preview.name)) return;") &&
    designInspectorPanelSource.includes('onCommit={(value) => commitSourceAttribute(attributeName, value)}'),
  'Design Inspector should route src picker changes on inline SVG icons through full SVG icon replacement instead of mutating ignored svg src metadata',
);
assert(
  designEditor.includes('const selectedComponent = filteredComponents.find((component) => component.id === selectedComponentId) ??') &&
    designEditor.includes('filteredComponents[0] ??') &&
    designEditor.includes('availableComponents[0] ??'),
  'Component picker Insert should target the visible filtered component instead of a stale previous selection after searching for Text',
);

const inspectorFieldRegistry = read('src/domain/inspector/inspectorFieldRegistry.ts');
assert(inspectorFieldRegistry.includes("'border-left'") && inspectorFieldRegistry.includes('border.side.'), 'Source Inspector should expose direction-specific border shorthand fields such as border-left');
assert(
  inspectorFieldRegistry.includes('function resolveStrokeFields') &&
    inspectorFieldRegistry.includes("section: 'stroke'") &&
    inspectorFieldRegistry.includes("styleProperty: 'stroke-width'") &&
    inspectorFieldRegistry.includes("styleProperty: 'stroke-linecap'") &&
    inspectorFieldRegistry.includes("styleProperty: 'stroke-linejoin'"),
  'Source Inspector should expose SVG stroke controls for color, width, cap, and join',
);
assert(
  inspectorFieldRegistry.includes("id: 'layout.gridColumns'") &&
    inspectorFieldRegistry.includes("control: textControl('2')") &&
    inspectorFieldRegistry.includes("styleProperty: 'grid-template-columns'") &&
    inspectorFieldRegistry.includes("id: 'layout.gridRows'") &&
    inspectorFieldRegistry.includes("styleProperty: 'grid-template-rows'"),
  'Source Inspector layout fields should expose grid template columns and rows',
);

assert(editableTreeSourceWriteback.includes("'border-left'") && editableTreeSourceWriteback.includes("'border-right'"), 'Source style writeback should allow direction-specific border shorthand properties');

const sourceTreePreviewVideo = read('src/features/workbench-shell/ui/SourceTreePreview.tsx');
assert(sourceTreePreviewVideo.includes('isVideoDesignAssetSource(src)') && sourceTreePreviewVideo.includes('renderSourceTreePreviewIntrinsicVideo'), 'Source preview should avoid broken image rendering for WebM sources');
assert(
  sourceTreePreviewVideo.includes('SOURCE_TREE_PREVIEW_EMPTY_IMAGE_SRC') &&
    sourceTreePreviewVideo.includes('src={src || SOURCE_TREE_PREVIEW_EMPTY_IMAGE_SRC}'),
  'Source preview should preserve empty img nodes without rendering the browser broken-image border',
);
assert(
  !sourceTreePreviewVideo.includes("if (src && attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon')") &&
    sourceTreePreviewVideo.includes("attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon' ? 'wb-source-visual-intrinsic-image--icon' : ''"),
  'Source preview should preserve native img semantics when its selected asset is an SVG icon',
);
assert(sourceTreePreviewVideo.includes('parseSourceBackgroundVideoLayers') && sourceTreePreviewVideo.includes('wb-source-visual-background-video'), 'Source preview should render video background layers');

const developerExport = read('src/domain/document/developerExport.ts');
assert(developerExport.includes('rewriteVideoImageElements') && developerExport.includes('isVideoDesignAssetSource'), 'Developer export should rewrite literal WebM image tags to video tags');
assert(developerExport.includes('rewriteBackgroundVideoJsxElement') && developerExport.includes('SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY'), 'Developer export should materialize video background layers as video elements');

const sourceVideoBackground = read('src/domain/document/sourceVideoBackground.ts');
assert(sourceVideoBackground.includes('SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY') && sourceVideoBackground.includes('parseSourceBackgroundVideoLayers'), 'Video background source style metadata should be centralized');

console.log('Design editor foundation checks passed.');

function read(file) {
  return readFileSync(path.join(root, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
