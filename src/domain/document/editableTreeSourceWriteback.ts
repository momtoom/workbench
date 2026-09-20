import type {
  Expression,
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXText,
  ImportDeclaration,
  Node as BabelNode,
  ObjectExpression,
  ObjectProperty,
  Program,
} from '@babel/types';
import { getProjectCollectionTokenCssVariableName } from '@domain/design-system/tokens/cssExport';
import type { TokenReference } from '@domain/design-system/tokens/types';
import type { WorkbenchEditOperationInput } from '@domain/editing/editOperationTypes';
import { getPageSourceFrameworkForFile } from './pageSourceFramework';
import type {
  EditableTreeNode,
  EditableTreeSourceLocation,
  EditableTreeSourcePropArray,
  EditableTreeSourcePropObject,
  EditableTreeSourcePropPrimitive,
  EditableTreeSourcePropStringArray,
  EditableTreeSourcePropValue,
} from './editableTree';
import {
  canInsertComponentChildrenIntoElement,
  canInsertSourceChildTemplateIntoElement,
  canMoveSourceChildIntoParent,
  componentSupportsChildrenSlot,
  getSourceChildrenSlotKind,
  hasRegisteredSourceSlotContract,
} from './sourceSlotContainers';
import {
  isEditableSourceAttributeName,
  normalizeEditableSourceAttributeValue,
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
  type SourceAttributeName,
} from './sourceAttributeSafety';
import {
  SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES,
  type SourceBackgroundVideoStyleProperty,
} from './sourceVideoBackground';
import { relativeModuleSpecifier } from './sourceFileMove';

export type SourceTokenBindingField = 'background' | 'radius' | 'spacing' | 'fontSize';
export type SourceStyleProperty =
  | SourceBackgroundVideoStyleProperty
  | 'align-content'
  | 'align-items'
  | 'background'
  | 'background-attachment'
  | 'background-blend-mode'
  | 'background-color'
  | 'background-image'
  | 'background-position'
  | 'background-repeat'
  | 'background-size'
  | 'border'
  | 'border-bottom'
  | 'border-bottom-color'
  | 'border-bottom-style'
  | 'border-bottom-width'
  | 'border-color'
  | 'border-left'
  | 'border-left-color'
  | 'border-left-style'
  | 'border-left-width'
  | 'border-radius'
  | 'border-bottom-left-radius'
  | 'border-bottom-right-radius'
  | 'border-right'
  | 'border-right-color'
  | 'border-right-style'
  | 'border-right-width'
  | 'border-style'
  | 'border-top'
  | 'border-top-left-radius'
  | 'border-top-right-radius'
  | 'border-top-color'
  | 'border-top-style'
  | 'border-top-width'
  | 'border-width'
  | 'box-shadow'
  | 'color'
  | 'column-count'
  | 'column-fill'
  | 'column-gap'
  | 'column-rule'
  | 'column-width'
  | 'display'
  | 'fill'
  | 'fill-opacity'
  | 'fill-rule'
  | 'flex'
  | 'align-self'
  | 'flex-basis'
  | 'flex-direction'
  | 'flex-grow'
  | 'flex-shrink'
  | 'flex-wrap'
  | 'font-family'
  | 'font-size'
  | 'font-style'
  | 'font-weight'
  | 'gap'
  | 'grid-template-columns'
  | 'grid-template-rows'
  | 'height'
  | 'isolation'
  | 'justify-content'
  | 'justify-items'
  | 'justify-self'
  | 'letter-spacing'
  | 'line-height'
  | 'line-clamp'
  | 'margin'
  | 'margin-bottom'
  | 'margin-left'
  | 'margin-right'
  | 'margin-top'
  | 'max-height'
  | 'max-width'
  | 'min-height'
  | 'min-width'
  | 'mix-blend-mode'
  | 'opacity'
  | 'outline-color'
  | 'outline-offset'
  | 'outline-style'
  | 'outline-width'
  | 'order'
  | 'overflow'
  | 'overflow-wrap'
  | 'padding'
  | 'padding-bottom'
  | 'padding-left'
  | 'padding-right'
  | 'padding-top'
  | 'position'
  | 'stroke'
  | 'stroke-dasharray'
  | 'stroke-linecap'
  | 'stroke-linejoin'
  | 'stroke-opacity'
  | 'stroke-width'
  | 'text-align'
  | 'text-decoration'
  | 'text-indent'
  | 'text-overflow'
  | 'text-transform'
  | 'hyphens'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top'
  | '-webkit-box-orient'
  | '-webkit-line-clamp'
  | 'visibility'
  | 'white-space'
  | 'word-break'
  | 'width'
  | 'z-index';
export type { SourceAttributeName } from './sourceAttributeSafety';

export type SourceTokenBindingWritebackCommand = {
  contents: string;
  field: SourceTokenBindingField;
  node: EditableTreeNode;
  sourceFile: string;
  token: TokenReference | null;
  tokenStyleValue?: string | null;
};

export type SourceAttributeWritebackCommand = {
  attributeName: SourceAttributeName;
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
  value: string | null;
};

export type SourceInlineSvgIconWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
  svg: string;
};

export type SourceComponentPropValue = EditableTreeSourcePropValue | null;
export type SourceComponentTypeFallbackProps = Record<string, boolean | number | string>;

export type SourceComponentImportSpec = {
  importSource: string;
  names: string[];
};

export const SOURCE_WRAP_HTML_TAG_NAMES = [
  'div',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'nav',
  'aside',
  'span',
] as const;

export type SourceWrapHtmlTagName = typeof SOURCE_WRAP_HTML_TAG_NAMES[number];

export type SourceWrapNodeWrapper =
  | {
      kind: 'html';
      tagName: SourceWrapHtmlTagName;
    }
  | {
      additionalImports?: SourceComponentImportSpec[];
      componentName: string;
      importSource: string;
      jsxProps?: Record<string, string>;
      kind: 'component';
      props?: Record<string, boolean | number | string>;
    };

export type SourceComponentPropWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  propName: string;
  sourceFile: string;
  value: SourceComponentPropValue;
};

export type SourceComponentTypeWritebackCommand = {
  allowedPropNames: string[];
  contents: string;
  fallbackProps?: SourceComponentTypeFallbackProps;
  importSource: string;
  managedPropNames: string[];
  node: EditableTreeNode;
  propOverrides?: SourceComponentTypeFallbackProps;
  sourceFile: string;
  targetComponentName: string;
};

export type SourceReferencedArrayPropWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  propName: string;
  sourceFile: string;
  value: EditableTreeSourcePropArray;
};

export type SourceReferencedArrayExpressionWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  sourceExpression: string;
  sourceFile: string;
  value: EditableTreeSourcePropArray;
};

export type SourceComponentInsertWritebackCommand = {
  additionalImports?: SourceComponentImportSpec[];
  componentName: string;
  contents: string;
  importSource: string;
  jsxChildren?: string;
  jsxProps?: Record<string, string>;
  node: EditableTreeNode;
  props: Record<string, boolean | number | string>;
  sourceFile: string;
  targetIndex?: number;
};

export type SourceTextContentWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
  text: string;
};

export type SourceTextI18nBindingWritebackCommand = {
  contents: string;
  fallbackText: string | null;
  node: EditableTreeNode;
  sourceFile: string;
  tokenName: string | null;
};

export type SourceTextI18nBindingWritebackResult = SourceTokenBindingWritebackResult;

export type SourceElementTagNameWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
  tagName: SourceElementTagName;
};

export type SourceElementTagName = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type SourceInsertChildTemplateId =
  | 'div'
  | 'section'
  | 'aside'
  | 'article'
  | 'main'
  | 'nav'
  | 'header'
  | 'footer'
  | 'form'
  | 'fieldset'
  | 'unordered-list'
  | 'ordered-list'
  | 'text'
  | 'paragraph'
  | 'heading'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'span'
  | 'abbr'
  | 'bold'
  | 'bdi'
  | 'bdo'
  | 'br'
  | 'cite'
  | 'code'
  | 'data'
  | 'definition'
  | 'deleted'
  | 'emphasis'
  | 'inserted'
  | 'italic'
  | 'keyboard'
  | 'link'
  | 'mark'
  | 'quote'
  | 'ruby'
  | 'sample'
  | 'small'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'time'
  | 'underline'
  | 'variable'
  | 'wbr'
  | 'button'
  | 'input'
  | 'image'
  | 'svg'
  | 'icon';

export type SourceInsertChildTemplate = {
  id: SourceInsertChildTemplateId;
  label: string;
  jsxName: string;
};

export type SourceInsertChildIconDefault = {
  name: string;
  src: string;
  svg?: string;
};

export type SourceInsertChildWritebackCommand = {
  contents: string;
  iconDefault?: SourceInsertChildIconDefault;
  node: EditableTreeNode;
  sourceFile: string;
  targetIndex?: number;
  templateId: SourceInsertChildTemplateId;
};

export type SourceStructureAction = 'delete' | 'duplicate' | 'move-up' | 'move-down';

export type SourceStructureWritebackCommand = {
  action: SourceStructureAction;
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
};

export type SourceCopiedNodeItem = {
  jsxText: string;
  label: string;
};

export type SourceNodeClipboardPayload = {
  imports: SourceComponentImportSpec[];
  items: SourceCopiedNodeItem[];
  label: string;
  requiresSameSourceFile: boolean;
  /** Why the payload is bound to its source file (e.g. 'event handler code'). */
  sameFileRiskReasons: string[];
  sourceFile: string;
};

export type SourceNodeCopyCommand = {
  contents: string;
  nodes: EditableTreeNode[];
  sourceFile: string;
};

export type SourcePasteNodeWritebackCommand = {
  clipboardSourceFile?: string;
  contents: string;
  imports?: SourceComponentImportSpec[];
  items: SourceCopiedNodeItem[];
  node: EditableTreeNode;
  requiresSameSourceFile?: boolean;
  sourceFile: string;
  targetIndex?: number;
};

export type SourceWrapNodeWritebackCommand = {
  contents: string;
  nodes: EditableTreeNode[];
  sourceFile: string;
  wrapper: SourceWrapNodeWrapper;
};

export type SourceExtractSelectedNodesToMapWritebackCommand = {
  arrayName?: string;
  contents: string;
  nodes: EditableTreeNode[];
  sourceFile: string;
};

export type SourceMoveNodeWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  sourceFile: string;
  targetIndex: number;
  targetParentNode: EditableTreeNode;
};

export type SourceMoveNodesWritebackCommand = Omit<SourceMoveNodeWritebackCommand, 'node'> & {
  nodes: EditableTreeNode[];
};

export type SourceStyleDeclarationWritebackCommand = {
  contents: string;
  node: EditableTreeNode;
  property: SourceStyleProperty;
  sourceFile: string;
  value: string | null;
};

export type SourceTokenBindingWritebackResult =
  | {
      ok: true;
      changed: boolean;
      diagnostic: string;
      nextContents: string;
      operation: WorkbenchEditOperationInput;
    }
  | {
      ok: false;
      diagnostic: string;
      nextContents: string;
    };

export type SourceAttributeWritebackResult = SourceTokenBindingWritebackResult;
export type SourceInlineSvgIconWritebackResult = SourceTokenBindingWritebackResult;
export type SourceComponentInsertWritebackResult = SourceTokenBindingWritebackResult;
export type SourceComponentPropWritebackResult = SourceTokenBindingWritebackResult;
export type SourceComponentTypeWritebackResult = SourceTokenBindingWritebackResult;
export type SourceReferencedArrayPropWritebackResult = SourceTokenBindingWritebackResult;

export type SourceReferencedArrayExpressionWritebackResult = SourceTokenBindingWritebackResult;
export type SourceInsertChildWritebackResult = SourceTokenBindingWritebackResult;
export type SourceMoveNodeWritebackResult = SourceTokenBindingWritebackResult;
export type SourceMoveNodesWritebackResult = SourceTokenBindingWritebackResult;
export type SourceStructureWritebackResult = SourceTokenBindingWritebackResult;
export type SourcePasteNodeWritebackResult = SourceTokenBindingWritebackResult;
export type SourceWrapNodeWritebackResult = SourceTokenBindingWritebackResult;
export type SourceExtractSelectedNodesToMapWritebackResult = SourceTokenBindingWritebackResult;
export type SourceElementTagNameWritebackResult = SourceTokenBindingWritebackResult;
export type SourceTextContentWritebackResult = SourceTokenBindingWritebackResult;
export type SourceStyleDeclarationWritebackResult = SourceTokenBindingWritebackResult;

export const SOURCE_INSERT_CHILD_TEMPLATES = [
  { id: 'div', label: 'Div', jsxName: 'div' },
  { id: 'section', label: 'Section', jsxName: 'section' },
  { id: 'aside', label: 'Aside', jsxName: 'aside' },
  { id: 'article', label: 'Article', jsxName: 'article' },
  { id: 'main', label: 'Main', jsxName: 'main' },
  { id: 'nav', label: 'Nav', jsxName: 'nav' },
  { id: 'header', label: 'Header', jsxName: 'header' },
  { id: 'footer', label: 'Footer', jsxName: 'footer' },
  { id: 'form', label: 'Form', jsxName: 'form' },
  { id: 'fieldset', label: 'Fieldset', jsxName: 'fieldset' },
  { id: 'unordered-list', label: 'Unordered list', jsxName: 'ul' },
  { id: 'ordered-list', label: 'Ordered list', jsxName: 'ol' },
  { id: 'text', label: 'Text', jsxName: 'p' },
  { id: 'paragraph', label: 'Paragraph', jsxName: 'p' },
  { id: 'heading1', label: 'H1', jsxName: 'h1' },
  { id: 'heading2', label: 'H2', jsxName: 'h2' },
  { id: 'heading3', label: 'H3', jsxName: 'h3' },
  { id: 'heading4', label: 'H4', jsxName: 'h4' },
  { id: 'heading5', label: 'H5', jsxName: 'h5' },
  { id: 'heading6', label: 'H6', jsxName: 'h6' },
  { id: 'span', label: 'Span', jsxName: 'span' },
  { id: 'abbr', label: 'Abbreviation', jsxName: 'abbr' },
  { id: 'bold', label: 'Bold', jsxName: 'b' },
  { id: 'bdi', label: 'Text direction isolate', jsxName: 'bdi' },
  { id: 'bdo', label: 'Text direction override', jsxName: 'bdo' },
  { id: 'br', label: 'Line break', jsxName: 'br' },
  { id: 'cite', label: 'Citation', jsxName: 'cite' },
  { id: 'code', label: 'Code', jsxName: 'code' },
  { id: 'data', label: 'Data value', jsxName: 'data' },
  { id: 'definition', label: 'Definition', jsxName: 'dfn' },
  { id: 'deleted', label: 'Deleted text', jsxName: 'del' },
  { id: 'emphasis', label: 'Emphasis', jsxName: 'em' },
  { id: 'inserted', label: 'Inserted text', jsxName: 'ins' },
  { id: 'italic', label: 'Italic', jsxName: 'i' },
  { id: 'keyboard', label: 'Keyboard input', jsxName: 'kbd' },
  { id: 'link', label: 'Link', jsxName: 'a' },
  { id: 'mark', label: 'Mark', jsxName: 'mark' },
  { id: 'quote', label: 'Inline quote', jsxName: 'q' },
  { id: 'ruby', label: 'Ruby annotation', jsxName: 'ruby' },
  { id: 'sample', label: 'Sample output', jsxName: 'samp' },
  { id: 'small', label: 'Small text', jsxName: 'small' },
  { id: 'strikethrough', label: 'Strikethrough', jsxName: 's' },
  { id: 'subscript', label: 'Subscript', jsxName: 'sub' },
  { id: 'superscript', label: 'Superscript', jsxName: 'sup' },
  { id: 'time', label: 'Time', jsxName: 'time' },
  { id: 'underline', label: 'Underline', jsxName: 'u' },
  { id: 'variable', label: 'Variable', jsxName: 'var' },
  { id: 'wbr', label: 'Word break opportunity', jsxName: 'wbr' },
  { id: 'button', label: 'Button', jsxName: 'button' },
  { id: 'input', label: 'Input', jsxName: 'input' },
  { id: 'image', label: 'Image', jsxName: 'img' },
  { id: 'svg', label: 'SVG', jsxName: 'svg' },
  { id: 'icon', label: 'Icon', jsxName: 'svg' },
] as const satisfies readonly SourceInsertChildTemplate[];

const FIELD_ATTRIBUTE: Record<SourceTokenBindingField, string> = {
  background: 'data-wb-bg-token',
  radius: 'data-wb-radius-token',
  spacing: 'data-wb-spacing-token',
  fontSize: 'data-wb-font-size-token',
};

const FIELD_COLLECTION_ATTRIBUTE: Record<SourceTokenBindingField, string> = {
  background: 'data-wb-bg-token-collection',
  radius: 'data-wb-radius-token-collection',
  spacing: 'data-wb-spacing-token-collection',
  fontSize: 'data-wb-font-size-token-collection',
};

const FIELD_STYLE_PROPERTY: Record<SourceTokenBindingField, SourceStyleProperty> = {
  background: 'background',
  radius: 'border-radius',
  spacing: 'padding',
  fontSize: 'font-size',
};

const SOURCE_STYLE_PROPERTIES = new Set<SourceStyleProperty>([
  ...SOURCE_BACKGROUND_VIDEO_STYLE_PROPERTIES,
  'align-content',
  'align-items',
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
  'box-shadow',
  'color',
  'column-count',
  'column-fill',
  'column-gap',
  'column-rule',
  'column-width',
  'display',
  'fill',
  'fill-opacity',
  'fill-rule',
  'align-self',
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
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'isolation',
  'justify-content',
  'justify-items',
  'justify-self',
  'letter-spacing',
  'line-height',
  'line-clamp',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'mix-blend-mode',
  'opacity',
  'outline-color',
  'outline-offset',
  'outline-style',
  'outline-width',
  'order',
  'overflow',
  'overflow-wrap',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'position',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'stroke-width',
  'text-align',
  'text-decoration',
  'text-indent',
  'text-overflow',
  'text-transform',
  'hyphens',
  'bottom',
  'left',
  'right',
  'top',
  '-webkit-box-orient',
  '-webkit-line-clamp',
  'visibility',
  'white-space',
  'word-break',
  'width',
  'z-index',
]);

/**
 * Whether the editor's style surface handles this declaration. Declarations
 * outside this set are still parsed from `style={{...}}` but have no
 * Inspector field — callers surface them as unmanaged so they stay visible.
 */
export function isEditableSourceStyleProperty(property: string): property is SourceStyleProperty {
  return SOURCE_STYLE_PROPERTIES.has(property as SourceStyleProperty);
}

/**
 * `anchor` is the `{...}` a projected conditional branch lives inside.
 *
 * Path walking addresses `node` -- the branch element the canvas hands back --
 * but every edit that splices this child's *text* has to use the anchor, or it
 * writes a sibling into a slot that holds exactly one expression. See
 * getEditableJsxChildAnchorNode.
 */
type EditableJsxPathChild =
  | { kind: 'container'; node: JSXElement | JSXFragment; anchor?: JSXExpressionContainer }
  | { kind: 'text'; node: JSXText | null };

export async function applySourceTokenBindingWriteback(
  command: SourceTokenBindingWritebackCommand,
): Promise<SourceTokenBindingWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const attributeName = FIELD_ATTRIBUTE[command.field];
  const collectionAttributeName = FIELD_COLLECTION_ATTRIBUTE[command.field];
  const edit = createTokenBindingAttributeEdit(
    command.contents,
    element,
    attributeName,
    collectionAttributeName,
    command.token,
  );
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  let nextContents = edit.nextContents;
  let changed = edit.changed;
  if (command.token) {
    const styleParseResult = await parseTsxProgram(nextContents, command.sourceFile);
    if (!styleParseResult.ok) {
      return {
        ok: false,
        diagnostic: styleParseResult.diagnostic,
        nextContents: command.contents,
      };
    }

    const styleElement = findJsxElementForWriteback(styleParseResult.program, validation.location, command.node);
    if (!styleElement) {
      return {
        ok: false,
        diagnostic: `${command.node.label} could not be matched after token attributes were updated in ${command.sourceFile}. Source token style writeback was not applied.`,
        nextContents: command.contents,
      };
    }

    const tokenStyleValue = command.tokenStyleValue?.trim() ||
      `var(${getProjectCollectionTokenCssVariableName(command.token.collectionId, command.token.tokenId)})`;
    const styleEdit = createStyleDeclarationEdit(
      nextContents,
      styleParseResult.program,
      styleElement,
      FIELD_STYLE_PROPERTY[command.field],
      tokenStyleValue,
    );
    if (!styleEdit.ok) {
      return {
        ok: false,
        diagnostic: styleEdit.diagnostic,
        nextContents: command.contents,
      };
    }
    nextContents = styleEdit.nextContents;
    changed = changed || styleEdit.changed;
  }

  const operation = createSourceTokenBindingOperation(command, attributeName, collectionAttributeName);
  if (!changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: command.token
        ? `${command.node.label} already uses ${command.token.collectionId}/${command.token.tokenId} for ${command.field}.`
        : `${command.node.label} already has no ${command.field} token binding.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: command.token
      ? `${command.field} token writeback applied to ${command.sourceFile}.`
      : `${command.field} token binding removed from ${command.sourceFile}.`,
    nextContents,
    operation,
  };
}

export async function applySourceAttributeWriteback(
  command: SourceAttributeWritebackCommand,
): Promise<SourceAttributeWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!isEditableSourceAttributeName(command.attributeName)) {
    return {
      ok: false,
      diagnostic: `${command.attributeName} is not an editable source attribute.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source attribute writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createStringAttributeEdit(
    command.contents,
    element,
    command.attributeName,
    command.value,
  );
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceAttributeOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: command.value
        ? `${command.node.label} already uses this ${command.attributeName} value.`
        : `${command.node.label} already has no ${command.attributeName} attribute.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: command.value
      ? `${command.attributeName} writeback applied to ${command.sourceFile}.`
      : `${command.attributeName} removed from ${command.sourceFile}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceInlineSvgIconWriteback(
  command: SourceInlineSvgIconWritebackCommand,
): Promise<SourceInlineSvgIconWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const nextSvg = command.svg.trim();
  if (!isSafeInlineSvgSnippet(nextSvg)) {
    return {
      ok: false,
      diagnostic: 'Replacement icon SVG is not safe editable source.',
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source icon writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  if (getElementDisplayName(element).toLowerCase() !== 'svg') {
    return {
      ok: false,
      diagnostic: `${command.node.label} is not an editable inline SVG icon.`,
      nextContents: command.contents,
    };
  }

  if (typeof element.start !== 'number' || typeof element.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${command.node.label} has no editable source range for icon replacement.`,
      nextContents: command.contents,
    };
  }

  const currentSvg = command.contents.slice(element.start, element.end).trim();
  const operation = createSourceInlineSvgIconOperation(command);
  if (currentSvg === nextSvg) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} already uses this inline SVG icon.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `Inline SVG icon writeback applied to ${command.sourceFile}.`,
    nextContents: `${command.contents.slice(0, element.start)}${nextSvg}${command.contents.slice(element.end)}`,
    operation,
  };
}

export async function applySourceStyleDeclarationWriteback(
  command: SourceStyleDeclarationWritebackCommand,
): Promise<SourceStyleDeclarationWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!SOURCE_STYLE_PROPERTIES.has(command.property)) {
    return {
      ok: false,
      diagnostic: `${command.property} is not an editable source style property.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source style writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createStyleDeclarationEdit(
    command.contents,
    parseResult.program,
    element,
    command.property,
    command.value,
  );
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceStyleDeclarationOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: command.value
        ? `${command.node.label} already uses this ${command.property} style value.`
        : `${command.node.label} already has no ${command.property} style value.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: command.value
      ? `${command.property} style writeback applied to ${command.sourceFile}.`
      : `${command.property} style removed from ${command.sourceFile}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceComponentPropWriteback(
  command: SourceComponentPropWritebackCommand,
): Promise<SourceComponentPropWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!isSafeComponentPropName(command.propName)) {
    return {
      ok: false,
      diagnostic: `${command.propName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Component prop writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  if (!isComponentElement(element)) {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} is not a source component instance.`,
      nextContents: command.contents,
    };
  }

  const edit = createComponentPropEdit(command.contents, element, command.propName, command.value);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceComponentPropOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${getElementDisplayName(element)} already uses this ${command.propName} prop value.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.propName} prop updated on ${getElementDisplayName(element)}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceComponentTypeWriteback(
  command: SourceComponentTypeWritebackCommand,
): Promise<SourceComponentTypeWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!isSafeComponentName(command.targetComponentName)) {
    return {
      ok: false,
      diagnostic: `${command.targetComponentName} is not a safe component name.`,
      nextContents: command.contents,
    };
  }
  if (!isSafeImportSource(command.importSource)) {
    return {
      ok: false,
      diagnostic: `${command.importSource} is not a safe component import source.`,
      nextContents: command.contents,
    };
  }
  const unsafeAllowedPropName = command.allowedPropNames.find((propName) => !isSafeComponentPropName(propName));
  if (unsafeAllowedPropName) {
    return {
      ok: false,
      diagnostic: `${unsafeAllowedPropName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }
  const unsafeManagedPropName = command.managedPropNames.find((propName) => !isSafeComponentPropName(propName));
  if (unsafeManagedPropName) {
    return {
      ok: false,
      diagnostic: `${unsafeManagedPropName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }
  const unsafeFallbackPropName = Object.keys(command.fallbackProps ?? {}).find((propName) => !isSafeComponentPropName(propName));
  if (unsafeFallbackPropName) {
    return {
      ok: false,
      diagnostic: `${unsafeFallbackPropName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }
  const unsafeOverridePropName = Object.keys(command.propOverrides ?? {}).find((propName) => !isSafeComponentPropName(propName));
  if (unsafeOverridePropName) {
    return {
      ok: false,
      diagnostic: `${unsafeOverridePropName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Component type writeback was not applied.`,
      nextContents: command.contents,
    };
  }
  if (!isComponentElement(element)) {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} is not a source component instance.`,
      nextContents: command.contents,
    };
  }

  const currentComponentName = getElementDisplayName(element);
  const edit = createSourceComponentTypeEdit(command.contents, element, command);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const nextContents = edit.changed
    ? await ensureNamedImport(edit.nextContents, parseResult.program, command.targetComponentName, command.importSource)
    : command.contents;
  const operation = createSourceComponentTypeOperation(command, currentComponentName);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${currentComponentName} already uses ${command.targetComponentName}.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${currentComponentName} converted to ${command.targetComponentName}.`,
    nextContents,
    operation,
  };
}

export async function applySourceReferencedArrayPropWriteback(
  command: SourceReferencedArrayPropWritebackCommand,
): Promise<SourceReferencedArrayPropWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!isSafeComponentPropName(command.propName)) {
    return {
      ok: false,
      diagnostic: `${command.propName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Referenced array writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const attribute = getJsxAttribute(element, command.propName);
  const expression = attribute ? readJsxAttributeExpression(attribute) : null;
  if (!expression) {
    return {
      ok: false,
      diagnostic: `${command.propName} is not connected to an editable source expression.`,
      nextContents: command.contents,
    };
  }

  const arrayExpression = findReferencedArrayExpression(parseResult.program, expression);
  if (!arrayExpression || typeof arrayExpression.start !== 'number' || typeof arrayExpression.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${command.propName} is not connected to a local editable array.`,
      nextContents: command.contents,
    };
  }

  const nextArrayText = formatReferencedArrayExpression(command.contents, arrayExpression, command.value);
  const currentArrayText = command.contents.slice(arrayExpression.start, arrayExpression.end);
  if (currentArrayText === nextArrayText) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.propName} array already uses this value.`,
      nextContents: command.contents,
      operation: createSourceComponentPropOperation(command),
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.propName} source array updated.`,
    nextContents: `${command.contents.slice(0, arrayExpression.start)}${nextArrayText}${command.contents.slice(arrayExpression.end)}`,
    operation: createSourceComponentPropOperation(command),
  };
}

export async function applySourceReferencedArrayExpressionWriteback(
  command: SourceReferencedArrayExpressionWritebackCommand,
): Promise<SourceReferencedArrayExpressionWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const arrayExpression = findReferencedArrayExpressionBySourceCode(parseResult.program, command.sourceExpression);
  if (!arrayExpression || typeof arrayExpression.start !== 'number' || typeof arrayExpression.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${command.sourceExpression} is not connected to a local editable array.`,
      nextContents: command.contents,
    };
  }

  const nextArrayText = formatReferencedArrayExpression(command.contents, arrayExpression, command.value);
  const currentArrayText = command.contents.slice(arrayExpression.start, arrayExpression.end);
  if (currentArrayText === nextArrayText) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.sourceExpression} array already uses this value.`,
      nextContents: command.contents,
      operation: createSourceReferencedArrayExpressionOperation(command),
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.sourceExpression} source array updated.`,
    nextContents: `${command.contents.slice(0, arrayExpression.start)}${nextArrayText}${command.contents.slice(arrayExpression.end)}`,
    operation: createSourceReferencedArrayExpressionOperation(command),
  };
}

