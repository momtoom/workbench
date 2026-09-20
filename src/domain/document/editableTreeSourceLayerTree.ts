import {
  findEditableTreeNode,
  findEditableTreeNodeInPreviewTree,
  type EditableTreeNode,
} from './editableTree';
import {
  SOURCE_INSERT_CHILD_TEMPLATES,
  type SourceInsertChildTemplate,
  type SourceStructureAction,
} from './editableTreeSourceWriteback';
import {
  canInsertComponentChildrenIntoElement,
  canInsertSourceChildTemplateIntoElement,
  canMoveSourceChildIntoParent,
  getSourceChildrenSlotKind,
  hasRegisteredSourceSlotContract,
} from './sourceSlotContainers';
import { SOURCE_ASSET_KIND_ATTRIBUTE } from './sourceAttributeSafety';

export type SourceLayerDropPosition = 'after' | 'before' | 'inside';

export type SourceLayerDropTarget = {
  index: number;
  layerId: string;
  parentId: string;
  position: SourceLayerDropPosition;
};

export type SourceKeyboardMoveIntent =
  | { kind: 'indent' }
  | { kind: 'outdent' }
  | { kind: 'reorder'; offset: number };

export type SourceKeyboardMoveTarget = {
  targetIndex: number;
  targetParentNode: EditableTreeNode;
};

export function getSourceInsertTemplatesForNode(
  node: EditableTreeNode | null,
): readonly SourceInsertChildTemplate[] {
  if (node?.sourceMapBinding) return [];
  if (!isSourceNodeWithEditableChildrenRange(node)) return [];
  const jsxName = node.source.jsxName?.toLowerCase() ?? '';
  const sourceJsxName = node.source.jsxName ?? '';
  if (!jsxName || isSourceTextLeafNode(node)) return [];
  if (SOURCE_INSERT_VOID_TAGS.has(jsxName)) return [];

  const templates = SOURCE_INSERT_CHILD_TEMPLATES.filter((template) => (
    canInsertSourceChildTemplateIntoElement(sourceJsxName, template.id)
  ));
  if (templates.length > 0 || !canTreatSourceNodeAsExplicitUnknownChildrenContainer(node)) return templates;
  return SOURCE_INSERT_CHILD_TEMPLATES;
}

export function canShowSourceLayerAddAction(node: EditableTreeNode | null): boolean {
  return canInsertComponentIntoSourceNode(node) || getSourceInsertTemplatesForNode(node).length > 0;
}

export function canInsertComponentIntoSourceNode(node: EditableTreeNode | null): boolean {
  if (node?.sourceMapBinding) return false;
  if (!isSourceNodeWithEditableChildrenRange(node)) return false;
  const jsxName = node.source.jsxName?.toLowerCase() ?? '';
  const sourceJsxName = node.source.jsxName ?? '';
  if (!jsxName || isSourceTextLeafNode(node)) return false;
  if (SOURCE_INSERT_VOID_TAGS.has(jsxName)) return false;
  return canInsertComponentChildrenIntoElement(sourceJsxName) ||
    canTreatSourceNodeAsExplicitUnknownChildrenContainer(node);
}

export function canTreatSourceNodeAsExplicitUnknownChildrenContainer(node: EditableTreeNode | null): boolean {
  if (!isSourceNodeWithEditableChildrenRange(node)) return false;
  const sourceJsxName = node.source.jsxName ?? '';
  if (!sourceJsxName || isSourceTextLeafNode(node)) return false;
  if (SOURCE_INSERT_VOID_TAGS.has(sourceJsxName.toLowerCase())) return false;
  if (getSourceChildrenSlotKind(sourceJsxName)) return false;
  if (hasRegisteredSourceSlotContract(sourceJsxName)) return false;
  // Imported/custom components are closed unless their component/slot contract
  // explicitly declares children. Treating every unknown PascalCase component
  // as a container advertises insert/drop operations that may be impossible
  // (or may overwrite runtime-owned internals).
  if (node.source.importSource || /^[A-Z]/.test(sourceJsxName)) return false;
  const pathInfo = getSourceNodePathInfo(node.id);
  return Boolean(pathInfo && !pathInfo.isText);
}

