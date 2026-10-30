# WIR-02/WIR-01 – Zweistufige Frachtkette bis zum Außenmarktverkauf (30.10.2026)

**Status: PENDING – kein bestandener Test behauptet, bis GitHub-CI auf dem finalen Commit erfolgreich ist.**

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

GitHub-Workflow: `.github/workflows/prerelease-ai-strategy-metrics.yml`; der JSON-Ausgabewert wird mit festen Mindestanforderungen kontrolliert und als Artefakt gespeichert.

## Grenzen und Freigabe

- Der Test prüft ausschließlich eine konkrete Zweikantenroute, keinen vollständigen Transportnetz- oder Balancenachweis.
- Die Ware wird als Testvorbedingung gesetzt. Ölproduktion, Raffinerie, natürliche Verträge, echte Browsersteuerung, 800×600 und weitere Lieferwege sind nicht Bestandteil dieses Testpakets.
- Ein Verkaufserlös ist **kein** Unternehmensgewinn. Anlagenwerte, Lagerbewertung, Schulden und periodengerechte Kosten bleiben offen.
- C64-Originaltreue und die Nutzungsrechte der 77 zurückgestellten Archivdateien bleiben ungeklärt.
- **WIR-01 und WIR-02 bleiben BLOCKED**, auch bei erfolgreichem Teiltest. Keine persönliche Endabnahme, kein Merge, kein Release.

**Nächste drei Pflichtarbeiten:** (1) CI-Ergebnis auf dem finalen HEAD auswerten und Fehler beheben; (2) natürliche Produktion/Raffinerie in eine Transport-Verkaufs-Kette einbinden; (3) Warenbestände und wirtschaftlichen Wert über Monatswechsel unabhängig bilanzieren.
