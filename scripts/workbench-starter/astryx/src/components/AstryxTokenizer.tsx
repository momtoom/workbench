import { Tokenizer } from '@astryxdesign/core/Tokenizer';
import {
  createStaticSource,
} from '@astryxdesign/core/Typeahead';
import { useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import {
  AstryxTokenizerItemPresentationContext,
  collectAstryxTokenizerItems,
  type AstryxTokenizerSearchableItem,
} from './AstryxTokenizerItem';
import { cx } from './classNames';
import {
  AstryxTypeaheadPointerBoundary,
  useStableAstryxChildren,
} from './stableChildren';

export type AstryxTokenizerSize = 'sm' | 'md' | 'lg';
export type AstryxTokenizerStatus = 'none' | 'success' | 'warning' | 'error';
export type AstryxTokenizerOverflow = 'none' | 'unfocusedInline' | 'unfocusedLayer';
type RootProps = Omit<
  ComponentPropsWithoutRef<typeof Tokenizer<AstryxTokenizerSearchableItem>>,
  | 'className' | 'description' | 'hasAutoFocus' | 'hasClear' | 'hasCreate'
  | 'hasEntriesOnFocus' | 'isDisabled' | 'isLabelHidden' | 'isOptional'
  | 'isRequired' | 'label' | 'labelTooltip' | 'maxEntries' | 'maxMenuItems'
  | 'onChange' | 'placeholder' | 'searchSource' | 'size'
  | 'tokenOverflowBehavior'
  | 'status' | 'value' | 'width'
>;
export interface AstryxTokenizerProps extends RootProps {
  children?: ReactNode;
  label?: string;
  description?: string;
  placeholder?: string;
  size?: AstryxTokenizerSize;
  status?: AstryxTokenizerStatus;
  statusMessage?: string;
  width?: string;
  maxEntries?: number;
  maxMenuItems?: number;
  overflowBehavior?: AstryxTokenizerOverflow;
  hasEntriesOnFocus?: boolean;
  hasClear?: boolean;
  hasCreate?: boolean;
  hasAutoFocus?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}
export function AstryxTokenizer({
  children,
  label = 'Collaborators',
  description = 'Click the field and type to add another person.',
  placeholder = 'Add collaborators',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '480px',
  maxEntries = 5,
  maxMenuItems = 10,
  overflowBehavior = 'none',
  hasEntriesOnFocus = true,
  hasClear = true,
  hasCreate = false,
  hasAutoFocus = false,
  isDisabled = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxTokenizerProps) {
  const stableChildren = useStableAstryxChildren(children);
  const options = useMemo(
    () => collectAstryxTokenizerItems(stableChildren),
    [stableChildren],
  );
  const source = useMemo(() => createStaticSource(options), [options]);
  const [value, setValue] = useState<AstryxTokenizerSearchableItem[]>(
    () => findSelectedItems(options),
  );
  useEffect(() => setValue(findSelectedItems(options)), [options]);
  return (
    <AstryxTypeaheadPointerBoundary>
      <Tokenizer<AstryxTokenizerSearchableItem>
        {...rootProps}
        className={cx('astryx-wb-tokenizer', className)}
        description={description || undefined}
        hasAutoFocus={hasAutoFocus}
        hasClear={hasClear}
        hasCreate={hasCreate}
        hasEntriesOnFocus={hasEntriesOnFocus}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        maxEntries={maxEntries}
        maxMenuItems={maxMenuItems}
        onChange={setValue}
        placeholder={placeholder}
        renderToken={(item, onRemove) => (
          <AstryxTokenizerItemPresentationContext.Provider
            value={{ kind: 'token', onRemove, size }}
          >
            {item.auxiliaryData?.sourceElement}
          </AstryxTokenizerItemPresentationContext.Provider>
        )}
        searchSource={source}
        size={size}
        status={status === 'none' ? undefined : { type: status, message: statusMessage || `${status} status` }}
        tokenOverflowBehavior={overflowBehavior}
        value={value}
        width={resolveWidth(width)}
      />
    </AstryxTypeaheadPointerBoundary>
  );
}

function findSelectedItems(items: AstryxTokenizerSearchableItem[]) {
  return items.filter((item) => item.auxiliaryData?.isSelected);
}
function resolveWidth(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
