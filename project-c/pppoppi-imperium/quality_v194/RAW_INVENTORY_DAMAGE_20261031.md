# Forschungsmodell V4 – Wertminderung verbrannter Rohölbestände (31.10.2026)

**Status:** `PPPOPPI-ADAPT/FIN-COST/4-DRAFT` auf dem separaten Forschungszweig `research/oli-finance-rules-20261031`. Diese Regeln sind **technische, belegpflichtige Forschungsregeln der eigenständigen PPPOPPI-Adaption**, weder geprüfte C64-Originalmechanik noch handelsrechtlich freigegebene Buchhaltung. Das Vorrelease bleibt **BLOCKED**. PR #141 und `main` werden nicht verändert.

## 1. Tatsächliche Befunde aus dem vorhandenen Spielkern

- Der Spielkern generiert einen Brand regelmäßig zu Beginn des **vierten** Monats. Die betroffene Konzession erhält `burning:true`, aber **keine** Veränderung der Rohölmenge und **keinen** Preisabschlag.
- Das Rohöllager besteht aus `inventoryMilli` und `preparedMilli`, die Menge wird in Tausendstel-Barrel gespeichert. Produktion und Fracht sind durch echte Kassenbelege dokumentiert.
- `FIRE_EXPERT` beseitigt den Brand gegen tatsächlich gezahlte Kosten, **ohne eine vermögensbezogene Rohölprüfung oder einen Wertminderungsbetrag zu liefern**.
- Darum würde jede automatische Bewertung von „0“, „100 % intakt“ oder einem festen Abschlagsprozentsatz eine **nicht vorhandene Regel erfinden**.

## 2. Belegpflichtige technische Modellregel

Das Forschungsmodell hält einen bei Brand tatsächlich vorhandenen Rohölbestand als **offenen Schadensfall** fest, einschließlich Claim, Monat, ursprünglicher Feld- und Versandlagermengen. Der Vorgang bleibt offen, **auch nachdem `FIRE_EXPERT` den Brand regulär gelöscht hat**.

`recordRawInventoryValuation(buch, spielstand, claimId, beleg)` ist eine ausdrücklich getrennte Bewertungsfunktion. Der Beleg muss enthalten: `claimId`, aktuellen `month`, exakt ermittelte `affectedQtyMilli`, `recoverableCent` (bewerteter verbleibender Rohölwert), eindeutige `sourceRef` und dokumentierte `method`.

Der Algorithmus verweigert die Schätzung, wenn die **regional gepoolten Rohölkosten nicht eindeutig einem einzigen Feldlager zugeordnet werden können**. Insbesondere bei zusätzlichen Lagerorten, offenen Rohöltransporten oder mehr als einer im Pool vermischten Konzession ist eine Einzelwertminderung aus dem vorhandenen Datenmodell **nicht beweisbar**. Das entspricht bewusst einem `UNSICHERE_CHARGENZUORDNUNG`-Blocker, keiner fingierten Herkunft.

Nur bei eindeutig isolierter Ware gilt die begrenzte Modellrechnung:

```text
Eindeutig belegter alter Rohölbuchwert = vorhandene Herstellungskosten in Cent
Wertminderung = alter Rohölbuchwert − einzeln belegter verbleibender Wert
Neuer Rohölbuchwert = verbleibender Wert
Rohölmenge = unverändert (kein unbelegter physischer Schwund)
```

Bei dieser **reinen Buchwertminderung** entstehen weder Verkaufserlöse noch automatische Förderkosten und es gibt keine zweite Ergebnisminderung beim späteren Verkauf. Der Betrag wird in `rawStockImpairmentCent` dokumentiert und bei der Modell-Bilanzidentität **genau einmal** abgezogen.

Die Bestandsprüfung verbietet die Umlabelung von `inventoryMilli` in `preparedMilli` und eine mengenmäßige Bewegung vor dem Prüfbeleg. Ein registrierter Schadensfall wird nicht durch Brandlöschung, den nächsten Monatswechsel oder eine neue Zustandskopie still gelöscht. Doppelte Einzelbewertungen und unbewiesene Zuschreibungen über den vorhandenen Buchwert sind gesperrt.

