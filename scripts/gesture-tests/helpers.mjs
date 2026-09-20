/** Shared helpers for canvas gesture specs. */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export { sleep };

export function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

/** Open the editor and wait for the canvas frame to render real content. */
export async function openCanvas(page, baseUrl, { readySelector, timeoutMs = 60000 } = {}) {
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: timeoutMs });
  const frame = await waitForCanvasFrame(page, timeoutMs);
  if (readySelector) {
    await frame.waitForSelector(readySelector, { timeout: timeoutMs });
  }
  return frame;
}

export async function waitForCanvasFrame(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
    if (frame) {
      const ready = await frame.evaluate(() => !!document.querySelector('.wb-source-visual-preview')).catch(() => false);
      if (ready) return frame;
    }
    await sleep(250);
  }
  throw new Error('canvas frame did not appear');
}

export async function canvasFrameOffset(page) {
  return page.evaluate(() => {
    const iframe = document.querySelector('iframe.wb-source-visual-preview-frame');
    const rect = iframe.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });
}

/**
 * Page coordinates for a point inside the canvas frame, plus whether the shell
 * actually shows that point.
 *
 * The preview iframe is laid out wider than the shell's canvas column, so a
 * frame point can be fully inside the iframe's own viewport and still sit
 * behind the Inspector. Real pointer input then never reaches the canvas at
 * all: the press lands on the Inspector in the host document, no canvas
 * handler runs, and the gesture reads as "the editor ignored me". Ask the host
 * document what is actually on top before pressing.
 */
export async function canvasPagePoint(page, framePoint) {
  const offset = await canvasFrameOffset(page);
  const point = { x: offset.x + framePoint.x, y: offset.y + framePoint.y };
  const onCanvas = await page.evaluate(({ x, y }) => (
    document.elementFromPoint(x, y)?.classList?.contains('wb-source-visual-preview-frame') ?? false
  ), point);
  return { ...point, onCanvas };
}

/** Center a frame element (by evaluated getter) and return its page coords. */
export async function pagePointFor(page, frame, getRect) {
  const offset = await canvasFrameOffset(page);
  const rect = await frame.evaluate(getRect);
  if (!rect) return null;
  return { x: offset.x + rect.x + rect.w / 2, y: offset.y + rect.y + rect.h / 2 };
}

export async function scrollFrameSelectorIntoView(frame, selector) {
  await frame.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'center', inline: 'center' });
  }, selector);
  await sleep(350);
}

/** Alt+click = the editor's explicit runtime-interaction chord. */
export async function altClick(page, point) {
  await page.keyboard.down('Alt');
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up('Alt');
}

/**
 * Alt+click dispatched inside the canvas frame, for a control a real pointer
 * cannot reach: the preview iframe is laid out taller and wider than the
 * browser window in short-viewport specs, so an element anchored to the
 * frame's bottom computes to a page point outside the window and
 * elementFromPoint returns null. Use this only for setup and teardown steps —
 * anything a spec actually asserts about pointer routing must go through
 * altClick so it still exercises the real event path.
 */
export async function altClickInFrame(frame, getElement) {
  return frame.evaluate((getterSource) => {
    // eslint-disable-next-line no-new-func
    const el = new Function(`return (${getterSource})()`)();
    if (!el) return false;
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      el.dispatchEvent(new MouseEvent(type, { altKey: true, bubbles: true, cancelable: true, view: window }));
    }
    return true;
  }, getElement.toString());
}

/** Alt+drag = a runtime-owned pointer sequence inside the Design canvas. */
export async function altDrag(page, from, to, { steps = 12, stepDelayMs = 40 } = {}) {
  await page.keyboard.down('Alt');
  try {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let index = 1; index <= steps; index += 1) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * index) / steps,
        from.y + ((to.y - from.y) * index) / steps,
      );
      await sleep(stepDelayMs);
    }
    await page.mouse.up();
  } finally {
    await page.keyboard.up('Alt');
  }
}

export async function metaClick(page, point) {
  await page.keyboard.down('Meta');
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up('Meta');
}

/** Press-drag with interpolated moves; samples the drop indicator while moving. */
export async function dragBetween(page, frame, from, to, { steps = 12, stepDelayMs = 80 } = {}) {
  const seen = { indicator: false, ghost: false };
  await page.mouse.move(from.x, from.y);
  await sleep(100);
  await page.mouse.down();
  await sleep(100);
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    await sleep(stepDelayMs);
    const state = await frame.evaluate(() => ({
      indicator: !!document.querySelector('.wb-source-visual-drop-indicator'),
      ghost: !!document.querySelector('.wb-source-visual-drag-ghost'),
    }));
    seen.indicator ||= state.indicator;
    seen.ghost ||= state.ghost;
  }
  await page.mouse.up();
  await sleep(800);
  return seen;
}

