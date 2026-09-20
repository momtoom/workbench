import type {
  ArrowFunctionExpression,
  BlockStatement,
  CallExpression,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  File,
  FunctionDeclaration,
  FunctionExpression,
  ImportDeclaration,
  JSXElement,
  JSXAttribute,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  Node as BabelNode,
  ObjectExpression,
  Program,
  ReturnStatement,
  Statement,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types';
import type {
  EditableDocumentTree,
  EditableTreeNode,
  EditableTreeNodeKind,
  EditableTreeSourcePropArrayReference,
  EditableTreeSourcePropArray,
  EditableTreeSourcePropObject,
  EditableTreeSourcePropPrimitive,
  EditableTreeSourcePropStringArray,
  EditableTreeSourcePropValue,
  EditableTreeSourceRuntimeProps,
  EditableTreeSourceRuntimeValue,
  EditableTreeSourceExpression,
  EditableTreeSourceMapBinding,
  EditableTreeTokenBindingReferences,
  EditableTreeSourceLocation,
  EditableTreeTokenBindings,
  EditableTreeSourceValueMetadata,
  EditableTreeSourceStyleDeclarations,
} from './editableTree';
import { SOURCE_TOKEN_MODE_ATTRIBUTE } from '@domain/design-system/tokens/modeOverride';
import {
  isSourceIntrinsicElementTagName,
  normalizeEditableSourceAttributeValue,
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
} from './sourceAttributeSafety';
import {
  PROTOTYPE_CLICK_ATTRIBUTE,
  PROTOTYPE_INITIAL_ATTRIBUTE,
  PROTOTYPE_NAME_ATTRIBUTE,
} from './prototypeInteractions';
import { getSourceChildrenSlotKind } from './sourceSlotContainers';

// A page-level `useState` declaration with a literal initial value. Design
// state overrides feed these names back through `scopedValues` so the canvas
// can project the branch the running page would render.
export type EditableTreeSourceDesignState = {
  defaultValue: string | number | boolean;
  description?: string;
  group?: EditableTreeSourceDesignStateGroup;
  kind: 'boolean' | 'number' | 'string';
  label?: string;
  name: string;
  options?: Array<string | number>;
  setter?: string;
};

export type EditableTreeSourceDesignStateGroup = {
  defaultOpen: boolean;
  description?: string;
  id: string;
  label: string;
  order: number;
  status: 'preview' | 'runtime';
  visibility: 'default' | 'internal';
};

export type EditableTreeSourceParseResult =
  | {
      ok: true;
      designStates?: EditableTreeSourceDesignState[];
      diagnostic: string;
      tree: EditableDocumentTree;
      warnings?: string[];
    }
  | {
      ok: false;
      diagnostic: string;
      tree: null;
      warnings?: string[];
    };

type ComponentCandidate = {
  body: BlockStatement | Expression;
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  intrinsicElementAliases: Set<string>;
  name: string;
  staticFunctionFallbacks: Map<string, StaticFunctionFallback>;
};

type JsxChild = JSXElement['children'][number];
type StaticFunctionFallback = FunctionDeclaration | ArrowFunctionExpression | FunctionExpression;
type StaticChildrenFallback = {
  children: JsxChild[];
  parentJsxName: string;
  parentPath: number[];
};

type TreeBuildFallbackEntries = {
  expressionNodeFallbacks?: Map<string, BabelNode>;
  expressionTextFallbacks?: Map<string, string>;
  staticChildrenFallbacks?: Map<string, StaticChildrenFallback>;
  staticFunctionFallbacks?: Map<string, StaticFunctionFallback>;
};

type TreeBuildScopeEntries = {
  fallbackEntries: TreeBuildFallbackEntries;
  scopedValueEntries: Array<readonly [string, StaticExpressionValue]>;
};

export type ImportableComponentChildrenSlotKind = 'block' | 'inline';

export type ImportableComponentSummary = {
  childrenSlotKind: ImportableComponentChildrenSlotKind | null;
  name: string;
};

type TreeBuildContext = {
  componentImports: Map<string, { importName: string; importSource: string }>;
  dataImports: Map<string, {
    importName: string;
    importSource: string;
    kind: 'json-file' | 'module';
    path?: string;
  }>;
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  intrinsicElementAliases: Set<string>;
  staticChildrenFallbacks: Map<string, StaticChildrenFallback>;
  staticFunctionFallbacks: Map<string, StaticFunctionFallback>;
  scopedValueFallbacks: Map<string, StaticExpressionValue>;
  designStates: EditableTreeSourceDesignState[];
  contents: string;
  sourceFile: string;
  staticFunctionExpansionStack: Set<string>;
  unsupportedExpressions: Set<string>;
};

type StaticExpressionValue =
  | null
  | string
  | number
  | boolean
  | StaticExpressionValue[]
  | { [key: string]: StaticExpressionValue }
  | { kind: 'identifier'; name: string };

const TOKEN_BINDING_ATTRIBUTES: Record<keyof EditableTreeTokenBindings, string> = {
  background: 'data-wb-bg-token',
  radius: 'data-wb-radius-token',
  spacing: 'data-wb-spacing-token',
  fontSize: 'data-wb-font-size-token',
  text: 'data-wb-text-token',
};

const TOKEN_BINDING_COLLECTION_ATTRIBUTES: Record<keyof EditableTreeTokenBindings, string> = {
  background: 'data-wb-bg-token-collection',
  radius: 'data-wb-radius-token-collection',
  spacing: 'data-wb-spacing-token-collection',
  fontSize: 'data-wb-font-size-token-collection',
  text: 'data-wb-text-token-collection',
};

const SOURCE_PREVIEW_FALLBACK_PATH_INDEX = 999999;

const DATA_SOURCE_PROP_NAMES = new Set(['data', 'rows', 'records', 'dataset']);

export async function createEditableDocumentTreeFromTsxSource({
  contents,
  label,
  preferredComponentNames,
  scopedValues,
  sourceFile,
}: {
  contents: string;
  label: string;
  preferredComponentNames?: string[];
  scopedValues?: Record<string, EditableTreeSourcePropValue>;
  sourceFile: string;
}): Promise<EditableTreeSourceParseResult> {
  let ast: File;
  try {
    const { parse } = await import('@babel/parser');
    ast = parse(contents, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    });
  } catch (error) {
    return {
      ok: false,
      diagnostic: `${sourceFile} could not be parsed: ${formatParseError(error)}. Using the preview scaffold.`,
      tree: null,
    };
  }

  const component = findPrimaryComponentCandidate(ast.program, preferredComponentNames);
  if (!component) {
    return {
      ok: false,
      diagnostic: `${sourceFile} has no parseable component function. Using the preview scaffold.`,
      tree: null,
    };
  }

  const rootJsx = getReturnedJsx(component.body);
  if (!rootJsx) {
    return {
      ok: false,
      diagnostic: `${sourceFile} has no readable JSX return. Using the preview scaffold.`,
      tree: null,
    };
  }

  const context: TreeBuildContext = {
    componentImports: collectComponentImports(ast.program),
    dataImports: collectDataImports(ast.program, sourceFile),
    contents,
    expressionNodeFallbacks: component.expressionNodeFallbacks,
    expressionTextFallbacks: component.expressionTextFallbacks,
    intrinsicElementAliases: new Set([
      ...component.intrinsicElementAliases,
      ...collectIntrinsicElementAliases(component.body),
    ]),
    staticChildrenFallbacks: new Map(),
    staticFunctionFallbacks: component.staticFunctionFallbacks,
    scopedValueFallbacks: createScopedValueFallbackMap(scopedValues),
    designStates: collectDesignStateDeclarations(
      component.body,
      collectDesignStateMetadata(ast.program),
    ),
    sourceFile,
    staticFunctionExpansionStack: new Set(),
    unsupportedExpressions: new Set(),
  };
  // Seed every collected state with its declared initial value so the canvas
  // projects what the page renders on first mount. An explicit override in
  // `scopedValues` always wins.
  for (const state of context.designStates) {
    if (!context.scopedValueFallbacks.has(state.name)) {
      context.scopedValueFallbacks.set(state.name, state.defaultValue);
    }
  }
  const moduleFallbacks = collectModuleScopeFallbacks(ast.program);
  for (const [key, value] of moduleFallbacks.expressionNodeFallbacks) {
    if (!context.expressionNodeFallbacks.has(key)) context.expressionNodeFallbacks.set(key, value);
  }
  for (const [key, value] of moduleFallbacks.expressionTextFallbacks) {
    if (!context.expressionTextFallbacks.has(key)) context.expressionTextFallbacks.set(key, value);
  }
  for (const [key, value] of moduleFallbacks.staticFunctionFallbacks) {
    if (!context.staticFunctionFallbacks.has(key)) context.staticFunctionFallbacks.set(key, value);
  }
  const root = convertJsxRoot(rootJsx, [], context);
  if (!root) {
    return {
      ok: false,
      diagnostic: `${sourceFile} JSX could not be converted into an editable tree from ${component.name}. Using the preview scaffold.`,
      tree: null,
    };
  }

  const warnings = [...context.unsupportedExpressions].map((expression) => `Unsupported JSX expression preserved as placeholder: ${expression}`);
  const warningSuffix = warnings.length > 0
    ? ` ${warnings.length} JSX expression placeholder${warnings.length === 1 ? '' : 's'} require round-trip support.`
    : '';

  const designStates = context.designStates;

  return {
    ok: true,
    diagnostic: `Editable tree parsed from ${sourceFile} via AST.${warningSuffix}`,
    tree: {
      id: `source:${sanitizeNodeId(sourceFile)}`,
      label,
      root,
    },
    ...(designStates.length > 0 ? { designStates } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

function createScopedValueFallbackMap(
  scopedValues: Record<string, EditableTreeSourcePropValue> | undefined,
): Map<string, StaticExpressionValue> {
  const values = new Map<string, StaticExpressionValue>();
  for (const [key, value] of Object.entries(scopedValues ?? {})) {
    values.set(key, sourcePropValueToStaticExpressionValue(value));
  }
  return values;
}

function sourcePropValueToStaticExpressionValue(value: EditableTreeSourcePropValue): StaticExpressionValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return value.map((item) => {
    if (typeof item === 'string') return item;
    return Object.fromEntries(Object.entries(item).map(([key, itemValue]) => [
      key,
      typeof itemValue === 'string' || typeof itemValue === 'number' || typeof itemValue === 'boolean' ? itemValue : String(itemValue),
    ]));
  });
}

export async function getImportableComponentNamesFromTsxSource({
  contents,
  fallbackName,
}: {
  contents: string;
  fallbackName: string;
}): Promise<string[]> {
  const summaries = await getImportableComponentSummariesFromTsxSource({ contents, fallbackName });
  return summaries.map((summary) => summary.name);
}

// Summaries are pure over (contents, fallbackName), and registry hydration plus
// slot-kind sync re-derive them for every registered component. Cache by exact
// contents so repeated passes only pay the Babel parse cost for changed files.
const IMPORTABLE_COMPONENT_SUMMARY_CACHE_LIMIT = 600;
const importableComponentSummaryCache = new Map<string, ImportableComponentSummary[]>();

export async function getImportableComponentSummariesFromTsxSource({
  contents,
  fallbackName,
}: {
  contents: string;
  fallbackName: string;
}): Promise<ImportableComponentSummary[]> {
  const cacheKey = `${fallbackName}\u0000${contents}`;
  const cached = importableComponentSummaryCache.get(cacheKey);
  if (cached) {
    importableComponentSummaryCache.delete(cacheKey);
    importableComponentSummaryCache.set(cacheKey, cached);
    return cached;
  }
  const summaries = await parseImportableComponentSummariesFromTsxSource({ contents, fallbackName });
  importableComponentSummaryCache.set(cacheKey, summaries);
  if (importableComponentSummaryCache.size > IMPORTABLE_COMPONENT_SUMMARY_CACHE_LIMIT) {
    const oldestKey = importableComponentSummaryCache.keys().next().value;
    if (typeof oldestKey === 'string') importableComponentSummaryCache.delete(oldestKey);
  }
  return summaries;
}

async function parseImportableComponentSummariesFromTsxSource({
  contents,
  fallbackName,
}: {
  contents: string;
  fallbackName: string;
}): Promise<ImportableComponentSummary[]> {
  let ast: File;
  try {
    const { parse } = await import('@babel/parser');
    ast = parse(contents, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    });
  } catch {
    return [];
  }

  const summaries = new Map<string, ImportableComponentSummary>();
  const fallback = normalizeImportableComponentNames([fallbackName])[0] ?? 'ImportedComponent';
  const addCandidate = (candidate: ComponentCandidate) => {
    if (!isReadableComponentCandidate(candidate)) return;
    const name = normalizeImportableComponentNames([getImportableComponentName(candidate, fallback)])[0];
    if (!name) return;
    const summary: ImportableComponentSummary = {
      childrenSlotKind: inferComponentChildrenSlotKind(candidate),
      name,
    };
    const previous = summaries.get(name);
    if (!previous || (!previous.childrenSlotKind && summary.childrenSlotKind)) summaries.set(name, summary);
  };

  for (const statement of ast.program.body) {
    if (statement.type !== 'ExportNamedDeclaration') continue;
    for (const candidate of getNamedExportComponentCandidates(statement, ast.program)) addCandidate(candidate);
  }

  const defaultExport = ast.program.body.find((statement) => statement.type === 'ExportDefaultDeclaration') as ExportDefaultDeclaration | undefined;
  const defaultCandidate = defaultExport ? getDefaultExportComponentCandidate(defaultExport, ast.program) : null;
  if (defaultCandidate) addCandidate(defaultCandidate);

  if (summaries.size === 0) {
    const primaryCandidate = findPrimaryComponentCandidate(ast.program);
    if (primaryCandidate) addCandidate(primaryCandidate);
  }

  return [...summaries.values()];
}

function findPrimaryComponentCandidate(program: Program, preferredComponentNames: string[] = []): ComponentCandidate | null {
  const preferredCandidate = findPreferredComponentCandidate(program, preferredComponentNames);
  if (preferredCandidate) return preferredCandidate;

  const defaultExport = program.body.find((statement) => statement.type === 'ExportDefaultDeclaration') as ExportDefaultDeclaration | undefined;
  const defaultCandidate = defaultExport ? getDefaultExportComponentCandidate(defaultExport, program) : null;
  if (defaultCandidate) return defaultCandidate;

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration') {
      const namedCandidate = getNamedExportComponentCandidate(statement, program);
      if (namedCandidate) return namedCandidate;
    }
  }

  for (const statement of program.body) {
    const candidate = getStatementComponentCandidate(statement);
    if (candidate) return candidate;
  }

  return null;
}

function findPreferredComponentCandidate(program: Program, preferredComponentNames: string[]): ComponentCandidate | null {
  const names = normalizePreferredComponentNames(preferredComponentNames);
  if (names.length === 0) return null;

  for (const name of names) {
    const defaultExport = program.body.find((statement) => statement.type === 'ExportDefaultDeclaration') as ExportDefaultDeclaration | undefined;
    if (defaultExport) {
      const defaultCandidate = getDefaultExportComponentCandidate(defaultExport, program, name);
      if (defaultCandidate) return defaultCandidate;
    }

    for (const statement of program.body) {
      if (statement.type === 'ExportNamedDeclaration') {
        const namedCandidate = getNamedExportComponentCandidate(statement, program, name);
        if (namedCandidate) return namedCandidate;
      }
    }

    for (const statement of program.body) {
      const candidate = getStatementComponentCandidate(statement, name);
      if (candidate) return candidate;
    }
  }

  return null;
}

