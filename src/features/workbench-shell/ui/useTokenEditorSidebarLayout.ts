import type { PointerEvent as ReactPointerEvent } from 'react';
import { useWorkbenchSidebarSplitLayout } from './useWorkbenchSidebarSplitLayout';

export function useTokenEditorSidebarLayout({
  initialCollectionListHeight,
  onCollectionListHeightChange,
}: {
  initialCollectionListHeight?: number | null;
  onCollectionListHeightChange?: (height: number) => void;
} = {}) {
  const {
    primaryListHeight,
    sidebarRef,
    startSidebarSplitResize,
  } = useWorkbenchSidebarSplitLayout({
    initialPrimaryHeight: initialCollectionListHeight,
    onPrimaryHeightChange: onCollectionListHeightChange,
  });

  function startSidebarPanelResize(event: ReactPointerEvent<HTMLButtonElement>) {
    startSidebarSplitResize(event);
  }

  return {
    collectionListHeight: primaryListHeight,
    sidebarRef,
    startSidebarPanelResize,
  };
}
