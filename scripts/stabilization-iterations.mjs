import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const DEFAULT_CHECKS = [
  ['npm', ['run', 'workbench:check-config']],
  ['npm', ['run', 'workbench:check-design']],
  ['npm', ['run', 'workbench:check-tokens']],
  ['npm', ['run', 'check']],
  ['npm', ['run', 'build']]
];

function parseIterations(value) {
  const parsed = Number.parseInt(value ?? '10', 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Iteration count must be a positive integer.');
  }
  return parsed;
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const totalMs = sorted.reduce((sum, value) => sum + value, 0);
  return {
    count,
    minMs: sorted[0] ?? 0,
    maxMs: sorted[count - 1] ?? 0,
    avgMs: count === 0 ? 0 : Number((totalMs / count).toFixed(2))
  };
}

const totalIterations = parseIterations(process.argv[2]);
const reportPath = resolve(process.cwd(), process.argv[3] ?? 'artifacts/stabilization-report.json');

const iterationResults = [];
let failedCheck = null;

for (let iteration = 1; iteration <= totalIterations; iteration += 1) {
  console.log(`\n=== Stabilization iteration ${iteration}/${totalIterations} ===`);
  const checkResults = [];

  for (const [command, args] of DEFAULT_CHECKS) {
    const label = `${command} ${args.join(' ')}`;
    const startedAt = Date.now();
    const result = spawnSync(command, args, { stdio: 'inherit' });
    const durationMs = Date.now() - startedAt;
    const exitCode = result.status ?? 1;

    checkResults.push({
      label,
      durationMs,
      exitCode,
      passed: exitCode === 0
    });

    if (exitCode !== 0) {
      failedCheck = { iteration, label, exitCode };
      break;
    }
  }

  iterationResults.push({ iteration, checkResults });

  if (failedCheck) {
    break;
  }
}

const checkLabels = DEFAULT_CHECKS.map(([command, args]) => `${command} ${args.join(' ')}`);
const checkStats = Object.fromEntries(
  checkLabels.map((label) => {
    const durations = iterationResults
      .flatMap((iteration) => iteration.checkResults)
      .filter((check) => check.label === label)
      .map((check) => check.durationMs);
    return [label, summarize(durations)];
  })
);

const report = {
  iterationsRequested: totalIterations,
  iterationsCompleted: iterationResults.length,
  completedAt: new Date().toISOString(),
  passed: failedCheck === null,
  failedCheck,
  checkStats,
  iterationResults
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('\n=== Stabilization summary ===');
for (const { iteration, checkResults } of iterationResults) {
  const durationSummary = checkResults
    .map((check) => `${check.label}: ${(check.durationMs / 1000).toFixed(2)}s`)
    .join(' | ');
  console.log(`Iteration ${iteration}: ${durationSummary}`);
}

console.log(`\nReport written: ${reportPath}`);

if (failedCheck) {
  console.error(`Failed at iteration ${failedCheck.iteration} on ${failedCheck.label} (exit ${failedCheck.exitCode}).`);
  process.exit(failedCheck.exitCode);
}

console.log(`Completed ${totalIterations} stabilization iterations successfully.`);
