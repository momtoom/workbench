import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './classNames';

type AstryxOutlineItemRootProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'children' | 'className' | 'href' | 'id'
>;

export interface AstryxOutlineItemProps extends AstryxOutlineItemRootProps {
  id?: string;
  label?: string;
  level?: number;
  isDefaultActive?: boolean;
  className?: string;
}

interface AstryxOutlineContextValue {
  activeId?: string;
  hasScrollOnClick: boolean;
  offset: number;
  setActiveId: (id: string) => void;
}

export const AstryxOutlineContext =
  createContext<AstryxOutlineContextValue | null>(null);

export function AstryxOutlineItem({
  id = 'section',
  label = 'Section',
  level = 1,
  isDefaultActive = false,
  className,
  onClick,
  ...rootProps
}: AstryxOutlineItemProps) {
  const context = useContext(AstryxOutlineContext);
  const normalizedLevel = clamp(level, 1, 6);
  const isActive = context?.activeId === id;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    context?.setActiveId(id);
    if (!context?.hasScrollOnClick) {
      event.preventDefault();
      return;
    }
    const target = event.currentTarget.ownerDocument.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const top = target.getBoundingClientRect().top +
      event.currentTarget.ownerDocument.defaultView!.scrollY -
      (context?.offset ?? 0);
    event.currentTarget.ownerDocument.defaultView?.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <a
      {...rootProps}
      aria-current={isActive ? 'location' : undefined}
      className={cx('astryx-wb-outline-item', className)}
      data-astryx-wb-outline-item-active={isActive ? 'true' : undefined}
      data-astryx-wb-outline-item-default={isDefaultActive ? 'true' : undefined}
      data-astryx-wb-outline-item-id={id}
      data-astryx-wb-outline-item-level={normalizedLevel}
      href={`#${id}`}
      onClick={handleClick}
    >
      {label}
    </a>
  );
}

AstryxOutlineItem.displayName = 'AstryxOutlineItem';

export function collectAstryxOutlineItemIds(
  children: ReactNode,
): { activeId?: string; ids: string[] } {
  const elements = collectItemElements(children);
  const ids = elements.map((child, index) => (
    child.props.id?.trim() || `section-${index + 1}`
  ));
  const activeIndex = elements.findIndex((child) => child.props.isDefaultActive);
  return { activeId: ids[activeIndex >= 0 ? activeIndex : 0], ids };
}

function collectItemElements(
  children: ReactNode,
): ReactElement<AstryxOutlineItemProps>[] {
  return Children.toArray(children).filter(
    (child): child is ReactElement<AstryxOutlineItemProps> => {
      if (!isValidElement(child)) return false;
      if (child.type === AstryxOutlineItem) return true;
      const type = child.type as { displayName?: string; name?: string } | null;
      return type?.displayName === 'AstryxOutlineItem' ||
        type?.name === 'AstryxOutlineItem';
    },
  );
}

function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
