# Workbench V1 Shared Agent Guide

This is the shared operating guide for Codex Desktop, Claude Code, and any
other workspace agent working in this repository.

The goal is to keep agent behavior aligned by putting product and engineering
rules in one shared document. `AGENTS.md` and `CLAUDE.md` should stay thin
entry points that point here instead of growing separate summaries.

## Required Reading

Before non-trivial Workbench V1 work, read this guide and the relevant source
documents:

- `docs/WORKBENCH-V1-CORE-TRIAGE.md`
- `docs/WORKBENCH-V1-PRODUCT-PHILOSOPHY.md`
- `docs/WORKBENCH-V1-ARCHITECTURE.md`
- Token editor work also requires
  `docs/WORKBENCH-V1-TOKEN-EDITOR-ARCHITECTURE.md`
- Component creation or editing also requires
  `docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md`
- Dependency-backed preview runtime work for Radix, Base UI, or shadcn/ui
  wrappers also requires
  `docs/WORKBENCH-V1-RADIX-BASE-PREVIEW-HANDOFF.md`
- Figma-imported primitive or library component work also requires
  `docs/WORKBENCH-V1-FIGMA-PRIMITIVE-IMPLEMENTATION-NOTES.md`

There are additional domain specs under `docs/`, including boundary rules,
edit operations, identity rules, styling philosophy, source-of-truth rules,
history/autosave, and source-backed handoff. Consult them when a task touches
their area.

Treat these docs as working references, not a one-time startup ritual. Reopen
the relevant guide before changing source shape, registry contracts, preview
runtime boundaries, component authoring patterns, token/CSS paths, or local
project I/O behavior. Re-check the guide again before handoff so the final
implementation still matches the Workbench editing contract, not only the first
plan.

For installed browser-first Workbench sessions, open and inspect the local
loopback gateway (normally `http://127.0.0.1:4318/`). The gateway is the browser
origin for hosted UI assets, local project preview modules, and scoped bridge
operations. Do not construct or share hosted renderer URLs containing local
bridge tokens.

## Agent Fast Rules

For page creation and substantial redesign, use the
`workbench-design-authoring` skill. Its hard contract is intentionally small:
implement the result in the intended project's real source and make it
editable through Workbench.

- MCP availability never selects a project. Pass an explicit `projectTarget`
  to `workbench_inspect_design_context`, verify the returned ID/name/root, and
  re-inspect explicitly when switching projects. Ambient browser state and a
  stale last-opened project are discovery hints, not write authorization.
- Optimize for the user's requested result. Native semantic HTML, project
  primitives, ordinary React patterns, and registered components are all valid
  authoring choices.
- A registered component is useful when it supplies behavior, accessibility,
  reuse, or an Inspector prop contract. Its existence never forces replacement
  of a native element. Do not require a component above the primitive level
  unless the requested behavior or shared API needs one.
- `.map(...)`, local helpers, conditions, data props, callbacks, and package
  components are allowed. Workbench should expose unsupported expressions or
  internals honestly through Binding/source/component boundaries rather than
  flattening them into fake editable nodes. Prefer explicit JSX only when
  direct per-item layer manipulation is an actual requirement.
- When a registered component is used or changed, respect its source and
  matching CSF story contract. Do not hand-edit component or prop registries.
- Do not assert the meaning of a component prop, mode, effect, or slot from a
  visual observation alone. Query or read the source/story contract first; if
  the contract was not inspected, state the behavior as unverified.
- Design plugins, multiple visual directions, detailed requirements contracts,
  execution-prompt approval, numeric scorecards, before/after render evidence,
  independent review, fixed refinement counts, and final approval loops are
  optional. Use them when the user asks or when the complexity and risk justify
  them; they are not prerequisites for authoring.
- When visual direction is ambiguous, inspect the current canvas, product
  patterns, tokens, components, assets, and supplied references; propose one
  evidence-backed direction and ask at most three grouped questions only for
  choices that would materially change the result. Do not auto-generate images
  or a fixed number of alternatives. Multiple directions are an explicit
  exploration path, not the default ambiguity handler.
- There is no universal 8px grid, equal-padding, optical-centroid, card-count,
  surface-count, or score-threshold rule. Judge composition against the brief,
  content, reference, and intended viewport.
- Before handoff, verify the exact page in Workbench. The result must render
  from current source and CSS/assets, and representative structure must be
  selectable or honestly exposed through Layers, Inspector, Binding, or source
  editing. Edits must persist across reload/re-render.
- Practical quality blockers remain real blockers: parse/render failures,
  stale preview styling, broken interactions, obvious overflow or clipping,
  unreadable contrast, missing essential accessible names, and
  request-specific fidelity or responsive failures.
- Use real project assets and keep asset metadata coherent when Workbench needs
  it for preview or editing. Do not reference edited build output as the source
  of truth.

## Source Lifecycle Approval Gate

This gate is mandatory even when the design brief is otherwise complete. It is
not one of the optional prompt, exploration, or final-approval ceremonies.

- Before creating a page/component path or changing a component contract,
  inspect the scoped `git status`, target file existence, imports,
  page/component registries, and relevant Workbench history. If a proposed
  name, route, or path points to a missing artifact, check repository history
  before treating it as a blank slot.
