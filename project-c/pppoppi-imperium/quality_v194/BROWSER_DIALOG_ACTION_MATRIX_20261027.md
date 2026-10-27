# Projekt C – Dialog-Aktionsmatrix bei echtem Chromium-Zoom

**Stand:** 27.10.2026 · **Basis:** PR #86, `01475e180b658ec5601fd8a5c33f78686ba38e6b` · **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360` · **Spiel:** PPPOPPI IMPERIUM, isolierte V1.9.4-Pruefschicht.

## Anlass und Umsetzung

Der vorherige [Teiltest](BROWSER_DIALOG_ACTIONS_20261027.md) aktiviert pro Szene nur den ersten Wirtschafts-Knopf. Der neue Test `test_browser_dialog_action_matrix_v194.py` erfasst alle 39 registrierten Spielszenen und testet **jede unterschiedliche, sichtbare, aktivierte Aktionskennung pro Szene** in einer jeweils frischen, isolierten Offline-Partie. Wiederholte Parameter (weitere Claims/Regionen) werden vorerst nicht als vollstaendig abgedeckt gezaehlt.

Das 800x600-Startfenster wird mittels `chrome.tabs.setZoom/getZoom` tatsaechlich auf 175 und 200 Prozent gezoomt. Jede Aktion wird mit Tab erreicht und per Enter ausgeloest; die Pruefung verlangt sichtbaren Fokus, genau einen vertrauenswuerdigen Klick, einen gueltigen Spielstand, keine JavaScript-Laufzeitfehler und keine externen HTTP-Anfragen. Fuer `SURVEY` und `END_TURN` werden fachliche Sollfolgen geprueft; fuer `PUMP`, `DRILL`, `PIPE_START` und `REFINERY_BUILD` wird die sichere Ablehnung im frischen Startzustand verlangt. Weitere Aktionsfolgen bleiben offen.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_dialog_action_matrix_v194.py`.

## Nachweisstatus

**Erster vollstaendiger GitHub-Lauf auf Test-HEAD `748a5735f9bc00f350d0bb3f65333d3667d8f35b`:**
- [Chromium #40513698535 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40513698535): bei **175 % und 200 %** je 39 Szenen, **37 verschiedene Szene/Aktions-Paare** aus **29 Aktionskennungen** per echter Tab-/Enter-Taste geprueft. Je Zoomstufe **2 Zustandsaenderungen und 35 unveraenderte Zustaende**, keine Laufzeit- oder externen HTTP-Fehler.
- [Quell-/Fachpruefung #40513698787 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40513698787).
- [Pflichtmatrix #40513698484 – Gesamtgate BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40513698484): erwartete harte Freigabesperre, kein technischer PASS.

Die **zwei positiven Sollfolgen** (`SURVEY`, `END_TURN`) und **vier negativen Sollfolgen** (`PUMP`, `DRILL`, `PIPE_START`, `REFINERY_BUILD`) wurden im frischen Ausgangszustand geprueft. Die anderen 35 unveraenderten Zustaende sind **keine** 35 fachlich nachgewiesenen Ablehnungen. [Maschinenlesbarer Teilnachweis](../prerelease/evidence/BED-02-DIALOG-MATRIX-PARTIAL-20261027.json). **Vorrelease-Matrix: weiterhin 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.** Die 110 manifestgeschuetzten Originaldateien bleiben unberuehrt. Nach diesem Dokumentations-Commit ist die CI auf dem finalen HEAD erneut zu kontrollieren.

## Grenzen / naechste Schritte

1. GitHub-CI und Testprotokolle auswerten, eventuelle Fehlannahmen im neuen Sollfolgenvertrag korrigieren.
2. Wiederholte Claims/Regionen und nach Zustandsaenderungen neu verfuegbare Aktionen mit weiteren fachlichen Sollfolgen abdecken.
3. Vollstaendige reguläre Sieg-/Niederlagenpartien mit Export, Neustart und Import pruefen; danach technische Restgates.

**Weiterfuehrende Empfehlung:** Jede Aktionskennung mit versionierten Vorbedingungen und konkreten erwarteten Zustandsdifferenzen verknuepfen. Das ist mehr als ein erfolgreicher Tastaturklick. Kein Merge, kein Release; persoenliche Endabnahme bleibt am Ende.
