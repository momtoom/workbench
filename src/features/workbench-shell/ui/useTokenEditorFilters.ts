import { useEffect, useMemo, useState } from 'react';
import type { TokenCollection, TokenType } from '@domain/design-system/tokens/types';
import { TOKEN_TYPES } from '@domain/design-system/tokens/metadata';

export type TokenTypeFilter = TokenType | 'all';
export type TokenEditorFilterState = {
  query: string;
  typeFilter: TokenTypeFilter;
};

type UseTokenEditorFiltersOptions = {
  activeCollection: TokenCollection | undefined;
  activeGroupId: string;
  initialQuery?: string;
  initialTypeFilter?: TokenTypeFilter;
  onFiltersChange?: (state: TokenEditorFilterState) => void;
};

export function useTokenEditorFilters({
  activeCollection,
  activeGroupId,
  initialQuery = '',
  initialTypeFilter = 'all',
  onFiltersChange,
}: UseTokenEditorFiltersOptions) {
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<TokenTypeFilter>(() => reconcileTokenTypeFilter(initialTypeFilter));
  const normalizedQuery = expandTokenSearchText(normalizeTokenSearchText(query));
  const compactQuery = compactTokenSearchText(normalizedQuery);

  useEffect(() => {
    onFiltersChange?.({ query, typeFilter });
  }, [onFiltersChange, query, typeFilter]);

  const visibleTokens = useMemo(() => {
    if (!activeCollection) return [];
    return [...activeCollection.tokens]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((token) => {
        const text = expandTokenSearchText(normalizeTokenSearchText([token.name, token.id, token.type, token.description].filter(Boolean).join(' ')));
        const compactText = compactTokenSearchText(text);
        const groupMatches = activeGroupId === 'all' || token.groupId === activeGroupId;
        const queryMatches = !normalizedQuery ||
          text.includes(normalizedQuery) ||
          (compactQuery.length > 0 && compactText.includes(compactQuery));
        return groupMatches && queryMatches && (typeFilter === 'all' || token.type === typeFilter);
      });
  }, [activeCollection, activeGroupId, compactQuery, normalizedQuery, typeFilter]);

  const groupCounts = useMemo(() => activeCollection ? getGroupCounts(activeCollection) : new Map<string, number>(), [activeCollection]);

  return {
    groupCounts,
    query,
    setQuery,
    setTypeFilter,
    typeFilter,
    visibleTokens,
  };
}

export function reconcileTokenTypeFilter(value: unknown): TokenTypeFilter {
  return value === 'all' || (typeof value === 'string' && TOKEN_TYPES.includes(value as TokenType))
    ? value as TokenTypeFilter
    : 'all';
}

function normalizeTokenSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function expandTokenSearchText(value: string): string {
  const expanded = new Set([value]);
  expanded.add(value.replace(/(^|[^a-z0-9])bg(?=$|[^a-z0-9])/g, '$1background'));
  expanded.add(value.replace(/(^|[^a-z0-9])background(?=$|[^a-z0-9])/g, '$1bg'));
  return [...expanded].join(' ');
}

function compactTokenSearchText(value: string): string {
  return value.replace(/[^a-z0-9가-힣]+/g, '');
}

function getGroupCounts(collection: TokenCollection): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of collection.tokens) {
    if (token.groupId) counts.set(token.groupId, (counts.get(token.groupId) ?? 0) + 1);
  }
  return counts;
}
