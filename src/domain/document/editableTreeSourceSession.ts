import { commitEditOperation } from '@domain/editing/editOperationPipeline';
import type { WorkbenchEditOperationInput } from '@domain/editing/editOperationTypes';
import type { TokenReference } from '@domain/design-system/tokens/types';
import { createFlushHistoryExtensions, type WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';
import {
  createHistoryChangeSummary,
  type WorkbenchEditChangeSummary,
} from '@domain/history/historyChangeSummary';
import {
  createProjectAssetEditOwner,
  createProjectAssetFlushOperation,
  getProjectAssetHistoryLaneId,
  type ProjectAssetHistorySubject,
} from '@domain/editing/projectAssetHistory';
import type {
  HistoryController,
  WorkbenchEditKind,
  WorkbenchEditScope,
  WorkbenchEditTransaction,
  WorkbenchSelectionSnapshot,
} from '@domain/history/historyController';
import type { WorkbenchComponentRegistry, WorkbenchPageRegistry } from '@domain/project/workbenchProject';
import type { EditableTreeNode, EditableTreeSourcePropArray } from './editableTree';
import {
  applySourceAttributeWriteback,
  applySourceComponentInsertWriteback,
  applySourceComponentPropWriteback,
  applySourceComponentTypeWriteback,
  applySourceElementTagNameWriteback,
  applySourceExtractSelectedNodesToMapWriteback,
  applySourceInsertChildWriteback,
  applySourceMoveNodeWriteback,
  applySourcePasteNodeWriteback,
  applySourceReferencedArrayExpressionWriteback,
  applySourceReferencedArrayPropWriteback,
  applySourceStyleDeclarationWriteback,
  applySourceStructureWriteback,
  applySourceTextContentWriteback,
  applySourceTextI18nBindingWriteback,
  applySourceTokenBindingWriteback,
  applySourceWrapNodeWriteback,
  type SourceCopiedNodeItem,
  type SourceAttributeName,
  type SourceComponentImportSpec,
  type SourceComponentTypeFallbackProps,
  type SourceComponentPropValue,
  type SourceElementTagName,
  type SourceInsertChildIconDefault,
  type SourceInsertChildTemplateId,
  type SourceStyleProperty,
  type SourceStructureAction,
  type SourceTokenBindingField,
  type SourceWrapNodeWrapper,
} from './editableTreeSourceWriteback';

export type SourceTokenBindingSessionCommand = {
  field: SourceTokenBindingField;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  token: TokenReference | null;
  tokenStyleValue?: string | null;
};

export type SourceAttributeSessionCommand = {
  attributeName: SourceAttributeName;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  value: string | null;
};

export type SourceComponentPropSessionCommand = {
  node: EditableTreeNode;
  propName: string;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  sourceExpression?: string;
  subject: ProjectAssetHistorySubject;
  value: SourceComponentPropValue;
  writebackKind?: 'component-prop' | 'referenced-array-expression' | 'referenced-array-prop';
};

export type SourceComponentTypeSessionCommand = {
  allowedPropNames: string[];
  fallbackProps?: SourceComponentTypeFallbackProps;
  importSource: string;
  managedPropNames: string[];
  node: EditableTreeNode;
  propOverrides?: SourceComponentTypeFallbackProps;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  targetComponentName: string;
};

export type SourceTextContentSessionCommand = {
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  text: string;
};

function isEditableTreeSourcePropArray(value: SourceComponentPropValue): value is EditableTreeSourcePropArray {
  return Array.isArray(value) && value.every((item) => (
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.values(item).every((itemValue) => typeof itemValue === 'string' || typeof itemValue === 'number' || typeof itemValue === 'boolean')
  ));
}

export type SourceTextI18nBindingSessionCommand = {
  fallbackText: string | null;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  tokenName: string | null;
};

export type SourceTextI18nBindingSessionResult = SourceTokenBindingSessionResult;

export type SourceElementTagNameSessionCommand = {
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  tagName: SourceElementTagName;
};

export type SourceInsertChildSessionCommand = {
  iconDefault?: SourceInsertChildIconDefault;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  targetIndex?: number;
  templateId: SourceInsertChildTemplateId;
};

export type SourceComponentInsertSessionCommand = {
  additionalImports?: SourceComponentImportSpec[];
  componentName: string;
  importSource: string;
  jsxChildren?: string;
  jsxProps?: Record<string, string>;
  node: EditableTreeNode;
  props: Record<string, boolean | number | string>;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  targetIndex?: number;
};

export type SourceStructureSessionCommand = {
  action: SourceStructureAction;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
};

export type SourceMoveNodeSessionCommand = {
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  targetIndex: number;
  targetParentNode: EditableTreeNode;
};

export type SourcePasteNodeSessionCommand = {
  clipboardSourceFile?: string;
  imports?: SourceComponentImportSpec[];
  items: SourceCopiedNodeItem[];
  node: EditableTreeNode;
  requiresSameSourceFile?: boolean;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  targetIndex?: number;
};

export type SourceWrapNodeSessionCommand = {
  nodes: EditableTreeNode[];
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  wrapper: SourceWrapNodeWrapper;
};

export type SourceExtractSelectedNodesToMapSessionCommand = {
  nodes: EditableTreeNode[];
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
};

export type SourceStyleDeclarationSessionCommand = {
  node: EditableTreeNode;
  property: SourceStyleProperty;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  value: string | null;
};

export type SourceTokenBindingSessionResult =
  | {
      ok: true;
      changed: boolean;
      diagnostic: string;
      nextContents: string;
      transaction: WorkbenchEditTransaction<string> | null;
    }
  | {
      ok: false;
      diagnostic: string;
      nextContents: string;
    };

export type SourceAttributeSessionResult = SourceTokenBindingSessionResult;
export type SourceComponentInsertSessionResult = SourceTokenBindingSessionResult;
export type SourceComponentPropSessionResult = SourceTokenBindingSessionResult;
export type SourceComponentTypeSessionResult = SourceTokenBindingSessionResult;
export type SourceInsertChildSessionResult = SourceTokenBindingSessionResult;
export type SourceMoveNodeSessionResult = SourceTokenBindingSessionResult;
export type SourcePasteNodeSessionResult = SourceTokenBindingSessionResult;
export type SourceWrapNodeSessionResult = SourceTokenBindingSessionResult;
export type SourceExtractSelectedNodesToMapSessionResult = SourceTokenBindingSessionResult;
export type SourceStructureSessionResult = SourceTokenBindingSessionResult;
export type SourceElementTagNameSessionResult = SourceTokenBindingSessionResult;
export type SourceTextContentSessionResult = SourceTokenBindingSessionResult;
export type SourceStyleDeclarationSessionResult = SourceTokenBindingSessionResult;

export type SourceFileSaveFlushPlan = {
  alreadySaved: boolean;
  contents: string;
  extensions: ReturnType<typeof createFlushHistoryExtensions>;
  savedRevision: number;
  subject: ProjectAssetHistorySubject;
};

export type SourceFileSaveFlushResult = SourceFileSaveFlushPlan;

export function resolveProjectAssetSubjectForSourceFile(
  pages: WorkbenchPageRegistry,
  components: WorkbenchComponentRegistry,
  sourceFile: string,
): ProjectAssetHistorySubject | null {
  const page = pages.pages.find((candidate) => candidate.sourceFile === sourceFile);
  if (page) {
    return {
      kind: 'page',
      id: page.id,
      name: page.name,
      sourceFile: page.sourceFile,
      status: page.status,
    };
  }

  const component = components.components.find((candidate) => candidate.sourceFile === sourceFile);
  if (component) {
    return {
      kind: 'component',
      id: component.id,
      name: component.name,
      sourceFile: component.sourceFile,
      componentSetId: component.componentSetId,
    };
  }

  return null;
}

export async function commitSourceTokenBindingSessionEdit(
  history: HistoryController<string>,
  command: SourceTokenBindingSessionCommand,
): Promise<SourceTokenBindingSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceTokenBindingWriteback({
    contents: currentContents,
    field: command.field,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    token: command.token,
    tokenStyleValue: command.tokenStyleValue,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  const laneId = getProjectAssetHistoryLaneId(command.subject);
  const owner = createProjectAssetEditOwner(command.subject);
  const pipelineResult = commitEditOperation({
    history,
    nextValue: writeback.nextContents,
    input: {
      laneId,
      owner,
      label: command.token
        ? `Set ${formatSourceTokenBindingField(command.field)} source token`
        : `Clear ${formatSourceTokenBindingField(command.field)} source token`,
      scope: command.subject.kind as WorkbenchEditScope,
      kind: 'patch',
      affectedFiles: [command.subject.sourceFile],
      selectionBefore: command.selectionBefore,
      selectionAfter: command.selectionAfter,
      mergeKey: createSourceEditMergeKey(command, `token-binding:${command.field}:${command.token ? 'set' : 'clear'}`),
      // `tokenBindings` holds resolved names while the command carries a
      // reference, so the comparable pair is the reference on both sides.
      changes: [
        createHistoryChangeSummary(
          command.field,
          formatTokenReferenceForSummary(command.node.tokenBindingReferences?.[command.field]),
          formatTokenReferenceForSummary(command.token),
        ),
      ],
    },
    operation: writeback.operation,
    equalsState: areSourceContentsEqual,
  });

  return {
    ok: true,
    changed: pipelineResult.changed,
    diagnostic: writeback.diagnostic,
    nextContents: history.getSnapshot().value,
    transaction: pipelineResult.transaction,
  };
}

export async function commitSourceAttributeSessionEdit(
  history: HistoryController<string>,
  command: SourceAttributeSessionCommand,
): Promise<SourceAttributeSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceAttributeWriteback({
    attributeName: command.attributeName,
    contents: currentContents,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    value: command.value,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    label: command.value
      ? `Set ${command.attributeName} source attribute`
      : `Clear ${command.attributeName} source attribute`,
    mergeKey: createSourceEditMergeKey(command, `attribute:${command.attributeName}:${command.value ? 'set' : 'clear'}`),
    changes: [
      createHistoryChangeSummary(
        command.attributeName,
        command.node.sourceAttributes?.[command.attributeName],
        command.value,
      ),
    ],
    writeback,
  });
}

export async function commitSourceComponentPropSessionEdit(
  history: HistoryController<string>,
  command: SourceComponentPropSessionCommand,
): Promise<SourceComponentPropSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = command.writebackKind === 'referenced-array-expression'
    ? await applySourceReferencedArrayExpressionWriteback({
        contents: currentContents,
        node: command.node,
        sourceExpression: command.sourceExpression ?? command.propName,
        sourceFile: command.subject.sourceFile,
        value: isEditableTreeSourcePropArray(command.value) ? command.value : [],
      })
    : command.writebackKind === 'referenced-array-prop'
      ? await applySourceReferencedArrayPropWriteback({
        contents: currentContents,
        node: command.node,
        propName: command.propName,
        sourceFile: command.subject.sourceFile,
        value: isEditableTreeSourcePropArray(command.value) ? command.value : [],
      })
      : await applySourceComponentPropWriteback({
          contents: currentContents,
          node: command.node,
          propName: command.propName,
          sourceFile: command.subject.sourceFile,
          value: command.value,
        });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    label: `Set ${command.propName} component prop`,
    mergeKey: createSourceEditMergeKey(command, `component-prop:${command.propName}`),
    changes: [
      createHistoryChangeSummary(
        command.propName,
        command.node.sourceProps?.[command.propName],
        command.value,
      ),
    ],
    writeback,
  });
}

