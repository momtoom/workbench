# Workbench V1 Claude Instructions

This repository uses a shared agent guide so Claude Code and Codex Desktop work
from the same product and architecture rules.

Load context through skills, not by reading every guide.

For non-trivial Workbench V1 work, invoke the skill that matches the task. Each
skill names the specific guide sections and checks that task needs:

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

Do not preload the full `docs/WORKBENCH-V1-*` set. Start with the matching
skill, then read only the sections it routes to. Read a complete architecture
document only when the task genuinely spans that whole boundary. Claude
wrappers point to the shared definitions in `.agents/skills/`, which Codex
Desktop uses too — keep shared rules there rather than forking a Claude-only
copy.

Claude-specific operating note:

- Claude Code acts outside the app: it edits source, runs checks, verifies
  behavior, and collaborates with the user through the local workspace.
- Claude-authored TSX should be treated as a real source input path into
  Workbench's editable tree, preview, layers, and Inspector.
- The Workbench authoring MCP server is registered for Claude Code through the
  repo `.mcp.json` — the same `workbench` server Codex Desktop registers in
  its own config. Use it under the same explicit-`projectTarget` rules.
- `.claude/settings.json` carries the Claude harness: the standard check/test
  loop is pre-approved, push/deploy/publish ask first, and PreToolUse guards
  block direct registry JSON writes and accidental staging of Workbench
  session artifacts (see Commit Scope And Session Artifacts in
  `docs/WORKBENCH-V1-AGENT-GUIDE.md`).
- After changing `CLAUDE.md`, `AGENTS.md`, repository skills, agent skill
  discovery metadata, or the authoring MCP surface, run
  `npm run workbench:check-harness`.
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
  separate Claude-only summary here.
