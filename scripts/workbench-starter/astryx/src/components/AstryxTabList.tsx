import { Tab, TabList } from '@astryxdesign/core/TabList';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

export type AstryxTabListLayout = 'hug' | 'fill';
export type AstryxTabListSize = 'sm' | 'md' | 'lg';
export type AstryxTabListValue = 'first' | 'second' | 'third';

type AstryxTabListRootProps = Omit<
  ComponentPropsWithoutRef<typeof TabList>,
  'children' | 'className' | 'hasDivider' | 'layout' | 'onChange' | 'size' | 'value'
>;

export interface AstryxTabListProps extends AstryxTabListRootProps {
  firstLabel?: string;
  secondLabel?: string;
  thirdLabel?: string;
  defaultValue?: AstryxTabListValue;
  size?: AstryxTabListSize;
  layout?: AstryxTabListLayout;
  hasDivider?: boolean;
  className?: string;
}

export function AstryxTabList({
  firstLabel = 'Overview',
  secondLabel = 'Components',
  thirdLabel = 'Tokens',
  defaultValue = 'first',
  size = 'md',
  layout = 'hug',
  hasDivider = true,
  className,
  ...rootProps
}: AstryxTabListProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <TabList
      {...rootProps}
      className={cx('astryx-wb-tab-list', className)}
      hasDivider={hasDivider}
      layout={layout}
      onChange={(nextValue) => setValue(resolveTabValue(nextValue))}
      size={size}
      value={value}
    >
      <Tab label={firstLabel} value="first" />
      <Tab label={secondLabel} value="second" />
      <Tab label={thirdLabel} value="third" />
    </TabList>
  );
}

function resolveTabValue(value: string): AstryxTabListValue {
  return value === 'first' || value === 'second' || value === 'third' ? value : 'first';
}
