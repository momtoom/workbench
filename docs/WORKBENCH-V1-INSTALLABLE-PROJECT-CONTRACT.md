# WORKBENCH-V1 Installable Project Contract

Workbench V1 is installed into a local project folder. The project files remain the primary source of truth. Optional SaaS/Supabase sync can mirror these files later, but it is not the editing core.

This contract is intentionally versioned and flexible. It will change as V1 grows.

## Install Shape

```text
.workbench/
  workbench.config.json
  tokens.json
  notes.json
  pages.json
  components.json
  selection.json
  workspace-state.json
  history.json
src/
  workbench-tokens.css
AGENTS.md
CLAUDE.md
docs/workbench-agent/
  WORKBENCH-PROJECT-GUIDE.md
  WORKBENCH-COMPONENT-AUTHORING.md
.agents/skills/
  workbench-design-authoring/
  workbench-project-authoring/
  workbench-project-component-authoring/
  workbench-project-preview-runtime/
.claude/skills/
  workbench-design-authoring/
```

Initialize in a project folder:

```bash
npm run workbench:init
```

or target another folder:

```bash
npm run workbench:init -- /path/to/project
```

## Design Principle

Workbench owns the design editing surface. Codex Desktop owns code implementation and verification outside the app.

The bridge between them is local project state:

- selection target
- note target
- token registry
- page registry
- component registry
- project manifest

## Manifest

`.workbench/workbench.config.json` describes how Codex and Workbench find project files.

The manifest includes:

- `schemaVersion`: contract version
- `projectId`, `projectName`
- `workbench.devCommand`
- legacy optional `workbench.previewUrl`; new projects should omit it because
  Workbench resolves preview hosts through the active bridge/local preview
  runtime
- registry paths
- optional `paths.history`
- optional compatibility paths for older projects
- capabilities
- `extensions`

Default local development metadata is generated from `scripts/workbench-template.mjs`. Keep CLI initialization, in-app project creation, and checked-in `.workbench/workbench.config.json` aligned with that template.

The same template also installs thin `AGENTS.md` / `CLAUDE.md` entry points and
public project authoring guides under `docs/workbench-agent/`. The entry points
route tasks through project skills instead of preloading both guides. These guides are
project-facing instructions for external coding agents. They should not expose
Workbench application internals, but they must give agents enough local context
to create pages, components, tokens, assets, and notes that remain editable in
Workbench.

The template also installs shared Codex project skills under `.agents/skills`.
The `workbench-design-authoring` skill is implicitly eligible for open-ended
product, service, and visual-design requests and coordinates the host's design
capabilities with the authoring MCP. Host design plugins, multiple visual
options, detailed requirements, and approval checkpoints are optional. The
hard contract is that the result is implemented in real project source and
remains editable through Workbench. MCP discovery is global, but project authorization is session-bound:
the first context inspection must name and verify the intended project, and a
stale last-opened project cannot authorize subsequent calls. Claude Code
receives thin auto-discovery wrappers under `.claude/skills/` for every
generated project skill. A visual-design capability may be used when helpful,
but every wrapper points to the matching `.agents/skills/` definition instead
of maintaining a second workflow copy.

Initialization writes only missing guide and skill files. Existing projects can
run `npm run workbench:init` again to receive newly added skill files without
overwriting their existing project guides; opening a project alone does not
perform that reconciliation.

To migrate existing entry points and project skills to the current template,
use the explicit project-guidance synchronizer:

```sh
npm run workbench:sync-project-guidance -- --project /absolute/project/path
npm run workbench:sync-project-guidance -- --project /absolute/project/path --write
```

The default is a dry run. The synchronizer updates only current or recognized
generated guidance, creates missing skills and Claude wrappers, and treats
unrecognized existing content as a conflict. `--force` is an explicit
replacement path; every overwritten file is backed up under
`.workbench/guidance-backups/`. There is no ambient-project or implicit
all-project mode.

`extensions` is reserved for future changes and project-specific metadata. Do not use rigid assumptions when reading these files.

## Project Location Boundary

Workbench treats file paths in the manifest as project-relative paths. In local development, Vite exposes the active project location through:

```txt
/__workbench/project.json
```

and reads or writes project files through:

```txt
/__workbench/files/<project-relative-path>
```

This keeps the app from assuming that the Workbench app folder and the edited project folder are always the same place. Today the dev server points this boundary at its current root. Later, the folder picker or native bridge can switch the active root without changing token, history, page, component, or comment loading code.

The local dev server also accepts project root actions at the same location endpoint:

```txt
POST /__workbench/project.json
```

with either:

