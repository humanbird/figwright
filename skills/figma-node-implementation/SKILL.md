---
name: figma-node-implementation
description: "Builds a Figma node as a component in the current project, using the project's own tokens, and delivers a render site plus a measured target/actual table. Use when the user wants a Figma node, frame or component implemented, ported or built in code, or supplies a Figma node link without an existing implementation. Not for verifying a component that already exists — figma-node-verification covers that on its own."
user-invocable: true
argument-hint: "<figma link with node-id>"
---

Build the Figma node `$ARGUMENTS` as a component in this project.

Without a `node-id` in the link there is nothing to build against — ask for a
node-accurate link.

## 1. Pull the design

By its own tool contract `get_design_context` requires the
`figma-design-to-code` guidance to be loaded first (skill or MCP resource).
Load it and follow it — it governs pulling, reading and translating the design
context, and that is not repeated here.

On top of `get_design_context` the later measurement needs
`get_variable_defs` (token values) and `get_metadata` (width/height of the
node).

If the context comes back truncated — a large node — do not build from the part
that arrived. Take the node map from `get_metadata`, pick the child node ids you
need, and pull those with their own `get_design_context` calls.

## 2. Reuse before building

Check what already exists before writing a new component:

- **An existing Code Connect mapping wins.** Consult `get_code_connect_map` (or
  `get_code_connect_suggestions`) for this node. If it maps to a project
  component, extend that component with the new variant rather than building a
  second one beside it.
- **No mapping is not the same as nothing there.** Search the project for a
  component that already covers this node — a button, a card, an input — and
  extend it. Consistency across the codebase beats an exact rebuild.

Verification takes the opposite route on purpose: it pulls with
`disableCodeConnect: true`, because measuring against the project's own
translation would only confirm the translation. Reuse is a build decision, the
raw target is a measuring decision — the two do not conflict.

## 3. Build — what figwright asks for on top

- **Use the project's tokens, invent nothing.** Every Figma token has a project
  token. If you find none, take the raw value and say explicitly in the report
  which value stayed untokenised — do not let it pass in silence.
- **Greenfield:** if there is no token layer at all yet, create one — that is
  allowed and wanted, with the names and values from `get_variable_defs`.
  "Invent nothing" forbids made-up *values*, not the layer that carries the real
  Figma ones. Report it as newly created.
- **Assets come from the Figma payload, nowhere else.** A `localhost` source
  returned by the MCP for an image or SVG is used directly — it is served by the
  MCP's own assets endpoint. Do not pull in an icon package, do not substitute a
  placeholder where a source was provided, and do not redraw an asset by hand.
- **Project conventions belong in the project.** If this repo has no design
  system rules yet, the `figma-create-design-system-rules` skill writes them
  into `CLAUDE.md`/`AGENTS.md` once, instead of being re-explained per run.

## 4. The render site — part of the job

Verification measures in a real browser, so **you** deliver the place where the
component renders: a reachable URL on a running dev server, and the design's
font actually loaded — without it, fallback metrics get measured and the table
reports nonsense. Expect to have to obtain the font first; it is often not on
the system. If it cannot be obtained legitimately, stop and say so rather than
measuring against a substitute face.

If a route, a story or a sandbox already shows the component, use it; create
your own demo page only when none of those exists. This is not a by-product, it
is part of the delivery.

If the URL does not come up, stop here and say why. Do not keep guessing.

## 5. Measure

Run the `figma-node-verification` skill on the same node right after
(`/figwright:figma-node-verification $ARGUMENTS`) and work off the deviations.
Hand over all three of its inputs — the node link, the URL from step 4, and a
selector that hits the component you just built. You know them; leaving them
out sends it back to asking you.
**Without a completed verification this job is not finished** — a built but
unmeasured component is not reported as done. Skill invocation is
model-driven, not a guaranteed hand-off: if the skill does not come up, say so
instead of reporting a component as verified.

Verification keeps its own round cap; do not count along here. Show the final
table in full at the end; from the intermediate rounds, what changed is enough.

## 6. Report

Changed files, which project tokens map onto which Figma tokens, the render
site (URL and how to start it), and what stayed open in the target/actual
table, including verification's closing ledger.
