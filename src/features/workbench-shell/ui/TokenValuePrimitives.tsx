import type { ReactNode } from 'react';
import { SelectControl } from '@shared/ui/primitives';
import type { TokenValue } from '@domain/design-system/tokens/types';

export function TokenValueChip({
  gradientCss,
  gradientLabel,
  label,
  onDoubleClick,
  preview,
}: {
  gradientCss?: string;
  gradientLabel?: string;
  label: string;
  onDoubleClick: () => void;
  preview: ReactNode;
}) {
  if (gradientCss) {
    return (
      <button type="button" className="wb-value-chip wb-value-chip--gradient" title="Double-click to edit value" onDoubleClick={onDoubleClick}>
        <span className="wb-gradient-value-preview" style={{ background: gradientCss }}>
          <span className="wb-gradient-value-label">{gradientLabel ?? label}</span>
        </span>
      </button>
    );
  }

  return (
    <button type="button" className="wb-value-chip" title="Double-click to edit value" onDoubleClick={onDoubleClick}>
      {preview}
      <span className="wb-value-label">{label}</span>
    </button>
  );
}

export function ValueKindSelect({
  ariaLabel,
  kind,
  onKindChange,
}: {
  ariaLabel: string;
  kind: TokenValue['kind'];
  onKindChange: (kind: TokenValue['kind']) => void;
}) {
  return (
    <SelectControl<TokenValue['kind']>
      aria-label={ariaLabel}
      value={kind}
      onValueChange={onKindChange}
    >
      <option value="raw">Raw</option>
      <option value="ref">Ref</option>
    </SelectControl>
  );
}
