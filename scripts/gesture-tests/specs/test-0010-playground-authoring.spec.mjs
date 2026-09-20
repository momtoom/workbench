/**
 * The case-study playground is a deliberately small Workbench, so it must keep
 * the same gesture contract: selection owns dragging, ordinary control clicks
 * select, Alt/Option grants runtime interaction, and table chrome never changes
 * the component's own overflow geometry.
 */
import { assert, sleep, waitFor } from '../helpers.mjs';

export const fixture = 'Test-0010';

const pageUrl = (baseUrl) =>
  `${baseUrl}/page-preview.html?appearance=dark&source=${encodeURIComponent('src/workbench-pages/DesignProcessWithAI.tsx')}` +
  `&title=${encodeURIComponent('Untitled page 3')}&tokenModes=${encodeURIComponent(JSON.stringify({
    'astryx-theme': 'neutral',
    'astryx-components': 'default',
  }))}`;

async function clickCase(page, label) {
  await page.evaluate((text) => {
    const labelNode = [...document.querySelectorAll('button, button *')]
      .find((node) => node.textContent?.trim() === text);
    labelNode?.closest('button')?.click();
  }, label);
  await sleep(120);
}

async function centers(page, selectors) {
  return page.evaluate((items) => items.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }), selectors);
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * step) / 6,
      from.y + ((to.y - from.y) * step) / 6,
    );
    await sleep(45);
  }
  await page.mouse.up();
  await sleep(120);
}

