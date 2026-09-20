#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const projectName = getRequiredArg(args, 'project');
  const manifestPath = args.manifest
    ? path.resolve(ROOT, args.manifest)
    : path.join(ROOT, 'projects', projectName, '.workbench', 'figma-library.publisher.json');
  const dryRun = Boolean(args['dry-run']);
  const force = Boolean(args.force);

  const projectRoot = path.join(ROOT, 'projects', projectName);
  const workbenchRoot = path.join(projectRoot, '.workbench');
  assertDirectory(projectRoot, `Project not found: ${projectRoot}`);
  assertDirectory(workbenchRoot, `Workbench metadata not found: ${workbenchRoot}`);

  const manifest = readJson(manifestPath);
  validateManifest(manifest);

  const componentRoot = path.join(projectRoot, manifest.library?.componentRoot ?? 'src/libraries/local/components');
  const componentIndexPath = path.join(componentRoot, 'index.ts');
  const libraryIndexPath = path.join(projectRoot, manifest.library?.indexFile ?? 'src/libraries/local/index.ts');
  const componentsPath = path.join(workbenchRoot, 'components.json');
  const propRegistryPath = path.join(workbenchRoot, 'prop-registry.json');
  const cssPath = path.join(componentRoot, manifest.library?.cssFile ?? 'local.css');

  const componentsRegistry = readJson(componentsPath);
  const propRegistry = readJson(propRegistryPath, { schemaVersion: 1, groups: {}, components: {} });
  const planned = [];

  for (const component of manifest.components) {
    const plan = planComponent({
      component,
      componentRoot,
      cssPath,
      dryRun,
      force,
      projectRoot,
    });
    planned.push(plan);
  }

  if (dryRun) {
    printPlan(planned);
    return;
  }

  fs.mkdirSync(componentRoot, { recursive: true });

  for (const plan of planned) {
    writeFileIfAllowed(plan.componentPath, plan.componentSource, force);
    writeFileIfAllowed(plan.storyPath, plan.storySource, force);
    appendCssBlock(cssPath, plan.cssSource);
    registerComponent(componentsRegistry, manifest, plan);
    registerProps(propRegistry, plan);
  }

  updateComponentIndex(componentIndexPath, planned);
  ensureLibraryIndex(libraryIndexPath);
  writeJson(componentsPath, componentsRegistry);
  writeJson(propRegistryPath, propRegistry);

  console.log(`Published ${planned.length} component(s) to ${projectName}`);
  for (const plan of planned) {
    console.log(`- ${plan.publicName}: ${path.relative(ROOT, plan.componentPath)}`);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
node scripts/figma-publisher/publish-library.mjs --project "Figma Comp Test" [--manifest path] [--dry-run] [--force]

The manifest path defaults to:
projects/<project>/.workbench/figma-library.publisher.json`);
}

function getRequiredArg(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing required --${key}`);
  return value;
}

function assertDirectory(dir, message) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error(message);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`JSON file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') throw new Error('Manifest must be an object');
  if (!Array.isArray(manifest.components) || manifest.components.length === 0) {
    throw new Error('Manifest must include at least one component');
  }
  for (const component of manifest.components) {
    if (!component.name || !component.exportName) {
      throw new Error('Each component needs name and exportName');
    }
    if (!Array.isArray(component.props) || component.props.length === 0) {
      throw new Error(`Component ${component.name} needs props`);
    }
  }
}

function planComponent({ component, componentRoot, cssPath, dryRun, force, projectRoot }) {
  const publicName = component.name;
  const exportName = component.exportName;
  const fileBase = component.fileBase ?? exportName.replace(/^Figma/, '');
  const componentPath = path.join(componentRoot, `${fileBase}.tsx`);
  const storyPath = path.join(componentRoot, `${fileBase}.stories.tsx`);
  if (!dryRun && !force) {
    assertWritableNewFile(componentPath);
    assertWritableNewFile(storyPath);
  }

  const sourceFile = normalizeProjectPath(path.relative(projectRoot, componentPath));
  const storySourceFile = normalizeProjectPath(path.relative(projectRoot, storyPath));
  const registryId = `local-${sourceFile.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()}-${exportName.toLowerCase()}`;
  const cssClass = component.cssClass ?? `figma-${kebab(publicName)}`;
  const defaults = Object.fromEntries(component.props.map((prop) => [prop.name, prop.default]));
  const typeName = `${exportName}Props`;

  return {
    component,
    componentPath,
    componentSource: renderComponentSource({ component, cssClass, defaults, exportName, typeName }),
    cssPath,
    cssSource: renderCssSource({ component, cssClass }),
    defaults,
    exportName,
    fileBase,
    propRegistry: renderPropRegistry(component),
    publicName,
    registryId,
    sourceFile,
    storyPath,
    storySource: renderStorySource({ component, defaults, exportName, fileBase }),
    storySourceFile,
    typeName,
  };
}

function assertWritableNewFile(filePath) {
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite ${filePath}. Re-run with --force to replace generated files.`);
  }
}

