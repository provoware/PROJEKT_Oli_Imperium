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
- Vorrelease-Matrix nach QUE-02/03, TES-01/02 und BAL-02/03: **6/52 PASS**,
  davon 39 BLOCKED, 4 OPEN und
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


## 📘 Vorrelease-Hilfe · Dokumentations-Pflichtpaket vom 01.11.2026

Die zusammenhängende [Start-, Speicher-, Versions- und Fehleranleitung](DOKUMENTATION_GATES_20261101.md) stellt die drei offenen Dokumentationskriterien **DOK-01 bis DOK-03** nachvollziehbar zusammen. Sie enthält die tatsächlich vorhandenen Start-/Prüfbefehle und die ausdrücklichen Freigabegrenzen. **Weder ein erfolgreicher Dokumentenaufbau noch diese Anleitung allein ändern die Matrix auf PASS.**


## 240-Monats-Dateidialog – technischer Vorrelease-Pruefpfad (02.11.2026)

Der getrennte [Entwurf #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) prueft nun 240 Spielmonate bei **175 % und 200 % echtem Chromium-Zoom** mit je **zwei nativen, per Enter ausgeloesten Dateiauswahldialogen** nach getrennten Browserneustarts. Ein expliziter Zaehler prueft beide Importwege; ein Direktimport gilt nicht als bestandener nativer Dialog. Siehe [Pflichtbericht](NATIVE_IMPORT_240_LONGRUN_20261102.md) und [offene TODO](TODO.md).

**Ausgangsstand:** [CI #41372928433](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41372928433) war auf HEAD `f1809af62782e432f6025dad9d1e6f37533f0ba4` fuer die bisherigen 12 Kampagnenjobs gruen, einschliesslich beider 120-Monats-Dateidialogjobs. **Die neuen 240-Monats-Dateidialogjobs benoetigen eigene aktuelle CI-Belege; bis dahin PENDING.** Die Pflichtmatrix bleibt 6/52 PASS, die persoenliche Endabnahme bleibt zurueckgestellt. Kein Merge, kein Release.


## Echte Tab-Navigation bei 175/200 % – Teilprüfung vom 02.11.2026

[CI #41378517223](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41378517223) auf HEAD `3dde8c40f562c2fc6d396e68c1edde3642e2700a`: **14/14 Jobs PASS**, darunter beide 240-Monats-Dateidialogprüfungen mit je zwei bestätigten nativen Importen. Der [neue Tab-Prüfbericht](KEYBOARD_TAB_CAMPAIGN_20261102.md) ergänzt unabhängige 120-Monats-Jobs bei 175/200 %: 14 Schlüsselkontrollen werden ausschließlich per Tab angesteuert, inklusive Start, Monatswechsel, Export und zweimaligem Import. **Neue Prüfungen noch PENDING**, vollständige Tab-Reihenfolge sämtlicher Szenen weiterhin offen. Die 6/52-Gesamtmatrix bleibt unverändert; kein Merge, keine Endabnahme, kein Release.

## Rueckwaerts-Tab-Navigation – neues Teilpaket (02.11.2026)

Die [Rueckwaerts-Tab-Kampagne](REVERSE_TAB_CAMPAIGN_20261102.md) ergaenzt bei 175/200 % Zoom fuer 14 ausgewaehlte Kontrollen echte `Shift+Tab`- und `Tab`-Rueckwege mit sichtbarem Fokus, bevor Enter ausgeloest wird. Sechs isolierte Regressionen **6/6 PASS**, Syntax **PASS**. Die neuen Browserjobs sind bis zur erfolgreichen Ausfuehrung auf finalem HEAD **PENDING**. Die vorherige [CI #41389498165](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41389498165) auf `c7c1b9ad` war **16/16 SUCCESS**; sie ist kein Nachweis fuer das neue Paket. Gesamtmatrix weiterhin **6/52 PASS**; keine vollstaendige Tastatur- oder Releasefreigabe.


## Tastatur-Geometrie bei 175/200 % – CI-Korrekturlauf (02.11.2026)

[CI #41400850616](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41400850616) auf `a820507d` endete mit **14 PASS / 4 FAIL**: die vier Tastatur-Langläufer scheiterten an `#startGame` außerhalb des sichtbaren Fensters. Die Prüfschicht wartet jetzt bei diesem Zustand höchstens 3 Sekunden auf den natürlichen, animierten Browserbildlauf und prüft danach unverändert streng. Keine künstliche Fokussetzung, kein Scroll-Befehl, keine Änderung am Spielkern. Die Wirksamkeit muss die neue GitHub-CI erst bestätigen; siehe [Fehlerbericht](KEYBOARD_TARGET_OCCLUSION_20261102.md). Vorrelease bleibt **BLOCKED**.
