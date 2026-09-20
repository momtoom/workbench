# WORKBENCH-V1 Token Editor Architecture

This document records the current V1 token-editor rules so future Codex sessions do not rediscover the same fixes.

## Inherited Behavior Inventory

Treat the earlier implementation as behavior evidence, not implementation source and not product authority. V1 product direction and domain architecture override it whenever they conflict.

The V1 token editor must evaluate these inherited behaviors and either preserve, redesign, or intentionally discard them:

- collections, modes, groups, and dense token rows
- raw / ref values in the product UI
- cross-collection references
- recursive resolving with cycle safety
- gradient tokens as first-class values
- gradient stop refs and mesh background refs
- type-aware token picker filtering
- collection / group / token CRUD with undo/redo
- deletion cleanup for refs and field scopes
- local persistence and reload-safe history

## Current V1 Boundaries

Token editor work should keep moving decisions out of `WorkbenchShell.tsx`.

The general boundary rulebook is `docs/WORKBENCH-V1-BOUNDARY-RULES.md`.
If a future task is unclear, apply that document before adding panel-local branching.

The general edit lifecycle contract is `docs/WORKBENCH-V1-EDIT-OPERATIONS.md`.
Token Editor history, undo/redo, autosave, reload-safe persistence, duplicate, delete, import normalization, and reference cleanup should be treated as one authoring lifecycle, not as isolated button handlers.
The token-specific history lane is useful evidence for the future shared `EditOperationPipeline`, but it should not remain the only surface with lifecycle semantics.

Current code connection:

- `src/domain/editing/editOperationTypes.ts`
  Owns shared lifecycle metadata types.
- `src/domain/editing/editOperationPipeline.ts`
  Owns the current commit pipeline scaffold and derived-cache freshness helpers.
- `src/features/workbench-shell/ui/useTokenEditorHistory.ts`
  Routes token commits through `commitEditOperation` before history persistence/autosave.
- `src/domain/editing/editFlushOperations.ts`
  Records token manual save, autosave, and beforeunload flush as persistence boundary metadata on the token lane.
- Token command hooks should pass semantic metadata when the user action is more specific than a generic patch, for example duplicate, paste, move, reorder, delete, import, and value write.

## Explicit Unit Token Model

The earlier implementation kept token types very simple largely because it followed Figma's variable conventions. That was useful for prototyping, but Workbench V1 produces code and must represent CSS units honestly.

V1 should not rely on automatic px/unit attachment or string value inspection as the primary authoring model. Those shortcuts caused ambiguity there, especially when the same number-like token could be routed to spacing, border width, font weight, or typography contexts.

In V1, users should explicitly choose unit-bearing token types and units when authoring values:

- `dimension` for CSS length/size values such as px, rem, em, %, vh, and vw
- `duration` for ms/s timing values
- `angle` for deg/rad/turn values
- `opacity` for percent or normalized opacity values
- `number` for intentionally unitless numeric values such as font weight

Compatibility and CSS export should follow the explicit token type and unit, not infer hidden units from plain numbers.

## Token Collection Layering

Workbench token data should preserve token identity across layers instead of
flattening every role into one collection. For starter projects and bundled
component sets, use this layer model:

- Primitive layer: raw material values such as palette colors, base radii, and
  base shadows.
- Semantic layer: role tokens such as action, surface, text, border, radius, or
  elevation roles.
- Component layer: component-scoped values consumed by CSS, such as button
  heights, slider thumb size, or table cell padding.

Token references should normally flow in one direction:

```text
component token -> semantic role token -> primitive raw token
```

For Workbench starter projects, primitive and component tokens must live in
separate collections. Use groups inside each collection for sub-structure.
Semantic tokens should be split into role-based collections, for example:

- `tailwind-primitives` for raw Tailwind scale values such as palette,
  spacing, size, radius, shadow, and type scale material.
- `workbench-components` for component-scoped tokens.
- `workbench-semantic-color` for surface, border, action, feedback, and text
  color roles.
- `workbench-semantic-radius` for radius roles.
- `workbench-semantic-effect` for shadow, elevation, and other effect roles.
- `workbench-semantic-typography` for type size, weight, and line-height roles.

Semantic collections are alias/reference collections. They should not own raw
values when an equivalent primitive can exist. Put raw values in
`tailwind-primitives`; semantic tokens reference primitives; component tokens
reference semantic roles. Semantic collections should carry modes when the role
can vary by theme or density. In the starter set, color uses `Light` / `Dark`
modes, effect uses `Light` / `Dark` modes, and radius/typography use
`Base` / `Compact` modes.

