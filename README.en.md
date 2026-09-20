# Workbench

English · [한국어](README.md)

A local authoring tool for designers who work **on the real code**.

> Personal and internal company use are allowed, and you may sell what you build with it.
> Reselling Workbench itself, or using it to offer a competing product or service, is not.
> [License](#license)

What you change on screen is saved straight into the project's `.tsx` files. There is no
design file to keep in sync and no mockup to hand to a developer.

![Workbench open next to a Codex conversation while a page is edited](docs/assets/workbench-with-codex.webp)

Codex is connected to the project folder. On the left it lists the components this page
uses; on the right the same page sits in Workbench with Layers and the Inspector open.

## What you can do

- Open a screen your AI coding agent wrote and **edit it through Layers and the Inspector**
- Change **design tokens** while looking at the screen, and see every component that uses them follow
- Move Figma components and variables into **the project's real components and tokens**
- Leave the result as **source code you can commit** — no handoff step

### Good to know

You don't need to write code. It does help to have **a feel for CSS and Tailwind classes**,
because the values in the Inspector are the actual classes and style properties. Knowing
that `p-4` means padding is enough.

Workbench works with React projects.

---

# Getting started

A few steps use the terminal. If that isn't your thing, show this section to a developer on
your team. It is a one-time setup.

## 1. Install

You need Node.js and git.

```sh
git clone https://github.com/momtoom/workbench.git ~/workbench
cd ~/workbench
npm install
```

pnpm works too; replace `npm run` with `pnpm run` in the commands below.

## 2. Connect your coding agent

Workbench has no AI inside it. **You connect the Claude Code or Codex you already use.**
Nothing extra to pay for, and you can swap the agent later.

```sh
# Claude Code
claude mcp add --scope user workbench -- node ~/workbench/scripts/workbench-authoring-mcp.mjs

# Codex
codex mcp add workbench -- node ~/workbench/scripts/workbench-authoring-mcp.mjs
```

Register it once and you're done.

## 3. Open it

```sh
npm run dev
```

Open the address the terminal prints (usually `http://127.0.0.1:5174`) in your browser.

## 4. Create a project

On the first screen press **Initialize project**, give the project a name, pick a setup, and
press **Initialize**. Choose where to keep it, and the project folder is created there and
its packages are installed for you.

| Setup | What you get |
| --- | --- |
| Default | An empty start |
| shadcn | A shadcn-style component set |
| Astryx | The Astryx design system and its themes (open source, by Meta) |

The folder gets a `.workbench/` configuration, a starter page, and **instruction files for
coding agents**. That last part matters: run an agent inside this folder and it recognises
the project as a Workbench project on its own.

Projects you already made open through **Open project**.

## 5. Make your first page

Run the agent **from inside the project folder**. This part matters.

```sh
cd ~/my-project   # the folder from step 4
claude
```

Workbench never guesses which project you mean. Running from the project folder is what
keeps an agent from touching the wrong repository.

Then just ask, the way you always do.

> "Make me a settings page with an account section and notification toggles."

Before writing anything new, the agent **looks for components the project already has**, so
screens stay assembled from the same vocabulary as they pile up. It also checks that what it
wrote actually renders.

Look at the browser: the page is there. Now it's your turn to change it.

---

# The interface

Four menus sit in the left rail.

| Icon | Menu | What it does |
| --- | --- | --- |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/icons/images-dark.svg"><img src="docs/assets/icons/images.svg" width="16" height="16" alt=""></picture> | **Asset Manager** | Install icons, images and fonts, and register them with the project |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/icons/palette-dark.svg"><img src="docs/assets/icons/palette.svg" width="16" height="16" alt=""></picture> | **Token Editor** | Create and edit colour, type, spacing and radius tokens |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/icons/book-open-dark.svg"><img src="docs/assets/icons/book-open.svg" width="16" height="16" alt=""></picture> | **Storybook** | Review components variant by variant |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/icons/braces-dark.svg"><img src="docs/assets/icons/braces.svg" width="16" height="16" alt=""></picture> | **Design Editor** | Edit pages on the canvas — where the work happens |

The Design Editor has three areas: **the canvas** in the middle, **Layers** on the left and
**the Inspector** on the right. Pick something on the canvas and Layers highlights the same
node while the Inspector fills with that element's values.

Those values are not a description. They are **exactly what the code says**.

---

# Editing

## Selecting

**Click** selects. A component is selected as one piece: click a card and you get the card,
not the heading inside it.

**Double-click** goes inside it. Double-click the card and its heading and body become
selectable on their own, the way entering a group works in Figma.

**Shift-click** adds to the selection.

## Shortcuts

Close to what you already use in design tools. (`Cmd` is `Ctrl` on Windows.)

| Shortcut | What it does |
| --- | --- |
| `Cmd + Z` | Undo |
| `Cmd + Shift + Z` · `Cmd + Y` | Redo |
| `Cmd + C` · `Cmd + X` | Copy · cut |
| `Cmd + V` | Paste **below** (as a sibling) |
| `Cmd + Shift + V` | Paste **inside** (as a child) |
| `Cmd + D` | Duplicate |
| `Backspace` · `Delete` | Delete |
| `I` | Add an element inside the selection |
| `Shift + W` · `Cmd + Shift + G` | Wrap |
| `↑` `↓` | Move up · down in order |
| `Alt + ←` · `Alt + →` | Move one level out · in |
| `Alt + W` | Close the current tab |

There are two pastes because code has a hierarchy. `Cmd + V` puts it **next to** the
selection, `Cmd + Shift + V` puts it **inside**.

## Wrapping

`Shift + W` wraps the selection in something. Two kinds:

- **Wrap in a component** — one of the project's layout or container components. Pick three
  buttons, wrap them in `Stack`, and the stack's alignment rules apply
- **Wrap in an HTML tag** — `section`, `div` and friends, when you need the semantics

Not everything can wrap everything. If a component only accepts certain children, Workbench
blocks the wrap and tells you why.

## Editing tokens

Change a colour or a spacing step in the Token Editor and **every component using that token
follows immediately**. The result is written to the project's `src/workbench-tokens.css`.

Tokens come in three tiers.

```
primitive   real values such as #0f172a or 16px
semantic    surface.default → slate.900
component   button.bg      → surface.default
```

Change one brand colour and the semantic tokens referencing it follow, then the components
that use those. Light and dark modes work the same way.

## Some parts you can't edit

Some regions show up on screen but cannot be selected in Layers. Usually they are **drawn
from data that arrives at runtime** — a list whose length differs on every run, say.

Workbench marks those as **editing boundaries** rather than pretending they are editable.
To change one, ask the agent or talk to a developer.

---

# Bringing your design system

If your agent has a Figma connection (MCP), you can move it over. **The order matters.**

**1) Tokens first** — components reference them. Export the Figma variables as JSON and hand
that over.

