/**
 * Compact "what changed" summaries carried on a transaction and projected into
 * the history timeline.
 *
 * The timeline is the readable work log — for the user and for agents reading
 * `history.json` directly. Undo stacks are not: a source lane's `before` /
 * `after` are whole file contents, and source lanes no longer persist them at
 * all. A summary answers "what changed" without diffing two 54 KB strings.
 *
 * Values are formatted and truncated here rather than at the call site so every
 * producer stays inside the timeline's size budget: `upsertPersistedHistoryLane`
 * keeps 1,000 entries, and the entries have to stay small enough that the log is
 * cheap next to the lane values it sits beside.
 */

/** Keeps one entry's summaries near the few-hundred-bytes the timeline budgets for. */
const MAX_SUMMARY_VALUE_LENGTH = 120;
const MAX_SUMMARIES_PER_TRANSACTION = 12;

export type WorkbenchEditChangeSummary = {
  field: string;
  before?: string | null;
  after?: string | null;
};

/**
 * Renders a value compactly. `null` means "not set" and is preserved as `null`
 * rather than the string "null", so a summary can distinguish clearing a prop
 * from setting it to something.
 */
export function formatHistoryChangeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return truncateSummaryValue(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return truncateSummaryValue(JSON.stringify(value) ?? '');
  } catch {
    // Cyclic or otherwise unserializable — the field name still carries meaning.
    return null;
  }
}

export function createHistoryChangeSummary(
  field: string,
  before: unknown,
  after: unknown,
): WorkbenchEditChangeSummary {
  return {
    field,
    before: formatHistoryChangeValue(before),
    after: formatHistoryChangeValue(after),
  };
}

/**
 * Drops summaries that record no change, and bounds the list. A transaction
 * whose summaries all collapse returns `undefined` so the timeline entry keeps
 * the field absent rather than carrying an empty array.
 */
export function normalizeHistoryChangeSummaries(
  summaries: readonly WorkbenchEditChangeSummary[] | undefined,
): WorkbenchEditChangeSummary[] | undefined {
  if (!summaries?.length) return undefined;

  const changed = summaries.filter((summary) => summary.before !== summary.after);
  if (!changed.length) return undefined;
  return changed.slice(0, MAX_SUMMARIES_PER_TRANSACTION);
}

/**
 * Folds an earlier transaction's summaries with a later one's when the two
 * merge. The merged step restores the earlier `before`, so its summary has to
 * read the same way: a scrub from 0 through 45 to 50 is `rotation: 0 → 50`, not
 * `45 → 50`.
 */
export function mergeHistoryChangeSummaries(
  previous: readonly WorkbenchEditChangeSummary[] | undefined,
  next: readonly WorkbenchEditChangeSummary[] | undefined,
): WorkbenchEditChangeSummary[] | undefined {
  if (!previous?.length) return normalizeHistoryChangeSummaries(next);
  if (!next?.length) return normalizeHistoryChangeSummaries(previous);

  const folded = next.map((summary) => {
    const earlier = previous.find((candidate) => candidate.field === summary.field);
    return earlier ? { ...summary, before: earlier.before } : summary;
  });
  const untouchedByNext = previous.filter(
    (summary) => !next.some((candidate) => candidate.field === summary.field),
  );

  return normalizeHistoryChangeSummaries([...untouchedByNext, ...folded]);
}

/** `easing: ease-in → ease-out`. Callers render; nothing persists this string. */
export function formatHistoryChangeSummary(summary: WorkbenchEditChangeSummary): string {
  const before = summary.before ?? '—';
  const after = summary.after ?? '—';
  return `${summary.field}: ${before} → ${after}`;
}

export function isHistoryChangeSummary(value: unknown): value is WorkbenchEditChangeSummary {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.field === 'string' &&
    isOptionalSummaryValue(candidate.before) &&
    isOptionalSummaryValue(candidate.after)
  );
}

function isOptionalSummaryValue(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function truncateSummaryValue(value: string): string {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  return collapsed.length > MAX_SUMMARY_VALUE_LENGTH
    ? `${collapsed.slice(0, MAX_SUMMARY_VALUE_LENGTH - 1)}…`
    : collapsed;
}
