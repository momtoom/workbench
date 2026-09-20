import { parse } from '@babel/parser';
import babelGenerate from '@babel/generator';
import type { ImportDeclaration, ImportSpecifier } from '@babel/types';
import { isVideoDesignAssetSource } from '@domain/design-system/assets/assetRegistry';
import {
  normalizeCssUrlValue,
  SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY,
  SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY,
  splitCssCommaList,
} from '@domain/document/sourceVideoBackground';

/* @babel/generator publishes a default-export wrapper for ESM/CJS interop;
 * call .default when present so this works in both module systems. */
const generate = ((babelGenerate as unknown as { default?: typeof babelGenerate }).default
  ?? babelGenerate) as typeof babelGenerate;

export type DeveloperExport = {
  cssFiles: string[];
  i18nJson: string | null;
  i18nLangs: string[];
  instructions: string;
  libraryFolders: string[];
  sourceFile: string;
  targetLabel: string;
  tsx: string;
  usedComponents: string[];
};

export type DeveloperExportI18nDictionary = Record<string, Record<string, string>>;

export type DeveloperExportInput = {
  i18n?: DeveloperExportI18nDictionary;
  sourceFile: string;
  targetLabel: string;
  tsx: string;
};

const COMPONENT_PATTERN = /<([A-Z][A-Za-z0-9]*)\b/g;
const IMPORT_SOURCE_PATTERN = /from\s+['"]([^'"]+)['"]/g;

export function createDeveloperExport(input: DeveloperExportInput): DeveloperExport {
  const rewrittenTsx = prettifyAndRewriteTsx(input.tsx);
  const usedComponents = collectUsedComponents(rewrittenTsx);
  const libraryFolders = collectLibraryFolders(rewrittenTsx);
  const cssFiles = collectLikelyCssFiles(libraryFolders);
  const hasI18n = input.i18n && Object.keys(input.i18n).length > 0
    && Object.values(input.i18n).some((entries) => Object.keys(entries).length > 0);
  const i18nJson = hasI18n ? JSON.stringify(input.i18n, null, 2) : null;
  const i18nLangs = hasI18n ? Object.keys(input.i18n!) : [];
  return {
    cssFiles,
    i18nJson,
    i18nLangs,
    instructions: buildInstructions({ cssFiles, hasI18n: Boolean(hasI18n), i18nLangs, libraryFolders, sourceFile: input.sourceFile, usedComponents }),
    libraryFolders,
    sourceFile: input.sourceFile,
    targetLabel: input.targetLabel,
    tsx: rewrittenTsx,
    usedComponents,
  };
}

function prettifyAndRewriteTsx(source: string): string {
  let ast;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch {
    // If parsing fails, fall back to the raw source so the developer at least
    // sees something rather than a blank modal.
    return source;
  }

  rewriteAndMergeImports(ast.program.body);
  rewriteVideoImageElements(ast.program.body);
  removeWorkbenchEditorAttributes(ast.program.body);

  const code = generate(ast, {
    retainLines: false,
    compact: false,
    jsescOption: { minimal: true },
  }).code;

  // Run child-newline insertion FIRST so each JSX tag lands on its own line
  // with a sensible leading indent. The reflow pass then computes attribute
  // indentation from that final line indent instead of from babel's
  // sibling-on-same-line position.
  return wrapLongJsxOpeningTags(newlineBeforeChildJsx(code));
}

/**
 * Strip editor-only `data-wb-*` attributes (token bindings, asset metadata,
 * prototype interaction wiring) so the handed-off TSX stays bare product
 * code. Workbench re-derives all of this metadata from its own copies.
 */
function removeWorkbenchEditorAttributes(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) removeWorkbenchEditorAttributes(item);
    return;
  }

  const node = value as Record<string, unknown>;
  if (node.type === 'JSXOpeningElement' && Array.isArray(node.attributes)) {
    node.attributes = (node.attributes as Record<string, unknown>[]).filter((attribute) => {
      const name = getJsxIdentifierName(getRecord(attribute)?.name);
      return !(typeof name === 'string' && name.startsWith('data-wb-'));
    });
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') continue;
    removeWorkbenchEditorAttributes(child);
  }
}

