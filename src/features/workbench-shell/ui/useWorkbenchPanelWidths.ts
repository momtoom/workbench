import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { beginWorkbenchHostPointerGesture } from './workbenchHostPointerGesture';

const SIDEBAR_DEFAULT_WIDTH = 220;
const SIDEBAR_MIN_WIDTH = 170;
const SIDEBAR_MAX_WIDTH = 420;
const INSPECTOR_DEFAULT_WIDTH = 280;
const INSPECTOR_MIN_WIDTH = 220;
const INSPECTOR_MAX_WIDTH = 480;
const WORKBENCH_PANEL_RESIZING_CLASS = 'wb-workbench-panel-resizing';

export type WorkbenchPanelWidths = {
  inspectorWidth: number;
  sidebarWidth: number;
};

export function useWorkbenchPanelWidths({
  initialInspectorWidth,
  initialSidebarWidth,
  onPanelWidthsChange,
}: {
  initialInspectorWidth?: number | null;
  initialSidebarWidth?: number | null;
  onPanelWidthsChange?: (widths: WorkbenchPanelWidths) => void;
} = {}) {
  const normalizedInitialSidebarWidth = normalizeWidth(initialSidebarWidth, {
    defaultValue: SIDEBAR_DEFAULT_WIDTH,
    max: SIDEBAR_MAX_WIDTH,
    min: SIDEBAR_MIN_WIDTH,
  });
  const normalizedInitialInspectorWidth = normalizeWidth(initialInspectorWidth, {
    defaultValue: INSPECTOR_DEFAULT_WIDTH,
    max: INSPECTOR_MAX_WIDTH,
    min: INSPECTOR_MIN_WIDTH,
  });
  const [sidebarWidth, setSidebarWidth] = useState(normalizedInitialSidebarWidth);
  const [inspectorWidth, setInspectorWidth] = useState(normalizedInitialInspectorWidth);

  useEffect(() => {
    setSidebarWidth(normalizedInitialSidebarWidth);
  }, [normalizedInitialSidebarWidth]);

  useEffect(() => {
    setInspectorWidth(normalizedInitialInspectorWidth);
  }, [normalizedInitialInspectorWidth]);

  function startSidebarWidthResize(event: ReactPointerEvent<HTMLButtonElement>) {
    startHorizontalResize(event, sidebarWidth, setSidebarWidth, {
      max: SIDEBAR_MAX_WIDTH,
      min: SIDEBAR_MIN_WIDTH,
      onCommit: (nextSidebarWidth) => {
        onPanelWidthsChange?.({ inspectorWidth, sidebarWidth: nextSidebarWidth });
      },
      sign: 1,
    });
  }

  function startInspectorWidthResize(event: ReactPointerEvent<HTMLButtonElement>) {
    startHorizontalResize(event, inspectorWidth, setInspectorWidth, {
      max: INSPECTOR_MAX_WIDTH,
      min: INSPECTOR_MIN_WIDTH,
      onCommit: (nextInspectorWidth) => {
        onPanelWidthsChange?.({ inspectorWidth: nextInspectorWidth, sidebarWidth });
      },
      sign: -1,
    });
  }

  return {
    inspectorWidth,
    sidebarWidth,
    startInspectorWidthResize,
    startSidebarWidthResize,
  };
}

function startHorizontalResize(
  event: ReactPointerEvent<HTMLButtonElement>,
  startWidth: number,
  setWidth: (width: number) => void,
  options: { max: number; min: number; onCommit?: (width: number) => void; sign: 1 | -1 },
) {
  event.preventDefault();
  event.stopPropagation();

  const resizeHandle = event.currentTarget;
  const pointerId = event.pointerId;
  const startX = event.clientX;
  let latestWidth = startWidth;
  let active = true;
  const endHostPointerGesture = beginWorkbenchHostPointerGesture(WORKBENCH_PANEL_RESIZING_CLASS);

  function handlePointerMove(pointerEvent: PointerEvent) {
    if (pointerEvent.pointerId !== pointerId) return;
    if (pointerEvent.cancelable) pointerEvent.preventDefault();
    const delta = (pointerEvent.clientX - startX) * options.sign;
    const nextWidth = startWidth + delta;
    latestWidth = normalizeWidth(nextWidth, {
      defaultValue: startWidth,
      max: options.max,
      min: options.min,
    });
    setWidth(latestWidth);
  }

  function stopResize(pointerEvent?: PointerEvent) {
    if (pointerEvent && pointerEvent.pointerId !== pointerId) return;
    if (!active) return;
    active = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
    window.removeEventListener('blur', handleWindowBlur);
    resizeHandle.removeEventListener('lostpointercapture', stopResize);
    endHostPointerGesture();
    if (resizeHandle.hasPointerCapture(pointerId)) {
      resizeHandle.releasePointerCapture(pointerId);
    }
    options.onCommit?.(latestWidth);
  }

  function handleWindowBlur() {
    stopResize();
  }

  resizeHandle.setPointerCapture(pointerId);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
  window.addEventListener('blur', handleWindowBlur);
  resizeHandle.addEventListener('lostpointercapture', stopResize);
}

function normalizeWidth(
  value: number | null | undefined,
  options: { defaultValue: number; max: number; min: number },
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return options.defaultValue;
  return Math.min(options.max, Math.max(options.min, Math.round(value)));
}
