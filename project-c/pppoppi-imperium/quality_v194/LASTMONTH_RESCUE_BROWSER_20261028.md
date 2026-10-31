# Vorrelease-Pflichtpaket: natuerliche Insolvenz im Schlussmonat

**28.10.2026, 22:36 MEZ.** Projekt C / eigenstaendige PPPOPPI-Adaption, V1.9.4-Technikfassung. Kein historischer C64-Vergleich, kein Merge, kein Release.

## Verbindliche Vorpruefung

- `main`: `d3dc371154cc1089e06f34d0dc4ff04047132360` (unveraendert).
- Vorheriger Entwurfs-PR [#119](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/119), HEAD `563433262ce7b60fec6e2cd37617a9c12cd07de4`.
- [Browser-CI #40764979388](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40764979388) auf #119: **7/7 Jobs PASS**; [Quell-CI #40764979299](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40764979299): **PASS**. [Gesamtgate #40764979455](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40764979455): **FAIL/BLOCKED** (offene Matrix).
- AGENTS.md, README, Forschungs-/Uebergaberegeln, 52er-Matrix, Endspieladapter, Wirtschaftskern und Browser-Testpfade geprueft. Keine Aenderung an den 110 manifestgeschuetzten Originaldateien.

## Risiko und Sollverhalten

PR #119 beweist eine Insolvenz in Monat 1 und anschliessende verlorene Kampagne. Ungeprueft ist die zeitliche Grenzlage **Insolvenz genau beim zwölften und letzten Monatsabschluss**. Die Kampagne darf eine offene Sanierung weder voreilig archivieren noch einen dreizehnten Monat erlauben. Erst nach regulaerer Sanierung muss die Endwertung genau einmal erfolgen.

## Testimplementierung

- Eigenstaendiger echter Offline-Chromium-Test `test_browser_campaign_lastmonth_rescue_v194.py`, isolierter CI-Job `browser-campaign-lastmonth-rescue`.
- Vier menschliche Firmen ohne KI: 11 Monate regulaere Monatsabschluesse mit jeweils vier UI-Zuegen und exakt 90.000 Cent Monatslohn je Firma. Keine Eingriffe in Spielstand oder Wirtschaftskern.
- Im zwölften Monat acht echte Wirtschaftsaktionen ueber sichtbare Schalter: zwei gekaufte Felder, eine Bohrung, drei Gutachten, zweimal Objektschutz. H1 hat anschliessend 70.000 Cent statt 140.000 Cent Lohn und Wartung.
- Der regulaere Monatsabschluss erzeugt genau 70.000 Cent Rueckstand, `RESCUE` und **noch kein Archiv**. Versionierter Export der offenen Sanierung, echter Chromium-Prozessneustart, exakter Import.
- Echter `RESTART`-Schalter fuehrt zu Generation 2, exakt 12 Monatsberichten, Endwertung und Schreibsperre. Zweiter Archivexport, erneuter Prozessneustart und unveraenderte Wiederherstellung.
- 800×600, keine externen HTTP-/HTTPS-Anfragen, keine JavaScript-Laufzeitfehler. Die geschuetzten 110 Originaldateien werden im isolierten Aufbau hashgeprueft.

## Pruefstatus vor neuer GitHub-CI

| Pruefung | Status |
|---|---|
| Neuer Chromium-Schlussmonatstest | PENDING |
| Alle bisherigen Browserregressionen auf neuem HEAD | PENDING |
| Quellschutz / 110 Originaldateien | PENDING |
| Historische C64-Referenz | BLOCKED |
| Gesamt-Vorrelease-Gate | BLOCKED |

**Pflichtmatrix:** 6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED = 52. Betroffen: `VER-01`, `VER-02`, `LOG-05`, `SPE-03`, `TES-03`; Teilnachweis, kein Statuswechsel. Keine vorgezogene persoenliche Sicht- oder Kubuntu-Abnahme.

## Naechste drei Schritte

1. CI am finalen Entwicklungs-HEAD vollstaendig auswerten und FAILs gezielt korrigieren.
2. Mehrfachinsolvenz zweier menschlicher Firmen im selben Abschlussmonat mit sequentieller Sanierung pruefen.
3. Verbleibende Wirtschaftszweige, Langzeit-/Ressourcenpruefungen und historische Referenzluecken nach Pflichtmatrix abarbeiten.

**Empfehlung:** Die zeitliche Grenzlage ist eine eigene Regression, keine pauschale Freigabe der Niederlagenlogik.
