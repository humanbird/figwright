---
description: Eine gebaute Komponente im echten Browser property-genau gegen ihren Figma-Knoten messen.
argument-hint: <figma-link mit node-id>
---

Miss die gebaute Komponente gegen den Figma-Knoten `$ARGUMENTS`.

Ohne `node-id` im Link geht es nicht weiter — dann frag nach einem knotengenauen Link.

## 1. Soll holen

`get_design_context` verlangt laut eigenem Tool-Vertrag, dass du zuvor die
`figma-design-to-code`-Guidance lädst (Skill oder MCP-Resource) — auch wenn du
diesen Command allein fährst. Lade sie, dann hol über deinen Figma-MCP für genau
diesen Knoten: `get_design_context`, `get_variable_defs`, `get_metadata`.

**Kontrollier zuerst, dass du den richtigen Knoten hast.** Die `data-node-id` am
Wurzelelement des Design-Kontexts muss die node-id aus dem Link sein (`123-456`
im Link = `123:456` im Kontext). Stimmt sie nicht, misst du gegen einen fremden
Knoten — sag es und hol den richtigen.

Kommt statt Tailwind-Code gemappter Projektcode zurück, hat Code Connect
gegriffen. Hol den Kontext erneut mit `disableCodeConnect: true` und vermerk das
im Tabellenkopf. Das Tool bittet, diesen Schalter nur auf ausdrücklichen
Nutzerwunsch zu setzen — der Wunsch liegt vor: wer diesen Command aufruft,
verlangt eine Messung gegen das rohe Design-Soll, nicht gegen die
Projekt-Übersetzung. Trägt das Wurzelelement auch dann keine
`data-node-id`, gilt der Knoten aus `get_metadata` als Bezug — ebenfalls in den
Kopf.

## 2. Soll ableiten — nur was wörtlich dasteht

Der Design-Kontext ist React mit Tailwind-Klassen in arbiträrer Schreibweise,
z. B. `gap-[var(--sds-size-space-200,8px)]`. Alle Leseregeln hier gelten für
dieses React+Tailwind-Ausgabeformat des Dev-Mode-MCP; liefert er eines Tages
etwas anderes, sind sie neu zu prüfen. Lies daraus:

- **Wert aus einer Klasse:** `p-[…]`, `px-/py-/pt-/pr-/pb-/pl-[…]`, `gap-[…]`,
  `gap-x-/gap-y-[…]`, `rounded-[…]`, `w-/h-/size-[…]`, `bg-[…]`,
  `border`/`border-[…]`/`border-[length:…]`/`border-[color:…]`/`border-solid`,
  `text-[color:…]`, `text-[length:…]`, `font-[family-name:…]`, `font-[…]`,
  `leading-[…]`/`leading-none`, `tracking-[…]`.
- **`var(--token,rückfall)` auflösen:** steht der Token in `get_variable_defs`,
  gilt dessen Wert; sonst der Rückfallwert. Tokenwerte sind einheitenlos
  (`"8"` = 8px). Steht der Token nirgends und gibt es keinen Rückfallwert:
  Lücke.
- **`font-['Familie:Schnitt']`:** vor dem Doppelpunkt steht die Familie, danach
  der Schnitt — `font-['Whyte:Regular']` heißt Familie Whyte, Schnitt Regular.
  Den Schnittnamen setzt du nach üblicher Zuordnung in ein CSS-Gewicht um:
  Thin 100, ExtraLight 200, Light 300, Regular 400, Medium 500, SemiBold 600,
  Bold 700, ExtraBold 800, Black 900. Das ist keine Rateübung, sondern die
  Standardtabelle — und die Quelle für die Schriftschnitt-Zeile, wenn keine
  eigene `font-[…]`-Gewichtsklasse dasteht.
- **Textstil:** der `Font(family, style, size, weight, lineHeight, letterSpacing)`-
  Block aus den Variablen bzw. dem Hinweis „These styles are contained in the
  design" ist die verlässlichste Quelle für Zeilenhöhe und Laufweite. Dieselbe
  Hinweiszeile führt auch **Farbstile** (etwa `Fill/Neutral/Primary: #1e1e1e`) —
  sie ist Farbquelle, nicht nur Font-Träger, und löst benannte Farbklassen auf. Seine
  Zahlen sind **Faktoren**, wo keine Einheit dabeisteht: `lineHeight: 1` heißt
  1 × Schriftgröße. Dasselbe gilt für `leading-none` (= Faktor 1) und
  `leading-[1.4]`. Unentscheidbar ist nur der Fall in den Fallstricken unten:
  ein *Token*, der zu einer nackten Zahl auflöst.
