import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from '@babel/parser';
import { VISITOR_KEYS } from '@babel/types';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultStoryRoots = [
  'scripts/workbench-starter/shadcn-base/src/components/ui',
  'scripts/workbench-starter/astryx/src/components',
];
const propOrderKeys = JSON.parse(
  fs.readFileSync(path.join(workspaceRoot, 'src/workbench-stories/storyPropOrder.json'), 'utf8'),
);
const explicitPropRanks = new Map(
  propOrderKeys.map((key, index) => [normalizeStoryPropKey(key), index]),
);
const unknownPropRank = propOrderKeys.length + 1;

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const storyRoots = args.filter((arg) => arg !== '--fix');
const roots = (storyRoots.length > 0 ? storyRoots : defaultStoryRoots).map((root) => path.resolve(workspaceRoot, root));

const issues = [];
let changedFileCount = 0;
let changedObjectCount = 0;
let skippedSpreadObjectCount = 0;

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const storyFiles = fs.readdirSync(root)
    .filter((entry) => entry.endsWith('.stories.tsx'))
    .sort()
    .map((entry) => path.join(root, entry));

  for (const filePath of storyFiles) {
    const result = auditStoryFile(filePath);
    issues.push(...result.issues);
    skippedSpreadObjectCount += result.skippedSpreadObjectCount;
    if (!fix || result.replacements.length === 0) continue;
    fs.writeFileSync(filePath, applyReplacements(result.code, result.replacements), 'utf8');
    changedFileCount += 1;
    changedObjectCount += result.replacements.length;
  }
}

if (fix) {
  console.log(`Story prop order fix applied to ${changedObjectCount} object(s) in ${changedFileCount} file(s).`);
}

if (issues.length > 0 && !fix) {
  console.log(`Story prop order audit found ${issues.length} unordered object(s).`);
  for (const issue of issues.slice(0, 120)) {
    console.log(`${issue.file} :: ${issue.label}`);
    console.log(`  current:  ${issue.current.join(', ')}`);
    console.log(`  expected: ${issue.expected.join(', ')}`);
  }
  if (issues.length > 120) {
    console.log(`  ...and ${issues.length - 120} more.`);
  }
  if (skippedSpreadObjectCount > 0) {
    console.log(`Skipped ${skippedSpreadObjectCount} spread-based object(s); their inherited order is preserved.`);
  }
  process.exitCode = 1;
} else if (!fix) {
  console.log('Story prop order audit passed.');
  if (skippedSpreadObjectCount > 0) {
    console.log(`Skipped ${skippedSpreadObjectCount} spread-based object(s); their inherited order is preserved.`);
  }
}

function auditStoryFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  const objectConstantKeys = collectStoryPropConstantKeys(ast);
  const fileIssues = [];
  const replacements = [];
  let fileSkippedSpreadObjectCount = 0;

  visitAst(ast, [], (node, ancestors) => {
    if (node.type !== 'ObjectExpression') return;
    const label = getSortableObjectLabel(node, ancestors);
    if (!label) return;
    if (node.properties.length < 2) return;

    const sortableProperties = getPlainSortableProperties(node);
    if (!sortableProperties) {
      const expandedKeys = getExpandedPropertyKeys(node, objectConstantKeys);
      if (!expandedKeys) {
        fileSkippedSpreadObjectCount += 1;
        return;
      }
      const expectedKeys = getSortedExpandedKeys(expandedKeys);
      if (expandedKeys.join('\u0000') !== expectedKeys.join('\u0000')) {
        // The effective order of a spread-composed object is fixed by which
        // spread wins, so it cannot be reordered without changing meaning --
        // and the runtime sorts controls anyway (sortWorkbenchStoryControls).
        // Demanding an order the author cannot express is how a style audit
        // turns into permanent noise. Count it, do not fail on it.
        fileSkippedSpreadObjectCount += 1;
      }
      return;
    }

    const sortedProperties = [...sortableProperties].sort((left, right) => compareWorkbenchStoryPropKeys(
      getPropertyName(left),
      getPropertyName(right),
    ));
    const currentKeys = sortableProperties.map(getPropertyName);
    const expectedKeys = sortedProperties.map(getPropertyName);
    if (currentKeys.join('\u0000') === expectedKeys.join('\u0000')) return;

    fileIssues.push({
      current: currentKeys,
      expected: expectedKeys,
      file: path.relative(workspaceRoot, filePath),
      label,
    });
    replacements.push({
      end: node.end,
      start: node.start,
      text: formatObjectExpression(code, node, sortedProperties),
    });
  });

  return {
    code,
    issues: fileIssues,
    replacements,
    skippedSpreadObjectCount: fileSkippedSpreadObjectCount,
  };
}

function collectStoryPropConstantKeys(ast) {
  const constants = new Map();
  visitAst(ast, [], (node, ancestors) => {
    if (node.type !== 'ObjectExpression') return;
    const label = getStoryPropConstantLabel(node, ancestors);
    if (!label) return;
    const sortableProperties = getPlainSortableProperties(node);
    if (!sortableProperties) return;
    constants.set(label, sortableProperties.map(getPropertyName));
  });
  return constants;
}

