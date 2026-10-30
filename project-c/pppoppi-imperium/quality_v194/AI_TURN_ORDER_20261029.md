# BAL-01 – Kontrollierter KI-Zugreihenfolge-Gegenvergleich (29.10.2026)

**Status:** neuer Test und CI-Prüfschritt auf dem bestehenden Entwurfszweig von [PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). **Neuer KI-Test PASS im GitHub-CI-Lauf #40923398654 auf Code- und Matrix-HEAD `6b3237f69658daf6ec55ef3a00f91440f2fb8dc5`.** Der nachfolgende reine Dokumentations-HEAD wird erneut geprüft. Kein BAL-01-Gesamtpass, kein Release.

## Hypothese und Prüfansatz

In den bisherigen zwei geskripteten 36-Monats-Kampagnen blieb A3 nach H1/A1/A2 ohne rentable Investitionsvorschläge. Die Zugreihenfolge könnte mitentscheidend sein. Der neue Test `test_ai_turn_order_v194.cjs` prüft **alle sechs Permutationen von A1, A2 und A3**, jeweils in den zwei vorhandenen Märkten `active_normal` und `active_low_price`. H1 bleibt immer zuerst. Die Identitäten, Strategieprofile, Logistikreserven, Preise, Startfelder und die menschlichen Aktionen bleiben unverändert.

- Nur die Reihenfolge der drei KI-Firmen in der **frisch erzeugten Test-Spielstandkopie** wird vertauscht; der unveränderte Spielkern führt sämtliche Aktionen und Monatswechsel aus.
- Für jede Permutation wird vor dem ersten Zug nachgewiesen, dass die Firmen **außer ihrer Position** dieselben Ausgangsdaten besitzen und der Spielstand validiert.
- Jede Kombination läuft **zweimal über 36 Monate**, mit exakt gleicher wirtschaftlicher Ergebnisprüfung; die ursprüngliche Reihenfolge muss zusätzlich exakt mit einem uninstrumentierten Kontrolllauf übereinstimmen.
- Messgrößen je Firmen-ID: ausgeführte Strategieaktionen, Feldbesitz, Veränderung Kasse minus Schulden, Endschulden und Sanierungen. Alle sechs Reihenfolgen werden pro Szenario verglichen.
- **Umfang:** 2 Märkte × 6 Reihenfolgen × 2 Wiederholungen = 24 Kampagnen; zusätzlich 2 Kontrollkampagnen, insgesamt **26 × 36 = 936 simulierte Monate**. Wiederholungen sind keine unabhängigen Stichproben.
- Nach jeder Simulation wird die originale `fresh`-Funktion wiederhergestellt, auch bei einem Testfehler. Keine Änderung an den 110 manifestgeschützten Originaldateien.

