# WORKBENCH-V1 Boundary Rules

This document is the working rule set for avoiding repeated boundary resets.
When a future implementation is uncertain, decide by these rules before adding local UI logic.

## 1. Source of Truth

- Project files in `.workbench/` are persisted project data.
- Generated project source such as `src/workbench-tokens.css` must also live inside the active project root, derived from `.workbench/` state rather than shared from the Workbench app root.
- UI state may read persisted project data, but must not silently redefine its schema.
- Derived state is disposable. If it cannot be restored from persisted project data plus the current session, it is not a source of truth.
- Feature caches are allowed only for derived data and must carry an explicit cache policy.
- Derived caches must be discarded after canonical edits unless they are revision-scoped to an owner/source/revision fingerprint.
- A cache key must never become identity, provenance, selection, binding, token reference, or persistence truth.
- If a cached value cannot prove it was produced from the current canonical revision, it must be treated as polluted and recomputed.

## 2. Token Domain

- Token lifecycle decisions live in `src/domain/design-system/tokens/*`.
- Token UI components render state and dispatch commands.
- Token Editor owns collection/group availability through `fieldScopes`.
- Inspector owns actual node-field token bindings.
- Token refs are always `collectionId + tokenId`; never use `tokenId` alone for lookup, cleanup, cycle checks, picker exclusion, or impact checks.
- Reference scanning, rewriting, and path checks must go through `referenceGraph.ts`.
- Usage/impact UI must ask `TokenUsageIndex` or a domain impact helper. Panels must not recompute dependency graphs.
- Formula values are compatibility-only unless a new product decision explicitly reintroduces formula authoring.

## 3. Command Boundary

- UI event handlers may gather the current visible selection and open local popovers/modals.
- UI event handlers must not decide mutation cleanup, reference retargeting, field-scope cleanup, or persistence routing.
- Mutations go through command hooks such as `useTokenCommands`, then domain operations.
- Destructive actions use named Workbench UI components, not browser-native `window.confirm`.

## 3.1 Edit Lifecycle

- Editing means the full authoring lifecycle, not just changing a currently visible field.
- Treat write, erase, modify, copy, paste, cut, duplicate, move, reorder, save, navigation away/back, undo, redo, import, delete-after-import, re-import, and recreating the same content as first-class lifecycle cases.
- `docs/WORKBENCH-V1-EDIT-OPERATIONS.md` is the canonical contract for edit operation semantics.
- Every product mutation must become a canonical edit operation before it mutates state.
- Save is a persistence boundary, not a substitute for an edit operation.
- Navigation and beforeunload must flush the current working value through the same save-flush path used by manual save and autosave.
- Undo / redo must restore the user's editing reality: canonical state, meaningful selection, and scope. Renderer payloads and expanded trees are regenerated after restore.
- Source-backed Design Editor undo / redo belongs to the active page/component source history lane. Inspector input focus must not create a separate native-input-only history path when the source lane can undo or redo.
- Copy does not mutate canonical state. Paste and duplicate do, and they must define identity remapping and reference validation.
- Delete must record enough before state in history to support restore and enough cleanup information to avoid stale refs, bindings, overrides, or imports.
- Import and re-import must define provenance and identity policy instead of guessing from current visual similarity.
- Panels, Inspector controls, preview interactions, and keyboard shortcuts may collect intent, but they must not fork lifecycle semantics locally.
- `src/domain/editing/editOperationPipeline.ts` owns the current pipeline scaffold for commit metadata and derived-cache policy.
- `src/domain/editing/editOperationTypes.ts` owns lifecycle metadata types such as intent, target, identity effect, provenance, projection invalidation, cleanup, persistence, and cache policy.
- `src/domain/editing/editFlushOperations.ts` owns save/autosave/beforeunload/navigation flush semantics as persistence boundaries, not undoable edits.
- `src/domain/editing/projectAssetHistory.ts` owns page/component source-file lane mapping. Inspector and Design Editor should use this adapter instead of inventing page/component history owners locally.
- `src/domain/inspector/inspectorEditService.ts` owns Inspector edit validation and operation metadata. Inspector UI components should call this service or a command hook that wraps it, not mutate design state directly.

## 4. Selection Scope

