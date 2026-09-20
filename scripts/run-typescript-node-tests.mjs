import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function runTypescriptNodeTests({
  testDirectory,
  temporaryDirectoryPrefix,
}) {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), temporaryDirectoryPrefix));
  const testSourceDirectory = path.join(root, testDirectory);

  try {
    const testSourceFiles = (await readdir(testSourceDirectory))
      .filter((fileName) => fileName.endsWith('.test.ts'))
      .sort()
      .map((fileName) => path.join(testSourceDirectory, fileName));
    if (testSourceFiles.length === 0) {
      throw new Error(`No TypeScript test files were found in ${testDirectory}.`);
    }

    await build({
      bundle: true,
      entryNames: '[name]',
      entryPoints: testSourceFiles,
      format: 'esm',
      logLevel: 'silent',
      outdir: temporaryDirectory,
      outExtension: { '.js': '.mjs' },
      platform: 'node',
      sourcemap: 'inline',
      target: 'node22',
      tsconfig: path.join(root, 'tsconfig.app.json'),
    });

    const bundledTestFiles = testSourceFiles.map((fileName) => (
      path.join(temporaryDirectory, path.basename(fileName, '.ts') + '.mjs')
    ));
    const exitCode = await runNodeTests(bundledTestFiles);
    if (exitCode !== 0) process.exitCode = exitCode;
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

function runNodeTests(testFiles) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--test', ...testFiles], {
      cwd: root,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`TypeScript tests terminated with ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}