function rewriteVideoImageElements(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) rewriteVideoImageElements(item);
    return;
  }

  const node = value as Record<string, unknown>;
  if (node.type === 'JSXElement' && isVideoImageJsxElement(node)) {
    rewriteVideoImageJsxElement(node);
  }
  if (node.type === 'JSXElement') {
    rewriteBackgroundVideoJsxElement(node);
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') continue;
    rewriteVideoImageElements(child);
  }
}

function rewriteBackgroundVideoJsxElement(node: Record<string, unknown>): void {
  const openingElement = getRecord(node.openingElement);
  if (!openingElement) return;
  const sourceValue = getJsxStyleStringValue(openingElement, SOURCE_BACKGROUND_VIDEO_SOURCE_PROPERTY);
  const sources = splitCssCommaList(sourceValue ?? '')
    .map(normalizeCssUrlValue)
    .filter(isVideoDesignAssetSource);
  if (sources.length === 0) return;

  const sizes = splitCssCommaList(getJsxStyleStringValue(openingElement, SOURCE_BACKGROUND_VIDEO_SIZE_PROPERTY) ?? '');
  const positions = splitCssCommaList(getJsxStyleStringValue(openingElement, SOURCE_BACKGROUND_VIDEO_POSITION_PROPERTY) ?? '');
  const blends = splitCssCommaList(getJsxStyleStringValue(openingElement, SOURCE_BACKGROUND_VIDEO_BLEND_PROPERTY) ?? '');
  const videos = sources.map((source, index) => createBackgroundVideoJsxElement({
    blend: blends[index] || 'normal',
    position: positions[index] || 'center',
    size: sizes[index] || 'cover',
    source,
  }));

  ensureJsxElementCanHaveChildren(node);
  setJsxStyleStringProperty(openingElement, 'position', getJsxStyleStringValue(openingElement, 'position') || 'relative');
  setJsxStyleStringProperty(openingElement, 'overflow', getJsxStyleStringValue(openingElement, 'overflow') || 'hidden');
  setJsxStyleStringProperty(openingElement, 'isolation', getJsxStyleStringValue(openingElement, 'isolation') || 'isolate');
  node.children = [
    ...videos,
    ...(Array.isArray(node.children) ? node.children : []),
  ];
}

function isVideoImageJsxElement(node: Record<string, unknown>): boolean {
  const openingElement = getRecord(node.openingElement);
  const name = getJsxIdentifierName(openingElement?.name);
  if (name !== 'img') return false;
  return isVideoDesignAssetSource(getJsxAttributeStringValue(openingElement, 'src') ?? undefined);
}

function ensureJsxElementCanHaveChildren(node: Record<string, unknown>): void {
  const openingElement = getRecord(node.openingElement);
  if (!openingElement) return;
  if (openingElement.selfClosing === false && node.closingElement) return;
  openingElement.selfClosing = false;
  node.closingElement = {
    type: 'JSXClosingElement',
    name: openingElement.name,
  };
  if (!Array.isArray(node.children)) node.children = [];
}

function rewriteVideoImageJsxElement(node: Record<string, unknown>): void {
  const openingElement = getRecord(node.openingElement);
  if (!openingElement) return;

  openingElement.name = createJsxIdentifier('video');
  openingElement.selfClosing = false;
  node.closingElement = {
    type: 'JSXClosingElement',
    name: createJsxIdentifier('video'),
  };
  node.children = [];

  const attributes = Array.isArray(openingElement.attributes)
    ? openingElement.attributes as Record<string, unknown>[]
    : [];
  const alt = getJsxAttributeStringValue(openingElement, 'alt');
  removeJsxAttribute(attributes, 'alt');
  if (alt && !hasJsxAttribute(attributes, 'aria-label')) {
    attributes.push(createStringJsxAttribute('aria-label', alt));
  }
  if (!hasJsxAttribute(attributes, 'controls')) attributes.push(createBooleanJsxAttribute('controls'));
  if (!hasJsxAttribute(attributes, 'muted')) attributes.push(createBooleanJsxAttribute('muted'));
  if (!hasJsxAttribute(attributes, 'playsInline')) attributes.push(createBooleanJsxAttribute('playsInline'));
  if (!hasJsxAttribute(attributes, 'preload')) attributes.push(createStringJsxAttribute('preload', 'metadata'));
  openingElement.attributes = attributes;
}

