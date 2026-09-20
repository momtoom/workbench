#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createWorkbenchProjectGuideFiles,
  WORKBENCH_AGENT_SKILLS_DIR,
  WORKBENCH_CLAUDE_SKILLS_DIR,
  WORKBENCH_COMPONENT_AGENT_GUIDE_FILE,
  WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE,
  WORKBENCH_PROJECT_AGENT_GUIDE_FILE,
  WORKBENCH_PROJECT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
  WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL,
  WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
} from './workbench-template.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedSkillsRoot = path.join(repoRoot, '.agents', 'skills');
const claudeSkillsRoot = path.join(repoRoot, '.claude', 'skills');
const registryGuardPath = path.join(
  repoRoot,
  '.claude',
  'hooks',
  'guard-workbench-registry-edits.mjs',
);
const sessionGuardPath = path.join(
  repoRoot,
  '.claude',
  'hooks',
  'guard-workbench-session-artifacts.mjs',
);

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function read(relativePath) {
  return readFile(path.join(repoRoot, relativePath), 'utf8');
}

async function fileExists(relativePath) {
  try {
    await readFile(path.join(repoRoot, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function frontmatterName(source) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return frontmatter?.[1].match(/^name:\s*(.+?)\s*$/m)?.[1] ?? null;
}

function openAiSkillMetadata(source) {
  return {
    displayName: source.match(/^\s*display_name:\s*"([^"]+)"\s*$/m)?.[1] ?? '',
    shortDescription: source.match(/^\s*short_description:\s*"([^"]+)"\s*$/m)?.[1] ?? '',
    defaultPrompt: source.match(/^\s*default_prompt:\s*"([^"]+)"\s*$/m)?.[1] ?? '',
    implicitInvocation: source.match(/^\s*allow_implicit_invocation:\s*(true|false)\s*$/m)?.[1] ?? 'true',
  };
}

function markdownHeadings(source) {
  return new Set(
    [...source.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => match[1]),
  );
}

