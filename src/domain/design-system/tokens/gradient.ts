import type { GradientStop, GradientStopColor, GradientValue, ResolvedTokenValue, TokenRegistry } from './types';
import { isGradientValue } from './types';
import { resolveTokenById } from './resolver';

export const DEFAULT_GRADIENT_MESH_BACKGROUND = '#111827';
export const DEFAULT_GRADIENT_FALLBACK_COLOR = '#000000';
export const DEFAULT_GRADIENT_NEW_STOP_COLOR = '#888888';
export const DEFAULT_GRADIENT_END_STOP_COLOR = '#7aa2ff';

export function defaultGradientValue(): GradientValue {
  return {
    type: 'linear',
    angle: 90,
    meshBackground: DEFAULT_GRADIENT_MESH_BACKGROUND,
    meshBackgroundColor: { kind: 'raw', value: DEFAULT_GRADIENT_MESH_BACKGROUND },
    meshBackgroundEnabled: true,
    meshBackgroundOpacity: 100,
    meshBlur: 42,
    stops: [
      { id: makeTokenId('stop'), position: 0, color: { kind: 'raw', value: DEFAULT_GRADIENT_MESH_BACKGROUND }, opacity: 100 },
      { id: makeTokenId('stop'), position: 100, color: { kind: 'raw', value: DEFAULT_GRADIENT_END_STOP_COLOR }, opacity: 100 },
    ],
  };
}

export function resolveStopColor(stop: GradientStop, registry: TokenRegistry, modeId?: string): string {
  return resolveGradientColor(stop.color, registry, modeId);
}

export function resolveGradientColor(color: GradientStopColor, registry: TokenRegistry, modeId?: string): string {
  if (color.kind === 'raw') return color.value;
  const resolved = resolveTokenById(registry, color.collectionId, color.tokenId, modeId);
  return typeof resolved === 'string' ? resolved : DEFAULT_GRADIENT_FALLBACK_COLOR;
}

export function gradientToCss(value: GradientValue, registry: TokenRegistry, modeId?: string): string {
  const normalizedValue = normalizeGradientValue(value);
  const sortedStops = [...normalizedValue.stops].sort((a, b) => a.position - b.position);
  const stops = sortedStops
    .map((stop) => {
      const color = resolveStopColor(stop, registry, modeId);
      return `${color}${opacityToHex(stop.opacity)} ${stop.position}%`;
    })
    .join(', ');

  if (normalizedValue.type === 'mesh') {
    const blur = Math.max(0, Math.min(80, normalizedValue.meshBlur ?? 42));
    const radius = 24 + blur;
    const core = Math.max(0, 14 - blur / 8);
    const backgroundColor = normalizedValue.meshBackgroundColor ?? { kind: 'raw' as const, value: normalizedValue.meshBackground ?? DEFAULT_GRADIENT_MESH_BACKGROUND };
    const backgroundLayer = normalizedValue.meshBackgroundEnabled === false
      ? 'transparent'
      : `${resolveGradientColor(backgroundColor, registry, modeId)}${opacityToHex(normalizedValue.meshBackgroundOpacity ?? 100)}`;
    const layers = sortedStops
      .map((stop) => {
        const color = resolveStopColor(stop, registry, modeId);
        const x = Number.isFinite(stop.x) ? stop.x : stop.position;
        const y = Number.isFinite(stop.y) ? stop.y : 50;
        return `radial-gradient(circle at ${x}% ${y}%, ${color}${opacityToHex(stop.opacity)} 0%, ${color}${opacityToHex(stop.opacity)} ${core}%, transparent ${radius}%)`;
      })
      .join(', ');
    return `${layers}, ${backgroundLayer}`;
  }
  if (normalizedValue.type === 'radial') return `radial-gradient(circle at 50% 50%, ${stops})`;
  if (normalizedValue.type === 'angular') return `conic-gradient(from ${normalizedValue.angle}deg at 50% 50%, ${stops})`;
  if (normalizedValue.type === 'diamond') return diamondGradientToCss(sortedStops, registry, modeId, normalizedValue.angle);
  return `linear-gradient(${normalizedValue.angle}deg, ${stops})`;
}

