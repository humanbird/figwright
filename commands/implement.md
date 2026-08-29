---
description: Einen Figma-Knoten als Komponente im Projekt bauen und anschließend gegen den Knoten messen.
argument-hint: <figma-link mit node-id>
---

Baue den Figma-Knoten `$ARGUMENTS` als Komponente in diesem Projekt.

Ohne `node-id` im Link geht es nicht weiter — dann frag nach einem knotengenauen Link.

## 1. Design ziehen

`get_design_context` verlangt laut eigenem Tool-Vertrag, dass du zuvor die
`figma-design-to-code`-Guidance lädst (Skill oder MCP-Resource). Lade sie —
sonst brichst du den Vertrag des Tools, das du gleich aufrufst.

Dann hol über deinen Figma-MCP für genau diesen Knoten:

- `get_design_context` — Referenzcode, Screenshot, Hinweise
- `get_variable_defs` — die Tokenwerte des Knotens
- `get_metadata` — die gerenderte Breite und Höhe des Knotens

Sieh dir den Screenshot an. Er entscheidet über die Absicht, wo der Code
mehrdeutig ist. Prüf am Namen und an den `data-node-id`-Attributen, dass die
Antwort wirklich den verlinkten Knoten zeigt und nicht seinen Eltern- oder
Nachbarknoten.

## 2. Erst das Projekt lesen, dann bauen

Bevor du eine Zeile schreibst:

- Welche Komponenten gibt es hier schon, die den Zweck erfüllen?
- Welches Token-System nutzt das Projekt (CSS-Variablen, Tailwind-Theme, SCSS)?
- Wie heißen Dateien, wie sind Komponenten aufgebaut?

Dann bauen:

- **Tokens des Projekts benutzen, nichts erfinden.** Zu jedem Figma-Token gehört
  ein Projekt-Token. Findest du keins, nimm den rohen Wert und sag im Bericht
  ausdrücklich, welcher Wert ohne Token geblieben ist — schweig es nicht weg.
- **Greenfield:** Gibt es noch gar keine Tokenschicht, leg eine an — das ist
  erlaubt und erwünscht, mit den Namen und Werten aus `get_variable_defs`.
  „Nichts erfinden" verbietet ausgedachte *Werte*, nicht die Schicht, die die
  echten Figma-Werte trägt. Berichte sie als neu angelegt.
- Der zurückgegebene React-/Tailwind-Code ist Referenz, keine Vorlage zum
  Einfügen. Übersetze ihn in den Stack dieses Projekts.
- Icons und Bilder aus den gelieferten Asset-URLs übernehmen, nie selbst malen.

## 3. Renderstelle — gehört zum Auftrag

`/verify` misst im echten Browser. Also lieferst **du** die Stelle mit, an der
die Komponente rendert: Dev-Server (fester, freier Port), eine Demo-Seite, die
genau diese Komponente zeigt, und die Schrift des Designs real eingebunden —
ohne sie misst `/verify` Fallback-Metriken und meldet Unsinn. Das ist kein
Nebenprodukt, sondern Teil der Lieferung.

Läuft die URL nicht, brich hier ab und sag warum. Rate nicht weiter.

## 4. Messen

Fahr direkt danach `/verify $ARGUMENTS` und arbeite die Abweichungen ab.
**Ohne durchlaufenen Verify ist `/implement` nicht fertig** — eine gebaute, aber
ungemessene Komponente wird nicht als erledigt gemeldet.

Kommst du nach drei Runden nicht auf null Abweichungen, hör auf zu drehen und
leg die verbleibenden Zeilen mit deiner Diagnose vor. Zeig die letzte Tabelle
vollständig; von den Zwischenrunden genügt, was sich geändert hat.

Berichte am Ende: geänderte Dateien, welche Projekt-Tokens auf welche
Figma-Tokens gehen, die Renderstelle (URL und wie man sie startet), und was aus
der Soll/Ist-Tabelle offen geblieben ist.