function normalizePreferredComponentNames(names: string[]): string[] {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

function getDefaultExportComponentCandidate(
  exportDeclaration: ExportDefaultDeclaration,
  program: Program,
  expectedName?: string,
): ComponentCandidate | null {
  const declaration = exportDeclaration.declaration;
  const functionLikeDeclaration = getFunctionLikeComponentExpression(declaration);
  if (functionLikeDeclaration) {
    if (expectedName) {
      const declarationName = functionLikeDeclaration.type === 'FunctionDeclaration' || functionLikeDeclaration.type === 'FunctionExpression'
        ? functionLikeDeclaration.id?.name ?? null
        : null;
      if (declarationName !== expectedName) return null;
    }
    return getFunctionComponentCandidate(functionLikeDeclaration, 'DefaultExport');
  }

  if (declaration.type === 'Identifier') {
    if (expectedName && declaration.name !== expectedName) return null;
    return findComponentCandidateByLocalName(program, declaration.name);
  }

  const wrappedIdentifierName = getWrappedComponentIdentifierName(declaration);
  if (wrappedIdentifierName) {
    if (expectedName && wrappedIdentifierName !== expectedName) return null;
    return findComponentCandidateByLocalName(program, wrappedIdentifierName);
  }

  return null;
}

function getNamedExportComponentCandidate(
  exportDeclaration: ExportNamedDeclaration,
  program: Program,
  expectedName?: string,
): ComponentCandidate | null {
  const declaration = exportDeclaration.declaration;
  if (declaration) return getStatementComponentCandidate(declaration, expectedName);

  if (exportDeclaration.source) return null;
  for (const specifier of exportDeclaration.specifiers) {
    if (specifier.type !== 'ExportSpecifier') continue;
    const localName = getExportSpecifierName(specifier.local);
    const exportedName = getExportSpecifierName(specifier.exported);
    if (!localName || !exportedName) continue;
    if (expectedName && localName !== expectedName && exportedName !== expectedName) continue;
    const candidate = findComponentCandidateByLocalName(program, localName);
    if (!candidate) continue;
    return exportedName !== candidate.name ? { ...candidate, name: exportedName } : candidate;
  }

  return null;
}

function getStatementComponentCandidate(statement: Statement | VariableDeclaration, expectedName?: string): ComponentCandidate | null {
  return getStatementComponentCandidates(statement, expectedName)[0] ?? null;
}

function getStatementComponentCandidates(statement: Statement | VariableDeclaration, expectedName?: string): ComponentCandidate[] {
  if (statement.type === 'FunctionDeclaration') {
    if (expectedName && statement.id?.name !== expectedName) return [];
    return [getFunctionComponentCandidate(statement, statement.id?.name ?? expectedName ?? 'AnonymousFunction')];
  }

  if (statement.type === 'VariableDeclaration') {
    const candidates: ComponentCandidate[] = [];
    for (const declaration of statement.declarations) {
      const candidate = getVariableComponentCandidate(declaration, expectedName);
      if (candidate) candidates.push(candidate);
    }
    return candidates;
  }

  return [];
}

function getVariableComponentCandidate(declaration: VariableDeclarator, expectedName?: string): ComponentCandidate | null {
  if (declaration.id.type !== 'Identifier') return null;
  if (expectedName && declaration.id.name !== expectedName) return null;
  const init = declaration.init;
  const functionLikeInit = init ? getFunctionLikeComponentExpression(init) : null;
  if (!functionLikeInit) return null;
  return getFunctionComponentCandidate(functionLikeInit, declaration.id.name);
}

function isFunctionLikeComponent(node: BabelNode): node is FunctionDeclaration | ArrowFunctionExpression | FunctionExpression {
  return node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function getFunctionLikeComponentExpression(node: BabelNode): FunctionDeclaration | ArrowFunctionExpression | FunctionExpression | null {
  const unwrapped = unwrapTransparentExpression(node);
  if (isFunctionLikeComponent(unwrapped)) return unwrapped;
  if (unwrapped.type !== 'CallExpression') return null;
  if (!isComponentWrapperCall(unwrapped)) return null;

  for (const argument of unwrapped.arguments) {
    if (argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') continue;
    const functionLikeArgument = getFunctionLikeComponentExpression(argument);
    if (functionLikeArgument) return functionLikeArgument;
  }

  return null;
}

function unwrapTransparentExpression(node: BabelNode): BabelNode {
  let current = node;
  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression' ||
    current.type === 'TSTypeAssertion'
  ) {
    current = current.expression;
  }
  return current;
}

function isComponentWrapperCall(call: CallExpression): boolean {
  const calleeName = getCallExpressionCalleeName(call);
  return calleeName === 'memo' || calleeName === 'forwardRef';
}

function getCallExpressionCalleeName(call: CallExpression): string | null {
  const callee = call.callee;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') return callee.property.name;
  return null;
}

function getWrappedComponentIdentifierName(node: BabelNode): string | null {
  const unwrapped = unwrapTransparentExpression(node);
  if (unwrapped.type !== 'CallExpression' || !isComponentWrapperCall(unwrapped)) return null;
  for (const argument of unwrapped.arguments) {
    const candidate = unwrapTransparentExpression(argument);
    if (candidate.type === 'Identifier') return candidate.name;
  }
  return null;
}

function findComponentCandidateByLocalName(program: Program, name: string): ComponentCandidate | null {
  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') continue;
    if (statement.type === 'ExportNamedDeclaration') {
      if (!statement.declaration) continue;
      const candidate = getStatementComponentCandidate(statement.declaration, name);
      if (candidate) return candidate;
      continue;
    }
    const candidate = getStatementComponentCandidate(statement, name);
    if (candidate) return candidate;
  }
  return null;
}

function getNamedExportComponentCandidates(exportDeclaration: ExportNamedDeclaration, program: Program): ComponentCandidate[] {
  const candidates: ComponentCandidate[] = [];
  if (exportDeclaration.declaration) {
    for (const candidate of getStatementComponentCandidates(exportDeclaration.declaration)) {
      if (isReadableComponentCandidate(candidate)) candidates.push(candidate);
    }
    return candidates;
  }

  if (exportDeclaration.source) return candidates;
  for (const specifier of exportDeclaration.specifiers) {
    if (specifier.type !== 'ExportSpecifier') continue;
    const localName = getExportSpecifierName(specifier.local);
    const exportedName = getExportSpecifierName(specifier.exported);
    if (!localName || !exportedName) continue;
    const candidate = findComponentCandidateByLocalName(program, localName);
    if (candidate && isReadableComponentCandidate(candidate)) {
      candidates.push(exportedName !== candidate.name ? { ...candidate, name: exportedName } : candidate);
    }
  }
  return candidates;
}

function isReadableComponentCandidate(candidate: ComponentCandidate): boolean {
  return getReturnedJsx(candidate.body) !== null;
}

function inferComponentChildrenSlotKind(candidate: ComponentCandidate): ImportableComponentChildrenSlotKind | null {
  const root = getReturnedJsx(candidate.body);
  if (!root || !componentBodyReferencesChildren(candidate.body)) return null;
  if (INFERRED_INLINE_CHILD_COMPONENT_BASE_NAMES.has(getComponentBaseName(candidate.name))) return 'inline';
  return inferChildrenSlotKindFromJsxRoot(root);
}

function componentBodyReferencesChildren(node: BabelNode): boolean {
  const visited = new Set<object>();

  function visit(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (visited.has(value)) return false;
    visited.add(value);

    if (Array.isArray(value)) return value.some(visit);
    const candidate = value as BabelNode;
    if (candidate.type === 'ObjectProperty' && !candidate.computed) return visit(candidate.value);
    if (candidate.type === 'ObjectMethod' && !candidate.computed) {
      return visit(candidate.params) || visit(candidate.body);
    }
    if (candidate.type === 'JSXAttribute') return visit(candidate.value);
    if (candidate.type === 'Identifier' && candidate.name === 'children') return true;
    if (
      candidate.type === 'MemberExpression' &&
      !candidate.computed &&
      candidate.property.type === 'Identifier' &&
      candidate.property.name === 'children'
    ) {
      return true;
    }

    return Object.entries(candidate).some(([key, child]) => (
      key !== 'loc' &&
      key !== 'start' &&
      key !== 'end' &&
      key !== 'leadingComments' &&
      key !== 'innerComments' &&
      key !== 'trailingComments' &&
      visit(child)
    ));
  }

  return visit(node);
}

function inferChildrenSlotKindFromJsxRoot(root: JSXElement | JSXFragment): ImportableComponentChildrenSlotKind {
  if (root.type === 'JSXFragment') return 'block';
  const rootName = getElementName(root.openingElement.name);
  const htmlName = rootName.toLowerCase();
  if (rootName === htmlName) return INFERRED_INLINE_CHILD_ROOT_TAG_NAMES.has(htmlName) ? 'inline' : 'block';

  const baseName = getComponentBaseName(rootName);
  if (INFERRED_INLINE_CHILD_COMPONENT_BASE_NAMES.has(baseName)) return 'inline';
  return 'block';
}

function getComponentBaseName(componentName: string): string {
  const lastSegment = componentName.split('.').pop() ?? componentName;
  const prefixStripMatch = /^([A-Z][a-z]+)([A-Z][a-zA-Z0-9]+)$/.exec(lastSegment);
  return prefixStripMatch ? prefixStripMatch[2] : lastSegment;
}

const INFERRED_INLINE_CHILD_ROOT_TAG_NAMES = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'button',
  'caption',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'ins',
  'kbd',
  'label',
  'legend',
  'mark',
  'p',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'text',
  'time',
  'u',
  'var',
  'wbr',
]);

const INFERRED_INLINE_CHILD_COMPONENT_BASE_NAMES = new Set([
  'Badge',
  'Button',
  'Caption',
  'Checkbox',
  'Chip',
  'Display',
  'Eyebrow',
  'Heading',
  'Radio',
  'Switch',
  'Tag',
  'Text',
  'Toast',
  'Tooltip',
]);

function getExportSpecifierName(node: BabelNode): string | null {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'StringLiteral') return node.value;
  return null;
}

function getImportableComponentName(candidate: ComponentCandidate, fallbackName: string): string {
  if (candidate.name === 'DefaultExport' || candidate.name === 'AnonymousFunction') return fallbackName;
  return candidate.name;
}

function normalizeImportableComponentNames(names: string[]): string[] {
  const normalized: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!/^[A-Za-z_$][\w$]*$/.test(trimmed)) continue;
    if (!normalized.includes(trimmed)) normalized.push(trimmed);
  }
  return normalized;
}

function getFunctionComponentCandidate(
  node: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression,
  fallbackName: string,
): ComponentCandidate {
  const parameterFallbacks = collectFunctionParameterFallbacks(node);
  const localFallbacks = collectFunctionLocalFallbacks(node.body);
  return {
    body: node.body,
    expressionNodeFallbacks: new Map([
      ...parameterFallbacks.expressionNodeFallbacks,
      ...localFallbacks.expressionNodeFallbacks,
    ]),
    expressionTextFallbacks: new Map([
      ...parameterFallbacks.expressionTextFallbacks,
      ...localFallbacks.expressionTextFallbacks,
    ]),
    intrinsicElementAliases: parameterFallbacks.intrinsicElementAliases,
    name: node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
      ? node.id?.name ?? fallbackName
      : fallbackName,
    staticFunctionFallbacks: localFallbacks.staticFunctionFallbacks,
  };
}

function collectFunctionParameterFallbacks(
  node: FunctionDeclaration | ArrowFunctionExpression | FunctionExpression,
): {
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  intrinsicElementAliases: Set<string>;
} {
  const expressionNodeFallbacks = new Map<string, BabelNode>();
  const expressionTextFallbacks = new Map<string, string>();
  const intrinsicElementAliases = new Set<string>();
  for (const param of node.params) {
    collectPatternFallbacks(param, {
      expressionNodeFallbacks,
      expressionTextFallbacks,
      intrinsicElementAliases,
    });
  }
  return { expressionNodeFallbacks, expressionTextFallbacks, intrinsicElementAliases };
}

// Collect `const [name, setName] = useState(<literal>)` declarations so the
// Inspector can offer them as design state overrides. Non-literal initial
// values are skipped: only a literal has a value the canvas can project.
const WORKBENCH_DESIGN_STATE_GROUPS_NAME = 'workbenchDesignStateGroups';

type CollectedDesignStateMetadata = {
  description?: string;
  group: EditableTreeSourceDesignStateGroup;
  label?: string;
};

function collectDesignStateMetadata(program: Program): Map<string, CollectedDesignStateMetadata> {
  const metadataByStateName = new Map<string, CollectedDesignStateMetadata>();
  const declaration = findProgramVariableDeclarator(program, WORKBENCH_DESIGN_STATE_GROUPS_NAME);
  if (!declaration?.init) return metadataByStateName;
  const groups = unwrapTransparentExpression(declaration.init);
  if (groups.type !== 'ArrayExpression') return metadataByStateName;

  groups.elements.forEach((element, order) => {
    if (!element || element.type === 'SpreadElement') return;
    const groupNode = unwrapTransparentExpression(element);
    if (groupNode.type !== 'ObjectExpression') return;
    const id = readObjectStringProperty(groupNode, 'id');
    const label = readObjectStringProperty(groupNode, 'label');
    const stateEntries = readObjectDesignStateEntries(groupNode, 'states');
    if (!id || !label || stateEntries.length === 0) return;
    const visibility = readObjectStringProperty(groupNode, 'visibility') === 'internal'
      ? 'internal'
      : 'default';
    const configuredStatus = readObjectStringProperty(groupNode, 'status');
    const group: EditableTreeSourceDesignStateGroup = {
      defaultOpen: readObjectBooleanProperty(groupNode, 'defaultOpen') ?? false,
      id,
      label,
      order,
      status: configuredStatus === 'runtime' || visibility === 'internal' ? 'runtime' : 'preview',
      visibility,
      ...(readObjectStringProperty(groupNode, 'description')
        ? { description: readObjectStringProperty(groupNode, 'description')! }
        : {}),
    };
    for (const entry of stateEntries) {
      if (metadataByStateName.has(entry.name)) continue;
      metadataByStateName.set(entry.name, {
        group,
        ...(entry.label ? { label: entry.label } : {}),
        ...(entry.description ? { description: entry.description } : {}),
      });
    }
  });

  return metadataByStateName;
}

function findProgramVariableDeclarator(program: Program, name: string): VariableDeclarator | null {
  for (const statement of program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration'
      ? statement.declaration
      : statement;
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const candidate of declaration.declarations) {
      if (candidate.id.type === 'Identifier' && candidate.id.name === name) return candidate;
    }
  }
  return null;
}

function readObjectProperty(object: ObjectExpression, name: string): BabelNode | null {
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    if (readSimpleObjectPropertyKey(property.key) === name) return property.value;
  }
  return null;
}

function readObjectStringProperty(object: ObjectExpression, name: string): string | null {
  const value = readObjectProperty(object, name);
  return value?.type === 'StringLiteral' ? value.value : null;
}

function readObjectBooleanProperty(object: ObjectExpression, name: string): boolean | null {
  const value = readObjectProperty(object, name);
  return value?.type === 'BooleanLiteral' ? value.value : null;
}

function readObjectDesignStateEntries(
  object: ObjectExpression,
  name: string,
): Array<{ description?: string; label?: string; name: string }> {
  const value = readObjectProperty(object, name);
  if (!value) return [];
  const array = unwrapTransparentExpression(value);
  if (array.type !== 'ArrayExpression') return [];
  return array.elements.flatMap((element) => {
    if (!element || element.type === 'SpreadElement') return [];
    const entry = unwrapTransparentExpression(element);
    if (entry.type === 'StringLiteral') return [{ name: entry.value }];
    if (entry.type !== 'ObjectExpression') return [];
    const stateName = readObjectStringProperty(entry, 'name');
    if (!stateName) return [];
    const label = readObjectStringProperty(entry, 'label');
    const description = readObjectStringProperty(entry, 'description');
    return [{
      name: stateName,
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
    }];
  });
}

function collectDesignStateDeclarations(
  body: BlockStatement | Expression,
  metadataByStateName: Map<string, CollectedDesignStateMetadata> = new Map(),
): EditableTreeSourceDesignState[] {
  if (body.type !== 'BlockStatement') return [];
  const states: EditableTreeSourceDesignState[] = [];

  for (const statement of body.body) {
    if (statement.type === 'ReturnStatement') break;
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type !== 'ArrayPattern' || !declaration.init) continue;
      if (!isUseStateCallExpression(declaration.init)) continue;
      const [nameElement, setterElement] = declaration.id.elements;
      if (!nameElement || nameElement.type !== 'Identifier') continue;
      const initialArgument = declaration.init.arguments[0];
      if (!initialArgument) continue;
      const defaultValue = getLiteralInitialStateValue(initialArgument);
      if (defaultValue === null) continue;
      const metadata = metadataByStateName.get(nameElement.name);
      states.push({
        defaultValue,
        ...(metadata?.description ? { description: metadata.description } : {}),
        ...(metadata ? { group: metadata.group } : {}),
        kind: typeof defaultValue === 'boolean' ? 'boolean' : typeof defaultValue === 'number' ? 'number' : 'string',
        ...(metadata?.label ? { label: metadata.label } : {}),
        name: nameElement.name,
        ...(setterElement?.type === 'Identifier' ? { setter: setterElement.name } : {}),
      });
    }
  }

  for (const state of states) {
    if (state.kind === 'boolean') continue;
    const options = collectScalarStateOptions(body, state.name, state.defaultValue as string | number);
    if (options.length > 1) state.options = options;
  }

  return states;
}

