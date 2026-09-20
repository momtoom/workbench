import type { EditableTreeNode } from '@domain/document/editableTree';

export type SourceNodeOwnershipKind =
  | 'authored'
  | 'component-implementation'
  | 'forwarded-slot-child'
  | 'runtime-only';

export type SourceNodeOwnership = {
  kind: SourceNodeOwnershipKind;
  sourceFile: string | null;
};

export type SourceNodeCapabilities = {
  canCopy: boolean;
  canCut: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canEditFields: boolean;
  canEditStructure: boolean;
  canInsertChildren: boolean;
  canMove: boolean;
  canPaste: boolean;
};

export type SourceNodeInstanceBoundary = {
  instanceId: string;
  sourceComponentId: string;
};

export type SourceNodeCapabilityResolution = {
  capabilities: SourceNodeCapabilities;
  instanceChain: SourceNodeInstanceBoundary[];
  node: EditableTreeNode | null;
  ownerInstanceId: string | null;
  ownership: SourceNodeOwnership;
  path: EditableTreeNode[];
  readOnlyDataSourceNode: EditableTreeNode | null;
  sourcePreviewOnly: boolean;
};

export function resolveEditableTreeSourceCapabilities({
  activeEntityId,
  root,
  selectedNodeId,
}: {
  activeEntityId: string | null;
  root: EditableTreeNode | null;
  selectedNodeId: string | null;
}): SourceNodeCapabilityResolution {
  const lookup = findSourceNodeCapabilityPath(root, selectedNodeId);
  const node = lookup.path[lookup.path.length - 1] ?? null;
  const ownerInstance = lookup.instanceChain[lookup.instanceChain.length - 1] ?? null;
  const readOnlyDataSourceNode = findReadOnlyDataSourceNode(lookup.path);
  const sourceFile = node?.source?.sourceFile ?? null;
  const hasSourceRange = Boolean(sourceFile && node?.sourceLocation);
  const ownership = resolveSourceNodeOwnership({
    forwardedSlotBoundary: lookup.forwardedSlotBoundary,
    hasSourceRange,
    ownerInstanceId: ownerInstance?.instanceId ?? null,
    sourceFile,
    sourcePreviewOnly: lookup.sourcePreviewOnly,
  });
  const ownsEditableSource = ownership.kind === 'authored' || ownership.kind === 'forwarded-slot-child';
  const canCopy = Boolean(hasSourceRange && ownsEditableSource);
  const canMutateSource = Boolean(
    activeEntityId &&
    canCopy &&
    !readOnlyDataSourceNode,
  );
  const insideSourceMapBoundary = lookup.path.some((candidate) => Boolean(candidate.sourceMapBinding));

  return {
    capabilities: {
      canCopy,
      canCut: canMutateSource,
      canDelete: canMutateSource,
      canDuplicate: canMutateSource,
      canEditFields: canMutateSource,
      canEditStructure: canMutateSource,
      canInsertChildren: canMutateSource && !insideSourceMapBoundary,
      canMove: canMutateSource,
      canPaste: canMutateSource,
    },
    instanceChain: lookup.instanceChain,
    node,
    ownerInstanceId: ownerInstance?.instanceId ?? null,
    ownership,
    path: lookup.path,
    readOnlyDataSourceNode,
    sourcePreviewOnly: lookup.sourcePreviewOnly,
  };
}

type SourceNodeCapabilityPathLookup = {
  forwardedSlotBoundary: boolean;
  instanceChain: SourceNodeInstanceBoundary[];
  path: EditableTreeNode[];
  sourcePreviewOnly: boolean;
};

function findSourceNodeCapabilityPath(
  root: EditableTreeNode | null,
  selectedNodeId: string | null,
): SourceNodeCapabilityPathLookup {
  if (!root || !selectedNodeId) {
    return {
      forwardedSlotBoundary: false,
      instanceChain: [],
      path: [],
      sourcePreviewOnly: false,
    };
  }

  function visit(
    node: EditableTreeNode,
    path: EditableTreeNode[],
    sourcePreviewOnly: boolean,
    instanceChain: SourceNodeInstanceBoundary[],
    forwardedSlotBoundary: boolean,
  ): SourceNodeCapabilityPathLookup | null {
    const nextPath = [...path, node];
    if (node.id === selectedNodeId) {
      return {
        forwardedSlotBoundary,
        instanceChain,
        path: nextPath,
        sourcePreviewOnly,
      };
    }

    const descendantInstanceChain = isInstanceBoundaryNode(node)
      ? [...instanceChain, {
          instanceId: node.id,
          sourceComponentId: node.source?.assetId ?? node.source?.jsxName ?? node.label,
        }]
      : instanceChain;

    for (const child of node.children ?? []) {
      const forwardedSourceChild = child.sourcePreviewOrigin === 'forwarded-source-child';
      const match = visit(
        child,
        nextPath,
        getSourcePreviewChildOnlyState({
          child,
          parentSourcePreviewOnly: sourcePreviewOnly,
          sourcePreviewChild: false,
        }),
        forwardedSourceChild ? [] : descendantInstanceChain,
        forwardedSlotBoundary || forwardedSourceChild,
      );
      if (match) return match;
    }

    for (const child of node.sourcePreviewChildren ?? []) {
      const forwardedSourceChild = child.sourcePreviewOrigin === 'forwarded-source-child';
      const match = visit(
        child,
        nextPath,
        getSourcePreviewChildOnlyState({
          child,
          parentSourcePreviewOnly: sourcePreviewOnly,
          sourcePreviewChild: true,
        }),
        forwardedSourceChild ? [] : descendantInstanceChain,
        forwardedSlotBoundary || forwardedSourceChild,
      );
      if (match) return match;
    }

    return null;
  }

  return visit(root, [], false, [], false) ?? {
    forwardedSlotBoundary: false,
    instanceChain: [],
    path: [],
    sourcePreviewOnly: false,
  };
}

function resolveSourceNodeOwnership({
  forwardedSlotBoundary,
  hasSourceRange,
  ownerInstanceId,
  sourceFile,
  sourcePreviewOnly,
}: {
  forwardedSlotBoundary: boolean;
  hasSourceRange: boolean;
  ownerInstanceId: string | null;
  sourceFile: string | null;
  sourcePreviewOnly: boolean;
}): SourceNodeOwnership {
  if (!hasSourceRange || !sourceFile) {
    return {
      kind: 'runtime-only',
      sourceFile,
    };
  }
  if (sourcePreviewOnly || ownerInstanceId) {
    return {
      kind: 'component-implementation',
      sourceFile,
    };
  }
  return {
    kind: forwardedSlotBoundary ? 'forwarded-slot-child' : 'authored',
    sourceFile,
  };
}

function findReadOnlyDataSourceNode(path: EditableTreeNode[]): EditableTreeNode | null {
  return [...path].reverse().find((node) => (
    node.sourceMapBinding && !node.sourceMapBinding.source.writable
  )) ?? null;
}

function isInstanceBoundaryNode(node: EditableTreeNode): boolean {
  return node.kind === 'component-instance' && !node.source?.sourceFile;
}

function getSourcePreviewChildOnlyState({
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
