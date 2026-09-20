import type { TokenReference, TokenValue } from './types';
import { isGradientValue } from './types';

const FORMULA_REFERENCE_PATTERN = /token\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;

export function getTokenReferenceIdentity(reference: TokenReference): string {
  return `${reference.collectionId}:${reference.tokenId}`;
}

export function getTokenReferenceModeKey(reference: TokenReference, modeId: string | undefined): string {
  return `${getTokenReferenceIdentity(reference)}:${modeId ?? 'default'}`;
}

export function areTokenReferencesEqual(left: TokenReference, right: TokenReference): boolean {
  return left.collectionId === right.collectionId && left.tokenId === right.tokenId;
}

export function collectTokenValueReferences(value: TokenValue): TokenReference[] {
  if (value.kind === 'ref') return [{ collectionId: value.collectionId, tokenId: value.tokenId }];
  if (value.kind === 'formula') return extractFormulaReferences(value.expression);
  if (value.kind !== 'raw' || !isGradientValue(value.value)) return [];

  const stopReferences = value.value.stops.flatMap((stop) =>
    stop.color.kind === 'ref'
      ? [{ collectionId: stop.color.collectionId, tokenId: stop.color.tokenId }]
      : [],
  );
  const backgroundColor = value.value.meshBackgroundColor;
  if (backgroundColor?.kind !== 'ref') return stopReferences;

  return [
    ...stopReferences,
    { collectionId: backgroundColor.collectionId, tokenId: backgroundColor.tokenId },
  ];
}

export function mapTokenValueReferences(
  value: TokenValue,
  mapper: (reference: TokenReference) => TokenReference,
): TokenValue {
  if (value.kind === 'ref') {
    const nextReference = mapper({ collectionId: value.collectionId, tokenId: value.tokenId });
    return { ...value, ...nextReference };
  }

  if (value.kind === 'formula') {
    return { ...value, expression: mapFormulaReferences(value.expression, mapper) };
  }

  if (!isGradientValue(value.value)) return value;

  const meshBackgroundColor = value.value.meshBackgroundColor?.kind === 'ref'
    ? {
        ...value.value.meshBackgroundColor,
        ...mapper({
          collectionId: value.value.meshBackgroundColor.collectionId,
          tokenId: value.value.meshBackgroundColor.tokenId,
        }),
      }
    : value.value.meshBackgroundColor;

  return {
    ...value,
    value: {
      ...value.value,
      meshBackgroundColor,
      stops: value.value.stops.map((stop) => {
        if (stop.color.kind !== 'ref') return stop;
        return {
          ...stop,
          color: {
            ...stop.color,
            ...mapper({ collectionId: stop.color.collectionId, tokenId: stop.color.tokenId }),
          },
        };
      }),
    },
  };
}

export function tokenValueReferencesTarget(value: TokenValue, target: Partial<TokenReference>): boolean {
  return collectTokenValueReferences(value).some((reference) => tokenReferenceMatches(reference, target));
}

export function tokenReferencePathReachesTarget(
  from: TokenReference,
  target: TokenReference,
  getReferences: (reference: TokenReference) => TokenReference[],
  visited: Set<string> = new Set<string>(),
): boolean {
  if (areTokenReferencesEqual(from, target)) return true;

  const key = getTokenReferenceIdentity(from);
  if (visited.has(key)) return false;
  visited.add(key);

  return getReferences(from).some((next) =>
    tokenReferencePathReachesTarget(next, target, getReferences, visited),
  );
}

export function extractFormulaReferences(expression: string): TokenReference[] {
  const references: TokenReference[] = [];
  for (const match of expression.matchAll(FORMULA_REFERENCE_PATTERN)) {
    references.push({ collectionId: match[1]!, tokenId: match[2]! });
  }
  return references;
}

function tokenReferenceMatches(reference: TokenReference, target: Partial<TokenReference>): boolean {
  if (target.collectionId && reference.collectionId !== target.collectionId) return false;
  if (target.tokenId && reference.tokenId !== target.tokenId) return false;
  return true;
}

function mapFormulaReferences(
  expression: string,
  mapper: (reference: TokenReference) => TokenReference,
): string {
  return expression.replace(FORMULA_REFERENCE_PATTERN, (_match, collectionId: string, tokenId: string) => {
    const nextReference = mapper({ collectionId, tokenId });
    return `token("${escapeFormulaString(nextReference.collectionId)}", "${escapeFormulaString(nextReference.tokenId)}")`;
  });
}

function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
