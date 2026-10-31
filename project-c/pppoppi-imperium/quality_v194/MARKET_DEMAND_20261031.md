# WIR-01/02/03 – reale Preisprüfung und isolierte Nachfragegrenze (31.10.2026)

## Ausgangslage und Ziel
Basis: [Entwurfs-PR #145](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/145), HEAD `0cfe8793bca311a6a3207862f39146b687f1f9a0`. Dessen Fachprüfungen waren bei Vorprüfung erfolgreich; die integrierte Vorrelease-Sperre bleibt absichtlich FAIL/BLOCKED. Der Hauptzweig stand zu Beginn auf `e333819bbe505023995773c0d5c66eedc444bde9`. Spielkern, Originalquellen, `main` und PR #141 werden nicht verändert.

Die bestehenden 11-Monats-Tests belegen reale Förderung, Raffinerie, Frachtengpässe und Außenmarktverkauf. Neu wird die natürliche Entwicklung der Marktpreise und regionalen Nachfrage mit einer unabhängigen centgenauen Umsatzprüfung verbunden. Die überregionale Nachfragegrenze wird **getrennt als reiner Zuteilungs-Grenzfall** geprüft; eine natürlich gesättigte Außenmarktpartie ist noch offen.

## Tatsächlich implementierter Prüfumfang
- Zwei deterministische 11-Monats-Spielketten mit je zwei Firmen, zwei Feldern und Raffinerien, Engpässen in M3/M6, Sperre M8 und Reparatur M9.
- Unabhängiger Abgleich von regionalem Preis/Nachfrage zwischen Zustand und Monatsbericht; mindestens drei verschiedene natürlich erreichte Preise und Nachfragewerte pro Durchlauf.
- Überregionaler Verkaufspreis `floor((regionalerPreisCent * 115 + 50) / 100)`; Erlös `floor((verkauftMilli * VerkaufspreisCent + 500) / 1000)`. Die Anzahl und Summe der tatsächlichen Monatsjournalbuchungen muss zu den Firmen-Zuteilungen passen.
- Außenmarktabsatz darf das gemeldete Marktlimit nie überschreiten. Für zwei Angebote zu je 18.000 Milli-Barrel bei 18.000 Gesamtbedarf wird die unveränderte Zuteilungsfunktion separat in beiden Eingabereihenfolgen geprüft: je 9.000 Zuteilung.
- Negative Tests müssen verfälschten Marktpreis, Marktlimit und Verkaufserlös erkennen; alle bisherigen Mengen-/Kassenprüfungen bleiben aktiv.

**Sollzahlen:** zwei Durchläufe, 22 Spielmonate, 44 Firmen-Monatskontrollen, 42 JSON-Rundläufe, 16 Duplikatsperren, 30 Manipulationsproben, zwei Fremdaktionssperren und zwei öffentliche Reparaturen. Die GitHub-CI prüft die JSON-Ausgabe und speichert sie als Artefakt.

## Fehlerhistorie und fachliche Abgrenzung
- [CI #41169089334](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41169089334) **FAIL**: Falsche Testannahme über bereits eingetroffene, nicht verkaufte Ware.
- [CI #41169136123](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41169136123) **FAIL**: Eine ausgelassene Verkaufsaktion führte regulär in die Sanierungsphase; das Monatsreporting war nicht wie erwartet abgeschlossen.
- [CI #41169577547](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41169577547) **FAIL**: Auch bei Verkauf in M5 führte das Auslassen des M8-Umsatzes vor dem M9-Reparaturmonat zu einer regulären Sanierungsphase.

Diese Fehlversuche zeigen, dass ein natürlich gesättigter Außenmarkt **nicht** durch Weglassen lebenswichtiger Einnahmen in der vorhandenen 11-Monats-Kette bewiesen werden kann. Statt künstlicher Kontostandsänderungen wird die funktionierende natürliche Spielkette erhalten und die Nachfragegrenze als eigenständiger, ausdrücklich nicht end-to-end geltender Zuteilungstest abgesichert.

## Belegstatus und Restpflichten
**PENDING bis zum erfolgreichen GitHub-Lauf auf dem finalen HEAD.** Kein Test-PASS allein aufgrund erfolgreicher Syntaxprüfung. WIR-01/02/03 bleiben BLOCKED. Die hier geprüften Marktformeln sind Bestandteil der eigenständigen Berlin-/PPPOPPI-Variante und keine nachgewiesenen C64-Originalregeln. Offen bleiben die vollständige wirtschaftliche Gewinn-/Vermögensbilanz, eine natürliche Nachfrageüberlastung im kompletten Spiel, Endpartien, Browser-Dateidialog, Rechteklärung der Archivdateien und historische C64-Referenz.

## Nächste drei Schritte
1. GitHub-Fachtest und übrige Gesamtprüfungen auf dem finalen HEAD auswerten, Fehlerursachen dokumentieren.
2. Für eine wirklich überbuchte Außenmarktpartie eine **wirtschaftlich tragfähige** zusätzliche Produktions-/Transportkette aufbauen, ohne Geld, Ware oder Nachfrage künstlich zu verändern.
3. Gewinn-/Anlagenbewertung und Endpartien weiterentwickeln; historische Referenz und Medienrechte getrennt blockiert lassen.

**DRAFT – kein Merge, kein Release, keine persönliche Endabnahme.**

## Ergänzende Pflichtprüfung – 31.10.2026, 06:35 MEZ

Der bisherige Fachtest auf HEAD `63b500fb6978413178fd25fa9b54d2666a01d555` ist in [GitHub-CI #41169684084](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41169684084) **PASS**. Unabhängig davon scheitert die integrierte Vorrelease-Sperre weiterhin erwartungsgemäß; die Browser-Gesamtprüfung auf demselben HEAD ist **FAIL** und kein Freigabenachweis.

**Neu:** Der Marktprüfer fordert nun nicht nur `verkauft <= Nachfrage`, sondern `verkauft = min(angeboten, Nachfrage)` und eine proportional faire Zuteilung mit höchstens einem Milli-Barrel Rundungsabweichung. Der Sollwert wird ohne Aufruf der produktiven Zuteilungsfunktion berechnet. Zwei neue gezielte Negativfälle pro Wiederholung manipulieren zugleich Verkaufsbericht, Rückgabemenge, Kassenstand und Journal: (a) 1.000 Milli-Barrel unterschlagene Zuteilung und (b) ungerechte 10.000/8.000-Zuteilung bei zwei Angeboten zu je 18.000. Dadurch bleiben die Einzelbuchungen formal stimmig; nur der unabhängige Zuteilungsprüfer muss den Fehler erkennen.

**Prüfziel:** 30 statt 26 erkannte Manipulationen in zwei Durchläufen. Der synthetisch verfälschte 18+18-Fall ist ausdrücklich **kein** Beleg einer natürlich überbuchten Spielpartie. WIR-01/02/03 bleiben BLOCKED, die 52er-Matrix bleibt bei 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Neue CI auf endgültigem Commit ist vor einer PASS-Aussage abzuwarten.

**Nächste Implementierung:** wirtschaftlich tragfähige, natürlich überbuchte Außenmarktpartie mit aus echten Lieferungen aufgebauten Lagerbeständen, danach Gewinn-/Vermögensrechnung und vollständige Endpartien. Kein Merge, kein Release.
