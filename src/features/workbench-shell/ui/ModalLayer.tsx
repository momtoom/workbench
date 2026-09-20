import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';

export function ModalLayer({
  children,
  className = '',
  onClose,
  title,
}: {
  children: ReactNode;
  className?: string;
  onClose: () => void;
  title: string;
}) {
  return createPortal(
    <div className="wb-modal-backdrop" role="presentation">
      <section className={`wb-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="wb-modal-head">
          <strong>{title}</strong>
          <IconButton label="Close dialog" title="Close" onClick={onClose}>
            <X size={13} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}

export function ModalFieldList({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="wb-modal-field-list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function ModalField({
  children,
  label,
  meta,
}: {
  children: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <label className="wb-modal-field">
      <span className="wb-modal-field-copy">
        <span className="wb-modal-field-label">{label}</span>
        {meta ? <span className="wb-modal-field-meta">{meta}</span> : null}
      </span>
      <span className="wb-modal-field-control">{children}</span>
    </label>
  );
}