function routedMarkdownHeadings(skillSource) {
  const routes = [];
  let currentDocument = null;
  const requiredReading =
    skillSource.split('## Required Reading\n')[1]?.split(/\n## /)[0] ?? '';
  for (const line of requiredReading.split(/\r?\n/)) {
    const documentMatch = line.match(/^- `([^`]+\.md)`/);
    if (documentMatch) {
      currentDocument = documentMatch[1];
      continue;
    }
    const headingMatch = line.match(/^  - (.+?)\s*$/);
    if (!currentDocument || !headingMatch) continue;
    routes.push({
      documentPath: currentDocument,
      heading: headingMatch[1].replace(/\s+\([^)]*\)\s*$/, ''),
    });
  }
  return routes;
}

async function skillDirectoryNames(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await readFile(path.join(root, entry.name, 'SKILL.md'), 'utf8');
      names.push(entry.name);
    } catch {
      // Directories without SKILL.md are not skill packages.
    }
  }
  return names.sort();
}

async function filesUnder(root) {
  const files = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

function runGuard(guardPath, event, label) {
  const result = spawnSync(process.execPath, [guardPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    input: JSON.stringify(event),
  });
  check(
    result.status === 0,
    `${label} exited with ${result.status}: ${result.stderr.trim()}`,
  );
  if (!result.stdout.trim()) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    failures.push(`${label} returned invalid JSON: ${result.stdout.trim()}`);
    return null;
  }
}

function runRegistryGuard(toolInput) {
  return runGuard(registryGuardPath, { tool_input: toolInput }, 'registry guard');
}

function runSessionGuard(command, cwd) {
  return runGuard(
    sessionGuardPath,
    { cwd, tool_input: { command } },
    'session-artifact guard',
  );
}

function isDenied(result) {
  return result?.hookSpecificOutput?.permissionDecision === 'deny';
}

const sharedSkillNames = await skillDirectoryNames(sharedSkillsRoot);
const claudeSkillNames = await skillDirectoryNames(claudeSkillsRoot);
const legacyCodexSkillFiles = await filesUnder(
  path.join(repoRoot, 'codex-skills'),
);

check(
  JSON.stringify(claudeSkillNames) === JSON.stringify(sharedSkillNames),
  `Claude skill wrappers do not match shared skills.\nshared: ${sharedSkillNames.join(', ')}\nclaude: ${claudeSkillNames.join(', ')}`,
);
check(
  legacyCodexSkillFiles.length === 0,
  `legacy codex-skills files were reintroduced: ${legacyCodexSkillFiles.map((file) => path.relative(repoRoot, file)).join(', ')}`,
);
check(
  !(await fileExists('workbench-template.mjs')),
  'legacy root workbench-template.mjs was reintroduced; scripts/workbench-template.mjs is canonical',
);
const vercelDeploySource = await read('scripts/deploy-workbench-vercel.mjs');
check(
  !vercelDeploySource.includes("  'workbench-template.mjs',"),
  'Vercel staging still includes the removed root template copy',
);

for (const skillName of sharedSkillNames) {
  const sharedSource = await read(`.agents/skills/${skillName}/SKILL.md`);
  const metadataSource = await read(`.agents/skills/${skillName}/agents/openai.yaml`);
  const wrapperSource = await read(`.claude/skills/${skillName}/SKILL.md`);
  const metadata = openAiSkillMetadata(metadataSource);
  check(
    frontmatterName(sharedSource) === skillName,
    `shared skill ${skillName} has a mismatched frontmatter name`,
  );
  check(
    frontmatterName(wrapperSource) === skillName,
    `Claude wrapper ${skillName} has a mismatched frontmatter name`,
  );
  check(
    wrapperSource.includes(`../../../.agents/skills/${skillName}/SKILL.md`),
    `Claude wrapper ${skillName} does not point to its shared skill`,
  );
  check(
    wrapperSource.includes('completely before acting'),
    `Claude wrapper ${skillName} does not require the shared skill to be read completely`,
  );
  check(
    metadata.displayName.length > 0 && metadata.shortDescription.length > 0,
    `Codex metadata for ${skillName} is missing display_name or short_description`,
  );
  check(
    metadata.implicitInvocation === 'true',
    `repository skill ${skillName} unexpectedly disables implicit invocation`,
  );
}

const agentsSource = await read('AGENTS.md');
const claudeSource = await read('CLAUDE.md');
for (const [label, source] of [
  ['AGENTS.md', agentsSource],
  ['CLAUDE.md', claudeSource],
]) {
  check(
    source.includes('Load context through skills, not by reading every guide.'),
    `${label} is missing the skill-routing rule`,
  );
  check(
    !source.includes('Before non-trivial Workbench V1 work, read:'),
    `${label} reintroduced unconditional guide preloading`,
  );
  check(
    sharedSkillNames.every((skillName) => source.includes(`\`${skillName}\``)),
    `${label} does not route through every repository skill`,
  );
}
check(
  agentsSource.includes('Repository `.agents/skills` definitions are canonical') &&
    agentsSource.includes('same-named user skill'),
  'AGENTS.md does not resolve duplicate repository/user Workbench skill names',
);

const entrySkillSource = await read(
  '.agents/skills/workbench-v1-agent-workflow/SKILL.md',
);
check(
  entrySkillSource.includes('## Context Routing') &&
    entrySkillSource.includes('Do not reopen `AGENTS.md`/`CLAUDE.md` or preload') &&
    entrySkillSource.includes('npm run workbench:check-guidance') &&
    entrySkillSource.includes('npm run test:gestures') &&
    entrySkillSource.includes('`Option/Alt+click` or `Option/Alt+drag`') &&
    entrySkillSource.includes('Unmodified pointer input belongs to') &&
    entrySkillSource.includes('## Curated Organizational Context') &&
    entrySkillSource.includes('raw chats, personal AI memory'),
  'entry skill no longer keeps startup context routed and bounded',
);

const agentGuideSource = await read('docs/WORKBENCH-V1-AGENT-GUIDE.md');
const organizationalContextSource = await read('docs/WORKBENCH-V1-ORGANIZATIONAL-CONTEXT.md');
check(
  organizationalContextSource.includes('Audience: public') &&
    organizationalContextSource.includes('Status: curated') &&
    organizationalContextSource.includes('## Disclosure policy') &&
    organizationalContextSource.includes('## Decision rationale') &&
    organizationalContextSource.includes('## Known limitations') &&
    organizationalContextSource.includes('## Improvement priorities') &&
    organizationalContextSource.includes('Do not expose sensitive internal history'),
  'repository organizational context is missing its public-safe knowledge contract',
);
for (const phrase of [
  'Two-dimensional (wrapping) containers are addressed by SLOT',
  'Clearing a drop projection mid-gesture glides',
  'Cmd+click selection has more than one committing handler',
]) {
  const count = agentGuideSource.split(phrase).length - 1;
  check(count === 1, `expected one copy of "${phrase}", found ${count}`);
}

