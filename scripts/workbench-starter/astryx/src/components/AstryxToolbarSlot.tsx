import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxToolbarSlotPosition = 'start' | 'center' | 'end';

type AstryxToolbarSlotRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxToolbarSlotProps extends AstryxToolbarSlotRootProps {
  slot?: AstryxToolbarSlotPosition;
  className?: string;
  children?: ReactNode;
}

export function AstryxToolbarSlot({
  slot = 'start',
  className,
  children,
  ...rootProps
}: AstryxToolbarSlotProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-toolbar-slot', className)}
      data-astryx-wb-toolbar-slot={slot}
    >
      {children}
    </div>
  );
}

AstryxToolbarSlot.displayName = 'AstryxToolbarSlot';