function createBackgroundVideoJsxElement({
  blend,
  position,
  size,
  source,
}: {
  blend: string;
  position: string;
  size: string;
  source: string;
}): Record<string, unknown> {
  const styleProperties = [
    createObjectStringProperty('position', 'absolute'),
    createObjectStringProperty('inset', '0'),
    createObjectStringProperty('zIndex', '-1'),
    createObjectStringProperty('width', '100%'),
    createObjectStringProperty('height', '100%'),
    createObjectStringProperty('objectFit', getBackgroundVideoObjectFit(size)),
    createObjectStringProperty('objectPosition', position),
    createObjectStringProperty('pointerEvents', 'none'),
    ...(blend && blend !== 'normal' ? [createObjectStringProperty('mixBlendMode', blend)] : []),
  ];
  return {
    type: 'JSXElement',
    openingElement: {
      type: 'JSXOpeningElement',
      name: createJsxIdentifier('video'),
      attributes: [
        createStringJsxAttribute('src', source),
        createStringJsxAttribute('aria-hidden', 'true'),
        createBooleanJsxAttribute('autoPlay'),
        createBooleanJsxAttribute('loop'),
        createBooleanJsxAttribute('muted'),
        createBooleanJsxAttribute('playsInline'),
        createStringJsxAttribute('preload', 'metadata'),
        {
          type: 'JSXAttribute',
          name: createJsxIdentifier('style'),
          value: {
            type: 'JSXExpressionContainer',
            expression: {
              type: 'ObjectExpression',
              properties: styleProperties,
            },
          },
        },
      ],
      selfClosing: true,
    },
    closingElement: null,
    children: [],
  };
}

