# WIR-01/02/03 – reale Marktpreise und begrenzte Nachfrage (31.10.2026)

## Ausgangslage und Zweck
Basis: [PR #145](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/145), HEAD `0cfe8793bca311a6a3207862f39146b687f1f9a0`. Dessen 14 zugeordnete GitHub-Workflows wurden vor Arbeitsbeginn geprüft: 13 SUCCESS, die integrierte Vorrelease-Sperre erwartungsgemäß FAILURE. `main` stand bei Vorprüfung auf `e333819bbe505023995773c0d5c66eedc444bde9`. Keine Änderung am Spielkern, an geschützten Quellen, an `main` oder an PR #141.

**Neue Lücke:** Die bisherigen Frachtprüfungen bestätigen Mengen und Kassen, aber die reale Preisentwicklung, die centgenaue Erlösberechnung und die begrenzte Außenmarktnachfrage bei zwei gleichzeitig überhöhten Angeboten waren nicht zusammen in einer natürlichen Spielkette abgedeckt.

## Umsetzung und überprüfbare Sollwerte
Neuer Test `test_market_demand_v194.cjs` verwendet ausschließlich echte Spielaktionen auf dem unveränderten V1.9.3-Kern. Vier deterministische Durchläufe von je elf Monaten (zweimal Basis, zweimal Nachfragelimit) durchlaufen zwei Firmen, zwei eigene Felder, Raffinerien, echte Förderung, zwei getrennte Frachtengpässe M3/M6, Streckensperre M8 und kostenpflichtige Reparatur M9.

| Prüffall | Erwartetes Ergebnis |
| --- | --- |
| Basisfall | Je Firma 27.000 Milli-Barrel kumuliert verkauft |
| Nachfragebegrenzung M11 | Je Firma 18.000 Milli-Barrel angeboten; gemeinsames Marktlimit 18.000; je Firma 9.000 verkauft und 9.000 ins Eingangslager zurückgegeben |
| Erlöse | `floor((verkauftMilli * berichteterPreisCent + 500) / 1000)` je Firma und Monatsbericht; gleiche Summe und Anzahl im Kassenjournal |
| Marktpreis | Überregionaler Preis = `floor((regionalerPreis * 115 + 50) / 100)`; regionaler Preis stimmt mit dem tatsächlichen Spielzustand überein |
| Nachfrage | Regionaler Nachfragesatz entspricht dem Spielzustand; überregionaler Markt verkauft nie mehr als sein 18.000-Milli-Barrel-Limit |
| Reproduzierbarkeit | Je zwei identische Durchläufe pro Variante; keine direkte Manipulation von Beständen, Geld, Preisen, Nachfrage oder Strecken |
| Negative Prüfungen | Verfälschter Preis, verfälschtes Marktlimit und verfälschter Erlös müssen auffallen; bestehende Mengen-/Kassenmanipulationen bleiben aktiv |

**Pflichtzahlen:** vier Durchläufe, 44 Spielmonate, 88 Firmen-Monatskontrollen, 84 JSON-Rundläufe, 32 Duplikatsperren, 52 absichtliche Manipulationen, vier Fremdaktionssperren und vier öffentliche Reparaturen. Mindestens drei unterschiedliche natürliche Marktpreise und drei regionale Nachfragewerte pro Durchlauf. Der GitHub-Workflow prüft diese Werte maschinell und archiviert die JSON-Ausgabe.

## Belegstatus und Grenzen
**PENDING bis zum erfolgreichen GitHub-Lauf auf dem finalen HEAD.** Die unveränderte historische C64-Referenz fehlt weiterhin; die hier getesteten Marktformeln gehören zur eigenständigen Berlin-/PPPOPPI-Spielvariante und sind **kein Nachweis für originale C64-Algorithmen**. Die vollständige Gewinn-/Anlagenbewertung, gesamte Endpartien, Browser-Dateidialog und Rechteklärung der 77 Archivdateien bleiben offen. Die Pflichtmatrix bleibt unverändert gesperrt; persönliche Sichtprüfung und Kubuntu-Endabnahme folgen erst nach allen eigenständig möglichen technischen Arbeiten.

## Nächste drei Schritte
1. Den GitHub-Fachlauf und die restlichen Gesamtprüfungen auf dem finalen HEAD auswerten und Fehlversuche mit Ursache dokumentieren.
2. Die Bilanz um eigenständig überprüfbare Lager-, Anlagen- und Verbindlichkeitswerte erweitern, ohne aus Cashflow bereits Gewinn abzuleiten.
3. Weitere vollständige Endpartien einschließlich Browser-Neustarts und Importfehlern prüfen; Rechte- und C64-Referenzblocker getrennt weiterführen.

**DRAFT – kein Merge, kein Release, keine persönliche Endabnahme.**
