# WORKBENCH-V1 Core Triage

## Purpose

This document classifies the earlier core into three buckets:

1. keep
2. redesign
3. discard

The goal is to help us start `WORKBENCH-V1` without dragging accidental complexity forward.

This is not a judgment on whether that work was useful.
It clearly solved many hard problems.
This is a triage document for building a cleaner V1.

## Summary

### Keep

Keep the parts that define the product's real leverage:

- TSX <-> tree editing model
- isolated renderer iframe
- typed editor/renderer messaging
- Babel-based browser-friendly transform strategy
- token/domain separation
- page/component entity split

### Redesign

Redesign the parts where product behavior exists, but ownership is unclear:

- selection and drill scope model
- nested instance edit/save routing
- preview projection pipeline
- editor session lifecycle
- variant editing model
- panel responsibilities

### Discard

Discard the parts that mostly exist as compatibility layers, local fixes, or debug residue:

- panel-local save routing branches
- raw `breadcrumb` interpretation spread across panels
- direct `console.log` debug flow in product code
- global save/load race guards where architecture should own sequencing
- ambiguous expanded subtree assumptions as quasi-persistence

---

## 1. Keep

## 1.1 TSX <-> Tree as the Product Core

This is the strongest part of the product.

Workbench is not just a canvas tool and not just a code editor.
Its real differentiator is that the visual model and code model are both first-class.

Why keep it:

- matches the product identity
- supports visual editing without abandoning source code
- creates a path for AI-assisted generation and round-trip editing
- gives users a real code artifact instead of opaque serialized design data

V1 implication:

- keep the bidirectional model
- make the tree the editing model
- keep codegen and parsing as official system boundaries

## 1.2 Renderer Isolation via iframe

The dual-app architecture is fundamentally sound.

Why keep it:

- preview crashes are isolated from editor shell
- DOM/CSS/runtime state is separated from the editor's own UI
- postMessage messaging creates a clean transport seam
- renderer-specific assumptions do not have to leak into the main editor app

V1 implication:

- keep editor app and renderer app separate
- keep messaging typed
- keep projection into renderer as an explicit step

## 1.3 Babel-Based Browser-Side Transformation Strategy

Your intuition here is right.
This is one of the most valuable choices in the current system.

What it buys:

- browser-friendly transform path
- low dependency on a heavy local runtime story
- immediate preview/update loop
- easier “web app as editor” deployment model

What to preserve:

- Babel parser/generator for AST round-trip
- browser-executable transform strategy where appropriate
- renderer-side ability to evaluate assembled module code safely inside the preview boundary

Important nuance:

We should keep the strategy, not necessarily every current implementation detail.
V1 can still keep Babel at the center while simplifying projection and renderer assembly.

## 1.4 Typed IPC and Shared Contract Files

The message boundary between editor and renderer is a healthy architectural seam.

Why keep it:

- encourages explicit contracts
- makes preview behavior easier to reason about
- provides a natural place for integration tests
- reduces accidental dependency leakage

V1 implication:

- keep shared message types
- shrink payload construction complexity
- do not let panel code invent renderer payload structure ad hoc

## 1.5 Domain Split: Pages, Components, Tokens

The large-scale domain concepts are good.

Why keep them:

- pages and components are genuinely different editing contexts
- tokens deserve their own model and services
- page-local registry versus library component distinction is real product behavior

V1 implication:

- keep these domain concepts
- re-express them through cleaner stores and services
- avoid re-merging everything into one giant state model

## 1.6 Services as a General Direction

The existing code already shows the right instinct: parsing, codegen, persistence, token resolution, sync logic live outside components.

Why keep it:

- UI should not own core business logic
- services are the right place for transform, projection, and orchestration logic

V1 implication:

- keep service-oriented domain logic
- make service boundaries much stricter

---

## 2. Redesign

## 2.1 Selection / Drill / Scope Model

This is the highest-priority redesign.

Current problem:

- `breadcrumb` is too primitive for the amount of meaning it carries
- Inspector and Preview each reinterpret scope locally
- effective root, owner instance, drill focus, and save target are related but not represented as one model

Symptoms:

- duplicate traversal logic
- scope bugs in nested instances
- panel-local fallback behavior
- hard-to-reason drill in/out semantics
- Design canvas, layer tree, and Inspector disagree about which source-backed
  component is selected

V1 target:

- a first-class `SelectionScope`
- one resolver service
- one meaning for “where the user currently is”

Recommended V1 model output:

- `effectiveRoot`
- `selectedNode`
- `ownerInstanceId`
- `instanceChain`
- `scopeCssKeys`
- `canEditSource`
- `canEditInstance`

## 2.2 Nested Component Instance Editing

This is the second highest-priority redesign.

Current problem:

- prop edits, variant edits, and style edits follow different routing rules
- some nested edits are allowed, some are blocked, some are rerouted into CSS-only instance overrides
- the panel knows too much about persistence mechanics

Why this matters:

- nested instances are not edge behavior in this product
- they are core to reusable UI authoring
- if this model is unstable, the whole editor feels fragile

V1 target:

- define instance persistence model first
- define supported override types explicitly
- centralize routing in `instance-edit.service`

## 2.3 Expanded Subtree vs Persisted Instance State

This is a conceptual redesign, not just a file split.

Current problem:

- expanded subtree is heavily used by preview and selection
- but the true persisted identity is still the compressed instance state
- this makes it easy for the codebase to accidentally treat expanded state as if it were persisted truth