**Ergebnisgrenze:** Die Referenzangaben sind prüfbare Felder, aber eine synthetische Testreferenz ist **kein unabhängig authentifiziertes Sachverständigengutachten**. Auch bei formal gültigem Beleg liefert die Funktion nur `UNVERIFIED_DRAFT_ESTIMATE`, `accountingProfitCent:null`, `releaseGate:'BLOCKED'`.

## 3. Reale Szenarioprüfungen

Neun zusätzliche, deterministische Rohöl-Tests führen tatsächliche Spielhandlungen bis zum Brand in Monat 4 aus und prüfen:

1. Brand bei real geförderten 100 Barrel löst Schadens-Blocker aus, ohne Mengenänderung.
2. Realer `FIRE_EXPERT` löscht den Brand, aber **nicht** die offene Rohölbewertung.
3. Synthetisches Einzelgutachten reduziert nur die Buchwerte, nicht die Rohölmenge; die Bilanzidentität bleibt erhalten.
4. Ausdrücklich dokumentierte **Null-Minderung** bei nachweislich nicht beschädigter Ware ist testbar, ohne das Ergebnis freizugeben.
5. Dieselbe Charge kann **nicht doppelt** abgewertet werden.
6. Fehlende Quelle/Methode, falscher Monat, abweichende Rohölmenge, negative/überhöhte Werte werden zurückgewiesen.
7. Ungültige Zuordnung zum Buchungsstand und Mengenänderung vor Bewertung werden zurückgewiesen.
8. Restwert **Null** wird nur mit ausdrücklichem Testbeleg gesetzt, nie durch Brandheuristik.
9. Manipulierter oder nicht zuordenbarer Rohöl-Kostenpool wird nicht als gültige Einzelbewertung angenommen.

Die vorhandenen Viermonats- und Mehrfirmenfälle wurden ebenfalls angepasst. Wenn ein Brand vorliegt, bewerten sie die verbleibende Ware mit einem **ausdrücklich als synthetisch bezeichneten Null-Abschlag**, bevor die bereits im Spiel vorgesehene Löschaktion abgeschlossen wird. Diese Testbelege sind **keine unabhängigen Nachweise realen Warenzustands**.

### Abgrenzung zu anderen Pflichtarbeiten

- **Schadensbehandlung von Anlagen:** Separates `recordDamageValuation` mit explizitem Anlagen-Restwert; eine Lagerbewertung ersetzt dessen Nachweis **nicht**.
- **Vertragsforderungen und andere Firmen:** Es werden weiterhin keine nicht vorhandenen Forderungsbuchungen oder Claim-Herkunftsschlüssel erfunden. Bereits abgedeckte Mehrfirmen-Frachtrückerstattung wird weiter regressionsgetestet.
- **Unveränderte Freigabe-Matrix:** 52 Pflichtkriterien: 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED.
- **Historische Originalbelege und Rechte:** C64-Abgleich und die 77 ungeklärten Archivobjekte bleiben außerhalb der freigegebenen Basis.

## 4. Reproduzierbare Prüfungen

```bash
node --check project-c/pppoppi-imperium/quality_v194/cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_raw_damage_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_multifirm_public_v194.cjs
python3 tools/validate_project.py
python3 -m unittest discover -s tests -q
```

Der bestehende Forschungs-GitHub-Workflow muss auf dem **letzten Commit** unter Node.js 22/24 und mit Quellschutz erfolgreich sein, bevor ein technischer Erfolg berichtet wird. Neuer Finanztestumfang je Node-Version: **51 Tests** (vorher 42 + 9 Rohöllagerfälle).

## Die nächsten drei Schritte

1. **Belastbare externe Schadens-/Restwertbelege:** Echte, nachvollziehbare Werte für betroffene Anlagen *und* Rohöllager beschaffen bzw. die dafür nötige eigene PPPOPPI-Regel bewusst fachlich freigeben. Weiter keine historischen C64-Werte erfinden.
2. **Claimgenaue Kostenherkunft:** Mehrere Feldlager, regionale Durchschnittspools und Rohöl im Transit so erfassen und prüfen, dass Wertminderung einer einzelnen Charge ohne unbelegte Zuordnung möglich wird; hierfür separate Datenherkunft statt pauschaler Abschläge.
3. **Vollständige Langzeit-, Gegen- und Endspielprüfung** einschließlich Forderungen, Mehrfirmen, Schäden, Freigabematrix, C64-Originalbelegen und Medienrechten; kein Merge vor vollständiger Abnahme.
