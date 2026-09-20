import type { EditableTreeNode } from '@domain/document/editableTree';

type EditableTreeChildCollection = 'children' | 'sourcePreviewChildren';

type EditableTreeChildEntry = {
  collection: EditableTreeChildCollection;
  index: number;
  node: EditableTreeNode;
  parent: EditableTreeNode;
};

export function simulatePreviewTreeMove({
  nodeIds,
  root,
  targetIndex,
  targetParentId,
}: {
  nodeIds: readonly string[];
  root: EditableTreeNode;
  targetIndex: number;
  targetParentId: string;
}): EditableTreeNode | null {
  const uniqueNodeIds = Array.from(new Set(nodeIds));
  if (uniqueNodeIds.length === 0 || uniqueNodeIds.includes(root.id)) return null;

  const sourceEntries = uniqueNodeIds
    .map((nodeId) => findEditableTreeChildEntry(root, nodeId))
    .filter((entry): entry is EditableTreeChildEntry => Boolean(entry));
  if (sourceEntries.length !== uniqueNodeIds.length) return null;

  const sourceParent = sourceEntries[0]!.parent;
  const sourceCollection = sourceEntries[0]!.collection;
  if (sourceEntries.some((entry) => (
    entry.parent.id !== sourceParent.id ||
    entry.collection !== sourceCollection
  ))) return null;

  const targetParent = findEditableTreeNodeForSimulation(root, targetParentId);
  if (!targetParent) return null;
  const movedNodeIds = new Set(sourceEntries.map((entry) => entry.node.id));
  if (sourceEntries.some((entry) => containsEditableTreeNode(entry.node, targetParentId))) return null;

  const orderedEntries = [...sourceEntries].sort((left, right) => left.index - right.index);
  const movedNodes = orderedEntries.map((entry) => entry.node);
  const sourceIndexes = new Set(orderedEntries.map((entry) => entry.index));
  const sameParent = sourceParent.id === targetParent.id;
  const targetCollection: EditableTreeChildCollection = sameParent ? sourceCollection : 'children';
  const targetChildren = targetParent[targetCollection] ?? [];
  const clampedTargetIndex = Math.max(0, Math.min(targetIndex, targetChildren.length));
  const adjustedTargetIndex = sameParent
    ? clampedTargetIndex - orderedEntries.filter((entry) => entry.index < clampedTargetIndex).length
    : clampedTargetIndex;

  const rewrite = (node: EditableTreeNode): EditableTreeNode => {
    let children = node.children;
    let sourcePreviewChildren = node.sourcePreviewChildren;

    if (node.id === sourceParent.id) {
      const sourceChildren = node[sourceCollection] ?? [];
      const remainingSourceChildren = sourceChildren.filter((_child, index) => !sourceIndexes.has(index));
      if (sourceCollection === 'children') children = remainingSourceChildren;
      else sourcePreviewChildren = remainingSourceChildren;
    }

    if (node.id === targetParent.id) {
      const currentTargetChildren = sameParent
        ? (sourceCollection === 'children' ? children : sourcePreviewChildren) ?? []
        : node[targetCollection] ?? [];
      const nextTargetChildren = [...currentTargetChildren];
      nextTargetChildren.splice(
        Math.max(0, Math.min(adjustedTargetIndex, nextTargetChildren.length)),
        0,
        ...movedNodes,
      );
      if (targetCollection === 'children') children = nextTargetChildren;
      else sourcePreviewChildren = nextTargetChildren;
    }

    const nextChildren = children?.map((child) => (
      movedNodeIds.has(child.id) ? child : rewrite(child)
    ));
    const nextSourcePreviewChildren = sourcePreviewChildren?.map((child) => (
      movedNodeIds.has(child.id) ? child : rewrite(child)
    ));
    if (
      nextChildren === node.children &&
      nextSourcePreviewChildren === node.sourcePreviewChildren
    ) return node;
    return {
      ...node,
      ...(nextChildren ? { children: nextChildren } : {}),
      ...(nextSourcePreviewChildren ? { sourcePreviewChildren: nextSourcePreviewChildren } : {}),
    };
  };

  return rewrite(root);
}

function findEditableTreeChildEntry(
  parent: EditableTreeNode,
  nodeId: string,
): EditableTreeChildEntry | null {
  for (const collection of ['children', 'sourcePreviewChildren'] as const) {
    const children = parent[collection] ?? [];
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index]!;
      if (child.id === nodeId) {
        return { collection, index, node: child, parent };
      }
      const nested = findEditableTreeChildEntry(child, nodeId);
      if (nested) return nested;
    }
  }
  return null;
}

function findEditableTreeNodeForSimulation(
  node: EditableTreeNode,
  nodeId: string,
): EditableTreeNode | null {
  if (node.id === nodeId) return node;
  for (const child of node.children ?? []) {
    const match = findEditableTreeNodeForSimulation(child, nodeId);
    if (match) return match;
  }
  for (const child of node.sourcePreviewChildren ?? []) {
    const match = findEditableTreeNodeForSimulation(child, nodeId);
    if (match) return match;
  }
  return null;
}

function containsEditableTreeNode(node: EditableTreeNode, nodeId: string): boolean {
  return Boolean(findEditableTreeNodeForSimulation(node, nodeId));
}
