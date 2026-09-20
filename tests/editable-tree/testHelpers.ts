import assert from 'node:assert/strict';
import type { EditableDocumentTree, EditableTreeNode } from '@domain/document/editableTree';
import { createEditableDocumentTreeFromTsxSource } from '@domain/document/editableTreeSourceParser';

export async function parseEditableSource({
  contents,
  label,
  preferredComponentNames,
  sourceFile,
}: {
  contents: string;
  label: string;
  preferredComponentNames?: string[];
  sourceFile: string;
}): Promise<EditableDocumentTree> {
  const result = await createEditableDocumentTreeFromTsxSource({
    contents,
    label,
    preferredComponentNames,
    sourceFile,
  });
  assert.equal(result.ok, true, result.diagnostic);
  assert.ok(result.tree);
  return result.tree;
}

export function findNodeByJsxName(tree: EditableDocumentTree, jsxName: string): EditableTreeNode {
  const match = walkEditableTree(tree.root).find((node) => node.source?.jsxName === jsxName);
  assert.ok(match, `${jsxName} should be present in the parsed editable tree`);
  return match;
}

export function findNodesByJsxName(tree: EditableDocumentTree, jsxName: string): EditableTreeNode[] {
  return walkEditableTree(tree.root).filter((node) => node.source?.jsxName === jsxName);
}

export function findTextContent(node: EditableTreeNode): string {
  return walkEditableTree(node)
    .map((candidate) => candidate.textContent ?? '')
    .join('')
    .trim();
}

export function walkEditableTree(root: EditableTreeNode): EditableTreeNode[] {
  const nodes: EditableTreeNode[] = [];
  const visited = new Set<EditableTreeNode>();
  const visit = (node: EditableTreeNode) => {
    if (visited.has(node)) return;
    visited.add(node);
    nodes.push(node);
    for (const child of node.children ?? []) visit(child);
    for (const child of node.sourcePreviewChildren ?? []) visit(child);
  };
  visit(root);
  return nodes;
}