- A new reusable/registered component, its story-backed contract, or an
  extension of an existing component API requires explicit user authorization
  for that exact component work. An exact component-creation request is
  authorization; broad page, catalog, redesign, editability, cleanup, or "all
  components" requests are not. If the need emerges during implementation,
  name the component and source/story/export/token impact, then stop before any
  component write until the user approves it.
- Never restore or reconstruct a deleted or missing page/component from
  Workbench history, Git history, a stash, backup, generated output, another
  branch, or another project unless the user explicitly requests restoration
  of that exact artifact. A request for a new page or a redesign is not
  restoration approval.
- If the evidence cannot distinguish prior deletion from accidental absence,
  stop before writing and ask whether to restore the prior artifact or create
  genuinely new work. Do not create provisional source, stories, routes, or
  registry entries while waiting.

## Provided Artifact Handling

Use supplied code, rendered HTML, design exports, screenshots, and references
as evidence for the requested result. Inspect enough of the artifact to
understand the parts that materially affect the implementation.

- Before the first write, classify the reference intent as either
  `exact-conversion` or `adapt-to-project`. Resolve it from explicit user
  wording first, then the project handoff, active source, and adjacent source
  patterns. If those sources do not settle the choice, ask the user; do not
  guess. In authoring MCP briefs, record this decision as
  `referenceAnalysis.implementationMode`. An unresolved mode is a blocking
  clarification even when `assumptionPolicy` is `agent-may-assume`.
- `exact-conversion` makes the supplied artifact the observable structure and
  composition contract, subject only to named Workbench limitations.
  `adapt-to-project` keeps the existing project frame, responsive structure,
  and component language while transferring only the explicitly identified
  content and visual properties. Do not collapse these two modes into a vague
  "use as reference" instruction.

- When the user asks for exact conversion or supplies authoring source as the
  contract, preserve its observable structure and content unless a Workbench
  editing limitation requires a named deviation.
- A screenshot or reference URL normally communicates appearance and
  composition, not an immutable DOM tree. Recreate its relevant qualities
  without forcing dependency-internal markup or unnecessary component mapping.
- Keep requested page boundaries, routes, assets, and important interaction
  states coherent. Do not silently implement a different page or a materially
  smaller scope.
- Compare against the reference at relevant viewports when fidelity is part of
  the request, then verify the result in the Workbench Design canvas.
- Repository starter artifacts with explicit executable fidelity contracts
  still run their dedicated checks; that maintenance rule does not impose a
  manifest ceremony on ordinary page work.

## Project Symptom Triage Gate

When a Workbench symptom appears inside a local project, inspect the project
source contract before blaming the Workbench app.

- Confirm the active project root and the exact page/component source file.
- Inspect the TSX source, exports, matching stories, `argTypes`,
  `sourceInsert`, registry linkage fields, project CSS, token CSS, Tailwind
  paths, assets, imports, and the page JSX that actually renders the node.
- For Figma-derived components, do not stop at visual resemblance. Confirm the
  public props, default story, child slot shape, icon/asset contract,
  `className` merge behavior, and CSS layout flow all describe the same
  editable component.
- If Inspector props are missing, check whether the selected layer is the
  registered component instance, a native element, a parsed child, a stale
  registry entry, or a read-only dependency/runtime boundary.
- Browser/page preview success is not proof that a source-backed page is
  Workbench-editable. Select the root, a layout component, a representative
  control/text component, and a nested child in the Design canvas. If Layers,
  preview selection, and Inspector do not agree on the same source-backed
  component identity, the task is not done.
- If browser/page preview is correct but the Design canvas breaks a compound
  or wrapper component, check both selection wrapper interposition and duplicated
  runtime dependencies. Components that parse child component types, own
  compound children, rely on React Context, or use direct child selectors need
  runtime selection props on the actual component and one shared project
  runtime bundle rather than per-component package copies.
- Source-backed runtime selection is wrapperless by default. Do not add a
  component-name exception list or a `display: contents` selection anchor to
  recover hit testing; fix root-prop forwarding or keep the unsupported runtime
  boundary honestly non-hit-testable.
- Patch Workbench app source only after the project contract is coherent and
  the app still fails with concrete evidence.

## Product Direction

Workbench V1 is a new product architecture for a visual editor that produces
real frontend UI artifacts, with React / Next TSX as the first verified lane.

Workbench is not an AI chat product. Do not add AI prompt bars, AI API keys,
or in-app generation features unless the user explicitly asks for them.

Workspace agents such as Codex Desktop and Claude Code act outside the app:
they edit source files, run checks, open the local browser, verify UI, and
collaborate with the user. Agent-assisted source authoring is an input path
into real editable artifacts; it does not make Workbench an in-app AI product.

Preserve the core loop:

```text
user request -> agent-authored TSX -> editable tree -> layers/preview/inspector -> edit operation -> tree/code sync -> renderer -> visual verification
```

The source input surface is broader than static JSX. Workbench must now handle
ordinary React project patterns as source facts:

- `className` and Tailwind utility strings
- Base UI / shadcn-style wrapper components
- project CSS, compiled Tailwind CSS, and token CSS
- local arrays used by `.map(...)`
- JSON imports and data-like props such as `data` and `items`
- source expressions that cannot be decomposed yet but still need to be visible
  in layers and Inspector diagnostics
