# PPPOPPI-Wirtschaft – Kostenrichtlinie und Viermonats-Gegenprobe (31.10.2026)

**Entwicklungsstatus:** Eine **innerhalb des isolierten Forschungsmodells verbindlich festgelegte Version** der Kostenregeln, aber **KEINE fachliche Freigabe** für das endgültige Spiel und **KEINE historische C64-Originalregel**. `main`, der geprüfte Integrations-HEAD von PR #141 (`7ce841ba43d2d2fd94fec90ef206b19d48bae8b2`) und die 110 SHA-geschützten Spielquellen bleiben unverändert. Die 52er-Pflichtmatrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED.

## 1. Verbindliche Testmodell-Richtlinie `PPPOPPI-ADAPT/FIN-COST/1-DRAFT`

| Posten | Kosten-/Ertragsregel im Forschungstest | Status/Grenze |
| --- | --- | --- |
| Gutachten | Sofortaufwand zum realen Kassenbeleg `GUTACHTEN` | Adaption-Entscheidung, kein C64-Beleg |
| Feldkonzession | Tatsächliche Anschaffungsauszahlung `FELDKAUF` als Anlagenbuchwert | Nur eigenes neues Feld |
| Bohrung | `FACHBOHRUNG` als Anschaffungs-/Herstellungskosten der Anlage | Keine Reserve im Boden als zusätzlichen Vorrat |
| Tankausbau | `TANKAUSBAU` aktiviert | Keine unbelegten Verkaufspreise |
| Raffinerie | Tatsächliche `RAFFINERIE_BAU`-Auszahlung aktiviert | Nur ab dem beobachteten Bau |
| Vertriebsroute / eigene Netzstrecken | `VERTRIEBSROUTE` und `STRECKENBAU` aktiviert | Nur dokumentierte Bauauszahlungen |
| Abschreibungen | Linear, centgenau ab **Folgemonat**: Feld/Bohrung/Raffinerie je **120 Monate**, Tank/Vertriebsroute/Netz je **60 Monate**; Restcent am Schluss | **Modellannahme**, nicht Nutzungsdauer des C64-Originals |
| Rohöl | Tatsächlich gezahlte `FOERDERUNG`-Kosten werden bei Erzeugung in Rohölvorrat umgebucht | Nicht Marktpreis; unerschlossene Reserven = 0 zusätzlicher Bestand |
| Fertigware | Pro realer Raffineriecharge **10 Barrel Rohöl → 9 Barrel Fertigware**; ursprüngliche Rohölkosten + echte `RAFFINERIE_VERARBEITUNG`-Auszahlung gehen über | Mengen **aus dem echten Spielkern**, keine freie Annahme |
| Gleichartige Lagerware | Je Region ein **gewichteter Durchschnitt** mit ganzzahliger anteiliger Kostenabgabe; keine Kosten aus Marktpreis | Standortwechsel nur soweit mengenmäßig beweisbar |
| Eigenes Transportnetz | Ware in Anfahrt, Werk und Marktdepot bleibt als Bestand erfasst; `FRACHT`/direkte Transporte derzeit als periodenbezogener Vertrieb/Betriebsaufwand | **Offene Freigabefrage:** Bei Rohöl-Anlieferung zur Produktion Fracht möglicherweise aktivierungspflichtig; hier klar als Modellannahme ausgewiesen |
| Verkäufe | Umsatz **erst** durch tatsächliche Zahlung auf `MARKTERLÖS`, `RAFFINIERT_MONATSVERKAUF` oder `AUSSENMARKT`; beim tatsächlichen Absatz sinkt der Warenbuchwert um Herstellungskosten | Ein Angebot allein ist kein Umsatz; Vertragsfälle separat |
| Kredite/Tilgung | Kreditzufluss `RETTUNGSKREDIT` / `KI_RETTUNGSKREDIT` und Hauptschuld-Tilgung `ZAHLUNG_TILGUNG` **nicht** erfolgswirksam; Schuldenveränderung muss zu Buchungen passen | Keine zweite Schuld durch offene Tilgungsrechnung |
| Löhne, Zinsen und sonstige Rechnungen | Tatsächliche Zahlungen plus Veränderung der offenen Nicht-Tilgungsrechnungen; damit auch unbezahlt entstandene Aufwendungen | Nur tatsächlich im Spiel erfasste Rechnungstypen |
| Forderungen | Im geprüften, unmittelbar bezahlten Marktverkauf **0**, aber keine pauschale Aussage über andere Vertragsarten | Bei unklaren Vertrags-/Lieferfällen Abbruch |
| Eigenkapitalbewegungen | Keine automatische Schätzung; vorläufig keine externen Eigentümereinlagen im getesteten Ablauf | Bei realen Einlagen/Neustart eigene Belege und Neustartgrenzen |
| Unbekannter Buchungscode | Abbruch mit Fehlermeldung, **nicht** automatische Gewinnzuordnung | Fehler vermeidet Scheinbilanz |

