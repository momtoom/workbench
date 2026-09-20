import { RadioListItem } from '@astryxdesign/core/RadioList';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxRadioListItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof RadioListItem>,
  'className' | 'description' | 'endContent' | 'isDisabled' | 'label' | 'startContent' | 'value'
>;

export interface AstryxRadioListItemProps extends AstryxRadioListItemRootProps {
  label?: string;
  value?: string;
  description?: string;
  startIcon?: AstryxIconValue | 'none';
  endText?: string;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxRadioListItem({
  label = 'Radio option',
  value = 'option',
  description,
  startIcon = 'none',
  endText,
  isDisabled = false,
  className,
  ...rootProps
}: AstryxRadioListItemProps) {
  const item = (
    <RadioListItem
      description={description || undefined}
      endContent={endText || undefined}
      isDisabled={isDisabled}
      label={label}
      startContent={renderRadioListItemIcon(startIcon)}
      value={value}
    />
  );

  if (!className && Object.keys(rootProps).length === 0) return item;

  return (
    <span {...rootProps} className={cx('astryx-wb-radio-list-item', className)} style={{ display: 'contents' } satisfies CSSProperties}>
      {item}
    </span>
  );
}

function renderRadioListItemIcon(icon: AstryxIconValue | 'none') {
  return icon === 'none' || icon === '' ? undefined : <AstryxIcon color="accent" icon={icon} size="sm" />;
}
