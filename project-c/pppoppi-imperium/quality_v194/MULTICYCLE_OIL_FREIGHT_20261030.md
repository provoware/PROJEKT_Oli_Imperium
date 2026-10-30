# WIR-02 / WIR-03 – Zweiter natürlicher Ölzyklus mit planmäßigen Netzausfällen (30.10.2026)

**Status: PENDING – technischer Teilnachweis, Vorrelease BLOCKED.** Entwicklung ausschließlich im bestehenden [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). `main` und geschützte Originaldateien bleiben unangetastet.

## Zweck und Abhängigkeiten

Der bisherige Test `test_natural_oil_to_export_v194.cjs` deckte eine natürliche Förderung und einen fünfmonatigen Weg bis zum Außenmarkt ab. Der neue zusammenhängende Pflichtschritt führt **dieselbe Firma mit demselben echten Feld und der bestehenden Raffinerie** durch eine zweite Förderung und einen zweiten vollständigen Rohöl-/Fertigwaren-/Außenmarkttransport bis zum zehnten Spielmonat. Kein künstlich eingebuchtes Öl, Geld, Eigentum oder Marktvolumen.

Zwei Szenarien werden je zweimal ausgeführt: ursprünglich freie öffentliche Strecke sowie ursprünglich blockierte Strecke mit Rückerstattung. Der erste Zyklus bleibt unverändert prüfbar. Im zweiten Zyklus wird ein vorhandener Feldbrand bei Bedarf mit der echten Spielaktion `FIRE_EXPERT` beseitigt. Die reguläre **Rohrleitungsstörung in Monat 6** muss einen vorzeitigen Fertigwarentransport verhindern; erst `NETWORK_REPAIR` ermöglicht den Transport. Die reguläre **öffentliche Streckensperre in Monat 8** wird mit `PUBLIC_REPAIR` behoben; der Zweikanten-Transport muss danach die Ware erst in Monat 10 anliefern. Frühverkäufe sind abzuweisen.

## Unabhängige Sollprüfungen

- Je Szenario zwei reproduzierbare Durchläufe über zehn vollständig abgeschlossene Monate; insgesamt **40 simulierte Monate und 80 Firmen-Monatsbeobachtungen**.
- Beide Förderungen erfolgen durch `PUMP`; 200 Barrel Gesamtförderung, 2 Barrel Raffinerieverlust. Nach beiden Zyklen gilt `Förderung = Verkäufe + vorhandene Bestände + Verarbeitungsschwund`.
- Freier Erstweg: 18 Barrel über beide Zyklen verkauft, 180 Barrel verbleiben im Feldlager. Ursprünglich gesperrter Erstweg: 9 Barrel verkauft, 180 Barrel im Feldlager und 9 Barrel aus der ersten Rückerstattung im regionalen Marktlager.
- Zweiter Außenmarktverkauf von neun Barrel in beiden Szenarien, ohne Doppelbuchung. Doppelte Rohöl- und Frachtvormerkungen werden abgewiesen. Vorzeitige Verkäufe und die planmäßig gesperrte Rohrleitung müssen ohne Eingabeveränderung scheitern.
- Beide Reparaturen müssen echte, vom Spielkern verarbeitete Aktionen sein. Nach Monat 10 dürfen keine offenen Sendungen, Vormerkungen oder Angebote verbleiben; JSON-Wiederherstellung und Kassenbuchabgleich müssen bestehen.

**Abgrenzung:** Kein Gewinn-/Vermögensnachweis, keine Mehrfeld-/Mehrfirmen-Raffineriekette, keine Browser-Dateidialog-Reparatur, keine historische C64-Originaltreue oder Rechtefreigabe.

## Reproduzierbare Ausführung

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_natural_oil_to_export_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_natural_oil_to_export_v194.cjs
```

Der GitHub-Prüfablauf [prerelease-natural-oil-export.yml](../../../.github/workflows/prerelease-natural-oil-export.yml) prüft die Zähler, Mengenidentitäten und Reparaturnachweise auf dem PR-HEAD und sichert das JSON-Artefakt. **Bis zum tatsächlich erfolgreichen Lauf: PENDING, nicht PASS.** Bei FAIL die konkrete Fehlerstelle auswerten und korrigieren; nicht durch Testabschaltung oder verdeckte Wiederholung umgehen.

## Weitere Pflichten

1. CI auf dem finalen Entwicklungs-HEAD einschließlich Browser- und Quellschutz prüfen.
2. Mehrfeld-/Mehrfirmen-Logistik und unabhängige Vermögensbewertung ergänzen.
3. Sporadischen nativen Importdialog bei 175 % ursächlich beheben; Rechte der 77 Archivdateien und C64-Referenz getrennt klären.

**Keine Release-Freigabe, kein Merge und keine vorgezogene persönliche Endabnahme.**
