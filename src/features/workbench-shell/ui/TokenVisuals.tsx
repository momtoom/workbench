import { Hash, Percent, Ruler, Timer, ToggleLeft, TriangleRight, Type } from 'lucide-react';
import type { DesignToken, GradientStopColor, TokenRegistry, TokenType } from '@domain/design-system/tokens/types';
import { gradientPreviewCss } from '@domain/design-system/tokens/gradient';
import type { resolveTokenValue } from '@domain/design-system/tokens/resolver';
import { formatGradientType, formatTokenType } from '@domain/design-system/tokens/metadata';

export function TokenPreview({ token, resolved, registry }: { token: DesignToken; resolved: ReturnType<typeof resolveTokenValue>; registry: TokenRegistry }) {
  if (token.type === 'color' && typeof resolved === 'string') {
    return <TokenSwatch color={resolved} />;
  }
  if (token.type === 'gradient') {
    const gradientCss = gradientPreviewCss(resolved, registry);
    if (gradientCss) return <TokenSwatch color={gradientCss} wide />;
  }
  return <TokenTypeIcon type={token.type} />;
}

export function formatGradientColorLabel(color: GradientStopColor, registry: TokenRegistry, resolvedColor: string): string {
  if (color.kind === 'raw') return color.value;
  const token = registry.collections
    .find((collection) => collection.id === color.collectionId)
    ?.tokens.find((candidate) => candidate.id === color.tokenId);
  return token?.name ?? resolvedColor;
}

export function TokenSwatch({ color, wide = false }: { color: string; wide?: boolean }) {
  return <span className={wide ? 'wb-token-swatch wb-token-swatch--wide' : 'wb-token-swatch'} style={{ background: color }} />;
}

export function EditableColorSwatch({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="wb-editable-color-swatch" style={{ background: value }}>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function TokenTypeIcon({ type }: { type: TokenType }) {
  if (type === 'number') return <span className="wb-token-type-icon wb-token-type-icon--number"><Hash size={13} /></span>;
  if (type === 'dimension') return <span className="wb-token-type-icon wb-token-type-icon--number"><Ruler size={13} /></span>;
  if (type === 'duration') return <span className="wb-token-type-icon wb-token-type-icon--number"><Timer size={13} /></span>;
  if (type === 'angle') return <span className="wb-token-type-icon wb-token-type-icon--number"><TriangleRight size={13} /></span>;
  if (type === 'opacity') return <span className="wb-token-type-icon wb-token-type-icon--number"><Percent size={13} /></span>;
  if (type === 'string') return <span className="wb-token-type-icon wb-token-type-icon--string"><Type size={13} /></span>;
  if (type === 'boolean') return <span className="wb-token-type-icon wb-token-type-icon--boolean"><ToggleLeft size={13} /></span>;
  return <span className={`wb-token-type-dot wb-token-type-dot--${type}`} />;
}

export { formatGradientType, formatTokenType };
