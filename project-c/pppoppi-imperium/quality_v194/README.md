# PPPOPPI IMPERIUM – technische Fortsetzung nach V1.9.4

**Kein Release und keine persönliche Sichtabnahme.** Der hier beschriebene
Aufbau ist eine reproduzierbare, technisch korrigierte Vorschau des
**V1.9.3-Spielkerns mit V1.9.4-Prüfschicht**.

## Warum ein gesonderter Aufbau?

Die 110 aus dem Original-ZIP geretteten Dateien im Ordner `SPIEL/` sind
über das Manifest und feste SHA-256-Werte gegen Veränderungen geschützt.
Sie direkt zu bearbeiten würde den unabhängig geprüften Herkunftsnachweis
zerstören. Deshalb bleiben sie byteidentisch.

`build.cjs` prüft alle 110 Dateihashes, übernimmt ausschließlich die
freigegebenen Quelldateien und trägt vier gezielte Korrekturen **in einem
neuen Zielordner** auf:

1. `index.html`: eindeutige Anzeige für Spielkern V1.9.3 und Prüfstand V1.9.4.
2. `src/neo_bridge.js`: widerspruchsfreie Raffinerie-Erklärung und separat
   auslesbare Spiel-/Prüfversion; die historische Adapterkennung bleibt erhalten.
3. `README_START.txt`: aktuelle Versionsangabe und korrekte Hinweise auf die
   im öffentlichen Quellzweig fehlenden Bild- und Vergleichsarchive.
4. `test_human_parity_v192.cjs`: blockierte, leere oder abgebrochene
   Vergleichs-Unterprozesse können nicht länger fälschlich PASS melden.

Die **Wirtschaftsregeln, KI und gespeicherten Spielstandschemas** werden
dadurch nicht geändert.

## Prüfen (aus der Repository-Wurzel)

```bash
python3 project-c/pppoppi-imperium/recovery/verify_sources.py
node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_gameflow_v194.cjs
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

Die beiden neuen Tests prüfen 10 statische UI-Verträge und 8 technische
Spielabläufe: Start, Förderkette, Angebot, Monatswechsel, KI, JSON-Roundtrip,
ungültigen Spielstand, zwei menschliche Firmen, drei Minispiele und
zwölf zusätzliche Monate. **Ein DOM-/Browser-Live-Test ist das nicht.**

## Technikfassung erzeugen

```bash
node project-c/pppoppi-imperium/quality_v194/build.cjs ./PPPOPPI_IMPERIUM_V194_TECH
```

Der Zielordner darf **noch nicht existieren**; bestehende Dateien werden
nicht überschrieben. Danach befindet sich die eigenständige Offline-Datei
unter `PPPOPPI_IMPERIUM_V194_TECH/index.html`.
Die erzeugte `BUILD_INFO.json` hält die Herkunft und die vier
überlagerten Quelldateien fest. Ohne Node.js wird für den **späteren
Spielstart** nichts benötigt; Node.js ist nur zum Erzeugen der Fassung nötig.

## Ehrlicher Freigabestand

- Quelloriginale unverändert: **110/110**.
- Zusätzliche lokale Technikprüfungen: **18/18 PASS**.
- GitHub-CI muss dieselben Prüfungen am neuen Commit wiederholen.
- Vorrelease-Matrix nach QUE-02/03, TES-01/02, BAL-02/03 und WIR-01/02:
  **8/52 PASS**, davon 37 BLOCKED, 4 OPEN und
  3 persönliche Prüfungen DEFERRED.
- Die 77 ausgeschlossenen Archivdateien (73 PNG, 2 PDF, 1 ZIP, 1 TXT)
  bleiben außerhalb des Quellzweigs; keine ist eine in `index.html`
  referenzierte Laufzeitdatei.
- Browser, 800×600, vergrößerte Darstellung, vollständige menschliche
  Partien, Leistungsmessung und persönliche Kubuntu-Abnahme sind weiter offen.
- Deine **Sichtprüfung findet erst nach den technischen Abnahmen** statt.

Der echte Vergleich mit dem historischen C64-Original bleibt ein getrenntes,
nicht abgeschlossenes Forschungsziel. Keine automatische Zusammenführung
nach `main`, kein Release.
