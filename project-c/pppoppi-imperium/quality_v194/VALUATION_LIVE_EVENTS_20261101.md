# Bewertungsvertrag V1: echte, lesende Engine-Ereignisbruecke (01.11.2026)

## Zweck / Grenze
Die bisherigen isolierten 21 Modelltests belegen mathematische Regeln, aber keine universelle Zuordnung zu echten Spielereignissen. `valuation_live_event_adapter_v1.cjs` liest erstmals die von der echten V0.8.2-Engine nach `E.transition` erzeugten Kassenbuchungen und Monatsberichte. **Kein Produktcode, keine Spielerwertung, kein Speicherformat und keine 52er-Pflichtmatrix werden geaendert.** `productConnected: false` im Bewertungsvertrag ist weiterhin korrekt: Dies ist ein *lesender Pruefadapter*, keine produktiv angeschlossene Buchhaltung.

Die neuen Regressionen verwenden zwei echte, getrennte zwei-Monats-Spielablaeufe mit je zwei Firmen: (a) reguläre Vertragslieferung mit tatsaechlicher Sofortzahlung von 2.987.600 Cent und (b) natuerlicher Vertragsbruch ohne Lieferung/Umsatz und mit echter Vertragsstrafe. Aktionen: SURVEY, BUY, DRILL, SIGN, im Lieferfall PUMP, reguläre END_TURN/NEXT_MONTH. Die Engine liefert originale Ereignis-IDs, Firmen, Generation, Monatsnummern, Verträge, Zahlungen und Berichte. Keine unmittelbare Zustands- oder Kasseninjektion.

## Erreichte, eng begrenzte Zuordnung
- Eindeutige echte Ledger-IDs und sichere Cent-Betraege je Firma/Generation/Monat; Kassenbuchsumme gegen belegte Startkasse und gegen den echten Monatsbericht. Bei fehlendem Abschluss (kein REPORT), doppelter ID, Ueberlauf, fehlender Firma, abweichendem Cash oder gefaelschtem Umsatz: harter Fehler.
- `VERTRAGSERLÖS` wird nur bei belegtem DONE-Vertrag und echtem positiven Kassenzugang als **einmaliger sofort bezahlter Verkauf** gelesen; fuer diesen konkreten Verkauf keine zusaetzliche Forderung. Bei Bruch bleibt Umsatz null. Die Monatsumsatzsumme muss mit dem Engine-Bericht uebereinstimmen.
- `FELDKAUF`, `FACHBOHRUNG`, `RAFFINERIE_BAU`, `VERTRIEBSROUTE`: Investitionszahlungen mit Eigentums-/Fertigstellungsnachweis, **keine** stillschweigende Abschreibung oder Vermoegensbewertung.
- `ZAHLUNG_<Rechnungsart>`: belegte und je Rechnung abgestimmte Zahlung ist nur Tilgung der Rechnung; keine zweite Aufwandsentstehung. TILGUNG bleibt getrennt von Nicht-Tilgungs-Verbindlichkeiten.
- Nicht zugeordnete Buchungscodes bleiben als `UNMAPPED` sichtbar. **Alle** Gesamtwerte fuer Anlagen, Lagerkosten, Gewinn, Eigenkapital und Gesamtvermoegen bleiben `null` / `NOT_COMPUTABLE`. Keine hypothetischen Kosten werden in die laufende Partie geschrieben.

## Bewusste Fehlergrenzen
- Eindeutige Spiel-/Sitzungskennung sowie ein dauerhaftes journalisiertes Generationenprotokoll fehlen im bisherigen Spielkern. Die Bruecke nimmt nur belegte Startkasse und `generation===1` an; sie **lehnt RESTART-Folgegenerationen ab**, statt deren geloeschte Vorhistorie zu erfinden.
- Die beobachteten zwei Monate belegen keine 12/36/120-Monats-Abschreibung, keinen vollstaendigen Lagerkostenverlauf, keine echten Kreditverkaeufe, keine Brandschaden-Bewertung, keine persistente Ereignisjournalisierung und keine 1-Cent-Eigenkapital-Gegenprobe.
- `recognizedReceivablesForTheseCashSalesCent: 0` gilt ausschliesslich fuer die beobachteten, bar bezahlten Umsaetze; **Gesamtforderungen** bleiben unbekannt. Unbekannte Buchungscodes duerfen nicht als Nullkosten interpretiert werden.
- Kein neuer Siegervertrag, keine Altarchiv-Umbewertung, kein produktiver Adapter, kein C64-Historienbeweis, kein Release.

## Reproduzierbarer Test
```bash
node --check project-c/pppoppi-imperium/quality_v194/valuation_live_event_adapter_v1.cjs
node --check project-c/pppoppi-imperium/quality_v194/test_valuation_live_event_adapter_v1.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_valuation_rules_proposal_v1.cjs project-c/pppoppi-imperium/quality_v194/test_valuation_live_event_adapter_v1.cjs
```
Der bestehende Modellworkflow ist um die neuen Dateien und Testaufrufe erweitert. **Bis zum tatsaechlichen erfolgreichen Lauf auf dem finalen Commit ist der CI-Status PENDING.** Auch bei PASS bleibt die technische Gesamtfreigabe unveraendert gesperrt.

## Naechste drei Pflichtarbeiten
1. Reale Produktions-, Raffinerie-, Lager-, Verkaufs-, Schadens- und Rechnungsereignisse vollstaendig versioniert zuordnen; unbekannte Codes fail-closed und Generations-/Sitzungsidentitaeten nachweisbar halten.
2. 12/36/120 reale Monate je mindestens zwei Firmen mit Abschreibungen, Materialkosten, Rechnungen, Kredit, Export/Import und unabhaengiger Cent-Gegenprobe pruefen; keine implizite Gewinnfreigabe.
3. Krisen- und Niederlagen-Endpfade samt Archivschutz in Browser/Engine getrennt nachweisen; fuer eigene Inhalte eine ausdrueckliche Lizenzentscheidung treffen, Fremdmaterial nicht ungeprueft freigeben.

**#150/#141 bleiben DRAFT, Pflichtmatrix unveraendert, kein Merge nach main, keine Veroeffentlichung.**
