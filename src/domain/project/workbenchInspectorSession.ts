import {
  isInspectorTokenBindingField,
  type InspectorTokenBindingField,
} from '@domain/inspector/inspectorEditService';

export type WorkbenchInspectorTokenPickerScopeFilter = {
  collectionId: string;
  groupId: string;
};

export type WorkbenchInspectorTokenPickerFilters = Record<string, unknown> & Partial<Record<
  InspectorTokenBindingField,
  WorkbenchInspectorTokenPickerScopeFilter
>>;

export function sanitizePersistedInspectorTokenPickerFilters(
  value: unknown,
): WorkbenchInspectorTokenPickerFilters | undefined {
  if (!isRecord(value)) return undefined;
  const filters: WorkbenchInspectorTokenPickerFilters = { ...value };
  for (const [field, filter] of Object.entries(value)) {
    if (!isInspectorTokenBindingField(field)) continue;
    const normalized = normalizeWorkbenchInspectorTokenPickerScopeFilter(filter);
    if (normalized) filters[field] = normalized;
    else delete filters[field];
  }
  return Object.keys(filters).length > 0 ? filters : undefined;
}

export function normalizeWorkbenchInspectorTokenPickerScopeFilter(
  value: unknown,
): WorkbenchInspectorTokenPickerScopeFilter | null {
  if (!isRecord(value)) return null;
  const collectionId = getNonEmptyString(value.collectionId) ?? 'all';
  const groupId = collectionId === 'all'
    ? 'all'
    : getNonEmptyString(value.groupId) ?? 'all';
  return { collectionId, groupId };
}

function getNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
