import {
  resolveOperatorLabel,
  type FilterValue,
  type PartialFilter,
  type PowerSearchConfig,
  type PowerSearchEditorProps,
  type PowerSearchFilter,
  type PowerSearchOperator,
} from '@astryxdesign/core/PowerSearch';
import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { useTranslator, type TranslatorFn } from '@astryxdesign/core/i18n';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { collectAstryxPowerSearchFieldOptions } from './AstryxPowerSearchFieldOption';
import { collectAstryxPowerSearchOperatorOptions } from './AstryxPowerSearchOperatorOption';
import { collectAstryxPowerSearchOptionEntries } from './AstryxPowerSearchOption';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

interface EditorContextValue {
  config: PowerSearchConfig;
  draft: PartialFilter;
  setDraft: (nextDraft: PartialFilter) => void;
  onCancel: () => void;
  onSave: (filter: PowerSearchFilter | null) => void;
  saveButtonLabel?: string;
  isReadOnly?: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

type DivProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchEditorProps extends DivProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxPowerSearchEditor({
  children,
  className,
  ...rootProps
}: AstryxPowerSearchEditorProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-editor', className)}
      data-astryx-wb-power-search-editor="true"
    >
      {children}
    </div>
  );
}

AstryxPowerSearchEditor.displayName = 'AstryxPowerSearchEditor';

export interface AstryxPowerSearchEditorRuntimeProps extends PowerSearchEditorProps {
  children: ReactNode;
}

export function AstryxPowerSearchEditorRuntime({
  children,
  config,
  filter,
  onCancel,
  onSave,
  saveButtonLabel,
  isReadOnly,
}: AstryxPowerSearchEditorRuntimeProps) {
  const [draft, setDraft] = useState<PartialFilter>(filter);

  useEffect(() => {
    setDraft(filter);
  }, [filter]);

  const value = useMemo<EditorContextValue>(
    () => ({
      config,
      draft,
      setDraft,
      onCancel,
      onSave,
      saveButtonLabel,
      isReadOnly,
    }),
    [config, draft, isReadOnly, onCancel, onSave, saveButtonLabel],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

type ControlProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchFieldControlProps extends ControlProps {
  children?: ReactNode;
  label?: string;
  className?: string;
}

export function AstryxPowerSearchFieldControl({
  children,
  label = 'Field',
  className,
  ...rootProps
}: AstryxPowerSearchFieldControlProps) {
  const editor = useOptionalEditorContext();
  const stableChildren = useStableAstryxChildren(children);
  const authoredOptions = useMemo(
    () => collectAstryxPowerSearchFieldOptions(stableChildren),
    [stableChildren],
  );
  const fields = editor?.config.fields ?? [];
  const value = editor?.draft.field ?? fields[0]?.key ?? '';
  const options = authoredOptions.length
    ? authoredOptions.map(({ value: optionValue, label: optionLabel }) => ({
        value: optionValue,
        label: optionLabel,
      }))
    : fields.map((field) => ({ value: field.key, label: field.label }));
  const authoredOptionElements = new Map(
    authoredOptions.map((option) => [option.value, option.sourceElement]),
  );

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-control', className)}
      data-astryx-wb-power-search-control="field"
    >
      <Selector
        isDisabled={!editor || editor.isReadOnly}
        isLabelHidden
        label={label}
        onChange={(nextValue) => {
          if (!editor) return;
          const nextField = editor.config.fields.find((field) => field.key === nextValue);
          const nextOperator = getInitialOperator(nextField);
          editor.setDraft({
            field: nextValue,
            operator: nextOperator?.key,
            value: nextOperator ? getInitialFilterValue(nextOperator) : undefined,
          });
        }}
        options={options}
        placeholder="Select a field"
        renderOption={(option) => authoredOptionElements.get(option.value) || option.label}
        size="md"
        value={value}
        width="100%"
      />
    </div>
  );
}

AstryxPowerSearchFieldControl.displayName = 'AstryxPowerSearchFieldControl';

export interface AstryxPowerSearchOperatorControlProps extends ControlProps {
  children?: ReactNode;
  label?: string;
  className?: string;
}

export function AstryxPowerSearchOperatorControl({
  children,
  label = 'Operator',
  className,
  ...rootProps
}: AstryxPowerSearchOperatorControlProps) {
  const editor = useOptionalEditorContext();
  const stableChildren = useStableAstryxChildren(children);
  const authoredOptions = useMemo(
    () => collectAstryxPowerSearchOperatorOptions(stableChildren),
    [stableChildren],
  );
  const translate = useTranslator();
  const field = editor?.config.fields.find((candidate) => candidate.key === editor.draft.field);
  const operators = field?.operators ?? [];
  const value = editor?.draft.operator ?? operators[0]?.key ?? '';
  const matchingAuthoredOptions = authoredOptions.filter((option) =>
    operators.some((operator) => operator.key === option.value),
  );
  const options = matchingAuthoredOptions.length
    ? matchingAuthoredOptions.map(({ value: optionValue, label: optionLabel }) => ({
        value: optionValue,
        label: optionLabel,
      }))
    : operators.map((operator) => ({
        value: operator.key,
        label: getOperatorLabel(operator, translate),
      }));
  const authoredOptionElements = new Map(
    matchingAuthoredOptions.map((option) => [option.value, option.sourceElement]),
  );

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-control', className)}
      data-astryx-wb-power-search-control="operator"
    >
      <Selector
        isDisabled={!editor || editor.isReadOnly}
        isLabelHidden
        label={label}
        onChange={(nextValue) => {
          if (!editor) return;
          const operator = operators.find((candidate) => candidate.key === nextValue);
          editor.setDraft({
            ...editor.draft,
            operator: nextValue,
            value: operator ? getInitialFilterValue(operator) : undefined,
          });
        }}
        options={options}
        placeholder="Select an operator"
        renderOption={(option) => authoredOptionElements.get(option.value) || option.label}
        size="md"
        value={value}
        width="100%"
      />
    </div>
  );
}

