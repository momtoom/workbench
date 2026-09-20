import { StatusDot } from '@astryxdesign/core/StatusDot';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxStatusDotVariant = 'success' | 'warning' | 'error' | 'accent' | 'neutral';

type AstryxStatusDotRootProps = Omit<
  ComponentPropsWithoutRef<typeof StatusDot>,
  'className' | 'isPulsing' | 'label' | 'tooltip' | 'variant'
>;

export interface AstryxStatusDotProps extends AstryxStatusDotRootProps {
  label?: string;
  visibleLabel?: string;
  variant?: AstryxStatusDotVariant;
  isPulsing?: boolean;
  tooltip?: string;
  className?: string;
}

export function AstryxStatusDot({
  label = 'Online',
  visibleLabel = 'Online',
  variant = 'success',
  isPulsing = false,
  tooltip,
  className,
  ...rootProps
}: AstryxStatusDotProps) {
  return (
    <span className={className ? `astryx-status-inline ${className}` : 'astryx-status-inline'}>
      <StatusDot
        {...rootProps}
        isPulsing={isPulsing}
        label={label}
        tooltip={tooltip || undefined}
        variant={variant}
      />
      {visibleLabel ? <span>{visibleLabel}</span> : null}
    </span>
  );
}
