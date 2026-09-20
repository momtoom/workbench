export const SOURCE_TOKEN_MODE_ATTRIBUTE = 'data-wb-token-modes';

export type TokenModeOverride = Record<string, string>;

export function parseTokenModeOverride(value: string | null | undefined): TokenModeOverride {
  if (!value) return {};

  return Object.fromEntries(
    value
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .flatMap((entry) => {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex <= 0) return [];
        const collectionId = decodeModeOverridePart(entry.slice(0, separatorIndex));
        const modeId = decodeModeOverridePart(entry.slice(separatorIndex + 1));
        return collectionId && modeId ? [[collectionId, modeId]] : [];
      }),
  );
}

export function serializeTokenModeOverride(value: TokenModeOverride): string | null {
  const entries = Object.entries(value)
    .map(([collectionId, modeId]) => [collectionId.trim(), modeId.trim()] as const)
    .filter(([collectionId, modeId]) => collectionId && modeId);

  if (entries.length === 0) return null;
  return entries
    .map(([collectionId, modeId]) => `${encodeModeOverridePart(collectionId)}=${encodeModeOverridePart(modeId)}`)
    .join(';');
}

function encodeModeOverridePart(value: string): string {
  return encodeURIComponent(value);
}

function decodeModeOverridePart(value: string): string {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return '';
  }
}
