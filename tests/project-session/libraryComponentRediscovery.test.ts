import assert from 'node:assert/strict';
import test from 'node:test';
import { hydrateProjectLocalLibraries } from '@domain/project/workbenchProjectLocalLibraries';
import { findCsfStoryForComponent } from '@domain/project/workbenchComponentStorySource';
import type { WorkbenchComponentRegistry, WorkbenchPageRegistry } from '@domain/project/workbenchProject';

const KIT_SOURCE = (name: string) => `
export function ${name}({ children }: { children?: React.ReactNode }) {
  return <div className="kit">{children}</div>;
}
`;

const KIT_STORY = (name: string, authoring: string) => `
import { ${name} as Component } from './${name}';

const meta = {
  title: 'Kit/${name}',
  component: Component,
${authoring}};
export default meta;

export const ${name} = { name: '${name}', render: () => <Component /> };
`;

const FILES: Record<string, string> = {
  'src/components/KitCard.tsx': KIT_SOURCE('KitCard'),
  'src/components/KitCard.stories.tsx': KIT_STORY('KitCard', "  authoring: {\n    allowedChildren: ['KitPanel'],\n    group: 'Content',\n  },\n"),
  'src/components/KitPanel.tsx': KIT_SOURCE('KitPanel'),
  'src/components/KitPanel.stories.tsx': KIT_STORY('KitPanel', "  authoring: {\n    group: 'Layout',\n    hiddenFromInsert: true,\n  },\n"),
  // No story: never registers, the same rule the import flow applies.
  'src/components/KitOrphan.tsx': KIT_SOURCE('KitOrphan'),
};

const readSourceFile = async (path: string) => (
  path in FILES
    ? { ok: true as const, contents: FILES[path] }
    : { ok: false as const, message: `missing ${path}` }
);

const readSourceTree = async (path: string) => (
  path === 'src/components'
    ? {
      ok: true as const,
      files: Object.entries(FILES).map(([relativePath, contents]) => ({ contents, relativePath })),
    }
    : { ok: false as const, message: `missing ${path}` }
);

const PAGES = { schemaVersion: '0.1', pages: [], extensions: {} } as unknown as WorkbenchPageRegistry;

test('prefers the full component story name over a prefix-stripped decoy', () => {
  const selected = findCsfStoryForComponent({
    componentName: 'InputButton',
    displayName: 'InputButton',
    sourceFile: 'src/libraries/local/components/InputParts.tsx',
    stories: [
      { path: 'src/libraries/local/components/Button.stories.tsx' },
      { path: 'src/libraries/local/components/InputButton.stories.tsx' },
    ],
  });

  assert.equal(selected?.path, 'src/libraries/local/components/InputButton.stories.tsx');
});

function createRegistry(): WorkbenchComponentRegistry {
  return {
    schemaVersion: '0.1',
    components: [{
      id: 'kit-card',
      name: 'KitCard',
      sourceFile: 'src/components/KitCard.tsx',
      componentSetId: 'component-set-local',
      variants: [],
      extensions: {
        source: 'local',
        importName: 'KitCard',
        sourceExportName: 'KitCard',
        importedFrom: 'src/components/KitCard.tsx',
        currentSourceFile: 'src/components/KitCard.tsx',
        sourceTruth: 'project-local',
        syncStatus: 'pinned',
        storyFormat: 'csf',
        storySourceFile: 'src/components/KitCard.stories.tsx',
        libraryId: 'local',
        librarySourcePath: 'src/components',
        librarySnapshotRoot: 'src',
        libraryUpdatePolicy: 'manual',
      },
    }],
    extensions: {
      libraries: {
        local: {
          id: 'local',
          kind: 'project-local',
          sourcePath: 'src/components',
          snapshotRoot: 'src',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    },
  } as unknown as WorkbenchComponentRegistry;
}

test('registers a story-backed component the registry never listed', async () => {
  const next = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree, registry: createRegistry(),
  });
  const byName = new Map(next.components.map((c) => [
    String((c.extensions as Record<string, unknown>)?.importName ?? c.name),
    c,
  ]));

  // Nothing rediscovers a library root otherwise: the registered-story pass
  // only refreshes entries already listed, and the import flow needs the app UI.
  assert.ok(byName.has('KitPanel'), 'KitPanel should be discovered from its story');
  assert.ok(byName.has('KitCard'), 'the already-registered component survives');
  assert.equal(byName.has('KitOrphan'), false, 'a component with no story stays unregistered');

  const panel = byName.get('KitPanel');
  assert.equal((panel?.extensions as Record<string, unknown>)?.libraryId, 'local');
  assert.equal((panel?.extensions as Record<string, unknown>)?.componentGroup, 'Layout');
  assert.equal((panel?.extensions as Record<string, unknown>)?.hiddenFromInsert, true);
  assert.equal(panel?.componentSetId, 'component-set-local');
});

