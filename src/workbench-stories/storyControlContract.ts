import type { WorkbenchStoryArgValue, WorkbenchStoryControl } from './storyTypes';

/**
 * Why the value shown in a prop control does not match the contract its story
 * declared, or null when it does.
 *
 * The authoring MCP already does this for agent writes: compiling a page emits
 * `WB-AUTH-COMPONENT-PROP-OPTION` / `-TYPE` when an authored value falls
 * outside the component's story contract (see resolveComponentAuthoringProps in
 * scripts/workbench-authoring-core.mjs). The Inspector -- the path a person
 * edits through -- had no equivalent, so a value the component could not use
 * reached source with nothing said about it.
 *
 * This is evaluated while rendering a control, not while committing one, so it
 * also catches values that never passed through the Inspector: hand-edited
 * source, an MCP write, or a story contract that changed after the page was
 * authored.
 *
 * Reporting, not refusing. The authoring core deliberately keeps these out of
 * its blocking set because the page still compiles and stays editable, and a
 * story contract is often narrower than the component: Icon declares `size` as
 * a number for its scrub control while the component also honours CSS lengths
 * like "1.5rem". Blocking would break that escape hatch; saying nothing is how
 * `size="xs"` silently rendered a 0x0 icon.
 *
 * The message names no prop, because it renders beneath that prop's own
 * labelled field.
 */
export function findWorkbenchStoryControlViolation(
  control: WorkbenchStoryControl | undefined,
  value: WorkbenchStoryArgValue | undefined,
): string | null {
  if (!control || value === undefined || value === null || value === '') return null;

  if (control.type === 'select') {
    if (control.options.length === 0) return null;
    if (control.options.some((option) => Object.is(option, value))) return null;
    return `Declared as ${formatOptionList(control.options)}. ${formatValue(value)} is outside that contract, so the component may ignore it.`;
  }

  if (control.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `Declared as a number. ${formatValue(value)} is outside that contract, so the component may ignore it.`;
    }
    if (typeof control.min === 'number' && value < control.min) {
      return `Declared as ${control.min}${typeof control.max === 'number' ? `-${control.max}` : ' or above'}. ${value} is outside that range.`;
    }
    if (typeof control.max === 'number' && value > control.max) {
      return `Declared as ${typeof control.min === 'number' ? `${control.min}-` : 'up to '}${control.max}. ${value} is outside that range.`;
    }
    return null;
  }

  if (control.type === 'boolean' && typeof value !== 'boolean') {
    return `Declared as a boolean. ${formatValue(value)} is outside that contract, so the component may ignore it.`;
  }

  return null;
}

export function findWorkbenchStoryControl(
  controls: WorkbenchStoryControl[] | undefined,
  propName: string,
): WorkbenchStoryControl | undefined {
  return controls?.find((control) => control.key === propName);
}

function formatValue(value: WorkbenchStoryArgValue): string {
  return typeof value === 'string' ? `"${value}"` : String(value);
}

function formatOptionList(options: readonly (string | number)[]): string {
  const shown = options.slice(0, 6).map((option) => JSON.stringify(option)).join(', ');
  return options.length > 6 ? `${shown}, …` : shown;
}
