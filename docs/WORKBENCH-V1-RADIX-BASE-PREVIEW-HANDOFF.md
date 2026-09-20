# Workbench V1 Radix / Base UI Preview Handoff

## Current Decision

Workbench should support Radix UI, Base UI, and shadcn/ui-style component
dependencies as real rendering dependencies.

The reason is product fit: modern React component systems commonly rely on
libraries like Radix or Base for accessibility, keyboard interaction, focus
management, portals, dismiss behavior, and compound component state. Workbench
should not force every real project to rewrite those components as simple
native HTML.

## Editing Boundary

Workbench does not edit third-party primitive internals.

Workbench should edit only the wrapper/component contract authored by the
project:

- component insertion
- props
- children / slots
- text children
- className / style override where supported
- token-backed styling hooks

Workbench should not attempt to edit:

- Radix or Base internal DOM
- focus manager internals
- collection or roving tabindex implementation
- portal/focus trap internals
- internal state machines

For example, this is a valid Workbench-editable contract:

```tsx
<Accordion defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Details</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
</Accordion>
```

The internal implementation may use Radix, Base UI, or another dependency. The
editable tree should remain at the wrapper level.

## Runtime Work Needed Next

The preview runtime must be able to render dependency-backed source components
without requiring Workbench to understand their internals.

Required capabilities:

- Resolve project dependencies from source components and stories.
- Alias `react` and `react-dom` to the Workbench preview runtime React so hooks
  and contexts share one React instance.
- Handle ESM/CJS package shapes without dynamic require failures such as
  `Dynamic require(".../react.js") is not supported`.
- Inject component CSS into the preview iframe, including data-state styles used
  by Radix/Base/shadcn wrappers.
- Keep portals, popovers, dialogs, and overlays inside the preview boundary when
  possible.
- Treat dependency-rendered DOM as preview-only unless the wrapper explicitly
  exposes editable props or children.

## Starter Component Note

Workbench starter components may use Base UI primitives where the package
provides the correct behavior. The starter set should keep Workbench-owned
wrappers, token-backed CSS, stories, registry metadata, and source insertion
contracts while delegating behavior to Base UI primitives when appropriate.

When Base UI has no matching primitive for a component family, starter
components may stay Workbench-native while preserving the same source editing
contract.

Do not solve dependency-backed rendering by flattening every component to
HTML-only output. Rich runtime dependencies such as Radix, Base, Three.js,
canvas, charts, maps, and editors are valid preview dependencies when Workbench
edits their wrapper contracts instead of their internal DOM.

## Known Accordion Lesson

Using native `<details>/<summary>` as a quick Accordion replacement caused the
browser default disclosure marker and localized summary behavior to leak into
the Design canvas. shadcn/ui Accordion does not use `<details>/<summary>`; it
uses primitive wrappers with button-like triggers and state attributes.

The next implementation should prioritize dependency runtime support over
replacing Radix/Base behavior with unrelated native HTML semantics.
