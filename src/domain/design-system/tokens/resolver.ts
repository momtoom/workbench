import type {
  DesignToken,
  FormulaUnit,
  ResolvedTokenValue,
  TokenCollection,
  TokenReference,
  TokenRegistry,
  TokenType,
  TokenValue,
} from './types';
import { isAngleValue, isDimensionValue, isDurationValue, isOpacityValue } from './types';
import {
  collectTokenValueReferences,
  getTokenReferenceModeKey,
  tokenReferencePathReachesTarget,
} from './referenceGraph';

type ResolveContext = {
  modeByCollection?: Partial<Record<string, string>>;
  registry: TokenRegistry;
  modeId?: string;
  visited: Set<string>;
};

type FormulaToken =
  | { kind: 'number'; value: number }
  | { kind: 'operator'; value: '+' | '-' | '*' | '/' | '(' | ')' }
  | { kind: 'reference'; collectionId: string; tokenId: string };

export function resolveTokenById(
  registry: TokenRegistry,
  collectionId: string,
  tokenId: string,
  modeId?: string,
  modeByCollection?: Partial<Record<string, string>>,
): ResolvedTokenValue {
  const found = findToken(registry, collectionId, tokenId);
  if (!found) return null;
  return resolveTokenValue(found.token, found.collection, registry, modeId, modeByCollection);
}

export function resolveTokenValue(
  token: DesignToken,
  collection: TokenCollection,
  registry: TokenRegistry,
  modeId?: string,
  modeByCollection?: Partial<Record<string, string>>,
): ResolvedTokenValue {
  const resolvedMode = modeByCollection?.[collection.id] ?? modeId ?? collection.activeMode ?? collection.modes[0]?.id ?? 'default';
  return resolveValue(token.values[resolvedMode] ?? token.values.default, token, collection, {
    modeByCollection,
    registry,
    modeId: resolvedMode,
    visited: new Set<string>(),
  });
}

export function wouldCreateTokenCycle(
  registry: TokenRegistry,
  target: TokenReference,
  nextValue: TokenValue,
): boolean {
  const refs = collectTokenValueReferences(nextValue);
  return refs.some((ref) => tokenReferencePathReachesTarget(ref, target, (reference) => {
    const found = findToken(registry, reference.collectionId, reference.tokenId);
    if (!found) return [];
    return Object.values(found.token.values).flatMap(collectTokenValueReferences);
  }));
}

export function findToken(
  registry: TokenRegistry,
  collectionId: string,
  tokenId: string,
): { collection: TokenCollection; token: DesignToken } | null {
  const collection = registry.collections.find((candidate) => candidate.id === collectionId);
  if (!collection) return null;
  const token = collection.tokens.find((candidate) => candidate.id === tokenId);
  return token ? { collection, token } : null;
}

export function getTokenMode(collection: TokenCollection): string {
  return collection.activeMode ?? collection.modes[0]?.id ?? 'default';
}

export function isNumericResolvedValue(value: ResolvedTokenValue): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function resolveValue(
  value: TokenValue | undefined,
  token: DesignToken,
  collection: TokenCollection,
  context: ResolveContext,
): ResolvedTokenValue {
  if (!value) return null;

  const key = getTokenReferenceModeKey({ collectionId: collection.id, tokenId: token.id }, context.modeId);
  if (context.visited.has(key)) return null;
  context.visited.add(key);

  try {
    if (value.kind === 'raw') return value.value;

    if (value.kind === 'ref') {
      return resolveReferencedToken(value, context);
    }

    if (!supportsFormula(token.type)) {
      return null;
    }

    const result = evaluateFormula(value.expression, context, token.type, value.unit);
    if (result === null) return null;
    if (token.type === 'dimension') return { value: result, unit: getFormulaUnit(value.unit, 'rem') };
    if (token.type === 'duration') return { value: result, unit: getFormulaUnit(value.unit, 'ms') };
    if (token.type === 'angle') return { value: result, unit: getFormulaUnit(value.unit, 'deg') };
    if (token.type === 'opacity') return { value: result, unit: getFormulaUnit(value.unit, '%') };
    return result;
  } finally {
    context.visited.delete(key);
  }
}

function resolveReferencedToken(reference: TokenReference, context: ResolveContext): ResolvedTokenValue {
  const found = findToken(context.registry, reference.collectionId, reference.tokenId);
  if (!found) return null;
  const modeId = context.modeByCollection?.[found.collection.id]
    ?? getInheritedTokenMode(found.collection, context.modeId)
    ?? getTokenMode(found.collection);
  const value = found.token.values[modeId] ?? found.token.values.default;
  return resolveValue(value, found.token, found.collection, { ...context, modeId });
}

