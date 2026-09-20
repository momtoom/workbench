import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getWorkbenchDefaultFontCssText,
  getWorkbenchDefaultIconSourceMap,
} from './domain/design-system/assets/assetRegistry';
import {
  WorkbenchPortalScopeContext,
  installWorkbenchReactRuntimeGlobals,
} from './runtime/workbenchReactRuntimeGlobals';
import {
  getSourceTreePreviewTokenVariables,
} from './features/workbench-shell/ui/sourceTreePreviewTokens';
import {
  getSourceTreePreviewTailwindFallbackCss,
  getSourceTreePreviewTailwindRuntimeCssForClassNames,
  getSourceTreePreviewTailwindRuntimeStyleAttribute,
  type SourceTreePreviewTailwindCssMode,
} from './features/workbench-shell/ui/sourceTreePreviewTailwindRuntime';
import {
  getDesignPreviewAppearanceThemeMode,
  reconcileDesignPreviewAppearance,
  reconcilePreviewTokenModes,
  type DesignPreviewAppearance,
} from './features/workbench-shell/ui/designPreviewSettings';
import { getProjectCollectionTokenCssVariableName } from './domain/design-system/tokens/cssExport';
import { normalizeImportedRegistry } from './domain/design-system/tokens/operations';
import {
  SOURCE_TOKEN_MODE_ATTRIBUTE,
  serializeTokenModeOverride,
} from './domain/design-system/tokens/modeOverride';
import {
  createEditableDocumentTreeFromDomProjection,
  getRuntimeDesignNodeIdFromEventTarget,
  getRuntimeDesignNodeIdFromPoint,
  markRuntimeDesignSelection,
} from './domain/document/editableTreeDomProjection';
import type { TokenRegistry } from './domain/design-system/tokens/types';
import { installPrototypeInteractions } from './domain/document/prototypeInteractions';
import type { EditableDocumentTree } from './domain/document/editableTree';
import {
  createPreviewSnapWheelGestureStates,
  handlePreviewSnapWheelGesture,
  isPreviewWheelOwnedByScrollTarget,
} from './domain/preview/previewWheelGesture';
import type {
  WorkbenchAssetRegistry,
  WorkbenchComponentRegistry,
  WorkbenchSelectionState,
} from './domain/project/workbenchProject';
import type { WorkbenchPreviewTokenModeSelection } from './domain/project/workbenchPreviewSession';
import {
  hydrateWorkbenchLocalBridgePairingFromUrl,
  installWorkbenchRuntimeAssetUrlResolver,
  subscribeWorkbenchProjectChangeEvents,
  workbenchFetch,
} from './domain/project/workbenchHostTransport';

installWorkbenchReactRuntimeGlobals();
installWorkbenchRuntimeAssetUrlResolver();

// Match the design editor preview's base typography stack. The
// workbench shell applies these on :root; in the iframe preview they
// get cloned across, but in this standalone window we need to set
// them up ourselves.
const BASE_STYLE = `
  /* The workbench app applies this reset on its root stylesheet, and
     the design editor copies it across into the preview iframe. The
     SG DS library CSS relies on it implicitly (components use
     width: 100% + padding expecting border-box). Mirror it here so
     standalone preview rendering matches the design editor. */
  *, *::before, *::after { box-sizing: border-box; }
  /* The design editor hides a layer by forcing [hidden] on its preview wrapper.
     The standalone preview has no wrapper — it renders the real node — and the
     UA's implicit [hidden] { display: none } is overridden by component display
     rules (e.g. .alert { display: flex }). Make the hidden attribute win so a
     hidden layer disappears here exactly as it does on the canvas. */
  [hidden] { display: none !important; }
  html, body, #page-preview-root { min-height: 100%; }
  html[data-page-preview-runtime],
  html[data-page-preview-runtime] body {
    overflow: auto;
  }
  html[data-page-preview-runtime] #page-preview-root {
    position: relative;
    overflow: auto;
  }
  [data-workbench-preview-root="true"] {
    position: relative;
    isolation: isolate;
    min-height: 100%;
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
  body {
    margin: 0;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    font-size: 16px;
    background-color: var(--ds-color-surface-page, Canvas);
    color: var(--ds-color-text-primary, CanvasText);
    color-scheme: light dark;
  }
  /* Force the scheme on <html> as well as <body>: project CSS (e.g. shadcn /
     Astryx themes) commonly declares an unlayered ":root { color-scheme:
     light dark }" whose auto mode would otherwise keep the page canvas
     following the OS while the forced body content does not. The attribute
     selector outranks that :root declaration regardless of order. */
  html[data-preview-theme="dark"],
  html[data-preview-theme="dark"] body { color-scheme: dark; }
  html[data-preview-theme="light"],
  html[data-preview-theme="light"] body { color-scheme: light; }
  html[data-preview-theme="system"],
  html[data-preview-theme="system"] body { color-scheme: light dark; }
  /* Workbench icon assets default to text-relative sizing + baseline
     compensation so an unsized icon flows with the line instead of
     exploding to the SVG's intrinsic size. Explicit inline styles win. */
  img[data-wb-asset-kind="icon"] {
    width: 1em;
    height: 1em;
    vertical-align: -0.06em;
  }
`;

type WorkbenchIconRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_DEFAULT_ICON_SOURCES__?: Record<string, string>;
};
type PagePreviewTokenModeSelection = WorkbenchPreviewTokenModeSelection;
type PagePreviewModuleManifest = {
  ok: true;
  sourceFile: string;
  moduleUrl: string;
  cssModuleUrls?: string[];
  tailwindCssMode?: SourceTreePreviewTailwindCssMode;
};
type PagePreviewModuleLoader = {
  cssModuleUrls?: string[];
  load: () => Promise<{ default?: React.ComponentType }>;
  tailwindCssMode: SourceTreePreviewTailwindCssMode;
};
const APPEARANCE_QUERY_PARAM = 'appearance';
const TOKEN_MODES_QUERY_PARAM = 'tokenModes';
const RUNTIME_PROJECTION_QUERY_PARAM = 'runtimeProjection';
const PAGE_PREVIEW_SCOPE_ATTR = 'data-page-preview-scope';
const PAGE_PREVIEW_FONT_STYLE_ATTR = 'data-page-preview-fonts';
const PAGE_PREVIEW_TOKEN_STYLE_ATTR = 'data-page-preview-tokens';
const PAGE_PREVIEW_PROJECT_CSS_STYLE_ATTR = 'data-page-preview-project-css';
const PAGE_PREVIEW_BUNDLED_PROJECT_CSS_STYLE_ATTR = 'data-workbench-preview-css';
const PAGE_PREVIEW_TAILWIND_FALLBACK_STYLE_ATTR = 'data-page-preview-tailwind-fallback';
const PROJECT_PREVIEW_MODULE_PATH = '/__workbench/preview/module.json';
const PROJECT_SOURCE_READ_PATH = '/__workbench/source/read.json';
const PROJECT_HTML_ENTRY_PATH = 'index.html';
const PROJECT_PREVIEW_METADATA_TIMEOUT_MS = 8000;
const SOURCE_CHANGE_REFRESH_DEBOUNCE_MS = 300;
const PROJECT_DEFAULT_ENTRY_SOURCE_FILES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/main.ts',
  'src/main.js',
];
const PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH = 8;
const RUNTIME_PAGE_PROJECTION_TREE_MESSAGE = 'workbench:runtime-page-projection-tree';
const RUNTIME_PAGE_SELECT_MESSAGE = 'workbench:runtime-page-select';
const RUNTIME_PAGE_DRILL_MESSAGE = 'workbench:runtime-page-drill';
const RUNTIME_PAGE_SELECTION_RECTS_MESSAGE = 'workbench:runtime-page-selection-rects';
const RUNTIME_PAGE_SELECTED_LAYER_MESSAGE = 'workbench:runtime-page-selected-layer';
const RUNTIME_PAGE_CAPTURE_REQUEST_MESSAGE = 'workbench:runtime-page-capture-request';
const RUNTIME_PAGE_KEYBOARD_SHORTCUT_MESSAGE = 'workbench:runtime-page-keyboard-shortcut';
const TOKEN_SYNC_DEBOUNCE_MS = 80;
const RUNTIME_PAGE_INTERACTIVE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
].join(',');

let pagePreviewProjectCssCascadeFrame: number | null = null;
let pagePreviewProjectCssCascadeObserver: MutationObserver | null = null;
let pagePreviewProjectCssCascadeTimeouts: number[] = [];
let pagePreviewTailwindRuntimeClassNames = new Set<string>();
let pagePreviewTailwindRuntimeRenderKey = '';
let pagePreviewTailwindCssMode: SourceTreePreviewTailwindCssMode = 'disabled';

type PagePreviewProjectConfig = {
  extensions?: {
    tailwind?: {
      compiledCss?: unknown;
      provider?: unknown;
      sourceCss?: unknown;
    };
  };
  paths?: {
    tokenCss?: unknown;
  };
};

type RuntimePageProjectionBridge = {
  capture: () => void;
  dispose: () => void;
};

type RuntimePageProjectionRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type RuntimePageProjectionParentMessage =
  | {
      projectionId: string;
      tree: EditableDocumentTree | null;
      type: typeof RUNTIME_PAGE_PROJECTION_TREE_MESSAGE;
    }
  | {
      additive: boolean;
      layerId: string;
      mode: 'deep' | 'direct' | 'exact' | 'smart-deep';
      projectionId: string;
      type: typeof RUNTIME_PAGE_SELECT_MESSAGE;
    }
  | {
      layerId: string;
      projectionId: string;
      type: typeof RUNTIME_PAGE_DRILL_MESSAGE;
    }
  | {
      projectionId: string;
      rects: RuntimePageProjectionRect[];
      type: typeof RUNTIME_PAGE_SELECTION_RECTS_MESSAGE;
    }
  | {
      projectionId: string;
      shortcut: RuntimePageKeyboardShortcut;
      type: typeof RUNTIME_PAGE_KEYBOARD_SHORTCUT_MESSAGE;
    };

type RuntimePageKeyboardShortcut =
  | { action: 'copy' }
  | { action: 'cut' }
  | { action: 'delete' }
  | { action: 'duplicate' }
  | { action: 'insert-child' }
  | { action: 'move'; intent: RuntimePageKeyboardMoveIntent }
  | { action: 'paste'; placement: 'below' | 'inside' }
  | { action: 'wrap' };

