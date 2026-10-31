# Wirtschaftsmodell – Finanzbegriffe und unabhängige Prüflücken (31.10.2026)

**Status:** technischer Teilnachweis auf PR #141; kein geprüfter Jahresabschluss, keine C64-Originalbehauptung, keine Vorrelease-Freigabe. Die 110 SHA-geschützten `SPIEL/**`-Dateien, reale Spielstände und die 52er-Matrix bleiben unangetastet.

## Ausgangslage und Abgrenzung

Die vorhandene Prüfung `test_ai_cashflow_audit_v194.cjs` trennt und prüft bereits Verkaufserlöse, Bau-/Feldinvestitionen, Kreditaufnahme und Tilgung, Aktionskosten, öffentliche Frachtvorauszahlungen/Rückgaben sowie offene Restkategorien gegen die echte Spielengine. Es wäre fachlich falsch und redundant, die Summen als Gewinn auszugeben oder parallel zu implementieren.

Eine neue, eigenständig getestete **technische Geldpositionsansicht** `test_financial_boundaries_v194.cjs` ergänzt die bisher fehlende *Verbindlichkeitsabgrenzung*: offene Tilgungsrechnungen sind bereits im Kreditkapital enthalten. Nicht bewertete reale Anlagen/Vorräte werden ausgewiesen, aber mit **keinem erfundenen Geldwert** versehen.

## Präzise Begriffe – welche Aussage ist jetzt zulässig?

| Feld | Technische Definition in Cent | Fachliche Grenze |
| --- | --- | --- |
| `cashCent` | Verfügbare Kasse aus realem Spielzustand | Kein Umsatz und kein Gewinn |
| `loanPrincipalCent` | Aktuelle Kredit-Hauptschuld `debtCent` | Nicht als Ertrag/Aufwand behandeln |
| `unpaidPrincipalAlreadyInLoanCent` | Summe `dueCent - paidCent` offener Rechnungen der Art `TILGUNG` | **Nicht erneut** zu Kreditkapital addieren |
| `unpaidOtherInvoicesCent` | Summe der noch offenen Nicht-Tilgungsrechnungen (z. B. Lohn, Zins, Strafzahlung) | Ohne sichere Periodenabgrenzung kein vollständig geprüfter Aufwand |
| `knownMonetaryObligationsCent` | Kreditkapital + offene Nicht-Tilgungsrechnungen | Nicht zwingend sämtliche Verbindlichkeiten außerhalb des Modells |
| `cashMinusLoanCent` | Kasse – Kreditkapital | Nur Teilkennzahl |
| `moneyAfterKnownObligationsCent` | Kasse – Kreditkapital – offene Nicht-Tilgungsrechnungen | **Kein** Eigenkapital und kein Gesamtvermögen |
| `physicalButUnvalued` | Anzahl eigener Felder/Raffinerien und Mengen Rohöl, bereitgestellte Ware, Raffinerieprodukt | Ohne Bewertungsregel strikt **kein Geldwert** |
| `receivablesCent`, `totalAssetsCent`, `accountingProfitCent`, `totalEquityCent` | `null` (fachlich nicht ermittelt) | `null` ist **nicht 0** |

## Fachliche Entscheidungen vor einer echten Gewinn- und Vermögensrechnung

1. **Aktivierung und Abnutzung:** Feldkauf, Erschließung, Raffineriebau, Leitungsnetz, Tankausbau; Anschaffungskosten versus Nutzungsdauer, Abschreibung, Wertminderung, Notverkaufswert und Verlust bei Insolvenz. Ohne beschlossene und versionsgebundene Spielregel kein verlässlicher Buchwert.
2. **Vorräte:** Rohöl im Tank, für Verkauf/Verträge vorgemerkte Mengen, Rohöl/Fertigware in eigenen und öffentlichen Transportketten; Herstellungskosten und Übertragungszeitpunkt, Verlust und Restwert. Ölreserven im Boden nicht unbemerkt zu Lagerbestand addieren.
3. **Forderungen und Verbindlichkeiten:** Offene Rechnungen, periodisch entstandene Kosten, Zinsen, Kredithauptschuld und noch nicht erfüllte Vertragsverpflichtungen sauber trennen. Noch nicht belieferte Verträge sind nicht automatisch bilanzierte Geldforderungen.
4. **Erfolgsrechnung:** periodengerecht abgegrenzte Erlöse minus bewerteter Materialverbrauch, Löhne, operative Kosten, Zinsen, Vertragsstrafen und Abschreibung; Kreditaufnahme, Tilgung und reine Anschaffungsauszahlungen **nicht** als Gewinn behandeln. Ein Kredit kann Kasse und Kreditschuld gleich erhöhen, ohne einen Gewinn zu erzeugen.
5. **Eigenkapital-/Vermögensrechnung:** bewertete Kasse + Forderungen + fertige/unfertige Vorräte + Anlagen (und ggf. weitere belegte Positionen) minus **einmalig** erfasste Verbindlichkeiten. Ein vollständiger Wert setzt die noch nicht festgelegten Bewertungen voraus.

Diese Entscheidungen sind **offene Vorschläge für die eigenständige PPPOPPI-Adaption**. Sie dürfen nicht als belegte historische `Oil Imperium`-C64-Mechanik oder als vom Nutzer bereits freigegebene Rechenregeln deklariert werden.

## Unabhängige Regressionen

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_financial_boundaries_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_financial_boundaries_v194.cjs
```

Sechs gezielte Tests: (1) realer Feldkauf und Monatsabschluss, (2) rechnerische Kreditneutralität als isolierte Gegenprobe, (3) Ausschluss der Doppelzählung bei offenen Tilgungsrechnungen, (4) echter Lohn-Monatsabschluss, (5) unzulässige Rechnungen, Schuldwerte und Zahlenüberläufe, (6) unbewertete Roh-/Fertigwaren. Der reale Spielkern wird geladen, aber **nie** verändert. Manipulierte Zahlen werden ausschließlich in kontrollierten Testkopien verwendet; diese sind kein Beleg für eine natürlich eingetretene Firmenkrise. Der vorhandene 96-Monats-Cashflow-Test bleibt eigenständig erhalten.

**Ergebnis erst nach abgeschlossener GitHub-CI auf dem endgültigen PR-HEAD:** `PENDING`. Auch dann bleibt der fachliche Gewinn- und Gesamtvermögensnachweis `BLOCKED`, solange die oben genannten Regeln und Originalbelege fehlen. Die 52er-Matrix bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**.

## Nächste Schritte

1. Die sechs Tests samt Negativfällen auf einem unveränderten Commit in GitHub Actions auswerten und Fehler nachweislich korrigieren.
2. Bewertungsfragen der eigenständigen PPPOPPI-Wirtschaft mit dokumentierten Entscheidungen klären und erst dann periodengerechte Bilanz/Gewinnfunktion und mehrmonatige Gegenproben entwickeln.
3. Rechteakte zu 77 ausgeschlossenen Archivobjekten sowie volle Endspiel-/Originalregel-Gates getrennt weiterführen; PR #141 bleibt DRAFT, kein Merge nach `main`, kein Release.