function getBackgroundVideoObjectFit(size: string): string {
  if (size === 'contain') return 'contain';
  if (size === '100% 100%' || size === 'fill') return 'fill';
  if (size === 'auto') return 'none';
  return 'cover';
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function getJsxIdentifierName(value: unknown): string | null {
  const node = getRecord(value);
  return node?.type === 'JSXIdentifier' && typeof node.name === 'string' ? node.name : null;
}

function getJsxAttributeStringValue(openingElement: Record<string, unknown> | null, attributeName: string): string | null {
  const attributes = Array.isArray(openingElement?.attributes)
    ? openingElement.attributes as Record<string, unknown>[]
    : [];
  const attribute = attributes.find((candidate) => getJsxIdentifierName(getRecord(candidate)?.name) === attributeName);
  const value = getRecord(getRecord(attribute)?.value);
  if (!value) return null;
  if (value.type === 'StringLiteral' && typeof value.value === 'string') return value.value;
  if (value.type === 'JSXExpressionContainer') {
    const expression = getRecord(value.expression);
    if (expression?.type === 'StringLiteral' && typeof expression.value === 'string') return expression.value;
  }
  return null;
}

function getJsxStyleStringValue(openingElement: Record<string, unknown>, propertyName: string): string | null {
  const property = getJsxStyleObjectProperties(openingElement)
    .find((candidate) => getObjectPropertyName(candidate) === propertyName);
  return property ? getObjectPropertyStringValue(property) : null;
}

function setJsxStyleStringProperty(openingElement: Record<string, unknown>, propertyName: string, value: string): void {
  const properties = getJsxStyleObjectProperties(openingElement);
  const existing = properties.find((candidate) => getObjectPropertyName(candidate) === propertyName);
  if (existing) {
    existing.value = createStringLiteral(value);
    return;
  }
  properties.push(createObjectStringProperty(propertyName, value));
}

function getJsxStyleObjectProperties(openingElement: Record<string, unknown>): Record<string, unknown>[] {
  const attributes = Array.isArray(openingElement.attributes)
    ? openingElement.attributes as Record<string, unknown>[]
    : [];
  const styleAttribute = attributes.find((attribute) => getJsxIdentifierName(attribute.name) === 'style');
  const expression = getRecord(getRecord(styleAttribute)?.value)?.expression;
  const styleObject = getRecord(expression);
  if (styleObject?.type !== 'ObjectExpression') return [];
  return Array.isArray(styleObject.properties)
    ? styleObject.properties as Record<string, unknown>[]
    : [];
}

function getObjectPropertyName(property: Record<string, unknown>): string | null {
  if (property.type !== 'ObjectProperty') return null;
  const key = getRecord(property.key);
  if (key?.type === 'Identifier' && typeof key.name === 'string') return key.name;
  if (key?.type === 'StringLiteral' && typeof key.value === 'string') return key.value;
  return null;
}

function getObjectPropertyStringValue(property: Record<string, unknown>): string | null {
  const value = getRecord(property.value);
  return value?.type === 'StringLiteral' && typeof value.value === 'string' ? value.value : null;
}

function hasJsxAttribute(attributes: Record<string, unknown>[], attributeName: string): boolean {
  return attributes.some((attribute) => getJsxIdentifierName(attribute.name) === attributeName);
}

function removeJsxAttribute(attributes: Record<string, unknown>[], attributeName: string): void {
  const index = attributes.findIndex((attribute) => getJsxIdentifierName(attribute.name) === attributeName);
  if (index >= 0) attributes.splice(index, 1);
}

function createJsxIdentifier(name: string): Record<string, unknown> {
  return { type: 'JSXIdentifier', name };
}

function createBooleanJsxAttribute(name: string): Record<string, unknown> {
  return {
    type: 'JSXAttribute',
    name: createJsxIdentifier(name),
    value: null,
  };
}

function createStringJsxAttribute(name: string, value: string): Record<string, unknown> {
  return {
    type: 'JSXAttribute',
    name: createJsxIdentifier(name),
    value: createStringLiteral(value),
  };
}

function createObjectStringProperty(name: string, value: string): Record<string, unknown> {
  return {
    type: 'ObjectProperty',
    key: /^[A-Za-z_$][\w$]*$/.test(name) ? { type: 'Identifier', name } : createStringLiteral(name),
    value: createStringLiteral(value),
    computed: false,
    shorthand: false,
  };
}

function createStringLiteral(value: string): Record<string, unknown> {
  return {
    type: 'StringLiteral',
    value,
  };
}

function newlineBeforeChildJsx(code: string): string {
  // After the JSX reflow pass, an opening tag's `>` can still butt up against
  // an immediate `<NextTag` child on the same line. Split them onto separate
  // lines using the parent line's indent + 2 spaces.
  return code.split('\n').map((line) => {
    const indentMatch = /^([ \t]*)/.exec(line);
    const indent = indentMatch?.[1] ?? '';
    const childIndent = `${indent}  `;
    return line.replace(/((?<!\/)>)(\s*)(<[A-Za-z])/g, (_match, gt, _ws, lt) => `${gt}\n${childIndent}${lt}`);
  }).join('\n');
}

const JSX_TAG_WRAP_THRESHOLD_CHARS = 100;
const JSX_TAG_WRAP_THRESHOLD_ATTRS = 3;

function wrapLongJsxOpeningTags(code: string): string {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '<' && /[A-Za-z]/.test(code[i + 1] ?? '')) {
      const tagEnd = findJsxOpeningTagEnd(code, i);
      if (tagEnd > i) {
        const lineStart = code.lastIndexOf('\n', i) + 1;
        const indent = /^[ \t]*/.exec(code.slice(lineStart, i))?.[0] ?? '';
        const tagSource = code.slice(i, tagEnd + 1);
        const reformatted = reformatJsxTag(tagSource, indent);
        result += reformatted;
        i = tagEnd + 1;
        continue;
      }
    }
    result += code[i];
    i += 1;
  }
  return result;
}

