import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from '@babel/parser';
import { VISITOR_KEYS } from '@babel/types';

const workspaceRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultComponentRegistry = 'projects/NEW SG Design System Test/.workbench/components.json';
// Accept either a project directory or a registry path. The directory form
// keeps callers from having to name the registry file, which repo guards treat
// as an edit target.
const registryArgument = process.argv[2] ?? defaultComponentRegistry;
const resolvedArgument = path.resolve(workspaceRoot, registryArgument);
const componentRegistryPath = fs.existsSync(resolvedArgument) && fs.statSync(resolvedArgument).isDirectory()
  ? path.join(resolvedArgument, '.workbench', 'components.json')
  : resolvedArgument;
const projectRoot = path.resolve(path.dirname(componentRegistryPath), '..');
const intentionallyStoryOnlyControls = new Map([
  ['Card', new Set(['title'])],
  ['DialogFooter', new Set(['action1Label', 'action1Variant', 'action1Icon', 'action2Label', 'action2Variant', 'action2Icon'])],
  ['Sidebar', new Set(['activeItem'])],
  ['VideoCard', new Set(['actions'])],
]);
const nativeRuntimePropsByType = new Map([
  ['HTMLAttributes', [
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'children',
    'className',
    'hidden',
    'id',
    'role',
    'style',
    'tabIndex',
    'title',
  ]],
  ['AnchorHTMLAttributes', [
    'download',
    'href',
    'rel',
    'target',
  ]],
  ['ButtonHTMLAttributes', [
    'disabled',
    'form',
    'name',
    'type',
    'value',
  ]],
  ['DialogHTMLAttributes', [
    'open',
  ]],
  ['FieldsetHTMLAttributes', [
    'disabled',
    'form',
    'name',
  ]],
  ['InputHTMLAttributes', [
    'checked',
    'defaultChecked',
    'defaultValue',
    'disabled',
    'maxLength',
    'minLength',
    'name',
    'placeholder',
    'readOnly',
    'required',
    'type',
    'value',
  ]],
  ['LiHTMLAttributes', [
    'value',
  ]],
  ['SelectHTMLAttributes', [
    'defaultValue',
    'disabled',
    'name',
    'required',
    'value',
  ]],
  ['TextareaHTMLAttributes', [
    'defaultValue',
    'disabled',
    'maxLength',
    'minLength',
    'name',
    'placeholder',
    'readOnly',
    'required',
    'rows',
    'value',
  ]],
]);
const knownGlobalRuntimeProps = new Set([
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
]);

function parseStory(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  return { ast, code };
}

function unwrapExpression(node) {
  if (node?.type === 'TSAsExpression' || node?.type === 'TSSatisfiesExpression') {
    return unwrapExpression(node.expression);
  }
  return node;
}

function isObjectExpression(node) {
  return unwrapExpression(node)?.type === 'ObjectExpression';
}

function propertyName(property) {
  if (property?.type !== 'ObjectProperty') return null;
  const key = property.key;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  return null;
}

function getObjectProperty(objectExpression, name) {
  const object = unwrapExpression(objectExpression);
  if (!isObjectExpression(object)) return null;
  for (const property of object.properties) {
    if (propertyName(property) === name && property.type === 'ObjectProperty') return property.value;
  }
  return null;
}

