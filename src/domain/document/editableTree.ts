import type { TokenReference } from '@domain/design-system/tokens/types';

export type EditableTreeNodeKind = 'frame' | 'component-instance' | 'text';

export type EditableTreeSourceLocation = {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type EditableTreeTokenBindings = {
  background?: string;
  radius?: string;
  spacing?: string;
  fontSize?: string;
  text?: string;
};

export type EditableTreeTokenBindingReferences = {
  background?: TokenReference;
  radius?: TokenReference;
  spacing?: TokenReference;
  fontSize?: TokenReference;
  text?: TokenReference;
};

export type EditableTreeSourceAttributes = Record<string, string>;
export type EditableTreeSourceJsxProps = Record<string, string>;
export type EditableTreeSourcePropPrimitive = boolean | number | string;
export type EditableTreeSourcePropObject = Record<string, EditableTreeSourcePropPrimitive>;
export type EditableTreeSourcePropArray = EditableTreeSourcePropObject[];
export type EditableTreeSourcePropStringArray = string[];
export type EditableTreeSourcePropValue =
  | EditableTreeSourcePropPrimitive
  | EditableTreeSourcePropArray
  | EditableTreeSourcePropStringArray;
export type EditableTreeSourceProps = Record<string, EditableTreeSourcePropValue>;
// Plain JSON data a bound prop evaluated to at parse time but whose shape
// `sourceProps` cannot carry (nested arrays/objects, null). The Inspector does
// not edit these — the authored expression stays in `sourceJsxProps` for the
// writeback — and the canvas forwards them to the runtime component so a
// data-driven tree or menu renders from its source data.
export type EditableTreeSourceRuntimeValue =
  | null
  | boolean
  | number
  | string
  | EditableTreeSourceRuntimeValue[]
  | { [key: string]: EditableTreeSourceRuntimeValue };
export type EditableTreeSourceRuntimeProps = Record<string, EditableTreeSourceRuntimeValue>;
export type EditableTreeSourcePropArrayReference = {
  code?: string;
  items: Array<Record<string, string>>;
};
export type EditableTreeSourcePropArrayReferences = Record<string, EditableTreeSourcePropArrayReference>;
export type EditableTreeReferencedArrayProp = {
  items: EditableTreeSourcePropArray;
  propName: string;
  reference: EditableTreeSourcePropArrayReference;
};
export type EditableTreeSourceDataBinding = {
  expression: string;
  importName?: string;
  importSource?: string;
  kind: 'expression' | 'json-file' | 'module';
  path?: string;
};
export type EditableTreeSourceDataBindings = Record<string, EditableTreeSourceDataBinding>;
export type EditableTreeSourceStyleDeclarations = Record<string, string>;

export type EditableTreeSourceValueMetadataEntry =
  | {
      kind: 'literal';
      value: string;
      writable: true;
    }
  | {
      code: string;
      detachableValue?: string;
      kind: 'expression' | 'spread';
      writable: false;
    };

export type EditableTreeSourceValueMetadata = {
  propSpreads?: EditableTreeSourceValueMetadataEntry[];
  props?: Record<string, EditableTreeSourceValueMetadataEntry>;
  styleSpreads?: EditableTreeSourceValueMetadataEntry[];
  styles?: Record<string, EditableTreeSourceValueMetadataEntry>;
};

export type EditableTreeSourceExpressionKind =
  | 'array'
  | 'call'
  | 'conditional'
  | 'identifier'
  | 'logical'
  | 'map'
  | 'member'
  | 'object'
  | 'template'
  | 'unknown';

export type EditableTreeSourceExpression = {
  code: string;
  kind: EditableTreeSourceExpressionKind;
  label: string;
  mapSource?: {
    code: string;
    propName?: string;
  };
};

export type EditableTreeSourceMapBinding = {
  expression: EditableTreeSourceExpression;
  itemCount: number;
  itemIndex?: number;
  items?: EditableTreeSourcePropArray;
  reference?: EditableTreeSourcePropArrayReference;
  scope?: 'collection' | 'item';
  source: {
    code: string;
    label: string;
    propName?: string;
    writable: boolean;
  };
};

export type EditableTreeNode = {
  id: string;
  label: string;
  kind: EditableTreeNodeKind;
  children?: EditableTreeNode[];
  inspectable?: boolean;
  textContent?: string;
  source?: {
    assetId?: string;
    importName?: string;
    importSource?: string;
    sourceFile?: string;
    whitespace?: true;
    jsxName?: string;
  };
  sourceAttributes?: EditableTreeSourceAttributes;
  sourceDataBindings?: EditableTreeSourceDataBindings;
  sourceJsxProps?: EditableTreeSourceJsxProps;
  sourcePropArrayReferences?: EditableTreeSourcePropArrayReferences;
  sourceProps?: EditableTreeSourceProps;
  sourceRuntimeProps?: EditableTreeSourceRuntimeProps;
  sourceExpression?: EditableTreeSourceExpression;
  sourceMapBinding?: EditableTreeSourceMapBinding;
  sourcePreviewChildren?: EditableTreeNode[];
  sourcePreviewOrigin?: 'forwarded-source-child';
  sourceStyleDeclarations?: EditableTreeSourceStyleDeclarations;
  sourceValueMetadata?: EditableTreeSourceValueMetadata;
  sourceLocation?: EditableTreeSourceLocation;
  tokenBindingReferences?: EditableTreeTokenBindingReferences;
  tokenBindings?: EditableTreeTokenBindings;
};

export function getEditableTreeReferencedArrayProp(
  node: EditableTreeNode,
): EditableTreeReferencedArrayProp | null {
  for (const [propName, reference] of Object.entries(node.sourcePropArrayReferences ?? {})) {
    const value = node.sourceProps?.[propName];
    if (!isEditableTreeSourcePropObjectArray(value)) continue;
    return {
      items: value,
      propName,
      reference,
    };
  }
  return null;
}

function isEditableTreeSourcePropObjectArray(
  value: EditableTreeSourcePropValue | undefined,
): value is EditableTreeSourcePropArray {
  return Array.isArray(value) && value.every((item) => (
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item)
  ));
}