function isUseStateCallExpression(node: BabelNode): node is BabelNode & { arguments: BabelNode[] } {
  if (node.type !== 'CallExpression') return false;
  const callee = node.callee;
  if (callee.type === 'Identifier') return callee.name === 'useState';
  return callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'useState';
}

function getLiteralInitialStateValue(node: BabelNode): string | number | boolean | null {
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') {
    return node.value;
  }
  return null;
}

// Discover the value set of a string or numeric state so the Inspector can
// offer a picker instead of a read-only value. Two sources cover the common
// patterns: comparisons (`activeTool === 'area'`, `activeTab === 2`) and
// selection components that bind the state to `value={state}` and declare
// their items as literal `value` props.
function collectScalarStateOptions(
  body: BabelNode,
  stateName: string,
  defaultValue: string | number,
): Array<string | number> {
  const literals = new Set<string | number>([defaultValue]);

  const addLiteral = (node: BabelNode) => {
    if (typeof defaultValue === 'string' && node.type === 'StringLiteral') literals.add(node.value);
    if (typeof defaultValue === 'number' && node.type === 'NumericLiteral') literals.add(node.value);
  };

  const walk = (node: unknown, visited: Set<object>, onNode: (node: BabelNode) => void) => {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node as object)) return;
    visited.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item, visited, onNode);
      return;
    }
    const candidate = node as BabelNode;
    if (typeof candidate.type === 'string') onNode(candidate);
    for (const [key, value] of Object.entries(candidate)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      walk(value, visited, onNode);
    }
  };

  const collectDescendantValueLiterals = (element: BabelNode) => {
    walk(element, new Set<object>(), (node) => {
      if (node.type !== 'JSXAttribute') return;
      if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'value') return;
      if (node.value?.type === 'StringLiteral') addLiteral(node.value);
      if (
        node.value?.type === 'JSXExpressionContainer' &&
        node.value.expression.type !== 'JSXEmptyExpression'
      ) addLiteral(node.value.expression);
    });
  };

  walk(body, new Set<object>(), (node) => {
    if (
      node.type === 'BinaryExpression' &&
      (node.operator === '===' || node.operator === '!==' || node.operator === '==' || node.operator === '!=')
    ) {
      const { left, right } = node;
      if (left.type === 'Identifier' && left.name === stateName) addLiteral(right);
      if (right.type === 'Identifier' && right.name === stateName) addLiteral(left);
      return;
    }
    if (node.type !== 'JSXElement') return;
    const bindsState = node.openingElement.attributes.some((attribute) =>
      attribute.type === 'JSXAttribute' &&
      attribute.value?.type === 'JSXExpressionContainer' &&
      attribute.value.expression.type === 'Identifier' &&
      attribute.value.expression.name === stateName);
    if (bindsState) collectDescendantValueLiterals(node);
  });

  return [...literals];
}

function collectFunctionLocalFallbacks(
  body: BlockStatement | Expression,
): {
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  staticFunctionFallbacks: Map<string, StaticFunctionFallback>;
} {
  const expressionNodeFallbacks = new Map<string, BabelNode>();
  const expressionTextFallbacks = new Map<string, string>();
  const staticFunctionFallbacks = new Map<string, StaticFunctionFallback>();
  if (body.type !== 'BlockStatement') return { expressionNodeFallbacks, expressionTextFallbacks, staticFunctionFallbacks };

  for (const statement of body.body) {
    if (statement.type === 'ReturnStatement') break;
    if (statement.type === 'FunctionDeclaration' && statement.id) {
      staticFunctionFallbacks.set(statement.id.name, statement);
      continue;
    }
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (!declaration.init) continue;
      if (declaration.id.type === 'ArrayPattern' && isUseStateCallExpression(declaration.init)) {
        const stateName = declaration.id.elements[0];
        const initialValue = declaration.init.arguments[0];
        if (
          stateName?.type === 'Identifier' &&
          initialValue &&
          initialValue.type !== 'SpreadElement' &&
          initialValue.type !== 'ArgumentPlaceholder'
        ) {
          // Object and array state are runtime implementation details, not
          // scalar Design-state controls. Their statically authored initial
          // value is still safe and useful as a first-render projection: it
          // lets derived values such as `orderByCase[activeCase]` expose the
          // real repeated children instead of collapsing the whole region to
          // an opaque expression boundary. Runtime updates remain source-only.
          expressionNodeFallbacks.set(stateName.name, initialValue);
        }
        continue;
      }
      if (declaration.id.type !== 'Identifier') continue;
      const functionLike = getFunctionLikeComponentExpression(declaration.init);
      if (functionLike) {
        staticFunctionFallbacks.set(declaration.id.name, functionLike);
        continue;
      }
      expressionNodeFallbacks.set(declaration.id.name, declaration.init);
      const textFallback = getLiteralTextFallback(declaration.init);
      if (textFallback !== null) expressionTextFallbacks.set(declaration.id.name, textFallback);
    }
  }

  return { expressionNodeFallbacks, expressionTextFallbacks, staticFunctionFallbacks };
}

function collectModuleScopeFallbacks(
  program: Program,
): {
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  staticFunctionFallbacks: Map<string, StaticFunctionFallback>;
} {
  const expressionNodeFallbacks = new Map<string, BabelNode>();
  const expressionTextFallbacks = new Map<string, string>();
  const staticFunctionFallbacks = new Map<string, StaticFunctionFallback>();

  for (const statement of program.body) {
    if (statement.type === 'FunctionDeclaration' && statement.id) {
      staticFunctionFallbacks.set(statement.id.name, statement);
      continue;
    }
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type !== 'Identifier' || !declaration.init) continue;
      const functionLike = getFunctionLikeComponentExpression(declaration.init);
      if (functionLike) {
        staticFunctionFallbacks.set(declaration.id.name, functionLike);
        continue;
      }
      expressionNodeFallbacks.set(declaration.id.name, declaration.init);
      const textFallback = getLiteralTextFallback(declaration.init);
      if (textFallback !== null) expressionTextFallbacks.set(declaration.id.name, textFallback);
    }
  }

  return { expressionNodeFallbacks, expressionTextFallbacks, staticFunctionFallbacks };
}

function collectPatternFallbacks(
  node: BabelNode,
  fallbacks: {
    expressionNodeFallbacks: Map<string, BabelNode>;
    expressionTextFallbacks: Map<string, string>;
    intrinsicElementAliases: Set<string>;
  },
) {
  if (node.type === 'AssignmentPattern') {
    const textFallback = getLiteralTextFallback(node.right);
    if (textFallback !== null && node.left.type === 'Identifier') {
      fallbacks.expressionTextFallbacks.set(node.left.name, textFallback);
      if (isSourceIntrinsicElementTagName(textFallback)) fallbacks.intrinsicElementAliases.add(node.left.name);
      return;
    }
    if ((node.right.type === 'JSXElement' || node.right.type === 'JSXFragment') && node.left.type === 'Identifier') {
      fallbacks.expressionNodeFallbacks.set(node.left.name, node.right);
      return;
    }
    collectPatternFallbacks(node.left, fallbacks);
    return;
  }

  if (node.type === 'ObjectPattern') {
    for (const property of node.properties) {
      if (property.type === 'ObjectProperty') {
        collectPatternFallbacks(property.value, fallbacks);
      } else if (property.type === 'RestElement') {
        collectPatternFallbacks(property.argument, fallbacks);
      }
    }
    return;
  }

  if (node.type === 'ArrayPattern') {
    for (const element of node.elements) {
      if (element) collectPatternFallbacks(element, fallbacks);
    }
    return;
  }

  if (node.type === 'RestElement') collectPatternFallbacks(node.argument, fallbacks);
}

function getLiteralTextFallback(node: BabelNode): string | null {
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'NumericLiteral' || node.type === 'BooleanLiteral') return String(node.value);
  if (
    node.type === 'UnaryExpression' &&
    (node.operator === '-' || node.operator === '+') &&
    node.argument.type === 'NumericLiteral'
  ) {
    return `${node.operator === '-' ? '-' : ''}${String(node.argument.value)}`;
  }
  return null;
}

function getReturnedJsx(body: BlockStatement | Expression): JSXElement | JSXFragment | null {
  if (body.type === 'JSXElement' || body.type === 'JSXFragment') return body;
  if (body.type !== 'BlockStatement') return null;

  const returns = collectReturnStatements(body.body);
  for (const returnStatement of returns) {
    const jsx = resolveReturnedJsxExpression(unwrapParenthesizedExpression(returnStatement.argument));
    if (jsx) return jsx;
  }

  return null;
}

/**
 * Find the JSX a component actually renders, through the wrappers real
 * components return it behind.
 *
 * A direct `return <div/>` is the easy case. Components that branch
 * (`return mode === 'range' ? <A/> : <B/>`) or portal
 * (`return target ? createPortal(<div>{menu}</div>, target) : menu`) return
 * JSX just as much, and treating them as non-components makes the whole
 * source file yield no importable summaries — which silently skips it in
 * registry hydration, so it never gets props, slot kind, or picker metadata.
 */
function resolveReturnedJsxExpression(node: Expression | null, depth = 0): JSXElement | JSXFragment | null {
  if (!node || depth > 6) return null;
  switch (node.type) {
    case 'JSXElement':
    case 'JSXFragment':
      return node;
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSNonNullExpression':
      return resolveReturnedJsxExpression(node.expression, depth + 1);
    case 'ConditionalExpression':
      return resolveReturnedJsxExpression(node.consequent, depth + 1) ??
        resolveReturnedJsxExpression(node.alternate, depth + 1);
    case 'LogicalExpression':
      return resolveReturnedJsxExpression(node.right, depth + 1);
    case 'CallExpression':
      // Portal helpers take the rendered tree as an argument.
      for (const argument of node.arguments) {
        if (argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') continue;
        const jsx = resolveReturnedJsxExpression(argument as Expression, depth + 1);
        if (jsx) return jsx;
      }
      return null;
    default:
      return null;
  }
}

function collectReturnStatements(statements: Statement[]): ReturnStatement[] {
  const returns: ReturnStatement[] = [];

  function visitStatement(statement: Statement) {
    switch (statement.type) {
      case 'ReturnStatement':
        returns.push(statement);
        break;
      case 'BlockStatement':
        for (const child of statement.body) visitStatement(child);
        break;
      case 'IfStatement':
        visitStatement(statement.consequent);
        if (statement.alternate && statement.alternate.type !== 'FunctionDeclaration') visitStatement(statement.alternate);
        break;
      case 'SwitchStatement':
        for (const switchCase of statement.cases) {
          for (const consequent of switchCase.consequent) visitStatement(consequent);
        }
        break;
      case 'TryStatement':
        visitStatement(statement.block);
        if (statement.handler) visitStatement(statement.handler.body);
        if (statement.finalizer) visitStatement(statement.finalizer);
        break;
      default:
        break;
    }
  }

  for (const statement of statements) visitStatement(statement);
  return returns;
}

function unwrapParenthesizedExpression(node: ReturnStatement['argument']): Expression | null {
  if (!node) return null;
  if (node.type === 'ParenthesizedExpression') return node.expression;
  return node;
}

function collectIntrinsicElementAliases(body: BlockStatement | Expression): Set<string> {
  const aliases = new Set<string>();
  if (body.type !== 'BlockStatement') return aliases;

  for (const statement of body.body) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const declaration of statement.declarations) {
      if (declaration.id.type !== 'Identifier' || !declaration.init) continue;
      if (isIntrinsicElementAliasInitializer(declaration.init)) aliases.add(declaration.id.name);
    }
  }

  return aliases;
}

function isIntrinsicElementAliasInitializer(expression: Expression): boolean {
  if (expression.type === 'StringLiteral') return isSourceIntrinsicElementTagName(expression.value);
  if (expression.type === 'TemplateLiteral') {
    const firstQuasi = expression.quasis[0]?.value.cooked ?? expression.quasis[0]?.value.raw ?? '';
    return isSourceIntrinsicElementTagName(firstQuasi);
  }
  if (expression.type === 'ConditionalExpression') {
    return isIntrinsicElementAliasInitializer(expression.consequent) &&
      isIntrinsicElementAliasInitializer(expression.alternate);
  }
  return false;
}

