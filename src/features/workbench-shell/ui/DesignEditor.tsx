import { Box, ChevronRight, Code2, Component, Copy, Diamond, FileText, LoaderCircle, MonitorSmartphone, Plus, Type, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  type TokenReference,
  type TokenRegistry,
} from '@domain/design-system/tokens/types';
import {
  type EditableTreeTokenBindingReferences,
  type EditableTreeTokenBindings,
  type EditableDocumentTree,
  type EditableTreeNode,
  type EditableTreeSourcePropArray,
  type EditableTreeSourcePropObject,
  collectEditableTreeAncestorIds,
  findEditableTreeNode,
  findEditableTreeNodeInPreviewTree,
  getEditableTreeReferencedArrayProp,
  getEditableTreePreviewChildSourcePreviewOnly,
  resolveEditableTreeSelectionBoundary,
} from '@domain/document/editableTree';
import {
  CODEX_DESIGN_HANDOFF_PATH,
  type CodexDesignHandoff,
  createCodexDesignHandoff,
} from '@domain/document/codexDesignHandoff';
import {
  analyzeSourceWithHostedCore,
  formatHostedSourceAnalysisDiagnostic,
} from '@domain/core/workbenchHostedSourceAnalysis';
import {
  createWorkbenchCoreProjectSummaryFromRegistries,
  planHostedSourceWrite,
} from '@domain/core/workbenchHostedOperationPlanning';
import {
  type DeveloperExport,
  createDeveloperExport,
} from '@domain/document/developerExport';
import {
  applyRuntimeDesignTreeToDom,
  createEditableDocumentTreeFromDomProjection,
  getRuntimeDesignNodeIdFromEventTarget,
  getRuntimeDesignNodeIdFromPoint,
  markRuntimeDesignSelection,
} from '@domain/document/editableTreeDomProjection';
import { createEditableDocumentTreeFromProjectSource } from '@domain/document/editableTreeProjectSource';
import { getLibraryScopeClassName } from '@domain/document/libraryScopeRegistry';
import {
  commitAndPersistSourceInspectorAttribute,
  commitAndPersistSourceInspectorComponentInsert,
  commitAndPersistSourceInspectorComponentProp,
  commitAndPersistSourceInspectorComponentType,
  commitAndPersistSourceInspectorElementTagName,
  commitAndPersistSourceInspectorExtractSelectedNodesToMap,
  commitAndPersistSourceInspectorInsertChild,
  commitAndPersistSourceInspectorMoveNode,
  commitAndPersistSourceInspectorPasteNode,
  commitAndPersistSourceInspectorStyleDeclaration,
  commitAndPersistSourceInspectorStructure,
  commitAndPersistSourceInspectorTextContent,
  commitAndPersistSourceInspectorTextI18nBinding,
  commitAndPersistSourceInspectorTokenBinding,
  commitAndPersistSourceInspectorWrapNode,
} from '@domain/document/editableTreeSourceInspector';
import type { SourceFileSavePointCandidate } from '@domain/document/editableTreeSourcePersistence';
import {
  createSourceFileSaveFlushPlan,
  markSourceFileSaveFlushed,
  resolveProjectAssetSubjectForSourceFile,
} from '@domain/document/editableTreeSourceSession';
import {
  type EditableTreeSourceDesignState,
  type EditableTreeSourceParseResult,
} from '@domain/document/editableTreeSourceParser';
import { createEditableDocumentTreeFromPageSource } from '@domain/document/pageSourceAdapter';
import {
  isPresetComponentSourceFile,
  normalizeProjectSourceFileReference,
  resolveProjectImportSourcePath,
} from '@domain/document/sourceImportRouting';
import {
  canInsertComponentIntoSourceNode,
  canShowSourceLayerAddAction,
  canTreatSourceNodeAsExplicitUnknownChildrenContainer,
  findEditableTreeParent,
  getPredictedInsertedSourceChildId,
  getPredictedSourceMoveSelectionId,
  getPredictedSourceMoveSelectionIds,
  getPredictedSourceStructureSelectionId,
  getPredictedWrappedSourceLayerIds,
  getSourceInsertTemplatesForNode,
  isDraggableSourceNodeId,
  resolveSourceLayerAddChildTargetIndex,
  resolveSourceLayerDropTarget,
  resolveSourceKeyboardMoveTarget,
  type SourceKeyboardMoveIntent,
  type SourceLayerDropTarget,
} from '@domain/document/editableTreeSourceLayerTree';
import {
  applySourceAttributeWriteback,
  applySourceComponentPropWriteback,
  type SourceComponentTypeFallbackProps,
  applySourceElementTagNameWriteback,
  applySourceInlineSvgIconWriteback,
  applySourceMoveNodesWriteback,
  applySourceStyleDeclarationWriteback,
  applySourceStructureWriteback,
  applySourceTextContentWriteback,
  applySourceTextI18nBindingWriteback,
  applySourceTokenBindingWriteback,
  createSourceNodeClipboardPayload,
  normalizeSourceStyleDeclarationValue,
  SOURCE_WRAP_HTML_TAG_NAMES,
  type SourceComponentPropValue,
  type SourceAttributeName,
  type SourceElementTagName,
  type SourceInsertChildIconDefault,
  type SourceInsertChildTemplate,
  type SourceInsertChildTemplateId,
  type SourceNodeClipboardPayload,
  type SourceStyleProperty,
  type SourceStructureAction,
  type SourceWrapHtmlTagName,
  type SourceWrapNodeWrapper,
} from '@domain/document/editableTreeSourceWriteback';
import { canAddSourceChildIntoParent, canMoveSourceChildIntoParent, componentSupportsChildrenSlot, getSourceChildrenSlotKind } from '@domain/document/sourceSlotContainers';
import {
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
  normalizeEditableSourceAttributeValue,
} from '@domain/document/sourceAttributeSafety';
import {
  createProjectAssetEditOwner,
  getProjectAssetHistoryLaneId,
  type ProjectAssetHistorySubject,
} from '@domain/editing/projectAssetHistory';
import { createSerialEditQueue } from '@domain/editing/serialEditQueue';
import { getTokenPreviewCss } from '@domain/design-system/tokens/query';
import { resolveTokenValue } from '@domain/design-system/tokens/resolver';
import {
  parseTokenModeOverride,
  serializeTokenModeOverride,
  SOURCE_TOKEN_MODE_ATTRIBUTE,
} from '@domain/design-system/tokens/modeOverride';
import { isCollectionI18n } from '@domain/design-system/tokens/operations';
import {
  getWorkbenchDefaultFontCssText,
  getWorkbenchDefaultIconPreviewOptions,
  getWorkbenchDefaultIconSourceMap,
  normalizeWorkbenchIconKey,
} from '@domain/design-system/assets/assetRegistry';
import {
  compareWorkbenchComponentGroupIds,
  formatWorkbenchComponentGroupLabel,
  getWorkbenchComponentGroupId,
} from '@domain/project/componentGrouping';
import {
  reorderWorkbenchOpenDesignTargetKeys,
  type WorkbenchOpenDesignTargetDropPosition,
} from '@domain/project/openDesignTargetOrder';
import {
  findInspectorTokenBindingReference,
  formatInspectorBindingField,
  type InspectorTokenBindingField,
} from '@domain/inspector/inspectorEditService';
import { resolveHtmlInspectorModel } from '@domain/inspector/htmlInspectorSchema';
import {
  createPreviewLayers,
  formatPreviewLayerKind,
  type PreviewLayer,
  type PreviewLayerKind,
} from '@domain/preview/previewLayerService';
import {
  areCssClassEffectivenessReportsEqual,
  type CssClassEffectivenessReport,
} from '@domain/preview/cssClassEffectiveness';
import {
  reconcilePreviewDrillPath,
  resolvePreviewNodeDrillIn,
  resolvePreviewNodeSelection,
} from '@domain/preview/previewSelectionService';
import {
  createHistoryController,
  getHistoryLaneId,
  type HistoryLaneId,
  type HistoryController,
  type WorkbenchEditTransaction,
  type WorkbenchSelectionSnapshot,
} from '@domain/history/historyController';
import { resolveEditableTreeSelectionScope } from '@domain/selection-scope/selectionScopeService';
import { resolveEditableTreeSourceCapabilities } from '@domain/selection-scope/sourceNodeCapabilities';
import { recordWorkbenchDragProbe } from './workbenchDragProbe';
import { createHistoryControllerStore } from '@domain/history/historyControllerStore';
import {
  createHistoryChangeSummary,
  type WorkbenchEditChangeSummary,
} from '@domain/history/historyChangeSummary';
import {
  appendSavePoint,
  createSavePointId,
  getWorkbenchSavePointPath,
  normalizeWorkbenchSavePointFile,
  shouldCaptureSavePoint,
  type WorkbenchSavePointFile,
} from '@domain/history/historySavePoints';
import { createHistoryTimelineEntry } from '@domain/history/historyRegistry';
import {
  createPersistedHistoryLane,
  getHydratableHistoryLane,
  upsertPersistedHistoryLane,
  type WorkbenchHistoryFile,
} from '@domain/history/historyPersistence';
import type {
  WorkbenchAssetRegistry,
  WorkbenchCommentRegistry,
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
  WorkbenchSelectionState,
  WorkbenchSelectionTarget,
} from '@domain/project/workbenchProject';
import { normalizeWorkbenchInspectorTokenPickerScopeFilter } from '@domain/project/workbenchInspectorSession';
import type { WorkbenchProjectClassCatalog } from '@domain/project/workbenchProjectClassCatalog';
import {
  createWorkbenchCommentRegistryForSpecNoteTarget,
  createWorkbenchCommentRegistryFromSpecNotes,
  createWorkbenchSpecNoteHighlightBox,
  createWorkbenchSpecNoteOwnerTarget,
  createWorkbenchSpecNoteTarget,
  getWorkbenchSpecNoteSidecarPath,
  getWorkbenchSpecNoteTargetHighlightBoxes,
  getWorkbenchSpecNotesModel,
  isWorkbenchSpecNoteInTargetContext,
  setWorkbenchSpecNoteTargetHighlightBoxes,
  type WorkbenchSpecNoteHighlightBox,
  type WorkbenchSpecNoteHighlightBoxRect,
} from '@domain/project/workbenchSpecNotes';
import {
  normalizeWorkbenchSourceWriteContents,
  readWorkbenchSourceFile,
  saveWorkbenchCodexDesignHandoff,
  saveWorkbenchComponents,
  saveWorkbenchPages,
  saveWorkbenchHistory,
  loadWorkbenchSavePoints,
  saveWorkbenchSavePoints,
  deleteWorkbenchSourceFile,
  writeWorkbenchSourceFile,
  createWorkbenchSourceFolder,
  readWorkbenchDiskImportFiles,
  moveWorkbenchSourcePath,
  removeWorkbenchSourceFolder,
} from '@domain/project/workbenchProjectLoader';
import {
  subscribeWorkbenchProjectChangeEvents,
  toWorkbenchPreviewUrl,
  withWorkbenchLocalBridgePairingParams,
  workbenchFetch,
} from '@domain/project/workbenchHostTransport';
import {
  reconcileWorkbenchPagesWithSourceFiles,
  renameWorkbenchComponent,
  renameWorkbenchPage,
} from '@domain/project/workbenchProjectRegistryOperations';
import {
  WORKBENCH_PAGES_ROOT,
  getAllWorkbenchPageFolders,
  getPageFolderAncestors,
  getPageFolderForSourceFile,
  getPageSourceFileForFolder,
  getWorkbenchPageFolders,
  withWorkbenchPageFolders,
} from '@domain/project/workbenchPageFolders';
import { reExpressRelativeImportSpecifier, rewriteRelativeImportsForFileMove } from '@domain/document/sourceFileMove';
import { findWorkbenchSourceFileDependents } from '@domain/document/sourceDependencies';
import { Button, IconButton, SelectControl, TextArea, TextField } from '@shared/ui/primitives';
import {
  WorkbenchEditorFrame,
  WorkbenchEditorPanel,
  WorkbenchEditorSidebar,
  WorkbenchEditorSurface,
  WorkbenchResizeHandle,
  WorkbenchSidebarSplitHandle,
} from './WorkbenchEditorShell';
import { WorkbenchTopbarActions } from './WorkbenchTopbarActions';
import {
  WorkbenchPreviewNode,
  WorkbenchPreviewStage,
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
} from './WorkbenchSidebarPrimitives';
import { useWorkbenchSidebarSplitLayout } from './useWorkbenchSidebarSplitLayout';
import { ModalField, ModalFieldList, ModalLayer } from './ModalLayer';
import { InspectorTokenPicker, type TokenPickerScopeFilter } from './TokenPicker';
import {
  DesignInspectorPanel,
  SourceStyleTextControl,
} from './DesignInspectorPanel';
import {
  DESIGN_SOURCE_GROUP_IDS,
  DesignSourceTargetList,
  DesignSourceTargetTabs,
  getDesignSourceFileName,
  getDesignTargetKey,
  isDesignTargetActive,
  type DesignSourceGroupId,
  type DesignSourceTarget,
  type DesignSourceTreeDropIndicator,
} from './DesignSourceNavigator';
import type {
  InspectorTokenPickerFilters,
  PreviewTokenModeSelection,
  SpecNoteHistoryChange,
} from './DesignInspectorTypes';
import {
  SOURCE_TREE_PREVIEW_FRAME_HTML,
  SourceTreePreview,
  syncSourceTreePreviewFrameHead,
  syncSourceTreePreviewFrameTokenVariables,
  type SourceTreePreviewDrillOrigin,
  type SourceTreePreviewSelectionMode,
} from './SourceTreePreview';
import { getSourceTreePreviewTokenVariables } from './sourceTreePreviewTokens';
import type { SourceTreePreviewTailwindCssMode } from './sourceTreePreviewTailwindRuntime';
import { WorkbenchPortalScopeContext } from '../../../runtime/workbenchReactRuntimeGlobals';
import {
  DEFAULT_DESIGN_PREVIEW_VIEWPORT,
  DESIGN_PREVIEW_APPEARANCES,
  DESIGN_PREVIEW_VIEWPORT_PRESETS,
  formatPreviewTokenModeSummary,
  getDesignPreviewAppearanceThemeMode,
  getDesignPreviewViewportPreset,
  getPreviewTokenModeId,
  normalizeDesignPreviewViewportDimension,
  reconcileDesignPreviewViewport,
  reconcilePreviewTokenModes,
  type DesignPreviewAppearance,
  type DesignPreviewViewport,
  type DesignPreviewViewportPresetId,
} from './designPreviewSettings';
import {
  getWorkbenchStory as getRegisteredWorkbenchStory,
  getWorkbenchStoryBySourceName as getRegisteredWorkbenchStoryBySourceName,
} from '../../../workbench-stories/stories';
import {
  getWorkbenchStoryDesignControls,
  getWorkbenchStoryDesignDefaultArgs,
  isWorkbenchStoryControlVisible,
  type WorkbenchStory as RegisteredWorkbenchStory,
  type WorkbenchStoryArgs,
  type WorkbenchStoryArgValue,
  type WorkbenchStoryControl,
} from '../../../workbench-stories/storyTypes';
import {
  getComponentCsfStorySourceFile,
  getFallbackControlsFromArgs,
  importWorkbenchCsfStoryMetadata,
  isWorkbenchCsfRuntimeDependencyChangePath,
} from '../../../workbench-stories/sourceStoryMetadata';
import { importStorybookCsfStory } from '../../../workbench-stories/csfRuntimeLoader';

const SOURCE_ICON_IMPORT_SOURCES = new Set(['@tabler/icons-react', '@remixicon/react', 'lucide-react']);
type DesignPreviewSelectionMode = SourceTreePreviewSelectionMode;
type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>;
};
type DesignPreviewStyleDeclarationPatch = {
  property: SourceStyleProperty;
  value: string | null;
};
type DesignPastePlacement = 'below' | 'inside';
type WorkbenchStory = {
  componentId: string;
  controls: WorkbenchStoryControl[];
  defaultArgs: WorkbenchStoryArgs;
  designControls?: WorkbenchStoryControl[];
  designDefaultArgs?: WorkbenchStoryArgs;
  description: string;
  name: string;
  render: (args: WorkbenchStoryArgs) => ReactNode;
  sourceFile: string;
  sourceInsert?: {
    componentName?: string;
    imports?: Array<{ importSource?: string; names: string[]; sourceFile?: string }>;
    jsxChildren?: string;
    jsxProps?: Record<string, string>;
    props?: Record<string, boolean | number | string>;
    sourceFile?: string;
  };
  variants: Array<{ args: WorkbenchStoryArgs; id: string; name: string }>;
};
type WorkbenchSourceInsertStory = RegisteredWorkbenchStory & {
  sourceInsert?: WorkbenchStory['sourceInsert'];
};
type DesignComponentPickerSelectResult = Promise<string | null | void> | string | null | void;
type DesignComponentPickerComponentState = {
  blockedReason?: string;
  canSelect: boolean;
  meta: string;
};

const CSF_STORY_METADATA_RETRY_DELAYS_MS = [0, 160, 480] as const;

async function importWorkbenchCsfStoryMetadataWithRetry(
  sourceFile: string,
  component: DesignLibraryComponent,
): Promise<RegisteredWorkbenchStory | null> {
  for (const delay of CSF_STORY_METADATA_RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
    }
    const story = await importWorkbenchCsfStoryMetadata(sourceFile, component);
    if (story) return story;
  }
  return null;
}

function setWorkbenchPreviewIconSourceMap(sources: Record<string, string>) {
  (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__ = sources;
}

function getWorkbenchStory(component: DesignLibraryComponent): WorkbenchStory | null {
  const story = getRegisteredWorkbenchStory(component.id) ??
    getComponentSourceNames(component).map((sourceName) => getRegisteredWorkbenchStoryBySourceName(sourceName)).find(Boolean);
  return story ? {
    ...story,
    sourceFile: component.sourceFile,
  } : null;
}

function resolveDesignComponentForSourceNode(
  node: EditableTreeNode | null,
  components: DesignLibraryComponent[],
): DesignLibraryComponent | null {
  if (node?.kind !== 'component-instance') return null;
  const source = node.source;
  const sourceNames = getSourceNodeComponentNameCandidates(node);
  if (sourceNames.length === 0) return null;
  const resolvedSourceFile = source?.importSource
    ? resolveProjectImportSourcePath(source.sourceFile, source.importSource)
    : source?.sourceFile ?? null;
  if (!resolvedSourceFile) return null;
  const normalizedSourceFile = normalizeSourceFileReference(resolvedSourceFile);

  const sourceFileMatches = (component: DesignLibraryComponent) => {
    const normalizedComponentSourceFile = normalizeSourceFileReference(component.sourceFile);
    return componentSourceFileMatchesResolvedImport(normalizedComponentSourceFile, normalizedSourceFile);
  };
  const explicitExportMatch = components.find((component) => (
    sourceFileMatches(component) &&
    getExplicitComponentSourceNames(component).some((name) => sourceNames.includes(name))
  ));
  if (explicitExportMatch) return explicitExportMatch;

  return components.find((component) => (
    sourceFileMatches(component) &&
    getComponentSourceNames(component).some((name) => sourceNames.includes(name))
  )) ?? resolveUniqueDesignComponentBySourceName(sourceNames, components);
}

function resolveUniqueDesignComponentBySourceName(
  sourceNames: string[],
  components: DesignLibraryComponent[],
): DesignLibraryComponent | null {
  const explicitMatches = components.filter((component) => (
    getExplicitComponentSourceNames(component).some((name) => sourceNames.includes(name))
  ));
  if (explicitMatches.length === 1) return explicitMatches[0] ?? null;

  const matches = components.filter((component) => (
    getComponentSourceNames(component).some((name) => sourceNames.includes(name))
  ));
  return matches.length === 1 ? matches[0] ?? null : null;
}

function createSourceNodeStoryComponentFallback(node: EditableTreeNode | null): DesignLibraryComponent | null {
  if (!node || node.kind !== 'component-instance' || !node.source?.importSource) return null;
  const componentName = node.source.importName ?? node.source.jsxName ?? node.label;
  if (!componentName || !/^[A-Z][A-Za-z0-9_$]*$/.test(componentName)) return null;

  const resolvedSourceFile = resolveProjectImportSourcePath(node.source.sourceFile, node.source.importSource);
  if (!resolvedSourceFile || !resolvedSourceFile.startsWith('src/components/')) return null;
  const isVueSourceImport = /\.vue$/i.test(resolvedSourceFile);
  const sourceFile = isVueSourceImport
    ? resolvedSourceFile
    : `${normalizeSourceFileReference(resolvedSourceFile)}.tsx`;

  return {
    componentSetId: 'component-set-local',
    extensions: {
      source: 'local',
      currentSourceFile: sourceFile,
      importedFrom: sourceFile,
      importName: componentName,
      sourceExportName: componentName,
      sourceTruth: 'project-local',
      storyFormat: 'csf',
      storySourceFile: isVueSourceImport
        ? sourceFile.replace(/\.vue$/i, '.stories.ts')
        : `${sourceFile.replace(/\.(tsx?|jsx?)$/i, '')}.stories.tsx`,
      syncStatus: 'pinned',
    },
    id: `source-fallback-${sourceFile.replace(/[^A-Za-z0-9_-]+/g, '-')}-${componentName}`,
    name: componentName,
    sourceFile,
    variants: [],
  };
}

function getSourceNodeComponentNameCandidates(node: EditableTreeNode): string[] {
  return dedupeStrings([
    node.source?.importName,
    node.source?.jsxName,
    node.label,
  ].filter((value): value is string => Boolean(value && value.trim())));
}

function componentSourceFileMatchesResolvedImport(componentSourceFile: string, resolvedImportSource: string): boolean {
  if (componentSourceFile === resolvedImportSource) return true;
  if (componentSourceFile.startsWith(`${resolvedImportSource}/`)) return true;

  const componentWithoutExtension = stripSourceModuleExtension(componentSourceFile);
  const importWithoutExtension = stripSourceModuleExtension(resolvedImportSource);
  if (componentWithoutExtension === importWithoutExtension) return true;

  return componentWithoutExtension === `${importWithoutExtension}/index`;
}

function stripSourceModuleExtension(sourceFile: string): string {
  return sourceFile.replace(/\.(?:tsx|ts|jsx|js)$/i, '');
}

function collectHydratableImportedComponentSourceFiles(
  root: EditableTreeNode | null,
  components: DesignLibraryComponent[],
  getSourceTree: (sourceFile: string) => EditableDocumentTree | null,
): string[] {
  const sourceFiles = new Set<string>();
  const visitedSourceFiles = new Set<string>();

  function visit(node: EditableTreeNode) {
    const component = resolveHydratableComponentForSourceNode(node, components);
    if (component && node.source?.sourceFile !== component.sourceFile) {
      sourceFiles.add(component.sourceFile);
      if (!visitedSourceFiles.has(component.sourceFile)) {
        visitedSourceFiles.add(component.sourceFile);
        const componentTree = getSourceTree(component.sourceFile);
        if (componentTree?.root) visit(componentTree.root);
      }
    }
    for (const child of node.children ?? []) visit(child);
  }

  if (root) {
    const rootSourceFile = root.source?.sourceFile;
    if (rootSourceFile) visitedSourceFiles.add(rootSourceFile);
    visit(root);
  }
  return [...sourceFiles].sort();
}

function hydrateEditableDocumentTreeWithImportedComponentSources({
  components,
  getSourceTree,
  tree,
}: {
  components: DesignLibraryComponent[];
  getSourceTree: (sourceFile: string) => EditableDocumentTree | null;
  tree: EditableDocumentTree | null;
}): EditableDocumentTree | null {
  if (!tree) return null;
  return {
    ...tree,
    root: hydrateEditableTreeNodeWithImportedComponentSources({
      components,
      getSourceTree,
      node: tree.root,
      visitedSourceFiles: new Set([tree.root.source?.sourceFile ?? ''].filter(Boolean)),
    }),
  };
}

function hydrateEditableTreeNodeWithImportedComponentSources({
  components,
  getSourceTree,
  node,
  visitedSourceFiles,
}: {
  components: DesignLibraryComponent[];
  getSourceTree: (sourceFile: string) => EditableDocumentTree | null;
  node: EditableTreeNode;
  visitedSourceFiles: Set<string>;
}): EditableTreeNode {
  const component = resolveHydratableComponentForSourceNode(node, components);
  const authoredChildren = node.children ?? [];
  const authoredPreviewChildren = node.sourcePreviewChildren ?? [];
  if (
    component &&
    authoredChildren.length === 0 &&
    authoredPreviewChildren.length === 0 &&
    !visitedSourceFiles.has(component.sourceFile) &&
    node.source?.sourceFile !== component.sourceFile
  ) {
    const componentTree = getSourceTree(component.sourceFile);
    if (componentTree?.root) {
      const nextVisitedSourceFiles = new Set(visitedSourceFiles);
      nextVisitedSourceFiles.add(component.sourceFile);
      return {
        ...node,
        children: [
          hydrateEditableTreeNodeWithImportedComponentSources({
            components,
            getSourceTree,
            node: componentTree.root,
            visitedSourceFiles: nextVisitedSourceFiles,
          }),
        ],
        sourceAttributes: {
          ...(node.sourceAttributes ?? null),
          'data-wb-runtime-hydrated-children': 'true',
        },
      };
    }
  }

  const children = authoredChildren.map((child) => hydrateEditableTreeNodeWithImportedComponentSources({
    components,
    getSourceTree,
    node: child,
    visitedSourceFiles,
  }));
  return children && children.length > 0 ? { ...node, children } : node;
}

function resolveHydratableComponentForSourceNode(
  node: EditableTreeNode | null,
  components: DesignLibraryComponent[],
): DesignLibraryComponent | null {
  const component = resolveDesignComponentForSourceNode(node, components);
  return component && isInlineExpandableDesignComponent(component) ? component : null;
}

function isInlineExpandableDesignComponent(component: DesignLibraryComponent): boolean {
  if (getStringExtension(component.extensions, 'sourceHydration') !== 'inline') return false;
  const rawSourceFile = normalizeProjectSourceFileReference(component.sourceFile);
  if (!rawSourceFile || !/\.[jt]sx$/i.test(rawSourceFile)) return false;
  const sourceFile = normalizeSourceFileReference(rawSourceFile);
  if (sourceFile.startsWith('src/components/ui/')) return false;
  if (sourceFile.includes('/node_modules/')) return false;
  return true;
}

function getComponentStoryForInspector({
  cachedStory,
  component,
  node,
}: {
  cachedStory: RegisteredWorkbenchStory | null | undefined;
  component: DesignLibraryComponent | null;
  node: EditableTreeNode | null;
}): RegisteredWorkbenchStory | null {
  if (!node || node.kind !== 'component-instance') return null;
  const registeredStory = component ? getWorkbenchStory(component) : null;
  if (registeredStory && isComponentStoryCompatibleWithSourceNode(registeredStory, node, component)) {
    return registeredStory;
  }
  if (component && getComponentCsfStorySourceFile(component)) {
    return cachedStory && isComponentStoryCompatibleWithSourceNode(cachedStory, node, component)
      ? cachedStory
      : createSourcePropsStoryForInspector(node, component);
  }
  return createSourcePropsStoryForInspector(node, component);
}

function isComponentStoryCompatibleWithSourceNode(
  story: RegisteredWorkbenchStory,
  node: EditableTreeNode,
  component: DesignLibraryComponent | null,
): boolean {
  const candidates = new Set([
    node.label,
    node.source?.jsxName,
    node.source?.importName,
    component?.id,
    component?.name,
    ...(component ? getComponentSourceNames(component) : []),
  ].filter((value): value is string => Boolean(value)));
  return candidates.has(story.name) || candidates.has(story.componentId);
}

function createSourcePropsStoryForInspector(
  node: EditableTreeNode,
  component: DesignLibraryComponent | null,
): RegisteredWorkbenchStory | null {
  const defaultArgs = getSimpleSourcePropsStoryArgs(node.sourceProps);
  if (Object.keys(defaultArgs).length === 0) return null;
  const name = component?.name ?? node.source?.jsxName ?? node.label;
  return {
    componentId: component?.id ?? node.id,
    controls: getFallbackControlsFromArgs(defaultArgs),
    defaultArgs,
    description: 'Props currently present in JSX.',
    name,
    render: () => null,
    variants: [],
  };
}

function getSimpleSourcePropsStoryArgs(sourceProps: EditableTreeNode['sourceProps']): WorkbenchStoryArgs {
  const args: WorkbenchStoryArgs = {};
  for (const [key, value] of Object.entries(sourceProps ?? {})) {
    if (key === 'className') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') args[key] = value;
  }
  return args;
}

function getComponentStoryMetadataCacheKey(
  component: DesignLibraryComponent,
  projectId: string,
  runtimeRevision: number,
): string {
  return `${projectId}:${runtimeRevision}:${component.id}:${component.sourceFile}:${getStringExtension(component.extensions, 'storySourceFile') ?? ''}`;
}

function normalizeSourceFileReference(sourceFile: string): string {
  const normalized = normalizeProjectSourceFileReference(sourceFile).replace(/\.(tsx|ts|jsx|js)$/, '');
  return normalized.endsWith('/index') ? normalized.slice(0, -'/index'.length) : normalized;
}

function getComponentSourceParseNames(componentName: string): string[] {
  const trimmed = componentName.trim();
  if (!trimmed) return [];
  return dedupeStrings([trimmed, toPascalCase(trimmed)]);
}

function getComponentSourceNames(component: DesignLibraryComponent): string[] {
  return dedupeStrings([
    ...getExplicitComponentSourceNames(component),
    ...getComponentSourceParseNames(component.name),
  ]);
}

function getExplicitComponentSourceNames(component: DesignLibraryComponent): string[] {
  return dedupeStrings([
    getStringExtension(component.extensions, 'importName'),
    getStringExtension(component.extensions, 'sourceExportName'),
  ].filter((value): value is string => Boolean(value && value.trim())));
}

function getComponentSourceExportName(component: DesignLibraryComponent): string {
  return getComponentSourceNames(component)[0] ?? component.name;
}

function isComponentUsableInInsertPicker(component: DesignLibraryComponent): boolean {
  return getComponentSourceExportName(component).trim().length > 0;
}

function isComponentVisibleInInsertPicker(
  component: DesignLibraryComponent,
  context?: { components: DesignLibraryComponent[]; parentNode: EditableTreeNode | null },
): boolean {
  if (!isComponentUsableInInsertPicker(component)) return false;
  if (component.extensions?.hiddenFromInsert !== true) return true;
  return context ? isHiddenComponentVisibleForSourceParent(component, context) : false;
}

function isHiddenComponentVisibleForSourceParent(
  component: DesignLibraryComponent,
  context: { components: DesignLibraryComponent[]; parentNode: EditableTreeNode | null },
): boolean {
  const parentNode = context.parentNode;
  if (!parentNode?.source) return false;
  const hiddenComponentSourceFile = normalizeSourceFileReference(component.sourceFile);

  if (
    typeof parentNode.source.sourceFile === 'string' &&
    normalizeSourceFileReference(parentNode.source.sourceFile) === hiddenComponentSourceFile
  ) {
    return true;
  }

  const parentSourceNames = dedupeStrings([
    parentNode.source.importName,
    parentNode.source.jsxName,
  ].filter((value): value is string => Boolean(value && value.trim())));
  if (parentSourceNames.length === 0) return false;

  const parentComponent = context.components.find((candidate) => (
    getComponentSourceNames(candidate).some((name) => parentSourceNames.includes(name))
  ));
  if (!parentComponent) return false;

  return normalizeSourceFileReference(parentComponent.sourceFile) === hiddenComponentSourceFile;
}

function getComponentsVisibleForSourceInsert(
  components: DesignLibraryComponent[],
  parentNode: EditableTreeNode | null,
): DesignLibraryComponent[] {
  const parentJsxName = parentNode?.source?.jsxName ?? '';
  const existingChildElementNames = parentNode ? getSourceChildElementNames(parentNode) : [];
  return components.filter((component) => {
    if (!isComponentVisibleInInsertPicker(component, { components, parentNode })) return false;
    if (!parentJsxName) return true;
    if (parentNode && canTreatSourceNodeAsExplicitUnknownChildrenContainer(parentNode)) return true;
    return canAddSourceChildIntoParent(parentJsxName, getComponentSourceExportName(component), existingChildElementNames);
  });
}

function getSourceChildElementNames(parentNode: EditableTreeNode): string[] {
  return dedupeStrings(getEditableTreeChildrenForDesign(parentNode).flatMap((child) => [
    child.source?.jsxName,
    child.source?.importName,
  ].filter((value): value is string => Boolean(value && value.trim()))));
}

function canAddComponentToSourceParent(parentNode: EditableTreeNode, componentName: string): boolean {
  const parentJsxName = parentNode.source?.jsxName ?? '';
  return Boolean(parentJsxName) &&
    (canTreatSourceNodeAsExplicitUnknownChildrenContainer(parentNode) ||
    canAddSourceChildIntoParent(parentJsxName, componentName, getSourceChildElementNames(parentNode)));
}

const SOURCE_INSERT_UNIQUE_VALUE_COMPONENTS = new Set([
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

function prepareSourceInsertComponentProps({
  parentNode,
  props,
  sourceComponentName,
}: {
  parentNode: EditableTreeNode;
  props: WorkbenchStoryArgs;
  sourceComponentName: string;
}): WorkbenchStoryArgs {
  if (!SOURCE_INSERT_UNIQUE_VALUE_COMPONENTS.has(sourceComponentName)) return props;
  const currentValue = typeof props.value === 'string' ? props.value.trim() : '';
  if (!currentValue) return props;

  const existingValues = getSourceChildPropValues(parentNode, 'value');
  if (!existingValues.has(currentValue)) return props;
  const nextValue = createNextSourceInsertChildValue(existingValues, currentValue);
  return {
    ...prepareSourceInsertGenericDisplayProps(props, nextValue),
    value: nextValue,
  };
}

type PreparedSourceInsertJsxChildren = {
  jsxChildren: string | undefined;
  valueReplacements: Map<string, string>;
};

function prepareSourceInsertJsxChildren({
  jsxChildren,
  parentNode,
}: {
  jsxChildren: string | undefined;
  parentNode: EditableTreeNode;
}): PreparedSourceInsertJsxChildren {
  const valueReplacements = new Map<string, string>();
  if (!jsxChildren) return { jsxChildren, valueReplacements };
  const existingValues = getSourceChildPropValues(parentNode, 'value');
  const nextJsxChildren = jsxChildren.replace(
    /<([A-Z][A-Za-z0-9_$]*)([^<>]*?\svalue=")([^"]+)("[^<>]*?)(\/>|>([^<>]*)<\/\1>|>)/g,
    (
      match,
      elementName: string,
      beforeValue: string,
      value: string,
      afterValue: string,
      tail: string,
      textContent: string | undefined,
    ) => {
      if (!SOURCE_INSERT_UNIQUE_VALUE_COMPONENTS.has(elementName)) return match;
      const currentValue = value.trim();
      if (!currentValue) return match;
      if (!existingValues.has(currentValue)) {
        existingValues.add(currentValue);
        return match;
      }
      const nextValue = createNextSourceInsertChildValue(existingValues, currentValue);
      existingValues.add(nextValue);
      if (!valueReplacements.has(currentValue)) valueReplacements.set(currentValue, nextValue);
      const nextAfterValue = prepareSourceInsertGenericDisplayAttributes(afterValue, nextValue);
      if (tail === '/>') return `<${elementName}${beforeValue}${nextValue}${nextAfterValue}/>`;
      if (tail === '>') return `<${elementName}${beforeValue}${nextValue}${nextAfterValue}>`;
      const nextTextContent = typeof textContent === 'string'
        ? createNextSourceInsertDisplayText(textContent, nextValue)
        : textContent;
      return `<${elementName}${beforeValue}${nextValue}${nextAfterValue}>${nextTextContent}</${elementName}>`;
    },
  );
  return {
    jsxChildren: prepareSourceInsertDefaultValueAttributes(nextJsxChildren, valueReplacements),
    valueReplacements,
  };
}

function prepareSourceInsertPropsWithValueReplacements(
  props: WorkbenchStoryArgs,
  valueReplacements: Map<string, string>,
): WorkbenchStoryArgs {
  if (valueReplacements.size === 0) return props;
  const nextProps = { ...props };
  const defaultValue = nextProps.defaultValue;
  if (typeof defaultValue === 'string') {
    nextProps.defaultValue = valueReplacements.get(defaultValue.trim()) ?? defaultValue;
  }
  return nextProps;
}

function prepareSourceInsertDefaultValueAttributes(
  jsxChildren: string,
  valueReplacements: Map<string, string>,
): string {
  if (valueReplacements.size === 0) return jsxChildren;
  return jsxChildren.replace(
    /\sdefaultValue="([^"]*)"/g,
    (match, defaultValue: string) => {
      const nextDefaultValue = valueReplacements.get(defaultValue.trim());
      return nextDefaultValue ? match.replace(`"${defaultValue}"`, `"${nextDefaultValue}"`) : match;
    },
  );
}

function prepareSourceInsertGenericDisplayProps(
  props: WorkbenchStoryArgs,
  nextValue: string,
): WorkbenchStoryArgs {
  const nextProps = { ...props };
  for (const propName of ['children', 'title', 'trigger'] as const) {
    const propValue = nextProps[propName];
    if (typeof propValue === 'string') {
      nextProps[propName] = createNextSourceInsertDisplayText(propValue, nextValue);
    }
  }

  if (typeof nextProps.shortcut === 'string') {
    nextProps.shortcut = createNextSourceInsertShortcutText(nextProps.shortcut, nextValue);
  }

  return nextProps;
}

function prepareSourceInsertGenericDisplayAttributes(
  attributeText: string,
  nextValue: string,
): string {
  return attributeText.replace(
    /\s(title|trigger|shortcut)="([^"]*)"/g,
    (match, propName: string, propValue: string) => {
      const nextPropValue = propName === 'shortcut'
        ? createNextSourceInsertShortcutText(propValue, nextValue)
        : createNextSourceInsertDisplayText(propValue, nextValue);
      return match.replace(`"${propValue}"`, `"${nextPropValue}"`);
    },
  );
}

const SOURCE_INSERT_GENERIC_DISPLAY_BASES = new Set([
  'Action',
  'Content',
  'Item',
  'Link',
  'Option',
  'Panel',
  'Page',
  'Tab',
]);

function createNextSourceInsertDisplayText(currentText: string, nextValue: string): string {
  const index = getSourceInsertTrailingIndex(nextValue);
  if (index == null) return currentText;
  const trimmed = currentText.trim();
  const match = /^(.*?)(?:\s+\d+)?$/.exec(trimmed);
  const base = match?.[1]?.trim() ?? '';
  if (!SOURCE_INSERT_GENERIC_DISPLAY_BASES.has(base)) return currentText;
  return `${base} ${index}`;
}

function createNextSourceInsertShortcutText(currentText: string, nextValue: string): string {
  const index = getSourceInsertTrailingIndex(nextValue);
  if (index == null || !/^⌘\d+$/.test(currentText.trim())) return currentText;
  return `⌘${index}`;
}

function getSourceChildPropValues(parentNode: EditableTreeNode, propName: string): Set<string> {
  const values = new Set<string>();
  const visit = (child: EditableTreeNode) => {
    const value = child.sourceProps?.[propName];
    if (typeof value === 'string' && value.trim()) values.add(value.trim());
    for (const grandchild of getEditableTreeChildrenForDesign(child)) visit(grandchild);
  };
  for (const child of getEditableTreeChildrenForDesign(parentNode)) visit(child);
  return values;
}

function createNextSourceInsertChildValue(existingValues: Set<string>, seed: string): string {
  const normalizedSeed = seed.trim() || 'item-1';
  const match = /^(.*?)(\d+)$/.exec(normalizedSeed);
  const prefix = match ? match[1] : `${normalizedSeed}-`;
  let index = match ? Number(match[2]) : 1;
  if (!Number.isFinite(index) || index < 1) index = 1;

  let candidate = `${prefix}${index}`;
  while (existingValues.has(candidate)) {
    index += 1;
    candidate = `${prefix}${index}`;
  }
  return candidate;
}

function getSourceInsertTrailingIndex(value: string): number | null {
  const match = /(\d+)$/.exec(value.trim());
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isFinite(index) && index >= 1 ? index : null;
}

// In memory only: a source lane persists its `value` but not its stacks, so
// depth costs nothing on disk and matches the page stack that orders it.
// Consecutive entries share their source strings — one edit's `after` is the
// next one's `before` — so a lane holds roughly one copy per step, not two.
const SOURCE_HISTORY_MAX_ENTRIES = 200;
const SOURCE_HISTORY_SAVE_DEBOUNCE_MS = 600;
const SPEC_NOTE_HISTORY_MAX_ENTRIES = 200;
// The page stack orders actions; the per-kind payload stacks it points into
// still bound themselves.
const DESIGN_PAGE_HISTORY_MAX_ENTRIES = 200;
const RUNTIME_DESIGN_HISTORY_MAX_ENTRIES = 100;
const WORKSPACE_HISTORY_MAX_ENTRIES = 100;
const DESIGN_SOURCE_LIST_DEFAULT_HEIGHT = 156;
const DESIGN_LAYER_DRAG_AUTO_SCROLL_EDGE_PX = 72;
const DESIGN_LAYER_DRAG_AUTO_SCROLL_MAX_PX = 42;
let designScopedStyleCounter = 0;
const ACTIVE_DESIGN_LAYER_ID_EXTENSION = 'activeDesignLayerId';
const SELECTED_DESIGN_LAYER_IDS_EXTENSION = 'selectedDesignLayerIds';
const COLLAPSED_DESIGN_LAYER_IDS_EXTENSION = 'collapsedDesignLayerIds';
const DESIGN_PREVIEW_DRILL_PATH_EXTENSION = 'designPreviewDrillPath';
const OPEN_DESIGN_TARGET_KEYS_EXTENSION = 'openDesignTargetKeys';
// One chronological stack per page/component lane, holding the kinds that belong
// to that one file interleaved in the order the user performed them. Undo walks
// only the active lane's stack, so restoring an entry can never switch pages —
// the previous model kept a single global order across five kinds, and a
// selection entry carries the whole selection state including `activeTarget`.
//
// `runtime` stays out: it only fires on the Storybook surface and is already
// dropped whenever the projection is replaced. `workspace` stays out too — it
// mutates pages.json and the filesystem, so a `delete folder` step would become
// unreachable once its page is gone.
type DesignPageHistoryEntry =
  | { kind: 'notes' }
  | { kind: 'selection'; after: WorkbenchSelectionState; before: WorkbenchSelectionState }
  | { kind: 'source' };

type DesignPageHistoryStack = {
  redo: DesignPageHistoryEntry[];
  undo: DesignPageHistoryEntry[];
};

// A reversible filesystem/registry mutation (create/rename/delete folder, move
// a page between folders). Unlike per-file content lanes these touch real
// directories and pages.json, so undo/redo re-run the inverse async operations.
type WorkspaceDesignHistoryEntry = {
  label: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

type RuntimeDesignHistoryEntry = {
  after: EditableDocumentTree;
  before: EditableDocumentTree;
  label: string;
  projectionKey: string;
};

type DesignConnectedArrayContext = {
  items: EditableTreeSourcePropArray;
  propName: string;
  sourceNode: EditableTreeNode;
};

type DesignLayerNodeMetadata = {
  connectedArrayContext: DesignConnectedArrayContext | null;
  hasReadOnlySourceMapAncestor: boolean;
  node: EditableTreeNode;
  selectableNodeId: string;
  sourcePreviewOnly: boolean;
};

type DesignLayerSelectionBoundary = {
  node: EditableTreeNode;
  reason: 'source-map' | 'source-preview';
  sourcePreviewOnly: boolean;
};

function createDesignLayerNodeMetadataMap(root: EditableTreeNode | null): Map<string, DesignLayerNodeMetadata> {
  const metadataById = new Map<string, DesignLayerNodeMetadata>();
  if (!root) return metadataById;
  const mapSourcePropNameByNodeId = createDesignMapSourcePropNameByNodeId(root);
  const visitedNodeIds = new Set<string>();

  function visit(
    node: EditableTreeNode,
    sourcePreviewOnly: boolean,
    boundary: DesignLayerSelectionBoundary | null,
    path: EditableTreeNode[],
    hasReadOnlySourceMapAncestor: boolean,
  ) {
    if (visitedNodeIds.has(node.id)) return;
    visitedNodeIds.add(node.id);
    path.push(node);
    const nextHasReadOnlySourceMapAncestor = hasReadOnlySourceMapAncestor ||
      Boolean(node.sourceMapBinding && !node.sourceMapBinding.source.writable);
    metadataById.set(node.id, {
      connectedArrayContext: getConnectedArrayContextForNodePath(
        node,
        path,
        mapSourcePropNameByNodeId.get(node.id) ?? null,
      ),
      hasReadOnlySourceMapAncestor: nextHasReadOnlySourceMapAncestor,
      node,
      selectableNodeId: boundary?.node.id ?? node.id,
      sourcePreviewOnly,
    });

    const descendantBoundary = boundary ?? (node.sourceMapBinding
      ? {
          node,
          reason: 'source-map' as const,
          sourcePreviewOnly,
        }
      : null);

    for (const child of node.children ?? []) {
      const childBoundary = child.sourcePreviewOrigin === 'forwarded-source-child'
        ? descendantBoundary?.reason === 'source-map'
          ? descendantBoundary
          : null
        : descendantBoundary;
      visit(
        child,
        getEditableTreePreviewChildSourcePreviewOnly({
          child,
          parentSourcePreviewOnly: sourcePreviewOnly,
          sourcePreviewChild: false,
        }),
        childBoundary,
        path,
        nextHasReadOnlySourceMapAncestor,
      );
    }

    for (const child of node.sourcePreviewChildren ?? []) {
      const childSourcePreviewOnly = getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: true,
      });
      const previewBoundary = child.sourcePreviewOrigin === 'forwarded-source-child'
        ? descendantBoundary?.reason === 'source-map'
          ? descendantBoundary
          : null
        : descendantBoundary ?? (childSourcePreviewOnly
          ? {
              node,
              reason: 'source-preview' as const,
              sourcePreviewOnly,
            }
          : null);
      visit(
        child,
        childSourcePreviewOnly,
        previewBoundary,
        path,
        nextHasReadOnlySourceMapAncestor,
      );
    }
    path.pop();
  }

  visit(root, false, null, [], false);
  return metadataById;
}

function createDesignMapSourcePropNameByNodeId(root: EditableTreeNode): Map<string, string | null> {
  const propNameByNodeId = new Map<string, string | null>();

  function visit(node: EditableTreeNode): string | null {
    if (propNameByNodeId.has(node.id)) return propNameByNodeId.get(node.id) ?? null;
    propNameByNodeId.set(node.id, null);
    let propName = node.sourceExpression?.kind === 'map'
      ? node.sourceExpression.mapSource?.propName ?? null
      : null;
    for (const child of [...(node.children ?? []), ...(node.sourcePreviewChildren ?? [])]) {
      const childPropName = visit(child);
      if (!propName && childPropName) propName = childPropName;
    }
    propNameByNodeId.set(node.id, propName);
    return propName;
  }

  visit(root);
  return propNameByNodeId;
}

function getConnectedArrayContextForNodePath(
  selectedNode: EditableTreeNode | null,
  path: EditableTreeNode[],
  mapPropName: string | null,
): DesignConnectedArrayContext | null {
  if (!selectedNode) return null;
  const sourceMapNode = [selectedNode, ...[...path].reverse()].find((candidate) => (
    Boolean(candidate.sourceMapBinding?.items?.length && candidate.sourceMapBinding.source.writable)
  )) ?? null;
  if (sourceMapNode?.sourceMapBinding?.items) {
    return {
      items: sourceMapNode.sourceMapBinding.items,
      propName: sourceMapNode.sourceMapBinding.source.code,
      sourceNode: sourceMapNode,
    };
  }

  const referencedArrayOwner = [selectedNode, ...[...path].reverse()]
    .map((candidate) => ({
      candidate,
      referencedArray: getEditableTreeReferencedArrayProp(candidate),
    }))
    .find(({ referencedArray }) => Boolean(referencedArray)) ?? null;
  if (referencedArrayOwner?.referencedArray) {
    return {
      items: referencedArrayOwner.referencedArray.items,
      propName: referencedArrayOwner.referencedArray.propName,
      sourceNode: referencedArrayOwner.candidate,
    };
  }

  const propName = mapPropName;
  if (!propName) return null;

  const sourceNode = [...path].reverse().find((candidate) => (
    isDesignEditableTreeSourcePropArray(candidate.sourceProps?.[propName])
  )) ?? null;
  const items = sourceNode?.sourceProps?.[propName];
  if (!sourceNode || !isDesignEditableTreeSourcePropArray(items)) return null;
  return { items, propName, sourceNode };
}

function findEditableTreeNodePathForDesign(root: EditableTreeNode, nodeId: string): EditableTreeNode[] {
  if (root.id === nodeId) return [root];
  for (const child of root.children ?? []) {
    const childPath = findEditableTreeNodePathForDesign(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  for (const child of root.sourcePreviewChildren ?? []) {
    const childPath = findEditableTreeNodePathForDesign(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  return [];
}

function findEditableTreeNodeForDesign(root: EditableTreeNode | null, nodeId: string | null): EditableTreeNode | null {
  if (!root || !nodeId) return null;
  return findEditableTreeNodeInPreviewTree(root, nodeId)?.node ?? findEditableTreeNode(root, nodeId);
}

function getEditableTreeChildrenForDesign(node: EditableTreeNode): EditableTreeNode[] {
  if (isInlineSvgIconSourceNode(node)) return [];
  return [
    ...(node.children ?? []),
    ...(node.sourcePreviewChildren ?? []).filter((child) => child.sourcePreviewOrigin === 'forwarded-source-child'),
  ];
}

function isInlineSvgIconSourceNode(node: EditableTreeNode): boolean {
  if (node.source?.jsxName?.toLowerCase() !== 'svg') return false;
  const attributes = node.sourceAttributes ?? {};
  return attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon' || Boolean(attributes['data-icon']);
}

function isDesignEditableTreeSourcePropArray(value: unknown): value is EditableTreeSourcePropArray {
  return Array.isArray(value) && value.every((item) => (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.values(item).every((itemValue) => typeof itemValue === 'string' || typeof itemValue === 'number' || typeof itemValue === 'boolean')
  ));
}

function createDesignConnectedArrayItem(items: EditableTreeSourcePropArray): EditableTreeSourcePropObject {
  const fields = getDesignConnectedArrayFields(items);
  const item: EditableTreeSourcePropObject = {};
  for (const field of fields.length > 0 ? fields : ['title']) {
    item[field] = getDesignConnectedArrayDefaultValue(items, field);
  }
  return item;
}

function getDesignConnectedArrayDefaultValue(
  items: EditableTreeSourcePropArray,
  field: string,
): EditableTreeSourcePropObject[string] {
  const sampleValue = items.find((item) => Object.prototype.hasOwnProperty.call(item, field))?.[field];
  if (typeof sampleValue === 'boolean') return false;
  if (field === 'url' || field === 'href') return '#';
  if (field === 'title' || field === 'name' || field === 'label') return 'New item';
  return '';
}

function getDesignConnectedArrayFields(items: EditableTreeSourcePropArray): string[] {
  const preferredOrder = ['title', 'name', 'label', 'url', 'href', 'value', 'id'];
  const fields = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) fields.add(key);
  }
  return [
    ...preferredOrder.filter((key) => fields.has(key)),
    ...[...fields].filter((key) => !preferredOrder.includes(key)).sort((a, b) => a.localeCompare(b)),
  ];
}

type SourceTreeResult = {
  cacheKey: string;
  contents: string | null;
  designStates: EditableTreeSourceDesignState[];
  diagnostic: string;
  runtimeFallbackReasons: string[];
  sourceFile: string;
  tree: EditableDocumentTree | null;
  warnings: string[];
};

type DesignStateOverrideValue = string | number | boolean;

// Projection-only state values keyed by source file. These never reach source
// writeback; they only feed the parser's `scopedValues` so the canvas can show
// a branch other than the declared initial state.
type DesignStateOverrideMap = Record<string, Record<string, DesignStateOverrideValue>>;

function createDesignStateOverrideSignature(
  overrides: Record<string, DesignStateOverrideValue> | undefined,
): string {
  const entries = Object.entries(overrides ?? {});
  if (entries.length === 0) return '';
  return entries
    .slice()
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(',');
}

type SourceTreeParseTarget = {
  cacheKey: string;
  label: string;
  preferredComponentNames: string[];
  sourceFile: string;
};

type SourceComponentPropChangeOptions = {
  target?: 'active-mode' | 'base';
};

type SourceComponentPropUpdate = {
  propName: string;
  value: SourceComponentPropValue;
};

type SourceComponentTypeChangeOptions = {
  allowedPropNames: string[];
  fallbackProps?: SourceComponentTypeFallbackProps;
  importSource: string;
  managedPropNames: string[];
  propOverrides?: SourceComponentTypeFallbackProps;
};

type RuntimeDesignOverlayRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type RuntimePageProjectionTarget = {
  name: string;
  reasons: string[];
  sourceFile: string;
  sourceSignature: string;
};

const RUNTIME_PAGE_PROJECTION_TREE_MESSAGE = 'workbench:runtime-page-projection-tree';
const RUNTIME_PAGE_SELECT_MESSAGE = 'workbench:runtime-page-select';
const RUNTIME_PAGE_DRILL_MESSAGE = 'workbench:runtime-page-drill';
const RUNTIME_PAGE_SELECTION_RECTS_MESSAGE = 'workbench:runtime-page-selection-rects';
const RUNTIME_PAGE_SELECTED_LAYER_MESSAGE = 'workbench:runtime-page-selected-layer';
const RUNTIME_PAGE_CAPTURE_REQUEST_MESSAGE = 'workbench:runtime-page-capture-request';
const RUNTIME_PAGE_KEYBOARD_SHORTCUT_MESSAGE = 'workbench:runtime-page-keyboard-shortcut';

type RuntimePageKeyboardShortcut =
  | { action: 'copy' }
  | { action: 'cut' }
  | { action: 'delete' }
  | { action: 'duplicate' }
  | { action: 'insert-child' }
  | { action: 'move'; intent: SourceKeyboardMoveIntent }
  | { action: 'paste'; placement: DesignPastePlacement }
  | { action: 'wrap' };

type DesignSourceEditShortcutAction =
  | 'copy'
  | 'cut'
  | 'duplicate'
  | 'paste-below'
  | 'paste-inside';

const RUNTIME_FALLBACK_REASON_LABELS: Record<string, string> = {
  'local helper component': 'local helper components declared inside the page',
  'unsupported JSX expression': 'unsupported JSX expressions such as map(), conditionals, or computed JSX',
};

type DesignPreviewLoadState =
  | { diagnostic: string; status: 'empty' }
  | { diagnostic: string; status: 'loading' }
  | { diagnostic: string; status: 'ready' }
  | { diagnostic: string; status: 'unavailable' };

async function parseEditableDocumentTreeFromContents(
  target: SourceTreeParseTarget,
  contents: string,
  scopedValues?: Record<string, DesignStateOverrideValue>,
): Promise<EditableTreeSourceParseResult> {
  const hostedAnalysis = await analyzeSourceWithHostedCore({
    contents,
    preferredComponentNames: target.preferredComponentNames,
    sourceFile: target.sourceFile,
  }).catch(() => null);
  const hostedDiagnostic = formatHostedSourceAnalysisDiagnostic(hostedAnalysis);
  try {
    const result = await createEditableDocumentTreeFromPageSource({
      contents,
      label: target.label,
      preferredComponentNames: target.preferredComponentNames,
      ...(scopedValues && Object.keys(scopedValues).length > 0 ? { scopedValues } : {}),
      sourceFile: target.sourceFile,
    });
    return hostedDiagnostic
      ? {
          ...result,
          diagnostic: `${hostedDiagnostic} ${result.diagnostic}`,
        }
      : result;
  } catch (error) {
    return {
      ok: false,
      diagnostic: [
        hostedDiagnostic,
        `${target.sourceFile} could not be projected: ${formatDesignEditorError(error)}. Using the preview scaffold.`,
      ].filter(Boolean).join(' '),
      tree: null,
    };
  }
}

function formatDesignEditorError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : String(error);
}

function getSourceTreeRuntimeFallbackReasons(tree: EditableDocumentTree | null, warnings: string[] = []): string[] {
  const reasons: string[] = [];
  if (warnings.length > 0) reasons.push('unsupported JSX expression');
  if (tree && hasLocalComponentInstance(tree.root)) reasons.push('local helper component');
  return [...new Set(reasons)];
}

function formatRuntimeFallbackReasonList(reasons: string[]): string {
  const labels = reasons.map((reason) => RUNTIME_FALLBACK_REASON_LABELS[reason] ?? reason);
  if (labels.length === 0) return 'runtime-only source patterns';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function getRuntimeFallbackGuidance(reasons: string[]): string {
  return `This page is locked to a runtime fallback because it contains ${formatRuntimeFallbackReasonList(reasons)}. Workbench can display the React result, but source-layer editing is limited until those helpers, maps, or animations are promoted to registered components with stories and components.json entries.`;
}

function hasLocalComponentInstance(node: EditableTreeNode): boolean {
  if (node.kind === 'component-instance' && !node.source?.importSource) return true;
  return (node.children ?? []).some(hasLocalComponentInstance);
}

function getSourceContentsSignature(contents: string): string {
  let hash = 0;
  for (let index = 0; index < contents.length; index += 1) {
    hash = Math.imul(31, hash) + contents.charCodeAt(index);
    hash |= 0;
  }
  return `${contents.length}:${hash >>> 0}`;
}

function parseWorkbenchCommentRegistryJson(contents: string, path: string): WorkbenchCommentRegistry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${formatDesignEditorError(error)}`);
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== '0.1' || !Array.isArray(parsed.comments)) {
    throw new Error(`${path} is not a valid Workbench notes file.`);
  }
  return {
    schemaVersion: '0.1',
    comments: parsed.comments.flatMap((comment) => {
      if (!isRecord(comment)) return [];
      const target = normalizeWorkbenchSelectionTarget(comment.target);
      if (!target) return [];
      const id = getUnknownString(comment.id);
      const body = getUnknownString(comment.body);
      const createdAt = getUnknownString(comment.createdAt);
      const updatedAt = getUnknownString(comment.updatedAt) || createdAt;
      if (!id || !createdAt) return [];
      return [{
        id,
        target,
        body,
        status: comment.status === 'resolved' ? 'resolved' as const : 'open' as const,
        createdAt,
        updatedAt,
        extensions: isRecord(comment.extensions) ? comment.extensions : {},
      }];
    }),
    extensions: isRecord(parsed.extensions) ? parsed.extensions : {},
  };
}

async function moveWorkbenchSpecNoteSidecar(fromSourceFile: string, toSourceFile: string): Promise<void> {
  const fromPath = getWorkbenchSpecNoteSidecarPath(fromSourceFile);
  const toPath = getWorkbenchSpecNoteSidecarPath(toSourceFile);
  if (fromPath === toPath) return;
  const readResult = await readWorkbenchSourceFile(fromPath);
  if (!readResult.ok) return;
  const writeResult = await writeWorkbenchSourceFile(toPath, readResult.contents, {
    normalize: false,
    overwrite: false,
  });
  if (writeResult.ok) await deleteWorkbenchSourceFile(fromPath);
}

export function DesignEditor({
  assets,
  commentPath,
  componentPath,
  comments,
  components: initialComponents,
  configPath,
  history,
  historyPath,
  inspectorWidth,
  onPagesChange,
  onCommentsChange,
  onSelectionChange,
  pagePath,
  pages: initialPages,
  projectId,
  projectName,
  projectClassCatalog,
  selection,
  sidebarWidth,
  startInspectorWidthResize,
  startSidebarWidthResize,
  surfaceNav,
  tailwindCssMode,
  tokenRegistry,
  initialSourceListHeight,
  onSourceListHeightChange,
}: {
  assets: WorkbenchAssetRegistry;
  commentPath: string;
  componentPath: string;
  comments: WorkbenchCommentRegistry;
  components: WorkbenchComponentRegistry;
  configPath: string;
  history: WorkbenchHistoryFile;
  historyPath: string;
  initialSourceListHeight?: number | null;
  inspectorWidth: number;
  onPagesChange?: (pages: WorkbenchPageRegistry) => void;
  onCommentsChange: (comments: WorkbenchCommentRegistry) => void;
  onSelectionChange: (selection: WorkbenchSelectionState) => void;
  onSourceListHeightChange?: (height: number) => void;
  pagePath: string;
  pages: WorkbenchPageRegistry;
  projectId: string;
  projectName: string;
  projectClassCatalog: WorkbenchProjectClassCatalog;
  selection: WorkbenchSelectionState;
  sidebarWidth: number;
  startInspectorWidthResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  startSidebarWidthResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  surfaceNav?: ReactNode;
  tailwindCssMode: SourceTreePreviewTailwindCssMode;
  tokenRegistry: TokenRegistry;
}) {
  const [sourceTreeResult, setSourceTreeResult] = useState<SourceTreeResult | null>(null);
  const [designStateOverrides, setDesignStateOverrides] = useState<DesignStateOverrideMap>({});
  const [runtimeProjection, setRuntimeProjection] = useState<{
    key: string;
    tree: EditableDocumentTree;
  } | null>(null);
  const [componentStoryMetadataByKey, setComponentStoryMetadataByKey] = useState<Record<string, RegisteredWorkbenchStory>>({});
  const [componentStoryMetadataRetryRevision, setComponentStoryMetadataRetryRevision] = useState(0);
  const runtimeProjectionRef = useRef<{
    key: string;
    tree: EditableDocumentTree;
  } | null>(null);
  const runtimeProjectionSignatureRef = useRef<string | null>(null);
  const [sourceHistoryRenderVersion, setSourceHistoryRenderVersion] = useState(0);
  const [sourceHydrationVersion, setSourceHydrationVersion] = useState(0);
  const [cssClassEffectivenessReport, setCssClassEffectivenessReport] =
    useState<CssClassEffectivenessReport | null>(null);
  const [cssClassEffectivenessRequested, setCssClassEffectivenessRequested] = useState(false);
  const [cssClassEffectivenessSelectionArmed, setCssClassEffectivenessSelectionArmed] = useState(false);
  const [inspectorNotice, setInspectorNotice] = useState('Inspector commands route through EditOperationPipeline.');
  const [designEditorWarningToast, setDesignEditorWarningToast] = useState<string | null>(null);
  const designEditorWarningToastTimerRef = useRef<number | null>(null);
  const [sourceClipboard, setSourceClipboard] = useState<SourceNodeClipboardPayload | null>(null);
  const [codexHandoffModal, setCodexHandoffModal] = useState<{
    handoff: CodexDesignHandoff;
    prompt: string;
  } | null>(null);
  const [codexHandoffCopyStatus, setCodexHandoffCopyStatus] = useState('Ready to copy.');
  const [developerExportModal, setDeveloperExportModal] = useState<DeveloperExport | null>(null);
  const [developerExportCopyStatus, setDeveloperExportCopyStatus] = useState('');
  const [editingTargetKey, setEditingTargetKey] = useState<string | null>(null);
  // Which UI surface initiated the rename — used so the tab and the page-tree
  // row don't both enter edit mode at the same time (they would otherwise race
  // for focus and the loser's onBlur would immediately commit/cancel).
  const [editingTargetSource, setEditingTargetSource] = useState<'tab' | 'tree' | null>(null);
  const [targetNameDraft, setTargetNameDraft] = useState('');
  const [editingFolderPath, setEditingFolderPath] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState('');
  // The page or folder being dragged in the source tree, plus the row its
  // pointer is currently over (with drop position). Drives drop-target
  // highlighting and routing to the reorder / nest / move-into-folder handler.
  const [draggingPageTargetKey, setDraggingPageTargetKey] = useState<string | null>(null);
  const [draggingFolderPath, setDraggingFolderPath] = useState<string | null>(null);
  const [sourceTreeDropIndicator, setSourceTreeDropIndicator] = useState<DesignSourceTreeDropIndicator | null>(null);
  const [pages, setPages] = useState(initialPages);
  const [components, setComponents] = useState(initialComponents);
  const coreProjectSummary = useMemo(() => createWorkbenchCoreProjectSummaryFromRegistries({
    assets,
    comments,
    components,
    configPath,
    pages,
    projectId,
    projectName,
    tokens: tokenRegistry,
  }), [assets, comments, components, configPath, pages, projectId, projectName, tokenRegistry]);
  const [activeNoteLinkDragId, setActiveNoteLinkDragId] = useState<string | null>(null);
  const [activeNotePreviewNoteId, setActiveNotePreviewNoteId] = useState<string | null>(null);
  const [activeNotePreviewBoxId, setActiveNotePreviewBoxId] = useState<string | null>(null);
  const [activeNoteBoxDraft, setActiveNoteBoxDraft] = useState<{ layerId: string; noteId: string } | null>(null);
  const openSpecNoteId: string | null = null;
  const [activeSpecNoteSidecar, setActiveSpecNoteSidecar] = useState<{
    comments: WorkbenchCommentRegistry;
    loadedFromSidecar: boolean;
    path: string;
  } | null>(null);
  const [previewModeModalOpen, setPreviewModeModalOpen] = useState(false);
  const [previewSettingsModalOpen, setPreviewSettingsModalOpen] = useState(false);
  const [previewSettingsPopoverStyle, setPreviewSettingsPopoverStyle] = useState<CSSProperties | null>(null);
  const previewSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const previewSettingsPopoverRef = useRef<HTMLDivElement>(null);
  const [wrapSelectionModalOpen, setWrapSelectionModalOpen] = useState(false);
  const [sourceComponentPickerOpen, setSourceComponentPickerOpen] = useState(false);
  const sourceInspectorEditPreflightRef = useRef<() => Promise<void>>(async () => undefined);
  const sourceInspectorEditQueueRef = useRef(createSerialEditQueue(
    () => sourceInspectorEditPreflightRef.current(),
  ));
  const mountedRef = useRef(true);
  const sourceTreeResultRef = useRef<SourceTreeResult | null>(null);
  const sourceTreeResultCacheRef = useRef(new Map<string, SourceTreeResult>());
  const sourceTreeOptimisticVersionRef = useRef(0);

  useLayoutEffect(() => {
    if (!previewSettingsModalOpen) {
      setPreviewSettingsPopoverStyle(null);
      return undefined;
    }
    const updateLayout = () => {
      const anchor = previewSettingsButtonRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(480, window.innerWidth - 32);
      const left = Math.max(16, Math.min(anchor.right - width, window.innerWidth - width - 16));
      const top = anchor.bottom + 6;
      setPreviewSettingsPopoverStyle({
        left,
        maxHeight: Math.max(240, window.innerHeight - top - 16),
        top,
        width,
      });
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (previewSettingsButtonRef.current?.contains(target) || previewSettingsPopoverRef.current?.contains(target)) return;
      setPreviewSettingsModalOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewSettingsModalOpen(false);
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [previewSettingsModalOpen]);
  const {
    primaryListHeight: sourceListHeight,
    sidebarRef,
    startSidebarSplitResize,
  } = useWorkbenchSidebarSplitLayout({
    defaultPrimaryHeight: DESIGN_SOURCE_LIST_DEFAULT_HEIGHT,
    initialPrimaryHeight: initialSourceListHeight,
    onPrimaryHeightChange: onSourceListHeightChange,
    primaryMinHeight: 88,
    secondaryMinHeight: 140,
  });
  const sourceHistoryFileRef = useRef(history);
  const pendingSourceHistorySaveRef = useRef<{ historyPath: string; historyFile: WorkbenchHistoryFile } | null>(null);
  const sourceHistorySaveRunningRef = useRef(false);
  const sourceHistorySaveTimerRef = useRef<number | null>(null);
  // Save-point files are read once per lane per session and kept here; reading
  // one on every edit would cost a fetch per keystroke.
  const savePointFilesRef = useRef(new Map<HistoryLaneId, WorkbenchSavePointFile>());
  const savePointLoadsRef = useRef(new Map<HistoryLaneId, Promise<WorkbenchSavePointFile>>());
  const sourceComponentPropCommitVersionRef = useRef(0);
  const latestSourceComponentPropCommitRef = useRef(new Map<string, number>());
  const latestSelectionRef = useRef(selection);
  const latestPagesRef = useRef(initialPages);
  const sourceClipboardRef = useRef<SourceNodeClipboardPayload | null>(null);
  const latestSourceSubjectRef = useRef<ProjectAssetHistorySubject | null>(null);
  const latestSpecNoteHistoryRef = useRef<HistoryController<WorkbenchCommentRegistry> | null>(null);
  const runtimeDesignUndoStackRef = useRef<RuntimeDesignHistoryEntry[]>([]);
  const runtimeDesignRedoStackRef = useRef<RuntimeDesignHistoryEntry[]>([]);
  const workspaceDesignUndoStackRef = useRef<WorkspaceDesignHistoryEntry[]>([]);
  const workspaceDesignRedoStackRef = useRef<WorkspaceDesignHistoryEntry[]>([]);
  // The stacks are refs, so nothing re-renders when they move. The source
  // panel's Undo/Redo buttons need that: a disabled button is how the user is
  // told this stack is empty, which is the whole reason they are buttons and
  // not a keyboard-only path.
  const [workspaceHistoryStatus, setWorkspaceHistoryStatus] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    undoLabel: string | null;
    redoLabel: string | null;
  }>({ canUndo: false, canRedo: false, undoLabel: null, redoLabel: null });
  const designPageHistoryRef = useRef(new Map<HistoryLaneId, DesignPageHistoryStack>());
  // One controller per lane for the session. Undo lives in its stack, so the
  // instance has to outlive the rebuilds an edit triggers.
  const sourceHistoryStoreRef = useRef(createHistoryControllerStore<string>({
    createController: (laneId, initialValue) => createHistoryController<string>({
      laneId,
      initialValue,
      initialSaved: true,
      initialRevision: getHydratableHistoryLane(
        sourceHistoryFileRef.current,
        laneId,
        initialValue,
        areSourceContentsEqual,
      )?.workingRevision,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      cloneState: cloneSourceContents,
      equalsState: areSourceContentsEqual,
    }),
  }));
  const closeActiveDesignTargetCommandRef = useRef<() => void>(() => {});
  const lastDesignSourceEditShortcutRef = useRef<{ action: DesignSourceEditShortcutAction; timestamp: number } | null>(null);
  const activeSelectionTarget = selection.activeTarget;
  const activeSelectionTargetKind = activeSelectionTarget?.kind ?? null;
  const activeSelectionPageId = activeSelectionTarget?.kind === 'page' ? activeSelectionTarget.pageId : null;
  const activeSelectionComponentId = activeSelectionTarget?.kind === 'component' ? activeSelectionTarget.componentId : null;
  const activeRuntimeStory = useMemo(() => {
    if (!activeSelectionComponentId) return null;
    const component = components.components.find((candidate) => candidate.id === activeSelectionComponentId);
    return component ? getWorkbenchStory(component) : null;
  }, [activeSelectionComponentId, components.components]);
  const activeRuntimeStoryArgs = useMemo(
    () => activeRuntimeStory
      ? {
          ...activeRuntimeStory.defaultArgs,
          ...getDesignStoryArgsFromSelection(selection, activeRuntimeStory.componentId),
        }
      : {},
    [
      activeRuntimeStory,
      selection.extensions.activeDesignStoryArgs,
      selection.extensions.activeDesignStoryComponentId,
    ],
  );
  const activeRuntimeStoryArgsKey = useMemo(
    () => JSON.stringify(activeRuntimeStoryArgs),
    [activeRuntimeStoryArgs],
  );
  const activeRuntimeStoryProjectionKey = activeRuntimeStory
    ? `${activeRuntimeStory.componentId}:${activeRuntimeStory.sourceFile}:${activeRuntimeStoryArgsKey}`
    : null;
  const projectTreeSource = useMemo(
    () => createEditableDocumentTreeFromProjectSource({ components, pages, selection }),
    [activeSelectionComponentId, activeSelectionPageId, activeSelectionTargetKind, components, pages],
  );
  const getDesignStateOverridesForSource = useCallback(
    (sourceFile: string): Record<string, DesignStateOverrideValue> =>
      designStateOverrides[normalizeProjectSourceFileReference(sourceFile)] ?? {},
    [designStateOverrides],
  );
  const getSourceTreeParseTarget = useCallback((sourceFile: string): SourceTreeParseTarget => {
    const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);
    const pageForSource = pages.pages.find((candidate) => normalizeProjectSourceFileReference(candidate.sourceFile) === normalizedSourceFile);
    if (pageForSource) {
      return {
        cacheKey: `page:${pageForSource.id}:${sourceFile}`,
        label: pageForSource.name,
        preferredComponentNames: [pageForSource.name, toPascalCase(pageForSource.name), 'WorkbenchDesignPage', 'Page'],
        sourceFile,
      };
    }

    const componentForSource = components.components.find((candidate) => normalizeProjectSourceFileReference(candidate.sourceFile) === normalizedSourceFile);
    if (componentForSource) {
      return {
        cacheKey: `component:${componentForSource.id}:${sourceFile}`,
        label: `${componentForSource.name} source`,
        preferredComponentNames: getComponentSourceParseNames(componentForSource.name),
        sourceFile,
      };
    }

    const projectSource = projectTreeSource.source;
    if (projectSource.kind === 'page') {
      const page = pages.pages.find((candidate) => candidate.id === projectSource.id);
      if (page) {
        return {
          cacheKey: `page:${page.id}:${sourceFile}`,
          label: page.name,
          preferredComponentNames: [page.name, toPascalCase(page.name), 'WorkbenchDesignPage'],
          sourceFile,
        };
      }
    }

    if (projectSource.kind === 'component') {
      const component = components.components.find((candidate) => candidate.id === projectSource.id);
      if (component) {
        return {
          cacheKey: `component:${component.id}:${sourceFile}`,
          label: `${component.name} source`,
          preferredComponentNames: getComponentSourceParseNames(component.name),
          sourceFile,
        };
      }
    }

    return {
      cacheKey: `source:${sourceFile}`,
      label: sourceFile,
      preferredComponentNames: [],
      sourceFile,
    };
  }, [components.components, pages.pages, projectTreeSource.source]);
  // Design state overrides change what the parser projects, so they belong in
  // the cache identity; otherwise a stale tree would survive a state change.
  const getSourceTreeCacheKey = useCallback(
    (sourceFile: string) => {
      const baseCacheKey = getSourceTreeParseTarget(sourceFile).cacheKey;
      const overrideSignature = createDesignStateOverrideSignature(getDesignStateOverridesForSource(sourceFile));
      return overrideSignature ? `${baseCacheKey}#${overrideSignature}` : baseCacheKey;
    },
    [getDesignStateOverridesForSource, getSourceTreeParseTarget],
  );
  const rememberSourceTreeResult = useCallback((result: SourceTreeResult) => {
    if (!result.contents || !result.tree) return;
    sourceTreeResultCacheRef.current.set(result.cacheKey, result);
  }, []);
  const clearSourceTreeResultCacheForFile = useCallback((sourceFile: string) => {
    for (const cacheKey of sourceTreeResultCacheRef.current.keys()) {
      if (cacheKey.endsWith(`:${sourceFile}`) || cacheKey === `source:${sourceFile}`) {
        sourceTreeResultCacheRef.current.delete(cacheKey);
      }
    }
  }, []);
  const createSourceTreeFallbackResult = useCallback((
    sourceFile: string,
    contents: string | null,
    diagnostic: string,
  ): SourceTreeResult => {
    const cacheKey = getSourceTreeCacheKey(sourceFile);
    const cached = sourceTreeResultCacheRef.current.get(cacheKey);
    if (cached?.tree) {
      return {
        ...cached,
        contents: null,
        diagnostic: diagnostic.replace('Using the preview scaffold.', 'Keeping the last parsed preview.'),
      };
    }

    return {
      cacheKey,
      contents,
      designStates: [],
      diagnostic,
      runtimeFallbackReasons: [],
      sourceFile,
      tree: null,
      warnings: [],
    };
  }, [getSourceTreeCacheKey]);
  const createSourceTreeResultFromContents = useCallback(async (
    sourceFile: string,
    contents: string,
  ): Promise<SourceTreeResult> => {
    const target = getSourceTreeParseTarget(sourceFile);
    const parsed = await parseEditableDocumentTreeFromContents(
      target,
      contents,
      getDesignStateOverridesForSource(sourceFile),
    );
    if (parsed.tree) {
      const warnings = parsed.warnings ?? [];
      const result: SourceTreeResult = {
        cacheKey: getSourceTreeCacheKey(sourceFile),
        contents,
        designStates: parsed.designStates ?? [],
        diagnostic: parsed.diagnostic,
        runtimeFallbackReasons: getSourceTreeRuntimeFallbackReasons(parsed.tree, warnings),
        sourceFile,
        tree: parsed.tree,
        warnings,
      };
      rememberSourceTreeResult(result);
      return result;
    }

    return createSourceTreeFallbackResult(sourceFile, contents, parsed.diagnostic);
  }, [
    createSourceTreeFallbackResult,
    getDesignStateOverridesForSource,
    getSourceTreeCacheKey,
    getSourceTreeParseTarget,
    rememberSourceTreeResult,
  ]);
  const readSourceTreeFromDisk = useCallback(async (sourceFile: string): Promise<SourceTreeResult> => {
    try {
      const result = await readWorkbenchSourceFile(sourceFile);
      if (!result.ok) {
        return createSourceTreeFallbackResult(
          sourceFile,
          null,
          `${sourceFile} could not be read: ${result.message}. Using the preview scaffold.`,
        );
      }

      return await createSourceTreeResultFromContents(sourceFile, result.contents);
    } catch (error) {
      return createSourceTreeFallbackResult(
        sourceFile,
        null,
        `${sourceFile} could not be loaded: ${formatDesignEditorError(error)}. Using the preview scaffold.`,
      );
    }
  }, [createSourceTreeFallbackResult, createSourceTreeResultFromContents]);
  const designTargets = useMemo(
    () => createDesignSourceTargets(pages, components),
    [components, pages],
  );
  const activeDesignTarget = useMemo(
    () => designTargets.find((target) => isDesignTargetActive(projectTreeSource.source, target)) ?? null,
    [designTargets, projectTreeSource.source],
  );
  const activeSpecNoteTarget = useMemo(
    () => createWorkbenchSpecNoteOwnerTarget(activeDesignTarget?.target ?? null, activeDesignTarget?.label),
    [activeDesignTarget],
  );
  const activeSpecNoteSidecarPath = activeSpecNoteTarget?.sourceFile
    ? getWorkbenchSpecNoteSidecarPath(activeSpecNoteTarget.sourceFile)
    : null;
  const activeSpecNoteStoragePath = activeSpecNoteSidecarPath ?? commentPath;
  const fallbackSpecNoteComments = useMemo(
    () => createWorkbenchCommentRegistryForSpecNoteTarget(comments, activeSpecNoteTarget),
    [activeSpecNoteTarget, comments],
  );

  useEffect(() => {
    let cancelled = false;
    const storagePath = activeSpecNoteSidecarPath ?? commentPath;
    setActiveSpecNoteSidecar({
      comments: fallbackSpecNoteComments,
      loadedFromSidecar: false,
      path: storagePath,
    });

    if (!activeSpecNoteSidecarPath) return () => {
      cancelled = true;
    };

    void readWorkbenchSourceFile(activeSpecNoteSidecarPath, { allowMissing: true }).then((result) => {
      if (cancelled) return;
      if (!result.ok) return;
      try {
        const parsed = parseWorkbenchCommentRegistryJson(result.contents, activeSpecNoteSidecarPath);
        setActiveSpecNoteSidecar({
          comments: createWorkbenchCommentRegistryForSpecNoteTarget(parsed, activeSpecNoteTarget),
          loadedFromSidecar: true,
          path: activeSpecNoteSidecarPath,
        });
      } catch (error) {
        setInspectorNotice(error instanceof Error ? error.message : `Failed to parse ${activeSpecNoteSidecarPath}.`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeSpecNoteSidecarPath, activeSpecNoteTarget, commentPath, fallbackSpecNoteComments]);

  const activeSpecNoteComments = activeSpecNoteSidecar?.path === activeSpecNoteStoragePath
    ? activeSpecNoteSidecar.comments
    : fallbackSpecNoteComments;
  const specNoteHistoryOwner = useMemo(
    () => ({ type: 'workspace', projectId: `spec-notes:${activeSpecNoteStoragePath}` }) as const,
    [activeSpecNoteStoragePath],
  );
  const specNoteHistoryLaneId = useMemo(
    () => getHistoryLaneId(specNoteHistoryOwner),
    [specNoteHistoryOwner],
  );
  const specNotesModel = useMemo(() => getWorkbenchSpecNotesModel(activeSpecNoteComments), [activeSpecNoteComments]);
  const activeSpecNotes = useMemo(
    () => specNotesModel.notes.filter((note) => isWorkbenchSpecNoteInTargetContext(note, activeSpecNoteTarget)),
    [activeSpecNoteTarget, specNotesModel.notes],
  );
  const activeNotePreviewNote = activeNotePreviewNoteId
    ? activeSpecNotes.find((note) => note.id === activeNotePreviewNoteId) ?? null
    : null;
  const activeNotePreviewLayerId = activeNotePreviewNote?.target?.kind === 'node'
    ? activeNotePreviewNote.target.nodeId ?? null
    : null;
  const activeNotePreviewHighlightBoxes = useMemo(
    () => activeNotePreviewNote ? getWorkbenchSpecNoteTargetHighlightBoxes(activeNotePreviewNote.target) : [],
    [activeNotePreviewNote],
  );

  useEffect(() => {
    if (activeNotePreviewNoteId && !activeNotePreviewNote) {
      setActiveNotePreviewNoteId(null);
      setActiveNotePreviewBoxId(null);
    }
  }, [activeNotePreviewNote, activeNotePreviewNoteId]);

  useEffect(() => {
    if (!activeNotePreviewBoxId) return;
    if (activeNotePreviewHighlightBoxes.some((box) => box.id === activeNotePreviewBoxId)) return;
    setActiveNotePreviewBoxId(null);
  }, [activeNotePreviewBoxId, activeNotePreviewHighlightBoxes]);

  useEffect(() => {
    if (!activeNoteBoxDraft) return;
    if (activeSpecNotes.some((note) => note.id === activeNoteBoxDraft.noteId)) return;
    setActiveNoteBoxDraft(null);
  }, [activeNoteBoxDraft, activeSpecNotes]);

  const openTargetKeys = useMemo(
    () => getHydratedOpenDesignTargetKeys(
      designTargets,
      getOpenDesignTargetKeysFromSelection(selection),
      activeDesignTarget,
    ),
    [activeDesignTarget, designTargets, selection],
  );
  const openDesignTargets = useMemo(
    () => getOpenDesignTargets(designTargets, openTargetKeys, activeDesignTarget),
    [activeDesignTarget, designTargets, openTargetKeys],
  );
  const collapsedSourceGroupIds = useMemo(
    () => getCollapsedDesignSourceGroupIdsFromSelection(selection),
    [selection],
  );
  const collapsedPageFolders = useMemo(
    () => getCollapsedDesignPageFoldersFromSelection(selection),
    [selection],
  );
  const pageFolderPaths = useMemo(() => getAllWorkbenchPageFolders(pages), [pages]);
  const sourceSectionCollapsed = useMemo(
    () => getDesignSourceSectionCollapsedFromSelection(selection),
    [selection],
  );
  const layerSectionCollapsed = useMemo(
    () => getDesignLayerSectionCollapsedFromSelection(selection),
    [selection],
  );
  const selectedPreviewTokenModes = useMemo(
    () => reconcilePreviewTokenModes(tokenRegistry, selection.extensions.previewTokenModes ?? {}),
    [selection.extensions.previewTokenModes, tokenRegistry],
  );
  const previewAppearance = useMemo(
    () => getDesignPreviewAppearanceFromSelection(selection, tokenRegistry, selectedPreviewTokenModes),
    [selectedPreviewTokenModes, selection, tokenRegistry],
  );
  const systemPreviewAppearance = useSystemDesignPreviewAppearance();
  // The rendering side, with 'system' already resolved. Inspector folds
  // light-dark() literals against this when a token is detached.
  const previewColorSchemeSide = previewAppearance === 'system'
    ? systemPreviewAppearance
    : previewAppearance;
  const previewTokenModes = useMemo(
    () => previewAppearance === 'system'
      ? getPreviewTokenModesForAppearance(tokenRegistry, selectedPreviewTokenModes, systemPreviewAppearance)
      : selectedPreviewTokenModes,
    [previewAppearance, selectedPreviewTokenModes, systemPreviewAppearance, tokenRegistry],
  );
  const previewViewport = useMemo(
    () => reconcileDesignPreviewViewport(getDesignPreviewViewportFromSelection(selection)),
    [selection],
  );
  const inspectorTokenPickerFilters = useMemo(
    () => getInspectorTokenPickerFiltersFromSelection(selection),
    [selection],
  );
  const selectedLayerId = getDesignLayerIdFromSelection(selection);
  const selectedLayerIds = useMemo(
    () => getDesignLayerIdsFromSelection(selection, selectedLayerId),
    [selection, selectedLayerId],
  );
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (sourceHistorySaveTimerRef.current !== null) {
        window.clearTimeout(sourceHistorySaveTimerRef.current);
        sourceHistorySaveTimerRef.current = null;
      }
      if (designEditorWarningToastTimerRef.current !== null) {
        window.clearTimeout(designEditorWarningToastTimerRef.current);
        designEditorWarningToastTimerRef.current = null;
      }
      void flushQueuedSourceHistorySave();
    };
  }, []);
  useEffect(() => subscribeWorkbenchProjectChangeEvents((event) => {
    if (!isWorkbenchCsfRuntimeDependencyChangePath(event.path)) return;
    setComponentStoryMetadataRetryRevision((revision) => revision + 1);
  }), []);
  useEffect(() => {
    sourceTreeResultRef.current = sourceTreeResult;
  }, [sourceTreeResult]);
  useEffect(() => {
    if (isWorkbenchSelectionStale(selection, latestSelectionRef.current)) return;
    latestSelectionRef.current = selection;
  }, [selection]);
  useEffect(() => {
    sourceClipboardRef.current = sourceClipboard;
  }, [sourceClipboard]);
  useEffect(() => {
    runtimeProjectionRef.current = runtimeProjection;
    runtimeProjectionSignatureRef.current = runtimeProjection
      ? getRuntimeProjectionTreeSignature(runtimeProjection.tree)
      : null;
  }, [runtimeProjection]);
  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);
  useEffect(() => {
    sourceHistoryFileRef.current = history;
  }, [history]);
  useEffect(() => {
    latestPagesRef.current = pages;
  }, [pages]);
  useEffect(() => {
    setComponents(initialComponents);
  }, [initialComponents]);
  const projectTreeSourceKey = getDesignProjectTreeSourceKey(projectTreeSource);
  useEffect(() => {
    if (projectTreeSource.source.kind === 'none' || projectTreeSource.tree) {
      setSourceTreeResult(null);
      return undefined;
    }

    let cancelled = false;
    const sourceFile = projectTreeSource.source.sourceFile;
    const cacheKey = getSourceTreeCacheKey(sourceFile);
    const cachedResult = sourceTreeResultCacheRef.current.get(cacheKey);
    setSourceTreeResult(cachedResult
      ? {
          ...cachedResult,
          diagnostic: `Checking ${sourceFile} for updates...`,
        }
      : {
          cacheKey,
          contents: null,
          designStates: [],
          diagnostic: `Reading ${sourceFile}...`,
          runtimeFallbackReasons: [],
          sourceFile,
          tree: null,
          warnings: [],
        });

    void readSourceTreeFromDisk(sourceFile).then((result) => {
      if (cancelled) return;
      setSourceTreeResult(result);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setSourceTreeResult(createSourceTreeFallbackResult(
        sourceFile,
        null,
        `${sourceFile} could not be loaded: ${formatDesignEditorError(error)}. Using the preview scaffold.`,
      ));
    });

    return () => {
      cancelled = true;
    };
  }, [createSourceTreeFallbackResult, getSourceTreeCacheKey, projectTreeSourceKey, readSourceTreeFromDisk]);
  useEffect(() => {
    if (activeRuntimeStory || projectTreeSource.source.kind === 'none') return undefined;
    if (
      !sourceTreeResult ||
      sourceTreeResult.cacheKey !== getSourceTreeCacheKey(projectTreeSource.source.sourceFile) ||
      sourceTreeResult.contents !== null ||
      sourceTreeResult.tree !== null ||
      !sourceTreeResult.diagnostic.startsWith('Reading ')
    ) {
      return undefined;
    }

    let cancelled = false;
    const sourceFile = projectTreeSource.source.sourceFile;
    const cacheKey = getSourceTreeCacheKey(sourceFile);
    const timeoutId = window.setTimeout(() => {
      void readSourceTreeFromDisk(sourceFile).then((result) => {
        if (cancelled || !mountedRef.current) return;
        setSourceTreeResult((latest) => {
          if (!latest || latest.cacheKey !== cacheKey || latest.contents !== null || latest.tree !== null) {
            return latest;
          }
          return result;
        });
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeRuntimeStory, getSourceTreeCacheKey, projectTreeSource.source, readSourceTreeFromDisk, sourceTreeResult]);
  useEffect(() => {
    if (activeRuntimeStory || projectTreeSource.source.kind === 'none') return undefined;

    const sourceFile = projectTreeSource.source.sourceFile;
    const cacheKey = getSourceTreeCacheKey(sourceFile);
    let cancelled = false;
    let checking = false;
    let rerunRequested = false;

    async function refreshActiveSourceFileFromDisk() {
      if (checking) {
        rerunRequested = true;
        return;
      }
      const current = sourceTreeResultRef.current;
      if (!current || current.cacheKey !== cacheKey) return;

      checking = true;
      try {
        let result: Awaited<ReturnType<typeof readWorkbenchSourceFile>>;
        try {
          result = await readWorkbenchSourceFile(sourceFile);
        } catch (error) {
          if (cancelled || !mountedRef.current) return;
          setSourceTreeResult((latest) => {
            if (!latest || latest.cacheKey !== cacheKey) return latest;
            return {
              ...latest,
              diagnostic: `${sourceFile} could not be refreshed: ${formatDesignEditorError(error)}. Keeping the last parsed preview.`,
            };
          });
          return;
        }

        if (cancelled || !mountedRef.current) return;
        if (!result.ok) {
          setSourceTreeResult((latest) => {
            if (!latest || latest.cacheKey !== cacheKey) return latest;
            return {
              ...latest,
              diagnostic: `${sourceFile} could not be refreshed: ${result.message}. Keeping the last parsed preview.`,
            };
          });
          return;
        }

        const latest = sourceTreeResultRef.current;
        if (!latest || latest.cacheKey !== cacheKey) return;
        const wasWaitingForInitialParse = latest.contents === null;
        if (!wasWaitingForInitialParse && latest.contents === result.contents) return;

        await refreshSourceTreeFromContents(sourceFile, result.contents);
        const refreshedSubject = latestSourceSubjectRef.current?.sourceFile === sourceFile
          ? latestSourceSubjectRef.current
          : null;
        if (refreshedSubject) {
          latestSourceSubjectRef.current = refreshedSubject;
          reconcileSourceHistoryLaneToDisk(refreshedSubject, result.contents);
        }
        refreshSourceHistoryView();
        setInspectorNotice(wasWaitingForInitialParse
          ? `Loaded ${sourceFile} from disk.`
          : `Reloaded ${sourceFile} from disk.`);
      } finally {
        checking = false;
        if (rerunRequested && !cancelled) {
          rerunRequested = false;
          void refreshActiveSourceFileFromDisk();
        }
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshActiveSourceFileFromDisk();
    };

    window.addEventListener('focus', refreshActiveSourceFileFromDisk);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const unsubscribeProjectChanges = subscribeWorkbenchProjectChangeEvents((event) => {
      if (
        normalizeProjectSourceFileReference(event.path) ===
        normalizeProjectSourceFileReference(sourceFile)
      ) {
        void refreshActiveSourceFileFromDisk();
      }
    });

    return () => {
      cancelled = true;
      unsubscribeProjectChanges();
      window.removeEventListener('focus', refreshActiveSourceFileFromDisk);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeRuntimeStory, getSourceTreeCacheKey, projectTreeSource.source]);
  const activeProjectSourceFile = projectTreeSource.source.kind === 'none' ? null : projectTreeSource.source.sourceFile;
  const activeProjectSourceCacheKey = activeProjectSourceFile ? getSourceTreeCacheKey(activeProjectSourceFile) : null;
  const activeSourceTreeResult = sourceTreeResult?.cacheKey === activeProjectSourceCacheKey ? sourceTreeResult : null;
  const cachedActiveSourceTreeResult = activeProjectSourceCacheKey
    ? sourceTreeResultCacheRef.current.get(activeProjectSourceCacheKey) ?? null
    : null;
  const previewSourceTreeResult = activeSourceTreeResult ?? cachedActiveSourceTreeResult;
  // Keep page Design preview on the source-tree renderer. Browser preview is the
  // runtime path; automatically falling back here remounts stateful pages and
  // can make read-only nodes look editable. Vue pages ride the same source-tree
  // renderer: the parsed SFC tree is the canvas input, exactly like React
  // pages, so every canvas editing affordance applies unchanged.
  const activeRuntimePageProjection = useMemo<RuntimePageProjectionTarget | null>(() => {
    return null;
  }, []);
  const activeRuntimeProjectionKey = activeRuntimeStory
    ? activeRuntimeStoryProjectionKey
    : activeRuntimePageProjection
      ? getRuntimePageProjectionId(activeRuntimePageProjection)
      : null;
  useEffect(() => {
    clearRuntimeDesignHistory();
  }, [activeRuntimeProjectionKey]);
  useEffect(() => {
    // A selection restored from selection.json is still a selection. Only
    // selectDesignLayer/selectDesignPreviewNode arm this, so without the check
    // below a project that opens with a node already selected never analyzes
    // anything: the Inspector renders its class chips, asks for effectiveness,
    // and every chip stays unverified until the user happens to click
    // something. `preview-frame` and an empty selection stay unarmed — there is
    // no node to measure.
    const restoredLayerId = getDesignLayerIdFromSelection(latestSelectionRef.current);
    setCssClassEffectivenessSelectionArmed(
      Boolean(restoredLayerId) && restoredLayerId !== 'preview-frame',
    );
    setCssClassEffectivenessReport(null);
  }, [activeProjectSourceFile, activeRuntimeProjectionKey]);
  const sourcePreviewDocument = previewSourceTreeResult?.tree ?? projectTreeSource.tree ?? null;
  const hydratableImportedSourceFiles = useMemo(
    () => collectHydratableImportedComponentSourceFiles(
      sourcePreviewDocument?.root ?? null,
      components.components,
      (sourceFile) => sourceTreeResultCacheRef.current.get(getSourceTreeCacheKey(sourceFile))?.tree ?? null,
    ),
    [components.components, getSourceTreeCacheKey, sourceHydrationVersion, sourcePreviewDocument],
  );
  const hydratableImportedSourceFileSignature = hydratableImportedSourceFiles.join('\n');
  useEffect(() => {
    if (activeRuntimeStory || activeRuntimePageProjection || hydratableImportedSourceFiles.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(hydratableImportedSourceFiles.map(async (sourceFile) => {
      const cacheKey = getSourceTreeCacheKey(sourceFile);
      const cached = sourceTreeResultCacheRef.current.get(cacheKey);
      if (cached?.tree) return false;
      const result = await readSourceTreeFromDisk(sourceFile);
      return Boolean(!cancelled && result.tree);
    })).then((results) => {
      if (!cancelled && results.some(Boolean)) {
        setSourceHydrationVersion((version) => version + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeRuntimePageProjection,
    activeRuntimeStory,
    getSourceTreeCacheKey,
    hydratableImportedSourceFileSignature,
    hydratableImportedSourceFiles,
    readSourceTreeFromDisk,
  ]);
  const previewDocument = useMemo(
    () => activeRuntimeStory || activeRuntimePageProjection
      ? activeRuntimeProjectionKey && runtimeProjection?.key === activeRuntimeProjectionKey
        ? runtimeProjection.tree
        : null
      : hydrateEditableDocumentTreeWithImportedComponentSources({
          components: components.components,
          getSourceTree: (sourceFile) => sourceTreeResultCacheRef.current.get(getSourceTreeCacheKey(sourceFile))?.tree ?? null,
          tree: sourcePreviewDocument,
        }),
    [
      activeRuntimePageProjection,
      activeRuntimeProjectionKey,
      activeRuntimeStory,
      components.components,
      getSourceTreeCacheKey,
      runtimeProjection,
      sourceHydrationVersion,
      sourcePreviewDocument,
    ],
  );
  const runtimeFallbackGuidance = activeRuntimePageProjection
    ? getRuntimeFallbackGuidance(activeRuntimePageProjection.reasons)
    : '';
  const sourceDiagnostic = activeRuntimeStory
    ? activeRuntimeProjectionKey && runtimeProjection?.key === activeRuntimeProjectionKey
      ? `Runtime design projection captured from ${activeRuntimeStory.sourceFile}. Compile design changes through Codex to update component source.`
      : `Rendering ${activeRuntimeStory.name} story into a design projection...`
    : activeRuntimePageProjection
      ? activeRuntimeProjectionKey && runtimeProjection?.key === activeRuntimeProjectionKey
        ? `Runtime page projection captured from ${activeRuntimePageProjection.sourceFile}. ${runtimeFallbackGuidance}`
        : `Rendering ${activeRuntimePageProjection.name} page from React. ${runtimeFallbackGuidance}`
    : previewSourceTreeResult?.diagnostic ?? projectTreeSource.diagnostic;
  const previewLoadState = useMemo<DesignPreviewLoadState>(() => {
    if (previewDocument) return { status: 'ready', diagnostic: sourceDiagnostic };
    if (activeRuntimeStory || activeRuntimePageProjection) return { status: 'loading', diagnostic: sourceDiagnostic };
    if (projectTreeSource.source.kind === 'none') {
      return {
        status: 'empty',
        diagnostic: 'Select a source target to inspect bindings.',
      };
    }
    if (!activeSourceTreeResult || isSourceTreeResultLoading(activeSourceTreeResult)) {
      return {
        status: 'loading',
        diagnostic: activeSourceTreeResult?.diagnostic ?? `Reading ${projectTreeSource.source.sourceFile}...`,
      };
    }
    return {
      status: 'unavailable',
      diagnostic: activeSourceTreeResult.diagnostic || sourceDiagnostic,
    };
  }, [activeRuntimePageProjection, activeRuntimeStory, activeSourceTreeResult, previewDocument, projectTreeSource.source, sourceDiagnostic]);
  const updateRuntimeProjectionTree = useCallback((tree: EditableDocumentTree | null) => {
    if (!activeRuntimeProjectionKey || !tree) {
      if (!runtimeProjectionRef.current) return;
      clearRuntimeDesignHistory();
      runtimeProjectionRef.current = null;
      runtimeProjectionSignatureRef.current = null;
      setRuntimeProjection(null);
      return;
    }

    const nextSignature = getRuntimeProjectionTreeSignature(tree);
    const currentProjection = runtimeProjectionRef.current;
    if (
      currentProjection?.key === activeRuntimeProjectionKey &&
      runtimeProjectionSignatureRef.current === nextSignature
    ) {
      return;
    }

    clearRuntimeDesignHistory();
    const nextProjection = { key: activeRuntimeProjectionKey, tree };
    runtimeProjectionRef.current = nextProjection;
    runtimeProjectionSignatureRef.current = nextSignature;
    setRuntimeProjection(nextProjection);
  }, [activeRuntimeProjectionKey]);
  const sourceSubject = useMemo(() => {
    const sourceFile = activeProjectSourceFile;
    if (!sourceFile) return null;

    if (activeDesignTarget?.sourceFile === sourceFile) {
      if (activeDesignTarget.kind === 'page') {
        const page = pages.pages.find((candidate) => candidate.id === activeDesignTarget.id);
        if (page) {
          return {
            kind: 'page' as const,
            id: page.id,
            name: page.name,
            sourceFile: page.sourceFile,
            status: page.status,
          };
        }
      }

      if (activeDesignTarget.kind === 'component') {
        const component = components.components.find((candidate) => candidate.id === activeDesignTarget.id);
        if (component) {
          return {
            kind: 'component' as const,
            id: component.id,
            name: component.name,
            sourceFile: component.sourceFile,
            ...(component.componentSetId ? { componentSetId: component.componentSetId } : {}),
          };
        }
      }
    }

    return resolveProjectAssetSubjectForSourceFile(pages, components, sourceFile);
  }, [activeDesignTarget, activeProjectSourceFile, components, pages]);
  const sourceHistory = useMemo(() => {
    if (activeRuntimeStory || !sourceSubject || !previewSourceTreeResult?.contents) return null;
    return sourceHistoryStoreRef.current.get(
      getProjectAssetHistoryLaneId(sourceSubject),
      previewSourceTreeResult.contents,
    );
  }, [activeRuntimeStory, history, previewSourceTreeResult?.contents, sourceHistoryRenderVersion, sourceSubject]);
  const specNoteHistory = useMemo(() => {
    const persistedLane = getHydratableHistoryLane(
      sourceHistoryFileRef.current,
      specNoteHistoryLaneId,
      activeSpecNoteComments,
      areWorkbenchCommentRegistriesEqual,
    );

    return createHistoryController<WorkbenchCommentRegistry>({
      laneId: specNoteHistoryLaneId,
      initialValue: activeSpecNoteComments,
      initialSaved: true,
      initialRevision: persistedLane?.workingRevision,
      initialUndoStack: persistedLane?.undoStack,
      initialRedoStack: persistedLane?.redoStack,
      maxEntries: SPEC_NOTE_HISTORY_MAX_ENTRIES,
      cloneState: cloneWorkbenchCommentRegistry,
      equalsState: areWorkbenchCommentRegistriesEqual,
    });
  }, [activeSpecNoteComments, history, specNoteHistoryLaneId]);
  useEffect(() => {
    latestSourceSubjectRef.current = sourceSubject;
  }, [sourceSubject]);
  useEffect(() => {
    latestSpecNoteHistoryRef.current = specNoteHistory;
  }, [specNoteHistory]);
  const specNoteHistorySnapshot = specNoteHistory.getSnapshot();
  const previewLayers = useMemo(() => createPreviewLayers(previewDocument?.root ?? null), [previewDocument]);
  const latestPreviewDocumentRef = useRef(previewDocument);
  const latestPreviewLayersRef = useRef(previewLayers);
  latestPreviewDocumentRef.current = previewDocument;
  latestPreviewLayersRef.current = previewLayers;
  const previewLayerById = useMemo(() => createPreviewLayerMap(previewLayers), [previewLayers]);
  const inspectablePreviewLayers = useMemo(
    () => createPreviewLayers(previewDocument?.root ?? null, { includeSourcePreviewChildren: true }),
    [previewDocument],
  );
  const inspectablePreviewLayerById = useMemo(
    () => createPreviewLayerMap(inspectablePreviewLayers),
    [inspectablePreviewLayers],
  );
  const wrappableComponents = useMemo(
    () => components.components.filter((component) => isComponentVisibleInInsertPicker(component)),
    [components.components],
  );
  const collapsedLayerIds = useMemo(
    () => getCollapsedDesignLayerIdsFromSelection(selection),
    [selection],
  );
  const visibleCollapsedLayerIds = useMemo(
    () => getVisibleCollapsedDesignLayerIds(previewDocument?.root ?? null, collapsedLayerIds),
    [collapsedLayerIds, previewDocument],
  );
  const previewDrillPath = useMemo(
    () => reconcilePreviewDrillPath(previewDocument?.root ?? null, getDesignPreviewDrillPathFromSelection(selection)),
    [previewDocument, selection],
  );
  const visiblePreviewLayers = useMemo(
    () => getVisiblePreviewLayers(previewLayers, visibleCollapsedLayerIds),
    [previewLayers, visibleCollapsedLayerIds],
  );
  const selectedLayer = selectedLayerId
    ? previewLayerById.get(selectedLayerId) ?? inspectablePreviewLayerById.get(selectedLayerId) ?? visiblePreviewLayers[0] ?? previewLayers[0] ?? null
    : null;
  useEffect(() => {
    const root = previewDocument?.root ?? null;
    if (!root || !selectedLayerId || findEditableTreeNodeInPreviewTree(root, selectedLayerId)) return;

    // Selection's node isn't in the freshly-parsed tree. Two things could
    // cause this:
    //
    //   1. Transient state-propagation mismatch: tree was re-parsed in this
    //      tick, but the parent-owned `selection` hasn't propagated yet, so
    //      we're comparing the OLD selectedLayerId against the NEW tree.
    //      One more render and they'll align again.
    //
    //   2. Real deletion: the node is genuinely gone and we need to pick a
    //      sensible fallback.
    //
    // To avoid the visible jump from case 1, defer the auto-fix to the next
    // macrotask. If by then the selection still doesn't resolve, we treat it
    // as case 2 and walk up the path-encoded ancestor chain rather than
    // yanking the user to the first visible layer (which is usually root —
    // far from where they were working).
    const timer = window.setTimeout(() => {
      // Re-resolve against both the latest selection and latest hydrated tree.
      // Runtime controls can briefly invalidate an imported-source projection
      // while opening a portal or committing local state. Treating that single
      // render as a deletion jumps selection to a distant ancestor.
      const latestSelection = latestSelectionRef.current;
      const latestSelectedId = getDesignLayerIdFromSelection(latestSelection);
      if (!latestSelectedId) return;
      // A source-authored page node remains a valid selection even when its
      // imported component hydration is temporarily absent. Runtime open/
      // close state must never demote that source selection to an ancestor.
      if (
        sourcePreviewDocument?.root &&
        findEditableTreeNodeInPreviewTree(sourcePreviewDocument.root, latestSelectedId)
      ) return;
      const latestRoot = latestPreviewDocumentRef.current?.root ?? null;
      if (!latestRoot || findEditableTreeNodeInPreviewTree(latestRoot, latestSelectedId)) return;
      const latestPreviewLayers = latestPreviewLayersRef.current;

      const closestAncestorLayerId = resolveClosestSurvivingAncestorLayerId(
        latestRoot,
        latestSelectedId,
        latestPreviewLayers,
      );
      const fallbackLayerId = closestAncestorLayerId
        ?? latestPreviewLayers[0]?.id
        ?? latestRoot.id;
      if (fallbackLayerId !== latestSelectedId) {
        applyDesignSelectionChange(createDesignLayerSelectionState(latestSelection, fallbackLayerId));
      }
    }, 160);

    return () => window.clearTimeout(timer);
  }, [
    onSelectionChange,
    previewDocument,
    previewLayers,
    selectedLayerId,
    selection,
    sourcePreviewDocument,
    visiblePreviewLayers,
  ]);
  const selectionScope = useMemo(
    () => resolveEditableTreeSelectionScope({
      activeEntityId: activeDesignTarget?.id ?? null,
      root: previewDocument?.root ?? null,
      selectedNodeId: selectedLayer?.id ?? selectedLayerId,
    }),
    [activeDesignTarget?.id, previewDocument, selectedLayer?.id, selectedLayerId],
  );
  const selectedPreviewTreeLookup = useMemo(
    () => (previewDocument?.root && selectedLayerId ? findEditableTreeNodeInPreviewTree(previewDocument.root, selectedLayerId) : null),
    [previewDocument, selectedLayerId],
  );
  const selectedSourceNodeIsPreviewOnly = selectedPreviewTreeLookup?.sourcePreviewOnly === true;
  const selectedLayerSourceNode = useMemo(
    () => selectedPreviewTreeLookup?.node ?? null,
    [selectedPreviewTreeLookup],
  );
  const selectedSourceNode = selectedLayerSourceNode?.source?.sourceFile
    ? selectedLayerSourceNode
    : selectionScope.sourceFile ? selectionScope.selectedNode : null;
  const selectedSourceSubject = useMemo(() => {
    if (activeRuntimeStory) return null;
    const sourceFile = selectedSourceNode?.source?.sourceFile;
    if (!sourceFile) return null;
    if (sourceSubject?.sourceFile === sourceFile) return sourceSubject;
    return resolveProjectAssetSubjectForSourceFile(pages, components, sourceFile);
  }, [activeRuntimeStory, components, pages, selectedSourceNode?.source?.sourceFile, sourceSubject]);
  const sourceEditSubject = selectedSourceSubject ?? sourceSubject;
  const sourceEditHistory = useMemo(
    () => getSourceHistoryControllerForSubject(sourceEditSubject),
    [previewSourceTreeResult, sourceEditSubject, sourceHistory, sourceHydrationVersion],
  );
  const sourceInsertComponents = useMemo(
    () => getComponentsVisibleForSourceInsert(components.components, selectedSourceNode),
    [components.components, selectedSourceNode],
  );
  const selectedSourceNodeForInspector = selectedSourceNode;
  const activeDesignStateSourceFile = projectTreeSource.source.kind === 'none'
    ? null
    : projectTreeSource.source.sourceFile;
  const activeDesignStates = sourceTreeResult?.designStates ?? [];
  const activeDesignStateOverrides = activeDesignStateSourceFile
    ? getDesignStateOverridesForSource(activeDesignStateSourceFile)
    : {};
  const changeDesignStateOverride = useCallback((name: string, value: DesignStateOverrideValue | null) => {
    if (!activeDesignStateSourceFile) return;
    const sourceKey = normalizeProjectSourceFileReference(activeDesignStateSourceFile);
    setDesignStateOverrides((current) => {
      const currentForSource = current[sourceKey] ?? {};
      const nextForSource = { ...currentForSource };
      if (value === null) {
        delete nextForSource[name];
      } else {
        nextForSource[name] = value;
      }
      if (Object.keys(nextForSource).length === 0) {
        const { [sourceKey]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [sourceKey]: nextForSource };
    });
  }, [activeDesignStateSourceFile]);
  useEffect(() => {
    setCssClassEffectivenessReport(null);
  }, [
    activeRuntimePageProjection,
    activeRuntimeStory,
    selectedLayerId,
    selectedSourceNodeForInspector?.sourceAttributes?.className,
  ]);
  const updateCssClassEffectivenessReport = useCallback((report: CssClassEffectivenessReport | null) => {
    setCssClassEffectivenessReport((current) => (
      areCssClassEffectivenessReportsEqual(current, report) ? current : report
    ));
  }, []);
  const selectedSourcePreviewTokenModes = useMemo(
    () => resolveSourceNodePreviewTokenModes(
      previewDocument?.root ?? null,
      selectedSourceNode?.id ?? null,
      previewTokenModes,
    ),
    [previewDocument?.root, previewTokenModes, selectedSourceNode?.id],
  );
  const batchEditableSourceNodes = useMemo(
    () => resolveDesignBatchEditableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      sourceFile: sourceEditSubject?.sourceFile ?? null,
    }),
    [previewDocument, selectedLayerIds, sourceEditSubject?.sourceFile],
  );
  const selectedSourceComponent = useMemo(
    () => resolveDesignComponentForSourceNode(selectedSourceNodeForInspector, components.components) ??
      createSourceNodeStoryComponentFallback(selectedSourceNodeForInspector),
    [components.components, selectedSourceNodeForInspector],
  );
  const selectedSourceComponentStoryKey = selectedSourceComponent
    ? getComponentStoryMetadataCacheKey(
      selectedSourceComponent,
      projectId,
      componentStoryMetadataRetryRevision,
    )
    : null;
  const selectedSourceComponentStory = useMemo(
    () => getComponentStoryForInspector({
      cachedStory: selectedSourceComponentStoryKey ? componentStoryMetadataByKey[selectedSourceComponentStoryKey] : undefined,
      component: selectedSourceComponent,
      node: selectedSourceNodeForInspector,
    }),
    [componentStoryMetadataByKey, selectedSourceComponent, selectedSourceComponentStoryKey, selectedSourceNodeForInspector],
  );
  useEffect(() => {
    if (!selectedSourceComponent || getWorkbenchStory(selectedSourceComponent)) return undefined;
    const storySourceFile = getComponentCsfStorySourceFile(selectedSourceComponent);
    if (!storySourceFile || !selectedSourceComponentStoryKey) return undefined;
    if (Object.prototype.hasOwnProperty.call(componentStoryMetadataByKey, selectedSourceComponentStoryKey)) return undefined;

    let cancelled = false;
    void importWorkbenchCsfStoryMetadataWithRetry(storySourceFile, selectedSourceComponent)
      .catch((error) => {
        console.warn('[workbench] CSF story metadata load failed:', error);
        return null;
      })
      .then((story) => {
        // A new project can finish installing after this request started. Failed
        // imports are not authoritative cache entries; the dependency revision
        // above retries them without requiring a page reload.
        if (cancelled || !story) return;
        setComponentStoryMetadataByKey((current) => ({
          ...current,
          [selectedSourceComponentStoryKey]: story,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    componentStoryMetadataByKey,
    componentStoryMetadataRetryRevision,
    selectedSourceComponent,
    selectedSourceComponentStoryKey,
  ]);
  const hasSelectedSourceEditTarget = Boolean(
    selectionScope.sourceCapabilities.canEditFields &&
    sourceEditSubject &&
    sourceEditHistory,
  );
  const hasSelectedSourceFieldEditTarget = Boolean(
    selectionScope.sourceCapabilities.canEditFields &&
    !selectedSourceNodeIsPreviewOnly &&
    selectedSourceNode?.source?.sourceFile === sourceEditSubject?.sourceFile &&
    selectedSourceNode?.sourceLocation &&
    sourceEditSubject &&
    sourceEditHistory,
  );
  const hasBatchSourceFieldEditTarget = Boolean(
    batchEditableSourceNodes.length > 1 &&
    sourceEditSubject &&
    sourceEditHistory &&
    selectionScope.sourceCapabilities.canEditFields,
  );
  const hasLayerMultiSelection = selectedLayerIds.length > 1;
  const hasRuntimeDesignEditTarget = Boolean(
    activeRuntimeStory &&
    activeRuntimeProjectionKey &&
    runtimeProjection?.key === activeRuntimeProjectionKey &&
    selectedSourceNode,
  );
  const canEditInspectorFields = (
    (!hasLayerMultiSelection && hasSelectedSourceFieldEditTarget) ||
    hasBatchSourceFieldEditTarget ||
    hasRuntimeDesignEditTarget
  );
  const editableInspectorNode = hasSelectedSourceEditTarget || hasRuntimeDesignEditTarget ? selectedSourceNodeForInspector : null;
  const inspectorNoticeForSelection = selectedSourceNodeIsPreviewOnly
    ? 'Preview-only local component content. Selectable for inspection; edit the owning component instance to change source.'
    : inspectorNotice;
  const hasSourceStructureEditTarget = Boolean(
    selectionScope.sourceCapabilities.canEditStructure &&
    !selectedSourceNodeIsPreviewOnly &&
    sourceEditSubject &&
    sourceEditHistory &&
    !activeRuntimePageProjection
  );
  const hasSelectedSourceStructureEditTarget = Boolean(
    selectionScope.sourceCapabilities.canEditStructure &&
    hasSourceStructureEditTarget &&
    selectedSourceNode?.source?.sourceFile === sourceEditSubject?.sourceFile &&
    selectedSourceNode?.sourceLocation
  );
  // Delete and Duplicate used to be wired as `undefined` when this gate was
  // false, so the canvas handler's `&& shortcuts.onDeleteSelection` condition
  // simply skipped and the key press did nothing at all -- no notice, no log.
  // Copy, Cut and Move are wired unconditionally and kept working on the same
  // selection, which is how the gate was shown to be the wrong owner of the
  // decision. The commands are unconditional now; this names the reason so a
  // refusal is visible instead of silent.
  function getSourceStructureEditBlockReason(): string | null {
    if (!selectedLayer || !selectedSourceNode) return 'No source-backed layer is selected.';
    if (selectedSourceNodeIsPreviewOnly) {
      return selectionScope.editabilityDiagnostic?.message
        ?? 'This layer is preview-only content projected from a local component boundary.';
    }
    if (!sourceEditSubject || !sourceEditHistory) return 'Selected layer has no source history lane yet.';
    if (!selectionScope.sourceCapabilities.canEditStructure) {
      return selectionScope.editabilityDiagnostic?.message
        ?? 'Selected layer does not have an editable source structure path.';
    }
    const nodeSourceFile = selectedSourceNode.source?.sourceFile ?? null;
    if (nodeSourceFile !== (sourceEditSubject.sourceFile ?? null)) {
      return `Selected layer lives in ${nodeSourceFile ?? 'an unresolved file'}, but the active source subject is ${sourceEditSubject.sourceFile ?? 'unresolved'}.`;
    }
    if (!selectedSourceNode.sourceLocation) {
      return 'This layer has a source file, but Workbench does not have a safe JSX range for it.';
    }
    return null;
  }

  const selectedLayerReadOnly = Boolean(
    selectedLayerId &&
    selectedLayerSourceNode &&
    !hasRuntimeDesignEditTarget &&
    !hasSelectedSourceFieldEditTarget &&
    !hasBatchSourceFieldEditTarget
  );
  const selectedComponentPickerTargetIndex = selectedSourceNode
    ? resolveSourceLayerAddChildTargetIndex({
      activeLayerId: selectedLayer?.id ?? null,
      parentNode: selectedSourceNode,
      selectedLayerIds,
    })
    : undefined;

  function openSelectedComponentPicker() {
    if (!hasSelectedSourceStructureEditTarget || !selectedLayer || !selectedSourceNode) {
      setInspectorNotice('Select a source-backed layer before opening the insert picker.');
      return;
    }
    if (!canShowSourceLayerAddAction(selectedSourceNode)) {
      setInspectorNotice(`${selectedSourceNode.label} cannot receive child nodes.`);
      return;
    }
    if (!canInsertComponentIntoSourceNode(selectedSourceNode) && getSourceInsertTemplatesForNode(selectedSourceNode).length === 0) {
      setInspectorNotice(`${selectedSourceNode.label} has no available child nodes to insert.`);
      return;
    }
    setSourceComponentPickerOpen(true);
  }

  function getCachedSourceTreeResultForFile(sourceFile: string): SourceTreeResult | null {
    const cacheKey = getSourceTreeCacheKey(sourceFile);
    const keyedResult = sourceTreeResultCacheRef.current.get(cacheKey);
    if (keyedResult?.contents !== null && keyedResult?.contents !== undefined) return keyedResult;

    const latestResult = sourceTreeResultRef.current;
    if (latestResult?.sourceFile === sourceFile && latestResult.contents !== null) {
      return latestResult;
    }
    if (previewSourceTreeResult?.sourceFile === sourceFile && previewSourceTreeResult.contents !== null) {
      return previewSourceTreeResult;
    }

    return [...sourceTreeResultCacheRef.current.values()]
      .find((result) => result.sourceFile === sourceFile && result.contents !== null) ?? null;
  }

  function getCachedSourceContentsForFile(sourceFile: string): string | null {
    return getCachedSourceTreeResultForFile(sourceFile)?.contents ?? null;
  }

  useEffect(() => {
    if (!sourceComponentPickerOpen) return;
    if (
      hasSelectedSourceStructureEditTarget &&
      selectedLayer &&
      selectedSourceNode &&
      canShowSourceLayerAddAction(selectedSourceNode)
    ) return;
    setSourceComponentPickerOpen(false);
  }, [hasSelectedSourceStructureEditTarget, selectedLayer, selectedSourceNode, sourceComponentPickerOpen]);

  function getSourceHistoryControllerForSubject(subject: ProjectAssetHistorySubject | null): HistoryController<string> | null {
    if (!subject) return null;
    const laneId = getProjectAssetHistoryLaneId(subject);
    // An open lane answers on its own; the cache is only ever a seed for a lane
    // the store has not seen. Asking the cache first would make an edit fail for
    // want of a parsed tree the controller did not need.
    const existing = sourceHistoryStoreRef.current.peek(laneId);
    if (existing) return existing;
    const cachedContents = getCachedSourceContentsForFile(subject.sourceFile);
    return cachedContents !== null
      ? sourceHistoryStoreRef.current.get(laneId, cachedContents)
      : null;
  }

  // The file says `contents`. If the lane already holds that, this is one of our
  // own edits coming back around — a re-parse, a preflight read — and the stack
  // stays. If it does not, the file moved somewhere this lane never produced, so
  // the stack has to go: undoing from it would write source back that this file
  // never came from.
  //
  // Every caller has to go through here rather than calling `reset` itself. Two
  // separate sites got this wrong by resetting on a value they had not compared,
  // and each one silently emptied a live undo stack.
  function reconcileSourceHistoryLaneToDisk(
    subject: ProjectAssetHistorySubject,
    contents: string,
  ): void {
    const laneId = getProjectAssetHistoryLaneId(subject);
    const lane = sourceHistoryStoreRef.current.peek(laneId);
    if (lane && areSourceContentsEqual(lane.getSnapshot().value, contents)) return;
    sourceHistoryStoreRef.current.reset(laneId, contents);
  }

  function getLatestSourceInspectorContext() {
    const subject = activeRuntimeStory ? null : sourceEditSubject ?? sourceSubject ?? latestSourceSubjectRef.current;
    return {
      history: getSourceHistoryControllerForSubject(subject),
      selection: latestSelectionRef.current,
      subject,
    };
  }

  async function ensureSourceInspectorEditUsesLatestDiskContents(): Promise<void> {
    const subject = activeRuntimeStory ? null : sourceEditSubject ?? sourceSubject ?? latestSourceSubjectRef.current;
    if (!subject) return;

    let readResult: Awaited<ReturnType<typeof readWorkbenchSourceFile>>;
    try {
      readResult = await readWorkbenchSourceFile(subject.sourceFile);
    } catch (error) {
      throw new Error(
        `${subject.sourceFile} could not be checked before editing: ${formatDesignEditorError(error)}.`,
      );
    }
    if (!readResult.ok) {
      throw new Error(`${subject.sourceFile} could not be checked before editing: ${readResult.message}`);
    }

    // This is the one place that knows what is actually on disk before an edit,
    // so it owns both reconciliations — and they are separate. A tree cache that
    // lags gets re-parsed; only a lane whose value the file never had loses its
    // stack. Conflating them is what used to drop a good stack every time the
    // cache was a beat behind.
    const currentHistory = getSourceHistoryControllerForSubject(subject);
    const cachedContents = getCachedSourceContentsForFile(subject.sourceFile);
    const laneMatchesDisk = currentHistory !== null
      && areSourceContentsEqual(currentHistory.getSnapshot().value, readResult.contents);
    if (
      cachedContents !== null &&
      areSourceContentsEqual(cachedContents, readResult.contents) &&
      laneMatchesDisk
    ) {
      return;
    }

    const refreshedResult = await createSourceTreeResultFromContents(subject.sourceFile, readResult.contents);
    if (
      !refreshedResult.tree ||
      refreshedResult.contents === null ||
      !areSourceContentsEqual(refreshedResult.contents, readResult.contents)
    ) {
      throw new Error(`${subject.sourceFile} changed on disk but the latest source could not be parsed.`);
    }

    const currentResult = sourceTreeResultRef.current;
    if (currentResult?.cacheKey === refreshedResult.cacheKey) {
      sourceTreeResultRef.current = refreshedResult;
      if (mountedRef.current) setSourceTreeResult(refreshedResult);
    }
    latestSourceSubjectRef.current = subject;
    reconcileSourceHistoryLaneToDisk(subject, readResult.contents);
    refreshSourceHistoryView();
  }

  sourceInspectorEditPreflightRef.current = ensureSourceInspectorEditUsesLatestDiskContents;

  function applyDesignSelectionChange(nextSelection: WorkbenchSelectionState) {
    latestSelectionRef.current = nextSelection;
    onSelectionChange(nextSelection);
  }

  function restoreDesignLayerSelectionAfterSourceRefresh(
    baseSelection: WorkbenchSelectionState,
    refreshedTree: EditableDocumentTree | null,
    nextLayerId: string | null,
  ) {
    const currentSelection = latestSelectionRef.current;
    if (!areDesignSelectionAnchorsEqual(currentSelection, baseSelection)) return;
    const resolvedLayerId = resolveSourceSelectionAfterRefresh(refreshedTree, nextLayerId);
    // Moving/inserting/pasting a node under a collapsed parent must reveal that
    // parent — otherwise the selected node's row stays hidden and the tree's
    // selection indicator looks broken. Persisting the expand (not a transient
    // one) keeps the parent's collapse toggle consistent afterwards.
    applyDesignSelectionChange(revealDesignLayerCollapsedAncestors(
      createDesignLayerSelectionState(currentSelection, resolvedLayerId),
      refreshedTree?.root ?? null,
      resolvedLayerId,
    ));
  }

  function restoreMovedDesignLayerSelectionAfterSourceRefresh(
    baseSelection: WorkbenchSelectionState,
    refreshedTree: EditableDocumentTree | null,
    movedLayerIds: Array<{ nextNodeId: string; nodeId: string }>,
    activeLayerId: string | null,
  ) {
    const currentSelection = latestSelectionRef.current;
    if (!areDesignSelectionAnchorsEqual(currentSelection, baseSelection) || !refreshedTree) return;
    const visibleMoves = movedLayerIds.filter(({ nextNodeId }) => findEditableTreeNode(refreshedTree.root, nextNodeId));
    if (visibleMoves.length !== movedLayerIds.length) return;
    const nextActiveLayerId = visibleMoves.find(({ nodeId }) => nodeId === activeLayerId)?.nextNodeId ??
      visibleMoves[visibleMoves.length - 1]?.nextNodeId ??
      null;
    const nextSelectedLayerIds = visibleMoves.map(({ nextNodeId }) => nextNodeId);
    applyDesignSelectionChange(revealDesignLayerCollapsedAncestors(
      createDesignPreviewDrillPathSelectionState(
        currentSelection,
        refreshedTree.root,
        getDesignPreviewDrillPathFromSelection(currentSelection),
        nextActiveLayerId,
        nextSelectedLayerIds,
      ),
      refreshedTree.root,
      nextActiveLayerId,
    ));
  }

  function restoreWrappedDesignLayerSelectionAfterSourceRefresh(
    baseSelection: WorkbenchSelectionState,
    refreshedTree: EditableDocumentTree | null,
    wrapperLayerId: string,
    wrappedChildLayerIds: string[],
  ) {
    const currentSelection = latestSelectionRef.current;
    if (!areDesignSelectionAnchorsEqual(currentSelection, baseSelection)) return;
    if (!refreshedTree || !findEditableTreeNode(refreshedTree.root, wrapperLayerId)) return;
    const visibleChildLayerIds = wrappedChildLayerIds.filter((layerId) => findEditableTreeNode(refreshedTree.root, layerId));
    applyDesignSelectionChange(revealDesignLayerCollapsedAncestors(
      createDesignWrappedLayerSelectionState(
        currentSelection,
        refreshedTree.root,
        wrapperLayerId,
        visibleChildLayerIds,
      ),
      refreshedTree.root,
      wrapperLayerId,
    ));
  }

  // Undo only ever touches the lane the user is looking at, so there is no
  // cross-lane resolution any more. Reaching into another lane used to edit that
  // file on disk without showing it — `restoreDesignHistorySelection` bails when
  // the transaction's document is not the active one.
  function getActiveSourceHistoryContext() {
    const currentContext = getLatestSourceInspectorContext();
    return currentContext.history && currentContext.subject
      ? { history: currentContext.history, selection: currentContext.selection, subject: currentContext.subject }
      : null;
  }

  function getActiveDesignHistoryLaneId(): HistoryLaneId | null {
    return getLatestSourceInspectorContext().history?.getSnapshot().laneId ?? null;
  }

  function getDesignPageHistoryStack(laneId: HistoryLaneId): DesignPageHistoryStack {
    const existing = designPageHistoryRef.current.get(laneId);
    if (existing) return existing;
    const created: DesignPageHistoryStack = { redo: [], undo: [] };
    designPageHistoryRef.current.set(laneId, created);
    return created;
  }

  function pushDesignPageHistoryEntry(laneId: HistoryLaneId | null, entry: DesignPageHistoryEntry) {
    if (!laneId) return;
    const stack = getDesignPageHistoryStack(laneId);
    designPageHistoryRef.current.set(laneId, {
      redo: [],
      undo: [...stack.undo.slice(-(DESIGN_PAGE_HISTORY_MAX_ENTRIES - 1)), entry],
    });
  }

  function moveDesignPageHistoryEntry(
    laneId: HistoryLaneId,
    direction: 'redo' | 'undo',
    entry: DesignPageHistoryEntry,
  ) {
    const stack = getDesignPageHistoryStack(laneId);
    const from = direction === 'undo' ? stack.undo : stack.redo;
    const to = direction === 'undo' ? stack.redo : stack.undo;
    const next = [...to.slice(-(DESIGN_PAGE_HISTORY_MAX_ENTRIES - 1)), entry];
    designPageHistoryRef.current.set(laneId, direction === 'undo'
      ? { redo: next, undo: from.slice(0, -1) }
      : { redo: from.slice(0, -1), undo: next });
  }

  function getLastDesignPageHistoryEntry(
    laneId: HistoryLaneId,
    direction: 'redo' | 'undo',
  ): DesignPageHistoryEntry | undefined {
    const stack = getDesignPageHistoryStack(laneId);
    const entries = direction === 'undo' ? stack.undo : stack.redo;
    return entries[entries.length - 1];
  }

  function dropDesignPageHistoryEntry(laneId: HistoryLaneId, direction: 'redo' | 'undo') {
    const stack = getDesignPageHistoryStack(laneId);
    designPageHistoryRef.current.set(laneId, direction === 'undo'
      ? { ...stack, undo: stack.undo.slice(0, -1) }
      : { ...stack, redo: stack.redo.slice(0, -1) });
  }

  function commitDesignSelectionChange(nextSelection: WorkbenchSelectionState) {
    const currentSelection = latestSelectionRef.current;
    if (areWorkbenchSelectionStatesEqual(currentSelection, nextSelection)) return;
    // A selection change that moves to a different target is navigation, not an
    // edit. Recording it is what made Ctrl+Z switch pages: the entry carries the
    // whole selection state, `activeTarget` included, so restoring it moved the
    // user somewhere else. Navigation is still applied — just not undoable.
    if (areWorkbenchSelectionTargetsOnSameDesignTarget(currentSelection, nextSelection)) {
      pushDesignPageHistoryEntry(getActiveDesignHistoryLaneId(), {
        kind: 'selection',
        after: nextSelection,
        before: currentSelection,
      });
    }
    applyDesignSelectionChange(nextSelection);
  }

  function recordDesignSourceHistoryTransaction(
    transaction?: WorkbenchEditTransaction<string> | null,
  ) {
    if (!transaction?.laneId) return;
    pushDesignPageHistoryEntry(transaction.laneId, { kind: 'source' });
  }

  function recordRuntimeDesignHistoryAction() {
    // The Storybook surface keeps its own stack; it never enters a page stack.
  }

  function recordSpecNoteHistoryAction() {
    // Notes live in a sidecar beside the page/component source, so a note edit
    // belongs to the same lane as that file's source edits.
    pushDesignPageHistoryEntry(getActiveDesignHistoryLaneId(), { kind: 'notes' });
  }

  // A reversible folder/move mutation. These touch pages.json and the real
  // filesystem, so they stay project-level rather than joining a page stack —
  // `delete folder` would be unreachable once that folder's pages are gone.
  function recordWorkspaceHistory(entry: WorkspaceDesignHistoryEntry) {
    workspaceDesignUndoStackRef.current = [
      ...workspaceDesignUndoStackRef.current.slice(-(WORKSPACE_HISTORY_MAX_ENTRIES - 1)),
      entry,
    ];
    workspaceDesignRedoStackRef.current = [];
    syncWorkspaceHistoryStatus();
  }

  function syncWorkspaceHistoryStatus() {
    const undoStack = workspaceDesignUndoStackRef.current;
    const redoStack = workspaceDesignRedoStackRef.current;
    setWorkspaceHistoryStatus({
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      undoLabel: undoStack[undoStack.length - 1]?.label ?? null,
      redoLabel: redoStack[redoStack.length - 1]?.label ?? null,
    });
  }

  function clearRuntimeDesignHistory() {
    runtimeDesignUndoStackRef.current = [];
    runtimeDesignRedoStackRef.current = [];
  }

  function undoDesignSelectionHistory(entry: Extract<DesignPageHistoryEntry, { kind: 'selection' }>) {
    applyDesignSelectionChange(entry.before);
    return true;
  }

  function redoDesignSelectionHistory(entry: Extract<DesignPageHistoryEntry, { kind: 'selection' }>) {
    applyDesignSelectionChange(entry.after);
    return true;
  }

  function selectDesignTarget(target: DesignSourceTarget) {
    const nextOpenTargetKeys = appendOpenDesignTargetKey(openTargetKeys, getDesignTargetKey(target));
    commitDesignSelectionChange(createDesignTargetSelectionState(target, latestSelectionRef.current, nextOpenTargetKeys));
  }

  async function createDesignPage(folderInput: unknown = '') {
    const folder = typeof folderInput === 'string' ? folderInput : '';
    const reservedSourceFiles = new Set(pages.pages.map((page) => page.sourceFile));

    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const page = createWorkbenchDesignPage(pages, reservedSourceFiles, folder);
      reservedSourceFiles.add(page.sourceFile);
      // The template is authored as a pages-root file ("../workbench-tokens.css").
      // Re-express its relative imports for the page's real location so it stays
      // correct even if the page is ever created inside a folder (depth > 1).
      const baseContents = createWorkbenchDesignPageSource(page.name);
      const sourceContents = rewriteRelativeImportsForFileMove(baseContents, 'src/workbench-pages/__new-page__.tsx', page.sourceFile);
      const writeResult = await writeWorkbenchSourceFile(page.sourceFile, sourceContents, { overwrite: false });

      if (!writeResult.ok) {
        if (isWorkbenchSourceFileAlreadyExistsMessage(writeResult.message)) {
          const linked = await linkExistingDesignPage(page);
          if (linked) return;
          continue;
        }
        setInspectorNotice(writeResult.message);
        return;
      }

      try {
        await commitDesignPageRegistryEntry(page, sourceContents, `Created ${page.name}.`);
      } catch (error) {
        await deleteWorkbenchSourceFile(page.sourceFile);
        clearSourceTreeResultCacheForFile(page.sourceFile);
        setInspectorNotice(error instanceof Error ? error.message : 'Page creation failed.');
      }
      return;
    }

    setInspectorNotice('Page creation failed because no available source filename was found.');
  }

  async function duplicateDesignPage(target: DesignSourceTarget) {
    if (target.kind !== 'page') return;
    const sourcePage = pages.pages.find((page) => page.id === target.id);
    if (!sourcePage) return;

    const readResult = await readWorkbenchSourceFile(sourcePage.sourceFile);
    if (!readResult.ok) {
      setInspectorNotice(readResult.message);
      return;
    }

    const reservedSourceFiles = new Set(pages.pages.map((page) => page.sourceFile));
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const page = createDuplicatedWorkbenchDesignPage(pages, sourcePage, reservedSourceFiles);
      reservedSourceFiles.add(page.sourceFile);
      const renamedContents = renameWorkbenchDesignPageSource(readResult.contents, page.name);
      // The copy can land at a different folder depth than the source (e.g.
      // duplicating a Design/* page into the pages root), which would otherwise
      // leave its relative imports (../../workbench-tokens.css, ../../libraries/…)
      // pointing at the wrong depth. Re-express them for the new file location.
      const sourceContents = rewriteRelativeImportsForFileMove(renamedContents, sourcePage.sourceFile, page.sourceFile);
      const writeResult = await writeWorkbenchSourceFile(page.sourceFile, sourceContents, { overwrite: false });

      if (!writeResult.ok) {
        if (isWorkbenchSourceFileAlreadyExistsMessage(writeResult.message)) continue;
        setInspectorNotice(writeResult.message);
        return;
      }

      try {
        await commitDesignPageRegistryEntry(page, sourceContents, `Duplicated ${sourcePage.name}.`);
      } catch (error) {
        await deleteWorkbenchSourceFile(page.sourceFile);
        clearSourceTreeResultCacheForFile(page.sourceFile);
        setInspectorNotice(error instanceof Error ? error.message : 'Page duplicate failed.');
      }
      return;
    }

    setInspectorNotice('Page duplicate failed because no available source filename was found.');
  }

  async function linkExistingDesignPage(page: DesignLibraryPage): Promise<boolean> {
    const readResult = await readWorkbenchSourceFile(page.sourceFile);
    if (!readResult.ok) return false;
    try {
      await commitDesignPageRegistryEntry(page, readResult.contents, `Linked existing ${page.name}.`);
    } catch (error) {
      setInspectorNotice(error instanceof Error ? error.message : 'Page recovery failed.');
    }
    return true;
  }

  async function commitDesignPageRegistryEntry(page: DesignLibraryPage, sourceContents: string, notice: string) {
    await createSourceTreeResultFromContents(page.sourceFile, sourceContents);
    const nextPages: WorkbenchPageRegistry = {
      ...pages,
      pages: [...pages.pages, page],
    };
    const targetSelection = createDesignSourceTargetFromPage(page);
    const nextOpenTargetKeys = appendOpenDesignTargetKey(openTargetKeys, getDesignTargetKey(targetSelection));
    const folder = getPageFolderForSourceFile(page.sourceFile);
    const foldersToReveal = folder ? [folder, ...getPageFolderAncestors(folder)] : [];
    const selectionWithRevealedFolders = foldersToReveal.length > 0
      ? createDesignPageFolderRevealSelectionState(latestSelectionRef.current, foldersToReveal)
      : latestSelectionRef.current;
    const nextSelection = createDesignTargetSelectionState(targetSelection, selectionWithRevealedFolders, nextOpenTargetKeys);

    await saveWorkbenchPages(pagePath, nextPages);
    setPages(nextPages);
    onPagesChange?.(nextPages);
    applyDesignSelectionChange(nextSelection);
    setInspectorNotice(notice);
  }

  async function deleteDesignPage(target: DesignSourceTarget) {
    if (target.kind !== 'page') return;
    const page = pages.pages.find((candidate) => candidate.id === target.id);
    if (!page) return;

    const sourceTreeResult = await readWorkbenchDiskImportFiles('src', { includeContents: true });
    if (!sourceTreeResult.ok) {
      setInspectorNotice(`Page delete stopped because source references could not be checked: ${sourceTreeResult.message}`);
      return;
    }
    const dependentSourceFiles = findWorkbenchSourceFileDependents(sourceTreeResult.files, page.sourceFile);
    if (dependentSourceFiles.length > 0) {
      const displayedSourceFiles = dependentSourceFiles.slice(0, 3);
      const remainingCount = dependentSourceFiles.length - displayedSourceFiles.length;
      const dependencySummary = `${displayedSourceFiles.join(', ')}${remainingCount > 0 ? `, +${remainingCount} more` : ''}`;
      setInspectorNotice(`Cannot delete ${page.name} because it is imported by ${dependencySummary}. Remove those references first.`);
      return;
    }

    const nextPages: WorkbenchPageRegistry = {
      ...pages,
      pages: pages.pages.filter((candidate) => candidate.id !== target.id),
    };
    const key = getDesignTargetKey(target);
    const nextOpenTargetKeys = openTargetKeys.filter((openTargetKey) => openTargetKey !== key);
    const currentSelection = latestSelectionRef.current;
    const nextSelection = createDesignEmptySelectionState(currentSelection, nextOpenTargetKeys);

    setPages(nextPages);
    onPagesChange?.(nextPages);
    applyDesignSelectionChange(nextSelection);
    try {
      await saveWorkbenchPages(pagePath, nextPages);
      const deleteResult = await deleteWorkbenchSourceFile(page.sourceFile);
      if (!deleteResult.ok) {
        await saveWorkbenchPages(pagePath, pages);
        setPages(pages);
        onPagesChange?.(pages);
        applyDesignSelectionChange(selection);
        setInspectorNotice(deleteResult.message);
        return;
      }
      clearSourceTreeResultCacheForFile(page.sourceFile);
      void deleteWorkbenchSourceFile(getWorkbenchSpecNoteSidecarPath(page.sourceFile));
      setInspectorNotice(`Deleted ${page.name}.`);
    } catch (error) {
      setPages(pages);
      onPagesChange?.(pages);
      applyDesignSelectionChange(selection);
      setInspectorNotice(error instanceof Error ? error.message : 'Page delete failed.');
    }
  }

  // ── Page folders ───────────────────────────────────────────────────────────
  // Folders in the design-tab source tree map to real directories under
  // src/workbench-pages. The primitives below perform the filesystem +
  // pages.json mutations; the public handlers wrap them with workspace history
  // so create / rename / move / delete all flow through the unified Cmd+Z stack.

  function getPageBasename(sourceFile: string): string {
    const normalized = sourceFile.replace(/\\/g, '/');
    return normalized.slice(normalized.lastIndexOf('/') + 1);
  }

  async function commitPagesRegistry(nextPages: WorkbenchPageRegistry): Promise<void> {
    const reconciledPages = await reconcilePagesRegistryWithDisk(nextPages);
    await saveWorkbenchPages(pagePath, reconciledPages);
    setPages(reconciledPages);
    latestPagesRef.current = reconciledPages;
    onPagesChange?.(reconciledPages);
  }

  async function reconcilePagesRegistryWithDisk(registry: WorkbenchPageRegistry): Promise<WorkbenchPageRegistry> {
    const result = await readWorkbenchDiskImportFiles(WORKBENCH_PAGES_ROOT);
    if (!result.ok) return registry;
    return reconcileWorkbenchPagesWithSourceFiles(
      registry,
      result.files.map((file) => file.relativePath),
    ).nextRegistry;
  }

  function generateUniquePageFolderPath(parentFolder: string): string {
    const existing = new Set(getAllWorkbenchPageFolders(latestPagesRef.current));
    const join = (name: string) => (parentFolder ? `${parentFolder}/${name}` : name);
    for (let index = 1; index < 1000; index += 1) {
      const candidate = join(index === 1 ? 'New folder' : `New folder ${index}`);
      if (!existing.has(candidate)) return candidate;
    }
    return join(`New folder ${Date.now()}`);
  }

  // Moves a single page's source file (and spec-note sidecar) between repo paths,
  // rewriting relative imports and updating the registry + active selection.
  // Replayed verbatim by workspace undo/redo.
  async function relocatePageSourceFile(pageId: string, fromSourceFile: string, toSourceFile: string): Promise<boolean> {
    if (fromSourceFile === toSourceFile) return true;
    const currentPages = latestPagesRef.current;
    if (currentPages.pages.some((candidate) => candidate.id !== pageId && candidate.sourceFile === toSourceFile)) {
      setInspectorNotice(`A page already lives at ${toSourceFile}.`);
      return false;
    }

    const readResult = await readWorkbenchSourceFile(fromSourceFile);
    if (!readResult.ok) {
      setInspectorNotice(readResult.message);
      return false;
    }

    const nextContents = rewriteRelativeImportsForFileMove(readResult.contents, fromSourceFile, toSourceFile);
    const writeResult = await writeWorkbenchSourceFile(toSourceFile, nextContents, { overwrite: false });
    if (!writeResult.ok) {
      setInspectorNotice(writeResult.message);
      return false;
    }
    await deleteWorkbenchSourceFile(fromSourceFile);
    clearSourceTreeResultCacheForFile(fromSourceFile);
    clearSourceTreeResultCacheForFile(toSourceFile);
    await moveWorkbenchSpecNoteSidecar(fromSourceFile, toSourceFile);

    const nextPages: WorkbenchPageRegistry = {
      ...currentPages,
      pages: currentPages.pages.map((candidate) => (
        candidate.id === pageId ? { ...candidate, sourceFile: toSourceFile } : candidate
      )),
    };
    await commitPagesRegistry(nextPages);

    const movedPage = latestPagesRef.current.pages.find((candidate) => candidate.id === pageId);
    const currentSelection = latestSelectionRef.current;
    if (movedPage && currentSelection.extensions.activeDesignSourceFile === fromSourceFile) {
      const movedTarget = createDesignSourceTargetFromPage(movedPage);
      applyDesignSelectionChange(createDesignTargetSelectionState(
        movedTarget,
        currentSelection,
        appendOpenDesignTargetKey(getOpenDesignTargetKeysFromSelection(currentSelection), getDesignTargetKey(movedTarget)),
      ));
    }
    return true;
  }

  // Renames a folder (and everything beneath it) by moving the real directory and
  // re-prefixing every affected page sourceFile + tracked folder path. Depth is
  // unchanged, so relative imports stay valid and need no rewrite.
  async function renamePageFolderPrefix(oldFolder: string, newFolder: string): Promise<boolean> {
    if (oldFolder === newFolder) return true;
    const currentPages = latestPagesRef.current;
    const oldPrefix = `${oldFolder}/`;
    const newPrefix = `${newFolder}/`;

    const allFolders = new Set(getAllWorkbenchPageFolders(currentPages));
    if (allFolders.has(newFolder)) {
      setInspectorNotice(`A folder named ${newFolder} already exists.`);
      return false;
    }

    const moveResult = await moveWorkbenchSourcePath(
      `${WORKBENCH_PAGES_ROOT}/${oldFolder}`,
      `${WORKBENCH_PAGES_ROOT}/${newFolder}`,
    );
    if (!moveResult.ok) {
      setInspectorNotice(moveResult.message);
      return false;
    }

    const remapFolder = (folder: string): string => (
      folder === oldFolder ? newFolder : folder.startsWith(oldPrefix) ? `${newFolder}/${folder.slice(oldPrefix.length)}` : folder
    );
    const pageMoves: Array<{ from: string; to: string }> = [];
    const remappedPages = currentPages.pages.map((candidate) => {
      const folder = getPageFolderForSourceFile(candidate.sourceFile);
      if (folder !== oldFolder && !folder.startsWith(oldPrefix)) return candidate;
      const from = candidate.sourceFile;
      const to = getPageSourceFileForFolder(remapFolder(folder), getPageBasename(candidate.sourceFile));
      pageMoves.push({ from, to });
      clearSourceTreeResultCacheForFile(from);
      clearSourceTreeResultCacheForFile(to);
      return { ...candidate, sourceFile: to };
    });
    // A leaf rename keeps every page at the same depth, but if a folder move ever
    // changes nesting depth the moved files' relative imports (../workbench-tokens.css,
    // ../libraries/…) would point at the wrong level. Re-express them in place for
    // any page whose depth actually changed; same-depth renames stay a no-op.
    for (const { from, to } of pageMoves) {
      if (from.split('/').length === to.split('/').length) continue;
      const moved = await readWorkbenchSourceFile(to);
      if (!moved.ok) continue;
      const rewritten = rewriteRelativeImportsForFileMove(moved.contents, from, to);
      if (rewritten !== moved.contents) await writeWorkbenchSourceFile(to, rewritten, { overwrite: true });
    }
    const nextFolders = getWorkbenchPageFolders(currentPages).map(remapFolder);
    await commitPagesRegistry(withWorkbenchPageFolders({ ...currentPages, pages: remappedPages }, nextFolders));

    // Re-point the active selection if it lived inside the renamed folder.
    const currentSelection = latestSelectionRef.current;
    const activeSourceFile = currentSelection.extensions.activeDesignSourceFile;
    if (activeSourceFile) {
      const activeFolder = getPageFolderForSourceFile(activeSourceFile);
      if (activeFolder === oldFolder || activeFolder.startsWith(oldPrefix)) {
        const movedSourceFile = getPageSourceFileForFolder(remapFolder(activeFolder), getPageBasename(activeSourceFile));
        const movedPage = latestPagesRef.current.pages.find((candidate) => candidate.sourceFile === movedSourceFile);
        if (movedPage) {
          const movedTarget = createDesignSourceTargetFromPage(movedPage);
          applyDesignSelectionChange(createDesignTargetSelectionState(
            movedTarget,
            currentSelection,
            appendOpenDesignTargetKey(getOpenDesignTargetKeysFromSelection(currentSelection), getDesignTargetKey(movedTarget)),
          ));
        }
      }
    }
    return true;
  }

  async function createDesignFolder(parentFolder = '') {
    const folderPath = generateUniquePageFolderPath(parentFolder);
    const absoluteDir = `${WORKBENCH_PAGES_ROOT}/${folderPath}`;
    const createResult = await createWorkbenchSourceFolder(absoluteDir);
    if (!createResult.ok) {
      setInspectorNotice(createResult.message);
      return;
    }

    const addFolder = async () => {
      const registry = latestPagesRef.current;
      await commitPagesRegistry(withWorkbenchPageFolders(registry, [...getWorkbenchPageFolders(registry), folderPath]));
    };
    const removeFolder = async () => {
      const registry = latestPagesRef.current;
      await commitPagesRegistry(withWorkbenchPageFolders(registry, getWorkbenchPageFolders(registry).filter((folder) => folder !== folderPath)));
    };

    await addFolder();
    setInspectorNotice(`Created folder ${folderPath}.`);
    recordWorkspaceHistory({
      label: `folder ${folderPath}`,
      undo: async () => {
        await removeWorkbenchSourceFolder(absoluteDir, { recursive: true });
        await removeFolder();
      },
      redo: async () => {
        await createWorkbenchSourceFolder(absoluteDir);
        await addFolder();
      },
    });
    startRenamingDesignFolder(folderPath);
  }

  async function renameDesignFolder(folderPath: string, nextName: string) {
    cancelRenamingDesignFolder();
    const trimmed = nextName.trim().replace(/[\\/]+/g, ' ').trim();
    const baseName = folderPath.includes('/') ? folderPath.slice(folderPath.lastIndexOf('/') + 1) : folderPath;
    if (!trimmed || trimmed === baseName) return;
    const parent = folderPath.includes('/') ? folderPath.slice(0, folderPath.lastIndexOf('/')) : '';
    const nextFolderPath = parent ? `${parent}/${trimmed}` : trimmed;

    const ok = await renamePageFolderPrefix(folderPath, nextFolderPath);
    if (!ok) return;
    setInspectorNotice(`Renamed folder to ${nextFolderPath}.`);
    recordWorkspaceHistory({
      label: `folder rename ${folderPath} → ${nextFolderPath}`,
      undo: async () => { await renamePageFolderPrefix(nextFolderPath, folderPath); },
      redo: async () => { await renamePageFolderPrefix(folderPath, nextFolderPath); },
    });
  }

  async function movePageToFolder(target: DesignSourceTarget, targetFolder: string) {
    if (target.kind !== 'page') return;
    const page = latestPagesRef.current.pages.find((candidate) => candidate.id === target.id);
    if (!page) return;
    const fromSourceFile = page.sourceFile;
    const toSourceFile = getPageSourceFileForFolder(targetFolder, getPageBasename(fromSourceFile));
    if (fromSourceFile === toSourceFile) return;

    const ok = await relocatePageSourceFile(page.id, fromSourceFile, toSourceFile);
    if (!ok) return;
    setInspectorNotice(`Moved ${page.name} to ${targetFolder || 'Pages'}.`);
    recordWorkspaceHistory({
      label: `move ${page.name}`,
      undo: async () => { await relocatePageSourceFile(page.id, toSourceFile, fromSourceFile); },
      redo: async () => { await relocatePageSourceFile(page.id, fromSourceFile, toSourceFile); },
    });
  }

  // Reorder a page within its folder by placing it before / after a sibling page.
  // Only same-folder reorder is supported here; cross-folder uses movePageToFolder.
  async function reorderDesignPage(draggedKey: string, targetKey: string, position: 'before' | 'after') {
    if (draggedKey === targetKey) return;
    const draggedId = draggedKey.startsWith('page:') ? draggedKey.slice('page:'.length) : null;
    const targetId = targetKey.startsWith('page:') ? targetKey.slice('page:'.length) : null;
    if (!draggedId || !targetId) return;
    const currentPages = latestPagesRef.current;
    const draggedIndex = currentPages.pages.findIndex((page) => page.id === draggedId);
    const targetIndex = currentPages.pages.findIndex((page) => page.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const reordered = currentPages.pages.slice();
    const [moved] = reordered.splice(draggedIndex, 1);
    const baseIndex = reordered.findIndex((page) => page.id === targetId);
    const insertAt = baseIndex < 0
      ? reordered.length
      : position === 'before' ? baseIndex : baseIndex + 1;
    reordered.splice(insertAt, 0, moved);
    const nextPages: WorkbenchPageRegistry = { ...currentPages, pages: reordered };
    await commitPagesRegistry(nextPages);
    recordWorkspaceHistory({
      label: `reorder ${moved.name}`,
      undo: async () => { await commitPagesRegistry(currentPages); },
      redo: async () => { await commitPagesRegistry(nextPages); },
    });
  }

  // Reorder a folder by placing it before / after another folder at the same parent.
  // For cross-parent drops, we fall back to nesting it under the target's parent.
  async function reorderDesignFolder(draggedPath: string, targetPath: string, position: 'before' | 'after') {
    if (draggedPath === targetPath) return;
    if (targetPath.startsWith(`${draggedPath}/`)) return;
    const draggedParent = draggedPath.includes('/') ? draggedPath.slice(0, draggedPath.lastIndexOf('/')) : '';
    const targetParent = targetPath.includes('/') ? targetPath.slice(0, targetPath.lastIndexOf('/')) : '';
    if (draggedParent !== targetParent) {
      // Cross-parent reorder: move dragged folder under the target's parent, preserving its name.
      await nestDesignFolder(draggedPath, targetParent);
      // After nesting, the path changes; we don't pursue the precise before/after slot.
      return;
    }
    const currentPages = latestPagesRef.current;
    const explicit = getWorkbenchPageFolders(currentPages);
    const ordered = getAllWorkbenchPageFolders(currentPages);
    // Build a next explicit list that:
    // - keeps all explicit entries in their current order, EXCEPT
    // - extracts the dragged folder and reinserts it relative to the target.
    // Implicit folders (not in explicit list) get added to explicit so their
    // positions are preserved across reloads now that the user has reordered.
    const seedList = ordered.includes(draggedPath) && ordered.includes(targetPath) ? ordered : explicit;
    const baseList = seedList.includes(draggedPath) ? seedList.filter((f) => f !== draggedPath) : seedList.slice();
    const baseIndex = baseList.indexOf(targetPath);
    if (baseIndex < 0) return;
    const insertAt = position === 'before' ? baseIndex : baseIndex + 1;
    baseList.splice(insertAt, 0, draggedPath);
    const nextRegistry = withWorkbenchPageFolders(currentPages, baseList);
    await commitPagesRegistry(nextRegistry);
    recordWorkspaceHistory({
      label: `reorder folder ${draggedPath}`,
      undo: async () => { await commitPagesRegistry(currentPages); },
      redo: async () => { await commitPagesRegistry(nextRegistry); },
    });
  }

  // Move a folder into another folder, becoming its child.
  async function nestDesignFolder(draggedPath: string, parentPath: string) {
    if (draggedPath === parentPath) return;
    if (parentPath.startsWith(`${draggedPath}/`)) return;
    const currentParent = draggedPath.includes('/') ? draggedPath.slice(0, draggedPath.lastIndexOf('/')) : '';
    if (currentParent === parentPath) return;
    const basename = draggedPath.includes('/') ? draggedPath.slice(draggedPath.lastIndexOf('/') + 1) : draggedPath;
    const newPath = parentPath ? `${parentPath}/${basename}` : basename;
    const ok = await renamePageFolderPrefix(draggedPath, newPath);
    if (!ok) return;
    setInspectorNotice(`Moved folder ${draggedPath} into ${parentPath || 'Pages'}.`);
    recordWorkspaceHistory({
      label: `nest folder ${draggedPath}`,
      undo: async () => { await renamePageFolderPrefix(newPath, draggedPath); },
      redo: async () => { await renamePageFolderPrefix(draggedPath, newPath); },
    });
  }

  async function deleteDesignFolder(folderPath: string) {
    const registry = latestPagesRef.current;
    const prefix = `${folderPath}/`;
    const hasPages = registry.pages.some((candidate) => {
      const folder = getPageFolderForSourceFile(candidate.sourceFile);
      return folder === folderPath || folder.startsWith(prefix);
    });
    if (hasPages) {
      setInspectorNotice('Move or delete the pages inside this folder before deleting it.');
      return;
    }

    const removedFolders = getWorkbenchPageFolders(registry).filter(
      (folder) => folder === folderPath || folder.startsWith(prefix),
    );
    const absoluteDir = `${WORKBENCH_PAGES_ROOT}/${folderPath}`;

    const removeResult = await removeWorkbenchSourceFolder(absoluteDir, { recursive: true });
    if (!removeResult.ok) {
      setInspectorNotice(removeResult.message);
      return;
    }
    await commitPagesRegistry(withWorkbenchPageFolders(
      latestPagesRef.current,
      getWorkbenchPageFolders(latestPagesRef.current).filter((folder) => !removedFolders.includes(folder)),
    ));
    setInspectorNotice(`Deleted folder ${folderPath}.`);
    recordWorkspaceHistory({
      label: `delete folder ${folderPath}`,
      undo: async () => {
        for (const folder of [...removedFolders].sort((left, right) => left.length - right.length)) {
          await createWorkbenchSourceFolder(`${WORKBENCH_PAGES_ROOT}/${folder}`);
        }
        const current = latestPagesRef.current;
        await commitPagesRegistry(withWorkbenchPageFolders(current, [...getWorkbenchPageFolders(current), ...removedFolders]));
      },
      redo: async () => {
        await removeWorkbenchSourceFolder(absoluteDir, { recursive: true });
        const current = latestPagesRef.current;
        await commitPagesRegistry(withWorkbenchPageFolders(
          current,
          getWorkbenchPageFolders(current).filter((folder) => !removedFolders.includes(folder)),
        ));
      },
    });
  }

  function closeDesignTarget(target: DesignSourceTarget) {
    const key = getDesignTargetKey(target);
    const nextOpenTargetKeys = openTargetKeys.filter((openTargetKey) => openTargetKey !== key);
    const nextOpenTargets = getDesignTargetsFromKeys(designTargets, nextOpenTargetKeys);
    const targetIsActive = isDesignTargetActive(projectTreeSource.source, target);

    if (!targetIsActive) {
      commitDesignSelectionChange(createDesignOpenTargetsSelectionState(latestSelectionRef.current, nextOpenTargetKeys));
      return;
    }

    const nextActiveTarget = nextOpenTargets[0] ?? null;
    const currentSelection = latestSelectionRef.current;
    if (!nextActiveTarget) {
      commitDesignSelectionChange(createDesignEmptySelectionState(currentSelection, nextOpenTargetKeys));
      return;
    }
    commitDesignSelectionChange(createDesignTargetSelectionState(
      nextActiveTarget,
      currentSelection,
      appendOpenDesignTargetKey(nextOpenTargetKeys, getDesignTargetKey(nextActiveTarget)),
    ));
  }

  function reorderDesignTargetTab(
    draggedKey: string,
    targetKey: string,
    position: WorkbenchOpenDesignTargetDropPosition,
  ) {
    const nextOpenTargetKeys = reorderWorkbenchOpenDesignTargetKeys(
      openTargetKeys,
      draggedKey,
      targetKey,
      position,
    );
    const orderChanged = nextOpenTargetKeys.length !== openTargetKeys.length
      || nextOpenTargetKeys.some((key, index) => key !== openTargetKeys[index]);
    if (!orderChanged) return;
    commitDesignSelectionChange(createDesignOpenTargetsSelectionState(
      latestSelectionRef.current,
      nextOpenTargetKeys,
    ));
  }

  closeActiveDesignTargetCommandRef.current = () => {
    if (!activeDesignTarget) {
      setInspectorNotice('No open design tab is available to close.');
      return;
    }
    closeDesignTarget(activeDesignTarget);
  };
  function selectDesignLayer(layerId: string, additive = false) {
    setCssClassEffectivenessSelectionArmed(true);
    commitDesignSelectionChange(createDesignLayerRowSelectionState(
      latestSelectionRef.current,
      previewDocument?.root ?? null,
      resolveDesignSelectableLayerId(previewDocument?.root ?? null, layerId),
      additive,
    ));
  }

  function selectDesignPreviewNode(layerId: string, mode: DesignPreviewSelectionMode, additive: boolean) {
    setCssClassEffectivenessSelectionArmed(true);
    const root = previewDocument?.root ?? null;
    const currentSelection = latestSelectionRef.current;
    const nextSelection = createDesignPreviewNodeSelectionState(
      currentSelection,
      root,
      reconcilePreviewDrillPath(root, getDesignPreviewDrillPathFromSelection(currentSelection)),
      layerId,
      mode,
      additive,
    );
    commitDesignSelectionChange(nextSelection);
  }

  function commitSpecNoteCommentsChange(
    nextComments: WorkbenchCommentRegistry,
    change: SpecNoteHistoryChange = { kind: 'patch', label: 'Update spec notes' },
  ) {
    const historyController = latestSpecNoteHistoryRef.current ?? specNoteHistory;
    if (areWorkbenchCommentRegistriesEqual(historyController.getSnapshot().value, nextComments)) return;
    const transaction = historyController.commit(nextComments, {
      affectedFiles: [activeSpecNoteStoragePath],
      kind: change.kind ?? 'patch',
      label: change.label,
      laneId: specNoteHistoryLaneId,
      mergeKey: change.mergeKey,
      mergeSessionId: change.mergeSessionId,
      owner: specNoteHistoryOwner,
      scope: activeDesignTarget?.kind ?? 'mixed',
    });
    if (!transaction) return;

    persistSpecNoteComments(historyController.getSnapshot().value);
    persistSpecNoteHistory(historyController, transaction);
    recordSpecNoteHistoryAction();
  }

  function getLatestSpecNoteComments(): WorkbenchCommentRegistry {
    return latestSpecNoteHistoryRef.current?.getSnapshot().value ?? activeSpecNoteComments;
  }

  function persistSpecNoteComments(nextComments: WorkbenchCommentRegistry) {
    setActiveSpecNoteSidecar({
      comments: nextComments,
      loadedFromSidecar: Boolean(activeSpecNoteSidecarPath),
      path: activeSpecNoteStoragePath,
    });

    if (!activeSpecNoteSidecarPath) {
      onCommentsChange(nextComments);
      return;
    }

    void writeWorkbenchSourceFile(
      activeSpecNoteSidecarPath,
      `${JSON.stringify(nextComments, null, 2)}\n`,
      { normalize: false, overwrite: true },
    ).then((result) => {
      if (!result.ok) setInspectorNotice(result.message);
    });
  }

  function persistSpecNoteHistory(
    historyController: HistoryController<WorkbenchCommentRegistry>,
    transaction?: WorkbenchEditTransaction<WorkbenchCommentRegistry> | null,
  ) {
    const timeline = transaction
      ? upsertDesignHistoryTimelineEntry(sourceHistoryFileRef.current.timeline, transaction)
      : sourceHistoryFileRef.current.timeline;
    const nextHistoryFile = upsertPersistedHistoryLane(
      sourceHistoryFileRef.current,
      createPersistedHistoryLane(
        specNoteHistoryOwner,
        historyController.getSnapshot(),
        SPEC_NOTE_HISTORY_MAX_ENTRIES,
        { feature: 'spec-notes', path: activeSpecNoteStoragePath },
        // The notes memo rebuilds its controller and rehydrates from this file,
        // so the stacks are still the transport that carries note undo across a
        // rebuild. Folding notes into the page stack is what retires this.
        'persist',
      ),
      timeline,
    );
    sourceHistoryFileRef.current = nextHistoryFile;
    void saveWorkbenchHistory(historyPath, nextHistoryFile).catch((error) => {
      setInspectorNotice(error instanceof Error ? error.message : 'Spec note history save failed.');
    });
  }

  function linkSpecNoteToDesignLayer(noteId: string, layerId: string) {
    const root = previewDocument?.root ?? null;
    const node = root ? findEditableTreeNodeForDesign(root, layerId) : null;
    const target = createWorkbenchSpecNoteTarget(
      node?.source?.sourceFile,
      node?.id,
      node?.label,
      node?.source?.jsxName,
    );
    if (!target) {
      setInspectorNotice('Note could not be linked to this layer.');
      return;
    }

    const currentComments = getLatestSpecNoteComments();
    const model = getWorkbenchSpecNotesModel(currentComments);
    const currentNote = model.notes.find((note) => note.id === noteId) ?? null;
    const currentHighlightBoxes = getWorkbenchSpecNoteTargetHighlightBoxes(currentNote?.target);
    const nextTarget = currentHighlightBoxes.length > 0
      ? setWorkbenchSpecNoteTargetHighlightBoxes(target, currentHighlightBoxes) ?? target
      : target;
    const now = new Date().toISOString();
    const nextModel = {
      ...model,
      notes: model.notes.map((note) => note.id === noteId
        ? {
            ...note,
            target: nextTarget,
            targetStatus: 'linked' as const,
            updatedAt: now,
          }
        : note),
    };
    commitSpecNoteCommentsChange(createWorkbenchCommentRegistryFromSpecNotes(currentComments, nextModel), {
      kind: 'patch',
      label: 'Link spec note',
    });
    selectDesignLayer(layerId);
    setInspectorNotice('Spec note linked to selected layer.');
  }

  function startSpecNoteHighlightBoxDraft(noteId: string) {
    if (activeNoteBoxDraft?.noteId === noteId) {
      setActiveNoteBoxDraft(null);
      setInspectorNotice('Spec note highlight box drawing canceled.');
      return;
    }
    const note = activeSpecNotes.find((candidate) => candidate.id === noteId) ?? null;
    const layerId = note?.target?.kind === 'node' ? note.target.nodeId ?? null : null;
    if (!layerId) {
      setInspectorNotice('Link this note to a layer before adding a highlight box.');
      return;
    }
    setActiveNotePreviewNoteId(noteId);
    setActiveNoteBoxDraft({ layerId, noteId });
    selectDesignLayer(layerId);
    setInspectorNotice('Draw a highlight box inside the linked layer.');
  }

  function cancelSpecNoteHighlightBoxDraft() {
    setActiveNoteBoxDraft(null);
  }

  function addSpecNoteHighlightBox(noteId: string, rect: WorkbenchSpecNoteHighlightBoxRect) {
    const currentComments = getLatestSpecNoteComments();
    const model = getWorkbenchSpecNotesModel(currentComments);
    const note = model.notes.find((candidate) => candidate.id === noteId) ?? null;
    const target = note?.target ?? null;
    if (!note || !target) {
      setInspectorNotice('Highlight box could not be added because the note is not linked.');
      setActiveNoteBoxDraft(null);
      return;
    }
    const existingBoxes = getWorkbenchSpecNoteTargetHighlightBoxes(target);
    const nextBox = createWorkbenchSpecNoteHighlightBox(rect, `Highlight ${existingBoxes.length + 1}`);
    const nextTarget = setWorkbenchSpecNoteTargetHighlightBoxes(target, [
      ...existingBoxes,
      nextBox,
    ]);
    if (!nextTarget) {
      setActiveNoteBoxDraft(null);
      return;
    }
    const now = new Date().toISOString();
    const nextModel = {
      ...model,
      notes: model.notes.map((candidate) => candidate.id === noteId
        ? { ...candidate, target: nextTarget, targetStatus: 'linked' as const, updatedAt: now }
        : candidate),
    };
    commitSpecNoteCommentsChange(createWorkbenchCommentRegistryFromSpecNotes(currentComments, nextModel), {
      kind: 'create',
      label: 'Add spec note highlight box',
    });
    setActiveNotePreviewNoteId(noteId);
    setActiveNoteBoxDraft(null);
    setInspectorNotice('Spec note highlight box added.');
  }

  function renameSpecNoteHighlightBox(noteId: string, boxId: string, label: string) {
    updateSpecNoteHighlightBox(
      noteId,
      boxId,
      { label: label.trim() || 'Untitled highlight' },
      'Spec note highlight renamed.',
      { kind: 'patch', label: 'Rename spec note highlight box', mergeKey: `spec-note-box-label:${noteId}:${boxId}` },
    );
  }

  function updateSpecNoteHighlightBoxBody(noteId: string, boxId: string, bodyHtml: string) {
    updateSpecNoteHighlightBox(
      noteId,
      boxId,
      { bodyHtml },
      'Spec note highlight content updated.',
      { kind: 'patch', label: 'Update spec note highlight content', mergeKey: `spec-note-box-body:${noteId}:${boxId}` },
    );
  }

  function updateSpecNoteHighlightBoxRect(noteId: string, boxId: string, rect: WorkbenchSpecNoteHighlightBoxRect) {
    updateSpecNoteHighlightBox(
      noteId,
      boxId,
      // rect is a complete geometry update: pin resizeMode explicitly (default 'fixed')
      // so a switch to fixed overwrites the previous mode instead of merge-preserving it.
      { ...rect, resizeMode: rect.resizeMode ?? 'fixed' },
      'Spec note highlight box updated.',
      { kind: 'move', label: 'Edit spec note highlight box geometry' },
    );
  }

  function updateSpecNoteHighlightBox(
    noteId: string,
    boxId: string,
    patch: Partial<WorkbenchSpecNoteHighlightBox>,
    notice: string,
    change: SpecNoteHistoryChange = { kind: 'patch', label: 'Update spec note highlight box' },
  ) {
    const currentComments = getLatestSpecNoteComments();
    const model = getWorkbenchSpecNotesModel(currentComments);
    const note = model.notes.find((candidate) => candidate.id === noteId) ?? null;
    if (!note?.target) return;
    const now = new Date().toISOString();
    const boxes = getWorkbenchSpecNoteTargetHighlightBoxes(note.target);
    const nextBoxes = boxes.map((box) => box.id === boxId ? { ...box, ...patch, id: box.id, updatedAt: now } : box);
    const nextTarget = setWorkbenchSpecNoteTargetHighlightBoxes(note.target, nextBoxes);
    const nextModel = {
      ...model,
      notes: model.notes.map((candidate) => candidate.id === noteId
        ? { ...candidate, target: nextTarget, updatedAt: now }
        : candidate),
    };
    commitSpecNoteCommentsChange(createWorkbenchCommentRegistryFromSpecNotes(currentComments, nextModel), change);
    setActiveNotePreviewNoteId(noteId);
    setActiveNotePreviewBoxId(boxId);
    setInspectorNotice(notice);
  }

  function deleteSpecNoteHighlightBox(noteId: string, boxId: string) {
    const currentComments = getLatestSpecNoteComments();
    const model = getWorkbenchSpecNotesModel(currentComments);
    const note = model.notes.find((candidate) => candidate.id === noteId) ?? null;
    if (!note?.target) return;
    const now = new Date().toISOString();
    const nextTarget = setWorkbenchSpecNoteTargetHighlightBoxes(
      note.target,
      getWorkbenchSpecNoteTargetHighlightBoxes(note.target).filter((box) => box.id !== boxId),
    );
    const nextModel = {
      ...model,
      notes: model.notes.map((candidate) => candidate.id === noteId
        ? { ...candidate, target: nextTarget, updatedAt: now }
        : candidate),
    };
    commitSpecNoteCommentsChange(createWorkbenchCommentRegistryFromSpecNotes(currentComments, nextModel), {
      kind: 'delete',
      label: 'Delete spec note highlight box',
    });
    setActiveNotePreviewNoteId(noteId);
    setActiveNotePreviewBoxId((current) => current === boxId ? null : current);
    setActiveNoteBoxDraft(null);
    setInspectorNotice('Spec note highlight box deleted.');
  }

  function clearSpecNoteHighlightBoxes(noteId: string) {
    const currentComments = getLatestSpecNoteComments();
    const model = getWorkbenchSpecNotesModel(currentComments);
    const note = model.notes.find((candidate) => candidate.id === noteId) ?? null;
    if (!note?.target) return;
    const nextTarget = setWorkbenchSpecNoteTargetHighlightBoxes(note.target, []);
    const now = new Date().toISOString();
    const nextModel = {
      ...model,
      notes: model.notes.map((candidate) => candidate.id === noteId
        ? { ...candidate, target: nextTarget, updatedAt: now }
        : candidate),
    };
    commitSpecNoteCommentsChange(createWorkbenchCommentRegistryFromSpecNotes(currentComments, nextModel), {
      kind: 'delete',
      label: 'Clear spec note highlight boxes',
    });
    setActiveNotePreviewNoteId(noteId);
    setActiveNoteBoxDraft(null);
    setInspectorNotice('Spec note highlight boxes cleared.');
  }

  function moveDesignPreviewNode(layerId: string, intent: SourceKeyboardMoveIntent) {
    const root = previewDocument?.root ?? null;
    if (!root) return;
    const targetLayer = previewLayers.find((candidate) => candidate.id === layerId) ?? null;
    const targetNode = findEditableTreeNodeForDesign(root, layerId);
    const moveTarget = resolveSourceKeyboardMoveTarget({
      documentRoot: root,
      intent,
      nodeId: layerId,
    });
    if (!targetLayer || !targetNode || !moveTarget) return;
    void updateSourceInspectorMoveNode(
      targetLayer,
      targetNode,
      moveTarget.targetParentNode,
      moveTarget.targetIndex,
    );
  }

  function moveSelectedDesignLayerFromKeyboard(intent: SourceKeyboardMoveIntent): boolean {
    if (!activeDesignTarget || !selectedLayerId) return false;
    if (!hasSelectedSourceStructureEditTarget || !selectedLayer || !selectedSourceNode) {
      setInspectorNotice('Select an editable source-backed layer before moving it with the keyboard.');
      return true;
    }
    if (!canDragSourceLayer(selectedLayer)) {
      setInspectorNotice('Selected source layer cannot be moved from this position.');
      return true;
    }

    const root = previewDocument?.root ?? null;
    if (!root) return false;
    const moveTarget = resolveSourceKeyboardMoveTarget({
      documentRoot: root,
      intent,
      nodeId: selectedSourceNode.id,
    });
    if (!moveTarget) {
      setInspectorNotice('Source node is already at this layer position.');
      return true;
    }

    void updateSourceInspectorMoveNode(
      selectedLayer,
      selectedSourceNode,
      moveTarget.targetParentNode,
      moveTarget.targetIndex,
    );
    return true;
  }

  function moveDesignPreviewNodeToParent(layerId: string, targetParentLayerId: string, targetIndex: number) {
    const root = previewDocument?.root ?? null;
    if (!root) return;
    const targetLayer = previewLayers.find((candidate) => candidate.id === layerId) ?? null;
    const targetNode = findEditableTreeNodeForDesign(root, layerId);
    const targetParentNode = findEditableTreeNodeForDesign(root, targetParentLayerId);
    recordWorkbenchDragProbe('move', {
      layerId,
      targetParentLayerId,
      targetIndex,
      committedNodeId: targetNode?.id ?? null,
      committedNodeLabel: targetNode?.label ?? null,
      resolved: Boolean(targetLayer && targetNode && targetParentNode),
    });
    if (!targetLayer || !targetNode || !targetParentNode) return;
    return updateSourceInspectorMoveNode(targetLayer, targetNode, targetParentNode, targetIndex);
  }

  function updateDesignPreviewNodeStyleDeclarations(
    layerId: string,
    patches: DesignPreviewStyleDeclarationPatch[],
    label: string,
  ) {
    const root = previewDocument?.root ?? null;
    if (!root || patches.length === 0) return;
    const targetLayer = previewLayers.find((candidate) => candidate.id === layerId) ?? null;
    const targetNode = findEditableTreeNodeForDesign(root, layerId);
    if (!targetLayer || !targetNode) return;
    void updateSourceInspectorStyleDeclarations(targetLayer, targetNode, patches, label);
  }

  function drillIntoDesignPreviewNode(layerId: string, origin?: SourceTreePreviewDrillOrigin) {
    const root = previewDocument?.root ?? null;
    const currentSelection = latestSelectionRef.current;
    const resolution = resolvePreviewNodeDrillIn({
      clickedNodeId: layerId,
      drillPath: reconcilePreviewDrillPath(
        root,
        origin?.previewDrillPath ?? getDesignPreviewDrillPathFromSelection(currentSelection),
      ),
      root,
      selectedNodeId: origin?.selectedLayerId ?? getDesignLayerIdFromSelection(currentSelection),
    });
    if (!resolution.drillTargetNodeId) return;
    commitDesignSelectionChange(createDesignPreviewDrillPathSelectionState(
      currentSelection,
      root,
      resolution.drillPath,
      resolution.selectedNodeId,
    ));
  }

  function clearDesignLayerSelection() {
    const currentSelection = latestSelectionRef.current;
    commitDesignSelectionChange(createDesignPreviewDrillPathSelectionState(createDesignLayerSelectionState(currentSelection, null), previewDocument?.root ?? null, [], null));
  }

  function toggleDesignLayerCollapsed(layerId: string) {
    commitDesignSelectionChange(createDesignLayerCollapseSelectionState(latestSelectionRef.current, layerId));
  }

  function toggleDesignLayerSectionCollapsed() {
    commitDesignSelectionChange(createDesignLayerSectionCollapseSelectionState(latestSelectionRef.current));
  }

  function toggleDesignSourceGroupCollapsed(groupId: DesignSourceGroupId) {
    commitDesignSelectionChange(createDesignSourceGroupCollapseSelectionState(latestSelectionRef.current, groupId));
  }

  function toggleDesignPageFolderCollapsed(folderPath: string) {
    commitDesignSelectionChange(createDesignPageFolderCollapseSelectionState(latestSelectionRef.current, folderPath));
  }

  function toggleDesignSourceSectionCollapsed() {
    commitDesignSelectionChange(createDesignSourceSectionCollapseSelectionState(latestSelectionRef.current));
  }

  function updateDesignPreviewViewport(viewport: DesignPreviewViewport) {
    commitDesignSelectionChange(createDesignPreviewViewportSelectionState(
      latestSelectionRef.current,
      viewport,
    ));
  }

  function updateDesignPreviewAppearance(appearance: DesignPreviewAppearance) {
    const currentSelection = latestSelectionRef.current;
    const nextSelection = createDesignPreviewAppearanceSelectionState(
      currentSelection,
      appearance,
    );
    const syncedSelection = appearance === 'system'
      ? nextSelection
      : createDesignPreviewTokenModesSelectionState(
        nextSelection,
        getPreviewTokenModesForAppearance(
          tokenRegistry,
          currentSelection.extensions.previewTokenModes ?? {},
          appearance,
        ),
      );
    commitDesignSelectionChange(syncedSelection);
  }

  function updateInspectorTokenPickerFilter(field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) {
    commitDesignSelectionChange(createDesignInspectorTokenPickerFilterSelectionState(latestSelectionRef.current, field, filter));
  }

  function updateDesignInspectorBinding(field: InspectorTokenBindingField, reference: TokenReference | null) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorBinding(field, reference);
      return;
    }
    void updateSourceInspectorBinding(field, reference);
  }

  function updateDesignInspectorAttribute(attributeName: SourceAttributeName, value: string | null) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorAttribute(attributeName, value);
      return;
    }
    void updateSourceInspectorAttribute(attributeName, value);
  }

  function updateDesignInspectorComponentProp(propName: string, value: SourceComponentPropValue, options?: SourceComponentPropChangeOptions) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorComponentProp(propName, value);
      return;
    }
    void updateSourceInspectorComponentProp(propName, value, undefined, options);
  }

  function updateDesignInspectorComponentProps(updates: SourceComponentPropUpdate[]) {
    if (hasRuntimeDesignEditTarget) {
      for (const update of updates) updateRuntimeInspectorComponentProp(update.propName, update.value);
      return;
    }
    void updateSourceInspectorComponentProps(updates);
  }

  function updateDesignInspectorComponentType(targetComponentName: string, options: SourceComponentTypeChangeOptions) {
    if (hasRuntimeDesignEditTarget) {
      setInspectorNotice('Runtime preview component types are not edited through the source Inspector yet.');
      return;
    }
    void updateSourceInspectorComponentType(targetComponentName, options);
  }

  function updateDesignInspectorNodeComponentProp(node: EditableTreeNode, propName: string, value: SourceComponentPropValue) {
    if (hasRuntimeDesignEditTarget) {
      setInspectorNotice('Repeater item props are only written to source-backed components for now.');
      return;
    }
    if (!hasSelectedSourceFieldEditTarget || node.id !== selectedSourceNode?.id) {
      setInspectorNotice('Select an editable source-backed component before changing preview props.');
      return;
    }
    void updateSourceInspectorComponentProp(propName, value, node);
  }

  function updateDesignInspectorReferencedArrayProp(node: EditableTreeNode, propName: string, value: EditableTreeSourcePropArray) {
    if (hasRuntimeDesignEditTarget) {
      setInspectorNotice('Connected arrays are only written to source-backed components for now.');
      return;
    }
    void updateSourceInspectorReferencedArrayProp(node, propName, value);
  }

  function updateDesignInspectorExtractSelectionToMap() {
    if (hasRuntimeDesignEditTarget) {
      setInspectorNotice('Source maps are only created from source-backed layers for now.');
      return;
    }
    void updateSourceInspectorExtractSelectionToMap();
  }

  function updateDesignInspectorNodeStyleDeclaration(node: EditableTreeNode, property: SourceStyleProperty, value: string | null) {
    if (hasRuntimeDesignEditTarget) {
      setInspectorNotice('Parent layout styles are only written to source-backed nodes for now.');
      return;
    }
    void updateSourceInspectorStyleDeclaration(property, value, node);
  }

  function updateDesignInspectorStyleDeclaration(property: SourceStyleProperty, value: string | null) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorStyleDeclaration(property, value);
      return;
    }
    const mediaFramePatches = getMediaFrameAspectPreservingStylePatches(selectedSourceNodeForInspector, property, value);
    if (mediaFramePatches.length > 1 && selectedLayer && selectedSourceNodeForInspector) {
      void updateSourceInspectorStyleDeclarations(
        selectedLayer,
        selectedSourceNodeForInspector,
        mediaFramePatches,
        'Set MediaFrame responsive width',
      );
      return;
    }
    void updateSourceInspectorStyleDeclaration(property, value);
  }

  function updateDesignInspectorTextContent(text: string) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorTextContent(text);
      return;
    }
    void updateSourceInspectorTextContent(text);
  }

  function updateDesignInspectorElementTagName(tagName: SourceElementTagName) {
    if (hasRuntimeDesignEditTarget) {
      updateRuntimeInspectorElementTagName(tagName);
      return;
    }
    void updateSourceInspectorElementTagName(tagName);
  }

  function updateRuntimeInspectorAttribute(attributeName: SourceAttributeName, value: string | null) {
    const normalizedValue = value === null
      ? null
      : normalizeEditableSourceAttributeValue(attributeName, value, { allowEmpty: false });
    if (value !== null && value.trim() && normalizedValue === null) {
      setInspectorNotice(`${attributeName} was not updated because the value is not safe for preview attributes.`);
      return;
    }

    updateRuntimeProjectionSelectedNode(`${attributeName} runtime attribute`, (node) => {
      const sourceAttributes = { ...(node.sourceAttributes ?? {}) };
      if (normalizedValue) {
        sourceAttributes[attributeName] = normalizedValue;
      } else {
        delete sourceAttributes[attributeName];
      }
      return {
        ...node,
        sourceAttributes: Object.keys(sourceAttributes).length > 0 ? sourceAttributes : undefined,
      };
    });
    setInspectorNotice(`${attributeName} updated in the Codex handoff draft.`);
  }

  function updateRuntimeInspectorComponentProp(propName: string, value: SourceComponentPropValue) {
    updateRuntimeProjectionSelectedNode(`${propName} runtime component prop`, (node) => {
      const sourceProps = { ...(node.sourceProps ?? {}) };
      if (value === null || value === '') {
        delete sourceProps[propName];
      } else {
        sourceProps[propName] = value;
      }
      return {
        ...node,
        sourceProps: Object.keys(sourceProps).length > 0 ? sourceProps : undefined,
      };
    });
    setInspectorNotice(`${propName} updated in the Codex handoff draft.`);
  }

  function updateRuntimeInspectorStyleDeclaration(property: SourceStyleProperty, value: string | null) {
    const normalizedValue = normalizeSourceStyleDeclarationValue(property, value);
    updateRuntimeProjectionSelectedNode(`${property} runtime style`, (node) => {
      const sourceStyleDeclarations = { ...(node.sourceStyleDeclarations ?? {}) };
      if (normalizedValue) {
        sourceStyleDeclarations[property] = normalizedValue;
      } else {
        delete sourceStyleDeclarations[property];
      }
      return {
        ...node,
        sourceStyleDeclarations: Object.keys(sourceStyleDeclarations).length > 0 ? sourceStyleDeclarations : undefined,
      };
    });
    setInspectorNotice(`${property} updated in the Codex handoff draft.`);
  }

  function updateRuntimeInspectorBinding(field: InspectorTokenBindingField, reference: TokenReference | null) {
    const token = reference ? findInspectorTokenBindingReference(tokenRegistry, field, reference, previewTokenModes) : null;
    if (reference && !token?.compatible) {
      setInspectorNotice(`${formatInspectorBindingField(field)} requires a compatible project token.`);
      return;
    }

    updateRuntimeProjectionSelectedNode(`${formatInspectorBindingField(field)} runtime token`, (node) => {
      const tokenBindings: EditableTreeTokenBindings = { ...(node.tokenBindings ?? {}) };
      const tokenBindingReferences: EditableTreeTokenBindingReferences = { ...(node.tokenBindingReferences ?? {}) };
      const sourceStyleDeclarations = { ...(node.sourceStyleDeclarations ?? {}) };
      const styleProperty = getRuntimeTokenBindingStyleProperty(field);

      if (reference) {
        tokenBindings[field] = reference.tokenId;
        tokenBindingReferences[field] = reference;
        const cssValue = token && token.resolved !== null
          ? getTokenPreviewCss(token, tokenRegistry) ?? token.previewText
          : null;
        if (cssValue) sourceStyleDeclarations[styleProperty] = cssValue;
      } else {
        delete tokenBindings[field];
        delete tokenBindingReferences[field];
        delete sourceStyleDeclarations[styleProperty];
      }

      return {
        ...node,
        sourceStyleDeclarations: Object.keys(sourceStyleDeclarations).length > 0 ? sourceStyleDeclarations : undefined,
        tokenBindingReferences: Object.keys(tokenBindingReferences).length > 0 ? tokenBindingReferences : undefined,
        tokenBindings: Object.keys(tokenBindings).length > 0 ? tokenBindings : undefined,
      };
    });
    setInspectorNotice(reference
      ? `${formatInspectorBindingField(field)} token updated in the Codex handoff draft.`
      : `${formatInspectorBindingField(field)} token cleared in the Codex handoff draft.`);
  }

  function updateRuntimeInspectorTextContent(text: string) {
    updateRuntimeProjectionSelectedNode('runtime text content', (node) => ({
      ...node,
      label: text.trim() || node.label,
    }));
    setInspectorNotice('Text updated in the Codex handoff draft.');
  }

  function updateRuntimeInspectorElementTagName(tagName: SourceElementTagName) {
    updateRuntimeProjectionSelectedNode('runtime element intent', (node) => ({
      ...node,
      label: tagName,
      source: {
        ...node.source,
        jsxName: tagName,
      },
    }));
    setInspectorNotice(`Element intent changed to ${tagName.toUpperCase()} in the Codex handoff draft.`);
  }

  function updateRuntimeProjectionSelectedNode(label: string, updateNode: (node: EditableTreeNode) => EditableTreeNode) {
    const selectedNodeId = selectedSourceNode?.id ?? selectedLayer?.id ?? null;
    if (!activeRuntimeProjectionKey || !selectedNodeId) {
      setInspectorNotice('No runtime design node is selected.');
      return;
    }

    const current = runtimeProjectionRef.current;
    if (!current || current.key !== activeRuntimeProjectionKey) return;

    const beforeTree = current.tree;
    const afterTree: EditableDocumentTree = {
      ...beforeTree,
      root: updateEditableTreeNode(beforeTree.root, selectedNodeId, updateNode),
    };
    if (areEditableDocumentTreesEqual(beforeTree, afterTree)) return;

    runtimeDesignUndoStackRef.current = [
      ...runtimeDesignUndoStackRef.current.slice(-(RUNTIME_DESIGN_HISTORY_MAX_ENTRIES - 1)),
      {
        after: cloneEditableDocumentTree(afterTree),
        before: cloneEditableDocumentTree(beforeTree),
        label,
        projectionKey: current.key,
      },
    ];
    runtimeDesignRedoStackRef.current = [];
    recordRuntimeDesignHistoryAction();

    const nextProjection = {
      ...current,
      tree: afterTree,
    };
    runtimeProjectionRef.current = nextProjection;
    setRuntimeProjection(nextProjection);
  }

  function startRenamingDesignTarget(target: DesignSourceTarget, source: 'tab' | 'tree' = 'tab') {
    setEditingTargetKey(getDesignTargetKey(target));
    setEditingTargetSource(source);
    setTargetNameDraft(target.label);
  }

  function cancelRenamingDesignTarget() {
    setEditingTargetKey(null);
    setEditingTargetSource(null);
    setTargetNameDraft('');
  }

  function startRenamingDesignFolder(folderPath: string) {
    cancelRenamingDesignTarget();
    setEditingFolderPath(folderPath);
    setFolderNameDraft(folderPath.includes('/') ? folderPath.slice(folderPath.lastIndexOf('/') + 1) : folderPath);
  }

  function cancelRenamingDesignFolder() {
    setEditingFolderPath(null);
    setFolderNameDraft('');
  }

  async function commitDesignTargetName(target: DesignSourceTarget) {
    const draftName = targetNameDraft;
    cancelRenamingDesignTarget();

    if (draftName.trim() === target.label) return;

    if (target.kind === 'page') {
      const result = renameWorkbenchPage(pages, target.id, draftName);
      if (!result.ok) {
        setInspectorNotice(result.message);
        return;
      }

      // Try to keep the source file's PascalCase name aligned with the page name.
      // If the new name yields a meaningful, unique filename, we read → write to the
      // new path → delete the old file and update the registry entry's sourceFile.
      const previousPage = pages.pages.find((candidate) => candidate.id === target.id);
      let nextRegistry = result.nextRegistry;
      let renamedFile: { from: string; to: string } | null = null;
      if (previousPage) {
        const reservedSourceFiles = new Set(
          pages.pages.filter((candidate) => candidate.id !== target.id).map((candidate) => candidate.sourceFile),
        );
        const nextSourceFile = deriveDesignPageSourceFile(result.nextName, previousPage.sourceFile, reservedSourceFiles);
        if (nextSourceFile) {
          const readResult = await readWorkbenchSourceFile(previousPage.sourceFile);
          if (readResult.ok) {
            const nextContents = renameWorkbenchDesignPageSource(readResult.contents, result.nextName);
            const writeResult = await writeWorkbenchSourceFile(nextSourceFile, nextContents, { overwrite: false });
            if (writeResult.ok) {
              await deleteWorkbenchSourceFile(previousPage.sourceFile);
              clearSourceTreeResultCacheForFile(previousPage.sourceFile);
              await moveWorkbenchSpecNoteSidecar(previousPage.sourceFile, nextSourceFile);
              nextRegistry = {
                ...nextRegistry,
                pages: nextRegistry.pages.map((candidate) => (
                  candidate.id === target.id ? { ...candidate, sourceFile: nextSourceFile } : candidate
                )),
              };
              renamedFile = { from: previousPage.sourceFile, to: nextSourceFile };
            }
          }
        }
      }

      setPages(nextRegistry);
      try {
        await saveWorkbenchPages(pagePath, nextRegistry);
        setInspectorNotice(renamedFile
          ? `Renamed ${result.previousName} to ${result.nextName} (file: ${renamedFile.to}).`
          : `Renamed ${result.previousName} to ${result.nextName}.`);
      } catch (error) {
        setPages(pages);
        setInspectorNotice(error instanceof Error ? error.message : 'Page rename failed.');
      }
      return;
    }

    const result = renameWorkbenchComponent(components, target.id, draftName);
    if (!result.ok) {
      setInspectorNotice(result.message);
      return;
    }
    setComponents(result.nextRegistry);
    try {
      await saveWorkbenchComponents(componentPath, result.nextRegistry);
      setInspectorNotice(`Renamed ${result.previousName} to ${result.nextName}.`);
    } catch (error) {
      setComponents(components);
      setInspectorNotice(error instanceof Error ? error.message : 'Component rename failed.');
    }
  }

  function refreshSourceHistoryView() {
    if (!mountedRef.current) return;
    setSourceHistoryRenderVersion((version) => version + 1);
  }

  // Nothing rebuilds a controller here any more: the lane's own controller
  // already holds this value, because `commit` put it there, and it keeps its
  // stack. What is left is tracking which subject the Inspector should fall
  // back to — and the lane lookup still gates it, so a write that did not
  // actually persist does not move that fallback.
  function trackSourceHistorySubjectAfterPersist(
    subject: ProjectAssetHistorySubject,
    contents: string,
    historyFile = sourceHistoryFileRef.current,
  ) {
    const persistedLane = getHydratableHistoryLane(
      historyFile,
      getProjectAssetHistoryLaneId(subject),
      contents,
      areSourceContentsEqual,
    );
    if (!persistedLane) return;

    latestSourceSubjectRef.current = subject;
  }

  async function discardSourceHistoryLane(subject: ProjectAssetHistorySubject) {
    const laneId = getProjectAssetHistoryLaneId(subject);
    const nextHistoryFile: WorkbenchHistoryFile = {
      ...sourceHistoryFileRef.current,
      updatedAt: new Date().toISOString(),
      lanes: sourceHistoryFileRef.current.lanes.filter((lane) => lane.laneId !== laneId),
      timeline: sourceHistoryFileRef.current.timeline.filter((entry) => entry.laneId !== laneId),
    };

    sourceHistoryFileRef.current = nextHistoryFile;
    sourceHistoryStoreRef.current.discard(laneId);
    refreshSourceHistoryView();

    try {
      await saveWorkbenchHistory(historyPath, nextHistoryFile);
    } catch (error) {
      setInspectorNotice(error instanceof Error ? error.message : 'Source history save failed.');
    }
  }

  async function refreshSourceTreeFromContents(sourceFile: string, contents: string): Promise<EditableDocumentTree | null> {
    const refreshVersion = sourceTreeOptimisticVersionRef.current;
    const result = await createSourceTreeResultFromContents(sourceFile, contents);
    if (!mountedRef.current) return result.tree;
    setSourceTreeResult((current) => {
      if (sourceTreeOptimisticVersionRef.current !== refreshVersion) return current;
      if (!current || current.cacheKey !== result.cacheKey) return current;
      return result;
    });
    return result.tree;
  }

  async function refreshSourceTreeAfterInspectorResult(
    result: {
      ok: boolean;
      changed: boolean;
      historyFile: WorkbenchHistoryFile;
      nextContents: string;
      transaction?: WorkbenchEditTransaction<string> | null;
    },
    sourceFile: string,
    options: { optimisticVersion?: number } = {},
  ): Promise<EditableDocumentTree | null> {
    sourceHistoryFileRef.current = result.historyFile;
    const subject = resolveProjectAssetSubjectForSourceFile(pages, components, sourceFile);
    if (subject) trackSourceHistorySubjectAfterPersist(subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);

    if (!result.changed && !result.ok) return null;
    if (
      options.optimisticVersion !== undefined &&
      sourceTreeOptimisticVersionRef.current !== options.optimisticVersion
    ) {
      if (result.changed) refreshSourceHistoryView();
      return sourceTreeResultRef.current?.tree ?? null;
    }

    const refreshedTree = await refreshSourceTreeFromContents(sourceFile, result.nextContents);
    if (result.changed) refreshSourceHistoryView();
    return refreshedTree;
  }

  function optimisticallyUpdateSourceTreeComponentProps(
    sourceFile: string,
    nodeIds: readonly string[],
    updates: SourceComponentPropUpdate[],
    nextContents?: string,
  ): number {
    if (updates.length === 0 || nodeIds.length === 0) return sourceTreeOptimisticVersionRef.current;
    sourceTreeOptimisticVersionRef.current += 1;
    const optimisticVersion = sourceTreeOptimisticVersionRef.current;
    setSourceTreeResult((current) => {
      if (!current || current.sourceFile !== sourceFile || !current.tree) return current;
      let updatedNode = false;
      // A batch edit commits every selected node, so the optimistic projection has to
      // cover the same set. Updating only the active node made the rest of the selection
      // sit at their old values until the much slower source refresh landed.
      let nextRoot = current.tree.root;
      for (const nodeId of nodeIds) {
        nextRoot = updateEditableTreeNode(nextRoot, nodeId, (node) => {
          updatedNode = true;
          const sourceProps = { ...(node.sourceProps ?? {}) };
          for (const update of updates) {
            if (update.value === null) {
              delete sourceProps[update.propName];
            } else {
              sourceProps[update.propName] = update.value;
            }
          }
          return {
            ...node,
            sourceProps: Object.keys(sourceProps).length > 0 ? sourceProps : undefined,
          };
        });
      }
      if (!updatedNode) {
        return {
          ...current,
          ...(nextContents === undefined ? {} : { contents: nextContents }),
        };
      }
      return {
        ...current,
        ...(nextContents === undefined ? {} : { contents: nextContents }),
        tree: {
          ...current.tree,
          root: nextRoot,
        },
      };
    });
    return optimisticVersion;
  }

  function optimisticallyRemoveSourceTreeNodes(
    sourceFile: string,
    nodeIds: string[],
    nextContents?: string,
  ): EditableDocumentTree | null {
    if (nodeIds.length === 0) return null;
    const nodeIdSet = new Set(nodeIds);
    let optimisticTree: EditableDocumentTree | null = null;
    sourceTreeOptimisticVersionRef.current += 1;
    setSourceTreeResult((current) => {
      if (!current || current.sourceFile !== sourceFile || !current.tree || nodeIdSet.has(current.tree.root.id)) {
        return current;
      }
      const nextRoot = removeEditableTreeNodes(current.tree.root, nodeIdSet);
      if (!nextRoot || nextRoot === current.tree.root) {
        return {
          ...current,
          ...(nextContents === undefined ? {} : { contents: nextContents }),
        };
      }
      optimisticTree = {
        ...current.tree,
        root: nextRoot,
      };
      return {
        ...current,
        ...(nextContents === undefined ? {} : { contents: nextContents }),
        tree: optimisticTree,
      };
    });
    return optimisticTree;
  }

  async function commitSourceInspectorBatchEdit({
    apply,
    describeChanges,
    label,
    unchangedNotice,
  }: {
    apply: (node: EditableTreeNode, contents: string) => Promise<{
      ok: true;
      changed: boolean;
      diagnostic: string;
      nextContents: string;
    } | {
      ok: false;
      diagnostic: string;
      nextContents: string;
    }>;
    // Called with each node that actually changed, so the "before" value is read
    // off the node the writeback patched rather than a stale render closure.
    describeChanges?: (node: EditableTreeNode) => WorkbenchEditChangeSummary[];
    label: string;
    unchangedNotice: string;
  }): Promise<boolean> {
    // This runs inside the serial edit queue, whose preflight can re-read the file from disk
    // and rebuild the source tree. The render-time `batchEditableSourceNodes` memo is therefore
    // routinely stale by the time the edit executes: node ids and source locations no longer
    // match the contents about to be patched, `resolveDesignBatchEditableSourceNodes` drops the
    // whole set, and the caller silently falls back to writing only the active layer. Resolve
    // the batch from the latest selection and the latest committed contents instead.
    const currentContext = getLatestSourceInspectorContext();
    const currentSelectedLayerIds = getDesignLayerIdsFromSelection(currentContext.selection);
    if (currentSelectedLayerIds.length <= 1) return false;
    if (!selectedLayer) {
      setInspectorNotice('No source-backed layer is selected.');
      return true;
    }
    const currentSubject = currentContext.subject ?? sourceEditSubject;
    if (!currentSubject) {
      setInspectorNotice('Selected layers have no source history lane yet.');
      return true;
    }
    const historyController = currentContext.subject?.sourceFile === currentSubject.sourceFile
      ? currentContext.history
      : sourceEditHistory;
    if (!historyController) {
      setInspectorNotice('Selected layers have no source history lane yet.');
      return true;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layers do not have an editable source field path.');
      return true;
    }

    let nextContents = historyController.getSnapshot().value;
    const currentTreeResult = await createSourceTreeResultFromContents(currentSubject.sourceFile, nextContents);
    const currentRoot = currentTreeResult.contents === nextContents
      ? currentTreeResult.tree?.root ?? null
      : null;
    const currentBatchNodes = resolveDesignBatchEditableSourceNodes({
      root: currentRoot,
      selectedLayerIds: currentSelectedLayerIds,
      sourceFile: currentSubject.sourceFile,
    });
    if (currentBatchNodes.length <= 1) return false;

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, currentSubject, currentContext.selection);
    let changedCount = 0;
    const changesPerNode: WorkbenchEditChangeSummary[][] = [];

    for (const node of sortEditableNodesByDescendingSourceLocation(currentBatchNodes)) {
      const result = await apply(node, nextContents);
      if (!result.ok) {
        setInspectorNotice(result.diagnostic);
        return true;
      }
      if (result.changed) {
        changedCount += 1;
        nextContents = result.nextContents;
        if (describeChanges) changesPerNode.push(describeChanges(node));
      }
    }

    if (changedCount === 0 || areSourceContentsEqual(historyController.getSnapshot().value, nextContents)) {
      setInspectorNotice(unchangedNotice);
      return true;
    }

    const transaction = historyController.commit(nextContents, {
      affectedFiles: [currentSubject.sourceFile],
      kind: 'patch',
      label,
      laneId: getProjectAssetHistoryLaneId(currentSubject),
      owner: createProjectAssetEditOwner(currentSubject),
      scope: currentSubject.kind,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      changes: collapseBatchChangeSummaries(changesPerNode),
    });

    if (!transaction) {
      setInspectorNotice(unchangedNotice);
      return true;
    }

    const persisted = await persistCurrentSourceHistory(historyController, currentSubject, transaction);
    if (!persisted) return true;
    recordDesignSourceHistoryTransaction(transaction);
    await refreshSourceTreeFromContents(currentSubject.sourceFile, nextContents);
    setInspectorNotice(`${label} applied to ${changedCount} layers.`);
    return true;
  }

  async function commitSourceInspectorSingleWriteback({
    apply,
    describeChanges,
    label,
    targetLayer,
    targetNode,
    unchangedNotice,
  }: {
    apply: (contents: string, subject: ProjectAssetHistorySubject, node: EditableTreeNode) => Promise<{
      ok: true;
      changed: boolean;
      diagnostic: string;
      nextContents: string;
    } | {
      ok: false;
      diagnostic: string;
      nextContents: string;
    }>;
    // Receives the re-resolved node below, not the caller's closure copy.
    describeChanges?: (node: EditableTreeNode) => WorkbenchEditChangeSummary[];
    label: string;
    targetLayer: PreviewLayer;
    targetNode: EditableTreeNode;
    unchangedNotice: string;
  }): Promise<void> {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source field path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const snapshot = currentContext.history.getSnapshot();
    // `targetNode` comes from the render closure, but the serial edit queue preflight can
    // re-read the file and rebuild the tree before this runs. When that happens the node's
    // source location no longer describes the contents we are about to patch, and writeback
    // falls back to matching by structural path -- which resolves to a *different* element if
    // the structure also changed, writing to the wrong place without reporting anything.
    // Re-resolve the node against the contents being patched, but only when the tree actually
    // drifted, so ordinary prop edits pay no extra parse.
    let effectiveTargetNode = targetNode;
    const latestSourceTree = sourceTreeResultRef.current;
    if (
      !latestSourceTree ||
      latestSourceTree.sourceFile !== currentContext.subject.sourceFile ||
      latestSourceTree.contents !== snapshot.value
    ) {
      const currentTreeResult = await createSourceTreeResultFromContents(
        currentContext.subject.sourceFile,
        snapshot.value,
      );
      const currentRoot = currentTreeResult.contents === snapshot.value
        ? currentTreeResult.tree?.root ?? null
        : null;
      effectiveTargetNode = (currentRoot ? findEditableTreeNodeForDesign(currentRoot, targetNode.id) : null) ?? targetNode;
    }
    const result = await apply(snapshot.value, currentContext.subject, effectiveTargetNode);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    if (!result.changed || areSourceContentsEqual(snapshot.value, result.nextContents)) {
      setInspectorNotice(unchangedNotice);
      return;
    }

    const transaction = currentContext.history.commit(result.nextContents, {
      affectedFiles: [currentContext.subject.sourceFile],
      kind: 'patch',
      label,
      laneId: getProjectAssetHistoryLaneId(currentContext.subject),
      owner: createProjectAssetEditOwner(currentContext.subject),
      scope: currentContext.subject.kind,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      changes: describeChanges?.(effectiveTargetNode),
    });

    if (!transaction) {
      setInspectorNotice(unchangedNotice);
      return;
    }

    const persisted = await persistCurrentSourceHistory(currentContext.history, currentContext.subject, transaction);
    if (!persisted) return;
    recordDesignSourceHistoryTransaction(transaction);
    const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
    restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, targetNode.id);
    setInspectorNotice(`${label} updated.`);
  }

  async function updateSourceInspectorBinding(field: InspectorTokenBindingField, reference: TokenReference | null) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorBinding(field, reference);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorBinding(field: InspectorTokenBindingField, reference: TokenReference | null) {
    const selectedToken = reference
      ? findInspectorTokenBindingReference(tokenRegistry, field, reference, selectedSourcePreviewTokenModes)
      : null;
    if (reference && !selectedToken?.compatible) {
      setInspectorNotice(`${formatInspectorBindingField(field)} requires a compatible project token.`);
      return;
    }
    const tokenStyleValue = reference ? selectedToken?.cssVariable ?? null : null;
    if (await commitSourceInspectorBatchEdit({
      label: reference
        ? `Set ${formatInspectorBindingField(field)} source token`
        : `Clear ${formatInspectorBindingField(field)} source token`,
      unchangedNotice: reference
        ? `${formatInspectorBindingField(field)} already uses this token on selected layers.`
        : `${formatInspectorBindingField(field)} already has no source binding on selected layers.`,
      apply: (node, contents) => applySourceTokenBindingWriteback({
        contents,
        field,
        node,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        token: reference,
        tokenStyleValue,
      }),
      // `tokenBindings` holds resolved names; the comparable pair is the reference.
      describeChanges: (node) => [
        createHistoryChangeSummary(
          field,
          formatTokenReferenceForHistorySummary(node.tokenBindingReferences?.[field]),
          formatTokenReferenceForHistorySummary(reference),
        ),
      ],
    })) return;

    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (selectionScope.saveTarget.kind !== 'source') {
      setInspectorNotice('Selected layer cannot be saved as a source edit.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorTokenBinding({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      field,
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      timeline: sourceHistoryFileRef.current.timeline,
      token: reference,
      tokenStyleValue,
      trigger: 'auto',
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? reference
        ? `${formatInspectorBindingField(field)} source binding updated.`
        : `${formatInspectorBindingField(field)} source binding cleared.`
      : reference
        ? `${formatInspectorBindingField(field)} already uses this token.`
        : `${formatInspectorBindingField(field)} already has no source binding.`);
  }

  async function updateSourceInspectorAttribute(attributeName: SourceAttributeName, value: string | null) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorAttribute(attributeName, value);
    }).catch(reportSourceInspectorEditError);
  }

  async function updateSourceInspectorInlineSvgIcon(source: string, iconName: string | null) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorInlineSvgIcon(source, iconName);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorInlineSvgIcon(source: string, iconName: string | null) {
    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed icon is selected.');
      return;
    }

    const svg = await readSourceInsertIconSvg(source, iconName);
    if (!svg) {
      setInspectorNotice('Selected icon asset could not be read as a safe inline SVG.');
      return;
    }

    await commitSourceInspectorSingleWriteback({
      label: 'Replace inline SVG icon',
      targetLayer: selectedLayer,
      targetNode: selectedSourceNode,
      unchangedNotice: 'Inline SVG icon already uses this asset.',
      apply: (contents, subject, node) => applySourceInlineSvgIconWriteback({
        contents,
        node,
        sourceFile: subject.sourceFile,
        svg,
      }),
    });
  }

  async function commitSourceInspectorAttribute(attributeName: SourceAttributeName, value: string | null) {
    if (await commitSourceInspectorBatchEdit({
      label: value
        ? `Set ${attributeName} source attribute`
        : `Clear ${attributeName} source attribute`,
      unchangedNotice: value
        ? `${attributeName} already uses this value on selected layers.`
        : `${attributeName} already has no source value on selected layers.`,
      apply: (node, contents) => applySourceAttributeWriteback({
        attributeName,
        contents,
        node,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        value,
      }),
      describeChanges: (node) => [
        createHistoryChangeSummary(attributeName, node.sourceAttributes?.[attributeName], value),
      ],
    })) return;

    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected content does not have an editable source field path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorAttribute({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      attributeName,
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
      value,
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? value
        ? `${attributeName} source attribute updated.`
        : `${attributeName} source attribute cleared.`
      : value
        ? `${attributeName} already uses this value.`
        : `${attributeName} already has no source value.`);
  }

  async function updateSourceInspectorComponentProp(
    propName: string,
    value: SourceComponentPropValue,
    targetNode?: EditableTreeNode,
    options?: SourceComponentPropChangeOptions,
  ) {
    const resolvedTargetNode = targetNode ?? selectedSourceNode ?? undefined;
    const coalescedCommit = createSourceComponentPropCommitTicket(propName, resolvedTargetNode, options);
    const optimisticVersion = optimisticallyUpdateSourceInspectorComponentProp(propName, value, resolvedTargetNode, options);
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      if (coalescedCommit && !isLatestSourceComponentPropCommit(coalescedCommit)) return;
      await commitSourceInspectorComponentProp(propName, value, resolvedTargetNode, optimisticVersion);
    }).catch(reportSourceInspectorEditError);
  }

  async function updateSourceInspectorComponentProps(
    updates: SourceComponentPropUpdate[],
    targetNode?: EditableTreeNode,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorComponentProps(updates, targetNode);
    }).catch(reportSourceInspectorEditError);
  }

  async function updateSourceInspectorComponentType(
    targetComponentName: string,
    options: SourceComponentTypeChangeOptions,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorComponentType(targetComponentName, options);
    }).catch(reportSourceInspectorEditError);
  }

  function optimisticallyUpdateSourceInspectorComponentProp(
    propName: string,
    value: SourceComponentPropValue,
    targetNode?: EditableTreeNode,
    options?: SourceComponentPropChangeOptions,
  ): number | undefined {
    const node = targetNode ?? selectedSourceNode;
    if (!node || !sourceEditSubject || !selectionScope.sourceCapabilities.canEditFields) return undefined;
    if (options?.target === 'active-mode') return undefined;
    // Mirror the set commitSourceInspectorBatchEdit will write. Broaden only when the
    // edited node is itself part of the batch, so an explicit targetNode outside the
    // selection still projects onto just that node.
    const isBatchEdit = batchEditableSourceNodes.length > 1
      && batchEditableSourceNodes.some((batchNode) => batchNode.id === node.id);
    return optimisticallyUpdateSourceTreeComponentProps(
      sourceEditSubject.sourceFile,
      isBatchEdit ? batchEditableSourceNodes.map((batchNode) => batchNode.id) : [node.id],
      [{ propName, value }],
    );
  }

  function createSourceComponentPropCommitTicket(
    propName: string,
    targetNode?: EditableTreeNode | null,
    options?: SourceComponentPropChangeOptions,
  ): { key: string; version: number } | null {
    const node = targetNode ?? selectedSourceNode;
    if (!node || !sourceEditSubject) return null;
    const key = [
      sourceEditSubject.sourceFile,
      node.id,
      propName,
      options?.target ?? 'auto',
      selectionScope.ownerInstanceId ?? 'root',
    ].join('\u001f');
    const version = sourceComponentPropCommitVersionRef.current + 1;
    sourceComponentPropCommitVersionRef.current = version;
    latestSourceComponentPropCommitRef.current.set(key, version);
    return { key, version };
  }

  function isLatestSourceComponentPropCommit(ticket: { key: string; version: number }): boolean {
    return latestSourceComponentPropCommitRef.current.get(ticket.key) === ticket.version;
  }

  async function updateSourceInspectorReferencedArrayProp(
    targetNode: EditableTreeNode,
    propName: string,
    value: EditableTreeSourcePropArray,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorReferencedArrayProp(targetNode, propName, value);
    }).catch(reportSourceInspectorEditError);
  }

  async function updateSourceInspectorExtractSelectionToMap() {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorExtractSelectionToMap();
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorExtractSelectionToMap() {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layers have no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditStructure) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layers do not have an editable source structure path.');
      return;
    }

    const nodes = resolveDesignMappableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (nodes.length <= 1) {
      setInspectorNotice('Select at least two source-backed sibling layers to create a map.');
      return;
    }

    const targetLayer = previewLayers.find((layer) => layer.id === nodes[0]?.id) ?? selectedLayer;
    if (!targetLayer) {
      setInspectorNotice('Create map could not resolve a stable selected layer.');
      return;
    }

    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const selectionAfter = createSourceSelectionSnapshotFromNodeId(
      currentContext.subject,
      nodes[0]?.id ?? targetLayer.id,
      currentContext.selection,
    );
    const result = await commitAndPersistSourceInspectorExtractSelectedNodesToMap({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      nodes,
      selectionBefore,
      selectionAfter,
      subject: currentContext.subject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentContext.subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      queueMicrotask(() => {
        restoreDesignLayerSelectionAfterSourceRefresh(
          currentContext.selection,
          refreshedTree,
          nodes[0]?.id ?? targetLayer.id,
        );
      });
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `${nodes.length} selected source layers converted to a connected array.`
      : 'Selected source layers are already represented by a map.');
  }

  async function commitSourceInspectorReferencedArrayProp(
    targetNode: EditableTreeNode,
    propName: string,
    value: EditableTreeSourcePropArray,
  ) {
    const sourceSubjectForNode = resolveProjectAssetSubjectForSourceFile(pages, components, targetNode.source?.sourceFile ?? '');
    if (!sourceSubjectForNode) {
      setInspectorNotice('Connected array has no source history lane yet.');
      return;
    }

    const history = getSourceHistoryControllerForSubject(sourceSubjectForNode);
    if (!history) {
      setInspectorNotice('Connected array has no source history lane yet.');
      return;
    }

    const historyPath = getProjectAssetHistoryLaneId(sourceSubjectForNode);
    const selectionSnapshot = createSourceSelectionSnapshotFromNodeId(sourceSubjectForNode, targetNode.id, selection);
    const mapBinding = targetNode.sourceMapBinding;
    const writebackKind = mapBinding?.source.writable
      ? 'referenced-array-expression'
      : 'referenced-array-prop';
    const result = await commitAndPersistSourceInspectorComponentProp({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      propName,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceSubjectForNode,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
      value,
      ...(mapBinding?.source.code ? { sourceExpression: mapBinding.source.code } : {}),
      writebackKind,
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceSubjectForNode.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `${mapBinding?.source.label ?? propName} source array updated.`
      : `${mapBinding?.source.label ?? propName} source array already uses this value.`);
  }

  async function applySourceComponentPropUpdates({
    contents,
    node,
    sourceFile,
    updates,
  }: {
    contents: string;
    node: EditableTreeNode;
    sourceFile: string;
    updates: SourceComponentPropUpdate[];
  }): Promise<{
    ok: true;
    changed: boolean;
    diagnostic: string;
    nextContents: string;
  } | {
    ok: false;
    diagnostic: string;
    nextContents: string;
  }> {
    let nextContents = contents;
    let changed = false;
    let diagnostic = 'Component props already use these values.';

    for (const update of updates) {
      const result = await applySourceComponentPropWriteback({
        contents: nextContents,
        node,
        propName: update.propName,
        sourceFile,
        value: update.value,
      });

      if (!result.ok) return result;
      diagnostic = result.diagnostic;
      if (result.changed) {
        changed = true;
        nextContents = result.nextContents;
      }
    }

    return {
      ok: true,
      changed,
      diagnostic,
      nextContents,
    };
  }

  function getSourceComponentPropBatchLabel(updates: SourceComponentPropUpdate[]): string {
    const propNames = new Set(updates.map((update) => update.propName));
    if (propNames.has('dataCsv') && propNames.has('seriesCsv')) return 'Chart data table';
    if (updates.length === 1) return `Set ${updates[0].propName} component prop`;
    return 'Component props';
  }

  async function commitSourceInspectorComponentProps(
    updates: SourceComponentPropUpdate[],
    targetNode = selectedSourceNode,
  ) {
    const normalizedUpdates = updates.filter((update) => update.propName.trim().length > 0);
    if (normalizedUpdates.length === 0) return;
    const label = getSourceComponentPropBatchLabel(normalizedUpdates);
    const unchangedNotice = `${label} already uses these values.`;

    if (isSameDesignSourceNode(targetNode, selectedSourceNode) && await commitSourceInspectorBatchEdit({
      label,
      unchangedNotice,
      apply: (node, contents) => applySourceComponentPropUpdates({
        contents,
        node,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        updates: normalizedUpdates,
      }),
      describeChanges: (node) => normalizedUpdates.map((update) =>
        createHistoryChangeSummary(update.propName, node.sourceProps?.[update.propName], update.value)),
    })) return;

    if (!selectedLayer || !targetNode) {
      setInspectorNotice('No source-backed component layer is selected.');
      return;
    }

    await commitSourceInspectorSingleWriteback({
      label,
      targetLayer: selectedLayer,
      targetNode,
      unchangedNotice,
      apply: (contents, subject, node) => applySourceComponentPropUpdates({
        contents,
        node,
        sourceFile: subject.sourceFile,
        updates: normalizedUpdates,
      }),
      describeChanges: (node) => normalizedUpdates.map((update) =>
        createHistoryChangeSummary(update.propName, node.sourceProps?.[update.propName], update.value)),
    });
  }

  async function commitSourceInspectorComponentProp(
    propName: string,
    value: SourceComponentPropValue,
    targetNode = selectedSourceNode,
    optimisticVersion?: number,
  ) {
    if (isSameDesignSourceNode(targetNode, selectedSourceNode) && await commitSourceInspectorBatchEdit({
      label: `Set ${propName} component prop`,
      unchangedNotice: `${propName} already uses this value on selected layers.`,
      apply: (node, contents) => applySourceComponentPropWriteback({
        contents,
        node,
        propName,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        value,
      }),
      describeChanges: (node) => [
        createHistoryChangeSummary(propName, node.sourceProps?.[propName], value),
      ],
    })) return;

    if (!selectedLayer || !targetNode) {
      setInspectorNotice('No source-backed component layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected component has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected component does not have an editable source prop path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorComponentProp({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      propName,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
      value,
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile, { optimisticVersion });

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `${propName} component prop updated.`
      : `${propName} component prop already uses this value.`);
  }

  async function commitSourceInspectorComponentType(
    targetComponentName: string,
    options: SourceComponentTypeChangeOptions,
  ) {
    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed component layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected component has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected component does not have an editable source type path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorComponentType({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      allowedPropNames: options.allowedPropNames,
      fallbackProps: options.fallbackProps,
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      importSource: options.importSource,
      managedPropNames: options.managedPropNames,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      propOverrides: options.propOverrides,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      targetComponentName,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `Converted chart to ${targetComponentName}.`
      : `Chart already uses ${targetComponentName}.`);
  }

  async function updateSourceInspectorStyleDeclaration(property: SourceStyleProperty, value: string | null, targetNode?: EditableTreeNode) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorStyleDeclaration(property, value, targetNode);
    }).catch(reportSourceInspectorEditError);
  }

  async function updateSourceInspectorStyleDeclarations(
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    patches: DesignPreviewStyleDeclarationPatch[],
    label: string,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorStyleDeclarations(targetLayer, targetNode, patches, label);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorStyleDeclarations(
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    patches: DesignPreviewStyleDeclarationPatch[],
    label: string,
  ) {
    const normalizedPatches = patches
      .map((patch) => ({
        property: patch.property,
        value: normalizeSourceStyleDeclarationValue(patch.property, patch.value),
      }))
      .filter((patch, index, items) => (
        items.findIndex((candidate) => candidate.property === patch.property) === index
      ));
    if (normalizedPatches.length === 0) return;
    const blockedInlineSizePatch = normalizedPatches.find((patch) => (
      patch.value !== null &&
      shouldBlockTailwindInlineSizeSourceStyleWriteback(targetNode, patch.property)
    ));
    if (blockedInlineSizePatch) {
      setInspectorNotice(formatTailwindInlineSizeWritebackNotice(blockedInlineSizePatch.property));
      return;
    }

    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source style path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const snapshot = currentContext.history.getSnapshot();
    let nextContents = snapshot.value;
    let changed = false;

    for (const patch of normalizedPatches) {
      const result = await applySourceStyleDeclarationWriteback({
        contents: nextContents,
        node: targetNode,
        property: patch.property,
        sourceFile: currentContext.subject.sourceFile,
        value: patch.value,
      });
      if (!result.ok) {
        setInspectorNotice(result.diagnostic);
        return;
      }
      if (result.changed) {
        changed = true;
        nextContents = result.nextContents;
      }
    }

    if (!changed || areSourceContentsEqual(snapshot.value, nextContents)) {
      setInspectorNotice(`${label} already matches the source styles.`);
      return;
    }

    const transaction = currentContext.history.commit(nextContents, {
      affectedFiles: [currentContext.subject.sourceFile],
      kind: 'patch',
      label,
      laneId: getProjectAssetHistoryLaneId(currentContext.subject),
      owner: createProjectAssetEditOwner(currentContext.subject),
      scope: currentContext.subject.kind,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
    });
    if (!transaction) {
      setInspectorNotice(`${label} did not change the source.`);
      return;
    }

    const persisted = await persistCurrentSourceHistory(currentContext.history, currentContext.subject, transaction);
    if (!persisted) return;
    recordDesignSourceHistoryTransaction(transaction);
    const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, nextContents);
    restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, targetNode.id);
    setInspectorNotice(`${label} updated.`);
  }

  async function commitSourceInspectorStyleDeclaration(property: SourceStyleProperty, value: string | null, targetNode = selectedSourceNode) {
    if (targetNode && value !== null && shouldBlockTailwindInlineSizeSourceStyleWriteback(targetNode, property)) {
      setInspectorNotice(formatTailwindInlineSizeWritebackNotice(property));
      return;
    }

    if (isSameDesignSourceNode(targetNode, selectedSourceNode) && await commitSourceInspectorBatchEdit({
      label: value
        ? `Set ${property} source style`
        : `Clear ${property} source style`,
      unchangedNotice: value
        ? `${property} already uses this style value on selected layers.`
        : `${property} already has no source style value on selected layers.`,
      apply: (node, contents) => applySourceStyleDeclarationWriteback({
        contents,
        node,
        property,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        value,
      }),
      describeChanges: (node) => [
        createHistoryChangeSummary(property, node.sourceStyleDeclarations?.[property], value),
      ],
    })) return;

    if (!selectedLayer || !targetNode) {
      setInspectorNotice('No source-backed layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source style path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorStyleDeclaration({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      property,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
      value,
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? value
        ? `${property} source style updated.`
        : `${property} source style cleared.`
      : value
        ? `${property} already uses this style value.`
        : `${property} already has no source style value.`);
  }

  async function updateSourceInspectorTextContent(text: string) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorTextContent(text);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorTextContent(text: string) {
    if (await commitSourceInspectorBatchEdit({
      label: 'Set source text content',
      unchangedNotice: 'Selected text layers already use this content.',
      apply: (node, contents) => applySourceTextContentWriteback({
        contents,
        node,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        text,
      }),
      describeChanges: (node) => [createHistoryChangeSummary('text', node.textContent, text)],
    })) return;

    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed text layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected text does not have an editable source content path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorTextContent({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      text,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? 'Source text content updated.'
      : 'Source text content already uses this value.');
  }

  async function updateSourceInspectorTextI18nBinding(tokenName: string | null) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorTextI18nBinding(tokenName);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorTextI18nBinding(tokenName: string | null) {
    if (await commitSourceInspectorBatchEdit({
      label: tokenName ? `Bind text to ${tokenName}` : 'Unbind text from token',
      unchangedNotice: tokenName
        ? `Selected text layers are already bound to ${tokenName}.`
        : 'Selected text layers are already unbound.',
      apply: (node, contents) => {
        const currentBindingKey = getEffectiveSourceTextBindingKey(node);
        const fallbackText = tokenName
          ? null
          : resolveI18nTokenValue(tokenRegistry, currentBindingKey ?? undefined, selectedSourcePreviewTokenModes)
            ?? getReadableSourceText(node)
            ?? null;
        return applySourceTextI18nBindingWriteback({
          contents,
          fallbackText,
          node,
          sourceFile: sourceEditSubject?.sourceFile ?? '',
          tokenName,
        });
      },
    })) return;

    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed text layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected text does not have an editable source binding path.');
      return;
    }

    const currentBindingKey = getEffectiveSourceTextBindingKey(selectedSourceNode);
    const fallbackText = tokenName
      ? null
      : resolveI18nTokenValue(tokenRegistry, currentBindingKey ?? undefined, selectedSourcePreviewTokenModes)
        ?? getReadableSourceText(selectedSourceNode)
        ?? null;

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorTextI18nBinding({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      fallbackText,
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      timeline: sourceHistoryFileRef.current.timeline,
      tokenName,
      trigger: 'auto',
    });

    await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(tokenName
      ? `Text bound to token ${tokenName}.`
      : 'Text unbound from token.');
  }

  async function updateSourceInspectorElementTagName(tagName: SourceElementTagName) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorElementTagName(tagName);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorElementTagName(tagName: SourceElementTagName) {
    if (await commitSourceInspectorBatchEdit({
      label: `Set heading level ${tagName.toUpperCase()}`,
      unchangedNotice: `Selected headings already use ${tagName.toUpperCase()}.`,
      apply: (node, contents) => applySourceElementTagNameWriteback({
        contents,
        node,
        sourceFile: sourceEditSubject?.sourceFile ?? '',
        tagName,
      }),
      describeChanges: (node) => [
        createHistoryChangeSummary('tagName', node.source?.jsxName, tagName),
      ],
    })) return;

    if (!selectedLayer || !selectedSourceNode) {
      setInspectorNotice('No source-backed heading layer is selected.');
      return;
    }
    if (!sourceEditSubject || !sourceEditHistory) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditFields) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected heading does not have an editable source element path.');
      return;
    }

    const selectionSnapshot = createSourceLayerSelectionSnapshot(selectedLayer, sourceEditSubject, selection);
    const result = await commitAndPersistSourceInspectorElementTagName({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: sourceEditHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: selectedSourceNode,
      selectionBefore: selectionSnapshot,
      selectionAfter: selectionSnapshot,
      subject: sourceEditSubject,
      tagName,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    const refreshedTree = await refreshSourceTreeAfterInspectorResult(result, sourceEditSubject.sourceFile);
    if (result.changed) {
      restoreDesignLayerSelectionAfterSourceRefresh(
        selection,
        refreshedTree,
        selectionSnapshot.selectedSourceNodeId ?? null,
      );
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `Heading level changed to ${tagName.toUpperCase()}.`
      : `Heading already uses ${tagName.toUpperCase()}.`);
  }

  async function updateSourceInspectorInsertChild(
    templateId: SourceInsertChildTemplateId,
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
    targetIndex?: number,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorInsertChild(templateId, targetLayer, targetNode, targetIndex);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorInsertChild(
    templateId: SourceInsertChildTemplateId,
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
    targetIndex?: number,
  ) {
    if (!targetLayer || !targetNode) {
      setInspectorNotice('No source-backed layer is selected.');
      return;
    }
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (targetNode.source?.sourceFile !== currentContext.subject.sourceFile || !targetNode.sourceLocation) {
      setInspectorNotice('Select a source-backed layer before pasting.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canInsertChildren) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer cannot receive source children.');
      return;
    }

    const nextLayerId = getPredictedInsertedSourceChildId(targetNode, targetIndex);
    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const selectionAfter = nextLayerId
      ? createSourceSelectionSnapshotFromNodeId(currentContext.subject, nextLayerId, currentContext.selection)
      : selectionBefore;
    const result = await commitAndPersistSourceInspectorInsertChild({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      iconDefault: templateId === 'icon' ? await getProjectDefaultSourceInsertIcon(assets) : undefined,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      selectionBefore,
      selectionAfter,
      subject: currentContext.subject,
      targetIndex,
      templateId,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentContext.subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      if (nextLayerId) {
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, nextLayerId);
        });
      }
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? 'Source child node inserted.'
      : 'Source child node already exists.');
  }

  async function updateSourceInspectorInsertComponent(
    component: DesignLibraryComponent,
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    targetIndex?: number,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorInsertComponent(component, targetLayer, targetNode, targetIndex);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorInsertComponent(
    component: DesignLibraryComponent,
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    targetIndex?: number,
  ) {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected page has no source history lane yet.');
      return;
    }
    const currentHistory = currentContext.history;
    const currentSelection = currentContext.selection;
    const currentSubject = currentContext.subject;
    if (!selectionScope.sourceCapabilities.canInsertChildren) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer cannot receive source component children.');
      return;
    }
    if (!canInsertComponentIntoSourceNode(targetNode)) {
      setInspectorNotice(`${targetNode.label} cannot receive component children.`);
      return;
    }

    const story = await resolveComponentStoryForSourceInsert(component);
    const sourceInsert = story?.sourceInsert ?? {};
    const hasSourceInsert = Boolean(story?.sourceInsert);
    const storyDesignControls = story ? getWorkbenchStoryDesignControls(story) : [];
    const storyDefaultArgs = story
      ? getProjectDefaultIconStoryArgs(getWorkbenchStoryDesignDefaultArgs(story), storyDesignControls, assets)
      : {};
    const baseProps = sourceInsert.props
      ? getProjectDefaultIconStoryArgs(sourceInsert.props, storyDesignControls, assets)
      : story && !hasSourceInsert
        ? normalizeStoryArgsForSourceProps(storyDefaultArgs)
        : {};
    const sourceComponentName = sourceInsert.componentName ?? getComponentSourceExportName(component);
    const preparedJsxChildren = prepareSourceInsertJsxChildren({
      jsxChildren: sourceInsert.jsxChildren,
      parentNode: targetNode,
    });
    const uniqueProps = prepareSourceInsertComponentProps({
      parentNode: targetNode,
      props: baseProps,
      sourceComponentName,
    });
    const props = prepareSourceInsertPropsWithValueReplacements(
      uniqueProps,
      preparedJsxChildren.valueReplacements,
    );
    const jsxChildren = preparedJsxChildren.jsxChildren;
    const targetJsxName = targetNode.source?.jsxName ?? '';
    if (
      targetJsxName &&
      !canTreatSourceNodeAsExplicitUnknownChildrenContainer(targetNode) &&
      !canMoveSourceChildIntoParent(targetJsxName, sourceComponentName)
    ) {
      setInspectorNotice(`${component.name} cannot be placed inside ${targetNode.label} — that inline slot only accepts inline-safe children.`);
      return;
    }
    if (!canAddComponentToSourceParent(targetNode, sourceComponentName)) {
      setInspectorNotice(`${sourceComponentName} already exists inside ${targetNode.label}.`);
      return;
    }
    const importSourceFile = resolveComponentInsertSourceFile(component, sourceInsert.sourceFile, sourceComponentName, components.components);
    const importSource = getComponentImportSource(currentSubject.sourceFile, importSourceFile);
    const additionalImports = sourceInsert.imports?.flatMap((importSpec) =>
      resolveComponentInsertImportSpecs(component, importSpec, components.components, currentSubject.sourceFile),
    );
    const nextLayerId = getPredictedInsertedSourceChildId(targetNode, targetIndex);
    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentSubject, currentSelection);
    const selectionAfter = nextLayerId
      ? createSourceSelectionSnapshotFromNodeId(currentSubject, nextLayerId, currentSelection)
      : selectionBefore;
    const result = await commitAndPersistSourceInspectorComponentInsert({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      additionalImports,
      componentName: sourceComponentName,
      history: currentHistory,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      importSource,
      jsxChildren,
      jsxProps: sourceInsert.jsxProps,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      props,
      selectionBefore,
      selectionAfter,
      subject: currentSubject,
      targetIndex,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentSubject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const refreshedTree = await refreshSourceTreeFromContents(currentSubject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      if (nextLayerId) {
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(currentSelection, refreshedTree, nextLayerId);
        });
      }
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `${component.name} component inserted into ${targetNode.label}.`
      : `${component.name} component is already present.`);
  }

  async function resolveComponentStoryForSourceInsert(
    component: DesignLibraryComponent,
  ): Promise<WorkbenchSourceInsertStory | null> {
    const staticStory = getWorkbenchStory(component);
    if (staticStory) return staticStory;

    const storySourceFile = getComponentCsfStorySourceFile(component);
    if (!storySourceFile) return null;

    const cacheKey = getComponentStoryMetadataCacheKey(
      component,
      projectId,
      componentStoryMetadataRetryRevision,
    );
    if (Object.prototype.hasOwnProperty.call(componentStoryMetadataByKey, cacheKey)) {
      return componentStoryMetadataByKey[cacheKey] ?? null;
    }

    let story: WorkbenchSourceInsertStory | null = null;
    try {
      story = await importWorkbenchCsfStoryMetadataWithRetry(storySourceFile, component);
    } catch (error) {
      console.warn('[workbench] CSF story metadata load failed:', error);
    }
    if (story) {
      setComponentStoryMetadataByKey((current) => ({
        ...current,
        [cacheKey]: story,
      }));
    }
    return story;
  }

  async function updateSourceInspectorStructure(
    action: SourceStructureAction,
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
  ) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorStructure(action, targetLayer, targetNode);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorStructure(
    action: SourceStructureAction,
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
  ) {
    if (!targetLayer || !targetNode) {
      setInspectorNotice('No source-backed layer is selected.');
      return;
    }
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditStructure) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source structure path.');
      return;
    }
    const sourceEditContext = {
      history: currentContext.history,
      selection: currentContext.selection,
      subject: currentContext.subject,
    };

    if (action === 'delete' && selectedLayerIds.length > 1) {
      const nodes = resolveDesignDeletableSourceNodes({
        root: previewDocument?.root ?? null,
        selectedLayerIds,
        sourceFile: sourceEditContext.subject.sourceFile,
      });
      if (nodes.length > 1) {
        await commitSourceInspectorDeleteNodes(targetLayer, nodes, sourceEditContext);
        return;
      }
    }

    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const nextLayerId = getPredictedSourceStructureSelectionId(targetNode, action);
    const selectionAfter = nextLayerId === null
      ? createSourceSelectionSnapshotFromNodeId(currentContext.subject, null, currentContext.selection)
      : createSourceSelectionSnapshotFromNodeId(currentContext.subject, nextLayerId, currentContext.selection);
    const result = await commitAndPersistSourceInspectorStructure({
      action,
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      selectionBefore,
      selectionAfter,
      subject: currentContext.subject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentContext.subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const optimisticTree = action === 'delete'
        ? optimisticallyRemoveSourceTreeNodes(currentContext.subject.sourceFile, [targetNode.id], result.nextContents)
        : null;
      if (optimisticTree) {
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, optimisticTree, nextLayerId);
        });
      }
      const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      if (!optimisticTree) {
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, nextLayerId);
        });
      }
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `Source node ${formatSourceStructureActionPastTense(action)}.`
      : `Source node cannot ${formatSourceStructureAction(action)} from this position.`);
  }

  async function commitSourceInspectorDeleteNodes(
    targetLayer: PreviewLayer,
    nodes: EditableTreeNode[],
    currentContext: {
      history: HistoryController<string>;
      selection: WorkbenchSelectionState;
      subject: ProjectAssetHistorySubject;
    },
  ) {
    const root = previewDocument?.root ?? null;
    const topLevelNodes = resolveTopLevelDesignSourceNodes(root, nodes);
    if (topLevelNodes.length === 0) {
      setInspectorNotice('No source-backed layer is selected for delete.');
      return;
    }

    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const selectionAfterNodeId = resolveDesignMultiDeleteSelectionId(root, topLevelNodes);
    const selectionAfter = createSourceSelectionSnapshotFromNodeId(
      currentContext.subject,
      selectionAfterNodeId,
      currentContext.selection,
    );
    const snapshot = currentContext.history.getSnapshot();
    let nextContents = snapshot.value;
    let changedCount = 0;

    for (const node of sortEditableNodesByDescendingSourceLocation(topLevelNodes)) {
      const result = await applySourceStructureWriteback({
        action: 'delete',
        contents: nextContents,
        node,
        sourceFile: currentContext.subject.sourceFile,
      });
      if (!result.ok) {
        setInspectorNotice(result.diagnostic);
        return;
      }
      if (result.changed) {
        changedCount += 1;
        nextContents = result.nextContents;
      }
    }

    if (changedCount === 0 || areSourceContentsEqual(snapshot.value, nextContents)) {
      setInspectorNotice('Selected source nodes cannot delete from this position.');
      return;
    }

    const transaction = currentContext.history.commit(nextContents, {
      affectedFiles: [currentContext.subject.sourceFile],
      kind: 'delete',
      label: changedCount === 1 ? 'Delete selected source node' : `Delete ${changedCount} selected source nodes`,
      laneId: getProjectAssetHistoryLaneId(currentContext.subject),
      owner: createProjectAssetEditOwner(currentContext.subject),
      scope: currentContext.subject.kind,
      selectionBefore,
      selectionAfter,
    });
    if (!transaction) {
      setInspectorNotice('Selected source nodes did not change the source.');
      return;
    }

    const persisted = await persistCurrentSourceHistory(currentContext.history, currentContext.subject, transaction);
    if (!persisted) return;
    recordDesignSourceHistoryTransaction(transaction);
    const optimisticTree = optimisticallyRemoveSourceTreeNodes(
      currentContext.subject.sourceFile,
      topLevelNodes.map((node) => node.id),
      nextContents,
    );
    if (optimisticTree) {
      restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, optimisticTree, selectionAfterNodeId);
    }
    const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, nextContents);
    if (!optimisticTree) {
      restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, selectionAfterNodeId);
    }
    setInspectorNotice(changedCount === 1
      ? 'Selected source node deleted.'
      : `${changedCount} selected source nodes deleted.`);
  }

  async function copySourceSelectionToClipboard() {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return null;
    }

    // Copy is read-only. Authored slot children can sit under a component
    // instance (for example RecentChatCard children inside ScrollArea) while
    // still owning a concrete range in the current page source. Let the
    // source-file and source-location checks below decide copyability.
    const nodes = resolveDesignCopyableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      selectedNode: selectedSourceNode,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (nodes.length === 0) {
      setInspectorNotice('No source-backed layer is selected for copy.');
      return null;
    }

    const result = await createSourceNodeClipboardPayload({
      contents: currentContext.history.getSnapshot().value,
      nodes,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return null;
    }

    setSourceClipboard(result.payload);
    void navigator.clipboard?.writeText(result.payload.items.map((item) => item.jsxText).join('\n')).catch(() => undefined);
    setInspectorNotice(`${result.payload.label} copied. Select a source layer on any page and paste.`);
    return result.payload;
  }

  async function cutSourceSelectionToClipboard() {
    if (!hasSelectedSourceStructureEditTarget || !selectedLayer || !selectedSourceNode) {
      setInspectorNotice('Select a source-backed layer before cutting.');
      return;
    }
    const clipboard = await copySourceSelectionToClipboard();
    if (!clipboard) return;
    await updateSourceInspectorStructure('delete');
  }

  async function duplicateSourceSelection() {
    if (!hasSelectedSourceStructureEditTarget || !selectedLayer || !selectedSourceNode) {
      setInspectorNotice('Select a source-backed layer before duplicating.');
      return;
    }
    const clipboard = await copySourceSelectionToClipboard();
    if (!clipboard) return;
    await sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorPasteNode(clipboard, 'below', selectedLayer, selectedSourceNode);
    }).catch(reportSourceInspectorEditError);
  }

  function executeDesignSourceEditShortcut(action: DesignSourceEditShortcutAction) {
    const timestamp = performance.now();
    const previous = lastDesignSourceEditShortcutRef.current;
    if (previous?.action === action && timestamp - previous.timestamp < 120) return;
    lastDesignSourceEditShortcutRef.current = { action, timestamp };

    if (action === 'copy') {
      void copySourceSelectionToClipboard();
      return;
    }
    if (action === 'cut') {
      void cutSourceSelectionToClipboard();
      return;
    }
    if (action === 'paste-below' || action === 'paste-inside') {
      if (!hasSelectedSourceStructureEditTarget) {
        setInspectorNotice('Select a source-backed layer before pasting.');
        return;
      }
      void updateSourceInspectorPasteNode(action === 'paste-inside' ? 'inside' : 'below');
      return;
    }
    void duplicateSourceSelection();
  }

  async function updateSourceInspectorPasteNode(
    placement: DesignPastePlacement = 'below',
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
  ) {
    const clipboard = sourceClipboardRef.current;
    if (!clipboard) {
      setInspectorNotice('Copy a source layer before pasting.');
      return;
    }

    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorPasteNode(clipboard, placement, targetLayer, targetNode);
    }).catch(reportSourceInspectorEditError);
  }

  function showDesignEditorWarningToast(message: string) {
    if (designEditorWarningToastTimerRef.current !== null) {
      window.clearTimeout(designEditorWarningToastTimerRef.current);
    }
    setDesignEditorWarningToast(message);
    designEditorWarningToastTimerRef.current = window.setTimeout(() => {
      designEditorWarningToastTimerRef.current = null;
      if (mountedRef.current) setDesignEditorWarningToast(null);
    }, 8000);
  }

  function formatCrossFileClipboardWarning(
    clipboard: SourceNodeClipboardPayload,
    pasteTargetSourceFile: string,
  ): string | null {
    if (!clipboard.requiresSameSourceFile || clipboard.sourceFile === pasteTargetSourceFile) return null;
    const reasons = clipboard.sameFileRiskReasons.length > 0
      ? clipboard.sameFileRiskReasons.join(' and ')
      : 'source-local bindings';
    const sourceName = clipboard.sourceFile.split('/').pop() ?? clipboard.sourceFile;
    return `${clipboard.label} carries ${reasons} from ${sourceName}. The pasted layer may break or not work on this page until those bindings are rewritten.`;
  }

  async function commitSourceInspectorPasteNode(
    clipboard: SourceNodeClipboardPayload,
    placement: DesignPastePlacement,
    targetLayer = selectedLayer,
    targetNode = selectedSourceNode,
  ) {
    if (!targetLayer || !targetNode) {
      setInspectorNotice('No source-backed paste target is selected.');
      return;
    }
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canPaste) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source paste path.');
      return;
    }

    const pasteTarget = resolveDesignPasteTarget({
      placement,
      root: previewDocument?.root ?? null,
      selectedNode: targetNode,
    });
    if (!pasteTarget) {
      setInspectorNotice('Selected layer has no parent that can receive pasted layers.');
      return;
    }

    const pasteTargetSourceFile = currentContext.subject.sourceFile;
    const nextLayerId = getPredictedInsertedSourceChildId(pasteTarget.parentNode, pasteTarget.targetIndex);
    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const selectionAfter = nextLayerId
      ? createSourceSelectionSnapshotFromNodeId(currentContext.subject, nextLayerId, currentContext.selection)
      : selectionBefore;
    const result = await commitAndPersistSourceInspectorPasteNode({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      clipboardSourceFile: clipboard.sourceFile,
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      // Copied import lines carry the source page's relative depth. Re-express
      // them for the paste target so a node copied from a Design/* page (…/../../)
      // pasted into a root page (…/../) keeps resolving its components/styles.
      imports: clipboard.imports.map((spec) => ({
        ...spec,
        importSource: reExpressRelativeImportSpecifier(spec.importSource, clipboard.sourceFile, pasteTargetSourceFile),
      })),
      items: clipboard.items,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: pasteTarget.parentNode,
      requiresSameSourceFile: clipboard.requiresSameSourceFile,
      selectionBefore,
      selectionAfter,
      subject: currentContext.subject,
      targetIndex: pasteTarget.targetIndex,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentContext.subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      if (nextLayerId) {
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(currentContext.selection, refreshedTree, nextLayerId);
        });
      }
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    const crossFileWarning = result.changed
      ? formatCrossFileClipboardWarning(clipboard, pasteTargetSourceFile)
      : null;
    if (crossFileWarning) showDesignEditorWarningToast(crossFileWarning);
    setInspectorNotice(crossFileWarning ?? (result.changed
      ? `${clipboard.label} pasted ${placement === 'inside' ? 'into' : 'below'} ${targetNode.label}.`
      : `${clipboard.label} is already pasted.`));
  }

  function openSourceWrapSelectionModal() {
    if (!hasSelectedSourceStructureEditTarget || !selectedSourceNode) {
      setInspectorNotice('Select source-backed layers before wrapping.');
      return;
    }
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditStructure) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layers do not have an editable source structure path.');
      return;
    }
    const nodes = resolveDesignWrappableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      selectedNode: selectedSourceNode,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (nodes.length === 0) {
      setInspectorNotice('Wrap selection requires source-backed sibling layers with the same parent.');
      return;
    }
    setWrapSelectionModalOpen(true);
  }

  async function wrapSourceSelectionInHtmlTag(tagName: SourceWrapHtmlTagName) {
    setWrapSelectionModalOpen(false);
    await updateSourceInspectorWrapSelection({ kind: 'html', tagName });
  }

  async function wrapSourceSelectionInComponent(component: DesignLibraryComponent): Promise<string | null> {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject) {
      const diagnostic = 'Selected layer has no source history lane yet.';
      setInspectorNotice(diagnostic);
      return diagnostic;
    }
    const sourceComponentName = getComponentSourceExportName(component);
    if (!componentSupportsChildrenSlot(sourceComponentName)) {
      const diagnostic = `${component.name} does not expose an editable children slot.`;
      setInspectorNotice(diagnostic);
      return diagnostic;
    }
    const nodes = resolveDesignWrappableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      selectedNode: selectedSourceNode,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (nodes.length === 0) {
      const diagnostic = 'Wrap selection requires source-backed sibling layers with the same parent.';
      setInspectorNotice(diagnostic);
      return diagnostic;
    }
    const incompatibleNode = nodes.find((node) => !canMoveSourceChildIntoParent(
      sourceComponentName,
      node.source?.jsxName ?? node.label,
    ));
    if (incompatibleNode) {
      const diagnostic = `${component.name} cannot wrap ${incompatibleNode.label} because its children slot only accepts compatible layers.`;
      setInspectorNotice(diagnostic);
      return diagnostic;
    }

    const story = await resolveComponentStoryForSourceInsert(component);
    const sourceInsert = story?.sourceInsert ?? {};
    const hasSourceInsert = Boolean(story?.sourceInsert);
    const storyDesignControls = story ? getWorkbenchStoryDesignControls(story) : [];
    const storyDefaultArgs = story
      ? getProjectDefaultIconStoryArgs(getWorkbenchStoryDesignDefaultArgs(story), storyDesignControls, assets)
      : {};
    const props = sourceInsert.props
      ? getProjectDefaultIconStoryArgs(sourceInsert.props, storyDesignControls, assets)
      : story && !hasSourceInsert
        ? normalizeStoryArgsForSourceProps(storyDefaultArgs)
        : {};
    const importSourceFile = resolveComponentInsertSourceFile(component, sourceInsert.sourceFile, sourceComponentName, components.components);
    const wrapper: SourceWrapNodeWrapper = {
      additionalImports: sourceInsert.imports?.flatMap((importSpec) =>
        resolveComponentInsertImportSpecs(component, importSpec, components.components, currentContext.subject!.sourceFile),
      ),
      componentName: sourceInsert.componentName ?? sourceComponentName,
      importSource: getComponentImportSource(currentContext.subject.sourceFile, importSourceFile),
      jsxProps: sourceInsert.jsxProps,
      kind: 'component',
      props,
    };
    setWrapSelectionModalOpen(false);
    await updateSourceInspectorWrapSelection(wrapper);
    return null;
  }

  async function updateSourceInspectorWrapSelection(wrapper: SourceWrapNodeWrapper) {
    return sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorWrapSelection(wrapper);
    }).catch(reportSourceInspectorEditError);
  }

  async function commitSourceInspectorWrapSelection(wrapper: SourceWrapNodeWrapper) {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canEditStructure) {
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layers do not have an editable source structure path.');
      return;
    }

    const nodes = resolveDesignWrappableSourceNodes({
      root: previewDocument?.root ?? null,
      selectedLayerIds,
      selectedNode: selectedSourceNode,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (nodes.length === 0) {
      setInspectorNotice('Wrap selection requires source-backed sibling layers with the same parent.');
      return;
    }

    const predictedSelection = getPredictedWrappedSourceLayerIds(nodes);
    const targetLayer = previewLayers.find((layer) => layer.id === nodes[0]?.id) ?? selectedLayer;
    if (!targetLayer || !predictedSelection) {
      setInspectorNotice('Wrap selection could not resolve a stable wrapper layer.');
      return;
    }

    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, currentContext.subject, currentContext.selection);
    const selectionAfter = createSourceSelectionSnapshotFromNodeId(
      currentContext.subject,
      predictedSelection.wrapperId,
      currentContext.selection,
    );
    const result = await commitAndPersistSourceInspectorWrapNode({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      nodes,
      selectionBefore,
      selectionAfter,
      subject: currentContext.subject,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
      wrapper,
    });

    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(currentContext.subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed) {
      const refreshedTree = await refreshSourceTreeFromContents(currentContext.subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      queueMicrotask(() => {
        restoreWrappedDesignLayerSelectionAfterSourceRefresh(
          currentContext.selection,
          refreshedTree,
          predictedSelection.wrapperId,
          predictedSelection.childIds,
        );
      });
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? `${nodes.length === 1 ? nodes[0]?.label ?? 'Layer' : `${nodes.length} layers`} wrapped.`
      : 'Selected source layers are already wrapped.');
  }

  function updateSourceInspectorMoveNode(
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    targetParentNode: EditableTreeNode,
    targetIndex: number,
  ) {
    let resolvePreviewReady: () => void = () => {};
    const previewReady = new Promise<void>((resolve) => {
      resolvePreviewReady = resolve;
    });
    void sourceInspectorEditQueueRef.current.enqueue(async () => {
      await commitSourceInspectorMoveNode(
        targetLayer,
        targetNode,
        targetParentNode,
        targetIndex,
        resolvePreviewReady,
      );
    }).catch(reportSourceInspectorEditError).finally(resolvePreviewReady);
    return previewReady;
  }

  async function commitSourceInspectorMoveNode(
    targetLayer: PreviewLayer,
    targetNode: EditableTreeNode,
    targetParentNode: EditableTreeNode,
    targetIndex: number,
    onPreviewReady?: () => void,
  ) {
    const currentContext = getLatestSourceInspectorContext();
    if (!currentContext.subject || !currentContext.history) {
      setInspectorNotice('Selected layer has no source history lane yet.');
      return;
    }
    if (!selectionScope.sourceCapabilities.canMove) {
      recordWorkbenchDragProbe('moveRefused', {
        diagnostic: selectionScope.editabilityDiagnostic?.message ?? null,
        reason: 'canMove',
      });
      setInspectorNotice(selectionScope.editabilityDiagnostic?.message ?? 'Selected layer does not have an editable source move path.');
      return;
    }

    const moveSelectionIds = getDesignLayerIdsFromSelection(currentContext.selection);
    if (moveSelectionIds.length > 1 && moveSelectionIds.includes(targetNode.id)) {
      const multiMoveContext = {
        history: currentContext.history,
        selection: currentContext.selection,
        subject: currentContext.subject,
      };
      await commitSourceInspectorMoveNodes(
        targetLayer,
        targetNode.id,
        targetParentNode.id,
        targetIndex,
        multiMoveContext,
        onPreviewReady,
      );
      return;
    }

    const subject = currentContext.subject;
    const selectionBefore = createSourceLayerSelectionSnapshot(targetLayer, subject, currentContext.selection);
    const nextLayerId = getPredictedSourceMoveSelectionId(targetNode, targetParentNode, targetIndex);
    const selectionAfter = createSourceSelectionSnapshotFromNodeId(
      subject,
      nextLayerId ?? targetNode.id,
      currentContext.selection,
    );
    let previewRefreshed = false;
    const result = await commitAndPersistSourceInspectorMoveNode({
      adapters: {
        captureSavePoint: captureSourceSavePoint,
        saveHistory: saveWorkbenchHistory,
        scheduleHistorySave: queueSourceHistorySave,
        writeSourceFile: writeWorkbenchSourceFile,
      },
      history: currentContext.history,
      historyFile: sourceHistoryFileRef.current,
      historyPath,
      maxEntries: SOURCE_HISTORY_MAX_ENTRIES,
      node: targetNode,
      onSessionCommitted: async (nextContents) => {
        const refreshedTree = await refreshSourceTreeFromContents(subject.sourceFile, nextContents);
        previewRefreshed = true;
        refreshSourceHistoryView();
        queueMicrotask(() => {
          restoreDesignLayerSelectionAfterSourceRefresh(
            currentContext.selection,
            refreshedTree,
            selectionAfter.selectedSourceNodeId ?? null,
          );
        });
        onPreviewReady?.();
      },
      selectionBefore,
      selectionAfter,
      subject,
      targetIndex,
      targetParentNode,
      timeline: sourceHistoryFileRef.current.timeline,
      trigger: 'auto',
    });

    recordWorkbenchDragProbe('moveResult', {
      changed: result.changed,
      diagnostic: result.diagnostic,
      nodeId: targetNode.id,
      ok: result.ok,
      persisted: result.persisted,
      targetIndex,
      targetParentId: targetParentNode.id,
    });
    sourceHistoryFileRef.current = result.historyFile;
    trackSourceHistorySubjectAfterPersist(subject, result.nextContents, result.historyFile);
    recordDesignSourceHistoryTransaction(result.ok ? result.transaction : null);
    if (result.changed && !previewRefreshed) {
      const refreshedTree = await refreshSourceTreeFromContents(subject.sourceFile, result.nextContents);
      refreshSourceHistoryView();
      queueMicrotask(() => {
        restoreDesignLayerSelectionAfterSourceRefresh(
          currentContext.selection,
          refreshedTree,
          selectionAfter.selectedSourceNodeId ?? null,
        );
      });
    }

    if (!result.ok) {
      setInspectorNotice(result.diagnostic);
      return;
    }

    setInspectorNotice(result.changed
      ? 'Source node moved.'
      : 'Source node is already at this layer position.');
  }

  async function commitSourceInspectorMoveNodes(
    targetLayer: PreviewLayer,
    draggedNodeId: string,
    targetParentNodeId: string,
    targetIndex: number,
    currentContext: {
      history: HistoryController<string>;
      selection: WorkbenchSelectionState;
      subject: ProjectAssetHistorySubject;
    },
    onPreviewReady?: () => void,
  ) {
    const snapshot = currentContext.history.getSnapshot();
    const currentTreeResult = await createSourceTreeResultFromContents(
      currentContext.subject.sourceFile,
      snapshot.value,
    );
    const currentRoot = currentTreeResult.contents === snapshot.value
      ? currentTreeResult.tree?.root ?? null
      : null;
    if (!currentRoot) {
      setInspectorNotice(currentTreeResult.diagnostic);
      return;
    }

    const currentSelectedLayerIds = getDesignLayerIdsFromSelection(currentContext.selection);
    const currentDraggedNode = findEditableTreeNode(currentRoot, draggedNodeId);
    const currentTargetParentNode = findEditableTreeNode(currentRoot, targetParentNodeId);
    const nodes = resolveDesignMovableSourceNodes({
      root: currentRoot,
      selectedLayerIds: currentSelectedLayerIds,
      sourceFile: currentContext.subject.sourceFile,
    });
    if (
      nodes.length <= 1 ||
      !currentDraggedNode ||
      !currentTargetParentNode ||
      !nodes.some((node) => node.id === currentDraggedNode.id)
    ) {
      setInspectorNotice('Move selection requires editable, non-overlapping source-backed layers.');
      return;
    }

    const prediction = getPredictedSourceMoveSelectionIds(nodes, currentTargetParentNode, targetIndex);
    if (prediction.length !== nodes.length) {
      setInspectorNotice('Selected layer positions could not be predicted for this move.');
      return;
    }
    const activeLayerId = getDesignLayerIdFromSelection(currentContext.selection);
    const nextActiveLayerId = prediction.find(({ nodeId }) => nodeId === activeLayerId)?.nextNodeId ??
      prediction[prediction.length - 1]?.nextNodeId ??
      null;
    const selectionBefore = createSourceLayerSelectionSnapshot(
      targetLayer,
      currentContext.subject,
      currentContext.selection,
    );
    const selectionAfter = createSourceSelectionSnapshotFromNodeId(
      currentContext.subject,
      nextActiveLayerId,
      currentContext.selection,
    );
    const writeback = await applySourceMoveNodesWriteback({
      contents: snapshot.value,
      nodes,
      sourceFile: currentContext.subject.sourceFile,
      targetIndex,
      targetParentNode: currentTargetParentNode,
    });
    if (!writeback.ok) {
      setInspectorNotice(writeback.diagnostic);
      return;
    }
    if (!writeback.changed || areSourceContentsEqual(snapshot.value, writeback.nextContents)) {
      setInspectorNotice('Selected source layers are already at this layer position.');
      return;
    }

    const transaction = currentContext.history.commit(writeback.nextContents, {
      affectedFiles: [currentContext.subject.sourceFile],
      kind: 'move',
      label: `Move ${nodes.length} selected source nodes`,
      laneId: getProjectAssetHistoryLaneId(currentContext.subject),
      owner: createProjectAssetEditOwner(currentContext.subject),
      scope: currentContext.subject.kind,
      selectionBefore,
      selectionAfter,
    });
    if (!transaction) {
      setInspectorNotice('Selected source layers did not change the source.');
      return;
    }

    const persisted = await persistCurrentSourceHistory(currentContext.history, currentContext.subject, transaction);
    if (!persisted) return;
    recordDesignSourceHistoryTransaction(transaction);
    const refreshedTree = await refreshSourceTreeFromContents(
      currentContext.subject.sourceFile,
      writeback.nextContents,
    );
    refreshSourceHistoryView();
    restoreMovedDesignLayerSelectionAfterSourceRefresh(
      currentContext.selection,
      refreshedTree,
      prediction,
      activeLayerId,
    );
    onPreviewReady?.();
    setInspectorNotice(`${nodes.length} selected source layers moved.`);
  }

  function reportSourceInspectorEditError(error: unknown) {
    if (!mountedRef.current) return;
    setInspectorNotice(error instanceof Error ? error.message : 'Source Inspector edit failed.');
  }

  async function compileDesignForCodex() {
    if (!activeDesignTarget || !previewDocument) {
      setInspectorNotice('No design projection is ready to compile for Codex.');
      return;
    }

    const handoff = createCodexDesignHandoff({
      componentId: activeDesignTarget.id,
      componentName: activeDesignTarget.label,
      selectedNodeId: selectedLayer?.id ?? null,
      sourceFile: activeDesignTarget.sourceFile,
      story: activeRuntimeStory
        ? {
            args: normalizeStoryArgsForHandoff(activeRuntimeStoryArgs),
            name: activeRuntimeStory.name,
            sourceFile: activeRuntimeStory.sourceFile,
          }
        : null,
      tree: previewDocument,
    });

    try {
      await saveWorkbenchCodexDesignHandoff(CODEX_DESIGN_HANDOFF_PATH, handoff);
      setCodexHandoffCopyStatus('Ready to copy.');
      setCodexHandoffModal({
        handoff,
        prompt: createCodexHandoffPrompt(handoff),
      });
      setInspectorNotice(`Compiled ${activeDesignTarget.label} design handoff to ${CODEX_DESIGN_HANDOFF_PATH}.`);
    } catch (error) {
      setInspectorNotice(error instanceof Error ? error.message : 'Codex design handoff save failed.');
    }
  }

  async function openBrowserPreview() {
    if (!activeDesignTarget) {
      setInspectorNotice('No design target is open to preview.');
      return;
    }
    if (activeDesignTarget.kind !== 'page') {
      setInspectorNotice('Browser preview is only available for pages.');
      return;
    }
    const previewParams = new URLSearchParams({
      appearance: previewAppearance,
      source: activeDesignTarget.sourceFile,
      title: activeDesignTarget.label,
      tokenModes: JSON.stringify(previewTokenModes),
    });
    const previewUrl = withWorkbenchLocalBridgePairingParams(
      toWorkbenchPreviewUrl(`/page-preview.html?${previewParams.toString()}`),
    );
    const handle = window.open(previewUrl, '_blank', 'noopener,noreferrer');
    if (!handle) {
      setInspectorNotice('Browser preview was blocked by the browser pop-up policy.');
      return;
    }
    setInspectorNotice(`Opened ${activeDesignTarget.label} in a new tab.`);
  }

  async function exportForDeveloper() {
    if (!activeDesignTarget) {
      setInspectorNotice('No design target is open to export.');
      return;
    }
    try {
      const readResult = await readWorkbenchSourceFile(activeDesignTarget.sourceFile);
      if (!readResult.ok) {
        setInspectorNotice(`${activeDesignTarget.sourceFile} could not be read: ${readResult.message}`);
        return;
      }
      const exportPayload = createDeveloperExport({
        i18n: collectI18nDictionaryFromRegistry(tokenRegistry),
        sourceFile: activeDesignTarget.sourceFile,
        targetLabel: activeDesignTarget.label,
        tsx: readResult.contents,
      });
      setDeveloperExportCopyStatus('');
      setDeveloperExportModal(exportPayload);
      setInspectorNotice(`Prepared developer export for ${activeDesignTarget.label}.`);
    } catch (error) {
      setInspectorNotice(error instanceof Error ? error.message : 'Developer export failed.');
    }
  }

  async function loadSourceSavePointFile(laneId: HistoryLaneId): Promise<WorkbenchSavePointFile> {
    const cached = savePointFilesRef.current.get(laneId);
    if (cached) return cached;

    // Concurrent edits on a cold lane must share one read, or the second write
    // starts from an empty file and drops everything the first one loaded.
    const inFlight = savePointLoadsRef.current.get(laneId);
    if (inFlight) return inFlight;

    const load = (async () => {
      const path = getWorkbenchSavePointPath(laneId);
      let raw: unknown = null;
      try {
        raw = await loadWorkbenchSavePoints(path);
      } catch {
        // An unreadable save-point file must not stop the edit that triggered
        // it; start a fresh one rather than retrying forever.
        raw = null;
      }
      const file = normalizeWorkbenchSavePointFile(raw, laneId, new Date().toISOString());
      savePointFilesRef.current.set(laneId, file);
      savePointLoadsRef.current.delete(laneId);
      return file;
    })();

    savePointLoadsRef.current.set(laneId, load);
    return load;
  }

  function captureSourceSavePoint({ contents, laneId, sourceFile, trigger }: SourceFileSavePointCandidate) {
    void (async () => {
      try {
        const file = await loadSourceSavePointFile(laneId);
        const savedAt = new Date().toISOString();
        if (!shouldCaptureSavePoint({ contents, file, now: savedAt, trigger })) return;

        const nextFile = appendSavePoint(file, {
          id: createSavePointId(savedAt, laneId),
          laneId,
          sourceFile,
          savedAt,
          trigger,
          contents,
        });
        savePointFilesRef.current.set(laneId, nextFile);
        await saveWorkbenchSavePoints(getWorkbenchSavePointPath(laneId), nextFile);
      } catch (error) {
        // A save point is a convenience on top of a save that already
        // succeeded. Losing one is not worth surfacing over the edit.
        console.warn('[workbench] save point capture failed', error);
      }
    })();
  }

  function queueSourceHistorySave(_historyPath: string, nextHistoryFile: WorkbenchHistoryFile) {
    pendingSourceHistorySaveRef.current = { historyPath: _historyPath, historyFile: nextHistoryFile };
    if (sourceHistorySaveTimerRef.current !== null) {
      window.clearTimeout(sourceHistorySaveTimerRef.current);
      sourceHistorySaveTimerRef.current = null;
    }
    if (sourceHistorySaveRunningRef.current) return;

    sourceHistorySaveTimerRef.current = window.setTimeout(() => {
      sourceHistorySaveTimerRef.current = null;
      void flushQueuedSourceHistorySave();
    }, SOURCE_HISTORY_SAVE_DEBOUNCE_MS);
  }

  async function flushQueuedSourceHistorySave() {
    if (sourceHistorySaveRunningRef.current) return;
    sourceHistorySaveRunningRef.current = true;
    while (pendingSourceHistorySaveRef.current) {
      const pendingSave = pendingSourceHistorySaveRef.current;
      pendingSourceHistorySaveRef.current = null;
      try {
        await saveWorkbenchHistory(pendingSave.historyPath, pendingSave.historyFile);
      } catch (error) {
        if (mountedRef.current) {
          setInspectorNotice(error instanceof Error ? error.message : 'Source history save failed.');
        }
      }
    }
    sourceHistorySaveRunningRef.current = false;
  }

  async function persistCurrentSourceHistory(
    sourceHistoryController: HistoryController<string>,
    subject: ProjectAssetHistorySubject,
    transaction?: WorkbenchEditTransaction<string> | null,
  ): Promise<boolean> {
    if (transaction) {
      const currentDiskContents = await readWorkbenchSourceFile(subject.sourceFile);
      if (!currentDiskContents.ok) {
        setInspectorNotice(`Could not save ${transaction.label}; ${currentDiskContents.message}`);
        return false;
      }
      if (!areSourceContentsEqual(currentDiskContents.contents, transaction.before)) {
        sourceHistoryController.replaceValue(currentDiskContents.contents, { saved: true });
        await discardSourceHistoryLane(subject);
        const refreshedResult = await createSourceTreeResultFromContents(
          subject.sourceFile,
          currentDiskContents.contents,
        );
        if (refreshedResult.tree && refreshedResult.contents !== null) {
          sourceTreeResultRef.current = refreshedResult;
          if (mountedRef.current) setSourceTreeResult(refreshedResult);
        }
        latestSourceSubjectRef.current = subject;
        reconcileSourceHistoryLaneToDisk(subject, currentDiskContents.contents);
        refreshSourceHistoryView();
        setInspectorNotice(
          `Skipped stale edit for ${transaction.label}; reloaded ${subject.sourceFile} from disk.`,
        );
        return false;
      }
    }

    const timeline = transaction
      ? upsertDesignHistoryTimelineEntry(sourceHistoryFileRef.current.timeline, transaction)
      : sourceHistoryFileRef.current.timeline;
    const plan = createSourceFileSaveFlushPlan(sourceHistoryController, subject, 'auto');

    if (!plan.alreadySaved) {
      const planResult = await planHostedSourceWrite({
        contents: plan.contents,
        label: transaction?.label ?? `${subject.name} source save`,
        project: coreProjectSummary,
        subject: plan.subject,
        trigger: 'auto',
      });
      if (!planResult.ok) {
        setInspectorNotice(planResult.diagnostic);
        return false;
      }

      const writeResult = await writeWorkbenchSourceFile(subject.sourceFile, plan.contents, {
        normalize: false,
        overwrite: true,
      });
      if (!writeResult.ok) {
        setInspectorNotice(writeResult.message);
        return false;
      }
    }

    markSourceFileSaveFlushed(sourceHistoryController, plan);
    const nextHistoryFile = upsertPersistedHistoryLane(
      sourceHistoryFileRef.current,
      createPersistedHistoryLane(
        createProjectAssetEditOwner(subject),
        sourceHistoryController.getSnapshot(),
        SOURCE_HISTORY_MAX_ENTRIES,
        plan.extensions,
        'session-only',
      ),
      timeline,
    );

    sourceHistoryFileRef.current = nextHistoryFile;
    trackSourceHistorySubjectAfterPersist(subject, plan.contents, nextHistoryFile);
    refreshSourceHistoryView();
    queueSourceHistorySave(historyPath, nextHistoryFile);
    return true;
  }

  async function undoDesignEdit(context = getActiveSourceHistoryContext()): Promise<boolean> {
    if (context) {
      const transaction = context.history.undo();
      if (!transaction) return false;
      return restoreDesignHistoryTransaction(context.history, context.subject, transaction, 'undo');
    }
    setInspectorNotice('No undoable design edit is available.');
    return false;
  }

  async function redoDesignEdit(context = getActiveSourceHistoryContext()): Promise<boolean> {
    if (context) {
      const transaction = context.history.redo();
      if (!transaction) return false;
      return restoreDesignHistoryTransaction(context.history, context.subject, transaction, 'redo');
    }
    setInspectorNotice('No redoable design edit is available.');
    return false;
  }

  function undoSpecNoteHistory() {
    const historyController = latestSpecNoteHistoryRef.current ?? specNoteHistory;
    const transaction = historyController.undo();
    if (!transaction) {
      setInspectorNotice('No undoable note edit is available.');
      return false;
    }

    const nextComments = historyController.getSnapshot().value;
    persistSpecNoteComments(nextComments);
    persistSpecNoteHistory(historyController, transaction);
    setInspectorNotice(`Undid ${transaction.label}.`);
    return true;
  }

  function redoSpecNoteHistory() {
    const historyController = latestSpecNoteHistoryRef.current ?? specNoteHistory;
    const transaction = historyController.redo();
    if (!transaction) {
      setInspectorNotice('No redoable note edit is available.');
      return false;
    }

    const nextComments = historyController.getSnapshot().value;
    persistSpecNoteComments(nextComments);
    persistSpecNoteHistory(historyController, transaction);
    setInspectorNotice(`Redid ${transaction.label}.`);
    return true;
  }

  function undoWorkspaceHistory(): boolean {
    const entry = workspaceDesignUndoStackRef.current[workspaceDesignUndoStackRef.current.length - 1];
    if (!entry) return false;

    workspaceDesignUndoStackRef.current = workspaceDesignUndoStackRef.current.slice(0, -1);
    workspaceDesignRedoStackRef.current = [
      ...workspaceDesignRedoStackRef.current.slice(-(WORKSPACE_HISTORY_MAX_ENTRIES - 1)),
      entry,
    ];
    syncWorkspaceHistoryStatus();
    // The inverse touches the filesystem + pages.json, so run it through the
    // serial edit queue to keep it ordered against other source mutations.
    void sourceInspectorEditQueueRef.current.enqueue(async () => {
      try {
        await entry.undo();
        setInspectorNotice(`Undid ${entry.label}.`);
      } catch (error) {
        setInspectorNotice(error instanceof Error ? error.message : 'Undo failed.');
      }
    }, { skipBeforeOperation: true }).catch(reportSourceInspectorEditError);
    return true;
  }

  function redoWorkspaceHistory(): boolean {
    const entry = workspaceDesignRedoStackRef.current[workspaceDesignRedoStackRef.current.length - 1];
    if (!entry) return false;

    workspaceDesignRedoStackRef.current = workspaceDesignRedoStackRef.current.slice(0, -1);
    workspaceDesignUndoStackRef.current = [
      ...workspaceDesignUndoStackRef.current.slice(-(WORKSPACE_HISTORY_MAX_ENTRIES - 1)),
      entry,
    ];
    syncWorkspaceHistoryStatus();
    void sourceInspectorEditQueueRef.current.enqueue(async () => {
      try {
        await entry.redo();
        setInspectorNotice(`Redid ${entry.label}.`);
      } catch (error) {
        setInspectorNotice(error instanceof Error ? error.message : 'Redo failed.');
      }
    }, { skipBeforeOperation: true }).catch(reportSourceInspectorEditError);
    return true;
  }

  function undoRuntimeDesignEdit() {
    const entry = runtimeDesignUndoStackRef.current[runtimeDesignUndoStackRef.current.length - 1];
    if (!entry || !activeRuntimeProjectionKey || entry.projectionKey !== activeRuntimeProjectionKey) return false;

    runtimeDesignUndoStackRef.current = runtimeDesignUndoStackRef.current.slice(0, -1);
    runtimeDesignRedoStackRef.current = [
      ...runtimeDesignRedoStackRef.current.slice(-(RUNTIME_DESIGN_HISTORY_MAX_ENTRIES - 1)),
      entry,
    ];
    const nextProjection = { key: entry.projectionKey, tree: cloneEditableDocumentTree(entry.before) };
    runtimeProjectionRef.current = nextProjection;
    setRuntimeProjection(nextProjection);
    setInspectorNotice(`Undid ${entry.label}.`);
    return true;
  }

  function redoRuntimeDesignEdit() {
    const entry = runtimeDesignRedoStackRef.current[runtimeDesignRedoStackRef.current.length - 1];
    if (!entry || !activeRuntimeProjectionKey || entry.projectionKey !== activeRuntimeProjectionKey) return false;

    runtimeDesignRedoStackRef.current = runtimeDesignRedoStackRef.current.slice(0, -1);
    runtimeDesignUndoStackRef.current = [
      ...runtimeDesignUndoStackRef.current.slice(-(RUNTIME_DESIGN_HISTORY_MAX_ENTRIES - 1)),
      entry,
    ];
    const nextProjection = { key: entry.projectionKey, tree: cloneEditableDocumentTree(entry.after) };
    runtimeProjectionRef.current = nextProjection;
    setRuntimeProjection(nextProjection);
    setInspectorNotice(`Redid ${entry.label}.`);
    return true;
  }

  async function restoreDesignHistoryTransaction(
    sourceHistoryController: HistoryController<string>,
    subject: ProjectAssetHistorySubject,
    transaction: WorkbenchEditTransaction<string>,
    direction: 'redo' | 'undo',
  ): Promise<boolean> {
    const expectedCurrentContents = direction === 'undo' ? transaction.after : transaction.before;
    const currentDiskContents = await readWorkbenchSourceFile(subject.sourceFile);
    if (!currentDiskContents.ok) {
      setInspectorNotice(`Could not ${direction} ${transaction.label}; ${currentDiskContents.message}`);
      return false;
    }
    if (!areSourceContentsEqual(currentDiskContents.contents, expectedCurrentContents)) {
      sourceHistoryController.replaceValue(currentDiskContents.contents, { saved: true });
      await discardSourceHistoryLane(subject);
      await refreshSourceTreeFromContents(subject.sourceFile, currentDiskContents.contents);
      setInspectorNotice(`Skipped stale ${direction} for ${transaction.label}; reloaded ${subject.sourceFile} from disk.`);
      return false;
    }

    const restoredContents = sourceHistoryController.getSnapshot().value;
    const restoredResult = await createSourceTreeResultFromContents(subject.sourceFile, restoredContents);
    if (
      !restoredResult.tree ||
      restoredResult.contents === null ||
      !areSourceContentsEqual(restoredResult.contents, restoredContents)
    ) {
      if (mountedRef.current) {
        setSourceTreeResult((current) => {
          if (!current || current.cacheKey !== restoredResult.cacheKey) return current;
          return restoredResult;
        });
      }
      setInspectorNotice(`Could not ${direction} ${transaction.label}; the restored source could not be parsed.`);
      return false;
    }
    // The tree and the selection that belongs to it are applied together, with
    // no await between them. A selection is derived from a tree, so a render
    // that sees the restored tree and the old selection is a state the editor
    // should never be in: undoing a paste removes the node that was selected,
    // and for that gap the layer resolves to the document root. An edit issued
    // there targets the root — which has no parent to paste into — so it is
    // dropped with only a transient notice, and the user sees an edit vanish.
    if (mountedRef.current) {
      setSourceTreeResult((current) => {
        if (!current || current.cacheKey !== restoredResult.cacheKey) return current;
        return restoredResult;
      });
      restoreDesignHistorySelection(
        direction === 'undo' ? transaction.selectionBefore : transaction.selectionAfter,
        restoredResult.tree,
        subject,
      );
    }
    const persisted = await persistCurrentSourceHistory(sourceHistoryController, subject);
    if (!persisted) return false;

    setInspectorNotice(`${direction === 'undo' ? 'Undid' : 'Redid'} ${transaction.label}.`);
    return true;
  }

  function restoreDesignHistorySelection(
    snapshot: WorkbenchSelectionSnapshot | undefined,
    restoredTree: EditableDocumentTree | null,
    subject: ProjectAssetHistorySubject,
  ) {
    if (!snapshot || snapshot.activeDocumentId !== subject.id) return;
    const selectedSourceNodeId = snapshot.selectedSourceNodeId ?? null;
    const restoredLayerId = resolveSourceSelectionAfterRefresh(restoredTree, selectedSourceNodeId);
    applyDesignSelectionChange(createDesignHistorySelectionState(
      latestSelectionRef.current,
      restoredTree,
      restoredLayerId,
      snapshot,
      subject,
    ));
  }

  function resolveSourceSelectionAfterRefresh(
    refreshedTree: EditableDocumentTree | null,
    nextLayerId: string | null,
  ): string | null {
    if (!nextLayerId || !refreshedTree) return nextLayerId;
    const survivingLayerId = findEditableTreeNodeInPreviewTree(refreshedTree.root, nextLayerId)?.node.id ?? refreshedTree.root.id;
    return resolveDesignSelectableLayerId(refreshedTree.root, survivingLayerId);
  }

  function enqueueSourceHistoryUndoRedo(
    direction: 'redo' | 'undo',
    options: {
      afterSuccess?: () => void;
      canRun?: () => boolean;
    } = {},
  ): boolean {
    const currentContext = getActiveSourceHistoryContext();
    if (!currentContext) return false;
    const snapshot = currentContext.history.getSnapshot();
    if (direction === 'undo' && !snapshot.canUndo) return false;
    if (direction === 'redo' && !snapshot.canRedo) return false;

    void sourceInspectorEditQueueRef.current.enqueue(async () => {
      if (options.canRun && !options.canRun()) return;
      const queuedContext = getActiveSourceHistoryContext();
      if (!queuedContext) return;
      const changed = direction === 'undo'
        ? await undoDesignEdit(queuedContext)
        : await redoDesignEdit(queuedContext);
      if (changed) options.afterSuccess?.();
    }).catch(reportSourceInspectorEditError);
    return true;
  }

  // Walks the active lane's stack and nothing else. An entry whose payload has
  // already gone (a note lane replaced, a source lane discarded as stale) is
  // dropped and the walk continues, so a dead entry never blocks the one under
  // it. Runtime and workspace are consulted only once this page has nothing
  // left: they are separate surfaces, not part of any page's order.
  function undoFromSourceHistory(): boolean {
    const laneId = getActiveDesignHistoryLaneId();
    if (laneId) {
      for (;;) {
        const entry = getLastDesignPageHistoryEntry(laneId, 'undo');
        if (!entry) break;
        if (entry.kind === 'selection') {
          undoDesignSelectionHistory(entry);
          moveDesignPageHistoryEntry(laneId, 'undo', entry);
          return true;
        }
        if (entry.kind === 'notes') {
          if (!undoSpecNoteHistory()) {
            dropDesignPageHistoryEntry(laneId, 'undo');
            continue;
          }
          moveDesignPageHistoryEntry(laneId, 'undo', entry);
          return true;
        }
        if (!getActiveSourceHistoryContext()?.history.getSnapshot().canUndo) {
          dropDesignPageHistoryEntry(laneId, 'undo');
          continue;
        }
        return enqueueSourceHistoryUndoRedo('undo', {
          canRun: () => getLastDesignPageHistoryEntry(laneId, 'undo')?.kind === 'source',
          afterSuccess: () => moveDesignPageHistoryEntry(laneId, 'undo', entry),
        });
      }
    }
    if (undoRuntimeDesignEdit()) return true;
    return undoWorkspaceHistory();
  }

  function redoFromSourceHistory(): boolean {
    const laneId = getActiveDesignHistoryLaneId();
    if (laneId) {
      for (;;) {
        const entry = getLastDesignPageHistoryEntry(laneId, 'redo');
        if (!entry) break;
        if (entry.kind === 'selection') {
          redoDesignSelectionHistory(entry);
          moveDesignPageHistoryEntry(laneId, 'redo', entry);
          return true;
        }
        if (entry.kind === 'notes') {
          if (!redoSpecNoteHistory()) {
            dropDesignPageHistoryEntry(laneId, 'redo');
            continue;
          }
          moveDesignPageHistoryEntry(laneId, 'redo', entry);
          return true;
        }
        if (!getActiveSourceHistoryContext()?.history.getSnapshot().canRedo) {
          dropDesignPageHistoryEntry(laneId, 'redo');
          continue;
        }
        return enqueueSourceHistoryUndoRedo('redo', {
          canRun: () => getLastDesignPageHistoryEntry(laneId, 'redo')?.kind === 'source',
          afterSuccess: () => moveDesignPageHistoryEntry(laneId, 'redo', entry),
        });
      }
    }
    if (redoRuntimeDesignEdit()) return true;
    return redoWorkspaceHistory();
  }

  useEffect(() => {
    function handleDesignHistoryShortcut(event: KeyboardEvent) {
      if (shouldIgnoreDesignHistoryShortcut(event.target)) return;
      const isModifierPressed = event.metaKey || event.ctrlKey;
      if (!isModifierPressed || event.altKey) return;

      const key = event.key.toLowerCase();
      const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
      const wantsUndo = key === 'z' && !event.shiftKey;
      if (!wantsUndo && !wantsRedo) return;

      if (isSpecNoteLocalHistoryTarget(event.target)) return;
      if (isSpecNoteHistoryShortcutTarget(event.target)) {
        const handled = wantsRedo ? redoSpecNoteHistory() : undoSpecNoteHistory();
        if (!handled) return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (wantsRedo) {
        if (!redoFromSourceHistory()) return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (!undoFromSourceHistory()) return;
      event.preventDefault();
      event.stopPropagation();
    }

    function handleDesignHistoryBeforeInput(event: InputEvent) {
      if (shouldIgnoreDesignHistoryShortcut(event.target)) return;
      if (isSpecNoteLocalHistoryTarget(event.target)) return;
      if (isSpecNoteHistoryShortcutTarget(event.target)) {
        const handled = event.inputType === 'historyUndo'
          ? undoSpecNoteHistory()
          : event.inputType === 'historyRedo'
            ? redoSpecNoteHistory()
            : false;
        if (!handled) return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.inputType === 'historyUndo') {
        if (!undoFromSourceHistory()) return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.inputType === 'historyRedo') {
        if (!redoFromSourceHistory()) return;
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener('keydown', handleDesignHistoryShortcut, true);
    window.addEventListener('beforeinput', handleDesignHistoryBeforeInput, true);
    return () => {
      window.removeEventListener('keydown', handleDesignHistoryShortcut, true);
      window.removeEventListener('beforeinput', handleDesignHistoryBeforeInput, true);
    };
  });

  useEffect(() => {
    function handleDesignStructureShortcut(event: KeyboardEvent) {
      if (shouldIgnoreDesignEditorShortcut(event.target)) return;
      if (!isDesignEditorShortcutContext(event.target)) return;
      if (!event.metaKey && !event.ctrlKey && event.altKey && !event.shiftKey && isDesignShortcutKey(event, 'w', 'KeyW')) {
        event.preventDefault();
        event.stopPropagation();
        closeActiveDesignTargetCommandRef.current();
        return;
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && isDesignShortcutKey(event, 'i', 'KeyI')) {
        event.preventDefault();
        event.stopPropagation();
        openSelectedComponentPicker();
        return;
      }

      const isModifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isModifierPressed && !event.altKey && !event.shiftKey && key === 'c') {
        event.preventDefault();
        event.stopPropagation();
        executeDesignSourceEditShortcut('copy');
        return;
      }

      if (isModifierPressed && !event.altKey && !event.shiftKey && key === 'x') {
        event.preventDefault();
        event.stopPropagation();
        executeDesignSourceEditShortcut('cut');
        return;
      }

      if (isModifierPressed && !event.altKey && key === 'v') {
        event.preventDefault();
        event.stopPropagation();
        executeDesignSourceEditShortcut(event.shiftKey ? 'paste-inside' : 'paste-below');
        return;
      }

      if (isModifierPressed && !event.altKey && !event.shiftKey && key === 'd') {
        event.preventDefault();
        event.stopPropagation();
        executeDesignSourceEditShortcut('duplicate');
        return;
      }

      if (!event.altKey && (
        (!isModifierPressed && event.shiftKey && isDesignShortcutKey(event, 'w', 'KeyW')) ||
        (isModifierPressed && event.shiftKey && isDesignShortcutKey(event, 'g', 'KeyG'))
      )) {
        event.preventDefault();
        event.stopPropagation();
        if (!hasSelectedSourceStructureEditTarget) {
          setInspectorNotice('Select source-backed layers before wrapping.');
          return;
        }
        openSourceWrapSelectionModal();
        return;
      }

      const isStructureShortcutTarget = isDesignStructureShortcutTarget(event.target);
      const globalMoveIntent = getDesignLayerKeyboardMoveIntent(event, {
        allowUnmodifiedVertical: isStructureShortcutTarget,
      });
      if (globalMoveIntent && moveSelectedDesignLayerFromKeyboard(globalMoveIntent)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!isStructureShortcutTarget) return;

      if (!isModifierPressed && !event.altKey && (event.key === 'Backspace' || event.key === 'Delete')) {
        event.preventDefault();
        event.stopPropagation();
        const reason = getSourceStructureEditBlockReason();
        if (reason) {
          setInspectorNotice(reason);
          return;
        }
        void updateSourceInspectorStructure('delete');
      }
    }

    function handleDesignCutEvent(event: ClipboardEvent) {
      if (shouldIgnoreDesignEditorShortcut(event.target)) return;
      if (!isDesignEditorShortcutContext(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      executeDesignSourceEditShortcut('cut');
    }

    window.addEventListener('keydown', handleDesignStructureShortcut, true);
    window.addEventListener('cut', handleDesignCutEvent, true);
    return () => {
      window.removeEventListener('keydown', handleDesignStructureShortcut, true);
      window.removeEventListener('cut', handleDesignCutEvent, true);
    };
  });

  function handleRuntimePageKeyboardShortcut(shortcut: RuntimePageKeyboardShortcut) {
    if (shortcut.action === 'copy') {
      executeDesignSourceEditShortcut('copy');
      return;
    }
    if (shortcut.action === 'cut') {
      executeDesignSourceEditShortcut('cut');
      return;
    }
    if (shortcut.action === 'insert-child') {
      openSelectedComponentPicker();
      return;
    }
    if (shortcut.action === 'paste') {
      executeDesignSourceEditShortcut(shortcut.placement === 'inside' ? 'paste-inside' : 'paste-below');
      return;
    }
    if (shortcut.action === 'wrap') {
      if (!hasSelectedSourceStructureEditTarget) {
        setInspectorNotice('Select source-backed layers before wrapping.');
        return;
      }
      openSourceWrapSelectionModal();
      return;
    }
    if (shortcut.action === 'duplicate' || shortcut.action === 'delete') {
      const reason = getSourceStructureEditBlockReason();
      if (reason) {
        setInspectorNotice(reason);
        return;
      }
      if (shortcut.action === 'duplicate') executeDesignSourceEditShortcut('duplicate');
      else void updateSourceInspectorStructure('delete');
      return;
    }
    if (shortcut.action === 'move') {
      if (!selectedLayer) return;
      moveDesignPreviewNode(selectedLayer.id, shortcut.intent);
    }
  }

  return (
    <WorkbenchEditorFrame
      className="wb-design-editor"
      ariaLabel="Design editor"
      inspectorWidth={inspectorWidth}
      layout="sidebar-surface-inspector"
      sidebarWidth={sidebarWidth}
    >
      {designEditorWarningToast ? (
        <div className="wb-design-editor-toast" role="status">
          <span className="wb-design-editor-toast__message">{designEditorWarningToast}</span>
          <button
            type="button"
            className="wb-design-editor-toast__dismiss"
            aria-label="Dismiss warning"
            onClick={() => setDesignEditorWarningToast(null)}
          >
            ×
          </button>
        </div>
      ) : null}
      <WorkbenchTopbarActions>
        <Button
          className="wb-topbar-preview-button"
          tone="ghost"
          disabled={!activeDesignTarget || activeDesignTarget.kind !== 'page'}
          title="Open this page in a new browser tab (without the design editor chrome)"
          onClick={() => void openBrowserPreview()}
        >
          Browser preview
        </Button>
        <Button
          className="wb-topbar-export-button"
          tone="ghost"
          disabled={!activeDesignTarget}
          title="Export the current page/component for developer handoff"
          onClick={() => void exportForDeveloper()}
        >
          Export
        </Button>
      </WorkbenchTopbarActions>
      <WorkbenchEditorSidebar
        ref={sidebarRef}
        className={[
          'wb-design-sidebar',
          sourceSectionCollapsed ? 'wb-design-sidebar--source-collapsed' : '',
          layerSectionCollapsed ? 'wb-design-sidebar--layers-collapsed' : '',
        ].filter(Boolean).join(' ')}
        ariaLabel="Design layers"
        navigation={surfaceNav}
        primaryListHeight={sourceSectionCollapsed ? 0 : sourceListHeight}
      >
        <DesignSourceTargetList
          activeSource={projectTreeSource.source}
          collapsedGroupIds={collapsedSourceGroupIds}
          collapsedFolderPaths={collapsedPageFolders}
          folderPaths={pageFolderPaths}
          editingTargetKey={editingTargetSource === 'tree' ? editingTargetKey : null}
          editingFolderPath={editingFolderPath}
          folderNameDraft={folderNameDraft}
          draggingPageTargetKey={draggingPageTargetKey}
          draggingFolderPath={draggingFolderPath}
          dropIndicator={sourceTreeDropIndicator}
          sourceCollapsed={sourceSectionCollapsed}
          targetNameDraft={targetNameDraft}
          targets={designTargets}
          onCancelRename={cancelRenamingDesignTarget}
          onChangeRenameDraft={setTargetNameDraft}
          onCommitRename={(target) => void commitDesignTargetName(target)}
          onCreatePage={(folder?: string) => void createDesignPage(folder ?? '')}
          onDeletePage={(target) => void deleteDesignPage(target)}
          onDuplicatePage={(target) => void duplicateDesignPage(target)}
          onSelectTarget={selectDesignTarget}
          onStartRename={(target) => startRenamingDesignTarget(target, 'tree')}
          onToggleSource={toggleDesignSourceSectionCollapsed}
          onToggleGroup={toggleDesignSourceGroupCollapsed}
          onCreateFolder={() => void createDesignFolder('')}
          onUndoWorkspace={() => { undoWorkspaceHistory(); }}
          onRedoWorkspace={() => { redoWorkspaceHistory(); }}
          workspaceHistoryStatus={workspaceHistoryStatus}
          onCreateSubfolder={(folderPath) => void createDesignFolder(folderPath)}
          onToggleFolder={toggleDesignPageFolderCollapsed}
          onStartRenameFolder={startRenamingDesignFolder}
          onChangeFolderNameDraft={setFolderNameDraft}
          onCommitRenameFolder={(folderPath) => void renameDesignFolder(folderPath, folderNameDraft)}
          onCancelRenameFolder={cancelRenamingDesignFolder}
          onDeleteFolder={(folderPath) => void deleteDesignFolder(folderPath)}
          onMovePageToFolder={(target, folderPath) => void movePageToFolder(target, folderPath)}
          onReorderPage={(draggedKey, targetKey, position) => void reorderDesignPage(draggedKey, targetKey, position)}
          onReorderFolder={(draggedPath, targetPath, position) => void reorderDesignFolder(draggedPath, targetPath, position)}
          onNestFolder={(draggedPath, parentPath) => void nestDesignFolder(draggedPath, parentPath)}
          onPageDragStateChange={setDraggingPageTargetKey}
          onFolderDragStateChange={setDraggingFolderPath}
          onDropIndicatorChange={setSourceTreeDropIndicator}
        />
        <WorkbenchSidebarSplitHandle
          label="Resize source and layers"
          onPointerDown={startSidebarSplitResize}
        />
        <DesignLayerList
          assets={assets}
          canEditSourceFields={hasSourceStructureEditTarget}
          components={components.components}
          documentRoot={previewDocument?.root ?? null}
          activeNoteLinkDragId={activeNoteLinkDragId}
          collapsedLayerIds={visibleCollapsedLayerIds}
          layersCollapsed={layerSectionCollapsed}
          layers={visiblePreviewLayers}
          previewAppearance={previewAppearance}
          previewTokenModes={previewTokenModes}
          selectedLayerId={selectedLayerId}
          selectedLayerIds={selectedLayerIds}
          tokenRegistry={tokenRegistry}
          onInsertComponent={(component, layer, node, targetIndex) => void updateSourceInspectorInsertComponent(component, layer, node, targetIndex)}
          onInsertChild={(templateId, layer, node, targetIndex) => void updateSourceInspectorInsertChild(templateId, layer, node, targetIndex)}
          onConnectedArrayItemAdd={updateDesignInspectorReferencedArrayProp}
          onNoteLinkDrop={linkSpecNoteToDesignLayer}
          onMoveLayer={(layer, node, targetParentNode, targetIndex) => void updateSourceInspectorMoveNode(layer, node, targetParentNode, targetIndex)}
          onSelectLayer={selectDesignLayer}
          onToggleCollapsed={toggleDesignLayerCollapsed}
          onToggleLayers={toggleDesignLayerSectionCollapsed}
        />
      </WorkbenchEditorSidebar>

      <WorkbenchResizeHandle
        label="Resize sidebar"
        placement="sidebar"
        onPointerDown={startSidebarWidthResize}
      />

      <WorkbenchEditorSurface className="wb-design-preview" ariaLabel="Design preview">
        <DesignSourceTargetTabs
          activeSource={projectTreeSource.source}
          editingTargetKey={editingTargetSource === 'tab' ? editingTargetKey : null}
          nameDraft={targetNameDraft}
          targets={openDesignTargets}
          onCancelRename={cancelRenamingDesignTarget}
          onCloseTarget={closeDesignTarget}
          onCommitRename={(target) => void commitDesignTargetName(target)}
          onDraftNameChange={setTargetNameDraft}
          onReorderTarget={reorderDesignTargetTab}
          onStartRename={(target) => startRenamingDesignTarget(target, 'tab')}
          onSelectTarget={selectDesignTarget}
          trailing={(
            <IconButton
              ref={previewSettingsButtonRef}
              className="wb-design-preview-settings-button"
              label="Preview settings"
              title="Preview settings"
              onClick={() => setPreviewSettingsModalOpen((open) => !open)}
            >
              <MonitorSmartphone size={14} />
            </IconButton>
          )}
        />
        <DesignPreviewStage
          assets={assets}
          documentTree={previewDocument}
          canEditSourceFields={hasSelectedSourceFieldEditTarget}
          canEditSourceStructure={hasSourceStructureEditTarget}
          runtimePage={activeRuntimePageProjection}
          runtimeStory={activeRuntimeStory}
          runtimeStoryArgs={activeRuntimeStoryArgs}
          previewViewport={previewViewport}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          selectedLayerId={selectedLayerId}
          selectedLayerIds={selectedLayerIds}
          selectedLayerReadOnly={selectedLayerReadOnly}
          activeNoteBoxDraft={activeNoteBoxDraft}
          activeNoteHighlightBoxId={activeNotePreviewBoxId}
          activeNoteHighlightBoxes={activeNotePreviewHighlightBoxes}
          activeNoteLinkDragId={activeNoteLinkDragId}
          activeNotePreviewNoteId={activeNotePreviewNote?.id ?? null}
          activeNotePreviewLayerId={activeNotePreviewLayerId}
          tailwindCssMode={tailwindCssMode}
          tokenRegistry={tokenRegistry}
          onNoteHighlightBoxCreate={addSpecNoteHighlightBox}
          onNoteHighlightBoxChange={updateSpecNoteHighlightBoxRect}
          onNoteHighlightBoxDraftEnd={cancelSpecNoteHighlightBoxDraft}
          onNoteHighlightBoxPreviewChange={setActiveNotePreviewBoxId}
          onRuntimeProjectionTreeChange={updateRuntimeProjectionTree}
          onRuntimePageKeyboardShortcut={handleRuntimePageKeyboardShortcut}
          onCssClassEffectivenessChange={updateCssClassEffectivenessReport}
          cssClassEffectivenessEnabled={
            cssClassEffectivenessRequested && cssClassEffectivenessSelectionArmed
          }
          onClearSelection={clearDesignLayerSelection}
          onCopySelection={() => executeDesignSourceEditShortcut('copy')}
          onCutSelection={() => executeDesignSourceEditShortcut('cut')}
          onDeleteSelection={() => {
            const reason = getSourceStructureEditBlockReason();
            if (reason) {
              setInspectorNotice(reason);
              return;
            }
            void updateSourceInspectorStructure('delete');
          }}
          onDuplicateSelection={() => {
            const reason = getSourceStructureEditBlockReason();
            if (reason) {
              setInspectorNotice(reason);
              return;
            }
            executeDesignSourceEditShortcut('duplicate');
          }}
          onDrillIntoLayer={drillIntoDesignPreviewNode}
          onHistoryRedo={redoFromSourceHistory}
          onHistoryUndo={undoFromSourceHistory}
          onInsertChild={openSelectedComponentPicker}
          onMoveLayer={moveDesignPreviewNode}
          onMoveLayerToParent={moveDesignPreviewNodeToParent}
          onOpenPreviewModeModal={() => setPreviewModeModalOpen(true)}
          onPasteNode={(placement) => executeDesignSourceEditShortcut(placement === 'inside' ? 'paste-inside' : 'paste-below')}
          onWrapSelection={openSourceWrapSelectionModal}
          onPreviewAppearanceChange={updateDesignPreviewAppearance}
          onPreviewViewportChange={updateDesignPreviewViewport}
          onSelectLayer={selectDesignPreviewNode}
          onNoteLinkDrop={linkSpecNoteToDesignLayer}
          onSourceNodeComponentPropChange={updateDesignInspectorNodeComponentProp}
          onStyleDeclarationsChange={updateDesignPreviewNodeStyleDeclarations}
          previewModeOpen={previewModeModalOpen}
          previewModeSummary={formatPreviewTokenModeSummary(tokenRegistry, previewTokenModes)}
          previewLoadState={previewLoadState}
          previewDrillPath={previewDrillPath}
          previewAppearance={previewAppearance}
        />
        {previewSettingsModalOpen && previewSettingsPopoverStyle ? (
          <DesignPreviewSettingsPopover
            appearance={previewAppearance}
            frameRef={previewSettingsPopoverRef}
            previewTokenModes={previewTokenModes}
            registry={tokenRegistry}
            style={previewSettingsPopoverStyle}
            viewport={previewViewport}
            onAppearanceChange={updateDesignPreviewAppearance}
            onClose={() => setPreviewSettingsModalOpen(false)}
            onPreviewTokenModeChange={(collectionId, modeId) => {
              const currentSelection = latestSelectionRef.current;
              commitDesignSelectionChange(createDesignPreviewTokenModesSelectionState(currentSelection, {
                ...(currentSelection.extensions.previewTokenModes ?? {}),
                [collectionId]: modeId,
              }));
            }}
            onViewportChange={updateDesignPreviewViewport}
          />
        ) : null}
        {previewModeModalOpen ? (
          <DesignPreviewTokenModeModal
            registry={tokenRegistry}
            value={previewTokenModes}
            onChange={(collectionId, modeId) => {
              const currentSelection = latestSelectionRef.current;
              commitDesignSelectionChange(createDesignPreviewTokenModesSelectionState(currentSelection, {
                ...(currentSelection.extensions.previewTokenModes ?? {}),
                [collectionId]: modeId,
              }));
            }}
            onClose={() => setPreviewModeModalOpen(false)}
          />
        ) : null}
        {wrapSelectionModalOpen ? (
          <DesignWrapSelectionModal
            assets={assets}
            components={wrappableComponents}
            previewAppearance={previewAppearance}
            previewTokenModes={previewTokenModes}
            selectedCount={resolveDesignWrappableSourceNodes({
              root: previewDocument?.root ?? null,
              selectedLayerIds,
              selectedNode: selectedSourceNode,
              sourceFile: sourceEditSubject?.sourceFile ?? null,
            }).length}
            tokenRegistry={tokenRegistry}
            onClose={() => setWrapSelectionModalOpen(false)}
            onSelectComponent={(component) => wrapSourceSelectionInComponent(component)}
            onSelectHtmlTag={(tagName) => void wrapSourceSelectionInHtmlTag(tagName)}
          />
        ) : null}
        {sourceComponentPickerOpen && selectedLayer && selectedSourceNode ? (
          <DesignComponentPickerModal
            assets={assets}
            components={canInsertComponentIntoSourceNode(selectedSourceNode) ? sourceInsertComponents : []}
            htmlTemplates={getSourceInsertTemplatesForNode(selectedSourceNode)}
            initialMode={getSourceInsertPickerInitialMode(canInsertComponentIntoSourceNode(selectedSourceNode))}
            previewAppearance={previewAppearance}
            previewTokenModes={previewTokenModes}
            targetLabel={selectedLayer.label}
            tokenRegistry={tokenRegistry}
            onClose={() => setSourceComponentPickerOpen(false)}
            onSelectComponent={(component) => {
              setSourceComponentPickerOpen(false);
              void updateSourceInspectorInsertComponent(
                component,
                selectedLayer,
                selectedSourceNode,
                selectedComponentPickerTargetIndex,
              );
            }}
            onSelectHtmlTemplate={(template) => {
              setSourceComponentPickerOpen(false);
              void updateSourceInspectorInsertChild(
                template.id,
                selectedLayer,
                selectedSourceNode,
                selectedComponentPickerTargetIndex,
              );
            }}
          />
        ) : null}
        {codexHandoffModal ? (
          <CodexDesignHandoffModal
            copyStatus={codexHandoffCopyStatus}
            handoff={codexHandoffModal.handoff}
            prompt={codexHandoffModal.prompt}
            onClose={() => setCodexHandoffModal(null)}
            onCopyStatusChange={setCodexHandoffCopyStatus}
          />
        ) : null}
        {developerExportModal ? (
          <DeveloperExportModal
            copyStatus={developerExportCopyStatus}
            payload={developerExportModal}
            onClose={() => setDeveloperExportModal(null)}
            onCopyStatusChange={setDeveloperExportCopyStatus}
          />
        ) : null}
      </WorkbenchEditorSurface>

      <WorkbenchResizeHandle
        label="Resize inspector"
        placement="inspector"
        onPointerDown={startInspectorWidthResize}
      />

      <WorkbenchEditorPanel className="wb-design-inspector" ariaLabel="Inspector" variant="inspector">
        <DesignInspectorPanel
          canEditSourceFields={canEditInspectorFields}
          assetRegistry={assets}
          componentStory={selectedSourceComponentStory}
          diagnostic={sourceDiagnostic}
          editabilityDiagnostic={selectionScope.editabilityDiagnostic}
          editableSourceNode={editableInspectorNode}
          inspectorTokenPickerFilters={inspectorTokenPickerFilters}
          isRuntimeEditTarget={hasRuntimeDesignEditTarget}
          notice={inspectorNoticeForSelection}
          runtimeFallbackGuidance={runtimeFallbackGuidance || null}
          comments={activeSpecNoteComments}
          selectedLayer={selectedLayer}
          selectedLayerIds={selectedLayerIds}
          cssClassEffectivenessReport={cssClassEffectivenessReport}
          onCssClassEffectivenessRequestChange={setCssClassEffectivenessRequested}
          sourceDocumentRoot={previewDocument?.root ?? null}
          designStateOverrides={activeDesignStateOverrides}
          designStates={activeDesignStates}
          onDesignStateOverrideChange={changeDesignStateOverride}
          selectedSourceNode={selectedSourceNodeForInspector}
          onHistoryRedo={redoFromSourceHistory}
          onHistoryUndo={undoFromSourceHistory}
          noteHistoryCanRedo={specNoteHistorySnapshot.canRedo}
          noteHistoryCanUndo={specNoteHistorySnapshot.canUndo}
          onCommentsChange={commitSpecNoteCommentsChange}
          onNoteHistoryRedo={redoSpecNoteHistory}
          onNoteHistoryUndo={undoSpecNoteHistory}
          onNoteLinkDragEnd={() => setActiveNoteLinkDragId(null)}
          onNoteLinkDragStart={setActiveNoteLinkDragId}
          activeNoteBoxDraftNoteId={activeNoteBoxDraft?.noteId ?? null}
          activeNotePreviewBoxId={activeNotePreviewBoxId}
          specNoteTarget={activeSpecNoteTarget}
          onNoteHighlightBoxesClear={clearSpecNoteHighlightBoxes}
          onNoteHighlightBoxBodyChange={updateSpecNoteHighlightBoxBody}
          onNoteHighlightBoxDelete={deleteSpecNoteHighlightBox}
          onNoteHighlightBoxDraftStart={startSpecNoteHighlightBoxDraft}
          onNoteHighlightBoxPreviewChange={setActiveNotePreviewBoxId}
          onNoteHighlightBoxRename={renameSpecNoteHighlightBox}
          onNoteTargetPreviewChange={setActiveNotePreviewNoteId}
          openSpecNoteId={openSpecNoteId}
          onSourceAttributeChange={updateDesignInspectorAttribute}
          onSourceInlineSvgIconChange={updateSourceInspectorInlineSvgIcon}
          onSourceBindingChange={updateDesignInspectorBinding}
          onSourceComponentPropChange={updateDesignInspectorComponentProp}
          onSourceComponentPropsChange={updateDesignInspectorComponentProps}
          onSourceComponentTypeChange={updateDesignInspectorComponentType}
          onSourceNodeComponentPropChange={updateDesignInspectorNodeComponentProp}
          onSourceReferencedArrayPropChange={updateDesignInspectorReferencedArrayProp}
          onSourceExtractSelectionToMap={updateDesignInspectorExtractSelectionToMap}
          onSourceNodeStyleDeclarationChange={updateDesignInspectorNodeStyleDeclaration}
          onSourceElementTagNameChange={updateDesignInspectorElementTagName}
          onSourceStyleDeclarationChange={updateDesignInspectorStyleDeclaration}
          onSourceTextContentChange={updateDesignInspectorTextContent}
          onSourceTextI18nBindingChange={(tokenName) => void updateSourceInspectorTextI18nBinding(tokenName)}
          onTokenPickerScopeFilterChange={updateInspectorTokenPickerFilter}
          previewColorSchemeSide={previewColorSchemeSide}
          previewTokenModes={selectedSourcePreviewTokenModes}
          projectClassCatalog={projectClassCatalog}
          tokenRegistry={tokenRegistry}
        />
      </WorkbenchEditorPanel>
    </WorkbenchEditorFrame>
  );
}

type DesignLibraryComponent = WorkbenchComponentRegistry['components'][number];
type DesignLibraryPage = WorkbenchPageRegistry['pages'][number];
export function DesignPreviewTokenModeModal({
  onChange,
  onClose,
  registry,
  value,
}: {
  onChange: (collectionId: string, modeId: string) => void;
  onClose: () => void;
  registry: TokenRegistry;
  value: PreviewTokenModeSelection;
}) {
  const collections = registry.collections.filter((collection) => collection.modes.length > 0);
  if (collections.length === 0) return null;

  return (
    <ModalLayer title="Preview token modes" onClose={onClose}>
      <ModalFieldList ariaLabel="Preview token mode collections">
        {collections.map((collection) => {
          const selectedModeId = getPreviewTokenModeId(collection, value);

          return (
            <ModalField
              key={collection.id}
              label={collection.name}
              meta={`${collection.tokens.length} tokens · ${collection.modes.length} modes`}
            >
              <SelectControl
                aria-label={`${collection.name} preview token mode`}
                disabled={collection.modes.length <= 1}
                value={selectedModeId}
                onValueChange={(modeId) => onChange(collection.id, modeId)}
              >
                {collection.modes.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.name}</option>
                ))}
              </SelectControl>
            </ModalField>
          );
        })}
      </ModalFieldList>
    </ModalLayer>
  );
}

function DesignPreviewSettingsPopover({
  appearance,
  frameRef,
  onAppearanceChange,
  onClose,
  onPreviewTokenModeChange,
  onViewportChange,
  previewTokenModes,
  registry,
  style,
  viewport,
}: {
  appearance: DesignPreviewAppearance;
  frameRef: RefObject<HTMLDivElement | null>;
  onAppearanceChange: (appearance: DesignPreviewAppearance) => void;
  onClose: () => void;
  onPreviewTokenModeChange: (collectionId: string, modeId: string) => void;
  onViewportChange: (viewport: DesignPreviewViewport) => void;
  previewTokenModes: PreviewTokenModeSelection;
  registry: TokenRegistry;
  style: CSSProperties;
  viewport: DesignPreviewViewport;
}) {
  const collections = registry.collections.filter((collection) => collection.modes.length > 0);

  return createPortal(
    <div
      ref={frameRef}
      className="wb-popover-panel wb-popover-panel--form wb-design-preview-settings-popover"
      role="dialog"
      aria-label="Preview settings"
      style={style}
    >
      <div className="wb-design-preview-settings-popover-head">
        <strong>Preview settings</strong>
        <IconButton label="Close preview settings" title="Close" onClick={onClose}>
          <X size={13} />
        </IconButton>
      </div>
      <ModalFieldList ariaLabel="Preview settings">
        <ModalField label="Viewport">
          <DesignPreviewViewportToolbar
            value={viewport}
            onChange={onViewportChange}
          />
        </ModalField>
        <ModalField label="Appearance">
          <DesignPreviewAppearanceControl value={appearance} onChange={onAppearanceChange} />
        </ModalField>
        {collections.map((collection) => (
          <ModalField
            key={collection.id}
            label={collection.name}
            meta={`${collection.tokens.length} tokens`}
          >
            <SelectControl
              aria-label={`${collection.name} preview token mode`}
              disabled={collection.modes.length <= 1}
              value={getPreviewTokenModeId(collection, previewTokenModes)}
              onValueChange={(modeId) => onPreviewTokenModeChange(collection.id, modeId)}
            >
              {collection.modes.map((mode) => (
                <option key={mode.id} value={mode.id}>{mode.name}</option>
              ))}
            </SelectControl>
          </ModalField>
        ))}
      </ModalFieldList>
    </div>,
    document.body,
  );
}

function CodexDesignHandoffModal({
  copyStatus,
  handoff,
  onClose,
  onCopyStatusChange,
  prompt,
}: {
  copyStatus: string;
  handoff: CodexDesignHandoff;
  onClose: () => void;
  onCopyStatusChange: (status: string) => void;
  prompt: string;
}) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  async function copyPrompt() {
    promptRef.current?.focus();
    promptRef.current?.select();

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(prompt);
        onCopyStatusChange('Copied.');
        return;
      } catch {
        // Fall through to execCommand for embedded browsers that deny Clipboard API.
      }
    }

    try {
      const copied = document.execCommand('copy');
      onCopyStatusChange(copied ? 'Copied.' : 'Copy blocked. Text is selected.');
    } catch {
      onCopyStatusChange('Copy blocked. Text is selected.');
    }
  }

  return (
    <ModalLayer className="wb-codex-handoff-modal" title="Codex handoff ready" onClose={onClose}>
      <p className="wb-modal-copy">
        The design draft was saved and summarized for Codex Desktop.
      </p>
      <div className="wb-codex-handoff-summary" aria-label="Codex handoff summary">
        <span>
          <strong>File</strong>
          <code>{CODEX_DESIGN_HANDOFF_PATH}</code>
        </span>
        <span>
          <strong>Component</strong>
          <code>{handoff.componentName}</code>
        </span>
        <span>
          <strong>Nodes</strong>
          <code>{countCodexHandoffNodes(handoff.tree.root)}</code>
        </span>
      </div>
      <TextArea
        ref={promptRef}
        readOnly
        className="wb-codex-handoff-prompt"
        aria-label="Prompt to copy for Codex"
        value={prompt}
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="wb-modal-actions">
        <span className="wb-codex-handoff-copy-status">{copyStatus}</span>
        <Button className="wb-icon-text-button" tone="primary" onClick={() => void copyPrompt()}>
          <Copy size={13} />
          <span>Copy for Codex</span>
        </Button>
      </div>
    </ModalLayer>
  );
}

function DeveloperExportModal({
  copyStatus,
  onClose,
  onCopyStatusChange,
  payload,
}: {
  copyStatus: string;
  onClose: () => void;
  onCopyStatusChange: (status: string) => void;
  payload: DeveloperExport;
}) {
  const tsxRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTab, setActiveTab] = useState<'dependencies' | 'handoff' | 'localization' | 'source'>('source');

  async function copyTsx() {
    tsxRef.current?.focus();
    tsxRef.current?.select();

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload.tsx);
        onCopyStatusChange('TSX copied.');
        return;
      } catch {
        // Fall through.
      }
    }

    try {
      const copied = document.execCommand('copy');
      onCopyStatusChange(copied ? 'TSX copied.' : 'Copy blocked. Text is selected.');
    } catch {
      onCopyStatusChange('Copy blocked. Text is selected.');
    }
  }

  return (
    <ModalLayer className="wb-developer-export-modal" title={`Export — ${payload.targetLabel}`} onClose={onClose}>
      <p className="wb-modal-copy">
        Source handoff: copy this TSX into the consumer project alongside any referenced component library files.
      </p>
      <div className="wb-developer-export-tabs" role="tablist" aria-label="Export content">
        {([
          ['source', 'Source'],
          ['dependencies', 'Dependencies'],
          ['handoff', 'Handoff'],
          ...(payload.i18nJson ? [['localization', 'Localization']] : []),
        ] as Array<[typeof activeTab, string]>).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'wb-developer-export-tab wb-developer-export-tab--active' : 'wb-developer-export-tab'}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={[
          'wb-developer-export-tab-panel',
          activeTab === 'source' || activeTab === 'localization'
            ? 'wb-developer-export-tab-panel--split'
            : 'wb-developer-export-tab-panel--fill',
        ].join(' ')}
        role="tabpanel"
      >
        {activeTab === 'source' ? (
          <>
            <div className="wb-developer-export-source-path">
              <strong>Source file</strong>
              <code>{payload.sourceFile}</code>
            </div>
            <TextArea
              ref={tsxRef}
              readOnly
              className="wb-codex-handoff-prompt"
              aria-label="TSX source content"
              value={payload.tsx}
              onFocus={(event) => event.currentTarget.select()}
            />
          </>
        ) : null}
        {activeTab === 'dependencies' ? (
          <div className="wb-codex-handoff-summary" aria-label="Developer export dependencies">
            <span>
              <strong>Library folders</strong>
              <code>{payload.libraryFolders.length > 0 ? payload.libraryFolders.join(', ') : 'None'}</code>
            </span>
            <span>
              <strong>CSS to import</strong>
              <code>{payload.cssFiles.length > 0 ? payload.cssFiles.join(', ') : 'None'}</code>
            </span>
            <span>
              <strong>Components used</strong>
              <code>{payload.usedComponents.length > 0 ? payload.usedComponents.join(', ') : 'None'}</code>
            </span>
          </div>
        ) : null}
        {activeTab === 'handoff' ? (
          <TextArea
            readOnly
            className="wb-codex-handoff-prompt"
            aria-label="Developer instructions"
            value={payload.instructions}
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : null}
        {activeTab === 'localization' && payload.i18nJson ? (
          <>
            <div className="wb-developer-export-source-path">
              <strong>Languages</strong>
              <code>{payload.i18nLangs.join(', ')}</code>
            </div>
            <TextArea
              readOnly
              className="wb-codex-handoff-prompt"
              aria-label="i18n.json content"
              value={payload.i18nJson}
              onFocus={(event) => event.currentTarget.select()}
            />
          </>
        ) : null}
      </div>
      <div className="wb-modal-actions">
        {copyStatus ? <span className="wb-codex-handoff-copy-status">{copyStatus}</span> : null}
        <Button className="wb-icon-text-button" tone="primary" onClick={() => void copyTsx()}>
          <Copy size={13} />
          <span>Copy TSX</span>
        </Button>
      </div>
    </ModalLayer>
  );
}

function DesignLayerList({
  activeNoteLinkDragId,
  assets,
  canEditSourceFields,
  collapsedLayerIds,
  components,
  documentRoot,
  layersCollapsed,
  layers,
  onInsertComponent,
  onInsertChild,
  onConnectedArrayItemAdd,
  onNoteLinkDrop,
  onMoveLayer,
  onSelectLayer,
  onToggleCollapsed,
  onToggleLayers,
  previewAppearance,
  previewTokenModes,
  selectedLayerId,
  selectedLayerIds,
  tokenRegistry,
}: {
  activeNoteLinkDragId: string | null;
  assets: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  collapsedLayerIds: string[];
  components: DesignLibraryComponent[];
  documentRoot: EditableTreeNode | null;
  layersCollapsed: boolean;
  layers: PreviewLayer[];
  onInsertComponent: (component: DesignLibraryComponent, layer: PreviewLayer, node: EditableTreeNode, targetIndex?: number) => void;
  onInsertChild: (templateId: SourceInsertChildTemplateId, layer: PreviewLayer, node: EditableTreeNode, targetIndex?: number) => void;
  onConnectedArrayItemAdd: (node: EditableTreeNode, propName: string, value: EditableTreeSourcePropArray) => void;
  onNoteLinkDrop: (noteId: string, layerId: string) => void;
  onMoveLayer: (layer: PreviewLayer, node: EditableTreeNode, targetParentNode: EditableTreeNode, targetIndex: number) => void;
  onSelectLayer: (layerId: string, additive: boolean) => void;
  onToggleCollapsed: (layerId: string) => void;
  onToggleLayers: () => void;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  tokenRegistry: TokenRegistry;
}) {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<SourceLayerDropTarget | null>(null);
  const [noteDropLayerId, setNoteDropLayerId] = useState<string | null>(null);
  const [focusLayerIdAfterKeyboardMove, setFocusLayerIdAfterKeyboardMove] = useState<string | null>(null);
  const layerListRef = useRef<HTMLDivElement | null>(null);
  const dropTargetRef = useRef<SourceLayerDropTarget | null>(null);
  const dragAutoScrollFrameRef = useRef<number | null>(null);
  const dragAutoScrollVelocityRef = useRef(0);
  const layerListViewportFrameRef = useRef<number | null>(null);
  const [layerListViewport, setLayerListViewport] = useState<DesignLayerListViewport>({
    height: 0,
    scrollTop: 0,
  });
  const layerMetadataById = useMemo(() => createDesignLayerNodeMetadataMap(documentRoot), [documentRoot]);
  const collapsedLayerIdSet = useMemo(() => new Set(collapsedLayerIds), [collapsedLayerIds]);
  const layerById = useMemo(() => createPreviewLayerMap(layers), [layers]);
  const selectedLayerIdSet = useMemo(() => new Set(selectedLayerIds), [selectedLayerIds]);
  const hasLayerMultiSelection = selectedLayerIds.length > 1;
  const selectedLayerIndex = useMemo(
    () => (selectedLayerId ? layers.findIndex((layer) => layer.id === selectedLayerId) : -1),
    [layers, selectedLayerId],
  );
  const layerWindow = useMemo(
    () => getDesignLayerListWindow(layers, layerListViewport),
    [layerListViewport, layers],
  );

  const updateLayerListViewport = useCallback(() => {
    const list = layerListRef.current;
    layerListViewportFrameRef.current = null;
    if (!list) return;
    const listRect = list.getBoundingClientRect();
    for (const content of list.querySelectorAll<HTMLElement>('.wb-sidebar-row-content')) {
      const contentRect = content.getBoundingClientRect();
      content.style.setProperty(
        '--wb-design-layer-mask-right',
        `${Math.max(0, listRect.right - 4 - contentRect.left)}px`,
      );
    }
    for (const row of list.querySelectorAll<HTMLElement>('.wb-sidebar-row')) {
      const main = row.querySelector<HTMLElement>(':scope > .wb-sidebar-row-main');
      if (!main) continue;
      const rowRect = row.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const visibleLeft = listRect.left;
      const visibleRight = Math.min(listRect.right - 1, rowRect.right);
      main.style.setProperty(
        '--wb-design-layer-selection-left',
        `${visibleLeft - mainRect.left}px`,
      );
      main.style.setProperty(
        '--wb-design-layer-selection-width',
        `${Math.max(0, visibleRight - visibleLeft)}px`,
      );
    }
    const nextViewport = {
      height: list.clientHeight,
      scrollTop: list.scrollTop,
    };
    setLayerListViewport((current) => (
      current.height === nextViewport.height && current.scrollTop === nextViewport.scrollTop
        ? current
        : nextViewport
    ));
  }, []);
  const scheduleLayerListViewportUpdate = useCallback(() => {
    if (layerListViewportFrameRef.current !== null) return;
    layerListViewportFrameRef.current = requestAnimationFrame(updateLayerListViewport);
  }, [updateLayerListViewport]);

  function updateDropTarget(nextDropTarget: SourceLayerDropTarget | null) {
    dropTargetRef.current = nextDropTarget;
    setDropTarget(nextDropTarget);
  }

  const stopLayerDragAutoScroll = useCallback(() => {
    stopDesignLayerDragAutoScroll(dragAutoScrollFrameRef, dragAutoScrollVelocityRef);
  }, []);

  const updateLayerDragAutoScroll = useCallback((event: ReactDragEvent<HTMLElement>) => {
    if (!draggedLayerId && !activeNoteLinkDragId) return;
    const list = event.currentTarget.closest<HTMLElement>('.wb-design-layer-list');
    if (!list) {
      stopLayerDragAutoScroll();
      return;
    }
    updateDesignLayerDragAutoScroll(list, event.clientY, dragAutoScrollFrameRef, dragAutoScrollVelocityRef);
  }, [activeNoteLinkDragId, draggedLayerId, stopLayerDragAutoScroll]);

  useEffect(() => {
    if (!focusLayerIdAfterKeyboardMove || selectedLayerId !== focusLayerIdAfterKeyboardMove) return;

    const frameId = requestAnimationFrame(() => {
      const row = document.querySelector<HTMLButtonElement>(`[data-wb-sidebar-row-id="${CSS.escape(focusLayerIdAfterKeyboardMove)}"]`);
      if (row) {
        row.focus();
        setFocusLayerIdAfterKeyboardMove(null);
        return;
      }
      const layerIndex = layers.findIndex((layer) => layer.id === focusLayerIdAfterKeyboardMove);
      const list = layerListRef.current;
      if (layerIndex < 0 || !list) return;
      list.scrollTop = Math.max(0, layerIndex * DESIGN_LAYER_ROW_STRIDE - DESIGN_LAYER_ROW_STRIDE * 3);
      updateLayerListViewport();
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLButtonElement>(`[data-wb-sidebar-row-id="${CSS.escape(focusLayerIdAfterKeyboardMove)}"]`)
          ?.focus();
        setFocusLayerIdAfterKeyboardMove(null);
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [focusLayerIdAfterKeyboardMove, layers, selectedLayerId, updateLayerListViewport]);

  useEffect(() => {
    if (draggedLayerId || activeNoteLinkDragId) return;
    stopLayerDragAutoScroll();
  }, [activeNoteLinkDragId, draggedLayerId, stopLayerDragAutoScroll]);

  useEffect(() => () => stopLayerDragAutoScroll(), [stopLayerDragAutoScroll]);

  useLayoutEffect(() => {
    if (layersCollapsed) return undefined;
    updateLayerListViewport();
    const list = layerListRef.current;
    if (!list) return undefined;
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateLayerListViewport);
    resizeObserver?.observe(list);
    window.addEventListener('resize', updateLayerListViewport);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateLayerListViewport);
      if (layerListViewportFrameRef.current !== null) {
        cancelAnimationFrame(layerListViewportFrameRef.current);
        layerListViewportFrameRef.current = null;
      }
    };
  }, [layersCollapsed, updateLayerListViewport]);

  useLayoutEffect(() => {
    if (layersCollapsed) return;
    updateLayerListViewport();
  }, [layerWindow.layers, layersCollapsed, updateLayerListViewport]);

  // When the selection changes (from preview click, undo/redo, navigation,
  // etc.), bring the selected row into view in the layer tree. Using
  // `block: 'nearest'` makes this a no-op when the row is already visible —
  // so clicks originating in the layer tree itself won't cause spurious
  // scroll movement.
  useEffect(() => {
    if (!selectedLayerId) return;
    const list = layerListRef.current;
    if (layerWindow.virtualized && list && selectedLayerIndex >= 0) {
      const rowTop = selectedLayerIndex * DESIGN_LAYER_ROW_STRIDE;
      const rowBottom = rowTop + DESIGN_LAYER_ROW_HEIGHT;
      const visibleTop = list.scrollTop;
      const visibleBottom = visibleTop + list.clientHeight;
      if (rowTop < visibleTop || rowBottom > visibleBottom) {
        list.scrollTop = Math.max(0, rowTop - DESIGN_LAYER_ROW_STRIDE * 3);
        updateLayerListViewport();
      }
      return undefined;
    }
    const frameId = requestAnimationFrame(() => {
      const row = document.querySelector<HTMLElement>(`[data-wb-sidebar-row-id="${CSS.escape(selectedLayerId)}"]`);
      if (!row) return;
      if (isElementFullyVisibleInScrollParent(row)) return;
      row.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frameId);
    // `collapsedLayerIds` is a dependency so that when selecting a node expands
    // its collapsed ancestors, this re-runs once the now-visible row exists.
  }, [collapsedLayerIds, layerWindow.virtualized, layers, selectedLayerId, selectedLayerIndex, updateLayerListViewport]);

  function handleLayerRowKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    layer: PreviewLayer,
    layerNode: EditableTreeNode | null,
  ) {
    if (!canEditSourceFields || layer.id !== selectedLayerId || !documentRoot || !layerNode || !canDragSourceLayer(layer)) {
      return;
    }

    const intent = getDesignLayerKeyboardMoveIntent(event);
    if (!intent) return;

    const moveTarget = resolveSourceKeyboardMoveTarget({
      documentRoot,
      intent,
      nodeId: layer.id,
    });
    if (!moveTarget) return;

    event.preventDefault();
    event.stopPropagation();
    setFocusLayerIdAfterKeyboardMove(getPredictedSourceMoveSelectionId(
      layerNode,
      moveTarget.targetParentNode,
      moveTarget.targetIndex,
    ) ?? layer.id);
    onMoveLayer(layer, layerNode, moveTarget.targetParentNode, moveTarget.targetIndex);
  }

  const renderLayerRow = (layer: PreviewLayer) => {
    const layerMetadata = layerMetadataById.get(layer.id) ?? null;
    const layerNode = layerMetadata?.node ?? null;
    const connectedArrayContext = layerMetadata?.connectedArrayContext ?? null;
    const canDropNoteLink = Boolean(activeNoteLinkDragId && layerNode?.source?.sourceFile);
    const layerReadOnly = isReadOnlyDesignLayer(layer, layerMetadata);
    const canDragLayer = canEditSourceFields && !layerReadOnly && canDragSourceLayer(layer);
    const showLayerAddAction = !layerReadOnly && canEditSourceFields && (canShowSourceLayerAddAction(layerNode) || Boolean(connectedArrayContext));
    const layerSelected = layer.id === selectedLayerId;
    const layerMultiSelected = !layerSelected && selectedLayerIdSet.has(layer.id);
    return (
      <WorkbenchSidebarRow
        key={layer.id}
        collapseState={getDesignLayerCollapseState(layer, layerNode, collapsedLayerIdSet)}
        density="compact"
        indentLevel={layer.depth}
        selected={layerSelected}
        selectionGroupActive={layerSelected && hasLayerMultiSelection}
        multiSelected={layerMultiSelected}
        label={layer.label}
        leading={getPreviewLayerIcon(layer.kind, layerNode)}
        meta={formatDesignLayerKind(layer, layerNode, components)}
        muted={layerReadOnly}
        actionsWidth={22}
        actions={showLayerAddAction ? (
          <DesignLayerRowActions
            assets={assets}
            canEditSourceFields={canEditSourceFields}
            components={components}
            connectedArrayContext={connectedArrayContext}
            layer={layer}
            layerNode={layerNode}
            previewAppearance={previewAppearance}
            previewTokenModes={previewTokenModes}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            showAddAction={showLayerAddAction}
            tokenRegistry={tokenRegistry}
            onConnectedArrayItemAdd={onConnectedArrayItemAdd}
            onInsertComponent={onInsertComponent}
            onInsertChild={onInsertChild}
          />
        ) : null}
        draggable={canDragLayer}
        dropPosition={noteDropLayerId === layer.id ? 'inside' : dropTarget?.layerId === layer.id ? dropTarget.position : null}
        onDragEnd={() => {
          stopLayerDragAutoScroll();
          setDraggedLayerId(null);
          setNoteDropLayerId(null);
          updateDropTarget(null);
        }}
        onDragLeave={(event) => {
          if (!activeNoteLinkDragId) return;
          const nextTarget = event.relatedTarget;
          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
          setNoteDropLayerId(null);
        }}
        onDragOver={(event) => {
          if (activeNoteLinkDragId) {
            if (!canDropNoteLink) {
              event.dataTransfer.dropEffect = 'none';
              setNoteDropLayerId(null);
              return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = 'link';
            setNoteDropLayerId(layer.id);
            return;
          }
          if (!documentRoot || !draggedLayerId) return;
          const nextDropTarget = getDesignLayerDropTarget({
            documentRoot,
            draggedLayerId,
            event,
            layer,
          });
          if (!nextDropTarget) {
            event.dataTransfer.dropEffect = 'none';
            updateDropTarget(null);
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          updateDropTarget(nextDropTarget);
        }}
        onDragStart={(event) => {
          if (!canDragLayer) {
            event.preventDefault();
            return;
          }
          setDraggedLayerId(layer.id);
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', layer.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          stopLayerDragAutoScroll();
          if (activeNoteLinkDragId) {
            if (canDropNoteLink) onNoteLinkDrop(activeNoteLinkDragId, layer.id);
            setNoteDropLayerId(null);
            return;
          }
          if (!documentRoot || !draggedLayerId) return;
          const nextDropTarget = getDesignLayerDropTarget({
            documentRoot,
            draggedLayerId,
            event,
            layer,
          }) ?? dropTargetRef.current;
          if (!nextDropTarget) return;
          const draggedLayer = layerById.get(draggedLayerId);
          const draggedNode = layerMetadataById.get(draggedLayerId)?.node ?? null;
          const targetParentNode = layerMetadataById.get(nextDropTarget.parentId)?.node ?? null;
          setDraggedLayerId(null);
          updateDropTarget(null);
          if (!draggedLayer || !draggedNode || !targetParentNode) return;
          onMoveLayer(draggedLayer, draggedNode, targetParentNode, nextDropTarget.index);
        }}
        onKeyDown={(event) => handleLayerRowKeyDown(event, layer, layerNode)}
        rowId={layer.id}
        onSelect={(event) => onSelectLayer(layer.id, isDesignLayerAdditiveSelectionEvent(event))}
        onToggleCollapse={() => onToggleCollapsed(layer.id)}
      />
    );
  };

  return (
    <>
      <DesignLayerSectionHeader collapsed={layersCollapsed} onToggle={onToggleLayers} />
      <WorkbenchSidebarRowList
        id="wb-design-layer-list"
        listRef={layerListRef}
        className={['wb-design-layer-list', layersCollapsed ? 'wb-design-layer-list--collapsed' : ''].filter(Boolean).join(' ')}
        ariaLabel="Layer list"
        density="compact"
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
          stopLayerDragAutoScroll();
        }}
        onDragOver={updateLayerDragAutoScroll}
        onScroll={scheduleLayerListViewportUpdate}
      >
        {layersCollapsed ? null : layerWindow.virtualized ? (
          <div
            className="wb-design-layer-list-window"
            style={{ height: layerWindow.totalHeight }}
          >
            <div
              className="wb-design-layer-list-window-content"
              style={{ transform: `translateY(${layerWindow.offsetTop}px)` }}
            >
              {layerWindow.layers.map(renderLayerRow)}
            </div>
          </div>
        ) : layers.map(renderLayerRow)}
      </WorkbenchSidebarRowList>
    </>
  );
}

type DesignLayerListViewport = {
  height: number;
  scrollTop: number;
};

type DesignLayerListWindow = {
  layers: PreviewLayer[];
  offsetTop: number;
  totalHeight: number;
  virtualized: boolean;
};

const DESIGN_LAYER_ROW_HEIGHT = 28;
const DESIGN_LAYER_ROW_STRIDE = 28;
const DESIGN_LAYER_WINDOW_OVERSCAN_ROWS = 4;
const DESIGN_LAYER_WINDOW_MIN_ROWS = 40;

function getDesignLayerListWindow(
  layers: PreviewLayer[],
  viewport: DesignLayerListViewport,
): DesignLayerListWindow {
  if (layers.length <= DESIGN_LAYER_WINDOW_MIN_ROWS || viewport.height <= 0) {
    return {
      layers,
      offsetTop: 0,
      totalHeight: 0,
      virtualized: false,
    };
  }

  const startIndex = Math.max(
    0,
    Math.floor(viewport.scrollTop / DESIGN_LAYER_ROW_STRIDE) - DESIGN_LAYER_WINDOW_OVERSCAN_ROWS,
  );
  const endIndex = Math.min(
    layers.length,
    Math.ceil((viewport.scrollTop + viewport.height) / DESIGN_LAYER_ROW_STRIDE) + DESIGN_LAYER_WINDOW_OVERSCAN_ROWS,
  );
  return {
    layers: layers.slice(startIndex, endIndex),
    offsetTop: startIndex * DESIGN_LAYER_ROW_STRIDE,
    totalHeight: layers.length * DESIGN_LAYER_ROW_STRIDE,
    virtualized: true,
  };
}

function updateDesignLayerDragAutoScroll(
  list: HTMLElement,
  clientY: number,
  frameRef: MutableRefObject<number | null>,
  velocityRef: MutableRefObject<number>,
) {
  const velocity = getDesignLayerDragAutoScrollVelocity(list, clientY);
  velocityRef.current = velocity;
  if (velocity === 0) {
    stopDesignLayerDragAutoScroll(frameRef, velocityRef);
    return;
  }
  if (frameRef.current !== null) return;

  const tick = () => {
    const nextVelocity = velocityRef.current;
    if (!list.isConnected || nextVelocity === 0) {
      frameRef.current = null;
      return;
    }

    const maxScrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
    if ((nextVelocity < 0 && list.scrollTop <= 0) || (nextVelocity > 0 && list.scrollTop >= maxScrollTop)) {
      frameRef.current = null;
      velocityRef.current = 0;
      return;
    }

    list.scrollTop = Math.min(maxScrollTop, Math.max(0, list.scrollTop + nextVelocity));
    frameRef.current = window.requestAnimationFrame(tick);
  };

  frameRef.current = window.requestAnimationFrame(tick);
}

function stopDesignLayerDragAutoScroll(
  frameRef: MutableRefObject<number | null>,
  velocityRef: MutableRefObject<number>,
) {
  velocityRef.current = 0;
  if (frameRef.current === null) return;
  window.cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
}

function getDesignLayerDragAutoScrollVelocity(list: HTMLElement, clientY: number): number {
  if (list.scrollHeight <= list.clientHeight) return 0;
  const rect = list.getBoundingClientRect();
  const topDistance = clientY - rect.top;
  const bottomDistance = rect.bottom - clientY;
  if (topDistance < 0 || bottomDistance < 0) return 0;
  if (topDistance < DESIGN_LAYER_DRAG_AUTO_SCROLL_EDGE_PX) {
    const ratio = 1 - (topDistance / DESIGN_LAYER_DRAG_AUTO_SCROLL_EDGE_PX);
    return -Math.max(8, Math.ceil(DESIGN_LAYER_DRAG_AUTO_SCROLL_MAX_PX * ratio));
  }
  if (bottomDistance < DESIGN_LAYER_DRAG_AUTO_SCROLL_EDGE_PX) {
    const ratio = 1 - (bottomDistance / DESIGN_LAYER_DRAG_AUTO_SCROLL_EDGE_PX);
    return Math.max(8, Math.ceil(DESIGN_LAYER_DRAG_AUTO_SCROLL_MAX_PX * ratio));
  }
  return 0;
}

function DesignLayerSectionHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="wb-sidebar-section-head wb-sidebar-section-head--compact">
      <button
        type="button"
        className="wb-design-layer-section-toggle"
        aria-controls="wb-design-layer-list"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ChevronRight size={13} aria-hidden="true" />
        <span className="wb-kicker">Layers</span>
      </button>
    </div>
  );
}

function DesignLayerRowActions({
  assets,
  canEditSourceFields,
  components,
  connectedArrayContext,
  layer,
  layerNode,
  onConnectedArrayItemAdd,
  onInsertComponent,
  onInsertChild,
  previewAppearance,
  previewTokenModes,
  selectedLayerId,
  selectedLayerIds,
  showAddAction,
  tokenRegistry,
}: {
  assets: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  components: DesignLibraryComponent[];
  connectedArrayContext: DesignConnectedArrayContext | null;
  layer: PreviewLayer;
  layerNode: EditableTreeNode | null;
  onConnectedArrayItemAdd: (node: EditableTreeNode, propName: string, value: EditableTreeSourcePropArray) => void;
  onInsertComponent: (component: DesignLibraryComponent, layer: PreviewLayer, node: EditableTreeNode, targetIndex?: number) => void;
  onInsertChild: (templateId: SourceInsertChildTemplateId, layer: PreviewLayer, node: EditableTreeNode, targetIndex?: number) => void;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  showAddAction: boolean;
  tokenRegistry: TokenRegistry;
}) {
  const [insertPickerOpen, setInsertPickerOpen] = useState(false);
  const addMenuRootRef = useRef<HTMLSpanElement | null>(null);
  const selectedSourceNode = layerNode;
  const hasConnectedArrayAdd = Boolean(connectedArrayContext);
  const addDisabled = !canEditSourceFields || (!canShowSourceLayerAddAction(selectedSourceNode) && !hasConnectedArrayAdd);
  const pickerState = useMemo(() => {
    if (!insertPickerOpen || !selectedSourceNode) return null;
    const canInsertComponent = canInsertComponentIntoSourceNode(selectedSourceNode);
    return {
      canInsertComponent,
      initialMode: getSourceInsertPickerInitialMode(canInsertComponent),
      insertableComponents: canInsertComponent
        ? getComponentsVisibleForSourceInsert(components, selectedSourceNode)
        : [],
      targetIndex: resolveSourceLayerAddChildTargetIndex({
        activeLayerId: selectedLayerId,
        parentNode: selectedSourceNode,
        selectedLayerIds,
      }),
      templates: getSourceInsertTemplatesForNode(selectedSourceNode),
    };
  }, [components, insertPickerOpen, selectedLayerId, selectedLayerIds, selectedSourceNode]);

  return (
    <span ref={addMenuRootRef} className="wb-design-layer-add-menu-root">
      {showAddAction ? (
        <IconButton
          aria-expanded={insertPickerOpen}
          aria-haspopup="dialog"
          className="wb-design-layer-action-button"
          disabled={addDisabled}
          label={addDisabled
            ? 'Cannot add children to this source node'
            : hasConnectedArrayAdd
              ? 'Add connected array item'
              : 'Add child node (I)'}
          onClick={(event) => {
            event.stopPropagation();
            if (connectedArrayContext) {
              onConnectedArrayItemAdd(
                connectedArrayContext.sourceNode,
                connectedArrayContext.propName,
                [...connectedArrayContext.items, createDesignConnectedArrayItem(connectedArrayContext.items)],
              );
              return;
            }
            setInsertPickerOpen(true);
          }}
        >
          <Plus size={13} aria-hidden="true" />
        </IconButton>
      ) : null}
      {insertPickerOpen && selectedSourceNode && pickerState ? (
        <DesignComponentPickerModal
          assets={assets}
          components={pickerState.insertableComponents}
          htmlTemplates={pickerState.templates}
          initialMode={pickerState.initialMode}
          previewAppearance={previewAppearance}
          previewTokenModes={previewTokenModes}
          targetLabel={layer.label}
          tokenRegistry={tokenRegistry}
          onClose={() => setInsertPickerOpen(false)}
          onSelectComponent={(component) => {
            setInsertPickerOpen(false);
            onInsertComponent(component, layer, selectedSourceNode, pickerState.targetIndex);
          }}
          onSelectHtmlTemplate={(template) => {
            setInsertPickerOpen(false);
            onInsertChild(template.id, layer, selectedSourceNode, pickerState.targetIndex);
          }}
        />
      ) : null}
    </span>
  );
}

function DesignWrapSelectionModal({
  assets,
  components,
  onClose,
  onSelectComponent,
  onSelectHtmlTag,
  previewAppearance,
  previewTokenModes,
  selectedCount,
  tokenRegistry,
}: {
  assets: WorkbenchAssetRegistry;
  components: DesignLibraryComponent[];
  onClose: () => void;
  onSelectComponent: (component: DesignLibraryComponent) => Promise<string | null> | string | null;
  onSelectHtmlTag: (tagName: SourceWrapHtmlTagName) => void;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  selectedCount: number;
  tokenRegistry: TokenRegistry;
}) {
  const htmlTemplates = useMemo<SourceInsertChildTemplate[]>(
    () => SOURCE_WRAP_HTML_TAG_NAMES.map((tagName) => ({
      id: tagName,
      label: tagName,
      jsxName: tagName,
    })),
    [],
  );

  return (
    <DesignComponentPickerModal
      assets={assets}
      componentActionLabel="Insert component"
      componentEmptyLabel="No wrapper components."
      components={components}
      copy={`${selectedCount === 1 ? '1 layer' : `${selectedCount} layers`} will move into the new wrapper.`}
      formatComponentTrailingLabel={getComponentSourceExportName}
      getComponentState={(component) => {
        const sourceName = getComponentSourceExportName(component);
        const supportsChildren = componentSupportsChildrenSlot(sourceName);
        return {
          blockedReason: supportsChildren ? undefined : `${component.name} cannot wrap layers because ${sourceName} does not expose an editable children slot.`,
          canSelect: supportsChildren,
          meta: supportsChildren ? formatWorkbenchComponentGroupLabel(getWorkbenchComponentGroupId(component)) : 'No editable children slot',
        };
      }}
      htmlTemplates={htmlTemplates}
      initialMode="html"
      previewAppearance={previewAppearance}
      previewTokenModes={previewTokenModes}
      targetLabel="selection"
      title="Wrap selection"
      tokenRegistry={tokenRegistry}
      onClose={onClose}
      onSelectComponent={onSelectComponent}
      onSelectHtmlTemplate={(template) => {
        const tagName = SOURCE_WRAP_HTML_TAG_NAMES.find((name) => name === template.jsxName);
        if (tagName) onSelectHtmlTag(tagName);
      }}
    />
  );
}

function DesignComponentPickerModal({
  assets,
  componentActionLabel = 'Insert component',
  componentEmptyLabel = 'No matching components.',
  components,
  copy,
  formatComponentTrailingLabel = formatVariantCount,
  getComponentState,
  htmlTemplates = [],
  initialMode = 'component',
  onClose,
  onSelectComponent,
  onSelectHtmlTemplate,
  previewAppearance,
  previewTokenModes,
  targetLabel,
  title,
  tokenRegistry,
}: {
  assets: WorkbenchAssetRegistry;
  componentActionLabel?: string;
  componentEmptyLabel?: string;
  components: DesignLibraryComponent[];
  copy?: ReactNode;
  formatComponentTrailingLabel?: (component: DesignLibraryComponent) => string;
  getComponentState?: (component: DesignLibraryComponent) => DesignComponentPickerComponentState;
  htmlTemplates?: readonly SourceInsertChildTemplate[];
  initialMode?: 'component' | 'html';
  onClose: () => void;
  onSelectComponent: (component: DesignLibraryComponent) => DesignComponentPickerSelectResult;
  onSelectHtmlTemplate?: (template: SourceInsertChildTemplate) => void;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  targetLabel: string;
  title?: string;
  tokenRegistry: TokenRegistry;
}) {
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const hasHtmlTemplates = htmlTemplates.length > 0 && typeof onSelectHtmlTemplate === 'function';
  const [mode, setMode] = useState<'component' | 'html'>(() => (
    initialMode === 'html' && hasHtmlTemplates ? 'html' : 'component'
  ));
  const resolveComponentState = useCallback((component: DesignLibraryComponent): DesignComponentPickerComponentState => (
    getComponentState?.(component) ?? {
      canSelect: true,
      meta: formatWorkbenchComponentGroupLabel(getWorkbenchComponentGroupId(component)),
    }
  ), [getComponentState]);
  const availableComponents = useMemo(
    () => components.filter(isComponentUsableInInsertPicker),
    [components],
  );
  const hasComponents = availableComponents.length > 0;
  const effectiveMode = mode === 'html' && hasHtmlTemplates ? 'html' : 'component';
  const filteredComponents = useMemo(
    () => filterDesignPickerComponents(availableComponents, search),
    [availableComponents, search],
  );
  const filteredHtmlTemplates = useMemo(
    () => filterDesignPickerHtmlTemplates(htmlTemplates, search),
    [htmlTemplates, search],
  );
  const componentGroups = useMemo(
    () => groupDesignPickerComponents(filteredComponents),
    [filteredComponents],
  );
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(() => availableComponents[0]?.id ?? null);
  const selectedComponent = filteredComponents.find((component) => component.id === selectedComponentId) ??
    filteredComponents[0] ??
    availableComponents[0] ??
    null;
  const selectedComponentState = selectedComponent ? resolveComponentState(selectedComponent) : null;
  const [importedStory, setImportedStory] = useState<{ componentId: string; story: WorkbenchStory } | null>(null);

  // `getWorkbenchStory` returns a new object literal each call (spread). Memo
  // it on the inputs that actually matter so the effect dep list below stays
  // reference-stable and the effect doesn't fire on every render.
  const staticStory = useMemo(
    () => (selectedComponent ? getWorkbenchStory(selectedComponent) : null),
    [selectedComponent?.id, selectedComponent?.sourceFile],
  );

  const selectedComponentCsfPath = useMemo(
    () => (selectedComponent ? getComponentCsfStorySourceFile(selectedComponent) : null),
    [selectedComponent?.id, selectedComponent?.sourceFile],
  );

  // Imported libraries (yovo, custom presets) are not in the built-in registry
  // but ship CSF stories that we can dynamically import to recover a real
  // render function for the preview thumbnail.
  useEffect(() => {
    if (!selectedComponent || staticStory || !selectedComponentCsfPath) return;
    if (importedStory?.componentId === selectedComponent.id) return;
    let cancelled = false;
    importStorybookCsfStory(selectedComponentCsfPath, selectedComponent)
      .then((result) => {
        if (cancelled || !result) return;
        setImportedStory({
          componentId: selectedComponent.id,
          story: { ...result.story, sourceFile: selectedComponent.sourceFile },
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[workbench] Component picker CSF story load failed:', error);
      });
    return () => { cancelled = true; };
  }, [importedStory?.componentId, selectedComponent, selectedComponentCsfPath, staticStory]);

  const resolvedImportedStory = selectedComponent && importedStory?.componentId === selectedComponent.id ? importedStory.story : null;
  const selectedStory: WorkbenchStory | null = staticStory ?? resolvedImportedStory;
  const selectedStoryDesignControls = selectedStory ? getWorkbenchStoryDesignControls(selectedStory) : [];
  const selectedStoryDefaultArgs = selectedStory
    ? getProjectDefaultIconStoryArgs(getWorkbenchStoryDesignDefaultArgs(selectedStory), selectedStoryDesignControls, assets)
    : {};
  const previewTokenVariables = useMemo(
    () => getSourceTreePreviewTokenVariables(tokenRegistry, previewTokenModes) ?? {},
    [previewTokenModes, tokenRegistry],
  );
  const previewTokenModeAttribute = useMemo(
    () => serializeTokenModeOverride(previewTokenModes) ?? undefined,
    [previewTokenModes],
  );
  const previewThemeMode = useMemo(
    () => getDesignPreviewAppearanceThemeMode(previewAppearance),
    [previewAppearance],
  );

  useEffect(() => {
    if (mode === 'html' && !hasHtmlTemplates) setMode('component');
    if (mode === 'component' && !hasComponents && hasHtmlTemplates) setMode('html');
  }, [hasComponents, hasHtmlTemplates, mode]);

  useEffect(() => {
    if (selectedComponent && filteredComponents.some((component) => component.id === selectedComponent.id)) return;
    const nextComponent = filteredComponents.find((component) => resolveComponentState(component).canSelect) ??
      filteredComponents[0] ??
      availableComponents.find((component) => resolveComponentState(component).canSelect) ??
      availableComponents[0] ??
      null;
    setSelectedComponentId(nextComponent?.id ?? null);
  }, [availableComponents, filteredComponents, resolveComponentState, selectedComponent]);

  useEffect(() => {
    setNotice(null);
  }, [effectiveMode, search, selectedComponentId]);

  const handleSelectComponent = useCallback(async (component: DesignLibraryComponent) => {
    const componentState = resolveComponentState(component);
    if (!componentState.canSelect) {
      setNotice(componentState.blockedReason ?? `${component.name} cannot be inserted here.`);
      return;
    }
    const result = await onSelectComponent(component);
    if (typeof result === 'string' && result.trim()) setNotice(result);
  }, [onSelectComponent, resolveComponentState]);

  const modalTitle = title ?? (hasHtmlTemplates ? 'Add child' : 'Component picker');
  const modalCopy = copy ?? (
    hasHtmlTemplates
      ? `Choose a component or HTML tag to insert into ${targetLabel}.`
      : `Choose a real source component to insert into ${targetLabel}.`
  );

  return (
    <ModalLayer className="wb-design-component-picker-modal" title={modalTitle} onClose={onClose}>
      <p className="wb-modal-copy">{modalCopy}</p>
      <div className={[
        'wb-design-component-picker',
        hasHtmlTemplates ? 'wb-design-component-picker--with-tabs' : 'wb-design-component-picker--without-tabs',
      ].join(' ')}>
        <div className="wb-design-component-picker-search">
          <TextField
            autoFocus
            aria-label={hasHtmlTemplates ? 'Search components and HTML tags' : 'Search components'}
            placeholder={hasHtmlTemplates ? 'Search components and HTML tags' : 'Search components'}
            value={search}
            onValueChange={setSearch}
          />
        </div>
        {hasHtmlTemplates ? (
          <div className="wb-picker-controls wb-design-component-picker-controls wb-design-child-picker-controls">
            <div className="wb-inspector-segmented-control" role="tablist" aria-label="Child node type">
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === 'component'}
                className={[
                  'wb-inspector-segmented-button',
                  effectiveMode === 'component' ? 'wb-inspector-segmented-button--active' : '',
                ].filter(Boolean).join(' ')}
                disabled={!hasComponents}
                onClick={() => setMode('component')}
              >
                Component
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveMode === 'html'}
                className={[
                  'wb-inspector-segmented-button',
                  effectiveMode === 'html' ? 'wb-inspector-segmented-button--active' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setMode('html')}
              >
                HTML tag
              </button>
            </div>
          </div>
        ) : null}
        {notice ? <div className="wb-design-wrap-selection-notice" role="alert">{notice}</div> : null}
        <div className={[
          'wb-design-component-picker-body',
          effectiveMode === 'html' ? 'wb-design-component-picker-body--html' : '',
        ].filter(Boolean).join(' ')}>
          {effectiveMode === 'html' ? (
            <div className="wb-picker-results wb-design-component-picker-results" role="listbox" aria-label="HTML tag results">
              {filteredHtmlTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="wb-picker-result wb-design-component-picker-result"
                  onClick={() => onSelectHtmlTemplate?.(template)}
                >
                  <FileText size={14} aria-hidden="true" />
                  <span>
                    <span className="wb-picker-result-name">{template.label}</span>
                    <small>HTML tag</small>
                  </span>
                  <code>{`<${template.jsxName}>`}</code>
                </button>
              ))}
              {filteredHtmlTemplates.length === 0 ? <div className="wb-picker-empty">No matching HTML tags.</div> : null}
            </div>
          ) : (
            <>
              <div className="wb-picker-results wb-design-component-picker-results" role="listbox" aria-label="Component results">
                {componentGroups.map((group) => (
                  <div key={group.id} className="wb-design-component-picker-group">
                    <div className="wb-design-component-picker-group-label">{group.label}</div>
                    {group.components.map((component) => {
                      const selected = component.id === selectedComponent?.id;
                      const componentState = resolveComponentState(component);
                      return (
                        <button
                          key={component.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={[
                            'wb-picker-result',
                            'wb-design-component-picker-result',
                            selected ? 'wb-picker-result--selected' : '',
                            !componentState.canSelect ? 'wb-design-component-picker-result--unsupported' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => setSelectedComponentId(component.id)}
                          onDoubleClick={() => void handleSelectComponent(component)}
                        >
                          <Component size={14} aria-hidden="true" />
                          <span>
                            <span className="wb-picker-result-name">{component.name}</span>
                            <small>{componentState.meta}</small>
                          </span>
                          <code>{formatComponentTrailingLabel(component)}</code>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filteredComponents.length === 0 ? <div className="wb-picker-empty">{componentEmptyLabel}</div> : null}
              </div>
              <div className="wb-design-component-picker-detail">
                {selectedComponent && selectedStory ? (
                  <>
                    <DesignComponentPickerPreviewFrame
                      ariaLabel={`${selectedComponent.name} preview`}
                      themeMode={previewThemeMode}
                      tokenModeAttribute={previewTokenModeAttribute}
                      tokenVariables={previewTokenVariables}
                    >
                      <DesignComponentPickerPreview
                        key={selectedStory.componentId}
                        args={selectedStoryDefaultArgs}
                        story={selectedStory}
                      />
                    </DesignComponentPickerPreviewFrame>
                    <div className="wb-design-component-picker-meta">
                      <strong>{selectedComponent.name}</strong>
                      <span>{selectedStory.description}</span>
                      <code>{selectedComponent.sourceFile}</code>
                    </div>
                    <div className="wb-design-component-picker-props" aria-label="Default props">
                      {selectedStoryDesignControls
                        .filter((control) => isWorkbenchStoryControlVisible(control, selectedStoryDefaultArgs, selectedStoryDefaultArgs))
                        .map((control) => (
                          <span key={control.key}>
                            <strong>{control.label}</strong>
                            <code>{String(selectedStoryDefaultArgs[control.key] ?? '')}</code>
                          </span>
                        ))}
                    </div>
                  </>
                ) : selectedComponent ? (
                  <>
                    <div className="wb-picker-empty">No story preview for this component.</div>
                    <div className="wb-design-component-picker-meta">
                      <strong>{selectedComponent.name}</strong>
                      <span>Source-backed component</span>
                      <code>{selectedComponent.sourceFile}</code>
                    </div>
                  </>
                ) : (
                  <div className="wb-picker-empty">Select a component.</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="wb-modal-actions">
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          {effectiveMode === 'component' ? (
            <Button
              tone="primary"
              disabled={!selectedComponent || !selectedComponentState?.canSelect}
              onClick={() => {
                if (selectedComponent) void handleSelectComponent(selectedComponent);
              }}
            >
              {componentActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </ModalLayer>
  );
}

function DesignComponentPickerPreviewFrame({
  ariaLabel,
  children,
  themeMode,
  tokenModeAttribute,
  tokenVariables,
}: {
  ariaLabel: string;
  children: ReactNode;
  themeMode?: 'light' | 'dark';
  tokenModeAttribute?: string;
  tokenVariables: CSSProperties;
}) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const previewScaleRef = useRef(1);
  const [previewScale, setPreviewScale] = useState(1);
  const tokenScopeId = useStableStyleScopeId('component-picker-preview');
  const tokenScopeRule = useMemo(
    () => createScopedCssRule(
      `[data-wb-design-style-scope="${tokenScopeId}"]`,
      createCssDeclarationBlockFromStyleVariables(tokenVariables),
    ),
    [tokenScopeId, tokenVariables],
  );
  const previewFrameRule = useMemo(
    () => `${tokenScopeRule}
[data-wb-component-picker-preview-content] {
  display: grid;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  align-items: center;
  justify-items: center;
  overflow: hidden;
  padding: 28px;
}

[data-wb-component-picker-preview-stage] {
  display: inline-grid;
  max-width: none;
  place-items: center;
  transform: scale(var(--wb-component-picker-preview-scale, 1));
  transform-origin: center;
}
`,
    [tokenScopeRule],
  );

  useEffect(() => {
    previewScaleRef.current = previewScale;
  }, [previewScale]);

  useLayoutEffect(() => {
    if (!previewDocument) return undefined;
    const syncPreviewHead = () => syncSourceTreePreviewFrameHead(previewDocument, themeMode ?? 'system');
    syncPreviewHead();
    const observer = new MutationObserver(syncPreviewHead);
    observer.observe(document.head, { attributes: true, characterData: true, childList: true, subtree: true });
    observer.observe(document.documentElement, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    observer.observe(document.body, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    return () => observer.disconnect();
  }, [previewDocument, themeMode]);
  useLayoutEffect(() => {
    if (!previewDocument) return;
    syncSourceTreePreviewFrameTokenVariables(previewDocument, tokenVariables);
  }, [previewDocument, tokenVariables]);

  useLayoutEffect(() => {
    const content = previewContentRef.current;
    const stage = previewStageRef.current;
    const ownerWindow = previewDocument?.defaultView;
    if (!content || !stage || !ownerWindow) return undefined;

    let frameId = 0;
    const measure = () => {
      frameId = 0;
      const contentRect = content.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const styles = ownerWindow.getComputedStyle(content);
      const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(1, contentRect.width - paddingX);
      const availableHeight = Math.max(1, contentRect.height - paddingY);
      const currentScale = previewScaleRef.current || 1;
      const naturalWidth = Math.max(stage.scrollWidth, stageRect.width / currentScale);
      const naturalHeight = Math.max(stage.scrollHeight, stageRect.height / currentScale);
      const nextScale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
      const clampedScale = Number.isFinite(nextScale) ? Math.max(0.16, Math.min(1, nextScale)) : 1;
      setPreviewScale((current) => (Math.abs(current - clampedScale) < 0.01 ? current : clampedScale));
    };
    const scheduleMeasure = () => {
      if (frameId) ownerWindow.cancelAnimationFrame(frameId);
      frameId = ownerWindow.requestAnimationFrame(measure);
    };

    const observer = new ownerWindow.ResizeObserver(scheduleMeasure);
    observer.observe(content);
    observer.observe(stage);
    scheduleMeasure();

    return () => {
      if (frameId) ownerWindow.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [children, previewDocument]);

  useDocumentStyleText(previewFrameRule, previewDocument, Boolean(previewDocument));
  const previewPortalRoot = previewDocument?.querySelector<HTMLElement>(
    '[data-workbench-portal-root="true"]',
  ) ?? null;
  const previewFrameStage = previewDocument?.getElementById('wb-source-preview-stage') ?? null;

  return (
    <div className="wb-design-component-picker-preview" aria-label={ariaLabel}>
      <iframe
        className="wb-design-component-picker-preview-frame"
        title={ariaLabel}
        srcDoc={SOURCE_TREE_PREVIEW_FRAME_HTML}
        onLoad={(event) => setPreviewDocument(event.currentTarget.contentDocument)}
      />
      {previewDocument?.body
        ? createPortal(
          <WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>
            <div
              ref={previewContentRef}
              className={['wb-design-component-picker-preview-content', getLibraryScopeClassName()].filter(Boolean).join(' ')}
              data-astryx-media={themeMode}
              data-wb-component-picker-preview-content=""
              data-theme={themeMode}
              data-wb-token-modes={tokenModeAttribute}
              data-wb-design-style-scope={tokenScopeId}
            >
              <div
                ref={previewStageRef}
                className="wb-design-component-picker-preview-stage"
                data-wb-component-picker-preview-stage=""
                style={{ '--wb-component-picker-preview-scale': String(previewScale) } as CSSProperties}
              >
                {children}
              </div>
            </div>
          </WorkbenchPortalScopeContext.Provider>,
          previewFrameStage
            ?? previewDocument.getElementById('wb-source-preview-root')
            ?? previewDocument.body,
        )
        : null}
    </div>
  );
}

// Story `render` functions are allowed (per Storybook CSF conventions) to call
// React hooks at their top level — yovo's Dialog/Toast/Radio stories do this for
// open/checked state demos. Calling `selectedStory.render(args)` inline from the
// picker would attribute those hooks to the picker itself, mutating its hook
// order between stories and tripping React's Rules of Hooks. Wrapping the call
// in this thin component gives every story its own hook context; the parent
// keys it by `story.componentId` so switching components remounts cleanly.
function DesignComponentPickerPreview({
  args,
  story,
}: {
  args: WorkbenchStoryArgs;
  story: WorkbenchStory;
}) {
  return <>{story.render(args)}</>;
}

function getDesignLayerCollapseState(
  layer: PreviewLayer,
  node: EditableTreeNode | null,
  collapsedLayerIds: Set<string>,
): 'collapsed' | 'expanded' | 'none' {
  if (!node?.children || node.children.length === 0) return 'none';
  return collapsedLayerIds.has(layer.id) ? 'collapsed' : 'expanded';
}

function formatDesignLayerKind(
  layer: PreviewLayer,
  node: EditableTreeNode | null,
  components: DesignLibraryComponent[],
): string {
  if (layer.id.startsWith('runtime:')) return 'Runtime';
  if (node?.sourceMapBinding?.scope === 'collection') return 'Map';
  if (layer.kind !== 'component-instance') return formatPreviewLayerKind(layer.kind);
  if (isSourceIconPackageNode(node)) return 'Icon';
  if (node && resolveDesignComponentForSourceNode(node, components)) return formatPreviewLayerKind(layer.kind);
  return 'Unknown';
}

function isSourceIconPackageNode(node: EditableTreeNode | null): boolean {
  const importSource = node?.source?.importSource;
  const importName = node?.source?.importName ?? node?.source?.jsxName ?? '';
  if (!importSource || !SOURCE_ICON_IMPORT_SOURCES.has(importSource)) return false;
  if (importSource === '@tabler/icons-react') return /^Icon[A-Z][A-Za-z0-9]*$/.test(importName);
  if (importSource === '@remixicon/react') return /^Ri[A-Z0-9][A-Za-z0-9]*$/.test(importName);
  return /^[A-Z][A-Za-z0-9]*(?:Icon)?$/.test(importName) || /^Lucide[A-Z][A-Za-z0-9]*$/.test(importName);
}

function getVisibleCollapsedDesignLayerIds(
  documentRoot: EditableTreeNode | null,
  collapsedLayerIds: string[],
): string[] {
  if (!documentRoot || collapsedLayerIds.length === 0) return collapsedLayerIds;
  return collapsedLayerIds.filter((layerId) => {
    const node = findEditableTreeNode(documentRoot, layerId);
    return Boolean(node?.children?.length);
  });
}

function findEditableTreeNodePath(root: EditableTreeNode | null, nodeId: string): EditableTreeNode[] {
  if (!root) return [];
  if (root.id === nodeId) return [root];
  for (const child of root.children ?? []) {
    const childPath = findEditableTreeNodePath(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  return [];
}

function resolveSourceNodePreviewTokenModes(
  root: EditableTreeNode | null,
  nodeId: string | null,
  previewTokenModes: PreviewTokenModeSelection,
): PreviewTokenModeSelection {
  if (!root || !nodeId) return previewTokenModes;
  const path = findEditableTreeNodePath(root, nodeId);
  if (path.length === 0) return previewTokenModes;

  let resolved = previewTokenModes;
  for (const node of path) {
    const modeOverride = parseTokenModeOverride(node.sourceAttributes?.[SOURCE_TOKEN_MODE_ATTRIBUTE]);
    if (Object.keys(modeOverride).length === 0) continue;
    resolved = { ...resolved, ...modeOverride };
  }
  return resolved;
}

function canDragSourceLayer(layer: PreviewLayer): boolean {
  if (!layer.sourceLocation) return false;
  return isDraggableSourceNodeId(layer.id);
}

function isReadOnlyDesignLayer(
  layer: PreviewLayer,
  metadata: DesignLayerNodeMetadata | null,
): boolean {
  if (!metadata) return false;
  if (metadata.selectableNodeId !== layer.id) return true;
  if (layer.sourcePreviewOnly || metadata.sourcePreviewOnly) return true;
  return metadata.hasReadOnlySourceMapAncestor;
}

type DesignLayerKeyboardMoveEvent = Pick<KeyboardEvent | ReactKeyboardEvent<HTMLElement>, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>;
type DesignLayerSelectionModifierEvent = Pick<KeyboardEvent | ReactKeyboardEvent<HTMLElement> | ReactMouseEvent<HTMLElement>, 'ctrlKey' | 'metaKey' | 'shiftKey'>;

function isDesignLayerAdditiveSelectionEvent(event: DesignLayerSelectionModifierEvent): boolean {
  return event.shiftKey;
}

function getDesignLayerKeyboardMoveIntent(
  event: DesignLayerKeyboardMoveEvent,
  options: { allowUnmodifiedVertical?: boolean } = {},
): SourceKeyboardMoveIntent | null {
  const meta = event.metaKey || event.ctrlKey;
  if (meta || event.shiftKey) return null;
  const allowUnmodifiedVertical = options.allowUnmodifiedVertical ?? true;
  if (event.key === 'ArrowUp' && (event.altKey || allowUnmodifiedVertical)) return { kind: 'reorder', offset: -1 };
  if (event.key === 'ArrowDown' && (event.altKey || allowUnmodifiedVertical)) return { kind: 'reorder', offset: 1 };
  if (event.key === 'ArrowLeft' && event.altKey) return { kind: 'outdent' };
  if (event.key === 'ArrowRight' && event.altKey) return { kind: 'indent' };
  return null;
}

function getVisiblePreviewLayers(
  layers: PreviewLayer[],
  collapsedLayerIds: string[],
): PreviewLayer[] {
  if (collapsedLayerIds.length === 0) return layers;
  const collapsed = new Set(collapsedLayerIds);
  const hiddenDepths: number[] = [];

  return layers.filter((layer) => {
    while (hiddenDepths.length > 0 && layer.depth <= hiddenDepths[hiddenDepths.length - 1]) {
      hiddenDepths.pop();
    }
    const hidden = hiddenDepths.length > 0;
    if (!hidden && collapsed.has(layer.id)) hiddenDepths.push(layer.depth);
    return !hidden;
  });
}

function createPreviewLayerMap(layers: PreviewLayer[]): Map<string, PreviewLayer> {
  return new Map(layers.map((layer) => [layer.id, layer]));
}

function isElementFullyVisibleInScrollParent(element: HTMLElement): boolean {
  const scrollParent = element.closest<HTMLElement>('.wb-design-layer-list');
  if (!scrollParent) return false;
  const parentRect = scrollParent.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  return elementRect.top >= parentRect.top && elementRect.bottom <= parentRect.bottom;
}

function getDesignLayerDropTarget({
  documentRoot,
  draggedLayerId,
  event,
  layer,
}: {
  documentRoot: EditableTreeNode;
  draggedLayerId: string;
  event: ReactDragEvent<HTMLElement>;
  layer: PreviewLayer;
}): SourceLayerDropTarget | null {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
  return resolveSourceLayerDropTarget({
    documentRoot,
    draggedLayerId,
    pointerRatio: ratio,
    targetLayerId: layer.id,
  });
}

function DesignPreviewStage({
  activeNoteBoxDraft,
  activeNoteHighlightBoxId,
  activeNoteHighlightBoxes,
  activeNoteLinkDragId,
  activeNotePreviewNoteId,
  activeNotePreviewLayerId,
  assets,
  canEditSourceFields,
  canEditSourceStructure,
  cssClassEffectivenessEnabled,
  documentTree,
  onClearSelection,
  onCopySelection,
  onCssClassEffectivenessChange,
  onCutSelection,
  onDeleteSelection,
  onDrillIntoLayer,
  onDuplicateSelection,
  onHistoryRedo,
  onHistoryUndo,
  onInsertChild,
  onMoveLayer,
  onMoveLayerToParent,
  onNoteHighlightBoxChange,
  onNoteHighlightBoxCreate,
  onNoteHighlightBoxDraftEnd,
  onNoteHighlightBoxPreviewChange,
  onNoteLinkDrop,
  onOpenPreviewModeModal,
  onPasteNode,
  onWrapSelection,
  onPreviewAppearanceChange,
  onPreviewViewportChange,
  onRuntimeProjectionTreeChange,
  onRuntimePageKeyboardShortcut,
  onSelectLayer,
  onSourceNodeComponentPropChange,
  onStyleDeclarationsChange,
  previewDrillPath,
  previewAppearance,
  previewLoadState,
  previewModeOpen,
  previewModeSummary,
  previewTokenModes,
  previewViewport,
  runtimePage,
  runtimeStory,
  runtimeStoryArgs,
  selectedLayerId,
  selectedLayerIds,
  selectedLayerReadOnly,
  selectedSourceNode,
  tailwindCssMode,
  tokenRegistry,
}: {
  activeNoteBoxDraft: { layerId: string; noteId: string } | null;
  activeNoteHighlightBoxId: string | null;
  activeNoteHighlightBoxes: WorkbenchSpecNoteHighlightBox[];
  activeNoteLinkDragId: string | null;
  activeNotePreviewNoteId: string | null;
  activeNotePreviewLayerId: string | null;
  assets: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  canEditSourceStructure: boolean;
  cssClassEffectivenessEnabled: boolean;
  documentTree: EditableDocumentTree | null;
  onClearSelection: () => void;
  onCopySelection: () => void;
  onCssClassEffectivenessChange: (report: CssClassEffectivenessReport | null) => void;
  onCutSelection: () => void;
  onDeleteSelection?: () => void;
  onDrillIntoLayer: (layerId: string, origin?: SourceTreePreviewDrillOrigin) => void;
  onDuplicateSelection?: () => void;
  onHistoryRedo: () => boolean;
  onHistoryUndo: () => boolean;
  onInsertChild: () => void;
  onMoveLayer: (layerId: string, intent: SourceKeyboardMoveIntent) => void;
  onMoveLayerToParent: (layerId: string, targetParentLayerId: string, targetIndex: number) => void;
  onNoteHighlightBoxChange: (noteId: string, boxId: string, rect: WorkbenchSpecNoteHighlightBoxRect) => void;
  onNoteHighlightBoxCreate: (noteId: string, rect: WorkbenchSpecNoteHighlightBoxRect) => void;
  onNoteHighlightBoxDraftEnd: () => void;
  onNoteHighlightBoxPreviewChange: (boxId: string | null) => void;
  onNoteLinkDrop: (noteId: string, layerId: string) => void;
  onOpenPreviewModeModal: () => void;
  onPasteNode: (placement: DesignPastePlacement) => void;
  onWrapSelection: () => void;
  onPreviewAppearanceChange: (appearance: DesignPreviewAppearance) => void;
  onRuntimeProjectionTreeChange: (tree: EditableDocumentTree | null) => void;
  onPreviewViewportChange: (viewport: DesignPreviewViewport) => void;
  onRuntimePageKeyboardShortcut: (shortcut: RuntimePageKeyboardShortcut) => void;
  onSelectLayer: (layerId: string, mode: DesignPreviewSelectionMode, additive: boolean) => void;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  onStyleDeclarationsChange: (
    layerId: string,
    patches: DesignPreviewStyleDeclarationPatch[],
    label: string,
  ) => void;
  previewDrillPath: string[];
  previewAppearance: DesignPreviewAppearance;
  previewLoadState: DesignPreviewLoadState;
  previewModeOpen: boolean;
  previewModeSummary: string;
  previewTokenModes: PreviewTokenModeSelection;
  previewViewport: DesignPreviewViewport;
  runtimePage: RuntimePageProjectionTarget | null;
  runtimeStory: WorkbenchStory | null;
  runtimeStoryArgs: WorkbenchStoryArgs;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  selectedLayerReadOnly: boolean;
  selectedSourceNode: EditableTreeNode | null;
  tailwindCssMode: SourceTreePreviewTailwindCssMode;
  tokenRegistry: TokenRegistry;
}) {
  setWorkbenchPreviewIconSourceMap(getWorkbenchDefaultIconSourceMap(assets));

  if (runtimeStory) {
    return (
      <div className="wb-design-preview-stack">
        <WorkbenchPreviewStage onClick={onClearSelection}>
          <RuntimeDesignProjectionPreview
            key={getRuntimeProjectionId(runtimeStory)}
            args={runtimeStoryArgs}
            assets={assets}
            draftTree={documentTree}
            previewAppearance={previewAppearance}
            previewTokenModes={previewTokenModes}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            story={runtimeStory}
            tokenRegistry={tokenRegistry}
            onDrillIntoLayer={onDrillIntoLayer}
            onMoveLayer={onMoveLayer}
            onProjectionTreeChange={onRuntimeProjectionTreeChange}
            onSelectLayer={onSelectLayer}
          />
        </WorkbenchPreviewStage>
      </div>
    );
  }

  if (runtimePage) {
    return (
      <div className="wb-design-preview-stack">
        <WorkbenchPreviewStage onClick={onClearSelection}>
          <DesignPreviewViewportFrame
            onChange={onPreviewViewportChange}
            rootSelected={Boolean(documentTree && (
              selectedLayerId === documentTree.root.id ||
              selectedLayerIds.includes(documentTree.root.id)
            ))}
            value={previewViewport}
          >
            <RuntimePageProjectionPreview
              key={getRuntimePageProjectionId(runtimePage)}
              page={runtimePage}
              previewAppearance={previewAppearance}
              previewTokenModes={previewTokenModes}
              selectedLayerId={selectedLayerId}
              onDrillIntoLayer={onDrillIntoLayer}
              onKeyboardShortcut={onRuntimePageKeyboardShortcut}
              onProjectionTreeChange={onRuntimeProjectionTreeChange}
              onSelectLayer={onSelectLayer}
            />
          </DesignPreviewViewportFrame>
        </WorkbenchPreviewStage>
      </div>
    );
  }

  if (!documentTree) {
    if (previewLoadState.status === 'empty') {
      return <WorkbenchPreviewStage onClick={onClearSelection}>{null}</WorkbenchPreviewStage>;
    }
    return (
      <WorkbenchPreviewStage onClick={onClearSelection}>
        <DesignPreviewLoadStateNode value={previewLoadState} />
      </WorkbenchPreviewStage>
    );
  }

  return (
    <div className="wb-design-preview-stack">
      <WorkbenchPreviewStage onClick={onClearSelection}>
        <DesignPreviewViewportFrame
          onChange={onPreviewViewportChange}
          rootSelected={selectedLayerId === documentTree.root.id || selectedLayerIds.includes(documentTree.root.id)}
          value={previewViewport}
        >
          <SourceTreePreview
            assetRegistry={assets}
            previewAppearance={previewAppearance}
            previewTokenModes={previewTokenModes}
            tailwindCssMode={tailwindCssMode}
            previewDrillPath={previewDrillPath}
            root={documentTree.root}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            selectedLayerReadOnly={selectedLayerReadOnly}
            activeNoteLinkDragId={activeNoteLinkDragId}
            activeNoteBoxDraft={activeNoteBoxDraft}
            activeNoteHighlightBoxId={activeNoteHighlightBoxId}
            activeNoteHighlightBoxes={activeNoteHighlightBoxes}
            activeNotePreviewLayerId={activeNotePreviewLayerId}
            activeNotePreviewNoteId={activeNotePreviewNoteId}
            tokenRegistry={tokenRegistry}
            onClearSelection={onClearSelection}
            onCopySelection={onCopySelection}
            onCssClassEffectivenessChange={onCssClassEffectivenessChange}
            cssClassEffectivenessEnabled={cssClassEffectivenessEnabled}
            onCutSelection={onCutSelection}
            onDeleteSelection={onDeleteSelection}
            onDuplicateSelection={onDuplicateSelection}
            onSourceNodeComponentPropChange={canEditSourceFields ? onSourceNodeComponentPropChange : undefined}
            onDrillIntoLayer={onDrillIntoLayer}
            onHistoryRedo={onHistoryRedo}
            onHistoryUndo={onHistoryUndo}
            onInsertChild={canEditSourceStructure ? onInsertChild : undefined}
            onMoveLayer={canEditSourceStructure ? onMoveLayer : undefined}
            onMoveLayerToParent={canEditSourceStructure ? onMoveLayerToParent : undefined}
            onNoteHighlightBoxChange={onNoteHighlightBoxChange}
            onNoteHighlightBoxCreate={onNoteHighlightBoxCreate}
            onNoteHighlightBoxDraftEnd={onNoteHighlightBoxDraftEnd}
            onNoteHighlightBoxPreviewChange={onNoteHighlightBoxPreviewChange}
            onNoteLinkDrop={onNoteLinkDrop}
            onPasteNode={canEditSourceStructure ? onPasteNode : undefined}
            onWrapSelection={canEditSourceStructure ? onWrapSelection : undefined}
            onSelectLayer={onSelectLayer}
            onStyleDeclarationsChange={canEditSourceFields ? onStyleDeclarationsChange : undefined}
          />
        </DesignPreviewViewportFrame>
      </WorkbenchPreviewStage>
    </div>
  );
}

function DesignPreviewLoadStateNode({
  value,
}: {
  value: DesignPreviewLoadState;
}) {
  if (value.status === 'loading') {
    return (
      <div className="wb-design-preview-loading" role="status" aria-live="polite">
        <LoaderCircle size={20} aria-hidden="true" />
        <strong>Loading source preview</strong>
        <span>{value.diagnostic}</span>
      </div>
    );
  }

  if (value.status === 'unavailable') {
    return (
      <WorkbenchPreviewNode
        actionLabel="Check source"
        copy={value.diagnostic}
        title="Source preview unavailable"
      />
    );
  }

  return (
    <WorkbenchPreviewNode
      actionLabel="No selection"
      copy={value.diagnostic}
      title="Design preview"
    />
  );
}

export function DesignPreviewControlBar({
  canEditSourceFields,
  onOpenPreviewModeModal,
  onPreviewAppearanceChange,
  onPreviewViewportChange,
  previewAppearance = 'light',
  previewModeOpen,
  previewModeSummary,
  previewViewport,
  selectedSourceNode,
}: {
  canEditSourceFields: boolean;
  onOpenPreviewModeModal: () => void;
  onPreviewAppearanceChange?: (appearance: DesignPreviewAppearance) => void;
  onPreviewViewportChange?: (viewport: DesignPreviewViewport) => void;
  previewAppearance?: DesignPreviewAppearance;
  previewModeOpen: boolean;
  previewModeSummary: string;
  previewViewport?: DesignPreviewViewport;
  selectedSourceNode: EditableTreeNode | null;
}) {
  return (
    <div
      className="wb-design-preview-controlbar"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="wb-design-preview-controlbar-left">
        <DesignPreviewActionBar
          canEditSourceFields={canEditSourceFields}
          selectedSourceNode={selectedSourceNode}
        />
      </div>
      <div className="wb-design-preview-controlbar-right">
        {previewViewport && onPreviewViewportChange ? (
          <span className="wb-design-responsive-control wb-design-responsive-preview-control">
            <span className="wb-design-responsive-label">Preview</span>
            <DesignPreviewViewportToolbar
              value={previewViewport}
              onChange={onPreviewViewportChange}
            />
          </span>
        ) : null}
        <Button
          className="wb-design-preview-mode-button"
          tone="ghost"
          aria-expanded={previewModeOpen}
          aria-haspopup="dialog"
          title={previewModeSummary}
          onClick={onOpenPreviewModeModal}
        >
          Modes
        </Button>
        {onPreviewAppearanceChange ? (
          <DesignPreviewAppearanceControl
            value={previewAppearance}
            onChange={onPreviewAppearanceChange}
          />
        ) : null}
      </div>
    </div>
  );
}

function DesignPreviewAppearanceControl({
  onChange,
  value,
}: {
  onChange: (appearance: DesignPreviewAppearance) => void;
  value: DesignPreviewAppearance;
}) {
  return (
    <SelectControl<DesignPreviewAppearance>
      className="wb-design-preview-appearance-control"
      aria-label="Preview appearance"
      title="Preview appearance"
      value={value}
      onValueChange={onChange}
    >
      {DESIGN_PREVIEW_APPEARANCES.map((appearance) => {
        return (
          <option
            key={appearance.id}
            value={appearance.id}
          >
            {appearance.label}
          </option>
        );
      })}
    </SelectControl>
  );
}

function DesignPreviewViewportToolbar({
  onChange,
  value,
}: {
  onChange: (viewport: DesignPreviewViewport) => void;
  value: DesignPreviewViewport;
}) {
  const [widthDraft, setWidthDraft] = useState(String(value.width));
  const [heightDraft, setHeightDraft] = useState(String(value.height));
  const full = value.presetId === 'full';

  useEffect(() => {
    setWidthDraft(String(value.width));
    setHeightDraft(String(value.height));
  }, [value.height, value.width]);

  function selectPreset(presetId: DesignPreviewViewportPresetId) {
    const preset = getDesignPreviewViewportPreset(presetId);
    onChange(reconcileDesignPreviewViewport({
      height: preset.height,
      presetId,
      width: preset.width,
    }));
  }

  function commitDimension(axis: 'height' | 'width') {
    if (full) return;
    const draft = axis === 'width' ? widthDraft : heightDraft;
    const fallback = axis === 'width' ? value.width : value.height;
    const nextDimension = normalizeDesignPreviewViewportDimension(draft, fallback);
    if (axis === 'width') {
      setWidthDraft(String(nextDimension));
      onChange(reconcileDesignPreviewViewport({ ...value, width: nextDimension }));
      return;
    }
    setHeightDraft(String(nextDimension));
    onChange(reconcileDesignPreviewViewport({ ...value, height: nextDimension }));
  }

  return (
    <div
      className="wb-design-viewport-toolbar"
      aria-label="Preview viewport"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SelectControl<DesignPreviewViewportPresetId>
        className="wb-design-viewport-select"
        value={value.presetId}
        aria-label="Preview viewport preset"
        onValueChange={selectPreset}
      >
        {DESIGN_PREVIEW_VIEWPORT_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </SelectControl>
      <TextField
        className="wb-design-viewport-size-input"
        inputMode="numeric"
        disabled={full}
        value={widthDraft}
        aria-label="Preview viewport width"
        onBlur={() => commitDimension('width')}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commitDimension('width');
        }}
        onValueChange={setWidthDraft}
      />
      <span className="wb-design-viewport-separator" aria-hidden="true">x</span>
      <TextField
        className="wb-design-viewport-size-input"
        inputMode="numeric"
        disabled={full}
        value={heightDraft}
        aria-label="Preview viewport height"
        onBlur={() => commitDimension('height')}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commitDimension('height');
        }}
        onValueChange={setHeightDraft}
      />
    </div>
  );
}

export function DesignPreviewViewportFrame({
  children,
  onChange,
  rootSelected = false,
  value,
}: {
  children: ReactNode;
  onChange?: (viewport: DesignPreviewViewport) => void;
  rootSelected?: boolean;
  value: DesignPreviewViewport;
}) {
  const [resizingAxis, setResizingAxis] = useState<'height' | 'width' | null>(null);
  const [resizeDraftViewport, setResizeDraftViewport] = useState<DesignPreviewViewport | null>(null);
  const displayValue = resizeDraftViewport ?? value;
  const full = displayValue.presetId === 'full';
  const resizable = Boolean(onChange) && !full;
  const viewportScopeId = useStableStyleScopeId('preview-viewport');
  const viewportScopeRule = useMemo(
    () => full
      ? ''
      : createScopedCssRule(
        `.wb-design-viewport-frame-shell[data-wb-design-viewport-frame="${viewportScopeId}"]`,
        [
          `--wb-design-preview-viewport-height: ${formatCssPx(displayValue.height)}`,
          `--wb-design-preview-viewport-width: ${formatCssPx(displayValue.width)}`,
        ].join(';'),
      ),
    [displayValue.height, displayValue.width, full, viewportScopeId],
  );
  useDocumentStyleText(viewportScopeRule);

  function handleResizePointerDown(axis: 'height' | 'width', event: ReactPointerEvent<HTMLButtonElement>) {
    if (!onChange || !resizable || full) return;
    event.preventDefault();
    event.stopPropagation();
    const handleElement = event.currentTarget;
    const ownerWindow = event.currentTarget.ownerDocument.defaultView ?? window;
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = value.width;
    const startHeight = value.height;
    let committed = false;
    let latestViewport = value;
    setResizingAxis(axis);
    setResizeDraftViewport(value);
    ownerWindow.document.body.classList.add('wb-design-viewport-resize-active');
    try {
      handleElement.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser has already released the pointer.
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const nextWidth = axis === 'width'
        ? normalizeDesignPreviewViewportDimension(startWidth + moveEvent.clientX - startX, startWidth)
        : startWidth;
      const nextHeight = axis === 'height'
        ? normalizeDesignPreviewViewportDimension(startHeight + moveEvent.clientY - startY, startHeight)
        : startHeight;
      latestViewport = reconcileDesignPreviewViewport({
        ...value,
        height: nextHeight,
        presetId: DEFAULT_DESIGN_PREVIEW_VIEWPORT.id,
        width: nextWidth,
      });
      setResizeDraftViewport(latestViewport);
      committed = true;
    };
    const stopResize = (commit: boolean) => {
      setResizingAxis(null);
      ownerWindow.document.body.classList.remove('wb-design-viewport-resize-active');
      try {
        handleElement.releasePointerCapture(event.pointerId);
      } catch {
        // The pointer may have been released by the browser already.
      }
      ownerWindow.removeEventListener('pointermove', handlePointerMove);
      ownerWindow.removeEventListener('pointerup', handlePointerUp);
      ownerWindow.removeEventListener('pointercancel', handlePointerCancel);
      if (commit && committed) onChange(latestViewport);
      setResizeDraftViewport(null);
    };
    const handlePointerUp = () => stopResize(true);
    const handlePointerCancel = () => stopResize(false);

    ownerWindow.addEventListener('pointermove', handlePointerMove);
    ownerWindow.addEventListener('pointerup', handlePointerUp);
    ownerWindow.addEventListener('pointercancel', handlePointerCancel);
  }

  return (
    <div
      className={[
        'wb-design-viewport-frame-shell',
        full ? 'wb-design-viewport-frame--full' : '',
        resizable ? 'wb-design-viewport-frame--resizable' : '',
        resizingAxis ? 'wb-design-viewport-frame-shell--resizing' : '',
        resizingAxis ? `wb-design-viewport-frame-shell--resize-${resizingAxis}` : '',
        rootSelected ? 'wb-design-viewport-frame--root-selected' : '',
      ].filter(Boolean).join(' ')}
      data-wb-design-viewport-frame={viewportScopeId}
    >
      <div
        className={[
          'wb-design-viewport-frame',
          full ? 'wb-design-viewport-frame--full' : '',
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
      {resizable ? (
        <>
          <button
            type="button"
            className="wb-design-viewport-resize-handle wb-design-viewport-resize-handle--width"
            aria-label="Resize responsive preview width"
            title="Resize width"
            onPointerDown={(event) => handleResizePointerDown('width', event)}
          />
          <button
            type="button"
            className="wb-design-viewport-resize-handle wb-design-viewport-resize-handle--height"
            aria-label="Resize responsive preview height"
            title="Resize height"
            onPointerDown={(event) => handleResizePointerDown('height', event)}
          />
        </>
      ) : null}
    </div>
  );
}

function RuntimePageProjectionPreview({
  onDrillIntoLayer,
  onKeyboardShortcut,
  onProjectionTreeChange,
  onSelectLayer,
  page,
  previewAppearance,
  previewTokenModes,
  selectedLayerId,
}: {
  onDrillIntoLayer: (layerId: string) => void;
  onKeyboardShortcut: (shortcut: RuntimePageKeyboardShortcut) => void;
  onProjectionTreeChange: (tree: EditableDocumentTree | null) => void;
  onSelectLayer: (layerId: string, mode: DesignPreviewSelectionMode, additive: boolean) => void;
  page: RuntimePageProjectionTarget;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  selectedLayerId: string | null;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onDrillIntoLayerRef = useRef(onDrillIntoLayer);
  const onKeyboardShortcutRef = useRef(onKeyboardShortcut);
  const onProjectionTreeChangeRef = useRef(onProjectionTreeChange);
  const onSelectLayerRef = useRef(onSelectLayer);
  const latestProjectionTreeRef = useRef<EditableDocumentTree | null>(null);
  const pendingSelectionRef = useRef<{
    additive: boolean;
    layerId: string;
    mode: DesignPreviewSelectionMode;
  } | null>(null);
  const [frameVersion, setFrameVersion] = useState(0);
  const [frameSelectionRects, setFrameSelectionRects] = useState<RuntimeDesignOverlayRect[]>([]);
  const projectionId = useMemo(
    () => getRuntimePageProjectionId(page),
    [page.sourceFile, page.sourceSignature],
  );
  const previewUrl = useMemo(
    () => getRuntimePagePreviewUrl(page, previewAppearance, previewTokenModes),
    [page.name, page.sourceFile, page.sourceSignature, previewAppearance, previewTokenModes],
  );

  useEffect(() => {
    onDrillIntoLayerRef.current = onDrillIntoLayer;
    onKeyboardShortcutRef.current = onKeyboardShortcut;
    onProjectionTreeChangeRef.current = onProjectionTreeChange;
    onSelectLayerRef.current = onSelectLayer;
  }, [onDrillIntoLayer, onKeyboardShortcut, onProjectionTreeChange, onSelectLayer]);

  useEffect(() => {
    onProjectionTreeChangeRef.current(null);
    latestProjectionTreeRef.current = null;
    pendingSelectionRef.current = null;
    setFrameSelectionRects([]);
    const requestCapture = () => {
      try {
        iframeRef.current?.contentWindow?.postMessage({
          projectionId,
          type: RUNTIME_PAGE_CAPTURE_REQUEST_MESSAGE,
        }, window.location.origin);
      } catch {
        // The iframe may be between documents while the preview URL changes.
      }
    };
    const commitSelection = (
      layerId: string,
      mode: DesignPreviewSelectionMode,
      additive: boolean,
      options: { defer?: boolean } = {},
    ) => {
      const tree = latestProjectionTreeRef.current;
      if (!tree || !findEditableTreeNodeInPreviewTree(tree.root, layerId)) {
        pendingSelectionRef.current = { additive, layerId, mode };
        requestCapture();
        return;
      }
      pendingSelectionRef.current = null;
      if (options.defer) {
        window.setTimeout(() => onSelectLayerRef.current(layerId, mode, additive), 0);
        return;
      }
      onSelectLayerRef.current(layerId, mode, additive);
    };
    const flushPendingSelection = () => {
      const pendingSelection = pendingSelectionRef.current;
      if (!pendingSelection) return;
      commitSelection(pendingSelection.layerId, pendingSelection.mode, pendingSelection.additive, { defer: true });
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isRecord(event.data) || event.data.projectionId !== projectionId) return;
      if (event.data.type === RUNTIME_PAGE_PROJECTION_TREE_MESSAGE) {
        const nextTree = isEditableDocumentTreeLike(event.data.tree) ? event.data.tree : null;
        latestProjectionTreeRef.current = nextTree;
        onProjectionTreeChangeRef.current(nextTree);
        flushPendingSelection();
        return;
      }
      if (event.data.type === RUNTIME_PAGE_SELECT_MESSAGE) {
        const layerId = typeof event.data.layerId === 'string' ? event.data.layerId : null;
        const mode = parseRuntimePageSelectionMode(event.data.mode);
        if (layerId && mode) commitSelection(layerId, mode, event.data.additive === true);
        return;
      }
      if (event.data.type === RUNTIME_PAGE_DRILL_MESSAGE) {
        const layerId = typeof event.data.layerId === 'string' ? event.data.layerId : null;
        if (layerId) onDrillIntoLayerRef.current(layerId);
        return;
      }
      if (event.data.type === RUNTIME_PAGE_KEYBOARD_SHORTCUT_MESSAGE) {
        const shortcut = parseRuntimePageKeyboardShortcut(event.data.shortcut);
        if (shortcut) onKeyboardShortcutRef.current(shortcut);
        return;
      }
      if (event.data.type === RUNTIME_PAGE_SELECTION_RECTS_MESSAGE) {
        const nextRects = parseRuntimePageSelectionRects(event.data.rects);
        setFrameSelectionRects((currentRects) => (
          areRuntimeDesignOverlayRectsEqual(currentRects, nextRects) ? currentRects : nextRects
        ));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    previewUrl,
    projectionId,
  ]);

  useEffect(() => {
    try {
      const frameWindow = iframeRef.current?.contentWindow;
      frameWindow?.postMessage({
        projectionId,
        selectedLayerId,
        type: RUNTIME_PAGE_SELECTED_LAYER_MESSAGE,
      }, window.location.origin);
    } catch {
      // The iframe may be between documents while the preview URL changes.
    }
  }, [frameVersion, projectionId, selectedLayerId]);

  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage({
        projectionId,
        type: RUNTIME_PAGE_CAPTURE_REQUEST_MESSAGE,
      }, window.location.origin);
    } catch {
      // The iframe may be between documents while the preview URL changes.
    }
  }, [frameVersion, previewUrl, projectionId]);

  return (
    <div
      ref={previewRef}
      className="wb-runtime-design-preview wb-runtime-design-preview--page wb-runtime-design-preview--source-fallback"
    >
      <iframe
        ref={iframeRef}
        className="wb-runtime-design-preview-frame"
        src={previewUrl}
        tabIndex={0}
        title={`${page.name} runtime page preview`}
        onPointerDown={() => iframeRef.current?.focus()}
        onLoad={() => setFrameVersion((version) => version + 1)}
      />
      <RuntimePageSelectionOverlay
        containerRef={previewRef}
        frameRects={frameSelectionRects}
        frameVersion={frameVersion}
        iframeRef={iframeRef}
      />
    </div>
  );
}

function RuntimeDesignProjectionPreview({
  args,
  assets,
  draftTree,
  onDrillIntoLayer,
  onMoveLayer,
  onProjectionTreeChange,
  onSelectLayer,
  previewAppearance,
  previewTokenModes,
  selectedLayerId,
  selectedLayerIds,
  story,
  tokenRegistry,
}: {
  args: WorkbenchStoryArgs;
  assets: WorkbenchAssetRegistry;
  draftTree: EditableDocumentTree | null;
  onDrillIntoLayer: (layerId: string) => void;
  onMoveLayer: (layerId: string, intent: SourceKeyboardMoveIntent) => void;
  onProjectionTreeChange: (tree: EditableDocumentTree | null) => void;
  onSelectLayer: (layerId: string, mode: DesignPreviewSelectionMode, additive: boolean) => void;
  previewAppearance: DesignPreviewAppearance;
  previewTokenModes: PreviewTokenModeSelection;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  story: WorkbenchStory;
  tokenRegistry: TokenRegistry;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const tokenVariables = useMemo(
    () => getSourceTreePreviewTokenVariables(tokenRegistry, previewTokenModes),
    [previewTokenModes, tokenRegistry],
  );
  const previewTokenModeAttribute = useMemo(
    () => serializeTokenModeOverride(previewTokenModes) ?? undefined,
    [previewTokenModes],
  );
  const previewThemeMode = useMemo(
    () => getDesignPreviewAppearanceThemeMode(previewAppearance),
    [previewAppearance],
  );
  const tokenScopeId = useStableStyleScopeId('runtime-design-preview');
  const tokenScopeRule = useMemo(
    () => createScopedCssRule(
      `[data-wb-design-style-scope="${tokenScopeId}"]`,
      createCssDeclarationBlockFromStyleVariables(tokenVariables),
    ),
    [tokenScopeId, tokenVariables],
  );
  const fontCssText = useMemo(
    () => getWorkbenchDefaultFontCssText(
      assets,
      '.wb-runtime-design-preview, .wb-runtime-design-preview [data-workbench-portal-root="true"]',
    ),
    [assets],
  );
  const projectionId = useMemo(
    () => getRuntimeProjectionId(story),
    [story.componentId, story.name, story.sourceFile],
  );
  const renderedStory = useMemo(() => story.render(args), [args, story]);

  useLayoutEffect(() => {
    const rootElement = previewRef.current;
    if (!rootElement) return;
    const tree = createEditableDocumentTreeFromDomProjection({
      label: `${story.name} runtime projection`,
      previewTokenModes,
      projectionId,
      rootElement,
      sourceFile: story.sourceFile,
      tokenRegistry,
    });
    onProjectionTreeChange(tree);
    markRuntimeDesignSelection(rootElement, selectedLayerId);
  }, [onProjectionTreeChange, previewTokenModes, projectionId, renderedStory, story.name, story.sourceFile, tokenRegistry]);

  useLayoutEffect(() => {
    if (!previewRef.current) return;
    applyRuntimeDesignTreeToDom(previewRef.current, draftTree);
    markRuntimeDesignSelection(previewRef.current, selectedLayerId);
  }, [draftTree, selectedLayerId]);

  useEffect(() => {
    if (!previewRef.current) return;
    markRuntimeDesignSelection(previewRef.current, selectedLayerId);
  }, [selectedLayerId]);
  useDocumentStyleText(tokenScopeRule);

  return (
    <div
      ref={previewRef}
      className={`${getLibraryScopeClassName()} wb-runtime-design-preview`}
      data-astryx-media={previewThemeMode}
      data-theme={previewThemeMode}
      data-wb-token-modes={previewTokenModeAttribute}
      data-wb-preview-appearance={previewAppearance}
      data-wb-design-style-scope={tokenScopeId}
      onClick={(event) => {
        event.stopPropagation();
        const additive = isDesignLayerAdditiveSelectionEvent(event);
        const mode = event.metaKey || event.ctrlKey
          ? 'smart-deep'
          : 'direct';
        const layerId = getRuntimeDesignNodeIdFromPoint(event.currentTarget, event, { mode }) ??
          getRuntimeDesignNodeIdFromEventTarget(event.target, {
            mode,
            rootElement: event.currentTarget,
          });
        if (!layerId) return;
        onSelectLayer(layerId, mode, additive);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        const layerId = getRuntimeDesignNodeIdFromPoint(event.currentTarget, event, { mode: 'deep' }) ??
          getRuntimeDesignNodeIdFromEventTarget(event.target, {
          mode: 'deep',
          rootElement: event.currentTarget,
        });
        if (layerId) onDrillIntoLayer(layerId);
      }}
    >
      {fontCssText ? <style>{fontCssText}</style> : null}
      <div data-workbench-portal-root="true" />
      {renderedStory}
      <RuntimeDesignSelectionOverlay containerRef={previewRef} selectedLayerId={selectedLayerId} />
    </div>
  );
}

function getRuntimeProjectionId(story: WorkbenchStory): string {
  return `${story.sourceFile}#${story.componentId}#${story.name}`;
}

function getRuntimePageProjectionId(page: RuntimePageProjectionTarget): string {
  return `page:${page.sourceFile}:${page.sourceSignature}`;
}

function getRuntimePagePreviewUrl(
  page: RuntimePageProjectionTarget,
  previewAppearance: DesignPreviewAppearance,
  previewTokenModes: PreviewTokenModeSelection,
): string {
  const previewParams = new URLSearchParams({
    appearance: previewAppearance,
    source: page.sourceFile,
    title: page.name,
    tokenModes: JSON.stringify(previewTokenModes),
  });
  previewParams.set('runtimeProjection', getRuntimePageProjectionId(page));
  return withWorkbenchLocalBridgePairingParams(
    toWorkbenchPreviewUrl(`/page-preview.html?${previewParams.toString()}`),
  );
}

function parseRuntimePageSelectionMode(value: unknown): DesignPreviewSelectionMode | null {
  return value === 'deep' || value === 'direct' || value === 'exact' || value === 'smart-deep' ? value : null;
}

function parseRuntimePageKeyboardShortcut(value: unknown): RuntimePageKeyboardShortcut | null {
  if (!isRecord(value) || typeof value.action !== 'string') return null;
  if (value.action === 'copy' || value.action === 'cut' || value.action === 'delete' || value.action === 'duplicate' || value.action === 'insert-child' || value.action === 'wrap') {
    return { action: value.action };
  }
  if (value.action === 'paste') {
    return value.placement === 'inside' || value.placement === 'below'
      ? { action: 'paste', placement: value.placement }
      : null;
  }
  if (value.action === 'move') {
    const intent = parseRuntimePageKeyboardMoveIntent(value.intent);
    return intent ? { action: 'move', intent } : null;
  }
  return null;
}

function parseRuntimePageKeyboardMoveIntent(value: unknown): SourceKeyboardMoveIntent | null {
  if (!isRecord(value) || typeof value.kind !== 'string') return null;
  if (value.kind === 'indent' || value.kind === 'outdent') return { kind: value.kind };
  if (value.kind !== 'reorder' || typeof value.offset !== 'number' || !Number.isFinite(value.offset)) return null;
  return { kind: 'reorder', offset: value.offset < 0 ? -1 : 1 };
}

function isEditableDocumentTreeLike(value: unknown): value is EditableDocumentTree {
  return isRecord(value) && typeof value.id === 'string' && isRecord(value.root);
}

function getRuntimeProjectionTreeSignature(tree: EditableDocumentTree): string {
  return JSON.stringify(tree);
}

function parseRuntimePageSelectionRects(value: unknown): RuntimeDesignOverlayRect[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((rect): RuntimeDesignOverlayRect[] => {
    if (!isRecord(rect)) return [];
    const height = getFiniteRuntimeRectNumber(rect.height);
    const left = getFiniteRuntimeRectNumber(rect.left);
    const top = getFiniteRuntimeRectNumber(rect.top);
    const width = getFiniteRuntimeRectNumber(rect.width);
    if (height === null || left === null || top === null || width === null || height <= 0 || width <= 0) return [];
    return [{ height, left, top, width }];
  });
}

function getFiniteRuntimeRectNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function RuntimePageSelectionOverlay({
  containerRef,
  frameRects,
  frameVersion: _frameVersion,
  iframeRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  frameRects: RuntimeDesignOverlayRect[];
  frameVersion: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const [rects, setRects] = useState<RuntimeDesignOverlayRect[]>([]);
  const rectsRef = useRef<RuntimeDesignOverlayRect[]>([]);
  const overlayScopeId = useStableStyleScopeId('runtime-page-selection-overlay');
  const overlayScopeRule = useMemo(
    () => rects.map((rect, index) => createScopedCssRule(
      `[data-wb-runtime-selection-overlay="${overlayScopeId}"] .wb-runtime-design-selection-ring[data-wb-runtime-selection-ring="${index}"]`,
      [
        `height: ${formatCssPx(rect.height)}`,
        `transform: translate(${formatCssPx(rect.left)}, ${formatCssPx(rect.top)})`,
        `width: ${formatCssPx(rect.width)}`,
      ].join(';'),
    )).join('\n'),
    [overlayScopeId, rects],
  );
  useDocumentStyleText(overlayScopeRule);

  useLayoutEffect(() => {
    if (frameRects.length === 0) {
      if (rectsRef.current.length > 0) {
        rectsRef.current = [];
        setRects([]);
      }
      return undefined;
    }

    const container = containerRef.current;
    const iframe = iframeRef.current;
    if (!container || !iframe) {
      if (rectsRef.current.length > 0) {
        rectsRef.current = [];
        setRects([]);
      }
      return undefined;
    }

    let frameId: number | null = null;
    const commitRects = (nextRects: RuntimeDesignOverlayRect[]) => {
      if (areRuntimeDesignOverlayRectsEqual(rectsRef.current, nextRects)) return;
      rectsRef.current = nextRects;
      setRects(nextRects);
    };
    const update = () => {
      frameId = null;
      commitRects(getRuntimePageSelectionOverlayRects(container, iframe, frameRects));
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    observeRuntimeDesignResizeTarget(resizeObserver, container);
    observeRuntimeDesignResizeTarget(resizeObserver, iframe);
    container.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);
    update();

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [containerRef, frameRects, iframeRef, _frameVersion]);

  if (rects.length === 0) return null;

  return (
    <div
      className="wb-runtime-design-selection-overlay"
      data-wb-runtime-selection-overlay={overlayScopeId}
      aria-hidden="true"
    >
      {rects.map((rect, index) => (
        <span
          className="wb-runtime-design-selection-ring"
          key={`${rect.left}:${rect.top}:${rect.width}:${rect.height}:${index}`}
          data-wb-runtime-selection-ring={index}
        />
      ))}
    </div>
  );
}

function RuntimeDesignSelectionOverlay({
  containerRef,
  selectedLayerId,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  selectedLayerId: string | null;
}) {
  const [rects, setRects] = useState<RuntimeDesignOverlayRect[]>([]);
  const rectsRef = useRef<RuntimeDesignOverlayRect[]>([]);
  const overlayScopeId = useStableStyleScopeId('runtime-selection-overlay');
  const overlayScopeRule = useMemo(
    () => rects.map((rect, index) => createScopedCssRule(
      `[data-wb-runtime-selection-overlay="${overlayScopeId}"] .wb-runtime-design-selection-ring[data-wb-runtime-selection-ring="${index}"]`,
      [
        `height: ${formatCssPx(rect.height)}`,
        `transform: translate(${formatCssPx(rect.left)}, ${formatCssPx(rect.top)})`,
        `width: ${formatCssPx(rect.width)}`,
      ].join(';'),
    )).join('\n'),
    [overlayScopeId, rects],
  );
  useDocumentStyleText(overlayScopeRule);

  useLayoutEffect(() => {
    if (!selectedLayerId) {
      if (rectsRef.current.length > 0) {
        rectsRef.current = [];
        setRects([]);
      }
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      if (rectsRef.current.length > 0) {
        rectsRef.current = [];
        setRects([]);
      }
      return undefined;
    }

    let frameId: number | null = null;
    const commitRects = (nextRects: RuntimeDesignOverlayRect[]) => {
      if (areRuntimeDesignOverlayRectsEqual(rectsRef.current, nextRects)) return;
      rectsRef.current = nextRects;
      setRects(nextRects);
    };
    const update = () => {
      frameId = null;
      commitRects(getRuntimeDesignSelectionOverlayRects(container, selectedLayerId));
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(container);
    getRuntimeDesignOverlayResizeTargets(container, selectedLayerId).forEach((element) => resizeObserver.observe(element));
    container.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);
    update();

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [containerRef, selectedLayerId]);

  if (rects.length === 0) return null;

  return (
    <div
      className="wb-runtime-design-selection-overlay"
      data-wb-runtime-selection-overlay={overlayScopeId}
      aria-hidden="true"
    >
      {rects.map((rect, index) => (
        <span
          className="wb-runtime-design-selection-ring"
          key={`${rect.left}:${rect.top}:${rect.width}:${rect.height}:${index}`}
          data-wb-runtime-selection-ring={index}
        />
      ))}
    </div>
  );
}

function getRuntimeDesignSelectionOverlayRects(
  container: HTMLElement | null,
  selectedLayerId: string | null,
): RuntimeDesignOverlayRect[] {
  if (!container || !selectedLayerId) return [];

  const containerRect = container.getBoundingClientRect();
  return getRuntimeDesignOverlayElements(container, selectedLayerId).flatMap((element) => {
    const rect = getRuntimeDesignOverlayVisualRect(element);
    if (!rect || rect.width <= 0 || rect.height <= 0) return [];
    return [{
      height: normalizeRuntimeDesignOverlayRectValue(rect.height),
      left: normalizeRuntimeDesignOverlayRectValue(rect.left - containerRect.left + container.scrollLeft),
      top: normalizeRuntimeDesignOverlayRectValue(rect.top - containerRect.top + container.scrollTop),
      width: normalizeRuntimeDesignOverlayRectValue(rect.width),
    }];
  });
}

function getRuntimePageSelectionOverlayRects(
  container: HTMLElement | null,
  iframe: HTMLIFrameElement | null,
  frameRects: RuntimeDesignOverlayRect[],
): RuntimeDesignOverlayRect[] {
  if (!container || !iframe || frameRects.length === 0) return [];

  const containerRect = container.getBoundingClientRect();
  const iframeRect = iframe.getBoundingClientRect();
  return frameRects.map((rect) => ({
    height: normalizeRuntimeDesignOverlayRectValue(rect.height),
    left: normalizeRuntimeDesignOverlayRectValue(iframeRect.left - containerRect.left + rect.left + container.scrollLeft),
    top: normalizeRuntimeDesignOverlayRectValue(iframeRect.top - containerRect.top + rect.top + container.scrollTop),
    width: normalizeRuntimeDesignOverlayRectValue(rect.width),
  }));
}

function getRuntimeDesignOverlayElements(container: HTMLElement, layerId: string): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(`[data-wb-runtime-node-id="${escapeRuntimeDesignAttributeSelectorValue(layerId)}"]`));
}

function getRuntimeDesignOverlayResizeTargets(container: HTMLElement, layerId: string): HTMLElement[] {
  const targets = new Set<HTMLElement>();
  for (const element of getRuntimeDesignOverlayElements(container, layerId)) {
    const drawerTarget = getRuntimeDesignOpenDrawerTarget(element);
    if (drawerTarget) {
      targets.add(drawerTarget);
      continue;
    }
    if (element.getClientRects().length > 0) {
      targets.add(element);
      continue;
    }

    getRuntimeDesignOverlayVisualTargets(element).forEach((target) => targets.add(target));
  }
  return Array.from(targets);
}

function observeRuntimeDesignResizeTarget(observer: ResizeObserver, target: Element | null) {
  if (!target) return;
  try {
    observer.observe(target);
  } catch {
    // Iframes can briefly be unavailable while the preview URL changes.
  }
}

function getRuntimeDesignOverlayVisualRect(element: HTMLElement): DOMRect | null {
  const drawerTarget = getRuntimeDesignOpenDrawerTarget(element);
  if (drawerTarget) {
    const drawerRect = drawerTarget.getBoundingClientRect();
    if (drawerRect.width > 0 && drawerRect.height > 0) return drawerRect;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;

  const childRects = getRuntimeDesignOverlayVisualTargets(element)
    .map((target) => target.getBoundingClientRect())
    .filter((childRect) => childRect.width > 0 && childRect.height > 0);
  if (childRects.length === 0) return null;

  const left = Math.min(...childRects.map((childRect) => childRect.left));
  const top = Math.min(...childRects.map((childRect) => childRect.top));
  const right = Math.max(...childRects.map((childRect) => childRect.right));
  const bottom = Math.max(...childRects.map((childRect) => childRect.bottom));
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

function getRuntimeDesignOverlayVisualTargets(element: HTMLElement): HTMLElement[] {
  return Array.from(element.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    const rect = child.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return [child];
    return getRuntimeDesignOverlayVisualTargets(child);
  });
}

function getRuntimeDesignOpenDrawerTarget(element: HTMLElement): HTMLElement | null {
  const drawerRoot = element.matches('.sidebar-drawer-root.is-open')
    ? element
    : element.querySelector<HTMLElement>('.sidebar-drawer-root.is-open');
  if (!drawerRoot) return null;
  return drawerRoot.querySelector<HTMLElement>('.sidebar-drawer-panel') ?? drawerRoot;
}

function escapeRuntimeDesignAttributeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeRuntimeDesignOverlayRectValue(value: number): number {
  return Math.round(value * 2) / 2;
}

function areRuntimeDesignOverlayRectsEqual(
  left: RuntimeDesignOverlayRect[],
  right: RuntimeDesignOverlayRect[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((leftRect, index) => {
    const rightRect = right[index];
    return Boolean(rightRect) &&
      Math.abs(leftRect.left - rightRect.left) < 0.5 &&
      Math.abs(leftRect.top - rightRect.top) < 0.5 &&
      Math.abs(leftRect.width - rightRect.width) < 0.5 &&
      Math.abs(leftRect.height - rightRect.height) < 0.5;
  });
}

function DesignPreviewActionBar({
  canEditSourceFields,
  floating = false,
  selectedSourceNode,
}: {
  canEditSourceFields: boolean;
  floating?: boolean;
  selectedSourceNode: EditableTreeNode | null;
}) {
  if (!selectedSourceNode) return null;

  return (
    <div
      className={floating ? 'wb-design-preview-actionbar wb-design-preview-actionbar--floating' : 'wb-design-preview-actionbar'}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="wb-design-preview-actionbar-label">{selectedSourceNode.label}</span>
      <span className="wb-design-preview-actionbar-meta">
        {canEditSourceFields ? 'Source-backed' : 'Preview only'}
      </span>
    </div>
  );
}

function formatSourceStructureAction(action: SourceStructureAction): string {
  if (action === 'move-up') return 'move up';
  if (action === 'move-down') return 'move down';
  return action;
}

function formatSourceStructureActionPastTense(action: SourceStructureAction): string {
  if (action === 'delete') return 'deleted';
  if (action === 'duplicate') return 'duplicated';
  if (action === 'move-up') return 'moved up';
  return 'moved down';
}

function shouldIgnoreDesignEditorShortcut(target: EventTarget | null): boolean {
  if (!isDesignEditorShortcutElement(target)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], .wb-editor-target-tab-input, .wb-token-picker-popover, .wb-popover-panel, .wb-modal, .wb-modal-backdrop'));
}

function getDesignEditorShortcutActiveTarget(target: EventTarget | null): EventTarget | null {
  if (!(target instanceof HTMLIFrameElement)) return target;
  try {
    return target.contentDocument?.activeElement ?? target;
  } catch {
    return target;
  }
}

function isDesignEditorShortcutElement(target: EventTarget | null): target is Element {
  return Boolean(
    target &&
    typeof target === 'object' &&
    'closest' in target &&
    typeof (target as { closest?: unknown }).closest === 'function',
  );
}

function isDesignStructureShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.wb-design-layer-list, .wb-source-visual-preview, .wb-runtime-design-preview'));
}

function isDesignEditorShortcutContext(target: EventTarget | null): boolean {
  if (document.querySelector('.wb-modal-backdrop')) return false;
  if (!(target instanceof Element)) return Boolean(document.querySelector('.wb-design-editor'));
  if (target === document.body || target === document.documentElement) return Boolean(document.querySelector('.wb-design-editor'));
  return Boolean(target.closest('.wb-design-editor'));
}

function isDesignShortcutKey(event: KeyboardEvent, key: string, code: string): boolean {
  return event.key.toLowerCase() === key || event.code === code;
}

function shouldIgnoreDesignHistoryShortcut(target: EventTarget | null): boolean {
  if (document.querySelector('.wb-modal-backdrop')) return true;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.wb-editor-target-tab-input, .wb-token-picker-popover, .wb-popover-panel'));
}

function isSpecNoteHistoryShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.wb-spec-notes-panel'));
}

function isSpecNoteLocalHistoryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (!target.closest('.wb-spec-notes-panel')) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"], .wb-spec-note-mini-editor__content'));
}

function createSourceLayerSelectionSnapshot(
  layer: PreviewLayer,
  subject: ProjectAssetHistorySubject,
  selection: WorkbenchSelectionState,
): WorkbenchSelectionSnapshot {
  return createSourceSelectionSnapshotFromNodeId(subject, layer.id, selection);
}

function createSourceSelectionSnapshotFromNodeId(
  subject: ProjectAssetHistorySubject,
  nodeId: string | null,
  selection: WorkbenchSelectionState,
): WorkbenchSelectionSnapshot {
  return {
    activeDocumentId: subject.id,
    selectedSourceNodeId: nodeId,
    designPreviewDrillPath: getDesignPreviewDrillPathFromSelection(selection),
    collapsedDesignLayerIds: getCollapsedDesignLayerIdsFromSelection(selection),
  };
}

function createDesignHistorySelectionState(
  previousSelection: WorkbenchSelectionState,
  restoredTree: EditableDocumentTree | null,
  selectedLayerId: string | null,
  snapshot: WorkbenchSelectionSnapshot,
  subject: ProjectAssetHistorySubject,
): WorkbenchSelectionState {
  const extensions: Record<string, unknown> = {
    ...previousSelection.extensions,
    activeDesignTargetKind: subject.kind,
    activeDesignTargetId: subject.id,
    activeDesignSourceFile: subject.sourceFile,
    [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: selectedLayerId,
  };
  if (snapshot.designPreviewDrillPath) {
    extensions[DESIGN_PREVIEW_DRILL_PATH_EXTENSION] = reconcilePreviewDrillPath(restoredTree?.root ?? null, snapshot.designPreviewDrillPath);
  }
  if (snapshot.collapsedDesignLayerIds) {
    extensions[COLLAPSED_DESIGN_LAYER_IDS_EXTENSION] = dedupeStrings(snapshot.collapsedDesignLayerIds);
  }
  return {
    ...previousSelection,
    activeTarget: createDesignSelectionTargetFromSubject(subject),
    selectedTargets: [createDesignSelectionTargetFromSubject(subject)],
    updatedAt: new Date().toISOString(),
    extensions,
  };
}

function createDesignSelectionTargetFromSubject(subject: ProjectAssetHistorySubject): WorkbenchSelectionTarget {
  return subject.kind === 'page'
    ? { kind: 'page', pageId: subject.id, sourceFile: subject.sourceFile }
    : { kind: 'component', componentId: subject.id, sourceFile: subject.sourceFile };
}

function isSameDesignSourceNode(left: EditableTreeNode | null | undefined, right: EditableTreeNode | null | undefined): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.id !== right.id) return false;
  if (left.source?.sourceFile !== right.source?.sourceFile) return false;
  const leftLocation = left.sourceLocation;
  const rightLocation = right.sourceLocation;
  if (!leftLocation || !rightLocation) return leftLocation === rightLocation;
  return leftLocation.startLine === rightLocation.startLine &&
    leftLocation.startColumn === rightLocation.startColumn &&
    leftLocation.endLine === rightLocation.endLine &&
    leftLocation.endColumn === rightLocation.endColumn;
}

function resolveDesignBatchEditableSourceNodes({
  root,
  selectedLayerIds,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!root || !sourceFile || selectedLayerIds.length <= 1) return [];

  const nodes = selectedLayerIds
    .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
    .filter((node): node is EditableTreeNode => Boolean(
      node &&
      node.source?.sourceFile === sourceFile &&
      node.sourceLocation &&
      hasDesignSourceNodeCapability(root, node.id, 'canEditFields'),
    ));
  if (nodes.length <= 1 || nodes.length !== selectedLayerIds.length) return [];

  const firstSignature = getDesignInspectorModelSignature(nodes[0]!);
  if (!firstSignature || nodes.some((node) => getDesignInspectorModelSignature(node) !== firstSignature)) return [];

  return nodes;
}

function resolveDesignCopyableSourceNodes({
  root,
  selectedLayerIds,
  selectedNode,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  selectedNode: EditableTreeNode | null;
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!sourceFile) return [];
  if (selectedLayerIds.length > 1) {
    if (!root) return [];
    const nodes = selectedLayerIds
      .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
      .filter((node): node is EditableTreeNode => Boolean(
        node &&
        node.source?.sourceFile === sourceFile &&
        node.sourceLocation &&
        hasDesignSourceNodeCapability(root, node.id, 'canCopy'),
      ));
    return nodes.length === selectedLayerIds.length ? nodes : [];
  }

  return selectedNode?.source?.sourceFile === sourceFile &&
    selectedNode.sourceLocation &&
    hasDesignSourceNodeCapability(root, selectedNode.id, 'canCopy')
    ? [selectedNode]
    : [];
}

function resolveDesignMappableSourceNodes({
  root,
  selectedLayerIds,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!root || !sourceFile || selectedLayerIds.length <= 1) return [];
  const nodes = selectedLayerIds
    .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
    .filter((node): node is EditableTreeNode => Boolean(
      node &&
      node.id !== root.id &&
      node.source?.sourceFile === sourceFile &&
      node.sourceLocation &&
      hasDesignSourceNodeCapability(root, node.id, 'canEditStructure'),
    ));
  if (nodes.length !== selectedLayerIds.length) return [];

  const parent = findEditableTreeParent(root, nodes[0]!.id);
  if (!parent || nodes.some((node) => findEditableTreeParent(root, node.id)?.id !== parent.id)) return [];
  const selectedNodeIds = new Set(nodes.map((node) => node.id));
  if (nodes.some((node) => nodes.some((candidate) => candidate.id !== node.id && containsEditableTreeNode(candidate, node.id)))) {
    return [];
  }

  return getEditableTreeChildrenForDesign(parent).filter((child) => selectedNodeIds.has(child.id));
}

function resolveDesignWrappableSourceNodes({
  root,
  selectedLayerIds,
  selectedNode,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  selectedNode: EditableTreeNode | null;
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!root || !sourceFile) return [];
  const nodes = selectedLayerIds.length > 1
    ? selectedLayerIds
      .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
      .filter((node): node is EditableTreeNode => Boolean(
        node &&
        node.id !== root.id &&
        node.source?.sourceFile === sourceFile &&
        node.sourceLocation &&
        hasDesignSourceNodeCapability(root, node.id, 'canEditStructure'),
      ))
    : selectedNode &&
        selectedNode.id !== root.id &&
        selectedNode.source?.sourceFile === sourceFile &&
        selectedNode.sourceLocation &&
        hasDesignSourceNodeCapability(root, selectedNode.id, 'canEditStructure')
      ? [selectedNode]
      : [];

  if (nodes.length === 0 || (selectedLayerIds.length > 1 && nodes.length !== selectedLayerIds.length)) return [];

  const parent = findEditableTreeParent(root, nodes[0]!.id);
  if (!parent || nodes.some((node) => findEditableTreeParent(root, node.id)?.id !== parent.id)) return [];
  const selectedNodeIds = new Set(nodes.map((node) => node.id));
  if (nodes.some((node) => nodes.some((candidate) => candidate.id !== node.id && containsEditableTreeNode(candidate, node.id)))) {
    return [];
  }

  return getEditableTreeChildrenForDesign(parent).filter((child) => selectedNodeIds.has(child.id));
}

function resolveDesignMovableSourceNodes({
  root,
  selectedLayerIds,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!root || !sourceFile || selectedLayerIds.length <= 1) return [];
  const nodes = selectedLayerIds
    .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
    .filter((node): node is EditableTreeNode => Boolean(
      node &&
      node.id !== root.id &&
      node.source?.sourceFile === sourceFile &&
      node.sourceLocation &&
      hasDesignSourceNodeCapability(root, node.id, 'canEditStructure'),
    ));
  if (nodes.length !== selectedLayerIds.length) return [];
  if (nodes.some((node) => nodes.some((candidate) => (
    candidate.id !== node.id &&
    containsEditableTreeNode(candidate, node.id)
  )))) {
    return [];
  }
  return nodes.sort((left, right) => {
    const leftLocation = left.sourceLocation!;
    const rightLocation = right.sourceLocation!;
    return leftLocation.startLine - rightLocation.startLine ||
      leftLocation.startColumn - rightLocation.startColumn;
  });
}

function resolveDesignPasteTarget({
  placement,
  root,
  selectedNode,
}: {
  placement: DesignPastePlacement;
  root: EditableTreeNode | null;
  selectedNode: EditableTreeNode;
}): { parentNode: EditableTreeNode; targetIndex?: number } | null {
  if (!root) return null;
  if (placement === 'inside' || selectedNode.id === root.id) {
    return { parentNode: selectedNode };
  }

  const parentNode = findEditableTreeParent(root, selectedNode.id);
  if (!parentNode) return null;
  const selectedIndex = getEditableTreeChildrenForDesign(parentNode).findIndex((child) => child.id === selectedNode.id);
  if (selectedIndex < 0) return null;
  return {
    parentNode,
    targetIndex: selectedIndex + 1,
  };
}

function resolveDesignDeletableSourceNodes({
  root,
  selectedLayerIds,
  sourceFile,
}: {
  root: EditableTreeNode | null;
  selectedLayerIds: string[];
  sourceFile: string | null;
}): EditableTreeNode[] {
  if (!root || !sourceFile || selectedLayerIds.length <= 1) return [];
  const nodes = selectedLayerIds
    .map((layerId) => findEditableTreeNodeForDesign(root, layerId))
    .filter((node): node is EditableTreeNode => Boolean(
      node &&
      node.id !== root.id &&
      node.source?.sourceFile === sourceFile &&
      node.sourceLocation &&
      hasDesignSourceNodeCapability(root, node.id, 'canEditStructure'),
    ));
  return nodes.length === selectedLayerIds.length ? nodes : [];
}

function hasDesignSourceNodeCapability(
  root: EditableTreeNode | null,
  nodeId: string,
  capability: 'canCopy' | 'canEditFields' | 'canEditStructure',
): boolean {
  return resolveEditableTreeSourceCapabilities({
    activeEntityId: 'design-source',
    root,
    selectedNodeId: nodeId,
  }).capabilities[capability];
}

function collectEditableSourceSubtreeNodes(node: EditableTreeNode, sourceFile: string): EditableTreeNode[] {
  const nodes: EditableTreeNode[] = [];
  const visit = (candidate: EditableTreeNode) => {
    if (candidate.source?.sourceFile === sourceFile && candidate.sourceLocation) {
      nodes.push(candidate);
    }
    for (const child of candidate.children ?? []) visit(child);
  };
  visit(node);
  return nodes;
}

function resolveTopLevelDesignSourceNodes(
  root: EditableTreeNode | null,
  nodes: EditableTreeNode[],
): EditableTreeNode[] {
  if (!root) return nodes;
  return nodes.filter((node) => !nodes.some((candidate) => (
    candidate.id !== node.id && containsEditableTreeNode(candidate, node.id)
  )));
}

function resolveDesignMultiDeleteSelectionId(
  root: EditableTreeNode | null,
  nodes: EditableTreeNode[],
): string | null {
  if (!root || nodes.length === 0) return null;
  const deletedNodeIds = new Set(nodes.map((node) => node.id));
  const parentIds = dedupeStrings(nodes
    .map((node) => findEditableTreeParent(root, node.id)?.id ?? null)
    .filter((id): id is string => Boolean(id && !deletedNodeIds.has(id))));
  if (parentIds.length === 1) return parentIds[0]!;
  return root.id;
}

function containsEditableTreeNode(parent: EditableTreeNode, nodeId: string): boolean {
  return getEditableTreeChildrenForDesign(parent).some((child) => child.id === nodeId || containsEditableTreeNode(child, nodeId));
}

function getDesignInspectorModelSignature(node: EditableTreeNode): string | null {
  const model = resolveHtmlInspectorModel({
    inspectable: node.inspectable,
    jsxName: node.source?.jsxName,
    kind: node.kind,
    sourceBacked: Boolean(node.source?.sourceFile),
  });
  if (model.category === 'unknown') return null;

  return JSON.stringify({
    accessibilityFields: model.accessibilityFields,
    category: model.category,
    contentFields: model.contentFields,
    elementName: model.elementName,
    layoutFields: model.layoutFields,
    sections: model.sections,
    tokenBindingFields: model.tokenBindingFields,
  });
}

function sortEditableNodesByDescendingSourceLocation(nodes: EditableTreeNode[]): EditableTreeNode[] {
  return [...nodes].sort((left, right) => {
    const leftLocation = left.sourceLocation;
    const rightLocation = right.sourceLocation;
    if (!leftLocation || !rightLocation) return 0;
    return (rightLocation.startLine - leftLocation.startLine) ||
      (rightLocation.startColumn - leftLocation.startColumn);
  });
}

/**
 * A batch edit writes one value across several nodes whose previous values need
 * not agree. The field and the new value are shared and worth logging; `before`
 * is only truthful when every node it touched started from the same value.
 */
function formatTokenReferenceForHistorySummary(token: TokenReference | null | undefined): string | null {
  return token ? `${token.collectionId}/${token.tokenId}` : null;
}

function collapseBatchChangeSummaries(
  changesPerNode: WorkbenchEditChangeSummary[][],
): WorkbenchEditChangeSummary[] | undefined {
  const first = changesPerNode[0];
  if (!first?.length) return undefined;

  return first.map((summary, index) => {
    const befores = changesPerNode.map((changes) => changes[index]?.before ?? null);
    return befores.every((before) => before === befores[0])
      ? summary
      : { ...summary, before: null };
  });
}

function upsertDesignHistoryTimelineEntry<TState>(
  timeline: WorkbenchHistoryFile['timeline'],
  transaction: WorkbenchEditTransaction<TState>,
): WorkbenchHistoryFile['timeline'] {
  const entry = createHistoryTimelineEntry(transaction);
  const existingIndex = timeline.findIndex((candidate) => candidate.transactionId === transaction.id);
  if (existingIndex >= 0) {
    return [
      ...timeline.slice(0, existingIndex),
      entry,
      ...timeline.slice(existingIndex + 1),
    ];
  }
  return [...timeline, entry].slice(-1000);
}

function getPreviewLayerIcon(kind: PreviewLayerKind, node?: EditableTreeNode | null): ReactNode {
  if (node?.sourceExpression) return <Code2 size={13} />;

  switch (kind) {
    case 'frame':
      if (isEditableTreeHtmlTagNode(node)) return <Code2 size={13} />;
      return <Box size={13} />;
    case 'component-instance':
      return <Diamond size={13} />;
    case 'text':
      return <Type size={13} />;
  }
}

function isEditableTreeHtmlTagNode(node?: EditableTreeNode | null): boolean {
  const jsxName = node?.source?.jsxName;
  return typeof jsxName === 'string' && /^[a-z][a-z0-9:-]*$/.test(jsxName);
}

function getSourceInsertPickerInitialMode(canInsertComponent: boolean): 'component' | 'html' {
  return canInsertComponent ? 'component' : 'html';
}

function isSourceTreeResultLoading(result: SourceTreeResult): boolean {
  return result.contents === null &&
    result.tree === null &&
    (result.diagnostic.startsWith('Reading ') || result.diagnostic.startsWith('Checking '));
}

function createWorkbenchDesignPage(
  pages: WorkbenchPageRegistry,
  reservedSourceFiles: Set<string> = new Set(),
  folder: string = '',
): DesignLibraryPage {
  const index = getNextDesignPageIndex(pages, reservedSourceFiles, folder);
  const name = index === 1 ? 'Untitled page' : `Untitled page ${index}`;
  const slug = index === 1 ? 'untitled-page' : `untitled-page-${index}`;
  const folderPath = folder ? `${folder}/` : '';
  const sourceFile = `src/workbench-pages/${folderPath}${toPascalCase(slug)}.tsx`;

  return {
    id: `page-${slug}`,
    name,
    route: `/${slug}`,
    sourceFile,
    rootNodeId: `source:${slug}:root`,
    status: 'draft',
    extensions: {},
  };
}

function createDuplicatedWorkbenchDesignPage(
  pages: WorkbenchPageRegistry,
  sourcePage: DesignLibraryPage,
  reservedSourceFiles: Set<string> = new Set(),
): DesignLibraryPage {
  const folder = getPageFolderForSourceFile(sourcePage.sourceFile);
  const index = getNextDesignPageIndex(pages, reservedSourceFiles, folder);
  const name = `${sourcePage.name} copy`;
  const slug = index === 1 ? 'untitled-page' : `untitled-page-${index}`;
  const folderPath = folder ? `${folder}/` : '';
  const sourceFile = `src/workbench-pages/${folderPath}${toPascalCase(slug)}.tsx`;

  return {
    id: `page-${slug}`,
    name,
    route: `/${slug}`,
    sourceFile,
    rootNodeId: `source:${slug}:root`,
    status: sourcePage.status,
    extensions: {},
  };
}

function isWorkbenchSourceFileAlreadyExistsMessage(message: string): boolean {
  return message.toLowerCase().includes('already exists');
}

function createWorkbenchDesignPageSource(pageName: string): string {
  return [
    "import '../workbench-tokens.css';",
    '',
    'export default function WorkbenchDesignPage() {',
    '  return (',
    '    <main>',
    `      <section aria-label="${escapeJsxAttribute(pageName)}">`,
    '      </section>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
}

function renameWorkbenchDesignPageSource(contents: string, pageName: string): string {
  return contents.replace(/aria-label="[^"]*"/, `aria-label="${escapeJsxAttribute(pageName)}"`);
}

function getNextDesignPageIndex(
  pages: WorkbenchPageRegistry,
  reservedSourceFiles: Set<string> = new Set(),
  folder: string = '',
): number {
  const usedIds = new Set(pages.pages.map((page) => page.id));
  const usedSourceFiles = new Set([...pages.pages.map((page) => page.sourceFile), ...reservedSourceFiles]);
  const folderPath = folder ? `${folder}/` : '';

  for (let index = 1; index < 1000; index += 1) {
    const slug = index === 1 ? 'untitled-page' : `untitled-page-${index}`;
    const sourceFile = `src/workbench-pages/${folderPath}${toPascalCase(slug)}.tsx`;
    if (!usedIds.has(`page-${slug}`) && !usedSourceFiles.has(sourceFile)) return index;
  }

  return Date.now();
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('') || 'UntitledPage';
}

/**
 * Compute the next source file path for a renamed page.
 * Prefers a PascalCase Latin filename; for non-Latin names (e.g. Korean) it
 * falls back to a filesystem-safe version of the literal name so the real file
 * still tracks the page name. Returns `null` only when no usable filename can be
 * formed (pure punctuation), the derived path is unchanged, or it collides with
 * another existing page — in those cases the caller keeps the original file.
 */
function deriveDesignPageSourceFile(
  nextName: string,
  currentSourceFile: string,
  reservedSourceFiles: Set<string>,
): string | null {
  const trimmedName = nextName.trim();
  if (!trimmedName) return null;
  const pascal = toPascalCase(nextName);
  // toPascalCase falls back to "UntitledPage" when no Latin chars survived the
  // split. Use the PascalCase form when it captured real Latin characters;
  // otherwise keep a safe form of the literal (e.g. Korean) name.
  const usePascal = pascal !== 'UntitledPage'
    || trimmedName.toLowerCase() === 'untitledpage'
    || trimmedName === 'Untitled page';
  const baseName = usePascal ? pascal : sanitizeSourceFileBaseName(trimmedName);
  if (!baseName) return null;
  // Keep the renamed page inside whatever folder it currently lives in rather
  // than yanking it back to the flat workbench-pages root.
  const currentFolder = getPageFolderForSourceFile(currentSourceFile);
  const nextSourceFile = getPageSourceFileForFolder(currentFolder, `${baseName}.tsx`);
  if (nextSourceFile === currentSourceFile) return null;
  if (reservedSourceFiles.has(nextSourceFile)) return null;
  return nextSourceFile;
}

// Builds a filesystem-safe base filename from an arbitrary (possibly non-Latin)
// page name: drops path-illegal and control characters and whitespace, but
// keeps Unicode letters so a Korean page name maps to a Korean filename.
function sanitizeSourceFileBaseName(name: string): string {
  return name
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, '')
    .replace(/\s+/g, '')
    .replace(/^\.+/, '')
    .trim();
}

function escapeJsxAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function createDesignSourceTargets(
  pages: WorkbenchPageRegistry,
  components: WorkbenchComponentRegistry,
): DesignSourceTarget[] {
  return [
    ...pages.pages.map(createDesignSourceTargetFromPage),
    ...components.components.map((component): DesignSourceTarget => ({
      id: component.id,
      kind: 'component',
      label: component.name,
      meta: component.variants.length > 0 ? `${component.variants.length} variants` : 'Component',
      sourceFile: component.sourceFile,
      target: {
        kind: 'component',
        componentId: component.id,
        sourceFile: component.sourceFile,
      },
    })),
  ];
}

function getDesignProjectTreeSourceKey(
  projectTreeSource: ReturnType<typeof createEditableDocumentTreeFromProjectSource>,
): string {
  if (projectTreeSource.source.kind === 'none') return 'none';
  return [
    projectTreeSource.source.kind,
    projectTreeSource.source.id,
    projectTreeSource.source.sourceFile,
    projectTreeSource.tree?.id ?? 'source-file',
  ].join(':');
}

function createDesignSourceTargetFromPage(page: DesignLibraryPage): DesignSourceTarget {
  return {
    id: page.id,
    kind: 'page',
    label: page.name,
    meta: page.route,
    sourceFile: page.sourceFile,
    target: {
      kind: 'page',
      pageId: page.id,
      sourceFile: page.sourceFile,
    },
  };
}

function getOpenDesignTargets(
  targets: DesignSourceTarget[],
  openTargetKeys: string[],
  activeTarget: DesignSourceTarget | null,
): DesignSourceTarget[] {
  const targetsByKey = new Map(targets.map((target) => [getDesignTargetKey(target), target]));
  const openTargets = openTargetKeys.flatMap((key) => {
    const target = targetsByKey.get(key);
    return target ? [target] : [];
  });

  if (!activeTarget) return openTargets;
  const activeTargetKey = getDesignTargetKey(activeTarget);
  return openTargets.some((target) => getDesignTargetKey(target) === activeTargetKey)
    ? openTargets
    : [activeTarget, ...openTargets];
}

function getOpenDesignTargetKeysFromSelection(selection: WorkbenchSelectionState): string[] {
  const value = selection.extensions[OPEN_DESIGN_TARGET_KEYS_EXTENSION];
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0));
}

function getDesignSourceSectionCollapsedFromSelection(selection: WorkbenchSelectionState): boolean {
  return selection.extensions.collapsedDesignSourceSection ?? false;
}

function getDesignLayerSectionCollapsedFromSelection(selection: WorkbenchSelectionState): boolean {
  return selection.extensions.collapsedDesignLayerSection ?? false;
}

function getCollapsedDesignSourceGroupIdsFromSelection(selection: WorkbenchSelectionState): DesignSourceGroupId[] {
  return selection.extensions.collapsedDesignSourceGroups?.filter(isDesignSourceGroupId) ?? [];
}

function isDesignSourceGroupId(value: unknown): value is DesignSourceGroupId {
  return typeof value === 'string' && (DESIGN_SOURCE_GROUP_IDS as readonly string[]).includes(value);
}

function getCollapsedDesignPageFoldersFromSelection(selection: WorkbenchSelectionState): string[] {
  return selection.extensions.collapsedDesignPageFolders ?? [];
}

/**
 * When the previously-selected node disappears from the freshly-parsed tree
 * (e.g. after a source rewrite where a whitespace text node shifted sibling
 * indices), walk up the path encoded in the missing ID to find the closest
 * surviving ancestor. Falling back to the root or first visible layer is
 * jarring; the ancestor keeps the user's place in the tree.
 *
 * Node IDs are formatted as `source:<sanitizedSourceFile>:<path>` where path
 * is hyphen-separated child indices (e.g. `0-1-2-3`). We progressively trim
 * the trailing segment and check whether the ancestor still exists.
 */
function resolveClosestSurvivingAncestorLayerId(
  root: EditableTreeNode,
  missingLayerId: string,
  previewLayers: PreviewLayer[],
): string | null {
  const sourcePrefix = 'source:';
  if (!missingLayerId.startsWith(sourcePrefix)) return null;

  const colonIndex = missingLayerId.indexOf(':', sourcePrefix.length);
  if (colonIndex < 0) return null;
  const idPrefix = missingLayerId.slice(0, colonIndex + 1);
  const pathPart = missingLayerId.slice(colonIndex + 1);
  if (!pathPart || pathPart === 'root') return null;

  const segments = pathPart.split('-');
  // Walk up: drop one segment at a time and check the ancestor id.
  while (segments.length > 1) {
    segments.pop();
    const candidateId = `${idPrefix}${segments.join('-')}`;
    if (findEditableTreeNode(root, candidateId)) {
      // Only return the candidate if it is in the visible/preview layers.
      if (previewLayers.some((layer) => layer.id === candidateId)) return candidateId;
    }
  }
  // Try root form
  const rootCandidate = `${idPrefix}root`;
  if (findEditableTreeNode(root, rootCandidate)) return rootCandidate;
  return null;
}

function getDesignLayerIdFromSelection(selection: WorkbenchSelectionState): string | null {
  if (!Object.prototype.hasOwnProperty.call(selection.extensions, ACTIVE_DESIGN_LAYER_ID_EXTENSION)) {
    return 'preview-frame';
  }
  const value = selection.extensions[ACTIVE_DESIGN_LAYER_ID_EXTENSION];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function resolveDesignSelectableLayerId(root: EditableTreeNode | null, layerId: string): string {
  return resolveEditableTreeSelectionBoundary(root, layerId)?.selectableNode.id ?? layerId;
}

function getDesignLayerIdsFromSelection(selection: WorkbenchSelectionState, activeLayerId = getDesignLayerIdFromSelection(selection)): string[] {
  const value = selection.extensions[SELECTED_DESIGN_LAYER_IDS_EXTENSION];
  const selectedIds = Array.isArray(value)
    ? dedupeStrings(value.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0))
    : [];
  if (!activeLayerId) return selectedIds;
  return selectedIds.includes(activeLayerId) ? selectedIds : [...selectedIds, activeLayerId];
}

function getCollapsedDesignLayerIdsFromSelection(selection: WorkbenchSelectionState): string[] {
  const value = selection.extensions[COLLAPSED_DESIGN_LAYER_IDS_EXTENSION];
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0));
}

// Reveal `layerId` in the layer tree by dropping any collapsed ancestor from the
// persisted collapsed set. This writes the real `collapsedDesignLayerIds` state
// (rather than a transient/DOM-only expand), so the parent's collapse toggle
// stays in sync — it can be collapsed again, and selecting another layer no
// longer re-collapses it. Used by every flow that selects a node which may sit
// under a collapsed parent (preview click, move/drop, insert, paste, wrap).
function revealDesignLayerCollapsedAncestors(
  selection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  layerId: string | null,
): WorkbenchSelectionState {
  const ancestorIds = collectEditableTreeAncestorIds(root, layerId);
  if (ancestorIds.length === 0) return selection;
  const collapsedIds = getCollapsedDesignLayerIdsFromSelection(selection);
  const nextCollapsedIds = collapsedIds.filter((id) => !ancestorIds.includes(id));
  if (nextCollapsedIds.length === collapsedIds.length) return selection;
  return {
    ...selection,
    extensions: {
      ...selection.extensions,
      [COLLAPSED_DESIGN_LAYER_IDS_EXTENSION]: nextCollapsedIds,
    },
  };
}

function getDesignPreviewDrillPathFromSelection(selection: WorkbenchSelectionState): string[] {
  const value = selection.extensions[DESIGN_PREVIEW_DRILL_PATH_EXTENSION];
  if (!Array.isArray(value)) return [];
  return dedupeStrings(value.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0));
}

function getHydratedOpenDesignTargetKeys(
  targets: DesignSourceTarget[],
  persistedTargetKeys: string[],
  activeTarget: DesignSourceTarget | null,
): string[] {
  const availableTargetKeys = new Set(targets.map(getDesignTargetKey));
  const activeTargetKey = activeTarget ? getDesignTargetKey(activeTarget) : null;
  if (activeTarget?.kind === 'component' && activeTargetKey) return [activeTargetKey];

  const openTargetKeys = dedupeStrings(persistedTargetKeys)
    .filter((key) => availableTargetKeys.has(key) && !isComponentDesignTargetKey(key));
  if (!activeTarget) return openTargetKeys;
  if (!activeTargetKey) return openTargetKeys;

  return openTargetKeys.includes(activeTargetKey)
    ? openTargetKeys
    : [activeTargetKey, ...openTargetKeys];
}

function appendOpenDesignTargetKey(openTargetKeys: string[], targetKey: string): string[] {
  return openTargetKeys.includes(targetKey) ? openTargetKeys : [...openTargetKeys, targetKey];
}

function getDesignTargetsFromKeys(targets: DesignSourceTarget[], targetKeys: string[]): DesignSourceTarget[] {
  const targetsByKey = new Map(targets.map((target) => [getDesignTargetKey(target), target]));
  return targetKeys.flatMap((key) => {
    const target = targetsByKey.get(key);
    return target ? [target] : [];
  });
}

function isComponentDesignTargetKey(key: string): boolean {
  return key.startsWith('component:');
}

function createDesignTargetSelectionState(
  target: DesignSourceTarget,
  previousSelection: WorkbenchSelectionState,
  openTargetKeys: string[],
): WorkbenchSelectionState {
  const previousStoryComponentId = previousSelection.extensions.activeDesignStoryComponentId;
  const nextStoryComponentId = target.kind === 'component' ? target.id : null;
  const nextStoryArgs = nextStoryComponentId && previousStoryComponentId === nextStoryComponentId
    ? previousSelection.extensions.activeDesignStoryArgs ?? null
    : null;

  return {
    schemaVersion: '0.1',
    activeTarget: target.target,
    selectedTargets: [target.target],
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      activeDesignTargetKind: target.kind,
      activeDesignTargetId: target.id,
      activeDesignSourceFile: target.sourceFile,
      activeDesignStoryArgs: nextStoryArgs,
      activeDesignStoryComponentId: nextStoryComponentId,
      [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: 'preview-frame',
      [SELECTED_DESIGN_LAYER_IDS_EXTENSION]: [],
      [OPEN_DESIGN_TARGET_KEYS_EXTENSION]: dedupeStrings(openTargetKeys),
    },
  };
}

function createDesignEmptySelectionState(
  previousSelection: WorkbenchSelectionState,
  openTargetKeys: string[],
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    activeTarget: null,
    selectedTargets: [],
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      activeDesignTargetKind: null,
      activeDesignTargetId: null,
      activeDesignSourceFile: null,
      activeDesignStoryArgs: null,
      activeDesignStoryComponentId: null,
      [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: null,
      [SELECTED_DESIGN_LAYER_IDS_EXTENSION]: [],
      [OPEN_DESIGN_TARGET_KEYS_EXTENSION]: dedupeStrings(openTargetKeys),
    },
  };
}

function createDesignOpenTargetsSelectionState(
  previousSelection: WorkbenchSelectionState,
  openTargetKeys: string[],
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      [OPEN_DESIGN_TARGET_KEYS_EXTENSION]: dedupeStrings(openTargetKeys),
    },
  };
}

function createDesignSourceSectionCollapseSelectionState(
  previousSelection: WorkbenchSelectionState,
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      collapsedDesignSourceSection: !getDesignSourceSectionCollapsedFromSelection(previousSelection),
    },
  };
}

function createDesignLayerSectionCollapseSelectionState(
  previousSelection: WorkbenchSelectionState,
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      collapsedDesignLayerSection: !getDesignLayerSectionCollapsedFromSelection(previousSelection),
    },
  };
}

function createDesignSourceGroupCollapseSelectionState(
  previousSelection: WorkbenchSelectionState,
  groupId: DesignSourceGroupId,
): WorkbenchSelectionState {
  const collapsedGroupIds = new Set(getCollapsedDesignSourceGroupIdsFromSelection(previousSelection));
  if (collapsedGroupIds.has(groupId)) {
    collapsedGroupIds.delete(groupId);
  } else {
    collapsedGroupIds.add(groupId);
  }

  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      collapsedDesignSourceGroups: [...collapsedGroupIds],
    },
  };
}

function createDesignPageFolderCollapseSelectionState(
  previousSelection: WorkbenchSelectionState,
  folderPath: string,
): WorkbenchSelectionState {
  const collapsedFolders = new Set(getCollapsedDesignPageFoldersFromSelection(previousSelection));
  if (collapsedFolders.has(folderPath)) {
    collapsedFolders.delete(folderPath);
  } else {
    collapsedFolders.add(folderPath);
  }

  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      collapsedDesignPageFolders: [...collapsedFolders],
    },
  };
}

function createDesignPageFolderRevealSelectionState(
  previousSelection: WorkbenchSelectionState,
  folderPaths: string[],
): WorkbenchSelectionState {
  const collapsedFolders = new Set(getCollapsedDesignPageFoldersFromSelection(previousSelection));
  let changed = false;
  for (const folderPath of folderPaths) {
    if (collapsedFolders.delete(folderPath)) changed = true;
  }
  if (!changed) return previousSelection;
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      collapsedDesignPageFolders: [...collapsedFolders],
    },
  };
}

function createDesignLayerSelectionState(
  previousSelection: WorkbenchSelectionState,
  layerId: string | null,
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: layerId,
      [SELECTED_DESIGN_LAYER_IDS_EXTENSION]: [],
    },
  };
}

function createDesignWrappedLayerSelectionState(
  previousSelection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  wrapperLayerId: string,
  wrappedChildLayerIds: string[],
): WorkbenchSelectionState {
  const collapsedLayerIds = getCollapsedDesignLayerIdsFromSelection(previousSelection)
    .filter((layerId) => layerId !== wrapperLayerId);
  return createDesignPreviewDrillPathSelectionState(
    {
      ...previousSelection,
      extensions: {
        ...previousSelection.extensions,
        [COLLAPSED_DESIGN_LAYER_IDS_EXTENSION]: collapsedLayerIds,
      },
    },
    root,
    getDesignPreviewDrillPathFromSelection(previousSelection),
    wrapperLayerId,
    dedupeStrings([wrapperLayerId, ...wrappedChildLayerIds]),
  );
}

function createDesignLayerRowSelectionState(
  previousSelection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  layerId: string,
  additive: boolean,
): WorkbenchSelectionState {
  const nextSelection = resolveDesignLayerAdditiveSelection(previousSelection, root, layerId, additive);
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: nextSelection.activeLayerId,
      [SELECTED_DESIGN_LAYER_IDS_EXTENSION]: nextSelection.selectedLayerIds,
    },
  };
}

function createDesignPreviewNodeSelectionState(
  previousSelection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  drillPath: string[],
  clickedNodeId: string,
  mode: DesignPreviewSelectionMode,
  additive: boolean,
): WorkbenchSelectionState {
  const currentSelectedNodeId = getDesignLayerIdFromSelection(previousSelection);
  const additiveTarget = additive
    ? resolveDesignPreviewAdditiveSelectionTarget(
      root,
      getDesignLayerIdsFromSelection(previousSelection),
      clickedNodeId,
    )
    : null;
  if (additive && !additiveTarget) return previousSelection;
  const resolution = resolvePreviewNodeSelection({
    clickedNodeId: additiveTarget?.selectedNodeId ?? clickedNodeId,
    drillPath,
    mode,
    root,
    selectedNodeId: currentSelectedNodeId,
  });
  const selectedNodeId = additiveTarget?.selectedNodeId ?? resolution.selectedNodeId;
  const nextSelection = resolveDesignLayerAdditiveSelection(
    previousSelection,
    root,
    selectedNodeId,
    additive,
    additiveTarget?.previousSelectedIds,
  );

  return createDesignPreviewDrillPathSelectionState(
    previousSelection,
    root,
    additive ? drillPath : resolution.drillPath,
    nextSelection.activeLayerId,
    nextSelection.selectedLayerIds,
  );
}

type DesignPreviewAdditiveSelectionTarget = {
  previousSelectedIds: string[];
  selectedNodeId: string;
};

function resolveDesignPreviewAdditiveSelectionTarget(
  root: EditableTreeNode | null,
  previousSelectedIds: string[],
  clickedNodeId: string,
): DesignPreviewAdditiveSelectionTarget | null {
  const clickedBoundary = resolveEditableTreeSelectionBoundary(root, clickedNodeId);
  const clickedNode = clickedBoundary?.selectedNode ??
    findEditableTreeNodeInPreviewTree(root, clickedNodeId)?.node ??
    null;
  if (!root || !clickedNode) return null;

  const currentSelectedIds = previousSelectedIds.filter((layerId) => layerId !== 'preview-frame');
  return {
    previousSelectedIds: currentSelectedIds,
    selectedNodeId: clickedNode.id,
  };
}

function createDesignPreviewDrillPathSelectionState(
  previousSelection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  drillPath: string[],
  selectedNodeId: string | null,
  selectedLayerIds: string[] = [],
): WorkbenchSelectionState {
  const nextDrillPath = reconcilePreviewDrillPath(root, drillPath);
  // Reveal the selected node in the layer tree: drop any collapsed ancestor so
  // its row renders (and the selection scroll effect can bring it into view).
  // Without this, selecting a child from the preview leaves it hidden under a
  // collapsed parent and the auto-focus silently no-ops.
  return revealDesignLayerCollapsedAncestors(
    {
      ...previousSelection,
      updatedAt: new Date().toISOString(),
      extensions: {
        ...previousSelection.extensions,
        [ACTIVE_DESIGN_LAYER_ID_EXTENSION]: selectedNodeId,
        [SELECTED_DESIGN_LAYER_IDS_EXTENSION]: selectedLayerIds,
        [DESIGN_PREVIEW_DRILL_PATH_EXTENSION]: nextDrillPath,
      },
    },
    root,
    selectedNodeId,
  );
}

function resolveDesignLayerAdditiveSelection(
  previousSelection: WorkbenchSelectionState,
  root: EditableTreeNode | null,
  selectedNodeId: string,
  additive: boolean,
  selectionBaseIds?: string[],
): { activeLayerId: string | null; selectedLayerIds: string[] } {
  if (!additive) {
    return { activeLayerId: selectedNodeId, selectedLayerIds: [] };
  }

  const previousSelectedIds = (selectionBaseIds ?? getDesignLayerIdsFromSelection(previousSelection))
    .filter((layerId) => layerId !== 'preview-frame');
  const nextSelectedIds = new Set(previousSelectedIds);
  if (nextSelectedIds.has(selectedNodeId)) {
    nextSelectedIds.delete(selectedNodeId);
  } else {
    const selectedNode = root
      ? findEditableTreeNodeInPreviewTree(root, selectedNodeId)?.node ?? null
      : null;
    if (selectedNode) {
      for (const previousSelectedId of nextSelectedIds) {
        const previousNode = findEditableTreeNodeInPreviewTree(root, previousSelectedId)?.node ?? null;
        if (
          previousNode &&
          (
            containsEditableTreeNode(previousNode, selectedNode.id) ||
            containsEditableTreeNode(selectedNode, previousNode.id)
          )
        ) {
          nextSelectedIds.delete(previousSelectedId);
        }
      }
    }
    nextSelectedIds.add(selectedNodeId);
  }

  const selectedLayerIds = Array.from(nextSelectedIds);
  return {
    activeLayerId: nextSelectedIds.has(selectedNodeId)
      ? selectedNodeId
      : selectedLayerIds[selectedLayerIds.length - 1] ?? null,
    selectedLayerIds: selectedLayerIds.length > 1 ? selectedLayerIds : [],
  };
}

function createDesignLayerCollapseSelectionState(
  previousSelection: WorkbenchSelectionState,
  layerId: string,
): WorkbenchSelectionState {
  const collapsedIds = getCollapsedDesignLayerIdsFromSelection(previousSelection);
  const nextCollapsedIds = collapsedIds.includes(layerId)
    ? collapsedIds.filter((candidate) => candidate !== layerId)
    : [...collapsedIds, layerId];

  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      [COLLAPSED_DESIGN_LAYER_IDS_EXTENSION]: nextCollapsedIds,
    },
  };
}

function resolveI18nTokenValue(
  registry: TokenRegistry,
  tokenKey: string | undefined,
  previewTokenModes: PreviewTokenModeSelection,
): string | null {
  if (!tokenKey) return null;
  for (const collection of registry.collections) {
    if (!isCollectionI18n(collection)) continue;
    const collectionName = collection.name?.trim() || collection.id;
    const modeId = previewTokenModes[collection.id] ?? collection.activeMode ?? collection.modes?.[0]?.id ?? 'default';
    for (const token of collection.tokens) {
      if (token.type !== 'string') continue;
      const tokenName = token.name?.trim() || token.id;
      if (tokenKey !== tokenName && tokenKey !== `${collectionName}.${tokenName}`) continue;
      const resolved = resolveTokenValue(token, collection, registry, modeId);
      if (typeof resolved === 'string') return resolved;
    }
  }
  return null;
}

function collectI18nDictionaryFromRegistry(registry: TokenRegistry): Record<string, Record<string, string>> {
  const dictionary: Record<string, Record<string, string>> = {};
  for (const collection of registry.collections) {
    if (!isCollectionI18n(collection)) continue;
    const collectionModes = collection.modes?.length ? collection.modes : [{ id: 'default', name: 'default' }];
    for (const mode of collectionModes) {
      const langKey = mode.name?.trim() || mode.id;
      for (const token of collection.tokens) {
        if (token.type !== 'string') continue;
        const resolved = resolveTokenValue(token, collection, registry, mode.id);
        if (typeof resolved !== 'string') continue;
        const langBucket = dictionary[langKey] ?? (dictionary[langKey] = {});
        const collectionName = collection.name?.trim() || collection.id;
        const tokenName = token.name?.trim() || token.id;
        langBucket[`${collectionName}.${tokenName}`] = resolved;
      }
    }
  }
  return dictionary;
}

function getInspectorTokenPickerFiltersFromSelection(selection: WorkbenchSelectionState): InspectorTokenPickerFilters {
  return selection.extensions.inspectorTokenPickerFilters ?? {};
}

function createDesignInspectorTokenPickerFilterSelectionState(
  previousSelection: WorkbenchSelectionState,
  field: InspectorTokenBindingField,
  filter: TokenPickerScopeFilter,
): WorkbenchSelectionState {
  const nextFilters: InspectorTokenPickerFilters = {
    ...getInspectorTokenPickerFiltersFromSelection(previousSelection),
  };
  const normalized = normalizeWorkbenchInspectorTokenPickerScopeFilter(filter);
  if (!normalized || (normalized.collectionId === 'all' && normalized.groupId === 'all')) {
    delete nextFilters[field];
  } else {
    nextFilters[field] = normalized;
  }

  const extensions = { ...previousSelection.extensions };
  if (Object.keys(nextFilters).length > 0) {
    extensions.inspectorTokenPickerFilters = nextFilters;
  } else {
    delete extensions.inspectorTokenPickerFilters;
  }

  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions,
  };
}

function getDesignStoryArgsFromSelection(
  selection: WorkbenchSelectionState,
  componentId: string,
): WorkbenchStoryArgs {
  if (selection.extensions.activeDesignStoryComponentId !== componentId) return {};
  return selection.extensions.activeDesignStoryArgs ?? {};
}

function createCodexHandoffPrompt(handoff: CodexDesignHandoff): string {
  const storyArgs = handoff.story ? JSON.stringify(handoff.story.args, null, 2) : 'none';
  return [
    '방금 Workbench에서 컴파일한 디자인 handoff를 실제 컴포넌트 코드에 반영해주세요.',
    '',
    `Handoff file: ${CODEX_DESIGN_HANDOFF_PATH}`,
    `Component: ${handoff.componentName} (${handoff.componentId})`,
    `Source file: ${handoff.sourceFile}`,
    `Story: ${handoff.story?.name ?? 'none'}`,
    `Selected node: ${handoff.selectedNodeId ?? 'none'}`,
    `Projected nodes: ${countCodexHandoffNodes(handoff.tree.root)}`,
    '',
    'Story args:',
    storyArgs,
    '',
    '요청:',
    '1. Handoff JSON을 읽고 tree/sourceStyleDeclarations/tokenBindings/tokenBindingReferences를 확인해주세요.',
    '2. 컴포넌트의 기존 props, variants, states, accessibility contract가 계속 동작하는지 먼저 확인해주세요.',
    '3. 변경 의도를 실제 TSX/CSS 구현에 반영하되, 디자인 snapshot보다 컴포넌트 본연의 기능과 prop contract를 우선해주세요.',
    '4. Computed px/rgb 값을 컴포넌트 inline style로 복사하지 말고, Workbench token CSS variables, class variants, data-wb-* token bindings를 우선 사용해주세요.',
    '5. JSON 자체를 런타임 소스로 쓰지 말고, 컴포넌트 구현을 자연스럽게 개선해주세요.',
    '6. 완료 전 Story controls/props가 여전히 동작하는지 검토하고, 깨지는 prop이 있으면 구현 방식을 조정해주세요.',
  ].join('\n');
}

function countCodexHandoffNodes(node: CodexDesignHandoff['tree']['root']): number {
  return 1 + (node.children ?? []).reduce((count, child) => count + countCodexHandoffNodes(child), 0);
}

function updateEditableTreeNode(
  node: EditableTreeNode,
  nodeId: string,
  updateNode: (node: EditableTreeNode) => EditableTreeNode,
): EditableTreeNode {
  if (node.id === nodeId) return updateNode(node);
  if (!node.children || node.children.length === 0) return node;
  return {
    ...node,
    children: node.children.map((child) => updateEditableTreeNode(child, nodeId, updateNode)),
  };
}

function removeEditableTreeNodes(
  node: EditableTreeNode,
  nodeIds: Set<string>,
): EditableTreeNode | null {
  if (nodeIds.has(node.id)) return null;

  let changed = false;
  const children = node.children
    ?.map((child) => removeEditableTreeNodes(child, nodeIds))
    .filter((child): child is EditableTreeNode => child !== null);
  if (children && children.length !== (node.children?.length ?? 0)) changed = true;
  if (children?.some((child, index) => child !== node.children?.[index])) changed = true;

  const sourcePreviewChildren = node.sourcePreviewChildren
    ?.map((child) => removeEditableTreeNodes(child, nodeIds))
    .filter((child): child is EditableTreeNode => child !== null);
  if (sourcePreviewChildren && sourcePreviewChildren.length !== (node.sourcePreviewChildren?.length ?? 0)) changed = true;
  if (sourcePreviewChildren?.some((child, index) => child !== node.sourcePreviewChildren?.[index])) changed = true;

  if (!changed) return node;
  return {
    ...node,
    ...(children ? { children } : {}),
    ...(sourcePreviewChildren ? { sourcePreviewChildren } : {}),
  };
}

function cloneEditableDocumentTree(tree: EditableDocumentTree): EditableDocumentTree {
  return JSON.parse(JSON.stringify(tree)) as EditableDocumentTree;
}

function areEditableDocumentTreesEqual(left: EditableDocumentTree, right: EditableDocumentTree): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getRuntimeTokenBindingStyleProperty(field: InspectorTokenBindingField): SourceStyleProperty {
  if (field === 'background') return 'background';
  if (field === 'radius') return 'border-radius';
  if (field === 'fontSize') return 'font-size';
  return 'padding';
}

function normalizeStoryArgsForHandoff(args: WorkbenchStoryArgs): Record<string, boolean | number | string> {
  return Object.fromEntries(
    Object.entries(args).filter((entry): entry is [string, boolean | number | string] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      (typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean')
    )),
  );
}

function normalizeStoryArgsForSourceProps(args: WorkbenchStoryArgs): Record<string, boolean | number | string> {
  return normalizeStoryArgsForHandoff(args);
}

async function getProjectDefaultSourceInsertIcon(assets: WorkbenchAssetRegistry): Promise<SourceInsertChildIconDefault | undefined> {
  const icon = getWorkbenchDefaultIconPreviewOptions(assets)[0] ?? null;
  if (!icon) return undefined;
  return {
    name: icon.key,
    src: icon.value,
    svg: await readSourceInsertIconSvg(icon.value, icon.key),
  };
}

async function readSourceInsertIconSvg(source: string, iconName?: string | null): Promise<string | undefined> {
  const normalizedSource = source.trim();
  if (!normalizedSource.toLowerCase().endsWith('.svg')) return undefined;
  try {
    const response = await workbenchFetch(normalizedSource);
    if (!response.ok) return undefined;
    return formatSourceInsertIconSvg(await response.text(), {
      iconName,
      source: normalizedSource,
    });
  } catch {
    return undefined;
  }
}

function formatSourceInsertIconSvg(contents: string, metadata: { iconName?: string | null; source?: string | null } = {}): string | undefined {
  if (contents.length > 50000 || /<script\b/i.test(contents)) return undefined;
  const document = new DOMParser().parseFromString(contents, 'image/svg+xml');
  if (document.querySelector('parsererror')) return undefined;
  const svg = document.querySelector('svg');
  if (!svg) return undefined;
  const children = Array.from(svg.childNodes).map(formatSourceInsertSvgChild).filter(Boolean).join('');
  if (!children) return undefined;
  const rootFill = svg.getAttribute('fill');
  const rootStroke = svg.getAttribute('stroke');
  const rootStrokeWidth = svg.getAttribute('stroke-width') || svg.getAttribute('strokeWidth');
  const rootStrokeLinecap = svg.getAttribute('stroke-linecap') || svg.getAttribute('strokeLinecap');
  const rootStrokeLinejoin = svg.getAttribute('stroke-linejoin') || svg.getAttribute('strokeLinejoin');
  const attributes = [
    formatSourceInsertSvgAttribute('data-icon', 'inline-start'),
    formatSourceInsertSvgAttribute(SOURCE_ASSET_KIND_ATTRIBUTE, 'icon'),
    metadata.source ? formatSourceInsertSvgAttribute(SOURCE_ASSET_SOURCE_ATTRIBUTE, metadata.source) : '',
    metadata.iconName ? formatSourceInsertSvgAttribute(SOURCE_ICON_SET_ATTRIBUTE, 'default') : '',
    metadata.iconName ? formatSourceInsertSvgAttribute(SOURCE_ICON_NAME_ATTRIBUTE, metadata.iconName) : '',
    formatSourceInsertSvgAttribute('aria-hidden', 'true'),
    formatSourceInsertSvgAttribute('focusable', 'false'),
    formatSourceInsertSvgAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 24 24'),
    formatSourceInsertSvgAttribute('width', '0.875em'),
    formatSourceInsertSvgAttribute('height', '0.875em'),
    rootFill ? formatSourceInsertSvgAttribute('fill', rootFill) : '',
    rootStroke ? formatSourceInsertSvgAttribute('stroke', rootStroke) : '',
    rootStrokeWidth ? formatSourceInsertSvgAttribute('strokeWidth', rootStrokeWidth) : '',
    rootStrokeLinecap ? formatSourceInsertSvgAttribute('strokeLinecap', rootStrokeLinecap) : '',
    rootStrokeLinejoin ? formatSourceInsertSvgAttribute('strokeLinejoin', rootStrokeLinejoin) : '',
  ].filter(Boolean);
  return `<svg ${attributes.join(' ')}>${children}</svg>`;
}

const SOURCE_INSERT_SVG_CHILD_TAGS = new Set(['circle', 'ellipse', 'g', 'line', 'path', 'polygon', 'polyline', 'rect']);
const SOURCE_INSERT_SVG_ATTRIBUTE_NAMES = new Map([
  ['clip-rule', 'clipRule'],
  ['cx', 'cx'],
  ['cy', 'cy'],
  ['d', 'd'],
  ['fill', 'fill'],
  ['fill-rule', 'fillRule'],
  ['height', 'height'],
  ['points', 'points'],
  ['r', 'r'],
  ['rx', 'rx'],
  ['ry', 'ry'],
  ['stroke', 'stroke'],
  ['stroke-linecap', 'strokeLinecap'],
  ['stroke-linejoin', 'strokeLinejoin'],
  ['stroke-width', 'strokeWidth'],
  ['transform', 'transform'],
  ['width', 'width'],
  ['x', 'x'],
  ['x1', 'x1'],
  ['x2', 'x2'],
  ['y', 'y'],
  ['y1', 'y1'],
  ['y2', 'y2'],
]);

function formatSourceInsertSvgChild(node: ChildNode): string {
  if (!(node instanceof Element)) return '';
  const tagName = node.tagName.toLowerCase();
  if (!SOURCE_INSERT_SVG_CHILD_TAGS.has(tagName)) return '';
  const attributes = Array.from(node.attributes)
    .map((attribute) => {
      const attributeName = SOURCE_INSERT_SVG_ATTRIBUTE_NAMES.get(attribute.name);
      return attributeName ? formatSourceInsertSvgAttribute(attributeName, attribute.value) : '';
    })
    .filter(Boolean);
  const children = tagName === 'g'
    ? Array.from(node.childNodes).map(formatSourceInsertSvgChild).filter(Boolean).join('')
    : '';
  return children
    ? `<${tagName}${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''}>${children}</${tagName}>`
    : `<${tagName}${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''} />`;
}

function formatSourceInsertSvgAttribute(name: string, value: string): string {
  const safeValue = value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `${name}="${safeValue}"`;
}

function getProjectDefaultIconStoryArgs(
  args: WorkbenchStoryArgs,
  controls: WorkbenchStoryControl[],
  assets: WorkbenchAssetRegistry,
): WorkbenchStoryArgs {
  const iconOptions = getWorkbenchDefaultIconPreviewOptions(assets);
  const defaultIconKey = iconOptions[0]?.key ?? '';
  if (!defaultIconKey) return args;
  const availableIconKeys = new Set(iconOptions.flatMap((option) => [
    option.key,
    normalizeWorkbenchIconKey(option.name),
  ]).filter(Boolean));

  let changed = false;
  const nextArgs: WorkbenchStoryArgs = { ...args };
  for (const control of controls) {
    if (control.type !== 'icon') continue;
    const currentValue = args[control.key];
    if (typeof currentValue !== 'string' || currentValue.trim().length === 0) continue;
    if (availableIconKeys.has(normalizeWorkbenchIconKey(currentValue))) continue;
    nextArgs[control.key] = defaultIconKey;
    changed = true;
  }
  return changed ? nextArgs : args;
}

function filterDesignPickerComponents(
  components: DesignLibraryComponent[],
  search: string,
): DesignLibraryComponent[] {
  const query = search.trim().toLowerCase();
  if (!query) return components;
  return components.filter((component) => [
    component.name,
    component.id,
    component.sourceFile,
    component.componentSetId ?? '',
    formatWorkbenchComponentGroupLabel(getWorkbenchComponentGroupId(component)),
    ...component.variants.flatMap((variant) => [
      variant.id,
      variant.state,
      ...Object.entries(variant.axes).flatMap(([axis, value]) => [axis, value]),
    ]),
  ].join(' ').toLowerCase().includes(query));
}

function filterDesignPickerHtmlTemplates(
  templates: readonly SourceInsertChildTemplate[],
  search: string,
): SourceInsertChildTemplate[] {
  const query = search.trim().toLowerCase();
  if (!query) return [...templates];
  return templates.filter((template) => [
    template.id,
    template.label,
    template.jsxName,
    `<${template.jsxName}>`,
  ].join(' ').toLowerCase().includes(query));
}

function groupDesignPickerComponents(
  components: DesignLibraryComponent[],
): Array<{ components: DesignLibraryComponent[]; id: string; label: string }> {
  const groups = new Map<string, DesignLibraryComponent[]>();
  for (const component of components) {
    const groupId = getWorkbenchComponentGroupId(component);
    groups.set(groupId, [...(groups.get(groupId) ?? []), component]);
  }

  return [...groups.entries()]
    .map(([id, groupComponents]) => ({
      id,
      label: formatWorkbenchComponentGroupLabel(id),
      components: [...groupComponents].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => compareWorkbenchComponentGroupIds(left.id, right.id));
}

function resolveComponentInsertImportSpecs(
  component: DesignLibraryComponent,
  importSpec: { importSource?: string; names: string[]; sourceFile?: string },
  components: DesignLibraryComponent[],
  ownerSourceFile: string,
): Array<{ importSource: string; names: string[] }> {
  if (importSpec.importSource) {
    return [{ importSource: importSpec.importSource, names: importSpec.names }];
  }

  const groupedNames = new Map<string, string[]>();
  for (const name of importSpec.names) {
    const sourceFile = resolveComponentInsertSourceFile(component, importSpec.sourceFile, name, components);
    groupedNames.set(sourceFile, [...(groupedNames.get(sourceFile) ?? []), name]);
  }

  return [...groupedNames.entries()].map(([sourceFile, names]) => ({
    importSource: getComponentImportSource(ownerSourceFile, sourceFile),
    names,
  }));
}

function resolveComponentInsertSourceFile(
  component: DesignLibraryComponent,
  sourceFile: string | undefined,
  importName: string,
  components: DesignLibraryComponent[],
): string {
  if (isImportedComponent(component) && isPresetComponentSourceFile(sourceFile)) {
    const importedComponent = components.find((candidate) =>
      isImportedComponent(candidate) && getComponentSourceNames(candidate).includes(importName),
    );
    return importedComponent?.sourceFile ?? component.sourceFile;
  }

  return sourceFile ?? component.sourceFile;
}

function isImportedComponent(component: DesignLibraryComponent): boolean {
  return getStringExtension(component.extensions, 'source') === 'imported';
}

function getComponentImportSource(ownerSourceFile: string, componentSourceFile: string): string {
  const importTarget = componentSourceFile.startsWith('src/workbench-design-system/components/')
    ? 'src/workbench-design-system/components/index.ts'
    : getLibraryBarrelSourceFile(componentSourceFile) ?? componentSourceFile;
  return getRelativeImportSource(ownerSourceFile, importTarget).replace(/\/index$/, '');
}

function getLibraryBarrelSourceFile(componentSourceFile: string): string | null {
  const parts = componentSourceFile.split('/').filter(Boolean);
  if (parts[0] !== 'src' || parts[1] !== 'libraries' || parts.length < 5) return null;
  if (parts[3] !== 'components') return null;
  if (/^index\.(tsx?|jsx?)$/i.test(parts[parts.length - 1] ?? '')) return null;
  return `${parts.slice(0, 4).join('/')}/index.ts`;
}

function useStableStyleScopeId(prefix: string): string {
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    designScopedStyleCounter += 1;
    idRef.current = `${prefix}-${designScopedStyleCounter}`;
  }
  return idRef.current;
}

function useDocumentStyleText(
  cssText: string,
  ownerDocument: Document | null = null,
  enabled = true,
) {
  useLayoutEffect(() => {
    const normalizedCssText = cssText.trim();
    const targetDocument = ownerDocument ?? document;
    if (!enabled || normalizedCssText.length === 0 || !targetDocument.head) return undefined;
    const styleElement = targetDocument.createElement('style');
    styleElement.setAttribute('data-wb-scoped-style', 'true');
    styleElement.textContent = normalizedCssText;
    targetDocument.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, [cssText, enabled, ownerDocument]);
}

function createScopedCssRule(selector: string, declarations: string): string {
  const normalizedDeclarations = declarations.trim().replace(/;?$/, ';');
  return normalizedDeclarations.length > 1 ? `${selector}{${normalizedDeclarations}}` : '';
}

function createCssDeclarationBlockFromStyleVariables(values: CSSProperties | null | undefined): string {
  return Object.entries(values ?? {}).flatMap(([property, value]) => {
    if (!property.startsWith('--') || value === null || value === undefined) return [];
    return `${property}: ${sanitizeCssValue(value)}`;
  }).join(';');
}

function sanitizeCssValue(value: unknown): string {
  return String(value).replace(/[;{}\r\n]/g, ' ').trim();
}

function formatCssPx(value: number): string {
  return `${Math.round(value)}px`;
}

function getRelativeImportSource(fromFile: string, toFile: string): string {
  const fromParts = fromFile.split('/').slice(0, -1);
  const toParts = toFile.replace(/\.(tsx|ts|jsx|js)$/, '').split('/');
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength += 1;
  }
  const upParts = fromParts.slice(commonLength).map(() => '..');
  const downParts = toParts.slice(commonLength);
  const relative = [...upParts, ...downParts].join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function formatVariantCount(component: DesignLibraryComponent): string {
  const count = component.variants.length;
  if (count > 0) return count === 1 ? '1 variant' : `${count} variants`;
  if (getComponentCsfStorySourceFile(component)) return 'CSF story';
  return '0 variants';
}

function getDesignPreviewViewportFromSelection(selection: WorkbenchSelectionState): DesignPreviewViewport | null {
  return selection.extensions.designPreviewViewport ?? null;
}

function createDesignPreviewViewportSelectionState(
  previousSelection: WorkbenchSelectionState,
  viewport: DesignPreviewViewport,
): WorkbenchSelectionState {
  const nextViewport = reconcileDesignPreviewViewport(viewport);
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      designPreviewViewport: {
        height: nextViewport.height,
        presetId: nextViewport.presetId,
        width: nextViewport.width,
      },
    },
  };
}

const TAILWIND_INLINE_SIZE_SOURCE_PROPERTIES = new Set<SourceStyleProperty>([
  'height',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'width',
]);

function shouldBlockTailwindInlineSizeSourceStyleWriteback(
  node: EditableTreeNode,
  property: SourceStyleProperty,
): boolean {
  return (
    TAILWIND_INLINE_SIZE_SOURCE_PROPERTIES.has(property) &&
    hasLikelyTailwindClassName(node.sourceAttributes?.className)
  );
}

function hasLikelyTailwindClassName(className: string | undefined): boolean {
  if (!className) return false;
  return className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .some(isLikelyTailwindClassToken);
}

function isLikelyTailwindClassToken(classToken: string): boolean {
  const normalized = classToken.replace(/^!/, '');
  const separatorIndex = findTailwindVariantSeparatorIndex(normalized);
  const baseClass = separatorIndex >= 0 ? normalized.slice(separatorIndex + 1) : normalized;
  return (
    baseClass.startsWith('@') ||
    baseClass.includes('[') ||
    /^(?:block|flex|grid|hidden|inline-flex|relative|absolute|fixed|sticky|static)$/.test(baseClass) ||
    /^(?:bg|border|col|container|dark|data|flex|font|gap|grid|group|h|hover|items|justify|leading|m|mb|me|ml|mr|ms|mt|mx|my|max-h|max-w|min-h|min-w|p|pb|pe|pl|pr|ps|pt|px|py|rounded|shadow|size|sm|md|lg|xl|2xl|text|w)-/.test(baseClass)
  );
}

function findTailwindVariantSeparatorIndex(classToken: string): number {
  let bracketDepth = 0;
  let separatorIndex = -1;
  for (let index = 0; index < classToken.length; index += 1) {
    const character = classToken[index];
    if (character === '[') bracketDepth += 1;
    if (character === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (character === ':' && bracketDepth === 0) separatorIndex = index;
  }
  return separatorIndex;
}

function formatTailwindInlineSizeWritebackNotice(property: SourceStyleProperty): string {
  return `${property} is controlled by Tailwind classes on this source node. Edit the Tailwind className instead of writing inline style.`;
}

function getPreviewTokenModesForAppearance(
  registry: TokenRegistry,
  current: PreviewTokenModeSelection,
  appearance: Exclude<DesignPreviewAppearance, 'system'>,
): PreviewTokenModeSelection {
  const next = { ...current };
  registry.collections.forEach((collection) => {
    const matchingMode = collection.modes.find((mode) => (
      normalizeDesignPreviewAppearanceModeLabel(mode.id) === appearance ||
      normalizeDesignPreviewAppearanceModeLabel(mode.name) === appearance
    ));
    if (matchingMode) next[collection.id] = matchingMode.id;
  });
  return next;
}

function useSystemDesignPreviewAppearance(): Exclude<DesignPreviewAppearance, 'system'> {
  const [value, setValue] = useState<Exclude<DesignPreviewAppearance, 'system'>>(getSystemDesignPreviewAppearance);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const sync = () => setValue(query.matches ? 'dark' : 'light');
    sync();
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener?.(sync);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', sync);
      else query.removeListener?.(sync);
    };
  }, []);
  return value;
}

function getSystemDesignPreviewAppearance(): Exclude<DesignPreviewAppearance, 'system'> {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function normalizeDesignPreviewAppearanceModeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function getDesignPreviewAppearanceFromSelection(
  selection: WorkbenchSelectionState,
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): DesignPreviewAppearance {
  return selection.extensions.designPreviewAppearance
    ?? getPreviewAppearanceFromTokenModes(registry, previewTokenModes)
    ?? 'system';
}

function getPreviewAppearanceFromTokenModes(
  registry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): DesignPreviewAppearance | null {
  let hasLight = false;
  let hasDark = false;
  registry.collections.forEach((collection) => {
    const selectedModeId = previewTokenModes[collection.id];
    const selectedMode = collection.modes.find((mode) => mode.id === selectedModeId);
    if (!selectedMode) return;
    const labels = [
      normalizeDesignPreviewAppearanceModeLabel(selectedMode.id),
      normalizeDesignPreviewAppearanceModeLabel(selectedMode.name),
    ];
    hasDark = hasDark || labels.includes('dark');
    hasLight = hasLight || labels.includes('light');
  });
  if (hasDark) return 'dark';
  if (hasLight) return 'light';
  return null;
}

function createDesignPreviewAppearanceSelectionState(
  previousSelection: WorkbenchSelectionState,
  previewAppearance: DesignPreviewAppearance,
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      designPreviewAppearance: previewAppearance,
    },
  };
}

function createDesignPreviewTokenModesSelectionState(
  previousSelection: WorkbenchSelectionState,
  previewTokenModes: PreviewTokenModeSelection,
): WorkbenchSelectionState {
  return {
    ...previousSelection,
    updatedAt: new Date().toISOString(),
    extensions: {
      ...previousSelection.extensions,
      previewTokenModes: { ...previewTokenModes },
    },
  };
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

// True when both selections sit on the same page/component, so restoring either
// one cannot move the user to a different file. Undo records a selection step
// only in that case.
function areWorkbenchSelectionTargetsOnSameDesignTarget(
  left: WorkbenchSelectionState,
  right: WorkbenchSelectionState,
): boolean {
  const leftTarget = left.activeTarget;
  const rightTarget = right.activeTarget;
  if (!leftTarget || !rightTarget) return false;
  if (leftTarget.kind !== rightTarget.kind) return false;
  if (leftTarget.kind === 'page' && rightTarget.kind === 'page') {
    if (leftTarget.pageId && rightTarget.pageId) return leftTarget.pageId === rightTarget.pageId;
    return Boolean(leftTarget.sourceFile && leftTarget.sourceFile === rightTarget.sourceFile);
  }
  if (leftTarget.kind === 'component' && rightTarget.kind === 'component') {
    if (leftTarget.componentId && rightTarget.componentId) return leftTarget.componentId === rightTarget.componentId;
    return Boolean(leftTarget.sourceFile && leftTarget.sourceFile === rightTarget.sourceFile);
  }
  return false;
}

function areWorkbenchSelectionStatesEqual(left: WorkbenchSelectionState, right: WorkbenchSelectionState): boolean {
  return JSON.stringify(left.activeTarget) === JSON.stringify(right.activeTarget) &&
    JSON.stringify(left.selectedTargets) === JSON.stringify(right.selectedTargets) &&
    JSON.stringify(left.extensions) === JSON.stringify(right.extensions);
}

function isWorkbenchSelectionStale(
  incomingSelection: WorkbenchSelectionState,
  currentSelection: WorkbenchSelectionState,
): boolean {
  const incomingTime = Date.parse(incomingSelection.updatedAt ?? '');
  const currentTime = Date.parse(currentSelection.updatedAt ?? '');
  return Number.isFinite(incomingTime) &&
    Number.isFinite(currentTime) &&
    incomingTime < currentTime;
}

function areDesignSelectionAnchorsEqual(left: WorkbenchSelectionState, right: WorkbenchSelectionState): boolean {
  return JSON.stringify(left.activeTarget) === JSON.stringify(right.activeTarget) &&
    getDesignLayerIdFromSelection(left) === getDesignLayerIdFromSelection(right) &&
    arraysAreEqual(getDesignLayerIdsFromSelection(left), getDesignLayerIdsFromSelection(right));
}

function arraysAreEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function cloneWorkbenchCommentRegistry(registry: WorkbenchCommentRegistry): WorkbenchCommentRegistry {
  return JSON.parse(JSON.stringify(registry)) as WorkbenchCommentRegistry;
}

function areWorkbenchCommentRegistriesEqual(left: WorkbenchCommentRegistry, right: WorkbenchCommentRegistry): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getMediaFrameAspectPreservingStylePatches(
  node: EditableTreeNode | null,
  property: SourceStyleProperty,
  value: string | null,
): DesignPreviewStyleDeclarationPatch[] {
  void node;
  return [{ property, value }];
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getUnknownString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeWorkbenchSelectionTarget(value: unknown): WorkbenchSelectionTarget | null {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  if (kind !== 'project' && kind !== 'page' && kind !== 'component' && kind !== 'node' && kind !== 'token') return null;
  return {
    kind,
    pageId: getUnknownString(value.pageId) || undefined,
    componentId: getUnknownString(value.componentId) || undefined,
    tokenId: getUnknownString(value.tokenId) || undefined,
    nodeId: getUnknownString(value.nodeId) || undefined,
    sourceFile: getUnknownString(value.sourceFile) || undefined,
    variant: isRecord(value.variant) ? Object.fromEntries(Object.entries(value.variant).flatMap(([axis, axisValue]) => (
      typeof axisValue === 'string' ? [[axis, axisValue]] : []
    ))) : undefined,
    state: getUnknownString(value.state) || undefined,
    extensions: isRecord(value.extensions) ? value.extensions : {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneSourceContents(contents: string): string {
  return contents;
}

function areSourceContentsEqual(left: string, right: string): boolean {
  return left === right ||
    normalizeWorkbenchSourceWriteContents(left) === normalizeWorkbenchSourceWriteContents(right);
}

function getEffectiveSourceTextBindingKey(node: EditableTreeNode | null): string | null {
  if (!node) return null;
  if (node.tokenBindings?.text) return node.tokenBindings.text;
  const textChild = node.children?.find((child) => child.kind === 'text' && child.tokenBindings?.text);
  return textChild?.tokenBindings?.text ?? null;
}

function getReadableSourceText(node: EditableTreeNode | null): string | null {
  if (!node) return null;
  if (node.kind === 'text' && typeof node.textContent === 'string' && node.textContent.trim()) {
    return node.textContent.trim();
  }
  const childText = (node.children ?? [])
    .flatMap((child) => {
      const text = getReadableSourceText(child);
      return text ? [text] : [];
    })
    .join(' ')
    .trim();
  return childText || null;
}
