import { ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxToggleButtonGroupOrientation = 'horizontal' | 'vertical';
export type AstryxToggleButtonGroupSelection = 'single' | 'multiple';
export type AstryxToggleButtonGroupSize = 'sm' | 'md' | 'lg';

type AstryxToggleButtonGroupRootProps = Omit<
  ComponentPropsWithoutRef<typeof ToggleButtonGroup>,
  'children' | 'isDisabled' | 'label' | 'onChange' | 'orientation' | 'size' | 'type' | 'value'
>;

export interface AstryxToggleButtonGroupProps extends AstryxToggleButtonGroupRootProps {
  label?: string;
  selection?: AstryxToggleButtonGroupSelection;
  defaultValue?: string;
  defaultValues?: string;
  orientation?: AstryxToggleButtonGroupOrientation;
  size?: AstryxToggleButtonGroupSize;
  isDisabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AstryxToggleButtonGroup({
  label = 'Toggle group',
  selection = 'single',
  defaultValue = 'list',
  defaultValues = 'bold,italic',
  orientation = 'horizontal',
  size = 'md',
  isDisabled = false,
  className,
  children,
  ...rootProps
}: AstryxToggleButtonGroupProps) {
  const [singleValue, setSingleValue] = useState<string | null>(defaultValue || null);
  const [multipleValues, setMultipleValues] = useState(() => parseValues(defaultValues));

  useEffect(() => {
    setSingleValue(defaultValue || null);
  }, [defaultValue]);

  useEffect(() => {
    setMultipleValues(parseValues(defaultValues));
  }, [defaultValues]);

  if (selection === 'multiple') {
    return (
      <div className={cx('astryx-wb-toggle-button-group', className)}>
        <ToggleButtonGroup
          {...rootProps}
          isDisabled={isDisabled}
          label={label}
          onChange={setMultipleValues}
          orientation={orientation}
          size={size}
          type="multiple"
          value={multipleValues}
        >
          {children}
        </ToggleButtonGroup>
      </div>
    );
  }

  return (
    <div className={cx('astryx-wb-toggle-button-group', className)}>
      <ToggleButtonGroup
        {...rootProps}
        isDisabled={isDisabled}
        label={label}
        onChange={setSingleValue}
        orientation={orientation}
        size={size}
        type="single"
        value={singleValue}
      >
        {children}
      </ToggleButtonGroup>
    </div>
  );
}

function parseValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
