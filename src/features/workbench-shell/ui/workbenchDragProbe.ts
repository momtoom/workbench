/**
 * Opt-in instrumentation for "canvas drag moves the wrong node".
 *
 * Off unless `window.__wbDragProbe` is set to an array before the gesture, so
 * it costs a property read per pointerdown and nothing else. It exists because
 * the question — does the wrong node arrive at pointerdown, or between
 * pointerdown and the commit — cannot be answered by reading the source file
 * afterwards: the source path sits behind an async edit queue and a 600 ms
 * debounced save, so an early read looks exactly like a failure either way.
 *
 * Usage from a driving script:
 *
 *   window.__wbDragProbe = [];
 *   // ... perform the drag ...
 *   window.__wbDragProbe   // ordered records
 */

export type WorkbenchDragProbeRecord = {
  phase: string;
  detail: Record<string, unknown>;
};

type DragProbeWindow = Window & { __wbDragProbe?: WorkbenchDragProbeRecord[] };

export function recordWorkbenchDragProbe(phase: string, detail: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const probe = (window as DragProbeWindow).__wbDragProbe;
  if (!Array.isArray(probe)) return;
  probe.push({ phase, detail });
}

/** Enough to identify the pressed element without serializing a DOM node. */
export function describeWorkbenchDragProbeElement(target: unknown): string | null {
  if (!(target instanceof Element)) return null;
  const classes = typeof target.className === 'string' && target.className.trim()
    ? `.${target.className.trim().split(/\s+/).join('.')}`
    : '';
  const text = (target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  return `${target.tagName.toLowerCase()}${classes}${text ? ` "${text}"` : ''}`;
}