- **Benannte Farben:** `white` = `#FFFFFF`, `black` = `#000000` — das sind
  Tailwind-Grundfarben und stehen fest, egal was sonst geliefert wird. Nur für
  **nicht-standardisierte** Namen ziehst du die Zeile „These styles are contained
  in the design" und `get_variable_defs` heran. Erwarte dort keinen Treffer für
  `white`/`black`: die Stilnamen sind frei vergeben (real gesehen: `W: #FFFFFF`,
  `K: #000000`) und haben keinen Bezug zum Klassennamen. Wer hier auf eine Lücke
  geht, lässt schwarzen statt weißen Text lautlos durch.
- **Breite/Höhe:** stehen selten als Klasse. `get_metadata` liefert sie für den
  Knoten (`width`/`height`). Ob das ein hartes Soll oder ein Richtwert ist,
  hängt davon ab, wie der Knoten sich bemisst — und dafür ist entscheidend, aus
  **welcher Perspektive** du den Design-Kontext gezogen hast:

  - **Am gezogenen Wurzelelement ist `size-full` Generator-Boilerplate.** Der
    Generator setzt sie jeder Wurzel unkonditional, unabhängig davon, wie der
    Knoten sich bemisst. Sie ist dort **weder Hug- noch Füll-Indiz** — ignorier
    sie vollständig.
  - **Aussagekräftig wäre die Kind-Ansicht:** derselbe Knoten, gezogen als Teil
    seines Elternknotens — dort schreibt der Generator, was wirklich gilt.
  - **Bei Varianten aus einem Component-Set gibt es sie nicht.** Ziehst du den
    Elternknoten, liefert der Generator die Variante erneut als eigene Wurzel,
    nicht als Kind. Das ist der Normalfall, nicht die Ausnahme. Dann ist der
    **Hauptweg** `get_metadata` plus Screenshot: passt die Größe genau zu
    Padding + Inhalt, bemisst sich der Knoten nach seinem Inhalt; füllt er
    sichtbar seinen Rahmen, ist er füllend.

  Und zwar **je Achse einzeln**: `w-full` mit `shrink-0` und ohne `h-`-Klasse
  heißt breitenfüllend **und** höhen-hugend. Stuf Breite und Höhe getrennt ein;
  jede Nachsicht unten gilt nur für die Achse, für die sie hergeleitet ist.

  - **Hug** (Größe folgt dem Inhalt): in der Kind-Ansicht `shrink-0` **ohne**
    `w-`/`h-`/`size-`-Klasse auf dieser Achse — sonst über Metadaten und
    Screenshot. Dann ist die Metadaten-Größe ein **Richtwert**, kein hartes
    Soll: Figma misst den Text mit eigener Metrik, der Browser rendert denselben
    Font um Bruchteile bis wenige Pixel anders (siehe Zustände unten).
  - **Fest** (`w-[…]`, `h-[…]`, `size-[…]` auf dieser Achse): hartes Soll.
  - **Füllend** (`flex-[1_0_0]`, `w-full`, `h-full`, `size-full` **in der
    Kind-Ansicht**; an der gezogenen Wurzel bedeuten dieselben Klassen nichts):
    die Metadaten-Größe ist die, die der Knoten im Figma-Kontext gerade hatte —
    kein hartes Soll. Deckt sie sich, schreib
    `stimmt (füllend — Größe aus dem Figma-Kontext, keine feste Vorgabe)`;
    weicht sie ab, schreib `Kontextgröße (Δ …, füllender Knoten)`. Beides löst
    keine Arbeit aus: wie breit der Knoten hier sein soll, entscheidet sein
    Platz im Projekt, nicht der Ausschnitt, aus dem Figma ihn gemessen hat.

**Nie raten.** Was du nicht wörtlich lesen kannst, wird zur Lücke mit Grund.
Der Grund benennt, was du *nicht lesen konntest* — nie eine Design-Tatsache,
die du nicht geprüft hast. Also „kein `bg-…`-Wert im Design-Kontext", nicht
„der Knoten hat keine Füllung".

