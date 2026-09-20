import { Badge } from '@astryxdesign/core/Badge';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxBadgeVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'red'
  | 'teal'
  | 'yellow';

type AstryxBadgeRootProps = Omit<ComponentPropsWithoutRef<typeof Badge>, 'className' | 'label' | 'variant'>;

export interface AstryxBadgeProps extends AstryxBadgeRootProps {
  label?: string;
  variant?: AstryxBadgeVariant;
  className?: string;
}

export function AstryxBadge({ label = 'Status', variant = 'neutral', className, ...rootProps }: AstryxBadgeProps) {
  return <Badge {...rootProps} className={cx('astryx-wb-badge', className)} label={label} variant={variant} />;
}
