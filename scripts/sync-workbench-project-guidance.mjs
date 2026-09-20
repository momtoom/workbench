#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  createWorkbenchProjectGuideFiles,
  WORKBENCH_AGENT_SKILLS_DIR,
  WORKBENCH_CLAUDE_SKILLS_DIR,
  WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE,
  WORKBENCH_PROJECT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL,
  WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
} from './workbench-template.mjs';

const PROJECT_SKILL_NAMES = [
  WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL,
  WORKBENCH_PROJECT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
];

const MANAGED_GUIDANCE_PATHS = [
  'AGENTS.md',
  'CLAUDE.md',
  ...PROJECT_SKILL_NAMES.flatMap((skillName) => [
    `${WORKBENCH_AGENT_SKILLS_DIR}/${skillName}/SKILL.md`,
    `${WORKBENCH_AGENT_SKILLS_DIR}/${skillName}/agents/openai.yaml`,
    `${WORKBENCH_CLAUDE_SKILLS_DIR}/${skillName}/SKILL.md`,
  ]),
  WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE,
];

const SEED_ONLY_GUIDANCE_PATHS = new Set([
  WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE,
]);

// These are normalized SHA-256 fingerprints of generated guidance versions
// already present in checked-in Workbench projects. Template labels and the
// AGENTS/CLAUDE filename line are normalized before hashing so user-authored
// content is never accepted merely because it resembles a generated file.
const LEGACY_ENTRYPOINT_HASHES = [
  '22a79723a397b0ceabd4b445f540c94426a93ef92fd6e2dd8125dff831095e6c',
  '39a6e893aa6522170edce90d89c23def5dd416bb291bbf62606b5704576c3fe3',
  '21c963217b760c5e4a10072303c66d21e64c648bd84dbeb398ccc0660a37d64d',
  'a84013cca846d0143ef76d1be8863cdcc63ddc96a7cc345d2134b3fb02b4d3a9',
];

const LEGACY_GENERATED_HASHES = new Map([
  ['AGENTS.md', new Set(LEGACY_ENTRYPOINT_HASHES)],
  ['CLAUDE.md', new Set(LEGACY_ENTRYPOINT_HASHES)],
  [
    `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`,
    new Set([
      'cd07954b81fc78ba94408138d48f535d6c5e344cec9daa15b83720f795e45a0f',
      'f08df4097291b9b94b98c0cda17ee6b83d0dfc697c4f0cd2db97215cf1fe34f7',
      '1e25ea1e4017e259e97018a71c345d12b5f60803ed72d7a4031dacfa6b696af0',
    ]),
  ],
  [
    `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/SKILL.md`,
    new Set([
      '5b02ddca8078e71acc67eb7a460ee9c36cfaa44c717ed24f292cb232299ddd06',
      '41e4ed1322772b5d22252a4a66592ee013769fe95b3404a4ac12916d38e5f6b5',
      '09d0c780c9d25fdecaa20990582fc8c8ea925f538626ab3589537fb99625e2d5',
      'cec453490d93d34a6ee4cf86dba650ab4e8da72fe14748430db385148bbde98a',
    ]),
  ],
  [
    `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/SKILL.md`,
    new Set([
      'ba1aef0448a2c6b144663415a3ab8bfb902d2b6b218cc08e30ee1d95f684a0c2',
      'a3eb884b66b5f4e62812e120577bc5401d5535171553885f1bb66f77c4a15cd9',
      '997e4633f053dbf5a0039d1d93dc334b132294aa46e97330b0501f0257614a24',
    ]),
  ],
  [
    `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL}/SKILL.md`,
    new Set([
      '1044f5ae53050c360b96643eb933191f9a502454264c2a0a72ba67ab8b21a47b',
    ]),
  ],
  [
    `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`,
    new Set([
      '552a2b95575746c740000a74b8c86f00dee0eaa347a474ac75df6a1744c4153b',
      '0831748930e327050e041c3ab68675c0525cc13b40f33b463863f1da7ce6bc3b',
      'f254c4f434c27fd6e7f8263272713d37400ced056c85d297c246dd88ad23dce5',
    ]),
  ],
]);

let args;
try {
  args = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  printHelp();
  process.exit(1);
}
if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.projectTarget) {
  console.error('Missing required --project <path>. Ambient project state is not accepted.');
  printHelp();
  process.exit(1);
}

const projectRoot = path.resolve(args.projectTarget);
const projectStats = await stat(projectRoot).catch(() => null);
if (!projectStats?.isDirectory()) {
  console.error(`Project folder does not exist: ${projectRoot}`);
  process.exit(1);
}

const configPath = path.join(projectRoot, '.workbench', 'workbench.config.json');
const config = await readJson(configPath).catch((error) => {
  console.error(`Cannot read Workbench project config at ${configPath}: ${error.message}`);
  process.exit(1);
});
if (config?.workbench?.app !== 'workbench-v1') {
  console.error(`The target is not a Workbench V1 project: ${projectRoot}`);
  process.exit(1);
}

const templateId = config?.extensions?.projectTemplate?.id ?? 'standard';
const generatedFiles = new Map(createWorkbenchProjectGuideFiles({ templateId }));
const plan = [];

for (const relativePath of MANAGED_GUIDANCE_PATHS) {
  const expected = generatedFiles.get(relativePath);
  if (typeof expected !== 'string') {
    console.error(`Template ${templateId} did not generate ${relativePath}.`);
    process.exit(1);
  }
  const absolutePath = resolveProjectPath(projectRoot, relativePath);
  const existing = await readFile(absolutePath, 'utf8').catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  plan.push(SEED_ONLY_GUIDANCE_PATHS.has(relativePath)
    ? classifySeedOnlyGuidanceFile({ absolutePath, existing, expected, relativePath })
    : classifyGuidanceFile({
        absolutePath,
        existing,
        expected,
        force: args.force,
        relativePath,
      }));
}