- project assets, icon sets, and fonts installed through the asset manager

Do not flatten these into fake static nodes just to make the editor look
complete. Preserve the original source shape, expose what can be edited safely,
and show honest Binding/diagnostic information for the rest.

The central product belief:

```text
Designer experience defines the interaction surface.
Frontend structure defines the internal truth model.
```

### Curated Organizational Context

Agents should not need a particular creator's account or private memory to
understand why Workbench has its current rules. Durable product principles,
decision rationale, constraints, known limitations, lessons, and improvement
priorities belong in the repository-owned organizational context.

For Workbench V1, the public-safe source is
`docs/WORKBENCH-V1-ORGANIZATIONAL-CONTEXT.md`. Generated projects use
`docs/workbench-agent/WORKBENCH-ORGANIZATIONAL-CONTEXT.md`.

- These documents are curated public artifacts, not raw transcripts or memory dumps.
- Do not automatically ingest personal AI memory, chats, session logs, Git
  history, local paths, private incidents, customer information, credentials,
  or sensitive operational details into agent context.
- Generalize evidence-backed lessons and give them the same review as other
  public product documentation.
- The authoring MCP may inspect only the fixed project context file and may
  return it only when it is explicitly marked `Audience: public` and
  `Status: curated`.
- Missing or excluded context stays explicit. Do not silently replace it with
  private or unreviewed sources.

## AI Source Authoring Philosophy

Workbench is an IDE for designer-editable screens. AI-authored source should be
optimized for interpretation, selection, inspection, and safe visual editing
before it is optimized as final production application architecture.

This does not mean writing throwaway code. It means the authoring source should
make the visible screen legible to both Workbench and the designer:

- Prefer explicit JSX, named sections, readable component boundaries, stable
  keys, and source-backed `className` strings.
- In design implementation, prefer explicit repeated JSX over `.map(...)` when
  designers should select, reorder, delete, or restyle each visible item.
  Browser-valid array rendering is not sufficient if the Design canvas shows
  `{Map expression}` or only a read-only expression boundary.
- Keep dependency direction one-way: pages import reusable components from
  `src/components` or the project library root. Reusable components, barrels,
  and stories must not import or re-export implementations from
  `src/workbench-pages`; deleting a page must never delete a component's source
  of truth.
- Keep ordinary visual hierarchy in the page source. Important `aside`,
  `header`, `main`, `section`, card, table, form, and text structure should not
  disappear behind providers, callbacks, config objects, or runtime helpers.
- Treat providers, routers, auth/session context, data clients, measurement
  systems, virtualization, drag sensors, and heavy visualization packages as
  runtime plumbing. Use local component islands or developer handoff for their
  internals.
- Do not create a runtime island to hide ordinary cards, lists, repeated rows,
  controls, forms, navigation, or static visual composition. Islands are only
  for the smallest genuinely heavy runtime leaf.
- Expose designer-relevant data through props, token-compatible values,
  Binding-friendly arrays, table/CSV props, or wrapper controls. Do not bury
  labels, series, colors, or copy inside opaque runtime constants.
- Static visual design belongs in `className`, project CSS, and tokens. Inline
  `style` is acceptable for runtime geometry, CSS variable assignment, and
  integration values, but it should not become the primary design surface.
- If a visible node cannot be safely round-tripped, show an honest read-only
  boundary or Binding diagnostic. Do not remount, switch to a fallback renderer,
  or route edits to a different hidden node to create fake editability.

In short: code for a designer-readable editing model first, then hand off
advanced state, data orchestration, and runtime optimization to normal developer
workflows when they exceed Workbench's editable source contract.

### Authoring MCP warning policy

`workbench_verify_page` separates source-integrity failures from editability
review warnings. A syntax error, stale source contract, unsafe write loss, or an
invalid/unknown authoring node is blocking. Ordinary React patterns such as
`.map(...)`, conditions, event handlers, local JSX helpers, and unregistered
component boundaries are not blocking merely because Workbench cannot decompose
every part into Inspector controls.

For those patterns verification returns `ok: true`, a
`warningPolicy.status` of `pass-with-warnings`, and warnings that declare their
impact, practical authoring choices, and `acceptableWhen` criterion. Agents must
not repeatedly rewrite valid source only to make warning codes disappear.
Instead:

- revise when the warning prevents the editability requested by the user, such
  as a fixed card set that must be individually selected and reordered;
- keep the React pattern when it is genuinely data-driven or runtime-owned and
  the visible result plus its Binding/source boundary remain understandable;
- report any intentionally accepted warning with its reason during handoff.

This is a review contract, not a warning waiver. A page that renders in Browser
Preview but reduces the requested Design canvas to an opaque expression still
needs correction even though verification itself remains non-blocking.

## Required Workflow

For non-trivial Workbench V1 work:

1. Read the relevant current V1 docs and code paths.
2. Keep the relevant guide in the loop while implementing. Re-check it before
   major edits, when choosing between editable source and runtime islands, and
   before the final handoff.
3. State the V1 design direction before editing when the change is substantial.
4. Implement through the existing architecture and local patterns.
5. Run type/build checks.
6. Verify in the browser when UI behavior changes, unless the user explicitly
   says they will handle browser verification.

