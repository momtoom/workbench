import { Carousel } from '@astryxdesign/core/Carousel';
import { useCallback, useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode, type WheelEvent as ReactWheelEvent } from 'react';
import { cx } from './classNames';

const ASTRYX_CAROUSEL_WHEEL_GESTURE_GAP_MS = 96;
const ASTRYX_CAROUSEL_WHEEL_GESTURE_RESTART_MS = 120;
const ASTRYX_CAROUSEL_WHEEL_RESTART_DELTA = 8;
const ASTRYX_CAROUSEL_WHEEL_RESTART_RATIO = 1.75;
const ASTRYX_CAROUSEL_WHEEL_SCROLL_THRESHOLD = 24;
const ASTRYX_CAROUSEL_SCROLL_SETTLE_MS = 120;
const ASTRYX_CAROUSEL_SNAP_EPSILON_PX = 1;

export type AstryxCarouselGap = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4;
export type AstryxCarouselSpacing =
  | AstryxCarouselGap
  | 5
  | 6
  | 8
  | 10
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl';
export type AstryxCarouselPadding = AstryxCarouselSpacing | number;
export type AstryxCarouselEdgeFadeSize = 'sm' | 'md' | 'lg' | 'xl';
type AstryxCarouselStyleVars = CSSProperties & {
  '--astryx-wb-carousel-gap'?: string;
  '--astryx-wb-carousel-padding-start'?: string;
  '--astryx-wb-carousel-padding-end'?: string;
  '--astryx-wb-carousel-items-per-view'?: number;
  '--astryx-wb-carousel-item-basis'?: string;
  '--astryx-wb-carousel-item-min-width'?: string;
  '--astryx-wb-carousel-item-max-width'?: string;
};

type AstryxCarouselRootProps = Omit<
  ComponentPropsWithoutRef<typeof Carousel>,
  'aria-label' | 'children' | 'className' | 'gap' | 'hasButtons' | 'hasEdgeFade' | 'hasSnap' | 'padding'
>;

