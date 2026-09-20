import type {
  CommitEditInput,
  HistoryController,
  WorkbenchEditTransaction,
} from '@domain/history/historyController';
import type {
  WorkbenchDerivedCachePolicy,
  WorkbenchDerivedCacheSource,
  WorkbenchEditIdentityEffect,
  WorkbenchEditIntent,
  WorkbenchEditOperationDescriptor,
  WorkbenchEditOperationInput,
  WorkbenchProjectionInvalidation,
} from './editOperationTypes';

export type EditOperationPipelineInput<TState> = {
  history: HistoryController<TState>;
  input: CommitEditInput<TState>;
  nextValue: TState;
  operation: WorkbenchEditOperationInput;
  equalsState?: (left: TState, right: TState) => boolean;
};

export type EditOperationPipelineResult<TState> = {
  changed: boolean;
  transaction: WorkbenchEditTransaction<TState> | null;
  operation: WorkbenchEditOperationDescriptor;
  cache: WorkbenchDerivedCachePolicy;
};

export function commitEditOperation<TState>({
  history,
  input,
  nextValue,
  operation,
  equalsState,
}: EditOperationPipelineInput<TState>): EditOperationPipelineResult<TState> {
  const currentValue = history.getSnapshot().value;
  const descriptor = normalizeEditOperationDescriptor(operation);

  if (equalsState ? equalsState(nextValue, currentValue) : Object.is(nextValue, currentValue)) {
    return {
      changed: false,
      transaction: null,
      operation: descriptor,
      cache: descriptor.cache,
    };
  }

  const transaction = history.commit(nextValue, {
    ...input,
    operation: descriptor,
  });

  return {
    changed: Boolean(transaction),
    transaction,
    operation: descriptor,
    cache: descriptor.cache,
  };
}

export function normalizeEditOperationDescriptor(
  operation: WorkbenchEditOperationInput,
): WorkbenchEditOperationDescriptor {
  return {
    ...operation,
    identityEffect: operation.identityEffect ?? inferIdentityEffect(operation.intent),
    persistence: operation.persistence ?? {
      boundary: 'none',
      affectedFiles: [],
    },
    projection: operation.projection ?? createDefaultProjectionInvalidation(operation.intent),
    cache: operation.cache ?? createDefaultDerivedCachePolicy(operation.intent),
  };
}

export function createRevisionScopedDerivedCachePolicy(
  source: WorkbenchDerivedCacheSource,
  reason: string,
  keys?: string[],
): WorkbenchDerivedCachePolicy {
  return {
    strategy: 'revision-scoped',
    source,
    keys,
    reason,
  };
}

export function isRevisionScopedDerivedCacheFresh(
  policy: WorkbenchDerivedCachePolicy,
  source: WorkbenchDerivedCacheSource,
): boolean {
  return (
    policy.strategy === 'revision-scoped' &&
    policy.source.ownerKey === source.ownerKey &&
    policy.source.sourceKey === source.sourceKey &&
    policy.source.revision === source.revision
  );
}

export function createDerivedCacheKey(source: WorkbenchDerivedCacheSource, key: string): string {
  return `${source.ownerKey}:${source.sourceKey}@${String(source.revision)}:${key}`;
}

function inferIdentityEffect(intent: WorkbenchEditIntent): WorkbenchEditIdentityEffect {
  if (intent === 'create' || intent === 'paste' || intent === 'import' || intent === 're-import') return 'create';
  if (intent === 'duplicate') return 'clone';
  if (intent === 'move' || intent === 'reorder' || intent === 'cut') return 'move';
  if (intent === 'delete') return 'delete';
  if (intent === 'restore') return 'restore';
  if (intent === 'copy' || intent === 'save-flush' || intent === 'navigation-flush') return 'none';
  return 'preserve';
}

function createDefaultProjectionInvalidation(intent: WorkbenchEditIntent): WorkbenchProjectionInvalidation {
  if (intent === 'copy') {
    return {
      invalidates: ['none'],
      reason: 'Copy creates a transfer payload without changing canonical state.',
    };
  }

  if (intent === 'save-flush' || intent === 'navigation-flush') {
    return {
      invalidates: ['persistence', 'history'],
      reason: 'Flush pushes the current working value across a persistence boundary.',
    };
  }

  return {
    invalidates: ['selection', 'preview', 'renderer'],
    reason: 'Canonical editor state changed.',
  };
}

function createDefaultDerivedCachePolicy(intent: WorkbenchEditIntent): WorkbenchDerivedCachePolicy {
  if (intent === 'copy') {
    return {
      strategy: 'no-cache',
      reason: 'Copy must not promote clipboard payloads into canonical or reusable derived state.',
    };
  }

  return {
    strategy: 'discard-derived',
    reason: 'Derived caches are disposable after canonical edit operations.',
  };
}
