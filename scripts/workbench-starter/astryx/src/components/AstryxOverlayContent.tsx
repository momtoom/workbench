import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxOverlayContentProps extends RootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxOverlayContent({
  children,
  className,
  ...rootProps
}: AstryxOverlayContentProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-overlay__content', className)}>
      {children}
    </div>
  );
}

AstryxOverlayContent.displayName = 'AstryxOverlayContent';