export function canMoveSourceNodeIntoParent(
  node: EditableTreeNode,
  parentNode: EditableTreeNode,
): boolean {
  if (parentNode.sourceMapBinding) return false;
  const parentPath = getSourceNodePathInfo(parentNode.id);
  const nodePath = getSourceNodePathInfo(node.id);
  if (!parentPath || parentPath.isText || !nodePath) return false;
  if (nodePath.path.length <= parentPath.path.length && nodePath.path.every((part, index) => part === parentPath.path[index])) {
    return false;
  }
  const parentJsxName = parentNode.source?.jsxName?.toLowerCase() ?? '';
  const parentSourceJsxName = parentNode.source?.jsxName ?? '';
  const nodeJsxName = node.source?.jsxName?.toLowerCase() ?? '';
  const nodeSourceJsxName = node.source?.jsxName ?? '';
  if (!parentJsxName || isSourceTextLeafNode(parentNode)) return false;
  if (SOURCE_INSERT_VOID_TAGS.has(parentJsxName)) return false;
  if (canTreatSourceNodeAsExplicitUnknownChildrenContainer(parentNode)) return true;
  if (!nodeJsxName) return false;
  return canMoveSourceChildIntoParent(parentSourceJsxName, nodeSourceJsxName || nodeJsxName);
}

export function isDraggableSourceNodeId(nodeId: string): boolean {
  const pathInfo = getSourceNodePathInfo(nodeId);
  return Boolean(pathInfo && pathInfo.path.length > 0);
}

export function resolveSourceLayerDropTarget({
  documentRoot,
  draggedLayerId,
  pointerRatio,
  targetLayerId,
}: {
  documentRoot: EditableTreeNode;
  draggedLayerId: string;
  pointerRatio: number;
  targetLayerId: string;
}): SourceLayerDropTarget | null {
  if (draggedLayerId === targetLayerId) return null;
  const draggedNode = findSourceLayerTreeNode(documentRoot, draggedLayerId);
  const targetNode = findSourceLayerTreeNode(documentRoot, targetLayerId);
  if (!draggedNode || !targetNode) return null;

  const ratio = clampPointerRatio(pointerRatio);
  const draggedParent = findEditableTreeParent(documentRoot, draggedLayerId);
  const targetParent = findEditableTreeParent(documentRoot, targetLayerId);
  const targetIndex = targetParent
    ? getSourceLayerTreeChildren(targetParent).findIndex((child) => child.id === targetLayerId)
    : -1;
  const canDropInsideTarget = canMoveSourceNodeIntoParent(draggedNode, targetNode);
  if (canDropInsideTarget && isInsideDropRatio(targetNode, ratio)) {
    return {
      index: getSourceLayerTreeChildren(targetNode).length,
      layerId: targetLayerId,
      parentId: targetNode.id,
      position: 'inside',
    };
  }

  const sameParentReorder = Boolean(draggedParent && targetParent && draggedParent.id === targetParent.id);
  if (!targetParent || targetIndex < 0 || (!sameParentReorder && !canMoveSourceNodeIntoParent(draggedNode, targetParent))) return null;
  return {
    index: ratio < 0.5 ? targetIndex : targetIndex + 1,
    layerId: targetLayerId,
    parentId: targetParent.id,
    position: ratio < 0.5 ? 'before' : 'after',
  };
}

export function resolveSourceKeyboardMoveTarget({
  documentRoot,
  intent,
  nodeId,
}: {
  documentRoot: EditableTreeNode;
  intent: SourceKeyboardMoveIntent;
  nodeId: string;
}): SourceKeyboardMoveTarget | null {
  const node = findSourceLayerTreeNode(documentRoot, nodeId);
  if (!node || !isDraggableSourceNodeId(node.id)) return null;

  if (intent.kind === 'reorder') {
    return resolveSourceKeyboardReorderTarget(documentRoot, node, intent.offset);
  }

  if (intent.kind === 'outdent') {
    return resolveSourceKeyboardOutdentTarget(documentRoot, node);
  }

  return resolveSourceKeyboardIndentTarget(documentRoot, node);
}

