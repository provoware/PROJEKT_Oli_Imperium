# Vorrelease: native Datei-Auswahl bei 175/200 % stabil untersuchen (29.10.2026)

**Spiel:** PPPOPPI IMPERIUM V1.9.4 (Projekt C). **Entwicklungszweig:** `automation/v194-ai-logistics-reserve-20261029-1530`, bestehender [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137). **main vor Änderung:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Teständerung:** Commit [`57a7e846e2219f295854f3041cc747d2f56fddd6`](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/57a7e846e2219f295854f3041cc747d2f56fddd6).

## Ausgangsbefund (echter CI-Fehler)

[GitHub-Browser-CI #40924416180](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40924416180) auf `8d0f7229c5c35b1714c8f6bd5490219f46d49480`: **FAIL** im Auftrag `native-zoom-regression`, Schritt `Sitzungsimport und -export per Tastatur bei echtem 175/200-Prozent-Zoom`. Bei 175 % funktionierten Tab/Enter, nativer Dateidialog, Export und identischer Import vollständig. Bei 200 % waren Start, Export, Neustart, Import-Schalter, Tab-Fokus und Sichtbarkeit erfolgreich; **das erwartete Playwright-Ereignis `filechooser` erschien binnen 5 Sekunden nicht**. Die sieben anderen Browseraufträge dieses Laufs waren PASS. Damit ist der 200-%-Dateiimport in diesem Lauf **nicht nachgewiesen**.

## Kleine, überprüfbare Testkorrektur

Der vorherige Test nutzte für beide Zoomstufen **denselben persistenten Chromium-Prozess** mit nur einer neuen Registerkarte. Der neue Test startet **für jede Zoomstufe einen eigenen Chromium-Prozess mit getrenntem temporärem Profil**, weiterhin mit echter `chrome.tabs.setZoom/getZoom`-Erweiterung und unverändertem 800×600-Viewport. Dadurch wird ein möglicher Übertrag von Browserzustand und Dateidialog-Zustand aus der ersten Messung ausgeschlossen; ob das die Ursache des Fehlers war, ist noch **nicht bewiesen**.

Bei erneutem Dateidialog-Timeout protokolliert der Test die tatsächlich empfangenen Klicks, den aktiven Fokus, den Dialogstatus und den Zustand der Datei-Eingaben als `SESSION-FILECHOOSER-FAIL`. Der Test bleibt dann **FAIL**: keine Wiederholung, kein programmgesteuertes Ersatzbefüllen eines versteckten Datei-Inputs, keine künstliche Erfolgsmeldung. Die beiden Zoomstufen müssen weiterhin jeweils einen **echten, per Tab/Enter geöffneten** Datei-Auswahldialog, den identischen Spielstand nach Import, einen gültigen Wirtschaftszustand und Offlinebetrieb belegen.

## Reproduktion

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_session_native_zoom_v194.py
```

GitHub führt diesen Schritt im Auftrag `native-zoom-regression` aus `.github/workflows/prerelease-browser-project-c.yml` aus. **Bei Dokumentationserstellung: CI auf neuem HEAD PENDING**; eine erfolgreiche Quelländerung ist kein Test-PASS. Ein einzelner erfolgreicher Lauf belegt auch noch keine dauerhafte Beseitigung eines sporadischen Fehlers. Für eine Stabilitätsaussage sind mehrere getrennte Wiederholungen auf demselben unveränderten HEAD nötig.

## Pflichtmatrix und weitere Arbeit

**Unverändert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.** Betroffen sind die technischen Teilnachweise für `BED-02`, `BED-03`, `SPE-03`, `SIC-02` und das gesamte CI-Gate `TES-04`; keines wird allein durch diese Änderung freigegeben. Die 110 manifestgeschützten Originaldateien, Spielregeln und gespeicherten Spielstände wurden nicht verändert.

1. GitHub-CI auf dem finalen HEAD kontrollieren; bei erneutem FAIL die protokollierten Klick-/Fokus-/Datei-Eingabe-Werte auswerten und die Ursache gezielt beheben.
2. Nach erfolgreichem Lauf den nativen Zoomtest ohne Codeänderung wiederholen und den Nachweis mit exaktem HEAD und CI-Links dokumentieren.
3. Anschließend strategischen und logistischen KI-Reihenfolgeeffekt getrennt untersuchen; Rechteprüfung der 77 ausgeschlossenen Dateien und C64-Originalreferenz bleiben gesondert offen.

**Kein Merge, kein Release, keine persönliche Kubuntu- oder Sichtabnahme vor vollständig grünem, eingefrorenem Kandidaten.**

## Zusatzprüfung – sechs unabhängige Browserläufe (29.10.2026)

**Anlass:** Der native Datei-Auswahldialog ist sporadisch ausgeblieben, obwohl der Import-Schalter sichtbar, fokussiert und per Tab erreichbar war. Die letzte vollständige [Browser-CI #40943032463](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40943032463) auf `b6f46d4bad8fc1c2de041a257c10942e795088f9` ist inzwischen in allen acht Aufträgen **PASS**; dies beweist keine dauerhafte Fehlerfreiheit.

**Neuer, enger Pflichtversuch:** Der vorhandene echte Chromium-Tastaturtest durchläuft nun **drei vollständige Paare 175 % / 200 %**, also sechs unabhängige Browserprozesse mit sechs eigenen Profilen, jeweils neu gestarteter 12-/24-Monats-Partie, echtem Tab/Enter, nativem Datei-Auswahldialog, JSON-Import, exakter Spielstandsgleichheit und Offlinekontrolle. Bei jedem fehlgeschlagenen Einzelversuch stoppt der Test sofort mit **FAIL**; keine automatische Wiederholung, kein Ersatz durch direktes Befüllen des Datei-Inputs. Die zusätzliche Diagnose erfasst getrennt die Anzahl der Schalterklicks, die Klickereignisse am verborgenen Datei-Eingang, die Nutzeraktivierung beim Datei-Eingangsklick, dessen `isTrusted`-Kennzeichen und die Toast-Meldung. So lässt sich bei erneutem Timeout unterscheiden, ob die Ereigniskette vor dem Eingabefeld abreißt oder der Browser trotz ausgelöstem Dateieingang keinen Dialog öffnet.

**Reproduktion:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_session_native_zoom_v194.py` (benötigt Playwright/Chromium). Der vorhandene Workflow `.github/workflows/prerelease-browser-project-c.yml` führt genau diesen Test im Auftrag `native-zoom-regression` aus. **CI-Status dieser Änderung: PENDING, bis der neue Commit geprüft ist.** Ein PASS über sechs Messungen belegt nur diese sechs Versuche, nicht die dauerhafte Beseitigung der Ursache.

**Pflichtmatrix:** `BED-02`, `BED-03`, `SPE-03`, `SIC-02` und `TES-04` bleiben **BLOCKED**. Weiter offen: reale Fehlerursache bei erneuter Reproduktion, vollständige Barrierefreiheit, Balance, Rechte für 77 Archivdateien und historischer C64-Vergleich. Keine Änderung am Spielkern oder den 110 geschützten Originaldateien, kein Merge, kein Release, keine vorgezogene persönliche Abnahme.


## Fehlerisolation – 31.10.2026, 07:35 MEZ (neues Pflichtpaket)

**Tatsaechlicher Ausgangsbefund:** [Browser-CI #41173320564](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41173320564), HEAD `5dadf9c77207d6e94342802acb9b5af0b9678f22`, Auftrag `native-zoom-regression`: **FAIL** bei 200 %. Der vorherige 175-%-Versuch war PASS. Bei 200 % sind ein vertrauenswuerdiger Import-Schalterklick, aktive Nutzeraktivierung, genau ein Aufruf von `showPicker()` und dessen normale Rueckkehr protokolliert. Trotzdem wurde innerhalb von 5 Sekunden **kein** natives `filechooser`-Ereignis ausgeloest. Das beweist weder einen Fehler der Spielstandsvalidierung noch einen Fehler des Betriebssystems; die Ursache bleibt offen. Die 13 anderen Fach-/Quell-/Browserauftraege waren erfolgreich, die integrierte Freigabe scheiterte absichtlich an der unvollstaendigen Matrix.

**Kleine technische Erweiterung:** Der bestehende strikte Test `test_browser_session_native_zoom_v194.py` protokolliert im Fehlerfall nun zusaetzlich Dokumentfokus, Sichtbarkeitszustand, Aktivierungsstatus nach dem Timeout sowie Eigenschaften der vorhandenen Datei-Eingaben. Erst **nach** dem bereits eingetretenen Fehler wird ein **separates, temporaeres** Datei-Eingabefeld mit eigenem Schalter per echtem Enter aufgerufen. Dieser Kontrollversuch unterscheidet, ob Chromium in derselben Seite auch einen unabhaengigen nativen Picker unterdrueckt. Er benutzt weder das Spiel-Eingabefeld noch eine direkte Dateibefuellung. Selbst wenn der Kontrollversuch erfolgreich ist, wird die urspruengliche Ausnahme unveraendert erneut ausgeloest: **FAIL bleibt FAIL**. Keine Wiederholung des eigentlichen Importversuchs, kein Test-Bypass und keine Aenderung an Spielkern, Quellarchiv oder gespeicherten Daten.

**Abnahmekriterium:** Python-Syntaxpruefung, anschliessend echter Chromium-Lauf des unveraenderten sechsfachen 175/200-%-Tests auf demselben HEAD; bei einem erneuten FAIL muessen `SESSION-FILECHOOSER-FAIL` und `independentPickerControl` zur Ursachentrennung ausgewertet werden. Ein Kontroll-PASS ist **kein** Import-PASS. Der Test ist zum Zeitpunkt dieser Dokumentation **PENDING**, kein vorweggenommener Erfolg.

**Betroffene Matrix:** BED-03, SPE-03, SIC-02, TES-04 bleiben BLOCKED; Gesamtstand 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED. Weitere unabhaengige Pflichtarbeit: natuerliche Marktueberbuchung mit echten Lieferungen, Gewinn-/Vermoegensrechnung und Endpartien. Originalrechte und C64-Referenz weiterhin offen.

**Naechste drei Schritte:** (1) CI auf finalem Dokumentations-HEAD auswerten und Kontroll-Diagnose von Importfehler trennen; (2) je nach Befund Browser-/Spiel-Implementierung gezielt korrigieren und alle sechs nativen Zoomversuche erneut pruefen; (3) unabhaengig davon den wirtschaftlichen End-to-End-Nachfragetest fortsetzen. **Kein Merge, kein Release, keine vorgezogene Nutzerabnahme.**
