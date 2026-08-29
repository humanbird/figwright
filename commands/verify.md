---
description: Eine gebaute Komponente im echten Browser property-genau gegen ihren Figma-Knoten messen.
argument-hint: <figma-link mit node-id>
---

Miss die gebaute Komponente gegen den Figma-Knoten `$ARGUMENTS`.

Ohne `node-id` im Link geht es nicht weiter — dann frag nach einem knotengenauen Link.

## 1. Soll holen

Über deinen Figma-MCP für genau diesen Knoten: `get_design_context`,
`get_variable_defs`, `get_metadata`.

**Kontrollier zuerst, dass du den richtigen Knoten hast.** Die `data-node-id` am
Wurzelelement des Design-Kontexts muss die node-id aus dem Link sein (`123-456`
im Link = `123:456` im Kontext). Stimmt sie nicht, misst du gegen einen fremden
Knoten — sag es und hol den richtigen.

## 2. Soll ableiten — nur was wörtlich dasteht

Der Design-Kontext ist React mit Tailwind-Klassen in arbiträrer Schreibweise,
z. B. `gap-[var(--sds-size-space-200,8px)]`. Lies daraus:

- **Wert aus einer Klasse:** `p-[…]`, `px-/py-/pt-/pr-/pb-/pl-[…]`, `gap-[…]`,
  `gap-x-/gap-y-[…]`, `rounded-[…]`, `w-/h-/size-[…]`, `bg-[…]`,
  `border`/`border-[…]`/`border-solid`, `text-[color:…]`, `text-[length:…]`,
  `font-[family-name:…]`, `font-[…]`, `leading-[…]`/`leading-none`,
  `tracking-[…]`.
- **`var(--token,rückfall)` auflösen:** steht der Token in `get_variable_defs`,
  gilt dessen Wert; sonst der Rückfallwert. Tokenwerte sind einheitenlos
  (`"8"` = 8px). Steht der Token nirgends und gibt es keinen Rückfallwert:
  Lücke.
- **Textstil:** der `Font(family, style, size, weight, lineHeight, letterSpacing)`-
  Block aus den Variablen bzw. dem Hinweis „These styles are contained in the
  design" ist die verlässlichste Quelle für Zeilenhöhe und Laufweite.
- **Breite/Höhe:** stehen selten als Klasse. `get_metadata` liefert sie für den
  Knoten (`width`/`height`) — das ist ein gültiges Soll.

**Nie raten.** Was du nicht wörtlich lesen kannst, wird zur Lücke mit Grund.
Der Grund benennt, was du *nicht lesen konntest* — nie eine Design-Tatsache,
die du nicht geprüft hast. Also „kein `bg-…`-Wert im Design-Kontext", nicht
„der Knoten hat keine Füllung".

## 3. Ist messen — im echten Browser

Sorg dafür, dass die Komponente unter einer erreichbaren URL rendert. Öffne sie
mit deinem Browser-Tool und **leg zuerst alle Bewegung still**, sonst misst du
einen Zwischenstand:

```js
const s = document.createElement('style');
s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
document.head.appendChild(s);
await document.fonts.ready;
```

Dann miss am gerenderten Element. Nimm einen Selektor, der genau deine
Komponente trifft — und prüf, wie viele Elemente er trifft; gemessen wird sonst
wortlos die erste von fünf Karten.

```js
const el = document.querySelector('<dein-selektor>');
const c = getComputedStyle(el), r = el.getBoundingClientRect();
// Textträger: erstes Element mit eigenem, nicht leerem Textknoten
const tEl = [el, ...el.querySelectorAll('*')].find(n =>
  [...n.childNodes].some(k => k.nodeType === 3 && k.textContent.trim()));
const t = tEl && getComputedStyle(tEl);
({
  breite: r.width, hoehe: r.height,
  layoutBreite: el.offsetWidth, layoutHoehe: el.offsetHeight,
  padding: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft],
  gap: c.flexDirection.startsWith('row') ? c.columnGap : c.rowGap,
  display: c.display, flexDirection: c.flexDirection,
  radius: [c.borderTopLeftRadius, c.borderTopRightRadius,
           c.borderBottomRightRadius, c.borderBottomLeftRadius],
  rahmen: [c.borderTopWidth, c.borderTopStyle, c.borderTopColor],
  hintergrund: c.backgroundColor,
  schrift: t && [t.fontFamily, t.fontSize, t.fontWeight, t.lineHeight,
                 t.letterSpacing, t.color],
})
```

Zu den Istwerten:

- `gap`/`letter-spacing` melden `normal`, wenn nichts gesetzt ist. Bei Flex und
  Grid wirkt das wie `0px` — also messbar, **nicht** „nicht messbar".
