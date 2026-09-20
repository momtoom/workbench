import { InputGroup } from '@astryxdesign/core/InputGroup';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxInputGroupSize = 'sm' | 'md' | 'lg';
export type AstryxInputGroupStatus = 'none' | 'error' | 'warning' | 'success';

type AstryxInputGroupRootProps = Omit<
  ComponentPropsWithoutRef<typeof InputGroup>,
  | 'children'
  | 'className'
  | 'description'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'size'
  | 'status'
>;

export interface AstryxInputGroupProps extends AstryxInputGroupRootProps {
  label?: string;
  description?: string;
  isLabelHidden?: boolean;
  isDisabled?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  size?: AstryxInputGroupSize;
  status?: AstryxInputGroupStatus;
  labelTooltip?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxInputGroup({
  label = 'URL',
  description,
  isLabelHidden = false,
  isDisabled = false,
  isOptional = false,
  isRequired = false,
  size = 'md',
  status = 'none',
  labelTooltip,
  className,
  children,
  ...rootProps
}: AstryxInputGroupProps) {
  return (
    <InputGroup
      {...rootProps}
      className={cx('astryx-wb-input-group', className)}
      description={description || undefined}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isOptional={isOptional}
      isRequired={isRequired}
      label={label}
      labelTooltip={labelTooltip || undefined}
      size={size}
      status={status === 'none' ? undefined : { type: status }}
    >
      {children}
    </InputGroup>
  );
}
