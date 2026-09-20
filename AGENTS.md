# Workbench V1 Codex Instructions

This repository uses a shared agent guide so Codex Desktop and Claude Code work
from the same product and architecture rules.

Load context through skills, not by reading every guide.

For non-trivial Workbench V1 work, invoke the skill that matches the task. The
shared definitions live under `.agents/skills/` and name the specific guide
sections and checks needed for that lane:

- `workbench-v1-agent-workflow` — entry point when the task spans areas or the
  right area is not yet clear.
- `workbench-core-triage` — bugs, regressions, selection/scope, stale preview,
  persistence, parse/writeback failures.
- `workbench-architecture-guardrails` — architecture, state models,
  source-of-truth boundaries, broad refactors.
- `workbench-component-authoring` — components, props, CSF stories,
  `sourceInsert`, registry metadata.
- `workbench-token-editor` — tokens, token modes/references, token CSS
  generation, token-related Inspector controls.
- `workbench-preview-runtime` — preview rendering, iframe isolation, runtime
  imports, project CSS/asset loading.
- `workbench-product-direction` — scope, tradeoffs, "should we build this".
- `workbench-design-authoring` — creating or redesigning source-backed pages.

Repository `.agents/skills` definitions are canonical for this checkout. If a
same-named user skill is also installed, follow the repository copy for work in
this repository; do not merge the two instruction bodies.

Do not preload the full `docs/WORKBENCH-V1-*` set. Start with the matching
skill, then read only the sections it routes to. Read a complete architecture
document only when the task genuinely spans that whole boundary.

Codex-specific operating note:

- Codex acts outside the app through Codex Desktop: it edits source, runs
  checks, opens the local browser, verifies UI, and collaborates with the user.
- Codex-authored TSX is an intended source input path into Workbench's editable
  tree, preview, layers, and Inspector.
- The Workbench authoring MCP server (`scripts/workbench-authoring-mcp.mjs`)
  is shared: Codex Desktop registers it in its own config, Claude Code through
  the repo `.mcp.json`.
- Keep Workbench session artifacts (selection/handoff/workspace-state JSON)
  out of commits unless the user explicitly asks; see Commit Scope And Session
  Artifacts in `docs/WORKBENCH-V1-AGENT-GUIDE.md`.
- This does not make Workbench an in-app AI chat product.

Hard stops:

- Treat `private/main` as the active canonical branch. `origin/main` is retained
  only as an archive; do not use it as a work base or push/merge target unless
  the user explicitly requests archive maintenance.
- This is a single-user repository by default: work directly on `main` and use
  commits to separate work. Do not create a local or remote branch, linked
  worktree, or PR branch for ordinary agent tasks. Branches are only for real
  concurrent multi-contributor work that the user explicitly requests. If
  isolated verification genuinely requires a temporary detached worktree,
  remove it before handoff and leave no agent-created branch behind.
- Do not add AI prompt bars, AI API keys, or in-app generation features unless
  the user explicitly asks.
- Do not treat placeholder UI as product progress.
- When the user provides source code or rendered HTML with a visual reference,
  treat that source structure as the fidelity contract. Do not redraw or
  approximate from the image; follow the Provided Artifact Fidelity Gate in
  `docs/WORKBENCH-V1-AGENT-GUIDE.md` before editing.
- Do not hand-edit project `.workbench/components.json` or
  `.workbench/prop-registry.json` when creating or changing components. Treat
  source TSX, exports, CSS, CSF stories, and Workbench import/re-import
  hydration as the source of truth.
- For component creation or editing, update the component source and matching
  `*.stories.tsx` contract (`args`, `argTypes`, `sourceInsert`, and prop
  registry metadata) before registry reconciliation. Do not put story control
  fields such as `control`, `assetId`, or picker metadata into component
  registry entries.
- When a Workbench symptom appears in a local project, inspect the active
  project source contract before blaming the Workbench app. Check the TSX
  source, exports, matching story, `sourceInsert`, registry linkage fields,
  CSS/Tailwind/token paths, and the page JSX that actually renders the
  component. Treat an app-source fix as justified only after that contract is
  coherent and the app still fails.
- Keep shared guidance in `docs/WORKBENCH-V1-AGENT-GUIDE.md`; avoid growing a
  separate Codex-only summary here.
- After changing `AGENTS.md`, `CLAUDE.md`, repository skills, agent skill
  discovery metadata, or the authoring MCP surface, run
  `npm run workbench:check-harness`.