printPlan({ args, plan, projectRoot, templateId });
const conflicts = plan.filter((item) => item.action === 'conflict');
if (conflicts.length > 0) {
  console.error('No files were written. Re-run with --force only after reviewing the conflicting files.');
  process.exitCode = 2;
} else if (args.write) {
  const changed = plan.filter((item) => item.action !== 'unchanged');
  const overwritten = changed.filter((item) => item.existing !== null);
  let backupRoot = null;
  if (overwritten.length > 0) {
    backupRoot = path.join(
      projectRoot,
      '.workbench',
      'guidance-backups',
      `${timestampForPath(new Date())}-${process.pid}`,
    );
    await writeBackups({ backupRoot, items: overwritten, projectRoot, templateId });
  }
  for (const item of changed) {
    await writeFileAtomic(item.absolutePath, item.expected);
  }
  console.log(`Applied ${changed.length} guidance change(s).`);
  if (backupRoot) console.log(`Backup: ${backupRoot}`);
} else {
  console.log('Dry run only. Re-run with --write to apply this plan.');
}

function parseArguments(values) {
  const parsed = { force: false, help: false, projectTarget: null, write: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--help' || value === '-h') {
      parsed.help = true;
    } else if (value === '--write') {
      parsed.write = true;
    } else if (value === '--force') {
      parsed.force = true;
    } else if (value === '--project') {
      const target = values[index + 1];
      if (!target || target.startsWith('--')) {
        throw new Error('--project requires a path.');
      }
      if (parsed.projectTarget) {
        throw new Error('Only one explicit --project path is allowed per run.');
      }
      parsed.projectTarget = target;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return parsed;
}

function printHelp() {
  console.log([
    'Usage:',
    '  npm run workbench:sync-project-guidance -- --project <path> [--write] [--force]',
    '',
    'Behavior:',
    '  default   Dry-run an explicitly named Workbench project.',
    '  --write   Apply missing and recognized generated-guidance updates.',
    '  --force   Replace unrecognized conflicts too; overwritten files are backed up.',
  ].join('\n'));
}

function classifyGuidanceFile({ absolutePath, existing, expected, force, relativePath }) {
  if (existing === null) {
    return { action: 'create', absolutePath, existing, expected, reason: 'missing', relativePath };
  }
  if (existing === expected) {
    return { action: 'unchanged', absolutePath, existing, expected, reason: 'current', relativePath };
  }
  const legacyHashes = LEGACY_GENERATED_HASHES.get(relativePath);
  if (legacyHashes?.has(hashNormalizedGuidance(existing))) {
    return { action: 'update', absolutePath, existing, expected, reason: 'recognized generated version', relativePath };
  }
  return {
    action: force ? 'replace' : 'conflict',
    absolutePath,
    existing,
    expected,
    reason: force ? 'forced replacement' : 'unrecognized existing content',
    relativePath,
  };
}

function classifySeedOnlyGuidanceFile({ absolutePath, existing, expected, relativePath }) {
  if (existing === null) {
    return { action: 'create', absolutePath, existing, expected, reason: 'missing public-safe context seed', relativePath };
  }
  return {
    action: 'unchanged',
    absolutePath,
    existing,
    expected: existing,
    reason: 'project-owned curated context',
    relativePath,
  };
}

function hashNormalizedGuidance(source) {
  const normalized = source
    .replace(/^Template: .*$/m, 'Template: <template>.')
    .replace(/^(?:AGENTS|CLAUDE)\.md should stay thin\./m, 'ENTRYPOINT.md should stay thin.');
  return createHash('sha256').update(normalized).digest('hex');
}

function printPlan({ args: parsed, plan: items, projectRoot: root, templateId: template }) {
  console.log(`Workbench project guidance ${parsed.write ? 'write' : 'dry-run'}`);
  console.log(`Project: ${root}`);
  console.log(`Template: ${template}`);
  for (const item of items) {
    console.log(`- ${item.action.padEnd(9)} ${item.relativePath} (${item.reason})`);
  }
  const counts = new Map();
  for (const item of items) {
    counts.set(item.action, (counts.get(item.action) ?? 0) + 1);
  }
  console.log([
    'Summary:',
    `create=${counts.get('create') ?? 0}`,
    `update=${counts.get('update') ?? 0}`,
    `replace=${counts.get('replace') ?? 0}`,
    `conflict=${counts.get('conflict') ?? 0}`,
    `unchanged=${counts.get('unchanged') ?? 0}`,
  ].join(' '));
}

async function writeBackups({ backupRoot, items, projectRoot: root, templateId: template }) {
  const manifest = {
    createdAt: new Date().toISOString(),
    projectRoot: root,
    templateId: template,
    files: items.map((item) => ({
      path: item.relativePath,
      previousSha256: createHash('sha256').update(item.existing).digest('hex'),
    })),
  };
  for (const item of items) {
    const backupPath = path.join(backupRoot, item.relativePath);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await writeFile(backupPath, item.existing, 'utf8');
  }
  await writeFile(
    path.join(backupRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

async function writeFileAtomic(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.workbench-sync-${process.pid}-${Date.now()}`,
  );
  try {
    await writeFile(temporaryPath, contents, 'utf8');
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => {});
  }
}

function resolveProjectPath(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Guidance path escapes the project root: ${relativePath}`);
  }
  return resolved;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function timestampForPath(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}
