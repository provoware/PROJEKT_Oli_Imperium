# Vorrelease: Dateiauswahl per Tastatur bei 175/200 % – alternativer Klickpfad (01.11.2026)

**Spiel:** PPPOPPI IMPERIUM, isolierter V1.9.4-Technikaufbau. **PR:** [#141](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/141). **Kein Merge / kein Release / keine persoenliche Abnahme.**

## Konkreter Ausgangsbefund

Der fruehere [Chromium-Lauf #41173320564](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41173320564) scheiterte im nativen 200-%-Dateiimport: Ein echter Tastatur-Klick auf den Import-Schalter wurde registriert; `showPicker()` wurde unter aktiver Nutzeraktivierung genau einmal aufgerufen und kehrte ohne Fehler zurueck. Trotzdem fehlte das Playwright-`filechooser`-Ereignis nach 5 Sekunden. Die 175-%-Probe war erfolgreich. **Die eigentliche Ursache ist damit noch nicht bewiesen.**

Auf dem vorherigen Integrations-HEAD `a72010aca145c279169b8a6f652cbe3aadd48216` sind [25/25 Workflows abgeschlossen](https://github.com/provoware/PROJEKT_Oli_Imperium/actions?query=sha%3Aa72010aca145c279169b8a6f652cbe3aadd48216): 24 SUCCESS und 1 erwartetes FAILURE der wirksamen Vorrelease-Sperre. Der [Chromium-Gesamtlauf #41265768461](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41265768461) hat 8/8 Jobs bestanden. Das ist ein erfolgreicher Stichprobenlauf, kein Beweis fuer dauerhaft stabile Dateiauswahl.

## Eng begrenzte Aenderung

- `quality_v194/build.cjs` verwendet beim **versionierten Sitzungsimport** jetzt `picker.click()` statt `picker.showPicker()` auf dem bereits vorhandenen versteckten `input[type=file]`. Der Klick erfolgt weiterhin **direkt innerhalb des echten Tastatur-/Schalterereignisses**, nicht nach einem Zeitgeber. Kein automatisches Oeffnen und keine Umgehung der Nutzerentscheidung.
- `quality_v194/test_browser_session_native_zoom_v194.py` verlangt weiterhin in **sechs unabhaengigen echten Chromium-Prozessen** bei 175/200 %: Tab-Fokus, sichtbaren Import-Schalter, ein echtes `filechooser`-Ereignis, explizite Dateiauswahl, identischen JSON-Spielstand, gueltigen Wirtschaftszustand und Offlinebetrieb. Neu wird exakt **ein Klick auf den Datei-Eingang bei aktiver Nutzeraktivierung**, ein vertrauenswuerdiger Schalterklick und **kein `showPicker()`-Aufruf** geprueft.
- **Fehler bleiben Fehler:** Kein Wiederholungsversuch nach fehlendem Picker, kein direktes Befuellen des Datei-Inputs als Ersatz, keine Lockerung von JSON-Validierung, Sicherheitsregeln oder CI-Gates.
- Geschuetzte Originaldateien unter `SPIEL/`, vorhandene Spielstaende, `main` und andere Repositories bleiben unberuehrt.

## Reproduzierbare Pruefungen

```bash
node --check project-c/pppoppi-imperium/quality_v194/build.cjs
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_session_native_zoom_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_session_native_zoom_v194.py
```

Der verpflichtende Workflow `.github/workflows/prerelease-browser-project-c.yml` fuehrt den sechsfachen echten Zoomtest im Job `native-zoom-regression` aus; die anderen sieben Browserjobs sowie alle Fach-/Quelltests bleiben unveraendert. Ein isolierter lokaler Chromium-Mechanismusversuch (CSS-Breite 457/400 statt echtem Tab-Zoom) zeigte fuer `showPicker` und `click` je 6/6 erfolgreiche Dateiauswahl-Ereignisse. **Das ist kein Nachweis fuer die eigentliche 175/200-%-Regression.** Entscheidend sind die neuen GitHub-Pruefungen auf dem endgueltigen Commit.

**Status beim Schreiben:** Implementierung eingereicht, **GitHub-CI auf endgueltigem Dokumentations-HEAD PENDING**. Keine vorweggenommene PASS-Aussage. Falls `filechooser` erneut ausbleibt, den protokollierten `SESSION-FILECHOOSER-FAIL`-Datensatz samt Kontrollpicker auswerten und die Aenderung gezielt korrigieren oder ruecknehmen.

## Pflichtmatrix / offene Arbeiten

Die vorhandene [52er-Pflichtmatrix](../prerelease/matrix.json) bleibt **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. `BED-03` (Zoom/Bedienung), `SPE-03` (Speicherung/Import), `SIC-02` (Integritaet) und `TES-04` (Gesamt-CI) bleiben **BLOCKED**. Die neue Dateiauswahl-Probe ersetzt weder komplette Endpartien, Vermoegens-/Forderungsbewertung, Rechteklaerung der 77 Archivmedien noch C64-Originalbelege.

**Naechste Schritte:** (1) aktuelle GitHub-CI auf dem finalen HEAD inklusive aller 8 Chromium-Jobs auswerten; (2) bei FAIL die native Dateiauswahl kausal nachbessern, bei PASS die Stabilitaet durch weitere unabhaengige Laeufe pruefen; (3) anschliessend natuerliche Vertrags-Zahlungskrisen bis zur Sanierung und Endwertung absichern. Persoenliche Kubuntu-/Sichtabnahme erst am vollstaendig technisch geprueften, eingefrorenen Vorrelease-Kandidaten.
