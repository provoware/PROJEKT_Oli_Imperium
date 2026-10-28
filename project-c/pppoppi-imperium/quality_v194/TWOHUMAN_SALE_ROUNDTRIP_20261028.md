# Zwei-Menschen-Notverkauf und Sanierungs-Rundlauf – 28.10.2026

## Basis und Abgrenzung
- Repository: `provoware/PROJEKT_Oli_Imperium`, Projekt C, Technikfassung V1.9.4.
- Entwicklungszweig: `automation/prerelease-twohuman-sale-roundtrip-20261028-0336`, gestapelt auf PR #99 (Basis `feb988cc1ffc5c7ead2bc4ef736d5e30ce304bdd`).
- `main` bei Vorpruefung: `d3dc371154cc1089e06f34d0dc4ff04047132360`. Kein Merge und kein Release.
- Geschuetzte Original-Spielquellen: 0 von 110 veraendert. Historische C64-Regeln nicht neu behauptet.

## Implementiertes Pflichtpaket
Neues isoliertes Node-Pruefprogramm `test_rescue_sale_roundtrip_v194.cjs`, als eigener Schritt vor der langen Chromium-Pruefkette eingebunden. Zwei menschliche Firmen verursachen mit je acht regulaeren Engine-Wirtschaftsaktionen natuerlich eine Insolvenz. H1 verkauft BERLIN-1 im Rettungsverfahren, H2 bleibt unabhaengig sanierungspflichtig.

Gepruefte Sollwerte und Invarianten:
- Beide Firmen besitzen vor der Abrechnung je 60.000 Cent, nutzen je 15 Spieltage und haben danach je 80.000 Cent offene Pflichtzahlung.
- H1 verkauft genau ein eigenes Feld zum im Spielkern vorgesehenen 60-Prozent-Preis. Nur H1s Rueckstand wird ausgeglichen, H2 bleibt offen.
- NORD-1 bleibt H1-Eigentum, BERLIN-1 wird frei, H2s Felder bleiben bis zum eigenen Neustart erhalten.
- Dieselbe Verkaufskennung darf weder das Journal noch den Feldbesitz erneut veraendern.
- Ein fremdes Feld wird abgewiesen, ohne den Spielstand zu veraendern.
- Ein JSON-Export-/Import-Rundlauf mitten in H2s Rettungsverfahren erhaelt den Zustand exakt.
- H2s Neustart fuehrt zu Generation 2, ohne H1s Eigentum oder Notverkauf zu veraendern.
- Im Folgemonat werden weder Notverkauf noch Monatsabrechnung doppelt gebucht.

## Echte Pruefnachweise
- [GitHub-CI #40622159262](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40622159262): neuer isolierter Schritt **PASS** auf Code-HEAD `ba19ccade47e48a98c63ea56dae6e7b99ca66469`; die restliche Browserkette war bei der Erfassung noch **IN_PROGRESS**.
- [Quellpruefung #40622159243](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40622159243): bei der Erfassung **IN_PROGRESS**.
- [Gesamtgate #40622159237](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40622159237): **FAIL/BLOCKED**, weil die Vorrelease-Pflichten noch nicht vollstaendig freigegeben sind. Einzelne strukturelle Pruefungen duerfen diese Sperre nicht aufheben.
- [Maschinenlesbarer Teilnachweis](../prerelease/evidence/SPE-01-TWOHUMAN-SALE-PARTIAL-20261028.json) und [Pflichtmatrix](../prerelease/matrix.json) bleiben **PARTIAL/BLOCKED**.

**Abgrenzung:** Der neue Test ist ein echter ausgefuehrter Engine-Test, aber kein Browser-Klicktest, kein Chromium-Prozessneustart und keine komplette Sieg-/Niederlagenpartie. Der vollstaendige Endregelvertrag und der historische C64-Vergleich fehlen.

## Naechste drei Pflichtschritte
1. CI auf dem finalen Dokumentations-HEAD auswerten; fehlerhafte Tests gezielt korrigieren.
2. Vertragsbruch und Notverkauf samt Export/Import in echtem Chromium, einschliesslich weiterer Sanierungsgenerationen, pruefen.
3. Endregelvertrag und komplette Gewinn-/Verlustpartien samt Wiederherstellung und 800x600-/Tastaturkontrolle abschliessen.

**Empfehlung:** Die neuen Sollwerte als feste Regression behalten, aber `SPE-01`, `LOG-04` und `VER-02` erst nach den fehlenden Browser- und Endpartiennachweisen freigeben. Persoenliche Sichtpruefung und Kubuntu-Abnahme ausschliesslich am eingefrorenen Vorrelease-Kandidaten.
