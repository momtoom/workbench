import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { InspectorField, TokenReference, TokenRegistry, TokenType } from '@domain/design-system/tokens/types';
import { reconcileTokenFieldScopeFilter } from '@domain/design-system/tokens/fieldScopes';
import {
  findSelectedToken,
  queryTokens,
  type TokenPickerResult,
} from '@domain/design-system/tokens/query';
import { areTokenReferencesEqual } from '@domain/design-system/tokens/referenceGraph';
import {
  TOKEN_PICKER_CLOSE_EVENT,
  TOKEN_PICKER_OPEN_EVENT,
  clamp,
  getTokenPickerCopy,
  getTokenPickerPopoverLayout,
  getTokenPickerResultId,
  type TokenPickerVariant,
} from './tokenPickerLayout';
import type { TokenPickerScopeFilter } from './TokenPicker';

export type TokenPickerControllerOptions = {
  allowedTypes?: TokenType[];
  autoOpen: boolean;
  currentCollectionId?: string;
  cycleTarget?: TokenReference;
  exclude?: TokenReference[];
  field?: InspectorField;
  modeByCollection?: Partial<Record<string, string>>;
  onOpenChange?: (open: boolean) => void;
  onScopeFilterChange?: (filter: TokenPickerScopeFilter) => void;
  onSelect: (reference: TokenReference) => void;
  popoverAnchorRef?: RefObject<HTMLElement | null>;
  registry: TokenRegistry;
  scopeFilter?: TokenPickerScopeFilter;
  selected: TokenReference | null;
  variant: TokenPickerVariant;
};