function convertJsxRoot(
  node: JSXElement | JSXFragment,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode | null {
  return node.type === 'JSXElement'
    ? convertJsxElement(node, path, context)
    : convertJsxFragment(node, path, context);
}

function convertJsxElement(
  element: JSXElement,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode {
  const rawTagName = getElementName(element.openingElement.name);
  const tagName = resolveStaticJsxTagName(rawTagName, context) ?? rawTagName;
  const kind = getElementKind(tagName, path.length, context);
  const authoredChildren = convertJsxChildren(element.children, path, context, tagName);
  const sourcePreviewChildren = convertStaticFunctionComponentFallbackChildren(element, tagName, path, context);
  const children = authoredChildren;
  const sourcePropsResult = kind === 'component-instance' ? getSourceProps(element, context) : {};
  const sourceStyleResult = getSourceStyleDeclarations(element, context);
  const sourceValueMetadata = mergeSourceValueMetadata(
    sourcePropsResult.sourceValueMetadata,
    sourceStyleResult.sourceValueMetadata,
  );

  return {
    id: getNodeId(context.sourceFile, path),
    label: getElementLabel(tagName, kind),
    kind,
    ...(children.length > 0 ? { children } : {}),
    ...(sourcePreviewChildren && sourcePreviewChildren.length > 0 ? { sourcePreviewChildren } : {}),
    ...(kind === 'component-instance' ? { inspectable: true } : {}),
    source: {
      ...getElementImportSource(tagName, context),
      sourceFile: context.sourceFile,
      jsxName: tagName,
    },
    ...getSourceAttributes(element, context),
    ...(kind === 'component-instance' ? getSourceJsxProps(element) : {}),
    ...sourcePropsResult,
    ...sourceStyleResult,
    ...(sourceValueMetadata ? { sourceValueMetadata } : {}),
    ...getTokenBindings(element),
    ...getSourceLocation(element),
  };
}

function convertStaticFunctionComponentFallbackChildren(
  element: JSXElement,
  tagName: string,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode[] | null {
  if (!isExpandableStaticFunctionComponentFallback(element, tagName, context)) return null;
  const fallbackFunction = context.staticFunctionFallbacks.get(tagName);
  if (!fallbackFunction) return null;
  const returnedJsx = getReturnedJsx(fallbackFunction.body);
  if (!returnedJsx) return null;

  const componentScope = collectStaticFunctionComponentScopeEntries(element, fallbackFunction, path, tagName, context);
  if (!componentScope) return null;
  const localFallbacks = collectFunctionLocalFallbacks(fallbackFunction.body);
  const fallbackContext = createScopedTreeBuildContext(
    context,
    componentScope.scopedValueEntries,
    mergeTreeBuildFallbackEntries(localFallbacks, componentScope.fallbackEntries),
  );
  fallbackContext.staticFunctionExpansionStack = new Set([
    ...context.staticFunctionExpansionStack,
    tagName,
  ]);

  const previewPath = [...path, SOURCE_PREVIEW_FALLBACK_PATH_INDEX];
  return returnedJsx.type === 'JSXFragment'
    ? convertJsxChildren(returnedJsx.children, previewPath, fallbackContext, tagName)
    : [convertJsxElement(returnedJsx, previewPath, fallbackContext)];
}

function isExpandableStaticFunctionComponentFallback(
  element: JSXElement,
  tagName: string,
  context: TreeBuildContext,
): boolean {
  if (!/^[A-Z][\w$]*$/.test(tagName)) return false;
  if (context.componentImports.has(tagName)) return false;
  if (context.staticFunctionExpansionStack.has(tagName)) return false;
  const fallbackFunction = context.staticFunctionFallbacks.get(tagName);
  return Boolean(fallbackFunction && fallbackFunction.params.length <= 1);
}

function collectStaticFunctionComponentScopeEntries(
  element: JSXElement,
  fallbackFunction: StaticFunctionFallback,
  path: number[],
  tagName: string,
  context: TreeBuildContext,
): TreeBuildScopeEntries | null {
  const attributes = collectStaticJsxAttributeFallbacks(element, context);
  if (!attributes) return null;
  const scope = createEmptyTreeBuildScopeEntries();
  addStaticChildrenFallback(scope.fallbackEntries, 'children', element.children, path, tagName);

  const param = fallbackFunction.params[0];
  if (!param) return scope;
  if (fallbackFunction.params.length > 1) return null;

  if (param.type === 'Identifier') {
    const propsValue: Record<string, StaticExpressionValue> = {};
    for (const [name, value] of attributes.values) propsValue[name] = value;
    scope.scopedValueEntries.push([param.name, propsValue]);
    for (const [name, value] of attributes.expressionNodeFallbacks) {
      getFallbackMap(scope.fallbackEntries, 'expressionNodeFallbacks').set(`${param.name}.${name}`, value);
    }
    for (const [name, value] of attributes.expressionTextFallbacks) {
      getFallbackMap(scope.fallbackEntries, 'expressionTextFallbacks').set(`${param.name}.${name}`, value);
    }
    for (const [name, value] of attributes.staticFunctionFallbacks) {
      getFallbackMap(scope.fallbackEntries, 'staticFunctionFallbacks').set(`${param.name}.${name}`, value);
    }
    addStaticChildrenFallback(scope.fallbackEntries, `${param.name}.children`, element.children, path, tagName);
    return scope;
  }

  if (param.type !== 'ObjectPattern') return null;
  for (const property of param.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    const propName = readSimpleObjectPropertyKey(property.key);
    const localName = getPatternBindingIdentifierName(property.value);
    if (!propName || !localName) continue;
    copyStaticComponentPropFallback(propName, localName, attributes, scope);
    if (propName === 'children') addStaticChildrenFallback(scope.fallbackEntries, localName, element.children, path, tagName);
  }

  return scope;
}

type StaticComponentAttributeFallbacks = {
  expressionNodeFallbacks: Map<string, BabelNode>;
  expressionTextFallbacks: Map<string, string>;
  staticFunctionFallbacks: Map<string, StaticFunctionFallback>;
  values: Map<string, StaticExpressionValue>;
};

function collectStaticJsxAttributeFallbacks(
  element: JSXElement,
  context: TreeBuildContext,
): StaticComponentAttributeFallbacks | null {
  const fallbacks: StaticComponentAttributeFallbacks = {
    expressionNodeFallbacks: new Map(),
    expressionTextFallbacks: new Map(),
    staticFunctionFallbacks: new Map(),
    values: new Map(),
  };

  for (const attribute of element.openingElement.attributes) {
    if (attribute.type === 'JSXSpreadAttribute') return null;
    const attributeName = getAttributeName(attribute);
    if (!attributeName) return null;
    if (!attribute.value) {
      fallbacks.values.set(attributeName, true);
      fallbacks.expressionTextFallbacks.set(attributeName, 'true');
      continue;
    }
    if (attribute.value.type === 'StringLiteral') {
      fallbacks.values.set(attributeName, attribute.value.value);
      fallbacks.expressionTextFallbacks.set(attributeName, attribute.value.value);
      continue;
    }
    if (attribute.value.type !== 'JSXExpressionContainer') continue;
    const expression = attribute.value.expression;
    if (expression.type === 'JSXEmptyExpression') continue;
    if (expression.type === 'ArrowFunctionExpression' || expression.type === 'FunctionExpression') {
      fallbacks.staticFunctionFallbacks.set(attributeName, expression);
      continue;
    }
    fallbacks.expressionNodeFallbacks.set(attributeName, expression);
    const textFallback = getLiteralTextFallback(expression);
    if (textFallback !== null) fallbacks.expressionTextFallbacks.set(attributeName, textFallback);
    const value = evaluateStaticExpression(expression, context);
    if (value !== undefined) fallbacks.values.set(attributeName, value);
  }

  return fallbacks;
}

function copyStaticComponentPropFallback(
  propName: string,
  localName: string,
  attributes: StaticComponentAttributeFallbacks,
  scope: TreeBuildScopeEntries,
) {
  if (attributes.values.has(propName)) {
    scope.scopedValueEntries.push([localName, attributes.values.get(propName)!]);
  }
  const nodeFallback = attributes.expressionNodeFallbacks.get(propName);
  if (nodeFallback) getFallbackMap(scope.fallbackEntries, 'expressionNodeFallbacks').set(localName, nodeFallback);
  const textFallback = attributes.expressionTextFallbacks.get(propName);
  if (textFallback !== undefined) getFallbackMap(scope.fallbackEntries, 'expressionTextFallbacks').set(localName, textFallback);
  const functionFallback = attributes.staticFunctionFallbacks.get(propName);
  if (functionFallback) getFallbackMap(scope.fallbackEntries, 'staticFunctionFallbacks').set(localName, functionFallback);
}

function getPatternBindingIdentifierName(node: BabelNode): string | null {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'AssignmentPattern' && node.left.type === 'Identifier') return node.left.name;
  if (node.type === 'RestElement' && node.argument.type === 'Identifier') return node.argument.name;
  return null;
}

function createEmptyTreeBuildScopeEntries(): TreeBuildScopeEntries {
  return {
    fallbackEntries: {},
    scopedValueEntries: [],
  };
}

function addStaticChildrenFallback(
  entries: TreeBuildFallbackEntries,
  name: string,
  children: JsxChild[],
  parentPath: number[],
  parentJsxName: string,
) {
  if (!hasRenderableStaticChildren(children)) return;
  getFallbackMap(entries, 'staticChildrenFallbacks').set(name, {
    children,
    parentJsxName,
    parentPath,
  });
}

function hasRenderableStaticChildren(children: JsxChild[]): boolean {
  return children.some((child) => child.type !== 'JSXText' || Boolean(normalizeText(child.value)));
}

function mergeTreeBuildFallbackEntries(
  ...sources: TreeBuildFallbackEntries[]
): TreeBuildFallbackEntries {
  const merged: TreeBuildFallbackEntries = {};
  for (const source of sources) {
    for (const [key, value] of source.expressionNodeFallbacks ?? []) {
      getFallbackMap(merged, 'expressionNodeFallbacks').set(key, value);
    }
    for (const [key, value] of source.expressionTextFallbacks ?? []) {
      getFallbackMap(merged, 'expressionTextFallbacks').set(key, value);
    }
    for (const [key, value] of source.staticChildrenFallbacks ?? []) {
      getFallbackMap(merged, 'staticChildrenFallbacks').set(key, value);
    }
    for (const [key, value] of source.staticFunctionFallbacks ?? []) {
      getFallbackMap(merged, 'staticFunctionFallbacks').set(key, value);
    }
  }
  return merged;
}

function getFallbackMap(entries: TreeBuildFallbackEntries, key: 'expressionNodeFallbacks'): Map<string, BabelNode>;
function getFallbackMap(entries: TreeBuildFallbackEntries, key: 'expressionTextFallbacks'): Map<string, string>;
function getFallbackMap(entries: TreeBuildFallbackEntries, key: 'staticChildrenFallbacks'): Map<string, StaticChildrenFallback>;
function getFallbackMap(entries: TreeBuildFallbackEntries, key: 'staticFunctionFallbacks'): Map<string, StaticFunctionFallback>;
function getFallbackMap(
  entries: TreeBuildFallbackEntries,
  key: keyof TreeBuildFallbackEntries,
): Map<string, BabelNode> | Map<string, string> | Map<string, StaticChildrenFallback> | Map<string, StaticFunctionFallback> {
  if (!entries[key]) {
    entries[key] = new Map() as never;
  }
  return entries[key] as never;
}

function collectComponentImports(program: Program): Map<string, { importName: string; importSource: string }> {
  const imports = new Map<string, { importName: string; importSource: string }>();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    collectComponentImportSpecifiers(statement, imports);
  }
  return imports;
}

function collectDataImports(
  program: Program,
  sourceFile: string,
): TreeBuildContext['dataImports'] {
  const imports: TreeBuildContext['dataImports'] = new Map();
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    const importSource = statement.source.value;
    if (!importSource) continue;
    const importKind = importSource.endsWith('.json') ? 'json-file' : 'module';
    const resolvedPath = importKind === 'json-file' && importSource.startsWith('.')
      ? resolveRelativeSourcePath(sourceFile, importSource)
      : undefined;
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier') {
        const importedName = specifier.imported.type === 'Identifier'
          ? specifier.imported.name
          : specifier.imported.value;
        imports.set(specifier.local.name, {
          importName: importedName,
          importSource,
          kind: importKind,
          ...(resolvedPath ? { path: resolvedPath } : {}),
        });
        continue;
      }
      if (specifier.type === 'ImportDefaultSpecifier') {
        imports.set(specifier.local.name, {
          importName: 'default',
          importSource,
          kind: importKind,
          ...(resolvedPath ? { path: resolvedPath } : {}),
        });
        continue;
      }
      if (specifier.type === 'ImportNamespaceSpecifier') {
        imports.set(specifier.local.name, {
          importName: '*',
          importSource,
          kind: importKind,
          ...(resolvedPath ? { path: resolvedPath } : {}),
        });
      }
    }
  }
  return imports;
}

function collectComponentImportSpecifiers(
  declaration: ImportDeclaration,
  imports: Map<string, { importName: string; importSource: string }>,
) {
  const importSource = declaration.source.value;
  if (!importSource) return;
  for (const specifier of declaration.specifiers) {
    if (specifier.type === 'ImportSpecifier') {
      const localName = specifier.local.name;
      const importedName = specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value;
      imports.set(localName, { importName: importedName, importSource });
      continue;
    }
    if (specifier.type === 'ImportDefaultSpecifier') {
      imports.set(specifier.local.name, { importName: 'default', importSource });
      continue;
    }
    if (specifier.type === 'ImportNamespaceSpecifier') {
      imports.set(specifier.local.name, { importName: '*', importSource });
    }
  }
}

function getElementImportSource(
  tagName: string,
  context: TreeBuildContext,
): { importName?: string; importSource?: string } {
  const localName = tagName.split('.')[0] ?? tagName;
  const importInfo = context.componentImports.get(localName);
  if (!importInfo) return {};
  return importInfo;
}

function resolveRelativeSourcePath(sourceFile: string, importSource: string): string {
  const sourceDir = sourceFile.split('/').slice(0, -1);
  const result: string[] = [];
  for (const segment of [...sourceDir, ...importSource.split('/')]) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      result.pop();
      continue;
    }
    result.push(segment);
  }
  return result.join('/');
}

function convertJsxFragment(
  fragment: JSXFragment,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode {
  const children = convertJsxChildren(fragment.children, path, context, 'Fragment');

  return {
    id: getNodeId(context.sourceFile, path),
    label: 'Fragment',
    kind: 'frame',
    ...(children.length > 0 ? { children } : {}),
    source: {
      sourceFile: context.sourceFile,
      jsxName: 'Fragment',
    },
    ...getSourceLocation(fragment),
  };
}

function convertJsxChildren(
  children: JsxChild[],
  parentPath: number[],
  context: TreeBuildContext,
  parentJsxName: string,
): EditableTreeNode[] {
  const nodes: EditableTreeNode[] = [];
  let semanticChildIndex = 0;
  for (let sourceChildIndex = 0; sourceChildIndex < children.length; sourceChildIndex += 1) {
    const child = children[sourceChildIndex]!;
    const nextPath = [...parentPath, semanticChildIndex];
    if (child.type === 'JSXText') {
      const text = normalizeText(child.value);
      if (isPreservedSourceWhitespaceText(text, parentJsxName)) {
        nodes.push(createWhitespaceTextNode(
          text,
          nextPath,
          sourceChildIndex,
          context.sourceFile,
          child,
        ));
        continue;
      }
    }
    const converted = convertJsxChild(child, nextPath, context, parentJsxName);
    if (converted.length > 0) {
      nodes.push(...converted);
      semanticChildIndex += converted.length;
    }
  }
  return nodes;
}

function convertJsxChild(
  child: JsxChild,
  path: number[],
  context: TreeBuildContext,
  parentJsxName: string,
): EditableTreeNode[] {
  if (child.type === 'JSXElement') return [convertJsxElement(child, path, context)];
  if (child.type === 'JSXFragment') return [convertJsxFragment(child, path, context)];

  if (child.type === 'JSXText') {
    const text = normalizeText(child.value);
    return isEditableJsxText(text, parentJsxName)
      ? [createTextNode(text, path, context.sourceFile, child)]
      : [];
  }

  if (child.type === 'JSXExpressionContainer') {
    return convertJsxExpression(child, path, context);
  }

  return [];
}

function convertJsxExpression(
  container: JSXExpressionContainer,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode[] {
  const expression = container.expression;
  if (expression.type === 'JSXEmptyExpression') return [];
  const convertedMap = convertStaticMapExpression(expression, path, context);
  if (convertedMap) return convertedMap;
  const convertedStaticChildren = convertStaticChildrenReferenceExpression(expression, path, context);
  if (convertedStaticChildren) return convertedStaticChildren;
  const convertedValue = convertKnownJsxExpressionValue(expression, path, context, container);
  if (convertedValue) return convertedValue;

  const convertedChildrenFallback = convertChildrenFallbackExpression(expression, path, context, container);
  if (convertedChildrenFallback) return convertedChildrenFallback;

  if (isRuntimeChildrenExpression(expression)) return [];

  const i18nBinding = extractI18nCallBinding(expression);
  if (i18nBinding) {
    const node = createTextNode(i18nBinding.id, path, context.sourceFile, container);
    node.tokenBindings = { ...(node.tokenBindings ?? {}), text: i18nBinding.id };
    return [node];
  }

  const sourceExpression = describeSourceExpression(expression, context);
  context.unsupportedExpressions.add(sourceExpression.label);
  return [createExpressionNode(sourceExpression, path, context.sourceFile, container)];
}

function convertKnownJsxExpressionValue(
  node: BabelNode,
  path: number[],
  context: TreeBuildContext,
  sourceNode: BabelNode,
): EditableTreeNode[] | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'StringLiteral' || expression.type === 'NumericLiteral' || expression.type === 'BooleanLiteral') {
    return [createTextNode(String(expression.value), path, context.sourceFile, sourceNode)];
  }
  if (expression.type === 'JSXElement' || expression.type === 'JSXFragment') {
    const converted = convertJsxRoot(expression, path, context);
    return converted ? [converted] : [];
  }
  if (expression.type === 'ConditionalExpression') {
    // With a resolvable test (a design state override, or any statically known
    // value) project the branch the running page would render. Otherwise keep
    // the historical consequent-first fallback.
    const testValue = evaluateStaticExpression(expression.test, context);
    if (isStaticConditionValue(testValue)) {
      const branch = testValue ? expression.consequent : expression.alternate;
      return convertKnownJsxExpressionValue(branch, path, context, sourceNode) ?? [];
    }
    return convertKnownJsxExpressionValue(expression.consequent, path, context, sourceNode) ??
      convertKnownJsxExpressionValue(expression.alternate, path, context, sourceNode);
  }
  if (expression.type === 'LogicalExpression' && (expression.operator === '&&' || expression.operator === '||')) {
    const leftValue = evaluateStaticExpression(expression.left, context);
    if (isStaticConditionValue(leftValue)) {
      if (expression.operator === '&&') {
        return leftValue ? convertKnownJsxExpressionValue(expression.right, path, context, sourceNode) ?? [] : [];
      }
      if (leftValue) return [createTextNode(String(leftValue), path, context.sourceFile, sourceNode)];
      return convertKnownJsxExpressionValue(expression.right, path, context, sourceNode) ?? [];
    }
  }
  if (expression.type === 'CallExpression') {
    const convertedCall = convertStaticJsxFunctionCallExpression(expression, path, context, sourceNode);
    if (convertedCall) return convertedCall;
  }
  // Component helpers often keep authored JSX leaves in a local lookup and
  // map an ordered key list over it (`order.map(key => children[key])`). Once
  // the key is statically known, render that exact JSX node. This preserves
  // reorderable runtime source while keeping the first-render Design canvas
  // visually meaningful and selectable.
  const resolvedSourceNode = resolveStaticExpressionSourceNode(expression, context);
  if (resolvedSourceNode) {
    const resolvedExpression = unwrapTransparentExpression(resolvedSourceNode);
    if (resolvedExpression.type === 'JSXElement' || resolvedExpression.type === 'JSXFragment') {
      const converted = convertJsxRoot(resolvedExpression, path, context);
      return converted ? [converted] : [];
    }
  }
  const staticValue = evaluateStaticExpression(expression, context);
  if (isStaticPrimitiveValue(staticValue)) {
    return [createTextNode(String(staticValue), path, context.sourceFile, sourceNode)];
  }
  if (expression.type === 'Identifier') {
    const scopedValue = context.scopedValueFallbacks.get(expression.name);
    if (isStaticPrimitiveValue(scopedValue)) return [createTextNode(String(scopedValue), path, context.sourceFile, sourceNode)];
    const fallback = context.expressionTextFallbacks.get(expression.name);
    if (fallback !== undefined) return [createTextNode(fallback, path, context.sourceFile, sourceNode)];
    const fallbackNode = context.expressionNodeFallbacks.get(expression.name);
    if (fallbackNode) return convertKnownJsxExpressionValue(fallbackNode, path, context, sourceNode);
  }
  return null;
}

