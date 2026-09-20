import { Selector } from '@astryxdesign/core/Selector';
import { renderIconSlot } from '@astryxdesign/core/Icon';
import { Children, isValidElement, useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { resolveAstryxFieldRootProps } from './AstryxFieldRoot';
import {
  AstryxSelectorDivider,
  toAstryxSelectorDividerData,
  type AstryxSelectorDividerData,
  type AstryxSelectorDividerProps,
} from './AstryxSelectorDivider';
import { cx } from './classNames';
import { isAstryxElementType } from './AstryxWorkbenchChild';
import {
  AstryxSelectorOption,
  renderAstryxSelectorOptionEndLabel,
  toAstryxSelectorOptionData,
  type AstryxSelectorOptionData,
  type AstryxSelectorOptionProps,
} from './AstryxSelectorOption';
import { AstryxSelectorSection, type AstryxSelectorSectionProps } from './AstryxSelectorSection';

export type AstryxSelectorSize = 'sm' | 'md' | 'lg';
export type AstryxSelectorStatusType = 'none' | 'warning' | 'error' | 'success';

type AstryxSelectorRootProps = Omit<
  ComponentPropsWithoutRef<typeof Selector>,
  | 'children'
  | 'changeAction'
  | 'className'
  | 'description'
  | 'hasClear'
  | 'hasSearch'
  | 'isDefaultOpen'
  | 'isDisabled'
  | 'isLabelHidden'
  | 'isLoading'
  | 'isOptional'
  | 'isRequired'
  | 'label'
  | 'labelTooltip'
  | 'onChange'
  | 'options'
  | 'placeholder'
  | 'renderOption'
  | 'searchPlaceholder'
  | 'size'
  | 'startIcon'
  | 'status'
  | 'value'
  | 'width'
>;

export interface AstryxSelectorSectionData {
  type: 'section';
  title?: string;
  options: AstryxSelectorOptionData[];
}

export type AstryxSelectorOptionItem =
  | AstryxSelectorOptionData
  | AstryxSelectorDividerData
  | AstryxSelectorSectionData;

export interface AstryxSelectorProps extends AstryxSelectorRootProps {
  label?: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: AstryxSelectorSize;
  width?: string;
  startIcon?: AstryxIconValue | 'none';
  statusType?: AstryxSelectorStatusType;
  statusMessage?: string;
  hasClear?: boolean;
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

export function AstryxSelector({
  label = 'Theme',
  description,
  defaultValue = 'neutral',
  placeholder = 'Select...',
  size = 'md',
  width = '100%',
  startIcon = 'none',
  statusType = 'none',
  statusMessage,
  hasClear = false,
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
}: AstryxSelectorProps) {
  const options = useMemo(() => collectAstryxSelectorOptions(children), [children]);
  const selectableOptions = useMemo(() => collectAstryxSelectableOptions(options), [options]);
  const fallbackValue = selectableOptions[0]?.value;
  const [value, setValue] = useState<string | null>(defaultValue || fallbackValue || null);

  useEffect(() => {
    setValue(defaultValue || fallbackValue || null);
  }, [defaultValue, fallbackValue]);

  const commonProps = {
    className: 'astryx-wb-selector',
    description: description || undefined,
    hasSearch,
    isDefaultOpen,
    isDisabled,
    isLabelHidden,
    isLoading,
    isOptional: !isRequired && isOptional,
    isRequired,
    label,
    labelTooltip: labelTooltip || undefined,
    options,
    placeholder,
    renderOption: renderAstryxSelectorOption,
    searchPlaceholder,
    size,
    startIcon: renderAstryxSelectorStartIcon(startIcon),
    status: statusType === 'none' ? undefined : { type: statusType, message: statusMessage || undefined },
    width: '100%',
  };
  const rootWidth = resolveAstryxSelectorWidth(width);
  const { rootDomProps, rootStyle } = resolveAstryxFieldRootProps(rootProps, rootWidth);
  const selector = hasClear ? (
    <Selector<AstryxSelectorOptionItem> {...commonProps} hasClear onChange={setValue} value={value} />
  ) : (
    <Selector<AstryxSelectorOptionItem>
      {...commonProps}
      hasClear={false}
      onChange={(nextValue) => setValue(nextValue)}
      value={value ?? undefined}
    />
  );

  return (
    <div
      {...rootDomProps}
      className={cx('astryx-wb-field-root', className)}
      style={rootStyle}
    >
      {selector}
    </div>
  );
}

function renderAstryxSelectorOption(option: AstryxSelectorOptionData): ReactNode {
  const endLabel = renderAstryxSelectorOptionEndLabel(option.endLabel);
  const icon = option.icon ? renderIconSlot(option.icon, { size: 'sm', color: 'secondary' }) : null;

  return (
    <span className="astryx-wb-selector-option-rendered">
      {icon ? <span className="astryx-wb-selector-option-icon">{icon}</span> : null}
      <span className="astryx-wb-selector-option-copy">
        <span className="astryx-wb-selector-option-label">{option.label || option.value}</span>
        {option.description ? (
          <span className="astryx-wb-selector-option-description">{option.description}</span>
        ) : null}
      </span>
      {endLabel}
    </span>
  );
}

function collectAstryxSelectorOptions(children: ReactNode): AstryxSelectorOptionItem[] {
  const options: AstryxSelectorOptionItem[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement<AstryxSelectorOptionProps>(child) && isAstryxElementType(child, AstryxSelectorOption, 'AstryxSelectorOption')) {
      options.push(toAstryxSelectorOptionData(child.props as AstryxSelectorOptionProps));
      return;
    }

    if (isValidElement<AstryxSelectorDividerProps>(child) && isAstryxElementType(child, AstryxSelectorDivider, 'AstryxSelectorDivider')) {
      options.push(toAstryxSelectorDividerData());
      return;
    }

    if (isValidElement<AstryxSelectorSectionProps>(child) && isAstryxElementType(child, AstryxSelectorSection, 'AstryxSelectorSection')) {
      const sectionProps = child.props as AstryxSelectorSectionProps;
      const sectionOptions = collectAstryxSelectorSectionOptions(sectionProps.children);
      if (sectionOptions.length) {
        options.push({
          type: 'section',
          title: sectionProps.title || undefined,
          options: sectionOptions,
        });
      }
    }
  });

  return options.length
    ? options
    : [
        { value: 'neutral', label: 'Neutral', description: 'Muted product UI' },
        { value: 'butter', label: 'Butter', description: 'Warm consumer surfaces' },
        { value: 'gothic', label: 'Gothic', description: 'Dark editorial styling' },
      ];
}

function collectAstryxSelectorSectionOptions(children: ReactNode): AstryxSelectorOptionData[] {
  const options: AstryxSelectorOptionData[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement<AstryxSelectorOptionProps>(child) || !isAstryxElementType(child, AstryxSelectorOption, 'AstryxSelectorOption')) return;
    options.push(toAstryxSelectorOptionData(child.props as AstryxSelectorOptionProps));
  });

  return options;
}

function collectAstryxSelectableOptions(options: AstryxSelectorOptionItem[]): AstryxSelectorOptionData[] {
  const selectableOptions: AstryxSelectorOptionData[] = [];

  for (const option of options) {
    if ('type' in option) {
      if (option.type === 'section') selectableOptions.push(...option.options);
      continue;
    }
    selectableOptions.push(option);
  }

  return selectableOptions;
}

function renderAstryxSelectorStartIcon(icon: AstryxIconValue | 'none'): ReactNode {
  if (!icon || icon === 'none') return undefined;
  return <AstryxIcon icon={icon} size="sm" />;
}

function resolveAstryxSelectorWidth(width: string): string {
  if (width === 'full') return '100%';
  if (width === 'sm') return '240px';
  if (width === 'md') return '320px';
  if (width === 'lg') return '480px';
  return width;
}
