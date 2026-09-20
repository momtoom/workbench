import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';

// A library that has never been audited starts with a backlog, and failing on
// all of it would only mean the audit never runs. `--baseline` records what was
// already there so the gate fails on what gets added from now on -- new
// components have to declare controls their render actually uses, while the
// existing backlog stays visible without blocking.
const positional = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
const flags = process.argv.slice(2).filter((argument) => argument.startsWith('--'));
const baselinePath = flags
  .find((flag) => flag.startsWith('--baseline='))
  ?.slice('--baseline='.length) ?? null;
const updateBaseline = flags.includes('--update-baseline');
const storyRoot = positional[0] ?? 'projects/NEW SG Design System Test/src/libraries/sg-ds-library/components';
const rootPath = path.resolve(storyRoot);

function issueKey(issue) {
  return `${issue.file}::${issue.storyName}::${issue.missing.join(',')}`;
}

function readBaseline() {
  if (!baselinePath || !fs.existsSync(baselinePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  return new Set(Array.isArray(parsed?.accepted) ? parsed.accepted : []);
}

function readStory(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  return {
    ast: parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    }),
    code,
  };
}

function isObjectExpression(node) {
  return node?.type === 'ObjectExpression';
}

function propertyName(property) {
  if (property?.type !== 'ObjectProperty') return null;
  const key = property.key;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function getObjectProperty(objectExpression, name) {
  if (!isObjectExpression(objectExpression)) return null;
  for (const property of objectExpression.properties) {
    if (propertyName(property) === name && property.type === 'ObjectProperty') return property.value;
  }
  return null;
}

function getObjectKeys(objectExpression) {
  if (!isObjectExpression(objectExpression)) return [];
  return objectExpression.properties.map(propertyName).filter(Boolean);
}

function getBooleanProperty(objectExpression, name) {
  const value = getObjectProperty(objectExpression, name);
  return value?.type === 'BooleanLiteral' ? value.value : null;
}

function storyDisablesControls(storyObject) {
  const parameters = getObjectProperty(storyObject, 'parameters');
  const controls = getObjectProperty(parameters, 'controls');
  return getBooleanProperty(controls, 'disable') === true;
}

function sourceFor(code, node) {
  return node && typeof node.start === 'number' && typeof node.end === 'number'
    ? code.slice(node.start, node.end)
    : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderSourceReferencesArg(renderSource, key) {
  // A render that spreads args forwards every declared control, even though no
  // key appears by name. The cast form `{...(args as typeof DEFAULT_PROPS)}` is
  // the house style in the Astryx library, and missing it made the audit report
  // every prop of every such story -- 31 findings, all false. A check that only
  // produces noise teaches people to ignore it.
  if (/\.\.\.\s*\(?\s*args\b/.test(renderSource)) return true;
  const escapedKey = escapeRegExp(key);
  return new RegExp(`\\bargs\\s*(?:\\.\\s*${escapedKey}|\\[\\s*["']${escapedKey}["']\\s*\\])`).test(renderSource);
}

function collectTopLevelDefinitions(ast, code) {
  const objectByName = new Map();
  const functionByName = new Map();

  for (const node of ast.program.body) {
    const declaration = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
      functionByName.set(declaration.id.name, sourceFor(code, declaration));
    }
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier') continue;
      if (isObjectExpression(declarator.init)) {
        objectByName.set(declarator.id.name, declarator.init);
      }
      if (declarator.init?.type === 'ArrowFunctionExpression' || declarator.init?.type === 'FunctionExpression') {
        functionByName.set(declarator.id.name, sourceFor(code, declarator.init));
      }
    }
  }

  return { functionByName, objectByName };
}

function resolveObjectReference(node, objectByName) {
  if (isObjectExpression(node)) return node;
  if (node?.type === 'Identifier') return objectByName.get(node.name) ?? null;
  return null;
}

function resolveRenderSource(renderNode, code, objectByName, functionByName) {
  if (!renderNode) return '';
  if (renderNode.type === 'ArrowFunctionExpression' || renderNode.type === 'FunctionExpression') {
    return sourceFor(code, renderNode);
  }
  if (renderNode.type === 'Identifier') {
    return functionByName.get(renderNode.name) ?? '';
  }
  if (
    renderNode.type === 'MemberExpression' &&
    renderNode.object.type === 'Identifier' &&
    renderNode.property.type === 'Identifier'
  ) {
    const objectExpression = objectByName.get(renderNode.object.name);
    return sourceFor(code, objectExpression ? getObjectProperty(objectExpression, renderNode.property.name) : null);
  }
  return '';
}

function includeCalledArgHelpers(renderSource, functionByName) {
  let nextSource = renderSource;
  let changed = true;
  const included = new Set();

  while (changed) {
    changed = false;
    for (const [name, helperSource] of functionByName.entries()) {
      if (included.has(name)) continue;
      const callPattern = new RegExp(`\\b${escapeRegExp(name)}\\s*\\([^)]*\\bargs\\b`);
      if (!callPattern.test(nextSource)) continue;
      included.add(name);
      nextSource += `\n${helperSource}`;
      changed = true;
    }
  }

  return nextSource;
}

function storyInheritsMetaFields(exportName) {
  if (exportName === 'Default') return true;
  // shouldInheritCsfMetaFields resolves each export against the registry
  // component it belongs to and suppresses meta inheritance when the export is
  // that component's `${name}Story`. The audit is file-scoped, so read the
  // component off the export name -- `AccordionPanelStory` is AccordionPanel's
  // story, and Workbench never hands it the Accordion meta's args.
  return !(exportName.endsWith('Story') && exportName.length > 'Story'.length);
}

function analyzeStoryFile(filePath) {
  const { ast, code } = readStory(filePath);
  const { functionByName, objectByName } = collectTopLevelDefinitions(ast, code);
  let metaArgs = [];
  let metaArgTypes = [];
  let metaHasComponent = false;

  for (const node of ast.program.body) {
    if (node.type !== 'ExportDefaultDeclaration') continue;
    const metaObject = resolveObjectReference(node.declaration, objectByName);
    if (!metaObject) continue;
    metaArgs = getObjectKeys(getObjectProperty(metaObject, 'args'));
    metaArgTypes = getObjectKeys(getObjectProperty(metaObject, 'argTypes'));
    metaHasComponent = Boolean(getObjectProperty(metaObject, 'component'));
  }

  const issues = [];
  for (const node of ast.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of node.declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || !isObjectExpression(declarator.init)) continue;
      const storyName = declarator.id.name;
      if (storyDisablesControls(declarator.init)) continue;
      const storyArgs = getObjectKeys(getObjectProperty(declarator.init, 'args'));
      const storyArgTypes = getObjectKeys(getObjectProperty(declarator.init, 'argTypes'));
      // Mirror shouldInheritCsfMetaFields in src/workbench-stories/sourceStoryMetadata.ts.
      // A `<Name>Story` export is a sub-component story: Workbench never applies
      // the meta's args to it, so counting them here reported controls the
      // Inspector will never show. Auditing a different model than the runtime
      // produces findings nobody can act on.
      const inheritsMeta = storyInheritsMetaFields(storyName);
      const controls = inheritsMeta
        ? [...new Set([...metaArgTypes, ...storyArgTypes, ...metaArgs, ...storyArgs])]
        : [...new Set([...storyArgTypes, ...storyArgs])];
      if (controls.length === 0) continue;

      const renderNode = getObjectProperty(declarator.init, 'render');
      if (!renderNode && metaHasComponent) continue;
      const renderSource = includeCalledArgHelpers(
        resolveRenderSource(renderNode, code, objectByName, functionByName),
        functionByName,
      );
      const missing = controls.filter((key) => !renderSourceReferencesArg(renderSource, key));
      if (missing.length > 0) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          missing,
          storyName,
        });
      }
    }
  }

  return issues;
}