function convertStaticChildrenReferenceExpression(
  node: BabelNode,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode[] | null {
  const key = getStaticReferencePath(node);
  if (!key) return null;
  const fallback = context.staticChildrenFallbacks.get(key);
  return fallback
    ? markForwardedSourcePreviewChildren(convertJsxChildren(
        fallback.children,
        fallback.parentPath,
        context,
        fallback.parentJsxName,
      ))
    : null;
}

function markForwardedSourcePreviewChildren(nodes: EditableTreeNode[]): EditableTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    sourcePreviewOrigin: 'forwarded-source-child',
  }));
}

function getStaticReferencePath(node: BabelNode): string | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'Identifier') return expression.name;
  if (
    expression.type !== 'MemberExpression' ||
    expression.computed ||
    expression.property.type !== 'Identifier'
  ) return null;
  const objectPath = getStaticReferencePath(expression.object);
  return objectPath ? `${objectPath}.${expression.property.name}` : null;
}

function convertStaticJsxFunctionCallExpression(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  path: number[],
  context: TreeBuildContext,
  sourceNode: BabelNode,
): EditableTreeNode[] | null {
  const calleeKey = getStaticReferencePath(expression.callee);
  if (!calleeKey) return null;
  const staticFunction = context.staticFunctionFallbacks.get(calleeKey);
  if (!staticFunction) return null;
  const seenKey = `jsx-call:${calleeKey}`;
  if (context.staticFunctionExpansionStack.has(seenKey)) return null;

  const callScope = collectStaticFunctionCallScopeEntries(staticFunction, expression.arguments, context);
  if (!callScope) return null;
  const localFallbacks = collectFunctionLocalFallbacks(staticFunction.body);
  const functionContext = createScopedTreeBuildContext(
    context,
    callScope.scopedValueEntries,
    mergeTreeBuildFallbackEntries(localFallbacks, callScope.fallbackEntries),
  );
  functionContext.staticFunctionExpansionStack = new Set([
    ...context.staticFunctionExpansionStack,
    seenKey,
  ]);

  const returnNode = getStaticFunctionReturnNode(staticFunction.body);
  if (!returnNode) return null;
  if (returnNode.type === 'JSXElement' || returnNode.type === 'JSXFragment') {
    const converted = convertJsxRoot(returnNode, path, functionContext);
    return converted ? [converted] : [];
  }
  return isExpressionNode(returnNode)
    ? convertKnownJsxExpressionValue(returnNode, path, functionContext, sourceNode)
    : null;
}

function collectStaticFunctionCallScopeEntries(
  fn: StaticFunctionFallback,
  args: CallExpression['arguments'],
  context: TreeBuildContext,
): TreeBuildScopeEntries | null {
  const scope = createEmptyTreeBuildScopeEntries();
  fn.params.forEach((param, index) => {
    const argument = args[index];
    if (param.type === 'Identifier') {
      collectStaticFunctionArgumentFallback(param.name, argument, context, scope);
      return;
    }
    if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
      if (!collectStaticFunctionArgumentFallback(param.left.name, argument, context, scope)) {
        collectStaticFunctionArgumentFallback(param.left.name, param.right, context, scope);
      }
      return;
    }
    if (param.type === 'ObjectPattern') {
      const value = argument && argument.type !== 'SpreadElement' && argument.type !== 'ArgumentPlaceholder'
        ? evaluateStaticExpression(argument, context)
        : undefined;
      if (!isStaticObjectValue(value)) return;
      const objectValue = value as Record<string, StaticExpressionValue>;
      for (const property of param.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        const propName = readSimpleObjectPropertyKey(property.key);
        const localName = getPatternBindingIdentifierName(property.value);
        if (!propName || !localName || objectValue[propName] === undefined) continue;
        scope.scopedValueEntries.push([localName, objectValue[propName]]);
      }
    }
  });
  return scope;
}