function writeFileIfAllowed(filePath, source, force) {
  if (!force && fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite ${filePath}. Re-run with --force.`);
  }
  fs.writeFileSync(filePath, source);
}

function renderComponentSource({ component, cssClass, exportName, typeName }) {
  const textProp = component.props.find((prop) => prop.role === 'content') ?? component.props.find((prop) => prop.type === 'string');
  const optionProps = component.props.filter((prop) => Array.isArray(prop.options) && prop.options.length > 0);
  const propTypes = component.props.map((prop) => renderPropType(prop)).join('\n');
  const destructured = component.props
    .map((prop) => `  ${prop.name} = ${formatLiteral(prop.default)},`)
    .join('\n');
  const classNames = [
    `'${cssClass}'`,
    ...optionProps.map((prop) => `\`${cssClass}--${kebab(prop.name)}-\${${prop.name}}\``),
    "className",
  ].join(',\n        ');
  const tag = component.defaultElement ?? 'div';
  const contentExpression = textProp ? textProp.name : 'children';

  return `import type { HTMLAttributes, ReactNode } from 'react';
import './local.css';

export type ${typeName} = HTMLAttributes<HTMLElement> & {
${propTypes}
  children?: ReactNode;
};

export function ${exportName}({
${destructured}
  children,
  className = '',
  ...props
}: ${typeName}) {
  return (
    <${tag}
      {...props}
      className={[
        ${classNames}
      ].filter(Boolean).join(' ')}
    >
      {children ?? ${contentExpression}}
    </${tag}>
  );
}

export default ${exportName};
`;
}

function renderPropType(prop) {
  const optional = prop.required ? '' : '?';
  if (Array.isArray(prop.options) && prop.options.length > 0) {
    return `  ${prop.name}${optional}: ${prop.options.map((option) => formatLiteral(option)).join(' | ')};`;
  }
  if (prop.type === 'boolean') return `  ${prop.name}${optional}: boolean;`;
  if (prop.type === 'number') return `  ${prop.name}${optional}: number;`;
  return `  ${prop.name}${optional}: ReactNode;`;
}

function renderStorySource({ component, defaults, exportName, fileBase }) {
  const optionProps = component.props.filter((prop) => Array.isArray(prop.options) && prop.options.length > 0);
  const constants = optionProps.map((prop) => (
    `const ${constantName(prop.name)} = ${JSON.stringify(prop.options)} as const;`
  )).join('\n');
  const argTypes = component.props.map((prop) => renderArgType(prop)).join(',\n    ');
  const renderProps = component.props.map((prop) => renderStoryProp(prop)).join('\n      ');

  return `import { ${exportName} } from './${fileBase}';

type Args = Record<string, boolean | number | string>;

${constants}

const DEFAULT_PROPS = ${JSON.stringify(defaults, null, 2)} as const;

const meta = {
  title: 'Local/${component.name}',
  component: ${exportName},
  args: DEFAULT_PROPS,
  argTypes: {
    ${argTypes},
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Default = {
  name: '${component.name}',
  render: (args: Args) => (
    <${exportName}
      ${renderProps}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
`;
}

