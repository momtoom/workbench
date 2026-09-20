import type {
  EditableDocumentTree,
  EditableTreeNode,
  EditableTreeSourceAttributes,
  EditableTreeSourceStyleDeclarations,
  EditableTreeTokenBindingReferences,
  EditableTreeTokenBindings,
} from './editableTree';
import { normalizeEditableSourceAttributeValue } from './sourceAttributeSafety';

export const CODEX_DESIGN_HANDOFF_PATH = '.workbench/codex-design-handoff.json';

export type CodexDesignHandoff = {
  kind: 'workbench-codex-design-handoff';
  schemaVersion: '0.1';
  createdAt: string;
  componentId: string;
  componentName: string;
  sourceFile: string;
  story: {
    args: Record<string, boolean | number | string>;
    name: string;
    sourceFile: string;
  } | null;
  selectedNodeId: string | null;
  tree: CodexDesignHandoffTree;
  notes: string[];
};

export type CodexDesignHandoffTree = {
  id: string;
  label: string;
  root: CodexDesignHandoffNode;
};

export type CodexDesignHandoffNode = {
  id: string;
  label: string;
  kind: EditableTreeNode['kind'];
  children?: CodexDesignHandoffNode[];
  textContent?: string;
  jsxName?: string;
  sourceFile?: string;
  sourceAttributes?: EditableTreeSourceAttributes;
  sourceJsxProps?: EditableTreeNode['sourceJsxProps'];
  sourceProps?: EditableTreeNode['sourceProps'];
  sourceStyleDeclarations?: EditableTreeSourceStyleDeclarations;
  tokenBindingReferences?: EditableTreeTokenBindingReferences;
  tokenBindings?: EditableTreeTokenBindings;
};

export function createCodexDesignHandoff({
  componentId,
  componentName,
  createdAt = new Date().toISOString(),
  selectedNodeId,
  sourceFile,
  story,
  tree,
}: {
  componentId: string;
  componentName: string;
  createdAt?: string;
  selectedNodeId: string | null;
  sourceFile: string;
  story: CodexDesignHandoff['story'];
  tree: EditableDocumentTree;
}): CodexDesignHandoff {
  return {
    kind: 'workbench-codex-design-handoff',
    schemaVersion: '0.1',
    createdAt,
    componentId,
    componentName,
    sourceFile,
    story,
    selectedNodeId,
    tree: {
      id: tree.id,
      label: tree.label,
      root: createCodexDesignHandoffNode(tree.root),
    },
    notes: [
      'This file is a source-aware design snapshot for Codex Desktop.',
      'Apply visual intent to the real TSX/CSS implementation; do not treat this JSON as runtime source.',
      'Prefer Workbench token variables and data-wb token bindings when translating styles back to code.',
    ],
  };
}

function createCodexDesignHandoffNode(node: EditableTreeNode): CodexDesignHandoffNode {
  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    ...(node.textContent ? { textContent: node.textContent } : {}),
    ...(node.source?.jsxName ? { jsxName: node.source.jsxName } : {}),
    ...(node.source?.sourceFile ? { sourceFile: node.source.sourceFile } : {}),
    ...normalizeCodexDesignHandoffSourceAttributes(node.sourceAttributes),
    ...(node.sourceJsxProps && Object.keys(node.sourceJsxProps).length > 0 ? { sourceJsxProps: node.sourceJsxProps } : {}),
    ...(node.sourceProps && Object.keys(node.sourceProps).length > 0 ? { sourceProps: node.sourceProps } : {}),
    ...(node.sourceStyleDeclarations && Object.keys(node.sourceStyleDeclarations).length > 0 ? { sourceStyleDeclarations: node.sourceStyleDeclarations } : {}),
    ...(node.tokenBindings && Object.keys(node.tokenBindings).length > 0 ? { tokenBindings: node.tokenBindings } : {}),
    ...(node.tokenBindingReferences && Object.keys(node.tokenBindingReferences).length > 0 ? { tokenBindingReferences: node.tokenBindingReferences } : {}),
    ...(node.children && node.children.length > 0 ? { children: node.children.map(createCodexDesignHandoffNode) } : {}),
  };
}

function normalizeCodexDesignHandoffSourceAttributes(
  sourceAttributes: EditableTreeSourceAttributes | undefined,
): Pick<CodexDesignHandoffNode, 'sourceAttributes'> {
  if (!sourceAttributes) return {};
  const normalized = Object.fromEntries(
    Object.entries(sourceAttributes).flatMap(([attributeName, value]): Array<[string, string]> => {
      const normalizedValue = normalizeEditableSourceAttributeValue(attributeName, value, { allowEmpty: true });
      return normalizedValue === null ? [] : [[attributeName, normalizedValue]];
    }),
  );
  return Object.keys(normalized).length > 0 ? { sourceAttributes: normalized } : {};
}
