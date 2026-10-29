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

**Erster tatsächlich geprüfter GitHub-Lauf:** [KI-Strategie-CI #40892632809](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40892632809) auf HEAD b57e40a97bb0fa7eca750d6d6c3dde69d2ebd3dd: **PASS** für Rechentests, 864 Baseline-Monate, 432 Profilrotations-Monate, den neuen Reservevergleich (16 Läufe / 576 Monate) und Artefakt-Upload. [Maschinenlesbare Ergebnisse](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40892632809/artifacts/12904849318). Dieser CI-Lauf belegt den ersten Test-HEAD, **nicht automatisch den nachfolgenden Dokumentations-HEAD**. BAL-01 bleibt BLOCKED.

### Tatsächliche Gegenvergleichsergebnisse

Gegenüber dem unveränderten Logistikadapter wurden **18 Firmen-/Szenario-/Zuordnungs-Vergleiche** berechnet. Die Kontrollzuordnung war in beiden Szenarien **exakt identisch** mit dem unveränderten Produktionsadapter; alle 16 Simulationsläufe bestanden die Wiederholbarkeitsprüfung. Bei der ersten Reserve-Rotation und bei der neutralen 40.000-€-Reserve waren sämtliche Ergebnisdifferenzen null. Nur die zweite Rotation zeigte messbare Abweichungen:

| Markt / Rotation 2 | A1 (40.000 €) | A2 (58.000 €) | A3 (30.000 €) |
|---|---:|---:|---:|
| Normal: Änderung Kasse minus Schulden | +2.347,95 € | −130,25 € | 0 € |
| Niedriger Preis: Änderung Kasse minus Schulden | +6.155,19 € | −12.191,81 € | 0 € |
| Änderung Feldbesitz, beide Märkte | 0 | 0 | 0 |

**14 von 18 Vergleichszeilen hatten null Änderung** der liquiden Nettoposition. Die Logistikreserve ist unter diesen Ausgangsbedingungen **für A1/A2 teilweise wirksam**, erklärt aber die fehlenden A3-Feldkäufe nicht. Die Zahlen beweisen weder, dass die Reserve die alleinige Ursache ist, noch eine allgemeine Strategieüberlegenheit. Weitere Versuche müssen Startposition, Kapital, Investitionsrentabilität und Konkurrenzverhalten voneinander abgrenzen.

## Grenzen und offene Pflichten

Ein Austausch der Logistikreserven bei festen Firmen-IDs ist **kein** allgemeiner Beweis für Fairness, Gewinn oder überlegene Strategie. Wettbewerber reagieren aufeinander; die zwei menschlichen Verläufe sind geskriptet. Kasse minus Schulden ist kein buchhalterischer Gewinn und bewertet weder Felder noch Vorräte. Die historischen C64-Regeln und die Rechte für 77 ausgeschlossene Archivdateien bleiben unbestätigt. Geschützte Originaldateien werden nicht verändert.

## Nächste drei Schritte

1. CI des endgültigen HEAD prüfen; bei FAIL zunächst Original-Parität und Adapter-Wiederherstellung korrigieren, dann erneut testen.
2. Gegenvergleiche nach Firmen-ID auswerten und Vermögens-/Gewinnkennzahlen sowie Schulden- und Sanierungsfälle als getrennte Pflichtprüfungen ergänzen.
3. Unabhängig davon historische C64-Referenz und Einzelrechte der 77 ausgeschlossenen Archivdateien nachweisen; persönliche Endabnahme erst nach technischem Vorrelease-Freeze.

**Keine Änderung an main, kein Merge, kein Release.**
