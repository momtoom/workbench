export type WorkbenchProjectClassSource = {
  contents: string;
  sourceFile: string;
};

export type WorkbenchProjectClassRule = {
  declarations: string;
  selector: string;
  sourceFile: string;
};

export type WorkbenchProjectClassDefinition = {
  className: string;
  rules: WorkbenchProjectClassRule[];
  sourceFiles: string[];
};

export type WorkbenchProjectClassCatalog = {
  classes: WorkbenchProjectClassDefinition[];
  diagnostics: string[];
};

export function createEmptyWorkbenchProjectClassCatalog(): WorkbenchProjectClassCatalog {
  return { classes: [], diagnostics: [] };
}

export function createWorkbenchProjectClassCatalog(
  sources: WorkbenchProjectClassSource[],
): WorkbenchProjectClassCatalog {
  const sourceFilesByClassName = new Map<string, Set<string>>();
  const rulesByClassName = new Map<string, WorkbenchProjectClassRule[]>();
  const diagnostics: string[] = [];

  for (const source of sources) {
    try {
      for (const rule of collectCssRules(source.contents)) {
        for (const className of collectCssClassNamesFromSelector(rule.selector)) {
          const sourceFiles = sourceFilesByClassName.get(className) ?? new Set<string>();
          sourceFiles.add(source.sourceFile);
          sourceFilesByClassName.set(className, sourceFiles);
          const rules = rulesByClassName.get(className) ?? [];
          rules.push({
            declarations: rule.declarations,
            selector: rule.selector,
            sourceFile: source.sourceFile,
          });
          rulesByClassName.set(className, rules);
        }
      }
    } catch (error) {
      diagnostics.push(`${source.sourceFile}: ${formatCssParseError(error)}`);
    }
  }

  return {
    classes: [...sourceFilesByClassName.entries()]
      .map(([className, sourceFiles]) => ({
        className,
        rules: rulesByClassName.get(className) ?? [],
        sourceFiles: [...sourceFiles].sort(),
      }))
      .sort((left, right) => left.className.localeCompare(right.className)),
    diagnostics,
  };
}

/**
 * Collect rule preludes without pulling PostCSS's Node-only filesystem and
 * source-map helpers into the Workbench browser bundle. The catalog only needs
 * selectors, so a small balanced-token scanner is both sufficient and safer
 * than evaluating a build-time CSS tool in the renderer.
 */
type CollectedCssRule = { declarations: string; selector: string };

function collectCssRules(css: string): CollectedCssRule[] {
  const rules: CollectedCssRule[] = [];
  const blockStartIndexes: number[] = [];
  const blockSelectors: (string | null)[] = [];
  let statementStart = 0;
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index]!;
    const nextCharacter = css[index + 1];

    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = null;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      const commentEnd = css.indexOf('*/', index + 2);
      if (commentEnd < 0) throw new Error('Unclosed comment.');
      index = commentEnd + 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(') {
      parenthesisDepth += 1;
      continue;
    }
    if (character === ')') {
      parenthesisDepth = Math.max(0, parenthesisDepth - 1);
      continue;
    }
    if (character === '[') {
      bracketDepth += 1;
      continue;
    }
    if (character === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (parenthesisDepth > 0 || bracketDepth > 0) continue;

    if (character === '{') {
      const prelude = css.slice(statementStart, index).trim();
      blockSelectors.push(prelude && !prelude.startsWith('@') ? prelude : null);
      blockStartIndexes.push(index);
      statementStart = index + 1;
      continue;
    }
    if (character === ';') {
      statementStart = index + 1;
      continue;
    }
    if (character === '}') {
      const blockStart = blockStartIndexes.pop();
      if (blockStart == null) throw new Error('Unexpected closing brace.');
      const selector = blockSelectors.pop() ?? null;
      if (selector) {
        rules.push({
          declarations: css.slice(blockStart + 1, index).trim(),
          selector,
        });
      }
      statementStart = index + 1;
    }
  }

  if (quote) throw new Error('Unclosed string.');
  if (blockStartIndexes.length > 0) throw new Error('Unclosed block.');
  return rules;
}

export function collectCssClassNamesFromSelector(selector: string): string[] {
  const classNames = new Set<string>();
  let attributeDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index]!;
    const nextCharacter = selector[index + 1];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      const commentEnd = selector.indexOf('*/', index + 2);
      index = commentEnd >= 0 ? commentEnd + 1 : selector.length;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[') {
      attributeDepth += 1;
      continue;
    }
    if (character === ']') {
      attributeDepth = Math.max(0, attributeDepth - 1);
      continue;
    }
    if (character !== '.' || attributeDepth > 0) continue;

    const identifier = readCssIdentifier(selector, index + 1);
    if (!identifier.value) continue;
    classNames.add(identifier.value);
    index = identifier.endIndex - 1;
  }

  return [...classNames];
}

function readCssIdentifier(value: string, startIndex: number): { endIndex: number; value: string } {
  let result = '';
  let index = startIndex;

  while (index < value.length) {
    const character = value[index]!;
    if (character === '\\') {
      const escape = readCssEscape(value, index + 1);
      if (!escape.value) break;
      result += escape.value;
      index = escape.endIndex;
      continue;
    }
    if (!isCssIdentifierCharacter(character)) break;
    result += character;
    index += 1;
  }

  return { endIndex: index, value: result };
}

function readCssEscape(value: string, startIndex: number): { endIndex: number; value: string } {
  if (startIndex >= value.length) return { endIndex: startIndex, value: '' };
  const hexMatch = value.slice(startIndex).match(/^[0-9a-fA-F]{1,6}/);
  if (!hexMatch) {
    return { endIndex: startIndex + 1, value: value[startIndex]! };
  }

  const codePoint = Number.parseInt(hexMatch[0], 16);
  let endIndex = startIndex + hexMatch[0].length;
  if (/\s/.test(value[endIndex] ?? '')) endIndex += 1;
  return {
    endIndex,
    value: codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '\uFFFD',
  };
}

function isCssIdentifierCharacter(character: string): boolean {
  return /[A-Za-z0-9_-]/.test(character) || character.charCodeAt(0) >= 0x80;
}

function formatCssParseError(error: unknown): string {
  return error instanceof Error ? error.message : 'CSS could not be parsed.';
}
