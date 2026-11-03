# CI-Fehlerkorrektur: nativer Zoom, undefinierter Tab-Helfer (02.11.2026)

**Spiel:** PPPOPPI IMPERIUM, V1.9.4-Pruefschicht / V1.9.3-Spielkern.
**Entwicklungszweig:** `test/oli-campaign-24-60-20261101`, [Draft-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155).
**Ausgangs-HEAD:** `217ef135f5f85afe05648c45ef6e9c7ce92a8b21`.
**Betroffener CI-Lauf:** https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41520201346

## Verifizierter Befund

Auf dem Ausgangs-HEAD waren sieben der neun GitHub-Workflows erfolgreich. Die integrierte Vorrelease-Sperre war erwartungsgemaess FAIL. Der Offline-Browser-Rundlauf war tatsaechlich FAIL: beide Jobs `native-zoom-regression (1)` und `(2)` stoppten nach erfolgreichem 175-%-Spielstart und Bohrspielstart bei `test_browser_native_zoom_drill_v194.py:36` mit `NameError: name 'tab_to' is not defined`. Die Ursache ist ein fehlender Python-Import im Pruefprogramm, **kein belegter Spielfehler**. Die 200-%-Bohrkampagne wurde durch diesen Abbruch nicht erreicht.

## Minimaler Patch und Regression

1. `test_browser_native_zoom_drill_v194.py`: den bereits vorhandenen `tab_to`-Helfer aus `test_browser_keyboard_drill_v194.py` explizit importieren. Die strenge Tastaturbedienung bleibt erhalten.
2. `test_native_zoom_drill_gate_contract_v194.py`: neue AST-Regression fordert die explizite Importbindung und genau einen `tab_to(page, "#closeBtn")`-Aufruf im Layout-Gate. Dieser Test laeuft im CI bereits **vor** der Chromium-Installation.
3. `TODO.md`: Ursache, betroffene Gates, offene Nachweise und Folgearbeit dokumentieren.

**Nicht veraendert:** Spielkern, Wirtschaftsregeln, Speicherformat, geschuetzte Originaldateien, Fokus-/Sichtbarkeits-Gates, andere Repositories, `main`, Freigabe- und Merge-Regeln.

## Pflichtstatus und Reproduzierbarkeit

| Pruefung | Status auf Ausgangs-HEAD | Status nach Patch |
|---|---|---|
| Native 175/200-%-Bohrkampagne, zwei Matrixjobs | FAIL (NameError, vor eigentlichem Layouttest) | PENDING: erneuter echter Chromium-Lauf erforderlich |
| AST-Vertrag: Tab-Helfer explizit importiert | bisher nicht vorhanden | neu implementiert; CI ausstehend |
| Andere sieben GitHub-Fachworkflows | SUCCESS | erneute HEAD-Pruefung ausstehend |
| Integrierte technische Release-Sperre | FAIL (erwartet) | BLOCKED, unveraendert |
| Benutzer-Sichtpruefung und Kubuntu-Praxistest | DEFERRED | erst am eingefrorenen Release-Kandidaten |

**Matrix:** [52 verbindliche Gates](../prerelease/matrix.json): 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED (11,5 % PASS). Keine Gates durch diese Korrektur vorzeitig auf PASS setzen.

**Naechste drei Schritte:** (1) CI auf dem neuen HEAD auswerten und beide nativen Zoomjobs bestaetigen; (2) bei weiteren echten FAILs gezielt nachbessern, ohne den Tastaturvertrag abzuschwaechen; (3) weitere dynamische Minispielphasen und Speicherung/Wiederherstellung nach Matrix priorisieren.

**Freigabe:** Draft bleibt offen, kein Merge, kein Release, persoenliche Endabnahme erst nach allen eigenstaendig moeglichen technischen Gates.
