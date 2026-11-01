# Vorrelease – Integritaet der Pflichtnachweise (01.11.2026)

## Ziel
Die 52er-Pflichtmatrix darf einen technischen PASS nicht allein aufgrund eines beliebigen oder fehlenden CI-Links akzeptieren. Die Strukturpruefung wird gezielt verstaerkt, ohne Spielkern, Speicherstaende oder bestehende PASS-Zaehlung zu veraendern.

## Aenderungen
- Technische PASS-Nachweise benoetigen eine GitHub-Actions-Laufadresse **aus provoware/PROJEKT_Oli_Imperium** mit positiver numerischer Laufkennung.
- Ist `ci_conclusion` angegeben, muss sie `success` sein. Fehlende Schlussangaben in aelteren Nachweisen bleiben formal erlaubt; ihre tatsaechlichen CI-Ergebnisse muessen unabhaengig geprueft werden.
- Nachweisdaten muessen echte Kalendertage sein; z.B. 30. Februar wird verworfen.
- Offene, blockierte oder fehlgeschlagene Pflichten brauchen eine nichtleere naechste Handlung.
- Neue Negativtests decken fehlende/fremde/ungueltige CI-Adressen, Fehlerstatus, falsche Daten und leere Folgehandlungen ab.

## Reproduzierbare Tests
```bash
node --check project-c/pppoppi-imperium/prerelease/check.mjs
node --check project-c/pppoppi-imperium/prerelease/test.mjs
node --test project-c/pppoppi-imperium/prerelease/test.mjs
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Erwartung: Syntax, Node-Tests und Schema PASS; technische Gesamtpruefung weiterhin BLOCKED mit Exitcode 1. Die neuen Kontrollen validieren **nur das Format** eines GitHub-Nachweises, nicht dessen Echtheit, Zuordnung zum Commit oder erfolgreichen Lauf auf GitHub. Diese externe Verifikation bleibt zwingend.

## Freigabegrenzen
6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche Endabnahmen DEFERRED (unveraendert). Kein Release, kein Merge, keine persoenliche Abnahme. Nach GitHub-CI auf dem neuen PR-HEAD: bei Fehlern korrigieren; danach weitere unabhängige technische Pflichtarbeit bearbeiten. Die Browser-Dateiauswahl und Vermoegensmodellierung werden in separaten PRs #151 bzw. #150 behandelt.
