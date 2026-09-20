import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxSegmentedControlLayout = 'hug' | 'fill';
export type AstryxSegmentedControlSize = 'sm' | 'md' | 'lg';
export type AstryxSegmentedControlValue = 'first' | 'second' | 'third';

type AstryxSegmentedControlRootProps = Omit<
  ComponentPropsWithoutRef<typeof SegmentedControl>,
  'children' | 'className' | 'isDisabled' | 'label' | 'layout' | 'onChange' | 'size' | 'value'
>;

export interface AstryxSegmentedControlProps extends AstryxSegmentedControlRootProps {
  label?: string;
  firstLabel?: string;
  secondLabel?: string;
  thirdLabel?: string;
  defaultValue?: AstryxSegmentedControlValue;
  size?: AstryxSegmentedControlSize;
  layout?: AstryxSegmentedControlLayout;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxSegmentedControl({
  label = 'View mode',
  firstLabel = 'Grid',
  secondLabel = 'List',
  thirdLabel = 'Table',
  defaultValue = 'first',
  size = 'md',
  layout = 'hug',
  isDisabled = false,
  className,
  ...rootProps
}: AstryxSegmentedControlProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <SegmentedControl
      {...rootProps}
      className={cx('astryx-wb-segmented-control', className)}
      isDisabled={isDisabled}
      label={label}
      layout={layout}
      onChange={(nextValue) => setValue(resolveSegmentValue(nextValue))}
      size={size}
      value={value}
    >
      <SegmentedControlItem label={firstLabel} value="first" />
      <SegmentedControlItem label={secondLabel} value="second" />
      <SegmentedControlItem label={thirdLabel} value="third" />
    </SegmentedControl>
  );
}

function resolveSegmentValue(value: string): AstryxSegmentedControlValue {
  return value === 'first' || value === 'second' || value === 'third' ? value : 'first';
}
