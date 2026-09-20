import type { HTMLAttributes, ReactNode } from 'react';
import './local.css';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
  variant?: BadgeVariant;
};

export function Badge({
  children,
  className = '',
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={['wb-badge', `wb-badge--${variant}`, className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}
