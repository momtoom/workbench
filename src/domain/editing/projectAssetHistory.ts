import { getHistoryLaneId, type EditOwner, type HistoryLaneId } from '@domain/history/historyController';
import type {
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
} from '@domain/project/workbenchProject';
import type { WorkbenchEditOperationInput } from './editOperationTypes';
import { createWorkbenchFlushOperation, type WorkbenchFlushTrigger } from './editFlushOperations';

export type ProjectAssetHistorySubject =
  | {
      kind: 'page';
      id: string;
      name: string;
      sourceFile: string;
      status: 'draft' | 'ready';
    }
  | {
      kind: 'component';
      id: string;
      name: string;
      sourceFile: string;
      componentSetId?: string;
    };

export type ProjectAssetHistoryState = {
  id: string;
  kind: ProjectAssetHistorySubject['kind'];
  name: string;
  sourceFile: string;
  sourceRevision: string;
};

export function getProjectAssetHistorySubjects(
  pages: WorkbenchPageRegistry,
  components: WorkbenchComponentRegistry,
): ProjectAssetHistorySubject[] {
  return [
    ...pages.pages.map((page) => ({
      kind: 'page' as const,
      id: page.id,
      name: page.name,
      sourceFile: page.sourceFile,
      status: page.status,
    })),
    ...components.components.map((component) => ({
      kind: 'component' as const,
      id: component.id,
      name: component.name,
      sourceFile: component.sourceFile,
      componentSetId: component.componentSetId,
    })),
  ];
}

export function createProjectAssetEditOwner(subject: ProjectAssetHistorySubject): EditOwner {
  return subject.kind === 'page'
    ? { type: 'page', filePath: subject.sourceFile }
    : { type: 'component', filePath: subject.sourceFile };
}

export function getProjectAssetHistoryLaneId(subject: ProjectAssetHistorySubject): HistoryLaneId {
  return getHistoryLaneId(createProjectAssetEditOwner(subject));
}

export function createProjectAssetHistoryState(
  subject: ProjectAssetHistorySubject,
  sourceRevision = 'unloaded',
): ProjectAssetHistoryState {
  return {
    id: subject.id,
    kind: subject.kind,
    name: subject.name,
    sourceFile: subject.sourceFile,
    sourceRevision,
  };
}

export function createProjectAssetFlushOperation(
  subject: ProjectAssetHistorySubject,
  trigger: WorkbenchFlushTrigger,
): WorkbenchEditOperationInput {
  return createWorkbenchFlushOperation({
    affectedFiles: [subject.sourceFile],
    target: {
      kind: subject.kind,
      id: subject.id,
      path: [subject.sourceFile],
    },
    trigger,
  });
}
