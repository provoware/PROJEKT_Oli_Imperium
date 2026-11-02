# BAL-01 – Strategische und logistische KI-Reihenfolge getrennt prüfen (29.10.2026)

**Status: TEST IMPLEMENTIERT, CI-NACHWEIS NOCH AUSZUWERTEN.** Diese Arbeit erweitert ausschließlich den bestehenden [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). Die 110 geschützten Originaldateien, der Spielkern und `main` werden nicht geändert. **BAL-01 bleibt BLOCKED; keine Vorrelease-Freigabe.**

## Ausgangsbefund und Frage

Der [sechsfach kontrollierte Reihenfolgetest](AI_TURN_ORDER_20261029.md) zeigte in zwei geskripteten Märkten einen deutlichen Zusammenhang zwischen KI-Zugposition und Investitionsaktivität. Allerdings ändert die Firmenliste sowohl die Reihenfolge der strategischen KI-Züge als auch die spätere logistische Vorbereitung. Die beiden Ursachen dürfen nicht verwechselt werden.

## Neuer reproduzierbarer Test

`test_ai_order_isolation_v194.cjs` führt zwei Märkte mit allen sechs strategischen KI-Reihenfolgen durch. Für jede strategische Reihenfolge werden **zwei** logistische Reihenfolgen geprüft: (a) fest A1→A2→A3, (b) identisch zur jeweiligen strategischen Reihenfolge. Damit bleibt bei jedem paarweisen Vergleich die strategische Reihenfolge **unverändert**, während nur die logistische Reihenfolge variiert. Die Logistikschleife wird ausschließlich in einer isolierten, im Arbeitsspeicher geladenen Kopie des Originaladapters umgestellt.

- **24 unterschiedliche Kombinationen** aus Markt, strategischer und logistischer Reihenfolge, jeweils doppelt: 48 vollständige 36-Monats-Kampagnen.
- **12 Originaladapter-Kontrollkampagnen** mit übereinstimmender Reihenfolge, jeweils exakte Gleichheit des vollständigen wirtschaftlichen Ergebnisses gegen die isolierte Kopie.
- **2 nicht instrumentierte Kontrollkampagnen** für die Originalreihenfolge.
- **Gesamt 62 Kampagnen / 2.232 simulierte Monate**; 36 firmenbezogene Differenzvergleiche (Liquidität, Schulden, Felder, Strategie- und Logistikaktionen).
- Jede Testkopie erhält dieselben Startdaten, Firmenidentitäten, Profile, Preis-/Nachfragebedingungen und Startkennung; lediglich die Firmenlistenposition wird für den strategischen Gegenvergleich verändert. Mensch H1 bleibt zuerst.
- Nach jedem Test werden die ursprünglichen Funktionen und Schalter auch bei Fehlern wiederhergestellt. Ein Fehler wird nicht als PASS umgedeutet.

**Wichtig:** Dies ist ein deterministischer Ursachenvergleich innerhalb des vorhandenen Modells, keine unabhängige Zufallsstichprobe. Der Vergleich *fest gegen übereinstimmend* isoliert die Wirkung der Logistikreihenfolge bei konstanter Strategieposition; die Änderung der Strategieposition kann weiterhin nachgelagerte Wettbewerbsfolgen auslösen. Die Kennzahl Kasse minus Schulden ist weder Gewinn noch Vermögen.

## Reproduktion

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_order_isolation_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_order_isolation_v194.cjs > ai_order_isolation.json
node -e "const r=require('./ai_order_isolation.json'); if(r.rows.length!==24 || r.comparisons.length!==36 || r.totalCampaigns!==62 || r.totalSimulatedMonths!==2232 || r.prereleaseGate!=='BLOCKED') process.exit(1);"
```

GitHub Actions: [`prerelease-ai-strategy-metrics.yml`](../../../.github/workflows/prerelease-ai-strategy-metrics.yml) – der neue Schritt lädt `ai_order_isolation.json` als Nachweisartefakt hoch. **PASS erst nach erfolgreichem CI-Lauf auf dem endgültigen Commit**; bis dahin keine behaupteten Ergebnisse.

## Noch offene Pflichten

1. CI-Lauf und JSON-Artefakt auf dem finalen HEAD auswerten; bei Fehlern Test oder Hypothese korrigieren, danach genaue Ergebnisdifferenzen dokumentieren.
2. Aus den isolierten Differenzen gezielte, messbar bessere KI-Strategien ableiten; Gewinn, Vermögen, Schulden- und Sanierungsszenarien separat prüfen, ohne das Original zu verändern.
3. Rechte-/Ressourcennachweis der 77 ausgeschlossenen Archivdateien und historische C64-Referenz gesondert klären. Persönliche Sicht- und Kubuntu-Abnahme ausschließlich nach allen technischen Freigaben und eingefrorenem Kandidaten.

**Kein Merge, kein Release, keine vorgezogene Benutzerabnahme.**

## Nachweis: abgeschlossener GitHub-CI-Lauf

[**KI-CI #40941593060 – PASS**](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40941593060) auf dem getesteten HEAD `7a171207ab2517afa7e0a94771f71d29cf778651`. Der neue Prüfschritt sowie alle vorherigen KI-Strategie-Prüfschritte bestanden. [JSON-Artefakt](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40941593060/artifacts/12927213466) enthält die vollständigen Einzelresultate.

**Messbefund:** In allen **36 firmenbezogenen Vergleichen** (zwei Märkte × sechs strategische Reihenfolgen × drei Firmen) ergab der Wechsel zwischen fester Logistikreihenfolge A1→A2→A3 und einer an die strategische Reihenfolge angepassten Logistikreihenfolge **keine Änderung** bei Strategieaktionen, Logistikaktionen, Feldern, liquider Nettoposition oder Endschulden. Alle zwölf Gegenproben mit dem geschützten Originaladapter waren ergebnisgleich; alle 48 isolierten Läufe waren wiederholbar. **62 vollständige 36-Monats-Kampagnen / 2.232 Monate: PASS.**

**Schlussfolgerung innerhalb dieser Testbedingungen:** Der zuvor gemessene KI-Positionsunterschied wird **nicht** durch die bloße Reihenfolge der Logistikvorbereitung erklärt. Die strategische Zugfolge und ihre Konkurrenz-/Feldbelegungseffekte sind die deutlich plausiblere Erklärung. Das gilt nur für diese beiden deterministischen Märkte und das geskriptete menschliche Verhalten. Es beweist weder allgemeine Balance noch die Unbedenklichkeit der Logistikreihenfolge in anderen Spielständen. BAL-01 bleibt BLOCKED.

**Prüfstand nach Dokumentationsänderung:** Der genannte CI-PASS gehört ausdrücklich zum vorherigen Code-HEAD; der neue reine Dokumentations-HEAD ist gesondert zu kontrollieren. Kein Merge, kein Release.
