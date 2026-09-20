import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

type ButtonTone = 'neutral' | 'primary' | 'danger' | 'ghost';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  tone?: ButtonTone;
};

export function Button({ className = '', tone = 'neutral', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`wb-ui-button wb-ui-button--${tone} ${className}`.trim()} {...props} />;
}

type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  children: ReactNode;
  label: string;
  tone?: 'neutral' | 'danger';
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    children,
    className = '',
    label,
    title,
    tone = 'neutral',
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={`wb-ui-icon-button wb-ui-icon-button--${tone} ${className}`.trim()}
      title={title ?? label}
      {...props}
    >
      {children}
    </button>
  );
});

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  frameClassName?: string;
  leadingSlot?: ReactNode;
  onValueChange?: (value: string) => void;
  trailingSlot?: ReactNode;
};

export function TextField({
  className = '',
  frameClassName = '',
  leadingSlot,
  onChange,
  onValueChange,
  trailingSlot,
  type = 'text',
  ...props
}: TextFieldProps) {
  const input = (
    <input
      type={type}
      className={`wb-ui-text-field ${className}`.trim()}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
      }}
      {...props}
    />
  );

  if (!leadingSlot && !trailingSlot) return input;

  return (
    <span
      className={[
        'wb-ui-text-field-frame',
        leadingSlot ? 'wb-ui-text-field-frame--leading' : '',
        trailingSlot ? 'wb-ui-text-field-frame--trailing' : '',
        frameClassName,
      ].filter(Boolean).join(' ')}
    >
      {leadingSlot ? <span className="wb-ui-text-field-slot wb-ui-text-field-slot--leading">{leadingSlot}</span> : null}
      {input}
      {trailingSlot ? <span className="wb-ui-text-field-slot wb-ui-text-field-slot--trailing">{trailingSlot}</span> : null}
    </span>
  );
}

type SearchFieldProps = Omit<TextFieldProps, 'leadingSlot' | 'trailingSlot' | 'type'> & {
  clearLabel?: string;
};

export function SearchField({
  className = '',
  clearLabel = 'Clear search',
  frameClassName = '',
  onValueChange,
  value,
  ...props
}: SearchFieldProps) {
  const hasValue = typeof value === 'string' && value.length > 0;
  return (
    <TextField
      type="search"
      className={className}
      frameClassName={['wb-ui-search-field', frameClassName].filter(Boolean).join(' ')}
      leadingSlot={<Search size={14} aria-hidden="true" />}
      trailingSlot={hasValue && onValueChange ? (
        <button
          type="button"
          className="wb-ui-search-clear"
          aria-label={clearLabel}
          title={clearLabel}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onValueChange('')}
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
      value={value}
      onValueChange={onValueChange}
      {...props}
    />
  );
}

type TextAreaProps = ComponentPropsWithoutRef<'textarea'> & {
  onValueChange?: (value: string) => void;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className = '', onChange, onValueChange, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`wb-ui-text-area ${className}`.trim()}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
      }}
      {...props}
    />
  );
});

type SelectControlProps<TValue extends string> = Omit<ComponentPropsWithoutRef<'select'>, 'value'> & {
  children: ReactNode;
  onValueChange?: (value: TValue) => void;
  value: TValue;
};

export function SelectControl<TValue extends string>({
  children,
  className = '',
  onChange,
  onValueChange,
  value,
  ...props
}: SelectControlProps<TValue>) {
  return (
    <span className={`wb-ui-select-shell ${className}`.trim()}>
      <select
        className="wb-ui-select"
        value={value}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value as TValue);
        }}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="wb-ui-select-icon" size={14} aria-hidden="true" />
    </span>
  );
}