function collectStaticFunctionArgumentFallback(
  localName: string,
  argument: CallExpression['arguments'][number] | Expression | undefined,
  context: TreeBuildContext,
  scope: TreeBuildScopeEntries,
): boolean {
  if (!argument || argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') return false;
  if (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression') {
    getFallbackMap(scope.fallbackEntries, 'staticFunctionFallbacks').set(localName, argument);
    return true;
  }
  if (argument.type === 'JSXElement' || argument.type === 'JSXFragment') {
    getFallbackMap(scope.fallbackEntries, 'expressionNodeFallbacks').set(localName, argument);
    return true;
  }
  if (!isExpressionNode(argument)) return false;
  getFallbackMap(scope.fallbackEntries, 'expressionNodeFallbacks').set(localName, argument);
  const textFallback = getLiteralTextFallback(argument);
  if (textFallback !== null) getFallbackMap(scope.fallbackEntries, 'expressionTextFallbacks').set(localName, textFallback);
  const value = evaluateStaticExpression(argument, context);
  if (value !== undefined) scope.scopedValueEntries.push([localName, value]);
  return true;
}

function convertStaticMapExpression(
  expression: Expression,
  path: number[],
  context: TreeBuildContext,
): EditableTreeNode[] | null {
  const unwrappedExpression = unwrapTransparentExpression(expression);
  if (unwrappedExpression.type !== 'CallExpression') return null;
  if (
    unwrappedExpression.callee.type !== 'MemberExpression' ||
    unwrappedExpression.callee.computed ||
    unwrappedExpression.callee.property.type !== 'Identifier' ||
    unwrappedExpression.callee.property.name !== 'map'
  ) {
    return null;
  }

  const sourceItems = evaluateStaticExpression(unwrappedExpression.callee.object, context);
  if (!Array.isArray(sourceItems)) return null;

  const callback = unwrappedExpression.arguments[0];
  if (!callback || callback.type === 'SpreadElement' || callback.type === 'ArgumentPlaceholder') return null;
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') return null;

  const itemParam = callback.params[0];
  const indexParam = callback.params[1];
  if (!itemParam || itemParam.type !== 'Identifier') return null;

  const callbackReturn = getStaticFunctionReturnNode(callback.body);
  if (!callbackReturn) return null;
  const callbackLocalFallbacks = collectFunctionLocalFallbacks(callback.body);
  const sourceExpression = describeSourceExpression(unwrappedExpression, context);
  const sourceItemsValue = staticValueToSourcePropValue(sourceItems);
  const editableItems = isEditableTreeSourcePropArrayValue(sourceItemsValue) ? sourceItemsValue : undefined;
  const sourceNode = resolveStaticExpressionSourceNode(unwrappedExpression.callee.object, context);
  const sourceCode = sourceExpression.mapSource?.code ?? getSourceText(unwrappedExpression.callee.object, context);
  const sourceMapReference = createSourceMapArrayReference(sourceItems, sourceNode, context);
  const sourceMapBindingBase = {
    expression: sourceExpression,
    itemCount: sourceItems.length,
    ...(editableItems ? { items: editableItems } : {}),
    ...(sourceMapReference ? { reference: sourceMapReference } : {}),
    source: {
      code: sourceCode,
      label: sourceCode,
      ...(sourceExpression.mapSource?.propName ? { propName: sourceExpression.mapSource.propName } : {}),
      writable: Boolean(editableItems && sourceNode?.type === 'ArrayExpression'),
    },
  } satisfies Omit<EditableTreeSourceMapBinding, 'itemIndex' | 'scope'>;

  const renderedItems = sourceItems.flatMap((item, index) => {
    const scopedSourceFallbacks: TreeBuildFallbackEntries = {};
    if (sourceNode?.type === 'ArrayExpression') {
      const sourceElement = sourceNode.elements[index];
      if (sourceElement && sourceElement.type !== 'SpreadElement') {
        getFallbackMap(scopedSourceFallbacks, 'expressionNodeFallbacks').set(itemParam.name, sourceElement);
      }
    }
    const itemContext = createScopedTreeBuildContext(context, [
      [itemParam.name, item],
      ...(indexParam?.type === 'Identifier' ? [[indexParam.name, index] as const] : []),
    ], mergeTreeBuildFallbackEntries(callbackLocalFallbacks, scopedSourceFallbacks));
    const converted = callbackReturn.type === 'JSXElement' || callbackReturn.type === 'JSXFragment'
      ? (() => {
          const convertedRoot = convertJsxRoot(callbackReturn, [...path, index], itemContext);
          return convertedRoot ? [convertedRoot] : [];
        })()
      : isExpressionNode(callbackReturn)
        ? convertKnownJsxExpressionValue(callbackReturn, [...path, index], itemContext, callbackReturn) ?? []
        : [];
    return converted;
  });

  const sourceLabel = sourceMapBindingBase.source.label;
  return [{
    id: getNodeId(context.sourceFile, path),
    label: `Map · ${sourceLabel} · ${sourceItems.length} ${sourceItems.length === 1 ? 'item' : 'items'}`,
    kind: 'frame',
    ...(renderedItems.length > 0 ? { children: renderedItems } : {}),
    source: {
      sourceFile: context.sourceFile,
      jsxName: 'Fragment',
    },
    sourceExpression,
    sourceMapBinding: {
      ...sourceMapBindingBase,
      scope: 'collection',
    },
    ...getSourceLocation(unwrappedExpression),
  }];
}

function isEditableTreeSourcePropArrayValue(value: EditableTreeSourcePropValue | null): value is EditableTreeSourcePropArray {
  return Array.isArray(value) &&
    value.every((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
}

function createSourceMapArrayReference(
  sourceItems: StaticExpressionValue[],
  sourceNode: BabelNode | null,
  context: TreeBuildContext,
): EditableTreeSourcePropArrayReference | undefined {
  const items = sourceItems.map((item) => {
    if (!isStaticObjectValue(item)) return {};
    return Object.fromEntries(
      Object.entries(item).flatMap(([key, value]): Array<[string, string]> => {
        const reference = formatStaticReferenceValue(value);
        return reference ? [[key, reference]] : [];
      }),
    );
  });
  const hasReferences = items.some((item) => Object.keys(item).length > 0);
  const code = sourceNode?.type === 'ArrayExpression' ? getSourceText(sourceNode, context) : undefined;
  return hasReferences || code
    ? {
        ...(code ? { code } : {}),
        items,
      }
    : undefined;
}

function createScopedTreeBuildContext(
  context: TreeBuildContext,
  entries: Array<readonly [string, StaticExpressionValue]>,
  fallbackEntries?: TreeBuildFallbackEntries,
): TreeBuildContext {
  return {
    ...context,
    expressionNodeFallbacks: fallbackEntries?.expressionNodeFallbacks
      ? new Map([
          ...context.expressionNodeFallbacks,
          ...fallbackEntries.expressionNodeFallbacks,
        ])
      : context.expressionNodeFallbacks,
    expressionTextFallbacks: fallbackEntries?.expressionTextFallbacks
      ? new Map([
          ...context.expressionTextFallbacks,
          ...fallbackEntries.expressionTextFallbacks,
        ])
      : context.expressionTextFallbacks,
    staticChildrenFallbacks: fallbackEntries?.staticChildrenFallbacks
      ? new Map([
          ...context.staticChildrenFallbacks,
          ...fallbackEntries.staticChildrenFallbacks,
        ])
      : context.staticChildrenFallbacks,
    staticFunctionFallbacks: fallbackEntries?.staticFunctionFallbacks
      ? new Map([
          ...context.staticFunctionFallbacks,
          ...fallbackEntries.staticFunctionFallbacks,
        ])
      : context.staticFunctionFallbacks,
    scopedValueFallbacks: new Map([
      ...context.scopedValueFallbacks,
      ...entries,
    ]),
  };
}

function convertChildrenFallbackExpression(
  expression: Expression,
  path: number[],
  context: TreeBuildContext,
  sourceNode: BabelNode,
): EditableTreeNode[] | null {
  const unwrappedExpression = unwrapTransparentExpression(expression);
  if (unwrappedExpression.type !== 'LogicalExpression') return null;
  if (unwrappedExpression.operator !== '??' && unwrappedExpression.operator !== '||') return null;
  if (!isChildrenReferenceExpression(unwrappedExpression.left)) return null;
  return convertKnownJsxExpressionValue(unwrappedExpression.right, path, context, sourceNode) ?? [];
}

function isRuntimeChildrenExpression(expression: Expression): boolean {
  const unwrappedExpression = unwrapTransparentExpression(expression);
  return isChildrenReferenceExpression(unwrappedExpression) || isChildrenMapExpression(unwrappedExpression);
}

function isChildrenMapExpression(node: BabelNode): boolean {
  const expression = unwrapTransparentExpression(node);
  if (expression.type !== 'CallExpression') return false;
  if (!isChildrenMapCallee(expression.callee)) return false;
  const firstArgument = expression.arguments[0];
  return firstArgument ? isChildrenReferenceExpression(firstArgument) : false;
}

function isChildrenMapCallee(callee: CallExpression['callee']): boolean {
  if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier' || callee.property.name !== 'map') {
    return false;
  }
  const object = unwrapTransparentExpression(callee.object);
  if (object.type === 'Identifier') return object.name === 'Children' || object.name === 'children';
  if (object.type === 'MemberExpression' && !object.computed && object.property.type === 'Identifier') {
    return object.property.name === 'Children';
  }
  return false;
}

function isChildrenReferenceExpression(node: BabelNode): boolean {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'Identifier') return expression.name === 'children';
  if (expression.type !== 'MemberExpression' || expression.computed || expression.property.type !== 'Identifier') return false;
  return expression.property.name === 'children';
}

function resolveStaticJsxTagName(tagName: string, context: TreeBuildContext): string | null {
  const value = tagName.includes('.')
    ? evaluateStaticMemberPath(tagName.split('.'), context)
    : evaluateStaticExpression({ type: 'Identifier', name: tagName } as BabelNode, context);
  return isStaticIdentifierValue(value) ? value.name : null;
}

function evaluateStaticExpression(
  node: BabelNode,
  context: TreeBuildContext,
  seen = new Set<string>(),
): StaticExpressionValue | undefined {
  const expression = unwrapTransparentExpression(node);
  switch (expression.type) {
    case 'StringLiteral':
      return expression.value;
    case 'NumericLiteral':
      return expression.value;
    case 'UnaryExpression': {
      if (
        (expression.operator === '-' || expression.operator === '+') &&
        expression.argument.type === 'NumericLiteral'
      ) {
        return expression.operator === '-' ? -expression.argument.value : expression.argument.value;
      }
      return undefined;
    }
    case 'BooleanLiteral':
      return expression.value;
    case 'NullLiteral':
      return null;
    case 'Identifier': {
      if (context.scopedValueFallbacks.has(expression.name)) return context.scopedValueFallbacks.get(expression.name);
      if (seen.has(expression.name)) return undefined;
      const fallbackNode = context.expressionNodeFallbacks.get(expression.name);
      if (!fallbackNode) return { kind: 'identifier', name: expression.name };
      const nextSeen = new Set(seen);
      nextSeen.add(expression.name);
      return evaluateStaticExpression(fallbackNode, context, nextSeen);
    }
    case 'ArrayExpression':
      return expression.elements.flatMap((element) => {
        if (!element || element.type === 'SpreadElement') return [];
        const value = evaluateStaticExpression(element, context, seen);
        return value === undefined ? [] : [value];
      });
    case 'ObjectExpression': {
      const value: Record<string, StaticExpressionValue> = {};
      for (const property of expression.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        const key = readSimpleObjectPropertyKey(property.key);
        if (!key) continue;
        const propertyValue = evaluateStaticExpression(property.value, context, seen);
        if (propertyValue !== undefined) value[key] = propertyValue;
      }
      return value;
    }
    case 'MemberExpression':
      return evaluateStaticMemberExpression(expression, context, seen);
    case 'BinaryExpression':
      return evaluateStaticBinaryExpression(expression, context, seen);
    case 'CallExpression':
      return evaluateStaticCallExpression(expression, context, seen);
    case 'ConditionalExpression': {
      const testValue = evaluateStaticExpression(expression.test, context, seen);
      if (isStaticConditionValue(testValue)) {
        return evaluateStaticExpression(
          testValue ? expression.consequent : expression.alternate,
          context,
          seen,
        );
      }
      return evaluateStaticExpression(expression.consequent, context, seen) ??
        evaluateStaticExpression(expression.alternate, context, seen);
    }
    case 'LogicalExpression': {
      const leftValue = evaluateStaticExpression(expression.left, context, seen);
      if (isStaticConditionValue(leftValue)) {
        if (expression.operator === '&&') {
          return leftValue ? evaluateStaticExpression(expression.right, context, seen) : leftValue;
        }
        if (expression.operator === '||') {
          return leftValue || evaluateStaticExpression(expression.right, context, seen);
        }
        if (expression.operator === '??') {
          // Null is a static condition value, but `??` must still fall through
          // to the authored fallback: `useState(null)` widths rely on
          // `width ?? 1160` resolving to 1160 on the first projected render.
          return leftValue === null
            ? evaluateStaticExpression(expression.right, context, seen)
            : leftValue;
        }
      }
      return leftValue ?? evaluateStaticExpression(expression.right, context, seen);
    }
    case 'TemplateLiteral':
      return evaluateStaticTemplateLiteral(expression, context, seen);
    default:
      return undefined;
  }
}

function evaluateStaticBinaryExpression(
  expression: Extract<Expression, { type: 'BinaryExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  const left = evaluateStaticExpression(expression.left, context, seen);
  const right = evaluateStaticExpression(expression.right, context, seen);

  // Design-state branches commonly use strict comparisons such as
  // `activePanel === 2`. Resolve those before the numeric-only arithmetic
  // path so the editable-tree preview projects exactly one rendered branch.
  // Null is also an authored scalar here: `selectedId === id` must be false
  // on the first render when `selectedId` starts at null, otherwise selection
  // chrome from every mapped item leaks into the Design canvas.
  if (isStaticConditionValue(left) && isStaticConditionValue(right)) {
    if (expression.operator === '===') return left === right;
    if (expression.operator === '!==') return left !== right;
  }

  // Responsive branches compare measured widths against thresholds, e.g.
  // `frameWidth < 720`. Without relational support the whole ternary became
  // unevaluable and the preview fell back to projecting the first branch.
  if (typeof left === 'number' && typeof right === 'number') {
    if (expression.operator === '<') return left < right;
    if (expression.operator === '<=') return left <= right;
    if (expression.operator === '>') return left > right;
    if (expression.operator === '>=') return left >= right;
  }

  if (!isStaticPrimitiveValue(left) || !isStaticPrimitiveValue(right)) return undefined;

  if (expression.operator === '+') {
    return typeof left === 'number' && typeof right === 'number'
      ? left + right
      : `${left}${right}`;
  }

  if (typeof left !== 'number' || typeof right !== 'number') return undefined;
  switch (expression.operator) {
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right === 0 ? undefined : left / right;
    case '%':
      return right === 0 ? undefined : left % right;
    default:
      return undefined;
  }
}

function evaluateStaticCallExpression(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (expression.callee.type === 'Identifier') {
    if (expression.callee.name === 'String') {
      const value = evaluateStaticCallArgument(expression.arguments[0], context, seen);
      return isStaticPrimitiveValue(value) ? String(value) : undefined;
    }
    const staticFunction = context.staticFunctionFallbacks.get(expression.callee.name);
    return staticFunction
      ? evaluateStaticFunctionCall(expression.callee.name, staticFunction, expression.arguments, context, seen)
      : undefined;
  }

  if (
    expression.callee.type === 'MemberExpression' &&
    !expression.callee.computed &&
    expression.callee.property.type === 'Identifier'
  ) {
    const methodName = expression.callee.property.name;
    if (methodName === 'find') return evaluateStaticFindCall(expression, context, seen);
    if (methodName === 'reduce') return evaluateStaticReduceCall(expression, context, seen);
    if (methodName === 'slice') return evaluateStaticSliceCall(expression, context, seen);
    if (methodName === 'toLocaleString') return evaluateStaticToLocaleStringCall(expression, context, seen);
    if (
      methodName === 'round' &&
      expression.callee.object.type === 'Identifier' &&
      expression.callee.object.name === 'Math'
    ) {
      const value = evaluateStaticCallArgument(expression.arguments[0], context, seen);
      return typeof value === 'number' ? Math.round(value) : undefined;
    }
  }

  return undefined;
}

function evaluateStaticFindCall(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (
    expression.callee.type !== 'MemberExpression' ||
    expression.callee.computed
  ) return undefined;
  const items = evaluateStaticExpression(expression.callee.object, context, seen);
  if (!Array.isArray(items)) return undefined;
  const callback = expression.arguments[0];
  if (!callback || callback.type === 'SpreadElement' || callback.type === 'ArgumentPlaceholder') return undefined;
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') return undefined;
  const itemParam = callback.params[0];
  const indexParam = callback.params[1];
  if (itemParam?.type !== 'Identifier') return undefined;
  const predicate = getStaticFunctionReturnExpression(callback.body);
  if (!predicate) return undefined;

  for (let index = 0; index < items.length; index += 1) {
    const predicateContext = createScopedTreeBuildContext(context, [
      [itemParam.name, items[index]],
      ...(indexParam?.type === 'Identifier' ? [[indexParam.name, index] as const] : []),
    ]);
    if (evaluateStaticExpression(predicate, predicateContext, seen) === true) return items[index];
  }
  return undefined;
}

function evaluateStaticFunctionCall(
  functionName: string,
  fn: StaticFunctionFallback,
  args: CallExpression['arguments'],
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  const seenKey = `function:${functionName}`;
  if (seen.has(seenKey)) return undefined;
  const entries: Array<readonly [string, StaticExpressionValue]> = [];
  fn.params.forEach((param, index) => {
    if (param.type !== 'Identifier') return;
    const value = evaluateStaticCallArgument(args[index], context, seen);
    if (value !== undefined) entries.push([param.name, value]);
  });
  const functionContext = createScopedTreeBuildContext(context, entries);
  const nextSeen = new Set(seen);
  nextSeen.add(seenKey);
  const returnExpression = getStaticFunctionReturnExpression(fn.body);
  return returnExpression ? evaluateStaticExpression(returnExpression, functionContext, nextSeen) : undefined;
}

function getStaticFunctionReturnExpression(body: BlockStatement | Expression): Expression | null {
  const returnNode = getStaticFunctionReturnNode(body);
  return returnNode && isExpressionNode(returnNode) ? returnNode : null;
}

function getStaticFunctionReturnNode(body: BlockStatement | Expression): BabelNode | null {
  if (body.type !== 'BlockStatement') return body;
  for (const returnStatement of collectReturnStatements(body.body)) {
    const argument = unwrapParenthesizedExpression(returnStatement.argument);
    if (argument) return argument;
  }
  return null;
}

function evaluateStaticSliceCall(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (
    expression.callee.type !== 'MemberExpression' ||
    expression.callee.computed
  ) return undefined;
  const items = evaluateStaticExpression(expression.callee.object, context, seen);
  if (!Array.isArray(items)) return undefined;
  const start = evaluateStaticCallArgument(expression.arguments[0], context, seen);
  const end = evaluateStaticCallArgument(expression.arguments[1], context, seen);
  return items.slice(
    typeof start === 'number' ? start : undefined,
    typeof end === 'number' ? end : undefined,
  );
}

function evaluateStaticReduceCall(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (
    expression.callee.type !== 'MemberExpression' ||
    expression.callee.computed
  ) return undefined;
  const items = evaluateStaticExpression(expression.callee.object, context, seen);
  if (!Array.isArray(items)) return undefined;
  const callback = expression.arguments[0];
  if (!callback || callback.type === 'SpreadElement' || callback.type === 'ArgumentPlaceholder') return undefined;
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') return undefined;
  const accumulatorParam = callback.params[0];
  const itemParam = callback.params[1];
  if (accumulatorParam?.type !== 'Identifier' || itemParam?.type !== 'Identifier') return undefined;
  const returnExpression = getStaticFunctionReturnExpression(callback.body);
  if (!returnExpression) return undefined;

  let accumulator = evaluateStaticCallArgument(expression.arguments[1], context, seen);
  if (accumulator === undefined) accumulator = items[0];
  const startIndex = expression.arguments[1] === undefined ? 1 : 0;
  for (let index = startIndex; index < items.length; index += 1) {
    const reduceContext = createScopedTreeBuildContext(context, [
      [accumulatorParam.name, accumulator],
      [itemParam.name, items[index]],
    ]);
    const nextAccumulator = evaluateStaticExpression(returnExpression, reduceContext, seen);
    if (nextAccumulator === undefined) return undefined;
    accumulator = nextAccumulator;
  }
  return accumulator;
}

function evaluateStaticToLocaleStringCall(
  expression: Extract<Expression, { type: 'CallExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (
    expression.callee.type !== 'MemberExpression' ||
    expression.callee.computed
  ) return undefined;
  const value = evaluateStaticExpression(expression.callee.object, context, seen);
  const locale = evaluateStaticCallArgument(expression.arguments[0], context, seen);
  if (typeof value === 'number') {
    return typeof locale === 'string' ? value.toLocaleString(locale) : value.toLocaleString();
  }
  if (typeof value === 'string') return value;
  return undefined;
}

function evaluateStaticCallArgument(
  argument: CallExpression['arguments'][number] | undefined,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  if (!argument || argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') return undefined;
  return evaluateStaticExpression(argument, context, seen);
}

function isExpressionNode(node: BabelNode): node is Expression {
  return node.type.endsWith('Expression') ||
    node.type === 'Identifier' ||
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NullLiteral' ||
    node.type === 'TemplateLiteral';
}

function evaluateStaticTemplateLiteral(
  expression: Extract<Expression, { type: 'TemplateLiteral' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): string | undefined {
  let value = '';
  expression.quasis.forEach((quasi, index) => {
    value += quasi.value.cooked ?? quasi.value.raw;
    const embedded = expression.expressions[index];
    if (!embedded || embedded.type === 'TSInstantiationExpression') return;
    const embeddedValue = evaluateStaticExpression(embedded, context, seen);
    if (isStaticPrimitiveValue(embeddedValue)) value += String(embeddedValue);
  });
  return value;
}

function evaluateStaticMemberExpression(
  expression: Extract<Expression, { type: 'MemberExpression' }>,
  context: TreeBuildContext,
  seen: Set<string>,
): StaticExpressionValue | undefined {
  const object = evaluateStaticExpression(expression.object, context, seen);
  const propertyName = getStaticMemberPropertyName(expression.property, expression.computed, context, seen);
  if (!propertyName) return undefined;
  if (isStaticIdentifierValue(object)) return undefined;
  if (Array.isArray(object)) return object[Number(propertyName)];
  if (isStaticObjectValue(object)) return object[propertyName];
  return undefined;
}

function evaluateStaticMemberPath(parts: string[], context: TreeBuildContext): StaticExpressionValue | undefined {
  const [first, ...rest] = parts;
  if (!first) return undefined;
  let value = evaluateStaticExpression({ type: 'Identifier', name: first } as BabelNode, context);
  for (const part of rest) {
    if (isStaticIdentifierValue(value)) return undefined;
    if (Array.isArray(value)) {
      value = value[Number(part)];
      continue;
    }
    if (isStaticObjectValue(value)) {
      value = value[part];
      continue;
    }
    return undefined;
  }
  return value;
}

function getStaticMemberPropertyName(
  property: Extract<Expression, { type: 'MemberExpression' }>['property'],
  computed: boolean,
  context: TreeBuildContext,
  seen: Set<string>,
): string | null {
  if (!computed && property.type === 'Identifier') return property.name;
  if (!computed) return null;
  const value = evaluateStaticExpression(property, context, seen);
  return isStaticPrimitiveValue(value) ? String(value) : null;
}

function isStaticPrimitiveValue(value: StaticExpressionValue | undefined): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * `null` is not editable text, but it is still an authored, statically known
 * first-render condition. Keeping this separate from primitive text values
 * lets `useState(null)` suppress overlays, drag ghosts, and other transient
 * branches without turning null into a visible "null" text node.
 */
function isStaticConditionValue(
  value: StaticExpressionValue | undefined,
): value is null | string | number | boolean {
  return value === null || isStaticPrimitiveValue(value);
}

function isStaticObjectValue(value: StaticExpressionValue | undefined): value is Record<string, StaticExpressionValue> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && !isStaticIdentifierValue(value));
}

function isStaticIdentifierValue(value: StaticExpressionValue | undefined): value is { kind: 'identifier'; name: string } {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && 'kind' in value && value.kind === 'identifier');
}

function extractI18nCallBinding(expression: JSXExpressionContainer['expression']): { id: string } | null {
  if (expression.type !== 'CallExpression') return null;
  if (expression.callee.type !== 'Identifier' || expression.callee.name !== 't') return null;
  if (expression.arguments.length === 0) return null;
  const firstArg = expression.arguments[0];
  if (firstArg.type !== 'StringLiteral') return null;
  return { id: firstArg.value };
}

function getElementKind(tagName: string, depth: number, context: TreeBuildContext): EditableTreeNodeKind {
  if (isComponentTag(tagName, context)) return 'component-instance';
  if (depth === 0) return 'frame';
  return tagName === 'span' || tagName === 'p' || tagName.startsWith('h') ? 'text' : 'frame';
}

function getElementLabel(tagName: string, kind: EditableTreeNodeKind): string {
  if (kind === 'component-instance') {
    const parts = tagName.split('.');
    return parts[parts.length - 1] ?? tagName;
  }
  if (kind === 'text') return tagName;
  return tagName;
}

function isComponentTag(tagName: string, context: TreeBuildContext): boolean {
  if (context.intrinsicElementAliases.has(tagName)) return false;
  return /^[A-Z]/.test(tagName);
}

function getElementName(name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName): string {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return `${getElementName(name.object)}.${name.property.name}`;
  return `${name.namespace.name}:${name.name.name}`;
}

function getTokenBindings(element: JSXElement): { tokenBindingReferences?: EditableTreeTokenBindingReferences; tokenBindings: EditableTreeTokenBindings } | Record<string, never> {
  const tokenBindings: EditableTreeTokenBindings = {};
  const tokenBindingReferences: EditableTreeTokenBindingReferences = {};

  for (const attribute of element.openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    const attributeName = getAttributeName(attribute);
    const field = getTokenBindingField(attributeName);
    if (!field) continue;
    const tokenId = readStringAttributeValue(attribute);
    if (!tokenId) continue;

    tokenBindings[field] = tokenId;
    const collectionId = readStringAttributeByName(element, TOKEN_BINDING_COLLECTION_ATTRIBUTES[field]);
    if (collectionId) {
      tokenBindingReferences[field] = { collectionId, tokenId };
    }
  }

  return Object.keys(tokenBindings).length > 0
    ? {
        ...(Object.keys(tokenBindingReferences).length > 0 ? { tokenBindingReferences } : {}),
        tokenBindings,
      }
    : {};
}

function getTokenBindingField(attributeName: string | null): keyof EditableTreeTokenBindings | null {
  if (!attributeName) return null;
  for (const [field, name] of Object.entries(TOKEN_BINDING_ATTRIBUTES)) {
    if (name === attributeName) return field as keyof EditableTreeTokenBindings;
  }
  return null;
}

function getAttributeName(attribute: JSXAttribute): string | null {
  if (attribute.name.type === 'JSXIdentifier') return attribute.name.name;
  return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
}

function getSourceAttributes(
  element: JSXElement,
  context: TreeBuildContext,
): Pick<EditableTreeNode, 'sourceAttributes'> {
  const sourceAttributes: Record<string, string> = {};

  for (const attribute of element.openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    const attributeName = getAttributeName(attribute);
    if (
      !attributeName ||
      (
        attributeName.startsWith('data-wb-') &&
        attributeName !== SOURCE_TOKEN_MODE_ATTRIBUTE &&
        attributeName !== SOURCE_ASSET_KIND_ATTRIBUTE &&
        attributeName !== SOURCE_ASSET_SOURCE_ATTRIBUTE &&
        attributeName !== SOURCE_ICON_NAME_ATTRIBUTE &&
        attributeName !== SOURCE_ICON_SET_ATTRIBUTE &&
        attributeName !== PROTOTYPE_CLICK_ATTRIBUTE
        && attributeName !== PROTOTYPE_NAME_ATTRIBUTE
        && attributeName !== PROTOTYPE_INITIAL_ATTRIBUTE
      )
    ) continue;
    const value = attributeName === 'className'
      ? readClassNameAttributeValue(attribute, context)
      : readStringAttributeValue(attribute, context);
    if (value === null) continue;
    const normalizedValue = normalizeEditableSourceAttributeValue(attributeName, value, { allowEmpty: true });
    if (normalizedValue === null) continue;
    sourceAttributes[attributeName] = normalizedValue;
  }

  return Object.keys(sourceAttributes).length > 0 ? { sourceAttributes } : {};
}

function readClassNameAttributeValue(attribute: JSXAttribute, context: TreeBuildContext): string | null {
  const stringValue = readStringAttributeValue(attribute, context);
  if (stringValue !== null) return stringValue;
  if (attribute.value?.type !== 'JSXExpressionContainer') return null;
  return normalizeStaticClassNameFragments(collectStaticClassNameFragments(attribute.value.expression));
}

function collectStaticClassNameFragments(expression: JSXExpressionContainer['expression']): string[] {
  if (expression.type === 'JSXEmptyExpression') return [];
  switch (expression.type) {
    case 'StringLiteral':
      return [expression.value];
    case 'TemplateLiteral':
      return expression.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw);
    case 'ConditionalExpression':
      return [
        ...collectStaticClassNameFragments(expression.consequent),
        ...collectStaticClassNameFragments(expression.alternate),
      ];
    case 'LogicalExpression':
      return [
        ...collectStaticClassNameFragments(expression.left),
        ...collectStaticClassNameFragments(expression.right),
      ];
    case 'ArrayExpression':
      return expression.elements.flatMap((element) => (
        element && element.type !== 'SpreadElement' ? collectStaticClassNameFragments(element) : []
      ));
    case 'CallExpression':
      return collectStaticClassNameFragmentsFromCall(expression);
    default:
      return [];
  }
}

