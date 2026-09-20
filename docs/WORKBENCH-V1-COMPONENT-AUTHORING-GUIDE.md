# Workbench V1 Component Authoring Guide

Use this guide whenever an AI agent creates or edits a source-backed component
for Workbench. It applies to project libraries, presets, page-local components,
and any component system that Workbench should parse, inspect, preview, and edit.

The goal is not only to produce valid React. The goal is to produce components
that remain editable in Workbench and maintainable by a design system team.

## Source Lifecycle Approval Gate

Before writing component source, stories, exports, tokens, or registry-linked
metadata:

- Confirm that the current user request explicitly authorizes creation or
  extension of the exact component contract. Broad page, catalog, redesign,
  editability, cleanup, or "all components" requests do not authorize new
  support components. When component work is inferred during implementation,
  name the proposed component and source/story/export/token impact, then stop
  and wait for approval.
- Inspect the scoped `git status`, target path, imports, component registry, and
  relevant Workbench/repository history. Never restore or reconstruct a deleted
  or missing page/component from Workbench history, Git history, a stash,
  backup, generated output, another branch, or another project unless the user
  explicitly requests restoration of that exact artifact.
- If deletion versus accidental absence is ambiguous, stop before writing and
  ask. Do not create provisional files, stories, exports, tokens, routes, or
  registry entries while waiting.

## First Gate: Editable Source Or It Does Not Count

Before writing or reviewing any Workbench-authored page/component, apply this
gate first. If source fails this gate, fix the source shape before polishing the
visual result.

- **Default to raw editable JSX.** Author pages in the lowest practical source
  shape so every visible thing can be selected and edited: real `main`,
  `section`, `div`, text, `button`, `img`, `svg`, and registered primitive
  components. Componentization is a user/design-system decision, not an agent
  cleanup reflex.
- **Visible UI stays visible in source.** Ordinary layout, copy, cards, stats,
  labels, and decorative glyphs should be explicit JSX or a registered
  Workbench component. Do not hide them in private page helpers.
- **Designer editability beats DRY.** For a design implementation, repeated
  cards, rows, controls, dividers, labels, and media that designers should
  select, reorder, delete, or restyle must be explicit JSX. Do not introduce
  `.map(...)`, render callbacks, config-driven children, or array-generated
  fragments merely to reduce source repetition. Use a map only when the user
  explicitly wants a data-driven/read-only region and Workbench has a verified
  writer for the backing data shape; otherwise `{Map expression}` in the Design
  canvas is a failed implementation.
- **Components own their implementation.** Reusable component source belongs
  under `src/components/` or the established library component root. Pages may
  import components. Components, component barrels, and stories must never
  import or re-export their implementation from `src/workbench-pages/`. A page
  is deletable composition, not a component source-of-truth.
- **Do not invent page-only micro-components.** A human authoring a single page
  usually would not create `SectionLead`, `MetricTile`, `MiniStat`, `StatCard`,
  or similar private helpers just to avoid repeating a few cards or labels.
  That is an agent/refactor habit, and it makes Workbench less editable. Promote
  a pattern to a registered component only when it is a real reusable contract
  with stories/metadata; otherwise write the visible JSX directly.
- **No unsupported expression props for visible UI.** Avoid `style={{ ... }}`,
  `icon={SomeIcon}`, `config={object}`, `renderItem={...}`, function props, and
  object/array props unless Workbench has a known writer for that exact shape.
- **No bare package icon components in page JSX.** Do not render Lucide/Tabler
  imports such as `<TrendingDown />` directly in a page. Use a registered icon
  contract, asset-backed icon reference, icon-name prop, or inline static SVG
  for a one-off decorative glyph.
- **Runtime islands are explicit exceptions.** Charts, WebGL/canvas scenes,
  geographic map engines, rich editors, and virtualized grids may be
  project-local runtime islands with small literal/CSV/token-compatible props.
  An ordinary list, card grid, track board, toolbar, form, navigation, media
  gallery, or static map-like visual is not an island candidate. The page
  around a justified island must remain editable JSX.
- **Static styling lives in `className`, CSS, and tokens.** If an edit creates
  static inline styles such as `style={{ position: "sticky", top: "0px" }}`,
  convert them back to classes such as `sticky top-0`.
- **Finish with an editability scan.** For page work, check for private helper
  tags, `.map(...)` in designer-editable regions, bare icon package
  tags/imports, `style={{ ... }}`, non-literal JSX expression props, and reverse
  imports from `src/components` to `src/workbench-pages` before declaring the
  task done.
- **Preserve supplied source fidelity.** If the user provides code, rendered
  HTML, a DOM dump, or design structure, complete the Provided Artifact Fidelity
  Gate in `docs/WORKBENCH-V1-AGENT-GUIDE.md` before editing. Editable JSX is a
  semantic conversion of that source, not permission to redraw it. Preserve
  page boundaries, ordered tracks, spans, slot/component hierarchy, counts,
  content, assets, and typography/theme classes.

## Core Contract

Every component change must preserve these properties:

- The component is inspectable and editable in Workbench.
- Storybook controls, Design editor props, and source insert defaults describe
  the same component contract.
- Static visual styling uses tokens and CSS classes, not inline styles.
- New reusable visual values are added as tokens before they are used.
- Component APIs stay semantic. Do not add one-off CSS longhand props just to
  match a single mockup.
- Add only props that a designer actually needs to understand and edit. Do not
  expose implementation details, Tailwind/CSS longhands, or values already
  expressible through `className`, tokens, project CSS, or existing layout/style
  controls just to make the Inspector look exhaustive.
- Placeholder UI is not product progress. Use realistic examples when the
  component represents real product content.

## Component Contract Triage Gate

Before fixing Workbench app code for a broken component, prove the component
contract itself is sound.

- Inspect the component TSX public props, defaults, `children` handling,
  exports, `className` merge behavior, root element, and imported CSS.
- Wrapper components must forward unconsumed root props to the selectable root
  DOM element. Workbench injects source identity, selection, event, and
  diagnostic `data-*`/handler props at runtime; if the wrapper drops `...props`,
  the component can render correctly while becoming unselectable on the Design
  canvas.
- Inspect the matching `*.stories.tsx`: `args`, `argTypes`, first story,
  `sourceInsert.props`, `sourceInsert.jsxChildren`, child imports, and optional
  `designDefaultArgs`.
- Treat Storybook controls as only one surface of the contract. When adding a
  designer-editable prop, update the component implementation, story `args`,
  `argTypes`, and the inserted source contract in the same change. If a prop is
  only added to `argTypes`, it may show in Storybook while being absent from
  Workbench Design or from newly inserted JSX.
- Inspect `.workbench/components.json` only for linkage fields such as
  `sourceFile`, `importName`, `sourceExportName`, `storyFormat`,
  `storySourceFile`, `libraryId`, `librarySnapshotRoot`, and
  `childrenSlotKind`. Do not put Storybook controls or picker-only metadata in
  registry JSON.
- Inspect the page JSX that renders the component. A native `<button>` or
  parsed child will not expose the registered `Button` props in Inspector.
- For visual examples or composed pages, make every designer-meaningful element
  a registered component instance when the user is expected to select or edit it.
  Native semantic layout and text elements are the canonical source expression
  when the component system does not provide a corresponding primitive; style
  them with theme-backed Tailwind utilities. If Inspector component props matter,
  use the registered `Icon`, `Button`, `Card`, media, or slot component contract
  instead of replacing that contract with raw markup.
- For Figma-derived components, verify the editable contract, not only the
  pixels: semantic props, token/CSS use, child slot shape, icon slots/assets,
  default story, and insert markup must agree.
- Keep the prop surface intentionally small. A prop belongs in the design
  contract only when it represents a meaningful product/design choice, affects
  the rendered component, and is something a designer should reasonably adjust.
  Prefer Tailwind utilities, project CSS, tokens, and `className` for ordinary
  spacing, sizing, color, layout, border, and typography tweaks instead of
  turning those CSS details into component props.
- If a component exposes a light/dark, contrast, theme media, or fixed
  color-scheme prop, it must also expose an `auto`, `inherit`, or unset option
  that omits the media-forcing attribute and follows the Workbench preview
  appearance. Prefer the automatic option in insertion defaults unless the
  component is deliberately fixed or inverted by design.
- For inline components such as Button, Badge, Label, and icon-bearing
  controls, ensure added text or inline icons stay inside the component's
  intended text flow instead of being swallowed by a label wrapper, converted
  into a sibling, or forced below the control.
- For wrapper or compound components that parse `children` into named slots,
  own compound children, or style direct children, verify both browser/page
  preview and the Workbench Design canvas. If browser preview is correct but
  the Design canvas stacks children, loses grouped styling, or reveals fallback
  content, suspect selection wrapper interposition before changing the
  component API or project CSS.
