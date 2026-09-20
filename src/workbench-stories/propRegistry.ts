import propRegistrySource from './propRegistry.json';
import type {
  WorkbenchStoryControl,
  WorkbenchStoryControlAssetKind,
  WorkbenchStoryControlPicker,
  WorkbenchStoryControlTokenType,
} from './storyTypes';

export type WorkbenchPropRegistryGroupConfig = {
  label?: unknown;
  order?: unknown;
};

export type WorkbenchPropRegistryPropConfig = {
  assetKinds?: unknown;
  description?: unknown;
  group?: unknown;
  groupLabel?: unknown;
  groupOrder?: unknown;
  label?: unknown;
  order?: unknown;
  picker?: unknown;
  tokenTypes?: unknown;
};

export type WorkbenchPropRegistryComponentConfig = {
  groups?: unknown;
  props?: unknown;
};

export type WorkbenchPropRegistrySource = {
  schemaVersion?: unknown;
  components?: unknown;
  groups?: unknown;
};

type WorkbenchPropRegistryComponentLike = {
  componentId?: unknown;
  componentName?: unknown;
  extensions?: Record<string, unknown>;
  id?: unknown;
  name?: unknown;
  previewExportName?: unknown;
  sourceFile?: unknown;
};

type MergedPropRegistry = {
  groups: Map<string, WorkbenchPropRegistryGroupConfig>;
  props: Map<string, WorkbenchPropRegistryPropConfig>;
};

const propRegistry = propRegistrySource as WorkbenchPropRegistrySource;
let propRegistryOverride: WorkbenchPropRegistrySource | null = null;

const validAssetKinds: readonly WorkbenchStoryControlAssetKind[] = ['font', 'icon', 'image', 'video'];
const validPickers: readonly WorkbenchStoryControlPicker[] = ['asset', 'asset-token', 'auto', 'none', 'token'];
const validTokenTypes: readonly WorkbenchStoryControlTokenType[] = [
  'angle',
  'boolean',
  'color',
  'dimension',
  'duration',
  'gradient',
  'number',
  'opacity',
  'string',
];

export function applyWorkbenchPropRegistry(
  controls: WorkbenchStoryControl[],
  component: WorkbenchPropRegistryComponentLike | null | undefined,
): WorkbenchStoryControl[] {
  const merged = getMergedPropRegistry(component);
  if (merged.props.size === 0 && merged.groups.size === 0) return controls;

  return controls.map((control) => {
    const canUseBindingPicker = canWorkbenchStoryControlUseBindingPicker(control);
    const baseControl = canUseBindingPicker ? control : omitWorkbenchStoryControlBindingMetadata(control);
    const config = merged.props.get(normalizeRegistryKey(control.key));
    if (!config) return baseControl;

    const groupId = getTrimmedString(config.group) ?? control.groupId;
    const groupConfig = groupId ? merged.groups.get(normalizeRegistryKey(groupId)) : undefined;
    const label = getTrimmedString(config.label) ?? control.label;
    const description = getTrimmedString(config.description) ?? control.description;
    const order = getFiniteNumber(config.order) ?? control.order;
    const groupLabel = getTrimmedString(config.groupLabel) ??
      getTrimmedString(groupConfig?.label) ??
      control.groupLabel;
    const groupOrder = getFiniteNumber(config.groupOrder) ??
      getFiniteNumber(groupConfig?.order) ??
      control.groupOrder;
    const picker = canUseBindingPicker ? normalizePicker(config.picker) ?? control.picker : undefined;
    const assetKinds = canUseBindingPicker ? normalizeAssetKinds(config.assetKinds) ?? control.assetKinds : undefined;
    const tokenTypes = canUseBindingPicker ? normalizeTokenTypes(config.tokenTypes) ?? control.tokenTypes : undefined;

    return {
      ...baseControl,
      ...(assetKinds ? { assetKinds } : {}),
      ...(groupId ? { groupId } : {}),
      ...(groupLabel ? { groupLabel } : {}),
      ...(typeof groupOrder === 'number' ? { groupOrder } : {}),
      ...(description ? { description } : {}),
      label,
      ...(typeof order === 'number' ? { order } : {}),
      ...(picker ? { picker } : {}),
      ...(tokenTypes ? { tokenTypes } : {}),
    };
  });
}

function canWorkbenchStoryControlUseBindingPicker(control: WorkbenchStoryControl): boolean {
  return control.type === 'text' || control.type === 'icon';
}

function omitWorkbenchStoryControlBindingMetadata<TControl extends WorkbenchStoryControl>(control: TControl): TControl {
  const {
    assetKinds: _assetKinds,
    picker: _picker,
    tokenTypes: _tokenTypes,
    ...controlWithoutBindingMetadata
  } = control;
  return controlWithoutBindingMetadata as TControl;
}

export function createEmptyWorkbenchPropRegistry(): WorkbenchPropRegistrySource {
  return {
    schemaVersion: 1,
    groups: {},
    components: {},
  };
}

export function getWorkbenchPropRegistryOverride(): WorkbenchPropRegistrySource {
  return propRegistryOverride ?? createEmptyWorkbenchPropRegistry();
}

export function normalizeWorkbenchPropRegistry(value: unknown): WorkbenchPropRegistrySource {
  if (!isRecord(value)) return createEmptyWorkbenchPropRegistry();
  return {
    schemaVersion: getFiniteNumber(value.schemaVersion) ?? 1,
    groups: normalizeRegistryObject(value.groups),
    components: normalizeRegistryObject(value.components),
  };
}

