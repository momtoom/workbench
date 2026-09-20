import { useEffect, useRef, useState, type CSSProperties, type FocusEvent as ReactFocusEvent, type InputHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';

export function InlineEditFrame({
  children,
  className,
  frameRef,
  onBlurOutside,
  style,
}: {
  children: ReactNode;
  className?: string;
  frameRef?: Ref<HTMLDivElement>;
  onBlurOutside?: () => void;
  style?: CSSProperties;
}) {
  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    const frame = event.currentTarget;
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof Node && frame.contains(activeElement)) return;
      if (activeElement instanceof Element && isInlineEditPortalElement(activeElement)) return;
      onBlurOutside?.();
    }, 0);
  }

  return (
    <div
      ref={frameRef}
      className={['wb-inline-edit-frame', className].filter(Boolean).join(' ')}
      style={style}
      onBlur={handleBlur}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

function isInlineEditPortalElement(element: Element): boolean {
  return Boolean(element.closest('.wb-token-picker-popover, .wb-gradient-modal'));
}

export function InlineEditActions({
  children,
  onCancel,
  onCommit,
}: {
  children?: ReactNode;
  onCancel: () => void;
  onCommit: () => void;
}) {
  return (
    <div className="wb-inline-edit-actions">
      {children}
      <IconButton label="Cancel editing" title="Cancel" className="wb-inline-edit-cancel" onClick={onCancel}>
        <Undo2 size={13} />
      </IconButton>
      <IconButton label="Done editing" title="Done editing" onClick={onCommit}>
        <Check size={13} />
      </IconButton>
    </div>
  );
}

export function InlineEditableText({
  className,
  editLabel,
  editing: controlledEditing,
  emptyLabel,
  onCommit,
  onEditingChange,
  onEditEnd,
  onEditStart,
  startOnDoubleClick = false,
  startOnClick = true,
  title,
  value,
}: {
  className?: string;
  editLabel: string;
  editing?: boolean;
  emptyLabel: string;
  onCommit: (value: string) => void;
  onEditingChange?: (editing: boolean) => void;
  onEditEnd?: () => void;
  onEditStart?: () => void;
  startOnDoubleClick?: boolean;
  startOnClick?: boolean;
  title?: string;
  value: string;
}) {
  const [uncontrolledEditing, setUncontrolledEditing] = useState(false);
  const editing = controlledEditing ?? uncontrolledEditing;
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootClassName = [className, editing ? 'wb-inline-edit wb-inline-edit--editing' : 'wb-inline-edit'].filter(Boolean).join(' ');

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function setEditing(nextEditing: boolean) {
    if (controlledEditing === undefined) setUncontrolledEditing(nextEditing);
    onEditingChange?.(nextEditing);
  }

  function startEditing() {
    setDraft(value);
    setEditing(true);
    onEditStart?.();
  }

  function closeEditing(commitDraft: boolean) {
    const nextValue = draft.trim();
    if (commitDraft && nextValue !== value) {
      onCommit(nextValue);
    }
    setEditing(false);
    onEditEnd?.();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      closeEditing(true);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value);
      closeEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={`${className ?? ''} wb-inline-edit-trigger`}
        title={title}
        onClick={startOnClick ? startEditing : undefined}
        onDoubleClick={startOnDoubleClick ? startEditing : undefined}
      >
        {value || emptyLabel}
      </button>
    );
  }

  return (
    <InlineEditFrame
      className={rootClassName}
      onBlurOutside={() => {
        setDraft(value);
        closeEditing(false);
      }}
    >
      <input
        className="wb-inline-edit-input"
        ref={inputRef}
        aria-label={editLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <InlineEditActions onCancel={() => closeEditing(false)} onCommit={() => closeEditing(true)} />
    </InlineEditFrame>
  );
}

export function InlineEditInput({
  ariaLabel,
  autoFocus = false,
  inputMode,
  max,
  min,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  step,
  type = 'text',
  value,
}: {
  ariaLabel?: string;
  autoFocus?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  max?: number;
  min?: number;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  step?: number | string;
  type?: 'number' | 'text';
  value: number | string;
}) {
  return (
    <input
      className="wb-inline-edit-input"
      type={type}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      inputMode={inputMode}
      max={max}
      min={min}
      step={step}
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    />
  );
}
