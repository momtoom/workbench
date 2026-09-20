import type { WorkbenchPageRegistry } from './workbenchProject';

// Pages live under this repo-relative root. Folders in the design-tab source
// tree map to real directories beneath it.
export const WORKBENCH_PAGES_ROOT = 'src/workbench-pages';

const PAGE_FOLDERS_EXTENSION_KEY = 'pageFolders';

function normalizeFolderPath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
    .join('/');
}

function dedupeFolderPaths(folders: Iterable<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const folder of folders) {
    if (!folder || seen.has(folder)) continue;
    seen.add(folder);
    result.push(folder);
  }
  return result;
}

/**
 * Returns the folder path (relative to {@link WORKBENCH_PAGES_ROOT}) that a page
 * source file lives in. Pages directly under the root return '' (no folder).
 */
export function getPageFolderForSourceFile(sourceFile: string): string {
  const normalized = sourceFile.replace(/\\/g, '/').replace(/^\/+/, '');
  const prefix = `${WORKBENCH_PAGES_ROOT}/`;
  if (!normalized.startsWith(prefix)) return '';
  const remainder = normalized.slice(prefix.length);
  const lastSlash = remainder.lastIndexOf('/');
  return lastSlash < 0 ? '' : normalizeFolderPath(remainder.slice(0, lastSlash));
}

/** Joins a folder path and a file basename into a repo-relative page source path. */
export function getPageSourceFileForFolder(folder: string, basename: string): string {
  const normalizedFolder = normalizeFolderPath(folder);
  return normalizedFolder
    ? `${WORKBENCH_PAGES_ROOT}/${normalizedFolder}/${basename}`
    : `${WORKBENCH_PAGES_ROOT}/${basename}`;
}

/** Returns every ancestor folder path for a folder, inclusive (e.g. a/b -> [a, a/b]). */
export function getPageFolderAncestors(folder: string): string[] {
  const normalized = normalizeFolderPath(folder);
  if (!normalized) return [];
  const segments = normalized.split('/');
  const ancestors: string[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    ancestors.push(segments.slice(0, index + 1).join('/'));
  }
  return ancestors;
}

/** Reads the explicitly-tracked folder list (including empty folders) from the registry. */
export function getWorkbenchPageFolders(pages: WorkbenchPageRegistry): string[] {
  const raw = pages.extensions?.[PAGE_FOLDERS_EXTENSION_KEY];
  if (!Array.isArray(raw)) return [];
  return dedupeFolderPaths(
    raw.filter((value): value is string => typeof value === 'string').map((value) => normalizeFolderPath(value)),
  );
}

/** Returns a new registry with the given explicit folder list persisted. */
export function withWorkbenchPageFolders(pages: WorkbenchPageRegistry, folders: Iterable<string>): WorkbenchPageRegistry {
  return {
    ...pages,
    extensions: {
      ...pages.extensions,
      [PAGE_FOLDERS_EXTENSION_KEY]: dedupeFolderPaths([...folders].map((folder) => normalizeFolderPath(folder))),
    },
  };
}

/**
 * The complete set of folder paths to show in the source tree: the union of
 * explicitly-tracked folders (which preserves empty folders across reloads) and
 * folders implied by page source files — each expanded to include ancestors.
 * Preserves the explicit folder ordering; implicit folders follow in first-seen
 * order from the pages array.
 */
export function getAllWorkbenchPageFolders(pages: WorkbenchPageRegistry): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const visit = (folder: string) => {
    if (!folder || seen.has(folder)) return;
    seen.add(folder);
    result.push(folder);
  };
  for (const folder of getWorkbenchPageFolders(pages)) {
    for (const ancestor of getPageFolderAncestors(folder)) visit(ancestor);
  }
  for (const page of pages.pages) {
    for (const ancestor of getPageFolderAncestors(getPageFolderForSourceFile(page.sourceFile))) {
      visit(ancestor);
    }
  }
  return result;
}
