import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxStepperSize = 'sm' | 'md';
export type AstryxStepperOrientation = 'horizontal' | 'vertical';

type AstryxStepperRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'aria-label' | 'children' | 'className' | 'role'
>;

export interface AstryxStepperProps extends AstryxStepperRootProps {
  label?: string;
  size?: AstryxStepperSize;
  orientation?: AstryxStepperOrientation;
  showConnector?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxStepper({
  label = 'Progress steps',
  size = 'sm',
  orientation = 'horizontal',
  showConnector = true,
  className,
  children,
  ...rootProps
}: AstryxStepperProps) {
  return (
    <div
      {...rootProps}
      aria-label={label}
      className={cx('astryx-wb-stepper', className)}
      data-astryx-wb-stepper-orientation={orientation}
      data-astryx-wb-stepper-size={size}
      data-astryx-wb-stepper-show-connector={showConnector ? 'true' : 'false'}
      role="group"
    >
      {children}
    </div>
  );
}

AstryxStepper.displayName = 'AstryxStepper';
