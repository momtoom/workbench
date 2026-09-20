export type CssClassEffectivenessStatus =
  | 'applied'
  | 'overridden'
  | 'not-forwarded'
  | 'inactive'
  | 'partially-overridden'
  | 'unverified';

export type CssClassEffectivenessEntry = {
  className: string;
  status: CssClassEffectivenessStatus;
  reason: string;
  appliedProperties: string[];
  overriddenProperties: string[];
};

export type CssClassEffectivenessReport = {
  layerId: string;
  renderedClassName: string;
  sourceClassName: string;
  entries: CssClassEffectivenessEntry[];
};

export type CssClassEffectivenessLocalRule = {
  className: string;
  container?: string;
  declarations: string[];
  media?: string;
  order: number;
  selector: string;
  supports?: string;
};

type CssSpecificity = [number, number, number];

type CssRuleCondition = {
  kind: 'container' | 'media' | 'scope' | 'starting-style' | 'supports' | 'unknown';
  text: string;
  active?: boolean | null;
};

type IndexedCssDeclaration = {
  important: boolean;
  property: string;
  value: string;
};

type IndexedCssSelectorRule = {
  conditions: CssRuleCondition[];
  declarations: IndexedCssDeclaration[];
  layerName: string | null;
  order: number;
  selectedElementClassName?: string;
  selector: string;
  specificity: CssSpecificity;
};

type CssRuleIndex = {
  complete: boolean;
  inaccessibleStyleSheetCount: number;
  layerOrder: Map<string, number>;
  rules: IndexedCssSelectorRule[];
};

type AsyncCssStyleRuleReference = {
  conditions: CssRuleCondition[];
  layerName: string | null;
  order: number;
  rule: CSSStyleRule;
};

type CssCascadeCandidate = IndexedCssDeclaration & {
  fromTargetClass: boolean;
  id: string;
  layerName: string | null;
  order: number;
  selector: string;
  specificity: CssSpecificity;
};

type ConditionalRuleMatch = {
  inactiveConditions: CssRuleCondition[];
  selectorMatched: boolean;
  unknownConditions: CssRuleCondition[];
};

const cssRuleIndexCache = new WeakMap<Document, CssRuleIndex>();
const CSS_RULE_INDEX_BUDGET_MS = 32;
const CSS_SELECTED_ELEMENT_ANALYSIS_BUDGET_MS = 24;
const CSS_SELECTED_ELEMENT_MAX_CLASS_NAMES = 256;
const CSS_SELECTED_ELEMENT_MAX_LOCAL_RULES = 512;
const CSS_SELECTED_ELEMENT_MAX_DECLARATIONS_PER_RULE = 64;
const CSS_SELECTED_ELEMENT_MAX_SELECTOR_LENGTH = 4_096;
const CSS_SELECTED_ELEMENT_MAX_CLASS_TEXT_LENGTH = 32_768;

type CssRuleIndexYieldState = {
  analysisStartedAt: number;
  sliceStartedAt: number;
};

type CssSelectedElementAnalysisBudget = {
  deadline: number;
  document: Document;
};