function getObjectKeys(objectExpression, objectByName) {
  const object = unwrapExpression(resolveObjectReference(objectExpression, objectByName));
  if (!isObjectExpression(object)) return [];
  const keys = [];
  for (const property of object.properties) {
    if (property.type === 'SpreadElement') {
      const spreadKeys = getObjectKeys(property.argument, objectByName);
      for (const key of spreadKeys) {
        if (!keys.includes(key)) keys.push(key);
      }
      continue;
    }
    const key = propertyName(property);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

function getStringLiteralValue(node) {
  return node?.type === 'StringLiteral' ? node.value.trim() : null;
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
  if (/\{\s*\.\.\.args\s*\}|\.\.\.args\b/.test(renderSource)) return true;
  const escapedKey = escapeRegExp(key);
  return new RegExp(`\\bargs\\s*(?:\\.\\s*${escapedKey}|\\[\\s*["']${escapedKey}["']\\s*\\])`).test(renderSource);
}

function collectTopLevelObjects(ast) {
  const objectByName = new Map();
  const functionByName = new Map();
  const storyEntries = [];
  let metaObject = null;

  for (const node of ast.program.body) {
    const declaration = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (declaration?.type === 'FunctionDeclaration' && declaration.id) {
      functionByName.set(declaration.id.name, sourceFor(ast.code, declaration));
    }
    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type !== 'Identifier') continue;
        if (isObjectExpression(declarator.init)) {
          objectByName.set(declarator.id.name, unwrapExpression(declarator.init));
          if (node.type === 'ExportNamedDeclaration') {
            storyEntries.push([declarator.id.name, declarator.init]);
          }
        }
        if (declarator.init?.type === 'ArrowFunctionExpression' || declarator.init?.type === 'FunctionExpression') {
          functionByName.set(declarator.id.name, sourceFor(ast.code, declarator.init));
        }
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      metaObject = resolveObjectReference(node.declaration, objectByName);
    }
  }

  return { functionByName, metaObject, objectByName, storyEntries };
}

function resolveObjectReference(node, objectByName) {
  const expression = unwrapExpression(node);
  if (expression?.type === 'Identifier') return objectByName.get(expression.name) ?? null;
  if (isObjectExpression(expression)) return expression;
  if (node?.type === 'Identifier') return objectByName.get(node.name) ?? null;
  return null;
}

function getSourceInsertPropsKeys(objectExpression, objectByName) {
  const sourceInsert = getObjectProperty(objectExpression, 'sourceInsert');
  const props = getObjectProperty(sourceInsert, 'props');
  return getObjectKeys(props, objectByName);
}

function hasSourceInsertContract(objectExpression) {
  return isObjectExpression(getObjectProperty(objectExpression, 'sourceInsert'));
}

function hasSourceInsertJsxChildren(objectExpression) {
  const sourceInsert = getObjectProperty(objectExpression, 'sourceInsert');
  return Boolean(getObjectProperty(sourceInsert, 'jsxChildren'));
}

function getControlsForStory(metaObject, storyObject, objectByName, inheritsMeta = true) {
  return [...new Set([
    ...(inheritsMeta ? getObjectKeys(getObjectProperty(metaObject, 'args'), objectByName) : []),
    ...(inheritsMeta ? getObjectKeys(getObjectProperty(metaObject, 'argTypes'), objectByName) : []),
    ...getObjectKeys(getObjectProperty(storyObject, 'args'), objectByName),
    ...getObjectKeys(getObjectProperty(storyObject, 'argTypes'), objectByName),
  ])];
}

/**
 * Mirrors shouldInheritCsfMetaFields in src/workbench-stories/sourceStoryMetadata.ts.
 *
 * Workbench never hands a `<Name>Story` sub-component export the meta's args or
 * sourceInsert. Attributing them here reported the Sidebar root's contract
 * against SidebarMenuAction, which declares no sourceInsert.props of its own --
 * a finding nobody could act on, because the runtime never behaves that way.
 */
