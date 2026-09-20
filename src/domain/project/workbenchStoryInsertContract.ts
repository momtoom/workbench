import type {
  Expression,
  ObjectExpression,
  ObjectProperty,
  Statement,
} from '@babel/types';

/**
 * The insert-time half of a component's CSF authoring contract:
 *
 * ```ts
 * const meta = {
 *   title: 'Astryx/Table',
 *   authoring: {
 *     allowedChildren: ['AstryxTableHeader', 'AstryxTableBody'],
 *     hiddenFromInsert: false,
 *   },
 * };
 * ```
 *
 * `allowedChildren` is what the Design canvas "Add child" picker filters on,
 * `hiddenFromInsert` is what keeps a sub-part out of the root picker, and
 * `group` is the category the picker files the component under.
 * All three are declared in project source so a locally imported design
 * system can express its own contract instead of waiting for a hardcoded
 * entry in `src/domain/document/sourceSlotContainers.ts`.
 */
export type WorkbenchStoryInsertContract = {
  allowedChildren: string[];
  group: string | null;
  hiddenFromInsert: boolean | null;
};

export type WorkbenchStoryInsertContracts = {
  byExportName: Map<string, WorkbenchStoryInsertContract>;
  meta: WorkbenchStoryInsertContract | null;
};

const EMPTY_CONTRACTS: WorkbenchStoryInsertContracts = {
  byExportName: new Map(),
  meta: null,
};

// Hydration re-reads every story file on each pass, so cache by exact
// contents the same way importable component summaries do.
const INSERT_CONTRACT_CACHE_LIMIT = 600;
const insertContractCache = new Map<string, WorkbenchStoryInsertContracts>();

export async function parseWorkbenchStoryInsertContracts(
  contents: string,
): Promise<WorkbenchStoryInsertContracts> {
  // Skip the parse entirely for the overwhelmingly common story file that
  // declares no authoring contract at all.
  if (!contents.includes('authoring')) return EMPTY_CONTRACTS;

  const cached = insertContractCache.get(contents);
  if (cached) {
    insertContractCache.delete(contents);
    insertContractCache.set(contents, cached);
    return cached;
  }

  const parsed = await parseStoryInsertContracts(contents);
  insertContractCache.set(contents, parsed);
  if (insertContractCache.size > INSERT_CONTRACT_CACHE_LIMIT) {
    const oldest = insertContractCache.keys().next().value;
    if (oldest !== undefined) insertContractCache.delete(oldest);
  }
  return parsed;
}

/**
 * A story export's own `authoring` block wins over the module `meta` block,
 * matching how `sourceInsert` and `args` inherit in the CSF metadata reader.
 */
export function resolveWorkbenchStoryInsertContract(
  contracts: WorkbenchStoryInsertContracts,
  exportName: string,
): WorkbenchStoryInsertContract | null {
  return contracts.byExportName.get(exportName) ?? contracts.meta;
}

export function createWorkbenchStoryInsertExtensions(
  contract: WorkbenchStoryInsertContract | null,
): Record<string, unknown> {
  if (!contract) return {};
  return {
    ...(contract.allowedChildren.length > 0 ? { allowedChildren: contract.allowedChildren } : {}),
    ...(contract.group ? { componentGroup: contract.group } : {}),
    ...(contract.hiddenFromInsert === null ? {} : { hiddenFromInsert: contract.hiddenFromInsert }),
  };
}

async function parseStoryInsertContracts(contents: string): Promise<WorkbenchStoryInsertContracts> {
  let program: Statement[];
  try {
    const { parse } = await import('@babel/parser');
    program = parse(contents, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    }).program.body;
  } catch {
    return EMPTY_CONTRACTS;
  }

  // `authoring` is often hoisted into a shared const, so resolve identifier
  // references against top-level bindings before reading the object.
  const bindings = new Map<string, Expression>();
  for (const statement of program) {
    const declaration = statement.type === 'ExportNamedDeclaration' && statement.declaration?.type === 'VariableDeclaration'
      ? statement.declaration
      : statement.type === 'VariableDeclaration' ? statement : null;
    if (!declaration) continue;
    for (const declarator of declaration.declarations) {
      if (declarator.id.type !== 'Identifier' || !declarator.init) continue;
      bindings.set(declarator.id.name, declarator.init);
    }
  }

  const readContract = (value: Expression | null | undefined): WorkbenchStoryInsertContract | null => {
    const object = unwrapObjectExpression(value, bindings);
    if (!object) return null;
    const authoring = unwrapObjectExpression(getObjectProperty(object, 'authoring'), bindings);
    if (!authoring) return null;
    const allowedChildren = readStringArray(getObjectProperty(authoring, 'allowedChildren'), bindings);
    const group = readString(getObjectProperty(authoring, 'group'), bindings);
    const hiddenFromInsert = readBoolean(getObjectProperty(authoring, 'hiddenFromInsert'), bindings);
    if (allowedChildren.length === 0 && group === null && hiddenFromInsert === null) return null;
    return { allowedChildren, group, hiddenFromInsert };
  };

  const byExportName = new Map<string, WorkbenchStoryInsertContract>();
  for (const statement of program) {
    if (statement.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of statement.declaration.declarations) {
      if (declarator.id.type !== 'Identifier') continue;
      const contract = readContract(declarator.init);
      if (contract) byExportName.set(declarator.id.name, contract);
    }
  }

  const defaultExport = program.find((statement) => statement.type === 'ExportDefaultDeclaration');
  const metaExpression = bindings.get('meta') ??
    (defaultExport?.type === 'ExportDefaultDeclaration' && isExpression(defaultExport.declaration)
      ? defaultExport.declaration
      : null);

  return { byExportName, meta: readContract(metaExpression) };
}