## 3. Ist messen — im echten Browser

Sorg dafür, dass die Komponente unter einer erreichbaren URL rendert. Setz das
Fenster auf eine feste, notierte Breite — 1440 ist eine brauchbare Vorgabe, wenn
das Design nichts anderes nahelegt; füllende Knoten hängen daran. Öffne die
Seite mit deinem Browser-Tool und **leg zuerst alle Bewegung still**, sonst
misst du einen Zwischenstand:

```js
const s = document.createElement('style');
s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
document.head.appendChild(s);
document.fonts.ready.then(() => 'bereit')
```

Dann miss am gerenderten Element. Nimm einen Selektor, der genau deine
Komponente trifft; der Block unten meldet die Trefferzahl selbst, damit du nicht
wortlos die erste von fünf Karten misst.

```js
const sel = '<dein-selektor>';
const treffer = document.querySelectorAll(sel);
const el = treffer[0];
const c = el && getComputedStyle(el), r = el && el.getBoundingClientRect();
// Textträger: erstes Element mit eigenem, nicht leerem Textknoten
const tEl = el && [el, ...el.querySelectorAll('*')].find(n =>
  [...n.childNodes].some(k => k.nodeType === 3 && k.textContent.trim()));
const t = tEl && getComputedStyle(tEl);
const kennung = n => n && (n.tagName.toLowerCase() +
  (n.id ? '#' + n.id : '') + (n.className ? '.' + String(n.className).trim().split(/\s+/).join('.') : ''));
!el ? { fehler: `Selektor trifft 0 Elemente: ${sel}` } : ({
  treffer: treffer.length, element: kennung(el), textTraeger: kennung(tEl),
  breite: r.width, hoehe: r.height,
  layoutBreite: el.offsetWidth, layoutHoehe: el.offsetHeight,
  padding: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft],
  // Bei grid ist flexDirection immer "row" — deshalb beide Achsen zeigen.
  gap: [c.columnGap, c.rowGap],
  display: c.display, flexDirection: c.flexDirection,
  radius: [c.borderTopLeftRadius, c.borderTopRightRadius,
           c.borderBottomRightRadius, c.borderBottomLeftRadius],
  rahmenBreiten: [c.borderTopWidth, c.borderRightWidth,
                  c.borderBottomWidth, c.borderLeftWidth],
  rahmenStile: [c.borderTopStyle, c.borderRightStyle,
                c.borderBottomStyle, c.borderLeftStyle],
  rahmenFarben: [c.borderTopColor, c.borderRightColor,
                 c.borderBottomColor, c.borderLeftColor],
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

Der Block kommt ohne Top-Level-`await` aus; kann dein Werkzeug es, warte vor der
Messung zusätzlich auf `document.fonts.ready`.

**Vor jeder Neu-Messung den Cache umgehen.** Ein schlichter Reload liefert dir
sonst die alte CSS, und die Tabelle bleibt unverändert, obwohl du längst
behoben hast — oder sie bleibt sauber, obwohl du gerade etwas zerschossen hast.
Häng einen Cache-Buster an die URL (`?v=<zeitstempel>`) oder erzwing einen
Hard-Reload; verlass dich nicht darauf, dass der Dev-Server das erledigt.

Für den Gap gilt: bei `display: flex` zählt die Achse der `flexDirection`
(`row…` → `columnGap`, sonst `rowGap`), bei `display: grid` beide.

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

### Das Innenleben mitmessen — sonst misst du eine leere Hülle

Bei vielen Knoten trägt die Wurzel gar kein Design: Rahmen, Füllung, Radius und
Innenabstände sitzen im Kind. Misst du nur die Wurzel, melden sechs Zeilen
„Soll unbelegt", obwohl Figma sie belegt — und ein Kind mit knallrotem Rahmen
auf neongrünem Grund erzeugt eine Tabelle, die von der korrekten nicht zu
unterscheiden ist.

Deshalb: **Trägt der Design-Kontext Kind-Elemente mit eigener `data-node-id`
**und** eigenen Kasten-Eigenschaften (`border…`, `bg-…`, `rounded-…`, `p…-`),
fährst du für jedes dieser Kinder dieselbe Messung** — eigener Selektor auf das
gerenderte Gegenstück, eigener Tabellenblock, Textträger-Kniff wie gehabt. Die
Wurzel-Tabelle vermerkt im Kopf „N Kind-Elemente gemessen, s. u.".

Nicht jede Ebene: Blattknoten ohne eigene Kasten-Eigenschaften (Icons, reine
Textknoten) werden nicht einzeln aufgemacht.

## 4. Tabelle

Genau diese Form, genau diese sechs Zustände:

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
| `Kontextgröße (Δ …, füllender Knoten)` | nur Breite/Höhe bei füllend; deckt es sich, `stimmt (füllend — …)` |

Toleranzen:

- **Typografie 0,1 px** (Schriftgröße, Zeilenhöhe, Laufweite) — der Browser
  rechnet sie aus Faktoren und meldet Nachkommastellen.
- **Geometrie 0,5 px** — nur Breite und Höhe, und nur bei fester Größe; die
  kommen aus `getBoundingClientRect` und runden auf Gerätepixel.
- **Innenabstände, Gap, Radius, Rahmenbreite: 0** — die stehen exakt im CSS.
  Bei der Rahmenbreite steht am meisten auf dem Spiel: ihr Werteraum ist
  0/1/2 px, jede Nachsicht winkt einen um 50 % zu dicken Rahmen durch.
- **Farben: 0**, auch im Alphakanal.
- **Hug-Knoten, Breite und Höhe: Richtwert.** Bemisst sich der Knoten nach
  seinem Inhalt (Erkennung siehe Schritt 2), stammt das Soll aus Figmas eigener
  Textmessung. Eine Differenz von wenigen Pixeln ist dann Font-Rendering, kein
  Baufehler. Zustand `Richtwert (Δ …, Hug-Knoten)` — die Zeile wird gezeigt,
  löst aber keine Arbeit aus; das gilt auch bei `Δ 0px`, der Zustand bleibt dann
  `Richtwert (Δ 0px)` und wird nicht zu `stimmt`. Ohne diese Regel „behebst" du
  eine Font-Rendering-Differenz — genau das, was der Loop nicht tun soll.
  **Ausnahme:** Übersteigt die Differenz **2 % der Soll-Größe derselben Achse
  UND 3 px** (Breite gegen Sollbreite, Höhe gegen Sollhöhe), kommt sie nicht
  mehr aus dem Textsatz. Dann ist der Zustand `weicht ab` und die Zeile löst
  Arbeit aus wie jede andere. Beide Schwellen müssen fallen: 2 % von 67 px sind
  1,3 px und liegen unter der normalen Drift zwischen Figmas und Chromes
  Textmetrik — allein gälte die Regel genau dort, wo sie schützen soll.
  Ein zu dicker Rahmen im Kind rutscht hier nicht durch: die Kind-Messung aus
  Schritt 3 zeigt ihn an seiner eigenen Rahmenzeile mit Toleranz 0.

Schreib in den Kopf der Tabelle, was du gemessen hast: Knoten-ID, URL,
Selektor und wie viele Elemente er trifft, gewähltes Element, Textträger,
Viewport und `devicePixelRatio` (die 0,5-px-Toleranz hängt daran), und wie viele
Kind-Elemente du zusätzlich gemessen hast. Meldet dein Browser-Tool `0 × 0`,
schreib „Viewport nicht gemeldet" — nicht die 0.

Zeilen, deren Wert du nach Technik A (siehe Fallstricke) selbst aus den
Metadaten gesetzt hast, tragen den Vermerk `durch Technik A festgesetzt`. Sie
bestätigen sonst nur sich selbst.

## 5. Abarbeiten

Nur **`weicht ab`** löst Arbeit aus. Beheben, dann **neu messen** — nicht die
alte Tabelle fortschreiben. Wiederholen, bis keine Zeile mehr abweicht, höchstens
aber drei Runden — **hier wird gezählt, und nur hier**: bleibt danach etwas
offen, hör auf zu drehen und leg die Zeilen mit deiner Diagnose vor. Was du
nicht sauber bekommst, ohne gegen das Design zu verbiegen, bleibt stehen und
wird benannt.

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
  keine Zeile). Zwei Techniken sind legitim, such dir eine aus — **ein
  schlichtes `border` ohne eine davon verfehlt die Kastenmaße um 2 × Rahmen**,
  und an einem Hug-Knoten kann die Richtwert-Nachsicht genau das schlucken. Wer
  pur baut, tut es also wissentlich:
  - **Technik A, nur bei fester Größe:** `border` behalten **und** die Größe
    explizit setzen (`height`/`width` aus den Metadaten) **mit**
    `box-sizing: border-box`. Alle Rahmenzeilen messen sich normal;
    Innenabstände bleiben die aus dem Design-Kontext. Bei einem **Hug**-Knoten
    ist sie verboten, soweit sie die Breite betrifft: eine feste `width` nagelt
    fest, was hugen soll, und späterer Text verschwindet lautlos unter
    `overflow-clip`. Am Hug-Knoten höchstens `height` festsetzen, nie `width`.
  - **Technik B, immer erlaubt und bei Hug die einzige für die Breite:**
    `box-shadow: inset 0 0 0 1px <farbe>` statt `border`. Dann ist
    `borderTopWidth` echt `0px` — **nicht** als Abweichung melden, sondern
    Rahmenbreite und -farbe aus dem `boxShadow`-Wert lesen und die Zeilen mit
    dem Vermerk „aus inset box-shadow" führen. Ein Shadow trägt keinen Stil:
    der **Rahmenstil gilt bei dieser Technik als `solid`**. Das ist eine
    gemessene Tatsache, keine Nachsicht.

  Was du **nicht** tust: Innenabstände gegen das Design verkleinern, um die Höhe
  zu retten. Das verschiebt den Text und die Tabelle merkt es nicht.
- **Innenabstände nach Spezifität:** `pt-` schlägt `py-`, `py-` schlägt `p-` —
  unabhängig von der Reihenfolge der Klassen.
- **`gap-x` und `gap-y` verschieden:** dann hängt der geltende Wert von der
  Layout-Richtung ab, die der Kontext nicht nennt → Lücke, nicht raten.
- **Füllender Knoten:** erkannt **nur in der Kind-Ansicht** — dieselben Klassen
  an der gezogenen Wurzel sind Boilerplate und bedeuten nichts. Einstufung und
  Zustand (`stimmt (füllend — …)` bzw. `Kontextgröße (Δ …)`) stehen in Schritt 2.
- **Zeilenhöhe einheitenlos:** in einer Klasse (`leading-[1.4]`, `leading-none`)
  und im `Font(…)`-Block ist die nackte Zahl ein **Faktor** × Schriftgröße —
  so schreibt CSS es auch. Nur ein *Token*, der zu einer nackten Zahl auflöst
  (`"24"`), ist unentscheidbar: Figma-Token sind grundsätzlich einheitenlos,
  das kann ebenso 24px meinen → Lücke, kein Produkt.
- **`leading-[0]`** an einem Wrapper ist ein Figma-Artefakt; die echte
  Zeilenhöhe steht im `Font(…)`-Block oder am inneren Textelement.
- **Rahmen ohne Klammern sind lesbar:** `border` allein heißt **1 px** (der
  häufigste Generator-Output für einen 1-px-Stroke), `border-<n>` heißt **n px**
  — `border-10` ist ein 10-px-Rahmen und wird gemessen. Behandelst du das als
  Lücke, läuft ein zu dicker Rahmen ungemessen durch und die Tabelle meldet ein
  Falsch-Bestanden.
- **`p-<n>`, `gap-<n>`, `rounded-<n>` ohne Klammern: Lücke.** Der Generator
  schreibt diese Werte durchgängig arbiträr (`gap-[20px]`, nicht `gap-5`), es
  gibt also keine Evidenz, was eine klammerlose Form bedeuten soll — und die
  einzige verfügbare Semantik spricht dagegen: in Tailwind ist `p-4` gleich
  16 px, nicht 4 px. Als „n Pixel" gelesen misst du gegen ein um Faktor 4
  falsches Soll und reparierst eine korrekte Komponente kaputt. Lücke, mit
  genau dieser Begründung und der Klasse im Grund.
- **Zwei `border-[…]`-Klassen:** eine ist die Breite, eine die Farbe. Ordne
  nach dem aufgelösten Wert zu, nicht nach der Reihenfolge.
