# WORKBENCH-V1 System Design

## Why This Document Exists

Before we write narrow V1 specs, we need one document that treats Workbench as a whole editing system.

The main risk right now is not missing a feature.
The main risk is designing V1 in fragments:

- one document for selection
- one for preview
- one for instances
- one for save

If those are written independently, we will recreate the same class of architectural drift that happened earlier.

This document is the top-level map.
It defines the system as one coherent editor, not a collection of isolated mechanisms.

---

## What Workbench Actually Is

Workbench is not just:

- a canvas editor
- a code editor
- a renderer
- a TSX generator

Workbench is a **live structural editor** with a code artifact.

That means the real problem is not “how do we render JSX?”
The real problem is:

**How do we let a user continuously mutate a code-backed UI system without losing identity, correctness, responsiveness, or trust?**

That is the V1 design target.

---

## The Real Difficulty

Creating something new is comparatively easy.
Mutation is the hard part.

Workbench must support:

- create
- partial edit
- structural edit
- delete
- restore
- undo
- redo
- duplicate
- import
- re-import
- detach
- variant switch
- nested instance override
- selection restore
- scope restore

This means Workbench is fundamentally an editor for **ongoing change**, not one-time generation.

So the V1 core cannot be organized around “screen features”.
It has to be organized around:

1. identity
2. edit operations
3. source of truth
4. projection
5. history
6. responsiveness

---

## V1 Non-Negotiable Invariants

These are the architectural invariants V1 should enforce from day 1.

## 1. No Stale State

The system must never prefer an old derived value over the current source of truth.

This is especially important for:

- current tree
- current code
- current selection scope
- current preview payload
- current instance state

### Rule

Caches may exist only for derived values that can be safely recomputed.
Caches must never become an alternative truth source.

## 2. No Full Repaint By Default

Full rebuild is allowed for structural edits.
It must not be the default reaction to every edit.

### Rule

Selection, hover, focus overlays, runtime preview values, and CSS-only changes should not trigger whole-preview reset unless structurally necessary.

## 3. Intent Determines Update Scope

Do not rely on deep diff as the primary way to decide update scope.

### Rule

The editor should know update scope from the edit intent:

- select node
- hover node
- edit CSS
- edit prop
- edit instance override
- replace structure

Structural edits may rebuild more.
Non-structural edits should update incrementally.

## 4. Persist Canonical State, Derive Everything Else

Persist only stable edit state.
Do not persist convenience projections as second-class truths.

## 5. Identity Must Survive Mutation Semantics

Everything important in the system depends on stable identity rules:

- selection
- CSS anchors
- overrides
- bindings
- history restore
- duplicate semantics
- re-import semantics

If identity is underspecified, the rest of the editor will drift.

## 6. History Must Restore Meaning, Not Just Bytes

Undo/redo must restore the user’s editing reality, not just a raw tree snapshot.

That may include:

- active entity
- tree
- selection
- scope
- variant context

It should usually exclude:

- ephemeral hover
- debug toggles
- transient renderer-only artifacts

---

## The Six Core Design Axes

V1 should be designed across these six axes together.

## Axis A: Identity

This is the deepest layer.

Workbench uses multiple identities for different purposes:

- runtime node identity
- CSS anchor identity
- alias/reference identity
- instance identity
- component origin identity
- entity identity

V1 must define:

- what each identity is for
- what survives parse/codegen round-trip
- what survives duplicate
- what survives delete/restore
- what gets regenerated
- what is never used as persistence anchor

### Key principle

Identity semantics must be explicit before edit semantics are finalized.

## Axis B: Edit Operations

The system should not think in terms of UI handlers first.
It should think in terms of canonical edit operations.

Examples:

- create node
- patch node props
- patch node styles
- insert child
- remove node
- move node
- clone subtree
- import component instance
- change instance prop
- change instance variant
- apply instance-local style override
- detach instance
- rename alias

Each operation should define:

- target type
- allowed scope
- canonical write destination
- identity effects
- history transaction behavior
- preview invalidation scope

The detailed lifecycle contract is `docs/WORKBENCH-V1-EDIT-OPERATIONS.md`.
That contract treats copy, paste, cut, duplicate, move, save flush, navigation flush, import, delete-after-import, re-import, undo, redo, and recreating the same content as first-class authoring cases.

## Axis C: Source of Truth

For each major concept, V1 must define one canonical truth.

### Structure

- canonical: working tree / persisted entity tree

### Component instance state

- canonical: compressed instance state

### Expanded subtree

- canonical: never
- status: derived only

### Preview runtime values

- canonical: preview session state

### Selection scope

- canonical: resolved scope model from session + tree + component registry

### Renderer payload

- canonical: never
- status: projection only

## Axis D: Projection

Projection is where canonical editor state turns into operational state for another subsystem.

Examples:

- tree -> code
- tree -> renderer payload
- instance state -> expanded subtree
- selection scope -> preview focus chain
- tokens -> CSS vars