export function gradientPreviewCss(value: ResolvedTokenValue, registry: TokenRegistry, modeId?: string): string | null {
  if (isGradientValue(value)) return gradientToCss(value, registry, modeId);
  if (isCssGradientLiteral(value)) return value;
  return null;
}

export function isCssGradientLiteral(value: unknown): value is string {
  return typeof value === 'string' && /\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i.test(value.trim());
}

export function cssGradientLiteralToValue(value: string): GradientValue | null {
  const functions = extractCssGradientFunctions(value);
  if (functions.length === 0) return null;
  if (functions.length > 1 && functions.every((gradient) => gradient.name.includes('radial'))) {
    return cssRadialLayersToMeshGradient(functions);
  }

  const gradient = functions[0];
  if (!gradient) return null;
  if (gradient.name.includes('linear')) return cssLinearGradientToValue(gradient.body);
  if (gradient.name.includes('radial')) return cssRadialGradientToValue(gradient.body);
  if (gradient.name.includes('conic')) return cssConicGradientToValue(gradient.body);
  return null;
}

export function normalizeGradientValue(value: GradientValue): GradientValue {
  const stops = value.stops
    .map((stop, index) => normalizeGradientStop(stop, index))
    .filter((stop): stop is GradientStop => stop !== null);
  return {
    ...value,
    angle: normalizeCssAngle(value.angle),
    meshBlur: value.meshBlur === undefined ? value.meshBlur : clamp(value.meshBlur, 0, 80),
    meshBackgroundOpacity: value.meshBackgroundOpacity === undefined ? value.meshBackgroundOpacity : clamp(value.meshBackgroundOpacity, 0, 100),
    stops: ensureMinimumGradientStops(stops),
  };
}

function diamondGradientToCss(stops: GradientStop[], registry: TokenRegistry, modeId: string | undefined, angle: number): string {
  const normalizedStops = stops.length > 0
    ? stops
    : [{ id: 'stop-fallback', position: 0, color: { kind: 'raw' as const, value: DEFAULT_GRADIENT_FALLBACK_COLOR }, opacity: 100 }];
  const samples = 96;
  const layers = Array.from({ length: samples + 1 }, (_, index) => {
      const position = 100 - (index / samples) * 100;
      const color = diamondColorAt(normalizedStops, position, registry, modeId);
      const radius = Math.max(0, Math.min(142, position * 1.42));
      const points = [
        `50,${50 - radius}`,
        `${50 + radius},50`,
        `50,${50 + radius}`,
        `${50 - radius},50`,
      ].join(' ');
      return `<polygon points="${points}" fill="${escapeSvgAttribute(color)}"/>`;
    })
    .join('');
  const outerColor = diamondColorAt(normalizedStops, 100, registry, modeId);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">',
    `<rect width="100" height="100" fill="${escapeSvgAttribute(outerColor)}"/>`,
    `<g transform="rotate(${normalizeSvgAngle(angle) - 90} 50 50)">${layers}</g>`,
    '</svg>',
  ].join('');
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function diamondColorAt(stops: GradientStop[], position: number, registry: TokenRegistry, modeId?: string): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const firstStop = sortedStops[0];
  const lastStop = sortedStops[sortedStops.length - 1];
  if (!firstStop) return DEFAULT_GRADIENT_FALLBACK_COLOR;
  if (!lastStop || position <= firstStop.position) return stopColorWithOpacity(firstStop, registry, modeId);
  if (position >= lastStop.position) return stopColorWithOpacity(lastStop, registry, modeId);

  const endStop = sortedStops.find((stop) => stop.position >= position) ?? lastStop;
  const startStop = sortedStops[Math.max(0, sortedStops.indexOf(endStop) - 1)] ?? firstStop;
  const span = Math.max(1, endStop.position - startStop.position);
  const amount = (position - startStop.position) / span;
  const startColor = parseHexColor(resolveStopColor(startStop, registry, modeId));
  const endColor = parseHexColor(resolveStopColor(endStop, registry, modeId));

  if (!startColor || !endColor) {
    return amount < 0.5 ? stopColorWithOpacity(startStop, registry, modeId) : stopColorWithOpacity(endStop, registry, modeId);
  }

  const opacity = interpolate(startStop.opacity, endStop.opacity, amount);
  return rgbaToCss(
    interpolate(startColor.r, endColor.r, amount),
    interpolate(startColor.g, endColor.g, amount),
    interpolate(startColor.b, endColor.b, amount),
    opacity / 100,
  );
}