export async function applySourceTextContentWriteback(
  command: SourceTextContentWritebackCommand,
): Promise<SourceTextContentWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const textNode = findJsxTextForWriteback(parseResult.program, validation.location, command.node);
  if (textNode) {
    const edit = createJsxTextContentEdit(command.contents, textNode, command.text);
    if (!edit.ok) {
      return {
        ok: false,
        diagnostic: edit.diagnostic,
        nextContents: command.contents,
      };
    }

    const operation = createSourceTextContentOperation(command);
    if (!edit.changed) {
      return {
        ok: true,
        changed: false,
        diagnostic: `${command.node.label} already uses this text content.`,
        nextContents: command.contents,
        operation,
      };
    }

    return {
      ok: true,
      changed: true,
      diagnostic: `Text content writeback applied to ${command.sourceFile}.`,
      nextContents: edit.nextContents,
      operation,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source text writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createSimpleTextContentEdit(command.contents, element, command.text);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceTextContentOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} already uses this text content.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `Text content writeback applied to ${command.sourceFile}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceElementTagNameWriteback(
  command: SourceElementTagNameWritebackCommand,
): Promise<SourceElementTagNameWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
  if (!element) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source tag writeback was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createSourceElementTagNameEdit(command.contents, element, command.tagName);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceElementTagNameOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} already uses ${command.tagName}.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `Source tag writeback applied to ${command.sourceFile}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceTextI18nBindingWriteback(
  command: SourceTextI18nBindingWritebackCommand,
): Promise<SourceTextI18nBindingWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return { ok: false, diagnostic: validation.diagnostic, nextContents: command.contents };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return { ok: false, diagnostic: parseResult.diagnostic, nextContents: command.contents };
  }

  // Find the source range to replace. It's either a JSXText (literal) or a
  // JSXExpressionContainer wrapping `t('...')` (already bound). When the
  // selected node is the parent element (e.g. <h2>), look inside the element
  // for the first text-like child.
  const textNode = findJsxTextForWriteback(parseResult.program, validation.location, command.node);
  let exprContainer: JSXExpressionContainer | null = textNode
    ? null
    : findJsxExpressionContainerForWriteback(parseResult.program, validation.location);
  let textFromElement: JSXText | null = null;
  if (!textNode && !exprContainer) {
    const element = findJsxElementForWriteback(parseResult.program, validation.location, command.node);
    if (element) {
      for (const child of element.children) {
        if (child.type === 'JSXText' && child.value.trim()) {
          textFromElement = child;
          break;
        }
        if (child.type === 'JSXExpressionContainer') {
          exprContainer = child;
          break;
        }
      }
    }
  }

  const target = textNode ?? textFromElement ?? exprContainer;
  if (!target || typeof target.start !== 'number' || typeof target.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Text i18n binding was not applied.`,
      nextContents: command.contents,
    };
  }

  let replacement: string;
  if (command.tokenName) {
    replacement = `{t(${JSON.stringify(command.tokenName)})}`;
  } else {
    replacement = escapeJsxTextContent(command.fallbackText ?? '');
  }

  const beforeRange = command.contents.slice(0, target.start);
  const afterRange = command.contents.slice(target.end);
  let nextContents = `${beforeRange}${replacement}${afterRange}`;

  // Ensure the i18n `t` helper is imported when binding, using the module that
  // belongs to this page's project at the correct relative depth.
  if (command.tokenName) {
    nextContents = ensureI18nImport(nextContents, command.sourceFile);
  }

  const operation = createSourceTextI18nBindingOperation(command);
  if (nextContents === command.contents) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} text binding already matches.`,
      nextContents: command.contents,
      operation,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `Text i18n binding writeback applied to ${command.sourceFile}.`,
    nextContents,
    operation,
  };
}

function findJsxExpressionContainerForWriteback(
  program: Program,
  location: EditableTreeSourceLocation,
): JSXExpressionContainer | null {
  let found: JSXExpressionContainer | null = null;
  const visit = (node: BabelNode): void => {
    if (found) return;
    if (node.type === 'JSXExpressionContainer' && nodeLocationMatches(node, location)) {
      found = node;
      return;
    }
    for (const child of getNodeChildren(node)) visit(child);
  };
  for (const statement of program.body) visit(statement);
  return found;
}

function ensureI18nImport(contents: string, sourceFile: string): string {
  const moduleSpecifier = resolveI18nModuleSpecifier(contents, sourceFile);
  const existingImport = /import\s*\{\s*t\s*\}\s*from\s*(['"])([^'"]+)\1\s*;?/;
  const existing = contents.match(existingImport);
  if (existing) {
    // A `t` import is already present. Leave it if it already points at the
    // right module; otherwise re-point it (this corrects stale/wrong i18n paths,
    // e.g. a copied page that kept another project's hardcoded i18n specifier).
    if (existing[2] === moduleSpecifier) return contents;
    return contents.replace(existingImport, `import { t } from '${moduleSpecifier}';`);
  }
  return `import { t } from '${moduleSpecifier}';\n${contents}`;
}

/**
 * Resolves which i18n module a page should import `t` from. Prefers the module
 * that sits beside the design-system library the page already imports — this is
 * project-local and inherits the existing import's relative depth. Falls back to
 * the dev-app workbench i18n helper, depth-corrected for the file's location.
 */
function resolveI18nModuleSpecifier(contents: string, sourceFile: string): string {
  const libraryImport = contents.match(/(['"])(\.[^'"]*\/libraries\/[^'"/]+)\/[^'"]+\1/);
  if (libraryImport) return `${libraryImport[2]}/i18n`;
  return sourceFile ? relativeModuleSpecifier(sourceFile, 'src/workbench-i18n') : '../workbench-i18n';
}

function createSourceTextI18nBindingOperation(
  command: SourceTextI18nBindingWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-text-content',
      field: 'i18nBinding',
      nodeId: command.node.id,
      path: [command.sourceFile, 'i18nBinding'],
    },
    identityEffect: 'preserve',
    persistence: { boundary: 'none', affectedFiles: [command.sourceFile] },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source text i18n binding writeback changed the editable source tree.',
    },
  };
}

export async function applySourceInsertChildWriteback(
  command: SourceInsertChildWritebackCommand,
): Promise<SourceInsertChildWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const template = getSourceInsertChildTemplate(command.templateId);
  if (!template) {
    return {
      ok: false,
      diagnostic: `${command.templateId} is not a supported source child template.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const container = findJsxContainerForWriteback(parseResult.program, validation.location, command.node);
  if (!container) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source child insertion was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createSourceChildInsertionEdit(
    command.contents,
    container,
    template,
    command.iconDefault,
    command.targetIndex,
    canTreatWritebackNodeAsExplicitUnknownChildrenContainer(command.node),
  );
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const guard = await guardParsableStructuralWriteback(edit.nextContents, command.sourceFile, template.label);
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceInsertChildOperation(command, template);
  return {
    ok: true,
    changed: true,
    diagnostic: `${template.label} inserted into ${command.node.label}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceComponentInsertWriteback(
  command: SourceComponentInsertWritebackCommand,
): Promise<SourceComponentInsertWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (!isSafeComponentName(command.componentName)) {
    return {
      ok: false,
      diagnostic: `${command.componentName} is not a safe component name.`,
      nextContents: command.contents,
    };
  }
  if (!isSafeImportSource(command.importSource)) {
    return {
      ok: false,
      diagnostic: `${command.importSource} is not a safe component import source.`,
      nextContents: command.contents,
    };
  }

  const unsafePropName = Object.keys(command.props).find((propName) => !isSafeComponentPropName(propName));
  if (unsafePropName) {
    return {
      ok: false,
      diagnostic: `${unsafePropName} is not a safe editable component prop.`,
      nextContents: command.contents,
    };
  }
  const unsafeJsxPropName = Object.keys(command.jsxProps ?? {}).find((propName) => !isSafeComponentPropName(propName));
  if (unsafeJsxPropName) {
    return {
      ok: false,
      diagnostic: `${unsafeJsxPropName} is not a safe editable component slot prop.`,
      nextContents: command.contents,
    };
  }
  if (command.jsxChildren && !isSafeJsxChildrenSnippet(command.jsxChildren)) {
    return {
      ok: false,
      diagnostic: `${command.componentName} has unsafe editable component children.`,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const container = findJsxContainerForWriteback(parseResult.program, validation.location, command.node);
  if (!container) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Component insertion was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createSourceComponentInsertionEdit(command.contents, container, command);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  let nextContents = await ensureNamedImport(
    edit.nextContents,
    parseResult.program,
    command.componentName,
    command.importSource,
  );
  for (const additionalImport of command.additionalImports ?? []) {
    if (!isSafeImportSource(additionalImport.importSource)) continue;
    for (const name of additionalImport.names) {
      if (!isSafeComponentName(name)) continue;
      nextContents = await ensureNamedImport(nextContents, parseResult.program, name, additionalImport.importSource);
    }
  }
  const guard = await guardParsableStructuralWriteback(nextContents, command.sourceFile, command.componentName);
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceComponentInsertOperation(command);

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.componentName} inserted into ${command.node.label}.`,
    nextContents,
    operation,
  };
}

export async function applySourceStructureWriteback(
  command: SourceStructureWritebackCommand,
): Promise<SourceStructureWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const edit = createSourceStructureEdit(command, parseResult.program, validation.location);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceStructureOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} cannot ${formatSourceStructureAction(command.action)} from this position.`,
      nextContents: command.contents,
      operation,
    };
  }

  const guard = await guardParsableStructuralWriteback(edit.nextContents, command.sourceFile, command.node.label);
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.node.label} ${formatSourceStructureActionPastTense(command.action)}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function createSourceNodeClipboardPayload(
  command: SourceNodeCopyCommand,
): Promise<
  | { ok: true; payload: SourceNodeClipboardPayload }
  | { ok: false; diagnostic: string }
> {
  if (command.nodes.length === 0) {
    return {
      ok: false,
      diagnostic: 'No source-backed layer is selected for copy.',
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
    };
  }

  const items: SourceCopiedNodeItem[] = [];
  let requiresSameSourceFile = false;
  const sameFileRiskReasons: string[] = [];
  const nodes = [...command.nodes].sort(compareEditableTreeNodesBySourceOrder);

  for (const node of nodes) {
    const validation = validateWritebackCommand({
      node,
      sourceFile: command.sourceFile,
    });
    if (!validation.ok) {
      return {
        ok: false,
        diagnostic: validation.diagnostic,
      };
    }

    const pathInfo = getEditableSourcePathInfoFromNodeId(node.id);
    if (pathInfo?.path.length === 0) {
      return {
        ok: false,
        diagnostic: `${node.label} is the source root. Copy a child layer instead.`,
      };
    }

    const target = findEditableJsxChildForStructure(parseResult.program, node, validation.location);
    if (!target) {
      return {
        ok: false,
        diagnostic: `${node.label} could not be matched to an editable source child. Copy was not applied.`,
      };
    }

    const interactionRisk = getSourceInteractionRiskReason(target.childNode);
    if (interactionRisk) {
      if (isSourceClipboardSameFileRisk(interactionRisk)) {
        requiresSameSourceFile = true;
        if (!sameFileRiskReasons.includes(interactionRisk)) sameFileRiskReasons.push(interactionRisk);
      } else {
        return {
          ok: false,
          diagnostic: `${node.label} contains ${interactionRisk}. Copy is blocked until interaction-safe clone rewriting is available.`,
        };
      }
    }

    const range = getEditableJsxChildRange(command.contents, target.childNode);
    if (!range) {
      return {
        ok: false,
        diagnostic: `${node.label} has no editable source range for copy.`,
      };
    }

    const jsxText = command.contents.slice(range.start, range.end).trim();
    if (!jsxText) {
      return {
        ok: false,
        diagnostic: `${node.label} has no copyable source text.`,
      };
    }

    items.push({
      jsxText,
      label: node.label,
    });
  }

  return {
    ok: true,
    payload: {
      imports: collectSourceClipboardImports(parseResult.program, items.map((item) => item.jsxText)),
      items,
      label: items.length === 1 ? items[0]?.label ?? 'Layer' : `${items.length} layers`,
      requiresSameSourceFile,
      sameFileRiskReasons,
      sourceFile: command.sourceFile,
    },
  };
}

export async function applySourcePasteNodeWriteback(
  command: SourcePasteNodeWritebackCommand,
): Promise<SourcePasteNodeWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }

  if (command.items.length === 0) {
    return {
      ok: false,
      diagnostic: 'Clipboard has no source layers to paste.',
      nextContents: command.contents,
    };
  }

  // A payload flagged requiresSameSourceFile still pastes into other files:
  // the bindings it carries (event handlers, expressions, spreads) reference
  // identifiers only its original file defines, so the UI warns instead of
  // refusing — the user opted to paste first and rewrite the bindings after.

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const parsedClipboard = await parseSourceClipboardItems(command.items, command.sourceFile);
  if (!parsedClipboard.ok) {
    return {
      ok: false,
      diagnostic: parsedClipboard.diagnostic,
      nextContents: command.contents,
    };
  }

  const container = findJsxContainerForWriteback(parseResult.program, validation.location, command.node);
  if (!container) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to ${formatSourceLocation(validation.location)} in ${command.sourceFile}. Source paste was not applied.`,
      nextContents: command.contents,
    };
  }

  const edit = createSourcePasteNodeEdit(command.contents, container, command.items, parsedClipboard.children, command.targetIndex);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  let nextContents = edit.nextContents;
  for (const importSpec of command.imports ?? []) {
    if (!isSafeImportSource(importSpec.importSource)) continue;
    for (const name of importSpec.names) {
      if (!isSafeImportedLocalName(name)) continue;
      nextContents = await ensureNamedImport(nextContents, parseResult.program, name, importSpec.importSource);
    }
  }

  const guard = await guardParsableStructuralWriteback(nextContents, command.sourceFile, 'Paste');
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourcePasteNodeOperation(command);

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.items.length === 1 ? command.items[0]?.label ?? 'Layer' : `${command.items.length} layers`} pasted into ${command.node.label}.`,
    nextContents,
    operation,
  };
}

