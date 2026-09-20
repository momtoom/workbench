export type WorkbenchDesignPreviewAppearance = 'system' | 'light' | 'dark';
export type WorkbenchDesignPreviewViewport = {
  height: number;
  presetId: string;
  width: number;
};
export type WorkbenchPreviewTokenModeSelection = Record<string, string>;

export function reconcileDesignPreviewAppearance(value: unknown): WorkbenchDesignPreviewAppearance {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system';
}

export function sanitizePersistedDesignPreviewAppearance(
  value: unknown,
): WorkbenchDesignPreviewAppearance | undefined {
  return typeof value === 'string'
    ? reconcileDesignPreviewAppearance(value)
    : undefined;
}

export function sanitizePersistedDesignPreviewViewport(
  value: unknown,
): WorkbenchDesignPreviewViewport | undefined {
  if (!isRecord(value)) return undefined;
  const height = getFiniteNumber(value.height);
  const presetId = typeof value.presetId === 'string' ? value.presetId.trim() : '';
  const width = getFiniteNumber(value.width);
  if (height === undefined || !presetId || width === undefined) return undefined;
  return { height, presetId, width };
}

export function sanitizePersistedPreviewTokenModes(
  value: unknown,
): WorkbenchPreviewTokenModeSelection | undefined {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => (
      entry[0].trim().length > 0
      && typeof entry[1] === 'string'
      && entry[1].trim().length > 0
    )),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getFiniteNumber(value: unknown): number | undefined {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim().length > 0
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(numericValue) ? numericValue : undefined;
}