export function getPredictedInsertedSourceChildId(parentNode: EditableTreeNode, targetIndex?: number): string | null {
  const pathInfo = getSourceNodePathInfo(parentNode.id);
  if (!pathInfo || pathInfo.isText) return null;

  const childCount = getSourceLayerTreeChildren(parentNode).length;
  const childIndex = typeof targetIndex === 'number' && Number.isInteger(targetIndex)
    ? Math.max(0, Math.min(targetIndex, childCount))
    : childCount;
  const childPath = pathInfo.path.length === 0 ? [childIndex] : [...pathInfo.path, childIndex];
  return formatSourceNodeIdFromPath(pathInfo.prefix, childPath);
}

export function getPredictedWrappedSourceLayerIds(nodes: EditableTreeNode[]): {
  childIds: string[];
  wrapperId: string;
} | null {
  if (nodes.length === 0) return null;
  const nodePaths = nodes.map((node) => getSourceNodePathInfo(node.id));
  if (nodePaths.some((pathInfo) => !pathInfo || pathInfo.path.length === 0)) return null;

  const resolvedPaths = nodePaths as Array<{ isText: boolean; path: number[]; prefix: string }>;
  const firstPath = resolvedPaths[0]!;
  const parentPath = firstPath.path.slice(0, -1);
  if (resolvedPaths.some((pathInfo) => (
    pathInfo.prefix !== firstPath.prefix ||
    !pathsAreEqual(pathInfo.path.slice(0, -1), parentPath)
  ))) return null;

  const sortedPaths = [...resolvedPaths].sort((left, right) => (
    left.path[left.path.length - 1] - right.path[right.path.length - 1]
  ));
  const wrapperIndex = sortedPaths[0]!.path[sortedPaths[0]!.path.length - 1];
  const wrapperPath = [...parentPath, wrapperIndex];
  return {
    wrapperId: formatSourceNodeIdFromPath(firstPath.prefix, wrapperPath),
    childIds: sortedPaths.map((pathInfo, childIndex) => (
      formatSourceNodeIdFromPath(firstPath.prefix, [...wrapperPath, childIndex], pathInfo.isText)
    )),
  };
}

export function resolveSourceLayerAddChildTargetIndex({
  activeLayerId,
  parentNode,
  selectedLayerIds,
}: {
  activeLayerId: string | null;
  parentNode: EditableTreeNode | null;
  selectedLayerIds: string[];
}): number | undefined {
  if (!parentNode || !activeLayerId || activeLayerId === parentNode.id) return undefined;
  const children = getSourceLayerTreeChildren(parentNode);
  if (children.length === 0) return undefined;

  const selectedIds = new Set(selectedLayerIds.length > 0 ? selectedLayerIds : [activeLayerId]);
  if (selectedIds.has(parentNode.id)) return undefined;

  const childIndexById = new Map(children.map((child, index) => [child.id, index]));
  const selectedChildIndexes: number[] = [];
  for (const selectedId of selectedIds) {
    const childIndex = childIndexById.get(selectedId);
    if (childIndex === undefined) return undefined;
    selectedChildIndexes.push(childIndex);
  }

  return Math.max(...selectedChildIndexes) + 1;
}

