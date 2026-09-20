export type SourceCanvasDropAxis = 'horizontal' | 'vertical';

export type SourceCanvasDropFlow = {
  axis: SourceCanvasDropAxis;
  grid?: boolean;
  reverse: boolean;
};

export type SourceCanvasDropRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type SourceCanvasDropDirection = 'down' | 'left' | 'right' | 'up';

export type SourceCanvasDropInsertion = {
  axis: SourceCanvasDropAxis;
  boundaryDistance: number;
  index: number;
  position: 'after' | 'before';
};

export type SourceCanvasDropSiblingRect = {
  index: number;
  rect: SourceCanvasDropRect;
};

export type SourceCanvasRectProjection = {
  hasPositionChange: boolean;
  hasSizeChange: boolean;
  scaleX: number;
  scaleY: number;
  x: number;
  y: number;
};

export function getSourceCanvasDropBoundaryActivationSize({
  dimension,
  flow,
  prefersInside,
  sameParentReorder,
}: {
  dimension: number;
  flow: SourceCanvasDropFlow;
  prefersInside: boolean;
  sameParentReorder: boolean;
}): number {
  if (!Number.isFinite(dimension) || dimension <= 0) return 0;
  // A two-dimensional grid has no meaningful linear "middle" nesting band.
  // Its whole cell is partitioned by the nearest top/right/bottom/left edge.
  if (flow.grid) return dimension / 2;
  if (sameParentReorder && !prefersInside) return dimension * 0.3;
  if (prefersInside) return Math.min(3, dimension * 0.12);
  return dimension * 0.3;
}

export function isSourceCanvasDropRectUsable(
  rect: SourceCanvasDropRect | null | undefined,
): rect is SourceCanvasDropRect {
  return Boolean(
    rect &&
    Number.isFinite(rect.left) &&
    Number.isFinite(rect.top) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0,
  );
}

export function shouldHoldSourceCanvasDragOrigin({
  activationDistance,
  dragDistance,
}: {
  activationDistance: number;
  dragDistance: number;
}): boolean {
  return dragDistance < Math.max(0, activationDistance);
}

export function resolveSourceCanvasRectProjection({
  actualRect,
  desiredRect,
  positionThreshold = 0.5,
  scaleThreshold = 0.005,
}: {
  actualRect: SourceCanvasDropRect;
  desiredRect: SourceCanvasDropRect;
  positionThreshold?: number;
  scaleThreshold?: number;
}): SourceCanvasRectProjection {
  const x = Number.isFinite(desiredRect.left - actualRect.left)
    ? desiredRect.left - actualRect.left
    : 0;
  const y = Number.isFinite(desiredRect.top - actualRect.top)
    ? desiredRect.top - actualRect.top
    : 0;
  const scaleX = (
    Number.isFinite(actualRect.width) &&
    Number.isFinite(desiredRect.width) &&
    actualRect.width > 0.5
  ) ? Math.max(0, desiredRect.width / actualRect.width) : 1;
  const scaleY = (
    Number.isFinite(actualRect.height) &&
    Number.isFinite(desiredRect.height) &&
    actualRect.height > 0.5
  ) ? Math.max(0, desiredRect.height / actualRect.height) : 1;

  return {
    hasPositionChange: Math.abs(x) >= Math.max(0, positionThreshold) ||
      Math.abs(y) >= Math.max(0, positionThreshold),
    hasSizeChange: Math.abs(scaleX - 1) >= Math.max(0, scaleThreshold) ||
      Math.abs(scaleY - 1) >= Math.max(0, scaleThreshold),
    scaleX,
    scaleY,
    x,
    y,
  };
}

export function isSourceCanvasNoopReorder({
  currentIndex,
  siblingCount,
  targetIndex,
}: {
  currentIndex: number;
  siblingCount: number;
  targetIndex: number;
}): boolean {
  if (
    !Number.isInteger(currentIndex) ||
    !Number.isInteger(siblingCount) ||
    !Number.isInteger(targetIndex) ||
    currentIndex < 0 ||
    currentIndex >= siblingCount
  ) return false;
  const clampedTargetIndex = Math.max(0, Math.min(targetIndex, siblingCount));
  const adjustedTargetIndex = clampedTargetIndex > currentIndex
    ? clampedTargetIndex - 1
    : clampedTargetIndex;
  return adjustedTargetIndex === currentIndex;
}