AstryxPowerSearchOperatorControl.displayName = 'AstryxPowerSearchOperatorControl';

export interface AstryxPowerSearchValueControlProps extends ControlProps {
  children?: ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function AstryxPowerSearchValueControl({
  children,
  label = 'Value',
  placeholder = 'Enter a value',
  className,
  ...rootProps
}: AstryxPowerSearchValueControlProps) {
  const editor = useOptionalEditorContext();
  const stableChildren = useStableAstryxChildren(children);
  const field = editor?.config.fields.find((candidate) => candidate.key === editor.draft.field);
  const operator = field?.operators.find((candidate) => candidate.key === editor?.draft.operator);

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-control', className)}
      data-astryx-wb-power-search-control="value"
    >
      {renderValueControl(editor, operator, label, placeholder, stableChildren)}
    </div>
  );
}

AstryxPowerSearchValueControl.displayName = 'AstryxPowerSearchValueControl';

export interface AstryxPowerSearchActionsProps extends DivProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxPowerSearchActions({
  children,
  className,
  ...rootProps
}: AstryxPowerSearchActionsProps) {
  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-power-search-actions', className)}
      data-astryx-wb-power-search-actions="true"
    >
      {children}
    </div>
  );
}

AstryxPowerSearchActions.displayName = 'AstryxPowerSearchActions';

type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className' | 'type'>;

export interface AstryxPowerSearchActionProps extends ButtonProps {
  action?: 'cancel' | 'apply';
  label?: string;
  className?: string;
}

