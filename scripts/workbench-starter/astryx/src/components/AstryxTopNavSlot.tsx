import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxTopNavSlotPosition = 'start' | 'center' | 'end';

type AstryxTopNavSlotRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxTopNavSlotProps extends AstryxTopNavSlotRootProps {
  slot?: AstryxTopNavSlotPosition;
  className?: string;
  children?: ReactNode;
}

export function AstryxTopNavSlot({
  slot = 'start',
  className,
  children,
  ...rootProps
}: AstryxTopNavSlotProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-top-nav-slot', className)}
      data-astryx-wb-top-nav-slot={slot}
    >
      {children}
    </div>
  );
}

AstryxTopNavSlot.displayName = 'AstryxTopNavSlot';
