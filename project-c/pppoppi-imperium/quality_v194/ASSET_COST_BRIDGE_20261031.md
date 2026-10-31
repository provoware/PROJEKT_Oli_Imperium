# WIR-04 / BAL-01 – Anschaffungskosten, Verbindlichkeiten und echte Bestände (31.10.2026)

## Ziel und Ausgangspunkt

Technische Fortsetzung des [Entwurfs-PR #146](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/146), Ausgangs-HEAD 019b8a3da3cb01fe7303e382c4606c518ebd55ff. Die [Gesamtprüfungen dieses HEAD](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/019b8a3da3cb01fe7303e382c4606c518ebd55ff/checks) enthalten 14 erfolgreiche Fach-/Browser-/Quellprüfungen und eine **absichtlich rote integrierte Vorrelease-Sperre**. Das ist keine Freigabe.

Die bisherige Kassenbuchprüfung trennt Erlöse, Auszahlungen und Kredite, bewertet aber keine Vermögensgegenstände. Dieser Schritt ergänzt einen **unabhängigen Anschaffungs- und Bestandsnachweis** mit zwei real handelnden Firmen. Er erfindet weder Abschreibung noch Bilanzgewinn.

## Neue technische Prüfung

- Zwei reale Firmen kaufen je ein untersuchtes Feld, erschließen es, fördern, errichten je eine Raffinerie und Vertriebsroute und verkaufen über reguläre regionale Aufträge. Nur Engine-Aktionen; keine manipulierten Startkassen, Waren oder Eigentumsrechte.
- Der Prüfer bindet die tatsächlichen Kauf-/Bohr-/Bau-Buchungen an die jeweilige Firma, Feldkennung und Region. Die Summe bezahlter Anschaffungen wird separat von Betriebsausgaben und Erlösen ausgewiesen.
- Jede Firma erhält einen unabhängigen Cent-Abgleich: Anfangskasse + sämtliche Journalbuchungen = Schlusskasse; der Monatsbericht muss Kasse, Schulden, offene Rechnungen und Verkaufserlöse korrekt ausweisen.
- Feldreserve, geförderte Menge, Lagerbestand und tatsächlich verkaufte Menge müssen physisch aufgehen. Verbindlichkeiten werden als unbezahlte Rechnungsbeträge gezählt; Kredit-Tilgungsforderungen dürfen nicht zusätzlich zur Kreditschuld als neues Fremdkapital addiert werden.
- Zwei identische Szenariodurchläufe, je zwei Firmen; zwölf absichtliche Verfälschungen je Durchlauf (Kasse, Buchung, Buchungskennung, Kaufzuordnung, Besitz, Bohrung, Raffinerie, Route, Schuld, offene Rechnung, Umsatzbericht, Rohölmenge) müssen zuverlässig scheitern.

## Bewusst noch keine Bilanz

**Anschaffungsauszahlung ≠ Anlagenwert. Umsatz ≠ Gewinn. Kassenstand ≠ Vermögen.** Der neue Prüfer meldet ausdrücklich UNPRICED und NOT_COMPUTABLE. Für eine belastbare Gewinn- und Vermögensrechnung fehlen fachlich freigegebene Nutzungsdauern, Abschreibungsregeln, Brandschadens- und Restwertregeln, Rohöl-/Fertigwarenkosten sowie die Behandlung von Forderungen und Verkäufen. Die historischen C64-Regeln sind nicht bestätigt. Auch die technische Wertermittlung wird erst nach freigegebenen Regeln implementiert.

## Reproduzierbare Befehle

    node --check project-c/pppoppi-imperium/quality_v194/test_asset_cost_bridge_v194.cjs
    node project-c/pppoppi-imperium/quality_v194/test_asset_cost_bridge_v194.cjs

GitHub-Prüfung: [prerelease-asset-cost-bridge.yml](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-asset-cost-bridge.yml). Der Workflow fordert 2 Durchläufe, 4 Firmenkontrollen, 24 negative Proben, positive echte Investitionen/Umsätze und ausdrücklich gesperrte Vermögens-/Gewinnberechnung.

**Status bei Implementierung: PENDING bis GitHub-CI auf dem endgültigen Entwicklungs-HEAD abgeschlossen ist.** Selbst bei PASS ist dies nur ein technischer Teilnachweis; WIR-04 und BAL-01 bleiben BLOCKED, 52er-Gesamtmatrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 persönliche DEFERRED.

## Nächste drei technischen Schritte

1. CI auf dem endgültigen Entwicklungs-HEAD auswerten, echte Fehler korrigieren und die Negativkontrollen belegen.
2. Bewertungsregeln (insbesondere Rohöl nach Brand, Restwerte, Nutzungsdauer, offene Forderungen) fachlich begründen; erst dann eine Gewinn-/Vermögensberechnung auf Basis der realen Anlagen- und Lagerdaten entwickeln.
3. Vollständige Endpartien mit diesen Wirtschaftsfolgen und Browser-Speicherwiederherstellung prüfen; den sporadischen Dateiimportfehler, Medienrechte und C64-Originalvergleich separat weiterführen.

**Kein Merge, kein Release. Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach allen technischen Pflichtgates und eingefrorenem Kandidaten.**
