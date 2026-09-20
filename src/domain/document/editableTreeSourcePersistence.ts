import {
  createPersistedHistoryLane,
  upsertPersistedHistoryLane,
  type WorkbenchHistoryFile,
} from '@domain/history/historyPersistence';
import type { HistoryController, HistoryLaneId } from '@domain/history/historyController';
import type { HistoryTimelineEntry } from '@domain/history/historyRegistry';
import {
  createProjectAssetEditOwner,
  getProjectAssetHistoryLaneId,
  type ProjectAssetHistorySubject,
} from '@domain/editing/projectAssetHistory';
import type { WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';
import {
  createSourceFileSaveFlushPlan,
  markSourceFileSaveFlushed,
  type SourceFileSaveFlushPlan,
} from './editableTreeSourceSession';

export type SourceFilePersistenceAdapters = {
  beforeSourceWrite?: (plan: SourceFileSaveFlushPlan) => Promise<{ ok: true } | { ok: false; diagnostic: string }>;
  /**
   * Offers the just-saved contents as a save point. The adapter owns the cached
   * per-lane file and the write; `shouldCaptureSavePoint` owns whether this one
   * is worth keeping. Fire-and-forget: a failed save point must never fail the
   * edit that produced it.
   */
  captureSavePoint?: (input: SourceFileSavePointCandidate) => void;
  scheduleHistorySave?: (path: string, history: WorkbenchHistoryFile) => void;
  saveHistory: (path: string, history: WorkbenchHistoryFile) => Promise<void>;
  writeSourceFile: (path: string, contents: string, options?: { normalize?: boolean; overwrite?: boolean }) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export type SourceFileSavePointCandidate = {
  contents: string;
  laneId: HistoryLaneId;
  sourceFile: string;
  trigger: WorkbenchFlushTrigger;
};

export type PersistSourceFileHistoryLaneInput = {
  adapters: SourceFilePersistenceAdapters;
  history: HistoryController<string>;
  historyFile: WorkbenchHistoryFile;
  historyPath: string;
  maxEntries: number;
  subject: ProjectAssetHistorySubject;
  timeline: HistoryTimelineEntry[];
  trigger: WorkbenchFlushTrigger;
};

export type PersistSourceFileHistoryLaneResult =
  | {
      ok: true;
      alreadySaved: boolean;
      historyFile: WorkbenchHistoryFile;
      plan: SourceFileSaveFlushPlan;
    }
  | {
      ok: false;
      diagnostic: string;
      historyFile: WorkbenchHistoryFile;
      plan: SourceFileSaveFlushPlan;
    };

export async function persistSourceFileHistoryLane({
  adapters,
  history,
  historyFile,
  historyPath,
  maxEntries,
  subject,
  timeline,
  trigger,
}: PersistSourceFileHistoryLaneInput): Promise<PersistSourceFileHistoryLaneResult> {
  const plan = createSourceFileSaveFlushPlan(history, subject, trigger);

  if (!plan.alreadySaved) {
    const beforeWriteResult = await adapters.beforeSourceWrite?.(plan);
    if (beforeWriteResult && !beforeWriteResult.ok) {
      return {
        ok: false,
        diagnostic: beforeWriteResult.diagnostic,
        historyFile,
        plan,
      };
    }

    const writeResult = await adapters.writeSourceFile(subject.sourceFile, plan.contents, {
      normalize: false,
      overwrite: true,
    });
    if (!writeResult.ok) {
      return {
        ok: false,
        diagnostic: writeResult.message,
        historyFile,
        plan,
      };
    }
  }

  markSourceFileSaveFlushed(history, plan);
  // Only a flush that actually wrote is a save boundary worth remembering.
  if (!plan.alreadySaved) {
    adapters.captureSavePoint?.({
      contents: plan.contents,
      laneId: getProjectAssetHistoryLaneId(subject),
      sourceFile: subject.sourceFile,
      trigger,
    });
  }
  const nextHistoryFile = upsertPersistedHistoryLane(
    historyFile,
    createPersistedHistoryLane(
      createProjectAssetEditOwner(subject),
      history.getSnapshot(),
      maxEntries,
      plan.extensions,
      'session-only',
    ),
    timeline,
  );

  try {
    if (adapters.scheduleHistorySave) {
      adapters.scheduleHistorySave(historyPath, nextHistoryFile);
    } else {
      await adapters.saveHistory(historyPath, nextHistoryFile);
    }
  } catch (error) {
    return {
      ok: false,
      diagnostic: error instanceof Error ? error.message : 'Source history save failed.',
      historyFile: nextHistoryFile,
      plan,
    };
  }

  return {
    ok: true,
    alreadySaved: plan.alreadySaved,
    historyFile: nextHistoryFile,
    plan,
  };
}