function stopColorWithOpacity(stop: GradientStop, registry: TokenRegistry, modeId?: string): string {
  const color = resolveStopColor(stop, registry, modeId);
  const rgb = parseHexColor(color);
  if (!rgb) return `${color}${opacityToHex(stop.opacity)}`;
  return rgbaToCss(rgb.r, rgb.g, rgb.b, Math.max(0, Math.min(100, stop.opacity)) / 100);
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbaToCss(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, amount));
}

function normalizeSvgAngle(value: number): number {
  const normalized = Number.isFinite(value) ? value % 360 : 90;
  return normalized < 0 ? normalized + 360 : normalized;
}

function escapeSvgAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function opacityToHex(opacity: number): string {
  const clamped = Math.max(0, Math.min(100, opacity));
  if (clamped >= 100) return '';
  return Math.round((clamped / 100) * 255)
    .toString(16)
    .padStart(2, '0');
}

export function makeTokenId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type CssGradientFunction = {
  body: string;
  name: string;
};

function extractCssGradientFunctions(value: string): CssGradientFunction[] {
  const functions: CssGradientFunction[] = [];
  const matcher = /((?:repeating-)?(?:linear|radial|conic)-gradient)\s*\(/ig;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(value)) !== null) {
    const name = match[1]?.toLowerCase() ?? '';
    const bodyStart = matcher.lastIndex;
    let depth = 1;
    let index = bodyStart;
    while (index < value.length && depth > 0) {
      const char = value[index];
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      index += 1;
    }
    if (depth === 0) {
      functions.push({ name, body: value.slice(bodyStart, index - 1).trim() });
      matcher.lastIndex = index;
    }
  }
  return functions;
}

function cssLinearGradientToValue(body: string): GradientValue | null {
  const parts = splitTopLevelCommas(body);
  if (parts.length < 2) return null;
  const firstPart = parts[0] ?? '';
  const hasDirection = isGradientDirection(firstPart);
  const stops = cssStopsToGradientStops(hasDirection ? parts.slice(1) : parts);
  if (stops.length === 0) return null;
  return {
    type: 'linear',
    angle: hasDirection ? parseGradientAngle(firstPart, 180) : 180,
    meshBackground: '#FFFFFF',
    meshBackgroundColor: { kind: 'raw', value: '#FFFFFF' },
    meshBackgroundEnabled: false,
    meshBackgroundOpacity: 100,
    meshBlur: 0,
    stops,
  };
}

function cssRadialGradientToValue(body: string): GradientValue | null {
  const parts = splitTopLevelCommas(body);
  const firstPart = parts[0] ?? '';
  const stopParts = /^(?:circle|ellipse|\w+-side|\w+-corner|\d|at\b)/i.test(firstPart.trim()) ? parts.slice(1) : parts;
  const stops = cssStopsToGradientStops(stopParts);
  if (stops.length === 0) return null;
  return {
    type: 'radial',
    angle: 0,
    meshBackground: '#FFFFFF',
    meshBackgroundColor: { kind: 'raw', value: '#FFFFFF' },
    meshBackgroundEnabled: false,
    meshBackgroundOpacity: 100,
    meshBlur: 0,
    stops,
  };
}

function cssConicGradientToValue(body: string): GradientValue | null {
  const parts = splitTopLevelCommas(body);
  const firstPart = parts[0] ?? '';
  const hasDirection = /\bfrom\b|\bdeg\b|\brad\b|\bturn\b/i.test(firstPart);
  const stops = cssStopsToGradientStops(hasDirection ? parts.slice(1) : parts);
  if (stops.length === 0) return null;
  return {
    type: 'angular',
    angle: hasDirection ? parseGradientAngle(firstPart.replace(/\bfrom\b/i, ''), 0) : 0,
    meshBackground: '#FFFFFF',
    meshBackgroundColor: { kind: 'raw', value: '#FFFFFF' },
    meshBackgroundEnabled: false,
    meshBackgroundOpacity: 100,
    meshBlur: 0,
    stops,
  };
}