export async function applySourceWrapNodeWriteback(
  command: SourceWrapNodeWritebackCommand,
): Promise<SourceWrapNodeWritebackResult> {
  if (command.nodes.length === 0) {
    return {
      ok: false,
      diagnostic: 'Select at least one source layer to wrap.',
      nextContents: command.contents,
    };
  }

  const wrapperValidation = validateSourceWrapNodeWrapper(command.wrapper);
  if (!wrapperValidation.ok) {
    return {
      ok: false,
      diagnostic: wrapperValidation.diagnostic,
      nextContents: command.contents,
    };
  }

  const locations: EditableTreeSourceLocation[] = [];
  for (const node of command.nodes) {
    const validation = validateWritebackCommand({
      node,
      sourceFile: command.sourceFile,
    });
    if (!validation.ok) {
      return {
        ok: false,
        diagnostic: validation.diagnostic,
        nextContents: command.contents,
      };
    }
    locations.push(validation.location);
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const edit = createSourceWrapNodeEdit(command, parseResult.program, locations);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  let nextContents = edit.nextContents;
  if (command.wrapper.kind === 'component') {
    nextContents = await ensureNamedImport(
      nextContents,
      parseResult.program,
      command.wrapper.componentName,
      command.wrapper.importSource,
    );
    for (const additionalImport of command.wrapper.additionalImports ?? []) {
      if (!isSafeImportSource(additionalImport.importSource)) continue;
      for (const name of additionalImport.names) {
        if (!isSafeComponentName(name)) continue;
        nextContents = await ensureNamedImport(nextContents, parseResult.program, name, additionalImport.importSource);
      }
    }
  }

  const guard = await guardParsableStructuralWriteback(
    nextContents,
    command.sourceFile,
    formatSourceWrapSelectionLabel(command.nodes),
  );
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceWrapNodeOperation(command);
  return {
    ok: true,
    changed: true,
    diagnostic: `${formatSourceWrapSelectionLabel(command.nodes)} wrapped in ${getSourceWrapWrapperName(command.wrapper)}.`,
    nextContents,
    operation,
  };
}

export async function applySourceExtractSelectedNodesToMapWriteback(
  command: SourceExtractSelectedNodesToMapWritebackCommand,
): Promise<SourceExtractSelectedNodesToMapWritebackResult> {
  if (command.nodes.length <= 1) {
    return {
      ok: false,
      diagnostic: 'Select at least two source sibling layers to create a map.',
      nextContents: command.contents,
    };
  }

  const locations: EditableTreeSourceLocation[] = [];
  for (const node of command.nodes) {
    const validation = validateWritebackCommand({
      node,
      sourceFile: command.sourceFile,
    });
    if (!validation.ok) {
      return {
        ok: false,
        diagnostic: validation.diagnostic,
        nextContents: command.contents,
      };
    }
    locations.push(validation.location);
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const edit = createSourceExtractSelectedNodesToMapEdit(command, parseResult.program, locations);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const verifyResult = await parseTsxProgram(edit.nextContents, command.sourceFile);
  if (!verifyResult.ok) {
    return {
      ok: false,
      diagnostic: `Generated map source could not be parsed: ${verifyResult.diagnostic}`,
      nextContents: command.contents,
    };
  }

  const operation = createSourceExtractSelectedNodesToMapOperation(command, edit.arrayName);
  return {
    ok: true,
    changed: true,
    diagnostic: `${command.nodes.length} source layers converted to ${edit.arrayName}.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceMoveNodeWriteback(
  command: SourceMoveNodeWritebackCommand,
): Promise<SourceMoveNodeWritebackResult> {
  const validation = validateWritebackCommand(command);
  if (!validation.ok) {
    return {
      ok: false,
      diagnostic: validation.diagnostic,
      nextContents: command.contents,
    };
  }
  const parentValidation = validateWritebackCommand({
    node: command.targetParentNode,
    sourceFile: command.sourceFile,
  });
  if (!parentValidation.ok) {
    return {
      ok: false,
      diagnostic: parentValidation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const edit = createSourceMoveNodeEdit(command, parseResult.program, validation.location, parentValidation.location);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  const operation = createSourceMoveNodeOperation(command);
  if (!edit.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: `${command.node.label} is already at this layer position.`,
      nextContents: command.contents,
      operation,
    };
  }

  const guard = await guardParsableStructuralWriteback(edit.nextContents, command.sourceFile, command.node.label);
  if (!guard.ok) {
    return {
      ok: false,
      diagnostic: guard.diagnostic,
      nextContents: command.contents,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: `${command.node.label} moved in source layers.`,
    nextContents: edit.nextContents,
    operation,
  };
}

export async function applySourceMoveNodesWriteback(
  command: SourceMoveNodesWritebackCommand,
): Promise<SourceMoveNodesWritebackResult> {
  if (command.nodes.length === 1) {
    return applySourceMoveNodeWriteback({
      ...command,
      node: command.nodes[0]!,
    });
  }
  if (command.nodes.length === 0) {
    return {
      ok: false,
      diagnostic: 'No source layers are selected for moving.',
      nextContents: command.contents,
    };
  }

  for (const node of command.nodes) {
    const validation = validateWritebackCommand({ node, sourceFile: command.sourceFile });
    if (!validation.ok) {
      return {
        ok: false,
        diagnostic: validation.diagnostic,
        nextContents: command.contents,
      };
    }
  }
  const parentValidation = validateWritebackCommand({
    node: command.targetParentNode,
    sourceFile: command.sourceFile,
  });
  if (!parentValidation.ok) {
    return {
      ok: false,
      diagnostic: parentValidation.diagnostic,
      nextContents: command.contents,
    };
  }

  const parseResult = await parseTsxProgram(command.contents, command.sourceFile);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: parseResult.diagnostic,
      nextContents: command.contents,
    };
  }

  const edit = createSourceMoveNodesEdit(command, parseResult.program, parentValidation.location);
  if (!edit.ok) {
    return {
      ok: false,
      diagnostic: edit.diagnostic,
      nextContents: command.contents,
    };
  }

  if (edit.changed) {
    const guard = await guardParsableStructuralWriteback(
      edit.nextContents,
      command.sourceFile,
      `${command.nodes.length} source layers`,
    );
    if (!guard.ok) {
      return {
        ok: false,
        diagnostic: guard.diagnostic,
        nextContents: command.contents,
      };
    }
  }

  const operation = createSourceMoveNodesOperation(command);
  return {
    ok: true,
    changed: edit.changed,
    diagnostic: edit.changed
      ? `${command.nodes.length} source layers moved.`
      : 'Selected source layers are already at this layer position.',
    nextContents: edit.nextContents,
    operation,
  };
}

function validateWritebackCommand(command: {
  node: EditableTreeNode;
  sourceFile: string;
  token?: TokenReference | null;
}):
  | { ok: true; location: EditableTreeSourceLocation }
  | { ok: false; diagnostic: string } {
  if (command.token && (!command.token.collectionId.trim() || !command.token.tokenId.trim())) {
    return {
      ok: false,
      diagnostic: 'Source writeback requires a collection-scoped token reference.',
    };
  }

  if (command.node.source?.sourceFile !== command.sourceFile) {
    return {
      ok: false,
      diagnostic: `${command.node.label} is not backed by ${command.sourceFile}. Source writeback was not applied.`,
    };
  }

  if (!command.node.sourceLocation) {
    return {
      ok: false,
      diagnostic: `${command.node.label} has no source location. Source writeback was not applied.`,
    };
  }

  return {
    ok: true,
    location: command.node.sourceLocation,
  };
}

async function parseTsxProgram(contents: string, sourceFile: string): Promise<
  | { ok: true; program: Program }
  | { ok: false; diagnostic: string }
> {
  // Every writeback op parses through here, so this is the one framework gate
  // for the write path: non-react page sources fail closed with a diagnostic
  // instead of feeding a Vue SFC to the TSX parser.
  const framework = getPageSourceFrameworkForFile(sourceFile);
  if (framework !== 'react') {
    return {
      ok: false,
      diagnostic: `${sourceFile} is a ${framework} page source. Source writeback for ${framework} pages is not supported yet.`,
    };
  }
  try {
    const { parse } = await import('@babel/parser');
    return {
      ok: true,
      program: parse(contents, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        errorRecovery: false,
      }).program,
    };
  } catch (error) {
    return {
      ok: false,
      diagnostic: `${sourceFile} could not be parsed for source writeback: ${formatError(error)}.`,
    };
  }
}

/**
 * Structural writebacks splice raw text by byte offset, so one wrong offset
 * produces a file that no longer parses -- and nothing downstream re-checks:
 * commitSourceWriteback hands `nextContents` straight to history and to disk.
 * Re-parse the result and fail the edit instead of writing an unopenable page.
 */
async function guardParsableStructuralWriteback(
  nextContents: string,
  sourceFile: string,
  subject: string,
): Promise<{ ok: true } | { ok: false; diagnostic: string }> {
  const reparse = await parseTsxProgram(nextContents, sourceFile);
  if (reparse.ok) return { ok: true };
  return {
    ok: false,
    diagnostic: `${subject} was not applied because the edited source would no longer parse. ${reparse.diagnostic}`,
  };
}

function findJsxElementByLocation(program: Program, location: EditableTreeSourceLocation): JSXElement | null {
  for (const statement of program.body) {
    const match = findJsxElementInNode(statement, location);
    if (match) return match;
  }
  return null;
}

function findJsxElementForWriteback(
  program: Program,
  location: EditableTreeSourceLocation,
  node: EditableTreeNode,
): JSXElement | null {
  return findJsxElementByLocation(program, location)
    ?? findClosestJsxElementBySourcePath(program, node.id, location);
}

type JsxInsertionContainer = JSXElement | JSXFragment;

type JsxInsertionContainerInfo = {
  container: JsxInsertionContainer;
  isFragment: boolean;
  displayName: string;
  openingStart: number;
  openingEnd: number;
  closingStart: number | null;
  isVoid: boolean;
  isSelfClosing: boolean;
  hasClosing: boolean;
  isComponentWithoutSlot: boolean;
};

function getJsxInsertionContainerInfo(container: JsxInsertionContainer): JsxInsertionContainerInfo | null {
  if (container.type === 'JSXFragment') {
    const opening = container.openingFragment;
    const closing = container.closingFragment;
    if (
      typeof opening.start !== 'number' ||
      typeof opening.end !== 'number' ||
      typeof closing.start !== 'number'
    ) return null;
    return {
      container,
      isFragment: true,
      displayName: 'Fragment',
      openingStart: opening.start,
      openingEnd: opening.end,
      closingStart: closing.start,
      isVoid: false,
      isSelfClosing: false,
      hasClosing: true,
      isComponentWithoutSlot: false,
    };
  }
  const opening = container.openingElement;
  if (typeof opening.start !== 'number' || typeof opening.end !== 'number') return null;
  const displayName = getElementDisplayName(container);
  const closing = container.closingElement;
  const hasClosing = !opening.selfClosing && !!closing && typeof closing.start === 'number';
  return {
    container,
    isFragment: false,
    displayName,
    openingStart: opening.start,
    openingEnd: opening.end,
    closingStart: hasClosing && closing && typeof closing.start === 'number' ? closing.start : null,
    isVoid: isVoidJsxElement(container),
    isSelfClosing: opening.selfClosing,
    hasClosing,
    isComponentWithoutSlot: isComponentElement(container) && !componentSupportsChildrenSlot(displayName),
  };
}

function findJsxContainerForWriteback(
  program: Program,
  location: EditableTreeSourceLocation,
  node: EditableTreeNode,
): JsxInsertionContainer | null {
  const element = findJsxElementForWriteback(program, location, node);
  if (element) return element;
  for (const root of collectJsxRoots(program)) {
    if (root.type === 'JSXFragment' && nodeLocationMatches(root, location)) return root;
  }
  const path = getEditableSourcePathFromNodeId(node.id);
  if (path) {
    const candidates = collectJsxRoots(program).flatMap((root) => {
      const match = findJsxContainerByEditablePath(root, path);
      return match && match.type === 'JSXFragment' ? [match] : [];
    });
    if (candidates.length > 0) {
      candidates.sort((left, right) =>
        getSourceLocationDistance(left, location) - getSourceLocationDistance(right, location),
      );
      return candidates[0] ?? null;
    }
  }
  return null;
}

function findJsxElementForTextOverrideWriteback(
  program: Program,
  location: EditableTreeSourceLocation,
  node: EditableTreeNode,
): JSXElement | null {
  if (node.kind === 'text') {
    const parent = findClosestParentJsxElementForTextBySourcePath(program, node.id, location);
    if (parent) return parent;
  }
  return findJsxElementForWriteback(program, location, node);
}

function findClosestParentJsxElementForTextBySourcePath(
  program: Program,
  nodeId: string,
  location: EditableTreeSourceLocation,
): JSXElement | null {
  const pathInfo = getEditableSourcePathInfoFromNodeId(nodeId);
  if (!pathInfo?.isText || pathInfo.path.length === 0) return null;
  const parentPath = pathInfo.path.slice(0, -1);

  const candidates = collectJsxRoots(program).flatMap((root) => {
    const match = findJsxElementByEditablePath(root, parentPath);
    return match ? [match] : [];
  });
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) =>
    getSourceLocationDistance(left, location) - getSourceLocationDistance(right, location),
  )[0] ?? null;
}

function findClosestJsxElementBySourcePath(
  program: Program,
  nodeId: string,
  location: EditableTreeSourceLocation,
): JSXElement | null {
  const path = getEditableSourcePathFromNodeId(nodeId);
  if (!path) return null;

  const candidates = collectJsxRoots(program).flatMap((root) => {
    const match = findJsxElementByEditablePath(root, path);
    return match ? [match] : [];
  });
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) =>
    getSourceLocationDistance(left, location) - getSourceLocationDistance(right, location),
  )[0] ?? null;
}

function findJsxTextForWriteback(
  program: Program,
  location: EditableTreeSourceLocation,
  node: EditableTreeNode,
): JSXText | null {
  if (node.kind !== 'text') return null;
  return findJsxTextByLocation(program, location)
    ?? findClosestJsxTextBySourcePath(program, node.id, location);
}

function findJsxTextByLocation(program: Program, location: EditableTreeSourceLocation): JSXText | null {
  for (const statement of program.body) {
    const match = findJsxTextInNode(statement, location);
    if (match) return match;
  }
  return null;
}

function findClosestJsxTextBySourcePath(
  program: Program,
  nodeId: string,
  location: EditableTreeSourceLocation,
): JSXText | null {
  const pathInfo = getEditableSourcePathInfoFromNodeId(nodeId);
  if (!pathInfo?.isText) return null;

  const candidates = collectJsxRoots(program).flatMap((root) => {
    const match = findJsxTextByEditablePath(root, pathInfo.path);
    return match ? [match] : [];
  });
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) =>
    getSourceLocationDistance(left, location) - getSourceLocationDistance(right, location),
  )[0] ?? null;
}

function findJsxElementInNode(node: BabelNode, location: EditableTreeSourceLocation): JSXElement | null {
  if (node.type === 'JSXElement') {
    if (nodeLocationMatches(node, location)) return node;
    const nested = findJsxElementInChildren(node.children, location);
    if (nested) return nested;
  }

  if (node.type === 'JSXFragment') {
    const nested = findJsxElementInFragment(node, location);
    if (nested) return nested;
  }

  for (const child of getNodeChildren(node)) {
    const nested = findJsxElementInNode(child, location);
    if (nested) return nested;
  }

  return null;
}

function findJsxTextInNode(node: BabelNode, location: EditableTreeSourceLocation): JSXText | null {
  if (node.type === 'JSXElement') return findJsxTextInChildren(node.children, location);
  if (node.type === 'JSXFragment') return findJsxTextInFragment(node, location);

  for (const child of getNodeChildren(node)) {
    const nested = findJsxTextInNode(child, location);
    if (nested) return nested;
  }

  return null;
}

function findJsxElementInChildren(children: JSXElement['children'], location: EditableTreeSourceLocation): JSXElement | null {
  for (const child of children) {
    if (child.type === 'JSXElement') {
      const match = findJsxElementInNode(child, location);
      if (match) return match;
    }
    if (child.type === 'JSXFragment') {
      const match = findJsxElementInFragment(child, location);
      if (match) return match;
    }
    if (child.type === 'JSXExpressionContainer' && child.expression.type !== 'JSXEmptyExpression') {
      const match = findJsxElementInNode(child.expression, location);
      if (match) return match;
    }
  }
  return null;
}

function findJsxTextInChildren(children: JSXElement['children'], location: EditableTreeSourceLocation): JSXText | null {
  for (const child of children) {
    if (child.type === 'JSXText' && nodeLocationMatches(child, location)) return child;
    if (child.type === 'JSXElement') {
      const match = findJsxTextInNode(child, location);
      if (match) return match;
    }
    if (child.type === 'JSXFragment') {
      const match = findJsxTextInFragment(child, location);
      if (match) return match;
    }
    if (child.type === 'JSXExpressionContainer' && child.expression.type !== 'JSXEmptyExpression') {
      const match = findJsxTextInNode(child.expression, location);
      if (match) return match;
    }
  }
  return null;
}

function findJsxElementInFragment(fragment: JSXFragment, location: EditableTreeSourceLocation): JSXElement | null {
  for (const child of fragment.children) {
    if (child.type === 'JSXElement') {
      const match = findJsxElementInNode(child, location);
      if (match) return match;
    }
    if (child.type === 'JSXFragment') {
      const match = findJsxElementInFragment(child, location);
      if (match) return match;
    }
  }
  return null;
}

function findJsxTextInFragment(fragment: JSXFragment, location: EditableTreeSourceLocation): JSXText | null {
  return findJsxTextInChildren(fragment.children, location);
}

function collectJsxRoots(node: BabelNode): Array<JSXElement | JSXFragment> {
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return [node];
  return getNodeChildren(node).flatMap((child) => collectJsxRoots(child));
}

function findJsxElementByEditablePath(
  root: JSXElement | JSXFragment,
  path: number[],
): JSXElement | null {
  if (path.length === 0) return root.type === 'JSXElement' ? root : null;

  let current: JSXElement | JSXFragment | null = root;
  for (const index of path) {
    if (!current) return null;
    const children = getEditableJsxChildren(current);
    const pathChild: EditableJsxPathChild | undefined = children[index];
    current = pathChild?.kind === 'container' ? pathChild.node : null;
  }

  return current?.type === 'JSXElement' ? current : null;
}

function findJsxTextByEditablePath(
  root: JSXElement | JSXFragment,
  path: number[],
): JSXText | null {
  if (path.length === 0) return null;

  let current: JSXElement | JSXFragment | null = root;
  for (let index = 0; index < path.length; index += 1) {
    if (!current) return null;
    const pathChild: EditableJsxPathChild | undefined = getEditableJsxChildren(current)[path[index]];
    const isLast = index === path.length - 1;
    if (isLast) return pathChild?.kind === 'text' ? pathChild.node : null;
    current = pathChild?.kind === 'container' ? pathChild.node : null;
  }

  return null;
}

function getEditableJsxChildren(container: JSXElement | JSXFragment): EditableJsxPathChild[] {
  const children = container.children;
  const parentJsxName = getJsxContainerDisplayName(container);
  const converted: EditableJsxPathChild[] = [];

  for (const child of children) {
    if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
      converted.push({ kind: 'container', node: child });
      continue;
    }

    if (child.type === 'JSXText') {
      if (isEditableJsxText(normalizeSourceText(child.value), parentJsxName)) converted.push({ kind: 'text', node: child });
      continue;
    }

    if (child.type !== 'JSXExpressionContainer') continue;
    if (child.expression.type === 'JSXEmptyExpression') continue;
    if (child.expression.type === 'JSXElement' || child.expression.type === 'JSXFragment') {
      converted.push({ kind: 'container', node: child.expression });
      continue;
    }

    // A conditional projects its rendered branch into the parent's own child
    // slot (see convertKnownJsxExpressionValue in editableTreeSourceParser),
    // so the node ids the canvas hands back address the branch, not the
    // conditional. Mirror that or the path walk stops here and everything
    // inside the branch becomes unmovable — droppable into, never out of,
    // because the drop-target matcher searches by location instead of by path.
    const branch = getSoleJsxBranchOfConditional(child.expression);
    if (branch) {
      converted.push({ kind: 'container', node: branch, anchor: child });
      continue;
    }

    converted.push({ kind: 'text', node: null });
  }

  return converted;
}

/**
 * The JSX branch a conditional projects into its parent's child slot.
 *
 * Mirrors the parser: a statically known test selects its own branch, and
 * anything else takes the consequent, falling back to the alternate. Both
 * `{open ? <aside/> : null}` and `{open ? <aside/> : <aside/>}` therefore
 * contribute exactly one child, which is what the parser's node ids address.
 *
 * Only literal tests are resolved here — the parser can also fold design-state
 * overrides and module constants, which this layer has no context for. A
 * constant-folded false test is the one case still addressed by the wrong
 * branch; failing to walk at all, as before, was worse for every case.
 */
function getSoleJsxBranchOfConditional(expression: Expression): JSXElement | JSXFragment | null {
  if (expression.type !== 'ConditionalExpression') return null;
  const literalTest = getLiteralTestValue(expression.test);
  if (literalTest !== null) {
    return asJsxContainerExpression(literalTest ? expression.consequent : expression.alternate);
  }
  return asJsxContainerExpression(expression.consequent) ??
    asJsxContainerExpression(expression.alternate);
}

function getLiteralTestValue(test: Expression): boolean | null {
  if (test.type === 'BooleanLiteral') return test.value;
  if (test.type === 'NumericLiteral') return Boolean(test.value);
  if (test.type === 'StringLiteral') return Boolean(test.value);
  return null;
}

function asJsxContainerExpression(node: BabelNode): JSXElement | JSXFragment | null {
  return node.type === 'JSXElement' || node.type === 'JSXFragment' ? node : null;
}

function getJsxContainerDisplayName(container: JSXElement | JSXFragment): string {
  return container.type === 'JSXFragment' ? 'Fragment' : getElementDisplayName(container);
}

function isEditableJsxText(text: string, parentJsxName: string): boolean {
  void parentJsxName;
  return Boolean(text.trim());
}

function getNodeChildren(node: BabelNode): BabelNode[] {
  switch (node.type) {
    case 'File':
      return [node.program];
    case 'Program':
      return node.body;
    case 'ExportDefaultDeclaration':
      return [node.declaration];
    case 'ExportNamedDeclaration':
      return node.declaration ? [node.declaration] : [];
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return [node.body];
    case 'BlockStatement':
      return node.body;
    case 'ReturnStatement':
      return node.argument ? [node.argument] : [];
    case 'ParenthesizedExpression':
      return [node.expression];
    case 'VariableDeclaration':
      return node.declarations;
    case 'VariableDeclarator':
      return node.init ? [node.init] : [];
    case 'ExpressionStatement':
      return [node.expression];
    case 'CallExpression':
      return [node.callee, ...node.arguments.filter(isBabelNode)];
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'LogicalExpression':
    case 'BinaryExpression':
      return [node.left, node.right];
    case 'IfStatement':
      return [node.test, node.consequent, ...(node.alternate ? [node.alternate] : [])];
    default:
      return [];
  }
}

function getEditableSourcePathFromNodeId(nodeId: string): number[] | null {
  return getEditableSourcePathInfoFromNodeId(nodeId)?.path ?? null;
}

function getEditableSourcePathInfoFromNodeId(nodeId: string): { isText: boolean; path: number[] } | null {
  if (!nodeId.startsWith('source:')) return null;
  const pathStart = nodeId.lastIndexOf(':');
  if (pathStart === -1 || pathStart === nodeId.length - 1) return null;

  const rawPath = nodeId.slice(pathStart + 1);
  const isText = rawPath.endsWith('-text');
  const serializedPath = isText ? rawPath.slice(0, -5) : rawPath;
  if (serializedPath === 'root') return { isText, path: [] };
  if (!/^\d+(?:-\d+)*$/.test(serializedPath)) return null;
  return {
    isText,
    path: serializedPath.split('-').map((part) => Number(part)),
  };
}

function getSourceLocationDistance(
  node: BabelNode,
  location: EditableTreeSourceLocation,
): number {
  if (!node.loc) return Number.MAX_SAFE_INTEGER;
  const startDistance = Math.abs(node.loc.start.line - location.startLine) * 1000
    + Math.abs(node.loc.start.column - location.startColumn);
  const endDistance = Math.abs(node.loc.end.line - location.endLine) * 1000
    + Math.abs(node.loc.end.column - location.endColumn);
  return startDistance + endDistance;
}

function compareEditableTreeNodesBySourceOrder(left: EditableTreeNode, right: EditableTreeNode): number {
  const leftLocation = left.sourceLocation;
  const rightLocation = right.sourceLocation;
  if (!leftLocation && !rightLocation) return 0;
  if (!leftLocation) return 1;
  if (!rightLocation) return -1;
  const startLineDelta = leftLocation.startLine - rightLocation.startLine;
  if (startLineDelta !== 0) return startLineDelta;
  const startColumnDelta = leftLocation.startColumn - rightLocation.startColumn;
  if (startColumnDelta !== 0) return startColumnDelta;
  const endLineDelta = leftLocation.endLine - rightLocation.endLine;
  if (endLineDelta !== 0) return endLineDelta;
  return leftLocation.endColumn - rightLocation.endColumn;
}

function createTokenBindingAttributeEdit(
  contents: string,
  element: JSXElement,
  tokenAttributeName: string,
  collectionAttributeName: string,
  token: TokenReference | null,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const tokenAttribute = getJsxAttribute(element, tokenAttributeName);
  const collectionAttribute = getJsxAttribute(element, collectionAttributeName);
  const currentTokenId = tokenAttribute ? readStringAttributeValue(tokenAttribute) : null;
  const currentCollectionId = collectionAttribute ? readStringAttributeValue(collectionAttribute) : null;

  if (!token) {
    if (!tokenAttribute && !collectionAttribute) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    const edits: Array<{ start: number; end: number; text: string }> = [];
    for (const attribute of [tokenAttribute, collectionAttribute]) {
      if (!attribute) continue;
      const edit = createAttributeRemoval(contents, attribute, getAttributeName(attribute) ?? tokenAttributeName);
      if (!edit.ok) return edit;
      edits.push(edit.removal);
    }

    return {
      ok: true,
      changed: edits.length > 0,
      nextContents: edits
        .sort((left, right) => right.start - left.start)
        .reduce((nextContents, edit) => `${nextContents.slice(0, edit.start)}${edit.text}${nextContents.slice(edit.end)}`, contents),
    };
  }

  if (currentTokenId === token.tokenId && currentCollectionId === token.collectionId) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }

  const edits: Array<{ start: number; end: number; text: string }> = [];
  const missingAttributes: string[] = [];

  if (tokenAttribute) {
    const edit = createAttributeReplacement(tokenAttribute, tokenAttributeName, token.tokenId);
    if (!edit.ok) return edit;
    if (currentTokenId !== token.tokenId) edits.push(edit.replacement);
  } else {
    missingAttributes.push(formatAttributeText(tokenAttributeName, token.tokenId));
  }

  if (collectionAttribute) {
    const edit = createAttributeReplacement(collectionAttribute, collectionAttributeName, token.collectionId);
    if (!edit.ok) return edit;
    if (currentCollectionId !== token.collectionId) edits.push(edit.replacement);
  } else {
    missingAttributes.push(formatAttributeText(collectionAttributeName, token.collectionId));
  }

  if (missingAttributes.length > 0) {
    const insertAt = element.openingElement.name.end;
    if (typeof insertAt !== 'number') {
      return {
        ok: false,
        diagnostic: `${tokenAttributeName} could not be inserted because the JSX tag has no source range.`,
      };
    }

    edits.push({
      start: insertAt,
      end: insertAt,
      text: formatMissingAttributeInsertion(contents, insertAt, missingAttributes),
    });
  }

  if (edits.length === 0) return { ok: true, changed: false, nextContents: contents };

  return {
    ok: true,
    changed: true,
    nextContents: edits
      .sort((left, right) => right.start - left.start)
      .reduce((nextContents, edit) => `${nextContents.slice(0, edit.start)}${edit.text}${nextContents.slice(edit.end)}`, contents),
  };
}

function createStringAttributeEdit(
  contents: string,
  element: JSXElement,
  attributeName: string,
  value: string | null,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const attribute = getJsxAttribute(element, attributeName);
  const currentValue = attribute ? readStringAttributeValue(attribute) : null;
  const nextValue = value === null
    ? null
    : normalizeEditableSourceAttributeValue(attributeName, value, { allowEmpty: false });

  if (value !== null && value.trim() && nextValue === null) {
    return {
      ok: false,
      diagnostic: `${attributeName} value is not safe for source writeback.`,
    };
  }

  if (!nextValue) {
    if (!attribute) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    const removal = createAttributeRemoval(contents, attribute, attributeName);
    if (!removal.ok) return removal;
    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, removal.removal.start)}${removal.removal.text}${contents.slice(removal.removal.end)}`,
    };
  }

  if (attribute) {
    if (currentValue === nextValue) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    const replacement = createAttributeReplacement(attribute, attributeName, nextValue);
    if (!replacement.ok) return replacement;
    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, replacement.replacement.start)}${replacement.replacement.text}${contents.slice(replacement.replacement.end)}`,
    };
  }

  const insertAt = element.openingElement.name.end;
  if (typeof insertAt !== 'number') {
    return {
      ok: false,
      diagnostic: `${attributeName} could not be inserted because the JSX tag has no source range.`,
    };
  }

  const insertion = formatMissingAttributeInsertion(contents, insertAt, [formatAttributeText(attributeName, nextValue)]);
  return {
    ok: true,
    changed: true,
    nextContents: `${contents.slice(0, insertAt)}${insertion}${contents.slice(insertAt)}`,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createComponentPropEdit(
  contents: string,
  element: JSXElement,
  propName: string,
  value: SourceComponentPropValue,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  if (propName === 'children') {
    const nextText = typeof value === 'string' ? value : '';
    return createSimpleTextContentEdit(contents, element, nextText);
  }

  const attribute = getJsxAttribute(element, propName);
  const currentValue = attribute ? readComponentPropAttributeValue(attribute) : null;
  const nextValue = normalizeComponentPropValue(value, propName);
  const edits: Array<{ start: number; end: number; text: string }> = [];

  if (nextValue === null) {
    if (attribute) {
      const removal = createAttributeRemoval(contents, attribute, propName);
      if (!removal.ok) return removal;
      edits.push(removal.removal);
    }
  } else if (attribute) {
    if (areComponentPropValuesEqual(currentValue, nextValue)) {
      // Keep going: setting a prop to its current value can still require dependent prop cleanup.
    } else {
      const replacement = createComponentPropReplacement(attribute, propName, nextValue);
      if (!replacement.ok) return replacement;
      edits.push(replacement.replacement);
    }
  } else {
    const insertAt = element.openingElement.name.end;
    if (typeof insertAt !== 'number') {
      return {
        ok: false,
        diagnostic: `${propName} could not be inserted because the JSX tag has no source range.`,
      };
    }

    edits.push({
      start: insertAt,
      end: insertAt,
      text: formatMissingAttributeInsertion(contents, insertAt, [formatComponentPropAttributeText(propName, nextValue)]),
    });
  }

  const cleanup = createComponentPropCleanupEdits(contents, element, propName, nextValue);
  if (!cleanup.ok) return cleanup;
  edits.push(...cleanup.edits);

  if (edits.length === 0) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }

  return {
    ok: true,
    changed: true,
    nextContents: edits
      .sort((left, right) => right.start - left.start)
      .reduce((nextContents, edit) => `${nextContents.slice(0, edit.start)}${edit.text}${nextContents.slice(edit.end)}`, contents),
  };
}

function createSourceComponentTypeEdit(
  contents: string,
  element: JSXElement,
  command: SourceComponentTypeWritebackCommand,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const currentComponentName = getElementDisplayName(element);
  if (currentComponentName === command.targetComponentName) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }
  if (element.openingElement.name.type !== 'JSXIdentifier') {
    return {
      ok: false,
      diagnostic: `${currentComponentName} has no editable component tag name.`,
    };
  }
  if (element.closingElement && element.closingElement.name.type !== 'JSXIdentifier') {
    return {
      ok: false,
      diagnostic: `${currentComponentName} has no editable closing component tag name.`,
    };
  }

  const openingName = element.openingElement.name;
  const closingName = element.closingElement?.name ?? null;
  if (
    typeof openingName.start !== 'number' ||
    typeof openingName.end !== 'number' ||
    (closingName && (typeof closingName.start !== 'number' || typeof closingName.end !== 'number'))
  ) {
    return {
      ok: false,
      diagnostic: `${currentComponentName} has no editable source range for component conversion.`,
    };
  }

  const allowedPropNames = new Set(command.allowedPropNames);
  const managedPropNames = new Set(command.managedPropNames);
  const propOverrides = command.propOverrides ?? {};
  const edits: Array<{ start: number; end: number; text: string }> = [
    { start: openingName.start, end: openingName.end, text: command.targetComponentName },
  ];
  if (closingName && typeof closingName.start === 'number' && typeof closingName.end === 'number') {
    edits.push({ start: closingName.start, end: closingName.end, text: command.targetComponentName });
  }

  const existingPropNames = new Set<string>();
  for (const attribute of element.openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    const attributeName = getAttributeName(attribute);
    if (!attributeName) continue;
    existingPropNames.add(attributeName);
    if (Object.prototype.hasOwnProperty.call(propOverrides, attributeName) && allowedPropNames.has(attributeName)) {
      const replacement = createComponentPropReplacement(attribute, attributeName, propOverrides[attributeName]!);
      if (!replacement.ok) return replacement;
      edits.push(replacement.replacement);
      continue;
    }
    if (allowedPropNames.has(attributeName)) continue;
    if (!managedPropNames.has(attributeName)) continue;
    const removal = createAttributeRemoval(contents, attribute, attributeName);
    if (!removal.ok) return removal;
    edits.push(removal.removal);
    existingPropNames.delete(attributeName);
  }

  const missingFallbackAttributes = Object.entries({
    ...(command.fallbackProps ?? {}),
    ...propOverrides,
  })
    .filter(([propName]) => allowedPropNames.has(propName) && !existingPropNames.has(propName))
    .map(([propName, value]) => formatComponentPropAttributeText(propName, value));
  if (missingFallbackAttributes.length > 0) {
    edits.push({
      start: openingName.end,
      end: openingName.end,
      text: formatMissingAttributeInsertion(contents, openingName.end, missingFallbackAttributes),
    });
  }

  return {
    ok: true,
    changed: true,
    nextContents: edits
      .sort((left, right) => right.start - left.start)
      .reduce((nextContents, edit) => `${nextContents.slice(0, edit.start)}${edit.text}${nextContents.slice(edit.end)}`, contents),
  };
}

function createComponentPropCleanupEdits(
  contents: string,
  element: JSXElement,
  propName: string,
  nextValue: SourceComponentPropValue,
):
  | { ok: true; edits: Array<{ start: number; end: number; text: string }> }
  | { ok: false; diagnostic: string } {
  if (propName !== 'mask' || nextValue !== 'none') return { ok: true, edits: [] };

  const edits: Array<{ start: number; end: number; text: string }> = [];
  for (const dependentProp of ['maskAngle', 'maskCurve', 'maskEnd', 'maskStart']) {
    const dependentAttribute = getJsxAttribute(element, dependentProp);
    if (!dependentAttribute) continue;
    const removal = createAttributeRemoval(contents, dependentAttribute, dependentProp);
    if (!removal.ok) return removal;
    edits.push(removal.removal);
  }
  return { ok: true, edits };
}

function createStyleDeclarationEdit(
  contents: string,
  program: Program,
  element: JSXElement,
  property: SourceStyleProperty,
  value: string | null,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const attribute = getJsxAttribute(element, 'style');
  const nextValue = normalizeSourceStyleDeclarationValue(property, value);

  if (!attribute) {
    if (!nextValue) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    const insertAt = element.openingElement.name.end;
    if (typeof insertAt !== 'number') {
      return {
        ok: false,
        diagnostic: `${property} could not be inserted because the JSX tag has no source range.`,
      };
    }

    const insertion = formatMissingAttributeInsertion(contents, insertAt, [formatStyleAttributeText(property, nextValue)]);
    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, insertAt)}${insertion}${contents.slice(insertAt)}`,
    };
  }

  const styleObjectResult = getStyleObjectExpression(attribute, program);
  if (!styleObjectResult) {
    return {
      ok: false,
      diagnostic: 'Only object-literal or same-file object-identifier JSX style attributes are editable in the source Inspector.',
    };
  }
  const { inline, object: styleObject } = styleObjectResult;

  const propertyMatch = findStyleObjectProperty(styleObject, property);
  const currentValue = propertyMatch ? readStylePropertyValue(propertyMatch) : null;

  if (!nextValue) {
    if (!propertyMatch) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    if (inline && styleObject.properties.length === 1) {
      const removal = createAttributeRemoval(contents, attribute, 'style');
      if (!removal.ok) return removal;
      return {
        ok: true,
        changed: true,
        nextContents: `${contents.slice(0, removal.removal.start)}${removal.removal.text}${contents.slice(removal.removal.end)}`,
      };
    }

    const removal = createStylePropertyRemoval(contents, styleObject, propertyMatch, property);
    if (!removal.ok) return removal;
    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, removal.removal.start)}${removal.removal.text}${contents.slice(removal.removal.end)}`,
    };
  }

  if (propertyMatch) {
    if (currentValue === nextValue) {
      return {
        ok: true,
        changed: false,
        nextContents: contents,
      };
    }

    if (typeof propertyMatch.start !== 'number' || typeof propertyMatch.end !== 'number') {
      return {
        ok: false,
        diagnostic: `${property} could not be updated because the JSX style property has no source range.`,
      };
    }

    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, propertyMatch.start)}${formatStylePropertyText(property, nextValue)}${contents.slice(propertyMatch.end)}`,
    };
  }

  if (typeof styleObject.start !== 'number' || typeof styleObject.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${property} could not be inserted because the JSX style object has no source range.`,
    };
  }

  const propertyText = formatStylePropertyText(property, nextValue);
  if (styleObject.properties.length === 0) {
    const start = styleObject.start + 1;
    const end = styleObject.end - 1;
    return {
      ok: true,
      changed: true,
      nextContents: `${contents.slice(0, start)} ${propertyText} ${contents.slice(end)}`,
    };
  }

  const lastProperty = styleObject.properties[styleObject.properties.length - 1];
  if (!lastProperty || typeof lastProperty.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${property} could not be inserted because the JSX style object has no editable insertion point.`,
    };
  }

  return {
    ok: true,
    changed: true,
    nextContents: `${contents.slice(0, lastProperty.end)}, ${propertyText}${contents.slice(lastProperty.end)}`,
  };
}

