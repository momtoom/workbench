import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  createWorkbenchProjectFiles,
  createWorkbenchProjectGuideFiles,
  createWorkbenchProjectSampleFiles,
  createWorkbenchProjectSourceFiles,
} from './workbench-template.mjs';

const projectRoot = resolve(process.argv[2] ?? process.cwd());
const workbenchDir = join(projectRoot, '.workbench');
const createdAt = new Date().toISOString();
const projectName = readPackageName(projectRoot) ?? basename(projectRoot);
const projectId = `wb_${basename(projectRoot).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;

try {
  if (!statSync(projectRoot).isDirectory()) {
    throw new Error(`${projectRoot} is not a folder`);
  }
} catch {
  console.error(`Project folder does not exist: ${projectRoot}`);
  process.exit(1);
}

mkdirSync(workbenchDir, { recursive: true });

const files = createWorkbenchProjectFiles({ projectId, projectName, createdAt });
const sourceFiles = createWorkbenchProjectSourceFiles({ projectName });
const guideFiles = createWorkbenchProjectGuideFiles();
const sampleFiles = createWorkbenchProjectSampleFiles();

const results = files.map(([fileName, value]) => {
  const filePath = join(workbenchDir, fileName);
  return { fileName, status: writeJsonIfMissing(filePath, value) };
});
const sourceResults = sourceFiles.map(([fileName, contents]) => {
  const filePath = join(projectRoot, fileName);
  return { fileName, status: writeTextIfMissing(filePath, contents) };
});
const guideResults = guideFiles.map(([fileName, contents]) => {
  const filePath = join(projectRoot, fileName);
  return { fileName, status: writeTextIfMissing(filePath, contents) };
});
const sampleResults = sampleFiles.map(([fileName, contents]) => {
  const filePath = join(projectRoot, fileName);
  return { fileName, status: writeTextIfMissing(filePath, contents) };
});

console.log(`Workbench initialized at ${workbenchDir}`);
for (const result of results) {
  console.log(`- ${result.status}: .workbench/${result.fileName}`);
}
for (const result of sourceResults) {
  console.log(`- ${result.status}: ${result.fileName}`);
}
for (const result of guideResults) {
  console.log(`- ${result.status}: ${result.fileName}`);
}
for (const result of sampleResults) {
  console.log(`- ${result.status}: ${result.fileName}`);
}

function writeJsonIfMissing(filePath, value) {
  if (existsSync(filePath)) return 'exists';
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return 'created';
}

function writeTextIfMissing(filePath, contents) {
  if (existsSync(filePath)) return 'exists';
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents, 'utf8');
  return 'created';
}

function readPackageName(rootPath) {
  const packagePath = join(rootPath, 'package.json');
  if (!existsSync(packagePath)) return null;

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return typeof packageJson.name === 'string' ? packageJson.name : null;
  } catch {
    return null;
  }
}
