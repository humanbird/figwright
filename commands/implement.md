---
description: Einen Figma-Knoten als Komponente im Projekt bauen und anschließend gegen den Knoten messen.
argument-hint: <figma-link mit node-id>
---

Baue den Figma-Knoten `$ARGUMENTS` als Komponente in diesem Projekt.

Ohne `node-id` im Link geht es nicht weiter — dann frag nach einem knotengenauen Link.

## 1. Design ziehen

Hol über deinen Figma-MCP für genau diesen Knoten:

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
- Der zurückgegebene React-/Tailwind-Code ist Referenz, keine Vorlage zum
  Einfügen. Übersetze ihn in den Stack dieses Projekts.
- Icons und Bilder aus den gelieferten Asset-URLs übernehmen, nie selbst malen.

## 3. Messen

Fahr direkt danach `/verify $ARGUMENTS` und arbeite die Abweichungen ab.

Berichte am Ende: geänderte Dateien, welche Projekt-Tokens auf welche
Figma-Tokens gehen, und was aus der Soll/Ist-Tabelle offen geblieben ist.