function cssRadialLayersToMeshGradient(functions: CssGradientFunction[]): GradientValue | null {
  const stops = functions
    .map((gradient, index) => cssRadialLayerToMeshStop(gradient.body, index))
    .filter((stop): stop is GradientStop => stop !== null);
  if (stops.length === 0) return null;
  return {
    type: 'mesh',
    angle: 135,
    meshBackground: '#000000',
    meshBackgroundColor: { kind: 'raw', value: '#000000' },
    meshBackgroundEnabled: false,
    meshBackgroundOpacity: 0,
    meshBlur: averageTransparentRadius(functions) - 24,
    stops,
  };
}

function cssRadialLayerToMeshStop(body: string, index: number): GradientStop | null {
  const parts = splitTopLevelCommas(body);
  const header = parts[0] ?? '';
  const pointMatch = /\bat\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/i.exec(header);
  const x = pointMatch ? clampPercentage(Number(pointMatch[1])) : index === 0 ? 25 : 75;
  const y = pointMatch ? clampPercentage(Number(pointMatch[2])) : index === 0 ? 25 : 75;
  const colorPart = parts.slice(1).find((part) => !/^transparent\b/i.test(part.trim()));
  if (!colorPart) return null;
  const color = parseCssGradientColor(colorPart);
  return {
    id: `legacy-stop-${index + 1}`,
    position: clampPercentage(Math.round((x + y) / 2)),
    x,
    y,
    color: { kind: 'raw', value: color.value },
    opacity: color.opacity,
  };
}

function cssStopsToGradientStops(parts: string[]): GradientStop[] {
  const parsedStops = parts
    .map((part) => parseCssGradientStop(part))
    .filter((stop): stop is { color: string; opacity: number; position: number | null } => stop !== null);
  const lastIndex = Math.max(1, parsedStops.length - 1);
  return parsedStops.map((stop, index) => ({
    id: `legacy-stop-${index + 1}`,
    position: clampPercentage(stop.position ?? Math.round((index / lastIndex) * 100)),
    color: { kind: 'raw', value: stop.color },
    opacity: stop.opacity,
  }));
}

function normalizeGradientStop(stop: GradientStop, index: number): GradientStop | null {
  const color = normalizeGradientStopColor(stop.color);
  if (!color) return null;
  return {
    ...stop,
    id: stop.id || `legacy-stop-${index + 1}`,
    position: clampPercentage(stop.position),
    x: stop.x === undefined ? undefined : clampPercentage(stop.x),
    y: stop.y === undefined ? undefined : clampPercentage(stop.y),
    color,
    opacity: clamp(stop.opacity, 0, 100),
  };
}

function normalizeGradientStopColor(color: GradientStopColor): GradientStopColor | null {
  if (color.kind === 'ref') {
    return color.collectionId && color.tokenId ? color : null;
  }
  const value = color.value.trim();
  return isUsableCssColorLiteral(value) ? { kind: 'raw', value } : null;
}

function ensureMinimumGradientStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length >= 2) return stops;
  if (stops.length === 1) {
    const stop = stops[0];
    const fallbackPosition = stop.position >= 50 ? 0 : 100;
    return [
      stop,
      {
        id: 'recovered-stop',
        position: fallbackPosition,
        color: { kind: 'raw' as const, value: fallbackPosition === 0 ? DEFAULT_GRADIENT_MESH_BACKGROUND : DEFAULT_GRADIENT_END_STOP_COLOR },
        opacity: 100,
      },
    ].sort((a, b) => a.position - b.position);
  }
  return [
    { id: 'recovered-stop-start', position: 0, color: { kind: 'raw', value: DEFAULT_GRADIENT_MESH_BACKGROUND }, opacity: 100 },
    { id: 'recovered-stop-end', position: 100, color: { kind: 'raw', value: DEFAULT_GRADIENT_END_STOP_COLOR }, opacity: 100 },
  ];
}

