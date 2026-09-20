import type { EditableTreeNodeKind } from '@domain/document/editableTree';
import type { InspectorTokenBindingField } from './inspectorEditService';

export type HtmlInspectorCategory =
  | 'component'
  | 'container'
  | 'interactive'
  | 'media'
  | 'text'
  | 'unknown';

export type HtmlInspectorSectionId =
  | 'accessibility'
  | 'background'
  | 'border'
  | 'content'
  | 'fill'
  | 'flexItem'
  | 'context'
  | 'layout'
  | 'outline'
  | 'size'
  | 'spacing'
  | 'stroke'
  | 'typography'
  | 'appearance';

export type HtmlInspectorContentField =
  | 'controlLabel'
  | 'mediaSource'
  | 'textContent';

export type HtmlInspectorLayoutField =
  | 'boxModel'
  | 'flow'
  | 'size';

export type HtmlInspectorAccessibilityField =
  | 'accessibleName'
  | 'altText'
  | 'nativeSemantics'
  | 'role';

export type HtmlInspectorModel = {
  category: HtmlInspectorCategory;
  elementName: string;
  accessibilityFields: HtmlInspectorAccessibilityField[];
  contentFields: HtmlInspectorContentField[];
  inspectable: boolean;
  layoutFields: HtmlInspectorLayoutField[];
  sections: HtmlInspectorSectionId[];
  sourceBacked: boolean;
  tokenBindingFields: InspectorTokenBindingField[];
};

export type HtmlInspectorModelInput = {
  inspectable?: boolean;
  jsxName?: string | null;
  kind?: EditableTreeNodeKind | null;
  sourceBacked?: boolean;
};

const CONTAINER_TAGS = new Set([
  'article',
  'aside',
  'body',
  'div',
  'fieldset',
  'footer',
  'form',
  'header',
  'li',
  'main',
  'nav',
  'ol',
  'section',
  'ul',
]);

const TEXT_TAGS = new Set([
  'abbr',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'caption',
  'cite',
  'code',
  'data',
  'dd',
  'del',
  'dfn',
  'dt',
  'em',
  'figcaption',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'ins',
  'kbd',
  'label',
  'legend',
  'mark',
  'p',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
]);

const INTERACTIVE_TAGS = new Set([
  'a',
  'button',
  'input',
  'option',
  'select',
  'summary',
  'textarea',
]);

const MEDIA_TAGS = new Set([
  'audio',
  'canvas',
  'iframe',
  'img',
  'picture',
  'svg',
  'video',
]);

const SVG_GRAPHIC_TAGS = new Set([
  'circle',
  'ellipse',
  'g',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'svg',
  'use',
]);

const SVG_DEFINITION_TAGS = new Set([
  'clippath',
  'defs',
  'filter',
  'lineargradient',
  'marker',
  'mask',
  'pattern',
  'radialgradient',
  'stop',
  'symbol',
]);

const VISUAL_TOKEN_BINDING_FIELDS = [
  'background',
  'radius',
  'spacing',
  'fontSize',
] as const satisfies readonly InspectorTokenBindingField[];

export function resolveHtmlInspectorModel(input: HtmlInspectorModelInput): HtmlInspectorModel {
  const elementName = getInspectorElementName(input);
  const hasSelection = Boolean(input.kind ?? input.jsxName);
  const category = hasSelection ? getHtmlInspectorCategory(input.kind ?? null, elementName) : 'unknown';
  const sourceBacked = input.sourceBacked === true;
  const contentFields = getHtmlInspectorContentFields(category, elementName);
  const layoutFields = getHtmlInspectorLayoutFields(category, elementName);
  const accessibilityFields = getHtmlInspectorAccessibilityFields(category);
  const tokenBindingFields = sourceBacked ? getHtmlInspectorTokenBindingFields(category, elementName) : [];

  return {
    category,
    elementName,
    accessibilityFields,
    contentFields,
    inspectable: input.inspectable === true,
    layoutFields,
    sections: getHtmlInspectorSections({
      accessibilityFields,
      category,
      contentFields,
      elementName,
      layoutFields,
      tokenBindingFields,
    }),
    sourceBacked,
    tokenBindingFields,
  };
}

export function formatHtmlInspectorCategory(category: HtmlInspectorCategory): string {
  if (category === 'component') return 'Component';
  if (category === 'container') return 'Container';
  if (category === 'interactive') return 'Interactive';
  if (category === 'media') return 'Media';
  if (category === 'text') return 'Text';
  return 'Unknown';
}

export function getHtmlInspectorTokenBindingFields(
  category: HtmlInspectorCategory,
  elementName = '',
): InspectorTokenBindingField[] {
  if (category === 'unknown') return [];
  if (!canElementOwnVisualStyle(category, elementName)) return [];
  return [...VISUAL_TOKEN_BINDING_FIELDS];
}

