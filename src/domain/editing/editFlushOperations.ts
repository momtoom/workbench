import { normalizeEditOperationDescriptor } from './editOperationPipeline';
import type {
  WorkbenchEditOperationDescriptor,
  WorkbenchEditOperationInput,
  WorkbenchEditTarget,
  WorkbenchEditPersistencePlan,
} from './editOperationTypes';

export type WorkbenchFlushTrigger = 'manual' | 'auto' | 'beforeunload' | 'navigation';

export type WorkbenchFlushOperationOptions = {
  affectedFiles: string[];
  reason?: string;
  target: WorkbenchEditTarget;
  trigger: WorkbenchFlushTrigger;
};

export type WorkbenchFlushHistoryExtensions = {
  lastFlush: WorkbenchEditOperationDescriptor & {
    trigger: WorkbenchFlushTrigger;
  };
};

export function createWorkbenchFlushOperation({
  affectedFiles,
  reason,
  target,
  trigger,
}: WorkbenchFlushOperationOptions): WorkbenchEditOperationInput {
  const boundary = getPersistenceBoundary(trigger);
  return {
    intent: trigger === 'navigation' ? 'navigation-flush' : 'save-flush',
    target,
    identityEffect: 'none',
    persistence: {
      boundary,
      affectedFiles,
    },
    projection: {
      invalidates: ['persistence', 'history'],
      reason: reason ?? getDefaultFlushReason(trigger),
    },
    cache: {
      strategy: 'discard-derived',
      keys: ['persistence-boundary'],
      reason: 'Flush boundaries must not reuse stale derived state as saved truth.',
    },
  };
}

export function createFlushHistoryExtensions(
  operation: WorkbenchEditOperationInput,
  trigger: WorkbenchFlushTrigger,
): WorkbenchFlushHistoryExtensions {
  return {
    lastFlush: {
      ...normalizeEditOperationDescriptor(operation),
      trigger,
    },
  };
}

function getPersistenceBoundary(trigger: WorkbenchFlushTrigger): WorkbenchEditPersistencePlan['boundary'] {
  if (trigger === 'manual') return 'manual-save';
  if (trigger === 'navigation') return 'flush-before-navigation';
  if (trigger === 'beforeunload') return 'flush-before-unload';
  return 'autosave';
}

function getDefaultFlushReason(trigger: WorkbenchFlushTrigger): string {
  if (trigger === 'manual') return 'Manual save persisted the current working value.';
  if (trigger === 'navigation') return 'Navigation flushed the current working value before changing context.';
  if (trigger === 'beforeunload') return 'Before unload flushed the current working value.';
  return 'Autosave persisted the current working value.';
}
