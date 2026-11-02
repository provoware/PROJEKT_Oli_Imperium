# Projekt C – Fokuskontrast unter echtem Browserzoom (27.10.2026)

## Ausgangsbefund und gezielte Korrektur

Der neue Chromium-Test auf Commit `fab7856bc7d78159ee43061f9d12145ae770898a` deckte einen echten Tastatur-Fokusmangel auf: bei **175 %** in **9 von 451** erreichten Dialogelementen (jeweils `select`) betrug die berechnete Outline-Breite nur **0,571429 CSS-Pixel** und der Kontrast zum naechsten deckenden Dialoghintergrund **1,176:1**. Alle 451 Elemente waren per Tab erreichbar, aber die neun Fokusmarkierungen erfuellten die technische 3:1-Kontrastschwelle nicht. [Erster Browserlauf #40456568368](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40456568368): **FAIL – berechtigter neuer Befund**.

Die Korrektur liegt **nur im isolierten Technikaufbau** (`quality_v194/build.cjs`): `#dialog select:focus-visible { outline: 3px solid #ffda8d; outline-offset: 3px; }`. Sie wird in die erzeugte `index.html` eingefuegt. Die 110 manifestgeschuetzten Spieloriginale bleiben byteidentisch. Eine zusaetzliche statische Regression kontrolliert, dass das Original kein solches CSS enthaelt.

## Nachpruefung auf dem korrigierten Implementierungsstand

[Chromium #40456804550](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40456804550) **PASS**, [Quell-/Fachpruefung #40456804591](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40456804591) **PASS**, [integrierte Release-Sperre #40456804536](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40456804536) **BLOCKED** (korrekt, andere Pflichten offen). Gepruefter Implementierungs-HEAD: `55a7359da8986233992956f58296abe6f08117dc`.

| Echter Chromium-Tab-Zoom | Spielszenen | Tab-Elemente | Erreicht | Ohne Fokusmarkierung | Unter 3:1 | Ungeklaerte Hintergruende | Niedrigster berechneter Kontrast |
|---|---:|---:|---:|---:|---:|---:|---:|
| 175 % | 39 | 452 | 452 | 0 | 0 | 0 | 6,90:1 |
| 200 % | 39 | 451 | 451 | 0 | 0 | 0 | 6,90:1 |
| **Gesamt** | **78 Szenenpruefungen** | **903** | **903** | **0** | **0** | **0** | **6,90:1** |

Testbefehl: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_focus_contrast_v194.py`.

Der Test verwendet echten Tab-Zoom per `chrome.tabs.setZoom/getZoom`, reale Tab-Tasten, berechnete CSS-Outline-Farben und die WCAG-Formel fuer relative Luminanz. Er vergleicht die Outline mit dem naechsten deckenden Hintergrund beziehungsweise konservativ mit allen berechenbaren Farbstopps eines Gradienten. Nicht sicher berechenbare Hintergruende werden **UNGEKLAERT**, nicht PASS. Spielstand vor/nach der reinen Tab-Navigation identisch; keine externen HTTP-Anfragen oder JavaScript-Fehler.

## Abgrenzung / offene Pflichten

Die Messung ist eine **technische CSS-Kontrastpruefung**, keine pixelbasierte visuelle Endabnahme und kein Nachweis gegen alle moeglichen Ueberlagerungen. Szenen wurden programmatisch geoeffnet; **nicht alle Dialogaktionen** wurden per Tastatur ausgefuehrt. Dynamische Zwischenbilder, komplexe Fokusfolgen und vollstaendige Sieg-/Niederlagenpartien bleiben offen. Deshalb **BAR-01 und BED-03 weiterhin BLOCKED**, Vorrelease weiterhin **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED**. Kein Merge/Release; persoenliche Abnahme erst nach technischer Kandidaten-Fixierung.

Naechstes Pflichtpaket: (1) dynamische Ueberdeckungen bei 175/200 % mit Rechteck-/Trefferpruefung messen; (2) verbleibende Dialogaktionen und Fehlpfade per echter Tastatur pruefen; (3) Endzustands-/Sieg-/Verlustregeln und Langzeitpartien absichern.
