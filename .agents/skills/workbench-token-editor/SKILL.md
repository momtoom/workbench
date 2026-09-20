---
name: workbench-token-editor
description: Use when creating, editing, debugging, or refactoring Workbench V1 token editor behavior, token collections, token groups, token modes, token references, unit tokens, token CSS generation, TokenEditorSidebar, TokenPicker, TokenInlineValueEditor, TokenValueEditor, token metadata, token usage indexes, or token-related Inspector/style controls.
---

# Workbench Token Editor

## Required Reading

Read:

- `docs/WORKBENCH-V1-TOKEN-EDITOR-ARCHITECTURE.md`
- `docs/WORKBENCH-V1-AGENT-GUIDE.md` Token Editor Rules
- `docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md` Token Rules

## Token Model Rules

- Preserve explicit unit token behavior. Do not silently coerce dimensions, durations, opacity, angles, or numbers into ambiguous strings.
- Respect collection layering and mode resolution.
- Keep token references visible and editable through the correct token-aware controls.
- Keep metadata, groups, ordering, and usage indexes consistent.
- Do not make token editor UI a generic JSON editor.
- Do not break live preview token variable updates.
- Do not fix token-visible styling problems by hardcoding raw CSS in components before checking token JSON, generated token CSS, component CSS variables, and preview CSS loading.
- Do not conflate preview appearance with token modes. Token modes are per-collection design selections; preview appearance is the rendering media state. In `system`, derive effective light/dark collection modes from `prefers-color-scheme` at render time without mutating the saved preview token mode selection.
- For new or revised reusable components, component-token registration is part of done. Component-owned visual values should live in the component token collection and CSS should consume the generated component-token variables instead of primitive raw values directly.
- Preserve the authoring chain: component token -> semantic role token -> primitive raw token. Add a new semantic token only when the role is shared across components; add a new primitive token only when the raw value is reusable design material.
- For Astryx-backed token consumers, follow Astryx's official integration-path rule: prefer CSS variable aliases for DOM styling, Tailwind bridge CSS only for token-backed utilities, StyleX imports only for StyleX styles, and JavaScript token resolver APIs only for charts, canvas, SVG, or config objects that cannot consume CSS custom properties.
- Follow the Token CSS Export Scoping Rules in `docs/WORKBENCH-V1-TOKEN-EDITOR-ARCHITECTURE.md`: bridge/alias var() chains are declared at `:root, [data-wb-token-modes]` (never `:root` alone), the three generators (`cssExport.ts`, `scripts/workbench-token-css.mjs`, `scripts/workbench-template.mjs`) stay in sync, and app-generated project token CSS is never regenerated with the reduced script mirror.

## Workflow

1. Identify the token surface: registry model, editor sidebar, value field, picker, reference resolution, CSS generation, preview mode, or usage index.
2. Read the matching architecture section before editing.
3. Preserve source token IDs and references unless the task is an explicit migration.
4. Keep inline edit controls stable: cancel/commit actions must be explicit where the UI uses draft editing.
5. When component work introduces reusable visual values, verify `.workbench/tokens.json`, generated token CSS, and component CSS all changed together. If component tokens were not added, explain which existing tokens cover those values.
6. Run token-specific checks or design guard checks after changes.

## Token Usage Triage Gate

When a component or page looks wrong because of color, radius, typography,
spacing, or modes, inspect the full chain before editing app code:

- `.workbench/tokens.json` collection, mode, group, token id, and reference value.
- Generated `src/workbench-tokens.css` variable name and value.
- Component CSS consuming component-token variables rather than primitive raw values.
- Project CSS/Tailwind/token CSS loading in preview.
- Inspector field metadata and token picker binding.
- Preview root attributes: `data-wb-preview-appearance`, `data-theme`, library media attributes such as `data-astryx-media`, and effective `data-wb-token-modes`.

Only change token editor internals when valid token data is displayed,
resolved, written, or previewed incorrectly.

## Verification

- `npm run check`
- `npm run workbench:check-design`
- Focused UI verification for add/edit/rename/reorder/reference/mode switching when practical
- `git diff --check -- <touched files>`

If a token issue affects component rendering, also use `workbench-preview-runtime`.
