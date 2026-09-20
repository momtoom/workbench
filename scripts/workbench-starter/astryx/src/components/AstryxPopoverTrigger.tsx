import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxPopoverTriggerRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxPopoverTriggerProps extends AstryxPopoverTriggerRootProps {
  className?: string;
  children?: ReactNode;
}

export function AstryxPopoverTrigger({
  className,
  children,
  ...rootProps
}: AstryxPopoverTriggerProps) {
  return (
    <span {...rootProps} className={cx('astryx-wb-popover-trigger', className)}>
      {children}
    </span>
  );
}

AstryxPopoverTrigger.displayName = 'AstryxPopoverTrigger';
