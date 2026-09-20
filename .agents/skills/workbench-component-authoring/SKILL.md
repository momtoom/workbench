---
name: workbench-component-authoring
description: Use when creating, editing, importing, or debugging Workbench V1 components, component props, CSF stories, sourceInsert metadata, Add child picker behavior, Storybook previews, `.workbench/components.json`, prop registry metadata, or failures such as "No story preview", "0 variants", missing Inspector props, stale registry entries, or corrupted component imports.
---

# Workbench Component Authoring

## Required Reading

Before non-trivial component work, read these repo docs from the active project root:

- `docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md`
- `docs/WORKBENCH-V1-AGENT-GUIDE.md`
- `docs/WORKBENCH-V1-ARCHITECTURE.md`

If the task is only triage, read the relevant sections first with `rg` for terms such as `components.json`, `prop-registry`, `sourceInsert`, `argTypes`, `storySourceFile`, and the component name.

## Hard Stops

### Source Lifecycle Approval Gate

- Do not create a new reusable/registered component, add its story-backed
  contract, or extend an existing component API unless the current user request
  explicitly authorizes that exact component work. A broad page, catalog,
  redesign, editability, or cleanup request is not authorization. If component
  work emerges as an implementation idea, name the proposed component and its
  source/story/export/token impact, then stop before writing until the user
  approves it.
- Before creating a component path, inspect the scoped `git status`, target
  path, imports, registry linkage, and relevant Workbench/repository history.
  Never restore or reconstruct a deleted or missing page/component from
  Workbench history, Git history, a stash, backup, generated output, another
  branch, or another project unless the user explicitly requests restoration
  of that exact artifact. If deletion versus accidental absence is ambiguous,
  stop before writing and ask.
- Do not hand-edit project `.workbench/components.json` or `.workbench/prop-registry.json` to create or change components.
- Do not put Storybook/CSF control fields such as `control`, `assetId`, `extensions`, or picker-only metadata into component registry entries.
- Do not treat generated registry JSON as the source of truth. Component TSX, exports, CSS, CSF stories, and Workbench import/re-import hydration define the contract.
- When the user supplies code or rendered HTML, do not substitute a screenshot-based
  approximation. First extract ordered containers, spans, component/slot names,
  repeated-item counts, text, assets, and typography/theme classes. Convert
  rendered slots to registered component contracts while preserving those
  facts, and stop if exact conversion is blocked.
- Supplied-artifact hard stop: do not substitute a screenshot-based approximation. Convert rendered slots to registered component contracts before implementation and verification.
- Do not bypass broken previews by deleting stories or weakening component registration. Fix the source/story contract or the loader.
- Do not use `.map(...)`, render callbacks, or config-generated children for ordinary designer-editable repeated UI. Explicit JSX is preferred over DRY when designers need per-item selection, reorder, deletion, or styling. `{Map expression}` in the Design canvas is a failed result unless the user explicitly requested a data-driven read-only region with a verified backing-data writer.
- Do not create runtime islands for ordinary cards, lists, rows, controls, forms, navigation, or static visual composition. Islands are limited to the smallest genuinely heavy leaf such as canvas/WebGL, a geographic map engine, rich editor, chart engine, or virtualized grid.
- Do not let reusable components, component barrels, or stories import or re-export their implementation from `src/workbench-pages`. Pages may import components; the reverse dependency is forbidden because page deletion must not remove component source.
- Before deleting or moving a page/component source file, run a reverse-dependency scan across `src`, matching stories, barrel exports, and `.workbench` linkage fields. Stop if the file is the canonical implementation of a registered component.

Direct registry edits are allowed only for explicit registry repair or migration tasks, and then only after reading the current schema, preserving unrelated entries, and running the relevant checks.

## Component Contract Triage Gate

When props, variants, insertion, or preview look wrong, prove the component
contract before blaming the Workbench app:

