# BAL-01 – KI-Strategien: messbare Ausgangsbasis (29.10.2026)

**Geltungsbereich:** Projekt C, V1.9.3-Spielkern mit V1.9.4-Prüfschicht. **Keine** historische C64-Originalaussage und **keine** Release-Freigabe.

## Warum diese Änderung?
Der bestehende 12-Monats-Chromium-Test aus PR #134 bestätigt die Ausführung beider KI-Firmen, aber nicht ihren wirtschaftlichen Erfolg. Der vorhandene Balancebericht erfasst nur einzelne Jahresstände und die Anzahl der Entscheidungen. Eine systematische quantitative Vergleichsbasis für Gewinnnähe, Zahlungsfähigkeit und Risiko fehlte.

## Neuer reproduzierbarer Pflichtversuch
- **4 Szenarien**: passiver Mensch bei Normalmarkt, aktiver deterministischer Mensch bei Normalmarkt, niedriger Nachfrage (45 %) und niedrigem Preis (52 %).
- **3 feste Startkennungen je Szenario**: alpha, beta, gamma. **36 Monate** je Partie. **12 verschiedene Partien**, jede zweimal mit denselben Startparametern und identischem Ergebnis überprüft: 24 Simulationen / 864 simulierte Monate.
- KI-Profile: A1 vorsichtig, A2 wachstumsorientiert, A3 handelsorientiert. Sie verwenden unverändert den regulären Spielkern und die vorhandenen Strategie-/Logistikmodule.
- **Pro Monat und Firma**: Kasse, Schulden, liquide Nettoposition (Kasse minus Schulden), Besitzfelder und Sanierungen. Daraus: Veränderung der Nettoposition, kleinste Kasse, höchste Schulden, größter Rückgang der Nettoposition von einem vorherigen Höchststand, Monate unter dem profilspezifischen Liquiditätspuffer, Schlussfelder und Sanierungen.
- **Unveränderte Sicherheitsregeln**: Spielzustandsvalidierung nach Monatswechsel, echte Aktionen statt direkter Geldmanipulation, Schutz vor Endlosschleifen bei Sanierungen.
- Der Workflow führt drei eigenständige Rechen-/Grenzfalltests aus und speichert die vollständigen Zahlen als GitHub-Artefakt `ai-strategy-baseline` (14 Tage).

## Tatsächlicher erster GitHub-Zahlenlauf und wesentlicher Befund

[GitHub Actions #40875012540](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40875012540) auf HEAD `466b1fea63863ec688daca592baa9453e995cdc2`: **PASS** (3/3 Rechen-Grenzfalltests; 24 tatsächliche Simulationsläufe, 864 Monate; JSON-Artefakt gespeichert). Dies ist der geprüfte **erste** Stand, nicht automatisch der finale Entwicklungs-HEAD.

**Wichtige Entdeckung:** Trotz dreier verschiedener Startkennungen sind die Wirtschaftskennzahlen je Szenario **identisch**. Somit existieren bislang nur **vier unterschiedliche beobachtete Wirtschaftsergebnisse**, nicht zwölf unabhängige Stichproben. Die Startkennungen sind im geprüften Ablauf kein Nachweis für wirtschaftliche Variation. Der Prüfer gibt diese Zahl künftig ausdrücklich als `distinctEconomicOutcomes` aus.

| Szenario | A1: Änderung Kasse minus Schulden | A2 | A3 |
|---|---:|---:|---:|
| Passiv / normal | +748.392,91 € | +730.182,38 € | +832.872,33 € |
| Aktiv / normal | +655.736,72 € | +160.460,39 € | −32.400,00 € |
| Aktiv / geringe Nachfrage | +676.924,99 € | +163.349,77 € | −32.400,00 € |
| Aktiv / niedriger Preis | +58.483,03 € | −71.722,11 € | −32.400,00 € |

**Gezielte Folgerung:** A3 besitzt in allen aktiven Szenarien am Ende **0 Felder**; A2 besitzt nur **1 Feld**, während A1 **3 Felder** hält. Beim niedrigen Preis ist A2s liquide Nettoposition rückläufig. In diesen Szenarien treten bei den KI-Firmen **keine Schulden und keine Sanierungen** auf: Diese Risikoarten sind hier nicht wirksam geprüft. Die Ursachen (Startreihenfolge, Preisgrenzen, KI-Strategie, Konkurrenzverhalten) sind noch offen und dürfen nicht voreilig der Profilkonfiguration zugeschrieben werden.

## Interpretation – ausdrücklich begrenzt
Die Veränderung von **Kasse minus Schulden ist kein buchhalterischer Gewinn**: Investitionen, Feldwerte, Produktionsbestände und Marktanteile sind nicht bewertet. Firmen-IDs und Zugreihenfolge sind fest an die Profile gebunden; der Vergleich ist daher **beobachtend und nicht kausal**. Die menschlichen Züge folgen einem festen Skript, nicht menschlichem Spielverhalten. Gleiche Kennung bedeutet reproduzierbare Bedingungen, nicht unabhängige statistische Zufallsstichproben. Die Kennzahlen zeigen Risiken und Prüfbedarf, aber keine bewiesene faire Balance. Die drei Startkennungen erzeugten im ersten Test pro Szenario keine unterschiedlichen Wirtschaftsergebnisse; deshalb ist der effektive Ergebnisnenner kleiner als die Zahl der Simulationsläufe.

## Prüfbefehle
```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_strategy_metrics_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_ai_strategy_metrics_unit_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_strategy_metrics_v194.cjs > ai_strategy_baseline.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

**Stand nach erstem Lauf:** Die ursprüngliche CI hat bestanden. Nach Ergänzung der Kennzahl für tatsächlich unterschiedliche Wirtschaftsverläufe muss die CI auf dem **neuen endgültigen Entwicklungs-HEAD** erneut bestehen. Bis dahin ist die neue Variante nicht als PASS freigegeben. `BAL-01` bleibt **BLOCKED**, bis reale Zahlen geprüft, Varianten kontrolliert verglichen und Verbesserungen mit Gegenversuchen nachgewiesen sind. Die technische Gesamtmatrix bleibt bei **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. Die 110 geschützten Originaldateien werden nicht geändert.

## Drei nächste Schritte
1. GitHub-Lauf und Zahlenartefakt auf endgültigem HEAD prüfen, Auffälligkeiten und eventuelle Fehler beheben.
2. Bei begründeter Schwäche ein isoliertes, risikoarmes Strategieprofil-Experiment mit gleichen Startbedingungen, Gegenversuch und Nettoeffekt durchführen; niemals bloße Aktionszahlen als Nutzen verkaufen.
3. Weitere KI-Stressfälle (Sanierung, Engpässe, Verträge) und Rechte-/C64-Blockaden unabhängig abarbeiten; persönliche Abnahmen erst nach vollständig geprüfter Technik.

**Empfehlung:** Erst Zahlen und Unsicherheit dokumentieren, dann gezielt optimieren. Kein Merge und kein Release.
