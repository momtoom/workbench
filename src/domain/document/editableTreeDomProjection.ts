import type {
  InspectorField,
  TokenReference,
  TokenRegistry,
} from '@domain/design-system/tokens/types';
import { queryTokens } from '@domain/design-system/tokens/query';
import { normalizeEditableSourceAttributeValue } from './sourceAttributeSafety';
import { SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES } from './sourceVideoBackground';
import type {
  EditableDocumentTree,
  EditableTreeNode,
  EditableTreeSourceStyleDeclarations,
  EditableTreeTokenBindingReferences,
  EditableTreeTokenBindings,
} from './editableTree';

export type EditableTreeDomProjectionInput = {
  label: string;
  previewTokenModes?: Partial<Record<string, string>>;
  projectionId?: string;
  rootElement: HTMLElement;
  sourceFile: string;
  tokenRegistry?: TokenRegistry;
};

const RUNTIME_NODE_ID_ATTRIBUTE = 'data-wb-runtime-node-id';
const RUNTIME_NODE_SELECTED_CLASS = 'wb-runtime-design-node--selected';
const RUNTIME_APPLIED_ATTRIBUTES_ATTRIBUTE = 'data-wb-runtime-applied-attrs';
const RUNTIME_APPLIED_STYLES_ATTRIBUTE = 'data-wb-runtime-applied-styles';

const TOKEN_BINDING_ATTRIBUTES: Record<keyof EditableTreeTokenBindings, string> = {
  background: 'data-wb-bg-token',
  radius: 'data-wb-radius-token',
  spacing: 'data-wb-spacing-token',
  fontSize: 'data-wb-font-size-token',
  text: 'data-wb-text-token',
};

const TOKEN_BINDING_COLLECTION_ATTRIBUTES: Record<keyof EditableTreeTokenBindings, string> = {
  background: 'data-wb-bg-token-collection',
  radius: 'data-wb-radius-token-collection',
  spacing: 'data-wb-spacing-token-collection',
  fontSize: 'data-wb-font-size-token-collection',
  text: 'data-wb-text-token-collection',
};

const RUNTIME_CSS_VARIABLE_ALIASES: Record<string, string> = {};

const CAPTURED_STYLE_PROPERTIES = [
  ...SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES,
  'align-content',
  'align-items',
  'align-self',
  'aspect-ratio',
  'backdrop-filter',
  'background',
  'background-attachment',
  'background-blend-mode',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'border',
  'border-bottom',
  'border-bottom-color',
  'border-bottom-style',
  'border-bottom-width',
  'border-color',
  'border-left',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-right',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-style',
  'border-top',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-width',
  'bottom',
  'box-shadow',
  'box-sizing',
  'color',
  'display',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'gap',
  'grid-column',
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'inset',
  'isolation',
  'justify-content',
  'justify-items',
  'left',
  'letter-spacing',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'mask-image',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'mix-blend-mode',
  'object-fit',
  'object-position',
  'opacity',
  'outline',
  'outline-color',
  'outline-offset',
  'outline-style',
  'outline-width',
  'overflow',
  'overflow-x',
  'overflow-y',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'place-items',
  'position',
  'right',
  'text-align',
  'text-decoration',
  'text-overflow',
  'text-transform',
  'top',
  'transform',
  'transition',
  'user-select',
  'visibility',
  '-webkit-backdrop-filter',
  '-webkit-mask-image',
  'white-space',
  'width',
  'z-index',
] as const;

