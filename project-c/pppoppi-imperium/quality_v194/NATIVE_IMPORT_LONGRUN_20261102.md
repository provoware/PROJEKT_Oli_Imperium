# OLI V1.9.4 – nativer Datei-Auswahldialog in Langzeitpartien

**Datum:** 02.11.2026. **Zweig:** `test/oli-campaign-24-60-20261101`, [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **DRAFT – kein Merge, kein Release.**

## Verifizierte Ausgangslage

Auf HEAD [56ccb012ec923b99c6dfdc69e39529a8cdffbd3d](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/56ccb012ec923b99c6dfdc69e39529a8cdffbd3d) ist [Kampagnen-CI #41368016979](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41368016979) abgeschlossen: **10/10 Jobs SUCCESS**, darunter erstmals 240-Monats-Partien mit echtem 175-%- und 200-%-Chromium-Tab-Zoom. Diese Langzeitpfade haben bisher den Spielstand mit `set_input_files()` geladen, **nicht** ueber einen menschlich ausgeloesten Dateidialog. Der separate [Picker-Diagnosebericht](PICKER_CAUSAL_DIAGNOSIS_20261101.md) beschreibt den intermittierenden Fehler; er ist dadurch nicht beseitigt.

## Neues, getrenntes Pflichtpaket

- `campaign_native_import_v194.py`: optionaler, ausschliesslich im Test genutzter Import ueber echten Start-/Neue-Partie-/Import-Schalter, Tastaturfokus, Enter, bestaetigte Playwright-1.56.0-Interception und echtes `filechooser`-Ereignis. Die frisch erzeugte Partie dient nur als Weg zum echten Importdialog im isolierten Temp-Profil.
- `test_browser_campaign_120_240_v194.py --native-import`: verwendet diesen Weg **zweimal**, nach dem Halbzeit-Neustart und nach dem Archiv-Neustart. Die vorhandenen Zustands-, Vertrags-, Ranglisten- und Archivgleichheitspruefungen bleiben unveraendert. Ohne Flag bleibt der alte, ausdruecklich als `DIRECT_INPUT` ausgewiesene Vergleichspfad bestehen.
- `test_campaign_native_import_v194.py`: fuenf isolierte Regressionen fuer direkte Eingabe, nativen Erfolgsweg, fehlenden Dialog, ausbleibende Bestaetigung und fehlenden Tastaturfokus. Ein Fehler wird weder wiederholt noch durch direkte Dateibefuellung umgangen.
- `.github/workflows/prerelease-campaign-duration.yml`: zwei zusaetzliche, unabhaengige 120-Monats-Jobs mit echtem Tab-Zoom 175 % und 200 %, jeweils 480 menschlichen Zugabschluessen, zwei nativen Importen und drei Browserprozessen. Fehler/Timeout fuehren zu FAIL; `fail-fast: false` erhaelt beide Befunde.

## Nachweise und Reproduzierbarkeit

**PASS (lokal isoliert, vor dem Commit):** 5/5 neue Python-Regressionen und Python-Syntax fuer die beiden neuen Hilfsdateien. Die lokalen Tests benutzen kontrollierte Seitendoubles; sie sind **kein** Chromium-Nachweis.

**PASS (Ausgangs-HEAD):** [CI #41368016979](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41368016979) 10/10 bisherige Jobs, inklusive 240-Monats-Zoom.

**PENDING:** Neue GitHub-CI und echte 120-Monats-Dateiauswahl auf dem neuen HEAD. Vor gruenem CI **keine** Behauptung eines behobenen Dateidialogfehlers.

```bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_campaign_native_import_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 175 --native-import
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 120 --zoom 200 --native-import
```

## Pflichtmatrix / Grenzen

| Bereich | Nachweis | Status |
|---|---|---|
| SPE-01 / VER-03 | Echte Halbzeit- und Archivimporte nach Prozessneustart | PENDING neuer Browser-CI |
| BED-02 / BED-03 | Tastaturfokus, Enter und echter Zoom bei 800x600 | PENDING; keine vollstaendige Tab-Reihenfolge |
| GRA-02 / GRA-03 | Kein horizontaler Seitenueberlauf waehrend der Partie | Bisheriger Teiltest PASS; Gesamtpflicht BLOCKED |
| PER-01 / PER-02 | 120/240-Monats-Leistung | Teilmessungen PASS; Grenzwerte weiterhin BLOCKED |
| QUE-04 | Medienrechte und C64-Originalreferenz | BLOCKED |

**Gesamtmatrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 persoenliche DEFERRED = 52.** Der neue Test prueft ausschliesslich isolierte technische Spielimporte, veraendert keine Originaldateien, Produktregeln, Spielstandschemas oder Nutzerdateien. Die persoenliche Kubuntu-/Sichtabnahme erfolgt erst nach vollstaendigem technischen Abschluss und eingefrorenem Kandidaten.

**Naechste drei Schritte:** (1) Beide neuen 120-Monats-Dateidialogjobs und Regressionen auf dem finalen HEAD auswerten; (2) bei FAIL den konkreten Fokus-/Dateiauswahl-/Importfehler mit unveraendertem Code reproduzieren und gezielt korrigieren; (3) nach mehrfach gruenen Laeufen den nativen Import in 240-Monats-Zoompartien und die vollstaendige Tab-Reihenfolge ausweiten.
