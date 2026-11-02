# Vorrelease-Pflichtpaket: strenge Tastaturaktivierung in drei Minispielen (02.11.2026)

**Spiel:** PPPOPPI IMPERIUM, technische V1.9.4-Pruefschicht. **PR:** [#155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Ausgangs-HEAD:** `8a48e4ecaf73833d05f83c1e7e10be19f66f55e9`. **Zwischen-HEAD nach Code und CI:** `d405fe4e3df7801912d9b09577c3ef828588274c`.

## Ursache und Umsetzung

Die gemeinsamen Tastaturhelfer fuer Bohrspiel, Rohrnetz und Feuerwehr kontrollierten bisher lediglich die Erreichbarkeit per Tab und `:focus-visible`. Damit konnte Enter auch bei fehlender **berechneter CSS-Fokusmarkierung**, verdecktem Ziel oder Fokusverlust nach dem Scrollen ausgefuehrt werden. Die beiden bestehenden Aktivierungshelfer nutzen nun die schon vorhandenen, separat geprueften Funktionen `assert_computed_focus_indicator` und `press_tab_focused`. Die letzte Funktion kontrolliert den realen Fokus, die Trefferflaeche und den Fokus unmittelbar vor Enter erneut; sie darf nur dann Enter ausloesen. Keine kuenstliche Fokussetzung, kein JavaScript-Klick, kein Eingriff in Spielkern, Spielstandformat oder die 110 geschuetzten Originaldateien.

**Betroffene Dateien:** `test_browser_keyboard_drill_v194.py`, `test_browser_keyboard_pipe_fire_v194.py`, `test_minigame_keyboard_gate_v194.py` und `.github/workflows/prerelease-campaign-pipe-fire.yml`.

## Nachweise und Grenzen

- Zehn neue isolierte Negativ-/Vertragstests: je Minispielhelfer Erfolgspfad, unerreichbares Ziel, fehlender sichtbarer Fokus, fehlender berechneter Fokusring und Verdeckung/Fokusverlust. Sie sind als Pflichtschritt vor dem bestehenden Browser-Kampagnentest eingetragen.
- Bereits **vor diesem Patch** verifiziert: [Kopfzeilen-CI #41465081095](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41465081095) **3/3 SUCCESS** und [Browserprojekt-CI #41465080900](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41465080900) **9/9 SUCCESS**. Diese Nachweise gelten **nicht automatisch** fuer den neuen HEAD.
- **Neue isolierte Tests und neue Browser-CI: PENDING**, bis die GitHub-Pruefungen des abschliessenden Commit-HEAD tatsaechlich beendet sind. Kein PASS ohne Laufnachweis.
- Auch mit gruenen Tests bleibt dies nur ein Teilnachweis: komplette Aktionsvarianten, alle Fehler- und Rueckkehrpfade, fachliche Spielbalance, Leistung, Originalvergleich und Rechtepruefung sind nicht freigegeben.

**Vorrelease-Pflichtmatrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. **Kein Merge, kein Release, keine persoenliche Sicht-/Kubuntu-Abnahme.**

**Naechste Schritte:** (1) zehn neue Regressionen und betroffene Browserjobs auf dem finalen HEAD auswerten; (2) bei realen Fokus-/Treffbarkeitsfehlern die betroffene Darstellung korrigieren, nicht die Pruefung abschwaechen; (3) dynamische Minispiel-Regler und weitere Claim-/Regionsvarianten einschliesslich fachlicher Sollfolgen vervollstaendigen.