const CSS_IMAGE_FUNCTION_PATTERN = /^(?:url|image|(?:-webkit-)?image-set|cross-fade|element|paint|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)\(/i;
const CSS_IMAGE_KEYWORD_PATTERN = /^(?:none|initial|inherit|unset|revert|revert-layer)$/i;

export function normalizeSourceStyleDeclarationValue(property: SourceStyleProperty | string, value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (property !== 'background-image') return trimmed;
  return normalizeBackgroundImageStyleValue(trimmed);
}

function normalizeBackgroundImageStyleValue(value: string): string {
  if (
    CSS_IMAGE_KEYWORD_PATTERN.test(value) ||
    CSS_IMAGE_FUNCTION_PATTERN.test(value) ||
    value.startsWith('var(')
  ) {
    return value;
  }

  if (!looksLikeImageSource(value)) return value;
  return `url("${escapeCssUrlString(value)}")`;
}

function looksLikeImageSource(value: string): boolean {
  if (/\s/.test(value)) return false;
  return /^(?:https?:|data:image\/|blob:|\/|\.{1,2}\/|[\w.-]+\/)/i.test(value) ||
    /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value);
}

function escapeCssUrlString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function getStyleObjectExpression(attribute: JSXAttribute, program: Program): { inline: boolean; object: ObjectExpression } | null {
  if (
    attribute.value?.type === 'JSXExpressionContainer' &&
    unwrapTransparentWritebackExpression(attribute.value.expression).type === 'ObjectExpression'
  ) {
    return {
      inline: true,
      object: unwrapTransparentWritebackExpression(attribute.value.expression) as ObjectExpression,
    };
  }

  if (attribute.value?.type !== 'JSXExpressionContainer') return null;
  const expression = unwrapTransparentWritebackExpression(attribute.value.expression);
  const beforePosition = typeof attribute.start === 'number' ? attribute.start : Number.POSITIVE_INFINITY;
  if (expression.type === 'Identifier') {
    const object = findObjectExpressionBinding(program, expression.name, beforePosition);
    return object ? { inline: false, object } : null;
  }
  if (expression.type === 'CallExpression') {
    const returnObject = findStyleFunctionReturnObject(program, expression, beforePosition);
    return returnObject ? { inline: false, object: returnObject } : null;
  }

  return null;
}

function findObjectExpressionBinding(program: Program, identifierName: string, beforePosition: number): ObjectExpression | null {
  let matchNode: ObjectExpression | null = null;
  let matchStart = -1;
  visitWritebackAst(program, (node) => {
    if (node.type !== 'VariableDeclarator') return;
    if (node.id.type !== 'Identifier' || node.id.name !== identifierName || !node.init) return;
    if (!isBeforeWritebackPosition(node, beforePosition)) return;
    const init = unwrapTransparentWritebackExpression(node.init);
    if (init.type !== 'ObjectExpression') return;
    const start = typeof node.start === 'number' ? node.start : -1;
    if (!matchNode || start >= matchStart) {
      matchNode = init;
      matchStart = start;
    }
  });
  return matchNode;
}

function findStyleFunctionReturnObject(program: Program, callExpression: Extract<Expression, { type: 'CallExpression' }>, beforePosition: number): ObjectExpression | null {
  if (callExpression.callee.type !== 'Identifier') return null;
  const functionName = callExpression.callee.name;
  let matchNode: ObjectExpression | null = null;
  let matchStart = -1;
  visitWritebackAst(program, (node) => {
    if (!isBeforeWritebackPosition(node, beforePosition)) return;
    if (node.type === 'FunctionDeclaration' && node.id?.name === functionName) {
      const object = getWritebackFunctionReturnObject(node.body);
      const start = typeof node.start === 'number' ? node.start : -1;
      if (object && (!matchNode || start >= matchStart)) {
        matchNode = object;
        matchStart = start;
      }
      return;
    }
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === functionName && node.init) {
      const init = unwrapTransparentWritebackExpression(node.init);
      if (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression') return;
      const object = getWritebackFunctionReturnObject(init.body);
      const start = typeof node.start === 'number' ? node.start : -1;
      if (object && (!matchNode || start >= matchStart)) {
        matchNode = object;
        matchStart = start;
      }
    }
  });
  return matchNode;
}

function getWritebackFunctionReturnObject(body: BabelNode): ObjectExpression | null {
  const unwrappedBody = unwrapTransparentWritebackExpression(body);
  if (unwrappedBody.type === 'ObjectExpression') return unwrappedBody;
  if (unwrappedBody.type !== 'BlockStatement') return null;
  for (const statement of unwrappedBody.body) {
    if (statement.type !== 'ReturnStatement' || !statement.argument) continue;
    const argument = unwrapTransparentWritebackExpression(statement.argument);
    return argument.type === 'ObjectExpression' ? argument : null;
  }
  return null;
}

function visitWritebackAst(node: unknown, visitor: (node: BabelNode) => void) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child) => visitWritebackAst(child, visitor));
    return;
  }

  const candidate = node as Partial<BabelNode>;
  if (typeof candidate.type !== 'string') return;
  visitor(candidate as BabelNode);

  for (const [key, child] of Object.entries(candidate)) {
    if (
      key === 'loc' ||
      key === 'start' ||
      key === 'end' ||
      key === 'leadingComments' ||
      key === 'innerComments' ||
      key === 'trailingComments'
    ) continue;
    visitWritebackAst(child, visitor);
  }
}

function isBeforeWritebackPosition(node: BabelNode, beforePosition: number): boolean {
  return typeof node.start !== 'number' || node.start < beforePosition;
}

function unwrapTransparentWritebackExpression(node: BabelNode): BabelNode {
  let current = node;
  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression' ||
    current.type === 'TSTypeAssertion'
  ) {
    current = current.expression;
  }
  return current;
}

function findStyleObjectProperty(
  objectExpression: ObjectExpression,
  property: SourceStyleProperty,
): ObjectProperty | null {
  const matches = objectExpression.properties.filter((candidate): candidate is ObjectProperty =>
    candidate.type === 'ObjectProperty' && getStylePropertyName(candidate.key) === property,
  );
  return matches[matches.length - 1] ?? null;
}

function getStylePropertyName(key: BabelNode): string | null {
  if (key.type === 'Identifier') return camelToKebabCase(key.name);
  if (key.type === 'StringLiteral') return camelToKebabCase(key.value);
  return null;
}

function readStylePropertyValue(property: ObjectProperty): string | null {
  if (property.value.type === 'StringLiteral') return property.value.value;
  if (property.value.type === 'NumericLiteral') return String(property.value.value);
  return null;
}

function createStylePropertyRemoval(
  contents: string,
  objectExpression: ObjectExpression,
  property: ObjectProperty,
  propertyName: SourceStyleProperty,
):
  | { ok: true; removal: { start: number; end: number; text: string } }
  | { ok: false; diagnostic: string } {
  if (typeof property.start !== 'number' || typeof property.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${propertyName} could not be removed because the JSX style property has no source range.`,
    };
  }

  let start = property.start;
  let end = property.end;
  while (end < contents.length && /\s/.test(contents[end] ?? '')) end += 1;
  if (contents[end] === ',') {
    end += 1;
    while (end < contents.length && /[ \t]/.test(contents[end] ?? '')) end += 1;
    return {
      ok: true,
      removal: { start, end, text: '' },
    };
  }

  while (start > (objectExpression.start ?? 0) && /[ \t]/.test(contents[start - 1] ?? '')) start -= 1;
  if (contents[start - 1] === ',') {
    start -= 1;
    while (start > (objectExpression.start ?? 0) && /[ \t]/.test(contents[start - 1] ?? '')) start -= 1;
  }
  return {
    ok: true,
    removal: { start, end, text: '' },
  };
}

function createJsxTextContentEdit(
  contents: string,
  textNode: JSXText,
  text: string,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  if (typeof textNode.start !== 'number' || typeof textNode.end !== 'number') {
    return {
      ok: false,
      diagnostic: 'Text node content could not be updated because it has no editable source range.',
    };
  }

  if (normalizeSourceText(textNode.value) === text) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }

  return {
    ok: true,
    changed: true,
    nextContents: `${contents.slice(0, textNode.start)}${escapeJsxTextContent(text)}${contents.slice(textNode.end)}`,
  };
}

function createSimpleTextContentEdit(
  contents: string,
  element: JSXElement,
  text: string,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  if (!element.closingElement) {
    return {
      ok: false,
      diagnostic: 'Self-closing JSX elements do not have editable text content.',
    };
  }
  if (typeof element.openingElement.end !== 'number' || typeof element.closingElement.start !== 'number') {
    return {
      ok: false,
      diagnostic: 'Text content could not be updated because the JSX element has no editable source range.',
    };
  }

  const currentText = readSimpleTextContent(element);
  if (currentText === null) {
    return {
      ok: false,
      diagnostic: 'Only simple JSX text content is editable in this Inspector field.',
    };
  }
  if (currentText === text) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }

  const start = element.openingElement.end;
  const end = element.closingElement.start;
  return {
    ok: true,
    changed: true,
    nextContents: `${contents.slice(0, start)}${escapeJsxTextContent(text)}${contents.slice(end)}`,
  };
}

function readSimpleTextContent(element: JSXElement): string | null {
  let text = '';
  for (const child of element.children) {
    if (child.type === 'JSXText') {
      text += child.value;
      continue;
    }
    if (child.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression') {
      continue;
    }
    return null;
  }
  return normalizeSourceText(text);
}

function getSourceInsertChildTemplate(templateId: SourceInsertChildTemplateId): SourceInsertChildTemplate | null {
  return SOURCE_INSERT_CHILD_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

function createSourceChildInsertionEdit(
  contents: string,
  container: JsxInsertionContainer,
  template: SourceInsertChildTemplate,
  iconDefault: SourceInsertChildIconDefault | undefined,
  targetIndex: number | undefined,
  allowExplicitUnknownSlotContainer: boolean,
):
  | { ok: true; nextContents: string }
  | { ok: false; diagnostic: string } {
  const info = getJsxInsertionContainerInfo(container);
  if (!info) {
    return { ok: false, diagnostic: 'Insertion target has no editable source range.' };
  }
  if (info.isVoid) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive children because it is a void HTML element.`,
    };
  }
  if (info.isComponentWithoutSlot && !allowExplicitUnknownSlotContainer) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive arbitrary children because it is not a slot container component.`,
    };
  }
  if (!allowExplicitUnknownSlotContainer && !canInsertSourceChildTemplateIntoElement(info.displayName, template.id)) {
    return {
      ok: false,
      diagnostic: `${template.label} cannot be inserted into ${info.displayName} because that slot only accepts compatible children.`,
    };
  }
  if (!info.isFragment && (info.isSelfClosing || !info.hasClosing)) {
    return createSelfClosingChildInsertionEdit({
      contents,
      element: info.container as JSXElement,
      formatChildText: (childIndent, grandChildIndent) => formatSourceChildSnippet(template, childIndent, grandChildIndent, iconDefault),
      noRangeDiagnostic: `${info.displayName} has no editable source insertion range.`,
    });
  }
  if (info.closingStart === null) {
    return {
      ok: false,
      diagnostic: `${info.displayName} has no editable source insertion range.`,
    };
  }

  const parentIndent = getLineIndent(contents, info.openingStart);
  const childIndent = `${parentIndent}  `;
  const childText = formatSourceChildSnippet(template, childIndent, `${childIndent}  `, iconDefault);
  const indexedInsertionPoint = getIndexedSourceChildInsertionPoint(contents, container, targetIndex);
  const insertionPoint = indexedInsertionPoint ?? info.closingStart;
  const text = indexedInsertionPoint === null
    ? `\n${childIndent}${childText}\n${parentIndent}`
    : `${childIndent}${childText}\n`;

  return {
    ok: true,
    nextContents: `${contents.slice(0, insertionPoint)}${text}${contents.slice(insertionPoint)}`,
  };
}

function createSourceComponentInsertionEdit(
  contents: string,
  container: JsxInsertionContainer,
  command: SourceComponentInsertWritebackCommand,
):
  | { ok: true; nextContents: string }
  | { ok: false; diagnostic: string } {
  const info = getJsxInsertionContainerInfo(container);
  if (!info) {
    return { ok: false, diagnostic: 'Insertion target has no editable source range.' };
  }
  if (info.isVoid) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive component children because it is a void HTML element.`,
    };
  }
  const allowExplicitUnknownSlotContainer = canTreatWritebackNodeAsExplicitUnknownChildrenContainer(command.node);
  if (info.isComponentWithoutSlot && !allowExplicitUnknownSlotContainer) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive component children because it is not a slot container component.`,
    };
  }
  if (!allowExplicitUnknownSlotContainer && !canInsertComponentChildrenIntoElement(info.displayName)) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive component children because it only accepts inline text children.`,
    };
  }
  if (!info.isFragment && (info.isSelfClosing || !info.hasClosing)) {
    return createSelfClosingChildInsertionEdit({
      contents,
      element: info.container as JSXElement,
      formatChildText: () => formatSourceComponentSnippet(command),
      noRangeDiagnostic: `${info.displayName} has no editable source insertion range.`,
    });
  }
  if (info.closingStart === null) {
    return {
      ok: false,
      diagnostic: `${info.displayName} has no editable source insertion range.`,
    };
  }

  const parentIndent = getLineIndent(contents, info.openingStart);
  const childIndent = `${parentIndent}  `;
  const indexedInsertionPoint = getIndexedSourceChildInsertionPoint(contents, container, command.targetIndex);
  const insertionPoint = indexedInsertionPoint ?? info.closingStart;
  const componentText = formatSourceComponentSnippet(command);
  const text = indexedInsertionPoint === null
    ? `\n${childIndent}${componentText}\n${parentIndent}`
    : `${childIndent}${componentText}\n`;

  return {
    ok: true,
    nextContents: `${contents.slice(0, insertionPoint)}${text}${contents.slice(insertionPoint)}`,
  };
}

function canTreatWritebackNodeAsExplicitUnknownChildrenContainer(node: EditableTreeNode): boolean {
  const sourceJsxName = node.source?.jsxName ?? '';
  if (!sourceJsxName || getSourceChildrenSlotKind(sourceJsxName)) return false;
  if (hasRegisteredSourceSlotContract(sourceJsxName)) return false;
  if (!node.sourceLocation || !node.source?.sourceFile) return false;
  const pathInfo = getEditableSourcePathInfoFromNodeId(node.id);
  return Boolean(pathInfo && !pathInfo.isText);
}

function getIndexedSourceChildInsertionPoint(
  contents: string,
  container: JsxInsertionContainer,
  targetIndex: number | undefined,
): number | null {
  if (typeof targetIndex !== 'number' || !Number.isInteger(targetIndex)) return null;
  const children = getEditableJsxChildren(container);
  const clampedIndex = Math.max(0, Math.min(targetIndex, children.length));
  const targetChild = children[clampedIndex];
  if (!targetChild) return null;
  const targetRange = getEditableJsxChildRange(contents, getEditableJsxChildAnchorNode(targetChild));
  return targetRange?.start ?? null;
}