function isExpression(value: unknown): value is Expression {
  return Boolean(value && typeof value === 'object' && 'type' in (value as { type?: unknown }));
}

/**
 * Unwrap the wrappers CSF metadata routinely sits behind — `satisfies Meta`,
 * `as const`, parentheses, and a plain identifier reference.
 */
function unwrapObjectExpression(
  value: Expression | null | undefined,
  bindings: Map<string, Expression>,
  depth = 0,
): ObjectExpression | null {
  if (!value || depth > 8) return null;
  switch (value.type) {
    case 'ObjectExpression':
      return value;
    case 'Identifier': {
      const bound = bindings.get(value.name);
      return bound ? unwrapObjectExpression(bound, bindings, depth + 1) : null;
    }
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TypeCastExpression':
    case 'ParenthesizedExpression':
      return unwrapObjectExpression(value.expression, bindings, depth + 1);
    default:
      return null;
  }
}

function getObjectProperty(object: ObjectExpression, key: string): Expression | null {
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    if (getObjectPropertyKey(property) !== key) continue;
    return isExpression(property.value) ? property.value : null;
  }
  return null;
}

function getObjectPropertyKey(property: ObjectProperty): string | null {
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'StringLiteral') return property.key.value;
  return null;
}

function readStringArray(value: Expression | null, bindings: Map<string, Expression>, depth = 0): string[] {
  if (!value || depth > 8) return [];
  if (value.type === 'Identifier') {
    const bound = bindings.get(value.name);
    return bound ? readStringArray(bound, bindings, depth + 1) : [];
  }
  if (value.type === 'TSAsExpression' || value.type === 'TSSatisfiesExpression' || value.type === 'ParenthesizedExpression') {
    return readStringArray(value.expression, bindings, depth + 1);
  }
  if (value.type !== 'ArrayExpression') return [];

  const names: string[] = [];
  for (const element of value.elements) {
    if (element?.type === 'StringLiteral') {
      const name = element.value.trim();
      if (name) names.push(name);
      continue;
    }
    // `allowedChildren: [...TABLE_PARTS, 'AstryxTableCell']`
    if (element?.type === 'SpreadElement' && isExpression(element.argument)) {
      names.push(...readStringArray(element.argument, bindings, depth + 1));
    }
  }
  return [...new Set(names)];
}

function readString(value: Expression | null, bindings: Map<string, Expression>, depth = 0): string | null {
  if (!value || depth > 8) return null;
  if (value.type === 'StringLiteral') return value.value.trim() || null;
  if (value.type === 'Identifier') {
    const bound = bindings.get(value.name);
    return bound ? readString(bound, bindings, depth + 1) : null;
  }
  if (value.type === 'TSAsExpression' || value.type === 'TSSatisfiesExpression' || value.type === 'ParenthesizedExpression') {
    return readString(value.expression, bindings, depth + 1);
  }
  return null;
}

function readBoolean(value: Expression | null, bindings: Map<string, Expression>, depth = 0): boolean | null {
  if (!value || depth > 8) return null;
  if (value.type === 'BooleanLiteral') return value.value;
  if (value.type === 'Identifier') {
    const bound = bindings.get(value.name);
    return bound ? readBoolean(bound, bindings, depth + 1) : null;
  }
  if (value.type === 'TSAsExpression' || value.type === 'TSSatisfiesExpression' || value.type === 'ParenthesizedExpression') {
    return readBoolean(value.expression, bindings, depth + 1);
  }
  return null;
}