Preview appearance is not a token collection and must not be modeled as one.
Token modes are per-collection design selections; preview appearance is the
rendering media state. `System` resolves effective light/dark collection modes
from `prefers-color-scheme` at render time only, without rewriting token values
or mutating the user's saved preview mode selection. Explicit light/dark
preview appearance may synchronize only collections whose mode id or name is
exactly light/dark; theme names and density modes remain their own modes.

Required starter token contract:

- `tailwind-primitives` may contain raw Tailwind scale values.
- `workbench-components` may contain raw component dimensions when those values
  are truly component-owned, but color, radius, effect, and typography roles
  should reference semantic collections.
- `workbench-semantic-*` collections must contain reference values only.
- `workbench-semantic-*` collections must have mode ids that describe the role
  switch, such as `light` / `dark` or `base` / `compact`.
- Typography is not optional. A starter component set needs primitive
  typography values, semantic typography roles, and component typography tokens.
- Text color belongs to semantic color, not semantic typography. Component CSS
  should consume explicit component text-color tokens, not generic foreground
  aliases.
- CSS export should preserve the chain with CSS variables where possible:

```text
--ds-token-workbench-components-font-size-md
  -> --ds-token-workbench-semantic-typography-text-md-size
  -> --ds-token-tailwind-primitives-font-size-md
```

For Astryx-backed token consumers, follow Astryx's official integration
guidance and choose the narrowest path:

| Path | Use when | Value shape |
| --- | --- | --- |
| CSS variable aliases | The library ultimately writes CSS and accepts string values | `var(--color-text-primary)` |
| StyleX token imports | You are writing StyleX styles in application code | `colorVars['--color-text-primary']` |
| Tailwind bridge | You want utility classes backed by active system tokens | `@astryxdesign/core/tailwind-theme.css` |
| Token resolver APIs | JavaScript needs token values for charts, canvas, SVG, or config objects | `resolveThemeToken(theme, '--color-data-categorical-blue', { mode })` |

Use resolver APIs only when CSS custom properties cannot be passed through to
the consumer. Ordinary DOM styling, component stylesheets, and utility bridge
CSS should preserve live mode switching through CSS variables.

Treat these as invalid starter-token structures:

- A semantic token whose value is `{ "kind": "raw" }`.
- A semantic collection with only a single default mode when the role can vary by
  theme or density.
- A component stylesheet using `--ds-token-tailwind-primitives-*` directly for a
  reusable visual value.
- Component typography expressed as anonymous CSS numbers instead of
  component/semantic/primitive token layers.
- A new visual component whose reusable colors, radii, spacing, dimensions,
  shadows, or typography are present only as local CSS values and never added to
  the component token collection.

This split keeps Token Editor collection navigation useful: users can edit
primitive material values, semantic color roles, and component dimensions
without scanning unrelated token rows. Component authors can still find every
component-owned value in the component collection. Do not collapse primitives or
semantic roles back into the component collection simply because the CSS
variable would still resolve.

Current ownership:

- `src/domain/design-system/tokens/metadata.ts`
  Owns token type labels and ordered token type metadata used by controls and filters.
- `src/domain/design-system/tokens/fieldScopes.ts`
  Owns inspector field scope definitions, collection/group scope lookup, and explicit scope mutation.
- `src/domain/design-system/tokens/referenceGraph.ts`
  Owns token reference identity, ref collection, ref mapping, and path reachability. Formula reference support remains compatibility-only for older or imported data.
- `src/domain/design-system/tokens/valueRules.ts`
  Owns formula-compatible token type rules and formula unit lists for compatibility-only resolution paths.
- `src/domain/design-system/tokens/usageIndex.ts`
  Owns `TokenUsageIndex` construction for value refs and field-scope usages.
- `src/domain/design-system/tokens/operations.ts`
  Owns collection/group/token/mode mutation and reference/field-scope cleanup.
- `src/features/workbench-shell/ui/useTokenEditorActions.ts`
  Composes command hooks and exposes UI intents to the editor.
- `src/features/workbench-shell/ui/useTokenCollectionCommands.ts`
  Owns collection-level UI commands.
- `src/features/workbench-shell/ui/useTokenGroupCommands.ts`
  Owns group-level UI commands.
