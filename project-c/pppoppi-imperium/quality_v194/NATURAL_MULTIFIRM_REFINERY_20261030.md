# WIR-02 / WIR-03 – zwei natuerliche Raffinerie- und Frachtketten (30.10.2026)

**Status: PENDING bis zur GitHub-Pruefung auf dem endgueltigen Commit. Vorrelease BLOCKED.**

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
