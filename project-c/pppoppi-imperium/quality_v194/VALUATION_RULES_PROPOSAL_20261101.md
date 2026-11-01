# PPPOPPI-Wirtschaft · isolierte Regeln V1 (Entwurf, 01.11.2026)

**Arbeitsbereich:** Projekt C, eigenständige PPPOPPI-Adaption. **Keine** Aussage über C64-Originalmechaniken, keine produktive Spielstandsänderung, keine Freigabe.

## Modellannahmen, bewusst nicht freigegeben

| Regel | Modellvorschlag | Begründung / Prüflücke |
| --- | --- | --- |
| FACHBOHRUNG | Anschaffungskosten, linear über **60 Spielmonate** | Spielbarer Vorschlag; reale Nutzungsdauer nicht belegt |
| RAFFINERIE_BAU | Anschaffungskosten, linear über **120 Spielmonate** | Unabhängiger Buchwertvergleich möglich |
| VERTRIEBSROUTE | Anschaffungskosten, linear über **60 Spielmonate** | Pro Route gesondert inventarisieren |
| FELDKAUF | **Nicht automatisch abschreiben** | Rechte-/Laufzeitregel ungeklärt, daher keine erfundene Laufzeit |
| Rohöl und Raffinerieware | Gewichteter gleitender Kostendurchschnitt bei **belegten Herstellkosten** | Marktpreise sind keine Herstellungskosten; unbekannte Kosten ergeben `UNPRICED` |
| Forderung | Nur nach **gesondert nachgewiesener Abnahme**, keine Forderung für bloße Vertragszusage | Das reine Ereignis `accept` ist eine Testannahme, noch kein Nachweis eines Engine-Abnahmeereignisses |
| Zahlung/Ausfall/Gutschrift | Jede verändert **nur eine bestehende offene Forderung**, mit eigener Ereignis-ID | Keine doppelte Einnahme nach Spielstandimport/Neustart |

**Cent-Regel:** sichere ganze Centbeträge, `BigInt` für Zwischenrechnung. Linearer Gesamtabschreibungsbetrag wird nach `floor(Kosten × abgelaufene Monate / Laufzeit)` berechnet; der letzte Monat nimmt den Rundungsrest auf. Mengen sind in `Milli-Barrel`.

## Prüfbare Umsetzung, ohne Parallelbuchhaltung

- `valuation_rules_proposal_v1.cjs` ist eine **reine Vorschlags-/Prüfschicht**: Abschreibungszeitreihe, Mengen-/Kostendurchschnitt, Forderungs-Ereignisbrücke und eine unverändernde Schnittstelle `prepareSnapshot` zu bestehenden echten Firmen-Kassen-/Kreditfeldern.
- `prepareSnapshot` liefert die nachweisbaren Werte für Kasse, Kredit und offene Rechnungen an die vorhandene `valuation_explicit_v194.cjs`. Forderungen, Vorräte und Anlagenwerte werden **nicht** aus unzuverlässigen Engine-Feldern erfunden. Ergebnis bleibt `NOT_COMPUTABLE`.
- `test_valuation_rules_proposal_v1.cjs` enthält unabhängige positive und negative Modellprüfungen: Rundungsreste, Laufzeitgrenzen, Null-/Negativ-/Text-/Überlaufzahlen, doppelter Ereignisimport, Mengenüberziehung, Teillieferung, Belegabhängigkeit, Ausfall-/Zahlungs-/Gutschriftbrücke, reale `E.fresh`-Snapshot-Anbindung, Eingabe-Unveränderlichkeit und Freigabegrenze.
- GitHub-CI: `.github/workflows/prerelease-valuation-rules-v1.yml`. Dieser Test ist **kein** 53. Freigabekriterium und verändert die 52 bestehende Kriterien nicht.

## Fachlich und technisch offene Punkte

1. Welche Engine-Ereignisse beweisen tatsächlich **Abnahme und Eigentumsübergang**, und welche sind sofort bezahlte Kassenverkäufe? Die vorhandene Vertragslogik bucht teils direkt `VERTRAGSERLÖS` als Kassenzufluss; ohne diesen Abgleich darf keine neue Forderung erzeugt werden.
2. Wo entstehen und verbleiben **Herstellungskosten** je Menge? Die Engine weist konkrete Auszahlungen (z.B. Raffinerieverarbeitung) nach, aber kein durchgängiges bewertetes Lagerlos; keine Anlage- oder Lagerbilanz aus bloßem Preis.
3. Wie werden **Schaden, Untergang, Vertragsstrafen, Insolvenz und bereits abbezahlte Rechnungen** dem Monat zugeordnet? Der Vorschlag darf nicht stillschweigend historische Regelkenntnis vortäuschen.

**Nächste Integration:** Erst nach Freigabe von Modellversion und Ereignisvertrag einen klar benannten **technischen Adapter** zwischen echten, validierten Spielereignissen und den isolierten Funktionen entwickeln. Dieser darf nichts in die geschützten 110 `SPIEL/**`-Quelldateien schreiben. Nach 12/36/120 Monaten, Import/Export, Mehrfirmenbetrieb und unabhängigen Negativprüfungen wäre eine fachliche Neubewertung möglich. **Bis dahin WIR/BAL BLOCKED und #141 DRAFT.**

**Reproduktion:** `node --check project-c/pppoppi-imperium/quality_v194/valuation_rules_proposal_v1.cjs` und `node --test project-c/pppoppi-imperium/quality_v194/test_valuation_rules_proposal_v1.cjs`.