Die Angaben **60/120 Monate** und die Frachteinordnung sind bewusst **versionierte Entwurfsentscheidungen**, damit wiederholbare Proben möglich sind. Sie sind weder gesetzliche Abschreibungsvorschriften noch historisch verifizierte Öl-Imperium-Regeln. Über ihre dauerhafte Übernahme muss bei der Adaption noch fachlich entschieden werden.

## 2. Tatsächliche Buchungs- und Bestandsbrücke

**Datei:** `cost_basis_v194.cjs`, separat neben `accounting_model_v194.cjs`, keine Änderung an `SPIEL/**`.

Die Brücke verfolgt für **jede einzelne reale Spielaktion** die Differenz des vorherigen zum folgenden unveränderten Spielzustand:

- Kasse gegen jede neue, eindeutig identifizierte Kassenbuchung, einschließlich Buchungsvorzeichen und Änderungen der Hauptschuld;
- Rohöl und Fertigware je Region über Feldlager, Angebot, Werk, eigene inländische Transportaufträge, Depot und Markt sowie in den Beobachtungsumfang fallende öffentliche Lager-/Transportregister;
- gekaufte Felder, gebaute Bohrungen, Raffinerien und Netze zu tatsächlichen Auszahlungskosten; centgenaue Abschreibung ab Folgemonat;
- Umsätze und **Kosten der verkauften Mengen** ausschließlich beim tatsächlichen Monatsabschluss, niemals bei Vormerkung;
- noch nicht gezahlte Lohn-/Zinsrechnungen als Schulden, nicht als stillschweigend fehlende Kosten; offene Tilgung bleibt ausschließlich in der Hauptschuld;
- unreconciliierte Bestandsmengen, entstellte Rechnungsjournale, falsche Kreditschulden, unerklärte Cashflows und nicht unterstützte Geschäftsvorfälle werden **abgelehnt**, statt als Gewinn ausgegeben zu werden.

Die Bilanzidentität wird am Beobachtungsstand doppelt berechnet und verglichen:

`Kassen-/Vorrats-/Anlagenwerte − bekannte Schulden = Start-Reinvermögen + Erlöse − laufende/abgegrenzte Kosten − Herstellungskosten der verkauften Mengen − Abschreibungen`.

Diese Abstimmung ist lediglich innerhalb der **unveränderten Firmen-Generation und des lückenlos beobachteten Vorgangsregisters** zulässig. Das Modul lässt sich absichtlich nicht mit einem beliebigen alten Spielstand starten, für den historische Anschaffungskosten fehlen. Zahlungen ohne passende Buchung und unbekannte Codes lösen Fehler aus.

## 3. Vier echte Spielmonate: Zahlen und reproduzierbare Prozesskette

Isolierter Test mit echten Modulen `v07`, `v08`, `v082`, `profi_economy`, `logistics_v17`, `public_network_v171`, `strategy_ai_v192` und `strategy_logistics_v193`; zwei menschliche Firmen, deterministischer Startwert; 30 einzelne erfolgreich überführte Spielzustände. **Keine manuell erfundenen Spielumsätze oder Einkaufspreise.**

| Monat | Belegte Aktionen | Kostenwirkung und Bestand |
| --- | --- | --- |
| 1 | Gutachten, Kauf, Bohrung, 100 Barrel Förderung, Raffineriebau, 10→9 Barrel Verarbeitung, Vertriebsroute, 90 Barrel Rohöl und 9 Barrel Fertigware verkaufen | **165.000 Cent** tatsächliche Herstellkosten der verkauften Mengen; **7.119.000 Cent** echte Verkaufseinnahmen |
| 2 | Eigenes Streckennetz (RAW/PIPE/FINAL) errichten, weitere 100 Barrel fördern, 10 Barrel Rohöl zum Werk verschicken | Rohöl-Transit mit **10.000 Cent** Herstellungskosten; kein vorweggenommener Umsatz |
| 3 | Empfangene 10 Barrel im Werk verarbeiten; 9 Barrel Fertigware über das eigene Netz zum Markt verschicken | Fertigware auf Transport mit **75.000 Cent** Herstellungskosten; noch kein Umsatz |
| 4 | Fertigware am Markt anbieten und echten Monatsabschluss ausführen | Herstellungskosten der verkauften Mengen + **75.000 Cent**; unverkäufte 90 Barrel Rohöl bleiben mit **90.000 Cent** im Bestand |