> "Load this Figma variable export as Workbench tokens."

Figma collections and modes map across as they are. If you were using light and dark, that
structure survives.

**2) Icons, images, fonts** — also before components.

> "Install this icon set and register it."

**3) Components** — small ones first, then the compositions.

> "Convert this Figma component into a Workbench component. `<Figma URL>`"

This is where **editability** is decided. Every Figma variant axis (Size, State, Selected and
so on) has to come through as an adjustable control, and repeating elements such as list rows
or menu items have to stay **individually selectable**. Workbench checks this and rejects
what doesn't hold.

**4) Pages** — assembled from the components you moved over.

---

# Why it works this way

Ask an AI for a screen and the result is **code**. A developer edits it straight away. A
designer can't. The same starting point splits from there.

```
idea → AI generates → a finished screen
                          │
                 can you edit the code?
                     ├── yes ──→ keep going in place            … minutes
                     └── no  ──→ rebuild it in a design tool
                                 → hand it to a developer
                                 → implement it again            … days
```

The gap isn't skill. It's **tooling**.

The same break repeats across a team. A PM's prototype can't be adjusted by a designer, so it
gets rebuilt; a developer reimplements the handed-over mockup. Everyone can make things now,
and **nobody can pick up what someone else made.**

Workbench puts all three in the same file.

```
   design system          coding agent             designer
   sets the standard      builds the screen        edits the result
   tokens · components →  TSX source          →    visual editing
         └──────────────────────┴───────────────────────┘
                one project · your organisation's repository
```

That is why a project is a **local folder** and not a cloud account. A design system and a
product codebase carry more than files and history: they carry the judgement an organisation
has accumulated. The question to ask about a tool is not what it does for you, but **what is
left when you take it away**.

