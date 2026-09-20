export const CODEX_COMPONENT_LIBRARY_HANDOFF_PATH = '.workbench/codex-component-library-handoff.json';

export type CodexComponentLibraryHandoffAction = 'normalize-library' | 'install-library';

export type CodexComponentLibraryHandoff = {
  kind: 'workbench-codex-component-library-handoff';
  schemaVersion: '0.1';
  createdAt: string;
  action: CodexComponentLibraryHandoffAction;
  libraryName: string;
  project: {
    componentsPath: string;
    projectName: string;
    rootPath: string | null;
    source: 'dev-server' | 'static-fallback';
  };
  notes: string[];
  expectedResult: string[];
};

export function createCodexComponentLibraryHandoff({
  action,
  componentsPath,
  createdAt = new Date().toISOString(),
  libraryName,
  projectName,
  rootPath,
  source,
}: {
  action: CodexComponentLibraryHandoffAction;
  componentsPath: string;
  createdAt?: string;
  libraryName: string;
  projectName: string;
  rootPath: string | null;
  source: 'dev-server' | 'static-fallback';
}): CodexComponentLibraryHandoff {
  return {
    kind: 'workbench-codex-component-library-handoff',
    schemaVersion: '0.1',
    createdAt,
    action,
    libraryName: libraryName.trim(),
    project: {
      componentsPath,
      projectName,
      rootPath,
      source,
    },
    notes: [
      'This file is a Codex Desktop work request for source-backed component library authoring.',
      'Do not add in-app AI chat, model keys, or runtime AI calls to Workbench.',
      'Codex should create, install, or normalize real TSX/CSS source files, then register them in the Workbench component registry.',
    ],
    expectedResult: [
      'Real component source files are present in the connected project.',
      'The Workbench component registry points to those source files.',
      'Storybook preview, controls, variants, and docs remain source-backed.',
      'Any visual fixes are applied through component source and design tokens, not placeholder previews.',
    ],
  };
}