## Reproduktion und Abnahme

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_turn_order_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_order_v194.cjs > ai_turn_order.json
node -e "const r=require('./ai_turn_order.json'); if(r.rows.length!==12 || r.comparisons.length!==6 || r.totalSimulatedMonths!==936 || r.prereleaseGate!=='BLOCKED') process.exit(1);"
```

Der GitHub-Prüfablauf `.github/workflows/prerelease-ai-strategy-metrics.yml` prüft den Test und archiviert das vollständige JSON. **PASS** erst nach erfolgreicher Ausführung, nicht aufgrund dieser Planung.

## Tatsächlich gemessene Ergebnisse

[GitHub-KI-CI #40923398654](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40923398654) **PASS**: Node-Syntaxprüfung, alle 24 wiederholten Kampagnen und zwei Kontrollkampagnen (**936 Spielmonate**), sechs Firmen-ID-Vergleiche und unveränderte Ausgangsdaten außer der Zugposition. Die Originalreihenfolge lieferte exakt das Ergebnis des nicht instrumentierten Kontrolllaufs. Die übrigen KI-Baseline-/Profil-/Reserve-/Investitions-/Trace-Prüfungen waren im selben Auftrag erfolgreich. Der Gesamt-Vorrelease-Test bleibt BLOCKED.

| KI-Position nach H1 | Normalmarkt: Aktionen / Felder | Niedrigpreismarkt: Aktionen / Felder |
| --- | --- | --- |
| Erste KI | 81 / 3 (alle drei Firmen-IDs) | 71–81 / 3 |
| Zweite KI | 26–30 / 1 | 24–30 / 1 |
| Dritte KI | **0 / 0 (alle drei Firmen-IDs)** | **0 / 0 (alle drei Firmen-IDs)** |

Die Werte gelten für die **jeweiligen Firmenpositionen in sechs festen Reihenfolgen**, nicht für sechs unabhängige Zufallswelten. Die zunächst inaktive A3 führte im Normalmarkt als erste KI **81 Aktionen** aus und hielt am Ende **drei Felder**, als zweite KI **26–30 Aktionen / ein Feld**, als dritte KI **0 Aktionen / null Felder**. Im Niedrigpreismarkt waren es als erste KI **71 Aktionen / drei Felder**, als zweite KI **24–30 / ein Feld**, als dritte KI **0 / null**.

**Wesentliche Eingrenzung:** Die beobachtete Null-Aktivität hängt in diesen zwei Kampagnen deutlich mit dem **letzten KI-Zugplatz** zusammen und nicht mit der festen Identität A3. Der Vergleich ändert allerdings zugleich die Reihenfolge der strategischen und logistischen KI-Vorbereitung; er trennt diese Wirkungen noch nicht. Die Ergebnisse rechtfertigen noch keine Änderung der Produktions-Spielregeln ohne einen separaten Wirkungs-/Regressionsvergleich.

## Interpretation und Grenzen

Eine Verbesserung bei früherem A3-Zug wäre ein **Reihenfolgeeffekt in diesem Modell**, kein Nachweis einer unfairen allgemeinen KI. Auch die Logistikvorbereitung iteriert über die Firmenliste; der Test trennt strategische und logistische Reihenfolgeeffekte noch nicht. Der Mensch handelt immer zuerst. Kasse minus Schulden ist kein buchhalterischer Gewinn und kein Gesamtvermögen. Weder unabhängige Zufallsszenarien noch historische C64-Regeln, Rechte oder Nutzer-Endabnahme sind damit belegt.

## Parallele CI-Stabilitätsdiagnose

Im vorherigen Entwicklungs-HEAD `d4e2a7543371e102e41beb501a6b4302c563d8d7` scheiterte die [Browser-Gesamtprüfung #40915067138](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40915067138) zunächst ausschließlich im nativen Zoom-Test: Chromium meldete beim Tastatur-Sitzungsimport nach 5 Sekunden **keinen Dateiauswahldialog**. Die sieben anderen Browseraufträge waren erfolgreich. Der fehlgeschlagene Einzelauftrag wurde **unverändert erneut gestartet** und bestand im zweiten Versuch. Das ist ein Hinweis auf einen sporadischen Fehler; weder der Test noch der Bedienpfad gelten deshalb als dauerhaft repariert. Beim nächsten Wiederauftreten Zeitpunkte, Klickzählung, Fokus und Dateieingabe gezielt diagnostizieren; keine Testumgehung.

## Offene Pflichten / nächste Schritte

1. GitHub-CI auf dem endgültigen PR-HEAD prüfen, JSON-Ergebnisse der sechs Reihenfolgen auswerten, mögliche Fehler beheben und die Kennzahlen mit exaktem Nachweis hier ergänzen.
2. Falls Reihenfolge relevant: strategische und logistische Reihenfolge getrennt kontrollieren; danach echte Gewinn-/Vermögensbewertung sowie KI-Schulden-/Sanierungsszenarien.
3. Weitere 77 ausgeschlossene Archivdateien auf Rechte und technische Notwendigkeit prüfen; C64-Originalreferenz gesondert verifizieren. Persönliche Sicht-/Kubuntu-Abnahme erst nach vollständiger technischer Kandidatenprüfung.

**Kein Merge, keine Veröffentlichung, keine vorgezogene persönliche Endabnahme.**