Do not treat placeholder UI as product progress. If something is intentionally
deferred, say so honestly in the UI or handoff instead of implying completion.

## Architecture Rules

Move product decisions out of large panels and into explicit domain services.

Prefer these V1 boundaries:

- `SelectionScopeService`
- `PreviewProjectionService`
- `PreviewSelectionService`
- `InstanceEditService`
- `TokenUsageIndex`
- `EditOperationPipeline`
- `RendererPort`

Panels render UI and dispatch intents. Services decide write routing. Stores
hold state. Projectors build payloads.

Core rules:

- One editing intent should have one write path.
- Persist compressed instance state and derive expanded subtrees.
- Scope is a first-class model; do not let raw `breadcrumb` arrays carry hidden
  meanings.
- Renderer projection is separate from editor state.
- Debug output must go through a shared debug utility, not stray `console.log`
  statements in product flow.
- Agent-authored source is a real source input boundary. Parsing should produce
  explicit diagnostics when TSX cannot be projected; do not silently fabricate
  an editable tree.

## Keep / Redesign / Avoid

Keep:

- TSX <-> editable tree editing model
- iframe renderer isolation
- typed editor/renderer contracts
- token collections, modes, refs, gradients, and compatibility handling for
  older formula data
- page/component/library split
- variant axes and component-set thinking

Redesign:

- breadcrumb-based selection scope
- nested instance edit routing
- panel-owned save decisions
- preview projection pipeline
- large all-purpose inspector components

Avoid:

- adding in-app AI features by default
- treating placeholders as finished product
- scattering save routing across UI components
- hardcoding raw CSS values into page/component usage when a token binding can
  represent the value

## UI Implementation Rules

- Use existing shared UI primitives before adding new control markup.
- Add new UI surfaces as named components instead of inline panel markup.
- Represent similar UI patterns through component variants, not duplicated
  components or one-off markup.
- Do not default to JSX inline `style={{ ... }}` for page/component authoring.
  Use component props, variants, named shared components, or
  Inspector-compatible token bindings.
- Do not expand component APIs with one-off CSS longhand props such as per-side
  border, padding, or margin fields just to make a page look right.
- Bind token identity in source with `collectionId` + `tokenId`; use raw values
  only as unavoidable compatibility fallbacks.
- For source-backed component libraries, story controls, source insert defaults,
  component props, and Design editor behavior must describe the same contract.
  A prop that appears in Storybook but does not update the rendered component is
  a bug.
- Treat shadcn/ui-style components as component families when the original API
  is compound. Register sub-components, provide matching story exports, and add
  child allowlists for structure-sensitive roots such as Accordion, Tabs, Table,
  Menu, Select, and Dialog.
- Base UI primitives may be used for Workbench source components and should be
  preferred when they provide the expected behavior, accessibility, keyboard
  interaction, focus management, or compound state. Keep the Workbench-owned
  wrapper component as the editable contract; do not try to edit Base UI
  internals.
- For starter/bundled Workbench components, use external behavior libraries only
  when the design preview runtime can load them reliably. When converting to
  native HTML/React for preview stability, preserve expected browser
  interaction states and document the changed contract.
- For icon buttons, do not rely only on a square CSS size. `size="icon"` must
  result in an icon-only visual button with an accessible name.
- Treat Tailwind as a source-backed styling model, not as arbitrary raw CSS.
  The Inspector may expose utility chips, search, descriptions, documentation
  links, and raw `className` escape hatches, but commits must still write the
  source attribute through the source-backed write path.
- There is no current Workbench rule that forbids Tailwind. Any older
  non-Tailwind-era guidance is superseded by this source-backed Tailwind
  contract. Do not read guidance against arbitrary raw CSS, inline styles, or
  bulk unverified class rewrites as guidance against Tailwind utilities.
- Tailwind utilities are the correct tool for many page-composition details,
  including relative/absolute overlays, inset/z-index, grid tracks, overflow,
  object-fit, backdrop filters, aspect-ratio, spacing, sizing, color, state, and
  responsive behavior. Put those utilities on registered components when the
  element should remain selectable and inspectable. Do not replace that source
  contract with page-local CSS systems, custom `data-*` styling APIs, or raw
  wrappers that only work in browser preview.
- When integrating Astryx or another styling library with Workbench tokens,
  follow Astryx's official integration-path rule: choose the narrowest path that
  fits the library. Prefer CSS variable aliases for ordinary DOM CSS, StyleX
  token imports only for StyleX application styles, a Tailwind bridge only when
  utility classes should be backed by active system tokens, and token resolver
  APIs only for JavaScript consumers such as charts, canvas, SVG, or config
  objects that cannot consume CSS custom properties.
- New project creation does not separate General and Tailwind modes. The default
  React setup is Tailwind-compatible by default: authors may mix utility
  classes and project-owned CSS classes freely in `className`. Use Tailwind +
  shadcn only when the project needs the shadcn-style component set. The shadcn
  option creates a Vite project with Base UI based shadcn-style wrappers in
  Workbench terms: keep the project-owned wrapper API as the editable contract
  and treat dependency DOM as runtime implementation detail.
