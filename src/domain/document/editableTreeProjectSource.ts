import type {
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
  WorkbenchSelectionState,
} from '@domain/project/workbenchProject';
import type {
  EditableDocumentTree,
  EditableTreeNode,
  EditableTreeSourceExpression,
  EditableTreeTokenBindingReferences,
  EditableTreeSourceLocation,
  EditableTreeSourceMapBinding,
  EditableTreeSourcePropArray,
  EditableTreeSourcePropArrayReference,
  EditableTreeTokenBindings,
} from './editableTree';
import { isEditableTreeSourceRuntimeValue } from './editableTree';
import { normalizeEditableSourceAttributeValue } from './sourceAttributeSafety';

export type EditableTreeProjectSourceInput = {
  components: WorkbenchComponentRegistry;
  pages: WorkbenchPageRegistry;
  selection: WorkbenchSelectionState;
};

export type EditableTreeProjectSourceResult = {
  diagnostic: string;
  source:
    | { kind: 'page'; id: string; sourceFile: string }
    | { kind: 'component'; id: string; sourceFile: string }
    | { kind: 'none' };
  tree: EditableDocumentTree | null;
};

type EditableTreeExtension = {
  id?: unknown;
  label?: unknown;
  root?: unknown;
};

export function createEditableDocumentTreeFromProjectSource(
  input: EditableTreeProjectSourceInput,
): EditableTreeProjectSourceResult {
  const activeTarget = input.selection.activeTarget;

  if (activeTarget?.kind === 'page' && activeTarget.pageId) {
    const page = input.pages.pages.find((candidate) => candidate.id === activeTarget.pageId);
    if (page) return normalizeProjectTreeExtension({
      extension: page.extensions?.editableTree,
      fallbackId: page.id,
      fallbackLabel: page.name,
      source: { kind: 'page', id: page.id, sourceFile: page.sourceFile },
    });
  }

  if (activeTarget?.kind === 'component' && activeTarget.componentId) {
    const component = input.components.components.find((candidate) => candidate.id === activeTarget.componentId);
    if (component) return normalizeProjectTreeExtension({
      extension: component.extensions?.editableTree,
      fallbackId: component.id,
      fallbackLabel: component.name,
      source: { kind: 'component', id: component.id, sourceFile: component.sourceFile },
    });
  }

  return {
    diagnostic: 'No page or component is open.',
    source: { kind: 'none' },
    tree: null,
  };
}

function normalizeProjectTreeExtension({
  extension,
  fallbackId,
  fallbackLabel,
  source,
}: {
  extension: unknown;
  fallbackId: string;
  fallbackLabel: string;
  source: EditableTreeProjectSourceResult['source'];
}): EditableTreeProjectSourceResult {
  const parsed = normalizeEditableTreeExtension(extension, fallbackId, fallbackLabel);

  if (!parsed) {
    return {
      diagnostic: `${fallbackLabel} has no valid editable tree extension. Using the preview scaffold.`,
      source,
      tree: null,
    };
  }

  return {
    diagnostic: `Editable tree loaded from ${fallbackLabel}.`,
    source,
    tree: parsed,
  };
}

function normalizeEditableTreeExtension(
  extension: unknown,
  fallbackId: string,
  fallbackLabel: string,
): EditableDocumentTree | null {
  if (!isRecord(extension)) return null;

  const candidate = extension as EditableTreeExtension;
  const root = normalizeEditableTreeNode(candidate.root);
  if (!root) return null;

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : fallbackId,
    label: typeof candidate.label === 'string' && candidate.label.trim() ? candidate.label : fallbackLabel,
    root,
  };
}

