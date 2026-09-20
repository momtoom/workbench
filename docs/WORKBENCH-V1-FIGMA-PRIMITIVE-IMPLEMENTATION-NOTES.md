# Workbench V1 Figma Primitive Implementation Notes

This note captures lessons from the `Figma Comp Test` primitive-component pass.
Use it when implementing or reviewing imported Figma library primitives in a
source-backed Workbench project.

It complements `docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md`. The authoring
guide defines the general contract; this note records the Figma-specific review
habits that prevented regressions during the primitive pass.

For the dependency-gated automation loop, also read
`docs/WORKBENCH-V1-FIGMA-PRIMITIVE-AUTOMATION.md`.

## Current Scope

The current stage is primitive authoring, not composed application UI.
Implement the smallest useful component units first:

- one component contract per primitive
- faithful variant axes
- real interactive behavior where the Figma state implies interaction
- Storybook controls, Design Inspector props, source insertion defaults, and
  preview output kept in sync

Do not treat a static screenshot match as complete if the component cannot be
edited, inspected, or interacted with in Workbench.

## Figma Review Checklist

Before editing code, collect the component evidence:

- Find the Figma component-set entry and its variant axes. In `Figma Comp Test`,
  `figma-library.index.json` listed deferred component sets and the reason often
  included the missing axes, such as `Type`, `Size`, `State`, `Shape`, and
  `Selected`.
- Inspect representative variants for every axis, not only the default
  component. At minimum inspect default, selected/active, hover/focus, disabled,
  each size, and each type variant.
- Record the default Figma preview state and make the Story/Inspector initial
  props match it. A component is confusing if the Inspector says one thing while
  the rendered preview shows another.
- Capture actual implementation details, not only appearance: whether an icon
  slot exists, whether a selected chip gains a close icon, whether a slider knob
  shows a tooltip, and whether a hover/focus state is only a static variant or a
  real browser interaction.

When Figma MCP access is unavailable, use the checked-in Figma index, screenshots
from the user, local tokens, and existing component stories as evidence. State
which source you used in the handoff.

## Variant Axes Are Public API

Every Figma variant axis that affects the primitive should appear in the source
component and in story controls, using semantic prop names:

- Figma `Type` -> `typeVariant` when `type` would collide with native DOM props
- Figma `Size` -> `size`
- Figma `State` -> `state`
- Figma `Shape` -> `shape`
- Figma boolean axes, such as `Selected`, -> boolean props, such as `selected`

For every public prop:

- add or update the TSX prop type
- expose it in the story `argTypes`
- include sensible `args` and `sourceInsert.props`
- add prop registry metadata when Inspector labeling, grouping, or picker
  behavior matters
- verify the rendered class/state changes in the browser

Do not add one-off CSS longhand props to match a single Figma frame.

## Defaults And Cleared Props

Default values need two different layers:

- Story/source insertion defaults should create the intended Figma preview.
- Component runtime should not silently recreate optional assets after the user
  clears the prop in Inspector.

The asset-slot rule from the `Chip`, `Badge`, `Button`, `Avatar`, and
`Breadcrumbs` fixes:

```text
If an asset prop is empty or undefined, remove the slot. Do not render a broken
image and do not replace it with an internal fallback.
```

Use helper checks such as `hasAssetSource(value)` before rendering `<img>`.
Keep default asset paths in story args/source insertion defaults, not in the
component body, when the user must be able to clear the slot.

## Asset Paths

Only use asset paths that exist in the running Workbench public asset space.
For the current local primitive pass, stable examples include:

- `/workbench-assets/icons/lucide-preview/list-filter.svg`
- `/workbench-assets/icons/lucide-preview/x.svg`
- `/workbench-assets/icons/lucide-preview/file.svg`
- `/workbench-assets/icons/lucide-preview/check.svg`
- `/workbench-assets/icons/lucide-preview/chevron-right.svg`
- `/workbench-assets/icons/lucide-preview/search.svg`
- `/workbench-assets/icons/lucide-preview/info.svg`

Before using a path in a story or preview page, confirm it exists under the app
`public/workbench-assets` tree or the active project public asset tree.

## Real Interaction Beats Static State

Figma state variants must be backed by real browser behavior when users expect
interaction:

- `hover` variants should also respond to `:hover` where safe.
- `focus` variants should respond to keyboard focus, not only a `state` prop.
- Checkbox, radio, toggle, tab menu, button group, and slider should own local
  interaction state for preview ergonomics.
- Boolean state motion must be bidirectional. For example, a toggle thumb needs
  an explicit off transform and an explicit on transform so both off -> on and
  on -> off animate.
- Slider knobs should be keyboard and pointer operable.
- Tooltip-like states should render through a reusable Tooltip primitive rather
  than ad hoc bubbles in each component.
- Dropdown/listbox/popover primitives must lift the open layer above sibling
  controls. CSS such as `filter`, `transform`, and `opacity` can create stacking
  contexts, so verify option clicks hit the menu and not the next component
  underneath it.

Keep the explicit `state` prop for inspection and static state previews, but do
not let it be the only way to see common interaction states.

## Subcomponents And Composition

Use a real subcomponent when Figma treats something as a reusable primitive.

The slider pass established this pattern:

