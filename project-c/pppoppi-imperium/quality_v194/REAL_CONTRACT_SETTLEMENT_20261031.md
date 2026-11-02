# WIR-03 / WIR-04 – Natürliche Vertragslieferung und Vertragsstrafe (31.10.2026)

## Zweck und Ausgangslage

Die bereits geprüfte natürliche 14-Monats-Insolvenz deckt Rechnungen, Kredit und Neustart ab, aber keine echten Vertragsabschlüsse. Dieser zusätzliche Test prüft zwei reguläre Spielwege über **SIGN** und den folgenden Monatsabschluss: vollständige Lieferung und vollständiger Vertragsbruch. Der unveränderte Spielkern der **eigenständigen Berliner Adaption** wird über die öffentlichen Übergänge bedient. Es werden keine historischen C64-Regeln behauptet.

## Unabhängige Cent-Sollwerte

- Je Szenario: zwei menschliche Firmen, jeweils 20.000.000 Cent Startkasse, ohne nachträgliche Kassen-, Schulden- oder Lagerinjektion.
- H1 führt regulär SURVEY, BUY, DRILL und SIGN für BERLIN-1 aus. Im Lieferfall kommt PUMP hinzu. Der Vertrag über **40.000 Milli-Barrel** wird im ersten Monat abgeschlossen und ist erst im zweiten fällig.
- Der Berliner Marktpreis für Monat 2 ergibt sich nach einem verkaufsfreien ersten Monat zu **67.900 Cent je Barrel**. Mit 10 % Vertragsaufschlag sind das **74.690 Cent**. Vollständige Lieferung bringt **2.987.600 Cent Erlös**, eine Transportrechnung über **20.000 Cent**, 60.000 Milli-Barrel verbleibendes Rohöl und einen *vertraglichen Modell-Profit* von 2.367.600 Cent. H1-Endkasse: **10.387.600 Cent**.
- Im Vertragsbruchfall wird kein Rohöl gefördert. Es entstehen **0 Cent Erlös**, keine Transportrechnung und eine Vertragsstrafe über **746.900 Cent** (25 % des nicht gelieferten Vertragswerts). H1-Endkasse: **6.773.100 Cent**. Ein offener Vertrag muss auf BREACH statt DONE wechseln.
- H2 darf weder Verträge noch Schulden erhalten und besitzt nach zwei regulären Lohnzahlungen **19.820.000 Cent**.
- Für beide Wege: individuelle Vertrags- und Rechnungskennungen, eindeutige Zahlungsbuchung, Kassenbuchsumme, Monatsberichte, offene Forderungen/Verbindlichkeiten, Eigentum, Ölreserve, Vertragserfolgsstatistik und nicht vorzeitig erfüllter Vertrag werden geprüft.

## Testumfang und reproduzierbare Ausführung

Zwei deterministische Wiederholungen von beiden Vertragswegen = **4 Szenarien**, **16 Firmen-Monatsbeobachtungen**, **38 Duplikatprüfungen**, **8 JSON-Speicher-Rundläufe** und **40 absichtliche Manipulationen** (Kasse, Buchung, Vertragsmenge/-status/-profit, Rechnung, Bericht, andere Firma und doppelter Vertrag).

~~~bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_contract_settlement_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_contract_settlement_v194.cjs
~~~

[GitHub-Fachworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-credit-longrun.yml) sichert die JSON-Ausgabe und prüft die unabhängigen Zahlen. **Bei Erstellung: CI auf dem endgültigen HEAD noch PENDING; kein PASS ohne tatsächlichen GitHub-Lauf.**

## Fachliche Grenzen / offene Release-Pflichten

Der aktuelle Vertrag wird bei Lieferung **sofort bar bezahlt**. Er führt im unveränderten Spielkern **keine gesonderte Forderung gegen einen später zahlenden Schuldner**. Der Test prüft deshalb tatsächliche Vertragszahlung und Vertragsstrafe, **nicht** Debitoren, Forderungsbewertung, Ausfallrisiko oder bilanzielle Gewinnermittlung. Der ausgewiesene Modell-Profit ist kein freigegebener Jahresabschluss. Teilmengenlieferungen, mehrere gleichzeitige Verträge, echte Verlust-Endpartien, Browser-Dateidialog-Stabilität bei 175/200 %, Medienrechte und verifizierte C64-Originalreferenz bleiben offen.

Die 52er-Pflichtmatrix bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Keine künstliche Freigabe, kein Merge nach main, kein Release und keine persönliche Endabnahme.

**Nächste drei Schritte:** (1) CI auf dem finalen HEAD und insbesondere die Vertragsfachprüfung auswerten, (2) reguläre Teilmengenlieferung und gleichzeitige Verträge mit unabhängigen Buchungsprüfungen ergänzen, (3) Forderungsmodell und Bewertungsregeln erst nach fachlicher Entscheidung spezifizieren.
