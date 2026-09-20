import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { TokenMode } from '@domain/design-system/tokens/types';

const TOKEN_NAME_COLUMN_DEFAULT_WIDTH = 240;
const TOKEN_NAME_COLUMN_MIN_WIDTH = 160;
const TOKEN_MODE_COLUMN_DEFAULT_WIDTH = 240;
const TOKEN_MODE_COLUMN_MIN_WIDTH = 180;
const TOKEN_ACTION_COLUMN_MIN_WIDTH = 44;

export type TokenTableColumnWidths = Record<string, number>;

export type TokenTableColumnLayout = {
  dataTableWidth: number;
  modeColumnWidths: number[];
  nameColumnWidth: number;
  tableMinWidth: number;
  tableWidth: string;
};

type UseTokenTableLayoutOptions = {
  initialColumnWidths?: TokenTableColumnWidths;
  layoutKey?: string;
  onColumnWidthsChange?: (widths: TokenTableColumnWidths) => void;
};

export function useTokenTableLayout(
  modes: TokenMode[],
  {
    initialColumnWidths,
    layoutKey = '',
    onColumnWidthsChange,
  }: UseTokenTableLayoutOptions = {},
) {
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const layoutKeyRef = useRef(layoutKey);
  const columnWidthsRef = useRef<TokenTableColumnWidths>(sanitizeTokenTableColumnWidths(initialColumnWidths));
  const [columnWidths, setColumnWidths] = useState<TokenTableColumnWidths>(() => columnWidthsRef.current);
  const [tableWrapWidth, setTableWrapWidth] = useState(0);
  const columnLayout = getTokenTableColumnLayout(modes, columnWidths);

  useEffect(() => {
    if (layoutKeyRef.current === layoutKey) return;
    layoutKeyRef.current = layoutKey;
    const nextWidths = sanitizeTokenTableColumnWidths(initialColumnWidths);
    columnWidthsRef.current = nextWidths;
    setColumnWidths(nextWidths);
  }, [initialColumnWidths, layoutKey]);

  useEffect(() => {
    const tableWrap = tableWrapRef.current;
    if (!tableWrap) return;
    if (columnLayout.dataTableWidth <= tableWrapWidth) {
      tableWrap.scrollLeft = 0;
    }
  }, [columnLayout.dataTableWidth, tableWrapWidth]);

  useEffect(() => {
    const tableWrap = tableWrapRef.current;
    if (!tableWrap) return;
    const observedTableWrap = tableWrap;

    function updateTableWrapWidth() {
      setTableWrapWidth(observedTableWrap.clientWidth);
    }

    updateTableWrapWidth();
    const observer = new ResizeObserver(updateTableWrapWidth);
    observer.observe(observedTableWrap);
    return () => observer.disconnect();
  }, []);

  function startNameColumnResize(event: ReactPointerEvent<HTMLButtonElement>) {
    startColumnResize('name', TOKEN_NAME_COLUMN_DEFAULT_WIDTH, TOKEN_NAME_COLUMN_MIN_WIDTH, event);
  }

  function startModeColumnResize(modeId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    startColumnResize(getTokenModeColumnKey(modeId), TOKEN_MODE_COLUMN_DEFAULT_WIDTH, TOKEN_MODE_COLUMN_MIN_WIDTH, event);
  }

  function startColumnResize(
    key: string,
    fallbackWidth: number,
    minWidth: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const resizeHandle = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = getTokenTableColumnWidth(columnWidths, key, fallbackWidth);
    let pendingWidth = startWidth;
    let resizeFrameId: number | null = null;

    function commitWidth(nextWidth: number, notify = false) {
      const current = columnWidthsRef.current;
      const next = current[key] === nextWidth ? current : { ...current, [key]: nextWidth };
      if (next !== current) {
        columnWidthsRef.current = next;
        setColumnWidths(next);
      }
      if (notify) onColumnWidthsChange?.(next);
    }

    function scheduleWidth(nextWidth: number) {
      pendingWidth = nextWidth;
      if (resizeFrameId !== null) return;
      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        commitWidth(pendingWidth);
      });
    }

    function handlePointerMove(pointerEvent: PointerEvent) {
      pointerEvent.preventDefault();
      const nextWidth = Math.max(minWidth, Math.round(startWidth + pointerEvent.clientX - startX));
      scheduleWidth(nextWidth);
    }

    function handlePointerUp() {
      cleanupResize();
    }

    function cleanupResize() {
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
        resizeFrameId = null;
      }
      commitWidth(pendingWidth, true);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', cleanupResize);
      window.removeEventListener('blur', cleanupResize);
      resizeHandle.removeEventListener('pointermove', handlePointerMove);
      resizeHandle.removeEventListener('pointerup', handlePointerUp);
      resizeHandle.removeEventListener('pointercancel', cleanupResize);
      resizeHandle.removeEventListener('lostpointercapture', cleanupResize);
      if (resizeHandle.hasPointerCapture(pointerId)) {
        resizeHandle.releasePointerCapture(pointerId);
      }
    }

    resizeHandle.setPointerCapture(pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', cleanupResize);
    window.addEventListener('blur', cleanupResize);
    resizeHandle.addEventListener('pointermove', handlePointerMove);
    resizeHandle.addEventListener('pointerup', handlePointerUp);
    resizeHandle.addEventListener('pointercancel', cleanupResize);
    resizeHandle.addEventListener('lostpointercapture', cleanupResize);
  }

  return {
    columnLayout,
    startModeColumnResize,
    startNameColumnResize,
    tableWrapRef,
  };
}

function sanitizeTokenTableColumnWidths(widths: TokenTableColumnWidths | undefined): TokenTableColumnWidths {
  if (!widths) return {};
  return Object.fromEntries(
    Object.entries(widths).filter((entry): entry is [string, number] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      Number.isFinite(entry[1]) &&
      entry[1] > 0
    )),
  );
}

function getTokenTableColumnWidth(widths: TokenTableColumnWidths, key: string, fallback: number, minWidth = 0): number {
  return Math.max(minWidth, widths[key] ?? fallback);
}

function getTokenModeColumnKey(modeId: string): string {
  return `mode:${modeId}`;
}

function getTokenTableColumnLayout(
  modes: TokenMode[],
  columnWidths: TokenTableColumnWidths,
): TokenTableColumnLayout {
  const nameColumnWidth = getTokenTableColumnWidth(columnWidths, 'name', TOKEN_NAME_COLUMN_DEFAULT_WIDTH, TOKEN_NAME_COLUMN_MIN_WIDTH);
  const modeColumnWidths = modes.map((mode) =>
    getTokenTableColumnWidth(columnWidths, getTokenModeColumnKey(mode.id), TOKEN_MODE_COLUMN_DEFAULT_WIDTH, TOKEN_MODE_COLUMN_MIN_WIDTH),
  );
  const dataTableWidth = nameColumnWidth + modeColumnWidths.reduce((total, width) => total + width, 0);
  return {
    dataTableWidth,
    modeColumnWidths,
    nameColumnWidth,
    tableMinWidth: dataTableWidth + TOKEN_ACTION_COLUMN_MIN_WIDTH,
    tableWidth: '100%',
  };
}
