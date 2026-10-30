# Laufzeitmedien: speicherschonendes Hashing und sichere Fehlerausgabe – 29.10.2026

**Spiel:** PPPOPPI IMPERIUM, Projekt C V1.9.4-Prüfschicht auf V1.9.3-Spielkern. **Basis:** [Entwurfs-PR #128](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/128), HEAD `ee2362fcfb111bd6a5389050dc6cf304198e707b`; `main` bei Vorprüfung `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Ursache, Risiko und erwartete Wirkung

Die Inventarprüfung las jedes Medium vollständig in den Arbeitsspeicher. Große Bilder/Videos konnten unnötige Speicherlast oder einen Prozessabbruch auslösen. Dateizugriffsfehler beim Hashing wurden nicht als geregelte Inventarabweichung protokolliert. Bei formal ungültigem Manifest konnte die Kommandozeile nach einer bereits erkannten Schemaabweichung mit `KeyError`/ `TypeError` abbrechen, weil sie die Länge von `assets` ungeprüft ausgab.

**Wirkungsziel:** konstante zusätzliche Speicherlast beim Prüfen großer Mediendateien (1-MiB-Blöcke), nachvollziehbarer FAIL statt unkontrolliertem Abbruch bei Lesefehlern und ungültigen Manifeststrukturen.

## Isolierte Änderung

- `prerelease/audit_runtime_assets.py`: SHA-256 als Strom in Blöcken, I/O-Fehler als `Laufzeitmedium nicht lesbar`, Nachweis-`stat`-Fehler als `Rechtenachweis nicht lesbar`.
- Ungültige `assets`-Strukturen führen zu regulärem Exitcode 1 mit erklärender Fehlermeldung; ungültige JSON-Dateien bleiben ein eigener Einlesefehler (Exitcode 2).
- `prerelease/test_runtime_assets.py`: vier zusätzliche Regressionen für Streaming ohne `read_bytes`, verweigerten Medienzugriff, symbolische Medienverweise und drei ungültige Manifestformen im echten temporären Git-Repository.
- **Keine Änderungen** an den 110 geschützten Spielquelldateien, kein Umgang mit persönlichen Spielständen, kein Original-ROM und kein Eingriff in `main`.

## Nachweis und verbleibende Grenzen

Der Inventarworkflow `.github/workflows/prerelease-runtime-assets.yml` führt auf GitHub Python 3.12, alle Inventar-Unit-Tests und den Git-Inventar-Check aus. **Neue CI-Ergebnisse sind erst nach tatsächlichem GitHub-Lauf als PASS/FAIL zu werten.** Ausgangsstand vor dieser Änderung: [PR #128 Medien-CI PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40824635523), [Browser-Gesamtregression 8/8 PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40824635475), [integrierte Sperre erwartungsgemäß FAIL](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40824635506).

Die 77 ausgeschlossenen Archivdateien sind weiterhin rechtlich und funktional ungeprüft. Das Inventar erfasst nur Git-versionierte Laufzeitmedien unter `SPIEL/`; eine technisch korrekte Prüfsumme ist **keine Lizenzfreigabe**. Die Vorrelease-Matrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.

## Nächste drei Arbeiten

1. Inventar-CI auf dem finalen Zweig-HEAD auswerten und Fehler gezielt korrigieren.
2. Wirtschafts-Extremwerte und weitere Import-/Export-Grenzfälle mit vollständigen Spielverläufen prüfen.
3. Ressourcenrechte und historische C64-Referenz separat belegen; persönliche Endabnahme erst nach technischem Kandidaten-Freeze.

**Kein Merge, kein Release, keine persönliche Endabnahme.**