- Selection scope is a domain result, not a breadcrumb convention.
- Page/component source target selection must be persisted as `WorkbenchSelectionState.activeTarget`, not hidden in Design Editor local state.
- Design Editor target rows may dispatch the selection intent, but `ProjectWorkspace` or the session boundary owns persisting the next selection state.
- If the same page/component source target appears in more than one UI surface, for example sidebar Source rows and preview-area tabs, every surface must dispatch the same source-target selection intent and derive active state from `WorkbenchSelectionState.activeTarget`.
- Preview source tabs represent open editor targets, not project existence. Closing a preview tab must only remove that tab from the workspace session tab strip; it must not delete, detach, or unregister the page/component. Sidebar Source rows can reopen closed targets. The open-tab strip is persisted in `WorkbenchSelectionState.extensions` because it is user-visible workspace state, but it remains separate from the page/component registry.
- Preview token mode choices are also workspace session state. Persist collection-to-mode selections in `WorkbenchSelectionState.extensions`; do not keep them as Design Editor memory state that resets on refresh.
- Preview appearance is also workspace session state, but it is not a token mode. `system`, `light`, and `dark` describe rendering media; token modes describe per-collection design values. `system` must derive effective light/dark token modes at render time from `prefers-color-scheme` without overwriting the saved token mode selection.
- Panel widths, sidebar split heights, and selected design layer id are workspace session state. Persist them in `WorkbenchSelectionState.extensions`; do not keep resize/selection results as hook-local defaults that reset on refresh.
- The scope resolver must answer:
  - effective root
  - selected node
  - hovered node
  - owner instance
  - instance chain
  - source edit permission
  - instance edit permission
  - save target
- Inspector, Preview, and Renderer projection consume the resolved scope. They do not reinterpret raw drill paths independently.

## 5. Preview Projection

- Editor state is not renderer payload.
- `PreviewProjectionService` converts canonical state and resolved selection scope into renderer-ready data.
- Renderer payload assembly must not live in panels.
- Placeholder projection may exist only as a typed scaffold; it must not become product behavior.
- Layer panels represent the current preview/edit tree, not component library variants. Component variants belong to component-library or variant controls; layers should show rendered/editable nodes such as frame, instance, text, and child elements.
- The Preview surface is not a node-tree debugger. It should render the current editable result as a visual canvas; structural lists and hierarchy expansion belong in Layers.
- Source-derived layer names must preserve source facts. Do not relabel tags with product-friendly aliases such as `Page frame`; use the actual JSX tag, component name, text content, explicit source name metadata, or a clearly marked unsupported-expression placeholder.
- Preview layer derivation must live in a domain/service helper such as `previewLayerService`, not as an ad hoc map over component assets inside a panel.
- `EditableTreeNode` is the input boundary for layer derivation. Component/library asset data may identify the source of an inspectable node, but assets must not be treated as layers.
- Source-file parsing for design foundation must fail loudly. If `sourceFile` contents cannot produce a conservative `EditableDocumentTree`, the UI must show a source diagnostic and fall back to the preview scaffold rather than showing a misleading empty or stale layer tree.
- AST parsing may keep unsupported JSX expressions as visible placeholders only when the source diagnostic says so. Dropping expressions silently is not allowed.
- Editable nodes parsed from source should keep `source.sourceFile` and `sourceLocation` metadata so future edit/writeback work can route changes to a concrete source range instead of guessing from labels or indices.
- Source writeback must re-parse the current file and match the target by source range before changing text. A stale or missing range must fail with a diagnostic, not fall back to label/index matching.
- Domain writeback helpers may return `nextContents` and an edit operation descriptor, but must not directly persist files. File persistence remains an application boundary so save/undo/navigation semantics can stay centralized.
- Source-backed edits must commit into a page/component source history lane before save flush. The saved file contents should come from that lane's current value, not from a stale parser result or preview projection.
- Source save flush planning must not mark the source lane saved. A dirty source lane can be marked saved only after the application persistence boundary confirms the source file write succeeded.
- If source file writing fails, return a diagnostic, keep the lane dirty, and do not upsert a saved history lane. Do not hide the failure behind fallback preview state.
- After source file writing succeeds, persist `lastFlush` metadata without creating a new undo transaction.
- Source-backed Inspector controls must call the source Inspector orchestration boundary. They must not locally sequence writeback, file writing, timeline append, and history save in component code.
- Source no-op edits must not rewrite files or persist duplicate history metadata.
- Source history restore must reparse canonical TSX before refreshing layers, preview, or Inspector. A restored editable tree is derived state, not stored truth.

