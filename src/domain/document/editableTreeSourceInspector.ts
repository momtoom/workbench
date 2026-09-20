import type {
  HistoryController,
  WorkbenchEditTransaction,
  WorkbenchSelectionSnapshot,
} from '@domain/history/historyController';
import type { TokenReference } from '@domain/design-system/tokens/types';
import type { WorkbenchHistoryFile } from '@domain/history/historyPersistence';
import {
  createHistoryTimelineEntry,
  type HistoryTimelineEntry,
} from '@domain/history/historyRegistry';
import type { ProjectAssetHistorySubject } from '@domain/editing/projectAssetHistory';
import type { WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';
import type { EditableTreeNode } from './editableTree';
import type {
  SourceAttributeName,
  SourceComponentImportSpec,
  SourceComponentTypeFallbackProps,
  SourceComponentPropValue,
  SourceCopiedNodeItem,
  SourceElementTagName,
  SourceInsertChildIconDefault,
  SourceInsertChildTemplateId,
  SourceStructureAction,
  SourceStyleProperty,
  SourceTokenBindingField,
  SourceWrapNodeWrapper,
} from './editableTreeSourceWriteback';
import {
  commitSourceAttributeSessionEdit,
  commitSourceComponentInsertSessionEdit,
  commitSourceComponentPropSessionEdit,
  commitSourceComponentTypeSessionEdit,
  commitSourceElementTagNameSessionEdit,
  commitSourceExtractSelectedNodesToMapSessionEdit,
  commitSourceInsertChildSessionEdit,
  commitSourceMoveNodeSessionEdit,
  commitSourcePasteNodeSessionEdit,
  commitSourceStyleDeclarationSessionEdit,
  commitSourceStructureSessionEdit,
  commitSourceTextContentSessionEdit,
  commitSourceTextI18nBindingSessionEdit,
  commitSourceTokenBindingSessionEdit,
  commitSourceWrapNodeSessionEdit,
} from './editableTreeSourceSession';
import {
  persistSourceFileHistoryLane,
  type SourceFilePersistenceAdapters,
} from './editableTreeSourcePersistence';

export type SourceInspectorTokenBindingCommand = {
  adapters: SourceFilePersistenceAdapters;
  field: SourceTokenBindingField;
  history: HistoryController<string>;
  historyFile: WorkbenchHistoryFile;
  historyPath: string;
  maxEntries: number;
  node: EditableTreeNode;
  selectionAfter?: WorkbenchSelectionSnapshot;
  selectionBefore?: WorkbenchSelectionSnapshot;
  subject: ProjectAssetHistorySubject;
  timeline: HistoryTimelineEntry[];
  token: TokenReference | null;
  tokenStyleValue?: string | null;
  trigger?: WorkbenchFlushTrigger;
};

export type SourceInspectorAttributeCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  attributeName: SourceAttributeName;
  value: string | null;
};

export type SourceInspectorComponentPropCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  propName: string;
  sourceExpression?: string;
  value: SourceComponentPropValue;
  writebackKind?: 'component-prop' | 'referenced-array-expression' | 'referenced-array-prop';
};

export type SourceInspectorComponentTypeCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  allowedPropNames: string[];
  fallbackProps?: SourceComponentTypeFallbackProps;
  importSource: string;
  managedPropNames: string[];
  propOverrides?: SourceComponentTypeFallbackProps;
  targetComponentName: string;
};

export type SourceInspectorTextContentCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  text: string;
};

export type SourceInspectorTextI18nBindingCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  fallbackText: string | null;
  tokenName: string | null;
};

export type SourceInspectorTextI18nBindingResult = SourceInspectorTokenBindingResult;

export type SourceInspectorElementTagNameCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  tagName: SourceElementTagName;
};

export type SourceInspectorInsertChildCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  iconDefault?: SourceInsertChildIconDefault;
  targetIndex?: number;
  templateId: SourceInsertChildTemplateId;
};

export type SourceInspectorComponentInsertCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  additionalImports?: SourceComponentImportSpec[];
  componentName: string;
  importSource: string;
  jsxChildren?: string;
  jsxProps?: Record<string, string>;
  props: Record<string, boolean | number | string>;
  targetIndex?: number;
};

