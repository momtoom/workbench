import { Component as ReactComponent, createElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Box, Component, Layers, Palette, Ruler, SlidersHorizontal, Type } from 'lucide-react';
import type { EditableDocumentTree, EditableTreeNode } from '@domain/document/editableTree';
import {
  analyzeSourceWithHostedCore,
  formatHostedSourceAnalysisDiagnostic,
} from '@domain/core/workbenchHostedSourceAnalysis';
import { createEditableDocumentTreeFromPageSource } from '@domain/document/pageSourceAdapter';
import type { CodexComponentLibraryHandoffAction } from '@domain/document/codexComponentLibraryHandoff';
import { resolvePreviewNodeDrillIn, resolvePreviewNodeSelection } from '@domain/preview/previewSelectionService';
import type { TokenRegistry } from '@domain/design-system/tokens/types';
import type { WorkbenchAssetRegistry, WorkbenchComponentRegistry } from '@domain/project/workbenchProject';
import { subscribeWorkbenchProjectChangeEvents } from '@domain/project/workbenchHostTransport';
import {
  getWorkbenchPropRegistryPath,
  loadWorkbenchPropRegistry,
  readWorkbenchSourceFile,
  saveWorkbenchPropRegistry,
} from '@domain/project/workbenchProjectLoader';
import { getWorkbenchDefaultFontCssText, getWorkbenchDefaultIconSourceMap } from '@domain/design-system/assets/assetRegistry';
import {
  compareWorkbenchComponentGroupIds,
  formatWorkbenchComponentGroupLabel,
  getWorkbenchComponentGroupId,
} from '@domain/project/componentGrouping';
import { Button, SearchField, SelectControl, TextArea, TextField } from '@shared/ui/primitives';
import {
  getWorkbenchStory,
  getWorkbenchStoryBySourceName,
} from '../../../workbench-stories/stories';
import {
  isWorkbenchStorySelectOption,
  type WorkbenchStory,
  type WorkbenchStoryArgValue,
  type WorkbenchStoryArgs,
  type WorkbenchStoryControl,
  type WorkbenchStoryControlAssetKind,
  type WorkbenchStoryControlPicker,
  type WorkbenchStoryControlTokenType,
  type WorkbenchStoryMetadata,
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
import {
  sortWorkbenchStoryArgs,
  sortWorkbenchStoryControls,
} from '../../../workbench-stories/storyPropOrder';
import {
  getFoundationCollectionOptions,
  getFoundationTokenSourceOptions,
  getResolvedColorFoundationSettings,
  getResolvedTypographyFoundationSettings,
  getWorkbenchFoundationPreview,
  getWorkbenchFoundationPreviews,
  type ColorFoundationSettings,
  type WorkbenchFoundationCollectionOption,
  type WorkbenchFoundationPreview,
  type WorkbenchFoundationPreviewSettings,
  type WorkbenchFoundationTokenSourceOption,
  type TypographyFoundationSettings,
} from '../../../workbench-foundations/foundationPreviews';
import {
  WorkbenchEditorFrame,
  WorkbenchEditorPanel,
  WorkbenchEditorPanelBody,
  WorkbenchEditorPanelHeader,
  WorkbenchEditorSidebar,
  WorkbenchEditorSurface,
  WorkbenchEditorToolbar,
  WorkbenchPanelFooter,
  WorkbenchResizeHandle,
} from './WorkbenchEditorShell';
import {
  WorkbenchSidebarMeta,
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
  WorkbenchSidebarSectionHeader,
} from './WorkbenchSidebarPrimitives';
import {
  SOURCE_TREE_PREVIEW_FRAME_HTML,
  SourceTreePreview,
  syncSourceTreePreviewFrameHead,
  syncSourceTreePreviewFrameTokenVariables,
  type SourceTreePreviewSelectionMode,
} from './SourceTreePreview';
import { getSourceTreePreviewThemeMode, getSourceTreePreviewTokenVariables } from './sourceTreePreviewTokens';
import type { SourceTreePreviewTailwindCssMode } from './sourceTreePreviewTailwindRuntime';
import { getLibraryScopeClassName } from '@domain/document/libraryScopeRegistry';
import type { PreviewTokenModeSelection } from './DesignInspectorTypes';
import { InspectorComponentPropsSection } from './DesignInspectorPanel';
import {
  importStorybookCsfStory,
  importStorybookRuntimeComponent,
  type CsfRuntimeImportResult,
  type CsfRuntimeModuleState,
} from '../../../workbench-stories/csfRuntimeLoader';
import {
  DesignPreviewControlBar,
  DesignPreviewTokenModeModal,
  DesignPreviewViewportFrame,
} from './DesignEditor';
import { WorkbenchPortalScopeContext } from '../../../runtime/workbenchReactRuntimeGlobals';
import {
  DEFAULT_DESIGN_PREVIEW_APPEARANCE,
  formatPreviewTokenModeSummary,
  getDesignPreviewAppearanceThemeMode,
  reconcileDesignPreviewViewport,
  reconcilePreviewTokenModes,
  type DesignPreviewAppearance,
  type DesignPreviewViewport,
} from './designPreviewSettings';

type StorybookLibraryProps = {
  activeTarget?: StorybookActiveTarget | null;
  assets?: WorkbenchAssetRegistry;
  components: WorkbenchComponentRegistry;
  inspectorWidth?: number;
  onActiveTargetChange?: (target: StorybookActiveTarget | null) => void;
  onImportComponentLibrary: (files: File[]) => Promise<ComponentLibraryImportResult>;
  onImportComponentLibraryPath: (sourcePath: string) => Promise<ComponentLibraryImportResult>;
  onRelinkLibraryCss: () => Promise<{ ok: true; changedCount: number } | { ok: false; message: string }>;
  sidebarWidth?: number;
  startInspectorWidthResize: (event: React.PointerEvent<HTMLButtonElement>) => void;
  startSidebarWidthResize: (event: React.PointerEvent<HTMLButtonElement>) => void;
  surfaceNav?: ReactNode;
  tailwindCssMode: SourceTreePreviewTailwindCssMode;
  tokenRegistry: TokenRegistry;
};

type ComponentLibraryImportResult =
  | {
      ok: true;
      addedCount?: number;
      count: number;
      tokenCollectionCount?: number;
      unchangedCount?: number;
      updatedCount?: number;
    }
  | { ok: false; message: string };

export type StorybookActiveTarget =
  | { kind: 'component'; id: string }
  | { kind: 'foundation'; id: string };

type LibraryComponent = WorkbenchComponentRegistry['components'][number];
type StorybookPanelTab = 'controls' | 'variants' | 'docs';
type StorybookRegistrationStatus = { kind: 'idle' | 'running' | 'success' | 'error'; message: string };
type StorybookPropRegistryStatus = { kind: 'idle' | 'loading' | 'saving' | 'success' | 'error'; message: string };
type CodexLibraryRequestDraft = {
  action: CodexComponentLibraryHandoffAction;
  libraryName: string;
  prompt: string;
};
type StorybookSourcePreviewState =
  | { status: 'idle'; diagnostic: string; tree: null }
  | { status: 'loading'; diagnostic: string; tree: null }
  | { status: 'ready'; diagnostic: string; tree: EditableDocumentTree }
  | { status: 'error'; diagnostic: string; tree: null };

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>;
};

function setWorkbenchPreviewIconSourceMap(sources: Record<string, string>) {
  (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__ = sources;
}

type StorybookRuntimeModuleState = CsfRuntimeModuleState;
type StorybookCsfImportResult = CsfRuntimeImportResult;

function getComponentSourceParseNames(component: LibraryComponent): string[] {
  const trimmed = component.name.trim();
  if (!trimmed) return [];
  const importName = getStringExtension(component.extensions, 'importName') ?? getStringExtension(component.extensions, 'sourceExportName');
  return [...new Set([
    ...(importName ? [importName] : []),
    trimmed,
  ])];
}

function getStringExtension(extensions: Record<string, unknown> | undefined, key: string): string | null {
  const value = extensions?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getComponentRuntimeExportName(component: LibraryComponent): string {
  return getStringExtension(component.extensions, 'importName') ??
    getStringExtension(component.extensions, 'sourceExportName') ??
    component.name;
}

function getLibraryComponentStory(component: LibraryComponent): WorkbenchStory | null {
  if (getComponentCsfStorySourceFile(component)) return null;
  if (component.extensions?.source === 'imported') return null;
  return getWorkbenchStory(component.id) ??
    getComponentSourceParseNames(component).map((sourceName) => getWorkbenchStoryBySourceName(sourceName)).find(Boolean) ??
    null;
}

function getComponentCsfStorySourceFile(component: LibraryComponent): string | null {
  const configured = getStringExtension(component.extensions, 'storySourceFile');
  if (configured && getStringExtension(component.extensions, 'storyFormat') === 'csf') return configured;
  if (component.extensions?.source === 'imported') {
    if (/\.vue$/i.test(component.sourceFile)) {
      return component.sourceFile.replace(/\.vue$/i, '.stories.ts');
    }
    return component.sourceFile.replace(/\.(tsx|jsx)$/i, '.stories.$1');
  }
  return null;
}

function getComponentStoryFromMetadata(component: LibraryComponent): WorkbenchStory | null {
  const metadata = normalizeStoryMetadata(component.extensions?.story, component);
  if (!metadata) return null;
  return {
    ...metadata,
    componentId: component.id,
    name: metadata.name || component.name,
    render: () => null,
  };
}

function normalizeStoryMetadata(value: unknown, component: LibraryComponent): WorkbenchStoryMetadata | null {
  if (!isRecord(value)) return null;
  const componentContext = {
    componentId: getTrimmedString(value.componentId) ?? component.id,
    componentName: getTrimmedString(value.componentName) ?? undefined,
    extensions: component.extensions,
    name: getTrimmedString(value.name) ?? component.name,
    previewExportName: getTrimmedString(value.previewExportName) ?? undefined,
    sourceFile: getTrimmedString(value.sourceFile) ?? component.sourceFile,
  };
  const designControls = sortWorkbenchStoryControls(applyWorkbenchPropRegistry(normalizeStoryControls(value.designControls), componentContext));
  const hasDesignDefaultArgs = Object.prototype.hasOwnProperty.call(value, 'designDefaultArgs');
  const designDefaultArgs = hasDesignDefaultArgs ? sortWorkbenchStoryArgs(normalizeStoryArgs(value.designDefaultArgs)) : {};
  return {
    componentId: componentContext.componentId,
    componentName: componentContext.componentName,
    controls: sortWorkbenchStoryControls(applyWorkbenchPropRegistry(normalizeStoryControls(value.controls), componentContext)),
    defaultArgs: sortWorkbenchStoryArgs(normalizeStoryArgs(value.defaultArgs)),
    ...(designControls.length > 0 ? { designControls } : {}),
    ...(hasDesignDefaultArgs ? { designDefaultArgs } : {}),
    description: getTrimmedString(value.description) ?? '',
    name: componentContext.name,
    previewExportName: componentContext.previewExportName,
    previewSourceFile: getTrimmedString(value.previewSourceFile) ?? undefined,
    sourceFile: componentContext.sourceFile,
    variants: normalizeStoryVariants(value.variants),
  };
}

function normalizeStoryArgs(value: unknown): WorkbenchStoryArgs {
  if (!isRecord(value)) return {};
  return sortWorkbenchStoryArgs(Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string | number | boolean] => (
      typeof entry[0] === 'string' &&
      (typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean')
    )),
  ));
}

