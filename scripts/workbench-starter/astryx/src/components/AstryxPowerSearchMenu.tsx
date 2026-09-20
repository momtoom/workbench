import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from './classNames';
import { useAstryxPowerSearchSurface } from './AstryxPowerSearch';
import { useWorkbenchPortalContainer } from './workbenchPortal';

type MenuRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchMenuProps extends MenuRootProps {
  children?: ReactNode;
  emptyMessage?: string;
  className?: string;
}

interface MenuPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  isConstrained: boolean;
}

export function AstryxPowerSearchMenu({
  children,
  emptyMessage = 'No matching fields',
  className,
  ...rootProps
}: AstryxPowerSearchMenuProps) {
  const surface = useAstryxPowerSearchSurface();
  const workbenchPortalContainer = useWorkbenchPortalContainer();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!surface?.isMenuOpen) {
      setPosition(null);
      return;
    }

    const anchor = surface.rootRef.current;
    const ownerWindow = anchor?.ownerDocument.defaultView;
    if (!anchor || !ownerWindow) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const viewportPadding = 8;
      const layerGap = 4;
      const desiredWidth = surface.activeFieldKey
        ? Math.max(rect.width, 400)
        : rect.width;
      const width = Math.min(
        desiredWidth,
        ownerWindow.innerWidth - viewportPadding * 2,
      );
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, ownerWindow.innerWidth - width - viewportPadding),
      );
      const measuredHeight = menuRef.current?.scrollHeight ?? (
        surface.activeFieldKey ? 260 : 320
      );
      const availableBelow =
        ownerWindow.innerHeight - rect.bottom - viewportPadding - layerGap;
      const availableAbove = rect.top - viewportPadding - layerGap;
      const placeAbove =
        availableBelow < Math.min(measuredHeight, 240) &&
        availableAbove > availableBelow;
      const availableHeight = Math.max(
        120,
        placeAbove ? availableAbove : availableBelow,
      );
      const renderedHeight = Math.min(measuredHeight, availableHeight);
      setPosition({
        left,
        top: placeAbove
          ? Math.max(viewportPadding, rect.top - renderedHeight - layerGap)
          : rect.bottom + layerGap,
        width,
        maxHeight: availableHeight,
        isConstrained: measuredHeight > availableHeight,
      });
    };

    updatePosition();
    const ResizeObserverConstructor = ownerWindow.ResizeObserver;
    const resizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(updatePosition)
      : null;
    resizeObserver?.observe(anchor);
    ownerWindow.addEventListener('resize', updatePosition);
    ownerWindow.addEventListener('scroll', updatePosition, true);

    return () => {
      resizeObserver?.disconnect();
      ownerWindow.removeEventListener('resize', updatePosition);
      ownerWindow.removeEventListener('scroll', updatePosition, true);
    };
  }, [surface?.activeFieldKey, surface?.isMenuOpen, surface?.rootRef]);

  const menu = (
    <div
      {...rootProps}
      ref={menuRef}
      className={cx(
        'astryx-wb-power-search-menu',
        surface?.activeFieldKey && 'astryx-wb-power-search-menu--detail',
        className,
      )}
      data-astryx-wb-power-search-menu="true"
      data-astryx-wb-power-search-owner={surface?.surfaceId}
      hidden={!surface?.isMenuOpen}
      role="listbox"
      style={
        {
          ...rootProps.style,
          left: position?.left,
          maxHeight: position?.maxHeight,
          overflow: position?.isConstrained ? 'auto' : undefined,
          top: position?.top,
          visibility: position ? undefined : 'hidden',
          width: position?.width,
        } as CSSProperties
      }
    >
      {children || <span>{emptyMessage}</span>}
    </div>
  );

  const anchor = surface?.rootRef.current;
  const portalContainer =
    workbenchPortalContainer ?? anchor?.ownerDocument.body ?? null;
  const themeRoot =
    anchor?.closest<HTMLElement>('[data-astryx-theme]') ?? null;
  const themeName = themeRoot?.getAttribute('data-astryx-theme') ?? undefined;
  const themeMedia = themeRoot?.getAttribute('data-astryx-media') ?? undefined;
  const colorScheme = themeRoot?.style.colorScheme as
    | CSSProperties['colorScheme']
    | undefined;
  const portalStyle: CSSProperties = { colorScheme, display: 'contents' };

  return portalContainer
    ? createPortal(
        <div
          data-astryx-media={themeMedia}
          data-astryx-theme={themeName}
          data-astryx-wb-power-search-portal="true"
          style={portalStyle}
        >
          {menu}
        </div>,
        portalContainer,
      )
    : menu;
}

AstryxPowerSearchMenu.displayName = 'AstryxPowerSearchMenu';
