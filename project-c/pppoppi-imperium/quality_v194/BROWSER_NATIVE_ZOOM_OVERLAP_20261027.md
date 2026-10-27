# Projekt C – Tastatur-Treffbarkeit bei echtem Browserzoom (27.10.2026)

## Ziel

Die vorherige Fokus-Kontrastpruefung (PR #79) hat 903 per Tab erreichbare Elemente bei 175/200 % und einen berechneten Mindestkontrast von 6,90:1 nachgewiesen. Das beweist nicht, dass die fokussierten Elemente auch sichtbar und mit dem Zeiger erreichbar sind. Der neue Test ergaenzt deshalb fuer jedes fokussierte Element fuenf Trefferpunkte mit `document.elementFromPoint`; nur das Ziel selbst oder ein Nachfahre zaehlt. Eine absichtlich eingebaute Vollbild-Ueberdeckung wird als Negativkontrolle erkannt. Unbekannte Kontrasthintergruende fuehren nun ebenfalls zu FAIL statt zu einer stillschweigenden Freigabe.

## Echte CI-Ergebnisse – Erstlauf

- **Implementierungs-HEAD:** `1385055ff2b9fa33a9045be6140c820ff86da16c`.
- **[Chromium #40461751589](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461751589): FAIL** – der neue Test hat bei 175 % **4 nicht treffbare Elemente unter 452** gefunden; 452/452 per Tab erreicht, 0 fehlende Fokusringe, 0 Kontraste unter 3:1 und 0 unbekannte Hintergruende. Betroffen: Szene `phone` (2 Knoepfe), `quick` (1 Knopf), `factory` (1 Knopf). 200 % wurde wegen des berechtigten Fehlers noch nicht erreicht.
- **[Quellworkflow #40461752478](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461752478):** gesondert pruefen; der Browserfehler ist kein Quellhash-Fehler.
- **[Vorrelease-Sperre #40461751530](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461751530):** bleibt gesperrt, keine Gesamtfreigabe.

Die vier Funde sind **technische Treffbarkeitsbefunde**, noch keine bewiesenen CSS-Ueberdeckungsursachen. Ein ausserhalb des Viewports liegendes Ziel oder eine klebende Dialog-Kopfzeile kann denselben Befund erzeugen. Es wurde weder die Spieloberflaeche nachgebessert noch eine Ursache behauptet.

## Nachfolgende Diagnose und naechste Arbeit

- **Diagnose-Commit:** `c59fb328e4c381646229df3e9475197c662abc8e`. Er protokolliert bei Fehlschlaegen Elementtext, Rechteck, CSS-Viewport, oberstes Element am Mittelpunkt und Dialog-Scrollposition. CI: [#40461958332](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461958332). Das Ergebnis ist erst nach abgeschlossenem Lauf zu bewerten.
- Anschliessend die vier Treffer auf echte Ueberdeckung, Tastatur-Scrollfehler oder Messartefakt untersuchen; nur nachgewiesene Ursache minimal im isolierten Technikaufbau beheben.
- Danach 175 % **und** 200 % erneut ausfuehren, die dynamischen Zwischenbilder der drei Minispiele gesondert erfassen und die restlichen Dialogaktionen testen.

**Abgrenzung:** Dieser Fuenfpunkt-Test misst nur aktive Bedienelemente der programmatisch geoeffneten 39 Szenen, nicht alle Textueberlagerungen, Animationen, Spielendzustände oder die persoenliche Sichtpruefung. **BAR-01/BED-03 bleiben BLOCKED. 6/52 technische Pflichten PASS. Kein Merge, kein Release.**