export interface AstryxCarouselProps extends AstryxCarouselRootProps {
  label?: string;
  gap?: AstryxCarouselSpacing | number;
  hasButtons?: boolean;
  hasEdgeFade?: boolean;
  edgeFadeSize?: AstryxCarouselEdgeFadeSize;
  hasSnap?: boolean;
  padding?: AstryxCarouselPadding;
  paddingStart?: AstryxCarouselPadding;
  paddingEnd?: AstryxCarouselPadding;
  innerPadding?: AstryxCarouselPadding;
  innerPaddingStart?: AstryxCarouselPadding;
  innerPaddingEnd?: AstryxCarouselPadding;
  itemsPerView?: number;
  itemMinWidth?: string;
  itemMaxWidth?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxCarousel({
  label = 'Featured carousel',
  gap = 1,
  hasButtons = true,
  hasEdgeFade = true,
  edgeFadeSize = 'lg',
  hasSnap = false,
  padding,
  paddingStart,
  paddingEnd,
  innerPadding,
  innerPaddingStart,
  innerPaddingEnd,
  itemsPerView,
  itemMinWidth,
  itemMaxWidth,
  className,
  children,
  style,
  onWheel,
  ...rootProps
}: AstryxCarouselProps) {
  const carouselRootRef = useRef<HTMLDivElement | null>(null);
  const targetSnapIndexRef = useRef<number | null>(null);
  const wheelGestureDeltaRef = useRef(0);
  const wheelGestureHandledAtRef = useRef(0);
  const wheelGestureHandledRef = useRef(false);
  const wheelLastDeltaMagnitudeRef = useRef(0);
  const wheelLastDirectionRef = useRef(0);
  const wheelLastEventTimeRef = useRef(0);
  const scrollSettleTimerRef = useRef<number | null>(null);
  const isStandalonePagePreview = typeof document !== 'undefined' &&
    document.documentElement.hasAttribute('data-page-preview-runtime');
  const resolvedHasButtons = isStandalonePagePreview ? false : hasButtons;
  const effectivePadding = resolveAstryxCarouselPaddingBase(padding, innerPadding);
  const gapValue = resolveAstryxCarouselSpacingValue(gap);
  const paddingStartValue = resolveAstryxCarouselSidePaddingValue(
    paddingStart,
    innerPaddingStart,
    effectivePadding,
  );
  const paddingEndValue = resolveAstryxCarouselSidePaddingValue(
    paddingEnd,
    innerPaddingEnd,
    effectivePadding,
  );
  const resolvedItemsPerView = resolveAstryxCarouselItemsPerView(itemsPerView);
  const itemMinWidthValue = resolveAstryxCarouselLength(itemMinWidth);
  const itemMaxWidthValue = resolveAstryxCarouselLength(itemMaxWidth);
  const hasPadding = Boolean(paddingStartValue || paddingEndValue);
  const hasItemSizing = Boolean(resolvedItemsPerView || itemMinWidthValue || itemMaxWidthValue);
  const resolvedStyle = gapValue || hasPadding || hasItemSizing
    ? ({
        ...style,
        '--astryx-wb-carousel-gap': gapValue,
        '--astryx-wb-carousel-padding-start': paddingStartValue,
        '--astryx-wb-carousel-padding-end': paddingEndValue,
        '--astryx-wb-carousel-items-per-view': resolvedItemsPerView,
        '--astryx-wb-carousel-item-basis': resolvedItemsPerView
          ? `calc((100% - (var(--astryx-wb-carousel-gap, 0px) * ${resolvedItemsPerView - 1})) / ${resolvedItemsPerView})`
          : undefined,
        '--astryx-wb-carousel-item-min-width': itemMinWidthValue,
        '--astryx-wb-carousel-item-max-width': itemMaxWidthValue,
      } satisfies AstryxCarouselStyleVars)
    : style;
  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    onWheel?.(event);
    if (event.defaultPrevented || !hasSnap) return;

    const scroller = findAstryxCarouselScroller(event.currentTarget);
    if (!scroller) return;

    const deltaX = normalizeAstryxCarouselWheelDelta(event.deltaX, event.deltaMode, scroller, 'x');
    const deltaY = normalizeAstryxCarouselWheelDelta(event.deltaY, event.deltaMode, scroller, 'y');
    const shiftedHorizontalWheel = event.shiftKey && Math.abs(deltaY) > Math.abs(deltaX);
    const horizontalDelta = shiftedHorizontalWheel ? deltaY : deltaX;
    const crossAxisDelta = shiftedHorizontalWheel ? 0 : deltaY;
    if (Math.abs(horizontalDelta) < 2 || Math.abs(horizontalDelta) <= Math.abs(crossAxisDelta)) return;

    const snapPositions = getAstryxCarouselSnapPositions(scroller);
    if (snapPositions.length <= 1) return;

    // Native scrollLeft moves throughout smooth scrolling. Keep the commanded
    // snap index authoritative, matching Embla's selected-snap behavior.
    const currentTargetIndex = resolveAstryxCarouselTargetSnapIndex(
      targetSnapIndexRef.current,
      snapPositions,
      scroller.scrollLeft,
    );
    targetSnapIndexRef.current = currentTargetIndex;

    const eventTime = event.timeStamp || performance.now();
    const deltaMagnitude = Math.abs(horizontalDelta);
    const direction = Math.sign(horizontalDelta);
    const eventGap = wheelLastEventTimeRef.current === 0
      ? Number.POSITIVE_INFINITY
      : eventTime - wheelLastEventTimeRef.current;
    const directionChanged = wheelLastDirectionRef.current !== 0 && direction !== wheelLastDirectionRef.current;
    const acceleratedRestart =
      wheelGestureHandledRef.current &&
      eventTime - wheelGestureHandledAtRef.current >= ASTRYX_CAROUSEL_WHEEL_GESTURE_RESTART_MS &&
      deltaMagnitude >= ASTRYX_CAROUSEL_WHEEL_RESTART_DELTA &&
      deltaMagnitude >= wheelLastDeltaMagnitudeRef.current * ASTRYX_CAROUSEL_WHEEL_RESTART_RATIO;

    if (eventGap > ASTRYX_CAROUSEL_WHEEL_GESTURE_GAP_MS || directionChanged || acceleratedRestart) {
      wheelGestureDeltaRef.current = 0;
      wheelGestureHandledRef.current = false;
    }
    wheelLastDeltaMagnitudeRef.current = deltaMagnitude;
    wheelLastDirectionRef.current = direction;
    wheelLastEventTimeRef.current = eventTime;

    const canMove = direction < 0
      ? currentTargetIndex > 0
      : currentTargetIndex < snapPositions.length - 1;
    if (!canMove) return;

    event.preventDefault();
    if (wheelGestureHandledRef.current) return;
    if (
      wheelGestureDeltaRef.current !== 0 &&
      Math.sign(wheelGestureDeltaRef.current) !== direction
    ) {
      wheelGestureDeltaRef.current = 0;
    }
    wheelGestureDeltaRef.current += horizontalDelta;
    if (Math.abs(wheelGestureDeltaRef.current) < ASTRYX_CAROUSEL_WHEEL_SCROLL_THRESHOLD) return;

    wheelGestureHandledRef.current = true;
    wheelGestureHandledAtRef.current = eventTime;
    const nextTargetIndex = currentTargetIndex + (wheelGestureDeltaRef.current < 0 ? -1 : 1);
    wheelGestureDeltaRef.current = 0;
    targetSnapIndexRef.current = nextTargetIndex;
    scrollAstryxCarouselToSnapIndex(scroller, snapPositions, nextTargetIndex);
  }, [hasSnap, onWheel]);

  useEffect(() => {
    const root = carouselRootRef.current;
    if (!root) return;
    const scroller = findAstryxCarouselScroller(root);
    if (!scroller) return;

    if (!hasSnap) {
      targetSnapIndexRef.current = null;
      wheelGestureDeltaRef.current = 0;
      wheelGestureHandledAtRef.current = 0;
      wheelGestureHandledRef.current = false;
      wheelLastDeltaMagnitudeRef.current = 0;
      wheelLastDirectionRef.current = 0;
      wheelLastEventTimeRef.current = 0;
      return;
    }

    const syncTargetSnapIndex = () => {
      clearAstryxCarouselTimer(scrollSettleTimerRef);
      scrollSettleTimerRef.current = window.setTimeout(() => {
        scrollSettleTimerRef.current = null;
        const snapPositions = getAstryxCarouselSnapPositions(scroller);
        targetSnapIndexRef.current = snapPositions.length > 0
          ? findNearestAstryxCarouselSnapIndex(snapPositions, scroller.scrollLeft)
          : null;
      }, ASTRYX_CAROUSEL_SCROLL_SETTLE_MS);
    };

    const snapPositions = getAstryxCarouselSnapPositions(scroller);
    targetSnapIndexRef.current = snapPositions.length > 0
      ? findNearestAstryxCarouselSnapIndex(snapPositions, scroller.scrollLeft)
      : null;

    scroller.addEventListener('scroll', syncTargetSnapIndex, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', syncTargetSnapIndex);
      clearAstryxCarouselTimer(scrollSettleTimerRef);
    };
  }, [hasSnap]);

  return (
    <Carousel
      {...rootProps}
      ref={carouselRootRef}
      aria-label={label}
      className={cx('astryx-wb-carousel', className)}
      data-astryx-wb-carousel-edge-fade-size={edgeFadeSize}
      data-astryx-wb-carousel-gap={gapValue ? 'true' : undefined}
      data-astryx-wb-carousel-items={resolvedItemsPerView ? 'true' : undefined}
      data-astryx-wb-carousel-item-sizing={hasItemSizing ? 'true' : undefined}
      data-astryx-wb-carousel-padding={hasPadding ? 'true' : undefined}
      data-astryx-wb-carousel-snap={hasSnap ? 'true' : 'false'}
      gap={resolveAstryxCarouselCoreGap(gap)}
      hasButtons={resolvedHasButtons}
      hasEdgeFade={hasEdgeFade}
      hasSnap={hasSnap}
      onWheel={handleWheel}
      padding={resolveAstryxCarouselCorePadding(padding)}
      style={resolvedStyle}
    >
      {children}
    </Carousel>
  );
}

