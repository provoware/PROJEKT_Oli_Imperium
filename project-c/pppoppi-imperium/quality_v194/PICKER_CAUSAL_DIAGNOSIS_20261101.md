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

## Gezielte Ursachenprüfung: Interception vor Tastendruck bestätigen

Lokaler Kontrollversuch mit Playwright 1.56.0 und Chromium Headless Shell 141.0.7390.37: drei Methoden, acht frische Browserprozesse je Methode und Arm, insgesamt 48. Unverändert 23/24 erfolgreich; bestätigte Überwachung 24/24. Keine Wiederholung eines fehlgeschlagenen Versuchs. Diese lokale Teilprüfung besitzt keinen echten Tab-Zoom; sie ersetzt den GitHub-Vergleich nicht. Der vollständige persistente Chromium-Prozess ist in der lokalen Umgebung wegen nicht erlaubter Unix-Sockets nicht startfähig.

Der fehlgeschlagene showPicker-Versuch protokolliert: `Page.setInterceptFileChooserDialog` SEND id=32 um 03:23:40.339; Enter SEND id=33 um .340; Enter ACK um .341 **vor** Interception ACK id=32 um .341; kein `Page.fileChooserOpened` bis Timeout. Vertrauenswürdiger Klick und aktive Nutzerinteraktion vorhanden. Der unmittelbar geplante Kontrollarm wartet zuerst auf die Bestätigung des bestehenden Playwright-Dispatchers und empfängt das echte Dateiauswahlereignis. Eine bloße längere Wartezeit wird nicht als Reparatur verwendet.

Quellbefund aus dem unveränderten Playwright-1.56.0-Paket: Python `_connection.py::_update_subscription` sendet `updateSubscription` über `send_no_reply`; der Server `pageDispatcher.js::updateSubscription` wartet intern auf `setFileChooserInterceptedBy`. Tastaturbefehle sind dadurch nicht automatisch hinter dieser Browserbestätigung gesperrt. Dies ist ein nachgewiesener zeitlicher Fehlerpfad der lokalen Testansteuerung, noch kein Nachweis für jeden bisherigen GitHub-Fehler oder einen behobenen Spielimport.

Der bestehende Anzeigevergleich prüft nun vier getrennte Arme: sichtbar/headless jeweils unverändert/bestätigt, mit 48 echten 175/200-%-Tastaturversuchen pro Arm. JSON und unveränderte CDP-Protokolle werden immer gesichert. `PPPOPPI_PICKER_ACKNOWLEDGED=1` nutzt ausdrücklich nur für die Diagnose eine private SDK-Schnittstelle; sie ist **kein Produktfix**. Keine direkte Eingabefeldbefüllung, kein übersprungener Fehlversuch, kein zweiter Öffnungsversuch. Die normalen Diagnosearme bleiben unverändert und dürfen weiterhin rot werden.

Status vor GitHub-Auswertung: lokaler zeitlicher Fehlerpfad reproduziert, Bestätigungsarm in der lokalen Stichprobe erfolgreich; reale Zoom-/Anzeige-Gegenprobe ausstehend. Spielquellen, `main`, Speicherformat und Freigabematrix unverändert.

### Absichtliche Fehlerprobe und erster GitHub-Abgleich

Isolierte lokale SDK-Fehler-Injektion: 100 ms Verzögerung ausschließlich vor dem Aktivieren der Überwachung. Standardarm 6/6 erwartete Fehlversuche; bestätigter Arm 6/6 echte Öffnungsereignisse. Das SDK wurde anschließend byteidentisch wiederhergestellt (SHA-256 der unveränderten `crPage.js`: `79a25e4eac0d0fa97dcc6eae4edce83436bcdb4bb1322731f65610adaa8e150f`). Keine Änderung dieses SDK gehört zum Repository oder Produkt.

GitHub-Anzeigevergleich #41269234234 auf `f090657d05901dff6a422ded3febd377bbb5f2da`: bestätigter Headless-Arm 48/48, bestätigter sichtbarer Arm 48/48. Der sichtbare Arm scheiterte anschließend zu Recht an der Protokollzuordnung: `xvfb-run` führt den Kindprozess mit `2>&1` aus, daher war die außerhalb umgeleitete Rohprotokolldatei leer. Der Workflow legt die Umleitung jetzt innerhalb des Kindprozesses an. Der neue sichtbare Vergleich muss vollständig neu ausgewertet werden; der rote Auswertungsstand wird nicht als Gesamt-PASS ausgegeben.

## Begrenzte Korrektur des Prüfhelfers

Basis ist der aktuelle #141-Zielstand `ad7e65856cb72f621a4edc5c49e6a90556ff8aed`, einschließlich seines bereits vorhandenen `input.click()`-Importpfads. Diese Änderung wird als unveränderte Basis übernommen; die eigene Korrektur verändert keinen Produktpfad.

`native_filechooser_v194.py` kapselt die notwendige private Bereitschaftsbestätigung für die kanonisch installierte Playwright-Version **1.56.0**. Unbekannte Version, fehlende Schnittstelle, bestehende fremde Anmeldung, geschlossene Seite, Fehler oder Zeitüberschreitung verhindern die Nutzereingabe. Ein dauerhaft angemeldeter öffentlicher Beobachter bleibt bis zum Schließen der Seite erhalten. Dadurch können vorübergehende Ereignis-Warter die Browserüberwachung nicht zwischen zwei Importen abschalten. Kein Eingabefeld-Ersatz, keine Wiederholung und keine Änderung eines fehlgeschlagenen Ergebnisses.

Sieben lokale Bereitschafts-/Fehler-/Versionsprüfungen bestanden. Zusätzlich 12 echte Dateiauswahlereignisse mit unverändertem Timing und 12 unter absichtlich um 100 ms verzögerter Aktivierung, jeweils einschließlich einer zweiten Auswahl auf derselben Seite. Die isolierte Testbibliothek wurde byteidentisch wiederhergestellt. Dies sind lokale Kontrollseiten ohne echten Tab-Zoom, keine Spielimporte.

Der bestehende Spieltest nutzt nun denselben Helfer. Nach erfolgreicher nativer Auswahl und identischer Wiederherstellung einer exportierten 12-Monats-Sitzung muss ein zweiter echter Dateidialog eine absichtlich beschädigte Sitzung auswählen: Zustand und Vertrag müssen unverändert bleiben, die Exportdatei byteidentisch. Zwei unabhängige GitHub-Aufträge führen jeweils drei frische 175-/200-%-Messpaare auf demselben Code aus. Pro Auftrag: sechs gültige Wiederherstellungen plus sechs strikte Ablehnungen. Der GitHub-Abschluss steht vor Freigabe aus; die Matrix bleibt unverändert gesperrt.
