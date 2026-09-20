---
name: workbench-design-authoring
description: Create or substantially redesign source-backed Workbench pages and product or service touchpoints. Use when a user asks to design, build, explore, rework, or art-direct a visual frontend artifact that must remain editable in Workbench.
---

# Workbench Design Authoring

## One hard contract

Implement the result in the intended Workbench project's real source and leave
it editable through Workbench.

That means:

- the page or component renders through the project's configured Workbench
  preview rather than a browser-only patch or edited build output;
- representative visible structure is selectable in Layers, or is exposed
  honestly as an Inspector, Binding, component, or source boundary;
- edits persist to source and survive reload/re-render;
- CSS, assets, imports, routes, and page metadata used by the render are current.

Do not infer the project from an ambient browser tab or stale last-opened state.
When the Workbench authoring MCP is available for a new page or substantial
redesign, use its protected authoring path: call
`workbench_inspect_design_context` with the explicit `projectTarget` and verify
the returned binding before writing. Use the default compact response first;
request `responseProfile: "full"` only when the task genuinely needs the full
page, token, asset, source, and design-intelligence inventory. If the MCP is unavailable, direct source
editing remains a valid Workbench authoring path under the same source,
editability, and verification contract. Ordinary bug fixes and focused
refactors may edit source directly.

## Reference intent gate

Before the first write for any supplied Figma node, screenshot, design export,
rendered HTML, or code reference, decide which implementation mode applies:

- `exact-conversion`: the supplied artifact owns the observable structure and
  composition;
- `adapt-to-project`: the existing project frame, responsive structure, and
  component language stay canonical while selected content and visual
  properties transfer from the artifact.

Resolve the mode from explicit user wording first, then the project handoff,
active source, and adjacent source patterns. Record it in the authoring MCP as
`referenceAnalysis.implementationMode`. If those sources do not settle the
mode, stop before writing and ask the user whether the reference should be
implemented exactly or adapted. `agent-may-assume` does not bypass this gate.
Do not treat a Figma URL by itself as authorization to copy its outer canvas,
labels, device chrome, or layout topology.

## Creative freedom

Use the host model's strongest design judgment directly. A Product Design or
other visual plugin may help when the user asks for exploration, when a
reference must be studied, or when the direction is genuinely unresolved. It
is optional. Do not require three alternatives, a separate image-generation
step, a repeated prompt-approval ceremony, or a user checkpoint when the
request already gives enough direction. The source-lifecycle approval gate
below is a mandatory safety boundary, not an optional design ceremony.

Ask only when a missing decision would materially change the product or create
an unsafe or materially different outcome. Otherwise make reasonable,
visible assumptions and implement.

When visual direction is ambiguous, inspect the current canvas, product
patterns, tokens, components, assets, and supplied references first. Infer one
recommended direction, explain the evidence and tradeoff briefly, and ask one
to three grouped questions only for decisions that would materially change the
result. Do not turn ambiguity into automatic image generation or a fixed set
of visual alternatives. Generate multiple directions only when the user asks
to explore alternatives.

## Source Lifecycle Approval Gate

Apply this gate before writing page/component source, stories, exports, routes,
or registry-linked metadata:

- Inspect the scoped `git status`, target path, imports, page/component
  registries, and relevant Workbench history. If a proposed name, route, or
  path already points to a missing artifact, check repository history before
  treating it as a new blank page or component.
- Do not create a new reusable/registered component or extend an existing
  component contract unless the current user request explicitly authorizes
  that exact component work. Broad requests for a page, catalog, redesign,
  editability, cleanup, or "all components" do not authorize support
  components. If a component becomes necessary, name it, explain why, list the
  expected source/story/export/token impact, and wait for approval before
  writing any part of it.
- Never restore or reconstruct a deleted or missing page/component from
  Workbench history, Git history, a stash, backup, generated output, another
  branch, or another project unless the user explicitly requests restoration
  of that exact artifact. A request for a new page or redesign is not
  restoration approval.
- If prior deletion versus accidental absence cannot be established, stop
  before writing and ask whether the user wants restoration or genuinely new
  work. Do not make provisional files while waiting.

