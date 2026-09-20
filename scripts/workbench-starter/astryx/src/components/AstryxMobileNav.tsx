import { MobileNav } from '@astryxdesign/core/MobileNav';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AstryxMobileNavTrigger,
  AstryxMobileNavTriggerOpenContext,
  type AstryxMobileNavTriggerProps,
} from './AstryxMobileNavTrigger';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxMobileNavSide = 'start' | 'end' | 'auto';
type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;
export interface AstryxMobileNavProps extends RootProps {
  header?: string;
  label?: string;
  children?: ReactNode;
  width?: number;
  side?: AstryxMobileNavSide;
  isDefaultOpen?: boolean;
  className?: string;
}
export function AstryxMobileNav({
  header = 'Navigation',
  label = 'Mobile navigation',
  children,
  width = 320,
  side = 'start',
  isDefaultOpen = false,
  className,
  onClickCapture,
  ...rootProps
}: AstryxMobileNavProps) {
  const stableChildren = useStableAstryxChildren(children);
  const stableChildArray = Children.toArray(stableChildren);
  const trigger = stableChildArray.find(isMobileNavTrigger);
  const navigationChildren = stableChildArray.filter((child) => child !== trigger);
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  // The core nav shows/hides its panel instantly on isOpen. Closing first
  // enters a "closing" phase (stamped on the launcher for the exit
  // animation in CSS) and only flips isOpen once that animation has played,
  // so the panel slides out instead of vanishing.
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const cancelPendingClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosing(false);
  }, []);
  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);
  useEffect(() => {
    cancelPendingClose();
    setIsOpen(isDefaultOpen);
  }, [cancelPendingClose, isDefaultOpen]);
  const openNavigation = useCallback(() => {
    cancelPendingClose();
    setIsOpen(true);
  }, [cancelPendingClose]);
  const requestClose = useCallback(() => {
    if (closeTimerRef.current !== null) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      setIsOpen(false);
    }, MOBILE_NAV_CLOSE_MS);
  }, []);
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) openNavigation();
    else requestClose();
  }, [openNavigation, requestClose]);
  const handleClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      onClickCapture?.(event);
      if (event.defaultPrevented || !(event.target instanceof Element)) return;

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.getAttribute('aria-disabled') === 'true') return;

      requestClose();
    },
    [onClickCapture, requestClose],
  );
  const triggerSlot = trigger ? (
    <AstryxMobileNavTriggerOpenContext.Provider value={openNavigation}>
      {trigger}
    </AstryxMobileNavTriggerOpenContext.Provider>
  ) : null;
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-launcher', className)}
      data-astryx-wb-mobile-nav-closing={isClosing ? 'true' : undefined}
      data-astryx-wb-mobile-nav-side={side}
      onClickCapture={handleClickCapture}
    >
      {triggerSlot}
      <MobileNav
        className="astryx-wb-mobile-nav"
        header={header}
        isOpen={isOpen}
        label={label}
        onOpenChange={handleOpenChange}
        side={side}
        width={width}
      >
        {navigationChildren}
      </MobileNav>
    </div>
  );
}

// Long enough for the exit animation in astryx.source.css to finish, short
// enough that a re-open right after closing never feels blocked.
const MOBILE_NAV_CLOSE_MS = 240;

function isMobileNavTrigger(child: ReactNode): child is ReactElement<AstryxMobileNavTriggerProps> {
  if (!isValidElement(child)) return false;
  if (child.type === AstryxMobileNavTrigger) return true;
  const type = child.type as { displayName?: string; name?: string } | null;
  return type?.displayName === 'AstryxMobileNavTrigger' || type?.name === 'AstryxMobileNavTrigger';
}
