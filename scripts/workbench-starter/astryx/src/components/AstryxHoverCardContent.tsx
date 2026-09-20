import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxHoverCardContentRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxHoverCardContentProps extends AstryxHoverCardContentRootProps {
  className?: string;
  children?: ReactNode;
}

export function AstryxHoverCardContent({
  className,
  children,
  ...rootProps
}: AstryxHoverCardContentProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-hover-card-content', className)}>
      {children}
    </div>
  );
}

AstryxHoverCardContent.displayName = 'AstryxHoverCardContent';