function normalizeEditableTreeNode(node: unknown): EditableTreeNode | null {
  if (!isRecord(node)) return null;
  if (typeof node.id !== 'string' || !node.id.trim()) return null;
  if (typeof node.label !== 'string' || !node.label.trim()) return null;
  if (node.kind !== 'frame' && node.kind !== 'component-instance' && node.kind !== 'text') return null;

  const children = Array.isArray(node.children)
    ? node.children.flatMap((child) => {
        const normalized = normalizeEditableTreeNode(child);
        return normalized ? [normalized] : [];
      })
    : undefined;

  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    ...(children && children.length > 0 ? { children } : {}),
    ...(node.inspectable === true ? { inspectable: true } : {}),
    ...(typeof node.textContent === 'string' ? { textContent: node.textContent } : {}),
    ...normalizeEditableTreeNodeSource(node.source),
    ...normalizeEditableTreeSourceAttributes(node.sourceAttributes),
    ...normalizeEditableTreeSourceDataBindings(node.sourceDataBindings),
    ...normalizeEditableTreeSourceJsxProps(node.sourceJsxProps),
    ...normalizeEditableTreeSourceProps(node.sourceProps),
    ...normalizeEditableTreeSourceRuntimeProps(node.sourceRuntimeProps),
    ...normalizeEditableTreeSourceMapBinding(node.sourceMapBinding),
    ...normalizeEditableTreeSourceLocation(node.sourceLocation),
    ...normalizeEditableTreeTokenBindings(node.tokenBindings),
    ...normalizeEditableTreeTokenBindingReferences(node.tokenBindingReferences),
  };
}

function normalizeEditableTreeNodeSource(source: unknown): Pick<EditableTreeNode, 'source'> {
  if (!isRecord(source)) return {};
  const normalized = {
    ...(typeof source.assetId === 'string' && source.assetId.trim() ? { assetId: source.assetId } : {}),
    ...(typeof source.importName === 'string' && source.importName.trim() ? { importName: source.importName } : {}),
    ...(typeof source.importSource === 'string' && source.importSource.trim() ? { importSource: source.importSource } : {}),
    ...(typeof source.sourceFile === 'string' && source.sourceFile.trim() ? { sourceFile: source.sourceFile } : {}),
    ...(typeof source.jsxName === 'string' && source.jsxName.trim() ? { jsxName: source.jsxName } : {}),
  };
  return Object.keys(normalized).length > 0 ? { source: normalized } : {};
}

function normalizeEditableTreeSourceAttributes(sourceAttributes: unknown): Pick<EditableTreeNode, 'sourceAttributes'> {
  if (!isRecord(sourceAttributes)) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceAttributes).flatMap((entry): Array<[string, string]> => {
      const [attributeName, value] = entry;
      if (typeof attributeName !== 'string' || !attributeName.trim() || typeof value !== 'string') return [];
      const normalizedValue = normalizeEditableSourceAttributeValue(attributeName, value, { allowEmpty: true });
      return normalizedValue === null ? [] : [[attributeName, normalizedValue]];
    }),
  );
  return Object.keys(normalized).length > 0 ? { sourceAttributes: normalized } : {};
}

function normalizeEditableTreeSourceDataBindings(sourceDataBindings: unknown): Pick<EditableTreeNode, 'sourceDataBindings'> {
  if (!isRecord(sourceDataBindings)) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceDataBindings).flatMap((entry): Array<[string, NonNullable<EditableTreeNode['sourceDataBindings']>[string]]> => {
      const [propName, value] = entry;
      if (typeof propName !== 'string' || !propName.trim() || !isRecord(value)) return [];
      const kind = value.kind === 'json-file' || value.kind === 'module' || value.kind === 'expression'
        ? value.kind
        : null;
      if (!kind || typeof value.expression !== 'string' || !value.expression.trim()) return [];
      return [[propName, {
        expression: value.expression,
        kind,
        ...(typeof value.importName === 'string' && value.importName.trim() ? { importName: value.importName } : {}),
        ...(typeof value.importSource === 'string' && value.importSource.trim() ? { importSource: value.importSource } : {}),
        ...(typeof value.path === 'string' && value.path.trim() ? { path: value.path } : {}),
      }]];
    }),
  );
  return Object.keys(normalized).length > 0 ? { sourceDataBindings: normalized } : {};
}

function normalizeEditableTreeSourceJsxProps(sourceJsxProps: unknown): Pick<EditableTreeNode, 'sourceJsxProps'> {
  if (!isRecord(sourceJsxProps)) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceJsxProps).filter((entry): entry is [string, string] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      typeof entry[1] === 'string' &&
      entry[1].trim().length > 0
    )),
  );
  return Object.keys(normalized).length > 0 ? { sourceJsxProps: normalized } : {};
}

function normalizeEditableTreeSourceProps(sourceProps: unknown): Pick<EditableTreeNode, 'sourceProps'> {
  if (!isRecord(sourceProps)) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceProps).filter((entry): entry is [string, NonNullable<EditableTreeNode['sourceProps']>[string]] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      isEditableTreeSourcePropValue(entry[1])
    )),
  );
  return Object.keys(normalized).length > 0 ? { sourceProps: normalized } : {};
}

