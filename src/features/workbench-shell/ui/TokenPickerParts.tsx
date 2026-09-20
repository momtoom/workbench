import { useMemo, useState, type Ref } from 'react';
import { ChevronDown, Link2, SlidersHorizontal, X } from 'lucide-react';
import { IconButton, SelectControl, TextField } from '@shared/ui/primitives';
import { getFieldScopeCollections, getFieldScopeGroups } from '@domain/design-system/tokens/fieldScopes';
import type { InspectorField, TokenReference, TokenRegistry, TokenType } from '@domain/design-system/tokens/types';
import { TOKEN_TYPES, formatTokenType } from '@domain/design-system/tokens/metadata';
import {
  getTokenPreviewCss,
  type TokenPickerResult,
} from '@domain/design-system/tokens/query';
import { TokenSwatch, TokenTypeIcon } from './TokenVisuals';
import {
  getTokenPickerResultId,
  type TokenPickerCopy,
  type TokenPickerPopoverLayout,
  type TokenPickerVariant,
} from './tokenPickerLayout';

export function TokenPickerTrigger({
  ariaLabel,
  copy,
  onClose,
  onOpen,
  open,
  registry,
  resultListId,
  selectedResult,
  triggerMode,
  triggerRef,
}: {
  ariaLabel?: string;
  copy: TokenPickerCopy;
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
  registry: TokenRegistry;
  resultListId: string;
  selectedResult: TokenPickerResult | null;
  triggerMode: 'full' | 'icon';
  triggerRef: Ref<HTMLButtonElement>;
}) {
  const compact = triggerMode === 'icon';

  return (
    <button
      ref={triggerRef}
      type="button"
      className={[
        'wb-token-picker-trigger',
        selectedResult ? 'wb-token-picker-trigger--selected' : '',
        compact ? 'wb-token-picker-trigger--icon' : '',
      ].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      aria-controls={open ? resultListId : undefined}
      aria-expanded={open}
      aria-haspopup="listbox"
      title={selectedResult ? `${selectedResult.token.name} (${selectedResult.collection.name})` : copy.title}
      onClick={() => {
        if (open) {
          onClose();
          return;
        }
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {compact ? (
        selectedResult
          ? <TokenResultPreview result={selectedResult} registry={registry} />
          : <span className="wb-token-picker-trigger-icon"><Link2 size={13} /></span>
      ) : selectedResult ? (
        <>
          <TokenResultPreview result={selectedResult} registry={registry} />
          <span>{selectedResult.token.name}</span>
          <small>{selectedResult.collection.name}</small>
          <ChevronDown className="wb-token-picker-trigger-chevron" size={12} aria-hidden="true" />
        </>
      ) : (
        <>
          <span>{copy.placeholder}</span>
          <ChevronDown className="wb-token-picker-trigger-chevron" size={12} aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export function TokenPickerPopover({
  collectionFilter,
  copy,
  field,
  groupFilter,
  highlightedResultId,
  highlight,
  onChoose,
  onClose,
  onCollectionFilterChange,
  onGroupFilterChange,
  onMoveHighlight,
  onSearchChange,
  onTypeFilterChange,
  pickerId,
  popoverLayout,
  popoverRef,
  registry,
  resultListId,
  results,
  search,
  selectableResults,
  selected,
  selectedFilterCollection,
  typeFilter,
  variant,
}: {
  collectionFilter: string | 'all';
  copy: TokenPickerCopy;
  field?: InspectorField;
  groupFilter: string | 'all';
  highlightedResultId?: string;
  highlight: number;
  onChoose: (result: TokenPickerResult) => void;
  onClose: () => void;
  onCollectionFilterChange: (value: string | 'all') => void;
  onGroupFilterChange: (value: string | 'all') => void;
  onMoveHighlight: (delta: number) => void;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: TokenType | 'all') => void;
  pickerId: string;
  popoverLayout: TokenPickerPopoverLayout;
  popoverRef: Ref<HTMLDivElement>;
  registry: TokenRegistry;
  resultListId: string;
  results: TokenPickerResult[];
  search: string;
  selectableResults: TokenPickerResult[];
  selected: TokenReference | null;
  selectedFilterCollection: TokenRegistry['collections'][number] | null;
  typeFilter: TokenType | 'all';
  variant: TokenPickerVariant;
}) {
  const [scopeSettingsOpen, setScopeSettingsOpen] = useState(false);
  const inspectorCollections = useMemo(
    () => getFieldScopeCollections(registry, field),
    [field, registry],
  );
  const inspectorGroups = useMemo(
    () => getFieldScopeGroups(registry, field, selectedFilterCollection),
    [field, registry, selectedFilterCollection],
  );

  return (
    <div
      ref={popoverRef}
      className={`wb-token-picker-popover wb-token-picker-popover--${variant}`}
      style={{
        top: popoverLayout.top,
        left: popoverLayout.left,
        maxHeight: popoverLayout.maxHeight,
        width: popoverLayout.width,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          onMoveHighlight(1);
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onMoveHighlight(-1);
        }
        if (event.key === 'Enter') {
          const target = selectableResults[highlight];
          if (target) onChoose(target);
        }
      }}
    >
      <div className="wb-picker-tabs">
        <strong>{copy.title}</strong>
        <div className="wb-picker-actions">
          {variant === 'inspector' ? (
            <IconButton
              className={scopeSettingsOpen ? 'wb-picker-config wb-picker-config--active' : 'wb-picker-config'}
              label="Filter linked token scopes"
              title="Filter linked token scopes"
              aria-pressed={scopeSettingsOpen}
              onClick={() => setScopeSettingsOpen((open) => !open)}
            >
              <SlidersHorizontal size={13} />
            </IconButton>
          ) : null}
          <IconButton className="wb-picker-close" label="Close token picker" onClick={onClose}>
            <X size={13} />
          </IconButton>
        </div>
      </div>
      {variant === 'inspector' ? (
        <div className="wb-picker-inspector-tools">
          {scopeSettingsOpen ? (
            <div className="wb-picker-scope-panel" aria-label="Linked token scope filters">
              <SelectControl<string | 'all'> className="wb-picker-filter--full" aria-label="Filter linked token collection" value={collectionFilter} onValueChange={onCollectionFilterChange}>
                <option value="all">All linked collections</option>
                {inspectorCollections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
              </SelectControl>
              {selectedFilterCollection && inspectorGroups.length > 0 ? (
                <SelectControl<string | 'all'> className="wb-picker-filter--full" aria-label="Filter linked token group" value={groupFilter} onValueChange={onGroupFilterChange}>
                  <option value="all">All linked groups</option>
                  {inspectorGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </SelectControl>
              ) : null}
            </div>
          ) : null}
          <div className="wb-picker-controls wb-picker-controls--inspector">
            <TextField autoFocus aria-label="Search tokens" placeholder="Search linked tokens" value={search} onValueChange={onSearchChange} />
          </div>
        </div>
      ) : (
        <div className="wb-picker-controls">
          <SelectControl<string | 'all'> className="wb-picker-filter--full" aria-label="Filter token collection" value={collectionFilter} onValueChange={onCollectionFilterChange}>
            <option value="all">All collections</option>
            {registry.collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
          </SelectControl>
          {selectedFilterCollection && selectedFilterCollection.groups.length > 0 ? (
            <SelectControl<string | 'all'> className="wb-picker-filter--full" aria-label="Filter token group" value={groupFilter} onValueChange={onGroupFilterChange}>
              <option value="all">All groups</option>
              {selectedFilterCollection.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </SelectControl>
          ) : null}
          <TextField autoFocus aria-label="Search tokens" placeholder="Search name, collection, value" value={search} onValueChange={onSearchChange} />
          <SelectControl<TokenType | 'all'> className="wb-picker-type-filter" aria-label="Filter token type" value={typeFilter} onValueChange={onTypeFilterChange}>
            <option value="all">All types</option>
            {TOKEN_TYPES.map((type) => <option key={type} value={type}>{formatTokenType(type)}</option>)}
          </SelectControl>
        </div>
      )}
      <div
        id={resultListId}
        className="wb-picker-results"
        role="listbox"
        aria-activedescendant={highlightedResultId}
        aria-label="Token results"
      >
        {results.map((result) => (
          <TokenPickerResultRow
            key={`${result.collection.id}:${result.token.id}`}
            highlight={highlight}
            onChoose={onChoose}
            pickerId={pickerId}
            registry={registry}
            result={result}
            selectableResults={selectableResults}
            selected={selected}
            variant={variant}
          />
        ))}
        {results.length === 0 ? <div className="wb-picker-empty">No matching tokens.</div> : null}
      </div>
    </div>
  );
}

function TokenPickerResultRow({
  highlight,
  onChoose,
  pickerId,
  registry,
  result,
  selectableResults,
  selected,
  variant,
}: {
  highlight: number;
  onChoose: (result: TokenPickerResult) => void;
  pickerId: string;
  registry: TokenRegistry;
  result: TokenPickerResult;
  selectableResults: TokenPickerResult[];
  selected: TokenReference | null;
  variant: TokenPickerVariant;
}) {
  const selectableIndex = selectableResults.indexOf(result);
  const isSelected = selected?.collectionId === result.collection.id && selected.tokenId === result.token.id;
  return (
    <button
      id={getTokenPickerResultId(pickerId, result)}
      type="button"
      role="option"
      className={[
        'wb-picker-result',
        !result.compatible ? 'wb-picker-result--disabled' : '',
        isSelected ? 'wb-picker-result--selected' : '',
        selectableIndex === highlight ? 'wb-picker-result--highlight' : '',
      ].filter(Boolean).join(' ')}
      disabled={!result.compatible}
      aria-current={isSelected ? 'true' : undefined}
      aria-selected={isSelected}
      onClick={() => onChoose(result)}
    >
      <TokenResultPreview result={result} registry={registry} />
      <span>
        <span className="wb-picker-result-name">{result.token.name}</span>
        {variant === 'inspector' ? null : <small>{result.collection.name} · {formatTokenType(result.token.type)}</small>}
      </span>
      <code title={result.previewText}>{result.previewText}</code>
      {variant === 'inspector' ? null : result.disabledReason ? <em>{result.disabledReason}</em> : null}
    </button>
  );
}

function TokenResultPreview({ result, registry }: { result: TokenPickerResult; registry: TokenRegistry }) {
  const css = getTokenPreviewCss(result, registry);
  if ((result.token.type === 'color' || result.token.type === 'gradient') && css) {
    return <TokenSwatch color={css} wide={result.token.type === 'gradient'} />;
  }
  return <TokenTypeIcon type={result.token.type} />;
}
