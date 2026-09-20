import { CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxCheckboxListItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxListItem>,
  | 'className'
  | 'description'
  | 'endContent'
  | 'isChecked'
  | 'isDisabled'
  | 'isLoading'
  | 'label'
  | 'onCheck'
  | 'value'
>;

export interface AstryxCheckboxListItemProps extends AstryxCheckboxListItemRootProps {
  label?: string;
  value?: string;
  description?: string;
  endText?: string;
  endIcon?: AstryxIconValue | 'none';
  defaultChecked?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function AstryxCheckboxListItem({
  label = 'Checkbox option',
  value = 'option',
  description,
  endText,
  endIcon = 'none',
  defaultChecked = false,
  isDisabled = false,
  isLoading = false,
  className,
  ...rootProps
}: AstryxCheckboxListItemProps) {
  const item = (
    <CheckboxListItem
      description={description || undefined}
      endContent={renderEndContent(endText, endIcon)}
      isChecked={defaultChecked}
      isDisabled={isDisabled}
      isLoading={isLoading}
      label={label}
      value={value}
    />
  );

  if (!className && Object.keys(rootProps).length === 0) return item;

  return (
    <span {...rootProps} className={cx('astryx-wb-checkbox-list-item', className)} style={{ display: 'contents' } satisfies CSSProperties}>
      {item}
    </span>
  );
}

function renderEndContent(endText: string | undefined, endIcon: AstryxIconValue | 'none') {
  if (endIcon !== 'none' && endIcon !== '') return <AstryxIcon color="secondary" icon={endIcon} size="sm" />;
  return endText || undefined;
}
