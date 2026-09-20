import type {
  EditableTreeNode,
  EditableTreeSourcePropObject,
  EditableTreeSourcePropValue,
} from '@domain/document/editableTree';

const TAILWIND_RUNTIME_STYLE_ATTRIBUTE = 'data-wb-source-preview-tailwind-runtime-css';
const TAILWIND_CLASS_EFFECTIVENESS_RULE_BUDGET_MS = 16;
const TAILWIND_CLASS_EFFECTIVENESS_MAX_CLASS_TEXT_LENGTH = 32_768;
const TAILWIND_CLASS_EFFECTIVENESS_MAX_CLASS_TOKENS = 256;
const SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR = '.wb-source-visual-node--runtime-component';
const SOURCE_TREE_PREVIEW_RUNTIME_SELECTION_ANCHOR_SELECTOR = '[data-wb-runtime-selection-anchor="true"]';
const SOURCE_TREE_PREVIEW_INTRINSIC_ICON_CLASS_NAME = 'wb-source-visual-intrinsic-icon';

type TailwindRuntimeRule = {
  container?: string;
  selector: string;
  declarations: string[];
  media?: string;
  responsiveOrder: number;
  supports?: string;
  variantCount: number;
};

export type SourceTreePreviewTailwindClassRule = TailwindRuntimeRule & {
  className: string;
  order: number;
};

type TailwindRuntimeVariantResult = {
  container?: string;
  media?: string;
  selector: string;
  supported: boolean;
  supports?: string;
};

type TailwindRuntimeCssOptions = {
  layerName?: string | null;
  mode?: SourceTreePreviewTailwindCssMode;
};

export type SourceTreePreviewTailwindCssMode = 'compiled' | 'disabled' | 'fallback';

type TailwindArbitraryValue = {
  cssValue: string;
  hint: string | null;
  rawValue: string;
};

const TAILWIND_ARBITRARY_VALUE_HINTS = new Set([
  'angle',
  'color',
  'family-name',
  'generic-name',
  'image',
  'integer',
  'length',
  'line-width',
  'number',
  'percentage',
  'position',
  'ratio',
  'size',
  'url',
]);
const TAILWIND_ARBITRARY_LENGTH_HINTS = new Set(['length', 'line-width', 'percentage', 'position', 'size']);
const TAILWIND_ARBITRARY_NUMBER_HINTS = new Set(['integer', 'number']);
const TAILWIND_ARBITRARY_FONT_FAMILY_HINTS = new Set(['family-name', 'generic-name']);
const TAILWIND_ARBITRARY_COLOR_VARIABLE_PATTERN = /(?:color|foreground|background|border(?!-(?:size|width))|ring(?!-(?:offset|size|width))|primary|secondary|muted|accent|destructive|card|popover|sidebar|chart|input|surface|text(?!-(?:size|xs|sm|md|lg|xl|\d)))/i;
const TAILWIND_ARBITRARY_NON_COLOR_VARIABLE_PATTERN = /(?:font-(?:size|weight)|font-size|font-weight|line-height|letter-spacing|leading|tracking|spacing|space|radius|rounded|height|width|size|padding|margin|gap|inset|offset|opacity|duration|scale|rotate|translate|blur|shadow)/i;

const RESPONSIVE_VARIANT_MEDIA: Record<string, string> = {
  xs: '(min-width: 20rem)',
  sm: '(min-width: 40rem)',
  md: '(min-width: 48rem)',
  lg: '(min-width: 64rem)',
  xl: '(min-width: 80rem)',
  '2xl': '(min-width: 96rem)',
};
const RESPONSIVE_VARIANT_ORDER = new Map(
  Object.keys(RESPONSIVE_VARIANT_MEDIA).map((variant, index) => [variant, index]),
);

const CONTAINER_VARIANT_WIDTHS: Record<string, string> = {
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
};

const TAILWIND_CONTAINER_VALUES: Record<string, string> = {
  '3xs': 'var(--container-3xs, 16rem)',
  '2xs': 'var(--container-2xs, 18rem)',
  xs: 'var(--container-xs, 20rem)',
  sm: 'var(--container-sm, 24rem)',
  md: 'var(--container-md, 28rem)',
  lg: 'var(--container-lg, 32rem)',
  xl: 'var(--container-xl, 36rem)',
  '2xl': 'var(--container-2xl, 42rem)',
  '3xl': 'var(--container-3xl, 48rem)',
  '4xl': 'var(--container-4xl, 56rem)',
  '5xl': 'var(--container-5xl, 64rem)',
  '6xl': 'var(--container-6xl, 72rem)',
  '7xl': 'var(--container-7xl, 80rem)',
  full: '100%',
  none: 'none',
};
const TAILWIND_CONTAINER_SCALE_VALUES = Object.keys(TAILWIND_CONTAINER_VALUES)
  .filter((value) => value !== 'full' && value !== 'none');

const TAILWIND_RADIUS_VALUES: Record<string, string> = {
  none: 'var(--radius-none, var(--ds-token-tailwind-primitives-radius-none, 0))',
  sm: 'var(--radius-sm, var(--ds-token-tailwind-primitives-radius-sm, calc(var(--radius, 0.625rem) * 0.6)))',
  md: 'var(--radius-md, var(--ds-token-tailwind-primitives-radius-md, calc(var(--radius, 0.625rem) * 0.8)))',
  lg: 'var(--radius-lg, var(--ds-token-tailwind-primitives-radius-lg, var(--radius, 0.625rem)))',
  xl: 'var(--radius-xl, var(--ds-token-tailwind-primitives-radius-xl, calc(var(--radius, 0.625rem) * 1.4)))',
  '2xl': 'var(--radius-2xl, var(--ds-token-tailwind-primitives-radius-2xl, calc(var(--radius, 0.625rem) * 2)))',
  '3xl': 'var(--radius-3xl, var(--ds-token-tailwind-primitives-radius-3xl, calc(var(--radius, 0.625rem) * 2.4)))',
  '4xl': 'var(--radius-4xl, calc(var(--radius, 0.625rem) * 3))',
  full: 'var(--radius-full, var(--ds-token-tailwind-primitives-radius-full, 9999px))',
};

const TAILWIND_TEXT_SIZE_VALUES: Record<string, [string, string]> = {
  xs: ['var(--text-xs, var(--ds-token-tailwind-primitives-text-xs, 0.75rem))', 'var(--text-xs--line-height, 1rem)'],
  sm: ['var(--text-sm, var(--ds-token-tailwind-primitives-text-sm, 0.875rem))', 'var(--text-sm--line-height, 1.25rem)'],
  base: ['var(--text-base, var(--ds-token-tailwind-primitives-text-base, 1rem))', 'var(--text-base--line-height, 1.5rem)'],
  lg: ['var(--text-lg, var(--ds-token-tailwind-primitives-text-lg, 1.125rem))', 'var(--text-lg--line-height, 1.75rem)'],
  xl: ['var(--text-xl, var(--ds-token-tailwind-primitives-text-xl, 1.25rem))', 'var(--text-xl--line-height, 1.75rem)'],
  '2xl': ['var(--text-2xl, var(--ds-token-tailwind-primitives-text-2xl, 1.5rem))', 'var(--text-2xl--line-height, 2rem)'],
  '3xl': ['var(--text-3xl, var(--ds-token-tailwind-primitives-text-3xl, 1.875rem))', 'var(--text-3xl--line-height, 2.25rem)'],
  '4xl': ['var(--text-4xl, var(--ds-token-tailwind-primitives-text-4xl, 2.25rem))', 'var(--text-4xl--line-height, 2.5rem)'],
  '5xl': ['var(--text-5xl, var(--ds-token-tailwind-primitives-text-5xl, 3rem))', 'var(--text-5xl--line-height, 1)'],
  '6xl': ['var(--text-6xl, var(--ds-token-tailwind-primitives-text-6xl, 3.75rem))', 'var(--text-6xl--line-height, 1)'],
  '7xl': ['var(--text-7xl, var(--ds-token-tailwind-primitives-text-7xl, 4.5rem))', 'var(--text-7xl--line-height, 1)'],
  '8xl': ['var(--text-8xl, var(--ds-token-tailwind-primitives-text-8xl, 6rem))', 'var(--text-8xl--line-height, 1)'],
  '9xl': ['var(--text-9xl, var(--ds-token-tailwind-primitives-text-9xl, 8rem))', 'var(--text-9xl--line-height, 1)'],
};

const TAILWIND_LINE_HEIGHT_VALUES: Record<string, string> = {
  none: 'var(--leading-none, var(--ds-token-tailwind-primitives-leading-none, 1))',
  tight: 'var(--leading-tight, var(--ds-token-tailwind-primitives-leading-tight, 1.25))',
  snug: 'var(--leading-snug, var(--ds-token-tailwind-primitives-leading-snug, 1.375))',
  normal: 'var(--leading-normal, var(--ds-token-tailwind-primitives-leading-normal, 1.5))',
  relaxed: 'var(--leading-relaxed, var(--ds-token-tailwind-primitives-leading-relaxed, 1.625))',
  loose: 'var(--leading-loose, var(--ds-token-tailwind-primitives-leading-loose, 2))',
};

const TAILWIND_FONT_WEIGHT_VALUES: Record<string, string> = {
  thin: 'var(--font-weight-thin, var(--ds-token-tailwind-primitives-font-thin, 100))',
  extralight: 'var(--font-weight-extralight, var(--ds-token-tailwind-primitives-font-extralight, 200))',
  light: 'var(--font-weight-light, var(--ds-token-tailwind-primitives-font-light, 300))',
  normal: 'var(--font-weight-normal, var(--ds-token-tailwind-primitives-font-normal, 400))',
  medium: 'var(--font-weight-medium, var(--ds-token-tailwind-primitives-font-medium, 500))',
  semibold: 'var(--font-weight-semibold, var(--ds-token-tailwind-primitives-font-semibold, 600))',
  bold: 'var(--font-weight-bold, var(--ds-token-tailwind-primitives-font-bold, 700))',
  extrabold: 'var(--font-weight-extrabold, var(--ds-token-tailwind-primitives-font-extrabold, 800))',
  black: 'var(--font-weight-black, var(--ds-token-tailwind-primitives-font-black, 900))',
};

const TAILWIND_LETTER_SPACING_VALUES: Record<string, string> = {
  tighter: 'var(--tracking-tighter, var(--ds-token-tailwind-primitives-tracking-tighter, -0.05em))',
  tight: 'var(--tracking-tight, var(--ds-token-tailwind-primitives-tracking-tight, -0.025em))',
  normal: 'var(--tracking-normal, var(--ds-token-tailwind-primitives-tracking-normal, 0))',
  wide: 'var(--tracking-wide, var(--ds-token-tailwind-primitives-tracking-wide, 0.025em))',
  wider: 'var(--tracking-wider, var(--ds-token-tailwind-primitives-tracking-wider, 0.05em))',
  widest: 'var(--tracking-widest, var(--ds-token-tailwind-primitives-tracking-widest, 0.1em))',
};

const TAILWIND_STATIC_COLORS: Record<string, string> = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
  black: 'var(--color-black, #000)',
  white: 'var(--color-white, #fff)',
  'blue-500': 'var(--color-blue-500, #3b82f6)',
  'cyan-500': 'var(--color-cyan-500, #06b6d4)',
  'emerald-500': 'var(--color-emerald-500, #10b981)',
  'red-500': 'var(--color-red-500, #ef4444)',
  'amber-500': 'var(--color-amber-500, #f59e0b)',
  'yellow-500': 'var(--color-yellow-500, #eab308)',
  'slate-500': 'var(--color-slate-500, #64748b)',
  'zinc-500': 'var(--color-zinc-500, #71717a)',
};

const TAILWIND_BLEND_MODE_VALUES = new Set([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
  'plus-darker',
  'plus-lighter',
]);

const TAILWIND_COLOR_VARIABLES = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
]);
const TAILWIND_COLOR_FALLBACKS: Record<string, string> = {
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  'card-foreground': '#0f172a',
  popover: '#ffffff',
  'popover-foreground': '#0f172a',
  primary: '#2563eb',
  'primary-foreground': '#ffffff',
  secondary: '#f1f5f9',
  'secondary-foreground': '#0f172a',
  muted: '#f1f5f9',
  'muted-foreground': '#64748b',
  accent: '#f1f5f9',
  'accent-foreground': '#0f172a',
  destructive: '#dc2626',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#93c5fd',
  'chart-1': '#2563eb',
  'chart-2': '#16a34a',
  'chart-3': '#f59e0b',
  'chart-4': '#dc2626',
  'chart-5': '#64748b',
  sidebar: '#ffffff',
  'sidebar-foreground': '#0f172a',
  'sidebar-primary': '#2563eb',
  'sidebar-primary-foreground': '#ffffff',
  'sidebar-accent': '#f1f5f9',
  'sidebar-accent-foreground': '#0f172a',
  'sidebar-border': '#e2e8f0',
  'sidebar-ring': '#93c5fd',
};
const TAILWIND_SPACING_PREFIXES = [
  'scroll-mx',
  'scroll-my',
  'scroll-px',
  'scroll-py',
  'scroll-m',
  'scroll-p',
  'inset-x',
  'inset-y',
  'gap-x',
  'gap-y',
  'inset',
  'start',
  'right',
  'bottom',
  'left',
  'end',
  'top',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'gap',
  'm',
  'p',
];
const TAILWIND_SPACING_PREFIX_PATTERN = TAILWIND_SPACING_PREFIXES
  .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const TAILWIND_RUNTIME_WRAPPER_FORWARD_PROPERTIES = new Set([
  'aspect-ratio',
  'bottom',
  'flex',
  'flex-basis',
  'flex-grow',
  'flex-shrink',
  'grid-area',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-row',
  'grid-row-end',
  'grid-row-start',
  'height',
  'inset',
  'inset-block',
  'inset-block-end',
  'inset-block-start',
  'inset-inline',
  'inset-inline-end',
  'inset-inline-start',
  'isolation',
  'justify-self',
  'left',
  'margin',
  'margin-block',
  'margin-block-end',
  'margin-block-start',
  'margin-bottom',
  'margin-inline',
  'margin-inline-end',
  'margin-inline-start',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'order',
  'overflow',
  'overflow-x',
  'overflow-y',
  'place-self',
  'position',
  'right',
  'top',
  'width',
  'z-index',
]);

let cachedWorkbenchTailwindFallbackCss: string | null = null;

export function getSourceTreePreviewTailwindRuntimeStyleAttribute(): string {
  return TAILWIND_RUNTIME_STYLE_ATTRIBUTE;
}

export function getSourceTreePreviewRuntimeWrapperForwardClassName(className: string | null | undefined): string | null {
  const tokens = className?.split(/\s+/).map((part) => part.trim()).filter(Boolean) ?? [];
  const forwardedTokens = tokens.filter(isTailwindRuntimeWrapperForwardClassToken);
  return forwardedTokens.length > 0 ? forwardedTokens.join(' ') : null;
}

export function getSourceTreePreviewTailwindFallbackCss(): string {
  if (cachedWorkbenchTailwindFallbackCss) return cachedWorkbenchTailwindFallbackCss;
  cachedWorkbenchTailwindFallbackCss = getSourceTreePreviewTailwindRuntimeCssForClassTokens(
    createWorkbenchTailwindFallbackClassTokens(),
    { layerName: null },
  ).replace(
    '/* Workbench Tailwind runtime: generated from source className values for the design canvas. */',
    '/* Workbench Tailwind fallback: broad edit-time utility coverage for previews. */',
  );
  return cachedWorkbenchTailwindFallbackCss;
}

export function getSourceTreePreviewTailwindRuntimeCss(
  root: EditableTreeNode,
  renderedClassNames: Iterable<string> = [],
  options: TailwindRuntimeCssOptions = {},
): string {
  const classTokens = collectTailwindClassTokens(root, renderedClassNames);
  return getSourceTreePreviewTailwindRuntimeCssForClassTokens(classTokens, options);
}