const SHORTHAND_LONGHANDS: Record<string, string[]> = {
  animation: [
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
  ],
  background: [
    'background-color',
    'background-image',
    'background-position-x',
    'background-position-y',
    'background-size',
    'background-repeat-x',
    'background-repeat-y',
    'background-origin',
    'background-clip',
    'background-attachment',
    'background-blend-mode',
  ],
  border: [
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ],
  'border-block': [
    'border-block-start-width',
    'border-block-end-width',
    'border-block-start-style',
    'border-block-end-style',
    'border-block-start-color',
    'border-block-end-color',
  ],
  'border-block-color': ['border-block-start-color', 'border-block-end-color'],
  'border-block-style': ['border-block-start-style', 'border-block-end-style'],
  'border-block-width': ['border-block-start-width', 'border-block-end-width'],
  'border-color': [
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ],
  'border-inline': [
    'border-inline-start-width',
    'border-inline-end-width',
    'border-inline-start-style',
    'border-inline-end-style',
    'border-inline-start-color',
    'border-inline-end-color',
  ],
  'border-inline-color': ['border-inline-start-color', 'border-inline-end-color'],
  'border-inline-style': ['border-inline-start-style', 'border-inline-end-style'],
  'border-inline-width': ['border-inline-start-width', 'border-inline-end-width'],
  'border-radius': [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ],
  'border-style': [
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
  ],
  'border-width': [
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
  ],
  columns: ['column-width', 'column-count'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  font: [
    'font-style',
    'font-variant',
    'font-weight',
    'font-stretch',
    'font-size',
    'line-height',
    'font-family',
  ],
  gap: ['row-gap', 'column-gap'],
  grid: [
    'grid-template-rows',
    'grid-template-columns',
    'grid-template-areas',
    'grid-auto-rows',
    'grid-auto-columns',
    'grid-auto-flow',
  ],
  'grid-column': ['grid-column-start', 'grid-column-end'],
  'grid-row': ['grid-row-start', 'grid-row-end'],
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-block': ['inset-block-start', 'inset-block-end'],
  'inset-inline': ['inset-inline-start', 'inset-inline-end'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  'margin-block': ['margin-block-start', 'margin-block-end'],
  'margin-inline': ['margin-inline-start', 'margin-inline-end'],
  outline: ['outline-width', 'outline-style', 'outline-color'],
  overflow: ['overflow-x', 'overflow-y'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  'padding-block': ['padding-block-start', 'padding-block-end'],
  'padding-inline': ['padding-inline-start', 'padding-inline-end'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self'],
  'text-decoration': [
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-color',
    'text-decoration-thickness',
  ],
  transition: [
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
    'transition-behavior',
  ],
};

const CONDITIONAL_VARIANT_PREFIXES = new Set([
  'active',
  'any-hover',
  'aria',
  'autofill',
  'checked',
  'contrast-more',
  'contrast-less',
  'dark',
  'data',
  'default',
  'disabled',
  'empty',
  'enabled',
  'first',
  'first-of-type',
  'focus',
  'focus-visible',
  'focus-within',
  'group',
  'has',
  'hover',
  'in',
  'indeterminate',
  'invalid',
  'landscape',
  'last',
  'last-of-type',
  'lg',
  'md',
  'motion-reduce',
  'motion-safe',
  'not',
  'odd',
  'only',
  'only-of-type',
  'open',
  'optional',
  'out-of-range',
  'peer',
  'placeholder-shown',
  'portrait',
  'print',
  'read-only',
  'read-write',
  'required',
  'sm',
  'starting',
  'supports',
  'target',
  'valid',
  'visited',
  'xl',
  '2xl',
]);

export function analyzeCssClassEffectiveness({
  classNames,
  componentName,
  element,
  layerId,
  localRules = [],
  sourceClassName,
}: {
  classNames: string[];
  componentName?: string | null;
  element: HTMLElement;
  layerId: string;
  localRules?: CssClassEffectivenessLocalRule[];
  sourceClassName: string;
}): CssClassEffectivenessReport {
  const budget = createCssSelectedElementAnalysisBudget(element.ownerDocument);
  validateCssSelectedElementAnalysisInput({
    budget,
    classNames,
    localRules,
    renderedClassName: element.getAttribute('class') ?? '',
    sourceClassName,
  });
  return analyzeCssClassEffectivenessWithIndex({
    budget,
    classNames,
    componentName,
    element,
    index: createSelectedElementRuleIndex(localRules, element, budget),
    layerId,
    sourceClassName,
  });
}

export async function analyzeCssClassEffectivenessAsync({
  classNames,
  componentName,
  element,
  layerId,
  localRules = [],
  signal,
  sourceClassName,
}: {
  classNames: string[];
  componentName?: string | null;
  element: HTMLElement;
  layerId: string;
  localRules?: CssClassEffectivenessLocalRule[];
  signal?: AbortSignal;
  sourceClassName: string;
}): Promise<CssClassEffectivenessReport> {
  throwIfCssIndexingAborted(signal);
  const budget = createCssSelectedElementAnalysisBudget(element.ownerDocument);
  validateCssSelectedElementAnalysisInput({
    budget,
    classNames,
    localRules,
    renderedClassName: element.getAttribute('class') ?? '',
    sourceClassName,
  });
  const index = createSelectedElementRuleIndex(localRules, element, budget);
  throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
  const report = analyzeCssClassEffectivenessWithIndex({
    budget,
    classNames,
    componentName,
    element,
    index,
    layerId,
    sourceClassName,
  });
  return report;
}

function createSelectedElementRuleIndex(
  localRules: readonly CssClassEffectivenessLocalRule[],
  element: HTMLElement,
  budget?: CssSelectedElementAnalysisBudget,
): CssRuleIndex {
  const document = element.ownerDocument;
  const rules = localRules.flatMap((rule) => {
    throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
    const conditions: CssRuleCondition[] = [];
    if (rule.media) conditions.push({ kind: 'media', text: rule.media });
    if (rule.supports) conditions.push({ kind: 'supports', text: rule.supports });
    if (rule.container) conditions.push({ kind: 'container', text: rule.container });
    const state = getSelectedElementLocalRuleState(rule, element);
    if (state !== true) {
      conditions.push({ active: state, kind: 'unknown', text: rule.className });
    }
    const declarations = rule.declarations.flatMap(parseLocalCssDeclaration);
    const selector = getSelectedElementClassSelector(rule.className, document.defaultView);
    return [{
      conditions,
      declarations,
      layerName: null,
      order: rule.order,
      selectedElementClassName: rule.className,
      selector,
      specificity: calculateCssSpecificity(selector),
    }];
  });
  return {
    complete: true,
    inaccessibleStyleSheetCount: 0,
    layerOrder: new Map(),
    rules,
  };
}

function createCssSelectedElementAnalysisBudget(document: Document): CssSelectedElementAnalysisBudget {
  return {
    deadline: getCssIndexNow(document) + CSS_SELECTED_ELEMENT_ANALYSIS_BUDGET_MS,
    document,
  };
}

function validateCssSelectedElementAnalysisInput({
  budget,
  classNames,
  localRules,
  renderedClassName,
  sourceClassName,
}: {
  budget: CssSelectedElementAnalysisBudget;
  classNames: readonly string[];
  localRules: readonly CssClassEffectivenessLocalRule[];
  renderedClassName: string;
  sourceClassName: string;
}) {
  const inputExceedsLimit =
    classNames.length > CSS_SELECTED_ELEMENT_MAX_CLASS_NAMES ||
    localRules.length > CSS_SELECTED_ELEMENT_MAX_LOCAL_RULES ||
    renderedClassName.length > CSS_SELECTED_ELEMENT_MAX_CLASS_TEXT_LENGTH ||
    sourceClassName.length > CSS_SELECTED_ELEMENT_MAX_CLASS_TEXT_LENGTH ||
    localRules.some((rule) => (
      rule.declarations.length > CSS_SELECTED_ELEMENT_MAX_DECLARATIONS_PER_RULE ||
      rule.selector.length > CSS_SELECTED_ELEMENT_MAX_SELECTOR_LENGTH
    ));
  if (inputExceedsLimit) {
    throw new DOMException(
      'CSS class effectiveness analysis exceeded its safe input limit.',
      'TimeoutError',
    );
  }
  throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
}

function throwIfCssSelectedElementAnalysisBudgetExceeded(
  budget: CssSelectedElementAnalysisBudget | undefined,
) {
  if (!budget || getCssIndexNow(budget.document) <= budget.deadline) return;
  throw new DOMException(
    'CSS class effectiveness analysis exceeded its safe interaction budget.',
    'TimeoutError',
  );
}

function getSelectedElementClassSelector(className: string, ownerWindow: Window | null): string {
  const escape = ownerWindow
    ? (ownerWindow as Window & typeof globalThis).CSS?.escape
    : globalThis.CSS?.escape;
  return `.${escape ? escape(className) : fallbackCssEscape(className)}`;
}

function getSelectedElementLocalRuleState(
  rule: CssClassEffectivenessLocalRule,
  element: HTMLElement,
): boolean | null {
  const variants = getClassVariants(rule.className).map((variant) => variant.toLowerCase());
  if (variants.length === 0) {
    return localRuleRequiresExternalDomInspection(rule.selector) ? null : true;
  }
  if (variants.every((variant) => /^(?:xs|sm|md|lg|xl|2xl|3xl)$/.test(variant))) return true;
  if (variants.some((variant) => (
    variant.startsWith('hover') ||
    variant.startsWith('focus') ||
    variant === 'active' ||
    variant === 'visited' ||
    variant === 'target'
  ))) return false;
  if (variants.some((variant) => variant.startsWith('data-') || variant.startsWith('aria-'))) {
    const attributeChecks = getSelectedElementAttributeChecks(rule.selector);
    if (attributeChecks.length === 0) return null;
    return attributeChecks.every(({ name, value }) => (
      value === null ? element.hasAttribute(name) : element.getAttribute(name) === value
    ));
  }
  if (localRuleRequiresExternalDomInspection(rule.selector)) return null;
  // Ancestor, sibling, container, and attribute variants need DOM context
  // outside the selected root. Keep them honest and bounded instead of
  // evaluating the authored selector against a potentially huge subtree.
  return null;
}

function localRuleRequiresExternalDomInspection(selector: string): boolean {
  const selectors = splitSelectorList(selector);
  return selectors.length === 0 || selectors.every(selectorRequiresExternalDomInspection);
}

function getSelectedElementAttributeChecks(
  selector: string,
): Array<{ name: string; value: string | null }> {
  const checks: Array<{ name: string; value: string | null }> = [];
  for (let index = 0; index < selector.length; index += 1) {
    if (selector[index] !== '[' || selector[index - 1] === '\\') continue;
    const endIndex = selector.indexOf(']', index + 1);
    if (endIndex < 0) break;
    const body = selector.slice(index + 1, endIndex).trim();
    const match = body.match(/^([^\s~|^$*!=]+)(?:\s*=\s*["']?([^"']*?)["']?)?$/);
    if (match?.[1]) checks.push({ name: match[1], value: match[2] ?? null });
    index = endIndex;
  }
  return checks;
}

function parseLocalCssDeclaration(value: string): IndexedCssDeclaration[] {
  const separatorIndex = value.indexOf(':');
  if (separatorIndex <= 0) return [];
  const property = value.slice(0, separatorIndex).trim().toLowerCase();
  const rawValue = value.slice(separatorIndex + 1).trim();
  if (!property || !rawValue) return [];
  const important = /\s*!important\s*$/i.test(rawValue);
  const declarationValue = important
    ? rawValue.replace(/\s*!important\s*$/i, '').trim()
    : rawValue;
  return declarationValue ? [{ important, property, value: declarationValue }] : [];
}

function analyzeCssClassEffectivenessWithIndex({
  budget,
  classNames,
  componentName,
  element,
  index,
  layerId,
  sourceClassName,
}: {
  budget?: CssSelectedElementAnalysisBudget;
  classNames: string[];
  componentName?: string | null;
  element: HTMLElement;
  index: CssRuleIndex;
  layerId: string;
  sourceClassName: string;
}): CssClassEffectivenessReport {
  const uniqueClassNames = [...new Set(classNames.filter(Boolean))];
  const renderedClassName = element.getAttribute('class') ?? '';
  const renderedSourceClassCount = uniqueClassNames.filter((className) => element.classList.contains(className)).length;
  const ruleMatches = new Map<IndexedCssSelectorRule, ConditionalRuleMatch>();
  const candidatesByProperty = new Map<string, CssCascadeCandidate[]>();
  const entries: CssClassEffectivenessEntry[] = [];
  for (const className of uniqueClassNames) {
    throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
    entries.push(analyzeCssClassToken({
      budget,
      candidatesByProperty,
      className,
      componentName,
      element,
      index,
      renderedSourceClassCount,
      ruleMatches,
    }));
  }

  return {
    entries,
    layerId,
    renderedClassName,
    sourceClassName,
  };
}

export function areCssClassEffectivenessReportsEqual(
  left: CssClassEffectivenessReport | null,
  right: CssClassEffectivenessReport | null,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  if (
    left.layerId !== right.layerId ||
    left.renderedClassName !== right.renderedClassName ||
    left.sourceClassName !== right.sourceClassName ||
    left.entries.length !== right.entries.length
  ) return false;
  return left.entries.every((entry, index) => {
    const other = right.entries[index];
    return Boolean(
      other &&
      entry.className === other.className &&
      entry.status === other.status &&
      entry.reason === other.reason &&
      entry.appliedProperties.join('\n') === other.appliedProperties.join('\n') &&
      entry.overriddenProperties.join('\n') === other.overriddenProperties.join('\n')
    );
  });
}

export function invalidateCssClassEffectivenessRuleCache(document: Document) {
  cssRuleIndexCache.delete(document);
}

function analyzeCssClassToken({
  budget,
  candidatesByProperty,
  className,
  componentName,
  element,
  index,
  renderedSourceClassCount,
  ruleMatches,
}: {
  budget?: CssSelectedElementAnalysisBudget;
  candidatesByProperty: Map<string, CssCascadeCandidate[]>;
  className: string;
  componentName?: string | null;
  element: HTMLElement;
  index: CssRuleIndex;
  renderedSourceClassCount: number;
  ruleMatches: Map<IndexedCssSelectorRule, ConditionalRuleMatch>;
}): CssClassEffectivenessEntry {
  if (!element.classList.contains(className)) {
    return {
      appliedProperties: [],
      className,
      overriddenProperties: [],
      reason: renderedSourceClassCount === 0
        ? 'className was not forwarded to the selected component root.'
        : 'The class token is absent from the selected root. Class composition may have merged it out before render.',
      status: 'not-forwarded',
    };
  }

  const classRules = index.rules.filter((rule) => selectorContainsClass(rule.selector, className, element.ownerDocument.defaultView));
  if (classRules.length === 0) {
    return {
      appliedProperties: [],
      className,
      overriddenProperties: [],
      reason: index.inaccessibleStyleSheetCount > 0
        ? 'The class is rendered, but one or more stylesheets are not inspectable. Its effect could not be verified.'
        : 'The class is rendered, but no inspectable CSS rule defines an effect for the selected root.',
      status: 'unverified',
    };
  }

  const activeClassRules: IndexedCssSelectorRule[] = [];
  const inactiveConditions: CssRuleCondition[] = [];
  const unknownConditions: CssRuleCondition[] = [];
  let selectorMismatch = false;

  for (const rule of classRules) {
    throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
    const match = ruleMatches.get(rule) ?? matchIndexedRule(rule, element);
    inactiveConditions.push(...match.inactiveConditions);
    unknownConditions.push(...match.unknownConditions);
    if (!match.selectorMatched) selectorMismatch = true;
    if (match.selectorMatched && match.inactiveConditions.length === 0 && match.unknownConditions.length === 0) {
      activeClassRules.push(rule);
    }
  }

  if (activeClassRules.length === 0) {
    if (unknownConditions.length > 0 || classRules.some((rule) => rule.selector.includes('::'))) {
      return {
        appliedProperties: [],
        className,
        overriddenProperties: [],
        reason: 'The class is rendered, but its scoped, container, or pseudo-element effect cannot be verified on the selected root.',
        status: 'unverified',
      };
    }
    if (inactiveConditions.length > 0 || (selectorMismatch && isConditionalClassToken(className))) {
      return {
        appliedProperties: [],
        className,
        overriddenProperties: [],
        reason: getInactiveClassReason(className, inactiveConditions),
        status: 'inactive',
      };
    }
    return {
      appliedProperties: [],
      className,
      overriddenProperties: [],
      reason: 'The class rule does not target the selected root in the current DOM structure.',
      status: 'unverified',
    };
  }

  const classCandidates = createCandidatesFromRules(activeClassRules, element.ownerDocument)
    .map((candidate) => ({ ...candidate, fromTargetClass: true }));
  throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
  const meaningfulClassCandidates = getMeaningfulTargetCandidates(classCandidates);
  const targetProperties = new Set(meaningfulClassCandidates.map((candidate) => candidate.property));
  if (targetProperties.size === 0) {
    return {
      appliedProperties: [],
      className,
      overriddenProperties: [],
      reason: 'The matching rule only defines internal CSS variables, so its visible effect cannot be verified.',
      status: 'unverified',
    };
  }

  const allCandidates = [...targetProperties]
    .flatMap((property) => getElementCascadeCandidatesForProperty({
      candidatesByProperty,
      element,
      index,
      property,
      ruleMatches,
    }))
    .map((candidate) => ({
      ...candidate,
      fromTargetClass:
        candidate.selector !== 'style attribute' &&
      selectorContainsClass(candidate.selector, className, element.ownerDocument.defaultView),
    }));
  throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
  const appliedProperties: string[] = [];
  const overriddenProperties: string[] = [];
  const overrideWinners = new Map<string, CssCascadeCandidate>();

  for (const property of [...targetProperties].sort()) {
    throwIfCssSelectedElementAnalysisBudgetExceeded(budget);
    const candidates = allCandidates.filter((candidate) => candidate.property === property);
    const sortedCandidates = candidates.sort((left, right) => compareCascadeCandidates(left, right, index.layerOrder));
    const winner = sortedCandidates[sortedCandidates.length - 1];
    if (!winner) {
      overriddenProperties.push(property);
      continue;
    }
    if (winner.fromTargetClass) {
      appliedProperties.push(property);
    } else {
      overriddenProperties.push(property);
      overrideWinners.set(property, winner);
    }
  }

  if (appliedProperties.length > 0 && overriddenProperties.length === 0) {
    if (!index.complete) {
      return {
        appliedProperties: [],
        className,
        overriddenProperties: [],
        reason: 'No winning conflict was found in the bounded cascade scan, so this class remains unverified.',
        status: 'unverified',
      };
    }
    return {
      appliedProperties,
      className,
      overriddenProperties,
      reason: formatAppliedReason(appliedProperties),
      status: 'applied',
    };
  }

  if (appliedProperties.length > 0 && overriddenProperties.length > 0) {
    if (!index.complete) {
      return {
        appliedProperties: [],
        className,
        overriddenProperties: [],
        reason: 'A possible partial conflict was found, but the bounded cascade scan cannot verify every affected property.',
        status: 'unverified',
      };
    }
    return {
      appliedProperties,
      className,
      overriddenProperties,
      reason: `Applied to ${formatPropertyList(appliedProperties)}; overridden for ${formatPropertyList(overriddenProperties)} by ${formatOverrideWinner(
        pickRepresentativeWinner(overrideWinners),
        componentName,
        element,
      )}.`,
      status: 'partially-overridden',
    };
  }

  const representativeWinner = pickRepresentativeWinner(overrideWinners);
  return {
    appliedProperties,
    className,
    overriddenProperties,
    reason: representativeWinner
      ? `Overridden by ${formatOverrideWinner(representativeWinner, componentName, element)}.`
      : 'The matching class declarations do not win the selected root’s current cascade.',
    status: 'overridden',
  };
}

function getCssRuleIndex(document: Document): CssRuleIndex {
  const cached = cssRuleIndexCache.get(document);
  if (cached) return cached;

  const layerNames: string[] = [];
  const rawRules: Array<Omit<IndexedCssSelectorRule, 'specificity'> & { selector: string }> = [];
  let inaccessibleStyleSheetCount = 0;
  let order = 0;

  for (const styleSheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = styleSheet.cssRules;
    } catch {
      inaccessibleStyleSheetCount += 1;
      continue;
    }
    collectIndexedCssRules({
      conditions: [],
      layerNames,
      parentLayerName: null,
      rawRules,
      rules,
      takeOrder: () => order++,
    });
  }

  const layerOrder = new Map(layerNames.map((name, index) => [name, index]));
  const next: CssRuleIndex = {
    complete: inaccessibleStyleSheetCount === 0,
    inaccessibleStyleSheetCount,
    layerOrder,
    rules: rawRules.flatMap((rule) => splitSelectorList(rule.selector).map((selector) => ({
      ...rule,
      selector,
      specificity: calculateCssSpecificity(selector),
    }))),
  };
  cssRuleIndexCache.set(document, next);
  return next;
}

async function buildCssRuleIndexForElementAsync({
  classNames,
  document,
  element,
  signal,
}: {
  classNames: readonly string[];
  document: Document;
  element: HTMLElement;
  signal?: AbortSignal;
}): Promise<CssRuleIndex> {
  const layerNames: string[] = [];
  const selectedClassRules: IndexedCssSelectorRule[] = [];
  const styleRuleReferences: AsyncCssStyleRuleReference[] = [];
  const analysisStartedAt = getCssIndexNow(document);
  const yieldState: CssRuleIndexYieldState = {
    analysisStartedAt,
    sliceStartedAt: analysisStartedAt,
  };
  let inaccessibleStyleSheetCount = 0;
  let order = 0;

  for (const styleSheet of Array.from(document.styleSheets)) {
    throwIfCssIndexingAborted(signal);
    let rules: CSSRuleList;
    try {
      rules = styleSheet.cssRules;
    } catch {
      inaccessibleStyleSheetCount += 1;
      continue;
    }
    await collectAsyncCssStyleRuleReferences({
      classNames,
      conditions: [],
      document,
      layerNames,
      parentLayerName: null,
      rules,
      selectedClassRules,
      signal,
      styleRuleReferences,
      takeOrder: () => order++,
      yieldState,
    });
  }

  const activeSelectedClassRules = selectedClassRules.filter((rule) => {
    const match = matchIndexedRule(rule, element);
    return (
      match.selectorMatched &&
      match.inactiveConditions.length === 0 &&
      match.unknownConditions.length === 0
    );
  });
  const targetProperties = new Set(
    getMeaningfulTargetCandidates(createCandidatesFromRules(activeSelectedClassRules, document))
      .map((candidate) => candidate.property),
  );
  const indexedRules = [...selectedClassRules];
  // Large generated stylesheets are intentionally scanned conservatively.
  // Important declarations can definitively prove that a normal utility lost;
  // a full matches() pass across thousands of selectors can block selection.
  const importantOnlyCompetitorScan = styleRuleReferences.length > 800;
  const selectedRuleKeys = new Set(
    selectedClassRules.map((rule) => `${rule.order}\n${rule.selector}`),
  );

  for (let referenceIndex = 0; referenceIndex < styleRuleReferences.length; referenceIndex += 1) {
    const reference = styleRuleReferences[referenceIndex];
    if (!reference) continue;
    throwIfCssIndexingAborted(signal);
    const declarations = getIndexedDeclarationsForProperties(
      reference.rule.style,
      targetProperties,
      importantOnlyCompetitorScan,
    );
    if (declarations.length === 0) {
      await yieldCssRuleIndexingIfNeeded(document, yieldState, signal);
      continue;
    }
    for (const selector of splitSelectorList(reference.rule.selectorText)) {
      const key = `${reference.order}\n${selector}`;
      if (selectedRuleKeys.has(key) || !safelyMatchesSelector(element, selector)) continue;
      indexedRules.push({
        conditions: reference.conditions,
        declarations,
        layerName: reference.layerName,
        order: reference.order,
        selector,
        specificity: calculateCssSpecificity(selector),
      });
    }
    await yieldCssRuleIndexingIfNeeded(document, yieldState, signal);
  }

  return {
    complete: !importantOnlyCompetitorScan && inaccessibleStyleSheetCount === 0,
    inaccessibleStyleSheetCount,
    layerOrder: new Map(layerNames.map((name, index) => [name, index])),
    rules: indexedRules,
  };
}

async function collectAsyncCssStyleRuleReferences({
  classNames,
  conditions,
  document,
  layerNames,
  parentLayerName,
  rules,
  selectedClassRules,
  signal,
  styleRuleReferences,
  takeOrder,
  yieldState,
}: {
  classNames: readonly string[];
  conditions: CssRuleCondition[];
  document: Document;
  layerNames: string[];
  parentLayerName: string | null;
  rules: CSSRuleList;
  selectedClassRules: IndexedCssSelectorRule[];
  signal?: AbortSignal;
  styleRuleReferences: AsyncCssStyleRuleReference[];
  takeOrder: () => number;
  yieldState: CssRuleIndexYieldState;
}) {
  for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
    throwIfCssIndexingAborted(signal);
    const rule = rules[ruleIndex];
    if (!rule) continue;
    if (isStyleRule(rule)) {
      const order = takeOrder();
      styleRuleReferences.push({
        conditions,
        layerName: parentLayerName,
        order,
        rule,
      });
      if (selectorTextMayContainAnyClass(rule.selectorText, classNames, document.defaultView)) {
        const retainedSelectors = splitSelectorList(rule.selectorText).filter((selector) => (
          classNames.some((className) => selectorContainsClass(selector, className, document.defaultView))
        ));
        const declarations = getIndexedDeclarations(rule.style);
        for (const selector of retainedSelectors) {
          selectedClassRules.push({
            conditions,
            declarations,
            layerName: parentLayerName,
            order,
            selector,
            specificity: calculateCssSpecificity(selector),
          });
        }
      }
      const nestedRules = getNestedCssRules(rule);
      if (nestedRules) {
        await collectAsyncCssStyleRuleReferences({
          classNames,
          conditions,
          document,
          layerNames,
          parentLayerName,
          rules: nestedRules,
          selectedClassRules,
          signal,
          styleRuleReferences,
          takeOrder,
          yieldState,
        });
      }
    } else {
      const childRules = getNestedCssRules(rule);
      if (!childRules) {
        const cssText = rule.cssText.trim();
        if (isLayerStatementRule(cssText)) {
          for (const name of parseLayerStatementNames(cssText, parentLayerName)) addLayerName(layerNames, name);
        }
      } else {
        const layerName = getLayerBlockName(rule, parentLayerName);
        if (layerName) addLayerName(layerNames, layerName);
        const condition = getCssRuleCondition(rule);
        await collectAsyncCssStyleRuleReferences({
          classNames,
          conditions: condition ? [...conditions, condition] : conditions,
          document,
          layerNames,
          parentLayerName: layerName ?? parentLayerName,
          rules: childRules,
          selectedClassRules,
          signal,
          styleRuleReferences,
          takeOrder,
          yieldState,
        });
      }
    }
    await yieldCssRuleIndexingIfNeeded(document, yieldState, signal);
  }
}

function selectorTextMayContainAnyClass(
  selectorText: string,
  classNames: readonly string[],
  ownerWindow: Window | null,
): boolean {
  const escape = ownerWindow
    ? (ownerWindow as Window & typeof globalThis).CSS?.escape
    : globalThis.CSS?.escape;
  return classNames.some((className) => {
    const escapedClassName = escape ? escape(className) : className.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
    return selectorText.includes(`.${escapedClassName}`);
  });
}

function getIndexedDeclarationsForProperties(
  style: CSSStyleDeclaration,
  targetProperties: ReadonlySet<string>,
  importantOnly = false,
): IndexedCssDeclaration[] {
  if (targetProperties.size === 0) return [];
  return Array.from(style).flatMap((property) => {
    const normalizedProperty = property.toLowerCase();
    const isRelevant = targetProperties.has(normalizedProperty) ||
      SHORTHAND_LONGHANDS[normalizedProperty]?.some((longhand) => targetProperties.has(longhand));
    if (!isRelevant) return [];
    const value = style.getPropertyValue(property).trim();
    if (!value) return [];
    const important = style.getPropertyPriority(property) === 'important';
    if (importantOnly && !important) return [];
    return [{
      important,
      property: normalizedProperty,
      value,
    }];
  });
}

async function yieldCssRuleIndexingIfNeeded(
  document: Document,
  state: CssRuleIndexYieldState,
  signal?: AbortSignal,
) {
  throwIfCssIndexingAborted(signal);
  throwIfCssIndexingBudgetExceeded(document, state);
  if (getCssIndexNow(document) - state.sliceStartedAt < 4) return;
  await new Promise<void>((resolve) => {
    const ownerWindow = document.defaultView;
    if (ownerWindow) {
      ownerWindow.setTimeout(resolve, 0);
    } else {
      setTimeout(resolve, 0);
    }
  });
  throwIfCssIndexingAborted(signal);
  throwIfCssIndexingBudgetExceeded(document, state);
  state.sliceStartedAt = getCssIndexNow(document);
}

function throwIfCssIndexingAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw new DOMException('CSS class effectiveness analysis was cancelled.', 'AbortError');
}

function throwIfCssIndexingBudgetExceeded(
  document: Document,
  state: CssRuleIndexYieldState,
) {
  if (getCssIndexNow(document) - state.analysisStartedAt <= CSS_RULE_INDEX_BUDGET_MS) return;
  throw new DOMException('CSS class effectiveness analysis exceeded its interaction budget.', 'TimeoutError');
}

function safelyMatchesSelector(element: HTMLElement, selector: string): boolean {
  // Element.matches() is not a meaningful query for pseudo-element selectors
  // and relational selectors can synchronously inspect a very large subtree.
  // Class effectiveness is a selected-root diagnostic, so those selectors are
  // deliberately left unverified instead of blocking editor selection.
  if (selector.includes('::')) return false;
  if (selector.trim() === '*') return true;
  const compactSelector = selector.replace(/,\s+/g, ',');
  if (
    compactSelector.length > 512 ||
    compactSelector.includes(':has(') ||
    /[\s>+~]/.test(compactSelector)
  ) return false;
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function getCssIndexNow(document: Document): number {
  return document.defaultView?.performance.now() ?? Date.now();
}

function collectIndexedCssRules({
  conditions,
  layerNames,
  parentLayerName,
  rawRules,
  rules,
  takeOrder,
}: {
  conditions: CssRuleCondition[];
  layerNames: string[];
  parentLayerName: string | null;
  rawRules: Array<Omit<IndexedCssSelectorRule, 'specificity'> & { selector: string }>;
  rules: CSSRuleList;
  takeOrder: () => number;
}) {
  for (const rule of Array.from(rules)) {
    if (isStyleRule(rule)) {
      rawRules.push({
        conditions,
        declarations: getIndexedDeclarations(rule.style),
        layerName: parentLayerName,
        order: takeOrder(),
        selector: rule.selectorText,
      });
      const nestedRules = getNestedCssRules(rule);
      if (nestedRules) {
        collectIndexedCssRules({
          conditions,
          layerNames,
          parentLayerName,
          rawRules,
          rules: nestedRules,
          takeOrder,
        });
      }
      continue;
    }
    const childRules = getNestedCssRules(rule);
    if (!childRules) {
      // Only leaf at-rules need serialization. Calling cssText on a grouping
      // rule serializes its complete nested stylesheet and can freeze the
      // editor for large Tailwind outputs.
      const cssText = rule.cssText.trim();
      if (isLayerStatementRule(cssText)) {
        for (const name of parseLayerStatementNames(cssText, parentLayerName)) addLayerName(layerNames, name);
      }
      continue;
    }
    const layerName = getLayerBlockName(rule, parentLayerName);
    if (layerName) addLayerName(layerNames, layerName);
    const condition = getCssRuleCondition(rule);
    collectIndexedCssRules({
      conditions: condition ? [...conditions, condition] : conditions,
      layerNames,
      parentLayerName: layerName ?? parentLayerName,
      rawRules,
      rules: childRules,
      takeOrder,
    });
  }
}

function getIndexedDeclarations(style: CSSStyleDeclaration): IndexedCssDeclaration[] {
  return Array.from(style).flatMap((property) => {
    const value = style.getPropertyValue(property).trim();
    if (!value) return [];
    return [{
      important: style.getPropertyPriority(property) === 'important',
      property: property.toLowerCase(),
      value,
    }];
  });
}

function createCandidatesFromRules(
  rules: IndexedCssSelectorRule[],
  document: Document,
): CssCascadeCandidate[] {
  return rules.flatMap((rule) => rule.declarations.flatMap((declaration, declarationIndex) => (
    expandCssDeclaration(document, declaration).map((expanded, expandedIndex) => ({
      ...expanded,
      fromTargetClass: false,
      id: `${rule.order}:${declarationIndex}:${expandedIndex}:${expanded.property}`,
      layerName: rule.layerName,
      order: rule.order * 1_000 + declarationIndex * 10 + expandedIndex,
      selector: rule.selector,
      specificity: rule.specificity,
    }))
  )));
}

function getElementCascadeCandidatesForProperty({
  candidatesByProperty,
  element,
  index,
  property,
  ruleMatches,
}: {
  candidatesByProperty: Map<string, CssCascadeCandidate[]>;
  element: HTMLElement;
  index: CssRuleIndex;
  property: string;
  ruleMatches: Map<IndexedCssSelectorRule, ConditionalRuleMatch>;
}): CssCascadeCandidate[] {
  const cached = candidatesByProperty.get(property);
  if (cached) return cached;

  const candidates: CssCascadeCandidate[] = [];
  for (const rule of index.rules) {
    const relevantDeclarations = rule.declarations.filter((declaration) => (
      declaration.property === property ||
      SHORTHAND_LONGHANDS[declaration.property]?.includes(property)
    ));
    if (relevantDeclarations.length === 0) continue;
    const match = ruleMatches.get(rule) ?? matchIndexedRule(rule, element);
    ruleMatches.set(rule, match);
    if (
      !match.selectorMatched ||
      match.inactiveConditions.length > 0 ||
      match.unknownConditions.length > 0
    ) continue;
    candidates.push(...createCandidatesFromRules(
      [{ ...rule, declarations: relevantDeclarations }],
      element.ownerDocument,
    ).filter((candidate) => candidate.property === property));
  }
  candidates.push(
    ...createInlineStyleCandidates(element).filter((candidate) => candidate.property === property),
  );
  candidatesByProperty.set(property, candidates);
  return candidates;
}

function createInlineStyleCandidates(element: HTMLElement): CssCascadeCandidate[] {
  return getIndexedDeclarations(element.style).flatMap((declaration, declarationIndex) => (
    expandCssDeclaration(element.ownerDocument, declaration).map((expanded, expandedIndex) => ({
      ...expanded,
      fromTargetClass: false,
      id: `inline:${declarationIndex}:${expandedIndex}:${expanded.property}`,
      layerName: null,
      order: Number.MAX_SAFE_INTEGER - 1_000 + declarationIndex * 10 + expandedIndex,
      selector: 'style attribute',
      specificity: [1_000_000, 0, 0],
    }))
  ));
}

function expandCssDeclaration(
  document: Document,
  declaration: IndexedCssDeclaration,
): IndexedCssDeclaration[] {
  if (declaration.property.startsWith('--')) return [declaration];
  const longhands = SHORTHAND_LONGHANDS[declaration.property];
  if (!longhands) return [declaration];
  const scratch = document.createElement('span').style;
  scratch.setProperty(declaration.property, declaration.value, declaration.important ? 'important' : '');
  const expanded = longhands.flatMap((property): IndexedCssDeclaration[] => {
    const value = scratch.getPropertyValue(property).trim();
    return value ? [{ ...declaration, property, value }] : [];
  });
  return expanded.length > 0 ? expanded : [declaration];
}

function getMeaningfulTargetCandidates(candidates: CssCascadeCandidate[]): CssCascadeCandidate[] {
  const standard = candidates.filter((candidate) => !candidate.property.startsWith('--'));
  return standard.length > 0 ? standard : candidates;
}

function matchIndexedRule(rule: IndexedCssSelectorRule, element: HTMLElement): ConditionalRuleMatch {
  const inactiveConditions: CssRuleCondition[] = [];
  const unknownConditions: CssRuleCondition[] = [];
  for (const condition of rule.conditions) {
    const active = isCssRuleConditionActive(condition, element.ownerDocument.defaultView);
    if (active === false) inactiveConditions.push(condition);
    if (active === null) unknownConditions.push(condition);
  }
  let selectorMatched = false;
  if (rule.selectedElementClassName) {
    selectorMatched = element.classList.contains(rule.selectedElementClassName);
  } else if (selectorRequiresExternalDomInspection(rule.selector)) {
    unknownConditions.push({ kind: 'unknown', text: rule.selector });
  } else {
    try {
      selectorMatched = element.matches(rule.selector);
    } catch {
      unknownConditions.push({ kind: 'unknown', text: rule.selector });
    }
  }
  return { inactiveConditions, selectorMatched, unknownConditions };
}

function selectorRequiresExternalDomInspection(selector: string): boolean {
  const compactSelector = selector.replace(/,\s+/g, ',');
  return (
    compactSelector.length > 512 ||
    compactSelector.includes('::') ||
    compactSelector.includes(':has(') ||
    /[\s>+~]/.test(compactSelector)
  );
}

function isCssRuleConditionActive(
  condition: CssRuleCondition,
  ownerWindow: Window | null,
): boolean | null {
  if (condition.active !== undefined) return condition.active;
  if (!ownerWindow) return null;
  if (condition.kind === 'media') {
    try {
      return ownerWindow.matchMedia(condition.text).matches;
    } catch {
      return null;
    }
  }
  if (condition.kind === 'supports') {
    try {
      return (ownerWindow as Window & typeof globalThis).CSS.supports(condition.text);
    } catch {
      return null;
    }
  }
  return null;
}

function compareCascadeCandidates(
  left: CssCascadeCandidate,
  right: CssCascadeCandidate,
  layerOrder: Map<string, number>,
): number {
  if (left.important !== right.important) return left.important ? 1 : -1;
  const layerComparison = compareCascadeLayers(left, right, layerOrder);
  if (layerComparison !== 0) return layerComparison;
  const specificityComparison = compareSpecificity(left.specificity, right.specificity);
  if (specificityComparison !== 0) return specificityComparison;
  return left.order - right.order;
}

function compareCascadeLayers(
  left: CssCascadeCandidate,
  right: CssCascadeCandidate,
  layerOrder: Map<string, number>,
): number {
  if (left.layerName === right.layerName) return 0;
  if (left.important) {
    if (left.layerName === null) return -1;
    if (right.layerName === null) return 1;
    return (layerOrder.get(right.layerName) ?? Number.MAX_SAFE_INTEGER) -
      (layerOrder.get(left.layerName) ?? Number.MAX_SAFE_INTEGER);
  }
  if (left.layerName === null) return 1;
  if (right.layerName === null) return -1;
  return (layerOrder.get(left.layerName) ?? -1) - (layerOrder.get(right.layerName) ?? -1);
}

function compareSpecificity(left: CssSpecificity, right: CssSpecificity): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

function calculateCssSpecificity(selector: string): CssSpecificity {
  let ids = 0;
  let classes = 0;
  let types = 0;
  let index = 0;

  while (index < selector.length) {
    const character = selector[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === '"' || character === "'") {
      index = skipCssString(selector, index);
      continue;
    }
    if (character === '#') {
      ids += 1;
      index = skipCssIdentifier(selector, index + 1);
      continue;
    }
    if (character === '.') {
      classes += 1;
      index = skipCssIdentifier(selector, index + 1);
      continue;
    }
    if (character === '[') {
      classes += 1;
      index = skipCssBalanced(selector, index, '[', ']');
      continue;
    }
    if (character === ':') {
      if (selector[index + 1] === ':') {
        types += 1;
        index = skipCssIdentifier(selector, index + 2);
        continue;
      }
      const nameStart = index + 1;
      const nameEnd = skipCssIdentifier(selector, nameStart);
      const name = selector.slice(nameStart, nameEnd).toLowerCase();
      if (selector[nameEnd] === '(') {
        const end = skipCssBalanced(selector, nameEnd, '(', ')');
        const content = selector.slice(nameEnd + 1, Math.max(nameEnd + 1, end - 1));
        if (name !== 'where') {
          classes += 1;
          if (name === 'is' || name === 'not' || name === 'has') {
            const nested = maxSpecificity(splitSelectorList(content).map(calculateCssSpecificity));
            ids += nested[0];
            classes += nested[1] - 1;
            types += nested[2];
          }
        }
        index = end;
        continue;
      }
      classes += 1;
      index = nameEnd;
      continue;
    }
    if (
      isCssIdentifierStart(character) &&
      (index === 0 || /[\s>+~,(|]/.test(selector[index - 1] ?? ''))
    ) {
      const nameEnd = skipCssIdentifier(selector, index);
      if (selector.slice(index, nameEnd) !== '*') types += 1;
      index = nameEnd;
      continue;
    }
    index += 1;
  }

  return [ids, classes, types];
}

function maxSpecificity(values: CssSpecificity[]): CssSpecificity {
  return values.reduce<CssSpecificity>(
    (current, candidate) => compareSpecificity(current, candidate) >= 0 ? current : candidate,
    [0, 0, 0],
  );
}

function selectorContainsClass(
  selector: string,
  className: string,
  ownerWindow: Window | null,
): boolean {
  const escaped = ownerWindow
    ? (ownerWindow as Window & typeof globalThis).CSS.escape(className)
    : fallbackCssEscape(className);
  const needle = `.${escaped}`;
  let index = selector.indexOf(needle);
  while (index >= 0) {
    const next = selector[index + needle.length] ?? '';
    if (!next || (next !== '\\' && !isCssIdentifierCharacter(next))) return true;
    index = selector.indexOf(needle, index + needle.length);
  }
  return false;
}

function splitSelectorList(value: string): string[] {
  const results: string[] = [];
  let start = 0;
  let squareDepth = 0;
  let roundDepth = 0;
  let quote: string | null = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '\\') {
      index += 1;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[') squareDepth += 1;
    if (character === ']') squareDepth = Math.max(0, squareDepth - 1);
    if (character === '(') roundDepth += 1;
    if (character === ')') roundDepth = Math.max(0, roundDepth - 1);
    if (character === ',' && squareDepth === 0 && roundDepth === 0) {
      const selector = value.slice(start, index).trim();
      if (selector) results.push(selector);
      start = index + 1;
    }
  }
  const tail = value.slice(start).trim();
  if (tail) results.push(tail);
  return results;
}

function isConditionalClassToken(className: string): boolean {
  return getClassVariants(className).some((variant) => {
    const normalized = variant.replace(/^!?@/, '').toLowerCase();
    const prefix = normalized.split(/[-[]/, 1)[0] ?? normalized;
    return (
      CONDITIONAL_VARIANT_PREFIXES.has(normalized) ||
      CONDITIONAL_VARIANT_PREFIXES.has(prefix) ||
      normalized.startsWith('max-') ||
      normalized.startsWith('min-') ||
      normalized.startsWith('@')
    );
  });
}

function getClassVariants(className: string): string[] {
  const variants: string[] = [];
  let start = className.startsWith('!') ? 1 : 0;
  let squareDepth = 0;
  let roundDepth = 0;
  for (let index = start; index < className.length; index += 1) {
    const character = className[index];
    if (character === '\\') {
      index += 1;
      continue;
    }
    if (character === '[') squareDepth += 1;
    if (character === ']') squareDepth = Math.max(0, squareDepth - 1);
    if (character === '(') roundDepth += 1;
    if (character === ')') roundDepth = Math.max(0, roundDepth - 1);
    if (character === ':' && squareDepth === 0 && roundDepth === 0) {
      variants.push(className.slice(start, index));
      start = index + 1;
    }
  }
  return variants;
}

function getInactiveClassReason(className: string, conditions: CssRuleCondition[]): string {
  const media = conditions.find((condition) => condition.kind === 'media');
  if (media) return `Inactive at the current breakpoint (${media.text}).`;
  const variants = getClassVariants(className).map((variant) => variant.toLowerCase());
  if (variants.some((variant) => variant.startsWith('hover') || variant.includes('group-hover') || variant.includes('peer-hover'))) {
    return 'Inactive until the current hover condition is active.';
  }
  if (variants.some((variant) => variant.startsWith('focus'))) {
    return 'Inactive until the current focus condition is active.';
  }
  if (variants.some((variant) => variant.startsWith('data-') || variant.includes('group-data-') || variant.includes('peer-data-'))) {
    return 'Inactive for the selected root’s current data-* state.';
  }
  if (variants.some((variant) => variant.startsWith('aria-') || variant.includes('group-aria-') || variant.includes('peer-aria-'))) {
    return 'Inactive for the selected root’s current aria-* state.';
  }
  return 'Inactive in the current breakpoint or interaction state.';
}

function formatAppliedReason(properties: string[]): string {
  if (properties.length === 1) {
    return `Applied to ${properties[0]} in the selected root’s current cascade.`;
  }
  return `Applied to ${properties.length} properties in the selected root’s current cascade.`;
}

function formatPropertyList(properties: string[]): string {
  if (properties.length <= 3) return properties.join(', ');
  return `${properties.slice(0, 3).join(', ')} and ${properties.length - 3} more`;
}

function pickRepresentativeWinner(
  winners: Map<string, CssCascadeCandidate>,
): CssCascadeCandidate | null {
  const candidates = [...winners.values()];
  return candidates.find((candidate) => candidate.important) ?? candidates[0] ?? null;
}

function formatOverrideWinner(
  winner: CssCascadeCandidate | null,
  componentName: string | null | undefined,
  element: HTMLElement,
): string {
  if (!winner) return 'another active rule';
  if (winner.selector === 'style attribute') return 'an inline style';
  const componentRule = formatComponentRuleLabel(winner.selector, componentName, element);
  const label = componentRule ?? `“${truncateText(winner.selector, 88)}”`;
  const important = winner.important ? ' !important' : '';
  const layer = winner.layerName ? ` in @layer ${winner.layerName}` : '';
  return `${label}${important} rule${layer}`;
}

function formatComponentRuleLabel(
  selector: string,
  componentName: string | null | undefined,
  element: HTMLElement,
): string | null {
  if (!componentName) return null;
  const stateProps = ['variant', 'size', 'shape'].flatMap((name): string[] => {
    const attribute = `data-${name}`;
    const value = element.getAttribute(attribute);
    return value && selector.includes(`[${attribute}`) ? [`${name}=${value}`] : [];
  });
  return stateProps.length > 0 ? `${componentName}[${stateProps.join(',')}]` : null;
}

function isLayerStatementRule(cssText: string): boolean {
  return /^@layer\s+[^{}]+;$/i.test(cssText);
}

function parseLayerStatementNames(cssText: string, parentLayerName: string | null): string[] {
  const names = cssText.replace(/^@layer\s+/i, '').replace(/;$/, '').split(',').map((name) => name.trim()).filter(Boolean);
  return names.map((name) => parentLayerName ? `${parentLayerName}.${name}` : name);
}

function getLayerBlockName(
  rule: CSSRule,
  parentLayerName: string | null,
): string | null {
  const constructorName = rule.constructor?.name ?? '';
  if (constructorName !== 'CSSLayerBlockRule') return null;
  const ownName = (rule as CSSRule & { name?: string }).name?.trim() ?? null;
  if (!ownName) return null;
  return parentLayerName ? `${parentLayerName}.${ownName}` : ownName;
}

function getCssRuleCondition(rule: CSSRule): CssRuleCondition | null {
  const constructorName = rule.constructor?.name ?? '';
  if (constructorName === 'CSSMediaRule') {
    return { kind: 'media', text: (rule as CSSMediaRule).conditionText };
  }
  if (constructorName === 'CSSSupportsRule') {
    return { kind: 'supports', text: (rule as CSSSupportsRule).conditionText };
  }
  if (constructorName === 'CSSContainerRule') {
    return {
      kind: 'container',
      text: (rule as CSSRule & { conditionText?: string }).conditionText ?? '@container',
    };
  }
  if (constructorName === 'CSSScopeRule') {
    return { kind: 'scope', text: '@scope' };
  }
  if (constructorName === 'CSSStartingStyleRule') {
    return { kind: 'starting-style', text: '@starting-style' };
  }
  return constructorName === 'CSSLayerBlockRule'
    ? null
    : { kind: 'unknown', text: constructorName || 'unknown grouping rule' };
}

function getNestedCssRules(rule: CSSRule): CSSRuleList | null {
  const nested = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
  return nested ?? null;
}

function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return typeof (rule as CSSStyleRule).selectorText === 'string' && Boolean((rule as CSSStyleRule).style);
}

function addLayerName(layerNames: string[], name: string) {
  if (!layerNames.includes(name)) layerNames.push(name);
}

function skipCssString(value: string, start: number): number {
  const quote = value[start];
  for (let index = start + 1; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
      continue;
    }
    if (value[index] === quote) return index + 1;
  }
  return value.length;
}

function skipCssBalanced(value: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let index = start; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
      continue;
    }
    if (value[index] === '"' || value[index] === "'") {
      index = skipCssString(value, index) - 1;
      continue;
    }
    if (value[index] === open) depth += 1;
    if (value[index] === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return value.length;
}

function skipCssIdentifier(value: string, start: number): number {
  let index = start;
  while (index < value.length) {
    if (value[index] === '\\') {
      index += 2;
      continue;
    }
    if (!isCssIdentifierCharacter(value[index])) break;
    index += 1;
  }
  return index;
}

function isCssIdentifierStart(value: string): boolean {
  return /[A-Za-z_*|-]/.test(value);
}

function isCssIdentifierCharacter(value: string): boolean {
  return /[A-Za-z0-9_-]/.test(value);
}

function fallbackCssEscape(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, (character) => `\\${character}`);
}

function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
