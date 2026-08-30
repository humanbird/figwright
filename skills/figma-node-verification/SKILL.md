---
name: figma-node-verification
description: "Measures a built component in a real browser against its Figma node, property by property, and works off the deviations. Use when the user wants an implementation verified, checked or measured against a Figma design, mentions target/actual comparison, pixel drift, or asks whether something matches the design, or supplies a Figma node link for a component that already exists. Not for producing the initial implementation — figma-node-implementation covers that — and not for screenshot-only comparison."
user-invocable: true
argument-hint: "<figma link with node-id>"
---

Measure the built component against the Figma node `$ARGUMENTS`. Without a
`node-id` in the link there is nothing to measure against — ask for a
node-accurate link.

**Read [`references/pitfalls.md`](references/pitfalls.md) before the first
measurement.** Every trap in that file yields a complete, plausible, wrong
table rather than an error message, so a run that skipped it is
indistinguishable from one that did not.

This skill measures **and** works off what it finds: deviating rows get fixed
and re-measured. It is not a read-only audit. If the user wanted the numbers
only, say so before touching a file.

The table **replaces** the visual-parity checklist that closes the Figma
implementation workflow; it does not run beside it. A checklist asks whether the
padding looks right and gets a judgement back. This asks what the padding is and
gets a number.

The required screenshot step later does not restore that checklist: it records
named visual facts without scoring them, while the table remains authoritative.

## 0. Inputs

Three, all required: the node-accurate Figma link, a URL where the component
renders, and a selector that hits exactly one element. Ask for whatever is
missing instead of picking a route, a variant or an element yourself — that
pick is what makes two competent agents measure two different things. On a
hand-off from the implementation skill, all three come from there; there is
nothing left to ask.

## 1. Pull the target

By its own tool contract `get_design_context` requires the
`figma-design-to-code` guidance to be loaded first (skill or MCP resource),
standalone runs included. Load it, then pull for exactly this node:
`get_design_context`, `get_variable_defs`, `get_metadata`.

Check the node before anything else: the `data-node-id` on the root element of
the design context must be the node-id from the link (`123-456` in the link =
`123:456` in the context). If it differs you are measuring a foreign node — say
so and fetch the right one.

Mapped project code instead of Tailwind means Code Connect took over. Pull
again with `disableCodeConnect: true` and note it in the header. The tool asks
for that switch only on explicit user request — invoking this skill is that
request: it measures against the raw design target, not the project's own
translation. If the root still carries no `data-node-id`, the node from
`get_metadata` is the reference — header too.

### Produce the linked interaction state

When the linked node is a component variant whose variant property names an
interaction state (`State=Hover`, `State=Focus`, `State=Disabled`, and so on),
measure that state rather than the component's default state. Produce it before
the first measurement and again after every reload:

1. For a pseudo-class-driven state, use CDP `CSS.forcePseudoState` when the
   browser tool exposes it.
2. Otherwise use the project's existing prop, story control, event path, or
   class/attribute mechanism. Do not add a verification-only implementation of
   the state merely to make it measurable.

Keep the state in force for the measurement and the rendered screenshot. Add
the method to the table header exactly in this form: `state: hover (forced via
CDP CSS.forcePseudoState)` or `state: disabled (forced via project story
control)`. If the linked state cannot be produced, do not compare its target to
the default render: target-bearing rows read `not measurable (state not
producible)` and target-less rows retain `no target (<reason>)`. Count every
such row in the closing ledger.

## 2. Derive the target

[`references/reading-design-context.md`](references/reading-design-context.md)
covers which class carries which value, how tokens and font styles resolve, and
how a node's per-axis sizing mode decides whether its size is a hard target or a
reference.

## 3. Measure the actual, in a real browser

Set the window to a fixed, noted width — 1440 is a usable default unless the
design suggests otherwise; fill nodes depend on it. Open the page and **still
all motion first**, or you measure an intermediate state:

```js
const s = document.createElement('style');
s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
document.head.appendChild(s);
document.fonts.ready.then(() => 'ready')
```

Then run [`scripts/measure.js`](scripts/measure.js) with your selector. It
reports its own hit count, so you do not silently measure the first of five
cards. It needs no top-level `await`; if your tool has it, await
`document.fonts.ready` before measuring as well.

**Bypass the cache before every re-measurement.** A plain reload serves the old
CSS, and the table stays unchanged although you fixed the problem long ago — or
stays clean although you just broke something. Append a cache buster
(`?v=<timestamp>`) or force a hard reload; do not trust the dev server with it.

For the gap: with `display: flex` the axis of `flexDirection` counts
(`row…` → `columnGap`, otherwise `rowGap`); with `display: grid`, both. How to
read the rest of what comes back — `normal`, missing fonts, transforms — is in
the pitfalls.

### Measure the inside too, or you measure an empty shell

On many nodes the root carries no design at all: border, fill, radius and
padding sit in a child. Measure only the root and six rows report "no target"
although Figma specifies them — and a child with a screaming red border on a
neon green ground yields a table indistinguishable from the correct one.

So **when the design context carries children with their own `data-node-id` and
their own box properties (`border…`, `bg-…`, `rounded-…`, `p…-`, `gap-…`,
`gap-x-…`, `gap-y-…`, `shadow-…`), run the same measurement for each** — own
selector, own table block; the root header notes "N children measured, see
below". The gap and shadow classes belong in that list because a pure layout or
surface container often carries nothing else: leave them out and the property
is never measured, and the run reports `deviates 0` for a row it never looked
at. A child with no findable counterpart reads `not measurable (no counterpart
in the DOM)` rather than quietly disappearing. Leaf nodes without any of those
properties (icons, plain text nodes) stay closed.

