# Vorrelease-Teilpaket: natuerliche Insolvenz bis zur verlorenen Kampagne

**28.10.2026, 21:35 MEZ.** Projekt C, ausschliesslich eigenstaendige PPPOPPI-Adaption. Kein Nachweis historischer C64-Regeln, keine Releasefreigabe.

## Basis und Vorpruefung

- Vorheriger Entwurfs-PR [#118](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/118), HEAD `4fec4e17f93709145afbc4c0d967964204abf431`.
- `main`: `d3dc371154cc1089e06f34d0dc4ff04047132360`, unveraendert.
- [Browser-CI #40755941706](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40755941706): sechs von sechs Jobs PASS; [Quell-CI #40755941735](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40755941735): PASS. [Gesamtgate #40755941808](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40755941808): FAIL/BLOCKED wegen offener Pflichten.
- AGENTS.md, README, Quellen-/Test-/Uebergaberegeln und die 52er-Matrix gelesen. Keine Originalquelle wird veraendert.

## Problem und erwartete Wirkung

Eine erfolgreiche 12-Monats-Endpartie aus PR #118 prueft nicht, ob ein menschlicher Spieler nach einer **natuerlich eingetretenen Insolvenz** seine Kampagne fortsetzen, nach dem Spielende eine **niedrigere Wertung** erhalten und die abgeschlossene Verlustpartie ohne Datenverlust wiederherstellen kann. Dieser fehlende kombinierte Pfad ist ein Teil der weiterhin gesperrten Pflichten VER-01, VER-02, VER-03, SPE-03 und TES-03.

## Implementierung

- Neuer eigenstaendiger Browser-Test `quality_v194/test_browser_campaign_insolvency_v194.py` und CI-Job `browser-campaign-insolvency`.
- Start mit zwei Menschen und zwei Computerfirmen, Kampagnenvertrag 12 Monate, 800x600.
- Acht tatsaechliche UI-Wirtschaftsaktionen erzeugen 60.000 Cent Restkasse; der reguläre Monatsabschluss erzeugt 80.000 Cent offene Forderungen und die Sanierungsphase. **Kein manipulierter Testspielstand.**
- Versionierter Sitzungsexport **waehrend offener Sanierung**, vollstaendiger Chromium-Prozessneustart, exakter Import, anschliessender Sanierungsneustart von H1 in Generation 2.
- Reguläre Monatsabschluesse bis Monat 12 mit beiden menschlichen Zuegen und den Computerfirmen. Am Ende muss H1 nach der Insolvenz gegenueber H2 verlieren. Siegerliste und Rangpunkte werden aus dem echten Endarchiv gelesen, nicht als Testwert vorgegeben.
- Schreibsperre, Archivexport und erneuter Chromium-Prozessneustart mit exakter Wiederherstellung; keine Netzanforderungen oder JavaScript-Laufzeitfehler.
- Bestehende `test_browser_campaign_endgame_v194.py` bleibt unveraendert. Alle 110 geschuetzten Quelldateien bleiben unveraendert.

## Pruefprotokoll

| Pruefung | Ergebnis vor neuem CI-Lauf |
|---|---|
| Neue Verlust-Endpartie und beide Wiederherstellungen | PENDING |
| Browser-Regression, Quellschutz und Aufbau | PENDING |
| Historische C64-Originalverifikation | BLOCKED |
| Technisches Vorrelease-Gesamtgate | BLOCKED |

Aufruf: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_insolvency_v194.py` (Playwright 1.56.0 und Chromium). Der eigenstaendige GitHub-CI-Job ist massgeblich; ein erfolgreicher Test darf nicht als komplette Verlust- oder Releaseabnahme missverstanden werden.

**Matrix:** 6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED = 52. VER-02 bleibt BLOCKED, weil weitere Niederlagen-/Ausscheidensregeln, Konstellationen und historische Referenzbelege fehlen. Persoenliche Sichtpruefung und Kubuntu-Praxistest bleiben bis zum eingefrorenen, technisch vollstaendigen Kandidaten zurueckgestellt.

## Naechste drei Schritte

1. Eigenstaendigen Browser-Job und alle weiteren GitHub-Pruefungen am finalen HEAD auswerten; jeden FAIL konkret beheben und erneut pruefen.
2. Weitere Niederlagen-/Insolvenz-Konstellationen, insbesondere mehrere betroffene Firmen und Sanierung im Schlussmonat, mit echter Oberflaeche absichern.
3. Langzeit-, Speicher-, Ressourcen- und Originalreferenzluecken der Matrix schrittweise schliessen, ohne die Freigabesprerre zu umgehen.

**Empfehlung:** Nachweis einer verlorenen Kampagne ist ein notwendiger Teilfall, aber keine pauschale Abnahme der gesamten Niederlagenlogik.
