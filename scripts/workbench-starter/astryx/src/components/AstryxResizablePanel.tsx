import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxResizablePanelRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxResizablePanelProps extends AstryxResizablePanelRootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxResizablePanel({
  children,
  className,
  ...rootProps
}: AstryxResizablePanelProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-resizable__panel', className)}>
      {children}
    </div>
  );
}

AstryxResizablePanel.displayName = 'AstryxResizablePanel';
