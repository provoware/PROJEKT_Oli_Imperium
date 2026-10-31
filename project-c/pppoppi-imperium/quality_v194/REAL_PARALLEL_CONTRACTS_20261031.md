# WIR-03 / WIR-04 – Zwei parallele Regionalverträge mit natürlicher Teillieferung (31.10.2026)

## Ausgangspunkt und konkrete Pflicht

Einzelne Voll- und Fehlverträge sind bereits getestet. Dieser zusätzliche, von der Buchungslogik getrennte Prüfer führt **zwei gleichzeitig offene Verträge zweier menschlicher Firmen** über unterschiedliche Regionen aus. Die erste Firma verkauft im Vormonat durch eine reguläre Marktaktion einen Teil ihres selbst geförderten Rohöls; bei Fälligkeit ist deshalb nur eine Teillieferung möglich. Die zweite Firma liefert vollständig. Die Fälle entstehen durch öffentliche Spielaktionen ohne Kassen-, Lager- oder Schuldeninjektion.

**Betroffene Matrixpflichten:** WIR-03 (Vertrags- und Lieferketten), WIR-04 (Kassen-, Rechnungs- und Buchungskonsistenz). Beide bleiben **BLOCKED**, da Gesamtpartien, Forderungsbewertung, Bilanz und andere Release-Nachweise fehlen. Keine Änderung des Spielkerns oder historischer C64-Regeln.

## Reproduzierbarer Ablauf und unabhängiger Sollwert

1. H1 erschließt NORD-1, fördert 100.000 Milli-Barrel, verschickt sie zum Markt, bietet sie an und unterschreibt einen Vertrag über 40.000 Milli-Barrel. Beim regulären ersten Monatsabschluss werden 80.000 Milli-Barrel verkauft; **20.000** verbleiben für die Vertragsfälligkeit.
2. H2 erschließt BERLIN-1, fördert 100.000 Milli-Barrel und unterschreibt ebenfalls einen Vertrag über 40.000 Milli-Barrel. Sein Lager bleibt im ersten Monat unveräußert.
3. Im zweiten Monat wird H1s Vertrag als **BREACH** mit 20.000 Milli-Barrel Lieferung, Transportrechnung und Strafe auf die fehlenden 20.000 Milli-Barrel abgerechnet. H2 liefert **40.000** vollständig und erreicht **DONE**, ohne Vertragsstrafe.
4. Für beide Firmen werden Vertragsidentität, Fälligkeit, Lagerreste, Rechnungen, einzelne Zahlungen, Kassenbuch, unabhängige Sollkasse, Monatsbericht, Schulden, Statistik und Duplikatschutz geprüft. Der Test vergleicht die erwarteten Centbeträge mit den regionalen Marktpreisen vor Vertragsabrechnung und den ausdrücklich dokumentierten Modellparametern. Das ist keine Bilanzierung von Forderungen.

## Prüfumfang und Befehle

**2 deterministische Wiederholungen**, **8 Firmen-Monatsbeobachtungen**, **24 absichtliche Manipulationen** (unter anderem Kasse, Vertrag, Eigentum, Lager, Zahlungsbetrag und archivierter Bericht) sowie **6 JSON-Speicher-Rundläufe**. Jede reguläre Aktion wird auf unveränderte Eingabe, erfolgreiche Zustandsprüfung und idempotente Wiederholung kontrolliert.

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_real_parallel_contracts_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_real_parallel_contracts_v194.cjs
```

Der [Fachworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-real-credit-longrun.yml) führt diese Prüfung auf dem Entwicklungszweig aus und sichert `real_parallel_contracts.json` als Ergebnis. **Bei Erstellung noch kein CI-PASS auf dem finalen HEAD bestätigt.** Maßgeblich sind der konkrete GitHub-Lauf und dessen Commit.

## Grenzen und offene Pflichten

- H1s Teillieferung und H2s Vollerfüllung betreffen **verschiedene Firmen und Regionen**; drei gleichzeitige Verträge derselben Firma, Forderungsausfälle und Verrechnungen über mehrere Geschäftspartner sind nicht abgedeckt.
- Verträge zahlen im Spielmodell unmittelbar; offene Kundenforderungen, Ausfallbewertung und Jahresbilanz können deshalb nicht aus diesem Test abgeleitet werden.
- Keine vollständige Gewinn-/Verlust-Endpartie, keine kausale Behebung des sporadischen Browser-Dateiimports bei 175/200 %, keine Rechteprüfung der ausgeschlossenen Ressourcen und kein verifizierter C64-Originalvergleich.
- Die Vorrelease-Matrix bleibt bei **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Persönliche Sichtprüfung und Kubuntu-Abnahme erst nach vollständig grünen technischen Pflichtprüfungen am eingefrorenen Kandidaten; kein Merge nach `main`, kein Release.

**Nächste drei Schritte:** (1) Fach-CI und Gesamt-CI auf dem neuen HEAD auswerten und Fehler korrigieren; (2) drei gleichzeitige Verträge einer Firma über drei Regionen mit Mengen-/Rechnungsabgleich testen; (3) Forderungsmodell und Vermögensbewertung fachlich spezifizieren, ohne C64-Regeln zu erfinden.