export function getPredictedSourceMoveSelectionId(
  node: EditableTreeNode,
  targetParentNode: EditableTreeNode,
  targetIndex: number,
): string | null {
  const sourcePath = getSourceNodePathInfo(node.id);
  const targetParentPath = getSourceNodePathInfo(targetParentNode.id);
  if (!sourcePath || sourcePath.path.length === 0 || !targetParentPath || targetParentPath.isText) {
    return null;
  }

  const sourceParentPath = sourcePath.path.slice(0, -1);
  const sourceIndex = sourcePath.path[sourcePath.path.length - 1];

  // Removing the dragged node shifts its later siblings (and their whole
  // subtrees) down by one index. When the target parent sits under that same
  // sibling axis *after* the dragged node, the parent's own path index shifts
  // too — so we must predict against the post-removal parent path, not the
  // pre-move one. Without this, dropping a node into a parent that follows it
  // (e.g. into a collapsed sibling) predicts a stale id that no longer exists
  // after re-parse, and selection falls back to the root.
  const removalDepth = sourceParentPath.length;
  const adjustedTargetParentPath = [...targetParentPath.path];
  if (
    adjustedTargetParentPath.length > removalDepth &&
    pathsAreEqual(sourceParentPath, adjustedTargetParentPath.slice(0, removalDepth)) &&
    adjustedTargetParentPath[removalDepth] > sourceIndex
  ) {
    adjustedTargetParentPath[removalDepth] -= 1;
  }

  const sameParent = pathsAreEqual(sourceParentPath, targetParentPath.path);
  const childCount = getSourceLayerTreeChildren(targetParentNode).length;
  const clampedIndex = Math.max(0, Math.min(targetIndex, childCount));
  const adjustedTargetIndex = sameParent && clampedIndex > sourceIndex ? clampedIndex - 1 : clampedIndex;
  return formatSourceNodeIdFromPath(targetParentPath.prefix, [...adjustedTargetParentPath, adjustedTargetIndex], sourcePath.isText);
}

export function getPredictedSourceMoveSelectionIds(
  nodes: EditableTreeNode[],
  targetParentNode: EditableTreeNode,
  targetIndex: number,
): Array<{ nextNodeId: string; nodeId: string }> {
  if (nodes.length === 0) return [];
  const sourcePaths = nodes.map((node) => ({
    node,
    path: getSourceNodePathInfo(node.id),
  }));
  if (sourcePaths.some(({ path }) => !path || path.path.length === 0)) return [];

  const resolvedSourcePaths = sourcePaths as Array<{
    node: EditableTreeNode;
    path: { isText: boolean; path: number[]; prefix: string };
  }>;
  const targetParentPath = getSourceNodePathInfo(targetParentNode.id);
  if (!targetParentPath || targetParentPath.isText) return [];
  if (resolvedSourcePaths.some(({ path }) => path.prefix !== targetParentPath.prefix)) return [];

  const adjustedTargetParentPath = [...targetParentPath.path];
  for (const { path } of resolvedSourcePaths) {
    const sourceParentPath = path.path.slice(0, -1);
    const sourceIndex = path.path[path.path.length - 1]!;
    const removalDepth = sourceParentPath.length;
    if (
      targetParentPath.path.length > removalDepth &&
      pathsAreEqual(sourceParentPath, targetParentPath.path.slice(0, removalDepth)) &&
      sourceIndex < targetParentPath.path[removalDepth]!
    ) {
      adjustedTargetParentPath[removalDepth] -= 1;
    }
  }

  const targetSourceIndexes = resolvedSourcePaths
    .filter(({ path }) => pathsAreEqual(path.path.slice(0, -1), targetParentPath.path))
    .map(({ path }) => path.path[path.path.length - 1]!);
  const childCount = getSourceLayerTreeChildren(targetParentNode).length;
  const clampedIndex = Math.max(0, Math.min(targetIndex, childCount));
  const adjustedTargetIndex = clampedIndex -
    targetSourceIndexes.filter((sourceIndex) => sourceIndex < clampedIndex).length;

  return [...resolvedSourcePaths]
    .sort((left, right) => {
      const maxLength = Math.max(left.path.path.length, right.path.path.length);
      for (let index = 0; index < maxLength; index += 1) {
        const difference = (left.path.path[index] ?? -1) - (right.path.path[index] ?? -1);
        if (difference !== 0) return difference;
      }
      return 0;
    })
    .map(({ node, path }, offset) => ({
      nextNodeId: formatSourceNodeIdFromPath(
        targetParentPath.prefix,
        [...adjustedTargetParentPath, adjustedTargetIndex + offset],
        path.isText,
      ),
      nodeId: node.id,
    }));
}

