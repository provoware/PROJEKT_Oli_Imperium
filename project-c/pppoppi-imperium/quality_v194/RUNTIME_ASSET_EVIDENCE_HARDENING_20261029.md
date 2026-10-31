# Laufzeitmedien: versionierte Rechtenachweise und strengere Inventarprüfung – 29.10.2026

**Spiel:** PPPOPPI IMPERIUM V1.9.4-Prüfschicht / V1.9.3-Kern. **Ausgangsbasis:** [PR #127](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/127), HEAD `73e1f7bff3bcb8cfbdbaa95c6d447357d9b9ac36`. **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Ausgangsproblem und konkretes Pflichtpaket

Der bisherige Inventarprüfer akzeptierte eine beliebige nichtleere Rechtebeschreibung (beispielsweise `test-only`) und einen lokal vorhandenen, aber nicht versionierten Rechtenachweis. Damit konnte ein grüner Inventarcheck ohne reproduzierbare Rechteunterlage entstehen. Außerdem wurden AVIF, M4A, PDF und weitere Laufzeitformate nicht als Medien erkannt.

## Änderung (ohne Änderungen an den 110 geschützten Spielquellen)

- Das Inventar akzeptiert nur explizite Dokumentationsklassen: `own-work`, `public-domain`, `cc0-1.0`, `cc-by-4.0`, `cc-by-sa-4.0`, `third-party-license`. Jede Klasse verlangt weiterhin eine konkrete Unterlage, deren Inhalt juristisch **nicht** automatisch als richtig bestätigt wird.
- Rechtenachweise müssen als **versionierte, nichtleere, reguläre Datei** im Repository liegen; symbolische Verweise, Selbstverweise, fehlende Dateien und Steuerzeichen im Pfad werden abgewiesen.
- Weitere Medienformate (u. a. AVIF, APNG, JFIF, AAC, M4A, Opus, AIFF, MOV, MKV, EOT, PDF, GLB/GLTF) sind erfasst. Die Git-Prüfung erfasst nun alle versionierten Pfade, damit die Belegdatei gegen das Inventar geprüft werden kann.
- Sechs zusätzliche Negativtests prüfen unversionierte und leere Nachweise, Scheinlizenzen, Steuerzeichen, neue Formate und symbolische Verweise.

## Nachweise und Grenzen

- **Lokal (Python 3.12-kompatibler Standardbibliothekstest):** 16/16 Unit-Tests PASS; `python3 -m py_compile` PASS.
- **Lokaler Git-End-to-End-Rundlauf in temporärem Repository:** leeres Inventar PASS (Exitcode 0); eingechecktes, nicht dokumentiertes `.avif` wird korrekt BLOCKED (Exitcode 1).
- **GitHub-CI auf endgültigem PR-HEAD:** erst nach Ausführung prüfen und im PR dokumentieren; ein lokal grüner Test ist keine GitHub-Freigabe.
- **Release-Gates:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED (unverändert). QUE-01 BLOCKED, QUE-04 OPEN. Die 77 ausgeschlossenen Archivdateien (73 PNG, 2 PDF, ZIP, TXT) sind weiterhin nicht geprüft oder freigegeben. Auch korrekt dokumentierte Rechtekategorien ersetzen keine Prüfung des tatsächlichen Rechtsnachweises.

## Nächste sachliche Pflichtarbeiten

1. CI auf endgültigem Entwicklungs-HEAD einschließlich Inventarworkflow und integrierter technischer Sperre auswerten.
2. Die 77 ausgeschlossenen Archivdateien ohne Veröffentlichung einzeln nach Herkunft, Nutzungsgrundlage und Spielnotwendigkeit prüfen; fehlende Belege konkret erfassen.
3. Weitere vollständige Wirtschaftsendpartien einschließlich Extremwerten, Speicherunterbrechungen und Rückfallverhalten absichern.

**Keine persönliche Endabnahme, kein Merge, kein Release.**