const EDITABLE_TREE_SOURCE_RUNTIME_VALUE_MAX_DEPTH = 16;

// Plain data only — primitives, null, and arrays/objects made of the same —
// with a depth bound so a pathological value never recurses without end.
export function isEditableTreeSourceRuntimeValue(
  value: unknown,
  depth = 0,
): value is EditableTreeSourceRuntimeValue {
  if (value === null) return true;
  const type = typeof value;
  if (type === 'string' || type === 'boolean') return true;
  if (type === 'number') return Number.isFinite(value as number);
  if (type !== 'object' || depth >= EDITABLE_TREE_SOURCE_RUNTIME_VALUE_MAX_DEPTH) return false;
  if (Array.isArray(value)) return value.every((entry) => isEditableTreeSourceRuntimeValue(entry, depth + 1));
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(value as Record<string, unknown>).every((entry) => isEditableTreeSourceRuntimeValue(entry, depth + 1));
}

export type EditableDocumentTree = {
  id: string;
  label: string;
  root: EditableTreeNode;
};

export type EditableTreeEntry = {
  node: EditableTreeNode;
  depth: number;
};

export type EditableTreePreviewNodeLookup = {
  node: EditableTreeNode;
  sourcePreviewOnly: boolean;
};

export type EditableTreeSelectionBoundaryReason = 'source-map' | 'source-preview';

export type EditableTreeSelectionBoundaryLookup = {
  reason: EditableTreeSelectionBoundaryReason | null;
  selectableNode: EditableTreeNode;
  selectableSourcePreviewOnly: boolean;
  selectedNode: EditableTreeNode;
  selectedSourcePreviewOnly: boolean;
};

export function getEditableTreePreviewChildSourcePreviewOnly({
  child,
  parentSourcePreviewOnly,
  sourcePreviewChild,
}: {
  child: EditableTreeNode;
  parentSourcePreviewOnly: boolean;
  sourcePreviewChild: boolean;
}): boolean {
  if (child.sourcePreviewOrigin === 'forwarded-source-child') return false;
  return parentSourcePreviewOnly || sourcePreviewChild;
}

export type EditablePreviewAsset = {
  component: string;
  id: string;
};

export function createEditableDocumentTreeFromAsset(asset: EditablePreviewAsset | null): EditableDocumentTree | null {
  if (!asset) return null;

  return {
    id: 'preview-document',
    label: `${asset.component} preview`,
    root: {
      id: 'preview-frame',
      label: 'Preview frame',
      kind: 'frame',
      children: [
        {
          id: getAssetInstanceNodeId(asset.id),
          label: asset.component,
          kind: 'component-instance',
          inspectable: true,
          source: {
            assetId: asset.id,
          },
          children: [
            {
              id: `${getAssetInstanceNodeId(asset.id)}:label`,
              label: `${asset.component} label`,
              kind: 'text',
            },
          ],
        },
      ],
    },
  };
}

export function flattenEditableTree(root: EditableTreeNode | null): EditableTreeEntry[] {
  if (!root) return [];

  const entries: EditableTreeEntry[] = [];

  function visit(node: EditableTreeNode, depth: number) {
    entries.push({ node, depth });
    for (const child of node.children ?? []) {
      visit(child, depth + 1);
    }
  }

  visit(root, 0);
  return entries;
}

