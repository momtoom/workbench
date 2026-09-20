---
name: workbench-v1-agent-workflow
description: Use for any non-trivial Workbench V1 repository work: planning changes, editing source, running checks, verifying UI, handling dirty worktrees, deciding which Workbench guide to read, or coordinating broad fixes across design editor, source authoring, tokens, components, preview runtime, project templates, and Workbench shell code.
---

# Workbench V1 Agent Workflow

## Context Routing

Use this as the entry point only when a task spans multiple Workbench lanes or
the owner is not clear yet. Do not reopen `AGENTS.md`/`CLAUDE.md` or preload the
full shared guide and architecture documents from this skill.

Identify the lane first, then load the focused skill and the exact guide
sections it names. Read a complete architecture document only when a broad
cross-boundary change genuinely requires it.

Route to focused skills when the task matches:

- Component/sourceInsert/registry/story work: `workbench-component-authoring`
- Token editor/tokens/CSS variable work: `workbench-token-editor`
- Preview iframe/runtime import/Tailwind/CSS loading: `workbench-preview-runtime`
- Architecture/refactor/source-of-truth boundaries: `workbench-architecture-guardrails`
- Bug/regression triage: `workbench-core-triage`
- Product/UX direction decisions: `workbench-product-direction`
- Page/product/service design authoring: `workbench-design-authoring`

## Hard Stops

- Treat `private/main` as the active canonical branch. `origin/main` is retained
  only as an archive; do not use it as a work base or push/merge target unless
  the user explicitly requests archive maintenance.
- This is a single-user repository by default: work directly on `main` and use
  commits to separate work. Do not create a local or remote branch, linked
  worktree, or PR branch for ordinary agent tasks. Branches are only for real
  concurrent multi-contributor work that the user explicitly requests. If
  isolated verification genuinely requires a temporary detached worktree,
  remove it before handoff and leave no agent-created branch behind.
- Do not add AI prompt bars, AI API keys, or in-app generation features unless explicitly requested.
- Do not treat placeholder UI as product progress.
- When exact conversion is requested, preserve the supplied source or rendered
  structure and name material deviations. Otherwise use screenshots, rendered
  HTML, DOM, and design exports as evidence without forcing a pre-edit
  structural-inventory ceremony.
- Do not hand-edit project `.workbench/components.json` or `.workbench/prop-registry.json` for component creation or ordinary component changes.
- Do not revert unrelated dirty worktree changes.

### Source Lifecycle Approval Gate

- Run a source-lifecycle preflight before creating a page/component path or
  changing a component contract. Inspect the scoped `git status`, target file
  existence, imports, page/component registries, and relevant Workbench history.
  If the name, route, or path points to a missing artifact, check repository
  history before deciding it is a blank slot.
- A new reusable/registered component, story-backed component contract, or
  extension of an existing component API requires explicit user authorization
  for that exact component work. An exact request such as "create Component X"
  is authorization; a broad page, catalog, redesign, editability, or cleanup
  request is not. If the need emerges during implementation, name the proposed
  component and affected source/story/export/token surfaces, then stop before
  writing until the user approves it.
- Never restore or reconstruct a deleted or missing page/component from
  Workbench history, Git history, a stash, backup, generated output, another
  branch, or another project unless the user explicitly requests restoration
  of that exact artifact. "Create a new page" and "redesign this page" do not
  authorize resurrection. When history is ambiguous, stop before writing and
  ask whether to restore the prior artifact or create a genuinely new one.
- For design implementation, choose explicit JSX when direct per-item
  manipulation is important. Ordinary React patterns such as `.map(...)`,
  local helpers, and config-driven children are valid when Workbench exposes an
  honest Binding/source boundary and individual layer manipulation is not a
  requirement.
- Keep pages as deletable composition. Reusable components, barrels, and stories must not import or re-export implementation from `src/workbench-pages`.
- Before deleting or moving source, scan reverse imports, stories, barrels, and `.workbench` linkage. Never delete first and discover component ownership from a Vite error afterward.

## Universal Code Authoring Gate

Apply this gate before writing Workbench or Workbench-project code:

- Confirm the active root first: Workbench app repo, generated local project, or a source file inside a local project.
- Name the canonical owner before editing: TSX source, story metadata, project registry linkage, CSS/token output, preview runtime, editor session, or UI-only state.
- For local project symptoms, inspect project source before app source. Check TSX, exports, stories, `sourceInsert`, registry linkage fields, CSS/Tailwind/token paths, imports, and the page JSX actually rendering the component.
- For theme or mode symptoms, distinguish the project component contract, token collection mode selection, preview appearance state, generated token CSS selectors, and project CSS loading before editing shared preview code.
- Do not patch the Workbench app to compensate for malformed project source,
  stale registry links, missing stories, or hidden project styling. Native
  elements and ordinary React boundaries are valid unless the project actually
  depends on a registered component contract.
- Keep source, sidecars, docs, and generated metadata aligned when a change crosses those boundaries.
- End with evidence: checks run, UI surface verified, and any remaining project-contract risk named explicitly.

## Curated Organizational Context

- For product intent, decision rationale, constraints, known limitations,
  lessons, or improvement priorities, read the public-safe organizational
  context routed by the focused skill. In the Workbench repository this is
  `docs/WORKBENCH-V1-ORGANIZATIONAL-CONTEXT.md`; generated projects use
  `docs/workbench-agent/WORKBENCH-ORGANIZATIONAL-CONTEXT.md`.
- Treat that curated document as a reviewed context layer, not as permission to
  mine raw chats, personal AI memory, session logs, local machine state, or Git
  history for publishable product claims.
- When a durable lesson changes, propose a generalized, evidence-backed update.
  Exclude identities, accounts, customers, secrets, sensitive operational
  details, local paths, and unreviewed speculation.
- MCP inspection may return only a bounded public/curated version of this
  context. An absent or excluded context is an honest boundary, not permission
  to substitute private history automatically.

## Design Canvas First Gate

For any UI/page/component work that is meant to be editable in Workbench, the
browser/page preview is not sufficient evidence. Before calling the work done:

- Open or inspect the Workbench Design canvas for the exact page/component the
  user is using.
- When testing live component behavior in the Design canvas, use
  `Option/Alt+click` or `Option/Alt+drag`. Unmodified pointer input belongs to
  editor selection/structural drag and is not evidence that the component
  runtime is broken. Verify the runtime result and that editor selection did
  not change.
- Select the root component and at least one representative nested component in
  the canvas or layer tree.
- For registered components, confirm the Inspector shows the intended component
  props. Native elements may correctly expose generic DOM/layout/style fields;
  expression-backed regions may correctly expose Binding or source boundaries.
- Confirm the selected node's layer identity, preview highlight, and Inspector
  target all refer to the same source-backed node.
- If the browser/page preview is correct but the result cannot be selected,
  traced to source, or edited through Layers, Inspector, Binding, or source,
  treat the work as failed. Do not require every internal expression or child of
  an external component to become a fabricated editable layer.

## Default Workflow

1. Read the relevant guide sections before editing.
2. When artifacts were supplied, inspect the parts that materially affect the
   requested fidelity. Preserve exact source structure when exact conversion is
   requested; otherwise treat screenshots and references as visual evidence,
   not an immutable DOM contract.
3. Inspect existing code paths with `rg` before deciding.
4. Run the universal code authoring gate and route to focused skills.
5. Keep changes scoped to the product surface and architecture boundary in question.
6. Prefer source-backed, editable, verifiable behavior over visual-only or registry-only changes.
7. Run the narrowest meaningful checks first, then broaden when shared behavior changed.
8. Report unrelated validation blockers exactly, without hiding them or fixing unrelated files.

## Verification

Use the focused skill's checks first. For broad or still-unclassified changes,
use checks proportional to risk:

- `npm run check`
- `npm run workbench:check-design`
- `npm run workbench:check-guidance`
- `npm run workbench:check-harness` when changing repository agent
  instructions, skill metadata, generated guidance, or the authoring MCP
- `npm run workbench:check-starter`
- `npm run test:gestures` when canvas selection, drag, wheel, overlay, or
  preview interaction behavior is involved
- focused Vitest or scripts when touching dedicated behavior
- `git diff --check -- <touched files>`

For frontend/UI changes, run the app and visually verify the changed workflow when practical.
