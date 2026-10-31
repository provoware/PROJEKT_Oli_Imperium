# WIR-04 / BAL-01 – Natürliche zweite Kreditkrise über 16 Monate (31.10.2026)

## Fachlicher Zweck und Grenzen

Der vorhandene 2-Monats-Test zeigt eine erste natürliche Zahlungsnot und einen echten Rettungskredit. Die neue **unabhängige 16-Monats-Probe** prüft, ob regelmäßige Rechnungen, Zinsen, Tilgungen, wiederkehrende Rettungen, Kassenbuch und gespeicherte Spielstände über längere Zeit konsistent bleiben. Die Prüfung betrifft **die eigenständige Berliner Adaption**; weder historische C64-Regeln noch buchhalterische Vermögenswerte sind damit bestätigt.

## Reproduzierbarer Spielablauf

- Zwei menschliche Firmen beginnen regulär mit je 20.000.000 Cent, ohne nachträgliche Manipulation der Kasse oder Schulden. H1 führt zehn echte Aktionen aus (Feldsuche/-kauf, Bohrung, Raffinerie, Sicherung, Förderung und Fracht) und hat 100.000 Cent übrig.
- Monat 1: 140.000 Cent Personal-/Wartungsrechnungen, 40.000 Cent natürlicher Rückstand. Regulärer Rettungskredit: +4.000.000 Cent Kasse und +4.000.000 Cent Verbindlichkeiten; der Rückstand wird ausgeglichen.
- Monate 2–13: Monatliche Personalkosten und Wartung sowie Zins und Tilgung werden aus der **jeweils vor dem Monatsabschluss vorhandenen Restschuld** unabhängig berechnet und mit den echten Rechnungen, Buchungen, Firmenwerten und Monatsberichten verglichen.
- Monat 14: Vor dem Abschluss 73.729 Cent Kasse, 2.161.441 Cent Restschuld, 269.686 Cent fällige Rechnungen. Daraus entsteht ein natürlicher Rückstand von **195.957 Cent**. Die zweite reguläre Kreditrettung muss diesen ausgleichen; keine künstliche Kredit- oder Bargeldinjektion in den Spielstand.
- Monate 15–16: Der nun höhere Kreditbestand wird weiter verzinst und getilgt. Erwartete Endkasse H1 **2.815.799 Cent**, Restschuld H1 **5.463.166 Cent**; H2 bleibt unabhängig schuldenfrei.
- Zwei identische 16-Monats-Szenarien mit 64 Firmen-Monatsbeobachtungen, fünf JSON-Speicher-/Wiederherstellungsprüfungen pro Szenario (einschließlich einer Rettungsphase), Duplikatsperre bei allen Befehlen, 24 gezielten Manipulationsproben insgesamt (einschließlich vier neuer Buchungs-/Rechnungsangriffe pro Wiederholung). Kein vollständiger Sieg-/Verlust-Spielverlauf.

## Ausführung und überprüfbare Freigabebedingungen

~~~bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_credit_longrun_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_credit_longrun_v194.cjs
~~~

[GitHub-Fachworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-credit-longrun.yml) · [Entwurfs-PR #147](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/147).

**Status bei Erstellung:** CI noch auszuwerten. PASS nur bei erfolgreichem GitHub-Lauf auf dem tatsächlich geprüften Commit; fehlgeschlagene Prüfschritte sind FAIL, nicht BLOCKED. Das übergeordnete Release-Gate bleibt ausdrücklich BLOCKED, selbst bei bestandenem Fachtest.

## Unverändert offene Pflichtarbeit

Die neue Probe zeigt nicht die vollständige Gewinn-/Vermögensrechnung, Forderungsbewertung, Abschreibungen, Rohölwertminderung, vollständige Endpartien oder den intermittierenden Browser-Dateiimport bei 200 %; Medienrechte und historische C64-Originalreferenz bleiben ungeklärt. Benutzer-Sichtprüfung, Kubuntu-Praxistest und persönliche Endabnahme erst nach grünen technischen Gates und eingefrorenem Kandidaten. Kein Merge, kein Release.

**Nächste drei Schritte:** (1) Fach-CI und Gesamtregression auf finalem HEAD prüfen und Fehler beheben; (2) echte Forderungen und langfristige Schulden-/Insolvenzgrenzen in weiteren natürlichen Wirtschaftsabläufen prüfen; (3) Bilanzierungsregeln fachlich klären, bevor Gewinn oder Vermögen als vollständig berechnet gelten.

**Empfehlung:** Bei weiteren Krisentests den unveränderten Spielkern und unabhängig hergeleitete Cent-Sollwerte beibehalten; nicht allein auf vom Spiel selbst gemeldete Bilanzzahlen vertrauen.

## Tatsächlicher erster CI-Fehlversuch (31.10.2026)

[GitHub-Fachlauf #41206123867](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41206123867) **FAIL**: Der unabhängige Test hatte beim zweiten Rettungskredit die anschließend vollständig bezahlte, zuvor offene Tilgungsrechnung über 108.072 Cent nicht von der Restschuld abgezogen. Der Spielkern verbucht diese Zahlung korrekt. Test-Orakel, Endwerte und GitHub-Sollprüfung wurden korrigiert; neuer Fachlauf auf endgültigem HEAD gesondert auszuwerten. Keine behauptete Spielkernänderung.

## Zusatzprüfung – unabhängiger Rechnungs- und Zahlungsabgleich (31.10.2026)

Der bisherige reine Kassenbuch-Summenvergleich konnte zwei gegeneinander verschobene Zahlungen nicht sicher unterscheiden, wenn die Gesamtkasse unverändert blieb. Die Fachprobe gleicht deshalb **jede einzelne Rechnung** mit den tatsächlichen negativen Zahlungseinträgen nach Rechnungskennung und Zahlungsart ab; verwaiste, falsch zugeordnete und doppelt gezählte Zahlungen müssen auffallen. Diese Kontrolle erfolgt bei jedem geprüften Monatsabschluss, nicht nur beim Endstand.

Vier neue Manipulationen je Wiederholung prüfen (1) gegeneinander ausgeglichene falsche Zahlungen, (2) nachträglich umbenannte Rechnungsarten, (3) verwaiste Zahlungskennungen und (4) zusätzliche fingierte Zahlung mit ausgleichender Gutschrift. Zusammen **24 Negativproben** in zwei 16-Monats-Wiederholungen. Die Prüfung nutzt den unveränderten Spielkern und behauptet weder eine echte Forderungsbewertung noch eine vollständige Gewinn-/Vermögensbilanz.

**Status:** Test und CI-Sollwert im Entwurfszweig geändert; tatsächlichen GitHub-Fachlauf auf dem finalen Commit prüfen. Bis dahin kein neuer PASS-Beleg. Release-Matrix weiterhin 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED.
