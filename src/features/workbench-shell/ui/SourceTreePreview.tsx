import { Component as ReactComponent, Fragment, cloneElement, createElement, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  ElementType,
  ErrorInfo,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
  SyntheticEvent as ReactSyntheticEvent,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, Expand, MoveHorizontal, MoveVertical } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import { getProjectCollectionTokenCssVariableName } from '@domain/design-system/tokens/cssExport';
import { getTokenPreviewCss, queryTokens } from '@domain/design-system/tokens/query';
import {
  parseTokenModeOverride,
  serializeTokenModeOverride,
  SOURCE_TOKEN_MODE_ATTRIBUTE,
} from '@domain/design-system/tokens/modeOverride';
import type { InspectorField, TokenRegistry } from '@domain/design-system/tokens/types';
import {
  getWorkbenchDefaultFontCssText,
  getWorkbenchDefaultIconSourceMap,
  isVideoDesignAssetSource,
  resolveWorkbenchDefaultIconSource,
} from '@domain/design-system/assets/assetRegistry';
import type { WorkbenchAssetRegistry } from '@domain/project/workbenchProject';
import {
  resolveWorkbenchHostAssetUrl,
  subscribeWorkbenchProjectChangeEvents,
  toWorkbenchPreviewUrl,
  toWorkbenchProjectAssetBaseUrl,
  workbenchFetch,
} from '@domain/project/workbenchHostTransport';
import type {
  WorkbenchSpecNoteHighlightBox,
  WorkbenchSpecNoteHighlightBoxRect,
  WorkbenchSpecNoteHighlightBoxResizeMode,
} from '@domain/project/workbenchSpecNotes';
import type {
  EditableTreeNode,
  EditableTreeSourceAttributes,
  EditableTreeSourcePropObject,
  EditableTreeSourceProps,
  EditableTreeSourcePropStringArray,
} from '@domain/document/editableTree';
import {
  findEditableTreeNode,
  findEditableTreeNodeInPreviewTree,
  getEditableTreePreviewChildSourcePreviewOnly,
  isEditableTreeSourcePreviewOnlyNode,
  resolveEditableTreeSelectionBoundary,
} from '@domain/document/editableTree';
import { getLibraryScopeClassName } from '@domain/document/libraryScopeRegistry';
import {
  canMoveSourceNodeIntoParent,
  findEditableTreeParent,
  type SourceKeyboardMoveIntent,
} from '@domain/document/editableTreeSourceLayerTree';
import {
  getSourceCanvasDropBoundaryActivationSize,
  getSourceCanvasPointToRectDistanceSquared,
  inferSourceCanvasDropFlow,
  isSourceCanvasNoopReorder,
  isSourceCanvasTwoDimensionalLayout,
  resolveSourceCanvasDropInsertion,
  shouldHoldSourceCanvasDragOrigin,
} from '@domain/document/sourceCanvasDropGeometry';
import { simulatePreviewTreeMove } from '@domain/preview/previewTreeMoveSimulation';
import {
  createPreviewSnapWheelGestureStates,
  handlePreviewSnapWheelGesture,
  isPreviewWheelOwnedByScrollTarget,
} from '@domain/preview/previewWheelGesture';
import {
  analyzeCssClassEffectivenessAsync,
  type CssClassEffectivenessReport,
} from '@domain/preview/cssClassEffectiveness';
import {
  normalizeSourceStyleDeclarationValue,
  type SourceComponentPropValue,
  type SourceStyleProperty,
} from '@domain/document/editableTreeSourceWriteback';
import {
  isSourceIntrinsicElementTagName,
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
} from '@domain/document/sourceAttributeSafety';
import {
  isProjectLocalImportSource,
  normalizeProjectSourceFileReference,
  resolveProjectLocalImportSourcePath,
} from '@domain/document/sourceImportRouting';
import {
  parseSourceBackgroundVideoLayers,
  type SourceBackgroundVideoLayer,
} from '@domain/document/sourceVideoBackground';
import type { PreviewTokenModeSelection } from './DesignInspectorTypes';
import {
  getDesignPreviewAppearanceThemeMode,
  type DesignPreviewAppearance,
} from './designPreviewSettings';
import { getSourceTreePreviewTokenVariables } from './sourceTreePreviewTokens';
import { getSourceTreePreviewI18nTokens, type SourceTreePreviewI18nMap } from './sourceTreePreviewI18n';
import {
  getSourceTreePreviewRuntimeWrapperForwardClassName,
  getSourceTreePreviewTailwindClassRulesForClassNames,
  getSourceTreePreviewTailwindFallbackCss,
  getSourceTreePreviewTailwindRuntimeCss,
  getSourceTreePreviewTailwindRuntimeStyleAttribute,
  type SourceTreePreviewTailwindCssMode,
} from './sourceTreePreviewTailwindRuntime';
import {
  getSourceTreePreviewProjectComponentProps,
  getSourceTreePreviewRuntimeRootClassName,
  getSourceTreePreviewRuntimeRootNodeId,
  isSourceTreePreviewProjectRuntimeSourceChange,
  mergeSourceTreePreviewProjectComponentProps,
  SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX,
} from './sourceTreePreviewRuntimeProps';
import sourceTreePreviewFrameCss from './sourceTreePreviewFrame.css?raw';
import { WorkbenchPortalScopeContext } from '../../../runtime/workbenchReactRuntimeGlobals';

export type SourceTreePreviewSelectionMode = 'deep' | 'direct' | 'exact' | 'smart-deep';

export type SourceTreePreviewDrillOrigin = {
  previewDrillPath: string[];
  selectedLayerId: string | null;
};

function useSourceTreePreviewEventCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  return useCallback((...args: Args) => callbackRef.current(...args), []);
}

function useOptionalSourceTreePreviewEventCallback<Args extends unknown[], Result>(
  callback: ((...args: Args) => Result) | undefined,
): ((...args: Args) => Result | undefined) | undefined {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  const stableCallback = useCallback((...args: Args) => callbackRef.current?.(...args), []);
  return callback ? stableCallback : undefined;
}

const SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR = '[data-workbench-portal-root="true"]';
const SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR = '[data-workbench-theme-portal-root="true"]';
const SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE = 'data-wb-source-component-name';
const SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE = 'data-wb-runtime-owner-node-id';
const SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE = 'data-wb-runtime-owner-source';
const SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS = 'aria-controls';
const SOURCE_TREE_PREVIEW_RUNTIME_DIRECT_SELECTION_ATTRIBUTE = 'data-wb-runtime-direct-select';
const SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE = 'data-wb-drop-placeholder-hidden';
const SOURCE_TREE_PREVIEW_RUNTIME_GESTURE_SURFACE_SELECTOR = '[data-wb-runtime-interactive="true"]';
const SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR = '[role="separator"][aria-valuenow]';
const SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'label',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[aria-haspopup]',
  '[aria-controls]',
  'dialog',
  '[role="dialog"]',
  '[role="menu"]',
  '[role="tooltip"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR,
].join(', ');
/**
 * Surfaces that navigate with arrow keys themselves.
 *
 * Deliberately much shorter than the pointer-side list: a button, a label, a
 * link or a dialog is interactive but does nothing with arrows, so it has no
 * claim on them over the editor's selection.
 */
const SOURCE_TREE_PREVIEW_KEYBOARD_NAVIGATED_TARGET_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radiogroup"]',
  '[role="tablist"]',
].join(', ');
const SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
].join(', ');

function requestsSourceTreePreviewExactRuntimeSelection(
  target: unknown,
  container: HTMLElement,
  smartDeep = false,
  additive = false,
): boolean {
  if (smartDeep || additive || !isSourceTreePreviewHTMLElement(target)) return false;
  const directSelectionTarget = target.closest<HTMLElement>(
    `[${SOURCE_TREE_PREVIEW_RUNTIME_DIRECT_SELECTION_ATTRIBUTE}="true"]`,
  );
  return Boolean(
    directSelectionTarget &&
    container.contains(directSelectionTarget),
  );
}
const SOURCE_TREE_PREVIEW_RUNTIME_POINTER_GESTURE_TARGET_SELECTOR = [
  SOURCE_TREE_PREVIEW_RUNTIME_GESTURE_SURFACE_SELECTOR,
  '[data-slot="carousel"]',
  '[data-slot="carousel-content"]',
  '[aria-roledescription="carousel"]',
].join(', ');
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_TARGET_SELECTOR = '[data-slot="carousel"]';
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_GAP_MS = 160;
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_DELAY_MS = 100;
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_DELTA = 8;
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_RATIO = 1.75;
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_TAIL_DELTA = 4;
const SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_SCROLL_THRESHOLD = 24;
const SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR =
  `[data-wb-preview-node-id], [${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE}], [class*="${SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX}"]`;
const sourceTreePreviewHandledSelectionEvents = new WeakSet<Event>();
const SOURCE_TREE_PREVIEW_VIEWPORT_MEDIA_QUERY_PATTERN = /\b(?:width|inline-size)\b/i;
const SOURCE_TREE_PREVIEW_EMPTY_IMAGE_SRC =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

type SourceTreePreviewLayoutRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type SourceTreePreviewLayoutSnapshot = Map<string, SourceTreePreviewLayoutRect>;

const SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS = 180;
const SOURCE_TREE_PREVIEW_FLIP_ANIMATION_ID = 'wb-drop-flip';
const SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE = 'data-wb-drop-layout-transition';

type SourceTreePreviewScrollLock = {
  cleanup: () => void;
  restorePositions: () => void;
};

function lockSourceTreePreviewLayoutScrollPositions(
  targetDocument: Document | null,
): SourceTreePreviewScrollLock | null {
  const ownerWindow = targetDocument?.defaultView;
  if (!targetDocument || !ownerWindow) return null;
  const scrollElements = new Set<HTMLElement>();
  const visitedElements = new Set<HTMLElement>();
  for (const selectable of targetDocument.querySelectorAll<HTMLElement>(
    SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,
  )) {
    let element = selectable.parentElement;
    while (element) {
      if (visitedElements.has(element)) break;
      visitedElements.add(element);
      if (
        element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1
      ) {
        scrollElements.add(element);
      }
      element = element.parentElement;
    }
  }
  const scrollingElement = targetDocument.scrollingElement;
  if (scrollingElement instanceof ownerWindow.HTMLElement) {
    scrollElements.add(scrollingElement);
  }
  if (scrollElements.size === 0) return null;

  const entries = Array.from(scrollElements, (element) => ({
    appliedLeft: element.scrollLeft,
    appliedTop: element.scrollTop,
    element,
    left: element.scrollLeft,
    style: ['overflow-anchor', 'scroll-behavior', 'scroll-snap-type'].map((name) => ({
      name,
      priority: element.style.getPropertyPriority(name),
      value: element.style.getPropertyValue(name),
    })),
    top: element.scrollTop,
  }));
  const restorePositions = () => {
    for (const entry of entries) {
      if (!entry.element.isConnected) continue;
      /* A scroll offset that moved since this lock last pinned it is the
         user's own wheel/trackpad gesture: the lock disables overflow-anchor,
         so nothing else changes these offsets between pins. Re-pinning the
         captured offset here would yank the viewport back — the drop
         transition cleanup runs hundreds of milliseconds after the drop, and
         reverting every wheel in that window read as "canvas scrolling is
         broken". Release such an element instead of re-pinning it. */
      if (
        Math.abs(entry.element.scrollLeft - entry.appliedLeft) > 1 ||
        Math.abs(entry.element.scrollTop - entry.appliedTop) > 1
      ) {
        entry.appliedLeft = entry.element.scrollLeft;
        entry.appliedTop = entry.element.scrollTop;
        continue;
      }
      entry.element.scrollLeft = entry.left;
      entry.element.scrollTop = entry.top;
      entry.appliedLeft = entry.element.scrollLeft;
      entry.appliedTop = entry.element.scrollTop;
    }
  };
  for (const entry of entries) {
    entry.element.style.setProperty('overflow-anchor', 'none', 'important');
    entry.element.style.setProperty('scroll-behavior', 'auto', 'important');
    entry.element.style.setProperty('scroll-snap-type', 'none', 'important');
  }
  restorePositions();

  return {
    cleanup: () => {
      restorePositions();
      for (const entry of entries) {
        if (!entry.element.isConnected) continue;
        for (const style of entry.style) {
          if (style.value) {
            entry.element.style.setProperty(style.name, style.value, style.priority);
          } else {
            entry.element.style.removeProperty(style.name);
          }
        }
      }
    },
    restorePositions,
  };
}

// A selectable anchor may be a display:contents wrapper (radio/checkbox rows,
// several runtime wrappers) whose own box is 0×0; it renders purely through
// its children. Layout measurements fall back to the union of boxed children
// so those rows participate in FLIP measurement like any other node.
function getSourceTreePreviewLayoutRectForElement(element: HTMLElement): DOMRect | null {
  const own = element.getBoundingClientRect();
  if (own.width > 0 || own.height > 0) return own;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const child of element.children) {
    const rect = child.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) continue;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (right < left) return null;
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

// The elements a FLIP glide can actually move for an anchor: the anchor when
// it has a box of its own, otherwise its boxed children (translating a
// display:contents element paints nothing).
function getSourceTreePreviewFlipTargets(element: HTMLElement, ownerWindow: Window & typeof globalThis): HTMLElement[] {
  const own = element.getBoundingClientRect();
  if (own.width > 0 || own.height > 0) return [element];
  const targets: HTMLElement[] = [];
  for (const child of element.children) {
    if (!(child instanceof ownerWindow.HTMLElement)) continue;
    const rect = child.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) continue;
    targets.push(child);
  }
  return targets;
}

function getSourceTreePreviewLayoutSnapshot(targetDocument: Document | null): SourceTreePreviewLayoutSnapshot {
  const snapshot: SourceTreePreviewLayoutSnapshot = new Map();
  if (!targetDocument) return snapshot;
  for (const element of targetDocument.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)) {
    const nodeId = element.getAttribute('data-wb-preview-node-id')
      ?? element.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE);
    if (!nodeId || snapshot.has(nodeId)) continue;
    const rect = getSourceTreePreviewLayoutRectForElement(element);
    if (!rect) continue;
    snapshot.set(nodeId, {
      height: rect.height,
      left: rect.left,
      top: rect.top,
      width: rect.width,
    });
  }
  return snapshot;
}

function animateSourceTreePreviewLayoutTransition(
  targetDocument: Document | null,
  previousLayout: SourceTreePreviewLayoutSnapshot,
  scopeNodeIds: ReadonlySet<string> | null = null,
): Array<() => void> {
  if (!targetDocument || previousLayout.size === 0) return [];
  const ownerWindow = targetDocument.defaultView;
  if (!ownerWindow || ownerWindow.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return [];
  const movedElements = new Map<Element, { dx: number; dy: number }>();
  for (const element of targetDocument.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)) {
    const nodeId = element.getAttribute('data-wb-preview-node-id')
      ?? element.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE);
    // A whole-document FLIP over-matches: unrelated runtime surfaces can
    // reflow by a few sub-pixels on every projected re-render and visibly
    // wobble. When the caller knows the reorder scope, only its members glide.
    if (scopeNodeIds && (!nodeId || !scopeNodeIds.has(nodeId))) continue;
    const previousRect = nodeId ? previousLayout.get(nodeId) : null;
    if (!previousRect || movedElements.has(element)) continue;
    const nextRect = getSourceTreePreviewLayoutRectForElement(element);
    if (!nextRect) continue;
    const dx = previousRect.left - nextRect.left;
    const dy = previousRect.top - nextRect.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    movedElements.set(element, { dx, dy });
  }

  // Drive the interpolation with the Web Animations API. CSS-transition FLIP
  // depended on frame scheduling and on the transition engine observing two
  // committed style states, which proved unreliable in the drag path; WAAPI
  // is timeline-driven, needs no inline styles, and cancels cleanly. For
  // display:contents anchors the glide applies to their boxed children.
  const animations: Animation[] = [];
  const markedElements: HTMLElement[] = [];
  for (const [element, offset] of movedElements) {
    let ancestor = element.parentElement?.closest(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
    let ancestorOffset: { dx: number; dy: number } | null = null;
    while (ancestor) {
      ancestorOffset = movedElements.get(ancestor) ?? null;
      if (ancestorOffset) break;
      ancestor = ancestor.parentElement?.closest(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
    }
    const dx = offset.dx - (ancestorOffset?.dx ?? 0);
    const dy = offset.dy - (ancestorOffset?.dy ?? 0);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    if (!(element instanceof ownerWindow.HTMLElement)) continue;
    for (const target of getSourceTreePreviewFlipTargets(element, ownerWindow)) {
      const computedTranslate = ownerWindow.getComputedStyle(target).translate;
      if (computedTranslate && computedTranslate !== 'none' && computedTranslate !== '0px') {
        // An authored translate must stay untouched — but a residual value
        // from our own in-flight glide must not disqualify the element, or
        // any projection landing while the previous one is still animating
        // (dragging back toward the leading edge) snaps instead of gliding.
        // previousLayout captured the mid-flight visual rect, so the
        // replacement animation continues from where the element is now.
        const flipAnimation = target.getAnimations()
          .find((animation) => animation.id === SOURCE_TREE_PREVIEW_FLIP_ANIMATION_ID);
        if (!flipAnimation) continue;
        flipAnimation.cancel();
      }
      target.setAttribute(SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE, 'true');
      markedElements.push(target);
      try {
        animations.push(target.animate(
          [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }],
          {
            duration: SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            id: SOURCE_TREE_PREVIEW_FLIP_ANIMATION_ID,
          },
        ));
      } catch {
        // Older runtimes without WAAPI translate support simply skip the glide.
      }
    }
  }
  if (markedElements.length === 0) return [];

  let completed = false;
  let timeoutId: number | null = null;
  const restore = () => {
    if (completed) return;
    completed = true;
    if (timeoutId !== null) ownerWindow.clearTimeout(timeoutId);
    for (const animation of animations) animation.cancel();
    for (const marked of markedElements) {
      marked.removeAttribute(SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE);
    }
  };
  timeoutId = ownerWindow.setTimeout(
    restore,
    SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS + 40,
  );
  return [restore];
}

// Inline `srcDoc` mirror of `public/workbench-source-preview.html`. Used by
// callers (e.g. the component-picker preview) that mount the isolated frame via
// `srcDoc` instead of loading the static asset by `src`. The richer frame CSS
// and token variables are injected after the iframe's `onLoad` through
// `syncSourceTreePreviewFrameHead` / `syncSourceTreePreviewFrameTokenVariables`,
// so this only needs the base document shell and the `#wb-source-preview-root`.
export const SOURCE_TREE_PREVIEW_FRAME_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html,
      body,
      #wb-source-preview-root,
      #wb-source-preview-stage {
        width: 100%;
        height: 100%;
        min-height: 100%;
        margin: 0;
      }

      html {
        color-scheme: light dark;
        background: Canvas;
        color: CanvasText;
      }

      html[data-preview-theme="dark"] {
        color-scheme: dark;
      }

      html[data-preview-theme="light"] {
        color-scheme: light;
      }

      html[data-preview-theme="system"] {
        color-scheme: light dark;
      }

      body {
        overflow: visible;
        background: transparent;
        color: CanvasText;
      }

      #wb-source-preview-root {
        position: relative;
        background: transparent;
        background-image: none;
      }

      [data-workbench-portal-root="true"] {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        overflow: visible;
        pointer-events: none;
      }

      [data-workbench-portal-root="true"] > * {
        pointer-events: auto;
      }

      #wb-source-preview-stage > .wb-source-visual-preview {
        width: 100%;
        height: 100%;
        min-height: 100%;
        overflow: auto;
      }
    </style>
  </head>
  <body>
    <div id="wb-source-preview-root">
      <div id="wb-source-preview-stage"></div>
      <div data-workbench-portal-root="true"></div>
    </div>
  </body>
</html>
`;

const SOURCE_TREE_PREVIEW_FRAME_TOKEN_VARIABLES = new WeakMap<Document, Set<string>>();
const SOURCE_TREE_PREVIEW_FRAME_HEAD_SIGNATURES = new WeakMap<Document, string>();
// The head nodes the last rebuild wrote, so the next rebuild can tell a node
// that project runtime code injected afterwards from the shell it replaced.
const SOURCE_TREE_PREVIEW_FRAME_SYNCED_HEAD_NODES = new WeakMap<Document, Set<Element>>();
const SOURCE_TREE_PREVIEW_FRAME_STRUCTURE_SIGNATURES = new WeakMap<Document, string>();
const SOURCE_TREE_PREVIEW_STYLE_NODE_SIGNATURES = new WeakMap<HTMLStyleElement, { signature: string; text: string }>();
const SOURCE_TREE_PREVIEW_FRAME_CSS_SIGNATURE = getSourceTreePreviewCssSignature(sourceTreePreviewFrameCss);
const PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE = 'data-wb-project-library-css';
// The project runtime compiler injects every bundled Vue SFC <style> block into
// the importing document as `<style data-workbench-preview-css="workbench-preview-vue-css-<id>">`.
const PROJECT_BUNDLED_CSS_DATA_ATTRIBUTE = 'data-workbench-preview-css';
const PROJECT_BUNDLED_VUE_SFC_CSS_ID_PREFIX = 'workbench-preview-vue-css-';
const PROJECT_VUE_SFC_CSS_DATASET_KEY = 'wbProjectVueSfcCss';
const PROJECT_TAILWIND_CSS_DATA_ATTRIBUTE = 'data-wb-project-tailwind-css';
const PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH = '/__workbench/preview/runtime-bundle.json';

type SourceTreePreviewComponentPropChange = (
  node: EditableTreeNode,
  propName: string,
  value: SourceComponentPropValue,
) => void;

type SourceTreePreviewOverlayRect = {
  height: number;
  left: number;
  primary?: boolean;
  root?: boolean;
  top: number;
  width: number;
};

type SourceTreePreviewTopLayerOverlay = {
  host: HTMLElement;
  rects: SourceTreePreviewOverlayRect[];
};

type SourceTreePreviewSelectionLabelOverlay = {
  host: HTMLElement;
  left: number;
  maxWidth: number;
  top: number;
};

type SourceTreePreviewSelectionOverlaySnapshot = {
  labelOverlay: SourceTreePreviewSelectionLabelOverlay | null;
  rects: SourceTreePreviewOverlayRect[];
  topLayerOverlays: SourceTreePreviewTopLayerOverlay[];
};

type SourceTreePreviewMeasurementBand = {
  kind: 'margin' | 'padding';
  label: string;
  rect: SourceTreePreviewOverlayRect;
  showLabel: boolean;
};

type SourceTreePreviewMeasurementLine = {
  kind: 'distance' | 'gap' | 'guide';
  label: string | null;
  length: number;
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
};

type SourceTreePreviewMeasurementSnapshot = {
  bands: SourceTreePreviewMeasurementBand[];
  lines: SourceTreePreviewMeasurementLine[];
};

type SourceTreePreviewNoteBoxOverlayItem = {
  box: WorkbenchSpecNoteHighlightBox;
  rect: SourceTreePreviewOverlayRect;
  stableBox: WorkbenchSpecNoteHighlightBoxRect;
};

const SOURCE_TREE_PREVIEW_CLICK_SUPPRESS_MS = 800;
const SOURCE_TREE_PREVIEW_DRAG_THRESHOLD_PX = 5;
const SOURCE_TREE_PREVIEW_DRAG_GHOST_FULL_STYLE_NODE_LIMIT = 120;
const SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT = 120;
const SOURCE_TREE_PREVIEW_CLASS_EFFECTIVENESS_MAX_SOURCE_TEXT_LENGTH = 32_768;
const SOURCE_TREE_PREVIEW_CLASS_EFFECTIVENESS_MAX_SOURCE_TOKENS = 257;
const SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_WIDTH = 420;
const SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_HEIGHT = 280;
const SOURCE_TREE_PREVIEW_DROP_ACTIVATION_DISTANCE_PX = 14;
const SOURCE_TREE_PREVIEW_DROP_CANDIDATE_CONFIRMATION_MS = 60;
const SOURCE_TREE_PREVIEW_DROP_DECISION_HYSTERESIS_PX = 12;
const SOURCE_TREE_PREVIEW_POSITION_DRAG_THRESHOLD_PX = 3;
const SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MIN_PX = 14;
const SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MAX_PX = 24;
const SOURCE_TREE_PREVIEW_OUTDENT_TRIGGER_PX = 10;
const SOURCE_TREE_PREVIEW_OUTDENT_ACTIVATION_PX = 30;
const SOURCE_TREE_PREVIEW_LONG_PRESS_DRAG_MS = 800;
const SOURCE_TREE_PREVIEW_LONG_PRESS_CANCEL_THRESHOLD_PX = 8;
const SOURCE_TREE_PREVIEW_SINGLE_CLICK_COMMIT_DELAY_MS = 250;
const SOURCE_TREE_PREVIEW_RESIZE_EDGE_PX = 6;
const SOURCE_TREE_PREVIEW_MIN_SIZE_PX = 16;
const SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX = 3;
const SOURCE_TREE_PREVIEW_SELECTION_LABEL_HEIGHT_PX = 20;
const SOURCE_TREE_PREVIEW_SELECTION_LABEL_MAX_WIDTH_PX = 180;
const SOURCE_TREE_PREVIEW_SELECTION_LABEL_MIN_WIDTH_PX = 48;
const SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS: AddEventListenerOptions = { capture: true };
const SOURCE_TREE_PREVIEW_MOUSE_POINTER_ID = -1;

type SourceTreePreviewResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
type SourceTreePreviewNoteBoxAnchorCorner = 'ne' | 'nw' | 'se' | 'sw';

const SOURCE_TREE_PREVIEW_NOTE_BOX_ANCHOR_CORNERS: SourceTreePreviewNoteBoxAnchorCorner[] = ['nw', 'ne', 'se', 'sw'];
const SOURCE_TREE_PREVIEW_NOTE_BOX_ANCHOR_CORNER_ICON = {
  ne: ArrowUpRight,
  nw: ArrowUpLeft,
  se: ArrowDownRight,
  sw: ArrowDownLeft,
} as const;
const SOURCE_TREE_PREVIEW_DEFAULT_NOTE_BOX_RESIZE_MODE: WorkbenchSpecNoteHighlightBoxResizeMode = 'fixed';

type SourceTreePreviewPointerStart = {
  clientX: number;
  clientY: number;
  pointerId?: number;
  shiftKey: boolean;
  target?: EventTarget | null;
};

type SourceTreePreviewPointerGestureEvent = {
  cancelable: boolean;
  clientX: number;
  clientY: number;
  pointerId: number;
  preventDefault: () => void;
  shiftKey: boolean;
  stopPropagation: () => void;
};

type SourceTreePreviewDragStartEvent = {
  button: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  pointerId?: number;
  preventDefault: () => void;
  shiftKey: boolean;
  stopPropagation: () => void;
  target: EventTarget | null;
};

type SourceTreePreviewStyleDeclarationPatch = {
  property: SourceStyleProperty;
  value: string | null;
};

type SourceTreePreviewDropAxis = 'horizontal' | 'vertical';

type SourceTreePreviewDropFlow = {
  axis: SourceTreePreviewDropAxis;
  grid?: boolean;
  reverse: boolean;
};

/** A two-dimensional container is addressed by slot, not by sibling edge: the
    authored cells are drawn translucently and the pointer picks the slot the
    node will occupy. `activeIndex` is a position in the CURRENT visual order,
    so it needs no before/after edge and no pre/post-removal correction — the
    dragged node simply ends up there. */
type SourceTreePreviewDropGridSlots = {
  activeIndex: number;
  rects: SourceTreePreviewOverlayRect[];
};

type SourceTreePreviewDropTarget = {
  axis: SourceTreePreviewDropAxis;
  gridSlots?: SourceTreePreviewDropGridSlots;
  index: number;
  intent: 'inside' | 'outdent';
  operation?: 'outdent' | 'reorder' | 'reparent';
  parentId: string;
  position: 'after' | 'before' | 'inside';
  previewOffset?: number;
  previewOffsetX?: number;
  previewOffsetY?: number;
  previewRect?: SourceTreePreviewOverlayRect;
  rect: SourceTreePreviewOverlayRect;
  scopeLabel?: string;
  scopeRect?: SourceTreePreviewOverlayRect;
  /** Open top-layer host (modal dialog / drawer) the indicator must portal
      into — the browser top layer paints above any z-index. `rect` is
      relative to this host when set. */
  topLayerHost?: HTMLElement | null;
};

type SourceTreePreviewBlockedDropHint = {
  label: string;
  reason: 'incompatible' | 'unmeasured';
  rect: SourceTreePreviewOverlayRect;
  topLayerHost?: HTMLElement | null;
};

type SourceTreePreviewDragGhost = {
  height: number;
  label: string;
  left: number;
  preview: SourceTreePreviewDragGhostPreview | null;
  top: number;
  width: number;
  /** See SourceTreePreviewDropTarget.topLayerHost. */
  topLayerHost?: HTMLElement | null;
};

type SourceTreePreviewDragGhostPreview = {
  height: number;
  items: Array<{
    clone: HTMLElement;
    height: number;
    left: number;
    nodeId: string | null;
    top: number;
    width: number;
  }>;
  maskOriginX: number;
  maskOriginY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  snapshot: boolean;
  width: number;
};

type SourceTreePreviewDragGhostStyle = CSSProperties & {
  '--wb-source-visual-drag-ghost-origin-x'?: string;
  '--wb-source-visual-drag-ghost-origin-y'?: string;
};

type SourceTreePreviewLongPressDragState = {
  cleanup: () => void;
  ownerWindow: SourceTreePreviewDomWindow;
  timerId: number;
};

type SourceTreePreviewDomWindow = Window & {
  Event?: typeof Event;
  MouseEvent?: typeof MouseEvent;
  MutationObserver?: typeof MutationObserver;
  PointerEvent?: typeof PointerEvent;
  ResizeObserver?: typeof ResizeObserver;
};

type ProjectRuntimeImportDiagnostic = {
  candidates?: Array<{
    path: string;
    reason: string;
  }>;
  importName: string;
  importSource: string;
  reason: string;
  sourceFile: string;
};

type ProjectSourceRuntimeComponentState =
  | {
      component: ElementType<Record<string, unknown>>;
      status: 'ready';
    }
  | {
      diagnostic: ProjectRuntimeImportDiagnostic;
      status: 'error';
    }
  | {
      runtimeImport: ProjectRuntimeImport;
      status: 'loading';
    };

type ProjectSourceRuntimeComponents = Map<string, ProjectSourceRuntimeComponentState>;

type ProjectRuntimeModuleResult =
  | {
      module: Record<string, unknown>;
      status: 'ok';
    }
  | {
      reason: string;
      status: 'error';
    };

type WorkbenchProjectLocation = {
  rootPath?: string | null;
};

const TABLER_ICONS_REACT_IMPORT_SOURCE = '@tabler/icons-react';
const TABLER_ICON_RENDERER_PROP = '__wbTablerIconRenderer';
const LUCIDE_REACT_IMPORT_SOURCE = 'lucide-react';
const REMIXICON_REACT_IMPORT_SOURCE = '@remixicon/react';

type TablerIconNode = [string, Record<string, unknown>];
type TablerIconModule = Record<string, unknown> & { __iconNode?: unknown };
type TablerIconModuleLoader = () => Promise<TablerIconModule>;

const TABLER_ICON_MODULE_LOADERS: Record<string, TablerIconModuleLoader> = {
  IconBell: () => import('@tabler/icons-react/dist/esm/icons/IconBell.mjs'),
  IconCalendar: () => import('@tabler/icons-react/dist/esm/icons/IconCalendar.mjs'),
  IconCamera: () => import('@tabler/icons-react/dist/esm/icons/IconCamera.mjs'),
  IconChartBar: () => import('@tabler/icons-react/dist/esm/icons/IconChartBar.mjs'),
  IconChecklist: () => import('@tabler/icons-react/dist/esm/icons/IconChecklist.mjs'),
  IconChevronDown: () => import('@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs'),
  IconChevronLeft: () => import('@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs'),
  IconChevronRight: () => import('@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs'),
  IconChevronsLeft: () => import('@tabler/icons-react/dist/esm/icons/IconChevronsLeft.mjs'),
  IconChevronsRight: () => import('@tabler/icons-react/dist/esm/icons/IconChevronsRight.mjs'),
  IconCircleCheckFilled: () => import('@tabler/icons-react/dist/esm/icons/IconCircleCheckFilled.mjs'),
  IconCirclePlusFilled: () => import('@tabler/icons-react/dist/esm/icons/IconCirclePlusFilled.mjs'),
  IconCreditCard: () => import('@tabler/icons-react/dist/esm/icons/IconCreditCard.mjs'),
  IconCurrencyYen: () => import('@tabler/icons-react/dist/esm/icons/IconCurrencyYen.mjs'),
  IconDashboard: () => import('@tabler/icons-react/dist/esm/icons/IconDashboard.mjs'),
  IconDatabase: () => import('@tabler/icons-react/dist/esm/icons/IconDatabase.mjs'),
  IconDots: () => import('@tabler/icons-react/dist/esm/icons/IconDots.mjs'),
  IconDotsVertical: () => import('@tabler/icons-react/dist/esm/icons/IconDotsVertical.mjs'),
  IconDownload: () => import('@tabler/icons-react/dist/esm/icons/IconDownload.mjs'),
  IconFileAi: () => import('@tabler/icons-react/dist/esm/icons/IconFileAi.mjs'),
  IconFileDescription: () => import('@tabler/icons-react/dist/esm/icons/IconFileDescription.mjs'),
  IconFileWord: () => import('@tabler/icons-react/dist/esm/icons/IconFileWord.mjs'),
  IconFolder: () => import('@tabler/icons-react/dist/esm/icons/IconFolder.mjs'),
  IconGripVertical: () => import('@tabler/icons-react/dist/esm/icons/IconGripVertical.mjs'),
  IconHelp: () => import('@tabler/icons-react/dist/esm/icons/IconHelp.mjs'),
  IconHotelService: () => import('@tabler/icons-react/dist/esm/icons/IconHotelService.mjs'),
  IconInnerShadowTop: () => import('@tabler/icons-react/dist/esm/icons/IconInnerShadowTop.mjs'),
  IconLayoutColumns: () => import('@tabler/icons-react/dist/esm/icons/IconLayoutColumns.mjs'),
  IconListDetails: () => import('@tabler/icons-react/dist/esm/icons/IconListDetails.mjs'),
  IconLoader: () => import('@tabler/icons-react/dist/esm/icons/IconLoader.mjs'),
  IconLogout: () => import('@tabler/icons-react/dist/esm/icons/IconLogout.mjs'),
  IconMail: () => import('@tabler/icons-react/dist/esm/icons/IconMail.mjs'),
  IconMapPin: () => import('@tabler/icons-react/dist/esm/icons/IconMapPin.mjs'),
  IconNotification: () => import('@tabler/icons-react/dist/esm/icons/IconNotification.mjs'),
  IconPlaneDeparture: () => import('@tabler/icons-react/dist/esm/icons/IconPlaneDeparture.mjs'),
  IconPlus: () => import('@tabler/icons-react/dist/esm/icons/IconPlus.mjs'),
  IconReport: () => import('@tabler/icons-react/dist/esm/icons/IconReport.mjs'),
  IconRoute: () => import('@tabler/icons-react/dist/esm/icons/IconRoute.mjs'),
  IconSearch: () => import('@tabler/icons-react/dist/esm/icons/IconSearch.mjs'),
  IconSettings: () => import('@tabler/icons-react/dist/esm/icons/IconSettings.mjs'),
  IconShare3: () => import('@tabler/icons-react/dist/esm/icons/IconShare3.mjs'),
  IconSun: () => import('@tabler/icons-react/dist/esm/icons/IconSun.mjs'),
  IconTrain: () => import('@tabler/icons-react/dist/esm/icons/IconTrain.mjs'),
  IconTrash: () => import('@tabler/icons-react/dist/esm/icons/IconTrash.mjs'),
  IconTrendingDown: () => import('@tabler/icons-react/dist/esm/icons/IconTrendingDown.mjs'),
  IconTrendingUp: () => import('@tabler/icons-react/dist/esm/icons/IconTrendingUp.mjs'),
  IconUserCircle: () => import('@tabler/icons-react/dist/esm/icons/IconUserCircle.mjs'),
  IconUsers: () => import('@tabler/icons-react/dist/esm/icons/IconUsers.mjs'),
  IconWallet: () => import('@tabler/icons-react/dist/esm/icons/IconWallet.mjs'),
};

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>;
};

function setWorkbenchPreviewIconSourceMap(sources: Record<string, string>) {
  (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__ = sources;
}

export function SourceTreePreview({
  cssClassEffectivenessEnabled = false,
  activeNoteBoxDraft,
  activeNoteHighlightBoxId,
  activeNoteHighlightBoxes = [],
  activeNoteLinkDragId,
  activeNotePreviewNoteId,
  activeNotePreviewLayerId,
  ariaLabel = 'Source visual preview',
  assetRegistry,
  onClearSelection,
  onCopySelection,
  onCutSelection,
  onDeleteSelection,
  onDuplicateSelection,
  onDrillIntoLayer,
  onHistoryRedo,
  onHistoryUndo,
  onInsertChild,
  onMoveLayerToParent,
  onNoteHighlightBoxChange,
  onNoteHighlightBoxPreviewChange,
  onMoveLayer,
  onNoteHighlightBoxCreate,
  onNoteHighlightBoxDraftEnd,
  onCssClassEffectivenessChange,
  onPasteNode,
  onWrapSelection,
  onSelectLayer,
  onNoteLinkDrop,
  onStyleDeclarationsChange,
  onSourceNodeComponentPropChange,
  previewAppearance,
  previewDrillPath,
  previewTokenModes,
  root,
  selectedLayerId,
  selectedLayerIds,
  selectedLayerReadOnly = false,
  tailwindCssMode = 'disabled',
  tokenRegistry,
}: {
  cssClassEffectivenessEnabled?: boolean;
  activeNoteBoxDraft?: { layerId: string; noteId: string } | null;
  activeNoteHighlightBoxId?: string | null;
  activeNoteHighlightBoxes?: WorkbenchSpecNoteHighlightBox[];
  activeNoteLinkDragId?: string | null;
  activeNotePreviewNoteId?: string | null;
  activeNotePreviewLayerId?: string | null;
  ariaLabel?: string;
  assetRegistry?: WorkbenchAssetRegistry;
  onClearSelection?: () => void;
  onCopySelection?: () => void;
  onCutSelection?: () => void;
  onDeleteSelection?: () => void;
  onDuplicateSelection?: () => void;
  onDrillIntoLayer: (layerId: string, origin?: SourceTreePreviewDrillOrigin) => void;
  onHistoryRedo?: () => boolean;
  onHistoryUndo?: () => boolean;
  onInsertChild?: () => void;
  onMoveLayer?: (layerId: string, intent: SourceKeyboardMoveIntent) => void;
  onMoveLayerToParent?: (layerId: string, targetParentLayerId: string, targetIndex: number) => Promise<void> | void;
  onNoteHighlightBoxChange?: (noteId: string, boxId: string, rect: WorkbenchSpecNoteHighlightBoxRect) => void;
  onNoteHighlightBoxCreate?: (noteId: string, rect: WorkbenchSpecNoteHighlightBoxRect) => void;
  onNoteHighlightBoxDraftEnd?: () => void;
  onNoteHighlightBoxPreviewChange?: (boxId: string | null) => void;
  onNoteLinkDrop?: (noteId: string, layerId: string) => void;
  onCssClassEffectivenessChange?: (report: CssClassEffectivenessReport | null) => void;
  onPasteNode?: (placement: 'below' | 'inside') => void;
  onWrapSelection?: () => void;
  onSelectLayer: (layerId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  onStyleDeclarationsChange?: (
    layerId: string,
    patches: SourceTreePreviewStyleDeclarationPatch[],
    label: string,
  ) => void;
  onSourceNodeComponentPropChange?: SourceTreePreviewComponentPropChange;
  previewAppearance: DesignPreviewAppearance;
  previewDrillPath: string[];
  previewTokenModes: PreviewTokenModeSelection;
  root: EditableTreeNode;
  selectedLayerId: string | null;
  selectedLayerIds?: string[];
  selectedLayerReadOnly?: boolean;
  tailwindCssMode?: SourceTreePreviewTailwindCssMode;
  tokenRegistry: TokenRegistry;
}) {
  setWorkbenchPreviewIconSourceMap(getWorkbenchDefaultIconSourceMap(assetRegistry));
  const selectLayerEvent = useSourceTreePreviewEventCallback(onSelectLayer);
  const drillIntoLayerEvent = useSourceTreePreviewEventCallback(onDrillIntoLayer);
  const copySelectionEvent = useOptionalSourceTreePreviewEventCallback(onCopySelection);
  const cutSelectionEvent = useOptionalSourceTreePreviewEventCallback(onCutSelection);
  const deleteSelectionEvent = useOptionalSourceTreePreviewEventCallback(onDeleteSelection);
  const duplicateSelectionEvent = useOptionalSourceTreePreviewEventCallback(onDuplicateSelection);
  const historyRedoEvent = useOptionalSourceTreePreviewEventCallback(onHistoryRedo);
  const historyUndoEvent = useOptionalSourceTreePreviewEventCallback(onHistoryUndo);
  const insertChildEvent = useOptionalSourceTreePreviewEventCallback(onInsertChild);
  const pasteNodeEvent = useOptionalSourceTreePreviewEventCallback(onPasteNode);
  const wrapSelectionEvent = useOptionalSourceTreePreviewEventCallback(onWrapSelection);
  const cssClassEffectivenessChangeEvent = useOptionalSourceTreePreviewEventCallback(onCssClassEffectivenessChange);
  const sourceNodeComponentPropChangeEvent = useOptionalSourceTreePreviewEventCallback(onSourceNodeComponentPropChange);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const initialScrollResetRef = useRef<{ previewDocument: Document; rootId: string } | null>(null);
  const previousSelectedLayerIdRef = useRef(selectedLayerId);
  const doubleClickDrillOriginRef = useRef<SourceTreePreviewDrillOrigin | null>(null);
  const pendingSingleClickSelectionRef = useRef<{
    ownerWindow: Window;
    timerId: number;
  } | null>(null);
  const clickSuppressTimeoutRef = useRef<number | null>(null);
  const pendingRuntimeActivationGestureRef = useRef<{
    pointerId: number | null;
    target: HTMLElement;
  } | null>(null);
  const activeCanvasDragCleanupRef = useRef<(() => void) | null>(null);
  const activeDropPreviewLayoutTransitionCleanupsRef = useRef<Array<() => void>>([]);
  const activeDropPreviewHiddenCleanupRef = useRef<(() => void) | null>(null);
  const activeDropPreviewReflowScopeRef = useRef<{ scope: ReadonlySet<string> | null } | null>(null);
  const pendingCanvasLongPressDragRef = useRef<SourceTreePreviewLongPressDragState | null>(null);
  const suppressNextClickRef = useRef(false);
  const [resizeEdge, setResizeEdge] = useState<SourceTreePreviewResizeEdge | null>(null);
  const [dropTarget, setDropTarget] = useState<SourceTreePreviewDropTarget | null>(null);
  const [dropPreviewRoot, setDropPreviewRoot] = useState<EditableTreeNode | null>(null);
  const [blockedDropHint, setBlockedDropHint] = useState<SourceTreePreviewBlockedDropHint | null>(null);
  const [dragGhost, setDragGhost] = useState<SourceTreePreviewDragGhost | null>(null);
  const [noteBoxDraftRect, setNoteBoxDraftRect] = useState<SourceTreePreviewOverlayRect | null>(null);
  const [noteLinkTargetId, setNoteLinkTargetId] = useState<string | null>(null);
  const [longPressDragReadyRect, setLongPressDragReadyRect] = useState<SourceTreePreviewOverlayRect | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  useSourceTreePreviewFrameGlobalPatches(previewDocument);
  const [dismissedPreviewModalNodeIds, setDismissedPreviewModalNodeIds] = useState<Set<string>>(() => new Set());
  const [renderedTailwindClassNameSignature, setRenderedTailwindClassNameSignature] = useState('');
  const tokenVariables = useMemo(
    () => getSourceTreePreviewTokenVariables(tokenRegistry, previewTokenModes),
    [previewTokenModes, tokenRegistry],
  );
  const previewTokenModeAttribute = useMemo(
    () => serializeTokenModeOverride(previewTokenModes) ?? undefined,
    [previewTokenModes],
  );
  const previewThemeMode = useMemo(
    () => getDesignPreviewAppearanceThemeMode(previewAppearance),
    [previewAppearance],
  );
  const fontCssText = useMemo(
    () => getWorkbenchDefaultFontCssText(
      assetRegistry,
      `.wb-source-visual-preview, ${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}`,
    ),
    [assetRegistry],
  );
  const i18nTokens = useMemo(
    () => getSourceTreePreviewI18nTokens(tokenRegistry, previewTokenModes),
    [previewTokenModes, tokenRegistry],
  );
  const tailwindRuntimeCss = useMemo(
    () => getSourceTreePreviewTailwindRuntimeCss(
      root,
      renderedTailwindClassNameSignature ? [renderedTailwindClassNameSignature] : [],
      { layerName: null, mode: tailwindCssMode },
    ),
    [renderedTailwindClassNameSignature, root, tailwindCssMode],
  );
  const projectRuntimeComponents = useProjectSourceRuntimeComponents(root);
  const hasProjectRuntimeImports = useMemo(
    () => hasSourceTreePreviewProjectRuntimeImports(root),
    [root],
  );
  const projectRuntimeComponentsSettled = !hasProjectRuntimeImports || (
    projectRuntimeComponents.size > 0 &&
    [...projectRuntimeComponents.values()].every((state) => state.status !== 'loading')
  );
  const runtimeDescendantNodeIds = useMemo(
    () => collectSourceTreePreviewRuntimeDescendantNodeIds(root, projectRuntimeComponents),
    [projectRuntimeComponents, root],
  );
  const shouldTrackRenderedTailwindClassNames = useMemo(
    () => tailwindCssMode === 'fallback' && hasSourceTreePreviewProjectRuntimeImports(root),
    [root, tailwindCssMode],
  );
  const dismissPreviewModal = useCallback((nodeId: string) => {
    setDismissedPreviewModalNodeIds((current) => {
      if (current.has(nodeId)) return current;
      const next = new Set(current);
      next.add(nodeId);
      return next;
    });
  }, []);
  const selectedLayerIdSet = useMemo(() => new Set(selectedLayerIds ?? []), [selectedLayerIds]);
  useEffect(() => {
    if (!cssClassEffectivenessChangeEvent) return undefined;
    if (!cssClassEffectivenessEnabled) {
      cssClassEffectivenessChangeEvent(null);
      return undefined;
    }
    const container = previewRef.current;
    const selectedLookup = selectedLayerId
      ? findEditableTreeNodeInPreviewTree(root, selectedLayerId)
      : null;
    const selectedNode = selectedLookup?.node ?? null;
    const sourceClassName = selectedNode?.sourceAttributes?.className?.trim() ?? '';
    const classNames = getSourceTreePreviewClassNameTokens(sourceClassName);
    if (!container || !selectedLayerId || !selectedNode || classNames.length === 0) {
      cssClassEffectivenessChangeEvent(null);
      return undefined;
    }

    const ownerDocument = container.ownerDocument;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    const MutationObserverConstructor = ownerWindow.MutationObserver ?? MutationObserver;
    let measureTimeoutId: number | null = null;
    let measurePending = false;
    let remeasureRequested = false;
    let cancelled = false;
    let analysisSuspended = false;
    let analysisAbortController: AbortController | null = null;
    let observedElement: HTMLElement | null = null;
    let previewObserver: MutationObserver | null = null;
    // While the node is missing the observer watches the whole container, so
    // every unrelated preview mutation schedules another measure. Each one
    // rebuilds the same unverified report; publishing it would re-render the
    // Inspector for no change. Emit only when the verdict actually moves.
    let lastEmittedSignature: string | null = null;
    const emitReport = (nextReport: CssClassEffectivenessReport) => {
      const signature = [
        nextReport.layerId,
        nextReport.sourceClassName,
        nextReport.entries.map((entry) => `${entry.className}:${entry.status}`).join(','),
      ].join('|');
      if (signature === lastEmittedSignature) return;
      lastEmittedSignature = signature;
      cssClassEffectivenessChangeEvent(nextReport);
    };
    const observeSelectedElement = (element: HTMLElement | null) => {
      observedElement = element;
      previewObserver?.disconnect();
      if (!element) {
        // The selected node has not rendered yet — the first measure after a
        // load races the preview. Watch the container until it appears.
        // Observing nothing here latches the report on "no verified rendered
        // root" for as long as the selection lasts, because a missing element
        // is also the one thing that leaves no observer to notice it arriving.
        previewObserver?.observe(container, { childList: true, subtree: true });
        return;
      }
      previewObserver?.observe(element, { attributes: true });
      if (element.parentElement) {
        previewObserver?.observe(element.parentElement, { childList: true });
      }
    };
    const measure = async () => {
      measureTimeoutId = null;
      measurePending = true;
      analysisAbortController = new AbortController();
      const element = resolveSourceTreePreviewClassEffectivenessElement(
        container,
        selectedLayerId,
        classNames,
      );
      observeSelectedElement(element);
      let report: CssClassEffectivenessReport;
      try {
        report = element
          ? await analyzeCssClassEffectivenessAsync({
              classNames,
              componentName: selectedNode.source?.jsxName ?? selectedNode.label,
              element,
              layerId: selectedLayerId,
              localRules: getSourceTreePreviewTailwindClassRulesForClassNames([
                element.getAttribute('class') ?? '',
              ]),
              signal: analysisAbortController.signal,
              sourceClassName,
            })
          : createSourceTreePreviewUnverifiedClassEffectivenessReport({
              classNames,
              layerId: selectedLayerId,
              reason: 'The selected source node has no verified rendered root in the current preview.',
              sourceClassName,
            });
      } catch (error) {
        analysisSuspended = true;
        const errorName = error && typeof error === 'object' && 'name' in error
          ? String(error.name)
          : '';
        report = createSourceTreePreviewUnverifiedClassEffectivenessReport({
          classNames,
          layerId: selectedLayerId,
          reason: errorName === 'TimeoutError'
            ? 'Class effectiveness analysis stopped after exceeding its safe interaction budget. The selection remains available.'
            : 'Class effectiveness analysis could not complete safely. The selection remains available.',
          sourceClassName,
        });
      } finally {
        analysisAbortController = null;
        measurePending = false;
      }
      if (!cancelled) emitReport(report);
      if (remeasureRequested && !cancelled) {
        remeasureRequested = false;
        scheduleMeasure();
      }
    };
    const scheduleMeasure = () => {
      if (analysisSuspended) return;
      if (measurePending) {
        remeasureRequested = true;
        return;
      }
      if (measureTimeoutId !== null) return;
      // Class effectiveness is selected-root diagnostics, never an input/render
      // dependency. Keep it off the selection frame and coalesce preview
      // mutations so repeated state changes cannot stall interaction.
      measureTimeoutId = ownerWindow.setTimeout(measure, 120);
    };
    const nodeTouchesSelection = (node: Node) => {
      if (!observedElement || !isSourceTreePreviewHTMLElement(node)) return false;
      return (
        node === observedElement ||
        node.contains(observedElement)
      );
    };
    previewObserver = new MutationObserverConstructor((records) => {
      const relevant = records.some((record) => {
        if (record.type === 'attributes') {
          return observedElement
            ? record.target === observedElement ||
                (isSourceTreePreviewHTMLElement(record.target) && record.target.contains(observedElement))
            : false;
        }
        return (
          !observedElement?.isConnected ||
          [...record.addedNodes, ...record.removedNodes].some(nodeTouchesSelection)
        );
      });
      if (relevant) scheduleMeasure();
    });
    observeSelectedElement(resolveSourceTreePreviewClassEffectivenessElement(
      container,
      selectedLayerId,
      classNames,
    ));
    const stateEvents = [
      'animationend',
      'change',
      'focusin',
      'focusout',
      'input',
      'pointerout',
      'pointerover',
      'transitionend',
    ] as const;
    const handleStateEvent = (event: Event) => {
      const target = event.target;
      if (
        !observedElement ||
        !isSourceTreePreviewHTMLElement(target) ||
        target !== observedElement
      ) return;
      scheduleMeasure();
    };
    stateEvents.forEach((eventName) => ownerDocument.addEventListener(eventName, handleStateEvent, true));
    ownerWindow.addEventListener('resize', scheduleMeasure);
    scheduleMeasure();
    return () => {
      cancelled = true;
      analysisAbortController?.abort();
      if (measureTimeoutId !== null) ownerWindow.clearTimeout(measureTimeoutId);
      previewObserver?.disconnect();
      stateEvents.forEach((eventName) => ownerDocument.removeEventListener(eventName, handleStateEvent, true));
      ownerWindow.removeEventListener('resize', scheduleMeasure);
    };
  }, [
    cssClassEffectivenessChangeEvent,
    cssClassEffectivenessEnabled,
    previewDocument,
    root,
    selectedLayerId,
    tailwindRuntimeCss,
  ]);
  const commandHoverPointRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const commandHoverModifierPressedRef = useRef(false);
  const [commandHoverLayerId, setCommandHoverLayerId] = useState<string | null>(null);
  const visibleCommandHoverLayerId = dragGhost ? null : commandHoverLayerId;
  const commandHoverSelectionLayerId = commandHoverLayerId &&
    !dragGhost &&
    commandHoverLayerId !== selectedLayerId &&
    !selectedLayerIdSet.has(commandHoverLayerId)
    ? commandHoverLayerId
    : null;
  const clearPendingSingleClickSelection = useCallback(() => {
    const pendingSelection = pendingSingleClickSelectionRef.current;
    if (!pendingSelection) return;
    pendingSelection.ownerWindow.clearTimeout(pendingSelection.timerId);
    pendingSingleClickSelectionRef.current = null;
  }, []);
  const clearPendingRuntimeActivationGesture = useCallback(() => {
    pendingRuntimeActivationGestureRef.current = null;
  }, []);
  const latchRuntimeActivationGesture = useCallback((
    event: SourceTreePreviewRuntimeActivationGestureEvent,
    container: HTMLElement,
  ) => {
    if (!isSourceTreePreviewRuntimeActivationEvent(event)) return false;
    const target = getSourceTreePreviewEventTargetElement(event);
    if (!target) return false;
    const interactionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
      target,
      container,
    );
    const activationTarget = interactionTarget ?? (
      isSourceTreePreviewPortalPointerTarget(target, container) ? target : null
    );
    if (!activationTarget) return false;
    pendingRuntimeActivationGestureRef.current = {
      pointerId: event.pointerId ?? null,
      target: activationTarget,
    };
    return true;
  }, []);
  const isRuntimeActivationGesture = useCallback((
    event: SourceTreePreviewRuntimeActivationGestureEvent,
    target: HTMLElement | null,
  ) => {
    if (isSourceTreePreviewRuntimeActivationEvent(event)) return true;
    const pending = pendingRuntimeActivationGestureRef.current;
    if (!pending || !target) return false;
    if (
      pending.pointerId !== null &&
      event.pointerId !== undefined &&
      pending.pointerId !== event.pointerId
    ) return false;
    // Pointerdown, pointerup, and click can surface different descendants of
    // the same composed control, especially when the control opens a nested
    // portal. The latched pointer gesture owns the whole sequence; target
    // containment is not a reliable ownership boundary across portals.
    return true;
  }, []);
  const selectLayerFromClick = useCallback((
    layerId: string,
    mode: SourceTreePreviewSelectionMode,
    additive: boolean,
    preserveRuntimeFocus = false,
  ) => {
    if (suppressNextClickRef.current) return;
    clearPendingSingleClickSelection();
    const container = previewRef.current;
    const preserveFocusedRuntimeControl = preserveRuntimeFocus || Boolean(
      container && getSourceTreePreviewActiveRuntimeFocusTarget(container),
    );
    if (mode !== 'direct' || additive) {
      selectLayerEvent(layerId, mode, additive);
      if (!preserveFocusedRuntimeControl) {
        previewRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    if (!container) return;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    const timerId = ownerWindow.setTimeout(() => {
      pendingSingleClickSelectionRef.current = null;
      selectLayerEvent(layerId, mode, additive);
    }, SOURCE_TREE_PREVIEW_SINGLE_CLICK_COMMIT_DELAY_MS);
    pendingSingleClickSelectionRef.current = { ownerWindow, timerId };
    if (!preserveFocusedRuntimeControl) {
      previewRef.current?.focus({ preventScroll: true });
    }
  }, [clearPendingSingleClickSelection, selectLayerEvent]);
  const drillIntoLayerFromDoubleClick = useCallback((layerId: string) => {
    if (suppressNextClickRef.current) return;
    clearPendingSingleClickSelection();
    const origin = doubleClickDrillOriginRef.current;
    doubleClickDrillOriginRef.current = null;
    drillIntoLayerEvent(layerId, origin ?? undefined);
  }, [clearPendingSingleClickSelection, drillIntoLayerEvent]);

  useEffect(() => clearPendingSingleClickSelection, [clearPendingSingleClickSelection]);

  const suppressNextClick = useCallback(() => {
    suppressNextClickRef.current = true;
    if (clickSuppressTimeoutRef.current !== null) window.clearTimeout(clickSuppressTimeoutRef.current);
    clickSuppressTimeoutRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = false;
      clickSuppressTimeoutRef.current = null;
    }, SOURCE_TREE_PREVIEW_CLICK_SUPPRESS_MS);
  }, []);
  const clearClickSuppression = useCallback(() => {
    if (clickSuppressTimeoutRef.current !== null) {
      window.clearTimeout(clickSuppressTimeoutRef.current);
      clickSuppressTimeoutRef.current = null;
    }
    suppressNextClickRef.current = false;
  }, []);
  const updateDropTarget = useCallback((nextDropTarget: SourceTreePreviewDropTarget | null) => {
    setDropTarget(nextDropTarget);
  }, []);
  const updateDropPreviewRoot = useCallback((
    nextRoot: EditableTreeNode | null,
    transitionOrigins?: SourceTreePreviewLayoutSnapshot,
    hiddenNodeIds?: readonly string[],
    reflowScopeNodeIds?: ReadonlySet<string> | null,
  ) => {
    // Each confirmed slot becomes the next rendered decision surface. Snapshot
    // the currently painted/interpolated positions before applying the next
    // simulated tree so hit-testing and the following FLIP transition continue
    // from what the user can actually see, rather than jumping back to origin.
    // Width and height come from the simulated destination on the first frame;
    // only position is interpolated.
    // Snapshot BEFORE cancelling the previous cycle: cancelling its WAAPI
    // glides snaps elements to their layout slots, and measuring after that
    // loses the mid-flight visual position. Directions whose boundary
    // decisions re-project in quick succession (dragging toward the leading
    // edge) would then compute zero deltas and stop interpolating entirely.
    // Clearing the projection mid-gesture (the pointer wandered back across
    // the decision boundary, so the target became a noop) must glide the
    // displaced siblings home exactly like applying one does. Real drags
    // oscillate across boundaries; an instant snap on every un-project reads
    // as "interpolation only works in one direction".
    const clearingReflowScope = !nextRoot ? activeDropPreviewReflowScopeRef.current : null;
    const previousLayout = nextRoot || clearingReflowScope
      ? getSourceTreePreviewLayoutSnapshot(previewDocument)
      : null;
    activeDropPreviewReflowScopeRef.current = nextRoot
      ? { scope: reflowScopeNodeIds ?? null }
      : null;
    for (const cleanup of activeDropPreviewLayoutTransitionCleanupsRef.current) cleanup();
    activeDropPreviewLayoutTransitionCleanupsRef.current = [];
    activeDropPreviewHiddenCleanupRef.current?.();
    activeDropPreviewHiddenCleanupRef.current = null;
    const scrollLock = nextRoot
      ? lockSourceTreePreviewLayoutScrollPositions(previewDocument)
      : null;
    if (previousLayout && transitionOrigins) {
      for (const [nodeId, rect] of transitionOrigins) previousLayout.set(nodeId, rect);
    }
    flushSync(() => {
      setDropPreviewRoot(nextRoot);
    });
    // A leading-edge reorder can make the browser preserve the old first
    // visible child by changing scrollLeft. Restore the authored viewport
    // before measuring the destination so the sibling displacement remains
    // visible to the position-only interpolation.
    scrollLock?.restorePositions();
    if (nextRoot && hiddenNodeIds?.length) {
      activeDropPreviewHiddenCleanupRef.current =
        applySourceTreePreviewDropPlaceholderPreview(previewDocument, hiddenNodeIds);
    }
    if (previousLayout) {
      activeDropPreviewLayoutTransitionCleanupsRef.current = animateSourceTreePreviewLayoutTransition(
        previewDocument,
        previousLayout,
        nextRoot ? reflowScopeNodeIds ?? null : clearingReflowScope?.scope ?? null,
      );
    }
    if (scrollLock) {
      activeDropPreviewLayoutTransitionCleanupsRef.current.push(scrollLock.cleanup);
    }
  }, [previewDocument]);
  useEffect(() => {
    for (const cleanup of activeDropPreviewLayoutTransitionCleanupsRef.current) cleanup();
    activeDropPreviewLayoutTransitionCleanupsRef.current = [];
    activeDropPreviewHiddenCleanupRef.current?.();
    activeDropPreviewHiddenCleanupRef.current = null;
    activeDropPreviewReflowScopeRef.current = null;
    setDropPreviewRoot(null);
  }, [root]);
  useEffect(() => () => {
    for (const cleanup of activeDropPreviewLayoutTransitionCleanupsRef.current) cleanup();
    activeDropPreviewLayoutTransitionCleanupsRef.current = [];
    activeDropPreviewHiddenCleanupRef.current?.();
    activeDropPreviewHiddenCleanupRef.current = null;
  }, []);
  const updateBlockedDropHint = useCallback((nextHint: SourceTreePreviewBlockedDropHint | null) => {
    setBlockedDropHint(nextHint);
  }, []);
  const clearPendingCanvasLongPressDrag = useCallback(() => {
    const pending = pendingCanvasLongPressDragRef.current;
    if (!pending) return;
    pending.ownerWindow.clearTimeout(pending.timerId);
    pending.cleanup();
    pendingCanvasLongPressDragRef.current = null;
    setLongPressDragReadyRect(null);
  }, []);
  const clearCanvasDrag = useCallback(() => {
    clearPendingCanvasLongPressDrag();
    activeCanvasDragCleanupRef.current?.();
    activeCanvasDragCleanupRef.current = null;
    setDropTarget(null);
    setBlockedDropHint(null);
    setDragGhost(null);
    setLongPressDragReadyRect(null);
    setCommandHoverLayerId(null);
  }, [clearPendingCanvasLongPressDrag]);
  useEffect(() => {
    const container = previewRef.current;
    const ownerWindow = previewDocument?.defaultView;
    if (!container || !ownerWindow) return undefined;
    const hostWindow = getSourceTreePreviewHostWindow(ownerWindow);
    const handleCanvasDragEscape = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        (
          !activeCanvasDragCleanupRef.current &&
          !pendingCanvasLongPressDragRef.current
        )
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      clearCanvasDrag();
    };
    ownerWindow.addEventListener('keydown', handleCanvasDragEscape, true);
    if (hostWindow && hostWindow !== ownerWindow) {
      hostWindow.addEventListener('keydown', handleCanvasDragEscape, true);
    }
    return () => {
      ownerWindow.removeEventListener('keydown', handleCanvasDragEscape, true);
      if (hostWindow && hostWindow !== ownerWindow) {
        hostWindow.removeEventListener('keydown', handleCanvasDragEscape, true);
      }
    };
  }, [clearCanvasDrag, previewDocument]);
  const handlePreviewFrameLoad = useCallback((event: ReactSyntheticEvent<HTMLIFrameElement>) => {
    // Reloading the iframe replaces the pointer-event realm. End any gesture
    // owned by the old document before portaling editor chrome into the new one.
    clearCanvasDrag();
    // Patch the host globals BEFORE the state commit renders the portal
    // children, so project modules never observe the unpatched
    // window.matchMedia/getSelection. This is what previously required a
    // key-version bump (and therefore a full canvas remount) right after the
    // first mount.
    if (event.currentTarget.contentDocument) {
      installSourceTreePreviewGlobalPatches(event.currentTarget.contentDocument);
    }
    setPreviewDocument(event.currentTarget.contentDocument);
  }, [clearCanvasDrag]);
  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeCanvasDragCleanupRef.current || !selectedLayerId || !onStyleDeclarationsChange) return;
    setResizeEdge(resolveSourceTreePreviewResizeEdge(previewRef.current, selectedLayerId, event.clientX, event.clientY));
  }, [onStyleDeclarationsChange, selectedLayerId]);
  const handlePointerLeave = useCallback(() => {
    if (!activeCanvasDragCleanupRef.current) setResizeEdge(null);
  }, []);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return undefined;
    const ownerDocument = container.ownerDocument;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    const hostWindow = getSourceTreePreviewHostWindow(ownerWindow);
    let clearTimerId: number | null = null;
    const cancelScheduledClear = () => {
      if (clearTimerId === null) return;
      ownerWindow.clearTimeout(clearTimerId);
      clearTimerId = null;
    };

    const commitCommandHover = (
      clientX: number,
      clientY: number,
      modifierPressed: boolean,
      target: EventTarget | null,
    ) => {
      commandHoverPointRef.current = { clientX, clientY };
      commandHoverModifierPressedRef.current = modifierPressed;
      if (modifierPressed) cancelScheduledClear();
      if (!modifierPressed || activeCanvasDragCleanupRef.current) {
        setCommandHoverLayerId((current) => current === null ? current : null);
        return;
      }
      const nextLayerId = resolveSourceTreePreviewCommandHoverLayerId(
        container,
        clientX,
        clientY,
        target,
        root,
      );
      const nextLayer = nextLayerId ? findSourceTreePreviewLayerNode(root, nextLayerId) : null;
      const resolvedLayerId = nextLayerId && nextLayer ? nextLayerId : null;
      setCommandHoverLayerId((current) => current === resolvedLayerId ? current : resolvedLayerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!event.metaKey && !event.ctrlKey) cancelScheduledClear();
      commitCommandHover(event.clientX, event.clientY, event.metaKey || event.ctrlKey, event.target);
    };
    const refreshFromKeyboard = (modifierPressed: boolean) => {
      commandHoverModifierPressedRef.current = modifierPressed;
      const point = commandHoverPointRef.current;
      if (!modifierPressed || !point) {
        setCommandHoverLayerId((current) => current === null ? current : null);
        return;
      }
      commitCommandHover(
        point.clientX,
        point.clientY,
        true,
        ownerDocument.elementFromPoint(point.clientX, point.clientY),
      );
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.key === 'Meta' || event.key === 'Control') {
        cancelScheduledClear();
        refreshFromKeyboard(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Meta' || event.key === 'Control' || (!event.metaKey && !event.ctrlKey)) {
        cancelScheduledClear();
        clearTimerId = ownerWindow.setTimeout(() => {
          clearTimerId = null;
          refreshFromKeyboard(false);
        }, 140);
      }
    };
    const clearCommandHover = () => {
      commandHoverModifierPressedRef.current = false;
      commandHoverPointRef.current = null;
      setCommandHoverLayerId((current) => current === null ? current : null);
    };

    ownerDocument.addEventListener('pointermove', handlePointerMove, true);
    ownerWindow.addEventListener('keydown', handleKeyDown, true);
    ownerWindow.addEventListener('keyup', handleKeyUp, true);
    ownerWindow.addEventListener('blur', clearCommandHover);
    if (hostWindow && hostWindow !== ownerWindow) {
      hostWindow.addEventListener('keydown', handleKeyDown, true);
      hostWindow.addEventListener('keyup', handleKeyUp, true);
      hostWindow.addEventListener('blur', clearCommandHover);
    }

    return () => {
      cancelScheduledClear();
      ownerDocument.removeEventListener('pointermove', handlePointerMove, true);
      ownerWindow.removeEventListener('keydown', handleKeyDown, true);
      ownerWindow.removeEventListener('keyup', handleKeyUp, true);
      ownerWindow.removeEventListener('blur', clearCommandHover);
      if (hostWindow && hostWindow !== ownerWindow) {
        hostWindow.removeEventListener('keydown', handleKeyDown, true);
        hostWindow.removeEventListener('keyup', handleKeyUp, true);
        hostWindow.removeEventListener('blur', clearCommandHover);
      }
    };
  }, [previewDocument, root, selectedLayerId, selectedLayerIdSet]);
  const startCanvasNodeDrag = useCallback(({
    blockPointerEvents = false,
    container,
    event,
    layerId,
    listenerOptions,
    preserveClickUntilActive = false,
    selectLayer,
    selectedNode,
  }: {
    blockPointerEvents?: boolean;
    container: HTMLElement;
    event: SourceTreePreviewDragStartEvent;
    layerId: string;
    listenerOptions?: AddEventListenerOptions;
    preserveClickUntilActive?: boolean;
    selectLayer?: boolean;
    selectedNode: EditableTreeNode;
  }): boolean => {
    if (!onMoveLayerToParent || selectedNode.id === root.id) return false;
    if (import.meta.env.DEV) {
      // Which press branch started this drag, and with which node. Reading the
      // point resolution alone is not enough: it can name the authored node
      // under the pointer while a different branch starts the gesture.
      SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.dragStart = {
        layerId: layerId.slice(-14),
        selectedNodeId: selectedNode.id.slice(-14),
        stack: (new Error().stack ?? '').split('\n').slice(2, 6).join(' | '),
      };
    }
    const multiDragNodes = resolveSourceTreePreviewMultiDragNodes({
      pointerNode: selectedNode,
      root,
      selectedLayerIds: selectedLayerIdSet,
    });
    const eventTarget = getSourceTreePreviewEventTargetElement(event);
    const preserveRuntimeFocusOnActive = Boolean(
      eventTarget &&
      getSourceTreePreviewActiveRuntimeFocusTarget(container) &&
      isSourceTreePreviewPortalPointerTarget(eventTarget, container)
    );
    if (!preserveClickUntilActive) {
      event.preventDefault();
      event.stopPropagation();
    }
    activeCanvasDragCleanupRef.current = startSourceTreePreviewNodeDrag({
      blockPointerEvents,
      container,
      deferPointerCaptureUntilActive: preserveClickUntilActive,
      event,
      layerId,
      listenerOptions,
      onActive: () => {
        if (selectLayer) {
          clearPendingSingleClickSelection();
          const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
          selectLayerEvent(
            layerId,
            getSourceTreePreviewModifierSelectionMode(event),
            additive,
          );
          // A drag that starts inside an open controlled surface must not blur
          // its trigger. Comboboxes and listboxes legitimately close on blur;
          // moving focus to the canvas at the drag threshold would therefore
          // destroy the very runtime surface that owns the dragged source row.
          if (!preserveRuntimeFocusOnActive) {
            focusSourceTreePreviewRoot(container);
          }
        }
        setCommandHoverLayerId(null);
        suppressNextClick();
      },
      onCommit: (targetDrop) => {
        suppressNextClick();
        return onMoveLayerToParent(layerId, targetDrop.parentId, targetDrop.index);
      },
      onDone: clearCanvasDrag,
      onBlockedDropHintChange: updateBlockedDropHint,
      onDropTargetChange: updateDropTarget,
      onGhostChange: setDragGhost,
      onPreviewRootChange: updateDropPreviewRoot,
      onSuppressClick: suppressNextClick,
      root,
      selectedNodes: multiDragNodes,
      selectedNode,
    });
    return true;
  }, [
    clearCanvasDrag,
    clearPendingSingleClickSelection,
    onMoveLayerToParent,
    selectLayerEvent,
    selectedLayerIdSet,
    root,
    suppressNextClick,
    updateBlockedDropHint,
    updateDropPreviewRoot,
    updateDropTarget,
  ]);
  const handlePointerDownCapture = useCallback((event: SourceTreePreviewDragStartEvent) => {
    if (isSourceTreePreviewNoteBoxTarget(event.target)) return;
    if (event.button !== 0 || isSourceTreePreviewEditableTarget(event.target)) return;
    const container = previewRef.current;
    if (!container || activeCanvasDragCleanupRef.current) return;
    const eventTarget = getSourceTreePreviewEventTargetElement(event);
    const runtimeActivation = isRuntimeActivationGesture(event, eventTarget);
    // Option/Alt is the explicit runtime-interaction chord: the previewed
    // component owns the complete pointer sequence even when the pressed
    // surface is not a recognized semantic control, portal root, or overlay
    // item. Recognition failures must degrade to "nothing happens", never to
    // the editor consuming the gesture as selection or structural drag.
    if (runtimeActivation) return;
    if (
      !runtimeActivation &&
      getSourceTreePreviewActiveRuntimeFocusTarget(container)
    ) {
      // An ordinary canvas press is editor selection, not runtime
      // light-dismiss. Keep the focused combobox/typeahead trigger in place;
      // Option/Alt preserves the component's native outside-click behavior.
      event.preventDefault();
    }
    const overlayItemLayerId = eventTarget
      ? resolveSourceTreePreviewRuntimeOverlayItemLayerId(eventTarget, container, root)
      : null;
    // A portal backdrop or implementation-only surface remains runtime-owned.
    // Authored collection items are the exception: their projected source ID
    // makes them ordinary editable nodes, so a press can remain a click or
    // become a structural drag once the shared movement threshold is crossed.
    if (
      isSourceTreePreviewPortalPointerTarget(event.target, container) &&
      !overlayItemLayerId
    ) return;
    if (
      eventTarget?.closest(SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR)
    ) return;
    const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
    // Gesture intent comes from this event, never from the hover cache. The
    // cached modifier can outlive a portal focus transfer or an automated
    // modifier click and must not turn the next ordinary menu click into an
    // editor selection.
    const smartDeep = event.metaKey || event.ctrlKey;
    const layerId = selectedLayerId;
    const selectedNode = container && layerId
      ? findSourceTreePreviewLayerNode(root, layerId)
      : null;
    // Modifier selection must resolve from the event-owned rendered surface
    // before the drag hit-test considers visually overlapping layers. Runtime
    // overlays may be positioned over unrelated canvas content without using a
    // DOM portal; a raw elementsFromPoint lookup can otherwise fall through the
    // overlay and select the card or shell behind it.
    const pointerLayerId = smartDeep || additive
      ? resolveSourceTreePreviewCommandHoverLayerId(
          container,
          event.clientX,
          event.clientY,
          event.target,
          root,
        )
      // Drag ownership goes through the same selection-boundary promotion the
      // modifier path uses: a press on a text leaf drags the owning element,
      // not the text. Deliberate text moves stay available by selecting the
      // text layer first — the selection owns the drag before this fallback.
      : resolveSourceTreePreviewVisualSelectionBoundaryId(
          root,
          resolveSourceTreePreviewPointerLayerId(event, container),
        );
    const pointerNode = pointerLayerId ? findSourceTreePreviewLayerNode(root, pointerLayerId) : null;
    const multiDragNodes = pointerNode
      ? resolveSourceTreePreviewMultiDragNodes({
          pointerNode,
          root,
          selectedLayerIds: selectedLayerIdSet,
        })
      : [];
    const pointerMultiSelectedNode = resolveSourceTreePreviewPointerMultiSelectedNode(
      pointerNode,
      multiDragNodes,
    );
    const selectedSubtreeNodeIds = selectedNode
      ? getSourceTreePreviewNodeSubtreeIds(selectedNode)
      : new Set<string>();
    const pointerDescendantOwnsDrag = selectedNode && pointerNode
      ? shouldSourceTreePreviewPointerDescendantOwnDrag({
          pointerNode,
          root,
          selectedNode,
          selectedSubtreeNodeIds,
        })
      : false;
    // Modifier selection belongs to the editor from pointerdown onward.
    // Gesture surfaces such as carousels may intentionally suppress the later
    // click after they receive pointerdown, so waiting for click makes Command
    // selection disappear while Shift+Command happens to work through the
    // additive branch. Commit both gestures at the same boundary instead.
    if ((smartDeep || additive) && pointerLayerId && pointerNode) {
      clearPendingSingleClickSelection();
      event.preventDefault();
      event.stopPropagation();
      selectLayerEvent(
        pointerLayerId,
        getSourceTreePreviewModifierSelectionMode(event, smartDeep),
        additive,
      );
      focusSourceTreePreviewRoot(container);
      suppressNextClick();
      return;
    }
    const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
      eventTarget,
      container,
    );
    const runtimeInteractionLayerId = runtimeInteractionTarget
      ? (
          getSourceTreePreviewElementNodeId(runtimeInteractionTarget) ??
          resolveSourceTreePreviewClosestRuntimeOwnerNodeId(
            runtimeInteractionTarget,
            container,
          ) ??
          pointerLayerId
        )
      : null;
    const runtimeInteractionNode = runtimeInteractionLayerId
      ? findSourceTreePreviewLayerNode(root, runtimeInteractionLayerId)
      : null;
    const overlayItemNode = overlayItemLayerId
      ? findSourceTreePreviewLayerNode(root, overlayItemLayerId)
      : null;
    if (overlayItemLayerId && overlayItemNode) {
      if (runtimeActivation) return;
      clearPendingCanvasLongPressDrag();
      startCanvasNodeDrag({
        blockPointerEvents: true,
        container,
        event,
        layerId: overlayItemLayerId,
        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
        preserveClickUntilActive: true,
        selectLayer: true,
        selectedNode: overlayItemNode,
      });
      return;
    }
    // The canvas owns an ordinary press on a semantic control so the visible
    // authored node remains directly selectable. Option/Alt is the explicit
    // runtime-interaction chord and leaves the complete pointer sequence with
    // the previewed component.
    if (runtimeInteractionTarget) {
      if (runtimeActivation) return;
      event.preventDefault();
      event.stopPropagation();
      if (runtimeInteractionLayerId && runtimeInteractionNode) {
        clearPendingSingleClickSelection();
        selectLayerEvent(
          runtimeInteractionLayerId,
          requestsSourceTreePreviewExactRuntimeSelection(eventTarget, container)
            ? 'exact'
            : 'direct',
          false,
        );
      }
      return;
    }
    // Gesture surfaces such as an Embla carousel viewport must receive the
    // complete pointer sequence unless the pointer is inside an explicitly
    // authored descendant of the current selection. In that case the editor
    // takes precedence so a full-page shell or scrolling surface cannot mask
    // every child drag target.
    if (
      container &&
      shouldSourceTreePreviewRuntimeOwnPointerGesture(event, container, selectedNode) &&
      !pointerMultiSelectedNode &&
      !pointerDescendantOwnsDrag &&
      !additive &&
      !smartDeep
    ) return;
    const pointerIsMultiSelected = Boolean(pointerMultiSelectedNode);
    if (pointerIsMultiSelected && pointerMultiSelectedNode) {
      clearPendingCanvasLongPressDrag();
      startCanvasNodeDrag({
        blockPointerEvents: true,
        container,
        event,
        layerId: pointerMultiSelectedNode.id,
        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
        selectedNode: pointerMultiSelectedNode,
      });
      return;
    }
    if (!layerId) {
      if (pointerLayerId && pointerNode) {
        clearPendingCanvasLongPressDrag();
        startCanvasNodeDrag({
          blockPointerEvents: true,
          container,
          event,
          layerId: pointerLayerId,
          listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
          preserveClickUntilActive: true,
          selectLayer: true,
          selectedNode: pointerNode,
        });
      }
      return;
    }
    if (!selectedNode || selectedNode.id === root.id) {
      if (pointerLayerId && pointerNode) {
        clearPendingCanvasLongPressDrag();
        startCanvasNodeDrag({
          blockPointerEvents: true,
          container,
          event,
          layerId: pointerLayerId,
          listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
          preserveClickUntilActive: true,
          selectLayer: true,
          selectedNode: pointerNode,
        });
      }
      return;
    }
    const onOtherLayer = isSourceTreePreviewPointerOnOtherSelectableLayer(event, container, layerId, selectedSubtreeNodeIds);
    // The shared rule decides this; `insideLayer` is just its answer read the
    // other way round, so the portal path below cannot drift from it.
    const dragSubject = resolveSourceTreePreviewDragSubject({
      clientX: event.clientX,
      clientY: event.clientY,
      container,
      pointerLayerId,
      pointerNode,
      root,
      selectedLayerId: layerId,
      selectedNode,
    });
    const insideLayer = dragSubject?.selectLayer === false;
    const resizeEdge = resolveSourceTreePreviewResizeEdge(container, layerId, event.clientX, event.clientY);
    // Drag ownership follows the visible selection box, not project-specific
    // component internals. Starting a drag anywhere inside the selected visual
    // bounds keeps moving that selection. A click can still select a deeper or
    // overlapping layer; once selected, its own visual box owns the next drag.
    if (
      !insideLayer &&
      !resizeEdge &&
      pointerLayerId &&
      pointerNode &&
      pointerLayerId !== layerId
    ) {
      clearPendingCanvasLongPressDrag();
      startCanvasNodeDrag({
        blockPointerEvents: true,
        container,
        event,
        layerId: pointerLayerId,
        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
        preserveClickUntilActive: true,
        selectLayer: true,
        selectedNode: pointerNode,
      });
      return;
    }
    if (onOtherLayer && !insideLayer) {
      if (pointerLayerId && pointerNode && !selectedSubtreeNodeIds.has(pointerLayerId)) {
        clearPendingCanvasLongPressDrag();
        startCanvasNodeDrag({
          blockPointerEvents: true,
          container,
          event,
          layerId: pointerLayerId,
          listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
          preserveClickUntilActive: true,
          selectLayer: true,
          selectedNode: pointerNode,
        });
      }
      return;
    }
    if (!insideLayer) return;
    if (resizeEdge) return;

    if (!isSourceTreePreviewLongPressDragNode(selectedNode)) {
      const selectedElement = getPreviewNodePrimaryElement(container, layerId);
      clearPendingCanvasLongPressDrag();
      const selectedStyle = selectedElement ? getSourceTreePreviewComputedStyle(selectedElement) : null;
      if (selectedElement && selectedStyle?.position === 'absolute' && onStyleDeclarationsChange) {
        event.preventDefault();
        activeCanvasDragCleanupRef.current = startSourceTreePreviewPositionDrag({
          blockPointerEvents: true,
          event,
          layerId,
          listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
          onCommit: (patches) => {
            suppressNextClick();
            onStyleDeclarationsChange(layerId, patches, 'Move absolute source layer');
          },
          onDone: clearCanvasDrag,
          target: selectedElement,
        });
        return;
      }
      if (!onMoveLayerToParent) return;
      startCanvasNodeDrag({
        container,
        event,
        layerId,
        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
        blockPointerEvents: true,
        selectedNode,
      });
      return;
    }

    clearPendingCanvasLongPressDrag();
    const pointerId = getSourceTreePreviewStartPointerId(event);
    if (pointerId === undefined) return;
    const pointerStart: SourceTreePreviewPointerStart = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId,
      shiftKey: event.shiftKey,
    };
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    let timerId = 0;
    const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const dx = moveEvent.clientX - pointerStart.clientX;
      const dy = moveEvent.clientY - pointerStart.clientY;
      if (Math.abs(dx) + Math.abs(dy) > SOURCE_TREE_PREVIEW_LONG_PRESS_CANCEL_THRESHOLD_PX) {
        clearPendingCanvasLongPressDrag();
      }
    };
    const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
      if (cancelEvent.pointerId === pointerId) clearPendingCanvasLongPressDrag();
    };
    const cleanup = addSourceTreePreviewPointerGestureListeners({
      listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
      onCancel: cancel,
      onMove: move,
      onUp: cancel,
      ownerWindow,
    });
    timerId = ownerWindow.setTimeout(() => {
      const pending = pendingCanvasLongPressDragRef.current;
      if (!pending || pending.timerId !== timerId || activeCanvasDragCleanupRef.current) return;
      pending.cleanup();
      pendingCanvasLongPressDragRef.current = null;
      const latestSelectedNode = findSourceTreePreviewLayerNode(root, layerId);
      if (!latestSelectedNode || latestSelectedNode.id === root.id || !isSourceTreePreviewLongPressDragNode(latestSelectedNode)) return;
      const selectedElement = getPreviewNodePrimaryElement(container, layerId);
      const dragElements = getSourceTreePreviewNodeDragElements(container, latestSelectedNode);
      const target = selectedElement ?? dragElements[0];
      if (!target) return;
      const selectedStyle = selectedElement ? getSourceTreePreviewComputedStyle(selectedElement) : null;
      const canStartDrag = (selectedElement && selectedStyle?.position === 'absolute' && onStyleDeclarationsChange) || onMoveLayerToParent;
      if (!canStartDrag) return;
      cancelSourceTreePreviewNativePointerGesture(target, pointerId, pointerStart);
      const targetRect = getSourceTreePreviewVisualBounds(container, dragElements);
      setLongPressDragReadyRect(targetRect ? toSourceTreePreviewOverlayRect(container, targetRect) : null);
      suppressNextClick();
      if (selectedElement && selectedStyle?.position === 'absolute' && onStyleDeclarationsChange) {
        activeCanvasDragCleanupRef.current = startSourceTreePreviewPositionDrag({
          blockPointerEvents: true,
          event: pointerStart,
          layerId,
          listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
          onActive: () => setLongPressDragReadyRect(null),
          onCommit: (patches) => {
            suppressNextClick();
            onStyleDeclarationsChange(layerId, patches, 'Move absolute source layer');
          },
          onDone: clearCanvasDrag,
          target,
        });
        return;
      }
      if (!onMoveLayerToParent) return;
      activeCanvasDragCleanupRef.current = startSourceTreePreviewNodeDrag({
        blockPointerEvents: true,
        container,
        event: pointerStart,
        layerId,
        listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
        onActive: () => {
          setLongPressDragReadyRect(null);
          suppressNextClick();
        },
        onCommit: (targetDrop) => {
          suppressNextClick();
          return onMoveLayerToParent(layerId, targetDrop.parentId, targetDrop.index);
        },
        onDone: clearCanvasDrag,
        onBlockedDropHintChange: updateBlockedDropHint,
        onDropTargetChange: updateDropTarget,
        onGhostChange: setDragGhost,
        onPreviewRootChange: updateDropPreviewRoot,
        onSuppressClick: suppressNextClick,
        root,
        selectedNode: latestSelectedNode,
      });
    }, SOURCE_TREE_PREVIEW_LONG_PRESS_DRAG_MS);
    pendingCanvasLongPressDragRef.current = { cleanup, ownerWindow, timerId };
  }, [
    clearCanvasDrag,
    clearPendingCanvasLongPressDrag,
    clearPendingSingleClickSelection,
    isRuntimeActivationGesture,
    onMoveLayerToParent,
    onStyleDeclarationsChange,
    root,
    selectLayerEvent,
    selectLayerFromClick,
    selectedLayerId,
    selectedLayerIdSet,
    startCanvasNodeDrag,
    suppressNextClick,
    updateBlockedDropHint,
    updateDropPreviewRoot,
    updateDropTarget,
  ]);
  const nodeDragStartEvent = useSourceTreePreviewEventCallback(handlePointerDownCapture);
  const selectRuntimeOverlayItemFromClick = useCallback((layerId: string) => {
    const container = previewRef.current;
    if (!container) return;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    ownerWindow.requestAnimationFrame(() => {
      // The controlled-surface ownership observer maps the actual option row.
      // Retagging the latest open popover here would make its input and listbox
      // part of the option's drag origin.
      selectLayerFromClick(layerId, 'exact', false, true);
    });
  }, [selectLayerFromClick]);
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return undefined;
    const ownerDocument = container.ownerDocument;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    let pendingRuntimeGestureSelection: {
      clientX: number;
      clientY: number;
      layerId: string;
      pointerId: number;
    } | null = null;
    let preserveOpenRuntimeSurfaceForPointerGesture = false;
    let clearRuntimeSurfacePreservationTimerId: number | null = null;
    const clearRuntimeSurfacePreservation = () => {
      if (clearRuntimeSurfacePreservationTimerId !== null) {
        ownerWindow?.clearTimeout(clearRuntimeSurfacePreservationTimerId);
        clearRuntimeSurfacePreservationTimerId = null;
      }
      preserveOpenRuntimeSurfaceForPointerGesture = false;
    };
    const deferRuntimeSurfacePreservationClear = () => {
      if (!ownerWindow) {
        clearRuntimeSurfacePreservation();
        return;
      }
      if (clearRuntimeSurfacePreservationTimerId !== null) {
        ownerWindow.clearTimeout(clearRuntimeSurfacePreservationTimerId);
      }
      // Native popover light-dismiss runs after pointerup/click dispatch.
      // Keep the editor-owned gesture latched through that browser default
      // action, then release it for Escape and explicit runtime dismissals.
      clearRuntimeSurfacePreservationTimerId = ownerWindow.setTimeout(
        clearRuntimeSurfacePreservation,
        0,
      );
    };
    const handleRuntimeSurfaceBeforeToggle = (event: Event) => {
      const toggleEvent = event as Event & { newState?: 'closed' | 'open' };
      if (
        toggleEvent.newState !== 'closed' ||
        !preserveOpenRuntimeSurfaceForPointerGesture
      ) return;
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      if (!target || !isSourceTreePreviewPortalPointerTarget(target, container)) return;
      // While a normal/Cmd editor gesture is selecting or structurally
      // dragging source inside the preview, browser `popover="auto"`
      // light-dismiss must not destroy that editing surface. Alt/Option
      // runtime activation never sets this latch, so the component keeps its
      // authored open/close behavior.
      if (event.cancelable) event.preventDefault();
    };
    const clearPendingRuntimeGestureSelection = () => {
      pendingRuntimeGestureSelection = null;
    };
    const selectPortalModifierTarget = (
      event: MouseEvent | PointerEvent,
      modifierPressed: boolean,
    ): boolean => {
      if (!modifierPressed) return false;
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      if (!target) return false;
      if (!isSourceTreePreviewPortalPointerTarget(target, container)) return false;
      const layerId = resolveSourceTreePreviewCommandHoverLayerId(
        container,
        event.clientX,
        event.clientY,
        event.target,
        root,
      );
      sourceTreePreviewHandledSelectionEvents.add(event);
      event.preventDefault();
      event.stopImmediatePropagation();
      // A portal event belongs to the preview even during the brief interval
      // before its controlled surface receives projected source ownership.
      // Consuming it here prevents React portal bubbling from selecting a
      // visually covered authored node behind the popup.
      if (!layerId || !findSourceTreePreviewLayerNode(root, layerId)) {
        return true;
      }
      const selectionMode = getSourceTreePreviewModifierSelectionMode(event, modifierPressed);
      selectLayerEvent(layerId, selectionMode, event.shiftKey);
      return true;
    };
    const handleDocumentPointerDown = (event: PointerEvent) => {
      preserveOpenRuntimeSurfaceForPointerGesture = Boolean(
        !isSourceTreePreviewRuntimeActivationEvent(event) &&
        getSourceTreePreviewOpenControlledSurfaceTrigger(container),
      );
      if (!latchRuntimeActivationGesture(event, container)) {
        clearPendingRuntimeActivationGesture();
      }
      const modifierPressed = event.metaKey || event.ctrlKey;
      if (modifierPressed) {
        if (selectPortalModifierTarget(event, modifierPressed)) {
          // Moving focus to the editor root or allowing another document-level
          // listener to observe this press closes controlled listboxes and
          // nested popovers. Selection has already been resolved above, so the
          // portal keeps both focus and ownership.
          event.stopImmediatePropagation();
          suppressNextClick();
          return;
        }
        const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
        if (
          !target ||
          !container.contains(target) ||
          isSourceTreePreviewEditableTarget(target) ||
          isSourceTreePreviewNoteBoxTarget(target)
        ) return;
        const layerId = resolveSourceTreePreviewCommandHoverLayerId(
          container,
          event.clientX,
          event.clientY,
          event.target,
          root,
        );
        if (!layerId || !findSourceTreePreviewLayerNode(root, layerId)) return;
        clearPendingSingleClickSelection();
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.preventDefault();
        event.stopPropagation();
        selectLayerEvent(
          layerId,
          getSourceTreePreviewModifierSelectionMode(event, modifierPressed),
          event.shiftKey,
        );
        focusSourceTreePreviewRoot(container);
        suppressNextClick();
        return;
      }
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      const runtimeActivation = isRuntimeActivationGesture(event, target);
      const runtimeOverlayItemLayerId = target
        ? resolveSourceTreePreviewRuntimeOverlayItemLayerId(target, container, root)
        : null;
      const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
        target,
        container,
      );
      if (
        target &&
        !runtimeActivation &&
        getSourceTreePreviewActiveRuntimeFocusTarget(container)
      ) {
        // Prevent the browser's native popover light-dismiss and the trigger's
        // blur before React assigns this ordinary press to editor selection.
        event.preventDefault();
        if (
          container.contains(target) &&
          !runtimeOverlayItemLayerId &&
          !runtimeInteractionTarget
        ) {
          // Component libraries can subscribe to document pointerdown before
          // the editor's React capture phase. Stop that earlier native phase
          // only for a true canvas press. stopImmediatePropagation also cuts
          // off the editor's own later-registered recognizers, so route this
          // press into the shared selection/drag recognizer directly — a plain
          // canvas node must stay selectable and draggable while a runtime
          // surface (or a statically expanded gallery demo) holds focus.
          sourceTreePreviewHandledSelectionEvents.add(event);
          event.stopImmediatePropagation();
          nodeDragStartEvent(event);
          return;
        }
      }
      const runtimeInteractionLayerId = runtimeInteractionTarget
        ? (
            getSourceTreePreviewElementNodeId(runtimeInteractionTarget) ??
            resolveSourceTreePreviewClosestRuntimeOwnerNodeId(
              runtimeInteractionTarget,
              container,
            )
          )
        : null;
      // A runtime interaction target can answer for a larger surface, such as
      // a combobox owning its popup list. It must not outrank a more specific
      // authored node directly under the pointer. Going COARSER is still
      // refused — an authored ancestor of the runtime node never wins.
      const pointAuthoredLayerId = resolveSourceTreePreviewElementFromPointNodeId(
        container,
        event.clientX,
        event.clientY,
        'direct',
      );
      const pointAuthoredNode = pointAuthoredLayerId
        ? findSourceTreePreviewLayerNode(root, pointAuthoredLayerId)
        : null;
      const interactionLayerId = (
        pointAuthoredLayerId &&
        pointAuthoredNode &&
        runtimeInteractionLayerId &&
        pointAuthoredLayerId !== runtimeInteractionLayerId &&
        !getSourceTreePreviewNodeSubtreeIds(pointAuthoredNode).has(runtimeInteractionLayerId)
      )
        ? pointAuthoredLayerId
        : runtimeInteractionLayerId;
      if (
        target &&
        (
          isSourceTreePreviewPortalPointerTarget(target, container) ||
          runtimeOverlayItemLayerId
        ) &&
        !runtimeActivation
      ) {
        const layerId =
          runtimeOverlayItemLayerId ??
          interactionLayerId ??
          resolveSourceTreePreviewCommandHoverLayerId(
            container,
            event.clientX,
            event.clientY,
            event.target,
            root,
          );
        event.preventDefault();
        if (runtimeOverlayItemLayerId) {
          const overlayItemNode = findSourceTreePreviewLayerNode(
            root,
            runtimeOverlayItemLayerId,
          );
          if (!overlayItemNode || activeCanvasDragCleanupRef.current) return;
          // Portal DOM can be rendered by a separate React root, so its native
          // pointer event is not guaranteed to reach the canvas capture
          // handler. Start the same source-node recognizer here: a short press
          // stays exact selection, while movement past the shared threshold
          // becomes the normal source-backed drag with ghost and drop preview.
          clearPendingCanvasLongPressDrag();
          startCanvasNodeDrag({
            blockPointerEvents: true,
            container,
            event,
            layerId: runtimeOverlayItemLayerId,
            listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
            preserveClickUntilActive: true,
            selectLayer: true,
            selectedNode: overlayItemNode,
          });
          // This ordinary editor gesture belongs to the authored portal item.
          // Prevent the component library's document-level light-dismiss or
          // option activation handler from closing the portal while the same
          // press is still deciding between selection and structural drag.
          sourceTreePreviewHandledSelectionEvents.add(event);
          event.stopImmediatePropagation();
          return;
        }
        const portalControlNode = interactionLayerId
          ? findSourceTreePreviewLayerNode(root, interactionLayerId)
          : null;
        // The same rule as the canvas press path, from the same place: an
        // explicit selection owns presses inside its own box, and the node
        // under the pointer owns everything else. This branch used to hand
        // every press to the point-resolved node, so pressing inside a selected
        // drawer section dragged whichever descendant sat under the pointer.
        const portalDragSubject = resolveSourceTreePreviewDragSubject({
          clientX: event.clientX,
          clientY: event.clientY,
          container,
          pointerLayerId: interactionLayerId,
          pointerNode: portalControlNode,
          root,
          selectedLayerId,
          selectedNode: selectedLayerId
            ? findSourceTreePreviewLayerNode(root, selectedLayerId)
            : null,
        });
        if (portalDragSubject && !activeCanvasDragCleanupRef.current) {
          // A nested selector/control is still a source child of the open
          // portal. Route it through structural drag before the generic portal
          // selection fallback; otherwise pointerdown selects an outer visual
          // boundary and the control's native popup consumes the movement.
          clearPendingCanvasLongPressDrag();
          startCanvasNodeDrag({
            blockPointerEvents: true,
            container,
            event,
            layerId: portalDragSubject.layerId,
            listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
            preserveClickUntilActive: true,
            selectLayer: portalDragSubject.selectLayer,
            selectedNode: portalDragSubject.selectedNode,
          });
          sourceTreePreviewHandledSelectionEvents.add(event);
          event.stopImmediatePropagation();
          return;
        }
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.stopPropagation();
        if (layerId && findSourceTreePreviewLayerNode(root, layerId)) {
          selectLayerEvent(
            layerId,
            requestsSourceTreePreviewExactRuntimeSelection(target, container)
              ? 'exact'
              : 'direct',
            false,
          );
        }
        return;
      }
      if (
        target &&
        runtimeInteractionTarget &&
        !runtimeActivation
      ) {
        const layerId =
          runtimeInteractionLayerId ??
          resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, container) ??
          resolveSourceTreePreviewCommandHoverLayerId(
            container,
            event.clientX,
            event.clientY,
            event.target,
            root,
          );
        const runtimeInteractionNode = layerId
          ? findSourceTreePreviewLayerNode(root, layerId)
          : null;
        event.preventDefault();
        if (
          layerId &&
          runtimeInteractionNode &&
          !activeCanvasDragCleanupRef.current
        ) {
          // A source-backed button/combobox inside an editor-owned portal is a
          // movable visual node too. Keep the short press available to the
          // shared click selector, but promote real pointer movement to the
          // same structural drag recognizer used by authored overlay rows.
          clearPendingCanvasLongPressDrag();
          startCanvasNodeDrag({
            blockPointerEvents: true,
            container,
            event,
            layerId,
            listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
            preserveClickUntilActive: true,
            selectedNode: runtimeInteractionNode,
          });
          sourceTreePreviewHandledSelectionEvents.add(event);
          event.stopImmediatePropagation();
          return;
        }
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.stopPropagation();
        return;
      }
      if (
        !target ||
        runtimeActivation ||
        !container.contains(target) ||
        isSourceTreePreviewEditableTarget(target) ||
        isSourceTreePreviewNoteBoxTarget(target) ||
        resolveSourceTreePreviewRuntimeInteractionTarget(target, container)
      ) return;
      const gestureSurface = resolveSourceTreePreviewRuntimePointerGestureSurface(event, container);
      if (!gestureSurface) return;
      const layerId = resolveSourceTreePreviewCommandHoverLayerId(
        container,
        event.clientX,
        event.clientY,
        event.target,
        root,
      );
      if (!layerId || !findSourceTreePreviewLayerNode(root, layerId)) return;
      pendingRuntimeGestureSelection = {
        clientX: event.clientX,
        clientY: event.clientY,
        layerId,
        pointerId: event.pointerId,
      };
    };
    const handleDocumentPointerMove = (event: PointerEvent) => {
      const pending = pendingRuntimeGestureSelection;
      if (!pending || pending.pointerId !== event.pointerId) return;
      if (
        Math.abs(event.clientX - pending.clientX) +
          Math.abs(event.clientY - pending.clientY) >=
        SOURCE_TREE_PREVIEW_DRAG_THRESHOLD_PX
      ) {
        clearPendingRuntimeGestureSelection();
      }
    };
    const handleDocumentPointerUp = (event: PointerEvent) => {
      deferRuntimeSurfacePreservationClear();
      const pending = pendingRuntimeGestureSelection;
      clearPendingRuntimeGestureSelection();
      if (!pending || pending.pointerId !== event.pointerId) return;
      if (
        Math.abs(event.clientX - pending.clientX) +
          Math.abs(event.clientY - pending.clientY) >=
        SOURCE_TREE_PREVIEW_DRAG_THRESHOLD_PX
      ) return;
      selectLayerFromClick(pending.layerId, 'direct', false);
      focusSourceTreePreviewRoot(container);
    };
    const handleWindowRuntimePointerUp = (event: PointerEvent) => {
      deferRuntimeSurfacePreservationClear();
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      const runtimeActivation = isRuntimeActivationGesture(event, target);
      const pendingRuntimeActivation = pendingRuntimeActivationGestureRef.current;
      if (
        pendingRuntimeActivation &&
        (
          pendingRuntimeActivation.pointerId === null ||
          pendingRuntimeActivation.pointerId === event.pointerId
        )
      ) {
        ownerWindow?.setTimeout(clearPendingRuntimeActivationGesture, 0);
      }
      if (
        target &&
        (event.metaKey || event.ctrlKey) &&
        isSourceTreePreviewPortalPointerTarget(target, container)
      ) {
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (
        event.shiftKey ||
        runtimeActivation
      ) return;
      if (
        !target ||
        (
          !isSourceTreePreviewPortalPointerTarget(target, container) &&
          !resolveSourceTreePreviewRuntimeInteractionTarget(target, container)
        )
      ) return;
      sourceTreePreviewHandledSelectionEvents.add(event);
      event.preventDefault();
      event.stopPropagation();
    };
    const handleWindowRuntimeMouseBoundary = (event: MouseEvent) => {
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      if (
        target &&
        (event.metaKey || event.ctrlKey) &&
        isSourceTreePreviewPortalPointerTarget(target, container)
      ) {
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (
        event.shiftKey ||
        isRuntimeActivationGesture(event, target)
      ) return;
      if (
        !target ||
        (
          !isSourceTreePreviewPortalPointerTarget(target, container) &&
          !resolveSourceTreePreviewRuntimeInteractionTarget(target, container)
        )
      ) return;
      sourceTreePreviewHandledSelectionEvents.add(event);
      event.preventDefault();
      event.stopPropagation();
    };
    const handlePortalModifierClick = (event: MouseEvent) => {
      if (sourceTreePreviewHandledSelectionEvents.has(event)) return;
      if (suppressNextClickRef.current) {
        const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
        // A fresh Option/Alt gesture inside the suppression window is a new
        // runtime activation, not the suppressed editor click.
        if (isRuntimeActivationGesture(event, target)) return;
        // Suppression means the editor owned the initiating gesture (modifier
        // selection, committed drag). The trailing click is editor-owned for
        // every preview surface, not only portal DOM — otherwise the click
        // leaks into the previewed component as a phantom runtime activation.
        if (
          target &&
          (
            container.contains(target) ||
            target.closest(
              `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
            )
          ) &&
          !isSourceTreePreviewEditableTarget(target) &&
          !isSourceTreePreviewNoteBoxTarget(target)
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const modifierPressed = event.metaKey || event.ctrlKey;
      if (modifierPressed) {
        if (selectPortalModifierTarget(event, modifierPressed)) return;
        const modifierTarget = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
        if (
          modifierTarget &&
          container.contains(modifierTarget) &&
          !isSourceTreePreviewEditableTarget(modifierTarget) &&
          !isSourceTreePreviewNoteBoxTarget(modifierTarget)
        ) {
          // Cmd/Ctrl is an editor selection chord. Selection was resolved at
          // pointerdown; the trailing click must not leak into the previewed
          // component as a runtime activation, and must not depend on which
          // node happens to be selected. Option/Alt stays the only runtime
          // activation path.
          sourceTreePreviewHandledSelectionEvents.add(event);
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      if (isRuntimeActivationGesture(event, target)) return;
      if (!target) return;
      const portalTarget = isSourceTreePreviewPortalPointerTarget(target, container);
      const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
        target,
        container,
      );
      const focusedRuntimeTarget = getSourceTreePreviewActiveRuntimeFocusTarget(container);
      if (
        !portalTarget &&
        !runtimeInteractionTarget &&
        container.contains(target) &&
        focusedRuntimeTarget
      ) {
        const layerId = resolveSourceTreePreviewPointerLayerId(event, container);
        sourceTreePreviewHandledSelectionEvents.add(event);
        event.preventDefault();
        event.stopPropagation();
        restoreSourceTreePreviewRuntimeFocusAfterEditorClick(
          container,
          focusedRuntimeTarget,
        );
        if (layerId && findSourceTreePreviewLayerNode(root, layerId)) {
          selectLayerFromClick(
            layerId,
            requestsSourceTreePreviewExactRuntimeSelection(target, container)
              ? 'exact'
              : 'direct',
            false,
            true,
          );
        }
        return;
      }
      if (!portalTarget && !runtimeInteractionTarget) return;
      const overlayItemLayerId = resolveSourceTreePreviewRuntimeOverlayItemLayerId(
        target,
        container,
        root,
      );
      const layerId = overlayItemLayerId ??
        (runtimeInteractionTarget
          ? getSourceTreePreviewElementNodeId(runtimeInteractionTarget)
          : null) ??
        resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, container) ??
        resolveSourceTreePreviewCommandHoverLayerId(
          container,
          event.clientX,
          event.clientY,
          event.target,
          root,
        );
      // An ordinary runtime click selects its authored control or portal row
      // without activating it. Option/Alt-click is reserved for the live
      // button, menu, listbox, dialog, or drawer action.
      sourceTreePreviewHandledSelectionEvents.add(event);
      event.preventDefault();
      event.stopPropagation();
      if (overlayItemLayerId) {
        selectRuntimeOverlayItemFromClick(overlayItemLayerId);
      } else if (layerId && findSourceTreePreviewLayerNode(root, layerId)) {
        selectLayerFromClick(
          layerId,
          requestsSourceTreePreviewExactRuntimeSelection(target, container)
            ? 'exact'
            : 'direct',
          false,
          true,
        );
      }
    };
    const bridgeRuntimeClickToHostDocument = (event: MouseEvent) => {
      const hostDocument = document;
      if (ownerDocument === hostDocument) return;
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      if (
        !target ||
        !container.contains(target) ||
        !resolveSourceTreePreviewRuntimeInteractionTarget(target, container)
      ) return;
      const hostWindow = hostDocument.defaultView;
      if (!hostWindow) return;

      // Project modules execute in the Workbench window while their rendered
      // nodes live in the isolated preview document. Libraries that register a
      // one-shot document click during pointerdown (Typeahead/Popover is a
      // common case) would otherwise only observe the next click in Layers.
      // Dispatch at the host document itself, without bubbling through the app
      // tree, so the component runtime completes the same gesture without
      // turning it into an editor click.
      hostDocument.dispatchEvent(new hostWindow.MouseEvent('click', {
        bubbles: false,
        cancelable: false,
        button: event.button,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }));
    };
    ownerDocument.addEventListener('pointerdown', handleDocumentPointerDown, true);
    ownerDocument.addEventListener('beforetoggle', handleRuntimeSurfaceBeforeToggle, true);
    ownerDocument.addEventListener('pointermove', handleDocumentPointerMove, true);
    ownerDocument.addEventListener('pointerup', handleDocumentPointerUp, true);
    ownerDocument.addEventListener('pointercancel', clearPendingRuntimeGestureSelection, true);
    ownerDocument.addEventListener('pointercancel', clearRuntimeSurfacePreservation, true);
    ownerDocument.addEventListener('pointercancel', clearPendingRuntimeActivationGesture, true);
    ownerDocument.addEventListener('click', handlePortalModifierClick, true);
    ownerDocument.addEventListener('click', bridgeRuntimeClickToHostDocument);
    ownerWindow?.addEventListener('pointerdown', handleDocumentPointerDown, true);
    ownerWindow?.addEventListener('pointerup', handleWindowRuntimePointerUp, true);
    ownerWindow?.addEventListener('mousedown', handleWindowRuntimeMouseBoundary, true);
    ownerWindow?.addEventListener('mouseup', handleWindowRuntimeMouseBoundary, true);
    ownerWindow?.addEventListener('click', handlePortalModifierClick, true);
    return () => {
      ownerDocument.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      ownerDocument.removeEventListener('beforetoggle', handleRuntimeSurfaceBeforeToggle, true);
      ownerDocument.removeEventListener('pointermove', handleDocumentPointerMove, true);
      ownerDocument.removeEventListener('pointerup', handleDocumentPointerUp, true);
      ownerDocument.removeEventListener('pointercancel', clearPendingRuntimeGestureSelection, true);
      ownerDocument.removeEventListener('pointercancel', clearRuntimeSurfacePreservation, true);
      ownerDocument.removeEventListener('pointercancel', clearPendingRuntimeActivationGesture, true);
      ownerDocument.removeEventListener('click', handlePortalModifierClick, true);
      ownerDocument.removeEventListener('click', bridgeRuntimeClickToHostDocument);
      ownerWindow?.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      ownerWindow?.removeEventListener('pointerup', handleWindowRuntimePointerUp, true);
      ownerWindow?.removeEventListener('mousedown', handleWindowRuntimeMouseBoundary, true);
      ownerWindow?.removeEventListener('mouseup', handleWindowRuntimeMouseBoundary, true);
      ownerWindow?.removeEventListener('click', handlePortalModifierClick, true);
      clearRuntimeSurfacePreservation();
    };
  }, [
    clearPendingRuntimeActivationGesture,
    clearPendingSingleClickSelection,
    isRuntimeActivationGesture,
    latchRuntimeActivationGesture,
    previewDocument,
    root,
    selectLayerEvent,
    selectLayerFromClick,
    selectRuntimeOverlayItemFromClick,
    startCanvasNodeDrag,
    suppressNextClick,
  ]);
  const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;
    preventSourceTreePreviewAnchorNavigation(event);
    if (event.detail === 1) {
      doubleClickDrillOriginRef.current = {
        previewDrillPath: [...previewDrillPath],
        selectedLayerId,
      };
    }
    const target = getSourceTreePreviewEventTargetElement(event);
    const container = event.currentTarget;
    const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
    const smartDeep = event.metaKey || event.ctrlKey;
    const overlayItemLayerId = resolveSourceTreePreviewRuntimeOverlayItemLayerId(
      target,
      container,
      root,
    );
    const modifierHitLayerId = smartDeep || additive
      ? resolveSourceTreePreviewCommandHoverLayerId(
          container,
          event.clientX,
          event.clientY,
          event.target,
          root,
        )
      : null;
    const delegatedNodeId = modifierHitLayerId ?? overlayItemLayerId ?? (
      target
        ? resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, container)
        : null
    );
    if (!delegatedNodeId) return;
    const requestsExactRuntimeSelection =
      requestsSourceTreePreviewExactRuntimeSelection(
        target,
        container,
        smartDeep,
        additive,
      );
    const delegatedSelectionMode =
      (overlayItemLayerId && !smartDeep) || requestsExactRuntimeSelection
        ? 'exact'
        : getSourceTreePreviewModifierSelectionMode(event);

    const nativeEvent = event.nativeEvent;
    const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
      target,
      container,
    );
    const runtimeActivation = isRuntimeActivationGesture(event, target);
    // The visible control is the editor selection target by default.
    // Option/Alt-click is the explicit path for opening, closing, or activating
    // the previewed runtime control. Synthetic clicks follow the same rule so
    // automated checks cannot hide a real pointer-path regression.
    if (runtimeInteractionTarget) {
      if (runtimeActivation && !smartDeep && !additive) {
        const directRuntimeTarget = target?.closest<HTMLElement>(
          SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR,
        );
        if (
          target &&
          !directRuntimeTarget &&
          runtimeInteractionTarget.matches('[aria-haspopup], [aria-controls]')
        ) {
          // Some component libraries render the visible chevron/suffix beside
          // the semantic popup trigger. The compact rendered shell still owns
          // the click, so forward that decoration click to the shell's popup
          // trigger instead of requiring project- or component-specific hit
          // area patches.
          event.preventDefault();
          event.stopPropagation();
          const runtimeWindow = getSourceTreePreviewOwnerWindow(
            runtimeInteractionTarget,
          );
          const RuntimeMouseEvent = runtimeWindow.MouseEvent ?? MouseEvent;
          runtimeInteractionTarget.dispatchEvent(new RuntimeMouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: runtimeWindow,
            altKey: true,
            button: event.button,
            clientX: event.clientX,
            clientY: event.clientY,
          }));
        }
        sourceTreePreviewHandledSelectionEvents.add(nativeEvent);
        return;
      }
      if (!findSourceTreePreviewLayerNode(root, delegatedNodeId)) return;
      sourceTreePreviewHandledSelectionEvents.add(nativeEvent);
      event.preventDefault();
      event.stopPropagation();
      if (overlayItemLayerId && !smartDeep && !additive) {
        selectRuntimeOverlayItemFromClick(overlayItemLayerId);
        return;
      }
      selectLayerFromClick(
        delegatedNodeId,
        delegatedSelectionMode,
        additive,
        true,
      );
      return;
    }
    const focusedRuntimeTarget = getSourceTreePreviewActiveRuntimeFocusTarget(container);
    const preserveRuntimeFocus =
      isSourceTreePreviewPortalPointerTarget(target, container) ||
      Boolean(
        focusedRuntimeTarget &&
        !runtimeActivation,
      );
    if (
      focusedRuntimeTarget &&
      !runtimeActivation
    ) {
      // Ordinary canvas clicks remain editor selection while a runtime popup
      // is open. Stop the component library's document click listener from
      // interpreting that same click as light-dismiss; Option/Alt retains the
      // explicit runtime path and the trigger can still toggle the popup.
      event.preventDefault();
      event.stopPropagation();
    }
    // A runtime-activation click on an unrecognized surface belongs entirely
    // to the previewed component; deferring editor selection here would make
    // Option/Alt both activate and re-select, stealing focus from the runtime.
    if (runtimeActivation) return;
    getSourceTreePreviewOwnerWindow(container).queueMicrotask(() => {
      if (sourceTreePreviewHandledSelectionEvents.has(nativeEvent)) return;
      if (!findSourceTreePreviewLayerNode(root, delegatedNodeId)) return;
      sourceTreePreviewHandledSelectionEvents.add(nativeEvent);
      selectLayerFromClick(
        delegatedNodeId,
        delegatedSelectionMode,
        additive,
        preserveRuntimeFocus,
      );
    });
  }, [
    isRuntimeActivationGesture,
    previewDrillPath,
    root,
    selectLayerFromClick,
    selectRuntimeOverlayItemFromClick,
    selectedLayerId,
  ]);
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSourceTreePreviewNoteBoxTarget(event.target)) return;
    if (event.button !== 0 || isSourceTreePreviewEditableTarget(event.target)) return;
    const eventTarget = getSourceTreePreviewEventTargetElement(event);
    // Option/Alt presses stay runtime-owned even inside the current selection.
    // The selected-node drag below takes pointer capture immediately, which
    // retargets pointerup/click away from the pressed control and silently
    // kills the component's own activation.
    if (isRuntimeActivationGesture(event, eventTarget)) return;
    const container = previewRef.current;
    if (
      container &&
      resolveSourceTreePreviewRuntimeInteractionTarget(eventTarget, container)
    ) return;
    const layerId = selectedLayerId;
    if (!container || !layerId || activeCanvasDragCleanupRef.current) return;
    const selectedNode = findSourceTreePreviewLayerNode(root, layerId);
    if (!selectedNode || selectedNode.id === root.id) return;
    if (shouldSourceTreePreviewRuntimeOwnPointerGesture(event, container, selectedNode)) return;
    if (isSourceTreePreviewPointerOnOtherSelectableLayer(event, container, layerId, getSourceTreePreviewNodeSubtreeIds(selectedNode))) return;

    const edge = resolveSourceTreePreviewResizeEdge(container, layerId, event.clientX, event.clientY);
    if (edge && onStyleDeclarationsChange) {
      clearPendingCanvasLongPressDrag();
      event.preventDefault();
      event.stopPropagation();
      setResizeEdge(edge);
      activeCanvasDragCleanupRef.current = startSourceTreePreviewResizeDrag({
        container,
        edge,
        event,
        layerId,
        onCommit: (patches) => {
          suppressNextClick();
          onStyleDeclarationsChange(layerId, patches, 'Resize source layer');
        },
        onDone: clearCanvasDrag,
      });
      return;
    }

    if (!isPointInsideSourceTreePreviewNode(container, selectedNode, event.clientX, event.clientY)) return;
    const selectedElement = getPreviewNodePrimaryElement(container, layerId);
    if (isSourceTreePreviewLongPressDragNode(selectedNode)) return;
    clearPendingCanvasLongPressDrag();
    const selectedStyle = selectedElement ? getSourceTreePreviewComputedStyle(selectedElement) : null;
    if (selectedElement && selectedStyle?.position === 'absolute' && onStyleDeclarationsChange) {
      event.preventDefault();
      event.stopPropagation();
      activeCanvasDragCleanupRef.current = startSourceTreePreviewPositionDrag({
        event,
        layerId,
        onCommit: (patches) => {
          suppressNextClick();
          onStyleDeclarationsChange(layerId, patches, 'Move absolute source layer');
        },
        onDone: clearCanvasDrag,
        target: selectedElement,
      });
      return;
    }

    if (!onMoveLayerToParent) return;
    event.preventDefault();
    event.stopPropagation();
    activeCanvasDragCleanupRef.current = startSourceTreePreviewNodeDrag({
      container,
      event,
      layerId,
      onActive: suppressNextClick,
      onCommit: (target) => {
        suppressNextClick();
        return onMoveLayerToParent(layerId, target.parentId, target.index);
      },
      onDone: clearCanvasDrag,
      onBlockedDropHintChange: updateBlockedDropHint,
      onDropTargetChange: updateDropTarget,
      onGhostChange: setDragGhost,
      onPreviewRootChange: updateDropPreviewRoot,
      onSuppressClick: suppressNextClick,
      root,
      selectedNode,
    });
  }, [
    clearCanvasDrag,
    clearPendingCanvasLongPressDrag,
    isRuntimeActivationGesture,
    onMoveLayerToParent,
    onStyleDeclarationsChange,
    root,
    selectedLayerId,
    suppressNextClick,
    updateBlockedDropHint,
    updateDropPreviewRoot,
    updateDropTarget,
  ]);
  const previewCursor = resizeEdge ? getSourceTreePreviewResizeCursor(resizeEdge) : undefined;
  const resolveNoteLinkTarget = useCallback((clientX: number, clientY: number) => {
    const container = previewRef.current;
    if (!container) return null;
    const element = getSourceTreePreviewHitElement(container, clientX, clientY);
    return element ? getSourceTreePreviewElementNodeId(element) : null;
  }, []);
  const handleNoteBoxPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !activeNoteBoxDraft || isSourceTreePreviewEditableTarget(event.target)) return false;
    const container = previewRef.current;
    if (!container || activeCanvasDragCleanupRef.current) return false;
    const target = getPreviewNodePrimaryElement(container, activeNoteBoxDraft.layerId);
    const targetRect = target ? getPreviewNodeVisualRect(target) : null;
    if (!targetRect || targetRect.width <= 0 || targetRect.height <= 0) return false;
    if (event.clientX < targetRect.left || event.clientX > targetRect.right || event.clientY < targetRect.top || event.clientY > targetRect.bottom) return false;

    clearPendingCanvasLongPressDrag();
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    const updateDraft = (clientX: number, clientY: number) => {
      const box = createSourceTreePreviewPixelBox(targetRect, startX, startY, clientX, clientY);
      setNoteBoxDraftRect(toSourceTreePreviewOverlayRectFromNoteBox(container, targetRect, box));
      return box;
    };
    updateDraft(startX, startY);

    const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      blockSourceTreePreviewPointerEvent(moveEvent);
      updateDraft(moveEvent.clientX, moveEvent.clientY);
    };
    const done = (doneEvent: SourceTreePreviewPointerGestureEvent) => {
      if (doneEvent.pointerId !== pointerId) return;
      blockSourceTreePreviewPointerEvent(doneEvent);
      cleanup();
      activeCanvasDragCleanupRef.current = null;
      const box = updateDraft(doneEvent.clientX, doneEvent.clientY);
      setNoteBoxDraftRect(null);
      if (box.width >= 4 && box.height >= 4) {
        onNoteHighlightBoxCreate?.(activeNoteBoxDraft.noteId, box);
      } else {
        onNoteHighlightBoxDraftEnd?.();
      }
    };
    const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
      activeCanvasDragCleanupRef.current = null;
      setNoteBoxDraftRect(null);
      onNoteHighlightBoxDraftEnd?.();
    };
    const cleanup = addSourceTreePreviewPointerGestureListeners({
      listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
      onCancel: cancel,
      onMove: move,
      onUp: done,
      ownerWindow,
    });
    activeCanvasDragCleanupRef.current = cleanup;
    return true;
  }, [
    activeNoteBoxDraft,
    clearPendingCanvasLongPressDrag,
    onNoteHighlightBoxCreate,
    onNoteHighlightBoxDraftEnd,
  ]);

  useEffect(() => {
    clearPendingCanvasLongPressDrag();
  }, [clearPendingCanvasLongPressDrag, selectedLayerId]);

  useEffect(() => {
    if (!activeNoteBoxDraft) setNoteBoxDraftRect(null);
  }, [activeNoteBoxDraft]);

  useLayoutEffect(() => {
    const container = previewRef.current;
    const ownerWindow = previewDocument?.defaultView;
    if (!container || !ownerWindow || !previewDocument || !projectRuntimeComponentsSettled) return undefined;
    const previousReset = initialScrollResetRef.current;
    if (previousReset?.previewDocument === previewDocument && previousReset.rootId === root.id) {
      return undefined;
    }
    initialScrollResetRef.current = { previewDocument, rootId: root.id };

    // Browsers can restore a nested scroll container after React's first
    // commit. Reset across the first few painted frames so a refreshed Design
    // page always opens at its authored top instead of the previous selection.
    let remainingFrames = 4;
    let animationFrameId = 0;
    const resetInitialScroll = () => {
      container.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      remainingFrames -= 1;
      if (remainingFrames > 0) {
        animationFrameId = ownerWindow.requestAnimationFrame(resetInitialScroll);
      }
    };
    resetInitialScroll();

    return () => ownerWindow.cancelAnimationFrame(animationFrameId);
  }, [previewDocument, projectRuntimeComponentsSettled, root.id]);

  useEffect(() => {
    setDismissedPreviewModalNodeIds(new Set());
  }, [root.id]);

  useEffect(() => {
    // A refreshed source projection can preserve this React component while
    // replacing every rendered node. Geometry from the previous tree must
    // never survive into the next projection.
    clearCanvasDrag();
  }, [clearCanvasDrag, root]);

  useEffect(() => () => {
    clearClickSuppression();
    clearPendingCanvasLongPressDrag();
    activeCanvasDragCleanupRef.current?.();
  }, [clearClickSuppression, clearPendingCanvasLongPressDrag]);

  useLayoutEffect(() => {
    if (!previewDocument) return undefined;
    const syncPreviewHead = () => syncSourceTreePreviewFrameHead(
      previewDocument,
      previewThemeMode ?? 'system',
      tailwindRuntimeCss,
      fontCssText,
      tailwindCssMode,
    );
    syncPreviewHead();
    const observer = new MutationObserver(syncPreviewHead);
    observer.observe(document.head, { attributes: true, characterData: true, childList: true, subtree: true });
    observer.observe(document.documentElement, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    observer.observe(document.body, { attributeFilter: ['data-theme', 'data-wb-theme'], attributes: true });
    return () => observer.disconnect();
  }, [fontCssText, previewDocument, previewThemeMode, tailwindCssMode, tailwindRuntimeCss]);

  useLayoutEffect(() => {
    const container = previewRef.current;
    if (!container || !previewDocument) return undefined;
    if (!shouldTrackRenderedTailwindClassNames) {
      setRenderedTailwindClassNameSignature((currentSignature) => (
        currentSignature === '' ? currentSignature : ''
      ));
      return undefined;
    }
    const ownerWindow = previewDocument.defaultView ?? window;
    const trackingRoot = previewDocument.body ?? container;
    const classNameTracker = createSourceTreePreviewRenderedClassNameTracker(trackingRoot);
    let frameId: number | null = null;
    const syncRenderedClassNames = (mutationRecords?: MutationRecord[]) => {
      if (mutationRecords) classNameTracker.applyMutationRecords(mutationRecords);
      const nextSignature = classNameTracker.getSignature();
      setRenderedTailwindClassNameSignature((currentSignature) => (
        currentSignature === nextSignature ? currentSignature : nextSignature
      ));
    };
    const scheduleSync = (mutationRecords: MutationRecord[]) => {
      if (mutationRecords.length > 0) classNameTracker.applyMutationRecords(mutationRecords);
      if (frameId !== null) return;
      frameId = ownerWindow.requestAnimationFrame(() => {
        frameId = null;
        syncRenderedClassNames();
      });
    };
    syncRenderedClassNames();
    const Observer = ownerWindow.MutationObserver ?? MutationObserver;
    const observer = new Observer(scheduleSync);
    observer.observe(trackingRoot, {
      attributeFilter: ['class'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      if (frameId !== null) ownerWindow.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [previewDocument, root.id, shouldTrackRenderedTailwindClassNames]);

  useLayoutEffect(() => {
    const container = previewRef.current;
    if (!container || !previewDocument) return undefined;
    const ownerWindow = previewDocument.defaultView ?? window;
    let frameId: number | null = null;
    const syncControlledSurfaceOwnership = () => {
      frameId = null;
      projectSourceTreePreviewControlledSurfaceOwnership(container, root);
    };
    const scheduleSync = () => {
      if (frameId !== null) return;
      frameId = ownerWindow.requestAnimationFrame(syncControlledSurfaceOwnership);
    };
    syncControlledSurfaceOwnership();
    const Observer = ownerWindow.MutationObserver ?? MutationObserver;
    const observer = new Observer(scheduleSync);
    observer.observe(previewDocument.body ?? container, {
      attributeFilter: ['aria-controls', 'id', 'open', 'popover', 'class'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      if (frameId !== null) ownerWindow.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [previewDocument, root]);

  useLayoutEffect(() => {
    if (!previewDocument) return;
    syncSourceTreePreviewFrameTokenVariables(previewDocument, tokenVariables);
  }, [previewDocument, tokenVariables]);

  useLayoutEffect(() => {
    const container = previewRef.current;
    if (!container) return undefined;
    return watchSourceTreePreviewModalScrollState(container);
  }, [root]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container || !previewDocument) return undefined;
    const handleNativeDragStart = (event: MouseEvent | PointerEvent) => {
      if (!isSourceTreePreviewNode(event.target) || !container.contains(event.target)) return;
      nodeDragStartEvent(event);
    };
    previewDocument.addEventListener('pointerdown', handleNativeDragStart, true);
    previewDocument.addEventListener('mousedown', handleNativeDragStart, true);
    return () => {
      previewDocument.removeEventListener('pointerdown', handleNativeDragStart, true);
      previewDocument.removeEventListener('mousedown', handleNativeDragStart, true);
    };
  }, [nodeDragStartEvent, previewDocument]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container || !previewDocument) return undefined;
    return installSourceTreePreviewWheelScroll(container, selectedLayerId);
  }, [previewDocument, selectedLayerId]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container || !previewDocument) return undefined;
    const isPreviewShortcutTarget = (targetValue: EventTarget | null) => {
      const target = isSourceTreePreviewHTMLElement(targetValue) ? targetValue : null;
      const portalRoot = target?.closest<HTMLElement>(
        `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
      ) ?? null;
      const isDocumentRootTarget = target === previewDocument.body || target === previewDocument.documentElement;
      return !target || isDocumentRootTarget || container.contains(target) || Boolean(portalRoot);
    };
    const handlePreviewDocumentShortcut = (event: KeyboardEvent) => {
      if (!isPreviewShortcutTarget(event.target)) return;
      if (handleSourceTreePreviewShortcut(event, {
        onCopySelection: copySelectionEvent,
        onCutSelection: cutSelectionEvent,
        onDeleteSelection: deleteSelectionEvent,
        onDuplicateSelection: duplicateSelectionEvent,
        onHistoryRedo: historyRedoEvent,
        onHistoryUndo: historyUndoEvent,
        onInsertChild: insertChildEvent,
        onPasteNode: pasteNodeEvent,
        onWrapSelection: wrapSelectionEvent,
      })) return;
      const intent = resolveSourceTreePreviewKeyboardMoveIntent(event, container, selectedLayerId);
      if (!intent || !selectedLayerId || !onMoveLayer) return;
      event.preventDefault();
      event.stopPropagation();
      onMoveLayer(selectedLayerId, intent);
    };
    const handlePreviewDocumentBeforeInput = (event: InputEvent) => {
      if (!isPreviewShortcutTarget(event.target)) return;
      handleSourceTreePreviewHistoryInput(event, {
        onHistoryRedo: historyRedoEvent,
        onHistoryUndo: historyUndoEvent,
      });
    };
    const handlePreviewDocumentCut = (event: ClipboardEvent) => {
      const target = isSourceTreePreviewHTMLElement(event.target) ? event.target : null;
      const portalRoot = target?.closest<HTMLElement>(
        `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
      ) ?? null;
      const isDocumentRootTarget = target === previewDocument.body || target === previewDocument.documentElement;
      if (target && !isDocumentRootTarget && !container.contains(target) && !portalRoot) return;
      if (isSourceTreePreviewEditableTarget(event.target) || !cutSelectionEvent) return;
      event.preventDefault();
      event.stopPropagation();
      cutSelectionEvent();
    };
    previewDocument.addEventListener('keydown', handlePreviewDocumentShortcut, true);
    previewDocument.addEventListener('beforeinput', handlePreviewDocumentBeforeInput, true);
    previewDocument.addEventListener('cut', handlePreviewDocumentCut, true);
    return () => {
      previewDocument.removeEventListener('keydown', handlePreviewDocumentShortcut, true);
      previewDocument.removeEventListener('beforeinput', handlePreviewDocumentBeforeInput, true);
      previewDocument.removeEventListener('cut', handlePreviewDocumentCut, true);
    };
  }, [
    copySelectionEvent,
    cutSelectionEvent,
    deleteSelectionEvent,
    duplicateSelectionEvent,
    historyRedoEvent,
    historyUndoEvent,
    insertChildEvent,
    onMoveLayer,
    pasteNodeEvent,
    previewDocument,
    selectedLayerId,
    wrapSelectionEvent,
  ]);

  const renderedRoot = dropPreviewRoot ?? root;
  useLayoutEffect(() => {
    const previousSelectedLayerId = previousSelectedLayerIdRef.current;
    previousSelectedLayerIdRef.current = selectedLayerId;
    if (
      !selectedLayerId ||
      selectedLayerId === previousSelectedLayerId ||
      !previewDocument ||
      !projectRuntimeComponentsSettled ||
      dragGhost
    ) return undefined;

    const container = previewRef.current;
    const ownerWindow = previewDocument.defaultView;
    if (!container || !ownerWindow) return undefined;

    // Layer-panel selections can point below the current canvas viewport. Keep
    // the selected source node visible without changing page-load scroll
    // restoration or scrolling the outer editor shell.
    let remainingFrames = 8;
    let animationFrameId = 0;
    const revealSelection = () => {
      animationFrameId = 0;
      if (scrollSourceTreePreviewSelectionIntoView(container, renderedRoot, selectedLayerId)) return;
      remainingFrames -= 1;
      if (remainingFrames > 0) {
        animationFrameId = ownerWindow.requestAnimationFrame(revealSelection);
      }
    };
    animationFrameId = ownerWindow.requestAnimationFrame(revealSelection);
    return () => {
      if (animationFrameId) ownerWindow.cancelAnimationFrame(animationFrameId);
    };
  }, [dragGhost, previewDocument, projectRuntimeComponentsSettled, renderedRoot, selectedLayerId]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Dev-only canvas diagnostics: lets the gesture-test harness
    // (scripts/gesture-tests) and manual debugging ask the live editor how a
    // rendered element resolves to authored source nodes, without going
    // through real pointer input. Not part of the editor contract.
    const diagnosticsWindow = window as unknown as { __workbenchCanvasDiagnostics?: unknown };
    diagnosticsWindow.__workbenchCanvasDiagnostics = {
      resolveOverlayItemLayerId: (target: HTMLElement) => (
        previewRef.current
          ? resolveSourceTreePreviewRuntimeOverlayItemLayerId(target, previewRef.current, root)
          : null
      ),
      resolveSelectionHit: (clientX: number, clientY: number, target: EventTarget | null) => (
        previewRef.current
          ? resolveSourceTreePreviewSelectionHit(previewRef.current, clientX, clientY, target, root)
          : null
      ),
      getLastDropDecision: () => ({ ...SOURCE_TREE_PREVIEW_LAST_DROP_DECISION }),
      describePointResolution: (clientX: number, clientY: number) => {
        const container = previewRef.current;
        if (!container) return null;
        const describe = (element: HTMLElement | null) => (element ? {
          cls: element.className.toString().slice(0, 30),
          own: element.getAttribute('data-wb-preview-node-id')?.slice(-14) ?? null,
          owner: element.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE)?.slice(-14) ?? null,
          tag: element.tagName.toLowerCase(),
        } : null);
        const elementsFromPoint = container.ownerDocument.elementsFromPoint?.(clientX, clientY) ?? [];
        const stack = elementsFromPoint.filter(isSourceTreePreviewHTMLElement).slice(0, 6);
        // Same scoping the resolver applies, or `ownCandidates` reports nodes
        // the resolver has already excluded and the readout misleads.
        const pointHitScope = getSourceTreePreviewPointHitScope(elementsFromPoint, container);
        const selectable = Array.from(
          container.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR),
        ).filter((element) => isSourceTreePreviewElementInPointHitScope(element, pointHitScope));
        return {
          hitScope: pointHitScope.slice(0, 4).map(describe),
          stack: stack.map(describe),
          visualBoundsOwner: describe(
            resolveSourceTreePreviewVisualBoundsPointOwnerNode(stack, container),
          ),
          ownCandidates: getSourceTreePreviewPointHitCandidates(
            selectable,
            clientX,
            clientY,
            getSourceTreePreviewOwnHitRects,
            container,
          )
            .sort((left, right) => (
              (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height) ||
              right.depth - left.depth
            ))
            .slice(0, 5)
            .map((candidate) => ({
              ...describe(candidate.element),
              area: Math.round(candidate.rect.width * candidate.rect.height),
            })),
          resolvedDeep: resolveSourceTreePreviewElementFromPointNodeId(container, clientX, clientY)?.slice(-14) ?? null,
          resolvedDirect: resolveSourceTreePreviewElementFromPointNodeId(container, clientX, clientY, 'direct')?.slice(-14) ?? null,
        };
      },
      describeSelectionAnchors: (layerId: string) => {
        const container = previewRef.current;
        if (!container) return null;
        const describe = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          return {
            className: element.className.toString().slice(0, 40),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
          };
        };
        return {
          overlayLayerIds: getSourceTreePreviewOverlayLayerIds(container, root, layerId),
          transparentRuntimeSelection: isSourceTreePreviewTransparentRuntimeSelectionNode(root, layerId),
          elements: getPreviewNodeElements(container, layerId).map(describe),
          footprint: getSourceTreePreviewNodeFootprintElements(container, layerId).map(describe),
        };
      },
      resolveCoincidentSelectionChain: (hitLayerId: string) => (
        previewRef.current
          ? resolveSourceTreePreviewCoincidentSelectionChain(previewRef.current, root, hitLayerId)
          : null
      ),
    };
  }, [root]);
  const previewContent = (
    <div
      ref={previewRef}
      className={activeNoteBoxDraft ? `${getLibraryScopeClassName()} wb-source-visual-preview wb-source-visual-preview--note-box-drawing` : `${getLibraryScopeClassName()} wb-source-visual-preview`}
      data-astryx-media={previewThemeMode}
      data-workbench-preview-root="true"
      data-theme={previewThemeMode}
      data-wb-token-modes={previewTokenModeAttribute}
      data-wb-preview-appearance={previewAppearance}
      aria-label={ariaLabel}
      style={{
        ...tokenVariables,
        ...(previewCursor ? { cursor: previewCursor } : null),
      }}
      tabIndex={0}
      onKeyDown={(event) => {
        if (handleSourceTreePreviewShortcut(event, {
          onCopySelection: copySelectionEvent,
          onCutSelection: cutSelectionEvent,
          onDeleteSelection: deleteSelectionEvent,
          onDuplicateSelection: duplicateSelectionEvent,
          onHistoryRedo: historyRedoEvent,
          onHistoryUndo: historyUndoEvent,
          onInsertChild: insertChildEvent,
          onPasteNode: pasteNodeEvent,
          onWrapSelection: wrapSelectionEvent,
        })) return;
        const intent = resolveSourceTreePreviewKeyboardMoveIntent(event, previewRef.current, selectedLayerId);
        if (!intent || !selectedLayerId || !onMoveLayer) return;
        event.preventDefault();
        event.stopPropagation();
        onMoveLayer(selectedLayerId, intent);
      }}
      onClick={(event) => {
        if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) {
          // Capture has already assigned this click to the runtime control.
          // Let the native event continue to the preview document: component
          // libraries commonly finish pointer-open gestures from a document
          // click listener (for example Astryx BaseTypeahead). Stopping here
          // focuses the control but prevents its overlay from ever opening.
          return;
        }
        if (suppressNextClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        const eventTarget = getSourceTreePreviewEventTargetElement(event);
        const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
        const smartDeep = event.metaKey || event.ctrlKey;
        const runtimeInteractionTarget = resolveSourceTreePreviewRuntimeInteractionTarget(
          eventTarget,
          event.currentTarget,
        );
        const runtimeActivation = isRuntimeActivationGesture(event, eventTarget);
        const portalRuntimeTarget = isSourceTreePreviewPortalPointerTarget(
          event.target,
          event.currentTarget,
        );
        if (portalRuntimeTarget && runtimeActivation && !smartDeep && !additive) {
          return;
        }
        if (runtimeInteractionTarget && runtimeActivation && !smartDeep && !additive) {
          return;
        }
        const delegatedNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, event.currentTarget);
        if (delegatedNodeId) {
          event.stopPropagation();
          sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);
          const selectionMode =
            requestsSourceTreePreviewExactRuntimeSelection(
              eventTarget,
              event.currentTarget,
              smartDeep,
              additive,
            )
              ? 'exact'
              : getSourceTreePreviewModifierSelectionMode(event);
          selectLayerFromClick(
            delegatedNodeId,
            selectionMode,
            additive,
            Boolean(portalRuntimeTarget || runtimeInteractionTarget),
          );
          return;
        }
        if (
          event.target === event.currentTarget &&
          (!eventTarget || eventTarget === event.currentTarget)
        ) {
          onClearSelection?.();
        }
      }}
      onDoubleClick={(event) => {
        const delegatedNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, event.currentTarget);
        if (!delegatedNodeId) return;
        event.stopPropagation();
        drillIntoLayerFromDoubleClick(delegatedNodeId);
      }}
      onClickCapture={handleClickCapture}
      onDragStartCapture={preventSourceTreePreviewNativeDrag}
      onMouseDownCapture={(event) => {
        const eventTarget = getSourceTreePreviewEventTargetElement(event);
        if (isRuntimeActivationGesture(event, eventTarget)) return;
        nodeDragStartEvent(event);
      }}
      onPointerDownCapture={(event) => {
        if (isSourceTreePreviewRuntimeActivationEvent(event)) return;
        if (latchRuntimeActivationGesture(event, event.currentTarget)) return;
        if (handleNoteBoxPointerDown(event)) return;
        // Let the React canvas recognizer observe this same press.
        nodeDragStartEvent(event);
      }}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onDragLeave={(event) => {
        const nextTarget = event.relatedTarget;
        if (!activeNoteLinkDragId || (isSourceTreePreviewNode(nextTarget) && event.currentTarget.contains(nextTarget))) return;
        setNoteLinkTargetId(null);
      }}
      onDragOver={(event) => {
        if (!activeNoteLinkDragId) return;
        const targetId = resolveNoteLinkTarget(event.clientX, event.clientY);
        if (!targetId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'link';
        setNoteLinkTargetId(targetId);
      }}
      onDrop={(event) => {
        if (!activeNoteLinkDragId) return;
        const targetId = noteLinkTargetId ?? resolveNoteLinkTarget(event.clientX, event.clientY);
        setNoteLinkTargetId(null);
        if (!targetId) return;
        event.preventDefault();
        onNoteLinkDrop?.(activeNoteLinkDragId, targetId);
      }}
    >
      <SourceTreePreviewNode
        key={renderedRoot.id}
        assetRegistry={assetRegistry}
        node={renderedRoot}
        i18nTokens={i18nTokens}
        dismissedPreviewModalNodeIds={dismissedPreviewModalNodeIds}
        previewDrillPath={previewDrillPath}
        previewTokenModes={previewTokenModes}
        projectRuntimeComponents={projectRuntimeComponents}
        runtimeDescendantNodeIds={runtimeDescendantNodeIds}
        selectable
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIdSet}
        sourcePreviewOnly={false}
        tokenRegistry={tokenRegistry}
        onDismissPreviewModal={dismissPreviewModal}
        onSourceNodeComponentPropChange={sourceNodeComponentPropChangeEvent}
        onDrillIntoLayer={drillIntoLayerFromDoubleClick}
        onNodeDragStart={nodeDragStartEvent}
        onSelectLayer={selectLayerFromClick}
      />
      <SourceTreePreviewSelectionOverlay
        containerRef={previewRef}
        dragActive={Boolean(dragGhost)}
        layoutKey={renderedRoot}
        root={renderedRoot}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds ?? []}
        variant={selectedLayerReadOnly || isEditableTreeSourcePreviewOnlyNode(root, selectedLayerId) ? 'source-preview' : 'selection'}
      />
      <SourceTreePreviewSelectionOverlay
        containerRef={previewRef}
        dragActive={Boolean(dragGhost)}
        layoutKey={renderedRoot}
        root={renderedRoot}
        selectedLayerId={commandHoverSelectionLayerId}
        selectedLayerIds={[]}
        variant="hover"
      />
      <SourceTreePreviewMeasurementOverlay
        containerRef={previewRef}
        hoveredLayerId={visibleCommandHoverLayerId}
        layoutKey={renderedRoot}
        selectedLayerId={selectedLayerId}
      />
      {activeNoteLinkDragId ? (
        <SourceTreePreviewSelectionOverlay
          containerRef={previewRef}
          layoutKey={renderedRoot}
          root={renderedRoot}
          selectedLayerId={noteLinkTargetId}
          selectedLayerIds={[]}
          variant="note-link"
        />
      ) : null}
      {activeNotePreviewLayerId && (activeNoteHighlightBoxes.length === 0 || activeNoteBoxDraft) ? (
        <SourceTreePreviewSelectionOverlay
          containerRef={previewRef}
          layoutKey={renderedRoot}
          root={renderedRoot}
          selectedLayerId={activeNotePreviewLayerId}
          selectedLayerIds={[]}
          variant="note-link"
        />
      ) : null}
      <SourceTreePreviewNoteHighlightOverlay
        activeBoxId={activeNoteHighlightBoxId ?? null}
        boxes={activeNoteHighlightBoxes}
        containerRef={previewRef}
        draftRect={noteBoxDraftRect}
        layerId={activeNotePreviewLayerId ?? null}
        layoutKey={renderedRoot}
        noteId={activeNotePreviewNoteId ?? null}
        onBoxChange={onNoteHighlightBoxChange}
        onBoxPreviewChange={onNoteHighlightBoxPreviewChange}
      />
      <SourceTreePreviewLongPressReadyIndicator value={longPressDragReadyRect} />
      <SourceTreePreviewGridSlotOverlay value={dropTarget} />
      <SourceTreePreviewDropIndicator value={dropTarget} />
      <SourceTreePreviewBlockedDropIndicator value={blockedDropHint} />
      <SourceTreePreviewDragGhost value={dragGhost} />
    </div>
  );

  const previewPortalRoot = previewDocument?.querySelector<HTMLElement>(
    SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR,
  ) ?? null;
  const previewStage = previewDocument?.getElementById('wb-source-preview-stage') ?? null;

  return (
    <>
      <iframe
        className="wb-source-visual-preview-frame"
        title={ariaLabel}
        srcDoc={SOURCE_TREE_PREVIEW_FRAME_HTML}
        onLoad={handlePreviewFrameLoad}
      />
      {previewDocument?.body
        ? createPortal(
            <WorkbenchPortalScopeContext.Provider value={previewPortalRoot}>
              {previewContent}
            </WorkbenchPortalScopeContext.Provider>,
            previewStage ?? previewDocument.body,
          )
        : null}
    </>
  );
}

type SourceTreePreviewGlobalPatchState = {
  previewDocument: Document;
  restore: () => void;
};

let activeSourceTreePreviewGlobalPatch: SourceTreePreviewGlobalPatchState | null = null;

// Modal scroll locks (vaul / Radix via react-remove-scroll) guard these three.
const SOURCE_TREE_PREVIEW_SCROLL_LOCK_GUARD_EVENTS = new Set(['touchmove', 'touchstart', 'wheel']);

// Workbench's own document-level wheel bridge opts out of the scroll-lock
// rewrite below: it is already preview-scoped and must keep running while a
// project overlay is open.
const SOURCE_TREE_PREVIEW_OWN_WHEEL_LISTENER = Symbol.for('workbench.sourceTreePreview.ownWheelListener');

type SourceTreePreviewOwnListener = {
  [SOURCE_TREE_PREVIEW_OWN_WHEEL_LISTENER]?: true;
};

// A project overlay always portals into a Workbench-owned portal root inside the
// preview document, so "an overlay opened inside the preview" is our own state
// rather than a vaul/Radix DOM contract we would have to track. Both roots
// count: a project whose page carries a theme scope resolves its portal
// container to the theme portal root, and checking only the frame-level root
// left the scroll-lock guard below permanently inert for those projects.
function hasSourceTreePreviewOwnedOverlay(previewDocument: Document): boolean {
  const portalRoots = previewDocument.querySelectorAll(
    `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
  );
  for (const portalRoot of portalRoots) {
    if (portalRoot.firstElementChild) return true;
  }
  return false;
}

// Project modules execute in the Workbench window while their nodes live in
// the preview iframe. Rich inputs such as ChatComposerInput read the global
// Selection during input events, and responsive components read
// window.matchMedia, so both reads are routed to the iframe realm. The
// installer is idempotent per preview document and must run BEFORE the portal
// children first render (see handlePreviewFrameLoad) — otherwise the first
// render observes the unpatched globals and the canvas would need a full
// remount to correct it.
function installSourceTreePreviewGlobalPatches(previewDocument: Document): void {
  const previewWindow = previewDocument.defaultView;
  if (!previewWindow) return;
  if (activeSourceTreePreviewGlobalPatch?.previewDocument === previewDocument) return;
  activeSourceTreePreviewGlobalPatch?.restore();

  const originalGetSelection = window.getSelection;
  const patchedGetSelection: typeof window.getSelection = () => {
    const previewSelection = previewWindow.getSelection();
    const anchorNode = previewSelection?.anchorNode ?? null;
    if (
      previewSelection &&
      previewSelection.rangeCount > 0 &&
      anchorNode?.ownerDocument === previewDocument
    ) {
      return previewSelection;
    }
    return originalGetSelection.call(window);
  };
  window.getSelection = patchedGetSelection;

  let restoreMatchMedia = () => {};
  if (typeof window.matchMedia === 'function' && typeof previewWindow.matchMedia === 'function') {
    const originalMatchMedia = window.matchMedia;
    const patchedMatchMedia: typeof window.matchMedia = (query: string) => {
      if (SOURCE_TREE_PREVIEW_VIEWPORT_MEDIA_QUERY_PATTERN.test(query)) {
        return previewWindow.matchMedia(query);
      }
      return originalMatchMedia.call(window, query);
    };
    window.matchMedia = patchedMatchMedia;
    restoreMatchMedia = () => {
      if (window.matchMedia === patchedMatchMedia) {
        window.matchMedia = originalMatchMedia;
      }
    };
  }

  // react-remove-scroll registers its non-passive wheel/touch guard on the
  // module realm's `document` — the Workbench document — and preventDefaults
  // every event that is not inside the lock node. When the overlay opened
  // inside the preview, the lock node lives in the iframe, so no Workbench node
  // can ever be inside it and the guard cancels every editor wheel: the layer
  // tree and Inspector stop scrolling until the overlay closes. Skip those
  // guards while a preview-owned overlay is open. Workbench's own overlays keep
  // theirs, because they do not portal into the preview root.
  const originalAddEventListener = document.addEventListener;
  const originalRemoveEventListener = document.removeEventListener;
  const scrollLockGuards = new Map<EventListenerOrEventListenerObject, EventListener>();
  const isScrollLockGuard = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) => Boolean(listener)
    && SOURCE_TREE_PREVIEW_SCROLL_LOCK_GUARD_EVENTS.has(type)
    && typeof options === 'object'
    && options?.passive === false
    && !(listener as SourceTreePreviewOwnListener)[SOURCE_TREE_PREVIEW_OWN_WHEEL_LISTENER];

  const patchedAddEventListener = function patchedAddEventListener(
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!listener || !isScrollLockGuard(type, listener, options)) {
      originalAddEventListener.call(this, type, listener as EventListenerOrEventListenerObject, options);
      return;
    }
    const target = listener;
    let guard = scrollLockGuards.get(target);
    if (!guard) {
      guard = (event: Event) => {
        if (hasSourceTreePreviewOwnedOverlay(previewDocument)) return;
        if (typeof target === 'function') target.call(this, event);
        else target.handleEvent(event);
      };
      scrollLockGuards.set(target, guard);
    }
    originalAddEventListener.call(this, type, guard, options);
  } as typeof document.addEventListener;

  const patchedRemoveEventListener = function patchedRemoveEventListener(
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    const guard = listener ? scrollLockGuards.get(listener) : undefined;
    if (!listener || !guard) {
      originalRemoveEventListener.call(this, type, listener as EventListenerOrEventListenerObject, options);
      return;
    }
    scrollLockGuards.delete(listener);
    originalRemoveEventListener.call(this, type, guard, options);
  } as typeof document.removeEventListener;

  document.addEventListener = patchedAddEventListener;
  document.removeEventListener = patchedRemoveEventListener;

  const state: SourceTreePreviewGlobalPatchState = {
    previewDocument,
    restore: () => {
      restoreMatchMedia();
      if (document.addEventListener === patchedAddEventListener) {
        document.addEventListener = originalAddEventListener;
      }
      if (document.removeEventListener === patchedRemoveEventListener) {
        document.removeEventListener = originalRemoveEventListener;
      }
      scrollLockGuards.clear();
      if (window.getSelection === patchedGetSelection) {
        window.getSelection = originalGetSelection;
      }
      if (activeSourceTreePreviewGlobalPatch === state) {
        activeSourceTreePreviewGlobalPatch = null;
      }
    },
  };
  activeSourceTreePreviewGlobalPatch = state;
}

function useSourceTreePreviewFrameGlobalPatches(previewDocument: Document | null): void {
  useLayoutEffect(() => {
    if (!previewDocument) return undefined;
    // Normally a no-op: handlePreviewFrameLoad already installed the patches
    // for this document. This effect re-installs after another preview
    // instance took over the globals, and restores them on unmount.
    installSourceTreePreviewGlobalPatches(previewDocument);
    return () => {
      if (activeSourceTreePreviewGlobalPatch?.previewDocument === previewDocument) {
        activeSourceTreePreviewGlobalPatch.restore();
      }
    };
  }, [previewDocument]);
}

export function syncSourceTreePreviewFrameHead(
  targetDocument: Document,
  previewThemeMode: 'system' | 'light' | 'dark' = 'light',
  tailwindRuntimeCss = '',
  fontCssText = '',
  tailwindCssMode: SourceTreePreviewTailwindCssMode = 'disabled',
) {
  syncSourceTreePreviewFrameTheme(targetDocument, previewThemeMode);
  syncSourceTreePreviewFramePreviewTheme(targetDocument, previewThemeMode);
  const frameStyle = targetDocument.createElement('style');
  frameStyle.dataset.wbSourcePreviewFrameCss = 'true';
  frameStyle.textContent = sourceTreePreviewFrameCss;
  const frameBase = targetDocument.createElement('base');
  frameBase.href = toWorkbenchProjectAssetBaseUrl();
  const projectStylesheetNodes = Array.from(document.head.children)
    .map(cloneProjectPreviewStylesheetNode)
    .filter((node): node is HTMLStyleElement | HTMLLinkElement => Boolean(node));
  const tailwindFallbackStyle = createSourceTreePreviewTailwindFallbackStyle(targetDocument, tailwindCssMode);
  const tailwindRuntimeStyle = createSourceTreePreviewTailwindRuntimeStyle(targetDocument, tailwindRuntimeCss);
  const fontStyle = createSourceTreePreviewFontStyle(targetDocument, fontCssText);
  const headSignature = getSourceTreePreviewFrameHeadSignature(
    frameBase.href,
    projectStylesheetNodes,
    tailwindFallbackStyle?.textContent ?? '',
    fontStyle?.textContent ?? '',
    tailwindRuntimeStyle?.textContent ?? '',
  );
  const structureSignature = getSourceTreePreviewFrameStructureSignature(
    frameBase.href,
    projectStylesheetNodes,
    tailwindFallbackStyle?.textContent ?? '',
    fontStyle?.textContent ?? '',
  );
  if (SOURCE_TREE_PREVIEW_FRAME_HEAD_SIGNATURES.get(targetDocument) === headSignature) return;
  if (SOURCE_TREE_PREVIEW_FRAME_STRUCTURE_SIGNATURES.get(targetDocument) === structureSignature) {
    syncSourceTreePreviewTailwindRuntimeStyleNode(targetDocument, tailwindRuntimeCss);
  } else {
    // Project runtime code may inject its own stylesheets into the frame
    // document (a Vue Theme provider writes its token and theme CSS to the
    // owning document; a CSS-in-JS runtime does the same). Those nodes are
    // not part of the synced set, so a rebuild must carry them across instead
    // of silently dropping them the moment a component module finishes
    // loading and adds a new SFC stylesheet. Only nodes that appeared after
    // the previous sync qualify: the first sync still replaces the srcdoc
    // shell (its meta tags and base <style>) with the managed frame CSS.
    const previouslySyncedNodes = SOURCE_TREE_PREVIEW_FRAME_SYNCED_HEAD_NODES.get(targetDocument);
    const retainedNodes = previouslySyncedNodes
      ? Array.from(targetDocument.head.children).filter(
          (node) => !previouslySyncedNodes.has(node) && !isSourceTreePreviewManagedFrameHeadNode(node),
        )
      : [];
    const syncedNodes: Element[] = [
      frameBase,
      frameStyle,
      ...(tailwindFallbackStyle ? [tailwindFallbackStyle] : []),
      ...projectStylesheetNodes,
      // Preview-generated utility CSS is exclusive to fallback mode. Compiled
      // project CSS is never mixed with Workbench-generated Tailwind rules.
      ...(tailwindRuntimeStyle ? [tailwindRuntimeStyle] : []),
      ...(fontStyle ? [fontStyle] : []),
    ];
    targetDocument.head.replaceChildren(...syncedNodes, ...retainedNodes);
    SOURCE_TREE_PREVIEW_FRAME_SYNCED_HEAD_NODES.set(targetDocument, new Set(syncedNodes));
    SOURCE_TREE_PREVIEW_FRAME_STRUCTURE_SIGNATURES.set(targetDocument, structureSignature);
  }
  SOURCE_TREE_PREVIEW_FRAME_HEAD_SIGNATURES.set(targetDocument, headSignature);
}

// Every head node the frame sync itself writes; anything else was injected
// by project runtime code and belongs to it.
function isSourceTreePreviewManagedFrameHeadNode(node: Element): boolean {
  if (node instanceof HTMLBaseElement) return true;
  if (!(node instanceof HTMLStyleElement) && !(node instanceof HTMLLinkElement)) return false;
  return (
    node.dataset.wbSourcePreviewFrameCss === 'true' ||
    node.hasAttribute(PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE) ||
    node.dataset[PROJECT_VUE_SFC_CSS_DATASET_KEY] !== undefined ||
    node.dataset.wbSourcePreviewTailwindFallbackCss === 'true' ||
    node.hasAttribute(getSourceTreePreviewTailwindRuntimeStyleAttribute()) ||
    node.dataset.wbSourcePreviewFontCss === 'true'
  );
}

function getSourceTreePreviewFrameStructureSignature(
  baseHref: string,
  nodes: Array<HTMLStyleElement | HTMLLinkElement>,
  tailwindFallbackCss: string,
  fontCss: string,
): string {
  return [
    `base:${baseHref}`,
    `frame:${SOURCE_TREE_PREVIEW_FRAME_CSS_SIGNATURE}`,
    `tailwind-fallback:${getSourceTreePreviewCssSignature(tailwindFallbackCss)}`,
    ...nodes.map((node) => {
      if (node instanceof HTMLStyleElement) {
        return `style:${node.dataset.wbProjectLibraryCss ?? node.dataset[PROJECT_VUE_SFC_CSS_DATASET_KEY] ?? ''}:${node.dataset.wbProjectTailwindCss ?? ''}:${getSourceTreePreviewStyleNodeSignature(node)}`;
      }
      return `link:${node.dataset.wbProjectLibraryCss ?? ''}:${node.dataset.wbProjectTailwindCss ?? ''}:${node.href}`;
    }),
    `font:${getSourceTreePreviewCssSignature(fontCss)}`,
  ].join('\n/* wb-source-preview-style */\n');
}

function getSourceTreePreviewFrameHeadSignature(
  baseHref: string,
  nodes: Array<HTMLStyleElement | HTMLLinkElement>,
  tailwindFallbackCss: string,
  fontCss: string,
  tailwindRuntimeCss: string,
): string {
  return [
    getSourceTreePreviewFrameStructureSignature(baseHref, nodes, tailwindFallbackCss, fontCss),
    `tailwind-runtime:${getSourceTreePreviewCssSignature(tailwindRuntimeCss)}`,
  ].join('\n/* wb-source-preview-style */\n');
}

function createSourceTreePreviewFontStyle(
  targetDocument: Document,
  fontCssText: string,
): HTMLStyleElement | null {
  const css = fontCssText.trim();
  if (!css) return null;
  const style = targetDocument.createElement('style');
  style.dataset.wbSourcePreviewFontCss = 'true';
  style.textContent = css;
  return style;
}

function createSourceTreePreviewTailwindFallbackStyle(
  targetDocument: Document,
  tailwindCssMode: SourceTreePreviewTailwindCssMode,
): HTMLStyleElement | null {
  if (tailwindCssMode !== 'fallback') return null;
  const style = targetDocument.createElement('style');
  style.dataset.wbSourcePreviewTailwindFallbackCss = 'true';
  style.textContent = `@layer wb-source-preview-fallback {\n${getSourceTreePreviewTailwindFallbackCss()}\n}`;
  return style;
}

function getSourceTreePreviewStyleNodeSignature(node: HTMLStyleElement): string {
  const text = node.textContent ?? '';
  const cached = SOURCE_TREE_PREVIEW_STYLE_NODE_SIGNATURES.get(node);
  if (cached?.text === text) return cached.signature;
  const signature = getSourceTreePreviewCssSignature(text);
  SOURCE_TREE_PREVIEW_STYLE_NODE_SIGNATURES.set(node, { signature, text });
  return signature;
}

function getSourceTreePreviewCssSignature(css: string): string {
  let hash = 0;
  for (let index = 0; index < css.length; index += 1) {
    hash = ((hash << 5) - hash + css.charCodeAt(index)) | 0;
  }
  return `${css.length}:${hash}`;
}

function createSourceTreePreviewTailwindRuntimeStyle(
  targetDocument: Document,
  tailwindRuntimeCss: string,
): HTMLStyleElement | null {
  const css = tailwindRuntimeCss.trim();
  if (!css) return null;
  const style = targetDocument.createElement('style');
  style.setAttribute(getSourceTreePreviewTailwindRuntimeStyleAttribute(), 'true');
  style.textContent = css;
  return style;
}

function syncSourceTreePreviewTailwindRuntimeStyleNode(
  targetDocument: Document,
  tailwindRuntimeCss: string,
) {
  const css = tailwindRuntimeCss.trim();
  const selector = `style[${getSourceTreePreviewTailwindRuntimeStyleAttribute()}="true"]`;
  const [existing, ...extra] = Array.from(targetDocument.head.querySelectorAll<HTMLStyleElement>(selector));
  for (const style of extra) style.remove();
  if (!css) {
    existing?.remove();
    return;
  }
  if (existing) {
    if (existing.textContent !== css) existing.textContent = css;
    syncSourceTreePreviewTailwindRuntimeStyleNodeOrder(targetDocument, existing);
    return;
  }
  const style = createSourceTreePreviewTailwindRuntimeStyle(targetDocument, css);
  if (style) syncSourceTreePreviewTailwindRuntimeStyleNodeOrder(targetDocument, style);
}

function syncSourceTreePreviewTailwindRuntimeStyleNodeOrder(
  targetDocument: Document,
  style: HTMLStyleElement,
) {
  const projectStylesheets = Array.from(targetDocument.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
    `style[${PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE}], link[${PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE}]`,
  ));
  const lastProjectStylesheet = projectStylesheets[projectStylesheets.length - 1];
  if (lastProjectStylesheet) {
    if (lastProjectStylesheet.nextSibling !== style) {
      targetDocument.head.insertBefore(style, lastProjectStylesheet.nextSibling);
    }
    return;
  }
  if (style.parentNode === targetDocument.head) {
    if (style.nextSibling) targetDocument.head.append(style);
    return;
  }
  targetDocument.head.append(style);
}

type SourceTreePreviewRenderedClassNameTracker = {
  applyMutationRecords: (mutationRecords: MutationRecord[]) => void;
  getSignature: () => string;
};

function createSourceTreePreviewRenderedClassNameTracker(container: Element): SourceTreePreviewRenderedClassNameTracker {
  const classNameByElement = new WeakMap<Element, string>();
  const tokenCounts = new Map<string, number>();

  const addClassNameTokens = (className: string | null | undefined) => {
    for (const token of getSourceTreePreviewRuntimeTailwindClassTokens(className)) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  };
  const removeClassNameTokens = (className: string | null | undefined) => {
    for (const token of getSourceTreePreviewRuntimeTailwindClassTokens(className)) {
      const nextCount = (tokenCounts.get(token) ?? 0) - 1;
      if (nextCount > 0) {
        tokenCounts.set(token, nextCount);
      } else {
        tokenCounts.delete(token);
      }
    }
  };
  const trackElement = (element: Element) => {
    const className = element.getAttribute('class') ?? '';
    classNameByElement.set(element, className);
    addClassNameTokens(className);
  };
  const updateElement = (element: Element) => {
    const previousClassName = classNameByElement.get(element);
    const nextClassName = element.getAttribute('class') ?? '';
    if (previousClassName === nextClassName) return;
    removeClassNameTokens(previousClassName);
    classNameByElement.set(element, nextClassName);
    addClassNameTokens(nextClassName);
  };
  const untrackElement = (element: Element) => {
    const previousClassName = classNameByElement.get(element);
    removeClassNameTokens(previousClassName);
    classNameByElement.delete(element);
  };
  const trackSubtree = (node: Node) => {
    if (!isSourceTreePreviewElement(node)) return;
    trackElement(node);
    node.querySelectorAll('[class]').forEach(trackElement);
  };
  const untrackSubtree = (node: Node) => {
    if (!isSourceTreePreviewElement(node)) return;
    node.querySelectorAll('[class]').forEach(untrackElement);
    untrackElement(node);
  };

  trackSubtree(container);

  return {
    applyMutationRecords: (mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.type === 'attributes' && record.attributeName === 'class' && isSourceTreePreviewElement(record.target)) {
          updateElement(record.target);
          continue;
        }
        if (record.type !== 'childList') continue;
        record.removedNodes.forEach(untrackSubtree);
        record.addedNodes.forEach(trackSubtree);
      }
    },
    getSignature: () => [...tokenCounts.keys()].sort().join(' '),
  };
}

function getSourceTreePreviewRuntimeTailwindClassTokens(className: string | null | undefined): string[] {
  if (!className) return [];
  return className
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((token) => token.length > 0 && isSourceTreePreviewRuntimeTailwindClassToken(token));
}

function isSourceTreePreviewRuntimeTailwindClassToken(token: string): boolean {
  if (token.startsWith('wb-')) return false;
  if (token === 'lucide' || token.startsWith('lucide-')) return false;
  if (token === 'tabler-icon' || token.startsWith('tabler-icon-')) return false;
  if (token === 'remixicon') return false;
  return true;
}

function cloneProjectPreviewStylesheetNode(node: Element): HTMLStyleElement | HTMLLinkElement | null {
  if (node instanceof HTMLStyleElement && node.hasAttribute(PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE)) {
    const clone = node.cloneNode(true) as HTMLStyleElement;
    clone.removeAttribute('media');
    return clone;
  }
  if (node instanceof HTMLStyleElement && isProjectBundledVueSfcStyleNode(node)) {
    // A Vue SFC's <style> block has no CSS file the project CSS crawler could
    // load: the project runtime bundle compiles the page's .vue modules for
    // the canvas and injects their styles into the host document. Mirror
    // them into the frame so the component looks the way its source says.
    const clone = node.cloneNode(true) as HTMLStyleElement;
    clone.removeAttribute('media');
    clone.dataset[PROJECT_VUE_SFC_CSS_DATASET_KEY] = node.getAttribute(PROJECT_BUNDLED_CSS_DATA_ATTRIBUTE) ?? 'true';
    return clone;
  }
  if (node instanceof HTMLLinkElement && node.rel === 'stylesheet' && node.hasAttribute(PROJECT_LIBRARY_CSS_DATA_ATTRIBUTE)) {
    const clone = node.cloneNode(true) as HTMLLinkElement;
    clone.removeAttribute('media');
    return clone;
  }
  return null;
}

// Only the project's own SFC styles cross into the frame: the runtime bundle
// (and the story loader, which compiles through the same pipeline) tags each
// compiled .vue style block with a `workbench-preview-vue-css-` id, while the
// bundle's plain .css imports already reach the frame through the CSS crawler.
function isProjectBundledVueSfcStyleNode(node: HTMLStyleElement): boolean {
  const styleId = node.getAttribute(PROJECT_BUNDLED_CSS_DATA_ATTRIBUTE);
  return typeof styleId === 'string' && styleId.startsWith(PROJECT_BUNDLED_VUE_SFC_CSS_ID_PREFIX);
}

export function syncSourceTreePreviewFrameTokenVariables(
  targetDocument: Document,
  tokenVariables: CSSProperties | undefined,
) {
  const root = targetDocument.documentElement;
  const previousVariables = SOURCE_TREE_PREVIEW_FRAME_TOKEN_VARIABLES.get(targetDocument) ?? new Set<string>();
  const nextEntries = Object.entries(tokenVariables ?? {}).filter(([name, value]) => (
    name.startsWith('--') &&
    value !== null &&
    value !== undefined &&
    value !== ''
  ));
  const nextVariables = new Set(nextEntries.map(([name]) => name));

  for (const name of previousVariables) {
    if (!nextVariables.has(name)) root.style.removeProperty(name);
  }
  for (const [name, value] of nextEntries) {
    root.style.setProperty(name, String(value));
  }

  SOURCE_TREE_PREVIEW_FRAME_TOKEN_VARIABLES.set(targetDocument, nextVariables);
}

function syncSourceTreePreviewFrameTheme(targetDocument: Document, previewThemeMode: 'system' | 'light' | 'dark') {
  if (previewThemeMode === 'light' || previewThemeMode === 'dark') {
    targetDocument.documentElement.dataset.astryxMedia = previewThemeMode;
    targetDocument.documentElement.dataset.theme = previewThemeMode;
  } else {
    delete targetDocument.documentElement.dataset.astryxMedia;
    delete targetDocument.documentElement.dataset.theme;
  }
  const hostWorkbenchTheme = document.documentElement.dataset.wbTheme ?? document.body.dataset.wbTheme ?? null;
  if (hostWorkbenchTheme) targetDocument.documentElement.dataset.wbTheme = hostWorkbenchTheme;
  else delete targetDocument.documentElement.dataset.wbTheme;
}

function syncSourceTreePreviewFramePreviewTheme(targetDocument: Document, previewThemeMode: 'system' | 'light' | 'dark') {
  targetDocument.documentElement.dataset.previewTheme = previewThemeMode;
}

function SourceTreePreviewLongPressReadyIndicator({ value }: { value: SourceTreePreviewOverlayRect | null }) {
  if (!value) return null;
  return (
    <div className="wb-source-visual-long-press-layer" aria-hidden="true">
      <span
        className="wb-source-visual-long-press-box"
        style={{
          height: value.height,
          transform: `translate(${value.left}px, ${value.top}px)`,
          width: value.width,
        }}
      />
    </div>
  );
}

/** Translucent authored-cell grid with the addressed slot highlighted. This is
    the whole destination affordance for two-dimensional containers — there is
    no sibling reflow and no glide behind it. */
function SourceTreePreviewGridSlotOverlay({ value }: { value: SourceTreePreviewDropTarget | null }) {
  const slots = value?.gridSlots;
  if (!value || !slots) return null;
  const layer = (
    <div className="wb-source-visual-drop-overlay" aria-hidden="true">
      {value.scopeRect ? (
        <span
          className="wb-source-visual-drop-grid-scope"
          style={{
            height: value.scopeRect.height,
            transform: `translate(${value.scopeRect.left}px, ${value.scopeRect.top}px)`,
            width: value.scopeRect.width,
          }}
        />
      ) : null}
      {slots.rects.map((rect, index) => (
        <span
          key={`${index}:${Math.round(rect.left)}:${Math.round(rect.top)}`}
          className={index === slots.activeIndex
            ? 'wb-source-visual-drop-grid-slot wb-source-visual-drop-grid-slot--active'
            : 'wb-source-visual-drop-grid-slot'}
          style={{
            height: rect.height,
            transform: `translate(${rect.left}px, ${rect.top}px)`,
            width: rect.width,
          }}
        />
      ))}
    </div>
  );
  return value.topLayerHost ? createPortal(layer, value.topLayerHost) : layer;
}

function SourceTreePreviewDropIndicator({ value }: { value: SourceTreePreviewDropTarget | null }) {
  if (!value) return null;
  // Slot-addressed containers draw their own destination affordance.
  if (value.gridSlots) return null;
  const isInside = value.position === 'inside';
  const isOutdent = value.intent === 'outdent';
  const isReorder = value.operation === 'reorder';
  // Same-parent reordering is communicated by the interpolated preview and
  // translucent drag ghost everywhere, including inside runtime portals.
  if (isReorder) return null;
  const indicatorRect = value.previewRect ?? value.rect;
  const indicatorPosition = value.previewRect ? 'before' : value.position;
  const previewOffsetX = value.previewOffsetX ??
    (value.axis === 'horizontal' ? value.previewOffset ?? 0 : 0);
  const previewOffsetY = value.previewOffsetY ??
    (value.axis === 'vertical' ? value.previewOffset ?? 0 : 0);
  const indicatorStyle = {
    height: indicatorRect.height,
    transform: `translate(${indicatorRect.left + previewOffsetX}px, ${indicatorRect.top + previewOffsetY}px)`,
    width: indicatorRect.width,
  };
  const edgeIndicatorStyle = value.axis === 'horizontal'
    ? {
        height: indicatorRect.height,
        transform: `translate(${
          indicatorRect.left +
          (indicatorPosition === 'after' ? indicatorRect.width : 0) +
          previewOffsetX -
          1
        }px, ${indicatorRect.top + previewOffsetY}px)`,
        width: 3,
      }
    : {
        height: 3,
        transform: `translate(${indicatorRect.left + previewOffsetX}px, ${
          indicatorRect.top +
          (indicatorPosition === 'after' ? indicatorRect.height : 0) +
          previewOffsetY -
          1
        }px)`,
        width: indicatorRect.width,
      };
  const intentScopeRect = value.scopeRect;
  const intentLabelRect = intentScopeRect ?? indicatorRect;
  const intentLabelLeft = intentScopeRect
    ? intentLabelRect.left + 8
    : value.axis === 'horizontal'
      ? indicatorRect.left + (indicatorPosition === 'after' ? indicatorRect.width : 0) + previewOffsetX + 6
      : indicatorRect.left + previewOffsetX + 8;
  const intentLabelTop = intentScopeRect
    ? intentLabelRect.top + 8
    : value.axis === 'vertical' && !isInside
      ? indicatorRect.top + (indicatorPosition === 'after' ? indicatorRect.height : 0) + previewOffsetY - 24
      : indicatorRect.top + previewOffsetY - 24;

  const layer = (
    <div
      className={isOutdent
        ? 'wb-source-visual-drop-overlay wb-source-visual-drop-overlay--outdent'
        : 'wb-source-visual-drop-overlay wb-source-visual-drop-overlay--inside'}
      aria-hidden="true"
    >
      {value.scopeRect && (isOutdent || (!isInside && !isReorder)) ? (
        <span
          className={[
            'wb-source-visual-drop-scope',
            isOutdent
              ? 'wb-source-visual-drop-scope--outdent'
              : 'wb-source-visual-drop-scope--inside',
          ].join(' ')}
          style={{
            height: value.scopeRect.height,
            transform: `translate(${value.scopeRect.left}px, ${value.scopeRect.top}px)`,
            width: value.scopeRect.width,
          }}
        />
      ) : null}
      {isInside ? (
        <span
          className="wb-source-visual-drop-indicator wb-source-visual-drop-indicator--inside"
          style={indicatorStyle}
        />
      ) : null}
      {!isInside && !isOutdent ? (
        <span
          className="wb-source-visual-drop-indicator"
          style={edgeIndicatorStyle}
        />
      ) : null}
      {!isOutdent && !isReorder ? (
        <span
          className="wb-source-visual-drop-intent wb-source-visual-drop-intent--inside"
          style={{
            transform: `translate(${intentLabelLeft}px, ${Math.max(4, intentLabelTop)}px)`,
          }}
        >
          안에 넣기
          {value.scopeLabel ? ` · ${value.scopeLabel}` : ''}
        </span>
      ) : null}
      {isOutdent && value.scopeLabel ? (
        <span
          className="wb-source-visual-drop-intent wb-source-visual-drop-intent--outdent"
          style={{
            transform: `translate(${intentLabelLeft}px, ${Math.max(4, intentLabelTop)}px)`,
          }}
        >
          밖으로 · {value.scopeLabel}
        </span>
      ) : null}
    </div>
  );
  // Inside an open modal/drawer the browser top layer paints above any
  // z-index — portal the indicator into the host like the selection overlay.
  return value.topLayerHost ? createPortal(layer, value.topLayerHost) : layer;
}

function SourceTreePreviewBlockedDropIndicator({
  value,
}: {
  value: SourceTreePreviewBlockedDropHint | null;
}) {
  if (!value) return null;
  const layer = (
    <div className="wb-source-visual-drop-overlay wb-source-visual-drop-overlay--blocked" aria-hidden="true">
      <span
        className="wb-source-visual-drop-scope wb-source-visual-drop-scope--blocked"
        style={{
          height: value.rect.height,
          transform: `translate(${value.rect.left}px, ${value.rect.top}px)`,
          width: value.rect.width,
        }}
      />
      <span
        className="wb-source-visual-drop-intent wb-source-visual-drop-intent--blocked"
        style={{
          transform: `translate(${value.rect.left + 8}px, ${Math.max(4, value.rect.top + 8)}px)`,
        }}
      >
        {value.reason === 'unmeasured' ? '위치 확인 불가' : '하위 배치 불가'} · {value.label}
      </span>
    </div>
  );
  return value.topLayerHost ? createPortal(layer, value.topLayerHost) : layer;
}

function SourceTreePreviewDragGhost({ value }: { value: SourceTreePreviewDragGhost | null }) {
  if (!value) return null;
  const layer = (
    <div className="wb-source-visual-drag-ghost-layer" aria-hidden="true">
      <div
        className={value.preview
          ? [
              'wb-source-visual-drag-ghost',
              'wb-source-visual-drag-ghost--preview',
              value.preview.snapshot ? 'wb-source-visual-drag-ghost--snapshot' : '',
            ].filter(Boolean).join(' ')
          : 'wb-source-visual-drag-ghost wb-source-visual-drag-ghost--fallback'}
        style={{
          height: value.height,
          transform: `translate(${value.left}px, ${value.top}px)`,
          width: value.width,
          ...(value.preview
            ? {
                '--wb-source-visual-drag-ghost-origin-x': `${value.preview.maskOriginX}px`,
                '--wb-source-visual-drag-ghost-origin-y': `${value.preview.maskOriginY}px`,
              }
            : null),
        } as SourceTreePreviewDragGhostStyle}
      >
        {value.preview
          ? <SourceTreePreviewDragGhostContent preview={value.preview} topLayerHost={value.topLayerHost ?? null} />
          : value.label}
      </div>
    </div>
  );
  return value.topLayerHost ? createPortal(layer, value.topLayerHost) : layer;
}

function SourceTreePreviewDragGhostContent({
  preview,
  topLayerHost,
}: {
  preview: SourceTreePreviewDragGhostPreview;
  topLayerHost: HTMLElement | null;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    for (const item of preview.items) content.appendChild(item.clone);
    return () => {
      for (const item of preview.items) {
        if (item.clone.parentElement === content) item.clone.remove();
      }
    };
  }, [preview, topLayerHost]);
  return <div ref={contentRef} className="wb-source-visual-drag-ghost-content" />;
}

function startSourceTreePreviewResizeDrag({
  container,
  edge,
  event,
  layerId,
  onCommit,
  onDone,
}: {
  container: HTMLElement;
  edge: SourceTreePreviewResizeEdge;
  event: ReactPointerEvent<HTMLElement>;
  layerId: string;
  onCommit: (patches: SourceTreePreviewStyleDeclarationPatch[]) => void;
  onDone: () => void;
}): () => void {
  const target = getPreviewNodePrimaryElement(container, layerId);
  if (!target) return () => undefined;
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  const startRect = target.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const baseAspectRatio = getSourceTreePreviewAspectRatio(target);
  const startInlineSize = getSourceTreePreviewInlineSize(target);
  let ended = false;
  const getActiveAspectRatio = (shiftKey: boolean) => (
    shiftKey ? (baseAspectRatio ?? startRect.width / startRect.height) : null
  );

  const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
    blockSourceTreePreviewPointerEvent(moveEvent);
    const aspectRatio = getActiveAspectRatio(moveEvent.shiftKey);
    const nextSize = resolveSourceTreePreviewResizeSize({
      aspectRatio,
      edge,
      startHeight: startRect.height,
      startWidth: startRect.width,
      startX,
      startY,
      target,
      x: moveEvent.clientX,
      y: moveEvent.clientY,
    });
    applySourceTreePreviewSize(target, edge, nextSize.width, nextSize.height, hasSourceTreePreviewAspectRatio(aspectRatio));
  };
  const up = (upEvent: SourceTreePreviewPointerGestureEvent) => {
    if (ended) return;
    ended = true;
    blockSourceTreePreviewPointerEvent(upEvent);
    cleanup();
    const aspectRatio = getActiveAspectRatio(upEvent.shiftKey);
    const nextSize = resolveSourceTreePreviewResizeSize({
      aspectRatio,
      edge,
      startHeight: startRect.height,
      startWidth: startRect.width,
      startX,
      startY,
      target,
      x: upEvent.clientX,
      y: upEvent.clientY,
    });
    const resizeBothAxes = hasSourceTreePreviewAspectRatio(aspectRatio);
    const patches: SourceTreePreviewStyleDeclarationPatch[] = [];
    if (resizeBothAxes || (edge !== 'n' && edge !== 's')) patches.push({ property: 'width', value: `${Math.round(nextSize.width)}px` });
    if (resizeBothAxes || (edge !== 'e' && edge !== 'w')) patches.push({ property: 'height', value: `${Math.round(nextSize.height)}px` });
    restoreSourceTreePreviewInlineSize(target, startInlineSize);
    if (patches.length > 0) onCommit(patches);
    onDone();
  };
  const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
    if (ended) return;
    ended = true;
    blockSourceTreePreviewPointerEvent(cancelEvent);
    cleanup();
    restoreSourceTreePreviewInlineSize(target, startInlineSize);
    onDone();
  };

  const cleanup = addSourceTreePreviewPointerGestureListeners({
    onCancel: cancel,
    onMove: move,
    onUp: up,
    ownerWindow,
  });
  return () => {
    if (ended) return;
    ended = true;
    cleanup();
    restoreSourceTreePreviewInlineSize(target, startInlineSize);
  };
}

function startSourceTreePreviewPositionDrag({
  blockPointerEvents = false,
  event,
  layerId,
  listenerOptions,
  onActive,
  onCommit,
  onDone,
  target,
}: {
  blockPointerEvents?: boolean;
  event: SourceTreePreviewPointerStart;
  layerId: string;
  listenerOptions?: AddEventListenerOptions;
  onActive?: () => void;
  onCommit: (patches: SourceTreePreviewStyleDeclarationPatch[]) => void;
  onDone: () => void;
  target: HTMLElement;
}): () => void {
  void layerId;
  const ownerWindow = getSourceTreePreviewOwnerWindow(target);
  const startX = event.clientX;
  const startY = event.clientY;
  const computedStyle = getSourceTreePreviewComputedStyle(target);
  const startTop = parseSourceTreePreviewPixelValue(computedStyle.top, target.offsetTop);
  const startLeft = parseSourceTreePreviewPixelValue(computedStyle.left, target.offsetLeft);
  const startInlineTop = target.style.top;
  const startInlineLeft = target.style.left;
  let active = false;
  let ended = false;
  let lockedAxis: 'x' | 'y' | null = null;

  const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
    if (blockPointerEvents) blockSourceTreePreviewPointerEvent(moveEvent);
    let dx = moveEvent.clientX - startX;
    let dy = moveEvent.clientY - startY;
    if (!active && Math.abs(dx) + Math.abs(dy) < SOURCE_TREE_PREVIEW_POSITION_DRAG_THRESHOLD_PX) return;
    if (!active) {
      active = true;
      onActive?.();
    }
    if (moveEvent.shiftKey) {
      lockedAxis ??= Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (lockedAxis === 'x') dy = 0;
      if (lockedAxis === 'y') dx = 0;
    } else {
      lockedAxis = null;
    }
    target.style.top = `${Math.round(startTop + dy)}px`;
    target.style.left = `${Math.round(startLeft + dx)}px`;
  };
  const up = (upEvent: SourceTreePreviewPointerGestureEvent) => {
    if (ended) return;
    ended = true;
    if (blockPointerEvents) blockSourceTreePreviewPointerEvent(upEvent);
    cleanup();
    if (!active) {
      onDone();
      return;
    }
    let dx = upEvent.clientX - startX;
    let dy = upEvent.clientY - startY;
    if (lockedAxis === 'x') dy = 0;
    if (lockedAxis === 'y') dx = 0;
    onCommit([
      { property: 'top', value: `${Math.round(startTop + dy)}px` },
      { property: 'left', value: `${Math.round(startLeft + dx)}px` },
    ]);
    onDone();
  };
  const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
    if (ended) return;
    ended = true;
    if (blockPointerEvents) blockSourceTreePreviewPointerEvent(cancelEvent);
    cleanup();
    target.style.top = startInlineTop;
    target.style.left = startInlineLeft;
    onDone();
  };

  const cleanup = addSourceTreePreviewPointerGestureListeners({
    listenerOptions,
    mouseFallback: true,
    onCancel: cancel,
    onMove: move,
    onUp: up,
    ownerWindow,
  });
  return () => {
    if (ended) return;
    ended = true;
    cleanup();
    target.style.top = startInlineTop;
    target.style.left = startInlineLeft;
  };
}

function startSourceTreePreviewNodeDrag({
  blockPointerEvents = false,
  container,
  deferPointerCaptureUntilActive = false,
  event,
  layerId,
  listenerOptions,
  onActive,
  onBlockedDropHintChange,
  onCommit,
  onDone,
  onDropTargetChange,
  onGhostChange,
  onPreviewRootChange,
  onSuppressClick,
  root,
  selectedNodes = [],
  selectedNode,
}: {
  blockPointerEvents?: boolean;
  container: HTMLElement;
  deferPointerCaptureUntilActive?: boolean;
  event: SourceTreePreviewPointerStart;
  layerId: string;
  listenerOptions?: AddEventListenerOptions;
  onActive?: () => void;
  onBlockedDropHintChange: (hint: SourceTreePreviewBlockedDropHint | null) => void;
  onCommit: (target: SourceTreePreviewDropTarget) => Promise<void> | void;
  onDone: () => void;
  onDropTargetChange: (target: SourceTreePreviewDropTarget | null) => void;
  onGhostChange: (ghost: SourceTreePreviewDragGhost | null) => void;
  onPreviewRootChange: (
    root: EditableTreeNode | null,
    transitionOrigins?: SourceTreePreviewLayoutSnapshot,
    hiddenNodeIds?: readonly string[],
    reflowScopeNodeIds?: ReadonlySet<string> | null,
  ) => void;
  onSuppressClick?: () => void;
  root: EditableTreeNode;
  selectedNodes?: EditableTreeNode[];
  selectedNode: EditableTreeNode;
}): () => void {
  flushSourceTreePreviewCommittedReflowCleanup(container);
  beginSourceTreePreviewDropDecisionRectCache();
  const startX = event.clientX;
  const startY = event.clientY;
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  const selectedElements = getSourceTreePreviewNodeDragElements(container, selectedNode);
  const dragNodes = selectedNodes.length > 1 ? selectedNodes : [selectedNode];
  const eventTarget = getSourceTreePreviewEventTargetElement({ target: event.target ?? null });
  const eventTargetLayerElement = eventTarget?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
  const eventTargetLayerId = eventTargetLayerElement ? getSourceTreePreviewElementNodeId(eventTargetLayerElement) : null;
  const selectedSubtreeNodeIds = getSourceTreePreviewNodeSubtreeIds(selectedNode);
  const selectedElement = eventTargetLayerId && selectedSubtreeNodeIds.has(eventTargetLayerId)
    ? eventTargetLayerElement
    : selectedElements[0] ?? null;
  const draggedRuntimeSurfaceHost = selectedElement
    ? getSourceTreePreviewDragRuntimeSurfaceHost(selectedElement, container)
    : null;
  const runtimeSurfaceRestoreTargets =
    captureSourceTreePreviewOpenRuntimeSurfaceRestoreTargets(
      container,
      selectedElement,
      draggedRuntimeSurfaceHost,
    );
  const lockedRuntimeSurfaceParentId = draggedRuntimeSurfaceHost
    ? findEditableTreeParent(root, selectedNode.id)?.id ?? null
    : null;
  const resolveCurrentDragOriginElements = () => {
    const liveEventTargetLayerElement = eventTargetLayerElement?.isConnected
      ? eventTargetLayerElement
      : eventTargetLayerId
        ? getPreviewNodeElements(container, eventTargetLayerId)
            .sort((left, right) => (
              getSourceTreePreviewRectDistanceFromPoint(left.getBoundingClientRect(), startX, startY) -
              getSourceTreePreviewRectDistanceFromPoint(right.getBoundingClientRect(), startX, startY)
            ))[0] ?? null
        : null;
    return resolveSourceTreePreviewDragOriginElements({
      container,
      dragNodes,
      eventTargetLayerElement: liveEventTargetLayerElement,
      eventTargetLayerId,
      selectedNode,
    });
  };
  const originElements = resolveCurrentDragOriginElements();
  const ignoredNodeIds = new Set(
    dragNodes.flatMap((node) => Array.from(getSourceTreePreviewNodeSubtreeIds(node))),
  );
  const ghostLabel = dragNodes.length > 1
    ? `${selectedNode.label} +${dragNodes.length - 1}`
    : selectedNode.label;
  let active = false;
  let ended = false;
  let hasPointerCapture = false;
  let activeDropPreviewKey: string | null = null;
  let activeProjectedDropTarget: SourceTreePreviewDropTarget | null = null;
  let activeDropDecisionPoint: { x: number; y: number } | null = null;
  let pendingDropPreviewKey: string | null = null;
  let pendingDropDecisionPoint: { x: number; y: number } | null = null;
  let pendingDropConfirmationTimerId: number | null = null;
  let lastPointerPoint: { x: number; y: number } | null = null;
  let clearDropReflowPreview: (() => void) | null = null;
  let clearDragOriginPreview: (() => void) | null = null;
  let clearDragChromePreview: (() => void) | null = null;
  let dragGhostPreview: SourceTreePreviewDragGhostPreview | null = null;
  let dragOriginRefreshFrameId: number | null = null;
  let cleanupGeometryListeners = () => {};

  const capturePointer = () => {
    if (
      hasPointerCapture ||
      !selectedElement ||
      event.pointerId === undefined ||
      typeof selectedElement.setPointerCapture !== 'function'
    ) {
      return;
    }
    try {
      selectedElement.setPointerCapture(event.pointerId);
      hasPointerCapture = true;
    } catch {
      hasPointerCapture = false;
    }
  };

  if (!deferPointerCaptureUntilActive) {
    capturePointer();
  }

  const releasePointerCapture = () => {
    if (!hasPointerCapture || !selectedElement || event.pointerId === undefined) return;
    try {
      selectedElement.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser after pointerup/cancel.
    }
    hasPointerCapture = false;
  };

  const clearPendingDropCandidate = () => {
    if (pendingDropConfirmationTimerId !== null) {
      ownerWindow.clearTimeout(pendingDropConfirmationTimerId);
    }
    pendingDropConfirmationTimerId = null;
    pendingDropPreviewKey = null;
    pendingDropDecisionPoint = null;
  };

  const cancelDragOriginRefresh = () => {
    if (dragOriginRefreshFrameId === null) return;
    ownerWindow.cancelAnimationFrame(dragOriginRefreshFrameId);
    dragOriginRefreshFrameId = null;
  };

  const refreshDragOriginPreview = () => {
    cancelDragOriginRefresh();
    clearDragOriginPreview?.();
    clearDragOriginPreview = active
      ? applySourceTreePreviewDragOriginPreview(resolveCurrentDragOriginElements())
      : null;
    if (!active) return;
    // Clearing a projected root schedules a React portal commit. The authored
    // node that returns after that commit is a new DOM element, so refresh the
    // origin once more on the next frame instead of retaining a disconnected
    // element captured at drag start.
    dragOriginRefreshFrameId = ownerWindow.requestAnimationFrame(() => {
      dragOriginRefreshFrameId = null;
      if (!active || ended) return;
      clearDragOriginPreview?.();
      clearDragOriginPreview = applySourceTreePreviewDragOriginPreview(
        resolveCurrentDragOriginElements(),
      );
    });
  };

  const clearActiveDropProjection = () => {
    clearDropReflowPreview?.();
    clearDropReflowPreview = null;
    refreshDragOriginPreview();
    activeDropPreviewKey = null;
    activeProjectedDropTarget = null;
    activeDropDecisionPoint = null;
    onDropTargetChange(null);
  };

  const invalidateDropProjection = () => {
    if (!active) return;
    invalidateSourceTreePreviewDropDecisionRectCache();
    clearPendingDropCandidate();
    clearActiveDropProjection();
    onBlockedDropHintChange(null);
  };

  const updateDragGhost = (
    point: { x: number; y: number },
    dropTarget: SourceTreePreviewDropTarget | null,
  ) => {
    // Keep ordinary authored ghosts on the stable canvas overlay. Runtime
    // portals and fixed fallback overlays paint above that canvas, so their
    // ghost must share the visible overlay host or it disappears behind the
    // menu/drawer while the source reorder is still active.
    const candidateGhostHost = dropTarget?.topLayerHost ?? draggedRuntimeSurfaceHost;
    const ghostHost = resolveSourceTreePreviewDragGhostHost(candidateGhostHost, container);
    // The ghost layer is absolutely positioned inside its host, so it resolves
    // against the host's containing block — which is the host only when the
    // host is positioned. Runtime surfaces are routinely `position: static`,
    // and measuring the host itself then parks the ghost a constant offset
    // away from the pointer for the whole drag.
    const ghostBase = getSourceTreePreviewAbsolutePositioningBase(ghostHost ?? container, container);
    const ghostBaseRect = ghostBase.getBoundingClientRect();
    const preview = dragGhostPreview;
    onGhostChange({
      height: preview?.height ?? 24,
      label: ghostLabel,
      left: point.x - ghostBaseRect.left - ghostBase.clientLeft + ghostBase.scrollLeft -
        (preview?.pointerOffsetX ?? -12),
      preview,
      top: point.y - ghostBaseRect.top - ghostBase.clientTop + ghostBase.scrollTop -
        (preview?.pointerOffsetY ?? -12),
      width: preview?.width ?? Math.min(Math.max(72, ghostLabel.length * 7 + 24), 160),
      topLayerHost: ghostHost,
    });
  };

  const applyConfirmedDropProjection = (
    dropTarget: SourceTreePreviewDropTarget,
    point: { x: number; y: number },
  ) => {
    onBlockedDropHintChange(null);
    const dropPreviewKey = getSourceTreePreviewDropPreviewKey(dropTarget);
    activeDropPreviewKey = dropPreviewKey;
    const portalParent = lockedRuntimeSurfaceParentId
      ? findSourceTreePreviewLayerNode(root, lockedRuntimeSurfaceParentId)
      : null;
    const previousPortalVisualRects = portalParent
      ? getSourceTreePreviewChildVisualSnapshot(container, portalParent)
      : null;
    if (lockedRuntimeSurfaceParentId) {
      clearDropReflowPreview?.();
      clearDropReflowPreview = null;
    }
    // Slot-addressed containers communicate the destination with the drawn
    // slot grid, so they do not reflow or interpolate siblings at all: a
    // two-dimensional reflow moves every following cell across row breaks,
    // which reads as noise rather than as "the node lands here".
    const previewRoot = dropTarget.gridSlots
      ? null
      : simulatePreviewTreeMove({
          nodeIds: dragNodes.map((node) => node.id),
          root,
          targetIndex: dropTarget.index,
          targetParentId: dropTarget.parentId,
        });
    if (previewRoot) {
      // Reflow siblings toward the simulated destination while the pointer is
      // down, but keep the moved nodes invisible there. The user sees an empty
      // structural slot plus the translucent visual ghost, never two copies.
      // A runtime portal cannot replace its React preview tree mid-gesture
      // without unmounting the owning surface, so keep that tree mounted and
      // project the same destination through position-only sibling transforms.
      if (lockedRuntimeSurfaceParentId && previousPortalVisualRects) {
        clearDropReflowPreview = applySourceTreePreviewPortalReorderProjection({
          container,
          nextRoot: previewRoot,
          parentId: lockedRuntimeSurfaceParentId,
          previousVisualRects: previousPortalVisualRects,
          root,
        });
      } else {
        // The projected placeholder may reuse the drag origin's path-keyed
        // DOM element. Restore the origin before the placeholder snapshots
        // its baseline; otherwise it records opacity:0 as the authored value
        // and later applies that hidden value to the sibling that inherits
        // this slot after source IDs are rebuilt.
        clearDragOriginPreview?.();
        clearDragOriginPreview = null;
        onPreviewRootChange(
          previewRoot,
          undefined,
          dragNodes.map((node) => node.id),
          collectSourceTreePreviewReorderScopeNodeIds(
            root,
            previewRoot,
            dragNodes.map((node) => node.id),
            dropTarget.parentId,
          ),
        );
        clearDropReflowPreview = () => onPreviewRootChange(null);
      }
      refreshDragOriginPreview();
    }
    const projectedTarget = dropTarget.topLayerHost &&
      (
        !dropTarget.topLayerHost.isConnected ||
        dropTarget.topLayerHost.ownerDocument !== container.ownerDocument
      )
      ? { ...dropTarget, topLayerHost: null }
      : dropTarget;
    activeProjectedDropTarget = projectedTarget;
    activeDropDecisionPoint = point;
    updateDragGhost(point, projectedTarget);
    onDropTargetChange(projectedTarget);
  };

  const confirmPendingDropCandidate = () => {
    pendingDropConfirmationTimerId = null;
    const pendingKey = pendingDropPreviewKey;
    const point = pendingDropDecisionPoint;
    if (!active || !pendingKey || !point) {
      clearPendingDropCandidate();
      return;
    }
    // Re-resolve against the currently painted layout. Once a slot has opened,
    // its interpolated sibling positions become the next visual decision
    // surface instead of repeatedly snapping hit-testing back to the origin.
    const confirmedTarget = resolveSourceTreePreviewCanvasDropTarget({
      clientX: point.x,
      clientY: point.y,
      container,
      draggedNode: selectedNode,
      ignoredNodeIds,
      lockedParentId: lockedRuntimeSurfaceParentId,
      root,
    });
    if (getSourceTreePreviewDropPreviewKey(confirmedTarget) !== pendingKey || !confirmedTarget) {
      clearPendingDropCandidate();
      return;
    }
    clearPendingDropCandidate();
    applyConfirmedDropProjection(confirmedTarget, point);
  };

  const waitForStableDropCandidate = (
    dropTarget: SourceTreePreviewDropTarget | null,
    point: { x: number; y: number },
  ) => {
    const dropPreviewKey = getSourceTreePreviewDropPreviewKey(dropTarget);
    if (!dropPreviewKey) {
      clearPendingDropCandidate();
      return;
    }
    if (dropTarget?.operation === 'reorder') {
      // Sibling movement inside the current parent is the highest-confidence
      // structural intent. Open that slot immediately, including at the
      // parent's first/last edge; only cross-parent moves need dwell.
      clearPendingDropCandidate();
      applyConfirmedDropProjection(dropTarget, point);
      return;
    }
    if (dropPreviewKey === pendingDropPreviewKey) {
      pendingDropDecisionPoint = point;
      return;
    }
    clearPendingDropCandidate();
    pendingDropPreviewKey = dropPreviewKey;
    pendingDropDecisionPoint = point;
    pendingDropConfirmationTimerId = ownerWindow.setTimeout(
      confirmPendingDropCandidate,
      SOURCE_TREE_PREVIEW_DROP_CANDIDATE_CONFIRMATION_MS,
    );
  };

  const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
    lastPointerPoint = { x: moveEvent.clientX, y: moveEvent.clientY };
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    if (!active && Math.abs(dx) + Math.abs(dy) < SOURCE_TREE_PREVIEW_DRAG_THRESHOLD_PX) return;
    if (!active) {
      active = true;
      capturePointer();
      dragGhostPreview = createSourceTreePreviewDragGhostPreview(
        originElements,
        { x: startX, y: startY },
      );
      container.classList.add('wb-source-visual-node-drag-active');
      clearDragOriginPreview = applySourceTreePreviewDragOriginPreview(originElements);
      clearDragChromePreview = applySourceTreePreviewDragChromePreview(container);
      onActive?.();
    }
    const point = { x: moveEvent.clientX, y: moveEvent.clientY };
    if (shouldHoldSourceCanvasDragOrigin({
      activationDistance: SOURCE_TREE_PREVIEW_DROP_ACTIVATION_DISTANCE_PX,
      dragDistance: Math.hypot(dx, dy),
    })) {
      clearPendingDropCandidate();
      if (activeProjectedDropTarget || clearDropReflowPreview) clearActiveDropProjection();
      updateDragGhost(point, null);
      onDropTargetChange(null);
      onBlockedDropHintChange(null);
      return;
    }
    const previousProjectedDropTarget = activeProjectedDropTarget;
    const canReuseProjectedDecision = Boolean(
      activeProjectedDropTarget &&
      activeDropDecisionPoint &&
      Math.hypot(
        moveEvent.clientX - activeDropDecisionPoint.x,
        moveEvent.clientY - activeDropDecisionPoint.y,
      ) <= SOURCE_TREE_PREVIEW_DROP_DECISION_HYSTERESIS_PX,
    );
    let dropTarget = canReuseProjectedDecision
      ? activeProjectedDropTarget
      : resolveSourceTreePreviewCanvasDropTarget({
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
          container,
          draggedNode: selectedNode,
          ignoredNodeIds,
          lockedParentId: lockedRuntimeSurfaceParentId,
          root,
        });
    const shouldRetainConfirmedParentEdge = Boolean(
      !canReuseProjectedDecision &&
      previousProjectedDropTarget &&
      !dropTarget &&
      isSourceTreePreviewPointerNearDropTargetScopeEdge({
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
        container,
        target: previousProjectedDropTarget,
      }),
    );
    let hasActionableCandidate = Boolean(dropTarget);
    if (!canReuseProjectedDecision) {
      const dropPreviewKey = getSourceTreePreviewDropPreviewKey(dropTarget);
      if (dropTarget && !previousProjectedDropTarget) {
        waitForStableDropCandidate(dropTarget, point);
        dropTarget = activeProjectedDropTarget;
      } else if (
        dropTarget &&
        previousProjectedDropTarget &&
        dropPreviewKey === activeDropPreviewKey
      ) {
        clearPendingDropCandidate();
        activeDropDecisionPoint = point;
        dropTarget = previousProjectedDropTarget;
      } else if (
        dropTarget &&
        previousProjectedDropTarget &&
        dropTarget.parentId === previousProjectedDropTarget.parentId
      ) {
        clearPendingDropCandidate();
        applyConfirmedDropProjection(dropTarget, point);
        dropTarget = activeProjectedDropTarget;
      } else if (dropTarget && previousProjectedDropTarget) {
        // Keep the current slot visible while a different structural parent
        // earns confirmation. The timer resolves against this painted layout.
        waitForStableDropCandidate(dropTarget, point);
        dropTarget = activeProjectedDropTarget;
      } else if (shouldRetainConfirmedParentEdge && previousProjectedDropTarget) {
        clearPendingDropCandidate();
        activeDropDecisionPoint = point;
        dropTarget = previousProjectedDropTarget;
      } else {
        clearPendingDropCandidate();
        if (previousProjectedDropTarget || clearDropReflowPreview) {
          clearActiveDropProjection();
        }
        dropTarget = null;
      }
    }
    hasActionableCandidate = hasActionableCandidate || Boolean(dropTarget);
    onBlockedDropHintChange(hasActionableCandidate || lockedRuntimeSurfaceParentId
      ? null
      : resolveSourceTreePreviewBlockedDropHint({
          clientX: moveEvent.clientX,
          clientY: moveEvent.clientY,
          container,
          draggedNode: selectedNode,
          ignoredNodeIds,
          root,
        }));
    updateDragGhost(point, dropTarget);
    onDropTargetChange(dropTarget);
  };
  const up = (upEvent: SourceTreePreviewPointerGestureEvent) => {
    if (ended) return;
    if (blockPointerEvents && active) blockSourceTreePreviewPointerEvent(upEvent);
    if (
      active &&
      lastPointerPoint &&
      Math.hypot(
        upEvent.clientX - lastPointerPoint.x,
        upEvent.clientY - lastPointerPoint.y,
      ) > 0.5
    ) {
      // Pointer capture can deliver a final coordinate that never produced a
      // move event. Reproject once before freezing the animated slot.
      move(upEvent);
    }
    ended = true;
    let projectedTarget = activeProjectedDropTarget;
    if (
      active &&
      !projectedTarget &&
      Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY) >
        SOURCE_TREE_PREVIEW_DROP_ACTIVATION_DISTANCE_PX
    ) {
      // Stable hover is required before opening an animated slot, but a fast
      // physical release over a valid structural target must still commit.
      // Resolve once from the unshifted source geometry instead of making the
      // result depend on pointer event cadence.
      projectedTarget = resolveSourceTreePreviewCanvasDropTarget({
        clientX: upEvent.clientX,
        clientY: upEvent.clientY,
        container,
        draggedNode: selectedNode,
        ignoredNodeIds,
        lockedParentId: lockedRuntimeSurfaceParentId,
        root,
      });
    }
    clearPendingDropCandidate();
    let committedReflowCleanup = clearDropReflowPreview;
    let committedOriginCleanup = clearDragOriginPreview;
    clearDropReflowPreview = null;
    clearDragOriginPreview = null;
    activeDropPreviewKey = null;
    activeProjectedDropTarget = null;
    activeDropDecisionPoint = null;
    clearDragChromePreview?.();
    clearDragChromePreview = null;
    cancelDragOriginRefresh();
    container.classList.remove('wb-source-visual-node-drag-active');
    cleanup();
    cleanupGeometryListeners();
    releasePointerCapture();
    onGhostChange(null);
    if (active) onSuppressClick?.();
    onDropTargetChange(null);
    onBlockedDropHintChange(null);
    if (active && projectedTarget) {
      // Restore the drag origin before the final release projection replaces
      // or reuses its DOM. Cleaning up afterward can target a disconnected
      // element while React carries opacity:0 onto the current authored node,
      // leaving a successful drop visibly empty. This runs after pointer
      // release and immediately before the synchronous projection, so the
      // user never sees the origin flash back in its old slot.
      committedOriginCleanup?.();
      committedOriginCleanup = null;
      if (!lockedRuntimeSurfaceParentId && !projectedTarget.gridSlots) {
        const previewRoot = simulatePreviewTreeMove({
          nodeIds: dragNodes.map((node) => node.id),
          root,
          targetIndex: projectedTarget.index,
          targetParentId: projectedTarget.parentId,
        });
        if (previewRoot) {
          onPreviewRootChange(
            previewRoot,
            getSourceTreePreviewDragGhostTransitionOrigins(
              dragGhostPreview,
              { x: upEvent.clientX, y: upEvent.clientY },
            ),
            undefined,
            collectSourceTreePreviewReorderScopeNodeIds(
              root,
              previewRoot,
              dragNodes.map((node) => node.id),
              projectedTarget.parentId,
            ),
          );
          committedReflowCleanup = () => onPreviewRootChange(null);
        }
      }
      if (committedReflowCleanup) {
        deferSourceTreePreviewCommittedReflowCleanup({
          cleanup: () => {
            committedReflowCleanup?.();
          },
          commit: () => onCommit(projectedTarget),
          container,
          onSettled: () => {
            restoreSourceTreePreviewRuntimeSurfaces(
              container,
              runtimeSurfaceRestoreTargets,
            );
          },
        });
      } else {
        void Promise.resolve(onCommit(projectedTarget)).finally(() => {
          restoreSourceTreePreviewRuntimeSurfaces(
            container,
            runtimeSurfaceRestoreTargets,
          );
        });
      }
    } else {
      committedReflowCleanup?.();
      committedOriginCleanup?.();
    }
    onDone();
  };
  const abortDrag = () => {
    if (ended) return;
    ended = true;
    clearPendingDropCandidate();
    clearDropReflowPreview?.();
    clearDropReflowPreview = null;
    activeDropPreviewKey = null;
    activeProjectedDropTarget = null;
    activeDropDecisionPoint = null;
    clearDragOriginPreview?.();
    clearDragOriginPreview = null;
    clearDragChromePreview?.();
    clearDragChromePreview = null;
    cancelDragOriginRefresh();
    container.classList.remove('wb-source-visual-node-drag-active');
    cleanup();
    cleanupGeometryListeners();
    releasePointerCapture();
    onGhostChange(null);
    onDropTargetChange(null);
    onBlockedDropHintChange(null);
    if (active) onSuppressClick?.();
    onDone();
  };
  const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
    if (blockPointerEvents) blockSourceTreePreviewPointerEvent(cancelEvent);
    abortDrag();
  };
  const trackedMove = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
    move(moveEvent);
    if (blockPointerEvents && active) blockSourceTreePreviewPointerEvent(moveEvent);
  };
  const cleanup = addSourceTreePreviewPointerGestureListeners({
    listenerOptions,
    mouseFallback: true,
    onCancel: cancel,
    onMove: trackedMove,
    onUp: up,
    ownerWindow,
  });
  const ownerDocument = container.ownerDocument;
  const visualViewport = ownerWindow.visualViewport;
  const handleVisibilityChange = () => {
    if (ownerDocument.visibilityState === 'hidden') abortDrag();
  };
  ownerDocument.addEventListener('scroll', invalidateDropProjection, true);
  ownerDocument.addEventListener('visibilitychange', handleVisibilityChange);
  ownerWindow.addEventListener('blur', abortDrag);
  ownerWindow.addEventListener('pagehide', abortDrag);
  ownerWindow.addEventListener('resize', invalidateDropProjection);
  visualViewport?.addEventListener('resize', invalidateDropProjection);
  visualViewport?.addEventListener('scroll', invalidateDropProjection);
  cleanupGeometryListeners = () => {
    ownerDocument.removeEventListener('scroll', invalidateDropProjection, true);
    ownerDocument.removeEventListener('visibilitychange', handleVisibilityChange);
    ownerWindow.removeEventListener('blur', abortDrag);
    ownerWindow.removeEventListener('pagehide', abortDrag);
    ownerWindow.removeEventListener('resize', invalidateDropProjection);
    visualViewport?.removeEventListener('resize', invalidateDropProjection);
    visualViewport?.removeEventListener('scroll', invalidateDropProjection);
  };
  return () => {
    if (ended) return;
    ended = true;
    endSourceTreePreviewDropDecisionRectCache();
    clearPendingDropCandidate();
    clearDropReflowPreview?.();
    clearDropReflowPreview = null;
    activeProjectedDropTarget = null;
    activeDropDecisionPoint = null;
    clearDragOriginPreview?.();
    clearDragOriginPreview = null;
    clearDragChromePreview?.();
    clearDragChromePreview = null;
    cancelDragOriginRefresh();
    container.classList.remove('wb-source-visual-node-drag-active');
    cleanup();
    cleanupGeometryListeners();
    releasePointerCapture();
  };
}

const SOURCE_TREE_PREVIEW_COMMITTED_REFLOW_CLEANUPS = new WeakMap<HTMLElement, () => void>();

function flushSourceTreePreviewCommittedReflowCleanup(container: HTMLElement) {
  SOURCE_TREE_PREVIEW_COMMITTED_REFLOW_CLEANUPS.get(container)?.();
}

function deferSourceTreePreviewCommittedReflowCleanup({
  cleanup,
  commit,
  container,
  onSettled,
}: {
  cleanup: () => void;
  commit: () => Promise<void> | void;
  container: HTMLElement;
  onSettled?: () => void;
}) {
  flushSourceTreePreviewCommittedReflowCleanup(container);
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  let commitTimerId: number | null = null;
  let animationFrameId: number | null = null;
  let commitStarted = false;
  let cleaned = false;

  function runCleanup() {
    if (cleaned) return;
    cleaned = true;
    if (commitTimerId !== null) ownerWindow.clearTimeout(commitTimerId);
    if (animationFrameId !== null) ownerWindow.cancelAnimationFrame(animationFrameId);
    cleanup();
    SOURCE_TREE_PREVIEW_COMMITTED_REFLOW_CLEANUPS.delete(container);
    onSettled?.();
  }

  function commitAfterPreview() {
    if (commitStarted) return;
    commitStarted = true;
    if (commitTimerId !== null) ownerWindow.clearTimeout(commitTimerId);
    commitTimerId = null;
    let commitResult: Promise<void> | void;
    try {
      commitResult = commit();
    } catch {
      runCleanup();
      throw new Error('Could not commit the previewed source tree move.');
    }
    void Promise.resolve(commitResult).finally(() => {
      if (cleaned) return;
      animationFrameId = ownerWindow.requestAnimationFrame(runCleanup);
    });
  }

  // Keep the simulated destination mounted for the complete position-only
  // interpolation. The authored tree is committed only after that frame has
  // finished, so runtime hydration cannot replace the preview with an empty
  // component boundary before it has painted.
  SOURCE_TREE_PREVIEW_COMMITTED_REFLOW_CLEANUPS.set(container, commitAfterPreview);
  commitTimerId = ownerWindow.setTimeout(
    commitAfterPreview,
    SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS + 40,
  );
}

function getSourceTreePreviewDropPreviewKey(target: SourceTreePreviewDropTarget | null): string | null {
  // Preview-tree simulation and final source movement are determined solely by
  // the destination parent and insertion index. "After A" and "before B" can
  // describe that same structural result; including the hit-side label would
  // restart the FLIP interpolation while the pointer remained in one slot.
  return target ? `${target.parentId}:${target.index}` : null;
}

function isSourceTreePreviewPointerNearDropTargetScopeEdge({
  clientX,
  clientY,
  container,
  target,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  target: SourceTreePreviewDropTarget;
}): boolean {
  const scopeRect = target.scopeRect;
  if (!scopeRect) return false;
  const overlayHost = target.topLayerHost ?? container;
  const hostRect = overlayHost.getBoundingClientRect();
  const localX = clientX - hostRect.left + overlayHost.scrollLeft;
  const localY = clientY - hostRect.top + overlayHost.scrollTop;
  const edgeRetention = SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MAX_PX;
  const left = scopeRect.left;
  const top = scopeRect.top;
  const right = left + scopeRect.width;
  const bottom = top + scopeRect.height;
  const insideExpandedScope =
    localX >= left - edgeRetention &&
    localX <= right + edgeRetention &&
    localY >= top - edgeRetention &&
    localY <= bottom + edgeRetention;
  if (!insideExpandedScope) return false;
  return Math.min(
    Math.abs(localX - left),
    Math.abs(localX - right),
    Math.abs(localY - top),
    Math.abs(localY - bottom),
  ) <= edgeRetention;
}

type SourceTreePreviewTemporaryInlineStyle = {
  priority: string;
  value: string;
};

function setSourceTreePreviewTemporaryInlineStyle(
  element: HTMLElement,
  snapshots: Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>,
  property: string,
  value: string,
  priority: '' | 'important' = 'important',
) {
  let elementSnapshot = snapshots.get(element);
  if (!elementSnapshot) {
    elementSnapshot = new Map();
    snapshots.set(element, elementSnapshot);
  }
  if (!elementSnapshot.has(property)) {
    elementSnapshot.set(property, {
      priority: element.style.getPropertyPriority(property),
      value: element.style.getPropertyValue(property),
    });
  }
  element.style.setProperty(property, value, priority);
}

function restoreSourceTreePreviewTemporaryInlineStyles(
  snapshots: Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>,
) {
  for (const [element, properties] of snapshots) {
    for (const [property, snapshot] of properties) {
      if (snapshot.value) element.style.setProperty(property, snapshot.value, snapshot.priority);
      else element.style.removeProperty(property);
    }
  }
}

function createSourceTreePreviewDragGhostPreview(
  elements: readonly HTMLElement[],
  pointer: { x: number; y: number },
): SourceTreePreviewDragGhostPreview | null {
  const visibleElements = elements.map((element) => ({
    element,
    rect: element.getBoundingClientRect(),
  })).filter(({ rect }) => rect.width > 0 || rect.height > 0);
  if (visibleElements.length === 0) return null;
  const left = Math.min(...visibleElements.map(({ rect }) => rect.left));
  const top = Math.min(...visibleElements.map(({ rect }) => rect.top));
  const right = Math.max(...visibleElements.map(({ rect }) => rect.right));
  const bottom = Math.max(...visibleElements.map(({ rect }) => rect.bottom));
  const fullWidth = right - left;
  const fullHeight = bottom - top;
  const snapshot = visibleElements.reduce(
    (count, { element }) => count + 1 + element.querySelectorAll('*').length,
    0,
  ) > SOURCE_TREE_PREVIEW_DRAG_GHOST_FULL_STYLE_NODE_LIMIT;
  const width = snapshot
    ? Math.min(fullWidth, SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_WIDTH)
    : fullWidth;
  const height = snapshot
    ? Math.min(fullHeight, SOURCE_TREE_PREVIEW_DRAG_GHOST_SNAPSHOT_MAX_HEIGHT)
    : fullHeight;
  const cropLeft = 0;
  const cropTop = 0;
  const maskOriginX = 0;
  const maskOriginY = 0;
  return {
    height,
    items: visibleElements.map(({ element, rect }) => {
      const clone = cloneSourceTreePreviewDragGhostElement(element, !snapshot);
      clone.classList.add('wb-source-visual-drag-ghost-item');
      clone.style.setProperty('height', `${rect.height}px`, 'important');
      clone.style.setProperty('left', `${rect.left - left - cropLeft}px`, 'important');
      clone.style.setProperty('margin', '0', 'important');
      clone.style.setProperty('position', 'absolute', 'important');
      clone.style.setProperty('top', `${rect.top - top - cropTop}px`, 'important');
      clone.style.setProperty('transform', 'none', 'important');
      clone.style.setProperty('width', `${rect.width}px`, 'important');
      return {
        clone,
        height: rect.height,
        left: rect.left - left - cropLeft,
        nodeId: getSourceTreePreviewElementNodeId(element),
        top: rect.top - top - cropTop,
        width: rect.width,
      };
    }),
    maskOriginX,
    maskOriginY,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    snapshot,
    width,
  };
}

function cloneSourceTreePreviewDragGhostElement(
  source: HTMLElement,
  copyComputedStylesForEveryNode = true,
): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const ownerWindow = getSourceTreePreviewOwnerWindow(source);
  const sourceElements = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  for (let index = 0; index < Math.min(sourceElements.length, cloneElements.length); index += 1) {
    const sourceElement = sourceElements[index];
    const cloneElement = cloneElements[index];
    if (copyComputedStylesForEveryNode || index === 0) {
      const computedStyle = ownerWindow.getComputedStyle(sourceElement);
      for (let styleIndex = 0; styleIndex < computedStyle.length; styleIndex += 1) {
        const property = computedStyle.item(styleIndex);
        cloneElement.style.setProperty(
          property,
          computedStyle.getPropertyValue(property),
          computedStyle.getPropertyPriority(property),
        );
      }
    }
    cloneElement.removeAttribute('id');
    cloneElement.removeAttribute('data-wb-preview-node-id');
    cloneElement.removeAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE);
    cloneElement.removeAttribute('data-wb-runtime-component-root');
    // Runtime-root class names also encode the authored node id. If they leak
    // into the visual clone, placeholder hiding and FLIP measurement mistake
    // the ghost for the moved source node and make it disappear.
    for (const className of Array.from(cloneElement.classList)) {
      if (className.startsWith(SOURCE_TREE_PREVIEW_RUNTIME_ROOT_CLASS_PREFIX)) {
        cloneElement.classList.remove(className);
      }
    }
    cloneElement.style.setProperty('animation', 'none', 'important');
    cloneElement.style.setProperty('pointer-events', 'none', 'important');
    cloneElement.style.setProperty('transition', 'none', 'important');
    cloneElement.style.setProperty('user-select', 'none', 'important');
    if (sourceElement.tagName === 'INPUT' && cloneElement.tagName === 'INPUT') {
      const sourceInput = sourceElement as HTMLInputElement;
      const cloneInput = cloneElement as HTMLInputElement;
      cloneInput.checked = sourceInput.checked;
      cloneInput.value = sourceInput.value;
    } else if (sourceElement.tagName === 'TEXTAREA' && cloneElement.tagName === 'TEXTAREA') {
      (cloneElement as HTMLTextAreaElement).value = (sourceElement as HTMLTextAreaElement).value;
    } else if (sourceElement.tagName === 'SELECT' && cloneElement.tagName === 'SELECT') {
      (cloneElement as HTMLSelectElement).value = (sourceElement as HTMLSelectElement).value;
    } else if (sourceElement.tagName === 'CANVAS' && cloneElement.tagName === 'CANVAS') {
      const sourceCanvas = sourceElement as HTMLCanvasElement;
      const cloneCanvas = cloneElement as HTMLCanvasElement;
      cloneCanvas.width = sourceCanvas.width;
      cloneCanvas.height = sourceCanvas.height;
      cloneCanvas.getContext('2d')?.drawImage(sourceCanvas, 0, 0);
    }
  }
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

function getSourceTreePreviewDragGhostTransitionOrigins(
  preview: SourceTreePreviewDragGhostPreview | null,
  pointer: { x: number; y: number },
): SourceTreePreviewLayoutSnapshot | undefined {
  if (!preview) return undefined;
  const left = pointer.x - preview.pointerOffsetX;
  const top = pointer.y - preview.pointerOffsetY;
  const origins: SourceTreePreviewLayoutSnapshot = new Map();
  for (const item of preview.items) {
    if (!item.nodeId || origins.has(item.nodeId)) continue;
    origins.set(item.nodeId, {
      height: item.height,
      left: left + item.left,
      top: top + item.top,
      width: item.width,
    });
  }
  return origins.size > 0 ? origins : undefined;
}

function applySourceTreePreviewDragOriginPreview(elements: readonly HTMLElement[]): () => void {
  const snapshots = new Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>();
  for (const element of elements) {
    // The projected-tree placeholder already owns this element's temporary
    // opacity. Capturing that `0` as the drag-origin baseline would later
    // "restore" the authored node to invisible after Escape or drop cleanup.
    if (element.hasAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE)) continue;
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'opacity', '0');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'transition-property', 'opacity');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'transition-duration', '120ms');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'transition-timing-function', 'ease');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'will-change', 'opacity');
  }
  return () => restoreSourceTreePreviewTemporaryInlineStyles(snapshots);
}

function applySourceTreePreviewDropPlaceholderPreview(
  targetDocument: Document | null,
  hiddenNodeIds: readonly string[],
): () => void {
  const snapshots = new Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>();
  const previousMarkerValues = new Map<HTMLElement, string | null>();
  if (!targetDocument || hiddenNodeIds.length === 0) return () => {};
  const hiddenIds = new Set(hiddenNodeIds);
  for (const element of targetDocument.querySelectorAll<HTMLElement>(
    SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,
  )) {
    const nodeId = getSourceTreePreviewElementNodeId(element);
    if (!nodeId || !hiddenIds.has(nodeId)) continue;
    previousMarkerValues.set(
      element,
      element.getAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE),
    );
    element.setAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE, 'true');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'opacity', '0');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'transition-property', 'none');
  }
  return () => {
    restoreSourceTreePreviewTemporaryInlineStyles(snapshots);
    for (const [element, previousValue] of previousMarkerValues) {
      if (previousValue === null) {
        element.removeAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE);
      } else {
        element.setAttribute(SOURCE_TREE_PREVIEW_DROP_PLACEHOLDER_HIDDEN_ATTRIBUTE, previousValue);
      }
    }
  };
}

function applySourceTreePreviewDragChromePreview(container: HTMLElement): () => void {
  const snapshots = new Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>();
  const chromeElements = container.ownerDocument.querySelectorAll<HTMLElement>(
    '.wb-source-visual-selection-overlay, .wb-source-visual-selection-label',
  );
  for (const element of chromeElements) {
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'opacity', '0');
    setSourceTreePreviewTemporaryInlineStyle(element, snapshots, 'transition', 'none');
  }
  return () => restoreSourceTreePreviewTemporaryInlineStyles(snapshots);
}

function addSourceTreePreviewPointerGestureListeners({
  listenerOptions,
  mouseFallback = false,
  onCancel,
  onMove,
  onUp,
  ownerWindow,
}: {
  listenerOptions?: AddEventListenerOptions;
  mouseFallback?: boolean;
  onCancel?: (event: SourceTreePreviewPointerGestureEvent) => void;
  onMove?: (event: SourceTreePreviewPointerGestureEvent) => void;
  onUp?: (event: SourceTreePreviewPointerGestureEvent) => void;
  ownerWindow: SourceTreePreviewDomWindow;
}): () => void {
  const hostWindow = getSourceTreePreviewHostWindow(ownerWindow);
  const hasHostBridge = Boolean(hostWindow && hostWindow !== ownerWindow);
  const ownerMove = onMove ? (event: PointerEvent) => onMove(event) : null;
  const ownerUp = onUp ? (event: PointerEvent) => onUp(event) : null;
  const ownerCancel = onCancel ? (event: PointerEvent) => onCancel(event) : null;
  const hostMove = onMove && hasHostBridge
    ? (event: PointerEvent) => onMove(createSourceTreePreviewHostPointerEvent(event, ownerWindow))
    : null;
  const hostUp = onUp && hasHostBridge
    ? (event: PointerEvent) => onUp(createSourceTreePreviewHostPointerEvent(event, ownerWindow))
    : null;
  const hostCancel = onCancel && hasHostBridge
    ? (event: PointerEvent) => onCancel(createSourceTreePreviewHostPointerEvent(event, ownerWindow))
    : null;
  const ownerMouseMove = onMove && mouseFallback
    ? (event: MouseEvent) => onMove(createSourceTreePreviewMouseEvent(event))
    : null;
  const ownerMouseUp = onUp && mouseFallback
    ? (event: MouseEvent) => onUp(createSourceTreePreviewMouseEvent(event))
    : null;
  const hostMouseMove = onMove && hasHostBridge && mouseFallback
    ? (event: MouseEvent) => onMove(createSourceTreePreviewHostMouseEvent(event, ownerWindow))
    : null;
  const hostMouseUp = onUp && hasHostBridge && mouseFallback
    ? (event: MouseEvent) => onUp(createSourceTreePreviewHostMouseEvent(event, ownerWindow))
    : null;

  if (ownerMove) ownerWindow.addEventListener('pointermove', ownerMove, listenerOptions);
  if (ownerUp) ownerWindow.addEventListener('pointerup', ownerUp, listenerOptions);
  if (ownerCancel) ownerWindow.addEventListener('pointercancel', ownerCancel, listenerOptions);
  if (hostWindow && hostMove) hostWindow.addEventListener('pointermove', hostMove, listenerOptions);
  if (hostWindow && hostUp) hostWindow.addEventListener('pointerup', hostUp, listenerOptions);
  if (hostWindow && hostCancel) hostWindow.addEventListener('pointercancel', hostCancel, listenerOptions);
  if (ownerMouseMove) ownerWindow.addEventListener('mousemove', ownerMouseMove, listenerOptions);
  if (ownerMouseUp) ownerWindow.addEventListener('mouseup', ownerMouseUp, listenerOptions);
  if (hostWindow && hostMouseMove) hostWindow.addEventListener('mousemove', hostMouseMove, listenerOptions);
  if (hostWindow && hostMouseUp) hostWindow.addEventListener('mouseup', hostMouseUp, listenerOptions);

  return () => {
    if (ownerMove) ownerWindow.removeEventListener('pointermove', ownerMove, listenerOptions);
    if (ownerUp) ownerWindow.removeEventListener('pointerup', ownerUp, listenerOptions);
    if (ownerCancel) ownerWindow.removeEventListener('pointercancel', ownerCancel, listenerOptions);
    if (hostWindow && hostMove) hostWindow.removeEventListener('pointermove', hostMove, listenerOptions);
    if (hostWindow && hostUp) hostWindow.removeEventListener('pointerup', hostUp, listenerOptions);
    if (hostWindow && hostCancel) hostWindow.removeEventListener('pointercancel', hostCancel, listenerOptions);
    if (ownerMouseMove) ownerWindow.removeEventListener('mousemove', ownerMouseMove, listenerOptions);
    if (ownerMouseUp) ownerWindow.removeEventListener('mouseup', ownerMouseUp, listenerOptions);
    if (hostWindow && hostMouseMove) hostWindow.removeEventListener('mousemove', hostMouseMove, listenerOptions);
    if (hostWindow && hostMouseUp) hostWindow.removeEventListener('mouseup', hostMouseUp, listenerOptions);
  };
}

function getSourceTreePreviewStartPointerId(event: SourceTreePreviewDragStartEvent): number | undefined {
  return 'pointerId' in event ? event.pointerId : undefined;
}

function createSourceTreePreviewHostPointerEvent(
  event: PointerEvent,
  ownerWindow: SourceTreePreviewDomWindow,
): SourceTreePreviewPointerGestureEvent {
  const frameRect = getSourceTreePreviewFrameRect(ownerWindow);
  return {
    cancelable: event.cancelable,
    clientX: frameRect ? event.clientX - frameRect.left : event.clientX,
    clientY: frameRect ? event.clientY - frameRect.top : event.clientY,
    pointerId: event.pointerId,
    preventDefault: () => event.preventDefault(),
    shiftKey: event.shiftKey,
    stopPropagation: () => event.stopPropagation(),
  };
}

function createSourceTreePreviewMouseEvent(event: MouseEvent): SourceTreePreviewPointerGestureEvent {
  return {
    cancelable: event.cancelable,
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: SOURCE_TREE_PREVIEW_MOUSE_POINTER_ID,
    preventDefault: () => event.preventDefault(),
    shiftKey: event.shiftKey,
    stopPropagation: () => event.stopPropagation(),
  };
}

function createSourceTreePreviewHostMouseEvent(
  event: MouseEvent,
  ownerWindow: SourceTreePreviewDomWindow,
): SourceTreePreviewPointerGestureEvent {
  const frameRect = getSourceTreePreviewFrameRect(ownerWindow);
  return {
    cancelable: event.cancelable,
    clientX: frameRect ? event.clientX - frameRect.left : event.clientX,
    clientY: frameRect ? event.clientY - frameRect.top : event.clientY,
    pointerId: SOURCE_TREE_PREVIEW_MOUSE_POINTER_ID,
    preventDefault: () => event.preventDefault(),
    shiftKey: event.shiftKey,
    stopPropagation: () => event.stopPropagation(),
  };
}

function getSourceTreePreviewHostWindow(ownerWindow: SourceTreePreviewDomWindow): Window | null {
  try {
    return ownerWindow.frameElement?.ownerDocument?.defaultView ?? null;
  } catch {
    return null;
  }
}

function getSourceTreePreviewFrameRect(ownerWindow: SourceTreePreviewDomWindow): DOMRect | null {
  try {
    const frameElement = ownerWindow.frameElement;
    return frameElement && typeof (frameElement as Element).getBoundingClientRect === 'function'
      ? (frameElement as Element).getBoundingClientRect()
      : null;
  } catch {
    return null;
  }
}

function blockSourceTreePreviewPointerEvent(event: SourceTreePreviewPointerGestureEvent) {
  if (event.cancelable) event.preventDefault();
  event.stopPropagation();
}

function getSourceTreePreviewOwnerWindow(node: Node | null): SourceTreePreviewDomWindow {
  return (node?.ownerDocument?.defaultView ?? window) as SourceTreePreviewDomWindow;
}

function getSourceTreePreviewComputedStyle(element: Element): CSSStyleDeclaration {
  return getSourceTreePreviewOwnerWindow(element).getComputedStyle(element);
}

function getSourceTreePreviewAnimationWindow(container: HTMLElement | null): SourceTreePreviewDomWindow {
  return getSourceTreePreviewOwnerWindow(container);
}

function isSourceTreePreviewNode(value: unknown): value is Node {
  return Boolean(value && typeof value === 'object' && typeof (value as Node).nodeType === 'number');
}

function isSourceTreePreviewElement(value: unknown): value is Element {
  return isSourceTreePreviewNode(value) &&
    (value as Node).nodeType === 1 &&
    typeof (value as Element).closest === 'function' &&
    typeof (value as Element).querySelectorAll === 'function';
}

function isSourceTreePreviewHTMLElement(value: unknown): value is HTMLElement {
  return isSourceTreePreviewElement(value) &&
    typeof (value as HTMLElement).style === 'object' &&
    typeof (value as HTMLElement).getBoundingClientRect === 'function';
}

function installSourceTreePreviewWheelScroll(container: HTMLElement, selectedLayerId: string | null): () => void {
  const ownerDocument = container.ownerDocument;
  const snapWheelGestureStates = createPreviewSnapWheelGestureStates();
  const runtimeWheelGestureStates = new WeakMap<HTMLElement, {
    delta: number;
    handled: boolean;
    handledAt: number;
    lastDirection: number;
    lastEventTime: number;
    restartArmed: boolean;
    restartBaselineMagnitude: number;
  }>();
  const handleWheel = (event: WheelEvent) => {
    if (event.defaultPrevented) return;
    if (!isPointInsideSourceTreePreviewElement(container, event.clientX, event.clientY)) return;

    const deltaX = normalizeSourceTreePreviewWheelDelta(event.deltaX, event.deltaMode, container);
    const deltaY = normalizeSourceTreePreviewWheelDelta(event.deltaY, event.deltaMode, container);
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    const targetElement = getSourceTreePreviewWheelTargetElement(event.target);
    // Transform-based runtime scrollers such as Embla are intentionally absent
    // from the native scrollable-element search below. Bridge the wheel intent
    // to the component's existing keyboard contract instead of discarding it
    // or translating it into canvas/document scrolling.
    const runtimeWheelTarget = getSourceTreePreviewRuntimeWheelGestureTarget(
      container,
      targetElement,
      event.clientX,
      event.clientY,
    );
    if (runtimeWheelTarget && handleSourceTreePreviewRuntimeWheelGesture(
      event,
      runtimeWheelTarget,
      deltaX,
      deltaY,
      runtimeWheelGestureStates,
    )) return;
    if (!event.cancelable) return;
    const scrollTarget = getSourceTreePreviewScrollableElementAtPoint(
      container,
      event.clientX,
      event.clientY,
      deltaX,
      deltaY,
    ) ?? getSelectedSourceTreePreviewScrollableElement(
      container,
      selectedLayerId,
      event.clientX,
      event.clientY,
      deltaX,
      deltaY,
    ) ?? (targetElement && container.contains(targetElement)
      ? getScrollableSourceTreePreviewAncestor(targetElement, container, deltaX, deltaY)
      : null) ?? (canScrollSourceTreePreviewElement(container, deltaX, deltaY) ? container : null);
    if (!scrollTarget) return;
    // A real runtime scroller owns its complete native wheel sequence,
    // including platform momentum. Workbench only bridges when editor chrome
    // or another non-descendant surface prevented the event from reaching it.
    if (isPreviewWheelOwnedByScrollTarget(event, scrollTarget)) return;
    if (handlePreviewSnapWheelGesture({
      event,
      scrollTarget,
      deltaX,
      deltaY,
      states: snapWheelGestureStates,
    })) return;

    event.preventDefault();
    scrollTarget.scrollBy({ left: deltaX, top: deltaY, behavior: 'auto' });
  };

  // Preview-scoped by construction (it early-returns for points outside the
  // preview), so it must keep running while a project overlay is open.
  (handleWheel as SourceTreePreviewOwnListener)[SOURCE_TREE_PREVIEW_OWN_WHEEL_LISTENER] = true;
  ownerDocument.addEventListener('wheel', handleWheel, { passive: false });
  return () => ownerDocument.removeEventListener('wheel', handleWheel);
}

function getSourceTreePreviewRuntimeWheelGestureTarget(
  container: HTMLElement,
  target: Element | null,
  clientX: number,
  clientY: number,
): HTMLElement | null {
  const targetCarousel = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_TARGET_SELECTOR);
  if (targetCarousel && container.contains(targetCarousel)) return targetCarousel;

  for (const element of container.ownerDocument.elementsFromPoint(clientX, clientY)) {
    const carousel = element.closest<HTMLElement>(SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_TARGET_SELECTOR);
    if (carousel && container.contains(carousel)) return carousel;
  }
  return null;
}

function handleSourceTreePreviewRuntimeWheelGesture(
  event: WheelEvent,
  carousel: HTMLElement,
  deltaX: number,
  deltaY: number,
  gestureStates: WeakMap<HTMLElement, {
    delta: number;
    handled: boolean;
    handledAt: number;
    lastDirection: number;
    lastEventTime: number;
    restartArmed: boolean;
    restartBaselineMagnitude: number;
  }>,
): boolean {
  const orientation = carousel.dataset.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const shiftedHorizontalWheel = orientation === 'horizontal' && event.shiftKey && Math.abs(deltaY) > Math.abs(deltaX);
  const axisDelta = orientation === 'vertical'
    ? deltaY
    : shiftedHorizontalWheel ? deltaY : deltaX;
  const crossAxisDelta = orientation === 'vertical'
    ? deltaX
    : shiftedHorizontalWheel ? 0 : deltaY;
  if (Math.abs(axisDelta) < 2 || Math.abs(axisDelta) <= Math.abs(crossAxisDelta)) return false;

  if (event.cancelable) event.preventDefault();
  const eventTime = event.timeStamp || Date.now();
  const direction = Math.sign(axisDelta);
  const deltaMagnitude = Math.abs(axisDelta);
  const previousState = gestureStates.get(carousel);
  const eventGap = previousState ? eventTime - previousState.lastEventTime : Number.POSITIVE_INFINITY;
  const directionChanged = Boolean(previousState && previousState.lastDirection !== direction);

  if (
    previousState?.handled &&
    eventTime - previousState.handledAt >= SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_DELAY_MS &&
    deltaMagnitude <= SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_TAIL_DELTA
  ) {
    previousState.restartArmed = true;
    previousState.restartBaselineMagnitude = Math.min(
      previousState.restartBaselineMagnitude,
      deltaMagnitude,
    );
  }

  const restartedAfterMomentumTail = Boolean(
    previousState?.handled &&
    previousState.restartArmed &&
    deltaMagnitude >= SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_DELTA &&
    (
      directionChanged ||
      deltaMagnitude >=
        previousState.restartBaselineMagnitude * SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_RESTART_RATIO
    )
  );
  const startsNewGesture = !previousState ||
    eventGap > SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_GESTURE_GAP_MS ||
    (!previousState.handled && directionChanged) ||
    restartedAfterMomentumTail;
  const state = startsNewGesture
    ? {
        delta: 0,
        handled: false,
        handledAt: 0,
        lastDirection: direction,
        lastEventTime: eventTime,
        restartArmed: false,
        restartBaselineMagnitude: Number.POSITIVE_INFINITY,
      }
    : previousState;
  state.lastDirection = direction;
  state.lastEventTime = eventTime;
  gestureStates.set(carousel, state);

  // A Magic Mouse emits a long momentum stream for one physical swipe. Once
  // that swipe advances the carousel, consume its remaining events without
  // periodically firing again. A later swipe is recognized either by an idle
  // gap or by a fresh acceleration after the momentum tail has decayed.
  if (state.handled) return true;

  state.delta += axisDelta;
  if (Math.abs(state.delta) < SOURCE_TREE_PREVIEW_RUNTIME_WHEEL_SCROLL_THRESHOLD) return true;
  state.handled = true;
  state.handledAt = eventTime;
  state.delta = 0;

  const key = orientation === 'vertical'
    ? direction < 0 ? 'ArrowUp' : 'ArrowDown'
    : direction < 0 ? 'ArrowLeft' : 'ArrowRight';
  const KeyboardEventConstructor = carousel.ownerDocument.defaultView?.KeyboardEvent ?? KeyboardEvent;
  carousel.dispatchEvent(new KeyboardEventConstructor('keydown', {
    bubbles: true,
    cancelable: true,
    key,
  }));
  return true;
}

function normalizeSourceTreePreviewWheelDelta(delta: number, deltaMode: number, container: HTMLElement): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * container.clientHeight;
  return delta;
}

function getSourceTreePreviewWheelTargetElement(target: EventTarget | null): Element | null {
  if (isSourceTreePreviewElement(target)) return target;
  if (isSourceTreePreviewNode(target) && isSourceTreePreviewElement(target.parentElement)) {
    return target.parentElement;
  }
  return null;
}

function getScrollableSourceTreePreviewAncestor(
  start: Element,
  container: HTMLElement,
  deltaX: number,
  deltaY: number,
): HTMLElement | null {
  let current: Element | null = start;
  while (current && current !== container) {
    if (isSourceTreePreviewHTMLElement(current) && canScrollSourceTreePreviewElement(current, deltaX, deltaY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getSourceTreePreviewScrollableElementAtPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  deltaX: number,
  deltaY: number,
): HTMLElement | null {
  const elements = container.ownerDocument.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (
      !isSourceTreePreviewHTMLElement(element) ||
      element === container ||
      !container.contains(element)
    ) continue;
    // The innermost scroll container owns the wheel gesture for its axis even
    // at its first or last scroll position. Falling through at the boundary
    // makes a menu, drawer, or ScrollArea move the outer design canvas and
    // produces the two-scroll behavior users cannot predict.
    if (isSourceTreePreviewScrollContainerForAxis(element, deltaX, deltaY)) {
      return element;
    }
  }
  return null;
}

function getSelectedSourceTreePreviewScrollableElement(
  container: HTMLElement,
  selectedLayerId: string | null,
  clientX: number,
  clientY: number,
  deltaX: number,
  deltaY: number,
): HTMLElement | null {
  if (!selectedLayerId) return null;
  for (const element of getPreviewNodeResizeTargets(container, selectedLayerId)) {
    const rect = getPreviewNodeVisualRect(element);
    if (!rect || clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue;
    if (canScrollSourceTreePreviewElement(element, deltaX, deltaY)) return element;
  }
  return null;
}

function canScrollSourceTreePreviewElement(element: HTMLElement, deltaX: number, deltaY: number): boolean {
  if (!isSourceTreePreviewScrollContainerForAxis(element, deltaX, deltaY)) return false;
  const dominantAxisIsY = Math.abs(deltaY) >= Math.abs(deltaX);
  return dominantAxisIsY
    ? canScrollSourceTreePreviewAxis(element.scrollTop, element.clientHeight, element.scrollHeight, deltaY)
    : canScrollSourceTreePreviewAxis(element.scrollLeft, element.clientWidth, element.scrollWidth, deltaX);
}

function isSourceTreePreviewScrollContainerForAxis(
  element: HTMLElement,
  deltaX: number,
  deltaY: number,
): boolean {
  const style = getSourceTreePreviewComputedStyle(element);
  const canScrollY = Math.abs(deltaY) >= Math.abs(deltaX)
    && isSourceTreePreviewScrollableOverflow(style.overflowY || style.overflow)
    && element.scrollHeight > element.clientHeight + 1;
  const canScrollX = Math.abs(deltaX) > Math.abs(deltaY)
    && isSourceTreePreviewScrollableOverflow(style.overflowX || style.overflow)
    && element.scrollWidth > element.clientWidth + 1;
  return canScrollY || canScrollX;
}

function canScrollSourceTreePreviewAxis(scrollPosition: number, clientSize: number, scrollSize: number, delta: number): boolean {
  if (delta > 0) return scrollPosition + clientSize < scrollSize - 1;
  if (delta < 0) return scrollPosition > 1;
  return false;
}

function isSourceTreePreviewScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll' || value === 'overlay';
}

function isPointInsideSourceTreePreviewElement(element: HTMLElement, clientX: number, clientY: number): boolean {
  const rect = element.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function cancelSourceTreePreviewNativePointerGesture(
  target: HTMLElement,
  pointerId: number,
  pointerStart: SourceTreePreviewPointerStart,
) {
  const ownerWindow = getSourceTreePreviewOwnerWindow(target);
  const PointerEventCtor = ownerWindow.PointerEvent ?? PointerEvent;
  const EventCtor = ownerWindow.Event ?? Event;
  try {
    target.dispatchEvent(new PointerEventCtor('pointercancel', {
      bubbles: true,
      cancelable: true,
      clientX: pointerStart.clientX,
      clientY: pointerStart.clientY,
      pointerId,
    }));
  } catch {
    const fallbackEvent = new EventCtor('pointercancel', {
      bubbles: true,
      cancelable: true,
    }) as PointerEvent;
    Object.defineProperties(fallbackEvent, {
      clientX: { value: pointerStart.clientX },
      clientY: { value: pointerStart.clientY },
      pointerId: { value: pointerId },
    });
    target.dispatchEvent(fallbackEvent);
  }
}

function resolveSourceTreePreviewResizeEdge(
  container: HTMLElement | null,
  layerId: string,
  clientX: number,
  clientY: number,
): SourceTreePreviewResizeEdge | null {
  const target = container ? getPreviewNodePrimaryElement(container, layerId) : null;
  if (!target) return null;
  const rect = getPreviewNodeVisualRect(target);
  if (!rect) return null;
  return resolveSourceTreePreviewResizeEdgeFromRect(rect, clientX, clientY);
}

function resolveSourceTreePreviewResizeEdgeFromRect(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): SourceTreePreviewResizeEdge | null {
  const edge = SOURCE_TREE_PREVIEW_RESIZE_EDGE_PX;
  const onNorth = Math.abs(clientY - rect.top) <= edge && clientX >= rect.left - edge && clientX <= rect.right + edge;
  const onSouth = Math.abs(clientY - rect.bottom) <= edge && clientX >= rect.left - edge && clientX <= rect.right + edge;
  const onWest = Math.abs(clientX - rect.left) <= edge && clientY >= rect.top - edge && clientY <= rect.bottom + edge;
  const onEast = Math.abs(clientX - rect.right) <= edge && clientY >= rect.top - edge && clientY <= rect.bottom + edge;
  if (onNorth && onWest) return 'nw';
  if (onNorth && onEast) return 'ne';
  if (onSouth && onWest) return 'sw';
  if (onSouth && onEast) return 'se';
  if (onNorth) return 'n';
  if (onSouth) return 's';
  if (onWest) return 'w';
  if (onEast) return 'e';
  return null;
}

function getSourceTreePreviewResizeCursor(edge: SourceTreePreviewResizeEdge): string {
  return {
    e: 'e-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    nw: 'nw-resize',
    s: 's-resize',
    se: 'se-resize',
    sw: 'sw-resize',
    w: 'w-resize',
  }[edge];
}

function resolveSourceTreePreviewResizeSize({
  aspectRatio,
  edge,
  startHeight,
  startWidth,
  startX,
  startY,
  target,
  x,
  y,
}: {
  aspectRatio: number | null;
  edge: SourceTreePreviewResizeEdge;
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
  target: HTMLElement;
  x: number;
  y: number;
}): { height: number; width: number } {
  let dx = x - startX;
  let dy = y - startY;
  if (edge === 'n' || edge === 's') dx = 0;
  if (edge === 'e' || edge === 'w') dy = 0;
  if (edge.includes('n')) dy = -dy;
  if (edge.includes('w')) dx = -dx;
  let width = Math.max(SOURCE_TREE_PREVIEW_MIN_SIZE_PX, startWidth + dx);
  let height = Math.max(SOURCE_TREE_PREVIEW_MIN_SIZE_PX, startHeight + dy);
  if (hasSourceTreePreviewAspectRatio(aspectRatio)) {
    if (edge === 'n' || edge === 's') width = height * aspectRatio;
    else height = width / aspectRatio;
  }
  return clampSourceTreePreviewSize(target, { height, width });
}

function clampSourceTreePreviewSize(target: HTMLElement, size: { height: number; width: number }): { height: number; width: number } {
  const style = getSourceTreePreviewComputedStyle(target);
  const minWidth = parseSourceTreePreviewPixelValue(style.minWidth, 0);
  const maxWidth = parseSourceTreePreviewOptionalPixelValue(style.maxWidth);
  const minHeight = parseSourceTreePreviewPixelValue(style.minHeight, 0);
  const maxHeight = parseSourceTreePreviewOptionalPixelValue(style.maxHeight);
  return {
    height: Math.min(Math.max(size.height, minHeight), maxHeight ?? Number.POSITIVE_INFINITY),
    width: Math.min(Math.max(size.width, minWidth), maxWidth ?? Number.POSITIVE_INFINITY),
  };
}

function applySourceTreePreviewSize(
  target: HTMLElement,
  edge: SourceTreePreviewResizeEdge,
  width: number,
  height: number,
  resizeBothAxes = false,
) {
  if (resizeBothAxes || (edge !== 'n' && edge !== 's')) target.style.width = `${Math.round(width)}px`;
  if (resizeBothAxes || (edge !== 'e' && edge !== 'w')) target.style.height = `${Math.round(height)}px`;
}

function getSourceTreePreviewInlineSize(target: HTMLElement): { height: string; width: string } {
  return {
    height: target.style.height,
    width: target.style.width,
  };
}

function restoreSourceTreePreviewInlineSize(
  target: HTMLElement,
  size: { height: string; width: string },
) {
  target.style.height = size.height;
  target.style.width = size.width;
}

function getSourceTreePreviewAspectRatio(target: HTMLElement): number | null {
  const style = getSourceTreePreviewComputedStyle(target);
  const styleAspectRatio = parseSourceTreePreviewAspectRatio(style.aspectRatio);
  if (styleAspectRatio !== null) return styleAspectRatio;
  return getSourceTreePreviewMediaFrameAspectRatio(target);
}

function getSourceTreePreviewMediaFrameAspectRatio(target: HTMLElement): number | null {
  if (!target.classList.contains('media-frame')) return null;
  return parseSourceTreePreviewAspectRatio(target.dataset.aspect ?? '16/9');
}

function parseSourceTreePreviewAspectRatio(value: string): number | null {
  const ratio = value.trim();
  if (!ratio || ratio === 'auto') return null;
  const fraction = ratio.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const width = Number(fraction[1]);
    const height = Number(fraction[2]);
    return width > 0 && height > 0 ? width / height : null;
  }
  const numeric = Number(ratio);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function hasSourceTreePreviewAspectRatio(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function parseSourceTreePreviewPixelValue(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSourceTreePreviewOptionalPixelValue(value: string): number | null {
  if (!value || value === 'none') return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPointInsideSourcePreviewLayer(
  container: HTMLElement,
  layerId: string,
  clientX: number,
  clientY: number,
): boolean {
  return getPreviewNodeResizeTargets(container, layerId).some((element) => {
    const rect = getPreviewNodeVisualRect(element);
    return Boolean(rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
  });
}

function isPointInsideSourceTreePreviewNode(
  container: HTMLElement,
  node: EditableTreeNode,
  clientX: number,
  clientY: number,
): boolean {
  return getSourceTreePreviewNodeDragElements(container, node).some((element) => {
    const rect = getSourceTreePreviewDragElementVisualRect(container, element);
    return Boolean(rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
  });
}

/**
 * Which node a press owns.
 *
 * A press inside the selected node's visual box keeps dragging that selection;
 * a press anywhere else hands the drag to the node under the pointer, which
 * then becomes the selection.
 *
 * The surface a node is rendered through — the page, a drawer, a popover — is
 * not a reason for the same gesture to mean something different, so the canvas
 * press path and the portal press path both answer the question here.
 *
 * A page's top-level node is excluded: its box spans the whole preview, so
 * "the press is inside it" says nothing, and it would claim every press
 * including those inside an open drawer. It has no siblings to be reordered
 * among either, so nothing is lost by it not owning drags.
 *
 * Still open: a selection behind an open drawer whose box reaches under it
 * keeps ownership of presses landing on the drawer. Requiring the selection to
 * be reachable by the browser's hit test fixes that in principle and broke
 * `reorder-direction-matrix` in practice — the displaced sibling stopped
 * gliding — with no test able to show it preventing anything. Find the case
 * first, then make it earn its place.
 */
function resolveSourceTreePreviewDragSubject({
  clientX,
  clientY,
  container,
  pointerLayerId,
  pointerNode,
  root,
  selectedLayerId,
  selectedNode,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  pointerLayerId: string | null;
  pointerNode: EditableTreeNode | null;
  root: EditableTreeNode;
  selectedLayerId: string | null;
  selectedNode: EditableTreeNode | null;
}): { layerId: string; selectLayer: boolean; selectedNode: EditableTreeNode } | null {
  if (
    selectedLayerId &&
    selectedNode &&
    !isSourceTreePreviewPageTopLevelNode(selectedNode, root) &&
    isPointInsideSourceTreePreviewNode(container, selectedNode, clientX, clientY)
  ) {
    return { layerId: selectedLayerId, selectLayer: false, selectedNode };
  }
  if (pointerLayerId && pointerNode) {
    return { layerId: pointerLayerId, selectLayer: true, selectedNode: pointerNode };
  }
  return null;
}

/** The document root, or one of the page's own outermost elements. */
function isSourceTreePreviewPageTopLevelNode(node: EditableTreeNode, root: EditableTreeNode): boolean {
  return node.id === root.id || (root.children ?? []).some((child) => child.id === node.id);
}

function getSourceTreePreviewNodeDragElements(
  container: HTMLElement,
  node: EditableTreeNode,
): HTMLElement[] {
  const getRenderedTargets = (nodeId: string) => {
    // Footprint elements. Components that collect their children and re-render
    // them elsewhere leave a hidden 1x1 source marker behind, and those markers
    // are stacked at a single spot: using them as drag anchors put the ghost
    // away from the pointer, and feeding them into child geometry made a plain
    // vertical list look two-dimensional (overlapping 1x1 rects share a "row"),
    // which switched drop resolution into slot mode.
    const targets = getSourceTreePreviewNodeFootprintElements(container, nodeId).filter((element) => (
      !shouldIgnoreSourceTreePreviewVisualElement(element) &&
      Boolean(getSourceTreePreviewDragElementVisualRect(container, element))
    ));
    const canvasFlowTargets = targets.filter((element) => (
      isSourceTreePreviewCanvasFlowElement(container, element)
    ));
    // A logical component can render both an in-flow trigger and portal
    // content. The portal is not part of the component's layout footprint and
    // must not inflate drag size or sibling reflow distance. It remains a
    // fallback for nodes whose only visible representation is in a portal.
    return canvasFlowTargets.length > 0 ? canvasFlowTargets : targets;
  };
  const directTargets = getRenderedTargets(node.id);
  if (directTargets.length > 0) return directTargets;

  const targets = new Set<HTMLElement>();
  const collectNearestRenderedTargets = (currentNode: EditableTreeNode) => {
    const currentTargets = getRenderedTargets(currentNode.id);
    if (currentTargets.length > 0) {
      for (const target of currentTargets) targets.add(target);
      return;
    }
    for (const child of currentNode.children ?? []) collectNearestRenderedTargets(child);
    for (const child of currentNode.sourcePreviewChildren ?? []) collectNearestRenderedTargets(child);
  };

  for (const child of node.children ?? []) collectNearestRenderedTargets(child);
  for (const child of node.sourcePreviewChildren ?? []) collectNearestRenderedTargets(child);
  const renderedTargets = Array.from(targets);
  const canvasFlowTargets = renderedTargets.filter((element) => (
    isSourceTreePreviewCanvasFlowElement(container, element)
  ));
  return canvasFlowTargets.length > 0 ? canvasFlowTargets : renderedTargets;
}

function resolveSourceTreePreviewDragOriginElements({
  container,
  dragNodes,
  eventTargetLayerElement,
  eventTargetLayerId,
  selectedNode,
}: {
  container: HTMLElement;
  dragNodes: readonly EditableTreeNode[];
  eventTargetLayerElement: HTMLElement | null;
  eventTargetLayerId: string | null;
  selectedNode: EditableTreeNode;
}): HTMLElement[] {
  const elements = Array.from(new Set(
    dragNodes.flatMap((node) => getSourceTreePreviewNodeDragElements(container, node)),
  ));
  // A repeater renders one authored child many times, so every visual copy has
  // the same source node id. Building the ghost from all copies creates a
  // grid-sized union and makes the dragged card appear to have no ghost.
  // Preserve the single authored-node commit semantics, but use the exact copy
  // under the pointer as the visual drag origin.
  if (
    dragNodes.length === 1 &&
    elements.length > 1 &&
    eventTargetLayerElement &&
    eventTargetLayerId === selectedNode.id &&
    elements.includes(eventTargetLayerElement)
  ) {
    return [eventTargetLayerElement];
  }
  return elements;
}

function getSourceTreePreviewRectDistanceFromPoint(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): number {
  const dx = clientX < rect.left
    ? rect.left - clientX
    : clientX > rect.right
      ? clientX - rect.right
      : 0;
  const dy = clientY < rect.top
    ? rect.top - clientY
    : clientY > rect.bottom
      ? clientY - rect.bottom
      : 0;
  return Math.hypot(dx, dy);
}

function isSourceTreePreviewCanvasFlowElement(container: HTMLElement, element: HTMLElement): boolean {
  return isSourceTreePreviewElementInFlowScope(container, element);
}

function isSourceTreePreviewElementInFlowScope(
  scopeElement: HTMLElement,
  element: HTMLElement,
): boolean {
  if (element !== scopeElement && !scopeElement.contains(element)) return false;
  let current: HTMLElement | null = element;
  while (current && current !== scopeElement) {
    if (
      current.getAttribute('data-workbench-portal-root') === 'true' ||
      current.getAttribute('data-workbench-theme-portal-root') === 'true'
    ) return false;
    const position = getSourceTreePreviewComputedStyle(current).position;
    if (position === 'absolute' || position === 'fixed') return false;
    current = current.parentElement;
  }
  return current === scopeElement;
}

// Drop decisions must hit-test against LAYOUT positions, not mid-glide visual
// positions. While a FLIP animation is running, the element's rect chases the
// interpolation; decision boundaries computed from that chase the animation
// and flap the target (project → unproject → snap) for inward insertions.
// Portal reorder projections pin a persistent inline translate — that offset
// IS the decided slot and stays included.
function getSourceTreePreviewFlipCompensatedRect(element: HTMLElement, rect: DOMRect): DOMRect {
  // display:contents anchors carry the glide on their boxed children — read
  // the offset from whichever element actually holds the transition marker.
  const transitionHost = element.hasAttribute(SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE)
    ? element
    : element.querySelector<HTMLElement>(`[${SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE}]`);
  if (!transitionHost) return rect;
  if (transitionHost.style.getPropertyValue('translate')) return rect;
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow) return rect;
  const translate = ownerWindow.getComputedStyle(transitionHost).translate;
  if (!translate || translate === 'none' || translate === '0px') return rect;
  const parts = translate.split(' ').map((value) => Number.parseFloat(value));
  const dx = Number.isFinite(parts[0]) ? parts[0] : 0;
  const dy = parts.length > 1 && Number.isFinite(parts[1]) ? parts[1] : 0;
  if (!dx && !dy) return rect;
  return DOMRect.fromRect({ x: rect.x - dx, y: rect.y - dy, width: rect.width, height: rect.height });
}

// While a drag gesture is active, decision rects are frozen at their first
// observation (and invalidated on scroll/resize). Projections collapse the
// dragged node's origin and reflow neighbouring containers; measuring those
// live made the parent-scope choice oscillate between adjacent containers at
// a boundary (grid/wrap judder: reparent target flapping per pointermove).
let activeSourceTreePreviewDropDecisionRectCache: WeakMap<HTMLElement, DOMRect | null> | null = null;

function beginSourceTreePreviewDropDecisionRectCache(): void {
  activeSourceTreePreviewDropDecisionRectCache = new WeakMap();
}

function invalidateSourceTreePreviewDropDecisionRectCache(): void {
  if (activeSourceTreePreviewDropDecisionRectCache) {
    activeSourceTreePreviewDropDecisionRectCache = new WeakMap();
  }
}

function endSourceTreePreviewDropDecisionRectCache(): void {
  activeSourceTreePreviewDropDecisionRectCache = null;
}

function getSourceTreePreviewDropDecisionVisualRect(element: HTMLElement): DOMRect | null {
  const cache = activeSourceTreePreviewDropDecisionRectCache;
  if (cache?.has(element)) return cache.get(element) ?? null;
  const rect = getPreviewNodeVisualRect(element);
  const decisionRect = rect ? getSourceTreePreviewFlipCompensatedRect(element, rect) : null;
  cache?.set(element, decisionRect);
  return decisionRect;
}

function getSourceTreePreviewDragElementVisualRect(
  container: HTMLElement,
  element: HTMLElement,
): DOMRect | null {
  if (shouldIgnoreSourceTreePreviewVisualElement(element)) return null;
  const ownRects = getSourceTreePreviewVisibleClientRects(element);
  if (ownRects.length > 0) {
    const left = Math.min(...ownRects.map((rect) => rect.left));
    const top = Math.min(...ownRects.map((rect) => rect.top));
    const right = Math.max(...ownRects.map((rect) => rect.right));
    const bottom = Math.max(...ownRects.map((rect) => rect.bottom));
    return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
  }

  const childRects = Array.from(element.children).flatMap((child) => {
    if (!isSourceTreePreviewHTMLElement(child)) return [];
    const rect = getSourceTreePreviewDragElementVisualRect(container, child);
    return rect ? [rect] : [];
  });
  if (childRects.length === 0) return null;
  const left = Math.min(...childRects.map((rect) => rect.left));
  const top = Math.min(...childRects.map((rect) => rect.top));
  const right = Math.max(...childRects.map((rect) => rect.right));
  const bottom = Math.max(...childRects.map((rect) => rect.bottom));
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

function getSourceTreePreviewVisualBounds(
  container: HTMLElement,
  elements: readonly HTMLElement[],
): DOMRect | null {
  const rects = elements.flatMap((element) => {
    const rect = getSourceTreePreviewDragElementVisualRect(container, element);
    return rect ? [rect] : [];
  });
  if (rects.length === 0) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

function getSourceTreePreviewDropScopeRect(
  container: HTMLElement,
  node: EditableTreeNode,
  overlayContainer: HTMLElement,
): SourceTreePreviewOverlayRect | null {
  const rect = getSourceTreePreviewVisualBounds(
    container,
    getSourceTreePreviewNodeDragElements(container, node),
  );
  return rect ? toSourceTreePreviewOverlayRect(overlayContainer, rect) : null;
}

function getPreviewNodePrimaryElement(container: HTMLElement, layerId: string): HTMLElement | null {
  return getPreviewNodeElements(container, layerId).find((element) => (
    !shouldIgnoreSourceTreePreviewVisualElement(element) &&
    getPreviewNodeVisualRect(element)
  )) ?? getPreviewNodeResizeTargets(container, layerId)[0] ?? null;
}

function findSourceTreePreviewLayerNode(root: EditableTreeNode, nodeId: string): EditableTreeNode | null {
  return findEditableTreeNodeInPreviewTree(root, nodeId)?.node ?? findEditableTreeNode(root, nodeId);
}

function getSourceTreePreviewLayerChildren(node: EditableTreeNode): EditableTreeNode[] {
  return [
    ...(node.children ?? []),
    ...(node.sourcePreviewChildren ?? []).filter((child) => child.sourcePreviewOrigin === 'forwarded-source-child'),
  ];
}

type SourceTreePreviewChildDropGeometry = {
  element: HTMLElement;
  index: number;
  nodeId: string;
  rect: DOMRect;
};

function getSourceTreePreviewChildDropGeometry(
  container: HTMLElement,
  parentNode: EditableTreeNode,
  ignoredNodeIds?: ReadonlySet<string>,
): SourceTreePreviewChildDropGeometry[] {
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const rawGeometry = getSourceTreePreviewLogicalChildDropGeometry(
    container,
    parentNode,
    ignoredNodeIds,
  );
  const flowScopeElement = getSourceTreePreviewDropFlowElementForChildGeometry(
    parentElement,
    rawGeometry,
  ) ?? parentElement ?? container;
  return rawGeometry.filter((entry) => (
    isSourceTreePreviewElementInFlowScope(flowScopeElement, entry.element)
  ));
}

function getSourceTreePreviewLogicalChildDropGeometry(
  container: HTMLElement,
  parentNode: EditableTreeNode,
  ignoredNodeIds?: ReadonlySet<string>,
): SourceTreePreviewChildDropGeometry[] {
  return getSourceTreePreviewLayerChildren(parentNode).flatMap((child, index) => {
    if (ignoredNodeIds?.has(child.id)) return [];
    const renderedElements = getSourceTreePreviewNodeDragElements(container, child);
    const rawRect = getSourceTreePreviewVisualBounds(container, renderedElements);
    const rect = renderedElements[0] && rawRect
      ? getSourceTreePreviewFlipCompensatedRect(renderedElements[0], rawRect)
      : rawRect;
    return renderedElements[0] &&
      rect &&
      isSourceTreePreviewRectVisibleThroughOverflowAncestors(renderedElements[0], rect, container)
      ? [{ element: renderedElements[0], index, nodeId: child.id, rect }]
      : [];
  });
}

function getSourceTreePreviewChildVisualSnapshot(
  container: HTMLElement,
  parentNode: EditableTreeNode,
): Map<string, DOMRect> {
  return new Map(
    getSourceTreePreviewLogicalChildDropGeometry(container, parentNode).map((entry) => [
      entry.nodeId,
      entry.rect,
    ]),
  );
}

// The set of nodes a reorder is allowed to visually reflow: the destination
// parent's children (post-move sibling set), the dragged nodes' original
// siblings, and the dragged subtrees themselves. Everything else on the page
// must stay put even if a projected re-render nudges its measured rect.
function collectSourceTreePreviewReorderScopeNodeIds(
  root: EditableTreeNode,
  previewRoot: EditableTreeNode,
  dragNodeIds: readonly string[],
  targetParentId: string,
): Set<string> {
  const scope = new Set<string>();
  const addChildren = (parent: EditableTreeNode | null) => {
    if (!parent) return;
    scope.add(parent.id);
    for (const child of getSourceTreePreviewLayerChildren(parent)) scope.add(child.id);
  };
  addChildren(findSourceTreePreviewLayerNode(previewRoot, targetParentId));
  addChildren(findSourceTreePreviewLayerNode(root, targetParentId));
  for (const dragNodeId of dragNodeIds) {
    addChildren(findEditableTreeParent(root, dragNodeId));
    const dragNode = findSourceTreePreviewLayerNode(root, dragNodeId);
    if (dragNode) {
      for (const subtreeId of getSourceTreePreviewNodeSubtreeIds(dragNode)) scope.add(subtreeId);
    }
  }
  return scope;
}

function applySourceTreePreviewPortalReorderProjection({
  container,
  nextRoot,
  parentId,
  previousVisualRects,
  root,
}: {
  container: HTMLElement;
  nextRoot: EditableTreeNode;
  parentId: string;
  previousVisualRects: ReadonlyMap<string, DOMRect>;
  root: EditableTreeNode;
}): () => void {
  const currentParent = findSourceTreePreviewLayerNode(root, parentId);
  const nextParent = findSourceTreePreviewLayerNode(nextRoot, parentId);
  if (!currentParent || !nextParent) return () => {};

  const geometry = getSourceTreePreviewLogicalChildDropGeometry(container, currentParent);
  const geometryByNodeId = new Map(geometry.map((entry) => [entry.nodeId, entry]));
  const geometryByIndex = new Map(geometry.map((entry) => [entry.index, entry]));
  const nextIndexByNodeId = new Map(
    getSourceTreePreviewLayerChildren(nextParent).map((child, index) => [child.id, index]),
  );
  const snapshots = new Map<HTMLElement, Map<string, SourceTreePreviewTemporaryInlineStyle>>();
  const projectedEntries: Array<{
    element: HTMLElement;
    initialX: number;
    initialY: number;
    targetX: number;
    targetY: number;
  }> = [];

  for (const [nodeId, currentEntry] of geometryByNodeId) {
    const nextIndex = nextIndexByNodeId.get(nodeId);
    const targetEntry = nextIndex === undefined ? null : geometryByIndex.get(nextIndex);
    if (!targetEntry) continue;
    const currentVisualRect = previousVisualRects.get(nodeId) ?? currentEntry.rect;
    const initialX = currentVisualRect.left - currentEntry.rect.left;
    const initialY = currentVisualRect.top - currentEntry.rect.top;
    const targetX = targetEntry.rect.left - currentEntry.rect.left;
    const targetY = targetEntry.rect.top - currentEntry.rect.top;
    if (
      Math.abs(initialX) < 0.5 &&
      Math.abs(initialY) < 0.5 &&
      Math.abs(targetX) < 0.5 &&
      Math.abs(targetY) < 0.5
    ) {
      continue;
    }
    currentEntry.element.setAttribute(SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE, 'true');
    setSourceTreePreviewTemporaryInlineStyle(
      currentEntry.element,
      snapshots,
      'transition-property',
      'none',
    );
    setSourceTreePreviewTemporaryInlineStyle(
      currentEntry.element,
      snapshots,
      'translate',
      `${initialX}px ${initialY}px`,
    );
    projectedEntries.push({
      element: currentEntry.element,
      initialX,
      initialY,
      targetX,
      targetY,
    });
  }
  if (projectedEntries.length === 0) return () => {};

  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  const reduceMotion = ownerWindow.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Pin the target offset inline (so the row keeps its projected slot until
  // cleanup) and drive the initial→target glide with the Web Animations API.
  // CSS-transition-based interpolation here depended on frame scheduling and
  // on the transition engine seeing two separate committed style states,
  // which proved unreliable in the drag path (rows snapped to their target
  // slot); element.animate() is timeline-driven and has neither dependency.
  let cleaned = false;
  const animations: Animation[] = [];
  for (const entry of projectedEntries) {
    setSourceTreePreviewTemporaryInlineStyle(
      entry.element,
      snapshots,
      'transition-property',
      'none',
    );
    // Normal priority on purpose: an !important inline value outranks Web
    // Animations in the cascade and would mask the glide below.
    setSourceTreePreviewTemporaryInlineStyle(
      entry.element,
      snapshots,
      'translate',
      `${entry.targetX}px ${entry.targetY}px`,
      '',
    );
  }
  if (!reduceMotion) {
    for (const entry of projectedEntries) {
      try {
        animations.push(entry.element.animate(
          [
            { translate: `${entry.initialX}px ${entry.initialY}px` },
            { translate: `${entry.targetX}px ${entry.targetY}px` },
          ],
          {
            duration: SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_DURATION_MS,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            id: SOURCE_TREE_PREVIEW_FLIP_ANIMATION_ID,
          },
        ));
      } catch {
        // Older runtimes without WAAPI translate support skip the glide.
      }
    }
  }

  return () => {
    if (cleaned) return;
    cleaned = true;
    for (const animation of animations) animation.cancel();
    for (const entry of projectedEntries) {
      entry.element.removeAttribute(SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE);
    }
    restoreSourceTreePreviewTemporaryInlineStyles(snapshots);
  };
}

function getSourceTreePreviewDropFlowForChildGeometry(
  parentElement: HTMLElement | null,
  geometry: readonly SourceTreePreviewChildDropGeometry[],
): SourceTreePreviewDropFlow {
  const flowElement = getSourceTreePreviewDropFlowElementForChildGeometry(
    parentElement,
    geometry,
  );
  if (!flowElement) return { axis: 'vertical', reverse: false };
  const style = getSourceTreePreviewComputedStyle(flowElement);
  return inferSourceCanvasDropFlow({
    childRects: geometry.slice().sort((left, right) => left.index - right.index).map((entry) => entry.rect),
    display: style.display,
    flexDirection: style.flexDirection,
    gridAutoFlow: style.gridAutoFlow,
    textDirection: style.direction,
  });
}

function getSourceTreePreviewDropFlowElementForChildGeometry(
  parentElement: HTMLElement | null,
  geometry: readonly SourceTreePreviewChildDropGeometry[],
): HTMLElement | null {
  const elements = geometry.map((entry) => entry.element);
  let current = elements[0]?.parentElement ?? null;
  while (current) {
    const belongsToParent = !parentElement ||
      current === parentElement ||
      parentElement.contains(current);
    if (!belongsToParent) break;
    if (elements.every((element) => current!.contains(element))) {
      const display = getSourceTreePreviewComputedStyle(current).display;
      if (display.includes('flex') || display.includes('grid')) {
        return current;
      }
    }
    if (current === parentElement) break;
    current = current.parentElement;
  }
  return parentElement;
}

function getSourceTreePreviewDropFlowForParent(
  container: HTMLElement,
  parentNode: EditableTreeNode,
  ignoredNodeIds?: ReadonlySet<string>,
): SourceTreePreviewDropFlow {
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const geometry = getSourceTreePreviewChildDropGeometry(container, parentNode, ignoredNodeIds);
  return getSourceTreePreviewDropFlowForChildGeometry(parentElement, geometry);
}

function getSourceTreePreviewPaintOrderRank(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): number {
  const stack = element.ownerDocument.elementsFromPoint?.(clientX, clientY) ?? [];
  const rank = stack.findIndex((stackElement) => (
    stackElement === element || element.contains(stackElement)
  ));
  return rank < 0 ? Number.POSITIVE_INFINITY : rank;
}

function resolveSourceTreePreviewSiblingDropBoundary({
  clientX,
  clientY,
  container,
  ignoredNodeIds,
  parentNode,
  targetIndex,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  ignoredNodeIds?: ReadonlySet<string>;
  parentNode: EditableTreeNode;
  targetIndex: number;
}) {
  const geometry = getSourceTreePreviewChildDropGeometry(container, parentNode, ignoredNodeIds);
  const geometryIndex = geometry.findIndex((entry) => entry.index === targetIndex);
  const target = geometry[geometryIndex];
  if (!target) return null;
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const insertion = resolveSourceCanvasDropInsertion({
    clientX,
    clientY,
    fallbackFlow: getSourceTreePreviewDropFlowForChildGeometry(parentElement, geometry),
    nextRect: geometry[geometryIndex + 1]?.rect,
    previousRect: geometry[geometryIndex - 1]?.rect,
    siblingRects: geometry,
    targetIndex,
    targetRect: target.rect,
  });
  if (!insertion) return null;
  return {
    ...insertion,
    element: target.element,
    rect: target.rect,
  };
}

function getSourceTreePreviewNodeSubtreeIds(node: EditableTreeNode): Set<string> {
  const nodeIds = new Set<string>();
  const visit = (currentNode: EditableTreeNode) => {
    nodeIds.add(currentNode.id);
    for (const child of currentNode.children ?? []) visit(child);
    for (const child of currentNode.sourcePreviewChildren ?? []) visit(child);
  };
  visit(node);
  return nodeIds;
}

function resolveSourceTreePreviewMultiDragNodes({
  pointerNode,
  root,
  selectedLayerIds,
}: {
  pointerNode: EditableTreeNode;
  root: EditableTreeNode;
  selectedLayerIds: ReadonlySet<string>;
}): EditableTreeNode[] {
  if (selectedLayerIds.size <= 1) return [];
  const selectedNodes = Array.from(selectedLayerIds)
    .map((layerId) => findSourceTreePreviewLayerNode(root, layerId))
    .filter((node): node is EditableTreeNode => Boolean(node && node.id !== root.id));
  if (selectedNodes.length !== selectedLayerIds.size) return [];
  const pointerOwner = resolveSourceTreePreviewPointerMultiSelectedNode(pointerNode, selectedNodes);
  if (!pointerOwner) return [];

  const parentNode = findEditableTreeParent(root, pointerOwner.id);
  if (!parentNode || selectedNodes.some((node) => findEditableTreeParent(root, node.id)?.id !== parentNode.id)) {
    return selectedNodes;
  }
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
  const orderedNodes = getSourceTreePreviewLayerChildren(parentNode)
    .filter((node) => selectedNodeIds.has(node.id));
  return orderedNodes.length === selectedNodes.length ? orderedNodes : selectedNodes;
}

function resolveSourceTreePreviewPointerMultiSelectedNode(
  pointerNode: EditableTreeNode | null,
  selectedNodes: readonly EditableTreeNode[],
): EditableTreeNode | null {
  if (!pointerNode || selectedNodes.length <= 1) return null;
  let pointerOwner: EditableTreeNode | null = null;
  for (const selectedNode of selectedNodes) {
    if (!getSourceTreePreviewNodeSubtreeIds(selectedNode).has(pointerNode.id)) continue;
    if (
      !pointerOwner ||
      getSourceTreePreviewNodeSubtreeIds(pointerOwner).has(selectedNode.id)
    ) {
      pointerOwner = selectedNode;
    }
  }
  return pointerOwner;
}

function shouldSourceTreePreviewPointerDescendantOwnDrag({
  pointerNode,
  root,
  selectedNode,
  selectedSubtreeNodeIds,
}: {
  pointerNode: EditableTreeNode;
  root: EditableTreeNode;
  selectedNode: EditableTreeNode;
  selectedSubtreeNodeIds: ReadonlySet<string>;
}): boolean {
  if (
    pointerNode.kind === 'text' ||
    !selectedSubtreeNodeIds.has(pointerNode.id) ||
    pointerNode.sourcePreviewOrigin === 'forwarded-source-child' ||
    isEditableTreeSourcePreviewOnlyNode(root, pointerNode.id)
  ) {
    return false;
  }
  const selectedSourceFile = selectedNode.source?.sourceFile;
  return Boolean(
    selectedSourceFile &&
    pointerNode.source?.sourceFile === selectedSourceFile &&
    pointerNode.sourceLocation
  );
}

type SourceTreePreviewCanvasDropResolveOptions = {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  ignoredNodeIds: ReadonlySet<string>;
  lockedParentId?: string | null;
  root: EditableTreeNode;
};

function isSourceTreePreviewPortalConstrainedDrag(
  container: HTMLElement,
  draggedNode: EditableTreeNode,
): boolean {
  return getSourceTreePreviewNodeDragElements(container, draggedNode).some((element) => (
    Boolean(getSourceTreePreviewTopLayerSelectionHost(element, container)) ||
    Boolean(getSourceTreePreviewRuntimeOverlayVisualHost(element, container)) ||
    Boolean(getSourceTreePreviewControlledSurfaceHost(element, container))
  ));
}

/** Dev-only record of the last drop decision, for the gesture harness and
    manual triage: which node the gesture is actually moving and where the
    resolver decided it goes. Grid/reparent confusion is almost always "the
    press grabbed a node deeper than the cell", which is invisible otherwise. */
const SOURCE_TREE_PREVIEW_LAST_DROP_DECISION: {
  draggedNodeId: string | null;
  dragStart: { layerId: string; selectedNodeId: string; stack: string } | null;
  parentId: string | null;
  index: number | null;
  operation: string | null;
  gridActiveIndex: number | null;
} = {
  draggedNodeId: null,
  dragStart: null,
  parentId: null,
  index: null,
  operation: null,
  gridActiveIndex: null,
};

function resolveSourceTreePreviewCanvasDropTarget(
  options: SourceTreePreviewCanvasDropResolveOptions,
): SourceTreePreviewDropTarget | null {
  const target = resolveSourceTreePreviewCanvasDropCandidate(options);
  if (import.meta.env.DEV) {
    SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.draggedNodeId = options.draggedNode.id;
    SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.parentId = target?.parentId ?? null;
    SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.index = target?.index ?? null;
    SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.operation = target?.operation ?? null;
    SOURCE_TREE_PREVIEW_LAST_DROP_DECISION.gridActiveIndex = target?.gridSlots?.activeIndex ?? null;
  }
  if (
    !target ||
    (options.lockedParentId && target.parentId !== options.lockedParentId) ||
    isSourceTreePreviewNoopDropTarget(options.root, options.draggedNode, target)
  ) {
    return null;
  }
  const currentParent = findEditableTreeParent(options.root, options.draggedNode.id);
  const operation: NonNullable<SourceTreePreviewDropTarget['operation']> = target.intent === 'outdent'
    ? 'outdent'
    : target.parentId === currentParent?.id
      ? 'reorder'
      : 'reparent';
  return {
    ...target,
    operation,
    // A source parent with no direct rendered child anchor can yield an
    // `inside` box even though this is only a same-parent reorder. Show its
    // actual outer insertion edge instead of implying a reparent operation.
    position: operation === 'reorder' && target.position === 'inside' && !target.gridSlots
      ? (target.index === 0 ? 'before' : 'after')
      : target.position,
  };
}

function isSourceTreePreviewNoopDropTarget(
  root: EditableTreeNode,
  draggedNode: EditableTreeNode,
  target: SourceTreePreviewDropTarget | null,
): boolean {
  if (!target) return false;
  const currentParent = findEditableTreeParent(root, draggedNode.id);
  if (!currentParent || target.parentId !== currentParent.id) return false;
  const siblings = getSourceTreePreviewLayerChildren(currentParent);
  const currentIndex = siblings.findIndex((child) => child.id === draggedNode.id);
  return isSourceCanvasNoopReorder({
    currentIndex,
    siblingCount: siblings.length,
    targetIndex: target.index,
  });
}

function resolveSourceTreePreviewCanvasDropCandidate({
  clientX,
  clientY,
  container,
  draggedNode,
  ignoredNodeIds,
  lockedParentId,
  root,
}: SourceTreePreviewCanvasDropResolveOptions): SourceTreePreviewDropTarget | null {
  const draggedParentNode = findEditableTreeParent(root, draggedNode.id);
  const draggedParentSubtreeIds = draggedParentNode
    ? getSourceTreePreviewNodeSubtreeIds(draggedParentNode)
    : new Set<string>();
  const currentParentScopeTarget = resolveSourceTreePreviewDraggedParentDropTarget({
    clientX,
    clientY,
    container,
    draggedNode,
    ignoredNodeIds,
    root,
  });
  const portalConstrainedDrag = Boolean(
    lockedParentId ||
    isSourceTreePreviewPortalConstrainedDrag(container, draggedNode),
  );
  // The current visual parent owns its usable interior first. This is the
  // common rule for SideNav, ScrollArea, carousel, grid, and plain div alike:
  // sibling movement remains local until the pointer actually leaves that
  // parent's rendered bounds. Only then may another branch or ancestor win.
  if (currentParentScopeTarget) return currentParentScopeTarget;
  // Source nodes projected into a portal/top-layer surface are locally
  // editable, but they do not participate in the canvas hierarchy behind that
  // surface. Keep their drag inside the current source parent so a menu row,
  // nested selector, or dialog action can never escape into a card/app shell
  // merely because those ancestors occupy the same screen coordinates.
  if (portalConstrainedDrag) return null;
  const nearestExternalParentScopeTarget = resolveSourceTreePreviewNearestExternalParentScopeDropTarget({
    clientX,
    clientY,
    container,
    draggedNode,
    draggedParentSubtreeIds,
    ignoredNodeIds,
    root,
  });
  // After leaving the origin branch, use the deepest editable destination
  // parent under the pointer. This makes ScrollArea-to-ScrollArea and
  // container-to-container moves land in the destination container instead of
  // being captured by a wider section or app-shell boundary behind it.
  if (nearestExternalParentScopeTarget) return nearestExternalParentScopeTarget;
  const nearestAncestorScopeTarget = resolveSourceTreePreviewNearestAncestorScopeDropTarget({
    clientX,
    clientY,
    container,
    draggedNode,
    ignoredNodeIds,
    root,
  });
  // Structural proximity wins over paint order. The current parent still owns
  // its sibling slots, but after leaving it a deeper external branch gets the
  // first chance above. Only empty space then falls back through the origin's
  // grandparent and outer ancestors.
  if (nearestAncestorScopeTarget) return nearestAncestorScopeTarget;
  const targetElement = getSourceTreePreviewStructuralDropHitElement(
    container,
    clientX,
    clientY,
    ignoredNodeIds,
  );
  const targetNodeId = targetElement ? getSourceTreePreviewElementNodeId(targetElement) : null;
  const draggedAncestorIds = new Set<string>();
  let draggedAncestorNode = draggedParentNode;
  while (draggedAncestorNode) {
    draggedAncestorIds.add(draggedAncestorNode.id);
    draggedAncestorNode = findEditableTreeParent(root, draggedAncestorNode.id);
  }
  const hitIsExternalBranch = Boolean(
    targetNodeId &&
    !draggedParentSubtreeIds.has(targetNodeId) &&
    !draggedAncestorIds.has(targetNodeId),
  );
  const ancestorExitTarget = hitIsExternalBranch
    ? null
    : resolveSourceTreePreviewAncestorExitDropTarget({
        clientX,
        clientY,
        container,
        draggedNode,
        root,
      });
  if (ancestorExitTarget) return ancestorExitTarget;
  const resolveAncestorInnerEdgeTarget = () => resolveSourceTreePreviewAncestorInnerEdgeDropTarget({
    clientX,
    clientY,
    container,
    draggedNode,
    ignoredNodeIds,
    root,
  });
  if (!targetElement || !targetNodeId || ignoredNodeIds.has(targetNodeId)) {
    return resolveAncestorInnerEdgeTarget() ?? resolveSourceTreePreviewDraggedParentDropTarget({
      clientX,
      clientY,
      container,
      draggedNode,
      ignoredNodeIds,
      root,
    });
  }
  const targetNode = findSourceTreePreviewLayerNode(root, targetNodeId);
  if (!targetNode) {
    return resolveAncestorInnerEdgeTarget() ?? resolveSourceTreePreviewDraggedParentDropTarget({
      clientX,
      clientY,
      container,
      draggedNode,
      ignoredNodeIds,
      root,
    });
  }

  const targetParentNode = findEditableTreeParent(root, targetNodeId);
  const targetParentElement = targetParentNode ? getPreviewNodePrimaryElement(container, targetParentNode.id) : null;
  const targetRect = getSourceTreePreviewDropDecisionVisualRect(targetElement);
  if (!targetRect) return null;
  const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(targetElement, container);
  const overlayContainer = topLayerHost ?? container;
  const targetOverlayRect = toSourceTreePreviewOverlayRect(topLayerHost ?? container, targetRect);
  const targetParentScopeRect = targetParentNode
    ? getSourceTreePreviewDropScopeRect(container, targetParentNode, overlayContainer)
    : null;
  const parentFlow = targetParentNode
    ? getSourceTreePreviewDropFlowForParent(container, targetParentNode, ignoredNodeIds)
    : getSourceTreePreviewDropFlow(targetParentElement);
  const targetIndex = targetParentNode
    ? getSourceTreePreviewLayerChildren(targetParentNode).findIndex((child) => child.id === targetNodeId)
    : -1;
  const siblingBoundary = targetParentNode && targetIndex >= 0
    ? resolveSourceTreePreviewSiblingDropBoundary({
        clientX,
        clientY,
        container,
        ignoredNodeIds,
        parentNode: targetParentNode,
        targetIndex,
      })
    : null;
  const offset = getSourceTreePreviewFlowOffset(parentFlow, targetRect, clientX, clientY);
  const boundaryAxis = siblingBoundary?.axis ?? parentFlow.axis;
  const dimension = boundaryAxis === 'horizontal' ? targetRect.width : targetRect.height;
  const canDropIntoTarget = canMoveSourceNodeIntoParent(draggedNode, targetNode);
  const sameParentReorder = Boolean(draggedParentNode && targetParentNode && draggedParentNode.id === targetParentNode.id);
  const canDropBesideTarget = Boolean(
    targetParentNode && (sameParentReorder || canMoveSourceNodeIntoParent(draggedNode, targetParentNode)),
  );
  const visualSide = siblingBoundary
    ? (siblingBoundary.position === 'after' ? 'end' : 'start')
    : getSourceTreePreviewVisualSide(offset, dimension);
  const boundaryDistance = siblingBoundary?.boundaryDistance ?? (visualSide === 'start'
    ? Math.max(0, offset)
    : Math.max(0, dimension - offset));
  const prefersInsideTarget = canDropIntoTarget && getSourceTreePreviewLayerChildren(targetNode).length === 0;
  const targetBoundaryActivationSize = getSourceCanvasDropBoundaryActivationSize({
    dimension,
    flow: parentFlow,
    prefersInside: prefersInsideTarget,
    sameParentReorder,
  });

  // Reordering siblings is the most local boundary intent. In particular,
  // node1 dragged to node3's end must resolve after node3 inside their shared
  // parent, even when that edge also coincides with the parent's outer edge.
  if (
    sameParentReorder &&
    canDropBesideTarget &&
    boundaryDistance <= targetBoundaryActivationSize &&
    targetParentNode
  ) {
    if (targetIndex >= 0) {
      return {
        axis: siblingBoundary?.axis ?? parentFlow.axis,
        index: siblingBoundary?.index ??
          getSourceTreePreviewInsertIndexForVisualSide(targetIndex, visualSide, parentFlow),
        intent: 'inside',
        parentId: targetParentNode.id,
        position: siblingBoundary?.position ?? (visualSide === 'end' ? 'after' : 'before'),
        rect: siblingBoundary
          ? toSourceTreePreviewOverlayRect(overlayContainer, siblingBoundary.rect)
          : targetOverlayRect,
        scopeLabel: targetParentNode.label,
        scopeRect: targetParentScopeRect ?? undefined,
        topLayerHost,
      };
    }
  }

  // The deepest DOM hit is often a text leaf even when the user is aiming at
  // its owning paragraph/card edge. Resolve reachable sibling ancestors before
  // treating that deepest hit as an inside container. This is essential for
  // DOM-less wrappers such as DropdownMenu: its rendered trigger button is the
  // hit, but the wrapper is the sibling that must move beside another button.
  const ancestorBoundaryTarget = resolveSourceTreePreviewAncestorBoundaryDropTarget({
    clientX,
    clientY,
    container,
    draggedNode,
    root,
    targetNode,
  });
  if (ancestorBoundaryTarget) return ancestorBoundaryTarget;

  // Once sibling-boundary intent has been ruled out, the body of any valid
  // container is an inside target. That includes a childless container body.
  if (canDropIntoTarget) {
    return resolveSourceTreePreviewInsideDropTarget({
      clientX,
      clientY,
      container,
      parentNode: targetNode,
      parentRect: targetOverlayRect,
      ignoredNodeIds,
      topLayerHost,
    });
  }

  if (!targetParentNode || !canDropBesideTarget) {
    if (!canDropIntoTarget) return null;
    return resolveSourceTreePreviewInsideDropTarget({
      clientX,
      clientY,
      container,
      parentNode: targetNode,
      parentRect: targetOverlayRect,
      ignoredNodeIds,
      topLayerHost,
    });
  }

  if (targetIndex < 0) return resolveAncestorInnerEdgeTarget();
  return {
    axis: siblingBoundary?.axis ?? parentFlow.axis,
    index: siblingBoundary?.index ??
      getSourceTreePreviewInsertIndexForVisualSide(targetIndex, visualSide, parentFlow),
    intent: 'inside',
    parentId: targetParentNode.id,
    position: siblingBoundary?.position ?? (visualSide === 'end' ? 'after' : 'before'),
    rect: siblingBoundary
      ? toSourceTreePreviewOverlayRect(overlayContainer, siblingBoundary.rect)
      : targetOverlayRect,
    scopeLabel: targetParentNode.label,
    scopeRect: targetParentScopeRect ?? undefined,
    topLayerHost,
  };
}

function resolveSourceTreePreviewNearestAncestorScopeDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  ignoredNodeIds,
  root,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  ignoredNodeIds: ReadonlySet<string>;
  root: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  const currentParentNode = findEditableTreeParent(root, draggedNode.id);
  let scopeNode = currentParentNode;

  while (scopeNode && scopeNode.id !== root.id) {
    const scopeElement = getPreviewNodePrimaryElement(container, scopeNode.id);
    const scopeRect = scopeElement
      ? getSourceTreePreviewDropDecisionVisualRect(scopeElement)
      : null;
    const pointerInsideScope = Boolean(
      scopeElement &&
      scopeRect &&
      clientX >= scopeRect.left &&
      clientX <= scopeRect.right &&
      clientY >= scopeRect.top &&
      clientY <= scopeRect.bottom
    );
    const canAddressScope = scopeNode.id === currentParentNode?.id ||
      canMoveSourceNodeIntoParent(draggedNode, scopeNode);

    if (pointerInsideScope && canAddressScope && scopeElement && scopeRect) {
      const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(scopeElement, container);
      return resolveSourceTreePreviewInsideDropTarget({
        clientX,
        clientY,
        container,
        parentNode: scopeNode,
        parentRect: toSourceTreePreviewOverlayRect(topLayerHost ?? container, scopeRect),
        ignoredNodeIds,
        topLayerHost,
      });
    }

    scopeNode = findEditableTreeParent(root, scopeNode.id);
  }

  return null;
}

function resolveSourceTreePreviewNearestExternalParentScopeDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  draggedParentSubtreeIds,
  ignoredNodeIds,
  root,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  draggedParentSubtreeIds: ReadonlySet<string>;
  ignoredNodeIds: ReadonlySet<string>;
  root: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  const draggedAncestorIds = new Set<string>();
  let draggedAncestorNode = findEditableTreeParent(root, draggedNode.id);
  while (draggedAncestorNode) {
    draggedAncestorIds.add(draggedAncestorNode.id);
    draggedAncestorNode = findEditableTreeParent(root, draggedAncestorNode.id);
  }

  const pointCandidates = getSourceTreePreviewPointHitCandidates(
    Array.from(container.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)),
    clientX,
    clientY,
    getSourceTreePreviewOwnHitRects,
    container,
  )
    .flatMap((candidate) => {
      const nodeId = getSourceTreePreviewElementNodeId(candidate.element);
      const node = nodeId ? findSourceTreePreviewLayerNode(root, nodeId) : null;
      if (
        !nodeId ||
        !node ||
        node.id === root.id ||
        ignoredNodeIds.has(nodeId) ||
        draggedParentSubtreeIds.has(nodeId) ||
        draggedAncestorIds.has(nodeId) ||
        isEditableTreeSourcePreviewOnlyNode(root, nodeId) ||
        !canMoveSourceNodeIntoParent(draggedNode, node)
      ) {
        return [];
      }
      return [{
        ...candidate,
        area: candidate.rect.width * candidate.rect.height,
        node,
      }];
    })
    .sort((left, right) => (
      right.depth - left.depth ||
      left.area - right.area
    ));

  const visitedNodeIds = new Set<string>();
  for (const candidate of pointCandidates) {
    if (visitedNodeIds.has(candidate.node.id)) continue;
    visitedNodeIds.add(candidate.node.id);
    const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(candidate.element, container);
    const target = resolveSourceTreePreviewInsideDropTarget({
      clientX,
      clientY,
      container,
      parentNode: candidate.node,
      parentRect: toSourceTreePreviewOverlayRect(
        topLayerHost ?? container,
        candidate.rect,
      ),
      ignoredNodeIds,
      topLayerHost,
    });
    if (target) return target;
  }

  return null;
}

function resolveSourceTreePreviewAncestorInnerEdgeDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  ignoredNodeIds,
  root,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  ignoredNodeIds: ReadonlySet<string>;
  root: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  const parentNode = findEditableTreeParent(root, draggedNode.id);
  if (!parentNode) return null;
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const parentRect = parentElement ? getSourceTreePreviewDropDecisionVisualRect(parentElement) : null;
  if (!parentElement || !parentRect) return null;

  const parentFlow = getSourceTreePreviewDropFlowForParent(container, parentNode, ignoredNodeIds);
  const flowOffset = getSourceTreePreviewFlowOffset(parentFlow, parentRect, clientX, clientY);
  const flowDimension = getSourceTreePreviewFlowDimension(parentFlow, parentRect);
  if (
    flowOffset < -SOURCE_TREE_PREVIEW_OUTDENT_TRIGGER_PX ||
    flowOffset > flowDimension + SOURCE_TREE_PREVIEW_OUTDENT_TRIGGER_PX
  ) return null;
  const crossAxisInside = parentFlow.axis === 'horizontal'
    ? clientY >= parentRect.top && clientY <= parentRect.bottom
    : clientX >= parentRect.left && clientX <= parentRect.right;
  if (!crossAxisInside) return null;

  const clampedFlowOffset = Math.max(0, Math.min(flowDimension, flowOffset));
  const startDistance = clampedFlowOffset;
  const endDistance = flowDimension - clampedFlowOffset;
  const activationSize = getSourceTreePreviewVirtualBoundarySnapSize(flowDimension);
  if (Math.min(startDistance, endDistance) > activationSize) return null;

  const visualSide: 'end' | 'start' = startDistance <= endDistance ? 'start' : 'end';
  const children = getSourceTreePreviewLayerChildren(parentNode);
  const insertIndex = parentFlow.reverse
    ? (visualSide === 'start' ? children.length : 0)
    : (visualSide === 'start' ? 0 : children.length);
  const childRects = children.flatMap((child) => {
    if (ignoredNodeIds.has(child.id)) return [];
    const childElements = getSourceTreePreviewNodeDragElements(container, child);
    const childElement = childElements[0] ?? null;
    const childRect = getSourceTreePreviewVisualBounds(container, childElements);
    return childElement && childRect
      ? [{ element: childElement, rect: childRect, start: getSourceTreePreviewFlowStart(parentFlow, childRect) }]
      : [];
  }).sort((left, right) => left.start - right.start);
  const anchor = visualSide === 'start' ? childRects[0] : childRects[childRects.length - 1];
  const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(anchor?.element ?? parentElement, container);
  const indicatorRect = anchor?.rect ?? parentRect;
  const overlayContainer = topLayerHost ?? container;
  const parentOverlayRect = toSourceTreePreviewOverlayRect(overlayContainer, parentRect);

  return {
    axis: parentFlow.axis,
    index: insertIndex,
    intent: 'inside',
    parentId: parentNode.id,
    position: anchor ? (visualSide === 'end' ? 'after' : 'before') : 'inside',
    rect: toSourceTreePreviewOverlayRect(overlayContainer, indicatorRect),
    scopeLabel: parentNode.label,
    scopeRect: parentOverlayRect,
    topLayerHost,
  };
}

function resolveSourceTreePreviewAncestorExitDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  root,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  root: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  let ancestorNode = findEditableTreeParent(root, draggedNode.id);

  while (ancestorNode && ancestorNode.id !== root.id) {
    const outerParentNode = findEditableTreeParent(root, ancestorNode.id);
    if (!outerParentNode) return null;
    const ancestorElements = getSourceTreePreviewNodeDragElements(container, ancestorNode);
    const ancestorElement = ancestorElements[0] ?? null;
    const ancestorRect = getSourceTreePreviewVisualBounds(container, ancestorElements);
    const outerFlow = getSourceTreePreviewDropFlowForParent(container, outerParentNode);

    if (ancestorElement && ancestorRect && canMoveSourceNodeIntoParent(draggedNode, outerParentNode)) {
      const flowOffset = getSourceTreePreviewFlowOffset(outerFlow, ancestorRect, clientX, clientY);
      const flowDimension = getSourceTreePreviewFlowDimension(outerFlow, ancestorRect);
      const outsideStart = flowOffset < 0;
      const outsideEnd = flowOffset > flowDimension;

      // Inside the nearest ancestor rect means the user is still addressing
      // one of its child slots. Only crossing that rect creates an outdent
      // zone, so node3's inside edge and the ancestor's outside edge no longer
      // collapse into the same drop result.
      if (!outsideStart && !outsideEnd) return null;

      const boundaryDistance = outsideStart ? -flowOffset : flowOffset - flowDimension;
      // Keep a forgiving inside zone across the rendered edge. Outdent only
      // becomes active after the pointer deliberately crosses the threshold;
      // this is a spatial hysteresis band, not a one-pixel border decision.
      if (boundaryDistance <= SOURCE_TREE_PREVIEW_OUTDENT_TRIGGER_PX) return null;
      const activationSize = SOURCE_TREE_PREVIEW_OUTDENT_ACTIVATION_PX;
      const crossAxisInside = outerFlow.axis === 'horizontal'
        ? clientY >= ancestorRect.top - activationSize && clientY <= ancestorRect.bottom + activationSize
        : clientX >= ancestorRect.left - activationSize && clientX <= ancestorRect.right + activationSize;
      const ancestorIndex = getSourceTreePreviewLayerChildren(outerParentNode)
        .findIndex((child) => child.id === ancestorNode!.id);

      if (crossAxisInside && boundaryDistance <= activationSize && ancestorIndex >= 0) {
        const visualSide = outsideStart ? 'start' : 'end';
        const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(ancestorElement, container);
        const overlayContainer = topLayerHost ?? container;
        return {
          axis: outerFlow.axis,
          index: getSourceTreePreviewInsertIndexForVisualSide(ancestorIndex, visualSide, outerFlow),
          intent: 'outdent',
          parentId: outerParentNode.id,
          position: visualSide === 'end' ? 'after' : 'before',
          rect: toSourceTreePreviewOverlayRect(overlayContainer, ancestorRect),
          scopeLabel: ancestorNode.label,
          scopeRect: toSourceTreePreviewOverlayRect(overlayContainer, ancestorRect),
          topLayerHost,
        };
      }
    }

    ancestorNode = outerParentNode;
  }

  return null;
}

function resolveSourceTreePreviewAncestorBoundaryDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  root,
  targetNode,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  root: EditableTreeNode;
  targetNode: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  const draggedParentNode = findEditableTreeParent(root, draggedNode.id);
  const ignoredNodeIds = getSourceTreePreviewNodeSubtreeIds(draggedNode);
  const candidates: Array<{
    distance: number;
    level: number;
    sameParentReorder: boolean;
    target: SourceTreePreviewDropTarget;
  }> = [];
  let candidateNode: EditableTreeNode | null = targetNode;
  let level = 0;

  while (candidateNode && candidateNode.id !== root.id) {
    const candidateParentNode = findEditableTreeParent(root, candidateNode.id);
    if (!candidateParentNode) break;
    const candidateIndex = getSourceTreePreviewLayerChildren(candidateParentNode)
      .findIndex((child) => child.id === candidateNode!.id);
    const sameParentReorder = Boolean(draggedParentNode && draggedParentNode.id === candidateParentNode.id);
    const canDropBesideCandidate = candidateIndex >= 0 && (
      sameParentReorder || canMoveSourceNodeIntoParent(draggedNode, candidateParentNode)
    );
    const candidateElements = canDropBesideCandidate
      ? getSourceTreePreviewNodeDragElements(container, candidateNode)
      : [];
    const candidateElement = candidateElements[0] ?? null;
    const candidateRect = getSourceTreePreviewVisualBounds(container, candidateElements);

    if (candidateElement && candidateRect) {
      const candidateFlow = getSourceTreePreviewDropFlowForParent(
        container,
        candidateParentNode,
        ignoredNodeIds,
      );
      const siblingBoundary = resolveSourceTreePreviewSiblingDropBoundary({
        clientX,
        clientY,
        container,
        ignoredNodeIds,
        parentNode: candidateParentNode,
        targetIndex: candidateIndex,
      });
      const boundaryAxis = siblingBoundary?.axis ?? candidateFlow.axis;
      const candidateDimension = boundaryAxis === 'horizontal' ? candidateRect.width : candidateRect.height;
      const candidateOffset = getSourceTreePreviewFlowOffset(
        { axis: boundaryAxis, reverse: false },
        candidateRect,
        clientX,
        clientY,
      );
      const visualSide = siblingBoundary
        ? (siblingBoundary.position === 'after' ? 'end' : 'start')
        : getSourceTreePreviewVisualSide(candidateOffset, candidateDimension);
      const boundaryDistance = siblingBoundary?.boundaryDistance ?? (visualSide === 'start'
        ? Math.max(0, candidateOffset)
        : Math.max(0, candidateDimension - candidateOffset));
      const prefersInside = canMoveSourceNodeIntoParent(draggedNode, candidateNode) &&
        getSourceTreePreviewLayerChildren(candidateNode).length === 0;
      const activationSize = getSourceCanvasDropBoundaryActivationSize({
        dimension: candidateDimension,
        flow: candidateFlow,
        prefersInside,
        sameParentReorder,
      });
      const pointerInsideCandidate = (
        clientX >= candidateRect.left &&
        clientX <= candidateRect.right &&
        clientY >= candidateRect.top &&
        clientY <= candidateRect.bottom
      );

      if (pointerInsideCandidate && boundaryDistance <= activationSize) {
        const boundaryElement = siblingBoundary?.element ?? candidateElement;
        const boundaryRect = siblingBoundary?.rect ?? candidateRect;
        const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(boundaryElement, container);
        const overlayContainer = topLayerHost ?? container;
        candidates.push({
          distance: boundaryDistance,
          level,
          sameParentReorder,
          target: {
            axis: siblingBoundary?.axis ?? candidateFlow.axis,
            index: siblingBoundary?.index ??
              getSourceTreePreviewInsertIndexForVisualSide(candidateIndex, visualSide, candidateFlow),
            intent: 'inside',
            parentId: candidateParentNode.id,
            position: siblingBoundary?.position ?? (visualSide === 'end' ? 'after' : 'before'),
            rect: toSourceTreePreviewOverlayRect(overlayContainer, boundaryRect),
            scopeLabel: candidateParentNode.label,
            scopeRect: getSourceTreePreviewDropScopeRect(
              container,
              candidateParentNode,
              overlayContainer,
            ) ?? undefined,
            topLayerHost,
          },
        });
      }
    }

    candidateNode = candidateParentNode;
    level += 1;
  }

  candidates.sort((left, right) => (
    Number(right.sameParentReorder) - Number(left.sameParentReorder) ||
    // Once the pointer enters another branch, preserve that branch's nearest
    // editable parent before considering its outer ancestors. A visually
    // closer section edge must not beat the card's ScrollArea parent.
    left.level - right.level ||
    left.distance - right.distance
  ));
  return candidates[0]?.target ?? null;
}

function getSourceTreePreviewVirtualBoundarySnapSize(dimension: number): number {
  if (!Number.isFinite(dimension) || dimension <= 0) return 0;
  return Math.min(
    Math.max(SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MIN_PX, dimension * 0.08),
    SOURCE_TREE_PREVIEW_BOUNDARY_SNAP_MAX_PX,
    dimension / 2,
  );
}

function resolveSourceTreePreviewDraggedParentDropTarget({
  clientX,
  clientY,
  container,
  draggedNode,
  ignoredNodeIds,
  root,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  draggedNode: EditableTreeNode;
  ignoredNodeIds: ReadonlySet<string>;
  root: EditableTreeNode;
}): SourceTreePreviewDropTarget | null {
  const parentNode = findEditableTreeParent(root, draggedNode.id);
  if (!parentNode) return null;
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const parentRect = parentElement ? getSourceTreePreviewDropDecisionVisualRect(parentElement) : null;
  // A source parent and its rendered children need not share a DOM parent.
  // Portals, slots, and compound render props can project authored siblings
  // into a top-layer root while the parent's primary element remains a trigger
  // or has no rendered element. All authored children therefore define the
  // current source-parent scope; only insertion geometry excludes the dragged
  // subtree.
  const scopeChildGeometry = getSourceTreePreviewLogicalChildDropGeometry(
    container,
    parentNode,
  );
  const childGeometry = getSourceTreePreviewLogicalChildDropGeometry(
    container,
    parentNode,
    ignoredNodeIds,
  );
  const pointerChild = childGeometry.find(({ rect }) => (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  ));
  const pointerScopeChild = pointerChild ?? scopeChildGeometry.find(({ rect }) => (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  ));
  const siblingScopeRect = getSourceTreePreviewVisualBounds(
    container,
    scopeChildGeometry.map((entry) => entry.element),
  );
  const pointerInsideParent = parentRect
    ? (
        clientX >= parentRect.left &&
        clientX <= parentRect.right &&
        clientY >= parentRect.top &&
        clientY <= parentRect.bottom
      )
    : false;
  if (!pointerInsideParent && !pointerChild) return null;
  const visualScopeRect = pointerInsideParent
    ? parentRect
    : siblingScopeRect;
  if (!visualScopeRect) return null;
  const visualHostElement = pointerScopeChild?.element ??
    scopeChildGeometry[0]?.element ??
    parentElement;
  if (!visualHostElement) return null;
  const topLayerHost = getSourceTreePreviewControlledSurfaceHost(visualHostElement, container) ??
    getSourceTreePreviewNativeTopLayerHost(visualHostElement) ??
    getSourceTreePreviewRuntimeOverlayVisualHost(visualHostElement, container) ??
    getSourceTreePreviewTopLayerSelectionHost(visualHostElement, container);
  return resolveSourceTreePreviewInsideDropTarget({
    childGeometry,
    clientX,
    clientY,
    container,
    parentNode,
    parentRect: toSourceTreePreviewOverlayRect(topLayerHost ?? container, visualScopeRect),
    ignoredNodeIds,
    topLayerHost,
  });
}

function resolveSourceTreePreviewInsideDropTarget({
  childGeometry: providedChildGeometry,
  clientX,
  clientY,
  container,
  ignoredNodeIds,
  parentNode,
  parentRect,
  topLayerHost = null,
}: {
  childGeometry?: SourceTreePreviewChildDropGeometry[];
  clientX: number;
  clientY: number;
  container: HTMLElement;
  ignoredNodeIds?: ReadonlySet<string>;
  parentNode: EditableTreeNode;
  parentRect: SourceTreePreviewOverlayRect;
  topLayerHost?: HTMLElement | null;
}): SourceTreePreviewDropTarget | null {
  // A wrapping two-dimensional container is addressed by slot instead of by
  // sibling edge; see resolveSourceTreePreviewGridSlotDropTarget.
  const gridSlotTarget = resolveSourceTreePreviewGridSlotDropTarget({
    clientX,
    clientY,
    container,
    ignoredNodeIds,
    parentNode,
    parentRect,
    topLayerHost,
  });
  if (gridSlotTarget) return gridSlotTarget;
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const children = getSourceTreePreviewLayerChildren(parentNode);
  const rawChildGeometry = providedChildGeometry ??
    getSourceTreePreviewChildDropGeometry(container, parentNode, ignoredNodeIds);
  const parentFlow = getSourceTreePreviewDropFlowForChildGeometry(parentElement, rawChildGeometry);
  let insertIndex = children.length;
  let indicatorRect = parentRect;
  let position: SourceTreePreviewDropTarget['position'] = 'inside';
  let axis = parentFlow.axis;

  const childGeometry = rawChildGeometry
    .map((entry) => ({
      ...entry,
      distance: getSourceCanvasPointToRectDistanceSquared(entry.rect, clientX, clientY),
      paintRank: getSourceTreePreviewPaintOrderRank(entry.element, clientX, clientY),
    }))
    .sort((left, right) => (
      left.distance - right.distance ||
      left.paintRank - right.paintRank ||
      (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height)
    ));
  const unignoredChildren = children.filter((child) => !ignoredNodeIds?.has(child.id));
  if (unignoredChildren.length > 0 && childGeometry.length === 0) return null;
  const nearestChild = childGeometry[0];
  if (nearestChild) {
    const sourceOrderedGeometry = childGeometry.slice().sort((left, right) => left.index - right.index);
    const geometryIndex = sourceOrderedGeometry.findIndex((entry) => entry.index === nearestChild.index);
    const insertion = resolveSourceCanvasDropInsertion({
      clientX,
      clientY,
      fallbackFlow: parentFlow,
      nextRect: sourceOrderedGeometry[geometryIndex + 1]?.rect,
      previousRect: sourceOrderedGeometry[geometryIndex - 1]?.rect,
      siblingRects: sourceOrderedGeometry,
      targetIndex: nearestChild.index,
      targetRect: nearestChild.rect,
    });
    if (!insertion) return null;
    axis = insertion.axis;
    insertIndex = insertion.index;
    indicatorRect = toSourceTreePreviewOverlayRect(topLayerHost ?? container, nearestChild.rect);
    position = insertion.position;
  }

  return {
    axis,
    index: insertIndex,
    intent: 'inside',
    parentId: parentNode.id,
    position,
    rect: indicatorRect,
    scopeLabel: parentNode.label,
    scopeRect: parentRect,
    topLayerHost,
  };
}

/**
 * Slot geometry for a container whose children wrap into rows AND columns.
 *
 * Edge-sector insertion cannot describe such a container: "after the card to my
 * left" and "before the card below me" are the same source index, so the result
 * depended on which card was addressed and on how many columns the current
 * width produced. Slots remove that entirely — every authored child owns one
 * slot, plus one trailing slot for appending.
 */
function getSourceTreePreviewGridSlotGeometry(
  container: HTMLElement,
  parentNode: EditableTreeNode,
): { rects: DOMRect[]; slotCount: number } | null {
  const geometry = getSourceTreePreviewChildDropGeometry(container, parentNode)
    .slice()
    .sort((left, right) => left.index - right.index);
  if (geometry.length < 3) return null;
  const rects = geometry.map(({ rect }) => rect);
  if (!isSourceCanvasTwoDimensionalLayout(rects)) return null;
  // Trailing append slot: next cell in flow after the last child, wrapping to
  // the first column of a new row when the row is full.
  const last = rects[rects.length - 1]!;
  const parentElement = getPreviewNodePrimaryElement(container, parentNode.id);
  const parentRect = parentElement ? getSourceTreePreviewDropDecisionVisualRect(parentElement) : null;
  const gap = rects.length > 1
    ? Math.max(0, Math.min(...rects.slice(1).map((rect, index) => {
      const previous = rects[index]!;
      return rect.left > previous.right ? rect.left - previous.right : Number.POSITIVE_INFINITY;
    })))
    : 0;
  const inlineGap = Number.isFinite(gap) ? gap : 0;
  const appendLeft = last.right + inlineGap;
  const fitsInRow = !parentRect || appendLeft + last.width <= parentRect.right + 1;
  const firstColumnLeft = Math.min(...rects.map((rect) => rect.left));
  const appendRect = fitsInRow
    ? new DOMRect(appendLeft, last.top, last.width, last.height)
    : new DOMRect(firstColumnLeft, last.bottom + inlineGap, last.width, last.height);
  return { rects: [...rects, appendRect], slotCount: rects.length + 1 };
}

function resolveSourceTreePreviewGridSlotDropTarget({
  clientX,
  clientY,
  container,
  ignoredNodeIds,
  parentNode,
  parentRect,
  topLayerHost,
}: {
  clientX: number;
  clientY: number;
  container: HTMLElement;
  ignoredNodeIds?: ReadonlySet<string>;
  parentNode: EditableTreeNode;
  parentRect: SourceTreePreviewOverlayRect;
  topLayerHost?: HTMLElement | null;
}): SourceTreePreviewDropTarget | null {
  const slots = getSourceTreePreviewGridSlotGeometry(container, parentNode);
  if (!slots) return null;
  const children = getSourceTreePreviewLayerChildren(parentNode);
  const draggedIndex = ignoredNodeIds
    ? children.findIndex((child) => ignoredNodeIds.has(child.id))
    : -1;

  let activeIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  slots.rects.forEach((rect, index) => {
    const inside = clientX >= rect.left && clientX <= rect.right &&
      clientY >= rect.top && clientY <= rect.bottom;
    const distance = inside
      ? -1
      : getSourceCanvasPointToRectDistanceSquared(
          { height: rect.height, left: rect.left, top: rect.top, width: rect.width },
          clientX,
          clientY,
        );
    if (distance < bestDistance) {
      bestDistance = distance;
      activeIndex = index;
    }
  });
  if (activeIndex < 0) return null;

  // `index` stays in the pre-removal convention the move commit expects, while
  // `activeIndex` is the visual slot the user pointed at.
  const index = draggedIndex >= 0 && draggedIndex < activeIndex ? activeIndex + 1 : activeIndex;
  const overlayHost = topLayerHost ?? container;
  return {
    axis: 'horizontal',
    gridSlots: {
      activeIndex,
      rects: slots.rects.map((rect) => toSourceTreePreviewOverlayRect(overlayHost, rect)),
    },
    index,
    intent: 'inside',
    parentId: parentNode.id,
    position: 'inside',
    rect: toSourceTreePreviewOverlayRect(overlayHost, slots.rects[activeIndex]!),
    scopeLabel: parentNode.label,
    scopeRect: parentRect,
    topLayerHost,
  };
}

function resolveSourceTreePreviewBlockedDropHint(
  options: SourceTreePreviewCanvasDropResolveOptions,
): SourceTreePreviewBlockedDropHint | null {
  if (
    isSourceTreePreviewPortalConstrainedDrag(
      options.container,
      options.draggedNode,
    )
  ) {
    return null;
  }
  const rawTarget = resolveSourceTreePreviewCanvasDropCandidate(options);
  if (
    rawTarget &&
    isSourceTreePreviewNoopDropTarget(options.root, options.draggedNode, rawTarget)
  ) return null;

  const structuralTargetElement = getSourceTreePreviewStructuralDropHitElement(
    options.container,
    options.clientX,
    options.clientY,
    options.ignoredNodeIds,
  );
  const targetNodeId = structuralTargetElement
    ? getSourceTreePreviewElementNodeId(structuralTargetElement)
    : null;
  const targetNode = targetNodeId
    ? findSourceTreePreviewLayerNode(options.root, targetNodeId)
    : null;
  if (!structuralTargetElement || !targetNode) {
    return null;
  }
  const canDropIntoTarget = canMoveSourceNodeIntoParent(options.draggedNode, targetNode);
  const hasUnmeasuredPlacement = canDropIntoTarget &&
    hasSourceTreePreviewUnmeasuredDropChildren(
      options.container,
      targetNode,
      options.ignoredNodeIds,
    );
  if (canDropIntoTarget && !hasUnmeasuredPlacement) return null;
  const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(
    structuralTargetElement,
    options.container,
  );
  const overlayContainer = topLayerHost ?? options.container;
  const rect = getSourceTreePreviewDropScopeRect(options.container, targetNode, overlayContainer);
  if (!rect) return null;
  return {
    label: targetNode.label,
    reason: hasUnmeasuredPlacement ? 'unmeasured' : 'incompatible',
    rect,
    topLayerHost,
  };
}

function hasSourceTreePreviewUnmeasuredDropChildren(
  container: HTMLElement,
  parentNode: EditableTreeNode,
  ignoredNodeIds?: ReadonlySet<string>,
): boolean {
  const unignoredChildren = getSourceTreePreviewLayerChildren(parentNode)
    .filter((child) => !ignoredNodeIds?.has(child.id));
  return unignoredChildren.length > 0 &&
    getSourceTreePreviewChildDropGeometry(container, parentNode, ignoredNodeIds).length === 0;
}

function getSourceTreePreviewHitElement(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  ignoredNodeIds?: ReadonlySet<string>,
): HTMLElement | null {
  const paintStack = container.ownerDocument.elementsFromPoint?.(clientX, clientY) ?? [];
  const visited = new Set<HTMLElement>();
  for (const stackElement of paintStack) {
    let current = isSourceTreePreviewHTMLElement(stackElement)
      ? stackElement
      : stackElement.parentElement;
    while (current && container.contains(current)) {
      if (
        !visited.has(current) &&
        current.matches(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)
      ) {
        visited.add(current);
        const nodeId = getSourceTreePreviewElementNodeId(current);
        const containsUnshiftedPoint = getSourceTreePreviewOwnHitRects(current).some((rect) => (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ));
        if (nodeId && !ignoredNodeIds?.has(nodeId) && containsUnshiftedPoint) return current;
      }
      if (current === container) break;
      current = current.parentElement;
    }
  }

  // Geometry remains a fallback for logical nodes that do not participate in
  // the browser's current paint stack (for example a DOM-less source wrapper).
  const elements = Array.from(container.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR))
    .filter((element) => {
      const nodeId = getSourceTreePreviewElementNodeId(element);
      return Boolean(nodeId && !ignoredNodeIds?.has(nodeId));
    })
    .filter((element) => container.contains(element));
  const ownRectCandidates = getSourceTreePreviewPointHitCandidates(
    elements,
    clientX,
    clientY,
    getSourceTreePreviewOwnHitRects,
    container,
  );
  const candidates = ownRectCandidates.length > 0
    ? ownRectCandidates
    : getSourceTreePreviewPointHitCandidates(
        elements,
        clientX,
        clientY,
        (element) => {
          const rect = getSourceTreePreviewDropDecisionVisualRect(element);
          return rect ? [rect] : [];
        },
        container,
      );
  candidates.sort((left, right) => (
    (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height) ||
    right.depth - left.depth
  ));
  return candidates[0]?.element ?? null;
}

function getSourceTreePreviewStructuralDropHitElement(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  ignoredNodeIds?: ReadonlySet<string>,
): HTMLElement | null {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR),
  )
    .filter((element) => {
      const nodeId = getSourceTreePreviewElementNodeId(element);
      return Boolean(nodeId && !ignoredNodeIds?.has(nodeId));
    })
    .filter((element) => container.contains(element));
  const ownRectCandidates = getSourceTreePreviewPointHitCandidates(
    elements,
    clientX,
    clientY,
    getSourceTreePreviewOwnHitRects,
    container,
  );
  const candidates = ownRectCandidates.length > 0
    ? ownRectCandidates
    : getSourceTreePreviewPointHitCandidates(
        elements,
        clientX,
        clientY,
        (element) => {
          const rect = getSourceTreePreviewDropDecisionVisualRect(element);
          return rect ? [rect] : [];
        },
        container,
      );
  const paintStack = container.ownerDocument.elementsFromPoint?.(clientX, clientY) ?? [];
  const getPaintRank = (element: HTMLElement) => {
    const rank = paintStack.findIndex((paintElement) => (
      paintElement === element ||
      element.contains(paintElement)
    ));
    return rank < 0 ? Number.POSITIVE_INFINITY : rank;
  };
  // The paint stack can be led by a full-size absolute/portal layer (canvas,
  // particles, a modal backdrop) even when the intended drop target is the
  // regular layout below it. Prefer real layout-flow candidates when any are
  // present, but retain an out-of-flow candidate as a fallback so an
  // intentionally absolute item remains editable on its own.
  const inFlowCandidates = candidates.filter((candidate) => (
    isSourceTreePreviewElementInFlowScope(container, candidate.element)
  ));
  const structuralCandidates = inFlowCandidates.length > 0
    ? inFlowCandidates
    : candidates;
  const rankedCandidates = structuralCandidates.map((candidate) => ({
    ...candidate,
    area: candidate.rect.width * candidate.rect.height,
    paintRank: getPaintRank(candidate.element),
  }));
  rankedCandidates.sort((left, right) => (
    left.area - right.area ||
    right.depth - left.depth ||
    left.paintRank - right.paintRank
  ));
  return rankedCandidates[0]?.element ?? null;
}

function getSourceTreePreviewPointHitCandidates(
  elements: HTMLElement[],
  clientX: number,
  clientY: number,
  getRects: (element: HTMLElement) => DOMRect[],
  root: HTMLElement,
): Array<{ depth: number; element: HTMLElement; rect: DOMRect }> {
  return elements.flatMap((element) => (
    getRects(element)
      .filter((rect) => clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom)
      .map((rect) => ({ depth: getSourceTreePreviewNodeDepth(element, root), element, rect }))
  ));
}

/**
 * The elements inside the preview that the browser's own hit test reaches at a
 * point.
 *
 * A runtime surface that takes the viewport — a modal drawer, a dialog — makes
 * everything behind it unhittable: `react-remove-scroll` and friends put
 * `pointer-events: none` on the preview body and re-enable it only on the open
 * surface, so `elementsFromPoint` reports the surface and nothing underneath.
 * Candidate collection has to honor that, because the nodes behind the surface
 * still have rects containing the point.
 */
function getSourceTreePreviewPointHitScope(
  elementsFromPoint: Element[],
  currentTarget: HTMLElement,
): HTMLElement[] {
  return elementsFromPoint.filter((element): element is HTMLElement => (
    isSourceTreePreviewHTMLElement(element) && currentTarget.contains(element)
  ));
}

/**
 * Whether the browser's hit test at this point can reach `element` at all.
 *
 * Being in the same stack as a hit means the element either contains it or is
 * contained by it. With no surface open the container itself is in the stack,
 * so every node in the preview qualifies and geometry decides as before; only
 * a runtime surface that actually suppresses the background narrows this.
 */
function isSourceTreePreviewElementInPointHitScope(
  element: HTMLElement,
  scope: HTMLElement[],
): boolean {
  // The browser reached nothing inside the preview — an off-screen point, or a
  // document that cannot hit-test. Fall back to geometry rather than to
  // "nothing is selectable here".
  if (scope.length === 0) return true;
  return scope.some((hit) => hit.contains(element) || element.contains(hit));
}

function getSourceTreePreviewOwnHitRects(element: HTMLElement): DOMRect[] {
  if (shouldIgnoreSourceTreePreviewVisualElement(element)) return [];
  const drawerRect = getSourceTreePreviewOpenDrawerRect(element);
  if (drawerRect) return [drawerRect];
  return getSourceTreePreviewVisibleClientRects(element)
    .filter((rect) => isSourceTreePreviewRectVisibleThroughOverflowAncestors(element, rect));
}

function isSourceTreePreviewRectVisibleThroughOverflowAncestors(
  element: HTMLElement,
  rect: DOMRect,
  stopAt: HTMLElement | null = null,
): boolean {
  const nativeTopLayerHost = getSourceTreePreviewNativeTopLayerHost(element);
  let current = element.parentElement;
  while (current) {
    const style = getSourceTreePreviewComputedStyle(current);
    const clipsX = isSourceTreePreviewClippingOverflow(style.overflowX);
    const clipsY = isSourceTreePreviewClippingOverflow(style.overflowY);
    if (clipsX || clipsY) {
      const clipRect = current.getBoundingClientRect();
      if (
        clipRect.width <= 0 ||
        clipRect.height <= 0 ||
        (clipsX && (rect.right <= clipRect.left || rect.left >= clipRect.right)) ||
        (clipsY && (rect.bottom <= clipRect.top || rect.top >= clipRect.bottom))
      ) return false;
    }
    // A native popover/dialog is promoted into the browser's top layer.
    // Ancestors outside that host no longer clip its painted descendants even
    // though they remain ancestors in the DOM tree.
    if (current === nativeTopLayerHost || current === stopAt) break;
    current = current.parentElement;
  }
  return true;
}

function isSourceTreePreviewClippingOverflow(value: string): boolean {
  return value === 'auto' || value === 'clip' || value === 'hidden' || value === 'scroll';
}

function getSourceTreePreviewDropFlow(element: HTMLElement | null): SourceTreePreviewDropFlow {
  if (!element) return { axis: 'vertical', reverse: false };
  const style = getSourceTreePreviewComputedStyle(element);
  const childRects = Array.from(element.children).flatMap((child) => {
    if (
      !isSourceTreePreviewHTMLElement(child) ||
      !isSourceTreePreviewCanvasFlowElement(element, child)
    ) return [];
    const rect = getSourceTreePreviewDropDecisionVisualRect(child);
    return rect ? [rect] : [];
  });
  return inferSourceCanvasDropFlow({
    childRects,
    display: style.display,
    flexDirection: style.flexDirection,
    gridAutoFlow: style.gridAutoFlow,
    textDirection: style.direction,
  });
}

function getSourceTreePreviewFlowOffset(
  flow: SourceTreePreviewDropFlow,
  rect: DOMRect,
  clientX: number,
  clientY: number,
): number {
  return flow.axis === 'horizontal' ? clientX - rect.left : clientY - rect.top;
}

function getSourceTreePreviewFlowDimension(flow: SourceTreePreviewDropFlow, rect: DOMRect): number {
  return flow.axis === 'horizontal' ? rect.width : rect.height;
}

function getSourceTreePreviewFlowStart(flow: SourceTreePreviewDropFlow, rect: DOMRect): number {
  return flow.axis === 'horizontal' ? rect.left : rect.top;
}

function getSourceTreePreviewVisualSide(offset: number, dimension: number): 'end' | 'start' {
  return offset > dimension / 2 ? 'end' : 'start';
}

function getSourceTreePreviewInsertIndexForVisualSide(
  targetIndex: number,
  side: 'end' | 'start',
  flow: SourceTreePreviewDropFlow,
): number {
  if (flow.reverse) return side === 'start' ? targetIndex + 1 : targetIndex;
  return side === 'end' ? targetIndex + 1 : targetIndex;
}

function toSourceTreePreviewOverlayRect(container: HTMLElement, rect: DOMRect): SourceTreePreviewOverlayRect {
  const containerRect = container.getBoundingClientRect();
  return {
    height: normalizeOverlayRectValue(rect.height),
    left: normalizeOverlayRectValue(rect.left - containerRect.left + container.scrollLeft),
    top: normalizeOverlayRectValue(rect.top - containerRect.top + container.scrollTop),
    width: normalizeOverlayRectValue(rect.width),
  };
}

function toSourceTreePreviewOverlayRectFromNoteBox(
  container: HTMLElement,
  targetRect: DOMRect,
  box: WorkbenchSpecNoteHighlightBoxRect,
): SourceTreePreviewOverlayRect {
  const containerRect = container.getBoundingClientRect();
  const localRect = getSourceTreePreviewNoteBoxLocalRect(targetRect, box);
  return {
    height: normalizeOverlayRectValue(localRect.height),
    left: normalizeOverlayRectValue(targetRect.left - containerRect.left + container.scrollLeft + localRect.x),
    top: normalizeOverlayRectValue(targetRect.top - containerRect.top + container.scrollTop + localRect.y),
    width: normalizeOverlayRectValue(localRect.width),
  };
}

function createSourceTreePreviewPixelBox(
  targetRect: DOMRect,
  startClientX: number,
  startClientY: number,
  endClientX: number,
  endClientY: number,
): WorkbenchSpecNoteHighlightBoxRect {
  const startX = clampSourceTreePreviewRange(startClientX - targetRect.left, 0, targetRect.width);
  const startY = clampSourceTreePreviewRange(startClientY - targetRect.top, 0, targetRect.height);
  const endX = clampSourceTreePreviewRange(endClientX - targetRect.left, 0, targetRect.width);
  const endY = clampSourceTreePreviewRange(endClientY - targetRect.top, 0, targetRect.height);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = normalizeOverlayRectValue(Math.max(0, Math.max(startX, endX) - x));
  const height = normalizeOverlayRectValue(Math.max(0, Math.max(startY, endY) - y));
  return createSourceTreePreviewPixelBoxFromLocalRect(targetRect, x, y, width, height);
}

function createSourceTreePreviewPixelBoxFromLocalRect(
  targetRect: DOMRect,
  x: number,
  y: number,
  width: number,
  height: number,
  settings?: Pick<WorkbenchSpecNoteHighlightBoxRect, 'anchorX' | 'anchorY' | 'resizeMode'>,
): WorkbenchSpecNoteHighlightBoxRect {
  const nextX = normalizeOverlayRectValue(clampSourceTreePreviewRange(x, 0, targetRect.width));
  const nextY = normalizeOverlayRectValue(clampSourceTreePreviewRange(y, 0, targetRect.height));
  const nextWidth = normalizeOverlayRectValue(clampSourceTreePreviewRange(width, 0, Math.max(0, targetRect.width - nextX)));
  const nextHeight = normalizeOverlayRectValue(clampSourceTreePreviewRange(height, 0, Math.max(0, targetRect.height - nextY)));
  const resizeMode = normalizeSourceTreePreviewNoteBoxResizeMode(settings?.resizeMode);
  return {
    anchorX: settings?.anchorX ?? resolveSourceTreePreviewNoteBoxAnchor(nextX + nextWidth / 2, targetRect.width),
    anchorY: settings?.anchorY ?? resolveSourceTreePreviewNoteBoxAnchor(nextY + nextHeight / 2, targetRect.height),
    ...(resizeMode === SOURCE_TREE_PREVIEW_DEFAULT_NOTE_BOX_RESIZE_MODE ? {} : { resizeMode }),
    targetHeight: normalizeOverlayRectValue(targetRect.height),
    targetWidth: normalizeOverlayRectValue(targetRect.width),
    unit: 'px',
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
}

function getSourceTreePreviewNoteBoxLocalRect(
  targetRect: DOMRect,
  box: WorkbenchSpecNoteHighlightBoxRect,
): WorkbenchSpecNoteHighlightBoxRect {
  if (box.unit === 'px') {
    const resizeMode = normalizeSourceTreePreviewNoteBoxResizeMode(box.resizeMode);
    const widthResizes = resizeMode === 'horizontal' || resizeMode === 'both';
    const heightResizes = resizeMode === 'vertical' || resizeMode === 'both';
    const width = resolveSourceTreePreviewNoteBoxSize({
      currentContainerSize: targetRect.width,
      resizeAxis: widthResizes,
      savedContainerSize: box.targetWidth,
      savedSize: box.width,
    });
    const height = resolveSourceTreePreviewNoteBoxSize({
      currentContainerSize: targetRect.height,
      resizeAxis: heightResizes,
      savedContainerSize: box.targetHeight,
      savedSize: box.height,
    });
    const x = resolveSourceTreePreviewAnchoredBoxOffset({
      anchor: box.anchorX,
      clampToContainer: widthResizes,
      currentContainerSize: targetRect.width,
      currentSize: width,
      savedContainerSize: box.targetWidth,
      savedOffset: box.x,
      savedSize: box.width,
    });
    const y = resolveSourceTreePreviewAnchoredBoxOffset({
      anchor: box.anchorY,
      clampToContainer: heightResizes,
      currentContainerSize: targetRect.height,
      currentSize: height,
      savedContainerSize: box.targetHeight,
      savedOffset: box.y,
      savedSize: box.height,
    });
    return {
      anchorX: box.anchorX,
      anchorY: box.anchorY,
      ...(resizeMode === SOURCE_TREE_PREVIEW_DEFAULT_NOTE_BOX_RESIZE_MODE ? {} : { resizeMode }),
      unit: 'px',
      x,
      y,
      // Resizing axes stay inside the node; fixed axes keep their absolute size and may overflow.
      width: widthResizes ? clampSourceTreePreviewRange(width, 0, Math.max(0, targetRect.width - x)) : Math.max(0, width),
      height: heightResizes ? clampSourceTreePreviewRange(height, 0, Math.max(0, targetRect.height - y)) : Math.max(0, height),
    };
  }

  const x = clampSourceTreePreviewUnit(box.x) * targetRect.width;
  const y = clampSourceTreePreviewUnit(box.y) * targetRect.height;
  return {
    unit: 'ratio',
    x,
    y,
    width: Math.min(Math.max(0, targetRect.width - x), clampSourceTreePreviewUnit(box.width) * targetRect.width),
    height: Math.min(Math.max(0, targetRect.height - y), clampSourceTreePreviewUnit(box.height) * targetRect.height),
  };
}

function clampSourceTreePreviewUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeSourceTreePreviewNoteBoxResizeMode(
  value: WorkbenchSpecNoteHighlightBoxRect['resizeMode'],
): WorkbenchSpecNoteHighlightBoxResizeMode {
  return value === 'both' || value === 'horizontal' || value === 'vertical'
    ? value
    : SOURCE_TREE_PREVIEW_DEFAULT_NOTE_BOX_RESIZE_MODE;
}

function getSourceTreePreviewNextNoteBoxResizeMode(
  resizeMode: WorkbenchSpecNoteHighlightBoxRect['resizeMode'],
): WorkbenchSpecNoteHighlightBoxResizeMode {
  const normalizedMode = normalizeSourceTreePreviewNoteBoxResizeMode(resizeMode);
  if (normalizedMode === 'fixed') return 'horizontal';
  if (normalizedMode === 'horizontal') return 'vertical';
  if (normalizedMode === 'vertical') return 'both';
  return 'fixed';
}

function getSourceTreePreviewResizeModeLabel(
  resizeMode: WorkbenchSpecNoteHighlightBoxRect['resizeMode'],
): string {
  const normalizedMode = normalizeSourceTreePreviewNoteBoxResizeMode(resizeMode);
  if (normalizedMode === 'horizontal') return 'Resize with width changes';
  if (normalizedMode === 'vertical') return 'Resize with height changes';
  if (normalizedMode === 'both') return 'Resize with width and height changes';
  return 'Keep current size when the node resizes';
}

function getSourceTreePreviewAnchorCornerSetting(corner: SourceTreePreviewNoteBoxAnchorCorner): {
  anchorX: 'end' | 'start';
  anchorY: 'end' | 'start';
} {
  return {
    anchorX: corner.includes('e') ? 'end' : 'start',
    anchorY: corner.includes('s') ? 'end' : 'start',
  };
}

function resolveSourceTreePreviewNoteBoxAnchor(
  centerOffset: number,
  containerSize: number,
): 'center' | 'end' | 'start' {
  if (!Number.isFinite(centerOffset) || !Number.isFinite(containerSize) || containerSize <= 0) return 'start';
  const ratio = centerOffset / containerSize;
  if (ratio <= 1 / 3) return 'start';
  if (ratio >= 2 / 3) return 'end';
  return 'center';
}

function resolveSourceTreePreviewAnchoredBoxOffset({
  anchor,
  clampToContainer = true,
  currentContainerSize,
  currentSize,
  savedContainerSize,
  savedOffset,
  savedSize,
}: {
  anchor: WorkbenchSpecNoteHighlightBoxRect['anchorX'];
  clampToContainer?: boolean;
  currentContainerSize: number;
  currentSize: number;
  savedContainerSize: number | undefined;
  savedOffset: number;
  savedSize: number;
}): number {
  if (!Number.isFinite(savedOffset) || !Number.isFinite(currentContainerSize) || currentContainerSize <= 0) return 0;
  const clampOffset = (offset: number) => clampToContainer
    ? clampSourceTreePreviewRange(offset, 0, Math.max(0, currentContainerSize - currentSize))
    : offset;
  if (!savedContainerSize || savedContainerSize <= 0) {
    return clampOffset(savedOffset);
  }

  const resolvedOffset = anchor === 'end'
    ? currentContainerSize - (savedContainerSize - savedOffset - savedSize) - currentSize
    : anchor === 'center'
      ? currentContainerSize / 2 + (savedOffset + savedSize / 2 - savedContainerSize / 2) - currentSize / 2
      : savedOffset;
  return clampOffset(resolvedOffset);
}

function resolveSourceTreePreviewNoteBoxSize({
  currentContainerSize,
  resizeAxis,
  savedContainerSize,
  savedSize,
}: {
  currentContainerSize: number;
  resizeAxis: boolean;
  savedContainerSize: number | undefined;
  savedSize: number;
}): number {
  if (!Number.isFinite(savedSize) || savedSize <= 0) return 0;
  if (!resizeAxis || !savedContainerSize || savedContainerSize <= 0 || !Number.isFinite(currentContainerSize)) {
    return savedSize;
  }
  return normalizeOverlayRectValue(savedSize * (currentContainerSize / savedContainerSize));
}

function resolveSourceTreePreviewStableNoteBox(
  targetRect: DOMRect,
  box: WorkbenchSpecNoteHighlightBox,
  legacyRatioBoxCache: Map<string, WorkbenchSpecNoteHighlightBoxRect>,
): WorkbenchSpecNoteHighlightBoxRect {
  if (box.unit === 'px') return box;

  const cacheKey = getSourceTreePreviewNoteBoxIdentity(box);
  const cachedBox = legacyRatioBoxCache.get(cacheKey);
  if (cachedBox) return cachedBox;

  const localRect = getSourceTreePreviewNoteBoxLocalRect(targetRect, box);
  const width = normalizeOverlayRectValue(localRect.width);
  const height = normalizeOverlayRectValue(localRect.height);
  const resizeMode = normalizeSourceTreePreviewNoteBoxResizeMode(box.resizeMode);
  const stableBox: WorkbenchSpecNoteHighlightBoxRect = {
    anchorX: resolveSourceTreePreviewNoteBoxAnchor(localRect.x + width / 2, targetRect.width),
    anchorY: resolveSourceTreePreviewNoteBoxAnchor(localRect.y + height / 2, targetRect.height),
    ...(resizeMode === SOURCE_TREE_PREVIEW_DEFAULT_NOTE_BOX_RESIZE_MODE ? {} : { resizeMode }),
    targetHeight: normalizeOverlayRectValue(targetRect.height),
    targetWidth: normalizeOverlayRectValue(targetRect.width),
    unit: 'px',
    x: normalizeOverlayRectValue(localRect.x),
    y: normalizeOverlayRectValue(localRect.y),
    width,
    height,
  };
  legacyRatioBoxCache.set(cacheKey, stableBox);
  return stableBox;
}

function resolveSourceTreePreviewDraggedNoteBox(
  targetRect: DOMRect,
  startRect: WorkbenchSpecNoteHighlightBoxRect,
  intent: 'move' | SourceTreePreviewResizeEdge,
  dx: number,
  dy: number,
): WorkbenchSpecNoteHighlightBoxRect {
  const minSize = 4;
  let left = startRect.x;
  let top = startRect.y;
  let right = startRect.x + startRect.width;
  let bottom = startRect.y + startRect.height;

  if (intent === 'move') {
    const x = clampSourceTreePreviewRange(startRect.x + dx, 0, Math.max(0, targetRect.width - startRect.width));
    const y = clampSourceTreePreviewRange(startRect.y + dy, 0, Math.max(0, targetRect.height - startRect.height));
    return createSourceTreePreviewPixelBoxFromLocalRect(targetRect, x, y, startRect.width, startRect.height, {
      anchorX: startRect.anchorX,
      anchorY: startRect.anchorY,
      resizeMode: startRect.resizeMode,
    });
  }

  if (intent.includes('w')) left = clampSourceTreePreviewRange(startRect.x + dx, 0, right - minSize);
  if (intent.includes('e')) right = clampSourceTreePreviewRange(startRect.x + startRect.width + dx, left + minSize, targetRect.width);
  if (intent.includes('n')) top = clampSourceTreePreviewRange(startRect.y + dy, 0, bottom - minSize);
  if (intent.includes('s')) bottom = clampSourceTreePreviewRange(startRect.y + startRect.height + dy, top + minSize, targetRect.height);

  return createSourceTreePreviewPixelBoxFromLocalRect(targetRect, left, top, right - left, bottom - top, {
    anchorX: startRect.anchorX,
    anchorY: startRect.anchorY,
    resizeMode: startRect.resizeMode,
  });
}

function getSourceTreePreviewNoteBoxIdentity(box: WorkbenchSpecNoteHighlightBox): string {
  return [
    box.id,
    box.unit,
    box.anchorX,
    box.anchorY,
    box.resizeMode,
    box.targetWidth,
    box.targetHeight,
    box.x,
    box.y,
    box.width,
    box.height,
  ].join(':');
}

function clampSourceTreePreviewRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

type SourceTreePreviewNodeProps = {
  assetRegistry?: WorkbenchAssetRegistry;
  i18nTokens: SourceTreePreviewI18nMap;
  dismissedPreviewModalNodeIds: Set<string>;
  node: EditableTreeNode;
  onDismissPreviewModal: (nodeId: string) => void;
  onDrillIntoLayer: (layerId: string) => void;
  onNodeDragStart: (event: SourceTreePreviewDragStartEvent) => void;
  onSelectLayer: (layerId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  onSourceNodeComponentPropChange?: SourceTreePreviewComponentPropChange;
  previewDrillPath: string[];
  previewTokenModes: PreviewTokenModeSelection;
  projectRuntimeComponents: ProjectSourceRuntimeComponents;
  runtimeDescendantNodeIds: Set<string>;
  selectable: boolean;
  selectedLayerId: string | null;
  selectedLayerIds: Set<string>;
  sourcePreviewOnly: boolean;
  sourcePropOverrides?: Partial<EditableTreeSourceProps>;
  tokenRegistry: TokenRegistry;
};

function SourceTreePreviewNodeComponent({
  assetRegistry,
  i18nTokens,
  dismissedPreviewModalNodeIds,
  node,
  onDismissPreviewModal,
  onDrillIntoLayer,
  onNodeDragStart,
  onSelectLayer,
  onSourceNodeComponentPropChange,
  previewDrillPath,
  previewTokenModes,
  projectRuntimeComponents,
  runtimeDescendantNodeIds,
  selectable,
  selectedLayerId,
  selectedLayerIds,
  sourcePreviewOnly,
  sourcePropOverrides,
  tokenRegistry,
}: SourceTreePreviewNodeProps) {
  const sourcePreviewChildren = node.sourcePreviewChildren ?? [];
  const childNodes = getSourceTreePreviewRenderableChildren(node);
  const renderingSourcePreviewChildren = sourcePreviewChildren.length > 0;
  const selected = selectable && selectedLayerId === node.id;
  const multiSelected = selectable && !selected && selectedLayerIds.has(node.id);
  const drilled = previewDrillPath.includes(node.id);
  if (childNodes.length === 0 && isSourceTextLeaf(node)) {
    const sourceExpression = node.sourceExpression;
    const textClassName = [
      'wb-source-visual-text',
      sourceExpression ? 'wb-source-visual-expression' : '',
      selected ? 'wb-source-visual-node--selected' : '',
      multiSelected ? 'wb-source-visual-node--multi-selected' : '',
      drilled ? 'wb-source-visual-node--drilled' : '',
    ].filter(Boolean).join(' ');
    const i18nKey = node.tokenBindings?.text;
    const resolvedText = sourceExpression
      ? node.label
      : i18nKey && i18nTokens[i18nKey] !== undefined
      ? i18nTokens[i18nKey]
      : node.textContent ?? node.label;
    if (isSourceWhitespaceTextLeaf(node)) return resolvedText;

    return (
      <span
        className={textClassName}
        data-wb-preview-node-id={selectable ? node.id : undefined}
        data-wb-source-expression-kind={sourceExpression?.kind}
        data-wb-source-preview-only={sourcePreviewOnly ? 'true' : undefined}
        draggable={false}
        title={sourceExpression ? getSourceTreePreviewExpressionTooltip(sourceExpression.code) : undefined}
        role={selectable ? 'button' : undefined}
        tabIndex={selectable ? 0 : undefined}
        onClick={(event) => {
          if (!selectable) return;
          if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;
          sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);
          event.stopPropagation();
          const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
          const selectionMode = getSourceTreePreviewModifierSelectionMode(event);
          onSelectLayer(
            resolveSourceTreePreviewEventNodeId(event, node.id, selectionMode),
            selectionMode,
            additive,
          );
          focusSourceTreePreviewRootFromEvent(event);
        }}
        onDoubleClick={(event) => {
          if (!selectable) return;
          event.stopPropagation();
          onDrillIntoLayer(resolveSourceTreePreviewEventNodeId(event, node.id, 'deep'));
        }}
        onKeyDown={selectable ? (event) => handleSourceTreePreviewNodeKeyDown(event, node.id, onSelectLayer) : undefined}
        onMouseDownCapture={selectable ? onNodeDragStart : undefined}
        onPointerDownCapture={selectable ? onNodeDragStart : undefined}
      >
        {resolvedText}
      </span>
    );
  }
  const projectRuntimeState = getSourceTreePreviewProjectRuntimeState(node, projectRuntimeComponents);
  const projectSourceComponent = projectRuntimeState?.status === 'ready' ? projectRuntimeState.component : null;
  const projectRuntimeDiagnostic = projectRuntimeState?.status === 'error' ? projectRuntimeState.diagnostic : null;
  const projectRuntimeLoading = hasProjectSourceRuntimeImport(node) && (!projectRuntimeState || projectRuntimeState.status === 'loading');
  const nodeSourceAttributes = node.sourceAttributes ?? {};
  const nodeModeOverride = parseTokenModeOverride(nodeSourceAttributes[SOURCE_TOKEN_MODE_ATTRIBUTE]);
  const hasNodeModeOverride = Object.keys(nodeModeOverride).length > 0;
  const nodePreviewTokenModes = hasNodeModeOverride
    ? { ...previewTokenModes, ...nodeModeOverride }
    : previewTokenModes;
  const nodeModeVariables = hasNodeModeOverride
    ? getSourceTreePreviewTokenVariables(tokenRegistry, nodePreviewTokenModes)
    : undefined;
  const nodeStyle = {
    ...(nodeModeVariables ?? null),
    ...(getSourceTreePreviewNodeStyle(node, tokenRegistry, nodePreviewTokenModes) ?? null),
  } as CSSProperties;
  const resolvedNodeStyle = Object.keys(nodeStyle).length > 0 ? nodeStyle : undefined;
  const backgroundVideos = parseSourceBackgroundVideoLayers(node.sourceStyleDeclarations);
  const intrinsicElement = getSourceTreePreviewIntrinsicElement(
    node,
    resolvedNodeStyle,
    assetRegistry,
    selectable ? node.id : undefined,
  );
  const sourceComponent = projectSourceComponent;
  const containsRuntimeComponent = Boolean(sourceComponent ?? intrinsicElement ?? projectRuntimeDiagnostic ?? projectRuntimeLoading) || runtimeDescendantNodeIds.has(node.id);
  const isRuntimeWrapper = Boolean(intrinsicElement || sourceComponent || projectRuntimeDiagnostic || projectRuntimeLoading);
  const authoredClassName = getSourceTreePreviewAuthoredClassName(nodeSourceAttributes);
  const runtimeWrapperForwardClassName = isRuntimeWrapper
    ? getSourceTreePreviewRuntimeWrapperForwardClassName(authoredClassName)
    : null;
  const hasHydratedRuntimeChildren = sourceComponent && node.sourceAttributes?.['data-wb-runtime-hydrated-children'] === 'true';
  const shouldRenderRuntimeOwnedChildren = Boolean(
    sourceComponent && shouldPassSourceTreePreviewRuntimeOwnedChildren(node),
  );
  const runtimeOwnedChildren = shouldRenderRuntimeOwnedChildren
    ? getSourceTreePreviewRuntimeOwnedChildren({
        assetRegistry,
        // Authored compound children can live in sourcePreviewChildren after
        // the parser projects a source-backed instance. Passing node.children
        // here silently drops those children at the runtime boundary: Layers
        // still shows them, but the component receives no React children.
        // Hydrated implementation trees continue to let the component own
        // their internal branch.
        childNodes: hasHydratedRuntimeChildren ? node.children ?? [] : childNodes,
        i18nTokens,
        nodePreviewTokenModes,
        onDrillIntoLayer,
        onNodeDragStart,
        onSelectLayer,
        projectRuntimeComponents,
        renderTextLeavesAsRawText: shouldRenderSourceTreePreviewRuntimeRawTextDescendants(node),
        selectable,
        sourcePreviewChildren: false,
        sourcePreviewOnly,
        tokenRegistry,
      })
    : null;
  const renderedChildren = hasHydratedRuntimeChildren || (shouldRenderRuntimeOwnedChildren && runtimeOwnedChildren !== null)
    ? []
    : getSourceTreePreviewChildElements({
        childNodes,
        dismissedPreviewModalNodeIds,
        assetRegistry,
        i18nTokens,
        nodePreviewTokenModes,
        onDrillIntoLayer,
        onDismissPreviewModal,
        onNodeDragStart,
        onSelectLayer,
        onSourceNodeComponentPropChange,
        previewDrillPath,
        projectRuntimeComponents,
        runtimeDescendantNodeIds,
        repeaterNode: node,
        selectable,
        selectedLayerId,
        selectedLayerIds,
        sourcePreviewChildren: renderingSourcePreviewChildren,
        sourcePreviewOnly,
        tokenRegistry,
      });
  const wrapperAuthoredClassName = isRuntimeWrapper ? null : authoredClassName;
  const previewNodeBaseClassName = wrapperAuthoredClassName ? 'wb-source-visual-authored-node' : 'wb-source-visual-node';
  const modalDismissed = Boolean(wrapperAuthoredClassName && isSourceTreePreviewModalRootClassName(wrapperAuthoredClassName) && dismissedPreviewModalNodeIds.has(node.id));
  const previewAuthoredClassName = modalDismissed
    ? removeSourceTreePreviewClassNameToken(wrapperAuthoredClassName ?? '', 'is-open')
    : wrapperAuthoredClassName;
  const className = [
    previewNodeBaseClassName,
    hasNodeModeOverride && !isRuntimeWrapper ? getLibraryScopeClassName() : '',
    previewAuthoredClassName,
    isRuntimeWrapper ? 'wb-source-visual-node--runtime-component' : previewAuthoredClassName ? '' : getSourceTreePreviewNodeClass(node),
    runtimeWrapperForwardClassName,
    selected ? 'wb-source-visual-node--selected' : '',
    multiSelected ? 'wb-source-visual-node--multi-selected' : '',
    drilled ? 'wb-source-visual-node--drilled' : '',
    backgroundVideos.length > 0 ? 'wb-source-visual-node--has-video-bg' : '',
  ].filter(Boolean).join(' ');
  const wrapperStyle = getSourceTreePreviewWrapperStyle({
    backgroundVideos,
    isRuntimeWrapper,
    resolvedNodeStyle,
  });
  const sourcePropOverrideValue = sourcePropOverrides;
  const nodeHidden = nodeSourceAttributes.hidden === 'true';
  const nodeElementProps = {
    className,
    'data-wb-preview-node-id': selectable ? node.id : undefined,
    'data-wb-source-preview-only': sourcePreviewOnly ? 'true' : undefined,
    draggable: false,
    hidden: nodeHidden || undefined,
    'aria-hidden': modalDismissed ? true : undefined,
    role: selectable && !containsRuntimeComponent ? 'button' : undefined,
    tabIndex: selectable && !containsRuntimeComponent ? 0 : undefined,
    style: wrapperStyle,
    onClick: (event?: ReactMouseEvent<HTMLElement>) => {
      if (
        !selectable ||
        !event ||
        typeof event !== 'object' ||
        !event.nativeEvent ||
        typeof event.stopPropagation !== 'function'
      ) return;
      if (containsRuntimeComponent) return;
      if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;
      const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
      const smartDeep = event.metaKey || event.ctrlKey;
      const eventTarget = getSourceTreePreviewEventTargetElement(event);
      const runtimeInteractionTarget = eventTarget?.closest<HTMLElement>(
        SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR,
      ) ?? null;
      if (
        runtimeInteractionTarget &&
        isSourceTreePreviewRuntimeActivationEvent(event) &&
        !smartDeep &&
        !additive
      ) {
        return;
      }
      sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);
      if (handleSourceTreePreviewModalDismissClick(event, onDismissPreviewModal)) return;
      event.stopPropagation();
      const selectionMode = getSourceTreePreviewModifierSelectionMode(event);
      onSelectLayer(
        resolveSourceTreePreviewEventNodeId(event, node.id, selectionMode),
        selectionMode,
        additive,
      );
      focusSourceTreePreviewRootFromEvent(event);
    },
    onDoubleClick: (event?: ReactMouseEvent<HTMLElement>) => {
      if (
        !selectable ||
        !event ||
        typeof event !== 'object' ||
        !event.nativeEvent ||
        typeof event.stopPropagation !== 'function'
      ) return;
      event.stopPropagation();
      onDrillIntoLayer(resolveSourceTreePreviewEventNodeId(event, node.id, 'deep'));
    },
    onKeyDown: selectable ? (event: ReactKeyboardEvent<HTMLElement>) => handleSourceTreePreviewNodeKeyDown(event, node.id, onSelectLayer) : undefined,
    onMouseDownCapture: selectable ? onNodeDragStart : undefined,
    onPointerDownCapture: selectable ? onNodeDragStart : undefined,
  };
  const injectRuntimePreviewNodeProps = Boolean(
    (sourceComponent || intrinsicElement) &&
    backgroundVideos.length === 0,
  );
  const runtimePreviewNodeProps = injectRuntimePreviewNodeProps
    ? sourceComponent
      ? getSourceTreePreviewComponentNodeProps(nodeElementProps)
      : getSourceTreePreviewDirectNodeProps(nodeElementProps)
    : undefined;
  const runtimeIntrinsicElement = intrinsicElement && runtimePreviewNodeProps
    ? cloneElement(intrinsicElement, runtimePreviewNodeProps)
    : intrinsicElement;
  const renderedNodeContent = (
    <>
      {backgroundVideos.map((video, index) => (
        <video
          key={`${video.source}:${index}`}
          aria-hidden="true"
          autoPlay
          className="wb-source-visual-background-video"
          loop
          muted
          playsInline
          preload="metadata"
          src={video.source}
          style={{
            mixBlendMode: video.blend === 'normal' ? undefined : video.blend as CSSProperties['mixBlendMode'],
            objectFit: getSourceTreePreviewBackgroundVideoFit(video.size),
            objectPosition: video.position,
          }}
        />
      ))}
      {sourceComponent
        ? renderSourceTreePreviewComponent(
            sourceComponent,
            node,
            resolvedNodeStyle,
            tokenRegistry,
            nodePreviewTokenModes,
            runtimeOwnedChildren ?? renderedChildren,
            sourcePropOverrideValue,
            projectRuntimeComponents,
            onSourceNodeComponentPropChange,
            hasNodeModeOverride ? {
              className: getLibraryScopeClassName(),
            } : undefined,
            runtimePreviewNodeProps,
          )
        : projectRuntimeDiagnostic
          ? renderSourceTreePreviewRuntimeDiagnostic(projectRuntimeDiagnostic)
          : projectRuntimeLoading
            ? renderSourceTreePreviewRuntimeLoading(node)
        : runtimeIntrinsicElement ?? (renderedChildren.length > 0 ? renderedChildren : null)}
    </>
  );
  const guardedNodeContent = containsRuntimeComponent ? (
    <SourceTreePreviewRuntimeErrorBoundary
      key={`${node.id}:${projectRuntimeState?.status ?? 'static'}:${node.source?.jsxName ?? node.label}`}
      label={node.source?.jsxName ?? node.label}
    >
      {renderedNodeContent}
    </SourceTreePreviewRuntimeErrorBoundary>
  ) : renderedNodeContent;
  if (node.source?.jsxName === 'Fragment') {
    // Fragment-backed source boundaries (including `.map(...)` collections)
    // are selection/tree metadata only. A real preview wrapper would change
    // flex/grid child relationships and swallow parent gap/layout rules.
    return <>{guardedNodeContent}</>;
  }
  const runtimeFallbackHostTagName = !sourceComponent && isRuntimeWrapper
    ? getSourceTreePreviewRuntimeFallbackHostTagName(node)
    : null;
  if (runtimeFallbackHostTagName) {
    const fallbackProps = getSourceTreePreviewRuntimeFallbackHostProps(runtimeFallbackHostTagName, nodeElementProps);
    const fallbackContent = getSourceTreePreviewRuntimeFallbackHostContent(
      runtimeFallbackHostTagName,
      renderedChildren,
      guardedNodeContent,
    );
    return createElement(runtimeFallbackHostTagName, fallbackProps, fallbackContent);
  }

  if (injectRuntimePreviewNodeProps) {
    return guardedNodeContent;
  }

  const hostTagName = isRuntimeWrapper ? null : getSourceTreePreviewHostTagName(node);
  if (hostTagName) {
    const hostProps = getSourceTreePreviewHostElementProps(
      hostTagName,
      nodeElementProps,
      nodeSourceAttributes,
      node.sourceProps,
    );
    return isSourceTreePreviewVoidHostTagName(hostTagName)
      ? createElement(hostTagName, hostProps)
      : createElement(hostTagName, hostProps, guardedNodeContent);
  }

  return (
    <div {...nodeElementProps}>
      {guardedNodeContent}
    </div>
  );
}

const SourceTreePreviewNode = memo(SourceTreePreviewNodeComponent, areSourceTreePreviewNodePropsEqual);
SourceTreePreviewNode.displayName = 'SourceTreePreviewNode';

const SOURCE_TREE_PREVIEW_NODE_SUBTREE_ID_CACHE = new WeakMap<EditableTreeNode, {
  children: EditableTreeNode[] | undefined;
  sourcePreviewChildren: EditableTreeNode[] | undefined;
  subtreeIds: Set<string>;
}>();

function areSourceTreePreviewNodePropsEqual(
  previousProps: SourceTreePreviewNodeProps,
  nextProps: SourceTreePreviewNodeProps,
): boolean {
  if (
    previousProps.node !== nextProps.node ||
    previousProps.assetRegistry !== nextProps.assetRegistry ||
    previousProps.i18nTokens !== nextProps.i18nTokens ||
    previousProps.onDismissPreviewModal !== nextProps.onDismissPreviewModal ||
    previousProps.onDrillIntoLayer !== nextProps.onDrillIntoLayer ||
    previousProps.onSelectLayer !== nextProps.onSelectLayer ||
    previousProps.onSourceNodeComponentPropChange !== nextProps.onSourceNodeComponentPropChange ||
    previousProps.previewTokenModes !== nextProps.previewTokenModes ||
    previousProps.projectRuntimeComponents !== nextProps.projectRuntimeComponents ||
    previousProps.runtimeDescendantNodeIds !== nextProps.runtimeDescendantNodeIds ||
    previousProps.selectable !== nextProps.selectable ||
    previousProps.sourcePreviewOnly !== nextProps.sourcePreviewOnly ||
    previousProps.sourcePropOverrides !== nextProps.sourcePropOverrides ||
    previousProps.tokenRegistry !== nextProps.tokenRegistry
  ) {
    return false;
  }

  // Selection chrome is rendered by SourceTreePreviewSelectionOverlay and
  // must not flow back through the live project component tree. Re-rendering
  // compound controls for a selection-only change can reset uncontrolled
  // Dropdown, Popover, Dialog, or Drawer state immediately after their click.
  // Drill and authored visibility changes below still re-render the affected
  // subtree because they change the previewed runtime itself.

  if (
    previousProps.previewDrillPath !== nextProps.previewDrillPath &&
    isSourceTreePreviewIdSetChangeRelevantToNode(
      nextProps.node,
      previousProps.previewDrillPath,
      nextProps.previewDrillPath,
    )
  ) {
    return false;
  }

  if (
    previousProps.dismissedPreviewModalNodeIds !== nextProps.dismissedPreviewModalNodeIds &&
    isSourceTreePreviewIdSetChangeRelevantToNode(
      nextProps.node,
      previousProps.dismissedPreviewModalNodeIds,
      nextProps.dismissedPreviewModalNodeIds,
    )
  ) {
    return false;
  }

  return true;
}

function isSourceTreePreviewIdSetChangeRelevantToNode(
  node: EditableTreeNode,
  previousIds: Iterable<string | null | undefined>,
  nextIds: Iterable<string | null | undefined>,
): boolean {
  const changedIds = getSourceTreePreviewChangedIds(previousIds, nextIds);
  if (changedIds.length === 0) return false;
  const subtreeIds = getCachedSourceTreePreviewNodeSubtreeIds(node);
  return changedIds.some((layerId) => subtreeIds.has(layerId));
}

function getSourceTreePreviewChangedIds(
  previousIds: Iterable<string | null | undefined>,
  nextIds: Iterable<string | null | undefined>,
): string[] {
  const previousIdSet = new Set([...previousIds].filter((layerId): layerId is string => Boolean(layerId)));
  const nextIdSet = new Set([...nextIds].filter((layerId): layerId is string => Boolean(layerId)));
  const changedIds = new Set<string>();
  previousIdSet.forEach((layerId) => {
    if (!nextIdSet.has(layerId)) changedIds.add(layerId);
  });
  nextIdSet.forEach((layerId) => {
    if (!previousIdSet.has(layerId)) changedIds.add(layerId);
  });
  return [...changedIds];
}

function getCachedSourceTreePreviewNodeSubtreeIds(node: EditableTreeNode): Set<string> {
  const children = node.children;
  const sourcePreviewChildren = node.sourcePreviewChildren;
  const cached = SOURCE_TREE_PREVIEW_NODE_SUBTREE_ID_CACHE.get(node);
  if (
    cached &&
    cached.children === children &&
    cached.sourcePreviewChildren === sourcePreviewChildren
  ) {
    return cached.subtreeIds;
  }
  const subtreeIds = getSourceTreePreviewNodeSubtreeIds(node);
  SOURCE_TREE_PREVIEW_NODE_SUBTREE_ID_CACHE.set(node, { children, sourcePreviewChildren, subtreeIds });
  return subtreeIds;
}

type SourceTreePreviewRuntimeErrorBoundaryProps = {
  children: ReactNode;
  label: string;
};

type SourceTreePreviewRuntimeErrorBoundaryState = {
  error: Error | null;
};

class SourceTreePreviewRuntimeErrorBoundary extends ReactComponent<
  SourceTreePreviewRuntimeErrorBoundaryProps,
  SourceTreePreviewRuntimeErrorBoundaryState
> {
  state: SourceTreePreviewRuntimeErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): SourceTreePreviewRuntimeErrorBoundaryState {
    return { error: normalizeSourceTreePreviewRuntimeError(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Source tree runtime preview failed', error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return renderSourceTreePreviewRuntimeRenderError(this.props.label, error);
    }

    return this.props.children;
  }
}

function getSourceTreePreviewAuthoredClassName(sourceAttributes: EditableTreeSourceAttributes): string | null {
  const className = sourceAttributes.className?.trim();
  return className ? className : null;
}

function watchSourceTreePreviewModalScrollState(container: HTMLElement): () => void {
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  const cleanupByBody = new Map<HTMLElement, () => void>();
  const ResizeObserverCtor = ownerWindow.ResizeObserver ?? (typeof ResizeObserver === 'undefined' ? null : ResizeObserver);
  const resizeObserver = ResizeObserverCtor ? new ResizeObserverCtor(() => syncTrackedModalBodies()) : null;

  const updateModalBody = (body: HTMLElement) => {
    const prefix = getSourceTreePreviewModalPrefixFromBody(body);
    if (!prefix) return;
    const modal = findSourceTreePreviewModalFrame(body, prefix, container);
    if (!modal) return;
    const maxScrollTop = Math.max(0, body.scrollHeight - body.clientHeight);
    modal.classList.toggle(`${prefix}-modal--scrolling`, body.scrollTop > 1);
    modal.classList.toggle(`${prefix}-modal--can-scroll-down`, maxScrollTop - body.scrollTop > 1);
  };

  const attachModalBody = (body: HTMLElement) => {
    if (cleanupByBody.has(body)) {
      updateModalBody(body);
      return;
    }
    const update = () => updateModalBody(body);
    const observedChildren = Array.from(body.children).filter(isSourceTreePreviewHTMLElement);
    body.addEventListener('scroll', update, { passive: true });
    resizeObserver?.observe(body);
    observedChildren.forEach((child) => resizeObserver?.observe(child));
    cleanupByBody.set(body, () => {
      body.removeEventListener('scroll', update);
      resizeObserver?.unobserve(body);
      observedChildren.forEach((child) => resizeObserver?.unobserve(child));
    });
    update();
  };

  function cleanupDetachedModalBodies() {
    for (const [body, cleanup] of cleanupByBody) {
      if (container.contains(body)) continue;
      cleanup();
      cleanupByBody.delete(body);
    }
  }

  function syncTrackedModalBodies() {
    cleanupDetachedModalBodies();
    cleanupByBody.forEach((_cleanup, body) => updateModalBody(body));
  }

  function attachModalBodiesInSubtree(node: Node) {
    if (!isSourceTreePreviewElement(node)) return;
    if (isSourceTreePreviewHTMLElement(node) && getSourceTreePreviewModalPrefixFromBody(node)) {
      attachModalBody(node);
    }
    node
      .querySelectorAll<HTMLElement>('[class*="-modal__body"]')
      .forEach(attachModalBody);
  }

  function syncModalBodies() {
    cleanupDetachedModalBodies();
    container
      .querySelectorAll<HTMLElement>('[class*="-modal__body"]')
      .forEach(attachModalBody);
  }

  function handleModalBodyMutations(mutationRecords: MutationRecord[]) {
    let shouldCleanup = false;
    for (const record of mutationRecords) {
      if (record.type === 'attributes') {
        attachModalBodiesInSubtree(record.target);
        continue;
      }
      if (record.type !== 'childList') continue;
      if (record.removedNodes.length > 0) shouldCleanup = true;
      record.addedNodes.forEach(attachModalBodiesInSubtree);
    }
    if (shouldCleanup) cleanupDetachedModalBodies();
  }

  syncModalBodies();
  const mutationObserver = ownerWindow.MutationObserver ? new ownerWindow.MutationObserver(handleModalBodyMutations) : null;
  mutationObserver?.observe(container, {
    attributeFilter: ['class'],
    attributes: true,
    childList: true,
    subtree: true,
  });
  ownerWindow.addEventListener('resize', syncTrackedModalBodies);

  return () => {
    mutationObserver?.disconnect();
    ownerWindow.removeEventListener('resize', syncTrackedModalBodies);
    cleanupByBody.forEach((cleanup) => cleanup());
    cleanupByBody.clear();
    resizeObserver?.disconnect();
  };
}

function getSourceTreePreviewModalPrefixFromBody(body: HTMLElement): string | null {
  for (const className of Array.from(body.classList)) {
    const match = /^([\w-]+)-modal__body$/.exec(className);
    if (match) return match[1];
  }
  return null;
}

function findSourceTreePreviewModalFrame(body: HTMLElement, prefix: string, container: HTMLElement): HTMLElement | null {
  let parent = body.parentElement;
  while (parent && parent !== container.parentElement) {
    if (parent.classList.contains(`${prefix}-modal`)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

const SOURCE_TREE_PREVIEW_MODAL_ROOT_SELECTOR = '[data-wb-preview-node-id][class*="-modal-root"]';

const SOURCE_TREE_PREVIEW_MODAL_DISMISS_SELECTOR = [
  '[class*="-modal-overlay"]',
  'button[aria-label="닫기"]',
  'button[aria-label="Close"]',
  '[role="button"][aria-label="닫기"]',
  '[role="button"][aria-label="Close"]',
].join(',');

function isSourceTreePreviewModalRootClassName(className: string): boolean {
  return /\b[\w-]+-modal-root\b/.test(className);
}

function removeSourceTreePreviewClassNameToken(className: string, token: string): string {
  return className.split(/\s+/).filter((part) => part && part !== token).join(' ');
}

function handleSourceTreePreviewModalDismissClick(
  event: ReactMouseEvent<HTMLElement>,
  onDismissPreviewModal: (nodeId: string) => void,
): boolean {
  if (!isSourceTreePreviewElement(event.target)) return false;
  const dismissTarget = event.target.closest(SOURCE_TREE_PREVIEW_MODAL_DISMISS_SELECTOR);
  if (!dismissTarget) return false;
  const modalRoot = event.target.closest(SOURCE_TREE_PREVIEW_MODAL_ROOT_SELECTOR);
  const nodeId = modalRoot?.getAttribute('data-wb-preview-node-id');
  if (!nodeId) return false;
  event.preventDefault();
  event.stopPropagation();
  onDismissPreviewModal(nodeId);
  return true;
}

function getSourceTreePreviewWrapperStyle({
  backgroundVideos,
  isRuntimeWrapper,
  resolvedNodeStyle,
}: {
  backgroundVideos: SourceBackgroundVideoLayer[];
  isRuntimeWrapper: boolean;
  resolvedNodeStyle: CSSProperties | undefined;
}): CSSProperties | undefined {
  const layoutStyle = isRuntimeWrapper ? undefined : normalizeSourceTreePreviewAuthoredWrapperStyle(resolvedNodeStyle);
  if (backgroundVideos.length === 0) return layoutStyle;
  const style = { ...(layoutStyle ?? {}) } as CSSProperties;
  if (!style.position || style.position === 'static') style.position = 'relative';
  if (!style.overflow) style.overflow = 'hidden';
  if (!style.isolation) style.isolation = 'isolate';
  return style;
}

function normalizeSourceTreePreviewAuthoredWrapperStyle(style: CSSProperties | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  if (
    style.width === 'fit-content' &&
    style.flex === undefined &&
    style.flexShrink === undefined
  ) {
    return {
      ...style,
      flexShrink: 0,
    };
  }
  return style;
}

function getSourceTreePreviewBackgroundVideoFit(size: string): CSSProperties['objectFit'] {
  if (size === 'contain') return 'contain';
  if (size === '100% 100%' || size === 'fill') return 'fill';
  if (size === 'auto') return 'none';
  return 'cover';
}

function useProjectSourceRuntimeComponents(root: EditableTreeNode): ProjectSourceRuntimeComponents {
  const [components, setComponents] = useState<ProjectSourceRuntimeComponents>(() => new Map());
  const [runtimeSourceVersion, setRuntimeSourceVersion] = useState(0);
  const imports = useMemo(() => collectProjectRuntimeImports(root), [root]);
  const importSignature = useMemo(() => getProjectRuntimeImportSignature(imports), [imports]);
  const activeSourceFile = root.source?.sourceFile ?? null;
  const componentsRef = useRef(components);

  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  useEffect(() => subscribeWorkbenchProjectChangeEvents((event) => {
    if (isSourceTreePreviewProjectRuntimeSourceChange(event.path, activeSourceFile)) {
      setRuntimeSourceVersion((version) => version + 1);
    }
  }), [activeSourceFile]);

  useEffect(() => {
    let cancelled = false;
    if (imports.length === 0) {
      if (componentsRef.current.size > 0) setComponents(new Map());
      return;
    }

    async function loadProjectRuntimeComponents() {
      const loadingComponents = new Map<string, ProjectSourceRuntimeComponentState>();
      for (const runtimeImport of imports) {
        const currentState = componentsRef.current.get(runtimeImport.key);
        loadingComponents.set(
          runtimeImport.key,
          currentState?.status === 'ready' ? currentState : { runtimeImport, status: 'loading' },
        );
      }
      if (!areProjectRuntimeComponentsEqual(componentsRef.current, loadingComponents)) {
        setComponents(loadingComponents);
      }

      const projectRoot = await fetchWorkbenchProjectRoot();
      if (!projectRoot) {
        if (!cancelled) {
          const nextComponents = new Map(loadingComponents);
          for (const runtimeImport of imports) {
            nextComponents.set(runtimeImport.key, {
              diagnostic: createProjectRuntimeImportDiagnostic(runtimeImport, 'Workbench could not resolve the active project root.'),
              status: 'error',
            });
          }
          setComponents(nextComponents);
        }
        return;
      }

      const importVersion = Date.now();
      const nextComponents = await importProjectRuntimeComponentsBatch(projectRoot, imports, importVersion);
      if (cancelled) return;
      setComponents((current) => (
        areProjectRuntimeComponentsEqual(current, nextComponents)
          ? current
          : nextComponents
      ));
    }

    void loadProjectRuntimeComponents();
    return () => {
      cancelled = true;
    };
  }, [importSignature, runtimeSourceVersion]);

  return components;
}

type ProjectRuntimeImport = {
  importName: string;
  importSource: string;
  key: string;
  sourceFile: string;
};

function collectProjectRuntimeImports(root: EditableTreeNode): ProjectRuntimeImport[] {
  const imports = new Map<string, ProjectRuntimeImport>();

  function visit(node: EditableTreeNode) {
    if (hasProjectSourceRuntimeImport(node)) {
      const sourceFile = node.source?.sourceFile ?? '';
      const importSource = node.source?.importSource ?? '';
      const importName = node.source?.importName ?? node.source?.jsxName ?? 'default';
      const key = getProjectRuntimeComponentKey(sourceFile, importSource, importName);
      imports.set(key, { importName, importSource, key, sourceFile });
    }
    for (const child of getSourceTreePreviewRenderableChildren(node)) visit(child);
  }

  visit(root);
  return [...imports.values()];
}

function hasSourceTreePreviewProjectRuntimeImports(root: EditableTreeNode): boolean {
  let hasRuntimeImport = false;

  function visit(node: EditableTreeNode) {
    if (hasRuntimeImport) return;
    if (hasProjectSourceRuntimeImport(node)) {
      hasRuntimeImport = true;
      return;
    }
    for (const child of getSourceTreePreviewRenderableChildren(node)) visit(child);
  }

  visit(root);
  return hasRuntimeImport;
}

function collectSourceTreePreviewRuntimeDescendantNodeIds(
  root: EditableTreeNode,
  projectRuntimeComponents: ProjectSourceRuntimeComponents,
): Set<string> {
  const nodeIds = new Set<string>();

  function visit(node: EditableTreeNode): boolean {
    let hasRuntimeDescendant = false;
    for (const child of getSourceTreePreviewRenderableChildren(node)) {
      const childHasRuntime = hasProjectSourceRuntimeImport(child) ||
        Boolean(getSourceTreePreviewProjectComponent(child, projectRuntimeComponents)) ||
        visit(child);
      if (childHasRuntime) hasRuntimeDescendant = true;
    }
    if (hasRuntimeDescendant) nodeIds.add(node.id);
    return hasRuntimeDescendant;
  }

  visit(root);
  return nodeIds;
}

function getProjectRuntimeImportSignature(imports: ProjectRuntimeImport[]): string {
  return imports.map((runtimeImport) => runtimeImport.key).sort().join('\n');
}

function getSourceTreePreviewRenderableChildren(node: EditableTreeNode): EditableTreeNode[] {
  const previewChildren = node.sourcePreviewChildren ?? [];
  return previewChildren.length > 0 ? previewChildren : node.children ?? [];
}

function isSourceTreePreviewInlineIconNode(node: EditableTreeNode): boolean {
  if (node.source?.jsxName?.toLowerCase() !== 'svg') return false;
  const attributes = node.sourceAttributes ?? {};
  return attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon' || Boolean(attributes['data-icon']);
}

function areProjectRuntimeComponentsEqual(
  left: ProjectSourceRuntimeComponents,
  right: ProjectSourceRuntimeComponents,
): boolean {
  if (left.size !== right.size) return false;
  for (const [key, state] of right) {
    const leftState = left.get(key);
    if (!leftState || !areProjectRuntimeComponentStatesEqual(leftState, state)) return false;
  }
  return true;
}

function areProjectRuntimeComponentStatesEqual(
  left: ProjectSourceRuntimeComponentState,
  right: ProjectSourceRuntimeComponentState,
): boolean {
  if (left.status !== right.status) return false;
  if (left.status === 'ready' && right.status === 'ready') return left.component === right.component;
  if (left.status === 'loading' && right.status === 'loading') return left.runtimeImport.key === right.runtimeImport.key;
  if (left.status === 'error' && right.status === 'error') {
    return left.diagnostic.importName === right.diagnostic.importName &&
      left.diagnostic.importSource === right.diagnostic.importSource &&
      left.diagnostic.sourceFile === right.diagnostic.sourceFile &&
      left.diagnostic.reason === right.diagnostic.reason &&
      getProjectRuntimeDiagnosticCandidateSignature(left.diagnostic) === getProjectRuntimeDiagnosticCandidateSignature(right.diagnostic);
  }
  return false;
}

function getProjectRuntimeDiagnosticCandidateSignature(diagnostic: ProjectRuntimeImportDiagnostic): string {
  return (diagnostic.candidates ?? []).map((candidate) => `${candidate.path}:${candidate.reason}`).join('\n');
}

async function fetchWorkbenchProjectRoot(): Promise<string | null> {
  try {
    const response = await workbenchFetch('/__workbench/project.json');
    if (!response.ok) return null;
    const location = await response.json() as WorkbenchProjectLocation;
    return typeof location.rootPath === 'string' && location.rootPath.length > 0 ? location.rootPath : null;
  } catch {
    return null;
  }
}

type ProjectRuntimeBundleManifest = {
  failures?: Array<{ key?: unknown; reason?: unknown }>;
  imports?: Array<{ exportName?: unknown; key?: unknown }>;
  moduleUrl?: unknown;
  ok?: unknown;
};

async function importProjectRuntimeComponentsBatch(
  projectRoot: string,
  imports: ProjectRuntimeImport[],
  importVersion: number,
): Promise<ProjectSourceRuntimeComponents> {
  const components = new Map<string, ProjectSourceRuntimeComponentState>();
  const projectLocalImports: ProjectRuntimeImport[] = [];
  const moduleCache = new Map<string, Promise<ProjectRuntimeModuleResult>>();

  await Promise.all(imports.map(async (runtimeImport) => {
    if (isTablerIconRuntimeImport(runtimeImport)) {
      components.set(
        runtimeImport.key,
        await importTablerIconRuntimeComponent(projectRoot, runtimeImport, moduleCache, importVersion),
      );
      return;
    }
    if (!isProjectLocalImportSource(runtimeImport.importSource)) {
      components.set(runtimeImport.key, {
        diagnostic: createProjectRuntimeImportDiagnostic(
          runtimeImport,
          'Only project-local imports and Tabler icon imports can be rendered as runtime components in the design canvas.',
        ),
        status: 'error',
      });
      return;
    }
    projectLocalImports.push(runtimeImport);
  }));

  if (projectLocalImports.length === 0) return components;

  try {
    const response = await workbenchFetch(PROJECT_RUNTIME_BUNDLE_MANIFEST_PATH, {
      body: JSON.stringify({
        imports: projectLocalImports.map(({ importSource, key, sourceFile }) => ({
          importSource,
          key,
          // A node can still carry an absolute source path from the project
          // opened at another location; the host resolves the import against
          // the active project root, so send the project-relative reference.
          sourceFile: normalizeProjectSourceFileReference(sourceFile) || sourceFile,
        })),
      }),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!response.ok) throw new Error(await response.text() || `Runtime bundle request failed (${response.status})`);
    const manifest = await response.json() as ProjectRuntimeBundleManifest;
    if (manifest.ok !== true || typeof manifest.moduleUrl !== 'string') {
      throw new Error('Workbench did not return a project runtime bundle.');
    }
    // Runtime bundle URLs are content-addressed by the host. Import the stable
    // URL so duplicate or unrelated project-change events reuse the existing
    // module namespace instead of replacing every component type after an
    // asynchronous rebuild and remounting stateful preview subtrees.
    const runtimeModule = await import(/* @vite-ignore */ manifest.moduleUrl) as Record<string, unknown>;
    const exportsByKey = new Map<string, string>();
    for (const entry of manifest.imports ?? []) {
      if (typeof entry.key === 'string' && typeof entry.exportName === 'string') {
        exportsByKey.set(entry.key, entry.exportName);
      }
    }
    const failuresByKey = new Map<string, string>();
    for (const failure of manifest.failures ?? []) {
      if (typeof failure.key === 'string' && typeof failure.reason === 'string') {
        failuresByKey.set(failure.key, failure.reason);
      }
    }

    for (const runtimeImport of projectLocalImports) {
      const exportName = exportsByKey.get(runtimeImport.key);
      const namespace = exportName ? runtimeModule[exportName] : null;
      const exported = namespace && typeof namespace === 'object'
        ? (namespace as Record<string, unknown>)[runtimeImport.importName]
        : null;
      if (isProjectRuntimeComponentExport(exported)) {
        components.set(runtimeImport.key, { component: exported, status: 'ready' });
        continue;
      }
      components.set(runtimeImport.key, {
        diagnostic: createProjectRuntimeImportDiagnostic(
          runtimeImport,
          failuresByKey.get(runtimeImport.key) ?? `Export "${runtimeImport.importName}" is not a React or Vue component.`,
        ),
        status: 'error',
      });
    }
  } catch (error) {
    const reason = getProjectRuntimeImportErrorMessage(error);
    for (const runtimeImport of projectLocalImports) {
      components.set(runtimeImport.key, {
        diagnostic: createProjectRuntimeImportDiagnostic(runtimeImport, reason),
        status: 'error',
      });
    }
  }

  return components;
}

async function importTablerIconRuntimeComponent(
  projectRoot: string,
  runtimeImport: ProjectRuntimeImport,
  moduleCache: Map<string, Promise<ProjectRuntimeModuleResult>>,
  importVersion: number,
): Promise<ProjectSourceRuntimeComponentState> {
  const bundledIconModuleLoader = TABLER_ICON_MODULE_LOADERS[runtimeImport.importName];
  if (bundledIconModuleLoader) {
    try {
      const iconModule = await bundledIconModuleLoader();
      const iconNode = getTablerIconNodeExport(iconModule);
      if (iconNode) {
        return { component: createSourceTreePreviewTablerIconComponent(runtimeImport.importName, iconNode), status: 'ready' };
      }
    } catch {
      // Fall back to the filesystem candidate diagnostics below.
    }
  }

  const importPaths = getTablerIconRuntimeImportCandidates(projectRoot, runtimeImport.importName);
  if (importPaths.length === 0) {
    return {
      diagnostic: createProjectRuntimeImportDiagnostic(runtimeImport, 'Unsupported Tabler icon import name.'),
      status: 'error',
    };
  }

  const failures: ProjectRuntimeImportDiagnostic['candidates'] = [];
  for (const importPath of importPaths) {
    const result = await importProjectRuntimeModule(projectRoot, importPath, moduleCache, importVersion, runtimeImport.importName);
    if (result.status === 'error') {
      failures.push({ path: importPath, reason: result.reason });
      continue;
    }

    const iconNode = getTablerIconNodeExport(result.module);
    if (iconNode) {
      return { component: createSourceTreePreviewTablerIconComponent(runtimeImport.importName, iconNode), status: 'ready' };
    }

    failures.push({
      path: importPath,
      reason: `Export "${runtimeImport.importName}" does not include Tabler icon node data.`,
    });
  }

  return {
    diagnostic: createProjectRuntimeImportDiagnostic(
      runtimeImport,
      failures[0]?.reason ?? 'Workbench could not import this Tabler icon.',
      failures,
    ),
    status: 'error',
  };
}

function getTablerIconNodeExport(module: Record<string, unknown>): TablerIconNode[] | null {
  const iconNode = module.__iconNode;
  if (!Array.isArray(iconNode)) return null;
  return iconNode.filter((entry): entry is TablerIconNode => (
    Array.isArray(entry) &&
    typeof entry[0] === 'string' &&
    entry[1] !== null &&
    typeof entry[1] === 'object'
  ));
}

function createSourceTreePreviewTablerIconComponent(
  importName: string,
  iconNode: TablerIconNode[],
): ElementType<Record<string, unknown>> {
  const iconSlug = importName.replace(/^Icon/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const TablerIconPreview = (props: Record<string, unknown>) => {
    const {
      className,
      color = 'currentColor',
      size = 24,
      stroke = 2,
      style,
      title,
      ...svgProps
    } = props;
    const dimension = typeof size === 'number' || typeof size === 'string' ? size : 24;
    return (
      <svg
        {...svgProps}
        aria-hidden={title ? undefined : true}
        className={['tabler-icon', `tabler-icon-${iconSlug}`, typeof className === 'string' ? className : ''].filter(Boolean).join(' ')}
        fill="none"
        focusable="false"
        height={dimension}
        role={title ? 'img' : undefined}
        stroke={typeof color === 'string' ? color : 'currentColor'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={typeof stroke === 'number' || typeof stroke === 'string' ? stroke : 2}
        style={isSourceTreePreviewRecord(style) ? style as CSSProperties : undefined}
        viewBox="0 0 24 24"
        width={dimension}
        xmlns="http://www.w3.org/2000/svg"
      >
        {typeof title === 'string' && title ? <title>{title}</title> : null}
        {iconNode.map(([tag, attrs], index) => createElement(tag, { ...attrs, key: getTablerIconNodeKey(attrs, index) }))}
      </svg>
    );
  };
  (TablerIconPreview as { [TABLER_ICON_RENDERER_PROP]?: true })[TABLER_ICON_RENDERER_PROP] = true;
  return TablerIconPreview;
}

function getTablerIconNodeKey(attrs: Record<string, unknown>, index: number): string {
  return typeof attrs.key === 'string' ? attrs.key : `svg-${index}`;
}

function isSourceTreePreviewRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function importProjectRuntimeModule(
  projectRoot: string,
  candidate: string,
  moduleCache: Map<string, Promise<ProjectRuntimeModuleResult>>,
  importVersion: number,
  importName: string,
): Promise<ProjectRuntimeModuleResult> {
  const cacheKey = candidate;
  const cached = moduleCache.get(cacheKey);
  if (cached) return cached;

  const moduleUrl = toProjectRuntimeModuleUrl(projectRoot, candidate, importVersion, importName);
  const request = import(/* @vite-ignore */ moduleUrl)
    .then((module) => ({ module: module as Record<string, unknown>, status: 'ok' as const }))
    .catch((error) => {
      const reason = getProjectRuntimeImportErrorMessage(error);
      console.warn(`Workbench source preview could not import project runtime module: ${candidate}`, error);
      return { reason, status: 'error' as const };
    });
  moduleCache.set(cacheKey, request);
  return request;
}

const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
const REACT_MEMO_TYPE = Symbol.for('react.memo');

function isProjectRuntimeComponentExport(value: unknown): value is ElementType<Record<string, unknown>> {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  const reactType = (value as { $$typeof?: unknown }).$$typeof;
  return reactType === REACT_FORWARD_REF_TYPE || reactType === REACT_MEMO_TYPE;
}

function createProjectRuntimeImportDiagnostic(
  runtimeImport: ProjectRuntimeImport,
  reason: string,
  candidates?: ProjectRuntimeImportDiagnostic['candidates'],
): ProjectRuntimeImportDiagnostic {
  return {
    candidates,
    importName: runtimeImport.importName,
    importSource: runtimeImport.importSource,
    reason,
    sourceFile: runtimeImport.sourceFile,
  };
}

function getProjectRuntimeImportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Unknown runtime import error.';
}

function getTablerIconRuntimeImportCandidates(projectRoot: string, importName: string): string[] {
  if (!isSupportedTablerIconImportName(importName)) return [];
  return getIconRuntimePackageRootCandidates(projectRoot)
    .map((root) => normalizeProjectRuntimePath(`${root}/node_modules/@tabler/icons-react/dist/esm/icons/${importName}.mjs`));
}

function isSupportedTablerIconImportName(importName: string): boolean {
  return /^Icon[A-Z][A-Za-z0-9]*$/.test(importName);
}

function getProjectRuntimeAncestorPaths(path: string): string[] {
  const roots: string[] = [];
  let current = normalizeProjectRuntimePath(path);
  for (let depth = 0; depth < 8 && current; depth += 1) {
    roots.push(current);
    const next = current.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';
    if (next === current) break;
    current = next;
  }
  return roots;
}

function getIconRuntimePackageRootCandidates(projectRoot: string): string[] {
  const normalizedProjectRoot = normalizeProjectRuntimePath(projectRoot);
  const projectContainerRoot = getProjectRuntimeContainerRoot(normalizedProjectRoot);
  const roots = [
    ...(projectContainerRoot ? [projectContainerRoot] : []),
    ...getProjectRuntimeAncestorPaths(normalizedProjectRoot),
  ];
  return [...new Set(roots)];
}

function getProjectRuntimeContainerRoot(projectRoot: string): string | null {
  const marker = '/projects/';
  const markerIndex = projectRoot.indexOf(marker);
  if (markerIndex < 0) return null;
  return projectRoot.slice(0, markerIndex) || null;
}

function getPathFileName(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}

function normalizeProjectRuntimePath(path: string): string {
  const absolute = path.startsWith('/');
  const segments: string[] = [];
  for (const segment of path.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return `${absolute ? '/' : ''}${segments.join('/')}`;
}

function toViteFsUrl(path: string): string {
  return toWorkbenchPreviewUrl(`/@fs${path.split('/').map(encodeURIComponent).join('/')}`);
}

function toProjectRuntimeModuleUrl(
  projectRoot: string,
  path: string,
  importVersion?: number,
  importName?: string,
): string {
  void projectRoot;
  const moduleUrl = toViteFsUrl(path);
  if (!importVersion) return moduleUrl;
  const separator = moduleUrl.includes('?') ? '&' : '?';
  return `${moduleUrl}${separator}wbRuntimeImport=${encodeURIComponent(`${importVersion}:${importName ?? 'default'}`)}`;
}

function SourceTreePreviewSelectionOverlay({
  containerRef,
  dragActive = false,
  layoutKey,
  root,
  selectedLayerId,
  selectedLayerIds,
  variant = 'selection',
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  dragActive?: boolean;
  layoutKey: unknown;
  root: EditableTreeNode;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  variant?: 'hover' | 'note-link' | 'selection' | 'source-preview';
}) {
  const [rects, setRects] = useState<SourceTreePreviewOverlayRect[]>([]);
  const [topLayerOverlays, setTopLayerOverlays] = useState<SourceTreePreviewTopLayerOverlay[]>([]);
  const [labelOverlay, setLabelOverlay] = useState<SourceTreePreviewSelectionLabelOverlay | null>(null);
  const rectsRef = useRef<SourceTreePreviewOverlayRect[]>([]);
  const topLayerOverlaysRef = useRef<SourceTreePreviewTopLayerOverlay[]>([]);
  const labelOverlayRef = useRef<SourceTreePreviewSelectionLabelOverlay | null>(null);
  const selectedLayerKey = getSourceTreePreviewSelectedLayerKey(selectedLayerId, selectedLayerIds);
  const selectionLabel = (variant === 'selection' || variant === 'hover') && selectedLayerId
    ? getSourceTreePreviewSelectionLabel(findSourceTreePreviewLayerNode(root, selectedLayerId))
    : null;

  useLayoutEffect(() => {
    const layerIds = getSourceTreePreviewSelectedLayerIds(selectedLayerId, selectedLayerIds);
    if (layerIds.length === 0) {
      if (rectsRef.current.length > 0 || topLayerOverlaysRef.current.length > 0 || labelOverlayRef.current) {
        rectsRef.current = [];
        topLayerOverlaysRef.current = [];
        labelOverlayRef.current = null;
        setRects([]);
        setTopLayerOverlays([]);
        setLabelOverlay(null);
      }
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      if (rectsRef.current.length > 0 || topLayerOverlaysRef.current.length > 0 || labelOverlayRef.current) {
        rectsRef.current = [];
        topLayerOverlaysRef.current = [];
        labelOverlayRef.current = null;
        setRects([]);
        setTopLayerOverlays([]);
        setLabelOverlay(null);
      }
      return undefined;
    }

    const ownerWindow = getSourceTreePreviewAnimationWindow(container);
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const MutationObserverCtor = ownerWindow.MutationObserver ?? MutationObserver;
    let frameId: number | null = null;
    const commitSnapshot = (nextSnapshot: SourceTreePreviewSelectionOverlaySnapshot) => {
      if (
        areOverlayRectsEqual(rectsRef.current, nextSnapshot.rects)
        && areTopLayerOverlaysEqual(topLayerOverlaysRef.current, nextSnapshot.topLayerOverlays)
        && areSelectionLabelOverlaysEqual(labelOverlayRef.current, nextSnapshot.labelOverlay)
      ) {
        return;
      }
      rectsRef.current = nextSnapshot.rects;
      topLayerOverlaysRef.current = nextSnapshot.topLayerOverlays;
      labelOverlayRef.current = nextSnapshot.labelOverlay;
      setRects(nextSnapshot.rects);
      setTopLayerOverlays(nextSnapshot.topLayerOverlays);
      setLabelOverlay(nextSnapshot.labelOverlay);
    };
    const update = () => {
      frameId = null;
      commitSnapshot(getSelectionOverlaySnapshot(container, layerIds, selectedLayerId, root, selectionLabel));
      // WAAPI FLIP transitions change getBoundingClientRect() every frame
      // without producing ResizeObserver or MutationObserver notifications.
      // Once drag chrome is released (commit or Escape), follow that short
      // interpolation through its final frame so the visible selection ring
      // cannot remain at the transition's starting coordinates.
      if (
        !container.classList.contains('wb-source-visual-node-drag-active') &&
        container.ownerDocument.querySelector(`[${SOURCE_TREE_PREVIEW_LAYOUT_TRANSITION_ATTRIBUTE}]`)
      ) {
        frameId = ownerWindow.requestAnimationFrame(update);
      }
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = ownerWindow.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserverCtor(scheduleUpdate);
    const mutationObserver = new MutationObserverCtor(scheduleUpdate);
    const resizeTargets = layerIds.flatMap((layerId) => (
      getSourceTreePreviewOverlayLayerIds(container, root, layerId)
        .flatMap((overlayLayer) => getPreviewNodeResizeTargets(container, overlayLayer.layerId))
    ));
    resizeObserver.observe(container);
    resizeTargets.forEach((element) => resizeObserver.observe(element));
    observeSourceTreePreviewOverlayMutationTargets(mutationObserver, container, resizeTargets);
    container.addEventListener('scroll', scheduleUpdate, true);
    ownerWindow.addEventListener('resize', scheduleUpdate);
    update();

    return () => {
      if (frameId !== null) ownerWindow.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', scheduleUpdate, true);
      ownerWindow.removeEventListener('resize', scheduleUpdate);
    };
  }, [containerRef, dragActive, layoutKey, root, selectedLayerId, selectedLayerKey, selectionLabel]);

  if (rects.length === 0 && topLayerOverlays.length === 0 && !labelOverlay) return null;

  return (
    <>
      {rects.length > 0 ? (
        <SourceTreePreviewSelectionOverlayLayer
          rects={rects}
          variant={variant}
        />
      ) : null}
      {topLayerOverlays.map((overlay, index) => createPortal(
        <SourceTreePreviewSelectionOverlayLayer
          rects={overlay.rects}
          topLayer
          variant={variant}
        />,
        overlay.host,
        `${index}:${overlay.rects.map((rect) => `${rect.left}:${rect.top}:${rect.width}:${rect.height}`).join('|')}`,
      ))}
      {selectionLabel && labelOverlay ? createPortal(
        <span
          aria-hidden="true"
          className="wb-source-visual-selection-label"
          data-variant={variant === 'hover' ? 'hover' : undefined}
          style={{
            maxWidth: labelOverlay.maxWidth,
            transform: `translate(${labelOverlay.left}px, ${labelOverlay.top}px)`,
          }}
        >
          {selectionLabel}
        </span>,
        labelOverlay.host,
        `selection-label:${selectedLayerId}`,
      ) : null}
    </>
  );
}

function getSourceTreePreviewSelectionLabel(node: EditableTreeNode | null): string | null {
  if (!node) return null;
  const literalLabel = node.sourceProps?.label;
  const jsxLabel = node.sourceJsxProps?.label;
  const authoredLabel = typeof literalLabel === 'string'
    ? literalLabel
    : typeof jsxLabel === 'string'
      ? jsxLabel.replace(/^(['"`])([\s\S]*)\1$/, '$2').trim()
      : '';
  if (!authoredLabel || node.label.toLocaleLowerCase().includes(authoredLabel.toLocaleLowerCase())) {
    return node.label;
  }
  return `${node.label} · ${authoredLabel}`;
}

function getSourceTreePreviewExpressionTooltip(code: string): string {
  const normalizedCode = code.replace(/\s+/g, ' ').trim();
  const summary = normalizedCode.length > 220
    ? `${normalizedCode.slice(0, 217)}...`
    : normalizedCode;
  return `Source expression: ${summary}\nSelect to inspect Binding.`;
}

function scrollSourceTreePreviewSelectionIntoView(
  container: HTMLElement,
  root: EditableTreeNode,
  selectedLayerId: string,
): boolean {
  const viewport = container.getBoundingClientRect();
  const boundaryRect = getSourceTreePreviewVirtualBoundaryRect(container, root, selectedLayerId);
  const overlayLayerIds = getSourceTreePreviewOverlayLayerIds(container, root, selectedLayerId);
  const candidateRects = boundaryRect
    ? [boundaryRect]
    : overlayLayerIds.flatMap(({ layerId }) => (
        getPreviewNodeElements(container, layerId)
          .filter((element) => container.contains(element))
          .map((element) => getSourceTreePreviewSelectionVisualRect(element, container)
            ?? getSourceTreePreviewFallbackVisualRect(element, container))
          .filter((rect): rect is DOMRect => Boolean(rect && rect.width > 0 && rect.height > 0))
      ));
  const targetRect = getSourceTreePreviewSelectionLabelAnchorRect(container, candidateRects);
  if (!targetRect) return false;

  const inset = Math.min(32, Math.max(12, Math.min(viewport.width, viewport.height) * 0.06));
  const visibleTop = viewport.top + inset;
  const visibleRight = viewport.right - inset;
  const visibleBottom = viewport.bottom - inset;
  const visibleLeft = viewport.left + inset;
  /* Scroll only when the selection is entirely out of view, and align its
     leading edge instead of its centre. A node that is already partially
     visible — a page-height section, a wide stack — must not move the canvas:
     recentring on every ordinary click made selection feel like it yanked the
     page out from under the pointer. */
  const hiddenVertically = targetRect.bottom < visibleTop || targetRect.top > visibleBottom;
  const hiddenHorizontally = targetRect.right < visibleLeft || targetRect.left > visibleRight;
  if (!hiddenVertically && !hiddenHorizontally) return true;

  const nextTop = hiddenVertically
    ? container.scrollTop + targetRect.top - visibleTop
    : container.scrollTop;
  const nextLeft = hiddenHorizontally
    ? container.scrollLeft + targetRect.left - visibleLeft
    : container.scrollLeft;
  container.scrollTo({ behavior: 'auto', left: nextLeft, top: nextTop });
  return true;
}

function SourceTreePreviewSelectionOverlayLayer({
  rects,
  topLayer = false,
  variant,
}: {
  rects: SourceTreePreviewOverlayRect[];
  topLayer?: boolean;
  variant: 'hover' | 'note-link' | 'selection' | 'source-preview';
}) {
  return (
    <div
      className={[
        'wb-source-visual-selection-overlay',
        topLayer ? 'wb-source-visual-selection-overlay--top-layer' : '',
        variant === 'note-link' ? 'wb-source-visual-selection-overlay--note-link' : '',
        variant === 'hover' ? 'wb-source-visual-selection-overlay--hover' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {rects.map((rect, index) => (
        <span
          className={[
            'wb-source-visual-selection-ring',
            rect.primary ? 'wb-source-visual-selection-ring--primary' : 'wb-source-visual-selection-ring--secondary',
            rect.root ? 'wb-source-visual-selection-ring--root' : '',
            variant === 'note-link' ? 'wb-source-visual-selection-ring--note-link' : '',
            variant === 'source-preview' ? 'wb-source-visual-selection-ring--source-preview' : '',
            variant === 'hover' ? 'wb-source-visual-selection-ring--hover' : '',
          ].filter(Boolean).join(' ')}
          key={`${rect.left}:${rect.top}:${rect.width}:${rect.height}:${index}`}
          style={{
            height: rect.height,
            transform: `translate(${rect.left}px, ${rect.top}px)`,
            width: rect.width,
          }}
        />
      ))}
    </div>
  );
}

function SourceTreePreviewMeasurementOverlay({
  containerRef,
  hoveredLayerId,
  layoutKey,
  selectedLayerId,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  hoveredLayerId: string | null;
  layoutKey: unknown;
  selectedLayerId: string | null;
}) {
  const [snapshot, setSnapshot] = useState<SourceTreePreviewMeasurementSnapshot>({ bands: [], lines: [] });
  const snapshotRef = useRef(snapshot);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !hoveredLayerId) {
      if (snapshotRef.current.bands.length > 0 || snapshotRef.current.lines.length > 0) {
        const emptySnapshot = { bands: [], lines: [] };
        snapshotRef.current = emptySnapshot;
        setSnapshot(emptySnapshot);
      }
      return undefined;
    }

    const ownerWindow = getSourceTreePreviewAnimationWindow(container);
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const MutationObserverCtor = ownerWindow.MutationObserver ?? MutationObserver;
    let frameId: number | null = null;
    const update = () => {
      frameId = null;
      const nextSnapshot = getSourceTreePreviewMeasurementSnapshot(
        container,
        selectedLayerId,
        hoveredLayerId,
      );
      if (areSourceTreePreviewMeasurementSnapshotsEqual(snapshotRef.current, nextSnapshot)) return;
      snapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
    };
    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = ownerWindow.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserverCtor(scheduleUpdate);
    const mutationObserver = new MutationObserverCtor(scheduleUpdate);
    const layerIds = [selectedLayerId, hoveredLayerId].filter((layerId): layerId is string => Boolean(layerId));
    const resizeTargets = layerIds.flatMap((layerId) => getPreviewNodeResizeTargets(container, layerId));
    resizeObserver.observe(container);
    resizeTargets.forEach((element) => resizeObserver.observe(element));
    observeSourceTreePreviewOverlayMutationTargets(mutationObserver, container, resizeTargets);
    container.addEventListener('scroll', scheduleUpdate, true);
    ownerWindow.addEventListener('resize', scheduleUpdate);
    update();

    return () => {
      if (frameId !== null) ownerWindow.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', scheduleUpdate, true);
      ownerWindow.removeEventListener('resize', scheduleUpdate);
    };
  }, [containerRef, hoveredLayerId, layoutKey, selectedLayerId]);

  const container = containerRef.current;
  const host = container
    ? getSourceTreePreviewPortalRoot(container) ?? container.ownerDocument.body
    : null;
  if (!host || (snapshot.bands.length === 0 && snapshot.lines.length === 0)) return null;

  return createPortal(
    <div aria-hidden="true" className="wb-source-visual-measurement-overlay">
      {snapshot.bands.map((band, index) => (
        <span
          className={`wb-source-visual-measurement-band wb-source-visual-measurement-band--${band.kind}`}
          key={`${band.kind}:${band.rect.left}:${band.rect.top}:${index}`}
          style={{
            height: band.rect.height,
            transform: `translate(${band.rect.left}px, ${band.rect.top}px)`,
            width: band.rect.width,
          }}
        >
          {band.showLabel ? <span>{band.label}</span> : null}
        </span>
      ))}
      {snapshot.lines.map((line, index) => (
        <span
          className={[
            'wb-source-visual-measurement-line',
            `wb-source-visual-measurement-line--${line.orientation}`,
            line.kind === 'gap' ? 'wb-source-visual-measurement-line--gap' : '',
            line.kind === 'guide' ? 'wb-source-visual-measurement-line--guide' : '',
          ].filter(Boolean).join(' ')}
          key={`${line.orientation}:${line.x}:${line.y}:${line.length}:${index}`}
          style={{
            height: line.orientation === 'vertical' ? line.length : 1,
            transform: `translate(${line.x}px, ${line.y}px)`,
            width: line.orientation === 'horizontal' ? line.length : 1,
          }}
        >
          {line.label ? <span>{line.label}</span> : null}
        </span>
      ))}
    </div>,
    host,
  );
}

function getSourceTreePreviewMeasurementSnapshot(
  container: HTMLElement,
  selectedLayerId: string | null,
  hoveredLayerId: string,
): SourceTreePreviewMeasurementSnapshot {
  const hoveredElement = getPreviewNodePrimaryElement(container, hoveredLayerId);
  if (!hoveredElement) return { bands: [], lines: [] };
  const measurementElement = getSourceTreePreviewMeasurementElement(hoveredElement, hoveredLayerId);
  const bands = measurementElement === hoveredElement
    ? getSourceTreePreviewBoxModelBands(hoveredElement)
    : [
        ...getSourceTreePreviewBoxModelBands(hoveredElement).filter((band) => band.kind === 'margin'),
        ...getSourceTreePreviewBoxModelBands(measurementElement).filter((band) => band.kind === 'padding'),
      ];
  const internalGapLines = getSourceTreePreviewInternalGapLines(measurementElement);
  if (selectedLayerId === hoveredLayerId) return { bands, lines: internalGapLines };
  if (!selectedLayerId) return { bands, lines: internalGapLines };
  const selectedElement = getPreviewNodePrimaryElement(container, selectedLayerId);
  if (!selectedElement) return { bands, lines: internalGapLines };
  const selectedRect = getPreviewNodeVisualRect(selectedElement);
  const hoveredRect = getPreviewNodeVisualRect(hoveredElement);
  if (!selectedRect || !hoveredRect) return { bands, lines: internalGapLines };
  return {
    bands,
    lines: getSourceTreePreviewUniqueMeasurementLines([
      ...getSourceTreePreviewDistanceLines(selectedElement, selectedRect, hoveredElement, hoveredRect),
      ...internalGapLines,
    ]),
  };
}

function getSourceTreePreviewMeasurementElement(element: HTMLElement, layerId: string): HTMLElement {
  let current = element;
  for (let depth = 0; depth < 4; depth += 1) {
    const style = getSourceTreePreviewComputedStyle(current);
    const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
      .reduce((total, value) => total + Math.max(0, parseSourceTreePreviewPixelValue(value, 0)), 0);
    if (padding > 0) return current;
    if (current.children.length > SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT) return current;
    const visibleChildren = Array.from(current.children).filter((child): child is HTMLElement => (
      isSourceTreePreviewHTMLElement(child) &&
      !shouldIgnoreSourceTreePreviewVisualElement(child) &&
      Boolean(getPreviewNodeVisualRect(child))
    ));
    if (visibleChildren.length !== 1) break;
    const child = visibleChildren[0];
    const childLayerId = getSourceTreePreviewElementNodeId(child);
    if (childLayerId && childLayerId !== layerId) break;
    current = child;
  }
  return current;
}

function getSourceTreePreviewInternalGapLines(element: HTMLElement): SourceTreePreviewMeasurementLine[] {
  const style = getSourceTreePreviewComputedStyle(element);
  if (!style.display.includes('flex') && !style.display.includes('grid')) return [];
  if (element.children.length > SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT) return [];
  const columnGap = Math.max(0, parseSourceTreePreviewPixelValue(style.columnGap, 0));
  const rowGap = Math.max(0, parseSourceTreePreviewPixelValue(style.rowGap, 0));
  if (columnGap <= 0 && rowGap <= 0) return [];
  const childRects = Array.from(element.children).flatMap((child) => {
    if (!isSourceTreePreviewHTMLElement(child) || shouldIgnoreSourceTreePreviewVisualElement(child)) return [];
    if (getSourceTreePreviewComputedStyle(child).position === 'absolute') return [];
    const rect = getPreviewNodeVisualRect(child);
    return rect && rect.width > 0 && rect.height > 0 ? [rect] : [];
  });
  const lines: SourceTreePreviewMeasurementLine[] = [];
  for (let leftIndex = 0; leftIndex < childRects.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < childRects.length; rightIndex += 1) {
      const first = childRects[leftIndex];
      const second = childRects[rightIndex];
      const left = first.left <= second.left ? first : second;
      const right = left === first ? second : first;
      const overlapTop = Math.max(left.top, right.top);
      const overlapBottom = Math.min(left.bottom, right.bottom);
      const horizontalDistance = right.left - left.right;
      if (columnGap > 0 && overlapBottom > overlapTop && Math.abs(horizontalDistance - columnGap) < 0.75) {
        lines.push({
          kind: 'gap',
          label: `gap ${formatSourceTreePreviewMeasurement(horizontalDistance)}`,
          length: normalizeOverlayRectValue(horizontalDistance),
          orientation: 'horizontal',
          x: normalizeOverlayRectValue(left.right),
          y: normalizeOverlayRectValue((overlapTop + overlapBottom) / 2),
        });
      }

      const top = first.top <= second.top ? first : second;
      const bottom = top === first ? second : first;
      const overlapLeft = Math.max(top.left, bottom.left);
      const overlapRight = Math.min(top.right, bottom.right);
      const verticalDistance = bottom.top - top.bottom;
      if (rowGap > 0 && overlapRight > overlapLeft && Math.abs(verticalDistance - rowGap) < 0.75) {
        lines.push({
          kind: 'gap',
          label: `gap ${formatSourceTreePreviewMeasurement(verticalDistance)}`,
          length: normalizeOverlayRectValue(verticalDistance),
          orientation: 'vertical',
          x: normalizeOverlayRectValue((overlapLeft + overlapRight) / 2),
          y: normalizeOverlayRectValue(top.bottom),
        });
      }
    }
  }
  return getSourceTreePreviewUniqueMeasurementLines(lines).slice(0, 8);
}

function getSourceTreePreviewUniqueMeasurementLines(
  lines: SourceTreePreviewMeasurementLine[],
): SourceTreePreviewMeasurementLine[] {
  const keys = new Set<string>();
  return lines.filter((line) => {
    const key = [line.kind, line.orientation, line.x, line.y, line.length].join(':');
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

function getSourceTreePreviewBoxModelBands(element: HTMLElement): SourceTreePreviewMeasurementBand[] {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return [];
  const style = getSourceTreePreviewComputedStyle(element);
  const border = {
    bottom: parseSourceTreePreviewPixelValue(style.borderBottomWidth, 0),
    left: parseSourceTreePreviewPixelValue(style.borderLeftWidth, 0),
    right: parseSourceTreePreviewPixelValue(style.borderRightWidth, 0),
    top: parseSourceTreePreviewPixelValue(style.borderTopWidth, 0),
  };
  const padding = {
    bottom: Math.max(0, parseSourceTreePreviewPixelValue(style.paddingBottom, 0)),
    left: Math.max(0, parseSourceTreePreviewPixelValue(style.paddingLeft, 0)),
    right: Math.max(0, parseSourceTreePreviewPixelValue(style.paddingRight, 0)),
    top: Math.max(0, parseSourceTreePreviewPixelValue(style.paddingTop, 0)),
  };
  const margin = {
    bottom: Math.max(0, parseSourceTreePreviewPixelValue(style.marginBottom, 0)),
    left: Math.max(0, parseSourceTreePreviewPixelValue(style.marginLeft, 0)),
    right: Math.max(0, parseSourceTreePreviewPixelValue(style.marginRight, 0)),
    top: Math.max(0, parseSourceTreePreviewPixelValue(style.marginTop, 0)),
  };
  const bands: SourceTreePreviewMeasurementBand[] = [];
  const addBand = (
    kind: SourceTreePreviewMeasurementBand['kind'],
    value: number,
    bandRect: { height: number; left: number; top: number; width: number },
  ) => {
    if (value <= 0 || bandRect.width <= 0 || bandRect.height <= 0) return;
    bands.push({
      kind,
      label: `${kind === 'padding' ? 'p' : 'm'} ${formatSourceTreePreviewMeasurement(value)}`,
      rect: {
        height: normalizeOverlayRectValue(bandRect.height),
        left: normalizeOverlayRectValue(bandRect.left),
        top: normalizeOverlayRectValue(bandRect.top),
        width: normalizeOverlayRectValue(bandRect.width),
      },
      showLabel: Math.min(bandRect.width, bandRect.height) >= 12 && Math.max(bandRect.width, bandRect.height) >= 44,
    });
  };

  addBand('margin', margin.top, {
    height: margin.top,
    left: rect.left - margin.left,
    top: rect.top - margin.top,
    width: rect.width + margin.left + margin.right,
  });
  addBand('margin', margin.bottom, {
    height: margin.bottom,
    left: rect.left - margin.left,
    top: rect.bottom,
    width: rect.width + margin.left + margin.right,
  });
  addBand('margin', margin.left, { height: rect.height, left: rect.left - margin.left, top: rect.top, width: margin.left });
  addBand('margin', margin.right, { height: rect.height, left: rect.right, top: rect.top, width: margin.right });

  const innerLeft = rect.left + border.left;
  const innerTop = rect.top + border.top;
  const innerWidth = Math.max(0, rect.width - border.left - border.right);
  const innerHeight = Math.max(0, rect.height - border.top - border.bottom);
  addBand('padding', padding.top, { height: padding.top, left: innerLeft, top: innerTop, width: innerWidth });
  addBand('padding', padding.bottom, {
    height: padding.bottom,
    left: innerLeft,
    top: innerTop + innerHeight - padding.bottom,
    width: innerWidth,
  });
  addBand('padding', padding.left, {
    height: Math.max(0, innerHeight - padding.top - padding.bottom),
    left: innerLeft,
    top: innerTop + padding.top,
    width: padding.left,
  });
  addBand('padding', padding.right, {
    height: Math.max(0, innerHeight - padding.top - padding.bottom),
    left: innerLeft + innerWidth - padding.right,
    top: innerTop + padding.top,
    width: padding.right,
  });
  return bands;
}

function getSourceTreePreviewDistanceLines(
  selectedElement: HTMLElement,
  selectedRect: DOMRect,
  hoveredElement: HTMLElement,
  hoveredRect: DOMRect,
): SourceTreePreviewMeasurementLine[] {
  const lines: SourceTreePreviewMeasurementLine[] = [];
  const horizontalDistance = getSourceTreePreviewAxisDistance(
    selectedRect.left,
    selectedRect.right,
    hoveredRect.left,
    hoveredRect.right,
  );
  const verticalDistance = getSourceTreePreviewAxisDistance(
    selectedRect.top,
    selectedRect.bottom,
    hoveredRect.top,
    hoveredRect.bottom,
  );
  const hoveredCenterX = hoveredRect.left + hoveredRect.width / 2;
  const hoveredCenterY = hoveredRect.top + hoveredRect.height / 2;
  const sharedParent = getSourceTreePreviewSharedLayoutParent(selectedElement, hoveredElement);
  const parentStyle = sharedParent ? getSourceTreePreviewComputedStyle(sharedParent) : null;

  if (horizontalDistance && horizontalDistance.length > 0) {
    const parentGap = parentStyle ? parseSourceTreePreviewPixelValue(parentStyle.columnGap, 0) : 0;
    const isGap = horizontalDistance.external && parentGap > 0 && Math.abs(parentGap - horizontalDistance.length) < 0.75;
    lines.push({
      kind: isGap ? 'gap' : 'distance',
      label: `${isGap ? 'gap ' : ''}${formatSourceTreePreviewMeasurement(horizontalDistance.length)}`,
      length: normalizeOverlayRectValue(horizontalDistance.length),
      orientation: 'horizontal',
      x: normalizeOverlayRectValue(Math.min(horizontalDistance.selectedBoundary, horizontalDistance.hoveredBoundary)),
      y: normalizeOverlayRectValue(hoveredCenterY),
    });
    const selectedConnectionY = clampSourceTreePreviewRange(hoveredCenterY, selectedRect.top, selectedRect.bottom);
    const guideLength = Math.abs(selectedConnectionY - hoveredCenterY);
    if (guideLength > 0.5) {
      lines.push({
        kind: 'guide',
        label: null,
        length: normalizeOverlayRectValue(guideLength),
        orientation: 'vertical',
        x: normalizeOverlayRectValue(horizontalDistance.selectedBoundary),
        y: normalizeOverlayRectValue(Math.min(selectedConnectionY, hoveredCenterY)),
      });
    }
  }
  if (verticalDistance && verticalDistance.length > 0) {
    const parentGap = parentStyle ? parseSourceTreePreviewPixelValue(parentStyle.rowGap, 0) : 0;
    const isGap = verticalDistance.external && parentGap > 0 && Math.abs(parentGap - verticalDistance.length) < 0.75;
    lines.push({
      kind: isGap ? 'gap' : 'distance',
      label: `${isGap ? 'gap ' : ''}${formatSourceTreePreviewMeasurement(verticalDistance.length)}`,
      length: normalizeOverlayRectValue(verticalDistance.length),
      orientation: 'vertical',
      x: normalizeOverlayRectValue(hoveredCenterX),
      y: normalizeOverlayRectValue(Math.min(verticalDistance.selectedBoundary, verticalDistance.hoveredBoundary)),
    });
    const selectedConnectionX = clampSourceTreePreviewRange(hoveredCenterX, selectedRect.left, selectedRect.right);
    const guideLength = Math.abs(selectedConnectionX - hoveredCenterX);
    if (guideLength > 0.5) {
      lines.push({
        kind: 'guide',
        label: null,
        length: normalizeOverlayRectValue(guideLength),
        orientation: 'horizontal',
        x: normalizeOverlayRectValue(Math.min(selectedConnectionX, hoveredCenterX)),
        y: normalizeOverlayRectValue(verticalDistance.selectedBoundary),
      });
    }
  }
  return lines;
}

function getSourceTreePreviewAxisDistance(
  selectedStart: number,
  selectedEnd: number,
  hoveredStart: number,
  hoveredEnd: number,
): {
  external: boolean;
  hoveredBoundary: number;
  length: number;
  selectedBoundary: number;
} | null {
  if (selectedEnd <= hoveredStart) {
    return {
      external: true,
      hoveredBoundary: hoveredStart,
      length: hoveredStart - selectedEnd,
      selectedBoundary: selectedEnd,
    };
  }
  if (hoveredEnd <= selectedStart) {
    return {
      external: true,
      hoveredBoundary: hoveredEnd,
      length: selectedStart - hoveredEnd,
      selectedBoundary: selectedStart,
    };
  }

  const selectedContainsHovered = selectedStart <= hoveredStart && hoveredEnd <= selectedEnd;
  const hoveredContainsSelected = hoveredStart <= selectedStart && selectedEnd <= hoveredEnd;
  if (!selectedContainsHovered && !hoveredContainsSelected) return null;
  const startDistance = Math.abs(hoveredStart - selectedStart);
  const endDistance = Math.abs(selectedEnd - hoveredEnd);
  const useStart = startDistance > 0.5 && (endDistance <= 0.5 || startDistance <= endDistance);
  const useEnd = endDistance > 0.5;
  if (!useStart && !useEnd) return null;
  return useStart
    ? {
        external: false,
        hoveredBoundary: hoveredStart,
        length: startDistance,
        selectedBoundary: selectedStart,
      }
    : {
        external: false,
        hoveredBoundary: hoveredEnd,
        length: endDistance,
        selectedBoundary: selectedEnd,
      };
}

function getSourceTreePreviewSharedLayoutParent(
  selectedElement: HTMLElement,
  hoveredElement: HTMLElement,
): HTMLElement | null {
  let parent = selectedElement.parentElement;
  while (parent) {
    if (parent.contains(hoveredElement)) {
      const style = getSourceTreePreviewComputedStyle(parent);
      if (style.display.includes('flex') || style.display.includes('grid')) {
        const selectedItem = Array.from(parent.children).find((child) => child === selectedElement || child.contains(selectedElement));
        const hoveredItem = Array.from(parent.children).find((child) => child === hoveredElement || child.contains(hoveredElement));
        if (selectedItem && hoveredItem && selectedItem !== hoveredItem) return parent;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}

function formatSourceTreePreviewMeasurement(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}px`;
}

function areSourceTreePreviewMeasurementSnapshotsEqual(
  left: SourceTreePreviewMeasurementSnapshot,
  right: SourceTreePreviewMeasurementSnapshot,
): boolean {
  if (left.bands.length !== right.bands.length || left.lines.length !== right.lines.length) return false;
  const bandsEqual = left.bands.every((band, index) => {
    const other = right.bands[index];
    return Boolean(other) && band.kind === other.kind && band.label === other.label && band.showLabel === other.showLabel &&
      areOverlayRectsEqual([band.rect], [other.rect]);
  });
  if (!bandsEqual) return false;
  return left.lines.every((line, index) => {
    const other = right.lines[index];
    return Boolean(other) && line.kind === other.kind && line.label === other.label && line.orientation === other.orientation &&
      Math.abs(line.length - other.length) < 0.5 && Math.abs(line.x - other.x) < 0.5 && Math.abs(line.y - other.y) < 0.5;
  });
}

function observeSourceTreePreviewOverlayMutationTargets(
  mutationObserver: MutationObserver,
  container: HTMLElement,
  resizeTargets: HTMLElement[],
) {
  const targetMutationOptions = {
    attributes: true,
    attributeFilter: ['class', 'data-wb-preview-node-id', SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE, 'style'],
    childList: true,
    subtree: true,
  } satisfies MutationObserverInit;
  const directRootMutationOptions = {
    childList: true,
  } satisfies MutationObserverInit;
  const missingTargetRootMutationOptions = {
    childList: true,
    subtree: true,
  } satisfies MutationObserverInit;
  const roots = getSourceTreePreviewNodeQueryRoots(container);
  const targets = [...new Set(resizeTargets)];
  if (targets.length === 0) {
    roots.forEach((root) => mutationObserver.observe(root, missingTargetRootMutationOptions));
    return;
  }
  roots.forEach((root) => mutationObserver.observe(root, directRootMutationOptions));
  targets.forEach((target) => mutationObserver.observe(target, targetMutationOptions));
}

function SourceTreePreviewNoteHighlightOverlay({
  activeBoxId,
  boxes,
  containerRef,
  draftRect,
  layerId,
  layoutKey,
  noteId,
  onBoxChange,
  onBoxPreviewChange,
}: {
  activeBoxId: string | null;
  boxes: WorkbenchSpecNoteHighlightBox[];
  containerRef: RefObject<HTMLDivElement | null>;
  draftRect: SourceTreePreviewOverlayRect | null;
  layerId: string | null;
  layoutKey: unknown;
  noteId: string | null;
  onBoxChange?: (noteId: string, boxId: string, rect: WorkbenchSpecNoteHighlightBoxRect) => void;
  onBoxPreviewChange?: (boxId: string | null) => void;
}) {
  const [items, setItems] = useState<SourceTreePreviewNoteBoxOverlayItem[]>([]);
  const [draggingBoxId, setDraggingBoxId] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [hoveredResizeEdge, setHoveredResizeEdge] = useState<{
    boxId: string;
    edge: SourceTreePreviewResizeEdge | null;
  } | null>(null);
  const draggingBoxIdRef = useRef<string | null>(null);
  const legacyRatioBoxCacheRef = useRef(new Map<string, WorkbenchSpecNoteHighlightBoxRect>());
  const itemsRef = useRef<SourceTreePreviewNoteBoxOverlayItem[]>([]);
  const boxKey = boxes.map(getSourceTreePreviewNoteBoxIdentity).join('|');

  useLayoutEffect(() => {
    if (!layerId || boxes.length === 0) {
      if (itemsRef.current.length > 0) {
        itemsRef.current = [];
        setItems([]);
      }
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      if (itemsRef.current.length > 0) {
        itemsRef.current = [];
        setItems([]);
      }
      return undefined;
    }

    const ownerWindow = getSourceTreePreviewAnimationWindow(container);
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const MutationObserverCtor = ownerWindow.MutationObserver ?? MutationObserver;
    let frameId: number | null = null;
    const commitItems = (nextItems: SourceTreePreviewNoteBoxOverlayItem[]) => {
      if (areNoteBoxOverlayItemsEqual(itemsRef.current, nextItems)) return;
      itemsRef.current = nextItems;
      setItems(nextItems);
    };
    const update = () => {
      frameId = null;
      const target = getPreviewNodePrimaryElement(container, layerId);
      const targetRect = target ? getPreviewNodeVisualRect(target) : null;
      const nextBoxKeys = new Set(boxes.map(getSourceTreePreviewNoteBoxIdentity));
      for (const cacheKey of legacyRatioBoxCacheRef.current.keys()) {
        if (!nextBoxKeys.has(cacheKey)) legacyRatioBoxCacheRef.current.delete(cacheKey);
      }
      commitItems(targetRect
        ? boxes.map((box) => {
          const stableBox = resolveSourceTreePreviewStableNoteBox(targetRect, box, legacyRatioBoxCacheRef.current);
          return {
            box,
            rect: toSourceTreePreviewOverlayRectFromNoteBox(container, targetRect, stableBox),
            stableBox,
          };
        })
        : []);
    };
    const scheduleUpdate = () => {
      if (draggingBoxIdRef.current) return;
      if (frameId !== null) return;
      frameId = ownerWindow.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserverCtor(scheduleUpdate);
    const mutationObserver = new MutationObserverCtor(scheduleUpdate);
    const resizeTargets = getPreviewNodeResizeTargets(container, layerId);
    resizeObserver.observe(container);
    resizeTargets.forEach((element) => resizeObserver.observe(element));
    observeSourceTreePreviewOverlayMutationTargets(mutationObserver, container, resizeTargets);
    container.addEventListener('scroll', scheduleUpdate, true);
    ownerWindow.addEventListener('resize', scheduleUpdate);
    update();

    return () => {
      if (frameId !== null) ownerWindow.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', scheduleUpdate, true);
      ownerWindow.removeEventListener('resize', scheduleUpdate);
    };
  }, [boxKey, boxes, containerRef, layerId, layoutKey]);

  const startBoxDrag = (
    event: ReactPointerEvent<HTMLSpanElement>,
    item: SourceTreePreviewNoteBoxOverlayItem,
    intent: 'move' | SourceTreePreviewResizeEdge,
  ) => {
    if (!noteId || !onBoxChange || !layerId || event.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;
    const ownerWindow = getSourceTreePreviewOwnerWindow(container);
    const target = getPreviewNodePrimaryElement(container, layerId);
    const targetRect = target ? getPreviewNodeVisualRect(target) : null;
    if (!targetRect || targetRect.width <= 0 || targetRect.height <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    onBoxPreviewChange?.(item.box.id);
    draggingBoxIdRef.current = item.box.id;
    setHoveredBoxId(item.box.id);
    setDraggingBoxId(item.box.id);
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = getSourceTreePreviewNoteBoxLocalRect(targetRect, item.stableBox);
    let latestBox = createSourceTreePreviewPixelBoxFromLocalRect(targetRect, startRect.x, startRect.y, startRect.width, startRect.height, {
      anchorX: startRect.anchorX,
      anchorY: startRect.anchorY,
      resizeMode: startRect.resizeMode,
    });
    let pendingDragBox: WorkbenchSpecNoteHighlightBoxRect | null = null;
    let dragFrameId: number | null = null;
    let didDrag = false;
    const updateDragPreview = (nextBox: WorkbenchSpecNoteHighlightBoxRect) => {
      latestBox = nextBox;
      pendingDragBox = nextBox;
      if (dragFrameId !== null) return;
      dragFrameId = ownerWindow.requestAnimationFrame(() => {
        dragFrameId = null;
        if (!pendingDragBox) return;
        const pendingBox = pendingDragBox;
        pendingDragBox = null;
        updateNoteBoxDragPreviewItem(container, targetRect, item.box.id, pendingBox, setItems, itemsRef);
      });
    };
    const move = (moveEvent: SourceTreePreviewPointerGestureEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      blockSourceTreePreviewPointerEvent(moveEvent);
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!didDrag && Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      didDrag = true;
      updateDragPreview(resolveSourceTreePreviewDraggedNoteBox(targetRect, startRect, intent, dx, dy));
    };
    const done = (doneEvent: SourceTreePreviewPointerGestureEvent) => {
      if (doneEvent.pointerId !== pointerId) return;
      blockSourceTreePreviewPointerEvent(doneEvent);
      cleanup();
      if (!didDrag) return;
      updateNoteBoxDragPreviewItem(container, targetRect, item.box.id, latestBox, setItems, itemsRef);
      onBoxChange(noteId, item.box.id, latestBox);
    };
    const cancel = (cancelEvent: SourceTreePreviewPointerGestureEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanup();
    };
    const cleanup = () => {
      if (dragFrameId !== null) ownerWindow.cancelAnimationFrame(dragFrameId);
      dragFrameId = null;
      pendingDragBox = null;
      draggingBoxIdRef.current = null;
      setDraggingBoxId(null);
      setHoveredResizeEdge(null);
      removePointerListeners();
    };
    const removePointerListeners = addSourceTreePreviewPointerGestureListeners({
      listenerOptions: SOURCE_TREE_PREVIEW_CAPTURE_POINTER_LISTENER_OPTIONS,
      onCancel: cancel,
      onMove: move,
      onUp: done,
      ownerWindow,
    });
  };

  const updateBoxResponseSetting = (
    event: ReactPointerEvent<HTMLSpanElement>,
    item: SourceTreePreviewNoteBoxOverlayItem,
    settings: Pick<WorkbenchSpecNoteHighlightBoxRect, 'anchorX' | 'anchorY' | 'resizeMode'>,
  ) => {
    if (!noteId || !onBoxChange || !layerId || event.button !== 0 || draggingBoxIdRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const target = getPreviewNodePrimaryElement(container, layerId);
    const targetRect = target ? getPreviewNodeVisualRect(target) : null;
    if (!targetRect || targetRect.width <= 0 || targetRect.height <= 0) return;

    event.preventDefault();
    event.stopPropagation();
    const currentRect = getSourceTreePreviewNoteBoxLocalRect(targetRect, item.stableBox);
    const nextBox = createSourceTreePreviewPixelBoxFromLocalRect(
      targetRect,
      currentRect.x,
      currentRect.y,
      currentRect.width,
      currentRect.height,
      {
        anchorX: settings.anchorX ?? item.stableBox.anchorX,
        anchorY: settings.anchorY ?? item.stableBox.anchorY,
        resizeMode: settings.resizeMode ?? item.stableBox.resizeMode,
      },
    );
    updateNoteBoxDragPreviewItem(container, targetRect, item.box.id, nextBox, setItems, itemsRef);
    onBoxChange(noteId, item.box.id, nextBox);
  };

  const updateHoveredResizeEdge = (
    event: ReactPointerEvent<HTMLSpanElement>,
    boxId: string,
  ) => {
    if (draggingBoxIdRef.current) return;
    const edge = resolveSourceTreePreviewResizeEdgeFromRect(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    setHoveredBoxId((current) => current === boxId ? current : boxId);
    setHoveredResizeEdge((current) => current?.boxId === boxId && current.edge === edge ? current : { boxId, edge });
  };

  const clearHoveredResizeEdge = (boxId: string) => {
    setHoveredBoxId((current) => current === boxId ? null : current);
    setHoveredResizeEdge((current) => current?.boxId === boxId ? null : current);
  };

  if (items.length === 0 && !draftRect) return null;

  return (
    <div className="wb-source-visual-note-box-overlay">
      {items.map((item) => {
        const resizeMode = normalizeSourceTreePreviewNoteBoxResizeMode(item.stableBox.resizeMode);
        const boxActive = activeBoxId === item.box.id || draggingBoxId === item.box.id;
        const boxHovered = hoveredBoxId === item.box.id;
        const resizeEdge = hoveredResizeEdge?.boxId === item.box.id ? hoveredResizeEdge.edge : null;
        return (
          <span
            className={boxActive
              ? 'wb-source-visual-note-box wb-source-visual-note-box--active'
              : 'wb-source-visual-note-box'}
            data-active={boxActive ? 'true' : undefined}
            data-dragging={draggingBoxId === item.box.id ? 'true' : undefined}
            data-hovered={boxHovered ? 'true' : undefined}
            key={item.box.id}
            style={{
              cursor: resizeEdge ? getSourceTreePreviewResizeCursor(resizeEdge) : undefined,
              height: item.rect.height,
              transform: `translate(${item.rect.left}px, ${item.rect.top}px)`,
              width: item.rect.width,
            }}
            title={item.box.label}
            onPointerDown={(event) => {
              const intent = resolveSourceTreePreviewResizeEdgeFromRect(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY) ?? 'move';
              startBoxDrag(event, item, intent);
            }}
            onPointerLeave={() => clearHoveredResizeEdge(item.box.id)}
            onPointerMove={(event) => updateHoveredResizeEdge(event, item.box.id)}
          >
            {SOURCE_TREE_PREVIEW_NOTE_BOX_ANCHOR_CORNERS.map((corner) => {
              const cornerSetting = getSourceTreePreviewAnchorCornerSetting(corner);
              const isActive = item.stableBox.anchorX === cornerSetting.anchorX && item.stableBox.anchorY === cornerSetting.anchorY;
              const CornerIcon = SOURCE_TREE_PREVIEW_NOTE_BOX_ANCHOR_CORNER_ICON[corner];
              return (
                <IconButton
                  aria-pressed={isActive}
                  className={`wb-source-visual-note-box-anchor wb-source-visual-note-box-anchor--${corner}`}
                  key={corner}
                  label={isActive ? `Anchor ${corner.toUpperCase()} (click to center)` : `Anchor ${corner.toUpperCase()}`}
                  onPointerDown={(event) => updateBoxResponseSetting(event, item, isActive
                    ? { anchorX: 'center', anchorY: 'center' }
                    : cornerSetting)}
                >
                  <CornerIcon size={12} strokeWidth={2.25} aria-hidden="true" />
                </IconButton>
              );
            })}
            <IconButton
              aria-pressed={resizeMode !== 'fixed'}
              className={`wb-source-visual-note-box-resize-mode wb-source-visual-note-box-resize-mode--${resizeMode}`}
              label={getSourceTreePreviewResizeModeLabel(resizeMode)}
              onPointerDown={(event) => updateBoxResponseSetting(event, item, {
                resizeMode: getSourceTreePreviewNextNoteBoxResizeMode(resizeMode),
              })}
            >
              {resizeMode === 'horizontal' ? (
                <MoveHorizontal size={13} strokeWidth={2.25} aria-hidden="true" />
              ) : resizeMode === 'vertical' ? (
                <MoveVertical size={13} strokeWidth={2.25} aria-hidden="true" />
              ) : resizeMode === 'both' ? (
                <Expand size={13} strokeWidth={2.25} aria-hidden="true" />
              ) : (
                <span className="wb-source-visual-note-box-resize-mode-dot" aria-hidden="true" />
              )}
            </IconButton>
          </span>
        );
      })}
      {draftRect ? (
        <span
          className="wb-source-visual-note-box wb-source-visual-note-box--draft"
          style={{
            height: draftRect.height,
            transform: `translate(${draftRect.left}px, ${draftRect.top}px)`,
            width: draftRect.width,
          }}
        />
      ) : null}
    </div>
  );
}

function updateNoteBoxDragPreviewItem(
  container: HTMLElement,
  targetRect: DOMRect,
  boxId: string,
  nextBox: WorkbenchSpecNoteHighlightBoxRect,
  setItems: (updater: (currentItems: SourceTreePreviewNoteBoxOverlayItem[]) => SourceTreePreviewNoteBoxOverlayItem[]) => void,
  itemsRef: { current: SourceTreePreviewNoteBoxOverlayItem[] },
) {
  const nextRect = toSourceTreePreviewOverlayRectFromNoteBox(container, targetRect, nextBox);
  const nextStableBox = nextBox;
  const updateItem = (currentItem: SourceTreePreviewNoteBoxOverlayItem) => currentItem.box.id === boxId
    ? { ...currentItem, rect: nextRect, stableBox: nextStableBox }
    : currentItem;
  setItems((currentItems) => currentItems.map(updateItem));
  itemsRef.current = itemsRef.current.map(updateItem);
}

function resolveSourceTreePreviewEventNodeId(
  event: ReactMouseEvent<HTMLElement> | ReactPointerEvent<HTMLElement>,
  fallbackNodeId: string,
  mode: SourceTreePreviewSelectionMode = 'deep',
): string {
  const target = getSourceTreePreviewEventTargetElement(event);
  const eventCurrentTarget = event.currentTarget;
  const currentTarget = getSourceTreePreviewEventRoot(eventCurrentTarget);
  if (!target) return fallbackNodeId;
  const controlledRuntimeOwnerNode = resolveSourceTreePreviewControlledRuntimeOwnerNode(
    target,
    currentTarget,
  );
  const controlledRuntimeOwnerNodeId = controlledRuntimeOwnerNode
    ? getSourceTreePreviewElementNodeId(controlledRuntimeOwnerNode)
    : null;
  if (controlledRuntimeOwnerNodeId) return controlledRuntimeOwnerNodeId;
  if (
    (mode === 'direct' || mode === 'exact') &&
    eventCurrentTarget.classList.contains('wb-source-visual-text') &&
    getSourceTreePreviewElementNodeId(eventCurrentTarget) === fallbackNodeId
  ) {
    return fallbackNodeId;
  }
  const directCurrentTargetNodeId = resolveSourceTreePreviewDirectCurrentTargetNodeId(
    eventCurrentTarget,
    target,
    currentTarget,
    mode,
  );
  if (directCurrentTargetNodeId) return directCurrentTargetNodeId;
  const directAuthoredDescendantNodeId = resolveSourceTreePreviewDirectAuthoredDescendantNodeId(
    eventCurrentTarget,
    target,
    currentTarget,
    mode,
  );
  if (directAuthoredDescendantNodeId) return directAuthoredDescendantNodeId;
  const pointNodeId = resolveSourceTreePreviewPointNodeId(event, mode);
  if (pointNodeId) return pointNodeId;
  const targetRuntimeOwnerNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, currentTarget);
  if (targetRuntimeOwnerNodeId) return targetRuntimeOwnerNodeId;
  const closestPreviewNode = target.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
  if (!closestPreviewNode || !currentTarget.contains(closestPreviewNode)) return fallbackNodeId;
  return getSourceTreePreviewElementNodeId(getSourceTreePreviewSelectionElement(closestPreviewNode, currentTarget, mode)) ??
    fallbackNodeId;
}

function resolveSourceTreePreviewDirectCurrentTargetNodeId(
  eventCurrentTarget: HTMLElement,
  target: HTMLElement,
  currentTarget: HTMLElement,
  mode: SourceTreePreviewSelectionMode,
): string | null {
  if (mode !== 'direct' && mode !== 'exact') return null;
  if (!currentTarget.contains(eventCurrentTarget)) return null;
  if (!getSourceTreePreviewElementNodeId(eventCurrentTarget)) return null;
  const closestTargetPreviewNode = target.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
  if (closestTargetPreviewNode !== eventCurrentTarget) return null;
  return getSourceTreePreviewElementNodeId(
    getSourceTreePreviewSelectionElement(eventCurrentTarget, currentTarget, mode),
  );
}

function resolveSourceTreePreviewDirectAuthoredDescendantNodeId(
  eventCurrentTarget: HTMLElement,
  target: HTMLElement,
  currentTarget: HTMLElement,
  mode: SourceTreePreviewSelectionMode,
): string | null {
  if (mode !== 'direct' && mode !== 'exact') return null;
  const authoredDescendant = target.closest<HTMLElement>(
    `[${SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE}]`,
  );
  if (
    !authoredDescendant ||
    authoredDescendant === eventCurrentTarget ||
    !eventCurrentTarget.contains(authoredDescendant) ||
    !currentTarget.contains(authoredDescendant)
  ) {
    return null;
  }
  return getSourceTreePreviewElementNodeId(authoredDescendant);
}

function isSourceTreePreviewPointerOnOtherSelectableLayer(
  event: SourceTreePreviewDragStartEvent,
  container: HTMLElement,
  currentLayerId: string,
  currentSubtreeNodeIds: Set<string>,
): boolean {
  const isInsideCurrentLayer = isPointInsideSourcePreviewLayer(
    container,
    currentLayerId,
    event.clientX,
    event.clientY,
  );
  const pointNodeId = resolveSourceTreePreviewElementFromPointNodeId(container, event.clientX, event.clientY);
  if (pointNodeId && !currentSubtreeNodeIds.has(pointNodeId)) return !isInsideCurrentLayer;
  const target = getSourceTreePreviewEventTargetElement(event);
  if (!target) return false;
  const closestPreviewNode = target.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
  if (!closestPreviewNode || !container.contains(closestPreviewNode)) return false;
  const nodeId = getSourceTreePreviewElementNodeId(closestPreviewNode);
  return Boolean(nodeId && !currentSubtreeNodeIds.has(nodeId) && !isInsideCurrentLayer);
}

function resolveSourceTreePreviewPointNodeId(
  event: ReactMouseEvent<HTMLElement> | ReactPointerEvent<HTMLElement>,
  mode: SourceTreePreviewSelectionMode = 'deep',
): string | null {
  const target = getSourceTreePreviewEventTargetElement(event);
  const currentTarget = getSourceTreePreviewEventRoot(event.currentTarget);
  if (!target) return null;
  const pointElementNodeId = resolveSourceTreePreviewElementFromPointNodeId(currentTarget, event.clientX, event.clientY, mode);
  if (pointElementNodeId) return pointElementNodeId;
  const targetRuntimeOwnerNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, currentTarget);
  if (targetRuntimeOwnerNodeId) return targetRuntimeOwnerNodeId;
  const closestPreviewNode = target.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
  const directRuntimeOwnerNodeId = closestPreviewNode?.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) ?? null;
  if (
    directRuntimeOwnerNodeId &&
    !event.metaKey &&
    !event.ctrlKey &&
    !isSourceTreePreviewAdditiveSelectionEvent(event)
  ) {
    return directRuntimeOwnerNodeId;
  }
  const scope = closestPreviewNode && currentTarget.contains(closestPreviewNode)
    ? closestPreviewNode
    : currentTarget;
  const elements = [
    ...(hasSourceTreePreviewElementNodeId(scope) ? [scope] : []),
    ...Array.from(scope.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)),
  ].filter((element) => currentTarget.contains(element));
  const uniqueElements = Array.from(new Set(elements));
  const selectionOwnRectCandidates = getSourceTreePreviewPointHitCandidates(
    uniqueElements,
    event.clientX,
    event.clientY,
    getSourceTreePreviewOwnHitRects,
    currentTarget,
  );
  const selectionVisualRectCandidates = selectionOwnRectCandidates.length > 0
    ? selectionOwnRectCandidates
    : getSourceTreePreviewPointHitCandidates(
      uniqueElements,
      event.clientX,
      event.clientY,
      (element) => {
        const rect = getPreviewNodeVisualRect(element);
        return rect ? [rect] : [];
      },
      currentTarget,
    );
  const candidates = selectionVisualRectCandidates;
  candidates.sort((left, right) => (
    (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height) ||
    right.depth - left.depth
  ));
  return candidates[0]
    ? getSourceTreePreviewElementNodeId(getSourceTreePreviewSelectionElement(candidates[0].element, currentTarget, mode))
    : null;
}

function resolveSourceTreePreviewPointerLayerId(
  event: SourceTreePreviewDragStartEvent,
  container: HTMLElement,
): string | null {
  const pointNodeId = resolveSourceTreePreviewElementFromPointNodeId(container, event.clientX, event.clientY);
  if (pointNodeId) return pointNodeId;
  const targetRuntimeOwnerNodeId = resolveSourceTreePreviewTargetRuntimeOwnerNodeId(event, container);
  if (targetRuntimeOwnerNodeId) return targetRuntimeOwnerNodeId;
  const target = getSourceTreePreviewEventTargetElement(event);
  const closestPreviewNode = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
  if (!closestPreviewNode || !container.contains(closestPreviewNode)) return null;
  return getSourceTreePreviewElementNodeId(closestPreviewNode);
}

function isSourceTreePreviewPortalPointerTarget(
  eventTarget: EventTarget | null,
  container: HTMLElement,
): boolean {
  const target = isSourceTreePreviewHTMLElement(eventTarget) ? eventTarget : null;
  if (!target) return false;
  const portalRoot = target?.closest<HTMLElement>(
    `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
  ) ?? null;
  if (
    portalRoot &&
    (
      portalRoot === getSourceTreePreviewPortalRoot(container) ||
      container.contains(portalRoot)
    )
  ) {
    return true;
  }

  // Many component libraries keep a popup in the preview DOM instead of the
  // shared portal root. The stable relationship is the controlling element,
  // not a library-specific wrapper or positioning class: if an ancestor is
  // referenced by an authored trigger's aria-controls, that ancestor is an
  // editor-owned runtime surface and must keep the complete pointer gesture.
  let controlledSurface: HTMLElement | null = target;
  while (controlledSurface) {
    if (
      controlledSurface.id &&
      getSourceTreePreviewControllingElements(controlledSurface).some((trigger) => (
        container.contains(trigger) &&
        Boolean(resolveSourceTreePreviewClosestRuntimeOwnerNodeId(trigger, container))
      ))
    ) {
      return true;
    }
    if (controlledSurface === container) break;
    controlledSurface = controlledSurface.parentElement;
  }
  return false;
}

type SourceTreePreviewSelectionHit = {
  layerId: string;
  normalization: 'authored' | 'visual';
};

function resolveSourceTreePreviewCommandHoverLayerId(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  eventTarget: EventTarget | null,
  root: EditableTreeNode,
): string | null {
  const hit = resolveSourceTreePreviewSelectionHit(
    container,
    clientX,
    clientY,
    eventTarget,
    root,
  );
  if (!hit) return null;
  return hit.normalization === 'authored'
    ? hit.layerId
    : resolveSourceTreePreviewVisualSelectionBoundaryId(root, hit.layerId);
}

function resolveSourceTreePreviewSelectionHit(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  eventTarget: EventTarget | null,
  root: EditableTreeNode,
): SourceTreePreviewSelectionHit | null {
  const target = isSourceTreePreviewHTMLElement(eventTarget) ? eventTarget : null;
  const overlayItemLayerId = resolveSourceTreePreviewRuntimeOverlayItemLayerId(
    target,
    container,
    root,
  );
  if (overlayItemLayerId) {
    return {
      layerId: overlayItemLayerId,
      normalization: 'authored',
    };
  }
  const themePortalRoot = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR) ?? null;
  const previewPortalRoot = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR) ?? null;
  const portalRoot = themePortalRoot && container.contains(themePortalRoot)
    ? themePortalRoot
    : previewPortalRoot === getSourceTreePreviewPortalRoot(container)
      ? previewPortalRoot
      : null;
  if (portalRoot) {
    const closestPreviewNode = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
    if (!closestPreviewNode || !portalRoot.contains(closestPreviewNode)) return null;
    const layerId = getSourceTreePreviewElementNodeId(
      getSourceTreePreviewSelectionElement(closestPreviewNode, portalRoot, 'direct'),
    );
    return layerId ? { layerId, normalization: 'visual' } : null;
  }
  if (target && !container.contains(target)) return null;
  const pointLayerId = resolveSourceTreePreviewElementFromPointNodeId(
    container,
    clientX,
    clientY,
    'direct',
  );
  const pointNode = pointLayerId
    ? findSourceTreePreviewLayerNode(root, pointLayerId)
    : null;
  const pointNormalization: SourceTreePreviewSelectionHit['normalization'] =
    pointLayerId && getPreviewNodeElements(container, pointLayerId).some((element) => (
      !element.classList.contains('wb-source-visual-text')
    ))
      ? 'authored'
      : 'visual';
  if (target) {
    const targetRuntimeOwner = resolveSourceTreePreviewClosestRuntimeOwnerNode(target, container);
    if (targetRuntimeOwner) {
      const targetRuntimeOwnerId = getSourceTreePreviewElementNodeId(targetRuntimeOwner);
      const targetRuntimeOwnerNode = targetRuntimeOwnerId
        ? findSourceTreePreviewLayerNode(root, targetRuntimeOwnerId)
        : null;
      const pointIsAuthoredDescendant = Boolean(
        pointNode &&
        (
          !targetRuntimeOwnerNode ||
          pointNode.id === targetRuntimeOwnerNode.id ||
          getSourceTreePreviewNodeSubtreeIds(targetRuntimeOwnerNode).has(pointNode.id)
        ),
      );
      // The native event target can be a parent div when a rendered child is
      // pointer-events:none (icons are the common case). Empty visual spans
      // can also be normalized to that parent before exact selection runs.
      // Prefer the authored point hit whenever it is the same node or a
      // descendant of the target-owned boundary; never promote a press to an
      // unrelated or coarser runtime surface.
      if (pointLayerId && pointNode && pointIsAuthoredDescendant) {
        return {
          layerId: pointLayerId,
          normalization: pointNormalization,
        };
      }
      const layerId = getSourceTreePreviewElementNodeId(
        getSourceTreePreviewSelectionElement(targetRuntimeOwner, container, 'direct'),
      );
      return layerId ? { layerId, normalization: 'visual' } : null;
    }
  }
  return pointLayerId
    ? {
        layerId: pointLayerId,
        normalization: pointNormalization,
      }
    : null;
}

// Wrapper components frequently render nothing beyond their single child
// (Tooltip → trigger Button, tight decorator divs). The child covers the
// wrapper completely, so a pointer hit can never address the wrapper itself.
// This chain — hit node plus the ancestors that hug it exactly — is what a
// future "promote exact selection to the unreachable wrapper" rule needs; it is
// exposed through the dev canvas diagnostics so the selection path that finally
// commits Cmd+click can be found before the rule is wired in. A loose version
// of that rule chained through single-side-padded wrappers and promoted a card
// press all the way to its section, so every edge must match and the climb
// stops after the immediate wrapper pair.
const SOURCE_TREE_PREVIEW_COINCIDENT_BOUNDS_TOLERANCE_PX = 2;
const SOURCE_TREE_PREVIEW_COINCIDENT_BOUNDS_MAX_DEPTH = 2;

function sourceTreePreviewRectsCoincide(a: DOMRect, b: DOMRect): boolean {
  const tolerance = SOURCE_TREE_PREVIEW_COINCIDENT_BOUNDS_TOLERANCE_PX;
  return (
    Math.abs(a.left - b.left) <= tolerance &&
    Math.abs(a.top - b.top) <= tolerance &&
    Math.abs(a.right - b.right) <= tolerance &&
    Math.abs(a.bottom - b.bottom) <= tolerance
  );
}

function getSourceTreePreviewNodeVisualBoundsById(
  container: HTMLElement,
  root: EditableTreeNode,
  layerId: string,
): DOMRect | null {
  const node = findSourceTreePreviewLayerNode(root, layerId);
  if (!node) return null;
  return getSourceTreePreviewVisualBounds(
    container,
    getSourceTreePreviewNodeDragElements(container, node),
  );
}

function resolveSourceTreePreviewCoincidentSelectionChain(
  container: HTMLElement,
  root: EditableTreeNode,
  hitLayerId: string,
): string[] {
  const chain = [hitLayerId];
  const baseRect = getSourceTreePreviewNodeVisualBoundsById(container, root, hitLayerId);
  if (!baseRect) return chain;
  let currentId = hitLayerId;
  for (let depth = 0; depth < SOURCE_TREE_PREVIEW_COINCIDENT_BOUNDS_MAX_DEPTH; depth += 1) {
    const parent = findEditableTreeParent(root, currentId);
    if (!parent || parent.id === root.id) break;
    // Only a single-child wrapper is unreachable by pointer. A parent with
    // siblings always has some surface of its own to press. Whitespace-only
    // text children are JSX formatting, not pressable content.
    const wrapperChildren = getSourceTreePreviewLayerChildren(parent)
      .filter((child) => child.source?.whitespace !== true);
    if (wrapperChildren.length !== 1) break;
    const parentRect = getSourceTreePreviewNodeVisualBoundsById(container, root, parent.id);
    if (!parentRect || !sourceTreePreviewRectsCoincide(parentRect, baseRect)) break;
    chain.unshift(parent.id);
    currentId = parent.id;
  }
  return chain;
}

function resolveSourceTreePreviewVisualSelectionBoundaryId(
  root: EditableTreeNode,
  nodeId: string | null,
): string | null {
  if (!nodeId) return null;
  const selectableNodeId =
    resolveEditableTreeSelectionBoundary(root, nodeId)?.selectableNode.id ??
    nodeId;
  const selectableNode = findSourceTreePreviewLayerNode(root, selectableNodeId);
  if (selectableNode?.kind !== 'text') return selectableNodeId;
  return findEditableTreeParent(root, selectableNodeId)?.id ?? selectableNodeId;
}

function resolveSourceTreePreviewDirectAuthoredOverlayItemNode(
  item: HTMLElement,
  controlledSurface: HTMLElement | null,
  root: EditableTreeNode,
): EditableTreeNode | null {
  // The rendered collection item can itself be the authored child's primary
  // element (e.g. a DropdownMenuItem whose root element carries the projected
  // source id). That identity outranks wrapper/descendant recovery: falling
  // through to the single selectable descendant would resolve the item's text
  // leaf instead, which breaks both modifier selection and item reordering
  // (the text node has no reorderable siblings).
  const directAuthoredItemNodeId = item.dataset.wbPreviewNodeId ?? null;
  const directAuthoredItemNode = directAuthoredItemNodeId
    ? findSourceTreePreviewLayerNode(root, directAuthoredItemNodeId)
    : null;
  if (item !== controlledSurface && directAuthoredItemNode) {
    return directAuthoredItemNode;
  }

  const directAuthoredWrapper = item.parentElement;
  const directAuthoredWrapperNodeId =
    directAuthoredWrapper?.dataset.wbPreviewNodeId ?? null;
  const directAuthoredWrapperNode = directAuthoredWrapperNodeId
    ? findSourceTreePreviewLayerNode(root, directAuthoredWrapperNodeId)
    : null;
  if (
    directAuthoredWrapper &&
    directAuthoredWrapper !== controlledSurface &&
    directAuthoredWrapperNode
  ) {
    return directAuthoredWrapperNode;
  }

  const directAuthoredCandidates = Array.from(
    item.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR),
  );
  const directAuthoredDescendants = directAuthoredCandidates.filter((candidate) => {
    const nodeId = getSourceTreePreviewElementNodeId(candidate);
    return Boolean(
      nodeId &&
      findSourceTreePreviewLayerNode(root, nodeId) &&
      !directAuthoredCandidates.some((other) => (
        other !== candidate &&
        other.contains(candidate) &&
        getSourceTreePreviewElementNodeId(other)
      )),
    );
  });
  const directAuthoredDescendant = directAuthoredDescendants.length === 1
    ? directAuthoredDescendants[0]
    : null;
  const directAuthoredDescendantNodeId =
    directAuthoredDescendant?.dataset.wbPreviewNodeId ?? null;
  if (
    !directAuthoredDescendant ||
    directAuthoredDescendant === controlledSurface ||
    !directAuthoredDescendantNodeId
  ) {
    return null;
  }
  return findSourceTreePreviewLayerNode(root, directAuthoredDescendantNodeId);
}

function resolveSourceTreePreviewRuntimeOverlayItemLayerId(
  target: HTMLElement | null,
  container: HTMLElement,
  root: EditableTreeNode,
): string | null {
  const item = target?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR) ?? null;
  if (!item || !container.ownerDocument.body.contains(item)) return null;

  // Collection components commonly turn authored JSX children into data and
  // then render the popup items themselves. That transformation can consume
  // the Workbench marker props even though the authored children remain real
  // source nodes. Recover the relationship from the rendered accessibility
  // graph (controlled popup + item text), not from component names or CSS.
  let controllingTrigger: HTMLElement | null = null;
  let controlledSurface: HTMLElement | null = null;
  let current: HTMLElement | null = item;
  while (current) {
    if (current.id) {
      const escapedId = escapeAttributeSelectorValue(current.id);
      controllingTrigger = Array.from(container.querySelectorAll<HTMLElement>(
        `[aria-controls~="${escapedId}"]`,
      )).find((candidate) => !shouldIgnoreSourceTreePreviewVisualElement(candidate)) ?? null;
      if (controllingTrigger) {
        controlledSurface = current;
        break;
      }
    }
    if (current === container) break;
    current = current.parentElement;
  }

  const ownerElement = controllingTrigger?.closest<HTMLElement>(
    SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,
  ) ?? item.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
  const ownerNodeId = ownerElement ? getSourceTreePreviewElementNodeId(ownerElement) : null;
  const ownerNode = ownerNodeId ? findSourceTreePreviewLayerNode(root, ownerNodeId) : null;

  // Prefer the authored wrapper that directly owns the rendered collection
  // item. Compound components such as Power Search may render their source
  // child as a wrapper around a semantic option while also containing deeper
  // editable controls with the same label. Text matching across the whole
  // owner subtree can otherwise project the option to that deeper control and
  // make the click fall through to the card behind the popup. Runtime-created
  // collection rows do not have this direct authored wrapper and continue to
  // use the accessibility/text reconciliation below.
  const directAuthoredWrapperNode =
    resolveSourceTreePreviewDirectAuthoredOverlayItemNode(
      item,
      controlledSurface,
      root,
    );
  if (directAuthoredWrapperNode) {
    projectSourceTreePreviewRuntimeOverlayItem(item, directAuthoredWrapperNode);
    if (controlledSurface && ownerNode) {
      projectSourceTreePreviewRuntimeOverlayCollection(
        controlledSurface,
        ownerNode,
        root,
      );
    }
    return directAuthoredWrapperNode.id;
  }

  if (!ownerNode) return null;

  const itemText = normalizeSourceTreePreviewRuntimeOverlayMatchText(item.textContent ?? '');
  if (!itemText) return null;
  const candidates = getSourceTreePreviewRuntimeOverlayItemCandidates(ownerNode, root);
  const scoredCandidates = candidates.map((candidate) => ({
    candidate,
    score: getSourceTreePreviewRuntimeOverlayItemCandidateScore(candidate, itemText),
  }));
  const bestScore = scoredCandidates.reduce(
    (score, candidate) => Math.max(score, candidate.score),
    0,
  );
  const bestCandidates = scoredCandidates
    .filter((candidate) => candidate.score === bestScore && candidate.score > 0)
    .map((candidate) => candidate.candidate);
  let bestCandidate: EditableTreeNode | null = bestCandidates[0] ?? null;

  if (bestCandidates.length > 1 && controlledSurface) {
    const sameTextItems = Array.from(controlledSurface.querySelectorAll<HTMLElement>(
      SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR,
    )).filter((candidate) => (
      candidate.closest(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR) === candidate &&
      normalizeSourceTreePreviewRuntimeOverlayMatchText(candidate.textContent ?? '') === itemText
    ));
    const occurrenceIndex = sameTextItems.indexOf(item);
    if (occurrenceIndex >= 0) {
      bestCandidate = bestCandidates[occurrenceIndex] ?? bestCandidate;
    }
  }

  if (!bestCandidate && controlledSurface) {
    const renderedItems = Array.from(controlledSurface.querySelectorAll<HTMLElement>(
      SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR,
    )).filter((candidate) => (
      candidate.closest(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR) === candidate
    ));
    const sourceItemCandidates = candidates.filter((candidate) => (
      getSourceTreePreviewRuntimeOverlayItemCandidateText(candidate).length > 0
    ));
    if (renderedItems.length === sourceItemCandidates.length) {
      const itemIndex = renderedItems.indexOf(item);
      bestCandidate = itemIndex >= 0 ? sourceItemCandidates[itemIndex] ?? null : null;
    }
  }
  if (!bestCandidate) return null;

  projectSourceTreePreviewRuntimeOverlayItem(item, bestCandidate);
  if (controlledSurface) {
    projectSourceTreePreviewRuntimeOverlayCollection(
      controlledSurface,
      ownerNode,
      root,
    );
  }
  return bestCandidate.id;
}

function projectSourceTreePreviewRuntimeOverlayCollection(
  controlledSurface: HTMLElement,
  ownerNode: EditableTreeNode,
  root: EditableTreeNode,
): void {
  const renderedItems = Array.from(controlledSurface.querySelectorAll<HTMLElement>(
    SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR,
  )).filter((candidate) => (
    candidate.closest(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR) === candidate
  ));
  if (renderedItems.length === 0) return;

  const directCandidates = getSourceTreePreviewLayerChildren(ownerNode).filter((candidate) => (
    !isEditableTreeSourcePreviewOnlyNode(root, candidate.id) &&
    getSourceTreePreviewRuntimeOverlayItemCandidateText(candidate).length > 0
  ));
  const nestedCandidates = getSourceTreePreviewRuntimeOverlayItemCandidates(ownerNode, root)
    .filter((candidate) => (
      getSourceTreePreviewRuntimeOverlayItemCandidateText(candidate).length > 0
    ));
  // Prefer the owner's direct authored children whenever the collection has
  // the same cardinality. Nested candidate search remains available for
  // grouped menus whose semantic rows live below a source group wrapper.
  const sourceItemCandidates = directCandidates.length === renderedItems.length
    ? directCandidates
    : nestedCandidates;
  const unmatchedCandidates = new Set(sourceItemCandidates);
  const projectedItems = new Set<HTMLElement>();
  // Reconciliation may re-stamp rows whose path-based ids went stale inside
  // this owner's subtree, but it must never steal a row that already carries a
  // live authored identity from another branch (e.g. when the resolved owner
  // is the trigger while the rows belong to the controlled content node).
  const ownerSubtreeIds = getSourceTreePreviewNodeSubtreeIds(ownerNode);
  const hasForeignAuthoredIdentity = (renderedItem: HTMLElement): boolean => {
    const existingNodeId = renderedItem.getAttribute('data-wb-preview-node-id');
    return Boolean(
      existingNodeId &&
      !ownerSubtreeIds.has(existingNodeId) &&
      findSourceTreePreviewLayerNode(root, existingNodeId),
    );
  };

  renderedItems.forEach((renderedItem) => {
    if (hasForeignAuthoredIdentity(renderedItem)) {
      projectedItems.add(renderedItem);
      return;
    }
    const directNode = resolveSourceTreePreviewDirectAuthoredOverlayItemNode(
      renderedItem,
      controlledSurface,
      root,
    );
    if (!directNode || !unmatchedCandidates.has(directNode)) return;
    projectSourceTreePreviewRuntimeOverlayItem(renderedItem, directNode);
    unmatchedCandidates.delete(directNode);
    projectedItems.add(renderedItem);
  });

  renderedItems.forEach((renderedItem, index) => {
    if (projectedItems.has(renderedItem)) return;
    if (hasForeignAuthoredIdentity(renderedItem)) return;
    const renderedText = normalizeSourceTreePreviewRuntimeOverlayMatchText(
      renderedItem.textContent ?? '',
    );
    const rankedCandidates = Array.from(unmatchedCandidates)
      .map((candidate) => ({
        candidate,
        score: getSourceTreePreviewRuntimeOverlayItemCandidateScore(
          candidate,
          renderedText,
        ),
      }))
      .sort((left, right) => right.score - left.score);
    const bestScore = rankedCandidates[0]?.score ?? 0;
    const tiedCandidates = rankedCandidates
      .filter((candidate) => candidate.score === bestScore && bestScore > 0)
      .map((candidate) => candidate.candidate);
    const sourceOrderedCandidate = sourceItemCandidates[index];
    const matchedCandidate = tiedCandidates.length === 1
      ? tiedCandidates[0]
      : (
          sourceOrderedCandidate && unmatchedCandidates.has(sourceOrderedCandidate)
            ? sourceOrderedCandidate
            : tiedCandidates[0] ?? null
        );
    if (!matchedCandidate) return;
    unmatchedCandidates.delete(matchedCandidate);
    projectSourceTreePreviewRuntimeOverlayItem(renderedItem, matchedCandidate);
  });
}

function projectSourceTreePreviewRuntimeOverlayItem(
  item: HTMLElement,
  node: EditableTreeNode,
): void {
  if (item.getAttribute('data-wb-preview-node-id') !== node.id) {
    item.setAttribute('data-wb-preview-node-id', node.id);
  }
  if (
    item.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) !==
    node.id
  ) {
    item.setAttribute(
      SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE,
      node.id,
    );
  }
  const componentName = getSourceTreePreviewRuntimeOwnedChildComponentName(node);
  if (
    componentName &&
    item.getAttribute(SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE) !==
      componentName
  ) {
    item.setAttribute(
      SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE,
      componentName,
    );
  }
}

function getSourceTreePreviewRuntimeOverlayItemCandidates(
  ownerNode: EditableTreeNode,
  root: EditableTreeNode,
): EditableTreeNode[] {
  const candidates: EditableTreeNode[] = [];
  const visited = new Set<string>();
  const visit = (node: EditableTreeNode) => {
    for (const child of [...(node.children ?? []), ...(node.sourcePreviewChildren ?? [])]) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      if (
        !isSourceTextLeaf(child) &&
        !isEditableTreeSourcePreviewOnlyNode(root, child.id)
      ) {
        candidates.push(child);
      }
      visit(child);
    }
  };
  visit(ownerNode);
  return candidates;
}

function getSourceTreePreviewRuntimeOverlayItemCandidateText(
  node: EditableTreeNode,
): string[] {
  const values: string[] = [];
  const addValue = (value: unknown) => {
    if (typeof value !== 'string' && typeof value !== 'number') return;
    const normalized = normalizeSourceTreePreviewRuntimeOverlayMatchText(String(value));
    if (normalized.length > 1 && !values.includes(normalized)) values.push(normalized);
  };
  for (const value of Object.values(node.sourceProps ?? {})) addValue(value);
  for (const value of Object.values(node.sourceJsxProps ?? {})) addValue(value);
  for (const value of Object.values(node.sourceAttributes ?? {})) addValue(value);
  addValue(node.textContent);
  for (const child of node.children ?? []) {
    if (isSourceTextLeaf(child)) addValue(child.textContent);
  }
  return values;
}

function getSourceTreePreviewRuntimeOverlayItemCandidateScore(
  node: EditableTreeNode,
  itemText: string,
): number {
  return getSourceTreePreviewRuntimeOverlayItemCandidateText(node).reduce((score, value) => {
    if (!itemText.includes(value)) return score;
    return score + value.length + (itemText === value ? value.length * 2 : 0);
  }, 0);
}

function normalizeSourceTreePreviewRuntimeOverlayMatchText(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

function resolveSourceTreePreviewElementFromPointNodeId(
  currentTarget: HTMLElement,
  clientX: number,
  clientY: number,
  mode: SourceTreePreviewSelectionMode = 'deep',
): string | null {
  const ownerDocument = currentTarget.ownerDocument;
  const elementsFromPoint = typeof ownerDocument.elementsFromPoint === 'function'
    ? ownerDocument.elementsFromPoint(clientX, clientY)
    : [];
  // Labels, descriptions, and similar component-owned auxiliary DOM may sit
  // outside the element that received the source marker. Selection already
  // promotes that marker's visual bounds to their shared unmarked wrapper, so
  // hit testing must honor the same ownership before a larger authored parent
  // wins through its ordinary box geometry.
  const visualBoundsOwner = resolveSourceTreePreviewVisualBoundsPointOwnerNode(
    elementsFromPoint,
    currentTarget,
  );
  const pointElements: HTMLElement[] = [];
  // Runtime-owned children can visually overlap parent preview nodes. Keep all
  // point candidates and choose the smallest/deepest hit instead of returning
  // the first parent-like element from the browser's hit stack.
  for (const element of elementsFromPoint) {
    if (!isSourceTreePreviewHTMLElement(element) || !currentTarget.contains(element)) continue;
    if (shouldIgnoreSourceTreePreviewVisualElement(element)) continue;
    const closestRuntimeOwnerNode = resolveSourceTreePreviewClosestRuntimeOwnerNode(element, currentTarget);
    if (closestRuntimeOwnerNode) pointElements.push(closestRuntimeOwnerNode);
    const closestPreviewNode = element.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
    if (!closestPreviewNode || !currentTarget.contains(closestPreviewNode)) continue;
    pointElements.push(closestPreviewNode);
  }
  pointElements.push(
    ...Array.from(currentTarget.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)),
  );
  // Everything above is geometry: `querySelectorAll` sweeps the whole preview
  // and keeps whatever rect contains the point, which resurrects exactly the
  // nodes the browser refused to hit. With a drawer open, a small node behind
  // it then wins the smallest-area sort against the drawer's own large box, and
  // the press reads as falling straight through the drawer.
  const pointHitScope = getSourceTreePreviewPointHitScope(elementsFromPoint, currentTarget);
  const uniqueElements = Array.from(new Set(pointElements)).filter((element) => (
    !shouldIgnoreSourceTreePreviewVisualElement(element) &&
    isSourceTreePreviewElementInPointHitScope(element, pointHitScope) &&
    Boolean(getSourceTreePreviewElementNodeId(element))
  ));
  const ownRectCandidates = getSourceTreePreviewPointHitCandidates(
    uniqueElements,
    clientX,
    clientY,
    getSourceTreePreviewOwnHitRects,
    currentTarget,
  );
  ownRectCandidates.sort((left, right) => (
    (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height) ||
    right.depth - left.depth
  ));
  if (visualBoundsOwner) {
    const directOwnRectOwner = ownRectCandidates[0]?.element ?? null;
    // A controlled or visually-owned surface owns only the content that has no
    // authored identity of its own — its auxiliary labels, descriptions, and
    // chrome. When the element under the pointer IS an authored node (a command
    // palette group's row inside the input's list, a menu row inside a popup),
    // that node wins. Otherwise the surface's owning trigger answers for
    // everything inside it: pressing a group selected and dragged the input,
    // which reads as "the whole list is being dragged".
    const hitOwnsAuthoredIdentity = Boolean(
      directOwnRectOwner &&
      directOwnRectOwner !== visualBoundsOwner &&
      directOwnRectOwner.hasAttribute('data-wb-preview-node-id'),
    );
    const owner = directOwnRectOwner &&
      (hitOwnsAuthoredIdentity || visualBoundsOwner.contains(directOwnRectOwner))
      ? directOwnRectOwner
      : visualBoundsOwner;
    return getSourceTreePreviewElementNodeId(
      getSourceTreePreviewSelectionElement(owner, currentTarget, mode),
    );
  }
  const candidates = ownRectCandidates.length > 0
    ? ownRectCandidates
    : getSourceTreePreviewPointHitCandidates(
        uniqueElements,
        clientX,
        clientY,
        (element) => {
          const rect = getPreviewNodeVisualRect(element);
          return rect ? [rect] : [];
        },
        currentTarget,
      );
  candidates.sort((left, right) => (
    (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height) ||
    right.depth - left.depth
  ));
  const candidate = candidates[0]?.element ?? null;
  return candidate ? getSourceTreePreviewElementNodeId(getSourceTreePreviewSelectionElement(candidate, currentTarget, mode)) : null;
}

function resolveSourceTreePreviewVisualBoundsPointOwnerNode(
  elementsFromPoint: Element[],
  currentTarget: HTMLElement,
): HTMLElement | null {
  for (const element of elementsFromPoint) {
    if (!isSourceTreePreviewHTMLElement(element) || !currentTarget.contains(element)) continue;
    if (shouldIgnoreSourceTreePreviewVisualElement(element)) continue;
    const owner = resolveSourceTreePreviewVisualBoundsRuntimeOwnerNode(element, currentTarget);
    if (owner) return owner;
  }
  return null;
}

function resolveSourceTreePreviewTargetRuntimeOwnerNodeId(
  event: SourceTreePreviewSelectionModifierEvent & { target: EventTarget | null },
  currentTarget: HTMLElement,
): string | null {
  if (event.metaKey || event.ctrlKey || isSourceTreePreviewAdditiveSelectionEvent(event)) return null;
  const target = getSourceTreePreviewEventTargetElement(event);
  if (!target) return null;
  return resolveSourceTreePreviewClosestRuntimeOwnerNodeId(target, currentTarget);
}

function resolveSourceTreePreviewClosestRuntimeOwnerNodeId(
  element: HTMLElement,
  currentTarget: HTMLElement,
): string | null {
  const runtimeOwnerNode = resolveSourceTreePreviewClosestRuntimeOwnerNode(element, currentTarget);
  return runtimeOwnerNode ? getSourceTreePreviewElementNodeId(runtimeOwnerNode) : null;
}

function resolveSourceTreePreviewClosestRuntimeOwnerNode(
  element: HTMLElement,
  currentTarget: HTMLElement,
): HTMLElement | null {
  // A rendered control can live inside a controlled/portal surface while
  // still having a nearer authored source wrapper of its own. Preserve that
  // explicit source identity before inferring ownership from aria-controls or
  // visual bounds; otherwise a Power Search field control resolves to the
  // enclosing card behind its popup.
  const closestSelectableNode = element.closest<HTMLElement>(
    SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,
  );
  if (
    closestSelectableNode &&
    (
      currentTarget.contains(closestSelectableNode) ||
      currentTarget.ownerDocument.body.contains(closestSelectableNode)
    )
  ) {
    return closestSelectableNode;
  }
  const controlledRuntimeOwnerNode = resolveSourceTreePreviewControlledRuntimeOwnerNode(
    element,
    currentTarget,
  );
  if (controlledRuntimeOwnerNode) return controlledRuntimeOwnerNode;
  const visualBoundsRuntimeOwnerNode = resolveSourceTreePreviewVisualBoundsRuntimeOwnerNode(
    element,
    currentTarget,
  );
  if (visualBoundsRuntimeOwnerNode) return visualBoundsRuntimeOwnerNode;
  const closestRuntimeOwnerNode = element.closest<HTMLElement>(`[${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE}]`);
  if (closestRuntimeOwnerNode && currentTarget.contains(closestRuntimeOwnerNode)) {
    return closestRuntimeOwnerNode;
  }
  return null;
}

function resolveSourceTreePreviewVisualBoundsRuntimeOwnerNode(
  element: HTMLElement,
  currentTarget: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current !== currentTarget) {
    if (getSourceTreePreviewElementNodeId(current)) return null;
    const candidates = Array.from(
      current.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR),
    ).filter((candidate) => (
      !shouldIgnoreSourceTreePreviewVisualElement(candidate) &&
      getSourceTreePreviewSelectionBoundsElement(candidate, currentTarget) === current
    ));
    const outermostCandidates = candidates.filter((candidate) => (
      !candidates.some((other) => other !== candidate && other.contains(candidate))
    ));
    if (outermostCandidates.length === 1) return outermostCandidates[0] ?? null;
    current = current.parentElement;
  }
  return null;
}

function resolveSourceTreePreviewControlledRuntimeOwnerNode(
  element: HTMLElement,
  currentTarget: HTMLElement,
): HTMLElement | null {
  const trigger = element.closest<HTMLElement>('[aria-controls]');
  if (!trigger || !currentTarget.contains(trigger)) return null;
  const queryRoots = getSourceTreePreviewNodeQueryRoots(currentTarget);
  for (const controlledId of getSourceTreePreviewControlledElementIds(trigger)) {
    const escapedId = escapeAttributeSelectorValue(controlledId);
    for (const root of queryRoots) {
      const controlledElement = root.querySelector<HTMLElement>(`[id="${escapedId}"]`);
      if (!controlledElement) continue;
      const runtimeOwner = controlledElement.matches(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)
        ? controlledElement
        : controlledElement.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR);
      if (runtimeOwner && root.contains(runtimeOwner)) return runtimeOwner;
    }
  }
  return null;
}

function getSourceTreePreviewControlledElementIds(trigger: HTMLElement): string[] {
  return (trigger.getAttribute('aria-controls') ?? '')
    .split(/\s+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function getSourceTreePreviewControllingElements(element: HTMLElement): HTMLElement[] {
  if (!element.id) return [];
  const escapedId = escapeAttributeSelectorValue(element.id);
  return Array.from(element.ownerDocument.querySelectorAll<HTMLElement>(
    `[aria-controls~="${escapedId}"]`,
  )).filter((trigger) => !shouldIgnoreSourceTreePreviewVisualElement(trigger));
}

function getSourceTreePreviewEventTargetElement(
  event: {
    nativeEvent?: Event;
    target: EventTarget | null;
  },
): HTMLElement | null {
  // React portals and nested roots can retarget the synthetic event to the
  // preview boundary even though the native pointer originated from a real
  // input, menu item, or popup trigger. The composed path keeps that original
  // interaction surface. Prefer it so an ordinary control click is never
  // reinterpreted as a canvas-background click or a structural drag.
  const nativeEvent = event.nativeEvent ?? (
    event instanceof Event ? event : null
  );
  const composedPath = nativeEvent?.composedPath?.() ?? [];
  for (const pathTarget of composedPath) {
    if (isSourceTreePreviewHTMLElement(pathTarget)) return pathTarget;
    if (
      isSourceTreePreviewNode(pathTarget) &&
      isSourceTreePreviewHTMLElement(pathTarget.parentElement)
    ) {
      return pathTarget.parentElement;
    }
  }
  const target = event.target;
  if (isSourceTreePreviewHTMLElement(target)) return target;
  if (isSourceTreePreviewNode(target) && isSourceTreePreviewHTMLElement(target.parentElement)) {
    return target.parentElement;
  }
  return null;
}

function resolveSourceTreePreviewRuntimeInteractionTarget(
  target: HTMLElement | null,
  container: HTMLElement,
): HTMLElement | null {
  if (!target) return null;
  const portalRoot = getSourceTreePreviewPortalRoot(container);
  const isInRuntimeScope = (element: HTMLElement) => (
    container.contains(element) ||
    Boolean(portalRoot?.contains(element))
  );
  if (!isInRuntimeScope(target)) return null;
  const directTarget = target.closest<HTMLElement>(
    SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR,
  );
  if (directTarget && isInRuntimeScope(directTarget)) return directTarget;

  // A visual control may render its icon, chevron, clear action, or suffix
  // beside its semantic triggers instead of inside them. Treat a compact shell
  // around the union of its visible interactive descendants as one
  // runtime-owned hit area. This is based on rendered geometry, not component
  // names, trigger counts, or project CSS classes.
  let shell: HTMLElement | null = target.parentElement;
  for (let depth = 0; shell && isInRuntimeScope(shell) && depth < 5; depth += 1) {
    const interactiveDescendants = Array.from(shell.querySelectorAll<HTMLElement>(
      SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR,
    )).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (interactiveDescendants.length > 0) {
      const shellRect = shell.getBoundingClientRect();
      const interactiveRects = interactiveDescendants.map((element) => element.getBoundingClientRect());
      const interactiveLeft = Math.min(...interactiveRects.map((rect) => rect.left));
      const interactiveRight = Math.max(...interactiveRects.map((rect) => rect.right));
      const interactiveTop = Math.min(...interactiveRects.map((rect) => rect.top));
      const interactiveBottom = Math.max(...interactiveRects.map((rect) => rect.bottom));
      const compactWidth = shellRect.width <= interactiveRight - interactiveLeft + 72;
      const compactHeight = shellRect.height <= interactiveBottom - interactiveTop + 28;
      if (!compactWidth || !compactHeight) return null;

      // A control that owns a popup identifies itself, so that answer is safe
      // however many interactive descendants sit beside it.
      const popupOwner = interactiveDescendants.find((element) => (
        element.matches('[aria-haspopup], [aria-controls]')
      ));
      if (popupOwner) return popupOwner;

      // Otherwise the press has to land on one of them, or be attributable to
      // the only one there. Falling back to document order was a guess, and on
      // a container it is always the same wrong guess: a nav of authored link
      // groups dragged its first link whichever cell was selected, and a
      // section wrapping a toggle group dragged that group's first item. When
      // several independent controls share a shell and the press is on none of
      // them, this heuristic cannot know which was meant — decline, and let the
      // press take the ordinary selection/drag path.
      const pressed = interactiveDescendants.find((element) => (
        element === target || element.contains(target)
      ));
      if (pressed) return pressed;
      return interactiveDescendants.length === 1 ? interactiveDescendants[0]! : null;
    }
    if (shell === container || shell.matches(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR)) {
      return null;
    }
    shell = shell.parentElement;
  }
  return null;
}

function shouldSourceTreePreviewRuntimeOwnPointerGesture(
  event: { clientX: number; clientY: number; target: EventTarget | null },
  container: HTMLElement,
  selectedNode: EditableTreeNode | null,
): boolean {
  const surface = resolveSourceTreePreviewRuntimePointerGestureSurface(event, container);
  if (!surface) return false;
  if (!selectedNode) return true;

  const selectedElements = getSourceTreePreviewNodeDragElements(container, selectedNode);
  if (
    selectedElements.length === 0 ||
    selectedElements.some((element) => element === surface || element.contains(surface)) ||
    !selectedElements.some((element) => surface.contains(element))
  ) {
    return true;
  }

  return !isPointInsideSourceTreePreviewNode(
    container,
    selectedNode,
    event.clientX,
    event.clientY,
  );
}

function resolveSourceTreePreviewRuntimePointerGestureSurface(
  event: { clientX: number; clientY: number; target: EventTarget | null },
  container: HTMLElement,
): HTMLElement | null {
  const target = getSourceTreePreviewEventTargetElement(event);
  const targetSurface = target?.closest<HTMLElement>(
    SOURCE_TREE_PREVIEW_RUNTIME_POINTER_GESTURE_TARGET_SELECTOR,
  ) ?? null;
  if (targetSurface && container.contains(targetSurface)) return targetSurface;

  // Preview metadata and iframe event delegation can retarget the event to an
  // editor-owned ancestor. Resolve the actual hit-tested surface as a fallback
  // so canvas drag never races a runtime-owned carousel gesture.
  for (const element of container.ownerDocument.elementsFromPoint(event.clientX, event.clientY)) {
    const surface = element.closest<HTMLElement>(
      SOURCE_TREE_PREVIEW_RUNTIME_POINTER_GESTURE_TARGET_SELECTOR,
    );
    if (surface && container.contains(surface)) return surface;
  }
  return null;
}

function hasSourceTreePreviewElementNodeId(element: HTMLElement): boolean {
  return Boolean(getSourceTreePreviewElementNodeId(element));
}

function getSourceTreePreviewElementNodeId(element: HTMLElement): string | null {
  return element.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) ??
    element.dataset.wbPreviewNodeId ??
    getSourceTreePreviewRuntimeRootNodeId(element.className) ??
    null;
}

function getSourceTreePreviewSelectionElement(
  element: HTMLElement,
  currentTarget: HTMLElement,
  mode: SourceTreePreviewSelectionMode,
): HTMLElement {
  if (mode === 'deep' || mode === 'exact') return element;
  const visualLeaf = getSourceTreePreviewVisualLeafSelectionElement(element, currentTarget);
  if (mode === 'smart-deep') return getSourceTreePreviewSingleChildChainSelectionElement(visualLeaf, currentTarget);
  if (!isSourceTreePreviewBackgroundLikeOverlayElement(visualLeaf)) return visualLeaf;
  const parentPreviewNode = visualLeaf.parentElement?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
  return parentPreviewNode && currentTarget.contains(parentPreviewNode) ? parentPreviewNode : visualLeaf;
}

function getSourceTreePreviewVisualLeafSelectionElement(
  element: HTMLElement,
  currentTarget: HTMLElement,
): HTMLElement {
  const svgNodeSelector = `svg[data-wb-preview-node-id], svg[${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE}]`;
  const svgElement = element.matches(svgNodeSelector)
    ? element
    : element.closest<HTMLElement>(svgNodeSelector);
  return svgElement && currentTarget.contains(svgElement) ? svgElement : element;
}

function getSourceTreePreviewSingleChildChainSelectionElement(
  element: HTMLElement,
  currentTarget: HTMLElement,
): HTMLElement {
  let current = element;
  while (current !== currentTarget) {
    const parentPreviewNode = current.parentElement?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
    if (!parentPreviewNode || !currentTarget.contains(parentPreviewNode)) return current;
    const siblingPreviewNodes = Array.from(parentPreviewNode.children)
      .filter((child): child is HTMLElement => (
        isSourceTreePreviewHTMLElement(child) &&
        Boolean(getSourceTreePreviewElementNodeId(child))
      ));
    if (siblingPreviewNodes.length !== 1 || siblingPreviewNodes[0] !== current) return current;
    current = parentPreviewNode;
  }
  return current;
}

function isSourceTreePreviewBackgroundLikeOverlayElement(element: HTMLElement): boolean {
  if (element.matches('img, video, canvas, svg, button, input, select, textarea, [contenteditable="true"], [contenteditable=""]')) {
    return false;
  }
  if (element.textContent?.trim()) return false;
  const parentPreviewNode = element.parentElement?.closest<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR) ?? null;
  if (!parentPreviewNode) return false;
  const style = getSourceTreePreviewComputedStyle(element);
  if (style.position !== 'absolute' && style.position !== 'fixed') return false;
  return doesSourceTreePreviewElementCoverParent(element, parentPreviewNode);
}

function doesSourceTreePreviewElementCoverParent(element: HTMLElement, parent: HTMLElement): boolean {
  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  if (elementRect.width <= 0 || elementRect.height <= 0 || parentRect.width <= 0 || parentRect.height <= 0) return false;
  const widthCoverage = elementRect.width / parentRect.width;
  const heightCoverage = elementRect.height / parentRect.height;
  const centerX = parentRect.left + parentRect.width / 2;
  const centerY = parentRect.top + parentRect.height / 2;
  return (
    widthCoverage >= 0.85 &&
    heightCoverage >= 0.85 &&
    centerX >= elementRect.left &&
    centerX <= elementRect.right &&
    centerY >= elementRect.top &&
    centerY <= elementRect.bottom
  );
}

function isSourceTreePreviewTransparentRuntimeSelectionNode(root: EditableTreeNode, nodeId: string): boolean {
  if (nodeId === root.id) return true;
  const node = findEditableTreeNode(root, nodeId);
  const jsxName = node?.source?.jsxName ?? node?.source?.importName ?? '';
  if (!jsxName) return false;
  return isSourceTreePreviewTransparentRuntimeSelectionName(jsxName) &&
    !hasSourceTreePreviewAuthoredWrapperEditSurface(node);
}

function isSourceTreePreviewTransparentRuntimeSelectionName(jsxName: string): boolean {
  const normalizedName = jsxName.split('.').pop() ?? jsxName;
  if (normalizedName.endsWith('Provider')) return true;
  if (normalizedName.endsWith('Context')) return true;
  return [
    'Fragment',
    'Portal',
    'Primitive',
    'Root',
    'Slot',
    'Slottable',
  ].includes(normalizedName);
}

function hasSourceTreePreviewAuthoredWrapperEditSurface(node: EditableTreeNode | null): boolean {
  if (!node) return false;
  return Boolean(
    node.sourceAttributes?.className?.trim() ||
    node.sourceAttributes?.[SOURCE_TOKEN_MODE_ATTRIBUTE]?.trim() ||
    Object.keys(node.sourceStyleDeclarations ?? {}).length > 0 ||
    Object.keys(node.sourceValueMetadata?.styles ?? {}).length > 0 ||
    (node.sourceValueMetadata?.styleSpreads?.length ?? 0) > 0 ||
    Object.keys(node.tokenBindings ?? {}).length > 0 ||
    Object.keys(node.tokenBindingReferences ?? {}).length > 0
  );
}

function getSourceTreePreviewEventRoot(currentTarget: HTMLElement): HTMLElement {
  return currentTarget.closest<HTMLElement>('[data-workbench-preview-root="true"]') ?? currentTarget;
}

function focusSourceTreePreviewRootFromEvent(event: ReactMouseEvent<HTMLElement>): void {
  if (isSourceTreePreviewEditableTarget(event.target)) return;
  const root = getSourceTreePreviewEventRoot(event.currentTarget);
  if (
    !isSourceTreePreviewRuntimeActivationEvent(event) &&
    getSourceTreePreviewActiveRuntimeFocusTarget(root)
  ) return;
  focusSourceTreePreviewRoot(event.currentTarget);
}

function focusSourceTreePreviewRoot(currentTarget: HTMLElement): void {
  const root = getSourceTreePreviewEventRoot(currentTarget);
  root.focus({ preventScroll: true });
}

function restoreSourceTreePreviewRuntimeFocusAfterEditorClick(
  currentTarget: HTMLElement,
  focusedRuntimeTarget: HTMLElement,
): void {
  const ownerWindow = getSourceTreePreviewOwnerWindow(currentTarget);
  ownerWindow.setTimeout(() => {
    if (
      !focusedRuntimeTarget.isConnected ||
      focusedRuntimeTarget.ownerDocument !== currentTarget.ownerDocument
    ) return;
    focusedRuntimeTarget.focus({ preventScroll: true });
  }, 0);
}

function getSourceTreePreviewActiveRuntimeFocusTarget(
  currentTarget: HTMLElement,
): HTMLElement | null {
  const root = getSourceTreePreviewEventRoot(currentTarget);
  const activeElement = root.ownerDocument.activeElement;
  const portalRoot = getSourceTreePreviewPortalRoot(root);
  // Press protection exists for transient overlay surfaces — popups that
  // light-dismiss or blur would destroy. Gallery pages statically render
  // expanded triggers, focused demo inputs, and visible inline listboxes;
  // those need no protection, and treating them as active runtime focus
  // permanently swallowed every plain canvas press on such pages.
  const openControlledSurfaceTrigger = getSourceTreePreviewOpenControlledSurfaceTriggers(root)
    .filter((trigger) => doesSourceTreePreviewControllerOwnTransientOverlay(trigger, root))
    .pop() ?? null;
  if (
    !isSourceTreePreviewHTMLElement(activeElement) ||
    (!root.contains(activeElement) && !portalRoot?.contains(activeElement))
  ) {
    return openControlledSurfaceTrigger;
  }
  if (
    activeElement.getAttribute('aria-expanded') === 'true' &&
    doesSourceTreePreviewControllerOwnTransientOverlay(activeElement, root)
  ) {
    return activeElement;
  }

  let focusedSurface: HTMLElement | null = activeElement;
  while (focusedSurface) {
    const expandedController = getSourceTreePreviewControllingElements(focusedSurface)
      .find((trigger) => (
        root.contains(trigger) &&
        trigger.getAttribute('aria-expanded') === 'true' &&
        doesSourceTreePreviewControllerOwnTransientOverlay(trigger, root)
      ));
    if (expandedController) return expandedController;
    if (focusedSurface === root || focusedSurface === portalRoot) break;
    focusedSurface = focusedSurface.parentElement;
  }

  const controlledIds = getSourceTreePreviewControlledElementIds(activeElement);
  const controlsOpenRuntimeSurface = controlledIds.some((controlledId) => {
    const escapedId = escapeAttributeSelectorValue(controlledId);
    const controlledElement = root.ownerDocument.querySelector<HTMLElement>(
      `[id="${escapedId}"]`,
    );
    return controlledElement
      ? isSourceTreePreviewTransientOverlaySurface(controlledElement, root, portalRoot)
      : false;
  });
  return controlsOpenRuntimeSurface
    ? activeElement
    : openControlledSurfaceTrigger;
}

function doesSourceTreePreviewControllerOwnTransientOverlay(
  controller: HTMLElement,
  root: HTMLElement,
): boolean {
  const portalRoot = getSourceTreePreviewPortalRoot(root);
  return getSourceTreePreviewControlledElementIds(controller).some((controlledId) => {
    const escapedId = escapeAttributeSelectorValue(controlledId);
    const surface = root.ownerDocument.querySelector<HTMLElement>(`[id="${escapedId}"]`);
    return surface
      ? isSourceTreePreviewTransientOverlaySurface(surface, root, portalRoot)
      : false;
  });
}

function isSourceTreePreviewTransientOverlaySurface(
  surface: HTMLElement,
  root: HTMLElement,
  portalRoot: HTMLElement | null,
): boolean {
  if (!isSourceTreePreviewOpenRuntimeSurface(surface)) return false;
  if (surface.matches('dialog[open]')) return true;
  try {
    if (surface.matches('[popover]:popover-open')) return true;
  } catch {
    // Selector unsupported in this engine; fall through to layout checks.
  }
  if (portalRoot?.contains(surface)) return true;
  let current: HTMLElement | null = surface;
  while (current && current !== root) {
    if (getSourceTreePreviewComputedStyle(current).position === 'fixed') return true;
    current = current.parentElement;
  }
  return false;
}

function getSourceTreePreviewOpenControlledSurfaceTrigger(
  container: HTMLElement,
): HTMLElement | null {
  const triggers = getSourceTreePreviewOpenControlledSurfaceTriggers(container);
  return triggers[triggers.length - 1] ?? null;
}

function getSourceTreePreviewOpenControlledSurfaceTriggers(
  container: HTMLElement,
): HTMLElement[] {
  const queryRoots = getSourceTreePreviewNodeQueryRoots(container);
  const triggers = Array.from(new Set(queryRoots.flatMap((queryRoot) => (
    Array.from(queryRoot.querySelectorAll<HTMLElement>('[aria-controls]'))
  ))));
  const candidates = triggers.filter((trigger) => {
    if (shouldIgnoreSourceTreePreviewVisualElement(trigger)) return false;
    return getSourceTreePreviewControlledElementIds(trigger).some((controlledId) => {
      const escapedId = escapeAttributeSelectorValue(controlledId);
      const controlledSurface = queryRoots
        .map((queryRoot) => (
          queryRoot.id === controlledId
            ? queryRoot
            : queryRoot.querySelector<HTMLElement>(`[id="${escapedId}"]`)
        ))
        .find((candidate): candidate is HTMLElement => Boolean(candidate));
      if (!controlledSurface) return false;
      return (
        trigger.getAttribute('aria-expanded') === 'true' ||
        isSourceTreePreviewOpenRuntimeSurface(controlledSurface) ||
        Boolean(getPreviewNodeVisualRect(controlledSurface))
      );
    });
  });
  candidates.sort((left, right) => (
    getSourceTreePreviewNodeDepth(left, container) -
    getSourceTreePreviewNodeDepth(right, container)
  ));
  return candidates;
}

function isSourceTreePreviewOpenRuntimeSurface(element: HTMLElement): boolean {
  if (element.matches('dialog[open]')) return true;
  if (element.matches('[role="dialog"], [role="listbox"], [role="menu"]')) {
    // A mounted-but-closed floating surface (a layer library can keep its
    // fixed-position wrapper in the DOM at 0×0 while closed) must not count as
    // open: getPreviewNodeVisualRect projects such a surface onto its
    // controlling trigger's rect, so its truthiness proves nothing. Only the
    // surface's own painted box shows it is actually open.
    const rect = element.getBoundingClientRect();
    if (rect.width > 0.5 && rect.height > 0.5) return true;
  }
  try {
    return element.matches('[popover]:popover-open');
  } catch {
    return false;
  }
}

type SourceTreePreviewRuntimeSurfaceRestoreTarget = {
  controlledIds: string[];
  runtimeOwnerNodeId: string | null;
};

function captureSourceTreePreviewOpenRuntimeSurfaceRestoreTargets(
  container: HTMLElement,
  draggedElement: HTMLElement | null,
  draggedSurfaceHost: HTMLElement | null,
): SourceTreePreviewRuntimeSurfaceRestoreTarget[] {
  if (!draggedElement) return [];
  const queryRoots = getSourceTreePreviewNodeQueryRoots(container);
  const openTriggers = getSourceTreePreviewOpenControlledSurfaceTriggers(container);
  const connectedElements = new Set<HTMLElement>([
    draggedElement,
    ...(draggedSurfaceHost ? [draggedSurfaceHost] : []),
  ]);
  const capturedTriggers = new Set<HTMLElement>();
  if (draggedSurfaceHost) {
    for (const trigger of getSourceTreePreviewControllingElements(draggedSurfaceHost)) {
      if (container.contains(trigger) && openTriggers.includes(trigger)) {
        capturedTriggers.add(trigger);
        connectedElements.add(trigger);
      }
    }
    if (capturedTriggers.size === 0) {
      // Some collection libraries expose `aria-controls` on the trigger but
      // render the visible listbox without carrying that controlled id onto
      // the row ancestry. The innermost open trigger is still the visual
      // surface that supplied the dragged item; seed the ownership walk from
      // it instead of losing post-commit restoration altogether.
      const innermostOpenTrigger = openTriggers[openTriggers.length - 1];
      if (innermostOpenTrigger) {
        capturedTriggers.add(innermostOpenTrigger);
        connectedElements.add(innermostOpenTrigger);
      }
    }
  }

  // Walk from the dragged portal child through its controlling trigger and
  // repeat for nested surfaces. DOM ancestry alone cannot express this chain
  // because every popover may be projected into the document top layer.
  let changed = true;
  while (changed) {
    changed = false;
    for (const trigger of openTriggers) {
      if (capturedTriggers.has(trigger)) continue;
      const controlledSurfaces = getSourceTreePreviewControlledElementIds(trigger)
        .flatMap((controlledId) => {
          const escapedId = escapeAttributeSelectorValue(controlledId);
          return queryRoots
            .map((queryRoot) => (
              queryRoot.id === controlledId
                ? queryRoot
                : queryRoot.querySelector<HTMLElement>(`[id="${escapedId}"]`)
            ))
            .filter((candidate): candidate is HTMLElement => Boolean(candidate));
        });
      const ownsConnectedElement = controlledSurfaces.some((surface) => (
        Array.from(connectedElements).some((element) => (
          surface === element ||
          surface.contains(element) ||
          element.contains(surface) ||
          trigger === element ||
          trigger.contains(element)
        ))
      ));
      if (!ownsConnectedElement) continue;
      capturedTriggers.add(trigger);
      connectedElements.add(trigger);
      for (const surface of controlledSurfaces) connectedElements.add(surface);
      changed = true;
    }
  }

  return openTriggers
    .filter((trigger) => capturedTriggers.has(trigger))
    .map((trigger) => ({
      controlledIds: getSourceTreePreviewControlledElementIds(trigger),
      runtimeOwnerNodeId:
        trigger.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) ??
        resolveSourceTreePreviewClosestRuntimeOwnerNodeId(trigger, container),
    }));
}

function restoreSourceTreePreviewRuntimeSurfaces(
  container: HTMLElement,
  targets: readonly SourceTreePreviewRuntimeSurfaceRestoreTarget[],
): void {
  if (targets.length === 0) return;
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  let targetIndex = 0;
  let remainingFrames = Math.max(90, targets.length * 30);

  const restoreNext = () => {
    if (!container.isConnected || remainingFrames-- <= 0) return;
    if (targetIndex >= targets.length) targetIndex = 0;
    const target = targets[targetIndex];
    const queryRoots = getSourceTreePreviewNodeQueryRoots(container);
    const matchingTrigger = queryRoots
      .flatMap((queryRoot) => (
        Array.from(queryRoot.querySelectorAll<HTMLElement>('[aria-controls]'))
      ))
      .find((trigger) => {
        const controlledIds = getSourceTreePreviewControlledElementIds(trigger);
        if (target.controlledIds.some((controlledId) => controlledIds.includes(controlledId))) {
          return true;
        }
        return Boolean(
          target.runtimeOwnerNodeId &&
          (
            trigger.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) ===
              target.runtimeOwnerNodeId ||
            resolveSourceTreePreviewClosestRuntimeOwnerNodeId(trigger, container) ===
              target.runtimeOwnerNodeId
          )
        );
      });
    if (!matchingTrigger) {
      if (remainingFrames-- > 0) ownerWindow.requestAnimationFrame(restoreNext);
      return;
    }
    const controlledSurfaceIsOpen = getSourceTreePreviewControlledElementIds(matchingTrigger)
      .some((controlledId) => {
        const escapedId = escapeAttributeSelectorValue(controlledId);
        const controlledSurface = queryRoots
          .map((queryRoot) => (
            queryRoot.id === controlledId
              ? queryRoot
              : queryRoot.querySelector<HTMLElement>(`[id="${escapedId}"]`)
          ))
          .find((candidate): candidate is HTMLElement => Boolean(candidate));
        return controlledSurface
          ? isSourceTreePreviewOpenRuntimeSurface(controlledSurface)
          : false;
    });
    if (!controlledSurfaceIsOpen) {
      if (container.ownerDocument.activeElement === matchingTrigger) {
        // Focus-driven controls such as Typeahead can be remounted with focus
        // already restored by the browser but with their local open state
        // reset. Force a real focus transition so their authored focus handler
        // reopens the controlled surface.
        matchingTrigger.blur();
      }
      matchingTrigger.focus({ preventScroll: true });
      ownerWindow.requestAnimationFrame(() => {
        const queryRootsAfterFocus = getSourceTreePreviewNodeQueryRoots(container);
        const openedFromFocus = getSourceTreePreviewControlledElementIds(matchingTrigger)
          .some((controlledId) => {
            const escapedId = escapeAttributeSelectorValue(controlledId);
            const controlledSurface = queryRootsAfterFocus
              .map((queryRoot) => (
                queryRoot.id === controlledId
                  ? queryRoot
                  : queryRoot.querySelector<HTMLElement>(`[id="${escapedId}"]`)
              ))
              .find((candidate): candidate is HTMLElement => Boolean(candidate));
            return controlledSurface
              ? isSourceTreePreviewOpenRuntimeSurface(controlledSurface)
              : false;
          });
        if (!openedFromFocus) {
          const runtimeClick = container.ownerDocument.createEvent('MouseEvent');
          runtimeClick.initMouseEvent(
            'click',
            true,
            true,
            ownerWindow as Window,
            0,
            0,
            0,
            0,
            0,
            false,
            true,
            false,
            false,
            0,
            null,
          );
          matchingTrigger.dispatchEvent(runtimeClick);
        }
        ownerWindow.requestAnimationFrame(restoreNext);
      });
      return;
    }
    targetIndex += 1;
    ownerWindow.requestAnimationFrame(restoreNext);
  };

  ownerWindow.requestAnimationFrame(restoreNext);
}

function getSourceTreePreviewNodeDepth(element: HTMLElement, root: HTMLElement): number {
  let depth = 0;
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    depth += 1;
    current = current.parentElement;
  }
  return depth;
}

function preventSourceTreePreviewAnchorNavigation(event: ReactMouseEvent<HTMLElement>) {
  if (!isSourceTreePreviewElement(event.target)) return;
  const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!anchor || !event.currentTarget.contains(anchor)) return;
  event.preventDefault();
}

function preventSourceTreePreviewNativeDrag(event: ReactDragEvent<HTMLElement>) {
  if (!isSourceTreePreviewElement(event.target)) return;
  if (!event.currentTarget.contains(event.target)) return;
  event.preventDefault();
}

function getSourceTreePreviewSelectedLayerIds(primaryLayerId: string | null, selectedLayerIds: string[]): string[] {
  const secondaryLayerIds = selectedLayerIds.filter((layerId) => layerId !== primaryLayerId);
  return primaryLayerId ? [...secondaryLayerIds, primaryLayerId] : secondaryLayerIds;
}

function getSourceTreePreviewSelectedLayerKey(primaryLayerId: string | null, selectedLayerIds: string[]): string {
  return getSourceTreePreviewSelectedLayerIds(primaryLayerId, selectedLayerIds).join('|');
}

function handleSourceTreePreviewShortcut(
  event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>,
  shortcuts: {
    onCopySelection?: () => void;
    onCutSelection?: () => void;
    onDeleteSelection?: () => void;
    onDuplicateSelection?: () => void;
    onHistoryRedo?: () => boolean | undefined;
    onHistoryUndo?: () => boolean | undefined;
    onInsertChild?: () => void;
    onPasteNode?: (placement: 'below' | 'inside') => void;
    onWrapSelection?: () => void;
  },
): boolean {
  const isModifierPressed = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  if (isModifierPressed && !event.altKey) {
    if (event.shiftKey && isSourceTreePreviewShortcutKey(event, 'g', 'KeyG') && shortcuts.onWrapSelection) {
      event.preventDefault();
      event.stopPropagation();
      shortcuts.onWrapSelection();
      return true;
    }

    const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
    const wantsUndo = key === 'z' && !event.shiftKey;
    if (wantsUndo || wantsRedo) {
      const handled = wantsRedo ? shortcuts.onHistoryRedo?.() : shortcuts.onHistoryUndo?.();
      if (!handled) return false;
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    if (isSourceTreePreviewEditableTarget(event.target)) return false;

    if (key === 'c' && shortcuts.onCopySelection) {
      event.preventDefault();
      event.stopPropagation();
      shortcuts.onCopySelection();
      return true;
    }

    if (key === 'x' && shortcuts.onCutSelection) {
      event.preventDefault();
      event.stopPropagation();
      shortcuts.onCutSelection();
      return true;
    }

    if (key === 'v' && shortcuts.onPasteNode) {
      event.preventDefault();
      event.stopPropagation();
      shortcuts.onPasteNode(event.shiftKey ? 'inside' : 'below');
      return true;
    }

    if (key === 'd' && shortcuts.onDuplicateSelection) {
      event.preventDefault();
      event.stopPropagation();
      shortcuts.onDuplicateSelection();
      return true;
    }
  }

  if (isSourceTreePreviewEditableTarget(event.target)) return false;

  if (!isModifierPressed && !event.altKey && event.shiftKey && isSourceTreePreviewShortcutKey(event, 'w', 'KeyW') && shortcuts.onWrapSelection) {
    event.preventDefault();
    event.stopPropagation();
    shortcuts.onWrapSelection();
    return true;
  }

  if (!isModifierPressed && !event.altKey && !event.shiftKey && isSourceTreePreviewShortcutKey(event, 'i', 'KeyI') && shortcuts.onInsertChild) {
    event.preventDefault();
    event.stopPropagation();
    shortcuts.onInsertChild();
    return true;
  }

  if (!isModifierPressed && !event.altKey && (event.key === 'Backspace' || event.key === 'Delete') && shortcuts.onDeleteSelection) {
    event.preventDefault();
    event.stopPropagation();
    shortcuts.onDeleteSelection();
    return true;
  }

  return false;
}

function handleSourceTreePreviewHistoryInput(
  event: InputEvent,
  shortcuts: {
    onHistoryRedo?: () => boolean | undefined;
    onHistoryUndo?: () => boolean | undefined;
  },
): boolean {
  const handled = event.inputType === 'historyUndo'
    ? shortcuts.onHistoryUndo?.()
    : event.inputType === 'historyRedo'
      ? shortcuts.onHistoryRedo?.()
      : false;
  if (!handled) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function isSourceTreePreviewShortcutKey(
  event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>,
  key: string,
  code: string,
): boolean {
  return event.key.toLowerCase() === key || event.code === code;
}

function resolveSourceTreePreviewKeyboardMoveIntent(
  event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
  selectedLayerId: string | null,
): SourceKeyboardMoveIntent | null {
  if (!selectedLayerId || event.metaKey || event.ctrlKey || event.shiftKey || isSourceTreePreviewEditableTarget(event.target)) return null;
  // A selection is explicit intent, so it outranks whatever runtime element
  // happens to hold focus. This used to refuse the move for any interactive
  // target, which meant a drawer made every node inside it unmovable: opening
  // one leaves focus on its trigger (a button) and its content is a dialog, and
  // both were on that list even though neither does anything with arrow keys.
  //
  // Two things still keep the keys. Text entry and value adjustment are
  // refused above by `isSourceTreePreviewEditableTarget`. Surfaces that
  // genuinely navigate with arrows are refused here — hijacking those would
  // break the control rather than merely outrank it.
  if (
    !event.altKey &&
    isSourceTreePreviewHTMLElement(event.target) &&
    event.target.closest(SOURCE_TREE_PREVIEW_KEYBOARD_NAVIGATED_TARGET_SELECTOR)
  ) {
    return null;
  }

  if (event.altKey) {
    if (event.key === 'ArrowUp') return { kind: 'reorder', offset: -1 };
    if (event.key === 'ArrowDown') return { kind: 'reorder', offset: 1 };
    if (event.key === 'ArrowLeft') return { kind: 'outdent' };
    if (event.key === 'ArrowRight') return { kind: 'indent' };
    return null;
  }

  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return null;
  }

  const offset = getSourceTreePreviewKeyboardMoveOffset(container, selectedLayerId, event.key);
  return offset === 0 ? null : { kind: 'reorder', offset };
}

function isSourceTreePreviewEditableTarget(target: EventTarget | null): boolean {
  if (!isSourceTreePreviewHTMLElement(target)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea' ||
    // ARIA separators with a current value are operable window splitters. Their
    // pointer sequence belongs to the preview runtime, not canvas node movement.
    Boolean(target.closest(SOURCE_TREE_PREVIEW_RUNTIME_RESIZE_SEPARATOR_SELECTOR)) ||
    Boolean(target.closest('[role="slider"], [role="spinbutton"], [data-slot="slider-thumb"], [data-slot="slider-track"], [data-slot="slider-range"]')) ||
    target.isContentEditable;
}

function isSourceTreePreviewNoteBoxTarget(target: EventTarget | null): boolean {
  return isSourceTreePreviewHTMLElement(target) && Boolean(target.closest('.wb-source-visual-note-box'));
}

function getSourceTreePreviewChildElements({
  assetRegistry,
  childNodes,
  dismissedPreviewModalNodeIds,
  i18nTokens,
  nodePreviewTokenModes,
  onDismissPreviewModal,
  onDrillIntoLayer,
  onNodeDragStart,
  onSelectLayer,
  onSourceNodeComponentPropChange,
  previewDrillPath,
  projectRuntimeComponents,
  runtimeDescendantNodeIds,
  repeaterNode,
  selectable,
  selectedLayerId,
  selectedLayerIds,
  sourcePreviewChildren,
  sourcePreviewOnly,
  tokenRegistry,
}: {
  assetRegistry?: WorkbenchAssetRegistry;
  childNodes: EditableTreeNode[];
  dismissedPreviewModalNodeIds: Set<string>;
  i18nTokens: SourceTreePreviewI18nMap;
  nodePreviewTokenModes: PreviewTokenModeSelection;
  onDismissPreviewModal: (nodeId: string) => void;
  onDrillIntoLayer: (layerId: string) => void;
  onNodeDragStart: (event: SourceTreePreviewDragStartEvent) => void;
  onSelectLayer: (layerId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  onSourceNodeComponentPropChange?: SourceTreePreviewComponentPropChange;
  previewDrillPath: string[];
  projectRuntimeComponents: ProjectSourceRuntimeComponents;
  runtimeDescendantNodeIds: Set<string>;
  repeaterNode: EditableTreeNode;
  selectable: boolean;
  selectedLayerId: string | null;
  selectedLayerIds: Set<string>;
  sourcePreviewChildren: boolean;
  sourcePreviewOnly: boolean;
  tokenRegistry: TokenRegistry;
}): ReactNode[] {
  const childSelectable = selectable && !isSourceTreePreviewInlineIconNode(repeaterNode);
  if (isSourceTreePreviewRepeaterNode(repeaterNode) && childNodes.length === 1) {
    const child = childNodes[0];
    const count = getSourceTreePreviewRepeaterCount(repeaterNode);
    const itemProps = getSourceTreePreviewRepeaterItemProps(repeaterNode);
    const itemPropKeys = getSourceTreePreviewRepeaterItemPropKeys(repeaterNode);
    return Array.from({ length: count }, (_, index) => (
      <SourceTreePreviewNode
        key={`${child.id}:repeat-${index}`}
        assetRegistry={assetRegistry}
        dismissedPreviewModalNodeIds={dismissedPreviewModalNodeIds}
        i18nTokens={i18nTokens}
        node={child}
        onDismissPreviewModal={onDismissPreviewModal}
        previewDrillPath={previewDrillPath}
        previewTokenModes={nodePreviewTokenModes}
        projectRuntimeComponents={projectRuntimeComponents}
        runtimeDescendantNodeIds={runtimeDescendantNodeIds}
        selectable={childSelectable}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
        sourcePreviewOnly={getEditableTreePreviewChildSourcePreviewOnly({
          child,
          parentSourcePreviewOnly: sourcePreviewOnly,
          sourcePreviewChild: sourcePreviewChildren,
        })}
        sourcePropOverrides={filterSourceTreePreviewRepeaterItemProps(itemProps[index], itemPropKeys)}
        tokenRegistry={tokenRegistry}
        onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
        onDrillIntoLayer={onDrillIntoLayer}
        onNodeDragStart={onNodeDragStart}
        onSelectLayer={onSelectLayer}
      />
    ));
  }

  return childNodes.map((child) => (
    <SourceTreePreviewNode
      key={child.id}
      assetRegistry={assetRegistry}
      dismissedPreviewModalNodeIds={dismissedPreviewModalNodeIds}
      i18nTokens={i18nTokens}
      node={child}
      onDismissPreviewModal={onDismissPreviewModal}
      previewDrillPath={previewDrillPath}
      previewTokenModes={nodePreviewTokenModes}
      projectRuntimeComponents={projectRuntimeComponents}
      runtimeDescendantNodeIds={runtimeDescendantNodeIds}
      selectable={childSelectable}
      selectedLayerId={selectedLayerId}
      selectedLayerIds={selectedLayerIds}
      sourcePreviewOnly={getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: sourcePreviewChildren,
      })}
      tokenRegistry={tokenRegistry}
      onSourceNodeComponentPropChange={onSourceNodeComponentPropChange}
      onDrillIntoLayer={onDrillIntoLayer}
      onNodeDragStart={onNodeDragStart}
      onSelectLayer={onSelectLayer}
    />
  ));
}

function isSourceTreePreviewRepeaterNode(node: EditableTreeNode): boolean {
  if (node.kind !== 'component-instance') return false;
  const count = node.sourceProps?.count;
  return typeof count === 'string' || typeof count === 'number' || typeof count === 'boolean';
}

function isSourceTreePreviewLongPressDragNode(node: EditableTreeNode): boolean {
  return isSourceTreePreviewRepeaterNode(node);
}

function getSourceTreePreviewRepeaterCount(node: EditableTreeNode): number {
  const count = node.sourceProps?.count;
  const parsed = typeof count === 'string' || typeof count === 'number' || typeof count === 'boolean' ? Number(count) : NaN;
  return Math.max(1, Math.min(50, Math.round(Number.isFinite(parsed) ? parsed : 3)));
}

function getSourceTreePreviewRepeaterItemProps(node: EditableTreeNode): Array<Record<string, boolean | number | string> | undefined> {
  const itemProps = node.sourceProps?.itemProps;
  return isSourceTreePreviewRepeaterItemPropsArray(itemProps) ? itemProps : [];
}

function getSourceTreePreviewRepeaterItemPropKeys(node: EditableTreeNode): EditableTreeSourcePropStringArray | null {
  const itemPropKeys = node.sourceProps?.itemPropKeys;
  if (Array.isArray(itemPropKeys) && itemPropKeys.every((item) => typeof item === 'string')) {
    return normalizeSourceTreePreviewRepeaterItemPropKeys(itemPropKeys);
  }
  if (typeof itemPropKeys === 'string') {
    return normalizeSourceTreePreviewRepeaterItemPropKeys(itemPropKeys.split(/[\s,]+/));
  }
  return null;
}

function normalizeSourceTreePreviewRepeaterItemPropKeys(keys: string[]): EditableTreeSourcePropStringArray {
  return [...new Set(keys.map((key) => key.trim()).filter((key) => key.length > 0))];
}

function isSourceTreePreviewRepeaterItemPropsArray(value: unknown): value is EditableTreeSourcePropObject[] {
  return Array.isArray(value) && value.every((item) => (
    Boolean(item) &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.values(item).every((propValue) => typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean')
  ));
}

function filterSourceTreePreviewRepeaterItemProps(
  itemProps: Record<string, boolean | number | string> | undefined,
  itemPropKeys: EditableTreeSourcePropStringArray | null,
): Record<string, boolean | number | string> | undefined {
  if (!itemProps || itemPropKeys === null) return itemProps;
  const allowed = new Set(itemPropKeys);
  return Object.fromEntries(Object.entries(itemProps).filter(([key]) => allowed.has(key)));
}

function getSourceTreePreviewKeyboardMoveOffset(
  container: HTMLElement | null,
  selectedLayerId: string,
  key: string,
): number {
  const selectedElement = getPreviewNodeKeyboardElement(container, selectedLayerId);
  const layout = getSourceTreePreviewKeyboardLayout(selectedElement, container);

  if (layout.kind === 'grid') {
    // Keep keyboard reordering source-adjacent. Grid row jumps are visual, but
    // source writeback moves JSX siblings; drag handles visual placement better.
    if (key === 'ArrowLeft') return -1;
    if (key === 'ArrowRight') return 1;
    if (key === 'ArrowUp') return -1;
    if (key === 'ArrowDown') return 1;
    return 0;
  }

  if (layout.kind === 'horizontal') {
    if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
    if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
    return 0;
  }

  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  return 0;
}

function getPreviewNodeKeyboardElement(container: HTMLElement | null, layerId: string): HTMLElement | null {
  const element = container ? getPreviewNodeElements(container, layerId)[0] ?? null : null;
  if (!element) return null;
  if (getSourceTreePreviewComputedStyle(element).display !== 'contents') return element;
  const child = Array.from(element.children).find(isSourceTreePreviewHTMLElement);
  return child ?? element;
}

function getSourceTreePreviewKeyboardLayout(
  element: HTMLElement | null,
  container: HTMLElement | null,
): { columns: number; kind: 'grid' } | { kind: 'horizontal' | 'vertical' } {
  let parent = element?.parentElement ?? null;
  while (parent && parent !== container && getSourceTreePreviewComputedStyle(parent).display === 'contents') {
    parent = parent.parentElement;
  }
  if (!parent) return { kind: 'vertical' };

  const style = getSourceTreePreviewComputedStyle(parent);
  if (style.display.includes('grid')) {
    return { kind: 'grid', columns: getSourceTreePreviewGridColumnCount(style) };
  }
  if (style.display.includes('flex') && style.flexDirection.startsWith('row')) {
    return { kind: 'horizontal' };
  }
  return { kind: 'vertical' };
}

function getSourceTreePreviewGridColumnCount(style: CSSStyleDeclaration): number {
  const columns = style.gridTemplateColumns.trim();
  if (!columns || columns === 'none') return 1;
  return Math.max(1, columns.split(/\s+/).filter(Boolean).length);
}

function getSelectionOverlayRects(
  container: HTMLElement | null,
  selectedLayerIds: string[],
  primaryLayerId: string | null,
  root?: EditableTreeNode,
): SourceTreePreviewOverlayRect[] {
  return getSelectionOverlaySnapshot(container, selectedLayerIds, primaryLayerId, root).rects;
}

function getSelectionOverlaySnapshot(
  container: HTMLElement | null,
  selectedLayerIds: string[],
  primaryLayerId: string | null,
  root?: EditableTreeNode,
  label?: string | null,
): SourceTreePreviewSelectionOverlaySnapshot {
  if (!container || selectedLayerIds.length === 0) {
    return { labelOverlay: null, rects: [], topLayerOverlays: [] };
  }

  const containerRect = container.getBoundingClientRect();
  const rects: SourceTreePreviewOverlayRect[] = [];
  const primaryClientRects: DOMRect[] = [];
  const primarySelectionHosts = new Map<DOMRect, HTMLElement>();
  const topLayerRectsByHost = new Map<HTMLElement, SourceTreePreviewOverlayRect[]>();
  const overlayLayerIds = root
    ? selectedLayerIds.flatMap((layerId) => getSourceTreePreviewOverlayLayerIds(container, root, layerId))
    : selectedLayerIds.map((layerId) => ({ layerId, primaryLayerId: layerId }));

  overlayLayerIds.forEach(({ layerId, primaryLayerId: rectPrimaryLayerId }) => {
    const virtualBoundaryRect = root
      ? getSourceTreePreviewVirtualBoundaryRect(container, root, layerId)
      : null;
    if (virtualBoundaryRect) {
      if (rectPrimaryLayerId === primaryLayerId) primaryClientRects.push(virtualBoundaryRect);
      rects.push({
        height: normalizeOverlayRectValue(virtualBoundaryRect.height),
        left: normalizeOverlayRectValue(virtualBoundaryRect.left - containerRect.left + container.scrollLeft),
        primary: rectPrimaryLayerId === primaryLayerId,
        root: false,
        top: normalizeOverlayRectValue(virtualBoundaryRect.top - containerRect.top + container.scrollTop),
        width: normalizeOverlayRectValue(virtualBoundaryRect.width),
      });
      return;
    }
    getPreviewNodeElements(container, layerId).forEach((element) => {
      const rect = getSourceTreePreviewSelectionVisualRect(element, container) ??
        getSourceTreePreviewFallbackVisualRect(element, container);
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      if (rectPrimaryLayerId === primaryLayerId) primaryClientRects.push(rect);
      const topLayerHost = getSourceTreePreviewTopLayerSelectionHost(element, container);
      if (topLayerHost) {
        if (rectPrimaryLayerId === primaryLayerId) primarySelectionHosts.set(rect, topLayerHost);
        const topLayerRect = toSourceTreePreviewOverlayRect(topLayerHost, rect);
        topLayerRect.primary = rectPrimaryLayerId === primaryLayerId;
        const hostRects = topLayerRectsByHost.get(topLayerHost) ?? [];
        hostRects.push(topLayerRect);
        topLayerRectsByHost.set(topLayerHost, hostRects);
        return;
      }

      rects.push({
        height: normalizeOverlayRectValue(rect.height),
        left: normalizeOverlayRectValue(rect.left - containerRect.left + container.scrollLeft),
        primary: rectPrimaryLayerId === primaryLayerId,
        root: root ? rectPrimaryLayerId === root.id : false,
        top: normalizeOverlayRectValue(rect.top - containerRect.top + container.scrollTop),
        width: normalizeOverlayRectValue(rect.width),
      });
    });
  });

  const labelAnchorRect = label
    ? getSourceTreePreviewSelectionLabelAnchorRect(container, primaryClientRects)
    : null;
  const labelHost = label
    ? (labelAnchorRect ? primarySelectionHosts.get(labelAnchorRect) : null)
      ?? getSourceTreePreviewPortalRoot(container)
      ?? container.ownerDocument.body
    : null;

  return {
    labelOverlay: label && labelHost && labelAnchorRect
      ? getSourceTreePreviewSelectionLabelOverlay(container, labelHost, labelAnchorRect, label)
      : null,
    rects,
    topLayerOverlays: Array.from(topLayerRectsByHost, ([host, hostRects]) => ({ host, rects: hostRects })),
  };
}

function getSourceTreePreviewSelectionLabelAnchorRect(
  container: HTMLElement,
  rects: DOMRect[],
): DOMRect | null {
  if (rects.length === 0) return null;
  const viewport = getSourceTreePreviewSelectionLabelViewport(container);
  return [...rects].sort((left, right) => {
    const leftIntersection = getSourceTreePreviewRectIntersectionArea(left, viewport);
    const rightIntersection = getSourceTreePreviewRectIntersectionArea(right, viewport);
    if (leftIntersection !== rightIntersection) return rightIntersection - leftIntersection;
    return getSourceTreePreviewRectDistance(left, viewport) - getSourceTreePreviewRectDistance(right, viewport);
  })[0] ?? null;
}

function getSourceTreePreviewSelectionLabelOverlay(
  container: HTMLElement,
  host: HTMLElement,
  anchorRect: DOMRect,
  label: string,
): SourceTreePreviewSelectionLabelOverlay {
  const viewport = getSourceTreePreviewSelectionLabelViewport(container);
  const availableWidth = Math.max(
    0,
    viewport.right - viewport.left - SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX * 2,
  );
  const estimatedWidth = Math.min(
    SOURCE_TREE_PREVIEW_SELECTION_LABEL_MAX_WIDTH_PX,
    Math.max(SOURCE_TREE_PREVIEW_SELECTION_LABEL_MIN_WIDTH_PX, estimateSourceTreePreviewSelectionLabelWidth(label)),
    availableWidth,
  );
  const minLeft = viewport.left + SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX;
  const maxLeft = Math.max(minLeft, viewport.right - SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX - estimatedWidth);
  const minTop = viewport.top + SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX;
  const maxTop = Math.max(
    minTop,
    viewport.bottom - SOURCE_TREE_PREVIEW_SELECTION_LABEL_GAP_PX - SOURCE_TREE_PREVIEW_SELECTION_LABEL_HEIGHT_PX,
  );
  return {
    host,
    left: normalizeOverlayRectValue(clampSourceTreePreviewRange(anchorRect.left, minLeft, maxLeft)),
    maxWidth: normalizeOverlayRectValue(estimatedWidth),
    top: normalizeOverlayRectValue(clampSourceTreePreviewRange(
      anchorRect.top - SOURCE_TREE_PREVIEW_SELECTION_LABEL_HEIGHT_PX,
      minTop,
      maxTop,
    )),
  };
}

function getSourceTreePreviewSelectionLabelViewport(container: HTMLElement): DOMRect {
  const containerRect = container.getBoundingClientRect();
  const ownerWindow = getSourceTreePreviewOwnerWindow(container);
  const rawLeft = containerRect.left + container.clientLeft;
  const rawTop = containerRect.top + container.clientTop;
  const left = Math.max(0, rawLeft);
  const top = Math.max(0, rawTop);
  const right = Math.min(ownerWindow.innerWidth, rawLeft + container.clientWidth);
  const bottom = Math.min(ownerWindow.innerHeight, rawTop + container.clientHeight);
  return DOMRect.fromRect({ x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) });
}

function getSourceTreePreviewRectIntersectionArea(rect: DOMRect, viewport: DOMRect): number {
  const width = Math.max(0, Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left));
  const height = Math.max(0, Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top));
  return width * height;
}

function getSourceTreePreviewRectDistance(rect: DOMRect, viewport: DOMRect): number {
  const horizontalDistance = rect.right < viewport.left
    ? viewport.left - rect.right
    : rect.left > viewport.right
      ? rect.left - viewport.right
      : 0;
  const verticalDistance = rect.bottom < viewport.top
    ? viewport.top - rect.bottom
    : rect.top > viewport.bottom
      ? rect.top - viewport.bottom
      : 0;
  return Math.hypot(horizontalDistance, verticalDistance);
}

function estimateSourceTreePreviewSelectionLabelWidth(label: string): number {
  const glyphWidth = Array.from(label).reduce((width, glyph) => (
    width + (/[^\u0000-\u00ff]/.test(glyph) ? 11 : /[MW@#%]/.test(glyph) ? 8 : 6.25)
  ), 0);
  return glyphWidth + 8;
}

function getSourceTreePreviewOverlayLayerIds(
  container: HTMLElement,
  root: EditableTreeNode,
  layerId: string,
): Array<{ layerId: string; primaryLayerId: string }> {
  const node = findSourceTreePreviewLayerNode(root, layerId);
  if (!node) return [{ layerId, primaryLayerId: layerId }];
  if (node.sourceMapBinding?.scope === 'collection') {
    return [{ layerId, primaryLayerId: layerId }];
  }
  if (layerId === root.id) return [{ layerId, primaryLayerId: layerId }];
  const directElements = getPreviewNodeElements(container, layerId);
  if (
    !isSourceTreePreviewTransparentRuntimeSelectionNode(root, layerId) &&
    directElements.some((element) => getSourceTreePreviewSelectionVisualRect(element, container))
  ) {
    return [{ layerId, primaryLayerId: layerId }];
  }
  const anchorLayerId = findSourceTreePreviewRenderedDescendantAnchorLayerId(container, node);
  if (anchorLayerId) return [{ layerId: anchorLayerId, primaryLayerId: layerId }];

  // Some compound components consume authored children as configuration
  // rather than rendering those child elements verbatim. The child remains a
  // real editable source node in Layers/Inspector, but it has no independent
  // DOM box while the runtime surface is closed. Preserve an honest canvas
  // selection by anchoring its labelled ring to the nearest rendered source
  // ancestor instead of silently showing no selection at all.
  const ancestorLayerId = findSourceTreePreviewRenderedAncestorAnchorLayerId(
    container,
    root,
    layerId,
  );
  return ancestorLayerId ? [{ layerId: ancestorLayerId, primaryLayerId: layerId }] : [];
}

function getSourceTreePreviewVirtualBoundaryRect(
  container: HTMLElement,
  root: EditableTreeNode,
  layerId: string,
): DOMRect | null {
  const node = findSourceTreePreviewLayerNode(root, layerId);
  if (node?.sourceMapBinding?.scope !== 'collection') return null;
  const childRects = (node.children ?? []).flatMap((child) => (
    getPreviewNodeElements(container, child.id)
      .map((element) => getPreviewNodeVisualRect(element))
      .filter((rect): rect is DOMRect => Boolean(rect && rect.width > 0 && rect.height > 0))
  ));
  if (childRects.length === 0) return null;
  const left = Math.min(...childRects.map((rect) => rect.left));
  const top = Math.min(...childRects.map((rect) => rect.top));
  const right = Math.max(...childRects.map((rect) => rect.right));
  const bottom = Math.max(...childRects.map((rect) => rect.bottom));
  return DOMRect.fromRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

function findSourceTreePreviewRenderedDescendantAnchorLayerId(
  container: HTMLElement,
  node: EditableTreeNode,
): string | null {
  let firstVisibleLayerId: string | null = null;

  const visit = (currentNode: EditableTreeNode): string | null => {
    for (const child of getSourceTreePreviewLayerChildren(currentNode)) {
      const visibleElements = getPreviewNodeElements(container, child.id).filter((element) => (
        !shouldIgnoreSourceTreePreviewVisualElement(element) &&
        Boolean(getPreviewNodeVisualRect(element))
      ));
      if (!firstVisibleLayerId && visibleElements.length > 0) firstVisibleLayerId = child.id;
      if (visibleElements.some((element) => (
        element.matches(SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR) ||
        Boolean(element.querySelector(SOURCE_TREE_PREVIEW_RUNTIME_INTERACTIVE_TARGET_SELECTOR))
      ))) {
        return child.id;
      }
      const descendantLayerId = visit(child);
      if (descendantLayerId) return descendantLayerId;
    }
    return null;
  };

  return visit(node) ?? firstVisibleLayerId;
}

function findSourceTreePreviewRenderedAncestorAnchorLayerId(
  container: HTMLElement,
  root: EditableTreeNode,
  layerId: string,
): string | null {
  let current = findEditableTreeParent(root, layerId);
  while (current) {
    const hasVisibleElement = getPreviewNodeElements(container, current.id).some((element) => (
      !shouldIgnoreSourceTreePreviewVisualElement(element) &&
      Boolean(getSourceTreePreviewSelectionVisualRect(element, container))
    ));
    if (hasVisibleElement) return current.id;
    current = findEditableTreeParent(root, current.id);
  }
  return null;
}

function getSourceTreePreviewFallbackVisualRect(element: HTMLElement, container: HTMLElement): DOMRect | null {
  let current = element.parentElement;
  while (current && current !== container) {
    if (
      hasSourceTreePreviewElementNodeId(current) &&
      !shouldIgnoreSourceTreePreviewVisualElement(current)
    ) {
      const rect = getPreviewNodeVisualRect(current);
      if (rect && rect.width > 0 && rect.height > 0) return rect;
    }
    current = current.parentElement;
  }
  return null;
}

function getSourceTreePreviewSelectionVisualRect(
  element: HTMLElement,
  container: HTMLElement,
): DOMRect | null {
  return getPreviewNodeVisualRect(
    getSourceTreePreviewSelectionBoundsElement(element, container),
  );
}

function getSourceTreePreviewSelectionBoundsElement(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement {
  // Collection children often render their authored source marker inside a
  // library-owned option/menuitem row. That row is the visible authored item;
  // resolve it before the portal boundary so top-layer options keep the full
  // row instead of collapsing to their inner text marker.
  const overlayItem = element.matches(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR)
    ? element
    : element.closest<HTMLElement>(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR);
  const portalRoot = getSourceTreePreviewPortalRoot(container);
  if (
    overlayItem &&
    (container.contains(overlayItem) || Boolean(portalRoot?.contains(overlayItem)))
  ) {
    return overlayItem;
  }

  const layerId = getSourceTreePreviewElementNodeId(element);
  const runtimeRootNodeId = getSourceTreePreviewRuntimeRootNodeId(element.className);
  const ownRect = element.getBoundingClientRect();
  if (
    runtimeRootNodeId === layerId &&
    ownRect.width > 0 &&
    ownRect.height > 0
  ) {
    return element;
  }

  // Native/portal top-layer wrappers frequently cover the viewport rather
  // than the authored control. Their visible source marker is already the
  // correct selection boundary.
  if (getSourceTreePreviewTopLayerSelectionHost(element, container)) return element;

  let current = element;
  let parent = current.parentElement;
  while (parent && parent !== container) {
    if (shouldIgnoreSourceTreePreviewVisualElement(parent)) break;
    const parentLayerId = getSourceTreePreviewElementNodeId(parent);
    if (parentLayerId && parentLayerId !== layerId) break;
    if (
      isSourceTreePreviewOutOfFlowVisualDescendant(parent) ||
      isSourceTreePreviewModalRootElement(parent)
    ) {
      break;
    }

    const hasForeignSourceMarker = Array.from(
      parent.querySelectorAll<HTMLElement>(SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR),
    ).some((candidate) => (
      !current.contains(candidate) &&
      getSourceTreePreviewElementNodeId(candidate) !== layerId
    ));
    if (hasForeignSourceMarker) break;

    current = parent;
    parent = current.parentElement;
  }
  return current;
}

function getSourceTreePreviewTopLayerSelectionHost(element: HTMLElement, container: HTMLElement): HTMLElement | null {
  const portalRoot = getSourceTreePreviewPortalRoot(container);
  const themePortalRoot = element.closest<HTMLElement>(SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR);
  const selectionPortalRoot = themePortalRoot ?? (portalRoot?.contains(element) ? portalRoot : null);
  const nativeTopLayerHost = getSourceTreePreviewNativeTopLayerHost(element);
  if (
    nativeTopLayerHost &&
    (container.contains(nativeTopLayerHost) || Boolean(selectionPortalRoot?.contains(nativeTopLayerHost)))
  ) {
    return nativeTopLayerHost;
  }
  const host = element.closest<HTMLElement>('.sidebar-drawer-root.is-open');
  if (host && (container.contains(host) || Boolean(selectionPortalRoot?.contains(host)))) return host;
  return selectionPortalRoot;
}

function getSourceTreePreviewControlledSurfaceHost(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current !== container) {
    if (
      current.id &&
      getSourceTreePreviewControllingElements(current).some((trigger) => (
        container.contains(trigger) &&
        Boolean(resolveSourceTreePreviewClosestRuntimeOwnerNodeId(trigger, container))
      ))
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getSourceTreePreviewDragRuntimeSurfaceHost(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement | null {
  // Nested popup editing belongs to the innermost controlled surface. Resolve
  // it before an outer portal or fixed dialog so a field option cannot compete
  // with unrelated surfaces behind it.
  return getSourceTreePreviewControlledSurfaceHost(element, container) ??
    getSourceTreePreviewNativeTopLayerHost(element) ??
    getSourceTreePreviewRuntimeOverlayVisualHost(element, container) ??
    getSourceTreePreviewTopLayerSelectionHost(element, container);
}

function resolveSourceTreePreviewDragGhostHost(
  candidateHost: HTMLElement | null,
  container: HTMLElement,
): HTMLElement | null {
  if (
    !candidateHost?.isConnected ||
    candidateHost.ownerDocument !== container.ownerDocument
  ) return null;
  if (getSourceTreePreviewNativeTopLayerHost(candidateHost) === candidateHost) {
    return candidateHost;
  }
  if (candidateHost.matches('.sidebar-drawer-root.is-open')) return candidateHost;
  if (getSourceTreePreviewControlledSurfaceHost(candidateHost, container) === candidateHost) {
    return candidateHost;
  }
  if (
    candidateHost.matches(
      `${SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR}, ${SOURCE_TREE_PREVIEW_THEME_PORTAL_ROOT_SELECTOR}`,
    )
  ) {
    return candidateHost;
  }
  return getSourceTreePreviewRuntimeOverlayVisualHost(candidateHost, container) === candidateHost
    ? candidateHost
    : null;
}

/**
 * The element an absolutely positioned child of `host` is laid out against:
 * the nearest ancestor-or-self that establishes a containing block. Editor
 * overlays are portaled into whatever surface owns the visible pixels, and
 * that surface is frequently `position: static` — its own rect is then the
 * wrong origin, off by however far the real containing block sits away.
 */
function getSourceTreePreviewAbsolutePositioningBase(
  host: HTMLElement,
  container: HTMLElement,
): HTMLElement {
  let current: HTMLElement | null = host;
  while (current) {
    const style = getSourceTreePreviewComputedStyle(current);
    if (
      style.position !== 'static' ||
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('filter') ||
      style.contain.includes('layout') ||
      style.contain.includes('paint') ||
      style.contain.includes('strict') ||
      style.contain.includes('content') ||
      !['', 'normal'].includes(style.getPropertyValue('container-type').trim())
    ) return current;
    current = current.parentElement;
  }
  return container;
}

function getSourceTreePreviewRuntimeOverlayVisualHost(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current && current !== container) {
    if (getSourceTreePreviewComputedStyle(current).position === 'fixed') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getSourceTreePreviewNativeTopLayerHost(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.matches('dialog[open]')) return current;
    try {
      if (current.matches('[popover]:popover-open')) return current;
    } catch {
      // Older embedded engines may parse `popover` but not `:popover-open`.
    }
    current = current.parentElement;
  }
  return null;
}

function getPreviewNodeElements(container: HTMLElement, layerId: string): HTMLElement[] {
  const roots = getSourceTreePreviewNodeQueryRoots(container);
  const escapedLayerId = escapeAttributeSelectorValue(layerId);
  const runtimeRootClassName = getSourceTreePreviewRuntimeRootClassName(layerId);
  const elements = Array.from(new Set(roots.flatMap((root) => (
    Array.from(root.querySelectorAll<HTMLElement>(
      `[data-wb-preview-node-id="${escapedLayerId}"], [${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE}="${escapedLayerId}"], .${runtimeRootClassName}`,
    ))
  ))));
  const projectedRuntimeOverlayItems = elements.filter((element) => (
    element.matches(SOURCE_TREE_PREVIEW_RUNTIME_OVERLAY_ITEM_SELECTOR) &&
    element.getAttribute('data-wb-preview-node-id') === layerId &&
    element.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) === layerId
  ));
  if (projectedRuntimeOverlayItems.length > 0) {
    // Collection wrappers can render the authored child inside a wider
    // semantic option row. Once that row is reconciled to the same source
    // node, it—not the nested label/content box—is the visible selection and
    // reorder boundary.
    return projectedRuntimeOverlayItems;
  }
  const structuralRuntimeRoots = elements.filter((element) => {
    if (getSourceTreePreviewRuntimeRootNodeId(element.className) !== layerId) return false;
    if (getSourceTreePreviewComputedStyle(element).display === 'contents') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  const isNestedRuntimeProjection = (element: HTMLElement) => (
    structuralRuntimeRoots.some((candidate) => (
      candidate !== element &&
      candidate.contains(element)
    ))
  );
  return elements.filter((element) => (
    !isNestedRuntimeProjection(element) &&
    !elements.some((candidate) => (
      candidate !== element &&
      element.contains(candidate) &&
      !isNestedRuntimeProjection(candidate)
    ))
  ));
}

function getSourceTreePreviewClassNameTokens(className: string): string[] {
  const boundedClassName = className.slice(
    0,
    SOURCE_TREE_PREVIEW_CLASS_EFFECTIVENESS_MAX_SOURCE_TEXT_LENGTH,
  );
  const tokens = new Set<string>();
  for (const token of boundedClassName.split(/\s+/)) {
    const normalized = token.trim();
    if (!normalized) continue;
    tokens.add(normalized);
    if (tokens.size >= SOURCE_TREE_PREVIEW_CLASS_EFFECTIVENESS_MAX_SOURCE_TOKENS) break;
  }
  return [...tokens];
}

function createSourceTreePreviewUnverifiedClassEffectivenessReport({
  classNames,
  layerId,
  reason,
  sourceClassName,
}: {
  classNames: readonly string[];
  layerId: string;
  reason: string;
  sourceClassName: string;
}): CssClassEffectivenessReport {
  return {
    entries: classNames.map((className) => ({
      appliedProperties: [],
      className,
      overriddenProperties: [],
      reason,
      status: 'unverified',
    })),
    layerId,
    renderedClassName: '',
    sourceClassName,
  };
}

function resolveSourceTreePreviewClassEffectivenessElement(
  container: HTMLElement,
  layerId: string,
  sourceClassNames: readonly string[],
): HTMLElement | null {
  const escapedLayerId = escapeAttributeSelectorValue(layerId);
  const runtimeRootClassName = getSourceTreePreviewRuntimeRootClassName(layerId);
  const selector = `[data-wb-preview-node-id="${escapedLayerId}"], .${runtimeRootClassName}`;
  const candidates = Array.from(new Set(
    getSourceTreePreviewNodeQueryRoots(container).flatMap((root) => (
      Array.from(root.querySelectorAll<HTMLElement>(selector))
    )),
  ));
  if (candidates.length === 0) return null;
  return candidates
    .map((element, index) => {
      const classOverlap = sourceClassNames.reduce(
        (count, className) => count + (element.classList.contains(className) ? 1 : 0),
        0,
      );
      const ownIdentity = element.getAttribute('data-wb-preview-node-id') === layerId ? 1 : 0;
      const runtimeIdentity = getSourceTreePreviewRuntimeRootNodeId(element.className) === layerId ? 1 : 0;
      return {
        element,
        index,
        score:
          classOverlap * 1_000_000 +
          ownIdentity * 100_000 +
          runtimeIdentity * 10_000,
      };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.element ?? null;
}

const SOURCE_TREE_PREVIEW_DEGENERATE_ANCHOR_SIZE_PX = 2;

/**
 * The elements that define a node's own visual footprint.
 *
 * Runtime projection can expose more than one element for a source node.
 * Prefer the node's own visible identity over delegated ownership elements.
 */
function getSourceTreePreviewNodeFootprintElements(
  container: HTMLElement,
  layerId: string,
): HTMLElement[] {
  const matched = getPreviewNodeElements(container, layerId);
  if (matched.length <= 1) return matched;
  // Own identity beats delegated ownership. A container that carries the node's
  // own id describes the node; elements that merely inherit it through runtime
  // ownership (the rows a collection surface renders on its behalf) describe
  // parts of it, and picking one of those would shrink the node to a single row.
  const ownIdentity = matched.filter((element) => (
    element.getAttribute('data-wb-preview-node-id') === layerId
  ));
  const elements = ownIdentity.length > 0 ? ownIdentity : matched;
  if (elements.length <= 1) return elements;
  const boxed = elements.filter(isSourceTreePreviewUsableVisualAnchor);
  return boxed.length > 0 ? boxed : elements;
}

/** A rendered element that can actually describe a node: visible and boxed. */
function isSourceTreePreviewUsableVisualAnchor(element: HTMLElement): boolean {
  if (shouldIgnoreSourceTreePreviewVisualElement(element)) return false;
  const rect = getPreviewNodeVisualRect(element);
  return Boolean(
    rect &&
    rect.width > SOURCE_TREE_PREVIEW_DEGENERATE_ANCHOR_SIZE_PX &&
    rect.height > SOURCE_TREE_PREVIEW_DEGENERATE_ANCHOR_SIZE_PX,
  );
}

function getSourceTreePreviewNodeQueryRoots(container: HTMLElement): HTMLElement[] {
  const roots = [container];
  const portalRoot = getSourceTreePreviewPortalRoot(container);
  if (portalRoot && !roots.includes(portalRoot)) roots.push(portalRoot);
  return roots;
}

function projectSourceTreePreviewControlledSurfaceOwnership(
  container: HTMLElement,
  root: EditableTreeNode,
): void {
  const queryRoots = getSourceTreePreviewNodeQueryRoots(container);
  for (const queryRoot of queryRoots) {
    for (const projectedSurface of queryRoot.querySelectorAll<HTMLElement>(
      `[${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE}="${SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS}"]`,
    )) {
      projectedSurface.removeAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE);
      projectedSurface.removeAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE);
    }
  }

  for (const trigger of container.querySelectorAll<HTMLElement>('[aria-controls]')) {
    const ownerElement = trigger.closest<HTMLElement>(
      SOURCE_TREE_PREVIEW_SELECTABLE_NODE_SELECTOR,
    );
    const ownerNodeId = ownerElement
      ? getSourceTreePreviewElementNodeId(ownerElement)
      : null;
    if (!ownerNodeId) continue;

    const controlledIds = (trigger.getAttribute('aria-controls') ?? '')
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
    for (const controlledId of controlledIds) {
      const escapedId = escapeAttributeSelectorValue(controlledId);
      const controlledSurface = queryRoots
        .map((queryRoot) => (
          queryRoot.id === controlledId
            ? queryRoot
            : queryRoot.querySelector<HTMLElement>(`[id="${escapedId}"]`)
        ))
        .find((candidate): candidate is HTMLElement => Boolean(candidate));
      if (!controlledSurface) continue;
      const runtimeRootNodeId = getSourceTreePreviewRuntimeRootNodeId(
        controlledSurface.className,
      );
      const projectedOwnerNodeId = runtimeRootNodeId ?? ownerNodeId;
      if (
        trigger.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE) ===
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS ||
        (
          !trigger.hasAttribute('data-wb-preview-node-id') &&
          !trigger.hasAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE)
        )
      ) {
        trigger.setAttribute(
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE,
          projectedOwnerNodeId,
        );
        trigger.setAttribute(
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE,
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS,
        );
      }
      if (
        !controlledSurface.hasAttribute('data-wb-preview-node-id') &&
        !(
          controlledSurface.hasAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE) &&
          controlledSurface.getAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE) !==
            SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS
        )
      ) {
        controlledSurface.setAttribute(
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE,
          projectedOwnerNodeId,
        );
        controlledSurface.setAttribute(
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ATTRIBUTE,
          SOURCE_TREE_PREVIEW_RUNTIME_OWNER_SOURCE_ARIA_CONTROLS,
        );
      }
      // A controlled surface that itself carries an authored node id (e.g. a
      // DropdownMenuContent rendered as the [role=menu] element) IS the
      // collection owner. Falling back to the trigger-side owner there would
      // reconcile the menu rows against the trigger's children (its icon) and
      // stamp those ids over the rows' correct authored identity.
      const controlledSurfaceNodeId = controlledSurface.getAttribute('data-wb-preview-node-id');
      const projectedOwnerNode =
        (controlledSurfaceNodeId
          ? findSourceTreePreviewLayerNode(root, controlledSurfaceNodeId)
          : null) ??
        findSourceTreePreviewLayerNode(root, projectedOwnerNodeId) ??
        findSourceTreePreviewLayerNode(root, ownerNodeId);
      if (projectedOwnerNode) {
        // Collection rows can survive a source reorder with their old
        // path-based preview IDs while the authored child markers receive the
        // refreshed IDs. Reconcile every controlled collection after both tree
        // refreshes and DOM mutations so the selection ring follows the
        // selected source child instead of the row that previously occupied
        // its index.
        projectSourceTreePreviewRuntimeOverlayCollection(
          controlledSurface,
          projectedOwnerNode,
          root,
        );
      }
    }
  }
}

function getSourceTreePreviewPortalRoot(container: HTMLElement): HTMLElement | null {
  const portalRoot = container.ownerDocument.querySelector<HTMLElement>(SOURCE_TREE_PREVIEW_PORTAL_ROOT_SELECTOR);
  if (!portalRoot || portalRoot === container || container.contains(portalRoot)) return null;
  return portalRoot;
}

function getPreviewNodeResizeTargets(container: HTMLElement, layerId: string): HTMLElement[] {
  const targets = new Set<HTMLElement>();
  for (const element of getPreviewNodeElements(container, layerId)) {
    if (shouldIgnoreSourceTreePreviewVisualElement(element)) continue;
    for (const descendantTarget of getSourceTreePreviewDescendantVisualTargets(element)) {
      targets.add(descendantTarget);
    }
    if (getSourceTreePreviewVisibleClientRects(element).length > 0) {
      if (!isSourceTreePreviewModalRootElement(element)) targets.add(element);
      continue;
    }

    for (const child of Array.from(element.children)) {
      if (
        isSourceTreePreviewHTMLElement(child)
        && !shouldIgnoreSourceTreePreviewVisualElement(child)
        && getSourceTreePreviewVisibleClientRects(child).length > 0
        && !isSourceTreePreviewModalRootElement(child)
      ) {
        targets.add(child);
      }
    }
  }
  return Array.from(targets);
}

function shouldIgnoreSourceTreePreviewSelectionElement(element: HTMLElement): boolean {
  return (
    element.classList.contains('sidebar-drawer-anchor') &&
    (element.classList.contains('is-hidden') || element.classList.contains('is-open-anchor'))
  );
}

function shouldIgnoreSourceTreePreviewVisualElement(element: HTMLElement): boolean {
  if (shouldIgnoreSourceTreePreviewSelectionElement(element)) return true;
  if (element.getAttribute('data-workbench-theme-portal-root') === 'true') return true;
  if (element.hidden) return true;
  if (isSourceTreePreviewHiddenInputElement(element)) return true;

  const style = getSourceTreePreviewComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return true;
  if (isSourceTreePreviewAriaHiddenFormHelperElement(element)) return true;
  return isSourceTreePreviewVisuallyHiddenHelperElement(element, style);
}

function isSourceTreePreviewModalRootElement(element: HTMLElement): boolean {
  return isSourceTreePreviewModalRootClassName(element.className) || element.classList.contains('sidebar-drawer-root');
}

function escapeAttributeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getPreviewNodeVisualRect(element: HTMLElement): DOMRect | null {
  const rects = getPreviewNodeVisualRects(element);
  if (rects.length === 0) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

function getPreviewNodeVisualRects(element: HTMLElement): DOMRect[] {
  if (shouldIgnoreSourceTreePreviewVisualElement(element)) {
    return getSourceTreePreviewControllingElements(element)
      .flatMap(getSourceTreePreviewVisibleClientRects);
  }

  const drawerRect = getSourceTreePreviewOpenDrawerRect(element);
  if (drawerRect) return [drawerRect];

  const controlledRuntimeRootRects =
    getSourceTreePreviewControlledRuntimeRootVisualRects(element);
  if (controlledRuntimeRootRects.length > 0) return controlledRuntimeRootRects;

  const ownRects = getSourceTreePreviewVisibleClientRects(element);
  const descendantRects = getSourceTreePreviewDescendantVisualRects(element);
  if (ownRects.length > 0) {
    return shouldExpandSourceTreePreviewVisualBounds(element, descendantRects)
      ? [...ownRects, ...descendantRects]
      : ownRects;
  }

  const children = Array.from(element.children);
  const childRects = children.length <= SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT
    ? children.flatMap((child) => (
        isSourceTreePreviewHTMLElement(child) ? getPreviewNodeVisualRects(child) : []
      ))
    : [];
  if (childRects.length > 0) return childRects;

  // DOM-less compound components often project their Workbench root marker
  // onto the controlled menu/dialog surface while the visible trigger is a
  // sibling. When that surface is closed it has no box. aria-controls is the
  // shared rendered relationship that lets selection, hit testing, and drag
  // geometry use the trigger without component-name exceptions or wrappers.
  return getSourceTreePreviewControllingElements(element)
    .flatMap(getSourceTreePreviewVisibleClientRects);
}

function getSourceTreePreviewControlledRuntimeRootVisualRects(
  element: HTMLElement,
): DOMRect[] {
  // A DOM-less compound root can project its runtime marker onto an opened
  // menu/dialog/listbox surface. That surface is an overlay, not the
  // component's structural layout box. Keeping its popup height here would
  // make drag placeholders and interpolated parents grow even though the
  // authored page layout did not.
  if (!getSourceTreePreviewRuntimeRootNodeId(element.className)) return [];
  return getSourceTreePreviewControllingElements(element)
    .flatMap(getSourceTreePreviewVisibleClientRects);
}

function shouldExpandSourceTreePreviewVisualBounds(element: HTMLElement, descendantRects: DOMRect[]): boolean {
  if (descendantRects.length === 0) return false;
  if (
    descendantRects.length > 0 &&
    element.classList.contains('wb-source-visual-authored-node') &&
    Boolean(element.querySelector(':scope > .wb-source-visual-node--runtime-component'))
  ) {
    return true;
  }
  if (!isSourceTreePreviewRuntimeComponentRootElement(element)) return false;

  const ownRect = element.getBoundingClientRect();
  return descendantRects.some((rect) => isSourceTreePreviewRectOutsideRect(rect, ownRect));
}

function getSourceTreePreviewDescendantVisualRects(element: HTMLElement): DOMRect[] {
  return getSourceTreePreviewDescendantVisualTargets(element)
    .flatMap(getSourceTreePreviewVisibleClientRects);
}

function getSourceTreePreviewDescendantVisualTargets(element: HTMLElement): HTMLElement[] {
  if (isSourceTreePreviewRuntimeComponentRootElement(element)) {
    const children = Array.from(element.children);
    if (children.length > SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT) return [];
    return children
      .filter((target): target is HTMLElement => (
        isSourceTreePreviewHTMLElement(target) &&
        !shouldIgnoreSourceTreePreviewVisualElement(target) &&
        !isSourceTreePreviewOutOfFlowVisualDescendant(target) &&
        !isSourceTreePreviewModalRootElement(target)
      ));
  }

  if (
    !element.classList.contains('wb-source-visual-authored-node') ||
    !element.querySelector(':scope > .wb-source-visual-node--runtime-component')
  ) {
    return [];
  }
  const targets = Array.from(
    element.querySelectorAll<HTMLElement>(':scope > .wb-source-visual-node--runtime-component > *'),
  );
  if (targets.length > SOURCE_TREE_PREVIEW_VISUAL_DESCENDANT_SCAN_LIMIT) return [];
  return targets
    .filter((target) => (
      !shouldIgnoreSourceTreePreviewVisualElement(target) &&
      !isSourceTreePreviewOutOfFlowVisualDescendant(target) &&
      !isSourceTreePreviewModalRootElement(target)
    ));
}

function isSourceTreePreviewOutOfFlowVisualDescendant(element: HTMLElement): boolean {
  const style = getSourceTreePreviewComputedStyle(element);
  return style.position === 'absolute' || style.position === 'fixed';
}

function getSourceTreePreviewVisibleClientRects(element: HTMLElement): DOMRect[] {
  if (shouldIgnoreSourceTreePreviewVisualElement(element)) return [];
  if (isSourceTreePreviewTableVisualElement(element)) {
    const tableRect = element.getBoundingClientRect();
    return tableRect.width > 0 && tableRect.height > 0 ? [tableRect] : [];
  }
  const rects = Array.from(element.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length > 0) {
    return expandSourceTreePreviewTrimmedTextBoxRects(element, rects);
  }
  const fallbackRect = element.getBoundingClientRect();
  return fallbackRect.width > 0 && fallbackRect.height > 0
    ? expandSourceTreePreviewTrimmedTextBoxRects(element, [fallbackRect])
    : [];
}

// text-box-trim (optical alignment / capsize) shrinks a text block's layout
// box below its painted glyphs, so element rects underreport what the user
// sees and selection rings, hover indicators, drag ghosts, and resize targets
// hug less than the visible text. Inline-level line boxes are not trimmed, so
// union the element's content line boxes back into its measured rects.
function expandSourceTreePreviewTrimmedTextBoxRects(
  element: HTMLElement,
  rects: DOMRect[],
): DOMRect[] {
  const trim = getSourceTreePreviewComputedStyle(element).getPropertyValue('text-box-trim').trim();
  if (!trim || trim === 'none') return rects;
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  const lineRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  if (lineRects.length === 0) return rects;
  return [...rects, ...lineRects];
}

function isSourceTreePreviewRuntimeComponentRootElement(element: HTMLElement): boolean {
  return element.getAttribute('data-wb-runtime-component-root') === 'true';
}

function isSourceTreePreviewRectOutsideRect(rect: DOMRect, containerRect: DOMRect): boolean {
  const tolerance = 0.5;
  return rect.left < containerRect.left - tolerance ||
    rect.top < containerRect.top - tolerance ||
    rect.right > containerRect.right + tolerance ||
    rect.bottom > containerRect.bottom + tolerance;
}

function isSourceTreePreviewTableVisualElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  if (SOURCE_TREE_PREVIEW_TABLE_VISUAL_TAG_NAMES.has(tagName)) return true;
  return SOURCE_TREE_PREVIEW_TABLE_VISUAL_DISPLAY_NAMES.has(getSourceTreePreviewComputedStyle(element).display);
}

function isSourceTreePreviewHiddenInputElement(element: HTMLElement): boolean {
  return element.tagName.toLowerCase() === 'input' && element.getAttribute('type')?.toLowerCase() === 'hidden';
}

function isSourceTreePreviewAriaHiddenFormHelperElement(element: HTMLElement): boolean {
  if (element.getAttribute('aria-hidden') !== 'true') return false;
  const tagName = element.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'select' || tagName === 'textarea';
}

function isSourceTreePreviewVisuallyHiddenHelperElement(
  element: HTMLElement,
  style: CSSStyleDeclaration,
): boolean {
  if (element.getAttribute('aria-hidden') !== 'true') return false;
  return style.clipPath !== 'none' ||
    style.clip !== 'auto' ||
    (style.overflow === 'hidden' && isSourceTreePreviewTinyComputedBox(style));
}

function isSourceTreePreviewTinyComputedBox(style: CSSStyleDeclaration): boolean {
  const width = Number.parseFloat(style.width);
  const height = Number.parseFloat(style.height);
  return Number.isFinite(width) &&
    Number.isFinite(height) &&
    width <= 2 &&
    height <= 2;
}

function getSourceTreePreviewOpenDrawerRect(element: HTMLElement): DOMRect | null {
  const drawerRoot = element.matches('.sidebar-drawer-root.is-open')
    ? element
    : element.querySelector<HTMLElement>('.sidebar-drawer-root.is-open');
  if (!drawerRoot) return null;
  const panel = drawerRoot.querySelector<HTMLElement>('.sidebar-drawer-panel');
  const rect = (panel ?? drawerRoot).getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function normalizeOverlayRectValue(value: number): number {
  return Math.round(value * 2) / 2;
}

function areOverlayRectsEqual(
  left: SourceTreePreviewOverlayRect[],
  right: SourceTreePreviewOverlayRect[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((leftRect, index) => {
    const rightRect = right[index];
    return Boolean(rightRect) &&
      Math.abs(leftRect.left - rightRect.left) < 0.5 &&
      leftRect.primary === rightRect.primary &&
      Math.abs(leftRect.top - rightRect.top) < 0.5 &&
      Math.abs(leftRect.width - rightRect.width) < 0.5 &&
      Math.abs(leftRect.height - rightRect.height) < 0.5;
  });
}

function areTopLayerOverlaysEqual(
  left: SourceTreePreviewTopLayerOverlay[],
  right: SourceTreePreviewTopLayerOverlay[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((leftOverlay, index) => {
    const rightOverlay = right[index];
    return Boolean(rightOverlay) &&
      leftOverlay.host === rightOverlay.host &&
      areOverlayRectsEqual(leftOverlay.rects, rightOverlay.rects);
  });
}

function areSelectionLabelOverlaysEqual(
  left: SourceTreePreviewSelectionLabelOverlay | null,
  right: SourceTreePreviewSelectionLabelOverlay | null,
): boolean {
  if (!left || !right) return left === right;
  return left.host === right.host &&
    Math.abs(left.left - right.left) < 0.5 &&
    Math.abs(left.top - right.top) < 0.5 &&
    Math.abs(left.maxWidth - right.maxWidth) < 0.5;
}

function areNoteBoxOverlayItemsEqual(
  left: SourceTreePreviewNoteBoxOverlayItem[],
  right: SourceTreePreviewNoteBoxOverlayItem[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((leftItem, index) => {
    const rightItem = right[index];
    return Boolean(rightItem) &&
      leftItem.box.id === rightItem.box.id &&
      areOverlayRectsEqual([leftItem.rect], [rightItem.rect]);
  });
}

function handleSourceTreePreviewNodeKeyDown(
  event: ReactKeyboardEvent<HTMLElement>,
  layerId: string,
  onSelectLayer: (layerId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  onSelectLayer(layerId, 'deep', isSourceTreePreviewAdditiveSelectionEvent(event));
}

type SourceTreePreviewSelectionModifierEvent =
  Pick<ReactKeyboardEvent<HTMLElement> | ReactMouseEvent<HTMLElement> | ReactPointerEvent<HTMLElement>, 'ctrlKey' | 'metaKey' | 'shiftKey'> & {
    altKey?: boolean;
  };

type SourceTreePreviewRuntimeActivationGestureEvent =
  SourceTreePreviewSelectionModifierEvent & {
    nativeEvent?: Event;
    pointerId?: number;
    target: EventTarget | null;
  };

function isSourceTreePreviewAdditiveSelectionEvent(event: SourceTreePreviewSelectionModifierEvent): boolean {
  return event.shiftKey;
}

function isSourceTreePreviewRuntimeActivationEvent(
  event: SourceTreePreviewSelectionModifierEvent,
): boolean {
  return Boolean(event.altKey) && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function getSourceTreePreviewModifierSelectionMode(
  event: SourceTreePreviewSelectionModifierEvent,
  modifierPressed = event.metaKey || event.ctrlKey,
): SourceTreePreviewSelectionMode {
  if (!modifierPressed) return 'direct';
  return 'smart-deep';
}

const INLINE_JSX_NAMES = new Set([
  'a', 'abbr', 'b', 'br', 'cite', 'code', 'data', 'del', 'em', 'i', 'ins', 'kbd',
  'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var',
]);

const SOURCE_TREE_PREVIEW_VOID_HOST_TAG_NAMES = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const SOURCE_TREE_PREVIEW_INTERNAL_SOURCE_ATTRIBUTES = new Set([
  SOURCE_ASSET_KIND_ATTRIBUTE,
  SOURCE_ASSET_SOURCE_ATTRIBUTE,
  SOURCE_ICON_NAME_ATTRIBUTE,
  SOURCE_ICON_SET_ATTRIBUTE,
  SOURCE_TOKEN_MODE_ATTRIBUTE,
]);

const SOURCE_TREE_PREVIEW_RUNTIME_COMPONENT_ALIAS_ROOT_NAMES = new Set([
  'AccordionContent',
  'AccordionItem',
  'AccordionTrigger',
  'Alert',
  'AlertAction',
  'AlertDescription',
  'AlertTitle',
  'AppShell',
  'AspectRatio',
  'Avatar',
  'AvatarBadge',
  'AvatarFallback',
  'AvatarGroup',
  'AvatarGroupCount',
  'AvatarImage',
  'Badge',
  'BreadcrumbItem',
  'BreadcrumbLink',
  'Button',
  'BreadcrumbList',
  'BreadcrumbPage',
  'BreadcrumbSeparator',
  'Button',
  'ButtonGroup',
  'ButtonGroupSeparator',
  'ButtonGroupText',
  'Calendar',
  'CalendarDayButton',
  'Card',
  'CardAction',
  'CardContent',
  'CardDescription',
  'CardFooter',
  'CardHeader',
  'CardTitle',
  'Carousel',
  'CarouselContent',
  'CarouselItem',
  'CarouselNext',
  'CarouselPrevious',
  'Checkbox',
  'Collapsible',
  'CollapsibleContent',
  'CollapsibleTrigger',
  'Empty',
  'EmptyContent',
  'EmptyDescription',
  'EmptyHeader',
  'EmptyMedia',
  'EmptyTitle',
  'Field',
  'FieldContent',
  'FieldDescription',
  'FieldGroup',
  'FieldLabel',
  'FieldLegend',
  'FieldSet',
  'FieldTitle',
  'Grid',
  'Heading',
  'Icon',
  'Input',
  'InputGroup',
  'InputGroupAddon',
  'InputGroupButton',
  'InputGroupInput',
  'InputGroupText',
  'InputOTPGroup',
  'InputOTPSeparator',
  'InputOTPSlot',
  'Item',
  'ItemActions',
  'ItemContent',
  'ItemDescription',
  'ItemGroup',
  'ItemMedia',
  'ItemSlot',
  'ItemTitle',
  'Kbd',
  'KbdGroup',
  'Label',
  'ListItem',
  'Layout',
  'MetadataList',
  'MetadataListItem',
  'NativeSelectOptGroup',
  'NativeSelectOption',
  'NavigationMenu',
  'NavigationMenuContent',
  'NavigationMenuItem',
  'NavigationMenuLink',
  'NavigationMenuList',
  'NavigationMenuTrigger',
  'PaginationContent',
  'PaginationEllipsis',
  'PaginationItem',
  'PaginationLink',
  'PaginationNext',
  'PaginationPrevious',
  'Progress',
  'ProgressLabel',
  'ProgressValue',
  'RadioList',
  'RadioListItem',
  'RadioGroup',
  'RadioGroupItem',
  'ScrollArea',
  'Section',
  'Separator',
  'SideNav',
  'Skeleton',
  'Slider',
  'Spinner',
  'Switch',
  'Table',
  'TableBody',
  'TableCaption',
  'TableCell',
  'TableFooter',
  'TableHead',
  'TableHeader',
  'TableRow',
  'TabsContent',
  'TabsList',
  'TabsTrigger',
  'Textarea',
  'Text',
  'Theme',
  'Thumbnail',
  'Toggle',
  'ToggleGroup',
  'ToggleGroupItem',
  'TopNav',
  // Design-system layout primitives must not get an extra block selection
  // anchor because that changes flex, sticky, scroll, and full-height layouts.
  'FlickingPage',
  'FlickingPages',
  'Stack',
  'ToastStack',
  'WbdsFlickingPage',
  'WbdsFlickingPages',
  'WbdsStack',
  'WbdsToastStack',
  'WbdsAvatar',
  'WbdsBadge',
  'WbdsButton',
  'WbdsIcon',
  'WbdsIconButton',
  'WbdsSidebar',
  'WbdsText',
  'WbdsTextarea',
  'WbdsTextField',
  'WbdsTabs',
  'WbdsTabsPanel',
]);

const SOURCE_TREE_PREVIEW_RUNTIME_FALLBACK_HOST_TAG_NAMES = new Map<string, string>([
  ['Table', 'table'],
  ['TableCaption', 'caption'],
  ['TableHeader', 'thead'],
  ['TableBody', 'tbody'],
  ['TableFooter', 'tfoot'],
  ['TableRow', 'tr'],
  ['TableHead', 'th'],
  ['TableCell', 'td'],
]);

const SOURCE_TREE_PREVIEW_TABLE_STRUCTURE_HOST_TAG_NAMES = new Set([
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
]);

const SOURCE_TREE_PREVIEW_TABLE_VISUAL_TAG_NAMES = new Set([
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
]);

const SOURCE_TREE_PREVIEW_TABLE_VISUAL_DISPLAY_NAMES = new Set([
  'inline-table',
  'table',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
  'table-footer-group',
  'table-header-group',
  'table-row',
  'table-row-group',
]);

const SOURCE_TREE_PREVIEW_COMPONENT_OWN_CHILDREN_NAMES = new Set([
  // AppSidebar switches to its fallback navigation when children are omitted.
  // Passing hydrated edit-time children changes the authored runtime branch and
  // makes the shadcn dashboard sidebar render as raw list/link content.
  'AppSidebar',
]);

const SOURCE_TREE_PREVIEW_RUNTIME_SLOT_CHILD_NAMES = new Set([
  'ItemSlot',
]);

const SOURCE_TREE_PREVIEW_RUNTIME_PLAIN_TEXT_CHILD_NAMES = new Set([
  'NativeSelectOption',
  'SelectItem',
]);

const SOURCE_TREE_PREVIEW_RUNTIME_RAW_TEXT_DESCENDANT_NAMES = new Set([
  // TypingKeyword parses its React children into animation units. Keep authored
  // element boundaries selectable, but do not interpose editor-only elements
  // between those boundaries and their text leaves.
  'WbdsTypingKeyword',
]);

function isInlineJsxName(jsxName: string | undefined): boolean {
  return Boolean(jsxName) && INLINE_JSX_NAMES.has(jsxName!);
}

function shouldLetSourceTreePreviewComponentOwnChildren(jsxName: string | undefined): boolean {
  return Boolean(jsxName && SOURCE_TREE_PREVIEW_COMPONENT_OWN_CHILDREN_NAMES.has(jsxName));
}

function shouldPassSourceTreePreviewRuntimeOwnedChildren(node: EditableTreeNode): boolean {
  // Wrapperless authored children are the default contract for every
  // source-backed component instance. Component-name allowlists inevitably
  // leave new compound components rendering editor wrappers between the
  // parent and its real children, which breaks child parsing, direct-child CSS,
  // portals, and source identity. Components that intentionally own an
  // alternate runtime branch are handled separately by
  // shouldLetSourceTreePreviewComponentOwnChildren.
  return (
    node.kind === 'component-instance' &&
    getSourceTreePreviewRenderableChildren(node).length > 0
  ) ||
    hasSourceTreePreviewRuntimeSlotChildren(node);
}

function hasSourceTreePreviewRuntimeSlotChildren(node: EditableTreeNode): boolean {
  return getSourceTreePreviewRenderableChildren(node).some((child) => (
    getSourceTreePreviewRuntimeComponentNameCandidates(child)
      .some((name) => SOURCE_TREE_PREVIEW_RUNTIME_SLOT_CHILD_NAMES.has(name))
  ));
}

function shouldPreserveSourceTreePreviewRuntimeInteraction(node: EditableTreeNode): boolean {
  // Compound-component children retain their own event contract. Editor
  // selection is delegated from the preview container instead of being
  // injected into individual component props, so this does not require a
  // component-name allowlist.
  return node.kind === 'component-instance';
}

function shouldRenderSourceTreePreviewRuntimePlainTextChildren(node: EditableTreeNode): boolean {
  return getSourceTreePreviewRuntimeComponentNameCandidates(node)
    .some((name) => SOURCE_TREE_PREVIEW_RUNTIME_PLAIN_TEXT_CHILD_NAMES.has(name));
}

function shouldRenderSourceTreePreviewRuntimeRawTextDescendants(node: EditableTreeNode): boolean {
  return getSourceTreePreviewRuntimeComponentNameCandidates(node)
    .some((name) => SOURCE_TREE_PREVIEW_RUNTIME_RAW_TEXT_DESCENDANT_NAMES.has(name));
}

function getSourceTreePreviewRuntimeFallbackHostTagName(node: EditableTreeNode): string | null {
  for (const name of getSourceTreePreviewRuntimeComponentNameCandidates(node)) {
    const hostTagName = SOURCE_TREE_PREVIEW_RUNTIME_FALLBACK_HOST_TAG_NAMES.get(name);
    if (hostTagName) return hostTagName;
  }
  return null;
}

function getSourceTreePreviewRuntimeComponentNameCandidates(node: EditableTreeNode): string[] {
  const names = [
    node.source?.jsxName,
    node.source?.importName,
  ].filter((name, index, names): name is string => (
    typeof name === 'string' &&
    name.trim().length > 0 &&
    names.indexOf(name) === index
  ));
  const candidates = new Set<string>();
  for (const name of names) {
    candidates.add(name);
    for (const alias of getSourceTreePreviewRuntimeComponentNameAliases(name)) {
      candidates.add(alias);
    }
  }
  return [...candidates];
}

function getSourceTreePreviewRuntimeComponentNameAliases(name: string): string[] {
  const aliases: string[] = [];
  for (const rootName of getSourceTreePreviewRuntimeComponentAliasRootNames()) {
    if (name === rootName) continue;
    if (name.endsWith(rootName) || name.endsWith(`${rootName}s`)) aliases.push(rootName);
  }
  return aliases;
}

function getSourceTreePreviewRuntimeComponentAliasRootNames(): string[] {
  return [
    ...SOURCE_TREE_PREVIEW_RUNTIME_COMPONENT_ALIAS_ROOT_NAMES,
    ...SOURCE_TREE_PREVIEW_RUNTIME_FALLBACK_HOST_TAG_NAMES.keys(),
  ];
}

function getSourceTreePreviewRuntimeFallbackHostProps(
  hostTagName: string,
  nodeElementProps: Record<string, unknown>,
): Record<string, unknown> {
  void hostTagName;
  return getSourceTreePreviewDirectNodeProps(nodeElementProps);
}

function getSourceTreePreviewRuntimeFallbackHostContent(
  hostTagName: string,
  renderedChildren: ReactNode[],
  guardedNodeContent: ReactNode,
): ReactNode {
  if (renderedChildren.length > 0) return renderedChildren;
  if (SOURCE_TREE_PREVIEW_TABLE_STRUCTURE_HOST_TAG_NAMES.has(hostTagName)) return null;
  return guardedNodeContent;
}

function getSourceTreePreviewDirectNodeProps(
  nodeElementProps: Record<string, unknown>,
): Record<string, unknown> {
  const {
    className: _className,
    role: _role,
    style: _style,
    tabIndex: _tabIndex,
    ...runtimeNodeProps
  } = nodeElementProps;
  const ownerNodeId = typeof runtimeNodeProps['data-wb-preview-node-id'] === 'string'
    ? runtimeNodeProps['data-wb-preview-node-id']
    : undefined;
  return {
    ...runtimeNodeProps,
    'data-wb-runtime-component-root': 'true',
    ...(ownerNodeId ? { [SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE]: ownerNodeId } : null),
    ref: (element: unknown) => {
      if (!isSourceTreePreviewHTMLElement(element)) return;
      syncSourceTreePreviewDirectNodeAttributes(element, runtimeNodeProps, ownerNodeId);
    },
  };
}

function getSourceTreePreviewComponentNodeProps(
  nodeElementProps: Record<string, unknown>,
): Record<string, unknown> {
  return getSourceTreePreviewProjectComponentProps(
    getSourceTreePreviewDirectNodeProps(nodeElementProps),
  );
}

function syncSourceTreePreviewDirectNodeAttributes(
  element: HTMLElement,
  runtimeNodeProps: Record<string, unknown>,
  ownerNodeId: string | undefined,
): void {
  for (const [name, value] of Object.entries(runtimeNodeProps)) {
    if (!name.startsWith('data-wb-')) continue;
    if (typeof value === 'string') element.setAttribute(name, value);
    else element.removeAttribute(name);
  }
  element.setAttribute('data-wb-runtime-component-root', 'true');
  if (ownerNodeId) {
    element.setAttribute(SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE, ownerNodeId);
  }
}

function getSourceTreePreviewHostTagName(node: EditableTreeNode): string | null {
  const jsxName = node.source?.jsxName;
  if (!jsxName || jsxName === 'Fragment') return null;
  if (!isSourceIntrinsicElementTagName(jsxName)) return null;
  return jsxName;
}

function isSourceTreePreviewVoidHostTagName(tagName: string): boolean {
  return SOURCE_TREE_PREVIEW_VOID_HOST_TAG_NAMES.has(tagName);
}

function getSourceTreePreviewHostElementProps(
  hostTagName: string,
  nodeElementProps: Record<string, unknown>,
  sourceAttributes: EditableTreeSourceAttributes,
  sourceProps?: EditableTreeSourceProps,
): Record<string, unknown> {
  void hostTagName;
  const hostProps = getSourceTreePreviewNativeSourceProps(sourceProps);
  for (const [propName, value] of Object.entries(nodeElementProps)) {
    if (value !== undefined) hostProps[propName] = value;
  }
  for (const [attributeName, value] of Object.entries(sourceAttributes)) {
    if (
      attributeName === 'className' ||
      attributeName === 'hidden' ||
      SOURCE_TREE_PREVIEW_INTERNAL_SOURCE_ATTRIBUTES.has(attributeName)
    ) {
      continue;
    }
    hostProps[attributeName] = value;
  }
  return hostProps;
}

const SOURCE_TREE_PREVIEW_BLOCKED_NATIVE_SOURCE_PROP_NAMES = new Set([
  'children',
  'dangerouslySetInnerHTML',
  'key',
  'ref',
  'style',
]);

function getSourceTreePreviewNativeSourceProps(
  sourceProps: EditableTreeSourceProps | undefined,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [propName, value] of Object.entries(sourceProps ?? {})) {
    if (
      SOURCE_TREE_PREVIEW_BLOCKED_NATIVE_SOURCE_PROP_NAMES.has(propName) ||
      /^on[A-Z]/.test(propName) ||
      !/^[A-Za-z_][\w:.-]*$/.test(propName)
    ) {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      props[propName] = value;
    }
  }
  return props;
}

function getSourceTreePreviewNodeClass(node: EditableTreeNode): string | null {
  const jsxName = node.source?.jsxName;
  if (!jsxName) return null;
  if (jsxName === 'main') return 'wb-source-visual-node--main';
  if (jsxName === 'section') return 'wb-source-visual-node--section';
  if (node.kind === 'component-instance') {
    return isExpandedLocalSourceComponentInstance(node)
      ? 'wb-source-visual-node--local-component'
      : 'wb-source-visual-node--component-instance';
  }
  if (jsxName === 'button') return 'wb-source-visual-node--button';
  if (/^h[1-6]$/.test(jsxName)) return `wb-source-visual-node--heading wb-source-visual-node--heading-${jsxName.slice(1)}`;
  if (jsxName === 'p') return 'wb-source-visual-node--paragraph';
  if (jsxName === 'br') return 'wb-source-visual-node--br';
  if (isInlineJsxName(jsxName)) return 'wb-source-visual-node--inline';
  return null;
}

function isExpandedLocalSourceComponentInstance(node: EditableTreeNode): boolean {
  return node.kind === 'component-instance' &&
    !node.source?.importSource &&
    Boolean(node.source?.jsxName && /^[A-Z]/.test(node.source.jsxName)) &&
    (node.sourcePreviewChildren?.length ?? 0) > 0;
}

function isSourceTextLeaf(node: EditableTreeNode): boolean {
  return node.kind === 'text' && node.source?.jsxName === 'text';
}

function isSourceWhitespaceTextLeaf(node: EditableTreeNode): boolean {
  return isSourceTextLeaf(node) && node.source?.whitespace === true;
}

function getSourceTreePreviewProjectRuntimeState(
  node: EditableTreeNode,
  projectRuntimeComponents: ProjectSourceRuntimeComponents,
): ProjectSourceRuntimeComponentState | null {
  if (!hasProjectSourceRuntimeImport(node)) return null;
  const sourceFile = node.source?.sourceFile ?? '';
  const importSource = node.source?.importSource ?? '';
  const importName = node.source?.importName ?? node.source?.jsxName ?? 'default';
  return projectRuntimeComponents.get(getProjectRuntimeComponentKey(sourceFile, importSource, importName)) ?? null;
}

function getSourceTreePreviewProjectComponent(
  node: EditableTreeNode,
  projectRuntimeComponents: ProjectSourceRuntimeComponents,
): ElementType<Record<string, unknown>> | null {
  const runtimeState = getSourceTreePreviewProjectRuntimeState(node, projectRuntimeComponents);
  return runtimeState?.status === 'ready' ? runtimeState.component : null;
}

function hasProjectSourceRuntimeImport(node: EditableTreeNode): boolean {
  const importName = node.source?.importName ?? node.source?.jsxName ?? 'default';
  const importSource = node.source?.importSource;
  return (
    typeof node.source?.sourceFile === 'string' &&
    typeof importSource === 'string' &&
    (isProjectLocalImportSource(importSource) || isTablerIconRuntimeImport({ importName, importSource }))
  );
}

function isTablerIconRuntimeImport(runtimeImport: Pick<ProjectRuntimeImport, 'importName' | 'importSource'>): boolean {
  return runtimeImport.importSource === TABLER_ICONS_REACT_IMPORT_SOURCE &&
    isSupportedTablerIconImportName(runtimeImport.importName);
}

function isLucideIconRuntimeImport(runtimeImport: Pick<ProjectRuntimeImport, 'importName' | 'importSource'>): boolean {
  if (runtimeImport.importSource !== LUCIDE_REACT_IMPORT_SOURCE) return false;
  return /^[A-Z][A-Za-z0-9]*(?:Icon)?$/.test(runtimeImport.importName) ||
    /^Lucide[A-Z][A-Za-z0-9]*$/.test(runtimeImport.importName);
}

function isRemixIconRuntimeImport(runtimeImport: Pick<ProjectRuntimeImport, 'importName' | 'importSource'>): boolean {
  return runtimeImport.importSource === REMIXICON_REACT_IMPORT_SOURCE &&
    /^Ri[A-Z0-9][A-Za-z0-9]*$/.test(runtimeImport.importName);
}

function getProjectRuntimeComponentKey(sourceFile: string, importSource: string, importName: string): string {
  return `${sourceFile}::${importSource}::${importName}`;
}

function renderSourceTreePreviewComponent(
  Component: ElementType<Record<string, unknown>>,
  node: EditableTreeNode,
  nodeStyle: CSSProperties | undefined,
  tokenRegistry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
  children: ReactNode[],
  sourcePropOverrides?: Partial<EditableTreeSourceProps>,
  projectRuntimeComponents?: ProjectSourceRuntimeComponents,
  onSourceNodeComponentPropChange?: SourceTreePreviewComponentPropChange,
  modeScope?: {
    className: string;
  },
  runtimePreviewNodeProps?: Record<string, unknown>,
): ReactNode {
  const intrinsicStyle = getSourceTreePreviewIntrinsicStyle(nodeStyle);
  const props = normalizeSourceTreePreviewComponentProps(node.source?.jsxName, {
    ...resolveSourceTreePreviewComponentPropTokens(node.sourceProps ?? {}, tokenRegistry, previewTokenModes),
    ...getSourceTreePreviewRuntimeSourceProps(node),
    ...resolveSourceTreePreviewJsxElementProps(node, projectRuntimeComponents),
    ...getSourceTreePreviewRuntimeSourceAttributeProps(node),
    ...(sourcePropOverrides ?? null),
    ...(intrinsicStyle ? { style: intrinsicStyle } : null),
  });
  const scopedProps = modeScope ? applySourceTreePreviewComponentModeScope(props, modeScope) : props;
  const previewProps = getSourceTreePreviewInteractiveProps(node, scopedProps, onSourceNodeComponentPropChange);
  const stateResetKey = getSourceTreePreviewComponentStateResetKey(node, previewProps);
  const componentProps = stateResetKey ? { ...previewProps, key: stateResetKey } : previewProps;
  const previewComponentProps = runtimePreviewNodeProps
    ? mergeSourceTreePreviewProjectComponentProps(componentProps, runtimePreviewNodeProps)
    : componentProps;
  const hasPropChildren = Object.prototype.hasOwnProperty.call(previewComponentProps, 'children');
  const passRenderedChildren = children.length > 0 &&
    !hasPropChildren &&
    !shouldLetSourceTreePreviewComponentOwnChildren(node.source?.jsxName);

  return passRenderedChildren
    ? createElement(Component, previewComponentProps, children)
    : createElement(Component, previewComponentProps);
}

type SourceTreePreviewRuntimeOwnedChildrenInput = {
  assetRegistry?: WorkbenchAssetRegistry;
  childNodes: EditableTreeNode[];
  i18nTokens: SourceTreePreviewI18nMap;
  nodePreviewTokenModes: PreviewTokenModeSelection;
  onDrillIntoLayer: (nodeId: string) => void;
  onNodeDragStart: (event: SourceTreePreviewDragStartEvent) => void;
  onSelectLayer: (nodeId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  projectRuntimeComponents: ProjectSourceRuntimeComponents;
  renderTextLeavesAsRawText: boolean;
  selectable: boolean;
  sourcePreviewChildren: boolean;
  sourcePreviewOnly: boolean;
  tokenRegistry: TokenRegistry;
};

type SourceTreePreviewRuntimeOwnedChildContext = Omit<SourceTreePreviewRuntimeOwnedChildrenInput, 'childNodes'> & {
  preserveRuntimeInteraction: boolean;
  previewTokenModes: PreviewTokenModeSelection;
};

type SourceTreePreviewRuntimeOwnedChildResult =
  | { node: ReactNode; ok: true }
  | { ok: false };

function getSourceTreePreviewRuntimeOwnedChildren({
  assetRegistry,
  childNodes,
  i18nTokens,
  nodePreviewTokenModes,
  onDrillIntoLayer,
  onNodeDragStart,
  onSelectLayer,
  projectRuntimeComponents,
  renderTextLeavesAsRawText,
  selectable,
  sourcePreviewChildren,
  sourcePreviewOnly,
  tokenRegistry,
}: SourceTreePreviewRuntimeOwnedChildrenInput): ReactNode[] | null {
  const children: ReactNode[] = [];
  for (const child of childNodes) {
    const result = createSourceTreePreviewRuntimeOwnedChild(child, {
      assetRegistry,
      i18nTokens,
      nodePreviewTokenModes,
      onDrillIntoLayer,
      onNodeDragStart,
      onSelectLayer,
      preserveRuntimeInteraction: false,
      previewTokenModes: nodePreviewTokenModes,
      projectRuntimeComponents,
      renderTextLeavesAsRawText,
      selectable,
      sourcePreviewChildren,
      sourcePreviewOnly: getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: sourcePreviewOnly,
        sourcePreviewChild: sourcePreviewChildren,
      }),
      tokenRegistry,
    });
    if (!result.ok) return null;
    children.push(result.node);
  }
  return children;
}

function createSourceTreePreviewRuntimeOwnedChild(
  node: EditableTreeNode,
  context: SourceTreePreviewRuntimeOwnedChildContext,
): SourceTreePreviewRuntimeOwnedChildResult {
  if (isSourceTextLeaf(node)) {
    return {
      node: createSourceTreePreviewRuntimeOwnedTextChild(node, context),
      ok: true,
    };
  }

  const nodeSourceAttributes = node.sourceAttributes ?? {};
  const nodeModeOverride = parseTokenModeOverride(nodeSourceAttributes[SOURCE_TOKEN_MODE_ATTRIBUTE]);
  const nodePreviewTokenModes = Object.keys(nodeModeOverride).length > 0
    ? { ...context.previewTokenModes, ...nodeModeOverride }
    : context.previewTokenModes;
  const nodeModeVariables = Object.keys(nodeModeOverride).length > 0
    ? getSourceTreePreviewTokenVariables(context.tokenRegistry, nodePreviewTokenModes)
    : undefined;
  const nodeStyle = {
    ...(nodeModeVariables ?? null),
    ...(getSourceTreePreviewNodeStyle(node, context.tokenRegistry, nodePreviewTokenModes) ?? null),
  } as CSSProperties;
  const resolvedNodeStyle = Object.keys(nodeStyle).length > 0 ? nodeStyle : undefined;
  // A runtime-owned compound child must receive the authored JSX children,
  // not the implementation subtree expanded for layer drill-in. Passing
  // sourcePreviewChildren back into the live component can duplicate its own
  // structure (for example Button inside DropdownMenuTrigger's button).
  const childNodes = node.children ?? [];
  const children: ReactNode[] = [];
  const renderingSourcePreviewChildren = false;
  const preserveRuntimeInteraction = context.preserveRuntimeInteraction ||
    shouldPreserveSourceTreePreviewRuntimeInteraction(node);
  const renderTextLeavesAsRawText = context.renderTextLeavesAsRawText ||
    shouldRenderSourceTreePreviewRuntimeRawTextDescendants(node);
  const childSelectable = context.selectable && !shouldRenderSourceTreePreviewRuntimePlainTextChildren(node);
  for (const child of childNodes) {
    const result = createSourceTreePreviewRuntimeOwnedChild(child, {
      ...context,
      nodePreviewTokenModes,
      previewTokenModes: nodePreviewTokenModes,
      onDrillIntoLayer: context.onDrillIntoLayer,
      onSelectLayer: context.onSelectLayer,
      preserveRuntimeInteraction,
      renderTextLeavesAsRawText,
      selectable: childSelectable && !(renderTextLeavesAsRawText && isSourceTextLeaf(child)),
      sourcePreviewChildren: renderingSourcePreviewChildren,
      sourcePreviewOnly: getEditableTreePreviewChildSourcePreviewOnly({
        child,
        parentSourcePreviewOnly: context.sourcePreviewOnly,
        sourcePreviewChild: renderingSourcePreviewChildren,
      }),
    });
    if (!result.ok) return { ok: false };
    children.push(result.node);
  }

  const sourceComponent = getSourceTreePreviewProjectComponent(node, context.projectRuntimeComponents);
  if (sourceComponent) {
    const intrinsicStyle = getSourceTreePreviewIntrinsicStyle(resolvedNodeStyle);
    const props = normalizeSourceTreePreviewComponentProps(node.source?.jsxName, {
      ...resolveSourceTreePreviewComponentPropTokens(node.sourceProps ?? {}, context.tokenRegistry, nodePreviewTokenModes),
      ...getSourceTreePreviewRuntimeSourceProps(node),
      ...resolveSourceTreePreviewJsxElementProps(node, context.projectRuntimeComponents),
      ...getSourceTreePreviewRuntimeSourceAttributeProps(node),
      ...(intrinsicStyle ? { style: intrinsicStyle } : null),
    });
    const scopedProps = Object.keys(nodeModeOverride).length > 0
      ? applySourceTreePreviewComponentModeScope(props, {
          className: getLibraryScopeClassName(),
        })
      : props;
    const previewProps = {
      ...mergeSourceTreePreviewProjectComponentProps(
        scopedProps,
        getSourceTreePreviewProjectComponentProps(
          getSourceTreePreviewRuntimeOwnedChildSelectionProps({
            node,
            onDrillIntoLayer: context.onDrillIntoLayer,
            onNodeDragStart: context.onNodeDragStart,
            onSelectLayer: context.onSelectLayer,
            selectable: context.selectable,
            preserveRuntimeInteraction,
            sourcePreviewOnly: context.sourcePreviewOnly,
          }),
        ),
      ),
      key: node.id,
    };
    const childContent = getSourceTreePreviewRuntimeChildContent(children);
    return {
      node: childContent === undefined
        ? createElement(sourceComponent, previewProps)
        : createElement(sourceComponent, previewProps, childContent),
      ok: true,
    };
  }

  const intrinsicElement = getSourceTreePreviewIntrinsicElement(
    node,
    resolvedNodeStyle,
    context.assetRegistry,
    context.selectable ? node.id : undefined,
  );
  if (intrinsicElement) {
    const selectionProps = getSourceTreePreviewRuntimeOwnedChildSelectionProps({
      node,
      onDrillIntoLayer: context.onDrillIntoLayer,
      onNodeDragStart: context.onNodeDragStart,
      onSelectLayer: context.onSelectLayer,
      selectable: context.selectable,
      preserveRuntimeInteraction,
      sourcePreviewOnly: context.sourcePreviewOnly,
    });
    return {
      node: cloneElement(intrinsicElement, {
        ...getSourceTreePreviewDirectNodeProps(selectionProps),
        key: node.id,
      }),
      ok: true,
    };
  }

  if (node.source?.jsxName === 'Fragment') {
    return {
      node: createElement(Fragment, { key: node.id }, getSourceTreePreviewRuntimeChildContent(children)),
      ok: true,
    };
  }

  const hostTagName = getSourceTreePreviewHostTagName(node);
  if (hostTagName) {
    const hostProps = getSourceTreePreviewHostElementProps(
      hostTagName,
      {
        ...getSourceTreePreviewRuntimeOwnedChildSelectionProps({
          node,
          onDrillIntoLayer: context.onDrillIntoLayer,
          onNodeDragStart: context.onNodeDragStart,
          onSelectLayer: context.onSelectLayer,
          selectable: context.selectable,
          preserveRuntimeInteraction,
          sourcePreviewOnly: context.sourcePreviewOnly,
        }),
        className: getSourceTreePreviewAuthoredClassName(nodeSourceAttributes) ?? undefined,
        hidden: nodeSourceAttributes.hidden === 'true' || undefined,
        key: node.id,
        style: resolvedNodeStyle,
      },
      nodeSourceAttributes,
      node.sourceProps,
    );
    return {
      node: isSourceTreePreviewVoidHostTagName(hostTagName)
        ? createElement(hostTagName, hostProps)
        : createElement(hostTagName, hostProps, getSourceTreePreviewRuntimeChildContent(children)),
      ok: true,
    };
  }

  return children.length > 0
    ? { node: createElement(Fragment, { key: node.id }, getSourceTreePreviewRuntimeChildContent(children)), ok: true }
    : { ok: false };
}

function getSourceTreePreviewRuntimeTextContent(
  node: EditableTreeNode,
  i18nTokens: SourceTreePreviewI18nMap,
): string {
  const i18nKey = node.tokenBindings?.text;
  return i18nKey && i18nTokens[i18nKey] !== undefined
    ? i18nTokens[i18nKey]
    : node.textContent ?? node.label;
}

function createSourceTreePreviewRuntimeOwnedTextChild(
  node: EditableTreeNode,
  context: SourceTreePreviewRuntimeOwnedChildContext,
): ReactNode {
  const text = getSourceTreePreviewRuntimeTextContent(node, context.i18nTokens);
  if (!context.selectable || isSourceWhitespaceTextLeaf(node)) return text;
  return createElement('span', {
    className: 'wb-source-visual-text',
    'data-wb-preview-node-id': node.id,
    'data-wb-source-preview-only': context.sourcePreviewOnly ? 'true' : undefined,
    draggable: false,
    key: node.id,
    ...(context.preserveRuntimeInteraction ? null : {
      role: 'button',
      tabIndex: 0,
      onClick: (event?: ReactMouseEvent<HTMLElement>) => {
        if (
          !event ||
          typeof event !== 'object' ||
          !event.nativeEvent ||
          typeof event.stopPropagation !== 'function'
        ) return;
        if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;
        sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);
        event.stopPropagation();
        const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
        const selectionMode = getSourceTreePreviewModifierSelectionMode(event);
        context.onSelectLayer(
          resolveSourceTreePreviewEventNodeId(event, node.id, selectionMode),
          selectionMode,
          additive,
        );
        focusSourceTreePreviewRootFromEvent(event);
      },
      onDoubleClick: (event?: ReactMouseEvent<HTMLElement>) => {
        if (
          !event ||
          typeof event !== 'object' ||
          !event.nativeEvent ||
          typeof event.stopPropagation !== 'function'
        ) return;
        event.stopPropagation();
        context.onDrillIntoLayer(resolveSourceTreePreviewEventNodeId(event, node.id, 'deep'));
      },
      onMouseDownCapture: context.onNodeDragStart,
      onPointerDownCapture: context.onNodeDragStart,
    }),
  }, text);
}

function getSourceTreePreviewRuntimeOwnedChildSelectionProps({
  node,
  onDrillIntoLayer,
  onNodeDragStart,
  onSelectLayer,
  preserveRuntimeInteraction = false,
  selectable,
  sourcePreviewOnly,
}: {
  node: EditableTreeNode;
  onDrillIntoLayer: (nodeId: string) => void;
  onNodeDragStart: (event: SourceTreePreviewDragStartEvent) => void;
  onSelectLayer: (nodeId: string, mode: SourceTreePreviewSelectionMode, additive: boolean) => void;
  preserveRuntimeInteraction?: boolean;
  selectable: boolean;
  sourcePreviewOnly: boolean;
}): Record<string, unknown> {
  const injectEditorInteraction = selectable && !preserveRuntimeInteraction;
  return {
    'data-wb-preview-node-id': selectable ? node.id : undefined,
    'data-wb-runtime-component-root': 'true',
    [SOURCE_TREE_PREVIEW_RUNTIME_OWNER_NODE_ID_ATTRIBUTE]: selectable ? node.id : undefined,
    [SOURCE_TREE_PREVIEW_SOURCE_COMPONENT_NAME_ATTRIBUTE]: getSourceTreePreviewRuntimeOwnedChildComponentName(node),
    'data-wb-source-preview-only': sourcePreviewOnly ? 'true' : undefined,
    ...(injectEditorInteraction ? {
      role: 'button',
      tabIndex: 0,
      onClick: (event?: ReactMouseEvent<HTMLElement>) => {
        if (
          !event ||
          typeof event !== 'object' ||
          !event.nativeEvent ||
          typeof event.stopPropagation !== 'function'
        ) return;
        if (sourceTreePreviewHandledSelectionEvents.has(event.nativeEvent)) return;
        sourceTreePreviewHandledSelectionEvents.add(event.nativeEvent);
        event.stopPropagation();
        const additive = isSourceTreePreviewAdditiveSelectionEvent(event);
        const selectionMode = getSourceTreePreviewModifierSelectionMode(event);
        onSelectLayer(
          resolveSourceTreePreviewEventNodeId(event, node.id, selectionMode),
          selectionMode,
          additive,
        );
        focusSourceTreePreviewRootFromEvent(event);
      },
      onDoubleClick: (event?: ReactMouseEvent<HTMLElement>) => {
        if (
          !event ||
          typeof event !== 'object' ||
          !event.nativeEvent ||
          typeof event.stopPropagation !== 'function'
        ) return;
        event.stopPropagation();
        onDrillIntoLayer(resolveSourceTreePreviewEventNodeId(event, node.id, 'deep'));
      },
      onMouseDownCapture: onNodeDragStart,
      onPointerDownCapture: onNodeDragStart,
    } : null),
  };
}

function getSourceTreePreviewRuntimeOwnedChildComponentName(node: EditableTreeNode): string | undefined {
  if (node.kind !== 'component-instance') return undefined;
  return node.source?.jsxName ?? node.source?.importName ?? undefined;
}

function getSourceTreePreviewRuntimeChildContent(children: ReactNode[]): ReactNode | undefined {
  if (children.length === 0) return undefined;
  if (children.length === 1) return children[0];
  return children;
}

function getSourceTreePreviewRuntimeSourceAttributeProps(
  node: EditableTreeNode,
): Record<string, unknown> {
  if (!hasProjectSourceRuntimeImport(node)) return {};
  const props: Record<string, unknown> = {};
  const className = node.sourceAttributes?.className?.trim();
  if (className) props.className = className;
  const title = node.sourceAttributes?.title?.trim();
  if (title) props.title = title;
  return props;
}

function renderSourceTreePreviewRuntimeDiagnostic(diagnostic: ProjectRuntimeImportDiagnostic): ReactNode {
  const importLabel = `${diagnostic.importName} from ${diagnostic.importSource}`;
  const candidate = diagnostic.candidates?.[0];
  return (
    <span className="wb-source-visual-runtime-diagnostic" role="alert">
      <span className="wb-source-visual-runtime-diagnostic-title">Component preview failed</span>
      <span className="wb-source-visual-runtime-diagnostic-meta">{importLabel}</span>
      <span className="wb-source-visual-runtime-diagnostic-detail">{diagnostic.reason}</span>
      {candidate ? (
        <span className="wb-source-visual-runtime-diagnostic-path">{getPathFileName(candidate.path)}</span>
      ) : null}
    </span>
  );
}

function renderSourceTreePreviewRuntimeRenderError(label: string, error: Error): ReactNode {
  return (
    <span className="wb-source-visual-runtime-diagnostic" role="alert">
      <span className="wb-source-visual-runtime-diagnostic-title">Component preview failed</span>
      <span className="wb-source-visual-runtime-diagnostic-meta">{label}</span>
      <span className="wb-source-visual-runtime-diagnostic-detail">{error.message}</span>
    </span>
  );
}

function normalizeSourceTreePreviewRuntimeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'Unknown runtime preview error');
}

function renderSourceTreePreviewRuntimeLoading(node: EditableTreeNode): ReactNode {
  const label = node.source?.jsxName ?? node.label;
  return (
    <span
      aria-label={`Loading ${label} preview`}
      className="wb-source-visual-runtime-diagnostic wb-source-visual-runtime-diagnostic--loading"
      role="status"
    >
      <span className="wb-source-visual-runtime-loading-spinner" aria-hidden="true" />
    </span>
  );
}

function applySourceTreePreviewComponentModeScope(
  props: Record<string, unknown>,
  modeScope: {
    className: string;
  },
): Record<string, unknown> {
  const className = [typeof props.className === 'string' ? props.className : '', modeScope.className]
    .filter(Boolean)
    .join(' ');
  return {
    ...props,
    ...(className ? { className } : null),
  };
}

function getSourceTreePreviewComponentStateResetKey(
  node: EditableTreeNode,
  props: Record<string, unknown>,
): string | null {
  const resetPropEntries = Object.entries(props)
    .filter(([key, value]) => isSourceTreePreviewRuntimeResetProp(key, value))
    .sort(([left], [right]) => left.localeCompare(right));
  if (resetPropEntries.length === 0) return null;
  return `${node.id}:${node.source?.jsxName ?? node.label}:${JSON.stringify(resetPropEntries)}`;
}

function isSourceTreePreviewRuntimeResetProp(key: string, value: unknown): boolean {
  void value;
  if (
    key === 'children' ||
    key === 'className' ||
    key === 'style' ||
    key === 'key' ||
    key === 'ref' ||
    key.startsWith('on')
  ) {
    return false;
  }
  // Only initializer-style props should force a remount. Ordinary primitive
  // props such as size, variant, label, and color must update in place.
  return key.startsWith('default') || key.startsWith('initial');
}

function resolveSourceTreePreviewComponentPropTokens(
  sourceProps: EditableTreeSourceProps,
  tokenRegistry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sourceProps)) {
    if (key.endsWith('Token') || key.endsWith('TokenCollection')) continue;
    if (key === 'children') continue;
    props[key] = value;
  }

  for (const [key, value] of Object.entries(sourceProps)) {
    if (!key.endsWith('Token') || typeof value !== 'string' || !value.trim()) continue;
    const propName = key.slice(0, -'Token'.length);
    if (!propName || propName.endsWith('Collection')) continue;
    const collectionId = sourceProps[`${propName}TokenCollection`];
    if (typeof collectionId !== 'string' || !collectionId.trim()) continue;
    const resolved = resolveSourceTreePreviewComponentPropToken(tokenRegistry, { collectionId, tokenId: value }, previewTokenModes);
    if (resolved !== null) props[propName] = resolved;
  }

  return props;
}

function resolveSourceTreePreviewComponentPropToken(
  tokenRegistry: TokenRegistry,
  reference: { collectionId: string; tokenId: string },
  previewTokenModes: PreviewTokenModeSelection,
): string | null {
  const result = queryTokens(tokenRegistry, {
    collectionId: reference.collectionId,
    modeByCollection: previewTokenModes,
  }).find((candidate) => candidate.collection.id === reference.collectionId && candidate.token.id === reference.tokenId);
  if (!result || !result.compatible) return null;
  if (result.token.type === 'color' || result.token.type === 'gradient') {
    return result.cssVariable ?? `var(${getProjectCollectionTokenCssVariableName(result.collection.id, result.token.id)})`;
  }
  return getTokenPreviewCss(result, tokenRegistry) ?? result.previewText;
}

// Statically evaluated bound data the Inspector cannot edit (nested arrays
// and objects, null) still reaches the runtime component: the parser keeps it
// in sourceRuntimeProps beside the authored expression. It is spread after
// the editable projection — where both carry the same prop, the runtime value
// is the complete data and the editable one its flat array-editing shape —
// and before JSX element props, runtime attribute props and live overrides,
// which still win. Class/style bindings and React-reserved names stay out
// (those channels have their own owners).
const SOURCE_TREE_PREVIEW_BLOCKED_RUNTIME_SOURCE_PROP_NAMES = new Set([
  'children',
  'class',
  'className',
  'dangerouslySetInnerHTML',
  'key',
  'ref',
  'style',
]);

function getSourceTreePreviewRuntimeSourceProps(node: EditableTreeNode): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [propName, value] of Object.entries(node.sourceRuntimeProps ?? {})) {
    if (
      SOURCE_TREE_PREVIEW_BLOCKED_RUNTIME_SOURCE_PROP_NAMES.has(propName) ||
      /^on[A-Z]/.test(propName) ||
      !/^[A-Za-z_][\w:.-]*$/.test(propName)
    ) {
      continue;
    }
    props[propName] = value;
  }
  return props;
}

function resolveSourceTreePreviewJsxElementProps(
  node: EditableTreeNode,
  projectRuntimeComponents?: ProjectSourceRuntimeComponents,
): Record<string, unknown> {
  const jsxProps = node.sourceJsxProps;
  if (!jsxProps || !projectRuntimeComponents) return {};
  // A Vue SFC node keeps every bound expression in sourceJsxProps
  // (`:isLoading="true"` -> 'true', `@click` -> handler code) so the
  // writeback can restore the binding; none of it names a JSX element. The
  // resolved literal already sits in sourceProps, and rendering `true` as an
  // intrinsic `<true>` element handed the Vue runtime host a React element.
  if (/\.vue$/i.test(node.source?.sourceFile ?? '')) return {};
  const props: Record<string, unknown> = {};
  for (const [propName, jsxName] of Object.entries(jsxProps)) {
    const metadata = node.sourceValueMetadata?.props?.[propName];
    const parsedElement = metadata?.kind === 'expression'
      ? parseSourceTreePreviewSimpleJsxElement(metadata.code)
      : null;
    const elementName = parsedElement?.jsxName ?? jsxName;
    const Component = getSourceTreePreviewProjectComponentByName(
      node.source?.sourceFile,
      elementName,
      projectRuntimeComponents,
    );
    if (!Component) continue;
    props[propName] = createElement(Component, parsedElement?.props ?? {});
  }
  return props;
}

type SourceTreePreviewSimpleJsxElement = {
  jsxName: string;
  props: Record<string, unknown>;
};

function parseSourceTreePreviewSimpleJsxElement(code: string): SourceTreePreviewSimpleJsxElement | null {
  const source = stripSourceTreePreviewExpressionParens(code.trim());
  const match = /^<([A-Za-z][\w$.]*)\s*([^>]*)\/>$/.exec(source);
  if (!match) return null;
  const [, jsxName, rawProps] = match;
  return {
    jsxName,
    props: parseSourceTreePreviewSimpleJsxElementProps(rawProps),
  };
}

function stripSourceTreePreviewExpressionParens(source: string): string {
  let nextSource = source;
  while (nextSource.startsWith('(') && nextSource.endsWith(')')) {
    nextSource = nextSource.slice(1, -1).trim();
  }
  return nextSource;
}

function parseSourceTreePreviewSimpleJsxElementProps(source: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const attributePattern = /([A-Za-z_$][\w$:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\}))?/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(source)) !== null) {
    const [, propName, doubleQuotedValue, singleQuotedValue, expressionValue] = match;
    if (!propName || propName === 'key' || propName === 'ref') continue;
    if (doubleQuotedValue !== undefined) {
      props[propName] = doubleQuotedValue;
      continue;
    }
    if (singleQuotedValue !== undefined) {
      props[propName] = singleQuotedValue;
      continue;
    }
    if (expressionValue !== undefined) {
      const value = parseSourceTreePreviewSimpleJsxExpressionValue(expressionValue);
      if (value !== undefined) props[propName] = value;
      continue;
    }
    props[propName] = true;
  }
  return props;
}

function parseSourceTreePreviewSimpleJsxExpressionValue(source: string): string | number | boolean | undefined {
  const value = source.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  const stringMatch = /^(['"])(.*)\1$/.exec(value);
  if (stringMatch) return stringMatch[2];
  return undefined;
}

function getSourceTreePreviewProjectComponentByName(
  sourceFile: string | undefined,
  jsxName: string,
  projectRuntimeComponents: ProjectSourceRuntimeComponents,
): ElementType<Record<string, unknown>> | null {
  if (!jsxName) return null;
  if (/^[a-z][\w:-]*$/.test(jsxName)) return jsxName as ElementType<Record<string, unknown>>;
  const importName = jsxName.split('.').pop() ?? jsxName;
  for (const [key, state] of projectRuntimeComponents) {
    if (sourceFile && !key.startsWith(`${sourceFile}::`)) continue;
    if (!key.endsWith(`::${importName}`)) continue;
    if (state.status === 'ready') return state.component;
  }
  return null;
}

function getSourceTreePreviewInteractiveProps(
  node: EditableTreeNode,
  props: Record<string, unknown>,
  onSourceNodeComponentPropChange?: SourceTreePreviewComponentPropChange,
): Record<string, unknown> {
  if (node.source?.jsxName !== 'YovoDialog' || !onSourceNodeComponentPropChange) return props;
  const closeDialog = () => onSourceNodeComponentPropChange(node, 'open', false);
  const primaryLabel = typeof props.primaryLabel === 'string' ? props.primaryLabel : '';
  const secondaryLabel = typeof props.secondaryLabel === 'string' ? props.secondaryLabel : '';
  return {
    ...props,
    onClose: closeDialog,
    ...(secondaryLabel ? { secondaryAction: { label: secondaryLabel, onClick: closeDialog } } : null),
    ...(primaryLabel ? {
      primaryAction: {
        label: primaryLabel,
        tone: props.primaryTone === 'danger' ? 'danger' : 'primary',
        onClick: closeDialog,
      },
    } : null),
  };
}

function normalizeSourceTreePreviewComponentProps(
  jsxName: string | undefined,
  props: Record<string, unknown>,
): Record<string, unknown> {
  if (jsxName === 'AppSidebar' && props.collapsible === undefined) {
    // Keep shadcn dashboard sidebars on the fixed desktop path in source preview.
    return { ...props, collapsible: '' };
  }
  return props;
}

function getSourceTreePreviewIntrinsicElement(
  node: EditableTreeNode,
  nodeStyle: CSSProperties | undefined,
  assetRegistry?: WorkbenchAssetRegistry,
  runtimeOwnerNodeId?: string,
) {
  const jsxName = node.source?.jsxName?.toLowerCase();
  const attributes = node.sourceAttributes ?? {};
  const nativeSourceProps = getSourceTreePreviewNativeSourceProps(node.sourceProps);
  const packageIconSource = resolveSourceTreePreviewPackageIconSource(node, assetRegistry);
  if (packageIconSource) {
    return renderSourceTreePreviewIntrinsicIcon({
      attributes,
      label: attributes['aria-label'] || node.label,
      nodeStyle,
      runtimeOwnerNodeId,
      src: packageIconSource,
    });
  }
  if (jsxName === 'img') {
    const src = resolveSourceTreePreviewImageSource(attributes, assetRegistry);
    const style = getSourceTreePreviewIntrinsicStyle(nodeStyle);
    const authoredClassName = getSourceTreePreviewAuthoredClassName(attributes);
    if (isVideoDesignAssetSource(src)) {
      return renderSourceTreePreviewIntrinsicVideo({
        className: authoredClassName,
        height: attributes.height || undefined,
        src,
        style,
        width: attributes.width || undefined,
      });
    }
    const imageClassName = [
      'wb-source-visual-intrinsic-image',
      authoredClassName ? 'wb-source-visual-intrinsic-image--authored' : '',
      attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon' ? 'wb-source-visual-intrinsic-image--icon' : '',
      authoredClassName,
    ].filter(Boolean).join(' ');

    return (
      <img
        {...nativeSourceProps}
        alt={attributes.alt ?? ''}
        className={imageClassName}
        draggable={false}
        height={attributes.height || undefined}
        data-wb-asset-kind={attributes[SOURCE_ASSET_KIND_ATTRIBUTE] || undefined}
        data-wb-runtime-owner-node-id={runtimeOwnerNodeId}
        src={src || SOURCE_TREE_PREVIEW_EMPTY_IMAGE_SRC}
        style={style}
        width={attributes.width || undefined}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      />
    );
  }

  if (jsxName === 'video') {
    const src = resolveWorkbenchHostAssetUrl(attributes.src?.trim() ?? '');
    const style = getSourceTreePreviewIntrinsicStyle(nodeStyle);
    if (!src) {
      return (
        <span
          aria-label="Video source not set"
          className="wb-source-visual-intrinsic-image wb-source-visual-intrinsic-image--empty"
          role="img"
          data-wb-runtime-owner-node-id={runtimeOwnerNodeId}
          style={style}
        >
          video
        </span>
      );
    }

    return renderSourceTreePreviewIntrinsicVideo({
      className: getSourceTreePreviewAuthoredClassName(attributes),
      height: attributes.height || undefined,
      nativeSourceProps,
      runtimeOwnerNodeId,
      src,
      style,
      width: attributes.width || undefined,
    });
  }

  if (jsxName !== 'input') return null;
  return (
    <input
      {...nativeSourceProps}
      aria-label={attributes['aria-label'] ?? attributes.placeholder ?? 'Input'}
      className={[
        'wb-source-visual-intrinsic-input',
        getSourceTreePreviewAuthoredClassName(attributes),
      ].filter(Boolean).join(' ')}
      name={attributes.name}
      placeholder={attributes.placeholder}
      readOnly
      data-wb-runtime-owner-node-id={runtimeOwnerNodeId}
      style={getSourceTreePreviewIntrinsicStyle(nodeStyle)}
      tabIndex={-1}
      type={attributes.type || 'text'}
      value={attributes.value ?? ''}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    />
  );
}

function renderSourceTreePreviewIntrinsicIcon({
  attributes,
  hidden,
  label,
  nodeStyle,
  runtimeOwnerNodeId,
  src,
  style,
}: {
  attributes: Record<string, string>;
  hidden?: boolean;
  label?: string;
  nodeStyle?: CSSProperties;
  runtimeOwnerNodeId?: string;
  src: string;
  style?: CSSProperties;
}) {
  const authoredClassName = getSourceTreePreviewAuthoredClassName(attributes);
  const isHidden = hidden ?? attributes['aria-hidden'] === 'true';
  const ariaLabel = label || attributes['aria-label'] || undefined;
  return (
    <span
      aria-hidden={isHidden ? true : undefined}
      aria-label={!isHidden ? ariaLabel : undefined}
      className={[
        'wb-source-visual-intrinsic-icon',
        authoredClassName ? 'wb-source-visual-intrinsic-icon--authored' : '',
        authoredClassName,
      ].filter(Boolean).join(' ')}
      role={!isHidden && ariaLabel ? 'img' : undefined}
      data-slot={attributes['data-slot'] || undefined}
      data-wb-runtime-owner-node-id={runtimeOwnerNodeId}
      style={getSourceTreePreviewIconMaskStyle(
        style ?? getSourceTreePreviewIntrinsicStyle(nodeStyle),
        src,
        attributes,
      )}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    />
  );
}

function renderSourceTreePreviewIntrinsicVideo({
  className,
  height,
  nativeSourceProps,
  runtimeOwnerNodeId,
  src,
  style,
  width,
}: {
  className?: string | null;
  height?: string;
  nativeSourceProps?: Record<string, unknown>;
  runtimeOwnerNodeId?: string;
  src: string;
  style?: CSSProperties;
  width?: string;
}) {
  return (
    <video
      {...nativeSourceProps}
      className={[
        'wb-source-visual-intrinsic-image',
        className ? 'wb-source-visual-intrinsic-image--authored' : '',
        'wb-source-visual-intrinsic-video',
        className,
      ].filter(Boolean).join(' ')}
      controls
      height={height}
      muted
      data-wb-runtime-owner-node-id={runtimeOwnerNodeId}
      playsInline
      preload="metadata"
      src={src}
      style={style}
      width={width}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    />
  );
}

function resolveSourceTreePreviewPackageIconSource(
  node: EditableTreeNode,
  assetRegistry: WorkbenchAssetRegistry | undefined,
): string | null {
  const importSource = node.source?.importSource;
  const importName = node.source?.importName ?? node.source?.jsxName;
  if (!importSource || !importName) return null;
  const runtimeImport = { importName, importSource };
  if (!isLucideIconRuntimeImport(runtimeImport) && !isRemixIconRuntimeImport(runtimeImport)) return null;
  return resolveWorkbenchDefaultIconSource(assetRegistry, importName);
}

function getSourceTreePreviewIconMaskStyle(
  baseStyle: CSSProperties | undefined,
  src: string,
  attributes: Record<string, string>,
): CSSProperties {
  const style = {
    ...baseStyle,
    '--wb-source-visual-icon-url': `url(${JSON.stringify(src)})`,
  } as CSSProperties & Record<string, string>;
  if (attributes.width) style.width = attributes.width;
  if (attributes.height) style.height = attributes.height;
  return style;
}

function resolveSourceTreePreviewImageSource(
  attributes: Record<string, string>,
  assetRegistry: WorkbenchAssetRegistry | undefined,
): string {
  const source = (attributes.src ?? attributes[SOURCE_ASSET_SOURCE_ATTRIBUTE] ?? '').trim();
  if (attributes[SOURCE_ASSET_KIND_ATTRIBUTE] === 'icon') {
    const iconName = attributes[SOURCE_ICON_NAME_ATTRIBUTE] ?? inferSourceTreePreviewIconNameFromSource(source);
    if (attributes[SOURCE_ICON_SET_ATTRIBUTE] === 'default' || attributes[SOURCE_ICON_NAME_ATTRIBUTE] || source.includes('/workbench-assets/icons/lucide-preview/')) {
      return resolveWorkbenchDefaultIconSource(assetRegistry, iconName) ?? source;
    }
  }
  return resolveWorkbenchHostAssetUrl(source);
}

function inferSourceTreePreviewIconNameFromSource(source: string): string {
  const fileName = source.split(/[/?#]/).filter(Boolean).pop() ?? '';
  return fileName.replace(/\.[^.]+$/, '');
}

function getSourceTreePreviewIntrinsicStyle(nodeStyle: CSSProperties | undefined): CSSProperties | undefined {
  if (!nodeStyle) return undefined;
  const style = { ...nodeStyle } as CSSProperties & Record<string, string>;
  if (style['--wb-source-visual-background'] && !style.background) {
    style.background = 'var(--wb-source-visual-background)';
  }
  if (style['--wb-source-visual-radius'] && !style.borderRadius) {
    style.borderRadius = 'var(--wb-source-visual-radius)';
  }
  if (style['--wb-source-visual-padding'] && !style.padding) {
    style.padding = 'var(--wb-source-visual-padding)';
  }
  if (style['--wb-source-visual-font-size'] && !style.fontSize) {
    style.fontSize = 'var(--wb-source-visual-font-size)';
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

function getSourceTreePreviewNodeStyle(
  node: EditableTreeNode,
  tokenRegistry: TokenRegistry,
  previewTokenModes: PreviewTokenModeSelection,
): CSSProperties | undefined {
  const background = resolveBindingTokenCss(
    tokenRegistry,
    'background',
    node.tokenBindingReferences?.background,
    node.tokenBindings?.background,
    previewTokenModes,
  );
  const radius = resolveBindingTokenCss(
    tokenRegistry,
    'radius',
    node.tokenBindingReferences?.radius,
    node.tokenBindings?.radius,
    previewTokenModes,
  );
  const spacing = resolveBindingTokenCss(
    tokenRegistry,
    'spacing',
    node.tokenBindingReferences?.spacing,
    node.tokenBindings?.spacing,
    previewTokenModes,
  );
  const fontSize = resolveBindingTokenCss(
    tokenRegistry,
    'fontSize',
    node.tokenBindingReferences?.fontSize,
    node.tokenBindings?.fontSize,
    previewTokenModes,
  );
  const sourceStyle = getReactSourceStyleDeclarations(node.sourceStyleDeclarations ?? {});
  if (!background && !radius && !spacing && !fontSize && Object.keys(sourceStyle).length === 0) return undefined;

  return {
    ...sourceStyle,
    ...(background ? { background } : null),
    ...(radius ? { borderRadius: radius } : null),
    ...(spacing ? { padding: spacing } : null),
    ...(fontSize ? { fontSize } : null),
    ...(background ? { '--wb-source-visual-background': background } : null),
    ...(radius ? { '--wb-source-visual-radius': radius } : null),
    ...(spacing ? { '--wb-source-visual-padding': spacing } : null),
    ...(fontSize ? { '--wb-source-visual-font-size': fontSize } : null),
  } as CSSProperties;
}

function getReactSourceStyleDeclarations(declarations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(declarations).flatMap(([property, value]) => {
      const normalizedValue = normalizeSourceStyleDeclarationValue(property, value);
      return normalizedValue ? [[getReactStylePropertyName(property), normalizedValue]] : [];
    }),
  );
}

function getReactStylePropertyName(property: string): string {
  if (property.startsWith('--')) return property;
  return property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function resolveBindingTokenCss(
  registry: TokenRegistry,
  field: 'background' | 'fontSize' | 'radius' | 'spacing',
  reference: { collectionId: string; tokenId: string } | undefined,
  fallbackTokenId: string | undefined,
  previewTokenModes: PreviewTokenModeSelection,
): string | null {
  if (reference) {
    const result = queryTokens(registry, {
      collectionId: reference.collectionId,
      field: getInspectorFieldForSourceBinding(field),
      modeByCollection: previewTokenModes,
    }).find((candidate) => candidate.collection.id === reference.collectionId && candidate.token.id === reference.tokenId);
    return result && result.compatible ? getTokenPreviewCss(result, registry) ?? result.previewText : null;
  }

  if (!fallbackTokenId) return null;
  const result = queryTokens(registry, { field: getInspectorFieldForSourceBinding(field), modeByCollection: previewTokenModes })
    .find((candidate) => candidate.token.id === fallbackTokenId);
  return result && result.compatible ? getTokenPreviewCss(result, registry) ?? result.previewText : null;
}

function getInspectorFieldForSourceBinding(field: 'background' | 'fontSize' | 'radius' | 'spacing'): InspectorField {
  if (field === 'background') return 'bgColor';
  if (field === 'fontSize') return 'fontSize';
  if (field === 'radius') return 'borderRadius';
  return 'padding';
}
