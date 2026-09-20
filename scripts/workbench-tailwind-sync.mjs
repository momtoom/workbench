#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX,
  WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER,
  WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
} from './workbench-preview-css.mjs';
import {
  WORKBENCH_PROJECT_TEMPLATE_TAILWIND,
  createInitialWorkbenchTailwindCompiledCss,
} from './workbench-template.mjs';
import { buildTailwindTokenCss } from './workbench-token-css.mjs';

const PROJECT_CONFIG_ROOT_SEGMENTS = ['.workbench', 'src', 'app', 'pages', 'components', 'lib', 'public', 'styles'];

function main() {
  const args = parseArgs(process.argv.slice(2));
  const previewOnly = Boolean(args.previewOnly || args['preview-only']);
  const projectRoot = resolve(String(args.project ?? process.cwd()));
  const componentsPath = join(projectRoot, 'components.json');
  const workbenchConfigPath = join(projectRoot, '.workbench', 'workbench.config.json');
  const packagePath = join(projectRoot, 'package.json');

  const shadcnConfig = readJsonIfExists(componentsPath) ?? {};
  const workbenchConfig = readJsonIfExists(workbenchConfigPath) ?? {};
  const workbenchTailwindConfig = isObjectRecord(workbenchConfig?.extensions?.tailwind)
    ? workbenchConfig.extensions.tailwind
    : {};
  const packageJson = readJsonIfExists(packagePath) ?? {};
  const projectTemplateId = typeof workbenchConfig?.extensions?.projectTemplate?.id === 'string'
    ? workbenchConfig.extensions.projectTemplate.id
    : null;
  const sourceCssPath = normalizeProjectPath(
    String(args.source ?? workbenchTailwindConfig.sourceCss ?? shadcnConfig?.tailwind?.css ?? 'src/index.css'),
  );
  const compiledCssPath = normalizeProjectPath(
    String(args.compiled ?? workbenchTailwindConfig.compiledCss ?? 'src/workbench-shadcn.css'),
  );
  const tokenCssPath = normalizeProjectPath(
    String(args.tokenCss ?? workbenchTailwindConfig.tokenCss ?? 'src/workbench-tokens.css'),
  );
  const tokensPath = normalizeProjectPath(String(args.tokens ?? '.workbench/tokens.json'));

  if (!existsSync(join(projectRoot, sourceCssPath))) {
    fail(`Missing Tailwind source CSS: ${sourceCssPath}`);
  }

  if (!hasDependency(packageJson, 'tailwindcss')) {
    fail('The project does not appear to depend on tailwindcss.');
  }

  let previewCssReceipt = inspectExistingPreviewCssReceipt(projectRoot, compiledCssPath);
  if (!args.skipBuild) {
    const buildResult = runPreviewCssBuild(projectRoot);
    if (buildResult.ok) {
      const builtCssPaths = findBuiltCssPaths(projectRoot);
      const builtCss = builtCssPaths
        .map((builtCssPath) => readFileSync(builtCssPath, 'utf8'))
        .join('\n');
      writeFile(join(projectRoot, compiledCssPath), normalizeTailwindPreviewCss(builtCss));
      console.log(`Copied compiled Tailwind CSS to ${compiledCssPath}`);
      previewCssReceipt = createPreviewCssReceipt(compiledCssPath, 'project-build', true, true);
    } else {
      const recovery = buildResult.recoverable
        ? ensureInstallFreePreviewCssSeed(projectRoot, compiledCssPath, projectTemplateId)
        : null;
      if (!recovery?.available) fail(buildResult.message);
      previewCssReceipt = recovery.receipt;
      console.warn(`Skipped Tailwind preview CSS build: ${buildResult.message}`);
    }
  }

  if (previewOnly) {
    console.log(`Refreshed ${compiledCssPath}; preserved ${tokensPath} and ${tokenCssPath}.`);
    return previewCssReceipt;
  }

  const sourceCss = readFileSync(join(projectRoot, sourceCssPath), 'utf8');
  const parsedTheme = parseTailwindThemeCss(sourceCss);
  if (Object.keys(parsedTheme.light).length === 0) {
    if (Object.keys(parsedTheme.themeAliases).length === 0) {
      fail(`No :root Tailwind theme variables or @theme inline aliases found in ${sourceCssPath}`);
    }
    updateWorkbenchConfig(workbenchConfigPath, {
      provider: getTailwindProvider(workbenchTailwindConfig, shadcnConfig),
      sourceCssPath,
      compiledCssPath,
      tokenCssPath,
      shadcnStyle: typeof shadcnConfig.style === 'string' ? shadcnConfig.style : null,
    });
    console.log(`No :root Tailwind theme variables found in ${sourceCssPath}; preserved existing token CSS.`);
    return previewCssReceipt;
  }

  const existingRegistry = readJsonIfExists(join(projectRoot, tokensPath)) ?? createEmptyRegistry();
  const registry = buildTailwindTokenRegistry(existingRegistry, parsedTheme, {
    provider: getTailwindProvider(workbenchTailwindConfig, shadcnConfig),
    sourceCssPath,
    compiledCssPath,
    tokenCssPath,
    shadcnStyle: typeof shadcnConfig.style === 'string' ? shadcnConfig.style : null,
    shadcnBase: typeof shadcnConfig?.tailwind?.baseColor === 'string' ? shadcnConfig.tailwind.baseColor : null,
  });
  writeJson(join(projectRoot, tokensPath), registry);
  writeFile(join(projectRoot, tokenCssPath), buildTailwindTokenCss(registry));
  updateWorkbenchConfig(workbenchConfigPath, {
    provider: getTailwindProvider(workbenchTailwindConfig, shadcnConfig),
    sourceCssPath,
    compiledCssPath,
    tokenCssPath,
    shadcnStyle: typeof shadcnConfig.style === 'string' ? shadcnConfig.style : null,
  });

  console.log(`Synced ${registry.collections.find((collection) => collection.id === 'tailwind-theme')?.tokens.length ?? 0} Tailwind theme tokens.`);
  console.log(`Updated ${tokensPath} and ${tokenCssPath}`);
  return previewCssReceipt;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function writeJson(path, value) {
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(path, contents) {
  if (existsSync(path) && readFileSync(path, 'utf8') === contents) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
}

function hasDependency(packageJson, dependencyName) {
  return Boolean(packageJson.dependencies?.[dependencyName] ?? packageJson.devDependencies?.[dependencyName]);
}

function normalizeProjectPath(path) {
  const rawPath = path.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const normalizedPath = normalizeConfiguredProjectPath(rawPath);
  if (
    !normalizedPath ||
    normalizedPath.startsWith('../') ||
    normalizedPath.split('/').some((part) => !part || part === '.' || part === '..' || part === 'node_modules' || part === 'dist')
  ) {
    fail(`Invalid project-relative Tailwind path: ${path}`);
  }
  return normalizedPath;
}

function normalizeConfiguredProjectPath(rawPath) {
  const normalized = rawPath.replace(/^\.\//, '');
  if (!isLikelyAbsoluteProjectPath(normalized)) return normalized.replace(/^\/+/, '');
  const withoutProtocolPrefix = normalized
    .replace(/^file:\/+/i, '')
    .replace(/^@fs\//, '')
    .replace(/^\/+/, '');
  if (isKnownProjectConfigRootPath(withoutProtocolPrefix)) return withoutProtocolPrefix;
  return getProjectConfigRootSuffix(withoutProtocolPrefix);
}

function isLikelyAbsoluteProjectPath(path) {
  return path.startsWith('/') ||
    path.startsWith('@fs/') ||
    path.startsWith('file:/') ||
    /^[a-z]:\//i.test(path);
}

function isKnownProjectConfigRootPath(path) {
  const firstSegment = path.split('/')[0] ?? '';
  return PROJECT_CONFIG_ROOT_SEGMENTS.includes(firstSegment);
}

function getProjectConfigRootSuffix(path) {
  const normalized = `/${path.replace(/^\/+/, '')}`;
  for (const segment of PROJECT_CONFIG_ROOT_SEGMENTS) {
    const marker = `/${segment}/`;
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) return normalized.slice(index + 1);
  }
  return null;
}

function normalizeTailwindPreviewCss(css) {
  return css
    .replace(/container:([_a-zA-Z][\w-]*)\/inline-size/g, 'container: $1 / inline-size')
    .replace(/container-type:inline-size/g, 'container-type: inline-size')
    .replace(/\((?:width|inline-size)\s*>=\s*([^)]+?)\)/g, '(min-width: $1)')
    .replace(/\((?:width|inline-size)\s*<=\s*([^)]+?)\)/g, '(max-width: $1)')
    .replace(/\((?:height|block-size)\s*>=\s*([^)]+?)\)/g, '(min-height: $1)')
    .replace(/\((?:height|block-size)\s*<=\s*([^)]+?)\)/g, '(max-height: $1)')
    .replace(/\((width|height|inline-size|block-size)\s*([<>]=?|=)\s*([^)]+?)\)/g, '($1 $2 $3)');
}

