# CI-Fehlerdiagnose und Syntaxkorrektur · 02.11.2026

**Spiel:** PPPOPPI IMPERIUM V1.9.4 · **Entwurf:** [PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) · **untersuchter HEAD:** `10576a684f1532dbaab28177c51f984928cd89b6`.

## Verifizierte GitHub-Prüfungen

| Nachweis | Ergebnis auf Ausgangs-HEAD | Befund und Folge |
|---|---|---|
| [Rohrnetz-/Feuerwehr-CI #41473770514](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770514) | FAIL | `test_minigame_keyboard_gate_v194.py`, Zeile 16: doppelte Backslashes vor Python-Zeilenumbruch, `SyntaxError: unexpected character after line continuation character`. Alle zehn neuen Tests konnten nicht ausgeführt werden. |
| [Browser-CI #41473770623](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770623) | 6 PASS / 3 FAIL | Beide nativen Zoomjobs: nach Bohrstufe 3 liegt `#closeBtn` trotz Tab-Fokus außerhalb des sichtbaren Fensters (rectTop=-1012, rectBottom=-975, viewportHeight=343, scrollY=109). |
| [Browser-CI #41473770623](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770623) | FAIL: chromium-roundtrip | `#startGame` ist `:focus-visible`, besitzt aber keine berechnete CSS-Fokusmarkierung (`ring: false`). |

## Umgesetztes zusammenhängendes Pflichtpaket

- Genau zwei fehlerhafte Python-Zeilenfortsetzungen korrigiert; alle zehn Testfälle und sämtliche Fokus-/Verdeckungsprüfungen unverändert belassen.
- Den betroffenen Test in den frühen `py_compile`-Prüfschritt des vorhandenen GitHub-Ablaufs aufgenommen, **vor** der Chromium-Installation.
- Syntax lokal auf dem byteidentisch rekonstruierten Ausgangstext nach Korrektur erfolgreich kompiliert; kein Ersatz für echten CI-Test.

**Noch offen:** zehn Regressionen und vollständiger Rohrnetz-/Feuerwehr-Browserlauf auf neuem HEAD; danach sichtbaren `#closeBtn` und CSS-Fokusring von `#startGame` im echten 800×600-Browser bei 175/200 % korrigieren. Keine künstliche Fokussetzung, kein Umgehen der Tests.

**Pflichtmatrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52, unverändert. **Kein Merge, kein Release, keine persönliche Endabnahme.**