function getSourceCanvasDropRectCenter(rect: SourceCanvasDropRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getSourceCanvasDropDirection(
  from: SourceCanvasDropRect,
  to: SourceCanvasDropRect,
): SourceCanvasDropDirection | null {
  const fromCenter = getSourceCanvasDropRectCenter(from);
  const toCenter = getSourceCanvasDropRectCenter(to);
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

function getOppositeSourceCanvasDropDirection(
  direction: SourceCanvasDropDirection,
): SourceCanvasDropDirection {
  if (direction === 'down') return 'up';
  if (direction === 'left') return 'right';
  if (direction === 'right') return 'left';
  return 'down';
}

function getSourceCanvasDropFallbackDirections(
  flow: SourceCanvasDropFlow,
): {
  after: SourceCanvasDropDirection;
  before: SourceCanvasDropDirection;
} {
  if (flow.axis === 'horizontal') {
    return flow.reverse
      ? { after: 'left', before: 'right' }
      : { after: 'right', before: 'left' };
  }
  return flow.reverse
    ? { after: 'up', before: 'down' }
    : { after: 'down', before: 'up' };
}

function getSourceCanvasDropBoundaryDistance(
  direction: SourceCanvasDropDirection,
  rect: SourceCanvasDropRect,
  clientX: number,
  clientY: number,
): number {
  if (direction === 'left') return Math.abs(clientX - rect.left);
  if (direction === 'right') return Math.abs(rect.left + rect.width - clientX);
  if (direction === 'up') return Math.abs(clientY - rect.top);
  return Math.abs(rect.top + rect.height - clientY);
}

function getSourceCanvasDropDirectionAxis(
  direction: SourceCanvasDropDirection,
): SourceCanvasDropAxis {
  return direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';
}

export function inferSourceCanvasDropFlow({
  childRects,
  display,
  fallbackAxis = 'vertical',
  flexDirection = 'column',
  gridAutoFlow = 'row',
  textDirection = 'ltr',
}: {
  childRects: readonly SourceCanvasDropRect[];
  display: string;
  fallbackAxis?: SourceCanvasDropAxis;
  flexDirection?: string;
  gridAutoFlow?: string;
  textDirection?: string;
}): SourceCanvasDropFlow {
  const isFlex = display.includes('flex');
  const isGrid = display.includes('grid');
  if (!isFlex && !isGrid) return { axis: fallbackAxis, reverse: false };
  const usableChildRects = childRects.filter(isSourceCanvasDropRectUsable);

  for (let index = 1; index < usableChildRects.length; index += 1) {
    const direction = getSourceCanvasDropDirection(usableChildRects[index - 1]!, usableChildRects[index]!);
    if (!direction) continue;
    return {
      axis: getSourceCanvasDropDirectionAxis(direction),
      grid: isGrid,
      reverse: direction === 'left' || direction === 'up',
    };
  }

  if (isFlex) {
    const axis = flexDirection.startsWith('row') ? 'horizontal' : 'vertical';
    const cssReverse = flexDirection.endsWith('reverse');
    const rtlReverse = axis === 'horizontal' && textDirection === 'rtl';
    return { axis, reverse: cssReverse !== rtlReverse };
  }

  return {
    axis: gridAutoFlow.trim().startsWith('column') ? 'vertical' : 'horizontal',
    grid: true,
    reverse: false,
  };
}

/**
 * Does this container actually place children side by side across more than one
 * row? Counting distinct rect centers does not answer that: a plain vertical
 * list whose rows have different widths has many distinct horizontal centers and
 * would be mistaken for a grid, which then gets addressed two-dimensionally and
 * makes every drop decision inside it nonsense. Two children sharing a row is
 * the real signal.
 */
export function isSourceCanvasTwoDimensionalLayout(
  rects: readonly SourceCanvasDropRect[],
): boolean {
  const usable = rects.filter(isSourceCanvasDropRectUsable);
  if (usable.length < 3) return false;
  const ordered = [...usable].sort((left, right) => left.top - right.top);
  const rows: SourceCanvasDropRect[][] = [];
  for (const rect of ordered) {
    const row = rows[rows.length - 1];
    const previous = row?.[row.length - 1];
    const sharesRow = previous
      ? Math.min(rect.top + rect.height, previous.top + previous.height) -
        Math.max(rect.top, previous.top) > Math.min(rect.height, previous.height) * 0.5
      : false;
    if (row && sharesRow) row.push(rect);
    else rows.push([rect]);
  }
  return rows.length >= 2 && rows.some((row) => row.length >= 2);
}

export function resolveSourceCanvasDropInsertion({
  clientX,
  clientY,
  fallbackFlow,
  nextRect = null,
  previousRect = null,
  siblingRects = [],
  targetIndex,
  targetRect,
}: {
  clientX: number;
  clientY: number;
  fallbackFlow: SourceCanvasDropFlow;
  nextRect?: SourceCanvasDropRect | null;
  previousRect?: SourceCanvasDropRect | null;
  siblingRects?: readonly SourceCanvasDropSiblingRect[];
  targetIndex: number;
  targetRect: SourceCanvasDropRect;
}): SourceCanvasDropInsertion | null {
  if (
    !Number.isFinite(clientX) ||
    !Number.isFinite(clientY) ||
    !Number.isInteger(targetIndex) ||
    !isSourceCanvasDropRectUsable(targetRect)
  ) return null;
  const gridInsertion = fallbackFlow.grid
    ? resolveSourceCanvasGridDropInsertion({
        clientX,
        clientY,
        flow: fallbackFlow,
        siblingRects,
        targetIndex,
        targetRect,
      })
    : null;
  if (gridInsertion) return gridInsertion;
  const fallbackDirections = getSourceCanvasDropFallbackDirections(fallbackFlow);
  const usablePreviousRect = isSourceCanvasDropRectUsable(previousRect) ? previousRect : null;
  const usableNextRect = isSourceCanvasDropRectUsable(nextRect) ? nextRect : null;
  const previousDirection = usablePreviousRect
    ? getSourceCanvasDropDirection(targetRect, usablePreviousRect)
    : null;
  const nextDirection = usableNextRect
    ? getSourceCanvasDropDirection(targetRect, usableNextRect)
    : null;
  const beforeDirection = previousDirection ??
    (nextDirection ? getOppositeSourceCanvasDropDirection(nextDirection) : fallbackDirections.before);
  const afterDirection = nextDirection ??
    (previousDirection ? getOppositeSourceCanvasDropDirection(previousDirection) : fallbackDirections.after);
  const beforeDistance = getSourceCanvasDropBoundaryDistance(
    beforeDirection,
    targetRect,
    clientX,
    clientY,
  );
  const afterDistance = getSourceCanvasDropBoundaryDistance(
    afterDirection,
    targetRect,
    clientX,
    clientY,
  );
  const position = beforeDistance <= afterDistance ? 'before' : 'after';
  const direction = position === 'before' ? beforeDirection : afterDirection;

  return {
    axis: getSourceCanvasDropDirectionAxis(direction),
    boundaryDistance: position === 'before' ? beforeDistance : afterDistance,
    index: position === 'before' ? targetIndex : targetIndex + 1,
    position,
  };
}

function resolveSourceCanvasGridDropInsertion({
  clientX,
  clientY,
  flow,
  siblingRects,
  targetIndex,
  targetRect,
}: {
  clientX: number;
  clientY: number;
  flow: SourceCanvasDropFlow;
  siblingRects: readonly SourceCanvasDropSiblingRect[];
  targetIndex: number;
  targetRect: SourceCanvasDropRect;
}): SourceCanvasDropInsertion | null {
  const usableSiblings = siblingRects.filter(({ rect }) => isSourceCanvasDropRectUsable(rect));
  if (!isSourceCanvasTwoDimensionalLayout(usableSiblings.map(({ rect }) => rect))) return null;

  const normalizedX = (clientX - targetRect.left) / targetRect.width;
  const normalizedY = (clientY - targetRect.top) / targetRect.height;
  const horizontalMagnitude = Math.abs(normalizedX - 0.5);
  const verticalMagnitude = Math.abs(normalizedY - 0.5);
  // Split the cell into four triangular sectors that meet at its center.
  // Exactly one dominant axis wins, so corners are not overlapping horizontal
  // and vertical bands. On the diagonal, prefer the cross axis of source flow
  // to keep row/column boundary insertion deterministic.
  const horizontalWins = horizontalMagnitude > verticalMagnitude ||
    (
      Math.abs(horizontalMagnitude - verticalMagnitude) < 0.001 &&
      flow.axis === 'vertical'
    );
  const direction: SourceCanvasDropDirection = horizontalWins
    ? normalizedX <= 0.5 ? 'left' : 'right'
    : normalizedY <= 0.5 ? 'up' : 'down';
  const edgeCandidates: Record<SourceCanvasDropDirection, {
    axis: SourceCanvasDropAxis;
    direction: SourceCanvasDropDirection;
    position: SourceCanvasDropInsertion['position'];
  }> = {
    left: {
      axis: 'horizontal',
      direction: 'left',
      position: 'before',
    },
    right: {
      axis: 'horizontal',
      direction: 'right',
      position: 'after',
    },
    up: {
      axis: 'vertical',
      direction: 'up',
      position: 'before',
    },
    down: {
      axis: 'vertical',
      direction: 'down',
      position: 'after',
    },
  };
  const edge = edgeCandidates[direction];
  // CSS Grid auto-placement is still backed by one ordered JSX sibling list.
  // A visual up/down edge must not borrow the source index of a card in the
  // neighboring row or column: that turns an adjacent no-op hover into a large
  // reorder. The four sectors choose the visual axis, while the addressed
  // target card alone owns the structural before/after insertion boundary.
  const index = edge.position === 'before' ? targetIndex : targetIndex + 1;

  return {
    axis: edge.axis,
    boundaryDistance: getSourceCanvasDropBoundaryDistance(
      edge.direction,
      targetRect,
      clientX,
      clientY,
    ),
    index,
    position: edge.position,
  };
}

export function getSourceCanvasPointToRectDistanceSquared(
  rect: SourceCanvasDropRect,
  clientX: number,
  clientY: number,
): number {
  if (!isSourceCanvasDropRectUsable(rect)) return Number.POSITIVE_INFINITY;
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  const dx = clientX < rect.left ? rect.left - clientX : clientX > right ? clientX - right : 0;
  const dy = clientY < rect.top ? rect.top - clientY : clientY > bottom ? clientY - bottom : 0;
  return dx * dx + dy * dy;
}
