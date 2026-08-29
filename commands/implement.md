---
description: Einen Figma-Knoten als Komponente im Projekt bauen und anschließend gegen den Knoten messen.
argument-hint: <figma-link mit node-id>
---

Baue den Figma-Knoten `$ARGUMENTS` als Komponente in diesem Projekt.

Ohne `node-id` im Link geht es nicht weiter — dann frag nach einem knotengenauen Link.

## 1. Design ziehen

`get_design_context` verlangt laut eigenem Tool-Vertrag, dass du zuvor die
`figma-design-to-code`-Guidance lädst (Skill oder MCP-Resource). Lade sie und
folge ihr — sie regelt das Ziehen, Lesen und Übersetzen des Design-Kontexts,
und das wird hier nicht wiederholt.

Zusätzlich zu `get_design_context` brauchst du für die spätere Messung
`get_variable_defs` (Tokenwerte) und `get_metadata` (Breite/Höhe des Knotens).

## 2. Bauen — was sollwert zusätzlich verlangt

- **Tokens des Projekts benutzen, nichts erfinden.** Zu jedem Figma-Token gehört
  ein Projekt-Token. Findest du keins, nimm den rohen Wert und sag im Bericht
  ausdrücklich, welcher Wert ohne Token geblieben ist — schweig es nicht weg.
- **Greenfield:** Gibt es noch gar keine Tokenschicht, leg eine an — das ist
  erlaubt und erwünscht, mit den Namen und Werten aus `get_variable_defs`.
  „Nichts erfinden" verbietet ausgedachte *Werte*, nicht die Schicht, die die
  echten Figma-Werte trägt. Berichte sie als neu angelegt.

## 3. Renderstelle — gehört zum Auftrag

`/sollwert:verify` misst im echten Browser. Also lieferst **du** die Stelle mit,
an der die Komponente rendert: eine erreichbare URL auf einem laufenden
Dev-Server, und die Schrift des Designs real eingebunden — ohne sie werden
Fallback-Metriken gemessen und die Tabelle meldet Unsinn.

Gibt es schon eine Route, eine Story oder eine Sandbox, die die Komponente
zeigt, nimm die; eine eigene Demo-Seite legst du nur an, wenn nichts davon
existiert. Das ist kein Nebenprodukt, sondern Teil der Lieferung.

Läuft die URL nicht, brich hier ab und sag warum. Rate nicht weiter.

## 4. Messen

Fahr direkt danach `/sollwert:verify $ARGUMENTS` und arbeite die Abweichungen
ab. **Ohne durchlaufenen Verify ist `/sollwert:implement` nicht fertig** — eine
gebaute, aber ungemessene Komponente wird nicht als erledigt gemeldet.

Kommst du nach drei Runden nicht auf null Abweichungen, hör auf zu drehen und
leg die verbleibenden Zeilen mit deiner Diagnose vor. Zeig die letzte Tabelle
vollständig; von den Zwischenrunden genügt, was sich geändert hat.

Berichte am Ende: geänderte Dateien, welche Projekt-Tokens auf welche
Figma-Tokens gehen, die Renderstelle (URL und wie man sie startet), und was aus
der Soll/Ist-Tabelle offen geblieben ist.