const previewSkillSource = await read(
  '.agents/skills/workbench-preview-runtime/SKILL.md',
);
check(
  previewSkillSource.includes('cssClassEffectiveness.ts') &&
    previewSkillSource.includes('previewWheelGesture.ts') &&
    previewSkillSource.includes('`Option/Alt+click` or `Option/Alt+drag`'),
  'preview skill does not route to the shared CSS and wheel diagnostics',
);

for (const skillName of sharedSkillNames) {
  const skillSource = await read(`.agents/skills/${skillName}/SKILL.md`);
  for (const { documentPath, heading } of routedMarkdownHeadings(skillSource)) {
    const headings = markdownHeadings(await read(documentPath));
    check(
      headings.has(heading),
      `${skillName} references missing heading "${heading}" in ${documentPath}`,
    );
  }
}

const designSkillSource = await read(
  '.agents/skills/workbench-design-authoring/SKILL.md',
);
check(
  designSkillSource.includes('workbench:check-authoring'),
  'design authoring skill does not name the authoring contract check',
);
check(
  designSkillSource.includes('Reference intent gate')
    && designSkillSource.includes('referenceAnalysis.implementationMode')
    && designSkillSource.includes('exact-conversion')
    && designSkillSource.includes('adapt-to-project')
    && designSkillSource.includes('agent-may-assume` does not bypass'),
  'design authoring skill does not block ambiguous supplied-reference intent before writing',
);

const lifecycleApprovalPhrases = [
  'Source Lifecycle Approval Gate',
  'catalog, redesign, editability',
  'Workbench history, Git history',
  'generated output',
  'stop before writing',
];
for (const [label, source] of [
  ['entry workflow skill', entrySkillSource],
  ['design authoring skill', designSkillSource],
  ['component authoring skill', await read('.agents/skills/workbench-component-authoring/SKILL.md')],
  ['shared agent guide', agentGuideSource],
  ['component authoring guide', await read('docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md')],
]) {
  const normalizedSource = source.replace(/\s+/g, ' ');
  check(
    lifecycleApprovalPhrases.every((phrase) => normalizedSource.includes(phrase)),
    `${label} is missing the source-lifecycle approval hard stop`,
  );
}

const gatewaySource = await read(
  'docs/WORKBENCH-V1-STRUCTURED-AUTHORING-GATEWAY.md',
);
check(
  gatewaySource.includes('## When to use it') &&
    gatewaySource.includes('not the exclusive source-editing path'),
  'authoring gateway policy does not distinguish protected and direct editing paths',
);

