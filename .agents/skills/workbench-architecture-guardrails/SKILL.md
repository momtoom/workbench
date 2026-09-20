---
name: workbench-architecture-guardrails
description: Use when changing Workbench V1 architecture, state models, source-of-truth boundaries, DesignEditor internals, editable tree parsing/writeback, selection scope, instance editing, preview projection, persistence, services, stores, shell boundaries, project loaders, or broad refactors across features/domain/renderer/shared modules.
---

# Workbench Architecture Guardrails

## Required Reading

Use `rg` for the affected service/module and section headings before loading
large guides. Read:

- the owning sections in `docs/WORKBENCH-V1-ARCHITECTURE.md`;
- the matching Keep/Redesign/Discard section in
  `docs/WORKBENCH-V1-CORE-TRIAGE.md` when ownership is disputed;
- the relevant source, preview, component, token, or canvas invariant section
  in `docs/WORKBENCH-V1-AGENT-GUIDE.md`.

Read the complete architecture and triage documents only for a genuinely broad
core refactor.

## Core Rules

- Keep panels thin; move reusable behavior into domain/service code when the logic is shared.
- Use one editing intent and one write path per mutation.
- Persist compressed canonical state; derive expanded runtime/editor state.
- Treat scope as first-class state, not incidental breadcrumbs.
- Keep renderer projection separate from editor state.
- Make debugging opt-in and scoped.
- Treat agent-authored source as an input boundary that must hydrate into tree, preview, layers, and Inspector.
- Do not add app-level compatibility layers to hide malformed project source, stale registry metadata, unsupported story controls, or CSS paths that should be fixed in the project contract.
- Keep preview appearance, token collection mode selection, and component-level theme/media props as separate state boundaries; derive cross-boundary preview effects rather than persisting one boundary as another.
- Preview selection instrumentation must preserve valid component runtime structure. Do not let an editor-only wrapper change direct-child ancestry, compound ownership, or parent-side slot parsing for coherent project source; fix that at the projection/runtime boundary with an explicit direct-prop path.

## Source Of Truth

- TSX source and project metadata are not interchangeable. Know which one owns the behavior being changed.
- Do not persist expanded component instance trees as if they were authored source.
- Do not let panel-local state decide persistence or source writeback.
- Do not add compatibility layers only to preserve historical drift.
- Keep typed contracts and shared boundary files explicit.
- Treat curated organizational context as project-owned documentation. MCP may
  inspect the fixed public/curated context file, but must not crawl Git history,
  session artifacts, raw conversations, or personal memory. Preserve an
  explicit unavailable/excluded state when the reviewed context is absent or
  not marked for public use.

## Refactor Workflow

1. Map the current call chain with `rg`.
2. Identify the canonical owner: document source, project registry, editor session, preview session, or UI state.
3. Move logic only when it reduces duplication or restores the documented boundary.
4. Preserve existing user-authored source and dirty worktree changes.
5. Add or update checks that protect the boundary being fixed.

## App Versus Project Boundary

Before changing shared Workbench architecture for a project-visible symptom,
prove that the active project contract is coherent. Project-level mistakes
belong in project source or generated-project guidance; app-level fixes belong
only where parsing, projection, persistence, selection, or runtime loading
breaks valid project input.

## Verification

Run `npm run check` and a focused guard script when available. For editor behavior, verify source parse, writeback, preview projection, layer selection, and Inspector behavior together.
