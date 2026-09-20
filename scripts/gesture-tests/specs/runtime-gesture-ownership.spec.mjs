/**
 * Runtime gesture ownership must survive the Design editor's selection and
 * drag handlers. This spec uses a dedicated page in the isolated fixture so
 * gesture components can be added here without depending on catalog layout.
 *
 * Coverage includes horizontal ScrollArea pointer dragging and MessageScroller
 * jump buttons so both drag and click runtime gestures are exercised through
 * the iframe rather than inferred from component source.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  altDrag,
  altClick,
  assert,
  canvasPagePoint,
  openCanvas,
  readActiveDesignLayerId,
  selectFixtureDesignPage,
  sleep,
  waitFor,
} from '../helpers.mjs';

export const fixture = 'SHADCN-002';

const PAGE_ID = 'page-runtime-gesture-harness';
const SOURCE_FILE = 'src/workbench-pages/RuntimeGestureHarness.tsx';
const HORIZONTAL_SCROLL_AREA = '[data-runtime-gesture="horizontal-scroll-area"]';
const MESSAGE_SCROLLER = '[data-runtime-gesture="message-scroller"]';

const FIXTURE_SOURCE = `import '../workbench-tokens.css'

import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerViewport } from '../components/ui/message-scroller'

export default function RuntimeGestureHarnessPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '48px' }}>
      <ScrollArea
        data-runtime-gesture="horizontal-scroll-area"
        style={{ width: '420px', padding: '16px', border: '1px solid rgb(203 213 225)', borderRadius: '12px' }}
      >
        <div style={{ display: 'flex', width: '760px', gap: '16px', paddingBottom: '16px' }}>
          <div style={{ width: '180px', flex: '0 0 auto', padding: '20px' }}>Runtime item 1</div>
          <div style={{ width: '180px', flex: '0 0 auto', padding: '20px' }}>Runtime item 2</div>
          <div style={{ width: '180px', flex: '0 0 auto', padding: '20px' }}>Runtime item 3</div>
          <div style={{ width: '180px', flex: '0 0 auto', padding: '20px' }}>Runtime item 4</div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <MessageScroller
        autoScroll
        defaultScrollPosition="end"
        data-runtime-gesture="message-scroller"
        style={{ width: '420px', height: '240px', marginTop: '48px', padding: '16px', border: '1px solid rgb(203 213 225)', borderRadius: '12px' }}
      >
        <MessageScrollerViewport>
          <MessageScrollerContent style={{ gap: '16px' }}>
            <MessageScrollerItem style={{ minHeight: '96px', padding: '12px' }}>Runtime message 1</MessageScrollerItem>
            <MessageScrollerItem style={{ minHeight: '96px', padding: '12px' }}>Runtime message 2</MessageScrollerItem>
            <MessageScrollerItem style={{ minHeight: '96px', padding: '12px' }}>Runtime message 3</MessageScrollerItem>
            <MessageScrollerItem style={{ minHeight: '96px', padding: '12px' }}>Runtime message 4</MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start" />
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </main>
  )
}
`;

export default async function runtimeGestureOwnershipSpec({ page, baseUrl, projectDir }) {
  await installFixturePage(projectDir);
  await selectFixtureDesignPage(projectDir, { pageId: PAGE_ID, sourceFile: SOURCE_FILE });

  const frame = await openCanvas(page, baseUrl, { readySelector: HORIZONTAL_SCROLL_AREA });
  const geometry = await waitFor(
    () => frame.evaluate((rootSelector) => {
      const root = document.querySelector(rootSelector);
      const viewport = root?.querySelector('[data-slot="scroll-area-viewport"]');
      const track = root?.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]');
      const thumb = track?.querySelector('[data-slot="scroll-area-thumb"]');
      if (!(viewport instanceof HTMLElement) || !(track instanceof HTMLElement) || !(thumb instanceof HTMLElement)) {
        return null;
      }
      root.scrollIntoView({ block: 'center', inline: 'center' });
      const trackRect = track.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();
      if (trackRect.width < 1 || thumbRect.width < 1 || viewport.scrollWidth <= viewport.clientWidth) return null;
      return {
        clientWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth,
        nativeScrollbarWidth: getComputedStyle(viewport).scrollbarWidth,
        trackWidth: trackRect.width,
        thumbWidth: thumbRect.width,
        from: { x: thumbRect.x + thumbRect.width / 2, y: thumbRect.y + thumbRect.height / 2 },
        to: {
          x: Math.min(trackRect.right - 4, thumbRect.x + thumbRect.width / 2 + 110),
          y: thumbRect.y + thumbRect.height / 2,
        },
      };
    }, HORIZONTAL_SCROLL_AREA),
    { label: 'the horizontal ScrollArea viewport, track, and thumb to finish layout' },
  );

  assert(geometry, 'horizontal ScrollArea renders a viewport, track, and thumb');
  assert(
    geometry.nativeScrollbarWidth === 'none',
    `the iframe native horizontal scrollbar is suppressed (${geometry.nativeScrollbarWidth})`,
  );
  assert(geometry.scrollWidth > geometry.clientWidth, 'the fixture has real horizontal overflow');
  assert(geometry.trackWidth > 300, `the custom horizontal track keeps its full width (${geometry.trackWidth}px)`);
  assert(
    geometry.thumbWidth > 20 && geometry.thumbWidth < geometry.trackWidth,
    `the horizontal thumb represents the overflow ratio (${geometry.thumbWidth}px of ${geometry.trackWidth}px)`,
  );

  const from = await canvasPagePoint(page, geometry.from);
  const to = await canvasPagePoint(page, geometry.to);
  assert(from.onCanvas && to.onCanvas, 'the ScrollArea drag path is visible on the Design canvas');

  const selectionBefore = await readActiveDesignLayerId(projectDir);
  await altDrag(page, from, to);
  const scrollLeft = await waitFor(
    () => frame.evaluate((rootSelector) => (
      document.querySelector(rootSelector)
        ?.querySelector('[data-slot="scroll-area-viewport"]')
        ?.scrollLeft ?? 0
    ), HORIZONTAL_SCROLL_AREA),
    { label: 'the horizontal ScrollArea to move after Alt+drag' },
  );
  assert(scrollLeft > 1, `the component owns the Alt+drag pointer sequence (${scrollLeft}px)`);

  // Selection persistence is debounced. Give an editor interception time to
  // commit, then prove the runtime gesture did not become an editor selection.
  await sleep(4000);
  const selectionAfter = await readActiveDesignLayerId(projectDir);
  assert(
    selectionAfter === selectionBefore,
    `Alt+drag must not change editor selection (was ${selectionBefore}, now ${selectionAfter})`,
  );

  const messageScrollerState = await waitFor(
    () => frame.evaluate((rootSelector) => {
      const root = document.querySelector(rootSelector);
      const viewport = root?.querySelector('[data-slot="message-scroller-viewport"]');
      const endButton = root?.querySelector('[data-slot="message-scroller-button"][data-direction="end"]');
      if (!(root instanceof HTMLElement) || !(viewport instanceof HTMLElement) || !(endButton instanceof HTMLElement)) {
        return null;
      }
      root.scrollIntoView({ block: 'center', inline: 'center' });
      if (viewport.scrollHeight <= viewport.clientHeight) return null;
      if (viewport.scrollTop !== 0) {
        viewport.scrollTo({ top: 0, behavior: 'auto' });
        return null;
      }
      if (endButton.getAttribute('data-active') !== 'true' || endButton.hasAttribute('inert')) return null;
      const rect = endButton.getBoundingClientRect();
      return {
        button: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
      };
    }, MESSAGE_SCROLLER),
    { label: 'the MessageScroller end button to activate away from the pinned end' },
  );
  assert(
    messageScrollerState.scrollHeight > messageScrollerState.clientHeight,
    'the MessageScroller fixture has real vertical overflow',
  );

  const messageButtonPoint = await canvasPagePoint(page, messageScrollerState.button);
  assert(messageButtonPoint.onCanvas, 'the MessageScroller end button is visible on the Design canvas');
  const messageSelectionBefore = await readActiveDesignLayerId(projectDir);
  await altClick(page, messageButtonPoint);
  const messageScrollerEndState = await waitFor(
    () => frame.evaluate((rootSelector) => {
      const root = document.querySelector(rootSelector);
      const viewport = root?.querySelector('[data-slot="message-scroller-viewport"]');
      const endButton = root?.querySelector('[data-slot="message-scroller-button"][data-direction="end"]');
      if (!(viewport instanceof HTMLElement) || !(endButton instanceof HTMLElement)) return null;
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
      if (Math.abs(viewport.scrollTop - maxScrollTop) > 1) return null;
      if (endButton.getAttribute('data-active') !== 'false' || !endButton.hasAttribute('inert')) return null;
      return {
        active: endButton.getAttribute('data-active'),
        inert: endButton.hasAttribute('inert'),
        scrollTop: viewport.scrollTop,
      };
    }, MESSAGE_SCROLLER),
    { label: 'Alt+click on the MessageScroller end button to reach the pinned end' },
  );
  assert(
    messageScrollerEndState.active === 'false' && messageScrollerEndState.inert,
    'the MessageScroller end button becomes inactive after reaching the pinned end',
  );
  assert(messageScrollerEndState.scrollTop > 1, 'the MessageScroller moved to its pinned end');

  await sleep(4000);
  const messageSelectionAfter = await readActiveDesignLayerId(projectDir);
  assert(
    messageSelectionAfter === messageSelectionBefore,
    `Alt+click must not change editor selection (was ${messageSelectionBefore}, now ${messageSelectionAfter})`,
  );
}

async function installFixturePage(projectDir) {
  const pagesPath = join(projectDir, '.workbench', 'pages.json');
  const sourcePath = join(projectDir, SOURCE_FILE);
  const pages = JSON.parse(await readFile(pagesPath, 'utf8'));
  pages.pages = [
    ...pages.pages.filter((page) => page.id !== PAGE_ID),
    {
      id: PAGE_ID,
      name: 'Runtime gesture harness',
      route: '/runtime-gesture-harness',
      sourceFile: SOURCE_FILE,
      rootNodeId: 'source:runtime-gesture-harness:root',
      status: 'draft',
      extensions: {},
    },
  ];
  await Promise.all([
    writeFile(sourcePath, FIXTURE_SOURCE, 'utf8'),
    writeFile(pagesPath, `${JSON.stringify(pages, null, 2)}\n`, 'utf8'),
  ]);
}