for (const templateId of ['standard', 'shadcn-base', 'astryx']) {
  const generatedFiles = new Map(
    createWorkbenchProjectGuideFiles({ templateId }),
  );
  const generatedSkillNames = [
    WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL,
    WORKBENCH_PROJECT_AUTHORING_SKILL,
    WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL,
    WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL,
  ];
  const generatedSkillPath =
    `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`;
  const generatedClaudeWrapperPath =
    `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`;
  const generatedSkill = generatedFiles.get(generatedSkillPath) ?? '';
  const generatedClaudeWrapper =
    generatedFiles.get(generatedClaudeWrapperPath) ?? '';
  const organizationalContext =
    generatedFiles.get(WORKBENCH_ORGANIZATIONAL_CONTEXT_FILE) ?? '';
  check(
    generatedSkill.includes('workbench_inspect_design_context') &&
      generatedSkill.includes('explicit `projectTarget`') &&
      generatedSkill.includes('responseProfile: "full"') &&
      generatedSkill.includes('direct source editing remains valid') &&
      generatedSkill.includes('Reference Intent Gate') &&
      generatedSkill.includes('referenceAnalysis.implementationMode') &&
      generatedSkill.includes('exact-conversion') &&
      generatedSkill.includes('adapt-to-project'),
    `${templateId} generated design skill is missing the current MCP/direct-editing policy`,
  );
  check(
    organizationalContext.includes('Audience: public') &&
      organizationalContext.includes('Status: curated') &&
      organizationalContext.includes('## Disclosure policy') &&
      organizationalContext.includes('## Known limitations') &&
      organizationalContext.includes('## Lessons learned') &&
      organizationalContext.includes('## Improvement priorities') &&
      organizationalContext.includes('raw conversations') &&
      organizationalContext.includes('private repository history'),
    `${templateId} generated organizational context is missing its public-safe knowledge contract`,
  );
  check(
    generatedClaudeWrapper.includes('visual-design capability') &&
      generatedClaudeWrapper.includes(
        '../../../.agents/skills/workbench-design-authoring/SKILL.md',
      ),
    `${templateId} generated Claude wrapper is missing the current shared-skill route`,
  );
  const generatedLifecycleSources = [
    ['design authoring skill', generatedSkill],
    ['project authoring skill', generatedFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_AUTHORING_SKILL}/SKILL.md`) ?? ''],
    ['component authoring skill', generatedFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL}/SKILL.md`) ?? ''],
    ['project guide', generatedFiles.get(WORKBENCH_PROJECT_AGENT_GUIDE_FILE) ?? ''],
    ['component guide', generatedFiles.get(WORKBENCH_COMPONENT_AGENT_GUIDE_FILE) ?? ''],
  ];
  for (const [label, source] of generatedLifecycleSources) {
    const normalizedSource = source.replace(/\s+/g, ' ');
    check(
      lifecycleApprovalPhrases.every((phrase) => normalizedSource.includes(phrase)),
      `${templateId} generated ${label} is missing the source-lifecycle approval hard stop`,
    );
  }
  for (const skillName of generatedSkillNames) {
    const sharedPath =
      `${WORKBENCH_AGENT_SKILLS_DIR}/${skillName}/SKILL.md`;
    const claudePath =
      `${WORKBENCH_CLAUDE_SKILLS_DIR}/${skillName}/SKILL.md`;
    const sharedSkill = generatedFiles.get(sharedPath) ?? '';
    const claudeWrapper = generatedFiles.get(claudePath) ?? '';
    const metadata = openAiSkillMetadata(
      generatedFiles.get(`${WORKBENCH_AGENT_SKILLS_DIR}/${skillName}/agents/openai.yaml`) ?? '',
    );
    check(
      frontmatterName(sharedSkill) === skillName,
      `${templateId} generated shared skill ${skillName} is missing or misnamed`,
    );
    check(
      frontmatterName(claudeWrapper) === skillName &&
        claudeWrapper.includes(`../../../.agents/skills/${skillName}/SKILL.md`) &&
        claudeWrapper.includes('completely before acting'),
      `${templateId} generated Claude wrapper ${skillName} is missing or does not delegate to the shared skill`,
    );
    check(
      metadata.displayName.length > 0 &&
        metadata.shortDescription.length > 0 &&
        metadata.defaultPrompt.includes(`$${skillName}`) &&
        metadata.implicitInvocation === 'true',
      `${templateId} generated Codex metadata for ${skillName} is incomplete`,
    );
  }
  for (const entrypointName of ['AGENTS.md', 'CLAUDE.md']) {
    const entrypoint = generatedFiles.get(entrypointName) ?? '';
    check(
      entrypoint.includes(
        'Load context through project skills, not by reading every guide:',
      ) &&
        !entrypoint.includes('Before non-trivial work, read:') &&
        generatedSkillNames.every((skillName) =>
          entrypoint.includes(`\`${skillName}\``)),
      `${templateId} generated ${entrypointName} does not route through all project skills`,
    );
  }
}

const directWrite = runRegistryGuard({
  file_path: 'projects/example/.workbench/components.json',
});
check(isDenied(directWrite), 'registry guard allowed a direct file write');

const readOnlyShell = runRegistryGuard({
  command: 'cat projects/example/.workbench/components.json',
});
check(!isDenied(readOnlyShell), 'registry guard denied a read-only shell command');

const pythonWrite = runRegistryGuard({
  command:
    'python3 -c "open(\'projects/example/.workbench/components.json\', \'w\').write(\'{}\')"',
});
check(isDenied(pythonWrite), 'registry guard allowed an inline Python write');

const rubyWrite = runRegistryGuard({
  command:
    'ruby -e "File.write(\'projects/example/.workbench/prop-registry.json\', \'{}\')"',
});
check(isDenied(rubyWrite), 'registry guard allowed an inline Ruby write');

