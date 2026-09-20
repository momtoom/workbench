# WORKBENCH-V1 Product Philosophy

## Why This Comes First

Before defining stores, services, IDs, or edit operations, we need to define what Workbench is trying to be.

Without this, technical decisions drift toward whatever is easiest to implement locally:

- node-centric styling
- panel-local write routing
- temporary identity fixes
- prototype-first shortcuts

That is exactly how an editor gradually becomes harder to trust.

This document exists to prevent that.

---

## What Workbench Is

Workbench is a visual editor for building real frontend UI artifacts.

It is not just:

- a design playground
- a code generator
- a React preview toy
- a one-shot AI prototyping tool

Workbench is an interface layer for AI-assisted design collaboration on real code.

Workbench is a tool that should let a human **design, structure, inspect, refine, and QA UI the way real teams actually work**.

That means it must respect two workflows at the same time:

1. the designer workflow
2. the frontend developer workflow

V1 must be built around both, not just one.

Workbench must also support a third operating loop around Codex Desktop:

1. a user asks Codex to create a page, component, or UI state
2. Codex authors real TSX/source files in the project
3. Workbench parses that source into an editable tree
4. the user inspects, selects, and edits the result visually
5. Workbench syncs edits back through source-backed operations and renderer verification

This is not the same as making Workbench a one-shot generator or an in-app AI chat product. Codex-assisted source authoring is an input path into real editable artifacts; Workbench still owns the visual editing model, structural honesty, token binding, source-backed inspector behavior, and verification loop.

The most realistic product container for this loop is not a hosted design SaaS. It is a local-first VS Code extension or adjacent developer-tool surface that runs inside the user's real workspace:

- the source code stays in the local repo
- Codex, Claude Code, Copilot, or another code agent owns code modification
- Workbench owns design context capture, preview inspection, and source-backed handoff contracts
- React / Next TSX is the canonical first target
- other frameworks are downstream developer responsibility after handoff, not first-class verified export targets

This keeps the product boundary honest. Workbench should not pretend it can safely host every customer's private codebase in the cloud or verify every framework target. It should make designers more effective inside the code-agent workflow that already exists.

---

## The Central Product Belief

**Workbench should feel like direct manipulation for designers, while being structurally honest to frontend implementation reality.**

This is the core philosophy.

If we keep only the designer feeling, the system becomes structurally unstable.
If we keep only the developer structure, the product loses its editing magic.

V1 must do both.

---

## The Authoring Source Philosophy

The source that Codex or another agent writes for Workbench is not merely final
production app code that happens to preview in a browser. It is the editable
design source Workbench uses to let designers understand, select, inspect, and
change the screen.

That source still needs to be real React / TSX. But when there is tension
between a production-optimized architecture and an inspectable design editing
model, Workbench should favor the editable source shape and leave a clear
developer handoff boundary for deeper runtime concerns.

This means:

- visible page hierarchy should stay explicit in source, with named sections,
  readable component boundaries, stable identities, classes, and token-backed
  styling
- data and appearance a designer should edit should be exposed as props,
  Binding-friendly arrays, table/CSV values, tokens, or wrapper controls
- provider-heavy architecture, data clients, auth/session context, render
  callbacks, opaque config objects, virtualization, measurement, drag sensors,
  maps, charts, and rich editors are valid app patterns, but they should be
  local runtime islands or developer handoff areas when their internals cannot
  be safely edited
- Workbench must be honest about read-only boundaries instead of pretending
  every runtime DOM node can be edited

The practical rule for AI-authored screens is simple: make the screen readable
and editable by a designer first. Let developers receive or refine the advanced
state, data, and runtime architecture after that source-backed design contract
is clear.

---

## What We Already Know Is Valuable

Through building the earlier implementation, we learned that several parts of the product are genuinely strong and worth protecting.

## 1. Direct Manipulation Matters

Editing in the preview with immediate feedback is not a bonus feature.
It is part of the product identity.

Users should be able to:

- click what they see
- manipulate the visible result
- feel immediate causality between action and output

This is one of the strongest parts of Workbench and should not be sacrificed.

## 2. Token Thinking Is Native to the Product

The design-system mindset is not optional.
Workbench should naturally support:

- reusable tokens
- visual consistency
- scalable style systems
- structured variation

This is a major strength coming from the designer viewpoint and should remain foundational.

## 3. The Product Must Produce Real Code

Workbench should not trap users inside an opaque editor-only format.

The output must stay close to how real frontend code is authored, understood, and maintained.

That means:

- understandable code structure
- real component boundaries
- real styling structure
- inspectable and editable source