export function setWorkbenchPropRegistryOverride(value: WorkbenchPropRegistrySource | null): void {
  propRegistryOverride = value ? normalizeWorkbenchPropRegistry(value) : null;
}

function getMergedPropRegistry(component: WorkbenchPropRegistryComponentLike | null | undefined): MergedPropRegistry {
  const groups = new Map<string, WorkbenchPropRegistryGroupConfig>();
  const props = new Map<string, WorkbenchPropRegistryPropConfig>();
  const sources = [propRegistry, propRegistryOverride].filter((source): source is WorkbenchPropRegistrySource => Boolean(source));
  const componentKeys = getComponentRegistryKeys(component);

  for (const source of sources) {
    mergeGroupConfigMap(groups, normalizeGroupConfigMap(source.groups));
    [
      getComponentConfig('*', source),
      ...componentKeys.map((key) => getComponentConfig(key, source)),
    ].filter((config): config is WorkbenchPropRegistryComponentConfig => Boolean(config)).forEach((config) => {
      mergeGroupConfigMap(groups, normalizeGroupConfigMap(config.groups));
      mergePropConfigMap(props, normalizePropConfigMap(config.props));
    });
  }

  return { groups, props };
}

function getComponentConfig(key: string, source: WorkbenchPropRegistrySource): WorkbenchPropRegistryComponentConfig | null {
  const components = isRecord(source.components) ? source.components : {};
  const normalizedKey = normalizeRegistryKey(key);
  for (const [candidateKey, config] of Object.entries(components)) {
    if (normalizeRegistryKey(candidateKey) === normalizedKey && isRecord(config)) {
      return config as WorkbenchPropRegistryComponentConfig;
    }
  }
  return null;
}

function normalizeRegistryObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, unknown] => (
    typeof entry[0] === 'string' && isRecord(entry[1])
  )));
}

function getComponentRegistryKeys(component: WorkbenchPropRegistryComponentLike | null | undefined): string[] {
  if (!component) return [];
  const keys = [
    component.id,
    component.componentId,
    component.name,
    component.componentName,
    component.sourceFile,
    component.previewExportName,
    component.extensions?.importName,
    component.extensions?.sourceExportName,
  ];
  const name = getTrimmedString(component.name) ?? getTrimmedString(component.componentName);
  const sourceFile = getTrimmedString(component.sourceFile);
  const sourceName = sourceFile
    ? sourceFile.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '')
    : null;
  if (sourceName) keys.push(sourceName);
  return dedupeStrings(keys.flatMap((key) => {
    const trimmed = getTrimmedString(key);
    return trimmed ? [trimmed] : [];
  }));
}

function normalizeGroupConfigMap(value: unknown): Map<string, WorkbenchPropRegistryGroupConfig> {
  const groups = new Map<string, WorkbenchPropRegistryGroupConfig>();
  if (!isRecord(value)) return groups;
  for (const [key, config] of Object.entries(value)) {
    if (!isRecord(config)) continue;
    groups.set(normalizeRegistryKey(key), config);
  }
  return groups;
}

function normalizePropConfigMap(value: unknown): Map<string, WorkbenchPropRegistryPropConfig> {
  const props = new Map<string, WorkbenchPropRegistryPropConfig>();
  if (!isRecord(value)) return props;
  for (const [key, config] of Object.entries(value)) {
    if (!isRecord(config)) continue;
    props.set(normalizeRegistryKey(key), config);
  }
  return props;
}

function mergeGroupConfigMap(
  target: Map<string, WorkbenchPropRegistryGroupConfig>,
  source: Map<string, WorkbenchPropRegistryGroupConfig>,
): void {
  for (const [key, config] of source) {
    target.set(key, { ...(target.get(key) ?? {}), ...config });
  }
}

function mergePropConfigMap(
  target: Map<string, WorkbenchPropRegistryPropConfig>,
  source: Map<string, WorkbenchPropRegistryPropConfig>,
): void {
  for (const [key, config] of source) {
    target.set(key, { ...(target.get(key) ?? {}), ...config });
  }
}

function normalizePicker(value: unknown): WorkbenchStoryControlPicker | null {
  if (typeof value !== 'string') return null;
  return validPickers.includes(value as WorkbenchStoryControlPicker)
    ? value as WorkbenchStoryControlPicker
    : null;
}

function normalizeAssetKinds(value: unknown): WorkbenchStoryControlAssetKind[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.filter((item): item is WorkbenchStoryControlAssetKind => (
    typeof item === 'string' && validAssetKinds.includes(item as WorkbenchStoryControlAssetKind)
  ));
  return normalized.length > 0 ? dedupeStrings(normalized) as WorkbenchStoryControlAssetKind[] : null;
}

function normalizeTokenTypes(value: unknown): WorkbenchStoryControlTokenType[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.filter((item): item is WorkbenchStoryControlTokenType => (
    typeof item === 'string' && validTokenTypes.includes(item as WorkbenchStoryControlTokenType)
  ));
  return normalized.length > 0 ? dedupeStrings(normalized) as WorkbenchStoryControlTokenType[] : null;
}

function normalizeRegistryKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function dedupeStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean) as T[])];
}

function getTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