**Kumulativer, synthetisch bewerteter Modellstand nach Monat 4:**

| Position | Tatsächlicher Rechenwert | Bedeutung |
| --- | ---: | --- |
| Zahlungseingänge aus Verkäufen | **7.897.311 Cent** | Engine-Kassenbuchungen |
| Gebuchte laufende Kosten | **850.100 Cent** | Lohn, Wartung, Transporte, Gutachten; inkl. eigener Netzfracht |
| Herstellungskosten tatsächlich verkaufter Ware | **240.000 Cent** | nicht produzierte, sondern verkaufte Menge |
| Abschreibungen gemäß Test-Richtlinie | **444.999 Cent** | keine belegte C64-Regel |
| **Rechnerisches Periodenergebnis** | **6.362.212 Cent** | **Modellwert, NICHT bilanziell freigegebener Gewinn** |
| Reinvermögen nach Test-Bewertung | **26.362.212 Cent** | umfasst Kasse + Anlagen + noch vorhandenen Rohölbestand |
| Historisch/gesetzlich bestätigter Gewinn | **nicht ermittelt (`null`)** | Vorrelease weiterhin `BLOCKED` |

Die Bilanzgleichung geht **centgenau** auf: Start-Reinvermögen 20.000.000 + Modell-Periodenergebnis 6.362.212 = 26.362.212 Cent. Das ist eine **Modellrechnung** für das gewählte Spielprofil. Die künstlich festgelegte Anlagen-Nutzungsdauer ist noch fachlich freizugeben; die Aussage darf nicht als historischer oder handelsrechtlicher Jahresabschluss missverstanden werden.

## 4. Unabhängige Validierung und Grenzen

**Lokale, isolierte JavaScript-Ausführung am tatsächlichen Spielkern:** 8/8 gezielte neue Tests PASS, außerdem 8/8 vorgelagerte Modelltests in einem separaten Durchlauf. Auch Übergangssperren, Zahlenüberläufe, Kassenbelege und die Veränderungsfreiheit des vorhandenen Spielzustands wurden geprüft. **Ein echter Node.js-/GitHub-Actions-Gesamtlauf auf dem endgültigen Forschungs-Commit ist getrennt zu belegen**, nicht vorwegzunehmen.

```bash
node --check project-c/pppoppi-imperium/quality_v194/accounting_model_v194.cjs
node --check project-c/pppoppi-imperium/quality_v194/cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_accounting_model_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_basis_v194.cjs
python3 tools/validate_project.py
python3 -m unittest discover -s tests -q
```

### Bewusst weiterhin blockierte Fälle

- **Anlieferfracht von Rohöl:** Zuordnung zu Produkt-Herstellungskosten versus Sofortaufwand benötigt eine verbindliche fachliche Entscheidung. Das jetzige Modell ist explizit auf Sofortaufwand eingestellt.
- **Lagerbewertung mit vollständiger FIFO-Chargenherkunft, regionsübergreifender Transport, öffentliche Frachtvorauszahlungen und alle Rückerstattungen:** vollständige rechtliche/bilanzielle Zuordnung noch nicht abgenommen. Nicht erkannte Fälle müssen fehlschlagen.
- **Notverkauf/Neustart, fremde Eigentümer-Zahlungen, Beschädigung/Wertminderung, unbezahlte Lieferforderungen, komplexe Vertragsabrechnung:** kein Gesamtprofit behauptet.
- **Betriebliche C64-Originaltreue und Rechte zu 77 Archivobjekten:** weiterhin ohne Original- bzw. Nutzungsfreigabe.

## 5. Nächste drei Schritte

1. Inbound-Transport-/Veredelungskosten, Abschreibungsdauern und Restwert anhand einer eigenständigen **fachlichen Freigabe der PPPOPPI-Variante** beschließen; historische Originalregeln separat erforschen.
2. Die Kostenbrücke auf öffentliche Fracht, überregionale Umlagerung, offengebliebene Rechnungen, Schaden und Notverkauf erweitern – **nur** mit jeweils eigener Ist-Buchung, Mengen- und Differenzprobe.
3. GitHub-Actions-Node-Tests und Repo-Validator auf dem endgültigen Forschungsstand auswerten; erst mit vollständigen Nachweisen einen bestehenden PR aktualisieren (kein neuer Draft-PR), **kein Merge nach `main`** und kein Vorrelease-PASS ohne Matrixfreigabe.
