#!/usr/bin/env node

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let event;
  try {
    event = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const toolInput = event.tool_input ?? {};
  const filePaths = collectFilePaths(toolInput);
  const blockedPath = filePaths.find(isBlockedWorkbenchRegistryPath);
  const blockedCommandTarget = getBlockedWorkbenchRegistryBashWrite(toolInput);
  const blockedTarget = blockedPath ?? blockedCommandTarget;
  if (!blockedTarget) process.exit(0);

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: [
        `Direct edits to ${blockedTarget} are blocked.`,
        'Create or change component TSX, exports, CSS, and CSF stories first, then use Workbench import/re-import or registry hydration.',
        'Do not put story control fields such as control, assetId, picker, or custom prop metadata into component registry JSON.',
      ].join(' '),
    },
  })}\n`);
});

function collectFilePaths(value) {
  const paths = [];
  visit(value);
  return paths;

  function visit(candidate) {
    if (!candidate || typeof candidate !== 'object') return;
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(candidate)) {
      if ((key === 'file_path' || key === 'path') && typeof child === 'string') {
        paths.push(child);
        continue;
      }
      visit(child);
    }
  }
}

function isBlockedWorkbenchRegistryPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
  return /(?:^|\/)\.workbench\/(?:components|prop-registry)\.json$/i.test(normalized);
}

function getBlockedWorkbenchRegistryBashWrite(toolInput) {
  const command = typeof toolInput.command === 'string' ? toolInput.command : '';
  if (!command || !hasBlockedWorkbenchRegistryReference(command)) return null;
  if (!isWriteLikeShellCommand(command)) return null;
  const match = command.replace(/\\/g, '/').match(/(?:^|[\s"'=])([^"'\s;|&]*\.workbench\/(?:components|prop-registry)\.json)\b/i);
  return match?.[1] ?? '.workbench/components.json or .workbench/prop-registry.json';
}

function hasBlockedWorkbenchRegistryReference(command) {
  return /(?:^|[\s"'=])[^"'\s;|&]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/'));
}

function isWriteLikeShellCommand(command) {
  return /(?:^|[\s;&|])(?:tee|touch|truncate)\b/.test(command) ||
    /(?:^|[\s;&|])sed\s+(?:-[A-Za-z]*i|--in-place)\b/.test(command) ||
    /(?:^|[\s;&|])perl\s+(?:-[A-Za-z]*i|-pi)\b/.test(command) ||
    /(?:^|[\s;&|])g?awk\b[\s\S]*(?:\s-i\s*|--include[=\s]+)["']?inplace\b/.test(command) ||
    /(?:^|[\s;&|])(?:ex|ed)\b/.test(command) ||
    /(?:^|[\s;&|])(?:mv|cp|rsync|ln)\b[\s\S]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/')) ||
    /(?:^|[^>])>{1,2}\|?\s*["']?[^"'\s]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/')) ||
    /\b(?:writeFile(?:Sync)?|appendFile(?:Sync)?)\s*\(/.test(command) ||
    /\b(?:python(?:3(?:\.\d+)?)?|pypy3?)\b[\s\S]*\bopen\s*\([^)]*,\s*["'](?:[wax+]|r[bt]?\+)/i.test(command) ||
    /\b(?:python(?:3(?:\.\d+)?)?|pypy3?)\b[\s\S]*\.(?:write_text|write_bytes)\s*\(/i.test(command) ||
    /\bruby\b[\s\S]*\b(?:File|IO)\.(?:write|binwrite)\s*\(/i.test(command) ||
    /\bruby\b[\s\S]*\bFile\.open\s*\([^)]*,\s*["'](?:[wax+]|r[bt]?\+)/i.test(command) ||
    /\bphp\b[\s\S]*\bfile_put_contents\s*\(/i.test(command) ||
    /(?:^|[\s;&|])dd\b[\s\S]*\bof=["']?[^"'\s]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/')) ||
    /(?:^|[\s;&|])(?:install|patch)\b[\s\S]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/')) ||
    /(?:^|[\s;&|])sponge\b\s+["']?[^"'\s]*\.workbench\/(?:components|prop-registry)\.json\b/i.test(command.replace(/\\/g, '/'));
}
