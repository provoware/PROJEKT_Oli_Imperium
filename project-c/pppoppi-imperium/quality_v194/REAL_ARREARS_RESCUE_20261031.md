# WIR-04 / BAL-01 – Natürlicher Rechnungsrückstand mit echtem Rettungskredit (31.10.2026)

## Warum diese Pflichtprobe?

Bisherige 12-Monats-Schuldentests starten teilweise mit ausdrücklich künstlich gesetzten Schulden und Kassenwerten. Die 48-Monats-KI-Beobachtung fand keine natürliche KI-Verschuldung. Diese neue, **unabhängige** Gegenprobe erzeugt den ersten menschlichen Rechnungsrückstand ausschließlich durch zulässige reale Spielaktionen. Sie ist eine Berliner Adaption, **kein bestätigtes C64-Verhalten**.

## Konkreter technischer Ablauf

1. Zwei regulär gestartete menschliche Firmen mit je 20.000.000 Cent. H1 kauft und erschließt ein Berliner Feld, kauft ein weiteres in Brandenburg, baut eine Berliner Raffinerie, sichert das Feld, fördert zweimal und transportiert einmal. **Zehn echte Aktionen** kosten insgesamt **19.900.000 Cent**. H1 hat 100.000 Cent Restkasse, 0 Cent Schulden; es werden keine Spielstands-Geldwerte vorab verändert.
2. Beim ersten Monatsabschluss entstehen **90.000 Cent Lohn und 50.000 Cent Wartung**. Die verfügbare Kasse reicht nur für 100.000 Cent; die beiden gleichrangigen Rechnungen werden anteilig mit 64.286 und 35.714 Cent bezahlt. **40.000 Cent bleiben offen**, die Spielphase muss tatsächlich auf `RESCUE` wechseln.
3. Die reguläre Aktion `RESCUE_LOAN` bucht 4.000.000 Cent Kredit **und** 4.000.000 Cent Schuld. Die offenen 40.000 Cent werden bezahlt, die Kasse beträgt 3.960.000 Cent; danach regulärer Monatsbericht und JSON-Speicher-/Wiederherstellungstest.
4. Der zweite echte Monatsabschluss muss 40.000 Cent Zinsen und 200.000 Cent Tilgung erzeugen. Schlusskasse 3.580.000 Cent, Restschuld 3.800.000 Cent, keine unbezahlten Rechnungen. Die zweite Firma bleibt unabhängig.
5. Zwei identische Szenariodurchläufe, acht Firmen-Monatsbeobachtungen, zehn manipulierte Kopien als Negativproben, Duplikatsperren und Kassenbuch-/Schuldenabgleich.

**Wichtige Grenze:** Der Monatsbericht des ersten Monats ist ein historischer Schnappschuss **vor** dem Rettungskredit; nach der Rettung sind die aktuellen Firmenwerte maßgeblich. Weder Anschaffungsauszahlungen noch Rettungskredit sind Gewinn. Kein Anlagenwert, Rohöl-Wertverlust, Restwert oder buchhalterischer Gesamtgewinn wird erfunden.

## Reproduzierbare Prüfung

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_arrears_rescue_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_arrears_rescue_v194.cjs
```

GitHub: [Pflichtworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-arrears-rescue.yml).

**Prüfstatus bei Einreichung:** PENDING, bis die neue GitHub-Prüfung auf dem endgültigen Commit abgeschlossen ist. Die [bisherigen 17 GitHub-Prüfungen auf f27b7acf](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/f27b7acfd13b25a1de11f0fb9ae793d2c876a799/checks) sind abgeschlossen: 16 PASS, integrierte Vorrelease-Sperre erwartungsgemäß FAIL. Dieser alte HEAD beweist **nicht** den neuen Test.

**Pflichtmatrix:** WIR-04 und BAL-01 bleiben BLOCKED; 6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED = 52. 73 offene Entwurfs-PRs bei GitHub-Abfrage am 31.10.2026: deshalb vorhandenen PR #147 erweitern, keinen zusätzlichen Entwurf erzeugen. Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.

## Nächste drei technische Schritte

1. Neue GitHub-Fachprüfung auf dem endgültigen HEAD auswerten, tatsächliche Fehler korrigieren und die Nachweise ergänzen.
2. Den echten Rettungskredit über weitere Monate mit wiederkehrenden Rechnungen, ungenügender Tilgung und Insolvenzgrenzen prüfen; getrennt von synthetischen KI-Stresstests.
3. Bewertungsregeln für Rohöl, Abschreibungen, Restwerte und Forderungen fachlich klären; anschließend Gewinn-/Vermögensrechnung, vollständige Endpartien und Browser-Dateiimport prüfen.

**Weiterführende Empfehlung:** Die neue reale Kreditkette als kleine Referenz für spätere Langzeitprüfungen nutzen, ohne aus zwei Monaten allgemeine Spielbalance abzuleiten.