function findJsxOpeningTagEnd(code: string, start: number): number {
  let i = start + 1;
  let braceDepth = 0;
  let stringChar: '"' | "'" | '`' | null = null;
  while (i < code.length) {
    const c = code[i];
    if (stringChar) {
      if (c === '\\') { i += 2; continue; }
      if (c === stringChar) stringChar = null;
    } else {
      if (c === '"' || c === "'" || c === '`') stringChar = c;
      else if (c === '{') braceDepth += 1;
      else if (c === '}') braceDepth -= 1;
      else if (c === '<' && braceDepth === 0) return -1; // nested element — bail
      else if (c === '>' && braceDepth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

function reformatJsxTag(source: string, indent: string): string {
  const selfClosing = source.endsWith('/>');
  const closingLen = selfClosing ? 2 : 1;
  const inner = source.slice(1, source.length - closingLen).trim();
  const tokens = splitJsxAttributeTokens(inner);
  if (tokens.length < 1) return source;

  const tagName = tokens[0];
  const attrs = tokens.slice(1);

  const singleLineAttrs = attrs.join(' ');
  const singleLine = `<${tagName}${attrs.length > 0 ? ` ${singleLineAttrs}` : ''}${selfClosing ? ' />' : '>'}`;
  if (attrs.length < JSX_TAG_WRAP_THRESHOLD_ATTRS && singleLine.length <= JSX_TAG_WRAP_THRESHOLD_CHARS) {
    return singleLine;
  }
  if (attrs.length === 0) return singleLine;

  const childIndent = `${indent}  `;
  const attrLines = attrs.map((attr) => formatAttributeLine(attr, childIndent)).join('\n');
  return `<${tagName}\n${attrLines}\n${indent}${selfClosing ? '/>' : '>'}`;
}

function formatAttributeLine(attr: string, childIndent: string): string {
  // Single-line attribute: just indent it.
  if (!attr.includes('\n')) return `${childIndent}${attr}`;
  // Multi-line attribute (e.g. `style={{\n  ...\n}}`): babel already emitted
  // its own indentation that depends on the original JSX nesting depth. Strip
  // that base indent and re-anchor against our new childIndent so the inner
  // lines sit a consistent step deeper and the closing `}}` aligns with the
  // attribute name.
  const lines = attr.split('\n');
  const [firstLine, ...rest] = lines;
  let baseIndent = '';
  for (let i = rest.length - 1; i >= 0; i -= 1) {
    if (rest[i].trim().length > 0) {
      baseIndent = /^[ \t]*/.exec(rest[i])?.[0] ?? '';
      break;
    }
  }
  const baseLen = baseIndent.length;
  const reindented = rest.map((line) => {
    if (line.trim().length === 0) return line;
    const original = /^[ \t]*/.exec(line)?.[0] ?? '';
    const body = line.slice(original.length);
    const relative = original.startsWith(baseIndent) ? original.slice(baseLen) : original;
    return `${childIndent}${relative}${body}`;
  });
  return [`${childIndent}${firstLine}`, ...reindented].join('\n');
}

function splitJsxAttributeTokens(inner: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let braceDepth = 0;
  let stringChar: '"' | "'" | '`' | null = null;
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (stringChar) {
      current += c;
      if (c === '\\' && i + 1 < inner.length) {
        current += inner[i + 1];
        i += 1;
        continue;
      }
      if (c === stringChar) stringChar = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { stringChar = c; current += c; continue; }
    if (c === '{') { braceDepth += 1; current += c; continue; }
    if (c === '}') { braceDepth -= 1; current += c; continue; }
    if (/\s/.test(c) && braceDepth === 0) {
      if (current.length > 0) { tokens.push(current); current = ''; }
      continue;
    }
    current += c;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function rewriteAndMergeImports(body: import('@babel/types').Statement[]): void {
  const merged = new Map<string, ImportDeclaration>();
  const indicesToRemove: number[] = [];

  body.forEach((statement, index) => {
    if (statement.type !== 'ImportDeclaration') return;
    const remapped = remapImportSource(statement.source.value);
    if (remapped !== null) statement.source.value = remapped;
    const target = statement.source.value;
    const existing = merged.get(target);
    if (!existing) {
      merged.set(target, statement);
      return;
    }
    // Move specifiers into the first import for this source and drop this one.
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') {
        existing.specifiers.push(specifier);
        continue;
      }
      if (!hasMatchingImportSpecifier(existing.specifiers as ImportSpecifier[], specifier)) {
        existing.specifiers.push(specifier);
      }
    }
    indicesToRemove.push(index);
  });

  // Sort specifiers alphabetically for stable, readable output.
  for (const decl of merged.values()) {
    if (decl.specifiers.every((s) => s.type === 'ImportSpecifier')) {
      decl.specifiers.sort((left, right) => getSpecifierName(left).localeCompare(getSpecifierName(right)));
    }
  }

  for (let i = indicesToRemove.length - 1; i >= 0; i -= 1) {
    body.splice(indicesToRemove[i], 1);
  }
}

function remapImportSource(source: string): string | null {
  void source;
  return null;
}

function getSpecifierName(specifier: ImportDeclaration['specifiers'][number]): string {
  if (specifier.type === 'ImportSpecifier') {
    return specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
  }
  return specifier.local.name;
}

function hasMatchingImportSpecifier(haystack: ImportSpecifier[], needle: ImportSpecifier): boolean {
  const needleName = getSpecifierName(needle);
  return haystack.some((candidate) => getSpecifierName(candidate) === needleName);
}

function collectUsedComponents(tsx: string): string[] {
  const names = new Set<string>();
  for (const match of tsx.matchAll(COMPONENT_PATTERN)) {
    if (match[1]) names.add(match[1]);
  }
  return [...names].sort();
}

function collectLibraryFolders(tsx: string): string[] {
  const folders = new Set<string>();
  for (const match of tsx.matchAll(IMPORT_SOURCE_PATTERN)) {
    const source = match[1] ?? '';
    const presetMatch = /(?:^|\/)([a-z][a-z0-9-]*)-preset\/components(?:\/|$)/i.exec(source);
    if (presetMatch?.[1]) {
      folders.add(`${presetMatch[1]}-preset`);
      continue;
    }
    const libraryMatch = /(?:^|\/)libraries\/([a-z][a-z0-9-]*)\/components(?:\/|$)/i.exec(source);
    if (libraryMatch?.[1]) {
      folders.add(`src/libraries/${libraryMatch[1]}`);
    }
  }
  return [...folders].sort();
}

function collectLikelyCssFiles(libraryFolders: string[]): string[] {
  return libraryFolders.map((folder) => {
    const libraryId = folder.split('/').pop()?.replace(/-preset$/, '') ?? 'library';
    return `${folder}/components/${libraryId}.css`;
  });
}

function buildInstructions({
  cssFiles,
  hasI18n,
  i18nLangs,
  libraryFolders,
  sourceFile,
  usedComponents,
}: {
  cssFiles: string[];
  hasI18n: boolean;
  i18nLangs: string[];
  libraryFolders: string[];
  sourceFile: string;
  usedComponents: string[];
}): string {
  const componentSummary = usedComponents.length > 0 ? usedComponents.join(', ') : '(none)';
  const librarySummary = libraryFolders.length > 0 ? libraryFolders.join(', ') : '(none inferred)';
  const cssSummary = cssFiles.length > 0 ? cssFiles.join(', ') : '(none inferred)';

  const lines = [
    '## Developer handoff',
    '',
    `1. Drop the TSX from \`${sourceFile}\` into your routes/pages.`,
    `2. Keep or adjust the source imports for these components: ${componentSummary}.`,
    `3. Copy any referenced library folders that are not already in the consuming project: ${librarySummary}.`,
    `4. Import the relevant library CSS once at your app entry point. Likely CSS files: ${cssSummary}.`,
    '',
    'If the target app uses different library locations, update the TSX import paths before committing.',
  ];

  if (hasI18n) {
    lines.push(
      '',
      '## i18n (string-token localization)',
      '',
      `Available languages: ${i18nLangs.join(', ')}`,
      '',
      '- Page TSX uses `t("token.id")` calls. Keep the existing import path or point it to your app i18n wrapper.',
      '- The generated i18n JSON can be adapted to your CMS or runtime localization pipeline.',
      '- Switch language at runtime:',
      '',
      '    import { setLang } from \'./workbench-i18n\';',
      '    setLang(\'en\');',
      '',
      '- To use another i18n library, provide a wrapper that exposes the same `t / setLang / getLang` API.',
    );
  }

  return lines.join('\n');
}
