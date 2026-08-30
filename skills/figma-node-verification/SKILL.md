---
name: figma-node-verification
description: "Measures a built component in a real browser against its Figma node, property by property, and works off the deviations. Use when the user wants an implementation verified, checked or measured against a Figma design, mentions target/actual comparison, pixel drift, or asks whether something matches the design, or supplies a Figma node link for a component that already exists. Not for producing the initial implementation — figma-node-implementation covers that — and not for screenshot diffing."
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

## 0. Inputs

Three, all required: the node-accurate Figma link, a URL where the component
renders, and a selector that hits exactly one element. Ask for whatever is
missing instead of picking a route, a variant or an element yourself — that
pick is what makes two competent agents measure two different things.

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
their own box properties (`border…`, `bg-…`, `rounded-…`, `p…-`), run the same
measurement for each** — own selector, own table block; the root header notes
"N children measured, see below". A child with no findable counterpart reads
`not measurable (no counterpart in the DOM)` rather than quietly disappearing.
Leaf nodes without box properties (icons, plain text nodes) stay closed. But
more than one text carrier means more than one text style — measure each
carrier that has its own `data-node-id` as its own block, and name the ones you
did not.

## 4. The table

```
| Property | Target | Actual | State |
| --- | --- | --- | --- |
| Width | 68px | 67.953px | matches |
| Gap | 8px | 10px (Δ +2px) | deviates |
| Border width | — | 0px | no target (no border-… class in the design context) |
| Font size | 16px | — | not measurable (no text node in the element) |
```

18 rows in this order: width, height, padding top, padding right, padding
bottom, padding left (**four rows of their own**, not one — Figma sets them
individually), gap, corner radius, border width, border style, border color,
background color, font family, font size, font weight, line height, letter
spacing, text color.

A row splits when the property does: four differing corner radii or border
edges become four named rows each, a grid container gets a column gap row and a
row gap row. Splitting is expected; dropping or inventing a property is not.

| State | when |
| --- | --- |
| `matches` | target and actual agree within tolerance |
| `deviates` | both values present and different — actual carries `(Δ +2px)` |
| `no target (<reason>)` | the design context yields nothing for it |
| `not measurable (<reason>)` | the page yields no value |
| `reference (Δ …, hug node)` | width/height on a hug node only |
| `context size (Δ …, fill node)` | width/height on a fill node only; if it agrees, `matches (fill — …)` |

Six states. The parentheses carry a reason or a note; they never create a
seventh. Normalisation and the tolerance per property live in the pitfalls
under [Comparing](references/pitfalls.md#comparing--where-a-wrong-comparison-still-looks-right).

The header says what you measured: node id, URL, selector and its hit count,
chosen element, text carrier and how many carriers exist, viewport and
`devicePixelRatio` (the 0.5px tolerance hangs off it), and how many children
you measured on top. If your browser tool reports `0 × 0`, write "viewport not
reported" — not the 0. Rows whose value you set yourself out of the metadata
via technique A carry the note `set by technique A`; they otherwise only
confirm themselves.

## 5. Working off

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
instead of letting a clean table imply it was covered: effects (shadow, blur,
opacity, blend mode; `boxShadow` is read only as evidence for the inset border
technique), image and vector content (source, crop, `object-fit`, path,
`viewBox`), interaction states (one render state per run), responsive and
variant sweeps (one viewport, one variant — a clean table at 1440 says nothing
about the other breakpoints), nested instances beyond the one child level in
step 3, and the text content itself (wording, line breaks, truncation — the
typography is measured, what it says is not).
