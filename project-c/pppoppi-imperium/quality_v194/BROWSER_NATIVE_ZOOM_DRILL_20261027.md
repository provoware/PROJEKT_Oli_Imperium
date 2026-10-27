# Technische Teilprüfung: Bohr-Minispiel bei echtem Browserzoom (27.10.2026)

## Gegenstand

Das dreistufige Bohr-Minispiel wird im aus dem geprüften Quellmanifest
gebauten Offline-Chromium bei 175 % und 200 % **nativem Tab-Zoom**
(`chrome.tabs.setZoom/getZoom`) bedient. Es handelt sich nicht um eine
CSS-Verkleinerung oder eine Sichtabnahme.

Prüfprogramm:
`python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_drill_v194.py`

Pro Zoomstufe wird eine neue Partie begonnen, das Feld BERLIN-1 regulär
begutachtet und gekauft, das Bohrspiel per Tab/Enter gestartet, in
drei Abschnitten der tatsächliche Druckzielwert über Home und Pfeil-rechts
eingestellt und per Enter bestätigt. Nach jedem Abschnitt werden
Spielkernvalidierung, Zustandsübergang und Layout geprüft. Der Spielstand
wird zum Abschluss per Tastatur als JSON exportiert und exakt mit dem
Zustand vor dem Export verglichen. JavaScript-Laufzeitfehler und externe
HTTP-Anfragen werden aufgezeichnet und müssen ausbleiben.

Die Layoutmessung umfasst vier Zeitpunkte pro Zoomstufe (vor Abschnitt 1
und nach jedem Abschnitt). Horizontaler Überlauf über 2 CSS-Pixel und
ein außerhalb des Bildbereichs liegender Schließen-Knopf führen zum
Testfehler. Diese Messungen beweisen **keine** vollständige Freiheit von
visuellen Überdeckungen.

## Prüfstand und Grenzen

- Entwicklungszweig: `agent/prerelease-c-native-zoom-drill-20261027-0530`.
- Grundlage: [PR #77](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/77),
  Ausgangs-HEAD `87000c94c3b846512167e599bc13aeec2dd7b773`.
- Implementierung: `05fb2f698566ea35c731660ef96fe0fd0c4de9ef`.
- [Änderungsantrag #78](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/78)
  bleibt Entwurf, kein Merge nach `main`.
- Die 110 manifestgeschützten Originaldateien und echte Spielstände bleiben
  unangetastet; die Vorschau entsteht nur in einem temporären Verzeichnis.
- [Chromium-CI](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40450188293),
  [Quell-CI](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40450188294)
  und [Gesamtmatrix](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40450188386):
  Ergebnisse erst nach tatsächlichem Abschluss als PASS/FAIL/BLOCKED bewerten.

**Nicht freigegeben:** BED-03 und BAR-01 bleiben BLOCKED. Offen sind
vollständige Dialogaktionen, Fokuskontraste, Zwischenbild-Überdeckungen,
reguläre Sieg-/Niederlagenpartien und sämtliche persönlichen Endabnahmen.

## Nächste Pflichtarbeit

1. Die tatsächlichen CI-Ergebnisse des Bohr-Zoom-Tests auswerten und Fehler beheben.
2. Fokuskontraste und dynamische Zwischenbilder quantitativ untersuchen.
3. Danach weitere Dialogaktionen und die fachlich definierten Endpartien prüfen.
