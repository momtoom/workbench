import { runTypescriptNodeTests } from './run-typescript-node-tests.mjs';

await runTypescriptNodeTests({
  temporaryDirectoryPrefix: 'workbench-editable-tree-tests-',
  testDirectory: 'tests/editable-tree',
});