## 6. Inspector

- Inspector components issue edit intents.
- Inspector does not own persistence paths.
- Inspector field controls may hold local input draft state, but commit must go through an Inspector domain command and then `EditOperationPipeline`.
- Field compatibility belongs in domain helpers, not select-option filtering inside the panel.
- Token binding edits are explicit edit operations, not side effects of token picker UI.
- Field compatibility is type-aware and must use token-domain compatibility helpers.
- Token binding identity is collection-scoped. Inspector/source/preview code must carry `{ collectionId, tokenId }`; bare token ids are legacy compatibility data only.
- Inspector token bindings must read from the real `TokenRegistry`, field scopes, and token-domain resolver. Do not read binding options from `src/domain/design-system/designSystemStore.ts` or any in-memory scaffold token list.
- Inspector token picker filtering is a persisted workspace preference and a refinement over Token Editor field scopes. Keep collection/group filters behind compact picker settings, not as always-visible controls.
- Scaffold labels such as `Action Primary` are invalid in product Inspector UI because they are not real project tokens.
- Token binding, direct design value editing, and variant selection are separate edit concepts:
  - Token binding changes which real token a selected field references.
  - Direct design value editing changes the selected field's authored value.
  - Variant selection changes a component instance's variant-axis contract.
- A source-backed Inspector field should not show variant UI unless the selected node is a component instance with connected component-set and variant-axis metadata.
- A variant label in a scaffold asset is not evidence that variant selection has been implemented.
- Inspector controls must not fail silently. If the current layer cannot be inspected, no compatible token exists, or a persisted binding is incompatible, surface the reason in the Inspector lifecycle/diagnostic area.
- Inspector source inputs may own draft focus behavior, but document history shortcuts must route to the source history lane when available. Do not rely on browser-native input undo for source-backed fields.
- Do not port an earlier Inspector section structure wholesale.
- Inspector UI should be built from reusable field primitives and schema-driven field groups.
- Inspector field rows, sections, token summaries, and control rows must use intent-level inspector primitives such as `WorkbenchInspectorField`, `WorkbenchInspectorSection`, and `WorkbenchInspectorTokenSummary`. Do not assemble label/value/control rows directly inside product panels.
- A new Inspector control should first answer:
  - which domain field it edits
  - which value type it accepts
  - which token types are compatible
  - which edit intent it emits
  - which selection/save target it requires
- Avoid one-off Inspector controls that combine label, input, token binding, reset state, and persistence in one component.
- Prefer compact reusable rows, segmented controls, token-aware value fields, and popover editors that can be reused across layout, typography, color, radius, spacing, and future component prop editing.
- Inspector sections should describe reusable editing concepts, not mirror earlier panel categories by default.

## 7. Component / Instance

- Component source and instance usage are separate concepts.
- Expanded instance trees are derived for preview and selection.
- Persisted instance state is canonical for instance edits.
- Instance editing decisions belong in an instance edit service, not Inspector or Preview components.

## 8. UI Composition

