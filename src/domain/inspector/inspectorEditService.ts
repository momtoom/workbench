import type { TokenPickerResult } from '@domain/design-system/tokens/query';
import { queryTokens } from '@domain/design-system/tokens/query';
import type { InspectorField, TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';
import type { SourceStyleProperty } from '@domain/document/editableTreeSourceWriteback';
import type { WorkbenchEditOperationInput } from '@domain/editing/editOperationTypes';

export type InspectorTokenBindingField = 'background' | 'radius' | 'spacing' | 'fontSize';
export type InspectorTokenModeSelection = Partial<Record<string, string>>;

export const INSPECTOR_TOKEN_BINDING_FIELDS = ['background', 'radius', 'spacing', 'fontSize'] as const satisfies readonly InspectorTokenBindingField[];

export function isInspectorTokenBindingField(value: unknown): value is InspectorTokenBindingField {
  return typeof value === 'string'
    && (INSPECTOR_TOKEN_BINDING_FIELDS as readonly string[]).includes(value);
}

export type InspectorTokenBindingOperationTarget = {
  affectedFiles?: string[];
  field: InspectorTokenBindingField;
  reference: TokenReference;
  targetId: string;
};

const FIELD_INSPECTOR_FIELD: Record<InspectorTokenBindingField, InspectorField> = {
  background: 'bgColor',
  radius: 'borderRadius',
  spacing: 'padding',
  fontSize: 'fontSize',
};

const SOURCE_STYLE_TOKEN_BINDING_FIELD = new Map<SourceStyleProperty, InspectorTokenBindingField>([
  ['background', 'background'],
  ['background-color', 'background'],
  ['border-radius', 'radius'],
  ['padding', 'spacing'],
  ['font-size', 'fontSize'],
]);

export function getInspectorFieldForTokenBindingField(field: InspectorTokenBindingField): InspectorField {
  return FIELD_INSPECTOR_FIELD[field];
}

export function getTokenBindingFieldForSourceStyleProperty(
  property: SourceStyleProperty,
): InspectorTokenBindingField | null {
  return SOURCE_STYLE_TOKEN_BINDING_FIELD.get(property) ?? null;
}

export function getCompatibleTokensForInspectorField(
  registry: TokenRegistry,
  field: InspectorTokenBindingField,
  modeByCollection?: InspectorTokenModeSelection,
): TokenPickerResult[] {
  return queryInspectorTokens(registry, field, modeByCollection).filter((result) => result.compatible);
}

export function findInspectorTokenBindingToken(
  registry: TokenRegistry,
  field: InspectorTokenBindingField,
  tokenId: string | null | undefined,
  modeByCollection?: InspectorTokenModeSelection,
): TokenPickerResult | null {
  if (!tokenId) return null;

  const results = queryInspectorTokens(registry, field, modeByCollection);

  return (
    results.find((result) => result.compatible && result.token.id === tokenId) ??
    results.find((result) => result.token.id === tokenId) ??
    null
  );
}

export function findInspectorTokenBindingReference(
  registry: TokenRegistry,
  field: InspectorTokenBindingField,
  reference: TokenReference,
  modeByCollection?: InspectorTokenModeSelection,
): TokenPickerResult | null {
  const results = queryInspectorTokens(registry, field, modeByCollection);

  return (
    results.find((result) => (
      result.compatible &&
      result.collection.id === reference.collectionId &&
      result.token.id === reference.tokenId
    )) ??
    results.find((result) => (
      result.collection.id === reference.collectionId &&
      result.token.id === reference.tokenId
    )) ??
    null
  );
}

export function createInspectorTokenBindingOperation({
  affectedFiles = [],
  field,
  reference,
  targetId,
}: InspectorTokenBindingOperationTarget): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'inspector-token-binding',
      id: targetId,
      field,
      collectionId: reference.collectionId,
      tokenId: reference.tokenId,
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles,
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'token-css'],
      reason: 'Inspector token binding changed the selected design preview target.',
    },
    cleanup: {
      bindings: true,
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['preview-projection', 'renderer-payload', 'token-css'],
      reason: 'Inspector edits must regenerate derived preview state from canonical design state.',
    },
  };
}

export function formatInspectorBindingField(field: InspectorTokenBindingField): string {
  if (field === 'background') return 'Background';
  if (field === 'radius') return 'Radius';
  if (field === 'fontSize') return 'Font size';
  return 'Spacing';
}

function queryInspectorTokens(
  registry: TokenRegistry,
  field: InspectorTokenBindingField,
  modeByCollection?: InspectorTokenModeSelection,
): TokenPickerResult[] {
  const inspectorField = getInspectorFieldForTokenBindingField(field);
  return registry.collections.flatMap((collection) => queryTokens(registry, {
    collectionId: collection.id,
    field: inspectorField,
    modeId: modeByCollection?.[collection.id],
  }));
}
