import type { TokenCollection, TokenMode, TokenRegistry } from '@domain/design-system/tokens/types';
import type { InspectorTokenModeSelection } from '@domain/inspector/inspectorEditService';
import {
  reconcileDesignPreviewAppearance,
  type WorkbenchDesignPreviewAppearance,
  type WorkbenchDesignPreviewViewport,
} from '@domain/project/workbenchPreviewSession';

export { reconcileDesignPreviewAppearance } from '@domain/project/workbenchPreviewSession';

export type DesignPreviewViewportPresetId = string;

type DesignPreviewViewportPreset = {
  height: number;
  id: DesignPreviewViewportPresetId;
  label: string;
  width: number;
};

export type DesignPreviewAppearance = WorkbenchDesignPreviewAppearance;

export type DesignPreviewViewport = WorkbenchDesignPreviewViewport;

const PREVIEW_VIEWPORT_MIN_SIZE = 240;
const PREVIEW_VIEWPORT_MAX_SIZE = 7680;

export const DEFAULT_DESIGN_PREVIEW_VIEWPORT: DesignPreviewViewportPreset = {
  height: 900,
  id: 'responsive',
  label: 'Responsive',
  width: 1440,
};

export const DESIGN_PREVIEW_VIEWPORT_PRESETS: readonly DesignPreviewViewportPreset[] = [
  DEFAULT_DESIGN_PREVIEW_VIEWPORT,
  { id: 'mobile', label: 'Mobile', width: 390, height: 844 },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { id: 'desktop', label: 'Desktop', width: 1920, height: 1080 },
  { id: 'full', label: 'Full', width: 1440, height: 900 },
];

export const DEFAULT_DESIGN_PREVIEW_APPEARANCE: DesignPreviewAppearance = 'system';

export const DESIGN_PREVIEW_APPEARANCES: readonly { id: DesignPreviewAppearance; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function getDesignPreviewAppearanceThemeMode(
  appearance: DesignPreviewAppearance,
): 'light' | 'dark' | undefined {
  return appearance === 'system' ? undefined : appearance;
}

export function formatPreviewTokenModeSummary(
  registry: TokenRegistry,
  value: InspectorTokenModeSelection,
): string {
  const summaries = registry.collections.flatMap((collection) => {
    const modeId = getPreviewTokenModeId(collection, value);
    const mode = collection.modes.find((candidate) => candidate.id === modeId);
    return mode ? [`${collection.name}: ${mode.name}`] : [];
  });
  return summaries.length > 0 ? summaries.join(' · ') : 'Preview token modes';
}

export function getPreviewTokenModeId(
  collection: TokenCollection,
  value: InspectorTokenModeSelection,
): string {
  const selected = value[collection.id];
  if (selected && collection.modes.some((mode) => mode.id === selected)) return selected;
  // Preview mode is independent from the token editor's active authoring mode.
  return collection.modes[0]?.id ?? '';
}

export function reconcilePreviewTokenModes(
  registry: TokenRegistry,
  current: InspectorTokenModeSelection,
): Record<string, string> {
  const collectionById = new Map(registry.collections.map((collection) => [collection.id, collection]));
  const reconciled = new Map<string, string>();

  registry.collections.forEach((collection) => {
    const modeId = getPreviewTokenModeId(collection, current);
    if (modeId) reconciled.set(collection.id, modeId);
  });

  registry.collections.forEach((collection) => {
    const selectedModeId = reconciled.get(collection.id);
    const selectedMode = collection.modes.find((mode) => mode.id === selectedModeId);
    const surfaceCollectionId = getSurfaceCompanionCollectionId(collection.id);
    if (!selectedMode || !surfaceCollectionId || !isDarkPreviewMode(selectedMode)) return;

    const surfaceCollection = collectionById.get(surfaceCollectionId);
    const darkSurfaceMode = surfaceCollection?.modes.find(isDarkPreviewMode);
    if (surfaceCollection && darkSurfaceMode) reconciled.set(surfaceCollection.id, darkSurfaceMode.id);
  });

  return Object.fromEntries(reconciled);
}

function getSurfaceCompanionCollectionId(collectionId: string): string | null {
  if (collectionId === 'colors') return 'surface';
  return collectionId.endsWith('-colors')
    ? `${collectionId.slice(0, -'-colors'.length)}-surface`
    : null;
}

function isDarkPreviewMode(mode: TokenMode): boolean {
  return normalizePreviewModeLabel(mode.id) === 'dark' || normalizePreviewModeLabel(mode.name) === 'dark';
}

function normalizePreviewModeLabel(value: string): string {
  return value.trim().toLowerCase();
}

export function reconcileDesignPreviewViewport(value: { height?: unknown; presetId?: unknown; width?: unknown } | null): DesignPreviewViewport {
  const preset = getDesignPreviewViewportPreset(value?.presetId);
  return {
    height: normalizeDesignPreviewViewportDimension(value?.height, preset.height),
    presetId: preset.id,
    width: normalizeDesignPreviewViewportDimension(value?.width, preset.width),
  };
}

export function getDesignPreviewViewportPreset(
  presetId: unknown,
): DesignPreviewViewportPreset {
  return DESIGN_PREVIEW_VIEWPORT_PRESETS.find((preset) => preset.id === presetId) ?? DEFAULT_DESIGN_PREVIEW_VIEWPORT;
}

export function isDesignPreviewViewportPresetId(value: unknown): value is DesignPreviewViewportPresetId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeDesignPreviewViewportDimension(value: unknown, fallback: number): number {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  const nextValue = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.round(Math.min(PREVIEW_VIEWPORT_MAX_SIZE, Math.max(PREVIEW_VIEWPORT_MIN_SIZE, nextValue)));
}
