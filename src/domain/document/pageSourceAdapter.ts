import type {
  EditableTreeSourceParseResult,
  ImportableComponentSummary,
} from './editableTreeSourceParser';
import {
  createEditableDocumentTreeFromTsxSource,
  getImportableComponentNamesFromTsxSource,
  getImportableComponentSummariesFromTsxSource,
} from './editableTreeSourceParser';
import type { EditableTreeSourcePropValue } from './editableTree';
import { getPageSourceFrameworkForFile, type PageSourceFramework } from './pageSourceFramework';

export type PageSourceParseCommand = {
  contents: string;
  label: string;
  preferredComponentNames?: string[];
  scopedValues?: Record<string, EditableTreeSourcePropValue>;
  sourceFile: string;
};

export type PageSourceImportableComponentCommand = {
  contents: string;
  fallbackName: string;
};

/**
 * One page-source framework, one adapter. Parse and importable-component
 * hydration route through here so a page file's framework — derived from the
 * file itself, not from panel state — decides which parser owns it. Writeback
 * stays framework-guarded inside editableTreeSourceWriteback until a second
 * writeback implementation exists.
 */
export type PageSourceAdapter = {
  framework: PageSourceFramework;
  createEditableDocumentTree(command: PageSourceParseCommand): Promise<EditableTreeSourceParseResult>;
  getImportableComponentNames(command: PageSourceImportableComponentCommand): Promise<string[]>;
  getImportableComponentSummaries(command: PageSourceImportableComponentCommand): Promise<ImportableComponentSummary[]>;
};

const reactPageSourceAdapter: PageSourceAdapter = {
  framework: 'react',
  createEditableDocumentTree: createEditableDocumentTreeFromTsxSource,
  getImportableComponentNames: getImportableComponentNamesFromTsxSource,
  getImportableComponentSummaries: getImportableComponentSummariesFromTsxSource,
};

const pageSourceAdapters = new Map<PageSourceFramework, PageSourceAdapter>([
  ['react', reactPageSourceAdapter],
]);

export function registerPageSourceAdapter(adapter: PageSourceAdapter): void {
  pageSourceAdapters.set(adapter.framework, adapter);
}

export function getPageSourceAdapter(framework: PageSourceFramework): PageSourceAdapter | null {
  return pageSourceAdapters.get(framework) ?? null;
}

export function getPageSourceAdapterForFile(sourceFile: string): PageSourceAdapter | null {
  return getPageSourceAdapter(getPageSourceFrameworkForFile(sourceFile));
}

export function formatMissingPageSourceAdapterDiagnostic(sourceFile: string): string {
  const framework = getPageSourceFrameworkForFile(sourceFile);
  return `${sourceFile} is a ${framework} page source, and no ${framework} source adapter is registered yet.`;
}

export async function getImportableComponentSummariesFromComponentSource(
  command: PageSourceImportableComponentCommand & { sourceFile: string },
): Promise<ImportableComponentSummary[]> {
  const adapter = getPageSourceAdapterForFile(command.sourceFile);
  const getSummaries = adapter?.getImportableComponentSummaries ?? getImportableComponentSummariesFromTsxSource;
  return getSummaries({ contents: command.contents, fallbackName: command.fallbackName });
}

export async function createEditableDocumentTreeFromPageSource(
  command: PageSourceParseCommand,
): Promise<EditableTreeSourceParseResult> {
  const adapter = getPageSourceAdapterForFile(command.sourceFile);
  if (!adapter) {
    return {
      ok: false,
      diagnostic: formatMissingPageSourceAdapterDiagnostic(command.sourceFile),
      tree: null,
    };
  }
  return adapter.createEditableDocumentTree(command);
}
