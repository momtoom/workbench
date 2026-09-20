import type { LabelHTMLAttributes, ReactNode } from 'react';
import './local.css';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children?: ReactNode;
  disabled?: boolean;
};

export function Label({
  children,
  className = '',
  disabled = false,
  ...props
}: LabelProps) {
  return (
    <label
      {...props}
      className={['wb-label', disabled ? 'wb-label--disabled' : '', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? 'true' : undefined}
    >
      {children}
    </label>
  );
}