V1 target:

- persisted instance state is canonical
- expanded subtree is always derived
- selection may target derived nodes, but save must route back to the canonical owner instance

This single decision will prevent many downstream bugs.

## 2.4 Preview Projection

Current problem:

- preview payload assembly is mixed into `PreviewPanel`
- CSS projection, bindings projection, props projection, scope projection, and renderer transport are all braided together
- editor-only selection wrappers can accidentally become part of the rendered
  component contract

Why redesign:

- preview is a projection problem, not a panel problem
- payload assembly should be testable without rendering the panel
- visual browser/page preview and source-backed editability are different
  outputs that must both be verified

V1 target:

- `preview-projection.service`
- pure input/output where possible
- `PreviewPanel` only owns iframe lifecycle and user interaction
- selection metadata is projected onto real component roots whenever possible;
  wrapper anchors are fallback behavior, not the default for compound/slot
  component families

## 2.5 Editor Session Lifecycle

Current problem:

- saving, loading, switching entities, parsing, and tree flushing are coordinated across stores and services with defensive guards
- this works, but it is too easy to regress

Symptoms:

- race-prevention globals
- side-effectful tab switching
- save semantics spread across editor store and navigation service

V1 target:

- explicit editor session model
- explicit save transaction
- explicit load transaction
- fewer hidden sequencing assumptions

## 2.6 Variant Editing Model

Current state:

- variant capability is important
- but its editing path is mixed with node CSS logic and instance state logic

What to redesign:

- where variant selection lives
- how active variant preview works
- how conditional CSS is authored
- how instance variant override interacts with default variant source

V1 target:

- clearer variant domain
- cleaner separation between source definition and instance selection

## 2.7 Panel Responsibilities

Current problem:

- panels are orchestration hubs instead of presentation layers

V1 target:

- panels render and dispatch intents
- services decide write routing
- stores hold state
- projectors build payloads

This will likely do more for maintainability than any single algorithm change.

---

## 3. Discard

## 3.1 Direct Debug Logging in Feature Flow

Discard:

- ad hoc `console.log`
- payload dumping inside core hot paths
- temporary debug prints living long-term in stores/panels/services

Reason:

- makes signal noisy
- hides real invariants
- encourages local debugging instead of systemic observability

Replacement:

- `debug.ts`
- categorized logging
- environment-flag gated output

## 3.2 Panel-Local Persistence Decisions

Discard the pattern where the panel decides:

- whether an edit goes to source tree
- whether it goes to instance override CSS
- whether it is blocked
- how save shape is serialized

Reason:

- UI should not encode domain persistence semantics

Replacement:

- intent handlers
- edit services

## 3.3 Global Guard Flags as a Primary Safety Mechanism

Discard as architecture:

- global booleans guarding save/load races as the main sequencing model

Reason:

- they are acceptable as temporary stabilizers
- they are not a healthy core design

Replacement:

- explicit transactions or action sequencing in the editor session layer

## 3.4 Raw `breadcrumb` as the Main Scope Primitive

Discard the idea that a raw id array is enough to represent current editing location.

Reason:

- too much meaning is packed into too little structure
- each caller ends up reconstructing the missing semantics

Replacement:

- resolved scope model

## 3.5 Expanded State as Implicit Persistence

Discard any architectural assumption that expanded children hanging off instance nodes can be treated as durable truth.

Reason:

- it blurs derivation and persistence
- makes save routing ambiguous
- makes nested editing much harder to reason about

Replacement:

- compressed canonical instance state
- derived expansion service

## 3.6 Compatibility Layers That Exist Only to Support Historical Drift

As we port to V1, discard any layer whose only job is:

- preserving outdated state shapes
- supporting conflicting editing paths simultaneously
- patching around old panel behavior

Reason:

- V1 is the chance to reset invariants

---

## Practical V1 Decision Table

| Area | Decision | Notes |
|---|---|---|
| TSX parse/codegen | Keep | Core product differentiator |
| iframe renderer | Keep | Good runtime isolation |
| Babel browser-side strategy | Keep | Important to web-first editing loop |
| shared IPC types | Keep | Healthy boundary |
| tokens/pages/components domains | Keep | Good macro model |
| selection scope model | Redesign | Highest-priority architectural fix |
| nested instance editing | Redesign | Core product interaction path |
| expanded subtree semantics | Redesign | Must become explicitly derived |
| preview projection | Redesign | Move out of panel |
| editor save/load lifecycle | Redesign | Remove implicit sequencing |
| variant editing path | Redesign | Clarify source vs instance behavior |
| panel-local write routing | Discard | Move to services |
| raw debug logs | Discard | Replace with debug utility |
| global race flags as core architecture | Discard | Use only as temporary stabilizers if needed |

---

## Bottom-Line Assessment

The foundation is not bad.
The product idea and several major technical choices are strong.

What is weak is not the existence of parsing, codegen, iframe preview, or Babel.
What is weak is the editor core orchestration layer:

- who owns scope
- who owns nested edit routing
- who owns preview projection
- who owns save semantics

That means V1 should not be a total reinvention.
It should be a structural reset around a good engine.

## Recommended Next Documents

To make V1 concrete, the next three specs should be written in order:

1. `WORKBENCH-V1-EDITOR-SESSION.md`
2. `WORKBENCH-V1-SELECTION-SCOPE.md`
3. `WORKBENCH-V1-INSTANCE-MODEL.md`

Those three documents will define the real V1 core.
