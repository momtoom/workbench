import type { Dispatch, SetStateAction } from 'react';
import type { WorkbenchSelectionSnapshot } from '@domain/history/historyController';
import type { TokenCommit } from './useTokenEditorHistory';
import type { TokenCollection, TokenReference, TokenRegistry } from '@domain/design-system/tokens/types';

export type EditingCell = { tokenId: string; modeId: string } | null;

export type TokenEditorActionContext = {
  activeCollection: TokenCollection | undefined;
  activeCollectionId: string;
  activeGroupId: string | 'all';
  captureSelection: (overrides?: Partial<WorkbenchSelectionSnapshot>) => WorkbenchSelectionSnapshot;
  commit: TokenCommit;
  dragTokenId: string | null;
  editingGroupId: string | null;
  registry: TokenRegistry;
  selectedTokenRef: TokenReference | null;
  selectedTokenRefs: TokenReference[];
  setActiveCollectionId: Dispatch<SetStateAction<string>>;
  setActiveGroupId: Dispatch<SetStateAction<string | 'all'>>;
  setDragTokenId: Dispatch<SetStateAction<string | null>>;
  setEditingCell: Dispatch<SetStateAction<EditingCell>>;
  setEditingCollectionId: Dispatch<SetStateAction<string | null>>;
  setEditingGroupId: Dispatch<SetStateAction<string | null>>;
  setSelectedTokenRef: (reference: TokenReference | null) => void;
  setSelectedTokenRefs: (references: TokenReference[], activeReference?: TokenReference | null) => void;
};