- Inspect the component TSX public props, defaults, `children`, exports, and `className` merge behavior.
- Ensure wrapper components forward unconsumed root props to the selectable root DOM element. Workbench injects source identity, selection, event, and diagnostic `data-*`/handler props at runtime; dropping `...props` often makes a component render correctly but become unselectable in the Design canvas.
- Inspect the matching `*.stories.tsx`: `args`, `argTypes`, story export names, `sourceInsert.props`, `sourceInsert.jsxChildren`, and optional `designDefaultArgs`.
- Inspect `.workbench/components.json` only for linkage fields such as `sourceFile`, `importName`, `sourceExportName`, `storyFormat`, `storySourceFile`, `libraryId`, and `librarySnapshotRoot`. Do not add story controls to registry JSON.
- Inspect the page JSX that renders the component. If the page uses a native `<button>` instead of the registered `<Button>`, Inspector component props will not appear.
- For visual examples or composed pages, make every designer-meaningful component contract a registered instance when the user is expected to edit component props. When a component system does not provide layout or typography primitives, native semantic elements with theme-backed Tailwind utilities are the canonical source expression. If Inspector component props matter, use registered `Icon`, `Button`, `Card`, media, or slot components instead of replacing that contract with raw markup.
- Ensure the first/default story is the product default users expect to see first. Do not make a destructive, ghost, skipped, or placeholder variant the first visible variant unless that is the actual default.
- Keep the prop surface intentionally small. Add only props that a designer actually needs to understand and edit; do not expose implementation details, Tailwind/CSS longhands, or values already expressible through `className`, tokens, project CSS, or existing layout/style controls. A prop should represent a meaningful product/design choice and visibly affect the rendered component.
- Respect the component kind before styling it. A `Button` needs real button/link semantics, label text, explicit leading/trailing icon slots, disabled/loading/focus behavior, semantic variants, size/shape controls, and a children contract that can accept added inline icons/images without breaking layout; child icons/images should default to `1em`.
- Prefer parent + registered child wrappers when designers need structural freedom. Breadcrumbs/items, lists/list items, radio or checkbox lists/items, toggle groups/buttons, tables/rows/cells, metadata lists/items, and editable button contents should expose per-item props on child components and keep root props for group-level behavior. Use a one-shot wrapper only when the internal structure is not meant to be edited.
- Before implementing a new compound wrapper, write the complete visible hierarchy from its real interaction surface, not only its data model. A search builder, for example, may require `Root -> Input + Menu -> Item -> DetailEditor -> Field/Operator/Value/Actions`; exposing only field config children while the input, first menu, and detail controls remain vendor-internal is not an editable Workbench contract.
- Give every independently selectable registered child a name-matched source file and `*.stories.tsx` file (`AstryxThingPart.tsx` + `AstryxThingPart.stories.tsx`). A named export buried in the parent source file can render correctly while filename-based registry reconciliation silently omits it.
- Do not encode designer-editable repeated or ordered UI as newline-, comma-, pipe-, or otherwise delimited string props and then split/map it internally. Rows, menu entries, options, tree branches, messages, gallery media, tabs, and panels that designers should select, add, delete, duplicate, or reorder must use a parent plus registered child components, strict child allowlists where appropriate, and `sourceInsert.jsxChildren`. A data-only collection is an exception only when the component has a verified Binding writer/editor contract and the visible items are intentionally not source children.
- Do not hide designer-editable fields or options in module-level runtime config arrays such as `createPowerSearchConfig([...])` or `createStaticSource([...])`. Model fields and nested options as registered source children, then derive the vendor runtime config from those children.
- A child prop must survive every visible presentation of that child. If an item exposes `icon`, color, description, selected state, or end content, verify it in option, selected-token, collapsed, and expanded states as applicable. A prop that appears in Inspector but disappears in the rendered selected state is a broken contract.
- Keep theme scope as its own component contract. Do not expose theme or light/dark mode props on every Stack/HStack/VStack/Grid/Section; provide a dedicated Theme/ThemeScope wrapper and ask designers to wrap a region when they intentionally need a local theme boundary.
- Treat recurring icons as asset-backed `Icon` components, not raw inline SVG path trees. The component should expose one asset `source` picker plus meaningful rendering/accessibility props such as `size`, `renderMode`, `decorative`, and `label`; do not duplicate identity through both `name` and `source`. Default inserted icons should omit `size`, use CSS/default `1em`, and follow the parent context; use `size` only as an explicit override for standalone or special cases. It should render as one glyph so Workbench layers stay at the designer-meaningful icon boundary.
- Keep picker semantics explicit: `control: 'icon'` is the icon-name/glyph picker for the default icon set, while `picker: 'asset'` is the asset-source picker for URLs such as `Icon.source`, `img.src`, and media/SVG source fields. Do not classify every `.svg` as an icon; color SVG sets and illustration SVGs are image assets when the asset registry says `kind: image`.
- Components that expose light/dark, contrast, theme media, or fixed color-scheme props must also expose an `auto`, `inherit`, or unset path that omits the media-forcing attribute and follows the Workbench preview appearance. Default `sourceInsert` props should prefer that automatic path unless the component's semantic purpose is an intentionally fixed or inverted surface.
- For Figma-derived components, map Figma variants/properties into real props, stories, `sourceInsert`, CSS tokens, and child allowlists. Do not stop at a visually similar wrapper.
- If Storybook controls exist but do not change the rendered output, fix the component implementation or story render function before touching app code.
- For wrapper or compound components that parse children into slots, depend on direct DOM children, or style children with `:first-child`, `:last-child`, adjacent sibling, or child-combinator selectors, compare browser/page preview with the Design canvas. If browser preview is correct but the Design canvas breaks, suspect Workbench selection/runtime wrapper interposition before changing component props or CSS. Preserve the component contract and update the preview runtime direct-prop/wrapper bypass path for that root or sub-component.
- Do not fix selection-wrapper breakage with page-specific CSS, hidden duplicate children, one-off `data-*` hooks, or a broad component allowlist that has not been verified in the Design canvas. A wrapper-sensitive fix must prove that Layers, canvas selection, and Inspector props still identify the source-backed component instance.
- For vendor systems, never use official component class names for page-local CSS. Prefix local classes and inspect compiled CSS so broad local rules do not override vendor classes such as Astryx `.astryx-heading`.
- For vendor containers with edge-bleed or parent-padding escape behavior, make the Workbench wrapper default to a predictable editor box and expose an explicit `bleed` prop only when needed. Verify Grid/Card layout in browser/page preview and the Design canvas.
- If the contract passes and Workbench still fails, then debug the loader or app boundary with concrete evidence.