AstryxCarousel.displayName = 'AstryxCarousel';

function resolveAstryxCarouselCoreGap(gap: AstryxCarouselSpacing | number): AstryxCarouselGap {
  if (typeof gap === 'number' && isAstryxCoreGap(gap)) return gap;
  return 0;
}

function resolveAstryxCarouselCorePadding(padding: AstryxCarouselPadding | undefined): 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | undefined {
  if (typeof padding === 'number' && isAstryxSpacingStep(padding)) return padding;
  return undefined;
}

function resolveAstryxCarouselPaddingBase(
  padding: AstryxCarouselPadding | undefined,
  innerPadding: AstryxCarouselPadding | undefined,
): AstryxCarouselPadding | undefined {
  if (padding !== undefined && padding !== 'none' && padding !== 0) return padding;
  return innerPadding;
}

function resolveAstryxCarouselSidePaddingValue(
  padding: AstryxCarouselPadding | undefined,
  legacyPadding: AstryxCarouselPadding | undefined,
  basePadding: AstryxCarouselPadding | undefined,
): string | undefined {
  const sidePadding = resolveAstryxCarouselExplicitSidePaddingValue(padding ?? legacyPadding);
  return sidePadding ?? resolveAstryxCarouselSpacingValue(basePadding);
}

function resolveAstryxCarouselExplicitSidePaddingValue(
  value: AstryxCarouselPadding | undefined,
): string | undefined {
  if (value == null || value === 'none' || value === 0) return undefined;
  return resolveAstryxCarouselSpacingValue(value);
}

