import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX = 'WORKBENCH_PREVIEW_CSS_RECEIPT=';
export const WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER = 'Workbench design-preview CSS snapshot';
export const WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES = 16 * 1024 * 1024;
export const WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS = 180_000;

const EMPTY_TAILWIND_PREVIEW_CSS_CONFIG = Object.freeze({
  compiledCss: null,
  enabled: false,
  sourceCss: null,
  tokenCss: null,
});
const PREVIEW_CSS_INPUT_ROOTS = ['src', 'app', 'pages', 'components', 'lib', 'styles'];
const PREVIEW_CSS_INPUT_FILE_PATTERN = /\.(?:css|html?|jsx?|tsx?)$/i;
const PREVIEW_CSS_ROOT_CONFIG_PATTERN = /^(?:postcss|tailwind|vite)\.config\.(?:cjs|js|mjs|ts)$/i;
const PROJECT_CSS_CONFIG_ROOT_SEGMENTS = ['src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];

export function createWorkbenchPreviewCssCoordinator({
  onInputsChangedDuringSync = null,
  onStatus = null,
  onSynchronized = null,
  runTailwindSync,
}) {
  if (typeof runTailwindSync !== 'function') {
    throw new Error('Workbench preview CSS coordinator requires a Tailwind sync runner.');
  }
  const statuses = new Map();
  const syncChains = new Map();

  async function getProjectStatus(projectRoot) {
    const root = resolve(projectRoot);
    const config = await readWorkbenchPreviewCssConfig(root);
    const inputRevision = await createWorkbenchPreviewCssInputRevision(root, config);
    const outputRevision = await createWorkbenchPreviewCssOutputRevision(root, config.compiledCss);
    const current = statuses.get(root);
    if (
      current
      && current.compiledCss === config.compiledCss
      && current.tokenCss === config.tokenCss
      && current.mode === getWorkbenchPreviewCssMode(config)
      && current.renderFreshness.inputRevision === inputRevision
      && current.renderFreshness.outputRevision === outputRevision
    ) {
      return current;
    }
    const status = await createInitialWorkbenchPreviewCssStatus(root, config, {
      inputRevision,
      outputRevision,
      reason: current
        ? 'Tailwind preview CSS inputs or output changed after the last verified synchronization.'
        : undefined,
    });
    statuses.set(root, status);
    return status;
  }

  function synchronizeProject(projectRoot, { changedPath = null, reason = 'authoring' } = {}) {
    const root = resolve(projectRoot);
    const previous = syncChains.get(root) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(async () => {
      const config = await readWorkbenchPreviewCssConfig(root);
      const mode = getWorkbenchPreviewCssMode(config);
      const inputRevisionBefore = await createWorkbenchPreviewCssInputRevision(root, config);
      const outputRevisionBefore = await createWorkbenchPreviewCssOutputRevision(root, config.compiledCss);
      if (mode === 'disabled') {
        return setStatus(root, createWorkbenchPreviewCssResult({
          config,
          freshness: createWorkbenchPreviewCssRenderFreshness({
            fresh: true,
            inputRevision: inputRevisionBefore,
            outputRevision: outputRevisionBefore,
            reason: 'Tailwind preview CSS is disabled; no compiled Tailwind layer is required.',
            representative: true,
          }),
          status: 'not-configured',
        }));
      }
      if (mode === 'fallback') {
        return setStatus(root, createWorkbenchPreviewCssResult({
          config,
          freshness: createWorkbenchPreviewCssRenderFreshness({
            fresh: true,
            inputRevision: inputRevisionBefore,
            outputRevision: null,
            reason: 'Workbench-generated Tailwind fallback CSS is approximate and cannot represent the project for render auditing.',
            representative: false,
          }),
          status: 'unrepresentative',
        }));
      }
      if (changedPath && !shouldWorkbenchPreviewCssSyncForProjectPath(changedPath, config)) {
        const current = await getProjectStatus(root);
        return { ...current, status: 'not-required' };
      }

      setStatus(root, createWorkbenchPreviewCssResult({
        config,
        freshness: createWorkbenchPreviewCssRenderFreshness({
          fresh: false,
          inputRevision: inputRevisionBefore,
          outputRevision: outputRevisionBefore,
          reason: `Tailwind preview CSS synchronization is running (${reason}).`,
          representative: await isWorkbenchPreviewCssRepresentative(root, config),
          state: 'syncing',
        }),
        status: 'stale',
      }));

      try {
        const execution = await runTailwindSync({ changedPath, projectRoot: root, reason });
        const stdout = typeof execution === 'string' ? execution : execution?.stdout;
        const receipt = parseWorkbenchPreviewCssBuildReceipt(typeof stdout === 'string' ? stdout : '');
        const synchronizedConfig = await readWorkbenchPreviewCssConfig(root);
        const inputRevisionAfter = await createWorkbenchPreviewCssInputRevision(root, synchronizedConfig);
        const outputRevisionAfter = await createWorkbenchPreviewCssOutputRevision(root, synchronizedConfig.compiledCss);
        const outputRepresentative = await isWorkbenchPreviewCssRepresentative(root, synchronizedConfig);
        const inputsChangedDuringSync = inputRevisionBefore !== inputRevisionAfter;
        const receiptMatchesConfig = Boolean(
          receipt
          && receipt.compiledCss === synchronizedConfig.compiledCss,
        );
        const fresh = receiptMatchesConfig && receipt.fresh === true && !inputsChangedDuringSync;
        const representative = receiptMatchesConfig && receipt.representative === true && outputRepresentative;
        const preservedStaleOutput = receipt?.provenance === 'stale-existing';
        const synchronized = createWorkbenchPreviewCssResult({
          config: synchronizedConfig,
          freshness: createWorkbenchPreviewCssRenderFreshness({
            fresh,
            inputRevision: inputRevisionAfter,
            outputRevision: outputRevisionAfter,
            reason: !receipt
              ? 'Tailwind synchronization completed without a verifiable build receipt.'
              : !receiptMatchesConfig
                ? 'Tailwind synchronization returned a build receipt for a different compiled CSS path.'
                : !fresh
                  ? 'Tailwind inputs changed during synchronization or the previous compiled CSS was preserved.'
                  : !representative
                    ? 'The compiled CSS is an install-free static snapshot and does not represent the current project source.'
                    : 'Compiled Tailwind CSS was built from the current project source.',
            representative,
            ...(!receipt || !receiptMatchesConfig || preservedStaleOutput ? { state: 'unavailable' } : {}),
          }),
          status: !receipt || !receiptMatchesConfig
            ? 'unavailable'
            : !representative
              ? 'unrepresentative'
              : fresh
                ? 'synchronized'
                : 'stale',
        });
        setStatus(root, synchronized);
        if (typeof onSynchronized === 'function') {
          onSynchronized({ config: synchronizedConfig, projectRoot: root, result: synchronized });
        }
        if (receipt?.fresh === true && inputsChangedDuringSync && typeof onInputsChangedDuringSync === 'function') {
          onInputsChangedDuringSync({ projectRoot: root });
        }
        return synchronized;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const failedConfig = await readWorkbenchPreviewCssConfig(root);
        const failed = createWorkbenchPreviewCssResult({
          config: failedConfig,
          freshness: createWorkbenchPreviewCssRenderFreshness({
            error: message,
            fresh: false,
            inputRevision: await createWorkbenchPreviewCssInputRevision(root, failedConfig),
            outputRevision: await createWorkbenchPreviewCssOutputRevision(root, failedConfig.compiledCss),
            reason: 'Tailwind preview CSS synchronization failed; the existing preview output may be stale.',
            representative: await isWorkbenchPreviewCssRepresentative(root, failedConfig),
          }),
          status: 'failed',
        });
        setStatus(root, failed);
        throw error;
      }
    });
    syncChains.set(root, result.then(() => undefined, () => undefined));
    return result;
  }

  function setStatus(root, status) {
    statuses.set(root, status);
    if (typeof onStatus === 'function') onStatus(root, status);
    return status;
  }

  return {
    getProjectStatus,
    synchronizeProject,
  };
}

export function getWorkbenchPreviewCssMode(config) {
  if (!config.enabled) return 'disabled';
  return config.compiledCss ? 'compiled' : 'fallback';
}

export function createWorkbenchPreviewCssRenderFreshness(input) {
  const error = input.error ?? null;
  const ready = input.fresh && input.representative && !error;
  const state = input.state ?? (
    error
      ? 'failed'
      : !input.fresh
        ? 'stale'
        : !input.representative
          ? 'unrepresentative'
          : 'ready'
  );
  return {
    error,
    fresh: input.fresh,
    inputRevision: input.inputRevision ?? null,
    outputRevision: input.outputRevision ?? null,
    ready,
    reason: input.reason,
    representative: input.representative,
    state,
  };
}

export function createWorkbenchPreviewCssResult(input) {
  return {
    compiledCss: input.config.compiledCss,
    mode: getWorkbenchPreviewCssMode(input.config),
    renderFreshness: input.freshness,
    status: input.status,
    tokenCss: input.config.tokenCss,
  };
}

export async function createInitialWorkbenchPreviewCssStatus(
  projectRoot,
  config,
  { inputRevision = null, outputRevision = null, reason } = {},
) {
  const mode = getWorkbenchPreviewCssMode(config);
  const currentInputRevision = inputRevision ?? await createWorkbenchPreviewCssInputRevision(projectRoot, config);
  const currentOutputRevision = outputRevision ?? await createWorkbenchPreviewCssOutputRevision(projectRoot, config.compiledCss);
  if (mode === 'disabled') {
    return createWorkbenchPreviewCssResult({
      config,
      freshness: createWorkbenchPreviewCssRenderFreshness({
        fresh: true,
        inputRevision: currentInputRevision,
        outputRevision: currentOutputRevision,
        reason: 'Tailwind preview CSS is disabled; no compiled Tailwind layer is required.',
        representative: true,
      }),
      status: 'not-configured',
    });
  }
  if (mode === 'fallback') {
    return createWorkbenchPreviewCssResult({
      config,
      freshness: createWorkbenchPreviewCssRenderFreshness({
        fresh: true,
        inputRevision: currentInputRevision,
        outputRevision: null,
        reason: 'Workbench fallback styling is available, but it is not derived from this project source.',
        representative: false,
      }),
      status: 'unrepresentative',
    });
  }
  return createWorkbenchPreviewCssResult({
    config,
    freshness: createWorkbenchPreviewCssRenderFreshness({
      fresh: false,
      inputRevision: currentInputRevision,
      outputRevision: currentOutputRevision,
      reason: reason ?? 'The compiled Tailwind output has not been synchronized in this runtime session.',
      representative: await isWorkbenchPreviewCssRepresentative(projectRoot, config),
      state: 'stale',
    }),
    status: 'stale',
  });
}

export async function readWorkbenchPreviewCssConfig(projectRoot) {
  try {
    const contents = await readFile(resolve(projectRoot, '.workbench', 'workbench.config.json'), 'utf8');
    const config = JSON.parse(contents);
    if (!isObjectRecord(config)) return EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
    const extensions = isObjectRecord(config.extensions) ? config.extensions : null;
    const tailwind = extensions && isObjectRecord(extensions.tailwind) ? extensions.tailwind : null;
    if (!tailwind) return EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
    return {
      compiledCss: normalizeProjectCssConfigPath(tailwind.compiledCss),
      enabled: tailwind.enabled !== false,
      sourceCss: normalizeProjectCssConfigPath(tailwind.sourceCss),
      tokenCss: normalizeProjectCssConfigPath(tailwind.tokenCss),
    };
  } catch {
    return EMPTY_TAILWIND_PREVIEW_CSS_CONFIG;
  }
}

export function shouldWorkbenchPreviewCssSyncForProjectPath(path, config) {
  const normalizedPath = normalizeProjectPath(path);
  if (!normalizedPath) return false;
  if (normalizedPath === config.compiledCss || normalizedPath === config.tokenCss) return false;
  if (normalizedPath === '.workbench/workbench.config.json') return true;
  if (normalizedPath.startsWith('.workbench/') && normalizedPath !== '.workbench/workbench.config.json') return false;
  if (normalizedPath.startsWith('dist/') || normalizedPath.startsWith('node_modules/')) return false;
  if (
    normalizedPath === config.sourceCss
    || normalizedPath === 'components.json'
    || normalizedPath === 'index.html'
    || normalizedPath === 'package.json'
    || /^(?:postcss|tailwind|vite)\.config\.(?:cjs|js|mjs|ts)$/i.test(normalizedPath)
  ) return true;
  return /^(?:src|app|pages|components|lib|styles)\//.test(normalizedPath)
    && /\.(?:css|html?|jsx?|tsx?)$/i.test(normalizedPath);
}

export async function createWorkbenchPreviewCssInputRevision(projectRoot, config) {
  const paths = new Set([
    '.workbench/workbench.config.json',
    'components.json',
    'index.html',
    'package.json',
  ]);
  if (config.sourceCss) paths.add(config.sourceCss);

  await Promise.all(PREVIEW_CSS_INPUT_ROOTS.map(async (rootPath) => {
    await collectPreviewCssInputFiles(projectRoot, rootPath, paths);
  }));

  try {
    const rootEntries = await readdir(projectRoot, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isFile() && PREVIEW_CSS_ROOT_CONFIG_PATTERN.test(entry.name)) paths.add(entry.name);
    }
  } catch {
    // Required path reads below represent missing or unreadable roots.
  }

  paths.delete(config.compiledCss ?? '');
  paths.delete(config.tokenCss ?? '');
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) {
    hash.update(path);
    hash.update('\0');
    try {
      hash.update(await readFile(resolve(projectRoot, path)));
    } catch {
      hash.update('<missing>');
    }
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

export async function createWorkbenchPreviewCssOutputRevision(projectRoot, compiledCss) {
  if (!compiledCss) return null;
  try {
    const contents = await readFile(resolve(projectRoot, compiledCss));
    return `sha256:${createHash('sha256').update(contents).digest('hex')}`;
  } catch {
    return null;
  }
}

export async function isWorkbenchPreviewCssRepresentative(projectRoot, config) {
  const mode = getWorkbenchPreviewCssMode(config);
  if (mode === 'disabled') return true;
  if (mode === 'fallback' || !config.compiledCss) return false;
  try {
    const contents = await readFile(resolve(projectRoot, config.compiledCss), 'utf8');
    return Boolean(contents.trim()) && !contents.includes(WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER);
  } catch {
    return false;
  }
}

export function parseWorkbenchPreviewCssBuildReceipt(stdout) {
  const line = stdout
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX));
  if (!line) return null;
  try {
    const receipt = JSON.parse(line.slice(WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX.length));
    if (
      !isObjectRecord(receipt)
      || receipt.version !== 1
      || typeof receipt.compiledCss !== 'string'
      || typeof receipt.fresh !== 'boolean'
      || typeof receipt.representative !== 'boolean'
      || !['existing', 'install-free-seed', 'project-build', 'stale-existing'].includes(String(receipt.provenance))
    ) return null;
    return receipt;
  } catch {
    return null;
  }
}