export function createEditableDocumentTreeFromDomProjection({
  label,
  previewTokenModes,
  projectionId,
  rootElement,
  sourceFile,
  tokenRegistry,
}: EditableTreeDomProjectionInput): EditableDocumentTree | null {
  const context: RuntimeProjectionCaptureContext = {
    tokenLookup: createRuntimeTokenLookup(tokenRegistry, previewTokenModes),
  };
  const runtimeIdScope = projectionId ?? sourceFile;
  const children: EditableTreeNode[] = [];
  Array.from(rootElement.children).forEach((element) => {
    const node = createEditableTreeNodeFromElement(element, sourceFile, runtimeIdScope, [children.length], context);
    if (node) children.push(node);
  });

  if (children.length === 0) return null;

  return {
    id: `runtime:${sanitizeNodeId(runtimeIdScope)}`,
    label,
    root: children.length === 1
      ? children[0]!
      : {
          id: getRuntimeNodeId(runtimeIdScope, []),
          label,
          kind: 'frame',
          children,
          source: {
            sourceFile,
            jsxName: 'RuntimeStory',
          },
        },
  };
}

export function getRuntimeDesignNodeIdFromEventTarget(
  target: EventTarget | null,
  options: { mode?: 'deep' | 'direct' | 'exact' | 'smart-deep'; rootElement?: HTMLElement | null } = {},
): string | null {
  if (!isRuntimeDomElement(target)) return null;
  const closestRuntimeNode = target.closest<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`);
  if (!closestRuntimeNode) return null;
  if (options.rootElement && !options.rootElement.contains(closestRuntimeNode)) return null;

  const selectionElement = options.rootElement
    ? getRuntimeSelectionElement(closestRuntimeNode, options.rootElement, options.mode)
    : closestRuntimeNode;
  return selectionElement.getAttribute(RUNTIME_NODE_ID_ATTRIBUTE);
}

export function getRuntimeDesignNodeIdFromPoint(
  rootElement: HTMLElement | null,
  point: { clientX: number; clientY: number },
  options: { mode?: 'deep' | 'direct' | 'exact' | 'smart-deep' } = {},
): string | null {
  if (!rootElement) return null;

  const stackedElement = getRuntimeElementFromVisualPoint(rootElement, point);
  const hitElements = Array.from(rootElement.querySelectorAll<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`));
  if (rootElement.hasAttribute(RUNTIME_NODE_ID_ATTRIBUTE)) hitElements.push(rootElement);
  if (stackedElement) hitElements.push(stackedElement);
  const candidates = Array.from(new Set(hitElements))
    .flatMap((element) => getRuntimeElementHitRects(element)
      .filter((rect) => isPointInsideRuntimeRect(rect, point))
      .map((rect) => ({
        area: rect.width * rect.height,
        depth: getRuntimeElementDepth(rootElement, element),
        element,
      })));
  if (candidates.length === 0) return null;

  const sortedCandidates = candidates.sort((left, right) => (
    left.area - right.area ||
    right.depth - left.depth
  ));

  const candidate = sortedCandidates[0]?.element ?? null;
  return candidate
    ? getRuntimeSelectionElement(candidate, rootElement, options.mode).getAttribute(RUNTIME_NODE_ID_ATTRIBUTE)
    : null;
}

function getRuntimeSelectionElement(
  element: Element,
  rootElement: HTMLElement,
  mode: 'deep' | 'direct' | 'exact' | 'smart-deep' = 'direct',
): Element {
  if (mode === 'deep' || mode === 'exact') return element;
  const visualLeaf = getRuntimeVisualLeafSelectionElement(element, rootElement);
  if (mode === 'smart-deep') return getRuntimeSingleChildChainSelectionElement(visualLeaf, rootElement);
  if (!isRuntimeBackgroundLikeOverlayElement(visualLeaf)) return visualLeaf;
  const parentRuntimeElement = visualLeaf.parentElement?.closest<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`) ?? null;
  return parentRuntimeElement && rootElement.contains(parentRuntimeElement) ? parentRuntimeElement : visualLeaf;
}

function getRuntimeSingleChildChainSelectionElement(
  element: Element,
  rootElement: HTMLElement,
): Element {
  let current = element;
  while (current !== rootElement) {
    const parentRuntimeElement = current.parentElement?.closest<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`) ?? null;
    if (!parentRuntimeElement || !rootElement.contains(parentRuntimeElement)) return current;
    const siblingRuntimeElements = Array.from(parentRuntimeElement.children)
      .filter((child) => isRuntimeDomElement(child) && child.hasAttribute(RUNTIME_NODE_ID_ATTRIBUTE));
    if (siblingRuntimeElements.length !== 1 || siblingRuntimeElements[0] !== current) return current;
    current = parentRuntimeElement;
  }
  return current;
}

