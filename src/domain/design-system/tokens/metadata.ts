import type { GradientType, InspectorField, TokenType } from './types';

export const TOKEN_TYPES = [
  'color',
  'dimension',
  'duration',
  'angle',
  'opacity',
  'number',
  'string',
  'boolean',
  'gradient',
] as const satisfies readonly TokenType[];

export const GRADIENT_TYPES = [
  'linear',
  'radial',
  'angular',
  'diamond',
  'mesh',
] as const satisfies readonly GradientType[];

export const INSPECTOR_FIELDS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'bgColor',
  'textColor',
  'borderColor',
  'padding',
  'margin',
  'gap',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'borderRadius',
  'borderWidth',
  'opacity',
] as const satisfies readonly InspectorField[];

export function formatTokenType(type: TokenType): string {
  return type[0]!.toUpperCase() + type.slice(1);
}

export function formatGradientType(type: GradientType): string {
  if (type === 'radial') return 'Radial';
  if (type === 'angular') return 'Angular';
  if (type === 'diamond') return 'Diamond';
  if (type === 'mesh') return 'Mesh';
  return 'Linear';
}

export function formatInspectorField(field: InspectorField): string {
  return field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}