export type SourceInspectorStructureCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  action: SourceStructureAction;
};

export type SourceInspectorMoveNodeCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  onSessionCommitted?: (nextContents: string) => Promise<void> | void;
  targetIndex: number;
  targetParentNode: EditableTreeNode;
};

export type SourceInspectorPasteNodeCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  clipboardSourceFile?: string;
  imports?: SourceComponentImportSpec[];
  items: SourceCopiedNodeItem[];
  requiresSameSourceFile?: boolean;
  targetIndex?: number;
};

export type SourceInspectorWrapNodeCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token' | 'node'> & {
  nodes: EditableTreeNode[];
  wrapper: SourceWrapNodeWrapper;
};

export type SourceInspectorExtractSelectedNodesToMapCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token' | 'node'> & {
  nodes: EditableTreeNode[];
};

export type SourceInspectorStyleDeclarationCommand = Omit<SourceInspectorTokenBindingCommand, 'field' | 'token'> & {
  property: SourceStyleProperty;
  value: string | null;
};

export type SourceInspectorTokenBindingResult =
  | {
      ok: true;
      changed: boolean;
      diagnostic: string;
      historyFile: WorkbenchHistoryFile;
      nextContents: string;
      persisted: boolean;
      transaction: WorkbenchEditTransaction<string> | null;
    }
  | {
      ok: false;
      changed: boolean;
      diagnostic: string;
      historyFile: WorkbenchHistoryFile;
      nextContents: string;
      persisted: false;
      transaction: WorkbenchEditTransaction<string> | null;
    };

export type SourceInspectorAttributeResult = SourceInspectorTokenBindingResult;
export type SourceInspectorComponentInsertResult = SourceInspectorTokenBindingResult;
export type SourceInspectorComponentPropResult = SourceInspectorTokenBindingResult;
export type SourceInspectorComponentTypeResult = SourceInspectorTokenBindingResult;
export type SourceInspectorInsertChildResult = SourceInspectorTokenBindingResult;
export type SourceInspectorMoveNodeResult = SourceInspectorTokenBindingResult;
export type SourceInspectorPasteNodeResult = SourceInspectorTokenBindingResult;
export type SourceInspectorWrapNodeResult = SourceInspectorTokenBindingResult;
export type SourceInspectorExtractSelectedNodesToMapResult = SourceInspectorTokenBindingResult;
export type SourceInspectorStructureResult = SourceInspectorTokenBindingResult;
export type SourceInspectorElementTagNameResult = SourceInspectorTokenBindingResult;
export type SourceInspectorTextContentResult = SourceInspectorTokenBindingResult;
export type SourceInspectorStyleDeclarationResult = SourceInspectorTokenBindingResult;

