import { TextInput } from '@astryxdesign/core/TextInput';
import { useInputGroup } from '@astryxdesign/core/InputGroup';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';

export type AstryxTextInputType = 'text' | 'password' | 'email';
export type AstryxTextInputSize = 'sm' | 'md' | 'lg';

type AstryxTextInputRootProps = Omit<
  ComponentPropsWithoutRef<typeof TextInput>,
  | 'className'
  | 'description'
  | 'hasClear'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isRequired'
  | 'label'
  | 'onChange'
  | 'placeholder'
  | 'size'
  | 'type'
  | 'value'
  | 'width'
>;

export interface AstryxTextInputProps extends AstryxTextInputRootProps {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
  type?: AstryxTextInputType;
  size?: AstryxTextInputSize;
  width?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isLabelHidden?: boolean;
  hasClear?: boolean;
  className?: string;
}

export function AstryxTextInput({
  label,
  defaultValue = '',
  placeholder,
  description,
  type = 'text',
  size,
  width = '100%',
  isRequired = false,
  isDisabled = false,
  isLabelHidden = false,
  hasClear = false,
  className,
  ...rootProps
}: AstryxTextInputProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  const rootWidth = resolveAstryxFieldWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);
  const inputGroup = useInputGroup();
  const normalizedLabel = label?.trim();
  const resolvedLabel = normalizedLabel || placeholder?.trim() || 'Text input';
  const resolvedIsLabelHidden = isLabelHidden || !normalizedLabel;
  const groupStyle = { ...rootStyle, width: undefined };

  const input = (
    <TextInput
      {...(inputGroup ? rootDomProps : {})}
      className={inputGroup ? cx('astryx-wb-input-group-control', className) : undefined}
      description={description}
      hasClear={hasClear}
      isDisabled={isDisabled}
      isLabelHidden={resolvedIsLabelHidden}
      isRequired={isRequired}
      label={resolvedLabel}
      onChange={setValue}
      placeholder={placeholder}
      size={size}
      style={inputGroup ? groupStyle : undefined}
      type={type}
      value={value}
      width={inputGroup ? undefined : '100%'}
    />
  );

  if (inputGroup) return input;

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      {input}
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