Projection must be:

- explicit
- testable
- disposable
- recomputable

Projection must not quietly become persistence.

## Axis E: History

History is not an afterthought.
It defines how safe mutation feels.

V1 must decide:

- what is one history transaction
- what merges into one transaction
- which session state is restored
- whether structural and non-structural edits have different transaction grouping
- how restore interacts with derived state regeneration

### Guideline

History should replay canonical editor state, then regenerate derived projections.

## Axis F: Responsiveness

Responsiveness is not just performance.
It is user trust.

The user must feel:

- edits are immediate
- preview is stable
- focus is preserved
- selection is predictable
- the screen does not flash unnecessarily

V1 responsiveness should come from:

- smaller update channels
- strict source/projection separation
- not over-invalidating renderer state

Not from:

- stale caches
- ambiguous memoization
- hidden local snapshots

---

## The Four Runtime Layers

We should think of V1 as four runtime layers.

## Layer 1: Canonical Domain State

Persistent or authoritative editor data:

- pages
- components
- tokens
- canonical entity tree
- canonical instance state

## Layer 2: Editor Session State

Current editing context:

- active entity
- working tree
- dirty state
- selection id
- drill path / scope seed
- active editing mode
- history cursor

## Layer 3: Derived Editor Models

Computed editor-side models:

- resolved selection scope
- expanded visible tree
- property panels
- variant-resolved view
- save plan

## Layer 4: Renderer Projection

Transport-ready runtime payloads:

- assembled code
- CSS maps
- binding payloads
- preview props
- overlay focus chain

The discipline is:

- higher layers may be regenerated from lower layers
- lower layers must not depend on higher layers for truth

---

## The Main Failure Modes We Must Avoid

These are the failure classes V1 should explicitly defend against.

## 1. Silent Stale State

The worst class.
The UI still works, but with older derived data.

Causes:

- unsafe caching
- incomplete invalidation
- local stale snapshots
- dual truth sources

## 2. Identity Drift

The system no longer knows whether something is “the same thing”.

Effects:

- selection mismatch
- CSS override mismatch
- binding target mismatch
- duplicate semantics corruption

## 3. Projection Drift

Renderer payload or generated code no longer matches current canonical editor state.

Effects:

- preview mismatch
- flicker due to unnecessary full rebuild
- inconsistent code/preview behavior

## 4. Panel Logic Capture

Business rules end up trapped inside panels.

Effects:

- impossible-to-test behavior
- inconsistent routing
- duplicated fallback logic

## 5. History Mismatch

Undo/redo restores bytes but not actual editing meaning.

Effects:

- wrong selection after restore
- wrong scope after restore
- wrong preview after restore

---

## What We Are Keeping From The Earlier Implementation

We should preserve the strongest ideas from the earlier implementation:

- TSX <-> tree round-trip model
- editor/renderer split
- Babel-centered transform pipeline
- typed messaging boundary
- service-oriented domain logic
- pages/components/tokens as separate concepts

These are not the problem.
These are part of the value.

---

## What We Are Rebuilding in V1

These are the actual V1 core rewrite targets:

- identity rules
- edit operation model
- selection/scope system
- instance persistence and expansion model
- preview projection model
- editor session lifecycle
- history model
- debug/observability model

This is the real “new foundation”.

---

## The V1 Shape We Actually Want

Workbench V1 should feel like this internally:

### 1. One canonical working state

Not:

- one store state
- one panel draft
- one preview cache
- one renderer shadow copy

### 2. Thin panels

Panels describe intent.
They do not decide write paths.

### 3. Derived models are cheap to throw away

If a projection gets suspicious, we should be able to regenerate it safely.

### 4. Structural edits are explicit

They are allowed to invalidate more.

### 5. Non-structural edits are incremental

They should not tear down the world.

### 6. History restores the editing situation

Not just raw tree bytes.

---

## Recommended V1 Documentation Order

Only after this document should we write more specific specs.

Recommended order:

1. `WORKBENCH-V1-IDENTITY-RULES.md`
2. `WORKBENCH-V1-EDIT-OPERATIONS.md`
3. `WORKBENCH-V1-EDITOR-SESSION.md`
4. `WORKBENCH-V1-SELECTION-SCOPE.md`
5. `WORKBENCH-V1-INSTANCE-MODEL.md`
6. `WORKBENCH-V1-PREVIEW-PROJECTION.md`
7. `WORKBENCH-V1-HISTORY-MODEL.md`

Why this order:

- identity comes before mutation
- mutation comes before session orchestration
- session comes before scope
- scope comes before instance routing
- instance model comes before preview projection
- history comes after canonical state boundaries are settled

---

## Bottom Line

The V1 rewrite should not start from:

- screen layout
- component hierarchy
- panel file structure

It should start from:

- identity
- mutation
- truth
- projection
- history
- responsiveness

If we get those six right, the rest of the product can grow without becoming unstable again.
