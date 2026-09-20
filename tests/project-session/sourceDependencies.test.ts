import assert from 'node:assert/strict';
import test from 'node:test';
import { findWorkbenchSourceFileDependents } from '@domain/document/sourceDependencies';

const TARGET = 'src/workbench-pages/ComponentAtlas.tsx';

test('finds extensionless static imports that reference a page', () => {
  assert.deepEqual(findWorkbenchSourceFileDependents([
    {
      relativePath: 'src/main.tsx',
      contents: "import ComponentAtlasPage from './workbench-pages/ComponentAtlas';",
    },
    {
      relativePath: 'src/workbench-pages/ComponentAtlas.tsx',
      contents: 'export default function ComponentAtlasPage() { return null; }',
    },
  ], TARGET), ['src/main.tsx']);
});

test('finds re-exports and dynamic imports while ignoring unrelated modules', () => {
  assert.deepEqual(findWorkbenchSourceFileDependents([
    {
      relativePath: 'src/routes/catalog.ts',
      contents: "export { default } from '../workbench-pages/ComponentAtlas.tsx';",
    },
    {
      relativePath: 'src/routes/lazy.tsx',
      contents: "const Catalog = lazy(() => import('../workbench-pages/ComponentAtlas'));",
    },
    {
      relativePath: 'src/routes/dashboard.tsx',
      contents: "import Dashboard from '../workbench-pages/SaasDashboard';",
    },
  ], TARGET), ['src/routes/catalog.ts', 'src/routes/lazy.tsx']);
});

test('matches index modules and project aliases without reporting the target itself', () => {
  assert.deepEqual(findWorkbenchSourceFileDependents([
    {
      relativePath: 'src/main.tsx',
      contents: "import ComponentAtlasPage from '@/workbench-pages/ComponentAtlas/index';",
    },
    {
      relativePath: 'src/workbench-pages/ComponentAtlas/index.tsx',
      contents: 'export default function ComponentAtlasPage() { return null; }',
    },
  ], 'src/workbench-pages/ComponentAtlas/index.tsx'), ['src/main.tsx']);
});
