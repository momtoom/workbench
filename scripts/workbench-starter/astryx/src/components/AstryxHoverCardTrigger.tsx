import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxHoverCardTriggerRootProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'>;

export interface AstryxHoverCardTriggerProps extends AstryxHoverCardTriggerRootProps {
  className?: string;
  children?: ReactNode;
}

export function AstryxHoverCardTrigger({
  className,
  children,
  ...rootProps
}: AstryxHoverCardTriggerProps) {
  return (
    <span {...rootProps} className={cx('astryx-wb-hover-card-trigger', className)}>
      {children}
    </span>
  );
}

AstryxHoverCardTrigger.displayName = 'AstryxHoverCardTrigger';
