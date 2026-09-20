import { CheckboxList } from '@astryxdesign/core/CheckboxList';
import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxCheckboxListDensity = 'compact' | 'balanced' | 'spacious';
export type AstryxCheckboxListStatus = 'none' | 'success' | 'warning' | 'error';

type AstryxCheckboxListRootProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxList>,
  | 'children'
  | 'className'
  | 'description'
  | 'density'
  | 'hasDividers'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isReadOnly'
  | 'label'
  | 'onChange'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxCheckboxListProps extends AstryxCheckboxListRootProps {
  label?: string;
  description?: string;
  defaultValues?: string;
  status?: AstryxCheckboxListStatus;
  statusMessage?: string;
  density?: AstryxCheckboxListDensity;
  hasDividers?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isLabelHidden?: boolean;
  width?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxCheckboxList({
  label = 'Notification channels',
  description = 'Choose every channel that should receive updates.',
  defaultValues = 'email,push',
  status = 'none',
  statusMessage = '',
  density = 'balanced',
  hasDividers = false,
  isDisabled = false,
  isReadOnly = false,
  isLabelHidden = false,
  width = '100%',
  className,
  children,
  ...rootProps
}: AstryxCheckboxListProps) {
  const [value, setValue] = useState(() => parseValues(defaultValues));

  useEffect(() => {
    setValue(parseValues(defaultValues));
  }, [defaultValues]);

  return (
    <CheckboxList
      {...rootProps}
      className={cx('astryx-wb-checkbox-list', className)}
      density={density}
      description={description || undefined}
      hasDividers={hasDividers}
      isDisabled={isDisabled}
      isLabelHidden={isLabelHidden}
      isReadOnly={isReadOnly}
      label={label}
      onChange={setValue}
      status={resolveCheckboxListStatus(status, statusMessage)}
      value={value}
      width={resolveAstryxFieldWidth(width)}
    >
      {children}
    </CheckboxList>
  );
}

function parseValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveCheckboxListStatus(status: AstryxCheckboxListStatus, message: string) {
  return status === 'none' ? undefined : { type: status, message: message || `${status} status` };
}

function resolveAstryxFieldWidth(width: string): string {
  if (width === 'inherit') return '';
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