export function getHtmlInspectorContentFields(
  category: HtmlInspectorCategory,
  elementName = '',
): HtmlInspectorContentField[] {
  if (category === 'text') return ['textContent'];
  if (category === 'interactive') return ['controlLabel'];
  if (category === 'media' && hasMediaSourceAttribute(elementName)) return ['mediaSource'];
  return [];
}

export function getHtmlInspectorLayoutFields(
  category: HtmlInspectorCategory,
  elementName = '',
): HtmlInspectorLayoutField[] {
  if (category === 'unknown') return [];
  if (!canElementOwnVisualStyle(category, elementName)) return [];
  return ['flow', 'boxModel', 'size'];
}

export function getHtmlInspectorAccessibilityFields(
  category: HtmlInspectorCategory,
): HtmlInspectorAccessibilityField[] {
  if (category === 'interactive') return ['nativeSemantics', 'accessibleName', 'role'];
  if (category === 'container') return ['accessibleName', 'role'];
  if (category === 'media') return ['altText', 'role'];
  if (category === 'text') return ['nativeSemantics'];
  if (category === 'component') return ['role', 'accessibleName'];
  return [];
}

export function isSvgInspectorElementName(elementName: string): boolean {
  const tagName = elementName.trim().toLowerCase();
  return SVG_GRAPHIC_TAGS.has(tagName) || SVG_DEFINITION_TAGS.has(tagName);
}

function getHtmlInspectorSections({
  accessibilityFields,
  category,
  contentFields,
  elementName,
  layoutFields,
  tokenBindingFields,
}: {
  accessibilityFields: HtmlInspectorAccessibilityField[];
  category: HtmlInspectorCategory;
  contentFields: HtmlInspectorContentField[];
  elementName: string;
  layoutFields: HtmlInspectorLayoutField[];
  tokenBindingFields: InspectorTokenBindingField[];
}): HtmlInspectorSectionId[] {
  const hasVisualStyleFields = layoutFields.length > 0 || tokenBindingFields.length > 0;
  const hasTypographyFields = hasTypographyStyleFields(category, elementName);
  const hasVectorFields = hasVectorStyleFields(category, elementName);

  return [
    ...(contentFields.length > 0 ? ['content' as const] : []),
    ...(hasVisualStyleFields ? ['appearance' as const] : []),
    ...(hasTypographyFields ? ['typography' as const] : []),
    ...(hasVisualStyleFields ? ['background' as const] : []),
    ...(hasVisualStyleFields ? ['border' as const] : []),
    ...(hasVectorFields ? ['fill' as const] : []),
    ...(hasVectorFields ? ['stroke' as const] : []),
    ...(hasVisualStyleFields ? ['outline' as const] : []),
    ...(layoutFields.length > 0 ? ['layout' as const] : []),
    ...(layoutFields.length > 0 ? ['spacing' as const] : []),
    ...(layoutFields.length > 0 ? ['size' as const] : []),
    ...(accessibilityFields.length > 0 ? ['accessibility' as const] : []),
    'context',
  ];
}

function hasTypographyStyleFields(category: HtmlInspectorCategory, elementName: string): boolean {
  if (elementName.toLowerCase() === 'text') return false;
  return category === 'container' || category === 'interactive' || category === 'text' || category === 'component';
}

function hasVectorStyleFields(category: HtmlInspectorCategory, elementName: string): boolean {
  return (category === 'media' || category === 'unknown') && SVG_GRAPHIC_TAGS.has(elementName.toLowerCase());
}

function canElementOwnVisualStyle(category: HtmlInspectorCategory, elementName: string): boolean {
  if (category === 'unknown') return false;
  if (category === 'text') return elementName.trim().toLowerCase() !== 'text';
  return true;
}

function hasMediaSourceAttribute(elementName: string): boolean {
  return ['audio', 'iframe', 'img', 'video'].includes(elementName.toLowerCase());
}

function getInspectorElementName(input: HtmlInspectorModelInput): string {
  const jsxName = input.jsxName?.trim();
  if (jsxName) return jsxName;
  if (input.kind === 'component-instance') return 'Component';
  if (input.kind === 'text') return 'Text';
  if (input.kind === 'frame') return 'Frame';
  return 'Element';
}

function getHtmlInspectorCategory(
  kind: EditableTreeNodeKind | null,
  elementName: string,
): HtmlInspectorCategory {
  if (kind === 'component-instance') return 'component';
  if (kind === 'text') return 'text';

  if (isComponentName(elementName)) return 'component';
  const tagName = elementName.toLowerCase();
  if (INTERACTIVE_TAGS.has(tagName)) return 'interactive';
  if (MEDIA_TAGS.has(tagName)) return 'media';
  if (SVG_GRAPHIC_TAGS.has(tagName)) return 'media';
  if (SVG_DEFINITION_TAGS.has(tagName)) return 'unknown';
  if (TEXT_TAGS.has(tagName)) return 'text';
  if (CONTAINER_TAGS.has(tagName)) return 'container';
  if (kind === 'frame') return 'container';
  return 'unknown';
}

function isComponentName(elementName: string): boolean {
  return /^[A-Z]/.test(elementName);
}
