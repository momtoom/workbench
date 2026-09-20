export type WorkbenchEditIntent =
  | 'create'
  | 'write'
  | 'patch'
  | 'delete'
  | 'restore'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'duplicate'
  | 'move'
  | 'reorder'
  | 'import'
  | 're-import'
  | 'save-flush'
  | 'navigation-flush';

export type WorkbenchEditIdentityEffect =
  | 'none'
  | 'preserve'
  | 'create'
  | 'clone'
  | 'move'
  | 'detach'
  | 'tombstone'
  | 'delete'
  | 'restore';

export type WorkbenchProjectionTarget =
  | 'none'
  | 'selection'
  | 'preview'
  | 'renderer'
  | 'token-css'
  | 'token-query'
  | 'token-usage'
  | 'history'
  | 'persistence';

export type WorkbenchEditTargetRef = {
  id?: string | null;
  collectionId?: string | null;
  groupId?: string | null;
  modeId?: string | null;
  tokenId?: string | null;
  nodeId?: string | null;
  instanceId?: string | null;
};

export type WorkbenchEditTarget = {
  kind: string;
  id?: string;
  field?: string;
  path?: string[];
  collectionId?: string;
  groupId?: string | null;
  modeId?: string;
  tokenId?: string;
  nodeId?: string;
  instanceId?: string;
  refs?: WorkbenchEditTargetRef[];
};

export type WorkbenchEditProvenance = {
  importedFrom?: string;
  clonedFrom?: WorkbenchEditTarget;
  pastedFrom?: string;
  restoredFrom?: string;
  sourceOperationId?: string;
};

export type WorkbenchEditPersistencePlan = {
  boundary: 'none' | 'autosave' | 'manual-save' | 'flush-before-navigation' | 'flush-before-unload';
  affectedFiles: string[];
};

export type WorkbenchProjectionInvalidation = {
  invalidates: WorkbenchProjectionTarget[];
  reason: string;
};

export type WorkbenchEditCleanupPlan = {
  refs?: boolean;
  bindings?: boolean;
  fieldScopes?: boolean;
  instanceOverrides?: boolean;
  imports?: boolean;
  notes?: string[];
};

export type WorkbenchDerivedCacheSource = {
  ownerKey: string;
  sourceKey: string;
  revision: string | number;
};

export type WorkbenchDerivedCachePolicy =
  | {
      strategy: 'no-cache';
      reason: string;
    }
  | {
      strategy: 'discard-derived';
      keys?: string[];
      reason: string;
    }
  | {
      strategy: 'revision-scoped';
      source: WorkbenchDerivedCacheSource;
      keys?: string[];
      reason: string;
    };

export type WorkbenchEditOperationInput = {
  intent: WorkbenchEditIntent;
  target: WorkbenchEditTarget;
  identityEffect?: WorkbenchEditIdentityEffect;
  provenance?: WorkbenchEditProvenance;
  persistence?: WorkbenchEditPersistencePlan;
  projection?: WorkbenchProjectionInvalidation;
  cleanup?: WorkbenchEditCleanupPlan;
  cache?: WorkbenchDerivedCachePolicy;
};

export type WorkbenchEditOperationDescriptor = {
  intent: WorkbenchEditIntent;
  target: WorkbenchEditTarget;
  identityEffect: WorkbenchEditIdentityEffect;
  provenance?: WorkbenchEditProvenance;
  persistence: WorkbenchEditPersistencePlan;
  projection: WorkbenchProjectionInvalidation;
  cleanup?: WorkbenchEditCleanupPlan;
  cache: WorkbenchDerivedCachePolicy;
};