## Component Workflow

1. Start from source:
   - Update the component TSX and exports.
   - Keep `className` merged into rendered DOM.
   - Add semantic props only when Inspector needs designer-editable behavior that cannot be better handled by children, `className`, tokens, project CSS, or an existing style/layout control.
   - Audit every reusable color, radius, spacing, size, shadow, typography, and motion value. If it belongs to the component contract, add or reuse a component token instead of leaving anonymous CSS values in the component stylesheet.
2. Update the CSF story:
   - Keep `args`, `argTypes`, `sourceInsert`, and optional `designDefaultArgs` aligned.
   - When adding a designer-editable prop, update all three surfaces in the same patch: component TSX implementation, story `argTypes`, and `sourceInsert.props` or `sourceInsert.jsxChildren`. A prop that appears only in Storybook controls is not done; it will often be missing or invisible in Workbench Design after insertion.
   - Use standard controls: `text`, `boolean`, `number`, `select`, `icon`.
   - For media/color-scheme props, include the automatic option in `argTypes` and prefer it in `sourceInsert.props`.
   - Keep insertion defaults in `sourceInsert.props`; use `sourceInsert.jsxChildren` and `sourceInsert.imports` for compound children.
- Before completing any collection or compound component, verify in Workbench that one repeated child can be selected in Layers, edited in Inspector, duplicated, deleted, and reordered without editing a delimiter string.
- Layers presence alone is not proof that a compound child works. After registry hydration, verify that every parent has the intended `childrenSlotKind`, the live component actually receives and renders its authored React children, and the selected child exposes its own Inspector contract on the canvas. A child visible only in Layers but absent from runtime DOM is a blocker.
3. Register token changes when reusable values are introduced:
   - Update `.workbench/tokens.json`, preferably in the component token collection for component-owned values.
   - Keep `src/workbench-tokens.css` or the project token CSS output aligned when it is checked in.
   - Preserve the intended chain: component token -> semantic role token -> primitive raw token.
   - For Astryx-backed styling, follow Astryx's official integration-path rule: CSS variables for DOM styles, Tailwind bridge CSS for token-backed utilities, StyleX imports for StyleX styles, and JavaScript token resolver APIs only for non-CSS consumers.
   - If no component tokens are added for a new visual component, explicitly verify and state why every visual value is one-off, inherited, or already covered by existing tokens.