- Do not fix selection-wrapper breakage with page-specific CSS, hidden duplicate
  children, one-off `data-*` hooks, or broad runtime allowlists that have not
  been verified in the Design canvas. A wrapper-sensitive fix must prove that
  Layers, canvas selection, and Inspector props still identify the source-backed
  component instance.
- For vendor design systems, do not reuse the vendor's official component class
  names for page-local CSS. Prefix local/demo classes with a Workbench or
  project namespace and inspect the generated CSS for broad rules that override
  official component classes. For example, a local `.astryx-heading` rule will
  override Astryx's real Heading component because the official component uses
  the same class name.
- For wrapper components around vendor containers that intentionally escape
  parent padding or depend on nested container compensation, default the
  Workbench wrapper to a predictable editor box. Expose an explicit `bleed` or
  equivalent prop only when the designer needs that edge-to-edge behavior, and
  verify Grid/Card layout in both browser/page preview and the Design canvas.
- If story controls exist but do not change rendered output, fix the component
  implementation or story render function before changing Workbench internals.

## Component Kind Contract

Respect the semantic kind of the component before styling it.

- A `Button` is an interactive control, not just a rounded rectangle. It needs a
  real `button` element unless it is explicitly a navigation link, `type`
  defaulting to `button`, disabled/loading behavior, focus-visible styling, a
  stable accessible name, semantic variants, size/shape controls, and explicit
  leading/trailing icon slots.
- Button labels should be editable as text or `children`, and React children are
  part of Workbench's useful extensibility. The component should tolerate added
  children gracefully while keeping the accessible name, control sizing,
  selection behavior, and intended button flow intact. If the design requires
  icons, support explicit icon props and inline child icons/images that default
  to `1em` so they follow the label size.
- Treat recurring icons as asset-backed `Icon` components, not raw inline SVG
  path trees. The component should expose one asset `source` picker plus
  meaningful rendering/accessibility props such as `size`, `renderMode`,
  `decorative`, and `label`; do not duplicate identity through both `name` and
  `source`. Default inserted icons should omit `size`, use CSS/default `1em`,
  and follow the parent context; use `size` only as an explicit override for
  standalone or special cases. It should render as one glyph so Workbench layers
  stay at the designer-meaningful icon boundary.
- Keep the icon picker and asset picker separate. `control: 'icon'` is for
  choosing a glyph/name from the default icon set. `picker: 'asset'` is for a
  source URL such as `Icon.source`, `img.src`, or `svg`/media source fields, and
  should declare `assetKinds` explicitly. Do not treat every `.svg` as an icon:
  color SVG collections and illustration SVGs are image assets when the asset
  registry marks them as images.
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, and
  similar controls must preserve the expected native or ARIA semantics, label
  relationship, controlled/uncontrolled state contract, keyboard behavior, and
  disabled/error/required states.
- `Card`, `Dialog`, `Tabs`, `Accordion`, `Table`, and menu-like components need
  honest slot/compound structure. Do not flatten them into a single visual
  wrapper or expose fake children that the runtime component cannot own.
- Start from the complete visible interaction hierarchy, not only the data
  model. A builder-style search control can require
  `Root -> Input + Menu -> Item -> DetailEditor -> Field/Operator/Value/Actions`.
  If the fields are authored children while the input, first dropdown, item
  rows, or detail controls are still created inside the vendor component, the
  Workbench contract is incomplete.
- Each independently selectable child needs its own name-matched source and CSF
  files. For example, `AstryxPowerSearchValueControl.tsx` must pair with
  `AstryxPowerSearchValueControl.stories.tsx`. Do not rely on several named
  component exports from one parent file: filename-based registry
  reconciliation may register only the parent even though every export renders.
- Background registry hydration is uncapped and must stay that way: it
  processes every project component source (real projects exceed 190 sources),
  with importable-component parsing memoized by file contents so repeated
  passes only re-parse changed files. Do not reintroduce source-count caps
  that silently skip auto-registration, and keep reconciliation preserving
  declared registry metadata that source inference cannot re-derive (for
  example `childrenSlotKind` pins on wrappers that forward `{...props}`).
- When a component is useful because designers can add, remove, reorder, or
  restyle internal pieces, model it as a parent plus registered child
  components. Examples include breadcrumbs/items, lists/list items,
  radio/checkbox lists/items, toggle groups/buttons, table/row/cell, metadata
  list/items, and button contents. Keep root props for group-level concerns
  only; put per-item label, value, href, current/checked state, icon, and
  description on the child wrapper.
- Never represent designer-editable repeated or ordered UI as a newline-,
  comma-, pipe-, or otherwise delimited string prop that the wrapper splits and
  maps internally. Rows, menu entries, options, tree branches, messages,
  gallery media, tabs, and panels belong in registered child components with
  `sourceInsert.jsxChildren` and a strict child allowlist where the parent owns
  a closed compound contract. A data-only collection is acceptable only when a
  verified Binding writer/editor owns that data and the visible items are
  intentionally not source children.
- Do not hide designer-editable fields or options in a module-level runtime
  configuration array such as `createPowerSearchConfig([...])` or
  `createStaticSource([...])`. Use registered field and option children with
  `sourceInsert.jsxChildren`, then derive the vendor runtime configuration from
  those authored children.
- Verify child props across every visible state. Icon, color, description,
  selected state, and end content must not disappear when an option becomes a
  token, a row collapses, or a menu opens. An Inspector prop that does not
  survive the component's actual presentation states is not a valid design
  contract.
- Do not treat a correct Layers tree as runtime proof. Reconcile the registry,
  confirm every compound parent has the intended `childrenSlotKind`, then prove
  the live DOM receives those authored children and that selecting each child
  shows its own Inspector props. “Visible in Layers, missing from the rendered
  component” is a failed child contract.
- Use this preflight for every new compound component: can a designer select
  one visible item in Layers, edit its meaningful props in Inspector, add or
  duplicate another item, delete it, and reorder it? If yes, the item must be a
  source child. A finished demo whose visible pieces exist only inside the
  wrapper implementation does not pass component authoring.
- Keep theme scope separate from layout primitives. Do not put theme or
  light/dark mode controls on every `Stack`, `HStack`, `VStack`, grid, or
  section just because the underlying design system can apply scoped tokens
  there. Create a dedicated `Theme`, `ThemeScope`, or equivalent container that
  owns theme and color-mode props; use it to wrap a region only when the design
  deliberately needs a local theme boundary.
- A finished one-shot wrapper is appropriate only when the component's internal
  structure is not meant to be edited in Workbench, such as a spinner, skeleton,
  simple status, progress bar, or field status. If future design work is likely
  to edit the pieces independently, prefer the compound contract from the
  beginning.
- When importing from Figma, derive the component contract from the component's
  role first, then map Figma variants/properties into props, stories,
  `sourceInsert`, CSS tokens, and child allowlists.

## Workbench Editing Philosophy

Workbench-authored component source is a design editing surface, not the final
place to solve every production architecture concern. Write components so a
designer can understand the visible screen, select the right boundary, edit the
expected prop/style/data surface, and hand the result to a developer without
losing source truth.

Practical rules:

- Keep the visible contract shallow and semantic. The editable root, important
  slots, labels, copy, icons, data rows, series, and visual variants should be
  named props, children, classes, tokens, or explicit JSX.
- Preserve `className`, `style` when truly needed, `children`, IDs, labels, and
  token-compatible props on the slot where Workbench and the user expect them
  to apply.
- Use a local runtime island only for the smallest genuinely heavy leaf such as
  a chart engine, geographic map engine, rich editor, canvas/WebGL scene, or
  virtualized grid. Do not make ordinary cards, lists, rows, controls, forms,
  navigation, galleries, or static layout into islands.
- Treat provider/context values, render callbacks, opaque config objects, and
  computed expressions as advanced source boundaries. They may be valid React,
  but they should not be the default way to express editable visual UI.
- In design implementation, local arrays and `.map(...)` are not the default
  for visible repeated UI. Use explicit JSX when designers need per-item
  selection, reorder, deletion, or styling. A map is allowed only when the user
  explicitly wants a data-driven/read-only region and Workbench has a verified
  writer for the backing data shape.
- When the Workbench-safe shape conflicts with a production optimization, keep
  the screen editable and leave a clear developer handoff point. Do not hide the
  UI behind clever state/data code just because it is more app-like.

## Component File Set

Follow the local library convention. A complete component usually includes:

- Component source, such as `ComponentName.tsx`.
- Story or metadata source, such as `ComponentName.stories.tsx`.
- Library export updates, such as `index.ts`.
- Stylesheet or CSS module updates.
- Token source updates when new design values are required.
- Generated token CSS updates when the project expects checked-in token CSS.
- Preset or project mirrors when the repository keeps both copies.