export function getSourceTreePreviewTailwindRuntimeCssForClassNames(
  classNames: Iterable<string>,
  options: TailwindRuntimeCssOptions = {},
): string {
  const tokens = new Set<string>();
  for (const className of classNames) addTailwindClassName(tokens, className);
  return getSourceTreePreviewTailwindRuntimeCssForClassTokens([...tokens], options);
}

export function getSourceTreePreviewTailwindClassRulesForClassNames(
  classNames: Iterable<string>,
): SourceTreePreviewTailwindClassRule[] {
  const deadline = getTailwindClassRuleNow() + TAILWIND_CLASS_EFFECTIVENESS_RULE_BUDGET_MS;
  const tokens = new Set<string>();
  for (const className of classNames) {
    if (className.length > TAILWIND_CLASS_EFFECTIVENESS_MAX_CLASS_TEXT_LENGTH) {
      throwTailwindClassRuleBudgetExceeded();
    }
    addTailwindClassName(tokens, className);
    if (
      tokens.size > TAILWIND_CLASS_EFFECTIVENESS_MAX_CLASS_TOKENS ||
      getTailwindClassRuleNow() > deadline
    ) {
      throwTailwindClassRuleBudgetExceeded();
    }
  }
  return [...tokens]
    .map((className) => {
      if (getTailwindClassRuleNow() > deadline) throwTailwindClassRuleBudgetExceeded();
      const rule = createTailwindRuntimeRule(className);
      return rule ? { className, rule } : null;
    })
    .filter((entry): entry is { className: string; rule: TailwindRuntimeRule } => Boolean(entry))
    .sort((left, right) => compareTailwindRuntimeRulePrecedence(left.rule, right.rule))
    .map(({ className, rule }, order) => ({
      ...rule,
      className,
      order,
    }));
}

function getTailwindClassRuleNow(): number {
  return globalThis.performance?.now() ?? Date.now();
}

function throwTailwindClassRuleBudgetExceeded(): never {
  throw new DOMException(
    'Tailwind class rule analysis exceeded its safe interaction budget.',
    'TimeoutError',
  );
}

function getSourceTreePreviewTailwindRuntimeCssForClassTokens(
  classTokens: string[],
  options: TailwindRuntimeCssOptions = {},
): string {
  if (options.mode && options.mode !== 'fallback') return '';
  const runtimeClassTokens = [...new Set(classTokens)];
  const rules = runtimeClassTokens
    .map(createTailwindRuntimeRule)
    .filter((rule): rule is TailwindRuntimeRule => Boolean(rule))
    .sort(compareTailwindRuntimeRulePrecedence);
  if (rules.length === 0) return '';

  const output = [
    '/* Workbench Tailwind runtime: generated from source className values for the design canvas. */',
    ...rules.map(formatTailwindRuntimeRule),
  ];
  const layerName = options.layerName === undefined
    ? 'wb-source-preview-runtime'
    : options.layerName;
  if (!layerName) return output.join('\n');
  return [
    output[0],
    `@layer ${layerName} {`,
    ...output.slice(1),
    '}',
  ].join('\n');
}

function compareTailwindRuntimeRulePrecedence(left: TailwindRuntimeRule, right: TailwindRuntimeRule): number {
  if (left.variantCount !== right.variantCount) return left.variantCount - right.variantCount;
  const leftIsResponsive = left.responsiveOrder >= 0;
  const rightIsResponsive = right.responsiveOrder >= 0;
  if (leftIsResponsive !== rightIsResponsive) return leftIsResponsive ? 1 : -1;
  return left.responsiveOrder - right.responsiveOrder;
}

