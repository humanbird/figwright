# Reading the design context

These rules describe the Dev Mode MCP's current React + Tailwind output, where
classes are written arbitrarily, e.g. `gap-[var(--sds-size-space-200,8px)]`. If
the generator ever returns a different format, stop and say so rather than
stretching these rules over something unknown — a silent misread is the one
outcome worth avoiding here.

## Values from classes

`p-[…]`, `px-/py-/pt-/pr-/pb-/pl-[…]`, `gap-[…]`, `gap-x-/gap-y-[…]`,
`rounded-[…]`, `w-/h-/size-[…]`, `bg-[…]`, `border`/`border-[…]`/
`border-[length:…]`/`border-[color:…]`/`border-solid`, `text-[color:…]`,
`text-[length:…]`, `font-[family-name:…]`, `font-[…]`,
`leading-[…]`/`leading-none`, `tracking-[…]`, and arbitrary-value or
variable-backed `shadow-…` classes.

## Shadows

Read a shadow target only when the design context supplies its value literally:
an arbitrary-value `shadow-[…]` class, including `shadow-[var(--…)]`, or a
`shadow-…` variable whose value is available from `get_variable_defs`. Resolve
`var(…)` as below, turn underscores in an arbitrary value back into spaces, and
record offset-x, offset-y, blur, spread, and color separately. An omitted
spread is `0px`. Preserve multiple shadows in their declared order and repeat
the five rows as Shadow 1, Shadow 2, and so on.

A named shadow class without a readable value is not permission to import a
framework default. It yields `no target` with the class named in the reason.
When there is no `shadow-…` class at all, the five Shadow rows read
`no target (no shadow-… class in the design context)`.

## Resolving `var(--token, fallback)`

If the token is in `get_variable_defs`, its value applies; otherwise the
fallback. Token values are unitless (`"8"` = 8px). If the token appears nowhere
and there is no fallback: gap.

## Fonts

`font-['Family:Style']` — family before the colon, style after it:
`font-['Whyte:Regular']` is family Whyte, style Regular. Convert the style name
to its CSS weight; that conversion is the source for the font weight row
whenever no explicit `font-[…]` weight class is present.

The `Font(family, style, size, weight, lineHeight, letterSpacing)` block — from
the variables or from the "These styles are contained in the design" note — is
the most reliable source for line height and letter spacing. Its numbers are
**factors** wherever no unit is attached: `lineHeight: 1` means 1 × font size.
The same holds for `leading-none` (factor 1) and `leading-[1.4]`. The one
undecidable case is in the pitfalls: a *token* resolving to a bare number.

## Colors

That same "These styles are contained in the design" note also carries **color
styles** (e.g. `Fill/Neutral/Primary: #1e1e1e`). It is a color source, not just
a font carrier, and it resolves named color classes.

Do not expect it to answer for `white` or `black`. Style names are assigned
freely and have no relation to the class name — seen in the wild:
`W: #FFFFFF`, `K: #000000`. Standard color keywords stand on their own; treating
them as a gap because the style list has no matching entry lets black text pass
for white without a single row noticing.

## Width and height, and what they are worth

Sizes rarely appear as a class. `get_metadata` carries `width`/`height` for the
node. Whether that is a hard target or a reference depends on how the node sizes
itself — and that depends on **which perspective** you pulled the design context
from:

- **On the pulled root element, `size-full` is generator boilerplate.** The
  generator writes it onto every root unconditionally, regardless of how the
  node sizes itself. There it is **neither a hug nor a fill signal** — ignore it
  completely.
- **The child view is the telling one:** the same node pulled as part of its
  parent, where the generator writes what actually applies.
- **Variants out of a component set have no child view.** Pull the parent and
  the generator hands you the variant again as its own root, not as a child.
  That is the normal case, not the exception. The **main path** is then
  `get_metadata` plus a screenshot: if the size matches padding + content
  exactly, the node sizes to its content; if it visibly fills its frame, it is
  filling.

Classify **each axis separately**: `w-full` with `shrink-0` and no `h-` class
means width-filling **and** height-hugging. Any leniency below applies only to
the axis it was derived for.

- **Hug** (size follows content): in the child view, `shrink-0` **without** a
  `w-`/`h-`/`size-` class on that axis — otherwise via metadata and screenshot.
  The metadata size is then a **reference**, not a hard target: Figma measures
  text with its own metrics, and the browser renders the same font a fraction of
  a pixel to a few pixels differently.
- **Fixed** (`w-[…]`, `h-[…]`, `size-[…]` on that axis): hard target.
- **Pinned by a minimum** (`min-w-[…]`, `min-h-[…]` on that axis): if the
  screenshot shows the content sitting narrower than that minimum, the minimum
  is what sets the size — the axis behaves as fixed and the metadata size is a
  hard target. Only when the content exceeds the minimum does the axis hug
  again. Without this clause the everyday design-system card, sized by its
  `min-w-`, falls through to "sizing mode undetermined".
- **Fill** (`flex-[1_0_0]`, `w-full`, `h-full`, `size-full` **in the child
  view**; on the pulled root the same classes mean nothing): the metadata size
  is whatever the node happened to have in its Figma context — no hard target.
  If it agrees, write `matches (fill — size from the Figma context, no fixed
  target)`; if it deviates, write `context size (Δ …, fill node)`. Neither
  triggers work: how wide the node should be here is decided by its place in the
  project, not by the frame Figma measured it in.
- **Undetermined:** if the child view is unavailable and metadata plus
  screenshot do not settle the axis, the size row is
  `not measurable (sizing mode undetermined)`. Picking one is a guess, and the
  whole downstream leniency hangs off that pick.

## Never guess

What you cannot read literally becomes a gap with a reason. The reason names
what you *could not read* — never a design fact you did not check. So "no
`bg-…` value in the design context", not "the node has no fill".
