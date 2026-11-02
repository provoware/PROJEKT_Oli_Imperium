# Integrationsprobe: main + Projekt C / PR #140 (31.10.2026)

**Zweck:** Prüfkandidat auf getrenntem Zweig, **keine** Freigabe, **kein** Merge nach `main`.

## Geschützte Ausgangs-Commits

- `main`: `e333819bbe505023995773c0d5c66eedc444bde9` – drei aktuelle, gegenüber der gestapelten Projekt-C-Kette exklusive Governance-/Dokumentationscommits bleiben im **ersten Elternzweig** der Integration enthalten.
- Projekt-C-Entwicklung: `28b641367e1435af4f4f82c39e4046567eb6c0c0` (PR #136 → PR #137 → PR #140) – vollständige Entwicklergeschichte bleibt als **zweiter Elternzweig** erhalten. Chromium-Gesamtworkflow [#41143153334](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41143153334) auf diesem Eltern-Commit: **8/8 SUCCESS**; vorherige Erstversuchs-Timeouts des nativen Dateiauswahldialogs bleiben als Stabilitätsrisiko dokumentiert.
- Der Integrationstree übernimmt **alle Dateiobjekte des Projekt-C-HEADs** außer den vier unten explizit aus dem heutigen `main` wiederhergestellten Dateien. Neue Konflikte werden nicht stillschweigend mit einem ganzen alten Projektstand überschrieben.

## Verbindlich von main erhalten (Git-Blob-SHA)

| Datei | SHA aus main | Schutzinhalt |
| --- | --- | --- |
| `AGENTS.md` | `785abce3f9439d6bce7027cf8b307eb063f5a0b5` | Draft-PR-Schuldenbremse, Kontrollpflicht, Schutzregeln |
| `CONTRIBUTING.md` | `704a89dc405e5e183ce0cd9e88d0a08a662ef80d` | eigene fachliche Abnahme statt vorgeschriebenem Fremdreview |
| `.github/workflows/validate.yml` | `6c5876aac8181129059dd9ee098477d91efe504d` | Markdown-/Verweisprüfungen und bestehende Forschungs-Tests |
| `docs/28_REPOSITORY_STANDABGLEICH_20261025.md` | `25e8aed34dc62d78104bea5dbc5da1c706ae6a89` | historischer Nachweis (nicht mit heutigen Zahlen verwechseln) |

**Bewusst unverändert:** geschützte 110 Originaldateien `SPIEL/**`, Spielkern, Wirtschaft, IndexedDB, PR-#140-Diagnose, 52-Pflichten-`prerelease/matrix.json` und Asset-Rechte-Sperre.

## Prüfvertrag

1. Git-Basis: Integration muss **beide Eltern-Commits** enthalten, ohne `main` zu verändern. `main`-Governance-Dateien müssen obige exakte Blob-SHAs aufweisen.
2. Bestehende Forschungsprüfungen: `python3 tools/validate_project.py`; `python3 -m unittest discover -s tests -v`; neue `validate.yml` prüft Markdown und lokale Links. Fehler sind real und **nicht** durch Entfernen des Workflows zu umgehen.
3. Projekt-C: 110 SHA-geschützte Quellen, Build-/UI-/Importsicherheitschecks, echte Chromium-End-to-End-Prüfungen einschließlich 175/200-%-Dateiauswahl und KI-/Fracht-/Endspiel-/Speicher-Regressionsläufe auf **diesem finalen Integrations-SHA**. Grüne Prüfungen aus den Eltern sind Vorabnachweise, **keine** automatische Integrationsabnahme.
4. Kein Release: Pflichtmatrix **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Rechtsgrundlage der 77 ausgeschlossenen Archivdateien (73 PNG, 2 PDF, 1 ZIP, 1 TXT) ungeklärt, `runtime_asset_manifest.json` weiterhin leer. Mengenbilanz, Umsatz und Kassenzahl sind noch kein fachlich bewerteter Gewinn bzw. Vermögensnachweis.
5. Für die Browser-Workflows sind derzeit `pull_request` und `workflow_dispatch` statt beliebiger Pushes konfiguriert. **Daher bedeutet das Erstellen dieses Zweigs allein keine Chromium-Abnahme**; sie muss getrennt nachweisbar auf diesem SHA ausgelöst und vollständig ausgewertet werden. Kein unnötiger neuer Draft-/Merge-PR allein für die Statistik.

**Entscheidung:** Technischer Integrationskandidat, `main` und bestehende Entwürfe bleiben unverändert, bis die vollständige unabhängige Freigabematrix bestanden ist.
