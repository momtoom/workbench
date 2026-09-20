import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxToastActionsProps extends RootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxToastActions({
  children,
  className,
  ...rootProps
}: AstryxToastActionsProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-toast-actions', className)}>
      {children}
    </div>
  );
}

AstryxToastActions.displayName = 'AstryxToastActions';