test('rediscovery is idempotent and leaves an already-complete registry alone', async () => {
  const first = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree, registry: createRegistry(),
  });
  const second = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree, registry: first,
  });
  assert.equal(second, first, 'a second pass returns the same registry object');
});

test('a library with no registered components is left untouched', async () => {
  const registry = createRegistry();
  const empty = { ...registry, components: [] } as unknown as WorkbenchComponentRegistry;
  const next = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree, registry: empty,
  });
  // Discovering into an empty library would invent a component set the
  // project never imported.
  assert.equal(next.components.length, 0);
});

test('a library tree read the host could not complete keeps its components; a missing root drops them', async () => {
  const registered = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree, registry: createRegistry(),
  });
  const hasKitCard = (registry: WorkbenchComponentRegistry) => registry.components.some((component) => (
    component.sourceFile === 'src/components/KitCard.tsx'
  ));
  assert.ok(hasKitCard(registered));

  // The host answered, but not with the tree: a cap, a timeout. Nothing was
  // disproved, so nothing goes.
  const cappedTree = async () => ({ ok: false as const, message: 'Import path contains more than 4096 supported files.' });
  const afterCap = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile, readSourceTree: cappedTree, registry: registered,
  });
  assert.ok(hasKitCard(afterCap), 'a read the host could not complete must not empty the library');

  // The root itself is gone: the host says so positively, and its files no
  // longer read either.
  const missingTree = async (path: string) => ({ ok: false as const, message: `Import path not found: ${path}`, notFound: true });
  const missingSource = async (path: string) => ({ ok: false as const, message: `missing ${path}` });
  const afterRemoval = await hydrateProjectLocalLibraries({
    pages: PAGES, readSourceFile: missingSource, readSourceTree: missingTree, registry: registered,
  });
  assert.equal(hasKitCard(afterRemoval), false, 'a root the host reports missing removes its components');
});