export function AstryxPowerSearchAction({
  action = 'apply',
  label,
  className,
  ...rootProps
}: AstryxPowerSearchActionProps) {
  const { onClick: onRootClick, ...buttonRootProps } = rootProps;
  const editor = useOptionalEditorContext();
  const resolvedLabel =
    label || (action === 'cancel' ? 'Cancel' : editor?.saveButtonLabel || 'Apply');
  const filter = editor ? toCompleteFilter(editor.draft) : null;

  return (
    <Button
      {...buttonRootProps}
      className={cx(
        'astryx-wb-power-search-action',
        `astryx-wb-power-search-action--${action}`,
        className,
      )}
      data-astryx-wb-power-search-action={action}
      isDisabled={!editor || editor.isReadOnly || (action === 'apply' && !filter)}
      label={resolvedLabel}
      onClick={(event) => {
        onRootClick?.(event as never);
        if (event.defaultPrevented) return;
        if (!editor) return;
        if (action === 'cancel') editor.onCancel();
        else if (filter) editor.onSave(filter);
      }}
      size="sm"
      variant={action === 'cancel' ? 'ghost' : 'primary'}
    />
  );
}

AstryxPowerSearchAction.displayName = 'AstryxPowerSearchAction';

function useOptionalEditorContext() {
  return useContext(EditorContext);
}

function getInitialOperator(field: PowerSearchConfig['fields'][number] | undefined) {
  if (!field) return undefined;
  return field.operators.find((operator) => operator.key === field.defaultOperator) || field.operators[0];
}

function getOperatorLabel(operator: PowerSearchOperator, translate: TranslatorFn) {
  if ('label' in operator) return operator.label;
  return resolveOperatorLabel(operator, translate);
}

function getInitialFilterValue(operator: PowerSearchOperator): FilterValue {
  switch (operator.value.type) {
    case 'empty':
      return { type: 'empty' };
    case 'integer':
      return { type: 'integer', value: operator.value.minValue ?? 0 };
    case 'float':
      return { type: 'float', value: operator.value.minValue ?? 0 };
    case 'time':
      return { type: 'time', value: '' };
    case 'date_absolute':
      return { type: 'date_absolute', unixSeconds: Math.floor(Date.now() / 1000) };
    case 'date_relative':
      return { type: 'date_relative', value: '' };
    case 'date_range':
      return { type: 'date_range', value: { start: { type: 'NOW' }, end: { type: 'NOW' } } };
    case 'enum':
      return { type: 'enum', value: operator.value.values[0]?.value ?? '' };
    case 'enum_list':
      return { type: 'enum_list', value: [] };
    case 'entity_list':
      return { type: 'entity_list', value: [] };
    case 'custom':
      return { type: 'custom', value: '' };
    case 'nested':
      return { type: 'nested', value: [] };
    case 'string_list':
      return { type: 'string_list', value: [] };
    case 'string':
    default:
      return { type: 'string', value: '' };
  }
}

export function createInitialPowerSearchFilter(
  field: PowerSearchConfig['fields'][number],
): PartialFilter {
  const operator = getInitialOperator(field);
  return {
    field: field.key,
    operator: operator?.key,
    value: operator ? getInitialFilterValue(operator) : undefined,
  };
}

function setDraftValue(editor: EditorContextValue, value: FilterValue) {
  editor.setDraft({ ...editor.draft, value });
}

