import {
  getAssetInstanceNodeId,
  getDefaultEditableTreeNodeId,
  getEditableTreePreviewChildSourcePreviewOnly,
  type EditableTreeNode,
  type EditableTreeNodeKind,
  type EditableTreeSourceLocation,
  type EditableTreeSourceAttributes,
  type EditableTreeTokenBindingReferences,
  type EditableTreeTokenBindings,
} from '@domain/document/editableTree';

export type PreviewLayerKind = EditableTreeNodeKind;

export type PreviewLayer = {
  id: string;
  assetId: string | null;
  label: string;
  kind: PreviewLayerKind;
  depth: number;
  inspectable: boolean;
  sourceFile: string | null;
  sourceAttributes: EditableTreeSourceAttributes;
  sourceLocation: EditableTreeSourceLocation | null;
  sourcePreviewOnly: boolean;
  tokenBindingReferences: EditableTreeTokenBindingReferences;
  tokenBindings: EditableTreeTokenBindings;
  jsxName: string | null;
};

export function createPreviewLayers(
  root: EditableTreeNode | null,
  options: { includeSourcePreviewChildren?: boolean } = {},
): PreviewLayer[] {
  return flattenPreviewLayerNodes(root, options).map(({ node, depth, sourcePreviewOnly }) => ({
    id: node.id,
    assetId: node.source?.assetId ?? null,
    label: getPreviewLayerLabel(node),
    kind: node.kind,
    depth,
    inspectable: node.inspectable === true,
    sourceFile: node.source?.sourceFile ?? null,
    sourceAttributes: node.sourceAttributes ?? {},
    sourceLocation: node.sourceLocation ?? null,
    sourcePreviewOnly,
    tokenBindingReferences: node.tokenBindingReferences ?? {},
    tokenBindings: node.tokenBindings ?? {},
    jsxName: node.source?.jsxName ?? null,
  }));
}

function getPreviewLayerLabel(node: EditableTreeNode): string {
  if (node.kind === 'component-instance') {
    const contentLabel = getPreviewLayerComponentContentLabel(node);
    if (!contentLabel) return node.label;
    const label = `${node.label} · ${contentLabel}`;
    return label.length > 48 ? `${label.slice(0, 45)}...` : label;
  }
  if (node.kind !== 'text' || node.source?.jsxName === 'text') return node.label;
  const text = collectPreviewLayerText(node).replace(/\s+/g, ' ').trim();
  if (!text) return node.label;
  return text.length > 32 ? `${text.slice(0, 29)}...` : text;
}

function getPreviewLayerComponentContentLabel(node: EditableTreeNode): string | null {
  for (const key of [
    'label',
    'name',
    'title',
    'message',
    'header',
    'value',
    'placeholder',
    'description',
    'id',
  ]) {
    const value = node.sourceProps?.[key];
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const normalized = String(value).replace(/\s+/g, ' ').trim();
    if (!normalized || normalized === node.label) continue;
    return normalized;
  }
  return null;
}

function collectPreviewLayerText(node: EditableTreeNode): string {
  if (typeof node.textContent === 'string') return node.textContent;
  return (node.children ?? []).map(collectPreviewLayerText).join('');
}

function flattenPreviewLayerNodes(
  root: EditableTreeNode | null,
  options: { includeSourcePreviewChildren?: boolean },
): Array<{ depth: number; node: EditableTreeNode; sourcePreviewOnly: boolean }> {
  if (!root) return [];

  const entries: Array<{ depth: number; node: EditableTreeNode; sourcePreviewOnly: boolean }> = [];
  const seenNodeIds = new Set<string>();

  function visit(node: EditableTreeNode, depth: number, sourcePreviewOnly: boolean, includeNode = true) {
    const includeEntry = includeNode && node.source?.whitespace !== true && !seenNodeIds.has(node.id);
    if (includeEntry) {
      seenNodeIds.add(node.id);
      entries.push({ depth, node, sourcePreviewOnly });
    }
    const childDepth = includeEntry ? depth + 1 : depth;
    for (const child of node.children ?? []) {
      visit(child, childDepth, getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: false,
      }));
    }
    for (const child of node.sourcePreviewChildren ?? []) {
      const includePreviewChild = options.includeSourcePreviewChildren || child.sourcePreviewOrigin === 'forwarded-source-child';
      visit(child, childDepth, getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: true,
      }), includePreviewChild);
    }
  }

  visit(root, 0, false);
  return entries;
}

export function getAssetPreviewLayerId(assetId: string): string {
  return getAssetInstanceNodeId(assetId);
}

export function getDefaultPreviewLayerId(root: EditableTreeNode | null): string {
  return getDefaultEditableTreeNodeId(root);
}

export function formatPreviewLayerKind(kind: PreviewLayerKind): string {
  switch (kind) {
    case 'frame':
      return 'Frame';
    case 'component-instance':
      return 'Instance';
    case 'text':
      return 'Text';
  }
}
