# WIR-02 / WIR-03 – zwei natuerliche Raffinerie- und Frachtketten (30.10.2026)

**Technischer Teiltest: PASS** auf `729f09dd153cd29d16c9ee5468f8e2d1106cf489` in [GitHub-CI #41139800011](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41139800011). **Vorrelease BLOCKED**; die erneute CI auf dem spaeteren Dokumentations-HEAD ist gesondert auszuwerten.

## Ziel und Abgrenzung

Zwei menschliche Firmen erwerben getrennte Berliner Felder ausschliesslich mit den
echten Aktionen `SURVEY`, `BUY`, `DRILL` und `PUMP`. Jede baut ihre
eigene Raffinerie, Transportstrecke und Verbindung zum oeffentlichen Netz.
Je 10.000 Milli-Barrel Rohware werden in der echten Engine zu 9.000
Milli-Barrel Fertigware verarbeitet. Beide Firmen buchen eine reale
zweigliedrige Frachtstrecke von Berlin nach Nord und bieten die
angekommene Ware am Aussenmarkt an. Weder Oel noch Kasse, Marktbedarf,
Feldbesitz oder Raffineriestand werden kuenstlich vorgegeben.

## Technische Abnahmebedingungen

- Zwei getrennte Firmen und Felder, jeweils eigene Raffinerie; fuenf abgeschlossene
  Spielmonate je Lauf, zwei identische Wiederholungen, also zehn simulierte Monate
  und zwanzig Firmen-Monatsbeobachtungen.
- Echter `PUBLIC_QUEUE`-Duplikatschutz (vier Abweisungen insgesamt),
  20 JSON-Speicher-/Wiederherstellungspruefungen, reale Monatsberichte.
- Unabhaengige physische Mengenbilanz je Firma: Foerderung = Feldlager +
  Rohware + Fertigware + Regionalmarkt + Aussenmarktbestand +
  verkaufte Ware + Raffinerieverlust. Firmenuebergreifende Bilanz.
- Frachtvorauszahlung, Rueckgabe, tatsaechliche Frachtkosten,
  Kassenstand und Aussenmarkterloese mit Buchungsjournal abgleichen.
  Zwölf absichtlich verfälschte Datenkopien muessen von der
  unabhaengigen Bilanzpruefung erkannt werden.
- Keine Fremdfoerderung und keine Veraenderung des Eingabezustands
  durch Engine-Befehle. Fehlgeschlagene Tests bleiben FAIL.

## Reproduktion

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_natural_multifirm_refinery_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_natural_multifirm_refinery_v194.cjs
```

Automatischer GitHub-Pruefablauf:
`.github/workflows/prerelease-natural-multifirm.yml`, mit JSON-Nachweis
als Artefakt. **Die reine Syntaxpruefung ist noch kein fachlicher PASS.**

## Grenzen / naechste Arbeit

Nur Berliner Felder und ein Aussenmarkt, kein vollstaendiger
Mehrregionen-Wirtschaftsdurchlauf, keine Vermoegens-/Gewinnrechnung,
keine 800x600-Browserabnahme und keine historische C64-Verifikation.
Rechte fuer 77 ausgeschlossene Archivdateien und der sporadische
Dateidialogfehler bei 175/200 Prozent bleiben unabhaengig offen.

**Kein Merge, kein Release, keine persoenliche Endabnahme vor
vollstaendig geprueftem und eingefrorenem Kandidaten.**

## GitHub-Pruefverlauf und konkrete Messwerte

- [Erster CI-Lauf #41139741193](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41139741193): **FAIL**. Der Test versuchte Aktionen fuer H2, bevor H1 seinen Zug abgeschlossen hatte. Kein Spielfehler; die Teststeuerung war falsch.
- Korrektur auf `729f09dd`: Jeder menschliche Zug wird vor dem Wechsel zur anderen Firma mit echtem `END_TURN` abgeschlossen. Die doppelte Monatsbeendigung wird abgewiesen.
- [Zweiter CI-Lauf #41139800011](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41139800011): **PASS**. Zwei deterministische Durchlaeufe mit je fuenf echten Monatsabschluessen, 20 JSON-Rundlaeufen, vier abgewiesenen Frachtduplikaten und zwoelf erkannten absichtlichen Verfaelschungen.
- Je Durchlauf: beide Firmen foerdern je 100.000 Milli-Barrel, verarbeiten je 10.000 zu 9.000 Milli-Barrel Fertigware und verkaufen je 9.000 Milli-Barrel am Aussenmarkt. **Gesamtbilanz:** 200.000 gefoerdert = 180.000 Restlager + 18.000 verkauft + 2.000 Verarbeitungsschwund. Je Firma 50.400 Cent Frachtkosten und 714.690 Cent Aussenmarkterloes.
- Der aktualisierte CI-Vertrag prueft diese gemessenen Werte nun explizit. Bis zu seiner erfolgreichen Ausfuehrung auf dem finalen Dokumentations-HEAD gilt dafuer **PENDING**.

**Abgrenzung:** 714.690 Cent Verkaufserloes ist kein Gewinn. Die negative Kassenentwicklung und Investitionen sind keine bewertete Bilanz. Die technische Teilpruefung darf deshalb keines der 52 uebergreifenden Vorrelease-Gates vorzeitig freigeben.

## Nachtrag 31.10.2026 – echter Kapazitaetsengpass (WIR-02/WIR-03)

Der bisherige natuerliche Zweifirmenlauf (je 10 Barrel Rohware -> 9 Barrel
Fertigware) bleibt als **Baseline** erhalten. Ein zweiter unabhaengiger
Durchlauf nutzt pro Firma zwei echte 10-Barrel-Raffineriechargen, zwei
unveraenderte Transportketten und 18 Barrel tatsaechlich erzeugte
Fertigware. Beide Firmen buchen je 18 Barrel Berlin -> Nord; der gemeinsame
Engpass BB-N hat aber nur 18 Barrel Gesamtkapazitaet.

**Verbindliche Sollwerte des neuen Tests (noch kein PASS):**

- Beide Firmen erhalten bei identischen Auftraegen je 9 Barrel;
  9 Barrel je Firma werden zurueck ins regionale Marktlager gebucht.
- Gemeinsame Streckenauslastung B-BB und BB-N: jeweils exakt 18 Barrel.
- Frachtvorauszahlung und Rueckerstattung werden je Firma anhand
  `PPPublicNetwork.freight` getrennt mit dem echten Buchungsjournal verglichen;
  effektive Frachtkosten je Firma: 50.400 Cent.
- Mengenbruecke fuer den Engpasslauf: 200 Barrel echte Foerderung =
  160 Barrel Feldlager + 18 Barrel Rueckgabe/Regionalmarkt +
  18 Barrel Aussenmarktverkauf + 4 Barrel Verarbeitungsschwund.
- Beide Szenarien je zweimal deterministisch wiederholt: zusammen 20
  simulierte Spielmonate, 40 Firmen-Monatsbeobachtungen, 40 JSON-Rundlaeufe,
  acht abgewiesene doppelte Buchungen und 24 Negativproben.

**Pruefstatus: PENDING**, bis der GitHub-Prueflauf auf dem abschliessenden
Dokumentations-HEAD erfolgreich beendet ist. Der bestehende technische
PASS auf dem vorherigen HEAD bleibt ein separater Nachweis, nicht die
Freigabe dieser Erweiterung. Das 52-Punkte-Gate bleibt **BLOCKED**.

**Naechste technische Pflicht:** Nach erfolgreicher Engpasspruefung einen
zweiten Frachtmonat mit erneuter gemeinsamer Kapazitaetskonkurrenz,
Reparatur-/Sperrfall und unabhängiger kumulativer Kassen- und Mengenbilanz
pruefen; danach Gewinn-/Vermoegensbewertung und vollstaendige Endpartien.
Keine Aussage ueber historische C64-Regeln, Ressourcenrechte, Browser-Zoom
oder Nutzer-Endabnahme.
