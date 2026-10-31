# Sonderfall-Gegenproben der PPPOPPI-Forschungsbilanz – 31.10.2026

**Zweck:** Im bereits vorhandenen Forschungszweig `research/oli-finance-rules-20261031` belegbare Bilanzvorgänge durch echte Spielkern-Aktionen und ihre Kassen-, Lager- und Schuldenänderungen gegentesten. **Keine C64-Originalregel, keine gesetzliche Bilanzfreigabe, kein Release und kein Merge.**

## Fachlich begründete Forschungsentscheidung (NICHT endgültig genehmigt)

**Rohöl-Zulieferfracht** dient unmittelbar der Bereitstellung von Rohöl am Werk. Deshalb wird **nur** eine echte `FRACHT`-Auszahlung mit nachgewiesenem neuem Transportbeleg `RAW` im **Rohöl-Herstellungskostenbestand** aktiviert. Bei einer späteren Verarbeitung wandert der anteilige Rohölwert einschließlich der Fracht in die Fertigware. Erst **beim tatsächlich abgerechneten Verkauf** mindert er das Periodenergebnis. **Fertigwarenfracht** bleibt Vertriebsausgabe. Diese Einordnung entspricht der Kostenkausalität des eigenen Modellprofils, behauptet aber weder C64-Historie noch eine handelsrechtlich gültige Regel.

Beobachtetes reales Beispiel: 100 Barrel Rohöl haben anfangs **100.000 Cent** Herstellungskosten. Für 10 Barrel eigene Zulieferung bezahlt die Spiellogik **14.000 Cent**. Im gewichteten regionalen Rohölpool ergeben sich dann **114.000 Cent für 100 Barrel**, wovon **11.400 Cent auf 10 Barrel** entfallen. Die echte Raffinierung kostet **65.000 Cent** und erzeugt aus den 10 Barrel Rohöl **9 Barrel Fertigware mit 76.400 Cent Buchwert**. Die verbleibenden 90 Barrel Rohöl tragen **102.600 Cent** Herstellungskosten. Die Ware steht bei Anfahrt und im Depot weiterhin im Eigentum der Firma; eine bloße Transporteintragung ist **kein Umsatz**.

**Abschreibungsdauern:** Für reproducible Forschung weiterhin 120 Monate bei Konzession/Bohrung/Raffinerie und 60 Monate bei Tankausbau/Vertriebsweg/Streckennetz, **linear ab Folgemonat**. Das ist kein belegter Verschleiß- oder historischer Originalwert. Eine belastbare endgültige Festlegung erfordert noch die Entscheidung über tatsächliche Nutzung, Restwert, Schaden, Veräußerung und regelmäßige Wertminderung. Bis dahin `status:DRAFT_NOT_APPROVED` und `releaseGate:BLOCKED`.

## Neue Sonderfallabdeckung (jeweils im echten Spielkern)

1. **Rohölzulieferung versus Fertigwarenversand:** Belegte Zulieferfracht wird zu Rohölkosten statt Sofortaufwand. Ausgehende Fertigwarenfracht bleibt Vertriebsausgabe. Keine fehlenden Transportbelege fingieren.
2. **Öffentliche Frachtvorauszahlung:** `PUBLIC_FREIGHT_HOLD` wird zunächst als aktivische Vorauszahlung geführt. Erst die reale Monatsauktion belastet den tatsächlich zugeteilten Frachtanteil; `FRACHT_RUECKGABE` entlastet den Vorschuss und muss zu seiner Höhe passen. Ein nicht belegter Rückerstattungsbetrag wird zurückgewiesen. Im Quellmonat werden angenommene Waren nach Absender- und Zielregion zugeordnet.
3. **Öffentlicher Zielmarkt:** Angebot und Transport erzeugen noch keinen Umsatz; erst `AUSSENMARKT`-Zahlung nach Auktion. Transportierte Ware bleibt im Modell als Bestand erfasst. Nicht unterstützte Fälle und inkonsistente Mengen lösen Fehler aus.
4. **Vertragsabschluss:** `SIGN` begründet noch keinen Gewinn. Tatsächlich erfüllter Vertrag erzeugt `VERTRAGSERLÖS`, gleichzeitig werden gelieferte Rohölmengen zu Herstellungskosten ausgebucht. Versandkostenforderungen werden als offene Rechnungen/gezahler Aufwand abgegrenzt.
5. **Vertragsbruch:** Bei fehlender Ware wird `BREACH` erzeugt, ohne erfundenen Umsatz. Die echte Vertragsstrafe fließt über Rechnung und Zahlung in den Periodenaufwand.
6. **Brandschaden:** Für `burning` oder `damaged` sperrt die Bilanzansicht mit `WERTMINDERUNG_OFFEN`. In der Viermonats-Hauptkampagne wird ein **tatsächlich entstandener Brand durch reale `FIRE_EXPERT`-Spielaktion** gelöscht; die real bezahlten **1.200.000 Cent** werden als Aufwand aufgenommen. So entsteht keine fingierte Null-Wertminderung.
7. **Notverkauf in echter Zahlungskrise:** Eine lange Partie mit drei anfänglich erworbenen Konzessionen führt durch echte Monatslohn-Belastungen in `RESCUE`. Der echte `RESCUE_SALE` entfernt das verkaufte Feld und dessen vorhandenen Buchwert, nimmt den Verkaufspreis ins Kassenjournal und berechnet das Modell-Ergebnis aus Verkaufserlös abzüglich ausgebuchtem Restbuchwert. Voller Firmenneustart bleibt ausdrücklich gesperrt.
8. **Datenintegrität und Negativfälle:** Unpassende Frachtquittungen, unbekannte Buchungsarten, manipulierte Kreditstände, fehlende historische Anschaffungswerte, doppelte Belege, beschädigte Mengen und unzureichend belegte Schadenwerte werden nicht automatisch bilanziert.

