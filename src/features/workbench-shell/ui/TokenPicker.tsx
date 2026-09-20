import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import type { InspectorField, TokenReference, TokenRegistry, TokenType } from '@domain/design-system/tokens/types';
import type { WorkbenchInspectorTokenPickerScopeFilter } from '@domain/project/workbenchInspectorSession';
import { TokenPickerPopover, TokenPickerTrigger } from './TokenPickerParts';
import {
  TOKEN_PICKER_CLOSE_EVENT,
  type TokenPickerVariant,
} from './tokenPickerLayout';
import { useTokenPickerController } from './useTokenPickerController';
type TokenPickerProps = {
  registry: TokenRegistry;
  selected: TokenReference | null;
  ariaLabel?: string;
  autoOpen?: boolean;
  allowedTypes?: TokenType[];
  currentCollectionId?: string;
  cycleTarget?: TokenReference;
  exclude?: TokenReference[];
  field?: InspectorField;
  modeByCollection?: Partial<Record<string, string>>;
  onSelect: (reference: TokenReference) => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
  onScopeFilterChange?: (filter: TokenPickerScopeFilter) => void;
  popoverAnchorRef?: RefObject<HTMLElement | null>;
  scopeFilter?: TokenPickerScopeFilter;
  className?: string;
  triggerMode?: 'full' | 'icon';
  variant?: TokenPickerVariant;
};

export type TokenPickerScopeFilter = WorkbenchInspectorTokenPickerScopeFilter;

export function TokenPicker({
  registry,
  selected,
  ariaLabel,
  autoOpen = false,
  allowedTypes,
  currentCollectionId,
  cycleTarget,
  exclude,
  field,
  modeByCollection,
  onSelect,
  onClear,
  onOpenChange,
  onScopeFilterChange,
  popoverAnchorRef,
  scopeFilter,
  className,
  triggerMode = 'full',
  variant = 'reference',
}: TokenPickerProps) {
  const picker = useTokenPickerController({
    allowedTypes,
    autoOpen,
    currentCollectionId,
    cycleTarget,
    exclude,
    field,
    modeByCollection,
    onOpenChange,
    onScopeFilterChange,
    onSelect,
    popoverAnchorRef,
    registry,
    scopeFilter,
    selected,
    variant,
  });

  return (
    <div
      className={[
        'wb-token-picker',
        `wb-token-picker--${variant}`,
        triggerMode === 'icon' ? 'wb-token-picker--icon-trigger' : '',
        selected && onClear ? 'wb-token-picker--clearable' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      ref={picker.rootRef}
    >
      <TokenPickerTrigger
        ariaLabel={ariaLabel}
        copy={picker.copy}
        open={picker.open}
        registry={registry}
        resultListId={picker.resultListId}
        selectedResult={picker.selectedResult}
        triggerMode={triggerMode}
        triggerRef={picker.triggerRef}
        onClose={picker.closePicker}
        onOpen={picker.openPicker}
      />
      {selected && onClear ? (
        <IconButton className="wb-picker-clear" label="Clear token" title="Clear token" onClick={onClear}>
          <X size={12} />
        </IconButton>
      ) : null}

      {picker.open ? createPortal(
        <TokenPickerPopover
          collectionFilter={picker.collectionFilter}
          copy={picker.copy}
          field={field}
          groupFilter={picker.groupFilter}
          highlightedResultId={picker.highlightedResultId}
          highlight={picker.highlight}
          pickerId={picker.pickerId}
          popoverLayout={picker.popoverLayout}
          popoverRef={picker.popoverRef}
          registry={registry}
          resultListId={picker.resultListId}
          results={picker.results}
          search={picker.search}
          selectableResults={picker.selectableResults}
          selected={selected}
          selectedFilterCollection={picker.selectedFilterCollection}
          typeFilter={picker.typeFilter}
          variant={variant}
          onChoose={picker.choose}
          onClose={picker.closePicker}
          onCollectionFilterChange={picker.changeCollectionFilter}
          onGroupFilterChange={picker.changeGroupFilter}
          onMoveHighlight={picker.moveHighlight}
          onSearchChange={picker.changeSearch}
          onTypeFilterChange={picker.changeTypeFilter}
        />
      , document.body) : null}
    </div>
  );
}

export function ReferenceTokenPicker(props: Omit<TokenPickerProps, 'variant'>) {
  return <TokenPicker {...props} variant="reference" />;
}

export function InspectorTokenPicker(props: Omit<TokenPickerProps, 'variant'>) {
  return <TokenPicker {...props} variant="inspector" />;
}

export function ColorTokenPicker(props: Omit<TokenPickerProps, 'variant' | 'allowedTypes'>) {
  return <TokenPicker {...props} allowedTypes={['color']} variant="gradient-color" />;
}

export function closeAllTokenPickers() {
  window.dispatchEvent(new CustomEvent(TOKEN_PICKER_CLOSE_EVENT));
}