function normalizeProjectCssConfigPath(value) {
  if (typeof value !== 'string') return null;
  const rawPath = value.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const normalizedPath = normalizeConfiguredProjectCssPath(rawPath);
  if (!normalizedPath || !normalizedPath.toLowerCase().endsWith('.css') || normalizedPath.startsWith('../')) {
    return null;
  }
  if (normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || ['.git', 'node_modules', 'dist', 'dist-host'].includes(part))) {
    return null;
  }
  return normalizedPath;
}

function normalizeConfiguredProjectCssPath(rawPath) {
  const normalized = rawPath.replace(/^\.\//, '');
  if (!isLikelyAbsoluteProjectCssPath(normalized)) return normalized.replace(/^\/+/, '');
  const withoutProtocolPrefix = normalized
    .replace(/^file:\/+/i, '')
    .replace(/^@fs\//, '')
    .replace(/^\/+/, '');
  if (isKnownProjectCssRootPath(withoutProtocolPrefix)) return withoutProtocolPrefix;
  return getProjectCssRootSuffix(withoutProtocolPrefix);
}

function isLikelyAbsoluteProjectCssPath(path) {
  return path.startsWith('/')
    || path.startsWith('@fs/')
    || path.startsWith('file:/')
    || /^[a-z]:\//i.test(path);
}

function isKnownProjectCssRootPath(path) {
  const firstSegment = path.split('/')[0] ?? '';
  return PROJECT_CSS_CONFIG_ROOT_SEGMENTS.includes(firstSegment);
}

function getProjectCssRootSuffix(path) {
  const normalized = `/${path.replace(/^\/+/, '')}`;
  for (const segment of PROJECT_CSS_CONFIG_ROOT_SEGMENTS) {
    const marker = `/${segment}/`;
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) return normalized.slice(index + 1);
  }
  return null;
}

function normalizeProjectPath(path) {
  return typeof path === 'string'
    ? path.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '')
    : '';
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function collectPreviewCssInputFiles(projectRoot, relativeRoot, paths) {
  let entries;
  try {
    entries = await readdir(resolve(projectRoot, relativeRoot), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = `${relativeRoot}/${entry.name}`;
    if (entry.isDirectory()) {
      await collectPreviewCssInputFiles(projectRoot, path, paths);
      continue;
    }
    if (entry.isFile() && PREVIEW_CSS_INPUT_FILE_PATTERN.test(entry.name)) paths.add(path);
  }
}
