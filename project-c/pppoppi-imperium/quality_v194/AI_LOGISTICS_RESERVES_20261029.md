# BAL-01 – Kontrollierter Gegenvergleich der KI-Logistikreserven (29.10.2026)

**Status: technischer Test eingebaut; GitHub-CI auf dem endgültigen Entwicklungs-HEAD vor Bewertung prüfen. Keine Vorrelease-Freigabe.**

## Problem und Prüffrage

Die Baseline (PR #135) und der strategische Profiltausch (PR #136) zeigen bei A3 im Normalmarkt null Felder und null strategische Aktionen. Die Logistik-KI setzt eigene, an Firmen-IDs gebundene Mindestkassen voraus. **Frage:** Ändert ein gezielter Austausch dieser Logistikreserven bei unveränderten strategischen Profilen, Firmen-IDs und Zugreihenfolge die Wirtschaftskennzahlen? Eine fehlende Veränderung ist ebenfalls ein gültiger Befund.

## Kontrolliertes Verfahren

Testdatei: test_ai_logistics_reserves_v194.cjs. Das Originalmodul SPIEL/src/strategy_logistics_v193.js wird **nur gelesen**; die exakt erwartete Reserve-Zuweisung wird ausschließlich in einem isolierten JavaScript-Arbeitsspeicher ersetzt. Bei einer veränderten Quellstelle bricht der Test ab. Der bereits geladene Logistikadapter wird während des Versuchs deaktiviert, damit die Logistik **nicht doppelt** ausgeführt wird. Danach werden der originale Adapter und der ursprüngliche E.transition-Funktionsverweis in jedem Fehler- und Erfolgsfall wiederhergestellt.

| Zuordnung | A1 | A2 | A3 |
|---|---:|---:|---:|
| Original | 58.000 € | 30.000 € | 40.000 € |
| Rotation 1 | 30.000 € | 40.000 € | 58.000 € |
| Rotation 2 | 40.000 € | 58.000 € | 30.000 € |
| Neutral | 40.000 € | 40.000 € | 40.000 € |

Alle Zahlen sind **Liquiditätsreserven**, keine Gebühren und keine belegten C64-Originalwerte. Sie stammen aus dem unveränderten V1.9.3-Modul.

- Zwei vorhandene Szenarien: aktiver Mensch bei Normalmarkt und bei niedrigem Preis.
- Vier Reserve-Zuordnungen je Szenario, jeweils **zweimal exakt wiederholt**: 16 Engine-Läufe und 576 Spielmonate.
- **Pflicht-Invariante:** Die in den Arbeitsspeicher geladene Original-Zuordnung muss je Szenario exakt dieselben Spielresultate erzeugen wie der unveränderte Produktionsadapter. Bei Abweichung FAIL; die Gegenvergleiche wären dann nicht belastbar.
- Pro Firmen-ID: Veränderung Kasse minus Schulden, Endkasse, Schuldenmaximum, Felder, strategische und logistische Aktionen. 18 Vergleichszeilen gegenüber der Original-Zuordnung.
- Der Test verlangt Reproduzierbarkeit und Wiederherstellung der originalen Spielfunktion, **aber keine vorab erfundene wirtschaftliche Verbesserung**.

## Ausführung und Nachweise

    node --check project-c/pppoppi-imperium/quality_v194/test_ai_logistics_reserves_v194.cjs
    node project-c/pppoppi-imperium/quality_v194/test_ai_logistics_reserves_v194.cjs > ai_logistics_reserves.json
    node project-c/pppoppi-imperium/prerelease/check.mjs --schema

GitHub-Prüfablauf: .github/workflows/prerelease-ai-strategy-metrics.yml. Er bewahrt die JSON-Ausgabe zusammen mit Baseline und strategischem Profiltausch als zeitlich begrenztes Prüfarbeitsprodukt auf.

**Ergebnisstatus bei Erstellung:** GitHub-CI und exakte Gegenvergleichswerte **PENDING**, nicht PASS. Nach dem endgültigen CI-Lauf HEAD-SHA, Lauf-Link, PASS/FAIL und messbare Differenzen nachtragen. BAL-01 bleibt **BLOCKED**, auch bei erfolgreichem technischen Einzeltest.

## Grenzen und offene Pflichten

Ein Austausch der Logistikreserven bei festen Firmen-IDs ist **kein** allgemeiner Beweis für Fairness, Gewinn oder überlegene Strategie. Wettbewerber reagieren aufeinander; die zwei menschlichen Verläufe sind geskriptet. Kasse minus Schulden ist kein buchhalterischer Gewinn und bewertet weder Felder noch Vorräte. Die historischen C64-Regeln und die Rechte für 77 ausgeschlossene Archivdateien bleiben unbestätigt. Geschützte Originaldateien werden nicht verändert.

## Nächste drei Schritte

1. CI des endgültigen HEAD prüfen; bei FAIL zunächst Original-Parität und Adapter-Wiederherstellung korrigieren, dann erneut testen.
2. Gegenvergleiche nach Firmen-ID auswerten und Vermögens-/Gewinnkennzahlen sowie Schulden- und Sanierungsfälle als getrennte Pflichtprüfungen ergänzen.
3. Unabhängig davon historische C64-Referenz und Einzelrechte der 77 ausgeschlossenen Archivdateien nachweisen; persönliche Endabnahme erst nach technischem Vorrelease-Freeze.

**Keine Änderung an main, kein Merge, kein Release.**