function getRuntimeVisualLeafSelectionElement(element: Element, rootElement: HTMLElement): Element {
  const svgElement = element.matches(`svg[${RUNTIME_NODE_ID_ATTRIBUTE}]`)
    ? element
    : element.closest<Element>(`svg[${RUNTIME_NODE_ID_ATTRIBUTE}]`);
  return svgElement && rootElement.contains(svgElement) ? svgElement : element;
}

function isRuntimeBackgroundLikeOverlayElement(element: Element): boolean {
  if (element.matches('img, video, canvas, svg, button, input, select, textarea, [contenteditable="true"], [contenteditable=""]')) {
    return false;
  }
  if (element.textContent?.trim()) return false;
  const parentRuntimeElement = element.parentElement?.closest<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`) ?? null;
  if (!parentRuntimeElement) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!style || (style.position !== 'absolute' && style.position !== 'fixed')) return false;
  return doesRuntimeElementCoverParent(element, parentRuntimeElement);
}

function doesRuntimeElementCoverParent(element: Element, parent: Element): boolean {
  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  if (elementRect.width <= 0 || elementRect.height <= 0 || parentRect.width <= 0 || parentRect.height <= 0) return false;
  const widthCoverage = elementRect.width / parentRect.width;
  const heightCoverage = elementRect.height / parentRect.height;
  const centerX = parentRect.left + parentRect.width / 2;
  const centerY = parentRect.top + parentRect.height / 2;
  return (
    widthCoverage >= 0.85 &&
    heightCoverage >= 0.85 &&
    centerX >= elementRect.left &&
    centerX <= elementRect.right &&
    centerY >= elementRect.top &&
    centerY <= elementRect.bottom
  );
}

function getRuntimeElementFromVisualPoint(
  rootElement: HTMLElement,
  point: { clientX: number; clientY: number },
): Element | null {
  const ownerDocument = rootElement.ownerDocument;
  const elementsFromPoint = typeof ownerDocument.elementsFromPoint === 'function'
    ? ownerDocument.elementsFromPoint(point.clientX, point.clientY)
    : [];
  for (const element of elementsFromPoint) {
    if (!isRuntimeDomElement(element) || !rootElement.contains(element)) continue;
    const runtimeElement = element.closest<Element>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`);
    if (!runtimeElement || !rootElement.contains(runtimeElement)) continue;
    if (isRuntimeElementAtPoint(runtimeElement, point)) return runtimeElement;
  }

  return null;
}

function isRuntimeElementAtPoint(
  element: Element,
  point: { clientX: number; clientY: number },
): boolean {
  return getRuntimeElementHitRects(element).some((rect) => isPointInsideRuntimeRect(rect, point));
}

function isPointInsideRuntimeRect(
  rect: DOMRect,
  point: { clientX: number; clientY: number },
): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    point.clientX >= rect.left &&
    point.clientX <= rect.right &&
    point.clientY >= rect.top &&
    point.clientY <= rect.bottom
  );
}

function getRuntimeElementHitRects(element: Element): DOMRect[] {
  const ownRects = Array.from(element.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (ownRects.length > 0) return ownRects;

  const childRects = Array.from(element.children)
    .flatMap((child) => isRuntimeDomElement(child) ? getRuntimeElementHitRects(child) : [])
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (childRects.length === 0) return [];

  const left = Math.min(...childRects.map((rect) => rect.left));
  const top = Math.min(...childRects.map((rect) => rect.top));
  const right = Math.max(...childRects.map((rect) => rect.right));
  const bottom = Math.max(...childRects.map((rect) => rect.bottom));
  return [DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top })];
}