- `line-height: normal` ist dagegen wirklich kein px-Wert → nicht messbar.
- Weichen `breite` und `layoutBreite` voneinander ab, steht das Element unter
  einem `transform`. Dann ist die Geometrie mit den übrigen Werten nicht
  vergleichbar → nicht messbar, mit beiden Zahlen im Grund.
- Sind die vier Radien oder Rahmenkanten verschieden, zeig sie einzeln.
- Schriftfamilie: verglichen wird nur der **erste** Eintrag des Stacks.

## 4. Tabelle

Genau diese Form, genau diese vier Zustände:

```
| Eigenschaft | Soll | Ist | Zustand |
```

Zeilen in dieser Reihenfolge: Breite, Höhe, Innenabstand oben/rechts/unten/links,
Abstand (Gap), Eckenradius, Rahmenbreite, Rahmenstil, Rahmenfarbe,
Hintergrundfarbe, Schriftfamilie, Schriftgröße, Schriftschnitt, Zeilenhöhe,
Laufweite, Textfarbe.

| Zustand | wann |
| --- | --- |
| `stimmt` | Soll und Ist decken sich innerhalb der Toleranz |
| `weicht ab` | beide Werte liegen vor und unterscheiden sich — Ist mit `(Δ +2px)` |
| `Soll unbelegt (<Grund>)` | der Design-Kontext gibt dazu nichts her |
| `nicht messbar (<Grund>)` | die Seite gibt den Wert nicht her |

Toleranzen:

- **Typografie 0,1 px** (Schriftgröße, Zeilenhöhe, Laufweite) — der Browser
  rechnet sie aus Faktoren und meldet Nachkommastellen.
- **Geometrie 0,5 px** — nur Breite und Höhe; die kommen aus
  `getBoundingClientRect` und runden auf Gerätepixel.
- **Innenabstände, Gap, Radius, Rahmenbreite: 0** — die stehen exakt im CSS.
  Bei der Rahmenbreite steht am meisten auf dem Spiel: ihr Werteraum ist
  0/1/2 px, jede Nachsicht winkt einen um 50 % zu dicken Rahmen durch.
- **Farben: 0**, auch im Alphakanal.

Schreib in den Kopf der Tabelle, was du gemessen hast: Knoten-ID, URL,
Selektor und wie viele Elemente er trifft, gewähltes Element, Textträger.

## 5. Abarbeiten

Nur **`weicht ab`** löst Arbeit aus. Beheben, dann **neu messen** — nicht die
alte Tabelle fortschreiben. Wiederholen, bis keine Zeile mehr abweicht.

**`Soll unbelegt` ist kein Fehler und wird nicht „vorsichtshalber" angepasst.**
Stört dich der Grund (z. B. fehlende Metadaten), hol die fehlende MCP-Antwort
nach und miss erneut. **`nicht messbar`** heißt meist: falsches Element —
Selektor schärfen.

Kein PASS, kein FAIL, keine Gesamtnote. Die Tabelle ist der Befund; ob der Rest
tragbar ist, entscheidest du und berichtest es.

## Fallstricke

- **Innenabstände nach Spezifität:** `pt-` schlägt `py-`, `py-` schlägt `p-` —
  unabhängig von der Reihenfolge der Klassen.
- **`gap-x` und `gap-y` verschieden:** dann hängt der geltende Wert von der
  Layout-Richtung ab, die der Kontext nicht nennt → Lücke, nicht raten.
- **Füllender Knoten** (`size-full`, `w-full`, `flex-[1_0_0]`): die Größe aus
  `get_metadata` ist die, die er im Figma-Kontext gerade hatte, keine feste
  Vorgabe. Nimm sie, aber sag dazu, dass eine Abweichung hier zu prüfen und
  nicht automatisch ein Befund ist.
- **Zeilenhöhe einheitenlos:** `leading-[1.4]` ist ein Faktor (× Schriftgröße).
  Ein *Token*, der zu `"24"` auflöst, kann ebenso 24px meinen — das ist nicht
  entscheidbar → Lücke, kein Produkt.
- **`leading-[0]`** an einem Wrapper ist ein Figma-Artefakt; die echte
  Zeilenhöhe steht im `Font(…)`-Block oder am inneren Textelement.
- **Nicht-arbiträre Klassen** wie `p-2` oder `border-2` kannst du nicht
  auflösen, ohne die Tailwind-Konfiguration des Projekts zu kennen. Lücke —
  und nenn die Klasse im Grund.
- **Zwei `border-[…]`-Klassen:** eine ist die Breite, eine die Farbe. Ordne
  nach dem aufgelösten Wert zu, nicht nach der Reihenfolge.
