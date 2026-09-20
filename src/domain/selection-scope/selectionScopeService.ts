import {
  type EditableTreeNode,
} from '@domain/document/editableTree';
import {
  resolveEditableTreeSourceCapabilities,
  type SourceNodeCapabilities,
  type SourceNodeOwnership,
} from './sourceNodeCapabilities';

export type SelectionScopeInput = {
  activeEntityId: string | null;
  selectedNodeId: string | null;
  hoveredNodeId?: string | null;
  instanceChain?: SelectionScopeInstance[];
};

export type SelectionScopeInstance = {
  instanceId: string;
  sourceComponentId: string;
};

export type EditableTreeSelectionScopeInput = {
  activeEntityId: string | null;
  hoveredNodeId?: string | null;
  root: EditableTreeNode | null;
  selectedNodeId: string | null;
};

export type SelectionSaveTarget =
  | { kind: 'none' }
  | { kind: 'asset'; assetId: string; entityId: string; nodeId: string }
  | { kind: 'source'; entityId: string; nodeId: string; sourceFile?: string }
  | { kind: 'instance'; entityId: string; instanceId: string; nodeId: string };

export type SelectionEditabilityReason =
  | 'asset'
  | 'instance-boundary'
  | 'no-selection'
  | 'no-source-file'
  | 'no-source-range'
  | 'read-only-data-source'
  | 'source'
  | 'source-preview-only';

export type SelectionEditabilityDiagnostic = {
  action: string;
  message: string;
  reason: SelectionEditabilityReason;
  title: string;
};

export type SelectionScope = {
  canEditAsset: boolean;
  canEditInstance: boolean;
  canEditSource: boolean;
  editabilityDiagnostic: SelectionEditabilityDiagnostic | null;
  effectiveRootId: string | null;
  hoveredNodeId: string | null;
  inspectableAssetId: string | null;
  instanceChain: SelectionScopeInstance[];
  ownerInstanceId: string | null;
  saveTarget: SelectionSaveTarget;
  selectedNode: EditableTreeNode | null;
  scopeNodeIds: string[];
  selectedNodeId: string | null;
  selectedNodePath: string[];
  sourceCapabilities: SourceNodeCapabilities;
  sourceFile: string | null;
  sourceOwnership: SourceNodeOwnership;
};

export function resolveSelectionScope(
  input: SelectionScopeInput | null,
): SelectionScope | null {
  if (!input) return null;

  const instanceChain = input.instanceChain ?? [];
  const ownerInstance = instanceChain[instanceChain.length - 1] ?? null;
  const selectedNodeId = input.selectedNodeId;
  const activeEntityId = input.activeEntityId;
  const canEditSource = Boolean(activeEntityId && selectedNodeId && !ownerInstance);
  const canEditInstance = Boolean(activeEntityId && selectedNodeId && ownerInstance);
  const canMutateSource = canEditSource;
  const sourceCapabilities: SourceNodeCapabilities = {
    canCopy: canEditSource,
    canCut: canMutateSource,
    canDelete: canMutateSource,
    canDuplicate: canMutateSource,
    canEditFields: canMutateSource,
    canEditStructure: canMutateSource,
    canInsertChildren: canMutateSource,
    canMove: canMutateSource,
    canPaste: canMutateSource,
  };

  return {
    canEditAsset: false,
    canEditInstance,
    canEditSource,
    editabilityDiagnostic: getSelectionEditabilityDiagnostic({
      canEditAsset: false,
      canEditInstance,
      canEditSource,
      ownerInstanceId: ownerInstance?.instanceId ?? null,
      selectedNode: null,
      selectedNodeId,
      sourceFile: null,
      sourcePreviewOnly: false,
    }),
    effectiveRootId: ownerInstance?.sourceComponentId ?? activeEntityId,
    hoveredNodeId: input.hoveredNodeId ?? null,
    inspectableAssetId: null,
    instanceChain,
    ownerInstanceId: ownerInstance?.instanceId ?? null,
    saveTarget: getSelectionSaveTarget(activeEntityId, selectedNodeId, ownerInstance),
    selectedNode: null,
    scopeNodeIds: selectedNodeId ? [selectedNodeId] : [],
    selectedNodeId,
    selectedNodePath: selectedNodeId ? [selectedNodeId] : [],
    sourceCapabilities,
    sourceFile: null,
    sourceOwnership: {
      kind: 'runtime-only',
      sourceFile: null,
    },
  };
}