type RuntimePageKeyboardMoveIntent =
  | { kind: 'indent' }
  | { kind: 'outdent' }
  | { kind: 'reorder'; offset: number };

function PreviewError({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="page-preview-error">
      <strong>{title}</strong>
      {detail ? <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{detail}</div> : null}
    </div>
  );
}

// The design editor, Storybook, and SourceTreePreview surfaces each wrap their
// rendered project tree in a WorkbenchPortalScopeContext.Provider pointing at an
// in-boundary [data-workbench-portal-root]. The preview runtime's patched
// createPortal throws when a project portal escapes that boundary, so without
// this provider a portal-using component (dialog, popover, menu, tooltip) in the
// standalone browser preview would fall back to document.body and crash the page
// with a blank screen. Mirror the same portal scope here.
function PagePreviewRoot({
  children,
  previewAppearance,
  previewScopeClassName,
  previewThemeMode,
  previewTokenModeAttribute,
}: {
  children: React.ReactNode;
  previewAppearance: string;
  previewScopeClassName: string;
  previewThemeMode: string | undefined;
  previewTokenModeAttribute: string | undefined;
}) {
  const [portalRoot] = useState<HTMLDivElement>(() => {
    const element = document.createElement('div');
    element.setAttribute('data-workbench-portal-root', 'true');
    return element;
  });
  const attachPortalRoot = (node: HTMLDivElement | null) => {
    if (node && portalRoot.parentElement !== node) {
      node.appendChild(portalRoot);
    }
  };
  return (
    <div
      className={previewScopeClassName}
      data-page-preview-scope="true"
      data-workbench-preview-root="true"
      data-wb-preview-appearance={previewAppearance}
      data-wb-token-modes={previewTokenModeAttribute}
      data-astryx-media={previewThemeMode}
      data-theme={previewThemeMode}
      style={{ width: '100%', height: '100%', minHeight: '100%' }}
    >
      <div ref={attachPortalRoot} style={{ display: 'contents' }} />
      <WorkbenchPortalScopeContext.Provider value={portalRoot}>
        {children}
      </WorkbenchPortalScopeContext.Provider>
    </div>
  );
}

function injectBaseStyle() {
  document.documentElement.setAttribute('data-page-preview-runtime', 'true');
  const style = document.createElement('style');
  style.setAttribute('data-page-preview-base', 'true');
  style.textContent = BASE_STYLE;
  // Prepend so app/library CSS in document.head still wins on cascade.
  document.head.insertBefore(style, document.head.firstChild);
}

function preparePagePreviewInitialNavigation() {
  if (window.location.href.endsWith('#')) {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }
  window.history.scrollRestoration = 'manual';
}

function resetPagePreviewInitialScroll(container: HTMLElement) {
  let remainingFrames = 4;

  const reset = () => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    container.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    remainingFrames -= 1;
    if (remainingFrames > 0) window.requestAnimationFrame(reset);
  };

  reset();
}

function syncPagePreviewTailwindFallbackStyle(mode: SourceTreePreviewTailwindCssMode) {
  const selector = `style[${PAGE_PREVIEW_TAILWIND_FALLBACK_STYLE_ATTR}="true"]`;
  const existing = document.head.querySelector<HTMLStyleElement>(selector);
  if (mode !== 'fallback') {
    existing?.remove();
    return;
  }
  const style = existing ?? document.createElement('style');
  style.setAttribute(PAGE_PREVIEW_TAILWIND_FALLBACK_STYLE_ATTR, 'true');
  style.textContent = `@layer wb-source-preview-fallback {\n${getSourceTreePreviewTailwindFallbackCss()}\n}`;
  if (!existing) {
    const baseStyle = document.head.querySelector('style[data-page-preview-base="true"]');
    document.head.insertBefore(style, baseStyle?.nextSibling ?? document.head.firstChild);
  }
}

function installPagePreviewRootWheelScroll(container: HTMLElement): () => void {
  const ownerDocument = container.ownerDocument;
  const snapWheelGestureStates = createPreviewSnapWheelGestureStates();
  const handleWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || !event.cancelable) return;
    const target = event.target;
    if (!(target instanceof Node) || !container.contains(target)) return;

    const deltaX = normalizePagePreviewWheelDelta(event.deltaX, event.deltaMode, container);
    const deltaY = normalizePagePreviewWheelDelta(event.deltaY, event.deltaMode, container);
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    const targetElement = target instanceof Element ? target : target.parentElement;
    const scrollTarget = getPagePreviewScrollableElementAtPoint(
      ownerDocument,
      container,
      event.clientX,
      event.clientY,
      deltaX,
      deltaY,
    ) ?? (targetElement && container.contains(targetElement)
      ? getScrollablePagePreviewAncestor(targetElement, container, deltaX, deltaY)
      : null) ?? (canScrollPagePreviewElement(container, deltaX, deltaY) ? container : null);
    if (!scrollTarget) return;
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

  ownerDocument.addEventListener('wheel', handleWheel, { passive: false });
  return () => ownerDocument.removeEventListener('wheel', handleWheel);
}

function normalizePagePreviewWheelDelta(delta: number, deltaMode: number, container: HTMLElement): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * container.clientHeight;
  return delta;
}

function getScrollablePagePreviewAncestor(
  start: Element,
  container: HTMLElement,
  deltaX: number,
  deltaY: number,
): HTMLElement | null {
  let current: Element | null = start;
  while (current && current !== container) {
    if (current instanceof HTMLElement && canScrollPagePreviewElement(current, deltaX, deltaY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getPagePreviewScrollableElementAtPoint(
  ownerDocument: Document,
  container: HTMLElement,
  clientX: number,
  clientY: number,
  deltaX: number,
  deltaY: number,
): HTMLElement | null {
  const elements = ownerDocument.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (!(element instanceof HTMLElement) || !container.contains(element)) continue;
    if (canScrollPagePreviewElement(element, deltaX, deltaY)) return element;
  }
  return null;
}

function canScrollPagePreviewElement(element: HTMLElement, deltaX: number, deltaY: number): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!style) return false;
  const canScrollY = Math.abs(deltaY) >= Math.abs(deltaX)
    && isPagePreviewScrollableOverflow(style.overflowY || style.overflow)
    && element.scrollHeight > element.clientHeight + 1
    && canScrollPagePreviewAxis(element.scrollTop, element.clientHeight, element.scrollHeight, deltaY);
  const canScrollX = Math.abs(deltaX) > Math.abs(deltaY)
    && isPagePreviewScrollableOverflow(style.overflowX || style.overflow)
    && element.scrollWidth > element.clientWidth + 1
    && canScrollPagePreviewAxis(element.scrollLeft, element.clientWidth, element.scrollWidth, deltaX);
  return canScrollY || canScrollX;
}

function canScrollPagePreviewAxis(scrollPosition: number, clientSize: number, scrollSize: number, delta: number): boolean {
  if (delta > 0) return scrollPosition + clientSize < scrollSize - 1;
  if (delta < 0) return scrollPosition > 1;
  return false;
}

function isPagePreviewScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll' || value === 'overlay';
}

async function loadProjectAssetRegistry(): Promise<WorkbenchAssetRegistry | null> {
  return fetchWorkbenchProjectFileJson<WorkbenchAssetRegistry>('.workbench/assets.json');
}

async function loadProjectTokenRegistry(): Promise<TokenRegistry | null> {
  const registry = await fetchWorkbenchProjectFileJson<TokenRegistry>('.workbench/tokens.json');
  return registry ? normalizeImportedRegistry(registry) : null;
}

async function loadProjectSelectionState(): Promise<WorkbenchSelectionState | null> {
  return fetchWorkbenchProjectFileJson<WorkbenchSelectionState>('.workbench/selection.json');
}

async function loadProjectComponentRegistry(): Promise<WorkbenchComponentRegistry | null> {
  return fetchWorkbenchProjectFileJson<WorkbenchComponentRegistry>('.workbench/components.json');
}

