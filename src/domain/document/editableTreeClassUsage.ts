import type { EditableTreeNode } from './editableTree';

export type EditableTreeClassUsage = {
  className: string;
  count: number;
  sourceFiles: string[];
};

export function collectEditableTreeClassUsage(
  root: EditableTreeNode | null,
  options: { sourceFile?: string | null } = {},
): EditableTreeClassUsage[] {
  const usageByClassName = new Map<string, { count: number; sourceFiles: Set<string> }>();
  const targetSourceFile = options.sourceFile?.trim() || null;

  function visit(node: EditableTreeNode) {
    const sourceFile = node.source?.sourceFile?.trim();
    if (!targetSourceFile || sourceFile === targetSourceFile) {
      const classNames = splitClassNameTokens(node.sourceAttributes?.className ?? '');
      for (const className of classNames) {
        const usage = usageByClassName.get(className) ?? { count: 0, sourceFiles: new Set<string>() };
        usage.count += 1;
        if (sourceFile) usage.sourceFiles.add(sourceFile);
        usageByClassName.set(className, usage);
      }
    }
    for (const child of node.children ?? []) visit(child);
  }

  if (root) visit(root);
  return [...usageByClassName.entries()]
    .map(([className, usage]) => ({
      className,
      count: usage.count,
      sourceFiles: [...usage.sourceFiles].sort(),
    }))
    .sort((left, right) => left.className.localeCompare(right.className));
}

function splitClassNameTokens(value: string): string[] {
  return [...new Set(value.split(/\s+/).map((token) => token.trim()).filter(Boolean))];
}
