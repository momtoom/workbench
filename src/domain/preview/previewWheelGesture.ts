export type PreviewSnapWheelGestureState = {
  delta: number;
  handled: boolean;
  handledAt: number;
  lastDirection: number;
  lastEventTime: number;
  restartArmed: boolean;
  restartBaselineMagnitude: number;
};

export type PreviewSnapWheelGestureStates = WeakMap<HTMLElement, PreviewSnapWheelGestureState>;

const PREVIEW_SNAP_WHEEL_GESTURE_GAP_MS = 160;
const PREVIEW_SNAP_WHEEL_RESTART_DELAY_MS = 100;
const PREVIEW_SNAP_WHEEL_RESTART_DELTA = 8;
const PREVIEW_SNAP_WHEEL_RESTART_RATIO = 1.75;
const PREVIEW_SNAP_WHEEL_TAIL_DELTA = 4;
const PREVIEW_SNAP_WHEEL_SCROLL_THRESHOLD = 24;

export function createPreviewSnapWheelGestureStates(): PreviewSnapWheelGestureStates {
  return new WeakMap<HTMLElement, PreviewSnapWheelGestureState>();
}

export function isPreviewWheelOwnedByScrollTarget(
  event: WheelEvent,
  scrollTarget: HTMLElement,
): boolean {
  const target = event.target;
  return Boolean(
    target &&
    typeof target === 'object' &&
    typeof (target as Node).nodeType === 'number' &&
    scrollTarget.contains(target as Node),
  );
}

export function handlePreviewSnapWheelGesture({
  event,
  scrollTarget,
  deltaX,
  deltaY,
  states,
}: {
  event: WheelEvent;
  scrollTarget: HTMLElement;
  deltaX: number;
  deltaY: number;
  states: PreviewSnapWheelGestureStates;
}): boolean {
  const ownerWindow = scrollTarget.ownerDocument.defaultView;
  const scrollSnapType = ownerWindow?.getComputedStyle(scrollTarget).scrollSnapType
    .trim()
    .toLowerCase() ?? 'none';
  if (!scrollSnapType || scrollSnapType === 'none') return false;

  const snapAxis = scrollSnapType.split(/\s+/)[0];
  const horizontal = snapAxis === 'x' || snapAxis === 'inline' ||
    (snapAxis === 'both' && Math.abs(deltaX) > Math.abs(deltaY));
  const vertical = snapAxis === 'y' || snapAxis === 'block' ||
    (snapAxis === 'both' && Math.abs(deltaY) >= Math.abs(deltaX));
  const axisDelta = horizontal ? deltaX : vertical ? deltaY : 0;
  const crossAxisDelta = horizontal ? deltaY : vertical ? deltaX : 0;
  if (
    Math.abs(axisDelta) < 2 ||
    Math.abs(axisDelta) <= Math.abs(crossAxisDelta) ||
    !event.cancelable
  ) return false;

  event.preventDefault();
  const eventTime = event.timeStamp || Date.now();
  const direction = Math.sign(axisDelta);
  const deltaMagnitude = Math.abs(axisDelta);
  const previousState = states.get(scrollTarget);
  const eventGap = previousState ? eventTime - previousState.lastEventTime : Number.POSITIVE_INFINITY;
  const directionChanged = Boolean(previousState && previousState.lastDirection !== direction);

  if (
    previousState?.handled &&
    eventTime - previousState.handledAt >= PREVIEW_SNAP_WHEEL_RESTART_DELAY_MS &&
    deltaMagnitude <= PREVIEW_SNAP_WHEEL_TAIL_DELTA
  ) {
    previousState.restartArmed = true;
    previousState.restartBaselineMagnitude = Math.min(
      previousState.restartBaselineMagnitude,
      deltaMagnitude,
    );
  }

  const restartedAfterMomentumTail = Boolean(
    previousState?.handled &&
    previousState.restartArmed &&
    deltaMagnitude >= PREVIEW_SNAP_WHEEL_RESTART_DELTA &&
    (
      directionChanged ||
      deltaMagnitude >= previousState.restartBaselineMagnitude * PREVIEW_SNAP_WHEEL_RESTART_RATIO
    )
  );
  const startsNewGesture = !previousState ||
    eventGap > PREVIEW_SNAP_WHEEL_GESTURE_GAP_MS ||
    (!previousState.handled && directionChanged) ||
    restartedAfterMomentumTail;
  const state = startsNewGesture
    ? {
        delta: 0,
        handled: false,
        handledAt: 0,
        lastDirection: direction,
        lastEventTime: eventTime,
        restartArmed: false,
        restartBaselineMagnitude: Number.POSITIVE_INFINITY,
      }
    : previousState;
  state.lastDirection = direction;
  state.lastEventTime = eventTime;
  states.set(scrollTarget, state);

  // Native CSS snapping treats every programmatic scrollBy call as a new
  // operation. A trackpad or Magic Mouse momentum stream therefore raced
  // through one card per wheel event. Advance once, then consume the tail
  // until an idle gap or fresh post-tail acceleration starts a new gesture.
  if (state.handled) return true;

  state.delta += axisDelta;
  if (Math.abs(state.delta) < PREVIEW_SNAP_WHEEL_SCROLL_THRESHOLD) return true;
  // The first event itself can be very large in the in-app browser bridge
  // (for example deltaX=1200 for one trackpad swipe). Passing that magnitude
  // through still skips several mandatory snap points even though the
  // momentum tail is coalesced. Resolve the next authored snap point instead
  // of guessing a pixel nudge, which can either skip cards or snap back.
  state.handled = true;
  state.handledAt = eventTime;
  state.delta = 0;
  if (!scrollPreviewSnapTargetByOne(scrollTarget, horizontal ? 'horizontal' : 'vertical', direction)) {
    const fallbackDelta = direction * PREVIEW_SNAP_WHEEL_SCROLL_THRESHOLD;
    scrollTarget.scrollBy({
      left: horizontal ? fallbackDelta : 0,
      top: vertical ? fallbackDelta : 0,
      behavior: 'auto',
    });
  }
  return true;
}