function createWorkbenchTailwindFallbackClassTokens(): string[] {
  const tokens = new Set<string>();
  const add = (...values: string[]) => values.forEach((value) => tokens.add(value));
  const spacingValues = [
    '0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8',
    '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44',
    '48', '52', '56', '60', '64', '72', '80', '96',
  ];
  const negativeSpacingValues = spacingValues.filter((value) => value !== '0');
  const fractionValues = Array.from({ length: 11 }, (_item, index) => index + 2)
    .flatMap((denominator) => Array.from({ length: denominator - 1 }, (_item, index) => `${index + 1}/${denominator}`));
  const intrinsicSizeValues = ['full', 'screen', 'svh', 'lvh', 'dvh', 'svw', 'lvw', 'dvw', 'fit', 'min', 'max'];
  const spacingSizeValues = [...spacingValues, ...fractionValues, ...intrinsicSizeValues];
  const widthSizeValues = [...spacingSizeValues, 'auto', ...TAILWIND_CONTAINER_SCALE_VALUES];
  const minWidthSizeValues = [...spacingSizeValues, 'auto', ...TAILWIND_CONTAINER_SCALE_VALUES];
  const maxWidthSizeValues = [...spacingSizeValues, 'none', ...TAILWIND_CONTAINER_SCALE_VALUES];
  const heightSizeValues = [...spacingSizeValues, 'auto'];
  const minHeightSizeValues = spacingSizeValues;
  const maxHeightSizeValues = [...spacingSizeValues, 'none'];
  const basisSizeValues = [...spacingValues, ...fractionValues, 'auto', 'full'];
  const colorValues = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted',
    'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'border', 'input',
    'ring', 'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'black', 'white', 'transparent', 'blue-500', 'cyan-500', 'emerald-500', 'red-500',
    'amber-500', 'yellow-500', 'slate-500', 'zinc-500',
  ];
  const textSizeValues = Object.keys(TAILWIND_TEXT_SIZE_VALUES);
  const layoutTokens = [
    'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid', 'flex', 'grid',
    'flow-root', 'hidden', 'contents', 'table', 'inline-table', 'table-row', 'table-cell',
    'relative', 'absolute', 'fixed', 'sticky', 'static', 'isolate',
    'overflow-hidden', 'overflow-auto', 'overflow-visible', 'overflow-scroll', 'overflow-clip',
    'overflow-x-auto', 'overflow-x-hidden', 'overflow-x-scroll', 'overflow-x-clip',
    'overflow-y-auto', 'overflow-y-hidden', 'overflow-y-scroll', 'overflow-y-clip',
    'box-border', 'box-content',
    'object-cover', 'object-contain', 'object-fill', 'object-none', 'object-scale-down',
    'object-bottom', 'object-center', 'object-left', 'object-left-bottom', 'object-left-top',
    'object-right', 'object-right-bottom', 'object-right-top', 'object-top',
    'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
    'items-start', 'items-center', 'items-end', 'items-stretch', 'items-baseline',
    'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly',
    'content-start', 'content-center', 'content-end', 'content-between', 'content-around', 'content-evenly', 'content-stretch',
    'place-content-start', 'place-content-center', 'place-content-end', 'place-content-between',
    'place-items-start', 'place-items-center', 'place-items-end', 'place-items-stretch',
    'self-auto', 'self-start', 'self-center', 'self-end', 'self-stretch', 'self-baseline',
    'shrink', 'shrink-0', 'grow', 'grow-0', 'flex-1', 'flex-auto', 'flex-none',
    'whitespace-normal', 'whitespace-nowrap', 'whitespace-pre', 'whitespace-pre-line', 'whitespace-pre-wrap',
    'break-normal', 'break-words', 'break-all', 'break-keep', 'truncate',
    'text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end', 'text-balance', 'text-pretty',
    'align-middle', 'uppercase', 'lowercase', 'capitalize', 'normal-case',
    'italic', 'not-italic', 'underline', 'overline', 'line-through', 'no-underline',
    'shadow-2xs', 'shadow-xs', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
    'pointer-events-none', 'pointer-events-auto', 'select-none',
    'cursor-pointer', 'cursor-default', 'cursor-not-allowed', 'appearance-none',
    'touch-none', 'list-disc', 'order-first', 'order-last',
    'transition', 'transition-all', 'transition-colors', 'transition-transform', 'transition-none',
    'transition-opacity',
    'outline-none', 'outline-hidden', 'animate-spin', 'animate-pulse', 'animate-none',
    'sr-only', 'container', '@container', 'aspect-auto', 'aspect-square', 'aspect-video',
    'invisible', 'visible', 'collapse', 'list-none', 'resize-none', 'touch-manipulation',
    'tabular-nums', 'wrap-break-word', 'caption-bottom', 'caption-top', 'grayscale',
    'ease-linear', 'ease-in', 'ease-out', 'ease-in-out', 'flex-col-reverse', 'flex-row-reverse',
    'animate-in', 'animate-out', 'animate-accordion-down', 'animate-accordion-up', 'animate-caret-blink',
    'fade-in-0', 'fade-out-0', 'zoom-in-95', 'zoom-out-95',
  ];

  add(...layoutTokens);
  for (const prefix of ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'gap', 'gap-x', 'gap-y', 'inset', 'inset-x', 'inset-y', 'top', 'right', 'bottom', 'left', 'start', 'end', 'scroll-m', 'scroll-mx', 'scroll-my', 'scroll-p', 'scroll-px', 'scroll-py']) {
    for (const value of spacingValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'inset', 'inset-x', 'inset-y', 'top', 'right', 'bottom', 'left', 'start', 'end']) {
    for (const value of negativeSpacingValues) add(`-${prefix}-${value}`);
  }
  for (const prefix of ['space-x', 'space-y']) {
    for (const value of spacingValues) add(`${prefix}-${value}`);
    for (const value of negativeSpacingValues) add(`-${prefix}-${value}`);
  }
  for (const prefix of ['w']) {
    for (const value of widthSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['min-w']) {
    for (const value of minWidthSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['max-w']) {
    for (const value of maxWidthSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['h']) {
    for (const value of heightSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['min-h']) {
    for (const value of minHeightSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['max-h']) {
    for (const value of maxHeightSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['size']) {
    for (const value of spacingSizeValues) add(`${prefix}-${value}`);
  }
  for (const prefix of ['basis']) {
    for (const value of basisSizeValues) add(`${prefix}-${value}`);
  }
  for (const value of ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full']) {
    add(`rounded-${value}`);
    add(`rounded-tl-${value}`, `rounded-tr-${value}`, `rounded-br-${value}`, `rounded-bl-${value}`);
  }
  add('rounded', 'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r');
  for (const value of ['0', '2', '4', '8']) add(`border-${value}`, `divide-x-${value}`, `divide-y-${value}`);
  add('border', 'border-t', 'border-r', 'border-b', 'border-l', 'border-x', 'border-y', 'border-solid', 'border-dashed', 'border-dotted', 'border-none');
  add('divide-x', 'divide-y', 'divide-solid', 'divide-dashed', 'divide-dotted', 'divide-none');
  for (const value of colorValues) add(`bg-${value}`, `text-${value}`, `border-${value}`, `fill-${value}`, `stroke-${value}`, `ring-${value}`);
  for (const value of ['0', '1', '2', '3']) add(`stroke-${value}`);
  for (const value of textSizeValues) add(`text-${value}`);
  for (const value of ['1', '2', '3', '4', '8']) add(`outline-${value}`);
  for (const value of ['normal', 'medium', 'semibold', 'bold', 'extrabold', 'black', 'heading', 'sans', 'mono']) add(`font-${value}`);
  for (const value of ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose']) add(`leading-${value}`);
  for (const value of ['0', '1', '2', '3', '4', '8']) add(`underline-offset-${value}`);
  for (let count = 1; count <= 12; count += 1) {
    add(`grid-cols-${count}`, `grid-rows-${count}`, `col-span-${count}`, `row-span-${count}`);
  }
  for (const value of ['bottom', 'left', 'right', 'top']) {
    add(`slide-in-from-${value}-2`, `slide-out-to-${value}-2`);
  }
  for (const value of ['0', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100']) {
    add(`opacity-${value}`);
  }

  const variantBaseTokens = [
    ...layoutTokens,
    'bg-sidebar-accent', 'bg-primary', 'bg-primary/90', 'bg-background', 'bg-muted',
    'text-sidebar-accent-foreground', 'text-primary-foreground', 'text-muted-foreground',
    'text-foreground', 'border-border', 'opacity-0', 'opacity-100',
    'flex', 'hidden', 'grid', 'block', 'w-auto', 'w-full', 'h-auto', 'h-full', 'min-w-0', 'min-h-0',
    'space-x-0', 'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4',
    'space-y-0', 'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4',
    'flex-col', 'flex-row', 'items-start', 'items-center', 'justify-between',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'animate-in', 'animate-out', 'fade-in-0', 'fade-out-0', 'zoom-in-95', 'zoom-out-95',
  ];
  for (const variant of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus', 'focus-within', 'focus-visible', 'active', 'disabled', 'dark', 'ltr', 'rtl']) {
    for (const token of variantBaseTokens) add(`${variant}:${token}`);
  }
  for (const state of ['open', 'closed', 'active', 'inactive', 'checked', 'unchecked', 'selected']) {
    add(`data-[state=${state}]:bg-accent`, `data-[state=${state}]:text-accent-foreground`, `data-[state=${state}]:opacity-100`);
  }

  return [...tokens];
}

function collectTailwindClassTokens(root: EditableTreeNode, renderedClassNames: Iterable<string>): string[] {
  const tokens = new Set<string>();

  function visit(node: EditableTreeNode) {
    addTailwindClassName(tokens, node.sourceAttributes?.className);
    addTailwindClassName(tokens, node.sourceAttributes?.class);
    collectTailwindClassTokensFromSourceProps(tokens, node.sourceProps);
    for (const child of getTailwindRenderableChildren(node)) visit(child);
  }

  visit(root);
  for (const className of renderedClassNames) addTailwindClassName(tokens, className);
  return [...tokens];
}

function getTailwindRenderableChildren(node: EditableTreeNode): EditableTreeNode[] {
  const previewChildren = node.sourcePreviewChildren ?? [];
  return previewChildren.length > 0 ? previewChildren : node.children ?? [];
}

function collectTailwindClassTokensFromSourceProps(
  tokens: Set<string>,
  sourceProps: EditableTreeNode['sourceProps'] | undefined,
) {
  if (!sourceProps) return;
  for (const [key, value] of Object.entries(sourceProps)) {
    if (key === 'class' || key === 'className') {
      addTailwindClassName(tokens, typeof value === 'string' ? value : undefined);
      continue;
    }
    collectTailwindClassTokensFromSourcePropValue(tokens, value);
  }
}

function collectTailwindClassTokensFromSourcePropValue(
  tokens: Set<string>,
  value: EditableTreeSourcePropValue,
) {
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (isSourcePropObject(item)) {
      addTailwindClassName(tokens, typeof item.className === 'string' ? item.className : undefined);
      addTailwindClassName(tokens, typeof item.class === 'string' ? item.class : undefined);
    }
  }
}

function isSourcePropObject(value: EditableTreeSourcePropValue | EditableTreeSourcePropObject): value is EditableTreeSourcePropObject {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object';
}

function addTailwindClassName(tokens: Set<string>, className: string | undefined) {
  if (!className) return;
  for (const token of className.split(/\s+/).map((part) => part.trim()).filter(Boolean)) {
    tokens.add(token);
  }
}

function createTailwindRuntimeRule(classToken: string): TailwindRuntimeRule | null {
  const { base, variants } = splitTailwindClassToken(classToken);
  const responsiveOrder = variants.reduce((order, variant) => {
    const nextOrder = RESPONSIVE_VARIANT_ORDER.get(variant) ?? -1;
    return nextOrder >= 0 ? Math.max(order, nextOrder) : order;
  }, -1);
  const important = base.startsWith('!') || base.endsWith('!');
  const utility = base.replace(/^!/, '').replace(/!$/, '');
  const selector = `.${escapeCssIdentifier(classToken)}`;
  const variantResult = applyTailwindRuntimeVariants(selector, variants);
  if (!variantResult.supported) return null;

  const spaceDeclarations = getTailwindSpaceDeclarations(utility);
  const pseudoDeclarations = getTailwindRuntimePseudoDeclarations(variants);
  const childDeclarations = spaceDeclarations.length > 0
    ? spaceDeclarations
    : [
        ...getTailwindDivideDeclarations(utility),
        ...getTailwindDivideColorDeclarations(utility),
      ];
  if (childDeclarations.length > 0) {
    const childSelector = appendTailwindSelectorSuffix(variantResult.selector, ' > :not(:last-child)');
    const runtimeWrapperSelector = appendTailwindSelectorSuffix(
      variantResult.selector,
      ` > ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR}:not(:last-child) > :last-child`,
    );
    const runtimeSelectionAnchorSelector = appendTailwindSelectorSuffix(
      variantResult.selector,
      ` > ${SOURCE_TREE_PREVIEW_RUNTIME_SELECTION_ANCHOR_SELECTOR}:not(:last-child) > :last-child`,
    );
    const runtimeSelectionAnchorWrapperSelector = appendTailwindSelectorSuffix(
      variantResult.selector,
      ` > ${SOURCE_TREE_PREVIEW_RUNTIME_SELECTION_ANCHOR_SELECTOR}:not(:last-child) > ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > :last-child`,
    );
    return {
      container: variantResult.container,
      media: variantResult.media,
      responsiveOrder,
      selector: `${childSelector}, ${runtimeWrapperSelector}, ${runtimeSelectionAnchorSelector}, ${runtimeSelectionAnchorWrapperSelector}`,
      supports: variantResult.supports,
      variantCount: variants.length,
      declarations: important
        ? [...pseudoDeclarations, ...childDeclarations].map((declaration) => `${declaration} !important`)
        : [...pseudoDeclarations, ...childDeclarations],
    };
  }

  const declarations = getTailwindRuntimeDeclarations(utility);
  if (declarations.length === 0) return null;
  const selectorSuffix = getTailwindRuntimeUtilitySelectorSuffix(utility);
  const ruleSelector = selectorSuffix
    ? appendTailwindSelectorSuffix(variantResult.selector, selectorSuffix)
    : variantResult.selector;
  const runtimeWrapperForwardSelector = isTailwindRuntimeWrapperForwardUtility(utility)
    ? appendTailwindSelectorSuffix(
        variantResult.selector,
        `${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > *${selectorSuffix ?? ''}`,
      )
    : null;
  return {
    container: variantResult.container,
    media: variantResult.media,
    responsiveOrder,
    selector: runtimeWrapperForwardSelector ? `${ruleSelector}, ${runtimeWrapperForwardSelector}` : ruleSelector,
    supports: variantResult.supports,
    variantCount: variants.length,
    declarations: important
      ? [...pseudoDeclarations, ...declarations].map((declaration) => `${declaration} !important`)
      : [...pseudoDeclarations, ...declarations],
  };
}

function splitTailwindClassToken(classToken: string): { base: string; variants: string[] } {
  const parts: string[] = [];
  let current = '';
  let bracketDepth = 0;
  let parenDepth = 0;

  for (const char of classToken) {
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    if (char === ':' && bracketDepth === 0 && parenDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  parts.push(current);
  const base = parts.pop() ?? classToken;
  return { base, variants: parts.filter(Boolean) };
}

function isTailwindRuntimeWrapperForwardClassToken(classToken: string): boolean {
  const { base } = splitTailwindClassToken(classToken);
  return isTailwindRuntimeWrapperForwardUtility(base.replace(/^!/, '').replace(/!$/, ''));
}

function isTailwindRuntimeWrapperForwardUtility(utility: string): boolean {
  if (utility.startsWith('[') && utility.endsWith(']')) {
    const declaration = unwrapTailwindArbitraryValue(utility);
    const separatorIndex = findTopLevelCharacter(declaration, ':');
    if (separatorIndex <= 0) return false;
    return TAILWIND_RUNTIME_WRAPPER_FORWARD_PROPERTIES.has(declaration.slice(0, separatorIndex).trim());
  }

  if (utility.startsWith('-')) {
    const positiveUtility = utility.slice(1);
    return positiveUtility.startsWith('inset-') ||
      positiveUtility.startsWith('inset-x-') ||
      positiveUtility.startsWith('inset-y-') ||
      positiveUtility.startsWith('top-') ||
      positiveUtility.startsWith('right-') ||
      positiveUtility.startsWith('bottom-') ||
      positiveUtility.startsWith('left-') ||
      positiveUtility.startsWith('start-') ||
      positiveUtility.startsWith('end-') ||
      positiveUtility.startsWith('m-') ||
      positiveUtility.startsWith('mx-') ||
      positiveUtility.startsWith('my-') ||
      positiveUtility.startsWith('mt-') ||
      positiveUtility.startsWith('mr-') ||
      positiveUtility.startsWith('mb-') ||
      positiveUtility.startsWith('ml-') ||
      positiveUtility.startsWith('ms-') ||
      positiveUtility.startsWith('me-') ||
      positiveUtility.startsWith('order-') ||
      positiveUtility.startsWith('z-');
  }

  if (
    utility === 'container' ||
    utility === 'relative' ||
    utility === 'absolute' ||
    utility === 'fixed' ||
    utility === 'sticky' ||
    utility === 'static' ||
    utility === 'flex-1' ||
    utility === 'flex-auto' ||
    utility === 'flex-none' ||
    utility === 'flex-initial' ||
    utility === 'grow' ||
    utility === 'grow-0' ||
    utility === 'shrink' ||
    utility === 'shrink-0' ||
    utility === 'isolate' ||
    utility === 'isolation-auto'
  ) {
    return true;
  }

  return utility.startsWith('flex-[') ||
    utility.startsWith('flex-(') ||
    utility.startsWith('basis-') ||
    utility.startsWith('grow-') ||
    utility.startsWith('shrink-') ||
    utility.startsWith('order-') ||
    utility.startsWith('z-') ||
    utility.startsWith('w-') ||
    utility.startsWith('h-') ||
    utility.startsWith('min-w-') ||
    utility.startsWith('min-h-') ||
    utility.startsWith('max-w-') ||
    utility.startsWith('max-h-') ||
    utility.startsWith('size-') ||
    utility.startsWith('aspect-') ||
    utility.startsWith('m-') ||
    utility.startsWith('mx-') ||
    utility.startsWith('my-') ||
    utility.startsWith('mt-') ||
    utility.startsWith('mr-') ||
    utility.startsWith('mb-') ||
    utility.startsWith('ml-') ||
    utility.startsWith('ms-') ||
    utility.startsWith('me-') ||
    utility.startsWith('inset-') ||
    utility.startsWith('inset-x-') ||
    utility.startsWith('inset-y-') ||
    utility.startsWith('top-') ||
    utility.startsWith('right-') ||
    utility.startsWith('bottom-') ||
    utility.startsWith('left-') ||
    utility.startsWith('start-') ||
    utility.startsWith('end-') ||
    utility.startsWith('self-') ||
    utility.startsWith('justify-self-') ||
    utility.startsWith('place-self-') ||
    utility.startsWith('col-') ||
    utility.startsWith('row-') ||
    utility.startsWith('overflow-') ||
    utility.startsWith('overflow-x-') ||
    utility.startsWith('overflow-y-');
}

function applyTailwindRuntimeVariants(selector: string, variants: string[]): TailwindRuntimeVariantResult {
  let nextSelector = selector;
  const containerQueries: string[] = [];
  const mediaQueries: string[] = [];
  const supportsQueries: string[] = [];

  for (const variant of variants) {
    const responsiveMedia = RESPONSIVE_VARIANT_MEDIA[variant];
    if (responsiveMedia) {
      mediaQueries.push(responsiveMedia);
      continue;
    }
    const containerQuery = getTailwindContainerVariantQuery(variant);
    if (containerQuery) {
      containerQueries.push(containerQuery);
      continue;
    }

    if (variant === '*') {
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [
        `${selector} > *`,
        `${selector} > ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > *`,
        `${selector} > ${SOURCE_TREE_PREVIEW_RUNTIME_SELECTION_ANCHOR_SELECTOR} > *`,
        `${selector} > ${SOURCE_TREE_PREVIEW_RUNTIME_SELECTION_ANCHOR_SELECTOR} > ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > *`,
      ]);
      continue;
    }
    if (variant === '**') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ' *');
      continue;
    }
    if (variant === 'first') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':first-child');
      continue;
    }
    if (variant === 'last') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':last-child');
      continue;
    }
    if (variant === 'only') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':only-child');
      continue;
    }
    if (variant === 'odd') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':nth-child(odd)');
      continue;
    }
    if (variant === 'even') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':nth-child(even)');
      continue;
    }
    if (/^nth-\d+$/.test(variant)) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:nth-child(${variant.slice('nth-'.length)})`);
      continue;
    }
    if (variant.startsWith('nth-[')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:nth-child(${unwrapTailwindArbitraryValue(variant.slice('nth-'.length))})`,
      );
      continue;
    }
    if (/^nth-last-\d+$/.test(variant)) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:nth-last-child(${variant.slice('nth-last-'.length)})`);
      continue;
    }
    if (variant.startsWith('nth-last-[')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:nth-last-child(${unwrapTailwindArbitraryValue(variant.slice('nth-last-'.length))})`,
      );
      continue;
    }
    if (variant === 'not-last') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':not(:last-child)');
      continue;
    }
    if (variant === 'hover') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':hover');
      continue;
    }
    if (variant === 'focus') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':focus');
      continue;
    }
    if (variant === 'focus-within') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':focus-within');
      continue;
    }
    if (variant === 'focus-visible') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':focus-visible');
      continue;
    }
    if (variant === 'active') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':active');
      continue;
    }
    if (variant === 'visited') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':visited');
      continue;
    }
    if (variant === 'target') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':target');
      continue;
    }
    if (variant === 'open') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':is([open], :popover-open, :open)');
      continue;
    }
    if (variant === 'disabled') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':disabled');
      continue;
    }
    if (variant === 'enabled') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':enabled');
      continue;
    }
    if (variant === 'checked') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':checked');
      continue;
    }
    if (variant === 'indeterminate') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':indeterminate');
      continue;
    }
    if (variant === 'default') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':default');
      continue;
    }
    if (variant === 'required') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':required');
      continue;
    }
    if (variant === 'valid') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':valid');
      continue;
    }
    if (variant === 'invalid') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':invalid');
      continue;
    }
    if (variant === 'in-range') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':in-range');
      continue;
    }
    if (variant === 'out-of-range') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':out-of-range');
      continue;
    }
    if (variant === 'placeholder-shown') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':placeholder-shown');
      continue;
    }
    if (variant === 'autofill') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':autofill');
      continue;
    }
    if (variant === 'read-only') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':read-only');
      continue;
    }
    if (variant === 'empty') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':empty');
      continue;
    }
    if (variant === 'before' || variant === 'after') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `::${variant}`);
      continue;
    }
    if (variant === 'file') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::file-selector-button');
      continue;
    }
    if (variant === 'placeholder') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::placeholder');
      continue;
    }
    if (variant === 'marker') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::marker');
      continue;
    }
    if (variant === 'first-letter') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::first-letter');
      continue;
    }
    if (variant === 'first-line') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::first-line');
      continue;
    }
    if (variant === 'selection') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, '::selection');
      continue;
    }
    if (variant === 'supports-backdrop-filter') {
      supportsQueries.push('((-webkit-backdrop-filter: var(--tw)) or (backdrop-filter: var(--tw)))');
      continue;
    }
    if (variant.startsWith('supports-[')) {
      supportsQueries.push(`(${unwrapTailwindArbitraryValue(variant.slice('supports-'.length))})`);
      continue;
    }
    if (variant === 'motion-safe') {
      mediaQueries.push('(prefers-reduced-motion: no-preference)');
      continue;
    }
    if (variant === 'motion-reduce') {
      mediaQueries.push('(prefers-reduced-motion: reduce)');
      continue;
    }
    if (variant === 'portrait') {
      mediaQueries.push('(orientation: portrait)');
      continue;
    }
    if (variant === 'landscape') {
      mediaQueries.push('(orientation: landscape)');
      continue;
    }
    if (variant === 'print') {
      mediaQueries.push('print');
      continue;
    }
    if (variant === 'dark') {
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [
        `.dark ${selector}`,
        `[data-theme="dark"] ${selector}`,
        `[data-preview-theme="dark"] ${selector}`,
      ]);
      continue;
    }
    if (variant === 'ltr') {
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [
        `[dir="ltr"] ${selector}`,
        `${selector}:dir(ltr)`,
      ]);
      continue;
    }
    if (variant === 'rtl') {
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [
        `[dir="rtl"] ${selector}`,
        `${selector}:dir(rtl)`,
      ]);
      continue;
    }
    if (variant.startsWith('not-data-[')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:not(${getDataAttributeSelector(`data-${variant.slice('not-data-'.length)}`)})`,
      );
      continue;
    }
    if (variant.startsWith('not-data-')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:not([data-${escapeAttributeName(variant.slice('not-data-'.length))}])`,
      );
      continue;
    }
    if (variant.startsWith('not-aria-')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:not(${getAriaAttributeSelector(variant.slice('not-'.length))})`);
      continue;
    }
    if (variant.startsWith('data-[')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, getDataAttributeSelector(variant));
      continue;
    }
    if (variant.startsWith('data-')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `[data-${escapeAttributeName(variant.slice('data-'.length))}]`);
      continue;
    }
    if (variant.startsWith('aria-')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, getAriaAttributeSelector(variant));
      continue;
    }
    if (variant.startsWith('has-aria-')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:has(${getAriaAttributeSelector(variant.slice('has-'.length))})`);
      continue;
    }
    if (variant === 'has-disabled') {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, ':has(:disabled, [disabled], [data-disabled])');
      continue;
    }
    if (variant.startsWith('has-data-[')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:has(${getDataAttributeSelector(`data-${variant.slice('has-data-'.length)}`)})`,
      );
      continue;
    }
    if (variant.startsWith('has-data-')) {
      nextSelector = appendTailwindSelectorSuffix(
        nextSelector,
        `:has([data-${escapeAttributeName(variant.slice('has-data-'.length))}])`,
      );
      continue;
    }
    if (variant.startsWith('has-[')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:has(${unwrapTailwindArbitraryValue(variant.slice('has-'.length))})`);
      continue;
    }
    if (variant.startsWith('in-data-[')) {
      const dataSelector = getDataAttributeSelector(`data-${variant.slice('in-data-'.length)}`);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${dataSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-hover')) {
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`.group:hover ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-focus-within')) {
      const groupSelector = getGroupStateSelector(variant, ':focus-within');
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-focus')) {
      const groupSelector = getGroupStateSelector(variant, ':focus');
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-has-data-[')) {
      const groupSelector = getGroupHasDataAttributeSelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-has-data-')) {
      const groupSelector = getGroupHasDataAttributeSelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-has-[')) {
      const groupSelector = getGroupHasArbitrarySelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-has-disabled')) {
      const groupSelector = getGroupHasStateSelector(variant, ':disabled, [disabled], [data-disabled]');
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-data-[')) {
      const groupSelector = getGroupDataAttributeSelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-data-')) {
      const groupSelector = getGroupDataAttributeSelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('group-aria-')) {
      const groupSelector = getGroupAriaAttributeSelector(variant);
      nextSelector = expandTailwindSelectorList(nextSelector, (selector) => [`${groupSelector} ${selector}`]);
      continue;
    }
    if (variant.startsWith('peer-disabled')) {
      nextSelector = applyTailwindRuntimePeerVariant(nextSelector, '.peer:disabled');
      continue;
    }
    if (variant.startsWith('peer-hover')) {
      nextSelector = applyTailwindRuntimePeerVariant(nextSelector, getPeerStateSelector(variant, ':hover'));
      continue;
    }
    if (variant.startsWith('peer-focus')) {
      nextSelector = applyTailwindRuntimePeerVariant(nextSelector, getPeerStateSelector(variant, ':focus'));
      continue;
    }
    if (variant.startsWith('peer-data-[')) {
      nextSelector = applyTailwindRuntimePeerVariant(
        nextSelector,
        `.peer${getDataAttributeSelector(`data-${getTailwindVariantWithoutModifier(variant).slice('peer-data-'.length)}`)}`,
      );
      continue;
    }
    if (variant.startsWith('peer-data-')) {
      const peerSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
      const dataPart = variant.slice('peer-data-'.length, peerSuffix ? variant.indexOf('/') : undefined);
      const peerSelector = peerSuffix ? `.peer\\/${escapeCssIdentifier(peerSuffix)}` : '.peer';
      nextSelector = applyTailwindRuntimePeerVariant(nextSelector, `${peerSelector}[data-${escapeAttributeName(dataPart)}]`);
      continue;
    }
    if (variant.startsWith('not-[')) {
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:not(${unwrapTailwindArbitraryValue(variant.slice('not-'.length))})`);
      continue;
    }
    if (variant.startsWith('not-')) {
      const negated = applyTailwindRuntimeVariants('&', [variant.slice('not-'.length)]);
      if (!negated.supported) return { media: undefined, selector, supported: false };
      nextSelector = appendTailwindSelectorSuffix(nextSelector, `:not(${negated.selector.split('&').join('').trim()})`);
      continue;
    }
    if (variant.startsWith('[@media')) {
      mediaQueries.push(unwrapTailwindArbitraryValue(variant).replace(/^@media\s*/, ''));
      continue;
    }
    if (variant.startsWith('[@supports')) {
      supportsQueries.push(unwrapTailwindArbitraryValue(variant).replace(/^@supports\s*/, ''));
      continue;
    }
    if (variant.startsWith('[')) {
      nextSelector = applyTailwindArbitrarySelectorVariant(nextSelector, variant);
      continue;
    }
    return {
      media: undefined,
      selector,
      supported: false,
    };
  }

  return {
    container: containerQueries.length > 0 ? containerQueries.join(' and ') : undefined,
    media: mediaQueries.length > 0 ? mediaQueries.join(' and ') : undefined,
    selector: nextSelector,
    supported: true,
    supports: supportsQueries.length > 0 ? supportsQueries.join(' and ') : undefined,
  };
}