Do not create only the TSX file when the component needs stories, exports,
tokens, or editable metadata to work in Workbench.

## AI Code Generation Anti-Patterns

Avoid code that renders in a browser but becomes opaque, brittle, or misleading
inside Workbench:

- One giant component with anonymous `div`/`span` trees instead of semantic
  sections, readable component names, and clear local boundaries.
- Visible structure generated only by render callbacks, function-as-children
  APIs, deeply nested helpers, config objects, template strings,
  `dangerouslySetInnerHTML`, SVG paths, canvas drawings, or background images
  when ordinary JSX/text would work.
- Static visual design stored in JSX inline style objects, CSS-in-JS object
  maps, runtime style calculations, or random generated class names instead of
  `className`, project CSS, and token-backed variables.
- Provider-heavy roots that hide the visible UI behind router, auth, data,
  theme, sidebar, drag/drop, measurement, or chart providers.
- Random IDs, time-based keys, array indexes used as persistent identity, or
  remount-on-edit wrappers that make selection, undo/redo, and Inspector state
  unstable.
- Hardcoded sample chart/table data buried inside internals when rows, series,
  labels, colors, or CSV values should be editable props.
- Fake editability where story controls or Inspector props exist but do not
  affect the rendered component.
- Absolute local imports, Vite `@fs` paths, app bundle paths, localhost module
  URLs, or dependency-internal imports from `node_modules`.

Prefer Workbench-friendly source: explicit JSX for editable structure, semantic
props, stable keys, project-relative imports, pass-through `className`, token
variables, small runtime islands for heavy dependencies, and story/control
metadata that exactly matches rendered behavior.

## Base UI And Behavior Primitives

Base UI primitives are valid building blocks for Workbench source components.
Prefer Base UI when it provides the expected accessibility, keyboard behavior,
focus management, portal behavior, or compound component state for a control.

Use Base UI through Workbench-owned wrapper components:

- The wrapper component owns the public props, styles, tokens, stories, source
  insert defaults, registry metadata, and child allowlists.
- Workbench edits the wrapper contract, not Base UI internals or generated DOM.
- Keep imports explicit, such as `@base-ui/react/tabs`, instead of replacing
  primitive behavior with unrelated native HTML just to simplify preview.
- When Base UI has no matching primitive for a component family, implement a
  source-native wrapper with the same Workbench authoring standards.
- Verify dependency-backed components in Workbench Design Editor and packaged
  page preview, not only in a standalone browser.

For shadcn/ui-style components, treat the generated component as ordinary
project source:

- Keep generated component files project-local. Workbench should import and
  inspect them through the same source-backed path as hand-authored components.
- Do not rewrite generated TSX into unrelated HTML just to make the browser
  preview look correct. Fix dependency resolution, CSS loading, portal
  containment, or wrapper contracts first.
- Preserve the public API shape: variant props, `className`, `asChild`,
  compound sub-components, data attributes, and expected children.
- Register component families as families. For example, Sidebar, Table, Tabs,
  DropdownMenu, Select, Dialog, Sheet, and Drawer need meaningful sub-component
  discovery, stories, and child constraints where structure matters.

### Shadcn/Base UI Root Insert Contracts

Shadcn/Base UI wrappers often have two valid authoring modes:

- **Developer-authored compound mode:** developers compose children directly,
  such as `<Card><CardHeader>...</CardHeader></Card>` or
  `<RadioGroup><Label><RadioGroupItem />Designer</Label></RadioGroup>`.
- **Workbench root insert mode:** the component picker inserts a useful default
  component that a designer can select and edit from the root Inspector.

Preserve both modes without inventing hidden root state. A Workbench-friendly
insert preset should use the component's real public API: root props for real
root behavior, child components for slots, and child props such as `value`,
`placeholder`, or `children` where those are the authored contract.

For root insert stories:

- `args`, `argTypes`, `sourceInsert.props`, `designDefaultArgs`, and the actual
  rendered JSX must describe the same public contract.
- Do not add fake root props just to make a compound component editable from
  one Inspector row. Labels such as option names, card titles, alert
  descriptions, input placeholders, or button labels should live on the child
  component that owns that API unless the root component already exposes that
  exact public prop.
- Use explicit `sourceInsert.jsxChildren` for compound form controls whose child
  values are the product contract. For example, a `Select` root must not
  synthesize fallback `SelectItem` children from root props: deleting an item
  would otherwise reveal the hidden fallback again, and duplicate fallback
  values can make multiple rows appear selected. Insert the trigger, value,
  content, group, label, and items as real editable children instead. Each
  inserted `SelectItem` should carry an explicit `value` prop because that is
  the Base UI business/API contract; the child text is the display label.
- If a Base UI-backed `SelectItem` has to defend against a missing `value`, keep
  any generated fallback value internal. `SelectValue` should render the item's
  authored label, not the generated raw value such as a React `useId` token.
- Add child constraints for single-slot compound parts. For example, `Select`
  should allow one `SelectTrigger` and one `SelectContent`, not repeated
  trigger/content siblings.
- Avoid prop names that collide with DOM semantics, and do not create a renamed
  root prop just to hold child slot content. For example, a card title should
  be authored as `<CardTitle>Title</CardTitle>`, not as a root `title` or
  `cardTitle` convenience prop.
- Keep explicit compound children for primitives whose structure is the product
  contract, such as menu items, dialog sections, sheet content, and tab panels.
  Do not flatten overlay/menu/dialog families into broad root props without a
  deliberate component API pass.
- For controls whose label is normally external, such as `Checkbox` or
  `Switch`, prefer a wrapper composition or field-level insert preset instead
  of silently inventing a root `label` prop unless the design system has chosen
  that public API.

### Overlay And Portal Rules

Components that open floating content must not escape the Workbench preview in a
way that covers or crashes the whole app.

For dropdowns, select menus, dialogs, drawers, sheets, tooltips, context menus,
and popovers:

- Use the Workbench preview/page portal container when the component is rendered
  in Workbench.
- Keep standalone app behavior intact; the portal helper should fall back to the
  normal document body only outside Workbench preview.
- Avoid modal/focus settings that make preview selection impossible unless the
  component truly requires modal behavior.
- Verify open/close in the Design editor and the browser page preview
  packaged preview when the component is part of a starter or sample project.
- If a primitive requires provider context, make story/source insertion render a
  valid provider/root composition. Rendering a close button, menu group, or
  sidebar part outside its root provider is a component bug, not a Workbench
  bug.

## Runtime Island Components

Runtime islands are an escape hatch, not the default page composition pattern.
Use one only for the smallest dependency-heavy leaf that cannot reasonably stay
inside editable page JSX. A runtime island trades off direct layer/Inspector
editability for runtime safety and performance, so ordinary editorial sections,
cards, stats, labels, icons, and layout wrappers should not become islands.

Use a project-local runtime island only when a visible area depends on a heavy,
stateful, or measurement-sensitive package.

Good island candidates:

- Recharts or other charting libraries.
- Maps and geospatial SDKs.
- Rich text/code editors.
- Canvas/WebGL/Three.js scenes.
- Data grids with virtualization, drag sorting, or complex sensors.
- Any dependency that creates long-lived observers, timers, portals, or global
  event listeners.

Do not use a runtime island for:

- page-only layout wrappers, editorial text sections, metric cards, badges, or
  ordinary repeated UI that a human would leave as JSX
- imported icon components, simple SVG glyphs, or decorative media
- avoiding repetition, shortening a page file, or making React code feel more
  "componentized"
- hiding `style={{ ... }}`, config objects, render callbacks, or other source
  shapes that should instead be rewritten into editable JSX/props

Authoring rules:

- Keep the page file structurally explicit around the island. The page should
  still own surrounding headings, captions, cards, layout, and copy. Only the
  dependency-heavy leaf should render as `<TravelExpenseCharts />`,
  `<MapPanel />`, or `<DataTable />` instead of embedding the third-party
  package JSX directly in the page return tree.
- Keep the island project-local, exported by a normal source file, and imported
  with a relative path or configured project alias.
- Do not mark runtime islands with `sourceHydration: "inline"` in the component
  registry. Inline hydration is for components whose internals should be parsed
  into the layer tree; charts, maps, editors, and other heavy islands should
  stay as runtime-rendered boundaries.
- Give the island a semantic prop contract. Prefer props such as `data`,
  `variant`, `defaultRange`, and `compact` over leaking third-party internals
  into the page.
- Do not pass complex JSX children or inline render functions into islands
  unless Workbench already has a specific runtime bridge for that prop shape.
- Keep static visual sizing in classes such as `h-[320px] w-full`; use inline
  style only for runtime geometry that the package requires.
- Provide stories or examples for islands that are part of a reusable component
  set, especially if their internals are not fully editable in Design preview.