function normalizeEditableTreeSourceRuntimeProps(sourceRuntimeProps: unknown): Pick<EditableTreeNode, 'sourceRuntimeProps'> {
  if (!isRecord(sourceRuntimeProps)) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceRuntimeProps).filter((entry): entry is [string, NonNullable<EditableTreeNode['sourceRuntimeProps']>[string]] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      isEditableTreeSourceRuntimeValue(entry[1])
    )),
  );
  return Object.keys(normalized).length > 0 ? { sourceRuntimeProps: normalized } : {};
}

function isEditableTreeSourcePropValue(value: unknown): value is NonNullable<EditableTreeNode['sourceProps']>[string] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (!Array.isArray(value)) return false;
  if (value.every((item) => typeof item === 'string')) {
    return true;
  }
  return value.every((item) => (
    isRecord(item) &&
    Object.entries(item).every(([key, propValue]) => (
      typeof key === 'string' &&
      key.trim().length > 0 &&
      (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean')
    ))
  ));
}

function normalizeEditableTreeSourceMapBinding(sourceMapBinding: unknown): Pick<EditableTreeNode, 'sourceMapBinding'> {
  if (!isRecord(sourceMapBinding) || !isRecord(sourceMapBinding.source)) return {};
  const expression = normalizeEditableTreeSourceExpression(sourceMapBinding.expression);
  if (!expression) return {};
  const sourceCode = typeof sourceMapBinding.source.code === 'string' ? sourceMapBinding.source.code.trim() : '';
  const sourceLabel = typeof sourceMapBinding.source.label === 'string' ? sourceMapBinding.source.label.trim() : sourceCode;
  if (!sourceCode || !sourceLabel) return {};
  const scope = sourceMapBinding.scope === 'collection' ? 'collection' : 'item';
  const itemIndex = typeof sourceMapBinding.itemIndex === 'number' ? sourceMapBinding.itemIndex : undefined;
  const itemCount = typeof sourceMapBinding.itemCount === 'number' ? sourceMapBinding.itemCount : -1;
  if (
    (scope === 'item' && (!Number.isInteger(itemIndex) || (itemIndex ?? -1) < 0)) ||
    !Number.isInteger(itemCount) ||
    itemCount < 0
  ) return {};
  const items = isEditableTreeSourcePropArrayValue(sourceMapBinding.items) ? sourceMapBinding.items : undefined;
  const reference = normalizeEditableTreeSourcePropArrayReference(sourceMapBinding.reference);
  const normalized: EditableTreeSourceMapBinding = {
    expression,
    itemCount,
    ...(typeof itemIndex === 'number' ? { itemIndex } : {}),
    ...(items ? { items } : {}),
    ...(reference ? { reference } : {}),
    scope,
    source: {
      code: sourceCode,
      label: sourceLabel,
      ...(typeof sourceMapBinding.source.propName === 'string' && sourceMapBinding.source.propName.trim()
        ? { propName: sourceMapBinding.source.propName }
        : {}),
      writable: sourceMapBinding.source.writable === true,
    },
  };
  return { sourceMapBinding: normalized };
}

function normalizeEditableTreeSourceExpression(expression: unknown): EditableTreeSourceExpression | null {
  if (!isRecord(expression)) return null;
  const kind = typeof expression.kind === 'string' && [
    'array',
    'call',
    'conditional',
    'identifier',
    'logical',
    'map',
    'member',
    'object',
    'template',
    'unknown',
  ].includes(expression.kind)
    ? expression.kind as EditableTreeSourceExpression['kind']
    : null;
  if (!kind || typeof expression.code !== 'string' || !expression.code.trim() || typeof expression.label !== 'string' || !expression.label.trim()) return null;
  const mapSource = isRecord(expression.mapSource) && typeof expression.mapSource.code === 'string' && expression.mapSource.code.trim()
    ? {
        code: expression.mapSource.code,
        ...(typeof expression.mapSource.propName === 'string' && expression.mapSource.propName.trim()
          ? { propName: expression.mapSource.propName }
          : {}),
      }
    : undefined;
  return {
    code: expression.code,
    kind,
    label: expression.label,
    ...(mapSource ? { mapSource } : {}),
  };
}