function storyInheritsMetaFields(exportName, storyObject, component) {
  if (exportName === 'Default') return true;
  const candidates = [
    component.name,
    component.extensions?.importName,
    component.extensions?.sourceExportName,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);
  if (candidates.includes(exportName)) return true;
  if (candidates.some((name) => exportName === `${name}Story`)) return false;
  const declaredName = getStringLiteralValue(getObjectProperty(storyObject, 'name'));
  return !(declaredName && candidates.includes(declaredName));
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

function findPrimaryStoryEntry(storyEntries, component) {
  const candidates = new Set([
    component.name,
    component.extensions?.importName,
    component.extensions?.sourceExportName,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0));

  return storyEntries.find(([exportName, storyObject]) => {
    const storyName = getStringLiteralValue(getObjectProperty(storyObject, 'name'));
    return candidates.has(exportName) || Boolean(storyName && candidates.has(storyName));
  }) ?? storyEntries.find(([exportName]) => exportName === 'Default') ?? storyEntries[0] ?? null;
}

function auditComponent(component, storyCache, componentPropCache) {
  const storySourceFile = component.extensions?.storySourceFile;
  if (typeof storySourceFile !== 'string' || component.extensions?.storyFormat !== 'csf') return [];

  const storyPath = path.resolve(path.dirname(componentRegistryPath), '..', storySourceFile);
  const cached = getCachedStory(storyPath, storyCache);
  if (!cached) {
    return [{
      component: component.name,
      detail: 'story file could not be read',
      file: path.relative(workspaceRoot, storyPath),
      story: '(missing)',
    }];
  }

  const { ast, code, functionByName, metaObject, objectByName, storyEntries } = cached;
  const primaryEntry = findPrimaryStoryEntry(storyEntries, component);
  if (!primaryEntry) return [];

  const [storyName, storyObject] = primaryEntry;
  const inheritsMeta = storyInheritsMetaFields(storyName, storyObject, component);
  const controls = getControlsForStory(metaObject, storyObject, objectByName, inheritsMeta);
  // A control carries a default when the story declares it in `args`. The
  // Inspector then shows that value, and as long as it matches the component's
  // own default the inserted instance needs no explicit prop -- what is shown
  // is what renders. A control declared only in `argTypes` has nothing to show,
  // so the Inspector reads empty while the component quietly applies its own
  // default. That gap is the defect, not the missing sourceInsert entry.
  const controlsWithDefaultArgs = new Set([
    ...(inheritsMeta ? getObjectKeys(getObjectProperty(metaObject, 'args'), objectByName) : []),
    ...getObjectKeys(getObjectProperty(storyObject, 'args'), objectByName),
  ]);
  if (controls.length === 0) return [];
  const renderSource = includeCalledArgHelpers(
    resolveRenderSource(getObjectProperty(storyObject, 'render'), code, objectByName, functionByName),
    functionByName,
  );

  const storyHasSourceInsert = hasSourceInsertContract(storyObject);
  const metaHasSourceInsert = hasSourceInsertContract(metaObject);
  const storySourceProps = getSourceInsertPropsKeys(storyObject, objectByName);
  const metaSourceProps = getSourceInsertPropsKeys(metaObject, objectByName);
  const sourceProps = storySourceProps.length > 0
    ? storySourceProps
    : (inheritsMeta ? metaSourceProps : []);
  const sourceHasJsxChildren = hasSourceInsertJsxChildren(storyObject) ||
    (inheritsMeta && hasSourceInsertJsxChildren(metaObject));
  const componentPropContract = getCachedComponentPropContract(component, componentPropCache);
  const hasComponentProp = (prop) => (
    !componentPropContract ||
    componentPropContract.props.has(prop) ||
    isKnownInheritedRuntimeProp(prop)
  );

  if (sourceProps.length > 0) {
    const controlSet = new Set(controls);
    // `className` and `children` are edited through their own surfaces -- the
    // Inspector's CSS classes panel and content/jsxChildren editing -- so a
    // story deliberately omits them from args. Demanding a duplicate control
    // would split one prop across two editing paths.
    const unbackedSourceProps = sourceProps.filter((prop) => (
      !controlSet.has(prop) && !propHasDedicatedEditor(prop)
    ));
    const nonComponentSourceProps = componentPropContract && !componentPropContract.incomplete
      ? sourceProps.filter((prop) => !hasComponentProp(prop))
      : [];
    const sourcePropSet = new Set(sourceProps);
    const intentionallyOmitted = intentionallyStoryOnlyControls.get(component.name) ?? new Set();
    const usedControlsMissingFromSourceProps = controls.filter((prop) => (
      !controlsWithDefaultArgs.has(prop) &&
      !sourcePropSet.has(prop) &&
      !(prop === 'children' && sourceHasJsxChildren) &&
      !intentionallyOmitted.has(prop) &&
      hasComponentProp(prop) &&
      renderSourceReferencesArg(renderSource, prop)
    ));
    if (
      unbackedSourceProps.length === 0 &&
      nonComponentSourceProps.length === 0 &&
      usedControlsMissingFromSourceProps.length === 0
    ) return [];

    return [
      ...(unbackedSourceProps.length > 0 ? [{
        component: component.name,
        detail: `design sourceInsert.props not backed by story args/argTypes: ${unbackedSourceProps.join(', ')}`,
        file: path.relative(workspaceRoot, storyPath),
        story: storyName,
      }] : []),
      ...(nonComponentSourceProps.length > 0 ? [{
        component: component.name,
        detail: `design sourceInsert.props not in component prop contract: ${nonComponentSourceProps.join(', ')}`,
        file: path.relative(workspaceRoot, storyPath),
        story: storyName,
      }] : []),
      ...(usedControlsMissingFromSourceProps.length > 0 ? [{
        component: component.name,
        detail: `story controls used by render but omitted from design sourceInsert.props: ${usedControlsMissingFromSourceProps.join(', ')}`,
        file: path.relative(workspaceRoot, storyPath),
        story: storyName,
      }] : []),
    ];
  }
  if (storyHasSourceInsert || metaHasSourceInsert) return [];

  return [{
    component: component.name,
    detail: `controls exposed without design sourceInsert.props: ${controls.join(', ')}`,
    file: path.relative(workspaceRoot, storyPath),
    story: storyName,
  }];
}

function getCachedStory(storyPath, storyCache) {
  if (storyCache.has(storyPath)) return storyCache.get(storyPath);
  try {
    const { ast, code } = parseStory(storyPath);
    ast.code = code;
    const parsed = { ast, code, ...collectTopLevelObjects(ast) };
    storyCache.set(storyPath, parsed);
    return parsed;
  } catch {
    storyCache.set(storyPath, null);
    return null;
  }
}

function getCachedComponentPropContract(component, componentPropCache) {
  const sourceFile = component.sourceFile;
  const exportName = component.extensions?.sourceExportName ?? component.extensions?.importName;
  if (typeof sourceFile !== 'string' || typeof exportName !== 'string') return null;

  const cacheKey = `${sourceFile}#${exportName}`;
  if (componentPropCache.has(cacheKey)) return componentPropCache.get(cacheKey);

  const sourcePath = path.resolve(projectRoot, sourceFile);
  try {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    const contract = getComponentPropContract(ast, exportName, sourcePath);
    componentPropCache.set(cacheKey, contract);
    return contract;
  } catch {
    componentPropCache.set(cacheKey, null);
    return null;
  }
}

function getComponentPropContract(ast, exportName, sourcePath) {
  const declarations = collectTypeDeclarations(ast, sourcePath);
  const typeName = findComponentPropsTypeName(ast, exportName, declarations);
  if (!typeName) return null;
  const previous = unresolvedTypeReferences;
  unresolvedTypeReferences = new Set();
  let props;
  let incomplete;
  try {
    props = collectPropNamesForTypeName(typeName, declarations);
    incomplete = unresolvedTypeReferences.size > 0;
  } finally {
    unresolvedTypeReferences = previous;
  }
  return props.size > 0 ? { incomplete, props, typeName } : null;
}

function collectTypeDeclarations(ast, sourcePath, seenSourcePaths = new Set()) {
  const aliases = new Map();
  const interfaces = new Map();
  if (sourcePath) seenSourcePaths.add(sourcePath);

  for (const statement of ast.program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type === 'TSTypeAliasDeclaration') {
      aliases.set(declaration.id.name, declaration.typeAnnotation);
    }
    if (declaration?.type === 'TSInterfaceDeclaration') {
      interfaces.set(declaration.id.name, declaration);
    }
  }

  if (sourcePath) {
    for (const statement of ast.program.body) {
      if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') continue;
      if (!statement.source.value.startsWith('.')) continue;
      const importedSourcePath = resolveLocalTypeImportPath(path.dirname(sourcePath), statement.source.value);
      if (!importedSourcePath || seenSourcePaths.has(importedSourcePath)) continue;
      try {
        const importedCode = fs.readFileSync(importedSourcePath, 'utf8');
        const importedAst = parser.parse(importedCode, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx'],
        });
        const importedDeclarations = collectTypeDeclarations(importedAst, importedSourcePath, seenSourcePaths);
        for (const [name, alias] of importedDeclarations.aliases.entries()) {
          if (!aliases.has(name)) aliases.set(name, alias);
        }
        for (const [name, declaration] of importedDeclarations.interfaces.entries()) {
          if (!interfaces.has(name)) interfaces.set(name, declaration);
        }
      } catch {
        // Imported type lookup is best-effort; missing files fall back to native/runtime checks.
      }
    }
  }

  return { aliases, interfaces };
}

