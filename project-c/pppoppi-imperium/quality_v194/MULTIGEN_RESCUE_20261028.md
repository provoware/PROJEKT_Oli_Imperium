# Mehrgenerationen-Sanierung – technischer Teilnachweis

**28.10.2026 · Projekt C / PPPOPPI IMPERIUM V1.9.4 · Vorrelease BLOCKED**

## Ausgangslage und Abhaengigkeiten

- `main` vor der Arbeit: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Getrennte Basis: [PR #104](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/104), HEAD `979e87130ec3ceaccb6e6dd0a7b78719b443580f`.
- Aenderungen: nur neuer Engine-Regressionstest, Browser-CI-Aufruf, maschinenlesbarer Teilnachweis, Matrix und dieser Bericht. **Keine geschuetzte Original-Spielquelle geaendert.**
- Die historische C64-Regelbasis bleibt ungeklaert; dies ist ausschliesslich ein technischer Test der vorhandenen PPPOPPI-Adaption.

## Reproduzierbarer Test

```sh
node project-c/pppoppi-imperium/quality_v194/test_multigeneration_rescue_v194.cjs
```

1. Zwei Menschen, keine KI, regulaerer Spielstart; acht echte Wirtschaftsaktionen von H1 verbrauchen Geld und Spieltage.
2. Erster echter Monatsabschluss: H1 hat 80.000 Cent Rueckstand; Sanierungsneustart zu Generation 2 und Freigabe der H1-Felder.
3. Exakter JSON-Rundlauf des Berichts; anschliessend normale Monatswechsel und beide menschlichen Spielerzuege bis zur **zweiten natuerlichen Insolvenz** (Schutzgrenze: 240 Folgemonate).
4. Zweiter JSON-Rundlauf im offenen Sanierungszustand; Neustart zu Generation 3, H2 unveraendert, exakt zwei Sanierungsereignisse.
5. Wiederholung derselben Neustartkennung wird ohne Zustandsaenderung erkannt; dritter JSON-Rundlauf und Folgemonat ohne doppelte Buchung.

## Nachweise und Freigabestatus

- [GitHub-CI, technischer Browser-Workflow #40651316766](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40651316766): neuer Node-Schritt auf `1166846587d02054c5f7f3926ecb9c82c3be60d2` **PASS**; Gesamtworkflow und unabhaengige Jobs zum Dokumentationszeitpunkt **noch nicht abschliessend bewertet**.
- Der Test wurde **in GitHub Actions ausgefuehrt**. Eine lokale Ausfuehrung des gesamten Spiels in dieser Arbeitsumgebung war nicht moeglich; der lokale `node --check` pruefte nur die Syntax des vorbereiteten Skripts.
- [Maschinenlesbarer Teilnachweis](../prerelease/evidence/SPE-01-MULTIGEN-PARTIAL-20261028.json).
- `SPE-01`, `VER-02`, `VER-03`, `LOG-04` bleiben **BLOCKED**; nur Teilabdeckung. Gesamtmatrix unveraendert **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED**.
- Keine Browser-Mehrgenerationen-Partie, kein Sieg-/Niederlagenabschluss, keine historische Originalverifikation. Keine Freigabe, kein Merge, kein Release.

## Naechste drei Pflichten

1. Alle CI-Jobs auf dem endgueltigen Dokumentations-HEAD pruefen und etwaige Fehler korrigieren.
2. Dieselbe Mehrgenerationen-Kette mit echten Browseraktionen, Prozessneustarts, 800x600, Tastatur und Speicherimport pruefen.
3. Den noch offenen Endregelvertrag fuer Projekt C abschliessen und darauf aufbauend vollstaendige Sieg-/Niederlagenpartien automatisieren.

**Persoenliche Sichtpruefung und Kubuntu-Praxistest bleiben bis nach allen technischen Pflichtgates und einem eingefrorenen Kandidaten zurueckgestellt.**