This pattern is intentional but costly. A runtime island may render correctly
while its internal dependency tree remains less inspectable than ordinary source
JSX. Use it to contain runtime risk, not to tidy ordinary markup. The page
around it must remain selectable, inspectable, and safely editable.

Avoid broad bare-package runtime loading in the Design canvas to make a page
"just work." It can make the editor slower over time, create duplicate React
runtime issues, or trigger observer/measurement loops. If a package must render
in Design preview, isolate it in a local component and verify idle performance
with the Workbench open for at least 30 seconds.

## Data-Driven Runtime Collections

Behavior-heavy components may intentionally render repeated rows from a
source-backed array instead of exposing each runtime row as an authored child.
Use this boundary only when the user wants a data-driven region and Workbench
has a verified Binding writer for that array shape.

- Keep designer-owned shell slots such as input, trigger, and footer as explicit
  source children.
- Keep runtime rows free of fabricated Workbench source identities.
- Expose the backing array through a semantic prop such as `items` and verify
  that Binding can edit, add, delete, and reorder its rows.
- Never add hidden marker children or component-specific canvas projection code
  to make generated runtime rows look like authored JSX.

## Chart, CSV, And Data Components

Data-backed components need a source contract that Workbench can preserve.
Avoid making the rendered chart or table depend on opaque sample constants when
the user expects to edit the data in Inspector.

For chart cards and similar components:

- Prefer explicit props such as `dataCsv` and `seriesCsv` for Workbench-editable
  tabular data.
- Keep series metadata and numeric data together when the component needs both.
  Series are usually columns; category rows are usually data rows.
- Series labels, keys, and colors should be editable inline in the same table
  surface, and color cells should accept token-compatible color values.
- Chart type conversion is a source-backed component-type edit. It must preserve
  authored CSV/data props, titles, labels, colors, and unmanaged appearance
  props unless the user explicitly chooses a reset.
- Table Apply should commit one source history transaction for the user action.
  Do not commit every cell draft as a separate undo entry.
- If the runtime chart uses Recharts or another heavy package, keep that
  package inside a local runtime island and expose a small semantic prop
  contract to the page.

When a component exposes both Storybook controls and Workbench design controls,
the rendered component must respond to every editable prop. A visible control
that does not update the component is a component-contract bug.

## Workbench-Friendly Page Composition

Application examples from shadcn/ui, dashboard kits, or SaaS templates often use
provider-heavy runtime layouts. That structure is normal for a running app, but
it is not always a good source shape for Workbench editing.

Avoid making the page root a large opaque runtime composition such as:

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <SiteHeader />
    <DashboardContent />
  </SidebarInset>
</SidebarProvider>
```

This can be correct React, but in Workbench it creates weak canvas selection:
the layer tree may know about the internal nodes while the preview hit-test sees
provider/context boundaries, `display: contents` wrappers, portals, fixed
offcanvas containers, or runtime-generated DOM first.

For Workbench-authored pages, prefer a source-visible page shell:

- Keep `aside`, `header`, `main`, `section`, and important layout containers in
  the page TSX.
- Use shadcn components for visible primitives such as `Card`, `Button`,
  `Badge`, `Separator`, `Table`, and form controls.
- Keep providers close to the component family that truly needs them, or hide
  them inside a local component island when they are runtime plumbing.
- Do not use context providers, router shells, auth wrappers, data clients, or
  layout managers as the primary visual layer boundary.
- Keep charts, maps, virtualized tables, drag/drop tables, and other heavy
  dependencies as local runtime islands with a semantic prop contract.
- If a page is derived from an app example, rewrite the page-level composition
  into Workbench-editable structure instead of preserving the original runtime
  shell verbatim.

Workbench-friendly dashboard shape:

```tsx
<div className="min-h-svh bg-background">
  <aside className="hidden w-64 border-r lg:flex">...</aside>
  <main className="flex min-w-0 flex-1 flex-col">
    <header className="h-14 border-b">...</header>
    <section className="grid gap-4">
      <Card>...</Card>
      <ChartAreaInteractive />
      <DataTable data={data} />
    </section>
  </main>
</div>
```

In this shape, the layer tree, canvas hit-test, and Inspector all describe the
same visible structure. Runtime islands remain useful, but they are intentional
leaf boundaries rather than accidental wrappers around the whole page.

### Editable Page Source Guardrails

Workbench-authored pages are not ordinary refactoring targets. They are the
source shape designers inspect in Layers and Inspector. A page that renders
correctly but hides visible UI behind local helper components, imported icon
components, opaque objects, or expression props is not a good Workbench page.

For page files that should remain directly editable:

- Keep visible layout, copy, cards, badges, stats, labels, and ordinary icons as
  explicit JSX in the page. Do not introduce page-local micro-components such as
  `SectionLead`, `MetricTile`, `MiniStat`, or `StatCard` when their only job is
  to wrap a few repeated pieces of normal editable markup. This kind of helper
  is usually an agent convenience, not a human-authored design surface.
- If a repeated visual pattern deserves a component, promote it to a real
  project/library component with source, story metadata, registry/import
  coverage, and an editable prop contract. Do not leave it as a private helper
  below the page component.
- Runtime islands are still valid for heavy behavior such as charts, WebGL,
  canvas scenes, maps, editors, and virtualized grids. Their boundary should be
  obvious and intentional, with small semantic props. The page around the island
  should remain explicit JSX.
- Do not pass React component references, functions, config objects, or complex
  arrays as props for visible page UI unless Workbench already has a safe writer
  for that prop shape. Avoid patterns such as `icon={TrendingDown}`,
  `renderItem={...}`, `config={chartConfig}`, and `style={{ ... }}` in page
  authoring.
- Prefer string, number, and boolean literal props, token-compatible strings,
  CSV/table props, or explicitly supported source-backed data props. When
  chart/table data should be edited in Workbench, expose it through props such
  as `dataCsv` and `seriesCsv` rather than burying it in local constants or
  helper internals.
- Imported icon components from packages such as Lucide or Tabler are React
  components in the layer tree. Do not drop bare `<TrendingDown />`-style icon
  components into page JSX when the designer expects normal page editability.
  Use a registered icon wrapper/asset picker contract, an icon-name string prop,
  or inline static SVG for one-off decorative glyphs until an icon picker/write
  path owns that package shape.
- Static visual styling belongs in `className`, project CSS, tokens, and
  token-compatible attributes. If a canvas drag or manual edit creates
  `style={{ position: "sticky", top: "0px" }}` or similar static styling, move
  it back into classes such as `sticky top-0`.
- A good final sanity check for a page file is that the visible page return tree
  has no private helper component tags, no bare icon package component tags, and
  no non-literal JSX expression props except for deliberately supported runtime
  island controls.

## Inline Style Rules

Do not use inline styles for static visual styling.

Tailwind className edits are real source edits in Workbench. Treat them as
structural changes when they affect layout, sizing, visibility, or responsive
behavior:

This section is not a Tailwind ban. It exists to keep Tailwind-backed source
edits from being silently converted into inline styles or fragile bulk
rewrites.

- Prefer changing one class group at a time, especially around `h-*`, `w-*`,
  `size-*`, `min-*`, `max-*`, `grid-*`, `flex-*`, `basis-*`, `px-*`, and
  responsive variants.
- Do not mix Tailwind sizing edits with canvas resize gestures on the same
  node. If a node already uses Tailwind sizing classes, update the `className`
  rather than writing inline `style` dimensions.
- Keep chart/map/editor islands wrapped in a stable parent with explicit
  Tailwind sizing such as `h-[320px] w-full`; do not rely on the third-party
  library to infer height from an unconstrained parent.
- If a Tailwind edit causes the page to reflow heavily, verify selection,
  overlay highlight, and layer tree responsiveness before continuing with more
  source edits.
- Avoid using className edits as a bulk refactor path inside Design preview.
  For broad layout changes, edit the TSX source directly and then reopen the
  Design preview.

Avoid:

```tsx
<div style={{ padding: '12px 16px', borderRadius: 12 }} />
<span style={{ color: '#ff2b7a' }} />
<Stack style={{ gap: 8 }} />
```

Use component classes and token-backed CSS instead:

```tsx
<div className="example-component-card" />
```

```css
.example-component-card {
  padding: var(--your-library-space-3) var(--your-library-space-4);
  border-radius: var(--your-library-radius-md);
  color: var(--your-library-color-accent);
}
```

Inline style is allowed only for:

- CSS variable assignment from component props.
- Runtime geometry such as measured drag position, canvas size, or transform
  values.
- Values produced by a third-party integration that cannot be expressed through
  the design system.

Even in allowed cases, prefer a scoped CSS variable:

```tsx
<div
  className="example-progress"
  style={{ '--example-progress-value': `${progress}%` } as React.CSSProperties}
