/**
 * Prototype interaction layer — Workbench-only click wiring stored as
 * `data-wb-proto-*` attributes on page source nodes.
 *
 * The wiring never becomes product logic: the source parser hides `data-wb-`
 * attributes from component props, the developer export strips them from the
 * handed-off TSX, and this runtime drives the native <dialog> element
 * directly so the design-system components stay bare.
 *
 * Schema (v1, click → dialog):
 *   trigger node:  data-wb-proto-click="dialog-open:login"
 *                  actions: dialog-open | dialog-close | dialog-toggle
 *   dialog node:   data-wb-proto-name="login"
 *                  data-wb-proto-initial="closed"   ← closed on preview load
 *
 * Schema (v2, click → tab select):
 *   trigger node:  data-wb-proto-click="tab-select:dm-list/group"
 *   tab nodes:     data-wb-proto-tab="dm-list/private" | "dm-list/group"
 *   panel nodes:   data-wb-proto-panel="dm-list/private" | "dm-list/group"
 *   The target is "<group>/<id>" — selecting one id flips aria-selected on
 *   every tab in the group and toggles [hidden] on the matching panels, so
 *   the authored selected/hidden props stay the initial state and the
 *   design-system Tabs components stay bare.
 *
 * Because connections live on the nodes themselves, deleting a trigger
 * removes only that trigger's wiring, and re-connecting a new trigger is a
 * single attribute.
 */

export const PROTOTYPE_CLICK_ATTRIBUTE = 'data-wb-proto-click';
export const PROTOTYPE_NAME_ATTRIBUTE = 'data-wb-proto-name';
export const PROTOTYPE_INITIAL_ATTRIBUTE = 'data-wb-proto-initial';
export const PROTOTYPE_TAB_ATTRIBUTE = 'data-wb-proto-tab';
export const PROTOTYPE_PANEL_ATTRIBUTE = 'data-wb-proto-panel';
const PROTOTYPE_INITIAL_APPLIED_ATTRIBUTE = 'data-wb-proto-initial-applied';

export type PrototypeClickAction = 'dialog-open' | 'dialog-close' | 'dialog-toggle' | 'tab-select';

export type PrototypeClickCommand = {
  action: PrototypeClickAction;
  target: string;
};

export function parsePrototypeClickCommand(value: string | null): PrototypeClickCommand | null {
  if (!value) return null;
  const separator = value.indexOf(':');
  if (separator <= 0) return null;
  const action = value.slice(0, separator).trim();
  const target = value.slice(separator + 1).trim();
  if (!target) return null;
  if (action !== 'dialog-open' && action !== 'dialog-close' && action !== 'dialog-toggle' && action !== 'tab-select') return null;
  return { action, target };
}

function escapePrototypeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function resolvePrototypeDialog(host: Element | null): HTMLDialogElement | null {
  if (!host) return null;
  if (host instanceof HTMLDialogElement) return host;
  return host.querySelector('dialog');
}

function findPrototypeDialog(root: Document, target: string): HTMLDialogElement | null {
  const host = root.querySelector(`[${PROTOTYPE_NAME_ATTRIBUTE}="${escapePrototypeSelectorValue(target)}"]`);
  return resolvePrototypeDialog(host);
}

export function applyPrototypeClickCommand(dialog: HTMLDialogElement, action: PrototypeClickAction): void {
  // showModal() puts the dialog in the top layer so the browser paints the
  // ::backdrop dim — the component's own React-rendered backdrop only shows
  // for the prop-driven open path. close() fires the native close event,
  // which the Dialog component already mirrors into its local closed state.
  if (action === 'dialog-close' || (action === 'dialog-toggle' && dialog.open)) {
    if (dialog.open) dialog.close();
    return;
  }
  if (!dialog.open) dialog.showModal();
}

function applyPrototypeTabSelect(root: Document, target: string): void {
  const separator = target.lastIndexOf('/');
  if (separator <= 0) return;
  const groupPrefix = target.slice(0, separator + 1);
  root.querySelectorAll(`[${PROTOTYPE_TAB_ATTRIBUTE}]`).forEach((tab) => {
    const name = tab.getAttribute(PROTOTYPE_TAB_ATTRIBUTE) ?? '';
    if (!name.startsWith(groupPrefix)) return;
    const selected = name === target;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    if (tab instanceof HTMLElement) tab.tabIndex = selected ? 0 : -1;
  });
  root.querySelectorAll(`[${PROTOTYPE_PANEL_ATTRIBUTE}]`).forEach((panel) => {
    const name = panel.getAttribute(PROTOTYPE_PANEL_ATTRIBUTE) ?? '';
    if (!name.startsWith(groupPrefix)) return;
    if (name === target) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
  });
}

function applyPrototypeInitialStates(root: Document): void {
  root.querySelectorAll(`[${PROTOTYPE_INITIAL_ATTRIBUTE}="closed"]`).forEach((host) => {
    if (host.getAttribute(PROTOTYPE_INITIAL_APPLIED_ATTRIBUTE) === 'true') return;
    const dialog = resolvePrototypeDialog(host);
    if (!dialog) return;
    host.setAttribute(PROTOTYPE_INITIAL_APPLIED_ATTRIBUTE, 'true');
    if (dialog.open) dialog.close();
  });
}

/**
 * Install the prototype runtime on a preview document. Returns a cleanup
 * function. Mount-order safe: initial dialog states are applied as the
 * matching nodes appear in the DOM.
 */
export function installPrototypeInteractions(root: Document): () => void {
  const onClick = (event: MouseEvent) => {
    const origin = event.target instanceof Element ? event.target : null;
    const trigger = origin?.closest(`[${PROTOTYPE_CLICK_ATTRIBUTE}]`) ?? null;
    if (!trigger) return;
    const command = parsePrototypeClickCommand(trigger.getAttribute(PROTOTYPE_CLICK_ATTRIBUTE));
    if (!command) return;
    if (command.action === 'tab-select') {
      applyPrototypeTabSelect(root, command.target);
      return;
    }
    const dialog = findPrototypeDialog(root, command.target);
    if (!dialog) return;
    applyPrototypeClickCommand(dialog, command.action);
  };

  const observer = new MutationObserver(() => applyPrototypeInitialStates(root));
  observer.observe(root.documentElement, { childList: true, subtree: true });
  applyPrototypeInitialStates(root);
  root.addEventListener('click', onClick);

  return () => {
    observer.disconnect();
    root.removeEventListener('click', onClick);
  };
}