function getInheritedTokenMode(collection: TokenCollection, modeId: string | undefined): string | undefined {
  if (!modeId) return undefined;
  return collection.modes.some((mode) => mode.id === modeId) ? modeId : undefined;
}

function evaluateFormula(
  expression: string,
  context: ResolveContext,
  targetType: TokenType,
  unit?: FormulaUnit,
): number | null {
  const tokens = tokenizeFormula(expression);
  if (!tokens) return null;

  const values = tokens.map((token) => {
    if (token.kind !== 'reference') return token;
    const resolved = resolveReferencedToken(token, context);
    const numericValue = getFormulaNumericValue(resolved, targetType, unit);
    if (numericValue === null) return null;
    return { kind: 'number' as const, value: numericValue };
  });

  if (values.some((token) => token === null)) return null;
  return parseFormula(values as Exclude<(typeof values)[number], null>[]);
}

function supportsFormula(type: TokenType): boolean {
  return type === 'number' || type === 'dimension' || type === 'duration' || type === 'angle' || type === 'opacity';
}

function getFormulaNumericValue(value: ResolvedTokenValue, targetType: TokenType, unit?: FormulaUnit): number | null {
  if (isNumericResolvedValue(value)) return value;
  if (targetType === 'dimension' && isDimensionValue(value) && (!unit || value.unit === unit)) return value.value;
  if (targetType === 'duration' && isDurationValue(value) && (!unit || value.unit === unit)) return value.value;
  if (targetType === 'angle' && isAngleValue(value) && (!unit || value.unit === unit)) return value.value;
  if (targetType === 'opacity' && isOpacityValue(value) && (!unit || value.unit === unit)) return value.value;
  return null;
}

function getFormulaUnit<Unit extends FormulaUnit>(unit: FormulaUnit | undefined, fallback: Unit): Unit {
  return (unit ?? fallback) as Unit;
}

function tokenizeFormula(expression: string): FormulaToken[] | null {
  const tokens: FormulaToken[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index]!;
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ('+-*/()'.includes(char)) {
      tokens.push({ kind: 'operator', value: char as FormulaToken extends { kind: 'operator'; value: infer V } ? V : never });
      index += 1;
      continue;
    }
    const numberMatch = expression.slice(index).match(/^\d+(?:\.\d+)?/);
    if (numberMatch) {
      tokens.push({ kind: 'number', value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }
    const referenceMatch = expression.slice(index).match(/^token\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/);
    if (referenceMatch) {
      tokens.push({ kind: 'reference', collectionId: referenceMatch[1]!, tokenId: referenceMatch[2]! });
      index += referenceMatch[0].length;
      continue;
    }
    return null;
  }

  return tokens;
}

function parseFormula(tokens: FormulaToken[]): number | null {
  let index = 0;

  function parseExpression(): number | null {
    let value = parseTerm();
    if (value === null) return null;
    while (isOperator(tokens[index], '+', '-')) {
      const current = tokens[index] as Extract<FormulaToken, { kind: 'operator' }>;
      const operator = current.value;
      index += 1;
      const rhs = parseTerm();
      if (rhs === null) return null;
      value = operator === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number | null {
    let value = parseFactor();
    if (value === null) return null;
    while (isOperator(tokens[index], '*', '/')) {
      const current = tokens[index] as Extract<FormulaToken, { kind: 'operator' }>;
      const operator = current.value;
      index += 1;
      const rhs = parseFactor();
      if (rhs === null) return null;
      if (operator === '/' && rhs === 0) return null;
      value = operator === '*' ? value * rhs : value / rhs;
    }
    return value;
  }

  function parseFactor(): number | null {
    const token = tokens[index];
    if (!token) return null;
    if (token.kind === 'number') {
      index += 1;
      return token.value;
    }
    if (token.kind === 'operator' && token.value === '-') {
      index += 1;
      const value = parseFactor();
      return value === null ? null : -value;
    }
    if (token.kind === 'operator' && token.value === '(') {
      index += 1;
      const value = parseExpression();
      if (!isOperator(tokens[index], ')')) return null;
      index += 1;
      return value;
    }
    return null;
  }

  const result = parseExpression();
  return index === tokens.length ? result : null;
}

function isOperator(token: FormulaToken | undefined, ...operators: Extract<FormulaToken, { kind: 'operator' }>['value'][]): token is Extract<FormulaToken, { kind: 'operator' }> {
  return token?.kind === 'operator' && operators.includes(token.value);
}
