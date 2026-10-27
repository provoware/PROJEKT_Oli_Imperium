# Projekt C – Browser-Prozessneustart nach echten Spielstand-Exporten

**Stand:** 27.10.2026 · **Entwicklungszweig:** `automation/prerelease-browser-process-restart-20261027-1931` · **Basis:** PR #91, `e7b7823b4b47f5b60c3d641146152498877f8215` · **main bei Vorpruefung:** `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Befund und Motivation

[Browser-CI #40552012675](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40552012675) auf PR #91 ist **vollstaendig PASS**: beide Jobs `chromium-roundtrip` und `native-zoom-regression` abgeschlossen. [Quellpruefung #40552012779](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40552012779) ebenfalls PASS. Die [Vorrelease-Pflichtmatrix #40552012825](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40552012825) bleibt korrekt FAIL/BLOCKED (6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED).

Bisherige 12-Monats-Browserregression schloss nur den **Browserkontext**, nicht den Chromium-Prozess. Ein Kontextwechsel belegt keine Fortsetzung nach vollstaendigem Programmneustart. Die neue Pruefung beendet Chromium an den drei bestehenden Spielstand-Checkpoints nach Monat 4, 8 und 12 vollstaendig, startet einen neuen Browserprozess, importiert die zuvor heruntergeladene JSON-Datei und vergleicht den kompletten Zustand. Die bisherige Negativprobe mit ungueltigem `cashCent=-1` bleibt erhalten und muss ohne Datenveraenderung abgelehnt werden. Kein kuenstlicher Spielstand wird als gueltig eingeschleust.

## Geaenderte Dateien und Abnahme

- `quality_v194/test_browser_longrun_v194.py`: drei echte Prozessneustarts und eigener Zaehler `chromium_process_restarts`, weiterhin 12 Monate, 12 Berichte, 3 Export-/Import-Vergleiche, 3 Manipulationsablehnungen.
- `.github/workflows/prerelease-browser-project-c.yml`: zutreffende Bezeichnung des bestehenden Browserpruefschritts, keine Testdeaktivierung.
- `prerelease/matrix.json`: korrigierter belegter Stand von PR #91; `SPE-01`, `STA-03`, `VER-03` bleiben **BLOCKED**, bis neue CI und weitere Pflichten vorliegen.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_longrun_v194.py`. Pflicht-Schnellpruefungen: `python3 tools/validate_project.py` und `python3 -m unittest discover -s tests -v`.

**Status vor neuer CI:** Implementiert, **PENDING**; keine Behauptung eines bestandenen Prozessneustart-Tests. Gesamtrelease weiterhin BLOCKED. Kein Spielkern, keine der 110 geschuetzten Originaldateien und kein `main` veraendert.

## Drei naechste Schritte

1. Neue Browser-CI auf finalem HEAD abwarten und bei FAIL die erste fehlgeschlagene Aktion beheben.
2. Unabhaengige Altspielstand-/Fehlerimporte und Endregel-Vertrag absichern.
3. Regulare Sieg-/Niederlagenpartien sowie technische Freigabegates abschliessen; erst dann Kandidat einfrieren und persoenliche Endabnahme gesammelt durchfuehren.

**Weiterfuehrende Empfehlung:** Browserkontextwechsel und Browserprozess-Neustart in kuenftigen Testberichten strikt unterscheiden.