/** selection.json is a session artifact and is not committed, so a fixture
 *  clone carries none until the editor writes its first selection. Specs seed a
 *  selection by reading, editing and writing this file, and every field they
 *  need is one they set themselves — so an absent file is a starting point,
 *  not a broken fixture. These two helpers own that contract; specs should not
 *  read or write the path directly. */
export async function readFixtureSelection(projectDir) {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  try {
    return JSON.parse(await readFile(join(projectDir, '.workbench', 'selection.json'), 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return { schemaVersion: '0.1', activeTarget: null, selectedTargets: [], extensions: {} };
  }
}

export async function writeFixtureSelection(projectDir, selection) {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const workbenchDir = join(projectDir, '.workbench');
  await mkdir(workbenchDir, { recursive: true });
  await writeFile(join(workbenchDir, 'selection.json'), `${JSON.stringify(selection, null, 2)}\n`, 'utf8');
}

/** The selection the editor last committed. Null means nothing committed yet. */
export async function readActiveDesignLayerId(projectDir) {
  return (await readFixtureSelection(projectDir))?.extensions?.activeDesignLayerId ?? null;
}

/** Give a fixture-dependent spec an explicit Design page instead of relying
 *  on whichever page the developer last had open in the committed fixture. */
// viewport pins the artboard the spec renders against. .workbench/selection.json
// is untracked, so without it a spec inherits whatever preview size the project
// was last left on in the app — which is how a desktop-only assertion ends up
// running against a 390px phone artboard on someone else's machine.
export async function selectFixtureDesignPage(projectDir, { pageId, sourceFile, viewport = null }) {
  const selection = await readFixtureSelection(projectDir);
  const activeTarget = { kind: 'page', pageId, sourceFile };
  selection.activeTarget = activeTarget;
  selection.selectedTargets = [activeTarget];
  selection.extensions = {
    ...selection.extensions,
    activeWorkbenchSurface: 'design',
    activeDesignTargetKind: 'page',
    activeDesignTargetId: pageId,
    activeDesignSourceFile: sourceFile,
    activeDesignLayerId: `source:${sourceFile.replace(/[^A-Za-z0-9]+/g, '-')}:0`,
    selectedDesignLayerIds: [],
    designPreviewDrillPath: [],
    ...(viewport ? { designPreviewViewport: viewport } : null),
  };
  await writeFixtureSelection(projectDir, selection);
}

export async function waitFor(check, { timeoutMs = 8000, intervalMs = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await check();
    if (last) return last;
    await sleep(intervalMs);
  }
  throw new Error(`timed out waiting for ${label} (last: ${JSON.stringify(last)})`);
}

/**
 * Matrix-spec helpers: label-anchored targeting and interpolation sampling
 * that tolerate path-based node ids changing between committed gestures.
 */

/** Visible point for an exact-text label. Climbs to the FIRST ancestor that
 *  carries a non-text node id; if that host renders with no box of its own
 *  (display:contents wrappers), the leaf's own box anchors the point. */
export async function visibleLabelTarget(frame, label, { near, ancestorLevels = 0 } = {}) {
  return frame.evaluate((wantedLabel, nearPoint, climbLevels) => {
    const leaves = [...document.querySelectorAll('*')].filter((el) => (
      el.children.length === 0 && (el.textContent || '').trim() === wantedLabel
    ));
    const candidates = [];
    for (const leaf of leaves) {
      let host = null;
      let remaining = climbLevels;
      for (let n = leaf; n && n !== document.body; n = n.parentElement) {
        const id = n.getAttribute?.('data-wb-preview-node-id');
        if (id && !id.endsWith('-text')) {
          host = n;
          if (remaining === 0) break;
          remaining -= 1;
        }
      }
      if (!host) continue;
      const hostRect = host.getBoundingClientRect();
      const box = hostRect.width > 1 && hostRect.height > 1 ? hostRect : leaf.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      candidates.push({
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        left: box.x,
        top: box.y,
        w: box.width,
        h: box.height,
        id: host.getAttribute('data-wb-preview-node-id'),
      });
    }
    if (candidates.length === 0) return null;
    if (!nearPoint) return candidates[0];
    candidates.sort((a, b) => (
      Math.hypot(a.x - nearPoint.x, a.y - nearPoint.y) - Math.hypot(b.x - nearPoint.x, b.y - nearPoint.y)
    ));
    return candidates[0];
  }, label, near ?? null, ancestorLevels);
}

export async function scrollLabelIntoView(frame, label) {
  await frame.evaluate((wantedLabel) => {
    const leaf = [...document.querySelectorAll('*')].find((el) => (
      el.children.length === 0 && (el.textContent || '').trim() === wantedLabel
    ));
    leaf?.scrollIntoView({ block: 'center', inline: 'center' });
  }, label);
  await sleep(700);
}

/** Start an rAF sampler recording, each frame, the largest computed-translate
 *  magnitude among elements currently under a drop-layout transition within
 *  `radius` px of the anchor. Surface-agnostic: whatever element the FLIP
 *  actually translates is what gets sampled. */
export async function startTranslateSampler(frame, anchor, { radius = 500 } = {}) {
  await frame.evaluate((nearPoint, maxDistance) => {
    const sampleSession = (window.__wbTranslateSampleSession ?? 0) + 1;
    window.__wbTranslateSampleSession = sampleSession;
    window.__wbTranslateSamples = [];
    const start = performance.now();
    const tick = () => {
      if (window.__wbTranslateSampleSession !== sampleSession) return;
      let magnitude = 0;
      for (const element of document.querySelectorAll('[data-wb-drop-layout-transition]')) {
        const rect = element.getBoundingClientRect();
        if (nearPoint) {
          const distance = Math.hypot(
            rect.x + rect.width / 2 - nearPoint.x,
            rect.y + rect.height / 2 - nearPoint.y,
          );
          if (distance > maxDistance) continue;
        }
        const translate = getComputedStyle(element).translate;
        if (!translate || translate === 'none' || translate === '0px') continue;
        const parts = translate.split(' ').map((value) => Number.parseFloat(value));
        const dx = Number.isFinite(parts[0]) ? parts[0] : 0;
        const dy = parts.length > 1 && Number.isFinite(parts[1]) ? parts[1] : 0;
        magnitude = Math.max(magnitude, Math.abs(dx), Math.abs(dy));
      }
      window.__wbTranslateSamples.push(magnitude);
      if (performance.now() - start < 12000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, anchor ?? null, radius);
}

export async function readTranslateSamples(frame) {
  return frame.evaluate(() => window.__wbTranslateSamples ?? []);
}

export function assertInterpolatedSamples(samples, description) {
  const maxOffset = Math.max(0, ...samples);
  assert(maxOffset > 8, `${description}: displaced sibling was projected (max offset ${maxOffset}px)`);
  const intermediates = new Set(
    samples.filter((value) => value > 1 && value < maxOffset - 1).map((value) => Math.round(value)),
  );
  assert(
    intermediates.size >= 3,
    `${description}: displaced sibling interpolated instead of jumping ` +
    `(max ${Math.round(maxOffset)}px, intermediates: ${[...intermediates].slice(0, 8).join(', ') || 'none'})`,
  );
}

/** Press at `from`, glide to `to` in small steps, release. */
export async function slowDrag(page, from, to, { steps = 8, stepDelayMs = 130 } = {}) {
  await page.mouse.move(from.x, from.y);
  await sleep(130);
  await page.mouse.down();
  await sleep(130);
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await sleep(stepDelayMs);
  }
  await page.mouse.up();
}

/** Press at `from`, glide through every waypoint in order, release at the last.
 *  Models how people actually drag: past the target, back, past it again. */
export async function wanderDrag(page, from, waypoints, { steps = 6, stepDelayMs = 110 } = {}) {
  await page.mouse.move(from.x, from.y);
  await sleep(130);
  await page.mouse.down();
  await sleep(130);
  let current = from;
  for (const waypoint of waypoints) {
    for (let i = 1; i <= steps; i += 1) {
      await page.mouse.move(
        current.x + ((waypoint.x - current.x) * i) / steps,
        current.y + ((waypoint.y - current.y) * i) / steps,
      );
      await sleep(stepDelayMs);
    }
    // Dwell so the decision machinery can settle on this side of the boundary.
    await sleep(260);
    current = waypoint;
  }
  await page.mouse.up();
}

/**
 * A wandering drag must glide in BOTH directions: projecting the displaced
 * sibling away and un-projecting it back home when the pointer crosses the
 * decision boundary again. Require at least two separate projections and
 * intermediate frames on the way back down, so an instant snap-home fails.
 */
export function assertOscillatingSamples(samples, description) {
  const maxOffset = Math.max(0, ...samples);
  assert(maxOffset > 8, `${description}: displaced sibling was projected (max offset ${maxOffset}px)`);
  const HIGH = Math.max(8, maxOffset * 0.6);
  const LOW = 2;
  let cycles = 0;
  let index = 0;
  let bestDescentIntermediates = 0;
  while (index < samples.length) {
    while (index < samples.length && samples[index] < HIGH) index += 1;
    if (index >= samples.length) break;
    cycles += 1;
    const peakAt = index;
    while (index < samples.length && samples[index] > LOW) index += 1;
    if (index >= samples.length) break;
    const descent = samples.slice(peakAt, index)
      .filter((value) => value > LOW && value < maxOffset - 1)
      .map((value) => Math.round(value));
    bestDescentIntermediates = Math.max(bestDescentIntermediates, new Set(descent).size);
  }
  assert(
    cycles >= 2,
    `${description}: sibling re-projected after the pointer wandered back ` +
    `(projection cycles: ${cycles}, max ${Math.round(maxOffset)}px)`,
  );
  assert(
    bestDescentIntermediates >= 3,
    `${description}: sibling glided home instead of snapping when the pointer ` +
    `crossed back (return intermediates: ${bestDescentIntermediates})`,
  );
}
