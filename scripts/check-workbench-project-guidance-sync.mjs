#!/usr/bin/env node

import { strict as assert } from 'node:assert';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createWorkbenchProjectGuideFiles,
  createWorkbenchProjectSourceFiles,
  WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE,
} from './workbench-template.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncScript = path.join(repoRoot, 'scripts', 'sync-workbench-project-guidance.mjs');
const temporaryRoot = await mkdtemp(
  path.join(tmpdir(), 'workbench-project-guidance-sync.'),
);

try {
  await verifyExplicitProjectRequirement();
  await verifyRecognizedGeneratedMigration();
  await verifyConflictAndForcedBackup();
  console.log('Workbench project guidance sync checks passed.');
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}

async function verifyExplicitProjectRequirement() {
  const result = runSync([]);
  assert.notEqual(result.status, 0, 'sync should require an explicit project path');
  assert.match(result.stderr, /Missing required --project/);
  const generatedGitignore = new Map(
    createWorkbenchProjectSourceFiles({ templateId: 'standard' }),
  ).get('.gitignore') ?? '';
  assert.match(
    generatedGitignore,
    /^\.workbench\/guidance-backups\/$/m,
    'generated projects should ignore local guidance backups',
  );
}

async function verifyRecognizedGeneratedMigration() {
  const projectRoot = path.join(temporaryRoot, 'recognized-project');
  await createProject(projectRoot, 'standard');
  const legacyAgents = createLegacyEntrypoint('AGENTS.md');
  const legacyClaude = createLegacyEntrypoint('CLAUDE.md');
  await writeText(projectRoot, 'AGENTS.md', legacyAgents);
  await writeText(projectRoot, 'CLAUDE.md', legacyClaude);

  const dryRun = runSync(['--project', projectRoot]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /update\s+AGENTS\.md/);
  assert.match(dryRun.stdout, /create\s+\.claude\/skills\/workbench-project-authoring\/SKILL\.md/);
  assert.equal(await readText(projectRoot, 'AGENTS.md'), legacyAgents);
  assert.equal(
    await fileExists(projectRoot, '.claude/skills/workbench-project-authoring/SKILL.md'),
    false,
    'dry-run must not create files',
  );

  const write = runSync(['--project', projectRoot, '--write']);
  assert.equal(write.status, 0, write.stderr);
  assert.match(write.stdout, /Applied 15 guidance change\(s\)/);

  const expectedFiles = managedTemplateFiles('standard');
  for (const [relativePath, contents] of expectedFiles) {
    assert.equal(
      await readText(projectRoot, relativePath),
      contents,
      `${relativePath} should match the current generated template`,
    );
  }

  const backupRoots = await backupDirectories(projectRoot);
  assert.equal(backupRoots.length, 1, 'recognized updates should create one backup');
  assert.equal(
    await readFile(path.join(backupRoots[0], 'AGENTS.md'), 'utf8'),
    legacyAgents,
  );
  assert.equal(
    await readFile(path.join(backupRoots[0], 'CLAUDE.md'), 'utf8'),
    legacyClaude,
  );

  const secondWrite = runSync(['--project', projectRoot, '--write']);
  assert.equal(secondWrite.status, 0, secondWrite.stderr);
  assert.match(secondWrite.stdout, /unchanged=15/);
  assert.equal(
    (await backupDirectories(projectRoot)).length,
    1,
    'an unchanged run should not create another backup',
  );
}

