import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import './local.css';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  leadingIcon?: string;
  loading?: boolean;
  size?: ButtonSize;
  trailingIcon?: string;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = '',
  disabled,
  leadingIcon,
  loading = false,
  size = 'md',
  trailingIcon,
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) {
  const iconOnly = size === 'icon';
  const iconOnlyName = leadingIcon || trailingIcon;
  const accessibleLabel = typeof children === 'string' && children.trim() ? children : 'Button';

  return (
    <button
      {...props}
      aria-label={iconOnly ? props['aria-label'] ?? accessibleLabel : props['aria-label']}
      className={['wb-button', `wb-button--${variant}`, `wb-button--${size}`, className].filter(Boolean).join(' ')}
      data-loading={loading ? 'true' : undefined}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? <span className="wb-button__spinner" aria-hidden="true" /> : null}
      {!loading && iconOnly && iconOnlyName ? <Icon className="wb-button__icon" name={iconOnlyName} size={16} /> : null}
      {!loading && !iconOnly && leadingIcon ? <Icon className="wb-button__icon" name={leadingIcon} size={16} /> : null}
      {!iconOnly ? <span className="wb-button__label">{children}</span> : null}
      {!iconOnly && trailingIcon ? <Icon className="wb-button__icon" name={trailingIcon} size={16} /> : null}
    </button>
  );
}
