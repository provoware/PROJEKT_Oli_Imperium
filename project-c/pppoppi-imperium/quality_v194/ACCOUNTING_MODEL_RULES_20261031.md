# Fachliche Bilanz- und Gewinnrechnung – isolierter Forschungsstand (31.10.2026)

**Ziel:** Eine fachlich kontrollierbare Berechnung für Gewinn und Vermögen der **eigenständigen** PPPOPPI-Variante vorbereiten, ohne ungeklärte Werte stillschweigend zu erfinden. Die bereits geprüfte Integration **PR #141 / `7ce841ba43d2d2fd94fec90ef206b19d48bae8b2`** wird weder überschrieben noch ergänzt. Die 110 geschützten Spielquellen bleiben unverändert.

## Befund und Motivation

Die bereits geprüften Funktionen können Kasse, Verkaufserlöse, Kreditbetrag und offene Rechnungen nachweisen. **Das allein bestimmt keinen buchhalterischen Gewinn.** Investitionen erzeugen Vermögenspositionen; Tilgungen reduzieren Kasse und Schuld gleichzeitig. Öl- und Fertigwarenbestände brauchen eine nachvollziehbare Herstellkosten- und Verbrauchsregel. Außerdem brauchen Zins, Lohn, Frachtsicherheiten und Vertragsstrafen die richtige Periodenzuordnung. Historische C64-Werte sind mit `data/contract.json` weiterhin nicht als Originalregel freigegeben.

Die neue, isolierte **Rechenbrücke** `accounting_model_v194.cjs` liest das vorhandene Spielzustandsformat ausschließlich und ändert weder Engine noch gespeicherte Spielstände. Die neuen acht Tests `test_accounting_model_v194.cjs` prüfen konkrete Engine-Monatsabschlüsse und kontrollierte Rechen-Gegenproben.

## Algebra der Modellrechnung – keine Freigabe historischer Spielregeln

Alle Werte sind **Cent-Ganzzahlen**, keine Gleitkommazahlen; Unter-/Überläufe und negative unzulässige Bestandsposten werden zurückgewiesen.

**Aktiva** = Kasse + belegte Forderungen + bewertete Vorräte + bewertete Ware unterwegs + Ölfeldbuchwerte + Raffineriebuchwerte + Leitungs-/Netzbuchwerte + aktivierte Vorauszahlungen + sonstige nachgewiesene Vermögenswerte.

**Verbindlichkeiten** = volle noch bestehende Kredithauptschuld + offene Rechnungen **ohne** die bereits in der Kredithauptschuld enthaltene Tilgung + nachgewiesene weitere Schulden.

**Modell-Reinvermögen** = Aktiva − Verbindlichkeiten.

**Modell-Periodenergebnis** = Schluss-Reinvermögen − Anfangs-Reinvermögen − dokumentierte Eigenkapital-Einlagen + dokumentierte Eigenkapital-Entnahmen.

Diese letzte Gleichung wird nur über **dieselbe Firma, Firmengeneration und Bewertungsregel** berechnet. Ein Firmenneustart oder fehlender Nachweis der Einlagen/Entnahmen sperrt die Auswertung. Das Ergebnis ist zunächst als **`modelPeriodResultCent`**, ausdrücklich **nicht** als `accountingProfitCent` gekennzeichnet.

## Warum bisher keine reale Gewinnzahl?

Die Anlage- und Lagertypen der tatsächlich importierten Spielversion benötigen verbindliche Spiel- und Bewertungsentscheidungen. Folgende Angaben sind in der Modellrechnung Pflichtfelder, aber derzeit für echte Spielsitzungen **fachlich nicht vollständig belegt**:

| Bereich | Noch zu entscheidende Fachregel | Risiko fehlender Entscheidung |
| --- | --- | --- |
| Ölfelder, Bohrungen | Anschaffungskosten, aktivierbare Gutachten, Amortisation, Reservewert, Wertverlust, Notverkauf | Kauf wird fälschlich Verlust oder Reserve wird fälschlich Gewinn |
| Raffinerien und Leitungen | Anschaffung/Bau, Lebensdauer, Reparatur und Abschreibung | Investitionsauszahlung wird fälschlich Aufwand |
| Rohöl und Fertigware | Stückherstellkosten, Raffinerieausbeute, Lieferung, Verkauf, Restlager | Ware wird doppelt oder falsch als Erlös/Buchwert gezählt |
| Transporte/öffentliches Netz | Ware unterwegs, Eigentumsübergang, Frachtvorauszahlung, Rückgabe | Doppelzählung und falsche Kosten |
| Forderungen und offene Verträge | Umsatzentstehung, Forderung, Zahlung, Risikovorsorge | Noch nicht erbrachte Leistung wird Gewinn |
| Kredite und Rechnungen | Kredithauptschuld, Tilgung, Lohn, Zins, offene Rückstände | Tilgung doppelt als Verbindlichkeit oder fälschlich Aufwand |
| Eigene Einlagen/Entnahmen, Generationen | Erfassung, Rettungsneustart, Firmenwertverlust | Kapitalzufluss wird Gewinn oder Sanierung wird normaler Jahreserfolg |