export async function commitSourceComponentTypeSessionEdit(
  history: HistoryController<string>,
  command: SourceComponentTypeSessionCommand,
): Promise<SourceComponentTypeSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceComponentTypeWriteback({
    allowedPropNames: command.allowedPropNames,
    contents: currentContents,
    fallbackProps: command.fallbackProps,
    importSource: command.importSource,
    managedPropNames: command.managedPropNames,
    node: command.node,
    propOverrides: command.propOverrides,
    sourceFile: command.subject.sourceFile,
    targetComponentName: command.targetComponentName,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'structural',
    label: `Convert to ${command.targetComponentName}`,
    writeback,
  });
}

export async function commitSourceTextContentSessionEdit(
  history: HistoryController<string>,
  command: SourceTextContentSessionCommand,
): Promise<SourceTextContentSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceTextContentWriteback({
    contents: currentContents,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    text: command.text,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    label: 'Set source text content',
    mergeKey: createSourceEditMergeKey(command, 'text-content'),
    changes: [createHistoryChangeSummary('text', command.node.textContent, command.text)],
    writeback,
  });
}

export async function commitSourceTextI18nBindingSessionEdit(
  history: HistoryController<string>,
  command: SourceTextI18nBindingSessionCommand,
): Promise<SourceTextI18nBindingSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceTextI18nBindingWriteback({
    contents: currentContents,
    fallbackText: command.fallbackText,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    tokenName: command.tokenName,
  });

  if (!writeback.ok) {
    return { ok: false, diagnostic: writeback.diagnostic, nextContents: currentContents };
  }

  return commitSourceWriteback(history, command, {
    label: command.tokenName ? `Bind text to ${command.tokenName}` : 'Unbind text from token',
    mergeKey: createSourceEditMergeKey(command, 'text-i18n-binding'),
    writeback,
  });
}

