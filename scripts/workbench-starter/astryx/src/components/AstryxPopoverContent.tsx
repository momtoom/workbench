import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxPopoverContentRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPopoverContentProps extends AstryxPopoverContentRootProps {
  className?: string;
  children?: ReactNode;
}

export function AstryxPopoverContent({
  className,
  children,
  ...rootProps
}: AstryxPopoverContentProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-popover-content', className)}>
      {children}
    </div>
  );
}

AstryxPopoverContent.displayName = 'AstryxPopoverContent';