async function fetchWorkbenchProjectFileJson<T>(path: string): Promise<T | null> {
  try {
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    const response = await workbenchFetch(`/__workbench/files/${encodePreviewPath(normalizedPath)}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchPreviewJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(encodePreviewPath(path), { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function encodePreviewPath(path: string): string {
  const leadingSlash = path.startsWith('/');
  const encoded = path
    .split('/')
    .filter((segment, index) => index > 0 || segment.length > 0)
    .map(encodeURIComponent)
    .join('/');
  return `${leadingSlash ? '/' : ''}${encoded}`;
}

async function readPagePreviewProjectSourceFile(
  path: string,
  sourceProjectRoot: string | null,
): Promise<{ ok: true; contents: string } | { ok: false; message: string }> {
  const normalizedPath = normalizePagePreviewProjectSource(path);
  if (!sourceProjectRoot) {
    try {
      const response = await workbenchFetch(PROJECT_SOURCE_READ_PATH, {
        cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: normalizedPath }),
      });
      if (!response.ok) {
        const message = await response.text();
        return {
          ok: false,
          message: message || `Failed to read ${normalizedPath} (${response.status})`,
        };
      }
      return (await response.json()) as { ok: true; contents: string };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : `Failed to read ${normalizedPath}.`,
      };
    }
  }

  const sourceUrl = encodePreviewPath(`${sourceProjectRoot}/${normalizedPath}`);
  try {
    const response = await fetch(sourceUrl, { cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, message: `Failed to read ${normalizedPath} (${response.status})` };
    }
    return { ok: true, contents: await response.text() };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : `Failed to read ${normalizedPath}.`,
    };
  }
}

function normalizePagePreviewProjectSource(path: string): string {
  const projectRoot = getProjectRootFromSource(path);
  const normalized = path.replace(/\\/g, '/');
  if (projectRoot && normalized.startsWith(`${projectRoot}/`)) {
    return normalized.slice(projectRoot.length + 1).replace(/^\/+/, '');
  }
  return normalized.replace(/^\/+/, '');
}

// Mirrors the data-wb-*-token attribute set in
// `editableTreeDomProjection.ts`. The design editor reads these
// attributes off rendered elements and applies the corresponding
// token CSS variable as inline style. We replicate that walker here.
const TOKEN_BINDING_ATTR_TO_STYLE: ReadonlyArray<{ attr: string; collectionAttr: string; styleProp: string }> = [
  { attr: 'data-wb-bg-token',        collectionAttr: 'data-wb-bg-token-collection',        styleProp: 'background' },
  { attr: 'data-wb-radius-token',    collectionAttr: 'data-wb-radius-token-collection',    styleProp: 'borderRadius' },
  { attr: 'data-wb-spacing-token',   collectionAttr: 'data-wb-spacing-token-collection',   styleProp: 'padding' },
  { attr: 'data-wb-font-size-token', collectionAttr: 'data-wb-font-size-token-collection', styleProp: 'fontSize' },
  { attr: 'data-wb-text-token',      collectionAttr: 'data-wb-text-token-collection',      styleProp: 'color' },
];

function applyTokenBindingsTo(root: HTMLElement) {
  for (const { attr, collectionAttr, styleProp } of TOKEN_BINDING_ATTR_TO_STYLE) {
    const elements = root.querySelectorAll<HTMLElement>(`[${attr}]`);
    elements.forEach((el) => {
      const tokenId = el.getAttribute(attr);
      const collectionId = el.getAttribute(collectionAttr);
      if (!tokenId || !collectionId) return;
      const cssVar = getProjectCollectionTokenCssVariableName(collectionId, tokenId);
      (el.style as unknown as Record<string, string>)[styleProp] = `var(${cssVar})`;
    });
  }
}

function watchTokenBindings(container: HTMLElement) {
  applyTokenBindingsTo(container);
  const observer = new MutationObserver(() => applyTokenBindingsTo(container));
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: TOKEN_BINDING_ATTR_TO_STYLE.flatMap((b) => [b.attr, b.collectionAttr]),
  });
}

function injectTokenCssVariables(
  registry: TokenRegistry,
  previewTokenModes: PagePreviewTokenModeSelection,
) {
  // Reuse the design editor's runtime token variable builder. It produces
  // every variable the page TSX may reference — both fully-qualified
  // --ds-token-<collection>-<token> names and the namespaced forms like
  // --ds-spacing-space-6, --ds-color-*, --ds-borderRadius-* — driven from
  // the project's .workbench/tokens.json and selected preview token modes.
  // Without these, inline style
  // values such as `padding: var(--ds-spacing-space-6)` silently fall
  // back to no value.
  const style = getPagePreviewTokenStyleElement();
  const variables = getSourceTreePreviewTokenVariables(registry, previewTokenModes);
  if (!variables) {
    style?.remove();
    return;
  }
  const declarations = Object.entries(variables as Record<string, string>)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  const cssText = `:root,\n[${PAGE_PREVIEW_SCOPE_ATTR}="true"] {\n${declarations}\n}`;
  const nextStyle = style ?? createPagePreviewTokenStyleElement();
  if (nextStyle.textContent !== cssText) nextStyle.textContent = cssText;
}

function resolvePagePreviewTokenModes(
  registry: TokenRegistry,
  params: URLSearchParams,
  selection: WorkbenchSelectionState | null,
): PagePreviewTokenModeSelection {
  const queryModes = parseTokenModeSelectionParam(params.get(TOKEN_MODES_QUERY_PARAM));
  if (Object.keys(queryModes).length > 0) return reconcilePreviewTokenModes(registry, queryModes);
  const persistedModes = parseTokenModeSelection(selection?.extensions.previewTokenModes);
  return reconcilePreviewTokenModes(registry, persistedModes);
}

function resolvePagePreviewAppearance(
  params: URLSearchParams,
  selection: WorkbenchSelectionState | null,
  registry: TokenRegistry | null,
  previewTokenModes: PagePreviewTokenModeSelection,
): DesignPreviewAppearance {
  const queryAppearance = params.get(APPEARANCE_QUERY_PARAM);
  if (queryAppearance) return reconcileDesignPreviewAppearance(queryAppearance);
  if (typeof selection?.extensions.designPreviewAppearance === 'string') {
    return reconcileDesignPreviewAppearance(selection.extensions.designPreviewAppearance);
  }
  return getPagePreviewAppearanceFromTokenModes(registry, previewTokenModes) ?? reconcileDesignPreviewAppearance(null);
}

function getPagePreviewAppearanceFromTokenModes(
  registry: TokenRegistry | null,
  previewTokenModes: PagePreviewTokenModeSelection,
): DesignPreviewAppearance | null {
  if (!registry) return null;
  let hasLight = false;
  let hasDark = false;
  registry.collections.forEach((collection) => {
    const selectedModeId = previewTokenModes[collection.id];
    const selectedMode = collection.modes.find((mode) => mode.id === selectedModeId);
    if (!selectedMode) return;
    const labels = [
      normalizePagePreviewAppearanceModeLabel(selectedMode.id),
      normalizePagePreviewAppearanceModeLabel(selectedMode.name),
    ];
    hasDark = hasDark || labels.includes('dark');
    hasLight = hasLight || labels.includes('light');
  });
  if (hasDark) return 'dark';
  if (hasLight) return 'light';
  return null;
}

function getPagePreviewEffectiveTokenModes(
  registry: TokenRegistry,
  previewAppearance: DesignPreviewAppearance,
  previewTokenModes: PagePreviewTokenModeSelection,
): PagePreviewTokenModeSelection {
  const effectiveAppearance = previewAppearance === 'system'
    ? getPagePreviewSystemAppearance()
    : previewAppearance;
  return getPagePreviewTokenModesForAppearance(registry, previewTokenModes, effectiveAppearance);
}

function getPagePreviewTokenModesForAppearance(
  registry: TokenRegistry,
  current: PagePreviewTokenModeSelection,
  appearance: Exclude<DesignPreviewAppearance, 'system'>,
): PagePreviewTokenModeSelection {
  const next = { ...current };
  registry.collections.forEach((collection) => {
    const matchingMode = collection.modes.find((mode) => (
      normalizePagePreviewAppearanceModeLabel(mode.id) === appearance ||
      normalizePagePreviewAppearanceModeLabel(mode.name) === appearance
    ));
    if (matchingMode) next[collection.id] = matchingMode.id;
  });
  return next;
}

function getPagePreviewSystemAppearance(): Exclude<DesignPreviewAppearance, 'system'> {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function normalizePagePreviewAppearanceModeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function parseTokenModeSelectionParam(value: string | null): PagePreviewTokenModeSelection {
  if (!value) return {};
  try {
    return parseTokenModeSelection(JSON.parse(value));
  } catch {
    return {};
  }
}

function parseTokenModeSelection(value: unknown): PagePreviewTokenModeSelection {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => (
      typeof entry[0] === 'string' &&
      entry[0].trim().length > 0 &&
      typeof entry[1] === 'string' &&
      entry[1].trim().length > 0
    )),
  );
}

function syncPagePreviewTokenModeState(
  previewAppearance: DesignPreviewAppearance,
  previewTokenModes: PagePreviewTokenModeSelection,
) {
  const themeMode = getDesignPreviewAppearanceThemeMode(previewAppearance);
  const tokenModeAttribute = serializeTokenModeOverride(previewTokenModes);
  document.documentElement.dataset.previewTheme = previewAppearance;
  if (themeMode) {
    document.documentElement.dataset.astryxMedia = themeMode;
    document.documentElement.dataset.theme = themeMode;
  } else {
    document.documentElement.removeAttribute('data-astryx-media');
    document.documentElement.removeAttribute('data-theme');
  }
  if (tokenModeAttribute) {
    document.documentElement.setAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE, tokenModeAttribute);
  } else {
    document.documentElement.removeAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE);
  }

  const scope = document.querySelector<HTMLElement>(`[${PAGE_PREVIEW_SCOPE_ATTR}="true"]`);
  if (!scope) return;
  scope.dataset.wbPreviewAppearance = previewAppearance;
  if (themeMode) {
    scope.dataset.astryxMedia = themeMode;
    scope.dataset.theme = themeMode;
  } else {
    scope.removeAttribute('data-astryx-media');
    scope.removeAttribute('data-theme');
  }
  if (tokenModeAttribute) {
    scope.setAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE, tokenModeAttribute);
  } else {
    scope.removeAttribute(SOURCE_TOKEN_MODE_ATTRIBUTE);
  }
}

function getPagePreviewTokenStyleElement(): HTMLStyleElement | null {
  return document.querySelector<HTMLStyleElement>(`style[${PAGE_PREVIEW_TOKEN_STYLE_ATTR}="true"]`);
}

function createPagePreviewTokenStyleElement(): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute(PAGE_PREVIEW_TOKEN_STYLE_ATTR, 'true');
  document.head.appendChild(style);
  return style;
}

function getPagePreviewFontStyleElement(): HTMLStyleElement | null {
  return document.querySelector<HTMLStyleElement>(`style[${PAGE_PREVIEW_FONT_STYLE_ATTR}="true"]`);
}

function createPagePreviewFontStyleElement(): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute(PAGE_PREVIEW_FONT_STYLE_ATTR, 'true');
  document.head.appendChild(style);
  return style;
}

function syncPagePreviewAssetRuntime(assetRegistry: WorkbenchAssetRegistry | null) {
  (globalThis as WorkbenchIconRuntimeGlobal).__WORKBENCH_DEFAULT_ICON_SOURCES__ =
    getWorkbenchDefaultIconSourceMap(assetRegistry ?? undefined);
  injectPagePreviewFontCss(assetRegistry);
}

function getPagePreviewScopeClassName(componentRegistry: WorkbenchComponentRegistry | null): string {
  const classes = new Set<string>();
  const libraries = componentRegistry?.extensions?.libraries ?? {};
  for (const library of Object.values(libraries)) {
    if (library?.id) classes.add(`${library.id}-scope`);
  }
  for (const component of componentRegistry?.components ?? []) {
    const libraryId = component.extensions?.libraryId;
    if (typeof libraryId === 'string' && libraryId.trim().length > 0) {
      classes.add(`${libraryId.trim()}-scope`);
    }
  }
  return [...classes].join(' ');
}

function injectPagePreviewFontCss(assetRegistry: WorkbenchAssetRegistry | null) {
  const cssText = getWorkbenchDefaultFontCssText(
    assetRegistry ?? undefined,
    `[${PAGE_PREVIEW_SCOPE_ATTR}="true"], [data-workbench-portal-root="true"]`,
  ).trim();
  const style = getPagePreviewFontStyleElement();
  if (cssText.length === 0) {
    style?.remove();
    return;
  }
  const nextStyle = style ?? createPagePreviewFontStyleElement();
  if (nextStyle.textContent !== cssText) nextStyle.textContent = cssText;
}

function watchPagePreviewTailwindRuntime(container: HTMLElement): () => void {
  if (pagePreviewTailwindCssMode !== 'fallback') {
    pagePreviewTailwindRuntimeClassNames = new Set();
    pagePreviewTailwindRuntimeRenderKey = '';
    getPagePreviewTailwindRuntimeStyleElement()?.remove();
    return () => undefined;
  }
  pagePreviewTailwindRuntimeClassNames = new Set(collectPagePreviewClassNames(container));
  pagePreviewTailwindRuntimeRenderKey = '';
  syncPagePreviewTailwindRuntime(container);
  const frameId = window.requestAnimationFrame(() => syncPagePreviewTailwindRuntime(container));
  const timeoutId = window.setTimeout(() => syncPagePreviewTailwindRuntime(container), 500);
  let mutationFrameId: number | null = null;
  const scheduleMutationSync = (records: MutationRecord[]) => {
    let discoveredNewClassName = false;
    for (const record of records) {
      if (record.type === 'attributes') {
        if (
          record.target instanceof Element &&
          addPagePreviewElementClassName(record.target, pagePreviewTailwindRuntimeClassNames)
        ) {
          discoveredNewClassName = true;
        }
        continue;
      }
      for (const node of record.addedNodes) {
        if (addPagePreviewNodeClassNames(node, pagePreviewTailwindRuntimeClassNames)) {
          discoveredNewClassName = true;
        }
      }
    }
    if (!discoveredNewClassName) return;
    if (mutationFrameId !== null) return;
    mutationFrameId = window.requestAnimationFrame(() => {
      mutationFrameId = null;
      renderPagePreviewTailwindRuntimeCss();
    });
  };
  const observer = new MutationObserver(scheduleMutationSync);
  observer.observe(document.body, {
    attributeFilter: ['class'],
    attributes: true,
    childList: true,
    subtree: true,
  });

  return () => {
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(timeoutId);
    if (mutationFrameId !== null) window.cancelAnimationFrame(mutationFrameId);
    observer.disconnect();
  };
}

function syncPagePreviewTailwindRuntime(container: HTMLElement) {
  if (pagePreviewTailwindCssMode !== 'fallback') {
    getPagePreviewTailwindRuntimeStyleElement()?.remove();
    return;
  }
  for (const className of collectPagePreviewClassNames(container)) {
    pagePreviewTailwindRuntimeClassNames.add(className);
  }
  renderPagePreviewTailwindRuntimeCss();
}

function renderPagePreviewTailwindRuntimeCss() {
  const classNames = [...pagePreviewTailwindRuntimeClassNames].sort();
  const renderKey = `${pagePreviewTailwindCssMode}:${classNames.join('\u0000')}`;
  if (renderKey === pagePreviewTailwindRuntimeRenderKey) return;
  pagePreviewTailwindRuntimeRenderKey = renderKey;
  const cssText = getSourceTreePreviewTailwindRuntimeCssForClassNames(classNames, {
    layerName: null,
    mode: pagePreviewTailwindCssMode,
  });
  const style = getPagePreviewTailwindRuntimeStyleElement();
  if (cssText.length === 0) {
    style?.remove();
    return;
  }
  const nextStyle = style ?? createPagePreviewTailwindRuntimeStyleElement();
  if (nextStyle.textContent !== cssText) nextStyle.textContent = cssText;
  if (nextStyle.nextSibling) document.head.append(nextStyle);
  schedulePagePreviewProjectCssCascadeSync();
}

function invalidatePagePreviewTailwindRuntimeCss() {
  pagePreviewTailwindRuntimeRenderKey = '';
}

function collectPagePreviewClassNames(container: HTMLElement): string[] {
  const classNames = new Set<string>();
  addPagePreviewElementClassName(document.body, classNames);
  document.body.querySelectorAll('[class]').forEach((element) => {
    addPagePreviewElementClassName(element, classNames);
  });
  addPagePreviewElementClassName(container, classNames);
  container.querySelectorAll('[class]').forEach((element) => {
    addPagePreviewElementClassName(element, classNames);
  });
  return [...classNames];
}

function addPagePreviewElementClassName(element: Element, classNames: Set<string>): boolean {
  const className = element.getAttribute('class')?.trim();
  if (!className || classNames.has(className)) return false;
  classNames.add(className);
  return true;
}

function addPagePreviewNodeClassNames(node: Node, classNames: Set<string>): boolean {
  if (!(node instanceof Element)) return false;
  let changed = addPagePreviewElementClassName(node, classNames);
  node.querySelectorAll('[class]').forEach((element) => {
    if (addPagePreviewElementClassName(element, classNames)) changed = true;
  });
  return changed;
}

function getPagePreviewTailwindRuntimeStyleElement(): HTMLStyleElement | null {
  return document.querySelector<HTMLStyleElement>(`style[${getSourceTreePreviewTailwindRuntimeStyleAttribute()}="true"]`);
}

function createPagePreviewTailwindRuntimeStyleElement(): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute(getSourceTreePreviewTailwindRuntimeStyleAttribute(), 'true');
  document.head.appendChild(style);
  return style;
}

function startPagePreviewTokenSync(
  params: URLSearchParams,
  sourcePath: string,
  getCssModuleUrls: () => string[] | undefined,
  refreshSourceModule: () => Promise<void>,
) {
  let refreshTimer: number | null = null;
  let assetRefreshTimer: number | null = null;
  let projectCssRefreshTimer: number | null = null;
  let sourceRefreshTimer: number | null = null;

  function scheduleRefresh() {
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      void refreshPagePreviewTokens(params);
    }, TOKEN_SYNC_DEBOUNCE_MS);
  }

  function scheduleAssetRefresh() {
    if (assetRefreshTimer !== null) window.clearTimeout(assetRefreshTimer);
    assetRefreshTimer = window.setTimeout(() => {
      assetRefreshTimer = null;
      void refreshPagePreviewAssets();
    }, TOKEN_SYNC_DEBOUNCE_MS);
  }

  function scheduleProjectCssRefresh() {
    if (projectCssRefreshTimer !== null) window.clearTimeout(projectCssRefreshTimer);
    projectCssRefreshTimer = window.setTimeout(() => {
      projectCssRefreshTimer = null;
      void loadProjectCssForSource(sourcePath, getCssModuleUrls(), `${Date.now()}`);
    }, TOKEN_SYNC_DEBOUNCE_MS);
  }

  function scheduleSourceRefresh() {
    if (sourceRefreshTimer !== null) window.clearTimeout(sourceRefreshTimer);
    sourceRefreshTimer = window.setTimeout(() => {
      sourceRefreshTimer = null;
      void refreshSourceModule();
    }, SOURCE_CHANGE_REFRESH_DEBOUNCE_MS);
  }

  subscribeWorkbenchProjectChangeEvents((event) => {
    if (isPagePreviewAssetDataPath(event.path)) {
      scheduleAssetRefresh();
      return;
    }
    if (isPagePreviewTokenDataPath(event.path)) {
      scheduleRefresh();
      if (isPagePreviewProjectCssDataPath(event.path)) scheduleProjectCssRefresh();
      return;
    }
    if (isPagePreviewProjectCssDataPath(event.path)) {
      scheduleProjectCssRefresh();
      return;
    }
    if (isPagePreviewSourceDataPath(event.path)) {
      scheduleSourceRefresh();
    }
  });
}

async function refreshPagePreviewAssets(): Promise<void> {
  syncPagePreviewAssetRuntime(await loadProjectAssetRegistry());
}

async function refreshPagePreviewTokens(params: URLSearchParams): Promise<void> {
  const [tokenRegistry, selectionState] = await Promise.all([
    loadProjectTokenRegistry(),
    loadProjectSelectionState(),
  ]);
  if (!tokenRegistry) return;

  const selectedPreviewTokenModes = resolvePagePreviewTokenModes(tokenRegistry, params, selectionState);
  const previewAppearance = resolvePagePreviewAppearance(params, selectionState, tokenRegistry, selectedPreviewTokenModes);
  const previewTokenModes = getPagePreviewEffectiveTokenModes(
    tokenRegistry,
    previewAppearance,
    selectedPreviewTokenModes,
  );
  syncPagePreviewTokenModeState(
    previewAppearance,
    previewTokenModes,
  );
  injectTokenCssVariables(tokenRegistry, previewTokenModes);
}

function isPagePreviewTokenDataPath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath === '.workbench/tokens.json' ||
    normalizedPath === '.workbench/selection.json' ||
    normalizedPath === 'src/workbench-tokens.css';
}

function isPagePreviewAssetDataPath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalizedPath === '.workbench/assets.json';
}

function isPagePreviewProjectCssDataPath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedPath.startsWith('.workbench/')) return false;
  return normalizedPath.toLowerCase().endsWith('.css');
}

function isPagePreviewSourceDataPath(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedPath.startsWith('.workbench/')) return false;
  return /\.(?:html?|jsx?|tsx?)$/i.test(normalizedPath);
}

async function loadProjectCssForSource(
  sourcePath: string,
  cssModuleUrls?: string[],
  refreshKey?: string,
): Promise<void> {
  if (cssModuleUrls && cssModuleUrls.length > 0) {
    ensurePagePreviewProjectCssCascadeObserver();
    for (const cssModuleUrl of cssModuleUrls) {
      await importPreviewCssModule(
        refreshKey ? appendPagePreviewModuleCacheKey(cssModuleUrl, refreshKey) : cssModuleUrl,
      );
    }
    invalidatePagePreviewTailwindRuntimeCss();
    renderPagePreviewTailwindRuntimeCss();
    schedulePagePreviewProjectCssCascadeSyncBurst();
    return;
  }

  const cssPaths = await getPagePreviewProjectCssPaths(sourcePath);
  await syncPagePreviewProjectCss(sourcePath, cssPaths);
}

function withPagePreviewFallback<T>(
  promise: Promise<T>,
  fallback: T,
  label: string,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve) => {
    let didSettle = false;
    const timeout = window.setTimeout(() => {
      if (didSettle) return;
      didSettle = true;
      console.warn(`[workbench] Page preview ${label} timed out before render.`);
      resolve(fallback);
    }, timeoutMs);

    promise.then(
      (value) => {
        if (didSettle) return;
        didSettle = true;
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        if (didSettle) return;
        didSettle = true;
        window.clearTimeout(timeout);
        console.warn(`[workbench] Page preview ${label} could not be loaded before render:`, error);
        resolve(fallback);
      },
    );
  });
}

async function getPagePreviewProjectCssPaths(sourcePath: string): Promise<string[]> {
  const paths = new Set<string>();
  const config = await loadPagePreviewProjectConfig();
  const shouldIncludeCssPath = createPagePreviewCssPathFilter(config);

  for (const cssPath of getConfiguredPagePreviewCssPaths(config)) {
    if (shouldIncludeCssPath(cssPath)) paths.add(cssPath);
  }
  await collectPagePreviewEntryCssPaths(paths, sourcePath, shouldIncludeCssPath);
  await collectPagePreviewCssImportsFromSourceFiles(paths, [sourcePath], sourcePath, shouldIncludeCssPath);
  return [...paths];
}

async function syncPagePreviewProjectCss(sourcePath: string, cssPaths: string[]): Promise<void> {
  const projectRoot = getProjectRootFromSource(sourcePath);
  const nextCss = new Map<string, string>();
  let didChangeProjectCss = false;
  await Promise.all(cssPaths.map(async (cssPath) => {
    const result = await readPagePreviewProjectSourceFile(cssPath, projectRoot);
    if (result.ok) nextCss.set(normalizePagePreviewProjectSource(cssPath), result.contents);
  }));

  const existingNodes = new Map(
    Array.from(document.head.querySelectorAll<HTMLStyleElement>(`style[${PAGE_PREVIEW_PROJECT_CSS_STYLE_ATTR}="true"]`))
      .map((node) => [node.dataset.wbPagePreviewProjectCssPath ?? '', node] as const)
      .filter(([path]) => path.length > 0),
  );

  for (const [path, contents] of nextCss) {
    const existing = existingNodes.get(path);
    if (existing) {
      if (existing.textContent !== contents) {
        existing.textContent = contents;
        didChangeProjectCss = true;
      }
      continue;
    }
    const style = document.createElement('style');
    style.setAttribute(PAGE_PREVIEW_PROJECT_CSS_STYLE_ATTR, 'true');
    style.dataset.wbPagePreviewProjectCssPath = path;
    style.textContent = contents;
    document.head.appendChild(style);
    didChangeProjectCss = true;
    existingNodes.set(path, style);
  }

  for (const [path, node] of existingNodes) {
    if (!nextCss.has(path)) {
      node.remove();
      didChangeProjectCss = true;
    }
  }

  if (didChangeProjectCss) invalidatePagePreviewTailwindRuntimeCss();
  ensurePagePreviewProjectCssCascadeObserver();
  schedulePagePreviewProjectCssCascadeSyncBurst();
}

async function importPreviewCssModule(url: string): Promise<void> {
  await import(/* @vite-ignore */ url);
}

function ensurePagePreviewProjectCssCascadeObserver() {
  if (pagePreviewProjectCssCascadeObserver) return;
  pagePreviewProjectCssCascadeObserver = new MutationObserver(() => {
    invalidatePagePreviewTailwindRuntimeCss();
    schedulePagePreviewProjectCssCascadeSync();
  });
  pagePreviewProjectCssCascadeObserver.observe(document.head, {
    characterData: true,
    childList: true,
    subtree: true,
  });
}

function schedulePagePreviewProjectCssCascadeSync() {
  if (pagePreviewProjectCssCascadeFrame !== null) return;
  pagePreviewProjectCssCascadeFrame = window.requestAnimationFrame(() => {
    pagePreviewProjectCssCascadeFrame = null;
    syncPagePreviewProjectCssCascadeOrder();
  });
}

function schedulePagePreviewProjectCssCascadeSyncBurst() {
  schedulePagePreviewProjectCssCascadeSync();
  for (const timeoutId of pagePreviewProjectCssCascadeTimeouts) window.clearTimeout(timeoutId);
  pagePreviewProjectCssCascadeTimeouts = [50, 250, 1000].map((delay) => (
    window.setTimeout(() => {
      schedulePagePreviewProjectCssCascadeSync();
    }, delay)
  ));
}

function syncPagePreviewProjectCssCascadeOrder() {
  const projectCssNodes = getPagePreviewProjectCssStyleElements();
  if (projectCssNodes.length === 0) return;

  const runtimeStyle = getPagePreviewTailwindRuntimeStyleElement();
  const referenceNode = runtimeStyle ?? null;
  let cursor: ChildNode | null = referenceNode ? referenceNode.previousSibling : document.head.lastChild;
  let alreadyOrdered = true;
  for (let index = projectCssNodes.length - 1; index >= 0; index -= 1) {
    if (cursor !== projectCssNodes[index]) {
      alreadyOrdered = false;
      break;
    }
    cursor = cursor.previousSibling;
  }
  if (alreadyOrdered) return;

  for (const node of projectCssNodes) {
    document.head.insertBefore(node, referenceNode);
  }
}

function getPagePreviewProjectCssStyleElements(): HTMLStyleElement[] {
  return Array.from(document.head.querySelectorAll<HTMLStyleElement>([
    'style[data-vite-dev-id]',
    `style[${PAGE_PREVIEW_PROJECT_CSS_STYLE_ATTR}="true"]`,
    `style[${PAGE_PREVIEW_BUNDLED_PROJECT_CSS_STYLE_ATTR}]`,
  ].join(', ')));
}

async function loadPagePreviewProjectConfig(): Promise<PagePreviewProjectConfig | null> {
  return fetchWorkbenchProjectFileJson<PagePreviewProjectConfig>('.workbench/workbench.config.json');
}

function getConfiguredPagePreviewCssPaths(config: PagePreviewProjectConfig | null): string[] {
  const paths = new Set<string>();
  const compiledCss = normalizePagePreviewCssConfigPath(getTrimmedPagePreviewString(config?.extensions?.tailwind?.compiledCss));
  const tokenCss = normalizePagePreviewCssConfigPath(getTrimmedPagePreviewString(config?.paths?.tokenCss));
  const provider = getTrimmedPagePreviewString(config?.extensions?.tailwind?.provider);
  const orderedPaths = provider === 'astryx'
    ? [tokenCss, compiledCss]
    : [compiledCss, tokenCss];
  for (const path of orderedPaths) {
    if (path) paths.add(path);
  }
  return [...paths];
}

function createPagePreviewCssPathFilter(config: PagePreviewProjectConfig | null): (path: string) => boolean {
  const compiledCss = normalizePagePreviewCssConfigPath(getTrimmedPagePreviewString(config?.extensions?.tailwind?.compiledCss));
  const sourceCss = normalizePagePreviewCssConfigPath(getTrimmedPagePreviewString(config?.extensions?.tailwind?.sourceCss));
  if (!compiledCss || !sourceCss) return () => true;
  const normalizedSourceCss = normalizePagePreviewProjectPath(sourceCss);
  return (path: string) => normalizePagePreviewProjectPath(path) !== normalizedSourceCss;
}

async function collectPagePreviewEntryCssPaths(
  paths: Set<string>,
  sourcePath: string,
  shouldIncludeCssPath: (path: string) => boolean,
): Promise<void> {
  const projectRoot = getProjectRootFromSource(sourcePath);
  const entrySourceFiles = new Set<string>();
  const htmlResult = await readPagePreviewProjectSourceFile(PROJECT_HTML_ENTRY_PATH, projectRoot);
  if (htmlResult.ok) {
    for (const stylesheetPath of getPagePreviewHtmlStylesheetPaths(htmlResult.contents)) {
      if (shouldIncludeCssPath(stylesheetPath)) paths.add(stylesheetPath);
    }
    for (const sourceFile of getPagePreviewHtmlModuleScriptPaths(htmlResult.contents)) {
      entrySourceFiles.add(sourceFile);
    }
  }

  const sourceFiles = entrySourceFiles.size > 0
    ? [...entrySourceFiles]
    : PROJECT_DEFAULT_ENTRY_SOURCE_FILES;
  await collectPagePreviewDirectCssImportsFromSourceFiles(paths, sourceFiles, sourcePath, shouldIncludeCssPath);
}

async function collectPagePreviewDirectCssImportsFromSourceFiles(
  paths: Set<string>,
  sourceFiles: string[],
  sourcePath: string,
  shouldIncludeCssPath: (path: string) => boolean,
): Promise<void> {
  const projectRoot = getProjectRootFromSource(sourcePath);
  await Promise.all(sourceFiles.map(async (sourceFile) => {
    const normalizedSourceFile = normalizePagePreviewProjectSource(sourceFile);
    if (!normalizedSourceFile) return;
    const result = await readPagePreviewProjectSourceFile(normalizedSourceFile, projectRoot);
    if (!result.ok) return;

    for (const cssPath of getPagePreviewSourceCssImportPaths(normalizedSourceFile, result.contents)) {
      if (shouldIncludeCssPath(cssPath)) paths.add(cssPath);
    }
  }));
}

async function collectPagePreviewCssImportsFromSourceFiles(
  paths: Set<string>,
  sourceFiles: string[],
  sourcePath: string,
  shouldIncludeCssPath: (path: string) => boolean,
): Promise<void> {
  const visited = new Set<string>();
  const moduleResolutionCache = new Map<string, Promise<string | null>>();
  await Promise.all(sourceFiles.map((sourceFile) => (
    collectPagePreviewCssImportsFromSourceFile(
      paths,
      sourceFile,
      sourcePath,
      visited,
      moduleResolutionCache,
      0,
      shouldIncludeCssPath,
    )
  )));
}

async function collectPagePreviewCssImportsFromSourceFile(
  paths: Set<string>,
  sourceFile: string,
  sourcePath: string,
  visited: Set<string>,
  moduleResolutionCache: Map<string, Promise<string | null>>,
  depth: number,
  shouldIncludeCssPath: (path: string) => boolean,
): Promise<void> {
  if (depth > PROJECT_ENTRY_IMPORT_SCAN_MAX_DEPTH) return;
  const normalizedSourceFile = normalizePagePreviewProjectSource(sourceFile);
  if (!normalizedSourceFile || visited.has(normalizedSourceFile)) return;
  visited.add(normalizedSourceFile);

  const projectRoot = getProjectRootFromSource(sourcePath);
  const result = await readPagePreviewProjectSourceFile(normalizedSourceFile, projectRoot);
  if (!result.ok) return;

  for (const cssPath of getPagePreviewSourceCssImportPaths(normalizedSourceFile, result.contents)) {
    if (shouldIncludeCssPath(cssPath)) paths.add(cssPath);
  }

  const moduleSourceFiles = await getPagePreviewSourceLocalModuleImportSourceFiles(
    normalizedSourceFile,
    result.contents,
    sourcePath,
    moduleResolutionCache,
  );
  await Promise.all(moduleSourceFiles.map((moduleSourceFile) => (
    collectPagePreviewCssImportsFromSourceFile(
      paths,
      moduleSourceFile,
      sourcePath,
      visited,
      moduleResolutionCache,
      depth + 1,
      shouldIncludeCssPath,
    )
  )));
}

function getPagePreviewSourceCssImportPaths(sourceFile: string, contents: string): string[] {
  const paths = new Set<string>();
  const importPattern = /\bimport\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+\.css)\1\s*;?/g;
  for (const match of contents.matchAll(importPattern)) {
    const importSource = match[2];
    if (!importSource || !isPagePreviewProjectLocalImportSource(importSource)) continue;
    const resolved = resolvePagePreviewProjectLocalImportSourcePath(sourceFile, importSource);
    if (resolved) paths.add(resolved);
  }
  return [...paths];
}

async function getPagePreviewSourceLocalModuleImportSourceFiles(
  sourceFile: string,
  contents: string,
  sourcePath: string,
  moduleResolutionCache: Map<string, Promise<string | null>>,
): Promise<string[]> {
  const sourceFiles = new Set<string>();
  const importPattern = /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?(['"])([^'"]+)\1\s*;?/g;
  for (const match of contents.matchAll(importPattern)) {
    const importSource = match[2];
    if (!importSource || !isPagePreviewProjectLocalImportSource(importSource) || /\.css(?:$|[?#])/i.test(importSource)) continue;
    const resolved = resolvePagePreviewProjectLocalImportSourcePath(sourceFile, importSource);
    if (!resolved) continue;
    const resolvedSourceFile = await resolvePagePreviewProjectSourceModulePathCached(resolved, sourcePath, moduleResolutionCache);
    if (resolvedSourceFile) sourceFiles.add(resolvedSourceFile);
  }
  return [...sourceFiles];
}

function resolvePagePreviewProjectSourceModulePathCached(
  resolvedPath: string,
  sourcePath: string,
  moduleResolutionCache: Map<string, Promise<string | null>>,
): Promise<string | null> {
  const normalized = normalizePagePreviewProjectSource(resolvedPath);
  if (!normalized) return Promise.resolve(null);
  const cached = moduleResolutionCache.get(normalized);
  if (cached) return cached;
  const promise = resolvePagePreviewProjectSourceModulePath(normalized, sourcePath);
  moduleResolutionCache.set(normalized, promise);
  return promise;
}

async function resolvePagePreviewProjectSourceModulePath(resolvedPath: string, sourcePath: string): Promise<string | null> {
  const normalized = normalizePagePreviewProjectSource(resolvedPath);
  if (!normalized) return null;
  const candidates = hasPagePreviewProjectSourceExtension(normalized)
    ? [normalized]
    : [
        `${normalized}.tsx`,
        `${normalized}.jsx`,
        `${normalized}.ts`,
        `${normalized}.js`,
        `${normalized}/index.tsx`,
        `${normalized}/index.jsx`,
        `${normalized}/index.ts`,
        `${normalized}/index.js`,
      ];
  const projectRoot = getProjectRootFromSource(sourcePath);
  for (const candidate of candidates) {
    const result = await readPagePreviewProjectSourceFile(candidate, projectRoot);
    if (result.ok) return candidate;
  }
  return null;
}

function getPagePreviewHtmlModuleScriptPaths(contents: string): string[] {
  const paths = new Set<string>();
  for (const attributes of getPagePreviewHtmlTagAttributes(contents, 'script')) {
    const type = attributes.get('type')?.toLowerCase() ?? '';
    if (type && type !== 'module') continue;
    const source = attributes.get('src');
    const path = source ? normalizePagePreviewHtmlProjectAssetPath(source) : null;
    if (path && hasPagePreviewProjectSourceExtension(path)) paths.add(path);
  }
  return [...paths];
}

function getPagePreviewHtmlStylesheetPaths(contents: string): string[] {
  const paths = new Set<string>();
  for (const attributes of getPagePreviewHtmlTagAttributes(contents, 'link')) {
    const rel = attributes.get('rel')?.toLowerCase() ?? '';
    if (!rel.split(/\s+/).includes('stylesheet')) continue;
    const href = attributes.get('href');
    const path = href ? normalizePagePreviewHtmlProjectAssetPath(href) : null;
    if (path && /\.css$/i.test(path)) paths.add(path);
  }
  return [...paths];
}

function getPagePreviewHtmlTagAttributes(contents: string, tagName: string): Array<Map<string, string>> {
  const attributesList: Array<Map<string, string>> = [];
  const tagPattern = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  for (const tagMatch of contents.matchAll(tagPattern)) {
    attributesList.push(parsePagePreviewHtmlAttributes(tagMatch[1] ?? ''));
  }
  return attributesList;
}

function parsePagePreviewHtmlAttributes(attributesSource: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of attributesSource.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function normalizePagePreviewHtmlProjectAssetPath(rawPath: string): string | null {
  const path = normalizePagePreviewProjectPath(rawPath.split(/[?#]/, 1)[0] ?? '');
  if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return null;
  const withoutLeadingSlash = path.replace(/^\/+/, '');
  const normalized = withoutLeadingSlash.replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('../')) return null;
  return normalized;
}

function resolvePagePreviewProjectLocalImportSourcePath(sourceFile: string, importSource: string): string | null {
  const normalizedImport = importSource.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  if (!normalizedImport || !isPagePreviewProjectLocalImportSource(normalizedImport)) return null;
  const sourceParts = normalizePagePreviewProjectSource(sourceFile).split('/').filter(Boolean);
  sourceParts.pop();
  for (const part of normalizedImport.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      sourceParts.pop();
      continue;
    }
    sourceParts.push(part);
  }
  return sourceParts.join('/');
}

function isPagePreviewProjectLocalImportSource(importSource: string): boolean {
  return importSource.startsWith('./') || importSource.startsWith('../');
}

function hasPagePreviewProjectSourceExtension(path: string): boolean {
  return /\.(tsx|jsx|ts|js)$/i.test(path);
}

function normalizePagePreviewProjectPath(path: string): string {
  return path.trim().replace(/\\/g, '/');
}

function normalizePagePreviewCssConfigPath(value: string | null): string | null {
  if (!value) return null;
  const rawPath = value.trim().replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const normalizedPath = rawPath.replace(/^\/+/, '').replace(/^\.\//, '');
  if (!normalizedPath || !normalizedPath.toLowerCase().endsWith('.css') || normalizedPath.startsWith('../')) {
    return null;
  }
  return normalizedPath;
}

function getTrimmedPagePreviewString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function resolvePagePreviewModule(sourcePath: string, cacheKey?: string | null): Promise<PagePreviewModuleLoader | null> {
  if (cacheKey) {
    const manifest = await fetchPagePreviewModuleManifest(sourcePath);
    if (manifest) return createPagePreviewManifestModuleLoader(manifest, cacheKey);
  }

  const manifest = await fetchPagePreviewModuleManifest(sourcePath);
  if (!manifest) return null;
  return createPagePreviewManifestModuleLoader(manifest, cacheKey);
}

function createPagePreviewManifestModuleLoader(
  manifest: PagePreviewModuleManifest,
  cacheKey?: string | null,
): PagePreviewModuleLoader {
  const importCacheKey = getPagePreviewImportCacheKey(cacheKey);
  return {
    cssModuleUrls: manifest.cssModuleUrls?.map((url) => appendPagePreviewModuleCacheKey(url, importCacheKey)),
    load: () => import(/* @vite-ignore */ appendPagePreviewModuleCacheKey(manifest.moduleUrl, importCacheKey)) as Promise<{ default?: React.ComponentType }>,
    tailwindCssMode: manifest.tailwindCssMode ?? 'disabled',
  };
}

function getPagePreviewImportCacheKey(cacheKey?: string | null): string {
  return cacheKey?.trim() || `${Date.now()}`;
}

function appendPagePreviewModuleCacheKey(moduleUrl: string, cacheKey?: string | null): string {
  const version = getPagePreviewImportCacheKey(cacheKey);
  const separator = moduleUrl.includes('?') ? '&' : '?';
  return `${moduleUrl}${separator}wb_page_preview=${encodeURIComponent(version)}`;
}

async function fetchPagePreviewModuleManifest(sourcePath: string): Promise<PagePreviewModuleManifest | null> {
  try {
    const response = await workbenchFetch(`${PROJECT_PREVIEW_MODULE_PATH}?${new URLSearchParams({ source: sourcePath })}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const parsed = await response.json() as unknown;
    if (!isRecord(parsed) || parsed.ok !== true || typeof parsed.moduleUrl !== 'string') return null;
    return {
      ok: true,
      sourceFile: typeof parsed.sourceFile === 'string' ? parsed.sourceFile : sourcePath,
      moduleUrl: parsed.moduleUrl,
      cssModuleUrls: Array.isArray(parsed.cssModuleUrls)
        ? parsed.cssModuleUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        : undefined,
      tailwindCssMode: isSourceTreePreviewTailwindCssMode(parsed.tailwindCssMode)
        ? parsed.tailwindCssMode
        : 'disabled',
    };
  } catch {
    return null;
  }
}

function isSourceTreePreviewTailwindCssMode(value: unknown): value is SourceTreePreviewTailwindCssMode {
  return value === 'compiled' || value === 'disabled' || value === 'fallback';
}

function getProjectRootFromSource(sourcePath: string): string | null {
  const normalized = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`;
  const match = normalized.match(/^\/projects\/[^/]+\/src\//);
  return match ? match[0].slice(0, -5) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function startRuntimePageProjectionBridge({
  container,
  label,
  previewTokenModes,
  projectionId,
  sourceFile,
  tokenRegistry,
}: {
  container: HTMLElement;
  label: string;
  previewTokenModes: PagePreviewTokenModeSelection;
  projectionId: string;
  sourceFile: string;
  tokenRegistry: TokenRegistry | null;
}): RuntimePageProjectionBridge {
  let frameId: number | null = null;
  let rectFrameId: number | null = null;
  let forceNextTreePost = false;
  let lastTreeSignature: string | null = null;
  let selectedLayerId: string | null = null;

  const getScopeElement = () => container.querySelector<HTMLElement>(`[${PAGE_PREVIEW_SCOPE_ATTR}="true"]`);
  const postToParent = (message: RuntimePageProjectionParentMessage) => {
    if (window.parent === window) return;
    window.parent.postMessage(message, window.location.origin);
  };
  const capture = () => {
    frameId = null;
    const scope = getScopeElement();
    const tree = scope
      ? createEditableDocumentTreeFromDomProjection({
          label: `${label} runtime page projection`,
          previewTokenModes,
          projectionId,
          rootElement: scope,
          sourceFile,
          tokenRegistry: tokenRegistry ?? undefined,
        })
      : null;
    const treeSignature = getRuntimePageProjectionTreeSignature(tree);
    if (forceNextTreePost || treeSignature !== lastTreeSignature) {
      lastTreeSignature = treeSignature;
      forceNextTreePost = false;
      postToParent({
        projectionId,
        tree,
        type: RUNTIME_PAGE_PROJECTION_TREE_MESSAGE,
      });
    } else {
      forceNextTreePost = false;
    }
    if (scope) markRuntimeDesignSelection(scope, selectedLayerId);
    scheduleRectPost();
  };
  const scheduleCapture = (force = false) => {
    if (force) forceNextTreePost = true;
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(capture);
  };
  const postSelectionRects = () => {
    rectFrameId = null;
    const scope = getScopeElement();
    postToParent({
      projectionId,
      rects: scope && selectedLayerId
        ? getRuntimePageProjectionSelectionRects(scope, selectedLayerId)
        : [],
      type: RUNTIME_PAGE_SELECTION_RECTS_MESSAGE,
    });
  };
  const scheduleRectPost = () => {
    if (rectFrameId !== null) return;
    rectFrameId = window.requestAnimationFrame(postSelectionRects);
  };
  const handleClick = (event: MouseEvent) => {
    const scope = getScopeElement();
    if (!scope) return;
    const interactiveTarget = getRuntimePageInteractiveEventTarget(event.target, scope);
    if (!interactiveTarget) {
      event.preventDefault();
      event.stopPropagation();
    } else if (isRuntimePageNavigationTarget(interactiveTarget)) {
      event.preventDefault();
    }
    const additive = isRuntimePageAdditiveSelectionEvent(event);
    const mode = event.metaKey || event.ctrlKey
      ? 'smart-deep'
      : 'direct';
    const layerId = getRuntimeDesignNodeIdFromPoint(scope, event, { mode }) ??
      getRuntimeDesignNodeIdFromEventTarget(event.target, { mode, rootElement: scope });
    if (!layerId) return;
    selectedLayerId = layerId;
    markRuntimeDesignSelection(scope, selectedLayerId);
    postToParent({
      additive,
      layerId,
      mode,
      projectionId,
      type: RUNTIME_PAGE_SELECT_MESSAGE,
    });
    scheduleRectPost();
  };
  const handleDoubleClick = (event: MouseEvent) => {
    const scope = getScopeElement();
    if (!scope) return;
    const interactiveTarget = getRuntimePageInteractiveEventTarget(event.target, scope);
    if (!interactiveTarget) {
      event.preventDefault();
      event.stopPropagation();
    } else if (isRuntimePageNavigationTarget(interactiveTarget)) {
      event.preventDefault();
    }
    const layerId = getRuntimeDesignNodeIdFromPoint(scope, event, { mode: 'deep' }) ??
      getRuntimeDesignNodeIdFromEventTarget(event.target, { mode: 'deep', rootElement: scope });
    if (!layerId) return;
    postToParent({
      layerId,
      projectionId,
      type: RUNTIME_PAGE_DRILL_MESSAGE,
    });
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    const shortcut = getRuntimePageKeyboardShortcut(event);
    if (!shortcut) return;
    event.preventDefault();
    event.stopPropagation();
    postToParent({
      projectionId,
      shortcut,
      type: RUNTIME_PAGE_KEYBOARD_SHORTCUT_MESSAGE,
    });
  };
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || !isRecord(event.data)) return;
    if (event.data.projectionId !== projectionId) return;
    if (event.data.type === RUNTIME_PAGE_CAPTURE_REQUEST_MESSAGE) {
      scheduleCapture(true);
      scheduleRectPost();
      return;
    }
    if (event.data.type === RUNTIME_PAGE_SELECTED_LAYER_MESSAGE) {
      selectedLayerId = typeof event.data.selectedLayerId === 'string' ? event.data.selectedLayerId : null;
      const scope = getScopeElement();
      if (scope) markRuntimeDesignSelection(scope, selectedLayerId);
      scheduleRectPost();
    }
  };
  const mutationObserver = new MutationObserver(() => scheduleCapture());
  mutationObserver.observe(container, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  container.addEventListener('click', handleClick, true);
  container.addEventListener('dblclick', handleDoubleClick, true);
  window.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('scroll', scheduleRectPost, true);
  window.addEventListener('message', handleMessage);
  window.addEventListener('resize', scheduleRectPost);
  scheduleCapture();

  return {
    capture: () => scheduleCapture(true),
    dispose: () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (rectFrameId !== null) window.cancelAnimationFrame(rectFrameId);
      mutationObserver.disconnect();
      container.removeEventListener('click', handleClick, true);
      container.removeEventListener('dblclick', handleDoubleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('scroll', scheduleRectPost, true);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', scheduleRectPost);
    },
  };
}

function isRuntimePageAdditiveSelectionEvent(event: Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>): boolean {
  return event.shiftKey;
}

function getRuntimePageInteractiveEventTarget(target: EventTarget | null, scope: HTMLElement): Element | null {
  if (!(target instanceof Element)) return null;
  const interactiveTarget = target.closest(RUNTIME_PAGE_INTERACTIVE_SELECTOR);
  return interactiveTarget !== null && scope.contains(interactiveTarget) ? interactiveTarget : null;
}

function isRuntimePageNavigationTarget(target: Element): boolean {
  return target.matches('a[href], area[href]');
}

function getRuntimePageKeyboardShortcut(event: KeyboardEvent): RuntimePageKeyboardShortcut | null {
  if (isRuntimePageEditableShortcutTarget(event.target)) return null;

  const isModifierPressed = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  if (isModifierPressed && !event.altKey) {
    if (event.shiftKey && isRuntimePageShortcutKey(event, 'g', 'KeyG')) return { action: 'wrap' };
    if (!event.shiftKey && key === 'c') return { action: 'copy' };
    if (!event.shiftKey && key === 'x') return { action: 'cut' };
    if (key === 'v') return { action: 'paste', placement: event.shiftKey ? 'inside' : 'below' };
    if (!event.shiftKey && key === 'd') return { action: 'duplicate' };
    return null;
  }

  if (!isModifierPressed && !event.altKey && event.shiftKey && isRuntimePageShortcutKey(event, 'w', 'KeyW')) {
    return { action: 'wrap' };
  }

  if (!isModifierPressed && !event.altKey && !event.shiftKey && isRuntimePageShortcutKey(event, 'i', 'KeyI')) {
    return { action: 'insert-child' };
  }

  if (!isModifierPressed && !event.shiftKey && event.altKey) {
    if (event.key === 'ArrowUp') return { action: 'move', intent: { kind: 'reorder', offset: -1 } };
    if (event.key === 'ArrowDown') return { action: 'move', intent: { kind: 'reorder', offset: 1 } };
    if (event.key === 'ArrowLeft') return { action: 'move', intent: { kind: 'outdent' } };
    if (event.key === 'ArrowRight') return { action: 'move', intent: { kind: 'indent' } };
    return null;
  }

  if (!isModifierPressed && !event.altKey && !event.shiftKey && (event.key === 'Backspace' || event.key === 'Delete')) {
    return { action: 'delete' };
  }

  return null;
}

function isRuntimePageShortcutKey(event: KeyboardEvent, key: string, code: string): boolean {
  return event.key.toLowerCase() === key || event.code === code;
}

function isRuntimePageEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
}

function getRuntimePageProjectionSelectionRects(
  scope: HTMLElement,
  selectedLayerId: string,
): RuntimePageProjectionRect[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(`[data-wb-runtime-node-id="${escapeRuntimePageProjectionSelectorValue(selectedLayerId)}"]`))
    .flatMap((element) => {
      const rect = getRuntimePageProjectionElementRect(element);
      if (!rect || rect.width <= 0 || rect.height <= 0) return [];
      return [{
        height: normalizeRuntimePageProjectionRectValue(rect.height),
        left: normalizeRuntimePageProjectionRectValue(rect.left),
        top: normalizeRuntimePageProjectionRectValue(rect.top),
        width: normalizeRuntimePageProjectionRectValue(rect.width),
      }];
    });
}

function getRuntimePageProjectionTreeSignature(tree: EditableDocumentTree | null): string | null {
  return tree ? JSON.stringify(tree) : null;
}

function getRuntimePageProjectionElementRect(element: HTMLElement): DOMRect | null {
  const rect = element.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;

  const childRects = Array.from(element.children)
    .flatMap((child) => child instanceof HTMLElement
      ? getRuntimePageProjectionElementRects(child)
      : [])
    .filter((childRect) => childRect.width > 0 && childRect.height > 0);
  if (childRects.length === 0) return null;

  const left = Math.min(...childRects.map((childRect) => childRect.left));
  const top = Math.min(...childRects.map((childRect) => childRect.top));
  const right = Math.max(...childRects.map((childRect) => childRect.right));
  const bottom = Math.max(...childRects.map((childRect) => childRect.bottom));
  return DOMRect.fromRect({ x: left, y: top, width: right - left, height: bottom - top });
}

function getRuntimePageProjectionElementRects(element: HTMLElement): DOMRect[] {
  const rect = element.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return [rect];
  return Array.from(element.children).flatMap((child) => (
    child instanceof HTMLElement ? getRuntimePageProjectionElementRects(child) : []
  ));
}

function escapeRuntimePageProjectionSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeRuntimePageProjectionRectValue(value: number): number {
  return Math.round(value * 2) / 2;
}

async function bootstrap() {
  preparePagePreviewInitialNavigation();
  hydrateWorkbenchLocalBridgePairingFromUrl();
  injectBaseStyle();
  const container = document.getElementById('page-preview-root');
  if (!container) return;
  installPagePreviewRootWheelScroll(container);
  const root = createRoot(container);

  const params = new URLSearchParams(window.location.search);
  const sourceParam = params.get('source');
  const titleParam = params.get('title');
  const runtimeProjectionId = params.get(RUNTIME_PROJECTION_QUERY_PARAM)?.trim() || null;
  if (titleParam) document.title = titleParam;

  if (!sourceParam) {
    root.render(
      <PreviewError
        title="No page source specified"
        detail={'Open this preview from the design editor "Browser preview" button, or provide a ?source=src/workbench-pages/<File>.tsx or ?source=src/app/<route>/page.tsx query parameter.'}
      />,
    );
    return;
  }

  const previewModule = await withPagePreviewFallback(
    resolvePagePreviewModule(sourceParam, runtimeProjectionId),
    null,
    'module manifest',
    PROJECT_PREVIEW_METADATA_TIMEOUT_MS,
  );
  if (!previewModule) {
    root.render(
      <PreviewError
        title={`Page not found: ${sourceParam}`}
        detail="The active Workbench project did not provide a preview module for this source file."
      />,
    );
    return;
  }
  pagePreviewTailwindCssMode = previewModule.tailwindCssMode;
  syncPagePreviewTailwindFallbackStyle(pagePreviewTailwindCssMode);
  invalidatePagePreviewTailwindRuntimeCss();

  // The SG DS library's <Icon> component reads its src map from
  // `globalThis.__WORKBENCH_DEFAULT_ICON_SOURCES__`. The design editor
  // populates that global at runtime from the project's asset
  // registry; we mirror that setup here so every <Icon name="…"/> in
  // the page resolves to its SVG before React renders.
  const [assetRegistry, tokenRegistry, selectionState, componentRegistry] = await Promise.all([
    withPagePreviewFallback(loadProjectAssetRegistry(), null, 'asset registry', PROJECT_PREVIEW_METADATA_TIMEOUT_MS),
    withPagePreviewFallback(loadProjectTokenRegistry(), null, 'token registry', PROJECT_PREVIEW_METADATA_TIMEOUT_MS),
    withPagePreviewFallback(loadProjectSelectionState(), null, 'selection state', PROJECT_PREVIEW_METADATA_TIMEOUT_MS),
    withPagePreviewFallback(loadProjectComponentRegistry(), null, 'component registry', PROJECT_PREVIEW_METADATA_TIMEOUT_MS),
  ]);
  const selectedPreviewTokenModes = tokenRegistry
    ? resolvePagePreviewTokenModes(tokenRegistry, params, selectionState)
    : {};
  const previewAppearance = resolvePagePreviewAppearance(params, selectionState, tokenRegistry, selectedPreviewTokenModes);
  const previewTokenModes = tokenRegistry
    ? getPagePreviewEffectiveTokenModes(tokenRegistry, previewAppearance, selectedPreviewTokenModes)
    : selectedPreviewTokenModes;
  const previewThemeMode = getDesignPreviewAppearanceThemeMode(previewAppearance);
  const previewTokenModeAttribute = serializeTokenModeOverride(previewTokenModes) ?? undefined;
  syncPagePreviewTokenModeState(previewAppearance, previewTokenModes);
  syncPagePreviewAssetRuntime(assetRegistry);
  if (tokenRegistry) {
    // Defines --ds-spacing-*, --ds-color-*, --ds-token-* etc.
    // that page inline-styles reference. Without these, paddings/gaps/colors
    // set through the workbench inspector silently fall back to nothing.
    injectTokenCssVariables(tokenRegistry, previewTokenModes);
  }
  let activePreviewModule = previewModule;
  let runtimeProjectionBridge: RuntimePageProjectionBridge | null = null;
  let sourceRefreshRunning = false;
  let sourceRefreshPending = false;
  let sourceRefreshRevision = 0;

  const renderPage = (Page: ComponentType) => {
    root.render(
      <PagePreviewRoot
        previewAppearance={previewAppearance}
        previewScopeClassName={getPagePreviewScopeClassName(componentRegistry)}
        previewThemeMode={previewThemeMode}
        previewTokenModeAttribute={previewTokenModeAttribute}
      >
        <Page />
      </PagePreviewRoot>,
    );
  };

  const refreshPagePreviewSourceModule = async (): Promise<void> => {
    if (sourceRefreshRunning) {
      sourceRefreshPending = true;
      return;
    }

    sourceRefreshRunning = true;
    const refreshKey = `${Date.now()}-${sourceRefreshRevision += 1}`;
    try {
      const nextPreviewModule = await withPagePreviewFallback(
        resolvePagePreviewModule(sourceParam, refreshKey),
        null,
        'source module manifest refresh',
        PROJECT_PREVIEW_METADATA_TIMEOUT_MS,
      );
      if (!nextPreviewModule) {
        console.warn(`[workbench] Page preview source refresh could not resolve ${sourceParam}; keeping the current page.`);
        return;
      }

      const nextModule = await withPagePreviewFallback(
        nextPreviewModule.load(),
        null,
        'source module refresh',
        PROJECT_PREVIEW_METADATA_TIMEOUT_MS,
      );
      const NextPage = nextModule?.default;
      if (!NextPage) {
        console.warn(`[workbench] Page preview source refresh returned no default export for ${sourceParam}; keeping the current page.`);
        return;
      }

      await loadProjectCssForSource(sourceParam, nextPreviewModule.cssModuleUrls, refreshKey);
      activePreviewModule = nextPreviewModule;
      pagePreviewTailwindCssMode = nextPreviewModule.tailwindCssMode;
      syncPagePreviewTailwindFallbackStyle(pagePreviewTailwindCssMode);
      invalidatePagePreviewTailwindRuntimeCss();
      renderPage(NextPage);
      requestAnimationFrame(() => {
        applyTokenBindingsTo(container);
        syncPagePreviewTailwindRuntime(container);
        runtimeProjectionBridge?.capture();
      });
    } catch (error) {
      console.warn('[workbench] Page preview source refresh failed; keeping the current page:', error);
    } finally {
      sourceRefreshRunning = false;
      if (sourceRefreshPending) {
        sourceRefreshPending = false;
        void refreshPagePreviewSourceModule();
      }
    }
  };

  try {
    const projectCssReady = loadProjectCssForSource(sourceParam, previewModule.cssModuleUrls)
      .catch((error) => {
        console.warn('[workbench] Page preview project CSS could not be loaded before render:', error);
      });
    const mod = await withPagePreviewFallback(
      previewModule.load(),
      null,
      'page module',
      PROJECT_PREVIEW_METADATA_TIMEOUT_MS,
    );
    if (!mod) {
      root.render(
        <PreviewError
          title="Failed to load page"
          detail={`Timed out while loading ${sourceParam}.`}
        />,
      );
      return;
    }
    const Page = mod.default;
    if (!Page) {
      root.render(<PreviewError title="Page module has no default export" detail={sourceParam} />);
      return;
    }
    // Each library's `${id}-scope` class wraps the page so nested `& .x`
    // rules in library CSS (which compile to descendant selectors like
    // `.library-scope .x`) match elements that themselves carry both the
    // scope class and the component class -- e.g. a `.card` article with
    // no scoped ancestor of its own. The design editor preview iframe
    // wraps the page in the same scopes.
    // Hook the token-binding walker up BEFORE the first React commit
    // so the MutationObserver catches the initial node insertions.
    // (Without StrictMode's double-mount, a single post-render scan
    // would suffice — but StrictMode replays initial effects, and we
    // want every newly attached subtree resolved automatically.)
    watchTokenBindings(container);
    watchPagePreviewTailwindRuntime(container);
    // Prototype interaction layer: interpret data-wb-proto-* wiring (e.g.
    // "login button opens the login dialog") without touching components.
    installPrototypeInteractions(document);
    runtimeProjectionBridge = runtimeProjectionId && window.parent !== window
      ? startRuntimePageProjectionBridge({
          container,
          label: titleParam ?? sourceParam,
          previewTokenModes,
          projectionId: runtimeProjectionId,
          sourceFile: sourceParam,
          tokenRegistry,
        })
      : null;
    // Skip StrictMode here: the page-preview is a thin development
    // surface, and StrictMode's intentional double-invoke triggers
    // animations and ResizeObservers in the library components in
    // ways that don't reflect production rendering and that fight
    // the token-binding walker's mutation timing.
    renderPage(Page);
    startPagePreviewTokenSync(
      params,
      sourceParam,
      () => activePreviewModule.cssModuleUrls,
      refreshPagePreviewSourceModule,
    );
    resetPagePreviewInitialScroll(container);
    // Belt-and-suspenders sweep after first paint to catch any
    // bindings that the MutationObserver missed during initial
    // hydration timing.
    requestAnimationFrame(() => {
      applyTokenBindingsTo(container);
      syncPagePreviewTailwindRuntime(container);
      runtimeProjectionBridge?.capture();
    });
    void projectCssReady.then(() => {
      requestAnimationFrame(() => {
        applyTokenBindingsTo(container);
        syncPagePreviewTailwindRuntime(container);
        runtimeProjectionBridge?.capture();
      });
    });
  } catch (error) {
    root.render(
      <PreviewError
        title="Failed to load page"
        detail={error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
      />,
    );
  }
}

void bootstrap();
