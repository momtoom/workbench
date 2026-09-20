export type WorkbenchBuildInfo = {
  channel: string;
  dirty: boolean;
  revision: string;
  version: string;
};

declare const __WORKBENCH_BUILD_INFO__: WorkbenchBuildInfo;

const FALLBACK_BUILD_INFO: WorkbenchBuildInfo = {
  channel: 'unknown',
  dirty: false,
  revision: 'unknown',
  version: '0.0.0',
};

export function getWorkbenchBuildInfo(): WorkbenchBuildInfo {
  if (typeof __WORKBENCH_BUILD_INFO__ === 'undefined') return FALLBACK_BUILD_INFO;
  return normalizeWorkbenchBuildInfo(__WORKBENCH_BUILD_INFO__);
}

export function getWorkbenchBuildRevisionLabel(buildInfo = getWorkbenchBuildInfo()): string {
  const revision = buildInfo.revision === 'unknown'
    ? buildInfo.revision
    : buildInfo.revision.slice(0, 10);
  return `${buildInfo.version} · ${revision}${buildInfo.dirty ? ' · modified' : ''}`;
}

export function getWorkbenchBuildChannelLabel(channel: string): string {
  if (channel === 'vercel-production') return 'Vercel production';
  if (channel === 'vercel-preview') return 'Vercel preview';
  if (channel === 'vercel-development') return 'Vercel development';
  if (channel === 'local-build') return 'Local package build';
  if (channel === 'local-development') return 'Local development';
  return channel;
}

function normalizeWorkbenchBuildInfo(value: WorkbenchBuildInfo): WorkbenchBuildInfo {
  return {
    channel: typeof value.channel === 'string' && value.channel ? value.channel : 'unknown',
    dirty: value.dirty === true,
    revision: typeof value.revision === 'string' && value.revision ? value.revision : 'unknown',
    version: typeof value.version === 'string' && value.version ? value.version : '0.0.0',
  };
}
