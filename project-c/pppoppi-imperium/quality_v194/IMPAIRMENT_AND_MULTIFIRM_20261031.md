# Wertminderung, Restwert und knappe Frachtkapazität – Forschung 31.10.2026

## Status und Schutz

Fachlicher Vorrelease-Blocker der **eigenständigen** PPPOPPI-Adaption. Neuer Stand **`PPPOPPI-ADAPT/FIN-COST/3-DRAFT`** auf dem bestehenden Forschungszweig `research/oli-finance-rules-20261031`. **Keine bestätigte C64-Originalregel, kein handelsrechtlich abgenommener Abschluss, keine Spielkernel-Änderung, kein Merge, kein neuer Draft-PR.** PR #141 bleibt technisch geprüfter, aber gesperrter Entwurf auf `7ce841ba43d2d2fd94fec90ef206b19d48bae8b2`.

## 1. Fachentscheidung: Einzelnachweis statt pauschalem Schätzprozentsatz

**Begründete Modellregel:** Ein Brand oder eine tatsächliche Beschädigung bedeutet, dass der bisherige Buchwert als intakter Anlagenwert nicht automatisch zuverlässig ist. Die Engine enthält aber **keinen** nachgewiesenen Verkaufspreis bzw. Wiederbeschaffungswert einer solchen beschädigten Anlage. Daher wird **niemals automatisch 0, 20 %, 50 %, 100 % oder der volle Kaufpreis** als Wertminderung angenommen.

Das gesonderte, rein lesende Rechenmodul `cost_basis_v194.cjs` besitzt dafür `recordDamageValuation(book, state, claimId, evidence)`.

Ein expliziter Einzelbeleg enthält:

- Kennung der eigenen, tatsächlich beschädigten oder brennenden Bohrkonzession;
- genau den betroffenen Spielmonat und eine eindeutige Referenz (z. B. Gutachten-/Reparaturangebot-ID);
- Bewertungsvorgehen und **erzielbaren Restwert in Cent**, nicht allein eine Prozentbehauptung;
- die aktuelle Buchungskette und tatsächliche Rohölmengen.

Ohne diese Daten gilt `WERTMINDERUNG_OFFEN`. Die Funktion weist Fremdanlagen, intakte Felder, veraltete Monatsangaben, negative Zahlen, zu hohe Restwerte, unpassende Buchungen und alle nicht nachweisbaren Bestandsänderungen ab. Ein Restwert von 0 ist nur **mit ausdrücklich übergebenem Einzelbeleg** zulässig, nie als Standardwert.

**Buchwertkorrektur:** Nur die nachgewiesene Differenz zwischen dem bisherigen Gesamtbuchwert der konkret betroffenen Konzession samt eigener Bohr-/Tank- und zugehöriger RAW-Streckenanlage und dem ausdrücklich angesetzten erzielbaren Restwert wird einmalig als `impairmentCent` belastet. Die Differenz wird vollständig auf die betroffenen Buchwerte verteilt. **Keine automatische Zuschreibung** nach Brandlöschung: Reparaturauszahlung ist ein separater realer Kostenbeleg, keine Rechtfertigung für ein Hochsetzen des Vermögens. Die restliche planmäßige Abschreibung wird aus dem **reduzierten Buchwert** auf die **verbleibende Nutzungszeit** umgerechnet, statt den Verlust erneut abzuschreiben. Bei restlos geminderter Anlage bleibt der Buchwert auch in späteren Monaten null.

**Vorsicht bei Lagerware:** Befindet sich gleichzeitig Rohöl im Lager des beschädigten Claims, wird `LAGERWERTMINDERUNG_OFFEN` ausgelöst. Der Anlagenbeleg ist **kein** Ersatz für eine mengen- und kostenbezogene Prüfung der betroffenen Ware. Das verhindert den stillschweigenden Ansatz unbeschädigter Vorräte.

**Nachweisgrenze:** Die technische Schnittstelle prüft **Format und Zuordnung** eines Belegs, nicht die Authentizität einer externen gutachterlichen Bewertung. Deshalb heißt das Ergebnis ausdrücklich `UNVERIFIED_DRAFT_ESTIMATE`. Auch bei rechnerisch vollständig nachgewiesenem Modell gilt weiterhin `accountingProfitCent:null` und `releaseGate:'BLOCKED'`.

### Abschreibung und Restwert: Noch keine unzulässige Original- oder Freigabebehauptung

Die **60/120 Monate** bleiben ausschließlich versionierte, reproduzierbare **Annahmen des PPPOPPI-Forschungsmodells**. Für eine endgültige Adaption-Fachfreigabe fehlen unabhängige Nutzungsdauern, Restwert-, Reparatur- und Anlagenverkaufsbelege sowie eine klare Entscheidung zur wertmäßigen Nachholung bei beseitigtem Schaden. Ein unbelegter „Restwert von 0“ wird weder als allgemeines Gesetz noch als C64-Regel behauptet.

## 2. Echte Brandschadensproben

Der vorhandene Spielkern löst am Anfang des **vierten Monats** nachweisbar ein Brandereignis aus. Die neuen Negativ- und Gegenproben prüfen insbesondere:

