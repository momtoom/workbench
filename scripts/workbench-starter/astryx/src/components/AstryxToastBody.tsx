import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxToastBodyProps extends RootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxToastBody({
  children,
  className,
  ...rootProps
}: AstryxToastBodyProps) {
  return (
    <div {...rootProps} className={cx('astryx-wb-toast-body', className)}>
      {children}
    </div>
  );
}

AstryxToastBody.displayName = 'AstryxToastBody';