function getRuntimeElementDepth(rootElement: HTMLElement, element: Element): number {
  let depth = 0;
  let current = element.parentElement;
  while (current && current !== rootElement) {
    if (current.hasAttribute(RUNTIME_NODE_ID_ATTRIBUTE)) depth += 1;
    current = current.parentElement;
  }
  return depth;
}

export function markRuntimeDesignSelection(rootElement: HTMLElement, selectedLayerId: string | null) {
  rootElement.querySelectorAll(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`).forEach((element) => {
    element.classList.toggle(
      RUNTIME_NODE_SELECTED_CLASS,
      selectedLayerId !== null && element.getAttribute(RUNTIME_NODE_ID_ATTRIBUTE) === selectedLayerId,
    );
  });
}

export function applyRuntimeDesignTreeToDom(rootElement: HTMLElement, tree: EditableDocumentTree | null) {
  if (!tree) return;

  visitEditableTreeNode(tree.root, (node) => {
    const element = findRuntimeElement(rootElement, node.id);
    if (!element) return;

    const nextStyleProperties = new Set(Object.keys(node.sourceStyleDeclarations ?? {}));
    for (const property of getRuntimeAppliedNames(element, RUNTIME_APPLIED_STYLES_ATTRIBUTE)) {
      if (!nextStyleProperties.has(property)) element.style.removeProperty(property);
    }
    for (const [property, value] of Object.entries(node.sourceStyleDeclarations ?? {})) {
      element.style.setProperty(property, value);
    }
    setRuntimeAppliedNames(element, RUNTIME_APPLIED_STYLES_ATTRIBUTE, nextStyleProperties);

    const nextAttributeNames = new Set<string>();
    for (const [attribute, value] of Object.entries(node.sourceAttributes ?? {})) {
      if (attribute === 'class' || attribute === 'style') continue;
      const normalizedValue = normalizeEditableSourceAttributeValue(attribute, value, { allowEmpty: false });
      if (normalizedValue === null) continue;
      nextAttributeNames.add(attribute);
      element.setAttribute(attribute, normalizedValue);
    }
    for (const attribute of getRuntimeAppliedNames(element, RUNTIME_APPLIED_ATTRIBUTES_ATTRIBUTE)) {
      if (!nextAttributeNames.has(attribute)) element.removeAttribute(attribute);
    }
    setRuntimeAppliedNames(element, RUNTIME_APPLIED_ATTRIBUTES_ATTRIBUTE, nextAttributeNames);

    for (const field of Object.keys(TOKEN_BINDING_ATTRIBUTES) as Array<keyof EditableTreeTokenBindings>) {
      element.removeAttribute(TOKEN_BINDING_ATTRIBUTES[field]);
      element.removeAttribute(TOKEN_BINDING_COLLECTION_ATTRIBUTES[field]);
      const tokenId = node.tokenBindings?.[field];
      const reference = node.tokenBindingReferences?.[field];
      if (tokenId) element.setAttribute(TOKEN_BINDING_ATTRIBUTES[field], tokenId);
      if (reference?.collectionId) element.setAttribute(TOKEN_BINDING_COLLECTION_ATTRIBUTES[field], reference.collectionId);
    }
  });
}

function getRuntimeAppliedNames(element: Element, attributeName: string): Set<string> {
  return new Set(
    (element.getAttribute(attributeName) ?? '')
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function setRuntimeAppliedNames(element: Element, attributeName: string, names: Set<string>) {
  if (names.size === 0) {
    element.removeAttribute(attributeName);
    return;
  }
  element.setAttribute(attributeName, [...names].sort().join(' '));
}

function createEditableTreeNodeFromElement(
  element: Element,
  sourceFile: string,
  runtimeIdScope: string,
  path: number[],
  context: RuntimeProjectionCaptureContext,
): EditableTreeNode | null {
  if (!isRuntimeStyledElement(element)) return null;
  if (isNonVisualRuntimeElement(element)) return null;

  const id = getRuntimeNodeId(runtimeIdScope, path);
  element.setAttribute(RUNTIME_NODE_ID_ATTRIBUTE, id);

  const childNodes = createEditableTreeChildNodes(element, sourceFile, runtimeIdScope, path, context);
  const jsxName = element.tagName.toLowerCase();
  const componentName = element.getAttribute('data-wb-component');
  const label = componentName || getElementAriaLabel(element) || jsxName;

  return {
    id,
    label,
    kind: getElementKind(element),
    ...(childNodes.length > 0 ? { children: childNodes } : {}),
    source: {
      sourceFile,
      jsxName,
    },
    ...getElementSourceAttributes(element),
    ...getElementSourceStyleDeclarations(element),
    ...getElementTokenBindings(element, context),
  };
}

function isNonVisualRuntimeElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'style' || tagName === 'script' || tagName === 'template' || tagName === 'link';
}

function isRuntimeDomElement(value: unknown): value is Element {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value as Node).nodeType === 1 &&
    typeof (value as Element).closest === 'function' &&
    typeof (value as Element).matches === 'function',
  );
}

function isRuntimeStyledElement(element: Element): element is HTMLElement | SVGElement {
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow) return element instanceof HTMLElement || element instanceof SVGElement;
  return element instanceof ownerWindow.HTMLElement || element instanceof ownerWindow.SVGElement;
}

function createEditableTreeChildNodes(
  element: Element,
  sourceFile: string,
  runtimeIdScope: string,
  parentPath: number[],
  context: RuntimeProjectionCaptureContext,
): EditableTreeNode[] {
  const children: EditableTreeNode[] = [];

  element.childNodes.forEach((child) => {
    const childPath = [...parentPath, children.length];
    if (isRuntimeDomElement(child)) {
      const node = createEditableTreeNodeFromElement(child, sourceFile, runtimeIdScope, childPath, context);
      if (node) children.push(node);
      return;
    }

    if (child.nodeType === 3) {
      const text = normalizeText(child.textContent ?? '');
      if (!text) return;
      children.push({
        id: `${getRuntimeNodeId(runtimeIdScope, childPath)}:text`,
        label: text.length > 40 ? `${text.slice(0, 37)}...` : text,
        kind: 'text',
        textContent: text,
        source: {
          sourceFile,
          jsxName: 'text',
        },
      });
    }
  });

  return children;
}

function getElementKind(element: Element): EditableTreeNode['kind'] {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'span' || tagName === 'p' || /^h[1-6]$/.test(tagName) || tagName === 'label') return 'text';
  return 'frame';
}

function getElementSourceAttributes(element: Element): Pick<EditableTreeNode, 'sourceAttributes'> {
  const attributes = Object.fromEntries(
    Array.from(element.attributes)
      .flatMap((attribute): Array<[string, string]> => {
        if (
          attribute.name.startsWith('data-react') ||
          attribute.name === 'class' ||
          attribute.name === 'style'
        ) {
          return [];
        }

        const normalizedValue = normalizeEditableSourceAttributeValue(attribute.name, attribute.value, { allowEmpty: true });
        return normalizedValue === null ? [] : [[attribute.name, normalizedValue]];
      }),
  );
  return Object.keys(attributes).length > 0 ? { sourceAttributes: attributes } : {};
}

function getElementSourceStyleDeclarations(element: Element): Pick<EditableTreeNode, 'sourceStyleDeclarations'> {
  const styles = getRuntimeComputedStyle(element);
  const authoredStyles = getAuthoredStyleDeclarations(element);
  const declarations: EditableTreeSourceStyleDeclarations = {};

  for (const property of CAPTURED_STYLE_PROPERTIES) {
    const authoredValue = authoredStyles[property];
    const value = authoredValue ?? styles.getPropertyValue(property).trim();
    if (!value || shouldSkipCapturedStyle(property, value)) continue;
    declarations[property] = value;
  }

  return Object.keys(declarations).length > 0 ? { sourceStyleDeclarations: declarations } : {};
}

function getRuntimeComputedStyle(element: Element): CSSStyleDeclaration {
  return (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
}

function shouldSkipCapturedStyle(property: string, value: string): boolean {
  if (value === 'normal' || value === 'none' || value === 'auto' || value === 'inherit' || value === 'initial') return true;
  if (value === '0px' || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return true;
  if (property === 'background-attachment' && value === 'scroll') return true;
  if (property === 'display' && value === 'block') return true;
  if (property === 'opacity' && value === '1') return true;
  if (property === 'text-decoration' && value.startsWith('none')) return true;
  if (property === 'visibility' && value === 'visible') return true;
  return false;
}

function getElementTokenBindings(
  element: Element,
  context: RuntimeProjectionCaptureContext,
): { tokenBindingReferences?: EditableTreeTokenBindingReferences; tokenBindings: EditableTreeTokenBindings } | Record<string, never> {
  const tokenBindings: EditableTreeTokenBindings = {};
  const tokenBindingReferences: EditableTreeTokenBindingReferences = {};

  for (const field of Object.keys(TOKEN_BINDING_ATTRIBUTES) as Array<keyof EditableTreeTokenBindings>) {
    const tokenId = element.getAttribute(TOKEN_BINDING_ATTRIBUTES[field]);
    if (!tokenId) continue;

    tokenBindings[field] = tokenId;
    const collectionId = element.getAttribute(TOKEN_BINDING_COLLECTION_ATTRIBUTES[field]);
    if (collectionId) {
      tokenBindingReferences[field] = { collectionId, tokenId };
    }
  }

  const authoredStyles = getAuthoredStyleDeclarations(element);
  for (const [property, value] of Object.entries(authoredStyles)) {
    const bindingField = TOKEN_BINDING_STYLE_PROPERTIES[property as CapturedStyleProperty];
    if (!bindingField || tokenBindings[bindingField]) continue;

    const inspectorField = INSPECTOR_FIELD_BY_STYLE_PROPERTY[property as CapturedStyleProperty];
    if (!inspectorField) continue;

    const reference = context.tokenLookup?.get(inspectorField)?.get(value);
    if (!reference) continue;

    tokenBindings[bindingField] = reference.tokenId;
    tokenBindingReferences[bindingField] = reference;
  }

  return Object.keys(tokenBindings).length > 0
    ? {
        ...(Object.keys(tokenBindingReferences).length > 0 ? { tokenBindingReferences } : {}),
        tokenBindings,
      }
    : {};
}

type CapturedStyleProperty = typeof CAPTURED_STYLE_PROPERTIES[number];

type RuntimeProjectionCaptureContext = {
  tokenLookup: RuntimeTokenLookup | null;
};

type RuntimeTokenLookup = Map<InspectorField, Map<string, TokenReference>>;

const INSPECTOR_FIELD_BY_STYLE_PROPERTY: Partial<Record<CapturedStyleProperty, InspectorField>> = {
  background: 'bgColor',
  'background-color': 'bgColor',
  color: 'textColor',
  'border-color': 'borderColor',
  'border-radius': 'borderRadius',
  'border-bottom-left-radius': 'borderRadius',
  'border-bottom-right-radius': 'borderRadius',
  'border-top-left-radius': 'borderRadius',
  'border-top-right-radius': 'borderRadius',
  'border-width': 'borderWidth',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  gap: 'gap',
  height: 'height',
  'line-height': 'lineHeight',
  margin: 'margin',
  'margin-bottom': 'margin',
  'margin-left': 'margin',
  'margin-right': 'margin',
  'margin-top': 'margin',
  'max-height': 'maxHeight',
  'max-width': 'maxWidth',
  'min-height': 'minHeight',
  'min-width': 'minWidth',
  opacity: 'opacity',
  padding: 'padding',
  'padding-bottom': 'padding',
  'padding-left': 'padding',
  'padding-right': 'padding',
  'padding-top': 'padding',
  width: 'width',
};

const TOKEN_BINDING_STYLE_PROPERTIES: Partial<Record<CapturedStyleProperty, keyof EditableTreeTokenBindings>> = {
  background: 'background',
  'background-color': 'background',
  'border-radius': 'radius',
  'font-size': 'fontSize',
  padding: 'spacing',
};

function createRuntimeTokenLookup(
  registry: TokenRegistry | undefined,
  previewTokenModes: Partial<Record<string, string>> | undefined,
): RuntimeTokenLookup | null {
  if (!registry) return null;

  const lookup: RuntimeTokenLookup = new Map();
  const fields = new Set(Object.values(INSPECTOR_FIELD_BY_STYLE_PROPERTY).filter(Boolean) as InspectorField[]);

  for (const field of fields) {
    const byVariable = new Map<string, TokenReference>();
    for (const result of queryTokens(registry, { field, modeByCollection: previewTokenModes })) {
      if (!result.compatible || !result.cssVariable) continue;
      for (const cssVariable of result.cssVariableAliases) {
        byVariable.set(cssVariable, { collectionId: result.collection.id, tokenId: result.token.id });
      }
    }
    lookup.set(field, byVariable);
  }

  return lookup;
}

function getAuthoredStyleDeclarations(element: Element): EditableTreeSourceStyleDeclarations {
  const declarations: EditableTreeSourceStyleDeclarations = {};
  const customProperties = getAuthoredCustomProperties(element);
  const computedStyles = getRuntimeComputedStyle(element);

  for (const style of getMatchingStyleDeclarations(element)) {
    for (const property of CAPTURED_STYLE_PROPERTIES) {
      const value = style.getPropertyValue(property).trim();
      if (!value) continue;
      declarations[property] = normalizeAuthoredStyleValue(value, customProperties, computedStyles);
    }
  }

  if (isRuntimeStyledElement(element)) {
    for (const property of CAPTURED_STYLE_PROPERTIES) {
      const value = element.style.getPropertyValue(property).trim();
      if (!value) continue;
      declarations[property] = normalizeAuthoredStyleValue(value, customProperties, computedStyles);
    }
  }

  return declarations;
}

function getAuthoredCustomProperties(element: Element): Map<string, string> {
  const properties = new Map<string, string>();
  const knownCustomProperties = new Set<string>();

  for (const style of getMatchingStyleDeclarations(element)) {
    for (let index = 0; index < style.length; index += 1) {
      const property = style.item(index);
      if (!property.startsWith('--')) continue;
      knownCustomProperties.add(property);
      const value = style.getPropertyValue(property).trim();
      if (value) properties.set(property, value);
    }
  }

  if (isRuntimeStyledElement(element)) {
    for (let index = 0; index < element.style.length; index += 1) {
      const property = element.style.item(index);
      if (!property.startsWith('--')) continue;
      knownCustomProperties.add(property);
      const value = element.style.getPropertyValue(property).trim();
      if (value) properties.set(property, value);
    }
  }

  for (const property of getDocumentCustomPropertyNames(element.ownerDocument)) {
    knownCustomProperties.add(property);
  }

  const computedStyles = getRuntimeComputedStyle(element);
  for (const property of knownCustomProperties) {
    const value = computedStyles.getPropertyValue(property).trim();
    if (value) properties.set(property, value);
  }

  return properties;
}

function getDocumentCustomPropertyNames(ownerDocument: Document): string[] {
  const properties = new Set<string>();

  for (const sheet of Array.from(ownerDocument.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectCustomPropertyNames(Array.from(rules), properties);
  }

  return [...properties];
}

function collectCustomPropertyNames(rules: CSSRule[], properties: Set<string>) {
  for (const rule of rules) {
    if (isRuntimeCssStyleRule(rule)) {
      for (let index = 0; index < rule.style.length; index += 1) {
        const property = rule.style.item(index);
        if (property.startsWith('--')) properties.add(property);
      }
      continue;
    }

    if (hasNestedCssRules(rule)) {
      collectCustomPropertyNames(Array.from(rule.cssRules), properties);
    }
  }
}

function isRuntimeCssStyleRule(rule: CSSRule): rule is CSSStyleRule {
  return (
    typeof (rule as CSSStyleRule).selectorText === 'string' &&
    Boolean((rule as CSSStyleRule).style) &&
    typeof (rule as CSSStyleRule).style.getPropertyValue === 'function'
  );
}

function getMatchingStyleDeclarations(element: Element): CSSStyleDeclaration[] {
  const declarations: CSSStyleDeclaration[] = [];

  for (const sheet of Array.from(element.ownerDocument.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectMatchingRuleDeclarations(element, Array.from(rules), declarations);
  }

  return declarations;
}

function collectMatchingRuleDeclarations(
  element: Element,
  rules: CSSRule[],
  declarations: CSSStyleDeclaration[],
) {
  for (const rule of rules) {
    if (isRuntimeCssStyleRule(rule)) {
      if (matchesAnySelector(element, rule.selectorText)) declarations.push(rule.style);
      continue;
    }
    if (hasNestedCssRules(rule)) {
      collectMatchingRuleDeclarations(element, Array.from(rule.cssRules), declarations);
    }
  }
}

function hasNestedCssRules(rule: CSSRule): rule is CSSRule & { cssRules: CSSRuleList } {
  const cssRules = (rule as { cssRules?: unknown }).cssRules;
  return Boolean(cssRules && typeof cssRules === 'object' && typeof (cssRules as CSSRuleList).length === 'number');
}

function matchesAnySelector(element: Element, selectorText: string): boolean {
  return selectorText.split(',').some((selector) => {
    try {
      return element.matches(selector.trim());
    } catch {
      return false;
    }
  });
}

function normalizeAuthoredStyleValue(
  value: string,
  customProperties: Map<string, string>,
  computedStyles: CSSStyleDeclaration,
): string {
  const variable = getSingleCssVariableName(value);
  if (!variable) return value;

  const resolved = resolveWorkbenchCssVariable(variable, customProperties, computedStyles);
  return resolved ? `var(${resolved})` : value;
}

function resolveWorkbenchCssVariable(
  variable: string,
  customProperties: Map<string, string>,
  computedStyles: CSSStyleDeclaration,
  seen = new Set<string>(),
): string | null {
  if (variable.startsWith('--wb-')) return variable;
  if (RUNTIME_CSS_VARIABLE_ALIASES[variable]) return RUNTIME_CSS_VARIABLE_ALIASES[variable];
  if (seen.has(variable)) return null;
  seen.add(variable);

  const value = customProperties.get(variable) ?? computedStyles.getPropertyValue(variable).trim();
  if (!value) return null;

  const nextVariable = getSingleCssVariableName(value);
  return nextVariable ? resolveWorkbenchCssVariable(nextVariable, customProperties, computedStyles, seen) : null;
}

function getSingleCssVariableName(value: string): string | null {
  const match = value.trim().match(/^var\(\s*(--[A-Za-z0-9_-]+)(?:\s*,[\s\S]*)?\)$/);
  return match?.[1] ?? null;
}

function getElementAriaLabel(element: Element): string | null {
  const label = element.getAttribute('aria-label') ?? element.getAttribute('title');
  return label?.trim() || null;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function getRuntimeNodeId(sourceFile: string, path: number[]): string {
  return `runtime:${sanitizeNodeId(sourceFile)}:${path.length > 0 ? path.join('-') : 'root'}`;
}

function sanitizeNodeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'source';
}

function visitEditableTreeNode(node: EditableTreeNode, visit: (node: EditableTreeNode) => void) {
  visit(node);
  for (const child of node.children ?? []) visitEditableTreeNode(child, visit);
}

function findRuntimeElement(rootElement: HTMLElement, nodeId: string): HTMLElement | null {
  for (const element of rootElement.querySelectorAll<HTMLElement>(`[${RUNTIME_NODE_ID_ATTRIBUTE}]`)) {
    if (element.getAttribute(RUNTIME_NODE_ID_ATTRIBUTE) === nodeId) return element;
  }
  return null;
}
