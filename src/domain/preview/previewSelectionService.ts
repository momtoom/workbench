import {
  findEditableTreeNode,
  resolveEditableTreeSelectionBoundary,
  type EditableTreeNode,
} from '@domain/document/editableTree';

export type PreviewNodeSelectionMode = 'deep' | 'direct' | 'exact' | 'smart-deep';

export type PreviewNodeSelectionResolution = {
  drillPath: string[];
  selectedNodeId: string;
};

export type PreviewNodeDrillInResolution = PreviewNodeSelectionResolution & {
  drillTargetNodeId: string | null;
};

export function resolvePreviewNodeSelection({
  clickedNodeId,
  drillPath,
  mode,
  root,
}: {
  clickedNodeId: string;
  drillPath: string[];
  mode: PreviewNodeSelectionMode;
  root: EditableTreeNode | null;
  selectedNodeId?: string | null;
}): PreviewNodeSelectionResolution {
  const effectiveDrillPath = reconcilePreviewDrillPath(root, drillPath);
  const clickedBoundary = resolveEditableTreeSelectionBoundary(root, clickedNodeId);
  const selectableClickedNodeId = mode === 'direct' || mode === 'smart-deep' || mode === 'exact'
    ? clickedBoundary?.selectedNode.id ?? clickedNodeId
    : clickedBoundary?.selectableNode.id ?? clickedNodeId;
  const clickedPath = findSelectablePreviewNodePath(root, selectableClickedNodeId);

  if (mode === 'exact') {
    return {
      drillPath: effectiveDrillPath,
      selectedNodeId: selectableClickedNodeId,
    };
  }

  if (mode === 'smart-deep') {
    const selectedId = getPreviewSmartDeepSelectionId(clickedPath, effectiveDrillPath) ??
      selectableClickedNodeId;
    return {
      drillPath: getPreviewDrillPathForSelection(root, selectedId),
      selectedNodeId: selectedId,
    };
  }

  if (mode === 'deep') {
    const selectedId = clickedPath[clickedPath.length - 1]?.id ?? clickedNodeId;
    return {
      drillPath: getPreviewDrillPathForSelection(root, selectedId),
      selectedNodeId: selectedId,
    };
  }

  if (!root || clickedPath.length === 0) {
    return { drillPath: effectiveDrillPath, selectedNodeId: selectableClickedNodeId };
  }

  // Ordinary clicks stay at the current drill depth. The DOM hit only chooses
  // the branch under the pointer; double-click is the sole path that advances
  // one level deeper, while exact modifier selection remains independent.
  const nextSelectedNodeId = getPreviewDirectSelectionId(root, clickedPath, effectiveDrillPath);

  return {
    drillPath: getPreviewDrillPathForSelection(root, nextSelectedNodeId),
    selectedNodeId: nextSelectedNodeId,
  };
}

export function resolvePreviewNodeDrillIn({
  clickedNodeId,
  drillPath,
  root,
  selectedNodeId,
}: {
  clickedNodeId: string;
  drillPath: string[];
  root: EditableTreeNode | null;
  selectedNodeId?: string | null;
}): PreviewNodeDrillInResolution {
  const effectiveDrillPath = reconcilePreviewDrillPath(root, drillPath);
  const selectableClickedNodeId = resolveEditableTreeSelectionBoundary(root, clickedNodeId)?.selectableNode.id ?? clickedNodeId;
  const clickedPath = findSelectablePreviewNodePath(root, selectableClickedNodeId);
  if (!root || clickedPath.length === 0) {
    return {
      drillPath: effectiveDrillPath,
      selectedNodeId: selectableClickedNodeId,
      drillTargetNodeId: null,
    };
  }

  const drillBaseIndex = getPreviewDrillBaseIndex(clickedPath, selectedNodeId, effectiveDrillPath);
  const targetDepth = drillBaseIndex + 1;
  const target = clickedPath[targetDepth] ?? null;
  if (!target) {
    const fallbackSelectedNodeId = getSelectableNodeAtDepth(clickedPath, targetDepth - 1).id;
    return {
      drillPath: getPreviewDrillPathForSelection(root, fallbackSelectedNodeId),
      selectedNodeId: fallbackSelectedNodeId,
      drillTargetNodeId: null,
    };
  }

  return {
    drillPath: getPreviewDrillPathForSelection(root, target.id),
    selectedNodeId: target.id,
    drillTargetNodeId: target.id,
  };
}

export function reconcilePreviewDrillPath(root: EditableTreeNode | null, drillPath: string[]): string[] {
  const reconciled: string[] = [];
  let currentRoot = root;

  for (const nodeId of drillPath) {
    if (!currentRoot) break;
    const nextNode = findEditableTreeNode(currentRoot, nodeId);
    const drillNode = resolveTransparentWrapperNode(nextNode);
    if (!drillNode || !drillNode.children || drillNode.children.length === 0) break;
    reconciled.push(drillNode.id);
    currentRoot = drillNode;
  }

  return reconciled;
}

function getPreviewDirectSelectionId(
  root: EditableTreeNode,
  clickedPath: EditableTreeNode[],
  drillPath: string[],
): string {
  const drillRootId = drillPath[drillPath.length - 1] ?? null;
  const drillRootPath = drillRootId ? findSelectablePreviewNodePath(root, drillRootId) : [];
  const selectionScopePath = drillRootPath.length > 0
    ? drillRootPath
    : clickedPath.slice(0, 1);
  const targetDepth = getPreviewCommonPathLength(selectionScopePath, clickedPath);
  return getSelectableNodeAtDepth(clickedPath, targetDepth).id;
}

