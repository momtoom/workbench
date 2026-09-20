import type { DesignToken, TokenReference } from './types';
import {
  getTokenReferenceUsages,
  getTokenSourceUsages,
  getTokenScopeFieldScopeUsages,
  type TokenUsageIndex,
} from './usageIndex';

export type TokenDeletionImpact = {
  fieldScopeCount: number;
  referenceCount: number;
  sourceUsageCount: number;
};

export type TokenDeletionRequest = {
  collectionId: string;
  tokens: DesignToken[];
};

export function getTokenDeletionImpact(
  usageIndex: TokenUsageIndex,
  request: TokenDeletionRequest,
): TokenDeletionImpact {
  let referenceCount = 0;
  let sourceUsageCount = 0;
  const scopedGroupKeys = new Set<string>();

  for (const token of request.tokens) {
    const reference: TokenReference = {
      collectionId: request.collectionId,
      tokenId: token.id,
    };
    referenceCount += getTokenReferenceUsages(usageIndex, reference).length;
    sourceUsageCount += getTokenSourceUsages(usageIndex, reference)
      .reduce((total, usage) => total + usage.count, 0);

    const scopes = getTokenScopeFieldScopeUsages(usageIndex, {
      collectionId: request.collectionId,
      groupId: token.groupId,
    });
    for (const scope of scopes) {
      scopedGroupKeys.add(`${scope.collectionId}:${scope.groupId ?? '__ungrouped__'}:${scope.field}`);
    }
  }

  return {
    fieldScopeCount: scopedGroupKeys.size,
    referenceCount,
    sourceUsageCount,
  };
}

export function hasTokenDeletionImpact(impact: TokenDeletionImpact): boolean {
  return impact.fieldScopeCount > 0 || impact.referenceCount > 0 || impact.sourceUsageCount > 0;
}

export function formatTokenDeletionImpact(impact: TokenDeletionImpact): string | null {
  const impacts: string[] = [];
  if (impact.referenceCount > 0) {
    impacts.push(`${impact.referenceCount} token reference${impact.referenceCount === 1 ? '' : 's'}`);
  }
  if (impact.sourceUsageCount > 0) {
    impacts.push(`${impact.sourceUsageCount} source usage${impact.sourceUsageCount === 1 ? '' : 's'}`);
  }
  if (impact.fieldScopeCount > 0) {
    impacts.push(`${impact.fieldScopeCount} field scope${impact.fieldScopeCount === 1 ? '' : 's'}`);
  }
  return impacts.length > 0 ? `This also affects ${impacts.join(' and ')}.` : null;
}
