# Fliesstext und dynamische Phasen bei echtem Browserzoom – 27.10.2026

**Spiel:** PPPOPPI IMPERIUM, V1.9.3-Spielkern in isolierter V1.9.4-Technikvorschau. **Kein Release.**

**Basis:** [Entwurfs-PR #82](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/82) bei `a81cd25bbef9f11fdf992cd1760d0742aa78cbd6`. [Neuer Entwurfs-PR #83](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/83), nur auf getrenntem Zweig. `main` war bei Beginn `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Technische Luecke und Umsetzung

Die vorangegangene Pruefung kontrollierte Ueberschriften und Tabellenzellen, nicht die eigentlichen Fliesstexte. Das neue Programm `quality_v194/test_browser_native_zoom_flow_v194.py` kontrolliert deshalb die Textarten `p`, `li`, `label`, `blockquote`, `figcaption` in allen registrierten Spielszenen, nach zwei regulären Wirtschaftsmonaten sowie in dynamischen Rohrnetz-/Feuerwehr-Phasen.

Pro Phase werden zwei um 100 ms getrennte Momentaufnahmen erstellt. Messung: echte Chromium-Zoomstufen 175 und 200 % per `chrome.tabs.setZoom/getZoom`, Ausgangsfenster 800 × 600, Textrechtecke per `Range.getClientRects`, Sichtbarkeit per `elementFromPoint`, Abschneidung bei `overflow:hidden/clip`. Der Test erzeugt absichtlich eine Textueberdeckung und eine Abschneidung als Negativkontrollen. Die Minispielaktionen erfolgen per Tab/Enter; Szenenwahl ueber die vorhandene Programmschnittstelle. Wirtschaftszustand, JavaScript-Fehler und externe Netzwerkanfragen werden kontrolliert.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_flow_v194.py`.

## Nachweisstand

- **Implementierung:** neuer Python-Browsertest und CI-Schritt auf PR #83; Browser-CI und Fach-/Quellpruefung noch auszuwerten.
- **PASS/FAIL/BLOCKED:** Bis zum bestaetigten CI-Abschluss **BLOCKED (Pruefung ausstehend)**. Es wird kein PASS vorweggenommen.
- **Originalquellen:** Die 110 manifestgeschuetzten Quelldateien sind nicht Teil der Aenderung; der Aufbau prueft ihre Hashes.
- **Freigabe:** BED-03 und BAR-01 bleiben **BLOCKED**, selbst wenn der gezielte Test spaeter PASS ergibt.

## Grenzen und Folgearbeiten

Zwei Momentaufnahmen pruefen **keine vollstaendige Animation**. Nicht erfasst werden unter anderem einzelne Textknoten ohne die genannten Elemente, Pixelunterschiede, wechselnde Schriften, teilweise Ueberdeckung innerhalb einer Zeile, alle Dialogaktionen und regulaere Endpartien. Laufende Animationen werden nur gezaehlt, nicht durchgaengig verfolgt.

1. CI-Ergebnis des neuen Tests auswerten, nachgewiesene Fehler beheben und echte Zaehler als Teilnachweis in der Pflichtmatrix eintragen.
2. Verbleibende Dialogaktionen und Fehlerpfade bei echtem Zoom per Tastatur abarbeiten.
3. Regulaere Sieg-/Niederlagenpartien mit Speicher- und Neustartkontrollen absichern.

**Keine persoenliche Sicht- oder Kubuntu-Endabnahme vor technischem Abschluss und eingefrorenem Kandidaten. Kein Merge, kein Release.**