/>
```

```css
.example-progress {
  inline-size: var(--example-progress-value);
}
```

## Workbench Edit Safety

Components may contain runtime-only internals, but the boundary must be honest.
Do not make a component appear editable by routing Inspector writes to a
fallback node or by changing preview rendering mode after selection.

Rules:

- Preserve `className` on the intended root or slot and merge it with component
  variants. Do not swallow user-authored Tailwind utilities or project classes.
- Keep read-only or runtime-only internals selectable only as read-only
  boundaries. The red source-preview selection state is preferable to a hidden
  remount or fake editable subtree.
- Expected read-only cases include runtime island internals, third-party
  primitive DOM, generated data rows without a safe backing-data writer,
  computed text/class/style expressions, SVG/canvas/media/embed internals,
  provider/runtime plumbing, generated files, package internals, and files
  outside the project root.
- When a child is read-only, expose an editable parent prop, slot, token,
  table/CSV data surface, source binding diagnostic, or wrapper-level control
  rather than pretending the child DOM is directly editable.
- Selection overlays, focus rings, and resize handles must not change component
  layout, scroll size, or runtime measurements.
- Interactive controls are controls first. Slider thumbs, select triggers,
  menu content, inputs, switches, and drag handles must keep their native or
  primitive interaction behavior while Workbench selection remains possible.
- State/breakpoint override props should not be added as a Workbench-only
  editing layer. Use real responsive classes, project CSS, component variants,
  or token modes.

## Token Rules

Before introducing any raw visual value, check existing tokens first. If no
token exists and the value is reusable, add one.

Tokenize these values:

- Color, gradient, opacity
- Spacing, gap, padding, inset
- Radius and border width
- Shadow and elevation
- Typography size, weight, line-height
- Component dimensions such as badge height, avatar size, media ratio presets
- Motion duration and easing
- Z-index values that represent reusable layering semantics

Do not hide new values inside CSS as anonymous numbers:

```css
/* Avoid */
.example-card {
  gap: 14px;
  border-radius: 11px;
}
```

Instead add or reuse tokens:

```css
.example-card {
  gap: var(--your-library-card-gap);
  border-radius: var(--your-library-card-radius);
}
```

When adding tokens:

- Update the active project or library token source.
- Update any preset token source that mirrors the component library.
- Update generated token CSS when the project checks it in.
- Use semantic names. If the value belongs to a component, make the component
  name part of the token.

### Starter Token Layering

Workbench starter and bundled component sets should use a three-layer token
model:

- Primitive tokens are raw material values such as `blue-600`, `radius-sm`,
  `font-size-md`, `font-weight-semibold`, and `card-shadow`.
- Semantic tokens describe design roles such as `action-primary`,
  `muted-surface`, `control-sm`, or `card-shadow`.
- Component tokens describe the value as consumed by a component, such as
  `button-height-md`, `progress-track`, `slider-thumb-size`, or
  `table-cell-padding-x`.

For starter projects, keep primitives and components as separate collections.
Use groups inside each collection for sub-structure. Split semantic tokens into
role-based collections so the Token Editor remains manageable:

- `tailwind-primitives`: raw Tailwind scale values such as palette, spacing,
  size, radius, shadow, and type scale material.
- `workbench-components`: component-scoped tokens only.
- `workbench-semantic-color`: surface, border, action, feedback, and text color
  roles.
- `workbench-semantic-radius`: radius roles only.
- `workbench-semantic-effect`: shadow/elevation/effect roles only.
- `workbench-semantic-typography`: type size, weight, and line-height roles.

Semantic collections should be reference-token collections, not raw-value
collections. Put raw values in `tailwind-primitives`, then make semantic tokens
reference those primitives. Semantic collections should also carry useful modes:
`workbench-semantic-color` and `workbench-semantic-effect` use `Light` and
`Dark`; `workbench-semantic-radius` and `workbench-semantic-typography` use
`Base` and `Compact`.

This is not only a naming convention. It is the authoring contract:

- Primitive collections own raw values and usually have a single `Default` mode.
- Semantic collections own design intent, must use `kind: "ref"` values, and
  must expose modes for theme, density, or other role-level switching.
- Component collections own component API-facing values and should be what CSS
  consumes directly.
- Groups are for sub-structure inside a collection. Do not create separate
  primitive color/radius/typography collections for the starter set unless the
  source design system requires that split.
- Do not put primitive raw values in semantic collections.
- Do not put semantic role tokens directly in component groups.
- Do not make component CSS reference primitive tokens directly.

The intended reference direction is:

```text
component token -> semantic role token -> primitive raw token
```

### Astryx Styling Integration Path

For Astryx-backed projects, follow the official Astryx integration guidance:
choose the narrowest integration path that fits the styling library. Most DOM
styling should stay on the CSS-variable path. JavaScript token resolution is for
APIs that cannot consume CSS custom properties.

| Path | Use when | Value shape |
| --- | --- | --- |
| CSS variable aliases | The library ultimately writes CSS and accepts string values | `var(--color-text-primary)` |
| StyleX token imports | You are writing StyleX styles in application code | `colorVars['--color-text-primary']` |
| Tailwind bridge | You want utility classes backed by active system tokens | `@astryxdesign/core/tailwind-theme.css` |
| Token resolver APIs | JavaScript needs token values for charts, canvas, SVG, or config objects | `resolveThemeToken(theme, '--color-data-categorical-blue', { mode })` |

Do not use JavaScript token resolver APIs for ordinary DOM styling when CSS
variables can express the value. Do not add a Tailwind bridge just to work
around a component stylesheet that can consume token variables directly.

Example token value shape:

```json
{
  "id": "action-primary",
  "type": "color",
  "values": {
    "light": { "kind": "ref", "collectionId": "tailwind-primitives", "tokenId": "blue-600" },
    "dark": { "kind": "ref", "collectionId": "tailwind-primitives", "tokenId": "blue-400" }
  }
}
```

Before considering starter token work complete, verify:

- Every `workbench-semantic-*` collection has meaningful modes.
- Every value inside `workbench-semantic-*` is `kind: "ref"`.
- Every component stylesheet uses `--ds-token-workbench-components-*` for
  reusable visual values.
- Typography is represented across all three layers: primitive raw values,
  semantic typography roles, and component typography tokens.
- Text color is represented in `workbench-semantic-color`, not
  `workbench-semantic-typography`. Component styles should still consume text
  color through component tokens such as `text-color-primary`,
  `text-color-muted`, `text-color-on-accent`, and `text-color-danger`.

Do not point component CSS directly at semantic or primitive tokens unless the
value is truly global and has no component-specific meaning. Component CSS
should usually use variables from the component collection, for example:

```css
.wb-progress__track {
  block-size: var(--ds-token-workbench-components-progress-track-height);
  background: var(--ds-token-workbench-components-progress-track);
}
```

When adding a new component, add its reusable values as component tokens first,
then have those tokens reference the appropriate semantic collection. Only add a
new semantic token when the role is reusable across components. Only add a new
primitive token when the raw value is a reusable design material.

Before adding that primitive, search existing primitives using normalized
`type + unit + value`. If `40px`, `1px`, or an equivalent color already exists,
reference it instead of creating another raw token. Component authoring is
incomplete when it creates duplicate raw values or skips the semantic role
between component and primitive layers. Structured authoring and MCP token
operations must apply the same validation before writing.

Component-token registration is part of component authoring, not optional
cleanup. A new visual component is not complete until reusable component-owned
values have entries in `.workbench/tokens.json`, generated token CSS is aligned
when checked in, and the component stylesheet consumes
`--ds-token-workbench-components-*` variables. If no component tokens are added,
the handoff must explicitly say which existing component tokens cover the
styles, or why the remaining raw values are one-off runtime geometry.

Good token names:

- `badge-height-sm`
- `video-list-card-gap-horizontal`
- `media-frame-overlay-bottom`
- `post-list-item-caption-gap`
- `component-card-radius`

Poor token names:

- `pink-1`
- `new-gap`
- `card-thing`
- `12px`

If a raw value is intentionally not tokenized, leave a short code comment or
handoff note explaining why it is runtime-specific or not reusable.

## Motion Rules

Interactive primitives must animate in both directions when state changes.
For boolean or selected states such as toggle on/off, open/closed, active/inactive,
or selected/unselected:

- Define the animated property in both the resting and active CSS states.
  For example, use `transform: translateX(0)` in the resting state and
  `transform: translateX(...)` in the active state instead of relying on the
  browser to animate from or to an implicit `none`.
- Transition the exact property that changes. If the state changes
  `background-color`, transition `background-color`, not only `background`.
- Verify both directions in the browser: off -> on and on -> off. A one-way
  transition is a component bug.
- Respect reduced-motion needs when adding larger movement or long-duration
  transitions.

## Props And Controls

Every public prop should be represented in component story controls unless it
is purely internal.

Use the right control type:

- `text`: strings, labels, URLs, token-bindable text values
- `boolean`: true or false state
- `select`: finite variant choices
- `number`: numeric values
- `icon`: icon name controls

Only `text` controls can use token or asset pickers in the current Workbench
control model. Boolean, select, icon, and number controls must not expose token
or asset picker metadata.

Group and order controls so users can scan them:

- Layout
- Content
- Metadata
- Media
- Avatar
- Badge
- Appearance
- Behavior
- Accessibility

If raw story metadata is not enough to create a good Inspector experience,
update the prop registry metadata instead of relying on accidental ordering.

### Default Props Must Re-render In Workbench

Workbench users expect Inspector and Storybook control changes to update the
preview immediately. React and browser `default*` props such as
`defaultValue` and `defaultChecked` are often only initializers, so they can
become stale when Workbench edits source props on an already-mounted instance.

When exposing a `default*` prop:

- Verify that changing it in Storybook controls and the Design editor visibly
  updates the component.
- If the component wraps a native input, remount the input with a stable
  `key={String(defaultValue)}` / `key={String(defaultChecked)}` or promote the
  prop to controlled state.
- If the component owns compound state, sync the incoming default into local
  state with an effect and update local state from browser interaction.
- Keep the public prop name compatible with the source component contract. If
  Workbench insertion cannot safely emit a JSX expression, accept a string form
  too. For example, an accordion can accept both `defaultValue={['item-1']}` in
  hand-authored source and `defaultValue="item-1"` from `sourceInsert.props`.
- Do not expose a prop in `argTypes` if the component no longer implements it.
  A visible but inert control is a product bug.

For icon buttons, follow the actual component API rather than only the visual
class. In shadcn/ui, `size="icon"` is a square-size variant and users pass an
icon as `children`. In Workbench source components, icons are often selected
through props such as `leadingIcon` or `trailingIcon`; in that case
`size="icon"` must render exactly one icon, hide the visual text label, and
preserve the text as the accessible name.

## Tailwind Source Authoring

Tailwind is allowed in source-backed projects. Treat it as project source, not
as a Workbench-only styling shortcut.

This supersedes older non-Tailwind-era assumptions. Workbench authoring should
preserve and edit Tailwind utilities in `className`; restrictions against
inline styles, arbitrary raw CSS, or broad automatic class rewrites are not
restrictions against Tailwind itself.

Authoring rules:

- Keep meaningful utility classes in `className` so Workbench can show and edit
  them as Tailwind chips in the Inspector.
- Use Tailwind for ordinary composition and layout when it is the clearest
  source expression: `relative`, `absolute`, `inset-*`, `z-*`, `grid`, `minmax`,
  `overflow-*`, `object-cover`, `backdrop-blur`, `aspect-*`, spacing, sizing,
  color, state, and responsive utilities are valid in page/component source.
- Put those utilities on registered components whenever the element should
  remain selectable and inspectable as that component. For example, an overlaid
  media card should be composed from registered `Card`, media/aspect-ratio, and
  `Button` components plus native semantic text styled with Tailwind utilities,
  not from a page-only wrapper that only the browser can understand.
- Prefer project-provided compiled Tailwind CSS for visual fidelity. Configure
  `.workbench/workbench.config.json` with `extensions.tailwind` when the project
  uses Tailwind.
- Keep Tailwind config paths project-relative. Use paths such as
  `src/index.css`, `src/workbench-tailwind.css`, and
  `src/workbench-tokens.css`; do not write local machine paths, Vite `@fs`
  paths, or copied absolute project paths into `.workbench` metadata.
- Keep shadcn theme variables, such as `--background`, `--foreground`,
  `--primary`, `--radius`, and chart/sidebar variables, in CSS that Workbench can
  load as token or theme CSS.
- Use `className` composition intentionally. Static string classes are easiest
  for Workbench to edit; expression-built class names should preserve enough
  source metadata for the Binding tab or raw `className` editor.
- When a Tailwind class-backed node is selected, prefer editing size/layout
  through utility classes. Do not write `width`, `height`, `min-width`,
  `min-height`, `max-width`, or `max-height` as JSX inline styles unless the
  source already intentionally owns that inline style and the edit is clearing
  or maintaining it.
- Tailwind chip editing should be conservative. Adding a utility should append
  the requested class; replacing or removing existing classes should be an
  explicit user action, not an automatic conflict-resolution side effect.
- Do not encode reusable design intent only as arbitrary values if a project
  token or CSS variable can express it.
- Do not add a one-off component prop for every Tailwind utility. Component
  props should remain semantic; Tailwind class editing belongs to the source
  `className` surface.

The Workbench Tailwind runtime can help the Design canvas approximate classes
found in source, including common spacing, layout, sizing, typography, color,
border, shadow, responsive, dark, state, and arbitrary-value patterns. It is a
preview support layer, not the Tailwind compiler. If the real project uses
plugins, complex variants, or generated utilities, ensure the compiled CSS path
is configured and kept in sync. Workbench can recover from older absolute CSS
paths when they clearly contain `src/` or another known project root segment,
but new component libraries and generated starter projects should never rely on
that recovery path.

The fallback runtime should still grow toward broad coverage of Tailwind's
built-in DOM utility set. Missing runtime utilities should be treated as Design
canvas fidelity gaps, especially when the source class is valid Tailwind and the
project has no compiled CSS path yet.

## Data, Maps, And Source Expressions

Modern React components often render from arrays, JSON imports, and `.map(...)`.
Workbench should preserve those source shapes.

When authoring source that should remain understandable in Workbench:

- Prefer named local arrays or imported JSON for repeated UI data. This lets the
  Inspector Binding tab show the source and, when safe, expose array rows for
  editing.
- Keep item object keys meaningful, for example `title`, `url`, `icon`,
  `status`, `reviewer`, `className`, and `description`.
- Include icon fields when the rendered UI has icons. If the value is a
  component reference instead of a string, expect Workbench to show it as source
  metadata until an icon picker/writeback path supports that specific shape.
- Treat `.map(...)` nodes as source expressions, not text. The layer tree may
  show a map/expression placeholder and the Binding tab should show the code or
  connected array, instead of pretending the generated children are independent
  static nodes.
- For tables and charts, expose the connected data source. If the source is a
  JSON import, Workbench should show the import path, row count, and field names.
  If the source is a filtered or computed expression, Workbench should show the
  expression and any discoverable upstream source.
- Do not break data-driven components into manually duplicated JSX just to make
  every row directly selectable. Prefer source metadata and targeted array/data
  editors.

## Story And Design Editor Requirements

Stories are not just documentation. Workbench uses them as component insertion
and editing metadata.

Each component story should include:

- Practical default args.
- Realistic content examples, not placeholder-only text.
- Small or compact examples when the component has size variants.
- Variants that cover important layout modes and states.
- Controls with clear labels, groups, order, and picker behavior.

The Design editor must be able to edit the same meaningful props that Storybook
shows.

When adding or changing props:

- Keep source insert defaults sensible.
- Keep `sourceInsert.props` aligned with required defaults.
- Do not add a prop only to Storybook `argTypes`. For every meaningful
  designer-editable prop, verify the component TSX consumes it, the story render
  passes it, and `sourceInsert.props` or `sourceInsert.jsxChildren` creates
  source where Workbench can inspect/edit it after insertion.
- Give each control a one-sentence `argTypes[key].description` (the Storybook
  field) in the component's own terms. The Design Inspector shows it as the
  prop label's tooltip, so it is the designer's only in-app explanation of what
  the prop changes. A project's prop registry may override it per component
  the way it overrides a label.
- Use `sourceInsert.jsxChildren` and `sourceInsert.imports` for compound
  components whose default insertion must include sub-components. Do not insert
  a naked root when the component is only meaningful with children.
- Keep prop registry metadata aligned when labels, groups, order, or picker
  behavior need to differ from raw story metadata.
- Do not rely on fallback values that reappear after a user clears a prop.
- For editable fields, do not let a source insertion default such as
  `value: ""` make the preview immutable. Sync external value/default changes
  into local state, then update that local state on browser input.

## Figma Primitive Implementation Requirements

When implementing primitives from a Figma component set, also read
`docs/WORKBENCH-V1-FIGMA-PRIMITIVE-IMPLEMENTATION-NOTES.md`.

The short version:

- Treat Figma variant axes as component API. Mirror meaningful axes in source,
  story controls, source insertion defaults, and prop registry metadata.
- Make Inspector initial props match the actual preview state. A mismatch here
  is a product bug, not a cosmetic issue.
- Implement real browser behavior for expected hover, focus, selection, and drag
  states. Keep static `state` props for inspection, but do not make them the
  only way to see normal interaction states.
- If an optional asset prop is cleared or empty, remove that slot. Do not render
  a broken image and do not silently restore an internal fallback asset.
- Keep default asset paths in story/source insertion defaults when the user must
  be able to clear the prop in Inspector.
- Promote reusable Figma subparts, such as `Knob` and `Tooltip`, into their own
  primitives instead of hand-rolling them inside parent components.
- After Storybook verification, place representative instances on a source-backed
  page and verify Design Editor layers and preview iframe output.

## Registration And Discovery

A component only becomes insertable and editable in Workbench after it is
registered into the project component registry
(`<project>/.workbench/components.json`). Shipping the `.tsx` export and the
`index.ts` re-export is not enough on its own. Registration pairs each exported
component with a story, so the rules below matter most when you add a **new
export to an existing component file** (for example a sub-component like
`SgDsLibraryTabsBar` added to `Tabs.tsx`) — that case is easy to miss because
the file already imports cleanly.

How discovery and registration work:

- Import discovery scans a source file for every exported component (any export
  that returns JSX). Each becomes a registry candidate.
- Each candidate is paired with a **story export by name**: the story export
  name (or its `name` field) must match the component's export suffix. The
  library prefix is implied — `SgDsLibraryTabsBar` pairs with a story export
  named `TabsBar`, the same way `TabsList`, `Tab`, and `TabsPanel` do. A
  component with no matching story export does not register cleanly and will not
  appear in the picker.
- `childrenSlotKind` (`block` / `inline`) is inferred from whether the component
  renders `children` and from its root element. It gates the editor's
  "Add child" action and what can be dropped inside. Block-slot container
  components (rows, groups, wrappers) must resolve to `block`.

### Compound Components And Child Whitelists

Some libraries use compound components whose children are not arbitrary content.
Examples include Accordion, Tabs, Table, Menu, Select, and Dialog families.
These must be registered and constrained as a family:

- Register each exported sub-component that users can insert or inspect, not
  only the root component.
- Give each sub-component its own matching story export so Storybook metadata,
  Design editor insertion, and registry discovery all point at the same export.
- Mark true containers with `childrenSlotKind`. Use `block` for structural
  containers and `inline` only when the component can safely receive text-flow
  children.
- Declare the child contract in the component's own CSF story when a container
  should only receive specific sub-components. A broad `block` slot is not
  enough for structure-sensitive components, and source inference cannot
  derive the contract: it only reports whether a component renders `children`,
  which on its own means "accepts anything".

  ```ts
  const meta = {
    title: 'Astryx/Table',
    authoring: {
      allowedChildren: ['AstryxTableHeader', 'AstryxTableBody', 'AstryxTableFooter'],
    },
  };
  ```

  Registry hydration copies `authoring.allowedChildren` into the component's
  registry extensions, and project load replays it into the source slot
  registry, so the Design canvas "Add child" picker offers exactly those
  children. A declared allowlist is strict: the parent takes those components
  and no raw HTML tags. Put it on the story export in a multi-component story
  file so siblings do not inherit the parent's allowlist.

- Use `authoring.hiddenFromInsert` to keep a compound sub-part out of root
  insert pickers. It overrides the story-export-name heuristic in both
  directions, which matters for libraries whose convention is one story export
  named exactly like its component — the heuristic reads every such export as
  a root component.
- Use `authoring.group` to file the component under a picker category:
  `Actions`, `Inputs`, `Navigation`, `Feedback`, `Overlays`, `Layout`,
  `Typography`, `Media`, `Data`, `Content`, `Chat`, or `Foundation`. Without it
  a component falls back to its component set, which collapses a whole library
  into one undifferentiated group. Sub-parts take the same group as their
  family root so a child picker stays readable.
- `src/domain/document/sourceSlotContainers.ts` still carries Workbench-owned
  allowlists for the bundled shadcn family, and a story declaration wins over
  them. Do not add project or library component names there; declare them in
  the component's story instead. Note that a project-local component
  deliberately overrides a same-name built-in allowlist, so a bundled entry
  will not constrain a component the project owns.
- Make root insertion produce a valid composed tree. For an Accordion-like
  component, inserting the root should create
  `Accordion > AccordionItem > AccordionTrigger + AccordionContent`, not an
  empty root.
- Use `sourceInsert.imports` to add sibling sub-component imports and
  `sourceInsert.jsxChildren` for the initial child tree.

The Accordion pattern is the reference contract:

```tsx
<Accordion defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Component contract</AccordionTrigger>
    <AccordionContent>...</AccordionContent>
  </AccordionItem>
