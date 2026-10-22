# Projekt C – Vorrelease-Pflichtmatrix (22.10.2026)

**Bezugsstand:** PR #14, HEAD `a7b67275d10ad682585816fd46c7ef83cc7d511b`; Hauptzweig `main` wird nicht verändert. Die vollständigen 185 Spielquellen fehlen im GitHub-Zweig. Die Wiederherstellungs-CI aus PR #14 scheitert deshalb **erwartet und zu Recht**. Es existiert kein geprüfter Vorrelease-Kandidat.

Die Matrix `matrix.json` nennt konkrete Pflichten aus PR #14, `AGENTS.md`, `docs/05_TESTS_FORTSCHRITT.md` und dem Vorrelease-Auftrag. **Geplante Funktionen sind keine bestätigten Funktionen.** Die Spalte `basis` kennzeichnet die Herkunft, `status` den tatsächlichen Nachweisstand. `blocked` bedeutet fehlende Spielquellen; `open` bedeutet noch nicht nachgewiesen; `deferred` ist ausschließlich für die drei persönlichen Endabnahmen erlaubt. Kein Punkt ist derzeit als bestanden markiert.

## Befehle

```bash
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node --test project-c/pppoppi-imperium/prerelease/test.mjs
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Die ersten beiden Prüfungen dürfen trotz offener Aufgaben **PASS** liefern: Sie prüfen nur die Matrix und den Schutz vor Scheinfreigaben. `--technical` muss bis zum echten technischen Abschluss mit Exitcode **1 (BLOCKED)** enden; Strukturfehler liefern **2 (FAIL)**. Ein grüner Matrix-Workflow ist ausdrücklich **keine** grüne Spielprüfung. Der Quellimport-Workflow aus PR #14 ist eine zusätzliche, unabhängige Sperre.

Ein Status `pass` ist nur mit mindestens einer regulären JSON-Datei unter `project-c/pppoppi-imperium/prerelease/evidence/` zulässig. Diese muss `gate_id`, `result: PASS`, vollständigen Commit-SHA, tatsächlichen Prüfbefehl und Datum enthalten. Der Prüfer kontrolliert Form und Existenz, **nicht** die Wahrheit des Testberichts; unabhängiger Review und GitHub-CI bleiben zwingend. Vor jeder Statusänderung tatsächlich testen und den Bericht am unveränderten Commit erzeugen.

## Stand und nächstes Arbeitspaket

1. **PR #14**: 185 Spielquellen aus dem eindeutig geprüften V1.9.4-Paket mit Manifest sicher importieren; keine historischen Originaldateien veröffentlichen. Quelle und Prüfsumme mit dem Originalpaket vergleichen.
2. Alle acht Fach-/Langzeitprüfprogramme auf dem importierten Stand in GitHub Actions ausführen; Browserabweichungen und Speicher-/Sicherheitsprüfungen ergänzen.
3. Vollständige Partien, Grafik, 800×600, Skalierung, Tastatur, Offline-Start, Ressourcen und Dokumentation nach Matrix belegen; erst danach Release-Kandidat einfrieren. **Persönliche Sichtprüfung und Kubuntu-Endabnahme erst anschließend gesammelt. Release nur nach ausdrücklicher Nutzerfreigabe.**

**Keine Überschneidung:** Diese Änderung bearbeitet ausschließlich neue Dateien im Ordner `prerelease/` und einen eigenen Workflow. Sie verändert weder die Wiederherstellung aus PR #14 noch den C64-Forschungs-/Prototypenstapel. Der neue Änderungsantrag ist auf den PR-14-Zweig zu richten (gestapelt), nicht direkt auf `main`.