function renderValueControl(
  editor: EditorContextValue | null,
  operator: PowerSearchOperator | undefined,
  label: string,
  placeholder: string,
  authoredOptions: ReactNode,
) {
  if (!editor || !operator) {
    return (
      <TextInput
        isDisabled
        isLabelHidden
        label={label}
        placeholder={placeholder}
        value=""
        width="100%"
      />
    );
  }
  const disabled = editor.isReadOnly;
  const value = editor.draft.value ?? getInitialFilterValue(operator);

  if (operator.value.type === 'empty') {
    return <span className="astryx-wb-power-search-empty-value">No value required</span>;
  }
  if (operator.value.type === 'enum' || operator.value.type === 'enum_list') {
    const authoredEntries = collectAstryxPowerSearchOptionEntries(authoredOptions);
    const options = authoredEntries.length
      ? authoredEntries.map(({ value: optionValue, label: optionLabel }) => ({
          value: optionValue,
          label: optionLabel,
        }))
      : Array.from(operator.value.values);
    const authoredOptionElements = new Map(
      authoredEntries.map((option) => [option.value, option.sourceElement]),
    );
    const renderOption = (option: { value: string; label?: string }) =>
      authoredOptionElements.get(option.value) || option.label || option.value;

    if (operator.value.type === 'enum_list') {
      return (
        <MultiSelector
          hasClear
          isDisabled={disabled}
          isLabelHidden
          label={label}
          onChange={(nextValue) =>
            setDraftValue(editor, { type: 'enum_list', value: nextValue })
          }
          options={options}
          placeholder={placeholder}
          renderOption={renderOption}
          size="md"
          triggerDisplay="labels"
          value={value.type === 'enum_list' ? Array.from(value.value) : []}
          width="100%"
        />
      );
    }

    return (
      <Selector
        isDisabled={disabled}
        isLabelHidden
        label={label}
        onChange={(nextValue) =>
          setDraftValue(editor, { type: 'enum', value: nextValue })
        }
        options={options}
        placeholder={placeholder}
        renderOption={renderOption}
        size="md"
        value={value.type === 'enum' ? value.value : ''}
        width="100%"
      />
    );
  }
  if (operator.value.type === 'integer' || operator.value.type === 'float') {
    const numericType = operator.value.type;
    const numericValue =
      value.type === 'integer' || value.type === 'float' ? value.value : 0;
    return (
      <input
        aria-label={label}
        disabled={disabled}
        max={operator.value.maxValue}
        min={operator.value.minValue}
        onChange={(event) =>
          setDraftValue(editor, {
            type: numericType,
            value: Number(event.currentTarget.value),
          })
        }
        placeholder={placeholder}
        step={numericType === 'integer' ? 1 : 'any'}
        type="number"
        value={numericValue}
      />
    );
  }
  if (operator.value.type === 'date_absolute') {
    const dateValue =
      value.type === 'date_absolute'
        ? new Date(value.unixSeconds * 1000).toISOString().slice(0, 10)
        : '';
    return (
      <DateInput
        hasClear
        isDisabled={disabled}
        isLabelHidden
        label={label}
        onChange={(nextValue) => {
          if (!nextValue) return;
          setDraftValue(editor, {
            type: 'date_absolute',
            unixSeconds: Math.floor(new Date(`${nextValue}T00:00:00`).getTime() / 1000),
          });
        }}
        placeholder={placeholder}
        value={dateValue as never}
        width="100%"
      />
    );
  }
  if (operator.value.type === 'time') {
    return (
      <input
        aria-label={label}
        disabled={disabled}
        onChange={(event) =>
          setDraftValue(editor, { type: 'time', value: event.currentTarget.value })
        }
        type="time"
        value={value.type === 'time' ? value.value : ''}
      />
    );
  }

  const textValue =
    value.type === 'string' || value.type === 'date_relative' || value.type === 'custom'
      ? value.value
      : value.type === 'string_list'
        ? value.value.join(', ')
        : '';
  return (
    <TextInput
      isDisabled={disabled}
      isLabelHidden
      label={label}
      onChange={(nextValue) => {
        if (operator.value.type === 'string_list') {
          setDraftValue(editor, {
            type: 'string_list',
            value: nextValue.split(',').map((item) => item.trim()).filter(Boolean),
          });
        } else if (operator.value.type === 'date_relative') {
          setDraftValue(editor, { type: 'date_relative', value: nextValue });
        } else if (operator.value.type === 'custom') {
          setDraftValue(editor, { type: 'custom', value: nextValue });
        } else {
          setDraftValue(editor, { type: 'string', value: nextValue });
        }
      }}
      placeholder={placeholder}
      value={textValue}
      width="100%"
    />
  );
}

function toCompleteFilter(filter: PartialFilter): PowerSearchFilter | null {
  if (!filter.operator || !filter.value) return null;
  return {
    field: filter.field,
    operator: filter.operator,
    value: filter.value,
    isReadOnly: filter.isReadOnly,
  };
}
