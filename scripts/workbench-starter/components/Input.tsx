import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentProps } from 'react';
import './local.css';

export type InputProps = ComponentProps<typeof BaseInput> & {
  description?: string;
  error?: string;
  label?: string;
};

export function Input({
  className = '',
  description,
  error,
  id,
  label,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined);
  const descriptionId = inputId && description ? `${inputId}-description` : undefined;
  const errorId = inputId && error ? `${inputId}-error` : undefined;
  return (
    <label className="wb-field">
      {label ? <span className="wb-field__label">{label}</span> : null}
      <BaseInput
        {...props}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : props['aria-invalid']}
        className={['wb-input', className].filter(Boolean).join(' ')}
        id={inputId}
      />
      {description ? <span className="wb-field__description" id={descriptionId}>{description}</span> : null}
      {error ? <span className="wb-field__error" id={errorId}>{error}</span> : null}
    </label>
  );
}