function getTailwindRuntimePseudoDeclarations(variants: string[]): string[] {
  return variants.some((variant) => variant === 'before' || variant === 'after')
    ? ['content: var(--tw-content, "")']
    : [];
}

function getTailwindContainerVariantQuery(variant: string): string | null {
  if (!variant.startsWith('@') || variant.startsWith('@container')) return null;
  const slashIndex = variant.indexOf('/');
  const rawName = slashIndex === -1 ? '' : variant.slice(slashIndex + 1);
  const rawValue = variant.slice(1, slashIndex === -1 ? undefined : slashIndex);
  const condition = rawValue.startsWith('[')
    ? `(min-width: ${unwrapTailwindArbitraryValue(rawValue)})`
    : CONTAINER_VARIANT_WIDTHS[rawValue]
      ? `(min-width: ${CONTAINER_VARIANT_WIDTHS[rawValue]})`
      : null;
  if (!condition) return null;
  return rawName ? `${escapeCssIdentifier(rawName)} ${condition}` : condition;
}

function getDataAttributeSelector(variant: string): string {
  const value = unwrapTailwindArbitraryValue(variant.slice('data-'.length));
  if (!value) return '';
  const [name, rawAttributeValue] = value.split('=');
  if (!name) return '';
  return rawAttributeValue === undefined
    ? `[data-${name}]`
    : `[data-${name}="${rawAttributeValue.replace(/^['"]|['"]$/g, '')}"]`;
}

function getGroupDataAttributeSelector(variant: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const dataPart = variant.slice('group-data-'.length, groupSuffix ? variant.indexOf('/') : undefined);
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  const dataSelector = dataPart.startsWith('[')
    ? getDataAttributeSelector(`data-${dataPart}`)
    : `[data-${escapeAttributeName(dataPart)}]`;
  return `${groupSelector}${dataSelector}`;
}

function getGroupStateSelector(variant: string, stateSelector: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  return `${groupSelector}${stateSelector}`;
}

function getPeerStateSelector(variant: string, stateSelector: string): string {
  const peerSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const peerSelector = peerSuffix ? `.peer\\/${escapeCssIdentifier(peerSuffix)}` : '.peer';
  return `${peerSelector}${stateSelector}`;
}

function getTailwindVariantWithoutModifier(variant: string): string {
  const modifierIndex = variant.indexOf('/');
  return modifierIndex === -1 ? variant : variant.slice(0, modifierIndex);
}

function getGroupHasDataAttributeSelector(variant: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const dataPart = variant.slice('group-has-data-'.length, groupSuffix ? variant.indexOf('/') : undefined);
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  const dataSelector = dataPart.startsWith('[')
    ? getDataAttributeSelector(`data-${dataPart}`)
    : `[data-${escapeAttributeName(dataPart)}]`;
  return `${groupSelector}:has(${dataSelector})`;
}

function getGroupHasArbitrarySelector(variant: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const hasPart = variant.slice('group-has-'.length, groupSuffix ? variant.indexOf('/') : undefined);
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  return `${groupSelector}:has(${unwrapTailwindArbitraryValue(hasPart)})`;
}

function getGroupHasStateSelector(variant: string, stateSelector: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  return `${groupSelector}:has(${stateSelector})`;
}

function getAriaAttributeSelector(variant: string): string {
  const slashIndex = variant.indexOf('/');
  const value = variant.slice('aria-'.length, slashIndex === -1 ? undefined : slashIndex);
  if (!value) return '';
  if (value.startsWith('[')) {
    const arbitraryValue = unwrapTailwindArbitraryValue(value);
    const [name, rawAttributeValue] = arbitraryValue.split('=');
    if (!name) return '';
    return rawAttributeValue === undefined
      ? `[aria-${name}]`
      : `[aria-${name}="${rawAttributeValue.replace(/^['"]|['"]$/g, '')}"]`;
  }
  return `[aria-${value}="true"]`;
}

function getGroupAriaAttributeSelector(variant: string): string {
  const groupSuffix = variant.includes('/') ? variant.slice(variant.indexOf('/') + 1) : '';
  const ariaVariant = variant.slice('group-'.length, groupSuffix ? variant.indexOf('/') : undefined);
  const groupSelector = groupSuffix ? `.group\\/${escapeCssIdentifier(groupSuffix)}` : '.group';
  return `${groupSelector}${getAriaAttributeSelector(ariaVariant)}`;
}

function applyTailwindArbitrarySelectorVariant(selector: string, variant: string): string {
  const arbitrarySelector = unwrapTailwindArbitraryValue(variant);
  if (!arbitrarySelector) return selector;
  if (arbitrarySelector.includes('&')) {
    return expandTailwindSelectorList(selector, (part) => [
      ...getTailwindIntrinsicIconArbitrarySelectorAliases(arbitrarySelector)
        .map((candidate) => candidate.split('&').join(part)),
    ]);
  }
  return expandTailwindSelectorList(selector, (part) => [
    ...getTailwindIntrinsicIconArbitrarySelectorAliases(arbitrarySelector)
      .map((candidate) => appendTailwindArbitrarySelector(part, candidate)),
  ]);
}

function getTailwindIntrinsicIconArbitrarySelectorAliases(arbitrarySelector: string): string[] {
  if (!/\bsvg\b/.test(arbitrarySelector)) return [arbitrarySelector];
  const intrinsicIconSelector = `.${SOURCE_TREE_PREVIEW_INTRINSIC_ICON_CLASS_NAME}`;
  const aliases = new Set([arbitrarySelector]);
  aliases.add(arbitrarySelector.replace(/\bsvg\b/g, intrinsicIconSelector));
  aliases.add(arbitrarySelector.replace(/>\s*svg\b/g, `> ${intrinsicIconSelector}`));
  aliases.add(arbitrarySelector.replace(
    />\s*svg\b/g,
    `> ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} > ${intrinsicIconSelector}`,
  ));
  return [...aliases];
}

function applyTailwindRuntimePeerVariant(selector: string, peerSelector: string): string {
  return expandTailwindSelectorList(selector, (targetSelector) => [
    `${targetSelector}:is(:where(${peerSelector}) ~ *)`,
    `${targetSelector}:is(${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR}:has(${peerSelector}) ~ ${SOURCE_TREE_PREVIEW_RUNTIME_WRAPPER_SELECTOR} *)`,
  ]);
}

function appendTailwindSelectorSuffix(selector: string, suffix: string): string {
  return expandTailwindSelectorList(selector, (part) => [`${part}${suffix}`]);
}