export function resolveEditableTreeSelectionScope(
  input: EditableTreeSelectionScopeInput,
): SelectionScope {
  const sourceResolution = resolveEditableTreeSourceCapabilities(input);
  const selectedPath = sourceResolution.path;
  const selectedNode = sourceResolution.node;
  const sourcePreviewOnly = sourceResolution.sourcePreviewOnly;
  const readOnlyDataSourceNode = sourceResolution.readOnlyDataSourceNode;
  const instanceChain = sourceResolution.instanceChain;
  const ownerInstance = instanceChain[instanceChain.length - 1] ?? null;
  const sourceFile = selectedNode?.source?.sourceFile ?? null;
  const inspectableAssetId = selectedNode?.inspectable === true ? selectedNode.source?.assetId ?? null : null;
  const canEditSource = sourceResolution.capabilities.canEditFields;
  const canEditAsset = Boolean(input.activeEntityId && !sourcePreviewOnly && !readOnlyDataSourceNode && selectedNode?.inspectable === true && inspectableAssetId && !sourceFile && !ownerInstance);
  const canEditInstance = Boolean(input.activeEntityId && !sourcePreviewOnly && !readOnlyDataSourceNode && selectedNode && ownerInstance);

  return {
    canEditAsset,
    canEditInstance,
    canEditSource,
    editabilityDiagnostic: getSelectionEditabilityDiagnostic({
      canEditAsset,
      canEditInstance,
      canEditSource,
      ownerInstanceId: ownerInstance?.instanceId ?? null,
      selectedNode,
      selectedNodeId: input.selectedNodeId,
      readOnlyDataSourceNode,
      sourceFile,
      sourcePreviewOnly,
    }),
    effectiveRootId: ownerInstance?.sourceComponentId ?? input.root?.id ?? input.activeEntityId,
    hoveredNodeId: input.hoveredNodeId ?? null,
    inspectableAssetId,
    instanceChain,
    ownerInstanceId: ownerInstance?.instanceId ?? null,
    saveTarget: getEditableTreeSaveTarget({
      activeEntityId: input.activeEntityId,
      canEditAsset,
      canEditInstance,
      canEditSource,
      inspectableAssetId,
      ownerInstance,
      selectedNodeId: selectedNode?.id ?? null,
      sourceFile,
    }),
    selectedNode,
    selectedNodeId: selectedNode?.id ?? null,
    selectedNodePath: selectedPath.map((node) => node.id),
    scopeNodeIds: selectedPath.map((node) => node.id),
    sourceCapabilities: sourceResolution.capabilities,
    sourceFile,
    sourceOwnership: sourceResolution.ownership,
  };
}

function getSelectionSaveTarget(
  activeEntityId: string | null,
  selectedNodeId: string | null,
  ownerInstance: SelectionScopeInstance | null,
): SelectionSaveTarget {
  if (!activeEntityId || !selectedNodeId) return { kind: 'none' };
  if (ownerInstance) {
    return {
      kind: 'instance',
      entityId: activeEntityId,
      instanceId: ownerInstance.instanceId,
      nodeId: selectedNodeId,
    };
  }
  return {
    kind: 'source',
    entityId: activeEntityId,
    nodeId: selectedNodeId,
  };
}

