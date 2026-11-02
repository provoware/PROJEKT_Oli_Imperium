# Echtes Chromium-Zoom: 39 Spielszenen bei 175 und 200 % (27.10.2026)

## Gegenstand
Getrennter Entwicklungszweig `agent/prerelease-c-native-zoom-all-scenes-20261027-0338`, auf [PR #75](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/75) gestapelt. [Entwurfs-PR #76](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/76). Implementierungs-HEAD `b330c73e94c68af7b633e25f2dd3c2a3a4e7c2ec`; `main` und die 110 geschuetzten Originaldateien bleiben unangetastet.

## Reproduzierbarer Test
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_v194.py
```
Die isolierte Offline-Vorschau wird aus dem geprueften Quellmanifest gebaut. Eine temporaere Chromium-Erweiterung setzt **echten Tab-Zoom** mit `chrome.tabs.setZoom`, und `chrome.tabs.getZoom` bestaetigt den Wert. Die 39 Szenen werden je Zoomstufe per Szenenregister geoeffnet; danach wird der Schliessen-Knopf mit echten Tab-Tasten fokussiert und mit Enter aktiviert. Das native `close`-Ereignis wird vor dem naechsten Dialog abgewartet. Spielstand und externe Anfragen werden kontrolliert.

## Tatsachliche GitHub-CI auf Implementierungs-HEAD
- [Chromium #40439643673](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40439643673): **PASS**, einschliesslich aller bisherigen Browserpruefungen.
- [Quellnachweis #40439643599](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40439643599): **PASS**.
- [Gesamtmatrix #40439643683](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40439643683): Schema/Regression pruefbar; technische Freigabe weiterhin **BLOCKED** (erwartete harte Sperre).

| Messung | 175 % | 200 % |
|---|---:|---:|
| Registrierte Szenen | 39 | 39 |
| Tab/Enter-Schliessungen | 39 PASS | 39 PASS |
| Sichtbarer Tastaturfokus | 39 PASS | 39 PASS |
| Szenen mit horizontalem Ueberlauf (>2 px) | 0 | 0 |
| Schliessen-Knopf ausserhalb Viewport | 0 | 0 |
| CSS-Fensterbreite | 457 px | 400 px |
| Geraetepixeldichte | 1,75 | 2,00 |

**Wichtig:** Das prueft 78 technische Szenendurchlaeufe, nicht 78 unabhaengige Spielfunktionen. Szenen werden per Programmschnittstelle geoeffnet; die einzelnen Spielaktionen und Minispiele sind unter nativem Zoom noch nicht vollstaendig geprueft. Die Ueberlaufmessung allein beweist keine vollstaendige visuelle Lesbarkeit oder Kontraste. **BED-03 bleibt BLOCKED**. Fortschritt der Gesamtmatrix unveraendert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.

## Naechste Pflichtarbeiten
1. Minispiele und verbliebene Dialogaktionen unter echtem 175/200-%-Zoom per Tastatur ausfuehren.
2. Rechnerische Fokuskontraste und moegliche Ueberdeckungen messen, konkrete Defekte korrigieren.
3. Belegte Sieg-/Niederlagenregeln und komplette Endpartien mit Import/Wiederherstellung testen.

Kein Merge, kein Release; persoenliche Sicht- und Kubuntu-Endabnahme bleiben bis zum eingefrorenen Kandidaten zurueckgestellt.
