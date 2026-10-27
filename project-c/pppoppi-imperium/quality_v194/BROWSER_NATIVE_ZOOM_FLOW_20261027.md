# Fliesstext und dynamische Phasen bei echtem Browserzoom – 27.10.2026

**Spiel:** PPPOPPI IMPERIUM, V1.9.3-Spielkern in isolierter V1.9.4-Technikvorschau. **Kein Release.**

**Basis:** [Entwurfs-PR #82](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/82) bei `a81cd25bbef9f11fdf992cd1760d0742aa78cbd6`. [Neuer Entwurfs-PR #83](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/83), nur auf getrenntem Zweig. `main` war bei Beginn `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Technische Luecke und Umsetzung

Die vorangegangene Pruefung kontrollierte Ueberschriften und Tabellenzellen, nicht die eigentlichen Fliesstexte. Das neue Programm `quality_v194/test_browser_native_zoom_flow_v194.py` kontrolliert deshalb die Textarten `p`, `li`, `label`, `blockquote`, `figcaption` in allen registrierten Spielszenen, nach zwei regulären Wirtschaftsmonaten sowie in dynamischen Rohrnetz-/Feuerwehr-Phasen.

Pro Phase werden zwei um 100 ms getrennte Momentaufnahmen erstellt. Messung: echte Chromium-Zoomstufen 175 und 200 % per `chrome.tabs.setZoom/getZoom`, Ausgangsfenster 800 × 600, Textrechtecke per `Range.getClientRects`, Sichtbarkeit per `elementFromPoint`, Abschneidung bei `overflow:hidden/clip`. Der Test erzeugt absichtlich eine Textueberdeckung und eine Abschneidung als Negativkontrollen. Die Minispielaktionen erfolgen per Tab/Enter; Szenenwahl ueber die vorhandene Programmschnittstelle. Wirtschaftszustand, JavaScript-Fehler und externe Netzwerkanfragen werden kontrolliert.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_flow_v194.py`.

## Tatsächlich ausgeführte Prüfungen (Chromium)

- [Browser-CI #40481736341](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40481736341): **PASS** auf `1e964e892fce09f2b6330387b9fcf89dc00ea154`.
- [Quell-/Fachprüfung #40481736421](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40481736421): **PASS**.
- [Pflichtmatrix #40481736348](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40481736348): **SCHEMA PASS**, technisches Gesamtgate erwartungsgemäß **BLOCKED**.
- **175 %:** 39 Szenen, 98 zeitlich getrennte Phasen-Momentaufnahmen, 312 gemessene Fliesstextstellen, 191 Beobachtungen laufender Animationen, 0 erkannte Abschneidungen, 0 vollstaendige Ueberdeckungen, 0 unmessbare Textstellen.
- **200 %:** 39 Szenen, 98 Phasen-Momentaufnahmen, 312 gemessene Fliesstextstellen, 194 Beobachtungen laufender Animationen, ebenfalls 0 erkannte Abschneidungen/Ueberdeckungen/unmessbare Stellen.
- **Negativkontrollen:** Absichtliche Textueberdeckung und absichtliches Abschneiden wurden beide erkannt. Offlinebetrieb und Gueltigkeit der Wirtschaftszustaende bestanden.
- **Geltungsbereich:** 312 sind Messungen von Textstellen ueber mehrere Phasen, keine 312 unabhaengigen Funktionen. Animationsbeobachtungen sind keine vollstaendige Animationspruefung. Originalquellen unveraendert.

**Teilnachweis:** `prerelease/evidence/BED-03-FLOW-DYNAMIC-PARTIAL-20261027.json`. BED-03/BAR-01 bleiben **BLOCKED**; keine technische oder persoenliche Gesamtfreigabe.

## Grenzen und Folgearbeiten

Zwei Momentaufnahmen pruefen **keine vollstaendige Animation**. Nicht erfasst werden unter anderem einzelne Textknoten ohne die genannten Elemente, Pixelunterschiede, wechselnde Schriften, teilweise Ueberdeckung innerhalb einer Zeile, alle Dialogaktionen und regulaere Endpartien. Laufende Animationen werden nur gezaehlt, nicht durchgaengig verfolgt.

1. Weitere Animationsphasen und teilweise Textueberdeckungen in Bewegung gezielt nachpruefen.
2. Verbleibende Dialogaktionen und Fehlerpfade bei echtem Zoom per Tastatur abarbeiten.
3. Regulaere Sieg-/Niederlagenpartien mit Speicher- und Neustartkontrollen absichern.

**Keine persoenliche Sicht- oder Kubuntu-Endabnahme vor technischem Abschluss und eingefrorenem Kandidaten. Kein Merge, kein Release.**
