# MV3-Zoom-Serviceworker: Startabfrage ohne Ereignis-Rennen (28.10.2026)

## Ausgangslage
[Browser-CI #40609444650](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40609444650) brach vor den 216 Feldauswahlen nach 15 Sekunden ohne Serviceworker-Ereignis ab; [Browser-CI #40610131916](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40610131916) war spaeter gruen. Die bisherige Abfrage pruefte erst `context.service_workers` und registrierte erst danach einen Ereignislistener. Dazwischen eintreffende Ereignisse koennen verloren gehen. Plausible Ursache, nicht abschliessend bewiesen.

## Aenderung
- Neue zentrale Funktion `wait_for_zoom_worker`: Workerliste erneut pruefen, dazwischen auf Ereignis warten; keine unbemerkte Luecke zwischen Abfrage und Listener.
- Harte Frist 15 Sekunden, keine Browserneustarts, keine erneuten Spieltests, fehlende Erweiterung bleibt FAIL mit Diagnose der bekannten Worker.
- API `chrome.tabs.setZoom` muss tatsaechlich bereitstehen.
- Elf Zoom-Pruefprogramme werden auf dieselbe Startabfrage umgestellt. Keine Original-Spielquellen, keine A/B-Regeln oder Top-5-Projekte geaendert.

## Testplan und Nachweis
- Isolierte lokale Python-Regression: Ereignisluecke, fehlender Worker und fehlende Zoom-API: **3/3 PASS**; `py_compile` **PASS**. Dies ist kein Chromium-Nachweis.
- GitHub-Quellpruefung und vier Chromium-Jobs auf finalem Commit: **PENDING**.
- BED-02, BED-03, STA-03, TES-03 und Gesamtgate bleiben **BLOCKED**, auch wenn Teiltests gruen sind.

- Automatisierte Regression `test_zoom_worker_wait_v194.py` wird vor dem 216-Auswahl-Test in GitHub Actions ausgefuehrt; ihr CI-Ergebnis ist bis zum Lauf **PENDING**.

## Naechste drei Schritte
1. Neue CI pruefen und bei Fehler die Worker-Diagnose auswerten, nicht blind wiederholen.
2. Vertragsbruch, Notverkauf und Sanierungsgenerationen mit Export/Import testen.
3. Endregelvertrag und komplette Sieg-/Niederlagenpartien absichern.

**Empfehlung:** Einzelne gruene Laeufe beweisen noch keine dauerhafte Beseitigung eines sporadischen Startfehlers.