function scrollPreviewSnapTargetByOne(
  scrollTarget: HTMLElement,
  axis: 'horizontal' | 'vertical',
  direction: number,
): boolean {
  const ownerWindow = scrollTarget.ownerDocument.defaultView;
  if (!ownerWindow || direction === 0) return false;

  const horizontal = axis === 'horizontal';
  const currentPosition = horizontal ? scrollTarget.scrollLeft : scrollTarget.scrollTop;
  const maxPosition = horizontal
    ? scrollTarget.scrollWidth - scrollTarget.clientWidth
    : scrollTarget.scrollHeight - scrollTarget.clientHeight;
  const targetRect = scrollTarget.getBoundingClientRect();
  const viewportStart = horizontal
    ? targetRect.left + scrollTarget.clientLeft
    : targetRect.top + scrollTarget.clientTop;
  const viewportSize = horizontal ? scrollTarget.clientWidth : scrollTarget.clientHeight;
  const targetStyle = ownerWindow.getComputedStyle(scrollTarget);
  const paddingStart = parsePreviewSnapPadding(
    horizontal ? targetStyle.scrollPaddingLeft : targetStyle.scrollPaddingTop,
  );
  const paddingEnd = parsePreviewSnapPadding(
    horizontal ? targetStyle.scrollPaddingRight : targetStyle.scrollPaddingBottom,
  );
  const positions: number[] = [];

  for (const candidate of scrollTarget.querySelectorAll<HTMLElement>('*')) {
    const candidateStyle = ownerWindow.getComputedStyle(candidate);
    const snapAlign = getPreviewSnapAlignment(candidateStyle.scrollSnapAlign, horizontal);
    if (snapAlign === 'none') continue;
    if (getPreviewSnapScrollOwner(candidate, scrollTarget, ownerWindow) !== scrollTarget) continue;

    const rect = candidate.getBoundingClientRect();
    const candidateStart = horizontal ? rect.left : rect.top;
    const candidateEnd = horizontal ? rect.right : rect.bottom;
    const candidateSize = horizontal ? rect.width : rect.height;
    let position = currentPosition + candidateStart - viewportStart - paddingStart;
    if (snapAlign === 'center') {
      position = currentPosition + candidateStart + candidateSize / 2 - viewportStart - viewportSize / 2;
    } else if (snapAlign === 'end') {
      position = currentPosition + candidateEnd - viewportStart - viewportSize + paddingEnd;
    }
    const clampedPosition = Math.min(maxPosition, Math.max(0, position));
    if (!positions.some((entry) => Math.abs(entry - clampedPosition) <= 1)) {
      positions.push(clampedPosition);
    }
  }

  positions.sort((left, right) => left - right);
  let nextPosition: number | undefined;
  if (direction > 0) {
    nextPosition = positions.find((position) => position > currentPosition + 1);
  } else {
    for (let index = positions.length - 1; index >= 0; index -= 1) {
      if (positions[index] < currentPosition - 1) {
        nextPosition = positions[index];
        break;
      }
    }
  }
  if (nextPosition == null) return false;

  scrollTarget.scrollTo({
    left: horizontal ? nextPosition : scrollTarget.scrollLeft,
    top: horizontal ? scrollTarget.scrollTop : nextPosition,
    behavior: 'auto',
  });
  return true;
}

function getPreviewSnapScrollOwner(
  candidate: HTMLElement,
  scrollTarget: HTMLElement,
  ownerWindow: Window,
): HTMLElement | null {
  let current = candidate.parentElement;
  while (current && current !== scrollTarget) {
    if (ownerWindow.getComputedStyle(current).scrollSnapType !== 'none') return current;
    current = current.parentElement;
  }
  return current === scrollTarget ? scrollTarget : null;
}

function getPreviewSnapAlignment(value: string, horizontal: boolean): 'start' | 'center' | 'end' | 'none' {
  const parts = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts[0] === 'none') return 'none';
  const alignment = parts.length === 1 ? parts[0] : horizontal ? parts[1] : parts[0];
  return alignment === 'start' || alignment === 'center' || alignment === 'end'
    ? alignment
    : 'none';
}

function parsePreviewSnapPadding(value: string): number {
  if (!value.endsWith('px')) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
