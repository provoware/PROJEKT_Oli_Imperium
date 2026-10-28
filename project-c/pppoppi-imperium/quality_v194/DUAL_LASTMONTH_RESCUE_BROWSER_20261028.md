# Vorrelease-Pflichtpaket: zwei gleichzeitige Insolvenzen im Schlussmonat

**28.10.2026, 23:38 MEZ.** PPPOPPI IMPERIUM, Projekt C, isolierte V1.9.4-Technikfassung. Keine C64-Originalbehauptung, keine Freigabe.

## Vorpruefung

- GitHub-`main`: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Ausgangspunkt: [Entwurfs-PR #120](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/120), HEAD `3895d5c5efd366d29d1318a279d2daa20be9e610`.
- Auf #120: [Browser-CI #40773819268](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40773819268) **8/8 PASS**; [Quell-CI #40773819308](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40773819308) **PASS**; [Gesamtgate #40773819527](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40773819527) **FAIL/BLOCKED** wegen offener Vorrelease-Pflichten.
- AGENTS.md, README, A/B-Forschungsgrenzen, 52er-Matrix, Browser-Sanierungstests, Original-Engine und Endspieladapter geprueft. Die bereits existierende Zwei-Menschen-Regression prueft gleichzeitige Insolvenzen **in Monat 1**, nicht den Endspiel-Grenzfall in Monat 12.

## Risiko und pruefbares Soll

Zwei menschliche Firmen werden durch **echte Wirtschaftsklicks** erst im letzten Kampagnenmonat insolvent. Die erste Rettung darf weder die zweite Firma veraendern noch die Kampagne vorzeitig abschliessen. Ein Neustart zwischen beiden Sanierungen darf den offenen Zustand nicht verlieren. Erst nach beiden Sanierungen ist **genau eine** Endwertung mit **genau 12** Berichten zulaessig. Nach dem Archiv duerfen keine weiteren Buchungen stattfinden.

## Umsetzung

- `quality_v194/test_browser_campaign_dual_lastmonth_v194.py`: eigenstaendiger echter Offline-Chromium-Test, 800×600, vier Menschen, 11 regulaere Monatsabschluesse.
- Monat 12: H1 und H2 geben jeweils 18.940.000 Cent ueber je acht sichtbare Wirtschaftsschalter fuer getrennte Felder aus; verbleiben jeweils 70.000 Cent vor der 140.000-Cent-Monatsrechnung. Kein synthetischer Spielstand.
- Nach dem gemeinsamen Monatsabschluss: `rescueIds = ["H1","H2"]`; H1-Rettungskredit, H2 noch offen, versionierter Sitzungsexport, **echter Prozessneustart**, H2-Sanierungsneustart, Endwertung und Archivexport, erneuter Prozessneustart und Archivvergleich.
- Neuer unabhaengiger CI-Prueflauf: `.github/workflows/prerelease-dual-lastmonth.yml`. Bestehende Browserjobs und Quellschutz laufen ebenfalls auf dem PR. Die 110 manifestgeschuetzten Originaldateien werden nicht bearbeitet.

## Status / Nachweise

| Pruefung | Stand |
|---|---|
| Vorherige 8 Browserjobs auf #120 | PASS |
| Vorherige Quellpruefung auf #120 | PASS |
| Neuer Doppelsanierungs-Browsertest | PENDING bis GitHub-CI auf neuem HEAD |
| Bestehende Regressionen auf neuem HEAD | PENDING |
| Historische Originalreferenz | BLOCKED |
| Technische Vorrelease-Gesamtfreigabe | BLOCKED |

**Pflichtmatrix:** unveraendert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Neuer Teilnachweis fuer `VER-01`, `VER-02`, `LOG-05`, `SPE-03`, `TES-03`; keine voreilige Statusaenderung.

## Naechste drei Schritte

1. GitHub-CI am finalen Entwicklungs-HEAD pruefen, fehlgeschlagene Tests gezielt korrigieren und PASS/FAIL/BLOCKED hier dokumentieren.
2. Kombination aus mehreren Insolvenzarten (Kredit, Verkauf, Neustart) und Unterbrechungen im letzten Monat weiter absichern.
3. Wirtschaft, Ressourcen, historische Referenz und weitere offene Pflichten aus der Matrix priorisiert abarbeiten.

**Empfehlung:** Erst nach gruener echter Browser-CI ist dies ein gueltiger *Teilnachweis*, niemals ein allgemeines Release-PASS. Persoenliche Sichtpruefung und Kubuntu-Abnahme bleiben bis zum eingefrorenen Kandidaten zurueckgestellt.
