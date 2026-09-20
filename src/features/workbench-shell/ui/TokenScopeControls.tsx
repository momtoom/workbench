import { useState } from 'react';
import { Link2, SlidersHorizontal } from 'lucide-react';
import { Button, IconButton } from '@shared/ui/primitives';
import type { InspectorField, TokenCollection, TokenGroup, TokenRegistry } from '@domain/design-system/tokens/types';
import { getAvailableGroupScopeFields, getScopeFieldsForTarget } from '@domain/design-system/tokens/fieldScopes';
import { INSPECTOR_TOKEN_FIELD_MAP } from '@domain/design-system/tokens/compatibility';
import { INSPECTOR_FIELDS, formatInspectorField, formatTokenType } from '@domain/design-system/tokens/metadata';
import { isCollectionI18n } from '@domain/design-system/tokens/operations';
import { ModalLayer } from './ModalLayer';
import type { TokenEditorActions } from './useTokenEditorActions';

export function TokenScopeBar({
  activeGroupId,
  collection,
  registry,
  tokenActions,
}: {
  activeGroupId: string;
  collection: TokenCollection;
  registry: TokenRegistry;
  tokenActions: TokenEditorActions;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeGroup = activeGroupId === 'all'
    ? null
    : collection.groups.find((group) => group.id === activeGroupId) ?? null;
  const target = { collectionId: collection.id, groupId: activeGroup?.id };
  const enabledFields = getScopeFieldsForTarget(registry, target);
  const label = activeGroup ? `${collection.name} / ${activeGroup.name}` : collection.name;
  const availableFields = activeGroup ? getAvailableGroupScopeFields(registry, collection.id) : [...INSPECTOR_FIELDS];

  return (
    <section className="wb-token-scope-bar" aria-label={`${label} inspector availability`}>
      <div className="wb-token-scope-main">
        <span className="wb-token-scope-label">Inspector fields</span>
        <div className="wb-token-scope-summary" aria-label="Available inspector fields">
          <Link2 size={13} aria-hidden="true" />
          <span>
            {enabledFields.length > 0
              ? enabledFields.map(formatInspectorField).join(' · ')
              : activeGroup && availableFields.length === 0 ? 'Set collection availability first' : 'No inspector fields'}
          </span>
        </div>
      </div>
      <div className="wb-token-scope-actions">
        <IconButton
          className="wb-token-scope-config"
          label={`Configure ${label} inspector availability`}
          title="Configure inspector availability"
          onClick={() => setSettingsOpen(true)}
        >
          <SlidersHorizontal size={14} />
        </IconButton>
      </div>
      {settingsOpen ? (
        <TokenScopeModal
          activeGroup={activeGroup}
          availableFields={availableFields}
          collection={collection}
          enabledFields={new Set(enabledFields)}
          onClose={() => setSettingsOpen(false)}
          tokenActions={tokenActions}
        />
      ) : null}
    </section>
  );
}

function TokenScopeModal({
  activeGroup,
  availableFields,
  collection,
  enabledFields,
  onClose,
  tokenActions,
}: {
  activeGroup: TokenGroup | null;
  availableFields: InspectorField[];
  collection: TokenCollection;
  enabledFields: Set<InspectorField>;
  onClose: () => void;
  tokenActions: TokenEditorActions;
}) {
  const label = activeGroup ? `${collection.name} / ${activeGroup.name}` : collection.name;

  return (
    <ModalLayer title={activeGroup ? 'Group inspector availability' : 'Collection inspector availability'} onClose={onClose}>
      <div className="wb-token-scope-modal-head">
        <strong>{label}</strong>
        <span>{activeGroup ? 'Group availability narrows the collection availability.' : 'Choose inspector fields where this collection can appear as a token option.'}</span>
      </div>
      <div className="wb-token-scope-grid" aria-label={`${label} inspector availability settings`}>
        {availableFields.length > 0 ? availableFields.map((field) => {
          const enabled = enabledFields.has(field);
          return (
            <FieldScopeOption
              key={field}
              enabled={enabled}
              field={field}
              onToggle={() => tokenActions.toggleTokenFieldScope(collection.id, activeGroup?.id, field, !enabled)}
            />
          );
        }) : (
          <p className="wb-modal-copy">Set inspector availability on the collection before narrowing this group.</p>
        )}
      </div>
      {activeGroup ? null : (
        <div className="wb-token-scope-grid" aria-label="Collection i18n availability">
          <I18nScopeOption
            enabled={isCollectionI18n(collection)}
            onToggle={() => tokenActions.toggleTokenCollectionI18n(collection.id, !isCollectionI18n(collection))}
          />
        </div>
      )}
      <div className="wb-modal-actions">
        <Button tone="primary" onClick={onClose}>Done</Button>
      </div>
    </ModalLayer>
  );
}

function FieldScopeOption({
  enabled,
  field,
  onToggle,
}: {
  enabled: boolean;
  field: InspectorField;
  onToggle: () => void;
}) {
  const acceptedTypes = INSPECTOR_TOKEN_FIELD_MAP[field].allowedTypes.map(formatTokenType).join(' · ');

  return (
    <Button
      tone="ghost"
      className={enabled ? 'wb-token-scope-option wb-token-scope-option--enabled' : 'wb-token-scope-option'}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span>{formatInspectorField(field)}</span>
      <small>{acceptedTypes}</small>
    </Button>
  );
}

function I18nScopeOption({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      tone="ghost"
      className={enabled ? 'wb-token-scope-option wb-token-scope-option--enabled' : 'wb-token-scope-option'}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span>i18n</span>
      <small>String tokens in this collection are exported as the localization dictionary.</small>
    </Button>
  );
}