export function useTokenPickerController({
  allowedTypes,
  autoOpen,
  currentCollectionId,
  cycleTarget,
  exclude,
  field,
  modeByCollection,
  onOpenChange,
  onScopeFilterChange,
  onSelect,
  popoverAnchorRef,
  registry,
  scopeFilter,
  selected,
  variant,
}: TokenPickerControllerOptions) {
  const initialScopeFilter = reconcileTokenFieldScopeFilter(registry, field, scopeFilter, currentCollectionId);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<string | 'all'>(initialScopeFilter.collectionId);
  const [groupFilter, setGroupFilter] = useState<string | 'all'>(initialScopeFilter.groupId);
  const [typeFilter, setTypeFilter] = useState<TokenType | 'all'>('all');
  const [highlight, setHighlight] = useState(-1);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const autoOpenedRef = useRef(false);
  const focusSelectedOnOpenRef = useRef(false);
  const pickerId = useId();
  const reconciledScopeFilter = useMemo(
    () => reconcileTokenFieldScopeFilter(registry, field, scopeFilter, currentCollectionId),
    [currentCollectionId, field, registry, scopeFilter],
  );

  const selectedResult = findSelectedToken(registry, selected, modeByCollection);
  const selectedTokenType = selectedResult?.token.type;
  const selectedAwareAllowedTypes = useMemo(() => {
    if (!allowedTypes || !selectedTokenType || allowedTypes.includes(selectedTokenType)) return allowedTypes;
    return [...allowedTypes, selectedTokenType];
  }, [allowedTypes, selectedTokenType]);
  const results = useMemo(() => {
    const queriedResults = queryTokens(registry, {
      search,
      collectionId: collectionFilter,
      groupId: groupFilter,
      type: typeFilter,
      field,
      allowedTypes: selectedAwareAllowedTypes,
      exclude,
      cycleTarget,
      modeByCollection,
    });
    return variant === 'inspector' ? queriedResults.filter((result) => result.compatible) : queriedResults;
  }, [collectionFilter, cycleTarget, exclude, field, groupFilter, modeByCollection, registry, search, selectedAwareAllowedTypes, typeFilter, variant]);
  const selectableResults = results.filter((result) => result.compatible);
  const selectedFilterCollection = collectionFilter === 'all'
    ? null
    : registry.collections.find((collection) => collection.id === collectionFilter) ?? null;
  const popoverLayout = getTokenPickerPopoverLayout(anchor, variant);
  const highlightedResult = selectableResults[highlight] ?? null;
  const resultListId = `${pickerId}-results`;
  const highlightedResultId = highlightedResult ? getTokenPickerResultId(pickerId, highlightedResult) : undefined;
  const copy = getTokenPickerCopy(variant);
  const selectedSelectableIndex = useMemo(
    () => findTokenPickerResultIndex(selectableResults, selected),
    [selectableResults, selected],
  );
  const selectedResultId = useMemo(() => {
    const selectedVisibleResult = findTokenPickerResult(results, selected);
    return selectedVisibleResult ? getTokenPickerResultId(pickerId, selectedVisibleResult) : undefined;
  }, [pickerId, results, selected]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      closePicker();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [open]);

  useEffect(() => {
    const handler = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== pickerId) closePicker();
    };
    window.addEventListener(TOKEN_PICKER_OPEN_EVENT, handler);
    return () => window.removeEventListener(TOKEN_PICKER_OPEN_EVENT, handler);
  }, [pickerId]);

  useEffect(() => {
    window.addEventListener(TOKEN_PICKER_CLOSE_EVENT, closePicker);
    return () => window.removeEventListener(TOKEN_PICKER_CLOSE_EVENT, closePicker);
  }, []);

  useEffect(() => {
    if (!autoOpen) {
      autoOpenedRef.current = false;
      return;
    }
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    openPicker();
  }, [autoOpen]);

  useEffect(() => {
    setHighlight((current) => {
      if (selectableResults.length === 0 || current < 0) return -1;
      return Math.min(current, selectableResults.length - 1);
    });
  }, [selectableResults.length]);

  useEffect(() => {
    if (!open || !focusSelectedOnOpenRef.current) return;
    setHighlight(selectedSelectableIndex);
    focusSelectedOnOpenRef.current = false;
  }, [open, selectedSelectableIndex]);

  useEffect(() => {
    if (!open) return;
    const resultId = highlightedResultId ?? (focusSelectedOnOpenRef.current ? selectedResultId : undefined);
    if (!resultId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(resultId)?.scrollIntoView({ block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightedResultId, open, selectedResultId]);

  useEffect(() => {
    setCollectionFilter(reconciledScopeFilter.collectionId);
    setGroupFilter(reconciledScopeFilter.groupId);
  }, [reconciledScopeFilter.collectionId, reconciledScopeFilter.groupId]);

  function choose(result: TokenPickerResult) {
    if (!result.compatible) return;
    onSelect({ collectionId: result.collection.id, tokenId: result.token.id });
    closePicker();
    setSearch('');
  }

  function updateAnchor() {
    setAnchor(popoverAnchorRef?.current?.getBoundingClientRect() ?? getTokenPickerAnchorRect(rootRef.current, triggerRef.current));
  }

  function openPicker() {
    updateAnchor();
    window.dispatchEvent(new CustomEvent(TOKEN_PICKER_OPEN_EVENT, { detail: pickerId }));
    focusSelectedOnOpenRef.current = selected !== null;
    if (selected && selectedResult) {
      setSearch('');
      setCollectionFilter(selected.collectionId);
      setGroupFilter(selectedResult.token.groupId ?? 'all');
      if (variant !== 'inspector') setTypeFilter('all');
    } else {
      resetHighlight();
    }
    setOpen(true);
    onOpenChange?.(true);
  }

  function closePicker() {
    setOpen(false);
    onOpenChange?.(false);
  }

  function moveHighlight(delta: number) {
    if (selectableResults.length === 0) {
      setHighlight(-1);
      return;
    }
    setHighlight((current) => {
      if (current < 0) return delta < 0 ? selectableResults.length - 1 : 0;
      return clamp(current + delta, 0, selectableResults.length - 1);
    });
  }

  function resetHighlight() {
    setHighlight(-1);
  }

  function changeCollectionFilter(value: string | 'all') {
    setCollectionFilter(value);
    setGroupFilter('all');
    onScopeFilterChange?.({ collectionId: value, groupId: 'all' });
    resetHighlight();
  }

  function changeGroupFilter(value: string | 'all') {
    setGroupFilter(value);
    onScopeFilterChange?.({ collectionId: collectionFilter, groupId: value });
    resetHighlight();
  }

  function changeSearch(value: string) {
    setSearch(value);
    resetHighlight();
  }

  function changeTypeFilter(value: TokenType | 'all') {
    setTypeFilter(value);
    resetHighlight();
  }

  return {
    changeCollectionFilter,
    changeGroupFilter,
    changeSearch,
    changeTypeFilter,
    choose,
    closePicker,
    collectionFilter,
    copy,
    groupFilter,
    highlightedResultId,
    highlight,
    moveHighlight,
    open,
    openPicker,
    pickerId,
    popoverLayout,
    popoverRef,
    registry,
    resetHighlight,
    resultListId,
    results,
    rootRef,
    search,
    selectableResults,
    selectedFilterCollection,
    selectedResult,
    triggerRef,
    typeFilter,
  };
}

function getTokenPickerAnchorRect(root: HTMLElement | null, trigger: HTMLElement | null): DOMRect | null {
  const valuePopover = root?.closest('.wb-token-value-popover') ?? trigger?.closest('.wb-token-value-popover');
  if (valuePopover instanceof HTMLElement) return valuePopover.getBoundingClientRect();
  return trigger?.getBoundingClientRect() ?? null;
}

function findTokenPickerResultIndex(results: TokenPickerResult[], reference: TokenReference | null): number {
  if (!reference) return -1;
  return results.findIndex((result) => tokenPickerResultMatchesReference(result, reference));
}

function findTokenPickerResult(results: TokenPickerResult[], reference: TokenReference | null): TokenPickerResult | null {
  if (!reference) return null;
  return results.find((result) => tokenPickerResultMatchesReference(result, reference)) ?? null;
}

function tokenPickerResultMatchesReference(result: TokenPickerResult, reference: TokenReference): boolean {
  return areTokenReferencesEqual(
    { collectionId: result.collection.id, tokenId: result.token.id },
    reference,
  );
}