**Null ist nicht unbekannt.** Ohne ausdrücklich übergebene Bewertung aller neun Positionstypen und eine Kennung der Herkunft liefert das Modell `VALUATION_MISSING`, fehlende Felder und **`null` für Aktiva/Reinvermögen/Gewinn**. Mit vollständig *eingegebenen* Testwerten liefert es `MODEL_ONLY_UNAPPROVED`: Die Übernahme der Zahlen ist damit **nicht** inhaltlich bestätigt. Selbst bei lückenlosen Zahlen bleiben `accountingProfitCent:null` und `releaseGate:'BLOCKED'`, bis die Regeln fachlich freigegeben, gegen reale Bestandsbewegungen abgeglichen und unabhängig nachgewiesen sind.

**Sicherheitsgrenze des Entwurfs:** Der Rechner beweist die **Rechenidentitäten**, aber prüft *noch nicht*, ob alle realen Lager-/Transit-/Anlagenpositionen mit zulässigen Anschaffungswerten richtig inventarisiert und alle Buchungsarten periodengerecht klassifiziert wurden. Manuell gesetzte synthetische Werte können daher auch mit korrekter Algebra eine sachlich falsche Bilanz darstellen. Genau deshalb ist die Freigabe technisch dauerhaft gesperrt.

## Tatsächliche Prüfabdeckung

Isolierte Rechenprüfung: **9/9 lokale JavaScript-Fälle PASS**. Danach **8/8 integrative Prüfungen** mit dem tatsächlich geladenen V1.9.3-Spielkern in einer isolierten JavaScript-Ausführung PASS:

1. Fehlende Werte führen zu `null`, niemals zur Scheinbilanz.
2. Startbilanz mit ausdrücklich synthetischen Nullpositionen und unverändertem Spielzustand.
3. Echter Lohn-Monatsabschluss über zwei menschliche Firmen.
4. Echter Gutachten-/Feldkauf mit explizit *hypothetisch* kapitalisiertem Kaufwert: keine Gleichsetzung von Kaufauszahlung und Verlust.
5. Synthetischer Kredit- und Tilgungsfall: Kreditaufnahme ist ergebnisneutral; offene Tilgung zählt nicht doppelt.
6. Synthetische Eigentümer-Einlage wird aus Modell-Periodenergebnis herausgerechnet.
7. Generationswechsel und ungleiche Bewertungsregel sperren den Zeitraumvergleich.
8. Fehlende, negative, unzulässig bezahlte und zu große Werte werden abgewiesen.

**Die Prüfung lief als isolierte JS-Ausführung gegen reale Quelldateien, nicht als Node.js-GitHub-CI-Lauf auf dem neuen Forschungs-HEAD.** Ein grüner Node-/CI-Nachweis für diesen Zweig wird **nicht** behauptet. Vor einer Integration ist zwingend auszuführen:

```bash
node --check project-c/pppoppi-imperium/quality_v194/accounting_model_v194.cjs
node --check project-c/pppoppi-imperium/quality_v194/test_accounting_model_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_accounting_model_v194.cjs
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
python3 tools/validate_project.py
python3 -m unittest discover -s tests -q
```

## Branch-/PR-Schutz

- Dieser Forschungsstand liegt **ausschließlich** auf `research/oli-finance-rules-20261031`, abgezweigt von PR #141 / `7ce841ba`.
- **Kein neuer Draft-PR** trotz bereits überschrittener Draft-PR-Grenze. Keine Änderungen an PR #141, `main`, den 110 manifestgeschützten Quell-/Testdateien oder der 52er-Vorrelease-Matrix.
- Freigabestand bleibt **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. `WIR-01`, `WIR-04`, `BAL-01` und weitere Gesamtgates bleiben gesperrt.
- Erst Regelentscheidungen + unabhängige Kosten-/Mengeninventur + echte mehrmonatige Wirtschaftsbuchungen ergeben eine für die Adaption **kandidatenfähige** Bilanz; C64-Originaltreue erfordert eigene Referenznachweise.

## Drei nächste Pflichtschritte

1. **Regelentscheidungen fachlich klären:** Anschaffungskosten, Abschreibungen, Lager-/Transportbewertung, Forderungen und Kapitalbewegungen versioniert festlegen – ohne die historische C64-Variante damit zu überschreiben.
2. **Buchungs- und Bestandsbrücke:** Anschaffungswerte und Mengen je Firma/Feld/Transport per realen Spielaktionen und Monatswechsel gegenprüfen; unerkannte Codes als Blocker behandeln, nicht automatisch einem Gewinnposten zuweisen.
3. **Verbindliche Regression:** Auf künftigem separatem Prüfkandidaten Node.js, GitHub-CI, mehrmonatige Endpartien, Negativproben und Quellschutz ausführen. Kein Merge nach `main` und kein Vorrelease-PASS ohne alle Pflichtgates.