</Accordion>
```

The Design editor should then allow:

- `Accordion` -> `AccordionItem`
- `AccordionItem` -> `AccordionTrigger`, `AccordionContent`

and block unrelated drops such as `Button` directly inside `Accordion`.

### Design Canvas Wrapper-Sensitive Components

Some valid React components are sensitive to an extra editor-only wrapper
between a parent and child:

- parent components that inspect child component types or child props before
  rendering official slots
- compound families whose root owns its children at runtime
- grouped controls that use `:first-child`, `:last-child`, adjacent sibling, or
  child-combinator selectors for connected borders and radii
- slot markers that render data attributes for parent-side parsing
- overlay/portal triggers such as Select, Combobox, Popover, DropdownMenu,
  HoverCard, DatePicker, Dialog, Sheet, and Drawer
- shell/layout containers such as AppShell, SideNav, TopNav, Grid, Stack,
  ButtonGroup, Item/ItemSlot, and AvatarGroup

Do not paper over these cases with fake fallback root props, duplicated hidden
children, or project CSS that only targets the Workbench canvas. If the source,
stories, `sourceInsert`, registry linkage, and browser/page preview are valid,
fix the Design preview runtime so selection metadata is applied directly to the
affected component root or sub-component, or so slot-marker children are
rendered as runtime-owned children before reaching a parent that parses child
types. Astryx examples include `Button` inside `ButtonGroup` for segmented
first/last-child styling and `ItemSlot` inside `Item` for parent slot
collection.

Do not maintain a component-name allowlist that decides which runtime
components avoid selection wrappers. Wrapperless root-prop projection is the
default for every source-backed runtime component. If a component does not
forward injected root props, fix its source contract or expose it as an honest
non-hit-testable boundary; do not add an editor-only DOM node that changes flex,
grid, intrinsic height, overflow, or direct-child CSS behavior.

Forward `className` and unconsumed root props to the same real DOM root. The
Design runtime preserves a component-owned `ref` and adds a neutral marker to
the forwarded class list, so libraries that intentionally filter unknown
`data-*` attributes still expose an accurate root box without receiving an
editor ref or editor-owned click/pointer/keyboard handlers. Authored interaction
props remain untouched. For DOM-less compound wrappers, prefer routing the root
class to the primary visible trigger. If an official library only accepts the
class on its controlled menu or dialog surface, expose a real `aria-controls`
relationship from the visible trigger so Workbench can measure and select the
closed component without wrapping its Fragment root.

Workbench resolves these controls from the rendered relationship: a controlled
surface owns its trigger before the nearest visible source marker, which in turn
precedes an ancestor runtime-owner fallback. Command/Ctrl-click selects the
nearest rendered source boundary without executing the control. An ordinary
click keeps the current selection and executes the control. When the same selected control is
pressed and moved, Workbench starts dragging only after the shared movement
threshold is crossed; a press or click alone must not become a drag.

Selecting an authored runtime control or portal item is editor bookkeeping, not
a request to move DOM focus to the preview root. Preserve the focused control
while applying that selection so Typeahead, Combobox, and similar overlays do
not interpret the editor selection as a runtime blur. Real runtime activation
and ordinary focus movement within the preview keep the component's own focus
behavior. While an overlay trigger remains focused and expanded, an ordinary
click elsewhere on the Design canvas is also editor selection: it must not
become the component's outside-click or native popover light-dismiss. The
runtime activation chord keeps the component's actual outside-click behavior.

Wrapper-sensitive fixes are not complete until a real Design canvas check proves
all of the following:

- The parent and child still appear as meaningful layer rows.
- Selecting the parent and a nested child shows their registered Inspector props.
- The browser/page preview and Design canvas have the same layout and interaction
  behavior.
- Portal content stays inside the Workbench preview portal and does not become
  the selectable source boundary for the trigger.

When adding a new component or a new export, do all of:

- Export the component from its `.tsx` and add it to the library `index.ts`.
- Add a **dedicated story export whose name matches** the component suffix, with
  realistic default children and `sourceInsert.props`. Reuse the same story
  file as its siblings when the export lives in a shared file.
- Mirror the change to the preset copy when the repository keeps both
  (`sg-ds-library-preset/`).
- Re-import the library (or source file) so the registry is reconciled — this
  re-discovers every export in the file and adds the new entry. A re-import that
  only refreshes already-pinned entries will not pick up a brand-new sibling
  export; trigger a discovery that re-stages the file.
- For app-owned container names that must be recognized regardless of import
  timing, also add the name to the block-slot allowlist in
  `src/domain/document/sourceSlotContainers.ts`
  (`SOURCE_COMPONENT_BLOCK_SLOT_CONTAINER_NAMES`).
- For structure-sensitive compound components, add or update the explicit
  parent-child whitelist next to `canMoveSourceChildIntoParent`.

After any registry change, **reload the project** — the running app reads
`components.json` at project load, so a new entry is invisible until reload, and
an unsaved in-memory registry can overwrite a hand-edited entry if you act
before reloading. Prefer re-import over hand-editing `components.json`; only
hand-edit (mirroring a sibling entry exactly) when re-import cannot reach the
new export.

## CSS Structure

Use CSS classes and data attributes for variants and states:

```tsx
<article
  className="example-list-card"
  data-size={size}
  data-orientation={orientation}