function getSortableObjectLabel(node, ancestors) {
  const constantLabel = getStoryPropConstantLabel(node, ancestors);
  if (constantLabel) return constantLabel;
  const parent = ancestors.at(-1)?.node;
  if (parent?.type !== 'ObjectProperty' || parent.value !== node) return null;

  const propertyName = getPropertyName(parent);
  if (propertyName === 'args' || propertyName === 'argTypes') {
    return `${getOwningObjectLabel(ancestors)}.${propertyName}`;
  }
  if (propertyName === 'props' && isSourceInsertPropsObject(ancestors)) {
    return `${getOwningObjectLabel(ancestors)}.sourceInsert.props`;
  }
  return null;
}

function getStoryPropConstantLabel(node, ancestors) {
  const parent = ancestors.at(-1)?.node;
  if (parent?.type === 'VariableDeclarator' && parent.init === node && isStoryPropConstant(parent.id)) {
    return getIdentifierName(parent.id);
  }
  const wrappedParent = ancestors.at(-2)?.node;
  if (
    (parent?.type === 'TSAsExpression' || parent?.type === 'TSSatisfiesExpression') &&
    parent.expression === node &&
    wrappedParent?.type === 'VariableDeclarator' &&
    wrappedParent.init === parent &&
    isStoryPropConstant(wrappedParent.id)
  ) {
    return getIdentifierName(wrappedParent.id);
  }
  return null;
}

function isStoryPropConstant(node) {
  return getIdentifierName(node)?.match(/^(?:DEFAULT_PROPS|[A-Z0-9_]+_(?:ARGS|ARG_TYPES|PROPS))$/);
}

function isSourceInsertPropsObject(ancestors) {
  const objectParent = ancestors.at(-2)?.node;
  const sourceInsertParent = ancestors.at(-3)?.node;
  return objectParent?.type === 'ObjectExpression' &&
    sourceInsertParent?.type === 'ObjectProperty' &&
    getPropertyName(sourceInsertParent) === 'sourceInsert';
}

function getOwningObjectLabel(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index]?.node;
    if (ancestor?.type === 'VariableDeclarator') return getIdentifierName(ancestor.id) ?? 'object';
    if (ancestor?.type === 'ExportDefaultDeclaration') return 'default';
  }
  return 'object';
}

function getPlainSortableProperties(node) {
  const properties = [];
  for (const property of node.properties) {
    if (property.type !== 'ObjectProperty' || property.computed || !getPropertyName(property)) return null;
    properties.push(property);
  }
  return properties;
}

function getExpandedPropertyKeys(node, objectConstantKeys) {
  const keys = [];
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      const spreadName = getIdentifierName(property.argument);
      const spreadKeys = spreadName ? objectConstantKeys.get(spreadName) : null;
      if (!spreadKeys) return null;
      for (const key of spreadKeys) {
        if (!keys.includes(key)) keys.push(key);
      }
      continue;
    }
    if (property.type !== 'ObjectProperty' || property.computed) return null;
    const key = getPropertyName(property);
    if (!key) return null;
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

function getSortedExpandedKeys(keys) {
  return [...keys].sort(compareWorkbenchStoryPropKeys);
}

function formatObjectExpression(code, node, properties) {
  const original = code.slice(node.start, node.end);
  const propertySources = properties.map((property) => code.slice(property.start, property.end).trim());
  if (!original.includes('\n')) {
    return `{ ${propertySources.join(', ')} }`;
  }

  const closingIndent = getLineIndentBefore(code, node.end - 1);
  const propertyIndent = `${closingIndent}  `;
  const body = propertySources
    .map((propertySource) => indentPropertySource(propertySource, propertyIndent))
    .join(',\n');
  return `{\n${body},\n${closingIndent}}`;
}

function indentPropertySource(propertySource, propertyIndent) {
  const lines = propertySource.split('\n');
  return [
    `${propertyIndent}${lines[0].trimStart()}`,
    ...lines.slice(1),
  ].join('\n');
}

function getLineIndentBefore(code, index) {
  const lineStart = code.lastIndexOf('\n', index) + 1;
  const linePrefix = code.slice(lineStart, index);
  return linePrefix.match(/^\s*/)?.[0] ?? '';
}

function applyReplacements(code, replacements) {
  return [...replacements]
    .sort((left, right) => right.start - left.start)
    .reduce((nextCode, replacement) => (
      `${nextCode.slice(0, replacement.start)}${replacement.text}${nextCode.slice(replacement.end)}`
    ), code);
}

function visitAst(node, ancestors, visitor) {
  if (!node || typeof node.type !== 'string') return;
  visitor(node, ancestors);
  const visitorKeys = VISITOR_KEYS[node.type] ?? [];
  for (const key of visitorKeys) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) visitAst(child, [...ancestors, { key, node }], visitor);
      continue;
    }
    visitAst(value, [...ancestors, { key, node }], visitor);
  }
}

function compareWorkbenchStoryPropKeys(left, right) {
  const leftRank = getWorkbenchStoryPropRank(left);
  const rightRank = getWorkbenchStoryPropRank(right);
  if (leftRank !== rightRank) return leftRank - rightRank;
  return normalizeStoryPropKey(left).localeCompare(normalizeStoryPropKey(right));
}

function getWorkbenchStoryPropRank(key) {
  return explicitPropRanks.get(normalizeStoryPropKey(key)) ?? unknownPropRank;
}

function normalizeStoryPropKey(key) {
  return String(key).replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getPropertyName(property) {
  const key = property?.key;
  if (!key) return null;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function getIdentifierName(node) {
  return node?.type === 'Identifier' ? node.name : null;
}
