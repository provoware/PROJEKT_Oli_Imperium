# Diagnose des sporadischen Chromium-Dateidialogs – 01.11.2026

**Ermittlungsauftrag:** Unabhängig voneinander prüfen, ob der sporadisch ausbleibende native Datei-Auswahldialog aus dem Spielcode, der JavaScript-Methode oder der Chromium-/Playwright-Testumgebung stammt. **Keine Spieländerung und keine Behauptung einer reparierten Importfunktion.**

## Belegter Fehler
Auf dem OLI-Prüfstand `13f0564a7cc64dc70c12db209c15ee254608c308` scheiterte GitHub-Actions [#41262091678, Versuch 1](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41262091678) im Auftrag `native-zoom-regression` bei 200 %: Ein echter Tastendruck auf den fokussierten Importknopf löste den vertrauenswürdigen Klick aus. `showPicker()` wurde bei aktiver Nutzerinteraktion einmal aufgerufen und kehrte ohne JavaScript-Fehler zurück. Das benötigte native `filechooser`-Ereignis blieb 5 Sekunden lang aus. Ein separater Kontroll-Picker ließ sich anschließend öffnen. **Kein Spielstand wurde dabei als erfolgreich importiert ausgegeben.**

**Diagnostische Wiederholung:** Auf demselben Commit bestand Versuch 2 denselben Browserworkflow mit allen acht Aufträgen und sechs getrennten nativen Zoom-Versuchen. Das beseitigt den ursprünglichen Fehler nicht.

## A/B-Protokoll
`diagnose_native_picker_strategies_v194.py` erzeugt eine minimale unabhängige **lokale HTML-Seite**, ohne Spielcode oder Spielstanddateien. Für **jede** der drei Methoden `showPicker()` am verborgenen Datei-Eingang, `input.click()` am verborgenen Datei-Eingang und **direkte Eingabetaste auf einem sichtbaren Dateieingang** führt der Test bei **175 % und 200 % echtem Chromium-Tab-Zoom** je vier eigenständige Browserprozesse und Profile aus: **24 einzelne Dateiauswahlen**.

- Alle Öffnungen nur über `page.keyboard.press('Enter')` mit tatsächlich fokussierter Steuerung und vorgeschaltetem `page.expect_file_chooser`.
- Keine direkte `set_input_files`-Befüllung, kein Test-Skip, keine zweite Eingabe zur Korrektur eines fehlgeschlagenen Versuchs.
- Jeder Versuch protokolliert Fokus, echte Browser-Zoomstufe, Klickvertrauen/Nutzeraktivierung, JavaScript-Ausnahmen, nativen Dateiauswahldialog und Fehler.
- Einzelresultate plus Statistik in `native_picker_diagnostic.json`; GitHub lädt dieses Dokument **auch bei Fehlschlag** als Prüfartefakt hoch.
- Ein ausgebliebener Datei-Auswahldialog führt zur **roten Diagnose-CI**, nicht zu einer fälschlichen Freigabe.

### Kontrollversuch außerhalb des Repositories
Ein lokaler, deutlich vereinfachter Chromium-/Playwright-Kurztest ohne echten Tab-Zoom zeigte bei 20 Versuchen **je einen ausbleibenden Dialog** für `showPicker()`, `input.click()` und direkt fokussiertes Datei-Eingabefeld. **Begrenzt aussagefähig:** Andere Python-/Chromium-Umgebung, kein exakter GitHub-Runner und kein realer 175/200%-Tab-Zoom. Der Vergleich rechtfertigt **noch keinen Umbau des Spielimportes**.

## Entscheidungskriterium
Nur wenn reproduzierbare, getrennte Läufe einen stabilen Unterschied zeigen, folgt ein **minimaler gezielter Codefix** des abgeleiteten Technikaufbaus. **Danach** mindestens sechs native 175/200-%-Importversuche über echte Tastatur, identische Spielstände, Save-Sicherheit, mehrfache unabhängige CI und Gesamtgates. Ein Erfolg der isolierten Kontrollseite ist **kein** Spielimport-PASS.

**Freigabe:** #141/#150 bleiben DRAFT, 52er-Matrix unverändert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Keine Änderung an Originalquellen, Spielregeln, Save-Schema, `main` oder Release.