1. ohne Bewertung keine Bilanz bei Brand;
2. mit explizitem, **synthetisch bezeichnetem** Schätzwert nur modelleigene Einzelwertminderung und korrekt sinkendes Reinvermögen;
3. tatsächliche `FIRE_EXPERT`-Löschaktion und **keine automatische Rückbuchung** der Wertminderung;
4. korrekte Neuberechnung der Folgeabschreibung, auch bei vollständig gemindertem Buchwert;
5. Fehlen der Referenz, falscher Monat, falsche Firmenkennung oder Überschreitung des Buchwerts sperren;
6. neue Spielaktion macht eine alte Bewertung im selben Monat ungültig;
7. intakte oder fremde Anlage darf nicht abgewertet werden;
8. bestehende Ölmengen im beschädigten Lager werden **nicht stillschweigend als unbeschädigt bewertet**.

Diese Tests sind unabhängig von der alten Viermonatsmodellrechnung mit realer Brandlöschung. Sie **ersetzen** den Brand-Löschtest nicht, sondern prüfen den getrennten Fall **einer tatsächlich noch beschädigten** Anlage.

## 3. Zwei reale Konkurrenzfirmen und teilweise Fracht-Rückerstattung

Der Originalspielkern der **eigenständigen Adaption** simuliert für `H1` und `H2` jeweils eine eigene Berliner Konzession, Bohrung, Raffinerie, Rohöl- und Fertigwarenbeförderung. Im vierten Monat konkurrieren beide über die öffentliche Strecke `B-BB`, die nur **24 Barrel** gleichzeitig transportieren kann.

| Wirtschaftsgröße je Firma | Echt nachgewiesen |
| --- | ---: |
| Bestellte Menge | **18 Barrel** |
| Zugeteilte Menge | **12 Barrel** |
| Zurückgegebene Menge | **6 Barrel** |
| Frachtvorschuss | **50.400 Cent** |
| Tatsächliche Fracht | **33.600 Cent** |
| Echt erstatteter Betrag | **16.800 Cent** |
| Im Herkunftslager verbleibende Fertigware | **6 Barrel** |
| Zum Zielmarkt unterwegs | **12 Barrel** |

Der Prozess nutzt **44 reale Spielzustandswechsel** und verfolgt **beide Unternehmen unabhängig**, einschließlich des im vierten Monat tatsächlich erforderlichen Löschvorgangs. Weder die 6 zurückgegebenen Barrel noch die Frachtrückzahlung werden doppelt verbucht. Ein noch **offener Vertrag** führt ohne abgerechnete Lieferung **nicht automatisch zu einer Forderung oder Umsatz**.

**Grenzen:** Eine vollständig offene Handelsforderung mit eigenständigem Zahlungsziel, fremde Eigentümerforderungen oder eine historische C64-Frachtregel sind auf Grundlage der aktuellen Engine **nicht belegbar**. Hier ist weiter `BLOCKED` statt einer erfundenen Forderungszahl richtig.

## 4. Prüfplan und Release-Sperre

```bash
node --check project-c/pppoppi-imperium/quality_v194/cost_basis_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_impairment_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_cost_multifirm_public_v194.cjs
python3 tools/validate_project.py
python3 -m unittest discover -s tests -q
```

Der eigene GitHub-Actions-Arbeitsablauf läuft **unter Node.js 22 und 24**. Erwartete Fallzahl je Node-Version: **42** = 6 bisherige Geldgrenzen + 8 Bilanztests + 8 Viermonatsfälle + 8 Sonderfalltests + 9 Wertminderungstests + 3 Mehrfirmengrenzfälle. Erfolg gilt nur mit GitHub-Ausgabe auf **genau dem aktuellen Commit**; die Quellschutzprüfung und Projektvalidierung müssen separat grün sein.

## 5. Weiterhin offene Vorrelease-Pflichten

- Fachlich bestätigte Wertermittlungen für Brand-/Sabotageschäden, getrennte Lagerwertminderung und nachgewiesene Restwerte.
- Sachlich abgenommene Abschreibungsdauer, eventuelle spätere Wertaufholung und Ertrag aus Notverkäufen mit vorhandener Lagerware.
- End-to-End-Tests aller Insolvenz-, Forderungs-, Vertrags-, Mehrfirmen- und Schadensvarianten über vollständige Endpartien, nicht nur exemplarische echte Abläufe.
- Historisch belegte C64-Regeln und unverändert nicht freigegebene 77 Archivobjekte.
- **52er Matrix weiterhin 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED; kein Vorrelease-PASS.**

### Drei nächste Schritte

1. **Fachliche Freigabe vorbereiten:** Restwerte, 60/120 Monate, Lagerwertminderung, Bewertungsbelege und eventuelle Wertaufholung als bewusste PPPOPPI-Regeln festlegen oder deren Nichtfreigabe dokumentieren.
2. **Forderungs-/Insolvenzkette und Schäden vertiefen:** echte offene Lieferforderungen und andere Kapazitätsrückzahlungen nur dann rechnen, wenn die Spielregeln sie nachweisbar als Daten verfügbar machen; Mehrfirmen-Kampagnen erweitern.
3. **Gesamt-Abnahmestand getrennt prüfen:** Node/CI je konkretem Head, 52 Pflichtkriterien, unabhängige historische Referenzen und Nutzungsrechte. PR #141 und `main` bleiben bis dahin unangetastet.
