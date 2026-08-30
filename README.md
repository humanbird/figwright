# figwright

Two skills that measure a built component in a real browser against its Figma
node, property by property.

figwright tells you `font-size` is 15 where the design says 16 — row by row,
with numbers — then uses the design and rendered screenshots to record visible
facts the rows do not explain.

No code, no dependencies, no API tokens, no configuration. The whole tool is
Markdown plus one browser snippet: the agent pulls the target through its Figma
MCP and measures the actual with its own browser tools.

## Three steps

1. Connect a **Figma MCP** (the Figma app's Dev Mode MCP) **and a browser tool
   that can evaluate JavaScript on the page** (the Chrome DevTools MCP, for
   example). Without that tool there is nothing to measure with.
2. Install the plugin:
   ```
   /plugin marketplace add humanbird/figwright
   /plugin install figwright@figwright
   ```
   — or without the plugin: copy the `skills/` folders into `.claude/skills/`
   in your project (then they are `/figma-node-implementation` and
   `/figma-node-verification`).
3. `/figwright:figma-node-implementation <figma link with node-id>`

Both skills are also model-invoked: asking to "build this Figma node" or "check
this component against the design" reaches them without typing a name.

`figma-node-implementation` builds the component from the Figma node using the
project's tokens, delivers the URL it renders under, and then runs
`figma-node-verification`, which measures and works off the deviations.

## Measuring only

`/figwright:figma-node-verification <figma link with node-id>` runs on its own,
against a component that already exists, no matter who built it. It needs the
Figma node, a URL where the component renders, and a selector that hits it.
When the linked node is an interaction-state variant, that state is produced in
the browser and named in the table header. A state variant without that header
line voids the run rather than yielding a plausible default-state table.

It measures **and** fixes: rows that deviate get corrected and re-measured,
up to three rounds. It is not a read-only audit — if you want the numbers
without the edits, say so when you start it.

## The table

```
| Property     | Target | Actual        | State                                             |
| ------------ | ------ | ------------- | ------------------------------------------------- |
| Width        | 68px   | 67.953px      | matches                                           |
| Gap          | 8px    | 10px (Δ +2px) | deviates                                          |
| Border width | —      | 0px           | no target (no border-… class in the design context) |
| Font size    | 16px   | —             | not measurable (no text node in the element)      |
```

| State | Meaning |
| --- | --- |
| **matches** | Target and actual agree within tolerance. |
| **deviates** | Both values are present and differ. The only thing that triggers work. |
| **no target (reason)** | Figma yields nothing for it. **Not an error** — do not guess, do not adjust. |
| **not measurable (reason)** | The page yields no value — usually the wrong element. Sharpen the selector. |
| **reference (Δ …, hug node)** | Width/height of a content-sized node come from Figma's own text measurement. Shown, triggers no work. |
| **context size (Δ …, fill node)** | Width/height of a filling node come from Figma's frame, not from a fixed target. Shown, triggers no work. |

Tolerances: typography 0.1px; width/height 0.5px (device-pixel rounding);
padding, gap, radius and border width 0; RGB channels 0; alpha ≤ 1/255 after
both sides are rounded to 1/255 precision.

No PASS, no FAIL. The table is the finding, and the run ends with a ledger of
every row that is not `matches` — so a table full of `not measurable` cannot be
mistaken for a clean component.

After the table, every run records **Visual observations** from the design and
rendered screenshots and an **Assets & text** note naming reused design sources
and visible placeholders. Neither creates another table state or replaces the
numeric ledger. Shadows are measured as offset-x, offset-y, blur, spread, and
color from computed `boxShadow` and `filter: drop-shadow(…)`; their actual
channel is noted but compared channel-agnostically. An inset shadow used as a
border is counted only in the border rows.

## Limits

What this version does not measure. Deliberate boundaries, not a promise:

- **Effects other than shadows** — blur, opacity, blend modes.
- **Image and vector properties** — crop, `object-fit`, path, `viewBox`. Sources
  and placeholders are still recorded below the table.
- **Responsive and variant sweeps** — one viewport, one variant per run.
- **Nested instances** beyond the one child level the verification skill opens
  up.
- **Text-content correctness** — wording, line breaks, truncation. Used text and
  placeholders are recorded, and typography is measured.

## Backlog

- **Motion and transition behavior** — deliberately later, not never. Motion is
  frozen during current measurements so intermediate frames cannot distort the
  numbers.

## Versioning

Claude Code uses the plugin version as its cache key and skips an update when
the version is unchanged. Every release that changes a skill therefore bumps
`version` in **both** `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json` — otherwise installed users stay on the old
prompt logic.

## License

MIT