- Do not let Tailwind edits spill into JSX inline size styles. On Tailwind
  class-backed nodes, width/height/min/max sizing edits should stay in
  `className` unless the user is explicitly clearing an existing inline style.
- In local projects, register authoring source through the installable
  project contract. Pages should be added under `src/workbench-pages/` so Workbench can reconcile
  `.workbench/pages.json` on load. Reusable components should have source,
  styles, CSF story/control metadata, barrel exports, tokens when needed, and a
  discoverable project-local library entry or import so Workbench can hydrate
  `.workbench/components.json`. Tokens remain canonical in
  `.workbench/tokens.json`; `src/workbench-tokens.css` is generated project CSS
  and must stay in sync with the registry.
- Design preview CSS must enter through project-owned paths: configured
  Tailwind compiled CSS, `src/workbench-tokens.css`, `index.html` stylesheet
  links, project-local `.css` imports crawled from pages/components/app entry,
  or inferred library CSS at `<snapshotRoot>/components/<libraryId>.css`. Do
  not rely on bare package CSS imports, Vite `@fs` paths, localhost stylesheet
  URLs, or local machine absolute paths as the design-preview contract.
- Tailwind rendering has one active truth mode. Configured project
  `compiledCss` is authoritative and must not be mixed with Workbench-generated
  utility or fallback CSS. The Workbench fallback generator is allowed only
  when Tailwind is enabled without a configured compiled CSS path; disabled
  Tailwind projects receive no fallback. Source TSX/JSX changes must refresh
  the real compiled snapshot instead of relying on editor-generated gap
  filling. Treat a missing or stale configured compiled file as a visible
  project/compiler diagnostic.
- Treat preview CSS freshness and fidelity separately. Render-dependent checks
  may proceed only when `renderFreshness.ready` is true, which requires both a
  current input revision and project-representative output. Non-Tailwind projects
  are ready without a Tailwind layer; install-free static CSS seeds are not
  representative and must remain unverified even when freshly generated.
- Data bindings and source expressions belong in the Inspector Binding surface.
  Do not mislabel `.map(...)`, member expressions, or imported JSON data as
  editable text just because they appear as visible rows.
- State and breakpoint override authoring is not part of the normal source
  editing loop. The Design preview toolbar should expose viewport sizing and
  token/theme modes, not hidden State/Breakpoint edit selectors. If responsive
  behavior is needed, express it in real source through Tailwind responsive
  utilities, project CSS, component props, or a deliberate component variant.
  Do not add a temporary Workbench-only override layer that later writes hidden
  CSS or props behind the user's back.
- Keep page source editable by default. Page files may compose registered
  project/library components, intentional runtime islands, supported static
  arrays, `.map(...)` blocks, shadcn/Base UI wrappers, and ordinary Tailwind
  classes. They should not hide ordinary visible structure behind private
  page-local micro-components such as `SectionLead`, `MetricTile`, or
  `MiniStat`; that is usually an agent/refactor habit rather than human page
  authoring. They should also not directly embed heavy package runtime trees
  such as `recharts`, map SDKs, rich text editors, canvas engines, or complex
  visualization internals. Wrap only the smallest heavy runtime leaf in a
  project-local component island, as in `<ChartAreaInteractive />` or
  `<TravelExpenseCharts />`; keep the surrounding headings, cards, captions,
  layout, and copy explicit in page JSX.
- AI-authored source must avoid browser-only polish that makes Workbench opaque:
  giant anonymous `div` trees, provider-heavy page roots, hidden render
  callbacks for visible structure, `dangerouslySetInnerHTML`, random IDs or
  remounting keys, absolute disk/import paths, static inline style objects for
  design values, bare package icon components in page JSX, unsupported
  expression props such as `icon={SomeIcon}` or `config={object}`, hardcoded
  chart/table data buried inside internals, and fake editability where
  Inspector writes do not affect the visible output.
- For Workbench-authored pages, keep the visible page shell source-visible.
  Avoid preserving provider-heavy application example shells verbatim at the
  page root, such as wrapping the whole dashboard in `SidebarProvider`,
  router/auth/data providers, or layout managers. Providers may be correct app
  runtime plumbing, but they are weak visual editing boundaries. Prefer explicit
  `aside`, `header`, `main`, and `section` structure in the page and reserve
  provider-heavy or dependency-heavy behavior for local runtime islands.
- Do not "fix" design preview by broadly allowing bare package imports inside
  the editable tree renderer. Loading a large dependency into the Design canvas
  can create React aliasing issues, ResizeObserver loops, long-lived timers, or
  severe idle-time slowdown. Prefer local component islands with a small,
  semantic prop contract.
- Interactive controls inside source preview, such as sliders, selects, inputs,
  menus, and switches, are controls first and editable boxes second. Do not let
  canvas drag/resize handling treat their internal thumbs, handles, or portal
  content as resize targets.
- Selection overlays must not affect document geometry. Avoid implementations
  that increase a preview container's `scrollHeight`/`scrollWidth`, call
  `scrollIntoView` on selected source nodes, or otherwise move the Workbench
  shell while trying to reveal a highlight. If an internal scroller clips a
  selection ring, use an overlay strategy that does not participate in layout.
