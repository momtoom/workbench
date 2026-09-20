import { TextArea } from '@astryxdesign/core/TextArea';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxTextAreaSize = 'sm' | 'md' | 'lg';
export type AstryxTextAreaStatus = 'none' | 'warning' | 'error' | 'success';

type AstryxTextAreaRootProps = Omit<
  ComponentPropsWithoutRef<typeof TextArea>,
  | 'className'
  | 'description'
  | 'hasSpellCheck'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'maxLength'
  | 'onChange'
  | 'placeholder'
  | 'rows'
  | 'size'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxTextAreaProps extends AstryxTextAreaRootProps {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
  rows?: number;
  maxLength?: number;
  size?: AstryxTextAreaSize;
  width?: string;
  status?: AstryxTextAreaStatus;
  statusMessage?: string;
  isLabelHidden?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasSpellCheck?: boolean;
  className?: string;
}

export function AstryxTextArea({
  label = 'Description',
  defaultValue = '',
  placeholder = 'Write a longer note',
  description,
  rows = 4,
  maxLength = 0,
  size = 'md',
  width = '100%',
  status = 'none',
  statusMessage,
  isLabelHidden = false,
  isOptional = false,
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  hasSpellCheck = true,
  className,
  ...rootProps
}: AstryxTextAreaProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  const rootWidth = resolveAstryxFieldWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      <TextArea
        description={description || undefined}
        hasSpellCheck={hasSpellCheck}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isOptional={!isRequired && isOptional}
        isRequired={isRequired}
        label={label}
        maxLength={maxLength > 0 ? maxLength : undefined}
        onChange={setValue}
        placeholder={placeholder}
        rows={rows}
        size={size}
        status={status === 'none' ? undefined : { type: status, message: statusMessage || undefined }}
        value={value}
        width="100%"
      />
    </div>
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