function resolveLocalTypeImportPath(baseDirectory, source) {
  const basePath = path.resolve(baseDirectory, source);
  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function findComponentPropsTypeName(ast, exportName, declarations) {
  const exactTypeName = `${exportName}Props`;
  if (declarations.aliases.has(exactTypeName) || declarations.interfaces.has(exactTypeName)) return exactTypeName;

  const discovered = new Set();
  visitAst(ast, (node, ancestors) => {
    if (discovered.size > 0) return;
    if (node.type === 'FunctionDeclaration' && node.id?.name === exportName) {
      const typeName = getPropsTypeNameFromFunctionParameters(node.params);
      if (typeName) discovered.add(typeName);
    }
    if (node.type !== 'VariableDeclarator' || getIdentifierName(node.id) !== exportName) return;
    const typeName = getPropsTypeNameFromVariableInit(node.init);
    if (typeName) discovered.add(typeName);
    const parent = ancestors.at(-1)?.node;
    if (parent?.type === 'VariableDeclaration') {
      for (const declaration of parent.declarations) {
        if (declaration !== node) continue;
        const functionTypeName = getPropsTypeNameFromVariableInit(declaration.init);
        if (functionTypeName) discovered.add(functionTypeName);
      }
    }
  });

  const [typeName] = discovered;
  if (typeName && (declarations.aliases.has(typeName) || declarations.interfaces.has(typeName))) return typeName;
  return null;
}

function getPropsTypeNameFromVariableInit(node) {
  if (!node) return null;
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return getPropsTypeNameFromFunctionParameters(node.params);
  }
  if (node.type !== 'CallExpression') return null;
  for (const typeParameter of node.typeParameters?.params ?? []) {
    const typeName = getTypeReferenceName(typeParameter);
    if (typeName?.endsWith('Props')) return typeName;
  }
  return null;
}

