import { Progress as BaseProgress } from '@base-ui/react/progress';
import type { HTMLAttributes } from 'react';
import './local.css';

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  className?: string;
  label?: string;
  max?: number;
  showValue?: boolean;
  value?: number | null;
};

export function Progress({
  className = '',
  label,
  max = 100,
  showValue = false,
  value = 66,
  ...props
}: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(safeMax, value))
    : null;

  return (
    <BaseProgress.Root
      {...props}
      className={['wb-progress', className].filter(Boolean).join(' ')}
      max={safeMax}
      value={safeValue}
    >
      {label || showValue ? (
        <div className="wb-progress__header">
          {label ? <BaseProgress.Label className="wb-progress__label">{label}</BaseProgress.Label> : <span />}
          {showValue ? (
            <BaseProgress.Value className="wb-progress__value">
              {(_, rawValue) => rawValue === null ? '0%' : `${Math.round((rawValue / safeMax) * 100)}%`}
            </BaseProgress.Value>
          ) : null}
        </div>
      ) : null}
      <BaseProgress.Track className="wb-progress__track">
        <BaseProgress.Indicator className="wb-progress__indicator" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
