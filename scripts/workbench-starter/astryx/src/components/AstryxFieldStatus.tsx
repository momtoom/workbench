import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxFieldStatusType = 'success' | 'warning' | 'error';
export type AstryxFieldStatusVariant = 'attached' | 'detached';

type AstryxFieldStatusRootProps = Omit<
  ComponentPropsWithoutRef<typeof FieldStatus>,
  'className' | 'message' | 'type' | 'variant'
>;

export interface AstryxFieldStatusProps extends AstryxFieldStatusRootProps {
  type?: AstryxFieldStatusType;
  message?: string;
  variant?: AstryxFieldStatusVariant;
  className?: string;
}

export function AstryxFieldStatus({
  type = 'success',
  message = 'Saved successfully.',
  variant = 'detached',
  className,
  ...rootProps
}: AstryxFieldStatusProps) {
  return (
    <FieldStatus
      {...rootProps}
      className={cx('astryx-wb-field-status', className)}
      message={message}
      type={type}
      variant={variant}
    />
  );
}