function renderArgType(prop) {
  if (Array.isArray(prop.options) && prop.options.length > 0) {
    return `${prop.name}: { control: 'select', options: ${constantName(prop.name)} }`;
  }
  if (prop.type === 'boolean') return `${prop.name}: { control: 'boolean' }`;
  if (prop.type === 'number') return `${prop.name}: { control: 'number' }`;
  return `${prop.name}: { control: 'text' }`;
}

function renderStoryProp(prop) {
  const fallback = formatLiteral(prop.default);
  if (Array.isArray(prop.options) && prop.options.length > 0) {
    return `${prop.name}={asOption(args.${prop.name}, ${constantName(prop.name)}, ${fallback})}`;
  }
  if (prop.type === 'boolean') return `${prop.name}={asBoolean(args.${prop.name})}`;
  if (prop.type === 'number') return `${prop.name}={asNumber(args.${prop.name}, ${fallback})}`;
  return `${prop.name}={asText(args.${prop.name}, ${fallback})}`;
}

function renderCssSource({ component, cssClass }) {
  const commentText = toCssCommentText(component.name);
  const declarations = component.css?.base ?? {
    color: 'var(--ds-token-theme-text-base-primary, #14151a)',
    fontFamily: "var(--wb-font-body, ui-sans-serif, system-ui, sans-serif)",
  };
  const base = [
    '',
    `/* ${commentText} generated by scripts/figma-publisher. */`,
    `.${cssClass} {`,
    ...Object.entries(declarations).map(([property, value]) => `  ${toCssProperty(property)}: ${value};`),
    '}',
  ];
  const variants = [];
  for (const prop of component.props) {
    if (!Array.isArray(prop.options)) continue;
    for (const option of prop.options) {
      const declarationsForOption = prop.css?.[option] ?? component.css?.variants?.[prop.name]?.[option];
      if (!declarationsForOption) continue;
      variants.push(`.${cssClass}--${kebab(prop.name)}-${kebab(option)} {`);
      for (const [property, value] of Object.entries(declarationsForOption)) {
        variants.push(`  ${toCssProperty(property)}: ${value};`);
      }
      variants.push('}');
    }
  }
  return `${[...base, ...variants, `/* End ${commentText} generated by scripts/figma-publisher. */`].join('\n')}\n`;
}

function renderPropRegistry(component) {
  return {
    props: Object.fromEntries(component.props.map((prop, index) => [
      prop.name,
      {
        group: prop.group ?? inferPropGroup(prop),
        label: prop.label ?? labelize(prop.name),
        order: prop.order ?? (index + 1) * 10,
        picker: prop.picker ?? (Array.isArray(prop.options) && prop.options.length > 0 ? 'none' : prop.type === 'string' ? 'token' : 'none'),
        ...(prop.tokenTypes ? { tokenTypes: prop.tokenTypes } : prop.type === 'string' && !Array.isArray(prop.options) ? { tokenTypes: ['string'] } : {}),
        ...(prop.assetKinds ? { assetKinds: prop.assetKinds } : {}),
      },
    ])),
  };
}

function appendCssBlock(cssPath, cssSource) {
  const marker = firstGeneratedComment(cssSource);
  const current = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const start = findExistingGeneratedCssBlockStart(current, cssSource, marker);
  if (start >= 0) {
    const end = findGeneratedCssBlockEnd(current, start, cssSource);
    fs.writeFileSync(cssPath, `${current.slice(0, start).trimEnd()}\n${cssSource.trimEnd()}\n${current.slice(end).trimStart()}`);
    return;
  }
  fs.writeFileSync(cssPath, `${current.trimEnd()}\n${cssSource}`);
}

function firstGeneratedComment(cssSource) {
  return cssSource.split('\n').find((line) => line.includes('generated by scripts/figma-publisher')) ?? '';
}