- `Knob` is its own primitive.
- `Tooltip` is its own primitive.
- `SliderItem` composes `Knob`.
- `Knob` composes `Tooltip` when tooltip display is active.

The input pass added the same rule for editable text primitives:

- `Input` is the base text-entry primitive.
- Figma's `Input Items` should become reusable children where they carry their
  own state or slot contract. In the current pass this includes `InputLabel`,
  `InputHelper`, `InputButton`, and `InputDropdownTrigger`.
- `SearchInput` is a smaller source-backed primitive that depends on `Input`
  readiness but owns its search-specific anatomy.
- `SelectInput` is not just `Input` with dropdown text enabled. It is a
  combobox/listbox primitive with its own `Size`, `Target`, `Type`, and `State`
  axes plus open/selection behavior.
- Text-entry primitives should sync `value`/`defaultValue` into local state
  without becoming immutable when source insertion provides `value: ""`.
- Input lead/tail dropdown slots should be semantic trigger buttons. They can
  visually live inside `Input`, but real select/dropdown selection state belongs
  in a dedicated select/dropdown primitive.
- If an input dropdown slot is presented as a selectable trigger, it must update
  its visible value, close after single selection, expose its options through
  props, and pass browser verification. Callback-only triggers are not enough.
- Dropdown Menu is a connected primitive chain, not a single visual block. In
  the current Figma library the Dropdown page separates `Dropdown / Button`,
  `Dropdown / Base`, `Dropdown / Select`, `Dropdown / Extended`, `Base menu`,
  `Select menu`, and `Extended menu`. Implement this as
  `Trigger -> Popover -> DropdownMenu -> DropdownMenuItem`, then compose
  `InputDropdownTrigger` and `SelectInput` from that chain instead of cloning
  ad hoc option buttons inside each parent.
- Preserve the item variant axes from the Dropdown page. `Base menu` has
  `State`; `Select menu` has `Type`, `State`, `Select mode`, and `Selected`;
  `Extended menu` has `Size`, `Type`, and `State`; `Dropdown / Button` has
  `Position` and `Open`. Static state props still need matching browser hover,
  focus, selected, disabled, and open/closed behavior.
- Context matters for item slots. A full select menu item may show support text
  such as `@support`, but small input currency/country dropdown slots should
  pass `supportTextVisible={false}` so clearing or shortening the option does
  not leave clipped support text in the menu.
- Boolean slot props should normalize Workbench string values such as `"false"`.
  Do not rely on `Boolean(value)` for Inspector-facing props because
  `Boolean("false")` is `true`.

This keeps primitives inspectable and prevents one-off duplicate tooltip/knob
rendering inside larger components.

## Page Preview Handoff

After primitive work, place representative component instances on a project page
so the Design Editor can verify them as source-backed instances, not only as
Storybook stories.

For `Figma Comp Test`, `src/workbench-pages/UntitledPage.tsx` now serves as a
primitive preview board. A good preview board should:

- import the local library components through the project library barrel
- avoid static inline styles
- use a page-scoped CSS file for layout
- keep preview-board layout classes in a CSS path that the Design Editor iframe
  actually injects; for `Figma Comp Test`, mirrored
  `.figma-comp-preview-*` layout rules live in the local component library CSS
- let the standalone preview document or Design Editor preview root own page
  scrolling; do not put `overflow: scroll/auto` inline on the preview page
  `<main>` unless the page is intentionally a nested scroll surface
- include default, selected/active, disabled, asset-backed, and subcomponent
  examples
- keep the page readable in Design Editor layers
- use real assets and realistic labels

Storybook verifies the component contract. The page preview verifies source
projection, layer visibility, and composed usage.

## Browser Verification

After component or page changes, verify in the running app:

- reload the current local URL
- open Storybook when checking controls and default args
- open Design Editor when checking source-backed page instances
- inspect the preview iframe for rendered component counts and critical classes
- clear asset props from Inspector and confirm slots disappear
- click/keyboard-test simple interactions where applicable
- for dropdown/listbox components, verify initial closed state, open count,
  option selection, close behavior, and stacked-menu click targets
- check browser console errors and warnings

Useful command checks:

```bash
npm run check
npm run figma:primitives:audit
npm run build
```

The Vite chunk-size warning is currently expected; new runtime errors or broken
image requests are not.

## Common Regressions To Avoid

- Inspector defaults differ from the actual preview state.
- A cleared asset prop reappears because the component has an internal fallback.
- A missing asset path renders as a broken image.
- Figma hover/focus variants exist, but real hover/focus does nothing.
- A state animation only works in one direction because the resting state relies
  on implicit CSS values such as `transform: none`.
- A subcomponent visible in Figma is hand-rolled inside a parent instead of
  becoming a primitive.
- New props are added in TSX but missing from story controls or prop registry.
- A component is added to source but not exported or registered.
- A boolean prop works in Storybook but breaks in Design Editor because the
  Inspector passed `"false"` as a string.
- An opened dropdown is visually present but a later sibling control receives
  the click because of stacking context order.
- A page preview is built with inline styling that Workbench cannot inspect
  cleanly.
- Page preview spacing is added only to a CSS file that the Design Editor iframe
  does not inject.
- A preview board wraps all content in its own fixed-height scroll container, so
  the standalone browser preview or iframe root cannot scroll naturally.
- Verification stops at `npm run check` without browser preview inspection.
