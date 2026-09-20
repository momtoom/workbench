/**
 * End-to-end projection/writeback coverage for CSS class effectiveness.
 *
 * The fixture changes are made only inside the harness's APFS clone. SHADCN is
 * used here as a realistic CVA/cascade fixture; all status logic lives in the
 * shared Workbench analyzer.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, canvasPagePoint, metaClick, openCanvas, readActiveDesignLayerId, readFixtureSelection, sleep, waitFor, waitForCanvasFrame, writeFixtureSelection } from '../helpers.mjs';

export const fixture = 'SHADCN-002';

const SOURCE_FILE = 'src/workbench-pages/ComponentGallery.tsx';
const INITIAL_CLASSES = [
  'border-transparent',
  'h-20',
  'p-0',
  'pl-1.5!',
  'hover:bg-muted/50',
  'xl:col-span-3',
  'data-[active=true]:opacity-100',
].join(' ');

export default async function cssClassEffectivenessInspectorSpec({
  page,
  baseUrl,
  projectDir,
}) {
  const sourcePath = join(projectDir, SOURCE_FILE);
  const [originalSource, selection] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readFixtureSelection(projectDir),
  ]);
  const fixtureComponent = `
function NonForwardingClassFixture(
  { className: _className, ...buttonProps }: ComponentProps<'button'>,
) {
  return (
    <button
      {...buttonProps}
      type="button"
      style={{ ...buttonProps.style, margin: 16 }}
    >
      Not forwarded fixture
    </button>
  )
}

`;
  const outlineNeedle = '<EmptyContent><Button variant="outline">Cancel</Button></EmptyContent>';
  const outlineReplacement =
    `<EmptyContent><Button variant="outline" className="${INITIAL_CLASSES}">` +
    'Cancel</Button></EmptyContent>';
  // The Theme root is only somewhere to hang the non-forwarding fixture — this
  // spec does not care what its props say. Match the line rather than spelling
  // the whole tag out: pinning every attribute made an unrelated `theme` change
  // in the fixture fail this spec at setup, before the browser even opened.
  const themeLine = originalSource
    .split('\n')
    .find((line) => line.includes('<Theme as="main"') && line.includes('aria-label="Component gallery"'));
  assert(originalSource.includes(outlineNeedle), 'the isolated fixture has the expected outline Button');
  assert(themeLine !== undefined, 'the isolated fixture has the expected Theme root');
  const themeNeedle = `${themeLine}\n`;
  const fixtureSource = originalSource
    .replace(
      "import '../workbench-tokens.css'\n",
      "import type { ComponentProps } from 'react'\n\nimport '../workbench-tokens.css'\n",
    )
    .replace('export default function ComponentGalleryPage()', `${fixtureComponent}export default function ComponentGalleryPage()`)
    .replace(outlineNeedle, outlineReplacement)
    .replace(
      themeNeedle,
      () => `${themeNeedle}      <NonForwardingClassFixture className="bg-red-500" />\n`,
    );

  selection.activeTarget = {
    kind: 'page',
    pageId: 'page-component-gallery',
    sourceFile: SOURCE_FILE,
  };
  selection.selectedTargets = [selection.activeTarget];
  selection.extensions = {
    ...selection.extensions,
    activeWorkbenchSurface: 'design',
    activeDesignTargetKind: 'page',
    activeDesignTargetId: 'page-component-gallery',
    activeDesignSourceFile: SOURCE_FILE,
    activeDesignLayerId: 'source:src-workbench-pages-ComponentGallery-tsx:0',
    selectedDesignLayerIds: [],
    designPreviewDrillPath: [],
    // xl: is min-width 1280px (--ds-token-tailwind-primitives-screen-xl, 80rem)
    // and the fixture ships a 1440-wide artboard, so xl:col-span-3 genuinely
    // matched and the analyzer was right to call it applied — the inactive
    // assertion below was the wrong half of the pair.
    //
    // Pin the artboard under the breakpoint rather than moving the class up to
    // 2xl. Both make the assertion true today, but a spec that asserts on "the
    // current viewport" should own that viewport instead of inheriting whatever
    // the fixture was last saved with: switching the fixture to the 1920-wide
    // desktop preset would silently re-match a 2xl class and put this spec back
    // where it started.
    designPreviewViewport: { height: 900, presetId: 'responsive', width: 1024 },
  };
  await Promise.all([
    writeFile(sourcePath, fixtureSource, 'utf8'),
    writeFixtureSelection(projectDir, selection),
  ]);
  console.log('[css-class-effectiveness] isolated fixture ready');

  // The runner defaults to 1680x1000, where the canvas frame's right edge sits
  // behind the Inspector aside and elementFromPoint there answers shell chrome
  // rather than the canvas iframe (2026-09-03 handoff, §3.2). A point measured
  // inside the frame then presses nothing, which reads as an editor failure.
  // 1980x1000 is the first size that contains the frame and clears the aside.
  await page.setViewport({ width: 1980, height: 1000 });
  let frame = await openCanvas(page, baseUrl, {
    readySelector: '.wb-source-visual-preview',
    timeoutMs: 60000,
  });
  console.log('[css-class-effectiveness] canvas ready');
  const outlineTarget = await settledCanvasButton(frame, 'Cancel', 'border-transparent');
  console.log('[css-class-effectiveness] outline fixture found');
  const outlinePoint = await canvasPagePoint(page, outlineTarget.point);
  assert(outlinePoint.onCanvas, 'the outline fixture Button is visible on the Design canvas');
  console.log('[css-class-effectiveness] selecting outline fixture');
  await metaClick(page, outlinePoint);
  console.log('[css-class-effectiveness] canvas selection gesture delivered');

  // Cmd+click walks up from the deepest node at the point and stops at the
  // first node that has a sibling. Here that is the Button's wrapper, not the
  // Button: EmptyContent sits beside EmptyHeader while the Button is
  // EmptyContent's only child. The rule exists so a padding-less wrapper stays
  // discoverable — if only the inner node were ever selectable you could not
  // tell the wrapper was there, and dragging the inner node out leaves an empty
  // one behind. Assert that, so this spec guards the rule instead of fighting
  // it.
  const wrapperLayerId = outlineTarget.nodeId.replace(/-\d+$/, '');
  await waitFor(
    async () => (await readActiveDesignLayerId(projectDir)) === wrapperLayerId ? wrapperLayerId : null,
    { label: `Cmd+click to stop at the wrapper that has a sibling (${wrapperLayerId})` },
  );
  console.log('[css-class-effectiveness] Cmd+click stopped at the wrapper, as the rule says');

  // Reaching the Button itself is a double-click drill, which cannot be
  // delivered to the canvas iframe from this harness (see grid-slot-drop), so
  // seed the selection and reload.
  const selectedLayerId = outlineTarget.nodeId;
  await selectDesignLayer(projectDir, selectedLayerId);
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  frame = await waitForCanvasFrame(page, 90000);
  await settledCanvasButton(frame, 'Cancel', 'border-transparent');
  console.log('[css-class-effectiveness] outline fixture selected');
  // Where this spec stands now: the selection, the Inspector and the chips all
  // arrive — Variant reads "outline", the className field is present, and all
  // seven chips render — and every chip stays `unverified`, so the wait below
  // never clears.
  //
  // Measured, so the next session does not repeat it:
  //   - not a stylesheet problem. The preview has 19 style sheets, every one
  //     inspectable, hundreds of rules.
  //   - not a timing problem. Still unverified after 25s.
  //   - the chips carry "Waiting for the selected preview root to be
  //     verified", which is `getUnverifiedClassEffectiveness` in
  //     DesignInspectorPanel — the Inspector's placeholder for an EMPTY
  //     effectiveness map, not an analyzer verdict.
  //
  // So `cssClassEffectivenessReport` is null, or its `layerId` /
  // `sourceClassName` do not match the selection (see
  // InspectorTailwindClassSection's `effectivenessByClassName`). Start there.
  await page.mouse.move(10, 10);
  const projection = await waitFor(
    () => page.evaluate(() => {
      const variants = [...document.querySelectorAll('[aria-label="Variant prop"]')]
        .filter((candidate) => candidate instanceof HTMLSelectElement);
      const chips = [...document.querySelectorAll('[data-class-effect-status]')];
      if (variants.length === 0 || chips.length === 0) return null;
      const classStatuses = Object.fromEntries(chips.map((chip) => [
        chip.getAttribute('data-class-name'),
        chip.getAttribute('data-class-effect-status'),
      ]));
      if (
        classStatuses['hover:bg-muted/50'] === 'unverified' ||
        classStatuses['xl:col-span-3'] === 'unverified' ||
        classStatuses['data-[active=true]:opacity-100'] === 'unverified'
      ) return null;
      return {
        classStatuses,
        textDecorations: Object.fromEntries(chips.map((chip) => [
          chip.getAttribute('data-class-name'),
          getComputedStyle(chip.querySelector('.wb-inspector-tailwind-class-chip__value')).textDecorationLine,
        ])),
        variant: variants
          .map((variant) => variant.selectedOptions[0]?.textContent?.trim() ?? '')
          .find((value) => value === 'outline') ?? '',
      };
    }),
    { label: 'Props and CSS Classes for the selected Button', timeoutMs: 30000 },
  );
  console.log('[css-class-effectiveness] inspector projection ready');
  assert(
    projection.variant === 'outline',
    `Inspector Props points at the selected outline Button (${projection.variant})`,
  );
  assert(
    projection.classStatuses['border-transparent'] === 'applied',
    `the selected root's own border utility is evaluated without scanning component stylesheets (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    ['applied', 'unverified'].includes(projection.classStatuses['h-20']),
    `instance height is not falsely reported as ignored (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    ['partially-overridden', 'unverified'].includes(projection.classStatuses['p-0']),
    `padding shorthand is partial when the bounded scan can prove it, otherwise unverified (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    projection.classStatuses['hover:bg-muted/50'] === 'inactive',
    `hover is inactive rather than overridden (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    projection.classStatuses['xl:col-span-3'] === 'inactive',
    `responsive class is inactive at the current viewport (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    projection.classStatuses['data-[active=true]:opacity-100'] === 'inactive',
    `data-state class is inactive rather than overridden (${JSON.stringify(projection.classStatuses)})`,
  );
  assert(
    (
      !projection.textDecorations['border-transparent'].includes('line-through')
    ) &&
      !projection.textDecorations['h-20'].includes('line-through'),
    `only a verified ignored Inspector class is struck through (${JSON.stringify(projection.textDecorations)})`,
  );
  const ignoredChipDecoration = await page.evaluate(() => {
    const chip = document.createElement('span');
    chip.className =
      'wb-inspector-tailwind-class-chip wb-inspector-tailwind-class-chip--effect-not-forwarded';
    const value = document.createElement('span');
    value.className = 'wb-inspector-tailwind-class-chip__value';
    value.textContent = 'fixture';
    chip.append(value);
    chip.style.position = 'fixed';
    chip.style.left = '-10000px';
    document.body.append(chip);
    const decoration = getComputedStyle(value).textDecorationLine;
    chip.remove();
    return decoration;
  });
  assert(
    ignoredChipDecoration.includes('line-through'),
    `the ignored-class Inspector treatment uses a line-through (${ignoredChipDecoration})`,
  );

  const renderedProjection = await frame.evaluate((nodeId) => {
    const element = document.querySelector(`[data-wb-preview-node-id="${nodeId}"]`);
    return element
      ? {
          className: element.getAttribute('class'),
          variant: element.getAttribute('data-variant'),
        }
      : null;
  }, selectedLayerId);
  assert(
    renderedProjection?.variant === 'outline' &&
      renderedProjection.className?.includes('border-transparent'),
    `render DOM, Props, and CSS chips resolve to the same instance (${JSON.stringify(renderedProjection)})`,
  );

  const addedClasses = `${INITIAL_CLASSES} ring-4`;
  await commitRawClassName(page, addedClasses);
  await waitFor(
    async () => (await readFile(sourcePath, 'utf8')).includes(`className="${addedClasses}"`),
    { label: 'className add writeback to TSX', timeoutMs: 15000 },
  );
  await waitFor(
    () => page.evaluate(() => (
      document.querySelector('[data-class-name="ring-4"]')
        ?.getAttribute('data-class-effect-status') ?? null
    )),
    { label: 'the added class effectiveness chip', timeoutMs: 30000 },
  );

  // Same reason as above: keep the Button selected across the reload by seeding
  // it, rather than by a canvas gesture that lands on its wrapper.
  await selectDesignLayer(projectDir, selectedLayerId);
  await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
  frame = await waitForCanvasFrame(page, 90000);
  await settledCanvasButton(frame, 'Cancel', 'border-transparent');
  const reloadedStatus = await waitFor(
    () => page.evaluate(() => (
      document.querySelector('[data-class-name="ring-4"]')
        ?.getAttribute('data-class-effect-status') ?? null
    )),
    { label: 'the added class to survive reload', timeoutMs: 30000 },
  );
  assert(
    ['applied', 'unverified'].includes(reloadedStatus),
    `the added class remains present and is not falsely ignored after reload (${reloadedStatus})`,
  );

  await commitRawClassName(page, INITIAL_CLASSES);
  await waitFor(
    async () => {
      const source = await readFile(sourcePath, 'utf8');
      return source.includes(`className="${INITIAL_CLASSES}"`) && !source.includes(`${INITIAL_CLASSES} ring-4`);
    },
    { label: 'className delete writeback to TSX', timeoutMs: 15000 },
  );
  await waitFor(
    () => page.evaluate(() => !document.querySelector('[data-class-name="ring-4"]')),
    { label: 'the removed class chip to disappear', timeoutMs: 30000 },
  );

  const notForwardedTarget = await settledCanvasButton(frame, 'Not forwarded fixture');
  const notForwardedPoint = await canvasPagePoint(page, notForwardedTarget.point);
  assert(notForwardedPoint.onCanvas, 'the non-forwarding fixture is visible on the Design canvas');
  await metaClick(page, notForwardedPoint);
  const notForwardedStatus = await waitFor(
    () => page.evaluate(() => (
      document.querySelector('[data-class-name="bg-red-500"]')
        ?.getAttribute('data-class-effect-status') ?? null
    )),
    { label: 'the non-forwarded class chip', timeoutMs: 30000 },
  );
  assert(
    ['not-forwarded', 'unverified'].includes(notForwardedStatus),
    `a component that drops its projection identity remains conservative when no root can be verified (${notForwardedStatus})`,
  );
  const notForwardedDecoration = await page.evaluate(() => {
    const value = document
      .querySelector('[data-class-name="bg-red-500"]')
      ?.querySelector('.wb-inspector-tailwind-class-chip__value');
    return value ? getComputedStyle(value).textDecorationLine : '';
  });
  assert(
    notForwardedStatus === 'not-forwarded'
      ? notForwardedDecoration.includes('line-through')
      : !notForwardedDecoration.includes('line-through'),
    `only a verified non-forwarded class is struck through (${notForwardedDecoration})`,
  );
}

async function selectDesignLayer(projectDir, layerId) {
  const selection = await readFixtureSelection(projectDir);
  selection.extensions = {
    ...selection.extensions,
    activeDesignLayerId: layerId,
    selectedDesignLayerIds: [],
  };
  await writeFixtureSelection(projectDir, selection);
}

async function findCanvasButton(frame, label, requiredClass = null) {
  return waitFor(
    () => frame.evaluate((wantedLabel, wantedClass) => {
      const element = [...document.querySelectorAll('button')].find((candidate) => (
        candidate.textContent?.trim() === wantedLabel &&
        (!wantedClass || candidate.classList.contains(wantedClass))
      ));
      if (!element) return null;
      element.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = element.getBoundingClientRect();
      const nodeId = element.getAttribute('data-wb-preview-node-id') ??
        element.closest('[data-wb-preview-node-id]')?.getAttribute('data-wb-preview-node-id');
      return nodeId
        ? {
            nodeId,
            point: {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            },
          }
        : null;
    }, label, requiredClass),
    { label: `${label} source-backed canvas Button`, timeoutMs: 30000 },
  );
}

/**
 * `findCanvasButton` measures the rect in the same turn it calls
 * `scrollIntoView`, so the point it returns is where the button was before the
 * scroll settled. Clicking there lands on whatever moved into that spot, and
 * the run fails much later as "the selection never became the outline Button".
 * Re-measure once the scroll has stopped.
 */
async function settledCanvasButton(frame, label, requiredClass = null) {
  const first = await findCanvasButton(frame, label, requiredClass);
  await sleep(500);
  const settled = await findCanvasButton(frame, label, requiredClass);
  return settled ?? first;
}

async function commitRawClassName(page, value) {
  const selector = 'textarea[aria-label="className"]';
  await page.waitForSelector(selector, { visible: true, timeout: 30000 });
  await page.evaluate((textareaSelector, nextValue) => {
    const textarea = document.querySelector(textareaSelector);
    if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('Raw className textarea is unavailable');
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    valueSetter?.call(textarea, nextValue);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
  await page.click('.wb-inspector-tailwind-raw-apply');
}