function collectStaticClassNameFragmentsFromCall(expression: CallExpression): string[] {
  const calleeName = getCallExpressionCalleeName(expression);
  if (calleeName && CLASS_NAME_HELPER_CALLEE_NAMES.has(calleeName)) {
    return expression.arguments.flatMap(collectStaticClassNameFragmentsFromClassHelperArgument);
  }

  const callee = expression.callee;
  if (callee.type !== 'MemberExpression') return [];
  const property = callee.property;
  const propertyName = property.type === 'Identifier' ? property.name : null;
  if (propertyName !== 'filter' && propertyName !== 'join') return [];
  const object = callee.object;
  return object.type === 'ArrayExpression' || object.type === 'CallExpression'
    ? collectStaticClassNameFragments(object)
    : [];
}

const CLASS_NAME_HELPER_CALLEE_NAMES = new Set(['cn', 'clsx', 'classNames', 'classnames', 'twJoin', 'twMerge']);

function collectStaticClassNameFragmentsFromClassHelperArgument(
  argument: CallExpression['arguments'][number],
): string[] {
  if (!argument || argument.type === 'SpreadElement' || argument.type === 'ArgumentPlaceholder') return [];
  if (argument.type === 'ObjectExpression') {
    return argument.properties.flatMap((property) => {
      if (property.type !== 'ObjectProperty') return [];
      const key = getStaticClassNameObjectKeyName(property.key);
      return key ? [key] : [];
    });
  }
  return collectStaticClassNameFragments(argument);
}

function getStaticClassNameObjectKeyName(key: BabelNode): string | null {
  if (key.type === 'StringLiteral') return key.value;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'TemplateLiteral' && key.expressions.length === 0) {
    return key.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('');
  }
  return null;
}

function normalizeStaticClassNameFragments(fragments: string[]): string | null {
  const classNames = [...new Set(
    fragments
      .flatMap((fragment) => fragment.split(/\s+/))
      .map((fragment) => fragment.trim())
      .filter(isSafePreviewClassName),
  )];
  return classNames.length > 0 ? classNames.join(' ') : null;
}

function isSafePreviewClassName(value: string): boolean {
  return /^[A-Za-z_:-][\w:-]*$/.test(value);
}

function getSourceProps(element: JSXElement, context: TreeBuildContext): Pick<EditableTreeNode, 'sourceDataBindings' | 'sourcePropArrayReferences' | 'sourceProps' | 'sourceRuntimeProps' | 'sourceValueMetadata'> {
  const sourceDataBindings: NonNullable<EditableTreeNode['sourceDataBindings']> = {};
  const sourceProps: Record<string, EditableTreeSourcePropValue> = {};
  const sourceRuntimeProps: EditableTreeSourceRuntimeProps = {};
  const sourcePropArrayReferences: NonNullable<EditableTreeNode['sourcePropArrayReferences']> = {};
  const propMetadata: NonNullable<EditableTreeSourceValueMetadata['props']> = {};
  const propSpreads: NonNullable<EditableTreeSourceValueMetadata['propSpreads']> = [];

  for (const attribute of element.openingElement.attributes) {
    if (attribute.type === 'JSXSpreadAttribute') {
      propSpreads.push({ code: getSourceText(attribute.argument, context), kind: 'spread', writable: false });
      continue;
    }
    if (attribute.type !== 'JSXAttribute') continue;
    const attributeName = getAttributeName(attribute);
    if (!attributeName || attributeName.startsWith('data-wb-') || attributeName === 'style') continue;
    const value = readSimplePropAttributeValue(attribute, context);
    const sourceValue = readSourcePropValueMetadata(attribute, context);
    const arrayReference = readSourcePropArrayReference(attribute, context);
    const dataBinding = readSourceDataBinding(attributeName, attribute, context);
    if (dataBinding) sourceDataBindings[attributeName] = dataBinding;
    if (sourceValue) propMetadata[attributeName] = sourceValue;
    if (arrayReference) sourcePropArrayReferences[attributeName] = arrayReference;
    if (value !== null) {
      sourceProps[attributeName] = value;
    } else if (sourceValue?.kind === 'expression' && sourceValue.detachableValue !== undefined) {
      sourceProps[attributeName] = sourceValue.detachableValue;
    }
    // Static data the Inspector projection cannot carry whole — nested
    // arrays/objects, null — travels to the runtime beside the expression.
    // When the projection above dropped part of it (an item's children stay
    // out of the array-editing shape), the complete value goes too, so the
    // canvas renders the whole structure while the expression itself stays
    // the writeback's source of truth.
    const runtimeValue = readSourceRuntimePropValue(attribute, context);
    if (
      runtimeValue !== undefined &&
      (!(attributeName in sourceProps) || JSON.stringify(runtimeValue) !== JSON.stringify(sourceProps[attributeName]))
    ) {
      sourceRuntimeProps[attributeName] = runtimeValue;
    }
  }

  const children = readSimpleChildrenProp(element);
  if (children !== null) {
    sourceProps.children = children;
    propMetadata.children = { kind: 'literal', value: children, writable: true };
  }

  const sourceValueMetadata = createSourceValueMetadata({
    propSpreads,
    props: propMetadata,
  });

  return {
    ...(Object.keys(sourceDataBindings).length > 0 ? { sourceDataBindings } : {}),
    ...(Object.keys(sourcePropArrayReferences).length > 0 ? { sourcePropArrayReferences } : {}),
    ...(Object.keys(sourceProps).length > 0 ? { sourceProps } : {}),
    ...(Object.keys(sourceRuntimeProps).length > 0 ? { sourceRuntimeProps } : {}),
    ...(sourceValueMetadata ? { sourceValueMetadata } : {}),
  };
}

function readSourceRuntimePropValue(attribute: JSXAttribute, context: TreeBuildContext): EditableTreeSourceRuntimeValue | undefined {
  if (attribute.value?.type !== 'JSXExpressionContainer') return undefined;
  const expression = attribute.value.expression;
  if (expression.type === 'JSXEmptyExpression') return undefined;
  return staticValueToSourceRuntimeValue(evaluateStaticExpression(expression, context));
}

// The static evaluator marks unresolved names as identifier records; a value
// that still contains one is not data and stays out of the runtime channel.
function staticValueToSourceRuntimeValue(value: StaticExpressionValue | undefined): EditableTreeSourceRuntimeValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const items: EditableTreeSourceRuntimeValue[] = [];
    for (const item of value) {
      const converted = staticValueToSourceRuntimeValue(item);
      if (converted === undefined) return undefined;
      items.push(converted);
    }
    return items;
  }
  if (!isStaticObjectValue(value)) return undefined;
  const record: { [key: string]: EditableTreeSourceRuntimeValue } = {};
  for (const [key, entry] of Object.entries(value)) {
    const converted = staticValueToSourceRuntimeValue(entry);
    if (converted === undefined) return undefined;
    record[key] = converted;
  }
  return record;
}

function getSourceJsxProps(element: JSXElement): Pick<EditableTreeNode, 'sourceJsxProps'> {
  const sourceJsxProps: Record<string, string> = {};

  for (const attribute of element.openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    const attributeName = getAttributeName(attribute);
    if (!attributeName || attributeName.startsWith('data-wb-') || attributeName === 'style') continue;
    const value = readJsxPropAttributeValue(attribute);
    if (value === null) continue;
    sourceJsxProps[attributeName] = value;
  }

  return Object.keys(sourceJsxProps).length > 0 ? { sourceJsxProps } : {};
}

function readJsxPropAttributeValue(attribute: JSXAttribute): string | null {
  if (
    attribute.value?.type !== 'JSXExpressionContainer' ||
    attribute.value.expression.type !== 'JSXElement'
  ) {
    return null;
  }
  return getElementName(attribute.value.expression.openingElement.name);
}

function readSimplePropAttributeValue(attribute: JSXAttribute, context: TreeBuildContext): EditableTreeSourcePropValue | null {
  if (!attribute.value) return true;
  if (attribute.value.type === 'StringLiteral') return attribute.value.value;
  if (attribute.value.type !== 'JSXExpressionContainer') return null;
  const expression = attribute.value.expression;
  if (expression.type === 'StringLiteral') return expression.value;
  if (expression.type === 'BooleanLiteral') return expression.value;
  if (expression.type === 'NumericLiteral') return expression.value;
  if (expression.type === 'ArrayExpression') return readSimplePropArrayExpression(expression);
  const staticValue = evaluateStaticExpression(expression, context);
  return staticValueToSourcePropValue(staticValue);
}

function staticValueToSourcePropValue(value: StaticExpressionValue | undefined): EditableTreeSourcePropValue | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) return value as string[];
    const items: EditableTreeSourcePropObject[] = [];
    for (const item of value) {
      if (!isStaticObjectValue(item)) return null;
      const sourceItem: EditableTreeSourcePropObject = {};
      for (const [key, itemValue] of Object.entries(item)) {
        if (typeof itemValue === 'string' || typeof itemValue === 'number' || typeof itemValue === 'boolean') {
          sourceItem[key] = itemValue;
        }
      }
      items.push(sourceItem);
    }
    return items;
  }
  return null;
}

function readSourcePropArrayReference(
  attribute: JSXAttribute,
  context: TreeBuildContext,
): EditableTreeSourcePropArrayReference | null {
  if (attribute.value?.type !== 'JSXExpressionContainer') return null;
  const expression = attribute.value.expression;
  if (expression.type === 'JSXEmptyExpression') return null;
  const staticValue = evaluateStaticExpression(expression, context);
  if (!Array.isArray(staticValue)) return null;

  const items = staticValue.map((item) => {
    if (!isStaticObjectValue(item)) return {};
    return Object.fromEntries(
      Object.entries(item).flatMap(([key, value]): Array<[string, string]> => {
        const reference = formatStaticReferenceValue(value);
        return reference ? [[key, reference]] : [];
      }),
    );
  });
  const hasReferences = items.some((item) => Object.keys(item).length > 0);
  const sourceNode = resolveStaticExpressionSourceNode(expression, context);
  const code = sourceNode?.type === 'ArrayExpression'
    ? getSourceText(sourceNode, context)
    : undefined;
  if (!hasReferences && !code) return null;
  return {
    ...(code ? { code } : {}),
    items,
  };
}

function readSourceDataBinding(
  attributeName: string,
  attribute: JSXAttribute,
  context: TreeBuildContext,
): NonNullable<EditableTreeNode['sourceDataBindings']>[string] | null {
  if (!DATA_SOURCE_PROP_NAMES.has(attributeName)) return null;
  if (attribute.value?.type !== 'JSXExpressionContainer') return null;
  const expression = attribute.value.expression;
  if (expression.type === 'JSXEmptyExpression') return null;
  const sourceText = getSourceText(expression, context);
  const rootIdentifier = getExpressionRootIdentifier(expression);
  const importInfo = rootIdentifier ? context.dataImports.get(rootIdentifier) : null;
  if (importInfo) {
    return {
      expression: sourceText,
      importName: importInfo.importName,
      importSource: importInfo.importSource,
      kind: importInfo.kind,
      ...(importInfo.path ? { path: importInfo.path } : {}),
    };
  }
  return {
    expression: sourceText,
    kind: 'expression',
  };
}

function getExpressionRootIdentifier(node: BabelNode): string | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'Identifier') return expression.name;
  if (expression.type === 'MemberExpression') return getExpressionRootIdentifier(expression.object);
  return null;
}

function formatStaticReferenceValue(value: StaticExpressionValue | undefined): string | null {
  if (isStaticIdentifierValue(value)) return value.name;
  return null;
}

function resolveStaticExpressionSourceNode(
  node: BabelNode,
  context: TreeBuildContext,
  seen = new Set<string>(),
): BabelNode | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'Identifier') {
    if (seen.has(expression.name)) return null;
    const fallbackNode = context.expressionNodeFallbacks.get(expression.name);
    if (!fallbackNode) return expression;
    const nextSeen = new Set(seen);
    nextSeen.add(expression.name);
    return resolveStaticExpressionSourceNode(fallbackNode, context, nextSeen) ?? fallbackNode;
  }
  if (expression.type === 'MemberExpression') {
    const objectNode = resolveStaticExpressionSourceNode(expression.object, context, seen);
    const propertyName = getStaticMemberPropertyName(expression.property, expression.computed, context, seen);
    if (!objectNode || !propertyName) return expression;
    if (objectNode.type === 'ObjectExpression') {
      for (const property of objectNode.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        if (readSimpleObjectPropertyKey(property.key) !== propertyName) continue;
        return resolveStaticExpressionSourceNode(property.value, context, seen) ?? property.value;
      }
    }
    if (objectNode.type === 'ArrayExpression') {
      const index = Number(propertyName);
      const element = Number.isInteger(index) ? objectNode.elements[index] : null;
      return element && element.type !== 'SpreadElement' ? element : expression;
    }
    return expression;
  }
  return expression;
}

function readSourcePropValueMetadata(
  attribute: JSXAttribute,
  context: TreeBuildContext,
): NonNullable<EditableTreeSourceValueMetadata['props']>[string] | null {
  if (!attribute.value) return { kind: 'literal', value: 'true', writable: true };
  if (attribute.value.type === 'StringLiteral') {
    return { kind: 'literal', value: attribute.value.value, writable: true };
  }
  if (attribute.value.type !== 'JSXExpressionContainer') return null;

  const expression = attribute.value.expression;
  if (expression.type === 'JSXEmptyExpression') return null;
  const value = readSimplePropAttributeValue(attribute, context);
  if (value !== null && !Array.isArray(value) && isDirectWritablePropExpression(expression)) {
    return { kind: 'literal', value: String(value), writable: true };
  }
  return {
    code: getSourceText(expression, context),
    detachableValue: getDetachableExpressionValue(expression, context) ?? undefined,
    kind: 'expression',
    writable: false,
  };
}

function isDirectWritablePropExpression(expression: BabelNode): boolean {
  const value = unwrapTransparentExpression(expression);
  if (
    value.type === 'StringLiteral' ||
    value.type === 'BooleanLiteral' ||
    value.type === 'NumericLiteral'
  ) {
    return true;
  }
  return value.type === 'UnaryExpression' &&
    (value.operator === '-' || value.operator === '+') &&
    value.argument.type === 'NumericLiteral';
}

