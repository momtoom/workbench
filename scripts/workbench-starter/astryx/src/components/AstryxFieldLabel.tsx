import { FieldLabel } from '@astryxdesign/core/Field';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxFieldLabelRootProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'children' | 'className'
>;

export interface AstryxFieldLabelProps extends AstryxFieldLabelRootProps {
  label?: string;
  inputID?: string;
  description?: ReactNode;
  descriptionID?: string;
  isLabelHidden?: boolean;
  isDisabled?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  labelTooltip?: string;
  className?: string;
}

export function AstryxFieldLabel({
  label = 'Label',
  inputID = 'astryx-field-label-input',
  description,
  descriptionID,
  isLabelHidden = false,
  isDisabled = false,
  isOptional = false,
  isRequired = false,
  labelTooltip,
  className,
  style,
  ...rootProps
}: AstryxFieldLabelProps) {
  return (
    <span
      {...rootProps}
      className={cx('astryx-wb-field-label', className)}
      style={{ display: 'contents', ...style }}
    >
      <FieldLabel
        description={description}
        descriptionID={descriptionID || undefined}
        inputID={inputID}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
      />
    </span>
  );
}