- `src/features/workbench-shell/ui/useTokenModeCommands.ts`
  Owns mode-level UI commands.
- `src/features/workbench-shell/ui/useTokenCommands.ts`
  Owns token-level UI commands.
- `src/features/workbench-shell/ui/useTokenScopeCommands.ts`
  Owns field-scope UI commands.
- `src/features/workbench-shell/ui/useTokenValueDraft.ts`
  Owns token value draft lifecycle, value-kind switching, and gradient modal commit/cancel state.
- `src/features/workbench-shell/ui/TokenEditor.tsx`
  Owns token editor composition and state wiring.
- `src/features/workbench-shell/ui/TokenEditorSidebar.tsx`
  Owns collection/group navigation presentation.
- `src/features/workbench-shell/ui/TokenEditorToolbar.tsx`
  Owns search, type filter, undo/redo, and save controls.
- `src/features/workbench-shell/ui/TokenScopeControls.tsx`
  Owns field-scope summary and settings modal.
- `src/features/workbench-shell/ui/TokenTable.tsx`
  Owns token table composition.
- `src/features/workbench-shell/ui/TokenTableStructure.tsx`
  Owns table group/mode/header structure.
- `src/features/workbench-shell/ui/TokenNameLayout.tsx`
  Owns shared row leading alignment for group rows, grouped tokens, and ungrouped tokens.
- `src/features/workbench-shell/ui/TokenRowActions.tsx`
  Owns row duplicate/delete/settings actions.
- `src/features/workbench-shell/ui/RowOverlayActions.tsx`
  Owns shared floating row action chrome.
- `src/features/workbench-shell/ui/TokenValueEditor.tsx`
  Owns token table value cells, Raw / Ref editor rendering, and value commit wiring.
- `src/features/workbench-shell/ui/TokenValueEditControls.tsx`
  Owns shared value-kind controls.
- `src/features/workbench-shell/ui/TokenRawValueEditor.tsx`
  Owns raw token value controls.
- `src/features/workbench-shell/ui/TokenReferenceValueEditor.tsx`
  Owns ref token value controls.
- `src/features/workbench-shell/ui/TokenInlineValueEditor.tsx`
  Owns inline editor shell for token value editing.
- `src/features/workbench-shell/ui/GradientTokenEditor.tsx`
  Owns the gradient modal and high-level gradient editing flow.
- `src/features/workbench-shell/ui/GradientStopRows.tsx`
  Owns gradient stop and mesh background rows.
- `src/features/workbench-shell/ui/gradientEditorGeometry.ts`
  Owns gradient pointer geometry.
- `src/features/workbench-shell/ui/InlineEditControls.tsx`
  Owns shared inline editing chrome used by token names and token values.
- `src/features/workbench-shell/ui/TokenVisuals.tsx`
  Owns token swatches, type icons, and token/gradient display labels.
- `src/features/workbench-shell/ui/TokenValuePrimitives.tsx`
  Owns small shared value editor primitives such as value chips and Raw / Ref selection.
- `src/features/workbench-shell/ui/TokenPicker.tsx`
  Owns token picker composition.
- `src/features/workbench-shell/ui/TokenPickerParts.tsx`
  Owns token picker filters and result presentation.
- `src/features/workbench-shell/ui/useTokenPickerController.ts`
  Owns token picker filtering and selection behavior.
- `src/features/workbench-shell/ui/WorkbenchShell.tsx`
  Should stay shell-level composition. It should not regain token presentation, domain mutation, or cleanup decisions.

## UI Composition Rules

