import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { beginWorkbenchHostPointerGesture } from './workbenchHostPointerGesture';

type NumberScrubOptions = {
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  scrubStep?: number;
  value: number;
};

type StartScrubOptions = {
  onActivate?: () => void;
  preventDefaultOnPointerDown?: boolean;
  stopPropagation?: boolean;
};

type ScrubSession = {
  active: boolean;
  onActivate?: () => void;
  startValue: number;
  startX: number;
  startY: number;
  step: number;
};

const SCRUB_ACTIVATION_PX = 3;
const SCRUB_PIXELS_PER_STEP = 4;
const SCRUB_LOST_POINTER_TIMEOUT_MS = 2500;

export function useNumberScrub({
  max,
  min,
  onChange,
  scrubStep = 1,
  value,
}: NumberScrubOptions) {
  const sessionRef = useRef<ScrubSession | null>(null);
  const stopScrubRef = useRef<(() => void) | null>(null);
  const finiteValue = Number.isFinite(value) ? value : 0;
  const finiteStep = scrubStep > 0 && Number.isFinite(scrubStep) ? scrubStep : 1;

  useEffect(() => () => {
    stopScrubRef.current?.();
    document.body.classList.remove('wb-number-scrubbing');
  }, []);

  function applyValue(next: number, step: number = finiteStep) {
    onChange(normalizeScrubValue(next, min, max, step));
  }

  function startScrub(event: ReactPointerEvent<HTMLElement>, options: StartScrubOptions = {}) {
    if (event.button !== 0) return;
    if (options.preventDefaultOnPointerDown) event.preventDefault();
    if (options.stopPropagation) event.stopPropagation();
    stopScrubRef.current?.();
    const scrubHandle = event.currentTarget;
    const ownerDocument = scrubHandle.ownerDocument;
    const ownerWindow = ownerDocument.defaultView ?? window;
    const pointerId = event.pointerId;
    const captureLayer = createNumberScrubCaptureLayer(ownerDocument);
    const captureTarget = captureLayer ?? scrubHandle;
    let active = true;
    sessionRef.current = {
      active: false,
      onActivate: options.onActivate,
      startValue: normalizeScrubValue(finiteValue, min, max, finiteStep),
      startX: event.clientX,
      startY: event.clientY,
      step: finiteStep,
    };
    const viewportRoot = ownerDocument.documentElement;
    let lostPointerTimeout = ownerWindow.setTimeout(stop, SCRUB_LOST_POINTER_TIMEOUT_MS);
    const endHostPointerGesture = beginWorkbenchHostPointerGesture();
    try {
      captureTarget.setPointerCapture(pointerId);
    } catch {
      // Pointer capture can fail if the browser has already released the pointer.
    }

    function scheduleLostPointerStop() {
      ownerWindow.clearTimeout(lostPointerTimeout);
      lostPointerTimeout = ownerWindow.setTimeout(stop, SCRUB_LOST_POINTER_TIMEOUT_MS);
    }

    function stop(pointerEvent?: PointerEvent) {
      if (pointerEvent && pointerEvent.pointerId !== pointerId) return;
      if (!active) return;
      active = false;
      sessionRef.current = null;
      stopScrubRef.current = null;
      ownerWindow.clearTimeout(lostPointerTimeout);
      endHostPointerGesture();
      ownerDocument.body.classList.remove('wb-number-scrubbing');
      ownerWindow.removeEventListener('pointermove', move, true);
      ownerWindow.removeEventListener('pointerup', stop, true);
      ownerWindow.removeEventListener('pointercancel', stop, true);
      ownerWindow.removeEventListener('mouseup', handleMouseUp, true);
      ownerWindow.removeEventListener('blur', handleWindowBlur);
      ownerWindow.removeEventListener('contextmenu', handleContextMenu, true);
      captureTarget.removeEventListener('lostpointercapture', stop);
      viewportRoot.removeEventListener('mouseleave', handleViewportMouseLeave);
      ownerDocument.removeEventListener('focusin', handleFocusIn, true);
      ownerDocument.removeEventListener('visibilitychange', handleVisibilityChange);
      try {
        if (captureTarget.hasPointerCapture(pointerId)) captureTarget.releasePointerCapture(pointerId);
      } catch {
        // The pointer may have been released by the browser already.
      }
      captureLayer?.remove();
    }

    function move(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) return;
      const session = sessionRef.current;
      if (!session) return;
      scheduleLostPointerStop();
      if (pointerEvent.buttons === 0) {
        stop(pointerEvent);
        return;
      }
      if (isPointerOutsideViewport(pointerEvent, ownerWindow)) {
        stop();
        return;
      }
      const multiplier = pointerEvent.shiftKey ? 0.1 : pointerEvent.altKey ? 10 : 1;
      const deltaX = pointerEvent.clientX - session.startX;
      const deltaY = pointerEvent.clientY - session.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!session.active) {
        if (absX < SCRUB_ACTIVATION_PX && absY < SCRUB_ACTIVATION_PX) return;
        if (absX <= absY) return;
        session.active = true;
        session.onActivate?.();
        ownerDocument.body.classList.add('wb-number-scrubbing');
      }

      pointerEvent.preventDefault();
      const effectiveStep = session.step * multiplier;
      const activationOffset = Math.sign(deltaX) * SCRUB_ACTIVATION_PX;
      const scrubSteps = (deltaX - activationOffset) / SCRUB_PIXELS_PER_STEP;
      applyValue(session.startValue + scrubSteps * effectiveStep, effectiveStep);
    }

    function handleMouseUp() {
      stop();
    }

    function handleWindowBlur() {
      stop();
    }

    function handleContextMenu() {
      stop();
    }

    function handleViewportMouseLeave() {
      stop();
    }

    function handleFocusIn() {
      if (!sessionRef.current?.active) return;
      stop();
    }

    function handleVisibilityChange() {
      if (ownerDocument.visibilityState === 'visible') return;
      stop();
    }

    stopScrubRef.current = stop;
    ownerWindow.addEventListener('pointermove', move, true);
    ownerWindow.addEventListener('pointerup', stop, true);
    ownerWindow.addEventListener('pointercancel', stop, true);
    ownerWindow.addEventListener('mouseup', handleMouseUp, true);
    ownerWindow.addEventListener('blur', handleWindowBlur);
    ownerWindow.addEventListener('contextmenu', handleContextMenu, true);
    captureTarget.addEventListener('lostpointercapture', stop);
    viewportRoot.addEventListener('mouseleave', handleViewportMouseLeave);
    ownerDocument.addEventListener('focusin', handleFocusIn, true);
    ownerDocument.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function nudgeValue(direction: 1 | -1, multiplier: number = 1) {
    const effectiveStep = finiteStep * multiplier;
    applyValue(getDirectionalStepValue(finiteValue, direction, effectiveStep, min), effectiveStep);
  }

  return {
    finiteValue,
    nudgeValue,
    startScrub,
  };
}