export function getPredictedSourceStructureSelectionId(
  node: EditableTreeNode,
  action: SourceStructureAction,
): string | null {
  const pathInfo = getSourceNodePathInfo(node.id);
  if (!pathInfo) return null;

  if (pathInfo.path.length === 0) {
    // Deleting the root unwraps it: its children are promoted to a new root
    // (a single child directly, or a fragment grouping multiple children) that
    // keeps the root id. Re-select it so the layer stays addable/editable
    // instead of leaving the selection empty. Duplicate/move are not valid on
    // the root, so they predict no selection.
    return action === 'delete' ? `${pathInfo.prefix}root` : null;
  }

  if (action === 'delete') {
    const parentPath = pathInfo.path.slice(0, -1);
    return parentPath.length === 0
      ? `${pathInfo.prefix}root`
      : formatSourceNodeIdFromPath(pathInfo.prefix, parentPath);
  }

  const nextPath = [...pathInfo.path];
  const lastIndex = nextPath.length - 1;
  if (action === 'duplicate') nextPath[lastIndex] += 1;
  if (action === 'move-up') nextPath[lastIndex] -= 1;
  if (action === 'move-down') nextPath[lastIndex] += 1;
  if (nextPath[lastIndex] < 0) return node.id;
  return formatSourceNodeIdFromPath(pathInfo.prefix, nextPath, pathInfo.isText);
}

export function findEditableTreeParent(root: EditableTreeNode, nodeId: string): EditableTreeNode | null {
  for (const child of root.children ?? []) {
    if (child.id === nodeId) return root;
    const match = findEditableTreeParent(child, nodeId);
    if (match) return match;
  }
  for (const child of root.sourcePreviewChildren ?? []) {
    if (child.id === nodeId) return root;
    const match = findEditableTreeParent(child, nodeId);
    if (match) return match;
  }
  return null;
}

function resolveSourceKeyboardReorderTarget(
  documentRoot: EditableTreeNode,
  node: EditableTreeNode,
  offset: number,
): SourceKeyboardMoveTarget | null {
  if (offset === 0) return null;
  const parent = findEditableTreeParent(documentRoot, node.id);
  if (!parent) return null;
  const siblings = getSourceLayerTreeChildren(parent);
  const sourceIndex = siblings.findIndex((child) => child.id === node.id);
  const targetSiblingIndex = sourceIndex + offset;
  if (sourceIndex < 0 || targetSiblingIndex < 0 || targetSiblingIndex >= siblings.length) return null;

  return {
    targetIndex: offset > 0 ? targetSiblingIndex + 1 : targetSiblingIndex,
    targetParentNode: parent,
  };
}

function findSourceLayerTreeNode(root: EditableTreeNode | null, nodeId: string): EditableTreeNode | null {
  return findEditableTreeNodeInPreviewTree(root, nodeId)?.node ?? findEditableTreeNode(root, nodeId);
}

function getSourceLayerTreeChildren(node: EditableTreeNode): EditableTreeNode[] {
  if (isSourceInlineIconNode(node)) return [];
  return [
    ...(node.children ?? []).filter((child) => child.source?.whitespace !== true),
    ...(node.sourcePreviewChildren ?? []).filter((child) => child.sourcePreviewOrigin === 'forwarded-source-child'),
  ];
}

function isSourceInlineIconNode(node: EditableTreeNode): boolean {
  if (node.source?.jsxName?.toLowerCase() !== 'svg') return false;
  const attributes = node.sourceAttributes ?? {};
  return attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon' || Boolean(attributes['data-icon']);
}