function normalizeEditableTreeSourcePropArrayReference(reference: unknown): EditableTreeSourcePropArrayReference | null {
  if (!isRecord(reference) || !Array.isArray(reference.items)) return null;
  return {
    ...(typeof reference.code === 'string' && reference.code.trim() ? { code: reference.code } : {}),
    items: reference.items.map((item) => {
      if (!isRecord(item)) return {};
      return Object.fromEntries(
        Object.entries(item).filter((entry): entry is [string, string] => (
          typeof entry[0] === 'string' &&
          entry[0].trim().length > 0 &&
          typeof entry[1] === 'string'
        )),
      );
    }),
  };
}

function isEditableTreeSourcePropArrayValue(value: unknown): value is EditableTreeSourcePropArray {
  return Array.isArray(value) &&
    value.every((item) => (
      isRecord(item) &&
      Object.entries(item).every(([key, propValue]) => (
        typeof key === 'string' &&
        key.trim().length > 0 &&
        (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean')
      ))
    ));
}

function normalizeEditableTreeSourceLocation(sourceLocation: unknown): Pick<EditableTreeNode, 'sourceLocation'> {
  if (!isRecord(sourceLocation)) return {};
  const location: EditableTreeSourceLocation = {
    startLine: typeof sourceLocation.startLine === 'number' ? sourceLocation.startLine : 0,
    startColumn: typeof sourceLocation.startColumn === 'number' ? sourceLocation.startColumn : 0,
    endLine: typeof sourceLocation.endLine === 'number' ? sourceLocation.endLine : 0,
    endColumn: typeof sourceLocation.endColumn === 'number' ? sourceLocation.endColumn : 0,
  };

  return location.startLine > 0 && location.endLine > 0 ? { sourceLocation: location } : {};
}

function normalizeEditableTreeTokenBindings(tokenBindings: unknown): Pick<EditableTreeNode, 'tokenBindings'> {
  if (!isRecord(tokenBindings)) return {};
  const normalized: EditableTreeTokenBindings = {
    ...(typeof tokenBindings.background === 'string' && tokenBindings.background.trim() ? { background: tokenBindings.background } : {}),
    ...(typeof tokenBindings.fontSize === 'string' && tokenBindings.fontSize.trim() ? { fontSize: tokenBindings.fontSize } : {}),
    ...(typeof tokenBindings.radius === 'string' && tokenBindings.radius.trim() ? { radius: tokenBindings.radius } : {}),
    ...(typeof tokenBindings.spacing === 'string' && tokenBindings.spacing.trim() ? { spacing: tokenBindings.spacing } : {}),
    ...(typeof tokenBindings.text === 'string' && tokenBindings.text.trim() ? { text: tokenBindings.text } : {}),
  };
  return Object.keys(normalized).length > 0 ? { tokenBindings: normalized } : {};
}

function normalizeEditableTreeTokenBindingReferences(tokenBindingReferences: unknown): Pick<EditableTreeNode, 'tokenBindingReferences'> {
  if (!isRecord(tokenBindingReferences)) return {};
  const normalized: EditableTreeTokenBindingReferences = {
    ...normalizeEditableTreeTokenBindingReference(tokenBindingReferences.background, 'background'),
    ...normalizeEditableTreeTokenBindingReference(tokenBindingReferences.fontSize, 'fontSize'),
    ...normalizeEditableTreeTokenBindingReference(tokenBindingReferences.radius, 'radius'),
    ...normalizeEditableTreeTokenBindingReference(tokenBindingReferences.spacing, 'spacing'),
    ...normalizeEditableTreeTokenBindingReference(tokenBindingReferences.text, 'text'),
  };
  return Object.keys(normalized).length > 0 ? { tokenBindingReferences: normalized } : {};
}

function normalizeEditableTreeTokenBindingReference(
  reference: unknown,
  field: keyof EditableTreeTokenBindingReferences,
): EditableTreeTokenBindingReferences {
  if (!isRecord(reference)) return {};
  if (typeof reference.collectionId !== 'string' || !reference.collectionId.trim()) return {};
  if (typeof reference.tokenId !== 'string' || !reference.tokenId.trim()) return {};
  return {
    [field]: {
      collectionId: reference.collectionId,
      tokenId: reference.tokenId,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
