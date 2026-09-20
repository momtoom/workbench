import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxResizableContentRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxResizableContentProps extends AstryxResizableContentRootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxResizableContent({
  children,
  className,
  ...rootProps
}: AstryxResizableContentProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-resizable__content', className)}>
      {children}
    </div>
  );
}

AstryxResizableContent.displayName = 'AstryxResizableContent';
