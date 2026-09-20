# Workbench V1 Figma Primitive Automation

Use this workflow when continuing the `Figma Comp Test` primitive pass.

The goal is not blind batch generation. The goal is a slow, repeatable loop that
keeps Figma anatomy, source code, Storybook controls, Design Inspector props,
and preview pages aligned.

## Rules

- Work one source-backed component at a time.
- Check child dependencies before implementing a component.
- Do not scaffold a component when a required child primitive is missing.
- Use Figma as evidence for variant axes, default preview state, component
  properties, child anatomy, and asset slots.
- Put fallback assets in stories/source insertion defaults, not inside component
  runtime code.
- If a user clears an asset prop, remove that slot instead of showing a broken
  image or restoring a fallback.
- Treat Inspector numeric values as runtime input, not only Storybook input.
  Number controls can arrive as strings, so number-like component props should
  accept `number | string` and normalize inside the component.
- Treat Inspector boolean values the same way. Boolean controls can arrive as
  strings, so slot and state props should normalize `"true"`/`"false"` instead
  of using `Boolean(value)`.
- Treat text `value` defaults on editable primitives carefully. If
  `sourceInsert.props` includes `value: ""`, the component should still allow
  local preview typing instead of becoming a locked controlled input.

## Commands

```bash
npm run figma:primitives:plan
npm run figma:primitives:write-specs
npm run figma:primitives:audit
```

`figma:primitives:plan` compares `.workbench/figma-library.index.json` with the
local source, component registry, prop registry, and dependency config.

`figma:primitives:write-specs` writes draft JSON specs under
`.workbench/figma-primitive-specs`. Draft specs are planning artifacts. Review
Figma anatomy before using them for implementation.

`figma:primitives:audit` runs the existing story/order/sourceInsert audits
against `Figma Comp Test`.

It also checks numeric Storybook controls against the component runtime. A
component with number controls must:

- type those public props as `number | string` or a local numeric alias backed
  by `number | string`
- normalize string values with `Number.parseFloat`
- support plain numeric strings like `"50"` and percentage strings like `"50%"`
  where the prop maps to progress, slider, count, or index values

Story prop order is warning-only in the primitive audit because the existing
library pass has many pre-existing order differences. Use `--strict-order` with
`scripts/figma-publisher/primitive-automation.mjs audit` when you want ordering
to block the run.

## Dependency Gate

Dependency configuration lives at:

```text
projects/Figma Comp Test/.workbench/figma-primitive-automation.json
```

Examples:

- `Search Input` and `Select Input` are blocked until `Input` exists.
- `Quantity Stepper` is blocked until `Button` and `Input` exist.
- `Checkbox Label`, `Radio label`, and `Toggle Label` depend on their base
  selection primitives.
- `Badge Group`, `Avatar group`, and `Avatar Container` depend on their base
  primitive.

When a component is blocked, the scaffold command refuses to create files.

## Implementation Loop

1. Run `npm run figma:primitives:plan`.
2. Choose the smallest ready component with no blocked dependency.
3. Inspect that component in Figma through MCP.
4. Record public axes, component properties, default preview state, slots, and
   expected interaction behavior.
5. Implement the component source, story, export, CSS, component registry, prop
   registry, and preview page example.
6. Run `npm run figma:primitives:audit` and `npm run check`.
7. Verify the running preview page in the browser.

For dropdown, select, tooltip, and popover-like primitives, browser verification
must include stacking behavior: start closed, open exactly one layer, select or
click an item inside the layer, and confirm a later sibling control did not
receive the click.

## Current First Component

`ProgressBar` is the first dependency-gated single-component implementation.
It was chosen because it has no missing external child primitive and provides a
small test case for:

- Figma variant axes: `Direction`, `Target`
- component properties: label, progress text, helper, tail icon
- Inspector defaults matching the Figma preview state
- cleared asset slots removing icons

Follow-up insight from `ProgressBar` and `SliderItem`: the Workbench Inspector
may pass a numeric prop as a string. Existing numeric primitives were hardened
for this, and `npm run figma:primitives:audit` now fails if future number
controls are backed by source props that only accept raw `number`.

Follow-up insight from `Input` and `SearchInput`: editable text primitives need
an internal value mirror that syncs when the prop/default changes but still
updates locally on browser input. This keeps Storybook/sourceInsert defaults
aligned with Figma without making the preview field immutable.

Follow-up insight from `Input` child reconstruction: when Figma exposes input
items such as Label, Helper, Input Button, or dropdown slots, implement them as
reusable children before rebuilding the parent. Dropdown-looking input slots
must change their displayed value and close on selection in the browser; an
`onClick` callback without selection state is incomplete.

Follow-up insight from `SelectInput`: a Figma input-looking component may still
be a different interaction primitive. Treat dropdown/select fields as
combobox/listbox components with real open and selection behavior instead of
only enabling visual dropdown text slots on `Input`.

Follow-up insight from `SelectInput` browser verification: open menus need a
root-level stacking rule, not only a high `z-index` on the menu node. Wrapper
effects such as `filter: drop-shadow(...)` create stacking contexts and can put
later sibling fields above the menu.

Follow-up insight from the `Dropdown Menu` page: some Figma pages describe a
connected primitive system rather than one standalone component. For Dropdown,
inspect and implement the smallest connected chain in dependency order:
`DropdownButton`/trigger, `Popover`, `DropdownMenu`, then `DropdownMenuItem`.
Parents such as `SelectInput` and `InputDropdownTrigger` should reuse that chain
instead of carrying private option-button markup. Add an automation check for
this class of issue: if a parent renders a listbox/menu, confirm the item
variant axes from the child page are represented and that context-specific
slots such as support text can be disabled.
