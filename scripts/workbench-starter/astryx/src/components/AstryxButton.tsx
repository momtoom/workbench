import { Button } from '@astryxdesign/core/Button';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AstryxButtonSize = 'sm' | 'md' | 'lg';

type AstryxButtonRootProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'children' | 'className' | 'isDisabled' | 'isLoading' | 'label' | 'size' | 'tooltip' | 'variant'
>;

export interface AstryxButtonProps extends AstryxButtonRootProps {
  label?: string;
  children?: ReactNode;
  variant?: AstryxButtonVariant;
  size?: AstryxButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  tooltip?: string;
  className?: string;
}

export function AstryxButton({
  label = 'Action',
  children,
  variant = 'secondary',
  size,
  isDisabled = false,
  isLoading = false,
  tooltip,
  className,
  ...rootProps
}: AstryxButtonProps) {
  return (
    <Button
      {...rootProps}
      className={cx('astryx-wb-button', className)}
      isDisabled={isDisabled}
      isLoading={isLoading}
      label={label}
      size={size}
      tooltip={tooltip}
      variant={variant}
    >
      {children == null ? undefined : <span className="astryx-wb-button-content">{children}</span>}
    </Button>
  );
}
