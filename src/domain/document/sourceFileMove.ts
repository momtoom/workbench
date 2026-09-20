// Helpers for moving a source file between folders while keeping its relative
// import/export specifiers valid. Runs in the browser (called from the design
// editor), so it cannot use node:path — the small posix helpers below cover the
// repo-relative path math we need.

function splitPosix(path: string): string[] {
  return path.replace(/\\/g, '/').split('/').filter((part) => part.length > 0);
}

function normalizePosixSegments(segments: string[]): string[] {
  const result: string[] = [];
  for (const segment of segments) {
    if (segment === '.' || segment === '') continue;
    if (segment === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop();
      } else {
        result.push('..');
      }
      continue;
    }
    result.push(segment);
  }
  return result;
}

function posixDirname(path: string): string {
  const segments = splitPosix(path);
  segments.pop();
  return segments.join('/');
}

// Resolve `specifier` (relative to `fromDir`) and re-express it relative to
// `toDir`. Both directories are repo-relative posix paths.
function reExpressRelativeSpecifier(specifier: string, fromDir: string, toDir: string): string {
  const hadTrailingSlash = specifier.endsWith('/');
  const resolvedTarget = normalizePosixSegments([...splitPosix(fromDir), ...splitPosix(specifier)]);
  // Defensive depth correction: a valid project-relative target never escapes the
  // project root, so any leading ".." here means the *original* specifier was
  // already broken (resolved above the root). Anchor it at the root instead of
  // preserving — and compounding — the escape every time the file moves deeper.
  let escape = 0;
  while (escape < resolvedTarget.length && resolvedTarget[escape] === '..') escape += 1;
  const targetSegments = resolvedTarget.slice(escape);
  const baseSegments = normalizePosixSegments(splitPosix(toDir));

  let common = 0;
  while (
    common < baseSegments.length &&
    common < targetSegments.length &&
    baseSegments[common] === targetSegments[common]
  ) {
    common += 1;
  }

  const upSegments = baseSegments.slice(common).map(() => '..');
  const downSegments = targetSegments.slice(common);
  let relativeSegments = [...upSegments, ...downSegments];
  if (relativeSegments.length === 0) relativeSegments = ['.'];

  let next = relativeSegments.join('/');
  if (!next.startsWith('.')) next = `./${next}`;
  if (hadTrailingSlash && !next.endsWith('/')) next = `${next}/`;
  return next;
}

const RELATIVE_SPECIFIER_PATTERN =
  /(import\s+[^'"]*?from\s*|export\s+[^'"]*?from\s*|import\s*|export\s*\*\s*from\s*|import\s*\(\s*)(['"])(\.[^'"]*)(\2)/g;

/**
 * Rewrites every relative import/export specifier in `contents` so that a file
 * moved from `fromPath` to `toPath` (both repo-relative paths) keeps resolving
 * to the same modules. Non-relative (package) specifiers are left untouched.
 * Returns the original string unchanged when the directories are identical.
 */
export function rewriteRelativeImportsForFileMove(contents: string, fromPath: string, toPath: string): string {
  const fromDir = posixDirname(fromPath);
  const toDir = posixDirname(toPath);
  if (normalizePosixSegments(splitPosix(fromDir)).join('/') === normalizePosixSegments(splitPosix(toDir)).join('/')) {
    return contents;
  }

  return contents.replace(
    RELATIVE_SPECIFIER_PATTERN,
    (match, prefix: string, quote: string, specifier: string) => {
      // Only relative specifiers reach the capture group (it requires a leading
      // dot), so every match is safe to rewrite.
      const nextSpecifier = reExpressRelativeSpecifier(specifier, fromDir, toDir);
      return `${prefix}${quote}${nextSpecifier}${quote}`;
    },
  );
}

/**
 * Re-expresses a single import/export specifier so a node copied out of
 * `fromPath` resolves correctly when pasted into `toPath` (both repo-relative).
 * Non-relative (package) specifiers and same-directory moves are returned
 * unchanged. Used when pasting clipboard nodes across pages at different folder
 * depths, where the copied import lines would otherwise keep the source page's
 * relative depth.
 */
export function reExpressRelativeImportSpecifier(specifier: string, fromPath: string, toPath: string): string {
  if (!specifier.startsWith('.')) return specifier;
  const fromDir = posixDirname(fromPath);
  const toDir = posixDirname(toPath);
  if (normalizePosixSegments(splitPosix(fromDir)).join('/') === normalizePosixSegments(splitPosix(toDir)).join('/')) {
    return specifier;
  }
  return reExpressRelativeSpecifier(specifier, fromDir, toDir);
}

/**
 * Builds a relative import specifier from `fromFile` to `toModule` (both
 * repo/tree-relative posix paths; `toModule` carries no file extension). Used to
 * compute a depth-correct import path to a fixed helper module regardless of how
 * deep `fromFile` sits in the tree.
 */
export function relativeModuleSpecifier(fromFile: string, toModule: string): string {
  const fromSegments = normalizePosixSegments(splitPosix(posixDirname(fromFile)));
  const toSegments = normalizePosixSegments(splitPosix(toModule));
  let common = 0;
  while (common < fromSegments.length && common < toSegments.length && fromSegments[common] === toSegments[common]) {
    common += 1;
  }
  const upSegments = fromSegments.slice(common).map(() => '..');
  const downSegments = toSegments.slice(common);
  let segments = [...upSegments, ...downSegments];
  if (segments.length === 0) segments = ['.'];
  let next = segments.join('/');
  if (!next.startsWith('.')) next = `./${next}`;
  return next;
}