function getPropsTypeNameFromFunctionParameters(params) {
  for (const param of params) {
    const typeName = getTypeReferenceName(param.typeAnnotation?.typeAnnotation);
    if (typeName?.endsWith('Props')) return typeName;
  }
  return null;
}

// Type references this file could not resolve locally. The collector only
// follows relative imports, so a props type that intersects an external
// primitive -- `Omit<AccordionPrimitive.Root.Props, ...> & {...}` -- yields a
// contract missing everything the primitive contributes. Reporting that gap as
// "not in component prop contract" flagged className/multiple/disabled on
// components that plainly accept them. Record the gap instead of pretending
// the contract is complete.
let unresolvedTypeReferences = null;

function collectPropNamesForTypeName(typeName, declarations, seen = new Set()) {
  if (seen.has(typeName)) return new Set();
  seen.add(typeName);

  const alias = declarations.aliases.get(typeName);
  if (alias) return collectPropNamesFromTypeNode(alias, declarations, seen);

  const declaration = declarations.interfaces.get(typeName);
  if (!declaration) {
    const nativeProps = collectKnownNativeRuntimeProps(typeName);
    if (nativeProps.size === 0 && unresolvedTypeReferences) unresolvedTypeReferences.add(typeName);
    return nativeProps;
  }

  const props = collectPropNamesFromMembers(declaration.body.body);
  for (const parent of declaration.extends ?? []) {
    const parentName = getTypeReferenceName(parent.expression);
    if (!parentName) continue;
    mergeSets(props, collectPropNamesForTypeName(parentName, declarations, seen));
  }
  return props;
}

