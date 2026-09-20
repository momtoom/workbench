import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignLeft,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  ChevronRight,
  Code,
  Columns3,
  Crop,
  Eye,
  EyeOff,
  FileVideo,
  Folder,
  FolderPlus,
  GripVertical,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  NotebookPen,
  Palette,
  Pencil,
  Pointer,
  Plus,
  Redo2,
  RotateCcw,
  Rows3,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  WrapText,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  getTokenPreviewCss,
  queryTokens,
  type TokenPickerResult,
} from '@domain/design-system/tokens/query';
import type { WorkbenchColorSchemeSide } from '@domain/design-system/tokens/lightDark';
import {
  getLegacyProjectTokenCssVariableName,
  getProjectCollectionTokenCssVariableName,
  getProjectTokenCssVariableName,
} from '@domain/design-system/tokens/cssExport';
import { isCollectionI18n } from '@domain/design-system/tokens/operations';
import {
  parseTokenModeOverride,
  serializeTokenModeOverride,
  SOURCE_TOKEN_MODE_ATTRIBUTE,
} from '@domain/design-system/tokens/modeOverride';
import {
  isDimensionValue,
  type DimensionValue,
  type InspectorField,
  type TokenCollection,
  type TokenReference,
  type TokenRegistry,
  type TokenType,
} from '@domain/design-system/tokens/types';
import type {
  WorkbenchAssetRegistry,
  WorkbenchDesignAsset,
  WorkbenchDesignAssetKind,
  WorkbenchCommentRegistry,
  WorkbenchSelectionTarget,
} from '@domain/project/workbenchProject';
import type {
  WorkbenchProjectClassCatalog,
  WorkbenchProjectClassRule,
} from '@domain/project/workbenchProjectClassCatalog';
import {
  createWorkbenchCommentRegistryFromSpecNotes,
  createWorkbenchSpecNoteFolderId,
  createWorkbenchSpecNoteId,
  getWorkbenchSpecNoteTargetHighlightBoxes,
  getWorkbenchSpecNoteTargetLabel,
  getWorkbenchSpecNotesModel,
  isWorkbenchSpecNoteFolderInTargetContext,
  isWorkbenchSpecNoteInTargetContext,
  type WorkbenchSpecNote,
  type WorkbenchSpecNoteHighlightBox,
  type WorkbenchSpecNoteFolder,
  type WorkbenchSpecNotesModel,
  type WorkbenchSpecNoteType,
} from '@domain/project/workbenchSpecNotes';
import type {
  EditableTreeNode,
  EditableTreeSourceDataBinding,
  EditableTreeSourcePropArrayReference,
  EditableTreeSourcePropArray,
  EditableTreeSourcePropObject,
  EditableTreeSourceProps,
  EditableTreeSourcePropStringArray,
  EditableTreeSourceValueMetadataEntry,
} from '@domain/document/editableTree';
import {
  findEditableTreeNode,
  getEditableTreeReferencedArrayProp,
} from '@domain/document/editableTree';
import {
  collectEditableTreeClassUsage,
  type EditableTreeClassUsage,
} from '@domain/document/editableTreeClassUsage';
import {
  getWorkbenchDefaultIconPreviewOptions,
  getDesignAssetCssSnippet,
  getDesignAssetRuntimeValue,
  getDesignAssetUsageValue,
  getEffectiveDesignAssetKind,
  getWorkbenchAssetRuntimeValue,
  getWorkbenchAssetDefaults,
  getWorkbenchIconPreviewOptions,
  getWorkbenchImagePreviewOptions,
  isVideoDesignAssetSource,
  normalizeWorkbenchIconKey,
  type WorkbenchIconPreviewOption,
} from '@domain/design-system/assets/assetRegistry';
import {
  isEditableSourceAttributeName,
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
} from '@domain/document/sourceAttributeSafety';
import {
  parseSourceBackgroundVideoLayers,
  serializeSourceBackgroundVideoLayerProperty,
  SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY,
} from '@domain/document/sourceVideoBackground';
import type { SourceAttributeName, SourceComponentPropValue, SourceComponentTypeFallbackProps, SourceElementTagName, SourceStyleProperty } from '@domain/document/editableTreeSourceWriteback';
import { isEditableSourceStyleProperty } from '@domain/document/editableTreeSourceWriteback';
import {
  parsePrototypeClickCommand,
  PROTOTYPE_CLICK_ATTRIBUTE,
  PROTOTYPE_INITIAL_ATTRIBUTE,
  PROTOTYPE_NAME_ATTRIBUTE,
} from '@domain/document/prototypeInteractions';
import {
  findInspectorTokenBindingReference,
  findInspectorTokenBindingToken,
  formatInspectorBindingField,
  getInspectorFieldForTokenBindingField,
  getTokenBindingFieldForSourceStyleProperty,
  type InspectorTokenBindingField,
} from '@domain/inspector/inspectorEditService';
import {
  formatHtmlInspectorCategory,
  isSvgInspectorElementName,
  resolveHtmlInspectorModel,
  type HtmlInspectorCategory,
  type HtmlInspectorModel,
} from '@domain/inspector/htmlInspectorSchema';
import {
  getInspectorSectionFields,
  getTokenFieldForSourceStyleProperty,
  resolveInspectorFieldDescriptors,
  type InspectorFieldDescriptor,
} from '@domain/inspector/inspectorFieldRegistry';
import type { SelectionEditabilityDiagnostic } from '@domain/selection-scope/selectionScopeService';
import type { EditableTreeSourceDesignState } from '@domain/document/editableTreeSourceParser';
import { formatPreviewLayerKind, type PreviewLayer } from '@domain/preview/previewLayerService';

type DesignStateOverrideValue = string | number | boolean;
import type {
  CssClassEffectivenessEntry,
  CssClassEffectivenessReport,
  CssClassEffectivenessStatus,
} from '@domain/preview/cssClassEffectiveness';
import { WorkbenchEditorPanelBody, WorkbenchEditorPanelHeader } from './WorkbenchEditorShell';
import { InlineEditInput } from './InlineEditControls';
import { ModalField, ModalFieldList, ModalLayer } from './ModalLayer';
import { NumberScrubHandle } from './NumberScrubHandle';
import { normalizeScrubValue, useNumberScrub } from './useNumberScrub';
import {
  WorkbenchInspectorField,
  WorkbenchInspectorFieldList,
  WorkbenchInspectorSection,
  WorkbenchInspectorSectionList,
} from './WorkbenchInspectorPrimitives';
import {
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
} from './WorkbenchSidebarPrimitives';
import { InspectorTokenPicker, type TokenPickerScopeFilter } from './TokenPicker';
import { Button, IconButton, SearchField, SelectControl, TextArea, TextField } from '@shared/ui/primitives';
import {
  getWorkbenchPropRegistryPath,
  loadWorkbenchPropRegistry,
  readWorkbenchSourceFile,
  saveWorkbenchPropRegistry,
} from '@domain/project/workbenchProjectLoader';
import { getWorkbenchStories } from '../../../workbench-stories/stories';
import {
  getWorkbenchStoryDesignControls,
  getWorkbenchStoryDesignDefaultArgs,
  getWorkbenchStoryControlValue,
  isWorkbenchStoryControlVisible,
  type WorkbenchStoryArgValue,
  type WorkbenchStory,
  type WorkbenchStoryArgs,
  type WorkbenchStoryControl,
  type WorkbenchStoryControlPicker,
} from '../../../workbench-stories/storyTypes';
import {
  applyWorkbenchPropRegistry,
  createEmptyWorkbenchPropRegistry,
  normalizeWorkbenchPropRegistry,
  setWorkbenchPropRegistryOverride,
  type WorkbenchPropRegistryComponentConfig,
  type WorkbenchPropRegistryGroupConfig,
  type WorkbenchPropRegistryPropConfig,
  type WorkbenchPropRegistrySource,
} from '../../../workbench-stories/propRegistry';
import { findWorkbenchStoryControlViolation } from '../../../workbench-stories/storyControlContract';
import { getFallbackControlsFromArgs } from '../../../workbench-stories/sourceStoryMetadata';
import {
  formatTailwindClassTokenWithReplacementValue,
  getClassNameTokenInfo,
  getTailwindUtilityPickerResults,
  splitTailwindClassToken,
} from './inspectorTailwindUtilities';
import type {
  InspectorTokenPickerFilters,
  PreviewTokenModeSelection,
  SpecNoteHistoryChange,
} from './DesignInspectorTypes';
export type {
  InspectorTokenPickerFilters,
  PreviewTokenModeSelection,
  SpecNoteHistoryChange,
} from './DesignInspectorTypes';
const SOURCE_FIELD_AUTOCOMMIT_DELAY_MS = 450;
const ASSET_PICKER_POPOVER_WIDTH = 360;
const ASSET_PICKER_POPOVER_MAX_HEIGHT = 460;
const ASSET_PICKER_POPOVER_GAP = 8;

type InspectorHistoryShortcuts = {
  onHistoryRedo?: () => boolean;
  onHistoryUndo?: () => boolean;
};

const InspectorHistoryShortcutsContext = createContext<InspectorHistoryShortcuts>({});

// Detaching a token turns it into a literal, and an Astryx colour literal is a
// light-dark() pair. Folding it needs the side the preview is actually showing,
// which lives on DesignEditor; a context keeps it off the previewTokenModes
// prop chain, which already threads through ~150 call sites here.
const InspectorPreviewColorSchemeContext = createContext<WorkbenchColorSchemeSide>('light');

export function DesignInspectorPanel({
  assetRegistry,
  comments,
  componentStory,
  cssClassEffectivenessReport = null,
  onCssClassEffectivenessRequestChange,
  diagnostic,
  editabilityDiagnostic = null,
  canEditSourceFields,
  editableSourceNode,
  inspectorTokenPickerFilters,
  isRuntimeEditTarget = false,
  notice,
  runtimeFallbackGuidance = null,
  activeNoteBoxDraftNoteId = null,
  activeNotePreviewBoxId = null,
  onHistoryRedo,
  onHistoryUndo,
  onCommentsChange,
  noteHistoryCanRedo = false,
  noteHistoryCanUndo = false,
  specNoteTarget,
  onNoteHistoryRedo,
  onNoteHistoryUndo,
  onNoteHighlightBoxBodyChange,
  onNoteHighlightBoxDelete,
  onNoteHighlightBoxesClear,
  onNoteHighlightBoxDraftStart,
  onNoteHighlightBoxPreviewChange,
  onNoteHighlightBoxRename,
  onNoteLinkDragEnd,
  onNoteLinkDragStart,
  onNoteTargetPreviewChange,
  openSpecNoteId,
  onSourceAttributeChange,
  onSourceInlineSvgIconChange,
  onSourceBindingChange,
  onSourceComponentPropChange,
  onSourceComponentPropsChange,
  onSourceComponentTypeChange,
  onSourceNodeComponentPropChange,
  onSourceReferencedArrayPropChange,
  onSourceExtractSelectionToMap,
  onSourceNodeStyleDeclarationChange,
  onSourceElementTagNameChange,
  onSourceStyleDeclarationChange,
  onSourceTextContentChange,
  onSourceTextI18nBindingChange,
  onTokenPickerScopeFilterChange,
  previewColorSchemeSide,
  previewTokenModes,
  projectClassCatalog,
  selectedLayer,
  selectedLayerIds,
  designStateOverrides = {},
  designStates = [],
  onDesignStateOverrideChange,
  sourceDocumentRoot,
  selectedSourceNode: selectedSourceNodeProp,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  comments: WorkbenchCommentRegistry;
  componentStory?: WorkbenchStory | null;
  cssClassEffectivenessReport?: CssClassEffectivenessReport | null;
  onCssClassEffectivenessRequestChange?: (requested: boolean) => void;
  diagnostic: string;
  editabilityDiagnostic?: SelectionEditabilityDiagnostic | null;
  editableSourceNode: EditableTreeNode | null;
  inspectorTokenPickerFilters: InspectorTokenPickerFilters;
  isRuntimeEditTarget?: boolean;
  notice: string;
  runtimeFallbackGuidance?: string | null;
  activeNoteBoxDraftNoteId?: string | null;
  activeNotePreviewBoxId?: string | null;
  onCommentsChange: (comments: WorkbenchCommentRegistry, change?: SpecNoteHistoryChange) => void;
  onHistoryRedo?: () => boolean;
  onHistoryUndo?: () => boolean;
  noteHistoryCanRedo?: boolean;
  noteHistoryCanUndo?: boolean;
  specNoteTarget: WorkbenchSelectionTarget | null;
  onNoteHistoryRedo?: () => boolean;
  onNoteHistoryUndo?: () => boolean;
  onNoteHighlightBoxBodyChange: (noteId: string, boxId: string, bodyHtml: string) => void;
  onNoteHighlightBoxDelete: (noteId: string, boxId: string) => void;
  onNoteHighlightBoxesClear: (noteId: string) => void;
  onNoteHighlightBoxDraftStart: (noteId: string) => void;
  onNoteHighlightBoxPreviewChange: (boxId: string | null) => void;
  onNoteHighlightBoxRename: (noteId: string, boxId: string, label: string) => void;
  onNoteLinkDragEnd: () => void;
  onNoteLinkDragStart: (noteId: string) => void;
  onNoteTargetPreviewChange: (noteId: string | null) => void;
  openSpecNoteId?: string | null;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  onSourceInlineSvgIconChange: (source: string, iconName: string | null) => void;
  onSourceBindingChange: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceComponentPropChange: (propName: string, value: SourceComponentPropValue, options?: SourceComponentPropChangeOptions) => void;
  onSourceComponentPropsChange: (updates: SourceComponentPropUpdate[], options?: SourceComponentPropChangeOptions) => void;
  onSourceComponentTypeChange: (targetComponentName: string, options: SourceComponentTypeChangeOptions) => void;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  onSourceReferencedArrayPropChange: (node: EditableTreeNode, propName: string, value: EditableTreeSourcePropArray) => void;
  onSourceExtractSelectionToMap: () => void;
  onSourceNodeStyleDeclarationChange: (node: EditableTreeNode, property: SourceStyleProperty, value: string | null) => void;
  onSourceElementTagNameChange: (tagName: SourceElementTagName) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  onSourceTextContentChange: (text: string) => void;
  onSourceTextI18nBindingChange?: (tokenName: string | null) => void;
  onTokenPickerScopeFilterChange: (field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) => void;
  previewColorSchemeSide: WorkbenchColorSchemeSide;
  previewTokenModes: PreviewTokenModeSelection;
  projectClassCatalog: WorkbenchProjectClassCatalog;
  selectedLayer: PreviewLayer | null;
  selectedLayerIds: string[];
  designStateOverrides?: Record<string, DesignStateOverrideValue>;
  designStates?: EditableTreeSourceDesignState[];
  onDesignStateOverrideChange?: (name: string, value: DesignStateOverrideValue | null) => void;
  sourceDocumentRoot: EditableTreeNode | null;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const [activeInspectorTab, setActiveInspectorTab] = useState<'binding' | 'design' | 'notes'>('design');
  const [nodeSettingsOpen, setNodeSettingsOpen] = useState(false);
  const [, setPropRegistryLoadRevision] = useState(0);
  const propRegistryPath = getWorkbenchPropRegistryPath();
  const selectedSourceNode = useMemo(() => {
    const activeLayerNode = sourceDocumentRoot && selectedLayer?.id
      ? findEditableTreeNode(sourceDocumentRoot, selectedLayer.id)
      : null;
    return activeLayerNode?.source?.sourceFile ? activeLayerNode : selectedSourceNodeProp;
  }, [selectedLayer?.id, selectedSourceNodeProp, sourceDocumentRoot]);
  const localSourceBoundary = isLocalSourceComponentBoundary(selectedSourceNode);
  const inspectorModel = resolveHtmlInspectorModel({
    inspectable: selectedLayer?.inspectable,
    jsxName: selectedSourceNode?.source?.jsxName ?? selectedLayer?.jsxName,
    kind: selectedSourceNode?.kind ?? selectedLayer?.kind,
    sourceBacked: Boolean(selectedSourceNode?.source?.sourceFile ?? selectedLayer?.sourceFile),
  });
  const inspectorFields = localSourceBoundary ? [] : resolveInspectorFieldDescriptors(inspectorModel);
  const contentFields = getInspectorSectionFields(inspectorFields, 'content');
  const appearanceFields = getInspectorSectionFields(inspectorFields, 'appearance');
  const backgroundFields = getInspectorSectionFields(inspectorFields, 'background');
  const borderFields = getInspectorSectionFields(inspectorFields, 'border');
  const vectorFillFields = getInspectorSectionFields(inspectorFields, 'fill');
  const strokeFields = getInspectorSectionFields(inspectorFields, 'stroke');
  const outlineFields = getInspectorSectionFields(inspectorFields, 'outline');
  const layoutFields = getInspectorSectionFields(inspectorFields, 'layout');
  const flexItemFields = getInspectorSectionFields(inspectorFields, 'flexItem');
  const spacingFields = getInspectorSectionFields(inspectorFields, 'spacing');
  const sizeFields = getInspectorSectionFields(inspectorFields, 'size');
  const typographyFields = getInspectorSectionFields(inspectorFields, 'typography');
  const accessibilityFields = getInspectorSectionFields(inspectorFields, 'accessibility');
  const resolvedComponentStory = resolveInspectorComponentStory({
    componentStory,
    selectedLayer,
    selectedSourceNode,
  });
  const componentRegistryContext = getInspectorPropRegistryComponentContext(resolvedComponentStory, selectedSourceNode);
  const resolvedDesignControls = resolvedComponentStory
    ? applyWorkbenchPropRegistry(getWorkbenchStoryDesignControls(resolvedComponentStory), componentRegistryContext)
    : [];
  const multiSelectionLayoutTarget = resolveInspectorMultiSelectionLayoutTarget(sourceDocumentRoot, selectedLayerIds);
  const connectedArrayContext = getConnectedArrayContext(sourceDocumentRoot, selectedSourceNode);
  const selectedSourceMapCandidateCount = getInspectorSourceMapCandidateCount(sourceDocumentRoot, selectedLayerIds);
  const historyShortcuts = { onHistoryRedo, onHistoryUndo };
  const mappedCollectionSelectionKey = selectedSourceNode?.sourceMapBinding?.scope === 'collection'
    ? `${selectedSourceNode.id}:${selectedSourceNode.sourceMapBinding.source.code}`
    : null;
  const bindingSelectionKey = selectedSourceNode && (
    selectedSourceNode.sourceExpression ||
    selectedSourceNode.sourceMapBinding ||
    connectedArrayContext ||
    Object.keys(selectedSourceNode.sourceDataBindings ?? {}).length > 0
  )
    ? selectedSourceNode.id
    : null;
  const canEditDirectSourceFields = canEditSourceFields && !mappedCollectionSelectionKey;

  useEffect(() => {
    if (openSpecNoteId) setActiveInspectorTab('notes');
  }, [openSpecNoteId]);

  useEffect(() => {
    if (bindingSelectionKey) setActiveInspectorTab('binding');
  }, [bindingSelectionKey]);

  useEffect(() => {
    let cancelled = false;
    void loadWorkbenchPropRegistry(propRegistryPath)
      .then((value) => {
        if (cancelled) return;
        const nextRegistry = normalizeWorkbenchPropRegistry(value ?? createEmptyWorkbenchPropRegistry());
        setWorkbenchPropRegistryOverride(nextRegistry);
        setPropRegistryLoadRevision((revision) => revision + 1);
      })
      .catch(() => {
        if (cancelled) return;
        setWorkbenchPropRegistryOverride(null);
        setPropRegistryLoadRevision((revision) => revision + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [propRegistryPath]);

  return (
    <InspectorPreviewColorSchemeContext.Provider value={previewColorSchemeSide}>
    <InspectorHistoryShortcutsContext.Provider value={historyShortcuts}>
      <WorkbenchEditorPanelHeader
        ariaLabel="Inspector panels"
        title={(
          <span className="wb-storybook-tabs wb-inspector-title-tabs" role="tablist" aria-label="Inspector panels">
            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'design'}
              className={activeInspectorTab === 'design' ? 'wb-storybook-tab wb-storybook-tab--active' : 'wb-storybook-tab'}
              onClick={() => setActiveInspectorTab('design')}
            >
              Design
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'binding'}
              className={activeInspectorTab === 'binding' ? 'wb-storybook-tab wb-storybook-tab--active' : 'wb-storybook-tab'}
              onClick={() => setActiveInspectorTab('binding')}
            >
              Binding
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeInspectorTab === 'notes'}
              className={activeInspectorTab === 'notes' ? 'wb-storybook-tab wb-storybook-tab--active' : 'wb-storybook-tab'}
              onClick={() => setActiveInspectorTab('notes')}
            >
              Notes
            </button>
          </span>
        )}
      />
      <WorkbenchEditorPanelBody className="wb-design-inspector-body" ariaLabel="Inspector fields">
        {activeInspectorTab === 'notes' ? (
          <InspectorSpecNotesPanel
            activeNoteBoxDraftNoteId={activeNoteBoxDraftNoteId}
            activeNotePreviewBoxId={activeNotePreviewBoxId}
            comments={comments}
            canRedo={noteHistoryCanRedo}
            canUndo={noteHistoryCanUndo}
            targetContext={specNoteTarget}
            onChange={onCommentsChange}
            onHistoryRedo={onNoteHistoryRedo}
            onHistoryUndo={onNoteHistoryUndo}
            onNoteHighlightBoxBodyChange={onNoteHighlightBoxBodyChange}
            onNoteHighlightBoxDelete={onNoteHighlightBoxDelete}
            onNoteHighlightBoxesClear={onNoteHighlightBoxesClear}
            onNoteHighlightBoxDraftStart={onNoteHighlightBoxDraftStart}
            onNoteHighlightBoxPreviewChange={onNoteHighlightBoxPreviewChange}
            onNoteHighlightBoxRename={onNoteHighlightBoxRename}
            onNoteLinkDragEnd={onNoteLinkDragEnd}
            onNoteLinkDragStart={onNoteLinkDragStart}
            onNoteTargetPreviewChange={onNoteTargetPreviewChange}
            openSpecNoteId={openSpecNoteId}
          />
        ) : activeInspectorTab === 'binding' ? (
          <WorkbenchInspectorSectionList ariaLabel="Binding fields" density="compact">
            <InspectorNoticesSection
              connectedArrayContext={connectedArrayContext}
              editabilityDiagnostic={editabilityDiagnostic}
              runtimeFallbackGuidance={runtimeFallbackGuidance}
              selectedSourceNode={selectedSourceNode}
              sourceDocumentRoot={sourceDocumentRoot}
              tokenRegistry={tokenRegistry}
            />

            <InspectorDataBindingsSection selectedSourceNode={selectedSourceNode} />

            <InspectorSourceExpressionSection selectedSourceNode={selectedSourceNode} />

            {selectedSourceMapCandidateCount > 1 ? (
              <InspectorCreateSourceMapSection
                canEditSourceFields={canEditSourceFields}
                selectedCount={selectedSourceMapCandidateCount}
                onCreate={onSourceExtractSelectionToMap}
              />
            ) : null}

            {connectedArrayContext ? (
              <InspectorConnectedArraySection
                assetRegistry={assetRegistry}
                canEditSourceFields={canEditSourceFields}
                context={connectedArrayContext}
                onSourceReferencedArrayPropChange={onSourceReferencedArrayPropChange}
              />
            ) : null}

            <InspectorDesignStatesSection
              designStateOverrides={designStateOverrides}
              designStates={designStates}
              onDesignStateOverrideChange={onDesignStateOverrideChange}
            />

            {!runtimeFallbackGuidance && !selectedSourceNode?.sourceDataBindings && !selectedSourceNode?.sourceExpression && !connectedArrayContext && selectedSourceMapCandidateCount <= 1 ? (
              <WorkbenchInspectorSection title="Binding" density="compact">
                <WorkbenchInspectorField label="Status" density="compact" variant="notice">
                  No data binding or source expression is attached to this selection.
                </WorkbenchInspectorField>
              </WorkbenchInspectorSection>
            ) : null}
          </WorkbenchInspectorSectionList>
        ) : (
        <WorkbenchInspectorSectionList ariaLabel="Inspector fields" density="compact">
          <InspectorNoticesSection
            connectedArrayContext={connectedArrayContext}
            editabilityDiagnostic={editabilityDiagnostic}
            runtimeFallbackGuidance={runtimeFallbackGuidance}
            selectedSourceNode={selectedSourceNode}
            sourceDocumentRoot={sourceDocumentRoot}
            tokenRegistry={tokenRegistry}
          />

          {multiSelectionLayoutTarget ? (
            <InspectorMultiSelectionLayoutSection
              canEditSourceFields={canEditDirectSourceFields}
              target={multiSelectionLayoutTarget}
              onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
              onSourceNodeStyleDeclarationChange={onSourceNodeStyleDeclarationChange}
            />
          ) : null}

          {contentFields.length > 0 ? (
            <InspectorContentSection
              selectedLayer={selectedLayer}
              selectedSourceNode={selectedSourceNode}
              fields={contentFields}
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              isRuntimeEditTarget={isRuntimeEditTarget}
              model={inspectorModel}
              previewTokenModes={previewTokenModes}
              tokenRegistry={tokenRegistry}
              onSourceAttributeChange={onSourceAttributeChange}
              onSourceElementTagNameChange={onSourceElementTagNameChange}
              onSourceInlineSvgIconChange={onSourceInlineSvgIconChange}
              onSourceTextContentChange={onSourceTextContentChange}
              onSourceTextI18nBindingChange={onSourceTextI18nBindingChange}
            />
          ) : null}

          {resolvedComponentStory ? (
            <InspectorComponentPropsSection
              assetRegistry={assetRegistry}
              canEditSourceFields={canEditDirectSourceFields}
              controls={resolvedDesignControls}
              componentKey={componentRegistryContext?.name}
              defaultArgs={getWorkbenchStoryDesignDefaultArgs(resolvedComponentStory)}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              sourceDocumentRoot={sourceDocumentRoot}
              tokenRegistry={tokenRegistry}
              onSourceComponentPropChange={onSourceComponentPropChange}
              onSourceComponentPropsChange={onSourceComponentPropsChange}
              onSourceComponentTypeChange={onSourceComponentTypeChange}
              onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
            />
          ) : null}

          <InspectorSvgSourceSection
            canEditSourceFields={canEditDirectSourceFields}
            selectedLayer={selectedLayer}
            selectedSourceNode={selectedSourceNode}
            onSourceAttributeChange={onSourceAttributeChange}
          />

          {/* A local source boundary hides its computed inputs (inspectorFields is
              emptied above) because those are implementation props the page does
              not own. className is not one of them: it is authored on the instance
              in the page JSX the designer is editing, so hiding it took away a
              value they wrote and could no longer see or clear. The section gates
              itself on sourceBacked and an empty class list, so mounting it here is
              a no-op when there is nothing to show. A class the component drops is
              still worth rendering — it reports as not-forwarded, which is the
              signal the designer needs. */}
          <InspectorTailwindClassSection
            canEditSourceFields={canEditDirectSourceFields}
            cssClassEffectivenessReport={cssClassEffectivenessReport}
            onCssClassEffectivenessRequestChange={onCssClassEffectivenessRequestChange}
            projectClassCatalog={projectClassCatalog}
            selectedLayer={selectedLayer}
            sourceDocumentRoot={sourceDocumentRoot}
            selectedSourceNode={selectedSourceNode}
            onSourceAttributeChange={onSourceAttributeChange}
          />

          <InspectorInlineStyleSourceSection
            assetRegistry={assetRegistry}
            canEditSourceFields={canEditDirectSourceFields}
            previewTokenModes={previewTokenModes}
            selectedSourceNode={selectedSourceNode}
            tokenRegistry={tokenRegistry}
            onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          />

          {layoutFields.length > 0 ? (
            <InspectorLayoutSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={layoutFields}
              model={inspectorModel}
              onSourceAttributeChange={onSourceAttributeChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedLayer={selectedLayer}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {flexItemFields.length > 0 ? (
            <InspectorFlexItemSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={flexItemFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {sizeFields.length > 0 ? (
            <InspectorSizeSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={sizeFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {spacingFields.length > 0 ? (
            <InspectorSpacingSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={spacingFields}
              inspectorTokenPickerFilters={inspectorTokenPickerFilters}
              onSourceBindingChange={onSourceBindingChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              selectedTokenBindingNode={editableSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {typographyFields.length > 0 ? (
            <InspectorTypographySection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={typographyFields}
              inspectorTokenPickerFilters={inspectorTokenPickerFilters}
              onSourceBindingChange={onSourceBindingChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              selectedTokenBindingNode={editableSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {backgroundFields.length > 0 ? (
            <InspectorBackgroundSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={backgroundFields}
              inspectorTokenPickerFilters={inspectorTokenPickerFilters}
              onSourceBindingChange={onSourceBindingChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              selectedTokenBindingNode={editableSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {borderFields.length > 0 ? (
            <InspectorBorderSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={borderFields}
              inspectorTokenPickerFilters={inspectorTokenPickerFilters}
              onSourceBindingChange={onSourceBindingChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              selectedTokenBindingNode={editableSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {vectorFillFields.length > 0 ? (
            <InspectorVectorFillSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={vectorFillFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {strokeFields.length > 0 ? (
            <InspectorStrokeSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={strokeFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {outlineFields.length > 0 ? (
            <InspectorOutlineSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={outlineFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {appearanceFields.length > 0 ? (
            <InspectorLayerSection
              canEditSourceFields={canEditDirectSourceFields}
              assetRegistry={assetRegistry}
              fields={appearanceFields}
              nodeSettingsAction={(
                <InspectorNodeSettingsButton
                  canEditSourceFields={canEditDirectSourceFields}
                  open={nodeSettingsOpen}
                  previewTokenModes={previewTokenModes}
                  selectedSourceNode={selectedSourceNode}
                  tokenRegistry={tokenRegistry}
                  onOpenChange={setNodeSettingsOpen}
                  onSourceAttributeChange={onSourceAttributeChange}
                />
              )}
              onSourceAttributeChange={onSourceAttributeChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}

          {accessibilityFields.length > 0 ? (
            <InspectorAccessibilitySection
              model={inspectorModel}
              selectedLayer={selectedLayer}
              selectedSourceNode={selectedSourceNode}
              fields={accessibilityFields}
              canEditSourceFields={canEditDirectSourceFields}
              onSourceAttributeChange={onSourceAttributeChange}
            />
          ) : null}

          {inspectorModel.sections.includes('context') ? (
            <InspectorContextSection
              diagnostic={diagnostic}
              model={inspectorModel}
              notice={notice}
              selectedLayer={selectedLayer}
            />
          ) : null}
        </WorkbenchInspectorSectionList>
        )}
      </WorkbenchEditorPanelBody>
    </InspectorHistoryShortcutsContext.Provider>
    </InspectorPreviewColorSchemeContext.Provider>
  );
}

function InspectorCompactNotice({
  children,
  className,
  meta,
  title,
  tone = 'info',
}: {
  children: ReactNode;
  className?: string;
  meta?: ReactNode;
  title: ReactNode;
  tone?: 'info' | 'danger';
}) {
  const rowClassName = [
    'wb-inspector-notice-row',
    tone === 'danger' ? 'wb-inspector-notice-row--danger' : null,
    className ?? null,
  ].filter(Boolean).join(' ');
  return (
    <aside className={rowClassName} role="note" tabIndex={0}>
      <span className="wb-inspector-notice-row__head">
        <strong>{title}</strong>
        {meta ? <span className="wb-inspector-notice-row__meta">{meta}</span> : null}
      </span>
      <div className="wb-inspector-notice-row__popover">{children}</div>
    </aside>
  );
}

function RuntimeFallbackInspectorNotice({
  message,
}: {
  message: string;
}) {
  return (
    <InspectorCompactNotice className="wb-inspector-runtime-fallback-notice" title="Runtime fallback" tone="danger">
      <span>{message}</span>
    </InspectorCompactNotice>
  );
}

function InspectorEditabilityNotice({
  diagnostic,
}: {
  diagnostic: SelectionEditabilityDiagnostic;
}) {
  return (
    <InspectorCompactNotice className="wb-inspector-editability-notice" title={diagnostic.title}>
      <span>{diagnostic.message}</span>
      <span className="wb-inspector-editability-notice__action">{diagnostic.action}</span>
    </InspectorCompactNotice>
  );
}

const PREVIEW_ROOT_FONT_SIZE_DEFAULT = 16;
const PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE = 'data-wb-runtime-owner-node-id';

type PreviewEnvironmentProbe = {
  rootFontSize: number | null;
  tokenModes: string[];
};

const EMPTY_PREVIEW_ENVIRONMENT_PROBE: PreviewEnvironmentProbe = { rootFontSize: null, tokenModes: [] };

function readPreviewEnvironmentProbe(selectedSourceNodeId: string | null): PreviewEnvironmentProbe {
  if (typeof document === 'undefined') return EMPTY_PREVIEW_ENVIRONMENT_PROBE;
  const frame = document.querySelector<HTMLIFrameElement>('iframe.wb-source-visual-preview-frame');
  let frameDocument: Document | null = null;
  try {
    frameDocument = frame?.contentDocument ?? null;
  } catch {
    return EMPTY_PREVIEW_ENVIRONMENT_PROBE;
  }
  const root = frameDocument?.documentElement ?? null;
  const view = root?.ownerDocument.defaultView;
  if (!frameDocument || !root || !view) return EMPTY_PREVIEW_ENVIRONMENT_PROBE;
  const fontSize = Number.parseFloat(view.getComputedStyle(root).fontSize);
  // Runtime component selections can be projected without a selected class.
  // Resolve the authored node ID first so theme demos elsewhere on the page do
  // not leak into the current selection's notices.
  const escapedSelectedNodeId = selectedSourceNodeId
    ? view.CSS.escape(selectedSourceNodeId)
    : null;
  const selected = escapedSelectedNodeId
    ? frameDocument.querySelector(
        `[data-wb-preview-node-id="${escapedSelectedNodeId}"], `
        + `[${PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE}="${escapedSelectedNodeId}"]`,
      )
    : frameDocument.querySelector('.wb-source-visual-node--selected, .wb-runtime-design-node--selected');
  const selectedScope = selected?.closest(`[${SOURCE_TOKEN_MODE_ATTRIBUTE}]`) ?? null;
  const previewScope = frameDocument.querySelector(
    `[data-workbench-preview-root="true"][${SOURCE_TOKEN_MODE_ATTRIBUTE}], `
    + `.wb-runtime-design-preview[${SOURCE_TOKEN_MODE_ATTRIBUTE}]`,
  );
  const effectiveScope = selectedScope ?? previewScope;
  const scopeValues = effectiveScope
    ? [effectiveScope.getAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE)]
    : [];
  return {
    rootFontSize: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : null,
    tokenModes: [...new Set(scopeValues.filter((value): value is string => Boolean(value)))],
  };
}

/**
 * Root font-size and active token modes of the preview document. Project CSS
 * can rescale `1rem` (for example `html { font-size: 150% }`) and theme
 * wrappers can switch token modes without any editor-side signal, so both are
 * polled from the preview frame.
 */
function usePreviewEnvironmentProbe(selectedSourceNodeId: string | null): PreviewEnvironmentProbe {
  const [probe, setProbe] = useState<PreviewEnvironmentProbe>(EMPTY_PREVIEW_ENVIRONMENT_PROBE);
  useEffect(() => {
    const measure = () => {
      setProbe((current) => {
        const next = readPreviewEnvironmentProbe(selectedSourceNodeId);
        return next.rootFontSize === current.rootFontSize
          && next.tokenModes.join(';') === current.tokenModes.join(';')
          ? current
          : next;
      });
    };
    measure();
    const timer = window.setInterval(measure, 1_000);
    return () => window.clearInterval(timer);
  }, [selectedSourceNodeId]);
  return probe;
}

function formatPreviewRootFontSize(value: number): string {
  return `${Math.round(value * 10) / 10}`;
}

type PreviewEnvironmentNotice = {
  detail: string;
  meta: string | null;
  title: string;
};

function getPreviewEnvironmentNotice(rootFontSize: number | null): PreviewEnvironmentNotice | null {
  if (rootFontSize === null || Math.abs(rootFontSize - PREVIEW_ROOT_FONT_SIZE_DEFAULT) < 0.05) return null;
  const px = formatPreviewRootFontSize(rootFontSize);
  const percent = Math.round((rootFontSize / PREVIEW_ROOT_FONT_SIZE_DEFAULT) * 100);
  return {
    detail: `This page sets the preview root font-size to ${px}px (${percent}% of the 16px browser default), so rem-based sizes resolve against ${px}px instead of 16px.`,
    meta: `${percent}%`,
    title: `1rem = ${px}px`,
  };
}

function formatPreviewFontSizeTokenValue(value: DimensionValue, rootFontSize: number): string {
  const raw = `${Math.round(value.value * 1000) / 1000}${value.unit}`;
  if (value.unit !== 'rem') return raw;
  return `${raw} (${formatPreviewRootFontSize(value.value * rootFontSize)}px)`;
}

type PreviewScaleNoticeFieldGroup = {
  fields: InspectorField[];
  label: string;
  noun: string;
  remFrame: boolean;
};

const PREVIEW_SCALE_NOTICE_FIELD_GROUPS: PreviewScaleNoticeFieldGroup[] = [
  { fields: ['fontSize'], label: 'Font', noun: 'font-size', remFrame: false },
  { fields: ['padding', 'margin', 'gap'], label: 'Spacing', noun: 'spacing', remFrame: true },
];

/**
 * A theme can rescale typography and spacing through token modes (for example
 * Astryx Y2K enlarging font-size tokens ~145% and spacing tokens 150%) while
 * leaving the document root font-size — and therefore `1rem` — untouched, so
 * root-font-size probing alone cannot see it. Compare the mode active in the
 * preview against the collection's baseline mode for the token groups scoped
 * to the size-like inspector fields instead.
 */
function getPreviewTokenScaleNotices(
  tokenRegistry: TokenRegistry,
  tokenModes: string[],
  rootFontSize: number | null,
): PreviewEnvironmentNotice[] {
  const notices: PreviewEnvironmentNotice[] = [];
  for (const group of PREVIEW_SCALE_NOTICE_FIELD_GROUPS) {
    for (const tokenModesValue of tokenModes) {
      const notice = getPreviewTokenScaleNoticeForModes(tokenRegistry, group, tokenModesValue, rootFontSize);
      if (notice) {
        notices.push(notice);
        break;
      }
    }
  }
  return notices;
}

function getPreviewTokenScaleNoticeForModes(
  tokenRegistry: TokenRegistry,
  group: PreviewScaleNoticeFieldGroup,
  tokenModes: string,
  rootFontSize: number | null,
): PreviewEnvironmentNotice | null {
  const override = parseTokenModeOverride(tokenModes);
  const scopes = group.fields.flatMap((field) => tokenRegistry.fieldScopes?.[field] ?? []);
  const seenScopes = new Set<string>();
  for (const scope of scopes) {
    const scopeKey = `${scope.collectionId}:${scope.groupId ?? ''}`;
    if (seenScopes.has(scopeKey)) continue;
    seenScopes.add(scopeKey);
    const collection = tokenRegistry.collections.find((candidate) => candidate.id === scope.collectionId);
    if (!collection || collection.modes.length < 2) continue;
    const baselineModeId = collection.activeMode ?? collection.modes[0]?.id;
    const effectiveModeId = override[collection.id];
    if (!baselineModeId || !effectiveModeId || effectiveModeId === baselineModeId) continue;

    let extreme: { baseline: DimensionValue; effective: DimensionValue; name: string; ratio: number } | null = null;
    let minRatio = Number.POSITIVE_INFINITY;
    let maxRatio = Number.NEGATIVE_INFINITY;
    for (const token of collection.tokens) {
      if (token.type !== 'dimension') continue;
      if (scope.groupId && token.groupId !== scope.groupId) continue;
      const baseline = token.values[baselineModeId];
      const effective = token.values[effectiveModeId];
      if (baseline?.kind !== 'raw' || effective?.kind !== 'raw') continue;
      if (!isDimensionValue(baseline.value) || !isDimensionValue(effective.value)) continue;
      if (baseline.value.unit !== effective.value.unit) continue;
      if (baseline.value.value <= 0 || effective.value.value <= 0) continue;
      const ratio = effective.value.value / baseline.value.value;
      minRatio = Math.min(minRatio, ratio);
      maxRatio = Math.max(maxRatio, ratio);
      const deviation = Math.abs(ratio - 1);
      const extremeDeviation = extreme ? Math.abs(extreme.ratio - 1) : -1;
      // On equal deviation prefer the larger token — a more recognizable example.
      if (deviation > extremeDeviation
        || (Math.abs(deviation - extremeDeviation) < 1e-9 && extreme && baseline.value.value > extreme.baseline.value)) {
        extreme = { baseline: baseline.value, effective: effective.value, name: token.name, ratio };
      }
    }
    if (!extreme || Math.abs(extreme.ratio - 1) < 0.01) continue;

    const modeName = collection.modes.find((mode) => mode.id === effectiveModeId)?.name ?? effectiveModeId;
    const baselineName = collection.modes.find((mode) => mode.id === baselineModeId)?.name ?? baselineModeId;
    const percent = Math.round(extreme.ratio * 100);
    const px = rootFontSize ?? PREVIEW_ROOT_FONT_SIZE_DEFAULT;
    const uniform = maxRatio - minRatio < 0.01;
    // The user-facing frame for a uniform spacing scale is "the 1rem-sized
    // step is no longer 16px", not a percentage: a designer seeing py-4
    // render at 24px needs the changed baseline, in pixels.
    if (group.remFrame && uniform) {
      const basePx = formatPreviewRootFontSize(px);
      const scaledPx = formatPreviewRootFontSize(px * extreme.ratio);
      return {
        detail: `Theme mode ${modeName} scales ${group.noun} tokens to ${percent}% of ${baselineName}, so a 1rem (${basePx}px) ${group.noun} step renders as ${scaledPx}px. The CSS rem unit itself is unchanged.`,
        meta: modeName,
        title: `1rem ${group.noun} → ${scaledPx}px`,
      };
    }
    const title = uniform
      ? `${group.label} scale ${percent}%`
      : `${group.label} scale ${extreme.ratio > 1 ? 'up' : 'down'} to ${percent}%`;
    return {
      detail: `Theme mode ${modeName} resizes ${group.noun} tokens versus ${baselineName}. Largest change — ${extreme.name}: ${formatPreviewFontSizeTokenValue(extreme.baseline, px)} → ${formatPreviewFontSizeTokenValue(extreme.effective, px)}.`,
      meta: modeName,
      title,
    };
  }
  return null;
}

function InspectorNoticesSection({
  connectedArrayContext,
  editabilityDiagnostic,
  runtimeFallbackGuidance,
  selectedSourceNode,
  sourceDocumentRoot,
  tokenRegistry,
}: {
  connectedArrayContext: ConnectedArrayContext | null;
  editabilityDiagnostic: SelectionEditabilityDiagnostic | null;
  runtimeFallbackGuidance: string | null;
  selectedSourceNode: EditableTreeNode | null;
  sourceDocumentRoot: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const probe = usePreviewEnvironmentProbe(selectedSourceNode?.id ?? null);
  const environmentNotices = [
    getPreviewEnvironmentNotice(probe.rootFontSize),
    ...getPreviewTokenScaleNotices(tokenRegistry, probe.tokenModes, probe.rootFontSize),
  ].filter((notice): notice is PreviewEnvironmentNotice => notice !== null);
  const guidance = getSourcePatternGuidance(selectedSourceNode, connectedArrayContext, sourceDocumentRoot);
  const count = environmentNotices.length
    + (runtimeFallbackGuidance ? 1 : 0)
    + (editabilityDiagnostic ? 1 : 0)
    + guidance.length;
  if (count === 0) return null;

  return (
    <WorkbenchInspectorSection title="Notices" density="compact" meta={`${count}`}>
      <div className="wb-inspector-source-patterns">
        {environmentNotices.map((notice) => (
          <InspectorCompactNotice
            key={notice.title}
            className="wb-inspector-preview-environment-notice"
            meta={notice.meta}
            title={notice.title}
          >
            <span>{notice.detail}</span>
          </InspectorCompactNotice>
        ))}
        {runtimeFallbackGuidance ? (
          <RuntimeFallbackInspectorNotice message={runtimeFallbackGuidance} />
        ) : null}
        {editabilityDiagnostic ? (
          <InspectorEditabilityNotice diagnostic={editabilityDiagnostic} />
        ) : null}
        <InspectorSourcePatternGuidanceSection guidance={guidance} />
      </div>
    </WorkbenchInspectorSection>
  );
}

type SourcePatternGuidance = {
  action: string;
  body: string;
  kind: string;
  title: string;
};

function InspectorSourcePatternGuidanceSection({
  guidance,
}: {
  guidance: SourcePatternGuidance[];
}) {
  if (guidance.length === 0) return null;

  return (
    <>
      {guidance.map((item) => (
        <div
          key={`${item.kind}:${item.title}`}
          className="wb-inspector-source-pattern wb-inspector-notice-row"
          role="note"
          tabIndex={0}
        >
          <span className="wb-inspector-notice-row__head wb-inspector-source-pattern__head">
            <strong>{item.title}</strong>
            <span className="wb-inspector-notice-row__meta">{item.kind}</span>
          </span>
          <div className="wb-inspector-notice-row__popover">
            <p>{item.body}</p>
            <small>{item.action}</small>
          </div>
        </div>
      ))}
    </>
  );
}

function getSourcePatternGuidance(
  node: EditableTreeNode | null,
  connectedArrayContext: ConnectedArrayContext | null,
  sourceDocumentRoot: EditableTreeNode | null,
): SourcePatternGuidance[] {
  if (!node) return [];
  const directGuidance = getDirectSourcePatternGuidance(node, connectedArrayContext, {
    includeProvider: true,
    includeValueMetadata: true,
  });
  if (directGuidance.length > 0) return dedupeSourcePatternGuidance(directGuidance);

  const ancestorPath = sourceDocumentRoot ? findEditableTreeNodePreviewPath(sourceDocumentRoot, node.id).slice(0, -1).reverse() : [];
  for (const ancestor of ancestorPath) {
    const ancestorConnectedArrayContext = sourceDocumentRoot ? getConnectedArrayContext(sourceDocumentRoot, ancestor) : null;
    const ancestorGuidance = getDirectSourcePatternGuidance(ancestor, ancestorConnectedArrayContext, {
      includeProvider: false,
      includeValueMetadata: false,
    });
    if (ancestorGuidance.length > 0) return dedupeSourcePatternGuidance(ancestorGuidance);
  }

  return [];
}

function getDirectSourcePatternGuidance(
  node: EditableTreeNode,
  connectedArrayContext: ConnectedArrayContext | null,
  options: { includeProvider: boolean; includeValueMetadata: boolean },
): SourcePatternGuidance[] {
  const guidance: SourcePatternGuidance[] = [];

  if (isLocalSourceComponentBoundary(node)) {
    guidance.push({
      action: 'Double-click the node to enter its rendered structure, then select the visible child component. Use Binding or source only when you need to change the helper inputs themselves.',
      body: `${node.source?.jsxName ?? node.label} is a page-local React helper that groups visible child components. Its computed inputs stay source-owned so the Design Inspector does not turn into a long list of detachable implementation props.`,
      kind: 'local source',
      title: 'Local component boundary',
    });
  }

  if (options.includeProvider && isProviderLikeSourceNode(node) && !hasProviderWrapperEditSurface(node)) {
    guidance.push({
      action: 'Edit visible child layers, or expose stable wrapper className/style props when this provider should shape layout.',
      body: 'Provider, router, auth, theme, and data-client nodes often define runtime context rather than authored visual structure. Workbench keeps that context read-only unless it is surfaced as explicit wrapper props.',
      kind: 'provider',
      title: 'Provider context',
    });
  }

  if (node.sourceExpression) {
    guidance.push(getSourceExpressionGuidance(node.sourceExpression, connectedArrayContext));
  }

  if (!node.sourceExpression && node.sourceMapBinding) {
    const mapSelectionBody = node.sourceMapBinding.scope === 'collection'
      ? `This selection is a ${node.sourceMapBinding.itemCount}-item map from ${node.sourceMapBinding.source.label}.`
      : `This selection is row ${(node.sourceMapBinding.itemIndex ?? 0) + 1} of ${node.sourceMapBinding.itemCount} from ${node.sourceMapBinding.source.label}.`;
    guidance.push({
      action: node.sourceMapBinding.source.writable
        ? 'Use the Binding tab to edit rows in the Connected array table. Edit repeated structure by changing the map template in source.'
        : 'Keep this rendered item read-only until the upstream data source has a safe writer.',
      body: mapSelectionBody,
      kind: 'map',
      title: node.sourceMapBinding.source.writable ? 'Mapped data' : 'Mapped runtime data',
    });
  }

  if (options.includeValueMetadata) {
    const computedProps = getReadOnlyMetadataEntries(node.sourceValueMetadata?.props);
    const propSpreads = node.sourceValueMetadata?.propSpreads?.length ?? 0;
    if (computedProps.length > 0 || propSpreads > 0) {
      guidance.push(getComputedPropGuidance(computedProps, propSpreads));
    }

    const computedStyles = getReadOnlyMetadataEntries(node.sourceValueMetadata?.styles);
    const styleSpreads = node.sourceValueMetadata?.styleSpreads?.length ?? 0;
    if (computedStyles.length > 0 || styleSpreads > 0) {
      guidance.push({
        action: 'Promote stable design values to className, project CSS, CSS variables, or tokens. Keep runtime geometry as source code.',
        body: 'This selection includes computed inline style values. Workbench can inspect them, but direct visual edits would risk replacing runtime logic.',
        kind: 'inline style',
        title: 'Computed inline style',
      });
    } else if (Object.keys(node.sourceStyleDeclarations ?? {}).length > 0) {
      guidance.push({
        action: 'Literal inline styles can be edited, but reusable visual values should move toward className, project CSS, or tokens.',
        body: 'Static inline style values are source-backed, but they are weaker than token/class-backed styling for reuse, themes, and design-system consistency.',
        kind: 'inline style',
        title: 'Literal inline style',
      });
    }
  }

  return dedupeSourcePatternGuidance(guidance);
}

function getSourceExpressionGuidance(
  expression: NonNullable<EditableTreeNode['sourceExpression']>,
  connectedArrayContext: ConnectedArrayContext | null,
): SourcePatternGuidance {
  if (expression.kind === 'map') {
    return connectedArrayContext
      ? {
          action: 'Use the Binding tab to edit rows in the Connected array table. Edit repeated structure by changing the map template in source.',
          body: 'This rendered UI comes from an array plus a repeated JSX template. The rows can be edited as data when the source array is safely connected.',
          kind: 'map',
          title: 'Mapped data',
        }
      : {
          action: 'Keep this boundary when runtime ordering is intentional. Expose a local array, JSON/CSV prop, or other safe writer only when individual row editing is part of the design requirement.',
          body: 'Workbench can identify and preview this map, but its upstream value is runtime/computed data. This is a supported, non-blocking Binding boundary rather than a failed page.',
          kind: 'map',
          title: 'Mapped runtime collection',
        };
  }

  if (expression.kind === 'call') {
    return {
      action: 'Use a known prop/data editor when available, or edit the callback function in source.',
      body: 'Call expressions often represent render callbacks, formatters, or helper functions. Workbench should show their source instead of pretending the runtime result is a static node.',
      kind: 'callback',
      title: 'Render callback or helper',
    };
  }

  if (expression.kind === 'object' || expression.kind === 'array') {
    return {
      action: 'Simple data arrays can become table editors. UI schema/config objects need a component-specific editor before direct visual editing is safe.',
      body: 'Opaque config can be plain data or it can define UI structure. Workbench needs that distinction before writing back safely.',
      kind: 'config',
      title: 'Config expression',
    };
  }

  if (expression.kind === 'template') {
    return {
      action: 'Move editable copy into a literal prop, token/i18n value, or data field when designers should control it.',
      body: 'Template literals combine static text with runtime values, so direct text editing can accidentally erase the expression.',
      kind: 'computed text',
      title: 'Template literal',
    };
  }

  return {
    action: 'Use the upstream prop, data source, token, or source expression as the edit surface.',
    body: 'This visible value is computed from source. Binding can explain where it comes from; direct DOM-style editing should stay read-only unless Workbench has a safe writer for the pattern.',
    kind: expression.kind,
    title: 'Computed expression',
  };
}

function isProviderLikeSourceNode(node: EditableTreeNode): boolean {
  const name = node.source?.jsxName ?? node.source?.importName ?? node.label;
  return /(?:Provider|Router|QueryClient|Auth|Session|Theme|Store|Intl|I18n|Apollo|Relay)$/i.test(name) ||
    /(?:Provider|Router|Auth|Theme|QueryClient|Session|DataClient)/i.test(name);
}

function hasProviderWrapperEditSurface(node: EditableTreeNode): boolean {
  return Boolean(
    node.sourceAttributes?.className?.trim() ||
    Object.keys(node.sourceStyleDeclarations ?? {}).length > 0 ||
    Object.keys(node.sourceValueMetadata?.styles ?? {}).length > 0 ||
    (node.sourceValueMetadata?.styleSpreads?.length ?? 0) > 0
  );
}

function isLocalSourceComponentBoundary(node: EditableTreeNode | null): boolean {
  return Boolean(
    node?.kind === 'component-instance' &&
    node.source?.sourceFile &&
    !node.source.importSource &&
    (node.sourcePreviewChildren?.length ?? 0) > 0
  );
}

type ReadOnlySourceValueMetadataEntry = {
  name: string;
  source: Extract<EditableTreeSourceValueMetadataEntry, { writable: false }>;
};

function getComputedPropGuidance(
  entries: ReadOnlySourceValueMetadataEntry[],
  propSpreads: number,
): SourcePatternGuidance {
  const callbackProp = entries.find((entry) => isRenderCallbackProp(entry.name, entry.source.code));
  if (callbackProp) {
    return {
      action: 'Edit the callback in source, or expose its inputs as a known array/table prop before making row-level edits.',
      body: `${callbackProp.name} is a function-shaped prop. Workbench can show where it is bound, but the rendered output is owned by callback logic.`,
      kind: 'callback prop',
      title: 'Render callback prop',
    };
  }

  const configProp = entries.find((entry) => isConfigLikeProp(entry.name, entry.source.code));
  if (configProp) {
    return {
      action: 'Use a component-specific editor for this config, or split stable rows/series/tokens into explicit editable props.',
      body: `${configProp.name} is expression-backed config. Plain data can become a table editor, but UI schema and behavior config should stay source-owned until a safe writer exists.`,
      kind: 'config prop',
      title: 'Opaque config prop',
    };
  }

  if (propSpreads > 0) {
    return {
      action: 'Open the spread source or replace the spread with explicit props when designers need direct Inspector controls.',
      body: `${propSpreads} prop spread${propSpreads === 1 ? '' : 's'} can hide which values are visual props, runtime props, or event handlers.`,
      kind: 'prop spread',
      title: 'Prop spread values',
    };
  }

  return {
    action: 'Edit the upstream prop/data source or convert the value into a literal prop, token-compatible text, or component control.',
    body: `${entries.length} prop value${entries.length === 1 ? '' : 's'} are computed from expressions, so Workbench should not overwrite them as plain literals.`,
    kind: 'computed props',
    title: 'Computed prop values',
  };
}

function isRenderCallbackProp(name: string, code: string): boolean {
  return /^(?:render[A-Z]|.*Renderer$|children$)/.test(name) &&
    /(?:=>|function\s|\(\s*[^)]*\)\s*=>)/.test(code);
}

function isConfigLikeProp(name: string, code: string): boolean {
  return /(?:config|schema|options|settings|definition|layout|series|data|items)/i.test(name) ||
    /^[{\[]/.test(code.trim());
}

function getReadOnlyMetadataEntries(
  entries: Record<string, EditableTreeSourceValueMetadataEntry> | undefined,
): ReadOnlySourceValueMetadataEntry[] {
  const results: ReadOnlySourceValueMetadataEntry[] = [];
  for (const [name, source] of Object.entries(entries ?? {})) {
    if (!source.writable) results.push({ name, source });
  }
  return results;
}

function findEditableTreeNodePreviewPath(root: EditableTreeNode, nodeId: string): EditableTreeNode[] {
  if (root.id === nodeId) return [root];
  for (const child of [...(root.children ?? []), ...(root.sourcePreviewChildren ?? [])]) {
    const childPath = findEditableTreeNodePreviewPath(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  return [];
}

function dedupeSourcePatternGuidance(items: SourcePatternGuidance[]): SourcePatternGuidance[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type DataBindingPreview =
  | {
      status: 'idle' | 'loading';
    }
  | {
      contents: string;
      fields: string[];
      kind: 'array' | 'object' | 'primitive';
      rowCount: number | null;
      status: 'ready';
    }
  | {
      message: string;
      status: 'error';
    };

function InspectorDataBindingsSection({
  selectedSourceNode,
}: {
  selectedSourceNode: EditableTreeNode | null;
}) {
  const entries = useMemo(() => Object.entries(selectedSourceNode?.sourceDataBindings ?? {}), [selectedSourceNode?.sourceDataBindings]);
  const bindingKey = entries.map(([propName, binding]) => `${propName}:${binding.kind}:${binding.path ?? binding.importSource ?? binding.expression}`).join('|');
  const [previews, setPreviews] = useState<Record<string, DataBindingPreview>>({});

  useEffect(() => {
    if (entries.length === 0) {
      setPreviews({});
      return;
    }
    let cancelled = false;
    const initialPreviews = Object.fromEntries(
      entries.map(([propName, binding]): [string, DataBindingPreview] => [
        propName,
        binding.kind === 'json-file' && binding.path ? { status: 'loading' } : { status: 'idle' },
      ]),
    );
    setPreviews(initialPreviews);
    for (const [propName, binding] of entries) {
      if (binding.kind !== 'json-file' || !binding.path) continue;
      void readWorkbenchSourceFile(binding.path).then((result) => {
        if (cancelled) return;
        setPreviews((current) => ({
          ...current,
          [propName]: result.ok
            ? parseDataBindingPreview(result.contents)
            : { status: 'error', message: result.message },
        }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [bindingKey]);

  if (entries.length === 0) return null;

  return (
    <WorkbenchInspectorSection title="Data source" density="compact" meta={`${entries.length}`}>
      <div className="wb-inspector-data-bindings">
        {entries.map(([propName, binding]) => {
          const preview = previews[propName] ?? { status: 'idle' };
          return (
            <div key={`${propName}:${binding.expression}`} className="wb-inspector-data-binding">
              <div className="wb-inspector-data-binding-head">
                <strong>{propName}</strong>
                <span>{formatDataBindingKind(binding)}</span>
              </div>
              <WorkbenchInspectorField label="Binding" density="compact" variant="read">
                <span className="wb-inspector-data-binding-code">{binding.expression}</span>
              </WorkbenchInspectorField>
              <WorkbenchInspectorField label="Source" density="compact" variant="read">
                <span className="wb-inspector-data-binding-path">{binding.path ?? binding.importSource ?? binding.expression}</span>
              </WorkbenchInspectorField>
              {preview.status === 'loading' ? (
                <WorkbenchInspectorField label="Rows" density="compact" variant="read">
                  Reading...
                </WorkbenchInspectorField>
              ) : null}
              {preview.status === 'error' ? (
                <WorkbenchInspectorField label="Rows" density="compact" variant="read">
                  {preview.message}
                </WorkbenchInspectorField>
              ) : null}
              {preview.status === 'ready' ? (
                <>
                  <WorkbenchInspectorField label="Rows" density="compact" variant="read">
                    {preview.rowCount === null ? preview.kind : `${preview.rowCount}`}
                  </WorkbenchInspectorField>
                  {preview.fields.length > 0 ? (
                    <WorkbenchInspectorField label="Fields" density="compact" variant="read">
                      <span className="wb-inspector-data-binding-fields">{preview.fields.join(', ')}</span>
                    </WorkbenchInspectorField>
                  ) : null}
                  <details className="wb-inspector-data-binding-source">
                    <summary>JSON source</summary>
                    <pre>
                      <code>{preview.contents}</code>
                    </pre>
                  </details>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </WorkbenchInspectorSection>
  );
}

function parseDataBindingPreview(contents: string): DataBindingPreview {
  try {
    const parsed = JSON.parse(contents) as unknown;
    if (Array.isArray(parsed)) {
      return {
        contents: formatDataBindingContents(contents),
        fields: collectObjectFields(parsed),
        kind: 'array',
        rowCount: parsed.length,
        status: 'ready',
      };
    }
    if (parsed && typeof parsed === 'object') {
      return {
        contents: formatDataBindingContents(contents),
        fields: Object.keys(parsed).slice(0, 12),
        kind: 'object',
        rowCount: null,
        status: 'ready',
      };
    }
    return {
      contents: formatDataBindingContents(contents),
      fields: [],
      kind: 'primitive',
      rowCount: null,
      status: 'ready',
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'JSON could not be parsed.',
      status: 'error',
    };
  }
}

function collectObjectFields(rows: unknown[]): string[] {
  const fields = new Set<string>();
  for (const row of rows.slice(0, 25)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    for (const field of Object.keys(row)) fields.add(field);
  }
  return [...fields].slice(0, 16);
}

function formatDataBindingContents(contents: string): string {
  const trimmed = contents.trim();
  if (trimmed.length <= 4000) return trimmed;
  return `${trimmed.slice(0, 4000)}\n...`;
}

function formatDataBindingKind(binding: EditableTreeSourceDataBinding): string {
  if (binding.kind === 'json-file') return 'JSON';
  if (binding.kind === 'module') return 'Module';
  return 'Expression';
}

// Page-level `useState` values the canvas can project. Choosing a value here
// re-parses the source with that value bound, so conditional branches render
// the way the running page would. Nothing is written back to source.
function InspectorDesignStatesSection({
  designStateOverrides,
  designStates,
  onDesignStateOverrideChange,
}: {
  designStateOverrides: Record<string, DesignStateOverrideValue>;
  designStates: EditableTreeSourceDesignState[];
  onDesignStateOverrideChange: ((name: string, value: DesignStateOverrideValue | null) => void) | undefined;
}) {
  const [query, setQuery] = useState('');
  const [showInternal, setShowInternal] = useState(false);
  const groups = useMemo(() => groupInspectorDesignStates(designStates), [designStates]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const internalStateCount = groups.reduce((count, group) => (
    group.visibility === 'internal' ? count + group.states.length : count
  ), 0);
  const visibleGroups = groups.flatMap((group) => {
    if (group.visibility === 'internal' && !showInternal) return [];
    const states = normalizedQuery
      ? group.states.filter((state) => [
          state.name,
          state.label ?? formatDesignStateLabel(state.name),
          state.description ?? '',
          group.label,
          group.description ?? '',
        ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
      : group.states;
    return states.length > 0 ? [{ ...group, states }] : [];
  });

  if (designStates.length === 0 || !onDesignStateOverrideChange) return null;

  return (
    <WorkbenchInspectorSection
      title="Design states"
      density="compact"
      defaultOpen
      meta={`${designStates.length}`}
      actions={internalStateCount > 0 ? (
        <Button
          aria-pressed={showInternal}
          className="wb-inspector-design-state-internal-toggle"
          tone="ghost"
          onClick={() => setShowInternal((current) => !current)}
        >
          {showInternal ? 'Hide internal' : `Internal ${internalStateCount}`}
        </Button>
      ) : null}
    >
      <SearchField
        aria-label="Search design states"
        className="wb-inspector-design-state-search"
        clearLabel="Clear design state search"
        placeholder="Search states"
        value={query}
        onValueChange={setQuery}
      />
      <div className="wb-inspector-design-state-groups">
        {visibleGroups.map((group) => (
          <WorkbenchInspectorSection
            key={group.id}
            title={(
              <span className="wb-inspector-design-state-group-title" title={group.description}>
                {group.label}
              </span>
            )}
            density="compact"
            defaultOpen={Boolean(normalizedQuery) || group.defaultOpen}
            meta={(
              <span className={`wb-inspector-design-state-status wb-inspector-design-state-status--${group.status}`}>
                {group.status === 'runtime' ? `Runtime · ${group.states.length}` : group.states.length}
              </span>
            )}
          >
            <div className="wb-inspector-design-states">
              {group.states.map((state) => (
                <InspectorDesignStateRow
                  key={state.name}
                  designStateOverrides={designStateOverrides}
                  onDesignStateOverrideChange={onDesignStateOverrideChange}
                  state={state}
                />
              ))}
            </div>
          </WorkbenchInspectorSection>
        ))}
        {visibleGroups.length === 0 ? (
          <p className="wb-inspector-design-state-empty">No design states match this search.</p>
        ) : null}
      </div>
    </WorkbenchInspectorSection>
  );
}

type InspectorDesignStateGroup = {
  defaultOpen: boolean;
  description?: string;
  id: string;
  label: string;
  order: number;
  states: EditableTreeSourceDesignState[];
  status: 'preview' | 'runtime';
  visibility: 'default' | 'internal';
};

function groupInspectorDesignStates(
  designStates: EditableTreeSourceDesignState[],
): InspectorDesignStateGroup[] {
  const groups = new Map<string, InspectorDesignStateGroup>();
  for (const state of designStates) {
    const sourceGroup = state.group;
    const id = sourceGroup?.id ?? 'other';
    const group = groups.get(id) ?? {
      defaultOpen: sourceGroup?.defaultOpen ?? false,
      id,
      label: sourceGroup?.label ?? 'Other states',
      order: sourceGroup?.order ?? Number.MAX_SAFE_INTEGER,
      states: [],
      status: sourceGroup?.status ?? 'preview',
      visibility: sourceGroup?.visibility ?? 'default',
      ...(sourceGroup?.description ? { description: sourceGroup.description } : {}),
    };
    group.states.push(state);
    groups.set(id, group);
  }
  return [...groups.values()].sort((left, right) => left.order - right.order);
}

function formatDesignStateLabel(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return words ? `${words[0]?.toUpperCase() ?? ''}${words.slice(1).toLocaleLowerCase()}` : name;
}

function InspectorDesignStateRow({
  designStateOverrides,
  onDesignStateOverrideChange,
  state,
}: {
  designStateOverrides: Record<string, DesignStateOverrideValue>;
  onDesignStateOverrideChange: (name: string, value: DesignStateOverrideValue | null) => void;
  state: EditableTreeSourceDesignState;
}) {
  const overrideValue = designStateOverrides[state.name];
  const currentValue = overrideValue === undefined ? state.defaultValue : overrideValue;
  const choices: DesignStateOverrideValue[] = state.options ?? [];
  const isOverridden = overrideValue !== undefined && overrideValue !== state.defaultValue;
  const [draftValue, setDraftValue] = useState(String(currentValue));
  useEffect(() => setDraftValue(String(currentValue)), [currentValue]);
  const commit = (next: DesignStateOverrideValue) => onDesignStateOverrideChange(
    state.name,
    next === state.defaultValue ? null : next,
  );
  const commitDraft = () => {
    if (state.kind === 'number') {
      const next = Number(draftValue);
      if (draftValue.trim() !== '' && Number.isFinite(next)) {
        commit(next);
        return;
      }
      setDraftValue(String(currentValue));
      return;
    }
    commit(draftValue);
  };
  const control = state.kind === 'boolean' ? (
    <span className="wb-inspector-boolean-control">
      <input
        aria-label={`${state.name} design state`}
        checked={currentValue === true}
        type="checkbox"
        onChange={(event) => commit(event.target.checked)}
      />
      <span>{currentValue === true ? 'true' : 'false'}</span>
    </span>
  ) : choices.length > 0 ? (
    <SelectControl
      aria-label={`${state.name} design state`}
      className="wb-inspector-source-select"
      value={String(currentValue)}
      onValueChange={(next) => commit(
        choices.find((choice) => String(choice) === next) ?? next,
      )}
    >
      {choices.map((choice) => (
        <option key={String(choice)} value={String(choice)}>{String(choice)}</option>
      ))}
    </SelectControl>
  ) : (
    <TextField
      aria-label={`${state.name} design state`}
      className="wb-inspector-design-state-input"
      inputMode={state.kind === 'number' ? 'decimal' : undefined}
      type={state.kind === 'number' ? 'number' : 'text'}
      value={draftValue}
      onBlur={commitDraft}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key !== 'Escape') return;
        setDraftValue(String(currentValue));
        event.currentTarget.blur();
      }}
      onValueChange={setDraftValue}
    />
  );

  return (
    <WorkbenchInspectorField
      label={(
        <span
          aria-description={state.description}
          className="wb-inspector-design-state-name"
          title={[state.description, `Source: ${state.name}`].filter(Boolean).join('\n')}
        >
          {state.label ?? formatDesignStateLabel(state.name)}
        </span>
      )}
      density="compact"
      variant="control"
    >
      <span className="wb-inspector-design-state-control">
        {control}
        {isOverridden ? (
          <IconButton
            className="wb-inspector-design-state-reset"
            label={`Reset ${state.name} to ${String(state.defaultValue)}`}
            title={`Reset to ${String(state.defaultValue)}`}
            onClick={() => onDesignStateOverrideChange(state.name, null)}
          >
            <RotateCcw size={11} aria-hidden="true" />
          </IconButton>
        ) : null}
      </span>
    </WorkbenchInspectorField>
  );
}

function InspectorSourceExpressionSection({
  selectedSourceNode,
}: {
  selectedSourceNode: EditableTreeNode | null;
}) {
  const expression = selectedSourceNode?.sourceExpression;
  if (!expression) return null;
  const conciseSource = expression.kind === 'map'
    ? selectedSourceNode?.sourceMapBinding?.source.code ?? expression.mapSource?.code ?? expression.code
    : expression.code;

  return (
    <WorkbenchInspectorSection title={expression.kind === 'map' ? 'Binding source' : 'Source expression'} density="compact" defaultOpen>
      <WorkbenchInspectorField label="Kind" density="compact">
        {expression.label}
      </WorkbenchInspectorField>
      <WorkbenchInspectorField label="Edit surface" density="compact" variant="notice">
        Binding or source
      </WorkbenchInspectorField>
      <div className="wb-inspector-source-expression">
        <div className="wb-inspector-source-expression-head">
          <span>Source</span>
          <small>Preview boundary</small>
        </div>
        <pre className="wb-inspector-source-expression-code">
          <code>{conciseSource}</code>
        </pre>
      </div>
    </WorkbenchInspectorSection>
  );
}

type ConnectedArrayContext = {
  fields: string[];
  items: EditableTreeSourcePropArray;
  mapNode: EditableTreeNode;
  propName: string;
  reference: EditableTreeSourcePropArrayReference | null;
  referenceFields: string[];
  sourceLabel: string;
  sourceNode: EditableTreeNode;
  writable: boolean;
};

function InspectorCreateSourceMapSection({
  canEditSourceFields,
  onCreate,
  selectedCount,
}: {
  canEditSourceFields: boolean;
  onCreate: () => void;
  selectedCount: number;
}) {
  return (
    <WorkbenchInspectorSection
      title="Create array"
      density="compact"
      meta={`${selectedCount}`}
      actions={(
        <Button tone="neutral" disabled={!canEditSourceFields} onClick={onCreate}>
          Create map
        </Button>
      )}
    >
      <WorkbenchInspectorField label="Selection" density="compact">
        {selectedCount} sibling layers
      </WorkbenchInspectorField>
      <WorkbenchInspectorField label="Result" density="compact" variant="read">
        Extract repeated literal text and props into a source-backed map.
      </WorkbenchInspectorField>
    </WorkbenchInspectorSection>
  );
}

function InspectorConnectedArraySection({
  assetRegistry,
  canEditSourceFields,
  context,
  onSourceReferencedArrayPropChange,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  context: ConnectedArrayContext;
  onSourceReferencedArrayPropChange: (node: EditableTreeNode, propName: string, value: EditableTreeSourcePropArray) => void;
}) {
  const canWriteArray = canEditSourceFields && context.writable;
  const commitItemField = (
    itemIndex: number,
    field: string,
    value: EditableTreeSourcePropObject[string],
  ) => {
    const nextItems = context.items.map((item) => ({ ...item }));
    nextItems[itemIndex] = {
      ...(nextItems[itemIndex] ?? {}),
      [field]: value,
    };
    onSourceReferencedArrayPropChange(context.sourceNode, context.propName, nextItems);
  };

  const addItem = () => {
    const fields = context.fields.length > 0 ? context.fields : ['title'];
    const item: EditableTreeSourcePropObject = {};
    for (const field of fields) {
      item[field] = getConnectedArrayDefaultValue(context.items, field);
    }
    onSourceReferencedArrayPropChange(context.sourceNode, context.propName, [...context.items, item]);
  };

  const deleteItem = (itemIndex: number) => {
    onSourceReferencedArrayPropChange(
      context.sourceNode,
      context.propName,
      context.items.filter((_, index) => index !== itemIndex),
    );
  };

  const moveItem = (itemIndex: number, offset: -1 | 1) => {
    const targetIndex = itemIndex + offset;
    if (targetIndex < 0 || targetIndex >= context.items.length) return;
    const nextItems = [...context.items];
    const [item] = nextItems.splice(itemIndex, 1);
    if (!item) return;
    nextItems.splice(targetIndex, 0, item);
    onSourceReferencedArrayPropChange(context.sourceNode, context.propName, nextItems);
  };

  return (
    <WorkbenchInspectorSection
      title="Connected array"
      density="compact"
      meta={`${context.items.length}`}
      actions={canWriteArray ? (
        <Button className="wb-inspector-connected-array-add" tone="neutral" onClick={addItem}>
          + Item
        </Button>
      ) : null}
    >
      <WorkbenchInspectorField label="Source" density="compact">
        {context.sourceLabel}
      </WorkbenchInspectorField>
      <WorkbenchInspectorField label="Status" density="compact" variant={context.writable ? 'read' : 'notice'}>
        {context.writable
          ? 'Editable source array'
          : 'Read-only data source'}
      </WorkbenchInspectorField>
      {context.reference?.code ? (
        <details className="wb-inspector-connected-array-source" open={context.items.length <= 12}>
          <summary>Array source</summary>
          <div className="wb-inspector-connected-array-source-scroll">
            <pre>
              <code>{context.reference.code}</code>
            </pre>
          </div>
        </details>
      ) : null}
      <div className="wb-inspector-connected-array">
        {context.items.map((item, itemIndex) => (
          <div key={`${context.mapNode.id}:array-item:${itemIndex}`} className="wb-inspector-connected-array-row">
            <div className="wb-inspector-connected-array-row-head">
              <span>{`Item ${itemIndex + 1}`}</span>
              {canWriteArray ? (
                <div className="wb-inspector-connected-array-row-actions">
                  <IconButton
                    className="wb-inspector-connected-array-move"
                    disabled={itemIndex === 0}
                    label={`Move item ${itemIndex + 1} up`}
                    title={itemIndex === 0 ? 'Already first' : `Move item ${itemIndex + 1} up`}
                    onClick={() => moveItem(itemIndex, -1)}
                  >
                    <ArrowUp size={12} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    className="wb-inspector-connected-array-move"
                    disabled={itemIndex === context.items.length - 1}
                    label={`Move item ${itemIndex + 1} down`}
                    title={itemIndex === context.items.length - 1 ? 'Already last' : `Move item ${itemIndex + 1} down`}
                    onClick={() => moveItem(itemIndex, 1)}
                  >
                    <ArrowDown size={12} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    className="wb-inspector-connected-array-delete"
                    disabled={context.items.length <= 1}
                    label={`Delete item ${itemIndex + 1}`}
                    title={context.items.length <= 1 ? 'Keep at least one item' : `Delete item ${itemIndex + 1}`}
                    tone="danger"
                    onClick={() => deleteItem(itemIndex)}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </IconButton>
                </div>
              ) : null}
            </div>
            {context.referenceFields.map((field) => (
              <div key={field} className="wb-inspector-connected-array-cell wb-inspector-connected-array-cell--reference">
                <span>{formatConnectedArrayFieldLabel(field)}</span>
                <strong>{context.reference?.items[itemIndex]?.[field] ?? 'Not set'}</strong>
              </div>
            ))}
            {context.fields.map((field) => (
              <label key={field} className="wb-inspector-connected-array-cell">
                <span>{formatConnectedArrayFieldLabel(field)}</span>
                {canWriteArray ? (
                  isConnectedArrayIconField(field) ? (
                    <ComponentIconPropControl
                      ariaLabel={`${field} item ${itemIndex + 1}`}
                      assetRegistry={assetRegistry}
                      control={{ key: field, label: field, type: 'icon' }}
                      value={typeof item[field] === 'string' ? item[field] : ''}
                      onCommit={(value) => commitItemField(
                        itemIndex,
                        field,
                        typeof value === 'string' ? value : '',
                      )}
                    />
                  ) : typeof item[field] === 'boolean' ? (
                    <span className="wb-inspector-boolean-control">
                      <input
                        aria-label={`${field} item ${itemIndex + 1}`}
                        checked={item[field] === true}
                        type="checkbox"
                        onChange={(event) => commitItemField(itemIndex, field, event.target.checked)}
                      />
                      <span>{item[field] === true ? 'true' : 'false'}</span>
                    </span>
                  ) : (
                    <SourceAttributeControl
                      ariaLabel={`${field} item ${itemIndex + 1}`}
                      value={typeof item[field] === 'string' ? item[field] : String(item[field] ?? '')}
                      onCommit={(value) => commitItemField(itemIndex, field, value ?? '')}
                    />
                  )
                ) : (
                  <strong>{typeof item[field] === 'string' ? item[field] : String(item[field] ?? '')}</strong>
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
    </WorkbenchInspectorSection>
  );
}

type InspectorMultiSelectionLayoutMode = 'stack-props' | 'source-style';

const SPEC_NOTE_TYPES: Array<{ label: string; value: WorkbenchSpecNoteType }> = [
  { label: 'Intent', value: 'intent' },
  { label: 'Behavior', value: 'behavior' },
  { label: 'Content', value: 'content' },
  { label: 'Responsive', value: 'responsive' },
  { label: 'QA', value: 'qa' },
  { label: 'Question', value: 'question' },
];

type InspectorSpecNoteView = 'list' | 'detail';

function InspectorSpecNotesPanel({
  activeNoteBoxDraftNoteId,
  activeNotePreviewBoxId,
  canRedo,
  canUndo,
  comments,
  targetContext,
  onChange,
  onHistoryRedo,
  onHistoryUndo,
  onNoteHighlightBoxBodyChange,
  onNoteHighlightBoxDelete,
  onNoteHighlightBoxesClear,
  onNoteHighlightBoxDraftStart,
  onNoteHighlightBoxPreviewChange,
  onNoteHighlightBoxRename,
  onNoteLinkDragEnd,
  onNoteLinkDragStart,
  onNoteTargetPreviewChange,
  openSpecNoteId,
}: {
  activeNoteBoxDraftNoteId?: string | null;
  activeNotePreviewBoxId?: string | null;
  canRedo: boolean;
  canUndo: boolean;
  comments: WorkbenchCommentRegistry;
  targetContext: WorkbenchSelectionTarget | null;
  onChange: (comments: WorkbenchCommentRegistry, change?: SpecNoteHistoryChange) => void;
  onHistoryRedo?: () => boolean;
  onHistoryUndo?: () => boolean;
  onNoteHighlightBoxBodyChange: (noteId: string, boxId: string, bodyHtml: string) => void;
  onNoteHighlightBoxDelete: (noteId: string, boxId: string) => void;
  onNoteHighlightBoxesClear: (noteId: string) => void;
  onNoteHighlightBoxDraftStart: (noteId: string) => void;
  onNoteHighlightBoxPreviewChange: (boxId: string | null) => void;
  onNoteHighlightBoxRename: (noteId: string, boxId: string, label: string) => void;
  onNoteLinkDragEnd: () => void;
  onNoteLinkDragStart: (noteId: string) => void;
  onNoteTargetPreviewChange: (noteId: string | null) => void;
  openSpecNoteId?: string | null;
}) {
  const model = getWorkbenchSpecNotesModel(comments);
  const targetNotes = model.notes.filter((note) => isWorkbenchSpecNoteInTargetContext(note, targetContext));
  const targetFolderIds = getSpecNoteFolderTargetContextIds(model.folders, targetNotes, targetContext);
  const targetFolders = model.folders.filter((folder) => targetFolderIds.has(folder.id));
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [view, setView] = useState<InspectorSpecNoteView>('list');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [settingsNoteId, setSettingsNoteId] = useState<string | null>(null);
  const [settingsFolderId, setSettingsFolderId] = useState<string | null>(null);
  const [draggingRowSubject, setDraggingRowSubject] = useState<SpecNoteRowDragSubject | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<SpecNoteRowDropTarget | null>(null);
  const activeNote = targetNotes.find((note) => note.id === activeNoteId) ?? null;
  const settingsNote = targetNotes.find((note) => note.id === settingsNoteId) ?? null;
  const settingsFolder = targetFolders.find((folder) => folder.id === settingsFolderId) ?? null;
  const activeFolder = targetFolders.find((folder) => folder.id === activeFolderId) ?? null;
  const activeFolderPath = activeFolderId ? getSpecNoteFolderPath(targetFolders, activeFolderId) : [];
  const activeFolderParentId = activeFolderPath.length > 1 ? activeFolderPath[activeFolderPath.length - 2]?.id ?? null : null;
  const activeFolderLabel = activeFolderPath.length > 0
    ? activeFolderPath.map((folder) => folder.name).join(' / ')
    : 'Notes';
  const childFolders = targetFolders.filter((folder) => folder.parentFolderId === activeFolderId);
  const activeNotes = targetNotes.filter((note) => note.folderId === activeFolderId);

  const commitModel = (nextModel: WorkbenchSpecNotesModel, change: SpecNoteHistoryChange) => {
    onChange(createWorkbenchCommentRegistryFromSpecNotes(comments, nextModel), change);
  };
  const createFolder = (parentFolderId: string | null = activeFolderId) => {
    const now = new Date().toISOString();
    const folder: WorkbenchSpecNoteFolder = {
      id: createWorkbenchSpecNoteFolderId(),
      name: 'New folder',
      parentFolderId,
      target: targetContext,
      targetStatus: targetContext ? 'linked' : 'unlinked',
      createdAt: now,
      updatedAt: now,
    };
    commitModel({ ...model, folders: [...model.folders, folder] }, { kind: 'create', label: 'Create note folder' });
    setActiveFolderId(parentFolderId);
    setEditingFolderId(folder.id);
    setView('list');
  };
  const updateFolderName = (folderId: string, name: string) => {
    const now = new Date().toISOString();
    commitModel({
      ...model,
      folders: model.folders.map((folder) => folder.id === folderId
        ? { ...folder, name: name || 'Untitled folder', updatedAt: now }
        : folder),
    }, { kind: 'patch', label: 'Rename note folder' });
  };
  const updateFolder = (folderId: string, patch: Partial<WorkbenchSpecNoteFolder>) => {
    const now = new Date().toISOString();
    commitModel({
      ...model,
      folders: model.folders.map((folder) => folder.id === folderId
        ? { ...folder, ...patch, id: folder.id, updatedAt: now }
        : folder),
    }, { kind: 'patch', label: 'Update note folder' });
  };

  // Drag-and-drop reorder / reparent follows the visible folder hierarchy.
  const isFolderDescendantOf = (ancestorId: string, candidateId: string): boolean => {
    let current: string | null = candidateId;
    while (current) {
      if (current === ancestorId) return true;
      current = model.folders.find((folder) => folder.id === current)?.parentFolderId ?? null;
    }
    return false;
  };
  const calcRowDropPosition = (event: ReactDragEvent<HTMLElement>, allowInside: boolean): SpecNoteRowDropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    if (allowInside && y > rect.height * 0.30 && y < rect.height * 0.70) return 'inside';
    return y < rect.height / 2 ? 'before' : 'after';
  };
  const applyRowDrop = (subject: SpecNoteRowDragSubject, target: SpecNoteRowDropTarget) => {
    if (subject.kind === target.kind && subject.id === target.id) return;
    if (subject.kind === 'folder' && target.kind === 'folder' && target.position === 'inside') {
      if (isFolderDescendantOf(subject.id, target.id)) return;
    }
    const now = new Date().toISOString();
    let nextNotes = model.notes.slice();
    let nextFolders = model.folders.slice();

    if (target.position === 'inside' && target.kind === 'folder') {
      if (subject.kind === 'note') {
        nextNotes = nextNotes.map((note) => note.id === subject.id
          ? { ...note, folderId: target.id, updatedAt: now }
          : note);
      } else {
        nextFolders = nextFolders.map((folder) => folder.id === subject.id
          ? { ...folder, parentFolderId: target.id, updatedAt: now }
          : folder);
      }
    } else {
      // Before/after: adopt the target's parent, then insert at the target position.
      const targetNote = target.kind === 'note' ? model.notes.find((note) => note.id === target.id) : null;
      const targetFolder = target.kind === 'folder' ? model.folders.find((folder) => folder.id === target.id) : null;
      const targetParent = targetNote?.folderId ?? targetFolder?.parentFolderId ?? null;
      if (subject.kind === 'note') {
        const dragged = nextNotes.find((note) => note.id === subject.id);
        if (!dragged) return;
        const updated = { ...dragged, folderId: targetParent, updatedAt: now };
        nextNotes = nextNotes.filter((note) => note.id !== subject.id);
        if (target.kind === 'note') {
          const idx = nextNotes.findIndex((note) => note.id === target.id);
          if (idx >= 0) nextNotes.splice(target.position === 'before' ? idx : idx + 1, 0, updated);
          else nextNotes.push(updated);
        } else {
          // Cross-type before/after on a folder row adopts its parent; notes render after folders.
          nextNotes.push(updated);
        }
      } else {
        const dragged = nextFolders.find((folder) => folder.id === subject.id);
        if (!dragged) return;
        const updated = { ...dragged, parentFolderId: targetParent, updatedAt: now };
        nextFolders = nextFolders.filter((folder) => folder.id !== subject.id);
        if (target.kind === 'folder') {
          const idx = nextFolders.findIndex((folder) => folder.id === target.id);
          if (idx >= 0) nextFolders.splice(target.position === 'before' ? idx : idx + 1, 0, updated);
          else nextFolders.push(updated);
        } else {
          nextFolders.push(updated);
        }
      }
    }
    commitModel({ ...model, notes: nextNotes, folders: nextFolders }, { kind: 'move', label: 'Move spec note item' });
  };
  const makeRowDragHandlers = (subject: SpecNoteRowDragSubject, allowInside: boolean) => ({
    draggable: true,
    onDragStart: (event: ReactDragEvent<HTMLElement>) => {
      setDraggingRowSubject(subject);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-wb-spec-note-row', `${subject.kind}:${subject.id}`);
    },
    onDragEnd: () => {
      setDraggingRowSubject(null);
      setRowDropTarget(null);
    },
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => {
      if (!draggingRowSubject) return;
      if (draggingRowSubject.kind === subject.kind && draggingRowSubject.id === subject.id) return;
      if (draggingRowSubject.kind === 'folder' && subject.kind === 'folder' && allowInside
        && isFolderDescendantOf(draggingRowSubject.id, subject.id)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const position = calcRowDropPosition(event, allowInside);
      setRowDropTarget((current) => current && current.id === subject.id && current.position === position
        ? current
        : { ...subject, position });
    },
    onDragLeave: () => {
      setRowDropTarget((current) => current && current.id === subject.id ? null : current);
    },
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!draggingRowSubject || !rowDropTarget) return;
      applyRowDrop(draggingRowSubject, rowDropTarget);
      setDraggingRowSubject(null);
      setRowDropTarget(null);
    },
    dropPosition: rowDropTarget && rowDropTarget.id === subject.id ? rowDropTarget.position : null,
  });

  const deleteFolder = (folderId: string) => {
    const folder = model.folders.find((candidate) => candidate.id === folderId);
    const parentFolderId = folder?.parentFolderId ?? null;
    const now = new Date().toISOString();
    commitModel({
      ...model,
      folders: model.folders
        .filter((candidate) => candidate.id !== folderId)
        .map((candidate) => candidate.parentFolderId === folderId
          ? { ...candidate, parentFolderId, updatedAt: now }
          : candidate),
      notes: model.notes.map((note) => note.folderId === folderId
        ? { ...note, folderId: parentFolderId, updatedAt: now }
        : note),
    }, { kind: 'delete', label: 'Delete note folder' });
    if (activeFolderId === folderId) setActiveFolderId(parentFolderId);
    setView('list');
  };
  const createNote = () => {
    const now = new Date().toISOString();
    const note: WorkbenchSpecNote = {
      id: createWorkbenchSpecNoteId(),
      body: '',
      createdAt: now,
      folderId: activeFolderId,
      status: 'open',
      target: targetContext,
      targetStatus: targetContext ? 'linked' : 'unlinked',
      title: 'New spec note',
      type: 'intent',
      updatedAt: now,
    };
    commitModel({ ...model, notes: [note, ...model.notes] }, { kind: 'create', label: 'Create spec note' });
    setActiveNoteId(note.id);
    setView('detail');
  };
  const updateNote = (noteId: string, patch: Partial<WorkbenchSpecNote>) => {
    const now = new Date().toISOString();
    commitModel({
      ...model,
      notes: model.notes.map((note) => note.id === noteId ? { ...note, ...patch, updatedAt: now } : note),
    }, { kind: 'patch', label: getSpecNotePatchLabel(patch), mergeKey: getSpecNotePatchMergeKey(noteId, patch) });
    if (activeNoteId === noteId && 'folderId' in patch) {
      setActiveFolderId(patch.folderId ?? null);
    }
  };
  const deleteNote = (noteId: string) => {
    commitModel({ ...model, notes: model.notes.filter((note) => note.id !== noteId) }, { kind: 'delete', label: 'Delete spec note' });
    if (activeNoteId === noteId) setActiveNoteId(null);
    if (settingsNoteId === noteId) setSettingsNoteId(null);
    setView('list');
  };
  useEffect(() => {
    if (activeFolderId && !activeFolder) setActiveFolderId(null);
    if (activeNoteId && !activeNote) {
      setActiveNoteId(null);
      setView('list');
    }
    if (settingsNoteId && !settingsNote) setSettingsNoteId(null);
    if (settingsFolderId && !settingsFolder) setSettingsFolderId(null);
  }, [activeFolder, activeFolderId, activeNote, activeNoteId, settingsFolder, settingsFolderId, settingsNote, settingsNoteId]);

  const detailPreviewNoteId = view === 'detail' && activeNote ? activeNote.id : null;

  useEffect(() => {
    onNoteTargetPreviewChange(detailPreviewNoteId);
    return () => onNoteTargetPreviewChange(null);
  }, [detailPreviewNoteId, onNoteTargetPreviewChange]);

  useEffect(() => {
    if (!openSpecNoteId) return;
    const nextNote = targetNotes.find((note) => note.id === openSpecNoteId);
    if (!nextNote) return;
    setActiveFolderId(nextNote.folderId);
    setActiveNoteId(nextNote.id);
    setView('detail');
  }, [openSpecNoteId, targetNotes]);

  return (
    <>
      <div className="wb-spec-notes-panel">
      <WorkbenchInspectorSectionList ariaLabel="Spec notes" density="compact">
        {view === 'list' ? (
          <WorkbenchInspectorSection
            title={(
              <span className="wb-spec-note-nav-title">
                {activeFolderId ? (
                  <IconButton label="Back to parent folder" onClick={() => setActiveFolderId(activeFolderParentId)}>
                    <ArrowLeft size={14} aria-hidden="true" />
                  </IconButton>
                ) : null}
                <span>{activeFolderLabel}</span>
              </span>
            )}
            density="compact"
            collapsible={false}
            actions={(
              <>
                <SpecNoteHistoryActions
                  canRedo={canRedo}
                  canUndo={canUndo}
                  onRedo={onHistoryRedo}
                  onUndo={onHistoryUndo}
                />
                <IconButton label={activeFolder ? `New folder in ${activeFolder.name}` : 'New note folder'} onClick={() => createFolder(activeFolderId)}>
                  <FolderPlus size={14} aria-hidden="true" />
                </IconButton>
                <IconButton label={activeFolder ? `New note in ${activeFolder.name}` : 'New note'} onClick={createNote}>
                  <Plus size={14} aria-hidden="true" />
                </IconButton>
              </>
            )}
          >
            {childFolders.length === 0 && activeNotes.length === 0 ? (
              <WorkbenchInspectorField label="Notes" density="compact" variant="notice">
                {activeFolder ? 'No folders or notes in this folder' : 'No folders or notes'}
              </WorkbenchInspectorField>
            ) : (
              <WorkbenchSidebarRowList ariaLabel="Spec notes" className="wb-spec-note-list" density="compact">
                {childFolders.map((folder) => (
                  <InspectorSpecNoteFolderRow
                    key={folder.id}
                    label={folder.name}
                    itemCount={getSpecNoteFolderDirectItemCount(targetFolders, targetNotes, folder.id)}
                    editing={editingFolderId === folder.id}
                    rowDrag={makeRowDragHandlers({ kind: 'folder', id: folder.id }, true)}
                    onCreateChild={() => createFolder(folder.id)}
                    onDelete={() => deleteFolder(folder.id)}
                    onEdit={() => setEditingFolderId(folder.id)}
                    onOpenSettings={() => setSettingsFolderId(folder.id)}
                    onRename={(name) => {
                      updateFolderName(folder.id, name);
                      setEditingFolderId(null);
                    }}
                    onOpen={() => {
                      setEditingFolderId(null);
                      setActiveFolderId(folder.id);
                      setView('list');
                    }}
                  />
                ))}
                {activeNotes.map((note) => (
                  <InspectorSpecNoteRow
                    key={note.id}
                    note={note}
                    rowDrag={makeRowDragHandlers({ kind: 'note', id: note.id }, false)}
                    onDelete={() => deleteNote(note.id)}
                    onDragEnd={onNoteLinkDragEnd}
                    onDragStart={() => onNoteLinkDragStart(note.id)}
                    onOpenSettings={() => setSettingsNoteId(note.id)}
                    onPreviewChange={onNoteTargetPreviewChange}
                    onOpen={() => {
                      setActiveNoteId(note.id);
                      setView('detail');
                    }}
                  />
                ))}
              </WorkbenchSidebarRowList>
            )}
          </WorkbenchInspectorSection>
        ) : null}
        {view === 'detail' && activeNote ? (
          <InspectorSpecNoteDetail
            activeBoxDraft={activeNoteBoxDraftNoteId === activeNote.id}
            activePreviewBoxId={activeNotePreviewBoxId ?? null}
            note={activeNote}
            parentLabel={activeFolderLabel}
            onBack={() => setView('list')}
            onBoxBodyChange={(boxId, bodyHtml) => onNoteHighlightBoxBodyChange(activeNote.id, boxId, bodyHtml)}
            onBoxDelete={(boxId) => onNoteHighlightBoxDelete(activeNote.id, boxId)}
            onBoxPreviewChange={onNoteHighlightBoxPreviewChange}
            onBoxRename={(boxId, label) => onNoteHighlightBoxRename(activeNote.id, boxId, label)}
            onDragEnd={onNoteLinkDragEnd}
            onDragStart={() => onNoteLinkDragStart(activeNote.id)}
            onClearHighlightBoxes={() => onNoteHighlightBoxesClear(activeNote.id)}
            noteHistoryActions={(
              <SpecNoteHistoryActions
                canRedo={canRedo}
                canUndo={canUndo}
                onRedo={onHistoryRedo}
                onUndo={onHistoryUndo}
              />
            )}
            onOpenSettings={() => setSettingsNoteId(activeNote.id)}
            onStartHighlightBox={() => onNoteHighlightBoxDraftStart(activeNote.id)}
            onUpdate={(patch) => updateNote(activeNote.id, patch)}
          />
        ) : null}
      </WorkbenchInspectorSectionList>
      {settingsNote ? (
        <InspectorSpecNoteSettingsModal
          folders={targetFolders}
          note={settingsNote}
          onClose={() => setSettingsNoteId(null)}
          onDelete={() => deleteNote(settingsNote.id)}
          onUpdate={(patch) => updateNote(settingsNote.id, patch)}
        />
      ) : null}
      {settingsFolder ? (
        <InspectorSpecNoteFolderSettingsModal
          folder={settingsFolder}
          folders={targetFolders}
          onClose={() => setSettingsFolderId(null)}
          onDelete={() => { deleteFolder(settingsFolder.id); setSettingsFolderId(null); }}
          onUpdate={(patch) => updateFolder(settingsFolder.id, patch)}
        />
      ) : null}
      </div>
    </>
  );
}

function SpecNoteHistoryActions({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
}: {
  canRedo: boolean;
  canUndo: boolean;
  onRedo?: () => boolean;
  onUndo?: () => boolean;
}) {
  return (
    <>
      <IconButton label="Undo note edit" title="Undo note edit" disabled={!canUndo} onClick={() => onUndo?.()}>
        <Undo2 size={13} aria-hidden="true" />
      </IconButton>
      <IconButton label="Redo note edit" title="Redo note edit" disabled={!canRedo} onClick={() => onRedo?.()}>
        <Redo2 size={13} aria-hidden="true" />
      </IconButton>
    </>
  );
}

function InspectorSpecNoteDetail({
  activeBoxDraft,
  activePreviewBoxId,
  noteHistoryActions,
  note,
  parentLabel,
  onBack,
  onBoxBodyChange,
  onBoxDelete,
  onBoxPreviewChange,
  onBoxRename,
  onClearHighlightBoxes,
  onDragEnd,
  onDragStart,
  onOpenSettings,
  onStartHighlightBox,
  onUpdate,
}: {
  activeBoxDraft: boolean;
  activePreviewBoxId: string | null;
  noteHistoryActions?: ReactNode;
  note: WorkbenchSpecNote;
  parentLabel: string;
  onBack: () => void;
  onBoxBodyChange: (boxId: string, bodyHtml: string) => void;
  onBoxDelete: (boxId: string) => void;
  onBoxPreviewChange: (boxId: string | null) => void;
  onBoxRename: (boxId: string, label: string) => void;
  onClearHighlightBoxes: () => void;
  onDragEnd: () => void;
  onDragStart: () => void;
  onOpenSettings: () => void;
  onStartHighlightBox: () => void;
  onUpdate: (patch: Partial<WorkbenchSpecNote>) => void;
}) {
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [bodyDraft, setBodyDraft] = useState(note.body);
  const linkedToNode = note.target?.kind === 'node' && Boolean(note.target.nodeId);
  const highlightBoxes = getWorkbenchSpecNoteTargetHighlightBoxes(note.target);

  // While a field is focused or mid-IME-composition, an unrelated parent
  // re-render must not overwrite the draft from the note prop: doing so resets
  // the caret/selection and, during Korean composition, duplicates the last
  // character. We only re-sync drafts when the note actually switches (id
  // change) or when the user is not actively editing. Mirrors the
  // shouldSyncSourceFieldDraft guard used by the source inspector fields.
  const fieldFocusedRef = useRef(false);
  const composingRef = useRef(false);
  const noteIdRef = useRef(note.id);

  useEffect(() => {
    const noteSwitched = noteIdRef.current !== note.id;
    noteIdRef.current = note.id;
    if (!noteSwitched && (fieldFocusedRef.current || composingRef.current)) return;
    setTitleDraft(note.title);
    setBodyDraft(note.body);
  }, [note.body, note.id, note.title]);

  const commitDraft = () => {
    const patch: Partial<WorkbenchSpecNote> = {};
    if (titleDraft !== note.title) patch.title = titleDraft;
    if (bodyDraft !== note.body) patch.body = bodyDraft;
    if (Object.keys(patch).length > 0) onUpdate(patch);
  };

  const handleFieldFocus = () => { fieldFocusedRef.current = true; };
  const handleFieldBlur = () => {
    fieldFocusedRef.current = false;
    composingRef.current = false;
    commitDraft();
  };
  const handleCompositionStart = () => { composingRef.current = true; };
  const handleCompositionEnd = () => { composingRef.current = false; };

  return (
    <WorkbenchInspectorSection
      title={(
        <span className="wb-spec-note-nav-title">
          <IconButton label="Back to notes" onClick={onBack}>
            <ArrowLeft size={14} aria-hidden="true" />
          </IconButton>
          <span>{parentLabel} / Note</span>
        </span>
      )}
      density="compact"
      collapsible={false}
      actions={(
        <>
          {noteHistoryActions}
          <IconButton
            label="Drag note link to preview or layer tree"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'link';
              event.dataTransfer.setData('text/plain', note.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
          >
            <Pointer size={13} aria-hidden="true" />
          </IconButton>
          {linkedToNode ? (
            <IconButton
              aria-pressed={activeBoxDraft}
              label={activeBoxDraft ? 'Cancel highlight box drawing' : 'Add highlight box'}
              title={activeBoxDraft ? 'Cancel highlight box drawing' : 'Add highlight box'}
              onClick={onStartHighlightBox}
            >
              <Crop size={13} aria-hidden="true" />
            </IconButton>
          ) : null}
          {highlightBoxes.length > 0 ? (
            <IconButton label="Clear highlight boxes" title="Clear highlight boxes" onClick={onClearHighlightBoxes}>
              <X size={13} aria-hidden="true" />
            </IconButton>
          ) : null}
          <IconButton label="Note settings" aria-haspopup="dialog" onClick={onOpenSettings}>
            <SlidersHorizontal size={13} aria-hidden="true" />
          </IconButton>
        </>
      )}
    >
      <WorkbenchInspectorField label="Title" labelMode="hidden" density="compact" variant="control">
        <TextField
          aria-label="Note title"
          className="wb-spec-note-field"
          placeholder="Title"
          value={titleDraft}
          onFocus={handleFieldFocus}
          onBlur={handleFieldBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            // Enter that confirms an IME composition (e.g. Korean) must not blur
            // the field — that double-commits the last character.
            if (event.nativeEvent.isComposing) return;
            event.currentTarget.blur();
          }}
          onValueChange={setTitleDraft}
        />
      </WorkbenchInspectorField>
      <WorkbenchInspectorField label="Body" labelMode="hidden" density="compact" variant="control">
        <TextArea
          aria-label="Note body"
          className="wb-spec-note-field"
          rows={10}
          placeholder="Intent, behavior, content rules, QA checks..."
          value={bodyDraft}
          onFocus={handleFieldFocus}
          onBlur={handleFieldBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onValueChange={setBodyDraft}
        />
      </WorkbenchInspectorField>
      {linkedToNode ? (
        <WorkbenchInspectorField label="Highlight" density="compact" variant="read">
          {activeBoxDraft
            ? 'Draw a box inside the linked node in the preview.'
            : highlightBoxes.length > 0
              ? `${highlightBoxes.length} box${highlightBoxes.length === 1 ? '' : 'es'}`
              : 'No boxes'}
        </WorkbenchInspectorField>
      ) : null}
      {highlightBoxes.length > 0 ? (
        <WorkbenchInspectorField label="Boxes" labelMode="hidden" density="compact" variant="control">
          <div className="wb-spec-note-highlight-list">
            {highlightBoxes.map((box) => (
              <InspectorSpecNoteHighlightBoxEditor
                key={box.id}
                active={activePreviewBoxId === box.id}
                box={box}
                onBodyChange={(bodyHtml) => onBoxBodyChange(box.id, bodyHtml)}
                onDelete={() => onBoxDelete(box.id)}
                onPreviewChange={onBoxPreviewChange}
                onRename={(label) => onBoxRename(box.id, label)}
              />
            ))}
          </div>
        </WorkbenchInspectorField>
      ) : null}
    </WorkbenchInspectorSection>
  );
}

function InspectorSpecNoteHighlightBoxEditor({
  active,
  box,
  onBodyChange,
  onDelete,
  onPreviewChange,
  onRename,
}: {
  active: boolean;
  box: WorkbenchSpecNoteHighlightBox;
  onBodyChange: (bodyHtml: string) => void;
  onDelete: () => void;
  onPreviewChange: (boxId: string | null) => void;
  onRename: (label: string) => void;
}) {
  const [labelDraft, setLabelDraft] = useState(box.label);

  useEffect(() => {
    setLabelDraft(box.label);
  }, [box.id, box.label]);

  const commitLabel = () => {
    if (labelDraft !== box.label) onRename(labelDraft);
  };

  return (
    <div
      className={active ? 'wb-spec-note-highlight-card wb-spec-note-highlight-card--active' : 'wb-spec-note-highlight-card'}
      onMouseEnter={() => onPreviewChange(box.id)}
      onMouseLeave={() => onPreviewChange(null)}
    >
      <div className="wb-spec-note-highlight-card__header">
        <TextField
          aria-label="Highlight name"
          className="wb-spec-note-field"
          value={labelDraft}
          onBlur={commitLabel}
          onFocus={() => onPreviewChange(box.id)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.currentTarget.blur();
          }}
          onValueChange={setLabelDraft}
        />
        <IconButton label={`Delete ${box.label}`} title="Delete highlight" tone="danger" onClick={onDelete}>
          <Trash2 size={12} aria-hidden="true" />
        </IconButton>
      </div>
      <SpecNoteMiniEditor
        value={box.bodyHtml}
        onBlur={() => onPreviewChange(null)}
        onFocus={() => onPreviewChange(box.id)}
        onValueChange={onBodyChange}
      />
    </div>
  );
}

function SpecNoteMiniEditor({
  onBlur,
  onFocus,
  onValueChange,
  value,
}: {
  onBlur: () => void;
  onFocus: () => void;
  onValueChange: (value: string) => void;
  value: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
        horizontalRule: false,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'wb-spec-note-mini-editor__content',
      },
    },
    onBlur: ({ editor: currentEditor }) => {
      onValueChange(currentEditor.getHTML());
      onBlur();
    },
    onFocus,
  });

  useEffect(() => {
    if (!editor || editor.isFocused || editor.getHTML() === (value || '')) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="wb-spec-note-mini-editor">
      <div className="wb-spec-note-mini-editor__toolbar" aria-label="Highlight editor toolbar">
        <IconButton
          aria-pressed={editor?.isActive('bold') ?? false}
          label="Bold"
          disabled={!editor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={12} aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-pressed={editor?.isActive('italic') ?? false}
          label="Italic"
          disabled={!editor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={12} aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-pressed={editor?.isActive('bulletList') ?? false}
          label="Bullet list"
          disabled={!editor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={12} aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-pressed={editor?.isActive('orderedList') ?? false}
          label="Numbered list"
          disabled={!editor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={12} aria-hidden="true" />
        </IconButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function InspectorSpecNoteFolderRow({
  editing = false,
  itemCount,
  label,
  rowDrag,
  onCreateChild,
  onDelete,
  onEdit,
  onOpen,
  onOpenSettings,
  onRename,
}: {
  editing?: boolean;
  itemCount: number;
  label: string;
  rowDrag?: SpecNoteRowDragProps;
  onCreateChild?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpen: () => void;
  onOpenSettings?: () => void;
  onRename?: (name: string) => void;
}) {
  const [nameDraft, setNameDraft] = useState(label);

  useEffect(() => {
    if (editing) setNameDraft(label);
  }, [editing, label]);

  const commitFolderName = () => {
    const nextName = nameDraft.trim() || label;
    if (nextName !== label) {
      onRename?.(nextName);
      return;
    }
    onRename?.(label);
  };

  if (editing && onRename) {
    return (
      <WorkbenchSidebarRow
        actions={onDelete ? (
          <IconButton label={`Delete ${label}`} onClick={onDelete}>
            <Trash2 size={12} aria-hidden="true" />
          </IconButton>
        ) : null}
        actionsWidth={28}
        collapsePlaceholder={<Folder size={13} />}
        density="compact"
        editingControl={(
          <TextField
            aria-label="Folder name"
            autoFocus
            className="wb-spec-note-field"
            value={nameDraft}
            onBlur={commitFolderName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            onValueChange={setNameDraft}
          />
        )}
        label={label}
        onSelect={() => undefined}
      />
    );
  }

  return (
    <WorkbenchSidebarRow
      actions={onEdit ? (
        <>
          {onCreateChild ? (
            <IconButton label={`New folder in ${label}`} onClick={onCreateChild}>
              <FolderPlus size={12} aria-hidden="true" />
            </IconButton>
          ) : null}
          <IconButton label={`Rename ${label}`} onClick={onEdit}>
            <Pencil size={12} aria-hidden="true" />
          </IconButton>
          {onOpenSettings ? (
            <IconButton label={`Folder settings ${label}`} aria-haspopup="dialog" onClick={onOpenSettings}>
              <SlidersHorizontal size={12} aria-hidden="true" />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton label={`Delete ${label}`} onClick={onDelete}>
              <Trash2 size={12} aria-hidden="true" />
            </IconButton>
          ) : null}
        </>
      ) : null}
      actionsWidth={onEdit ? (onOpenSettings ? 104 : 80) : undefined}
      collapsePlaceholder={<Folder size={13} />}
      density="compact"
      draggable={rowDrag?.draggable}
      dropPosition={rowDrag?.dropPosition}
      label={label}
      meta={formatSpecNoteFolderItemCount(itemCount)}
      onDragEnd={rowDrag?.onDragEnd}
      onDragLeave={rowDrag?.onDragLeave}
      onDragOver={rowDrag?.onDragOver}
      onDragStart={rowDrag?.onDragStart}
      onDrop={rowDrag?.onDrop}
      onSelect={onOpen}
    />
  );
}

function InspectorSpecNoteRow({
  note,
  rowDrag,
  onDelete,
  onDragEnd,
  onDragStart,
  onOpen,
  onOpenSettings,
  onPreviewChange,
}: {
  note: WorkbenchSpecNote;
  rowDrag?: SpecNoteRowDragProps;
  onDelete: () => void;
  onDragEnd: () => void;
  onDragStart: () => void;
  onOpen: () => void;
  onOpenSettings: () => void;
  onPreviewChange: (noteId: string | null) => void;
}) {
  return (
    <WorkbenchSidebarRow
      actions={(
        <>
          <IconButton
            label={`Drag note link ${note.title || 'Untitled note'}`}
            draggable
            onDragStart={(event) => {
              // Keep the link-drag (to canvas) separate from the row reorder-drag on the parent button.
              event.stopPropagation();
              event.dataTransfer.effectAllowed = 'link';
              event.dataTransfer.setData('text/plain', note.id);
              onDragStart();
            }}
            onDragEnd={(event) => { event.stopPropagation(); onDragEnd(); }}
          >
            <Pointer size={12} aria-hidden="true" />
          </IconButton>
          <IconButton label={`Note settings ${note.title || 'Untitled note'}`} aria-haspopup="dialog" onClick={onOpenSettings}>
            <SlidersHorizontal size={12} aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${note.title || 'Untitled note'}`} onClick={onDelete}>
            <Trash2 size={12} aria-hidden="true" />
          </IconButton>
        </>
      )}
      actionsWidth={80}
      density="compact"
      collapsePlaceholder={<NotebookPen size={13} />}
      draggable={rowDrag?.draggable}
      dropPosition={rowDrag?.dropPosition}
      label={note.title || 'Untitled note'}
      meta={`${SPEC_NOTE_TYPES.find((type) => type.value === note.type)?.label ?? note.type} · ${getWorkbenchSpecNoteTargetLabel(note)}`}
      onDragEnd={rowDrag?.onDragEnd}
      onDragLeave={rowDrag?.onDragLeave}
      onDragOver={rowDrag?.onDragOver}
      onDragStart={rowDrag?.onDragStart}
      onDrop={rowDrag?.onDrop}
      onMouseEnter={() => onPreviewChange(note.id)}
      onMouseLeave={() => onPreviewChange(null)}
      onSelect={onOpen}
    />
  );
}

function InspectorProjectClassSourceModal({
  onClose,
  result,
}: {
  onClose: () => void;
  result: ProjectClassPickerResult;
}) {
  return (
    <ModalLayer title={`.${result.className}`} onClose={onClose}>
      <div className="wb-project-class-source">
        <p className="wb-project-class-source__files">{result.sourceFiles.join(', ')}</p>
        {result.rules.length === 0 ? (
          <p className="wb-project-class-source__empty">No rule body captured for this class.</p>
        ) : (
          result.rules.map((rule, index) => (
            <pre key={`${rule.sourceFile}:${index}`} className="wb-project-class-source__rule">
              {`${rule.selector} {\n${rule.declarations}\n}`}
            </pre>
          ))
        )}
      </div>
      <div className="wb-modal-actions">
        <Button tone="primary" onClick={onClose}>Done</Button>
      </div>
    </ModalLayer>
  );
}

function InspectorSpecNoteSettingsModal({
  folders,
  note,
  onClose,
  onDelete,
  onUpdate,
}: {
  folders: WorkbenchSpecNoteFolder[];
  note: WorkbenchSpecNote;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<WorkbenchSpecNote>) => void;
}) {
  return (
    <ModalLayer title="Note settings" onClose={onClose}>
      <ModalFieldList ariaLabel="Note settings fields">
        <ModalField label="Type">
          <SelectControl<WorkbenchSpecNoteType>
            aria-label="Note type"
            value={note.type}
            onValueChange={(value) => onUpdate({ type: value })}
          >
            {SPEC_NOTE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </SelectControl>
        </ModalField>
        <ModalField label="Folder">
          <SelectControl<string>
            aria-label="Note folder"
            value={note.folderId ?? ''}
            onValueChange={(value) => onUpdate({ folderId: value || null })}
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{formatSpecNoteFolderOptionLabel(folders, folder.id)}</option>
            ))}
          </SelectControl>
        </ModalField>
      </ModalFieldList>
      <div className="wb-modal-actions">
        <Button tone="danger" onClick={onDelete}>Delete note</Button>
        <Button tone="primary" onClick={onClose}>Done</Button>
      </div>
    </ModalLayer>
  );
}

function InspectorSpecNoteFolderSettingsModal({
  folder,
  folders,
  onClose,
  onDelete,
  onUpdate,
}: {
  folder: WorkbenchSpecNoteFolder;
  folders: WorkbenchSpecNoteFolder[];
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<WorkbenchSpecNoteFolder>) => void;
}) {
  // Disallow self/descendants as parent options to avoid cycles.
  const descendantIds = new Set<string>([folder.id]);
  let added = true;
  while (added) {
    added = false;
    for (const candidate of folders) {
      if (candidate.parentFolderId && descendantIds.has(candidate.parentFolderId) && !descendantIds.has(candidate.id)) {
        descendantIds.add(candidate.id);
        added = true;
      }
    }
  }
  const parentOptions = folders.filter((candidate) => !descendantIds.has(candidate.id));
  return (
    <ModalLayer title="Folder settings" onClose={onClose}>
      <ModalFieldList ariaLabel="Folder settings fields">
        <ModalField label="Name">
          <TextField
            aria-label="Folder name"
            value={folder.name}
            onValueChange={(value) => onUpdate({ name: value || 'Untitled folder' })}
          />
        </ModalField>
        <ModalField label="Parent folder">
          <SelectControl<string>
            aria-label="Parent folder"
            value={folder.parentFolderId ?? ''}
            onValueChange={(value) => onUpdate({ parentFolderId: value || null })}
          >
            <option value="">No parent</option>
            {parentOptions.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{formatSpecNoteFolderOptionLabel(folders, candidate.id)}</option>
            ))}
          </SelectControl>
        </ModalField>
      </ModalFieldList>
      <div className="wb-modal-actions">
        <Button tone="danger" onClick={onDelete}>Delete folder</Button>
        <Button tone="primary" onClick={onClose}>Done</Button>
      </div>
    </ModalLayer>
  );
}

type SpecNoteRowDragSubject = { kind: 'folder' | 'note'; id: string };
type SpecNoteRowDropPosition = 'after' | 'before' | 'inside';
type SpecNoteRowDropTarget = { kind: 'folder' | 'note'; id: string; position: SpecNoteRowDropPosition };
type SpecNoteRowDragProps = {
  draggable?: boolean;
  dropPosition?: SpecNoteRowDropPosition | null;
  onDragEnd?: (event: ReactDragEvent<HTMLElement>) => void;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: ReactDragEvent<HTMLElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
};

function getSpecNoteFolderTargetContextIds(
  folders: WorkbenchSpecNoteFolder[],
  notes: WorkbenchSpecNote[],
  targetContext: WorkbenchSelectionTarget | null,
): Set<string> {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const folderIds = new Set<string>();
  const addFolderAndAncestors = (folderId: string | null) => {
    const visited = new Set<string>();
    let currentFolderId = folderId;
    while (currentFolderId) {
      if (visited.has(currentFolderId)) break;
      visited.add(currentFolderId);
      const folder = folderById.get(currentFolderId);
      if (!folder) break;
      folderIds.add(folder.id);
      currentFolderId = folder.parentFolderId;
    }
  };

  for (const folder of folders) {
    if (isWorkbenchSpecNoteFolderInTargetContext(folder, targetContext)) addFolderAndAncestors(folder.id);
  }
  for (const note of notes) addFolderAndAncestors(note.folderId);
  return folderIds;
}

function getSpecNoteFolderPath(
  folders: WorkbenchSpecNoteFolder[],
  folderId: string | null,
): WorkbenchSpecNoteFolder[] {
  if (!folderId) return [];
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const path: WorkbenchSpecNoteFolder[] = [];
  const visited = new Set<string>();
  let currentFolderId: string | null = folderId;

  while (currentFolderId) {
    if (visited.has(currentFolderId)) break;
    visited.add(currentFolderId);
    const folder = folderById.get(currentFolderId);
    if (!folder) break;
    path.unshift(folder);
    currentFolderId = folder.parentFolderId;
  }

  return path;
}

function getSpecNoteFolderDirectItemCount(
  folders: WorkbenchSpecNoteFolder[],
  notes: WorkbenchSpecNote[],
  folderId: string,
): number {
  return folders.filter((folder) => folder.parentFolderId === folderId).length +
    notes.filter((note) => note.folderId === folderId).length;
}

function formatSpecNoteFolderItemCount(itemCount: number): string {
  return `${itemCount} item${itemCount === 1 ? '' : 's'}`;
}

function getSpecNotePatchLabel(patch: Partial<WorkbenchSpecNote>): string {
  if ('title' in patch) return 'Rename spec note';
  if ('body' in patch) return 'Update spec note body';
  if ('folderId' in patch) return 'Move spec note';
  if ('type' in patch || 'status' in patch) return 'Update spec note settings';
  if ('target' in patch || 'targetStatus' in patch) return 'Link spec note';
  return 'Update spec note';
}

function getSpecNotePatchMergeKey(noteId: string, patch: Partial<WorkbenchSpecNote>): string | undefined {
  if ('title' in patch) return `spec-note-title:${noteId}`;
  if ('body' in patch) return `spec-note-body:${noteId}`;
  return undefined;
}

function formatSpecNoteFolderOptionLabel(folders: WorkbenchSpecNoteFolder[], folderId: string): string {
  const path = getSpecNoteFolderPath(folders, folderId);
  return path.length > 0 ? path.map((folder) => folder.name).join(' / ') : 'Folder';
}

type InspectorMultiSelectionLayoutTarget = {
  count: number;
  mode: InspectorMultiSelectionLayoutMode;
  parent: EditableTreeNode;
};

type InspectorSegmentedOption = {
  label: string;
  value: string;
};

const STACK_DIRECTION_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Row', value: 'row' },
  { label: 'Column', value: 'column' },
];

const STACK_ALIGN_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
  { label: 'Stretch', value: 'stretch' },
];

const STACK_JUSTIFY_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
  { label: 'Between', value: 'between' },
];

const STACK_GAP_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'None', value: 'none' },
  { label: 'SM', value: 'sm' },
  { label: 'MD', value: 'md' },
  { label: 'LG', value: 'lg' },
  { label: 'XL', value: 'xl' },
];

const STYLE_DISPLAY_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Auto', value: '' },
  { label: 'Flex', value: 'flex' },
  { label: 'Grid', value: 'grid' },
];

const STYLE_DIRECTION_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Row', value: 'row' },
  { label: 'Column', value: 'column' },
];

const STYLE_ALIGN_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Start', value: 'flex-start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'flex-end' },
  { label: 'Stretch', value: 'stretch' },
];

const STYLE_JUSTIFY_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'Start', value: 'flex-start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'flex-end' },
  { label: 'Between', value: 'space-between' },
];

const STYLE_GAP_OPTIONS: InspectorSegmentedOption[] = [
  { label: 'None', value: '0' },
  { label: 'SM', value: '0.5rem' },
  { label: 'MD', value: '1rem' },
  { label: 'LG', value: '1.5rem' },
  { label: 'XL', value: '2rem' },
];

function InspectorMultiSelectionLayoutSection({
  canEditSourceFields,
  onSourceNodeComponentPropChange,
  onSourceNodeStyleDeclarationChange,
  target,
}: {
  canEditSourceFields: boolean;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  onSourceNodeStyleDeclarationChange: (node: EditableTreeNode, property: SourceStyleProperty, value: string | null) => void;
  target: InspectorMultiSelectionLayoutTarget;
}) {
  const parent = target.parent;
  const isStack = target.mode === 'stack-props';
  const parentProps = parent.sourceProps ?? {};
  const parentStyles = parent.sourceStyleDeclarations ?? {};

  const commitStackProp = (propName: string, value: string | null) => {
    onSourceNodeComponentPropChange(parent, propName, value);
  };
  const commitStyle = (property: SourceStyleProperty, value: string | null) => {
    onSourceNodeStyleDeclarationChange(parent, property, value);
  };

  return (
    <WorkbenchInspectorSection title="Selection" density="compact" meta={`${target.count}`}>
      <WorkbenchInspectorField label="Parent" density="compact">
        {parent.label}
      </WorkbenchInspectorField>
      {isStack ? (
        <>
          <InspectorSegmentedField
            ariaLabel="Selection direction"
            label="Direction"
            options={STACK_DIRECTION_OPTIONS}
            value={getStringSourceProp(parentProps, 'direction', 'column')}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStackProp('direction', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection align"
            label="Align"
            options={STACK_ALIGN_OPTIONS}
            value={getStringSourceProp(parentProps, 'align', 'stretch')}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStackProp('align', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection distribute"
            label="Distribute"
            options={STACK_JUSTIFY_OPTIONS}
            value={getStringSourceProp(parentProps, 'justify', 'start')}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStackProp('justify', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection gap"
            label="Gap"
            options={STACK_GAP_OPTIONS}
            value={getStringSourceProp(parentProps, 'gap', 'md')}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStackProp('gap', value)}
          />
        </>
      ) : (
        <>
          <InspectorSegmentedField
            ariaLabel="Selection flow"
            label="Flow"
            options={STYLE_DISPLAY_OPTIONS}
            value={parentStyles.display ?? ''}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStyle('display', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection direction"
            label="Direction"
            options={STYLE_DIRECTION_OPTIONS}
            value={parentStyles['flex-direction'] ?? ''}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStyle('flex-direction', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection align"
            label="Align"
            options={STYLE_ALIGN_OPTIONS}
            value={parentStyles['align-items'] ?? ''}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStyle('align-items', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection distribute"
            label="Distribute"
            options={STYLE_JUSTIFY_OPTIONS}
            value={parentStyles['justify-content'] ?? ''}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStyle('justify-content', value)}
          />
          <InspectorSegmentedField
            ariaLabel="Selection gap"
            label="Gap"
            options={STYLE_GAP_OPTIONS}
            value={parentStyles.gap ?? ''}
            disabled={!canEditSourceFields}
            onCommit={(value) => commitStyle('gap', value)}
          />
        </>
      )}
    </WorkbenchInspectorSection>
  );
}

function InspectorSegmentedField({
  ariaLabel,
  disabled,
  label,
  onCommit,
  options,
  value,
}: {
  ariaLabel: string;
  disabled?: boolean;
  label: string;
  onCommit: (value: string | null) => void;
  options: InspectorSegmentedOption[];
  value: string;
}) {
  return (
    <WorkbenchInspectorField label={label} density="compact" variant="control">
      <div className="wb-inspector-segmented-control" role="group" aria-label={ariaLabel}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={[
                'wb-inspector-segmented-button',
                active ? 'wb-inspector-segmented-button--active' : '',
              ].filter(Boolean).join(' ')}
              aria-label={option.label}
              aria-pressed={active}
              disabled={disabled}
              title={option.label}
              onClick={() => {
                // Re-clicking the active option toggles it off (clears the
                // value back to unset); selecting another option commits it.
                if (active) {
                  onCommit(null);
                  return;
                }
                onCommit(option.value === '' ? null : option.value);
              }}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </WorkbenchInspectorField>
  );
}

function resolveInspectorMultiSelectionLayoutTarget(
  root: EditableTreeNode | null,
  selectedLayerIds: string[],
): InspectorMultiSelectionLayoutTarget | null {
  if (!root || selectedLayerIds.length <= 1) return null;

  const entries = selectedLayerIds
    .map((layerId) => findEditableTreeNodeParentEntry(root, layerId))
    .filter((entry): entry is { node: EditableTreeNode; parent: EditableTreeNode } => Boolean(entry?.node && entry.parent));
  if (entries.length !== selectedLayerIds.length) return null;

  const parentId = entries[0]?.parent.id ?? null;
  if (!parentId || entries.some((entry) => entry.parent.id !== parentId)) return null;

  const parent = entries[0]?.parent ?? null;
  if (!parent || parent.kind === 'text' || !parent.source?.sourceFile || !parent.sourceLocation) return null;
  if (entries.some((entry) => entry.node.source?.sourceFile !== parent.source?.sourceFile)) return null;
  const mode = getInspectorMultiSelectionLayoutMode(parent);
  if (!mode) return null;

  return {
    count: entries.length,
    mode,
    parent,
  };
}

function getInspectorSourceMapCandidateCount(
  root: EditableTreeNode | null,
  selectedLayerIds: string[],
): number {
  if (!root || selectedLayerIds.length <= 1) return 0;

  const entries = selectedLayerIds
    .map((layerId) => findEditableTreeNodeParentEntry(root, layerId))
    .filter((entry): entry is { node: EditableTreeNode; parent: EditableTreeNode } => Boolean(
      entry?.node &&
      entry.parent &&
      entry.node.id !== root.id &&
      entry.node.source?.sourceFile &&
      entry.node.sourceLocation,
    ));
  if (entries.length !== selectedLayerIds.length) return 0;

  const parentId = entries[0]?.parent.id ?? null;
  if (!parentId || entries.some((entry) => entry.parent.id !== parentId)) return 0;

  const sourceFile = entries[0]?.node.source?.sourceFile ?? null;
  if (!sourceFile || entries.some((entry) => entry.node.source?.sourceFile !== sourceFile)) return 0;

  return entries.length;
}

function getInspectorMultiSelectionLayoutMode(parent: EditableTreeNode): InspectorMultiSelectionLayoutMode | null {
  const elementName = parent.source?.jsxName ?? '';
  if (isStackLikeComponentName(elementName)) return 'stack-props';
  if (isHtmlLayoutContainerName(elementName)) return 'source-style';
  return null;
}

function isStackLikeComponentName(elementName: string): boolean {
  return isComponentName(elementName) && (elementName === 'Stack' || elementName.endsWith('Stack'));
}

function isComponentName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Z][A-Za-z0-9_$]*)*$/.test(value);
}

function isHtmlLayoutContainerName(elementName: string): boolean {
  return [
    'article',
    'aside',
    'div',
    'footer',
    'form',
    'header',
    'li',
    'main',
    'nav',
    'ol',
    'section',
    'ul',
  ].includes(elementName);
}

function findEditableTreeNodeParentEntry(
  root: EditableTreeNode,
  nodeId: string,
  parent: EditableTreeNode | null = null,
): { node: EditableTreeNode; parent: EditableTreeNode | null } | null {
  if (root.id === nodeId) return { node: root, parent };

  for (const child of root.children ?? []) {
    const match = findEditableTreeNodeParentEntry(child, nodeId, root);
    if (match) return match;
  }

  return null;
}

function getStringSourceProp(props: EditableTreeSourceProps, propName: string, fallback = ''): string {
  const value = props[propName];
  return typeof value === 'string' ? value : fallback;
}

function InspectorNodeSettingsButton({
  canEditSourceFields,
  onOpenChange,
  onSourceAttributeChange,
  open,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  canEditSourceFields: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  open: boolean;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const collections = tokenRegistry.collections.filter((collection) => collection.modes.length > 0);
  const overrides = parseTokenModeOverride(selectedSourceNode?.sourceAttributes?.[SOURCE_TOKEN_MODE_ATTRIBUTE]);
  const hasOverrides = Object.keys(overrides).length > 0;
  const disabled = !canEditSourceFields || !selectedSourceNode || collections.length === 0;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    onOpenChange(false);
  }, [onOpenChange, selectedSourceNode?.id]);

  function updateOverride(collectionId: string, modeId: string) {
    const next = { ...overrides };
    if (modeId) {
      next[collectionId] = modeId;
    } else {
      delete next[collectionId];
    }
    onSourceAttributeChange(SOURCE_TOKEN_MODE_ATTRIBUTE, serializeTokenModeOverride(next));
  }

  return (
    <span className="wb-inspector-node-settings-root" ref={rootRef}>
      <IconButton
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-pressed={open}
        className={[
          'wb-inspector-node-settings-button',
          open ? 'wb-inspector-node-settings-button--active' : '',
          hasOverrides ? 'wb-inspector-node-settings-button--locked' : '',
        ].filter(Boolean).join(' ')}
        disabled={disabled}
        label={open ? 'Close node settings' : 'Open node settings'}
        onClick={() => onOpenChange(!open)}
      >
        <SlidersHorizontal size={13} aria-hidden="true" />
      </IconButton>
      {open && !disabled ? (
        <div
          className="wb-popover-panel wb-popover-panel--form wb-inspector-node-settings-menu"
          role="dialog"
          aria-label="Node settings"
        >
          <div className="wb-inspector-node-settings-copy">
            <strong>Mode lock</strong>
            <span>Fix token modes for this node subtree.</span>
          </div>
          <div className="wb-inspector-mode-lock-list">
            {collections.map((collection) => {
              const selectedModeId = overrides[collection.id] ?? '';
              const inheritedModeId = selectedModeId ? '' : previewTokenModes[collection.id] ?? '';
              const inheritedMode = inheritedModeId
                ? collection.modes.find((mode) => mode.id === inheritedModeId)
                : null;
              return (
                <label className="wb-inspector-mode-lock-row" key={collection.id}>
                  <span className="wb-inspector-mode-lock-label">
                    <strong>{collection.name}</strong>
                    <small>{inheritedMode ? `Inherited ${inheritedMode.name}` : `${collection.modes.length} modes`}</small>
                  </span>
                  <SelectControl
                    aria-label={`${collection.name} node token mode`}
                    value={selectedModeId}
                    onValueChange={(modeId) => updateOverride(collection.id, modeId)}
                  >
                    <option value="">{inheritedMode ? `Inherit (${inheritedMode.name})` : 'Inherit'}</option>
                    {collection.modes.map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.name}</option>
                    ))}
                  </SelectControl>
                </label>
              );
            })}
          </div>
          <Button
            className="wb-inspector-node-settings-clear"
            disabled={!hasOverrides}
            onClick={() => onSourceAttributeChange(SOURCE_TOKEN_MODE_ATTRIBUTE, null)}
          >
            Clear mode lock
          </Button>
        </div>
      ) : null}
    </span>
  );
}

function InspectorContextSection({
  diagnostic,
  model,
  notice,
  selectedLayer,
}: {
  diagnostic: string;
  model: HtmlInspectorModel;
  notice: string;
  selectedLayer: PreviewLayer | null;
}) {
  const sourceSummary = formatContextSource(selectedLayer);
  const statusSummary = formatContextStatus(diagnostic, notice);

  return (
    <WorkbenchInspectorSection title="Context" density="compact" defaultOpen={false}>
      <WorkbenchInspectorField label="Selection" density="compact">
        {selectedLayer ? `${selectedLayer.label} · ${formatPreviewLayerKind(selectedLayer.kind)}` : 'No layer'}
      </WorkbenchInspectorField>
      {selectedLayer ? (
        <WorkbenchInspectorField label="Element" density="compact">
          {`${model.elementName} · ${formatHtmlInspectorCategory(model.category)}`}
        </WorkbenchInspectorField>
      ) : null}
      {sourceSummary ? (
        <WorkbenchInspectorField label="Source" density="compact">
          {sourceSummary}
        </WorkbenchInspectorField>
      ) : null}
      <WorkbenchInspectorField label="Status" variant="notice" density="compact">
        {statusSummary}
      </WorkbenchInspectorField>
    </WorkbenchInspectorSection>
  );
}

function InspectorContentSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  isRuntimeEditTarget,
  model,
  previewTokenModes,
  onSourceAttributeChange,
  onSourceElementTagNameChange,
  onSourceInlineSvgIconChange,
  onSourceTextContentChange,
  onSourceTextI18nBindingChange,
  selectedLayer,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  isRuntimeEditTarget: boolean;
  model: HtmlInspectorModel;
  previewTokenModes: PreviewTokenModeSelection;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  onSourceElementTagNameChange: (tagName: SourceElementTagName) => void;
  onSourceInlineSvgIconChange: (source: string, iconName: string | null) => void;
  onSourceTextContentChange: (text: string) => void;
  onSourceTextI18nBindingChange?: (tokenName: string | null) => void;
  selectedLayer: PreviewLayer | null;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const attributes = getSourceAttributes(selectedLayer, selectedSourceNode);
  const visibleFields = isRuntimeEditTarget
    ? fields.filter((field) => field.editKind !== 'source-element-tag')
    : fields;
  const inlineSvgIconSource = getInlineSvgIconAssetSource(selectedSourceNode, attributes);
  const inlineSvgIconName = attributes[SOURCE_ICON_NAME_ATTRIBUTE] ?? inferInlineSvgIconName(inlineSvgIconSource);
  const replaceInlineSvgIconFromAttribute = (
    attributeName: SourceAttributeName,
    source: string,
    iconName: string | null,
  ): boolean => {
    if (inlineSvgIconSource === null || attributeName !== 'src' || !isIconAssetSourceValue(source)) return false;
    onSourceInlineSvgIconChange(source, iconName || inferInlineSvgIconName(source));
    return true;
  };
  const commitSourceAttribute = (attributeName: SourceAttributeName, value: string | null) => {
    if (value && replaceInlineSvgIconFromAttribute(attributeName, value, inferInlineSvgIconName(value))) return;
    if (attributeName === 'src' && value === null) {
      onSourceAttributeChange(SOURCE_ASSET_SOURCE_ATTRIBUTE, null);
      onSourceAttributeChange(SOURCE_ASSET_KIND_ATTRIBUTE, null);
      onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, null);
      onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, null);
    }
    onSourceAttributeChange(attributeName, value);
  };

  return (
    <WorkbenchInspectorSection title="Content" density="compact">
      {canEditSourceFields && inlineSvgIconSource !== null ? (
        <WorkbenchInspectorField label="Icon" density="compact" variant="control">
          <span className="wb-inspector-inline-asset-control">
            <AssetPickerButton
              ariaLabel="Replace inline SVG icon"
              assets={assetRegistry}
              iconScope="all"
              kinds={['icon']}
              selectedPreviewKey={inlineSvgIconName || inlineSvgIconSource || undefined}
              triggerContent={<ImageIcon size={13} aria-hidden="true" />}
              onSelect={(asset) => {
                const source = getDesignAssetUsageValue(asset);
                onSourceInlineSvgIconChange(source, asset.name);
              }}
              onSelectPreview={(preview) => onSourceInlineSvgIconChange(preview.value, preview.key || preview.name)}
            />
            <span className="wb-inspector-inline-asset-control__label">
              {inlineSvgIconName || 'Inline SVG'}
            </span>
          </span>
        </WorkbenchInspectorField>
      ) : null}
      {visibleFields.map((field) => {
        const attributeName = field.attributeName ?? null;
        const fieldValue = formatDescriptorFieldValue(field, model, attributes, selectedSourceNode);
        const assetKinds = getAssetKindsForSourceAttributeField(field, model, attributes, assetRegistry);

        return (
        <WorkbenchInspectorField
          key={field.id}
          label={field.label}
          labelMode={canEditSourceFields && (field.editKind === 'text-content' || attributeName) ? 'hidden' : 'visible'}
          density="compact"
          variant={canEditSourceFields && (field.editKind === 'text-content' || field.editKind === 'source-element-tag' || attributeName) ? 'control' : 'read'}
        >
          {canEditSourceFields && field.editKind === 'source-element-tag' ? (
            <SourceHeadingLevelControl
              ariaLabel="Heading level"
              value={normalizeSourceHeadingLevel(selectedSourceNode?.source?.jsxName)}
              onCommit={onSourceElementTagNameChange}
            />
          ) : canEditSourceFields && field.editKind === 'text-content' ? (
            <SourceTextContentControl
              ariaLabel="Source text content"
              leading={getInspectorFieldLeading(field)}
              tokenized={Boolean(getEffectiveTextBindingKey(selectedSourceNode))}
              trailing={!isRuntimeEditTarget && onSourceTextI18nBindingChange ? (
                <SourceI18nTokenPicker
                  ariaLabel="Bind text to i18n token"
                  modeByCollection={previewTokenModes}
                  registry={tokenRegistry}
                  selectedKey={getEffectiveTextBindingKey(selectedSourceNode)}
                  onClear={() => onSourceTextI18nBindingChange(null)}
                  onSelect={(selection) => onSourceTextI18nBindingChange(selection.key)}
                />
              ) : null}
              value={fieldValue === 'Not set' ? '' : fieldValue}
              onCommit={onSourceTextContentChange}
            />
          ) : canEditSourceFields && attributeName ? (
            <SourceAttributeControl
              ariaLabel={`${field.label} source attribute`}
              leading={getInspectorFieldLeading(field)}
              placeholder={fieldValue === 'Not set' ? undefined : fieldValue}
              trailing={assetKinds ? (
                <AssetPickerButton
                  ariaLabel={`Select ${field.label} asset`}
                  assets={assetRegistry}
                  iconScope={assetKinds.length === 1 && assetKinds[0] === 'icon' ? 'default' : 'all'}
                  kinds={assetKinds}
                  onSelect={(asset) => {
                    const source = getDesignAssetUsageValue(asset);
                    const effectiveKind = getEffectiveDesignAssetKind(asset);
                    if (replaceInlineSvgIconFromAttribute(attributeName, source, asset.name)) return;
                    if (attributeName === 'src') {
                      onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, null);
                      onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, null);
                      onSourceAttributeChange(SOURCE_ASSET_KIND_ATTRIBUTE, effectiveKind);
                    }
                    onSourceAttributeChange(attributeName, source);
                  }}
                  onSelectPreview={(preview, previewKind) => {
                    if (previewKind === 'icon' && replaceInlineSvgIconFromAttribute(attributeName, preview.value, preview.key || preview.name)) return;
                    if (previewKind === 'icon') {
                      onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, 'default');
                      onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, preview.key);
                    } else {
                      onSourceAttributeChange(SOURCE_ICON_SET_ATTRIBUTE, null);
                      onSourceAttributeChange(SOURCE_ICON_NAME_ATTRIBUTE, null);
                    }
                    if (attributeName === 'src') {
                      onSourceAttributeChange(SOURCE_ASSET_KIND_ATTRIBUTE, previewKind);
                    }
                    onSourceAttributeChange(attributeName, preview.value);
                  }}
                />
              ) : null}
              value={attributes[attributeName] ?? ''}
              onCommit={(value) => commitSourceAttribute(attributeName, value)}
            />
          ) : (
            fieldValue
          )}
        </WorkbenchInspectorField>
      );
      })}
    </WorkbenchInspectorSection>
  );
}

function InspectorSvgSourceSection({
  canEditSourceFields,
  onSourceAttributeChange,
  selectedLayer,
  selectedSourceNode,
}: {
  canEditSourceFields: boolean;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  selectedLayer: PreviewLayer | null;
  selectedSourceNode: EditableTreeNode | null;
}) {
  const elementName = selectedSourceNode?.source?.jsxName ?? selectedLayer?.jsxName ?? '';
  if (!isSvgInspectorElementName(elementName)) return null;

  const attributes = getSourceAttributes(selectedLayer, selectedSourceNode);
  const attributeNames = Object.keys(attributes)
    .filter(isEditableSourceAttributeName)
    .sort(compareSvgSourceAttributeNames);

  return (
    <WorkbenchInspectorSection title="SVG source" density="compact">
      <WorkbenchInspectorField label="Element" density="compact" variant="read">
        {`<${elementName}>`}
      </WorkbenchInspectorField>
      <div className="wb-inspector-svg-source-attributes">
        {attributeNames.map((attributeName) => (
          <WorkbenchInspectorField
            key={attributeName}
            label={attributeName}
            density="compact"
            variant={canEditSourceFields ? 'control' : 'read'}
          >
            {canEditSourceFields && isMultilineSvgSourceAttribute(attributeName) ? (
              <SourceTextContentControl
                ariaLabel={`${attributeName} SVG source attribute`}
                value={attributes[attributeName] ?? ''}
                onCommit={(value) => onSourceAttributeChange(attributeName, normalizeSourceAttributeDraft(value))}
              />
            ) : canEditSourceFields ? (
              <SourceAttributeControl
                ariaLabel={`${attributeName} SVG source attribute`}
                value={attributes[attributeName] ?? ''}
                onCommit={(value) => onSourceAttributeChange(attributeName, value)}
              />
            ) : (
              attributes[attributeName]
            )}
          </WorkbenchInspectorField>
        ))}
        {attributeNames.length === 0 ? (
          <WorkbenchInspectorField label="Attributes" density="compact" variant="notice">
            No static source attributes are authored on this element.
          </WorkbenchInspectorField>
        ) : null}
      </div>
    </WorkbenchInspectorSection>
  );
}

const SVG_SOURCE_ATTRIBUTE_PRIORITY = [
  'id',
  'viewBox',
  'preserveAspectRatio',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'width',
  'height',
  'd',
  'fill',
  'fillOpacity',
  'stroke',
  'strokeWidth',
  'strokeOpacity',
  'strokeLinecap',
  'strokeLinejoin',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'offset',
  'stopColor',
  'stopOpacity',
  'className',
] as const;

const SVG_SOURCE_ATTRIBUTE_PRIORITY_INDEX = new Map<string, number>(
  SVG_SOURCE_ATTRIBUTE_PRIORITY.map((attributeName, index) => [attributeName, index]),
);

function compareSvgSourceAttributeNames(left: SourceAttributeName, right: SourceAttributeName): number {
  const leftIndex = SVG_SOURCE_ATTRIBUTE_PRIORITY_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = SVG_SOURCE_ATTRIBUTE_PRIORITY_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER;
  return leftIndex - rightIndex || left.localeCompare(right);
}

function isMultilineSvgSourceAttribute(attributeName: SourceAttributeName): boolean {
  return attributeName === 'd';
}

export function InspectorComponentPropsSection({
  assetRegistry,
  canEditSourceFields,
  componentKey,
  controls,
  defaultArgs,
  onSourceComponentPropChange,
  onSourceComponentPropsChange,
  onSourceComponentTypeChange,
  onSourceNodeComponentPropChange,
  previewTokenModes = {},
  selectedSourceNode,
  sourceDocumentRoot,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  componentKey?: string;
  controls: WorkbenchStoryControl[];
  defaultArgs: WorkbenchStoryArgs;
  onSourceComponentPropChange: (propName: string, value: SourceComponentPropValue, options?: SourceComponentPropChangeOptions) => void;
  onSourceComponentPropsChange: (updates: SourceComponentPropUpdate[], options?: SourceComponentPropChangeOptions) => void;
  onSourceComponentTypeChange: (targetComponentName: string, options: SourceComponentTypeChangeOptions) => void;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  previewTokenModes?: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  sourceDocumentRoot: EditableTreeNode | null;
  tokenRegistry?: TokenRegistry;
}) {
  const [registryEditorOpen, setRegistryEditorOpen] = useState(false);
  const [sectionPropRegistry, setSectionPropRegistry] = useState<WorkbenchPropRegistrySource>(() => createEmptyWorkbenchPropRegistry());
  const [sectionPropRegistryStatus, setSectionPropRegistryStatus] = useState<InspectorPropRegistryStatus>({
    kind: 'idle',
    message: '',
  });
  const [sectionPropRegistryRevision, setSectionPropRegistryRevision] = useState(0);
  const [collapsedComponentPropGroupIds, setCollapsedComponentPropGroupIds] = useState<string[]>([]);
  const propRegistryPath = getWorkbenchPropRegistryPath();
  const registryControls = useMemo(
    () => (componentKey
      ? applyWorkbenchPropRegistry(controls, { name: componentKey })
      : controls),
    [componentKey, controls, sectionPropRegistryRevision],
  );
  const sourceProps = getSimpleWorkbenchStoryArgs(selectedSourceNode?.sourceProps);
  const effectiveDefaultArgs = useMemo(
    () => getProjectDefaultIconStoryArgs(defaultArgs, registryControls, assetRegistry),
    [assetRegistry, defaultArgs, registryControls, sectionPropRegistryRevision],
  );
  const repeaterContext = getRepeaterItemPropsContext(sourceDocumentRoot, selectedSourceNode);
  const [selectedRepeaterItem, setSelectedRepeaterItem] = useState('template');
  const selectedItemIndex = repeaterContext && selectedRepeaterItem !== 'template'
    ? Number(selectedRepeaterItem)
    : null;
  const selectedItemProps = repeaterContext && selectedItemIndex !== null
    ? repeaterContext.itemProps[selectedItemIndex] ?? {}
    : {};
  const allowedSelectedItemProps = repeaterContext
    ? filterRepeaterItemPropsByKeys(selectedItemProps, repeaterContext.itemPropKeys)
    : selectedItemProps;
  const effectiveSourceProps = repeaterContext && selectedItemIndex !== null
    ? { ...sourceProps, ...allowedSelectedItemProps }
    : sourceProps;
  const templateVisibleControls = registryControls.filter((control) => isWorkbenchStoryControlVisible(control, sourceProps, effectiveDefaultArgs));
  const visibleControls = registryControls.filter((control) => (
    (!repeaterContext || selectedItemIndex === null || isRepeaterItemPropAllowed(repeaterContext.itemPropKeys, control.key)) &&
    isWorkbenchStoryControlVisible(control, effectiveSourceProps, effectiveDefaultArgs)
  ));
  const chartTypeConversion = getInspectorChartTypeConversion(selectedSourceNode, effectiveSourceProps);
  const chartSeriesColorBindings = getChartSeriesColorBindings(effectiveSourceProps, effectiveDefaultArgs, visibleControls);
  const chartSeriesColorBindingByKey = new Map(chartSeriesColorBindings.map((binding) => [binding.control.key, binding]));
  const csvVisibilityProps = { ...effectiveDefaultArgs, ...effectiveSourceProps };
  const shouldHideSeparateSeriesCsv = shouldUseCombinedChartCsvControlSet(visibleControls, csvVisibilityProps);
  const csvVisibleControls = shouldHideSeparateSeriesCsv
    ? visibleControls.filter((control) => control.key !== 'seriesCsv')
    : visibleControls;
  const componentVisibleControls = chartSeriesColorBindings.length > 0
    ? [
      ...csvVisibleControls.filter((control) => !isChartSeriesStaticColorControl(control)),
      ...chartSeriesColorBindings.map((binding) => binding.control),
    ]
    : csvVisibleControls;
  const componentPropGroups = getInspectorComponentPropGroups(componentVisibleControls);
  const componentPropGroupScopeId = componentKey ?? selectedSourceNode?.source?.jsxName ?? selectedSourceNode?.id ?? 'component';
  const collapsedComponentPropGroupIdSet = useMemo(
    () => new Set(collapsedComponentPropGroupIds),
    [collapsedComponentPropGroupIds],
  );
  const toggleComponentPropGroup = useCallback((groupId: string) => {
    const stateId = getInspectorComponentPropGroupStateId(componentPropGroupScopeId, groupId);
    setCollapsedComponentPropGroupIds((current) => (
      current.includes(stateId)
        ? current.filter((candidate) => candidate !== stateId)
        : [...current, stateId]
    ));
  }, [componentPropGroupScopeId]);
  const unmanagedProps = useMemo(
    () => getUnmanagedSourceProps(
      selectedSourceNode,
      sourceDocumentRoot && selectedSourceNode ? findEditableTreeNode(sourceDocumentRoot, selectedSourceNode.id) : null,
      registryControls,
    ),
    [selectedSourceNode, sourceDocumentRoot, registryControls],
  );
  const showUnmanagedProps = selectedItemIndex === null && unmanagedProps.length > 0;
  const prototypeWiring = useMemo(
    () => getPrototypeWiringEntries(selectedSourceNode),
    [selectedSourceNode],
  );
  const showPrototypeWiring = selectedItemIndex === null && prototypeWiring.length > 0;

  useEffect(() => {
    if (!registryEditorOpen) return undefined;
    let cancelled = false;
    setSectionPropRegistryStatus({ kind: 'loading', message: 'Loading prop registry...' });
    void loadWorkbenchPropRegistry(propRegistryPath)
      .then((value) => {
        if (cancelled) return;
        const nextRegistry = normalizeWorkbenchPropRegistry(value ?? createEmptyWorkbenchPropRegistry());
        setWorkbenchPropRegistryOverride(nextRegistry);
        setSectionPropRegistry(nextRegistry);
        setSectionPropRegistryRevision((revision) => revision + 1);
        setSectionPropRegistryStatus({
          kind: 'idle',
          message: value ? `Loaded ${propRegistryPath}.` : `Using default registry. Save to create ${propRegistryPath}.`,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setSectionPropRegistryStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : `Failed to load ${propRegistryPath}.`,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [propRegistryPath, registryEditorOpen]);

  useEffect(() => {
    if (!repeaterContext) {
      setSelectedRepeaterItem('template');
      return;
    }
    if (selectedRepeaterItem === 'template') return;
    const selectedIndex = Number(selectedRepeaterItem);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= repeaterContext.count) {
      setSelectedRepeaterItem('template');
    }
  }, [repeaterContext, selectedRepeaterItem]);

  const commitRepeaterItemProp = (propName: string, value: SourceComponentPropValue) => {
    const context = repeaterContext;
    if (!context || selectedItemIndex === null) return;
    const nextItemProps = updateRepeaterItemProps(context.itemProps, selectedItemIndex, propName, value);
    onSourceNodeComponentPropChange(context.parentNode, 'itemProps', nextItemProps);
  };

  const commitRepeaterItemReset = () => {
    const context = repeaterContext;
    if (!context || selectedItemIndex === null) return;
    const nextItemProps = resetRepeaterItemProps(context.itemProps, selectedItemIndex);
    onSourceNodeComponentPropChange(context.parentNode, 'itemProps', nextItemProps);
  };

  const commitRepeaterItemPropKey = (propName: string, allowed: boolean) => {
    const context = repeaterContext;
    if (!context || selectedItemIndex !== null) return;
    const nextPropKeys = updateRepeaterItemPropKeys(
      context.itemPropKeys,
      propName,
      allowed,
      templateVisibleControls.map((control) => control.key),
    );
    onSourceNodeComponentPropChange(context.parentNode, 'itemPropKeys', nextPropKeys);
  };

  const commitChartSeriesColor = (binding: ChartSeriesColorBinding, value: SourceComponentPropValue) => {
    const normalizedValue = typeof value === 'string' ? value : null;
    onSourceComponentPropChange(
      'seriesCsv',
      updateChartSeriesCsvColorValue(binding.seriesCsv, binding, normalizedValue),
    );
  };

  const saveSectionPropRegistry = async (nextRegistry: WorkbenchPropRegistrySource) => {
    const normalized = normalizeWorkbenchPropRegistry(nextRegistry);
    setSectionPropRegistryStatus({ kind: 'saving', message: `Saving ${propRegistryPath}...` });
    try {
      await saveWorkbenchPropRegistry(propRegistryPath, normalized);
      setWorkbenchPropRegistryOverride(normalized);
      setSectionPropRegistry(normalized);
      setSectionPropRegistryRevision((revision) => revision + 1);
      setSectionPropRegistryStatus({ kind: 'success', message: `Saved ${propRegistryPath}.` });
    } catch (error) {
      setSectionPropRegistryStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : `Failed to save ${propRegistryPath}.`,
      });
    }
  };

  const sectionActions = (
    <span className="wb-inspector-props-actions">
      {repeaterContext ? (
        <span className="wb-inspector-repeater-actions">
          <SelectControl
            aria-label="Repeater item props"
            className="wb-inspector-repeater-item-select"
            value={selectedRepeaterItem}
            onValueChange={setSelectedRepeaterItem}
          >
            <option value="template">Template</option>
            {Array.from({ length: repeaterContext.count }, (_, index) => (
              <option key={index} value={String(index)}>Item {index + 1}</option>
            ))}
          </SelectControl>
          {selectedItemIndex !== null ? (
            <IconButton
              className="wb-inspector-repeater-reset-button"
              disabled={Object.keys(selectedItemProps).length === 0}
              label={`Reset item ${selectedItemIndex + 1} props`}
              onClick={commitRepeaterItemReset}
            >
              <RotateCcw size={12} aria-hidden="true" />
            </IconButton>
          ) : null}
        </span>
      ) : null}
      {componentKey ? (
        <IconButton
          className="wb-inspector-section-action-button"
          label="Edit prop registry"
          onClick={() => setRegistryEditorOpen(true)}
        >
          <SlidersHorizontal size={12} aria-hidden="true" />
        </IconButton>
      ) : null}
    </span>
  );

  return (
    <WorkbenchInspectorSection
      title="Props"
      density="compact"
      actions={repeaterContext || componentKey ? sectionActions : null}
    >
      {registryEditorOpen && componentKey ? (
        <ModalLayer
          className="wb-prop-registry-modal"
          title="Prop registry"
          onClose={() => setRegistryEditorOpen(false)}
        >
          <InspectorPropRegistryModalEditor
            componentKey={componentKey}
            controls={registryControls}
            registry={sectionPropRegistry}
            status={sectionPropRegistryStatus}
            onSave={(nextRegistry) => void saveSectionPropRegistry(nextRegistry)}
          />
        </ModalLayer>
      ) : null}
      {selectedSourceNode?.sourceValueMetadata?.propSpreads?.map((source, index) => (
        <WorkbenchInspectorField
          key={`prop-spread-${index}`}
          label={index === 0 ? 'Spread props' : `Spread props ${index + 1}`}
          labelMode="visible"
          density="compact"
          variant="read"
        >
          <SourceValueMetadataControl
            ariaLabel={`Spread props ${index + 1}`}
            source={source}
          />
        </WorkbenchInspectorField>
      ))}
      {chartTypeConversion ? (
        <WorkbenchInspectorField label="Chart type">
          <SelectControl
            aria-label="Convert chart type"
            className="wb-inspector-source-select"
            disabled={!canEditSourceFields}
            value={chartTypeConversion.currentName}
            onValueChange={(nextComponentName) => {
              if (nextComponentName === chartTypeConversion.currentName) return;
              const option = chartTypeConversion.options.find((candidate) => candidate.name === nextComponentName);
              if (!option) return;
              onSourceComponentTypeChange(option.name, {
                allowedPropNames: option.allowedPropNames,
                fallbackProps: option.fallbackProps,
                importSource: chartTypeConversion.importSource,
                managedPropNames: chartTypeConversion.managedPropNames,
                propOverrides: option.propOverrides,
              });
            }}
          >
            {chartTypeConversion.options.map((option) => (
              <option key={option.name} value={option.name}>{option.label}</option>
            ))}
          </SelectControl>
        </WorkbenchInspectorField>
      ) : null}
      {componentPropGroups.map((group) => {
        const groupStateId = getInspectorComponentPropGroupStateId(componentPropGroupScopeId, group.id);
        const groupBodyId = `wb-inspector-component-props-${sanitizeInspectorDomId(groupStateId)}`;
        const groupCollapsed = Boolean(group.label && collapsedComponentPropGroupIdSet.has(groupStateId));
        return (
          <div
            key={group.id}
            className={group.label ? 'wb-inspector-prop-group wb-inspector-prop-group--labeled' : 'wb-inspector-prop-group'}
            data-collapsed={groupCollapsed ? 'true' : undefined}
          >
            {group.label ? (
              <button
                type="button"
                className="wb-inspector-prop-group-toggle"
                aria-controls={groupBodyId}
                aria-expanded={!groupCollapsed}
                onClick={() => toggleComponentPropGroup(group.id)}
              >
                <ChevronRight className="wb-inspector-prop-group-toggle-icon" size={12} aria-hidden="true" />
                <span className="wb-inspector-prop-group-title">{group.label}</span>
              </button>
            ) : null}
            {groupCollapsed ? null : (
              <div id={group.label ? groupBodyId : undefined} className="wb-inspector-prop-group-body">
                {group.controls.map((control) => {
                  const chartSeriesColorBinding = chartSeriesColorBindingByKey.get(control.key) ?? null;
                  const value = chartSeriesColorBinding
                    ? chartSeriesColorBinding.value
                    : getInspectorSourceComponentControlValue(control, effectiveSourceProps, effectiveDefaultArgs);
                  const controlLabel = isPopoverAnchorIdControl(control, selectedSourceNode) ? 'Trigger' : control.label;
                  // Checked on render, not on commit, so a value that arrived
                  // from hand-edited source or an MCP write is reported too.
                  const contractViolation = findWorkbenchStoryControlViolation(control, value);
                  const hasItemOverride = Object.prototype.hasOwnProperty.call(selectedItemProps, control.key);
                  const valueSource = selectedItemIndex === null
                    ? selectedSourceNode?.sourceValueMetadata?.props?.[control.key] ?? null
                    : null;
                  return (
                    <WorkbenchInspectorField
                      key={control.key}
                      description={control.description}
                      label={repeaterContext && selectedItemIndex === null ? (
                        <span className="wb-inspector-repeater-prop-label">
                          <input
                            aria-label={`Allow ${control.label} item prop`}
                            checked={isRepeaterItemPropAllowed(repeaterContext.itemPropKeys, control.key)}
                            disabled={!canEditSourceFields}
                            type="checkbox"
                            onChange={(event) => commitRepeaterItemPropKey(control.key, event.target.checked)}
                          />
                          <span>{controlLabel}</span>
                        </span>
                      ) : controlLabel}
                      labelMode="visible"
                      density="compact"
                      variant={canEditSourceFields ? 'control' : 'read'}
                    >
                      {canEditSourceFields ? (
                        <span className="wb-inspector-repeater-prop-control">
                          <ComponentPropControl
                            assetRegistry={assetRegistry}
                            control={control}
                            defaultArgs={effectiveDefaultArgs}
                            previewTokenModes={previewTokenModes}
                            preserveEmptyText={shouldPreserveEmptyComponentProp(control, selectedSourceNode) || shouldPreserveEmptyDefaultTextProp(control, effectiveDefaultArgs)}
                            selectedSourceNode={selectedSourceNode}
                            sourceProps={effectiveSourceProps}
                            sourceDocumentRoot={sourceDocumentRoot}
                            tokenRegistry={selectedItemIndex === null ? tokenRegistry : undefined}
                            value={value}
                            valueSource={valueSource}
                            onCommit={(nextValue) => {
                              if (chartSeriesColorBinding) {
                                commitChartSeriesColor(chartSeriesColorBinding, nextValue);
                                return;
                              }
                              if (selectedItemIndex !== null) {
                                commitRepeaterItemProp(control.key, nextValue);
                                return;
                              }
                              onSourceComponentPropChange(control.key, nextValue);
                            }}
                            onCommitBatchComponentProps={(updates) => {
                              if (selectedItemIndex !== null) {
                                for (const update of updates) commitRepeaterItemProp(update.propName, update.value);
                                return;
                              }
                              onSourceComponentPropsChange(updates);
                            }}
                            onCommitSiblingComponentProp={(propName, nextValue) => {
                              if (selectedItemIndex !== null) {
                                commitRepeaterItemProp(propName, nextValue);
                                return;
                              }
                              onSourceComponentPropChange(propName, nextValue);
                            }}
                            onCommitTokenBinding={(reference, resolvedValue) => {
                              if (chartSeriesColorBinding) {
                                commitChartSeriesColor(chartSeriesColorBinding, resolvedValue);
                                return;
                              }
                              if (selectedItemIndex !== null) return;
                              const tokenOnly = shouldStoreComponentPropTokenOnly(control, selectedSourceNode);
                              const updates: SourceComponentPropUpdate[] = [
                                {
                                  propName: getComponentPropTokenKey(control.key),
                                  value: reference?.tokenId ?? null,
                                },
                                {
                                  propName: getComponentPropTokenCollectionKey(control.key),
                                  value: reference?.collectionId ?? null,
                                },
                              ];
                              if (tokenOnly) {
                                if (reference) {
                                  updates.push({
                                    propName: control.key,
                                    value: null,
                                  });
                                }
                                onSourceComponentPropsChange(updates);
                                return;
                              }
                              if (reference && resolvedValue !== null) {
                                updates.push({
                                  propName: control.key,
                                  value: resolvedValue,
                                });
                              }
                              onSourceComponentPropsChange(updates);
                            }}
                            onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
                          />
                          {selectedItemIndex !== null && hasItemOverride ? (
                            <IconButton
                              className="wb-inspector-repeater-reset-button"
                              label={`Reset ${control.label} item prop`}
                              onClick={() => commitRepeaterItemProp(control.key, null)}
                            >
                              <X size={12} aria-hidden="true" />
                            </IconButton>
                          ) : null}
                        </span>
                      ) : (
                        formatComponentPropValue(value)
                      )}
                      {contractViolation ? (
                        <span className="wb-inspector-prop-contract-warning" role="status">
                          {contractViolation}
                        </span>
                      ) : null}
                    </WorkbenchInspectorField>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {showPrototypeWiring ? (
        <div className="wb-inspector-unmanaged-props wb-inspector-prototype-wiring">
          <div className="wb-inspector-unmanaged-props-title">Prototype</div>
          <div className="wb-inspector-unmanaged-props-list">
            {prototypeWiring.map(({ key, label, value }) => (
              <span
                key={key}
                className="wb-inspector-unmanaged-prop-chip"
                title={`${label}: ${value}`}
              >
                <span className="wb-inspector-unmanaged-prop-name">{label}</span>
                <code className="wb-inspector-unmanaged-prop-value">{value}</code>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {showUnmanagedProps ? (
        <div className="wb-inspector-unmanaged-props">
          <div className="wb-inspector-unmanaged-props-title">Unmanaged props</div>
          <div className="wb-inspector-unmanaged-props-list">
            {unmanagedProps.map(({ key, literal, source, removable, removeTarget }) => {
              const valueText = formatUnmanagedPropDisplay(literal, source);
              return (
                <span
                  key={key}
                  className="wb-inspector-unmanaged-prop-chip"
                  title={valueText ? `${key}=${valueText}` : key}
                >
                  <span className="wb-inspector-unmanaged-prop-name">{key}</span>
                  {valueText ? (
                    <code className="wb-inspector-unmanaged-prop-value">{valueText}</code>
                  ) : null}
                  {canEditSourceFields && removable ? (
                    <IconButton
                      className="wb-inspector-unmanaged-prop-remove"
                      label={`Remove ${key} prop`}
                      onClick={() => onSourceComponentPropChange(key, null, { target: removeTarget })}
                    >
                      <X size={10} aria-hidden="true" />
                    </IconButton>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </WorkbenchInspectorSection>
  );
}

type InspectorPropRegistryStatus = { kind: 'idle' | 'loading' | 'saving' | 'success' | 'error'; message: string };
type InspectorPropRegistryDraftRow = {
  assetKinds: string;
  groupId: string;
  groupLabel: string;
  groupOrder: string;
  key: string;
  label: string;
  order: string;
  picker: WorkbenchStoryControlPicker;
  pickerEditable: boolean;
  tokenTypes: string;
};

type InspectorPropRegistryModalDraft = {
  extraGroups: Array<{ id: string; label: string; order: string }>;
  rows: InspectorPropRegistryDraftRow[];
};

type InspectorPropRegistryModalHistory = {
  future: InspectorPropRegistryModalDraft[];
  past: InspectorPropRegistryModalDraft[];
};

const INSPECTOR_PROP_REGISTRY_PICKERS: WorkbenchStoryControlPicker[] = ['auto', 'none', 'token', 'asset', 'asset-token'];
const INSPECTOR_PROP_REGISTRY_HISTORY_LIMIT = 50;

function InspectorPropRegistryEditor({
  componentKey,
  controls,
  onSave,
  registry,
  status,
}: {
  componentKey: string;
  controls: WorkbenchStoryControl[];
  onSave: (registry: WorkbenchPropRegistrySource) => void;
  registry: WorkbenchPropRegistrySource;
  status: InspectorPropRegistryStatus;
}) {
  const [draftRows, setDraftRows] = useState<InspectorPropRegistryDraftRow[]>(() => (
    getInspectorPropRegistryDraftRows(controls, registry, componentKey)
  ));
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setDraftRows(getInspectorPropRegistryDraftRows(controls, registry, componentKey));
  }, [componentKey, controls, registry]);

  if (!componentKey || controls.length === 0) {
    return <div className="wb-storybook-empty">Select a component instance to edit its prop registry.</div>;
  }

  const query = searchValue.trim().toLowerCase();
  const filteredRows = query
    ? draftRows.filter((row) => `${row.key} ${row.label} ${row.groupId} ${row.groupLabel}`.toLowerCase().includes(query))
    : draftRows;
  const saving = status.kind === 'saving' || status.kind === 'loading';

  function updateRow(key: string, patch: Partial<InspectorPropRegistryDraftRow>) {
    setDraftRows((current) => current.map((row) => (
      row.key === key ? { ...row, ...patch } : row
    )));
  }

  return (
    <div className="wb-prop-registry-editor">
      <div className="wb-storybook-docs-summary">
        <strong>{componentKey} prop registry</strong>
        <span>These overrides are shared by Storybook and the Design editor.</span>
      </div>
      <div className="wb-prop-registry-toolbar">
        <SearchField
          aria-label="Search design registry props"
          className="wb-prop-registry-search"
          placeholder="Search props"
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <Button
          tone="primary"
          disabled={saving}
          onClick={() => onSave(buildInspectorPropRegistryFromDraftRows(registry, componentKey, draftRows))}
        >
          Save
        </Button>
      </div>
      {status.message ? (
        <div className={`wb-prop-registry-status wb-prop-registry-status--${status.kind}`}>
          {status.message}
        </div>
      ) : null}
      <div className="wb-prop-registry-list" aria-label="Design prop registry rows">
        {filteredRows.map((row) => (
          <div key={row.key} className="wb-prop-registry-row">
            <div className="wb-prop-registry-row-head">
              <strong>{row.key}</strong>
              <span>{formatInspectorPropControlType(controls.find((control) => control.key === row.key))}</span>
            </div>
            <label className="wb-prop-registry-field wb-prop-registry-field--label">
              <span>Prop name</span>
              <TextField
                aria-label={`${row.key} design registry prop name`}
                value={row.label}
                onValueChange={(label) => updateRow(row.key, { label })}
              />
            </label>
            <label className="wb-prop-registry-field wb-prop-registry-field--order">
              <span>Order</span>
              <TextField
                aria-label={`${row.key} design registry order`}
                inputMode="numeric"
                value={row.order}
                onValueChange={(order) => updateRow(row.key, { order })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Picker</span>
              <SelectControl<WorkbenchStoryControlPicker>
                aria-label={`${row.key} design registry picker`}
                disabled={!row.pickerEditable}
                value={row.pickerEditable ? row.picker : 'none'}
                onValueChange={(picker) => updateRow(row.key, { picker })}
              >
                {INSPECTOR_PROP_REGISTRY_PICKERS.map((picker) => (
                  <option key={picker} value={picker}>{picker}</option>
                ))}
              </SelectControl>
            </label>
            <label className="wb-prop-registry-field">
              <span>Group</span>
              <TextField
                aria-label={`${row.key} design registry group`}
                value={row.groupId}
                onValueChange={(groupId) => updateRow(row.key, { groupId })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Group label</span>
              <TextField
                aria-label={`${row.key} design registry group label`}
                value={row.groupLabel}
                onValueChange={(groupLabel) => updateRow(row.key, { groupLabel })}
              />
            </label>
            <label className="wb-prop-registry-field wb-prop-registry-field--order">
              <span>Group order</span>
              <TextField
                aria-label={`${row.key} design registry group order`}
                inputMode="numeric"
                value={row.groupOrder}
                onValueChange={(groupOrder) => updateRow(row.key, { groupOrder })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Token types</span>
              <TextField
                aria-label={`${row.key} design registry token types`}
                value={row.tokenTypes}
                onValueChange={(tokenTypes) => updateRow(row.key, { tokenTypes })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Asset kinds</span>
              <TextField
                aria-label={`${row.key} design registry asset kinds`}
                value={row.assetKinds}
                onValueChange={(assetKinds) => updateRow(row.key, { assetKinds })}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectorPropRegistryModalEditor({
  componentKey,
  controls,
  onSave,
  registry,
  status,
}: {
  componentKey: string;
  controls: WorkbenchStoryControl[];
  onSave: (registry: WorkbenchPropRegistrySource) => void;
  registry: WorkbenchPropRegistrySource;
  status: InspectorPropRegistryStatus;
}) {
  const initialDraft = useMemo<InspectorPropRegistryModalDraft>(() => ({
    extraGroups: [],
    rows: getInspectorPropRegistryDraftRows(controls, registry, componentKey),
  }), [componentKey, controls, registry]);
  const [draft, setDraft] = useState<InspectorPropRegistryModalDraft>(initialDraft);
  const draftRef = useRef<InspectorPropRegistryModalDraft>(initialDraft);
  const [history, setHistory] = useState<InspectorPropRegistryModalHistory>({ future: [], past: [] });
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  useEffect(() => {
    const nextDraft = cloneInspectorPropRegistryModalDraft(initialDraft);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    setHistory({ future: [], past: [] });
    setDraggedKey(null);
  }, [initialDraft]);

  const groups = getInspectorPropRegistryModalGroups(draft.rows, draft.extraGroups);
  const saving = status.kind === 'saving' || status.kind === 'loading';
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  function commitDraft(update: (current: InspectorPropRegistryModalDraft) => InspectorPropRegistryModalDraft) {
    const current = draftRef.current;
    const next = normalizeInspectorPropRegistryModalDraft(update(cloneInspectorPropRegistryModalDraft(current)));
    if (areInspectorPropRegistryModalDraftsEqual(current, next)) return;
    draftRef.current = next;
    setDraft(next);
    setHistory((previous) => ({
      past: [
        ...previous.past.slice(-(INSPECTOR_PROP_REGISTRY_HISTORY_LIMIT - 1)),
        cloneInspectorPropRegistryModalDraft(current),
      ],
      future: [],
    }));
  }

  function applyDraftFromHistory(nextDraft: InspectorPropRegistryModalDraft) {
    const normalized = normalizeInspectorPropRegistryModalDraft(cloneInspectorPropRegistryModalDraft(nextDraft));
    draftRef.current = normalized;
    setDraft(normalized);
  }

  function undoDraft() {
    const previousDraft = history.past[history.past.length - 1];
    if (!previousDraft) return;
    const current = cloneInspectorPropRegistryModalDraft(draftRef.current);
    applyDraftFromHistory(previousDraft);
    setHistory({
      past: history.past.slice(0, -1),
      future: [current, ...history.future].slice(0, INSPECTOR_PROP_REGISTRY_HISTORY_LIMIT),
    });
  }

  function redoDraft() {
    const nextDraft = history.future[0];
    if (!nextDraft) return;
    const current = cloneInspectorPropRegistryModalDraft(draftRef.current);
    applyDraftFromHistory(nextDraft);
    setHistory({
      past: [
        ...history.past.slice(-(INSPECTOR_PROP_REGISTRY_HISTORY_LIMIT - 1)),
        current,
      ],
      future: history.future.slice(1),
    });
  }

  function handleModalKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return;
    const isModifierPressed = event.metaKey || event.ctrlKey;
    if (!isModifierPressed || event.altKey) return;
    const key = event.key.toLowerCase();
    const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
    const wantsUndo = key === 'z' && !event.shiftKey;
    if (wantsRedo && canRedo) {
      event.preventDefault();
      event.stopPropagation();
      redoDraft();
      return;
    }
    if (wantsUndo && canUndo) {
      event.preventDefault();
      event.stopPropagation();
      undoDraft();
    }
  }

  function updateRow(key: string, patch: Partial<InspectorPropRegistryDraftRow>) {
    commitDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (
        row.key === key ? { ...row, ...patch } : row
      )),
    }));
  }

  function addGroup() {
    const label = newGroupLabel.trim();
    if (!label) return;
    const groupId = label
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || `group-${groups.length + 1}`;
    setNewGroupLabel('');
    if (groups.some((group) => group.id === groupId)) return;
    commitDraft((current) => current.extraGroups.some((group) => group.id === groupId)
      ? current
      : {
        ...current,
        extraGroups: [
          ...current.extraGroups,
          { id: groupId, label, order: String((groups.length + 1) * 10) },
        ],
      });
  }

  function getGroupDropPatch(groupId: string): Pick<InspectorPropRegistryDraftRow, 'groupId' | 'groupLabel' | 'groupOrder'> {
    const group = groups.find((candidate) => candidate.id === groupId);
    return {
      groupId,
      groupLabel: group?.label ?? formatInspectorPropRegistryGroupLabel(groupId),
      groupOrder: group?.order ?? '',
    };
  }

  function dropRow(targetKey: string) {
    if (!draggedKey || draggedKey === targetKey) return;
    commitDraft((current) => {
      const sourceIndex = current.rows.findIndex((row) => row.key === draggedKey);
      const targetIndex = current.rows.findIndex((row) => row.key === targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const targetRow = current.rows[targetIndex];
      if (!targetRow) return current;
      const next = [...current.rows];
      const [moved] = next.splice(sourceIndex, 1);
      if (!moved) return current;
      const patchedMoved = { ...moved, ...getGroupDropPatch(targetRow.groupId) };
      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjustedTargetIndex, 0, patchedMoved);
      return { ...current, rows: next };
    });
    setDraggedKey(null);
  }

  function dropRowIntoGroup(groupId: string) {
    if (!draggedKey) return;
    commitDraft((current) => {
      const sourceIndex = current.rows.findIndex((row) => row.key === draggedKey);
      if (sourceIndex < 0) return current;
      const next = [...current.rows];
      const [moved] = next.splice(sourceIndex, 1);
      if (!moved) return current;
      const patchedMoved = { ...moved, ...getGroupDropPatch(groupId) };
      let insertIndex = next.length;
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index]?.groupId === groupId) {
          insertIndex = index + 1;
          break;
        }
      }
      next.splice(insertIndex, 0, patchedMoved);
      return { ...current, rows: next };
    });
    setDraggedKey(null);
  }

  return (
      <div className="wb-prop-registry-modal-editor" onKeyDown={handleModalKeyDown}>
        <p className="wb-modal-copy">
        {componentKey} props. Drag rows to reorder or drop them into another group. Only text props can use token or asset pickers.
      </p>
      <div className="wb-prop-registry-modal-toolbar">
        <TextField
          aria-label="New prop group label"
          placeholder="New group"
          value={newGroupLabel}
          onValueChange={setNewGroupLabel}
        />
        <Button onClick={addGroup}>Add group</Button>
        <span className="wb-prop-registry-history-actions">
          <IconButton label="Undo prop registry edit" title="Undo" disabled={!canUndo} onClick={undoDraft}>
            <Undo2 size={13} aria-hidden="true" />
          </IconButton>
          <IconButton label="Redo prop registry edit" title="Redo" disabled={!canRedo} onClick={redoDraft}>
            <Redo2 size={13} aria-hidden="true" />
          </IconButton>
        </span>
        <Button tone="primary" disabled={saving} onClick={() => onSave(buildInspectorPropRegistryFromDraftRows(registry, componentKey, draft.rows))}>
          Save
        </Button>
      </div>
      {status.message ? (
        <div className={`wb-prop-registry-status wb-prop-registry-status--${status.kind}`}>
          {status.message}
        </div>
      ) : null}
      <div className="wb-prop-registry-modal-list" aria-label="Prop registry reorder list">
        {groups.map((group) => (
          <section
            key={group.id}
            className="wb-prop-registry-modal-group"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropRowIntoGroup(group.id)}
          >
            <div className="wb-prop-registry-modal-group-head">
              <TextField
                aria-label={`${group.id} group label`}
                value={group.label}
                onValueChange={(label) => {
                  commitDraft((current) => ({
                    extraGroups: current.extraGroups.map((item) => (
                      item.id === group.id ? { ...item, label } : item
                    )),
                    rows: current.rows.map((row) => (
                      row.groupId === group.id ? { ...row, groupLabel: label } : row
                    )),
                  }));
                }}
              />
            </div>
            {group.rows.map((row) => (
              <div
                key={row.key}
                className="wb-prop-registry-modal-row"
                draggable
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedKey(row.key)}
                onDragEnd={() => setDraggedKey(null)}
                onDrop={(event) => {
                  event.stopPropagation();
                  dropRow(row.key);
                }}
              >
                <span className="wb-prop-registry-drag-handle" aria-hidden="true">::</span>
                <TextField
                  aria-label={`${row.key} modal prop name`}
                  value={row.label}
                  onValueChange={(label) => updateRow(row.key, { label })}
                />
                <SelectControl<WorkbenchStoryControlPicker>
                  aria-label={`${row.key} modal picker`}
                  disabled={!row.pickerEditable}
                  title={row.pickerEditable ? undefined : 'Only text props can use token or asset pickers.'}
                  value={row.pickerEditable ? row.picker : 'none'}
                  onValueChange={(picker) => updateRow(row.key, { picker })}
                >
                  {INSPECTOR_PROP_REGISTRY_PICKERS.map((picker) => (
                    <option key={picker} value={picker}>{picker}</option>
                  ))}
                </SelectControl>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function getInspectorPropRegistryModalGroups(
  rows: InspectorPropRegistryDraftRow[],
  extraGroups: Array<{ id: string; label: string; order: string }>,
): Array<{
  id: string;
  label: string;
  order: string;
  rows: InspectorPropRegistryDraftRow[];
}> {
  const groups: Array<{ id: string; label: string; order: string; rows: InspectorPropRegistryDraftRow[] }> = [];
  for (const group of extraGroups) {
    groups.push({ ...group, rows: [] });
  }
  for (const row of rows) {
    const existing = groups.find((group) => group.id === row.groupId);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    groups.push({
      id: row.groupId,
      label: row.groupLabel || formatInspectorPropRegistryGroupLabel(row.groupId),
      order: row.groupOrder,
      rows: [row],
    });
  }
  return groups;
}

function cloneInspectorPropRegistryModalDraft(draft: InspectorPropRegistryModalDraft): InspectorPropRegistryModalDraft {
  return {
    extraGroups: draft.extraGroups.map((group) => ({ ...group })),
    rows: draft.rows.map((row) => ({ ...row })),
  };
}

function normalizeInspectorPropRegistryModalDraft(draft: InspectorPropRegistryModalDraft): InspectorPropRegistryModalDraft {
  return {
    extraGroups: draft.extraGroups.map((group) => ({
      id: group.id,
      label: group.label,
      order: group.order,
    })),
    rows: normalizeInspectorPropRegistryRowOrders(draft.rows),
  };
}

function areInspectorPropRegistryModalDraftsEqual(
  left: InspectorPropRegistryModalDraft,
  right: InspectorPropRegistryModalDraft,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeInspectorPropRegistryRowOrders(rows: InspectorPropRegistryDraftRow[]): InspectorPropRegistryDraftRow[] {
  return rows.map((row, index) => ({
    ...row,
    order: String((index + 1) * 10),
  }));
}

function getInspectorPropRegistryComponentContext(
  story: WorkbenchStory | null | undefined,
  node: EditableTreeNode | null,
): { componentId?: string; name: string; sourceFile?: string } | null {
  const name = node?.source?.jsxName ?? story?.sourceInsert?.componentName ?? story?.componentId ?? null;
  if (!name) return null;
  return {
    componentId: story?.componentId,
    name,
    sourceFile: node?.source?.sourceFile ?? story?.sourceInsert?.sourceFile,
  };
}

function getInspectorPropRegistryDraftRows(
  controls: WorkbenchStoryControl[],
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
): InspectorPropRegistryDraftRow[] {
  if (!componentKey) return [];
  const componentConfig = getInspectorPropRegistryComponentConfig(registry, componentKey);
  const componentGroups = isRecord(componentConfig.groups) ? componentConfig.groups : {};
  return controls.map((control) => {
    const propConfig = getInspectorPropRegistryPropConfig(componentConfig, control.key);
    const groupId = getInspectorTrimmedString(propConfig?.group) ?? control.groupId ?? 'other';
    const groupConfig = getInspectorPropRegistryGroupConfig(componentGroups, groupId);
    return {
      assetKinds: formatInspectorRegistryCsv(propConfig?.assetKinds ?? control.assetKinds),
      groupId,
      groupLabel: getInspectorTrimmedString(propConfig?.groupLabel) ??
        getInspectorTrimmedString(groupConfig?.label) ??
        control.groupLabel ??
        formatInspectorPropRegistryGroupLabel(groupId),
      groupOrder: formatInspectorRegistryNumber(propConfig?.groupOrder ?? groupConfig?.order ?? control.groupOrder),
      key: control.key,
      label: getInspectorTrimmedString(propConfig?.label) ?? control.label,
      order: formatInspectorRegistryNumber(propConfig?.order ?? control.order),
      picker: canInspectorPropRegistryEditPicker(control)
        ? normalizeInspectorPropRegistryPicker(propConfig?.picker ?? control.picker)
        : 'none',
      pickerEditable: canInspectorPropRegistryEditPicker(control),
      tokenTypes: formatInspectorRegistryCsv(propConfig?.tokenTypes ?? control.tokenTypes),
    };
  });
}

function buildInspectorPropRegistryFromDraftRows(
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
  rows: InspectorPropRegistryDraftRow[],
): WorkbenchPropRegistrySource {
  const nextRegistry = normalizeWorkbenchPropRegistry(JSON.parse(JSON.stringify(registry)));
  const components = isRecord(nextRegistry.components) ? { ...nextRegistry.components } : {};
  const previousComponentConfig = getInspectorPropRegistryComponentConfig(nextRegistry, componentKey);
  const componentGroups = isRecord(previousComponentConfig.groups) ? { ...previousComponentConfig.groups } : {};
  const props = isRecord(previousComponentConfig.props) ? { ...previousComponentConfig.props } : {};

  for (const row of rows) {
    const groupId = row.groupId.trim() || 'other';
    const groupOrder = parseInspectorRegistryNumber(row.groupOrder);
    const previousGroup = componentGroups[groupId];
    componentGroups[groupId] = {
      ...(isRecord(previousGroup) ? previousGroup : {}),
      label: row.groupLabel.trim() || formatInspectorPropRegistryGroupLabel(groupId),
      ...(groupOrder !== null ? { order: groupOrder } : {}),
    };

    const order = parseInspectorRegistryNumber(row.order);
    const tokenTypes = parseInspectorRegistryCsv(row.tokenTypes);
    const assetKinds = parseInspectorRegistryCsv(row.assetKinds);
    const previousProp = props[row.key];
    const {
      assetKinds: _previousAssetKinds,
      picker: _previousPicker,
      tokenTypes: _previousTokenTypes,
      ...previousPropBase
    } = isRecord(previousProp) ? previousProp : {};
    props[row.key] = {
      ...previousPropBase,
      group: groupId,
      label: row.label.trim() || row.key,
      ...(order !== null ? { order } : {}),
      picker: row.pickerEditable ? row.picker : 'none',
      ...(row.pickerEditable && tokenTypes.length > 0 ? { tokenTypes } : {}),
      ...(row.pickerEditable && assetKinds.length > 0 ? { assetKinds } : {}),
    };
  }

  components[componentKey] = {
    ...(isRecord(previousComponentConfig) ? previousComponentConfig : {}),
    groups: componentGroups,
    props,
  };
  return {
    schemaVersion: 1,
    groups: isRecord(nextRegistry.groups) ? nextRegistry.groups : {},
    components,
  };
}

function getInspectorPropRegistryComponentConfig(
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
): WorkbenchPropRegistryComponentConfig {
  const components = isRecord(registry.components) ? registry.components : {};
  for (const [key, value] of Object.entries(components)) {
    if (normalizeInspectorPropRegistryKey(key) === normalizeInspectorPropRegistryKey(componentKey) && isRecord(value)) {
      return value;
    }
  }
  return {};
}

function getInspectorPropRegistryPropConfig(
  componentConfig: WorkbenchPropRegistryComponentConfig,
  propKey: string,
): WorkbenchPropRegistryPropConfig | null {
  const props = isRecord(componentConfig.props) ? componentConfig.props : {};
  for (const [key, value] of Object.entries(props)) {
    if (normalizeInspectorPropRegistryKey(key) === normalizeInspectorPropRegistryKey(propKey) && isRecord(value)) {
      return value;
    }
  }
  return null;
}

function getInspectorPropRegistryGroupConfig(groups: Record<string, unknown>, groupId: string): WorkbenchPropRegistryGroupConfig | null {
  for (const [key, value] of Object.entries(groups)) {
    if (normalizeInspectorPropRegistryKey(key) === normalizeInspectorPropRegistryKey(groupId) && isRecord(value)) {
      return value;
    }
  }
  return null;
}

function normalizeInspectorPropRegistryPicker(value: unknown): WorkbenchStoryControlPicker {
  return value === 'asset' || value === 'asset-token' || value === 'none' || value === 'token'
    ? value
    : 'auto';
}

function canInspectorPropRegistryEditPicker(control: WorkbenchStoryControl): boolean {
  return control.type === 'text' || control.type === 'icon';
}

function formatInspectorRegistryCsv(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').join(', ')
    : '';
}

function parseInspectorRegistryCsv(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function formatInspectorRegistryNumber(value: unknown): string {
  const number = getInspectorFiniteNumber(value);
  return number === null ? '' : String(number);
}

function getInspectorTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getInspectorFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseInspectorRegistryNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInspectorPropRegistryKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function formatInspectorPropRegistryGroupLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Other';
}

function formatInspectorPropControlType(control: WorkbenchStoryControl | undefined): string {
  if (!control) return 'prop';
  if (control.type === 'select') return 'select';
  if (control.type === 'boolean') return 'boolean';
  if (control.type === 'icon') return 'icon';
  if (control.type === 'number') return 'number';
  return 'text';
}

type InspectorComponentPropGroup = {
  controls: WorkbenchStoryControl[];
  id: string;
  label: string | null;
};

function getInspectorComponentPropGroups(controls: WorkbenchStoryControl[]): InspectorComponentPropGroup[] {
  const hasLabeledGroups = controls.some((control) => control.groupId || control.groupLabel);
  if (!hasLabeledGroups) return [{ controls, id: 'props', label: null }];

  const groups: InspectorComponentPropGroup[] = [];
  const groupById = new Map<string, InspectorComponentPropGroup>();
  for (const control of controls) {
    const id = control.groupId || 'other';
    const existing = groupById.get(id);
    if (existing) {
      existing.controls.push(control);
      continue;
    }
    const group = {
      controls: [control],
      id,
      label: control.groupLabel ?? formatInspectorComponentPropGroupLabel(id),
    };
    groupById.set(id, group);
    groups.push(group);
  }
  return groups;
}

function formatInspectorComponentPropGroupLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Other';
}

function getInspectorComponentPropGroupStateId(scopeId: string, groupId: string): string {
  return `${scopeId}:${groupId}`;
}

function sanitizeInspectorDomId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'props';
}

type RepeaterItemPropsContext = {
  count: number;
  itemPropKeys: EditableTreeSourcePropStringArray | null;
  itemProps: EditableTreeSourcePropArray;
  parentNode: EditableTreeNode;
};

function getSimpleWorkbenchStoryArgs(sourceProps: EditableTreeSourceProps | undefined): WorkbenchStoryArgs {
  const args: WorkbenchStoryArgs = {};
  for (const [key, value] of Object.entries(sourceProps ?? {})) {
    if (key === 'className') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') args[key] = value;
  }
  return args;
}

type UnmanagedSourcePropEntry = {
  key: string;
  /** 'prop' = JSX prop outside registry controls; 'style' = style={{...}} declaration with no Inspector field. */
  kind: 'prop' | 'style';
  literal: EditableTreeSourceProps[string] | null;
  removeTarget: NonNullable<SourceComponentPropChangeOptions['target']>;
  source: EditableTreeSourceValueMetadataEntry | null;
  removable: boolean;
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

function getUnmanagedSourceProps(
  selectedSourceNode: EditableTreeNode | null,
  baseSourceNode: EditableTreeNode | null,
  registryControls: WorkbenchStoryControl[],
): UnmanagedSourcePropEntry[] {
  if (!selectedSourceNode) return [];
  const known = new Set<string>();
  for (const control of registryControls) {
    known.add(control.key);
    known.add(getComponentPropTokenKey(control.key));
    known.add(getComponentPropTokenCollectionKey(control.key));
  }
  const skip = new Set(['children', 'className', 'key', 'ref']);
  const propMetadata = selectedSourceNode.sourceValueMetadata?.props ?? {};
  const seen = new Set<string>();
  const entries: UnmanagedSourcePropEntry[] = [];
  const visit = (key: string, literal: EditableTreeSourceProps[string] | null) => {
    if (known.has(key) || skip.has(key) || seen.has(key)) return;
    seen.add(key);
    const source = propMetadata[key] ?? null;
    const removeTarget = hasBaseSourceProp(baseSourceNode, key) ? 'base' : 'active-mode';
    entries.push({
      key,
      kind: 'prop',
      literal,
      removeTarget,
      source,
      removable: source?.kind !== 'spread' && isWritebackSafePropName(key),
    });
  };
  for (const [key, value] of Object.entries(selectedSourceNode.sourceProps ?? {})) {
    visit(key, value);
  }
  for (const key of Object.keys(propMetadata)) {
    visit(key, null);
  }
  // style={{...}} declarations the Inspector has no field for would otherwise
  // be invisible everywhere (the parser routes `style` away from sourceProps).
  const styleDeclarations = selectedSourceNode.sourceStyleDeclarations ?? {};
  const styleMetadata = selectedSourceNode.sourceValueMetadata?.styles ?? {};
  for (const property of new Set([...Object.keys(styleDeclarations), ...Object.keys(styleMetadata)])) {
    if (isEditableSourceStyleProperty(property)) continue;
    const key = `style.${property}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      key,
      kind: 'style',
      literal: styleDeclarations[property] ?? null,
      removeTarget: 'base',
      source: styleMetadata[property] ?? null,
      removable: false,
    });
  }
  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
}

type PrototypeWiringEntry = { key: string; label: string; value: string };

/**
 * Human-readable view of a node's data-wb-proto-* wiring so designers can
 * see which prototype connections a node carries. Read-only by design —
 * the wiring is authored in source (or by an agent) and dies with its node.
 */
function getPrototypeWiringEntries(node: EditableTreeNode | null): PrototypeWiringEntry[] {
  const attributes = node?.sourceAttributes ?? {};
  const entries: PrototypeWiringEntry[] = [];
  const clickValue = attributes[PROTOTYPE_CLICK_ATTRIBUTE];
  if (clickValue) {
    const command = parsePrototypeClickCommand(clickValue);
    entries.push({
      key: 'click',
      label: 'On click',
      value: command ? `${command.action} → ${command.target}` : `invalid: ${clickValue}`,
    });
  }
  const nameValue = attributes[PROTOTYPE_NAME_ATTRIBUTE];
  if (nameValue) {
    entries.push({ key: 'name', label: 'Target name', value: nameValue });
  }
  const initialValue = attributes[PROTOTYPE_INITIAL_ATTRIBUTE];
  if (initialValue) {
    entries.push({ key: 'initial', label: 'Preview initial', value: initialValue });
  }
  return entries;
}

function hasBaseSourceProp(node: EditableTreeNode | null, key: string): boolean {
  if (!node) return false;
  return Object.prototype.hasOwnProperty.call(node.sourceProps ?? {}, key)
    || Object.prototype.hasOwnProperty.call(node.sourceValueMetadata?.props ?? {}, key);
}

function isWritebackSafePropName(value: string): boolean {
  return value === 'children' || /^[A-Za-z_$][\w$]*$/.test(value);
}

function getConnectedArrayContext(
  root: EditableTreeNode | null,
  selectedNode: EditableTreeNode | null,
): ConnectedArrayContext | null {
  if (!root || !selectedNode) return null;
  const path = findEditableTreeNodePath(root, selectedNode.id);
  const sourceMapNode = [selectedNode, ...[...path].reverse()].find((candidate) => (
    Boolean(candidate.sourceMapBinding?.items?.length)
  )) ?? null;
  if (sourceMapNode?.sourceMapBinding?.items) {
    const items = sourceMapNode.sourceMapBinding.items;
    const reference = sourceMapNode.sourceMapBinding.reference ?? null;
    const fields = getConnectedArrayFields(items);
    return {
      fields,
      items,
      mapNode: sourceMapNode,
      propName: sourceMapNode.sourceMapBinding.source.code,
      reference,
      referenceFields: getConnectedArrayReferenceFields(reference, fields),
      sourceLabel: sourceMapNode.sourceMapBinding.source.label,
      sourceNode: sourceMapNode,
      writable: sourceMapNode.sourceMapBinding.source.writable,
    };
  }

  const referencedArrayOwner = [selectedNode, ...[...path].reverse()]
    .map((candidate) => ({
      candidate,
      referencedArray: getEditableTreeReferencedArrayProp(candidate),
    }))
    .find(({ referencedArray }) => Boolean(referencedArray)) ?? null;
  if (referencedArrayOwner?.referencedArray) {
    const { candidate: ownerNode, referencedArray } = referencedArrayOwner;
    const fields = getConnectedArrayFields(referencedArray.items);
    const valueMetadata = ownerNode.sourceValueMetadata?.props?.[referencedArray.propName];
    return {
      fields,
      items: referencedArray.items,
      mapNode: ownerNode,
      propName: referencedArray.propName,
      reference: referencedArray.reference,
      referenceFields: getConnectedArrayReferenceFields(referencedArray.reference, fields),
      sourceLabel: valueMetadata?.kind === 'expression'
        ? valueMetadata.code
        : `${ownerNode.label}.${referencedArray.propName}`,
      sourceNode: ownerNode,
      writable: true,
    };
  }

  const mapNode = findConnectedArrayMapNode(selectedNode);
  const propName = mapNode?.sourceExpression?.mapSource?.propName;
  if (!mapNode || !propName) return null;

  const ownerNode = [...path].reverse().find((candidate) => (
    isRepeaterItemPropsArray(candidate.sourceProps?.[propName])
  )) ?? null;
  const items = ownerNode?.sourceProps?.[propName];
  if (!ownerNode || !isRepeaterItemPropsArray(items)) return null;
  const fields = getConnectedArrayFields(items);
  const reference = ownerNode.sourcePropArrayReferences?.[propName] ?? null;

  return {
    fields,
    items,
    mapNode,
    propName,
    reference,
    referenceFields: getConnectedArrayReferenceFields(reference, fields),
    sourceLabel: ownerNode.sourceValueMetadata?.props?.[propName]?.kind === 'expression'
      ? ownerNode.sourceValueMetadata.props[propName].code
      : `${ownerNode.label}.${propName}`,
    sourceNode: ownerNode,
    writable: true,
  };
}

function findConnectedArrayMapNode(node: EditableTreeNode): EditableTreeNode | null {
  if (node.sourceExpression?.kind === 'map' && node.sourceExpression.mapSource?.propName) return node;
  for (const child of node.children ?? []) {
    const match = findConnectedArrayMapNode(child);
    if (match) return match;
  }
  return null;
}

function getConnectedArrayFields(items: EditableTreeSourcePropArray): string[] {
  const preferredOrder = [
    'title',
    'name',
    'label',
    'description',
    'icon',
    'url',
    'href',
    'value',
    'id',
    'endLabel',
    'group',
    'isDefaultSelected',
  ];
  const fields = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) fields.add(key);
  }
  return [
    ...preferredOrder.filter((key) => fields.has(key)),
    ...[...fields].filter((key) => !preferredOrder.includes(key)).sort((a, b) => a.localeCompare(b)),
  ];
}

function isConnectedArrayIconField(field: string): boolean {
  return field === 'icon' || field.endsWith('Icon');
}

function formatConnectedArrayFieldLabel(field: string): string {
  const label = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return label ? `${label[0]?.toUpperCase() ?? ''}${label.slice(1)}` : field;
}

function getConnectedArrayReferenceFields(
  reference: EditableTreeSourcePropArrayReference | null,
  editableFields: string[],
): string[] {
  const preferredOrder = ['icon', 'image', 'avatar', 'component'];
  const editableFieldSet = new Set(editableFields);
  const fields = new Set<string>();
  for (const item of reference?.items ?? []) {
    for (const key of Object.keys(item)) {
      if (!editableFieldSet.has(key)) fields.add(key);
    }
  }
  return [
    ...preferredOrder.filter((key) => fields.has(key)),
    ...[...fields].filter((key) => !preferredOrder.includes(key)).sort((a, b) => a.localeCompare(b)),
  ];
}

function getConnectedArrayDefaultValue(
  items: EditableTreeSourcePropArray,
  field: string,
): EditableTreeSourcePropObject[string] {
  const sampleValue = items.find((item) => Object.prototype.hasOwnProperty.call(item, field))?.[field];
  if (typeof sampleValue === 'boolean') return false;
  if (field === 'url' || field === 'href') return '#';
  if (field === 'title' || field === 'name' || field === 'label') return 'New item';
  return '';
}

function formatUnmanagedPropDisplay(
  literal: EditableTreeSourceProps[string] | null,
  source: EditableTreeSourceValueMetadataEntry | null,
): string {
  if (source?.kind === 'expression') return `{${source.code}}`;
  if (typeof literal === 'string') return `"${literal}"`;
  if (typeof literal === 'boolean') return literal ? '' : '{false}';
  if (Array.isArray(literal)) return `{[${literal.length}]}`;
  return '';
}

function getRepeaterItemPropsContext(
  root: EditableTreeNode | null,
  selectedNode: EditableTreeNode | null,
): RepeaterItemPropsContext | null {
  if (!root || !selectedNode || selectedNode.kind !== 'component-instance') return null;
  const path = findEditableTreeNodePath(root, selectedNode.id);
  if (path.length < 2) return null;
  const parentNode = path[path.length - 2];
  if (!parentNode || !isRepeaterComponentNode(parentNode)) return null;
  const children = parentNode.children ?? [];
  if (children.length !== 1 || children[0]?.id !== selectedNode.id) return null;
  return {
    count: getRepeaterItemCount(parentNode),
    itemPropKeys: getRepeaterItemPropKeys(parentNode.sourceProps),
    itemProps: getRepeaterItemProps(parentNode.sourceProps),
    parentNode,
  };
}

function isRepeaterComponentNode(node: EditableTreeNode): boolean {
  if (node.kind !== 'component-instance') return false;
  const count = node.sourceProps?.count;
  return typeof count === 'string' || typeof count === 'number' || typeof count === 'boolean';
}

function findEditableTreeNodePath(root: EditableTreeNode, nodeId: string): EditableTreeNode[] {
  if (root.id === nodeId) return [root];
  for (const child of root.children ?? []) {
    const childPath = findEditableTreeNodePath(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  return [];
}

function getRepeaterItemCount(parentNode: EditableTreeNode): number {
  const count = parentNode.sourceProps?.count;
  const parsed = typeof count === 'string' || typeof count === 'number' || typeof count === 'boolean'
    ? Number(count)
    : NaN;
  return Math.max(1, Math.min(50, Math.round(Number.isFinite(parsed) ? parsed : 3)));
}

function getRepeaterItemProps(sourceProps: EditableTreeSourceProps | undefined): EditableTreeSourcePropArray {
  const itemProps = sourceProps?.itemProps;
  return isRepeaterItemPropsArray(itemProps) ? itemProps : [];
}

function getRepeaterItemPropKeys(sourceProps: EditableTreeSourceProps | undefined): EditableTreeSourcePropStringArray | null {
  const itemPropKeys = sourceProps?.itemPropKeys;
  if (Array.isArray(itemPropKeys) && itemPropKeys.every((item) => typeof item === 'string')) {
    return normalizeRepeaterItemPropKeys(itemPropKeys);
  }
  if (typeof itemPropKeys === 'string') {
    return normalizeRepeaterItemPropKeys(itemPropKeys.split(/[\s,]+/));
  }
  return null;
}

function normalizeRepeaterItemPropKeys(keys: string[]): EditableTreeSourcePropStringArray {
  return [...new Set(keys.map((key) => key.trim()).filter((key) => key.length > 0))];
}

function isRepeaterItemPropsArray(value: unknown): value is EditableTreeSourcePropArray {
  return Array.isArray(value) && value.every((item) => (
    isEditableTreeSourcePropObject(item)
  ));
}

function isEditableTreeSourcePropObject(value: unknown): value is EditableTreeSourcePropObject {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((propValue) => typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean');
}

function isRepeaterItemPropAllowed(itemPropKeys: EditableTreeSourcePropStringArray | null, propName: string): boolean {
  return itemPropKeys === null || itemPropKeys.includes(propName);
}

function filterRepeaterItemPropsByKeys(
  itemProps: EditableTreeSourcePropObject,
  itemPropKeys: EditableTreeSourcePropStringArray | null,
): EditableTreeSourcePropObject {
  if (itemPropKeys === null) return itemProps;
  const allowed = new Set(itemPropKeys);
  return Object.fromEntries(Object.entries(itemProps).filter(([key]) => allowed.has(key)));
}

function updateRepeaterItemProps(
  current: EditableTreeSourcePropArray,
  itemIndex: number,
  propName: string,
  value: SourceComponentPropValue,
): EditableTreeSourcePropArray | null {
  const next = current.map((item) => ({ ...item }));
  while (next.length <= itemIndex) next.push({});
  const item = { ...(next[itemIndex] ?? {}) };
  const normalizedValue = normalizeRepeaterItemPropValue(value);
  if (normalizedValue === null) {
    delete item[propName];
  } else {
    item[propName] = normalizedValue;
  }
  next[itemIndex] = item;

  let lastNonEmptyIndex = next.length - 1;
  while (lastNonEmptyIndex >= 0 && Object.keys(next[lastNonEmptyIndex] ?? {}).length === 0) {
    lastNonEmptyIndex -= 1;
  }
  return lastNonEmptyIndex >= 0 ? next.slice(0, lastNonEmptyIndex + 1) : null;
}

function resetRepeaterItemProps(
  current: EditableTreeSourcePropArray,
  itemIndex: number,
): EditableTreeSourcePropArray | null {
  if (itemIndex < 0 || itemIndex >= current.length) return current.length > 0 ? current : null;
  const next = current.map((item) => ({ ...item }));
  next[itemIndex] = {};
  let lastNonEmptyIndex = next.length - 1;
  while (lastNonEmptyIndex >= 0 && Object.keys(next[lastNonEmptyIndex] ?? {}).length === 0) {
    lastNonEmptyIndex -= 1;
  }
  return lastNonEmptyIndex >= 0 ? next.slice(0, lastNonEmptyIndex + 1) : null;
}

function updateRepeaterItemPropKeys(
  current: EditableTreeSourcePropStringArray | null,
  propName: string,
  allowed: boolean,
  visiblePropNames: string[],
): EditableTreeSourcePropStringArray {
  const visible = normalizeRepeaterItemPropKeys(visiblePropNames);
  const next = new Set(current === null ? visible : current);
  if (allowed) {
    next.add(propName);
  } else {
    next.delete(propName);
  }
  return visible.filter((key) => next.has(key));
}

function normalizeRepeaterItemPropValue(value: SourceComponentPropValue): string | number | boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  return null;
}

type InspectorCsvColumn = {
  key: string;
  label: string;
  reorderable?: boolean;
  seriesRowIndex?: number;
};

type InspectorCsvDraftState = {
  columns: InspectorCsvColumn[];
  rows: string[][];
};

type InspectorCsvDragSubject = {
  index: number;
  kind: 'column' | 'row';
};

type InspectorCsvSiblingUpdate = {
  propName: string;
  value: SourceComponentPropValue;
};

type ChartSeriesColorBinding = {
  control: WorkbenchStoryControl;
  key: string;
  label: string;
  rowIndex: number;
  seriesCsv: string;
  value: string;
};

const CHART_SERIES_COLOR_CONTROL_PREFIX = '__chartSeriesColor:';

function isCsvTableComponentProp(control: WorkbenchStoryControl): boolean {
  return control.type === 'text' && (control.key === 'dataCsv' || control.key === 'seriesCsv');
}

function parseInspectorCsvRows(value: string | null | undefined): string[][] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n|;/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split(',').map((cell) => cell.trim()));
}

function serializeInspectorCsvRows(rows: string[][]): string {
  return rows
    .map((row) => {
      const next = row.map((cell) => cell.trim());
      while (next.length > 0 && next[next.length - 1] === '') next.pop();
      return next;
    })
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => row.join(','))
    .join('; ');
}

function moveInspectorCsvItem<T>(items: T[], sourceIndex: number, targetIndex: number): T[] {
  if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) return items;
  if (sourceIndex >= items.length || targetIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

function moveInspectorCsvColumnInRows(
  rows: string[][],
  sourceIndex: number,
  targetIndex: number,
  columnCount: number,
): string[][] {
  return rows.map((row) => {
    const next = [...row];
    while (next.length < columnCount) next.push('');
    return moveInspectorCsvItem(next, sourceIndex, targetIndex);
  });
}

function createInspectorCsvDraftState(
  rows: string[][],
  tableConfig: InspectorCsvTableConfig,
): InspectorCsvDraftState {
  const columns = getInspectorCsvVisibleColumns(tableConfig.columns, rows, tableConfig.canAddColumn);
  return {
    columns,
    rows: createInspectorCsvDraftRows(rows, columns.length),
  };
}

function getInspectorCsvSiblingUpdates(
  control: WorkbenchStoryControl,
  sourceProps: WorkbenchStoryArgs,
  originalValue: string,
  draftRows: string[][],
  draftColumns: InspectorCsvColumn[],
): InspectorCsvSiblingUpdate[] {
  if (control.key === 'dataCsv') {
    const seriesOrder = draftColumns
      .map((column) => column.seriesRowIndex)
      .filter((index): index is number => typeof index === 'number');
    if (!hasInspectorCsvOrderChanged(seriesOrder)) return [];
    const seriesRows = parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv));
    if (seriesRows.length === 0 || seriesOrder.some((index) => index < 0 || index >= seriesRows.length)) return [];
    const included = new Set(seriesOrder);
    const reorderedRows = [
      ...seriesOrder.map((index) => seriesRows[index]),
      ...seriesRows.filter((_, index) => !included.has(index)),
    ];
    return [{ propName: 'seriesCsv', value: serializeInspectorCsvRows(reorderedRows) || null }];
  }

  if (control.key !== 'seriesCsv') return [];
  const originalRows = parseInspectorCsvRows(originalValue);
  const originalKeys = originalRows.map((row) => row[0]?.trim() ?? '');
  const draftKeys = draftRows.map((row) => row[0]?.trim() ?? '');
  if (originalKeys.length !== draftKeys.length || originalKeys.length === 0) return [];
  if (!hasInspectorCsvUniqueKeys(originalKeys) || !hasInspectorCsvUniqueKeys(draftKeys)) return [];
  const seriesOrder = draftKeys.map((key) => originalKeys.indexOf(key));
  if (seriesOrder.some((index) => index < 0) || !hasInspectorCsvOrderChanged(seriesOrder)) return [];
  const dataRows = parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.dataCsv));
  if (dataRows.length === 0) return [];
  const included = new Set(seriesOrder);
  const reorderedDataRows = dataRows.map((row) => {
    const category = row[0] ?? '';
    const values = row.slice(1);
    return [
      category,
      ...seriesOrder.map((index) => values[index] ?? ''),
      ...values.filter((_, index) => !included.has(index)),
    ];
  });
  return [{ propName: 'dataCsv', value: serializeInspectorCsvRows(reorderedDataRows) || null }];
}

function hasInspectorCsvOrderChanged(order: number[]): boolean {
  return order.length > 1 && order.some((value, index) => value !== index);
}

function hasInspectorCsvUniqueKeys(keys: string[]): boolean {
  if (keys.some((key) => !key)) return false;
  return new Set(keys).size === keys.length;
}

function getChartSeriesColorBindings(
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
  controls: WorkbenchStoryControl[],
): ChartSeriesColorBinding[] {
  if (!controls.some((control) => control.key === 'seriesCsv')) return [];
  const seriesCsv = String(getWorkbenchStoryControlValue('seriesCsv', sourceProps, defaultArgs) ?? '');
  const seriesRows = parseInspectorCsvRows(seriesCsv);
  if (seriesRows.length === 0) return [];

  const primaryColor = getStringStoryArgValue(getWorkbenchStoryControlValue('primaryColor', sourceProps, defaultArgs), 'var(--chart-1)');
  const secondaryColor = getStringStoryArgValue(getWorkbenchStoryControlValue('secondaryColor', sourceProps, defaultArgs), 'var(--chart-2)');
  const showSecondary = getBooleanStoryArgValue(getWorkbenchStoryControlValue('showSecondary', sourceProps, defaultArgs), true);
  const visibleRows = showSecondary ? seriesRows : seriesRows.slice(0, 1);
  return visibleRows.flatMap((row, rowIndex): ChartSeriesColorBinding[] => {
    const key = row[0]?.trim();
    if (!key) return [];
    const label = row[1]?.trim() || formatChartSeriesLabel(key);
    const value = row[2]?.trim() || getDefaultChartSeriesColor(rowIndex, primaryColor, secondaryColor);
    return [{
      control: {
        groupId: 'appearance',
        groupLabel: 'Appearance',
        groupOrder: 110,
        key: `${CHART_SERIES_COLOR_CONTROL_PREFIX}${rowIndex}`,
        label: `${label} color`,
        order: 70 + rowIndex,
        picker: 'token',
        tokenTypes: ['color', 'string'],
        type: 'text',
      },
      key,
      label,
      rowIndex,
      seriesCsv,
      value,
    }];
  });
}

function isChartSeriesStaticColorControl(control: WorkbenchStoryControl): boolean {
  return control.key === 'primaryColor' || control.key === 'secondaryColor';
}

function updateChartSeriesCsvColorValue(
  seriesCsv: string,
  binding: ChartSeriesColorBinding,
  color: string | null,
): string {
  const rows = parseInspectorCsvRows(seriesCsv);
  while (rows.length <= binding.rowIndex) rows.push([]);
  const row = [...(rows[binding.rowIndex] ?? [])];
  row[0] = row[0]?.trim() || binding.key;
  row[1] = row[1]?.trim() || binding.label;
  if (color?.trim()) {
    row[2] = color.trim();
  } else {
    row.splice(2);
  }
  rows[binding.rowIndex] = row;
  return serializeInspectorCsvRows(rows);
}

function getDefaultChartSeriesColor(index: number, primaryColor: string, secondaryColor: string): string {
  if (index === 0) return primaryColor;
  if (index === 1) return secondaryColor;
  return `var(--chart-${(index % 5) + 1})`;
}

function formatChartSeriesLabel(key: string): string {
  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStringStoryArgValue(value: WorkbenchStoryArgValue, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getBooleanStoryArgValue(value: WorkbenchStoryArgValue, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

const INSPECTOR_CHART_CARD_OPTIONS = [
  { name: 'AreaChartCard', label: 'Area' },
  { name: 'BarChartCard', label: 'Bar' },
  { name: 'ComposedChartCard', label: 'Composed' },
  { name: 'LineChartCard', label: 'Line' },
  { name: 'RadarChartCard', label: 'Radar' },
  { name: 'PieChartCard', label: 'Pie' },
  { name: 'RadialChartCard', label: 'Radial' },
  { name: 'ScatterChartCard', label: 'Scatter' },
] as const;

type InspectorChartCardName = typeof INSPECTOR_CHART_CARD_OPTIONS[number]['name'];

type InspectorChartTypeConversionOption = {
  allowedPropNames: string[];
  fallbackProps?: SourceComponentTypeFallbackProps;
  label: string;
  name: InspectorChartCardName;
  propOverrides?: SourceComponentTypeFallbackProps;
};

type InspectorChartTypeConversion = {
  currentName: InspectorChartCardName;
  importSource: string;
  managedPropNames: string[];
  options: InspectorChartTypeConversionOption[];
};

const INSPECTOR_CHART_COMMON_PROP_NAMES = [
  'badge',
  'className',
  'dataCsv',
  'description',
  'footerDescription',
  'footerTitle',
  'height',
  'hideIndicator',
  'hideLabel',
  'showGrid',
  'showLegend',
  'showTooltip',
  'seriesCsv',
  'title',
  'tooltipIndicator',
];
const INSPECTOR_CHART_CARTESIAN_PROP_NAMES = [
  ...INSPECTOR_CHART_COMMON_PROP_NAMES,
  'categoryKey',
  'primaryColor',
  'primaryKey',
  'primaryLabel',
  'secondaryColor',
  'secondaryKey',
  'secondaryLabel',
  'seriesCsv',
  'showSecondary',
];
const INSPECTOR_CHART_PROP_NAMES_BY_COMPONENT: Record<InspectorChartCardName, string[]> = {
  AreaChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_CARTESIAN_PROP_NAMES, 'curveType', 'stacked']),
  BarChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_CARTESIAN_PROP_NAMES, 'barRadius', 'layout', 'stacked']),
  ComposedChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_CARTESIAN_PROP_NAMES, 'barRadius', 'curveType', 'showArea', 'showBars', 'showDots', 'showLine', 'stacked']),
  LineChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_CARTESIAN_PROP_NAMES, 'curveType', 'showDots']),
  RadarChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_CARTESIAN_PROP_NAMES, 'outerRadius', 'showRadiusAxis']),
  PieChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_COMMON_PROP_NAMES, 'innerRadius', 'nameKey', 'outerRadius', 'paddingAngle', 'strokeWidth', 'valueKey']),
  RadialChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_COMMON_PROP_NAMES, 'color', 'cornerRadius', 'endAngle', 'innerRadius', 'label', 'nameKey', 'outerRadius', 'primaryColor', 'primaryLabel', 'startAngle', 'valueKey']),
  ScatterChartCard: getInspectorChartPropNamesWithTokenCompanions([...INSPECTOR_CHART_COMMON_PROP_NAMES, 'nameKey', 'primaryColor', 'primaryLabel', 'secondaryColor', 'secondaryLabel', 'seriesCsv', 'seriesKey', 'xKey', 'yKey', 'zKey']),
};
const INSPECTOR_MANAGED_CHART_PROP_NAMES = Array.from(new Set(Object.values(INSPECTOR_CHART_PROP_NAMES_BY_COMPONENT).flat()));
const INSPECTOR_CHART_CARD_NAME_SET = new Set<string>(INSPECTOR_CHART_CARD_OPTIONS.map((option) => option.name));

function getInspectorChartPropNamesWithTokenCompanions(propNames: string[]): string[] {
  return Array.from(new Set(propNames.flatMap((propName) => [
    propName,
    getComponentPropTokenKey(propName),
    getComponentPropTokenCollectionKey(propName),
  ])));
}

function getInspectorChartTypeConversion(
  selectedSourceNode: EditableTreeNode | null,
  sourceProps: WorkbenchStoryArgs,
): InspectorChartTypeConversion | null {
  const currentName = getInspectorChartCardName(selectedSourceNode?.source?.jsxName);
  const importSource = selectedSourceNode?.source?.importSource?.trim();
  if (!currentName || !importSource) return null;

  return {
    currentName,
    importSource,
    managedPropNames: INSPECTOR_MANAGED_CHART_PROP_NAMES,
    options: INSPECTOR_CHART_CARD_OPTIONS.map((option) => ({
      ...option,
      allowedPropNames: INSPECTOR_CHART_PROP_NAMES_BY_COMPONENT[option.name],
      ...getInspectorChartTypeMigrationProps(currentName, option.name, sourceProps),
    })),
  };
}

function getInspectorChartCardName(value: string | undefined): InspectorChartCardName | null {
  return value && INSPECTOR_CHART_CARD_NAME_SET.has(value) ? value as InspectorChartCardName : null;
}

function getInspectorChartTypeMigrationProps(
  currentName: InspectorChartCardName,
  targetName: InspectorChartCardName,
  sourceProps: WorkbenchStoryArgs,
): { fallbackProps?: SourceComponentTypeFallbackProps; propOverrides?: SourceComponentTypeFallbackProps } {
  const fallbackProps: SourceComponentTypeFallbackProps = {};
  const propOverrides: SourceComponentTypeFallbackProps = {};
  const categoryKey = getStringWorkbenchStoryArg(sourceProps.categoryKey) || getStringWorkbenchStoryArg(sourceProps.nameKey) || 'name';
  const valueKey = getStringWorkbenchStoryArg(sourceProps.valueKey) || getFirstInspectorChartSeriesKey(sourceProps) || getStringWorkbenchStoryArg(sourceProps.primaryKey) || 'value';
  const secondValueKey = getSecondInspectorChartSeriesKey(sourceProps) || getStringWorkbenchStoryArg(sourceProps.secondaryKey) || 'y';
  const primaryColor = getStringWorkbenchStoryArg(sourceProps.primaryColor) || getStringWorkbenchStoryArg(sourceProps.color) || 'var(--chart-1)';

  if (isInspectorCartesianLikeChart(targetName)) {
    fallbackProps.categoryKey = categoryKey;
    fallbackProps.primaryKey = valueKey;
    fallbackProps.primaryLabel = formatChartSeriesLabel(valueKey);
    if (isInspectorSingleSeriesChart(currentName)) {
      fallbackProps.showSecondary = false;
    }
  }

  if (targetName === 'PieChartCard' || targetName === 'RadialChartCard') {
    fallbackProps.nameKey = categoryKey;
    fallbackProps.valueKey = valueKey;
  }

  if (targetName === 'RadialChartCard') {
    fallbackProps.color = primaryColor;
    fallbackProps.label = getStringWorkbenchStoryArg(sourceProps.primaryLabel) || formatChartSeriesLabel(valueKey);
  }

  if (targetName === 'ScatterChartCard') {
    fallbackProps.nameKey = categoryKey;
    fallbackProps.seriesKey = 'series';
    fallbackProps.xKey = valueKey;
    fallbackProps.yKey = secondValueKey === valueKey ? 'y' : secondValueKey;
    fallbackProps.zKey = 'z';
  }

  return {
    ...(Object.keys(fallbackProps).length > 0 ? { fallbackProps } : {}),
    ...(Object.keys(propOverrides).length > 0 ? { propOverrides } : {}),
  };
}

function isInspectorCartesianLikeChart(name: InspectorChartCardName): boolean {
  return name === 'AreaChartCard' ||
    name === 'BarChartCard' ||
    name === 'ComposedChartCard' ||
    name === 'LineChartCard' ||
    name === 'RadarChartCard';
}

function isInspectorSingleSeriesChart(name: InspectorChartCardName): boolean {
  return name === 'PieChartCard' || name === 'RadialChartCard';
}

function getFirstInspectorChartSeriesKey(sourceProps: WorkbenchStoryArgs): string {
  const seriesRows = parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv));
  return seriesRows[0]?.[0]?.trim() || '';
}

function getSecondInspectorChartSeriesKey(sourceProps: WorkbenchStoryArgs): string {
  const seriesRows = parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv));
  return seriesRows[1]?.[0]?.trim() || '';
}

function ComponentPropControl({
  assetRegistry,
  control,
  defaultArgs,
  onCommit,
  onCommitBatchComponentProps,
  onCommitSiblingComponentProp,
  onCommitTokenBinding,
  onSourceNodeComponentPropChange,
  preserveEmptyText = false,
  previewTokenModes,
  selectedSourceNode,
  sourceDocumentRoot,
  sourceProps,
  tokenRegistry,
  value,
  valueSource,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  control: WorkbenchStoryControl;
  defaultArgs: WorkbenchStoryArgs;
  onCommit: (value: SourceComponentPropValue) => void;
  onCommitBatchComponentProps?: (updates: SourceComponentPropUpdate[]) => void;
  onCommitSiblingComponentProp?: (propName: string, value: SourceComponentPropValue) => void;
  onCommitTokenBinding: (reference: TokenReference | null, resolvedValue: string | null) => void;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  preserveEmptyText?: boolean;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  sourceDocumentRoot: EditableTreeNode | null;
  sourceProps: WorkbenchStoryArgs;
  tokenRegistry?: TokenRegistry;
  value: boolean | number | string;
  valueSource?: EditableTreeSourceValueMetadataEntry | null;
}) {
  const previewColorSchemeSide = useInspectorPreviewColorSchemeSide();
  const propTokenBinding = getComponentPropTokenBinding(control.key, sourceProps);
  const componentPropTokenTypes = tokenRegistry ? getComponentPropTokenAllowedTypes(control) : null;
  const canBindComponentToken = Boolean(componentPropTokenTypes);
  const canBindI18nToken = Boolean(tokenRegistry) && control.type === 'text' && !canBindComponentToken;
  const selectedComponentPropToken = componentPropTokenTypes && tokenRegistry
    ? findComponentPropTokenResult(
      tokenRegistry,
      componentPropTokenTypes,
      propTokenBinding,
      typeof value === 'string' ? value : '',
      previewTokenModes,
    )
    : null;
  const selectedComponentPropTokenReference = selectedComponentPropToken
    ? { collectionId: selectedComponentPropToken.collection.id, tokenId: selectedComponentPropToken.token.id }
    : propTokenBinding;
  const csvContextProps = useMemo(() => ({ ...defaultArgs, ...sourceProps }), [defaultArgs, sourceProps]);

  if (valueSource && !valueSource.writable) {
    return (
      <SourceValueMetadataControl
        ariaLabel={`${control.label} prop source`}
        onDetach={valueSource.detachableValue
          ? () => onCommit(valueSource.detachableValue!)
          : undefined}
        source={valueSource}
      />
    );
  }

  if (control.type === 'select') {
    const exactOptionIndex = control.options.findIndex((option) => Object.is(option, value));
    const selectedOptionIndex = exactOptionIndex >= 0
      ? exactOptionIndex
      : control.options.findIndex((option) => String(option) === String(value));
    return (
      <SelectControl
        aria-label={`${control.label} prop`}
        className="wb-inspector-source-select"
        value={String(selectedOptionIndex)}
        onValueChange={(nextValue) => {
          const optionIndex = Number(nextValue);
          if (optionIndex < 0) return;
          const option = control.options[optionIndex];
          if (option !== undefined) onCommit(option);
        }}
      >
        {selectedOptionIndex < 0 ? (
          <option value="-1">{String(value)}</option>
        ) : null}
        {control.options.map((option, index) => (
          <option key={`${typeof option}:${option}:${index}`} value={String(index)}>
            {String(option)}
          </option>
        ))}
      </SelectControl>
    );
  }

  if (control.type === 'boolean') {
    return (
      <span className="wb-inspector-boolean-control">
        <input
          aria-label={`${control.label} prop`}
          checked={value === true}
          type="checkbox"
          onChange={(event) => onCommit(event.target.checked)}
        />
        <span>{value === true ? 'true' : 'false'}</span>
      </span>
    );
  }

  if (control.type === 'icon') {
    return (
      <ComponentIconPropControl
        ariaLabel={`${control.label} prop`}
        assetRegistry={assetRegistry}
        control={control}
        value={typeof value === 'string' ? value : ''}
        onCommit={onCommit}
      />
    );
  }

  if (control.type === 'number') {
    return (
      <ComponentNumberPropControl
        control={control}
        value={typeof value === 'number' || typeof value === 'string' ? value : ''}
        onCommit={onCommit}
      />
    );
  }

  if (isPopoverAnchorIdControl(control, selectedSourceNode)) {
    return (
      <PopoverAnchorPropControl
        currentValue={typeof value === 'string' ? value : ''}
        selectedSourceNode={selectedSourceNode}
        sourceDocumentRoot={sourceDocumentRoot}
        onCommit={onCommit}
        onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
      />
    );
  }

  if (isCsvTableComponentProp(control)) {
    return (
      <ComponentCsvPropControl
        control={control}
        previewTokenModes={previewTokenModes}
        sourceProps={csvContextProps}
        tokenRegistry={tokenRegistry}
        value={typeof value === 'string' ? value : ''}
        onCommit={onCommit}
        onCommitBatch={onCommitBatchComponentProps}
        onCommitSibling={onCommitSiblingComponentProp}
      />
    );
  }

  const componentAssetKinds = getAssetKindsForComponentProp(control);
  const trailingAssetPicker = componentAssetKinds ? (
    <AssetPickerButton
      ariaLabel={`Select ${control.label} asset`}
      assets={assetRegistry}
      kinds={componentAssetKinds}
      onSelect={(asset) => onCommit(getDesignAssetUsageValue(asset))}
      onSelectPreview={(preview) => onCommit(formatPreviewAssetValueForComponentProp(control, preview))}
    />
  ) : null;
  const trailingTokenPicker = componentPropTokenTypes ? (
    <InspectorTokenPicker
      ariaLabel={`${control.label} token`}
      allowedTypes={componentPropTokenTypes}
      className="wb-inspector-style-token-picker"
      modeByCollection={previewTokenModes}
      registry={tokenRegistry!}
      selected={selectedComponentPropTokenReference}
      triggerMode="icon"
      onClear={() => {
        onCommitTokenBinding(null, null);
        const detachedValue = selectedComponentPropToken
          ? formatComponentPropDetachedTokenValue(selectedComponentPropToken, tokenRegistry!, previewColorSchemeSide)
          : null;
        if (detachedValue !== null) onCommit(detachedValue);
      }}
      onSelect={(reference) => {
        const result = queryTokens(tokenRegistry!, {
          allowedTypes: componentPropTokenTypes,
          modeByCollection: previewTokenModes,
        }).find((candidate) => (
          candidate.collection.id === reference.collectionId &&
          candidate.token.id === reference.tokenId &&
            candidate.compatible
        ));
        onCommitTokenBinding(reference, result ? formatComponentPropTokenRawValue(result) : null);
      }}
    />
  ) : canBindI18nToken ? (
    <SourceI18nTokenPicker
      ariaLabel={`${control.label} i18n token`}
      className="wb-inspector-style-token-picker"
      modeByCollection={previewTokenModes}
      registry={tokenRegistry!}
      selectedReference={propTokenBinding}
      onClear={() => onCommitTokenBinding(null, null)}
      onSelect={(selection) => onCommitTokenBinding(selection.reference, selection.previewText)}
    />
  ) : null;
  const trailing = trailingAssetPicker || trailingTokenPicker ? (
    <span className={trailingAssetPicker && trailingTokenPicker ? 'wb-inspector-trailing-actions wb-inspector-trailing-actions--double' : 'wb-inspector-trailing-actions'}>
      {trailingAssetPicker}
      {trailingTokenPicker}
    </span>
  ) : null;
  const propTerms = getComponentPropAssetTerms(control);
  const leading = !selectedComponentPropToken && isCssColorComponentTokenProp(propTerms) ? (
    <SourceStyleColorSwatch
      fallback="#000000"
      value={typeof value === 'string' ? value : ''}
      onCommit={onCommit}
    />
  ) : undefined;

  const commitTextProp = preserveEmptyText
    ? (nextValue: string | null) => onCommit(nextValue ?? '')
    : onCommit;
  const textValue = selectedComponentPropToken ? formatComponentPropTokenDisplayValue(selectedComponentPropToken) : typeof value === 'string' ? value : '';

  if (control.type === 'text' && control.multiline) {
    return (
      <SourceTextContentControl
        ariaLabel={`${control.label} prop`}
        commitOnChange
        leading={leading}
        tokenized={Boolean((selectedComponentPropToken || propTokenBinding) && (canBindComponentToken || canBindI18nToken))}
        trailing={trailing}
        value={textValue}
        onCommit={(nextValue) => commitTextProp(normalizeSourceAttributeDraft(nextValue))}
      />
    );
  }

  return (
    <SourceAttributeControl
      ariaLabel={`${control.label} prop`}
      commitOnChange
      leading={leading}
      suggestions={control.type === 'text' ? control.suggestions : undefined}
      tokenized={Boolean((selectedComponentPropToken || propTokenBinding) && (canBindComponentToken || canBindI18nToken))}
      trailing={trailing}
      value={textValue}
      onClear={() => onCommit(null)}
      onCommit={commitTextProp}
    />
  );
}

type ComponentCsvPropControlProps = {
  control: WorkbenchStoryControl;
  onCommit: (value: SourceComponentPropValue) => void;
  onCommitBatch?: (updates: SourceComponentPropUpdate[]) => void;
  onCommitSibling?: (propName: string, value: SourceComponentPropValue) => void;
  previewTokenModes: PreviewTokenModeSelection;
  sourceProps: WorkbenchStoryArgs;
  tokenRegistry?: TokenRegistry;
  value: string;
};

function ComponentCsvPropControl(props: ComponentCsvPropControlProps) {
  if (shouldUseCombinedChartCsvEditor(props.control, props.sourceProps)) {
    return <CombinedChartCsvPropControl {...props} />;
  }
  return <SingleCsvPropControl {...props} />;
}

function CombinedChartCsvPropControl({
  control,
  onCommit,
  onCommitBatch,
  onCommitSibling,
  previewTokenModes,
  sourceProps,
  tokenRegistry,
  value,
}: ComponentCsvPropControlProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [seriesRows, setSeriesRows] = useState<string[][]>(() => (
    createInspectorCsvDraftRows(parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv)), 3)
  ));
  const [dataRows, setDataRows] = useState<string[][]>(() => (
    createInspectorCsvDraftRows(parseInspectorCsvRows(value), getInspectorDataCsvTableConfigForSeries(sourceProps, value, parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv))).columns.length)
  ));
  const [seriesDragSubject, setSeriesDragSubject] = useState<InspectorCsvDragSubject | null>(null);
  const [seriesDropTarget, setSeriesDropTarget] = useState<InspectorCsvDragSubject | null>(null);
  const [dataDragSubject, setDataDragSubject] = useState<InspectorCsvDragSubject | null>(null);
  const [dataDropTarget, setDataDropTarget] = useState<InspectorCsvDragSubject | null>(null);
  const colorTokenResults = useMemo(() => (
    tokenRegistry
      ? queryTokens(tokenRegistry, {
        allowedTypes: INSPECTOR_CSV_COLOR_TOKEN_TYPES,
        modeByCollection: previewTokenModes,
      })
      : []
  ), [previewTokenModes, tokenRegistry]);
  const dataCsv = control.key === 'dataCsv' ? value : getStringWorkbenchStoryArg(sourceProps.dataCsv);
  const parsedDataRows = useMemo(() => parseInspectorCsvRows(dataCsv), [dataCsv]);
  const parsedSeriesRows = useMemo(() => parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv)), [sourceProps]);
  const dataConfig = useMemo(
    () => getInspectorDataCsvTableConfigForSeries(sourceProps, dataCsv, seriesRows),
    [dataCsv, seriesRows, sourceProps],
  );
  const seriesColumns = getInspectorCsvVisibleColumns(getInspectorSeriesCsvTableConfig().columns, seriesRows, false);
  const dataColumns = getInspectorCsvVisibleColumns(dataConfig.columns, dataRows, dataConfig.canAddColumn);
  const hasLinkedSeriesColumns = dataColumns.some((column) => typeof column.seriesRowIndex === 'number');

  const openEditor = () => {
    const nextSeriesRows = createInspectorCsvDraftRows(parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv)), 3);
    const nextDataConfig = getInspectorDataCsvTableConfigForSeries(sourceProps, dataCsv, nextSeriesRows);
    setSeriesRows(nextSeriesRows);
    setDataRows(createInspectorCsvDraftRows(parseInspectorCsvRows(dataCsv), nextDataConfig.columns.length));
    setSeriesDragSubject(null);
    setSeriesDropTarget(null);
    setDataDragSubject(null);
    setDataDropTarget(null);
    setEditorOpen(true);
  };

  const beginSeriesDrag = (event: ReactDragEvent<HTMLElement>, subject: InspectorCsvDragSubject) => {
    setSeriesDragSubject(subject);
    setSeriesDropTarget(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `chart-series-${subject.index}`);
  };
  const beginDataDrag = (event: ReactDragEvent<HTMLElement>, subject: InspectorCsvDragSubject) => {
    setDataDragSubject(subject);
    setDataDropTarget(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `chart-data-${subject.kind}-${subject.index}`);
  };
  const endSeriesDrag = () => {
    setSeriesDragSubject(null);
    setSeriesDropTarget(null);
  };
  const endDataDrag = () => {
    setDataDragSubject(null);
    setDataDropTarget(null);
  };
  const moveSeriesRow = (sourceIndex: number, targetIndex: number) => {
    setSeriesRows((current) => moveInspectorCsvItem(current, sourceIndex, targetIndex));
    if (hasLinkedSeriesColumns) {
      setDataRows((current) => moveInspectorCsvColumnInRows(current, sourceIndex + 1, targetIndex + 1, seriesRows.length + 1));
    }
  };
  const moveDataRow = (sourceIndex: number, targetIndex: number) => {
    setDataRows((current) => moveInspectorCsvItem(current, sourceIndex, targetIndex));
  };
  const moveLinkedDataColumn = (sourceColumnIndex: number, targetColumnIndex: number) => {
    if (!hasLinkedSeriesColumns || sourceColumnIndex < 1 || targetColumnIndex < 1) return;
    moveSeriesRow(sourceColumnIndex - 1, targetColumnIndex - 1);
  };
  const updateSeriesCell = (rowIndex: number, columnIndex: number, nextValue: string) => {
    setSeriesRows((current) => current.map((row, candidateRowIndex) => {
      if (candidateRowIndex !== rowIndex) return row;
      const next = [...row];
      while (next.length <= columnIndex) next.push('');
      next[columnIndex] = nextValue;
      return next;
    }));
  };
  const updateDataCell = (rowIndex: number, columnIndex: number, nextValue: string) => {
    setDataRows((current) => current.map((row, candidateRowIndex) => {
      if (candidateRowIndex !== rowIndex) return row;
      const next = [...row];
      while (next.length <= columnIndex) next.push('');
      next[columnIndex] = nextValue;
      return next;
    }));
  };
  const addSeriesRow = () => {
    setSeriesRows((current) => [
      ...current,
      createInspectorSeriesCsvRow(current),
    ]);
    if (hasLinkedSeriesColumns) setDataRows((current) => current.map((row) => [...row, '']));
  };
  const removeSeriesRow = (rowIndex: number) => {
    setSeriesRows((current) => {
      const next = current.filter((_, candidateRowIndex) => candidateRowIndex !== rowIndex);
      return next.length > 0 ? next : [['series1', 'Series 1', '']];
    });
    if (hasLinkedSeriesColumns) {
      setDataRows((current) => current.map((row) => row.filter((_, columnIndex) => columnIndex !== rowIndex + 1)));
    }
  };
  const addDataRow = () => {
    setDataRows((current) => [
      ...current,
      Array.from({ length: Math.max(dataColumns.length, 1) }, () => ''),
    ]);
  };
  const removeDataRow = (rowIndex: number) => {
    setDataRows((current) => {
      const next = current.filter((_, candidateRowIndex) => candidateRowIndex !== rowIndex);
      return next.length > 0 ? next : createInspectorCsvDraftRows([], dataColumns.length);
    });
  };
  const handleSeriesDragOver = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (seriesDragSubject?.kind !== 'row' || seriesDragSubject.index === rowIndex || seriesRows.length <= 1) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setSeriesDropTarget({ kind: 'row', index: rowIndex });
  };
  const handleSeriesDrop = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (seriesDragSubject?.kind !== 'row' || seriesDragSubject.index === rowIndex) return;
    event.preventDefault();
    moveSeriesRow(seriesDragSubject.index, rowIndex);
    endSeriesDrag();
  };
  const handleDataRowDragOver = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (dataDragSubject?.kind !== 'row' || dataDragSubject.index === rowIndex || dataRows.length <= 1) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDataDropTarget({ kind: 'row', index: rowIndex });
  };
  const handleDataRowDrop = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (dataDragSubject?.kind !== 'row' || dataDragSubject.index === rowIndex) return;
    event.preventDefault();
    moveDataRow(dataDragSubject.index, rowIndex);
    endDataDrag();
  };
  const handleDataColumnDragOver = (event: ReactDragEvent<HTMLTableCellElement>, columnIndex: number) => {
    if (dataDragSubject?.kind !== 'column' || dataDragSubject.index === columnIndex) return;
    const sourceColumn = dataColumns[dataDragSubject.index];
    const targetColumn = dataColumns[columnIndex];
    if (!sourceColumn?.reorderable || !targetColumn?.reorderable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDataDropTarget({ kind: 'column', index: columnIndex });
  };
  const handleDataColumnDrop = (event: ReactDragEvent<HTMLTableCellElement>, columnIndex: number) => {
    if (dataDragSubject?.kind !== 'column' || dataDragSubject.index === columnIndex) return;
    event.preventDefault();
    moveLinkedDataColumn(dataDragSubject.index, columnIndex);
    endDataDrag();
  };
  const applyDraft = () => {
    const nextSeriesCsv = serializeInspectorCsvRows(seriesRows);
    const nextDataCsv = serializeInspectorCsvRows(dataRows);
    if (control.key === 'dataCsv') {
      const updates: SourceComponentPropUpdate[] = [
        { propName: 'seriesCsv', value: nextSeriesCsv || null },
        { propName: 'dataCsv', value: nextDataCsv || null },
      ];
      if (onCommitBatch) {
        onCommitBatch(updates);
      } else {
        onCommitSibling?.('seriesCsv', nextSeriesCsv || null);
        onCommit(nextDataCsv || null);
      }
    } else {
      const updates: SourceComponentPropUpdate[] = [
        { propName: 'dataCsv', value: nextDataCsv || null },
        { propName: 'seriesCsv', value: nextSeriesCsv || null },
      ];
      if (onCommitBatch) {
        onCommitBatch(updates);
      } else {
        onCommitSibling?.('dataCsv', nextDataCsv || null);
        onCommit(nextSeriesCsv || null);
      }
    }
    setEditorOpen(false);
  };

  return (
    <span className="wb-inspector-csv-control">
      <button
        type="button"
        className="wb-inspector-csv-control__summary"
        onClick={openEditor}
      >
        <span>
          <strong>{parsedDataRows.length > 0 ? `${parsedDataRows.length} rows` : 'No rows'}</strong>
          <small>{parsedSeriesRows.length} series</small>
        </span>
        <Pencil size={12} aria-hidden="true" />
      </button>
      {editorOpen ? (
        <ModalLayer
          className="wb-csv-editor-modal wb-csv-editor-modal--combined"
          title="Chart data table"
          onClose={() => setEditorOpen(false)}
        >
          <div className="wb-csv-editor wb-csv-editor--combined">
            {!hasLinkedSeriesColumns ? (
              <div className="wb-csv-editor-section">
              <div className="wb-csv-editor-toolbar">
                <span>Series · {seriesRows.length} rows</span>
                <span className="wb-csv-editor-toolbar__actions">
                  <Button onClick={addSeriesRow}>
                    <Plus size={12} aria-hidden="true" />
                    Add series
                  </Button>
                </span>
              </div>
              <div className="wb-csv-editor-table-wrap wb-csv-editor-table-wrap--series">
                <table className="wb-csv-editor-table">
                  <thead>
                    <tr>
                      {seriesColumns.map((column) => <th key={column.key}>{column.label}</th>)}
                      <th className="wb-csv-editor-table__actions-column" aria-label="Series actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {seriesRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={[
                          seriesDropTarget?.kind === 'row' && seriesDropTarget.index === rowIndex ? 'wb-csv-editor-table__row--drop-target' : '',
                          seriesDragSubject?.kind === 'row' && seriesDragSubject.index === rowIndex ? 'wb-csv-editor-table__row--dragging' : '',
                        ].filter(Boolean).join(' ')}
                        onDragLeave={() => {
                          if (seriesDropTarget?.kind === 'row' && seriesDropTarget.index === rowIndex) setSeriesDropTarget(null);
                        }}
                        onDragOver={(event) => handleSeriesDragOver(event, rowIndex)}
                        onDrop={(event) => handleSeriesDrop(event, rowIndex)}
                      >
                        {seriesColumns.map((column, columnIndex) => (
                          <td key={column.key}>
                            <InspectorCsvCellEditor
                              colorTokenResults={colorTokenResults}
                              column={column}
                              columnIndex={columnIndex}
                              control={INSPECTOR_SERIES_CSV_CONTROL}
                              previewTokenModes={previewTokenModes}
                              row={row}
                              rowIndex={rowIndex}
                              tokenRegistry={tokenRegistry}
                              onUpdateCell={updateSeriesCell}
                            />
                          </td>
                        ))}
                        <td className="wb-csv-editor-table__actions">
                          <button
                            type="button"
                            aria-label={`Drag series ${rowIndex + 1}`}
                            className="wb-csv-editor-drag-button wb-csv-editor-row-drag"
                            draggable={seriesRows.length > 1}
                            disabled={seriesRows.length <= 1}
                            onDragEnd={endSeriesDrag}
                            onDragStart={(event) => beginSeriesDrag(event, { kind: 'row', index: rowIndex })}
                          >
                            <GripVertical size={12} aria-hidden="true" />
                          </button>
                          <IconButton
                            label={`Remove series ${rowIndex + 1}`}
                            onClick={() => removeSeriesRow(rowIndex)}
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            ) : null}
            <div className="wb-csv-editor-section">
              <div className="wb-csv-editor-toolbar">
                <span>
                  Data · {dataRows.length} rows · {hasLinkedSeriesColumns ? `${Math.max(0, dataColumns.length - 1)} series` : `${dataColumns.length} columns`}
                </span>
                <span className="wb-csv-editor-toolbar__actions">
                  {hasLinkedSeriesColumns ? (
                    <Button onClick={addSeriesRow}>
                      <Plus size={12} aria-hidden="true" />
                      Add series
                    </Button>
                  ) : null}
                  <Button onClick={addDataRow}>
                    <Plus size={12} aria-hidden="true" />
                    Add row
                  </Button>
                </span>
              </div>
              <div className="wb-csv-editor-table-wrap">
                <table className="wb-csv-editor-table">
                  <thead>
                    <tr>
                      {dataColumns.map((column, columnIndex) => (
                        <th
                          key={column.key}
                          className={[
                            column.reorderable ? 'wb-csv-editor-table__column--reorderable' : '',
                            typeof column.seriesRowIndex === 'number' ? 'wb-csv-editor-table__series-column' : '',
                            dataDropTarget?.kind === 'column' && dataDropTarget.index === columnIndex ? 'wb-csv-editor-table__column--drop-target' : '',
                            dataDragSubject?.kind === 'column' && dataDragSubject.index === columnIndex ? 'wb-csv-editor-table__column--dragging' : '',
                          ].filter(Boolean).join(' ')}
                          onDragLeave={() => {
                            if (dataDropTarget?.kind === 'column' && dataDropTarget.index === columnIndex) setDataDropTarget(null);
                          }}
                          onDragOver={(event) => handleDataColumnDragOver(event, columnIndex)}
                          onDrop={(event) => handleDataColumnDrop(event, columnIndex)}
                        >
                          {typeof column.seriesRowIndex === 'number' ? (
                            <InspectorCsvSeriesColumnHeader
                              colorTokenResults={colorTokenResults}
                              column={column}
                              columnIndex={columnIndex}
                              previewTokenModes={previewTokenModes}
                              row={seriesRows[column.seriesRowIndex] ?? []}
                              seriesCount={seriesRows.length}
                              seriesRowIndex={column.seriesRowIndex}
                              sourceProps={sourceProps}
                              tokenRegistry={tokenRegistry}
                              onBeginDrag={beginDataDrag}
                              onEndDrag={endDataDrag}
                              onRemoveSeries={removeSeriesRow}
                              onUpdateSeriesCell={updateSeriesCell}
                            />
                          ) : (
                            <span className="wb-csv-editor-column-header">
                              {column.reorderable ? (
                                <button
                                  type="button"
                                  aria-label={`Drag ${column.label} column`}
                                  className="wb-csv-editor-drag-button wb-csv-editor-column-drag"
                                  draggable
                                  onDragEnd={endDataDrag}
                                  onDragStart={(event) => beginDataDrag(event, { kind: 'column', index: columnIndex })}
                                >
                                  <GripVertical size={12} aria-hidden="true" />
                                </button>
                              ) : null}
                              <span>{column.label}</span>
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="wb-csv-editor-table__actions-column" aria-label="Data actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {dataRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={[
                          dataDropTarget?.kind === 'row' && dataDropTarget.index === rowIndex ? 'wb-csv-editor-table__row--drop-target' : '',
                          dataDragSubject?.kind === 'row' && dataDragSubject.index === rowIndex ? 'wb-csv-editor-table__row--dragging' : '',
                        ].filter(Boolean).join(' ')}
                        onDragLeave={() => {
                          if (dataDropTarget?.kind === 'row' && dataDropTarget.index === rowIndex) setDataDropTarget(null);
                        }}
                        onDragOver={(event) => handleDataRowDragOver(event, rowIndex)}
                        onDrop={(event) => handleDataRowDrop(event, rowIndex)}
                      >
                        {dataColumns.map((column, columnIndex) => (
                          <td key={column.key}>
                            <InspectorCsvCellEditor
                              colorTokenResults={colorTokenResults}
                              column={column}
                              columnIndex={columnIndex}
                              control={INSPECTOR_DATA_CSV_CONTROL}
                              previewTokenModes={previewTokenModes}
                              row={row}
                              rowIndex={rowIndex}
                              tokenRegistry={tokenRegistry}
                              onUpdateCell={updateDataCell}
                            />
                          </td>
                        ))}
                        <td className="wb-csv-editor-table__actions">
                          <button
                            type="button"
                            aria-label={`Drag data row ${rowIndex + 1}`}
                            className="wb-csv-editor-drag-button wb-csv-editor-row-drag"
                            draggable={dataRows.length > 1}
                            disabled={dataRows.length <= 1}
                            onDragEnd={endDataDrag}
                            onDragStart={(event) => beginDataDrag(event, { kind: 'row', index: rowIndex })}
                          >
                            <GripVertical size={12} aria-hidden="true" />
                          </button>
                          <IconButton
                            label={`Remove data row ${rowIndex + 1}`}
                            onClick={() => removeDataRow(rowIndex)}
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="wb-modal-actions">
              <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button tone="primary" onClick={applyDraft}>Apply</Button>
            </div>
          </div>
        </ModalLayer>
      ) : null}
    </span>
  );
}

function InspectorCsvSeriesColumnHeader({
  colorTokenResults,
  column,
  columnIndex,
  onBeginDrag,
  onEndDrag,
  onRemoveSeries,
  onUpdateSeriesCell,
  previewTokenModes,
  row,
  seriesCount,
  seriesRowIndex,
  sourceProps,
  tokenRegistry,
}: {
  colorTokenResults: TokenPickerResult[];
  column: InspectorCsvColumn;
  columnIndex: number;
  onBeginDrag: (event: ReactDragEvent<HTMLElement>, subject: InspectorCsvDragSubject) => void;
  onEndDrag: () => void;
  onRemoveSeries: (rowIndex: number) => void;
  onUpdateSeriesCell: (rowIndex: number, columnIndex: number, nextValue: string) => void;
  previewTokenModes: PreviewTokenModeSelection;
  row: string[];
  seriesCount: number;
  seriesRowIndex: number;
  sourceProps: WorkbenchStoryArgs;
  tokenRegistry?: TokenRegistry;
}) {
  return (
    <span className="wb-csv-editor-series-header">
      <button
        type="button"
        aria-label={`Drag ${column.label} series`}
        className="wb-csv-editor-drag-button wb-csv-editor-column-drag"
        draggable
        onDragEnd={onEndDrag}
        onDragStart={(event) => onBeginDrag(event, { kind: 'column', index: columnIndex })}
      >
        <GripVertical size={12} aria-hidden="true" />
      </button>
      <span className="wb-csv-editor-series-header__name">
        <InspectorCsvCellEditor
          colorTokenResults={colorTokenResults}
          column={{ key: 'series-label', label: 'Series name' }}
          columnIndex={1}
          control={INSPECTOR_SERIES_CSV_CONTROL}
          previewTokenModes={previewTokenModes}
          row={row}
          rowIndex={seriesRowIndex}
          tokenRegistry={tokenRegistry}
          onUpdateCell={onUpdateSeriesCell}
        />
      </span>
      <InspectorCsvSeriesColorChip
        colorTokenResults={colorTokenResults}
        previewTokenModes={previewTokenModes}
        row={row}
        rowIndex={seriesRowIndex}
        sourceProps={sourceProps}
        tokenRegistry={tokenRegistry}
        onUpdateCell={onUpdateSeriesCell}
      />
      <IconButton
        label={`Remove ${column.label} series`}
        className="wb-csv-editor-series-header__remove"
        disabled={seriesCount <= 1}
        onClick={() => onRemoveSeries(seriesRowIndex)}
      >
        <Trash2 size={12} aria-hidden="true" />
      </IconButton>
    </span>
  );
}

function InspectorCsvSeriesColorChip({
  colorTokenResults,
  onUpdateCell,
  previewTokenModes,
  row,
  rowIndex,
  sourceProps,
  tokenRegistry,
}: {
  colorTokenResults: TokenPickerResult[];
  onUpdateCell: (rowIndex: number, columnIndex: number, nextValue: string) => void;
  previewTokenModes: PreviewTokenModeSelection;
  row: string[];
  rowIndex: number;
  sourceProps: WorkbenchStoryArgs;
  tokenRegistry?: TokenRegistry;
}) {
  const rawValue = row[2]?.trim() ?? '';
  const primaryColor = getStringStoryArgValue(sourceProps.primaryColor, 'var(--chart-1)');
  const secondaryColor = getStringStoryArgValue(sourceProps.secondaryColor, 'var(--chart-2)');
  const effectiveValue = rawValue || getDefaultChartSeriesColor(rowIndex, primaryColor, secondaryColor);
  const selectedColorToken = tokenRegistry
    ? findComponentPropTokenResultByRawValue(colorTokenResults, effectiveValue)
    : null;
  const selectedColorReference = selectedColorToken
    ? { collectionId: selectedColorToken.collection.id, tokenId: selectedColorToken.token.id }
    : null;

  if (!tokenRegistry) {
    return (
      <span
        aria-label={`Series ${rowIndex + 1} color`}
        className="wb-csv-editor-series-color-chip wb-csv-editor-series-color-chip--readonly"
        style={{ '--wb-csv-editor-series-color': effectiveValue } as CSSProperties}
      />
    );
  }

  return (
    <span className="wb-csv-editor-series-color-chip">
      <InspectorTokenPicker
        ariaLabel={`Series ${rowIndex + 1} color token`}
        allowedTypes={INSPECTOR_CSV_COLOR_TOKEN_TYPES}
        className="wb-csv-editor-token-picker wb-csv-editor-series-color-picker"
        modeByCollection={previewTokenModes}
        registry={tokenRegistry}
        selected={selectedColorReference}
        triggerMode="icon"
        onClear={() => onUpdateCell(rowIndex, 2, '')}
        onSelect={(reference) => {
          const result = colorTokenResults.find((candidate) => (
            candidate.collection.id === reference.collectionId &&
            candidate.token.id === reference.tokenId &&
            candidate.compatible
          ));
          onUpdateCell(
            rowIndex,
            2,
            result ? formatComponentPropTokenRawValue(result) : `var(${getProjectCollectionTokenCssVariableName(reference.collectionId, reference.tokenId)})`,
          );
        }}
      />
    </span>
  );
}

function SingleCsvPropControl({
  control,
  onCommit,
  onCommitBatch,
  onCommitSibling,
  previewTokenModes,
  sourceProps,
  tokenRegistry,
  value,
}: ComponentCsvPropControlProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [dragSubject, setDragSubject] = useState<InspectorCsvDragSubject | null>(null);
  const [dropTarget, setDropTarget] = useState<InspectorCsvDragSubject | null>(null);
  const tableConfig = useMemo(
    () => getInspectorCsvTableConfig(control, value, sourceProps),
    [control, sourceProps, value],
  );
  const parsedRows = useMemo(() => parseInspectorCsvRows(value), [value]);
  const [draftState, setDraftState] = useState<InspectorCsvDraftState>(() => (
    createInspectorCsvDraftState(parsedRows, tableConfig)
  ));
  const colorTokenResults = useMemo(() => (
    tokenRegistry
      ? queryTokens(tokenRegistry, {
        allowedTypes: INSPECTOR_CSV_COLOR_TOKEN_TYPES,
        modeByCollection: previewTokenModes,
      })
      : []
  ), [previewTokenModes, tokenRegistry]);

  const openEditor = () => {
    setDragSubject(null);
    setDropTarget(null);
    setDraftState(createInspectorCsvDraftState(parseInspectorCsvRows(value), tableConfig));
    setEditorOpen(true);
  };
  const summaryColumns = getInspectorCsvVisibleColumns(tableConfig.columns, parsedRows, tableConfig.canAddColumn);
  const draftRows = draftState.rows;
  const visibleColumns = draftState.columns;
  const rowCount = parsedRows.length;
  const columnCount = summaryColumns.length;

  const updateCell = (rowIndex: number, columnIndex: number, nextValue: string) => {
    setDraftState((current) => ({
      ...current,
      rows: current.rows.map((row, candidateRowIndex) => {
        if (candidateRowIndex !== rowIndex) return row;
        const next = [...row];
        while (next.length <= columnIndex) next.push('');
        next[columnIndex] = nextValue;
        return next;
      }),
    }));
  };
  const addRow = () => {
    setDraftState((current) => ({
      ...current,
      rows: [
        ...current.rows,
        Array.from({ length: Math.max(current.columns.length, tableConfig.columns.length, 1) }, () => ''),
      ],
    }));
  };
  const addColumn = () => {
    if (!tableConfig.canAddColumn) return;
    setDraftState((current) => ({
      columns: [
        ...current.columns,
        createGenericInspectorCsvColumn(current.columns.length),
      ],
      rows: current.rows.map((row) => [...row, '']),
    }));
  };
  const removeRow = (rowIndex: number) => {
    setDraftState((current) => {
      const rows = current.rows.filter((_, candidateRowIndex) => candidateRowIndex !== rowIndex);
      return {
        ...current,
        rows: rows.length > 0 ? rows : createInspectorCsvDraftRows([], current.columns.length),
      };
    });
  };
  const beginDrag = (event: ReactDragEvent<HTMLElement>, subject: InspectorCsvDragSubject) => {
    setDragSubject(subject);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `csv-${subject.kind}-${subject.index}`);
  };
  const endDrag = () => {
    setDragSubject(null);
    setDropTarget(null);
  };
  const canDropOnRow = (rowIndex: number) => (
    dragSubject?.kind === 'row' &&
    dragSubject.index !== rowIndex &&
    draftRows.length > 1
  );
  const canDropOnColumn = (columnIndex: number) => {
    if (dragSubject?.kind !== 'column' || dragSubject.index === columnIndex) return false;
    const sourceColumn = visibleColumns[dragSubject.index];
    const targetColumn = visibleColumns[columnIndex];
    return Boolean(sourceColumn?.reorderable && targetColumn?.reorderable);
  };
  const moveRow = (sourceIndex: number, targetIndex: number) => {
    setDraftState((current) => ({
      ...current,
      rows: moveInspectorCsvItem(current.rows, sourceIndex, targetIndex),
    }));
  };
  const moveColumn = (sourceIndex: number, targetIndex: number) => {
    setDraftState((current) => ({
      columns: moveInspectorCsvItem(current.columns, sourceIndex, targetIndex),
      rows: moveInspectorCsvColumnInRows(current.rows, sourceIndex, targetIndex, current.columns.length),
    }));
  };
  const handleRowDragOver = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (!canDropOnRow(rowIndex)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget({ kind: 'row', index: rowIndex });
  };
  const handleColumnDragOver = (event: ReactDragEvent<HTMLTableCellElement>, columnIndex: number) => {
    if (!canDropOnColumn(columnIndex)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget({ kind: 'column', index: columnIndex });
  };
  const handleRowDrop = (event: ReactDragEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (!canDropOnRow(rowIndex) || dragSubject?.kind !== 'row') return;
    event.preventDefault();
    moveRow(dragSubject.index, rowIndex);
    endDrag();
  };
  const handleColumnDrop = (event: ReactDragEvent<HTMLTableCellElement>, columnIndex: number) => {
    if (!canDropOnColumn(columnIndex) || dragSubject?.kind !== 'column') return;
    event.preventDefault();
    moveColumn(dragSubject.index, columnIndex);
    endDrag();
  };
  const applyDraft = () => {
    const nextCsv = serializeInspectorCsvRows(draftRows);
    const siblingUpdates = getInspectorCsvSiblingUpdates(control, sourceProps, value, draftRows, visibleColumns);
    if (onCommitBatch && siblingUpdates.length > 0) {
      onCommitBatch([
        ...siblingUpdates,
        { propName: control.key, value: nextCsv || null },
      ]);
    } else {
      for (const update of siblingUpdates) {
        onCommitSibling?.(update.propName, update.value);
      }
      onCommit(nextCsv || null);
    }
    setEditorOpen(false);
  };

  return (
    <span className="wb-inspector-csv-control">
      <button
        type="button"
        className="wb-inspector-csv-control__summary"
        onClick={openEditor}
      >
        <span>
          <strong>{rowCount > 0 ? `${rowCount} rows` : 'No rows'}</strong>
          <small>{columnCount} columns</small>
        </span>
        <Pencil size={12} aria-hidden="true" />
      </button>
      {editorOpen ? (
        <ModalLayer
          className="wb-csv-editor-modal"
          title={`${control.label} table`}
          onClose={() => setEditorOpen(false)}
        >
          <div className="wb-csv-editor">
            <div className="wb-csv-editor-toolbar">
              <span>{draftRows.length} rows · {visibleColumns.length} columns</span>
              <span className="wb-csv-editor-toolbar__actions">
                {tableConfig.canAddColumn ? (
                  <Button onClick={addColumn}>
                    <Columns3 size={12} aria-hidden="true" />
                    Add column
                  </Button>
                ) : null}
                <Button onClick={addRow}>
                  <Plus size={12} aria-hidden="true" />
                  Add row
                </Button>
              </span>
            </div>
            <div className="wb-csv-editor-table-wrap">
              <table className="wb-csv-editor-table">
                <thead>
                  <tr>
                    {visibleColumns.map((column, columnIndex) => (
                      <th
                        key={column.key}
                        className={[
                          column.reorderable ? 'wb-csv-editor-table__column--reorderable' : '',
                          dropTarget?.kind === 'column' && dropTarget.index === columnIndex ? 'wb-csv-editor-table__column--drop-target' : '',
                          dragSubject?.kind === 'column' && dragSubject.index === columnIndex ? 'wb-csv-editor-table__column--dragging' : '',
                        ].filter(Boolean).join(' ')}
                        onDragLeave={() => {
                          if (dropTarget?.kind === 'column' && dropTarget.index === columnIndex) setDropTarget(null);
                        }}
                        onDragOver={(event) => handleColumnDragOver(event, columnIndex)}
                        onDrop={(event) => handleColumnDrop(event, columnIndex)}
                      >
                        <span className="wb-csv-editor-column-header">
                          {column.reorderable ? (
                            <button
                              type="button"
                              aria-label={`Drag ${column.label} column`}
                              className="wb-csv-editor-drag-button wb-csv-editor-column-drag"
                              draggable
                              onDragEnd={endDrag}
                              onDragStart={(event) => beginDrag(event, { kind: 'column', index: columnIndex })}
                            >
                              <GripVertical size={12} aria-hidden="true" />
                            </button>
                          ) : null}
                          <span>{column.label}</span>
                        </span>
                      </th>
                    ))}
                    <th className="wb-csv-editor-table__actions-column" aria-label="Row actions" />
                  </tr>
                </thead>
                <tbody>
                  {draftRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={[
                        dropTarget?.kind === 'row' && dropTarget.index === rowIndex ? 'wb-csv-editor-table__row--drop-target' : '',
                        dragSubject?.kind === 'row' && dragSubject.index === rowIndex ? 'wb-csv-editor-table__row--dragging' : '',
                      ].filter(Boolean).join(' ')}
                      onDragLeave={() => {
                        if (dropTarget?.kind === 'row' && dropTarget.index === rowIndex) setDropTarget(null);
                      }}
                      onDragOver={(event) => handleRowDragOver(event, rowIndex)}
                      onDrop={(event) => handleRowDrop(event, rowIndex)}
                    >
                      {visibleColumns.map((column, columnIndex) => (
                        <td key={column.key}>
                          <InspectorCsvCellEditor
                            colorTokenResults={colorTokenResults}
                            column={column}
                            columnIndex={columnIndex}
                            control={control}
                            previewTokenModes={previewTokenModes}
                            row={row}
                            rowIndex={rowIndex}
                            tokenRegistry={tokenRegistry}
                            onUpdateCell={updateCell}
                          />
                        </td>
                      ))}
                      <td className="wb-csv-editor-table__actions">
                        <button
                          type="button"
                          aria-label={`Drag row ${rowIndex + 1}`}
                          className="wb-csv-editor-drag-button wb-csv-editor-row-drag"
                          draggable={draftRows.length > 1}
                          disabled={draftRows.length <= 1}
                          onDragEnd={endDrag}
                          onDragStart={(event) => beginDrag(event, { kind: 'row', index: rowIndex })}
                        >
                          <GripVertical size={12} aria-hidden="true" />
                        </button>
                        <IconButton
                          label={`Remove row ${rowIndex + 1}`}
                          onClick={() => removeRow(rowIndex)}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="wb-modal-actions">
              <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button tone="primary" onClick={applyDraft}>Apply</Button>
            </div>
          </div>
        </ModalLayer>
      ) : null}
    </span>
  );
}

const INSPECTOR_CSV_COLOR_TOKEN_TYPES: TokenType[] = ['color', 'string'];
const INSPECTOR_DATA_CSV_CONTROL: WorkbenchStoryControl = {
  key: 'dataCsv',
  label: 'Data rows',
  multiline: true,
  type: 'text',
};
const INSPECTOR_SERIES_CSV_CONTROL: WorkbenchStoryControl = {
  key: 'seriesCsv',
  label: 'Series rows',
  multiline: true,
  type: 'text',
};

function InspectorCsvCellEditor({
  colorTokenResults,
  column,
  columnIndex,
  control,
  onUpdateCell,
  previewTokenModes,
  row,
  rowIndex,
  tokenRegistry,
}: {
  colorTokenResults: TokenPickerResult[];
  column: InspectorCsvColumn;
  columnIndex: number;
  control: WorkbenchStoryControl;
  onUpdateCell: (rowIndex: number, columnIndex: number, nextValue: string) => void;
  previewTokenModes: PreviewTokenModeSelection;
  row: string[];
  rowIndex: number;
  tokenRegistry?: TokenRegistry;
}) {
  const value = row[columnIndex] ?? '';
  const isColorColumn = isInspectorCsvColorColumn(control, column);
  const previewColorSchemeSide = useInspectorPreviewColorSchemeSide();
  const canPickColorToken = Boolean(tokenRegistry) && isColorColumn;
  const selectedColorToken = canPickColorToken
    ? findComponentPropTokenResultByRawValue(colorTokenResults, value)
    : null;
  const selectedColorReference = selectedColorToken
    ? { collectionId: selectedColorToken.collection.id, tokenId: selectedColorToken.token.id }
    : null;
  const i18nRegistry = tokenRegistry && !isColorColumn ? getI18nTokenRegistry(tokenRegistry) : null;
  const selectedI18nReference = i18nRegistry
    ? getI18nTokenReferenceByKey(i18nRegistry, value, previewTokenModes)
    : null;
  const selectedI18nToken = selectedI18nReference && i18nRegistry
    ? getI18nTokenResultByReference(i18nRegistry, selectedI18nReference, previewTokenModes)
    : null;
  const tokenPicker = canPickColorToken && tokenRegistry ? (
    <InspectorTokenPicker
      ariaLabel={`${column.label} row ${rowIndex + 1} token`}
      allowedTypes={INSPECTOR_CSV_COLOR_TOKEN_TYPES}
      className="wb-csv-editor-token-picker"
      modeByCollection={previewTokenModes}
      registry={tokenRegistry}
      selected={selectedColorReference}
      triggerMode="icon"
      onClear={() => {
        const detachedValue = selectedColorToken
          ? formatComponentPropDetachedTokenValue(selectedColorToken, tokenRegistry, previewColorSchemeSide)
          : null;
        onUpdateCell(rowIndex, columnIndex, detachedValue ?? '');
      }}
      onSelect={(reference) => {
        const result = colorTokenResults.find((candidate) => (
          candidate.collection.id === reference.collectionId &&
          candidate.token.id === reference.tokenId &&
          candidate.compatible
        ));
        onUpdateCell(
          rowIndex,
          columnIndex,
          result ? formatComponentPropTokenRawValue(result) : `var(${getProjectCollectionTokenCssVariableName(reference.collectionId, reference.tokenId)})`,
        );
      }}
    />
  ) : tokenRegistry ? (
    <SourceI18nTokenPicker
      ariaLabel={`${column.label} row ${rowIndex + 1} i18n token`}
      className="wb-csv-editor-token-picker"
      modeByCollection={previewTokenModes}
      registry={tokenRegistry}
      selectedKey={value}
      selectedReference={selectedI18nReference}
      onClear={() => onUpdateCell(rowIndex, columnIndex, selectedI18nToken?.previewText ?? '')}
      onSelect={(selection) => onUpdateCell(rowIndex, columnIndex, selection.key)}
    />
  ) : null;
  const selectedToken = selectedColorToken || selectedI18nToken;

  return (
    <TextField
      aria-label={`${column.label} row ${rowIndex + 1}`}
      className={[
        'wb-csv-editor-input',
        selectedToken ? 'wb-csv-editor-input--tokenized' : '',
      ].filter(Boolean).join(' ')}
      frameClassName={tokenPicker ? 'wb-csv-editor-token-frame' : ''}
      trailingSlot={tokenPicker}
      value={value}
      onValueChange={(nextValue) => onUpdateCell(rowIndex, columnIndex, nextValue)}
    />
  );
}

type InspectorCsvTableConfig = {
  canAddColumn: boolean;
  columns: InspectorCsvColumn[];
};

function getInspectorCsvTableConfig(
  control: WorkbenchStoryControl,
  value: string,
  sourceProps: WorkbenchStoryArgs,
): InspectorCsvTableConfig {
  if (control.key === 'seriesCsv') {
    return getInspectorSeriesCsvTableConfig();
  }

  if (control.key === 'dataCsv') {
    return getInspectorDataCsvTableConfigForSeries(
      sourceProps,
      value,
      parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv)),
    );
  }

  return {
    canAddColumn: true,
    columns: createGenericInspectorCsvColumns(value),
  };
}

function getInspectorSeriesCsvTableConfig(): InspectorCsvTableConfig {
  return {
    canAddColumn: false,
    columns: [
      { key: 'series-key', label: 'Key' },
      { key: 'series-label', label: 'Label' },
      { key: 'series-color', label: 'Color' },
    ],
  };
}

function getInspectorDataCsvTableConfigForSeries(
  sourceProps: WorkbenchStoryArgs,
  value: string,
  seriesRows: string[][],
): InspectorCsvTableConfig {
  const scatterColumns = getInspectorScatterCsvColumns(sourceProps);
  if (scatterColumns) return { canAddColumn: false, columns: scatterColumns };

  if (seriesRows.length > 0) {
    return {
      canAddColumn: false,
      columns: [
        { key: 'category', label: getStringWorkbenchStoryArg(sourceProps.categoryKey) || 'Category' },
        ...seriesRows.map((row, index) => ({
          key: `series-${index}`,
          label: row[1]?.trim() || row[0]?.trim() || `Series ${index + 1}`,
          reorderable: true,
          seriesRowIndex: index,
        })),
      ],
    };
  }

  const valueKey = getStringWorkbenchStoryArg(sourceProps.valueKey);
  if (valueKey || getStringWorkbenchStoryArg(sourceProps.nameKey)) {
    return {
      canAddColumn: false,
      columns: [
        { key: 'name', label: getStringWorkbenchStoryArg(sourceProps.nameKey) || 'Name' },
        { key: 'value', label: valueKey || 'Value' },
        { key: 'fill', label: 'Color' },
      ],
    };
  }

  return {
    canAddColumn: true,
    columns: createGenericInspectorCsvColumns(value),
  };
}

function shouldUseCombinedChartCsvControlSet(
  controls: WorkbenchStoryControl[],
  sourceProps: WorkbenchStoryArgs,
): boolean {
  return controls.some((control) => control.key === 'dataCsv') &&
    controls.some((control) => control.key === 'seriesCsv') &&
    parseInspectorCsvRows(getStringWorkbenchStoryArg(sourceProps.seriesCsv)).length > 0;
}

function shouldUseCombinedChartCsvEditor(
  control: WorkbenchStoryControl,
  sourceProps: WorkbenchStoryArgs,
): boolean {
  return control.key === 'dataCsv' && shouldUseCombinedChartCsvControlSet([control, INSPECTOR_SERIES_CSV_CONTROL], sourceProps);
}

function isInspectorCsvColorColumn(control: WorkbenchStoryControl, column: InspectorCsvColumn): boolean {
  if (control.key === 'seriesCsv') return column.key === 'series-color';
  if (control.key === 'dataCsv') return column.key === 'fill';
  return false;
}

function getInspectorScatterCsvColumns(sourceProps: WorkbenchStoryArgs): InspectorCsvColumn[] | null {
  const xKey = getStringWorkbenchStoryArg(sourceProps.xKey);
  const yKey = getStringWorkbenchStoryArg(sourceProps.yKey);
  if (!xKey && !yKey) return null;
  return [
    { key: 'series', label: getStringWorkbenchStoryArg(sourceProps.seriesKey) || 'Series' },
    { key: 'x', label: xKey || 'X' },
    { key: 'y', label: yKey || 'Y' },
    { key: 'z', label: getStringWorkbenchStoryArg(sourceProps.zKey) || 'Size' },
    { key: 'name', label: getStringWorkbenchStoryArg(sourceProps.nameKey) || 'Name' },
  ];
}

function createGenericInspectorCsvColumns(value: string): InspectorCsvColumn[] {
  const rows = parseInspectorCsvRows(value);
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  return Array.from({ length: columnCount }, (_, index) => createGenericInspectorCsvColumn(index));
}

function createGenericInspectorCsvColumn(index: number): InspectorCsvColumn {
  return {
    key: `column-${index}`,
    label: `Column ${index + 1}`,
    reorderable: true,
  };
}

function getInspectorCsvVisibleColumns(
  columns: InspectorCsvColumn[],
  rows: string[][],
  extraColumnsReorderable = false,
): InspectorCsvColumn[] {
  const columnCount = Math.max(columns.length, 1, ...rows.map((row) => row.length));
  return Array.from({ length: columnCount }, (_, index) => (
    columns[index] ?? {
      ...createGenericInspectorCsvColumn(index),
      reorderable: extraColumnsReorderable,
    }
  ));
}

function createInspectorCsvDraftRows(rows: string[][], columnCount: number): string[][] {
  const normalizedColumnCount = Math.max(columnCount, 1, ...rows.map((row) => row.length));
  const normalizedRows = rows.length > 0 ? rows : [Array.from({ length: normalizedColumnCount }, () => '')];
  return normalizedRows.map((row) => {
    const next = [...row];
    while (next.length < normalizedColumnCount) next.push('');
    return next;
  });
}

function createInspectorSeriesCsvRow(currentRows: string[][]): string[] {
  const usedKeys = new Set(currentRows.map((row) => row[0]?.trim()).filter(Boolean));
  let index = currentRows.length + 1;
  while (usedKeys.has(`series${index}`)) index += 1;
  return [`series${index}`, `Series ${index}`, ''];
}

function getStringWorkbenchStoryArg(value: WorkbenchStoryArgValue | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

type PopoverAnchorCandidate = {
  elementId: string | null;
  label: string;
  node: EditableTreeNode;
  optionValue: string;
  stableId: string | null;
};

function PopoverAnchorPropControl({
  currentValue,
  onCommit,
  onSourceNodeComponentPropChange,
  selectedSourceNode,
  sourceDocumentRoot,
}: {
  currentValue: string;
  onCommit: (value: SourceComponentPropValue) => void;
  onSourceNodeComponentPropChange: (node: EditableTreeNode, propName: string, value: SourceComponentPropValue) => void;
  selectedSourceNode: EditableTreeNode | null;
  sourceDocumentRoot: EditableTreeNode | null;
}) {
  const candidates = useMemo(
    () => getPopoverAnchorCandidates(sourceDocumentRoot, selectedSourceNode),
    [selectedSourceNode, sourceDocumentRoot],
  );
  const matchedCandidate = candidates.find((candidate) => (
    candidate.stableId === currentValue ||
    candidate.node.id === currentValue ||
    candidate.elementId === currentValue
  ));
  const selectValue = matchedCandidate?.optionValue ?? (currentValue ? `value:${currentValue}` : '');

  useEffect(() => {
    if (!matchedCandidate) return;
    const stableId = matchedCandidate.stableId ?? createWorkbenchAnchorId(matchedCandidate.node);
    if (!matchedCandidate.stableId) {
      onSourceNodeComponentPropChange(matchedCandidate.node, 'data-wbid', stableId);
    }
    if (currentValue !== stableId) {
      onCommit(stableId);
    }
  }, [currentValue, matchedCandidate, onCommit, onSourceNodeComponentPropChange]);

  if (candidates.length === 0) {
    return (
      <span className="wb-inspector-anchor-control">
        <SourceAttributeControl
          ariaLabel="Anchor Id prop"
          value={currentValue}
          onCommit={onCommit}
        />
        <span className="wb-inspector-anchor-control__hint">No page trigger node</span>
      </span>
    );
  }

  return (
    <SelectControl
      aria-label="Trigger prop"
      className="wb-inspector-source-select"
      value={selectValue}
      onValueChange={(nextValue) => {
        if (!nextValue) {
          onCommit(null);
          return;
        }
        if (nextValue.startsWith('value:')) {
          onCommit(nextValue.slice('value:'.length));
          return;
        }
        const candidate = candidates.find((item) => item.optionValue === nextValue);
        if (!candidate) return;
        const stableId = candidate.stableId ?? createWorkbenchAnchorId(candidate.node);
        if (!candidate.stableId) {
          onSourceNodeComponentPropChange(candidate.node, 'data-wbid', stableId);
        }
        onCommit(stableId);
      }}
    >
      <option value="">No trigger</option>
      {currentValue && !matchedCandidate ? <option value={`value:${currentValue}`}>{currentValue} (missing)</option> : null}
      {candidates.map((candidate) => (
        <option key={candidate.optionValue} value={candidate.optionValue}>
          {candidate.label}
        </option>
      ))}
    </SelectControl>
  );
}

function isPopoverAnchorIdControl(control: WorkbenchStoryControl, selectedSourceNode: EditableTreeNode | null): boolean {
  return control.key === 'anchorId' && selectedSourceNode?.source?.jsxName === 'MagentaPopover';
}

function getPopoverAnchorCandidates(
  root: EditableTreeNode | null,
  selectedNode: EditableTreeNode | null,
): PopoverAnchorCandidate[] {
  if (!root || !selectedNode) return [];
  const candidates: PopoverAnchorCandidate[] = [];
  visitPopoverAnchorCandidate(root, selectedNode, [], candidates);
  return candidates;
}

function visitPopoverAnchorCandidate(
  node: EditableTreeNode,
  selectedNode: EditableTreeNode,
  path: string[],
  candidates: PopoverAnchorCandidate[],
) {
  const nextPath = [...path, node.label];
  if (node.id !== selectedNode.id && isPopoverAnchorCandidateNode(node)) {
    const elementId = getEditableTreeElementId(node);
    const stableId = getWorkbenchStableNodeId(node);
    const optionValue = stableId ? `stable:${stableId}` : `node:${node.id}`;
    candidates.push({
      elementId,
      label: `${nextPath.join(' / ')}${elementId ? ` · #${elementId}` : ''}`,
      node,
      optionValue,
      stableId,
    });
  }
  for (const child of node.children ?? []) {
    visitPopoverAnchorCandidate(child, selectedNode, nextPath, candidates);
  }
}

function isPopoverAnchorCandidateNode(node: EditableTreeNode): boolean {
  const jsxName = node.source?.jsxName ?? '';
  if (jsxName === 'MagentaPopover') return false;
  if (node.kind === 'text') return false;
  if (getEditableTreeElementId(node)) return true;
  return isLikelyPopoverTriggerNode(node);
}

function getEditableTreeElementId(node: EditableTreeNode): string | null {
  const propId = node.sourceProps?.id;
  if (typeof propId === 'string' && propId.trim()) return propId.trim();
  const attributeId = node.sourceAttributes?.id;
  if (typeof attributeId === 'string' && attributeId.trim()) return attributeId.trim();
  return null;
}

function getWorkbenchStableNodeId(node: EditableTreeNode): string | null {
  const propId = node.sourceProps?.['data-wbid'];
  if (typeof propId === 'string' && propId.trim()) return propId.trim();
  const attributeId = node.sourceAttributes?.['data-wbid'];
  if (typeof attributeId === 'string' && attributeId.trim()) return attributeId.trim();
  return null;
}

function createWorkbenchAnchorId(node: EditableTreeNode): string {
  const sourceName = node.source?.jsxName ?? node.label;
  const slug = sourceName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const fingerprint = node.id
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-10);
  return `wb-${slug || 'trigger'}-${fingerprint || 'anchor'}`;
}

function isLikelyPopoverTriggerNode(node: EditableTreeNode): boolean {
  const jsxName = node.source?.jsxName ?? node.label;
  const normalizedName = jsxName.replace(/^Magenta/, '').toLowerCase();
  if ([
    'button',
    'floatbutton',
    'iconbutton',
    'link',
    'avatar',
    'brandmark',
    'tag',
    'chip',
    'sidebaritem',
    'tab',
    'tabsitem',
    'popoveritem',
  ].includes(normalizedName)) return true;
  const role = node.sourceProps?.role ?? node.sourceAttributes?.role;
  if (typeof role === 'string' && ['button', 'link', 'menuitem', 'tab'].includes(role)) return true;
  const tabIndex = node.sourceProps?.tabIndex ?? node.sourceAttributes?.tabindex;
  return typeof tabIndex === 'string' && tabIndex.trim().length > 0;
}

function SourceValueMetadataControl({
  ariaLabel,
  onDetach,
  source,
}: {
  ariaLabel: string;
  onDetach?: () => void;
  source: EditableTreeSourceValueMetadataEntry;
}) {
  const label = source.kind === 'spread' ? 'Spread' : 'Expression';
  const value = source.kind === 'literal' ? source.value : source.code;
  const canDetach = source.kind === 'expression' && Boolean(source.detachableValue) && onDetach;

  return (
    <span className="wb-inspector-source-value-readonly" aria-label={ariaLabel}>
      <span className="wb-inspector-source-value-badge">{label}</span>
      <code>{value}</code>
      {canDetach ? (
        <Button className="wb-inspector-source-value-detach" onClick={onDetach}>
          Use {source.detachableValue}
        </Button>
      ) : null}
    </span>
  );
}

function SourceI18nTokenPicker({
  ariaLabel,
  className,
  modeByCollection,
  onClear,
  onSelect,
  registry,
  selectedKey,
  selectedReference,
}: {
  ariaLabel: string;
  className?: string;
  modeByCollection: PreviewTokenModeSelection;
  onClear: () => void;
  onSelect: (selection: { key: string; previewText: string | null; reference: TokenReference }) => void;
  registry: TokenRegistry;
  selectedKey?: string | null;
  selectedReference?: TokenReference | null;
}) {
  const i18nRegistry = getI18nTokenRegistry(registry);
  if (!i18nRegistry) {
    return <DisabledSourceI18nTokenPicker ariaLabel={ariaLabel} className={className} />;
  }

  const selected = selectedReference && isI18nTokenReference(i18nRegistry, selectedReference)
    ? selectedReference
    : selectedKey
      ? getI18nTokenReferenceByKey(i18nRegistry, selectedKey, modeByCollection)
      : null;

  return (
    <InspectorTokenPicker
      ariaLabel={ariaLabel}
      allowedTypes={['string']}
      className={className}
      modeByCollection={modeByCollection}
      registry={i18nRegistry}
      selected={selected}
      triggerMode="icon"
      onClear={onClear}
      onSelect={(reference) => {
        const result = getI18nTokenResultByReference(i18nRegistry, reference, modeByCollection);
        onSelect({
          key: result ? getI18nTokenKey(result) : reference.tokenId,
          previewText: result?.previewText ?? null,
          reference,
        });
      }}
    />
  );
}

function DisabledSourceI18nTokenPicker({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span
      className={[
        'wb-token-picker',
        'wb-token-picker--inspector',
        'wb-token-picker--icon-trigger',
        'wb-token-picker--disabled',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className="wb-token-picker-trigger wb-token-picker-trigger--icon"
        disabled
        title="No i18n tokens available"
      >
        <span className="wb-token-picker-trigger-icon">
          <Link2 size={13} />
        </span>
      </button>
    </span>
  );
}

function getI18nTokenRegistry(registry: TokenRegistry): TokenRegistry | null {
  const collections = registry.collections
    .filter(isCollectionI18n)
    .map((collection) => ({
      ...collection,
      tokens: collection.tokens.filter((token) => token.type === 'string'),
    }))
    .filter((collection) => collection.tokens.length > 0);

  return collections.length > 0 ? { ...registry, collections } : null;
}

function getI18nTokenReferenceByKey(
  registry: TokenRegistry,
  key: string,
  modeByCollection: PreviewTokenModeSelection,
): TokenReference | null {
  const normalizedKey = key.trim();
  if (!normalizedKey) return null;
  const result = queryI18nTokenResults(registry, modeByCollection).find((candidate) => (
    getI18nTokenKey(candidate) === normalizedKey ||
    getI18nTokenName(candidate) === normalizedKey ||
    candidate.token.id === normalizedKey
  ));
  return result ? { collectionId: result.collection.id, tokenId: result.token.id } : null;
}

function getI18nTokenResultByReference(
  registry: TokenRegistry,
  reference: TokenReference,
  modeByCollection: PreviewTokenModeSelection,
): TokenPickerResult | null {
  return queryI18nTokenResults(registry, modeByCollection).find((candidate) => (
    candidate.collection.id === reference.collectionId && candidate.token.id === reference.tokenId
  )) ?? null;
}

function isI18nTokenReference(registry: TokenRegistry, reference: TokenReference): boolean {
  return registry.collections.some((collection) => (
    collection.id === reference.collectionId && collection.tokens.some((token) => token.id === reference.tokenId)
  ));
}

function queryI18nTokenResults(
  registry: TokenRegistry,
  modeByCollection: PreviewTokenModeSelection,
): TokenPickerResult[] {
  return queryTokens(registry, {
    allowedTypes: ['string'],
    modeByCollection,
  }).filter((candidate) => candidate.compatible);
}

function getI18nTokenKey(result: TokenPickerResult): string {
  return `${getI18nCollectionName(result)}.${getI18nTokenName(result)}`;
}

function getI18nCollectionName(result: TokenPickerResult): string {
  return result.collection.name?.trim() || result.collection.id;
}

function getI18nTokenName(result: TokenPickerResult): string {
  return result.token.name?.trim() || result.token.id;
}

function getComponentPropTokenAllowedTypes(control: WorkbenchStoryControl): TokenType[] | null {
  if (control.picker === 'none' || control.picker === 'asset') return null;
  const configuredTypes = getConfiguredComponentPropTokenTypes(control);
  if (configuredTypes) return configuredTypes;
  if (control.picker === 'token' || control.picker === 'asset-token') return ['string'];
  if (control.type !== 'text') {
    return isStringTokenBindableComponentProp(control) ? ['string'] : null;
  }
  const propTerms = getComponentPropAssetTerms(control);
  if (isCssColorComponentTokenProp(propTerms)) return ['color', 'string'];
  if (isCssBackgroundComponentTokenProp(propTerms)) return ['color', 'gradient', 'string'];
  return isStringTokenBindableComponentProp(control) ? ['string'] : null;
}

function getConfiguredComponentPropTokenTypes(control: WorkbenchStoryControl): TokenType[] | null {
  const tokenTypes = control.tokenTypes?.filter((type): type is TokenType => (
    type === 'angle' ||
    type === 'boolean' ||
    type === 'color' ||
    type === 'dimension' ||
    type === 'duration' ||
    type === 'gradient' ||
    type === 'number' ||
    type === 'opacity' ||
    type === 'string'
  ));
  return tokenTypes && tokenTypes.length > 0 ? tokenTypes : null;
}

function isStringTokenBindableComponentProp(control: WorkbenchStoryControl): boolean {
  return control.type === 'text' ||
    control.key === 'headerMediaBackgroundImage' ||
    control.key === 'headerSymbolImage' ||
    control.key === 'headerLogoImage';
}

function getComponentPropTokenKey(propName: string): string {
  return `${propName}Token`;
}

function getComponentPropTokenCollectionKey(propName: string): string {
  return `${propName}TokenCollection`;
}

function getComponentPropTokenBinding(propName: string, sourceProps: WorkbenchStoryArgs): TokenReference | null {
  const tokenId = sourceProps[getComponentPropTokenKey(propName)];
  const collectionId = sourceProps[getComponentPropTokenCollectionKey(propName)];
  return typeof tokenId === 'string' && tokenId.trim() && typeof collectionId === 'string' && collectionId.trim()
    ? { collectionId, tokenId }
    : null;
}

function findComponentPropTokenResult(
  registry: TokenRegistry,
  allowedTypes: TokenType[],
  reference: TokenReference | null,
  propValue: string,
  modeByCollection: PreviewTokenModeSelection,
): TokenPickerResult | null {
  const results = queryTokens(registry, { allowedTypes, modeByCollection });
  if (reference) {
    const selected = results.find((result) => (
      result.collection.id === reference.collectionId &&
      result.token.id === reference.tokenId &&
      result.compatible
    ));
    if (selected) return selected;
  }

  return findComponentPropTokenResultByRawValue(results, propValue);
}

function findComponentPropTokenResultByRawValue(
  results: TokenPickerResult[],
  propValue: string,
): TokenPickerResult | null {
  const normalizedValue = normalizeComponentPropCssVariableValue(propValue);
  if (!normalizedValue) return null;
  return results.find((result) => (
    result.compatible &&
    getComponentPropTokenCssVariableAliases(result).some((alias) => alias === normalizedValue)
  )) ?? null;
}

function formatComponentPropTokenDisplayValue(result: TokenPickerResult): string {
  return `${result.collection.name} · ${result.token.name}`;
}

function formatComponentPropTokenRawValue(result: TokenPickerResult): string {
  return result.cssVariable ?? `var(${getProjectCollectionTokenCssVariableName(result.collection.id, result.token.id)})`;
}

function formatComponentPropDetachedTokenValue(
  result: TokenPickerResult,
  registry: TokenRegistry,
  colorSchemeSide: WorkbenchColorSchemeSide,
): string | null {
  return getTokenPreviewCss(result, registry, colorSchemeSide) ?? result.previewText;
}

function getComponentPropTokenCssVariableAliases(result: TokenPickerResult): string[] {
  const aliases = [
    ...result.cssVariableAliases,
    result.cssVariable,
    `var(--${result.token.id})`,
    `var(--color-${result.token.id})`,
    `var(${getProjectCollectionTokenCssVariableName(result.collection.id, result.token.id)})`,
  ];
  for (const namespace of getComponentPropTokenCssNamespaces(result.token.type)) {
    aliases.push(`var(${getProjectTokenCssVariableName(namespace, result.token.id)})`);
    aliases.push(`var(${getLegacyProjectTokenCssVariableName(namespace, result.token.id)})`);
  }
  return Array.from(new Set(aliases.flatMap((alias) => {
    const normalized = normalizeComponentPropCssVariableValue(alias);
    return normalized ? [normalized] : [];
  })));
}

function getComponentPropTokenCssNamespaces(type: TokenType): string[] {
  if (type === 'color' || type === 'gradient') return ['color'];
  if (type === 'dimension') return ['spacing', 'fontSize', 'borderRadius', 'borderWidth'];
  if (type === 'number') return ['fontWeight'];
  if (type === 'opacity') return ['opacity'];
  return [];
}

function normalizeComponentPropCssVariableValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const variable = trimmed.match(/^var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,[\s\S]*)?\)$/)?.[1] ??
    trimmed.match(/^(--[a-zA-Z0-9_-]+)$/)?.[1];
  return variable ? `var(${variable})` : null;
}

function shouldStoreComponentPropTokenOnly(control: WorkbenchStoryControl, node: EditableTreeNode | null): boolean {
  void control;
  void node;
  return false;
}



function shouldPreserveEmptyComponentProp(control: WorkbenchStoryControl, node: EditableTreeNode | null): boolean {
  if (control.type !== 'text') return false;
  void node;
  return false;
}

function shouldPreserveEmptyDefaultTextProp(control: WorkbenchStoryControl, defaultArgs: WorkbenchStoryArgs): boolean {
  if (control.type !== 'text') return false;
  const defaultValue = defaultArgs[control.key];
  return typeof defaultValue === 'string' && defaultValue.length > 0;
}

function getInspectorSourceComponentControlValue(
  control: WorkbenchStoryControl,
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
): WorkbenchStoryArgValue {
  if (Object.prototype.hasOwnProperty.call(sourceProps, control.key)) {
    return sourceProps[control.key] ?? '';
  }
  if (isCsvTableComponentProp(control)) return getWorkbenchStoryControlValue(control.key, sourceProps, defaultArgs);
  if (control.type === 'boolean') return getBooleanControlDefaultValue(control.key, sourceProps, defaultArgs);
  if (control.type === 'number') return getWorkbenchStoryControlValue(control.key, sourceProps, defaultArgs);
  if (control.type === 'select') return getWorkbenchStoryControlValue(control.key, sourceProps, defaultArgs);
  return '';
}

function getBooleanControlDefaultValue(
  key: string,
  sourceProps: WorkbenchStoryArgs,
  defaultArgs: WorkbenchStoryArgs,
): boolean {
  const value = getWorkbenchStoryControlValue(key, sourceProps, defaultArgs);
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  return false;
}

function ComponentNumberPropControl({
  control,
  onCommit,
  value,
}: {
  control: Extract<WorkbenchStoryControl, { type: 'number' }>;
  onCommit: (value: SourceComponentPropValue) => void;
  value: number | string;
}) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const finiteValue = Number.isFinite(numericValue) ? numericValue : 0;
  const step = getFiniteNumberStep(control.step ?? control.scrubStep);
  const scrubStep = getFiniteNumberStep(control.scrubStep ?? step);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(formatNumberInputValue(finiteValue));

  useEffect(() => {
    if (isEditing) return;
    setDraft(formatNumberInputValue(finiteValue));
  }, [finiteValue, isEditing]);

  function commitNumber(nextValue: number) {
    const normalizedValue = normalizeScrubValue(nextValue, control.min, control.max, scrubStep);
    const formattedValue = formatNumberInputValue(normalizedValue);
    setDraft(formattedValue);
    onCommit(normalizedValue);
  }

  function commitTypedNumber(nextValue: number, syncDraft: boolean) {
    const normalizedValue = normalizeTypedNumberValue(nextValue, control.min, control.max);
    const formattedValue = formatNumberInputValue(normalizedValue);
    if (syncDraft) setDraft(formattedValue);
    onCommit(normalizedValue);
  }

  const { startScrub } = useNumberScrub({
    max: control.max,
    min: control.min,
    onChange: commitNumber,
    scrubStep,
    value: finiteValue,
  });

  function commitDraft() {
    const parsedValue = parseNumberDraft(draft);
    if (parsedValue === null) {
      setDraft(formatNumberInputValue(finiteValue));
      return;
    }
    commitTypedNumber(parsedValue, true);
  }

  function handleDraftChange(nextDraft: string) {
    setDraft(nextDraft);
    const parsedValue = parseNumberDraft(nextDraft);
    if (parsedValue === null) return;
    commitTypedNumber(parsedValue, false);
  }

  return (
    <div className="wb-number-value-editor">
      <div
        className="wb-token-number-field"
        onPointerDown={(event) => {
          const pointerTarget = event.target;
          startScrub(event, {
            onActivate: () => {
              if (pointerTarget instanceof HTMLInputElement) pointerTarget.blur();
            },
          });
        }}
      >
        <NumberScrubHandle
          label={`Adjust ${control.label} prop`}
          max={control.max}
          min={control.min}
          scrubStep={scrubStep}
          value={finiteValue}
          onChange={commitNumber}
        >
          {control.leading ?? control.label}
        </NumberScrubHandle>
        <InlineEditInput
          ariaLabel={`${control.label} prop`}
          max={control.max}
          min={control.min}
          step={step}
          type="text"
          value={draft}
          inputMode="decimal"
          onBlur={() => {
            setIsEditing(false);
            commitDraft();
          }}
          onChange={handleDraftChange}
          onFocus={() => setIsEditing(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitDraft();
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setDraft(formatNumberInputValue(finiteValue));
              event.currentTarget.blur();
            }
          }}
        />
      </div>
    </div>
  );
}

function getFiniteNumberStep(step: number | undefined): number {
  return typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
}

function parseNumberDraft(value: string): number | null {
  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue === '-' || trimmedValue === '+' || trimmedValue === '.' || trimmedValue === '-.' || trimmedValue === '+.') {
    return null;
  }
  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeTypedNumberValue(value: number, min: number | undefined, max: number | undefined): number {
  const finiteValue = Number.isFinite(value) ? value : 0;
  return Math.max(min ?? -Infinity, Math.min(max ?? Infinity, finiteValue));
}

function formatNumberInputValue(value: number): string {
  const finiteValue = Number.isFinite(value) ? value : 0;
  return String(Number(finiteValue.toFixed(6)));
}

function ComponentIconPropControl({
  ariaLabel,
  assetRegistry,
  control,
  onCommit,
  value,
}: {
  ariaLabel: string;
  assetRegistry?: WorkbenchAssetRegistry;
  control: WorkbenchStoryControl;
  onCommit: (value: SourceComponentPropValue) => void;
  value: string;
}) {
  const trimmedValue = value.trim();
  const isDirectAssetValue = isIconAssetSourceValue(trimmedValue);
  const useAssetValue = control.picker === 'asset' || control.picker === 'asset-token';
  const normalizedValue = isDirectAssetValue ? trimmedValue : normalizeWorkbenchIconKey(value);
  const iconOptions = getWorkbenchDefaultIconPreviewOptions(assetRegistry);
  const selectedIcon = iconOptions.find((option) => (
    option.key === normalizedValue ||
    option.value === trimmedValue
  )) ?? null;
  const selectedIconSource = selectedIcon?.value ?? (isDirectAssetValue ? trimmedValue : null);
  const selectedIconLabel = selectedIcon
    ? formatAssetPreviewOptionLabel(selectedIcon)
    : normalizedValue || (iconOptions.length === 0 ? 'No default icon set' : 'Select icon');

  return (
    <AssetPickerButton
      ariaLabel={ariaLabel}
      assets={assetRegistry}
      className="wb-icon-picker"
      iconScope={useAssetValue ? 'all' : 'default'}
      kinds={['icon']}
      onClear={trimmedValue ? () => onCommit('') : undefined}
      onSelect={(asset) => onCommit(getDesignAssetUsageValue(asset))}
      onSelectPreview={(preview) => onCommit(formatPreviewAssetValueForComponentProp(control, preview))}
      selectedPreviewKey={normalizedValue}
      triggerClassName="wb-icon-picker-trigger"
      triggerContent={(
        <>
          <span className="wb-icon-picker-trigger-preview" aria-hidden="true">
            {selectedIconSource ? <img className="wb-icon-preview-image" src={selectedIconSource} alt="" draggable={false} /> : null}
          </span>
          <span className={normalizedValue ? 'wb-icon-picker-trigger-label' : 'wb-icon-picker-trigger-label wb-icon-picker-trigger-label--empty'}>
            {selectedIconLabel}
          </span>
        </>
      )}
    />
  );
}

function getProjectDefaultIconStoryArgs(
  args: WorkbenchStoryArgs,
  controls: WorkbenchStoryControl[],
  assetRegistry: WorkbenchAssetRegistry | undefined,
): WorkbenchStoryArgs {
  const iconOptions = getWorkbenchDefaultIconPreviewOptions(assetRegistry);
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

type AssetPreviewOption = WorkbenchIconPreviewOption;

const ASSET_PICKER_PAGE_SIZE = 120;
const ASSET_PICKER_SCROLL_LOAD_OFFSET = 96;
const ASSET_PICKER_ALL_FILTER = 'all';
type AssetPickerIconScope = 'all' | 'default';
type AssetPickerIconSort = 'type' | 'name' | 'folder';
type AssetPickerFilterOption = { label: string; value: string };

function AssetPickerButton({
  ariaLabel,
  assets,
  className,
  iconScope = 'all',
  kinds,
  onClear,
  onSelect,
  onSelectPreview,
  selectedPreviewKey,
  triggerClassName,
  triggerContent,
}: {
  ariaLabel: string;
  assets?: WorkbenchAssetRegistry;
  className?: string;
  iconScope?: AssetPickerIconScope;
  kinds: WorkbenchDesignAssetKind[];
  onClear?: () => void;
  onSelect: (asset: WorkbenchDesignAsset) => void;
  onSelectPreview?: (preview: AssetPreviewOption, kind: WorkbenchDesignAssetKind) => void;
  selectedPreviewKey?: string;
  triggerClassName?: string;
  triggerContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeKind, setActiveKind] = useState<WorkbenchDesignAssetKind>(kinds[0] ?? 'image');
  const [iconFolderFilter, setIconFolderFilter] = useState(ASSET_PICKER_ALL_FILTER);
  const [iconSort, setIconSort] = useState<AssetPickerIconSort>('type');
  const [iconStyleFilter, setIconStyleFilter] = useState(ASSET_PICKER_ALL_FILTER);
  const [visibleCount, setVisibleCount] = useState(ASSET_PICKER_PAGE_SIZE);
  const pickerRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverLayout = useAssetPickerPopoverLayout(open, pickerRef);
  const kindSet = new Set(kinds);
  const scopedAssets = getAssetPickerScopedAssets(assets, iconScope);
  const query = search.trim().toLowerCase();
  const availableKinds = kinds.filter((kind) => hasAssetsForKind(scopedAssets, kind));
  const selectedKind = availableKinds.includes(activeKind) ? activeKind : availableKinds[0] ?? activeKind;
  const rawPreviewOptions = scopedAssets.flatMap((asset) => {
    if (getEffectiveDesignAssetKind(asset) !== selectedKind) return [];
    return getAssetPreviewOptions(asset);
  });
  const iconStyleOptions = selectedKind === 'icon' ? getAssetPickerIconStyleOptions(rawPreviewOptions) : [];
  const iconFolderOptions = selectedKind === 'icon' ? getAssetPickerIconFolderOptions(rawPreviewOptions) : [];
  const selectedIconStyleFilter = iconStyleOptions.some((option) => option.value === iconStyleFilter)
    ? iconStyleFilter
    : ASSET_PICKER_ALL_FILTER;
  const selectedIconFolderFilter = iconFolderOptions.some((option) => option.value === iconFolderFilter)
    ? iconFolderFilter
    : ASSET_PICKER_ALL_FILTER;
  const previewOptions = sortAssetPickerPreviewOptions(rawPreviewOptions.filter((preview) => (
    (selectedKind !== 'icon' || selectedIconStyleFilter === ASSET_PICKER_ALL_FILTER || getAssetPreviewStyleFilterValue(preview) === selectedIconStyleFilter) &&
    (selectedKind !== 'icon' || selectedIconFolderFilter === ASSET_PICKER_ALL_FILTER || getAssetPreviewFolderFilterValue(preview) === selectedIconFolderFilter) &&
    (!query || [preview.name, preview.importName, preview.sourceAssetName, preview.style, preview.sourceFile, getAssetPreviewFolderLabel(preview)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)))
  )), selectedKind === 'icon' ? iconSort : 'type');
  const assetOptions = scopedAssets.filter((asset) => (
    getEffectiveDesignAssetKind(asset) === selectedKind &&
    !(asset.kind === 'icon' && getWorkbenchIconPreviewOptions(asset).length > 0) &&
    !(asset.kind === 'image' && getWorkbenchImagePreviewOptions(asset).length > 0) &&
    (!query || [asset.name, asset.fileName, getEffectiveDesignAssetKind(asset), ...asset.tags].filter(Boolean).some((value) => value!.toLowerCase().includes(query)))
  ));
  const allOptions = [
    ...assetOptions.map((asset) => ({ kind: 'asset' as const, asset })),
    ...previewOptions.map((preview) => ({ kind: 'preview' as const, preview })),
  ];
  const visibleOptions = allOptions.slice(0, visibleCount);
  const hasMore = visibleOptions.length < allOptions.length;
  const disabled = scopedAssets.filter((asset) => kindSet.has(getEffectiveDesignAssetKind(asset))).length === 0;
  const showIconPickerControls = selectedKind === 'icon' && rawPreviewOptions.length > 0;

  const loadMoreAssetPickerOptions = useCallback(() => {
    setVisibleCount((current) => Math.min(allOptions.length, current + ASSET_PICKER_PAGE_SIZE));
  }, [allOptions.length]);

  useEffect(() => {
    setVisibleCount(ASSET_PICKER_PAGE_SIZE);
    if (popoverRef.current) popoverRef.current.scrollTop = 0;
  }, [iconSort, search, selectedIconFolderFilter, selectedIconStyleFilter, selectedKind]);

  useEffect(() => {
    if (!open || !hasMore) return;
    const popover = popoverRef.current;
    if (!popover) return;
    if (popover.scrollHeight - popover.clientHeight <= ASSET_PICKER_SCROLL_LOAD_OFFSET) {
      loadMoreAssetPickerOptions();
    }
  }, [hasMore, loadMoreAssetPickerOptions, open, visibleOptions.length]);

  useEffect(() => {
    if (availableKinds.length > 0 && !availableKinds.includes(activeKind)) {
      setActiveKind(availableKinds[0]!);
    }
  }, [activeKind, availableKinds]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <span className={className ? `wb-inspector-asset-picker ${className}` : 'wb-inspector-asset-picker'} ref={pickerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={triggerClassName ?? 'wb-inspector-asset-picker-trigger'}
        disabled={disabled}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        {triggerContent ?? <ImageIcon size={13} aria-hidden="true" />}
      </button>
      {open && !disabled && popoverLayout ? createPortal(
        <div
          className="wb-popover-panel wb-popover-panel--form wb-inspector-asset-picker-popover"
          ref={popoverRef}
          role="dialog"
          aria-label={ariaLabel}
          style={popoverLayout}
          onMouseDown={(event) => event.stopPropagation()}
          onScroll={(event) => {
            if (!hasMore) return;
            const target = event.currentTarget;
            const remainingScroll = target.scrollHeight - target.scrollTop - target.clientHeight;
            if (remainingScroll <= ASSET_PICKER_SCROLL_LOAD_OFFSET) loadMoreAssetPickerOptions();
          }}
        >
          {availableKinds.length > 1 ? (
            <SelectControl<WorkbenchDesignAssetKind>
              aria-label={`${ariaLabel} kind`}
              className="wb-inspector-asset-kind-select"
              value={selectedKind}
              onValueChange={setActiveKind}
            >
              {availableKinds.map((kind) => (
                <option key={kind} value={kind}>{formatAssetKindLabel(kind)}</option>
              ))}
            </SelectControl>
          ) : null}
          <TextField
            aria-label={`${ariaLabel} search`}
            className="wb-inspector-asset-picker-search"
            placeholder="Search assets"
            value={search}
            onValueChange={setSearch}
          />
          {showIconPickerControls ? (
            <div className="wb-inspector-asset-picker-filters">
              <SelectControl
                aria-label="Icon type"
                value={selectedIconStyleFilter}
                onValueChange={setIconStyleFilter}
              >
                <option value={ASSET_PICKER_ALL_FILTER}>All types</option>
                {iconStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectControl>
              <SelectControl
                aria-label="Icon folder"
                value={selectedIconFolderFilter}
                onValueChange={setIconFolderFilter}
              >
                <option value={ASSET_PICKER_ALL_FILTER}>All folders</option>
                {iconFolderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectControl>
              <SelectControl<AssetPickerIconSort>
                aria-label="Icon sort"
                value={iconSort}
                onValueChange={setIconSort}
              >
                <option value="type">Sort by type</option>
                <option value="name">Sort by name</option>
                <option value="folder">Sort by folder</option>
              </SelectControl>
            </div>
          ) : null}
          <div className="wb-inspector-asset-picker-meta">
            <span>{visibleOptions.length} / {allOptions.length} {formatAssetKindLabel(selectedKind).toLowerCase()}</span>
            {onClear ? (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="wb-inspector-asset-picker-grid">
            {visibleOptions.map((option) => (
              option.kind === 'asset' ? (
                <button
                  key={option.asset.id}
                  type="button"
                  className="wb-inspector-asset-tile"
                  title={option.asset.name}
                  onClick={() => {
                    onSelect(option.asset);
                    setOpen(false);
                  }}
                >
                  <AssetOptionPreview asset={option.asset} />
                  <strong>{option.asset.name}</strong>
                </button>
              ) : (
                <button
                  key={`${option.preview.sourceAssetName}:${option.preview.value}`}
                  type="button"
                  className={
                    option.preview.key === selectedPreviewKey || option.preview.value === selectedPreviewKey
                      ? 'wb-inspector-asset-tile wb-inspector-asset-tile--selected'
                      : 'wb-inspector-asset-tile'
                  }
                  title={formatAssetPreviewTitle(option.preview)}
                  onClick={() => {
                    onSelectPreview?.(option.preview, selectedKind);
                    setOpen(false);
                  }}
                >
                  <span className={`wb-inspector-asset-option-preview wb-inspector-asset-option-preview--${selectedKind}`}>
                    <img className={selectedKind === 'icon' ? 'wb-icon-preview-image' : undefined} src={getWorkbenchAssetRuntimeValue(option.preview.value)} alt="" draggable={false} />
                  </span>
                  <strong>{option.preview.name}</strong>
                  {option.preview.style ? <small>{option.preview.style}</small> : null}
                </button>
              )
            ))}
          </div>
          {allOptions.length === 0 ? (
            <div className="wb-inspector-asset-picker-empty">No matching assets</div>
          ) : null}
          {hasMore ? (
            <div className="wb-inspector-asset-picker-loading" role="status">Loading more</div>
          ) : null}
        </div>
      , document.body) : null}
    </span>
  );
}

function useAssetPickerPopoverLayout(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties | null {
  const [layout, setLayout] = useState<CSSProperties | null>(null);
  const layoutFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setLayout(null);
      return undefined;
    }

    function measureLayout() {
      layoutFrameRef.current = null;
      const anchor = anchorRef.current?.getBoundingClientRect();
      const nextLayout = anchor ? getAssetPickerPopoverLayout(anchor) : null;
      setLayout((current) => (
        areAssetPickerLayoutsEqual(current, nextLayout) ? current : nextLayout
      ));
    }

    function scheduleLayout() {
      if (layoutFrameRef.current !== null) return;
      layoutFrameRef.current = window.requestAnimationFrame(measureLayout);
    }

    measureLayout();
    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('scroll', scheduleLayout, true);
    return () => {
      if (layoutFrameRef.current !== null) {
        window.cancelAnimationFrame(layoutFrameRef.current);
        layoutFrameRef.current = null;
      }
      window.removeEventListener('resize', scheduleLayout);
      window.removeEventListener('scroll', scheduleLayout, true);
    };
  }, [anchorRef, open]);

  return layout;
}

function areAssetPickerLayoutsEqual(left: CSSProperties | null, right: CSSProperties | null): boolean {
  return left?.left === right?.left &&
    left?.top === right?.top &&
    left?.width === right?.width &&
    left?.maxHeight === right?.maxHeight;
}

function getAssetPickerPopoverLayout(anchor: DOMRect): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(
    ASSET_PICKER_POPOVER_WIDTH,
    Math.max(300, viewportWidth - ASSET_PICKER_POPOVER_GAP * 2),
  );
  const spaceBelow = viewportHeight - anchor.bottom - ASSET_PICKER_POPOVER_GAP;
  const spaceAbove = anchor.top - ASSET_PICKER_POPOVER_GAP;
  const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
  const availableHeight = openAbove ? spaceAbove - ASSET_PICKER_POPOVER_GAP : spaceBelow - ASSET_PICKER_POPOVER_GAP;
  const maxHeight = clampInspectorPopoverValue(availableHeight, 240, ASSET_PICKER_POPOVER_MAX_HEIGHT);
  const top = openAbove
    ? Math.max(ASSET_PICKER_POPOVER_GAP, anchor.top - maxHeight - ASSET_PICKER_POPOVER_GAP)
    : anchor.bottom + ASSET_PICKER_POPOVER_GAP;
  const left = clampInspectorPopoverValue(
    anchor.right - width,
    ASSET_PICKER_POPOVER_GAP,
    Math.max(ASSET_PICKER_POPOVER_GAP, viewportWidth - width - ASSET_PICKER_POPOVER_GAP),
  );

  return {
    position: 'fixed',
    top,
    left,
    width,
    maxHeight,
  };
}

function clampInspectorPopoverValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function AssetOptionPreview({ asset }: { asset: WorkbenchDesignAsset }) {
  const effectiveKind = getEffectiveDesignAssetKind(asset);
  if (asset.kind === 'font') {
    return (
      <span className="wb-inspector-asset-option-preview">
        <Type size={14} aria-hidden="true" />
      </span>
    );
  }
  if (effectiveKind === 'video') {
    return (
      <span className="wb-inspector-asset-option-preview">
        {asset.source.value ? <video src={getDesignAssetRuntimeValue(asset)} muted playsInline preload="metadata" /> : <FileVideo size={14} aria-hidden="true" />}
      </span>
    );
  }
  return (
    <span className={`wb-inspector-asset-option-preview wb-inspector-asset-option-preview--${effectiveKind}`}>
      <img className={effectiveKind === 'icon' ? 'wb-icon-preview-image' : undefined} src={getDesignAssetRuntimeValue(asset)} alt="" draggable={false} />
    </span>
  );
}

function getAssetPickerScopedAssets(
  assets: WorkbenchAssetRegistry | undefined,
  iconScope: AssetPickerIconScope,
): WorkbenchDesignAsset[] {
  const allAssets = assets?.assets ?? [];
  if (iconScope !== 'default') return allAssets;
  const defaultIconAssetId = assets ? getWorkbenchAssetDefaults(assets).iconAssetId : null;
  return allAssets.filter((asset) => asset.kind !== 'icon' || asset.id === defaultIconAssetId);
}

function hasAssetsForKind(assets: WorkbenchDesignAsset[], kind: WorkbenchDesignAssetKind): boolean {
  return assets.some((asset) => getEffectiveDesignAssetKind(asset) === kind);
}

function formatAssetKindLabel(kind: WorkbenchDesignAssetKind): string {
  if (kind === 'image') return 'Images';
  if (kind === 'video') return 'Videos';
  if (kind === 'icon') return 'Icons';
  return 'Fonts';
}

function getAssetPreviewOptions(asset: WorkbenchDesignAsset): AssetPreviewOption[] {
  if (asset.kind === 'image') return getWorkbenchImagePreviewOptions(asset);
  return getWorkbenchIconPreviewOptions(asset);
}

function formatAssetPreviewTitle(preview: AssetPreviewOption): string {
  return [
    preview.name,
    preview.style,
    preview.sourceFile,
  ].filter(Boolean).join(' · ');
}

function formatAssetPreviewOptionLabel(preview: AssetPreviewOption): string {
  return [
    preview.name,
    preview.style,
  ].filter(Boolean).join(' · ');
}

function getAssetPickerIconStyleOptions(previews: AssetPreviewOption[]): AssetPickerFilterOption[] {
  const options = new Map<string, AssetPickerFilterOption>();
  for (const preview of previews) {
    const value = getAssetPreviewStyleFilterValue(preview);
    if (!options.has(value)) options.set(value, { label: preview.style || 'No type', value });
  }
  return [...options.values()].sort((left, right) => (
    getAssetPickerIconStyleSortOrder(left.value) - getAssetPickerIconStyleSortOrder(right.value) ||
    left.label.localeCompare(right.label)
  ));
}

function getAssetPickerIconFolderOptions(previews: AssetPreviewOption[]): AssetPickerFilterOption[] {
  const options = new Map<string, AssetPickerFilterOption>();
  for (const preview of previews) {
    const value = getAssetPreviewFolderFilterValue(preview);
    if (!options.has(value)) options.set(value, { label: getAssetPreviewFolderLabel(preview), value });
  }
  return [...options.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function sortAssetPickerPreviewOptions(
  previews: AssetPreviewOption[],
  sort: AssetPickerIconSort,
): AssetPreviewOption[] {
  const sorted = [...previews];
  if (sort === 'name') {
    return sorted.sort((left, right) => (
      left.name.localeCompare(right.name) ||
      compareAssetPreviewByType(left, right) ||
      compareAssetPreviewByFolder(left, right)
    ));
  }
  if (sort === 'folder') {
    return sorted.sort((left, right) => (
      compareAssetPreviewByFolder(left, right) ||
      left.name.localeCompare(right.name) ||
      compareAssetPreviewByType(left, right)
    ));
  }
  return sorted.sort((left, right) => (
    compareAssetPreviewByType(left, right) ||
    left.name.localeCompare(right.name) ||
    compareAssetPreviewByFolder(left, right)
  ));
}

function compareAssetPreviewByType(left: AssetPreviewOption, right: AssetPreviewOption): number {
  return getAssetPickerIconStyleSortOrder(left.styleKey) - getAssetPickerIconStyleSortOrder(right.styleKey) ||
    (left.style ?? '').localeCompare(right.style ?? '');
}

function compareAssetPreviewByFolder(left: AssetPreviewOption, right: AssetPreviewOption): number {
  return getAssetPreviewFolderLabel(left).localeCompare(getAssetPreviewFolderLabel(right)) ||
    (left.sourceFile ?? '').localeCompare(right.sourceFile ?? '');
}

function getAssetPickerIconStyleSortOrder(styleKey: string | undefined): number {
  switch (styleKey) {
    case 'outline':
    case 'line':
    case 'regular':
      return 0;
    case 'mini':
    case 'micro':
      return 1;
    case 'solid':
    case 'filled':
    case 'fill':
      return 2;
    case 'duotone':
    case 'two-tone':
    case 'twotone':
      return 3;
    case 'unstyled':
      return 5;
    default:
      return styleKey ? 4 : 5;
  }
}

function getAssetPreviewStyleFilterValue(preview: AssetPreviewOption): string {
  return preview.styleKey || 'unstyled';
}

function getAssetPreviewFolderFilterValue(preview: AssetPreviewOption): string {
  return `${preview.assetId}:${getAssetPreviewFolder(preview)}`;
}

function getAssetPreviewFolderLabel(preview: AssetPreviewOption): string {
  const folder = getAssetPreviewFolder(preview);
  return folder ? `${preview.sourceAssetName} / ${folder}` : preview.sourceAssetName;
}

function getAssetPreviewFolder(preview: AssetPreviewOption): string {
  const sourceFile = preview.sourceFile?.trim();
  if (!sourceFile) return '';
  return sourceFile.split(/[\\/]/).slice(0, -1).join('/');
}

function getAssetKindsForSourceAttributeField(
  field: InspectorFieldDescriptor,
  model: HtmlInspectorModel,
  attributes: Record<string, string>,
  assetRegistry: WorkbenchAssetRegistry | undefined,
): WorkbenchDesignAssetKind[] | null {
  if (field.attributeName !== 'src') return null;
  if (model.category !== 'media') return null;
  const elementName = model.elementName.toLowerCase();
  if (elementName === 'video' || elementName === 'audio') return ['video'];
  const selectedKind = getSourceAssetKindHint(attributes, assetRegistry);
  if (selectedKind === 'video') return ['video'];
  if (selectedKind === 'icon') return ['icon'];
  if (selectedKind === 'image') return elementName === 'img' ? ['image', 'icon'] : ['image', 'video', 'icon'];
  if (isIconAssetSourceValue(attributes.src)) return ['icon'];
  if (isVideoDesignAssetSource(attributes.src)) return ['video'];
  if (elementName === 'img') return ['image', 'icon'];
  return ['image', 'video', 'icon'];
}

function getSourceAssetKindHint(
  attributes: Record<string, string>,
  assetRegistry: WorkbenchAssetRegistry | undefined,
): WorkbenchDesignAssetKind | null {
  const attributeKind = normalizeSourceDesignAssetKind(attributes[SOURCE_ASSET_KIND_ATTRIBUTE]);
  if (attributeKind) return attributeKind;
  return getRegisteredDesignAssetKindForSourceValue(assetRegistry, attributes.src);
}

function normalizeSourceDesignAssetKind(value: string | undefined): WorkbenchDesignAssetKind | null {
  if (value === 'image' || value === 'video' || value === 'icon' || value === 'font') return value;
  return null;
}

function getRegisteredDesignAssetKindForSourceValue(
  assetRegistry: WorkbenchAssetRegistry | undefined,
  value: string | undefined,
): WorkbenchDesignAssetKind | null {
  const source = value?.trim();
  if (!assetRegistry || !source) return null;
  for (const asset of assetRegistry.assets) {
    const assetKind = getEffectiveDesignAssetKind(asset);
    if (getDesignAssetUsageValue(asset) === source) return assetKind;
    if (getAssetPreviewOptions(asset).some((preview) => preview.value === source)) return assetKind;
  }
  return null;
}

function getInlineSvgIconAssetSource(
  node: EditableTreeNode | null,
  attributes: Record<string, string>,
): string | null {
  if (node?.source?.jsxName?.toLowerCase() !== 'svg') return null;
  return attributes[SOURCE_ASSET_SOURCE_ATTRIBUTE]?.trim() ?? '';
}

function inferInlineSvgIconName(source: string | null): string {
  if (!source) return '';
  const fileName = source.split(/[/?#]/).filter(Boolean).pop() ?? '';
  return fileName.replace(/\.[^.]+$/, '');
}

function isIconAssetSourceValue(value: string | undefined): boolean {
  const source = value?.trim().toLowerCase() ?? '';
  return source.includes('/workbench-assets/icons/lucide-preview/') || source.includes('/workbench-assets/icons/lucide/');
}

function getAssetKindsForComponentProp(control: WorkbenchStoryControl): WorkbenchDesignAssetKind[] | null {
  if (control.type === 'icon') return ['icon'];
  if (control.type !== 'text') return null;
  if (control.picker === 'none' || control.picker === 'token') return null;
  const configuredKinds = getConfiguredComponentPropAssetKinds(control);
  if (configuredKinds) return configuredKinds;
  if (control.picker === 'asset' || control.picker === 'asset-token') return ['image', 'video', 'icon'];
  const propTerms = getComponentPropAssetTerms(control);
  if (isNonAssetComponentTextProp(propTerms)) return null;
  if (isImageComponentAssetProp(propTerms)) return ['image', 'icon'];
  if (isVideoComponentAssetProp(propTerms)) return ['video'];
  return isAssetLikeComponentProp(propTerms) ? ['image', 'video', 'icon'] : null;
}

function getConfiguredComponentPropAssetKinds(control: WorkbenchStoryControl): WorkbenchDesignAssetKind[] | null {
  const assetKinds = control.assetKinds?.filter((kind): kind is WorkbenchDesignAssetKind => (
    kind === 'font' || kind === 'icon' || kind === 'image' || kind === 'video'
  ));
  return assetKinds && assetKinds.length > 0 ? assetKinds : null;
}

function formatPreviewAssetValueForComponentProp(control: WorkbenchStoryControl, preview: AssetPreviewOption): string {
  const assetKinds = getAssetKindsForComponentProp(control);
  if (assetKinds?.length === 1 && assetKinds[0] === 'icon') return preview.key || preview.value;
  return preview.value;
}

function getComponentPropAssetTerms(control: WorkbenchStoryControl): string[] {
  const text = `${control.key} ${control.label}`;
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function isNonAssetComponentTextProp(terms: string[]): boolean {
  const lastTerm = terms[terms.length - 1];
  return lastTerm
    ? ['alt', 'caption', 'description', 'fit', 'height', 'label', 'name', 'position', 'repeat', 'size', 'text', 'title', 'tone', 'type', 'variant', 'width'].includes(lastTerm)
    : false;
}

function isVideoComponentAssetProp(terms: string[]): boolean {
  if (!terms.some((term) => ['mp4', 'motion', 'movie', 'video', 'webm'].includes(term))) return false;
  return terms.some((term) => ['asset', 'background', 'bg', 'cover', 'file', 'hero', 'media', 'path', 'poster', 'source', 'src', 'thumbnail', 'thumb', 'url'].includes(term));
}

function isImageComponentAssetProp(terms: string[]): boolean {
  return terms.some((term) => (
    ['avatar', 'brandmark', 'cover', 'image', 'img', 'logo', 'photo', 'picture', 'poster', 'symbol', 'thumbnail', 'thumb'].includes(term)
  ));
}

function isCssBackgroundComponentTokenProp(terms: string[]): boolean {
  const lastTerm = terms[terms.length - 1];
  return lastTerm === 'background' ||
    lastTerm === 'bg' ||
    (lastTerm === 'color' && terms.includes('background'));
}

function isCssColorComponentTokenProp(terms: string[]): boolean {
  const lastTerm = terms[terms.length - 1];
  return lastTerm === 'color' || lastTerm === 'colour';
}

function isAssetLikeComponentProp(terms: string[]): boolean {
  if (terms.length > 0 && terms.every((term) => ['source', 'src'].includes(term))) return true;
  if (terms.includes('src') || terms.includes('source')) return true;
  const mediaTerms = ['avatar', 'brandmark', 'cover', 'image', 'img', 'logo', 'photo', 'picture', 'poster', 'symbol', 'thumbnail', 'thumb'];
  if (terms.some((term) => mediaTerms.includes(term))) return true;
  const valueTerms = ['asset', 'file', 'path', 'url'];
  return terms.some((term) => valueTerms.includes(term)) && terms.some((term) => (
    ['background', 'bg', 'brand', 'hero', 'media'].includes(term) || /^avatar\d+$/.test(term)
  ));
}

function getAssetKindsForSourceStyleField(field: InspectorFieldDescriptor): WorkbenchDesignAssetKind[] | null {
  if (field.styleProperty === 'background-image') return ['image', 'icon'];
  if (field.styleProperty === 'font-family') return ['font'];
  return null;
}

function formatAssetValueForSourceStyle(field: InspectorFieldDescriptor, asset: WorkbenchDesignAsset): string {
  if (field.styleProperty === 'background-image') return getDesignAssetCssSnippet(asset);
  if (field.styleProperty === 'font-family') return formatFontFamilyAssetValue(asset);
  return getDesignAssetUsageValue(asset);
}

function formatPreviewAssetValueForSourceStyle(
  field: InspectorFieldDescriptor,
  preview: AssetPreviewOption,
): string {
  if (field.styleProperty === 'background-image') return `url("${escapeCssUrlString(preview.value)}")`;
  return preview.value;
}

function formatFontFamilyAssetValue(asset: WorkbenchDesignAsset): string {
  const fontFamily = asset.extensions?.fontFamily;
  const family = typeof fontFamily === 'string' && fontFamily.trim() ? fontFamily : asset.name;
  return `"${family.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function escapeCssUrlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function InspectorLayerSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  nodeSettingsAction,
  onSourceAttributeChange,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  nodeSettingsAction?: ReactNode;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const visibleFields = fields.filter((field) => field.id !== 'appearance.visibility');
  const visibilityField = fields.find((field) => field.id === 'appearance.visibility' && field.styleProperty);
  const hidden = selectedSourceNode?.sourceAttributes?.hidden === 'true'
    || selectedSourceNode?.sourceStyleDeclarations?.visibility?.trim() === 'hidden';
  const visibilityAction = visibilityField?.styleProperty ? (
    <InspectorVisibilityToggle
      canEditSourceFields={canEditSourceFields}
      hidden={hidden}
      onToggle={() => {
        onSourceAttributeChange('hidden', hidden ? null : 'true');
        onSourceStyleDeclarationChange(visibilityField.styleProperty!, null);
      }}
    />
  ) : null;
  const actions = nodeSettingsAction || visibilityAction ? (
    <>
      {visibilityAction}
      {nodeSettingsAction}
    </>
  ) : null;

  return (
    <WorkbenchInspectorSection
      title="Layer"
      density="compact"
      actions={actions}
    >
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={visibleFields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorTailwindClassSection({
  canEditSourceFields,
  cssClassEffectivenessReport,
  onCssClassEffectivenessRequestChange,
  onSourceAttributeChange,
  projectClassCatalog,
  selectedLayer,
  sourceDocumentRoot,
  selectedSourceNode,
}: {
  canEditSourceFields: boolean;
  cssClassEffectivenessReport: CssClassEffectivenessReport | null;
  onCssClassEffectivenessRequestChange?: (requested: boolean) => void;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  projectClassCatalog: WorkbenchProjectClassCatalog;
  selectedLayer: PreviewLayer | null;
  sourceDocumentRoot: EditableTreeNode | null;
  selectedSourceNode: EditableTreeNode | null;
}) {
  const className = getSourceAttributes(selectedLayer, selectedSourceNode).className ?? '';
  const normalizedClassName = normalizeTailwindClassNameInput(className) ?? '';
  const classNames = getTailwindClassNameTokens(normalizedClassName);
  const effectivenessByClassName = useMemo(() => {
    if (
      !cssClassEffectivenessReport ||
      (
        cssClassEffectivenessReport.layerId !== selectedSourceNode?.id &&
        cssClassEffectivenessReport.layerId !== selectedLayer?.id
      ) ||
      (normalizeTailwindClassNameInput(cssClassEffectivenessReport.sourceClassName) ?? '') !== normalizedClassName
    ) {
      return new Map<string, CssClassEffectivenessEntry>();
    }
    return new Map(cssClassEffectivenessReport.entries.map((entry) => [entry.className, entry]));
  }, [cssClassEffectivenessReport, normalizedClassName, selectedLayer?.id, selectedSourceNode?.id]);
  const sourceBacked = Boolean(selectedSourceNode?.source?.sourceFile ?? selectedLayer?.sourceFile);
  const effectivenessRequested = sourceBacked && classNames.length > 0;
  const [editingClassToken, setEditingClassToken] = useState<string | null>(null);
  const [editingClassValue, setEditingClassValue] = useState('');
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [classPickerTab, setClassPickerTab] = useState<'project' | 'tailwind'>('tailwind');
  const [projectClassScope, setProjectClassScope] = useState<'page' | 'project'>('page');
  const [projectClassSourceTarget, setProjectClassSourceTarget] = useState<ProjectClassPickerResult | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const [rawClassDraft, setRawClassDraft] = useState(normalizedClassName);
  const [rawClassDirty, setRawClassDirty] = useState(false);
  const editingClassInfo = editingClassToken ? getClassNameTokenInfo(editingClassToken) : null;
  const classPickerResults = getTailwindUtilityPickerResults(classSearch, classNames);
  const activeDocumentSourceFile = sourceDocumentRoot?.source?.sourceFile ?? null;
  const shouldCollectCurrentPageClassUsage = classPickerOpen && classPickerTab === 'project';
  const currentPageClassUsage = useMemo(
    () => shouldCollectCurrentPageClassUsage
      ? collectEditableTreeClassUsage(sourceDocumentRoot, { sourceFile: activeDocumentSourceFile })
      : [],
    [activeDocumentSourceFile, shouldCollectCurrentPageClassUsage, sourceDocumentRoot],
  );
  const projectClassPickerResults = useMemo(
    () => getProjectClassPickerResults({
      catalog: projectClassCatalog,
      currentPageUsage: currentPageClassUsage,
      scope: projectClassScope,
      searchValue: classSearch,
    }),
    [classSearch, currentPageClassUsage, projectClassCatalog, projectClassScope],
  );
  const rawSearchValue = normalizeTailwindClassNameInput(classSearch) ?? '';
  // The picker applies classes, it does not author them. So the typed value is
  // only offered when neither tab already lists it -- otherwise the user would
  // be nudged to retype a class the other tab is holding.
  // Count project matches across the whole project, not the current scope: the
  // hint exists so a search never dead-ends, and "This page" is a narrowing the
  // user has not necessarily chosen yet.
  const projectWideClassMatches = useMemo(
    () => getProjectClassPickerResults({
      catalog: projectClassCatalog,
      currentPageUsage: currentPageClassUsage,
      scope: 'project',
      searchValue: classSearch,
    }),
    [classSearch, currentPageClassUsage, projectClassCatalog],
  );
  const otherTabMatchCount = classPickerTab === 'tailwind'
    ? projectWideClassMatches.length
    : classPickerResults.length;
  const canAddRawSearch = Boolean(
    rawSearchValue &&
    rawSearchValue.length <= 160 &&
    !classNames.includes(rawSearchValue) &&
    !classPickerResults.some((result) => result.className === rawSearchValue) &&
    !projectClassPickerResults.some((result) => result.className === rawSearchValue),
  );

  useEffect(() => {
    onCssClassEffectivenessRequestChange?.(effectivenessRequested);
    return () => {
      if (effectivenessRequested) onCssClassEffectivenessRequestChange?.(false);
    };
  }, [effectivenessRequested, onCssClassEffectivenessRequestChange]);

  useEffect(() => {
    setRawClassDraft(normalizedClassName);
    setRawClassDirty(false);
  }, [normalizedClassName]);

  useEffect(() => {
    if (!editingClassToken) return;
    if (classNames.includes(editingClassToken)) return;
    setEditingClassToken(null);
    setEditingClassValue('');
  }, [normalizedClassName, editingClassToken]);

  function commitClassTokens(nextClassNames: string[]) {
    onSourceAttributeChange('className', normalizeTailwindClassNameInput(nextClassNames.join(' ')));
  }

  function commitRawClassName(value: string) {
    onSourceAttributeChange('className', normalizeTailwindClassNameInput(value));
    setRawClassDirty(false);
  }

  function addClassValue(value: string) {
    const nextTokens = getTailwindClassNameTokens(normalizeTailwindClassNameInput(value) ?? '');
    if (nextTokens.length === 0) return;
    commitClassTokens(getTailwindClassNameTokens([...classNames, ...nextTokens].join(' ')));
    setClassSearch('');
  }

  function replaceClassValue(classToken: string, value: string) {
    const nextTokens = getTailwindClassNameTokens(normalizeTailwindClassNameInput(value) ?? '');
    commitClassTokens(getTailwindClassNameTokens([
      ...classNames.filter((candidate) => candidate !== classToken),
      ...nextTokens,
    ].join(' ')));
    setEditingClassToken(null);
    setEditingClassValue('');
  }

  function removeClassValue(classToken: string) {
    commitClassTokens(classNames.filter((candidate) => candidate !== classToken));
    setEditingClassToken(null);
    setEditingClassValue('');
  }

  if (!sourceBacked || (!canEditSourceFields && classNames.length === 0)) return null;

  return (
    <WorkbenchInspectorSection
      title="CSS Classes"
      density="compact"
      meta={classNames.length > 0 ? `${classNames.length} classes` : 'className'}
    >
      <WorkbenchInspectorField
        label="Classes"
        labelMode="hidden"
        density="compact"
        variant="read"
      >
        {classNames.length > 0 ? (
          <div className="wb-inspector-tailwind-class-list" aria-label="CSS class tokens">
            {classNames.map((classToken) => {
              const classInfo = getClassNameTokenInfo(classToken);
              const effectiveness = effectivenessByClassName.get(classToken) ?? getUnverifiedClassEffectiveness(classToken);
              const effectivenessLabel = formatCssClassEffectivenessStatus(effectiveness.status);
              return (
                <span
                  className={[
                    'wb-inspector-tailwind-class-chip',
                    canEditSourceFields ? 'wb-inspector-tailwind-class-chip--editable' : '',
                    editingClassToken === classToken ? 'wb-inspector-tailwind-class-chip--active' : '',
                    `wb-inspector-tailwind-class-chip--effect-${effectiveness.status}`,
                  ].filter(Boolean).join(' ')}
                  data-class-effect-status={effectiveness.status}
                  data-class-name={classToken}
                  key={classToken}
                  title={`${effectivenessLabel}: ${effectiveness.reason}\n${classInfo.description}`}
                >
                  <button
                    type="button"
                    className="wb-inspector-tailwind-class-chip__value"
                    disabled={!canEditSourceFields}
                    title={classToken}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setEditingClassToken(classToken);
                      setEditingClassValue(classToken);
                    }}
                  >
                    {classToken}
                  </button>
                  {canEditSourceFields ? (
                    <button
                      type="button"
                      className="wb-inspector-tailwind-class-chip__remove"
                      aria-label={`Remove ${classToken} class`}
                      title={`Remove ${classToken}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeClassValue(classToken);
                      }}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              );
            })}
            {canEditSourceFields ? (
              <button
                type="button"
                className="wb-inspector-tailwind-class-chip wb-inspector-tailwind-class-chip--add"
                aria-haspopup="dialog"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setClassPickerOpen(true);
                }}
              >
                <Plus size={11} aria-hidden="true" />
                Add
              </button>
            ) : null}
          </div>
        ) : canEditSourceFields ? (
          <button
            type="button"
            className="wb-inspector-tailwind-empty wb-inspector-tailwind-empty--button"
            aria-haspopup="dialog"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setClassPickerOpen(true);
            }}
          >
            <Plus size={12} aria-hidden="true" />
            Add class
          </button>
        ) : (
          <div className="wb-inspector-tailwind-empty">No CSS classes.</div>
        )}
      </WorkbenchInspectorField>
      {editingClassToken && editingClassInfo ? (
        <div className="wb-inspector-tailwind-editor" aria-label={`${editingClassToken} class editor`}>
          <div className="wb-inspector-tailwind-editor__head">
            <strong>{editingClassToken}</strong>
            <span className="wb-inspector-tailwind-editor__head-actions">
              {editingClassInfo.docsUrl ? (
                <a href={editingClassInfo.docsUrl} target="_blank" rel="noreferrer">
                  Docs
                  <Link2 size={11} aria-hidden="true" />
                </a>
              ) : null}
              <button
                type="button"
                className="wb-inspector-tailwind-editor__close"
                aria-label="Close class editor"
                title="Close"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setEditingClassToken(null);
                  setEditingClassValue('');
                }}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          </div>
          <p>{editingClassInfo.description}</p>
          <TextField
            aria-label={`Edit ${editingClassToken} class`}
            value={editingClassValue}
            onValueChange={setEditingClassValue}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                replaceClassValue(editingClassToken, editingClassValue);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setEditingClassToken(null);
                setEditingClassValue('');
              }
            }}
          />
          {editingClassInfo.valueExamples.length > 0 ? (
            <div className="wb-inspector-tailwind-editor__suggestions" aria-label="Suggested values">
              {editingClassInfo.valueExamples.slice(0, 8).map((value) => (
                <button
                  type="button"
                  key={value}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setEditingClassValue(formatTailwindClassTokenWithReplacementValue(editingClassToken, value));
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
          <div className="wb-inspector-tailwind-editor__actions">
            <Button
              tone="primary"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                replaceClassValue(editingClassToken, editingClassValue);
              }}
            >
              Apply
            </Button>
            <Button
              tone="danger"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeClassValue(editingClassToken);
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : null}
      {canEditSourceFields ? (
        <div className="wb-inspector-tailwind-raw">
          <div className="wb-inspector-tailwind-raw-head">
            <span className="wb-inspector-tailwind-raw-label">Raw className</span>
            <button
              type="button"
              className="wb-inspector-tailwind-raw-apply"
              disabled={!rawClassDirty}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                commitRawClassName(rawClassDraft);
              }}
            >
              Apply
              <Check size={11} aria-hidden="true" />
            </button>
          </div>
          <SourceTextContentControl
            ariaLabel="className"
            commitOnBlur
            commitOnEnter
            leading={<span className="wb-inspector-input-leading-text">class</span>}
            onDraftChange={(value) => {
              setRawClassDraft(value);
              setRawClassDirty((normalizeTailwindClassNameInput(value) ?? '') !== normalizedClassName);
            }}
            value={normalizedClassName}
            onCommit={commitRawClassName}
          />
        </div>
      ) : normalizedClassName ? (
        <div className="wb-inspector-tailwind-raw-read">{normalizedClassName}</div>
      ) : null}
      {classPickerOpen ? (
        <ModalLayer
          className="wb-tailwind-class-picker-modal"
          title="Add CSS class"
          onClose={() => setClassPickerOpen(false)}
        >
          <div
            className="wb-tailwind-class-picker"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <SearchField
              aria-label="Search class suggestions"
              placeholder={classPickerTab === 'tailwind' ? 'Search Tailwind utilities' : 'Search project classes'}
              value={classSearch}
              onValueChange={setClassSearch}
            />
            <div className="wb-tailwind-class-picker__toolbar">
              <div
                className="wb-storybook-tabs wb-tailwind-class-picker__source-tabs"
                role="tablist"
                aria-label="CSS class source"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={classPickerTab === 'tailwind'}
                  className={[
                    'wb-storybook-tab',
                    classPickerTab === 'tailwind' ? 'wb-storybook-tab--active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setClassPickerTab('tailwind')}
                >
                  Tailwind
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={classPickerTab === 'project'}
                  className={[
                    'wb-storybook-tab',
                    classPickerTab === 'project' ? 'wb-storybook-tab--active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setClassPickerTab('project')}
                >
                  Project classes
                </button>
              </div>
              {classPickerTab === 'project' ? (
                <div className="wb-tailwind-class-picker__scope-row">
                  <span className="wb-tailwind-class-picker__scope-label">Scope</span>
                  <div
                    className="wb-inspector-segmented-control wb-tailwind-class-picker__scope-control"
                    role="group"
                    aria-label="Project class scope"
                  >
                    <button
                      type="button"
                      aria-pressed={projectClassScope === 'page'}
                      className={[
                        'wb-inspector-segmented-button',
                        projectClassScope === 'page' ? 'wb-inspector-segmented-button--active' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setProjectClassScope('page')}
                    >
                      This page
                    </button>
                    <button
                      type="button"
                      aria-pressed={projectClassScope === 'project'}
                      className={[
                        'wb-inspector-segmented-button',
                        projectClassScope === 'project' ? 'wb-inspector-segmented-button--active' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setProjectClassScope('project')}
                    >
                      All project
                    </button>
                  </div>
                </div>
              ) : null}
              {projectClassSourceTarget ? (
                <InspectorProjectClassSourceModal
                  result={projectClassSourceTarget}
                  onClose={() => setProjectClassSourceTarget(null)}
                />
              ) : null}
            </div>
            <div className="wb-tailwind-class-picker__results" aria-label="CSS class suggestions">
              {classPickerTab === 'tailwind' ? (
                <>
                  {!classSearch.trim() && classPickerResults.length === 0 ? (
                    <div className="wb-tailwind-class-picker__empty">
                      Search Tailwind utilities or type any CSS class.
                    </div>
                  ) : null}
                  {classPickerResults.map((utility) => {
                    const alreadyApplied = classNames.includes(utility.className);
                    return (
                      <div className="wb-tailwind-class-picker__row" key={utility.className}>
                        <button
                          type="button"
                          disabled={alreadyApplied}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            addClassValue(utility.className);
                            setClassPickerOpen(false);
                          }}
                        >
                          <span>
                            <strong>{utility.className}</strong>
                            <em>{utility.category}</em>
                          </span>
                          <small>{alreadyApplied ? 'Already applied' : utility.description}</small>
                        </button>
                        {utility.docsUrl ? (
                          <a href={utility.docsUrl} target="_blank" rel="noreferrer" title="Open Tailwind docs">
                            Docs
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {projectClassPickerResults.length === 0 ? (
                    <div className="wb-tailwind-class-picker__empty">
                      {projectClassScope === 'page'
                        ? 'No project CSS classes are used on this page.'
                        : 'No class selectors were found in project source CSS.'}
                    </div>
                  ) : null}
                  {projectClassPickerResults.map((projectClass) => {
                    const alreadyApplied = classNames.includes(projectClass.className);
                    return (
                      <div className="wb-tailwind-class-picker__row" key={projectClass.className}>
                        <button
                          type="button"
                          disabled={alreadyApplied}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            addClassValue(projectClass.className);
                            setClassPickerOpen(false);
                          }}
                        >
                          <span>
                            <strong>{projectClass.className}</strong>
                            <em>Project CSS</em>
                          </span>
                          <small title={projectClass.sourceFiles.join(', ')}>
                            {alreadyApplied
                              ? 'Already applied'
                              : formatProjectClassPickerDescription(projectClass)}
                          </small>
                        </button>
                        <IconButton
                          className="wb-tailwind-class-picker__source-button"
                          label={`Show CSS for ${projectClass.className}`}
                          onClick={() => setProjectClassSourceTarget(projectClass)}
                        >
                          <Code size={12} aria-hidden="true" />
                        </IconButton>
                      </div>
                    );
                  })}
                </>
              )}
              {otherTabMatchCount > 0 && (classPickerTab === 'tailwind' ? classPickerResults : projectClassPickerResults).length === 0 ? (
                <button
                  type="button"
                  className="wb-tailwind-class-picker__cross-tab"
                  onClick={() => {
                    if (classPickerTab === 'tailwind') {
                      if (projectClassPickerResults.length === 0) setProjectClassScope('project');
                      setClassPickerTab('project');
                      return;
                    }
                    setClassPickerTab('tailwind');
                  }}
                >
                  {`${otherTabMatchCount} ${otherTabMatchCount === 1 ? 'match' : 'matches'} in ${classPickerTab === 'tailwind' ? 'Project classes' : 'Tailwind'}`}
                </button>
              ) : null}
              {canAddRawSearch ? (
                <div className="wb-tailwind-class-picker__row wb-tailwind-class-picker__row--raw">
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      addClassValue(rawSearchValue);
                      setClassPickerOpen(false);
                    }}
                  >
                      <span>
                        <strong>{rawSearchValue}</strong>
                        <em>Apply as typed</em>
                      </span>
                      <small>No match in either tab. Applies this exact class name.</small>
                  </button>
                </div>
              ) : classSearch.trim() && (
                classPickerTab === 'tailwind' ? classPickerResults.length === 0 : projectClassPickerResults.length === 0
              ) ? (
                <div className="wb-tailwind-class-picker__empty">
                  No matching class. Type a full class name to add it exactly.
                </div>
              ) : null}
            </div>
          </div>
        </ModalLayer>
      ) : null}
    </WorkbenchInspectorSection>
  );
}

function getUnverifiedClassEffectiveness(className: string): CssClassEffectivenessEntry {
  return {
    appliedProperties: [],
    className,
    overriddenProperties: [],
    reason: 'Waiting for the selected preview root to be verified.',
    status: 'unverified',
  };
}

function formatCssClassEffectivenessStatus(status: CssClassEffectivenessStatus): string {
  switch (status) {
    case 'applied':
      return 'Applied';
    case 'overridden':
      return 'Overridden';
    case 'not-forwarded':
      return 'Not forwarded';
    case 'inactive':
      return 'Inactive';
    case 'partially-overridden':
      return 'Partially overridden';
    case 'unverified':
      return 'Unverified';
  }
}

type ProjectClassPickerResult = {
  className: string;
  currentPageUsageCount: number;
  rules: WorkbenchProjectClassRule[];
  sourceFiles: string[];
};

function getProjectClassPickerResults({
  catalog,
  currentPageUsage,
  scope,
  searchValue,
}: {
  catalog: WorkbenchProjectClassCatalog;
  currentPageUsage: EditableTreeClassUsage[];
  scope: 'page' | 'project';
  searchValue: string;
}): ProjectClassPickerResult[] {
  const definitionsByClassName = new Map(catalog.classes.map((definition) => [definition.className, definition]));
  const usageByClassName = new Map(currentPageUsage.map((usage) => [usage.className, usage]));
  const resultsByClassName = new Map<string, ProjectClassPickerResult>();

  if (scope === 'project') {
    for (const definition of catalog.classes) {
      if (!isProjectClassPickerCandidate(definition.className)) continue;
      resultsByClassName.set(definition.className, {
        className: definition.className,
        currentPageUsageCount: usageByClassName.get(definition.className)?.count ?? 0,
        rules: definition.rules,
        sourceFiles: definition.sourceFiles,
      });
    }
  }

  for (const usage of currentPageUsage) {
    const definition = definitionsByClassName.get(usage.className);
    // A project class is one the project's CSS actually defines. This used to
    // admit any used class the Tailwind classifier failed to recognise, so the
    // list filled with utilities the classifier simply did not know --
    // `size-9`, `underline-offset-4`, `tabular-nums`, arbitrary variants -- all
    // labelled "No definition found in project source CSS", which is true and
    // useless. Ask the catalog instead of inferring from a gap in a list.
    if (!definition) continue;
    if (!isProjectClassPickerCandidate(usage.className)) continue;
    resultsByClassName.set(usage.className, {
      className: usage.className,
      currentPageUsageCount: usage.count,
      rules: definition.rules,
      sourceFiles: definition.sourceFiles,
    });
  }

  const normalizedSearch = searchValue.trim().toLowerCase();
  return [...resultsByClassName.values()]
    .filter((result) => {
      if (!normalizedSearch) return true;
      return [result.className, ...result.sourceFiles]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((left, right) => {
      if (scope === 'page' && left.currentPageUsageCount !== right.currentPageUsageCount) {
        return right.currentPageUsageCount - left.currentPageUsageCount;
      }
      return left.className.localeCompare(right.className);
    })
    .slice(0, 120);
}

function isProjectClassPickerCandidate(className: string): boolean {
  if (getClassNameTokenInfo(className).kind !== 'custom') return false;
  if (/^(?:astryx-wb-|wb-)/.test(className)) return false;
  if (/^x[a-z0-9]{5,}$/i.test(className)) return false;
  return true;
}

function formatProjectClassPickerDescription(result: ProjectClassPickerResult): string {
  const usage = result.currentPageUsageCount > 0
    ? `Used ${result.currentPageUsageCount} ${result.currentPageUsageCount === 1 ? 'time' : 'times'} on this page`
    : 'Not used on this page';
  const firstSourceFile = result.sourceFiles[0] ?? 'Project source CSS';
  const sourceLabel = result.sourceFiles.length > 1
    ? `${firstSourceFile} +${result.sourceFiles.length - 1}`
    : firstSourceFile;
  return `${sourceLabel} · ${usage}`;
}

function InspectorVisibilityToggle({
  canEditSourceFields,
  hidden,
  onToggle,
}: {
  canEditSourceFields: boolean;
  hidden: boolean;
  onToggle: () => void;
}) {
  const Icon = hidden ? EyeOff : Eye;

  return (
    <IconButton
      aria-pressed={!hidden}
      className={[
        'wb-inspector-section-action-button',
        !hidden ? 'wb-inspector-section-action-button--active' : '',
      ].filter(Boolean).join(' ')}
      disabled={!canEditSourceFields}
      label={hidden ? 'Show selection' : 'Hide selection'}
      onClick={onToggle}
    >
      <Icon size={13} aria-hidden="true" />
    </IconButton>
  );
}

function InspectorInlineStyleSourceSection({
  assetRegistry,
  canEditSourceFields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const editableDeclarations = getEditableInlineStyleDeclarations(selectedSourceNode);
  const editableProperties = new Set(editableDeclarations.map((declaration) => declaration.property));
  const rawStyleCode = formatInlineStyleCode(selectedSourceNode, editableProperties);
  if (editableDeclarations.length === 0 && !rawStyleCode) return null;

  return (
    <>
      {editableDeclarations.length > 0 || rawStyleCode ? (
        <WorkbenchInspectorSection title="Inline style" density="compact">
          {editableDeclarations.length > 0 ? (
            <WorkbenchInspectorFieldList ariaLabel="Inline style fields" density="compact">
              {editableDeclarations.map(({ property, value }) => {
                const tokenField = getTokenFieldForSourceStyleProperty(property);
                if (!canEditSourceFields || !tokenField) {
                  return (
                    <WorkbenchInspectorField
                      key={property}
                      density="compact"
                      label={property}
                      variant={canEditSourceFields ? 'control' : 'read'}
                    >
                      {canEditSourceFields ? (
                        <SourceStyleTextControl
                          ariaLabel={`${property} inline style`}
                          value={value}
                          onCommit={(nextValue) => onSourceStyleDeclarationChange(property, nextValue)}
                        />
                      ) : (
                        value
                      )}
                    </WorkbenchInspectorField>
                  );
                }
                return (
                  <InspectorStyleField
                    key={property}
                    canEditSourceFields={canEditSourceFields}
                    assetRegistry={assetRegistry}
                    field={{
                      control: { kind: 'text' },
                      editKind: 'source-style',
                      id: `inlineStyle.${property}`,
                      label: property,
                      section: 'context',
                      styleProperty: property,
                      tokenField,
                    }}
                    onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
                    previewTokenModes={previewTokenModes}
                    selectedSourceNode={selectedSourceNode}
                    tokenRegistry={tokenRegistry}
                  />
                );
              })}
            </WorkbenchInspectorFieldList>
          ) : null}
          {rawStyleCode ? (
            <pre className="wb-inspector-inline-style-code">
              <code>{rawStyleCode}</code>
            </pre>
          ) : null}
        </WorkbenchInspectorSection>
      ) : null}
    </>
  );
}

function getEditableInlineStyleDeclarations(
  node: EditableTreeNode | null,
): Array<{ property: SourceStyleProperty; value: string }> {
  const declarations = node?.sourceStyleDeclarations ?? {};
  const metadata = node?.sourceValueMetadata?.styles ?? {};
  const properties = new Set([...Object.keys(declarations), ...Object.keys(metadata)]);
  const entries: Array<{ property: SourceStyleProperty; value: string }> = [];

  for (const property of properties) {
    if (!isEditableSourceStyleProperty(property)) continue;
    const source = metadata[property];
    if (source) {
      if (source.kind === 'literal') {
        entries.push({ property, value: source.value });
      }
      continue;
    }

    const declarationValue = declarations[property];
    if (typeof declarationValue === 'string') {
      entries.push({ property, value: declarationValue });
    }
  }

  return entries;
}

function formatInlineStyleCode(node: EditableTreeNode | null, omittedProperties: ReadonlySet<string> = new Set()): string | null {
  const declarations = node?.sourceStyleDeclarations ?? {};
  const metadata = node?.sourceValueMetadata?.styles ?? {};
  const spreads = node?.sourceValueMetadata?.styleSpreads ?? [];
  const lines: string[] = [];
  const properties = new Set([...Object.keys(declarations), ...Object.keys(metadata)]);

  for (const property of properties) {
    if (omittedProperties.has(property)) continue;
    const source = metadata[property];
    if (source) {
      switch (source.kind) {
        case 'expression':
        case 'spread':
          lines.push(formatInlineStyleExpressionPropertyText(
            property,
            (source as Extract<EditableTreeSourceValueMetadataEntry, { writable: false }>).code,
          ));
          continue;
        case 'literal':
          lines.push(formatInlineStylePropertyText(property, source.value));
          continue;
      }
    }

    const declarationValue = declarations[property];
    if (typeof declarationValue === 'string') {
      lines.push(formatInlineStylePropertyText(property, declarationValue));
    }
  }

  for (const spread of spreads) {
    if (spread.kind === 'spread') lines.push(`...${spread.code}`);
  }

  if (lines.length === 0) return null;

  if (lines.length === 1) {
    return `style={{ ${lines[0]} }}`;
  }

  return `style={{\n${lines.map((line) => `  ${line},`).join('\n')}\n}}`;
}

function formatInlineStylePropertyText(property: string, value: string): string {
  return `${formatInlineStylePropertyKey(property)}: "${escapeInlineStyleStringValue(value)}"`;
}

function formatInlineStyleExpressionPropertyText(property: string, code: string): string {
  return `${formatInlineStylePropertyKey(property)}: ${code}`;
}

function formatInlineStylePropertyKey(property: string): string {
  const camelCase = property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
  return /^[A-Za-z_$][\w$]*$/.test(camelCase) ? camelCase : JSON.stringify(property);
}

function escapeInlineStyleStringValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function InspectorBackgroundSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  tokenRegistry,
}: InspectorTokenizedStyleSectionProps) {
  const tokenFields = fields.filter((field) => field.editKind === 'token-binding');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const activeTokenFields = getActiveTokenBindingDescriptors(tokenFields, selectedTokenBindingNode);
  const visibleStyleFields = getUncoveredSourceStyleDescriptors(styleFields, activeTokenFields);
  const fillStyleFields = visibleStyleFields.filter(isBackgroundFillField);
  const layerStyleFields = visibleStyleFields.filter((field) => !isBackgroundFillField(field));

  if (canEditSourceFields) {
    return (
      <>
        <InspectorFillSection
          activeTokenFields={activeTokenFields}
          assetRegistry={assetRegistry}
          canEditSourceFields={canEditSourceFields}
          fields={fillStyleFields}
          inspectorTokenPickerFilters={inspectorTokenPickerFilters}
          onSourceBindingChange={onSourceBindingChange}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          selectedTokenBindingNode={selectedTokenBindingNode}
          tokenRegistry={tokenRegistry}
        />
        <InspectorBackgroundLayerSection
          assetRegistry={assetRegistry}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
          previewTokenModes={previewTokenModes}
        />
      </>
    );
  }

  return (
    <>
    <WorkbenchInspectorSection title="Fill" density="compact">
      <InspectorTokenBindingFields
        fields={activeTokenFields}
        inspectorTokenPickerFilters={inspectorTokenPickerFilters}
        onSourceBindingChange={onSourceBindingChange}
        onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedTokenBindingNode}
        tokenRegistry={tokenRegistry}
      />
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fillStyleFields}
        onSourceBindingChange={onSourceBindingChange}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
    <WorkbenchInspectorSection title="BG Layers" density="compact">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={layerStyleFields}
        onSourceBindingChange={onSourceBindingChange}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
    </>
  );
}

function InspectorFillSection({
  activeTokenFields,
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  tokenRegistry,
}: {
  activeTokenFields: InspectorFieldDescriptor[];
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  inspectorTokenPickerFilters: InspectorTokenPickerFilters;
  onSourceBindingChange: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  onTokenPickerScopeFilterChange: (field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  selectedTokenBindingNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const fillField = fields.find(isBackgroundFillField) ?? null;
  const fillProperty: SourceStyleProperty = selectedSourceNode?.sourceStyleDeclarations?.background
    ? 'background'
    : 'background-color';
  const fillValue = getBackgroundFillValue(selectedSourceNode?.sourceStyleDeclarations);
  const fillSource = selectedSourceNode?.sourceValueMetadata?.styles?.['background-color'] ??
    selectedSourceNode?.sourceValueMetadata?.styles?.background ??
    null;
  const readOnlyFillSource = fillSource && !fillSource.writable ? fillSource : null;

  return (
    <WorkbenchInspectorSection title="Fill" density="compact">
      <InspectorTokenBindingFields
        fields={activeTokenFields}
        inspectorTokenPickerFilters={inspectorTokenPickerFilters}
        onSourceBindingChange={onSourceBindingChange}
        onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedTokenBindingNode}
        tokenRegistry={tokenRegistry}
      />
      {selectedSourceNode?.sourceValueMetadata?.styleSpreads?.map((source, index) => (
        <WorkbenchInspectorField
          key={`style-spread-${index}`}
          label={index === 0 ? 'Style spread' : `Style spread ${index + 1}`}
          labelMode="visible"
          density="compact"
          variant="read"
        >
          <SourceValueMetadataControl
            ariaLabel={`Style spread ${index + 1}`}
            source={source}
          />
        </WorkbenchInspectorField>
      ))}
      {fillField?.styleProperty ? (
        <WorkbenchInspectorField
          label={fillField.label}
          labelMode="hidden"
          density="compact"
          variant={canEditSourceFields && !readOnlyFillSource ? 'control' : 'read'}
        >
          {readOnlyFillSource ? (
            <SourceValueMetadataControl
              ariaLabel="Fill source style"
              onDetach={readOnlyFillSource.detachableValue
                ? () => {
                    onSourceStyleDeclarationChange(fillProperty, readOnlyFillSource.detachableValue!);
                  }
                : undefined}
              source={readOnlyFillSource}
            />
          ) : canEditSourceFields ? (
            <SourceStyleDeclarationControl
              key={`${selectedSourceNode?.id ?? 'none'}:${fillField.id}:${fillProperty}`}
              ariaLabel="Fill source style"
              assetRegistry={assetRegistry}
              control={getSourceStyleDeclarationControl(fillField)}
              field={fillField}
              onTokenBindingSelect={(reference) => onSourceBindingChange('background', reference)}
              previewTokenModes={previewTokenModes}
              tokenField={fillField.tokenField}
              tokenRegistry={tokenRegistry}
              value={fillValue}
              onCommit={(nextValue) => {
                onSourceStyleDeclarationChange(fillProperty, nextValue);
              }}
            />
          ) : (
            fillValue || 'Not set'
          )}
        </WorkbenchInspectorField>
      ) : null}
    </WorkbenchInspectorSection>
  );
}

type BackgroundLayer = {
  blend: string;
  draft?: boolean;
  image: string;
  kind: 'color' | 'image' | 'video';
  position: string;
  repeat: string;
  size: string;
};

const DEFAULT_BACKGROUND_LAYER: Omit<BackgroundLayer, 'image' | 'kind' | 'draft'> = {
  blend: 'normal',
  position: 'center',
  repeat: 'no-repeat',
  size: 'cover',
};

function InspectorBackgroundLayerSection({
  assetRegistry,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const [openLayerIndex, setOpenLayerIndex] = useState<number | null>(null);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [draftLayers, setDraftLayers] = useState<BackgroundLayer[]>([]);
  const declarations = selectedSourceNode?.sourceStyleDeclarations ?? {};
  const sourceLayers = parseBackgroundLayers(declarations);
  const layers = [...draftLayers, ...sourceLayers];

  useEffect(() => {
    if (openLayerIndex === null) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element
        ? event.target
        : event.target instanceof Node
          ? event.target.parentElement
          : null;
      if (target?.closest('.wb-background-layer-settings, .wb-background-layer-row__tools')) return;
      if (isInspectorFloatingPickerTarget(event.target)) return;
      setOpenLayerIndex(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenLayerIndex(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openLayerIndex]);

  const commitLayers = useCallback((nextLayers: BackgroundLayer[]) => {
    const normalizedLayers = nextLayers.filter((layer) => layer.image.trim());
    const cssLayers = normalizedLayers.filter((layer) => layer.kind !== 'video');
    const videoLayers = normalizedLayers
      .filter((layer) => layer.kind === 'video')
      .map((layer) => ({
        blend: layer.blend,
        position: layer.position,
        size: layer.size,
        source: layer.image,
      }));
    const fillValue = getBackgroundFillValue(declarations);
    onSourceStyleDeclarationChange('background', null);
    if (!declarations['background-color'] && fillValue) {
      onSourceStyleDeclarationChange('background-color', fillValue);
    }
    onSourceStyleDeclarationChange('background-image', serializeBackgroundLayerProperty(cssLayers, 'image'));
    onSourceStyleDeclarationChange('background-size', serializeBackgroundLayerProperty(cssLayers, 'size'));
    onSourceStyleDeclarationChange('background-position', serializeBackgroundLayerProperty(cssLayers, 'position'));
    onSourceStyleDeclarationChange('background-repeat', serializeBackgroundLayerProperty(cssLayers, 'repeat'));
    onSourceStyleDeclarationChange('background-blend-mode', serializeBackgroundLayerProperty(cssLayers, 'blend'));
    onSourceStyleDeclarationChange(SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY, serializeSourceBackgroundVideoLayerProperty(videoLayers, 'source'));
    onSourceStyleDeclarationChange(SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY, serializeSourceBackgroundVideoLayerProperty(videoLayers, 'size'));
    onSourceStyleDeclarationChange(SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY, serializeSourceBackgroundVideoLayerProperty(videoLayers, 'position'));
    onSourceStyleDeclarationChange(SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY, serializeSourceBackgroundVideoLayerProperty(videoLayers, 'blend'));
    if (videoLayers.length > 0) {
      if (!declarations.position || declarations.position === 'static') {
        onSourceStyleDeclarationChange('position', 'relative');
      }
      if (!declarations.overflow) {
        onSourceStyleDeclarationChange('overflow', 'hidden');
      }
      if (!declarations.isolation) {
        onSourceStyleDeclarationChange('isolation', 'isolate');
      }
    }
  }, [declarations, onSourceStyleDeclarationChange]);

  const addImageLayer = (image: string) => {
    setDraftLayers([]);
    commitLayers([{ ...DEFAULT_BACKGROUND_LAYER, image, kind: 'image' }, ...sourceLayers]);
  };
  const addVideoLayer = (source: string) => {
    setDraftLayers([]);
    commitLayers([{ ...DEFAULT_BACKGROUND_LAYER, image: source, kind: 'video' }, ...sourceLayers]);
  };
  const addDraftColorLayer = () => {
    setDraftLayers((current) => [
      { ...DEFAULT_BACKGROUND_LAYER, draft: true, image: '', kind: 'color' },
      ...current,
    ]);
    setOpenLayerIndex(0);
  };
  const updateLayer = (index: number, patch: Partial<BackgroundLayer>) => {
    const nextLayers = layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...patch } : layer);
    const pendingDraftLayers = nextLayers.filter((layer) => layer.draft && !layer.image.trim());
    setDraftLayers(pendingDraftLayers);
    if (nextLayers.some((layer) => !layer.draft || layer.image.trim())) {
      commitLayers(nextLayers);
    }
  };
  const moveLayer = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= layers.length) return;
    const nextLayers = [...layers];
    const [layer] = nextLayers.splice(index, 1);
    if (!layer) return;
    nextLayers.splice(nextIndex, 0, layer);
    setDraftLayers(nextLayers.filter((candidate) => candidate.draft && !candidate.image.trim()));
    commitLayers(nextLayers);
  };
  const moveLayerTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= layers.length || toIndex < 0 || toIndex >= layers.length) return;
    const nextLayers = [...layers];
    const [layer] = nextLayers.splice(fromIndex, 1);
    if (!layer) return;
    nextLayers.splice(toIndex, 0, layer);
    setDraftLayers(nextLayers.filter((candidate) => candidate.draft && !candidate.image.trim()));
    commitLayers(nextLayers);
    setOpenLayerIndex((current) => {
      if (current === null) return current;
      if (current === fromIndex) return toIndex;
      if (fromIndex < current && toIndex >= current) return current - 1;
      if (fromIndex > current && toIndex <= current) return current + 1;
      return current;
    });
  };
  const removeLayer = (index: number) => {
    const nextLayers = layers.filter((_, layerIndex) => layerIndex !== index);
    setDraftLayers(nextLayers.filter((layer) => layer.draft && !layer.image.trim()));
    commitLayers(nextLayers);
  };

  const actions = (
    <span className="wb-background-layer-editor__actions">
        <AssetPickerButton
          ariaLabel="Add background media"
          assets={assetRegistry}
          kinds={['image', 'video', 'icon']}
          onSelect={(asset) => {
            if (getEffectiveDesignAssetKind(asset) === 'video') {
              addVideoLayer(getDesignAssetUsageValue(asset));
              return;
            }
            addImageLayer(getDesignAssetCssSnippet(asset));
          }}
          onSelectPreview={(preview) => addImageLayer(`url("${escapeCssUrlString(preview.value)}")`)}
        />
        <IconButton
          className="wb-inspector-asset-picker-trigger"
          label="Add background color"
          title="Add background color"
          onClick={addDraftColorLayer}
        >
          <Palette size={13} aria-hidden="true" />
        </IconButton>
      </span>
  );

  return (
    <WorkbenchInspectorSection title="BG Layers" density="compact" actions={actions}>
      <div className="wb-background-layer-editor">
      {layers.length === 0 ? (
        <div className="wb-background-layer-empty">No background layers</div>
      ) : (
        <div className="wb-background-layer-list">
          {layers.map((layer, index) => (
            <BackgroundLayerRow
              key={`${index}:${layer.kind}:${layer.image}:${layer.draft ? 'draft' : 'source'}`}
              layer={layer}
              layerNumber={index + 1}
              canMoveDown={index < layers.length - 1}
              canMoveUp={index > 0}
              dragging={draggedLayerIndex === index}
              settingsOpen={openLayerIndex === index}
              previewTokenModes={previewTokenModes}
              tokenRegistry={tokenRegistry}
              onMoveDown={() => moveLayer(index, 1)}
              onMoveUp={() => moveLayer(index, -1)}
              onRemove={() => removeLayer(index)}
              onDragEnd={() => setDraggedLayerIndex(null)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDragStart={(event) => {
                setDraggedLayerIndex(index);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
                setDraggedLayerIndex(null);
                if (Number.isInteger(sourceIndex)) moveLayerTo(sourceIndex, index);
              }}
              onToggleSettings={() => setOpenLayerIndex((current) => current === index ? null : index)}
              onUpdate={(patch) => updateLayer(index, patch)}
            />
          ))}
        </div>
      )}
      </div>
    </WorkbenchInspectorSection>
  );
}

function BackgroundLayerRow({
  canMoveDown,
  canMoveUp,
  dragging,
  layer,
  layerNumber,
  previewTokenModes,
  settingsOpen,
  tokenRegistry,
  onMoveDown,
  onMoveUp,
  onRemove,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onToggleSettings,
  onUpdate,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  dragging: boolean;
  layer: BackgroundLayer;
  layerNumber: number;
  previewTokenModes: PreviewTokenModeSelection;
  settingsOpen: boolean;
  tokenRegistry: TokenRegistry;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onDragEnd: () => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onToggleSettings: () => void;
  onUpdate: (patch: Partial<BackgroundLayer>) => void;
}) {
  const color = layer.kind === 'color' ? getBackgroundColorLayerColor(layer.image) : null;
  const isColor = layer.kind === 'color';
  const isVideo = layer.kind === 'video';
  const colorValue = color ?? '';
  const selectedColorToken = isColor && colorValue
    ? findSourceStyleTokenResult(tokenRegistry, 'bgColor', colorValue, previewTokenModes)
    : null;
  const colorInputValue = selectedColorToken
    ? formatSourceStyleTokenRawValue(selectedColorToken, tokenRegistry) ?? colorValue
    : colorValue;
  const selectedColorTokenReference = selectedColorToken
    ? { collectionId: selectedColorToken.collection.id, tokenId: selectedColorToken.token.id }
    : null;

  return (
    <div
      className={dragging ? 'wb-background-layer-row wb-background-layer-row--dragging' : 'wb-background-layer-row'}
      draggable
      aria-expanded={settingsOpen}
      aria-label={`${isColor ? 'Color' : isVideo ? 'Video' : 'Image'} background layer ${layerNumber} settings`}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('.wb-background-layer-row__tools, .wb-background-layer-drag, .wb-background-layer-settings')) return;
        onToggleSettings();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('.wb-background-layer-row__tools, .wb-background-layer-settings')) return;
        event.preventDefault();
        onToggleSettings();
      }}
    >
      <div className="wb-background-layer-row__head">
        <span className="wb-background-layer-drag" title="Drag to reorder">
          <GripVertical size={13} aria-hidden="true" />
        </span>
        <span
          className={layer.image ? 'wb-background-layer-preview' : 'wb-background-layer-preview wb-background-layer-preview--empty'}
          style={{ background: isVideo ? undefined : layer.image || undefined }}
          aria-hidden="true"
        >
          {isColor ? null : isVideo ? <FileVideo size={14} aria-hidden="true" /> : <ImageIcon size={14} aria-hidden="true" />}
        </span>
        <strong>{isColor ? 'Color' : isVideo ? 'Video' : 'Image'} {layerNumber}</strong>
        <span className="wb-background-layer-row__tools">
          <IconButton label="Move background layer up" disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp size={12} aria-hidden="true" />
          </IconButton>
          <IconButton label="Move background layer down" disabled={!canMoveDown} onClick={onMoveDown}>
            <ArrowDown size={12} aria-hidden="true" />
          </IconButton>
          <IconButton label="Remove background layer" onClick={onRemove}>
            <Trash2 size={12} aria-hidden="true" />
          </IconButton>
        </span>
      </div>
      {settingsOpen ? (
        <ModalLayer
          className="wb-background-layer-settings-modal"
          title={`${isColor ? 'Color' : isVideo ? 'Video' : 'Image'} layer ${layerNumber}`}
          onClose={onToggleSettings}
        >
        <div className="wb-background-layer-settings" draggable={false} onDragStart={(event) => event.preventDefault()}>
          {isColor ? (
            <SourceStyleTextControl
              ariaLabel={`Background color layer ${layerNumber} value`}
              leading={(
                <BackgroundLayerColorSwatch
                  color={colorInputValue}
                  label={`Background color layer ${layerNumber}`}
                  onChange={(value) => onUpdate({ image: formatBackgroundColorLayer(value) })}
                />
              )}
              showClearButton={!selectedColorToken}
              tokenized={Boolean(selectedColorToken)}
              trailing={(
                <span className="wb-inspector-trailing-actions">
                <InspectorTokenPicker
                  ariaLabel={`Background color layer ${layerNumber} token`}
                  className="wb-background-layer-token-picker"
                  field="bgColor"
                  modeByCollection={previewTokenModes}
                  registry={tokenRegistry}
                  selected={selectedColorTokenReference}
                  triggerMode="icon"
                  onClear={selectedColorToken
                    ? () => {
                        const rawValue = formatSourceStyleTokenRawValue(selectedColorToken, tokenRegistry);
                        onUpdate({ image: rawValue ? formatBackgroundColorLayer(rawValue) : '' });
                      }
                    : undefined}
                  onSelect={(reference) => {
                    const cssVariable = getSourceStyleTokenCssVariable(tokenRegistry, 'bgColor', reference, previewTokenModes);
                    if (cssVariable) onUpdate({ image: formatBackgroundColorLayer(cssVariable) });
                  }}
                />
                </span>
              )}
              value={colorInputValue}
              onCommit={(value) => onUpdate({ image: value ? formatBackgroundColorLayer(value) : '' })}
            />
          ) : (
            <SourceStyleTextControl
              ariaLabel={`Background ${isVideo ? 'video' : 'image'} layer ${layerNumber}`}
              value={layer.image}
              onCommit={(value) => onUpdate({ image: value ?? '' })}
            />
          )}
          <div className="wb-background-layer-grid">
            <SelectControl<string>
              aria-label={`Background layer ${layerNumber} size`}
              value={layer.size}
              onValueChange={(value) => onUpdate({ size: value })}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="auto">Auto</option>
              <option value="100% 100%">Fill</option>
            </SelectControl>
            <SelectControl<string>
              aria-label={`Background layer ${layerNumber} position`}
              value={layer.position}
              onValueChange={(value) => onUpdate({ position: value })}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="top left">Top L</option>
              <option value="top right">Top R</option>
              <option value="bottom left">Bot L</option>
              <option value="bottom right">Bot R</option>
            </SelectControl>
            <SelectControl<string>
              aria-label={`Background layer ${layerNumber} repeat`}
              value={layer.repeat}
              disabled={isVideo}
              onValueChange={(value) => onUpdate({ repeat: value })}
            >
              <option value="no-repeat">No repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
            </SelectControl>
            <SelectControl<string>
              aria-label={`Background layer ${layerNumber} blend`}
              value={layer.blend}
              onValueChange={(value) => onUpdate({ blend: value })}
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Dodge</option>
              <option value="color-burn">Burn</option>
              <option value="hard-light">Hard</option>
              <option value="soft-light">Soft</option>
              <option value="difference">Diff</option>
              <option value="exclusion">Exclude</option>
            </SelectControl>
          </div>
        </div>
        </ModalLayer>
      ) : null}
    </div>
  );
}

function BackgroundLayerColorSwatch({
  color,
  label,
  onChange,
}: {
  color: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const editableColor = getEditableHexColor(color) ?? '#ffffff';
  return (
    <label
      className={color ? 'wb-inspector-style-color-swatch wb-background-layer-color-swatch' : 'wb-inspector-style-color-swatch wb-background-layer-color-swatch wb-background-layer-color-swatch--empty'}
      style={{ background: color || undefined }}
      title={color || 'Transparent'}
    >
      <input
        aria-label={label}
        type="color"
        value={editableColor}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function parseBackgroundLayers(declarations: EditableTreeNode['sourceStyleDeclarations']): BackgroundLayer[] {
  const videoLayers = parseSourceBackgroundVideoLayers(declarations).map((layer): BackgroundLayer => ({
    blend: layer.blend,
    image: layer.source,
    kind: 'video',
    position: layer.position,
    repeat: DEFAULT_BACKGROUND_LAYER.repeat,
    size: layer.size,
  }));
  const imageLayers = splitCssCommaList(declarations?.['background-image'] ?? '')
    .filter((value) => value && value.toLowerCase() !== 'none');
  const background = declarations?.background?.trim();
  const shorthandFallbackLayers = background && background.toLowerCase() !== 'none'
    ? looksLikeBackgroundColorValue(background) ? [] : [background]
    : [];
  const fallbackLayers = imageLayers.length === 0
    ? shorthandFallbackLayers
    : [];
  const images = imageLayers.length > 0 ? imageLayers : fallbackLayers;
  const sizes = splitCssCommaList(declarations?.['background-size'] ?? '');
  const positions = splitCssCommaList(declarations?.['background-position'] ?? '');
  const repeats = splitCssCommaList(declarations?.['background-repeat'] ?? '');
  const blends = splitCssCommaList(declarations?.['background-blend-mode'] ?? '');

  const cssLayers = images.map((image, index): BackgroundLayer => ({
    blend: blends[index] || DEFAULT_BACKGROUND_LAYER.blend,
    image,
    kind: getBackgroundColorLayerColor(image) ? 'color' : 'image',
    position: positions[index] || DEFAULT_BACKGROUND_LAYER.position,
    repeat: repeats[index] || DEFAULT_BACKGROUND_LAYER.repeat,
    size: sizes[index] || DEFAULT_BACKGROUND_LAYER.size,
  }));
  return [...videoLayers, ...cssLayers];
}

type BackgroundLayerSerializableProperty = 'blend' | 'image' | 'position' | 'repeat' | 'size';

function serializeBackgroundLayerProperty(
  layers: BackgroundLayer[],
  property: BackgroundLayerSerializableProperty,
): string | null {
  if (layers.length === 0) return null;
  return layers.map((layer) => {
    const value = layer[property].trim();
    if (value) return value;
    if (property === 'image') return 'none';
    return DEFAULT_BACKGROUND_LAYER[property] || 'normal';
  }).join(', ');
}

function splitCssCommaList(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]!;
    const previous = value[index - 1];
    if (quote) {
      current += char;
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function formatBackgroundColorLayer(value: string): string {
  const color = value.trim() || '#ffffff';
  return `linear-gradient(${color}, ${color})`;
}

function getBackgroundColorLayerColor(value: string): string | null {
  const match = value.trim().match(/^linear-gradient\((.*)\)$/i);
  if (!match) return null;
  const parts = splitCssCommaList(match[1] ?? '');
  if (parts.length !== 2 || parts[0] !== parts[1]) return null;
  return parts[0] ?? null;
}

function looksLikeBackgroundColorValue(value: string): boolean {
  const trimmed = value.trim();
  return Boolean(getEditableHexColor(trimmed)) ||
    /^(?:rgb|hsl|color-mix|var)\(/i.test(trimmed) ||
    /^[a-z]+$/i.test(trimmed);
}

function isBackgroundFillField(field: InspectorFieldDescriptor): boolean {
  return field.id === 'background.fill';
}

function getBackgroundFillValue(declarations: EditableTreeNode['sourceStyleDeclarations']): string {
  const backgroundColor = declarations?.['background-color']?.trim();
  if (backgroundColor) return backgroundColor;
  const background = declarations?.background?.trim();
  if (background && looksLikeBackgroundColorValue(background)) return background;
  return '';
}

function InspectorControlGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="wb-inspector-control-group" aria-label={label}>
      <div className="wb-inspector-control-group-title">{label}</div>
      <div className="wb-inspector-control-group-body">
        {children}
      </div>
    </div>
  );
}

function InspectorTypographySection({
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  tokenRegistry,
}: InspectorTokenizedStyleSectionProps) {
  const tokenFields = fields.filter((field) => field.editKind === 'token-binding');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const activeTokenFields = getActiveTokenBindingDescriptors(tokenFields, selectedTokenBindingNode);
  const visibleStyleFields = getUncoveredSourceStyleDescriptors(styleFields, activeTokenFields);
  const fieldGroups = getTypographyInspectorFieldGroups(visibleStyleFields);

  return (
    <WorkbenchInspectorSection title="Typography" density="compact">
      <div className="wb-inspector-control-group-list">
        {activeTokenFields.length > 0 ? (
          <InspectorControlGroup label="Tokens">
            <InspectorTokenBindingFields
              fields={activeTokenFields}
              inspectorTokenPickerFilters={inspectorTokenPickerFilters}
              onSourceBindingChange={onSourceBindingChange}
              onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedTokenBindingNode}
              tokenRegistry={tokenRegistry}
            />
          </InspectorControlGroup>
        ) : null}
        {fieldGroups.map((group) => (
          <InspectorControlGroup key={group.id} label={group.label}>
            <InspectorStyleFields
              canEditSourceFields={canEditSourceFields}
              assetRegistry={assetRegistry}
              fields={group.fields}
              onSourceBindingChange={onSourceBindingChange}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          </InspectorControlGroup>
        ))}
      </div>
    </WorkbenchInspectorSection>
  );
}

type TypographyInspectorFieldGroup = {
  fields: InspectorFieldDescriptor[];
  id: string;
  label: string;
};

const TYPOGRAPHY_INSPECTOR_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'character', label: 'Character' },
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'flow', label: 'Wrap & clamp' },
  { id: 'columns', label: 'Columns' },
  { id: 'advanced', label: 'Advanced' },
];

function getTypographyInspectorFieldGroups(fields: InspectorFieldDescriptor[]): TypographyInspectorFieldGroup[] {
  const groups = new Map<string, InspectorFieldDescriptor[]>(
    TYPOGRAPHY_INSPECTOR_GROUPS.map((group) => [group.id, []]),
  );

  for (const field of fields) {
    const groupId = getTypographyInspectorFieldGroupId(field);
    groups.set(groupId, [...(groups.get(groupId) ?? []), field]);
  }

  return TYPOGRAPHY_INSPECTOR_GROUPS
    .map((group) => ({
      ...group,
      fields: groups.get(group.id) ?? [],
    }))
    .filter((group) => group.fields.length > 0);
}

function getTypographyInspectorFieldGroupId(field: InspectorFieldDescriptor): string {
  if (field.id.startsWith('typography.columns.')) return 'columns';

  switch (field.id) {
    case 'typography.fontSize':
    case 'typography.fontWeight':
    case 'typography.color':
    case 'typography.fontFamily':
    case 'typography.style':
    case 'typography.transform':
    case 'typography.decoration':
      return 'character';
    case 'typography.align':
    case 'typography.verticalAlign':
    case 'typography.lineHeight':
    case 'typography.indent':
    case 'typography.letterSpacing':
      return 'paragraph';
    case 'typography.wrap':
    case 'typography.overflowWrap':
    case 'typography.wordBreak':
    case 'typography.hyphens':
    case 'typography.truncate':
    case 'typography.lineClamp':
    case 'typography.clampOrient':
      return 'flow';
    default:
      return 'advanced';
  }
}

function InspectorBorderSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  tokenRegistry,
}: InspectorTokenizedStyleSectionProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRootRef = useRef<HTMLSpanElement>(null);
  const tokenFields = fields.filter((field) => field.editKind === 'token-binding');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const activeTokenFields = getActiveTokenBindingDescriptors(tokenFields, selectedTokenBindingNode);
  const visibleStyleFields = getUncoveredSourceStyleDescriptors(styleFields, activeTokenFields);
  const primaryStyleFields = visibleStyleFields.filter((field) => (
    isPrimaryBorderField(field) ||
    hasSourceStyleDeclaration(field, selectedSourceNode)
  ));
  const primaryStyleFieldIds = new Set(primaryStyleFields.map((field) => field.id));
  const layerStyleFields = visibleStyleFields.filter((field) => !primaryStyleFieldIds.has(field.id));
  const hasLayerOptions = layerStyleFields.length > 0;

  useEffect(() => {
    if (!optionsOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && optionsRootRef.current?.contains(target)) return;
      if (isInspectorFloatingPickerTarget(event.target)) return;
      setOptionsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOptionsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [optionsOpen]);

  return (
    <WorkbenchInspectorSection
      title="Border"
      density="compact"
      actions={hasLayerOptions ? (
        <span className="wb-inspector-section-action-popover-root" ref={optionsRootRef}>
          <IconButton
            aria-expanded={optionsOpen}
            aria-haspopup="dialog"
            aria-pressed={optionsOpen}
            className={[
              'wb-inspector-section-action-button',
              optionsOpen ? 'wb-inspector-section-action-button--active' : '',
            ].filter(Boolean).join(' ')}
            label={optionsOpen ? 'Close border options' : 'Open border options'}
            onClick={() => setOptionsOpen((open) => !open)}
          >
            <SlidersHorizontal size={13} aria-hidden="true" />
          </IconButton>
          {optionsOpen ? (
            <InspectorBorderOptionsMenu
              assetRegistry={assetRegistry}
              canEditSourceFields={canEditSourceFields}
              fields={layerStyleFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}
        </span>
      ) : null}
    >
      <InspectorTokenBindingFields
        fields={activeTokenFields}
        inspectorTokenPickerFilters={inspectorTokenPickerFilters}
        onSourceBindingChange={onSourceBindingChange}
        onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedTokenBindingNode}
        tokenRegistry={tokenRegistry}
      />
      {primaryStyleFields.length > 0 ? (
        <InspectorStyleFields
          canEditSourceFields={canEditSourceFields}
          fields={primaryStyleFields}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
    </WorkbenchInspectorSection>
  );
}

function InspectorBorderOptionsMenu({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const radiusFields = fields.filter((field) => field.id.startsWith('border.radius.'));
  const otherFields = fields.filter((field) => !field.id.startsWith('border.radius.'));

  return (
    <div className="wb-popover-panel wb-popover-panel--form wb-inspector-options-menu" role="dialog" aria-label="Border options">
      {radiusFields.length > 0 ? (
        <InspectorDirectionalStyleGroup
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={radiusFields}
          label="Radius corners"
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
      {otherFields.length > 0 ? (
        <InspectorStyleFields
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={otherFields}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
    </div>
  );
}

function InspectorOutlineSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchInspectorSection title="Outline" density="compact">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorVectorFillSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchInspectorSection title="SVG Fill" density="compact">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorStrokeSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchInspectorSection title="Stroke" density="compact">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

type InspectorTokenizedStyleSectionProps = {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  inspectorTokenPickerFilters: InspectorTokenPickerFilters;
  onSourceBindingChange: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  onTokenPickerScopeFilterChange: (field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  selectedTokenBindingNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
};

function InspectorTokenizedStyleSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  title,
  tokenRegistry,
}: InspectorTokenizedStyleSectionProps & {
  title: string;
}) {
  const tokenFields = fields.filter((field) => field.editKind === 'token-binding');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const activeTokenFields = getActiveTokenBindingDescriptors(tokenFields, selectedTokenBindingNode);
  const visibleStyleFields = getUncoveredSourceStyleDescriptors(styleFields, activeTokenFields);

  return (
    <WorkbenchInspectorSection title={title} density="compact">
      <InspectorTokenBindingFields
        fields={activeTokenFields}
        inspectorTokenPickerFilters={inspectorTokenPickerFilters}
        onSourceBindingChange={onSourceBindingChange}
        onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedTokenBindingNode}
        tokenRegistry={tokenRegistry}
      />
      {visibleStyleFields.length > 0 ? (
        <InspectorStyleFields
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={visibleStyleFields}
          onSourceBindingChange={onSourceBindingChange}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
    </WorkbenchInspectorSection>
  );
}

function InspectorLayoutSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  model,
  onSourceAttributeChange,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedLayer,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  model: HtmlInspectorModel;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedLayer: PreviewLayer | null;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const attributes = getSourceAttributes(selectedLayer, selectedSourceNode);
  const attributeFields = fields.filter((field) => field.editKind !== 'source-style');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const offsetStyleFields = styleFields.filter(isLayoutInsetField);
  const layoutDisplayValue = getLayoutDisplayValue(selectedLayer, selectedSourceNode);
  const visibleStyleFields = getVisibleLayoutStyleFields(
    styleFields,
    layoutDisplayValue,
    selectedSourceNode?.sourceStyleDeclarations?.position ?? '',
  ).filter((field) => !isLayoutInsetField(field));

  return (
    <WorkbenchInspectorSection title="Layout" density="compact">
      {attributeFields.map((field) => {
        const attributeName = field.attributeName ?? null;
        const fieldValue = formatDescriptorFieldValue(field, model, attributes, selectedSourceNode);

        return (
          <WorkbenchInspectorField
            key={field.id}
            label={field.label}
            labelMode={canEditSourceFields && attributeName ? 'hidden' : 'visible'}
            density="compact"
            variant={canEditSourceFields && attributeName ? 'control' : 'read'}
          >
            {canEditSourceFields && attributeName ? (
              <SourceAttributeControl
                ariaLabel={`${field.label} source attribute`}
                leading={getInspectorFieldLeading(field)}
                placeholder={fieldValue === 'Not set' || fieldValue === 'Auto' ? undefined : fieldValue}
                value={attributes[attributeName] ?? ''}
                onCommit={(value) => onSourceAttributeChange(attributeName, value)}
              />
            ) : (
              fieldValue
            )}
          </WorkbenchInspectorField>
        );
      })}
      {visibleStyleFields.length > 0 ? (
        <InspectorLayoutStyleFields
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={visibleStyleFields}
          offsetFields={offsetStyleFields}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
    </WorkbenchInspectorSection>
  );
}

function InspectorFlexItemSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchInspectorSection title="Flex item" density="compact" meta="inside parent">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorLayoutStyleFields({
  assetRegistry,
  canEditSourceFields,
  fields,
  offsetFields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  offsetFields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <>
      {fields.map((field) => {
        if (field.id === 'layout.position') {
          return (
            <InspectorPositionStyleField
              key={field.id}
              canEditSourceFields={canEditSourceFields}
              assetRegistry={assetRegistry}
              field={field}
              offsetFields={offsetFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          );
        }

        return (
          <InspectorStyleField
            key={field.id}
            canEditSourceFields={canEditSourceFields}
            assetRegistry={assetRegistry}
            field={field}
            onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
            previewTokenModes={previewTokenModes}
            selectedSourceNode={selectedSourceNode}
            tokenRegistry={tokenRegistry}
          />
        );
      })}
    </>
  );
}

function InspectorPositionStyleField({
  assetRegistry,
  canEditSourceFields,
  field,
  offsetFields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  field: InspectorFieldDescriptor;
  offsetFields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const [offsetsOpen, setOffsetsOpen] = useState(false);
  const offsetsRootRef = useRef<HTMLSpanElement>(null);
  const declarations = selectedSourceNode?.sourceStyleDeclarations ?? {};
  const property = field.styleProperty ?? null;
  const value = property ? declarations[property] ?? '' : '';
  const valueSource = property ? selectedSourceNode?.sourceValueMetadata?.styles?.[property] ?? null : null;
  const readOnlySource = valueSource && !valueSource.writable ? valueSource : null;
  const position = normalizeLayoutPosition(value);
  const hidesLabel = canEditSourceFields && Boolean(property) && !shouldShowInspectorFieldLabel(field);
  const settingsDisabled = !canEditSourceFields || !property || Boolean(readOnlySource) || !canEditLayoutPositionOffsets(position) || offsetFields.length === 0;

  useEffect(() => {
    if (settingsDisabled) setOffsetsOpen(false);
  }, [settingsDisabled]);

  useEffect(() => {
    if (!offsetsOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && offsetsRootRef.current?.contains(target)) return;
      setOffsetsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOffsetsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [offsetsOpen]);

  return (
    <WorkbenchInspectorField
      label={field.label}
      labelMode={hidesLabel ? 'hidden' : 'visible'}
      density="compact"
      variant={canEditSourceFields && property && !readOnlySource ? 'control' : 'read'}
    >
      {readOnlySource ? (
        <SourceValueMetadataControl
          ariaLabel={`${field.label} source style`}
          onDetach={readOnlySource.detachableValue && property
            ? () => onSourceStyleDeclarationChange(property, readOnlySource.detachableValue!)
            : undefined}
          source={readOnlySource}
        />
      ) : canEditSourceFields && property ? (
        <span className="wb-inspector-position-control" ref={offsetsRootRef}>
          <SourceStyleDeclarationControl
            key={`${selectedSourceNode?.id ?? 'none'}:${field.id}`}
            ariaLabel={`${field.label} source style`}
            assetRegistry={assetRegistry}
            control={getSourceStyleDeclarationControl(field)}
            field={field}
            leading={hidesLabel ? getInspectorFieldLeading(field) : undefined}
            previewTokenModes={previewTokenModes}
            tokenField={field.tokenField}
            tokenRegistry={tokenRegistry}
            value={value}
            onCommit={(nextValue) => onSourceStyleDeclarationChange(property, nextValue)}
          />
          <IconButton
            aria-expanded={offsetsOpen}
            aria-haspopup="dialog"
            aria-pressed={offsetsOpen}
            className={[
              'wb-inspector-position-settings-button',
              offsetsOpen ? 'wb-inspector-position-settings-button--active' : '',
            ].filter(Boolean).join(' ')}
            disabled={settingsDisabled}
            label={offsetsOpen ? 'Close position offsets' : 'Open position offsets'}
            onClick={() => {
              if (settingsDisabled) return;
              setOffsetsOpen((open) => !open);
            }}
          >
            <SlidersHorizontal size={13} aria-hidden="true" />
          </IconButton>
          {offsetsOpen ? (
            <InspectorDirectionalStyleOptionsMenu
              ariaLabel="Position offsets"
              assetRegistry={assetRegistry}
              canEditSourceFields={canEditSourceFields}
              className="wb-inspector-position-offset-menu"
              groups={[{ label: 'Offsets', fields: offsetFields }]}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}
        </span>
      ) : (
        value || 'Not set'
      )}
    </WorkbenchInspectorField>
  );
}

function InspectorAccessibilitySection({
  canEditSourceFields,
  fields,
  model,
  onSourceAttributeChange,
  selectedLayer,
  selectedSourceNode,
}: {
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  model: HtmlInspectorModel;
  onSourceAttributeChange: (attributeName: SourceAttributeName, value: string | null) => void;
  selectedLayer: PreviewLayer | null;
  selectedSourceNode: EditableTreeNode | null;
}) {
  const attributes = getSourceAttributes(selectedLayer, selectedSourceNode);

  return (
    <WorkbenchInspectorSection title="Accessibility" density="compact">
      {fields.map((field) => {
        const attributeName = field.attributeName ?? null;
        const fieldValue = formatDescriptorFieldValue(field, model, attributes, selectedSourceNode);

        return (
        <WorkbenchInspectorField
          key={field.id}
          label={field.label}
          labelMode={canEditSourceFields && attributeName ? 'hidden' : 'visible'}
          density="compact"
          variant={canEditSourceFields && attributeName ? 'control' : 'read'}
        >
          {canEditSourceFields && attributeName ? (
            <SourceAttributeControl
              ariaLabel={`${field.label} source attribute`}
              leading={getInspectorFieldLeading(field)}
              placeholder={fieldValue === 'Not set' || fieldValue === 'Native' ? undefined : fieldValue}
              value={attributes[attributeName] ?? ''}
              onCommit={(value) => onSourceAttributeChange(attributeName, value)}
            />
          ) : (
            fieldValue
          )}
        </WorkbenchInspectorField>
      );
      })}
    </WorkbenchInspectorSection>
  );
}

function InspectorSpacingSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  selectedTokenBindingNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  inspectorTokenPickerFilters: InspectorTokenPickerFilters;
  onSourceBindingChange: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  onTokenPickerScopeFilterChange: (field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  selectedTokenBindingNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRootRef = useRef<HTMLSpanElement>(null);
  const tokenFields = fields.filter((field) => field.editKind === 'token-binding');
  const styleFields = fields.filter((field) => field.editKind === 'source-style');
  const activeTokenFields = getActiveTokenBindingDescriptors(tokenFields, selectedTokenBindingNode);
  const visibleStyleFields = getUncoveredSourceStyleDescriptors(styleFields, activeTokenFields);
  const primaryStyleFields = visibleStyleFields.filter(isPrimarySpacingField);
  const layerStyleFields = visibleStyleFields.filter((field) => !isPrimarySpacingField(field));
  const hasLayerOptions = layerStyleFields.length > 0;

  useEffect(() => {
    if (!optionsOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && optionsRootRef.current?.contains(target)) return;
      if (isInspectorFloatingPickerTarget(event.target)) return;
      setOptionsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOptionsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [optionsOpen]);

  return (
    <WorkbenchInspectorSection
      title="Spacing"
      density="compact"
      actions={hasLayerOptions ? (
        <span className="wb-inspector-section-action-popover-root" ref={optionsRootRef}>
          <IconButton
            aria-expanded={optionsOpen}
            aria-haspopup="dialog"
            aria-pressed={optionsOpen}
            className={[
              'wb-inspector-section-action-button',
              optionsOpen ? 'wb-inspector-section-action-button--active' : '',
            ].filter(Boolean).join(' ')}
            label={optionsOpen ? 'Close spacing options' : 'Open spacing options'}
            onClick={() => setOptionsOpen((open) => !open)}
          >
            <SlidersHorizontal size={13} aria-hidden="true" />
          </IconButton>
          {optionsOpen ? (
            <InspectorSpacingOptionsMenu
              assetRegistry={assetRegistry}
              canEditSourceFields={canEditSourceFields}
              fields={layerStyleFields}
              onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
              previewTokenModes={previewTokenModes}
              selectedSourceNode={selectedSourceNode}
              tokenRegistry={tokenRegistry}
            />
          ) : null}
        </span>
      ) : null}
    >
      <InspectorTokenBindingFields
        fields={activeTokenFields}
        inspectorTokenPickerFilters={inspectorTokenPickerFilters}
        onSourceBindingChange={onSourceBindingChange}
        onTokenPickerScopeFilterChange={onTokenPickerScopeFilterChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedTokenBindingNode}
        tokenRegistry={tokenRegistry}
      />
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={primaryStyleFields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorSpacingOptionsMenu({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const paddingFields = fields.filter((field) => field.id.startsWith('spacing.padding.'));
  const marginFields = fields.filter((field) => field.id.startsWith('spacing.margin.'));
  const otherFields = fields.filter((field) => !field.id.startsWith('spacing.padding.') && !field.id.startsWith('spacing.margin.'));

  return (
    <InspectorDirectionalStyleOptionsMenu
      ariaLabel="Spacing options"
      canEditSourceFields={canEditSourceFields}
      assetRegistry={assetRegistry}
      groups={[
        { label: 'Padding', fields: paddingFields },
        { label: 'Margin', fields: marginFields },
      ]}
      otherFields={otherFields}
      onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
      previewTokenModes={previewTokenModes}
      selectedSourceNode={selectedSourceNode}
      tokenRegistry={tokenRegistry}
    />
  );
}

function InspectorDirectionalStyleOptionsMenu({
  ariaLabel,
  assetRegistry,
  canEditSourceFields,
  className,
  groups,
  onSourceStyleDeclarationChange,
  otherFields = [],
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  ariaLabel: string;
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  className?: string;
  groups: Array<{ label: string; fields: InspectorFieldDescriptor[] }>;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  otherFields?: InspectorFieldDescriptor[];
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const visibleGroups = groups.filter((group) => group.fields.length > 0);

  return (
    <div
      className={[
        'wb-popover-panel',
        'wb-popover-panel--form',
        'wb-inspector-options-menu',
        className ?? '',
      ].filter(Boolean).join(' ')}
      role="dialog"
      aria-label={ariaLabel}
    >
      {visibleGroups.map((group) => (
        <InspectorDirectionalStyleGroup
          key={group.label}
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={group.fields}
          label={group.label}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ))}
      {otherFields.length > 0 ? (
        <InspectorStyleFields
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={otherFields}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      ) : null}
    </div>
  );
}

function isInspectorFloatingPickerTarget(target: EventTarget | null): boolean {
  const element = target instanceof Element
    ? target
    : target instanceof Node
      ? target.parentElement
      : null;
  return Boolean(element?.closest([
    '.wb-token-picker-popover',
    '.wb-inspector-asset-picker-popover',
    '.wb-token-value-popover',
  ].join(', ')));
}

function InspectorDirectionalStyleGroup({
  assetRegistry,
  canEditSourceFields,
  fields,
  label,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  label: string;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <div className="wb-inspector-direction-group" aria-label={label}>
      <div className="wb-inspector-direction-group-title">{label}</div>
      <div className="wb-inspector-direction-grid">
        <InspectorStyleFields
          canEditSourceFields={canEditSourceFields}
          assetRegistry={assetRegistry}
          fields={fields}
          onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
          previewTokenModes={previewTokenModes}
          selectedSourceNode={selectedSourceNode}
          tokenRegistry={tokenRegistry}
        />
      </div>
    </div>
  );
}

function InspectorSizeSection({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchInspectorSection title="Size" density="compact">
      <InspectorStyleFields
        canEditSourceFields={canEditSourceFields}
        assetRegistry={assetRegistry}
        fields={fields}
        onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
        previewTokenModes={previewTokenModes}
        selectedSourceNode={selectedSourceNode}
        tokenRegistry={tokenRegistry}
      />
    </WorkbenchInspectorSection>
  );
}

function InspectorTokenBindingFields({
  fields,
  inspectorTokenPickerFilters,
  onSourceBindingChange,
  onTokenPickerScopeFilterChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  fields: InspectorFieldDescriptor[];
  inspectorTokenPickerFilters: InspectorTokenPickerFilters;
  onSourceBindingChange: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onTokenPickerScopeFilterChange: (field: InspectorTokenBindingField, filter: TokenPickerScopeFilter) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  if (!selectedSourceNode || fields.length === 0) return null;

  return (
    <div className="wb-inspector-field-stack">
      {fields.map((descriptor) => {
        const field = descriptor.tokenBindingField;
        if (!field) return null;

        return (
          <InspectorTokenBindingControl
            key={field}
            currentBinding={selectedSourceNode.tokenBindingReferences?.[field] ?? null}
            currentTokenId={selectedSourceNode.tokenBindings?.[field] ?? ''}
            field={field}
            label={`${descriptor.label} source token`}
            onChange={(reference) => onSourceBindingChange(field, reference)}
            onScopeFilterChange={(filter) => onTokenPickerScopeFilterChange(field, filter)}
            previewTokenModes={previewTokenModes}
            scopeFilter={inspectorTokenPickerFilters[field]}
            tokenRegistry={tokenRegistry}
          />
        );
      })}
    </div>
  );
}

function InspectorStyleFields({
  assetRegistry,
  canEditSourceFields,
  fields,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  fields: InspectorFieldDescriptor[];
  onSourceBindingChange?: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <div className="wb-inspector-field-stack">
      {fields.map((field) => {
        return (
          <InspectorStyleField
            key={`${field.editKind}:${field.id}`}
            canEditSourceFields={canEditSourceFields}
            assetRegistry={assetRegistry}
            field={field}
            onSourceBindingChange={onSourceBindingChange}
            onSourceStyleDeclarationChange={onSourceStyleDeclarationChange}
            previewTokenModes={previewTokenModes}
            selectedSourceNode={selectedSourceNode}
            tokenRegistry={tokenRegistry}
          />
        );
      })}
    </div>
  );
}

const COMPUTED_SPACING_HINT_PROPERTIES = new Set<string>([
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
]);

/**
 * Computed margin/padding of the selected preview element. Component CSS can
 * apply spacing with no matching inline declaration; without this hint that
 * spacing is invisible everywhere in the editor.
 */
function getSelectedNodeComputedSpacing(property: string): string | null {
  if (typeof document === 'undefined') return null;
  const frame = document.querySelector<HTMLIFrameElement>('iframe.wb-source-visual-preview-frame');
  let selected: Element | null = null;
  try {
    selected = frame?.contentDocument?.querySelector(
      '.wb-source-visual-node--selected, .wb-runtime-design-node--selected',
    ) ?? null;
  } catch {
    return null;
  }
  const view = selected?.ownerDocument.defaultView;
  if (!selected || !view) return null;
  // The preview wraps each source node in a display:contents host — the box
  // (and any component-CSS spacing) lives on the rendered child element.
  let element = selected;
  while (view.getComputedStyle(element).display === 'contents' && element.children.length === 1) {
    element = element.children[0];
  }
  const value = view.getComputedStyle(element).getPropertyValue(property).trim();
  return value.length > 0 ? value : null;
}

/**
 * Token modes and colour scheme the SELECTED node actually renders under.
 *
 * A token collection carries an `activeMode`, but a page can override it far
 * from the root: an Astryx theme collection is applied by a component prop
 * (`<AstryxTheme theme="stone">` → `data-astryx-theme="stone"`), and any
 * subtree can force modes through `data-wb-token-modes`. Custom properties
 * inherit, so the nearest ancestor that sets a collection wins — which is what
 * this walk reproduces. Resolving swatches from the collection's active mode
 * instead shows a colour the canvas never painted.
 *
 * Derived from the rendered preview on read; never persisted back onto the
 * panel's own mode selection.
 */
function getSelectedNodePreviewTokenContext(
  registry: TokenRegistry,
  fallbackModes: PreviewTokenModeSelection,
): { colorSchemeSide: WorkbenchColorSchemeSide; modeByCollection: PreviewTokenModeSelection } {
  const fallback = { colorSchemeSide: 'light' as WorkbenchColorSchemeSide, modeByCollection: fallbackModes };
  if (typeof document === 'undefined') return fallback;

  let selected: Element | null = null;
  try {
    const frame = document.querySelector<HTMLIFrameElement>('iframe.wb-source-visual-preview-frame');
    selected = frame?.contentDocument?.querySelector(
      '.wb-source-visual-node--selected, .wb-runtime-design-node--selected',
    ) ?? null;
  } catch {
    return fallback;
  }
  const view = selected?.ownerDocument.defaultView;
  if (!selected || !view) return fallback;

  const modeByCollection: Record<string, string> = { ...fallbackModes };
  for (const collection of registry.collections) {
    const attribute = getCollectionModeSelectorAttribute(collection);
    const modeIds = new Set(collection.modes.map((mode) => mode.id));
    for (let node: Element | null = selected; node; node = node.parentElement) {
      const override = parseTokenModeOverride(node.getAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE));
      const overridden = override[collection.id];
      if (overridden && modeIds.has(overridden)) {
        modeByCollection[collection.id] = overridden;
        break;
      }
      if (!attribute) continue;
      const applied = node.getAttribute(attribute);
      if (applied && modeIds.has(applied)) {
        modeByCollection[collection.id] = applied;
        break;
      }
    }
  }

  return { colorSchemeSide: getPreviewColorSchemeSide(selected, view), modeByCollection };
}

/** Attribute a collection's modes are applied with, mirroring token CSS export. */
function getCollectionModeSelectorAttribute(collection: TokenCollection): string | null {
  const cssExport = collection.extensions?.cssExport;
  const configured = cssExport && typeof cssExport === 'object' && !Array.isArray(cssExport)
    ? (cssExport as Record<string, unknown>).modeSelectorAttribute
    : null;
  if (typeof configured === 'string' && /^data-[a-zA-Z0-9_-]+$/.test(configured)) return configured;
  const astryx = collection.extensions?.astryx;
  const isAstryxTheme = collection.extensions?.source === 'astryx'
    && astryx && typeof astryx === 'object' && !Array.isArray(astryx)
    && (astryx as Record<string, unknown>).kind === 'theme-overrides';
  return isAstryxTheme ? 'data-astryx-theme' : null;
}

/** Which side a `light-dark()` token value resolves to for the selected node. */
function getPreviewColorSchemeSide(element: Element, view: Window): WorkbenchColorSchemeSide {
  const declared = view.getComputedStyle(element).colorScheme?.trim().toLowerCase() ?? '';
  const allowsLight = declared.includes('light');
  const allowsDark = declared.includes('dark');
  if (allowsDark && !allowsLight) return 'dark';
  if (allowsLight && !allowsDark) return 'light';
  try {
    return view.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function InspectorStyleField({
  assetRegistry,
  canEditSourceFields,
  field,
  onSourceBindingChange,
  onSourceStyleDeclarationChange,
  previewTokenModes,
  selectedSourceNode,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  canEditSourceFields: boolean;
  field: InspectorFieldDescriptor;
  onSourceBindingChange?: (field: InspectorTokenBindingField, reference: TokenReference | null) => void;
  onSourceStyleDeclarationChange: (property: SourceStyleProperty, value: string | null) => void;
  previewTokenModes: PreviewTokenModeSelection;
  selectedSourceNode: EditableTreeNode | null;
  tokenRegistry: TokenRegistry;
}) {
  const declarations = selectedSourceNode?.sourceStyleDeclarations ?? {};
  const property = field.styleProperty ?? null;
  const value = property ? getInspectorSourceStyleDeclarationValue(field, declarations) : '';
  const valueSource = property ? selectedSourceNode?.sourceValueMetadata?.styles?.[property] ?? null : null;
  const readOnlySource = valueSource && !valueSource.writable ? valueSource : null;
  const hidesLabel = canEditSourceFields && Boolean(property) && !shouldShowInspectorFieldLabel(field);
  const tokenBindingField = property ? getTokenBindingFieldForSourceStyleProperty(property) : null;
  const commitSourceStyleDeclaration = (nextValue: string | null) => {
    if (!property) return;
    const nextDeclaration = getInspectorSourceStyleDeclarationCommit(field, declarations, nextValue);
    onSourceStyleDeclarationChange(nextDeclaration.property, nextDeclaration.value);
  };
  const baseControl = getSourceStyleDeclarationControl(field);
  const computedSpacingHint = !value && property && COMPUTED_SPACING_HINT_PROPERTIES.has(property)
    ? getSelectedNodeComputedSpacing(property)
    : null;
  const control = computedSpacingHint && baseControl && (baseControl.kind === 'text' || baseControl.kind === 'size')
    ? { ...baseControl, placeholder: computedSpacingHint }
    : baseControl;

  return (
    <WorkbenchInspectorField
      label={field.label}
      labelMode={hidesLabel ? 'hidden' : 'visible'}
      density="compact"
      variant={canEditSourceFields && property && !readOnlySource ? 'control' : 'read'}
    >
      {readOnlySource ? (
        <SourceValueMetadataControl
          ariaLabel={`${field.label} source style`}
          onDetach={readOnlySource.detachableValue && property
            ? () => onSourceStyleDeclarationChange(property, readOnlySource.detachableValue!)
            : undefined}
          source={readOnlySource}
        />
      ) : canEditSourceFields && property ? (
        <SourceStyleDeclarationControl
          key={`${selectedSourceNode?.id ?? 'none'}:${field.id}`}
          ariaLabel={`${field.label} source style`}
          assetRegistry={assetRegistry}
          control={control}
          field={field}
          leading={hidesLabel ? getInspectorFieldLeading(field) : undefined}
          onTokenBindingSelect={tokenBindingField && onSourceBindingChange
            ? (reference) => onSourceBindingChange(tokenBindingField, reference)
            : undefined}
          previewTokenModes={previewTokenModes}
          tokenField={field.tokenField}
          tokenRegistry={tokenRegistry}
          value={value}
          onCommit={commitSourceStyleDeclaration}
        />
      ) : (
        value || 'Not set'
      )}
    </WorkbenchInspectorField>
  );
}

function getActiveTokenBindingDescriptors(
  fields: InspectorFieldDescriptor[],
  selectedSourceNode: EditableTreeNode | null,
): InspectorFieldDescriptor[] {
  if (!selectedSourceNode) return [];

  return fields.filter((descriptor) => {
    const field = descriptor.tokenBindingField;
    if (!field) return false;
    return Boolean(selectedSourceNode.tokenBindingReferences?.[field] ?? selectedSourceNode.tokenBindings?.[field]);
  });
}

function getUncoveredSourceStyleDescriptors(
  fields: InspectorFieldDescriptor[],
  activeTokenFields: InspectorFieldDescriptor[],
): InspectorFieldDescriptor[] {
  const activeTokenBindingFields = new Set(
    activeTokenFields
      .map((descriptor) => descriptor.tokenBindingField)
      .filter((field): field is InspectorTokenBindingField => Boolean(field)),
  );

  return fields.filter((field) => !isSourceStyleCoveredByTokenBinding(field, activeTokenBindingFields));
}

function isPrimaryBorderField(field: InspectorFieldDescriptor): boolean {
  return field.id === 'border.radius' || field.id === 'border.width' || field.id === 'border.color';
}

function hasSourceStyleDeclaration(field: InspectorFieldDescriptor, selectedSourceNode: EditableTreeNode | null): boolean {
  const property = field.styleProperty;
  if (!property) return false;
  const declarations = selectedSourceNode?.sourceStyleDeclarations ?? {};
  return Boolean(declarations[property]?.trim()) || hasBorderShorthandDerivedValue(field, declarations);
}

type InspectorSourceStyleDeclarations = NonNullable<EditableTreeNode['sourceStyleDeclarations']>;
type ParsedBorderShorthand = {
  color: string;
  style: string;
  width: string;
};
type ParsedFlexShorthand = {
  basis: string;
  grow: string;
  shrink: string;
};

const BORDER_STYLE_KEYWORDS = new Set([
  'dashed',
  'dotted',
  'double',
  'groove',
  'hidden',
  'inset',
  'none',
  'outset',
  'ridge',
  'solid',
]);

function getInspectorSourceStyleDeclarationValue(
  field: InspectorFieldDescriptor,
  declarations: InspectorSourceStyleDeclarations,
): string {
  const property = field.styleProperty;
  if (!property) return '';
  const explicitValue = declarations[property]?.trim();
  if (explicitValue) return explicitValue;
  const flexValue = getFlexShorthandDerivedValue(field, declarations);
  if (flexValue) return flexValue;
  return getBorderShorthandDerivedValue(field, declarations) ?? '';
}

function getInspectorSourceStyleDeclarationCommit(
  field: InspectorFieldDescriptor,
  declarations: InspectorSourceStyleDeclarations,
  value: string | null,
): { property: SourceStyleProperty; value: string | null } {
  const property = field.styleProperty;
  if (!property) return { property: 'border', value: null };
  if (isFlexLonghandField(field) && !declarations[property]?.trim() && declarations.flex?.trim()) {
    return {
      property: 'flex',
      value: formatFlexShorthandWithPart(declarations.flex, getFlexShorthandPartProperty(property), value),
    };
  }
  if (!isBorderLonghandField(field) || declarations[property]?.trim() || !declarations.border?.trim()) {
    return { property, value };
  }
  return {
    property: 'border',
    value: formatBorderShorthandWithPart(declarations.border, getBorderShorthandPartProperty(property), value),
  };
}

function hasBorderShorthandDerivedValue(
  field: InspectorFieldDescriptor,
  declarations: InspectorSourceStyleDeclarations,
): boolean {
  return Boolean(getBorderShorthandDerivedValue(field, declarations));
}

function getFlexShorthandDerivedValue(
  field: InspectorFieldDescriptor,
  declarations: InspectorSourceStyleDeclarations,
): string | null {
  if (!isFlexLonghandField(field)) return null;
  if (!declarations.flex?.trim()) return null;
  const parsed = parseFlexShorthand(declarations.flex);
  if (!parsed) return null;
  return parsed[getFlexShorthandPartProperty(field.styleProperty!)];
}

function isFlexLonghandField(field: InspectorFieldDescriptor): boolean {
  return field.styleProperty === 'flex-grow' ||
    field.styleProperty === 'flex-shrink' ||
    field.styleProperty === 'flex-basis';
}

function getFlexShorthandPartProperty(
  property: SourceStyleProperty,
): keyof ParsedFlexShorthand {
  if (property === 'flex-grow') return 'grow';
  if (property === 'flex-shrink') return 'shrink';
  return 'basis';
}

function formatFlexShorthandWithPart(
  shorthand: string,
  part: keyof ParsedFlexShorthand,
  value: string | null,
): string | null {
  const nextPartValue = value?.trim() ?? '';
  if (!nextPartValue) return null;
  const current = parseFlexShorthand(shorthand) ?? { basis: 'auto', grow: '0', shrink: '1' };
  const next = { ...current, [part]: nextPartValue };
  return `${next.grow || '0'} ${next.shrink || '1'} ${next.basis || 'auto'}`;
}

function parseFlexShorthand(value: string): ParsedFlexShorthand | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized === 'none') return { basis: 'auto', grow: '0', shrink: '0' };
  if (normalized === 'auto') return { basis: 'auto', grow: '1', shrink: '1' };
  if (normalized === 'initial') return { basis: 'auto', grow: '0', shrink: '1' };

  const tokens = splitCssWhitespaceList(normalized);
  if (tokens.length === 0) return null;
  let grow = '';
  let shrink = '';
  const basis: string[] = [];

  for (const token of tokens) {
    if (!grow && isFlexNumberToken(token)) {
      grow = token;
      continue;
    }
    if (grow && !shrink && isFlexNumberToken(token)) {
      shrink = token;
      continue;
    }
    basis.push(token);
  }

  if (!grow && basis.length === 0) return null;
  return {
    basis: basis.join(' ') || '0',
    grow: grow || '1',
    shrink: shrink || '1',
  };
}

function isFlexNumberToken(value: string): boolean {
  return /^(?:\d+|\d*\.\d+)$/.test(value);
}

function getBorderShorthandDerivedValue(
  field: InspectorFieldDescriptor,
  declarations: InspectorSourceStyleDeclarations,
): string | null {
  if (!field.styleProperty || !isBorderLonghandField(field)) return null;
  const border = declarations.border?.trim();
  if (!border) return null;
  const parsed = parseBorderShorthand(border);
  if (!parsed) return null;
  return parsed[getBorderShorthandPartKey(field.styleProperty)] || null;
}

function isBorderLonghandField(field: InspectorFieldDescriptor): boolean {
  return field.styleProperty === 'border-width' ||
    field.styleProperty === 'border-style' ||
    field.styleProperty === 'border-color';
}

function getBorderShorthandPartKey(
  property: SourceStyleProperty,
): keyof ParsedBorderShorthand {
  if (property === 'border-color') return 'color';
  if (property === 'border-style') return 'style';
  return 'width';
}

function getBorderShorthandPartProperty(
  property: SourceStyleProperty,
): keyof ParsedBorderShorthand {
  return getBorderShorthandPartKey(property);
}

function formatBorderShorthandWithPart(
  shorthand: string,
  part: keyof ParsedBorderShorthand,
  value: string | null,
): string | null {
  const nextPartValue = value?.trim() ?? '';
  if (!nextPartValue) return null;
  const current = parseBorderShorthand(shorthand) ?? { color: '', style: '', width: '' };
  const next = { ...current, [part]: nextPartValue };
  const parts = [next.width, next.style, next.color].filter((candidate) => candidate.trim().length > 0);
  return parts.length > 0 ? parts.join(' ') : null;
}

function parseBorderShorthand(value: string): ParsedBorderShorthand | null {
  const tokens = splitCssWhitespaceList(value);
  if (tokens.length === 0) return null;
  const parsed: ParsedBorderShorthand = { color: '', style: '', width: '' };
  const colorParts: string[] = [];

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (!parsed.style && BORDER_STYLE_KEYWORDS.has(normalized)) {
      parsed.style = token;
      continue;
    }
    if (!parsed.width && looksLikeBorderWidthValue(token)) {
      parsed.width = token;
      continue;
    }
    colorParts.push(token);
  }

  parsed.color = colorParts.join(' ');
  return parsed.width || parsed.style || parsed.color ? parsed : null;
}

function splitCssWhitespaceList(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]!;
    const previous = value[index - 1];
    if (quote) {
      current += char;
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(char) && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function looksLikeBorderWidthValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '0' ||
    /^(?:thin|medium|thick)$/i.test(trimmed) ||
    /^(?:calc|min|max|clamp|var)\(/i.test(trimmed) ||
    /^-?(?:\d+|\d*\.\d+)(?:px|r?em|ch|ex|lh|vw|vh|vi|vb|vmin|vmax|%|cm|mm|q|in|pc|pt)$/i.test(trimmed);
}

function isPrimarySpacingField(field: InspectorFieldDescriptor): boolean {
  return field.id === 'spacing.padding' || field.id === 'spacing.margin';
}

function getVisibleLayoutStyleFields(
  fields: InspectorFieldDescriptor[],
  displayValue: string,
  positionValue: string,
): InspectorFieldDescriptor[] {
  const flow = normalizeLayoutFlow(displayValue);
  const position = normalizeLayoutPosition(positionValue);

  return fields.filter((field) => {
    if (field.id === 'layout.flow' || field.id === 'layout.overflow' || field.id === 'layout.position') return true;
    if (isLayoutInsetField(field)) return canEditLayoutPositionOffsets(position);
    if (field.id === 'layout.direction' || field.id === 'layout.wrap') return flow === 'flex';
    if (field.id === 'layout.gridColumns' || field.id === 'layout.gridRows') return flow === 'grid';
    if (field.id === 'layout.align' || field.id === 'layout.justify' || field.id === 'layout.gap') {
      return flow === 'flex' || flow === 'grid';
    }
    return true;
  });
}

function normalizeLayoutFlow(displayValue: string): 'block' | 'flex' | 'grid' {
  const normalized = displayValue.trim().toLowerCase();
  if (normalized === 'flex' || normalized === 'inline-flex') return 'flex';
  if (normalized === 'grid' || normalized === 'inline-grid') return 'grid';
  return 'block';
}

function getLayoutDisplayValue(
  selectedLayer: PreviewLayer | null,
  selectedSourceNode: EditableTreeNode | null,
): string {
  const explicitDisplay = selectedSourceNode?.sourceStyleDeclarations?.display?.trim();
  if (explicitDisplay) return explicitDisplay;
  const className = getSourceAttributes(selectedLayer, selectedSourceNode).className ?? '';
  return getLayoutDisplayValueFromClassName(className);
}

function getLayoutDisplayValueFromClassName(className: string): string {
  let displayValue = '';
  for (const classToken of getTailwindClassNameTokens(className)) {
    const { baseClass, variantPrefix } = splitTailwindClassToken(classToken);
    if (variantPrefix) continue;
    if (
      baseClass === 'block' ||
      baseClass === 'flex' ||
      baseClass === 'grid' ||
      baseClass === 'inline' ||
      baseClass === 'inline-block' ||
      baseClass === 'inline-flex' ||
      baseClass === 'inline-grid'
    ) {
      displayValue = baseClass;
    }
  }
  return displayValue;
}

function normalizeLayoutPosition(positionValue: string): 'static' | 'relative' | 'absolute' | 'sticky' | 'other' {
  const normalized = positionValue.trim().toLowerCase();
  if (normalized === 'static') return 'static';
  if (normalized === 'relative') return 'relative';
  if (normalized === 'absolute') return 'absolute';
  if (normalized === 'sticky') return 'sticky';
  return 'other';
}

function canEditLayoutPositionOffsets(position: ReturnType<typeof normalizeLayoutPosition>): boolean {
  return position === 'absolute' || position === 'sticky';
}

function isLayoutInsetField(field: InspectorFieldDescriptor): boolean {
  return field.id.startsWith('layout.inset.');
}

function isSourceStyleCoveredByTokenBinding(
  field: InspectorFieldDescriptor,
  activeTokenBindingFields: Set<InspectorTokenBindingField>,
): boolean {
  if (!field.styleProperty) return false;
  const tokenBindingField = getTokenBindingFieldForSourceStyleProperty(field.styleProperty);
  return tokenBindingField ? activeTokenBindingFields.has(tokenBindingField) : false;
}

function getInspectorFieldLeading(field: InspectorFieldDescriptor): ReactNode {
  return <span className="wb-inspector-input-leading-text">{formatCompactInspectorFieldLabel(field.label)}</span>;
}

function getSourceStyleDeclarationControl(field: InspectorFieldDescriptor): InspectorFieldDescriptor['control'] {
  if (isLayoutInsetField(field) && field.control?.kind === 'size') {
    return {
      ...field.control,
      kind: 'text',
    };
  }
  return field.control;
}

function shouldShowInspectorFieldLabel(field: InspectorFieldDescriptor): boolean {
  // Inline style rows are a flat list of arbitrary properties, so the property
  // name is the only thing identifying a row — never collapse it into an icon.
  return field.id === 'layout.overflow'
    || field.id.startsWith('flexItem.')
    || field.id.startsWith('inlineStyle.');
}

function formatCompactInspectorFieldLabel(label: string): string {
  return label.replace(/\s+/g, '');
}

function getSegmentedOptionIcon(
  ariaLabel: string,
  optionValue: string,
  options: Array<{ value: string }>,
): LucideIcon | null {
  if (ariaLabel.startsWith('Direction ')) {
    if (optionValue === 'row') return Rows3;
    if (optionValue === 'column') return Columns3;
  }

  if (ariaLabel.startsWith('Wrap ')) {
    if (!isLayoutWrapIconControl(options)) return null;
    if (optionValue === 'wrap') return WrapText;
    return AlignLeft;
  }

  if (ariaLabel.startsWith('Visible ')) {
    if (optionValue === 'hidden') return EyeOff;
    return Eye;
  }

  return null;
}

function isLayoutWrapIconControl(options: Array<{ value: string }>): boolean {
  const values = new Set(options.map((option) => option.value));
  return values.size === 2 && values.has('wrap') && values.has('nowrap');
}

function InspectorTokenBindingControl({
  currentBinding,
  currentTokenId,
  field,
  label,
  onChange,
  onScopeFilterChange,
  previewTokenModes,
  scopeFilter,
  tokenRegistry,
}: {
  currentBinding: TokenReference | null;
  currentTokenId: string;
  field: InspectorTokenBindingField;
  label: string;
  onChange: (reference: TokenReference | null) => void;
  onScopeFilterChange: (filter: TokenPickerScopeFilter) => void;
  previewTokenModes: PreviewTokenModeSelection;
  scopeFilter?: TokenPickerScopeFilter;
  tokenRegistry: TokenRegistry;
}) {
  const selectedToken = currentBinding
    ? findInspectorTokenBindingReference(tokenRegistry, field, currentBinding, previewTokenModes)
    : findInspectorTokenBindingToken(tokenRegistry, field, currentTokenId, previewTokenModes);
  const selectedReference = selectedToken
    ? { collectionId: selectedToken.collection.id, tokenId: selectedToken.token.id }
    : currentBinding;
  const meta = selectedToken?.disabledReason
    ?? (currentBinding && !selectedToken
      ? `Current binding ${currentBinding.collectionId}/${currentBinding.tokenId} is unavailable.`
      : currentTokenId && !selectedToken
        ? `Current binding ${currentTokenId} is unavailable.`
        : null);

  return (
    <WorkbenchInspectorField
      density="compact"
      label={formatInspectorBindingField(field)}
      labelMode="hidden"
      meta={meta}
      variant="control"
    >
      <InspectorTokenPicker
        ariaLabel={label}
        field={getInspectorFieldForTokenBindingField(field)}
        modeByCollection={previewTokenModes}
        registry={tokenRegistry}
        scopeFilter={scopeFilter}
        selected={selectedReference}
        onScopeFilterChange={onScopeFilterChange}
        onClear={() => onChange(null)}
        onSelect={onChange}
      />
    </WorkbenchInspectorField>
  );
}

function useInspectorHistoryShortcuts(): InspectorHistoryShortcuts {
  return useContext(InspectorHistoryShortcutsContext);
}

function useInspectorPreviewColorSchemeSide(): WorkbenchColorSchemeSide {
  return useContext(InspectorPreviewColorSchemeContext);
}

function handleInspectorHistoryKeyDown<TElement extends HTMLElement>(
  event: ReactKeyboardEvent<TElement>,
  shortcuts: InspectorHistoryShortcuts,
): boolean {
  if (event.defaultPrevented) return false;
  const isModifierPressed = event.metaKey || event.ctrlKey;
  if (!isModifierPressed || event.altKey) return false;

  const key = event.key.toLowerCase();
  const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
  const wantsUndo = key === 'z' && !event.shiftKey;
  if (!wantsUndo && !wantsRedo) return false;

  const handled = wantsRedo ? shortcuts.onHistoryRedo?.() : shortcuts.onHistoryUndo?.();
  if (!handled) return false;

  event.preventDefault();
  event.stopPropagation();
  return true;
}

function handleInspectorHistoryBeforeInput<TElement extends HTMLElement>(
  event: FormEvent<TElement>,
  shortcuts: InspectorHistoryShortcuts,
): boolean {
  if (event.defaultPrevented) return false;
  const inputType = (event.nativeEvent as InputEvent).inputType;
  const handled = inputType === 'historyUndo'
    ? shortcuts.onHistoryUndo?.()
    : inputType === 'historyRedo'
      ? shortcuts.onHistoryRedo?.()
      : false;
  if (!handled) return false;

  event.preventDefault();
  event.stopPropagation();
  return true;
}

function isInspectorImeComposing<TElement extends HTMLElement>(event: ReactKeyboardEvent<TElement>): boolean {
  const nativeEvent = event.nativeEvent as KeyboardEvent & { keyCode?: number };
  return nativeEvent.isComposing || nativeEvent.keyCode === 229 || event.key === 'Process';
}

function getEffectiveTextBindingKey(node: EditableTreeNode | null): string | null {
  if (!node) return null;
  if (node.tokenBindings?.text) return node.tokenBindings.text;
  const textChild = node.children?.find((child) => child.kind === 'text' && child.tokenBindings?.text);
  return textChild?.tokenBindings?.text ?? null;
}

function SourceHeadingLevelControl({
  ariaLabel,
  onCommit,
  value,
}: {
  ariaLabel: string;
  onCommit: (value: SourceElementTagName) => void;
  value: SourceElementTagName;
}) {
  return (
    <SelectControl<SourceElementTagName>
      aria-label={ariaLabel}
      className="wb-inspector-source-select"
      value={value}
      onValueChange={onCommit}
    >
      <option value="h1">H1</option>
      <option value="h2">H2</option>
      <option value="h3">H3</option>
      <option value="h4">H4</option>
      <option value="h5">H5</option>
      <option value="h6">H6</option>
    </SelectControl>
  );
}

function normalizeSourceHeadingLevel(value?: string | null): SourceElementTagName {
  return value === 'h1' || value === 'h2' || value === 'h3' || value === 'h4' || value === 'h5' || value === 'h6'
    ? value
    : 'h2';
}

function SourceTextContentControl({
  ariaLabel,
  commitOnBlur = false,
  commitOnChange = false,
  commitOnEnter = false,
  leading,
  onCommit,
  onDraftChange,
  tokenized = false,
  trailing,
  value,
}: {
  ariaLabel: string;
  commitOnBlur?: boolean;
  commitOnChange?: boolean;
  commitOnEnter?: boolean;
  leading?: ReactNode;
  onCommit: (value: string) => void;
  onDraftChange?: (value: string) => void;
  tokenized?: boolean;
  trailing?: ReactNode;
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  const draftDirtyRef = useRef(false);
  const draftRef = useRef(draft);
  const composingRef = useRef(false);
  const focusedRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const submittedRef = useRef(value);
  const valueRef = useRef(value);
  const historyShortcuts = useInspectorHistoryShortcuts();
  const manualCommit = commitOnBlur || commitOnEnter;

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const previousSubmitted = submittedRef.current;
    valueRef.current = value;
    submittedRef.current = value;
    if (shouldSyncSourceFieldDraft({
      draft: draftRef.current,
      focused: focusedRef.current || composingRef.current,
      nextSubmitted: value,
      previousSubmitted,
    })) {
      setDraft(value);
    }
  }, [value]);

  const commitDraft = useCallback((nextValue = draftRef.current, options: { allowResubmit?: boolean } = {}) => {
    if (nextValue === valueRef.current) return;
    if (!options.allowResubmit && nextValue === submittedRef.current) return;
    submittedRef.current = nextValue;
    onCommitRef.current(nextValue);
  }, []);

  const scheduleBlurredCompositionCommit = useDeferredSourceFieldCommit(commitDraft, composingRef, focusedRef);

  const flushDraft = useCallback(() => {
    if (manualCommit) return;
    if (!composingRef.current) commitDraft();
  }, [commitDraft, manualCommit]);

  useFlushDraftOnUnmount(flushDraft);

  useEffect(() => {
    if (manualCommit) return undefined;
    if (!commitOnChange && focusedRef.current) return undefined;
    if (composingRef.current) return undefined;
    if (draft === valueRef.current || draft === submittedRef.current) return undefined;
    const timeoutId = window.setTimeout(() => commitDraft(draft), SOURCE_FIELD_AUTOCOMMIT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [commitDraft, commitOnChange, draft, manualCommit]);

  const input = (
    <TextArea
      aria-label={ariaLabel}
      className={[
        'wb-inspector-source-input',
        'wb-inspector-source-textarea',
        leading ? 'wb-inspector-source-textarea--labeled' : '',
        trailing ? 'wb-inspector-source-textarea--trailing' : '',
        tokenized ? 'wb-inspector-source-textarea--tokenized' : '',
      ].filter(Boolean).join(' ')}
      rows={3}
      value={draft}
      onBlur={(event) => {
        focusedRef.current = false;
        if (composingRef.current) return;
        if (commitOnBlur) {
          commitDraft(event.currentTarget.value);
          return;
        }
        commitDraft(event.currentTarget.value, { allowResubmit: commitOnChange });
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        const nextValue = event.currentTarget.value;
        draftRef.current = nextValue;
        setDraft(nextValue);
        onDraftChange?.(nextValue);
        if (!manualCommit) scheduleBlurredCompositionCommit();
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onValueChange={(nextValue) => {
        setDraft(nextValue);
        onDraftChange?.(nextValue);
      }}
      onBeforeInput={(event) => {
        handleInspectorHistoryBeforeInput(event, historyShortcuts);
      }}
      onKeyDown={(event) => {
        if (isInspectorImeComposing(event) || composingRef.current) return;
        if (handleInspectorHistoryKeyDown(event, historyShortcuts)) return;
        if (commitOnEnter && event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          commitDraft(event.currentTarget.value);
        }
      }}
    />
  );

  if (!leading && !trailing) return input;

  return (
    <div className={tokenized ? 'wb-inspector-textarea-shell wb-inspector-textarea-shell--tokenized' : 'wb-inspector-textarea-shell'}>
      {leading ? (
        <span className="wb-inspector-textarea-label" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      {input}
      {trailing ? (
        <div className="wb-inspector-textarea-trailing">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

function SourceAttributeControl({
  ariaLabel,
  commitOnChange = false,
  leading,
  onClear,
  onCommit,
  placeholder,
  suggestions,
  tokenized = false,
  trailing,
  value,
}: {
  ariaLabel: string;
  commitOnChange?: boolean;
  leading?: ReactNode;
  onClear?: () => void;
  onCommit: (value: string | null) => void;
  placeholder?: string;
  suggestions?: string[];
  tokenized?: boolean;
  trailing?: ReactNode;
  value: string;
}) {
  const suggestionListId = useId();
  const [draft, setDraft] = useState(value);
  const draftDirtyRef = useRef(false);
  const draftRef = useRef(draft);
  const composingRef = useRef(false);
  const focusedRef = useRef(false);
  // True when the user blurred the field while the IME was still composing.
  // We can't commit in onBlur in that case (the composed value isn't final
  // yet), so we set this flag and commit synchronously in onCompositionEnd.
  const blurredDuringCompositionRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const onClearRef = useRef(onClear);
  const submittedRef = useRef(normalizeSourceAttributeDraft(value));
  const valueRef = useRef(value);
  const historyShortcuts = useInspectorHistoryShortcuts();

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const previousSubmitted = submittedRef.current;
    const nextSubmitted = normalizeSourceAttributeDraft(value);
    valueRef.current = value;
    submittedRef.current = nextSubmitted;
    if (shouldSyncSourceFieldDraft({
      draft: normalizeSourceAttributeDraft(draftRef.current),
      focused: focusedRef.current || composingRef.current,
      nextSubmitted,
      previousSubmitted,
    })) {
      draftDirtyRef.current = false;
      setDraft(value);
    }
  }, [value]);

  const commitDraft = useCallback((nextDraft = draftRef.current, options: { allowResubmit?: boolean } = {}) => {
    if (!draftDirtyRef.current && !options.allowResubmit) return;
    const nextValue = normalizeSourceAttributeDraft(nextDraft);
    const currentValue = normalizeSourceAttributeDraft(valueRef.current);
    if (nextValue === currentValue || (!options.allowResubmit && nextValue === submittedRef.current)) {
      draftDirtyRef.current = false;
      return;
    }
    submittedRef.current = nextValue;
    draftDirtyRef.current = false;
    onCommitRef.current(nextValue);
  }, []);

  const flushDraft = useCallback(() => {
    if (!composingRef.current) commitDraft();
  }, [commitDraft]);

  useFlushDraftOnUnmount(flushDraft);

  useEffect(() => {
    if (!commitOnChange && focusedRef.current) return undefined;
    if (composingRef.current) return undefined;
    const nextValue = normalizeSourceAttributeDraft(draft);
    const currentValue = normalizeSourceAttributeDraft(valueRef.current);
    if (nextValue === currentValue || nextValue === submittedRef.current) return undefined;
    const timeoutId = window.setTimeout(() => commitDraft(draft), SOURCE_FIELD_AUTOCOMMIT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [commitDraft, commitOnChange, draft]);

  const clearable = !tokenized && normalizeSourceAttributeDraft(draft) !== null;
  const clearValue = useCallback(() => {
    if (!clearable && normalizeSourceAttributeDraft(valueRef.current) === null) return;
    draftRef.current = '';
    draftDirtyRef.current = false;
    submittedRef.current = null;
    valueRef.current = '';
    setDraft('');
    if (onClearRef.current) onClearRef.current();
    else onCommitRef.current(null);
  }, [clearable]);

  const input = (
    <TextField
      aria-label={ariaLabel}
      className={[
        'wb-inspector-source-input',
        leading ? 'wb-inspector-source-input--leading' : '',
        trailing ? 'wb-inspector-source-input--trailing' : '',
        clearable ? 'wb-inspector-source-input--clearable' : '',
        clearable && trailing ? 'wb-inspector-source-input--clearable-trailing' : '',
        tokenized ? 'wb-inspector-source-input--tokenized' : '',
      ].filter(Boolean).join(' ')}
      list={suggestions?.length ? suggestionListId : undefined}
      placeholder={placeholder}
      value={draft}
      onBlur={(event) => {
        focusedRef.current = false;
        // Blur can fire while the IME is still composing a character (e.g.
        // user clicks away mid-syllable). The composed value isn't final
        // yet — record the intent and let onCompositionEnd run the commit
        // synchronously once the IME has finalized the value.
        if (composingRef.current) {
          blurredDuringCompositionRef.current = true;
          return;
        }
        commitDraft(event.currentTarget.value, { allowResubmit: commitOnChange });
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        const nextValue = event.currentTarget.value;
        draftRef.current = nextValue;
        draftDirtyRef.current = true;
        setDraft(nextValue);
        // If we deferred a blur-time commit because the IME was active,
        // run it now — synchronously, no setTimeout — so the parent
        // store update isn't dropped by interleaving re-renders.
        if (blurredDuringCompositionRef.current) {
          blurredDuringCompositionRef.current = false;
          commitDraft(nextValue);
        }
      }}
      onFocus={() => {
        focusedRef.current = true;
        blurredDuringCompositionRef.current = false;
      }}
      onValueChange={(nextValue) => {
        draftDirtyRef.current = true;
        setDraft(nextValue);
      }}
      onBeforeInput={(event) => {
        handleInspectorHistoryBeforeInput(event, historyShortcuts);
      }}
      onKeyDown={(event) => {
        if (isInspectorImeComposing(event) || composingRef.current) return;
        if (handleInspectorHistoryKeyDown(event, historyShortcuts)) return;
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );

  const clearButton = clearable ? (
    <SourceStyleClearButton
      ariaLabel={`Clear ${ariaLabel}`}
      className={trailing ? 'wb-inspector-source-value-clear wb-inspector-source-value-clear--with-trailing' : 'wb-inspector-source-value-clear'}
      onClear={clearValue}
    />
  ) : null;

  // Always wrap with the adornment shell so the input's parent element
  // stays stable across renders. Without this, the FIRST character typed
  // makes `clearable` flip true → the clear button appears → React
  // re-parents the input under the shell → unmount/remount → focus loss
  // and IME composition collapse. The shell's own short-circuit is also
  // bypassed below.
  return (
    <InspectorInputAdornmentShell clearButton={clearButton} leading={leading} tokenized={tokenized} trailing={trailing} variant="source">
      {input}
      {suggestions?.length ? (
        <datalist id={suggestionListId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </InspectorInputAdornmentShell>
  );
}

function SourceStyleDeclarationControl({
  ariaLabel,
  assetRegistry,
  control,
  field,
  leading,
  onCommit,
  onTokenBindingSelect,
  previewTokenModes,
  tokenField,
  tokenRegistry,
  value,
}: {
  ariaLabel: string;
  assetRegistry?: WorkbenchAssetRegistry;
  control: InspectorFieldDescriptor['control'];
  field: InspectorFieldDescriptor;
  leading?: ReactNode;
  onCommit: (value: string | null) => void;
  onTokenBindingSelect?: (reference: TokenReference) => void;
  previewTokenModes: PreviewTokenModeSelection;
  tokenField?: InspectorField;
  tokenRegistry: TokenRegistry;
  value: string;
}) {
  if (control?.kind === 'segmented') {
    return (
      <div className="wb-inspector-segmented-control" role="group" aria-label={ariaLabel}>
        {control.options.map((option) => {
          const active = value === option.value;
          const Icon = getSegmentedOptionIcon(ariaLabel, option.value, control.options);
          return (
            <button
              key={option.value}
              type="button"
              className={[
                'wb-inspector-segmented-button',
                active ? 'wb-inspector-segmented-button--active' : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
              onClick={() => {
                // Re-clicking the active option toggles it off (clears the
                // value back to unset); selecting another option commits it.
                if (active) {
                  onCommit(null);
                  return;
                }
                onCommit(option.value);
              }}
            >
              {Icon ? <Icon size={13} aria-hidden="true" /> : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const previewTokenContext = getSelectedNodePreviewTokenContext(tokenRegistry, previewTokenModes);
  const resolvedTokenModes = previewTokenContext.modeByCollection;
  const colorSchemeSide = previewTokenContext.colorSchemeSide;
  const selectedStyleToken = tokenField
    ? findSourceStyleTokenResult(tokenRegistry, tokenField, value, resolvedTokenModes)
    : null;
  const selectedStyleTokenReference = selectedStyleToken
    ? { collectionId: selectedStyleToken.collection.id, tokenId: selectedStyleToken.token.id }
    : null;
  const displayValue = selectedStyleToken
    ? formatSourceStyleTokenRawValue(selectedStyleToken, tokenRegistry, colorSchemeSide) ?? value
    : value;

  const placeholder = control?.kind === 'text' || control?.kind === 'size' || control?.kind === 'select'
    ? control.placeholder
    : undefined;
  const colorLeading = isColorSourceStyleField(tokenField)
    ? <SourceStyleColorSwatch value={displayValue} fallback={placeholder} onCommit={onCommit} />
    : null;
  const tokenPicker = tokenField ? (
    <InspectorTokenPicker
      ariaLabel={`${ariaLabel} token`}
      className="wb-inspector-style-token-picker"
      field={tokenField}
      modeByCollection={resolvedTokenModes}
      registry={tokenRegistry}
      selected={selectedStyleTokenReference}
      triggerMode="icon"
      onClear={selectedStyleToken
        ? () => onCommit(formatSourceStyleTokenRawValue(selectedStyleToken, tokenRegistry, colorSchemeSide))
        : undefined}
      onSelect={(reference) => {
        if (onTokenBindingSelect) {
          onTokenBindingSelect(reference);
          return;
        }
        const cssVariable = getSourceStyleTokenCssVariable(tokenRegistry, tokenField, reference, resolvedTokenModes);
        if (cssVariable) onCommit(cssVariable);
      }}
    />
  ) : null;
  const assetPicker = getAssetKindsForSourceStyleField(field) ? (
    <AssetPickerButton
      ariaLabel={`${ariaLabel} asset`}
      assets={assetRegistry}
      kinds={getAssetKindsForSourceStyleField(field)!}
      onSelect={(asset) => onCommit(formatAssetValueForSourceStyle(field, asset))}
      onSelectPreview={(preview) => onCommit(formatPreviewAssetValueForSourceStyle(field, preview))}
    />
  ) : null;
  const trailing = assetPicker || tokenPicker ? (
    <span className={assetPicker && tokenPicker ? 'wb-inspector-trailing-actions wb-inspector-trailing-actions--double' : 'wb-inspector-trailing-actions'}>
      {assetPicker}
      {tokenPicker}
    </span>
  ) : null;

  if (isGridTemplateTrackField(field)) {
    return (
      <SourceStyleGridTrackControl
        ariaLabel={ariaLabel}
        field={field}
        leading={leading}
        placeholder={placeholder}
        value={displayValue}
        onCommit={onCommit}
      />
    );
  }

  if (control?.kind === 'select') {
    return (
      <SourceStyleSelectControl
        ariaLabel={ariaLabel}
        control={control}
        value={value}
        onCommit={onCommit}
      />
    );
  }

  if (control?.kind === 'size') {
    return (
      <SourceStyleSizeControl
        ariaLabel={ariaLabel}
        leading={leading}
        placeholder={placeholder}
        tokenized={Boolean(selectedStyleToken)}
        showClearButton={!selectedStyleToken}
        trailing={trailing}
        value={displayValue}
        onCommit={onCommit}
      />
    );
  }

  return (
    <SourceStyleTextControl
      ariaLabel={ariaLabel}
      leading={colorLeading ?? leading}
      placeholder={placeholder}
      showClearButton={!selectedStyleToken}
      tokenized={Boolean(selectedStyleToken)}
      trailing={trailing}
      value={displayValue}
      onCommit={onCommit}
    />
  );
}

type GridTemplateTrackKind = 'columns' | 'rows';

function SourceStyleGridTrackControl({
  ariaLabel,
  field,
  leading,
  onCommit,
  placeholder,
  value,
}: {
  ariaLabel: string;
  field: InspectorFieldDescriptor;
  leading?: ReactNode;
  onCommit: (value: string | null) => void;
  placeholder?: string;
  value: string;
}) {
  const trackKind = getGridTemplateTrackKind(field);
  const displayValue = trackKind ? formatGridTemplateTrackDisplayValue(trackKind, value) : value;
  const commitValue = useCallback((nextValue: string | null) => {
    onCommit(trackKind ? formatGridTemplateTrackCommitValue(trackKind, nextValue) : nextValue);
  }, [onCommit, trackKind]);

  return (
    <SourceStyleTextControl
      ariaLabel={ariaLabel}
      leading={leading}
      placeholder={placeholder}
      value={displayValue}
      onCommit={commitValue}
    />
  );
}

function isGridTemplateTrackField(field: InspectorFieldDescriptor): boolean {
  return getGridTemplateTrackKind(field) !== null;
}

function getGridTemplateTrackKind(field: InspectorFieldDescriptor): GridTemplateTrackKind | null {
  if (field.styleProperty === 'grid-template-columns') return 'columns';
  if (field.styleProperty === 'grid-template-rows') return 'rows';
  return null;
}

function formatGridTemplateTrackDisplayValue(kind: GridTemplateTrackKind, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return parseGeneratedGridTemplateTrackCount(kind, trimmed) ?? trimmed;
}

function formatGridTemplateTrackCommitValue(kind: GridTemplateTrackKind, value: string | null): string | null {
  const normalized = normalizeSourceStyleDraft(value ?? '');
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return normalized;
  const count = Number.parseInt(normalized, 10);
  if (!Number.isFinite(count) || count < 1) return null;
  if (kind === 'columns') return `repeat(${count}, minmax(0, 1fr))`;
  return `repeat(${count}, auto)`;
}

function parseGeneratedGridTemplateTrackCount(kind: GridTemplateTrackKind, value: string): string | null {
  const generatedPattern = kind === 'columns'
    ? /^repeat\(\s*(\d+)\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)$/i
    : /^repeat\(\s*(\d+)\s*,\s*auto\s*\)$/i;
  const generatedMatch = value.match(generatedPattern);
  if (generatedMatch?.[1]) return generatedMatch[1];
  if (kind === 'rows' && /^(?:auto\s+)+auto$/i.test(value)) {
    return String(splitCssWhitespaceList(value).length);
  }
  return null;
}

const SOURCE_STYLE_CUSTOM_SELECT_VALUE = '__custom__';

function SourceStyleSelectControl({
  ariaLabel,
  control,
  onCommit,
  value,
}: {
  ariaLabel: string;
  control: Extract<NonNullable<InspectorFieldDescriptor['control']>, { kind: 'select' }>;
  onCommit: (value: string | null) => void;
  value: string;
}) {
  const normalizedValue = value.trim();
  const hasOption = control.options.some((option) => option.value === normalizedValue);
  const selectedValue = hasOption
    ? normalizedValue
    : normalizedValue
      ? SOURCE_STYLE_CUSTOM_SELECT_VALUE
      : control.placeholder ?? control.options[0]?.value ?? '';
  const historyShortcuts = useInspectorHistoryShortcuts();

  return (
    <div className={normalizedValue ? 'wb-inspector-select-value-shell wb-inspector-select-value-shell--clearable' : 'wb-inspector-select-value-shell'}>
      <SelectControl<string>
        aria-label={ariaLabel}
        className={normalizedValue ? 'wb-inspector-source-select wb-inspector-source-select--clearable' : 'wb-inspector-source-select'}
        value={selectedValue}
        onKeyDown={(event) => {
          handleInspectorHistoryKeyDown(event, historyShortcuts);
        }}
        onValueChange={(nextValue) => {
          if (nextValue === SOURCE_STYLE_CUSTOM_SELECT_VALUE) return;
          onCommit(nextValue || null);
        }}
      >
        {!hasOption && normalizedValue ? (
          <option value={SOURCE_STYLE_CUSTOM_SELECT_VALUE}>{`Custom: ${normalizedValue}`}</option>
        ) : null}
        {control.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </SelectControl>
      {normalizedValue ? (
        <SourceStyleClearButton
          ariaLabel={`Clear ${ariaLabel}`}
          className="wb-inspector-select-clear"
          onClear={() => onCommit(null)}
        />
      ) : null}
    </div>
  );
}

const SIZE_PRESETS: Array<{ key: 'fill' | 'fit' | 'auto'; label: string; value: string | null }> = [
  { key: 'fill', label: '100%', value: '100%' },
  { key: 'fit', label: 'Fit', value: 'fit-content' },
  { key: 'auto', label: 'Auto', value: null },
];

function SourceStyleSizeControl({
  ariaLabel,
  leading,
  onCommit,
  placeholder,
  showClearButton = true,
  tokenized = false,
  trailing,
  value,
}: {
  ariaLabel: string;
  leading?: ReactNode;
  onCommit: (value: string | null) => void;
  placeholder?: string;
  showClearButton?: boolean;
  tokenized?: boolean;
  trailing?: ReactNode;
  value: string;
}) {
  const activePreset = getActiveSizePreset(value);

  return (
    <div className="wb-inspector-size-control">
      <div className="wb-inspector-size-presets" role="group" aria-label={`${ariaLabel} presets`}>
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={[
              'wb-inspector-size-preset',
              activePreset === preset.key ? 'wb-inspector-size-preset--active' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={activePreset === preset.key}
            onClick={() => onCommit(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <SourceStyleTextControl
        ariaLabel={`${ariaLabel} custom value`}
        leading={leading}
        placeholder={placeholder}
        showClearButton={showClearButton}
        tokenized={tokenized}
        trailing={trailing}
        value={value}
        onCommit={onCommit}
      />
    </div>
  );
}

export function SourceStyleTextControl({
  ariaLabel,
  leading,
  onCommit,
  placeholder,
  showClearButton = true,
  tokenized = false,
  trailing,
  value,
}: {
  ariaLabel: string;
  leading?: ReactNode;
  onCommit: (value: string | null) => void;
  placeholder?: string;
  showClearButton?: boolean;
  tokenized?: boolean;
  trailing?: ReactNode;
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  const draftDirtyRef = useRef(false);
  const draftRef = useRef(draft);
  const composingRef = useRef(false);
  const focusedRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const submittedRef = useRef(normalizeSourceStyleDraft(value));
  const valueRef = useRef(value);
  const historyShortcuts = useInspectorHistoryShortcuts();

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const previousSubmitted = submittedRef.current;
    const nextSubmitted = normalizeSourceStyleDraft(value);
    valueRef.current = value;
    submittedRef.current = nextSubmitted;
    if (shouldSyncSourceFieldDraft({
      draft: normalizeSourceStyleDraft(draftRef.current),
      focused: focusedRef.current || composingRef.current,
      nextSubmitted,
      previousSubmitted,
    })) {
      draftDirtyRef.current = false;
      setDraft(value);
    }
  }, [value]);

  const commitDraft = useCallback((nextDraft = draftRef.current) => {
    if (!draftDirtyRef.current) return;
    const nextValue = normalizeSourceStyleDraft(nextDraft);
    const currentValue = normalizeSourceStyleDraft(valueRef.current);
    if (nextValue === currentValue || nextValue === submittedRef.current) {
      draftDirtyRef.current = false;
      return;
    }
    submittedRef.current = nextValue;
    draftDirtyRef.current = false;
    onCommitRef.current(nextValue);
  }, []);

  const scheduleBlurredCompositionCommit = useDeferredSourceFieldCommit(commitDraft, composingRef, focusedRef);

  const flushDraft = useCallback(() => {
    if (!composingRef.current) commitDraft();
  }, [commitDraft]);

  useFlushDraftOnUnmount(flushDraft);

  useEffect(() => {
    if (focusedRef.current) return undefined;
    if (composingRef.current) return undefined;
    const nextValue = normalizeSourceStyleDraft(draft);
    const currentValue = normalizeSourceStyleDraft(valueRef.current);
    if (nextValue === currentValue || nextValue === submittedRef.current) return undefined;
    const timeoutId = window.setTimeout(() => commitDraft(draft), SOURCE_FIELD_AUTOCOMMIT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [commitDraft, draft]);

  const clearable = showClearButton && normalizeSourceStyleDraft(draft) !== null;
  const clearValue = useCallback(() => {
    if (!clearable && normalizeSourceStyleDraft(valueRef.current) === null) return;
    draftRef.current = '';
    draftDirtyRef.current = false;
    submittedRef.current = null;
    valueRef.current = '';
    setDraft('');
    onCommitRef.current(null);
  }, [clearable]);

  const input = (
    <TextField
      aria-label={ariaLabel}
      className={[
        'wb-inspector-source-input',
        trailing ? 'wb-inspector-style-value-input' : '',
        clearable ? 'wb-inspector-style-value-input--clearable' : '',
        clearable && trailing ? 'wb-inspector-style-value-input--clearable-trailing' : '',
        leading ? 'wb-inspector-style-value-input--leading' : '',
        tokenized ? 'wb-inspector-style-value-input--tokenized' : '',
      ].filter(Boolean).join(' ')}
      placeholder={placeholder}
      value={draft}
      onBlur={(event) => {
        focusedRef.current = false;
        if (composingRef.current) return;
        commitDraft(event.currentTarget.value);
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        const nextValue = event.currentTarget.value;
        draftRef.current = nextValue;
        draftDirtyRef.current = true;
        setDraft(nextValue);
        scheduleBlurredCompositionCommit();
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onValueChange={(nextValue) => {
        draftDirtyRef.current = true;
        setDraft(nextValue);
      }}
      onBeforeInput={(event) => {
        handleInspectorHistoryBeforeInput(event, historyShortcuts);
      }}
      onKeyDown={(event) => {
        if (isInspectorImeComposing(event) || composingRef.current) return;
        if (handleInspectorHistoryKeyDown(event, historyShortcuts)) return;
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );

  const clearButton = clearable ? (
    <SourceStyleClearButton
      ariaLabel={`Clear ${ariaLabel}`}
      className={trailing ? 'wb-inspector-style-value-clear wb-inspector-style-value-clear--with-trailing' : 'wb-inspector-style-value-clear'}
      onClear={clearValue}
    />
  ) : null;

  return (
    <InspectorInputAdornmentShell
      clearButton={clearButton}
      leading={leading}
      tokenized={tokenized}
      trailing={trailing}
      variant="style"
    >
      {input}
    </InspectorInputAdornmentShell>
  );
}

function InspectorInputAdornmentShell({
  children,
  clearButton,
  leading,
  tokenized = false,
  trailing,
  variant,
}: {
  children: ReactNode;
  clearButton?: ReactNode;
  leading?: ReactNode;
  tokenized?: boolean;
  trailing?: ReactNode;
  variant: 'source' | 'style';
}) {
  // Always wrap with the shell div so the parent element is stable across
  // renders — otherwise a clearButton or leading/trailing slot appearing
  // mid-edit would re-parent the input and break focus / IME composition.
  if (variant === 'source') {
    return (
      <div className={tokenized ? 'wb-inspector-input-shell wb-inspector-input-shell--tokenized' : 'wb-inspector-input-shell'}>
        {leading ? (
          <span className="wb-inspector-input-leading" aria-hidden="true">
            {leading}
          </span>
        ) : null}
        {children}
        {clearButton}
        {trailing ? (
          <div className="wb-inspector-input-trailing">
            {trailing}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={tokenized ? 'wb-inspector-style-value-shell wb-inspector-style-value-shell--tokenized' : 'wb-inspector-style-value-shell'}>
      {leading ? (
        <div className="wb-inspector-style-value-leading">
          {leading}
        </div>
      ) : null}
      {children}
      {clearButton}
      {trailing ? (
        <div className="wb-inspector-style-value-trailing">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

function SourceStyleClearButton({
  ariaLabel,
  className,
  onClear,
}: {
  ariaLabel: string;
  className: string;
  onClear: () => void;
}) {
  return (
    <IconButton
      className={`wb-inspector-style-clear-button ${className}`.trim()}
      label={ariaLabel}
      onClick={onClear}
      onMouseDown={(event) => event.preventDefault()}
    >
      <X size={12} aria-hidden="true" />
    </IconButton>
  );
}

function useFlushDraftOnUnmount(flushDraft: () => void) {
  const flushDraftRef = useRef(flushDraft);

  useEffect(() => {
    flushDraftRef.current = flushDraft;
  }, [flushDraft]);

  useEffect(() => () => {
    flushDraftRef.current();
  }, []);
}

function useDeferredSourceFieldCommit(
  commitDraft: () => void,
  composingRef: { current: boolean },
  focusedRef: { current: boolean },
) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return useCallback(() => {
    if (focusedRef.current) return;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (!focusedRef.current && !composingRef.current) {
        commitDraft();
      }
    }, 0);
  }, [commitDraft, composingRef, focusedRef]);
}

function shouldSyncSourceFieldDraft<TValue>({
  draft,
  focused,
  nextSubmitted,
  previousSubmitted,
}: {
  draft: TValue;
  focused: boolean;
  nextSubmitted: TValue;
  previousSubmitted: TValue;
}): boolean {
  if (!focused) return true;
  if (draft === nextSubmitted) return true;
  return draft === previousSubmitted && previousSubmitted !== nextSubmitted;
}

function SourceStyleColorSwatch({
  fallback,
  onCommit,
  value,
}: {
  fallback?: string;
  onCommit: (value: string | null) => void;
  value: string;
}) {
  const color = getEditableHexColor(value) ?? getEditableHexColor(fallback ?? '');
  if (!color) return null;
  const unset = !value.trim();

  return (
    <label
      className={unset ? 'wb-inspector-style-color-swatch wb-inspector-style-color-swatch--placeholder' : 'wb-inspector-style-color-swatch'}
      style={{ background: color }}
      title={unset ? 'Set color' : color}
    >
      <input
        aria-label="Set source style color"
        type="color"
        value={color}
        onChange={(event) => onCommit(event.currentTarget.value)}
      />
    </label>
  );
}

function normalizeSourceAttributeDraft(value: string): string | null {
  return value.trim() ? value : null;
}

function normalizeSourceStyleDraft(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function getActiveSizePreset(value: string): 'fill' | 'fit' | 'auto' | 'custom' {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'auto') return 'auto';
  if (normalized === '100%') return 'fill';
  if (normalized === 'fit-content') return 'fit';
  return 'custom';
}

function findSourceStyleTokenResult(
  registry: TokenRegistry,
  field: InspectorField,
  styleValue: string,
  modeByCollection: PreviewTokenModeSelection,
): TokenPickerResult | null {
  const normalizedStyleValue = styleValue.trim();
  if (!normalizedStyleValue) return null;
  return queryTokens(registry, { field, modeByCollection })
    .find((result) => result.cssVariableAliases.includes(normalizedStyleValue)) ?? null;
}

function getSourceStyleTokenCssVariable(
  registry: TokenRegistry,
  field: InspectorField,
  reference: TokenReference,
  modeByCollection: PreviewTokenModeSelection,
): string | null {
  return queryTokens(registry, { field, modeByCollection })
    .find((result) => (
      result.collection.id === reference.collectionId &&
      result.token.id === reference.tokenId &&
      result.compatible
    ))
    ?.cssVariable ?? null;
}

function formatSourceStyleTokenRawValue(
  result: TokenPickerResult,
  registry: TokenRegistry,
  colorSchemeSide: WorkbenchColorSchemeSide = 'light',
): string | null {
  if (result.resolved === null) return null;
  return getTokenPreviewCss(result, registry, colorSchemeSide) ?? result.previewText;
}

function isColorSourceStyleField(field: InspectorField | undefined): boolean {
  return field === 'bgColor' || field === 'borderColor' || field === 'textColor';
}

function getEditableHexColor(value: string): string | null {
  const normalized = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized;
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return `#${normalized.slice(1).split('').map((digit) => `${digit}${digit}`).join('')}`;
  }
  return null;
}

function formatContextSource(selectedLayer: PreviewLayer | null): string | null {
  if (!selectedLayer?.sourceFile) return null;
  if (!selectedLayer.sourceLocation) return selectedLayer.sourceFile;
  const location = selectedLayer.sourceLocation;
  return `${selectedLayer.sourceFile}:${location.startLine}:${location.startColumn}`;
}

function formatContextStatus(diagnostic: string, notice: string): string {
  const summaries = Array.from(new Set(
    [diagnostic, notice]
      .map((value) => value.trim())
      .filter(Boolean),
  ));
  return summaries.join(' · ') || 'Ready';
}

function getSourceAttributes(
  selectedLayer: PreviewLayer | null,
  selectedSourceNode: EditableTreeNode | null,
): Record<string, string> {
  return selectedSourceNode?.sourceAttributes ?? selectedLayer?.sourceAttributes ?? {};
}

function normalizeTailwindClassNameInput(value: string): string | null {
  const normalized = value
    .split(/\s+/)
    .map((className) => className.trim())
    .filter(Boolean)
    .join(' ');
  return normalized || null;
}

function getTailwindClassNameTokens(value: string): string[] {
  return [...new Set(
    value
      .split(/\s+/)
      .map((className) => className.trim())
      .filter(Boolean),
  )];
}

function getComponentStoryForSourceNode(selectedSourceNode: EditableTreeNode | null) {
  if (selectedSourceNode?.kind !== 'component-instance') return null;
  const candidates = new Set([
    selectedSourceNode.label,
    selectedSourceNode.source?.jsxName,
    selectedSourceNode.source?.importName,
  ].filter((value): value is string => Boolean(value && value.trim())));
  if (candidates.size === 0) return null;
  const normalizedCandidates = new Set([...candidates].flatMap((candidate) => getInspectorComponentNameAliases(candidate)));
  return getWorkbenchStories().find((story) => (
    normalizedCandidates.has(story.name) ||
    normalizedCandidates.has(story.componentId) ||
    getInspectorComponentNameAliases(story.name).some((alias) => normalizedCandidates.has(alias)) ||
    getInspectorComponentNameAliases(story.componentId).some((alias) => normalizedCandidates.has(alias))
  )) ?? null;
}

function resolveInspectorComponentStory({
  componentStory,
  selectedLayer,
  selectedSourceNode,
}: {
  componentStory?: WorkbenchStory | null;
  selectedLayer: PreviewLayer | null;
  selectedSourceNode: EditableTreeNode | null;
}): WorkbenchStory | null {
  if (isLocalSourceComponentBoundary(selectedSourceNode)) {
    return createSourcePropsStoryForInspector(selectedSourceNode);
  }
  if (componentStory && isInspectorStoryCompatibleWithSelection(componentStory, selectedLayer, selectedSourceNode)) {
    return componentStory;
  }
  const registeredStory = getComponentStoryForSourceNode(selectedSourceNode);
  if (registeredStory && isInspectorStoryCompatibleWithSelection(registeredStory, selectedLayer, selectedSourceNode)) {
    return registeredStory;
  }
  return createSourcePropsStoryForInspector(selectedSourceNode);
}

function isInspectorStoryCompatibleWithSelection(
  story: WorkbenchStory,
  selectedLayer: PreviewLayer | null,
  selectedSourceNode: EditableTreeNode | null,
): boolean {
  const candidates = new Set([
    selectedSourceNode?.label,
    selectedSourceNode?.source?.jsxName,
    selectedSourceNode?.source?.importName,
    selectedLayer?.label,
    selectedLayer?.jsxName,
  ].filter((value): value is string => Boolean(value && value.trim())));
  const normalizedCandidates = new Set([...candidates].flatMap((candidate) => getInspectorComponentNameAliases(candidate)));
  return normalizedCandidates.has(story.name) ||
    normalizedCandidates.has(story.componentId) ||
    getInspectorComponentNameAliases(story.name).some((alias) => normalizedCandidates.has(alias));
}

function createSourcePropsStoryForInspector(selectedSourceNode: EditableTreeNode | null): WorkbenchStory | null {
  if (selectedSourceNode?.kind !== 'component-instance') return null;
  const sourceArgs = getSimpleWorkbenchStoryArgs(selectedSourceNode.sourceProps);
  const propMetadata = selectedSourceNode.sourceValueMetadata?.props ?? {};
  // Without a registered story there is no semantic prop contract. Keep only
  // directly writable literals as fallback controls; presenting every
  // expression-backed helper input with a "Use value" detach action turns a
  // local implementation boundary into an unreadable developer prop dump.
  const defaultArgs = Object.fromEntries(
    Object.entries(sourceArgs).filter(([key]) => propMetadata[key]?.writable !== false),
  ) as WorkbenchStoryArgs;
  if (Object.keys(defaultArgs).length === 0) return null;
  return {
    componentId: selectedSourceNode.source?.jsxName ?? selectedSourceNode.id,
    controls: getFallbackControlsFromArgs(defaultArgs),
    defaultArgs,
    description: 'Props currently present in JSX.',
    name: selectedSourceNode.source?.jsxName ?? selectedSourceNode.label,
    render: () => null,
    variants: [],
  };
}

function getInspectorComponentNameAliases(value: string): string[] {
  return [
    value,
    value.replace(/^Wbds/, ''),
    value.replace(/^WbDs/, ''),
  ].filter((candidate, index, aliases) => candidate.length > 0 && aliases.indexOf(candidate) === index);
}

function formatComponentPropValue(value: boolean | number | string): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return value || 'Not set';
}

function formatDescriptorFieldValue(
  field: InspectorFieldDescriptor,
  model: HtmlInspectorModel,
  attributes: Record<string, string>,
  selectedSourceNode: EditableTreeNode | null,
): string {
  if (field.editKind === 'text-content') {
    return getReadableNodeText(selectedSourceNode) ?? '';
  }

  if (field.id === 'content.label') {
    return getAccessibleName(attributes, selectedSourceNode) ?? 'Not set';
  }

  if (field.id === 'layout.flow') return formatDefaultFlow(model.category, model.elementName);
  if (field.id === 'layout.box') return formatBoxModelSource(attributes, selectedSourceNode);
  if (field.id === 'layout.width') return attributes.width ?? 'Auto';
  if (field.id === 'layout.height') return attributes.height ?? 'Auto';

  if (field.id === 'a11y.name') {
    return getAccessibleName(attributes, selectedSourceNode) ?? 'Not set';
  }

  if (field.id === 'a11y.alt') {
    return attributes.alt ?? 'Not set';
  }

  if (field.id === 'a11y.role') {
    return attributes.role ?? 'Native';
  }

  if (field.id === 'a11y.native') return getNativeSemantics(model.category, model.elementName);

  if (field.attributeName) return attributes[field.attributeName] ?? 'Not set';

  return 'Not set';
}

function getSourceAttribute(attributes: Record<string, string>, names: string[]): string | null {
  for (const name of names) {
    const value = attributes[name]?.trim();
    if (value) return value;
  }
  return null;
}

function getAccessibleName(
  attributes: Record<string, string>,
  selectedSourceNode: EditableTreeNode | null,
): string | null {
  const directName = getSourceAttribute(attributes, ['aria-label', 'title', 'alt']);
  if (directName) return directName;

  const labelledBy = getSourceAttribute(attributes, ['aria-labelledby']);
  if (labelledBy) return `aria-labelledby: ${labelledBy}`;

  return getReadableNodeText(selectedSourceNode);
}

function getReadableNodeText(node: EditableTreeNode | null): string | null {
  if (!node) return null;
  const childText = (node.children ?? [])
    .flatMap((child) => {
      const text = getReadableNodeText(child);
      return text ? [text] : [];
    })
    .join(' ')
    .trim();

  if (childText) return childText;
  if (isSourceTextLeaf(node)) {
    const text = typeof node.textContent === 'string' ? node.textContent : node.label;
    return text.trim() ? text : null;
  }
  return null;
}

function isSourceTextLeaf(node: EditableTreeNode): boolean {
  return node.kind === 'text' && node.source?.jsxName === 'text';
}

function formatDefaultFlow(category: HtmlInspectorCategory, elementName: string): string {
  if (category === 'component') return 'Component root';
  if (category === 'media') return 'Replaced media';
  if (category === 'interactive') {
    const tagName = elementName.toLowerCase();
    if (tagName === 'a') return 'Inline link';
    if (tagName === 'summary') return 'Disclosure control';
    return 'Form control';
  }
  if (category === 'text') return 'Text flow';
  if (category === 'container') return 'Block flow';
  return 'Unknown';
}

function formatBoxModelSource(
  attributes: Record<string, string>,
  selectedSourceNode: EditableTreeNode | null,
): string {
  const tokenFields = Object.keys(selectedSourceNode?.tokenBindings ?? {});
  if (tokenFields.length > 0) return `Token: ${tokenFields.join(', ')}`;
  if (getSourceAttribute(attributes, ['className', 'class'])) return 'Class source';
  return 'Source default';
}

function getNativeSemantics(category: HtmlInspectorCategory, elementName: string): string {
  if (category === 'component') return 'Component';
  if (elementName === 'text') return 'Text node';
  return `<${elementName}>`;
}
