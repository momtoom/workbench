export type WorkbenchProjectSchemaVersion = '0.1';

export type TokenType = 'color' | 'number' | 'dimension' | 'duration' | 'angle' | 'opacity' | 'string' | 'boolean' | 'gradient';

export type TokenMode = {
  id: string;
  name: string;
};

export type TokenGroup = {
  id: string;
  name: string;
  parentGroupId?: string;
  collapsed?: boolean;
};

export type GradientStopColor =
  | { kind: 'raw'; value: string }
  | { kind: 'ref'; collectionId: string; tokenId: string };

export type GradientStop = {
  id: string;
  position: number;
  x?: number;
  y?: number;
  color: GradientStopColor;
  opacity: number;
};

export type GradientType = 'linear' | 'radial' | 'angular' | 'diamond' | 'mesh';

export type GradientValue = {
  type: GradientType;
  angle: number;
  meshBackground?: string;
  meshBackgroundColor?: GradientStopColor;
  meshBackgroundEnabled?: boolean;
  meshBackgroundOpacity?: number;
  meshBlur?: number;
  stops: GradientStop[];
};

export type DimensionUnit = 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw';
export type DurationUnit = 'ms' | 's';
export type AngleUnit = 'deg' | 'rad' | 'turn';

export type DimensionValue = {
  value: number;
  unit: DimensionUnit;
};

export type DurationValue = {
  value: number;
  unit: DurationUnit;
};

export type AngleValue = {
  value: number;
  unit: AngleUnit;
};

export type OpacityValue = {
  value: number;
  unit: '%' | 'number';
};

export type FormulaUnit = DimensionUnit | DurationUnit | AngleUnit | OpacityValue['unit'];

export type TokenRawLiteral = string | number | boolean | GradientValue | DimensionValue | DurationValue | AngleValue | OpacityValue;

export type TokenReference = {
  collectionId: string;
  tokenId: string;
};

export type TokenValue =
  | { kind: 'raw'; value: TokenRawLiteral }
  | { kind: 'ref'; collectionId: string; tokenId: string }
  | { kind: 'formula'; expression: string; unit?: FormulaUnit };

export type DesignToken = {
  id: string;
  name: string;
  type: TokenType;
  groupId?: string;
  description?: string;
  values: Record<string, TokenValue>;
  sortOrder: number;
  extensions?: Record<string, unknown>;
};

export type TokenCollection = {
  id: string;
  name: string;
  description?: string;
  modes: TokenMode[];
  activeMode?: string;
  groups: TokenGroup[];
  tokens: DesignToken[];
  extensions?: Record<string, unknown>;
};

export type TokenRegistry = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  collections: TokenCollection[];
  fieldScopes?: TokenFieldScopesMap;
  extensions: Record<string, unknown>;
};

export type InspectorField =
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'bgColor'
  | 'textColor'
  | 'borderColor'
  | 'padding'
  | 'margin'
  | 'gap'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight'
  | 'borderRadius'
  | 'borderWidth'
  | 'opacity';

export type CssVarNamespace =
  | 'color'
  | 'spacing'
  | 'borderRadius'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'borderWidth'
  | 'opacity';

export type TokenFieldScope = {
  collectionId: string;
  groupId?: string;
};

export type TokenFieldScopesMap = Partial<Record<InspectorField, TokenFieldScope[]>>;

export type ResolvedTokenValue = TokenRawLiteral | null;

export type TailwindTokenBuckets = {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  typography: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
  borderWidth: Record<string, string>;
  opacity: Record<string, string>;
};

export function isGradientValue(value: unknown): value is GradientValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'stops' in value &&
    Array.isArray((value as GradientValue).stops)
  );
}

export function isDimensionValue(value: unknown): value is DimensionValue {
  return isUnitValue(value) && ['px', 'rem', 'em', '%', 'vh', 'vw'].includes(value.unit);
}

export function isDurationValue(value: unknown): value is DurationValue {
  return isUnitValue(value) && ['ms', 's'].includes(value.unit);
}

export function isAngleValue(value: unknown): value is AngleValue {
  return isUnitValue(value) && ['deg', 'rad', 'turn'].includes(value.unit);
}

export function isOpacityValue(value: unknown): value is OpacityValue {
  return isUnitValue(value) && ['%', 'number'].includes(value.unit);
}

export function serializeTokenRawValue(value: TokenRawLiteral): string {
  if (isGradientValue(value)) return 'Gradient';
  if (isDimensionValue(value) || isDurationValue(value) || isAngleValue(value)) return `${formatTokenNumber(value.value)}${value.unit}`;
  if (isOpacityValue(value)) return value.unit === '%' ? `${formatTokenNumber(value.value)}%` : formatTokenNumber(value.value);
  return String(value);
}

function isUnitValue(value: unknown): value is { value: number; unit: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'unit' in value &&
    typeof (value as { value: unknown }).value === 'number' &&
    typeof (value as { unit: unknown }).unit === 'string'
  );
}

function formatTokenNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}