function findExistingGeneratedCssBlockStart(current, cssSource, marker) {
  if (!current) return -1;
  if (marker && current.includes(marker)) return current.indexOf(marker);

  const selector = firstGeneratedSelector(cssSource);
  if (!selector) return -1;
  const selectorIndex = current.indexOf(`\n${selector}`);
  const startOfSelector = selectorIndex >= 0 ? selectorIndex + 1 : current.startsWith(selector) ? 0 : -1;
  if (startOfSelector < 0) return -1;

  const commentStart = current.lastIndexOf('/* ', startOfSelector);
  if (commentStart < 0) return -1;
  const prelude = current.slice(commentStart, startOfSelector);
  return prelude.includes('generated by scripts/figma-publisher') ? commentStart : -1;
}

function findGeneratedCssBlockEnd(current, blockStart, cssSource) {
  const explicitEnd = findGeneratedCssEndMarker(current, blockStart);
  if (explicitEnd >= 0) return explicitEnd;

  const selectorEnd = findGeneratedCssSelectorBlockEnd(current, blockStart, cssSource);
  if (selectorEnd >= 0) return selectorEnd;

  const nextMarker = current.indexOf('\n/* ', blockStart + 1);
  const generatedMarker = nextMarker >= 0 && current.slice(nextMarker, nextMarker + 160).includes('generated by scripts/figma-publisher')
    ? nextMarker
    : -1;
  return generatedMarker >= 0 ? generatedMarker : current.length;
}

function firstGeneratedSelector(cssSource) {
  return cssSource
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('.') && line.endsWith('{')) ?? '';
}

function findGeneratedCssEndMarker(current, blockStart) {
  const markerStart = current.indexOf('/* End ', blockStart);
  if (markerStart < 0) return -1;
  const nextStart = findNextGeneratedCssStartMarker(current, blockStart + 1);
  if (nextStart >= 0 && markerStart > nextStart) return -1;
  const lineEnd = current.indexOf('\n', markerStart);
  const end = lineEnd >= 0 ? lineEnd : current.length;
  const line = current.slice(markerStart, end);
  if (!line.includes('generated by scripts/figma-publisher') || !line.trimEnd().endsWith('*/')) return -1;
  return current[end] === '\n' ? end + 1 : end;
}

function findNextGeneratedCssStartMarker(current, searchStart) {
  let cursor = searchStart;
  while (cursor < current.length) {
    const markerStart = current.indexOf('\n/* ', cursor);
    if (markerStart < 0) return -1;
    const lineStart = markerStart + 1;
    const lineEnd = current.indexOf('\n', lineStart);
    const line = current.slice(lineStart, lineEnd >= 0 ? lineEnd : current.length);
    if (!line.startsWith('/* End ') && line.includes('generated by scripts/figma-publisher')) return lineStart;
    cursor = lineStart + 3;
  }
  return -1;
}

function findGeneratedCssSelectorBlockEnd(current, blockStart, cssSource) {
  const selectors = generatedCssSelectors(cssSource);
  if (selectors.length === 0) return -1;

  let cursor = blockStart;
  let lastEnd = -1;
  for (const selector of selectors) {
    const selectorIndex = current.indexOf(selector, cursor);
    if (selectorIndex < 0) return lastEnd;
    const openBrace = current.indexOf('{', selectorIndex + selector.length);
    if (openBrace < 0) return lastEnd;
    const end = findCssRuleEnd(current, openBrace);
    if (end < 0) return lastEnd;
    cursor = end;
    lastEnd = end;
  }
  return lastEnd;
}

function generatedCssSelectors(cssSource) {
  return cssSource
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('.') && line.endsWith('{'))
    .map((line) => line.slice(0, -1).trim());
}

