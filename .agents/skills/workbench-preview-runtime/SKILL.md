---
name: workbench-preview-runtime
description: Use when working on Workbench preview rendering, iframe isolation, source tree preview, page preview, runtime component imports, CSF story runtime loading, "No story preview" failures, Vite project filesystem URLs, Tailwind runtime classes, project CSS loading, asset/font/icon preview behavior, portals, overlays, or preview-to-layer projection.
---

# Workbench Preview Runtime

## Required Reading

Read relevant sections from:

- `docs/WORKBENCH-V1-ARCHITECTURE.md`
  - Source Component Runtime
  - Project Runtime CSS, Tailwind, And Assets
  - `preview-projection.service.ts`
  - `preview-layer.service.ts`
- `docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md`
  - Project Library CSS Loading
  - Overlay And Portal Rules
  - Asset, Icon, And Font Source Rules
- `docs/WORKBENCH-V1-AGENT-GUIDE.md`
  - Project Symptom Triage Gate
  - UI Implementation Rules (read only the relevant rules)
  - Canvas Interaction Invariants (only for selection/drag/overlay behavior)

## Runtime Rules

- Keep preview rendering isolated in iframes where the existing architecture expects isolation.
- Resolve project-relative source paths against the active project root.
- Load only the active project CSS/runtime assets needed for the preview; avoid eager-loading every project.
- Keep Tailwind runtime class collection and injected CSS ordering stable.
- Keep portals and overlays contained in the preview/runtime stage when they belong to the component preview.
- Do not treat missing preview as a reason to weaken source/story contracts.
- Do not broaden the Design canvas runtime to mask malformed project source. Prefer fixing source, story imports, CSS paths, dependency aliasing, or a local runtime island boundary.
- Keep `src/domain/preview/previewWheelGesture.ts` as the shared owner of
  snap-wheel and momentum decisions used by both `SourceTreePreview` and
  `page-preview`. Do not fork the gesture heuristic inside either consumer.
- Keep preview appearance separate from preview token mode selection. Explicit `light` or `dark` appearance may set root media attributes such as `data-theme`, `data-astryx-media`, and `data-wb-preview-appearance`; every preview root must also expose effective `data-wb-token-modes` so selector-based token CSS and inline token variables agree. `system` appearance derives effective light/dark token modes from `prefers-color-scheme` at render time and must not persist that derived choice as the user's saved token mode selection.
- Treat selection instrumentation as part of the preview projection boundary. Even a `display: contents` selection anchor can break valid React contracts when a parent parses child component types, a library owns compound children, or CSS depends on direct children. For valid project components in that class, inject runtime selection props directly into the rendered component, add the root/sub-component name to the direct runtime-prop path, or render slot-marker children through the runtime-owned children path before passing them to the parent.
- Prefer eliminating editor-only DOM wrappers over hiding them. A runtime fix is
  suspect if it makes the browser/page preview look right while Layers or
  Inspector lose the registered component identity.
- Selection metadata belongs on the real component root whenever the component
  can forward root props. Only fall back to a separate selection anchor for
  simple leaf/native nodes or components that are explicitly not inspectable.
- For Select/Combobox/Menu/Popover/Dialog/Sheet/Drawer and slot-owned families,
  preserve the trigger/content/slot child contract first; do not interpose DOM
  between a parent and a child that the library parses by component type.
- Follow the Canvas Interaction Invariants in
  `docs/WORKBENCH-V1-AGENT-GUIDE.md`: overlay items resolve to their own
  authored id before wrapper/descendant recovery and never to a text leaf;
  projection passes never overwrite live authored identity from another
  branch (an `aria-controls` surface with its own node id is the collection
  owner, not the trigger); at most one hydration swap per page load and no
  remounts on selection; preview appearance forcing reaches `<html>` as well
  as `<body>`.
- Test live component interaction in the Design canvas with
  `Option/Alt+click` or `Option/Alt+drag`. Unmodified pointer input is owned by
  editor selection/structural drag, so it must not be used to conclude that a
  runtime control is broken. Assert both the component effect and unchanged
  editor selection.
- After canvas selection/drag/overlay/preview-runtime changes, run
  `npm run test:gestures` (isolated real-input regression suite) and add a
  spec for any gesture bug you fix.

## Debug Workflow

1. Identify which preview path is failing: design source preview, page preview, Storybook/library preview, or Add child picker thumbnail.
2. Check source import path, export name, project root, and Vite `/@fs` URL construction.
3. Check CSS loading order: token CSS, library CSS, project CSS, Tailwind runtime CSS.
4. When the selected element shows a class but the class appears ineffective,
   inspect the Inspector's class-effectiveness result before changing the
   runtime. `src/domain/preview/cssClassEffectiveness.ts` owns the shared
   `applied`, `overridden`, `not-forwarded`, and `inactive` classifications.
5. For light/dark or theme bugs, inspect the preview root attributes, effective token mode map, and generated token CSS selectors before blaming component CSS.
6. When browser/page preview is correct but the Design canvas is wrong, inspect whether selection anchors changed direct child structure, compound child ownership, or parent-side slot parsing.
7. For CSF stories, distinguish metadata import from runtime render import.
8. Isolate failures per component or module; one bad story should not drop unrelated previews.
9. Verify layer projection, selection rings, and Inspector props after render fixes.
10. For wrapper-sensitive fixes, open the exact Design canvas target and select
   both the parent and representative child. The fix is incomplete until the
   registered Inspector props appear for those nodes.

## Before App Runtime Changes

For a preview failure in a local project, first prove:

- The page/component source imports the intended file and export.
- The story module exports the intended story and can render with its args.
- Registry linkage points at project-relative `sourceFile` and `storySourceFile` values.
- Required packages are installed or intentionally isolated behind a runtime island.
- CSS and token paths resolve from the project root, not from the Workbench app package or a localhost URL.
- The page/component uses registered components for designer-meaningful nodes
  rather than raw markup or page-local wrappers when Inspector props are expected.

Patch Workbench runtime code only when the project contract is valid and the
remaining failure is the loader, Vite aliasing, iframe isolation, dependency
dedupe, CSS crawler, portal containment, or projection boundary.

When the remaining failure is selection-wrapper interposition, patch the
projection boundary narrowly and prove it with Design canvas evidence. Avoid
large allowlist expansions unless each added family has a concrete browser/page
preview and Design canvas regression case.

## Common Symptoms

- `No story preview`: story runtime import failed, render fallback missing, source export mismatch, or module compile error.
- Components render unstyled: CSS path/snapshot root/loading order issue.
- A class is present but has no visible effect: distinguish `overridden`,
  `not-forwarded`, and `inactive` Inspector evidence before treating it as a
  CSS-loader regression.
- Tailwind class edits flash or revert: runtime class collection or injection ordering issue.
- Portal content escapes preview: portal container/stage isolation issue.
- Assets/icons/fonts missing: project asset URL, registry source, or font loading mismatch.
- Browser/page preview works but the Design canvas stacks slot children, loses grouped button corners, or shows fallback child content: selection wrapper interposition around a wrapper-sensitive component.
