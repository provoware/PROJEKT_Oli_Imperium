# Projekt C – echte Tastatursteuerung des Bohr-Minispiels (26.10.2026)

## Ausgangslage und Trennung
- Repository: `provoware/PROJEKT_Oli_Imperium`.
- Hauptzweig bei Vorpruefung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Entwicklungsbasis: [Entwurfs-PR #68](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/68), HEAD `a213f6b41f65644c05ef5cee1a622df7ce182800`.
- Bestehende CI auf dieser Basis: Chromium #40388761002 PASS, Quellpruefung #40388760695 PASS, technische Gesamtmatrix #40388760809 BLOCKED.
- Die unabhaengige Dokumentations-PR #69 wird nicht veraendert oder uebernommen.

## Pflichtpaket und Risiko
Betroffen: BED-02 (Tastatur aller Pflichtaktionen), BAR-01 (sichtbarer Fokus), VER-03 (Speicherung/Fortsetzung, nur Teilbeleg). Der bisherige Szenentest prueft das Schliessen aller 39 Dialoge, nicht die eigentlichen Minispielaktionen. Der neue Test schliesst gezielt die Luecke fuer das dreistufige Bohr-Minispiel.

Das Skript `quality_v194/test_browser_keyboard_drill_v194.py` erzeugt die Vorschau aus 110 hashgeprueften Quellen in einem nur temporaeren Verzeichnis. Die geschuetzten Originale, echte Spielstaende und `main` werden nicht veraendert. Zwei Browsergroessen: 800x600 und CSS-Viewport 400x300 (nur Annäherung an 200 %, kein nativer Browserzoom).

## Testvertrag
1. Spielstart und Neugruendung mit Tab und Enter.
2. Gutachten, Feldkauf und Start des Bohr-Minispiels mit Tab und Enter; Szenenwahl erfolgt ueber die bestehende Navigationsschnittstelle.
3. Drei Bohrabschnitte: Schieberegler mit Tab erreichen, mit Home auf 0 setzen, Zielwert ausschliesslich mit echten Pfeil-rechts-Ereignissen einstellen, mit Tab/Enter bestaetigen.
4. Nach jedem Abschnitt Wirtschaftszustand validieren; nach Abschnitt 3 regulaeren Abschluss und gebohrtes Feld pruefen.
5. Dialog per Tab/Enter schliessen, Spielstand per Tab/Enter als JSON exportieren und auf exakte Gleichheit mit dem gueltigen Zustand pruefen.
6. JavaScript-Fehler und externe HTTP-Anfragen verbieten.

Befehl: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_keyboard_drill_v194.py`

## Vorlaeufiger Status
**PENDING / NICHT ALS PASS GEWERTET:** Nachweis erst durch tatsaechliche Ausfuehrung der neuen GitHub-Browser-CI. Unabhaengig davon bleiben Rohrnetz- und Feuerwehr-Minispiel, vollstaendige Dialogaktionen, Fokuskontrast, nativer Browserzoom und regulaeres Spielende offen. Vorrelease-Matrix bis zu einem nachgewiesenen technischen Vollabschluss unveraendert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.

**Naechste Umsetzung:** (1) CI-Ergebnis des neuen Tests kontrollieren und Defekte korrigieren; (2) Rohrnetz und Feuerwehr ebenfalls mit echten Tasten abdecken; (3) nativen Zoom und Fokuskontraste getrennt pruefen. Keine Zusammenfuehrung, kein Release und keine persoenliche Endabnahme.

## CI-Zwischenbefund und gezielte Reparatur
- [Chromium #40396918957](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40396918957): **FAIL** im bestehenden 39-Szenen-Tastaturtest bei CSS-175, Schritt Alt+Links. Der neue Bohrtest wurde dadurch **SKIPPED**; keine Aussage zu dessen Funktion.
- Ursache nach Quellpruefung: Das native `dialog.close`-Ereignis wird spaeter zugestellt als die direkte Pruefung von `dialog.open`. Der Navigations-Handler leert bei `close` die Historie; dadurch kann ein verspaetetes Ereignis die unmittelbar danach neu aufgebaute Zurueck-Historie loeschen.
- Gezielter Fix: Der bestehende Szenentest wartet jetzt nach jedem Schliessen auf die tatsaechliche Zustellung des nativen `close`-Ereignisses. Keine Aenderung am Spielkern. Das ist eine Test-Synchronisation, keine Behauptung, dass die Bedienung in jedem realen Browser bereits perfekt ist.
- [Quell-/Fach-CI #40396918729](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40396918729): **PASS** auf dem vorherigen Entwicklungs-HEAD. [Gesamtmatrix #40396918897](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40396918897): **BLOCKED** wie vorgesehen.
- Nach dem Reparatur-Commit muessen die Pruefungen auf dem neuen HEAD erneut ausgefuehrt werden. **Noch kein finaler PASS.**
