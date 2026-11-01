# Vorrelease – Integritaet der Pflichtnachweise (01.11.2026)

## Ziel
Die 52er-Pflichtmatrix darf einen technischen PASS nicht allein aufgrund eines beliebigen oder fehlenden CI-Links akzeptieren. Die Strukturpruefung wird gezielt verstaerkt, ohne Spielkern, Speicherstaende oder bestehende PASS-Zaehlung zu veraendern.

## Aenderungen
- Technische PASS-Nachweise benoetigen eine GitHub-Actions-Laufadresse **aus provoware/PROJEKT_Oli_Imperium** mit positiver numerischer Laufkennung.
- Fuer **jeden technischen PASS** muss `ci_conclusion` ausdruecklich `success` sein. Fehlende, `null`, `pending`, `cancelled` oder `failure` werden abgewiesen. Die bisher fehlende Angabe in `BAL-03.json` wurde erst nach echtem GitHub-Abgleich ergaenzt.
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

## Live-Abgleich der sechs bestehenden PASS-Belege (01.11.2026)

GitHub-Actions-Laufmetadaten wurden ueber die GitHub-API einzeln gelesen. Bei **allen sechs** waren `status=completed`, `conclusion=success` und `head_sha` identisch mit `commit` im jeweiligen JSON-Beleg. Die Eintraege sind historische Teilnachweise, **keine** aktuelle Gesamtfreigabe.

| Pflicht | GitHub-Lauf | Nachweis-Commit (`head_sha`) | Ergebnis |
|---|---|---|---|
| QUE-02 | [40158404633](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158404633) | `0ddf47bee13688ad5ecc5d02f5ae07bbc7288b2a` | PASS |
| QUE-03 | [40158971232](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40158971232) | `cf7a6cd66e44a79657920b33b5cbc9aba45a8541` | PASS |
| BAL-02 | [40159924132](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159924132) | `e30ae05ab793485475405fd4b4f7762b6b955434` | PASS |
| BAL-03 | [40160147127](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40160147127) | `0a2173895a089d77c4d4da1ec2d4372569b7312f` | PASS |
| TES-01 | [40159267861](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159267861) | `160c460cbe1f833ce5f8ee18c74b6b4e06589e3a` | PASS |
| TES-02 | [40159644336](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40159644336) | `51f86277bc858451b95df700196df2d1f70b8f64` | PASS |

**Pruefgrenze:** Der Schema-Checker fragt GitHub nicht selbst ab. Er erzwingt die dokumentierte Erfolgsangabe, aber externe Nachweise koennen weiterhin nur durch separaten GitHub-API-Abgleich als echt bestaetigt werden. Vorrelease-Pflichtstand unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Vor jedem Merge aktuelle CI auf dem neuen PR-HEAD erneut pruefen. Keine Freigabe, kein Merge, kein Release.