4. Reconcile registry through Workbench import/re-import or existing hydration paths.
5. Verify Add child, Storybook preview, Inspector props, source insertion, rendered preview behavior, and token CSS consumption.
6. For wrapper-sensitive components, verify both the standalone browser/page preview and the Design canvas with selection enabled; the canvas must preserve runtime slot ownership and direct-child styling while still exposing selectable layer boundaries.
7. For pages assembled from components, select the page root, a layout wrapper, a text/control component, and one nested child in the Workbench Design canvas. If any of those selections show only generic DOM fields when a registered component contract should appear, the page is not done.

## Debugging Symptoms

- `0 variants` on a CSF-backed component usually means registry variants are empty; it is not proof that story metadata is invalid. Check `extensions.storyFormat` and `extensions.storySourceFile`.
- `No story preview` means runtime story import failed or no fallback render exists. Inspect the story import path, story module errors, and component export names.
- Missing Inspector props usually means the source/story/prop registry contract is out of sync. Compare TSX props, CSF `argTypes`, `sourceInsert.props`, and prop registry metadata.
- If a prop exists in Storybook but not in Design, first check whether it was added only to `argTypes`. Add it to the component implementation and the inserted source contract, then reconcile the registry instead of hand-editing generated JSON.
- If the component appears in the picker but Inspector shows only generic DOM props, check whether the selected node is a native element, a parsed child, a read-only dependency boundary, or a stale registry entry instead of the registered component instance.
- If one bad story appears to break many components, inspect batch metadata loading and ensure failures are isolated per component.

## Tailwind And Page Composition

Tailwind is a supported source-backed styling surface. Use it for ordinary
composition and layout when it is clearer than adding one-off component props:
`relative`, `absolute`, `inset-*`, `z-*`, `grid`, `minmax`, `overflow-*`,
`object-cover`, `backdrop-blur`, `aspect-*`, spacing, sizing, color, state, and
responsive utilities are valid in page/component `className`.

There is no current Workbench rule that forbids Tailwind. Older
non-Tailwind-era assumptions are superseded by the source-backed Tailwind
contract: preserve and edit utility classes in `className`, and do not interpret
warnings against inline styles, arbitrary raw CSS, or broad class rewrites as a
ban on Tailwind.

Put those utilities on registered components whenever the element should remain
selectable and inspectable as that component. For example, an overlaid media card
should be composed from registered `Card`, media/aspect-ratio, and `Button`
components plus native semantic text with Tailwind utilities in `className`, not from a
page-only wrapper that only the browser can understand.

Do not replace Tailwind utilities with large page-local CSS systems, custom
`data-*` styling APIs, or inline JSX styles merely to match a mockup. If a visual
pattern repeats or needs semantic Inspector controls, promote it into a real
component/stories/sourceInsert contract instead.

## Checks

Run checks proportional to the change:

- Type check: `npm run check`
- Starter/component story checks: `npm run workbench:check-starter`
- Design/editor guard checks: `npm run workbench:check-design`
- Whitespace for touched files: `git diff --check -- <files>`

If a check fails on unrelated dirty worktree changes, report the exact blocker and keep the component fix scoped.
