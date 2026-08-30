# Pitfalls

Each trap below produces a complete, plausible, wrong table — never an error
message. That is why this file is read before the first measurement and not
after a surprise.

## Reading the design context

- **Figma draws the stroke inside the box, CSS draws it outside.** A node with a
  1px stroke has height 40 = 12 + 16 + 12: the stroke lives inside. A CSS
  `border` sits on top and makes 42 of it. Inside is Figma's default stroke
  alignment for frames; if the context or the metadata states the alignment,
  believe that instead. Without a rule the loop never terminates here, or it
  terminates by silently bending the design (padding squeezed to 11px — moves
  the text, no row notices). Two techniques are legitimate, pick one — **a plain
  `border` without either misses the box dimensions by 2 × border width**, and
  on a hug node the reference-value leniency can swallow exactly that. Building
  plain is therefore a knowing choice:
  - **Technique A, fixed size only:** keep the `border` **and** set the size
    explicitly (`height`/`width` from the metadata) **with**
    `box-sizing: border-box`. All border rows then measure normally; padding
    stays what the design context says. On a **hug** node it is forbidden as far
    as width goes: a fixed `width` nails down what is supposed to hug, and later
    text disappears silently under `overflow-clip`. On a hug node set `height`
    at most, never `width`.
  - **Technique B, always allowed and the only one for the width of a hug
    node:** `box-shadow: inset 0 0 0 1px <color>` instead of `border`. Then
    `borderTopWidth` really is `0px` — do not report that as a deviation. Read
    border width and color out of the `boxShadow` value and mark those rows
    "from inset box-shadow". An inset shadow carries no border style, so the
    **border style row reads `solid`** with the same mark.

  What you do **not** do: shrink padding against the design to rescue the
  height. That moves the text and the table cannot see it.
- **Padding by specificity:** `pt-` beats `py-`, `py-` beats `p-` — regardless
  of the order the classes appear in.
- **`gap-x` and `gap-y` differ:** then the effective value depends on the layout
  direction, which the context does not state → gap, do not guess.
- **A fill node is recognised only in the child view.** The same classes on the
  pulled root are boilerplate and mean nothing.
- **Unitless line height:** in a class (`leading-[1.4]`, `leading-none`) and in
  the `Font(…)` block the bare number is a **factor** × font size — that is how
  CSS reads it too. Only a *token* that resolves to a bare number (`"24"`) is
  undecidable: Figma tokens are unitless by nature, so it may equally mean 24px.
  Record a gap; do not compute a product.
- **`leading-[0]`** on a wrapper is a Figma artefact; the real line height is in
  the `Font(…)` block or on the inner text element.
- **Bracketless borders are readable:** `border` alone means **1px** (the most
  common generator output for a 1px stroke), `border-<n>` means **n px** —
  `border-10` is a 10px border and gets measured. Treat it as a gap and an
  oversized border runs through unmeasured while the table reports a false pass.
- **`p-<n>`, `gap-<n>`, `rounded-<n>` without brackets: gap.** The generator
  writes these values arbitrarily throughout (`gap-[20px]`, not `gap-5`), so
  there is no evidence what a bracketless form is supposed to mean — and the one
  available semantics argues against it: in Tailwind `p-4` is 16px, not 4px.
  Read as "n pixels" you measure against a target off by a factor of four and
  break a correct component. Gap, with exactly that reason and the class in it.
- **Two `border-[…]` classes:** one is the width, one is the color. Assign them
  by resolved value, not by the order they appear in.

## Reading the measured values

- `gap` reports `normal` when nothing is set; inside a flex or grid container
  that behaves like `0px` — so it is measurable, **not** "not measurable". If
  the element is neither flex nor grid, the gap is not measurable.
- `letter-spacing` reports `normal` even when `0` is set **explicitly** — Chrome
  normalises it. "normal" means `0px` here and says nothing about whether the
  value was set.
- `line-height: normal` really is no px value → not measurable.
- `fontLoaded: false` means the face is missing from the system. Then the width
  and height of a hug node are worthless and the font family row is a false
  finding. Get the font, re-measure — otherwise you are measuring nothing.
  A `true` is weaker than it looks: it says the queried face is available, not
  that the renderer used it. Treat it as "not obviously missing".
- `width` and `layoutWidth` differing means the element sits under a
  `transform`. The geometry is then not comparable with the other values → not
  measurable, with both numbers in the reason.
- Four differing radii or border edges get their own rows each.
- Font family: only the **first** entry of the stack is compared.

## Comparing — where a wrong comparison still looks right

Compare values, not strings. `#fff` against `rgb(255 255 255)` is a false
`deviates`; rounding before comparing is a false `matches`.

- **Colors:** normalise both sides to integer RGB channels plus alpha before
  comparing. Show the actual in the form the page reported it.
- **Lengths:** strip the unit, compare as numbers against the tolerance. Round
  to two decimals for display only, never before comparing.
- **Font family:** first stack entry, quotes stripped, case-insensitive.
- **Font weight:** numeric on both sides — a style name maps to its CSS weight.

### Tolerances

- **Typography 0.1px** (font size, line height, letter spacing) — the browser
  computes these from factors and reports decimals.
- **Geometry 0.5px** — width and height only, and only at fixed size; they come
  from `getBoundingClientRect` and round to device pixels.
- **Padding, gap, radius, border width: 0** — those sit exactly in the CSS. The
  border width has the most at stake: its value space is 0/1/2px, so any
  leniency waves through a border 50% too thick.
- **Colors: 0**, alpha channel included.
- **Hug node, width and height: reference.** When the node sizes to its content
  the target comes from Figma's own text measurement, so a few pixels of
  difference are font rendering, not a build error. State
  `reference (Δ …, hug node)` — shown, but it triggers no work, and that holds
  at `Δ 0px` too, where it stays `reference (Δ 0px, hug node)` rather than
  becoming `matches`. Without that rule you "fix" a font-rendering difference,
  which is exactly what this loop must not do. **Exception:** once the
  difference exceeds **2% of the target size on the same axis AND 3px** (width
  against target width, height against target height), it no longer comes out of
  text layout. Then the state is `deviates` and the row triggers work like any
  other. Both thresholds have to fall: 2% of 67px is 1.3px, below the normal
  drift between Figma's and Chrome's text metrics — alone it would fire exactly
  where it is meant to protect. An over-thick border in a child does not slip
  through here: the child measurement shows it on its own border row at
  tolerance 0.
