# WIR-03 / BAL-01 – Drei Konkurrenzmonate mit echtem Restlager (30.10.2026)

**Technischer Teilnachweis, Vorrelease weiterhin BLOCKED.** Bestehender [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137), keine neue PR und kein Eingriff in den geschützten Spielkern. Ausgangs-HEAD: `dda551b5d512f0781f03763b868b9d26e3390d8c`.

## Prüfgegenstand und erwartete Wirkung

Der vorherige [Zweifeld-Test](MULTICLAIM_COMPETITION_20261030.md) deckte einen abgeschlossenen Marktmonat ab. Der neue `test_multimonth_competition_v194.cjs` führt zwei echte Firmen mit je einem Berliner Ölfeld **drei vollständige Marktmonate** lang durch die originale Übergangsfunktion: Erstkauf und Bohrung, Förderung, Versand, Angebot, Monatsabschluss, Restlagerverkauf, erneute Produktion bei leerem Lager und weitere Monatsabrechnung. Kein künstlich hinzugefügtes Geld, Öl, Eigentum oder Nachfragewert.

**Unabhängige Sollbedingungen:** Die 60/60-Barrel-Erstverteilung bleibt die bekannte Vergleichsbasis; pro Folgemonat dürfen nicht mehr Barrel verkauft werden als angeboten und nachgefragt. Beide gleich großen Angebote müssen fair verteilt werden (höchstens eine Milli-Barrel Rundungsabweichung). Für jede Firma muss über alle Monate `kumulierte Förderung = kumulierter Verkauf + Restlager + vorbereitete Ware` gelten. Der tatsächliche Kassenstand muss jederzeit mit allen Buchungsdeltas übereinstimmen. Eigentum bleibt getrennt; abgeschlossene Angebote dürfen nicht hängen bleiben; Monatszähler müssen nach dem Wechsel null sein. Zweimalige identische Ausführung, doppelte END_TURN-Kennung und JSON-Wiederherstellung werden geprüft.

**Vorgesehener Umfang (kein vorweggenommener PASS):** 2 Wiederholungen × 3 Monate = 6 simulierte Spielmonate, 12 Firmen-Monatskontrollen, 12 Duplikatprüfungen und 10 JSON-Rundläufe. Zusätzlich werden Nachfrage, verkaufte Menge, Restlager und kumulierte Verkäufe als JSON gespeichert.

## Tatsächliche Reproduktion

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_multimonth_competition_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_multimonth_competition_v194.cjs
```

GitHub führt diese Befehle in [`prerelease-natural-oil-export.yml`](../../../.github/workflows/prerelease-natural-oil-export.yml) aus. Das Artefakt `multimonth_competition.json` wird gesichert; der Prüfschritt verlangt die erwarteten Zähler und die Mengenidentität. **CI auf dem neuen HEAD noch auswerten; bei FAIL zuerst die wirkliche Ursache korrigieren.** Der bestehende Browser-Zoomtest bleibt unabhängig und darf nicht abgeschaltet werden.

## Bereits belegter unabhängiger Fehler

Auf dem vorherigen HEAD `dda551b5d512f0781f03763b868b9d26e3390d8c` scheiterte die [Browser-CI #41064742670](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41064742670), Job `native-zoom-regression`, im dritten Versuch bei 175 %. Die Diagnose bestätigte: Import-Schalter-Klick = 1, Datei-Eingangsklick = 1, Nutzeraktivierung = true, `isTrusted` am programmatischen Eingabeklick = false; **trotzdem kein natives `filechooser`-Ereignis innerhalb von 5 Sekunden**. Zwei vorherige Versuche (175 % und 200 %) waren PASS. Ursache nicht bewiesen, **SIC-02 / BED-02 / TES-04 bleiben BLOCKED**. Keine heimliche Wiederholung und kein direkter Datei-Input-Ersatz.

## Grenzen und nächste Pflichten

Dieser neue Test enthält weder Raffinerie noch öffentlichen Frachtweg und belegt keine Gewinn-/Anlagenbewertung. Vollständige Langzeitpartien, reale Browser-Zoom-Stabilität, Medienrechte der 77 ausgeschlossenen Dateien, historische C64-Referenz und persönliche Endabnahme sind offen. Pflichtmatrix WIR-03 und BAL-01 bleiben BLOCKED.

1. Neue GitHub-CI auf finalem HEAD auswerten, gegebenenfalls Testfehler korrigieren.
2. Echte drei Monatsverkäufe mit Raffinerie und öffentlichem Transport verknüpfen.
3. Den nativen Dateidialog-Fehler mit isolierter Browserursachenprüfung beheben; danach mehrfache Regression.

**Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.**

## Nachprüfung der tatsächlichen GitHub-CI (30.10.2026)

[GitHub-Lauf #41072949687](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41072949687) auf HEAD `bd779459a5f0f6ec78043ea128c34f981c5c7e58`: **PASS**, einschließlich `node --check`, dreier Fachtests, des neuen Dreimonatsprüfschritts und JSON-Artefakt [#12986361353](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41072949687/artifacts/12986361353). Zwei deterministische Durchläufe mit zusammen sechs Spielmonaten, zwölf Firmen-Monatskontrollen, zwölf abgewehrten Doppelvorgängen und zehn JSON-Rundläufen bestanden.

| Monat | Tatsächliche Berliner Nachfrage | Verkauf beider Firmen | Restlager beider Firmen | Kumuliert verkauft |
|---|---:|---:|---:|---:|
| 1 | 120 Barrel | 120 Barrel | 80 Barrel | 120 Barrel |
| 2 | 114 Barrel | 80 Barrel | 0 Barrel | 200 Barrel |
| 3 | 102 Barrel | 102 Barrel | 98 Barrel | 302 Barrel |

**Physische Bilanz nach Monat 3:** 400 Barrel regulär gefördert = 302 Barrel verkauft + 98 Barrel Restlager. Diese Zahlen beziehen sich auf einen der zwei identischen Durchläufe; sie dürfen nicht als reale Einnahmen, Gewinn oder Vermögensbewertung ausgegeben werden. Die übrigen Gesamtprüfungen und der native Dateiimport bleiben eigene Sperren. **Nach diesem Dokumentationscommit muss CI erneut auf dem endgültigen HEAD kontrolliert werden.**
