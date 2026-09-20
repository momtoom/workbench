---
name: workbench-product-direction
description: Use when evaluating Workbench V1 product direction, UX scope, feature proposals, design-tool versus developer-tool tradeoffs, direct manipulation behavior, AI feature requests, roadmap choices, "should we build this" questions, or whether a proposed change matches Workbench's product philosophy.
---

# Workbench Product Direction

## Required Reading

Read:

- `docs/WORKBENCH-V1-PRODUCT-PHILOSOPHY.md`
- `docs/WORKBENCH-V1-ORGANIZATIONAL-CONTEXT.md`
- `docs/WORKBENCH-V1-AGENT-GUIDE.md`

For implementation implications, also read:

- `docs/WORKBENCH-V1-ARCHITECTURE.md`

## Product Guardrails

- Preserve Workbench as a direct-manipulation design/code workbench, not an opaque generator.
- Prefer honest source structure over local visual convenience.
- Treat real frontend semantics and ordinary React source as valid product inputs.
- Make mutation and round-trip editing the product test.
- Keep AI outside the app unless the user explicitly asks for in-app AI features.
- Avoid hiding structure problems behind generated UI, prompt bars, or registry hacks.
- When agents produce broken Workbench projects, strengthen the source contract, generated project guidance, skills, checks, and verification loop before adding product UI that hides or automates around the mistake.
- Keep durable product knowledge repository-owned and public-safe. Record
  generalized rationale, constraints, limitations, lessons, and improvement
  priorities; do not turn personal memory, raw conversations, or private
  incidents into an agent dependency or public artifact.

## Decision Workflow

1. Identify the user workflow: designer workflow, frontend developer workflow, design QA loop, or component/system authoring.
2. Ask whether the change improves editable source, direct manipulation, token thinking, or real code output.
3. Accept one-off page markup and ordinary React patterns when they remain
   source-backed and honestly editable. Reject only browser-only state, hidden
   generated structure, or boundaries that Workbench falsely presents as
   editable.
4. If a request conflicts with the product philosophy, propose the closest source-first alternative.
5. When implementation follows, route to the relevant technical skill.

## Red Flags

- The feature mainly hides broken structure.
- The feature requires in-app AI or prompt UI by default.
- The feature makes Workbench a disposable prototype generator.
- The feature edits internal DOM that cannot be safely written back to source.
- The feature makes a rendered result impossible to trace, select, or edit from
  its real source.