function createSelfClosingChildInsertionEdit({
  contents,
  element,
  formatChildText,
  noRangeDiagnostic,
}: {
  contents: string;
  element: JSXElement;
  formatChildText: (childIndent: string, grandChildIndent: string) => string;
  noRangeDiagnostic: string;
}):
  | { ok: true; nextContents: string }
  | { ok: false; diagnostic: string } {
  if (typeof element.openingElement.start !== 'number' || typeof element.openingElement.end !== 'number') {
    return {
      ok: false,
      diagnostic: noRangeDiagnostic,
    };
  }

  const parentIndent = getLineIndent(contents, element.openingElement.start);
  const childIndent = `${parentIndent}  `;
  const childText = formatChildText(childIndent, `${childIndent}  `);
  const openingText = contents.slice(element.openingElement.start, element.openingElement.end);
  const openTag = openingText.replace(/\s*\/\s*>$/, '>');
  const closeTag = `</${getElementDisplayName(element)}>`;
  const replacement = `${openTag}\n${childIndent}${childText.trim()}\n${parentIndent}${closeTag}`;

  return {
    ok: true,
    nextContents: `${contents.slice(0, element.openingElement.start)}${replacement}${contents.slice(element.openingElement.end)}`,
  };
}

function createSourcePasteNodeEdit(
  contents: string,
  container: JsxInsertionContainer,
  items: SourceCopiedNodeItem[],
  children: EditableJsxPathChild[],
  targetIndex: number | undefined,
):
  | { ok: true; nextContents: string }
  | { ok: false; diagnostic: string } {
  const info = getJsxInsertionContainerInfo(container);
  if (!info) {
    return { ok: false, diagnostic: 'Paste target has no editable source range.' };
  }
  if (info.isVoid) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive pasted children because it is a void HTML element.`,
    };
  }
  if (info.isComponentWithoutSlot) {
    return {
      ok: false,
      diagnostic: `${info.displayName} cannot receive pasted children because it is not a slot container component.`,
    };
  }

  for (const child of children) {
    const childName = getEditableJsxChildDisplayName(child);
    if (!canMoveSourceChildIntoParent(info.displayName, childName)) {
      return {
        ok: false,
        diagnostic: `${childName} cannot be pasted into ${info.displayName} because that slot only accepts compatible children.`,
      };
    }
  }

  const parentIndent = getLineIndent(contents, info.openingStart);
  const childIndent = `${parentIndent}  `;
  const pastedText = formatSourceClipboardBlock(items, childIndent);
  if (!pastedText.trim()) {
    return {
      ok: false,
      diagnostic: 'Clipboard has no source text to paste.',
    };
  }

  if (!info.isFragment && (info.isSelfClosing || !info.hasClosing)) {
    const openingText = contents.slice(info.openingStart, info.openingEnd);
    const openTag = openingText.replace(/\s*\/\s*>$/, '>');
    const closeTag = `</${info.displayName}>`;
    const replacement = `${openTag}\n${pastedText}\n${parentIndent}${closeTag}`;
    return {
      ok: true,
      nextContents: `${contents.slice(0, info.openingStart)}${replacement}${contents.slice(info.openingEnd)}`,
    };
  }

  if (info.closingStart === null) {
    return {
      ok: false,
      diagnostic: `${info.displayName} has no editable source insertion range.`,
    };
  }

  const indexedInsertionPoint = getIndexedSourceChildInsertionPoint(contents, container, targetIndex);
  const insertionPoint = indexedInsertionPoint ?? info.closingStart;
  const text = indexedInsertionPoint === null
    ? `\n${pastedText}\n${parentIndent}`
    : `${pastedText}\n`;
  return {
    ok: true,
    nextContents: `${contents.slice(0, insertionPoint)}${text}${contents.slice(insertionPoint)}`,
  };
}

function createSourceWrapNodeEdit(
  command: SourceWrapNodeWritebackCommand,
  program: Program,
  locations: EditableTreeSourceLocation[],
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const wrapperName = getSourceWrapWrapperName(command.wrapper);
  const targets = command.nodes.map((node, index) => {
    const pathInfo = getEditableSourcePathInfoFromNodeId(node.id);
    const location = locations[index];
    const target = location ? findEditableJsxChildForStructure(program, node, location) : null;
    return { node, pathInfo, target };
  });

  if (targets.some(({ pathInfo }) => !pathInfo || pathInfo.path.length === 0)) {
    return {
      ok: false,
      diagnostic: 'Source root layers cannot be wrapped. Select child layers instead.',
    };
  }

  if (targets.some(({ target }) => !target)) {
    return {
      ok: false,
      diagnostic: 'Selected layers could not be matched to editable source ranges.',
    };
  }

  const resolvedTargets = targets.map(({ node, pathInfo, target }) => ({
    node,
    pathInfo: pathInfo!,
    target: target!,
  }));
  const firstParentPath = resolvedTargets[0]?.pathInfo.path.slice(0, -1) ?? [];
  if (resolvedTargets.some(({ pathInfo }) => !pathsAreEqual(pathInfo.path.slice(0, -1), firstParentPath))) {
    return {
      ok: false,
      diagnostic: 'Wrap selection requires layers that share the same parent.',
    };
  }

  const firstParent = resolvedTargets[0]?.target.parent ?? null;
  if (!firstParent || resolvedTargets.some(({ target }) => target.parent !== firstParent)) {
    return {
      ok: false,
      diagnostic: 'Selected layers could not be resolved under one editable parent.',
    };
  }

  const parentElementName = firstParent.type === 'JSXElement' ? getElementDisplayName(firstParent) : null;
  if (parentElementName && !canMoveSourceChildIntoParent(parentElementName, wrapperName)) {
    return {
      ok: false,
      diagnostic: `${wrapperName} cannot be inserted into ${parentElementName}.`,
    };
  }

  const sortedTargets = [...resolvedTargets].sort((left, right) => left.target.index - right.target.index);
  const seenIndexes = new Set<number>();
  for (const { node, target } of sortedTargets) {
    if (seenIndexes.has(target.index)) {
      return {
        ok: false,
        diagnostic: 'Wrap selection contains duplicate source layers.',
      };
    }
    seenIndexes.add(target.index);

    const childName = node.source?.jsxName ?? getEditableJsxChildDisplayName(target.child);
    if (!canMoveSourceChildIntoParent(wrapperName, childName)) {
      return {
        ok: false,
        diagnostic: `${childName} cannot be wrapped in ${wrapperName}.`,
      };
    }
  }

  const ranges = sortedTargets.map(({ target }) => getEditableJsxChildRange(command.contents, target.childNode));
  if (ranges.some((range) => !range)) {
    return {
      ok: false,
      diagnostic: 'Selected layers do not have stable source ranges for wrapping.',
    };
  }
  const resolvedRanges = ranges as Array<{ start: number; end: number }>;
  for (let index = 1; index < resolvedRanges.length; index += 1) {
    if (resolvedRanges[index - 1].start >= resolvedRanges[index].start) {
      return {
        ok: false,
        diagnostic: 'Selected layer source ranges are not in stable parent order.',
      };
    }
  }

  const insertionPoint = resolvedRanges[0]!.start;
  const wrapperIndent = getLineIndent(command.contents, insertionPoint);
  const childIndent = `${wrapperIndent}  `;
  const wrappedChildren = resolvedRanges
    .map((range) => reindentMovedSourceBlock(command.contents.slice(range.start, range.end), childIndent).trimEnd())
    .join('\n');
  const wrapperText = [
    `${wrapperIndent}${formatSourceWrapOpeningTag(command.wrapper)}`,
    wrappedChildren,
    `${wrapperIndent}${formatSourceWrapClosingTag(command.wrapper)}`,
  ].join('\n') + '\n';

  let nextContents = command.contents;
  for (const range of [...resolvedRanges].sort((left, right) => right.start - left.start)) {
    nextContents = `${nextContents.slice(0, range.start)}${nextContents.slice(range.end)}`;
  }

  return {
    ok: true,
    changed: true,
    nextContents: `${nextContents.slice(0, insertionPoint)}${wrapperText}${nextContents.slice(insertionPoint)}`,
  };
}

type SourceMapExtractFieldCandidate = {
  attributeName?: string;
  fieldName?: string;
  kind: 'attribute' | 'text';
  ownerName: string;
  range: { start: number; end: number };
  signature: string;
  value: EditableTreeSourcePropPrimitive;
};

function createSourceExtractSelectedNodesToMapEdit(
  command: SourceExtractSelectedNodesToMapWritebackCommand,
  program: Program,
  locations: EditableTreeSourceLocation[],
):
  | { ok: true; arrayName: string; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const targets = command.nodes.map((node, index) => {
    const pathInfo = getEditableSourcePathInfoFromNodeId(node.id);
    const location = locations[index];
    const target = location ? findEditableJsxChildForStructure(program, node, location) : null;
    return { node, pathInfo, target };
  });

  if (targets.some(({ pathInfo }) => !pathInfo || pathInfo.path.length === 0 || pathInfo.isText)) {
    return {
      ok: false,
      diagnostic: 'Create map requires source-backed element layers. Text/root layers cannot be converted yet.',
    };
  }

  if (targets.some(({ target }) => !target)) {
    return {
      ok: false,
      diagnostic: 'Selected layers could not be matched to editable source ranges.',
    };
  }

  const resolvedTargets = targets.map(({ node, pathInfo, target }) => ({
    node,
    pathInfo: pathInfo!,
    target: target!,
  }));
  const firstParentPath = resolvedTargets[0]?.pathInfo.path.slice(0, -1) ?? [];
  if (resolvedTargets.some(({ pathInfo }) => !pathsAreEqual(pathInfo.path.slice(0, -1), firstParentPath))) {
    return {
      ok: false,
      diagnostic: 'Create map requires selected layers that share the same parent.',
    };
  }

  const firstParent = resolvedTargets[0]?.target.parent ?? null;
  if (!firstParent || resolvedTargets.some(({ target }) => target.parent !== firstParent)) {
    return {
      ok: false,
      diagnostic: 'Selected layers could not be resolved under one editable parent.',
    };
  }

  const sortedTargets = [...resolvedTargets].sort((left, right) => left.target.index - right.target.index);
  const seenIndexes = new Set<number>();
  for (const { target } of sortedTargets) {
    if (seenIndexes.has(target.index)) {
      return {
        ok: false,
        diagnostic: 'Create map selection contains duplicate source layers.',
      };
    }
    seenIndexes.add(target.index);
  }
  for (let index = 1; index < sortedTargets.length; index += 1) {
    if (sortedTargets[index]!.target.index !== sortedTargets[index - 1]!.target.index + 1) {
      return {
        ok: false,
        diagnostic: 'Create map requires contiguous sibling layers.',
      };
    }
  }

  if (sortedTargets.some(({ target }) => target.childNode.type !== 'JSXElement')) {
    return {
      ok: false,
      diagnostic: 'Create map currently supports JSX element siblings only.',
    };
  }

  const ranges = sortedTargets.map(({ target }) => getEditableJsxChildRange(command.contents, target.childNode));
  if (ranges.some((range) => !range)) {
    return {
      ok: false,
      diagnostic: 'Selected layers do not have stable source ranges for map conversion.',
    };
  }
  const resolvedRanges = ranges as Array<{ start: number; end: number }>;
  for (let index = 1; index < resolvedRanges.length; index += 1) {
    if (resolvedRanges[index - 1]!.start >= resolvedRanges[index]!.start) {
      return {
        ok: false,
        diagnostic: 'Selected layer source ranges are not in stable parent order.',
      };
    }
  }

  const candidateRows = sortedTargets.map(({ target }) =>
    collectSourceMapExtractFieldCandidates(command.contents, target.childNode as JSXElement),
  );
  const firstCandidates = candidateRows[0] ?? [];
  if (firstCandidates.length === 0) {
    return {
      ok: false,
      diagnostic: 'Selected layers do not expose repeated text or literal props that can become array fields.',
    };
  }
  if (candidateRows.some((row) => row.length !== firstCandidates.length)) {
    return {
      ok: false,
      diagnostic: 'Selected layers do not have the same editable text/prop structure.',
    };
  }
  if (candidateRows.some((row) => row.some((candidate, index) => candidate.signature !== firstCandidates[index]?.signature))) {
    return {
      ok: false,
      diagnostic: 'Selected layers do not have matching repeated field structure.',
    };
  }

  const variableCandidateIndexes = firstCandidates
    .map((_candidate, index) => index)
    .filter((candidateIndex) => {
      const firstValue = candidateRows[0]?.[candidateIndex]?.value;
      return candidateRows.some((row) => row[candidateIndex]?.value !== firstValue);
    });
  if (variableCandidateIndexes.length === 0) {
    return {
      ok: false,
      diagnostic: 'Selected layers have no differing literal text or props to extract into an array.',
    };
  }

  const fieldNames = createSourceMapExtractFieldNames(variableCandidateIndexes.map((index) => firstCandidates[index]!));
  const arrayName = getUniqueSourceMapArrayName(
    command.contents,
    normalizeSourceMapIdentifier(command.arrayName ?? getDefaultSourceMapArrayName(firstParent)),
  );
  const rows = candidateRows.map((row, rowIndex): EditableTreeSourcePropObject => {
    const item: EditableTreeSourcePropObject = { id: `item-${rowIndex + 1}` };
    variableCandidateIndexes.forEach((candidateIndex, fieldIndex) => {
      item[fieldNames[fieldIndex]!] = row[candidateIndex]!.value;
    });
    return item;
  });

  const firstTarget = sortedTargets[0]!.target;
  const firstRange = resolvedRanges[0]!;
  const lastRange = resolvedRanges[resolvedRanges.length - 1]!;
  const template = createSourceMapTemplateText({
    contents: command.contents,
    fieldNames,
    fields: variableCandidateIndexes.map((candidateIndex) => firstCandidates[candidateIndex]!),
    range: firstRange,
    rootElement: firstTarget.childNode as JSXElement,
  });
  if (!template.ok) return template;

  const returnStatement = findReturnStatementContainingRange(program, firstRange.start, lastRange.end);
  if (!returnStatement || typeof returnStatement.start !== 'number') {
    return {
      ok: false,
      diagnostic: 'Create map can only insert array data inside a function with an explicit return statement.',
    };
  }

  const childIndent = getLineIndent(command.contents, firstRange.start);
  const templateIndent = `${childIndent}  `;
  const mappedTemplate = reindentMovedSourceBlock(template.text.trim(), templateIndent).trimEnd();
  const mapText = `${childIndent}{${arrayName}.map((item) => (\n${mappedTemplate}\n${childIndent}))}\n`;
  const contentsWithMap = `${command.contents.slice(0, firstRange.start)}${mapText}${command.contents.slice(lastRange.end)}`;

  const returnLineStart = command.contents.lastIndexOf('\n', Math.max(0, returnStatement.start - 1)) + 1;
  const declarationIndent = getLineIndentBefore(command.contents, returnStatement.start);
  const declaration = formatSourceMapArrayDeclaration(arrayName, rows, declarationIndent);
  return {
    ok: true,
    arrayName,
    changed: true,
    nextContents: `${contentsWithMap.slice(0, returnLineStart)}${declaration}${contentsWithMap.slice(returnLineStart)}`,
  };
}

function collectSourceMapExtractFieldCandidates(
  contents: string,
  root: JSXElement,
): SourceMapExtractFieldCandidate[] {
  const candidates: SourceMapExtractFieldCandidate[] = [];

  function visit(container: JSXElement | JSXFragment, path: number[]) {
    if (container.type === 'JSXElement') {
      const ownerName = getElementDisplayName(container);
      for (const attribute of container.openingElement.attributes) {
        if (attribute.type !== 'JSXAttribute') continue;
        const attributeName = getAttributeName(attribute);
        if (!attributeName || shouldSkipSourceMapExtractAttribute(attributeName)) continue;
        const literal = readSourceMapExtractAttributeLiteral(attribute);
        if (!literal) continue;
        candidates.push({
          attributeName,
          kind: 'attribute',
          ownerName,
          range: literal.range,
          signature: `${path.join('.')}:attribute:${ownerName}:${attributeName}`,
          value: literal.value,
        });
      }
    }

    for (const [index, child] of container.children.entries()) {
      const childPath = [...path, index];
      if (child.type === 'JSXText') {
        const value = normalizeSourceText(child.value);
        if (value.trim() && typeof child.start === 'number' && typeof child.end === 'number') {
          candidates.push({
            kind: 'text',
            ownerName: getJsxContainerDisplayName(container),
            range: { start: child.start, end: child.end },
            signature: `${childPath.join('.')}:text:${getJsxContainerDisplayName(container)}`,
            value,
          });
        }
        continue;
      }
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        visit(child, childPath);
        continue;
      }
      if (child.type !== 'JSXExpressionContainer' || child.expression.type === 'JSXEmptyExpression') continue;
      if (child.expression.type === 'JSXElement' || child.expression.type === 'JSXFragment') {
        visit(child.expression, childPath);
        continue;
      }
      const expressionValue = readSourceMapExtractExpressionLiteral(child.expression);
      if (expressionValue === null || typeof child.start !== 'number' || typeof child.end !== 'number') continue;
      candidates.push({
        kind: 'text',
        ownerName: getJsxContainerDisplayName(container),
        range: { start: child.start, end: child.end },
        signature: `${childPath.join('.')}:text-expression:${getJsxContainerDisplayName(container)}`,
        value: expressionValue,
      });
    }
  }

  visit(root, []);
  return candidates;
}

function shouldSkipSourceMapExtractAttribute(attributeName: string): boolean {
  return attributeName === 'key' ||
    attributeName === 'className' ||
    attributeName === 'style' ||
    attributeName.startsWith('data-wb-') ||
    attributeName.startsWith('data-workbench-');
}

function readSourceMapExtractAttributeLiteral(attribute: JSXAttribute): {
  range: { start: number; end: number };
  value: EditableTreeSourcePropPrimitive;
} | null {
  if (!attribute.value || typeof attribute.value.start !== 'number' || typeof attribute.value.end !== 'number') return null;
  if (attribute.value.type === 'StringLiteral') {
    return {
      range: { start: attribute.value.start, end: attribute.value.end },
      value: attribute.value.value,
    };
  }
  if (attribute.value.type !== 'JSXExpressionContainer') return null;
  if (attribute.value.expression.type === 'JSXEmptyExpression') return null;
  const value = readSourceMapExtractExpressionLiteral(attribute.value.expression);
  return value === null ? null : {
    range: { start: attribute.value.start, end: attribute.value.end },
    value,
  };
}

function readSourceMapExtractExpressionLiteral(expression: Expression): EditableTreeSourcePropPrimitive | null {
  if (expression.type === 'StringLiteral') return expression.value;
  if (expression.type === 'NumericLiteral') return expression.value;
  if (expression.type === 'BooleanLiteral') return expression.value;
  return null;
}

function createSourceMapExtractFieldNames(fields: SourceMapExtractFieldCandidate[]): string[] {
  const used = new Set<string>(['id']);
  const textFields = fields.filter((field) => field.kind === 'text');
  let textIndex = 0;

  return fields.map((field) => {
    let baseName: string;
    if (field.kind === 'attribute') {
      baseName = field.attributeName ?? 'value';
    } else {
      textIndex += 1;
      baseName = textFields.length === 1
        ? 'text'
        : isTableCellSourceMapOwner(field.ownerName)
          ? `cell${textIndex}`
          : `text${textIndex}`;
    }

    const normalized = normalizeSourceMapIdentifier(baseName);
    let candidate = normalized;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${normalized}${suffix}`;
      suffix += 1;
    }
    used.add(candidate);
    field.fieldName = candidate;
    return candidate;
  });
}

function isTableCellSourceMapOwner(ownerName: string): boolean {
  return ownerName === 'td' ||
    ownerName === 'th' ||
    ownerName === 'TableCell' ||
    ownerName === 'TableHead' ||
    ownerName.endsWith('.TableCell') ||
    ownerName.endsWith('.TableHead');
}

function normalizeSourceMapIdentifier(value: string): string {
  const words = value
    .trim()
    .replace(/[^A-Za-z0-9_$]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const [first, ...rest] = words.length > 0 ? words : ['items'];
  const joined = [
    first!.replace(/^[^A-Za-z_$]+/, '') || 'items',
    ...rest.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`),
  ].join('');
  const identifier = joined.replace(/[^A-Za-z0-9_$]/g, '');
  return /^[A-Za-z_$][\w$]*$/.test(identifier) ? identifier : 'items';
}

function getDefaultSourceMapArrayName(parent: JSXElement | JSXFragment): string {
  const parentName = getJsxContainerDisplayName(parent);
  if (parentName === 'tbody' || parentName === 'thead' || parentName === 'TableBody' || parentName === 'TableHeader') {
    return 'rows';
  }
  if (parentName === 'ul' || parentName === 'ol' || parentName.toLowerCase().includes('list')) {
    return 'items';
  }
  return 'items';
}

function getUniqueSourceMapArrayName(contents: string, baseName: string): string {
  const normalizedBaseName = normalizeSourceMapIdentifier(baseName);
  let candidate = normalizedBaseName;
  let suffix = 2;
  while (new RegExp(`\\b${escapeRegExp(candidate)}\\b`).test(contents)) {
    candidate = `${normalizedBaseName}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function createSourceMapTemplateText({
  contents,
  fields,
  fieldNames,
  range,
  rootElement,
}: {
  contents: string;
  fields: SourceMapExtractFieldCandidate[];
  fieldNames: string[];
  range: { start: number; end: number };
  rootElement: JSXElement;
}):
  | { ok: true; text: string }
  | { ok: false; diagnostic: string } {
  const edits = fields.map((field, index) => ({
    start: field.range.start - range.start,
    end: field.range.end - range.start,
    text: `{item.${fieldNames[index]}}`,
  }));
  const hasKey = rootElement.openingElement.attributes.some((attribute) =>
    attribute.type === 'JSXAttribute' && getAttributeName(attribute) === 'key',
  );
  if (!hasKey && typeof rootElement.openingElement.name.end === 'number') {
    edits.push({
      start: rootElement.openingElement.name.end - range.start,
      end: rootElement.openingElement.name.end - range.start,
      text: ' key={item.id}',
    });
  }

  if (edits.some((edit) => edit.start < 0 || edit.end < edit.start || edit.end > range.end - range.start)) {
    return {
      ok: false,
      diagnostic: 'Selected layer fields do not have stable source ranges for map conversion.',
    };
  }

  const orderedEdits = [...edits].sort((left, right) => right.start - left.start);
  let text = contents.slice(range.start, range.end);
  for (const edit of orderedEdits) {
    text = `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`;
  }
  return { ok: true, text };
}

function formatSourceMapArrayDeclaration(
  arrayName: string,
  rows: EditableTreeSourcePropArray,
  indent: string,
): string {
  const rowIndent = `${indent}  `;
  const propertyIndent = `${indent}    `;
  const rowText = rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) =>
      `${propertyIndent}${formatComponentPropObjectKey(key)}: ${formatComponentPropObjectValue(value)},`,
    );
    return `${rowIndent}{\n${entries.join('\n')}\n${rowIndent}}`;
  });
  return `${indent}const ${arrayName} = [\n${rowText.join(',\n')}\n${indent}];\n\n`;
}

function findReturnStatementContainingRange(
  program: Program,
  start: number,
  end: number,
): Extract<BabelNode, { type: 'ReturnStatement' }> | null {
  let best: Extract<BabelNode, { type: 'ReturnStatement' }> | null = null;

  function visit(node: BabelNode) {
    if (typeof node.start === 'number' && typeof node.end === 'number') {
      if (node.end < start || node.start > end) return;
      if (node.type === 'ReturnStatement' && node.start <= start && node.end >= end) {
        if (!best || (node.end - node.start) < ((best.end ?? 0) - (best.start ?? 0))) {
          best = node;
        }
      }
    }
    for (const child of getNodeChildren(node)) visit(child);
  }

  visit(program);
  return best;
}