function readSimplePropArrayExpression(expression: Expression): EditableTreeSourcePropArray | EditableTreeSourcePropStringArray | null {
  if (expression.type !== 'ArrayExpression') return null;
  if (expression.elements.every((element) => element?.type === 'StringLiteral')) {
    return expression.elements.map((element) => element!.value);
  }
  const items: EditableTreeSourcePropObject[] = [];
  for (const element of expression.elements) {
    if (!element || element.type !== 'ObjectExpression') return null;
    const item: EditableTreeSourcePropObject = {};
    for (const property of element.properties) {
      if (property.type !== 'ObjectProperty') return null;
      const key = readSimpleObjectPropertyKey(property.key);
      const value = readSimpleObjectPropertyValue(property.value);
      if (!key || value === null) return null;
      item[key] = value;
    }
    items.push(item);
  }
  return items;
}

function readSimpleObjectPropertyKey(key: Expression | BabelNode): string | null {
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function readSimpleObjectPropertyValue(value: BabelNode): EditableTreeSourcePropPrimitive | null {
  if (value.type === 'StringLiteral') return value.value;
  if (value.type === 'BooleanLiteral') return value.value;
  if (value.type === 'NumericLiteral') return value.value;
  return null;
}

function readSimpleChildrenProp(element: JSXElement): string | null {
  if (element.openingElement.selfClosing) return null;
  let text = '';
  for (const child of element.children) {
    if (child.type === 'JSXText') {
      text += child.value;
      continue;
    }
    if (child.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression') {
      continue;
    }
    return null;
  }
  const normalized = normalizeText(text);
  return normalized ?? '';
}

function getSourceStyleDeclarations(element: JSXElement, context: TreeBuildContext): Pick<EditableTreeNode, 'sourceStyleDeclarations' | 'sourceValueMetadata'> {
  const styleAttribute = element.openingElement.attributes.find((attribute): attribute is JSXAttribute =>
    attribute.type === 'JSXAttribute' && getAttributeName(attribute) === 'style',
  );
  if (!styleAttribute?.value) return {};
  if (
    styleAttribute.value.type !== 'JSXExpressionContainer'
  ) {
    return {};
  }
  const styleExpression = resolveSourceStyleExpression(styleAttribute.value.expression, context);
  if (!styleExpression) return {};

  const declarations: EditableTreeSourceStyleDeclarations = {};
  const styleMetadata: NonNullable<EditableTreeSourceValueMetadata['styles']> = {};
  const styleSpreads: NonNullable<EditableTreeSourceValueMetadata['styleSpreads']> = [];

  if (styleExpression.kind === 'object') {
    for (const property of styleExpression.expression.properties) {
      if (property.type === 'SpreadElement') {
        styleSpreads.push({ code: getSourceText(property.argument, context), kind: 'spread', writable: false });
        continue;
      }
      if (property.type !== 'ObjectProperty') continue;
      const propertyName = getStylePropertyName(property.key);
      const propertyValue = getStylePropertyValue(property.value);
      if (!propertyName) continue;
      const detachableValue = propertyValue === null
        ? getDetachableExpressionValue(property.value, context)
        : null;
      styleMetadata[propertyName] = propertyValue === null || !styleExpression.writable
        ? {
            code: getSourceText(property.value, context),
            detachableValue: propertyValue ?? detachableValue ?? undefined,
            kind: 'expression',
            writable: false,
          }
        : { kind: 'literal', value: propertyValue, writable: true };
      if (propertyValue !== null) {
        declarations[propertyName] = propertyValue;
      } else if (detachableValue !== null) {
        declarations[propertyName] = detachableValue;
      }
    }
  } else {
    for (const [propertyName, propertyValue] of Object.entries(styleExpression.value)) {
      if (!isStaticPrimitiveValue(propertyValue)) continue;
      const declarationValue = String(propertyValue);
      declarations[camelToKebabCase(propertyName)] = declarationValue;
      styleMetadata[camelToKebabCase(propertyName)] = {
        code: styleExpression.code,
        kind: 'expression',
        writable: false,
      };
    }
  }

  const sourceValueMetadata = createSourceValueMetadata({
    styleSpreads,
    styles: styleMetadata,
  });

  return {
    ...(Object.keys(declarations).length > 0 ? { sourceStyleDeclarations: declarations } : {}),
    ...(sourceValueMetadata ? { sourceValueMetadata } : {}),
  };
}

type ResolvedSourceStyleExpression =
  | {
      expression: ObjectExpression;
      kind: 'object';
      writable: boolean;
    }
  | {
      code: string;
      kind: 'static-object';
      value: Record<string, StaticExpressionValue>;
    };

function resolveSourceStyleExpression(
  node: BabelNode,
  context: TreeBuildContext,
): ResolvedSourceStyleExpression | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type === 'ObjectExpression') {
    return {
      expression,
      kind: 'object',
      writable: true,
    };
  }

  const sourceNode = resolveStaticExpressionSourceNode(expression, context);
  const sourceExpression = sourceNode ? unwrapTransparentExpression(sourceNode) : null;
  if (sourceExpression?.type === 'ObjectExpression') {
    return {
      expression: sourceExpression,
      kind: 'object',
      writable: expression.type === 'Identifier',
    };
  }

  const functionReturnObject = resolveStaticStyleFunctionReturnObject(expression, context);
  if (functionReturnObject) {
    return {
      expression: functionReturnObject,
      kind: 'object',
      writable: true,
    };
  }

  const staticValue = evaluateStaticExpression(expression, context);
  if (isStaticObjectValue(staticValue)) {
    return {
      code: getSourceText(expression, context),
      kind: 'static-object',
      value: staticValue,
    };
  }

  return null;
}

function resolveStaticStyleFunctionReturnObject(
  node: BabelNode,
  context: TreeBuildContext,
): ObjectExpression | null {
  const expression = unwrapTransparentExpression(node);
  if (expression.type !== 'CallExpression') return null;
  const calleeKey = getStaticReferencePath(expression.callee);
  if (!calleeKey) return null;
  const staticFunction = context.staticFunctionFallbacks.get(calleeKey);
  if (!staticFunction) return null;
  const returnNode = getStaticFunctionReturnNode(staticFunction.body);
  const returnExpression = returnNode ? unwrapTransparentExpression(returnNode) : null;
  return returnExpression?.type === 'ObjectExpression' ? returnExpression : null;
}

function getStylePropertyName(key: BabelNode): string | null {
  if (key.type === 'Identifier') return camelToKebabCase(key.name);
  if (key.type === 'StringLiteral') return camelToKebabCase(key.value);
  return null;
}

function getStylePropertyValue(value: BabelNode): string | null {
  if (value.type === 'StringLiteral') return value.value;
  if (value.type === 'NumericLiteral') return String(value.value);
  return null;
}

function getDetachableExpressionValue(node: BabelNode, context: TreeBuildContext): string | null {
  const expression = unwrapTransparentExpression(node);
  const literal = getLiteralTextFallback(expression);
  if (literal !== null) return literal;
  const staticValue = evaluateStaticExpression(expression, context);
  if (isStaticPrimitiveValue(staticValue)) return String(staticValue);
  if (expression.type === 'Identifier') {
    const textFallback = context.expressionTextFallbacks.get(expression.name);
    if (textFallback !== undefined) return textFallback;
    const nodeFallback = context.expressionNodeFallbacks.get(expression.name);
    return nodeFallback ? getDetachableExpressionValue(nodeFallback, context) : null;
  }
  if (expression.type === 'ConditionalExpression') {
    return getDetachableExpressionValue(expression.consequent, context) ??
      getDetachableExpressionValue(expression.alternate, context);
  }
  return null;
}

function createSourceValueMetadata(metadata: EditableTreeSourceValueMetadata): EditableTreeSourceValueMetadata | null {
  const props = metadata.props && Object.keys(metadata.props).length > 0 ? metadata.props : undefined;
  const styles = metadata.styles && Object.keys(metadata.styles).length > 0 ? metadata.styles : undefined;
  const propSpreads = metadata.propSpreads && metadata.propSpreads.length > 0 ? metadata.propSpreads : undefined;
  const styleSpreads = metadata.styleSpreads && metadata.styleSpreads.length > 0 ? metadata.styleSpreads : undefined;
  return props || styles || propSpreads || styleSpreads
    ? {
        ...(propSpreads ? { propSpreads } : {}),
        ...(props ? { props } : {}),
        ...(styleSpreads ? { styleSpreads } : {}),
        ...(styles ? { styles } : {}),
      }
    : null;
}

function mergeSourceValueMetadata(
  left: EditableTreeSourceValueMetadata | undefined,
  right: EditableTreeSourceValueMetadata | undefined,
): EditableTreeSourceValueMetadata | null {
  return createSourceValueMetadata({
    propSpreads: [...(left?.propSpreads ?? []), ...(right?.propSpreads ?? [])],
    props: {
      ...(left?.props ?? {}),
      ...(right?.props ?? {}),
    },
    styleSpreads: [...(left?.styleSpreads ?? []), ...(right?.styleSpreads ?? [])],
    styles: {
      ...(left?.styles ?? {}),
      ...(right?.styles ?? {}),
    },
  });
}

function getSourceText(node: BabelNode, context: TreeBuildContext): string {
  if (typeof node.start === 'number' && typeof node.end === 'number') {
    return context.contents.slice(node.start, node.end);
  }
  return node.type;
}

function camelToKebabCase(value: string): string {
  return value
    .replace(/^ms[A-Z]/, (match) => `-ms-${match.slice(2).toLowerCase()}`)
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function readStringAttributeValue(attribute: JSXAttribute, context?: TreeBuildContext): string | null {
  if (!attribute.value) return null;
  if (attribute.value.type === 'StringLiteral') return attribute.value.value;
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression.type === 'StringLiteral'
  ) {
    return attribute.value.expression.value;
  }
  if (context && attribute.value.type === 'JSXExpressionContainer') {
    const expression = attribute.value.expression;
    if (expression.type === 'JSXEmptyExpression') return null;
    return getDetachableExpressionValue(expression, context);
  }
  return null;
}

function readStringAttributeByName(element: JSXElement, attributeName: string): string | null {
  const attribute = element.openingElement.attributes.find((candidate): candidate is JSXAttribute =>
    candidate.type === 'JSXAttribute' && getAttributeName(candidate) === attributeName,
  );
  return attribute ? readStringAttributeValue(attribute) : null;
}

function createTextNode(
  text: string,
  path: number[],
  sourceFile: string,
  sourceNode: BabelNode,
): EditableTreeNode {
  return {
    id: getNodeId(sourceFile, path, 'text'),
    label: text.length > 32 ? `${text.slice(0, 29)}...` : text,
    kind: 'text',
    textContent: text,
    source: {
      sourceFile,
      jsxName: 'text',
    },
    ...getSourceLocation(sourceNode),
  };
}

function createWhitespaceTextNode(
  text: string,
  path: number[],
  sourceChildIndex: number,
  sourceFile: string,
  sourceNode: BabelNode,
): EditableTreeNode {
  return {
    ...createTextNode(text, path, sourceFile, sourceNode),
    id: getNodeId(sourceFile, path, `whitespace-${sourceChildIndex}`),
    inspectable: false,
    label: 'Whitespace',
    source: {
      sourceFile,
      whitespace: true,
      jsxName: 'text',
    },
  };
}

function createExpressionNode(
  sourceExpression: EditableTreeSourceExpression,
  path: number[],
  sourceFile: string,
  sourceNode: BabelNode,
): EditableTreeNode {
  const boundaryLabel = formatSourceExpressionBoundaryLabel(sourceExpression);
  const text = `{${boundaryLabel}}`;
  const node = createTextNode(text, path, sourceFile, sourceNode);
  return {
    ...node,
    label: boundaryLabel,
    sourceExpression,
  };
}

function formatSourceExpressionBoundaryLabel(sourceExpression: EditableTreeSourceExpression): string {
  const kindLabel = (() => {
    switch (sourceExpression.kind) {
      case 'array': return 'Array';
      case 'call': return 'Call';
      case 'conditional': return 'Condition';
      case 'identifier': return 'Value';
      case 'logical': return 'Logic';
      case 'map': return 'Map';
      case 'member': return 'Value';
      case 'object': return 'Object';
      case 'template': return 'Template';
      default: return 'Expression';
    }
  })();
  const detailSource = sourceExpression.kind === 'map'
    ? sourceExpression.mapSource?.code ?? sourceExpression.code
    : sourceExpression.code;
  const normalizedDetail = detailSource.replace(/\s+/g, ' ').trim();
  if (!normalizedDetail) return kindLabel;
  const detail = normalizedDetail.length > 32
    ? `${normalizedDetail.slice(0, 29)}...`
    : normalizedDetail;
  return `${kindLabel} · ${detail}`;
}

function normalizeText(text: string): string {
  // Mirror JSX text semantics (Babel cleanJSXElementLiteralChild) instead of a
  // blanket trim: whitespace runs containing a newline are formatting — dropped
  // at the edges, a single space in the middle — while same-line edge spaces
  // are author content. Without this, a trailing/leading space typed in the
  // Inspector (the only way to put a space next to a styled <span> run) is
  // silently destroyed on the next parse/save round trip.
  return text
    .replace(/^[ \t]*\r?\n\s*/, '')
    .replace(/\s*\r?\n[ \t]*$/, '')
    .replace(/[ \t]*\r?\n\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

function isEditableJsxText(text: string, parentJsxName: string): boolean {
  void parentJsxName;
  return Boolean(text.trim());
}

function isPreservedSourceWhitespaceText(text: string, parentJsxName: string): boolean {
  return Boolean(text && !text.trim() && getSourceChildrenSlotKind(parentJsxName) === 'inline');
}

function describeSourceExpression(
  expression: Expression,
  context: TreeBuildContext,
): EditableTreeSourceExpression {
  const unwrappedExpression = unwrapTransparentExpression(expression) as Expression;
  const kind = getSourceExpressionKind(unwrappedExpression);
  return {
    code: getSourceText(unwrappedExpression, context),
    kind,
    label: formatSourceExpressionLabel(unwrappedExpression, kind),
    ...(kind === 'map' ? { mapSource: getMapSourceExpressionInfo(unwrappedExpression, context) } : {}),
  };
}

function getSourceExpressionKind(expression: Expression): EditableTreeSourceExpression['kind'] {
  switch (expression.type) {
    case 'ArrayExpression':
      return 'array';
    case 'CallExpression':
      return isMapCallExpression(expression) ? 'map' : 'call';
    case 'ConditionalExpression':
      return 'conditional';
    case 'Identifier':
      return 'identifier';
    case 'LogicalExpression':
      return 'logical';
    case 'MemberExpression':
      return 'member';
    case 'ObjectExpression':
      return 'object';
    case 'TemplateLiteral':
      return 'template';
    default:
      return 'unknown';
  }
}

function formatSourceExpressionLabel(
  expression: Expression,
  kind: EditableTreeSourceExpression['kind'],
): string {
  if (kind === 'identifier' && expression.type === 'Identifier') return expression.name;
  switch (kind) {
    case 'array':
      return 'Array expression';
    case 'call':
      return 'Call expression';
    case 'conditional':
      return 'Conditional expression';
    case 'logical':
      return 'Logical expression';
    case 'map':
      return 'Map expression';
    case 'member':
      return 'Member expression';
    case 'object':
      return 'Object expression';
    case 'template':
      return 'Template literal';
    default:
      return expression.type;
  }
}

function isMapCallExpression(expression: Extract<Expression, { type: 'CallExpression' }>): boolean {
  return expression.callee.type === 'MemberExpression' &&
    !expression.callee.computed &&
    expression.callee.property.type === 'Identifier' &&
    expression.callee.property.name === 'map';
}

function getMapSourceExpressionInfo(
  expression: Expression,
  context: TreeBuildContext,
): EditableTreeSourceExpression['mapSource'] | undefined {
  if (expression.type !== 'CallExpression') return undefined;
  const callee = expression.callee;
  if (
    callee.type !== 'MemberExpression' ||
    callee.computed ||
    callee.property.type !== 'Identifier' ||
    callee.property.name !== 'map'
  ) return undefined;
  const source = callee.object;
  const code = getSourceText(source, context);
  return {
    code,
    ...(source.type === 'Identifier' ? { propName: source.name } : {}),
  };
}

function getNodeId(sourceFile: string, path: number[], suffix?: string): string {
  const serializedPath = path.length > 0 ? path.join('-') : 'root';
  return `source:${sanitizeNodeId(sourceFile)}:${serializedPath}${suffix ? `-${suffix}` : ''}`;
}

function getSourceLocation(node: BabelNode): { sourceLocation: EditableTreeSourceLocation } | Record<string, never> {
  if (!node.loc) return {};
  return {
    sourceLocation: {
      startLine: node.loc.start.line,
      startColumn: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column,
    },
  };
}

function formatParseError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function sanitizeNodeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'source';
}
