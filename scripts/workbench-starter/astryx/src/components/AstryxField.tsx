import { Field } from '@astryxdesign/core/Field';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxFieldValidationType = 'none' | 'warning' | 'error' | 'success';
export type AstryxFieldValidationVariant = 'attached' | 'detached';

type AstryxFieldRootProps = Omit<
  ComponentPropsWithoutRef<typeof Field>,
  | 'children'
  | 'className'
  | 'description'
  | 'descriptionID'
  | 'inputID'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelIcon'
  | 'labelTooltip'
  | 'status'
  | 'statusVariant'
  | 'width'
>;

export interface AstryxFieldProps extends AstryxFieldRootProps {
  label?: string;
  inputID?: string;
  description?: string;
  descriptionID?: string;
  isLabelHidden?: boolean;
  isDisabled?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  labelTooltip?: string;
  statusType?: AstryxFieldValidationType;
  statusMessage?: string;
  statusVariant?: AstryxFieldValidationVariant;
  width?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxField({
  label = 'Project name',
  inputID = 'astryx-field-input',
  description,
  descriptionID,
  isLabelHidden = false,
  isDisabled = false,
  isOptional = false,
  isRequired = false,
  labelTooltip,
  statusType = 'none',
  statusMessage,
  statusVariant = 'attached',
  width = '100%',
  className,
  children,
  ...rootProps
}: AstryxFieldProps) {
  return (
    <Field
      {...rootProps}
      className={cx('astryx-wb-field', className)}
      description={description || undefined}
      descriptionID={descriptionID || undefined}
      inputID={inputID}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isOptional={isOptional}
      isRequired={isRequired}
      label={label}
      labelTooltip={labelTooltip || undefined}
      status={statusType === 'none' ? undefined : { type: statusType, message: statusMessage || undefined }}
      statusVariant={statusVariant}
      width={resolveAstryxFieldWidth(width)}
    >
      {children}
    </Field>
  );
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
