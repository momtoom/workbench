/**
 * Runtime-populated registry of CSS scope class names declared by imported
 * libraries. Each library declares its scope through the convention
 * `<libraryId>-scope`. Workbench wrappers
 * — design preview, storybook canvas, source-tree preview, generated page
 * templates — pull from here so any imported library's tokens cascade into
 * the rendered tree without per-library code edits.
 *
 * The set is driven by `ProjectWorkspace` reading
 * `components.extensions.libraries` and calling `registerLibraryScope` per
 * library. Keep this metadata-driven so one library never inherits another
 * library's scope classes by default.
 */
const REGISTERED_SCOPES = new Set<string>();

export function registerLibraryScope(libraryId: string): void {
  if (!libraryId) return;
  REGISTERED_SCOPES.add(`${libraryId}-scope`);
}

export function unregisterLibraryScope(libraryId: string): void {
  if (!libraryId) return;
  REGISTERED_SCOPES.delete(`${libraryId}-scope`);
}

export function clearRegisteredLibraryScopes(): void {
  REGISTERED_SCOPES.clear();
}

export function getRegisteredLibraryScopes(): string[] {
  return [...REGISTERED_SCOPES];
}

/**
 * Space-separated class string of every registered scope. Spread it onto an
 * element's className when you need *all* imported libraries' tokens to
 * apply (preview canvases, runtime stages, etc.).
 */
export function getLibraryScopeClassName(): string {
  return [...REGISTERED_SCOPES].join(' ');
}