export async function commitSourceElementTagNameSessionEdit(
  history: HistoryController<string>,
  command: SourceElementTagNameSessionCommand,
): Promise<SourceElementTagNameSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceElementTagNameWriteback({
    contents: currentContents,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    tagName: command.tagName,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    label: `Set heading level ${command.tagName.toUpperCase()}`,
    writeback,
  });
}

export async function commitSourceInsertChildSessionEdit(
  history: HistoryController<string>,
  command: SourceInsertChildSessionCommand,
): Promise<SourceInsertChildSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceInsertChildWriteback({
    contents: currentContents,
    iconDefault: command.iconDefault,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    targetIndex: command.targetIndex,
    templateId: command.templateId,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'create',
    label: `Insert ${command.templateId} source child`,
    writeback,
  });
}

export async function commitSourceComponentInsertSessionEdit(
  history: HistoryController<string>,
  command: SourceComponentInsertSessionCommand,
): Promise<SourceComponentInsertSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceComponentInsertWriteback({
    additionalImports: command.additionalImports,
    componentName: command.componentName,
    contents: currentContents,
    importSource: command.importSource,
    jsxChildren: command.jsxChildren,
    jsxProps: command.jsxProps,
    node: command.node,
    props: command.props,
    sourceFile: command.subject.sourceFile,
    targetIndex: command.targetIndex,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'create',
    label: `Insert ${command.componentName} component`,
    writeback,
  });
}