- Selection instrumentation must not insert DOM between wrapper-sensitive
  parents and children. Prefer applying runtime selection props directly to the
  real component root when it forwards props. Use wrapper anchors only for simple
  leaf/native nodes or explicitly non-inspectable runtime boundaries. Select,
  Combobox, Menu, Popover, Dialog, Sheet, Drawer, AppShell, SideNav, Grid,
  ButtonGroup, Item/ItemSlot, AvatarGroup, and similar slot/compound families
  need Design canvas regression checks before any wrapper-related fix is called
  complete.
- Selection behavior is a product contract. Shift is additive multi-select.
  Cmd/Ctrl is smart/deep selection, not another additive toggle. Layer tree and
  canvas behavior should stay aligned, including same-stack selection and
  source-backed read-only selections.
- Keyboard movement should not depend on whether focus happens to be in the
  layer tree, iframe, or inspector shell. Preserve the current host-safe
  commands: unmodified `I` opens insertion for the selected node when Workbench
  owns focus, and Alt+Arrow moves source-backed layers where possible.
- Chart cards and other data-backed starter components should use explicit
  source props for editable data, such as `dataCsv` and `seriesCsv`, and route
  table edits through one source-backed history transaction on Apply. Changing
  chart type must preserve authored CSV/data props and unmanaged appearance
  props unless the user explicitly asks to reset them.
- Read-only source nodes should remain selectable and clearly marked instead of
  triggering a preview fallback or remount. A red selection ring means the node
  is visible but not editable through the current source path; do not silently
  reroute edits to an unrelated fallback component.
- Be explicit about expected read-only cases: runtime island internals
  (charts, maps, canvas/WebGL, virtualized tables, rich editors), dependency
  primitive internals and portal DOM, `.map(...)`/JSON/fetched data rows without
  a safe backing-data writer, computed expressions or translation/formatting
  helpers, SVG/canvas/media/embed internals, provider/router/auth/theme/data
  plumbing, generated files, package internals, and files outside the project
  root. Prefer Binding diagnostics, an editable parent prop, a CSV/table data
  surface, a token, or wrapper controls over fake child-node editing.

## Canvas Interaction Invariants

The Design canvas maps rendered DOM back to authored source nodes through
resolvers and projection passes in `SourceTreePreview.tsx`. These invariants
are regression-tested by `npm run test:gestures`; keep them true when touching
selection, drag, overlay, or preview-runtime code:

- A rendered overlay/collection item (menu row, select option, ...) may itself
  carry the authored `data-wb-preview-node-id`. Identity resolution prefers
  the item element's own id before wrapper or descendant recovery, and must
  never resolve an item to its text leaf — a text leaf has no reorderable
  siblings, which silently kills drag reordering.
- Projection/reconciliation passes may re-stamp rows whose path-based ids went
  stale inside the resolved owner's subtree, but must never overwrite a live
  authored identity from another branch. A controlled surface (`aria-controls`
  target) that carries its own authored node id is itself the collection
  owner — not the trigger that opened it.
- Canvas remount contract: at most one placeholder-to-runtime hydration swap
  per page load. Selection changes and idle time must not remount the canvas
  tree. Host global patches (`matchMedia`/`getSelection` routing into the
  preview iframe) install in the frame `onLoad` handler before the portal
  children first render — never via key-version remounts.
- Preview appearance forcing must reach the `<html>` element as well as
  `<body>` on every preview surface. Project CSS (shadcn included) commonly
  declares an unlayered `:root { color-scheme: light dark }` that otherwise
  keeps the page canvas following the OS scheme while content is forced.
- Reorder drags render a live reflow projection, not a drop-indicator line.
  Tests and triage should assert the committed order (DOM plus authored
  source), not indicator chrome.
- Reorder glides are driven by the Web Animations API (animation id
  `wb-drop-flip`), never CSS transitions: transitions depended on frame
  scheduling and snapped in the drag path. Anchors without their own box
  (display:contents wrappers such as radio/checkbox rows) measure and glide
  through their boxed children.
- Drop decisions hit-test LAYOUT geometry, not mid-glide visuals: decision
  rects subtract active flip offsets and are frozen per drag gesture
  (invalidated on scroll/resize). Measuring the projected/animating layout
  live made targets flap direction-dependently (toward-start reorders
  snapped while toward-end glided).
- Two-dimensional (wrapping) containers are addressed by SLOT, not by sibling
  edge. When a parent's children occupy more than one row AND more than one
  column, the drop resolver draws every authored cell translucently plus one
  trailing append slot, and the pointer picks the slot the node will occupy:
  drop on slot k, land at visual position k. No sibling reflow, no glide, no
  before/after edge, and no pre/post-removal index correction — those made the
  outcome depend on which cell was addressed and on how many columns the
  current width produced. Linear containers keep edge insertion and glide.
- Clearing a drop projection mid-gesture glides, exactly like applying one.
  Real drags oscillate across a decision boundary; snapping the displaced
  siblings home on every un-project is what "interpolation only works in one
  direction" actually looks like. Gesture specs must include wandering drags
  (past the target, back, past again) — monotonic beelines hide this entirely.
- Cmd+click selection has more than one committing handler. Selection changes
  wired into `handlePointerDownCapture`, the per-node `onClick`, or
  `handleClickCapture`'s delegated path can all be bypassed: an isolated probe
  Cmd+clicking a button reached none of them. Find the handler that actually
  commits (instrument in the harness, never on the live server) before adding
  selection rules there.