## 4. Verification Uses the Existing Source-Backed Loop

The workflow does not end when Workbench produces a component or page handoff. Verification still happens against the real application in its normal browser and development environment.

Workbench does not own a separate local-URL QA surface or cross-origin DOM capture workflow. Those capabilities depend on browser and application boundaries that Workbench cannot guarantee. Findings can instead be recorded as ordinary notes and handled through the same source-backed Design Editor and external browser verification loop.

The useful context remains:

- what screen and viewport was reviewed
- which element was selected
- what the designer expected instead
- what token, component, or variant contract should guide the fix

This keeps verification honest without adding an unreliable product mode.

---

## What We Misunderstood Earlier

This is not blame.
This is the most valuable design knowledge gained from experience.

## 1. Figma-Like Component Intuition Is Not Enough

A major source of complexity came from treating components primarily through a Figma-style mental model:

- reusable thing
- nested thing
- overridable thing
- variant thing
- drillable thing

That intuition is useful for UX.
But it is not enough to model the actual implementation reality of frontend components.

In frontend systems, a component also has:

- a source definition
- a usage site
- an instance contract
- a styling strategy
- ownership boundaries
- override rules

V1 must preserve the Figma-like ease of use, but the internal model must be based on real frontend component semantics.

## 2. Styling Was Solved as a Targeting Problem First

In the earlier implementation, styling pressure often came from needing reliable node targeting:

- node UUIDs changed
- CSS injection could not reliably follow them
- a more stable anchor had to be introduced

That was a real problem.
But solving styling primarily as a targeting problem pushed the system toward per-node CSS anchoring.

That improved local correctness, but it moved the model away from how frontend developers actually organize styles:

- shared classes
- reusable component styles
- variant styles
- semantic naming
- exception-only local overrides

V1 must treat styling as a **human workflow system**, not just a technical targeting system.

## 3. Prototype Logic Quietly Became Product Logic

Many local fixes in the earlier implementation were understandable and practical at the time.
But a recurring pattern emerged:

- solve the immediate edge case
- add a small identity patch
- add a local routing condition
- add a guard to avoid race or stale state

Over time, those local decisions became the architecture.

V1 must not repeat that.

---

## What Workbench Must Reproduce

The phrase “human workflow” needs to be concrete.

Workbench should reproduce the workflows humans already know from real practice.

## A. The Designer Workflow

Workbench should preserve the good parts of the designer workflow:

- direct preview manipulation
- visual inspection
- token-driven thinking
- component reuse as a practical tool
- fast iteration
- low friction exploration

The user should not feel forced to think like a compiler just to change a button.

## B. The Frontend Developer Workflow

Workbench must also reproduce real frontend implementation habits:

- components have source definitions and usage sites
- styles are organized into reusable structures
- classes exist for human organization, not just machine targeting
- overrides are deliberate exceptions
- variant systems are explicit
- structure and styling have different responsibilities

The user should not be pushed into an editor-specific model that no real codebase would want.

---

## The Product Tension We Must Respect

The hardest part of Workbench is not choosing one side.
It is holding both sides together.

### If We Lean Too Far Toward Design-Tool Thinking

We get:

- friendly editing
- powerful preview manipulation
- intuitive component drilling

But we risk:

- weak source/instance boundaries
- per-node styling everywhere
- unstable identity rules
- code that does not reflect real implementation logic

### If We Lean Too Far Toward Developer-Tool Thinking

We get:

- stronger architectural clarity
- cleaner class and component semantics
- more predictable output

But we risk:

- losing immediacy
- making the tool feel form-driven instead of direct
- forcing users into implementation details too early

### V1 Principle

**Designer experience should define the interaction surface.  
Frontend structure should define the internal truth model.**

That sentence is probably the most important one in this document.

---

## What Workbench Is Not Allowed to Become

These are explicit anti-goals.

## 1. Not an Opaque Magic Generator

Workbench should not become a tool where things “somehow work” but users cannot understand why.

## 2. Not a Node-by-Node Patch Machine

Workbench should not reduce UI authoring to:

- create node
- assign unique style
- attach more unique node CSS

That is not how humans build scalable frontend systems.

## 3. Not a Disposable Prototype Tool

Workbench is allowed to support prototyping.
But its architecture must not assume that prototype quality is enough.

If the underlying system cannot survive real mutation, the product will not scale.

## 4. Not a Tool That Hides Structure Problems Behind AI

AI can help explain, generate, and guide.
AI must not be used to paper over weak modeling decisions.

The core system still has to make structural sense.