export async function commitSourceStructureSessionEdit(
  history: HistoryController<string>,
  command: SourceStructureSessionCommand,
): Promise<SourceStructureSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceStructureWriteback({
    action: command.action,
    contents: currentContents,
    node: command.node,
    sourceFile: command.subject.sourceFile,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: getSourceStructureHistoryKind(command.action),
    label: `${formatSourceStructureAction(command.action)} source node`,
    writeback,
  });
}

export async function commitSourcePasteNodeSessionEdit(
  history: HistoryController<string>,
  command: SourcePasteNodeSessionCommand,
): Promise<SourcePasteNodeSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourcePasteNodeWriteback({
    clipboardSourceFile: command.clipboardSourceFile,
    contents: currentContents,
    imports: command.imports,
    items: command.items,
    node: command.node,
    requiresSameSourceFile: command.requiresSameSourceFile,
    sourceFile: command.subject.sourceFile,
    targetIndex: command.targetIndex,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'create',
    label: `Paste ${command.items.length === 1 ? command.items[0]?.label ?? 'source node' : `${command.items.length} source nodes`}`,
    writeback,
  });
}

export async function commitSourceWrapNodeSessionEdit(
  history: HistoryController<string>,
  command: SourceWrapNodeSessionCommand,
): Promise<SourceWrapNodeSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceWrapNodeWriteback({
    contents: currentContents,
    nodes: command.nodes,
    sourceFile: command.subject.sourceFile,
    wrapper: command.wrapper,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'structural',
    label: `Wrap ${command.nodes.length === 1 ? command.nodes[0]?.label ?? 'source node' : `${command.nodes.length} source nodes`}`,
    writeback,
  });
}

