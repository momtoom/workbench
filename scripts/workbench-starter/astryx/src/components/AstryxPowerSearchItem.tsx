import {
  createPowerSearchConfig,
  type PowerSearchEditorProps,
} from '@astryxdesign/core/PowerSearch';
import { TypeaheadItem } from '@astryxdesign/core/Typeahead';
import { useMemo } from 'react';
import {
  type AstryxPowerSearchFieldDefinition,
  type AstryxPowerSearchFieldProps,
} from './AstryxPowerSearchField';
import { AstryxIcon } from './AstryxIcon';
import { collectAstryxPowerSearchOptions } from './AstryxPowerSearchOption';
import {
  AstryxPowerSearchEditorRuntime,
  createInitialPowerSearchFilter,
} from './AstryxPowerSearchEditor';
import { useAstryxPowerSearchSurface } from './AstryxPowerSearch';
import { cx } from './classNames';

export type AstryxPowerSearchItemProps = AstryxPowerSearchFieldProps;

export function AstryxPowerSearchItem({
  children,
  fieldKey: fieldKeyProp,
  label = 'Search field',
  type,
  icon,
  group,
  description,
  className,
  ...rootProps
}: AstryxPowerSearchItemProps) {
  const { onClick: onRootClick, ...itemRootProps } = rootProps;
  const surface = useAstryxPowerSearchSurface();
  const fieldKey = fieldKeyProp?.trim() || 'field';
  const optionValues = collectAstryxPowerSearchOptions(children);
  const optionSignature = optionValues
    .map((option) => `${option.value}\u0000${option.label}`)
    .join('\u0001');
  const definition = useMemo<AstryxPowerSearchFieldDefinition>(
    () => ({
      definition: {
        key: fieldKey,
        type: type || 'string',
        label,
        ...((type === 'enum' || type === 'enum_list') ? { enumValues: optionValues } : {}),
      },
      description: description?.trim() || undefined,
      group: group?.trim() || undefined,
      icon: icon && icon !== 'none' ? <AstryxIcon icon={icon} /> : undefined,
    } as AstryxPowerSearchFieldDefinition),
    [description, fieldKey, group, icon, label, optionSignature, type],
  );
  const localConfig = useMemo(
    () => createPowerSearchConfig([definition.definition], 'WorkbenchSearchItem').config,
    [definition],
  );
  const registeredField = surface?.config.fields.find((candidate) => candidate.key === fieldKey);
  const resolvedConfig = useMemo(
    () => {
      if (!surface) return localConfig;
      if (registeredField) return surface.config;
      return {
        ...surface.config,
        fields: [...surface.config.fields, ...localConfig.fields],
      };
    },
    [localConfig, registeredField, surface],
  );
  const field = resolvedConfig.fields.find((candidate) => candidate.key === fieldKey);
  const query = surface?.query.trim().toLowerCase() || '';
  const isMatch =
    !query ||
    label.toLowerCase().includes(query) ||
    description?.toLowerCase().includes(query);
  const isActive = surface?.activeFieldKey === fieldKey;

  if (!isMatch) return null;

  const editorProps: PowerSearchEditorProps | null =
    surface && field
      ? {
          config: resolvedConfig,
          filter: createInitialPowerSearchFilter(field),
          mode: 'create',
          onCancel: surface.closeMenu,
          onSave: surface.saveFilter,
          isReadOnly: surface.isReadOnly,
        }
      : null;

  return (
    <div
      {...itemRootProps}
      className={cx('astryx-wb-power-search-item', className)}
      data-astryx-wb-power-search-item-active={isActive ? 'true' : undefined}
      data-astryx-wb-power-search-item={fieldKey}
    >
      <button
        aria-selected={isActive}
        className="astryx-wb-power-search-item__trigger"
        disabled={!surface || surface.isDisabled}
        onClick={(event) => {
          onRootClick?.(event as never);
          if (!event.defaultPrevented) surface?.selectField(fieldKey);
        }}
        role="option"
        type="button"
      >
        <TypeaheadItem
          description={description}
          icon={icon && icon !== 'none' ? <AstryxIcon color="secondary" icon={icon} size="sm" /> : undefined}
          item={{ id: fieldKey, label }}
        />
      </button>
      {isActive && children && editorProps && (
        <AstryxPowerSearchEditorRuntime {...editorProps}>
          {children}
        </AstryxPowerSearchEditorRuntime>
      )}
    </div>
  );
}

AstryxPowerSearchItem.displayName = 'AstryxPowerSearchItem';