- Workbench exists to prevent arbitrary design-system drift. UI must be assembled from approved Workbench components and token contracts, not ad hoc DOM and local styling.
- Design-system compliance is a product requirement, not polish. Any new UI that bypasses shared components or tokens is a regression unless it is a deliberately documented low-level primitive.
- Component boundaries are based on user intent, not visual shape. Name and design components around what the user is trying to do, for example search/filter results, choose a token, edit a numeric value, configure field availability, resize a panel, or inspect a selection.
- Visual anatomy such as an icon on the left, action on the right, badge, handle, or status mark should be modeled as slots or variants inside the intent component. Do not create a new wrapper only because the shape looks slightly different.
- Prefer shared primitives and named components over inline panel markup.
- Repeated controls should be variants of the same component, not copied markup.
- Product decisions stay in domain services or command hooks; components own presentation and local interaction state.
- Every new UI surface should be componentized when it can plausibly recur.
- Small differences in the same pattern should be represented as variants, props, or shared style states, not duplicate components.
- Do not create one-off panel markup for rows, field controls, popovers, menus, sidebars, value chips, directional controls, or inspector sections.
- If a UI pattern needs a second copy, stop and extract the first copy before adding the second.
- Shared primitives should remain low-level. Product-specific reusable controls should live as named feature components with clear domain-neutral props.
- `TextField` owns optional leading/trailing slots for input chrome. Intent-specific inputs such as `SearchField` should compose that primitive instead of introducing per-screen wrappers like toolbar-only search shells.
- Search-like controls represent the intent "enter a query and inspect the resulting set." Use `SearchField` for that intent even if the visual treatment changes between toolbar, picker, panel, or modal contexts.
- Inspector directional controls must be reusable component families, for example spacing-edge, radius-corner, and border-side variants built on one shared directional value primitive.
- App shell owns major resizable panel widths, including the left navigation panel and Inspector panel. Individual editors consume those widths and must not keep competing width state.
- Sidebar-internal vertical splits, such as Token Editor Collections/Groups and Design Editor Source/Layers, must use the shared sidebar split layout hook and split handle primitive. Do not implement per-editor pointer math or custom separator markup.
- Token Editor, Design Editor, and future editors must share the editor shell primitives for frame, panel, work surface, toolbar, sidebar rows, and resize handles instead of rebuilding their own panel chrome.
- Top editor chrome rows must use `WorkbenchEditorChromeHeader` or a component composed from it. The preview target-tabs row is the density baseline, but the shared height must still leave breathing room for 30px toolbar controls, sidebar surface navigation, inspector headers, and future comparable editor headers.
- Editor target tabs should stay compact. Put the close affordance before the editable title and omit decorative file/kind icons; file paths, kind labels, and other metadata belong in tooltips, inspector details, or the surrounding toolbar.
- Layout chrome is a component boundary. Do not hand-code `aside`, `main`, toolbar, panel wrappers, or frame grid markup inside each editor unless a reusable shell primitive cannot express the layout.
- Inline style is allowed only inside the shared component that owns a measured runtime value, such as resizable panel width or popover position. Feature screens should pass semantic props, not CSS variables or style objects.
- Local style overrides may handle unavoidable layout measurement only. Local design-property overrides such as alternate backgrounds, borders, radii, shadows, typography, or control colors require user-visible approval first; otherwise fix the shared component or token.

## 9. Layout Usage Guide

- Layout choices must follow structure and intent, not the current number of visible children. A row that means "left content plus right actions" should render explicit left/right groups and use flex distribution, even when each side currently has only one child.
- Use wrapper elements intentionally. If a group of controls belongs together semantically, wrap it once as a named left, center, right, main, actions, leading, trailing, header, body, or footer region instead of making the parent count every individual child.
- Use flex for one-dimensional distribution, especially rows with leading content and trailing actions, toolbar clusters, button groups, inline metadata, and panel headers.
- Use grid for fixed layout tracks, two-dimensional alignment, shell frames, resizable panel templates, tables expressed as non-table layout, and controls where each track has a stable meaning.
- Use actual table structure for dense tabular token data when row/column semantics matter. Table cells should not own surface background unless the table component explicitly defines that state.
- The parent layout owns available space. For surfaces with toolbar, fixed utility row, and scrollable body, define rows as `auto fixed minmax(0, 1fr)` at the parent, not by giving the middle child a height hack.
- Fixed-height utility rows should be fixed by the parent track or component variable. The row component can fill that track, but should not accidentally take the remaining `1fr` space.
- A child component may request internal alignment, but it should not redefine the app shell, panel width, or neighboring region allocation.
- Prefer named layout primitives and variants over one-off CSS selectors. If a layout pattern repeats, extract a component or add a variant before adding another selector.
- Do not use later CSS rules to hide layout mistakes. If a row expands, a handle doubles in thickness, a panel surface differs, or a cell background appears forced, fix the owning layout/component boundary.
- Design properties and layout properties must be separated. Layout CSS may define display, track sizing, overflow, flex behavior, and measured dimensions. Visual tone such as background, border, radius, shadow, typography, and color should come from shared components or tokens.
- When adding a new element to an existing row, first decide which existing group it belongs to. If no group exists, introduce the group before adding the element.

## 10. Verification

For token domain or token editor boundary work, run:

```bash
npm run workbench:check-tokens
npm run check
npm run build
npm run workbench:check-config
```

For design editor foundation work, run:

```bash
npm run workbench:check-design
npm run check
npm run build
npm run workbench:check-config
```

For UI behavior changes, verify in the in-app browser on the actual Vite port and check console errors.

Do not commit `.workbench/selection.json` or `.workbench/tokens.json` drift from browser verification unless the user intentionally changed project data.
