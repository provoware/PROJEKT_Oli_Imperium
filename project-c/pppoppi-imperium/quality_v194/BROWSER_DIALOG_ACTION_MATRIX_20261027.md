# Projekt C – Dialog-Aktionsmatrix bei echtem Chromium-Zoom

**Stand:** 27.10.2026 · **Basis:** PR #86, `01475e180b658ec5601fd8a5c33f78686ba38e6b` · **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360` · **Spiel:** PPPOPPI IMPERIUM, isolierte V1.9.4-Pruefschicht.

## Anlass und Umsetzung

Der vorherige [Teiltest](BROWSER_DIALOG_ACTIONS_20261027.md) aktiviert pro Szene nur den ersten Wirtschafts-Knopf. Der neue Test `test_browser_dialog_action_matrix_v194.py` erfasst alle 39 registrierten Spielszenen und testet **jede unterschiedliche, sichtbare, aktivierte Aktionskennung pro Szene** in einer jeweils frischen, isolierten Offline-Partie. Wiederholte Parameter (weitere Claims/Regionen) werden vorerst nicht als vollstaendig abgedeckt gezaehlt.

Das 800x600-Startfenster wird mittels `chrome.tabs.setZoom/getZoom` tatsaechlich auf 175 und 200 Prozent gezoomt. Jede Aktion wird mit Tab erreicht und per Enter ausgeloest; die Pruefung verlangt sichtbaren Fokus, genau einen vertrauenswuerdigen Klick, einen gueltigen Spielstand, keine JavaScript-Laufzeitfehler und keine externen HTTP-Anfragen. Fuer `SURVEY` und `END_TURN` werden fachliche Sollfolgen geprueft; fuer `PUMP`, `DRILL`, `PIPE_START` und `REFINERY_BUILD` wird die sichere Ablehnung im frischen Startzustand verlangt. Weitere Aktionsfolgen bleiben offen.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_dialog_action_matrix_v194.py`.

## Nachweisstatus

**PENDING:** GitHub-CI auf dem finalen Zweig-HEAD ist noch auszuwerten. Bis dahin keine neuen PASS-Behauptungen und keine Aenderung der 52 Freigabepflichten. Die 110 manifestgeschuetzten Originaldateien bleiben unberuehrt.

## Grenzen / naechste Schritte

1. GitHub-CI und Testprotokolle auswerten, eventuelle Fehlannahmen im neuen Sollfolgenvertrag korrigieren.
2. Wiederholte Claims/Regionen und nach Zustandsaenderungen neu verfuegbare Aktionen mit weiteren fachlichen Sollfolgen abdecken.
3. Vollstaendige reguläre Sieg-/Niederlagenpartien mit Export, Neustart und Import pruefen; danach technische Restgates.

**Weiterfuehrende Empfehlung:** Jede Aktionskennung mit versionierten Vorbedingungen und konkreten erwarteten Zustandsdifferenzen verknuepfen. Das ist mehr als ein erfolgreicher Tastaturklick. Kein Merge, kein Release; persoenliche Endabnahme bleibt am Ende.