/>
```

```css
.example-list-card[data-size='sm'] {
  --example-list-card-title-size: var(--your-library-font-size-sm);
}
```

For theme-media variants, keep the automatic path explicit. A prop such as
`colorMode="auto"` should omit attributes like `data-theme` or
`data-*-media`, so the component follows ancestor preview appearance. Only
write `data-theme="light"`, `data-theme="dark"`, or library-specific media
attributes when the user intentionally fixes that component or region.

Avoid duplicating whole component blocks for minor variant differences. Prefer
modifier classes, data attributes, and scoped CSS variables.

Avoid expanding component APIs with low-level style props such as
`paddingTop`, `borderLeftWidth`, or `marginBottom` unless that property is a
real semantic part of the component contract.

## Project Library CSS Loading

Workbench design preview does not rely only on the component's TypeScript import
graph to discover project library CSS. At project load, Workbench reads
`<project>/.workbench/components.json`, looks at
`extensions.libraries[<libraryId>].snapshotRoot`, and loads:

```text
<snapshotRoot>/components/<libraryId>.css
```

For the default project-local library, this usually means:

```json
{
  "extensions": {
    "libraries": {
      "local": {
        "id": "local",
        "sourcePath": "src/components",
        "snapshotRoot": "src"
      }
    }
  }
}
```

```text
src/components/local.css
```

The component source can still import that file, for example
`import './local.css';`, so standalone Vite or Storybook rendering uses the same
styles. The registry path still has to match Workbench's preview loader.

Do not set `snapshotRoot` to `src/components` for the default local library
unless the actual CSS file is intentionally at
`src/components/components/local.css`. That double `components` path is almost
always a registry mistake and causes the design preview to render unstyled or
appear to flicker while the standalone app looks correct.

If the preview is unstyled, flickers, or the console shows
`Project library CSS could not be loaded`, check the library `id`,
`snapshotRoot`, and CSS filename together. After changing `components.json`,
reload the project so the in-memory registry and preview CSS loader pick up the
new path.

Workbench also crawls project-local CSS imports from registered pages,
registered component source files, the app entry module, and local modules they
import. Use project-local imports for component CSS:

```tsx
import './Button.css';
import '../workbench-tokens.css';
import '@/components/ui/button.css';
```

CSS files may import other project-local CSS files:

```css
@import './button-base.css';
@import '../workbench-tokens.css';
```

Do not rely on bare package CSS imports as the only design-preview styling
path:

```tsx
import 'some-package/dist/styles.css';
```

That may work in a standalone Vite page while staying invisible to Workbench's
project-local design-preview CSS crawler. Wrap or copy the required package CSS
into a project-owned stylesheet, then import that local stylesheet from the
component or library barrel.

Keep every CSS path project-relative. Avoid local machine paths, Vite `@fs`
paths, `file://` URLs, localhost stylesheet URLs, and paths that point into
`node_modules`, `.workbench`, or `dist`.