export async function commitAndPersistSourceInspectorTokenBinding({
  adapters,
  field,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  token,
  tokenStyleValue,
  trigger = 'auto',
}: SourceInspectorTokenBindingCommand): Promise<SourceInspectorTokenBindingResult> {
  const committed = await commitSourceTokenBindingSessionEdit(history, {
    field,
    node,
    selectionAfter,
    selectionBefore,
    subject,
    token,
    tokenStyleValue,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorAttribute({
  adapters,
  attributeName,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  trigger = 'auto',
  value,
}: SourceInspectorAttributeCommand): Promise<SourceInspectorAttributeResult> {
  const committed = await commitSourceAttributeSessionEdit(history, {
    attributeName,
    node,
    selectionAfter,
    selectionBefore,
    subject,
    value,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorComponentProp({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  propName,
  selectionAfter,
  selectionBefore,
  sourceExpression,
  subject,
  timeline,
  trigger = 'auto',
  value,
  writebackKind,
}: SourceInspectorComponentPropCommand): Promise<SourceInspectorComponentPropResult> {
  const committed = await commitSourceComponentPropSessionEdit(history, {
    node,
    propName,
    selectionAfter,
    selectionBefore,
    sourceExpression,
    subject,
    value,
    writebackKind,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorComponentType({
  adapters,
  allowedPropNames,
  fallbackProps,
  history,
  historyFile,
  historyPath,
  importSource,
  managedPropNames,
  maxEntries,
  node,
  propOverrides,
  selectionAfter,
  selectionBefore,
  subject,
  targetComponentName,
  timeline,
  trigger = 'auto',
}: SourceInspectorComponentTypeCommand): Promise<SourceInspectorComponentTypeResult> {
  const committed = await commitSourceComponentTypeSessionEdit(history, {
    allowedPropNames,
    fallbackProps,
    importSource,
    managedPropNames,
    node,
    propOverrides,
    selectionAfter,
    selectionBefore,
    subject,
    targetComponentName,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorTextContent({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  text,
  timeline,
  trigger = 'auto',
}: SourceInspectorTextContentCommand): Promise<SourceInspectorTextContentResult> {
  const committed = await commitSourceTextContentSessionEdit(history, {
    node,
    selectionAfter,
    selectionBefore,
    subject,
    text,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorTextI18nBinding({
  adapters,
  fallbackText,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  tokenName,
  trigger = 'auto',
}: SourceInspectorTextI18nBindingCommand): Promise<SourceInspectorTextI18nBindingResult> {
  const committed = await commitSourceTextI18nBindingSessionEdit(history, {
    fallbackText,
    node,
    selectionAfter,
    selectionBefore,
    subject,
    tokenName,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorElementTagName({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  tagName,
  timeline,
  trigger = 'auto',
}: SourceInspectorElementTagNameCommand): Promise<SourceInspectorElementTagNameResult> {
  const committed = await commitSourceElementTagNameSessionEdit(history, {
    node,
    selectionAfter,
    selectionBefore,
    subject,
    tagName,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorInsertChild({
  adapters,
  history,
  historyFile,
  historyPath,
  iconDefault,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  targetIndex,
  templateId,
  timeline,
  trigger = 'auto',
}: SourceInspectorInsertChildCommand): Promise<SourceInspectorInsertChildResult> {
  const committed = await commitSourceInsertChildSessionEdit(history, {
    iconDefault,
    node,
    selectionAfter,
    selectionBefore,
    subject,
    targetIndex,
    templateId,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorComponentInsert({
  adapters,
  additionalImports,
  componentName,
  history,
  historyFile,
  historyPath,
  importSource,
  jsxChildren,
  jsxProps,
  maxEntries,
  node,
  props,
  selectionAfter,
  selectionBefore,
  subject,
  targetIndex,
  timeline,
  trigger = 'auto',
}: SourceInspectorComponentInsertCommand): Promise<SourceInspectorComponentInsertResult> {
  const committed = await commitSourceComponentInsertSessionEdit(history, {
    additionalImports,
    componentName,
    importSource,
    jsxChildren,
    jsxProps,
    node,
    props,
    selectionAfter,
    selectionBefore,
    subject,
    targetIndex,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorStructure({
  action,
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  trigger = 'auto',
}: SourceInspectorStructureCommand): Promise<SourceInspectorStructureResult> {
  const committed = await commitSourceStructureSessionEdit(history, {
    action,
    node,
    selectionAfter,
    selectionBefore,
    subject,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorPasteNode({
  adapters,
  clipboardSourceFile,
  history,
  historyFile,
  historyPath,
  imports,
  items,
  maxEntries,
  node,
  requiresSameSourceFile,
  selectionAfter,
  selectionBefore,
  subject,
  targetIndex,
  timeline,
  trigger = 'auto',
}: SourceInspectorPasteNodeCommand): Promise<SourceInspectorPasteNodeResult> {
  const committed = await commitSourcePasteNodeSessionEdit(history, {
    clipboardSourceFile,
    imports,
    items,
    node,
    requiresSameSourceFile,
    selectionAfter,
    selectionBefore,
    subject,
    targetIndex,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorWrapNode({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  nodes,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  trigger = 'auto',
  wrapper,
}: SourceInspectorWrapNodeCommand): Promise<SourceInspectorWrapNodeResult> {
  const committed = await commitSourceWrapNodeSessionEdit(history, {
    nodes,
    selectionAfter,
    selectionBefore,
    subject,
    wrapper,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorExtractSelectedNodesToMap({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  nodes,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  trigger = 'auto',
}: SourceInspectorExtractSelectedNodesToMapCommand): Promise<SourceInspectorExtractSelectedNodesToMapResult> {
  const committed = await commitSourceExtractSelectedNodesToMapSessionEdit(history, {
    nodes,
    selectionAfter,
    selectionBefore,
    subject,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

export async function commitAndPersistSourceInspectorMoveNode({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  onSessionCommitted,
  selectionAfter,
  selectionBefore,
  subject,
  targetIndex,
  targetParentNode,
  timeline,
  trigger = 'auto',
}: SourceInspectorMoveNodeCommand): Promise<SourceInspectorMoveNodeResult> {
  const committed = await commitSourceMoveNodeSessionEdit(history, {
    node,
    selectionAfter,
    selectionBefore,
    subject,
    targetIndex,
    targetParentNode,
  });

  const sessionCommitNotification = committed.ok && committed.changed
    ? Promise.resolve(onSessionCommitted?.(committed.nextContents))
    : Promise.resolve();
  const persistence = persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
  const [result] = await Promise.all([persistence, sessionCommitNotification]);
  return result;
}

export async function commitAndPersistSourceInspectorStyleDeclaration({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  node,
  property,
  selectionAfter,
  selectionBefore,
  subject,
  timeline,
  trigger = 'auto',
  value,
}: SourceInspectorStyleDeclarationCommand): Promise<SourceInspectorStyleDeclarationResult> {
  const committed = await commitSourceStyleDeclarationSessionEdit(history, {
    node,
    property,
    selectionAfter,
    selectionBefore,
    subject,
    value,
  });

  return persistCommittedSourceInspectorEdit({
    adapters,
    committed,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline,
    trigger,
  });
}

async function persistCommittedSourceInspectorEdit({
  adapters,
  committed,
  history,
  historyFile,
  historyPath,
  maxEntries,
  subject,
  timeline,
  trigger,
}: {
  adapters: SourceFilePersistenceAdapters;
  committed: Awaited<ReturnType<typeof commitSourceTokenBindingSessionEdit>>;
  history: HistoryController<string>;
  historyFile: WorkbenchHistoryFile;
  historyPath: string;
  maxEntries: number;
  subject: ProjectAssetHistorySubject;
  timeline: HistoryTimelineEntry[];
  trigger: WorkbenchFlushTrigger;
}): Promise<SourceInspectorTokenBindingResult> {
  if (!committed.ok) {
    return {
      ok: false,
      changed: false,
      diagnostic: committed.diagnostic,
      historyFile,
      nextContents: committed.nextContents,
      persisted: false,
      transaction: null,
    };
  }

  if (!committed.changed) {
    return {
      ok: true,
      changed: false,
      diagnostic: committed.diagnostic,
      historyFile,
      nextContents: committed.nextContents,
      persisted: false,
      transaction: committed.transaction,
    };
  }

  const nextTimeline = committed.transaction
    ? appendTimelineEntry(timeline, committed.transaction)
    : timeline;
  const persisted = await persistSourceFileHistoryLane({
    adapters,
    history,
    historyFile,
    historyPath,
    maxEntries,
    subject,
    timeline: nextTimeline,
    trigger,
  });

  if (!persisted.ok) {
    return {
      ok: false,
      changed: true,
      diagnostic: persisted.diagnostic,
      historyFile: persisted.historyFile,
      nextContents: history.getSnapshot().value,
      persisted: false,
      transaction: committed.transaction,
    };
  }

  return {
    ok: true,
    changed: true,
    diagnostic: committed.diagnostic,
    historyFile: persisted.historyFile,
    nextContents: history.getSnapshot().value,
    persisted: true,
    transaction: committed.transaction,
  };
}

function appendTimelineEntry(
  timeline: HistoryTimelineEntry[],
  transaction: WorkbenchEditTransaction<string>,
): HistoryTimelineEntry[] {
  return [...timeline, createHistoryTimelineEntry(transaction)].slice(-1000);
}
