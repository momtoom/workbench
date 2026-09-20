import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import {
  AstryxOutlineContext,
  collectAstryxOutlineItemIds,
} from './AstryxOutlineItem';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxOutlineDensity = 'default' | 'compact';
type RootProps = Omit<ComponentPropsWithoutRef<'nav'>, 'children' | 'className'>;

export interface AstryxOutlineProps extends RootProps {
  children?: ReactNode;
  label?: string;
  density?: AstryxOutlineDensity;
  offset?: number;
  hasScrollOnClick?: boolean;
  className?: string;
}

export function AstryxOutline({
  children,
  label = 'Table of contents',
  density = 'default',
  offset = 0,
  hasScrollOnClick = false,
  className,
  ...rootProps
}: AstryxOutlineProps) {
  const stableChildren = useStableAstryxChildren(children);
  const itemIds = useMemo(
    () => collectAstryxOutlineItemIds(stableChildren),
    [stableChildren],
  );
  const [activeId, setActiveId] = useState(itemIds.activeId);
  useEffect(() => setActiveId(itemIds.activeId), [itemIds.activeId]);

  const context = useMemo(
    () => ({ activeId, hasScrollOnClick, offset, setActiveId }),
    [activeId, hasScrollOnClick, offset],
  );

  return (
    <AstryxOutlineContext.Provider value={context}>
      <nav
        {...rootProps}
        aria-label={label}
        className={cx('astryx-wb-outline', className)}
        data-astryx-wb-outline-density={density}
      >
        <div className="astryx-wb-outline__items">
          {stableChildren}
        </div>
        <div className="astryx-wb-outline__track" aria-hidden="true">
          <span className="astryx-wb-outline__divider" />
        </div>
        <span className="astryx-wb-outline__indicator" aria-hidden="true" />
      </nav>
    </AstryxOutlineContext.Provider>
  );
}

AstryxOutline.displayName = 'AstryxOutline';
