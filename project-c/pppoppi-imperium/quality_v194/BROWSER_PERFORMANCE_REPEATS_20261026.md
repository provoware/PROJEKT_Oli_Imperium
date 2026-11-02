# Vorrelease-Pflichtpaket: wiederholbare Speicher- und Laufzeitmessung

**26.10.2026 · PPPOPPI IMPERIUM V1.9.4 / Projekt C**

## Verifizierter Ausgangsstand

Entwurfs-PR #63, HEAD `9ab196e54167018f75dd37ea8e829a3044d81a7d`:
- [Chromium-CI #40345612410](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40345612410): **PASS** auf diesem HEAD.
- [Quell-/Fach-CI #40345612284](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40345612284): **PASS**.
- [Gesamtmatrix #40345612209](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40345612209): **FAIL/BLOCKED** wegen offener Vorrelease-Pflichten.

Die erste Browser-Leistungsprobe meldete **0,1261 s Offline-Ladezeit**, Monatswechsel-Median **0,3434 s**, Maximum **0,3946 s**. Die JavaScript-Belegung stieg von **3.249.740** auf **17.757.340 Bytes** (+14.507.600 Bytes) zwischen Monat 0 und 12. **Diese vier bisherigen Stichproben wurden ohne erzwungene Speicherbereinigung erfasst**; sie belegen weder ein Speicherleck noch Speicherstabilität.

## Dieses Arbeitspaket

- `test_browser_performance_v194.py`: Vor jeder der vier Chromium-Messungen (Monat 0, 4, 8, 12) explizite Speicherbereinigung mit `HeapProfiler.collectGarbage`. So wird bereits freigegebener JavaScript-Speicher weniger stark mit noch erreichbaren Spielobjekten vermischt.
- Browser-CI: **drei unabhängige Durchläufe** desselben 12-Monats-Tests mit je eigenem Chromium-Prozess und temporärer Offline-Vorschau. Jede Runde prüft weiterhin echte Klicks, Monatsberichte, Laufzeitfehler und Netzwerkanfragen. Ein Fehler in einer Wiederholung stoppt den Workflow.
- Die drei `PERFORMANCE-DIAGNOSE`-JSON-Zeilen im CI-Protokoll dienen zum Vergleich von Median, Maximum und bereinigtem Speicherverlauf. Die neuen bereinigten Werte sind **nicht direkt** mit der bisherigen unbereinigten Messreihe vergleichbar.
- Geschützte 110 Spiel-Originaldateien, Wirtschaftscode und Spielstandschema werden nicht verändert.

**Lokal wiederholen:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_performance_v194.py` (Playwright mit installiertem Chromium vorausgesetzt). Die dreifache Wiederholung wird in `.github/workflows/prerelease-browser-project-c.yml` ausgeführt.

## Pflichtmatrix und verbleibende Grenzen

`PER-01` und `PER-02` bleiben **BLOCKED**, bis Messreihen ausgewertet, sinnvolle Grenzwerte begründet und deutlich längere Partien mit mehreren Speicherkontrollen untersucht sind. Drei kurze GitHub-Läufe ersetzen weder eine Langzeitpartie noch den späteren Kubuntu-Praxistest. Es wird **kein** neues Release-PASS behauptet.

**Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Die drei persönlichen Endabnahmen bleiben ausschließlich für den eingefrorenen, technisch vollständig geprüften Kandidaten reserviert.

**Nächste Implementierung:** (1) dreifache CI-Messreihe samt Abweichungen auswerten; (2) längere Browser-Partien mit reproduzierbarem Speicherverlauf und normalem Spielende prüfen; (3) danach echte Zoom-/Tastaturpfade und vollständige technische Pflichtgates schließen.

**Kein Merge, kein Release, keine persönliche Vorabnahme.**

## Tatsächlich ausgeführte GitHub-Prüfung

**Implementierungs-HEAD:** `effca7f41908d770e08208c96979ea988d7b4235`

- [Chromium #40351415613](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40351415613): **PASS**, alle drei Wiederholungen mit zwölf echten Monatswechseln (insgesamt 36 Browser-Spielmonate).
- [Quell-/Fachprüfung #40351415556](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40351415556): **PASS**.
- [Gesamtmatrix #40351415573](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40351415573): **FAIL/BLOCKED** erwartungsgemäß, nicht als Freigabe gewertet.

| Messung | Lauf 1 | Lauf 2 | Lauf 3 |
| --- | ---: | ---: | ---: |
| Offline-Laden (s) | 0,0927 | 0,0842 | 0,1246 |
| Median Monatswechsel (s) | 0,2319 | 0,2402 | 0,2349 |
| Langsamster Monatswechsel (s) | 0,2861 | 0,2956 | 0,2948 |
| JS-Heap Monat 0 nach GC (Bytes) | 2.116.960 | 2.116.960 | 2.116.960 |
| JS-Heap Monat 12 nach GC (Bytes) | 3.076.728 | 3.076.888 | 3.076.908 |
| Heap-Anstieg nach GC (Bytes) | 959.768 | 959.928 | 959.948 |

Die Messreihe ist über drei Durchläufe eng reproduzierbar. Der **bereinigte** Speicheranstieg beträgt etwa **0,96 MB pro zwölf Spielmonate**; ob er aus notwendiger Spielhistorie oder unnötiger Speicherung entsteht, ist damit noch nicht geklärt. Insbesondere ist die Aussage „kein Speicherleck“ **nicht belegt**. Die neue Messreihe ist wegen der erzwungenen Bereinigung nicht direkt mit den 14,5 MB der alten Messung vergleichbar.

**Freigabestand unverändert:** 6/52 PASS; PER-01 und PER-02 BLOCKED. Als nächstes mindestens eine längere echte Browserpartie mit Speicherbereinigung und Monats-/Berichtszähler ausführen; bei vorzeitigem Spielende den Endzustand als fachlichen Befund dokumentieren, nicht künstlich weiterklicken.
