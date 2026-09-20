import { RadioList } from '@astryxdesign/core/RadioList';
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxRadioListOrientation = 'vertical' | 'horizontal';
export type AstryxRadioListSize = 'sm' | 'md';
export type AstryxRadioListValue = string;

type AstryxRadioListRootProps = Omit<
  ComponentPropsWithoutRef<typeof RadioList>,
  | 'children'
  | 'className'
  | 'description'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'onChange'
  | 'orientation'
  | 'size'
  | 'value'
  | 'width'
>;

export interface AstryxRadioListProps extends AstryxRadioListRootProps {
  label?: string;
  description?: string;
  children?: ReactNode;
  defaultValue?: AstryxRadioListValue;
  orientation?: AstryxRadioListOrientation;
  size?: AstryxRadioListSize;
  width?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  className?: string;
}

export function AstryxRadioList({
  label = 'Content density',
  description = 'Choose the spacing density for this component.',
  children,
  defaultValue = 'balanced',
  orientation = 'vertical',
  size = 'md',
  width = '100%',
  isDisabled = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  className,
  ...rootProps
}: AstryxRadioListProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <RadioList
      {...rootProps}
      className={cx('astryx-wb-radio-list', className)}
      description={description || undefined}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isOptional={!isRequired && isOptional}
      isRequired={isRequired}
      label={label}
      onChange={(nextValue) => setValue(nextValue)}
      orientation={orientation}
      size={size}
      value={value}
      width={resolveAstryxFieldWidth(width)}
    >
      {children}
    </RadioList>
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
