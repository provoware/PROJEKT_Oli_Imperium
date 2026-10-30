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
