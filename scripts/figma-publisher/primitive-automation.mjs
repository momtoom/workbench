import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '../..');
const DEFAULT_PROJECT = 'Figma Comp Test';
const SPEC_DIR_NAME = 'figma-primitive-specs';

const AXIS_PROP_NAMES = new Map([
  ['Color', 'color'],
  ['Divider', 'divider'],
  ['Outline', 'outline'],
  ['Range', 'range'],
  ['Selected', 'selected'],
  ['Shape', 'shape'],
  ['Size', 'size'],
  ['State', 'state'],
  ['Style', 'styleVariant'],
  ['Target', 'target'],
  ['Tone', 'tone'],
  ['Type', 'typeVariant'],
]);

const args = parseArgs(process.argv.slice(2));
const command = args.command ?? 'plan';
const projectName = args.options.project ?? DEFAULT_PROJECT;
const projectRoot = path.join(ROOT, 'projects', projectName);
const workbenchRoot = path.join(projectRoot, '.workbench');
const componentDir = path.join(projectRoot, 'src/libraries/local/components');

try {
  switch (command) {
    case 'plan':
      runPlan();
      break;
    case 'write-specs':
      runWriteSpecs();
      break;
    case 'audit':
      runAudit();
      break;
    case 'scaffold':
      runScaffold();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      fail(`Unknown command "${command}". Run with "help" for usage.`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

function runPlan() {
  const plan = buildPlan();
  if (args.options.json) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  printPlan(plan);
}

function runWriteSpecs() {
  const plan = buildPlan();
  const specDir = path.join(workbenchRoot, SPEC_DIR_NAME);
  const includeImplemented = Boolean(args.options.all);
  const write = Boolean(args.options.write);
  const replace = Boolean(args.options.replace);
  const selected = args.options.component ? normalizeName(args.options.component) : null;
  const candidates = plan.components.filter((component) => {
    if (selected && normalizeName(component.code.fileBase) !== selected && normalizeName(component.name) !== selected) {
      return false;
    }
    if (includeImplemented) return true;
    return component.status !== 'implemented' && component.status !== 'implemented-related';
  });

  if (write) fs.mkdirSync(specDir, { recursive: true });

  const results = candidates.map((component) => {
    const spec = createSpec(component, plan.source);
    const targetPath = path.join(specDir, `${component.code.fileBase}.spec.json`);
    const exists = fs.existsSync(targetPath);
    if (!write) return { action: exists ? 'would-skip-existing' : 'would-create', path: targetPath, spec };
    if (exists && !replace) return { action: 'skipped-existing', path: targetPath, spec };
    writeJson(targetPath, spec);
    return { action: exists ? 'replaced' : 'created', path: targetPath, spec };
  });

  for (const result of results) {
    console.log(`${result.action}: ${path.relative(ROOT, result.path)}`);
  }
  console.log(`${write ? 'Wrote' : 'Planned'} ${results.length} primitive spec file(s).`);
}

function runAudit() {
  const checks = [
    {
      label: 'Story prop order',
      command: ['node', 'scripts/audit-story-prop-order.mjs', path.relative(ROOT, componentDir)],
      blocking: Boolean(args.options.strictOrder),
    },
    {
      label: 'Story controls',
      command: ['node', 'scripts/audit-story-controls.mjs', path.relative(ROOT, componentDir)],
      blocking: true,
    },
    {
      label: 'Design sourceInsert props',
      command: ['node', 'scripts/audit-design-props.mjs', path.relative(ROOT, path.join(workbenchRoot, 'components.json'))],
      blocking: true,
    },
  ];

  let failed = false;
  for (const check of checks) {
    console.log(`\n> ${check.label}`);
    console.log(`$ ${check.command.join(' ')}`);
    const result = spawnSync(check.command[0], check.command.slice(1), {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (result.stdout.trim()) console.log(result.stdout.trim());
    if (result.stderr.trim()) console.error(result.stderr.trim());
    if (result.status !== 0 && check.blocking) {
      failed = true;
    } else if (result.status !== 0) {
      console.log(`warning-only: ${check.label} failed. Pass --strict-order to make this blocking.`);
    }
  }

  console.log('\n> Numeric Inspector props');
  const numericAudit = auditNumericInspectorProps();
  if (numericAudit.issues.length === 0) {
    console.log(numericAudit.checked === 0
      ? 'No numeric story controls found.'
      : `Numeric Inspector props passed (${numericAudit.checked} prop(s)).`);
  } else {
    failed = true;
    console.log(`Numeric Inspector props found ${numericAudit.issues.length} issue(s).`);
    for (const issue of numericAudit.issues) {
      console.log(`- ${issue.story} :: ${issue.prop}: ${issue.message}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
    console.log('\nPrimitive audit failed. Fix the reported contract gaps before generating more components.');
  } else {
    console.log('\nPrimitive audit passed.');
  }
}

function auditNumericInspectorProps() {
  const issues = [];
  let checked = 0;
  if (!fs.existsSync(componentDir)) return { checked, issues };

  const storyFiles = fs.readdirSync(componentDir)
    .filter((entry) => entry.endsWith('.stories.tsx'))
    .sort((left, right) => left.localeCompare(right));

  for (const storyFile of storyFiles) {
    const storyPath = path.join(componentDir, storyFile);
    const storySource = fs.readFileSync(storyPath, 'utf8');
    const numericProps = findNumericControlProps(storySource);
    if (numericProps.length === 0) continue;

    const sourceFile = storyFile.replace(/\.stories\.tsx$/, '.tsx');
    const sourcePath = path.join(componentDir, sourceFile);
    const relativeStory = path.relative(ROOT, storyPath);
    checked += numericProps.length;

    if (!fs.existsSync(sourcePath)) {
      for (const prop of numericProps) {
        issues.push({
          message: `missing source file ${sourceFile}`,
          prop,
          story: relativeStory,
        });
      }
      continue;
    }

    const source = fs.readFileSync(sourcePath, 'utf8');
    if (!storySource.includes('Number.parseFloat')) {
      issues.push({
        message: 'story number controls should parse string values with Number.parseFloat',
        prop: numericProps.join(', '),
        story: relativeStory,
      });
    }
    if (!source.includes('Number.parseFloat')) {
      issues.push({
        message: 'component runtime should normalize string numeric values',
        prop: numericProps.join(', '),
        story: relativeStory,
      });
    }

    for (const prop of numericProps) {
      const propType = findPropType(source, prop);
      if (!propType) {
        issues.push({
          message: 'source prop declaration not found',
          prop,
          story: relativeStory,
        });
        continue;
      }
      if (!acceptsStringNumericValue(propType, source)) {
        issues.push({
          message: `source prop type "${propType}" should accept number | string for Inspector values`,
          prop,
          story: relativeStory,
        });
      }
    }
  }

  return { checked, issues };
}

function findNumericControlProps(storySource) {
  const props = new Set();
  const numericControlPattern = /([A-Za-z_$][\w$]*)\s*:\s*\{\s*control\s*:\s*(?:(['"])number\2|\{\s*type\s*:\s*(['"])number\3)/g;
  let match = numericControlPattern.exec(storySource);
  while (match) {
    props.add(match[1]);
    match = numericControlPattern.exec(storySource);
  }
  return [...props].sort((left, right) => left.localeCompare(right));
}

function findPropType(source, propName) {
  const propPattern = new RegExp(`^\\s*${escapeRegExp(propName)}\\??:\\s*([^;\\n]+);`, 'm');
  return propPattern.exec(source)?.[1]?.trim() ?? null;
}

function acceptsStringNumericValue(propType, source) {
  if (/\bstring\b/.test(propType)) return true;
  if (/Numeric(?:Value)?\b/.test(propType)) {
    return /number\s*\|\s*string|string\s*\|\s*number/.test(source);
  }
  return false;
}

function runScaffold() {
  const componentArg = args.options.component;
  if (!componentArg) fail('scaffold requires --component <ComponentName>.');

  const specPath = resolveSpecPath(componentArg);
  if (!fs.existsSync(specPath)) {
    fail(`Spec not found: ${path.relative(ROOT, specPath)}. Run write-specs first.`);
  }

  const spec = readJson(specPath);
  if (spec.status !== 'approved' && !args.options.allowDraft) {
    fail(`Spec status is "${spec.status}". Set it to "approved" after Figma review, or pass --allow-draft for throwaway scaffold.`);
  }

  const plan = buildPlan();
  const component = plan.components.find((entry) => entry.code.fileBase === spec.code.fileBase)
    ?? createComponentPlanFromSpec(spec);
  if (component.blockedBy?.length > 0) {
    fail(`Cannot scaffold ${component.name}; missing child component(s): ${component.blockedBy.join(', ')}.`);
  }

  const files = renderScaffoldFiles(component, spec);
  const write = Boolean(args.options.write);
  const overwrite = Boolean(args.options.overwrite);
  for (const file of files) {
    const exists = fs.existsSync(file.path);
    if (exists && !overwrite) {
      console.log(`skip existing: ${path.relative(ROOT, file.path)}`);
      continue;
    }
    if (!write) {
      console.log(`${exists ? 'would-overwrite' : 'would-create'}: ${path.relative(ROOT, file.path)}`);
      continue;
    }
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.contents, 'utf8');
    console.log(`${exists ? 'overwrote' : 'created'}: ${path.relative(ROOT, file.path)}`);
  }

  console.log(write
    ? 'Scaffold files written. Now implement anatomy/interactions, update registry/prop-registry, and run audit.'
    : 'Dry run complete. Pass --write to create files.');
}

function buildPlan() {
  const indexPath = path.join(workbenchRoot, 'figma-library.index.json');
  const componentRegistryPath = path.join(workbenchRoot, 'components.json');
  const propRegistryPath = path.join(workbenchRoot, 'prop-registry.json');
  const automationConfigPath = path.join(workbenchRoot, 'figma-primitive-automation.json');
  const index = readJson(indexPath);
  const componentRegistry = readJson(componentRegistryPath);
  const propRegistry = readJson(propRegistryPath);
  const automationConfig = fs.existsSync(automationConfigPath) ? readJson(automationConfigPath) : {};

  const existing = collectExisting(componentRegistry, propRegistry);
  const aliases = automationConfig.aliases ?? {};
  const dependencies = automationConfig.dependencies ?? {};
  const candidates = collectCandidates(index);
  const initialComponents = candidates.map((candidate) => {
    const code = codeNamesFor(candidate.name);
    const aliasTarget = aliases[candidate.name] ? codeNamesFor(aliases[candidate.name]) : null;
    const exactStatus = getImplementationStatus(code, existing);
    const aliasStatus = aliasTarget ? getImplementationStatus(aliasTarget, existing) : null;
    const status = exactStatus.complete
      ? 'implemented'
      : aliasStatus?.complete
        ? 'implemented-related'
        : exactStatus.any
          ? 'partial'
          : 'missing';
    const missing = exactStatus.complete ? [] : exactStatus.missing;
    return {
      ...candidate,
      aliasTarget: aliasTarget ? {
        displayName: aliases[candidate.name],
        fileBase: aliasTarget.fileBase,
        exportName: aliasTarget.exportName,
      } : null,
      code,
      implementation: {
        sourceFile: exactStatus.sourceFile,
        storyFile: exactStatus.storyFile,
        registry: exactStatus.registry,
        propRegistry: exactStatus.propRegistry,
      },
      missing,
      status,
    };
  });
  const componentByName = new Map();
  for (const component of initialComponents) {
    componentByName.set(normalizeName(component.name), component);
    componentByName.set(normalizeName(component.code.fileBase), component);
  }
  const components = initialComponents.map((component) => {
    const dependencyNames = dependencies[component.name] ?? dependencies[component.code.fileBase] ?? [];
    const blockedBy = dependencyNames.filter((dependencyName) => !isDependencyReady(
      dependencyName,
      componentByName,
      existing,
      aliases,
    ));
    const status = component.status !== 'implemented' && blockedBy.length > 0
      ? 'blocked-dependencies'
      : component.status;
    return {
      ...component,
      blockedBy,
      dependencies: dependencyNames,
      status,
    };
  }).sort((left, right) => {
    const statusOrder = ['missing', 'partial', 'blocked-dependencies', 'implemented-related', 'implemented'];
    return statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status)
      || left.code.fileBase.localeCompare(right.code.fileBase);
  });

  const counts = components.reduce((acc, component) => {
    acc[component.status] = (acc[component.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    project: projectName,
    source: index.source ?? null,
    generatedAt: new Date().toISOString(),
    counts,
    components,
  };
}

function collectExisting(componentRegistry, propRegistry) {
  const sourceFiles = new Set();
  const storyFiles = new Set();
  if (fs.existsSync(componentDir)) {
    for (const entry of fs.readdirSync(componentDir)) {
      if (entry.endsWith('.stories.tsx')) storyFiles.add(entry.replace(/\.stories\.tsx$/, ''));
      else if (entry.endsWith('.tsx') && entry !== 'index.tsx') sourceFiles.add(entry.replace(/\.tsx$/, ''));
    }
  }

  const registryNames = new Set();
  for (const component of componentRegistry.components ?? []) {
    registryNames.add(normalizeName(component.name));
    const extensions = component.extensions ?? {};
    if (extensions.importName) registryNames.add(normalizeName(extensions.importName));
    if (extensions.sourceExportName) registryNames.add(normalizeName(extensions.sourceExportName));
  }

  const propRegistryNames = new Set(Object.keys(propRegistry.components ?? {}).map(normalizeName));
  return {
    propRegistryNames,
    registryNames,
    sourceFiles,
    storyFiles,
  };
}

function getImplementationStatus(code, existing) {
  const sourceFile = existing.sourceFiles.has(code.fileBase);
  const storyFile = existing.storyFiles.has(code.fileBase);
  const registry = existing.registryNames.has(normalizeName(code.fileBase))
    || existing.registryNames.has(normalizeName(code.exportName));
  const propRegistry = existing.propRegistryNames.has(normalizeName(code.fileBase))
    || existing.propRegistryNames.has(normalizeName(code.exportName));
  const missing = [];
  if (!sourceFile) missing.push('source');
  if (!storyFile) missing.push('story');
  if (!registry) missing.push('component-registry');
  if (!propRegistry) missing.push('prop-registry');
  return {
    any: sourceFile || storyFile || registry || propRegistry,
    complete: missing.length === 0,
    missing,
    propRegistry,
    registry,
    sourceFile,
    storyFile,
  };
}

function isDependencyReady(dependencyName, componentByName, existing, aliases) {
  const direct = componentByName.get(normalizeName(dependencyName));
  if (direct && (direct.status === 'implemented' || direct.status === 'implemented-related')) return true;

  const exactStatus = getImplementationStatus(codeNamesFor(dependencyName), existing);
  if (exactStatus.complete) return true;

  const aliasName = aliases[dependencyName];
  if (!aliasName) return false;
  return getImplementationStatus(codeNamesFor(aliasName), existing).complete;
}

function collectCandidates(index) {
  const candidates = new Map();
  const add = (name, details = {}) => {
    if (!name) return;
    const existing = candidates.get(name) ?? {
      name,
      axes: {},
      componentId: null,
      componentType: null,
      pageId: null,
      pageName: null,
      reasons: [],
      risk: 'unknown',
      sources: [],
    };
    candidates.set(name, {
      ...existing,
      axes: { ...existing.axes, ...(details.axes ?? {}) },
      componentId: details.componentId ?? existing.componentId,
      componentType: details.componentType ?? existing.componentType,
      pageId: details.pageId ?? existing.pageId,
      pageName: details.pageName ?? existing.pageName,
      reasons: [...existing.reasons, ...(details.reason ? [details.reason] : [])],
      risk: details.risk ?? existing.risk,
      sources: [...new Set([...existing.sources, ...(details.source ? [details.source] : [])])],
    });
  };

  for (const entry of index.firstPassCandidates ?? []) {
    add(entry.componentName, {
      axes: entry.axes,
      componentId: entry.componentId,
      componentType: entry.componentType,
      pageId: entry.pageId,
      pageName: entry.pageName,
      risk: entry.publishRisk ?? 'low',
      source: 'firstPassCandidates',
    });
  }
  for (const entry of index.deferredSinglePrimitiveCandidates ?? []) {
    add(entry.componentName, {
      componentId: entry.componentId,
      componentType: entry.componentType,
      pageId: entry.pageId,
      pageName: entry.pageName,
      reason: entry.reason,
      risk: entry.publishRisk ?? 'deferred',
      source: 'deferredSinglePrimitiveCandidates',
    });
  }
  for (const name of index.publishableByReducibility ?? []) {
    add(name, { risk: 'publishable', source: 'publishableByReducibility' });
  }
  for (const name of index.publishableLargeByReducibility ?? []) {
    add(name, { risk: 'large', source: 'publishableLargeByReducibility' });
  }
  for (const entry of index.fallbackReviewByReducibility ?? []) {
    add(entry.name, {
      reason: entry.reason,
      risk: 'fallback-review',
      source: 'fallbackReviewByReducibility',
    });
  }
  for (const entry of index.reviewByReducibility ?? []) {
    add(entry.name, {
      reason: entry.reason,
      risk: 'review',
      source: 'reviewByReducibility',
    });
  }

  return [...candidates.values()];
}

function createSpec(component, source) {
  const props = Object.entries(component.axes ?? {}).map(([axis, values]) => {
    const normalizedValues = values.map(normalizeOptionValue);
    const booleanAxis = isBooleanAxis(values);
    return {
      name: AXIS_PROP_NAMES.get(axis) ?? lowerCamel(axis),
      figmaAxis: axis,
      kind: booleanAxis ? 'boolean' : 'select',
      options: booleanAxis ? undefined : normalizedValues,
      figmaOptions: values,
      defaultValue: booleanAxis ? normalizedValues[0] === 'true' : normalizedValues[0],
      source: 'figma-axis',
    };
  });

  if (!props.some((prop) => prop.name === 'label')) {
    props.unshift({
      name: 'label',
      kind: 'text',
      defaultValue: component.name,
      source: 'workbench-default',
    });
  }

  return {
    schemaVersion: 1,
    status: 'draft',
    source: {
      fileKey: source?.fileKey ?? null,
      fileName: source?.fileName ?? null,
      pageId: component.pageId,
      pageName: component.pageName,
      componentId: component.componentId,
      componentName: component.name,
      componentType: component.componentType,
      risk: component.risk,
      sources: component.sources,
    },
    code: {
      exportName: component.code.exportName,
      fileBase: component.code.fileBase,
      cssClass: component.code.cssClass,
      storyTitle: `Local/${component.code.fileBase}`,
    },
    figma: {
      axes: component.axes,
      defaultVariant: null,
      propertyDefinitions: {},
      variantCount: null,
    },
    props,
    slots: [],
    interactions: [],
    qualityGates: {
      dependenciesReady: component.blockedBy.length === 0,
      figmaReviewRequired: true,
      sourceInsertDefaultsMatchPreview: true,
      clearedAssetsRemoveSlots: true,
      realHoverFocusWhereApplicable: true,
      storyAndInspectorPropsAligned: true,
    },
    notes: [
      component.dependencies.length > 0
        ? `Dependencies: ${component.dependencies.join(', ')}. Do not implement this component before dependencies are source-backed.`
        : 'No configured child component dependencies.',
      'Draft generated by primitive-automation.mjs. Review Figma anatomy before marking status as approved.',
    ],
  };
}

function renderScaffoldFiles(component, spec) {
  const fileBase = spec.code.fileBase;
  const exportName = spec.code.exportName;
  const cssClass = spec.code.cssClass;
  const props = spec.props ?? [];
  const selectProps = props.filter((prop) => prop.kind === 'select');
  const propTypeLines = props.map((prop) => `  ${prop.name}?: ${tsxTypeForProp(fileBase, prop)};`);
  const defaults = props.map((prop) => `  ${prop.name} = ${literal(prop.defaultValue)},`);
  const classLines = props
    .filter((prop) => prop.kind === 'select' || prop.kind === 'boolean')
    .map((prop) => prop.kind === 'boolean'
      ? `        ${prop.name} ? '${cssClass}--${kebab(prop.name)}' : '',`
      : `        \`${cssClass}--${kebab(prop.name)}-${'${'}${prop.name}${'}'}\`,`);

  const typeAliases = selectProps.map((prop) => {
    const typeName = `${exportName}${pascal(prop.name)}`;
    const options = (prop.options ?? []).map((option) => `'${option}'`).join(' | ') || 'string';
    return `export type ${typeName} = ${options};`;
  }).join('\n');

  const componentSource = [
    "import type { HTMLAttributes, ReactNode } from 'react';",
    "import './local.css';",
    '',
    typeAliases,
    '',
    `export type ${exportName}Props = HTMLAttributes<HTMLDivElement> & {`,
    '  children?: ReactNode;',
    ...propTypeLines,
    '};',
    '',
    `export function ${exportName}({`,
    '  children,',
    "  className = '',",
    ...defaults,
    `  ...props`,
    `}: ${exportName}Props) {`,
    '  return (',
    '    <div',
    '      {...props}',
    '      className={[',
    `        '${cssClass}',`,
    ...classLines,
    '        className,',
    "      ].filter(Boolean).join(' ')}",
    '    >',
    "      {children ?? label}",
    '    </div>',
    '  );',
    '}',
    '',
    `export default ${exportName};`,
    '',
  ].filter((line) => line !== null).join('\n');

  const optionConstants = selectProps.map((prop) => {
    const constantName = constantNameFor(prop.name);
    const values = (prop.options ?? []).map((value) => `'${value}'`).join(', ');
    return `const ${constantName} = [${values}] as const;`;
  }).join('\n');
  const defaultProps = props.map((prop) => `  ${prop.name}: ${literal(prop.defaultValue)},`).join('\n');
  const argTypes = props.map((prop) => {
    if (prop.kind === 'boolean') return `    ${prop.name}: { control: 'boolean' },`;
    if (prop.kind === 'select') return `    ${prop.name}: { control: 'select', options: ${constantNameFor(prop.name)} },`;
    return `    ${prop.name}: { control: 'text' },`;
  }).join('\n');
  const renderProps = props
    .filter((prop) => prop.name !== 'label')
    .map((prop) => {
      if (prop.kind === 'boolean') return `      ${prop.name}={asBoolean(args.${prop.name}, ${literal(prop.defaultValue)})}`;
      if (prop.kind === 'select') return `      ${prop.name}={asOption(args.${prop.name}, ${constantNameFor(prop.name)}, ${literal(prop.defaultValue)})}`;
      return `      ${prop.name}={asText(args.${prop.name}, ${literal(prop.defaultValue)})}`;
    }).join('\n');

  const storySource = [
    `import { ${exportName} } from './${fileBase}';`,
    '',
    'type Args = Record<string, boolean | string>;',
    '',
    optionConstants,
    '',
    'const DEFAULT_PROPS = {',
    defaultProps,
    '} as const;',
    '',
    'const meta = {',
    `  title: 'Local/${fileBase}',`,
    `  component: ${exportName},`,
    '  args: DEFAULT_PROPS,',
    '  argTypes: {',
    argTypes,
    '  },',
    '  sourceInsert: {',
    '    props: DEFAULT_PROPS,',
    '  },',
    '};',
    'export default meta;',
    '',
    'export const Default = {',
    `  name: '${component.name}',`,
    '  render: (args: Args) => (',
    `    <${exportName}`,
    renderProps,
    '    >',
    "      {asText(args.label, DEFAULT_PROPS.label)}",
    `    </${exportName}>`,
    '  ),',
    '};',
    '',
    'function asBoolean(value: unknown, fallback: boolean): boolean {',
    "  return typeof value === 'boolean' ? value : typeof value === 'string' ? value === 'true' : fallback;",
    '}',
    '',
    'function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {',
    "  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;",
    '}',
    '',
    "function asText(value: unknown, fallback = ''): string {",
    "  return typeof value === 'string' ? value : fallback;",
    '}',
    '',
  ].join('\n');

  return [
    { path: path.join(componentDir, `${fileBase}.tsx`), contents: componentSource },
    { path: path.join(componentDir, `${fileBase}.stories.tsx`), contents: storySource },
  ];
}

function printPlan(plan) {
  console.log(`Figma primitive automation plan for ${plan.project}`);
  if (plan.source?.fileKey) {
    console.log(`source: ${plan.source.fileName ?? 'unknown'} (${plan.source.fileKey})`);
  }
  console.log(`implemented=${plan.counts.implemented ?? 0}, related=${plan.counts['implemented-related'] ?? 0}, partial=${plan.counts.partial ?? 0}, blocked=${plan.counts['blocked-dependencies'] ?? 0}, readyMissing=${plan.counts.missing ?? 0}`);
  console.log('');
  for (const status of ['missing', 'partial', 'blocked-dependencies', 'implemented-related', 'implemented']) {
    const group = plan.components.filter((component) => component.status === status);
    if (group.length === 0) continue;
    console.log(`[${status}]`);
    for (const component of group) {
      const axes = Object.keys(component.axes ?? {}).length > 0
        ? ` axes=${Object.entries(component.axes).map(([key, values]) => `${key}:${values.join('/')}`).join(',')}`
        : '';
      const missing = component.missing.length > 0 ? ` missing=${component.missing.join(',')}` : '';
      const alias = component.aliasTarget ? ` related=${component.aliasTarget.fileBase}` : '';
      const deps = component.dependencies.length > 0 ? ` deps=${component.dependencies.join(',')}` : '';
      const blocked = component.blockedBy.length > 0 ? ` blockedBy=${component.blockedBy.join(',')}` : '';
      console.log(`- ${component.name} -> ${component.code.fileBase}${alias}${axes}${missing}${deps}${blocked}`);
    }
    console.log('');
  }
}

function createComponentPlanFromSpec(spec) {
  return {
    name: spec.source?.componentName ?? spec.code.fileBase,
    code: spec.code,
  };
}

function resolveSpecPath(componentArg) {
  const fileBase = codeNamesFor(componentArg).fileBase;
  const direct = path.resolve(componentArg);
  if (fs.existsSync(direct)) return direct;
  return path.join(workbenchRoot, SPEC_DIR_NAME, `${fileBase}.spec.json`);
}

function tsxTypeForProp(fileBase, prop) {
  if (prop.kind === 'boolean') return 'boolean';
  if (prop.kind === 'select') return `Figma${fileBase}${pascal(prop.name)}`;
  return 'ReactNode';
}

function codeNamesFor(name) {
  const fileBase = pascal(name);
  return {
    cssClass: `figma-${kebab(fileBase)}`,
    exportName: `Figma${fileBase}`,
    fileBase,
  };
}

function isBooleanAxis(values) {
  const normalized = values.map(normalizeOptionValue).sort().join(',');
  return normalized === 'false,true';
}

function normalizeOptionValue(value) {
  const lowered = String(value).trim().toLowerCase();
  if (lowered === 'false' || lowered === 'no' || lowered === 'off') return 'false';
  if (lowered === 'true' || lowered === 'yes' || lowered === 'on') return 'true';
  return lowerCamel(value);
}

function parseArgs(rawArgs) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const next = rawArgs[index + 1];
    if (!next || next.startsWith('--')) {
      options[name] = true;
    } else {
      options[name] = next;
      index += 1;
    }
  }
  return { command: positionals[0], options, positionals: positionals.slice(1) };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`Usage:
node scripts/figma-publisher/primitive-automation.mjs plan --project "Figma Comp Test"
node scripts/figma-publisher/primitive-automation.mjs write-specs --project "Figma Comp Test" [--write] [--all] [--replace]
node scripts/figma-publisher/primitive-automation.mjs audit --project "Figma Comp Test"
node scripts/figma-publisher/primitive-automation.mjs scaffold --project "Figma Comp Test" --component ProgressBar [--write] [--allow-draft]

Commands:
  plan         Compare Figma primitive index with local source/registry.
  write-specs  Generate draft spec JSON files for missing or partial primitives.
  audit        Run the local primitive story/design prop audits.
  scaffold     Generate new TSX/story files from an approved spec. Never overwrites by default.`);
}

function normalizeName(value) {
  return String(value).replace(/^Figma/, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function pascal(value) {
  return words(value).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function lowerCamel(value) {
  const name = pascal(value);
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function kebab(value) {
  return words(value).join('-');
}

function words(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

function constantNameFor(propName) {
  return `${words(propName).join('_').toUpperCase()}S`;
}

function literal(value) {
  return JSON.stringify(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
