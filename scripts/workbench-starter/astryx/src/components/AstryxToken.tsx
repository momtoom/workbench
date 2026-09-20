import { Token } from '@astryxdesign/core/Token';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';

export type AstryxTokenSize = 'sm' | 'md' | 'lg';
export type AstryxTokenColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

type AstryxTokenRootProps = Omit<
  ComponentPropsWithoutRef<typeof Token>,
  | 'className'
  | 'color'
  | 'description'
  | 'endContent'
  | 'href'
  | 'icon'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'label'
  | 'onClick'
  | 'onRemove'
  | 'size'
>;

export interface AstryxTokenProps extends AstryxTokenRootProps {
  label?: string;
  size?: AstryxTokenSize;
  color?: AstryxTokenColor;
  icon?: AstryxIconValue | 'none';
  endText?: string;
  href?: string;
  description?: string;
  isDisabled?: boolean;
  isLabelHidden?: boolean;
  isRemovable?: boolean;
  isClickable?: boolean;
  className?: string;
}

export function AstryxToken({
  label = 'Design token',
  size = 'md',
  color = 'default',
  icon = 'none',
  endText,
  href,
  description,
  isDisabled = false,
  isLabelHidden = false,
  isRemovable = false,
  isClickable = false,
  className,
  ...rootProps
}: AstryxTokenProps) {
  return (
    <Token
      {...rootProps}
      className={className}
      color={color}
      description={description || undefined}
      endContent={endText || undefined}
      href={href || undefined}
      icon={icon === 'none' || icon === '' ? undefined : <AstryxIcon icon={icon || 'info'} />}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      label={label}
      onClick={isClickable ? () => undefined : undefined}
      onRemove={isRemovable ? () => undefined : undefined}
      size={size}
    />
  );
}