function findCssRuleEnd(source, openBrace) {
  let depth = 0;
  let quote = '';
  let inComment = false;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function toCssCommentText(value) {
  return String(value)
    .replace(/\*\//g, '* /')
    .replace(/[\r\n]+/g, ' ')
    .trim() || 'Component';
}

function registerComponent(registry, manifest, plan) {
  registry.schemaVersion ??= '0.1';
  registry.components ??= [];
  registry.extensions ??= {};
  registry.extensions.libraries ??= {};
  const libraryId = manifest.library?.id ?? 'local';
  registry.extensions.libraries[libraryId] ??= {
    id: libraryId,
    name: manifest.library?.name ?? 'Local Library',
    kind: 'project-local',
    sourcePath: manifest.library?.sourcePath ?? 'src/libraries/local',
    snapshotRoot: manifest.library?.snapshotRoot ?? 'src/libraries/local',
    updatePolicy: 'manual',
    mergePolicy: 'project-wins',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const entry = {
    id: plan.registryId,
    name: plan.publicName,
    sourceFile: plan.sourceFile,
    componentSetId: `component-set-${libraryId}`,
    variants: [],
    extensions: {
      source: libraryId,
      importedFrom: plan.sourceFile,
      importName: plan.exportName,
      sourceExportName: plan.exportName,
      sourceTruth: 'project-local',
      currentSourceFile: plan.sourceFile,
      syncStatus: 'pinned',
      libraryId,
      librarySourcePath: manifest.library?.sourcePath ?? 'src/libraries/local',
      librarySnapshotRoot: manifest.library?.snapshotRoot ?? 'src/libraries/local',
      libraryUpdatePolicy: 'manual',
      storyFormat: 'csf',
      storySourceFile: plan.storySourceFile,
      figmaPublisher: {
        source: 'manifest',
        manifestVersion: manifest.schemaVersion ?? 1,
      },
    },
  };
  registry.components = registry.components.filter((component) => component.id !== entry.id && component.name !== entry.name);
  registry.components.push(entry);
}

function registerProps(registry, plan) {
  registry.schemaVersion ??= 1;
  registry.groups ??= {};
  registry.components ??= {};
  for (const [id, group] of Object.entries({
    content: { label: 'Content', order: 10 },
    appearance: { label: 'Appearance', order: 20 },
    typography: { label: 'Typography', order: 30 },
    behavior: { label: 'Behavior', order: 40 },
    accessibility: { label: 'Accessibility', order: 50 },
  })) {
    registry.groups[id] ??= group;
  }
  registry.components[plan.publicName] = plan.propRegistry;
  registry.components[plan.exportName] = plan.propRegistry;
}

function updateComponentIndex(indexPath, planned) {
  const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const lines = current.split('\n');
  const next = [...lines];
  for (const plan of planned) {
    const exportLine = `export { ${plan.exportName} } from './${plan.fileBase}';`;
    const typeLine = `export type { ${plan.typeName} } from './${plan.fileBase}';`;
    if (!current.includes(exportLine)) next.push(exportLine);
    if (!current.includes(typeLine)) next.push(typeLine);
  }
  fs.writeFileSync(indexPath, `${next.join('\n').trim()}\n`);
}

function ensureLibraryIndex(indexPath) {
  if (fs.existsSync(indexPath)) return;
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, "export * from './components';\n");
}

function printPlan(planned) {
  console.log(`Dry run: ${planned.length} component(s)`);
  for (const plan of planned) {
    console.log(`- ${plan.publicName}`);
    console.log(`  component: ${path.relative(ROOT, plan.componentPath)}`);
    console.log(`  story: ${path.relative(ROOT, plan.storyPath)}`);
    console.log(`  sourceFile: ${plan.sourceFile}`);
    console.log(`  props: ${Object.keys(plan.propRegistry.props).join(', ')}`);
  }
}

function inferPropGroup(prop) {
  if (prop.role === 'content' || ['content', 'label', 'text', 'children'].includes(prop.name)) return 'content';
  if (['variant', 'tone', 'size', 'shape', 'color', 'weight', 'align'].includes(prop.name)) return 'appearance';
  if (['disabled', 'selected', 'checked', 'truncate'].includes(prop.name)) return 'behavior';
  return 'appearance';
}

function formatLiteral(value) {
  return JSON.stringify(value);
}

function labelize(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function constantName(value) {
  return `${value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase()}_OPTIONS`;
}

function kebab(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeProjectPath(value) {
  return value.split(path.sep).join('/');
}

function toCssProperty(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
