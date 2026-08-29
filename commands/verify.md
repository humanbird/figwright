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
Knoten — sag es und hol den richtigen. Trägt das Wurzelelement gar keine
`data-node-id` (etwa bei einem Code-Connect-Treffer, der gemappten Projektcode
zurückgibt), ist die Kontrolle nicht durchführbar: dann gilt der Knoten aus
`get_metadata` als Bezug, und das gehört als Hinweis in den Tabellenkopf.

## 2. Soll ableiten — nur was wörtlich dasteht

Der Design-Kontext ist React mit Tailwind-Klassen in arbiträrer Schreibweise,
z. B. `gap-[var(--sds-size-space-200,8px)]`. Lies daraus:

- **Wert aus einer Klasse:** `p-[…]`, `px-/py-/pt-/pr-/pb-/pl-[…]`, `gap-[…]`,
  `gap-x-/gap-y-[…]`, `rounded-[…]`, `w-/h-/size-[…]`, `bg-[…]`,
  `border`/`border-[…]`/`border-[length:…]`/`border-[color:…]`/`border-solid`,
  `text-[color:…]`, `text-[length:…]`, `font-[family-name:…]`, `font-[…]`,
  `leading-[…]`/`leading-none`, `tracking-[…]`.
- **`var(--token,rückfall)` auflösen:** steht der Token in `get_variable_defs`,
  gilt dessen Wert; sonst der Rückfallwert. Tokenwerte sind einheitenlos
  (`"8"` = 8px). Steht der Token nirgends und gibt es keinen Rückfallwert:
  Lücke.
- **Textstil:** der `Font(family, style, size, weight, lineHeight, letterSpacing)`-
  Block aus den Variablen bzw. dem Hinweis „These styles are contained in the
  design" ist die verlässlichste Quelle für Zeilenhöhe und Laufweite. Seine
  Zahlen sind **Faktoren**, wo keine Einheit dabeisteht: `lineHeight: 1` heißt
  1 × Schriftgröße. Dasselbe gilt für `leading-none` (= Faktor 1) und
  `leading-[1.4]`. Unentscheidbar ist nur der Fall in den Fallstricken unten:
  ein *Token*, der zu einer nackten Zahl auflöst.