function runPreviewCssBuild(projectRoot) {
  const viteBinary = findLocalNodeBin(projectRoot, 'vite');
  if (!viteBinary) {
    return {
      ok: false,
      recoverable: true,
      message: 'Project dependencies are not installed; run npm install in the project to regenerate compiled Tailwind CSS.',
    };
  }

  try {
    execFileSync(viteBinary, ['build'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      recoverable: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function ensureInstallFreePreviewCssSeed(projectRoot, compiledCssPath, projectTemplateId) {
  const compiledPath = join(projectRoot, compiledCssPath);
  const existingCss = existsSync(compiledPath) ? readFileSync(compiledPath, 'utf8') : '';
  const isPlainTailwindPreview = projectTemplateId === WORKBENCH_PROJECT_TEMPLATE_TAILWIND
    || compiledCssPath === 'src/workbench-tailwind.css';
  if (isPlainTailwindPreview && shouldRefreshInstallFreeTailwindSeed(existingCss)) {
    writeFile(compiledPath, createInitialWorkbenchTailwindCompiledCss(WORKBENCH_PROJECT_TEMPLATE_TAILWIND));
    console.log(`Seeded install-free Tailwind preview CSS at ${compiledCssPath}`);
    return {
      available: true,
      receipt: createPreviewCssReceipt(compiledCssPath, 'install-free-seed', true, false),
    };
  }
  if (!existsSync(compiledPath)) return { available: false, receipt: null };
  const isSeed = existingCss.includes(WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER);
  return {
    available: true,
    receipt: createPreviewCssReceipt(
      compiledCssPath,
      isSeed ? 'install-free-seed' : 'stale-existing',
      isSeed,
      !isSeed,
    ),
  };
}

function shouldRefreshInstallFreeTailwindSeed(css) {
  if (!css.trim()) return true;
  if (!css.includes('Workbench design-preview CSS snapshot')) return false;
  return !css.includes('--background:')
    || !css.includes('border: 0 solid;')
    || !css.includes('font-size: inherit;')
    || !css.includes('border-collapse: collapse;')
    || !css.includes('max-width: 100%;')
    || css.includes('.wb-basic-page');
}

function inspectExistingPreviewCssReceipt(projectRoot, compiledCssPath) {
  const compiledPath = join(projectRoot, compiledCssPath);
  if (!existsSync(compiledPath)) {
    return createPreviewCssReceipt(compiledCssPath, 'existing', false, false);
  }
  const css = readFileSync(compiledPath, 'utf8');
  const representative = Boolean(css.trim()) && !css.includes(WORKBENCH_PREVIEW_CSS_SNAPSHOT_MARKER);
  return createPreviewCssReceipt(compiledCssPath, 'existing', false, representative);
}

function createPreviewCssReceipt(compiledCss, provenance, fresh, representative) {
  return {
    compiledCss,
    fresh,
    provenance,
    representative,
    version: 1,
  };
}

function printPreviewCssReceipt(receipt) {
  if (!receipt) return;
  console.log(`${WORKBENCH_PREVIEW_CSS_RECEIPT_PREFIX}${JSON.stringify(receipt)}`);
}

function getTailwindProvider(workbenchTailwindConfig, shadcnConfig) {
  if (typeof workbenchTailwindConfig.provider === 'string') return workbenchTailwindConfig.provider;
  if (typeof shadcnConfig.style === 'string' || isObjectRecord(shadcnConfig.tailwind)) return 'shadcn';
  return 'tailwind';
}

function findLocalNodeBin(projectRoot, name) {
  const candidates = process.platform === 'win32'
    ? [`${name}.cmd`, `${name}.ps1`, name]
    : [name];

  let current = projectRoot;
  while (true) {
    for (const candidate of candidates) {
      const binPath = join(current, 'node_modules', '.bin', candidate);
      if (existsSync(binPath)) return binPath;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

// The project build can split its CSS into several chunk files that the built
// index.html links in document order. The compiled artifact must mirror what a
// browser loading that entry would apply, so collect every linked stylesheet
// in link order. Picking a single file by newest mtime raced same-build
// siblings and could copy a page-only chunk over the full Tailwind build.
function findBuiltCssPaths(root) {
  const distDir = join(root, 'dist');
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) fail('Missing dist/assets after build.');
  const candidates = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => join(assetsDir, file));
  if (candidates.length === 0) fail('No built CSS file found in dist/assets.');

  const entryHtmlPath = join(distDir, 'index.html');
  if (existsSync(entryHtmlPath)) {
    const candidateByName = new Map(candidates.map((path) => [basename(path), path]));
    const linked = [];
    for (const linkTag of readFileSync(entryHtmlPath, 'utf8').match(/<link\b[^>]*>/g) ?? []) {
      if (!/\brel=["']?stylesheet["']?/i.test(linkTag)) continue;
      const href = linkTag.match(/\bhref=["']?([^"' >]+)/i)?.[1];
      const resolved = href ? candidateByName.get(basename(href)) : undefined;
      if (resolved && !linked.includes(resolved)) linked.push(resolved);
    }
    if (linked.length > 0) return linked;
  }

  // No parsable entry stylesheet links: keep the historical newest-first pick.
  candidates.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  return [candidates[0]];
}

function parseTailwindThemeCss(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return {
    light: parseCssVariableBlocks(extractCssBlocks(withoutComments, ':root')),
    dark: parseCssVariableBlocks(extractCssBlocks(withoutComments, '.dark')),
    themeAliases: parseCssVariableBlocks(extractCssBlocks(withoutComments, '@theme inline')),
  };
}

function extractCssBlocks(css, selector) {
  const selectorPattern = escapeRegExp(selector).replace(/\\ /g, '\\s+');
  const pattern = new RegExp(`${selectorPattern}\\s*\\{`, 'g');
  const blocks = [];
  let match = pattern.exec(css);
  while (match) {
    const openIndex = match.index + match[0].lastIndexOf('{');
    let depth = 0;
    for (let index = openIndex; index < css.length; index += 1) {
      const char = css[index];
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(openIndex + 1, index));
        pattern.lastIndex = index + 1;
        break;
      }
    }
    match = pattern.exec(css);
  }
  return blocks;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCssVariables(block) {
  const variables = {};
  const pattern = /--([a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g;
  let match = pattern.exec(block);
  while (match) {
    const name = match[1]?.trim();
    const value = match[2]?.trim();
    if (name && value) variables[name] = value;
    match = pattern.exec(block);
  }
  return variables;
}

function parseCssVariableBlocks(blocks) {
  return blocks.reduce((variables, block) => ({
    ...variables,
    ...parseCssVariables(block),
  }), {});
}

function buildTailwindTokenRegistry(existingRegistry, parsedTheme, options) {
  const sourceTokens = Object.keys(parsedTheme.light);
  const tailwindCollection = createTailwindThemeCollection(sourceTokens, parsedTheme, options);
  const collections = [
    ...existingRegistry.collections.filter((collection) => collection.id !== tailwindCollection.id),
    tailwindCollection,
  ];

  return normalizeTailwindThemeSemanticRefs({
    schemaVersion: '0.1',
    collections,
    fieldScopes: mergeTailwindFieldScopes(existingRegistry.fieldScopes ?? {}, tailwindCollection),
    extensions: {
      ...(existingRegistry.extensions ?? {}),
      tailwind: {
        enabled: true,
        provider: options.provider,
        style: options.shadcnStyle,
        baseColor: options.shadcnBase,
        sourceCss: options.sourceCssPath,
        compiledCss: options.compiledCssPath,
        tokenCss: options.tokenCssPath,
        cssExport: 'tailwind-theme-overrides',
        lightModeId: 'light',
        darkModeId: 'dark',
        themeAliases: parsedTheme.themeAliases,
      },
    },
  });
}

function createTailwindThemeCollection(tokenNames, parsedTheme, options) {
  const groups = createTailwindGroups(tokenNames);
  const tokens = tokenNames.map((name, index) => {
    const lightValue = parsedTheme.light[name];
    const darkValue = parsedTheme.dark[name] ?? lightValue;
    const type = inferTokenType(name, lightValue);
    return {
      id: toSafeTokenId(name),
      name,
      type,
      groupId: inferGroupId(name),
      values: {
        light: { kind: 'raw', value: toTokenRawValue(type, lightValue) },
        dark: { kind: 'raw', value: toTokenRawValue(type, darkValue) },
      },
      sortOrder: index,
      extensions: {
        cssVariable: `--${name}`,
        importedFrom: options.sourceCssPath,
        source: 'tailwind',
        tailwind: {
          kind: 'theme-variables',
          cssVariable: `--${name}`,
          sourceCss: options.sourceCssPath,
        },
      },
    };
  });

  return {
    id: 'tailwind-theme',
    name: 'Tailwind Theme',
    description: 'shadcn/Tailwind theme variables imported from CSS custom properties.',
    modes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    activeMode: 'light',
    groups,
    tokens,
    extensions: {
      source: 'tailwind',
      importKind: 'tailwind-theme-css',
      tailwind: {
        kind: 'theme-variables',
        sourceCss: options.sourceCssPath,
      },
    },
  };
}

const TAILWIND_THEME_COLLECTION_ID = 'tailwind-theme';
const TAILWIND_PRIMITIVES_COLLECTION_ID = 'tailwind-primitives';
const WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID = 'workbench-semantic-color';
const WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID = 'workbench-semantic-radius';
const TAILWIND_THEME_SEMANTIC_SOURCE = 'tailwind-theme-normalizer';

const TAILWIND_THEME_COLOR_ROLES = [
  ['background', 'Background', 'surface'],
  ['foreground', 'Foreground', 'surface'],
  ['card', 'Card', 'surface'],
  ['card-foreground', 'Card foreground', 'surface'],
  ['popover', 'Popover', 'surface'],
  ['popover-foreground', 'Popover foreground', 'surface'],
  ['muted', 'Muted', 'surface'],
  ['muted-foreground', 'Muted foreground', 'surface'],
  ['primary', 'Primary', 'action'],
  ['primary-foreground', 'Primary foreground', 'action'],
  ['secondary', 'Secondary', 'action'],
  ['secondary-foreground', 'Secondary foreground', 'action'],
  ['accent', 'Accent', 'action'],
  ['accent-foreground', 'Accent foreground', 'action'],
  ['destructive', 'Destructive', 'feedback'],
  ['destructive-foreground', 'Destructive foreground', 'feedback'],
  ['border', 'Border', 'border'],
  ['input', 'Input', 'border'],
  ['ring', 'Ring', 'focus'],
  ['chart-1', 'Chart 1', 'chart'],
  ['chart-2', 'Chart 2', 'chart'],
  ['chart-3', 'Chart 3', 'chart'],
  ['chart-4', 'Chart 4', 'chart'],
  ['chart-5', 'Chart 5', 'chart'],
  ['sidebar', 'Sidebar', 'sidebar'],
  ['sidebar-foreground', 'Sidebar foreground', 'sidebar'],
  ['sidebar-primary', 'Sidebar primary', 'sidebar'],
  ['sidebar-primary-foreground', 'Sidebar primary foreground', 'sidebar'],
  ['sidebar-accent', 'Sidebar accent', 'sidebar'],
  ['sidebar-accent-foreground', 'Sidebar accent foreground', 'sidebar'],
  ['sidebar-border', 'Sidebar border', 'sidebar'],
  ['sidebar-ring', 'Sidebar ring', 'sidebar'],
].map(([id, name, groupId]) => ({ id, name, type: 'color', groupId }));
const TAILWIND_THEME_COLOR_ROLE_IDS = new Set(TAILWIND_THEME_COLOR_ROLES.map((role) => role.id));

const TAILWIND_THEME_RADIUS_ROLES = [
  { id: 'radius', name: 'Radius', type: 'dimension', groupId: 'surface' },
];

const SEMANTIC_COLOR_GROUPS = [
  ['surface', 'Surface'],
  ['text', 'Text'],
  ['border', 'Border'],
  ['action', 'Action'],
  ['feedback', 'Feedback'],
  ['focus', 'Focus'],
  ['chart', 'Chart'],
  ['sidebar', 'Sidebar'],
].map(([id, name]) => ({ id, name }));

const SEMANTIC_RADIUS_GROUPS = [
  ['control', 'Control'],
  ['surface', 'Surface'],
].map(([id, name]) => ({ id, name }));

function normalizeTailwindThemeSemanticRefs(registry) {
  const themeCollection = registry.collections.find(isTailwindThemeCollection);
  if (!themeCollection) return registry;

  const next = clonePlain(registry);
  const nextThemeCollection = next.collections.find(isTailwindThemeCollection);
  const primitiveCollection = ensureTokenCollection(next, {
    id: TAILWIND_PRIMITIVES_COLLECTION_ID,
    name: 'Tailwind Primitives',
    description: 'Raw theme and Tailwind primitive values used by semantic tokens.',
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: [],
    extensions: { source: 'tailwind-default-theme-primitives' },
  });
  const semanticColorCollection = ensureTokenCollection(next, {
    id: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID,
    name: 'Workbench Semantic Color',
    description: 'Role-based color tokens referenced by theme and component tokens.',
    modes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }],
    activeMode: 'light',
    groups: [],
    tokens: [],
    extensions: { source: 'workbench-template', layer: 'semantic', role: 'color' },
  });
  const semanticRadiusCollection = ensureTokenCollection(next, {
    id: WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID,
    name: 'Workbench Semantic Radius',
    description: 'Role-based radius tokens referenced by theme and component tokens.',
    modes: [{ id: 'base', name: 'Base' }, { id: 'compact', name: 'Compact' }, { id: 'flat', name: 'Flat' }],
    activeMode: 'base',
    groups: [],
    tokens: [],
    extensions: { source: 'workbench-template', layer: 'semantic', role: 'radius' },
  });
  ensureGroups(semanticColorCollection, SEMANTIC_COLOR_GROUPS);
  ensureGroups(semanticRadiusCollection, SEMANTIC_RADIUS_GROUPS);

  const colorRoleById = new Map(TAILWIND_THEME_COLOR_ROLES.map((role) => [role.id, role]));
  const radiusRoleById = new Map(TAILWIND_THEME_RADIUS_ROLES.map((role) => [role.id, role]));

  nextThemeCollection.tokens = nextThemeCollection.tokens.map((token) => {
    const colorRole = token.type === 'color' ? colorRoleById.get(token.id) : null;
    if (colorRole) {
      ensureSemanticThemeToken({
        primitiveCollection,
        sourceCollection: nextThemeCollection,
        sourceToken: token,
        targetCollection: semanticColorCollection,
        targetRole: colorRole,
      });
      return referenceThemeTokenToSemantic(token, semanticColorCollection.id, colorRole.id);
    }

    const radiusRole = radiusRoleById.get(token.id);
    if (radiusRole && (token.type === 'dimension' || token.type === 'string')) {
      ensureSemanticThemeToken({
        primitiveCollection,
        sourceCollection: nextThemeCollection,
        sourceToken: token,
        targetCollection: semanticRadiusCollection,
        targetModeIds: ['base', 'compact', 'flat', 'light', 'dark'],
        targetRole: { ...radiusRole, type: token.type },
      });
      return referenceThemeTokenToSemantic(token, semanticRadiusCollection.id, radiusRole.id);
    }

    return token;
  });

  next.fieldScopes = mergeSemanticTailwindThemeFieldScopes(next.fieldScopes);
  return next;
}

function isTailwindThemeCollection(collection) {
  return collection.id === TAILWIND_THEME_COLLECTION_ID ||
    collection.extensions?.source === 'tailwind' ||
    collection.extensions?.tailwind?.kind === 'theme-variables';
}

function ensureTokenCollection(registry, fallback) {
  const existing = registry.collections.find((collection) => collection.id === fallback.id);
  if (existing) {
    existing.description ??= fallback.description;
    existing.activeMode ??= fallback.activeMode;
    const existingModeIds = new Set(existing.modes.map((mode) => mode.id));
    for (const mode of fallback.modes) {
      if (existingModeIds.has(mode.id)) continue;
      existing.modes.push(clonePlain(mode));
      existingModeIds.add(mode.id);
    }
    existing.extensions = { ...(fallback.extensions ?? {}), ...(existing.extensions ?? {}) };
    return existing;
  }
  const collection = clonePlain(fallback);
  registry.collections.push(collection);
  return collection;
}

function ensureGroups(collection, groups) {
  const groupIds = new Set(collection.groups.map((group) => group.id));
  for (const group of groups) {
    if (groupIds.has(group.id)) continue;
    collection.groups.push(clonePlain(group));
    groupIds.add(group.id);
  }
}

function ensureSemanticThemeToken({
  primitiveCollection,
  sourceCollection,
  sourceToken,
  targetCollection,
  targetModeIds,
  targetRole,
}) {
  const modeIds = targetModeIds ?? targetCollection.modes.map((mode) => mode.id);
  const values = {};
  for (const modeId of modeIds) {
    if (modeId === 'flat' && targetCollection.id === WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID) {
      values[modeId] = {
        kind: 'ref',
        collectionId: primitiveCollection.id,
        tokenId: 'radius-none',
      };
      continue;
    }
    const sourceModeId = sourceToken.values[modeId] ? modeId : getEquivalentThemeSourceModeId(modeId, sourceCollection);
    const sourceValue = sourceToken.values[sourceModeId] ?? sourceToken.values.default;
    if (sourceValue?.kind === 'ref') {
      values[modeId] = { kind: 'ref', collectionId: sourceValue.collectionId, tokenId: sourceValue.tokenId };
      continue;
    }
    if (sourceValue?.kind !== 'raw') continue;
    const primitiveTokenId = getTailwindThemePrimitiveTokenId(sourceToken.id, sourceModeId);
    ensureRawPrimitiveToken(primitiveCollection, {
      groupId: getTailwindThemePrimitiveGroupId(sourceModeId, sourceToken.type),
      id: primitiveTokenId,
      name: `${targetRole.name} ${formatNameSegment(sourceModeId)}`,
      type: sourceToken.type,
      value: sourceValue.value,
    });
    values[modeId] = { kind: 'ref', collectionId: primitiveCollection.id, tokenId: primitiveTokenId };
  }
  if (Object.keys(values).length === 0) return;

  const existing = targetCollection.tokens.find((candidate) => candidate.id === targetRole.id);
  if (existing) {
    existing.name = existing.name || targetRole.name;
    existing.groupId ??= targetRole.groupId;
    existing.values = Object.fromEntries(modeIds.map((modeId) => {
      const current = existing.values[modeId];
      if (current?.kind === 'raw') {
        const primitiveTokenId = getTailwindThemePrimitiveTokenId(`${targetRole.id}-semantic`, modeId);
        ensureRawPrimitiveToken(primitiveCollection, {
          groupId: getTailwindThemePrimitiveGroupId(modeId, existing.type),
          id: primitiveTokenId,
          name: `${existing.name || targetRole.name} ${formatNameSegment(modeId)}`,
          type: existing.type,
          value: current.value,
        });
        return [modeId, { kind: 'ref', collectionId: primitiveCollection.id, tokenId: primitiveTokenId }];
      }
      return [modeId, current ?? values[modeId] ?? Object.values(values)[0]];
    }));
    return;
  }

  targetCollection.tokens.push({
    id: targetRole.id,
    name: targetRole.name,
    type: targetRole.type,
    groupId: targetRole.groupId,
    values: Object.fromEntries(modeIds.map((modeId) => [modeId, values[modeId] ?? Object.values(values)[0]])),
    sortOrder: nextSortOrder(targetCollection.tokens),
    extensions: { source: TAILWIND_THEME_SEMANTIC_SOURCE, layer: 'semantic' },
  });
}

function referenceThemeTokenToSemantic(token, collectionId, tokenId) {
  return {
    ...token,
    values: Object.fromEntries(Object.keys(token.values).map((modeId) => [
      modeId,
      { kind: 'ref', collectionId, tokenId },
    ])),
    extensions: {
      ...(token.extensions ?? {}),
      tailwindThemeRef: { collectionId, tokenId },
    },
  };
}

function ensureRawPrimitiveToken(collection, token) {
  if (!collection.groups.some((group) => group.id === token.groupId)) {
    collection.groups.push({ id: token.groupId, name: formatNameSegment(token.groupId) });
  }
  if (collection.tokens.some((candidate) => candidate.id === token.id)) return;
  collection.tokens.push({
    id: token.id,
    name: token.name,
    type: token.type,
    groupId: token.groupId,
    values: { default: { kind: 'raw', value: clonePlain(token.value) } },
    sortOrder: nextSortOrder(collection.tokens),
    extensions: { source: TAILWIND_THEME_SEMANTIC_SOURCE, layer: 'primitive' },
  });
}

function getEquivalentThemeSourceModeId(modeId, collection) {
  if (modeId === 'base' || modeId === 'compact') return collection.activeMode ?? collection.modes[0]?.id ?? 'light';
  return modeId;
}

function getTailwindThemePrimitiveTokenId(tokenId, modeId) {
  return `theme-${tokenId}-${modeId}`.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
}

function getTailwindThemePrimitiveGroupId(modeId, type) {
  if (type === 'color') return `theme-${modeId}`;
  if (type === 'dimension') return 'theme-radius';
  return 'theme';
}

function mergeSemanticTailwindThemeFieldScopes(fieldScopes) {
  const next = { ...(fieldScopes ?? {}) };
  next.bgColor = mergeScopes(next.bgColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.textColor = mergeScopes(next.textColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.borderColor = mergeScopes(next.borderColor, [{ collectionId: WORKBENCH_SEMANTIC_COLOR_COLLECTION_ID }]);
  next.borderRadius = mergeScopes(next.borderRadius, [{ collectionId: WORKBENCH_SEMANTIC_RADIUS_COLLECTION_ID }]);
  return next;
}

function createTailwindGroups(tokenNames) {
  const available = new Set(tokenNames.map(inferGroupId));
  return TAILWIND_GROUPS.filter((group) => available.has(group.id));
}

const TAILWIND_GROUPS = [
  { id: 'surface', name: 'Surface' },
  { id: 'action', name: 'Action' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'structure', name: 'Structure' },
  { id: 'chart', name: 'Chart' },
  { id: 'sidebar', name: 'Sidebar' },
  { id: 'radius', name: 'Radius' },
  { id: 'theme', name: 'Theme' },
];

function inferGroupId(name) {
  if (name === 'radius' || name.startsWith('radius-')) return 'radius';
  if (name.startsWith('chart-')) return 'chart';
  if (name.startsWith('sidebar')) return 'sidebar';
  if (['primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'accent', 'accent-foreground', 'ring'].includes(name)) {
    return 'action';
  }
  if (['destructive'].includes(name)) return 'feedback';
  if (['border', 'input'].includes(name)) return 'structure';
  if (['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'muted', 'muted-foreground'].includes(name)) {
    return 'surface';
  }
  return 'theme';
}

function inferTokenType(name, value) {
  if (name === 'radius' || /radius/.test(name)) return parseUnitValue(value) ? 'dimension' : 'string';
  if (TAILWIND_THEME_COLOR_ROLE_IDS.has(name)) return 'color';
  if (isCssColor(value)) return 'color';
  return parseUnitValue(value) ? 'dimension' : 'string';
}

function toTokenRawValue(type, value) {
  if (type === 'dimension') return parseUnitValue(value) ?? value;
  return value;
}

function parseUnitValue(value) {
  const match = String(value).trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw)$/);
  if (!match) return null;
  return { value: Number(match[1]), unit: match[2] };
}

function isCssColor(value) {
  return /^(#|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lch\(|lab\(|color\(|color-mix\()/i.test(String(value).trim());
}

function toSafeTokenId(value) {
  const slug = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return slug || 'token';
}

function mergeTailwindFieldScopes(existingScopes, collection) {
  const collectionScope = [{ collectionId: collection.id }];
  const colorScopes = collection.groups
    .filter((group) => group.id !== 'radius')
    .map((group) => ({ collectionId: collection.id, groupId: group.id }));
  const radiusScopes = collection.groups.some((group) => group.id === 'radius')
    ? [{ collectionId: collection.id, groupId: 'radius' }]
    : [];

  return {
    ...existingScopes,
    bgColor: mergeScopes(existingScopes.bgColor, [...collectionScope, ...colorScopes]),
    textColor: mergeScopes(existingScopes.textColor, [...collectionScope, ...colorScopes]),
    borderColor: mergeScopes(existingScopes.borderColor, [...collectionScope, ...colorScopes]),
    borderRadius: mergeScopes(existingScopes.borderRadius, [...collectionScope, ...radiusScopes]),
  };
}

function mergeScopes(existing = [], additions) {
  const keys = new Set(existing.map(scopeKey));
  const next = [...existing];
  for (const scope of additions) {
    if (keys.has(scopeKey(scope))) continue;
    next.push(scope);
  }
  return next;
}

function scopeKey(scope) {
  return `${scope.collectionId}:${scope.groupId ?? ''}`;
}

function nextSortOrder(tokens) {
  return Math.max(-1, ...tokens.map((token) => token.sortOrder)) + 1;
}

function formatNameSegment(value) {
  return String(value)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function clonePlain(value) {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function updateWorkbenchConfig(configPath, options) {
  if (!existsSync(configPath)) return;
  const config = readJsonIfExists(configPath);
  config.paths = {
    ...(config.paths ?? {}),
    tokenCss: options.tokenCssPath,
  };
  config.extensions = {
    ...(config.extensions ?? {}),
    tailwind: {
      enabled: true,
      provider: options.provider,
      style: options.shadcnStyle,
      sourceCss: options.sourceCssPath,
      compiledCss: options.compiledCssPath,
      tokenCss: options.tokenCssPath,
    },
  };
  writeJson(configPath, config);
}

function createEmptyRegistry() {
  return {
    schemaVersion: '0.1',
    collections: [],
    fieldScopes: {},
    extensions: {},
  };
}

function fail(message) {
  console.error(`workbench-tailwind-sync: ${message}`);
  process.exit(1);
}

printPreviewCssReceipt(main());
