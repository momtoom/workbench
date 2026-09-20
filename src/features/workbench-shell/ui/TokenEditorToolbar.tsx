import { Download, Redo2, Undo2 } from 'lucide-react';
import { Button, IconButton, SearchField, SelectControl } from '@shared/ui/primitives';
import { TOKEN_TYPES, formatTokenType } from '@domain/design-system/tokens/metadata';
import { WorkbenchEditorToolbar } from './WorkbenchEditorShell';
import type { SaveState, SaveTrigger } from './useTokenEditorHistory';
import type { TokenTypeFilter } from './useTokenEditorFilters';

type TokenEditorToolbarProps = {
  canRedo: boolean;
  canUndo: boolean;
  isDirty: boolean;
  onRedo: () => void;
  onExportRegistry: () => void;
  onUndo: () => void;
  persistTokens: (trigger: SaveTrigger) => void | Promise<void>;
  query: string;
  saveState: SaveState;
  setQuery: (query: string) => void;
  setTypeFilter: (filter: TokenTypeFilter) => void;
  title: string;
  typeFilter: TokenTypeFilter;
};

export function TokenEditorToolbar({
  canRedo,
  canUndo,
  isDirty,
  onRedo,
  onExportRegistry,
  onUndo,
  persistTokens,
  query,
  saveState,
  setQuery,
  setTypeFilter,
  title,
  typeFilter,
}: TokenEditorToolbarProps) {
  return (
    <WorkbenchEditorToolbar
      className="wb-token-toolbar"
      title={title}
      actions={(
        <>
        <IconButton label="Undo token edit" title="Undo" disabled={!canUndo} onClick={onUndo}>
          <Undo2 size={14} />
        </IconButton>
        <IconButton label="Redo token edit" title="Redo" disabled={!canRedo} onClick={onRedo}>
          <Redo2 size={14} />
        </IconButton>
        <SearchField aria-label="Search tokens" placeholder="Search" value={query} onValueChange={setQuery} />
        <SelectControl<TokenTypeFilter> aria-label="Filter token type" value={typeFilter} onValueChange={setTypeFilter}>
          <option value="all">All types</option>
          {TOKEN_TYPES.map((type) => <option key={type} value={type}>{formatTokenType(type)}</option>)}
        </SelectControl>
        <Button className="wb-icon-text-button" tone="ghost" onClick={onExportRegistry}>
          <Download size={13} />
          <span>Export JSON</span>
        </Button>
        <Button tone="ghost" disabled={!isDirty || saveState === 'saving'} onClick={() => void persistTokens('manual')}>
          {saveState === 'saving' ? 'Saving' : 'Save'}
        </Button>
        </>
      )}
    />
  );
}