function resolveAstryxCarouselSpacingValue(value: AstryxCarouselSpacing | number | undefined): string | undefined {
  if (value == null) return undefined;
  const step = typeof value === 'string' ? resolveAstryxCarouselSpacingStep(value) : value;
  if (step === 0) return '0px';
  if (isAstryxSpacingStep(step) && step !== 0) return `var(${getAstryxSpacingVariableName(step)})`;
  if (Number.isFinite(step) && step > 0) return `${step}px`;
  return undefined;
}

function resolveAstryxCarouselItemsPerView(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(12, Math.max(1, Number(value.toFixed(2))));
}

function resolveAstryxCarouselLength(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function resolveAstryxCarouselSpacingStep(value: Exclude<AstryxCarouselSpacing, number>): 0 | 1 | 2 | 4 | 6 | 8 | 10 {
  if (value === 'none') return 0;
  if (value === 'xs') return 1;
  if (value === 'sm') return 2;
  if (value === 'md') return 4;
  if (value === 'lg') return 6;
  if (value === 'xl') return 8;
  return 10;
}

function isAstryxCoreGap(value: number): value is AstryxCarouselGap {
  return value === 0 || value === 0.5 || value === 1 || value === 1.5 || value === 2 || value === 3 || value === 4;
}

function isAstryxSpacingStep(value: number): value is Exclude<AstryxCarouselSpacing, string | 0> | 0 {
  return value === 0 ||
    value === 0.5 ||
    value === 1 ||
    value === 1.5 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6 ||
    value === 8 ||
    value === 10;
}

function getAstryxSpacingVariableName(step: Exclude<AstryxCarouselSpacing, string | 0>): string {
  return `--spacing-${String(step).replace('.', '-')}`;
}

function clearAstryxCarouselTimer(timerRef: { current: number | null }): void {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function findAstryxCarouselScroller(root: HTMLElement): HTMLElement | null {
  const firstChild = root.firstElementChild;
  // Design preview renders project components into an iframe, so use the element's DOM realm.
  const HTMLElementConstructor = root.ownerDocument.defaultView?.HTMLElement;
  return firstChild && HTMLElementConstructor && firstChild instanceof HTMLElementConstructor
    ? firstChild as HTMLElement
    : null;
}

function normalizeAstryxCarouselWheelDelta(
  delta: number,
  deltaMode: number,
  scroller: HTMLElement,
  axis: 'x' | 'y',
): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * Math.min(80, axis === 'x' ? scroller.clientWidth : scroller.clientHeight);
  return delta;
}

function getAstryxCarouselSnapPositions(scroller: HTMLElement): number[] {
  const HTMLElementConstructor = scroller.ownerDocument.defaultView?.HTMLElement;
  if (!HTMLElementConstructor) return [];
  const items = Array.from(scroller.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElementConstructor,
  );
  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const scrollPaddingStart = Number.parseFloat(getComputedStyle(scroller).scrollPaddingInlineStart) || 0;
  const positions: number[] = [];

  items.forEach((item) => {
    const position = Math.min(maxScrollLeft, Math.max(0, item.offsetLeft - scrollPaddingStart));
    const previousPosition = positions[positions.length - 1];
    if (previousPosition === undefined || Math.abs(position - previousPosition) > ASTRYX_CAROUSEL_SNAP_EPSILON_PX) {
      positions.push(position);
    }
  });

  return positions;
}

function resolveAstryxCarouselTargetSnapIndex(
  targetSnapIndex: number | null,
  snapPositions: number[],
  scrollLeft: number,
): number {
  if (targetSnapIndex === null) {
    return findNearestAstryxCarouselSnapIndex(snapPositions, scrollLeft);
  }
  return Math.min(snapPositions.length - 1, Math.max(0, targetSnapIndex));
}

function findNearestAstryxCarouselSnapIndex(snapPositions: number[], scrollLeft: number): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  snapPositions.forEach((position, index) => {
    const distance = Math.abs(position - scrollLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

function scrollAstryxCarouselToSnapIndex(
  scroller: HTMLElement,
  snapPositions: number[],
  targetIndex: number,
): void {
  const targetPosition = snapPositions[targetIndex];
  if (targetPosition === undefined) return;
  scroller.scrollTo({
    left: targetPosition,
    behavior: 'smooth',
  });
}
