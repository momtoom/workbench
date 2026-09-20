import type { TextareaHTMLAttributes } from 'react';
import './local.css';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  description?: string;
  error?: string;
  label?: string;
};

export function Textarea({
  className = '',
  description,
  error,
  id,
  label,
  ...props
}: TextareaProps) {
  const inputId = id ?? (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);

  return (
    <label className="wb-field">
      {label ? <span className="wb-field__label">{label}</span> : null}
      <textarea
        {...props}
        id={inputId}
        className={['wb-textarea', className].filter(Boolean).join(' ')}
        aria-invalid={error ? 'true' : undefined}
      />
      {description ? <span className="wb-field__description">{description}</span> : null}
      {error ? <span className="wb-field__error">{error}</span> : null}
    </label>
  );
}
