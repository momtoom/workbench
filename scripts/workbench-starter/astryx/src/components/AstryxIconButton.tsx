import { IconButton } from '@astryxdesign/core/IconButton';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';

export type AstryxIconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AstryxIconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type AstryxIconButtonRootProps = Omit<
  ComponentPropsWithoutRef<typeof IconButton>,
  'className' | 'icon' | 'isDisabled' | 'isLoading' | 'label' | 'size' | 'tooltip' | 'variant'
>;

export interface AstryxIconButtonProps extends AstryxIconButtonRootProps {
  label?: string;
  icon?: AstryxIconValue;
  variant?: AstryxIconButtonVariant;
  size?: AstryxIconButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  tooltip?: string;
  className?: string;
}

export function AstryxIconButton({
  label = 'Settings',
  icon = 'wrench',
  variant = 'ghost',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  tooltip,
  className,
  style,
  ...rootProps
}: AstryxIconButtonProps) {
  const buttonSize = size === 'xs' ? 'sm' : size;
  const iconSize = size === 'xs' ? 'xsm' : size === 'lg' ? 'md' : 'sm';
  return (
    <IconButton
      {...rootProps}
      className={className}
      icon={<AstryxIcon icon={icon || 'wrench'} size={iconSize} />}
      isDisabled={isDisabled}
      isLoading={isLoading}
      label={label}
      size={buttonSize}
      style={size === 'xs' ? { height: 24, width: 24, ...style } : style}
      tooltip={tooltip || label}
      variant={variant}
    />
  );
}
