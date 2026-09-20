import type {
  WorkbenchStoryArgValue,
  WorkbenchStoryControl,
} from './storyTypes';

/**
 * The last-resort control for a prop whose story declared none.
 *
 * Inference here is limited to what the arg's own runtime value proves: a
 * boolean value gets a boolean control, a number gets a number control.
 * Anything else returns null and the caller falls back to a plain text field,
 * which shows the value as authored.
 *
 * This file used to hold a table keyed by prop name that guessed an enum from
 * the identifier alone -- any prop called `size` was offered xs/sm/md/lg/xl,
 * any `position` got static/relative/sticky, and so on. Those lists began as
 * per-component control descriptors hand-written for a since-retired library
 * import (62fdeeaa0) and were lifted into one global table when this file was
 * created (b1e7b7d19). Applied across every library they stopped being a
 * contract and became a guess -- and the guess outranked controls the stories
 * actually declared: Icon declares `size` as a number (8-64px), was handed the
 * t-shirt list instead, and picking "xs" wrote a value the component could not
 * size with, so the icon rendered 0x0. A sweep of 5021 story files found 9770
 * props with explicit options and zero that depended on the table for a
 * control, so it was deleted rather than merely demoted.
 *
 * Expose the contract. Do not invent one.
 */
export function createValueTypeFallbackControl(
  key: string,
  value: WorkbenchStoryArgValue | undefined,
  label: string,
): WorkbenchStoryControl | null {
  if (typeof value === 'boolean') return { key, label, type: 'boolean' };
  if (typeof value === 'number') return { key, label, type: 'number' };
  return null;
}
