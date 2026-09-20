export type WorkbenchColorSchemeSide = 'light' | 'dark';

const LIGHT_DARK_FUNCTION = 'light-dark(';

/**
 * Collapse a CSS `light-dark(<light>, <dark>)` value down to the side that the
 * current preview appearance is actually rendering.
 *
 * Astryx stores every theme color token as `light-dark(...)`. That form is a
 * valid computed value, but it cannot round-trip through a native
 * `<input type="color">` and it is not a literal any source writer can emit, so
 * detaching a token or seeding a color field used to produce a value that was
 * immediately discarded. Folding first keeps those paths on a concrete color.
 *
 * Values that are not a `light-dark()` call are returned unchanged.
 */
export function foldLightDarkColorValue(value: string, side: WorkbenchColorSchemeSide): string {
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith(LIGHT_DARK_FUNCTION)) return value;
  if (!trimmed.endsWith(')')) return value;

  const args = splitTopLevelArguments(trimmed.slice(LIGHT_DARK_FUNCTION.length, -1));
  if (args.length !== 2) return value;

  const picked = side === 'dark' ? args[1] : args[0];
  return picked || value;
}

/** True when the value is a `light-dark()` call this module can fold. */
export function isLightDarkColorValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.toLowerCase().startsWith(LIGHT_DARK_FUNCTION)
    && trimmed.endsWith(')')
    && splitTopLevelArguments(trimmed.slice(LIGHT_DARK_FUNCTION.length, -1)).length === 2;
}

/**
 * Split on commas that sit at nesting depth zero so nested color functions such
 * as `rgb(0, 0, 0)` or `color-mix(in srgb, a, b)` stay intact.
 */
function splitTopLevelArguments(input: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '(') depth += 1;
    else if (character === ')') depth -= 1;
    else if (character === ',' && depth === 0) {
      args.push(input.slice(start, index).trim());
      start = index + 1;
    }
  }
  args.push(input.slice(start).trim());

  return args.every((argument) => argument.length > 0) ? args : [];
}
