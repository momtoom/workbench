import { runTypescriptNodeTests } from './run-typescript-node-tests.mjs';

await runTypescriptNodeTests({
  temporaryDirectoryPrefix: 'workbench-project-session-tests-',
  testDirectory: 'tests/project-session',
});
