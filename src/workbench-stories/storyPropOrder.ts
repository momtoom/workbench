import storyPropOrderKeys from './storyPropOrder.json';
import type { WorkbenchStory, WorkbenchStoryArgs, WorkbenchStoryControl } from './storyTypes';

const explicitPropRanks = new Map(
  storyPropOrderKeys.map((key, index) => [normalizeStoryPropKey(key), index]),
);

const unknownPropRank = storyPropOrderKeys.length + 1;

export function compareWorkbenchStoryPropKeys(left: string, right: string): number {
  const leftRank = getWorkbenchStoryPropRank(left);
  const rightRank = getWorkbenchStoryPropRank(right);
  if (leftRank !== rightRank) return leftRank - rightRank;
  return normalizeStoryPropKey(left).localeCompare(normalizeStoryPropKey(right));
}

export function sortWorkbenchStoryArgs(args: WorkbenchStoryArgs): WorkbenchStoryArgs {
  return sortWorkbenchStoryRecord(args);
}

export function sortWorkbenchStoryRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => compareWorkbenchStoryPropKeys(left, right)),
  ) as Record<string, T>;
}

export function sortWorkbenchStoryControls(controls: WorkbenchStoryControl[]): WorkbenchStoryControl[] {
  const sortedControls = [...controls].sort(compareWorkbenchStoryControls);
  return keepConditionalControlsAfterTriggers(sortedControls);
}

export function sortWorkbenchStorySourceInsert<T extends WorkbenchStory['sourceInsert'] | undefined>(sourceInsert: T): T {
  if (!sourceInsert) return sourceInsert;
  return {
    ...sourceInsert,
    ...(sourceInsert.jsxProps ? { jsxProps: sortWorkbenchStoryRecord(sourceInsert.jsxProps) } : {}),
    ...(sourceInsert.props ? { props: sortWorkbenchStoryArgs(sourceInsert.props) } : {}),
  } as T;
}

function keepConditionalControlsAfterTriggers(controls: WorkbenchStoryControl[]): WorkbenchStoryControl[] {
  const nextControls = [...controls];
  for (let index = 0; index < nextControls.length; index += 1) {
    const control = nextControls[index];
    const triggerKeys = getControlConditionTriggerKeys(control);
    if (triggerKeys.length === 0) continue;
    const triggerIndex = Math.max(...triggerKeys.map((triggerKey) => (
      nextControls.findIndex((candidate) => candidate.key === triggerKey)
    )));
    if (triggerIndex < 0 || triggerIndex < index) continue;
    nextControls.splice(index, 1);
    nextControls.splice(triggerIndex, 0, control);
  }
  return nextControls;
}

function getControlConditionTriggerKeys(control: WorkbenchStoryControl): string[] {
  return [
    ...(control.when ? [control.when.key] : []),
    ...(control.whenAll ?? []).map((condition) => condition.key),
  ].filter((key, index, keys) => keys.indexOf(key) === index);
}

function compareWorkbenchStoryControls(left: WorkbenchStoryControl, right: WorkbenchStoryControl): number {
  const leftGroupOrder = getControlGroupOrder(left);
  const rightGroupOrder = getControlGroupOrder(right);
  if (leftGroupOrder !== rightGroupOrder) return leftGroupOrder - rightGroupOrder;
  const leftOrder = getControlOrder(left);
  const rightOrder = getControlOrder(right);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return compareWorkbenchStoryPropKeys(left.key, right.key);
}

function getControlGroupOrder(control: WorkbenchStoryControl): number {
  return typeof control.groupOrder === 'number' && Number.isFinite(control.groupOrder)
    ? control.groupOrder
    : Number.POSITIVE_INFINITY;
}

function getControlOrder(control: WorkbenchStoryControl): number {
  return typeof control.order === 'number' && Number.isFinite(control.order) ? control.order : Number.POSITIVE_INFINITY;
}

function getWorkbenchStoryPropRank(key: string): number {
  return explicitPropRanks.get(normalizeStoryPropKey(key)) ?? unknownPropRank;
}

function normalizeStoryPropKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}