## Source shape and components

Choose the simplest source shape that produces a good result and remains
understandable in Workbench:

- Native semantic HTML and project primitives are first-class choices.
- Registered components are optional. Prefer one when its behavior,
  accessibility, reuse, or Inspector prop contract is useful.
- A catalog match never forces a native element to be replaced.
- Do not create a new component merely because markup repeats or looks
  component-like. Create or change a component when the user asks, or when a
  real shared behavior/API is part of the requested implementation.
- Ordinary React patterns such as local helpers, arrays, `.map(...)`, event
  handlers, data props, and conditional rendering are allowed. Use explicit JSX
  only when direct per-item manipulation in Layers is an actual user
  requirement.
- Preserve unsupported expressions as honest Binding/source boundaries instead
  of flattening them into fake editable nodes.
- If a registered component is used, respect its real source and CSF story prop
  contract. Component API changes still update source and the matching story.

The goal is not maximum layer count or maximum component reuse. The goal is a
clear, editable relationship between the rendered result and its source.

## Practical workflow

1. Bind and inspect the exact project, project handoff, active page, source,
   adjacent source patterns, CSS, assets, and any supplied reference that
   materially affects the task. Resolve the reference intent gate before the
   first write.
2. Implement the design in real project source using the most effective mix of
   native elements, primitives, React patterns, and registered components.
3. Keep the page route and Workbench metadata coherent and synchronize the CSS
   or asset pipeline used by preview.
4. Open the exact result in Workbench. Select the root and representative nested
   content or inspect the honest Binding/source boundary.
5. Fix practical blockers: parse/render failures, stale styling, broken
   interactions, overflow, clipping, unreadable contrast, missing essential
   accessible names, and request-specific fidelity or responsive defects.
6. Report what was verified and any boundary that remains source-only.

Run `npm run workbench:check-authoring` after changing the authoring gateway,
bridge, MCP adapter, or their contracts. It is not a prerequisite for every
page design task.

Detailed requirements contracts, component search, visual alternatives,
execution-prompt approval, render evidence, independent scorecards, and final
visual approval are optional tools. Use them only when the user requests them
or the risk and complexity justify the overhead. This optionality does not
waive the Source Lifecycle Approval Gate.

## Default design effort

Apply these defaults to every Workbench design task without being asked. A user
instruction may override any of them for that task.

- Product thinking before pixels: name the service's core loop and this page's
  role in it. List the elements that loop genuinely needs, keep only those on
  the surface, and give secondary or rare actions a home in popovers, sheets,
  dropdowns, drawers, or menus instead of stacking them on screen. Navigation
  chrome and the primary work area stay separate concerns.
- Borderless by default: separate regions with surface tones, elevation, and
  spacing, not border or divider lines. Reach for a bordered or filled surface
  only when tone and spacing genuinely cannot carry the separation.
- Simple must not mean bland: commit to one deliberate identity per page — a
  signature color used sparingly for meaning, a typographic anchor, or an
  oversized motif — and include at least one visual-relief element (a scale
  jump, a color moment, an asymmetric composition) so the page has a pulse.
- Interaction states are part of the design: hover, focus-visible, active/current,
  and open/closed states for any disclosure surface you add.
- Never silently accept tool findings: every violation or warning from
  `workbench_verify_page` (or any authoring check) is either fixed or reported
  to the user with a one-line reason it stays. "It's just a warning" is not a
  reason.

## Practical quality bar

Judge quality against the brief, content, reference, and intended viewport—not
against a universal visual formula.

Before handoff, check:

- the primary purpose and action are understandable;
- hierarchy, spacing, type, color, imagery, and interaction feel coherent for
  the specific design;
- realistic content does not break the composition;
- requested or clearly relevant viewport states work;
- obvious accessibility and interaction defects are fixed;
- the same result is visible and editable in Workbench.

There is no mandatory 8px grid, equal-padding rule, optical-centroid proof,
three-option exploration, numeric score threshold, independent reviewer,
before/after evidence pair, fixed refinement count, or final approval loop.