function isUsableCssColorLiteral(value: string): boolean {
  if (!value) return false;
  if (/^-?\d+(?:\.\d+)?(?:deg|rad|turn)$/i.test(value)) return false;
  if (isCssGradientLiteral(value)) return false;
  return (
    /^#(?:[0-9a-f]{3,8})$/i.test(value) ||
    /^(?:rgb|rgba|hsl|hsla|color|lab|lch|oklab|oklch)\(/i.test(value) ||
    /^var\(/i.test(value) ||
    /^[a-z]+$/i.test(value)
  );
}

function parseCssGradientStop(part: string): { color: string; opacity: number; position: number | null } | null {
  const trimmed = part.trim();
  if (!trimmed) return null;
  const positionMatch = /\s(-?\d+(?:\.\d+)?)%\s*$/.exec(trimmed);
  const position = positionMatch ? clampPercentage(Number(positionMatch[1])) : null;
  const colorText = positionMatch ? trimmed.slice(0, positionMatch.index).trim() : trimmed;
  if (!colorText) return null;
  const color = parseCssGradientColor(colorText);
  return { color: color.value, opacity: color.opacity, position };
}

function parseCssGradientColor(value: string): { value: string; opacity: number } {
  const trimmed = value.trim();
  if (/^transparent$/i.test(trimmed)) return { value: '#000000', opacity: 0 };
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/i.exec(trimmed);
  if (rgba) {
    return {
      value: rgbToHex(Number(rgba[1]), Number(rgba[2]), Number(rgba[3])),
      opacity: Math.round(clamp(Number(rgba[4] ?? 1), 0, 1) * 100),
    };
  }
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (hex) return { value: normalizeHexColor(trimmed), opacity: 100 };
  return { value: trimmed, opacity: 100 };
}

function splitTopLevelCommas(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function isGradientDirection(value: string): boolean {
  return /\bto\b|-?\d+(?:\.\d+)?(?:deg|rad|turn)\b/i.test(value);
}

function parseGradientAngle(value: string, fallback: number): number {
  const trimmed = value.trim().toLowerCase();
  const degMatch = /(-?\d+(?:\.\d+)?)deg\b/.exec(trimmed);
  if (degMatch) return normalizeCssAngle(Number(degMatch[1]));
  const radMatch = /(-?\d+(?:\.\d+)?)rad\b/.exec(trimmed);
  if (radMatch) return normalizeCssAngle((Number(radMatch[1]) * 180) / Math.PI);
  const turnMatch = /(-?\d+(?:\.\d+)?)turn\b/.exec(trimmed);
  if (turnMatch) return normalizeCssAngle(Number(turnMatch[1]) * 360);
  if (/\bto\s+right\b/.test(trimmed)) return 90;
  if (/\bto\s+left\b/.test(trimmed)) return 270;
  if (/\bto\s+top\b/.test(trimmed)) return 0;
  if (/\bto\s+bottom\b/.test(trimmed)) return 180;
  return fallback;
}

function averageTransparentRadius(functions: CssGradientFunction[]): number {
  const radii = functions
    .flatMap((gradient) => splitTopLevelCommas(gradient.body))
    .map((part) => /^transparent\s+(-?\d+(?:\.\d+)?)%/i.exec(part.trim())?.[1])
    .filter((value): value is string => value !== undefined)
    .map((value) => Number(value))
    .filter(Number.isFinite);
  if (radii.length === 0) return 42;
  return clamp(radii.reduce((sum, value) => sum + value, 0) / radii.length, 24, 104);
}

function normalizeCssAngle(value: number): number {
  const normalized = Number.isFinite(value) ? value % 360 : 0;
  return normalized < 0 ? normalized + 360 : normalized;
}

function clampPercentage(value: number): number {
  return clamp(Math.round(Number.isFinite(value) ? value : 0), 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeHexColor(value: string): string {
  const normalized = value.trim();
  if (normalized.length === 4) {
    return `#${normalized.slice(1).split('').map((digit) => `${digit}${digit}`).join('')}`.toUpperCase();
  }
  return normalized.toUpperCase();
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
