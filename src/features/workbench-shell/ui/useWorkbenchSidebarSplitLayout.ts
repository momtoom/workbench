import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const DEFAULT_PRIMARY_LIST_HEIGHT = 220;
const DEFAULT_PRIMARY_LIST_MIN_HEIGHT = 96;
const DEFAULT_SECONDARY_LIST_MIN_HEIGHT = 140;
const DEFAULT_FIXED_CHROME_HEIGHT = 116;

type WorkbenchSidebarSplitLayoutOptions = {
  defaultPrimaryHeight?: number;
  fixedChromeHeight?: number;
  initialPrimaryHeight?: number | null;
  onPrimaryHeightChange?: (height: number) => void;
  primaryMinHeight?: number;
  secondaryMinHeight?: number;
};

export function useWorkbenchSidebarSplitLayout({
  defaultPrimaryHeight = DEFAULT_PRIMARY_LIST_HEIGHT,
  fixedChromeHeight = DEFAULT_FIXED_CHROME_HEIGHT,
  initialPrimaryHeight,
  onPrimaryHeightChange,
  primaryMinHeight = DEFAULT_PRIMARY_LIST_MIN_HEIGHT,
  secondaryMinHeight = DEFAULT_SECONDARY_LIST_MIN_HEIGHT,
}: WorkbenchSidebarSplitLayoutOptions = {}) {
  const sidebarRef = useRef<HTMLElement>(null);
  const [primaryListHeight, setPrimaryListHeight] = useState(initialPrimaryHeight ?? defaultPrimaryHeight);

  useEffect(() => {
    if (initialPrimaryHeight === undefined || initialPrimaryHeight === null) return;
    setPrimaryListHeight(initialPrimaryHeight);
  }, [initialPrimaryHeight]);

  function startSidebarSplitResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    event.preventDefault();

    const startY = event.clientY;
    const startHeight = primaryListHeight;
    let committedHeight = primaryListHeight;
    const sidebarHeight = sidebar.getBoundingClientRect().height;
    const maxPrimaryHeight = Math.max(
      primaryMinHeight,
      sidebarHeight - secondaryMinHeight - fixedChromeHeight,
    );

    function handlePointerMove(pointerEvent: PointerEvent) {
      const nextHeight = startHeight + pointerEvent.clientY - startY;
      committedHeight = Math.min(maxPrimaryHeight, Math.max(primaryMinHeight, nextHeight));
      setPrimaryListHeight(committedHeight);
    }

    function stopResize() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      onPrimaryHeightChange?.(committedHeight);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
  }

  return {
    primaryListHeight,
    sidebarRef,
    startSidebarSplitResize,
  };
}
