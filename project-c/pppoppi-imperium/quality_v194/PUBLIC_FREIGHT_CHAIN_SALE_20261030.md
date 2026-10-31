# WIR-02/WIR-01 – Zweistufige Frachtkette bis zum Außenmarktverkauf (30.10.2026)

**Teiltest PASS auf dem unveränderten Test-HEAD `f69ea985bbb88be6dd1fa299432e95924e42546f`**, [gezielte GitHub-CI #41035085332](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41035085332), 30.10.2026, Job `freight-chain` einschließlich Syntax, 12 Spielmonaten, 24 Firmen-Monatsbeobachtungen, 8 Duplikat-Abweisungen, 12 JSON-Rundläufen und 4 verfrühten Verkaufsabweisungen. Der offene Zweikantenfall erzielte je Firma **759.591 Cent** Außenmarkterlös; bei Sperrung der zweiten Kante gab es **0 Cent**. Beide Fälle waren jeweils zweimal reproduzierbar. Die integrierte Vorrelease-Sperre bleibt ausdrücklich BLOCKED. Ein späterer reiner Dokumentations-Commit erfordert weiterhin eigene CI-Kontrolle auf seinem HEAD.

## Zweck und Änderung

Der bisherige Frachtmonatstest überprüft eine Kante, die Zuteilung, Rückerstattung und Ankunft. Der neue eigenständige Test `test_public_freight_chain_sale_v194.cjs` prüft eine durchgehende Waren- und Geldkette: **BERLIN → BRANDENBURG → NORD**, gemeinsamer Engpass auf der zweiten Kante, zwei Spielmonatswechsel bis zur Ankunft, anschließendes `PUBLIC_OFFER` und tatsächliche `AUSSENMARKT`-Buchung. Der vorhandene V1.7.1-Spielkern bleibt unverändert.

## Reproduzierbare Szenarien

| Szenario | Vorgemerkt | Erwartete Zuteilung je Firma | Rückgabe je Firma | Ankunft | Verkauf |
|---|---:|---:|---:|---|---|
| Beide Kanten offen | 18 Barrel/Firma | 9 Barrel | 9 Barrel | Monat 3 | je 9 Barrel in Monat 3 |
| Kante BB-N gesperrt | 18 Barrel/Firma | 0 Barrel | 18 Barrel | keine | keiner |

- Zwei Menschenfirmen mit künstlich vorbereiteten 30 Barrel Ausgangslager und 200.000 € Kasse; **kein natürlicher Produktionsnachweis**.
- Vier Ausführungen (zwei Szenarien jeweils zweimal), drei Monatsabrechnungen je Ausführung = **12 simulierte Spielmonate**, 24 Firmen-Monatsbeobachtungen.
- Unabhängige Frachtberechnung je Kante, Mengenabgleich vor/nach Auktion, verzögerte Lieferung und getrennte Außenmarkt-Verkaufserlöse.
- Acht wiederholte Vorgangskennungen müssen abgewiesen werden, zwölf JSON-Speicher-/Wiederherstellungsrundläufe und vier verfrühte Verkaufsversuche müssen schadlos bleiben. Im offenen Szenario wird zusätzlich ein Verkauf über dem vorhandenen Bestand abgewiesen.
- Fracht- und Verkaufsbuchungen dürfen beim vierten Monatsbeginn nicht erneut entstehen; `E.validate` und unveränderte Eingabezustände sind für jeden erfolgreichen Übergang Pflicht.

## Prüfbefehle

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_public_freight_chain_sale_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_public_freight_chain_sale_v194.cjs > public_freight_chain_sale.json
```

GitHub-Workflow: `.github/workflows/prerelease-freight-chain.yml`; der JSON-Ausgabewert wird mit festen Mindestanforderungen kontrolliert und als Artefakt gespeichert.

## Grenzen und Freigabe

- Der Test prüft ausschließlich eine konkrete Zweikantenroute, keinen vollständigen Transportnetz- oder Balancenachweis.
- Die Ware wird als Testvorbedingung gesetzt. Ölproduktion, Raffinerie, natürliche Verträge, echte Browsersteuerung, 800×600 und weitere Lieferwege sind nicht Bestandteil dieses Testpakets.
- Ein Verkaufserlös ist **kein** Unternehmensgewinn. Anlagenwerte, Lagerbewertung, Schulden und periodengerechte Kosten bleiben offen.
- C64-Originaltreue und die Nutzungsrechte der 77 zurückgestellten Archivdateien bleiben ungeklärt.
- **WIR-01 und WIR-02 bleiben BLOCKED**, auch bei erfolgreichem Teiltest. Keine persönliche Endabnahme, kein Merge, kein Release.

**Nächste drei Pflichtarbeiten:** (1) CI-Ergebnis auf dem finalen HEAD auswerten und Fehler beheben; (2) natürliche Produktion/Raffinerie in eine Transport-Verkaufs-Kette einbinden; (3) Warenbestände und wirtschaftlichen Wert über Monatswechsel unabhängig bilanzieren.


## Nachtrag 30.10.2026 – unabhängige Kassenbrücke für zwei Frachtfirmen

**Ausgangsbefund:** Die Zweikantenprüfung verifizierte bereits Frachtvorauszahlung,
Rückgabe und Außenmarkterlös einzeln. Sie kontrollierte aber nicht durchgehend,
ob der tatsächliche Kassenstand **jeder** Firma mit **allen** eigenen
Kassenbuchänderungen seit dem vorbereiteten Ausgangszustand übereinstimmt.
Ein fehlerhafter, nicht verbuchter Abfluss oder eine fremde Buchung konnte
so trotz korrekter einzelner Frachtzeilen übersehen werden.

**Änderung:** `test_public_freight_chain_sale_v194.cjs` erfasst pro Firma den
ursprünglichen Kassenstand und die ursprüngliche Buchungssumme, bevor echte
`PUBLIC_CONNECT`-, `PUBLIC_QUEUE`-, Monats- und Verkaufsaktionen laufen.
Ein davon unabhängiger Abgleich verlangt nach dem Frachtabschluss (Monat 1)
und dem Außenmarktverkauf (Monat 3):

`Kasse jetzt − Kasse anfangs = Buchungssumme jetzt − Buchungssumme anfangs`.

Je Firma und Kontrollzeitpunkt werden drei **ausschließlich in Kopien**
eingebrachte Fehler nachweisbar gesucht: (1) Kasse um einen Cent erhöht,
(2) eine reale Buchung um einen Cent erhöht, (3) eine Buchung in einen
unzulässigen Bruchteil eines Cents verwandelt. Der Prüfer muss jeden
Fehler erkennen; die Kopien werden niemals an den Spielkern übergeben.

**Prüfumfang (Soll, kein vorweggenommener PASS):** zwei Szenarien × zwei
identische Wiederholungen × zwei Kontrollzeitpunkte × zwei Firmen =
**16 Kassenbrückenprüfungen**, dazu **48 gezielte Negativproben**.
Die bisherige reale Zweikanten-Transportkette, die 12 Spielmonate,
24 Firmen-Monatsbeobachtungen, 8 Duplikatsperren, 12 JSON-Rundläufe
und 4 abgewiesenen Frühverkäufe bleiben unverändert.

**Nachweis:** Der verpflichtende GitHub-Auftrag
[`prerelease-freight-chain.yml`](../../../.github/workflows/prerelease-freight-chain.yml)
verlangt die exakten neuen Zähler im JSON-Ergebnis. Die vorherige
[GitHub-Frachtprüfung #41116524704](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41116524704)
war auf dem vorherigen HEAD erfolgreich. **Die neuen Negativproben sind
bis zum tatsächlich abgeschlossenen CI-Lauf auf dem neuen HEAD PENDING.**

**Unabhängige Blockade:** Die
[Browser-Gesamtprüfung #41116524784](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41116524784)
auf `8fc298a9bdb3ecad66d8b80b3f13477ec8cfb43e` ist FAIL:
bei 200 % blieb trotz echtem Tab/Enter, aktivem Nutzerereignis und
Klick am Datei-Eingang der native Dateidialog aus. Das ist weder durch
die Frachtprüfung noch durch einen anderen grünen Test behoben.

**Grenzen:** Die Ausgangslager und die Anfangskasse sind Testvorbedingungen,
keine natürlich geförderten oder raffinierten Rohstoffe. Eine Kassenbrücke
beweist weder Unternehmensgewinn noch Anlagen-/Lagerwert oder historische
Originaltreue. WIR-01, WIR-02, BAL-01 und TES-04 bleiben BLOCKED;
keine persönliche Endabnahme, kein Merge und kein Release.

**Nächste Arbeit:** Neue GitHub-Frachtprüfung auswerten und bei FAIL
korrigieren; danach den sporadischen Browser-Dateidialog ursächlich
untersuchen und eine natürliche Mehrfirmen-Förder-/Raffinerie-/Frachtkette
über mehrere Monate prüfen.