export function findEditableTreeNode(
  root: EditableTreeNode | null,
  nodeId: string | null,
): EditableTreeNode | null {
  if (!root || !nodeId) return null;
  if (root.id === nodeId) return root;

  for (const child of root.children ?? []) {
    const match = findEditableTreeNode(child, nodeId);
    if (match) return match;
  }

  return null;
}

export function findEditableTreeNodeInPreviewTree(
  root: EditableTreeNode | null,
  nodeId: string | null,
): EditableTreePreviewNodeLookup | null {
  if (!root || !nodeId) return null;

  function visit(node: EditableTreeNode, sourcePreviewOnly: boolean): EditableTreePreviewNodeLookup | null {
    if (node.id === nodeId) return { node, sourcePreviewOnly };

    for (const child of node.children ?? []) {
      const match = visit(child, getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: false,
      }));
      if (match) return match;
    }

    for (const child of node.sourcePreviewChildren ?? []) {
      const match = visit(child, getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: true,
      }));
      if (match) return match;
    }

    return null;
  }

  return visit(root, false);
}

export function isEditableTreeSourcePreviewOnlyNode(
  root: EditableTreeNode | null,
  nodeId: string | null,
): boolean {
  return findEditableTreeNodeInPreviewTree(root, nodeId)?.sourcePreviewOnly === true;
}

export function resolveEditableTreeSelectionBoundary(
  root: EditableTreeNode | null,
  nodeId: string | null,
): EditableTreeSelectionBoundaryLookup | null {
  if (!root || !nodeId) return null;

  type Boundary = {
    node: EditableTreeNode;
    reason: EditableTreeSelectionBoundaryReason;
    sourcePreviewOnly: boolean;
  };

  function visit(
    node: EditableTreeNode,
    sourcePreviewOnly: boolean,
    boundary: Boundary | null,
  ): EditableTreeSelectionBoundaryLookup | null {
    if (node.id === nodeId) {
      return {
        reason: boundary?.reason ?? null,
        selectableNode: boundary?.node ?? node,
        selectableSourcePreviewOnly: boundary?.sourcePreviewOnly ?? sourcePreviewOnly,
        selectedNode: node,
        selectedSourcePreviewOnly: sourcePreviewOnly,
      };
    }

    const descendantBoundary = boundary ?? (node.sourceMapBinding
      ? {
          node,
          reason: 'source-map' as const,
          sourcePreviewOnly,
        }
      : null);

    for (const child of node.children ?? []) {
      const childBoundary = child.sourcePreviewOrigin === 'forwarded-source-child'
        ? descendantBoundary?.reason === 'source-map'
          ? descendantBoundary
          : null
        : descendantBoundary;
      const match = visit(child, getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: false,
      }), childBoundary);
      if (match) return match;
    }

    for (const child of node.sourcePreviewChildren ?? []) {
      const childSourcePreviewOnly = getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: true,
      });
      const previewBoundary = child.sourcePreviewOrigin === 'forwarded-source-child'
        ? descendantBoundary?.reason === 'source-map'
          ? descendantBoundary
          : null
        : descendantBoundary ?? (childSourcePreviewOnly
          ? {
              node,
              reason: 'source-preview' as const,
              sourcePreviewOnly,
            }
          : null);
      const match = visit(child, childSourcePreviewOnly, previewBoundary);
      if (match) return match;
    }

    return null;
  }

  return visit(root, false, null);
}

// Ancestor ids of `nodeId`, ordered root-first and excluding the node itself.
// Returns [] when the node is the root or is not found.
export function collectEditableTreeAncestorIds(
  root: EditableTreeNode | null,
  nodeId: string | null,
): string[] {
  if (!root || !nodeId) return [];

  let found: string[] | null = null;
  function visit(node: EditableTreeNode, ancestors: string[]): void {
    if (found) return;
    if (node.id === nodeId) {
      found = ancestors;
      return;
    }
    const nextAncestors = [...ancestors, node.id];
    for (const child of node.children ?? []) {
      visit(child, nextAncestors);
      if (found) return;
    }
  }

  visit(root, []);
  return found ?? [];
}

export function getDefaultEditableTreeNodeId(root: EditableTreeNode | null): string {
  if (!root) return 'preview-frame';
  return flattenEditableTree(root).find(({ node }) => node.inspectable)?.node.id ?? root.id;
}

export function getAssetInstanceNodeId(assetId: string): string {
  return `preview-node:${assetId}`;
}
