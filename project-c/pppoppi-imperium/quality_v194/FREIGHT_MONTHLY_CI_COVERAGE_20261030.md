# WIR-01/WIR-02 – Fehlende CI-Abdeckung der Monats-Frachtpruefung (30.10.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4. **Entwicklung:** [PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137), kein Merge und kein Release.

## Konkreter Befund

Der bereits vorhandene Test `test_public_freight_monthly_audit_v194.cjs` wurde bisher nicht vom gezielten Workflow `.github/workflows/prerelease-freight-chain.yml` aufgerufen. Damit war seine Existenz allein **kein CI-Nachweis** fuer die monatliche Frachtabrechnung. Das bestehende Zweikanten-Verkaufsszenario bleibt weiterhin im selben Workflow aktiv.

## Abgesicherter Pruefumfang

Die neue verpflichtende CI-Stufe fuehrt den unveraenderten Monats-Frachttest mit Node 22 aus und validiert seine maschinenlesbaren Ergebnisse mit festen Sollwerten:

- Zwei Firmen, zwei Szenarien (offene/gesperrte Kante), je zweimal wiederholt: acht simulierte Spielmonate und 16 Firmen-Monatsbeobachtungen.
- Acht abgewiesene doppelte Frachtvormerkungen und acht JSON-Speicher-/Wiederherstellungsrundlaeufe.
- Kassenabgang bei Vormerkung, einmalige Rueckerstattung und exakter Nettotransportpreis je Firma.
- Bei offener Kante 12.000 Millibarrel akzeptiert; bei gesperrter Kante keine Lieferung und vollstaendige Rueckerstattung.
- Keine erneute Frachtbuchung ohne neue Vormerkung im Folgemonat.
- Beide JSON-Berichte werden als GitHub-Artefakt gesichert. Ein fehlgeschlagener Test oder falscher Zaehler laesst den Workflow scheitern; keine stillen Wiederholungen.

**Befehl:** `node project-c/pppoppi-imperium/quality_v194/test_public_freight_monthly_audit_v194.cjs`.

**CI-Status bei Erstellung:** PENDING bis zum abgeschlossenen Lauf auf dem finalen Commit. Fruehere Erfolge des Zweikanten-Tests sind kein Nachweis dieses bislang nicht angebundenen Monats-Tests.

## Grenzen und Folgeschritte

Die Ausgangsbestaende und die Anfangskasse sind Testvorbedingungen. Dieser Test beweist keine natuerliche Mehrfirmen-Foerderung, keine Anlagen- oder Gewinnbewertung, keine vollstaendige Endpartie, keine dauerhafte Beseitigung des sporadischen nativen Browser-Dateidialogfehlers und keine historische C64-Originaltreue. Die 77 ausgeschlossenen Archivdateien bleiben ohne Rechtefreigabe. **WIR-01, WIR-02 und TES-04 bleiben BLOCKED.**

1. Den neuen Fracht-CI-Lauf auf exakt dem finalen HEAD pruefen und etwaige Testfehler korrigieren.
2. Eine natuerliche Mehrfirmen-Foerder-/Raffinerie-/Frachtkette ueber mehrere Monate implementieren und unabhängig bilanzieren.
3. Den sporadischen nativen Dateiimportfehler bei 175/200 % getrennt reproduzieren und ursächlich beheben.

Persoenliche Sicht- und Kubuntu-Abnahme erst nach gruener technischer Gesamtfreigabe und eingefrorenem Kandidaten; Release ausschliesslich nach ausdruecklicher Nutzerfreigabe.