function getPreviewCommonPathLength(
  currentPath: EditableTreeNode[],
  clickedPath: EditableTreeNode[],
): number {
  const maxLength = Math.min(currentPath.length, clickedPath.length);
  let commonLength = 0;

  while (commonLength < maxLength && currentPath[commonLength]?.id === clickedPath[commonLength]?.id) {
    commonLength += 1;
  }

  return commonLength;
}

function getPreviewDrillBaseIndex(
  clickedPath: EditableTreeNode[],
  selectedNodeId: string | null | undefined,
  drillPath: string[],
): number {
  const selectedNodeIndex = selectedNodeId
    ? clickedPath.findIndex((node) => node.id === selectedNodeId)
    : -1;
  if (selectedNodeIndex >= 0) return selectedNodeIndex;

  for (let index = drillPath.length - 1; index >= 0; index -= 1) {
    const drillNodeIndex = clickedPath.findIndex((node) => node.id === drillPath[index]);
    if (drillNodeIndex >= 0) return drillNodeIndex;
  }

  return 0;
}

function getSelectableNodeAtDepth(path: EditableTreeNode[], depth: number): EditableTreeNode {
  return path[Math.min(Math.max(depth, 0), path.length - 1)] ?? path[0]!;
}

function getPreviewSmartDeepSelectionId(clickedPath: EditableTreeNode[], drillPath: string[]): string | null {
  if (clickedPath.length === 0) return null;
  if (clickedPath.length === 1) return clickedPath[0]!.id;

  // Command-click starts from the deepest node and climbs until the candidate itself has siblings.
  const drillRootId = drillPath[drillPath.length - 1] ?? null;
  const drillRootIndex = drillRootId
    ? clickedPath.findIndex((node) => node.id === drillRootId)
    : -1;
  const boundaryIndex = Math.max(drillRootIndex, 0);
  const deepestNode = clickedPath[clickedPath.length - 1] ?? null;
  let candidateIndex = clickedPath.length - 1;

  while (candidateIndex > boundaryIndex) {
    const candidateParent = clickedPath[candidateIndex - 1] ?? null;
    if (!candidateParent || getSelectablePreviewChildCount(candidateParent) >= 2) {
      return clickedPath[candidateIndex]!.id;
    }
    candidateIndex -= 1;
  }

  return deepestNode?.id ?? clickedPath[boundaryIndex]?.id ?? clickedPath[0]!.id;
}

function getSelectablePreviewChildCount(node: EditableTreeNode): number {
  const seen = new Set<string>();
  return [
    ...(node.children ?? []),
    ...(node.sourcePreviewChildren ?? []),
  ].reduce((count, child) => {
    if (seen.has(child.id)) return count;
    seen.add(child.id);
    return count + getSelectablePreviewChildNodes(child).length;
  }, 0);
}

function getSelectablePreviewChildNodes(node: EditableTreeNode): EditableTreeNode[] {
  if (!isTransparentPreviewWrapperNode(node)) return [node];
  return [
    ...(node.children ?? []),
    ...(node.sourcePreviewChildren ?? []),
  ].flatMap((child) => getSelectablePreviewChildNodes(child));
}

function resolveTransparentWrapperNode(node: EditableTreeNode | null): EditableTreeNode | null {
  let current = node;
  while (isTransparentPreviewWrapperNode(current)) {
    if (!current) return null;
    current = current.children?.[0] ?? null;
  }
  return current;
}

function isTransparentPreviewWrapperNode(node: EditableTreeNode | null | undefined): boolean {
  if (!node || node.inspectable === true || node.children?.length !== 1) return false;
  const jsxName = node.source?.jsxName?.toLowerCase() ?? '';
  return jsxName === 'fragment' ||
    jsxName === 'runtimestory' ||
    jsxName.includes('wrapper') ||
    node.label.toLowerCase().includes('wrapper');
}

function getPreviewDrillPathForSelection(root: EditableTreeNode | null, selectedNodeId: string | null): string[] {
  if (!selectedNodeId) return [];
  const selectedPath = findSelectablePreviewNodePath(root, selectedNodeId);
  if (selectedPath.length <= 2) return [];
  return selectedPath.slice(1, -1)
    .filter((node) => (node.children?.length ?? 0) > 0)
    .map((node) => node.id);
}

function findSelectablePreviewNodePath(root: EditableTreeNode | null, nodeId: string): EditableTreeNode[] {
  const rawPath = findEditableTreeNodePath(root, nodeId);
  if (rawPath.length === 0) return [];

  const selectablePath = rawPath.filter((node) => !isTransparentPreviewWrapperNode(node));
  const rawLeaf = rawPath[rawPath.length - 1] ?? null;
  if (isTransparentPreviewWrapperNode(rawLeaf)) {
    const descendantPath = findFirstSelectableDescendantPath(rawLeaf);
    selectablePath.push(...descendantPath);
  }

  return selectablePath;
}

function findFirstSelectableDescendantPath(node: EditableTreeNode): EditableTreeNode[] {
  const child = node.children?.[0] ?? null;
  if (!child) return [];
  if (isTransparentPreviewWrapperNode(child)) return findFirstSelectableDescendantPath(child);
  return [child];
}

function findEditableTreeNodePath(root: EditableTreeNode | null, nodeId: string): EditableTreeNode[] {
  if (!root) return [];
  if (root.id === nodeId) return [root];
  for (const child of root.children ?? []) {
    const childPath = findEditableTreeNodePath(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  for (const child of root.sourcePreviewChildren ?? []) {
    const childPath = findEditableTreeNodePath(child, nodeId);
    if (childPath.length > 0) return [root, ...childPath];
  }
  return [];
}