## Vier echte Spielmonate mit tatsächlicher Brandlöschung (Modell V2)

Belegte Modellpositionen nach vier Monatsabschlüssen mit echten Engine-Aktionen, einschließlich des **im vierten Monat real ausgelösten und fachgerecht beseitigten Brands**:

| Größe | Wert in Cent |
| --- | ---: |
| Verkaufserlöse | 7.897.311 |
| Periodenaufwendungen inklusive Brandlöschung | 2.036.100 |
| Herstellungskosten tatsächlich verkaufter Ware inklusive Rohöl-Anlieferfracht | 241.400 |
| Modell-Abschreibung der aktivierten Anlagen | 444.999 |
| **Rechnerisches Modell-Periodenergebnis** | **5.174.812** |
| Modell-Reinvermögen bei 20.000.000 Cent Startkapital | **25.174.812** |
| Reale, freigegebene Gewinnzahl | **nicht ermittelt (`null`)** |

Die Prüfung soll ausdrücklich **scheitern**, wenn der Brand nicht durch einen belegten Wirtschaftsprozess behoben wird: Bis zur Klärung der Wertminderung gibt es keine zuverlässige Bilanz.

## Gezielte GitHub-Prüfungen

Im Forschungszweig sind die folgenden Prüfschichten angelegt:

- Bereits vorhandene unabhängige Geldgrenzen: 6 Tests.
- Eigenständige vorläufige Bilanzidentitäten: 8 Tests.
- Reale viermonatige Kosten- und Transportkette: 8 Tests.
- Neue öffentliche Fracht-, Vertrags-, Schaden-, Rettungs- und Negativszenarien: 8 Tests.
- Matrix unter Node.js **22 und 24** sowie separater Quellschutz und Python-Projektvalidierung.

```bash
node --check project-c/pppoppi-imperium/quality_v194/cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_special_cases_v194.cjs
python3 tools/validate_project.py
python3 -m unittest discover -s tests -q
```

**CI-Erfolg gilt ausschließlich für exakt den Commit, auf dem alle genannten Prüfungen tatsächlich abgeschlossen wurden.** Vorher gibt es keinen neuen technischen Abschlussstatus.

## Unverändert gesperrt

- Rechtliche/ursprüngliche Nutzungsrechte der 77 ausgeschlossenen Archivdateien; C64-Originalregel-/Grafik-/Spielstandsvergleich und historische Vermögensregeln.
- Fachliche Entscheidung über 60/120 Monate, Produktions-Anlieferfracht, Wertminderung/Restwert und Preisbildung in der eigenständigen PPPOPPI-Adaption.
- Vollständige öffentliche Fracht-Rückgabeketten bei Teilkapazität, alle großen/alternativen Verträge, Warenbestand pro Einzelclaim, Forderungsentstehung ohne Zahlung, Umlagerung mit Sondermengen, vollständige Insolvenz und Neustarts.
- Release-Matrix bleibt **52 Kriterien: 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**.

## Drei nächste Pflichtschritte

1. **Fachentscheidung zu Restwert und Nutzungsdauer** dokumentieren; Rohöl-Zulieferfracht-Regel für die PPPOPPI-Adaption ausdrücklich genehmigen oder korrigieren, getrennt von C64-Originalmechaniken.
2. **Weitere reale Grenzfälle** prüfen: öffentlicher Frachtstau mit tatsächlicher Rückzahlung, offene Forderung, Sonderkontrakte, beschädigte Raffinerie, Liquidation mit offener Ware und mehrere Firmenregionen.
3. **Prüfung des endgültigen Forschungs-HEADs** auf GitHub vollständig auswerten und erst dann den fachlichen Integrationsauftrag ohne neuen Draft vorbereiten. **PR #141 bleibt DRAFT, kein Merge nach `main`**, bis alle Pflichtgates nachgewiesen sind.
