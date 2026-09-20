import { Button } from '@astryxdesign/core/Button';
import {
  ResizeHandle,
  useResizable,
} from '@astryxdesign/core/Resizable';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxResizableContent, type AstryxResizableContentProps } from './AstryxResizableContent';
import { AstryxResizablePanel, type AstryxResizablePanelProps } from './AstryxResizablePanel';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxResizableDirection = 'horizontal' | 'vertical';
export type AstryxResizeHandlePlacement = 'auto' | 'start' | 'end' | 'center';
type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;
export interface AstryxResizableProps extends RootProps {
  direction?: AstryxResizableDirection;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  isCollapsible?: boolean;
  collapsedSize?: number;
  isDisabled?: boolean;
  isReversed?: boolean;
  hasDivider?: boolean;
  hasHandle?: boolean;
  isAlwaysVisible?: boolean;
  pillPlacement?: AstryxResizeHandlePlacement;
  label?: string;
  children?: ReactNode;
  className?: string;
}
export function AstryxResizable({
  direction = 'horizontal',
  defaultSize = 240,
  minSize = 160,
  maxSize = 480,
  isCollapsible = true,
  collapsedSize = 48,
  isDisabled = false,
  isReversed = false,
  hasDivider = true,
  hasHandle = true,
  isAlwaysVisible = true,
  pillPlacement = 'auto',
  label = 'Resize panel',
  children,
  className,
  ...rootProps
}: AstryxResizableProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [availableSize, setAvailableSize] = useState<number | null>(null);
  const stableChildren = useStableAstryxChildren(children);
  const effectiveMaxSize = useMemo(() => {
    if (availableSize === null) return maxSize;
    return Math.max(minSize, Math.min(maxSize, Math.max(0, availableSize - 1)));
  }, [availableSize, maxSize, minSize]);
  const region = useResizable({
    collapsedSize,
    collapsible: isCollapsible,
    defaultSize,
    maxSizePx: effectiveMaxSize,
    minSizePx: minSize,
  });
  useEffect(() => {
    const root = rootRef.current;
    const ownerWindow = root?.ownerDocument.defaultView;
    const OwnerResizeObserver = ownerWindow?.ResizeObserver;
    if (!root || !OwnerResizeObserver) return undefined;

    const updateAvailableSize = () => {
      const nextSize = direction === 'horizontal' ? root.clientWidth : root.clientHeight;
      setAvailableSize((currentSize) => currentSize === nextSize ? currentSize : nextSize);
    };
    updateAvailableSize();
    const observer = new OwnerResizeObserver(updateAvailableSize);
    observer.observe(root);
    return () => observer.disconnect();
  }, [direction]);
  useEffect(() => {
    if (!region.isCollapsed && region.size > effectiveMaxSize) {
      region.resize(effectiveMaxSize);
    }
  }, [effectiveMaxSize, region.isCollapsed, region.resize, region.size]);
  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const handleResizePointerDownCapture = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (isDisabled || event.button !== 0) return;
    const separator = event.currentTarget;
    const ownerDocument = separator.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    if (!ownerWindow) return;
    const frameElement = ownerWindow.frameElement as HTMLElement | null;
    const hostWindow = frameElement?.ownerDocument.defaultView ?? null;
    const frameRect = frameElement?.getBoundingClientRect() ?? null;

    event.preventDefault();
    event.stopPropagation();
    resizeCleanupRef.current?.();

    const isHorizontal = direction === 'horizontal';
    const rtlMultiplier = isHorizontal && ownerWindow.getComputedStyle(separator).direction === 'rtl'
      ? -1
      : 1;
    const reverseMultiplier = isReversed ? -1 : 1;
    const startPosition = isHorizontal ? event.clientX : event.clientY;
    const pointerId = event.pointerId;
    const body = ownerDocument.body;
    const previousCursor = body.style.cursor;
    const previousUserSelect = body.style.userSelect;

    region.props._onResizeStart();
    separator.setAttribute('data-resizing', 'true');
    body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    body.style.userSelect = 'none';
    try {
      separator.setPointerCapture(pointerId);
    } catch {
      // Window listeners below remain the cross-realm-safe fallback.
    }

    const cleanup = () => {
      ownerDocument.removeEventListener('pointermove', handleOwnerPointerMove, true);
      ownerDocument.removeEventListener('pointerup', handlePointerUp, true);
      ownerDocument.removeEventListener('pointercancel', handlePointerCancel, true);
      ownerWindow.removeEventListener('blur', handlePointerCancel);
      if (hostWindow && hostWindow !== ownerWindow) {
        hostWindow.removeEventListener('pointermove', handleHostPointerMove, true);
        hostWindow.removeEventListener('pointerup', handlePointerUp, true);
        hostWindow.removeEventListener('pointercancel', handlePointerCancel, true);
        hostWindow.removeEventListener('blur', handlePointerCancel);
      }
      separator.removeAttribute('data-resizing');
      body.style.cursor = previousCursor;
      body.style.userSelect = previousUserSelect;
      try {
        if (separator.hasPointerCapture(pointerId)) {
          separator.releasePointerCapture(pointerId);
        }
      } catch {
        // The iframe may have reloaded while a pointer sequence was active.
      }
      if (resizeCleanupRef.current === cleanup) resizeCleanupRef.current = null;
    };
    const applyPointerMove = (pointerEvent: PointerEvent, fromHostWindow: boolean) => {
      const frameOffset = fromHostWindow && frameRect
        ? isHorizontal
          ? frameRect.left
          : frameRect.top
        : 0;
      const currentPosition = (
        isHorizontal ? pointerEvent.clientX : pointerEvent.clientY
      ) - frameOffset;
      region.props._onResizeMove(
        (currentPosition - startPosition) * rtlMultiplier * reverseMultiplier,
      );
    };
    const handleOwnerPointerMove = (pointerEvent: PointerEvent) => {
      applyPointerMove(pointerEvent, false);
    };
    const handleHostPointerMove = (pointerEvent: PointerEvent) => {
      applyPointerMove(pointerEvent, true);
    };
    const handlePointerUp = () => {
      cleanup();
      region.props._onResizeEnd();
    };
    const handlePointerCancel = () => {
      cleanup();
      region.props._onResizeEnd();
    };

    ownerDocument.addEventListener('pointermove', handleOwnerPointerMove, true);
    ownerDocument.addEventListener('pointerup', handlePointerUp, true);
    ownerDocument.addEventListener('pointercancel', handlePointerCancel, true);
    ownerWindow.addEventListener('blur', handlePointerCancel);
    if (hostWindow && hostWindow !== ownerWindow) {
      hostWindow.addEventListener('pointermove', handleHostPointerMove, true);
      hostWindow.addEventListener('pointerup', handlePointerUp, true);
      hostWindow.addEventListener('pointercancel', handlePointerCancel, true);
      hostWindow.addEventListener('blur', handlePointerCancel);
    }
    resizeCleanupRef.current = cleanup;
  }, [direction, isDisabled, isReversed, region.props]);

  const handleResizeKeyDownCapture = useCallback((
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (isDisabled || !region.isCollapsed) return;
    const isHorizontal = direction === 'horizontal';
    const ownerWindow = event.currentTarget.ownerDocument.defaultView;
    const rtlMultiplier = isHorizontal &&
      ownerWindow?.getComputedStyle(event.currentTarget).direction === 'rtl'
      ? -1
      : 1;
    const reverseMultiplier = isReversed ? -1 : 1;
    const directionalDelta = isHorizontal
      ? event.key === 'ArrowRight'
        ? rtlMultiplier * reverseMultiplier
        : event.key === 'ArrowLeft'
          ? -rtlMultiplier * reverseMultiplier
          : 0
      : event.key === 'ArrowDown'
        ? reverseMultiplier
        : event.key === 'ArrowUp'
          ? -reverseMultiplier
          : 0;
    if (directionalDelta <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    region.resize(Math.min(effectiveMaxSize, Math.max(minSize, collapsedSize)));
  }, [
    collapsedSize,
    direction,
    effectiveMaxSize,
    isDisabled,
    isReversed,
    minSize,
    region.isCollapsed,
    region.resize,
  ]);
  const panelStyle = {
    '--astryx-wb-resizable-size': `${region.size}px`,
  } as CSSProperties;
  const projectedRootStyle = { ...panelStyle, ...rootProps.style };
  const panel = findChildElement<AstryxResizablePanelProps>(stableChildren, AstryxResizablePanel);
  const content = findChildElement<AstryxResizableContentProps>(stableChildren, AstryxResizableContent);
  const resizeHandle = (
    <ResizeHandle
      direction={direction}
      hasDivider={hasDivider}
      isAlwaysVisible={isAlwaysVisible}
      isDisabled={isDisabled}
      isReversed={isReversed}
      label={label}
      onKeyDownCapture={handleResizeKeyDownCapture}
      onPointerDownCapture={handleResizePointerDownCapture}
      pillPlacement={pillPlacement}
      resizable={region.props}
    />
  );
  /* Workbench's Design canvas projects authored children through source-backed
     selection anchors, so component identity can be unavailable to the slot
     lookup above. Keep the authored children and restore the runtime separator
     between the projected panel and content. The root-owned size variable
     inherits through display:contents anchors without adding layout wrappers. */
  if (!panel && !content) {
    const projectedChildren = isReversed
      ? Children.toArray(stableChildren).reverse()
      : Children.toArray(stableChildren);
    const [projectedPanel, ...projectedContent] = projectedChildren;
    return (
      <div
        ref={rootRef}
        {...rootProps}
        className={cx('astryx-wb-resizable', className)}
        data-astryx-wb-resizable-direction={direction}
        data-astryx-wb-resizable-handle={hasHandle ? 'visible' : 'hidden'}
        data-astryx-wb-resizable-unresolved="true"
        style={projectedRootStyle}
      >
        {projectedPanel}
        {resizeHandle}
        {projectedContent}
      </div>
    );
  }
  return (
    <div
      ref={rootRef}
      {...rootProps}
      className={cx('astryx-wb-resizable', className)}
      data-astryx-wb-resizable-direction={direction}
      data-astryx-wb-resizable-handle={hasHandle ? 'visible' : 'hidden'}
    >
      {panel
        ? cloneElement(panel, {
            style: { ...panelStyle, ...panel.props.style },
            children: (
              <>
                {panel.props.children}
                {isCollapsible ? (
                  <Button
                    label={region.isCollapsed ? 'Expand' : 'Collapse'}
                    onClick={region.isCollapsed ? region.expand : region.collapse}
                    size="sm"
                    variant="ghost"
                  />
                ) : null}
              </>
            ),
          })
        : null}
      {resizeHandle}
      {content || null}
    </div>
  );
}

function findChildElement<Props>(
  children: ReactNode,
  component: ElementType<Props>,
): ReactElement<Props> | null {
  for (const node of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(node)) continue;
    const componentName = (component as { displayName?: string; name?: string }).displayName
      || (component as { name?: string }).name;
    const nodeType = node.type as { displayName?: string; name?: string };
    if (
      node.type === component ||
      (componentName && (nodeType?.displayName === componentName || nodeType?.name === componentName))
    ) return node as ReactElement<Props>;
    /* A nested resizable owns its own slots. Without this the search walked
       straight through one and claimed its panel, so a resizable placed inside
       another's content stole the outer split's sized side. The recursion below
       still has to run for everything else, because Workbench's Design canvas
       projects authored children through its own source tree nodes and the slot
       would otherwise not be found at all. */
    if (isAstryxResizableElement(node)) continue;
    const nested = findChildElement<Props>(node.props.children, component);
    if (nested) return nested;
  }
  return null;
}

function isAstryxResizableElement(node: ReactElement): boolean {
  if (node.type === AstryxResizable) return true;
  const nodeType = node.type as { displayName?: string; name?: string };
  return nodeType?.displayName === 'AstryxResizable' || nodeType?.name === 'AstryxResizable';
}
