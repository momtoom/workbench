import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxProgressBarVariant = 'accent' | 'success' | 'warning' | 'neutral' | 'error';

type AstryxProgressBarRootProps = Omit<
  ComponentPropsWithoutRef<typeof ProgressBar>,
  | 'className'
  | 'hasValueLabel'
  | 'isDisabled'
  | 'isIndeterminate'
  | 'isLabelHidden'
  | 'label'
  | 'max'
  | 'value'
  | 'variant'
>;

export interface AstryxProgressBarProps extends AstryxProgressBarRootProps {
  label?: string;
  value?: number;
  max?: number;
  variant?: AstryxProgressBarVariant;
  isLabelHidden?: boolean;
  hasValueLabel?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxProgressBar({
  label = 'Progress',
  value = 64,
  max = 100,
  variant = 'accent',
  isLabelHidden = false,
  hasValueLabel = true,
  isIndeterminate = false,
  isDisabled = false,
  className,
  ...rootProps
}: AstryxProgressBarProps) {
  const safeMax = max > 0 ? max : 100;

  return (
    <ProgressBar
      {...rootProps}
      className={className}
      hasValueLabel={hasValueLabel}
      isDisabled={isDisabled}
      isIndeterminate={isIndeterminate}
      isLabelHidden={isLabelHidden}
      label={label}
      max={safeMax}
      value={clamp(value, 0, safeMax)}
      variant={variant}
    />
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
