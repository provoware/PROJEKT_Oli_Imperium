# Vorrelease-Pflichtpaket: versionierter Sitzungsadapter fuer Spielende

**Datum:** 28.10.2026. **Projekt:** C, eigenstaendige PPPOPPI-Adaption. **Basis:** PR #108, HEAD `e3926112c2ec04ef2d024baad007362af110aebb`; main `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Ausgangsproblem und Wirkung

Der bisherige Endregel-Prototyp konnte abgeschlossene Spielstaende berechnen und als Archiv pruefen, aber er steuerte weder einen aktiven Spielzustand noch dessen Uebergang in ein unveraenderbares Archiv. Eine normale Engine-Aktion nach einem Abschluss musste deshalb auf Ebene der Sitzung abgewehrt werden. Das ist Voraussetzung fuer die spaetere Browserintegration, **nicht** deren Ersatz.

## Implementiert

- `quality_v194/endstate_session_v194.cjs`: isolierte Sitzung mit explizitem freiem Spiel oder Kampagnenvertrag. Nur ein aktiver oder archivierter Zustand pro Sitzung.
- `apply` fuehrt Aktionen ueber eine Kopie des aktuellen Spielstandes aus. Nur ein erfolgreich gepruefter Engine-Zustand wird uebernommen; Fehler duerfen die gespeicherte Sitzung nicht teilweise veraendern.
- Kampagne wird nur beim Schlussbericht archiviert. Freies Spiel verlangt `finish(true)`; offene Rettung verhindert den Abschluss. Archivierte Partien verweigern weitere Aktionen.
- Neues, eigenstaendiges Sitzungsschema `pppoppi.endstate.session.proposal/1`; aktive und abgeschlossene Sitzungen werden unterschiedlich gespeichert. Import prueft den Vertrag, genau einen Zustand, unzulaessige Schluessel, Tiefe, Knotenanzahl und 5-MB-Grenze. Archiv-Import nutzt die bereits vorhandene Konsistenzpruefung aus PR #108.
- `quality_v194/test_endstate_session_v194.cjs`: zehn Tests, darunter echter V0.8.2-Kern, Monatsabschluss, 12-Monats-Kampagne, Rettung und Neuladen im GitHub-Repository. Eigener Schritt in der bestehenden Browser-CI.

**Keine Aenderung** der 110 geschuetzten Original-Spielquellen, keine neue historische C64-Behauptung, keine stille Aenderung des V0.8.2-Spielstandschemas.

## Tatsachlich ausgefuehrte lokale Tests

Node.js 22.16.0, 28.10.2026:

```bash
node --check endstate_session_v194.cjs
node --check test_endstate_session_v194.cjs
node --test test_endstate_session_v194.cjs
```

Erster lokaler Durchlauf: **7 PASS / 2 FAIL** (Testattrappe pruefte negativen Monat nicht; erwarteter Fehlertext war zu eng). Beide Testfehler korrigiert. Zweiter lokaler Durchlauf: **8 PASS / 0 FAIL / 1 SKIP**. Nach Ergaenzung des echten 12-Monats-Kampagnentests: **8 PASS / 0 FAIL / 2 SKIP**. Beide Integrationstests benoetigen die Originaldateien aus dem Repository und muessen im GitHub-CI-Schritt ohne SKIP laufen. Ein SKIP ist **kein PASS**.

Die vorherige PR #108 wurde nachtraeglich verifiziert: [Browser-CI #40673008836](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40673008836) **PASS**, [Quellpruefung #40673008706](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40673008706) **PASS**, [Gesamtgate #40673008731](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40673008731) **FAIL/BLOCKED** wegen offener Releasepflichten. **CI des neuen Entwicklungszweigs separat pruefen.**

## Release-Pflichten

- `VER-01`: **BLOCKED**. Sitzungsadapter vorhanden, aber noch nicht in Engine-Bridge und Browser-UI eingebaut. Keine komplette Sieg-/Niederlagenpartie.
- `SPE-03`: **BLOCKED**. Versionierter Import ist isoliert; noch keine Browser-Speicherung, reale Prozessneustarts oder Altstandmigration des neuen Sitzungsformats.
- `FEH-02`, `GRA-03`, `BED-03`: weiterhin **BLOCKED**; Endspielaktionen, Darstellung bei 800x600 und Tastaturbedienung muessen in der Oberflaeche geprueft werden.
- Pflichtmatrix unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Persoenliche Sicht- und Kubuntu-Abnahmen erst nach technischen Gates und eingefrorenem Kandidaten.

## Naechste drei Schritte

1. Neuen CI-Schritt gegen die echte Engine auswerten und eventuelle Fehler korrigieren.
2. Adapter im getrennten Technikaufbau mit bewusster Moduswahl, Abschlussdialog und Archiv-Import/Export verbinden; Originaldateien unangetastet lassen.
3. Vollstaendige Browserpartien einschliesslich 800x600, 175/200-Prozent-Zoom, Tastatur, Rettung, Gleichstand und Prozessneustarts automatisiert pruefen.

**Empfehlung:** Den UI-Anschluss erst nach gruenem Engine-Integrationstest vornehmen. Kein Merge, kein Release und keine vorgezogene persoenliche Abnahme.