For Tailwind projects, also configure `.workbench/workbench.config.json`:

```json
{
  "extensions": {
    "tailwind": {
      "enabled": true,
      "sourceCss": "src/index.css",
      "compiledCss": "src/workbench-tailwind.css",
      "tokenCss": "src/workbench-tokens.css"
    }
  }
}
```

`sourceCss` is the Tailwind input CSS. `compiledCss` is the Workbench preview
CSS generated from that input. `tokenCss` is optional CSS variable output used
for theme variables. When `compiledCss` exists, Workbench loads it instead of
double-loading `sourceCss` or injecting Workbench-generated utility CSS.
Workbench's approximate utility fallback is exclusive to Tailwind-enabled
projects that do not configure `compiledCss`; it must not fill perceived gaps
inside a configured compiled snapshot.

All three paths must stay project-relative. Do not persist paths from a local
machine, mounted volume, or Vite dev server URL. If a project
is moved from one folder to another, the config should still read exactly like
the example above.

The local dev server watches Tailwind-relevant project files and can resync the
compiled preview CSS. If the Design preview differs from browser preview, check
that the compiled CSS exists, the config paths are project-relative, and the
Tailwind source file has been saved so the watcher can resync. Do not compensate
for a stale compiled file by adding preview-only utilities.

## Asset, Icon, And Font Source Rules

Use the asset manager for project media that designers need to inspect or reuse:

- images and videos go under the project public asset space
- icon sets can be installed under `/workbench-assets/icons/...`
- fonts can be installed under `/workbench-assets/fonts/...`
- `.workbench/assets.json` should describe installed assets so the Inspector and
  pickers can show useful names and usage values

Do not draw ad hoc icons in page TSX when an open-source icon set is the source
of truth and Workbench has a registered way to represent that icon identity.
Install/register the icon set or use an existing dependency such as Lucide or
Tabler, then keep icon identity visible through props, array data, or asset
metadata.

For Workbench-authored page files, do not import bare package icon components
and render them directly as visible page children, such as `<TrendingDown />`.
That makes the layer tree expose a package component boundary instead of an
editable icon contract. Prefer a project-owned icon component with an `icon`
string prop, an asset-backed icon reference, or a deliberately inline static SVG
for a one-off decorative glyph until the package icon set has a first-class
Workbench picker/writeback path.

## Accessibility

New components must include the expected accessibility surface:

- Button-like elements use `button` unless navigation requires `a`.
- Images have meaningful `alt` text or explicit decorative handling.
- Icon-only buttons have an accessible label.
- Toggleable state is exposed with native controls or ARIA where appropriate.
- Disabled and loading states are represented semantically and visually.
- Text truncation should not remove essential accessible names.

## Verification

Before finishing component work, run the relevant checks:

```bash
npm run check
npm run workbench:check-starter
npm run workbench:check-design
npm run build
```

For visible UI changes, verify in the browser.

For Workbench-authored page work, also run an editability scan before handoff:

- Search the page source for `style={{`, bare icon package imports/usages,
  private helper component tags, and expression props such as `icon={...}`,
  `config={...}`, `renderItem={...}`, or function/object props.
- If possible, run an AST-based JSX prop scan and review every prop whose value
  is not a string, number, or boolean literal. Keep only deliberate runtime
  island controls or source-backed data props with a known writer.
- Reopen or reload the Design preview after source cleanup and confirm Layers
  show editable page structure rather than private helper/icon component
  boundaries.

## Final Checklist

Before handing off, confirm:

- Page source defaults to raw editable JSX. Any new component boundary is a real
  user/design-system reusable contract, not an agent convenience.
- No static visual styling is implemented with inline `style`.
- Workbench-authored page files do not hide ordinary visible structure behind
  page-local helper components. Repeated sections are either explicit JSX,
  registered project/library components, or intentional runtime islands.
- Page JSX does not pass bare React component references, render callbacks,
  config objects, or unsupported arrays as visible prop values. Use literal
  props, token-compatible strings, CSV/table props, or supported data bindings.
- Page JSX does not render bare package icon components such as Lucide/Tabler
  icons directly. Use a registered icon contract, asset-backed icon reference,
  icon-name prop, or inline SVG for one-off decorative glyphs.
- New raw visual values were tokenized.
- Token files and generated token CSS are in sync where needed.
- Story controls are grouped, ordered, and typed correctly.
- Design editor props match the Storybook/component contract.
- Boolean/select/icon/number props do not expose token or asset pickers.
- Text props that should bind to tokens or assets use the correct picker.
- Component works in realistic small and large content cases.
- Project and preset copies are synchronized when both exist.
- New or renamed exports have a name-matched story export and are registered in
  the project `components.json` (re-import, then reload the project).
- Project library CSS resolves through
  `<snapshotRoot>/components/<libraryId>.css`; for the default local library,
  this is usually `src/components/local.css` with `snapshotRoot: "src"`.
- Container components resolve to the correct `childrenSlotKind` so "Add child"
  works in the editor.
