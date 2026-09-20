# WORKBENCH-V1 History and Autosave

## Core Rule

Undo, redo, and autosave must operate on canonical Workbench state, not preview DOM, generated code, renderer payloads, or ad hoc UI snapshots.

The editor should treat every meaningful mutation as an edit operation. UI events may start the operation, but history and persistence record the semantic result.

## State Layers

Workbench needs three separate layers:

- Working state: the current canonical editable document state.
- History state: undo and redo stacks of committed edit transactions.
- Persistence state: the last successfully saved canonical checkpoint.

These layers must not be collapsed into one boolean dirty flag. Dirty state is derived from `workingRevision !== savedRevision`, or from comparing the current canonical value with the last saved canonical value when a lane provides a stable equality check. The second path lets undo return to a clean saved state without relying on global timeline order.

## Domain History Lanes

Undo and redo are scoped to the active editing owner, not to one global chronological stack.

Required owner lanes:

- `tokens:<token file path>` for token registry editing.
- `page:<page file path>` for page design editing.
- `component:<component file path>` for component source editing.
- `css-class:<registry or css file path>` for shared CSS class management.
- `workspace:<project id>` for project-level metadata.

The active surface decides the undo lane:

- Token panel undo only changes the active token lane.
- Page canvas undo only changes the active page file lane.
- CSS class manager undo only changes the CSS class lane.
- Component editor undo only changes the active component file lane.

A global timeline may exist for visibility, but it must not be the default undo target. Users should never undo a page edit and accidentally roll back an older shared CSS class edit from a different surface.

Each transaction stores both:

- `owner`: the lane that owns undo/redo semantics.
- `affectedFiles`: files touched by the operation for persistence, audit, and future composite operations.

If a page edit needs page-local styling changes, record them in the page lane as page-owned style operations. Shared CSS class definition edits belong in the CSS class lane only when the user is explicitly editing shared CSS classes.

## Edit Transaction

Every history entry should describe one user-meaningful change.

Required fields:

```ts
type WorkbenchEditTransaction<TState> = {
  id: string;
  laneId: HistoryLaneId;
  owner: EditOwner;
  label: string;
  scope: 'tokens' | 'page' | 'component' | 'css-class' | 'selection' | 'mixed';
  kind: 'create' | 'patch' | 'structural' | 'delete' | 'restore' | 'reorder' | 'import';
  before: TState;
  after: TState;
  affectedFiles: string[];
  selectionBefore?: WorkbenchSelectionSnapshot;
  selectionAfter?: WorkbenchSelectionSnapshot;
  createdAt: string;
  mergeKey?: string;
};
```

The `before` and `after` values are canonical domain slices. They are not rendered output. For the current token editor, the slice is `TokenRegistry`.

## Merge Rules

Not every keystroke should become a separate undo entry.

Default rules:

- Create, delete, duplicate, import, reorder: always create a new transaction.
- Rename text input: merge while the same field remains focused and the `mergeKey` matches.
- Token value edits: merge continuous edits to the same token/mode cell.
- Collection, group, mode changes: create explicit transactions unless the user is typing inside a rename field.
- Selection-only changes: do not enter document history unless they are part of a restore transaction.

## Undo And Redo

Undo applies the `before` state of the current transaction and moves that transaction to redo.

Redo applies the `after` state and moves it back to undo.

After either operation:

1. Replace the canonical working state.
2. Restore selection/scope when available.
3. Regenerate derived projections from the new working state.
4. Recompute dirty state against the last saved revision.

Do not patch renderer state directly during undo/redo.

For source-backed Design Editor edits, undo and redo must target the active
page/component source history lane. They must not depend on whether a layer is
currently selected, because users expect undo to work after deselecting,
switching focus into an Inspector input, or returning from a transient UI
surface.

Inspector inputs may keep local draft state, but input-focused history shortcuts
are still Workbench document operations. `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`,
`Ctrl+Y`, and native `beforeinput` history events should route to the source
history lane when that lane can undo or redo. If the source lane has no matching
history action, the event can fall through to the browser's normal input
behavior.

After source undo or redo:

1. Restore the lane's canonical TSX contents.
2. Persist the restored source contents through the source persistence boundary.
3. Reparse the TSX into a fresh editable tree.
4. Restore the transaction's meaningful selection snapshot when possible.
5. Regenerate preview and Inspector projections from the fresh tree.

## Autosave

Autosave persists canonical working state after edits settle. It does not create history entries.

Recommended behavior:

- Schedule autosave after any document-affecting transaction.
- Debounce normal edits by 800-1200ms.
- Flush immediately before page unload or project switch when possible.
- Keep only one in-flight save per persistence target.
- If a new edit happens during a save, mark another save as pending and run it after the current save resolves.
- On save success, set `savedRevision = workingRevision`.
- On save failure, keep the working state and expose a recoverable save error.

## Revision Model

Each canonical store should track monotonically increasing revisions.

```ts
type WorkbenchRevisionState<TState> = {
  value: TState;
  workingRevision: number;
  savedRevision: number;
  historyCursor: number;
  updatedAt: string;
};
```

Revision numbers are local editor semantics. They do not replace stable entity IDs.

## Current Token Editor Application

The current token editor already has a single `commit(nextRegistry)` path. That should become the first integration point.

Next implementation step:

```ts
commit(nextRegistry, {
  label: 'Rename token',
  scope: 'tokens',
  kind: 'patch',
  mergeKey: `token:${tokenId}:name`,
});
```

The token editor should then gain:

- `undoStack`
- `redoStack`
- `workingRevision`
- `savedRevision`
- debounced autosave around `saveWorkbenchTokens`
- toolbar commands for undo and redo

Manual save can remain, but it should call the same persistence pipeline as autosave.

## Current Design Editor Application

The Design Editor source-backed path currently uses page/component source history
lanes for Inspector edits.

Implemented behavior:

- source text, attribute, token binding, style, structural insert, and structural
  move edits commit into the source history lane before persistence
- source writeback reparses canonical TSX after a successful edit
- undo / redo restores the source lane value rather than a preview snapshot
- undo / redo persists the restored source file value
- undo / redo restores `selectionBefore` or `selectionAfter` when the restored
  node still exists
- Inspector source inputs route input-focused history shortcuts into the same
  source history handlers used by canvas shortcuts

Regression coverage lives in:

```txt
scripts/check-design-editor-foundation.mjs
```

When adding a new source-backed Inspector control, include an undo / redo case if
the control introduces a new writeback path, a new selection target, or a new
draft lifecycle.

## Local History Persistence

Session history can be mirrored into the local Workbench project folder so reloads do not erase undo/redo context.

The persistence file is:

```txt
.workbench/history.json
```

It is not browser storage. It is a local project file written by the Workbench dev middleware.
The file is addressed through the same project location boundary as the rest of the manifest paths, so moving to a user-selected project folder does not require a history-specific storage path.

The file stores lane snapshots, not a token-only shape:

```ts
type WorkbenchHistoryFile = {
  schemaVersion: '0.1';
  updatedAt: string;
  lanes: PersistedHistoryLane[];
  timeline: HistoryTimelineEntry[];
  extensions: Record<string, unknown>;
};
```

Each lane includes:

- `laneId`
- `owner`
- current canonical `value`
- revision metadata
- `extensions`
- `undoStack` and `redoStack`, **only for lanes that persist them**

Stack persistence is a per-lane decision (`HistoryLaneStackPersistence`). Undo is
session state and is discarded on restart, like Figma / Sketch / VS Code, so a
lane writes its stacks only while it still uses the file as the transport that
carries them across a controller rebuild. Source lanes (`page:`, `component:`)
do not: each owns one controller for the session. The token lane still does.

A lane's `value` and revision metadata are persisted either way — they are
unsaved-work recovery, not undo, and a reader must never reject a lane for
lacking stacks.

This keeps the shape open for future lanes:

- `tokens:<token file path>`
- `page:<page file path>`
- `component:<component file path>`
- `css-class:<registry or css file path>`
- `workspace:<project id>`

On load, Workbench should only hydrate a lane when the persisted lane value matches the current canonical file value. If the project file changed outside Workbench, stale history must be ignored rather than applied to the wrong state.

The current implementation stores full before/after canonical snapshots for each transaction. Later versions can replace the lane payload with compact operations or patches without changing the top-level lane model.

## Project-Wide Integration Order

1. Create a generic domain history controller.
2. Move token editor `commit` through that controller.
3. Add autosave scheduling for `.workbench/tokens.json`.
4. Extend the same controller to pages, components, comments, and workspace state.
5. Add session restore metadata for selection and active scope.
6. Regenerate preview/code projections only after canonical state changes.

## Non-Goals

Do not implement undo/redo by:

- diffing rendered DOM
- diffing generated code text as the primary model
- storing preview payloads as history truth
- treating autosave snapshots as undo history
- comparing derived trees to guess intent

History must restore editing meaning. Autosave must persist canonical state. Derived outputs must remain disposable.
