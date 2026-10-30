# Vorrelease-Teilpaket: verzögerter Sitzungsimport und 5-MB-Grenze

**Stand:** 28.10.2026, 18:31 MEZ. **Basis:** [PR #115](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/115), HEAD `3bd3e2ff5ad9862f9220a5cf9453de7c0bc28730`. **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. Gilt ausschließlich für die getrennte PPPOPPI-Technikfassung.

## Vorprüfung und Änderungsziel

Der versionierte Sitzungsimport besitzt bereits einen Revisionsschutz gegen verspätete Dateiantworten und eine 5.000.000-Byte-Grenze. Der bisherige echte Browser-Rundlauf belegte Archiv- und Kampagnenwiederherstellung sowie einen manipulierten Archivinhalt, **aber nicht** die Grenzüberschreitung und das Rennen zwischen Dateilesen und Neustart auf dem neuen Sitzungsweg. Diese beiden Risiken sind für sichere Spielstände relevant; die existierende Implementierung wird nicht ohne Fehlernachweis umgebaut.

## Änderungen

Nur `quality_v194/test_browser_endstate_live_v194.py` um zwei Browserregressionen erweitert:

1. Eine 5.000.001 Byte große Sitzungsdatei wird über den echten `change`-Ereignispfad des versteckten Dateiwählers eingereicht. Erwartet werden Ablehnung, unveränderter Archivzustand und keine Datenübernahme.
2. Ein gültiges Abschlussarchiv wird über eine kontrolliert verzögerte `File.text()`-Antwort eingelesen. Vor der Auflösung wird eine neue 24-Monats-Kampagne gestartet. Erwartet werden unveränderte neue Partie, aktiver Status, 24-Monats-Vertrag und kein altes Abschlussarchiv. Der Test überprüft damit den bereits implementierten `importRevision`-Schutz gegen verspätete Dateianworten.

Kein Eingriff in Spielregeln, die 110 geschützten Originaldateien, persönliche Daten oder produktive Spielstände. Kein Merge und kein Release.

## Tatsächliche und noch ausstehende Prüfungen

| Nachweis | Stand |
|---|---|
| Vorheriger PR #115, [Browser-CI #40728391799](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40728391799): fünf Jobs | **PASS 5/5** (vorheriger HEAD) |
| Vorheriger PR #115, [Quellprüfung #40728391619](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40728391619) | **PASS** (vorheriger HEAD) |
| Vorheriger PR #115, [Gesamtgate #40728391418](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40728391418) | **BLOCKED** wegen offener Pflichtmatrix |
| Neue Größen- und Import-Race-Regression | **PENDING** bis CI auf neuem HEAD |
| Bestehende Chromium-, Zoom-, Quell- und Projektprüfungen auf neuem HEAD | **PENDING** bis CI |
| Vorrelease-Gesamtfreigabe | **BLOCKED** |

**Gezielter Test:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_endstate_live_v194.py`. **Pflichtprüfungen:** `python3 tools/validate_project.py`, `python3 -m unittest discover -s tests -v`, `node project-c/pppoppi-imperium/prerelease/check.mjs --technical`. Der Browser-Test ist bereits Bestandteil des unabhängigen CI-Jobs `browser-process-restart`. Kein lokaler Chromium-Nachweis behauptet.

## Pflichtmatrix und nächste Arbeiten

`SPE-03` und `SIC-02` erhalten einen weiteren **Teilverifikationspfad**, bleiben bis zur erfolgreichen Ausführung und vollständigen Endspiel-/Rückfallprüfung **BLOCKED**. Gesamtmatrix weiterhin **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**.

1. CI auf dem neuen PR-HEAD abwarten, eventuelle Fehler reproduzieren und korrigieren.
2. Sichtbare Sitzungsbedienung bei echtem 175/200-%-Browserzoom, Tab/Enter und Abbruch einer Dateiauswahl absichern.
3. Komplette Sieg- und Niederlagenpartien mit mehreren echten Spielaktionen, Speicherung, Prozessneustarts und Langzeitwertungen testen.

**Empfehlung:** Eine bestandene Einzelregression ist ein Teilnachweis und keine Vorrelease-Freigabe. Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach sämtlichen autonomen Technikgates und eingefrorenem Kandidaten.