export async function commitSourceExtractSelectedNodesToMapSessionEdit(
  history: HistoryController<string>,
  command: SourceExtractSelectedNodesToMapSessionCommand,
): Promise<SourceExtractSelectedNodesToMapSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceExtractSelectedNodesToMapWriteback({
    contents: currentContents,
    nodes: command.nodes,
    sourceFile: command.subject.sourceFile,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'structural',
    label: `Create source map from ${command.nodes.length} layers`,
    writeback,
  });
}

export async function commitSourceMoveNodeSessionEdit(
  history: HistoryController<string>,
  command: SourceMoveNodeSessionCommand,
): Promise<SourceMoveNodeSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceMoveNodeWriteback({
    contents: currentContents,
    node: command.node,
    sourceFile: command.subject.sourceFile,
    targetIndex: command.targetIndex,
    targetParentNode: command.targetParentNode,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    kind: 'move',
    label: 'Move source node',
    writeback,
  });
}

export async function commitSourceStyleDeclarationSessionEdit(
  history: HistoryController<string>,
  command: SourceStyleDeclarationSessionCommand,
): Promise<SourceStyleDeclarationSessionResult> {
  const currentContents = history.getSnapshot().value;
  const writeback = await applySourceStyleDeclarationWriteback({
    contents: currentContents,
    node: command.node,
    property: command.property,
    sourceFile: command.subject.sourceFile,
    value: command.value,
  });

  if (!writeback.ok) {
    return {
      ok: false,
      diagnostic: writeback.diagnostic,
      nextContents: currentContents,
    };
  }

  return commitSourceWriteback(history, command, {
    label: command.value
      ? `Set ${command.property} source style`
      : `Clear ${command.property} source style`,
    mergeKey: createSourceEditMergeKey(command, `style:${command.property}:${command.value ? 'set' : 'clear'}`),
    changes: [
      createHistoryChangeSummary(
        command.property,
        command.node.sourceStyleDeclarations?.[command.property],
        command.value,
      ),
    ],
    writeback,
  });
}

function commitSourceWriteback(
  history: HistoryController<string>,
  command: {
    selectionAfter?: WorkbenchSelectionSnapshot;
    selectionBefore?: WorkbenchSelectionSnapshot;
    subject: ProjectAssetHistorySubject;
  },
  {
    changes,
    kind = 'patch',
    label,
    mergeKey,
    writeback,
  }: {
    changes?: WorkbenchEditChangeSummary[];
    kind?: WorkbenchEditKind;
    label: string;
    mergeKey?: string;
    writeback: {
      changed: boolean;
      diagnostic: string;
      nextContents: string;
      operation: WorkbenchEditOperationInput;
    };
  },
): SourceTokenBindingSessionResult {
  const laneId = getProjectAssetHistoryLaneId(command.subject);
  const owner = createProjectAssetEditOwner(command.subject);
  const pipelineResult = commitEditOperation({
    history,
    nextValue: writeback.nextContents,
    input: {
      laneId,
      owner,
      label,
      scope: command.subject.kind as WorkbenchEditScope,
      kind,
      affectedFiles: [command.subject.sourceFile],
      selectionBefore: command.selectionBefore,
      selectionAfter: command.selectionAfter,
      mergeKey,
      changes,
    },
    operation: writeback.operation,
    equalsState: areSourceContentsEqual,
  });

  return {
    ok: true,
    changed: pipelineResult.changed,
    diagnostic: writeback.diagnostic,
    nextContents: history.getSnapshot().value,
    transaction: pipelineResult.transaction,
  };
}

function createSourceEditMergeKey(
  command: {
    node: EditableTreeNode;
    subject: ProjectAssetHistorySubject;
  },
  field: string,
): string {
  return `source:${command.subject.sourceFile}:${command.node.id}:${field}`;
}

/**
 * Restores a save point's contents into the lane as an ordinary undoable edit.
 *
 * Deliberately not a bypass: `kind: 'restore'` goes through the same commit
 * path as every other source change, so Ctrl+Z backs out of a restore, the
 * timeline records it, and the file is written by the normal persist path. A
 * restore that reinstates the current contents commits nothing.
 */