More than one text carrier means more than one text style. The root block
already covers carrier 1 — do not open a second block for it; carriers 2..n get
one block each, and any you skip get named. That keeps the block count the same
across runs.

When one DOM element stands in for two Figma nodes — a wrapper and the carrier
inside it collapsed into a single rendered element — measure the size rows
against the wrapper and mark them `element stands in for its wrapper`, rather
than reporting an unexplained context-size delta.

## 4. The table

```
| Property | Target | Actual | State |
| --- | --- | --- | --- |
| Width | 68px | 67.953px | matches |
| Gap | 8px | 10px (Δ +2px) | deviates |
| Border width | — | 0px | no target (no border-… class in the design context) |
| Font size | 16px | — | not measurable (no text node in the element) |
```

23 base rows in this order: width, height, padding top, padding right, padding
bottom, padding left (**four rows of their own**, not one — Figma sets them
individually), gap, corner radius, border width, border style, border color,
background color, Shadow offset-x, Shadow offset-y, Shadow blur, Shadow spread,
Shadow color, font family, font size, font weight, line height, letter spacing,
text color. Shadow targets come from the readable `shadow-…` classes and
variables described in the design-context reference; without one, all five
rows read `no target (no shadow-… class in the design context)`. Actual values
come from computed `boxShadow` via the script's `boxShadows` list. Apply numeric
and color normalisation, but invent no shadow tolerance.

A row splits when the property does: four differing corner radii or border
edges become four named rows each, a grid container gets a column gap row and a
row gap row, and multiple shadows repeat the five rows as Shadow 1, Shadow 2,
and so on. Before comparing, remove an inset border-technique shadow exactly as
required by the pitfalls; it has already been accounted for in the Border rows.
Splitting is expected; dropping or inventing a property is not.

| State | when |
| --- | --- |
| `matches` | target and actual agree within tolerance |
| `deviates` | both values present and different — actual carries `(Δ +2px)` |
| `no target (<reason>)` | the design context yields nothing for it |
| `not measurable (<reason>)` | the page yields no value for the target property or state |
| `reference (Δ …, hug node)` | width/height on a hug node only |
| `context size (Δ …, fill node)` | width/height on a fill node only; if it agrees, `matches (fill — …)` |

Six states. The parentheses carry a reason or a note; they never create a
seventh. Normalisation and the tolerance per property live in the pitfalls
under [Comparing](references/pitfalls.md#comparing--where-a-wrong-comparison-still-looks-right).

The header says what you measured: node id, URL, selector and its hit count,
chosen element, text carrier and how many carriers exist, viewport and
`devicePixelRatio` (the 0.5px tolerance hangs off it), and how many children
you measured on top. For a linked interaction variant it also carries `state:
… (forced via …)` as specified above. If your browser tool reports `0 × 0`,
write "viewport not reported" — not the 0. Rows whose value you set yourself
out of the metadata via technique A carry the note `set by technique A`: their
target and their actual come from the same number, so without the note the row
reads as independent confirmation when it is none.

## 5. After the table: screenshot, assets and text

The table stays the primary finding. Once all of its blocks are complete, the
supplementary visual step is mandatory: pull `get_screenshot` for the exact
linked node, capture the rendered component at the measured viewport and in the
same forced state, and hold the two against each other. This is an observation
pass, not a second verdict and not a source of table values.

Directly under the table, add a **Visual observations** list. Name visible
facts which no row explains — for example `Search icon shown instead of the
Figma node's filter icon`, `Second badge rendered below the card`, or `Footer
overlaps the body`. Do not turn them into measurement rows, assign them a State,
or write an overall visual judgement. If there are none, write `No visual
observations beyond the table rows.` If either capture is unavailable, name the
missing capture there rather than implying that the comparison happened.

Then add an **Assets & text** note. List which design-provided sources and text
were used and where visibly marked asset or text placeholders remain. When a
category is absent or has no placeholders, say that explicitly. This is a
source/placeholder observation, never a measurement row and never a seventh
State.

Repeat both notes after the final re-measurement so that they describe the same
render as the final table.

## 6. Working off

Only **`deviates`** triggers work. Fix, then **re-measure** — do not carry the
old table forward. Repeat until no row deviates, at most three rounds — **this
is the only place anything is counted**. What is still open after that stays,
and you present those rows with your diagnosis rather than bending the design
to close them.

**`no target` is not an error and does not get "adjusted just in case".** Figma
simply does not name the property, and then **the gap is the result** —
reported, not closed. Catching up only pays when the reason points at a missing
*answer* (e.g. "no metadata delivered"). **`not measurable`** usually means the
wrong element — sharpen the selector.

Close with the ledger, so an unmeasurable run cannot pass for a clean one:

```
Rounds 2 · deviates 0 · no target 3 · not measurable 1 · reference 2 · context size 0
```

Done means: no row reads `deviates` **and** every remaining non-matching row is
counted in that ledger and explained. Twelve `not measurable` rows are a failed
measurement, not a passed component — say it in those words.

No PASS, no FAIL, no overall grade. The table is the finding; whether the rest
is tolerable is your call to state and the user's to make.

## Limits

Outside this version by decision, not by oversight — name the one a run touches
instead of letting a clean table imply it was covered: effects other than
shadows (blur, opacity, blend mode), image and vector properties (crop,
`object-fit`, path, `viewBox`; their sources and placeholders are still named
in **Assets & text**), responsive and variant sweeps (one viewport, one linked
variant — a clean table at 1440 says nothing about the other breakpoints),
nested instances beyond the one child level in step 3, and text-content
correctness (wording, line breaks, truncation; delivered text and placeholders
are still named in **Assets & text**, while typography is measured).

Screenshot comparison is the required supplementary observation pass in step
5. It can expose unexplained visible facts, but it supplies no measurements,
creates no table rows or States, and never replaces the table or its ledger.
