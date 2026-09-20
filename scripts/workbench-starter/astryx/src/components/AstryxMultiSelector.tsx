import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { Children, isValidElement, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import { cx } from './classNames';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import {
  AstryxSelectorOption,
  toAstryxSelectorOptionData,
  type AstryxSelectorOptionData,
  type AstryxSelectorOptionProps,
} from './AstryxSelectorOption';

export type AstryxMultiSelectorSize = 'sm' | 'md' | 'lg';
export type AstryxMultiSelectorStatusType = 'none' | 'warning' | 'error' | 'success';
export type AstryxMultiSelectorTriggerDisplay = 'count' | 'labels' | 'badges';

type AstryxMultiSelectorRootProps = Omit<
  ComponentPropsWithoutRef<typeof MultiSelector>,
  | 'children'
  | 'className'
  | 'description'
  | 'hasClear'
  | 'hasSearch'
  | 'hasSelectAll'
  | 'isDefaultOpen'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'maxBadges'
  | 'onChange'
  | 'options'
  | 'placeholder'
  | 'renderOption'
  | 'searchPlaceholder'
  | 'selectAllLabel'
  | 'size'
  | 'status'
  | 'triggerDisplay'
  | 'value'
  | 'width'
>;

export interface AstryxMultiSelectorProps extends AstryxMultiSelectorRootProps {
  label?: string;
  description?: string;
  defaultValues?: string;
  placeholder?: string;
  size?: AstryxMultiSelectorSize;
  width?: string;
  statusType?: AstryxMultiSelectorStatusType;
  statusMessage?: string;
  triggerDisplay?: AstryxMultiSelectorTriggerDisplay;
  maxBadges?: number;
  hasClear?: boolean;
  hasSelectAll?: boolean;
  selectAllLabel?: string;
  hasSearch?: boolean;
  searchPlaceholder?: string;
  isDefaultOpen?: boolean;
  isDisabled?: boolean;
  isLabelHidden?: boolean;
  isLoading?: boolean;
  isOptional?: boolean;
  isRequired?: boolean;
  labelTooltip?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxMultiSelector({
  label = 'Visible columns',
  description,
  defaultValues = 'name,status',
  placeholder = 'Select...',
  size = 'md',
  width = '100%',
  statusType = 'none',
  statusMessage,
  triggerDisplay = 'count',
  maxBadges = 3,
  hasClear = true,
  hasSelectAll = true,
  selectAllLabel = 'Select all',
  hasSearch = false,
  searchPlaceholder = 'Search...',
  isDefaultOpen = false,
  isDisabled = false,
  isLabelHidden = false,
  isLoading = false,
  isOptional = false,
  isRequired = false,
  labelTooltip,
  className,
  children,
  ...rootProps
}: AstryxMultiSelectorProps) {
  const options = useMemo(() => collectAstryxMultiSelectorOptions(children), [children]);
  const [values, setValues] = useState(() => parseDefaultValues(defaultValues));

  useEffect(() => {
    setValues(parseDefaultValues(defaultValues));
  }, [defaultValues]);
  const rootWidth = resolveAstryxMultiSelectorWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      <MultiSelector<AstryxSelectorOptionData>
        className="astryx-wb-multi-selector"
        description={description || undefined}
        hasClear={hasClear}
        hasSearch={hasSearch}
        hasSelectAll={hasSelectAll}
        isDefaultOpen={isDefaultOpen}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isLoading={isLoading}
        isOptional={!isRequired && isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        maxBadges={maxBadges}
        onChange={setValues}
        options={options}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        selectAllLabel={selectAllLabel}
        size={size}
        status={statusType === 'none' ? undefined : { type: statusType, message: statusMessage || undefined }}
        triggerDisplay={triggerDisplay}
        value={values}
        width="100%"
      />
    </div>
  );
}

function collectAstryxMultiSelectorOptions(children: ReactNode): AstryxSelectorOptionData[] {
  const options: AstryxSelectorOptionData[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement<AstryxSelectorOptionProps>(child) || !isAstryxElementType(child, AstryxSelectorOption, 'AstryxSelectorOption')) return;
    options.push(toAstryxSelectorOptionData(child.props));
  });

  return options.length
    ? options
    : [
        { value: 'name', label: 'Name', description: 'Primary title column' },
        { value: 'status', label: 'Status', description: 'Workflow state' },
        { value: 'owner', label: 'Owner', description: 'Responsible person' },
      ];
}

function parseDefaultValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveAstryxMultiSelectorWidth(width: string): string {
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