function validateSourceWrapNodeWrapper(wrapper: SourceWrapNodeWrapper):
  | { ok: true }
  | { ok: false; diagnostic: string } {
  if (wrapper.kind === 'html') {
    if (!SOURCE_WRAP_HTML_TAG_NAMES.includes(wrapper.tagName)) {
      return {
        ok: false,
        diagnostic: `${wrapper.tagName} is not a supported wrapper tag.`,
      };
    }
    return { ok: true };
  }

  if (!isSafeComponentName(wrapper.componentName)) {
    return {
      ok: false,
      diagnostic: `${wrapper.componentName} is not a safe wrapper component name.`,
    };
  }
  if (!isSafeImportSource(wrapper.importSource)) {
    return {
      ok: false,
      diagnostic: `${wrapper.importSource} is not a safe wrapper import source.`,
    };
  }
  const unsafePropName = Object.keys(wrapper.props ?? {}).find((propName) => !isSafeComponentPropName(propName));
  if (unsafePropName) {
    return {
      ok: false,
      diagnostic: `${unsafePropName} is not a safe wrapper component prop.`,
    };
  }
  const unsafeJsxPropName = Object.keys(wrapper.jsxProps ?? {}).find((propName) => !isSafeComponentPropName(propName));
  if (unsafeJsxPropName) {
    return {
      ok: false,
      diagnostic: `${unsafeJsxPropName} is not a safe wrapper JSX prop.`,
    };
  }
  const unsafeJsxPropValue = Object.values(wrapper.jsxProps ?? {}).find((value) => !isSafeJsxPropExpression(value));
  if (unsafeJsxPropValue) {
    return {
      ok: false,
      diagnostic: `${wrapper.componentName} has an unsafe wrapper JSX prop value.`,
    };
  }
  if (!componentSupportsChildrenSlot(wrapper.componentName)) {
    return {
      ok: false,
      diagnostic: `${wrapper.componentName} does not expose an editable children slot.`,
    };
  }
  return { ok: true };
}

function getSourceWrapWrapperName(wrapper: SourceWrapNodeWrapper): string {
  return wrapper.kind === 'html' ? wrapper.tagName : wrapper.componentName;
}

function formatSourceWrapOpeningTag(wrapper: SourceWrapNodeWrapper): string {
  if (wrapper.kind === 'html') return `<${wrapper.tagName}>`;
  const attributes = Object.entries(wrapper.props ?? {})
    .filter(([propName, value]) => propName !== 'children' && (typeof value === 'string' ? value.trim().length > 0 : value === true))
    .map(([propName, value]) => formatComponentPropAttributeText(propName, value))
    .concat(
      Object.entries(wrapper.jsxProps ?? {})
        .filter(([propName, value]) => isSafeComponentPropName(propName) && isSafeJsxPropExpression(value))
        .map(([propName, value]) => formatComponentJsxPropAttributeText(propName, value)),
    );
  return attributes.length > 0
    ? `<${wrapper.componentName} ${attributes.join(' ')}>`
    : `<${wrapper.componentName}>`;
}

function formatSourceWrapClosingTag(wrapper: SourceWrapNodeWrapper): string {
  return `</${getSourceWrapWrapperName(wrapper)}>`;
}

function formatSourceWrapSelectionLabel(nodes: EditableTreeNode[]): string {
  if (nodes.length === 1) return nodes[0]?.label ?? 'Layer';
  return `${nodes.length} layers`;
}

function formatSourceClipboardBlock(items: SourceCopiedNodeItem[], targetIndent: string): string {
  return items
    .map((item) => reindentMovedSourceBlock(item.jsxText.trim(), targetIndent).trimEnd())
    .filter((text) => text.trim().length > 0)
    .join('\n');
}

function createSourceElementTagNameEdit(
  contents: string,
  element: JSXElement,
  tagName: SourceElementTagName,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const currentTagName = getElementDisplayName(element).toLowerCase();
  if (!isHeadingTagName(currentTagName)) {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} is not a heading element.`,
    };
  }
  if (currentTagName === tagName) {
    return {
      ok: true,
      changed: false,
      nextContents: contents,
    };
  }
  if (element.openingElement.name.type !== 'JSXIdentifier') {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} has no editable heading tag name.`,
    };
  }
  if (!element.closingElement || element.closingElement.name.type !== 'JSXIdentifier') {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} has no editable closing tag name.`,
    };
  }

  const openingName = element.openingElement.name;
  const closingName = element.closingElement.name;
  if (
    typeof openingName.start !== 'number' ||
    typeof openingName.end !== 'number' ||
    typeof closingName.start !== 'number' ||
    typeof closingName.end !== 'number'
  ) {
    return {
      ok: false,
      diagnostic: `${getElementDisplayName(element)} has no editable source range for tag level.`,
    };
  }

  return {
    ok: true,
    changed: true,
    nextContents: `${contents.slice(0, openingName.start)}${tagName}${contents.slice(openingName.end, closingName.start)}${tagName}${contents.slice(closingName.end)}`,
  };
}

// Deleting the source root means *unwrapping* it: the root element/fragment is
// removed and its child layers are promoted to become the returned root. A
// single child becomes the root directly; multiple top-level children are kept
// under a fragment (the smallest valid single root). An empty root has nothing
// to promote, so it stays.
function createSourceRootUnwrapEdit(
  command: SourceStructureWritebackCommand,
  program: Program,
): { ok: true; changed: boolean; nextContents: string } | { ok: false; diagnostic: string } {
  const rootNode = collectJsxRoots(program)[0] ?? null;
  if (!rootNode) {
    return { ok: false, diagnostic: `${command.node.label} could not be located as the source root.` };
  }
  const opening = rootNode.type === 'JSXFragment' ? rootNode.openingFragment : rootNode.openingElement;
  const closing = rootNode.type === 'JSXFragment' ? rootNode.closingFragment : rootNode.closingElement;
  if (
    !closing ||
    typeof opening.start !== 'number' ||
    typeof opening.end !== 'number' ||
    typeof closing.start !== 'number' ||
    typeof closing.end !== 'number'
  ) {
    return { ok: false, diagnostic: `${command.node.label} has no child layer to promote, so it cannot be deleted.` };
  }
  const children = getEditableJsxChildren(rootNode);
  const hasContainerChild = children.some((child) => child.kind === 'container');
  if (children.length === 0 || !hasContainerChild) {
    return { ok: false, diagnostic: `${command.node.label} has no child layer to promote, so it cannot be deleted.` };
  }
  // A single promoted child becomes the bare new root. Multiple promoted
  // top-level children still need a fragment because TSX requires one root.
  const wrapInFragment = children.length > 1;
  if (wrapInFragment && rootNode.type === 'JSXFragment') {
    return {
      ok: false,
      diagnostic: `${command.node.label} already groups multiple top-level layers in a fragment — the smallest possible root.`,
    };
  }
  const openingReplacement = wrapInFragment ? '<>' : '';
  const closingReplacement = wrapInFragment ? '</>' : '';
  // Replace the closing tag first so the opening-tag offsets stay valid.
  const withClosing = `${command.contents.slice(0, closing.start)}${closingReplacement}${command.contents.slice(closing.end)}`;
  const nextContents = `${withClosing.slice(0, opening.start)}${openingReplacement}${withClosing.slice(opening.end)}`;
  return { ok: true, changed: true, nextContents };
}

function createSourceStructureEdit(
  command: SourceStructureWritebackCommand,
  program: Program,
  location: EditableTreeSourceLocation,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const pathInfo = getEditableSourcePathInfoFromNodeId(command.node.id);
  if (pathInfo?.path.length === 0) {
    if (command.action === 'delete') {
      return createSourceRootUnwrapEdit(command, program);
    }
    if (command.action === 'duplicate') {
      return {
        ok: false,
        diagnostic: `${command.node.label} is the source root. Duplicate a child layer instead.`,
      };
    }
  }

  const target = findEditableJsxChildForStructure(program, command.node, location);
  if (!target) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to an editable source child. Source structure edit was not applied.`,
    };
  }

  if (command.action === 'delete') {
    // Deleting a conditional-projected layer takes its whole `{cond ? … : …}`.
    // Cutting the branch alone leaves a ternary with a missing arm.
    const range = getEditableJsxChildRange(command.contents, target.anchorNode);
    if (!range) {
      return {
        ok: false,
        diagnostic: `${command.node.label} has no editable source range for deletion.`,
      };
    }
    return {
      ok: true,
      changed: true,
      nextContents: `${command.contents.slice(0, range.start)}${command.contents.slice(range.end)}`,
    };
  }

  if (command.action === 'duplicate') {
    const interactionRisk = getSourceInteractionRiskReason(target.childNode);
    if (interactionRisk) {
      return {
        ok: false,
        diagnostic: `${command.node.label} contains ${interactionRisk}. Duplicate is blocked until interaction-safe clone rewriting is available.`,
      };
    }
    const range = getEditableJsxChildRange(command.contents, target.anchorNode);
    if (!range) {
      return {
        ok: false,
        diagnostic: `${command.node.label} has no editable source range for duplication.`,
      };
    }
    const duplicateText = command.contents.slice(range.start, range.end);
    return {
      ok: true,
      changed: true,
      nextContents: `${command.contents.slice(0, range.end)}${duplicateText}${command.contents.slice(range.end)}`,
    };
  }

  const siblingIndex = command.action === 'move-up' ? target.index - 1 : target.index + 1;
  const sibling = target.siblings[siblingIndex];
  if (!sibling) {
    return {
      ok: true,
      changed: false,
      nextContents: command.contents,
    };
  }

  const firstChild = command.action === 'move-up' ? sibling : target.child;
  const secondChild = command.action === 'move-up' ? target.child : sibling;
  const firstRange = getEditableJsxChildRange(command.contents, getEditableJsxChildAnchorNode(firstChild));
  const secondRange = getEditableJsxChildRange(command.contents, getEditableJsxChildAnchorNode(secondChild));
  if (!firstRange || !secondRange) {
    return {
      ok: false,
      diagnostic: `${command.node.label} has no editable source range for reordering.`,
    };
  }
  if (firstRange.start > secondRange.start) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be reordered because sibling source ranges are unstable.`,
    };
  }

  const firstText = command.contents.slice(firstRange.start, firstRange.end);
  const middleText = command.contents.slice(firstRange.end, secondRange.start);
  const secondText = command.contents.slice(secondRange.start, secondRange.end);
  return {
    ok: true,
    changed: true,
    nextContents: `${command.contents.slice(0, firstRange.start)}${secondText}${middleText}${firstText}${command.contents.slice(secondRange.end)}`,
  };
}

function createSourceMoveNodeEdit(
  command: SourceMoveNodeWritebackCommand,
  program: Program,
  location: EditableTreeSourceLocation,
  targetParentLocation: EditableTreeSourceLocation,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const sourcePath = getEditableSourcePathInfoFromNodeId(command.node.id);
  const targetParentPath = getEditableSourcePathInfoFromNodeId(command.targetParentNode.id);
  if (!sourcePath || sourcePath.path.length === 0) {
    return {
      ok: false,
      diagnostic: `${command.node.label} cannot be moved because the source root is not a draggable source structure node.`,
    };
  }
  if (!targetParentPath || targetParentPath.isText) {
    return {
      ok: false,
      diagnostic: `${command.targetParentNode.label} cannot receive moved source nodes.`,
    };
  }
  if (sourcePath.path.length <= targetParentPath.path.length && sourcePath.path.every((part, index) => part === targetParentPath.path[index])) {
    return {
      ok: false,
      diagnostic: `${command.node.label} cannot be moved into itself or one of its descendants.`,
    };
  }

  const source = findEditableJsxChildForStructure(program, command.node, location);
  const targetParent = findJsxContainerForWriteback(program, targetParentLocation, command.targetParentNode);
  // Name the side that failed. "A or B could not be matched" leaves the reader
  // unable to tell an unmappable dragged node from an unusable drop target,
  // which are different problems with different fixes.
  if (!source) {
    return {
      ok: false,
      diagnostic: `${command.node.label} could not be matched to an editable source range.`,
    };
  }
  if (!targetParent) {
    return {
      ok: false,
      diagnostic: `${command.targetParentNode.label} could not be matched to an editable source range.`,
    };
  }
  const targetInfo = getJsxInsertionContainerInfo(targetParent);
  if (!targetInfo || targetInfo.isVoid || targetInfo.isSelfClosing || !targetInfo.hasClosing || targetInfo.closingStart === null) {
    return {
      ok: false,
      diagnostic: `${command.targetParentNode.label} cannot receive children because it has no editable children range.`,
    };
  }

  const sourceParentPath = sourcePath.path.slice(0, -1);
  const sourceIndex = sourcePath.path[sourcePath.path.length - 1];
  const sameParent = pathsAreEqual(sourceParentPath, targetParentPath.path);
  const allowExplicitUnknownSlotContainer = canTreatWritebackNodeAsExplicitUnknownChildrenContainer(command.targetParentNode);

  if (!sameParent && targetInfo.isComponentWithoutSlot && !allowExplicitUnknownSlotContainer) {
    return {
      ok: false,
      diagnostic: `${targetInfo.displayName} cannot receive moved children because it is not a slot container component.`,
    };
  }
  if (!sameParent && !allowExplicitUnknownSlotContainer && !canMoveSourceChildIntoParent(
    targetInfo.displayName,
    command.node.source?.jsxName ?? getEditableJsxChildDisplayName(source.child),
  )) {
    return {
      ok: false,
      diagnostic: `${command.node.label} cannot be moved into ${targetInfo.displayName} because that slot only accepts compatible children.`,
    };
  }

  // The anchor, not the child: moving a conditional-projected branch has to
  // carry its whole `{cond ? … : …}` away, or the ternary is left with a hole.
  const sourceRange = getEditableJsxChildRange(command.contents, source.anchorNode);
  if (!sourceRange) {
    return {
      ok: false,
      diagnostic: `${command.node.label} has no editable source range for moving.`,
    };
  }

  const targetSiblings = getEditableJsxChildren(targetParent);
  const clampedIndex = Math.max(0, Math.min(command.targetIndex, targetSiblings.length));
  const adjustedTargetIndex = sameParent && clampedIndex > sourceIndex ? clampedIndex - 1 : clampedIndex;
  if (sameParent && adjustedTargetIndex === sourceIndex) {
    return {
      ok: true,
      changed: false,
      nextContents: command.contents,
    };
  }

  const targetChildrenAfterMove = sameParent
    ? targetSiblings.filter((_child, index) => index !== sourceIndex)
    : targetSiblings;
  const targetChild = targetChildrenAfterMove[adjustedTargetIndex];
  const targetChildRange = targetChild ? getEditableJsxChildRange(command.contents, getEditableJsxChildAnchorNode(targetChild)) : null;
  let insertionPoint = targetChildRange?.start ??
    getEditableJsxClosingInsertionPoint(command.contents, targetInfo.closingStart);
  if (insertionPoint > sourceRange.start) insertionPoint -= sourceRange.end - sourceRange.start;

  const parentIndent = getLineIndent(command.contents, targetInfo.openingStart);
  const movedText = reindentMovedSourceBlock(
    command.contents.slice(sourceRange.start, sourceRange.end),
    `${parentIndent}  `,
  );
  const contentsWithoutSource = `${command.contents.slice(0, sourceRange.start)}${command.contents.slice(sourceRange.end)}`;

  return {
    ok: true,
    changed: true,
    nextContents: `${contentsWithoutSource.slice(0, insertionPoint)}${movedText}${contentsWithoutSource.slice(insertionPoint)}`,
  };
}

function createSourceMoveNodesEdit(
  command: SourceMoveNodesWritebackCommand,
  program: Program,
  targetParentLocation: EditableTreeSourceLocation,
):
  | { ok: true; changed: boolean; nextContents: string }
  | { ok: false; diagnostic: string } {
  const targetParentPath = getEditableSourcePathInfoFromNodeId(command.targetParentNode.id);
  if (!targetParentPath || targetParentPath.isText) {
    return {
      ok: false,
      diagnostic: `${command.targetParentNode.label} cannot receive moved source nodes.`,
    };
  }

  const targetParent = findJsxContainerForWriteback(program, targetParentLocation, command.targetParentNode);
  const targetInfo = targetParent ? getJsxInsertionContainerInfo(targetParent) : null;
  if (!targetParent || !targetInfo || targetInfo.isVoid || targetInfo.isSelfClosing || !targetInfo.hasClosing || targetInfo.closingStart === null) {
    return {
      ok: false,
      diagnostic: `${command.targetParentNode.label} cannot receive children because it has no editable children range.`,
    };
  }

  const sourceEntries: Array<{
    child: EditableJsxPathChild;
    index: number;
    node: EditableTreeNode;
    path: ReturnType<typeof getEditableSourcePathInfoFromNodeId> & {};
    range: { end: number; start: number };
  }> = [];
  for (const node of command.nodes) {
    const path = getEditableSourcePathInfoFromNodeId(node.id);
    if (!path || path.path.length === 0) {
      return {
        ok: false,
        diagnostic: `${node.label} cannot be moved because the source root is not a draggable source structure node.`,
      };
    }
    if (
      path.path.length <= targetParentPath.path.length &&
      path.path.every((part, index) => part === targetParentPath.path[index])
    ) {
      return {
        ok: false,
        diagnostic: 'Selected layers cannot be moved into themselves or one of their descendants.',
      };
    }
    const validation = validateWritebackCommand({ node, sourceFile: command.sourceFile });
    if (!validation.ok) return { ok: false, diagnostic: validation.diagnostic };
    const source = findEditableJsxChildForStructure(program, node, validation.location);
    const range = source ? getEditableJsxChildRange(command.contents, source.anchorNode) : null;
    if (!source || !range) {
      return {
        ok: false,
        diagnostic: `${node.label} could not be matched to an editable source range for moving.`,
      };
    }
    sourceEntries.push({
      child: source.child,
      index: source.index,
      node,
      path,
      range,
    });
  }

  for (let index = 0; index < sourceEntries.length; index += 1) {
    const sourceRange = sourceEntries[index]!.range;
    const overlapsAnotherSelection = sourceEntries.some(({ range }, candidateIndex) => (
      candidateIndex !== index &&
      sourceRange.start <= range.start &&
      sourceRange.end >= range.end
    ));
    if (overlapsAnotherSelection) {
      return {
        ok: false,
        diagnostic: 'Move selection cannot contain both a source layer and one of its descendants.',
      };
    }
  }

  const firstPath = sourceEntries[0]!.path;
  const sourceParentPath = firstPath.path.slice(0, -1);
  const sameSourceParent = sourceEntries.every(({ path }) => (
    pathsAreEqual(path.path.slice(0, -1), sourceParentPath)
  ));
  const sameParent = sameSourceParent &&
    pathsAreEqual(sourceParentPath, targetParentPath.path);
  const allowExplicitUnknownSlotContainer = canTreatWritebackNodeAsExplicitUnknownChildrenContainer(command.targetParentNode);
  if (!sameParent && targetInfo.isComponentWithoutSlot && !allowExplicitUnknownSlotContainer) {
    return {
      ok: false,
      diagnostic: `${targetInfo.displayName} cannot receive moved children because it is not a slot container component.`,
    };
  }
  if (!sameParent && !allowExplicitUnknownSlotContainer) {
    const incompatibleNode = sourceEntries.find(({ child, node }) => !canMoveSourceChildIntoParent(
      targetInfo.displayName,
      node.source?.jsxName ?? getEditableJsxChildDisplayName(child),
    ));
    if (incompatibleNode) {
      return {
        ok: false,
        diagnostic: `${incompatibleNode.node.label} cannot be moved into ${targetInfo.displayName} because that slot only accepts compatible children.`,
      };
    }
  }

  const targetSourceEntries = sourceEntries
    .filter(({ path }) => (
      pathsAreEqual(path.path.slice(0, -1), targetParentPath.path)
    ))
    .sort((left, right) => left.index - right.index);
  const selectedTargetIndexes = new Set(targetSourceEntries.map(({ index }) => index));
  const targetSiblings = getEditableJsxChildren(targetParent);
  const clampedIndex = Math.max(0, Math.min(command.targetIndex, targetSiblings.length));
  const adjustedTargetIndex = clampedIndex -
    targetSourceEntries.filter(({ index }) => index < clampedIndex).length;
  const remainingTargetSiblings = targetSiblings
    .filter((_child, index) => !selectedTargetIndexes.has(index));

  if (sameParent) {
    const originalOrder = targetSiblings.map((_child, index) => index);
    const remainingOrder = originalOrder.filter((index) => !selectedTargetIndexes.has(index));
    const movedOrder = targetSourceEntries.map(({ index }) => index);
    const nextOrder = [
      ...remainingOrder.slice(0, adjustedTargetIndex),
      ...movedOrder,
      ...remainingOrder.slice(adjustedTargetIndex),
    ];
    if (originalOrder.every((index, position) => nextOrder[position] === index)) {
      return { ok: true, changed: false, nextContents: command.contents };
    }
  }

  const targetChild = remainingTargetSiblings[adjustedTargetIndex];
  const targetChildRange = targetChild
    ? getEditableJsxChildRange(command.contents, getEditableJsxChildAnchorNode(targetChild))
    : null;
  const insertionPoint = targetChildRange?.start ??
    getEditableJsxClosingInsertionPoint(command.contents, targetInfo.closingStart);
  const parentIndent = getLineIndent(command.contents, targetInfo.openingStart);
  const movedText = [...sourceEntries]
    .sort((left, right) => left.range.start - right.range.start)
    .map(({ range }) => reindentMovedSourceBlock(
      command.contents.slice(range.start, range.end),
      `${parentIndent}  `,
    ))
    .join('');
  const rangesDescending = [...sourceEntries]
    .map(({ range }) => range)
    .sort((left, right) => right.start - left.start);
  let contentsWithoutSources = command.contents;
  for (const range of rangesDescending) {
    contentsWithoutSources = `${contentsWithoutSources.slice(0, range.start)}${contentsWithoutSources.slice(range.end)}`;
  }
  const removedBeforeInsertion = sourceEntries.reduce((total, { range }) => (
    range.start < insertionPoint ? total + (range.end - range.start) : total
  ), 0);
  const adjustedInsertionPoint = insertionPoint - removedBeforeInsertion;
  return {
    ok: true,
    changed: true,
    nextContents: `${contentsWithoutSources.slice(0, adjustedInsertionPoint)}${movedText}${contentsWithoutSources.slice(adjustedInsertionPoint)}`,
  };
}

function findEditableJsxChildForStructure(
  program: Program,
  node: EditableTreeNode,
  location: EditableTreeSourceLocation,
): {
  anchorNode: BabelNode;
  child: EditableJsxPathChild;
  childNode: BabelNode;
  index: number;
  parent: JSXElement | JSXFragment;
  siblings: EditableJsxPathChild[];
} | null {
  const pathInfo = getEditableSourcePathInfoFromNodeId(node.id);
  if (!pathInfo || pathInfo.path.length === 0) return null;

  const parentPath = pathInfo.path.slice(0, -1);
  const index = pathInfo.path[pathInfo.path.length - 1];
  if (typeof index !== 'number') return null;

  const candidates = collectJsxRoots(program).flatMap((root) => {
    const parent = findJsxContainerByEditablePath(root, parentPath);
    if (!parent) return [];
    const siblings = getEditableJsxChildren(parent);
    const child = siblings[index];
    if (!child) return [];
    const childNode = getEditableJsxChildNode(child);
    if (!childNode) return [];
    return [{ anchorNode: getEditableJsxChildAnchorNode(child) ?? childNode, child, childNode, index, parent, siblings }];
  });
  if (candidates.length === 0) return null;

  return candidates.sort((left, right) =>
    getSourceLocationDistance(left.childNode, location) - getSourceLocationDistance(right.childNode, location),
  )[0] ?? null;
}

function findJsxContainerByEditablePath(
  root: JSXElement | JSXFragment,
  path: number[],
): JSXElement | JSXFragment | null {
  if (path.length === 0) return root;

  let current: JSXElement | JSXFragment | null = root;
  for (const index of path) {
    if (!current) return null;
    const pathChild: EditableJsxPathChild | undefined = getEditableJsxChildren(current)[index];
    current = pathChild?.kind === 'container' ? pathChild.node : null;
  }

  return current;
}

function getEditableJsxChildNode(child: EditableJsxPathChild): BabelNode | null {
  return child.kind === 'container' ? child.node : child.node;
}

/**
 * The node whose source range owns this child slot.
 *
 * For a conditional-projected branch that is the wrapping `{cond ? a : b}`,
 * not the branch element. Splicing at the branch's own offset writes text
 * inside the conditional -- two siblings in a one-expression slot -- which is
 * how a layer reorder above such a sibling produced an unparseable page.
 */
function getEditableJsxChildAnchorNode(child: EditableJsxPathChild): BabelNode | null {
  if (child.kind === 'container' && child.anchor) return child.anchor;
  return getEditableJsxChildNode(child);
}

function getEditableJsxChildDisplayName(child: EditableJsxPathChild): string {
  if (child.kind === 'text') return 'text';
  if (child.node.type === 'JSXFragment') return 'Fragment';
  return getElementDisplayName(child.node);
}

async function parseSourceClipboardItems(
  items: SourceCopiedNodeItem[],
  sourceFile: string,
): Promise<
  | { ok: true; children: EditableJsxPathChild[] }
  | { ok: false; diagnostic: string }
> {
  const clipboardSource = `const __workbenchClipboardPaste = (<>\n${items.map((item) => item.jsxText).join('\n')}\n</>);`;
  const parseResult = await parseTsxProgram(clipboardSource, `${sourceFile} clipboard`);
  if (!parseResult.ok) {
    return {
      ok: false,
      diagnostic: 'Clipboard source could not be parsed as JSX.',
    };
  }

  const root = collectJsxRoots(parseResult.program)[0] ?? null;
  if (!root || root.type !== 'JSXFragment') {
    return {
      ok: false,
      diagnostic: 'Clipboard source has no JSX fragment root.',
    };
  }

  const children = getEditableJsxChildren(root);
  if (children.length === 0) {
    return {
      ok: false,
      diagnostic: 'Clipboard source has no editable JSX children.',
    };
  }

  return {
    ok: true,
    children,
  };
}

function getEditableJsxChildRange(
  contents: string,
  childNode: BabelNode | null,
): { start: number; end: number } | null {
  if (!childNode || typeof childNode.start !== 'number' || typeof childNode.end !== 'number') return null;
  return expandEditableJsxChildRange(contents, childNode.start, childNode.end);
}

function expandEditableJsxChildRange(
  contents: string,
  start: number,
  end: number,
): { start: number; end: number } {
  const lineStart = contents.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextLineBreak = contents.indexOf('\n', end);
  const lineEnd = nextLineBreak === -1 ? contents.length : nextLineBreak;
  const before = contents.slice(lineStart, start);
  const after = contents.slice(end, lineEnd);
  if (before.trim() === '' && after.trim() === '') {
    return {
      start: lineStart,
      end: nextLineBreak === -1 ? lineEnd : lineEnd + 1,
    };
  }
  return { start, end };
}

function reindentMovedSourceBlock(block: string, targetIndent: string): string {
  const hasTrailingNewline = block.endsWith('\n');
  const body = hasTrailingNewline ? block.slice(0, -1) : block;
  const lines = body.split('\n');
  const sourceIndent = lines[0]?.match(/^[ \t]*/)?.[0] ?? '';
  const reindented = lines.map((line) => {
    if (!line.trim()) return line;
    return line.startsWith(sourceIndent)
      ? `${targetIndent}${line.slice(sourceIndent.length)}`
      : `${targetIndent}${line.trimStart()}`;
  }).join('\n');
  return `${reindented}${hasTrailingNewline ? '\n' : ''}`;
}

function getEditableJsxClosingInsertionPoint(
  contents: string,
  closingStart: number,
): number {
  const lineStart = contents.lastIndexOf('\n', Math.max(0, closingStart - 1)) + 1;
  return contents.slice(lineStart, closingStart).trim() === ''
    ? lineStart
    : closingStart;
}

function pathsAreEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}

function getSourceInteractionRiskReason(node: BabelNode | null): string | null {
  if (!node) return null;

  if (node.type === 'JSXElement') {
    for (const attribute of node.openingElement.attributes) {
      if (attribute.type === 'JSXSpreadAttribute') return 'spread props';
      const attributeName = getAttributeName(attribute);
      if (!attributeName) continue;
      if (attributeName === 'data-wbid') return 'Workbench node identity metadata';
      if (attributeName === 'key') return 'list identity metadata';
      if (/^on[A-Z]/.test(attributeName)) return 'event handler code';
      if (attributeName === 'ref') return 'ref binding code';
    }
    for (const child of node.children) {
      const reason = getSourceInteractionRiskReason(child);
      if (reason) return reason;
    }
    return null;
  }

  if (node.type === 'JSXFragment') {
    for (const child of node.children) {
      const reason = getSourceInteractionRiskReason(child);
      if (reason) return reason;
    }
    return null;
  }

  if (node.type === 'JSXExpressionContainer') {
    if (node.expression.type === 'JSXEmptyExpression') return null;
    if (node.expression.type === 'JSXElement' || node.expression.type === 'JSXFragment') {
      return getSourceInteractionRiskReason(node.expression);
    }
    if (
      node.expression.type === 'StringLiteral' ||
      node.expression.type === 'NumericLiteral' ||
      node.expression.type === 'BooleanLiteral' ||
      node.expression.type === 'NullLiteral'
    ) {
      return null;
    }
    return 'expression binding code';
  }

  return null;
}

function isSourceClipboardSameFileRisk(reason: string): boolean {
  return reason === 'spread props' ||
    reason === 'event handler code' ||
    reason === 'expression binding code';
}

function formatSourceStructureAction(action: SourceStructureAction): string {
  if (action === 'move-up') return 'move up';
  if (action === 'move-down') return 'move down';
  return action;
}

function formatSourceStructureActionPastTense(action: SourceStructureAction): string {
  if (action === 'delete') return 'deleted';
  if (action === 'duplicate') return 'duplicated';
  if (action === 'move-up') return 'moved up';
  return 'moved down';
}

function formatSourceChildSnippet(
  template: SourceInsertChildTemplate,
  childIndent: string,
  grandChildIndent: string,
  iconDefault: SourceInsertChildIconDefault | undefined,
): string {
  switch (template.id) {
    case 'div':
      return `<div>\n${grandChildIndent}New layer\n${childIndent}</div>`;
    case 'section':
      return `<section>\n${grandChildIndent}New section\n${childIndent}</section>`;
    case 'aside':
      return `<aside>\n${grandChildIndent}New aside\n${childIndent}</aside>`;
    case 'article':
      return `<article>\n${grandChildIndent}New article\n${childIndent}</article>`;
    case 'main':
      return `<main>\n${grandChildIndent}New main\n${childIndent}</main>`;
    case 'nav':
      return `<nav>\n${grandChildIndent}New navigation\n${childIndent}</nav>`;
    case 'header':
      return `<header>\n${grandChildIndent}New header\n${childIndent}</header>`;
    case 'footer':
      return `<footer>\n${grandChildIndent}New footer\n${childIndent}</footer>`;
    case 'form':
      return `<form>\n${grandChildIndent}New form\n${childIndent}</form>`;
    case 'fieldset':
      return `<fieldset>\n${grandChildIndent}<legend>New fieldset</legend>\n${grandChildIndent}New field\n${childIndent}</fieldset>`;
    case 'unordered-list':
      return `<ul>\n${grandChildIndent}<li>New item</li>\n${childIndent}</ul>`;
    case 'ordered-list':
      return `<ol>\n${grandChildIndent}<li>New item</li>\n${childIndent}</ol>`;
    case 'text':
      return '<p>New text</p>';
    case 'paragraph':
      return '<p>New paragraph</p>';
    case 'heading':
      return '<h2>New heading</h2>';
    case 'heading1':
    case 'heading2':
    case 'heading3':
    case 'heading4':
    case 'heading5':
    case 'heading6':
      return `<${template.jsxName}>New ${template.jsxName.toUpperCase()}</${template.jsxName}>`;
    case 'span':
      return '<span>Text</span>';
    case 'abbr':
      return '<abbr title="Abbreviation">ABBR</abbr>';
    case 'bold':
      return '<b>Bold text</b>';
    case 'bdi':
      return '<bdi>Isolated text</bdi>';
    case 'bdo':
      return '<bdo dir="rtl">Override text</bdo>';
    case 'br':
      return '<br />';
    case 'cite':
      return '<cite>Citation</cite>';
    case 'code':
      return '<code>code</code>';
    case 'data':
      return '<data value="1">Data</data>';
    case 'definition':
      return '<dfn>Definition</dfn>';
    case 'deleted':
      return '<del>Deleted text</del>';
    case 'emphasis':
      return '<em>Emphasis</em>';
    case 'inserted':
      return '<ins>Inserted text</ins>';
    case 'italic':
      return '<i>Italic text</i>';
    case 'keyboard':
      return '<kbd>Key</kbd>';
    case 'link':
      return '<a href="#">Link</a>';
    case 'mark':
      return '<mark>Marked text</mark>';
    case 'quote':
      return '<q>Inline quote</q>';
    case 'ruby':
      return '<ruby>漢<rp>(</rp><rt>han</rt><rp>)</rp></ruby>';
    case 'sample':
      return '<samp>Sample output</samp>';
    case 'small':
      return '<small>Small text</small>';
    case 'strikethrough':
      return '<s>Struck text</s>';
    case 'subscript':
      return '<sub>sub</sub>';
    case 'superscript':
      return '<sup>sup</sup>';
    case 'time':
      return '<time dateTime="2026-06-15">Time</time>';
    case 'underline':
      return '<u>Underlined text</u>';
    case 'variable':
      return '<var>variable</var>';
    case 'wbr':
      return '<wbr />';
    case 'button':
      return '<button type="button">Button</button>';
    case 'input':
      return '<input type="text" placeholder="Input" />';
    case 'image':
      return '<img src="" alt="" />';
    case 'svg':
      return '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>';
    case 'icon':
      return formatSourceIconChildSnippet(iconDefault);
  }
}

function formatSourceIconChildSnippet(iconDefault: SourceInsertChildIconDefault | undefined): string {
  if (iconDefault?.svg && isSafeInlineSvgSnippet(iconDefault.svg)) return iconDefault.svg.trim();
  const attributes = [
    formatAttributeText('data-icon', 'inline-start'),
    formatAttributeText(SOURCE_ASSET_KIND_ATTRIBUTE, 'icon'),
    iconDefault?.src ? formatAttributeText(SOURCE_ASSET_SOURCE_ATTRIBUTE, iconDefault.src) : '',
    iconDefault?.name ? formatAttributeText(SOURCE_ICON_SET_ATTRIBUTE, 'default') : '',
    iconDefault?.name ? formatAttributeText(SOURCE_ICON_NAME_ATTRIBUTE, iconDefault.name) : '',
    formatAttributeText('aria-hidden', 'true'),
    formatAttributeText('focusable', 'false'),
    formatAttributeText('viewBox', '0 0 24 24'),
    formatAttributeText('width', '0.875em'),
    formatAttributeText('height', '0.875em'),
    formatAttributeText('fill', 'none'),
    formatAttributeText('stroke', 'currentColor'),
    'strokeWidth="2"',
    'strokeLinecap="round"',
    'strokeLinejoin="round"',
  ].filter(Boolean);
  return `<svg ${attributes.join(' ')}><path d="M12 5v14" /><path d="M5 12h14" /></svg>`;
}

function isSafeInlineSvgSnippet(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('<svg ') &&
    trimmed.endsWith('</svg>') &&
    !/[{}]/.test(trimmed) &&
    !/\b(import|export|eval|Function)\b/.test(trimmed) &&
    !/\son[a-zA-Z]+\s*=/.test(trimmed) &&
    !/\s(?:href|src|xlinkHref)\s*=/.test(trimmed) &&
    !trimmed.includes('<script') &&
    !trimmed.includes('</script') &&
    !trimmed.includes(';');
}

function formatSourceComponentSnippet(command: SourceComponentInsertWritebackCommand): string {
  const children = typeof command.props.children === 'string' ? command.props.children : null;
  const attributes = Object.entries(command.props)
    .filter(([propName, value]) => propName !== 'children' && (typeof value === 'string' ? value.trim().length > 0 : value === true))
    .map(([propName, value]) => formatComponentPropAttributeText(propName, value))
    .concat(
      Object.entries(command.jsxProps ?? {})
        .filter(([propName, value]) => isSafeComponentPropName(propName) && isSafeJsxPropExpression(value))
        .map(([propName, value]) => formatComponentJsxPropAttributeText(propName, value)),
    )
    .join(' ');
  const open = attributes ? `<${command.componentName} ${attributes}` : `<${command.componentName}`;

  if (command.jsxChildren) {
    const jsxChildren = command.jsxChildren.trim();
    const childrenText = isElementJsxChildrenSnippet(jsxChildren)
      ? jsxChildren
      : escapeJsxTextContent(jsxChildren);
    return `${open}>${childrenText}</${command.componentName}>`;
  }

  if (children !== null) {
    return `${open}>${escapeJsxTextContent(children)}</${command.componentName}>`;
  }

  if (componentSupportsChildrenSlot(command.componentName)) {
    return `${open}></${command.componentName}>`;
  }

  return `${open} />`;
}

function formatComponentJsxPropAttributeText(attributeName: string, value: string): string {
  return `${attributeName}={${value.trim()}}`;
}

function isSafeJsxPropExpression(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith('<')) {
    return trimmed.endsWith('>') &&
      !trimmed.includes('\n') &&
      !trimmed.includes('\r') &&
      !trimmed.includes(';');
  }
  return isSafeJsxLiteralPropExpression(trimmed);
}

function isSafeJsxLiteralPropExpression(value: string): boolean {
  if (/^(?:true|false|null|-?\d+(?:\.\d+)?)$/.test(value)) return true;
  if (isSafeQuotedJsxLiteral(value)) return true;
  if (!value.startsWith('[') || !value.endsWith(']')) return false;

  const inner = value.slice(1, -1).trim();
  if (!inner) return true;
  return splitSafeJsxArrayItems(inner).every((item) => (
    /^(?:true|false|null|-?\d+(?:\.\d+)?)$/.test(item) ||
    isSafeQuotedJsxLiteral(item)
  ));
}

function isSafeQuotedJsxLiteral(value: string): boolean {
  return /^'(?:[^'\\]|\\['\\])*'$/.test(value) ||
    /^"(?:[^"\\]|\\["\\])*"$/.test(value);
}

function splitSafeJsxArrayItems(value: string): string[] {
  const items: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      current += character;
      quote = character;
      continue;
    }
    if (character === ',') {
      items.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }

  if (quote || escaped) return ['__unsafe__'];
  items.push(current.trim());
  return items.filter(Boolean);
}

function isSafeJsxChildrenSnippet(value: string): boolean {
  const trimmed = value.trim();
  if (isSafePlainTextJsxChildren(trimmed)) return true;
  return isElementJsxChildrenSnippet(trimmed) &&
    !/\b(import|export|eval|Function)\b/.test(trimmed) &&
    !trimmed.includes('<script') &&
    !trimmed.includes('</script') &&
    !trimmed.includes(';');
}

function isElementJsxChildrenSnippet(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('<') &&
    trimmed.endsWith('>');
}

function isSafePlainTextJsxChildren(value: string): boolean {
  return value.length > 0 &&
    !/[<>{}]/.test(value) &&
    !/\b(import|export|eval|Function)\b/.test(value) &&
    !value.includes(';');
}

async function ensureNamedImport(
  contents: string,
  program: Program,
  componentName: string,
  importSource: string,
): Promise<string> {
  const currentParse = await parseTsxProgram(contents, 'source import update');
  const importProgram = currentParse.ok ? currentParse.program : program;
  const importDeclarations = importProgram.body.filter((node): node is ImportDeclaration => node.type === 'ImportDeclaration');
  if (programImportsLocalName(importDeclarations, componentName)) return contents;

  const matchingImport = importDeclarations.find((node) => node.source.value === importSource);
  if (matchingImport) {
    const namedSpecifiers = matchingImport.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');
    const insertAt = namedSpecifiers.length > 0
      ? namedSpecifiers[namedSpecifiers.length - 1]?.end
      : null;
    if (typeof insertAt === 'number') {
      return `${contents.slice(0, insertAt)}, ${componentName}${contents.slice(insertAt)}`;
    }
  }

  const lastImport = importDeclarations[importDeclarations.length - 1] ?? null;
  const insertAt = typeof lastImport?.end === 'number' ? lastImport.end : 0;
  const prefix = insertAt > 0 ? '\n' : '';
  const suffix = insertAt > 0 ? '' : '\n';
  const importText = `${prefix}import { ${componentName} } from '${escapeImportSource(importSource)}';\n`;
  return `${contents.slice(0, insertAt)}${importText}${contents.slice(insertAt)}${suffix}`;
}

function programImportsLocalName(
  importDeclarations: ImportDeclaration[],
  componentName: string,
): boolean {
  return importDeclarations.some((node) => node.specifiers.some((specifier) => specifier.local.name === componentName));
}

function collectSourceClipboardImports(
  program: Program,
  jsxTexts: string[],
): SourceComponentImportSpec[] {
  const clipboardText = jsxTexts.join('\n');
  const imports: SourceComponentImportSpec[] = [];

  for (const declaration of program.body) {
    if (declaration.type !== 'ImportDeclaration') continue;
    const importSource = declaration.source.value;
    if (typeof importSource !== 'string' || !isSafeImportSource(importSource)) continue;

    const names: string[] = [];
    for (const specifier of declaration.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue;
      if (specifier.imported.type !== 'Identifier') continue;
      if (specifier.imported.name !== specifier.local.name) continue;
      if (!isSafeImportedLocalName(specifier.local.name)) continue;
      if (!sourceTextUsesIdentifier(clipboardText, specifier.local.name)) continue;
      names.push(specifier.local.name);
    }

    if (names.length > 0) {
      imports.push({
        importSource,
        names,
      });
    }
  }

  return imports;
}

function sourceTextUsesIdentifier(sourceText: string, identifier: string): boolean {
  let index = sourceText.indexOf(identifier);
  while (index >= 0) {
    const before = index > 0 ? sourceText[index - 1] : '';
    const after = sourceText[index + identifier.length] ?? '';
    if (!isIdentifierPart(before) && !isIdentifierPart(after)) return true;
    index = sourceText.indexOf(identifier, index + identifier.length);
  }
  return false;
}

function isIdentifierPart(value: string): boolean {
  return Boolean(value) && /^[A-Za-z0-9_$]$/.test(value);
}

function isVoidJsxElement(element: JSXElement): boolean {
  return ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
    .includes(getElementDisplayName(element).toLowerCase());
}

function isHeadingTagName(tagName: string): tagName is SourceElementTagName {
  return tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6';
}

function getElementDisplayName(element: JSXElement): string {
  const name = element.openingElement.name;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return `${getNestedJsxName(name.object)}.${name.property.name}`;
  return `${name.namespace.name}:${name.name.name}`;
}

function getNestedJsxName(name: JSXElement['openingElement']['name']): string {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return `${getNestedJsxName(name.object)}.${name.property.name}`;
  return `${name.namespace.name}:${name.name.name}`;
}

function getLineIndent(contents: string, offset: number): string {
  const lineStart = contents.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const linePrefix = contents.slice(lineStart, offset);
  return linePrefix.match(/^[ \t]*/)?.[0] ?? '';
}

function createAttributeReplacement(
  attribute: JSXAttribute,
  attributeName: string,
  nextValue: string,
):
  | { ok: true; replacement: { start: number; end: number; text: string } }
  | { ok: false; diagnostic: string } {
  if (typeof attribute.start !== 'number' || typeof attribute.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${attributeName} could not be updated because the JSX attribute has no source range.`,
    };
  }

  return {
    ok: true,
    replacement: {
      start: attribute.start,
      end: attribute.end,
      text: formatAttributeText(attributeName, nextValue),
    },
  };
}

