import { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { SelectControl, TextArea } from '@shared/ui/primitives';
import type { DesignToken, TokenCollection, TokenType } from '@domain/design-system/tokens/types';
import { TOKEN_TYPES, formatTokenType } from '@domain/design-system/tokens/metadata';
import {
  getTokenReferenceUsages,
  getTokenSourceUsages,
  getTokenScopeFieldScopeUsages,
  type TokenUsageIndex,
} from '@domain/design-system/tokens/usageIndex';
import { RowOverlayActions } from './RowOverlayActions';
import type { TokenEditorActions } from './useTokenEditorActions';
import type { Notice } from './useTokenEditorHistory';

type TokenRowActionsProps = {
  collection: TokenCollection;
  openSettings: boolean;
  setOpenSettings: (open: boolean) => void;
  setNotice: (notice: Notice) => void;
  tokenActions: TokenEditorActions;
  token: DesignToken;
  usageIndex: TokenUsageIndex;
};

export function TokenRowActions({
  collection,
  openSettings,
  setOpenSettings,
  setNotice,
  tokenActions,
  token,
  usageIndex,
}: TokenRowActionsProps) {
  const impactMessage = getTokenActionImpactMessage(usageIndex, collection, token);
  const sourceUsages = getTokenSourceUsages(usageIndex, { collectionId: collection.id, tokenId: token.id });
  const [descriptionDraft, setDescriptionDraft] = useState(token.description ?? '');

  useEffect(() => {
    setDescriptionDraft(token.description ?? '');
  }, [token.description, token.id]);

  function commitDescription() {
    const currentDescription = token.description ?? '';
    if (descriptionDraft.trim() === currentDescription.trim()) return;
    tokenActions.updateDesignTokenDescription(collection.id, token.id, descriptionDraft);
  }

  return (
    <RowOverlayActions className="wb-row-actions" stopClickPropagation={false}>
      <details
        className="wb-row-more"
        open={openSettings}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <summary
          aria-label={`Token settings for ${token.name}`}
          aria-expanded={openSettings}
          title="Token settings"
          onClick={(event) => {
            event.preventDefault();
            setOpenSettings(!openSettings);
          }}
        >
          <MoreHorizontal size={14} />
        </summary>
        <div className="wb-popover-panel wb-popover-panel--form wb-row-more-menu">
          <strong>Token settings</strong>
          <label>
            <span>Type</span>
            <SelectControl<TokenType>
              aria-label={`Type ${token.name}`}
              value={token.type}
              onValueChange={(type) => {
                tokenActions.changeDesignTokenType(collection.id, token.id, type);
                if (type !== token.type && impactMessage) {
                  setNotice({ tone: 'info', message: `Changed ${token.name} type. ${impactMessage}` });
                }
              }}
            >
              {TOKEN_TYPES.map((type) => <option key={type} value={type}>{formatTokenType(type)}</option>)}
            </SelectControl>
          </label>
          <label>
            <span>Move to group</span>
            <SelectControl<string>
              aria-label={`Move ${token.name} to group`}
              value={token.groupId ?? ''}
              onValueChange={(groupId) => tokenActions.moveDesignTokenToGroup(collection.id, token.id, groupId || undefined)}
            >
              <option value="">Ungrouped</option>
              {collection.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </SelectControl>
          </label>
          <label>
            <span>Description</span>
            <TextArea
              aria-label={`Description ${token.name}`}
              className="wb-token-description-field"
              placeholder="Add description"
              rows={3}
              value={descriptionDraft}
              onBlur={commitDescription}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.currentTarget.blur();
                }
                if (event.key === 'Escape') {
                  setDescriptionDraft(token.description ?? '');
                  event.currentTarget.blur();
                }
              }}
              onValueChange={setDescriptionDraft}
            />
          </label>
          {sourceUsages.length > 0 ? (
            <div className="wb-token-source-usage-summary">
              <span>Source usage</span>
              <ul>
                {sourceUsages.slice(0, 4).map((usage) => (
                  <li key={`${usage.sourceId}:${usage.variableName}`}>
                    <span>{usage.sourceLabel}</span>
                    <code>{usage.variableName}</code>
                    <span>{usage.count}</span>
                  </li>
                ))}
              </ul>
              {sourceUsages.length > 4 ? (
                <small>+{sourceUsages.length - 4} more source{sourceUsages.length - 4 === 1 ? '' : 's'}</small>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>
    </RowOverlayActions>
  );
}

function getTokenActionImpactMessage(
  usageIndex: TokenUsageIndex,
  collection: TokenCollection,
  token: DesignToken,
): string | null {
  const referenceCount = getTokenReferenceUsages(usageIndex, { collectionId: collection.id, tokenId: token.id }).length;
  const sourceUsageCount = getTokenSourceUsages(usageIndex, { collectionId: collection.id, tokenId: token.id })
    .reduce((total, usage) => total + usage.count, 0);
  const fieldScopeCount = getTokenScopeFieldScopeUsages(usageIndex, { collectionId: collection.id, groupId: token.groupId }).length;
  const impacts: string[] = [];

  if (referenceCount > 0) impacts.push(`${referenceCount} token reference${referenceCount === 1 ? '' : 's'}`);
  if (sourceUsageCount > 0) impacts.push(`${sourceUsageCount} source usage${sourceUsageCount === 1 ? '' : 's'}`);
  if (fieldScopeCount > 0) impacts.push(`${fieldScopeCount} field scope${fieldScopeCount === 1 ? '' : 's'}`);

  return impacts.length > 0 ? `Affected ${impacts.join(' and ')}.` : null;
}