```json
{ "action": "open", "rootPath": "/path/to/project" }
```

or:

```json
{ "action": "create", "parentPath": "/path/to/parent", "projectName": "New project", "templateId": "tailwind" }
```

`open` switches to an existing folder that already has `.workbench/workbench.config.json`.
`create` creates a new project folder inside the selected parent folder,
initializes `.workbench` files inside it, runs `npm install`, and then switches
the active project root. Install status is written to
`.workbench/dependency-install.json`. If npm is unavailable, offline, or blocked
by permissions, project creation still succeeds and Workbench returns the
install failure message so the user can retry `npm install` in the project
folder.
The current UI opens Finder for both flows: `Open project` selects an existing project folder, and `Initialize project` takes a project name plus a setup option first, then selects the parent folder in Finder.

`templateId` is optional for backward compatibility. Supported values are:

- `standard`: general React source with Workbench tokens.
- `tailwind`: Tailwind CSS setup with Workbench preview CSS metadata.
- `shadcn-base`: Tailwind plus shadcn-style dependencies and theme variables. This option is described in the UI as Vite + Base UI because Workbench expects shadcn-style components to be wrapped as project-owned Base UI component contracts rather than edited through third-party generated DOM internals.

## Registries

### `tokens.json`

Token collections. This is the canonical token registry for a local project and
uses the V1 token domain model:

- collections
- modes
- groups
- raw/ref/formula/gradient values
- usage index

### `src/workbench-tokens.css`

Generated CSS custom properties derived from `tokens.json`.

`tokens.json` is the canonical token source. `workbench-tokens.css` is project-owned generated source so project pages and component libraries can consume token variables without reaching back to the Workbench app root.

When reusable component or page values are added, update `tokens.json` first and
then keep `src/workbench-tokens.css` generated from that registry. Starter and
bundled component sets should follow:

```text
component token -> semantic role token -> primitive raw token
```

### Preview CSS Paths

Workbench Design preview loads project-owned CSS only. The current supported
paths are configured Tailwind `compiledCss`, `paths.tokenCss`, `index.html`
stylesheet links, project-local `.css` imports discovered from app/page/component
source, CSS `@import` chains, and inferred project-local library CSS at:

```text
<snapshotRoot>/components/<libraryId>.css
```

Keep these paths project-relative. Do not persist local machine absolute paths,
Vite `@fs` paths, `file://` URLs, localhost stylesheet URLs, package-internal
or `node_modules` paths in project metadata or
source intended for Workbench design preview. If external package CSS is needed,
wrap or copy the required rules into a project-owned stylesheet and import that
local file.

### `pages.json`

Page registry. Each page maps to a source file and root node id.

The preferred registration path is source-first: create a parseable page file
under `src/workbench-pages/`, then let Workbench reconcile `.workbench/pages.json`
on project load. Manual registry edits should be reserved for rename, migration,
recovery, or route/status updates and must keep `sourceFile` project-relative.

### `components.json`

Component and component-set registry. Each component maps to source files,
variants, states, props, slots, and library ownership metadata.

The preferred component registration path is source-first through a
project-local component library. Put reusable components under a discoverable
library folder such as `src/libraries/<library-id>/components/`, add CSF stories
and a barrel `index.ts`, then let Workbench hydrate `.workbench/components.json`
on project load. Hand-edited component entries must keep `sourceFile`,
`importName`, `sourceExportName`, `storySourceFile`, `libraryId`, and
`librarySnapshotRoot` aligned with real project files.

### `notes.json`

Compatibility project-level spec note registry.

The preferred V1 authoring path is a source-adjacent sidecar per page/component, named from the source file:

```text
src/pages/Home.tsx
src/pages/Home.workbench-notes.json
```

This lets a team share or review one page with its Workbench notes without exporting the whole project registry.

Codex should use notes as structured work requests when the user points at a preview element and asks for a change.

Older projects may still expose `paths.comments` and `.workbench/comments.json`; V1 keeps that as a compatibility fallback and migration source. New edits should write to the active page/component sidecar when a source file is available.

### `selection.json`

Current preview/workbench selection.

This is the first bridge between user visual selection and Codex file editing.

## Next Build Steps

1. Make Workbench load `.workbench/workbench.config.json`.
2. Show project status from local registries.
3. Replace the path-based project field with a native folder picker when the desktop bridge is available.
4. Write preview selection into `selection.json`.
5. Write preview notes into `notes.json`.
6. Add token import flow from project CSS/Tailwind files.
7. Add page creation flow that creates source files and page registry entries.
8. Add component extraction flow that creates component files and registry entries.
