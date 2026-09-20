import type { CssVarNamespace, DesignToken, InspectorField, TokenType } from './types';

type FieldRule = {
  cssProperty: string;
  namespace: CssVarNamespace;
  allowedTypes: TokenType[];
};

export const INSPECTOR_TOKEN_FIELD_MAP: Record<InspectorField, FieldRule> = {
  fontSize: { cssProperty: 'font-size', namespace: 'fontSize', allowedTypes: ['dimension'] },
  fontWeight: { cssProperty: 'font-weight', namespace: 'fontWeight', allowedTypes: ['number', 'string'] },
  lineHeight: { cssProperty: 'line-height', namespace: 'lineHeight', allowedTypes: ['dimension'] },
  letterSpacing: { cssProperty: 'letter-spacing', namespace: 'letterSpacing', allowedTypes: ['dimension'] },
  bgColor: { cssProperty: 'background', namespace: 'color', allowedTypes: ['color', 'gradient', 'string'] },
  textColor: { cssProperty: 'color', namespace: 'color', allowedTypes: ['color'] },
  borderColor: { cssProperty: 'border-color', namespace: 'color', allowedTypes: ['color'] },
  padding: { cssProperty: 'padding', namespace: 'spacing', allowedTypes: ['dimension'] },
  margin: { cssProperty: 'margin', namespace: 'spacing', allowedTypes: ['dimension'] },
  gap: { cssProperty: 'gap', namespace: 'spacing', allowedTypes: ['dimension'] },
  width: { cssProperty: 'width', namespace: 'spacing', allowedTypes: ['dimension'] },
  height: { cssProperty: 'height', namespace: 'spacing', allowedTypes: ['dimension'] },
  minWidth: { cssProperty: 'min-width', namespace: 'spacing', allowedTypes: ['dimension'] },
  maxWidth: { cssProperty: 'max-width', namespace: 'spacing', allowedTypes: ['dimension'] },
  minHeight: { cssProperty: 'min-height', namespace: 'spacing', allowedTypes: ['dimension'] },
  maxHeight: { cssProperty: 'max-height', namespace: 'spacing', allowedTypes: ['dimension'] },
  borderRadius: { cssProperty: 'border-radius', namespace: 'borderRadius', allowedTypes: ['dimension'] },
  borderWidth: { cssProperty: 'border-width', namespace: 'borderWidth', allowedTypes: ['dimension'] },
  opacity: { cssProperty: 'opacity', namespace: 'opacity', allowedTypes: ['opacity'] },
};

export function validateTokenForField(token: DesignToken, field?: InspectorField): string | null {
  if (!field) return null;
  const rule = INSPECTOR_TOKEN_FIELD_MAP[field];
  const cssProperty = typeof token.extensions?.cssProperty === 'string' ? token.extensions.cssProperty : null;
  if (cssProperty && cssProperty !== rule.cssProperty) return `${formatField(field)} accepts ${rule.cssProperty} tokens, not ${cssProperty} tokens.`;
  if (rule.allowedTypes.includes(token.type)) return null;
  return `${formatField(field)} accepts ${rule.allowedTypes.map(formatType).join(' or ')} tokens, not ${formatType(token.type)}.`;
}

export function validateTokenName(name: string): string | null {
  if (!name.trim()) return 'Token name is required.';
  if (!/^[a-zA-Z0-9_][\w-]*$/.test(name)) {
    return 'Use letters, numbers, hyphens, and underscores. The first character cannot be a hyphen.';
  }
  return null;
}

export function getCssVarNamespace(field?: InspectorField): CssVarNamespace | null {
  return field ? INSPECTOR_TOKEN_FIELD_MAP[field].namespace : null;
}

function formatType(type: TokenType): string {
  return type[0]!.toUpperCase() + type.slice(1);
}

function formatField(field: InspectorField): string {
  return field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}
