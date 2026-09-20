export type WorkbenchStoryArgValue = boolean | number | string;
export type WorkbenchStoryArgs = Record<string, WorkbenchStoryArgValue>;

export function sanitizeWorkbenchStoryArgs(value: unknown): WorkbenchStoryArgs {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, WorkbenchStoryArgValue] => (
      entry[0].trim().length > 0
      && (
        typeof entry[1] === 'boolean'
        || typeof entry[1] === 'string'
        || (typeof entry[1] === 'number' && Number.isFinite(entry[1]))
      )
    )),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
