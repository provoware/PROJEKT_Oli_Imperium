# Projekt C – Tastatur-Schliesswege aller Spielszenen (26.10.2026)

## Nachgewiesene Ausgangsbasis
- Entwurfs-PR #67, HEAD f83589ccbe09a4d73615e2db76d99acdd42919f3; gestapelt auf PR #66.
- main bei Vorpruefung d3dc371154cc1089e06f34d0dc4ff04047132360.
- Chromium-CI #40379277388: PASS; Quell-/Fach-CI #40379277328: PASS; Gesamtmatrix #40379277221: BLOCKED.
- Links: https://github.com/provoware/PROJEKT_Oli_Imperium/pull/67 und https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40379277388

## Umsetzung – Teilnachweis BED-02 / BAR-01
Neues Chromium-Pruefprogramm: quality_v194/test_browser_keyboard_scenes_v194.py

- Erzeugt die Technikfassung ausschliesslich in einem geloeschten Temp-Verzeichnis; die 110 verifizierten Originaldateien bleiben unveraendert.
- Startet das Offline-Spiel und eine neue Partie mit echten Tab-/Enter-Tastendruecken.
- Oeffnet alle registrierten Szenen ueber die bestehende Navigationsschnittstelle. Prueft pro Szene den Schliessenknopf ausschliesslich mit echten Tab-Tastendruecken, den Status :focus-visible und das Schliessen per Enter.
- Prueft, dass diese Navigationswege den Spielstand nicht veraendern.
- Prueft Alt+Pfeil links (Markt zu Computer), Tab/Enter zur Uebersicht und Umschalt+Tab/Enter zum Buero.
- Wiederholt in 800x600 sowie CSS-Viewports 457x343 und 400x300; prueft JavaScript-Fehler und externe Netzwerkanfragen.
- Gibt je Viewport ein KEYBOARD-AUDIT aus. Die Anzahl sichtbarer Umrisse/Schatten ist nur eine Diagnose, kein Nachweis ausreichender Kontraste.

## Klare Grenzen
Die Szenen werden fuer die Schliesspruefung programmatisch geoeffnet; nicht alle Spielaktionen sind per Tastatur nachgewiesen. Die beiden kleineren CSS-Viewports ersetzen keinen nativen Browserzoom. Der Fokus-Pseudostatus allein beweist keine ausreichend sichtbare Fokusmarkierung. BED-02, BED-03, BAR-01, GRA-03 und FRE-01 bleiben BLOCKED.

## Ausfuehrung
python3 project-c/pppoppi-imperium/quality_v194/test_browser_keyboard_scenes_v194.py

Der Test ist in .github/workflows/prerelease-browser-project-c.yml aufgenommen. Nur abgeschlossene GitHub-CI auf dem finalen HEAD zaehlt als PASS/FAIL. Kein Test wird vor Ausfuehrung als bestanden behauptet.

Pflichtmatrix weiterhin: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.

## Naechste drei Pflichtschritte
1. Chromium-CI auf dem finalen HEAD pruefen, Fehler beheben, Fokusdiagnose auswerten.
2. Fehlende Tastaturwege in Dialogen und Minispielen sowie echten nativen Browserzoom pruefen und in der getrennten Technikfassung gezielt korrigieren.
3. Fachliche Spielende-Regeln der eigenstaendigen Adaption vervollstaendigen; erst danach Sieg-/Endpfade und Spielstand-Roundtrip implementieren.

Kein Merge, kein Release. Persoenliche Sichtpruefung und Kubuntu-Endabnahme erst nach allen technischen Pflichtgates und eingefrorenem Kandidaten.
