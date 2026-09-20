import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxStepperRailRootProps = Omit<
  ComponentPropsWithoutRef<'ol'>,
  'children' | 'className'
>;

export interface AstryxStepperRailProps extends AstryxStepperRailRootProps {
  className?: string;
  children?: ReactNode;
}

export function AstryxStepperRail({
  className,
  children,
  ...rootProps
}: AstryxStepperRailProps) {
  return (
    <ol {...rootProps} className={cx('astryx-wb-stepper-rail', className)}>
      {children}
    </ol>
  );
}

AstryxStepperRail.displayName = 'AstryxStepperRail';
