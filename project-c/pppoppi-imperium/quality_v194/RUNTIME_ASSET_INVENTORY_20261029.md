# Laufzeitmedien-Inventar und Rechtenachweis – 29.10.2026

**Spiel:** PPPOPPI IMPERIUM, V1.9.3-Kern / V1.9.4-Pruefschicht. **Basis:** PR #126, HEAD `91cfcd8d87c283f9f5844fdbe5888caf3a24ac88`. **GitHub-main:** `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Konkreter Befund

- Der GitHub-Baum des genannten Basis-HEAD enthaelt unter `project-c/pppoppi-imperium/SPIEL/` **0 eingecheckte Mediendateien** der untersuchten Formate (Bild, Audio, Video, Schrift).
- Die 110 geschuetzten Quell-/Testdateien bleiben unberuehrt. Das fruehere technische README nennt **77 ausgeschlossene Archivdateien** (73 PNG, 2 PDF, 1 ZIP, 1 TXT). Diese Dateien liegen nicht im hier geprueften GitHub-Spielordner; ihre Herkunft, Rechte und moegliche Nutzung sind **nicht** freigegeben.
- Neues `runtime_asset_manifest.json` mit leerem Bestand. Ein neuer Medienzugang wird im automatischen Test abgewiesen, bis Pfad, SHA-256, Nutzungsgrundlage und existierender Rechtenachweis dokumentiert sind.
- Die Pruefung benutzt `git ls-files`: sie umfasst ausschliesslich versionierte Dateien unter `SPIEL/`. Nicht geprueft sind dynamisch erzeugte Ressourcen, externe Downloads, unversionierte Dateien, Bilder ausserhalb des Spielordners und die rechtliche Stichhaltigkeit eines eingetragenen Rechtenachweises. **Ein bestandenes Inventar ist keine Rechtefreigabe.**

## Tatsaechliche Pruefungen

- Lokaler Python-3.12-kompatibler Standardbibliothekstest: **10/10 PASS**, einschliesslich fehlendem Eintrag, falschem Hash, fehlendem Rechtenachweis, unbekannten Rechten, Pfadwechsel, Duplikat und ungueltigem Schema.
- GitHub-CI dieses neuen Entwicklungszweigs: **erst nach PR-Ausfuehrung bewerten**, kein vorweggenommenes PASS.
- Abgeschlossene CI der Basis PR #126 auf `91cfcd8d87c283f9f5844fdbe5888caf3a24ac88`: [Browser-Gesamtregression 8/8 PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40813183236), [Rohrnetz/Feuerwehr PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40813183405), [Quellschutz PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40813183205).
- **Vorrelease-Pflichten unveraendert: 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.** QUE-01 bleibt BLOCKED, QUE-04 bleibt OPEN. Die Inventarpruefung ersetzt weder den unabhaengigen Rechtebeleg noch eine Original-C64-Verifikation.

## Naechstes Pflichtpaket

1. GitHub-Workflow des neuen Inventars am finalen Commit pruefen und Fehler gegebenenfalls beheben.
2. Die 77 ausgeschlossenen Archivdateien mit Herkunft, Rechteinhaber, Nutzung und tatsaechlicher Spielnotwendigkeit einzeln bewerten, ohne sie ungeprueft ins Repository zu uebernehmen.
3. Weitere Wirtschaftsendpartien und Speichergrenzfaelle technisch absichern; erst nach vollstaendigen technischen Gates und eingefrorenem Kandidaten persoenliche Sicht-/Kubuntu-Endabnahme.

**Kein Merge, kein Release, keine historische Originaltreue-Behauptung.**
