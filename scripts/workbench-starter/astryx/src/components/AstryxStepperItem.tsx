import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxStepperItemState = 'complete' | 'current' | 'upcoming';

type AstryxStepperItemRootProps = Omit<
  ComponentPropsWithoutRef<'li'>,
  'aria-current' | 'children' | 'className'
>;

export interface AstryxStepperItemProps extends AstryxStepperItemRootProps {
  label?: string;
  step?: number;
  state?: AstryxStepperItemState;
  className?: string;
}

export function AstryxStepperItem({
  label = 'Step',
  step = 1,
  state = 'upcoming',
  className,
  ...rootProps
}: AstryxStepperItemProps) {
  return (
    <li
      {...rootProps}
      aria-current={state === 'current' ? 'step' : undefined}
      className={cx('astryx-wb-stepper-item', className)}
      data-astryx-wb-stepper-item-state={state}
    >
      <span className="astryx-wb-stepper-marker" aria-hidden="true">
        {state === 'complete' ? <AstryxIcon icon="check" size="sm" /> : step}
      </span>
      <span className="astryx-wb-stepper-label">{label}</span>
    </li>
  );
}

AstryxStepperItem.displayName = 'AstryxStepperItem';