function resolveSourceKeyboardOutdentTarget(
  documentRoot: EditableTreeNode,
  node: EditableTreeNode,
): SourceKeyboardMoveTarget | null {
  const parent = findEditableTreeParent(documentRoot, node.id);
  if (!parent) return null;
  const grandParent = findEditableTreeParent(documentRoot, parent.id);
  if (!grandParent || !canMoveSourceNodeIntoParent(node, grandParent)) return null;
  const parentIndex = getSourceLayerTreeChildren(grandParent).findIndex((child) => child.id === parent.id);
  if (parentIndex < 0) return null;

  return {
    targetIndex: parentIndex + 1,
    targetParentNode: grandParent,
  };
}

function resolveSourceKeyboardIndentTarget(
  documentRoot: EditableTreeNode,
  node: EditableTreeNode,
): SourceKeyboardMoveTarget | null {
  let searchParent = findEditableTreeParent(documentRoot, node.id);
  if (!searchParent) return null;
  let searchNodeId = node.id;
  let searchIndex = getSourceLayerTreeChildren(searchParent).findIndex((child) => child.id === searchNodeId);

  while (searchParent && searchIndex >= 0) {
    const siblings = getSourceLayerTreeChildren(searchParent);
    const previousSibling = searchIndex > 0 ? siblings[searchIndex - 1] : null;
    if (previousSibling && canMoveSourceNodeIntoParent(node, previousSibling)) {
      return {
        targetIndex: getSourceLayerTreeChildren(previousSibling).length,
        targetParentNode: previousSibling,
      };
    }

    const nextSibling = searchIndex < siblings.length - 1 ? siblings[searchIndex + 1] : null;
    if (nextSibling && canMoveSourceNodeIntoParent(node, nextSibling)) {
      return {
        targetIndex: 0,
        targetParentNode: nextSibling,
      };
    }

    searchNodeId = searchParent.id;
    searchParent = findEditableTreeParent(documentRoot, searchParent.id);
    searchIndex = searchParent
      ? getSourceLayerTreeChildren(searchParent).findIndex((child) => child.id === searchNodeId)
      : -1;
  }

  return null;
}

function isSourceNodeWithEditableChildrenRange(node: EditableTreeNode | null): node is EditableTreeNode & {
  source: NonNullable<EditableTreeNode['source']> & { sourceFile: string };
} {
  return Boolean(node?.sourceLocation && node.source?.sourceFile);
}

function isSourceTextLeafNode(node: EditableTreeNode): boolean {
  return node.kind === 'text' && node.source?.jsxName === 'text';
}

function isInsideDropRatio(targetNode: EditableTreeNode, ratio: number): boolean {
  const hasChildren = getSourceLayerTreeChildren(targetNode).length > 0;
  const min = hasChildren ? 0.25 : 0.12;
  const max = hasChildren ? 0.75 : 0.88;
  return ratio >= min && ratio <= max;
}

function clampPointerRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

const SOURCE_INSERT_VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'svg',
  'track',
  'wbr',
]);

function getSourceNodePathInfo(nodeId: string): { isText: boolean; path: number[]; prefix: string } | null {
  if (!nodeId.startsWith('source:')) return null;
  const pathStart = nodeId.lastIndexOf(':');
  if (pathStart === -1 || pathStart === nodeId.length - 1) return null;
  const prefix = nodeId.slice(0, pathStart + 1);
  const rawPath = nodeId.slice(pathStart + 1);
  const isText = rawPath.endsWith('-text');
  const serializedPath = isText ? rawPath.slice(0, -5) : rawPath;
  if (serializedPath === 'root') return { isText, path: [], prefix };
  if (!/^\d+(?:-\d+)*$/.test(serializedPath)) return null;
  return {
    isText,
    path: serializedPath.split('-').map((part) => Number(part)),
    prefix,
  };
}

function formatSourceNodeIdFromPath(prefix: string, path: number[], isText = false): string {
  const serializedPath = path.length > 0 ? path.join('-') : 'root';
  return `${prefix}${serializedPath}${isText ? '-text' : ''}`;
}

function pathsAreEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}