The longer argument is in [Design Process With AI](https://momtoom.github.io/workbench/design-process/).
That document is itself a page made and edited in Workbench.

## What Workbench is not

| | |
| --- | --- |
| A code generator | It doesn't emit once and walk away. The output stays something you keep editing |
| A design tool | There is no separate design file. The source is always the original |
| A prototyping tool | Not a mockup to throw away, but code that stays in the product |
| An AI chat app | There is no prompt box in the app. The AI connects from outside |
| A cloud service | The source stays in your repository |

For idea sketches or research mockups, Figma is the easier tool. Workbench is for screens
**that are already code**.

---

# Technical notes

<details>
<summary>For developers — expand</summary>

## Structure

A React app in the browser that reads and writes a local project folder.

```
src/              the app (domain / features / shared UI)
host/             local host layer
  local-bridge/     links a deployed app to a project on your machine
  local-preview/    compiles project TSX for the preview
scripts/          MCP server, project templates, checks
api/ server/      optional hosted core (local use works without it)
```

Run it the usual way with `npm run dev` and the dev server (`vite.config.ts`) handles project
files directly, so the bridge isn't involved. It is only for a deployed app, started with
`npm run workbench:bridge`.

The AI connects **through the MCP server**, not from inside the app. Instead of handing an
agent raw write access, it gets tools with verification attached.

| | What it does |
| --- | --- |
| Context lookup | Starts from the project's actual pages, components, tokens and asset inventory |
| Registration and writes | Records tokens, components and assets in the source and the registry in one step |
| Page verification | Checks that a saved page stays parseable and editable, and refuses to finish while a violation stands |

That blocks three things: working on the wrong project, guessing at intent, and finishing
without checking. When it blocks, you get a code like these — **naming the project or its
path** clears it.

```
WB-AUTH-PROJECT-SESSION-UNBOUND    no project bound yet
WB-AUTH-PROJECT-TARGET-NOT-FOUND   no project by that name
WB-AUTH-PROJECT-TARGET-AMBIGUOUS   more than one candidate — give a path
```

## How far you can edit depends on the shape of the code

Write ordinary React. Local helpers, arrays, `.map(...)`, conditionals and callbacks are all
fine. A designer can reach individual items **as far as the source can be read statically**.
This is a trade-off, not a list of bans.

When the array is written in the file, every item shows up in Layers.

```tsx
const FEATURES = [                      // the values live in the file
  { title: 'Fast round trip', body: '…' },
  { title: 'Tokens first', body: '…' },
];

export function Page() {
  return <ul>{FEATURES.map((f) => <li key={f.title}>{f.title}</li>)}</ul>;
}
```

`.map()` over runtime data makes that region an editing boundary. It renders correctly and
the source is preserved, but the items can't be handled separately in Layers.

| Situation | Choice |
| --- | --- |
| A designer needs to touch items one by one | Keep the values in the file and `.map()`, or write the JSX out |
| A reusable piece should appear in Layers | Move it to its own file and `import` it |
| A region drawn from runtime data | Write it normally and leave it as an editing boundary |

The `workbench-design-authoring` skill installed into each project carries the same rule, so
agents make this call the same way.

## What kind of source this is

Not a production build artifact, but **working, editable design source that a designer can
read and change**. It is real React and TSX; it builds and it runs. Where a
production-optimised structure and the editing model collide, **editability wins and the rest
is left as a handoff boundary.**

- The screen hierarchy stays explicit in the source
- What a designer should touch is exposed as props, arrays and tokens
- Provider stacks, data clients, virtual scrolling, charts and rich editors stay runtime
  islands or handoff regions
- It doesn't pretend every DOM node is editable; read-only boundaries are shown honestly

Framework integration, data wiring, tests, accessibility, performance and release
verification are a developer's job.

## Checks

```sh
npm run check                     # typecheck
npm run build                     # production build
npm run workbench:check-harness   # agent harness checks
```

## Scope

React source editing is supported. Adapters register one per framework, so others can be
added.

</details>

## Docs

| Document | Contents |
| --- | --- |
| [PRODUCT-PHILOSOPHY](docs/WORKBENCH-V1-PRODUCT-PHILOSOPHY.md) | What gets built and what doesn't |
| [AGENT-GUIDE](docs/WORKBENCH-V1-AGENT-GUIDE.md) | Working rules for agents (Claude Code and Codex) |
| [STRUCTURED-AUTHORING-GATEWAY](docs/WORKBENCH-V1-STRUCTURED-AUTHORING-GATEWAY.md) | MCP tool contracts and verification |
| [ARCHITECTURE](docs/WORKBENCH-V1-ARCHITECTURE.md) | State layers and boundaries |
| [SOURCE-OF-TRUTH](docs/WORKBENCH-V1-SOURCE-OF-TRUTH.md) | What counts as the original |
| [COMPONENT-AUTHORING-GUIDE](docs/WORKBENCH-V1-COMPONENT-AUTHORING-GUIDE.md) | Component and story contracts |
| [FIGMA-PRIMITIVE-IMPLEMENTATION-NOTES](docs/WORKBENCH-V1-FIGMA-PRIMITIVE-IMPLEMENTATION-NOTES.md) | Checklist for moving Figma components over |
| [TOKEN-EDITOR-ARCHITECTURE](docs/WORKBENCH-V1-TOKEN-EDITOR-ARCHITECTURE.md) | Token tiers, modes and references |

## License

Workbench is released under the **Workbench Source Available License 1.0**. The source is
public and you may use and modify it, but reselling Workbench itself and using it to offer a
competing product or service are restricted. It is neither the MIT License nor an
OSI-approved open source license. The full terms are in [LICENSE](LICENSE).

| Use | Allowed |
| --- | --- |
| Personal projects, learning, research | Yes |
| Internal company work, internal self-hosting, internal modifications | Yes |
| Paid design or development work done with Workbench | Yes |
| Delivering and selling the websites, apps and designs you make with it | Yes |
| Sharing or forking the source for free under this license | Yes, except to offer a competing product or service |
| Selling Workbench, modified or not, or charging for access or hosting | Not without separate written permission |
| Offering a product or service that competes with Workbench | Not without separate written permission, paid or free |

Using Workbench does not put this license on what you make with it. The project scaffolding,
example UI and templates meant to go into your projects may be distributed and sold as part
of your work under section 4 of the license. That exception does not cover a product that
copies the editor itself, and third-party code and assets keep their own terms.

Bundled and referenced third-party components keep their own licenses —
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md),
[THIRD_PARTY_NODE_MODULE_NOTICES.md](THIRD_PARTY_NODE_MODULE_NOTICES.md),
[THIRD_PARTY_RUNTIME_NOTICES.md](THIRD_PARTY_RUNTIME_NOTICES.md).