function normalizeStoryControls(value: unknown): WorkbenchStoryControl[] {
  return getStoryControlCandidates(value).flatMap((candidate): WorkbenchStoryControl[] => {
    if (!isRecord(candidate)) return [];
    const key = getTrimmedString(candidate.key);
    const label = getTrimmedString(candidate.label) ?? key;
    const type = getStoryControlType(candidate);
    if (key === 'className') return [];
    if (!key || !label) return [];
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
      const options = Array.isArray(candidate.options)
        ? candidate.options.filter(isWorkbenchStorySelectOption)
        : [];
      return options.length > 0 ? [{ ...base, options, type }] : [];
    }
    if (type === 'boolean' || type === 'icon' || type === 'text') {
      return [{ ...base, type }];
    }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function StorybookLibrary({
  activeTarget,
  assets,
  components,
  inspectorWidth,
  onActiveTargetChange,
  onImportComponentLibrary,
  onImportComponentLibraryPath,
  onRelinkLibraryCss,
  sidebarWidth,
  startInspectorWidthResize,
  startSidebarWidthResize,
  surfaceNav,
  tailwindCssMode,
  tokenRegistry,
}: StorybookLibraryProps) {
  setWorkbenchPreviewIconSourceMap(getWorkbenchDefaultIconSourceMap(assets));
  const items = useMemo(() => getStorybookLibraryComponents(components.components), [components.components]);
  const foundationPreviews = useMemo(() => getWorkbenchFoundationPreviews(), []);
  const [activeFoundationId, setActiveFoundationId] = useState<string | null>(
    () => activeTarget?.kind === 'foundation'
      ? activeTarget.id
      : activeTarget?.kind === 'component'
        ? null
        : foundationPreviews[0]?.id ?? null,
  );
  const [activeComponentId, setActiveComponentId] = useState<string | null>(
    () => activeTarget?.kind === 'component' ? activeTarget.id : null,
  );
  const [panelTab, setPanelTab] = useState<StorybookPanelTab>('controls');
  const [search, setSearch] = useState('');
  const [selectedPreviewNodeId, setSelectedPreviewNodeId] = useState<string | null>(null);
  const [previewDrillPath, setPreviewDrillPath] = useState<string[]>([]);
  const [sourcePreview, setSourcePreview] = useState<StorybookSourcePreviewState>({
    status: 'idle',
    diagnostic: 'Select a component.',
    tree: null,
  });
  const [runtimeModule, setRuntimeModule] = useState<StorybookRuntimeModuleState>({
    status: 'idle',
    component: null,
    diagnostic: 'Select a component.',
  });
  const [runtimeStory, setRuntimeStory] = useState<WorkbenchStory | null>(null);
  const [previewViewport, setPreviewViewport] = useState<DesignPreviewViewport>(() => reconcileDesignPreviewViewport({ presetId: 'full' }));
  const [previewAppearance, setPreviewAppearance] = useState<DesignPreviewAppearance>(DEFAULT_DESIGN_PREVIEW_APPEARANCE);
  const [previewModeModalOpen, setPreviewModeModalOpen] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<StorybookRegistrationStatus>({
    kind: 'idle',
    message: '',
  });
  const [libraryImportOpen, setLibraryImportOpen] = useState(false);
  const [codexLibraryRequestDraft, setCodexLibraryRequestDraft] = useState<CodexLibraryRequestDraft | null>(null);
  const [storyPreviewTokenModes, setStoryPreviewTokenModes] = useState<PreviewTokenModeSelection>({});
  const [storyArgsByComponentId, setStoryArgsByComponentId] = useState<Record<string, WorkbenchStoryArgs>>({});
  const [storyCountsByComponentId, setStoryCountsByComponentId] = useState<Record<string, number | null>>({});
  const [foundationSettings, setFoundationSettings] = useState<WorkbenchFoundationPreviewSettings>({});
  const [propRegistry, setPropRegistry] = useState<WorkbenchPropRegistrySource>(() => createEmptyWorkbenchPropRegistry());
  const [propRegistryStatus, setPropRegistryStatus] = useState<StorybookPropRegistryStatus>({
    kind: 'idle',
    message: '',
  });
  const [propRegistryRevision, setPropRegistryRevision] = useState(0);
  const [runtimeSourceRevision, setRuntimeSourceRevision] = useState(0);
  const propRegistryPath = getWorkbenchPropRegistryPath();

  // A dependency-tree change (install completing, package.json edit) can turn
  // a failed story import loadable, so retry the active preview.
  useEffect(() => subscribeWorkbenchProjectChangeEvents((event) => {
    const changedPath = event.path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
    if (changedPath === 'package.json' || changedPath === '.workbench/dependency-install.json') {
      setRuntimeSourceRevision((revision) => revision + 1);
    }
  }), []);
  const activeFoundation = activeFoundationId ? getWorkbenchFoundationPreview(activeFoundationId) : null;
  const activeComponent = activeFoundation ? null : items.find((component) => component.id === activeComponentId) ?? items[0] ?? null;
  const staticStory = activeComponent ? getLibraryComponentStory(activeComponent) : null;
  const activeComponentCsfStorySourceFile = activeComponent ? getComponentCsfStorySourceFile(activeComponent) : null;
  const activeComponentRuntimeExportName = activeComponent ? getComponentRuntimeExportName(activeComponent) : null;
  const activeStory = runtimeStory ?? staticStory;
  const activeStoryDefaultArgs = useMemo(
    () => activeStory
      ? sortWorkbenchStoryArgs({ ...activeStory.defaultArgs, ...getComponentDefaultArgs(activeComponent, activeStory) })
      : {},
    [activeComponent, activeStory],
  );
  const activeStoryArgs = useMemo(
    () => activeStory
      ? sortWorkbenchStoryArgs({ ...activeStoryDefaultArgs, ...(storyArgsByComponentId[activeStory.componentId] ?? {}) })
      : {},
    [activeStory, activeStoryDefaultArgs, storyArgsByComponentId],
  );
  const reconciledStoryPreviewTokenModes = useMemo(
    () => reconcilePreviewTokenModes(tokenRegistry, storyPreviewTokenModes),
    [storyPreviewTokenModes, tokenRegistry],
  );
  const storyTokenVariables = useMemo(
    () => getSourceTreePreviewTokenVariables(tokenRegistry, reconciledStoryPreviewTokenModes) ?? {},
    [reconciledStoryPreviewTokenModes, tokenRegistry],
  );
  // An explicit light/dark appearance wins, matching the Design canvas. Only
  // `system` defers to whatever theme the active token modes resolve to, which
  // is what the library used to do unconditionally.
  const storyThemeMode = useMemo(
    () => getDesignPreviewAppearanceThemeMode(previewAppearance)
      ?? getSourceTreePreviewThemeMode(tokenRegistry, reconciledStoryPreviewTokenModes),
    [previewAppearance, reconciledStoryPreviewTokenModes, tokenRegistry],
  );
  const previewModeSummary = useMemo(
    () => formatPreviewTokenModeSummary(tokenRegistry, reconciledStoryPreviewTokenModes),
    [reconciledStoryPreviewTokenModes, tokenRegistry],
  );
  const previewControlNode = useMemo<EditableTreeNode | null>(() => activeComponent ? {
    id: activeComponent.id,
    inspectable: true,
    kind: 'component-instance',
    label: activeComponent.name,
    source: {
      sourceFile: activeComponent.sourceFile,
    },
  } : activeFoundation ? {
    id: `foundation:${activeFoundation.id}`,
    inspectable: false,
    kind: 'frame',
    label: activeFoundation.name,
  } : null, [activeComponent, activeFoundation]);
  const filteredFoundations = useMemo(
    () => filterFoundationPreviews(foundationPreviews, search),
    [foundationPreviews, search],
  );
  const filteredItems = useMemo(() => filterStorybookComponents(items, search), [items, search]);
  const componentGroups = useMemo(() => groupStorybookComponents(filteredItems), [filteredItems]);
  /* No built-in preset auto-imports — users pick component source files
     themselves through the file dialog opened by the Import modal. */
  const variantAxes = useMemo(() => getComponentVariantAxes(activeComponent), [activeComponent]);

  useEffect(() => {
    let cancelled = false;
    setPropRegistryStatus({ kind: 'loading', message: 'Loading prop registry...' });
    void loadWorkbenchPropRegistry(propRegistryPath)
      .then((value) => {
        if (cancelled) return;
        const nextRegistry = normalizeWorkbenchPropRegistry(value ?? createEmptyWorkbenchPropRegistry());
        setWorkbenchPropRegistryOverride(nextRegistry);
        setPropRegistry(nextRegistry);
        setPropRegistryRevision((revision) => revision + 1);
        setPropRegistryStatus({
          kind: 'idle',
          message: value ? `Loaded ${propRegistryPath}.` : `Using default registry. Save to create ${propRegistryPath}.`,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setWorkbenchPropRegistryOverride(null);
        setPropRegistry(createEmptyWorkbenchPropRegistry());
        setPropRegistryStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : `Failed to load ${propRegistryPath}.`,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [propRegistryPath]);

  useEffect(() => {
    if (activeFoundation) return;
    if (items.length === 0) {
      setActiveComponentId(null);
      onActiveTargetChange?.(null);
      return;
    }
    if (!activeComponentId || !items.some((component) => component.id === activeComponentId)) {
      const nextComponentId = items[0]?.id ?? null;
      setActiveComponentId(nextComponentId);
      onActiveTargetChange?.(nextComponentId ? { kind: 'component', id: nextComponentId } : null);
    }
  }, [activeComponent, activeComponentId, activeFoundation, items, onActiveTargetChange]);

  useEffect(() => {
    setSelectedPreviewNodeId(null);
    setPreviewDrillPath([]);
  }, [activeComponent?.id, activeFoundation?.id]);

  useEffect(() => {
    setRuntimeStory(null);
    if (!activeComponent) {
      setRuntimeModule({
        status: 'idle',
        component: null,
        diagnostic: 'No component selected.',
      });
      return undefined;
    }

    let cancelled = false;
    const csfStorySourceFile = activeComponentCsfStorySourceFile;
    const sourceFile = csfStorySourceFile ?? staticStory?.previewSourceFile ?? activeComponent.sourceFile;
    const exportName = staticStory?.previewSourceFile
      ? staticStory.previewExportName ?? 'default'
      : activeComponentRuntimeExportName ?? getComponentRuntimeExportName(activeComponent);
    setRuntimeModule({
      status: 'loading',
      component: null,
      diagnostic: `Loading ${sourceFile}...`,
    });

    if (csfStorySourceFile) {
      void importStorybookCsfStory(csfStorySourceFile, activeComponent).then((result) => {
        if (cancelled) return;
        if (result) {
          setRuntimeStory(result.story);
          setStoryCountsByComponentId((current) => (
            current[activeComponent.id] === result.story.variants.length
              ? current
              : { ...current, [activeComponent.id]: result.story.variants.length }
          ));
          setRuntimeModule({
            status: 'ready',
            component: result.component,
            diagnostic: `Loaded ${csfStorySourceFile}.`,
          });
          return;
        }
        void importStorybookRuntimeComponent(activeComponent.sourceFile, activeComponentRuntimeExportName ?? getComponentRuntimeExportName(activeComponent)).then((fallbackResult) => {
          if (cancelled) return;
          setRuntimeModule(fallbackResult);
        });
      });
    } else {
      void importStorybookRuntimeComponent(sourceFile, exportName).then((result) => {
        if (cancelled) return;
        setRuntimeModule(result);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [
    activeComponent?.id,
    activeComponent?.name,
    activeComponent?.sourceFile,
    activeComponentCsfStorySourceFile,
    activeComponentRuntimeExportName,
    propRegistryRevision,
    runtimeSourceRevision,
    staticStory?.componentId,
    staticStory?.previewExportName,
    staticStory?.previewSourceFile,
  ]);

  useEffect(() => {
    if (!activeComponent) {
      setSourcePreview({
        status: 'idle',
        diagnostic: 'No component selected.',
        tree: null,
      });
      return undefined;
    }

    let cancelled = false;
    setSourcePreview({
      status: 'loading',
      diagnostic: `Reading ${activeComponent.sourceFile}...`,
      tree: null,
    });

    void readWorkbenchSourceFile(activeComponent.sourceFile).then(async (result) => {
      if (cancelled) return;
      if (!result.ok) {
        setSourcePreview({
          status: 'error',
          diagnostic: `${activeComponent.sourceFile} could not be read: ${result.message}.`,
          tree: null,
        });
        return;
      }

      const preferredComponentNames = getComponentSourceParseNames(activeComponent);
      const [hostedAnalysis, parsed] = await Promise.all([
        analyzeSourceWithHostedCore({
          contents: result.contents,
          preferredComponentNames,
          sourceFile: activeComponent.sourceFile,
        }).catch(() => null),
        createEditableDocumentTreeFromPageSource({
          contents: result.contents,
          label: `${activeComponent.name} source`,
          preferredComponentNames,
          sourceFile: activeComponent.sourceFile,
        }),
      ]);
      const hostedDiagnostic = formatHostedSourceAnalysisDiagnostic(hostedAnalysis);
      if (cancelled) return;

      setSourcePreview(parsed.ok
        ? {
            status: 'ready',
            diagnostic: [hostedDiagnostic, parsed.diagnostic].filter(Boolean).join(' '),
            tree: parsed.tree,
          }
        : {
            status: 'error',
            diagnostic: [hostedDiagnostic, parsed.diagnostic].filter(Boolean).join(' '),
            tree: null,
          });
    });

    return () => {
      cancelled = true;
    };
  }, [activeComponent?.id, activeComponent?.name, activeComponent?.sourceFile]);

  function selectPreviewNode(layerId: string, mode: SourceTreePreviewSelectionMode, _additive = false) {
    const resolution = resolvePreviewNodeSelection({
      clickedNodeId: layerId,
      drillPath: previewDrillPath,
      mode,
      root: sourcePreview.tree?.root ?? null,
    });
    setSelectedPreviewNodeId(resolution.selectedNodeId);
    setPreviewDrillPath(resolution.drillPath);
  }

  function drillIntoPreviewNode(layerId: string) {
    const root = sourcePreview.tree?.root ?? null;
    const resolution = resolvePreviewNodeDrillIn({
      clickedNodeId: layerId,
      drillPath: previewDrillPath,
      root,
    });
    if (!resolution.drillTargetNodeId) return;
    setSelectedPreviewNodeId(resolution.selectedNodeId);
    setPreviewDrillPath(resolution.drillPath);
  }

  function changeStoryArg(key: string, value: WorkbenchStoryArgValue) {
    if (!activeStory) return;
    setStoryArgsByComponentId((current) => ({
      ...current,
      [activeStory.componentId]: {
        ...(current[activeStory.componentId] ?? {}),
        [key]: value,
      },
    }));
  }

  function applyStoryArgs(args: WorkbenchStoryArgs) {
    if (!activeStory) return;
    setStoryArgsByComponentId((current) => ({
      ...current,
      [activeStory.componentId]: {
        ...activeStory.defaultArgs,
        ...args,
      },
    }));
  }

  const changeStoryPreviewTokenMode = useCallback((collectionId: string, modeId: string) => {
    setStoryPreviewTokenModes((current) => ({
      ...current,
      [collectionId]: modeId,
    }));
  }, []);

  const changeTypographyFoundationSettings = useCallback((nextSettings: TypographyFoundationSettings) => {
    setFoundationSettings((current) => ({
      ...current,
      typography: nextSettings,
    }));
  }, []);

  const changeColorFoundationSettings = useCallback((nextSettings: ColorFoundationSettings) => {
    setFoundationSettings((current) => ({
      ...current,
      colors: nextSettings,
    }));
  }, []);

  function selectComponent(componentId: string) {
    setActiveFoundationId(null);
    setActiveComponentId(componentId);
    onActiveTargetChange?.({ kind: 'component', id: componentId });
  }

  function selectFoundation(previewId: string) {
    setActiveFoundationId(previewId);
    setActiveComponentId(null);
    onActiveTargetChange?.({ kind: 'foundation', id: previewId });
  }

  async function savePropRegistryOverride(nextRegistry: WorkbenchPropRegistrySource) {
    const normalized = normalizeWorkbenchPropRegistry(nextRegistry);
    setPropRegistryStatus({ kind: 'saving', message: `Saving ${propRegistryPath}...` });
    try {
      await saveWorkbenchPropRegistry(propRegistryPath, normalized);
      setWorkbenchPropRegistryOverride(normalized);
      setPropRegistry(normalized);
      setPropRegistryRevision((revision) => revision + 1);
      setPropRegistryStatus({ kind: 'success', message: `Saved ${propRegistryPath}.` });
    } catch (error) {
      setPropRegistryStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : `Failed to save ${propRegistryPath}.`,
      });
    }
  }

  async function importLibraryFromFiles(files: File[]) {
    if (files.length === 0) return;
    setLibraryImportOpen(false);
    setRegistrationStatus({ kind: 'running', message: `Importing ${files.length} file${files.length === 1 ? '' : 's'}...` });
    const result = await onImportComponentLibrary(files);
    if (!result.ok) {
      setRegistrationStatus({ kind: 'error', message: result.message });
      return;
    }
    setActiveFoundationId(null);
    setRegistrationStatus({
      kind: 'success',
      message: [
        formatComponentLibraryImportCount(result),
        result.tokenCollectionCount ? `${result.tokenCollectionCount} token collection${result.tokenCollectionCount === 1 ? '' : 's'}` : null,
      ].filter(Boolean).join(' and ') + ' reconciled.',
    });
  }

  async function importLibraryFromPath(sourcePath: string) {
    const trimmedSourcePath = sourcePath.trim();
    if (!trimmedSourcePath) return;
    setLibraryImportOpen(false);
    setRegistrationStatus({ kind: 'running', message: `Importing ${trimmedSourcePath}...` });
    const result = await onImportComponentLibraryPath(trimmedSourcePath);
    if (!result.ok) {
      setRegistrationStatus({ kind: 'error', message: result.message });
      return;
    }
    setActiveFoundationId(null);
    setRegistrationStatus({
      kind: 'success',
      message: [
        formatComponentLibraryImportCount(result),
        result.tokenCollectionCount ? `${result.tokenCollectionCount} token collection${result.tokenCollectionCount === 1 ? '' : 's'}` : null,
      ].filter(Boolean).join(' and ') + ' reconciled.',
    });
  }

  async function relinkLibraryCss() {
    setRegistrationStatus({ kind: 'running', message: 'Linking library CSS...' });
    const result = await onRelinkLibraryCss();
    if (!result.ok) {
      setRegistrationStatus({ kind: 'error', message: result.message });
      return;
    }
    setRegistrationStatus({
      kind: 'success',
      message: result.changedCount > 0
        ? `Linked library CSS in ${result.changedCount} source file${result.changedCount === 1 ? '' : 's'}.`
        : 'Library CSS is already linked.',
    });
  }

  function formatComponentLibraryImportCount(result: Extract<ComponentLibraryImportResult, { ok: true }>): string {
    const hasDetailedCounts =
      typeof result.addedCount === 'number' ||
      typeof result.updatedCount === 'number' ||
      typeof result.unchangedCount === 'number';
    if (!hasDetailedCounts) {
      return `${result.count} component registration${result.count === 1 ? '' : 's'}`;
    }

    const parts = [
      result.addedCount ? `${result.addedCount} added` : null,
      result.updatedCount ? `${result.updatedCount} updated` : null,
      result.unchangedCount ? `${result.unchangedCount} unchanged` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '0 component registrations changed';
  }

  async function prepareCodexLibraryHandoff(action: CodexComponentLibraryHandoffAction, libraryName: string) {
    const normalizedLibraryName = libraryName.trim();
    if (!normalizedLibraryName) {
      setRegistrationStatus({ kind: 'error', message: 'Library name is required.' });
      return;
    }
    setLibraryImportOpen(false);
    setRegistrationStatus({ kind: 'idle', message: '' });
    setCodexLibraryRequestDraft({
      action,
      libraryName: normalizedLibraryName,
      prompt: createCodexLibraryRequestPrompt(action, normalizedLibraryName),
    });
  }

  return (
    <WorkbenchEditorFrame
      ariaLabel="Storybook"
      className="wb-storybook"
      inspectorWidth={inspectorWidth}
      layout="sidebar-surface-inspector"
      sidebarWidth={sidebarWidth}
    >
      <WorkbenchEditorSidebar
        ariaLabel="Storybook component list"
        className="wb-storybook-sidebar"
        navigation={surfaceNav}
      >
        <div className="wb-storybook-sidebar-top">
          <SearchField
            aria-label="Search components"
            className="wb-storybook-search"
            clearLabel="Clear component search"
            placeholder="Search components"
            value={search}
            onValueChange={setSearch}
          />
          {registrationStatus.kind !== 'idle' && registrationStatus.message ? (
            <div className={`wb-storybook-import-status wb-storybook-import-status--${registrationStatus.kind}`}>
              {registrationStatus.message}
            </div>
          ) : null}
        </div>
        <div className="wb-storybook-sidebar-results">
          <WorkbenchSidebarSectionHeader
            title="Foundations"
            density="compact"
            trailing={<WorkbenchSidebarMeta>{foundationPreviews.length}</WorkbenchSidebarMeta>}
          />
          <WorkbenchSidebarRowList className="wb-storybook-list wb-storybook-list--foundations" ariaLabel="Foundation previews" density="compact">
            {filteredFoundations.length === 0 ? (
              <div className="wb-storybook-empty">No matching foundations.</div>
            ) : filteredFoundations.map((preview) => (
              <WorkbenchSidebarRow
                key={preview.id}
                density="compact"
                leading={getFoundationPreviewIcon(preview)}
                label={preview.name}
                meta={<WorkbenchSidebarMeta>Preview</WorkbenchSidebarMeta>}
                selected={preview.id === activeFoundation?.id}
                onSelect={() => selectFoundation(preview.id)}
              />
            ))}
          </WorkbenchSidebarRowList>
          <WorkbenchSidebarSectionHeader
            title="Components"
            actionLabel="Add component"
            density="compact"
            onAction={() => setLibraryImportOpen(true)}
            trailing={<WorkbenchSidebarMeta>{items.length}</WorkbenchSidebarMeta>}
          />
          <WorkbenchSidebarRowList className="wb-storybook-list" ariaLabel="Storybook components" density="compact">
            {items.length === 0 ? (
              <div className="wb-storybook-empty">No imported components.</div>
            ) : filteredItems.length === 0 ? (
              <div className="wb-storybook-empty">No matching components.</div>
            ) : componentGroups.map((group) => (
              <div key={group.id} className="wb-storybook-component-set">
                <WorkbenchSidebarSectionHeader
                  density="compact"
                  title={group.label}
                  trailing={<WorkbenchSidebarMeta>{group.components.length}</WorkbenchSidebarMeta>}
                />
                {group.components.map((component) => (
                  <WorkbenchSidebarRow
                    key={component.id}
                    density="compact"
                    leading={<Component size={13} />}
                    label={component.name}
                    meta={<WorkbenchSidebarMeta>{formatStorybookComponentMeta(component, storyCountsByComponentId[component.id])}</WorkbenchSidebarMeta>}
                    selected={component.id === activeComponent?.id}
                    onSelect={() => selectComponent(component.id)}
                  />
                ))}
              </div>
            ))}
          </WorkbenchSidebarRowList>
        </div>
        <WorkbenchPanelFooter>
          <Button
            className="wb-icon-text-button"
            disabled={registrationStatus.kind === 'running'}
            tone="ghost"
            onClick={() => void relinkLibraryCss()}
          >
            <SlidersHorizontal size={13} />
            <span>Link CSS</span>
          </Button>
          <Button
            className="wb-icon-text-button"
            disabled={registrationStatus.kind === 'running'}
            tone="ghost"
            onClick={() => setLibraryImportOpen(true)}
          >
            <Component size={13} />
            <span>{registrationStatus.kind === 'running' ? 'Importing…' : 'Import…'}</span>
          </Button>
        </WorkbenchPanelFooter>
      </WorkbenchEditorSidebar>
      <WorkbenchResizeHandle
        label="Resize storybook sidebar"
        placement="sidebar"
        onPointerDown={startSidebarWidthResize}
      />
      <WorkbenchEditorSurface className="wb-storybook-surface" ariaLabel="Storybook canvas">
        <WorkbenchEditorToolbar
          title={activeFoundation?.name ?? activeComponent?.name ?? 'Storybook'}
          meta={activeFoundation?.description ?? (activeStory ? activeStory.description : activeComponent?.sourceFile ?? 'No preview selected')}
        />
        {activeFoundation ? (
          <div className="wb-storybook-workbench">
            <DesignPreviewControlBar
              canEditSourceFields={false}
              previewAppearance={previewAppearance}
              previewModeOpen={previewModeModalOpen}
              previewModeSummary={previewModeSummary}
              previewViewport={previewViewport}
              selectedSourceNode={null}
              onOpenPreviewModeModal={() => setPreviewModeModalOpen(true)}
              onPreviewAppearanceChange={setPreviewAppearance}
              onPreviewViewportChange={setPreviewViewport}
            />
            <section className="wb-storybook-canvas" aria-label={`${activeFoundation.name} preview`}>
              <DesignPreviewViewportFrame value={previewViewport} onChange={setPreviewViewport}>
                <FoundationRuntimeCanvas
                  assets={assets}
                  preview={activeFoundation}
                  previewTokenModes={reconciledStoryPreviewTokenModes}
                  settings={foundationSettings}
                  themeMode={storyThemeMode}
                  tokenRegistry={tokenRegistry}
                  tokenVariables={storyTokenVariables}
                />
              </DesignPreviewViewportFrame>
            </section>
            {previewModeModalOpen ? (
              <DesignPreviewTokenModeModal
                registry={tokenRegistry}
                value={reconciledStoryPreviewTokenModes}
                onChange={changeStoryPreviewTokenMode}
                onClose={() => setPreviewModeModalOpen(false)}
              />
            ) : null}
          </div>
        ) : activeComponent ? (
          <div className="wb-storybook-workbench">
            <DesignPreviewControlBar
              canEditSourceFields={false}
              previewAppearance={previewAppearance}
              previewModeOpen={previewModeModalOpen}
              previewModeSummary={previewModeSummary}
              previewViewport={previewViewport}
              selectedSourceNode={null}
              onOpenPreviewModeModal={() => setPreviewModeModalOpen(true)}
              onPreviewAppearanceChange={setPreviewAppearance}
              onPreviewViewportChange={setPreviewViewport}
            />
            <section className="wb-storybook-canvas" aria-label={`${activeComponent.name} preview`}>
              <DesignPreviewViewportFrame value={previewViewport} onChange={setPreviewViewport}>
                <StorybookRuntimeCanvas
                  args={activeStoryArgs}
                  assets={assets}
                  component={activeComponent}
                  preview={sourcePreview}
                  previewDrillPath={previewDrillPath}
                  previewTokenModes={reconciledStoryPreviewTokenModes}
                  runtimeModule={runtimeModule}
                  selectedPreviewNodeId={selectedPreviewNodeId}
                  story={activeStory}
                  tailwindCssMode={tailwindCssMode}
                  themeMode={storyThemeMode}
                  tokenRegistry={tokenRegistry}
                  tokenVariables={storyTokenVariables}
                  onDrillIntoLayer={drillIntoPreviewNode}
                  onSelectLayer={selectPreviewNode}
                />
              </DesignPreviewViewportFrame>
            </section>
            {previewModeModalOpen ? (
              <DesignPreviewTokenModeModal
                registry={tokenRegistry}
                value={reconciledStoryPreviewTokenModes}
                onChange={changeStoryPreviewTokenMode}
                onClose={() => setPreviewModeModalOpen(false)}
              />
            ) : null}
          </div>
        ) : (
          <div className="wb-storybook-empty wb-storybook-empty--surface">
            <span>No preview selected.</span>
            {registrationStatus.message ? <span>{registrationStatus.message}</span> : null}
          </div>
        )}
        {libraryImportOpen ? (
          <ComponentLibraryImportDialog
            busy={registrationStatus.kind === 'running'}
            onClose={() => setLibraryImportOpen(false)}
            onPrepareCodexRequest={(action, libraryName) => void prepareCodexLibraryHandoff(action, libraryName)}
            onImportFiles={(files) => void importLibraryFromFiles(files)}
            onImportPath={(sourcePath) => void importLibraryFromPath(sourcePath)}
            onRelinkLibraryCss={() => void relinkLibraryCss()}
            status={registrationStatus}
          />
        ) : null}
        {codexLibraryRequestDraft ? (
          <CodexLibraryRequestDraftDialog
            draft={codexLibraryRequestDraft}
            onClose={() => setCodexLibraryRequestDraft(null)}
          />
        ) : null}
      </WorkbenchEditorSurface>
      <WorkbenchResizeHandle
        label="Resize storybook inspector"
        placement="inspector"
        onPointerDown={startInspectorWidthResize}
      />
      <StorybookInspectorPanel
        args={activeStoryArgs}
        assets={assets}
        component={activeComponent}
        defaultArgs={activeStoryDefaultArgs}
        fallbackAxes={variantAxes}
        foundation={activeFoundation}
        foundationSettings={foundationSettings}
        panelTab={panelTab}
        preview={sourcePreview}
        propRegistry={propRegistry}
        propRegistryStatus={propRegistryStatus}
        story={activeStory}
        tokenRegistry={tokenRegistry}
        onApplyArgs={applyStoryArgs}
        onArgChange={changeStoryArg}
        onPanelTabChange={setPanelTab}
        onPropRegistrySave={(nextRegistry) => void savePropRegistryOverride(nextRegistry)}
        onColorFoundationSettingsChange={changeColorFoundationSettings}
        onTypographyFoundationSettingsChange={changeTypographyFoundationSettings}
      />
    </WorkbenchEditorFrame>
  );
}

function CodexLibraryRequestDraftDialog({
  draft,
  onClose,
}: {
  draft: CodexLibraryRequestDraft;
  onClose: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState('');

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(draft.prompt);
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Copy failed');
    }
  }

  return (
    <div className="wb-modal-backdrop" role="presentation">
      <div className="wb-modal wb-codex-library-request-modal" role="dialog" aria-label="Codex library request draft">
        <div className="wb-modal-header">
          <strong>Codex request draft</strong>
          <Button tone="ghost" onClick={onClose}>Close</Button>
        </div>
        <p className="wb-modal-copy">
          This draft is not saved to the project. Copy it into Codex only when you want Codex to install or normalize the library.
        </p>
        <div className="wb-codex-handoff-summary" aria-label="Codex request summary">
          <span>
            <strong>Action</strong>
            <code>{draft.action}</code>
          </span>
          <span>
            <strong>Library</strong>
            <code>{draft.libraryName}</code>
          </span>
        </div>
        <TextArea
          className="wb-codex-handoff-prompt"
          readOnly
          rows={10}
          value={draft.prompt}
          onFocus={(event) => event.currentTarget.select()}
        />
        <div className="wb-modal-actions">
          <span className="wb-codex-handoff-copy-status">{copyStatus}</span>
          <Button className="wb-icon-text-button" tone="primary" onClick={() => void copyPrompt()}>
            <Component size={13} />
            <span>Copy for Codex</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function createCodexLibraryRequestPrompt(
  action: CodexComponentLibraryHandoffAction,
  libraryName: string,
): string {
  const actionText = action === 'install-library'
    ? '설치하고 Workbench 컴포넌트 라이브러리에 등록'
    : 'Workbench 컴포넌트 라이브러리에 맞게 정규화';
  return [
    `${libraryName}를 ${actionText}해주세요.`,
    '',
    '조건:',
    '- 실제 TSX/CSS 소스 파일을 만들거나 수정해주세요.',
    '- .workbench/components.json에 source-backed component registry로 등록해주세요.',
    '- Storybook preview, controls, variants, docs가 실제 소스를 기준으로 동작하게 해주세요.',
    '- raw style 값은 가능한 토큰/컴포넌트 props로 치환해주세요.',
    '- 앱 내부 AI 기능이나 API 키 설정은 추가하지 마세요.',
    '- 완료 후 타입 체크, 빌드, 브라우저 프리뷰를 검증해주세요.',
  ].join('\n');
}

function ComponentLibraryImportDialog({
  busy,
  onClose,
  onImportFiles,
  onImportPath,
  onPrepareCodexRequest,
  onRelinkLibraryCss,
  status,
}: {
  busy: boolean;
  onClose: () => void;
  onImportFiles: (files: File[]) => void;
  onImportPath: (sourcePath: string) => void;
  onPrepareCodexRequest: (action: CodexComponentLibraryHandoffAction, libraryName: string) => void;
  onRelinkLibraryCss: () => void;
  status: StorybookRegistrationStatus;
}) {
  const [installLibraryName, setInstallLibraryName] = useState('shadcn/ui');
  const [localImportPath, setLocalImportPath] = useState('src/libraries/local/components');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="wb-modal-backdrop" role="presentation">
      <div className="wb-modal" role="dialog" aria-label="Import component library">
        <div className="wb-modal-header">
          <strong>Import component library</strong>
          <Button tone="ghost" onClick={onClose}>Close</Button>
        </div>
        {status.kind !== 'idle' && status.message ? (
          <div className={`wb-storybook-import-status wb-storybook-import-status--${status.kind}`}>
            {status.message}
          </div>
        ) : null}
        <div className="wb-storybook-library-import">
          <section className="wb-storybook-library-card" aria-label="Import from disk">
            <div className="wb-storybook-library-card-header">
              <span>
                <strong>Import from disk</strong>
                <small>Pick component source files (.tsx / .ts / .css / .json) or a whole library folder.</small>
              </span>
            </div>
            <div className="wb-storybook-library-card-actions">
              <Button
                className="wb-icon-text-button"
                disabled={busy}
                tone="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Component size={13} />
                <span>Select files…</span>
              </Button>
              <Button
                className="wb-icon-text-button"
                disabled={busy}
                tone="ghost"
                onClick={() => folderInputRef.current?.click()}
              >
                <SlidersHorizontal size={13} />
                <span>Select folder…</span>
              </Button>
            </div>
            <label className="wb-storybook-library-field">
              <span>Local path</span>
              <input
                aria-label="Component library path"
                type="text"
                value={localImportPath}
                onChange={(event) => setLocalImportPath(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && localImportPath.trim()) onImportPath(localImportPath);
                }}
              />
            </label>
            <div className="wb-storybook-library-card-actions">
              <Button
                className="wb-icon-text-button"
                disabled={busy || localImportPath.trim().length === 0}
                tone="ghost"
                onClick={() => onImportPath(localImportPath)}
              >
                <Component size={13} />
                <span>Reconcile path</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".tsx,.ts,.jsx,.js,.css,.json"
              style={{ display: 'none' }}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) onImportFiles(files);
                event.target.value = '';
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
              style={{ display: 'none' }}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) onImportFiles(files);
                event.target.value = '';
              }}
            />
          </section>
          <section className="wb-storybook-library-card" aria-label="Link library CSS">
            <div className="wb-storybook-library-card-header">
              <span>
                <strong>Link library CSS</strong>
                <small>Connect existing source imports to the library entrypoint so CSS loads once.</small>
              </span>
            </div>
            <div className="wb-storybook-library-card-actions">
              <Button
                className="wb-icon-text-button"
                disabled={busy}
                tone="ghost"
                onClick={onRelinkLibraryCss}
              >
                <SlidersHorizontal size={13} />
                <span>Link CSS</span>
              </Button>
            </div>
          </section>
          <section className="wb-storybook-library-card" aria-label="Install with Codex">
            <div className="wb-storybook-library-card-header">
              <span>
                <strong>Install with Codex</strong>
                <small>Create a source-backed library registration request.</small>
              </span>
            </div>
            <label className="wb-storybook-library-field">
              <span>Library</span>
              <input
                type="text"
                value={installLibraryName}
                onChange={(event) => setInstallLibraryName(event.target.value)}
              />
            </label>
            <div className="wb-storybook-library-card-actions">
              <Button
                className="wb-icon-text-button"
                disabled={busy || installLibraryName.trim().length === 0}
                tone="primary"
                onClick={() => onPrepareCodexRequest('install-library', installLibraryName)}
              >
                <Component size={13} />
                <span>Prepare Codex request</span>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StorybookRuntimeCanvas({
  args,
  assets,
  component,
  onDrillIntoLayer,
  onSelectLayer,
  preview,
  previewDrillPath,
  previewTokenModes,
  runtimeModule,
  selectedPreviewNodeId,
  story,
  tailwindCssMode,
  themeMode,
  tokenRegistry,
  tokenVariables,
}: {
  args: WorkbenchStoryArgs;
  assets?: WorkbenchAssetRegistry;
  component: LibraryComponent;
  onDrillIntoLayer: (layerId: string) => void;
  onSelectLayer: (layerId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  preview: StorybookSourcePreviewState;
  previewDrillPath: string[];
  previewTokenModes: PreviewTokenModeSelection;
  runtimeModule: StorybookRuntimeModuleState;
  selectedPreviewNodeId: string | null;
  story: WorkbenchStory | null;
  tailwindCssMode: SourceTreePreviewTailwindCssMode;
  themeMode?: 'dark' | 'light';
  tokenRegistry: TokenRegistry;
  tokenVariables: CSSProperties;
}) {
  if (runtimeModule.status === 'ready') {
    const runtimeArgs = story ? args : { children: component.name };
    const previewKey = story ? story.componentId : component.id;
    return (
      <StorybookPreviewFrame
        assets={assets}
        className="wb-storybook-runtime-preview"
        title={`${story?.name ?? component.name} runtime preview`}
        tailwindCssMode={tailwindCssMode}
        themeMode={themeMode}
        tokenVariables={tokenVariables}
      >
        <div className={`wb-storybook-runtime-stage ${getLibraryScopeClassName()}`}>
          <StorybookRuntimeErrorBoundary key={previewKey} label={story?.name ?? component.name}>
            <StorybookRuntimePreview
              args={runtimeArgs}
              Component={runtimeModule.component}
              story={story}
            />
          </StorybookRuntimeErrorBoundary>
        </div>
      </StorybookPreviewFrame>
    );
  }

  if (runtimeModule.status === 'loading') {
    return (
      <div className="wb-storybook-empty-state">
        <strong>Loading runtime preview</strong>
        <p>{runtimeModule.diagnostic}</p>
      </div>
    );
  }

  return (
    <div className="wb-storybook-empty-state">
      <strong>Runtime preview unavailable</strong>
      <p>{runtimeModule.diagnostic}</p>
    </div>
  );
}

type StorybookRuntimeErrorBoundaryProps = {
  children: ReactNode;
  label: string;
};

type StorybookRuntimeErrorBoundaryState = {
  error: Error | null;
};

class StorybookRuntimeErrorBoundary extends ReactComponent<
  StorybookRuntimeErrorBoundaryProps,
  StorybookRuntimeErrorBoundaryState
> {
  state: StorybookRuntimeErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): StorybookRuntimeErrorBoundaryState {
    return { error: normalizeStorybookRuntimeError(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Storybook runtime preview failed', error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <span className="wb-source-visual-runtime-diagnostic" role="alert">
          <span className="wb-source-visual-runtime-diagnostic-title">Runtime preview failed</span>
          <span className="wb-source-visual-runtime-diagnostic-meta">{this.props.label}</span>
          <span className="wb-source-visual-runtime-diagnostic-detail">{error.message}</span>
        </span>
      );
    }

    return this.props.children;
  }
}

function normalizeStorybookRuntimeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'Unknown runtime preview error');
}

// Story `render` functions are allowed (per Storybook CSF conventions) to call
// React hooks at their top level. Calling that render inline from the canvas
// would attribute those hooks to the canvas component, mutating its hook order
// when the user switches between stories with different hook usage. Wrapping
// in this thin component gives every story its own hook context; the caller
// keys it by component / story id so switching remounts cleanly.
function StorybookRuntimePreview({
  args,
  Component,
  story,
}: {
  args: WorkbenchStoryArgs;
  Component: React.ComponentType<WorkbenchStoryArgs>;
  story: WorkbenchStory | null;
}) {
  return <>{story ? story.render(args) : createElement(Component, args)}</>;
}


function FoundationRuntimeCanvas({
  assets,
  preview,
  previewTokenModes,
  settings,
  themeMode,
  tokenRegistry,
  tokenVariables,
}: {
  assets?: WorkbenchAssetRegistry;
  preview: WorkbenchFoundationPreview;
  previewTokenModes: PreviewTokenModeSelection;
  settings: WorkbenchFoundationPreviewSettings;
  themeMode?: 'dark' | 'light';
  tokenRegistry: TokenRegistry;
  tokenVariables: CSSProperties;
}) {
  return (
    <StorybookPreviewFrame
      assets={assets}
      className="wb-storybook-runtime-preview wb-storybook-runtime-preview--foundation"
      title={`${preview.name} foundation preview`}
      themeMode={themeMode}
      tokenVariables={tokenVariables}
    >
      {preview.render({ previewTokenModes, settings, tokenRegistry })}
    </StorybookPreviewFrame>
  );
}

function StorybookPreviewFrame({
  assets,
  children,
  className,
  tailwindCssMode = 'disabled',
  themeMode,
  title,
  tokenVariables,
}: {
  assets?: WorkbenchAssetRegistry;
  children: ReactNode;
  className: string;
  tailwindCssMode?: SourceTreePreviewTailwindCssMode;
  themeMode?: 'dark' | 'light';
  title: string;
  tokenVariables: CSSProperties;
}) {
  setWorkbenchPreviewIconSourceMap(getWorkbenchDefaultIconSourceMap(assets));
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  // Mirror the font-asset wiring SourceTreePreview does so that storybook
  // component previews respect the project's body/heading/mono font slots.
  // Without this, the iframe falls back to the workbench-default Inter
  // stack and changing the project body font has no visible effect.
  const fontCssText = useMemo(
    () => getWorkbenchDefaultFontCssText(assets, `.${className.split(' ')[0]}`),
    [assets, className],
  );
  const previewPortalRoot = previewDocument?.querySelector<HTMLElement>(
    '[data-workbench-portal-root="true"]',
  ) ?? null;
  const previewStage = previewDocument?.getElementById('wb-source-preview-stage') ?? null;

  useLayoutEffect(() => {
    if (!previewDocument) return undefined;
    const syncPreviewHead = () => syncSourceTreePreviewFrameHead(
      previewDocument,
      themeMode,
      '',
      '',
      tailwindCssMode,
    );
    syncPreviewHead();
    const observer = new MutationObserver(syncPreviewHead);
    observer.observe(document.head, { attributes: true, characterData: true, childList: true, subtree: true });
    observer.observe(document.documentElement, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    observer.observe(document.body, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    return () => observer.disconnect();
  }, [previewDocument, tailwindCssMode, themeMode]);

  useLayoutEffect(() => {
    if (!previewDocument) return;
    syncSourceTreePreviewFrameTokenVariables(previewDocument, tokenVariables);
  }, [previewDocument, tokenVariables]);

  return (
    <>
      <iframe
        className="wb-storybook-runtime-preview-frame"
        title={title}
        srcDoc={SOURCE_TREE_PREVIEW_FRAME_HTML}
        onLoad={(event) => setPreviewDocument(event.currentTarget.contentDocument)}
      />
      {previewDocument?.body
        ? createPortal(
          <WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>
            <div
              className={className}
              data-theme={themeMode}
              data-workbench-preview-root="true"
              style={tokenVariables}
            >
              {fontCssText ? <style>{fontCssText}</style> : null}
              {children}
            </div>
          </WorkbenchPortalScopeContext.Provider>,
          previewStage
            ?? previewDocument.getElementById('wb-source-preview-root')
            ?? previewDocument.body,
        )
        : null}
    </>
  );
}

function StorybookInspectorPanel({
  args,
  assets,
  component,
  defaultArgs,
  fallbackAxes,
  foundation,
  foundationSettings,
  onApplyArgs,
  onArgChange,
  onColorFoundationSettingsChange,
  onPanelTabChange,
  onPropRegistrySave,
  onTypographyFoundationSettingsChange,
  panelTab,
  preview,
  propRegistry,
  propRegistryStatus,
  story,
  tokenRegistry,
}: {
  args: WorkbenchStoryArgs;
  assets?: WorkbenchAssetRegistry;
  component: LibraryComponent | null;
  defaultArgs: WorkbenchStoryArgs;
  fallbackAxes: Array<{ name: string; values: string[] }>;
  foundation: WorkbenchFoundationPreview | null;
  foundationSettings: WorkbenchFoundationPreviewSettings;
  onApplyArgs: (args: WorkbenchStoryArgs) => void;
  onArgChange: (key: string, value: WorkbenchStoryArgValue) => void;
  onColorFoundationSettingsChange: (settings: ColorFoundationSettings) => void;
  onPanelTabChange: (tab: StorybookPanelTab) => void;
  onPropRegistrySave: (registry: WorkbenchPropRegistrySource) => void;
  onTypographyFoundationSettingsChange: (settings: TypographyFoundationSettings) => void;
  panelTab: StorybookPanelTab;
  preview: StorybookSourcePreviewState;
  propRegistry: WorkbenchPropRegistrySource;
  propRegistryStatus: StorybookPropRegistryStatus;
  story: WorkbenchStory | null;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <WorkbenchEditorPanel
      ariaLabel="Storybook inspector"
      className="wb-design-inspector wb-storybook-inspector"
      variant="inspector"
    >
      <WorkbenchEditorPanelHeader title="Inspector" />
      {foundation ? (
        <div className="wb-storybook-tabs wb-storybook-inspector-tabs" role="tablist" aria-label="Foundation inspector panels">
          <button type="button" role="tab" aria-selected className="wb-storybook-tab wb-storybook-tab--active">
            Preview
          </button>
        </div>
      ) : (
        <div className="wb-storybook-tabs wb-storybook-inspector-tabs" role="tablist" aria-label="Storybook inspector panels">
          {(['controls', 'variants', 'docs'] as StorybookPanelTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={panelTab === tab}
              className={panelTab === tab ? 'wb-storybook-tab wb-storybook-tab--active' : 'wb-storybook-tab'}
              onClick={() => onPanelTabChange(tab)}
            >
              {formatPanelTab(tab)}
            </button>
          ))}
        </div>
      )}
      <WorkbenchEditorPanelBody className="wb-design-inspector-body wb-storybook-inspector-body" ariaLabel="Storybook inspector fields">
        {foundation ? (
          <FoundationInspectorPanel
            foundation={foundation}
            settings={foundationSettings}
            tokenRegistry={tokenRegistry}
            onColorSettingsChange={onColorFoundationSettingsChange}
            onTypographySettingsChange={onTypographyFoundationSettingsChange}
          />
        ) : component ? (
          <>
            {panelTab === 'controls' ? (
              <ControlsPanel
                args={args}
                assets={assets}
                componentKey={getPropRegistryComponentKey(component)}
                defaultArgs={defaultArgs}
                story={story}
                onArgChange={onArgChange}
              />
            ) : null}
            {panelTab === 'variants' ? (
              <VariantsPanel
                component={component}
                fallbackAxes={fallbackAxes}
                story={story}
                onApplyArgs={onApplyArgs}
              />
            ) : null}
            {panelTab === 'docs' ? (
              <DocsPanel component={component} preview={preview} story={story} />
            ) : null}
          </>
        ) : (
          <div className="wb-storybook-empty">No preview selected.</div>
        )}
      </WorkbenchEditorPanelBody>
    </WorkbenchEditorPanel>
  );
}

function FoundationInspectorPanel({
  foundation,
  onColorSettingsChange,
  onTypographySettingsChange,
  settings,
  tokenRegistry,
}: {
  foundation: WorkbenchFoundationPreview;
  onColorSettingsChange: (settings: ColorFoundationSettings) => void;
  onTypographySettingsChange: (settings: TypographyFoundationSettings) => void;
  settings: WorkbenchFoundationPreviewSettings;
  tokenRegistry: TokenRegistry;
}) {
  return (
    <div className="wb-storybook-docs">
      <div className="wb-storybook-docs-summary">
        <strong>{foundation.name}</strong>
        <span>{foundation.description}</span>
      </div>
      {foundation.id === 'colors' ? (
        <ColorFoundationControls
          settings={settings.colors}
          tokenRegistry={tokenRegistry}
          onChange={onColorSettingsChange}
        />
      ) : null}
      {foundation.id === 'typography' ? (
        <TypographyFoundationControls
          settings={settings.typography}
          tokenRegistry={tokenRegistry}
          onChange={onTypographySettingsChange}
        />
      ) : null}
    </div>
  );
}

function ColorFoundationControls({
  onChange,
  settings,
  tokenRegistry,
}: {
  onChange: (settings: ColorFoundationSettings) => void;
  settings: ColorFoundationSettings | undefined;
  tokenRegistry: TokenRegistry;
}) {
  const options = getFoundationCollectionOptions(tokenRegistry);
  const resolvedSettings = getResolvedColorFoundationSettings(tokenRegistry, settings);

  if (options.length === 0) {
    return <div className="wb-storybook-empty">No token collections available.</div>;
  }

  return (
    <div className="wb-foundation-inspector-controls" aria-label="Color foundation token collection">
      <label className="wb-foundation-inspector-field">
        <span>Token collection</span>
        <SelectControl<string>
          aria-label="Color token collection"
          value={resolvedSettings.collectionId}
          onValueChange={(collectionId) => onChange({ collectionId })}
        >
          {renderFoundationCollectionOptions(options)}
        </SelectControl>
      </label>
    </div>
  );
}

function renderFoundationCollectionOptions(options: WorkbenchFoundationCollectionOption[]) {
  return options.map((option) => (
    <option key={option.id} value={option.id}>
      {option.label} ({option.tokenCount})
    </option>
  ));
}

function TypographyFoundationControls({
  onChange,
  settings,
  tokenRegistry,
}: {
  onChange: (settings: TypographyFoundationSettings) => void;
  settings: TypographyFoundationSettings | undefined;
  tokenRegistry: TokenRegistry;
}) {
  const options = getFoundationTokenSourceOptions(tokenRegistry);
  const resolvedSettings = getResolvedTypographyFoundationSettings(tokenRegistry, settings);

  if (options.length === 0) {
    return <div className="wb-storybook-empty">No token groups available.</div>;
  }

  return (
    <div className="wb-foundation-inspector-controls" aria-label="Typography foundation token groups">
      <label className="wb-foundation-inspector-field">
        <span>Size token group</span>
        <SelectControl<string>
          aria-label="Typography size token group"
          value={resolvedSettings.sizeSourceId}
          onValueChange={(sizeSourceId) => onChange({ ...resolvedSettings, sizeSourceId })}
        >
          {renderFoundationTokenSourceOptions(options)}
        </SelectControl>
      </label>
      <label className="wb-foundation-inspector-field">
        <span>Weight token group</span>
        <SelectControl<string>
          aria-label="Typography weight token group"
          value={resolvedSettings.weightSourceId}
          onValueChange={(weightSourceId) => onChange({ ...resolvedSettings, weightSourceId })}
        >
          {renderFoundationTokenSourceOptions(options)}
        </SelectControl>
      </label>
    </div>
  );
}

function renderFoundationTokenSourceOptions(options: WorkbenchFoundationTokenSourceOption[]) {
  const groups = new Map<string, WorkbenchFoundationTokenSourceOption[]>();
  options.forEach((option) => {
    groups.set(option.collectionId, [...(groups.get(option.collectionId) ?? []), option]);
  });

  return [...groups.entries()].map(([collectionId, collectionOptions]) => (
    <optgroup key={collectionId} label={collectionOptions[0]?.collectionName ?? collectionId}>
      {collectionOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.groupName} ({option.tokenCount})
        </option>
      ))}
    </optgroup>
  ));
}

function ControlsPanel({
  args,
  assets,
  componentKey,
  defaultArgs,
  onArgChange,
  story,
}: {
  args: WorkbenchStoryArgs;
  assets?: WorkbenchAssetRegistry;
  componentKey?: string;
  defaultArgs: WorkbenchStoryArgs;
  onArgChange: (key: string, value: WorkbenchStoryArgValue) => void;
  story: WorkbenchStory | null;
}) {
  if (!story) return <div className="wb-storybook-empty">No source component props.</div>;

  const storyControlNode: EditableTreeNode = {
    id: story.componentId,
    inspectable: true,
    kind: 'component-instance',
    label: story.name,
    sourceProps: args,
  };

  return (
    <InspectorComponentPropsSection
      assetRegistry={assets}
      canEditSourceFields
      componentKey={componentKey}
      controls={story.controls}
      defaultArgs={defaultArgs}
      selectedSourceNode={storyControlNode}
      sourceDocumentRoot={storyControlNode}
      onSourceComponentPropChange={(key, value) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') onArgChange(key, value);
        else onArgChange(key, '');
      }}
      onSourceComponentPropsChange={(updates) => {
        for (const update of updates) {
          const value = update.value;
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') onArgChange(update.propName, value);
          else onArgChange(update.propName, '');
        }
      }}
      onSourceComponentTypeChange={() => undefined}
      onSourceNodeComponentPropChange={() => undefined}
    />
  );
}

type PropRegistryDraftRow = {
  assetKinds: string;
  groupId: string;
  groupLabel: string;
  groupOrder: string;
  key: string;
  label: string;
  order: string;
  picker: WorkbenchStoryControlPicker;
  tokenTypes: string;
};

const PROP_REGISTRY_PICKER_OPTIONS: WorkbenchStoryControlPicker[] = ['auto', 'none', 'token', 'asset', 'asset-token'];

function PropRegistryPanel({
  component,
  onSave,
  registry,
  status,
  story,
}: {
  component: LibraryComponent;
  onSave: (registry: WorkbenchPropRegistrySource) => void;
  registry: WorkbenchPropRegistrySource;
  status: StorybookPropRegistryStatus;
  story: WorkbenchStory | null;
}) {
  const componentKey = getPropRegistryComponentKey(component);
  const [draftRows, setDraftRows] = useState<PropRegistryDraftRow[]>(() => (
    getPropRegistryDraftRows(story, registry, componentKey)
  ));
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setDraftRows(getPropRegistryDraftRows(story, registry, componentKey));
  }, [componentKey, registry, story]);

  if (!story) return <div className="wb-storybook-empty">No source component props.</div>;

  const filteredRows = draftRows.filter((row) => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return true;
    return `${row.key} ${row.label} ${row.groupId} ${row.groupLabel}`.toLowerCase().includes(query);
  });
  const saving = status.kind === 'saving' || status.kind === 'loading';

  function updateRow(key: string, patch: Partial<PropRegistryDraftRow>) {
    setDraftRows((current) => current.map((row) => (
      row.key === key ? { ...row, ...patch } : row
    )));
  }

  function saveDraft() {
    onSave(buildPropRegistryFromDraftRows(registry, componentKey, draftRows));
  }

  return (
    <div className="wb-prop-registry-editor">
      <div className="wb-storybook-docs-summary">
        <strong>{component.name} prop registry</strong>
        <span>{componentKey} overrides are saved to the project registry and layered over the built-in defaults.</span>
      </div>
      <div className="wb-prop-registry-toolbar">
        <SearchField
          aria-label="Search registry props"
          className="wb-prop-registry-search"
          placeholder="Search props"
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <Button tone="primary" disabled={saving} onClick={saveDraft}>
          Save
        </Button>
      </div>
      {status.message ? (
        <div className={`wb-prop-registry-status wb-prop-registry-status--${status.kind}`}>
          {status.message}
        </div>
      ) : null}
      <div className="wb-prop-registry-list" aria-label="Prop registry rows">
        {filteredRows.map((row) => (
          <div key={row.key} className="wb-prop-registry-row">
            <div className="wb-prop-registry-row-head">
              <strong>{row.key}</strong>
              <span>{getControlTypeLabel(story.controls.find((control) => control.key === row.key))}</span>
            </div>
            <label className="wb-prop-registry-field wb-prop-registry-field--label">
              <span>Prop name</span>
              <TextField
                aria-label={`${row.key} registry prop name`}
                value={row.label}
                onValueChange={(label) => updateRow(row.key, { label })}
              />
            </label>
            <label className="wb-prop-registry-field wb-prop-registry-field--order">
              <span>Order</span>
              <TextField
                aria-label={`${row.key} registry order`}
                inputMode="numeric"
                value={row.order}
                onValueChange={(order) => updateRow(row.key, { order })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Picker</span>
              <SelectControl<WorkbenchStoryControlPicker>
                aria-label={`${row.key} registry picker`}
                value={row.picker}
                onValueChange={(picker) => updateRow(row.key, { picker })}
              >
                {PROP_REGISTRY_PICKER_OPTIONS.map((picker) => (
                  <option key={picker} value={picker}>{picker}</option>
                ))}
              </SelectControl>
            </label>
            <label className="wb-prop-registry-field">
              <span>Group</span>
              <TextField
                aria-label={`${row.key} registry group`}
                value={row.groupId}
                onValueChange={(groupId) => updateRow(row.key, { groupId })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Group label</span>
              <TextField
                aria-label={`${row.key} registry group label`}
                value={row.groupLabel}
                onValueChange={(groupLabel) => updateRow(row.key, { groupLabel })}
              />
            </label>
            <label className="wb-prop-registry-field wb-prop-registry-field--order">
              <span>Group order</span>
              <TextField
                aria-label={`${row.key} registry group order`}
                inputMode="numeric"
                value={row.groupOrder}
                onValueChange={(groupOrder) => updateRow(row.key, { groupOrder })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Token types</span>
              <TextField
                aria-label={`${row.key} registry token types`}
                value={row.tokenTypes}
                onValueChange={(tokenTypes) => updateRow(row.key, { tokenTypes })}
              />
            </label>
            <label className="wb-prop-registry-field">
              <span>Asset kinds</span>
              <TextField
                aria-label={`${row.key} registry asset kinds`}
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

function getPropRegistryDraftRows(
  story: WorkbenchStory | null,
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
): PropRegistryDraftRow[] {
  if (!story) return [];
  const componentConfig = getPropRegistryComponentConfig(registry, componentKey);
  const componentGroups = isRecord(componentConfig.groups) ? componentConfig.groups : {};
  return story.controls.map((control) => {
    const propConfig = getPropRegistryPropConfig(componentConfig, control.key);
    const groupId = getTrimmedString(propConfig?.group) ?? control.groupId ?? 'other';
    const groupConfig = getPropRegistryGroupConfig(componentGroups, groupId);
    return {
      assetKinds: formatRegistryCsv(propConfig?.assetKinds ?? control.assetKinds),
      groupId,
      groupLabel: getTrimmedString(propConfig?.groupLabel) ??
        getTrimmedString(groupConfig?.label) ??
        control.groupLabel ??
        formatPropRegistryGroupLabel(groupId),
      groupOrder: formatRegistryNumber(propConfig?.groupOrder ?? groupConfig?.order ?? control.groupOrder),
      key: control.key,
      label: getTrimmedString(propConfig?.label) ?? control.label,
      order: formatRegistryNumber(propConfig?.order ?? control.order),
      picker: normalizePropRegistryPicker(propConfig?.picker ?? control.picker),
      tokenTypes: formatRegistryCsv(propConfig?.tokenTypes ?? control.tokenTypes),
    };
  });
}

function buildPropRegistryFromDraftRows(
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
  rows: PropRegistryDraftRow[],
): WorkbenchPropRegistrySource {
  const nextRegistry = clonePropRegistry(registry);
  const components = isRecord(nextRegistry.components) ? { ...nextRegistry.components } : {};
  const previousComponentConfig = getPropRegistryComponentConfig(nextRegistry, componentKey);
  const componentGroups = isRecord(previousComponentConfig.groups) ? { ...previousComponentConfig.groups } : {};
  const props = isRecord(previousComponentConfig.props) ? { ...previousComponentConfig.props } : {};

  for (const row of rows) {
    const groupId = row.groupId.trim() || 'other';
    const groupOrder = parseRegistryNumber(row.groupOrder);
    componentGroups[groupId] = {
      ...(isRecord(componentGroups[groupId]) ? componentGroups[groupId] : {}),
      label: row.groupLabel.trim() || formatPropRegistryGroupLabel(groupId),
      ...(groupOrder !== null ? { order: groupOrder } : {}),
    };

    const order = parseRegistryNumber(row.order);
    const tokenTypes = parseRegistryCsv(row.tokenTypes);
    const assetKinds = parseRegistryCsv(row.assetKinds);
    const previousPropConfig = props[row.key];
    props[row.key] = {
      ...(isRecord(previousPropConfig) ? previousPropConfig : {}),
      group: groupId,
      label: row.label.trim() || row.key,
      ...(order !== null ? { order } : {}),
      picker: row.picker,
      ...(tokenTypes.length > 0 ? { tokenTypes } : {}),
      ...(assetKinds.length > 0 ? { assetKinds } : {}),
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

function getPropRegistryComponentKey(component: LibraryComponent): string {
  return getStringExtension(component.extensions, 'sourceExportName') ??
    getStringExtension(component.extensions, 'importName') ??
    component.name;
}

function getPropRegistryComponentConfig(
  registry: WorkbenchPropRegistrySource,
  componentKey: string,
): WorkbenchPropRegistryComponentConfig {
  const components = isRecord(registry.components) ? registry.components : {};
  for (const [key, value] of Object.entries(components)) {
    if (normalizePropRegistryKey(key) === normalizePropRegistryKey(componentKey) && isRecord(value)) {
      return value;
    }
  }
  return {};
}

function getPropRegistryPropConfig(
  componentConfig: WorkbenchPropRegistryComponentConfig,
  propKey: string,
): WorkbenchPropRegistryPropConfig | null {
  const props = isRecord(componentConfig.props) ? componentConfig.props : {};
  for (const [key, value] of Object.entries(props)) {
    if (normalizePropRegistryKey(key) === normalizePropRegistryKey(propKey) && isRecord(value)) {
      return value;
    }
  }
  return null;
}

function getPropRegistryGroupConfig(groups: Record<string, unknown>, groupId: string): WorkbenchPropRegistryGroupConfig | null {
  for (const [key, value] of Object.entries(groups)) {
    if (normalizePropRegistryKey(key) === normalizePropRegistryKey(groupId) && isRecord(value)) {
      return value;
    }
  }
  return null;
}

function clonePropRegistry(registry: WorkbenchPropRegistrySource): WorkbenchPropRegistrySource {
  return normalizeWorkbenchPropRegistry(JSON.parse(JSON.stringify(registry)));
}

function normalizePropRegistryPicker(value: unknown): WorkbenchStoryControlPicker {
  return value === 'asset' || value === 'asset-token' || value === 'none' || value === 'token'
    ? value
    : 'auto';
}

function formatRegistryCsv(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').join(', ')
    : '';
}

function parseRegistryCsv(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function formatRegistryNumber(value: unknown): string {
  const number = getFiniteNumber(value);
  return number === null ? '' : String(number);
}

function parseRegistryNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePropRegistryKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function formatPropRegistryGroupLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Other';
}

function getControlTypeLabel(control: WorkbenchStoryControl | undefined): string {
  if (!control) return 'prop';
  if (control.type === 'select') return 'select';
  if (control.type === 'boolean') return 'boolean';
  if (control.type === 'icon') return 'icon';
  if (control.type === 'number') return 'number';
  return 'text';
}

function VariantsPanel({
  component,
  fallbackAxes,
  onApplyArgs,
  story,
}: {
  component: LibraryComponent;
  fallbackAxes: Array<{ name: string; values: string[] }>;
  onApplyArgs: (args: WorkbenchStoryArgs) => void;
  story: WorkbenchStory | null;
}) {
  if (!story) return <VariantsTable component={component} axes={fallbackAxes} />;
  if (component.variants.length > 0) {
    return (
      <div className="wb-storybook-variant-grid" aria-label="Variants">
        {component.variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className="wb-storybook-variant-card"
            onClick={() => onApplyArgs(normalizeRegistryVariantArgs(variant.axes, story))}
          >
            <strong>{variant.state}</strong>
            <span>{formatArgs(normalizeRegistryVariantArgs(variant.axes, story))}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="wb-storybook-variant-grid" aria-label="Variants">
      {story.variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          className="wb-storybook-variant-card"
          onClick={() => onApplyArgs(variant.args)}
        >
          <strong>{variant.name}</strong>
          <span>{formatArgs(variant.args)}</span>
        </button>
      ))}
    </div>
  );
}

function DocsPanel({
  component,
  preview,
  story,
}: {
  component: LibraryComponent;
  preview: StorybookSourcePreviewState;
  story: WorkbenchStory | null;
}) {
  return (
    <div className="wb-storybook-docs">
      <div className="wb-storybook-docs-summary">
        <strong>{component.name}</strong>
        <span>{story?.description ?? 'Source-backed component entry.'}</span>
      </div>
      <div className="wb-storybook-table" role="table" aria-label="Docs">
        <div role="row" className="wb-storybook-table-head">
          <span role="columnheader">Item</span>
          <span role="columnheader">Value</span>
          <span role="columnheader">Notes</span>
        </div>
        <div role="row" className="wb-storybook-table-row">
          <span role="cell">Source</span>
          <span role="cell">{component.sourceFile}</span>
          <span role="cell">real TSX</span>
        </div>
        <div role="row" className="wb-storybook-table-row">
          <span role="cell">Story runtime</span>
          <span role="cell">{story ? 'available' : 'source preview fallback'}</span>
          <span role="cell">{story ? 'render(args)' : 'AST projection'}</span>
        </div>
        <div role="row" className="wb-storybook-table-row">
          <span role="cell">Token contract</span>
          <span role="cell">CSS vars + data-wb bindings</span>
          <span role="cell">colors, spacing, radius, typography</span>
        </div>
        <div role="row" className="wb-storybook-table-row">
          <span role="cell">Source parse</span>
          <span role="cell">{formatSourcePreviewStatus(preview.status)}</span>
          <span role="cell">{preview.diagnostic}</span>
        </div>
      </div>
    </div>
  );
}

function VariantsTable({
  axes,
  component,
}: {
  axes: Array<{ name: string; values: string[] }>;
  component: LibraryComponent;
}) {
  if (component.variants.length === 0) return <div className="wb-storybook-empty">No variants.</div>;
  return (
    <div className="wb-storybook-table" role="table" aria-label="Variants">
      <div role="row" className="wb-storybook-table-head">
        <span role="columnheader">Variant</span>
        <span role="columnheader">Axes</span>
        <span role="columnheader">State</span>
      </div>
      {component.variants.map((variant) => (
        <div key={variant.id} role="row" className="wb-storybook-table-row">
          <span role="cell">{variant.id}</span>
          <span role="cell">{formatVariantAxes(variant.axes, axes)}</span>
          <span role="cell">{variant.state || 'default'}</span>
        </div>
      ))}
    </div>
  );
}

function filterStorybookComponents(items: LibraryComponent[], search: string): LibraryComponent[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter((component) => {
    const variantText = component.variants
      .flatMap((variant) => [variant.id, variant.state, ...Object.entries(variant.axes).flatMap(([axis, value]) => [axis, value])])
      .join(' ');
    return [
      component.name,
      component.id,
      component.sourceFile,
      component.componentSetId,
      formatWorkbenchComponentGroupLabel(getWorkbenchComponentGroupId(component)),
      variantText,
    ].filter(Boolean).join(' ').toLowerCase().includes(query);
  });
}

function getStorybookLibraryComponents(items: LibraryComponent[]): LibraryComponent[] {
  return items.filter((component) => component.extensions?.hiddenFromInsert !== true);
}

function filterFoundationPreviews(items: WorkbenchFoundationPreview[], search: string): WorkbenchFoundationPreview[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter((preview) => [
    preview.name,
    preview.id,
    preview.description,
  ].join(' ').toLowerCase().includes(query));
}

function groupStorybookComponents(items: LibraryComponent[]): Array<{ components: LibraryComponent[]; id: string; label: string }> {
  const groups = new Map<string, LibraryComponent[]>();
  for (const component of items) {
    const groupId = getWorkbenchComponentGroupId(component);
    groups.set(groupId, [...(groups.get(groupId) ?? []), component]);
  }

  return [...groups.entries()]
    .map(([id, components]) => ({
      id,
      label: formatWorkbenchComponentGroupLabel(id),
      components: [...components].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => compareWorkbenchComponentGroupIds(left.id, right.id));
}

function getComponentVariantAxes(component: LibraryComponent | null): Array<{ name: string; values: string[] }> {
  if (!component) return [];
  const axisValues = new Map<string, Set<string>>();
  component.variants.forEach((variant) => {
    Object.entries(variant.axes).forEach(([axis, value]) => {
      const values = axisValues.get(axis) ?? new Set<string>();
      values.add(value);
      axisValues.set(axis, values);
    });
  });
  return [...axisValues.entries()].map(([name, values]) => ({ name, values: [...values] }));
}

function getComponentDefaultArgs(component: LibraryComponent | null, story: WorkbenchStory): WorkbenchStoryArgs {
  const variant = component?.variants[0] ?? null;
  return variant ? normalizeRegistryVariantArgs(variant.axes, story) : {};
}

function normalizeRegistryVariantArgs(axes: Record<string, string>, story: WorkbenchStory): WorkbenchStoryArgs {
  const controlsByKey = new Map(story.controls.map((control) => [control.key, control]));
  return sortWorkbenchStoryArgs(Object.fromEntries(
    Object.entries(axes).map(([key, value]) => {
      const control = controlsByKey.get(key);
      if (control?.type === 'boolean') return [key, value === 'true'];
      return [key, value];
    }),
  ));
}

function formatPanelTab(tab: StorybookPanelTab): string {
  if (tab === 'controls') return 'Controls';
  if (tab === 'variants') return 'Variants';
  return 'Docs';
}

function getFoundationPreviewIcon(preview: WorkbenchFoundationPreview): ReactNode {
  if (preview.id === 'colors') return <Palette size={13} />;
  if (preview.id === 'typography') return <Type size={13} />;
  if (preview.id === 'sizing') return <Ruler size={13} />;
  if (preview.id === 'rounding') return <Box size={13} />;
  if (preview.id === 'elevation') return <Layers size={13} />;
  return <Component size={13} />;
}

function formatSourcePreviewStatus(status: StorybookSourcePreviewState['status']): string {
  if (status === 'loading') return 'Loading source';
  if (status === 'error') return 'Source unavailable';
  if (status === 'ready') return 'Source parsed';
  return 'Source preview';
}

function formatVariantAxes(axes: Record<string, string>, knownAxes: Array<{ name: string }>): string {
  const entries = Object.entries(axes);
  if (entries.length === 0 && knownAxes.length === 0) return 'none';
  if (entries.length === 0) return knownAxes.map((axis) => `${axis.name}: default`).join(', ');
  return entries.map(([axis, value]) => `${axis}: ${value}`).join(', ');
}

function formatStorybookComponentMeta(component: LibraryComponent, storyCount: number | null | undefined): string {
  const count = Array.isArray(component.variants) ? component.variants.length : 0;
  if (count > 0) return count === 1 ? '1 variant' : `${count} variants`;
  if (typeof storyCount === 'number') return storyCount === 1 ? '1 story' : `${storyCount} stories`;
  if (getComponentCsfStorySourceFile(component)) return 'CSF story';
  return 'No variants';
}

function formatArgs(args: WorkbenchStoryArgs): string {
  return Object.entries(args)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
}
