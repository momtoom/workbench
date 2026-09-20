import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { WorkbenchSelectionSnapshot } from '@domain/history/historyController';
import type { TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';
import { areTokenReferencesEqual } from '@domain/design-system/tokens/referenceGraph';

type UseTokenEditorSelectionOptions = {
  initialRegistry: TokenRegistry;
  initialSelection?: WorkbenchSelectionSnapshot;
  onSelectionChange?: (selection: WorkbenchSelectionSnapshot) => void;
};

export function useTokenEditorSelection({
  initialRegistry,
  initialSelection,
  onSelectionChange,
}: UseTokenEditorSelectionOptions) {
  const initialResolvedSelection = resolveTokenSelection(initialSelection ?? {}, initialRegistry);
  const selectedTokenChangePendingRef = useRef(false);
  const [activeCollectionId, setActiveCollectionIdState] = useState(initialResolvedSelection.activeCollectionId);
  const [activeGroupId, setActiveGroupIdState] = useState<string | 'all'>(initialResolvedSelection.activeGroupId);
  const [selectedTokenRef, setSelectedTokenRefState] = useState<TokenReference | null>(initialResolvedSelection.selectedTokenRef);
  const [selectedTokenRefs, setSelectedTokenRefsState] = useState<TokenReference[]>(initialResolvedSelection.selectedTokenRefs);
  const [tokenSelectionAnchorRef, setTokenSelectionAnchorRef] = useState<TokenReference | null>(initialResolvedSelection.tokenSelectionAnchorRef);

  const setActiveCollectionId: Dispatch<SetStateAction<string>> = (value) => {
    selectedTokenChangePendingRef.current = true;
    setActiveCollectionIdState(value);
  };

  const setActiveGroupId: Dispatch<SetStateAction<string | 'all'>> = (value) => {
    selectedTokenChangePendingRef.current = true;
    setActiveGroupIdState(value);
  };

  function setSelectedTokenRef(reference: TokenReference | null) {
    selectedTokenChangePendingRef.current = true;
    setSelectedTokenRefState(reference);
    setSelectedTokenRefsState(reference ? [reference] : []);
    setTokenSelectionAnchorRef(reference);
  }

  function setSelectedTokenRefs(references: TokenReference[], activeReference: TokenReference | null = references[0] ?? null) {
    const nextReferences = dedupeTokenRefs(references);
    const nextActiveReference = activeReference && nextReferences.some((reference) => areTokenReferencesEqual(reference, activeReference))
      ? activeReference
      : nextReferences[0] ?? null;
    selectedTokenChangePendingRef.current = true;
    setSelectedTokenRefState(nextActiveReference);
    setSelectedTokenRefsState(nextReferences);
    setTokenSelectionAnchorRef(nextActiveReference);
  }

  function toggleSelectedTokenRef(reference: TokenReference) {
    selectedTokenChangePendingRef.current = true;
    const exists = selectedTokenRefs.some((candidate) => areTokenReferencesEqual(candidate, reference));
    const next = exists
      ? selectedTokenRefs.filter((candidate) => !areTokenReferencesEqual(candidate, reference))
      : [...selectedTokenRefs, reference];
    setSelectedTokenRefsState(next);
    setSelectedTokenRefState(exists ? next[0] ?? null : reference);
    setTokenSelectionAnchorRef(exists ? next[0] ?? null : reference);
  }

  function selectTokenRange(collectionId: string, orderedTokenIds: string[], targetReference: TokenReference) {
    selectedTokenChangePendingRef.current = true;
    const anchorReference = getRangeAnchor(collectionId, orderedTokenIds, tokenSelectionAnchorRef, selectedTokenRef, selectedTokenRefs)
      ?? targetReference;
    const anchorIndex = orderedTokenIds.indexOf(anchorReference.tokenId);
    const targetIndex = orderedTokenIds.indexOf(targetReference.tokenId);
    if (anchorIndex === -1 || targetIndex === -1) {
      setSelectedTokenRef(targetReference);
      return;
    }

    const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
    const next = orderedTokenIds.slice(start, end + 1).map((tokenId) => ({ collectionId, tokenId }));
    setSelectedTokenRefsState(next);
    setSelectedTokenRefState(targetReference);
    setTokenSelectionAnchorRef(anchorReference);
  }

  function clearSelectedTokenRefs() {
    if (selectedTokenRefs.length === 0 && selectedTokenRef === null && tokenSelectionAnchorRef === null) return;
    selectedTokenChangePendingRef.current = true;
    setSelectedTokenRefState(null);
    setSelectedTokenRefsState([]);
    setTokenSelectionAnchorRef(null);
  }

  function captureSelection(overrides: Partial<WorkbenchSelectionSnapshot> = {}): WorkbenchSelectionSnapshot {
    const snapshot: WorkbenchSelectionSnapshot = {
      activeTokenCollectionId: activeCollectionId || null,
      activeTokenGroupId: activeGroupId,
      selectedTokenCollectionId: selectedTokenRef?.collectionId ?? null,
      selectedTokenId: selectedTokenRef?.tokenId ?? null,
      selectedTokenRefs,
      tokenSelectionAnchorRef,
      ...overrides,
    };
    if (!overrides.selectedTokenRefs && ('selectedTokenCollectionId' in overrides || 'selectedTokenId' in overrides)) {
      snapshot.selectedTokenRefs = typeof snapshot.selectedTokenCollectionId === 'string' && typeof snapshot.selectedTokenId === 'string'
        ? [{ collectionId: snapshot.selectedTokenCollectionId, tokenId: snapshot.selectedTokenId }]
        : [];
    }
    return snapshot;
  }

  function restoreSelection(selection: WorkbenchSelectionSnapshot | undefined, registry: TokenRegistry) {
    const restored = resolveTokenSelection(selection ?? captureSelection(), registry);
    setActiveCollectionId(restored.activeCollectionId);
    setActiveGroupId(restored.activeGroupId);
    selectedTokenChangePendingRef.current = true;
    setSelectedTokenRefState(restored.selectedTokenRef);
    setSelectedTokenRefsState(restored.selectedTokenRefs);
    setTokenSelectionAnchorRef(restored.tokenSelectionAnchorRef);
  }

  useEffect(() => {
    if (!selectedTokenChangePendingRef.current) {
      return;
    }
    selectedTokenChangePendingRef.current = false;
    onSelectionChange?.(captureSelection());
  }, [activeCollectionId, activeGroupId, onSelectionChange, selectedTokenRef, selectedTokenRefs, tokenSelectionAnchorRef]);

  return {
    activeCollectionId,
    activeGroupId,
    captureSelection,
    clearSelectedTokenRefs,
    restoreSelection,
    selectTokenRange,
    selectedTokenRef,
    selectedTokenRefs,
    setActiveCollectionId,
    setActiveGroupId,
    setSelectedTokenRef,
    setSelectedTokenRefs,
    toggleSelectedTokenRef,
    tokenSelectionAnchorRef,
  };
}

function resolveTokenSelection(
  selection: WorkbenchSelectionSnapshot,
  registry: TokenRegistry,
): {
  activeCollectionId: string;
  activeGroupId: string | 'all';
  selectedTokenRef: TokenReference | null;
  selectedTokenRefs: TokenReference[];
  tokenSelectionAnchorRef: TokenReference | null;
} {
  const fallbackCollection = registry.collections[0] ?? null;
  const validSelectedRefs = dedupeTokenRefs(selection.selectedTokenRefs ?? [])
    .filter((reference) => tokenExists(registry, reference));
  const selectedCollection = registry.collections.find((collection) =>
    collection.id === selection.selectedTokenCollectionId &&
    collection.tokens.some((token) => token.id === selection.selectedTokenId),
  );
  const selectedTokenRef = typeof selection.selectedTokenCollectionId === 'string' &&
    typeof selection.selectedTokenId === 'string' &&
    tokenExists(registry, {
      collectionId: selection.selectedTokenCollectionId,
      tokenId: selection.selectedTokenId,
    })
    ? {
        collectionId: selection.selectedTokenCollectionId,
        tokenId: selection.selectedTokenId,
      }
    : validSelectedRefs[0] ?? null;
  const selectedTokenCollection = selectedTokenRef
    ? registry.collections.find((collection) => collection.id === selectedTokenRef.collectionId)
    : null;
  const activeCollection = registry.collections.find((collection) => collection.id === selection.activeTokenCollectionId)
    ?? selectedCollection
    ?? selectedTokenCollection
    ?? fallbackCollection;

  if (!activeCollection) {
    return {
      activeCollectionId: '',
      activeGroupId: 'all',
      selectedTokenRef: null,
      selectedTokenRefs: [],
      tokenSelectionAnchorRef: null,
    };
  }

  const activeGroupId = selection.activeTokenGroupId && activeCollection.groups.some((group) => group.id === selection.activeTokenGroupId)
    ? selection.activeTokenGroupId
    : 'all';
  const selectedTokenRefs = selectedTokenRef
    ? dedupeTokenRefs([selectedTokenRef, ...validSelectedRefs])
    : validSelectedRefs;
  const tokenSelectionAnchorRef = selection.tokenSelectionAnchorRef && tokenExists(registry, selection.tokenSelectionAnchorRef)
    ? selection.tokenSelectionAnchorRef
    : selectedTokenRef;

  return {
    activeCollectionId: activeCollection.id,
    activeGroupId,
    selectedTokenRef,
    selectedTokenRefs,
    tokenSelectionAnchorRef,
  };
}

function tokenExists(registry: TokenRegistry, reference: TokenReference): boolean {
  return registry.collections.some((collection) =>
    collection.id === reference.collectionId &&
    collection.tokens.some((token) => token.id === reference.tokenId),
  );
}

function dedupeTokenRefs(references: TokenReference[]): TokenReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.collectionId}:${reference.tokenId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRangeAnchor(
  collectionId: string,
  orderedTokenIds: string[],
  anchorReference: TokenReference | null,
  selectedReference: TokenReference | null,
  selectedReferences: TokenReference[],
): TokenReference | null {
  const candidates = [
    anchorReference,
    selectedReference,
    selectedReferences.find((reference) => reference.collectionId === collectionId) ?? null,
  ];

  return candidates.find((reference) =>
    reference?.collectionId === collectionId && orderedTokenIds.includes(reference.tokenId),
  ) ?? null;
}
