---
name: workbench-core-triage
description: Use when investigating Workbench V1 bugs, regressions, broken editor behavior, selection/scope issues, nested component editing failures, stale preview trees, persistence bugs, variant editing confusion, panel responsibility drift, source parse/writeback failures, or when deciding whether behavior should be kept, redesigned, or discarded according to the V1 core triage guide.
---

# Workbench Core Triage

## Required Reading

Use the symptom and local module names to find the owning sections first. Read:

- the matching Keep/Redesign/Discard section in
  `docs/WORKBENCH-V1-CORE-TRIAGE.md`;
- the owning service/source-of-truth section in
  `docs/WORKBENCH-V1-ARCHITECTURE.md`;
- only the relevant project-triage, source, preview, or canvas invariant
  section in `docs/WORKBENCH-V1-AGENT-GUIDE.md`.

Read the complete documents only when the failure spans the editor core rather
than one identifiable loop.

For component-specific symptoms, also use `workbench-component-authoring`.

## Triage Frame

Classify the behavior before fixing it:

- Keep: TSX <-> tree core, iframe renderer isolation, browser-side transformation, typed IPC/contracts, domain split, service direction.
- Redesign: selection/drill/scope, nested component instance editing, expanded subtree versus persisted state, preview projection, editor session lifecycle, variants, panel responsibilities.
- Discard: direct debug logging in feature flow, panel-local persistence decisions, global guard flags as primary safety, raw breadcrumb as main scope primitive, implicit expanded-state persistence, compatibility-only drift layers.

## Debug Workflow

1. Reproduce the symptom and name the affected loop: parse, project registry, selection scope, source writeback, preview projection, Inspector, persistence, or runtime preview. For live component interaction inside the Design canvas, reproduce with `Option/Alt+click` or `Option/Alt+drag`; an unmodified pointer gesture intentionally belongs to editor selection/structural drag.
2. Trace the call path with `rg`; do not guess from UI symptoms alone.
3. Identify whether the bug comes from stale registry data, authored TSX, derived expanded tree, session state, or renderer projection.
4. Fix the owner layer, not the closest panel.
5. Add or update a guard check when the bug is a boundary regression.

## Project-Source Triage Gate

For symptoms inside a generated/local project, check the project contract before
changing Workbench app code:

- TSX source and exports.
- CSF stories, `args`, `argTypes`, `sourceInsert`, and story runtime imports.
- `.workbench` linkage fields and project-relative paths.
- CSS, token CSS, Tailwind compiled CSS, assets, icons, and fonts.
- For a visible class with no effect, inspect the selected DOM node and the
  Inspector result from `src/domain/preview/cssClassEffectiveness.ts`.
  Distinguish `overridden`, `not-forwarded`, and `inactive` evidence from a
  missing stylesheet before changing app runtime code.
- The selected layer's real backing source: component instance, native DOM node, read-only runtime boundary, or stale projection.

Only classify the issue as an app regression after those inputs are coherent
and the app still misparses, misprojects, misselects, or writes to the wrong
source path.

## Common Decisions

- If a panel makes persistence decisions, move that decision to the appropriate service/domain layer.
- If selection depends on breadcrumbs or incidental DOM shape, restore explicit scope/selection state.
- If expanded subtree state leaks into authored persistence, separate derived state from canonical source.
- If compatibility code only supports historical drift, prefer migration/normalization plus checks.

## Verification

Use `npm run check`, relevant guard scripts, and a workflow-level manual verification. Report unrelated dirty-worktree blockers precisely.