- **Breite/Höhe:** stehen selten als Klasse. `get_metadata` liefert sie für den
  Knoten (`width`/`height`). Das ist ein gültiges Soll, **solange der Knoten
  eine feste Größe hat**. Hat er keine Größenklasse, ist er ein Hug-Knoten:
  seine Breite ist Padding + der Text, wie **Figma** ihn ausmisst. Derselbe
  Font rendert im Browser anders — Bruchteile bis wenige Pixel. Dann ist die
  Metadaten-Breite ein **Richtwert**, kein hartes Soll (siehe Zustände unten).

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
  // Liegt die Figma-Schrift wirklich vor? Sonst meldet fontFamily brav den
  // gewünschten Stack-Kopf, während der Browser Fallback-Metriken rendert.
  schriftDa: t && document.fonts.check(`${t.fontSize} ${t.fontFamily.split(',')[0]}`),
  boxShadow: c.boxShadow,
  viewport: [innerWidth, innerHeight, devicePixelRatio],
})
```

Zu den Istwerten:

- `gap` meldet `normal`, wenn nichts gesetzt ist; in einem Flex- oder
  Grid-Container wirkt das wie `0px` — also messbar, **nicht** „nicht messbar".
  Ist das Element weder Flex noch Grid, ist der Gap nicht messbar.
- `letter-spacing` meldet `normal` auch dann, wenn `0` **explizit** gesetzt ist —
  Chrome normalisiert das. „normal" heißt hier `0px` und sagt nichts darüber,
  ob der Wert gesetzt wurde.
- `line-height: normal` ist dagegen wirklich kein px-Wert → nicht messbar.
- `schriftDa: false` heißt: die Schrift fehlt im System. Dann sind Breite und
  Höhe eines Hug-Knotens wertlos, und die Schriftfamilie-Zeile ist ein
  Fehlbefund. Schrift beschaffen und neu messen, sonst misst du nichts.
- Weichen `breite` und `layoutBreite` voneinander ab, steht das Element unter
  einem `transform`. Dann ist die Geometrie mit den übrigen Werten nicht
  vergleichbar → nicht messbar, mit beiden Zahlen im Grund.
- Sind die vier Radien oder Rahmenkanten verschieden, zeig sie einzeln.
- Schriftfamilie: verglichen wird nur der **erste** Eintrag des Stacks.

## 4. Tabelle

Genau diese Form, genau diese fünf Zustände:

```
| Eigenschaft | Soll | Ist | Zustand |
```

18 Zeilen in dieser Reihenfolge: Breite, Höhe, Innenabstand oben, Innenabstand
rechts, Innenabstand unten, Innenabstand links (**vier eigene Zeilen**, nicht
eine — Figma setzt sie einzeln), Abstand (Gap), Eckenradius, Rahmenbreite,
Rahmenstil, Rahmenfarbe, Hintergrundfarbe, Schriftfamilie, Schriftgröße,
Schriftschnitt, Zeilenhöhe, Laufweite, Textfarbe.

| Zustand | wann |
| --- | --- |
| `stimmt` | Soll und Ist decken sich innerhalb der Toleranz |
| `weicht ab` | beide Werte liegen vor und unterscheiden sich — Ist mit `(Δ +2px)` |
| `Soll unbelegt (<Grund>)` | der Design-Kontext gibt dazu nichts her |
| `nicht messbar (<Grund>)` | die Seite gibt den Wert nicht her |
| `Richtwert (Δ …, Hug-Knoten)` | nur Breite/Höhe bei Hug — siehe Toleranzen |

Toleranzen:

- **Typografie 0,1 px** (Schriftgröße, Zeilenhöhe, Laufweite) — der Browser
  rechnet sie aus Faktoren und meldet Nachkommastellen.
- **Geometrie 0,5 px** — nur Breite und Höhe, und nur bei fester Größe; die
  kommen aus `getBoundingClientRect` und runden auf Gerätepixel.
- **Innenabstände, Gap, Radius, Rahmenbreite: 0** — die stehen exakt im CSS.
  Bei der Rahmenbreite steht am meisten auf dem Spiel: ihr Werteraum ist
  0/1/2 px, jede Nachsicht winkt einen um 50 % zu dicken Rahmen durch.
- **Farben: 0**, auch im Alphakanal.
- **Hug-Knoten, Breite und Höhe: Richtwert.** Hat der Knoten keine Größenklasse,
  stammt das Soll aus Figmas eigener Textmessung (siehe Schritt 2). Eine
  Differenz von wenigen Pixeln ist dann Font-Rendering, kein Baufehler. Zustand
  `Richtwert (Δ …, Hug-Knoten)` — die Zeile wird gezeigt, löst aber keine Arbeit
  aus. Beheben nur, wenn die Differenz so groß ist, dass sie nicht mehr aus dem
  Textsatz kommen kann (Faustregel: mehr als 2 % der Sollbreite oder ein
  fehlendes Padding erklärt sie besser). Ohne diese Regel „behebst" du eine
  Font-Rendering-Differenz — genau das, was der Loop nicht tun soll.

Schreib in den Kopf der Tabelle, was du gemessen hast: Knoten-ID, URL,
Selektor und wie viele Elemente er trifft, gewähltes Element, Textträger,
Viewport und `devicePixelRatio` (die 0,5-px-Toleranz hängt daran). Meldet dein
Browser-Tool `0 × 0`, schreib „Viewport nicht gemeldet" — nicht die 0.

## 5. Abarbeiten

Nur **`weicht ab`** löst Arbeit aus. Beheben, dann **neu messen** — nicht die
alte Tabelle fortschreiben. Wiederholen, bis keine Zeile mehr abweicht, höchstens
aber drei Runden: bleibt danach etwas offen, hör auf zu drehen und leg die
Zeilen mit deiner Diagnose vor. Was du nicht sauber bekommst, ohne gegen das
Design zu verbiegen, bleibt stehen und wird benannt.

**`Soll unbelegt` ist kein Fehler und wird nicht „vorsichtshalber" angepasst.**
Meist gibt es nichts nachzuholen: Figma nennt die Eigenschaft schlicht nicht,
und dann **ist die Lücke das Ergebnis** — sie wird berichtet, nicht geschlossen.
Nachholen lohnt nur, wenn der Grund auf eine fehlende *Antwort* zeigt (etwa
„keine Metadaten mitgeliefert"). **`nicht messbar`** heißt meist: falsches Element —
Selektor schärfen.

Kein PASS, kein FAIL, keine Gesamtnote. Die Tabelle ist der Befund; ob der Rest
tragbar ist, entscheidest du und berichtest es.

## Fallstricke

- **Figma zeichnet den Rahmen INNEN, CSS außen.** Ein Knoten mit 1px-Stroke hat
  Höhe 40 = 12 + 16 + 12: der Strich liegt im Kasten. Ein CSS-`border` legt sich
  obendrauf und macht 42 daraus. Ohne Regel terminiert der Loop hier nie oder nur
  durch stilles Verbiegen (Padding auf 11px drücken — verschiebt den Text, sieht
  keine Zeile). Zwei Techniken sind legitim, such dir eine aus:
  - `border` behalten **und** die Größe explizit setzen (`height`/`width` aus den
    Metadaten) **mit** `box-sizing: border-box`. Alle Rahmenzeilen messen sich
    normal; Innenabstände bleiben die aus dem Design-Kontext.
  - `box-shadow: inset 0 0 0 1px <farbe>` statt `border`. Dann ist
    `borderTopWidth` echt `0px` — **nicht** als Abweichung melden, sondern
    Rahmenbreite, -stil und -farbe aus dem `boxShadow`-Wert lesen und die Zeilen
    mit dem Vermerk „aus inset box-shadow" führen. Das ist eine gemessene
    Tatsache, keine Nachsicht.

  Was du **nicht** tust: Innenabstände gegen das Design verkleinern, um die Höhe
  zu retten. Das verschiebt den Text und die Tabelle merkt es nicht.
- **Innenabstände nach Spezifität:** `pt-` schlägt `py-`, `py-` schlägt `p-` —
  unabhängig von der Reihenfolge der Klassen.
- **`gap-x` und `gap-y` verschieden:** dann hängt der geltende Wert von der
  Layout-Richtung ab, die der Kontext nicht nennt → Lücke, nicht raten.
- **Füllender Knoten** (`size-full`, `w-full`, `flex-[1_0_0]`): die Größe aus
  `get_metadata` ist die, die er im Figma-Kontext gerade hatte, keine feste
  Vorgabe. Nimm sie, aber sag dazu, dass eine Abweichung hier zu prüfen und
  nicht automatisch ein Befund ist.
- **Zeilenhöhe einheitenlos:** in einer Klasse (`leading-[1.4]`, `leading-none`)
  und im `Font(…)`-Block ist die nackte Zahl ein **Faktor** × Schriftgröße —
  so schreibt CSS es auch. Nur ein *Token*, der zu einer nackten Zahl auflöst
  (`"24"`), ist unentscheidbar: Figma-Token sind grundsätzlich einheitenlos,
  das kann ebenso 24px meinen → Lücke, kein Produkt.
- **`leading-[0]`** an einem Wrapper ist ein Figma-Artefakt; die echte
  Zeilenhöhe steht im `Font(…)`-Block oder am inneren Textelement.
- **Nicht-arbiträre Klassen** wie `p-2` oder `border-2` kannst du nicht
  auflösen, ohne die Tailwind-Konfiguration des Projekts zu kennen. Lücke —
  und nenn die Klasse im Grund.
- **Zwei `border-[…]`-Klassen:** eine ist die Breite, eine die Farbe. Ordne
  nach dem aufgelösten Wert zu, nicht nach der Reihenfolge.