## 5. Not a Hosted Code Upload Product by Default

Workbench should not assume teams will upload their full private codebase to a hosted design SaaS.

The default product shape is local-first:

- run against the user's real workspace
- respect repo permissions and ignore rules
- export only selected handoff context
- let the code agent and developer verify changes in the target project

Hosted collaboration may exist later, but it must not become the core source-of-truth assumption.

---

## The Role of AI in This Project

This matters enough to state clearly.

AI should not push the product toward:

- avoiding hard problems
- “good enough for now”
- prototype-only shortcuts
- feature-first patching

AI should help by:

- identifying structural mismatch
- explaining frontend implementation reality
- clarifying system boundaries
- authoring initial TSX/source artifacts from user intent through Codex Desktop
- making generated pages and components editable through Workbench's source-backed tree model
- verifying source-backed work in the real browser and development environment
- turning concrete findings into source changes for Codex, Claude Code, or another workspace agent
- helping translate designer intent into developer-valid models
- preserving hard-won lessons instead of forgetting them

Those lessons should become repository-owned, reviewed context rather than a
dependency on one person's AI account. The shareable layer should retain the
product principle, rationale, constraint, limitation, and improvement value of
a lesson while removing raw conversations, identities, sensitive incidents,
credentials, local paths, and unreviewed speculation. Workbench's curated
public layer is `docs/WORKBENCH-V1-ORGANIZATIONAL-CONTEXT.md`.

### AI Principle

**AI should reduce confusion, not reduce ambition.**

That is the correct role here.

---

## V1 Product Principles

These principles should guide design and engineering decisions.

## 1. Honest Structure Over Local Convenience

If a short-term shortcut conflicts with a correct long-term model, prefer the correct model.

## 2. Direct Manipulation Must Survive

The preview is not secondary.
Direct editing feel is part of the product core.

## 3. Real Frontend Semantics Must Be Respected

Components, classes, variants, overrides, and identity must behave in ways that frontend developers recognize.

## 4. Reuse Is the Default, Local Exception Is Secondary

The system should encourage reusable styling and component patterns before per-node exceptions.

## 5. Internal Anchors Are Allowed, but User-Facing Models Must Stay Human

Workbench may need machine-level anchors internally.
But the editing model shown to users should align with how humans think:

- classes
- components
- variants
- tokens
- overrides

## 6. Mutation Is the Real Product Test

A feature is not truly designed when it can only create something.
It is designed when it supports:

- edit
- partial edit
- delete
- restore
- duplicate
- undo/redo
- import/re-import

without breaking identity or trust.

## 7. Handoff Is Context, Not Final Production Code

Workbench handoff packages should be easy for a React / Next developer and their code agent to understand.

They should include the relevant source, registry, token subset, story metadata, design edits, and request text. They should not pretend to be fully verified production integration for every downstream app.

The developer still owns framework integration, data wiring, tests, accessibility, performance, and deployment verification.

---

## The Product Direction for V1

V1 should be understood as:

- preserving the strong design-tool instincts
- replacing weak implementation models
- rebuilding the editing core on top of real frontend structure
- making React / Next source-backed DesignOps the first verified product lane
- using VS Code / local workspace integration as the practical packaging direction
- treating Codex, Claude Code, and similar agents as code workers that receive Workbench-generated design context

In simpler terms:

### Keep

- visual immediacy
- token/system thinking
- preview editing feel
- code-backed output
- developer-verifiable handoff context

### Rebuild

- component mental model
- styling mental model
- source of truth rules
- identity rules
- edit operation semantics
- history semantics

### Add

- Storybook-like component library import and inspection
- Developer Handoff packages for source-backed component work

---

## The Single-Sentence V1 Mission

**Build an interface layer where designers collaborate with AI code agents on real React / Next source, while preserving the structural honesty developers need to trust the result.**

---

## What This Means for the Next Documents

Every future V1 spec should be checked against this document.

If a design choice:

- improves local implementation convenience
- but makes Workbench less like a real frontend workflow

then it should be challenged.

If a design choice:

- improves structural honesty
- and still preserves direct manipulation

then it is probably correct.

## Recommended Next Documents

1. `WORKBENCH-V1-COMPONENT-MENTAL-MODEL.md`
2. `WORKBENCH-V1-STYLING-PHILOSOPHY.md`
3. `WORKBENCH-V1-SOURCE-OF-TRUTH.md`
4. `WORKBENCH-V1-IDENTITY-RULES.md`

This is the right order because V1 must first define:

- what a component really is
- how styling should really work
- what the final truth actually is
- how identities support it
