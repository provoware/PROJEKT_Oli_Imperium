# BAL-01 – KI-Zugfolge und tatsächlich ausführbare Vorschläge (29.10.2026)

**Status: Test implementiert; GitHub-CI auf endgültigem Entwicklungs-HEAD ist abzuwarten. BAL-01 bleibt BLOCKED.**

## Problem und Testgrenze

Die bisherigen Gegenvergleiche zeigen, dass A3 zu Spielbeginn gültige SURVEY-Vorschläge erhält, in den untersuchten Normalmarkt-Kampagnen aber keine strategischen Aktionen verbucht. Anfangskapital und Logistikreserven erklären das allein nicht. Es fehlt der Nachweis, **welcher Zustand tatsächlich beim Zug von A3 vorliegt**, nachdem A1 und A2 gehandelt haben.

`test_ai_turn_trace_v194.cjs` instrumentiert ausschließlich die laufende Testumgebung. Die **110 geschützten Quelldateien werden nicht verändert**. Der Test verfolgt in den zwei vorhandenen Szenarien `active_normal` und `active_low_price` jeweils 36 Monate mit A1, A2 und A3.

## Prüfvertrag

1. Für jede Firma und jeden Monat muss der tatsächliche Aufruf des KI-Planers vorliegen (216 Firmen-/Monatsdiagnosen pro zwei Szenarien). Pro Erstaufruf werden Kasse, verbrauchte Tage, freie/eigene Felder, Vorschläge und ihre Reihenfolge erfasst.
2. Für jeden Vorschlag des ersten Ranglistenaufrufs wird eine **isolierte Kopie** des Zustands als menschlich steuerbarer Zug durch die echte Übergangsfunktion geschickt. Annahme oder Fehlermeldung wird erfasst; der Ausgangszustand muss unverändert bleiben. Dies ist eine **Gegenprobe**, keine echte KI-Ausführung.
3. Nach dem tatsächlichen `END_TURN` werden die verbuchten `KI_ENTSCHEIDUNG`-, `KI_ABWARTEN`-, `KI_ZUG`- und Logistikereignisse des Monats ausgewertet. Kein Zug darf fehlen; eine Abwarten-Meldung darf nicht gleichzeitig mit einer ausgeführten Strategieaktion auftreten.
4. Jeder komplette instrumentierte Lauf wird identisch wiederholt; anschließend muss ein **nicht instrumentierter Kontrolllauf** exakt dieselben Wirtschaftskennzahlen liefern. Die ursprüngliche Übergangsfunktion und der KI-Planer werden auch bei Fehlern wiederhergestellt.
5. Das JSON enthält die vollständige Firmenstatistik und die ersten zwölf Monate als detaillierte Stichprobe. Es wird als zeitlich begrenztes GitHub-Artefakt gesichert. Die 36 Monate je Szenario werden in den Summen berücksichtigt.

Die drei Ausführungen je Szenario (Originalvergleich plus zwei instrumentierte Läufe) ergeben **216 simulierte Monate**. Das sind **keine** 216 unabhängigen Stichproben; die Szenarien sind deterministisch und der Mensch handelt nach einem festen Skript.

## Reproduktion

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_turn_trace_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_trace_v194.cjs > ai_turn_trace.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

Workflow: `.github/workflows/prerelease-ai-strategy-metrics.yml`. Der Workflow prüft auch die vorherigen KI-Baselines, Profil-/Reservevergleiche und Investitionsschranken. **PASS** bezeichnet nur die konkret durchlaufenen Prüfungen; die integrierte Vorrelease-Sperre bleibt bis zum Abschluss aller technischen Pflichten aktiv.

## Noch nicht beantwortet

- Welche der nach A1/A2 verbleibenden Konzessionen A3 tatsächlich vorschlagen und erfolgreich ausführen könnte, und ob die Rangfolge oder eine abgelehnte Aktion den Unterschied erklärt.
- Ob die Ursachen unter vertauschter KI-Zugfolge bestehen bleiben; hierfür ist ein **gesonderter isolierter Gegenvergleich** erforderlich.
- Gewinn und Vermögenswert, KI-Schulden/Sanierung, echte unabhängige Ausgangsszenarien, Rechte der 77 ausgeschlossenen Archivdateien und historische C64-Verifikation.

## Nächste drei Schritte

1. GitHub-CI und maschinenlesbare Trace-Ergebnisse auf dem endgültigen Commit auswerten; Fehler der Diagnostik beheben, ohne die geschützten Originale zu verändern.
2. Den ersten Monat und die A3-Monate ohne Aktionen anhand freier Felder, gültiger Vorschläge, tatsächlicher Ereignisse und Ablehnungsgründe kausal eingrenzen.
3. Danach einen isolierten Reihenfolge-Gegenvergleich planen und die ökonomische Wirksamkeit über vollständige Partien prüfen.

**Keine Änderung an main, kein Merge, kein Release. Persönliche Sicht- und Kubuntu-Endabnahme bleiben zurückgestellt.**
