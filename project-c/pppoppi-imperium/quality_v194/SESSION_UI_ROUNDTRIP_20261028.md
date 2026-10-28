# Vorrelease-Teilpaket: versionierter Sitzungsimport und -export in der Technikoberflaeche

**Stand:** 28.10.2026, 17:38 MEZ. **Basis:** PR #114, HEAD `ce8764e12bd5eb629eb391757cd70ad2ce9f55e8`. **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Geltung:** nur abgeleitete PPPOPPI-Technikfassung, kein historischer C64-Originalanspruch.

## Technische Umsetzung

- `quality_v194/build.cjs` fuegt in den **abgeleiteten** Firmencomputer zwei getrennte Schalter ein: „Sitzung exportieren“ und „Sitzung laden“. Der alte JSON-Spielstand bleibt als ausdrücklich benannte Altdatei erreichbar, damit Kampagnenvertraege nicht stillschweigend verloren gehen.
- Die Abschlussarchivansicht besitzt dieselben Sitzungs-Schalter. Ein zusaetzlicher lokaler Dateiwaehler (`loadSessionFile`) ist ausschliesslich fuer das versionierte Sitzungsschema zustaendig.
- Der Export nutzt `PPPEndstateLive.exportSession()`, der Import `PPPEndstateLive.importSession()` mit Schema-, Groessen-, Struktur-, Engine- und Archivpruefung. Bei bereits bestehender Partie wird vor dem Ersetzen bestaetigt. Die asynchrone Dateiverarbeitung wird mit `importRevision` gegen veraltete Ladevorgaenge abgesichert.
- Der Spielzustand `econ` wird erst nach erfolgreicher Adapterpruefung ausgetauscht. Archivierte Partien zeigen nach Import die nur lesbare Abschlussansicht; aktive Kampagnen behalten den Zielmonat. Abgelehnte Dateien sollen die laufende Partie nicht veraendern.
- Keine der 110 manifestgeschuetzten Originalquellen wird bearbeitet. Keine Cloud, kein Netzwerk, kein Merge und kein Release.

## Automatisierte Nachweise (vor CI noch nicht als PASS gewertet)

| Nachweis | Datei | Status bei Einreichung |
|---|---|---|
| UI-Patch, zwei getrennte Importwege, Originalschutz | `quality_v194/test_ui_integrity_v194.cjs` | PENDING |
| Archivexport per UI und Import nach echtem Chromium-Prozessneustart | `quality_v194/test_browser_endstate_live_v194.py` | PENDING |
| Manipuliertes Archiv wird abgewiesen, aktiver Zustand bleibt unveraendert | derselbe Chromium-Test | PENDING |
| Aktiver 12-Monats-Vertrag nach zweitem Chromium-Prozessneustart | derselbe Chromium-Test | PENDING |
| Bestehende Node-/Browser-Regressionen und 800x600 | GitHub-Quell- und Browser-CI | PENDING |
| Vorrelease-Gesamtgate | `prerelease/matrix.json` | BLOCKED |

**Pruefbefehle:** `node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs`, `node --test project-c/pppoppi-imperium/quality_v194/test_endstate_live_v194.cjs`, `python3 project-c/pppoppi-imperium/quality_v194/test_browser_endstate_live_v194.py`, `python3 tools/validate_project.py`, `python3 -m unittest discover -s tests -v`. Ergebnisse erst nach realer Ausfuehrung berichten.

## Release-Pflichten und Grenzen

`VER-01`, `SPE-03`, `BED-02`, `SIC-02` bleiben **BLOCKED**. Die technische Gesamtmatrix bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Weiter offen: vollstaendige Sieg- und Niederlagenpartien, Mehrspieler-/Sanierungsrundlaeufe bis zum Spielende, 175/200-%-Zoom, weitere Fehler-/Ressourcen- und Speicherrueckfalltests, historische Originalverifikation sowie technische Release-Dokumentation. Persoenliche Sichtpruefung und Kubuntu-Praxistest erst nach allen eigenstaendig moeglichen Technikgates und eingefrorenem Kandidaten.

## Naechste drei Schritte

1. GitHub-CI auf dem neuen Entwicklungs-HEAD auswerten, echte FAILs beheben und finalen HEAD mit Testlinks dokumentieren.
2. Aktive Kampagnen und archivierte Partien bei 175/200 % Zoom, Tastaturbedienung und unterbrochenem Dateiladen testen.
3. Vollstaendige Sieg-/Niederlagenpartien mit echten Spielaktionen, mehreren Prozessneustarts und Wirtschaftsbuchungen durchspielen.

**Empfehlung:** Versionierte Sitzungen als Standard-Speicherweg erst nach gruener End-to-End-Pruefung kennzeichnen; Altdateien weiter explizit als `legacy` behandeln.