- A runtime interaction target answers for its surface as a whole (a combobox
  owns its popup list), so it must never outrank an authored node the pointer is
  actually over. The press path prefers the point-resolved authored node,
  refusing only to go COARSER (an authored ancestor of the runtime node never
  wins). The same preference applies where a controlled-surface owner competes
  with a point hit that carries its own authored id.
- A node's drag anchors and child drop geometry come from footprint elements.
  Components that collect their children and re-render them elsewhere leave
  hidden 1x1 source markers stacked at one spot: anchoring on them put the ghost
  far from the pointer, and feeding them into child geometry made a plain
  vertical list look two-dimensional (overlapping 1x1 rects "share a row").
- Two-dimensionality is "do two children share a row", never "how many distinct
  rect centres are there" — a vertical list with varying item widths has many
  distinct centres and was being addressed by slot, which made every drop
  decision inside it nonsense. `isSourceCanvasTwoDimensionalLayout` is the single
  definition; do not reintroduce a second one.
- An ordinary press selects at the current drill depth, so a canvas drag can
  legitimately move an outer branch rather than the card under the pointer.
  When triaging "my drag went somewhere strange", read
  `__workbenchCanvasDiagnostics.getLastDropDecision()` first: it reports the
  node the gesture is actually moving alongside the resolved parent/index.
- DEV builds expose `window.__workbenchCanvasDiagnostics` (rendered element to
  authored-node resolution, the coincident-bounds wrapper chain, and the last
  drop decision) for the gesture harness and manual triage.
- Runtime gesture surfaces own their input. Carousels, scroll areas, and other
  gesture components must receive complete pointer and wheel sequences —
  including macOS wheel momentum events — unless the pointer is on an authored
  descendant of the current selection. Option/Alt is the explicit
  runtime-interaction chord: the previewed component owns the whole gesture,
  and recognition failures degrade to "nothing happens", never to editor
  selection or structural drag. (This area regressed repeatedly before these
  rules: see the carousel momentum/wheel and Option/Alt fix history.)
- Drag commits must not flash. The drop reflow projection stays visible until
  the source write lands; releasing a drag must never revert to the old order
  and then reapply the new one.

## Current Capability Notes

Workbench V1 is stronger than a static JSX screenshotter, but it is not yet a
full browser-equivalent React runtime for every node in a page.

Currently reliable:

- Source-backed layers for authored TSX pages and local components.
- Tailwind/className preservation and many Inspector-safe source writes.
- shadcn/Base UI wrapper composition when the wrapper is project-local and the
  required package dependencies are installed.
- Local arrays, `.map(...)` rendering, and imported JSON can render at runtime,
  but their generated children are not a default designer-editable source
  shape. Use them only behind a verified Binding/data contract.
- Project-local runtime component islands for the smallest genuinely heavy
  leaves such as chart engines, geographic map engines, canvas/WebGL, rich
  editors, and virtualized grids. Ordinary dashboard/card/list structure stays
  explicit outside the island.

Still maturing and requiring care:

- Direct bare package JSX inside page source. Use a local wrapper/island.
- Third-party components that depend on browser measurement, `ResizeObserver`,
  portals, animation loops, canvas, or complex package graphs.
- Design preview fidelity for internals of runtime islands. The island can
  render correctly while its internal DOM remains intentionally less editable.
- Inline geometry edits created by accidental canvas drags. Prefer class-backed
  sizing and verify undo/history behavior after interactive control work.
- Selection highlights inside nested scroll areas. Fix clipping without adding
  layout-affecting overlay boxes or auto-scrolling the Workbench shell.

## Token Editor Rules

The V1 token editor must feel like a professional variable authoring tool. It
should include a dense table editor plus supporting controls for collections,
modes, groups, token rows, value kind, references, gradients, search/filter,
reorder, safe save, and local persistence. Do not reduce it to a dashboard or a
plain value table.

Current token architecture rules:

- Token reference identity is collection-scoped. Never use `tokenId` alone for
  cycle checks, duplicate checks, cleanup, or picker filtering.
- Starter/library token work uses layered token ownership:
  `component token -> semantic reference token -> primitive raw token`.
- Primitive collections own raw values. Semantic collections must be
  reference-token collections with meaningful modes. Component CSS should
  consume component collection variables, not primitive variables directly.
- Before creating any raw token, search the compatible primitive collection by
  normalized type, unit, and value. Reuse the existing primitive when one
  exists; values such as `40px` must not be duplicated across component tokens.
- Reusable component values must be authored in one operation across all three
  layers: component token, reusable semantic role, and primitive reference.
  A component token with a raw value is rejected unless it is documented
  one-off runtime geometry that cannot represent a reusable design role.
- Preview appearance is not a token collection. Token modes are per-collection
  selections; preview appearance is rendering media state. In `system`, derive
  effective light/dark modes from `prefers-color-scheme` at render time and do
  not mutate the saved preview token mode selection.
- Typography must be represented in the same layered model as color, radius, and
  effect. Do not leave font size, font weight, or line height as anonymous CSS
  numbers in reusable starter components.