async function verifyConflictAndForcedBackup() {
  const projectRoot = path.join(temporaryRoot, 'custom-project');
  await createProject(projectRoot, 'shadcn-base');
  const customClaude = '# Custom Claude project policy\n\nDo not overwrite me.\n';
  const curatedContext = '# Curated project context\n\nAudience: public\nStatus: curated\n\n## Known limitations\n\n- Reviewed project-specific limitation.\n';
  await writeText(projectRoot, 'CLAUDE.md', customClaude);
  await writeText(projectRoot, WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE, curatedContext);

  const blockedWrite = runSync(['--project', projectRoot, '--write']);
  assert.equal(blockedWrite.status, 2, blockedWrite.stderr);
  assert.match(blockedWrite.stdout, /conflict\s+CLAUDE\.md/);
  assert.match(blockedWrite.stderr, /No files were written/);
  assert.equal(await readText(projectRoot, 'CLAUDE.md'), customClaude);
  assert.equal(
    await fileExists(projectRoot, 'AGENTS.md'),
    false,
    'a conflict should abort the complete write plan',
  );

  const forcedWrite = runSync([
    '--project',
    projectRoot,
    '--write',
    '--force',
  ]);
  assert.equal(forcedWrite.status, 0, forcedWrite.stderr);
  assert.match(forcedWrite.stdout, /replace\s+CLAUDE\.md/);
  assert.equal(
    await readText(projectRoot, 'CLAUDE.md'),
    managedTemplateFiles('shadcn-base').get('CLAUDE.md'),
  );
  assert.equal(
    await readText(projectRoot, WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE),
    curatedContext,
    'forced guidance sync must not overwrite project-owned curated context',
  );
  const backups = await backupDirectories(projectRoot);
  assert.equal(backups.length, 1, 'forced replacement should create a backup');
  assert.equal(
    await readFile(path.join(backups[0], 'CLAUDE.md'), 'utf8'),
    customClaude,
  );
}

function runSync(args) {
  return spawnSync(process.execPath, [syncScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

async function createProject(projectRoot, templateId) {
  await mkdir(path.join(projectRoot, '.workbench'), { recursive: true });
  await writeFile(
    path.join(projectRoot, '.workbench', 'workbench.config.json'),
    `${JSON.stringify({
      schemaVersion: '0.1',
      workbench: { app: 'workbench-v1' },
      extensions: { projectTemplate: { id: templateId } },
    }, null, 2)}\n`,
    'utf8',
  );
}

function managedTemplateFiles(templateId) {
  return new Map(
    createWorkbenchProjectGuideFiles({ templateId }).filter(([relativePath]) =>
      relativePath === 'AGENTS.md' ||
      relativePath === 'CLAUDE.md' ||
      relativePath === WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE ||
      relativePath.startsWith('.agents/skills/') ||
      relativePath.startsWith('.claude/skills/')),
  );
}

async function writeText(projectRoot, relativePath, contents) {
  const filePath = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

async function readText(projectRoot, relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function fileExists(projectRoot, relativePath) {
  try {
    await readFile(path.join(projectRoot, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function backupDirectories(projectRoot) {
  const backupRoot = path.join(projectRoot, '.workbench', 'guidance-backups');
  const names = await readdir(backupRoot).catch((error) => {
    if (error?.code === 'ENOENT') return [];
    throw error;
  });
  return names.sort().map((name) => path.join(backupRoot, name));
}

function createLegacyEntrypoint(fileName) {
  return [
    '# Workbench Project Agent Instructions',
    '',
    'This folder is a Workbench local project. It is the user-owned project',
    'workspace, not the Workbench application source.',
    '',
    'Before non-trivial work, read:',
    '',
    '- `docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md`',
    '- `docs/workbench-agent/WORKBENCH-COMPONENT-AUTHORING.md` when creating or editing components',
    '',
    'Shared project agent skills live under `.agents/skills`; Codex discovers them',
    'there. Claude Code receives a matching auto-discovery wrapper under',
    '`.claude/skills` for design-authoring requests. Use the relevant skill when',
    'the task matches design, project, component, or preview runtime work.',
    '',
    'Keep those guides in the loop throughout the task. Re-check them before',
    'changing source shape, registry metadata, component contracts, CSS/token',
    'paths, assets, imports, or final handoff notes.',
    '',
    'Hard stops:',
    '',
    '- Do not inspect, decompile, or rely on the packaged Workbench app internals.',
    '- Do not add in-app AI prompt bars, AI API keys, or generation surfaces unless the user explicitly asks.',
    '- Do not treat placeholder UI as finished product progress.',
    '- Do not hand-edit `.workbench/components.json` or `.workbench/prop-registry.json` for component creation or ordinary component changes.',
    '- Keep Workbench registry files, source files, and sidecar notes consistent when you change pages or components.',
    '',
    `${fileName} should stay thin. Put shared project guidance in \`docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md\`.`,
    '',
  ].join('\n');
}
