# Echte Wirtschaftskette bei 175/200 % Browserzoom – 27.10.2026

**Spiel:** PPPOPPI IMPERIUM (V1.9.3-Spielkern, isolierte V1.9.4-Technikvorschau). **Kein Release.** Basis ist [Entwurfs-PR #81](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/81), gestapelt auf PR #80; `main` blieb `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Nachgewiesener Fehler und Korrektur

- **Erstlauf:** [Chromium #40467580953](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40467580953) auf `350eb0f4b228950a13cabc3b06370b450a78f3fe` **FAIL**. Bei echtem 200-%-Zoom hatte die dynamische Monatsabrechnung **54 CSS-Pixel horizontalen Überlauf**; bei 175 % waren es 0. Die Wirtschaftsaktionen und Vertragsabrechnungen hatten bis zu dieser Messung bestanden.
- **Gezielter Fix:** Nur `quality_v194/build.cjs` erzeugt in der abgeleiteten HTML-Technikfassung bei schmalen Dialogen Tabellen mit festen Spaltenbreiten, erlaubtem Textumbruch und ohne erzwungene Zell-Mindestbreite. Die 110 manifestgeschützten Originaldateien unter `SPIEL/` bleiben byteidentisch. Ein statischer Regressionstest wurde in `test_ui_integrity_v194.cjs` ergänzt.
- **Nachtest:** [Chromium #40467829258](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40467829258) **PASS**, vollständige Browser-Prüfkette auf Implementierungs-HEAD `23ecb9f42522cc872c8ec0334e3ca590d2beab83`. [Quell-/Fachprüfung #40467829176](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40467829176) **PASS**. [Technische Pflichtmatrix #40467829186](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40467829186) **BLOCKED**, erwartete harte Release-Sperre.

## Echte Prüfabdeckung

`python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_economy_v194.py`

| Prüfaspekt | 175 % | 200 % |
| --- | --- | --- |
| Echte Browser-Zoom-API | PASS | PASS |
| Wirtschaftliche Tab-/Enter-Aktionen | 15 | 15 |
| Abgerechnete Monate | 2 | 2 |
| Unzulässige Förderung / Doppelkauf ohne Doppelbuchung | PASS | PASS |
| Vertrag erfüllt, Export entspricht Spielzustand | PASS | PASS |
| Gemessene dynamische Ansichten | 2 | 2 |
| Interaktive Element-Vorkommen in den Ansichten | 27 | 27 |
| Nicht treffbare Bedienelemente | 0 | 0 |
| Horizontaler Überlauf | 0 CSS-Pixel | 0 CSS-Pixel |
| JavaScript-Fehler / externe HTTP-Anfragen | 0 / 0 | 0 / 0 |

**Grenze:** 54 geprüfte Element-Vorkommen sind keine 54 verschiedenen Funktionen. Der Test verwendet echte Tasten für die Aktionen, aber die Szenenwahl-API zum Öffnen der jeweiligen Ansicht. Er prüft weder sämtliche Dialoge noch Pixelüberlagerungen von Text/Animationen oder reguläre Sieg-/Niederlagenpartien. Die Tabellen können bei 200 % stark umbrechen; eine abschließende Sichtprüfung bleibt bewusst zurückgestellt.

**Matrix:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED. BED-02, BED-03, LOG-02 und LOG-03 bleiben **BLOCKED**; diese Ergebnisse sind ausschließlich Teilnachweise.

## Nächste drei Schritte

1. Weitere Dialogaktionen und Fehlerpfade mit echten Tasten unter 175/200 % prüfen.
2. Dynamische Text-/Animationsüberdeckungen und Tabellenlesbarkeit quantitativ absichern.
3. Fachlich definierte vollständige Sieg-/Niederlagenpartien einschließlich Speichern und Neustart prüfen; persönliche Endabnahme erst nach technischem Abschluss und eingefrorenem Kandidaten.

**Keine Originaldatei überschrieben, kein Merge, kein Release.**