for (const [label, command] of [
  [
    'dd',
    'dd if=/tmp/components.json of=projects/example/.workbench/components.json',
  ],
  [
    'install',
    'install -m 644 /tmp/components.json projects/example/.workbench/components.json',
  ],
  [
    'patch',
    'patch projects/example/.workbench/components.json < /tmp/registry.diff',
  ],
  [
    'sponge',
    'jq . projects/example/.workbench/components.json | sponge projects/example/.workbench/components.json',
  ],
]) {
  check(
    isDenied(runRegistryGuard({ command })),
    `registry guard allowed a ${label} write`,
  );
}

const gitCheckoutRestore = runRegistryGuard({
  command:
    'git checkout HEAD -- projects/example/.workbench/components.json',
});
check(
  !isDenied(gitCheckoutRestore),
  'registry guard denied an intentional git checkout restore',
);

const benignPython = runRegistryGuard({
  command:
    'python3 -c "print(\'projects/example/.workbench/components.json\')"',
});
check(!isDenied(benignPython), 'registry guard denied a read-only Python command');

for (const [label, command] of [
  [
    'awk-inplace',
    "awk -i inplace '{sub(/a/,\"b\")}1' projects/example/.workbench/components.json",
  ],
  ['ex', "ex -sc '%s/old/new/g|x' projects/example/.workbench/components.json"],
  ['ed', 'ed -s projects/example/.workbench/components.json'],
  ['rsync', 'rsync /tmp/components.json projects/example/.workbench/components.json'],
  ['ln', 'ln -sf /tmp/components.json projects/example/.workbench/components.json'],
  [
    'noclobber-override redirect',
    'jq . /tmp/x.json >| projects/example/.workbench/components.json',
  ],
  [
    'ruby IO.write',
    'ruby -e "IO.write(\'projects/example/.workbench/prop-registry.json\', \'{}\')"',
  ],
  [
    'python r+ mode',
    'python3 -c "open(\'projects/example/.workbench/components.json\', \'r+\').write(\'x\')"',
  ],
]) {
  check(
    isDenied(runRegistryGuard({ command })),
    `registry guard allowed a ${label} write`,
  );
}
check(
  !isDenied(runRegistryGuard({
    command: "awk '{print}' projects/example/.workbench/components.json",
  })),
  'registry guard denied a read-only awk command',
);

const neutralityTargets = [
  ['AGENTS.md', agentsSource],
  ['CLAUDE.md', claudeSource],
  ['shared agent guide', agentGuideSource],
];
for (const skillName of sharedSkillNames) {
  neutralityTargets.push([
    `shared skill ${skillName}`,
    await read(`.agents/skills/${skillName}/SKILL.md`),
  ]);
}
for (const [label, source] of neutralityTargets) {
  check(
    !source.includes('WORKBENCH-V1-CODEX-'),
    `${label} references a renamed WORKBENCH-V1-CODEX-* document`,
  );
  check(
    !/Use when Codex/i.test(source),
    `${label} gates an agent trigger on Codex; keep triggers agent-neutral`,
  );
}
for (const templateId of ['standard', 'shadcn-base', 'astryx']) {
  for (const [relativePath, contents] of createWorkbenchProjectGuideFiles({
    templateId,
  })) {
    if (!relativePath.endsWith('SKILL.md')) continue;
    check(
      !/Use when Codex/i.test(contents),
      `${templateId} generated ${relativePath} gates its trigger on Codex`,
    );
  }
}

check(
  agentGuideSource.includes('### Commit Scope And Session Artifacts') &&
    agentGuideSource.includes('WORKBENCH_PERSIST_SESSION_STATE=1'),
  'shared agent guide is missing the session-artifact commit-scope rule',
);

const mcpConfig = JSON.parse(await read('.mcp.json'));
check(
  mcpConfig?.mcpServers?.workbench?.command === 'node' &&
    (mcpConfig?.mcpServers?.workbench?.args ?? [])
      .includes('scripts/workbench-authoring-mcp.mjs'),
  '.mcp.json does not register the workbench authoring MCP server for Claude Code',
);

const claudeSettings = JSON.parse(await read('.claude/settings.json'));
check(
  claudeSettings.enableAllProjectMcpServers === true,
  '.claude/settings.json does not auto-enable the project MCP server',
);
const preToolUseHooks = claudeSettings?.hooks?.PreToolUse ?? [];
const hookCommandsFor = (matcher) =>
  preToolUseHooks
    .filter((entry) => entry.matcher === matcher)
    .flatMap((entry) => entry.hooks ?? [])
    .map((hook) => hook.command ?? '');