- Workbench's own UI must model the product goal: AI and contributors should be constrained to defined components and token contracts instead of inventing local UI.
- Reuse existing shared UI primitives for buttons, icon buttons, selects, and text inputs.
- Add new UI as named components instead of inline panel markup.
- Treat repeated visual patterns as component variants. Do not fork near-identical markup for each case.
- Component design starts from intent, not shape. Token UI should use components named for what the user is doing, such as searching result sets, choosing token references, editing values, changing scope availability, resizing panels, or opening row actions.
- Input chrome with optional leading or trailing elements belongs to shared input primitives and their intent-specific variants. Use `SearchField` for query-to-results behavior; do not reintroduce toolbar-only search wrappers or ad hoc input containers.
- Keep `WorkbenchShell.tsx` as composition glue; it can pass data and action objects, but should not own new presentation details.
- Be persistent about componentization. If a UI pattern can plausibly recur, such as a row, leading layout, popover, menu, settings field, value chip, editor shell, sidebar item, or modal body, make it a named component and reuse it.
- Componentization should reduce branching and duplicated CSS. Prefer a shared component plus variant props/classes over condition-heavy local markup.
- Treat editor layout chrome as reusable UI, not per-editor scaffolding. Frames, panels, work surfaces, toolbar rows, resize handles, and sidebar rows should come from Workbench shell primitives.
- Feature screens should pass semantic component props. Do not pass inline CSS or CSS variable overrides from editor screens when a shared component can own that measured or variant-driven styling.
- Fix root causes in the shared component when two token/editor surfaces diverge. Do not add a later CSS override to hide a mismatch.
- Apply the layout usage guide in `docs/WORKBENCH-V1-BOUNDARY-RULES.md` before adding token UI layout. In practice:
  - token editor surfaces should allocate `toolbar / utility row / table body` at the parent level
  - utility rows such as field-scope availability should use left and right groups, not child-count-driven grid columns
  - token rows should keep leading alignment in `TokenNameLayout`
  - row actions should remain a trailing action group
  - table cell backgrounds should stay transparent unless the token table component owns a deliberate row state
- Do not hide product decisions inside presentation components. Keep mutation, cleanup, compatibility, and scope decisions in domain services or command hooks.
- Keep row-leading layout centralized in `TokenNameLayout.tsx`. Do not reintroduce separate left padding or handle spacing for grouped and ungrouped rows.
- Keep menu/popover/dialog surfaces visually aligned. Prefer shared primitives and existing overlay components before adding one-off CSS.
- Avoid non-header bold text. Header labels may use weight; row content, group names, mode names, and value previews should stay regular unless there is a specific semantic reason.
- Do not show long field-scope pill strips in the main editor. Use link icon + blue field names + settings button, with detailed scope editing in the settings modal.

## Token Metadata Rules

`DesignToken.description` is optional user-authored metadata. The earlier implementation did not provide this as a useful baseline, so V1 owns the behavior directly.

- Description editing lives in `TokenRowActions` inside the row more popover.
- The description field is a multiline textarea shown by default when the popover opens, not hidden behind a secondary "add" action.
- Description mutations go through `updateTokenDescription` and `useTokenCommands.updateDesignTokenDescription`.
- Description edits commit as `Update token description` patch history entries.
- Token filtering includes descriptions through `useTokenEditorFilters`.

## Field Scope Rules

Field scopes are explicit inspector availability settings, not automatic placement logic and not actual inspector bindings.

Rules:

- Collection scopes define which inspector fields a collection may appear in as a token option.
- Group scopes are dependent on the collection scope and must not expose fields outside the parent collection scope.
- Group-specific scopes narrow or specialize the collection-level scope.
- If a group has no scoped fields, the UI should say that honestly instead of inferring fields from token values.
- Token Editor owns broad collection/group exposure.
- Inspector can later own specific component-field binding choices inside the exposed collection/group field set.
- Actual token binding should be authored in Inspector, where the user is looking at a selected node and field.
- Avoid condition-heavy automatic filtering beyond explicit scope and type compatibility checks.

## Reference Rules

Never track a token ref by `tokenId` alone.

Use:

```text
collectionId + tokenId
collectionId + tokenId + modeId
```

Rules:

- Resolver cycle keys must include collection and mode.
- Cycle/path checks must use a visited set.
- Any code that scans or rewrites token refs must use `referenceGraph.ts`.
- Gradient reference handling must include both stop colors and `meshBackgroundColor`.
- Formula refs are not exposed in the product UI. Existing formula data should still be parsed and rewritten through the same reference graph path for compatibility.

## Cleanup Rules

Deletion and duplication cleanup must stay domain-owned.

- Deleting a token clears dependent token values that reference that token.
- Deleting a collection clears dependent token values and collection-level field scopes for that collection.
- Deleting a group clears field scopes for that group and child groups, but keeps collection-level field scopes.
- Deleting a token must not remove collection-level field scopes.
- Duplicating a group retargets refs among copied tokens.
- Duplicating a collection retargets self-contained refs to the new collection, including compatibility-only formulas and mesh background refs.

## Reorder Rules

The earlier implementation only proved token-row reordering through `sortOrder`; it did not settle collection, group, or mode ordering. V1 treats those as explicit authoring operations instead of borrowing that behavior:

- Collection order is the `registry.collections` array order.
- Group order is the collection `groups` array order.
- Mode column order is the collection `modes` array order.
- Reorder commands should commit as `kind: 'reorder'` so undo/redo and persisted history can describe the operation honestly.
- Token row reordering still uses `sortOrder`, because token positions need to survive group moves and filtered table views.

## Usage Index Rules

Before adding token impact UI or field-scope cleanup logic, build from `TokenUsageIndex`.

The index currently tracks:

- token value references by target token
- source usages from registered component source files by target token
- token field scopes by collection
- token field scopes by collection/group
- field scopes that apply to a token's collection/group position

Future impact surfaces should ask the index which refs and field scopes will be affected instead of recomputing this in panels.

The previous inline `TokenImpactSummary` UI was removed because it was not yet readable enough. Destructive or reference-affecting changes should use focused Workbench modal/notice components backed by `TokenUsageIndex` and domain impact helpers, not browser-native confirms and not panel-local dependency scans. Reintroduce a richer impact surface only when it can be cleaner than the old popover block.

## Token CSS Export Scoping Rules

Generated token CSS must keep nested theme scopes self-consistent. The load-
bearing CSS fact: `var()` inside a custom property substitutes at the element
that declares it, so an alias chain declared only on `:root` freezes with the
document-level mode and nested scopes inherit mixed light/dark values.

- Bridge and alias variable chains (Tailwind bridge vars such as
  `--background`, and alias-collection vars such as
  `--ds-token-workbench-components-*`) must be declared at
  `:root, [data-wb-token-modes]` — never `:root` alone — so every token-mode
  scope root re-resolves them against its own mode.
- Three generators emit this CSS and must stay in sync:
  `src/domain/design-system/tokens/cssExport.ts` (app, richest output with
  `--ds-color-*`/`--ds-borderRadius-*` namespace aliases),
  `scripts/workbench-token-css.mjs` (gateway/script mirror, reduced output),
  and `scripts/workbench-template.mjs` (initial project token CSS).
- Never regenerate an app-generated project `workbench-tokens.css` with the
  script mirror; the mirror's reduced output silently drops namespace alias
  declarations. For shape-only changes, patch the committed file to match the
  generator output instead.
- Generated project token CSS only regenerates on a token-registry write.
  After a generator change, existing projects keep the old shape until their
  registry is next saved; starters that ship a checked-in token CSS artifact
  must be updated by hand — except the Vue starter, whose
  `scripts/build-vue-base-token-registry.mjs` regenerates its registry
  snapshot, `src/workbench-tokens.css` (through `cssExport.ts` itself) and
  the `src/astryx.theme-overrides.css` bridge together; run it after a
  generator change and the starter check fails while they are stale.
- Vendor theme collections (`extensions.source: 'astryx'`,
  `astryx.kind: 'theme-overrides'`) select their mode with
  `[data-astryx-theme="<mode>"]` instead of `data-wb-token-modes`, so the
  page's own `<Theme>` decides which mode renders; a bridge stylesheet on the
  theme root maps each vendor variable to the collection's
  `--ds-token-<collection>-<token>` variable. Keep that bridge unlayered so it
  wins over the vendor's `@layer` defaults on the same element.

## Verification Rules

For token-domain work, run:

```bash
npm run workbench:check-tokens
npm run check
npm run build
npm run workbench:check-config
```

For token UI behavior changes, also verify in the in-app browser:

- reload `http://localhost:5173/`
- confirm token editor, table, collection list, group list, search, and create-token control render
- confirm field-scope summary/settings render
- confirm gradient modal preview, stop rows, and stop color chips render
- check fresh console errors

## Next Refactor Direction

Continue reducing coupling in small slices. `WorkbenchShell.tsx` is no longer the primary token editor owner; the next work should refine smaller command/component seams.

Preferred next slices:

1. Formalize field-scope cleanup regressions for delete/move/duplicate.
2. Tighten token picker compatibility and result presentation without adding new one-off controls.
3. Improve deletion/rename alert copy around affected refs and field scopes.
4. Keep gradient/value editing behavior in split value and gradient components; do not put it back into `WorkbenchShell.tsx`.
5. Continue extracting only when the target boundary is obvious and testable.

Do not move to Component Library or Preview work by treating the token editor as complete. It is still an active authoring surface being shaped into a V1-native tool using earlier behavior as reference evidence only.
