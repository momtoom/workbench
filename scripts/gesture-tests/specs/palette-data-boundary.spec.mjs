/**
 * The command palette is a data-driven runtime collection.
 *
 * Workbench owns the palette, input, and footer source nodes. Groups and item
 * rows are rendered from the `items` array and must not pretend to be
 * independently authored canvas children.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  assert,
  canvasPagePoint,
  openCanvas,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'Astryx-003';

// The Astryx-003 fixture page is spelled "CompGallary". de9ef2000, a release
// snapshot, tidied that typo here without renaming the fixture, and these three
// specs have failed on ENOENT ever since. The fixture is what main.tsx,
// pages.json and selection.json all reference, so it wins.
const GALLERY_SOURCE = 'src/workbench-pages/SamplePage/CompGallary.tsx';

export default async function paletteDataBoundarySpec({ page, baseUrl, projectDir }) {
  const source = await readFile(join(projectDir, GALLERY_SOURCE), 'utf8');
  assert(
    source.includes('items={PROJECT_COMMAND_PALETTE_ITEMS}'),
    'the palette consumes a source-backed items array',
  );
  assert(
    !source.includes('<AstryxCommandPaletteGroup'),
    'palette groups are not authored JSX children',
  );

  const frame = await openCanvas(page, baseUrl, {
    readySelector: '.astryx-command-palette-list',
  });
  await frame.evaluate(() => {
    document.querySelector('.astryx-command-palette-list')
      ?.closest('.astryx-wb-launcher')
      ?.scrollIntoView({
      block: 'center',
      inline: 'center',
    });
  });
  await sleep(800);

  await waitFor(
    () => frame.evaluate(() => (
      document.querySelectorAll('.astryx-command-palette-list [role="option"]').length >= 5
    )),
    { label: 'the data-driven command items to render', timeoutMs: 60000 },
  );
  const rendered = await frame.evaluate(() => {
    const palette = document.querySelector('.astryx-command-palette-list')
      ?.closest('.astryx-wb-launcher');
    const input = palette?.querySelector('.astryx-wb-command-palette-input');
    const footer = palette?.querySelector(
      '.astryx-wb-command-palette-footer-slot, .astryx-wb-command-palette-footer',
    );
    const groups = [...(palette?.querySelectorAll('[role="group"]') ?? [])];
    const options = [...(palette?.querySelectorAll('[role="option"]') ?? [])];
    return {
      paletteId: palette?.getAttribute('data-wb-preview-node-id') ?? null,
      inputId: input?.getAttribute('data-wb-preview-node-id') ?? null,
      footerId: footer?.getAttribute('data-wb-preview-node-id') ?? null,
      hasInput: Boolean(input),
      hasFooter: Boolean(footer),
      groupIds: groups
        .map((group) => group.getAttribute('data-wb-preview-node-id'))
        .filter(Boolean),
      optionIds: options
        .map((option) => option.getAttribute('data-wb-preview-node-id'))
        .filter(Boolean),
      optionIconCount: options.filter((option) => (
        option.querySelector('svg, .astryx-workbench-icon')
      )).length,
      labels: options.map((option) => (option.textContent ?? '').trim()),
      endAlignment: (() => {
        const option = options.find((candidate) => (
          [...candidate.querySelectorAll('*')].some((element) => (
            element.children.length === 0 && element.textContent?.trim() === 'End'
          ))
        ));
        const root = option?.querySelector('.astryx-wb-search-item');
        const end = option
          ? [...option.querySelectorAll('*')].find((element) => (
              element.children.length === 0 && element.textContent?.trim() === 'End'
            ))
          : null;
        if (!option || !root || !end) return null;
        const optionRect = option.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const endRect = end.getBoundingClientRect();
        return {
          endToOptionRight: optionRect.right - endRect.right,
          optionWidth: optionRect.width,
          rootWidth: rootRect.width,
        };
      })(),
      hiddenGroupSources: palette?.querySelectorAll(
        '.astryx-wb-command-palette-group-sources',
      ).length ?? -1,
    };
  });

  assert(
    rendered.paletteId,
    `the palette remains a source-backed selectable component (${JSON.stringify(rendered)})`,
  );
  assert(
    rendered.hasInput && rendered.inputId,
    `the authored input remains a selectable source child (${JSON.stringify(rendered)})`,
  );
  assert(
    rendered.hasFooter && rendered.footerId,
    `the authored footer remains a selectable source child (${JSON.stringify(rendered)})`,
  );
  assert(rendered.groupIds.length === 0, 'runtime groups do not claim authored node ids');
  assert(rendered.optionIds.length === 0, 'runtime item rows do not claim authored node ids');
  assert(rendered.optionIconCount === 5, 'every data-owned command preserves its icon');
  assert(
    rendered.endAlignment &&
      rendered.endAlignment.rootWidth >= rendered.endAlignment.optionWidth - 32 &&
      rendered.endAlignment.endToOptionRight <= 32,
    `command end labels stay aligned to the row end (${JSON.stringify(rendered.endAlignment)})`,
  );
  assert(rendered.hiddenGroupSources === 0, 'the palette no longer renders hidden group markers');
  assert(
    rendered.labels.some((label) => label.includes('Open project')) &&
      rendered.labels.some((label) => label.includes('Export code')),
    `the items array renders the expected commands (${JSON.stringify(rendered.labels)})`,
  );

  const pointerTargets = await frame.evaluate(() => {
    const input = document.querySelector('.astryx-wb-command-palette-input');
    const options = [...document.querySelectorAll('.astryx-command-palette-list [role="option"]')];
    const firstRect = options[0]?.getBoundingClientRect();
    const secondRect = options[1]?.getBoundingClientRect();
    input?.focus();
    return {
      first: firstRect
        ? { x: firstRect.x + firstRect.width / 2, y: firstRect.y + firstRect.height / 2 }
        : null,
      second: secondRect
        ? { x: secondRect.x + secondRect.width / 2, y: secondRect.y + secondRect.height / 2 }
        : null,
    };
  });
  assert(pointerTargets.first && pointerTargets.second, 'command rows expose pointer targets');
  const firstPoint = await canvasPagePoint(page, pointerTargets.first);
  const secondPoint = await canvasPagePoint(page, pointerTargets.second);
  assert(firstPoint.onCanvas && secondPoint.onCanvas, 'command rows are visible inside the canvas');

  await page.mouse.move(firstPoint.x, firstPoint.y);
  await sleep(100);
  await frame.focus('.astryx-wb-command-palette-input');
  await page.keyboard.press('ArrowDown');
  await sleep(100);
  const keyboardState = await frame.evaluate(() => {
    const palette = document.querySelector('.astryx-command-palette-list')
      ?.closest('.astryx-wb-launcher');
    const options = [...(palette?.querySelectorAll('[role="option"]') ?? [])];
    return {
      modality: palette?.getAttribute('data-astryx-command-palette-input-modality'),
      pointerEvents: options.map((option) => getComputedStyle(option).pointerEvents),
      backgrounds: options.map((option) => getComputedStyle(option).backgroundColor),
      hovered: options.filter((option) => option.matches(':hover')).length,
    };
  });
  const keyboardVisibleHighlights = keyboardState.backgrounds.filter((value) => (
    value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)'
  )).length;
  assert(
    keyboardState.modality === 'keyboard' &&
      keyboardState.pointerEvents.every((value) => value === 'none') &&
      keyboardVisibleHighlights === 1,
    `keyboard navigation suppresses stale pointer hover (${JSON.stringify(keyboardState)})`,
  );

  await page.mouse.move(secondPoint.x + 2, secondPoint.y + 2);
  await sleep(100);
  await page.mouse.move(secondPoint.x + 4, secondPoint.y + 4);
  await sleep(100);
  const pointerState = await frame.evaluate(() => {
    const palette = document.querySelector('.astryx-command-palette-list')
      ?.closest('.astryx-wb-launcher');
    const options = [...(palette?.querySelectorAll('[role="option"]') ?? [])];
    return {
      modality: palette?.getAttribute('data-astryx-command-palette-input-modality'),
      pointerEvents: options.map((option) => getComputedStyle(option).pointerEvents),
      backgrounds: options.map((option) => getComputedStyle(option).backgroundColor),
      hovered: options.filter((option) => option.matches(':hover')).length,
    };
  });
  const pointerVisibleHighlights = pointerState.backgrounds.filter((value) => (
    value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)'
  )).length;
  assert(
    pointerState.modality === 'pointer' &&
      pointerState.pointerEvents.every((value) => value !== 'none') &&
      pointerState.hovered === 1 &&
      pointerVisibleHighlights === 1,
    `physical pointer movement restores one hover target (${JSON.stringify(pointerState)})`,
  );

}