function createAttributeRemoval(
  contents: string,
  attribute: JSXAttribute,
  attributeName: string,
):
  | { ok: true; removal: { start: number; end: number; text: string } }
  | { ok: false; diagnostic: string } {
  if (typeof attribute.start !== 'number' || typeof attribute.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${attributeName} could not be removed because the JSX attribute has no source range.`,
    };
  }

  return {
    ok: true,
    removal: getAttributeRemovalRange(contents, attribute.start, attribute.end),
  };
}

function getAttributeRemovalRange(
  contents: string,
  attributeStart: number,
  attributeEnd: number,
): { start: number; end: number; text: string } {
  const lineStart = contents.lastIndexOf('\n', attributeStart - 1) + 1;
  const nextLineBreak = contents.indexOf('\n', attributeEnd);
  const lineEnd = nextLineBreak === -1 ? contents.length : nextLineBreak;
  const beforeAttribute = contents.slice(lineStart, attributeStart);
  const afterAttribute = contents.slice(attributeEnd, lineEnd);

  if (nextLineBreak !== -1 && /^[ \t]*$/.test(beforeAttribute) && /^[ \t]*$/.test(afterAttribute)) {
    return {
      start: lineStart,
      end: nextLineBreak + 1,
      text: '',
    };
  }

  let start = attributeStart;
  while (start > 0 && (contents[start - 1] === ' ' || contents[start - 1] === '\t')) {
    start -= 1;
  }
  return {
    start,
    end: attributeEnd,
    text: '',
  };
}

function createSourceTokenBindingOperation(
  command: SourceTokenBindingWritebackCommand,
  attributeName: string,
  collectionAttributeName: string,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-token-binding',
      field: command.field,
      nodeId: command.node.id,
      path: [command.sourceFile, attributeName],
      collectionId: command.token?.collectionId,
      tokenId: command.token?.tokenId,
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX token binding writeback changed the editable source tree.',
    },
    cleanup: {
      bindings: true,
      notes: [
        `${attributeName} stores the source token id for ${command.field}.`,
        `${collectionAttributeName} stores the source token collection for ${command.field}.`,
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceAttributeOperation(
  command: SourceAttributeWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-attribute',
      field: command.attributeName,
      nodeId: command.node.id,
      path: [command.sourceFile, command.attributeName],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX attribute writeback changed the editable source tree.',
    },
    cleanup: {
      notes: [`${command.attributeName} stores source-backed Inspector metadata.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceInlineSvgIconOperation(
  command: SourceInlineSvgIconWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-child',
      field: 'svg-icon',
      nodeId: command.node.id,
      path: [command.sourceFile, 'inline-svg-icon'],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source inline SVG icon replacement changed the editable source tree.',
    },
    cleanup: {
      notes: ['Inline icon replacement keeps SVG source editable while preserving asset metadata for the Inspector.'],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceComponentPropOperation(
  command: SourceComponentPropWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-component-prop',
      field: command.propName,
      nodeId: command.node.id,
      path: [command.sourceFile, 'props', command.propName],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX component prop writeback changed the editable source tree.',
    },
    cleanup: {
      notes: [`${command.propName} is edited as a real JSX component prop.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceReferencedArrayExpressionOperation(
  command: SourceReferencedArrayExpressionWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-component-prop',
      field: command.sourceExpression,
      nodeId: command.node.id,
      path: [command.sourceFile, 'map-source', command.sourceExpression],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source map array writeback changed the editable source tree.',
    },
    cleanup: {
      notes: [`${command.sourceExpression} is edited as a source-backed map array.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceComponentTypeOperation(
  command: SourceComponentTypeWritebackCommand,
  previousComponentName: string,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-component-type',
      field: command.targetComponentName,
      nodeId: command.node.id,
      path: [command.sourceFile, 'component-type', previousComponentName, command.targetComponentName],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX component type writeback changed the editable source tree.',
    },
    cleanup: {
      imports: true,
      notes: [
        `${previousComponentName} is converted to ${command.targetComponentName}.`,
        'Managed component props outside the target contract are removed from the converted source element.',
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceStyleDeclarationOperation(
  command: SourceStyleDeclarationWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-style-declaration',
      field: command.property,
      nodeId: command.node.id,
      path: [command.sourceFile, 'style', command.property],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX style writeback changed the editable source tree.',
    },
    cleanup: {
      notes: [`${command.property} is edited as an explicit JSX style declaration.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceTextContentOperation(
  command: SourceTextContentWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-text-content',
      field: 'textContent',
      nodeId: command.node.id,
      path: [command.sourceFile, 'textContent'],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX text content writeback changed the editable source tree.',
    },
    cleanup: {
      notes: ['Simple JSX text content is edited in the canonical source file.'],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceElementTagNameOperation(
  command: SourceElementTagNameWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-tag-name',
      field: 'tagName',
      nodeId: command.node.id,
      path: [command.sourceFile, 'tagName'],
    },
    identityEffect: 'preserve',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX tag name writeback changed the editable source tree.',
    },
    cleanup: {
      notes: [`Heading level changed to ${command.tagName} in canonical JSX source.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source writeback changes the canonical file and invalidates derived edit trees.',
    },
  };
}

function createSourceInsertChildOperation(
  command: SourceInsertChildWritebackCommand,
  template: SourceInsertChildTemplate,
): WorkbenchEditOperationInput {
  return {
    intent: 'create',
    target: {
      kind: 'source-jsx-child',
      field: template.jsxName,
      nodeId: command.node.id,
      path: [
        command.sourceFile,
        'children',
        template.id,
        command.targetIndex === undefined ? 'append' : String(command.targetIndex),
      ],
    },
    identityEffect: 'create',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX child insertion changed the editable source tree.',
    },
    cleanup: {
      notes: [`${template.label} is inserted as canonical JSX source, then reparsed into the editable tree.`],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structural edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceComponentInsertOperation(
  command: SourceComponentInsertWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'create',
    target: {
      kind: 'source-jsx-component-instance',
      field: command.componentName,
      nodeId: command.node.id,
      path: [
        command.sourceFile,
        'children',
        command.componentName,
        command.targetIndex === undefined ? 'append' : String(command.targetIndex),
      ],
    },
    identityEffect: 'create',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX component insertion changed the editable source tree.',
    },
    cleanup: {
      imports: true,
      notes: [
        `${command.componentName} is inserted as a real JSX component instance.`,
        `${command.importSource} is used as the source import for the component.`,
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structural edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceStructureOperation(
  command: SourceStructureWritebackCommand,
): WorkbenchEditOperationInput {
  const intent = getSourceStructureIntent(command.action);
  return {
    intent,
    target: {
      kind: 'source-jsx-structure',
      field: command.action,
      nodeId: command.node.id,
      path: [command.sourceFile, 'structure', command.action],
    },
    identityEffect: getSourceStructureIdentityEffect(command.action),
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX structure edit changed the editable source tree.',
    },
    cleanup: {
      bindings: command.action === 'delete',
      imports: command.action === 'delete',
      refs: command.action === 'delete',
      notes: [getSourceStructureCleanupNote(command.action)],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structure edits must regenerate all derived design views from source.',
    },
  };
}

function createSourcePasteNodeOperation(
  command: SourcePasteNodeWritebackCommand,
): WorkbenchEditOperationInput {
  const label = command.items.length === 1 ? command.items[0]?.label ?? 'Layer' : `${command.items.length} layers`;
  return {
    intent: 'paste',
    target: {
      kind: 'source-jsx-clipboard',
      field: 'paste',
      nodeId: command.node.id,
      path: [
        command.sourceFile,
        'children',
        'paste',
        command.targetIndex === undefined ? 'append' : String(command.targetIndex),
      ],
    },
    identityEffect: 'create',
    provenance: {
      pastedFrom: label,
    },
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX paste changed the editable source tree.',
    },
    cleanup: {
      imports: true,
      notes: [
        `${label} is pasted as canonical JSX source, then reparsed into the editable tree.`,
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structural edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceWrapNodeOperation(
  command: SourceWrapNodeWritebackCommand,
): WorkbenchEditOperationInput {
  const label = formatSourceWrapSelectionLabel(command.nodes);
  const wrapperName = getSourceWrapWrapperName(command.wrapper);
  return {
    intent: 'move',
    target: {
      kind: 'source-jsx-wrap',
      field: wrapperName,
      path: [command.sourceFile, 'children', 'wrap', wrapperName],
      refs: command.nodes.map((node) => ({ nodeId: node.id })),
    },
    identityEffect: 'move',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX wrap changed the editable source tree.',
    },
    cleanup: {
      imports: command.wrapper.kind === 'component',
      notes: [
        `${label} moved under a new ${wrapperName} wrapper, then reparsed into the editable tree.`,
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structural edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceExtractSelectedNodesToMapOperation(
  command: SourceExtractSelectedNodesToMapWritebackCommand,
  arrayName: string,
): WorkbenchEditOperationInput {
  return {
    intent: 'patch',
    target: {
      kind: 'source-jsx-map-extraction',
      field: arrayName,
      path: [command.sourceFile, 'map-source', arrayName],
      refs: command.nodes.map((node) => ({ nodeId: node.id })),
    },
    identityEffect: 'detach',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX siblings were converted into a source-backed map.',
    },
    cleanup: {
      notes: [
        `${arrayName} stores literal values extracted from repeated JSX siblings.`,
        'The mapped JSX is reparsed so Binding can expose the connected array editor.',
      ],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structural edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceMoveNodeOperation(
  command: SourceMoveNodeWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'move',
    target: {
      kind: 'source-jsx-structure',
      field: 'drag-move',
      nodeId: command.node.id,
      path: [command.sourceFile, 'children', command.targetParentNode.id, String(command.targetIndex)],
      refs: [{ nodeId: command.targetParentNode.id }],
    },
    identityEffect: 'move',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX drag move changed the editable source tree.',
    },
    cleanup: {
      notes: ['Move preserves the selected JSX subtree and reparses source-derived selection.'],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structure edits must regenerate all derived design views from source.',
    },
  };
}

function createSourceMoveNodesOperation(
  command: SourceMoveNodesWritebackCommand,
): WorkbenchEditOperationInput {
  return {
    intent: 'move',
    target: {
      kind: 'source-jsx-structure',
      field: 'drag-move',
      nodeId: command.nodes[0]?.id,
      path: [command.sourceFile, 'children', command.targetParentNode.id, String(command.targetIndex)],
      refs: [
        ...command.nodes.map((node) => ({ nodeId: node.id })),
        { nodeId: command.targetParentNode.id },
      ],
    },
    identityEffect: 'move',
    persistence: {
      boundary: 'none',
      affectedFiles: [command.sourceFile],
    },
    projection: {
      invalidates: ['preview', 'renderer', 'selection', 'history'],
      reason: 'Source JSX multi-selection drag move changed the editable source tree.',
    },
    cleanup: {
      notes: ['Move preserves the selected JSX sibling subtrees as one ordered group and reparses source-derived selection.'],
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['editable-tree', 'preview-projection', 'renderer-payload'],
      reason: 'Source structure edits must regenerate all derived design views from source.',
    },
  };
}

function getSourceStructureIntent(action: SourceStructureAction): WorkbenchEditOperationInput['intent'] {
  if (action === 'delete') return 'delete';
  if (action === 'duplicate') return 'duplicate';
  return 'reorder';
}

function getSourceStructureIdentityEffect(action: SourceStructureAction): WorkbenchEditOperationInput['identityEffect'] {
  if (action === 'delete') return 'delete';
  if (action === 'duplicate') return 'clone';
  return 'move';
}

function getSourceStructureCleanupNote(action: SourceStructureAction): string {
  if (action === 'delete') return 'Deletion removes the selected JSX subtree and reparses source-derived token usage; unused imports may remain for later cleanup.';
  if (action === 'duplicate') return 'Duplicate is blocked for interaction-sensitive nodes until safe clone rewriting is available.';
  return 'Reorder preserves the selected JSX subtree and reparses source-derived selection.';
}

function getJsxAttribute(element: JSXElement, attributeName: string): JSXAttribute | null {
  return element.openingElement.attributes.find((candidate): candidate is JSXAttribute =>
    candidate.type === 'JSXAttribute' && getAttributeName(candidate) === attributeName,
  ) ?? null;
}

function isComponentElement(element: JSXElement): boolean {
  return isSafeComponentName(getElementDisplayName(element));
}

function isSafeComponentName(value: string): boolean {
  return /^[A-Z][A-Za-z0-9_$]*(?:\.[A-Z][A-Za-z0-9_$]*)*$/.test(value);
}

function isSafeComponentPropName(value: string): boolean {
  return value === 'children' ||
    isEditableSourceAttributeName(value) ||
    /^aria-[a-z][a-z0-9_-]*$/.test(value) ||
    /^data-[a-z0-9][a-z0-9._:-]*$/.test(value) ||
    /^[A-Za-z_$][\w$]*$/.test(value);
}

function isSafeImportSource(value: string): boolean {
  return value.length > 0 && !value.includes('\n') && !value.includes('\r') && !value.includes('"') && !value.includes("'");
}

function isSafeImportedLocalName(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function nodeLocationMatches(node: BabelNode, location: EditableTreeSourceLocation): boolean {
  return (
    node.loc?.start.line === location.startLine &&
    node.loc.start.column === location.startColumn &&
    node.loc.end.line === location.endLine &&
    node.loc.end.column === location.endColumn
  );
}

function getAttributeName(attribute: JSXAttribute): string | null {
  if (attribute.name.type === 'JSXIdentifier') return attribute.name.name;
  return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
}

function readStringAttributeValue(attribute: JSXAttribute): string | null {
  if (!attribute.value) return null;
  if (attribute.value.type === 'StringLiteral') return attribute.value.value;
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression.type === 'StringLiteral'
  ) {
    return attribute.value.expression.value;
  }
  return null;
}

function readJsxAttributeExpression(attribute: JSXAttribute): Expression | null {
  if (attribute.value?.type !== 'JSXExpressionContainer') return null;
  if (attribute.value.expression.type === 'JSXEmptyExpression') return null;
  return attribute.value.expression;
}

function findReferencedArrayExpression(
  program: Program,
  expression: Expression,
): Extract<Expression, { type: 'ArrayExpression' }> | null {
  const path = getStaticExpressionPath(expression);
  const [rootName, ...propertyPath] = path ?? [];
  if (!rootName) return null;

  const rootValue = findTopLevelVariableInit(program, rootName);
  if (!rootValue) return null;
  const resolvedValue = resolveStaticExpressionPath(rootValue, propertyPath, program);
  return resolvedValue?.type === 'ArrayExpression' ? resolvedValue : null;
}

function findReferencedArrayExpressionBySourceCode(
  program: Program,
  sourceCode: string,
): Extract<Expression, { type: 'ArrayExpression' }> | null {
  const path = getStaticExpressionPathFromSourceCode(sourceCode);
  const [rootName, ...propertyPath] = path ?? [];
  if (!rootName) return null;

  const rootValue = findTopLevelVariableInit(program, rootName);
  if (!rootValue) return null;
  const resolvedValue = resolveStaticExpressionPath(rootValue, propertyPath, program);
  return resolvedValue?.type === 'ArrayExpression' ? resolvedValue : null;
}

function getStaticExpressionPath(expression: Expression): string[] | null {
  if (expression.type === 'Identifier') return [expression.name];
  if (expression.type !== 'MemberExpression' || expression.computed) return null;
  const objectPath = getStaticExpressionPath(expression.object as Expression);
  if (!objectPath || expression.property.type !== 'Identifier') return null;
  return [...objectPath, expression.property.name];
}

function getStaticExpressionPathFromSourceCode(sourceCode: string): string[] | null {
  const parts = sourceCode.trim().split('.');
  if (parts.length === 0) return null;
  return parts.every((part) => /^[A-Za-z_$][\w$]*$/.test(part)) ? parts : null;
}

function findTopLevelVariableInit(program: Program, name: string): Expression | null {
  for (const statement of program.body) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type === 'Identifier' && declaration.id.name === name && declaration.init) {
        return declaration.init as Expression;
      }
    }
  }
  return null;
}

function resolveStaticExpressionPath(
  value: Expression,
  path: string[],
  program: Program,
): Expression | null {
  let current: Expression | null = value;
  for (const key of path) {
    if (!current) return null;
    if (current.type === 'Identifier') {
      current = findTopLevelVariableInit(program, current.name);
    }
    if (current?.type !== 'ObjectExpression') return null;
    current = getObjectExpressionPropertyValue(current, key);
  }
  return current;
}

function getObjectExpressionPropertyValue(objectExpression: ObjectExpression, key: string): Expression | null {
  for (const property of objectExpression.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    const propertyKey = readComponentPropObjectPropertyKey(property.key);
    if (propertyKey !== key) continue;
    return property.value as Expression;
  }
  return null;
}

function formatReferencedArrayExpression(
  contents: string,
  expression: Extract<Expression, { type: 'ArrayExpression' }>,
  value: EditableTreeSourcePropArray,
): string {
  const baseIndent = getLineIndentBefore(contents, expression.start ?? 0);
  const itemIndent = `${baseIndent}  `;
  if (value.length === 0) return '[]';
  const items = value.map((item, index) => (
    `${itemIndent}${formatReferencedArrayObjectExpression(contents, getReferencedArrayObjectTemplateElement(expression, index), item)}`
  ));
  return `[\n${items.join(',\n')}\n${baseIndent}]`;
}

function getReferencedArrayObjectTemplateElement(
  expression: Extract<Expression, { type: 'ArrayExpression' }>,
  index: number,
): BabelNode | null {
  const exact = expression.elements[index];
  if (exact?.type === 'ObjectExpression') return exact;
  for (let candidateIndex = Math.min(index - 1, expression.elements.length - 1); candidateIndex >= 0; candidateIndex -= 1) {
    const candidate = expression.elements[candidateIndex];
    if (candidate?.type === 'ObjectExpression') return candidate;
  }
  for (const candidate of expression.elements) {
    if (candidate?.type === 'ObjectExpression') return candidate;
  }
  return null;
}

function formatReferencedArrayObjectExpression(
  contents: string,
  existingElement: BabelNode | null,
  value: EditableTreeSourcePropObject,
): string {
  const entries: string[] = [];
  const writtenKeys = new Set<string>();

  if (existingElement?.type === 'ObjectExpression') {
    for (const property of existingElement.properties) {
      if (property.type !== 'ObjectProperty' || property.computed) {
        const text = getNodeSourceText(contents, property);
        if (text) entries.push(text);
        continue;
      }
      const key = readComponentPropObjectPropertyKey(property.key);
      if (key && Object.prototype.hasOwnProperty.call(value, key)) {
        entries.push(`${formatComponentPropObjectKey(key)}: ${formatComponentPropObjectValue(value[key])}`);
        writtenKeys.add(key);
        continue;
      }
      const text = getNodeSourceText(contents, property);
      if (text) entries.push(text);
    }
  }

  for (const [key, propValue] of Object.entries(value)) {
    if (writtenKeys.has(key)) continue;
    entries.push(`${formatComponentPropObjectKey(key)}: ${formatComponentPropObjectValue(propValue)}`);
  }

  return entries.length > 0 ? `{ ${entries.join(', ')} }` : '{}';
}

function getLineIndentBefore(contents: string, index: number): string {
  const lineStart = contents.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const match = /^[ \t]*/.exec(contents.slice(lineStart, index));
  return match?.[0] ?? '';
}

function getNodeSourceText(contents: string, node: BabelNode): string | null {
  if (typeof node.start !== 'number' || typeof node.end !== 'number') return null;
  return contents.slice(node.start, node.end).trim();
}

function readComponentPropAttributeValue(attribute: JSXAttribute): SourceComponentPropValue {
  if (!attribute.value) return true;
  if (attribute.value.type === 'StringLiteral') return attribute.value.value;
  if (attribute.value.type !== 'JSXExpressionContainer') return null;
  const expression = attribute.value.expression;
  if (expression.type === 'StringLiteral') return expression.value;
  if (expression.type === 'BooleanLiteral') return expression.value;
  if (expression.type === 'NumericLiteral') return expression.value;
  if (
    expression.type === 'UnaryExpression' &&
    (expression.operator === '-' || expression.operator === '+') &&
    expression.argument.type === 'NumericLiteral'
  ) {
    return expression.operator === '-' ? -expression.argument.value : expression.argument.value;
  }
  if (expression.type === 'ArrayExpression') return readComponentPropArrayExpression(expression);
  return null;
}

function readComponentPropArrayExpression(expression: BabelNode): EditableTreeSourcePropArray | EditableTreeSourcePropStringArray | null {
  if (expression.type !== 'ArrayExpression') return null;
  if (expression.elements.every((element) => element?.type === 'StringLiteral')) {
    return expression.elements.map((element) => element!.value);
  }
  const items: EditableTreeSourcePropObject[] = [];
  for (const element of expression.elements) {
    if (!element || element.type !== 'ObjectExpression') return null;
    const item: EditableTreeSourcePropObject = {};
    for (const property of element.properties) {
      if (property.type !== 'ObjectProperty') return null;
      const key = readComponentPropObjectPropertyKey(property.key);
      const value = readComponentPropObjectPropertyValue(property.value);
      if (!key || value === null) return null;
      item[key] = value;
    }
    items.push(item);
  }
  return items;
}

function readComponentPropObjectPropertyKey(key: BabelNode): string | null {
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function readComponentPropObjectPropertyValue(value: BabelNode): EditableTreeSourcePropPrimitive | null {
  if (value.type === 'StringLiteral') return value.value;
  if (value.type === 'BooleanLiteral') return value.value;
  if (value.type === 'NumericLiteral') return value.value;
  if (
    value.type === 'UnaryExpression' &&
    (value.operator === '-' || value.operator === '+') &&
    value.argument.type === 'NumericLiteral'
  ) {
    return value.operator === '-' ? -value.argument.value : value.argument.value;
  }
  return null;
}

function normalizeComponentPropValue(value: SourceComponentPropValue, propName?: string): SourceComponentPropValue {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return propName ? value : value.trim() ? value : null;
  if (Array.isArray(value)) {
    if (isComponentPropStringArray(value)) {
      const normalized = normalizeComponentPropStringArray(value);
      return propName === 'itemPropKeys' || normalized.length > 0 ? normalized : null;
    }
    const normalized = normalizeComponentPropArray(value);
    return normalized.length > 0 ? normalized : null;
  }
  return null;
}

function isComponentPropStringArray(value: unknown[]): value is EditableTreeSourcePropStringArray {
  return value.every((item) => typeof item === 'string');
}

function normalizeComponentPropStringArray(value: EditableTreeSourcePropStringArray): EditableTreeSourcePropStringArray {
  return [...new Set(value.map((item) => item.trim()).filter((item) => item.length > 0))];
}

function normalizeComponentPropArray(value: EditableTreeSourcePropArray): EditableTreeSourcePropArray {
  const normalized = value.map((item) => {
    const nextItem: EditableTreeSourcePropObject = {};
    for (const [key, propValue] of Object.entries(item)) {
      const safeKey = key.trim();
      if (!safeKey || !isSafeComponentPropName(safeKey)) continue;
      if (typeof propValue === 'boolean') {
        nextItem[safeKey] = propValue;
        continue;
      }
      const text = String(propValue).trim();
      if (typeof propValue === 'string') nextItem[safeKey] = propValue;
      else if (text) nextItem[safeKey] = text;
    }
    return nextItem;
  });
  let lastNonEmptyIndex = normalized.length - 1;
  while (lastNonEmptyIndex >= 0 && Object.keys(normalized[lastNonEmptyIndex] ?? {}).length === 0) {
    lastNonEmptyIndex -= 1;
  }
  return lastNonEmptyIndex >= 0 ? normalized.slice(0, lastNonEmptyIndex + 1) : [];
}

function areComponentPropValuesEqual(left: SourceComponentPropValue, right: SourceComponentPropValue): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return serializeComponentPropValue(left) === serializeComponentPropValue(right);
  }
  return left === right;
}

function formatAttributeText(attributeName: string, value: string): string {
  return `${attributeName}="${escapeAttributeValue(value)}"`;
}

function formatComponentPropAttributeText(attributeName: string, value: Exclude<SourceComponentPropValue, null>): string {
  if (typeof value === 'boolean') return `${attributeName}={${value ? 'true' : 'false'}}`;
  if (typeof value === 'number') return `${attributeName}={${String(value)}}`;
  if (Array.isArray(value)) return `${attributeName}={${formatComponentPropArrayExpression(value)}}`;
  if (/[\r\n]/.test(value)) return `${attributeName}={${JSON.stringify(value)}}`;
  return formatAttributeText(attributeName, value);
}

function createComponentPropReplacement(
  attribute: JSXAttribute,
  attributeName: string,
  nextValue: Exclude<SourceComponentPropValue, null>,
):
  | { ok: true; replacement: { start: number; end: number; text: string } }
  | { ok: false; diagnostic: string } {
  if (typeof attribute.start !== 'number' || typeof attribute.end !== 'number') {
    return {
      ok: false,
      diagnostic: `${attributeName} could not be updated because the JSX prop has no source range.`,
    };
  }

  return {
    ok: true,
    replacement: {
      start: attribute.start,
      end: attribute.end,
      text: formatComponentPropAttributeText(attributeName, nextValue),
    },
  };
}

function formatComponentPropArrayExpression(value: EditableTreeSourcePropArray | EditableTreeSourcePropStringArray): string {
  if (isComponentPropStringArray(value)) {
    return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
  }
  return `[${value.map(formatComponentPropObjectExpression).join(', ')}]`;
}

function formatComponentPropObjectExpression(value: EditableTreeSourcePropObject): string {
  const entries = Object.entries(value).map(([key, propValue]) => (
    `${formatComponentPropObjectKey(key)}: ${formatComponentPropObjectValue(propValue)}`
  ));
  if (entries.length === 0) return '{}';
  return `{ ${entries.join(', ')} }`;
}

function formatComponentPropObjectKey(key: string): string {
  return isSafeComponentPropName(key) ? key : JSON.stringify(key);
}

function formatComponentPropObjectValue(value: EditableTreeSourcePropPrimitive): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function serializeComponentPropValue(value: SourceComponentPropValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return isComponentPropStringArray(value)
      ? formatComponentPropArrayExpression(normalizeComponentPropStringArray(value))
      : formatComponentPropArrayExpression(normalizeComponentPropArray(value));
  }
  return `${typeof value}:${String(value)}`;
}

function formatStyleAttributeText(property: SourceStyleProperty, value: string): string {
  return `style={{ ${formatStylePropertyText(property, value)} }}`;
}

function formatStylePropertyText(property: SourceStyleProperty, value: string): string {
  return `${formatStylePropertyKey(property)}: "${escapeStyleStringValue(value)}"`;
}

function formatStylePropertyKey(property: SourceStyleProperty): string {
  const camelCase = kebabToCamelCase(property);
  return /^[A-Za-z_$][\w$]*$/.test(camelCase) ? camelCase : JSON.stringify(property);
}

function kebabToCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function camelToKebabCase(value: string): string {
  return value
    .replace(/^ms[A-Z]/, (match) => `-ms-${match.slice(2).toLowerCase()}`)
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function formatMissingAttributeInsertion(
  contents: string,
  insertAt: number,
  missingAttributes: string[],
): string {
  const afterName = contents.slice(insertAt);
  const multilineMatch = afterName.match(/^\n([ \t]+)/);
  if (!multilineMatch) return ` ${missingAttributes.join(' ')}`;

  const indent = multilineMatch[1];
  return missingAttributes.map((attribute) => `\n${indent}${attribute}`).join('');
}

function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeImportSource(value: string): string {
  return value.replace(/\\/g, '\\\\');
}

function escapeStyleStringValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function escapeJsxTextContent(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function normalizeSourceText(value: string): string {
  // Mirror JSX text semantics (Babel cleanJSXElementLiteralChild) instead of a
  // blanket trim: whitespace runs containing a newline are formatting — dropped
  // at the edges, a single space in the middle — while same-line edge spaces
  // are author content. Without this, a trailing/leading space typed in the
  // Inspector (the only way to put a space next to a styled <span> run) is
  // silently destroyed on the next parse/save round trip.
  return value
    .replace(/^[ \t]*\r?\n\s*/, '')
    .replace(/\s*\r?\n[ \t]*$/, '')
    .replace(/[ \t]*\r?\n\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

function formatSourceLocation(location: EditableTreeSourceLocation): string {
  return `${location.startLine}:${location.startColumn}-${location.endLine}:${location.endColumn}`;
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isBabelNode(value: unknown): value is BabelNode {
  return typeof value === 'object' && value !== null && 'type' in value;
}