- Use `src/domain/design-system/tokens/referenceGraph.ts` for scanning,
  comparing, path-checking, and rewriting token refs.
- Gradient ref handling must include both stop colors and `meshBackgroundColor`.
- Use `src/domain/design-system/tokens/usageIndex.ts` before adding token
  impact UI or binding cleanup behavior.
- Keep collection/group/mode/token mutation decisions in token domain
  operations or `useTokenEditorActions`, not directly in `WorkbenchShell.tsx`.
- Keep token value draft lifecycle in `useTokenValueDraft`.
- Use an explicit unit token model. Users should choose and confirm units when
  authoring values instead of relying on automatic px/unit inference.
- Formula data is compatibility-only in the current token architecture: parse,
  preserve, and rewrite older formula refs safely, but do not add formula
  authoring UI unless the current docs are intentionally updated.
- When mode-specific styling looks wrong, inspect root attributes such as
  `data-wb-preview-appearance`, `data-theme`, library media attributes, and
  effective `data-wb-token-modes` before changing token editor internals.

Do not call a token screen complete until it supports collection/mode/group/token
CRUD, raw/ref value editing, type-aware editing, cycle-safe token resolving, and
local persistence.

## Verification

General checks:

```bash
npm run check
npm run build
```

For token-domain work, run:

```bash
npm run workbench:check-tokens
npm run check
npm run build
npm run workbench:check-config
```

Other useful checks:

```bash
npm run workbench:check-starter
npm run workbench:check-story-props
npm run workbench:check-design
```

For UI behavior changes, also verify in the browser against the local dev
server.

For canvas selection/drag/overlay/preview-runtime/theme-scope changes, run the
real-input gesture regression suite:

```bash
npm run test:gestures
```

It is fully isolated (throwaway APFS clone of the fixture project, its own
vite instance and active-project state via `WORKBENCH_DEV_SERVER_STATE_PATH`),
so it is safe to run while a normal dev server is up. Specs live in
`scripts/gesture-tests/specs/`; add one whenever a canvas gesture bug is
fixed.

### Commit Scope And Session Artifacts

Opening Workbench or verifying in the browser rewrites local session state as
a side effect. Treat these files as session artifacts, not product changes:

- `**/.workbench/selection.json`
- `**/.workbench/codex-design-handoff.json`
- `**/.workbench/codex-component-library-handoff.json`
- `**/.workbench/workspace-state.json` and `**/.workbench/history.json`
- `**/.workbench/save-points/` — whole source copies kept per lane for
  time travel, up to 20 each; a large page's lane reaches megabytes
- `.workbench/dev-server-project.json`

Keep them out of commits unless the user explicitly asks to persist session
state. When they are dirty, stage explicit paths instead of `git add -A`, or
restore the artifact-only changes before committing. In Claude Code this rule
is enforced by a PreToolUse hook
(`.claude/hooks/guard-workbench-session-artifacts.mjs`); only when the user
has explicitly requested persisting session state, prefix the command with
`WORKBENCH_PERSIST_SESSION_STATE=1`.

## Drift Control

When shared agent guidance changes, update this file first. Keep `AGENTS.md`
and `CLAUDE.md` as thin entry points that direct each agent here.

If an agent-specific file needs special tool instructions, keep those additions
small and avoid duplicating product or architecture rules. Duplicated summaries
will drift.

Code drifts the same way docs do. `scripts/workbench-starter/*` is the
canonical source for kit components, kit CSS (including theme palettes), and
sample pages; the sample/fixture projects under `projects/` carry copies. When
a kit file changes on either side, sync the counterpart in the same change —
kit drift surfaces as "correct in the starter, broken in the project" (or the
reverse) and has repeatedly cost debugging sessions.

Repository agent skills have one canonical source under `.agents/skills/`.
Claude's `.claude/skills/` files are thin discovery wrappers that point there.
If Codex also discovers an older same-named user-scoped Workbench skill, the
repository copy remains canonical for this checkout; do not combine the two
instruction bodies. `scripts/check-workbench-agent-guidance.mjs` verifies each
repository skill's `agents/openai.yaml` discovery metadata as well as the
Claude wrappers and root entry-point routing.
Generated-project guidance is owned by `scripts/workbench-template.mjs`;
existing project copies are user-owned snapshots and are not silently
overwritten merely because the template evolves. Migrate one explicitly named
project with `npm run workbench:sync-project-guidance -- --project <path>`;
review the dry-run before adding `--write`, and use `--force` only after
reviewing conflicts and the automatic backup path.

`npm run workbench:check-harness` is the combined regression command for agent
guidance discovery plus the Workbench authoring MCP protocol. The
MCP advertises a compact nine-tool core profile by default so optional legacy
requirements, prompt-approval, and high-assurance visual-review schemas do not
consume every agent session. Set `WORKBENCH_AUTHORING_TOOL_PROFILE=full` only
when those optional tools are intentionally needed. Core-profile instructions
must not require one of those hidden helpers. Compact inspection still reports
the active MCP transport and bounded preview-CSS freshness. Direct-filesystem
authoring and the local bridge use the same preview-CSS synchronization
contract after source writes; neither status replaces the final Design-canvas
check of rendered appearance, Layers identity, and Inspector editability.
