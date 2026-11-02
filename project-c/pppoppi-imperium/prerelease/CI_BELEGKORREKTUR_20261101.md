# Vorrelease – Korrektur zweier historischer CI-Nachweise (01.11.2026)

## Festgestellter Unterschied
Die bisherigen Nachweise BAL-02 und BAL-03 verwiesen auf historische GitHub-Workflows, deren erfolgreich abgeschlossener Schritt zwar die Balance- bzw. Krisensimulation, aber **noch nicht** den jeweils im Nachweis genannten eigenstaendigen Berichtstest enthielt. Diese Zusatzbehauptung war durch die urspruenglichen CI-Links nicht gedeckt.

## Belegkorrektur
Beide Nachweise verweisen nun auf [GitHub-Actions-Lauf #41285485847](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41285485847), HEAD `7ecbd3654e381702e25a59230ed62a318b3784d5`, Job `124785795949`, Schritt `Wirtschaftliche Fachprüfungen`. GitHub meldet fuer den Lauf und diesen Schritt **completed/success**. Die zugehoerige versionierte [Workflow-Datei](https://github.com/provoware/PROJEKT_Oli_Imperium/blob/7ecbd3654e381702e25a59230ed62a318b3784d5/.github/workflows/pppoppi-imperium-recovery.yml) enthaelt im Arbeitsverzeichnis `project-c/pppoppi-imperium/SPIEL` sowohl `node evaluate_balance_v194.cjs` und `node ../quality_v194/test_balance_report_v194.cjs` als auch `node analyze_stress_v194.cjs` und `node ../quality_v194/test_stress_report_v194.cjs`. Die Schritte sind durch `set -e` gegen unbemerkte Fehler abgesichert.

Die zwei JSON-Nachweise erhalten `ci_expected_commands` und `ci_working_directory`, damit ein kuenftiger automatischer Abgleich auf **tatsaechliche Einzelbefehle** statt nur Jobnamen moeglich wird. Ein Regressionstest verhindert versehentliches Zuruecksetzen der korrigierten Belege. Der bestehende Live-Pruefer kontrolliert weiterhin GitHub-Lauf, Commit, Job und Schritterfolg; **ein automatischer Vergleich aller Einzelbefehle ist noch offen**.

## Reproduzierbare Befehle
```bash
node --test project-c/pppoppi-imperium/prerelease/test.mjs
node project-c/pppoppi-imperium/prerelease/verify_ci_evidence.mjs
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

**Status:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED; kein neues PASS durch die Korrektur. Gesamtfreigabe weiterhin BLOCKED. Keine Spielregel-, Speicher- oder Hauptzweig-Aenderung; kein Merge, kein Release. Nächste unabhaengige Pflichtarbeit: Workflow-Quelltext auf historischem SHA automatisch mit `ci_expected_commands` abgleichen und Negativtests ergaenzen.