export default async function test0010PlaygroundAuthoringSpec({ page, baseUrl }) {
  await page.goto(pageUrl(baseUrl), { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.wb-play-canvas', { timeout: 60000 });
  await page.evaluate(() => document.querySelector('.wb-play-canvas')?.scrollIntoView({ block: 'center' }));

  const cardOrder = () => page.evaluate(() =>
    [...document.querySelectorAll('.wb-play-canvas [data-play-card]')]
      .map((node) => node.getAttribute('data-play-card')),
  );

  // The grid owns selection initially. Pressing a card must not silently make
  // that unselected card the drag subject.
  let [a, b] = await centers(page, ['[data-play-card="A"]', '[data-play-card="B"]']);
  await drag(page, a, b);
  assert((await cardOrder()).join('|') === 'A|B|C|D', 'container selection blocks an unselected card drag');

  // Select the first card from Layers, then the same gesture is allowed. The
  // layer click is deterministic in headless Chrome, whose synthesized double
  // click delivery differs from the in-app browser's native pointer stream.
  await page.evaluate(() => [...document.querySelectorAll('[aria-label="레이어 트리"] button')]
    .find((button) => button.textContent?.trim() === 'AstryxCard')?.click());
  [a, b] = await centers(page, ['[data-play-card="A"]', '[data-play-card="B"]']);
  await drag(page, a, b);
  assert((await cardOrder()).join('|') === 'B|A|C|D', 'the selected card is the drag subject');

  await clickCase(page, '폼');
  await waitFor(() => page.$('[data-play-card="name"]'), { label: 'dialog form fields' });

  const formGeometry = await page.evaluate(() => {
    const dialog = document.querySelector('.astryx-wb-dialog');
    const body = document.querySelector('[data-play-wrap="stack"]');
    const textarea = document.querySelector('[data-play-card="note"] textarea');
    if (!dialog || !body || !textarea) return null;
    const dialogRect = dialog.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    return {
      bodyHeight: bodyRect.height,
      dialogHeight: dialogRect.height,
      resize: getComputedStyle(textarea).resize,
    };
  });
  assert(formGeometry && formGeometry.bodyHeight < 540,
    `start-justified dialog stack is content-sized (${JSON.stringify(formGeometry)})`);
  assert(formGeometry && formGeometry.dialogHeight < 700,
    `dialog does not retain a fixed empty tail (${JSON.stringify(formGeometry)})`);
  assert(formGeometry?.resize === 'none',
    `Design-mode textarea does not expose a misregistered native resize grip (${JSON.stringify(formGeometry)})`);

  const layerLabels = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="레이어 트리"] button')]
      .map((button) => button.textContent?.trim()).filter(Boolean),
  );
  assert(layerLabels.filter((label) => label === 'AstryxSelectorOption').length === 4,
    'selector options are visible editable child nodes in Layers');

  // Real branches disclose; Title and Description leaves do not.
  const disclosure = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="레이어 트리"] button[aria-expanded]')]
      .map((button) => button.getAttribute('aria-label')),
  );
  assert(disclosure.includes('AstryxDialog 접기'), 'dialog is a collapsible branch');
  assert(disclosure.filter((label) => label === 'AstryxStack 접기').length === 2,
    'outer Stack and Header Stack are collapsible branches');
  assert(!disclosure.some((label) => label?.startsWith('AstryxText ')), 'text leaves have no fake disclosure');

  // The two Header Stack leaves are true siblings, so Layers can reorder them
  // and the rendered header must follow the same order immediately.
  const [titleRow, descriptionRow] = await centers(page, [
    '[data-play-tree-card="__wrap"][data-play-tree-node="title"]',
    '[data-play-tree-card="__wrap"][data-play-tree-node="description"]',
  ]);
  await drag(page, titleRow, descriptionRow);
  const headerOrder = await page.evaluate(() =>
    [...(document.querySelector('[data-play-wrap="header"]')?.querySelectorAll('[data-play-wrap="title"], [data-play-wrap="description"]') ?? [])]
      .map((node) => node.getAttribute('data-play-wrap')),
  );
  assert(headerOrder.join('|') === 'description|title', 'Layers reorder Header Stack leaves in the canvas');

  // Select TextInput from Layers and drag directly from its runtime input.
  await page.evaluate(() => [...document.querySelectorAll('[aria-label="레이어 트리"] button')]
    .find((button) => button.textContent?.trim() === 'AstryxTextInput')?.click());
  await page.evaluate(() => document.querySelector('[data-play-card="name"]')?.scrollIntoView({ block: 'center' }));
  const [inputPoint, rolePoint] = await centers(page, [
    '[data-play-card="name"] input',
    '[data-play-card="role"]',
  ]);
  await drag(page, inputPoint, rolePoint);
  assert((await cardOrder()).join('|') === 'role|name|note|notify|submit',
    'the selected field reorders from directly over its runtime input');

  // A normal input click stays editor-owned; Alt/Option grants focus.
  const [namePoint] = await centers(page, ['[data-play-card="name"] input']);
  await page.mouse.click(namePoint.x, namePoint.y);
  assert(await page.evaluate(() => document.activeElement?.tagName !== 'INPUT'),
    'ordinary input click does not activate the runtime control');
  await page.keyboard.down('Alt');
  await page.mouse.click(namePoint.x, namePoint.y);
  await page.keyboard.up('Alt');
  assert(await page.evaluate(() => document.activeElement?.tagName === 'INPUT'),
    'Alt/Option+click focuses the runtime input');

  // Selector follows the same scoped chord.
  const [comboPoint] = await centers(page, ['[data-play-card="role"] [role="combobox"]']);
  await page.mouse.click(comboPoint.x, comboPoint.y);
  assert(await page.$eval('[data-play-card="role"] [role="combobox"]', (node) => node.getAttribute('aria-expanded')) === 'false',
    'ordinary selector click remains editor-owned');
  await page.keyboard.down('Alt');
  await page.mouse.click(comboPoint.x, comboPoint.y);
  await page.keyboard.up('Alt');
  await waitFor(
    () => page.$eval('[data-play-card="role"] [role="combobox"]', (node) => node.getAttribute('aria-expanded') === 'true'),
    { label: 'selector to open on Alt/Option+click' },
  );

  // A normal click on an open portal row selects the authored option for
  // editing; it does not activate the runtime selection or close the menu.
  const engineerPoint = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find((node) =>
      node.querySelector('.astryx-wb-selector-option-label')?.textContent?.trim() === '엔지니어');
    if (!option) return null;
    const rect = option.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  assert(engineerPoint, 'the role option portal row is visible');
  await page.mouse.click(engineerPoint.x, engineerPoint.y);
  await sleep(100);
  assert(await page.$eval('[data-play-card="role"] [role="combobox"]', (node) => node.getAttribute('aria-expanded')) === 'true',
    'editor-owned option click keeps the popup open');
  assert(await page.$eval('[data-play-card="role"] [role="combobox"]', (node) => node.textContent?.includes('디자이너')),
    'editor-owned option click does not mutate runtime selection');
  assert(await page.$eval('[aria-label="인스펙터 속성 패널"]', (node) => node.textContent?.includes('AstryxSelectorOption')),
    'portal option click selects AstryxSelectorOption in Inspector');
  const optionInspectorProps = await page.$eval('[aria-label="인스펙터 속성 패널"]', (node) => node.textContent ?? '');
  for (const prop of ['label', 'value', 'description', 'icon', 'endLabel', 'isDisabled']) {
    assert(optionInspectorProps.includes(prop), `AstryxSelectorOption exposes its ${prop} prop`);
  }
  const portalRingGeometry = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find((node) =>
      node.querySelector('.astryx-wb-selector-option-label')?.textContent?.trim() === '엔지니어');
    const ring = document.querySelector('[data-play-portal-option-ring="true"]');
    if (!option || !ring) return null;
    const aRect = option.getBoundingClientRect();
    const bRect = ring.getBoundingClientRect();
    const canvas = document.querySelector('.wb-play-canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    return {
      error: Math.max(
        Math.abs(aRect.left - bRect.left),
        Math.abs(aRect.top - bRect.top),
        Math.abs(aRect.right - bRect.right),
        Math.abs(aRect.bottom - bRect.bottom),
      ),
      option: { left: aRect.left, top: aRect.top, right: aRect.right, bottom: aRect.bottom },
      ring: { left: bRect.left, top: bRect.top, right: bRect.right, bottom: bRect.bottom },
      canvas: canvasRect ? {
        left: canvasRect.left,
        top: canvasRect.top,
        width: canvasRect.width,
        height: canvasRect.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
        clientLeft: canvas.clientLeft,
        clientTop: canvas.clientTop,
        scrollLeft: canvas.scrollLeft,
        scrollTop: canvas.scrollTop,
      } : null,
      ringStyle: { left: ring.style.left, top: ring.style.top, width: ring.style.width, height: ring.style.height },
      offsetParent: ring.offsetParent ? (() => {
        const rect = ring.offsetParent.getBoundingClientRect();
        return { className: ring.offsetParent.className, left: rect.left, top: rect.top, width: rect.width, height: rect.height, offsetWidth: ring.offsetParent.offsetWidth, offsetHeight: ring.offsetParent.offsetHeight };
      })() : null,
    };
  });
  assert(portalRingGeometry != null && portalRingGeometry.error < 1,
    `selector option ring follows its portal row (${JSON.stringify(portalRingGeometry)})`);

  const optionTextInput = '[aria-label="인스펙터 속성 패널"] input';
  await page.focus(optionTextInput);
  await page.$eval(optionTextInput, (input) => input.select());
  await page.keyboard.type('UX 엔지니어');
  await waitFor(
    () => page.evaluate(() => [...document.querySelectorAll('[role="option"]')].some((node) =>
      node.querySelector('.astryx-wb-selector-option-label')?.textContent?.trim() === 'UX 엔지니어')),
    { label: 'edited selector option label in the open portal' },
  );
  assert(await page.$eval('[aria-label="소스 패널"]', (node) => node.textContent?.includes('label="UX 엔지니어"')),
    'selector option edit updates the emitted code preview');

  const optionInputs = await page.$$('[aria-label="인스펙터 속성 패널"] input');
  assert(optionInputs.length >= 4, 'selector option exposes text inputs for label, value, description, and endLabel');
  await optionInputs[2].click({ clickCount: 3 });
  await page.keyboard.type('프론트엔드 구현');
  await waitFor(
    () => page.evaluate(() => [...document.querySelectorAll('[role="option"]')].some((node) =>
      node.textContent?.includes('UX 엔지니어') && node.textContent?.includes('프론트엔드 구현'))),
    { label: 'edited selector option description in the open portal' },
  );
  assert(await page.$eval('[aria-label="소스 패널"]', (node) => node.textContent?.includes('description="프론트엔드 구현"')),
    'selector option description updates the emitted code preview');
  await waitFor(
    () => page.$eval('[data-play-card="role"] [role="combobox"]', (node) => node.getAttribute('aria-expanded') === 'true'),
    { label: 'selector editor session to reopen after Inspector edit' },
  );

  // Portal rows are authored siblings even though they render outside the
  // selector's in-flow DOM. Dragging the selected row must reorder the open
  // popup, Layers, and source as one operation.
  const optionDragPoints = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[role="option"]')].filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const from = rows.find((node) => node.textContent?.includes('UX 엔지니어'));
    const to = rows.find((node) => node.textContent?.includes('프로덕트 매니저'));
    if (!from || !to) return null;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    return {
      from: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      to: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
    };
  });
  assert(optionDragPoints, 'selected portal option and its sibling are visible for drag');
  await page.mouse.move(optionDragPoints.from.x, optionDragPoints.from.y);
  await page.mouse.down();
  for (let step = 1; step <= 6; step += 1) {
    await page.mouse.move(
      optionDragPoints.from.x + ((optionDragPoints.to.x - optionDragPoints.from.x) * step) / 6,
      optionDragPoints.from.y + ((optionDragPoints.to.y - optionDragPoints.from.y) * step) / 6,
    );
    await sleep(45);
  }
  const portalDragState = await page.evaluate(() => ({
    expanded: document.querySelector('[data-play-card="role"] [role="combobox"]')?.getAttribute('aria-expanded'),
    ghost: Boolean(document.querySelector('.wb-play-ghost')),
  }));
  assert(portalDragState.expanded === 'true',
    `editor-owned portal drag keeps the popup open while moving (${JSON.stringify(portalDragState)})`);
  assert(Boolean(await page.$('.wb-play-ghost')), 'selected portal option produces a drag ghost');
  await page.mouse.up();
  await sleep(120);
  const reorderedOptions = await page.evaluate(() => {
    const roleLabels = new Set(['디자이너', '프로덕트 매니저', 'UX 엔지니어', '뷰어']);
    return [...document.querySelectorAll('[role="option"]')]
      .map((node) => node.querySelector('.astryx-wb-selector-option-label')?.textContent?.trim())
      .filter((label) => label && roleLabels.has(label));
  });
  assert(reorderedOptions.join('|') === '디자이너|프로덕트 매니저|UX 엔지니어|뷰어',
    `portal options reorder in place (${reorderedOptions.join('|')})`);
  const reorderedOptionSource = await page.$eval('[aria-label="소스 패널"]', (node) => {
    const text = node.textContent ?? '';
    return { engineer: text.indexOf('label="UX 엔지니어"'), pm: text.indexOf('label="프로덕트 매니저"') };
  });
  assert(reorderedOptionSource.pm >= 0 && reorderedOptionSource.engineer >= 0 && reorderedOptionSource.pm < reorderedOptionSource.engineer,
    `portal option drag updates source order (${JSON.stringify(reorderedOptionSource)})`);

  await clickCase(page, '테이블');
  await page.setViewport({ width: 1600, height: 900 });
  await sleep(160);

  // The Header Stack and AstryxTable are siblings in the outer Stack. The
  // selected Header owns the drag even when the pointer lands on its nested
  // title, and the same committed order must appear in canvas, Layers, and the
  // source projection.
  await page.evaluate(() => {
    const row = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="header"]');
    [...(row?.querySelectorAll('button') ?? [])].at(-1)?.click();
    document.querySelector('[data-play-wrap="header"]')?.scrollIntoView({ block: 'center' });
  });
  const [headerPoint, tablePoint] = await centers(page, [
    '[data-play-wrap="header"] [data-play-wrap="title"]',
    '[data-play-container]',
  ]);
  await drag(page, headerPoint, tablePoint);
  const wrapOrder = await page.evaluate(() =>
    [...document.querySelectorAll('[data-play-wrap="header"], [data-play-container]')]
      .map((node) => node.hasAttribute('data-play-container') ? 'container' : 'header'),
  );
  assert(wrapOrder.join('|') === 'container|header', 'selected Header Stack reorders with the table in the canvas');
  const layerOrder = await page.evaluate(() => {
    const header = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="header"]');
    const container = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="container"]');
    return header && container ? {
      headerTop: header.getBoundingClientRect().top,
      containerTop: container.getBoundingClientRect().top,
    } : null;
  });
  assert(layerOrder && layerOrder.containerTop < layerOrder.headerTop,
    `Layers follows the Header/Table order (${JSON.stringify(layerOrder)})`);
  const sourceOrder = await page.$eval('[aria-label="소스 패널"]', (node) => {
    const text = node.textContent ?? '';
    return { table: text.indexOf('<AstryxTable'), title: text.indexOf('<AstryxText as="h3"') };
  });
  assert(sourceOrder.table >= 0 && sourceOrder.title >= 0 && sourceOrder.table < sourceOrder.title,
    `source projection follows the Header/Table order (${JSON.stringify(sourceOrder)})`);

  // Once the container branch is first, its expanded row children correctly
  // sit before the following Header branch. Collapse it just as a designer
  // would before moving a long sibling branch back through the tree.
  await page.evaluate(() => {
    const container = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="container"]');
    [...(container?.querySelectorAll('button') ?? [])].find((button) => button.hasAttribute('aria-expanded'))?.click();
  });
  await sleep(80);
  assert(await page.evaluate(() =>
    document.querySelector('[data-play-tree-card="WB-241"]') == null),
  'collapsing the table branch hides its row children');
  const treeReturnPoints = await page.evaluate(() => {
    const header = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="header"]');
    const container = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="container"]');
    if (!header || !container) return null;
    const a = header.getBoundingClientRect();
    const b = container.getBoundingClientRect();
    return {
      from: { x: a.left + a.width / 2, y: a.top + a.height / 2 },
      to: { x: b.left + b.width / 2, y: b.top + 2 },
    };
  });
  assert(treeReturnPoints, 'Header/Table layer rows are visible for tree reorder');
  await drag(page, treeReturnPoints.from, treeReturnPoints.to);
  const returnedWrapOrder = await page.evaluate(() =>
    [...document.querySelectorAll('[data-play-wrap="header"], [data-play-container]')]
      .map((node) => node.hasAttribute('data-play-container') ? 'container' : 'header'),
  );
  assert(returnedWrapOrder.join('|') === 'header|container', 'Layers can move Header Stack back before the table');
  const returnedSourceOrder = await page.$eval('[aria-label="소스 패널"]', (node) => {
    const text = node.textContent ?? '';
    return { table: text.indexOf('<AstryxTable'), title: text.indexOf('<AstryxText as="h3"') };
  });
  assert(returnedSourceOrder.title >= 0 && returnedSourceOrder.table >= 0 && returnedSourceOrder.title < returnedSourceOrder.table,
    `Layers reorder is persisted in the source projection (${JSON.stringify(returnedSourceOrder)})`);
  await page.evaluate(() => {
    const container = document.querySelector('[data-play-tree-card="__wrap"][data-play-tree-node="container"]');
    [...(container?.querySelectorAll('button') ?? [])].find((button) => button.hasAttribute('aria-expanded'))?.click();
  });
  await sleep(80);

  const tableFillGeometry = await page.evaluate(() => {
    const stack = document.querySelector('[data-play-wrap="stack"]');
    const wrapper = document.querySelector('.astryx-table-scroll-wrapper');
    if (!stack || !wrapper) return null;
    return {
      stackWidth: stack.getBoundingClientRect().width,
      tableWidth: wrapper.getBoundingClientRect().width,
    };
  });
  assert(
    tableFillGeometry != null &&
      tableFillGeometry.tableWidth >= tableFillGeometry.stackWidth &&
      tableFillGeometry.tableWidth - tableFillGeometry.stackWidth <= 48,
    `table fills its working surface and only adds its intended bleed (${JSON.stringify(tableFillGeometry)})`,
  );

  // Header chrome is part of AstryxTable, so an ordinary header click selects
  // the table container rather than the surrounding Stack.
  const [headPoint] = await centers(page, ['.wb-play-canvas .astryx-table-scroll-wrapper thead th']);
  await page.mouse.click(headPoint.x, headPoint.y);
  await sleep(80);
  const tableHeaderSelection = await page.evaluate(({ x, y }) => ({
    hit: document.elementFromPoint(x, y)?.outerHTML.slice(0, 300) ?? null,
    inspector: document.querySelector('[data-play-panel="inspector"]')?.textContent?.slice(0, 200) ?? null,
    selected: [...document.querySelectorAll('.wb-play-canvas > span')]
      .some((node) => node.textContent === 'AstryxTable' && getComputedStyle(node).boxShadow !== 'none'),
  }), headPoint);
  assert(tableHeaderSelection.selected,
    `table header click selects AstryxTable (${JSON.stringify(tableHeaderSelection)})`);

  await page.setViewport({ width: 900, height: 900 });
  await sleep(160);
  const tableGeometry = await page.evaluate(() => {
    const wrapper = document.querySelector('.astryx-table-scroll-wrapper');
    const table = wrapper?.querySelector('table');
    return wrapper && table ? {
      clientWidth: wrapper.clientWidth,
      scrollWidth: wrapper.scrollWidth,
      overflowX: getComputedStyle(wrapper).overflowX,
      tableWidth: table.getBoundingClientRect().width,
    } : null;
  });
  assert(tableGeometry?.overflowX === 'auto', 'Astryx owns horizontal table overflow');
  assert(tableGeometry.scrollWidth > tableGeometry.clientWidth, 'narrow table has real horizontal overflow');
  assert(tableGeometry.tableWidth > tableGeometry.clientWidth, 'the table remains wider than its viewport');

  const [scrollPoint] = await centers(page, ['.astryx-table-scroll-wrapper']);
  await page.mouse.move(scrollPoint.x, scrollPoint.y);
  await page.mouse.wheel({ deltaX: 180 });
  await sleep(100);
  assert(await page.$eval('.astryx-table-scroll-wrapper', (node) => node.scrollLeft) > 0,
    'horizontal wheel scroll reaches the Astryx wrapper');

  // The selected container ring targets the bleed/scroll wrapper exactly.
  const ringMatch = await page.evaluate(() => {
    const canvas = document.querySelector('.wb-play-canvas');
    const wrapper = canvas?.querySelector('.astryx-table-scroll-wrapper');
    const ring = [...(canvas?.children ?? [])].find((node) =>
      node.textContent === 'AstryxTable' && getComputedStyle(node).boxShadow !== 'none');
    if (!wrapper || !ring) return null;
    const aRect = wrapper.getBoundingClientRect();
    const bRect = ring.getBoundingClientRect();
    return Math.max(
      Math.abs(aRect.left - bRect.left),
      Math.abs(aRect.top - bRect.top),
      Math.abs(aRect.right - bRect.right),
      Math.abs(aRect.bottom - bRect.bottom),
    );
  });
  assert(ringMatch != null && ringMatch < 1, `table ring follows bleed bounds (${ringMatch}px max error)`);

  await page.setViewport({ width: 1600, height: 900 });
  await clickCase(page, '내비게이션');
  await waitFor(() => page.$('[data-play-card="overview"]'), { label: 'navigation sample items' });

  const navigationLayers = await page.evaluate(() => ({
    items: [...document.querySelectorAll('[aria-label="레이어 트리"] [data-play-tree-card]')]
      .filter((node) => node.getAttribute('data-play-tree-card') !== '__wrap')
      .map((node) => node.textContent?.trim()),
    root: [...document.querySelectorAll('[aria-label="레이어 트리"] button')]
      .some((button) => button.textContent?.trim() === 'AstryxSideNavSection'),
  }));
  assert(navigationLayers.root, 'navigation sample exposes AstryxSideNavSection in Layers');
  assert(navigationLayers.items.filter((label) => label === 'AstryxSideNavItem').length === 4,
    `navigation sample exposes four editable items (${JSON.stringify(navigationLayers)})`);

  await page.evaluate(() => {
    const rootButton = [...document.querySelectorAll('[aria-label="레이어 트리"] button')]
      .find((button) => button.textContent?.trim() === 'AstryxSideNavSection');
    rootButton?.click();
  });
  await waitFor(
    () => page.$eval(
      '[aria-label="인스펙터 속성 패널"]',
      (node) => node.textContent?.includes('AstryxSideNavSection'),
    ),
    { label: 'AstryxSideNavSection inspector' },
  );
  const rootInputs = await page.$$('[aria-label="인스펙터 속성 패널"] input');
  assert(rootInputs.length >= 3, 'SideNavSection exposes title, subtitle, and endLabel text props');
  await rootInputs[0].focus();
  await rootInputs[0].evaluate((input) => input.select());
  await page.keyboard.type('워크스페이스');
  await waitFor(
    () => page.evaluate(() => document.querySelector('[data-play-container]')?.textContent?.includes('워크스페이스')),
    { label: 'edited navigation section title' },
  );
  assert(await page.$eval('[aria-label="소스 패널"]', (node) => node.textContent?.includes('title="워크스페이스"')),
    'navigation section edit updates the emitted source');

  await page.evaluate(() => document.querySelector('[data-play-tree-card="overview"] button')?.click());
  await sleep(80);
  const navigationInspector = await page.$eval('[aria-label="인스펙터 속성 패널"]', (node) => node.textContent ?? '');
  for (const prop of [
    'label', 'href', 'endLabel', 'icon', 'size', 'emphasis',
    'collapsible', 'defaultIsCollapsed', 'isDisabled', 'isSelected',
  ]) {
    assert(navigationInspector.includes(prop), `AstryxSideNavItem exposes its ${prop} prop`);
  }

  const itemInputs = await page.$$('[aria-label="인스펙터 속성 패널"] input');
  await itemInputs[0].focus();
  await itemInputs[0].evaluate((input) => input.select());
  await page.keyboard.type('대시보드');
  await waitFor(
    () => page.evaluate(() => document.querySelector('[data-play-card="overview"]')?.textContent?.includes('대시보드')),
    { label: 'edited navigation item label' },
  );
  assert(await page.$eval('[aria-label="소스 패널"]', (node) => node.textContent?.includes('label="대시보드"')),
    'navigation item edit updates the emitted source');

  const [navigationLinkPoint] = await centers(page, ['[data-play-card="overview"] a']);
  await page.mouse.click(navigationLinkPoint.x, navigationLinkPoint.y);
  assert(await page.evaluate(() => location.hash) === '',
    'ordinary navigation click remains editor-owned');
  await page.keyboard.down('Alt');
  await page.mouse.click(navigationLinkPoint.x, navigationLinkPoint.y);
  await page.keyboard.up('Alt');
  await sleep(80);
  const navigationRuntimeResult = await page.evaluate(() => {
    const anchor = document.querySelector('[data-play-card="overview"] a');
    return { hash: location.hash, href: anchor?.getAttribute('href') ?? null };
  });
  assert(navigationRuntimeResult.href?.startsWith('#') && navigationRuntimeResult.hash === navigationRuntimeResult.href,
    `Alt/Option+click grants the navigation item its runtime link behavior (${JSON.stringify(navigationRuntimeResult)})`);
  await page.evaluate(() => document.querySelector('.wb-play-canvas')?.scrollIntoView({ block: 'center' }));
  await sleep(80);

  const [overviewPoint, componentsPoint] = await centers(page, [
    '[data-play-card="overview"]',
    '[data-play-card="components"]',
  ]);
  await drag(page, overviewPoint, componentsPoint);
  const navigationCardOrder = await cardOrder();
  assert(navigationCardOrder.join('|') === 'components|overview|tokens|reviews',
    `the selected navigation item reorders in the canvas (${navigationCardOrder.join('|')})`);
  const navigationSourceOrder = await page.$eval('[aria-label="소스 패널"]', (node) => {
    const text = node.textContent ?? '';
    return { components: text.indexOf('label="Components"'), overview: text.indexOf('label="대시보드"') };
  });
  assert(navigationSourceOrder.components >= 0 && navigationSourceOrder.overview >= 0 && navigationSourceOrder.components < navigationSourceOrder.overview,
    `navigation drag updates source order (${JSON.stringify(navigationSourceOrder)})`);
}