export function commitSourceSavePointRestore(
  history: HistoryController<string>,
  command: {
    savePoint: { contents: string; savedAt: string };
    selectionAfter?: WorkbenchSelectionSnapshot;
    selectionBefore?: WorkbenchSelectionSnapshot;
    subject: ProjectAssetHistorySubject;
  },
): SourceTokenBindingSessionResult {
  const currentContents = history.getSnapshot().value;
  const laneId = getProjectAssetHistoryLaneId(command.subject);
  const pipelineResult = commitEditOperation({
    history,
    nextValue: command.savePoint.contents,
    input: {
      laneId,
      owner: createProjectAssetEditOwner(command.subject),
      label: `Restore save point from ${command.savePoint.savedAt}`,
      scope: command.subject.kind as WorkbenchEditScope,
      kind: 'restore',
      affectedFiles: [command.subject.sourceFile],
      selectionBefore: command.selectionBefore,
      selectionAfter: command.selectionAfter,
      changes: [
        createHistoryChangeSummary('source', `${currentContents.length} chars`, `${command.savePoint.contents.length} chars`),
      ],
    },
    operation: {
      intent: 'restore',
      target: {
        kind: command.subject.kind,
        id: command.subject.id,
        path: [command.subject.sourceFile],
      },
      identityEffect: 'restore',
      provenance: { restoredFrom: command.savePoint.savedAt },
      persistence: { boundary: 'autosave', affectedFiles: [command.subject.sourceFile] },
      projection: {
        invalidates: ['persistence', 'history', 'preview', 'selection'],
        reason: 'A save point replaces the whole source file, so every derived view is stale.',
      },
      cache: {
        strategy: 'discard-derived',
        reason: 'The restored contents share no parse with what was on screen.',
      },
    },
    equalsState: areSourceContentsEqual,
  });

  return {
    ok: true,
    changed: pipelineResult.changed,
    diagnostic: pipelineResult.changed
      ? 'Save point restored.'
      : 'Save point matches the current source.',
    nextContents: history.getSnapshot().value,
    transaction: pipelineResult.transaction,
  };
}

export function createSourceFileSaveFlushResult(
  history: HistoryController<string>,
  subject: ProjectAssetHistorySubject,
  trigger: WorkbenchFlushTrigger,
): SourceFileSaveFlushResult {
  const plan = createSourceFileSaveFlushPlan(history, subject, trigger);
  markSourceFileSaveFlushed(history, plan);
  return plan;
}

export function createSourceFileSaveFlushPlan(
  history: HistoryController<string>,
  subject: ProjectAssetHistorySubject,
  trigger: WorkbenchFlushTrigger,
): SourceFileSaveFlushPlan {
  const snapshot = history.getSnapshot();
  const revisionToSave = snapshot.workingRevision;
  const operation = createProjectAssetFlushOperation(subject, trigger);

  return {
    alreadySaved: !snapshot.isDirty,
    contents: snapshot.value,
    extensions: createFlushHistoryExtensions(operation, trigger),
    savedRevision: revisionToSave,
    subject,
  };
}

export function markSourceFileSaveFlushed(
  history: HistoryController<string>,
  plan: SourceFileSaveFlushPlan,
) {
  history.markSaved(plan.savedRevision, plan.contents);
}

function formatTokenReferenceForSummary(token: TokenReference | null | undefined): string | null {
  return token ? `${token.collectionId}/${token.tokenId}` : null;
}

function formatSourceTokenBindingField(field: SourceTokenBindingField): string {
  if (field === 'background') return 'Background';
  if (field === 'radius') return 'Radius';
  return 'Spacing';
}

function formatSourceStructureAction(action: SourceStructureAction): string {
  if (action === 'delete') return 'Delete';
  if (action === 'duplicate') return 'Duplicate';
  if (action === 'move-up') return 'Move up';
  return 'Move down';
}

function getSourceStructureHistoryKind(action: SourceStructureAction): WorkbenchEditKind {
  if (action === 'delete') return 'delete';
  if (action === 'duplicate') return 'duplicate';
  return 'reorder';
}

function areSourceContentsEqual(left: string, right: string): boolean {
  return left === right;
}