export function normalizeScrubValue(value: number, min: number | undefined, max: number | undefined, step: number): number {
  const finiteStep = step > 0 && Number.isFinite(step) ? step : 1;
  const bounded = clamp(value, min, max);
  const snapped = snapToStep(bounded, finiteStep, min);
  return roundForStep(clamp(snapped, min, max), finiteStep);
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  const finite = Number.isFinite(value) ? value : 0;
  return Math.max(min ?? -Infinity, Math.min(max ?? Infinity, finite));
}

function roundForStep(value: number, step: number): number {
  const precision = getStepPrecision(step);
  return Number(value.toFixed(Math.min(6, precision)));
}

function snapToStep(value: number, step: number, min: number | undefined): number {
  const base = typeof min === 'number' && Number.isFinite(min) ? min : 0;
  return base + Math.round((value - base) / step) * step;
}

function getDirectionalStepValue(value: number, direction: 1 | -1, step: number, min: number | undefined): number {
  const finite = Number.isFinite(value) ? value : 0;
  const base = typeof min === 'number' && Number.isFinite(min) ? min : 0;
  const offset = (finite - base) / step;
  const nextOffset = direction > 0 ? Math.floor(offset) + 1 : Math.ceil(offset) - 1;
  return base + nextOffset * step;
}

function isPointerOutsideViewport(pointerEvent: PointerEvent, ownerWindow: Window): boolean {
  return pointerEvent.clientX < 0 ||
    pointerEvent.clientY < 0 ||
    pointerEvent.clientX > ownerWindow.innerWidth ||
    pointerEvent.clientY > ownerWindow.innerHeight;
}

function createNumberScrubCaptureLayer(ownerDocument: Document): HTMLDivElement | null {
  const ownerBody = ownerDocument.body;
  if (!ownerBody) return null;
  const layer = ownerDocument.createElement('div');
  layer.className = 'wb-number-scrub-capture-layer';
  layer.setAttribute('aria-hidden', 'true');
  ownerBody.appendChild(layer);
  return layer;
}

function getStepPrecision(step: number): number {
  const normalized = step.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
  const decimal = normalized.split('.')[1];
  return decimal?.length ?? 0;
}
