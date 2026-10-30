# WIR-02 / WIR-03 – Natuerliche Oelfoerderung bis zum Aussenmarkt (30.10.2026)

**Gezielter Teiltest PASS auf HEAD `c1e80edb7d64c3cc7fb6450c865c848228230102`; Vorrelease BLOCKED.** Entwicklungszweig `automation/v194-ai-logistics-reserve-20261029-1530`, [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). Ausgangs-HEAD vor dieser Arbeit: `3b236a5545ce4f7383fbb092b1628ee74c12528b`. [GitHub Actions #41041818406](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41041818406) hat Syntax, Spielaktionen, Mengenkontrolle, Wiederholbarkeit, Kassenjournal und JSON-Rundlaeufe erfolgreich ausgefuehrt. Der gezielte PASS bezieht sich auf den genannten HEAD; nachfolgende Dokumentations-Commits muessen separat kontrolliert werden.

## Ziel und pruefbare Abhaengigkeiten

Die bisherige [zweistufige Frachtpruefung](PUBLIC_FREIGHT_CHAIN_SALE_20261030.md) begann mit kuenstlich gefuelltem Marktlager. Dieser neue, getrennte Regressionstest beseitigt genau diese Nachweisluecke: Oel wird mit `SURVEY`, `BUY`, `DRILL`, `PUMP` **durch echte Spielaktionen** erschlossen und gefoerdert. Danach werden Raffinerie und Vertriebsroute gebaut, das lokale Netz aktiviert, RAW/PIPE/FINAL-Kanten errichtet, 10 Barrel Rohstoff angeliefert und mit `NETWORK_REFINE` zu 9 Barrel Produkt verarbeitet. Die Ware wird ueber `NETWORK_PRODUCT` zum Berliner Marktlager und anschliessend ueber `PUBLIC_QUEUE` auf der Zweikantenroute **BERLIN → BRANDENBURG → NORD** transportiert. `PUBLIC_OFFER` fuehrt erst nach der tatsaechlichen Ankunft zur Aussenmarkt-Buchung.

Es wird **kein** Oel-, Lager-, Raffinerie- oder Marktvorrat als Testvorgabe injiziert. Das Spiel beginnt mit dem regulaeren Startguthaben und zwei Menschenfirmen. Der zweite Fall setzt ausschliesslich eine gueltige oeffentliche Streckensperre als Stoerung, um die vollstaendige Frachtgutschrift und den ausbleibenden Verkauf zu pruefen.

## Abnahmepruefungen

| Teilnachweis | Erwartung |
|---|---|
| Echte Foerderung | 100 Barrel gefoerdert; Reserve sinkt exakt um 100 Barrel |
| Regionale Rohstofflieferung | 10 Barrel im Folgemonat angekommen; keine Vorab-Verarbeitung |
| Raffinerie | 10 Barrel Eingang, 9 Barrel Fertigware, 1 Barrel Verarbeitungsschwund |
| Lokaler Produkttransport | 9 Barrel im naechsten Monat im Berliner Marktlager |
| Oeffentliche Zweikantenroute | Im offenen Fall 9 Barrel Zuteilung; Ankunft erst zwei Monate spaeter |
| Streckensperre | 0 Barrel Zuteilung; 9 Barrel ins Marktlager zurueck; volle Frachtrueckgabe |
| Aussenmarkt | Offen: 9 Barrel verkauft, genau eine `AUSSENMARKT`-Buchung; gesperrt: kein Verkauf |
| Fehlerfaelle | Vorzeitige Raffinierung, vorzeitiger Verkauf, Ueberverkauf abgewiesen; Ausgangszustand unveraendert |
| Datenintegritaet | Doppelte Frachtanforderung abgewehrt, 5 JSON-Rundlaeufe je Fall, Kasse gegen Journal abgestimmt |
| Wiederholbarkeit | Beide Szenarien je zweimal identisch, insgesamt 20 Spielmonate und 40 Firmen-Monatsbeobachtungen |

**Pruefbefehl:**

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_natural_oil_to_export_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_natural_oil_to_export_v194.cjs
```

Verifiziert: 20 simulierte Spielmonate, 40 Firmen-Monatsbeobachtungen, zwei Szenarien je zweimal reproduzierbar; je Szenario fuenf JSON-Rundlaeufe. Im offenen Fall 9 Barrel verkauft und **714.690 Cent** Aussenmarkterloes; bei Streckensperre 0 Barrel verkauft und 9 Barrel zurueckgegeben. Vorzeitige Verarbeitung und Angebote, Ueberverkauf sowie Doppelvormerkung wurden abgewehrt. Die Kassen-Journal-Abstimmung bestand. Der gezielte Workflow ist `.github/workflows/prerelease-natural-oil-export.yml`; er sichert das JSON-Protokoll als GitHub-Artefakt. Das CI-Ergebnis ist unabhaengig vom Dokument zu kontrollieren; ein nicht gestarteter, fehlgeschlagener oder abgebrochener Lauf gilt **nicht** als PASS.

## Grenzen und offene Release-Pflichten

- Nur eine Berliner Konzession, eine Raffinerie, eine Route und fuenf Monate; keine allgemeine Wirtschaftsbalance, Langzeitpartie oder Gewinn-/Vermoegensrechnung.
- Erloese sind nicht mit Gewinn gleichzusetzen. Lager-, Anlagen- und Schuldenbewertung fehlen weiterhin.
- Browser-Dateiimport, 800×600, Zoom, Tastatur, Performance und Offline-Start sind durch diesen **Node-Test** nicht abgedeckt; die vorhandenen separaten Pruefungen behalten ihren eigenen Status.
- Historischer C64-Vergleich und Rechte an den 77 zurueckgestellten Archivdateien bleiben offen.
- Alle 110 geschuetzten Originaldateien und der Spielkern bleiben unveraendert. Keine persoenliche Endabnahme, kein Merge, kein Release.

**Naechste drei Schritte:** (1) gezielte GitHub-CI und Gesamtregression am neuen HEAD auswerten, Fehler bei Bedarf beheben; (2) Monatsgewinn und Vermoegensbestand mit belegten Bewertungsannahmen getrennt vom Kassenfluss pruefen; (3) sporadischen Browser-Dateiimport reproduzierbar eingrenzen und beheben.


## Nachtrag 30.10.2026 – WIR-01: Kassenbruecke zur echten Oelkette (noch kein Gewinn)

**Ausgangsbasis:** main bei der Vorpruefung unveraendert auf d3dc371154cc1089e06f34d0dc4ff04047132360; Entwicklungs-HEAD vor dem Paket 216aad1485e23e8f3d4e522f366ced5429bef574. Der gezielte Oeltest war auf diesem HEAD [PASS (#41042109709)](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41042109709), Quellschutz und KI-Gesamtpruefung ebenfalls PASS. **Der Browser-Gesamtlauf [#41042109507](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41042109507) war FAIL**, weil bei 175 % nativer Zoom nach echtem Tab/Enter der Datei-Eingangsklick zwar registriert wurde (Nutzeraktivierung wahr), aber kein Datei-Auswahlereignis binnen 5 Sekunden folgte. Ein erneuter Lauf der fehlgeschlagenen Auftraege wurde angefordert; ein Retry-PASS wuerde die sporadische Ursache nicht beweisen.

**Neue, unabhaengige Teilpruefung:** Die bestehende reale Oelkette wurde um eine konservative Kassenbruecke erweitert. Saemtliche tatsaechlichen Journalbuchungen werden in Verkauf, Erwerb/Bau, bekannte laufende Kassenabfluesse, Frachtvorauszahlung, Frachtrueckgabe, Kredit, Tilgung und unbekannte Ein-/Auszahlungen zerlegt. Die Summe der Kategorien muss auf den Cent genau mit Journal und Kassenveraenderung uebereinstimmen. Die bereits gepruefte Aussenmarkt-Buchung muss im Verkauf enthalten sein; Investitionen und Frachtvorauszahlungen duerfen **nicht** als Gewinn behandelt werden. Acht absichtlich falsche Vorzeichen-/Zahlentypfaelle muessen scheitern; ein unbekannter Buchungscode bleibt sichtbar in der Restkategorie. Beide realen Szenarien werden wie bisher zweimal deterministisch ausgefuehrt, inklusive JSON-Rundlaeufen und Monatswechseln.

**Code-Commit:** [db374e4](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/db374e4962044a5cd5e3a3323c5eae0130731d50). **Workflow-Commit:** [89ff75e](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/89ff75ebab8c96d6094c8e6fb1ff84d9849cf475). Die GitHub-Pruefung verlangt zusaetzlich die Kassenbruecke und die Negativproben. **Status: PENDING bis zur tatsaechlichen CI auf dem endgueltigen HEAD.** Bei FAIL wird der Befund korrigiert, nicht als Erfolg gewertet.

**Fachliche Grenze:** Weder die Lagerbestaende noch Konzessionen, Raffinerie, Infrastruktur, offene Forderungen oder Schulden sind als Vermoegenswert bilanziert; es gibt keine verifizierte Kostenperiodisierung, Abschreibung oder C64-Originalregel. Daher **kein Unternehmensgewinn, kein Vermoegens-PASS**. WIR-01, WIR-04, BAL-01 und TES-04 bleiben BLOCKED. Pflichtmatrix unveraendert 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED. Die 110 manifestgeschuetzten Originaldateien und der Spielkern bleiben unveraendert; kein Merge, kein Release.

**Naechste drei Schritte:** (1) GitHub-CI auf finalem HEAD und Browser-Fehlerwiederholung auswerten, bei FAIL korrigieren; (2) die tatsaechlichen unbekannten Buchungscodes sowie physische Oel- und Anlagenbestaende in weiteren Regionen pruefen; (3) erst mit belegten Bewertungs- und Periodisierungsregeln eine Gewinn-/Vermoegensrechnung implementieren. Persoenliche Endabnahme erst am technisch eingefrorenen Kandidaten.

## Nachtrag 30.10.2026 – physische Bestandsbruecke vor Vermoegensbewertung

**Ausgangsstand:** [Gesamter Oelketten-Kurztest #41049396157](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41049396157) auf `d83622fe71c0a4055b4bb351e4ef617fd0433bca` PASS. Die [Browser-Gesamtpruefung #41049396089](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41049396089) FAIL im nativen 175-%-Dateidialog: Input-Klick und Nutzeraktivierung nachgewiesen, aber kein Dateiauswahldialog binnen 5 Sekunden. Keine verdeckte Umgehung und keine behauptete Reparatur.

**Neues technisches Teilpaket:** Der bestehende Test `test_natural_oil_to_export_v194.cjs` gleicht an **11 Stationen je Szenario** die tatsaechlichen Mengen aus dem Spielzustand ab: Feldlager, Rohstofftransport, Raffinerie-Rohstoff, Fertigware, Produkttransport, regionales Marktlager, oeffentliche Vormerkung, oeffentlicher Transport, Ziel-Lager, verkaufte Ware und Verarbeitungsschwund. Erwartete Bilanz: 100 Barrel gefoerdert = verbleibender Rohstoff + Ware in allen Transport-/Lagerstufen + 1 Barrel Schwund + verkaufte Ware. Offen und gesperrt werden je zweimal reproduziert: **44 Bestandskontrollen**, dazu **8 absichtlich falsche Verlust-/Verkaufswerte** als Negativkontrollen. Das Workflow-Gate verlangt die 44 Kontrollen und prueft alle Einzelbilanzen im JSON-Artefakt.

**Status der neuen Aenderung:** PENDING bis zur tatsaechlich erfolgreichen GitHub-CI auf dem finalen Entwicklungs-HEAD. Keine vorweggenommene PASS-Aussage. Diese Bestandsbruecke misst nur physische Mengen fuer H1 und die konkrete Berlin–Nord-Kette. Sie bewertet weder Konzessionen, Anlagen, Lager in Geld noch Abschreibungen, Forderungen oder Unternehmensgewinn. Die 110 geschuetzten Originaldateien und der Spielkern werden nicht geaendert. WIR-01/02/03, BAL-01 und die Gesamtfreigabe bleiben BLOCKED; Matrix 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.

**Naechste drei Schritte:** (1) Neue CI und JSON-Belege auf endgueltigem HEAD auswerten, Fehler korrigieren; (2) physischen Bestandsabgleich auf weitere Felder, konkurrierende Firmen und Randfaelle erweitern; (3) belegte Bewertungs- und Periodisierungsregeln getrennt von Kassenfluss/Bestandsmengen festlegen. Browser-Dateiauswahlfehler unabhaengig weiter untersuchen; persoenliche Endabnahme erst vor Release. Kein Merge und kein Release.
