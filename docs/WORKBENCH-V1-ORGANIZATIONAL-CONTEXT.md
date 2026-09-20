# Workbench V1 Organizational Context

Audience: public
Status: curated

This document preserves the reviewed, externally shareable product knowledge
that should be available to any agent working on Workbench V1. It complements
the normative product, architecture, and authoring guides; it is not a raw
history of conversations, incidents, or individual memory.

## Disclosure policy

- Include only statements suitable for a public repository, case study, or product document.
- Generalize lessons so they retain the reusable principle without exposing people, accounts, customers, unreleased partners, or private incidents.
- Exclude secrets, credentials, security-sensitive operational details, personal data, raw conversations, session logs, local machine paths, and private repository history.
- Do not promote speculation or one agent's recollection into organizational truth. Ground durable claims in current source, tests, reviewed documentation, or repeatable product behavior.
- Agents may propose changes, but this document should receive the same human review as other public-facing product documentation.

## Purpose and product principles

- Workbench is a case study in giving people and coding agents a shared, source-backed environment for continuing the same frontend work.
- The product should make real React source visually inspectable and editable without turning it into a separate drawing artifact.
- A useful internal tool carries more than features: its source contracts, constraints, verification practices, and reviewed product principles give agents a reproducible way to reason about correct work.
- Product knowledge should be repository-owned and portable so sound judgment does not depend on one person's account or memory.

## Decision rationale

- Decision: Keep coding agents outside the Workbench UI. Rationale: Workbench owns visual inspection and source-backed manipulation, while agents remain replaceable collaborators that operate on the same project source.
- Decision: Treat mutation and round-trip editing as the product test. Rationale: rendering alone cannot prove that another person or agent can select, inspect, change, persist, and continue the work.
- Decision: Prefer explicit source contracts and honest read-only boundaries. Rationale: fabricated editability hides where data, runtime behavior, or source ownership actually lives.
- Decision: Distribute guidance through repository skills and an explicit MCP contract. Rationale: agent behavior should follow reviewed project knowledge rather than client-specific prompting or personal memory.

## Known constraints

- TSX source, component stories, registry linkage, CSS, tokens, and assets have distinct ownership and must remain coherent.
- Project metadata and asset paths must be project-relative and portable.
- Browser preview, Workbench Design canvas, Layers, Inspector, source writeback, and reload behavior provide different evidence and cannot substitute for one another.
- Heavy runtime dependencies need small project-owned component boundaries with semantic editable props.
- Guidance that changes agent behavior must remain synchronized across repository skills, generated project skills, MCP instructions, and regression checks.

## Known limitations

- Not every valid React expression or dependency-internal DOM node is directly editable through the current source projection.
- Runtime-heavy leaves, data-generated rows without a safe writer, computed expressions, and dependency internals may remain selectable but read-only.
- A project may render correctly while component identity, Layer selection, Inspector ownership, or writeback is incomplete.
- Organizational context is useful only when reviewed knowledge is deliberately recorded; the system does not convert private conversations or repository history into publishable truth automatically.

## Lessons learned

- Visual similarity is not sufficient evidence for a source-backed design tool.
- Project-source mistakes should be repaired at the project contract before shared editor behavior is changed to mask them.
- Stable component, source, and selection ownership matters more than maximizing the number of editable layers.
- Constraints and known limitations help agents make better decisions when they are discoverable at the moment of work rather than retained only as retrospective documentation.
- Public-safe summaries are more durable than raw histories because they can be reviewed, shared, and reused without carrying accidental sensitive context.

## Improvement priorities

- Continue narrowing the gap between valid React source and safely parseable, selectable, inspectable, and writable Workbench structure.
- Make project-owned product principles, decision rationale, constraints, limitations, lessons, and improvement priorities available through bounded MCP inspection.
- Keep agent guidance drift detectable with automated checks across repository and generated-project surfaces.
- Improve diagnostics so agents can distinguish malformed project source, unsupported-but-honest boundaries, preview runtime failures, and Workbench projection defects.

## Non-goals

- Do not turn Workbench into an in-app AI chat or opaque generation product.
- Do not require access to a particular creator, account, model, conversation history, or private memory to work effectively.
- Do not expose sensitive internal history in the name of giving agents more context.
- Do not claim that every internal tool must be built from scratch; the relevant requirement is organizational ownership and control of the knowledge-bearing contracts and data paths.
