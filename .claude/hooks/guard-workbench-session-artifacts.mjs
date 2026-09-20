#!/usr/bin/env node

// Blocks git staging/commit commands that would capture Workbench session
// artifacts (selection, handoff, workspace-state files). Those files change as
// a side effect of opening the app or verifying in the browser and must stay
// out of commits unless the user explicitly asks to persist session state.
// Escape hatch for that explicit request: prefix the command with
// WORKBENCH_PERSIST_SESSION_STATE=1.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Save points are a directory of whole source copies rather than one json file,
// so they match on the directory prefix instead of a file name.
const SESSION_ARTIFACT_RE =
  /(?:^|\/)\.workbench\/(?:(?:selection|codex-design-handoff|codex-component-library-handoff|workspace-state|history|dev-server-project)\.json|save-points(?:\/|$))/i;
const OVERRIDE_TOKEN = 'WORKBENCH_PERSIST_SESSION_STATE=1';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let decision = null;
  try {
    const event = JSON.parse(input || '{}');
    decision = evaluate(event);
  } catch {
    process.exit(0);
  }
  if (!decision) process.exit(0);
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: decision,
    },
  })}\n`);
});

function evaluate(event) {
  const command = typeof event?.tool_input?.command === 'string'
    ? event.tool_input.command
    : '';
  if (!command || command.includes(OVERRIDE_TOKEN)) return null;
  const cwd = typeof event?.cwd === 'string' && event.cwd ? event.cwd : process.cwd();
  for (const segment of splitShellSegments(command)) {
    const invocation = parseGitInvocation(segment);
    if (!invocation) continue;
    const reason = evaluateInvocation(invocation, cwd);
    if (reason) return reason;
  }
  return null;
}

function evaluateInvocation(invocation, baseCwd) {
  const excludeSpecs = invocation.pathspecs.filter(isExcludePathspec);
  const includeSpecs = invocation.pathspecs.filter(
    (spec) => !isExcludePathspec(spec),
  );
  const explicit = includeSpecs.find((spec) =>
    SESSION_ARTIFACT_RE.test(normalizePathspec(spec)));
  if (explicit) return denyReason([explicit]);
  if (excludeSpecs.some((spec) => normalizePathspec(spec).includes('.workbench'))) {
    return null;
  }

  const gitCwd = invocation.chdir
    ? path.resolve(baseCwd, invocation.chdir)
    : baseCwd;
  const dirty = dirtySessionArtifacts(gitCwd);
  if (dirty.length === 0) return null;

  if (includeSpecs.length > 0) {
    const rootPrefix = repoRelativePrefix(gitCwd);
    const covered = dirty.filter((artifact) =>
      includeSpecs.some((spec) =>
        pathspecCoversArtifact(spec, rootPrefix, artifact)));
    return covered.length > 0 ? denyReason(covered) : null;
  }
  return invocation.broad ? denyReason(dirty) : null;
}

function isExcludePathspec(spec) {
  return spec.startsWith(':!') ||
    /^:\((?:[^)]*,)?exclude(?:,[^)]*)?\)/.test(spec);
}

function denyReason(artifacts) {
  return [
    `Staging Workbench session artifacts is blocked: ${artifacts.join(', ')}.`,
    'selection/handoff/workspace-state files are local session state written while the app or browser preview runs, not product changes',
    '(docs/WORKBENCH-V1-AGENT-GUIDE.md, Commit Scope And Session Artifacts).',
    'Stage explicit paths that exclude them, or restore their changes first.',
    `Only when the user explicitly asked to persist session state, re-run the command prefixed with ${OVERRIDE_TOKEN}.`,
  ].join(' ');
}

function splitShellSegments(command) {
  const segments = [];
  let current = '';
  let quote = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote) {
      current += char;
      if (char === quote && command[index - 1] !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ';' || char === '&' || char === '|' || char === '\n') {
      segments.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments.map((segment) => segment.trim()).filter(Boolean);
}

function tokenize(segment) {
  const tokens = [];
  let current = '';
  let quote = null;
  for (let index = 0; index < segment.length; index += 1) {
    const char = segment[index];
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function parseGitInvocation(segment) {
  const tokens = tokenize(segment);
  let index = 0;
  while (
    index < tokens.length &&
    (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index]) ||
      tokens[index] === 'command' ||
      tokens[index] === 'env')
  ) {
    index += 1;
  }
  if (index >= tokens.length) return null;
  if (path.basename(tokens[index]) !== 'git') return null;
  index += 1;

  let chdir = null;
  while (index < tokens.length && tokens[index].startsWith('-')) {
    const token = tokens[index];
    if (token === '-C') {
      chdir = tokens[index + 1] ?? null;
      index += 2;
      continue;
    }
    if (token === '-c' || token === '--git-dir' || token === '--work-tree') {
      index += 2;
      continue;
    }
    index += 1;
  }
  const subcommand = tokens[index];
  if (subcommand !== 'add' && subcommand !== 'stage' && subcommand !== 'commit') {
    return null;
  }
  index += 1;

  const valueFlags = new Set([
    '--message', '--file', '--author', '--date', '--template', '--chmod',
    '--reuse-message', '--reedit-message', '--fixup', '--squash', '--trailer',
    '--cleanup', '--pathspec-from-file',
  ]);
  const pathspecs = [];
  let broad = false;
  let afterDoubleDash = false;
  for (; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!afterDoubleDash && token === '--') {
      afterDoubleDash = true;
      continue;
    }
    if (!afterDoubleDash && token.startsWith('--')) {
      const [flag] = token.split('=', 1);
      if (flag === '--all' || flag === '--update') broad = true;
      if (flag === '--pathspec-from-file') broad = true;
      if (valueFlags.has(flag) && !token.includes('=')) index += 1;
      continue;
    }
    if (!afterDoubleDash && token.startsWith('-') && token.length > 1) {
      if (subcommand === 'add' && /[Au]/.test(token.slice(1))) broad = true;
      if (subcommand === 'commit' && /a/.test(token.slice(1))) broad = true;
      if (/[mFCc]$/.test(token)) index += 1;
      continue;
    }
    pathspecs.push(token);
  }
  return { broad, chdir, pathspecs, subcommand };
}

function normalizePathspec(spec) {
  return spec.replace(/^:\([^)]*\)/, '').replace(/\\/g, '/');
}

function pathspecCoversArtifact(spec, rootPrefix, artifact) {
  let normalized = normalizePathspec(spec);
  if (normalized.startsWith(':')) return true;
  const globIndex = normalized.search(/[*?[]/);
  if (globIndex >= 0) normalized = normalized.slice(0, globIndex);
  const rootRelative = path.posix
    .normalize(path.posix.join(rootPrefix, normalized))
    .replace(/^\.$/, '')
    .replace(/\/+$/, '');
  if (rootRelative === '' || rootRelative === '.') return true;
  return artifact === rootRelative || artifact.startsWith(`${rootRelative}/`);
}

function repoRelativePrefix(gitCwd) {
  const result = spawnSync('git', ['rev-parse', '--show-prefix'], {
    cwd: gitCwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function dirtySessionArtifacts(gitCwd) {
  const globs = [
    ...[
      'selection', 'codex-design-handoff', 'codex-component-library-handoff',
      'workspace-state', 'history', 'dev-server-project',
    ].map((name) => `:(top,glob)**/.workbench/${name}.json`),
    ':(top,glob)**/.workbench/save-points/**',
  ];
  const result = spawnSync('git', ['status', '--porcelain', '--', ...globs], {
    cwd: gitCwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) return [];
  const artifacts = [];
  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue;
    const entry = line.slice(3);
    const renamed = entry.includes(' -> ') ? entry.split(' -> ').pop() : entry;
    const cleaned = renamed.replace(/^"|"$/g, '');
    if (SESSION_ARTIFACT_RE.test(cleaned)) artifacts.push(cleaned);
  }
  return artifacts;
}