function appendTailwindArbitrarySelector(selector: string, arbitrarySelector: string): string {
  const targetSelector = arbitrarySelector.trim();
  if (!targetSelector) return selector;
  if (selector.endsWith(' > *')) return `${selector.slice(0, -1)}${targetSelector}`;
  if (selector.endsWith(' *')) return `${selector.slice(0, -1)}${targetSelector}`;
  if (/^(?:::?|[>[+~])/.test(targetSelector) || targetSelector.startsWith('[')) {
    return `${selector}${targetSelector}`;
  }
  return `${selector} ${targetSelector}`;
}

function expandTailwindSelectorList(
  selector: string,
  expand: (selector: string) => string[],
): string {
  return splitTailwindSelectorList(selector)
    .flatMap(expand)
    .join(', ');
}

function splitTailwindSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let current = '';
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (const char of selector) {
    current += char;

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '[') {
      bracketDepth += 1;
      continue;
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (char === '(') {
      parenDepth += 1;
      continue;
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (char === ',' && bracketDepth === 0 && parenDepth === 0) {
      parts.push(current.slice(0, -1).trim());
      current = '';
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function getTailwindRuntimeDeclarations(utility: string): string[] {
  const staticDeclarations = getTailwindStaticDeclarations(utility);
  if (staticDeclarations.length > 0) return staticDeclarations;

  const arbitraryValueDeclarations = getTailwindArbitraryValueDeclarations(utility);
  if (arbitraryValueDeclarations.length > 0) return arbitraryValueDeclarations;

  const spacingDeclarations = getTailwindSpacingDeclarations(utility);
  if (spacingDeclarations.length > 0) return spacingDeclarations;

  const sizingDeclarations = getTailwindSizingDeclarations(utility);
  if (sizingDeclarations.length > 0) return sizingDeclarations;

  const transformDeclarations = getTailwindTransformDeclarations(utility);
  if (transformDeclarations.length > 0) return transformDeclarations;

  const typographyDeclarations = getTailwindTypographyDeclarations(utility);
  if (typographyDeclarations.length > 0) return typographyDeclarations;

  const colorDeclarations = getTailwindColorDeclarations(utility);
  if (colorDeclarations.length > 0) return colorDeclarations;

  const borderDeclarations = getTailwindBorderDeclarations(utility);
  if (borderDeclarations.length > 0) return borderDeclarations;

  const gridDeclarations = getTailwindGridDeclarations(utility);
  if (gridDeclarations.length > 0) return gridDeclarations;

  const effectDeclarations = getTailwindEffectDeclarations(utility);
  if (effectDeclarations.length > 0) return effectDeclarations;

  return [];
}

function getTailwindStaticDeclarations(utility: string): string[] {
  const arbitraryPropertyDeclarations = getTailwindArbitraryPropertyDeclarations(utility);
  if (arbitraryPropertyDeclarations.length > 0) return arbitraryPropertyDeclarations;

  const blendModeDeclarations = getTailwindBlendModeDeclarations(utility);
  if (blendModeDeclarations.length > 0) return blendModeDeclarations;

  switch (utility) {
    case 'block': return ['display: block'];
    case 'inline': return ['display: inline'];
    case 'inline-block': return ['display: inline-block'];
    case 'flex': return ['display: flex'];
    case 'inline-flex': return ['display: inline-flex'];
    case 'inline-grid': return ['display: inline-grid'];
    case 'grid': return ['display: grid'];
    case 'flow-root': return ['display: flow-root'];
    case 'hidden': return ['display: none'];
    case 'contents': return ['display: contents'];
    case 'table': return ['display: table'];
    case 'inline-table': return ['display: inline-table'];
    case 'table-row': return ['display: table-row'];
    case 'table-cell': return ['display: table-cell'];
    case 'visible': return ['visibility: visible'];
    case 'invisible': return ['visibility: hidden'];
    case 'collapse': return ['visibility: collapse'];
    case 'relative': return ['position: relative'];
    case 'absolute': return ['position: absolute'];
    case 'fixed': return ['position: fixed'];
    case 'sticky': return ['position: sticky'];
    case 'static': return ['position: static'];
    case 'isolate': return ['isolation: isolate'];
    case 'isolation-auto': return ['isolation: auto'];
    case 'overflow-hidden': return ['overflow: hidden'];
    case 'overflow-auto': return ['overflow: auto'];
    case 'overflow-visible': return ['overflow: visible'];
    case 'overflow-scroll': return ['overflow: scroll'];
    case 'overflow-clip': return ['overflow: clip'];
    case 'overflow-x-auto': return ['overflow-x: auto'];
    case 'overflow-x-hidden': return ['overflow-x: hidden'];
    case 'overflow-x-scroll': return ['overflow-x: scroll'];
    case 'overflow-x-clip': return ['overflow-x: clip'];
    case 'overflow-y-auto': return ['overflow-y: auto'];
    case 'overflow-y-hidden': return ['overflow-y: hidden'];
    case 'overflow-y-scroll': return ['overflow-y: scroll'];
    case 'overflow-y-clip': return ['overflow-y: clip'];
    case 'box-border': return ['box-sizing: border-box'];
    case 'box-content': return ['box-sizing: content-box'];
    case 'bg-clip-border': return ['background-clip: border-box'];
    case 'bg-clip-padding': return ['background-clip: padding-box'];
    case 'bg-clip-content': return ['background-clip: content-box'];
    case 'bg-clip-text': return ['background-clip: text'];
    case 'object-cover': return ['object-fit: cover'];
    case 'object-contain': return ['object-fit: contain'];
    case 'object-fill': return ['object-fit: fill'];
    case 'object-none': return ['object-fit: none'];
    case 'object-scale-down': return ['object-fit: scale-down'];
    case 'object-bottom': return ['object-position: bottom'];
    case 'object-center': return ['object-position: center'];
    case 'object-left': return ['object-position: left'];
    case 'object-left-bottom': return ['object-position: left bottom'];
    case 'object-left-top': return ['object-position: left top'];
    case 'object-right': return ['object-position: right'];
    case 'object-right-bottom': return ['object-position: right bottom'];
    case 'object-right-top': return ['object-position: right top'];
    case 'object-top': return ['object-position: top'];
    case 'flex-row': return ['flex-direction: row'];
    case 'flex-col': return ['flex-direction: column'];
    case 'flex-row-reverse': return ['flex-direction: row-reverse'];
    case 'flex-col-reverse': return ['flex-direction: column-reverse'];
    case 'flex-wrap': return ['flex-wrap: wrap'];
    case 'flex-nowrap': return ['flex-wrap: nowrap'];
    case 'items-start': return ['align-items: flex-start'];
    case 'items-center': return ['align-items: center'];
    case 'items-end': return ['align-items: flex-end'];
    case 'items-stretch': return ['align-items: stretch'];
    case 'items-baseline': return ['align-items: baseline'];
    case 'justify-start': return ['justify-content: flex-start'];
    case 'justify-center': return ['justify-content: center'];
    case 'justify-end': return ['justify-content: flex-end'];
    case 'justify-between': return ['justify-content: space-between'];
    case 'justify-around': return ['justify-content: space-around'];
    case 'justify-evenly': return ['justify-content: space-evenly'];
    case 'content-start': return ['align-content: flex-start'];
    case 'content-center': return ['align-content: center'];
    case 'content-end': return ['align-content: flex-end'];
    case 'content-between': return ['align-content: space-between'];
    case 'content-around': return ['align-content: space-around'];
    case 'content-evenly': return ['align-content: space-evenly'];
    case 'content-stretch': return ['align-content: stretch'];
    case 'place-content-start': return ['place-content: start'];
    case 'place-content-center': return ['place-content: center'];
    case 'place-content-end': return ['place-content: end'];
    case 'place-content-between': return ['place-content: space-between'];
    case 'place-items-start': return ['place-items: start'];
    case 'place-items-center': return ['place-items: center'];
    case 'place-items-end': return ['place-items: end'];
    case 'place-items-stretch': return ['place-items: stretch'];
    case 'self-auto': return ['align-self: auto'];
    case 'self-start': return ['align-self: flex-start'];
    case 'self-center': return ['align-self: center'];
    case 'self-end': return ['align-self: flex-end'];
    case 'self-baseline': return ['align-self: baseline'];
    case 'shrink': return ['flex-shrink: 1'];
    case 'shrink-0': return ['flex-shrink: 0'];
    case 'grow': return ['flex-grow: 1'];
    case 'grow-0': return ['flex-grow: 0'];
    case 'flex-1': return ['flex: 1 1 0%'];
    case 'flex-auto': return ['flex: 1 1 auto'];
    case 'flex-none': return ['flex: none'];
    case 'whitespace-normal': return ['white-space: normal'];
    case 'whitespace-nowrap': return ['white-space: nowrap'];
    case 'whitespace-pre': return ['white-space: pre'];
    case 'whitespace-pre-line': return ['white-space: pre-line'];
    case 'whitespace-pre-wrap': return ['white-space: pre-wrap'];
    case 'break-normal': return ['overflow-wrap: normal', 'word-break: normal'];
    case 'break-words': return ['overflow-wrap: break-word'];
    case 'break-all': return ['word-break: break-all'];
    case 'break-keep': return ['word-break: keep-all'];
    case 'truncate': return ['overflow: hidden', 'text-overflow: ellipsis', 'white-space: nowrap'];
    case 'text-left': return ['text-align: left'];
    case 'text-center': return ['text-align: center'];
    case 'text-right': return ['text-align: right'];
    case 'text-justify': return ['text-align: justify'];
    case 'text-start': return ['text-align: start'];
    case 'text-end': return ['text-align: end'];
    case 'text-balance': return ['text-wrap: balance'];
    case 'text-pretty': return ['text-wrap: pretty'];
    case 'align-middle': return ['vertical-align: middle'];
    case 'uppercase': return ['text-transform: uppercase'];
    case 'lowercase': return ['text-transform: lowercase'];
    case 'capitalize': return ['text-transform: capitalize'];
    case 'normal-case': return ['text-transform: none'];
    case 'italic': return ['font-style: italic'];
    case 'not-italic': return ['font-style: normal'];
    case 'underline': return ['text-decoration-line: underline'];
    case 'overline': return ['text-decoration-line: overline'];
    case 'line-through': return ['text-decoration-line: line-through'];
    case 'no-underline': return ['text-decoration-line: none'];
    case 'shadow-2xs': return getTailwindShadowDeclarations('var(--shadow-2xs, 0 1px rgb(0 0 0 / 0.05))');
    case 'shadow-xs': return getTailwindShadowDeclarations('var(--shadow-xs, 0 1px 2px 0 rgb(0 0 0 / 0.05))');
    case 'shadow-sm': return getTailwindShadowDeclarations('var(--shadow-sm, var(--ds-token-tailwind-primitives-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)))');
    case 'shadow': return getTailwindShadowDeclarations('var(--shadow, var(--ds-token-tailwind-primitives-shadow-DEFAULT, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)))');
    case 'shadow-md': return getTailwindShadowDeclarations('var(--shadow-md, var(--ds-token-tailwind-primitives-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)))');
    case 'shadow-lg': return getTailwindShadowDeclarations('var(--shadow-lg, var(--ds-token-tailwind-primitives-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)))');
    case 'shadow-xl': return getTailwindShadowDeclarations('var(--shadow-xl, var(--ds-token-tailwind-primitives-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)))');
    case 'shadow-2xl': return getTailwindShadowDeclarations('var(--shadow-2xl, var(--ds-token-tailwind-primitives-shadow-2xl, 0 25px 50px -12px rgb(0 0 0 / 0.25)))');
    case 'shadow-none': return getTailwindShadowDeclarations('var(--shadow-none, var(--ds-token-tailwind-primitives-shadow-none, 0 0 #0000))');
    case 'pointer-events-none': return ['pointer-events: none'];
    case 'pointer-events-auto': return ['pointer-events: auto'];
    case 'select-none': return ['user-select: none'];
    case 'cursor-pointer': return ['cursor: pointer'];
    case 'cursor-default': return ['cursor: default'];
    case 'cursor-not-allowed': return ['cursor: not-allowed'];
    case 'cursor-e-resize': return ['cursor: e-resize'];
    case 'cursor-w-resize': return ['cursor: w-resize'];
    case 'appearance-none': return ['appearance: none'];
    case 'touch-none': return ['touch-action: none'];
    case 'touch-manipulation': return ['touch-action: manipulation'];
    case 'field-sizing-content': return ['field-sizing: content'];
    case 'list-none': return ['list-style-type: none'];
    case 'list-disc': return ['list-style-type: disc'];
    case 'resize-none': return ['resize: none'];
    case 'order-first': return ['order: -9999'];
    case 'order-last': return ['order: 9999'];
    case 'transition': return ['transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter', `transition-duration: ${getTailwindDefaultDurationValue()}`, `transition-timing-function: ${getTailwindDefaultEasingValue()}`];
    case 'transition-all': return ['transition-property: all', `transition-duration: ${getTailwindDefaultDurationValue()}`, `transition-timing-function: ${getTailwindDefaultEasingValue()}`];
    case 'transition-colors': return ['transition-property: color, background-color, border-color, text-decoration-color, fill, stroke', `transition-duration: ${getTailwindDefaultDurationValue()}`, `transition-timing-function: ${getTailwindDefaultEasingValue()}`];
    case 'transition-transform': return ['transition-property: transform, translate, scale, rotate', `transition-duration: ${getTailwindDefaultDurationValue()}`, `transition-timing-function: ${getTailwindDefaultEasingValue()}`];
    case 'transition-opacity': return ['transition-property: opacity', `transition-duration: ${getTailwindDefaultDurationValue()}`, `transition-timing-function: ${getTailwindDefaultEasingValue()}`];
    case 'transition-none': return ['transition-property: none'];
    case 'ease-linear': return ['transition-timing-function: var(--ease-linear, var(--ds-token-tailwind-primitives-ease-linear, linear))'];
    case 'ease-in': return ['transition-timing-function: var(--ease-in, var(--ds-token-tailwind-primitives-ease-in, cubic-bezier(0.4, 0, 1, 1)))'];
    case 'ease-out': return ['transition-timing-function: var(--ease-out, var(--ds-token-tailwind-primitives-ease-out, cubic-bezier(0, 0, 0.2, 1)))'];
    case 'ease-in-out': return ['transition-timing-function: var(--ease-in-out, var(--ds-token-tailwind-primitives-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)))'];
    case 'outline-none':
    case 'outline-hidden': return ['outline: 2px solid transparent', 'outline-offset: 2px'];
    case 'animate-spin': return ['animation: spin 1s linear infinite'];
    case 'animate-pulse': return ['animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'];
    case 'animate-in': return ['animation-name: enter', 'animation-duration: var(--tw-duration, 150ms)', 'animation-fill-mode: both'];
    case 'animate-out': return ['animation-name: exit', 'animation-duration: var(--tw-duration, 150ms)', 'animation-fill-mode: both'];
    case 'animate-accordion-down': return ['animation: accordion-down 0.2s ease-out'];
    case 'animate-accordion-up': return ['animation: accordion-up 0.2s ease-out'];
    case 'animate-caret-blink': return ['animation: caret-blink 1.25s ease-out infinite'];
    case 'animate-none': return ['animation: none'];
    case 'caption-top': return ['caption-side: top'];
    case 'caption-bottom': return ['caption-side: bottom'];
    case 'tabular-nums': return ['font-variant-numeric: tabular-nums'];
    case 'grayscale': return ['filter: grayscale(100%)'];
    case 'wrap-break-word': return ['overflow-wrap: break-word'];
    case 'no-scrollbar': return ['scrollbar-width: none'];
    case 'group':
    case 'peer': return ['--wb-tailwind-marker: 1'];
    case 'sr-only': return ['position: absolute', 'width: 1px', 'height: 1px', 'padding: 0', 'margin: -1px', 'overflow: hidden', 'clip: rect(0, 0, 0, 0)', 'white-space: nowrap', 'border-width: 0'];
    default: break;
  }

  if (utility.startsWith('group/')) return ['--wb-tailwind-marker: 1'];
  if (utility.startsWith('peer/')) return ['--wb-tailwind-marker: 1'];
  if (utility.startsWith('flex-[')) {
    return [`flex: ${normalizeTailwindCssValue(unwrapTailwindArbitraryValue(utility.slice('flex-'.length)))}`];
  }
  if (utility.startsWith('flex-(') && utility.endsWith(')')) {
    const value = utility.slice('flex-('.length, -1).trim();
    if (value) return [`flex: var(${value})`];
  }
  if (utility === '@container') return ['container-type: inline-size'];
  if (utility.startsWith('@container/')) return [`container: ${escapeCssIdentifier(utility.slice('@container/'.length))} / inline-size`];
  if (utility === 'container') return ['width: 100%'];
  if (utility === 'aspect-auto') return ['aspect-ratio: auto'];
  if (utility === 'aspect-square') return ['aspect-ratio: 1 / 1'];
  if (utility === 'aspect-video') return ['aspect-ratio: 16 / 9'];
  if (utility.startsWith('aspect-(') && utility.endsWith(')')) {
    const value = utility.slice('aspect-('.length, -1).trim();
    if (value) return [`aspect-ratio: var(${value})`];
  }
  if (utility.startsWith('aspect-[')) return [`aspect-ratio: ${unwrapTailwindArbitraryValue(utility.slice('aspect-'.length))}`];
  if (/^opacity-\d+$/.test(utility)) return [`opacity: ${parseTailwindOpacity(utility.slice('opacity-'.length))}`];
  if (/^-?z-/.test(utility)) {
    const negative = utility.startsWith('-');
    const rawValue = utility.slice(negative ? 3 : 2);
    const zIndex = `var(--ds-token-tailwind-primitives-z-${rawValue}, ${parseTailwindLength(rawValue, { allowUnitless: true })})`;
    return [`z-index: ${negative ? `calc(${zIndex} * -1)` : zIndex}`];
  }
  if (/^-?order-/.test(utility)) {
    const negative = utility.startsWith('-');
    const rawValue = utility.slice(negative ? 7 : 6);
    return [`order: ${parseTailwindLength(`${negative ? '-' : ''}${rawValue}`, { allowUnitless: true })}`];
  }
  if (/^duration-/.test(utility)) return [`transition-duration: ${parseTailwindDuration(utility.slice('duration-'.length))}`];
  if (/^delay-/.test(utility)) return [`transition-delay: ${parseTailwindDuration(utility.slice('delay-'.length))}`];
  if (/^transition-\[/.test(utility)) return [`transition-property: ${unwrapTailwindArbitraryValue(utility.slice('transition-'.length))}`];
  if (/^ease-\[/.test(utility)) return [`transition-timing-function: ${unwrapTailwindArbitraryValue(utility.slice('ease-'.length))}`];
  if (/^easing-\[/.test(utility)) return [`transition-timing-function: ${unwrapTailwindArbitraryValue(utility.slice('easing-'.length))}`];
  if (/^cursor-/.test(utility)) return [`cursor: ${utility.slice('cursor-'.length)}`];
  if (/^underline-offset-/.test(utility)) return [`text-underline-offset: ${parseTailwindLength(utility.slice('underline-offset-'.length))}`];
  if (/^outline-\d+$/.test(utility)) return [`outline-width: ${utility.slice('outline-'.length)}px`];
  if (/^fade-in-\d+$/.test(utility)) return [`--tw-enter-opacity: ${Number(utility.slice('fade-in-'.length)) / 100}`];
  if (/^fade-out-\d+$/.test(utility)) return [`--tw-exit-opacity: ${Number(utility.slice('fade-out-'.length)) / 100}`];
  if (/^zoom-in-\d+$/.test(utility)) return [`--tw-enter-scale: ${Number(utility.slice('zoom-in-'.length)) / 100}`];
  if (/^zoom-out-\d+$/.test(utility)) return [`--tw-exit-scale: ${Number(utility.slice('zoom-out-'.length)) / 100}`];
  if (/^slide-in-from-/.test(utility)) return getTailwindSlideDeclarations('enter', utility.slice('slide-in-from-'.length));
  if (/^slide-out-to-/.test(utility)) return getTailwindSlideDeclarations('exit', utility.slice('slide-out-to-'.length));
  if (/^line-clamp-\d+$/.test(utility)) {
    return [
      'overflow: hidden',
      'display: -webkit-box',
      '-webkit-box-orient: vertical',
      `-webkit-line-clamp: ${utility.slice('line-clamp-'.length)}`,
    ];
  }
  if (utility.startsWith('line-clamp-[')) {
    return [
      'overflow: hidden',
      'display: -webkit-box',
      '-webkit-box-orient: vertical',
      `-webkit-line-clamp: ${unwrapTailwindArbitraryValue(utility.slice('line-clamp-'.length))}`,
    ];
  }
  if (utility.startsWith('columns-')) return [`columns: ${parseTailwindLength(utility.slice('columns-'.length), { allowUnitless: true })}`];
  if (/^origin-/.test(utility)) return [`transform-origin: ${parseTailwindTransformOrigin(utility.slice('origin-'.length))}`];

  return [];
}

function getTailwindBlendModeDeclarations(utility: string): string[] {
  if (utility.startsWith('mix-blend-')) {
    const value = utility.slice('mix-blend-'.length);
    return TAILWIND_BLEND_MODE_VALUES.has(value) ? [`mix-blend-mode: ${value}`] : [];
  }

  if (utility.startsWith('bg-blend-')) {
    const value = utility.slice('bg-blend-'.length);
    return TAILWIND_BLEND_MODE_VALUES.has(value) ? [`background-blend-mode: ${value}`] : [];
  }

  return [];
}

function getTailwindArbitraryValueDeclarations(utility: string): string[] {
  const parsed = splitTailwindArbitraryUtility(utility);
  if (!parsed) return [];
  const { negative, prefix, rawValue } = parsed;
  const arbitrary = parseTailwindArbitraryValue(rawValue);
  if (!arbitrary) return [];
  const signedRawValue = `${negative ? '-' : ''}${rawValue}`;
  const signedLength = parseTailwindLength(signedRawValue);

  if (prefix === 'text') {
    return isTailwindArbitraryColorValue(arbitrary)
      ? [`color: ${parseTailwindColor(rawValue)}`]
      : [`font-size: ${arbitrary.cssValue}`];
  }

  if (prefix === 'font') return getTailwindArbitraryFontDeclarations(arbitrary);
  if (prefix === 'leading') return [`line-height: ${arbitrary.cssValue}`];
  if (prefix === 'tracking') return [`letter-spacing: ${arbitrary.cssValue}`];
  if (prefix === 'object') return [`object-position: ${arbitrary.cssValue}`];

  if (prefix === 'bg') return [`background: ${arbitrary.cssValue}`];
  if (prefix === 'fill') return [`fill: ${parseTailwindColor(rawValue)}`];
  if (prefix === 'shadow') return getTailwindShadowDeclarations(arbitrary.cssValue);
  if (prefix === 'stroke') {
    return isTailwindArbitraryLengthValue(arbitrary) || isTailwindArbitraryNumberValue(arbitrary)
      ? [`stroke-width: ${arbitrary.cssValue}`]
      : [`stroke: ${parseTailwindColor(rawValue)}`];
  }

  if (prefix === 'opacity') return [`opacity: ${parseTailwindOpacity(rawValue)}`];

  if (prefix === 'outline') {
    return isTailwindArbitraryLengthValue(arbitrary) || isTailwindArbitraryNumberValue(arbitrary)
      ? [`outline-width: ${signedLength}`]
      : [`outline-color: ${parseTailwindColor(rawValue)}`];
  }

  if (prefix === 'ring') {
    if (isTailwindArbitraryLengthValue(arbitrary) || isTailwindArbitraryNumberValue(arbitrary)) {
      return [
        `--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(${signedLength} + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, currentColor)`,
        'box-shadow: var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)',
      ];
    }
    return [`--tw-ring-color: ${parseTailwindColor(rawValue)}`];
  }

  if (prefix === 'ring-offset') {
    return isTailwindArbitraryLengthValue(arbitrary) || isTailwindArbitraryNumberValue(arbitrary)
      ? [`--tw-ring-offset-width: ${signedLength}`]
      : [`--tw-ring-offset-color: ${parseTailwindColor(rawValue)}`];
  }

  if (prefix === 'border' || /^border-[trblxy]$/.test(prefix)) {
    if (isTailwindArbitraryColorValue(arbitrary)) {
      return getBorderColorProperties(prefix).map((property) => `${property}: ${parseTailwindColor(rawValue)}`);
    }
    return [
      ...getBorderStyleProperties(prefix).map((property) => `${property}: solid`),
      ...getBorderWidthProperties(prefix).map((property) => `${property}: ${signedLength}`),
    ];
  }

  if (prefix === 'rounded' || /^rounded-(?:t|r|b|l|tl|tr|br|bl)$/.test(prefix)) {
    return getTailwindArbitraryRadiusDeclarations(prefix, signedLength);
  }

  if (getSpacingProperties(prefix).length > 0) {
    return getSpacingProperties(prefix).map((property) => `${property}: ${signedLength}`);
  }

  if (prefix === 'space-x' || prefix === 'space-y') {
    const axis = prefix.slice('space-'.length);
    if (axis === 'x') {
      return [
        '--tw-space-x-reverse: 0',
        `margin-right: calc(${signedLength} * calc(1 - var(--tw-space-x-reverse, 0)))`,
        `margin-left: calc(${signedLength} * var(--tw-space-x-reverse, 0))`,
      ];
    }
    return [
      '--tw-space-y-reverse: 0',
      `margin-top: calc(${signedLength} * var(--tw-space-y-reverse, 0))`,
      `margin-bottom: calc(${signedLength} * calc(1 - var(--tw-space-y-reverse, 0)))`,
    ];
  }

  if (/^(?:w|h|min-w|min-h|max-w|max-h|size)$/.test(prefix)) {
    if (prefix === 'size') return [`width: ${signedLength}`, `height: ${signedLength}`];
    return [`${getSizingProperty(prefix)}: ${signedLength}`];
  }

  if (prefix === 'basis') return [`flex-basis: ${signedLength}`];
  if (prefix === 'flex') return [`flex: ${arbitrary.cssValue}`];
  if (prefix === 'aspect') return [`aspect-ratio: ${arbitrary.cssValue}`];
  if (prefix === 'columns') return [`columns: ${arbitrary.cssValue}`];
  if (prefix === 'line-clamp') {
    return [
      'overflow: hidden',
      'display: -webkit-box',
      '-webkit-box-orient: vertical',
      `-webkit-line-clamp: ${arbitrary.cssValue}`,
    ];
  }
  if (prefix === 'origin') return [`transform-origin: ${arbitrary.cssValue.replace(/-/g, ' ')}`];

  if (prefix === 'transition') return [`transition-property: ${arbitrary.cssValue}`];
  if (prefix === 'ease' || prefix === 'easing') return [`transition-timing-function: ${arbitrary.cssValue}`];
  if (prefix === 'duration') return [`transition-duration: ${arbitrary.cssValue}`];
  if (prefix === 'delay') return [`transition-delay: ${arbitrary.cssValue}`];

  if (prefix === 'grid-cols') return [`grid-template-columns: ${arbitrary.cssValue}`];
  if (prefix === 'grid-rows') return [`grid-template-rows: ${arbitrary.cssValue}`];
  if (prefix === 'col-start') return [`grid-column-start: ${arbitrary.cssValue}`];
  if (prefix === 'col-end') return [`grid-column-end: ${arbitrary.cssValue}`];
  if (prefix === 'row-start') return [`grid-row-start: ${arbitrary.cssValue}`];
  if (prefix === 'row-end') return [`grid-row-end: ${arbitrary.cssValue}`];
  if (prefix === 'col-span') return [`grid-column: span ${arbitrary.cssValue} / span ${arbitrary.cssValue}`];
  if (prefix === 'row-span') return [`grid-row: span ${arbitrary.cssValue} / span ${arbitrary.cssValue}`];

  return [];
}

function splitTailwindArbitraryUtility(utility: string): { negative: boolean; prefix: string; rawValue: string } | null {
  const negative = utility.startsWith('-');
  const normalized = negative ? utility.slice(1) : utility;
  const bracketStart = normalized.indexOf('-[');
  if (bracketStart <= 0 || !normalized.endsWith(']')) return null;
  return {
    negative,
    prefix: normalized.slice(0, bracketStart),
    rawValue: normalized.slice(bracketStart + 1),
  };
}

function getTailwindArbitraryFontDeclarations(arbitrary: TailwindArbitraryValue): string[] {
  if (
    TAILWIND_ARBITRARY_FONT_FAMILY_HINTS.has(arbitrary.hint ?? '') ||
    (!isTailwindArbitraryNumberValue(arbitrary) && !isTailwindArbitraryCssVariableLikelyFontWeight(arbitrary.cssValue))
  ) {
    return [`font-family: ${arbitrary.cssValue}`];
  }
  return [`font-weight: ${arbitrary.cssValue}`];
}

function getTailwindArbitraryRadiusDeclarations(prefix: string, value: string): string[] {
  switch (prefix) {
    case 'rounded-t':
      return [`border-top-left-radius: ${value}`, `border-top-right-radius: ${value}`];
    case 'rounded-r':
      return [`border-top-right-radius: ${value}`, `border-bottom-right-radius: ${value}`];
    case 'rounded-b':
      return [`border-bottom-right-radius: ${value}`, `border-bottom-left-radius: ${value}`];
    case 'rounded-l':
      return [`border-top-left-radius: ${value}`, `border-bottom-left-radius: ${value}`];
    case 'rounded-tl':
      return [`border-top-left-radius: ${value}`];
    case 'rounded-tr':
      return [`border-top-right-radius: ${value}`];
    case 'rounded-br':
      return [`border-bottom-right-radius: ${value}`];
    case 'rounded-bl':
      return [`border-bottom-left-radius: ${value}`];
    default:
      return [`border-radius: ${value}`];
  }
}

function getTailwindSpacingDeclarations(utility: string): string[] {
  const match = new RegExp(`^(-)?(${TAILWIND_SPACING_PREFIX_PATTERN})-(.+)$`).exec(utility);
  if (!match) return [];
  const [, negative, prefix, rawValue] = match;
  const value = parseTailwindLength(`${negative ? '-' : ''}${rawValue}`);
  const declarations: string[] = [];
  const properties = getSpacingProperties(prefix);
  for (const property of properties) declarations.push(`${property}: ${value}`);
  return declarations;
}

function getTailwindSpaceDeclarations(utility: string): string[] {
  const match = /^(-)?space-([xy])-(.+)$/.exec(utility);
  if (!match) return [];
  const [, negative, axis, rawValue] = match;
  const value = parseTailwindLength(`${negative ? '-' : ''}${rawValue}`);
  if (axis === 'x') {
    return [
      '--tw-space-x-reverse: 0',
      `margin-right: calc(${value} * calc(1 - var(--tw-space-x-reverse, 0)))`,
      `margin-left: calc(${value} * var(--tw-space-x-reverse, 0))`,
    ];
  }
  return [
    '--tw-space-y-reverse: 0',
    `margin-top: calc(${value} * var(--tw-space-y-reverse, 0))`,
    `margin-bottom: calc(${value} * calc(1 - var(--tw-space-y-reverse, 0)))`,
  ];
}

function getTailwindSizingDeclarations(utility: string): string[] {
  const sizeMatch = /^(w|h|min-w|min-h|max-w|max-h|size)-(.+)$/.exec(utility);
  if (sizeMatch) {
    const [, prefix, rawValue] = sizeMatch;
    const value = parseTailwindLength(rawValue, {
      axis: prefix.includes('h') ? 'height' : 'width',
      container: prefix === 'w' || prefix === 'min-w' || prefix === 'max-w',
    });
    if (prefix === 'size') return [`width: ${value}`, `height: ${value}`];
    return [`${getSizingProperty(prefix)}: ${value}`];
  }

  const basisMatch = /^basis-(.+)$/.exec(utility);
  if (basisMatch) return [`flex-basis: ${parseTailwindLength(basisMatch[1])}`];
  return [];
}

function getTailwindTransformDeclarations(utility: string): string[] {
  if (utility === 'transform') return ['transform: var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, )'];
  if (utility === 'transform-none') return ['transform: none'];
  const translateMatch = /^(-)?translate-([xy])-(.+)$/.exec(utility);
  if (translateMatch) {
    const [, negative, axis, rawValue] = translateMatch;
    const value = parseTailwindLength(`${negative ? '-' : ''}${rawValue}`);
    const property = axis === 'x' ? '--tw-translate-x' : '--tw-translate-y';
    return [
      `${property}: ${value}`,
      'translate: var(--tw-translate-x, 0) var(--tw-translate-y, 0)',
    ];
  }
  const translateMatch3d = /^(-)?translate-z-(.+)$/.exec(utility);
  if (translateMatch3d) {
    const [, negative, rawValue] = translateMatch3d;
    return [
      `--tw-translate-z: ${parseTailwindLength(`${negative ? '-' : ''}${rawValue}`)}`,
      'translate: var(--tw-translate-x, 0) var(--tw-translate-y, 0) var(--tw-translate-z, 0)',
    ];
  }

  const axisScaleMatch = /^scale-([xy])-(.+)$/.exec(utility);
  if (axisScaleMatch) {
    const [, axis, rawValue] = axisScaleMatch;
    const value = parseTailwindScale(rawValue);
    return [axis === 'x' ? `scale: ${value} 1` : `scale: 1 ${value}`];
  }
  const scaleMatch = /^scale-(.+)$/.exec(utility);
  if (scaleMatch) {
    const value = parseTailwindScale(scaleMatch[1]);
    return [`scale: ${value}`];
  }

  const rotateMatch = /^(-)?rotate-(.+)$/.exec(utility);
  if (rotateMatch) {
    const [, negative, rawValue] = rotateMatch;
    return [`rotate: ${negative ? '-' : ''}${parseTailwindAngle(rawValue)}`];
  }
  const skewMatch = /^(-)?skew-([xy])-(.+)$/.exec(utility);
  if (skewMatch) {
    const [, negative, axis, rawValue] = skewMatch;
    return [`transform: skew${axis.toUpperCase()}(${negative ? '-' : ''}${parseTailwindAngle(rawValue)})`];
  }

  return [];
}

function getTailwindEffectDeclarations(utility: string): string[] {
  if (utility === 'blur-none') return ['filter: blur(0)'];
  const blurMatch = /^blur-(.+)$/.exec(utility);
  if (blurMatch) return [`filter: blur(${parseTailwindBlur(blurMatch[1])})`];
  const brightnessMatch = /^brightness-(.+)$/.exec(utility);
  if (brightnessMatch) return [`filter: brightness(${parseTailwindScale(brightnessMatch[1])})`];
  const contrastMatch = /^contrast-(.+)$/.exec(utility);
  if (contrastMatch) return [`filter: contrast(${parseTailwindScale(contrastMatch[1])})`];
  const saturateMatch = /^saturate-(.+)$/.exec(utility);
  if (saturateMatch) return [`filter: saturate(${parseTailwindScale(saturateMatch[1])})`];
  const opacityMatch = /^opacity-(.+)$/.exec(utility);
  if (opacityMatch) return [`opacity: ${parseTailwindOpacity(opacityMatch[1])}`];
  const backdropBlurMatch = /^backdrop-blur-(.+)$/.exec(utility);
  if (backdropBlurMatch) {
    const value = parseTailwindBlur(backdropBlurMatch[1]);
    return [
      `--tw-backdrop-blur: blur(${value})`,
      'backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)',
    ];
  }
  const backdropSaturateMatch = /^backdrop-saturate-(.+)$/.exec(utility);
  if (backdropSaturateMatch) {
    return [
      `--tw-backdrop-saturate: saturate(${parseTailwindScale(backdropSaturateMatch[1])})`,
      'backdrop-filter: var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)',
    ];
  }
  return [];
}

function getTailwindColorDeclarations(utility: string): string[] {
  const gradientDirection = getTailwindGradientDirection(utility);
  if (gradientDirection) {
    return [
      `--tw-gradient-position: ${gradientDirection}`,
      'background-image: linear-gradient(var(--tw-gradient-stops))',
    ];
  }
  if (utility.startsWith('from-')) {
    return [
      `--tw-gradient-from: ${parseTailwindColor(utility.slice(5))}`,
      '--tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))',
    ];
  }
  if (utility.startsWith('via-')) {
    return [
      `--tw-gradient-via: ${parseTailwindColor(utility.slice(4))}`,
      '--tw-gradient-via-stops: var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-via) var(--tw-gradient-via-position), var(--tw-gradient-to) var(--tw-gradient-to-position)',
      '--tw-gradient-stops: var(--tw-gradient-via-stops)',
    ];
  }
  if (utility.startsWith('to-')) {
    return [`--tw-gradient-to: ${parseTailwindColor(utility.slice(3))}`];
  }
  if (utility.startsWith('bg-')) {
    const value = utility.slice(3);
    if (value.startsWith('[')) return [`background: ${unwrapTailwindArbitraryValue(value)}`];
    return [`background-color: ${parseTailwindColor(value)}`];
  }
  if (utility.startsWith('text-') && !TAILWIND_TEXT_SIZE_VALUES[utility.slice(5)]) {
    return [`color: ${parseTailwindColor(utility.slice(5))}`];
  }
  if (utility.startsWith('placeholder-')) {
    return [`color: ${parseTailwindColor(utility.slice('placeholder-'.length))}`];
  }
  if (utility.startsWith('caret-')) {
    return [`caret-color: ${parseTailwindColor(utility.slice('caret-'.length))}`];
  }
  if (utility.startsWith('accent-')) {
    return [`accent-color: ${parseTailwindColor(utility.slice('accent-'.length))}`];
  }
  if (utility.startsWith('fill-')) {
    return [`fill: ${parseTailwindColor(utility.slice(5))}`];
  }
  if (utility.startsWith('stroke-')) {
    const value = utility.slice(7);
    if (isTailwindStrokeWidthValue(value)) return [`stroke-width: ${value}`];
    return [`stroke: ${parseTailwindColor(value)}`];
  }
  if (utility.startsWith('ring-offset-')) {
    const value = utility.slice('ring-offset-'.length);
    if (/^\d+$/.test(value)) return [`--tw-ring-offset-width: ${value}px`];
    return [`--tw-ring-offset-color: ${parseTailwindColor(value)}`];
  }
  if (utility.startsWith('ring-')) {
    const value = utility.slice(5);
    if (value === 'inset') return ['--tw-ring-inset: inset'];
    if (/^\d+$/.test(value) || value.startsWith('[')) {
      const ringWidth = value.startsWith('[') ? unwrapTailwindArbitraryValue(value) : `${value}px`;
      return [
        `--tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(${ringWidth} + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color, currentColor)`,
        'box-shadow: var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)',
      ];
    }
    return [`--tw-ring-color: ${parseTailwindColor(value)}`];
  }
  if (utility.startsWith('outline-') && !/^outline-\d+$/.test(utility)) {
    return [`outline-color: ${parseTailwindColor(utility.slice('outline-'.length))}`];
  }
  if (utility.startsWith('decoration-')) {
    return [`text-decoration-color: ${parseTailwindColor(utility.slice('decoration-'.length))}`];
  }
  return [];
}

function getTailwindGradientDirection(utility: string): string | null {
  const prefix = utility.startsWith('bg-gradient-to-')
    ? 'bg-gradient-to-'
    : utility.startsWith('bg-linear-to-')
      ? 'bg-linear-to-'
      : null;
  if (!prefix) return null;
  const direction = utility.slice(prefix.length);
  const map: Record<string, string> = {
    t: 'to top',
    tr: 'to top right',
    r: 'to right',
    br: 'to bottom right',
    b: 'to bottom',
    bl: 'to bottom left',
    l: 'to left',
    tl: 'to top left',
  };
  return map[direction] ?? null;
}

function getTailwindTypographyDeclarations(utility: string): string[] {
  if (utility.startsWith('text-')) {
    const value = utility.slice(5);
    const [sizeValue, lineHeightValue] = value.split('/');
    const size = TAILWIND_TEXT_SIZE_VALUES[sizeValue];
    if (size && lineHeightValue) {
      return [
        `font-size: ${size[0]}`,
        `line-height: ${TAILWIND_LINE_HEIGHT_VALUES[lineHeightValue] ?? parseTailwindLength(lineHeightValue)}`,
      ];
    }
    if (size) return [`font-size: ${size[0]}`, `line-height: ${size[1]}`];
    if (value.startsWith('[')) {
      if (isLikelyTailwindArbitraryColorValue(value)) return [];
      return [`font-size: ${normalizeTailwindCssValue(stripTailwindArbitraryTypeHint(unwrapTailwindArbitraryValue(value)))}`];
    }
  }
  if (utility.startsWith('font-')) {
    const value = utility.slice(5);
    const weight = TAILWIND_FONT_WEIGHT_VALUES[value];
    if (weight) return [`font-weight: ${weight}`];
    if (value.startsWith('[')) return [`font-weight: ${normalizeTailwindCssValue(stripTailwindArbitraryTypeHint(unwrapTailwindArbitraryValue(value)))}`];
    if (value.startsWith('(number:') && value.endsWith(')')) return [`font-weight: var(${value.slice('(number:'.length, -1)})`];
    if (value === 'heading') return ['font-family: var(--font-heading, var(--wb-font-heading, inherit))'];
    if (value === 'sans') return ['font-family: var(--font-sans, var(--wb-font-sans, ui-sans-serif, system-ui, sans-serif))'];
    if (value === 'mono') return ['font-family: var(--font-mono, var(--wb-font-mono, ui-monospace, SFMono-Regular, monospace))'];
  }
  if (utility.startsWith('leading-')) {
    const value = utility.slice(8);
    return [`line-height: ${TAILWIND_LINE_HEIGHT_VALUES[value] ?? parseTailwindLength(value)}`];
  }
  if (utility.startsWith('tracking-')) {
    const value = utility.slice(9);
    if (TAILWIND_LETTER_SPACING_VALUES[value]) return [`letter-spacing: ${TAILWIND_LETTER_SPACING_VALUES[value]}`];
  }
  return [];
}

function getTailwindBorderDeclarations(utility: string): string[] {
  if (utility === 'border') return ['border-style: solid', 'border-width: 1px'];
  if (utility === 'border-solid') return ['border-style: solid'];
  if (utility === 'border-dashed') return ['border-style: dashed'];
  if (utility === 'border-dotted') return ['border-style: dotted'];
  if (utility === 'border-double') return ['border-style: double'];
  if (utility === 'border-hidden') return ['border-style: hidden'];
  if (utility === 'border-none') return ['border-style: none'];

  if (utility.startsWith('border-')) {
    const sideMatch = /^border-([trblxy])(?:-(.+))?$/.exec(utility);
    if (sideMatch) {
      const [, side, value] = sideMatch;
      return getTailwindBorderValueDeclarations(`border-${side}`, value ?? 'DEFAULT');
    }
    return getTailwindBorderValueDeclarations('border', utility.slice(7));
  }

  if (utility === 'rounded') return [`border-radius: ${TAILWIND_RADIUS_VALUES.lg}`];
  if (utility === 'rounded-t') return [`border-top-left-radius: ${TAILWIND_RADIUS_VALUES.lg}`, `border-top-right-radius: ${TAILWIND_RADIUS_VALUES.lg}`];
  if (utility === 'rounded-b') return [`border-bottom-left-radius: ${TAILWIND_RADIUS_VALUES.lg}`, `border-bottom-right-radius: ${TAILWIND_RADIUS_VALUES.lg}`];
  if (utility === 'rounded-l') return [`border-top-left-radius: ${TAILWIND_RADIUS_VALUES.lg}`, `border-bottom-left-radius: ${TAILWIND_RADIUS_VALUES.lg}`];
  if (utility === 'rounded-r') return [`border-top-right-radius: ${TAILWIND_RADIUS_VALUES.lg}`, `border-bottom-right-radius: ${TAILWIND_RADIUS_VALUES.lg}`];
  if (utility.startsWith('rounded-')) {
    const value = utility.slice(8);
    const radius = TAILWIND_RADIUS_VALUES[value] ?? parseTailwindLength(value);
    if (value.startsWith('t-')) return [`border-top-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`, `border-top-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`];
    if (value.startsWith('b-')) return [`border-bottom-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`, `border-bottom-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`];
    if (value.startsWith('l-')) return [`border-top-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`, `border-bottom-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`];
    if (value.startsWith('r-')) return [`border-top-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`, `border-bottom-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(2)] ?? parseTailwindLength(value.slice(2))}`];
    if (value.startsWith('tl-')) return [`border-top-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(3)] ?? parseTailwindLength(value.slice(3))}`];
    if (value.startsWith('tr-')) return [`border-top-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(3)] ?? parseTailwindLength(value.slice(3))}`];
    if (value.startsWith('br-')) return [`border-bottom-right-radius: ${TAILWIND_RADIUS_VALUES[value.slice(3)] ?? parseTailwindLength(value.slice(3))}`];
    if (value.startsWith('bl-')) return [`border-bottom-left-radius: ${TAILWIND_RADIUS_VALUES[value.slice(3)] ?? parseTailwindLength(value.slice(3))}`];
    return [`border-radius: ${radius}`];
  }
  return [];
}

function getTailwindBorderValueDeclarations(prefix: string, value: string): string[] {
  const styleValue = getTailwindBorderStyleValue(value);
  if (styleValue) {
    return getBorderStyleProperties(prefix).map((property) => `${property}: ${styleValue}`);
  }

  const widthValue = getTailwindBorderWidthValue(value);
  if (widthValue) {
    return [
      ...getBorderStyleProperties(prefix).map((property) => `${property}: solid`),
      ...getBorderWidthProperties(prefix).map((property) => `${property}: ${widthValue}`),
    ];
  }

  return getBorderColorProperties(prefix).map((property) => `${property}: ${parseTailwindColor(value)}`);
}

function getTailwindDivideDeclarations(utility: string): string[] {
  const match = /^divide-([xy])(?:-(.+))?$/.exec(utility);
  if (!match) return [];
  const [, axis, rawValue = '1'] = match;
  if (rawValue === 'solid' || rawValue === 'dashed' || rawValue === 'dotted' || rawValue === 'none') {
    return [`border-style: ${rawValue === 'none' ? 'none' : rawValue}`];
  }
  const value = getTailwindDivideWidthValue(rawValue);
  return axis === 'x'
    ? ['--tw-divide-x-reverse: 0', 'border-right-style: solid', 'border-left-style: solid', `border-right-width: calc(${value} * calc(1 - var(--tw-divide-x-reverse, 0)))`, `border-left-width: calc(${value} * var(--tw-divide-x-reverse, 0))`]
    : ['--tw-divide-y-reverse: 0', 'border-top-style: solid', 'border-bottom-style: solid', `border-top-width: calc(${value} * var(--tw-divide-y-reverse, 0))`, `border-bottom-width: calc(${value} * calc(1 - var(--tw-divide-y-reverse, 0)))`];
}

function getTailwindDivideColorDeclarations(utility: string): string[] {
  if (!utility.startsWith('divide-')) return [];
  const value = utility.slice('divide-'.length);
  if (!value || value === 'x' || value === 'y') return [];
  if (['solid', 'dashed', 'dotted', 'none'].includes(value)) return [];
  if (/^[xy]-(?:0|1|2|4|8|px)$/.test(value)) return [];
  if (/^(?:0|1|2|4|8|px)$/.test(value)) return [];
  return [`border-color: ${parseTailwindColor(value)}`];
}

function getTailwindRuntimeUtilitySelectorSuffix(utility: string): string | null {
  if (utility.startsWith('placeholder-')) return '::placeholder';
  return null;
}

function getTailwindGridDeclarations(utility: string): string[] {
  if (/^grid-cols-\d+$/.test(utility)) {
    const count = Number(utility.slice('grid-cols-'.length));
    return [`grid-template-columns: repeat(${count}, minmax(0, 1fr))`];
  }
  if (utility.startsWith('grid-cols-[')) {
    return [`grid-template-columns: ${unwrapTailwindArbitraryValue(utility.slice('grid-cols-'.length))}`];
  }
  if (/^grid-rows-\d+$/.test(utility)) {
    const count = Number(utility.slice('grid-rows-'.length));
    return [`grid-template-rows: repeat(${count}, minmax(0, 1fr))`];
  }
  if (utility.startsWith('grid-rows-[')) {
    return [`grid-template-rows: ${unwrapTailwindArbitraryValue(utility.slice('grid-rows-'.length))}`];
  }
  if (/^col-span-\d+$/.test(utility)) {
    const count = Number(utility.slice('col-span-'.length));
    return [`grid-column: span ${count} / span ${count}`];
  }
  if (utility.startsWith('col-span-[')) {
    const value = unwrapTailwindArbitraryValue(utility.slice('col-span-'.length));
    return [`grid-column: span ${value} / span ${value}`];
  }
  if (/^row-span-\d+$/.test(utility)) {
    const count = Number(utility.slice('row-span-'.length));
    return [`grid-row: span ${count} / span ${count}`];
  }
  if (utility.startsWith('row-span-[')) {
    const value = unwrapTailwindArbitraryValue(utility.slice('row-span-'.length));
    return [`grid-row: span ${value} / span ${value}`];
  }
  if (/^col-start-\d+$/.test(utility)) {
    return [`grid-column-start: ${utility.slice('col-start-'.length)}`];
  }
  if (utility.startsWith('col-start-[')) {
    return [`grid-column-start: ${unwrapTailwindArbitraryValue(utility.slice('col-start-'.length))}`];
  }
  if (/^col-end-\d+$/.test(utility)) {
    return [`grid-column-end: ${utility.slice('col-end-'.length)}`];
  }
  if (utility.startsWith('col-end-[')) {
    return [`grid-column-end: ${unwrapTailwindArbitraryValue(utility.slice('col-end-'.length))}`];
  }
  if (/^row-start-\d+$/.test(utility)) {
    return [`grid-row-start: ${utility.slice('row-start-'.length)}`];
  }
  if (utility.startsWith('row-start-[')) {
    return [`grid-row-start: ${unwrapTailwindArbitraryValue(utility.slice('row-start-'.length))}`];
  }
  if (/^row-end-\d+$/.test(utility)) {
    return [`grid-row-end: ${utility.slice('row-end-'.length)}`];
  }
  if (utility.startsWith('row-end-[')) {
    return [`grid-row-end: ${unwrapTailwindArbitraryValue(utility.slice('row-end-'.length))}`];
  }
  if (utility === 'col-auto') return ['grid-column: auto'];
  if (utility === 'row-auto') return ['grid-row: auto'];
  if (utility === 'auto-rows-min') return ['grid-auto-rows: min-content'];
  if (utility === 'auto-rows-max') return ['grid-auto-rows: max-content'];
  if (utility === 'auto-rows-auto') return ['grid-auto-rows: auto'];
  if (utility === 'auto-rows-fr') return ['grid-auto-rows: minmax(0, 1fr)'];
  if (utility === 'auto-cols-min') return ['grid-auto-columns: min-content'];
  if (utility === 'auto-cols-max') return ['grid-auto-columns: max-content'];
  if (utility === 'auto-cols-auto') return ['grid-auto-columns: auto'];
  if (utility === 'justify-self-start') return ['justify-self: start'];
  if (utility === 'justify-self-center') return ['justify-self: center'];
  if (utility === 'justify-self-end') return ['justify-self: end'];
  if (utility === 'justify-self-stretch') return ['justify-self: stretch'];
  if (utility === 'self-stretch') return ['align-self: stretch'];
  return [];
}

function getSpacingProperties(prefix: string): string[] {
  switch (prefix) {
    case 'm': return ['margin'];
    case 'mx': return ['margin-left', 'margin-right'];
    case 'my': return ['margin-top', 'margin-bottom'];
    case 'mt': return ['margin-top'];
    case 'mr': return ['margin-right'];
    case 'mb': return ['margin-bottom'];
    case 'ml': return ['margin-left'];
    case 'p': return ['padding'];
    case 'px': return ['padding-left', 'padding-right'];
    case 'py': return ['padding-top', 'padding-bottom'];
    case 'pt': return ['padding-top'];
    case 'pr': return ['padding-right'];
    case 'pb': return ['padding-bottom'];
    case 'pl': return ['padding-left'];
    case 'gap': return ['gap'];
    case 'gap-x': return ['column-gap'];
    case 'gap-y': return ['row-gap'];
    case 'inset': return ['inset'];
    case 'inset-x': return ['left', 'right'];
    case 'inset-y': return ['top', 'bottom'];
    case 'top': return ['top'];
    case 'right': return ['right'];
    case 'bottom': return ['bottom'];
    case 'left': return ['left'];
    case 'start': return ['inset-inline-start'];
    case 'end': return ['inset-inline-end'];
    case 'scroll-m': return ['scroll-margin'];
    case 'scroll-mx': return ['scroll-margin-inline'];
    case 'scroll-my': return ['scroll-margin-block'];
    case 'scroll-p': return ['scroll-padding'];
    case 'scroll-px': return ['scroll-padding-inline'];
    case 'scroll-py': return ['scroll-padding-block'];
    default: return [];
  }
}

function getSizingProperty(prefix: string): string {
  switch (prefix) {
    case 'w': return 'width';
    case 'h': return 'height';
    case 'min-w': return 'min-width';
    case 'min-h': return 'min-height';
    case 'max-w': return 'max-width';
    case 'max-h': return 'max-height';
    default: return prefix;
  }
}

function getBorderWidthProperties(prefix: string): string[] {
  switch (prefix) {
    case 'border-t': return ['border-top-width'];
    case 'border-r': return ['border-right-width'];
    case 'border-b': return ['border-bottom-width'];
    case 'border-l': return ['border-left-width'];
    case 'border-x': return ['border-left-width', 'border-right-width'];
    case 'border-y': return ['border-top-width', 'border-bottom-width'];
    default: return ['border-width'];
  }
}

function getBorderColorProperties(prefix: string): string[] {
  switch (prefix) {
    case 'border-t': return ['border-top-color'];
    case 'border-r': return ['border-right-color'];
    case 'border-b': return ['border-bottom-color'];
    case 'border-l': return ['border-left-color'];
    case 'border-x': return ['border-left-color', 'border-right-color'];
    case 'border-y': return ['border-top-color', 'border-bottom-color'];
    default: return ['border-color'];
  }
}

function getBorderStyleProperties(prefix: string): string[] {
  switch (prefix) {
    case 'border-t': return ['border-top-style'];
    case 'border-r': return ['border-right-style'];
    case 'border-b': return ['border-bottom-style'];
    case 'border-l': return ['border-left-style'];
    case 'border-x': return ['border-left-style', 'border-right-style'];
    case 'border-y': return ['border-top-style', 'border-bottom-style'];
    default: return ['border-style'];
  }
}

function getTailwindBorderStyleValue(value: string): string | null {
  switch (value) {
    case 'solid':
    case 'dashed':
    case 'dotted':
    case 'double':
    case 'hidden':
      return value;
    case 'none':
      return 'none';
    default:
      return null;
  }
}

function getTailwindBorderWidthValue(value: string): string | null {
  if (value === 'DEFAULT' || value === '1') return '1px';
  if (value === 'px') return 'var(--ds-token-tailwind-primitives-border-px, 1px)';
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return `${value}px`;
  }
  if (value.startsWith('[')) {
    if (isLikelyTailwindArbitraryColorValue(value)) return null;
    return normalizeTailwindCssValue(stripTailwindArbitraryTypeHint(unwrapTailwindArbitraryValue(value)));
  }
  if (value.startsWith('(length:') && value.endsWith(')')) return `var(${value.slice('(length:'.length, -1)})`;
  return null;
}

function getTailwindDivideWidthValue(value: string): string {
  return getTailwindBorderWidthValue(value === '1' ? 'DEFAULT' : value) ?? parseTailwindLength(value);
}

function isTailwindStrokeWidthValue(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value);
}

function parseTailwindArbitraryValue(rawValue: string): TailwindArbitraryValue | null {
  if (!rawValue.startsWith('[') || !rawValue.endsWith(']')) return null;
  const raw = unwrapTailwindArbitraryValue(rawValue).trim();
  if (!raw) return null;
  const separatorIndex = findTopLevelCharacter(raw, ':');
  const candidateHint = separatorIndex > 0 ? raw.slice(0, separatorIndex).trim().toLowerCase() : '';
  const hasHint = /^[a-z][a-z-]*$/i.test(candidateHint) && TAILWIND_ARBITRARY_VALUE_HINTS.has(candidateHint);
  const value = hasHint ? raw.slice(separatorIndex + 1).trim() : raw;
  if (!value) return null;
  return {
    cssValue: normalizeTailwindCssValue(value),
    hint: hasHint ? candidateHint : null,
    rawValue: raw,
  };
}

function stripTailwindArbitraryTypeHint(value: string): string {
  const arbitrary = parseTailwindArbitraryValue(`[${value}]`);
  return arbitrary?.cssValue ?? value;
}

function isTailwindArbitraryLengthValue(arbitrary: TailwindArbitraryValue): boolean {
  if (arbitrary.hint && TAILWIND_ARBITRARY_LENGTH_HINTS.has(arbitrary.hint)) return true;
  if (arbitrary.hint && (TAILWIND_ARBITRARY_NUMBER_HINTS.has(arbitrary.hint) || arbitrary.hint === 'color')) return false;
  if (isTailwindArbitraryCssVariableLikelyColor(arbitrary.cssValue)) return false;
  return /^(?:calc\(|clamp\(|min\(|max\(|anchor-size\(|var\(|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|svh|svw|lvh|lvw|dvh|dvw|ch|ex|lh|rlh|vmin|vmax|cm|mm|in|pt|pc|q)\b)/i.test(arbitrary.cssValue);
}

function isTailwindArbitraryNumberValue(arbitrary: TailwindArbitraryValue): boolean {
  if (arbitrary.hint && TAILWIND_ARBITRARY_NUMBER_HINTS.has(arbitrary.hint)) return true;
  if (arbitrary.hint && TAILWIND_ARBITRARY_LENGTH_HINTS.has(arbitrary.hint)) return false;
  if (isTailwindArbitraryCssVariableLikelyFontWeight(arbitrary.cssValue)) return true;
  return /^-?\d+(?:\.\d+)?$/.test(arbitrary.cssValue);
}

function isTailwindArbitraryColorValue(arbitrary: TailwindArbitraryValue): boolean {
  if (arbitrary.hint === 'color') return true;
  if (arbitrary.hint && (
    TAILWIND_ARBITRARY_LENGTH_HINTS.has(arbitrary.hint) ||
    TAILWIND_ARBITRARY_NUMBER_HINTS.has(arbitrary.hint) ||
    arbitrary.hint === 'angle' ||
    arbitrary.hint === 'ratio'
  )) {
    return false;
  }
  if (isTailwindArbitraryCssVariableLikelyNonColor(arbitrary.cssValue)) return false;
  if (isTailwindArbitraryCssVariableLikelyColor(arbitrary.cssValue)) return true;
  return /^(?:#|currentColor$|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lab\(|lch\(|color\(|color-mix\()/i.test(arbitrary.cssValue);
}

function isTailwindArbitraryCssVariableLikelyColor(value: string): boolean {
  const variableName = getTailwindArbitraryCssVariableName(value);
  return variableName ? TAILWIND_ARBITRARY_COLOR_VARIABLE_PATTERN.test(variableName) : false;
}

function isTailwindArbitraryCssVariableLikelyNonColor(value: string): boolean {
  const variableName = getTailwindArbitraryCssVariableName(value);
  return variableName ? TAILWIND_ARBITRARY_NON_COLOR_VARIABLE_PATTERN.test(variableName) : false;
}

function isTailwindArbitraryCssVariableLikelyFontWeight(value: string): boolean {
  const variableName = getTailwindArbitraryCssVariableName(value);
  return variableName ? /(?:font-weight|weight)/i.test(variableName) : false;
}

function getTailwindArbitraryCssVariableName(value: string): string | null {
  const match = /^var\(\s*(--[a-zA-Z0-9_-]+)/.exec(value.trim());
  return match?.[1] ?? null;
}

function isLikelyTailwindArbitraryColorValue(value: string): boolean {
  const arbitrary = parseTailwindArbitraryValue(value);
  if (arbitrary) return isTailwindArbitraryColorValue(arbitrary);
  return /^(?:#|currentColor$|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lab\(|lch\(|color\(|color-mix\()/i.test(value.trim());
}

function getTailwindArbitraryPropertyDeclarations(utility: string): string[] {
  if (!utility.startsWith('[') || !utility.endsWith(']')) return [];
  const declaration = unwrapTailwindArbitraryValue(utility);
  const separatorIndex = findTopLevelCharacter(declaration, ':');
  if (separatorIndex <= 0) return [];
  const property = declaration.slice(0, separatorIndex).trim();
  const value = declaration.slice(separatorIndex + 1).trim();
  if (!property || !value) return [];
  return [`${property}: ${normalizeTailwindCssValue(value)}`];
}

function findTopLevelCharacter(value: string, target: string): number {
  let bracketDepth = 0;
  let parenDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    if (char === target && bracketDepth === 0 && parenDepth === 0) return index;
  }
  return -1;
}

function parseTailwindLength(
  rawValue: string,
  options: { allowUnitless?: boolean; axis?: 'height' | 'width'; container?: boolean } = {},
): string {
  const negative = rawValue.startsWith('-');
  const value = negative ? rawValue.slice(1) : rawValue;
  const sign = negative ? '-' : '';

  if (value.startsWith('[')) return applyTailwindNegativeSign(normalizeTailwindCssValue(unwrapTailwindArbitraryValue(value)), negative);
  if (value.startsWith('(') && value.endsWith(')')) return applyTailwindNegativeSign(`var(${value.slice(1, -1)})`, negative);
  if (value === 'auto') return 'var(--ds-token-tailwind-primitives-size-auto, auto)';
  if (value === '0') return '0';
  if (value === 'px') return applyTailwindNegativeSign('var(--ds-token-tailwind-primitives-space-px, 1px)', negative);
  if (value === 'full') return applyTailwindNegativeSign('var(--ds-token-tailwind-primitives-size-full, 100%)', negative);
  if (value === 'screen') return options.axis === 'height' ? '100vh' : 'var(--ds-token-tailwind-primitives-size-screen, 100vw)';
  if (value === 'svh') return '100svh';
  if (value === 'svw') return 'var(--ds-token-tailwind-primitives-size-svw, 100svw)';
  if (value === 'dvh') return '100dvh';
  if (value === 'dvw') return 'var(--ds-token-tailwind-primitives-size-dvw, 100dvw)';
  if (value === 'lvh') return '100lvh';
  if (value === 'lvw') return 'var(--ds-token-tailwind-primitives-size-lvw, 100lvw)';
  if (value === 'fit') return 'var(--ds-token-tailwind-primitives-size-fit, fit-content)';
  if (value === 'min') return 'var(--ds-token-tailwind-primitives-size-min, min-content)';
  if (value === 'max') return 'var(--ds-token-tailwind-primitives-size-max, max-content)';
  if (value === 'none') return 'none';
  if (options.container && TAILWIND_CONTAINER_VALUES[value]) return TAILWIND_CONTAINER_VALUES[value];
  if (options.allowUnitless && /^-?\d+(?:\.\d+)?$/.test(rawValue)) return rawValue;
  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(value)) {
    const [numerator, denominator] = value.split('/').map(Number);
    if (denominator !== 0) return `${sign}${(numerator / denominator) * 100}%`;
  }
  if (/^\d+(?:\.\d+)?$/.test(value)) return getTailwindSpacingPrimitiveValue(value, negative);
  return normalizeTailwindCssValue(`${sign}${value}`);
}

function getTailwindSpacingPrimitiveValue(value: string, negative: boolean): string {
  const tokenId = value.replace(/\./g, '-');
  const positiveValue = `var(--ds-token-tailwind-primitives-space-${tokenId}, calc(var(--spacing, var(--ds-token-tailwind-primitives-space-1, 0.25rem)) * ${value}))`;
  return applyTailwindNegativeSign(positiveValue, negative);
}

function parseTailwindDuration(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  return /^\d+$/.test(rawValue)
    ? `var(--duration-${rawValue}, var(--ds-token-tailwind-primitives-duration-${rawValue}, ${rawValue}ms))`
    : rawValue;
}

function getTailwindDefaultDurationValue(): string {
  return 'var(--default-transition-duration, var(--duration-150, var(--ds-token-tailwind-primitives-duration-150, 150ms)))';
}

function getTailwindDefaultEasingValue(): string {
  return 'var(--default-transition-timing-function, var(--ease-in-out, var(--ds-token-tailwind-primitives-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1))))';
}

function parseTailwindScale(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  if (/^\d+(?:\.\d+)?$/.test(rawValue)) return `${Number(rawValue) / 100}`;
  return rawValue;
}

function parseTailwindOpacity(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  if (rawValue.startsWith('(') && rawValue.endsWith(')')) return `var(${rawValue.slice(1, -1)})`;
  if (/^\d+(?:\.\d+)?$/.test(rawValue)) return `var(--ds-token-tailwind-primitives-opacity-${rawValue.replace(/\./g, '-')}, ${Number(rawValue) / 100})`;
  return rawValue;
}

function parseTailwindAngle(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  if (/^\d+(?:\.\d+)?$/.test(rawValue)) return `${rawValue}deg`;
  return rawValue;
}

function parseTailwindBlur(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  if (rawValue === 'none') return 'var(--blur-none, var(--ds-token-tailwind-primitives-blur-none, 0))';
  if (rawValue === 'xs') return '4px';
  if (rawValue === 'sm') return 'var(--blur-sm, var(--ds-token-tailwind-primitives-blur-sm, 8px))';
  if (rawValue === 'md') return 'var(--blur-md, var(--ds-token-tailwind-primitives-blur-md, 12px))';
  if (rawValue === 'lg') return 'var(--blur-lg, var(--ds-token-tailwind-primitives-blur-lg, 16px))';
  if (rawValue === 'xl') return 'var(--blur-xl, var(--ds-token-tailwind-primitives-blur-xl, 24px))';
  if (rawValue === '2xl') return 'var(--blur-2xl, var(--ds-token-tailwind-primitives-blur-2xl, 40px))';
  if (rawValue === '3xl') return 'var(--blur-3xl, var(--ds-token-tailwind-primitives-blur-3xl, 64px))';
  return parseTailwindLength(rawValue);
}

function getTailwindSlideDeclarations(kind: 'enter' | 'exit', rawValue: string): string[] {
  const parts = rawValue.split('-');
  const direction = parts.shift();
  const distance = parseTailwindLength(parts.join('-') || 'full');
  const prefix = kind === 'enter' ? '--tw-enter' : '--tw-exit';
  if (direction === 'top') return [`${prefix}-translate-y: calc(${distance} * -1)`];
  if (direction === 'bottom') return [`${prefix}-translate-y: ${distance}`];
  if (direction === 'left') return [`${prefix}-translate-x: calc(${distance} * -1)`];
  if (direction === 'right') return [`${prefix}-translate-x: ${distance}`];
  return [];
}

function getTailwindShadowDeclarations(shadow: string): string[] {
  return [
    `--tw-shadow: ${shadow}`,
    'box-shadow: var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 #0000)',
  ];
}

function parseTailwindTransformOrigin(rawValue: string): string {
  if (rawValue.startsWith('[')) return unwrapTailwindArbitraryValue(rawValue);
  if (rawValue.startsWith('(') && rawValue.endsWith(')')) return `var(${rawValue.slice(1, -1)})`;
  return rawValue.replace(/-/g, ' ');
}

function parseTailwindColor(rawValue: string): string {
  const [name, opacity] = splitTailwindColorOpacity(rawValue);
  let color = '';
  if (name.startsWith('[')) {
    color = stripTailwindArbitraryTypeHint(unwrapTailwindArbitraryValue(name));
  } else if (name.startsWith('(') && name.endsWith(')')) {
    color = `var(${name.slice(1, -1)})`;
  } else if (TAILWIND_STATIC_COLORS[name]) {
    color = TAILWIND_STATIC_COLORS[name];
  } else if (TAILWIND_COLOR_VARIABLES.has(name)) {
    color = getTailwindSemanticColorVariable(name);
  } else {
    color = `var(--color-${name}, var(--ds-token-tailwind-primitives-${name}, var(--${name}, ${name})))`;
  }

  if (!opacity) return color;
  const opacityValue = opacity.startsWith('[') ? unwrapTailwindArbitraryValue(opacity) : `${opacity}%`;
  return `color-mix(in oklab, ${color} ${opacityValue}, transparent)`;
}

function getTailwindSemanticColorVariable(name: string): string {
  const fallback = TAILWIND_COLOR_FALLBACKS[name] ?? 'transparent';
  return `var(--${name}, var(--ds-color-${name}, var(--color-${name}, ${fallback})))`;
}

function applyTailwindNegativeSign(value: string, negative: boolean): string {
  if (!negative) return value;
  if (value === '0') return value;
  return value.startsWith('calc(') ? `calc(${value} * -1)` : `calc(${value} * -1)`;
}

function normalizeTailwindCssValue(value: string): string {
  return value.replace(/--spacing\((var\([^)]+\)|[^)]+)\)/g, (_match, spacingValue: string) => {
    const trimmedValue = spacingValue.trim();
    if (trimmedValue.startsWith('var(')) return `calc(var(--spacing, 0.25rem) * ${trimmedValue})`;
    if (/^-?\d+(?:\.\d+)?$/.test(trimmedValue)) return `calc(var(--spacing, 0.25rem) * ${trimmedValue})`;
    return `calc(var(--spacing, 0.25rem) * var(${trimmedValue}))`;
  });
}

function splitTailwindColorOpacity(rawValue: string): [string, string | null] {
  let bracketDepth = 0;
  for (let index = rawValue.length - 1; index >= 0; index -= 1) {
    const char = rawValue[index];
    if (char === ']') bracketDepth += 1;
    if (char === '[') bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === '/' && bracketDepth === 0) {
      return [rawValue.slice(0, index), rawValue.slice(index + 1)];
    }
  }
  return [rawValue, null];
}

function unwrapTailwindArbitraryValue(value: string): string {
  const unwrapped = value.startsWith('[') && value.endsWith(']')
    ? value.slice(1, -1)
    : value;
  return normalizeTailwindArbitraryValue(unwrapped);
}

function normalizeTailwindArbitraryValue(value: string): string {
  let normalized = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '\\' && value[index + 1] === '_') {
      normalized += '_';
      index += 1;
      continue;
    }
    normalized += char === '_' ? ' ' : char;
  }
  return normalized;
}

function escapeAttributeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function formatTailwindRuntimeRule(rule: TailwindRuntimeRule): string {
  let body = `${rule.selector}{${rule.declarations.map((declaration) => `${declaration};`).join('')}}`;
  if (rule.container) body = `@container ${rule.container}{${body}}`;
  if (rule.supports) body = `@supports ${rule.supports}{${body}}`;
  if (rule.media) body = `@media ${rule.media}{${body}}`;
  return body;
}

function escapeCssIdentifier(value: string): string {
  return value
    .split('')
    .map((char, index) => {
      if (/^[a-zA-Z_-]$/.test(char)) return char;
      if (/^\d$/.test(char)) return index === 0 ? `\\3${char} ` : char;
      return `\\${char}`;
    })
    .join('');
}