function collectPropNamesFromTypeNode(node, declarations, seen) {
  if (!node) return new Set();
  if (node.type === 'TSTypeLiteral') return collectPropNamesFromMembers(node.members);
  if (node.type === 'TSIntersectionType') {
    return node.types.reduce((props, item) => {
      mergeSets(props, collectPropNamesFromTypeNode(item, declarations, seen));
      return props;
    }, new Set());
  }
  if (node.type === 'TSParenthesizedType') {
    return collectPropNamesFromTypeNode(node.typeAnnotation, declarations, seen);
  }
  if (node.type === 'TSTypeReference') {
    const typeName = getTypeReferenceName(node.typeName);
    const typeParameters = node.typeParameters?.params ?? [];
    if (typeName === 'Omit' && typeParameters.length >= 1) {
      const props = collectPropNamesFromTypeNode(typeParameters[0], declarations, seen);
      for (const omittedProp of collectStringLiteralTypes(typeParameters[1])) props.delete(omittedProp);
      return props;
    }
    if (typeName === 'Pick' && typeParameters.length >= 2) {
      const pickedProps = collectStringLiteralTypes(typeParameters[1]);
      const sourceProps = collectPropNamesFromTypeNode(typeParameters[0], declarations, seen);
      return new Set([...sourceProps].filter((prop) => pickedProps.has(prop)));
    }
    if (typeName === 'Partial' || typeName === 'Readonly' || typeName === 'Required') {
      return collectPropNamesFromTypeNode(typeParameters[0], declarations, seen);
    }
    const nativeProps = collectKnownNativeRuntimeProps(typeName);
    if (nativeProps.size > 0) return nativeProps;
    if (typeName) return collectPropNamesForTypeName(typeName, declarations, seen);
    // A qualified reference such as `AccordionPrimitive.Root.Props` has no
    // resolvable local name, so nothing it contributes is visible here.
    if (unresolvedTypeReferences) unresolvedTypeReferences.add(getQualifiedTypeReferenceText(node.typeName));
    return new Set();
  }
  return new Set();
}

function collectStringLiteralTypes(node) {
  if (!node) return new Set();
  if (node.type === 'TSLiteralType' && node.literal.type === 'StringLiteral') {
    return new Set([node.literal.value]);
  }
  if (node.type === 'TSUnionType') {
    return node.types.reduce((values, item) => {
      mergeSets(values, collectStringLiteralTypes(item));
      return values;
    }, new Set());
  }
  return new Set();
}

function collectPropNamesFromMembers(members) {
  const props = new Set();
  for (const member of members) {
    if (member.type !== 'TSPropertySignature' && member.type !== 'TSMethodSignature') continue;
    const name = getTypeMemberName(member.key);
    if (name) props.add(name);
  }
  return props;
}

function getQualifiedTypeReferenceText(node) {
  if (!node) return '(unknown)';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'TSQualifiedName') {
    return `${getQualifiedTypeReferenceText(node.left)}.${getQualifiedTypeReferenceText(node.right)}`;
  }
  return '(unknown)';
}

function getTypeReferenceName(node) {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'TSTypeReference') return getTypeReferenceName(node.typeName);
  return null;
}

function getTypeMemberName(node) {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'StringLiteral') return node.value;
  return null;
}

function getIdentifierName(node) {
  return node?.type === 'Identifier' ? node.name : null;
}

const PROPS_WITH_DEDICATED_EDITORS = new Set(['children', 'className']);

function propHasDedicatedEditor(prop) {
  return PROPS_WITH_DEDICATED_EDITORS.has(prop);
}

function isKnownInheritedRuntimeProp(prop) {
  return knownGlobalRuntimeProps.has(prop) || prop.startsWith('data-') || prop.startsWith('aria-');
}

function collectKnownNativeRuntimeProps(typeName) {
  const props = new Set(nativeRuntimePropsByType.get(typeName) ?? []);
  if (typeName && typeName !== 'HTMLAttributes' && nativeRuntimePropsByType.has(typeName)) {
    mergeSets(props, new Set(nativeRuntimePropsByType.get('HTMLAttributes') ?? []));
  }
  return props;
}

function mergeSets(target, source) {
  for (const value of source) target.add(value);
}

function visitAst(root, visitor) {
  const visit = (node, ancestors) => {
    if (!node || typeof node.type !== 'string') return;
    visitor(node, ancestors);
    const keys = VISITOR_KEYS[node.type] ?? [];
    for (const key of keys) {
      const value = node[key];
      if (Array.isArray(value)) {
        for (const child of value) visit(child, [...ancestors, { node }]);
      } else {
        visit(value, [...ancestors, { node }]);
      }
    }
  };
  visit(root, []);
}

const registry = JSON.parse(fs.readFileSync(componentRegistryPath, 'utf8'));
const storyCache = new Map();
const componentPropCache = new Map();
const issues = registry.components.flatMap((component) => auditComponent(component, storyCache, componentPropCache));

if (issues.length > 0) {
  console.log(`Design prop audit found ${issues.length} component(s) using Storybook controls as design props.`);
  for (const issue of issues) {
    console.log(`${issue.file} :: ${issue.component} / ${issue.story}`);
    console.log(`  ${issue.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('Design prop audit passed.');
}