function getEditableTreeSaveTarget({
  activeEntityId,
  canEditAsset,
  canEditInstance,
  canEditSource,
  inspectableAssetId,
  ownerInstance,
  selectedNodeId,
  sourceFile,
}: {
  activeEntityId: string | null;
  canEditAsset: boolean;
  canEditInstance: boolean;
  canEditSource: boolean;
  inspectableAssetId: string | null;
  ownerInstance: SelectionScopeInstance | null;
  selectedNodeId: string | null;
  sourceFile: string | null;
}): SelectionSaveTarget {
  if (!activeEntityId || !selectedNodeId) return { kind: 'none' };
  if (canEditSource) {
    return {
      kind: 'source',
      entityId: activeEntityId,
      nodeId: selectedNodeId,
      sourceFile: sourceFile ?? undefined,
    };
  }
  if (canEditAsset && inspectableAssetId) {
    return {
      kind: 'asset',
      assetId: inspectableAssetId,
      entityId: activeEntityId,
      nodeId: selectedNodeId,
    };
  }
  if (canEditInstance && ownerInstance) {
    return {
      kind: 'instance',
      entityId: activeEntityId,
      instanceId: ownerInstance.instanceId,
      nodeId: selectedNodeId,
    };
  }
  return { kind: 'none' };
}

function getSelectionEditabilityDiagnostic({
  canEditAsset,
  canEditInstance,
  canEditSource,
  ownerInstanceId,
  readOnlyDataSourceNode,
  selectedNode,
  selectedNodeId,
  sourceFile,
  sourcePreviewOnly,
}: {
  canEditAsset: boolean;
  canEditInstance: boolean;
  canEditSource: boolean;
  ownerInstanceId: string | null;
  readOnlyDataSourceNode?: EditableTreeNode | null;
  selectedNode: EditableTreeNode | null;
  selectedNodeId: string | null;
  sourceFile: string | null;
  sourcePreviewOnly: boolean;
}): SelectionEditabilityDiagnostic | null {
  if (!selectedNodeId) {
    return {
      action: 'Select a layer in the canvas or layer tree before editing.',
      message: 'No design layer is selected.',
      reason: 'no-selection',
      title: 'No selection',
    };
  }

  if (sourcePreviewOnly) {
    return {
      action: 'Edit the owning component instance, wrapper props, token, data/CSV prop, or source component instead.',
      message: 'This layer is preview-only content projected from a local component boundary. Workbench can show and select it, but it should not write through this child DOM path.',
      reason: 'source-preview-only',
      title: 'Preview-only selection',
    };
  }

  if (readOnlyDataSourceNode?.sourceMapBinding) {
    return {
      action: 'This is a supported boundary. Inspect its source in Binding; expose a safe array writer only when designers must edit individual rows.',
      message: `${readOnlyDataSourceNode.sourceMapBinding.source.label} renders source-managed rows. Workbench keeps the repeated result selectable and visible without replacing its runtime/computed data source.`,
      reason: 'read-only-data-source',
      title: 'Source-managed collection',
    };
  }

  if (ownerInstanceId) {
    return {
      action: 'Edit exposed instance props, open the source component, or add a wrapper-level control for the value you need to change.',
      message: 'This layer is inside a component instance. Workbench is preserving the component source/usage boundary instead of writing directly into expanded instance DOM.',
      reason: 'instance-boundary',
      title: 'Instance boundary',
    };
  }

  if (canEditSource || canEditAsset || canEditInstance) return null;

  if (!sourceFile) {
    return {
      action: 'Select a source-backed parent, edit the wrapper component props, or move the editable structure into project TSX source.',
      message: 'This layer does not resolve to a project source file. It may come from runtime output, dependency DOM, an asset preview, or generated preview structure.',
      reason: 'no-source-file',
      title: 'No source-backed edit path',
    };
  }

  if (!selectedNode?.sourceLocation) {
    return {
      action: 'Edit a parent source-backed layer, the connected data source, or the original TSX file where this expression is defined.',
      message: 'This layer has a source file, but Workbench does not have a safe JSX range for direct Inspector writeback.',
      reason: 'no-source-range',
      title: 'No editable source range',
    };
  }

  return {
    action: 'Use the Binding tab or edit the owning source, data, token, or wrapper component contract.',
    message: 'Workbench can inspect this layer, but no safe source edit path is available for the current selection.',
    reason: 'no-source-range',
    title: 'Read-only selection',
  };
}