check(
  hookCommandsFor('Edit|Write|MultiEdit')
    .some((command) => command.includes('guard-workbench-registry-edits.mjs')),
  'Claude settings do not run the registry guard for file-edit tools',
);
check(
  hookCommandsFor('Bash')
    .some((command) => command.includes('guard-workbench-registry-edits.mjs')),
  'Claude settings do not run the registry guard for Bash',
);
check(
  hookCommandsFor('Bash')
    .some((command) => command.includes('guard-workbench-session-artifacts.mjs')),
  'Claude settings do not run the session-artifact guard for Bash',
);
const allowRules = claudeSettings?.permissions?.allow ?? [];
for (const rule of [
  'Bash(npm run check)',
  'Bash(npm run build)',
  'Bash(npm run workbench:check-guidance)',
  'Bash(npm run workbench:check-design)',
  'Bash(npm run test:gestures)',
]) {
  check(
    allowRules.includes(rule),
    `Claude settings no longer pre-approve the check loop entry ${rule}`,
  );
}
const askRules = claudeSettings?.permissions?.ask ?? [];
for (const rule of [
  'Bash(git push:*)',
  'Bash(npm run deploy:vercel)',
  'Bash(npm run figma:publish)',
]) {
  check(
    askRules.includes(rule),
    `Claude settings no longer gate the outward command ${rule} behind ask`,
  );
}

const sessionFixtureRoot = await mkdtemp(
  path.join(tmpdir(), 'workbench-session-guard-'),
);
try {
  const fixtureGit = (...args) =>
    spawnSync('git', args, { cwd: sessionFixtureRoot, encoding: 'utf8' });
  fixtureGit('init', '-q');
  fixtureGit('config', 'user.email', 'guard@workbench.test');
  fixtureGit('config', 'user.name', 'Workbench Guard Check');
  await mkdir(path.join(sessionFixtureRoot, '.workbench'), { recursive: true });
  await mkdir(
    path.join(sessionFixtureRoot, 'projects/demo proj/.workbench'),
    { recursive: true },
  );
  await mkdir(path.join(sessionFixtureRoot, 'src'), { recursive: true });
  const writeFixture = (relativePath, contents) =>
    writeFile(path.join(sessionFixtureRoot, relativePath), contents, 'utf8');
  await writeFixture('.workbench/selection.json', '{}');
  await writeFixture('projects/demo proj/.workbench/selection.json', '{}');
  await writeFixture('src/app.ts', 'export {};\n');
  fixtureGit('add', '-A');
  fixtureGit('commit', '-qm', 'seed');

  check(
    !isDenied(runSessionGuard('git add -A', sessionFixtureRoot)),
    'session guard denied a broad add in a clean tree',
  );

  await writeFixture('.workbench/selection.json', '{"dirty":true}');
  await writeFixture(
    'projects/demo proj/.workbench/selection.json',
    '{"dirty":true}',
  );
  await writeFixture('src/app.ts', 'export const changed = true;\n');

  for (const [label, command] of [
    ['broad add', 'git add -A'],
    ['dot add', 'git add .'],
    ['commit -a', 'git commit -am "wip"'],
    ['parent-directory add', 'git add projects'],
    ['explicit artifact add', 'git add .workbench/selection.json'],
    ['mixed explicit add', 'git add src/app.ts .workbench/selection.json'],
  ]) {
    check(
      isDenied(runSessionGuard(command, sessionFixtureRoot)),
      `session guard allowed a ${label} that captures dirty session artifacts`,
    );
  }
  for (const [label, command] of [
    ['scoped file add', 'git add src/app.ts'],
    ['pathspec-limited broad add', 'git add -A -- src'],
    ['plain commit of staged work', 'git commit -m "already staged"'],
    [
      'exclude-pathspec add',
      "git add -A -- . ':(exclude)**/.workbench/selection.json'",
    ],
    [
      'user-authorized persistence',
      'WORKBENCH_PERSIST_SESSION_STATE=1 git add -A',
    ],
    ['read-only git command', 'git status'],
  ]) {
    check(
      !isDenied(runSessionGuard(command, sessionFixtureRoot)),
      `session guard denied a legitimate ${label}`,
    );
  }
} finally {
  await rm(sessionFixtureRoot, { force: true, recursive: true });
}

if (failures.length > 0) {
  console.error('Workbench agent guidance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Workbench agent guidance check passed (${sharedSkillNames.length} repository skills, 3 project templates, Claude wrappers, MCP registration, and guard hooks).`,
);
