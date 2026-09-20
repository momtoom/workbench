/**
 * Pattern that matches any imported library preset's components folder, e.g.
 * `<library-id>-preset/components`.
 * The library id is the prefix before `-preset`.
 */
const PRESET_COMPONENT_SOURCE_PATTERN = /^([a-z][a-z0-9-]*)-preset\/components(?:\/(.+))?$/i;
const PROJECT_SOURCE_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public'];

export function normalizeProjectSourcePath(path: string | undefined): string {
  return (path ?? '').replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

export function normalizeProjectSourceFileReference(path: string | undefined): string {
  const rawPath = (path ?? '').trim();
  const normalized = normalizeProjectSourcePath(path);
  if (!normalized) return '';
  if (isProjectRootRelativeSourcePath(normalized)) return normalized;
  const rebased = getProjectSourceRootSuffix(normalized);
  if (rebased) return rebased;
  if (isLikelyAbsoluteSourceReference(rawPath)) return '';
  return normalized;
}

export function isProjectLocalImportSource(importSource: string | undefined): boolean {
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/');
  const normalizedImport = normalizeProjectSourcePath(importSource);
  return normalizedImport.startsWith('.') ||
    normalizedImport === '@' ||
    normalizedImport.startsWith('@/') ||
    (rawImport.startsWith('/') && !rawImport.startsWith('//'));
}

/**
 * Returns true when the source file lives in *any*
 * `<libraryId>-preset/components` folder.
 */
export function isPresetComponentSourceFile(sourceFile: string | undefined): boolean {
  const normalized = normalizeProjectSourceFileReference(sourceFile).replace(/\.(tsx|ts|jsx|js)$/, '');
  return PRESET_COMPONENT_SOURCE_PATTERN.test(normalized);
}

/**
 * Extracts the library id from a preset component source file path. Returns
 * `null` when the path doesn't match the `<libraryId>-preset/components/...`
 * convention.
 */
export function getPresetLibraryIdFromSourceFile(sourceFile: string | undefined): string | null {
  const normalized = normalizeProjectSourceFileReference(sourceFile).replace(/\.(tsx|ts|jsx|js)$/, '');
  const match = PRESET_COMPONENT_SOURCE_PATTERN.exec(normalized);
  return match ? match[1].toLowerCase() : null;
}

export function resolveProjectImportSourcePath(
  ownerSourceFile: string | undefined,
  importSource: string | undefined,
): string | null {
  const rawImport = (importSource ?? '').trim().replace(/\\/g, '/');
  const normalizedImport = normalizeProjectSourcePath(importSource);
  if (!normalizedImport) return null;
  if (rawImport.startsWith('/') && !rawImport.startsWith('//')) {
    return normalizeProjectSourceFileReference(importSource) || null;
  }
  if (normalizedImport === '@') return 'src';
  if (normalizedImport.startsWith('@/')) return normalizeProjectSourcePath(`src/${normalizedImport.slice(2)}`);
  if (!normalizedImport.startsWith('.')) return normalizedImport;

  const ownerDirectory = normalizeProjectSourceFileReference(ownerSourceFile).split('/').slice(0, -1);
  const segments: string[] = [];
  for (const segment of [...ownerDirectory, ...normalizedImport.split('/')]) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) return null;
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

export function resolveProjectLocalImportSourcePath(
  ownerSourceFile: string | undefined,
  importSource: string | undefined,
): string | null {
  if (!isProjectLocalImportSource(importSource)) return null;
  return resolveProjectImportSourcePath(ownerSourceFile, importSource);
}

export function isPresetComponentImport(
  ownerSourceFile: string | undefined,
  importSource: string | undefined,
): boolean {
  return isPresetComponentSourceFile(resolveProjectImportSourcePath(ownerSourceFile, importSource) ?? undefined);
}

function isProjectRootRelativeSourcePath(path: string): boolean {
  const firstSegment = path.split('/')[0] ?? '';
  return PROJECT_SOURCE_ROOT_SEGMENTS.includes(firstSegment) || PRESET_COMPONENT_SOURCE_PATTERN.test(path);
}

function getProjectSourceRootSuffix(path: string): string | null {
  const normalized = `/${path.replace(/^\/+/, '')}`;
  for (const segment of PROJECT_SOURCE_ROOT_SEGMENTS) {
    const marker = `/${segment}/`;
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) return normalized.slice(index + 1);
  }
  return null;
}

function isLikelyAbsoluteSourceReference(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('/') ||
    normalized.startsWith('@fs/') ||
    normalized.startsWith('file:/') ||
    /^[a-z]:\//i.test(normalized);
}
