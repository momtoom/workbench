# Workbench V1 Authoring Gateway

The authoring gateway is a protected source-write path for Workbench projects.
It complements ordinary developer source editing and the visual editor. Its
current page contract is `editable-v1`.

## When to use it

Use the gateway when its tools are available and an agent is creating a page,
substantially redesigning a page, or performing structured token or component
authoring that benefits from explicit project binding and guarded writes.

The gateway is not the exclusive source-editing path. Focused bug fixes,
refactors, and ordinary developer edits may change project source directly,
provided they preserve the same source-of-truth, editability, preview, and
verification contracts. Tool availability never authorizes inference from an
ambient browser tab or stale last-opened project.

## Hard boundary

The gateway enforces only the conditions needed to keep authoring safe and
editable:

1. The caller explicitly identifies the intended Workbench project.
2. The session binds to that verified project before a write.
3. A plan is bound to the current page source and component-catalog revision.
4. The gateway writes project source atomically and updates page metadata.
5. The result parses and can be represented honestly by Workbench.
6. Configured preview CSS is synchronized before the page is handed off.

The last-opened project, process working directory, ambient browser tab, and
stale selection state are discovery hints only. They never authorize a write.

## Public-safe organizational context

Context inspection may include reviewed product principles, decision rationale,
constraints, known limitations, lessons, and improvement priorities from the
fixed project file
`docs/workbench-agent/WORKBENCH-ORGANIZATIONAL-CONTEXT.md`.

- The file must declare `Audience: public` and `Status: curated`.
- Only allowlisted section bullets are returned through MCP; unstructured text
  is not treated as organizational truth.
- Entries that resemble credentials, personal contact details, or local machine
  paths are filtered from the response.
- The MCP does not crawl Git history, raw chats, personal AI memory, session
  artifacts, or arbitrary project files to supplement the curated document.
- Existing project-owned context is seed-only in guidance synchronization and
  is never overwritten, including by forced guidance migration.

## Flexible authoring

`workbench_plan_page` requires only page identity:

- `pageName`
- `route`
- `sourceFile`

The following inputs are optional:

- a detailed requirements contract;
- a reviewed execution prompt;
- semantic intent inventory and component search;
- design-skill or visual-option evidence;
- visual hierarchy or geometry guidance;
- a stable review-session identifier.

The apply tool accepts native editable JSX nodes, project primitives, and
registered components. Native semantic HTML is first-class. A component-catalog
match is a suggestion and never forces replacement of `<button>`, `<input>`,
`<img>`, `<table>`, or another native element.

When a registered component is selected, its real `sourceInsert` and CSF story
prop contract remains authoritative. Component API changes still update source
and the matching story before registry reconciliation.

Ordinary React patterns in existing source—local helpers, `.map(...)`,
conditions, event handlers, data props, inline integration values, and package
component boundaries—are not verification failures. Workbench should expose
what it can edit and preserve the rest as honest Binding, component, or source
boundaries. Use explicit repeated JSX when direct per-item manipulation is a
real requirement, not as a universal source-shape rule.

## Optional design and QA helpers

The gateway continues to expose detailed requirements, prompt approval,
component search, render-evidence, independent-review, and visual-approval
tools. They are available for high-assurance work or explicit user requests;
they are not prerequisites for `editable-v1` planning, applying, or verifying.

There is no mandatory:

- three-option art-direction exploration;
- Product Design or image-generation plugin call;
- verbatim prompt display and approval;
- semantic component search;
- component promotion proposal;
- 8px grid or equal four-side padding;
- optical-centroid measurement;
- wide/compact before-and-after evidence pair;
- independent reviewer session;
- score of 80 in every category;
- fixed refinement count;
- final user-approval loop.

Creative judgment belongs to the host agent. It should use the brief,
references, project context, and its strongest available design capability in
the manner most likely to produce a good result.

## Practical verification

`workbench_verify_page` treats parsing and source representability as the
mechanical gate for `editable-v1`. Ordinary React expression and component
boundaries may be returned as warnings rather than failures.

Before handoff, the host verifies the exact result in Workbench:

- the intended page renders with current CSS and assets;
- the root and representative nested content can be selected, or an honest
  Binding/component/source boundary is visible;
- Layers, preview selection, Inspector/Binding, and source identity do not
  contradict one another;
- a representative edit persists across reload or re-render;
- obvious overflow, clipping, unreadable contrast, broken interactions,
  missing essential accessible names, and request-specific fidelity or
  responsive defects are fixed.

Additional visual review is proportional to the request. A landing page with a
supplied reference may warrant same-viewport comparison. A small copy or
spacing change may need only the affected canvas state.

## Legacy contracts

Existing pages may carry `structured-v2` through `structured-v8` metadata. The
verifier continues to recognize their historical requirements so stored
evidence remains interpretable. New authoring uses `editable-v1`; legacy
geometry, scorecard, evidence, and approval rules are not copied into new
plans.

## Tools

The MCP exposes:

- project context: `workbench_inspect_design_context`;
- optional design context: `workbench_confirm_design_requirements`,
  `workbench_prepare_page_prompt`, `workbench_confirm_page_prompt`;
- optional component discovery: `workbench_search_components`;
- page writes: `workbench_plan_page`,
  `workbench_apply_page_operations`, `workbench_verify_page`;
- optional high-assurance QA: `workbench_submit_render_evidence`,
  `workbench_submit_visual_review`, `workbench_confirm_visual_approval`;
- tokens: `workbench_inspect_tokens`, `workbench_upsert_tokens`;
- explicit component work: `workbench_inspect_component`,
  `workbench_upsert_component`.

The default `core` tool profile advertises the nine tools needed for project
binding, page authoring, verification, component search, tokens, and explicit
component work. Optional detailed-requirements, prompt-approval, and
high-assurance visual-QA tools remain available in the `full` profile. Keeping
them out of the default tool list avoids loading their large schemas into every
Codex session.

`workbench_inspect_design_context` returns a compact response by default. It
preserves the verified binding, revision, active source summary, bounded
inventories, preview CSS readiness, MCP tool profile/transport, and questions
while omitting source excerpts and other high-volume detail. The transport
summary tells the host whether authoring is using direct filesystem access or
the authenticated local bridge; agents must not assume a bridge is connected
from an open browser tab. Large inventories are reduced to the response budget
with `responseTruncated: true`, while the active page and binding remain
prioritized. Pass `responseProfile: "full"` only for a task that needs the
complete inventory; both profiles carry the same revision-bound contract.

There is no registry-write shortcut. Page source, component source and story
contracts, registry hydration, preview CSS, and Workbench selection identity
remain separate source-of-truth boundaries.

## Running the MCP adapter

Codex:

```sh
codex mcp add workbench -- node /absolute/workbench-v1/scripts/workbench-authoring-mcp.mjs
```

To opt into all optional tools for a high-assurance workflow:

```sh
codex mcp add workbench-full --env WORKBENCH_AUTHORING_TOOL_PROFILE=full -- node /absolute/workbench-v1/scripts/workbench-authoring-mcp.mjs
```

Claude:

```sh
claude mcp add --scope user workbench -- node /absolute/workbench-v1/scripts/workbench-authoring-mcp.mjs
```

User-scoped registration is the default for local development. A project may
instead opt into a reviewed project-local MCP configuration when the team wants
that registration to travel with the repository; do not add one implicitly.

Registering the adapter makes tools discoverable; it does not select a project.
The first inspection still needs an explicit matching `projectTarget`.
