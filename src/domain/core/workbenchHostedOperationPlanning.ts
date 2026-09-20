import type { TokenRegistry } from '@domain/design-system/tokens/types';
import type { WorkbenchFlushTrigger } from '@domain/editing/editFlushOperations';
import type { ProjectAssetHistorySubject } from '@domain/editing/projectAssetHistory';
import type {
  WorkbenchAssetRegistry,
  WorkbenchCommentRegistry,
  WorkbenchComponentRegistry,
  WorkbenchPageRegistry,
} from '@domain/project/workbenchProject';
import { getWorkbenchHostStatus } from '@domain/project/workbenchHostTransport';
import {
  createWorkbenchCoreClient,
  type WorkbenchCoreOperationPlan,
  type WorkbenchCoreProjectSummary,
} from './workbenchCoreClient';

const MAX_HOSTED_SOURCE_WRITE_PLAN_BYTES = 900 * 1024;

export type WorkbenchCoreProjectSummaryInput = {
  assets: WorkbenchAssetRegistry;
  comments: WorkbenchCommentRegistry;
  components: WorkbenchComponentRegistry;
  configPath: string;
  pages: WorkbenchPageRegistry;
  projectId: string;
  projectName: string;
  tokens: TokenRegistry;
};

export type HostedSourceWritePlanRequest = {
  contents: string;
  label?: string;
  project: WorkbenchCoreProjectSummary;
  subject: ProjectAssetHistorySubject;
  trigger: WorkbenchFlushTrigger;
};

export type HostedSourceWritePlanResult =
  | {
      ok: true;
      diagnostic: string;
      mode: 'local-fallback' | 'remote' | 'remote-unavailable';
      plan?: WorkbenchCoreOperationPlan;
    }
  | {
      ok: false;
      diagnostic: string;
      mode: 'local-fallback' | 'remote' | 'remote-unavailable';
    };

export function createWorkbenchCoreProjectSummaryFromRegistries({
  assets,
  comments,
  components,
  configPath,
  pages,
  projectId,
  projectName,
  tokens,
}: WorkbenchCoreProjectSummaryInput): WorkbenchCoreProjectSummary {
  const hostStatus = getWorkbenchHostStatus();
  return {
    projectId,
    projectName,
    storageKind: hostStatus.kind === 'local-bridge' ? 'local-folder' : 'same-origin',
    configPath,
    counts: {
      assets: assets.assets.length,
      comments: comments.comments.length,
      components: components.components.length,
      pages: pages.pages.length,
      tokenCollections: tokens.collections.length,
      tokens: tokens.collections.reduce((total, collection) => total + collection.tokens.length, 0),
    },
  };
}

export async function planHostedSourceWrite({
  contents,
  label,
  project,
  subject,
  trigger,
}: HostedSourceWritePlanRequest): Promise<HostedSourceWritePlanResult> {
  const requireRemotePlan = isRemoteSourceWritePlanRequired();
  const client = createWorkbenchCoreClient();
  if (client.mode !== 'remote') {
    if (requireRemotePlan) {
      return {
        ok: false,
        diagnostic: 'Remote source write validation is required, but hosted core is not configured.',
        mode: 'local-fallback',
      };
    }
    return {
      ok: true,
      diagnostic: 'Hosted core is not configured; source write planning stayed local.',
      mode: 'local-fallback',
    };
  }

  const byteLength = getUtf8ByteLength(contents);
  try {
    const response = await client.planOperation({
      protocolVersion: 1,
      intent: 'validate-edit',
      project,
      prompt: label,
      selection: {
        activeTargetKind: subject.kind,
        sourceFile: subject.sourceFile,
      },
      constraints: {
        allowSourceWrites: true,
        allowAssetWrites: false,
        maxPatchBytes: MAX_HOSTED_SOURCE_WRITE_PLAN_BYTES,
      },
      operation: {
        byteLength,
        contentHash: createSourceWriteContentHash(contents),
        kind: 'source.write',
        label,
        sourceFile: subject.sourceFile,
        subjectId: subject.id,
        subjectKind: subject.kind,
        subjectName: subject.name,
        trigger,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        diagnostic: response.message,
        mode: 'remote',
      };
    }

    const executableStep = response.plan.steps.find((step) => step.kind !== 'message');
    if (executableStep) {
      return {
        ok: false,
        diagnostic: 'Hosted core returned executable source steps, but bridge plan application is not enabled here yet.',
        mode: 'remote',
      };
    }

    return {
      ok: true,
      diagnostic: response.plan.summary,
      mode: 'remote',
      plan: response.plan,
    };
  } catch (error) {
    if (requireRemotePlan) {
      return {
        ok: false,
        diagnostic: error instanceof Error
          ? `Remote source write validation is required, but hosted core was unavailable: ${error.message}`
          : 'Remote source write validation is required, but hosted core was unavailable.',
        mode: 'remote-unavailable',
      };
    }
    return {
      ok: true,
      diagnostic: error instanceof Error
        ? `Hosted core source write planning was unavailable: ${error.message}`
        : 'Hosted core source write planning was unavailable.',
      mode: 'remote-unavailable',
    };
  }
}

export function isRemoteSourceWritePlanRequired(): boolean {
  const value = import.meta.env.VITE_WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'required'].includes(value.trim().toLowerCase());
}

function getUtf8ByteLength(contents: string): number {
  return new TextEncoder().encode(contents).byteLength;
}

function createSourceWriteContentHash(contents: string): string {
  let hash = 0;
  for (let index = 0; index < contents.length; index += 1) {
    hash = Math.imul(31, hash) + contents.charCodeAt(index);
    hash |= 0;
  }
  return `${contents.length}:${hash >>> 0}`;
}
