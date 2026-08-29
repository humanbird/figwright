# sollwert

Zwei Slash-Commands, die eine gebaute Komponente im echten Browser
property-genau gegen ihren Figma-Knoten messen.

Figma-MCP und ein Screenshot-Loop bringen dich auf „sieht ungefähr gleich aus".
sollwert sagt dir: `font-size` ist 15 statt 16 — Zeile für Zeile, mit Zahlen.

Kein Code, keine Abhängigkeiten, keine Tokens, keine Konfiguration. Das ganze
Werkzeug sind zwei Markdown-Dateien: der Agent zieht das Soll über seinen
Figma-MCP und misst das Ist mit seinen eigenen Browser-Tools.

## Drei Schritte

1. **Figma-MCP** verbinden (Dev-Mode-MCP der Figma-App) **und ein Browser-Werkzeug,
   das JavaScript auf der Seite auswerten kann** (etwa der Chrome-DevTools-MCP).
   Ohne dieses Werkzeug kann `/sollwert:verify` nicht messen.
2. Plugin installieren:
   ```
   /plugin marketplace add humanbird/sollwert
   /plugin install sollwert@sollwert
   ```
   — oder ohne Plugin: `commands/implement.md` und `commands/verify.md` nach
   `.claude/commands/` im Projekt kopieren (dann heißen sie `/implement` und
   `/verify`).
3. `/sollwert:implement <figma-link mit node-id>`

`/sollwert:implement` baut die Komponente aus dem Figma-Knoten mit den Tokens
des Projekts und fährt danach `/sollwert:verify`. Das misst und legt die
Tabelle vor.

## Die Tabelle

```
| Eigenschaft   | Soll    | Ist           | Zustand                                         |
| ------------- | ------- | ------------- | ----------------------------------------------- |
| Breite        | 68px    | 67.953px      | stimmt                                          |
| Abstand (Gap) | 8px     | 10px (Δ +2px) | weicht ab                                       |
| Rahmenbreite  | —       | 0px           | Soll unbelegt (kein border-… im Design-Kontext) |
| Schriftgröße  | 16px    | —             | nicht messbar (kein Textknoten im Element)      |
```

| Zustand | Bedeutung |
| --- | --- |
| **stimmt** | Soll und Ist decken sich innerhalb der Toleranz. |
| **weicht ab** | Beide Werte liegen vor und unterscheiden sich. Das Einzige, was Arbeit auslöst. |
| **Soll unbelegt (Grund)** | Figma gibt dazu nichts her. **Kein Fehler** — nicht raten, nicht anpassen. |
| **nicht messbar (Grund)** | Die Seite gibt den Wert nicht her — meist das falsche Element. Selektor schärfen. |
| **Richtwert (Hug-Knoten)** | Breite/Höhe ohne feste Größe stammen aus Figmas eigener Textmessung. Wird gezeigt, löst keine Arbeit aus. |

Toleranzen: Typografie 0,1 px; Breite/Höhe 0,5 px (Gerätepixel-Rundung);
Innenabstände, Gap, Radius und Rahmenbreite 0; Farben 0, auch im Alphakanal.

Kein PASS, kein FAIL. Die Tabelle ist der Befund — was davon behoben werden
muss, entscheidet, wer die Komponente baut.

## Lizenz

MIT
