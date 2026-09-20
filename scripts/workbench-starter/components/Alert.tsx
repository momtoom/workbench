import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import './local.css';

export type AlertVariant = 'default' | 'destructive';

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  icon?: string;
  variant?: AlertVariant;
};

export type AlertTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children?: ReactNode;
};

export type AlertDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
};

export function Alert({
  children,
  className = '',
  icon,
  variant = 'default',
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      className={['wb-alert', `wb-alert--${variant}`, icon ? 'wb-alert--with-icon' : '', className].filter(Boolean).join(' ')}
      role="alert"
    >
      {icon ? <Icon className="wb-alert__icon" name={icon} size={18} /> : null}
      <div className="wb-alert__content">{children}</div>
    </div>
  );
}

export function AlertTitle({ children, className = '', ...props }: AlertTitleProps) {
  return (
    <h3 {...props} className={['wb-alert__title', className].filter(Boolean).join(' ')}>
      {children}
    </h3>
  );
}

export function AlertDescription({ children, className = '', ...props }: AlertDescriptionProps) {
  return (
    <p {...props} className={['wb-alert__description', className].filter(Boolean).join(' ')}>
      {children}
    </p>
  );
}
