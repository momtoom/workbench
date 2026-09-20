/**
 * Workbench canvas gesture regression harness.
 *
 * Runs real-input (CDP mouse/keyboard) tests against the Design Editor canvas
 * in a fully isolated environment:
 *  - a throwaway APFS clone of the spec's fixture project (specs export
 *    `fixture`, defaulting to "SHADCN-002"),
 *  - a dedicated vite dev-server instance on its own port with its own
 *    active-project state file (WORKBENCH_DEV_SERVER_STATE_PATH),
 *  - a headless system Chrome driven via puppeteer-core.
 *
 * Nothing here touches the developer's live dev server (5174), their
 * active-project state, or the real fixture projects.
 *
 * Usage:  npm run test:gestures            (all specs)
 *         npm run test:gestures -- drag    (specs whose filename matches)
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

import { selectFixtureDesignPage } from './helpers.mjs';
import {
  createWorkbenchProjectFiles,
  createWorkbenchProjectGuideFiles,
  createWorkbenchProjectSampleFiles,
  createWorkbenchProjectSourceFiles,
} from '../workbench-template.mjs';

const WORKBENCH_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_FIXTURE = 'SHADCN-002';

// A fixture clone used to arrive with .workbench/selection.json, so the editor
// opened it on whatever page the developer last had open. 52dace219 stopped
// committing session artifacts, the clones came up with no page at all, and
// every spec that does not seed its own selection timed out in
// waitForCanvasFrame as "canvas frame did not appear". These are the pages
// those fixtures actually had open, read back from 52dace219^ and written down
// here so a spec's starting page belongs to the harness rather than to an
// untracked file. Specs that call selectFixtureDesignPage still override it.
const FIXTURE_DEFAULT_PAGE = {
  'SHADCN-002': { pageId: 'page-claude-catalog', sourceFile: 'src/workbench-pages/ComponentsCatalog.tsx' },
  'Astryx-003': { pageId: 'page-astryx-comp-gallary', sourceFile: 'src/workbench-pages/SamplePage/CompGallary.tsx' },
  'NEW SG Design System Test': { pageId: 'page-creator-explore', sourceFile: 'src/workbench-pages/temporary/Creator.tsx' },
};
const PORT = Number(process.env.WB_GESTURE_TEST_PORT || 5197);
const CHROME_PATH = process.env.WB_GESTURE_TEST_CHROME || resolveDefaultChromePath();

// The developer's machine is a Mac with Chrome; a Linux container (Claude Code
// on the web, CI) has a distro Chromium or a Playwright browser instead.
function resolveDefaultChromePath() {
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const playwrightRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(playwrightRoot)) {
    for (const entry of readdirSync(playwrightRoot).sort().reverse()) {
      if (/^chromium-\d+$/.test(entry)) candidates.push(join(playwrightRoot, entry, 'chrome-linux', 'chrome'));
    }
  }
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
// A comma-separated list runs an arbitrary subset in one browser launch, which
// matters because each spec still pays for its own fixture clone and dev server.
// A single term keeps the plain substring behaviour.
const specFilters = (process.argv[2] ?? '').split(',').map((term) => term.trim()).filter(Boolean);

const log = (...args) => console.log('[gesture-tests]', ...args);

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server did not become ready at ${url}`);
}

async function assertPortFree(port) {
  try {
    await fetch(`http://localhost:${port}/`);
  } catch (error) {
    if (error instanceof TypeError) return; // connection refused = free
    throw error;
  }
  throw new Error(
    `port ${port} is already serving something — a stale dev server would make every spec ` +
    'run against the wrong fixture. Kill it (or set WB_GESTURE_TEST_PORT) and retry.',
  );
}

async function cloneFixture(workDir, fixtureName, cloneSuffix = '') {
  const source = join(WORKBENCH_ROOT, 'projects', fixtureName);
  const suffix = cloneSuffix === '' ? '' : `-${cloneSuffix}`;
  const projectDir = join(workDir, `fixture-${fixtureName.replace(/[^A-Za-z0-9-]+/g, '_')}${suffix}`);
  // `-c` is the APFS copy-on-write clone; GNU cp has no such flag.
  const copyFlags = process.platform === 'darwin' ? ['-Rc'] : ['-R'];
  await new Promise((resolvePromise, rejectPromise) => {
    const cp = spawn('cp', [...copyFlags, source, projectDir], { stdio: 'inherit' });
    cp.on('exit', (code) => (code === 0 ? resolvePromise() : rejectPromise(new Error(`cp exited ${code}`))));
  });
  return projectDir;
}

// A spec can export `fixture = { templateId, projectName }` instead of a
// committed project name: the harness then generates the project from the
// Workbench template the way the Initialize-project flow does, so a starter
// is tested from its real output without duplicating it under projects/.
// The app installs the project's dependencies on load, exactly as it does for
// a freshly created project.
async function generateTemplateFixture(workDir, fixture, cloneSuffix = '') {
  const projectName = fixture.projectName ?? `${fixture.templateId}-starter`;
  const suffix = cloneSuffix === '' ? '' : `-${cloneSuffix}`;
  const projectDir = join(workDir, `fixture-${projectName.replace(/[^A-Za-z0-9-]+/g, '_')}${suffix}`);
  const createdAt = new Date().toISOString();
  const templateId = fixture.templateId;
  const write = async (relativePath, contents) => {
    const target = join(projectDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  };
  for (const [name, value] of createWorkbenchProjectFiles({
    projectId: `wb_${projectName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`,
    projectName,
    createdAt,
    templateId,
  })) {
    await write(join('.workbench', name), `${JSON.stringify(value, null, 2)}\n`);
  }
  for (const [name, contents] of createWorkbenchProjectSourceFiles({ projectName, templateId })) await write(name, contents);
  for (const [name, contents] of createWorkbenchProjectGuideFiles({ templateId })) await write(name, contents);
  for (const [name, contents] of createWorkbenchProjectSampleFiles({ templateId })) await write(name, contents);
  return projectDir;
}

function describeFixture(fixture) {
  return typeof fixture === 'string' ? fixture : `template:${fixture.templateId}`;
}

async function startServer(statePath) {
  await assertPortFree(PORT);
  const server = spawn(
    join(WORKBENCH_ROOT, 'node_modules', '.bin', 'vite'),
    ['--config', 'vite.config.ts', '--port', String(PORT), '--strictPort'],
    {
      cwd: WORKBENCH_ROOT,
      env: { ...process.env, WORKBENCH_DEV_SERVER_STATE_PATH: statePath },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  server.stdout.on('data', () => {});
  server.stderr.on('data', (chunk) => {
    const text = String(chunk);
    if (/error/i.test(text)) process.stderr.write(`[vite] ${text}`);
  });
  await waitForServer(`http://localhost:${PORT}/`, 60000);
  return server;
}

async function stopServer(server) {
  if (!server) return;
  if (server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise((resolvePromise) => server.once('exit', resolvePromise));
  server.kill('SIGTERM');
  await Promise.race([exited, new Promise((resolvePromise) => setTimeout(resolvePromise, 500))]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill('SIGKILL');
    await Promise.race([exited, new Promise((resolvePromise) => setTimeout(resolvePromise, 500))]);
  }
}

async function run() {
  const workDir = await mkdtemp(join(tmpdir(), 'wb-gesture-'));
  let browser = null;
  let failures = 0;

  try {
    const specsDir = join(WORKBENCH_ROOT, 'scripts', 'gesture-tests', 'specs');
    const specFiles = (await readdir(specsDir))
      .filter((file) => file.endsWith('.spec.mjs'))
      .filter((file) => specFilters.length === 0 || specFilters.some((term) => file.includes(term)))
      .sort();
    if (specFiles.length === 0) {
      throw new Error(`no specs matched "${specFilters.join(', ')}"`);
    }
    const specs = [];
    for (const specFile of specFiles) {
      const module = await import(join(specsDir, specFile));
      specs.push({
        file: specFile,
        fixture: module.fixture ?? DEFAULT_FIXTURE,
        spec: module.default,
      });
    }
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--window-size=1680,1050',
        '--no-first-run',
        // Chromium refuses to sandbox as root (a container), not a policy choice for the developer's Mac.
        ...(typeof process.getuid === 'function' && process.getuid() === 0 ? ['--no-sandbox'] : []),
      ],
      defaultViewport: { width: 1680, height: 1000 },
    });

    // Every gesture spec gets a fresh fixture clone and dev server. Several
    // specs intentionally commit source edits or selection state while they
    // run; sharing one clone made later specs depend on filename order and
    // caused isolated runs to exercise a different page than the full suite.
    for (const [specIndex, entry] of specs.entries()) {
      const fixtureLabel = describeFixture(entry.fixture);
      const projectDir = typeof entry.fixture === 'string'
        ? await (async () => {
            log(`fixture ${fixtureLabel}: cloning for ${entry.file}...`);
            return cloneFixture(workDir, entry.fixture, specIndex);
          })()
        : await (async () => {
            log(`fixture ${fixtureLabel}: generating for ${entry.file} from the project template...`);
            return generateTemplateFixture(workDir, entry.fixture, specIndex);
          })();
      const defaultPage = typeof entry.fixture === 'string' ? FIXTURE_DEFAULT_PAGE[entry.fixture] : null;
      if (defaultPage) await selectFixtureDesignPage(projectDir, defaultPage);
      const statePath = join(workDir, `dev-server-project-${specIndex}.json`);
      await writeFile(statePath, `${JSON.stringify({ rootPath: projectDir }, null, 2)}\n`, 'utf8');
      log(`fixture ${fixtureLabel}: starting isolated dev server on :${PORT}...`);
      const server = await startServer(statePath);
      // Every spec also gets its own browser context. The clone and the dev
      // server are already per-spec, but every spec loads the same origin, so
      // one shared context handed the next spec the previous one's
      // localStorage — which is where the editor keeps workspace state. That
      // is what made specs pass alone and fail in the suite depending on
      // filename order.
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        const consoleErrors = [];
        page.on('pageerror', (error) => consoleErrors.push(String(error)));
        // The app reports a failed registration or runtime load through the
        // console, not as a page error; keep those too so a failing spec can
        // show why (the frames' consoles bubble up to the page).
        page.on('console', (message) => {
          if (message.type() === 'error' || message.type() === 'warn') consoleErrors.push(`${message.type()}: ${message.text()}`);
        });
        page.on('response', (response) => {
          if (response.status() >= 400) consoleErrors.push(`http ${response.status()}: ${response.url()}`);
        });
        try {
          log(`RUN  ${entry.file}`);
          await entry.spec({
            page,
            baseUrl: `http://localhost:${PORT}`,
            projectDir,
            consoleErrors,
          });
          log(`PASS ${entry.file}`);
        } catch (error) {
          failures += 1;
          log(`FAIL ${entry.file}`);
          console.error(error);
          for (const line of consoleErrors.slice(0, 12)) log(`     console: ${line.slice(0, 600)}`);
          try {
            const shotPath = join(workDir, `${entry.file}.png`);
            await page.screenshot({ path: shotPath });
            log(`     screenshot: ${shotPath}`);
          } catch {
            // screenshot is best-effort
          }
        } finally {
          await page.close().catch(() => {});
        }
      } finally {
        await context.close().catch(() => {});
        await stopServer(server);
      }
    }
  } finally {
    await browser?.close().catch(() => {});
    if (failures === 0) {
      await rm(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } else {
      log(`work dir kept for inspection: ${workDir}`);
    }
  }

  if (failures > 0) {
    log(`${failures} spec(s) failed`);
    process.exit(1);
  }
  log('all specs passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