test('repairs sibling exports whose dedicated story links were collapsed to the source basename', async () => {
  const sourceRoot = 'src/libraries/local/components';
  const sourceFile = `${sourceRoot}/DropdownMenu.tsx`;
  const componentNames = ['FigmaDropdownButton', 'FigmaDropdownMenu', 'FigmaDropdownMenuItem'];
  const storyFiles = new Map([
    ['FigmaDropdownButton', `${sourceRoot}/DropdownButton.stories.tsx`],
    ['FigmaDropdownMenu', `${sourceRoot}/DropdownMenu.stories.tsx`],
    ['FigmaDropdownMenuItem', `${sourceRoot}/DropdownMenuItem.stories.tsx`],
  ]);
  const files: Record<string, string> = {
    [`${sourceRoot}/index.ts`]: `export { ${componentNames.join(', ')} } from './DropdownMenu';`,
    [sourceFile]: componentNames.map((name) => `
export function ${name}({ label = '${name}' }: { label?: string }) {
  return <div>{label}</div>;
}
`).join('\n'),
    ...Object.fromEntries(componentNames.map((name) => [storyFiles.get(name)!, `
import { ${name} } from './DropdownMenu';

const meta = { title: 'Local/${name}', component: ${name} };
export default meta;

export const Default = {
  name: '${name.replace(/^Figma/, '')}',
  args: { label: '${name}' },
  argTypes: { label: { control: 'text' } },
  sourceInsert: { props: { label: '${name}' } },
  render: (args: { label?: string }) => <${name} label={args.label} />,
};
`])),
  };
  const readFile = async (path: string) => (
    path in files
      ? { ok: true as const, contents: files[path] }
      : { ok: false as const, message: `missing ${path}` }
  );
  const readTree = async (path: string) => (
    path === 'src/libraries/local'
      ? {
        ok: true as const,
        files: Object.entries(files).map(([relativePath, contents]) => ({ contents, relativePath })),
      }
      : { ok: false as const, message: `missing ${path}` }
  );
  const registry = {
    schemaVersion: '0.1',
    components: componentNames.map((name) => ({
      id: `local-${name.toLowerCase()}`,
      name,
      sourceFile,
      componentSetId: 'component-set-imported',
      variants: [],
      extensions: {
        source: 'imported',
        importName: name,
        sourceExportName: name,
        importedFrom: sourceFile,
        currentSourceFile: sourceFile,
        sourceTruth: 'project-local',
        syncStatus: 'pinned',
        storyFormat: 'csf',
        storySourceFile: `${sourceRoot}/DropdownMenu.stories.tsx`,
        libraryId: 'local',
        librarySourcePath: 'src/libraries/local',
        librarySnapshotRoot: 'src/libraries/local',
        libraryUpdatePolicy: 'manual',
      },
    })),
    extensions: {
      libraries: {
        local: {
          id: 'local',
          kind: 'project-local',
          sourcePath: 'src/libraries/local',
          snapshotRoot: 'src/libraries/local',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    },
  } as unknown as WorkbenchComponentRegistry;

  const next = await hydrateProjectLocalLibraries({
    pages: PAGES,
    readSourceFile: readFile,
    readSourceTree: readTree,
    registry,
  });
  const byImportName = new Map(next.components.map((component) => [
    String((component.extensions as Record<string, unknown>)?.importName ?? component.name),
    component,
  ]));

  assert.deepEqual([...byImportName.keys()].sort(), [...componentNames].sort());
  for (const name of componentNames) {
    assert.equal(
      (byImportName.get(name)?.extensions as Record<string, unknown>)?.storySourceFile,
      storyFiles.get(name),
      `${name} should retain its source-backed story owner`,
    );
    assert.notEqual(
      (byImportName.get(name)?.extensions as Record<string, unknown>)?.hiddenFromInsert,
      true,
      `${name} should remain visible when its story uses the public suffix name`,
    );
  }
});

test('preserves all siblings when one configured story is unreadable or temporarily names another sibling', async () => {
  const sourceRoot = 'src/libraries/local/components';
  const sourceFile = `${sourceRoot}/DropdownMenu.tsx`;
  const componentNames = ['FigmaDropdownButton', 'FigmaDropdownMenuItem'];
  const storyFiles = new Map(componentNames.map((name) => [
    name,
    `${sourceRoot}/${name.replace(/^Figma/, '')}.stories.tsx`,
  ]));
  const files: Record<string, string> = {
    [`${sourceRoot}/index.ts`]: `export { ${componentNames.join(', ')} } from './DropdownMenu';`,
    [sourceFile]: componentNames.map((name) => `
export function ${name}({ label = '${name}' }: { label?: string }) {
  return <div>{label}</div>;
}
`).join('\n'),
    ...Object.fromEntries(componentNames.map((name) => [storyFiles.get(name)!, `
import { ${name} } from './DropdownMenu';

const meta = { title: 'Local/${name}', component: ${name} };
export default meta;

export const Default = {
  name: '${name.replace(/^Figma/, '')}',
  render: () => <${name} />,
};
`])),
  };
  const failedStory = storyFiles.get('FigmaDropdownMenuItem');
  const readFile = async (path: string) => (
    path === failedStory
      ? { ok: false as const, message: `transient read failure ${path}` }
      : path in files
        ? { ok: true as const, contents: files[path] }
        : { ok: false as const, message: `missing ${path}` }
  );
  const registry = {
    schemaVersion: '0.1',
    components: componentNames.map((name) => ({
      id: `local-${name.toLowerCase()}`,
      name,
      sourceFile,
      componentSetId: 'component-set-imported',
      variants: [],
      extensions: {
        source: 'imported',
        importName: name,
        sourceExportName: name,
        importedFrom: sourceFile,
        currentSourceFile: sourceFile,
        sourceTruth: 'project-local',
        syncStatus: 'pinned',
        storyFormat: 'csf',
        storySourceFile: storyFiles.get(name),
        libraryId: 'local',
        librarySourcePath: 'src/libraries/local',
        librarySnapshotRoot: 'src/libraries/local',
        libraryUpdatePolicy: 'manual',
      },
    })),
    extensions: {
      libraries: {
        local: {
          id: 'local',
          kind: 'project-local',
          sourcePath: 'src/libraries/local',
          snapshotRoot: 'src/libraries/local',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    },
  } as unknown as WorkbenchComponentRegistry;

  const next = await hydrateProjectLocalLibraries({
    pages: PAGES,
    readSourceFile: readFile,
    registry,
  });

  assert.equal(next, registry, 'a partial story read must not reconcile or delete siblings from the same source');

  const incompleteStoryFiles = {
    ...files,
    [failedStory!]: `
import { FigmaDropdownButton } from './DropdownMenu';
const meta = { component: FigmaDropdownButton };
export default meta;
export const Default = { name: 'DropdownButton' };
`,
  };
  const readIncompleteStory = async (path: string) => (
    path in incompleteStoryFiles
      ? { ok: true as const, contents: incompleteStoryFiles[path] }
      : { ok: false as const, message: `missing ${path}` }
  );
  const afterIncompleteStory = await hydrateProjectLocalLibraries({
    pages: PAGES,
    readSourceFile: readIncompleteStory,
    registry,
  });

  assert.equal(
    afterIncompleteStory,
    registry,
    'a temporarily mismatched story must not reconcile or delete siblings from the same source',
  );
});

test('prunes no-longer-exported internal siblings while repairing the public InputParts stories', async () => {
  const sourceRoot = 'src/libraries/local/components';
  const sourceFile = `${sourceRoot}/InputParts.tsx`;
  const publicComponents = [
    'FigmaInputButton',
    'FigmaInputDropdownTrigger',
    'FigmaInputHelper',
    'FigmaInputLabel',
  ];
  const internalComponents = ['FigmaInputAssetIcon', 'FigmaInputBadge', 'FigmaInputFlag'];
  const componentNames = [...publicComponents, ...internalComponents];
  const storyFiles = new Map(publicComponents.map((name) => [
    name,
    `${sourceRoot}/${name.replace(/^Figma/, '')}.stories.tsx`,
  ]));
  const files: Record<string, string> = {
    [`${sourceRoot}/index.ts`]: `export { ${publicComponents.join(', ')} } from './InputParts';`,
    [sourceFile]: componentNames.map((name) => `
export function ${name}({ label = '${name}' }: { label?: string }) {
  return <div>{label}</div>;
}
`).join('\n'),
    ...Object.fromEntries(publicComponents.map((name) => [storyFiles.get(name)!, `
import { ${name} } from './InputParts';

const meta = { title: 'Local/${name}', component: ${name} };
export default meta;

export const Default = {
  name: '${name.replace(/^Figma/, '')}',
  args: { label: '${name}' },
  argTypes: { label: { control: 'text' } },
  sourceInsert: { props: { label: '${name}' } },
  render: (args: { label?: string }) => <${name} label={args.label} />,
};
`])),
  };
  const readFile = async (path: string) => (
    path in files
      ? { ok: true as const, contents: files[path] }
      : { ok: false as const, message: `missing ${path}` }
  );
  const readTree = async (path: string) => (
    path === 'src/libraries/local'
      ? {
        ok: true as const,
        files: Object.entries(files).map(([relativePath, contents]) => ({ contents, relativePath })),
      }
      : { ok: false as const, message: `missing ${path}` }
  );
  const registry = {
    schemaVersion: '0.1',
    components: componentNames.map((name) => ({
      id: `local-${name.toLowerCase()}`,
      name,
      sourceFile,
      componentSetId: 'component-set-imported',
      variants: [],
      extensions: {
        source: 'imported',
        importName: name,
        sourceExportName: name,
        importedFrom: sourceFile,
        currentSourceFile: sourceFile,
        sourceTruth: 'project-local',
        syncStatus: 'pinned',
        storyFormat: 'csf',
        storySourceFile: `${sourceRoot}/InputParts.stories.tsx`,
        libraryId: 'local',
        librarySourcePath: 'src/libraries/local',
        librarySnapshotRoot: 'src/libraries/local',
        libraryUpdatePolicy: 'manual',
      },
    })),
    extensions: {
      libraries: {
        local: {
          id: 'local',
          kind: 'project-local',
          sourcePath: 'src/libraries/local',
          snapshotRoot: 'src/libraries/local',
          updatePolicy: 'manual',
          mergePolicy: 'overwrite',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    },
  } as unknown as WorkbenchComponentRegistry;

  const next = await hydrateProjectLocalLibraries({
    pages: PAGES,
    readSourceFile: readFile,
    readSourceTree: readTree,
    registry,
  });
  const byImportName = new Map(next.components.map((component) => [
    String((component.extensions as Record<string, unknown>)?.importName ?? component.name),
    component,
  ]));

  assert.deepEqual([...byImportName.keys()].sort(), [...publicComponents].sort());
  for (const name of publicComponents) {
    assert.equal(
      (byImportName.get(name)?.extensions as Record<string, unknown>)?.storySourceFile,
      storyFiles.get(name),
      `${name} should be repaired from its dedicated story`,
    );
    assert.notEqual(
      (byImportName.get(name)?.extensions as Record<string, unknown>)?.hiddenFromInsert,
      true,
      `${name} should remain visible when its story uses the public suffix name`,
    );
  }
  for (const name of internalComponents) {
    assert.equal(byImportName.has(name), false, `${name} is no longer public and should not stay registered`);
  }
});
