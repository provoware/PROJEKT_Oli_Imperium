# VER-02 / WIR-04 / BAL-01 – Natürliche Insolvenz und Feldfreigabe (31.10.2026)

## Warum dieser zusätzliche Pflichtfall nötig ist

Der bestehende 16-Monats-Test weist zwei **natürliche** Zahlungskrisen und deren Kreditrettung nach. Der ältere KI-Insolvenztest prüft die Freigabe tatsächlich erworbener Ölfelder jedoch erst **nach künstlich eingesetzter Kasse und Schuld**. Die Kombination fehlte: eine ausschließlich durch echte Spielaktionen und reguläre Rechnungen ausgelöste Insolvenz mit anschließendem Neustart, Eigentumsfreigabe und unveränderten historischen Monatsberichten.

## Prüfszenario – Berliner Adaption, kein C64-Originalbeleg

- Zwei menschliche Firmen, reguläre Startkasse je 20.000.000 Cent, **keine** nachträglich eingesetzte Kasse, Schuld oder Ware.
- H1 führt zehn echte Investitions-, Bohr-, Förder- und Frachtaktionen aus; Eigentum an **BERLIN-1** und **BRANDENBURG-1** wird durch reguläre Käufe erworben. H2 bleibt unabhängig.
- Monat 1: natürliche Rechnungslücke von 40.000 Cent, durch einen regulären Kredit über 4.000.000 Cent ausgeglichen.
- Monate 2–13: unabhängige Cent-Rechnung für Personal, Wartung, Zins und Tilgung; Kassen-, Schulden-, Rückstands- und Monatsberichtswerte werden kontrolliert.
- Monat 14: aus 73.729 Cent Kasse und 269.686 Cent Rechnungen entstehen **195.957 Cent Rückstand**, ohne künstlichen Schulden- oder Kassenwert. Anstelle eines zweiten Rettungskredits wird die vorhandene **RESTART**-Aktion ausgeführt.
- Nach dem Neustart: Generation und Sanierungszähler jeweils +1; alte Schuld, Rechnungen, Kassenbuch und Eigentum zurückgesetzt; beide Felder müssen exakt dem ursprünglichen, unverkauften Zustand entsprechen. Die zweite Firma und alle 14 archivierten Monatsberichte dürfen sich durch den Neustart nicht verändern.
- JSON-Speicher-/Wiederherstellung an drei Stellen pro Szenario, insbesondere mitten im Rettungszustand; Prüfung der Duplikatsperre nach jeder Aktion; anschließend Fortsetzung in Monat 15 ohne wiederkehrende alte Schulden oder Felder.
- Zwei deterministische Wiederholungen, **56 Firmen-Monatsbeobachtungen** und **22 gezielte Manipulationsproben** (Kasse, Schuld, Generation, Zähler, alte Rechnungen/Buchungen, Feldfreigabe, andere Firma, Archiv und Neustartereignis).

## Zusätzliche unabhängige Krisenbuchprüfung

Vor dem regulären Neustart wird der tatsächlich entstandene Rettungszustand
unabhängig vom Monatsbericht geprüft: 54 Rechnungen von H1 und 14 von H2,
Zins- und Tilgungssoll aus dem Kreditverlauf, sämtliche Einzelzahlungen,
eindeutige Belegkennungen, Kassenbuchsumme, Rettungskredit und offene
195.957 Cent. **14 zusätzliche gezielte Verfälschungen je Wiederholung**
prüfen unter anderem ausgeglichene falsche Buchungen, erfundene Zahlungen,
vertauschte Rechnungsarten, doppelte Rechnungen und veränderte Kreditbeträge.
Mit den bisherigen 11 Neustart-Verfälschungen sind das **50 Negativproben
in zwei vollständigen Wiederholungen**. Diese Prüfung beweist keine
Bilanzbewertung und keine Vertragsforderung.

## Ausführung und Abnahme

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_insolvency_longrun_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_insolvency_longrun_v194.cjs
```

Der bestehende [GitHub-Fachworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-credit-longrun.yml) führt die neue Prüfung zusätzlich zum bisherigen 16-Monats-Kredittest aus und sichert beide JSON-Ausgaben. [Entwurfs-PR #147](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/147).

**Status der erweiterten Krisenbuchprüfung: PENDING auf neuem HEAD.** PASS erst nach tatsächlich erfolgreicher GitHub-Ausführung auf dem endgültigen Commit. Das Gesamt-Vorrelease-Gate bleibt BLOCKED; keine neue vollständige Pflicht als PASS zählen. Der unveränderte Spielkern wird nur gelesen.

## Unverändert offen

Die neue Probe beweist einen **natürlichen Insolvenz- und Neustartteilfall**, nicht den vollständigen Spielabschluss oder eine korrekte Gewinn-/Vermögensrechnung. Forderungen aus Verträgen, rechtlich begründete Anlagen- und Lagerwerte, Abschreibungen, historische C64-Regeln, Medienrechte und der intermittierende native Browser-Dateidialog bei 200 % bleiben offen. Die persönliche Sichtprüfung und der Kubuntu-Praxistest bleiben bis zum technisch vollständig geprüften, eingefrorenen Kandidaten zurückgestellt. **Kein Merge und kein Release.**

**Nächste drei Schritte:** (1) neue Fach-CI und restliche Workflows auf endgültigem HEAD prüfen, (2) zusätzliche natürliche Vertragsforderungen und Verlust-Endpartien absichern, (3) Bewertungsvorschriften, Medienrechte und historische Originalreferenz klären.
