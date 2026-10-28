# Vorrelease-Teilpaket: Sitzung bei echtem 175/200-%-Browserzoom

**Datum:** 28.10.2026. **Ausgangsbasis:** PR #116, `e1db99b54fe80b9e29e1012438f713bcc5d81999`. **main vor Bearbeitung:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Zweig:** `automation/prerelease-session-native-zoom-20261028-1932`.

## Anlass und Schutzgrenzen

Der vorhandene Sitzungsimport/Export ist bereits auf 800×600 sowie auf beschädigte, übergroße und verspätete Dateien geprüft. Für die **neuen Sitzungs-Schalter** fehlte jedoch ein eigener Bedienpfad bei **echtem Chromium-Tab-Zoom** (nicht bloß verkleinertem CSS-Viewport). Die Änderung beschränkt sich auf ein neues Testskript und dessen separaten CI-Schritt. Die 110 manifestgebundenen Originaldateien, die Spielregeln und das Freigabegate bleiben unangetastet.

## Reproduzierbarer Pflichtteiltest

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_session_native_zoom_v194.py
```

Der Test baut die abgeleitete Offline-Technikfassung mit SHA-256-Prüfung, startet Chromium mit temporärer MV3-Zoom-Erweiterung und setzt **175 % und 200 % über `chrome.tabs.setZoom`**. Pro Zoomstufe: Start per Tab/Enter; Spielart per Pfeiltaste auf 12-Monats-Kampagne; Start per Tab/Enter; Sitzung über sichtbaren Schalter mit Tab/Enter exportieren; 24-Monats-Kampagne starten; Import-Schalter per Tab/Enter mit echtem Datei-Auswahldialog auslösen; vorhandene Sitzung nach Bestätigung wiederherstellen. Kontrolliert werden Schema, Vertrag, identischer Wirtschaftszustand, Tastaturfokus, horizontale Schalter-Treffbarkeit, Spielkernvalidierung, fehlende Laufzeitfehler und Offlinebetrieb. Fehlende Zoom-Erweiterung, nicht erreichbare Schalter oder Fehler sind echte FAILs, keine stillen Überspringer.

**Prüfstatus beim Anlegen:** GitHub-CI für diesen neuen Zweig noch ausstehend, daher **PENDING**, nicht PASS. Das vollständige Vorrelease-Gate bleibt **BLOCKED**. Bereits abgeschlossene Basis-CI auf PR #116: [Browser #40736943250](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40736943250) PASS (5/5 Jobs); [Quellprüfung #40736943257](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40736943257) PASS; [Gesamtgate #40736943507](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40736943507) BLOCKED.

## Abgrenzung und nächste Pflichtarbeit

Dieser Test ist ein **Teilnachweis** für `BED-02`, `BED-03`, `SPE-03` und `SIC-02`. Er beweist weder die vollständige Bildschirmfreiheit von Überläufen noch vollständige Sieg-/Niederlagenpartien, Langzeitbalance, historischen C64-Abgleich oder persönliche Kubuntu-Sichtabnahme. **Matrix unverändert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.**

1. Neue GitHub-CI auf finalem Zweig-HEAD vollständig auswerten und echte Fehler beheben.
2. Den dokumentierten Teilnachweis erst nach erfolgreicher CI in der Matrix referenzieren.
3. Anschließend eine echte Kampagne bis zum Schlussbericht mit Export/Import und vollständiger Endwertung automatisieren.

**Kein Merge, kein Release, keine Nutzer-Endabnahme vor eingefrorenem und technisch geprüftem Kandidaten.**
