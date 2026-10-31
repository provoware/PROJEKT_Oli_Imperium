# WIR-03 / BAL-01 – Zwei echte Oelfelder, konkurrierende Firmen (30.10.2026)

**Technischer Teilnachweis; Vorrelease bleibt BLOCKED.** Entwurfs-PR [#137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). Ausgangs-HEAD vor dem Paket: `eeba4b72344125cdd7d8b1a3768ba67024784198`. Neue Testdatei: `test_multiclaim_competition_v194.cjs`. Die GitHub-CI ist erst nach abgeschlossenem Lauf auf dem endgueltigen HEAD als PASS zu melden; diese Dokumentation behauptet keinen vorzeitigen Erfolg.

## Nachweisziel

Der bisherige Test `test_natural_oil_to_export_v194.cjs` verfolgt eine echte Oelkette mit einer Firma/einem Feld bis zum Aussenmarkt. Die unabhaengige Ergaenzung prueft zwei **tatsaechlich durch Spielaktionen** erschlossene und befoerderte Felder sowie die Abgrenzung konkurrierender Firmen bei gemeinsamer oder getrennter Nachfrage.

| Fall | Feld H1 | Feld H2 | Erwarteter Verkauf | Erwarteter Rest |
|---|---|---|---:|---:|
| Gemeinsamer Berliner Markt | BERLIN-1 | BERLIN-2 | je 60 Barrel | je 40 Barrel |
| Getrennte Maerkte | BERLIN-1 | BRANDENBURG-1 | je 100 Barrel | 0 Barrel |

Jede Firma fuehrt `SURVEY → BUY → DRILL → PUMP → SHIP → OFFER → END_TURN` aus. Die Maerkte werden mit den echten Anfangspreisen und der regulaeren Nachfrage abgerechnet. Es gibt **keine kuenstliche Erhoehung** von Guthaben, Oel, Reserve, Tank oder Marktbestand. Nach dem Monatsabschluss werden je Firma die Feldreserve, das verbliebene Oel, Verkaufsbuchungen, Spieltage, der Geldfluss und die korrekte Marktmenge verglichen.

## Negative Kontrollen und Wiederholbarkeit

- Fremde Foerderaktionen muessen abgewiesen werden, ohne den Ausgangszustand zu veraendern.
- Absichtlich um 1 Barrel aufgeblasener Bestand muss bei weiterhin formal gueltigem Spielstand auffallen.
- Unbemerkte Verschiebung von Oel zwischen Konkurrenten bzw. verfremdeter Verkaufszaehler muss auffallen.
- Eine manipulierte Erloesbuchung muss beim unabhaengigen Abgleich auffallen.
- Zwei JSON-Speicher-/Wiederherstellungsrundlaeufe je Durchlauf; der Monatswechsel darf weder Ware verlieren noch Erloese doppelt buchen.
- Beide Szenarien werden zweimal ausgefuehrt und die Ergebnisse exakt verglichen.

**Vorgesehene Sollzahlen (keine PASS-Aussage):** 4 Simulationsmonate, 8 Firmen-Monatskontrollen, 8 abgewehrte Fremdaktionen, 12 erkannte Manipulationen und 8 JSON-Rundlaeufe.

## Reproduzierbarer Test

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_multiclaim_competition_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_multiclaim_competition_v194.cjs
```

GitHub-Pruefablauf: `.github/workflows/prerelease-natural-oil-export.yml`. Er fuehrt den neuen Test neben der bestehenden natuerlichen Oelkette aus und archiviert das maschinenlesbare JSON-Ergebnis. **Bei FAIL ist der Fehler zu untersuchen; keine Umgehung durch Ausschalten des Tests.**

## Grenzen / naechste Pflichten

Nur zwei Felder und ein abgeschlossener Marktmonat, keine Langzeit-Konkurrenz, keine Vollbilanz und kein C64-Originalvergleich. Eine positive Kasse oder ein Verkauf ist kein Gewinn. Die physische Mengenbilanz ist keine monetäre Lager- oder Anlagenbewertung. Weitere echte Transportketten, historische Belege, Medienrechte, nativer Browser-Dateiimport und persoenliche Endabnahme bleiben getrennte Pflichten. Alle 110 manifestgeschuetzten Originaldateien, Spielregeln, Spielstaende und `main` bleiben unveraendert.

**Naechste drei Schritte:** (1) neuen GitHub-Test samt JSON-Artefakt auf dem finalen HEAD auswerten und Fehler beheben; (2) Konkurrenz- und Restlager ueber mehrere Monate und reale Transportwege pruefen; (3) erst danach mit belegten Kosten-, Bestands- und Anlagenregeln eine Vermoegens-/Gewinnrechnung konzipieren. Kein Merge, kein Release.
