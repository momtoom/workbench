import {
  Typeahead,
  createStaticSource,
} from '@astryxdesign/core/Typeahead';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import {
  collectAstryxSearchItems,
  type AstryxSearchableItem,
} from './AstryxSearchItem';
import { cx } from './classNames';
import {
  AstryxTypeaheadPointerBoundary,
  useStableAstryxChildren,
} from './stableChildren';

export type AstryxTypeaheadSize = 'sm' | 'md' | 'lg';
export type AstryxTypeaheadStatus = 'none' | 'success' | 'warning' | 'error';
type RootProps = Omit<
  ComponentPropsWithoutRef<typeof Typeahead<AstryxSearchableItem>>,
  | 'className' | 'description' | 'hasAutoFocus' | 'hasClear' | 'hasEntriesOnFocus'
  | 'isDisabled' | 'isLabelHidden' | 'isOptional' | 'isRequired' | 'label'
  | 'labelTooltip' | 'maxMenuItems' | 'onChange' | 'placeholder' | 'searchSource'
  | 'size' | 'status' | 'value' | 'width'
>;
export interface AstryxTypeaheadProps extends RootProps {
  children?: ReactNode;
  label?: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: AstryxTypeaheadSize;
  status?: AstryxTypeaheadStatus;
  statusMessage?: string;
  width?: string;
  maxMenuItems?: number;
  hasEntriesOnFocus?: boolean;
  hasClear?: boolean;
  hasAutoFocus?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  isLabelHidden?: boolean;
  labelTooltip?: string;
  className?: string;
}
export function AstryxTypeahead({
  children,
  label = 'Assignee',
  description = 'Search and select one person.',
  defaultValue = '',
  placeholder = 'Search people',
  size = 'md',
  status = 'none',
  statusMessage = '',
  width = '360px',
  maxMenuItems = 10,
  hasEntriesOnFocus = true,
  hasClear = true,
  hasAutoFocus = false,
  isDisabled = false,
  isRequired = false,
  isOptional = false,
  isLabelHidden = false,
  labelTooltip = '',
  className,
  ...rootProps
}: AstryxTypeaheadProps) {
  const boundaryRef = useRef<HTMLSpanElement>(null);
  const suppressForwardedQueryChangeRef = useRef(false);
  const stableChildren = useStableAstryxChildren(children);
  const options = useMemo(
    () => collectAstryxSearchItems(stableChildren),
    [stableChildren],
  );
  const previousOptionsRef = useRef(options);
  const source = useMemo(() => createStaticSource(options), [options]);
  const [value, setValue] = useState<AstryxSearchableItem | null>(
    () => findItem(options, defaultValue),
  );
  useEffect(() => setValue(findItem(options, defaultValue)), [defaultValue, options]);
  const handleQueryChange = useCallback((query: string) => {
    if (!suppressForwardedQueryChangeRef.current) {
      rootProps.onChangeQuery?.(query);
    }
  }, [rootProps.onChangeQuery]);

  useLayoutEffect(() => {
    if (previousOptionsRef.current === options) return;
    previousOptionsRef.current = options;

    const input = boundaryRef.current?.querySelector<HTMLInputElement>(
      'input[role="combobox"]',
    );
    if (
      !input ||
      input.getAttribute('aria-expanded') !== 'true' ||
      input.ownerDocument.activeElement !== input
    ) {
      return;
    }

    // Astryx core keeps the open Typeahead results in local state and does not
    // re-bootstrap when searchSource changes. Re-run its public input-query
    // path with a trim-equivalent query so an edited child collection updates
    // in place without remounting the field, losing focus, or closing the
    // native popover.
    suppressForwardedQueryChangeRef.current = true;
    try {
      refreshOpenTypeaheadResults(input);
    } finally {
      suppressForwardedQueryChangeRef.current = false;
    }
  }, [options]);

  return (
    <AstryxTypeaheadPointerBoundary boundaryRef={boundaryRef}>
      <Typeahead
        {...rootProps}
        className={cx('astryx-wb-typeahead', className)}
        debounceMs={rootProps.debounceMs ?? 0}
        description={description || undefined}
        hasAutoFocus={hasAutoFocus}
        hasClear={hasClear}
        hasEntriesOnFocus={hasEntriesOnFocus}
        isDisabled={isDisabled}
        isLabelHidden={isLabelHidden}
        isOptional={isOptional}
        isRequired={isRequired}
        label={label}
        labelTooltip={labelTooltip || undefined}
        maxMenuItems={maxMenuItems}
        onChange={setValue}
        onChangeQuery={handleQueryChange}
        placeholder={placeholder}
        searchSource={source}
        size={size}
        status={status === 'none' ? undefined : { type: status, message: statusMessage || `${status} status` }}
        value={value}
        width={resolveWidth(width)}
      />
    </AstryxTypeaheadPointerBoundary>
  );
}

function refreshOpenTypeaheadResults(input: HTMLInputElement): void {
  const ownerWindow = input.ownerDocument.defaultView;
  if (!ownerWindow) return;
  const nativeValueSetter = Object.getOwnPropertyDescriptor(
    ownerWindow.HTMLInputElement.prototype,
    'value',
  )?.set;
  if (!nativeValueSetter) return;

  const query = input.value;
  nativeValueSetter.call(input, `${query} `);
  input.dispatchEvent(new ownerWindow.Event('input', { bubbles: true }));
  nativeValueSetter.call(input, query);
  input.dispatchEvent(new ownerWindow.Event('input', { bubbles: true }));
}

function findItem(items: AstryxSearchableItem[], value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized) {
    return items.find(
      (item) =>
        item.id.toLowerCase() === normalized ||
        item.label.toLowerCase() === normalized,
    ) ?? null;
  }
  return items.find((item) => item.auxiliaryData?.isDefaultSelected) ?? null;
}
function resolveWidth(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