const storyFiles = fs.readdirSync(rootPath)
  .filter((entry) => entry.endsWith('.stories.tsx'))
  .sort()
  .map((entry) => path.join(rootPath, entry));

const issues = storyFiles.flatMap(analyzeStoryFile);

if (updateBaseline) {
  if (!baselinePath) throw new Error('--update-baseline requires --baseline=<file>.');
  const accepted = [...new Set(issues.map(issueKey))].sort();
  fs.writeFileSync(baselinePath, `${JSON.stringify({
    note: 'Story controls this library already declared without a matching render reference. Entries here are accepted debt; anything not listed fails the audit. Regenerate deliberately with --update-baseline, never to silence a new finding.',
    storyRoot,
    accepted,
  }, null, 2)}\n`);
  console.log(`Story control baseline written: ${accepted.length} accepted entr(ies) for ${storyRoot}.`);
} else {
  const baseline = readBaseline();
  const unlisted = baseline ? issues.filter((issue) => !baseline.has(issueKey(issue))) : issues;
  const reportable = baseline ? unlisted : issues;

  if (reportable.length > 0) {
    console.log(baseline
      ? `Story control audit found ${reportable.length} issue(s) not in the baseline.`
      : `Story control audit found ${reportable.length} candidate issue(s).`);
    for (const issue of reportable) {
      console.log(`${issue.file} :: ${issue.storyName} -> ${issue.missing.join(', ')}`);
    }
    if (baseline) {
      console.log('Declare these controls in the story render, or remove them from argTypes/args.');
    }
    process.exitCode = 1;
  } else if (baseline) {
    console.log(`Story control audit passed (${issues.length} baselined entr(ies) unchanged).`);
  } else {
    console.log('Story control audit passed.');
  }
}
