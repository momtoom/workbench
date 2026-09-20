import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type WorkbenchInspectorFieldVariant = 'read' | 'control' | 'notice';
export type WorkbenchInspectorDensity = 'default' | 'compact';

export function WorkbenchInspectorFieldList({
  ariaLabel,
  children,
  density = 'default',
}: {
  ariaLabel: string;
  children: ReactNode;
  density?: WorkbenchInspectorDensity;
}) {
  return (
    <div className={`wb-inspector-field-list wb-inspector-field-list--${density}`} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function WorkbenchInspectorSectionList({
  ariaLabel,
  children,
  density = 'default',
}: {
  ariaLabel: string;
  children: ReactNode;
  density?: WorkbenchInspectorDensity;
}) {
  return (
    <div className={`wb-inspector-section-list wb-inspector-section-list--${density}`} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function WorkbenchInspectorSection({
  actions,
  children,
  collapsible = true,
  density = 'default',
  defaultOpen = true,
  meta,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  density?: WorkbenchInspectorDensity;
  defaultOpen?: boolean;
  meta?: ReactNode;
  title: ReactNode;
}) {
  const bodyId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const ariaLabel = typeof title === 'string' ? title : 'Inspector section';

  return (
    <section className={`wb-inspector-section wb-inspector-section--${density}`} aria-label={ariaLabel}>
      <div className="wb-inspector-section-head">
        {collapsible ? (
          <button
            type="button"
            className="wb-inspector-section-toggle"
            aria-controls={bodyId}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronRight className="wb-inspector-section-toggle-icon" size={13} aria-hidden="true" />
            <span className="wb-kicker">{title}</span>
          </button>
        ) : (
          <span className="wb-inspector-section-title">
            <span className="wb-kicker">{title}</span>
          </span>
        )}
        {actions ? <span className="wb-inspector-section-actions">{actions}</span> : null}
        {meta ? <span className="wb-inspector-section-meta">{meta}</span> : null}
      </div>
      {open ? <div id={bodyId} className="wb-inspector-section-body">{children}</div> : null}
    </section>
  );
}

export function WorkbenchInspectorField({
  children,
  density = 'default',
  description,
  label,
  labelMode = 'visible',
  meta,
  variant = 'read',
}: {
  children: ReactNode;
  density?: WorkbenchInspectorDensity;
  /**
   * What the field edits, in the component's own words (a story's
   * `argTypes[key].description`). Shown as the label's tooltip — the panel
   * stays one line per prop and the doc is a hover away.
   */
  description?: string;
  label: ReactNode;
  labelMode?: 'hidden' | 'visible';
  meta?: ReactNode;
  variant?: WorkbenchInspectorFieldVariant;
}) {
  const describedClassName = description ? ' wb-inspector-field--described' : '';
  return (
    <div
      className={`wb-inspector-field wb-inspector-field--${variant} wb-inspector-field--${density} wb-inspector-field--label-${labelMode}${describedClassName}`}
      aria-description={description || undefined}
    >
      <div className="wb-inspector-field-main">
        <span className="wb-inspector-field-label" title={description || undefined}>{label}</span>
        <span className="wb-inspector-field-value">{children}</span>
      </div>
      {meta ? <small className="wb-inspector-field-meta">{meta}</small> : null}
    </div>
  );
}

export function WorkbenchInspectorTokenSummary({
  label,
  swatchValue,
  value,
}: {
  label: ReactNode;
  swatchValue?: string | null;
  value: ReactNode;
}) {
  return (
    <span className="wb-inspector-token-summary">
      {swatchValue ? (
        <span
          className="wb-inspector-token-swatch"
          style={{ '--wb-inspector-token-swatch': swatchValue } as CSSProperties}
          aria-hidden="true"
        />
      ) : null}
      <span className="wb-inspector-token-copy">
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
    </span>
  );
}
