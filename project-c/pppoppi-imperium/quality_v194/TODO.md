# OLI V1.9.4 – offene Vorrelease-Pflichtarbeit (PR #155)

Stand 02.11.2026. Dies ist die **auf PR #155 begrenzte Arbeitsliste**; die verbindliche Gesamtmatrix liegt unter [../prerelease/matrix.json](../prerelease/matrix.json). Die Liste aendert keinen Gate-Status und ersetzt keine bestehende Projekt-Roadmap. Benutzerabnahme erst am Ende.

- [x] 2026-11-02 | SPE-01/VER-03 | 240-Monats-Chromium bei 175 % und 200 % mit je zwei echten Datei-Auswahldialogen pruefen | PASS: 14/14 Jobs auf HEAD `3dde8c40f562c2fc6d396e68c1edde3642e2700a`, CI #41378517223; beide Browserlogs `session_import_count=2` und `session_import_path=NATIVE_FILECHOOSER` | fertig als technischer Teilnachweis, kein Gesamt-Gate-PASS
- [ ] 2026-11-02 | BED-02/03 | Vollstaendige Tastatur- und Tab-Reihenfolge unter Zoom mit Fokuswechseln und 800x600 nachpruefen | 14-Punkte-Tab-Kampagne auf vorherigem HEAD bei 175/200 % PASS; neuer Nachtrag prueft echten Tab-Fokus, sichtbaren Fokus und Enter ohne Fokus-Trick, 9/9 isolierte Regressionen PASS, neuer Browser-CI PENDING; [Bericht](KEYBOARD_TAB_CAMPAIGN_20261102.md) | fertig wenn alle vorgesehenen Dialoge und Minispiele ohne Maus erreichbar und automatisiert belegt sind
- [ ] 2026-11-02 | PER-01/02 | Langzeitverlangsamung eingrenzen und reproduzierbare Leistungsgrenzen begruenden | Wiederholungsmessungen mit identischem Aufbau | fertig wenn vereinbarte Schwellen auf aktuellem HEAD nachgewiesen sind
- [ ] 2026-11-02 | VER-03/SPE-01 | Archiv- und Speicherumfang mit Fehler-/Unterbrechungsfaellen vollstaendig belegen | reale Import-/Export- und Negativtests | fertig wenn alle Matrixfaelle nachvollziehbar PASS sind
- [ ] 2026-11-02 | BAL/QUE-04 | Vermoegensbewertung, Medienrechte und C64-Originalvergleich gesondert klaeren | Quell- und Fachnachweise ohne unbelegte Originaltreue | fertig wenn alle unabhaengig pruefbaren Gates gruen und externe Rechtefragen geklaert sind
- [ ] 2026-11-02 | RELEASE | Technischen Release-Kandidaten erst nach allen technischen Pflichten einfrieren | Matrix, Dokumentation und CI auf einem HEAD | fertig wenn Endabnahme zuletzt erfolgt und ausdrueckliche Nutzerfreigabe vorliegt

**Nachweis:** [240-Monats-Dateidialogbericht](NATIVE_IMPORT_240_LONGRUN_20261102.md) und [Tab-Kampagne](KEYBOARD_TAB_CAMPAIGN_20261102.md). **Gesamtstatus:** 6/52 PASS, keine Freigabe. **PR-Entwuerfe:** vor der Iteration 4 offen; nach der Iteration erneut pruefen.

## Nachtrag 02.11.2026 – Rueckwaerts-Tab-Pruefung

- [x] 2026-11-02 | BED-02/03 Teilpaket | Echte Shift+Tab/Tab-Rueckwege und sechs Negativ-/Regressionstests implementieren | lokal isoliert **6/6 PASS**, Python-Syntax **PASS**; [Bericht](REVERSE_TAB_CAMPAIGN_20261102.md) | implementiert, kein Gesamtgate
- [ ] 2026-11-02 | BED-02/03 CI | Neue 120-Monats-Chromium-Jobs bei 175/200 % samt 14 Rueckwegen und allgemeiner Regression auswerten | Ausgangs-CI [#41389498165](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41389498165) **16/16 PASS** auf HEAD `c7c1b9ad`; **neue CI PENDING** | fertig erst bei beiden neuen Jobs PASS auf finalem HEAD
- [ ] 2026-11-02 | BED-02/03 Rest | Weitere Dialoge und Minispiele samt Vorwaerts-/Rueckwaerts-Tab, Enter und sichtbarem Fokus inventarisieren | echte Browserpfade | fertig wenn vollstaendige Szenenabdeckung nachgewiesen ist

**PR-Draftbestand bei dieser Iteration:** 4 offen (PR #141, #150, #154, #155), danach erneut 4 erwartet, vor Abschluss live pruefen. **Matrix:** 6/52 PASS; kein Merge, kein Release, persoenliche Endabnahme weiterhin zuletzt.

## Nachtrag 02.11.2026 – verdeckte und außerhalb liegende Tab-Ziele

- [x] 2026-11-02 | BED-02/03 Teilpaket | 14 bestehende Tab+Enter-Punkte vor Aktivierung auf nutzbare Fensterfläche und Überdeckung prüfen | lokal 12/12 Python-Regressionen, Syntax PASS, 4/4 isolierte JavaScript-Geometrieszenarien PASS; [Bericht](KEYBOARD_TARGET_OCCLUSION_20261102.md) | technische Prüfschranke implementiert, Gesamtgate bleibt BLOCKED
- [ ] 2026-11-02 | BED-02/03 CI | Vorhandene 175/200-%-Browserjobs auf dem neuen HEAD auswerten | Ausgangs-CI [#41394778651](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41394778651) 18/18 PASS auf `b286b5dbb238c93a479a12e09e101df80cf0cb09`; neue CI PENDING | fertig wenn die betroffenen Jobs auf endgültigem HEAD PASS sind
- [ ] 2026-11-02 | BED-02/03 Rest | Nicht erfasste Dialoge und Minispiele auf Tastaturfokus, Sichtbarkeit und Überdeckung prüfen | reale Browserpfade | fertig wenn vollständige Szenenabdeckung nachgewiesen ist

**Vorrelease:** 6/52 PASS; 39 BLOCKED, 4 OPEN, 3 DEFERRED. Persönliche Endabnahme zuletzt, kein Merge/Release. PR-Draftbestand zu Beginn 4 (#141, #150, #154, #155), nach Commit erneut live prüfen.


## Nachtrag 02.11.2026 – vier echte CI-Fehler nach Sichtbarkeitsprüfung

- [x] 2026-11-02 | BED-02/03 Diagnose | [CI #41400850616](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41400850616) auswerten | **14 PASS / 4 FAIL** auf `a820507d`; alle vier Tastaturjobs scheitern am außerhalb liegenden `#startGame` vor Spielbeginn | tatsächlicher Fehler nachgewiesen, nicht als PASS umdeuten
- [x] 2026-11-02 | BED-02/03 Korrekturversuch | Bis zu 3 s ausschließlich natürlichen Browserbildlauf abwarten; kein künstliches Fokussieren/Scrollen; Geometrie anschließend streng erneut prüfen | zwei neue Negativ-/Regressionstests ergänzt, insgesamt 14; [Details](KEYBOARD_TARGET_OCCLUSION_20261102.md) | Code implementiert, Wirkung erst durch neue CI zu belegen
- [ ] 2026-11-02 | BED-02/03 CI-Gate | 4 betroffene Browserjobs 175/200 % vorwärts/rückwärts auf neuem HEAD erneut prüfen | [GitHub Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig nur bei tatsächlichem PASS auf aktuellem HEAD
- [ ] 2026-11-02 | BED-02/03 Rest | Bei erneutem FAIL reale Lage, Scroll-Container und CSS des Startknopfs untersuchen; anschließend alle Dialog-/Minispielpfade inventarisieren | Geometriediagnose und echte Browsernachweise | keine Fokus-/Sichtbarkeitsprüfung entfernen

**Matrix unverändert:** 6/52 PASS; 39 BLOCKED, 4 OPEN, 3 DEFERRED. Keine Freigabe, kein Merge, keine persönliche Endabnahme.


## Nachtrag 02.11.2026 – Fokusverlust nach natuerlichem Bildlauf

- [x] 2026-11-02 | BED-02/03 Teilpaket | Echten Fokus und sichtbaren Fokus nach dem Geometrietest unmittelbar vor Enter erneut kontrollieren | drei isolierte Funktionstests PASS, neue Negativtests implementiert; [Bericht](KEYBOARD_FOCUS_RACE_20261102.md) | keine Aktivierung bei verlorenem Fokus, kein Gesamt-Gate-PASS
- [ ] 2026-11-02 | BED-02/03 CI | 16 Python-Regressionen und 175/200-%-Browserpfade auf dem neuen HEAD abwarten | vorheriger Lauf #41421365543 war QUEUED | fertig nur mit nachgewiesenem PASS auf dem neuen HEAD

**Matrix weiterhin 6/52 PASS; kein Merge, kein Release, Endabnahme zuletzt.**

## Nachtrag 02.11.2026 – CSS-Fokusmarkierung als Pflichtbeleg

- [x] 2026-11-02 | BED-02/03 | Vorherige 18 CI-Jobs auf `36edd26a55d411a6eaee06b6eb103ed05e98ab58` auswerten | [CI #41422394500](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41422394500): 18/18 PASS | technischer Teilnachweis
- [x] 2026-11-02 | BED-02/03 | Tab-Enter nur bei berechneter CSS-Fokusmarkierung zulassen; drei Negativtests ergaenzen | Implementierung und CI-Anbindung im bestehenden PR #155 | fertig als Code, nicht als Release-Gate
- [ ] 2026-11-02 | BED-02/03 | 19 isolierte Regressionen und vier 175/200-%-Browserjobs auf neuem HEAD auswerten | GitHub-CI auf neuem HEAD PENDING | fertig bei echtem PASS
- [ ] 2026-11-02 | BED-02/03 | Fehlende Dialog- und Minispielpfade inventarisieren, echten Tab-/Enter-Weg bei 800x600 und Zoom pruefen | ohne direkte Fokussetzung | fertig wenn alle vorgesehenen Bedienpfade belegt sind

**Draft-Bestand vor dieser Iteration:** 4 (#141, #150, #154, #155). **Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Keine persoenliche Endabnahme, kein Merge/Release.

- [x] 2026-11-02 | BED-02/03 | CSS-Fokusring auf alle 14 Tab-Ziele einschliesslich nativer Importe ausdehnen; erzwungenes Locator-Fokussieren im auditierten Import vermeiden | zwei neue Importregressionen, 10 statt 8 | Code implementiert, CI auf neuem HEAD offen
- [ ] 2026-11-02 | BED-02/03 | Zehn Importregressionen und 19 Fokusregressionen plus vier 175/200-%-Browserjobs auf finalem HEAD nachweisen | [GitHub Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig bei tatsaechlichem PASS

## Nachtrag 02.11.2026 – Bewegungsschalter, Zustand und Neustart

- [x] 2026-11-02 | BED-02/03 Teilpaket | `#motionBtn` bei 175/200 % und 800x600 mit Tab/Shift+Tab/Enter, `aria-pressed`, sichtbarem Text und lokaler Speicherung in den Browserpruefer aufnehmen; Wiederherstellung nach Neuladen absichern | Code und drei isolierte Negativtests ergaenzt; [Bericht](MOTION_KEYBOARD_20261102.md) | implementiert, CI-Nachweis auf neuem HEAD noch PENDING
- [ ] 2026-11-02 | BED-02/03 CI | Drei Kopfzeilen-Jobs (1x Unit, 2x echter Chromium-Zoom) auf finalem HEAD auswerten und echte Fehler korrigieren | vorheriger [Lauf #41438727245](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41438727245) 3/3 PASS, jedoch vor dieser Aenderung | fertig wenn alle drei Jobs auf neuem HEAD PASS
- [ ] 2026-11-02 | BED-02/03 Rest | Nicht erfasste Dialog- und Minispielaktionen mit echtem Fokus und Zustandssicherung vervollstaendigen | getrennte, reproduzierbare Browserfaelle | fertig wenn alle vorgesehenen Bedienwege nachgewiesen sind

**Vorrelease:** 6/52 PASS; 39 BLOCKED, 4 OPEN, 3 DEFERRED. PR-Drafts vor Aenderung 4; kein Merge, kein Release, persoenliche Endabnahme zuletzt.

## Nachtrag 02.11.2026 – Hilfedialog Escape und Fokus-Rueckkehr

- [x] 2026-11-02 | BED-02/03 | Escape-Schliessen und anschliessende echte Tab-/Enter-Schliessung des Hilfedialogs bei 175/200 % um Fokus-Rueckkehr und CSS-Fokusring erweitern | [Pflichtbericht](HEADER_KEYBOARD_20261102.md) | Code und drei Negativtests implementiert, CI offen
- [ ] 2026-11-02 | BED-02/03 | Drei Kopfzeilen-CI-Jobs auf finalem HEAD auswerten | [Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig wenn Unit und beide Chromium-Zoomstufen PASS
- [ ] 2026-11-02 | BED-02/03 | Weitere Dialoge und Minispiele vollstaendig per Tastatur, mit Zustandserhalt und Fokus-Rueckkehr pruefen | echte Browserpfade ohne Fokus-Trick | fertig wenn die vollstaendige Aktionsmatrix nachgewiesen ist

**Wichtig:** Die integrierte Vorrelease-Sperre ist bei 6/52 PASS absichtlich rot; nicht deaktivieren oder als Testfehler kaschieren. Kein Merge/Release.

## Nachtrag 02.11.2026 – strenger Tastaturpfad der Wirtschaftsaktionsmatrix

- [x] 2026-11-02 | BED-02/03 Teilpaket | Vor jeder Wirtschaftsaktion echte Shift+Tab/Tab-Rueckkehr, berechnete CSS-Fokusmarkierung, Fenster-Treffbarkeit und Fokus unmittelbar vor Enter pruefen | [Pruefbericht](DIALOG_KEYBOARD_STRICT_20261102.md); fuenf Negativ-/Regressionstests und CI-Schritt implementiert | fertig als Code, **nicht** als Gesamtgate
- [ ] 2026-11-02 | BED-02/03 CI | Fuenf neue Unit-Tests und den bestehenden 175/200-%-Dialog-Browser-Rundlauf auf dem neuen HEAD abschliessen | [GitHub Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig nur bei nachweislichem PASS; bei FAIL echte Fokus-/Layoutursache korrigieren
- [ ] 2026-11-02 | BED-02/03 Rest | Weitere Claim-/Regionsparameter und dynamische Minispielaktionen mit echten Tastaturpfaden und fachlichen Zustandsfolgen absichern | eigene reproduzierbare Browserfaelle | fertig wenn alle vorgesehenen Aktionsfolgen nachgewiesen sind

**Matrix unveraendert:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED. Keine Benutzerabnahme, kein Merge, kein Release.

## Nachtrag 02.11.2026 – Minispiel-Tastaturgate

- [x] 2026-11-02 | BED-03 Teilpaket | Bohr-, Rohr- und Feuerwehr-Tastaturaktionen vor Enter auf berechneten CSS-Fokusring, sichtbare Trefferflaeche, Verdeckung und Fokusverlust absichern | [Bericht](MINIGAME_KEYBOARD_GATE_20261102.md); zehn neue Negativ-/Vertragstests und Pflicht-CI-Schritt | Code implementiert, CI auf finalem HEAD noch offen
- [ ] 2026-11-02 | BED-03 CI | Zehn neue Unit-Tests, Rohr-/Feuerwehr-Kampagne und Browser-/Zoom-Minispiele auf finalem HEAD auswerten; bei FAIL die reale Ursache korrigieren | GitHub Actions, Ergebnisse nach Abschluss dokumentieren | fertig wenn betroffene Jobs auf finalem HEAD PASS
- [ ] 2026-11-02 | BED-03 Rest | Regler und dynamische Minispielphasen, weitere Claim-/Regionsvarianten mit Zustandsfolgen absichern | echte Tastatur, 800x600, 175/200 % | fertig wenn alle vorgesehenen Bedienwege fachlich belegt sind

**Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED (52). Kein Merge, kein Release, Endabnahme zuletzt.

## Nachtrag 02.11.2026 – echte CI-Fehler, Syntaxkorrektur

- [x] 2026-11-02 | BED-02/03 | Doppelte Zeilenfortsetzung in zehn Minispiel-Tastaturtests korrigieren und frühen Python-Syntaxcheck ergänzen | [CI-Befund](CI_KEYBOARD_FAILURES_20261102.md) | Implementierung fertig, GitHub-Nachweis auf neuem HEAD offen
- [ ] 2026-11-02 | BED-02/03 | Zehn Minispiel-Regressionen und Rohrnetz-/Feuerwehr-Kampagne auf finalem HEAD ausführen | [Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig bei echten PASS-Ergebnissen
- [ ] 2026-11-02 | BED-02/03 | #closeBtn nach Bohrstufe 3 wieder in sichtbaren Bereich bringen und #startGame mit berechneter CSS-Fokusmarkierung ausstatten | [Browser-CI #41473770623](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770623) | fertig bei grünen 175/200-%-Chromiumprüfungen

**Gesamtmatrix unverändert:** 6/52 PASS. Kein Merge/Release, persönliche Endabnahme zuletzt.


## Nachtrag 02.11.2026 – Dialogkopf im nativen Zoom

- [x] 2026-11-02 | BED-02/03 | Sticky-Dialogkopf im abgeleiteten Technikaufbau und Regression nach Bohrstufe 3 implementieren | Quellprüfung: eindeutiger CSS-Ersatz; echter Chromium-PASS auf neuem HEAD noch ausstehend | fertig als Codepaket, kein Gesamtgate
- [ ] 2026-11-02 | BED-02/03 CI | Beide echten 175/200-%-Bohrtests auf neuem HEAD sowie Browser-Gesamtprüfung auswerten | Ausgangsfehler: [#41473770623](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41473770623) | fertig wenn #closeBtn sichtbar, unverdeckt und per Tab+Enter erreichbar bleibt
- [ ] 2026-11-02 | BED-02/03 Fokus | Berechnete CSS-Werte bei erneutem #startGame-Fokusringfehler auswerten, Ursache korrigieren | keine Lockerung des CSS-Gates | fertig wenn betroffener Browserpfad auf endgültigem HEAD PASS ist

[Nachweis und offene Risiken](ZOOM_DIALOG_FOCUS_FIX_20261102.md). Matrix unverändert 6/52 PASS, kein Merge/Release, Endabnahme zuletzt.

## Nachtrag 02.11.2026 – CSS-Outline beim echten Tab-Fokus

- [x] 2026-11-02 | BED-02/03 | Fehlgeschlagene Browser-CI #41492796482 anhand berechneter CSS-Werte analysieren und nur im abgeleiteten Aufbau die Toolbar-Outline von der 0,16-s-Transition ausnehmen | isolierter echter Chromium-Tab-Vergleich: anfänglich 2px vs. unmittelbar 3px; Build-Sicherheitsregression ergänzt | Implementierung erfolgt, vollständige CI offen
- [ ] 2026-11-02 | BED-02/03 CI | Build-Sicherheitsprüfung und beide echten 175/200-%-Zoompfade auf dem finalen Commit auswerten; Fehler bei Bedarf korrigieren | [Fehler-/Pflichtbericht](FOCUS_TRANSITION_20261102.md) | fertig erst nach grünem Nachweis auf endgültigem HEAD
- [ ] 2026-11-02 | BED-03 Rest | Dynamische Minispielphasen und verbleibende Dialogaktionen vollständig per Tab/Shift+Tab/Enter mit Zustandsprüfung absichern | echte Browserkampagne 800×600 und Zoom | fertig wenn gesamte Bedienmatrix geprüft ist

**Gesamtmatrix unverändert:** 6/52 PASS; 39 BLOCKED, 4 OPEN, 3 DEFERRED. Keine Endabnahme, kein Merge, kein Release.

## Nachtrag 02.11.2026 – BED-03 Druckregler und echter Tastaturfokus

- [x] 2026-11-02 | BED-03 Teilpaket | Sichtbaren CSS-Fokusring im abgeleiteten Technikaufbau, echte Tab-/Geometrie-/Verdeckungspruefung vor Home/Pfeiltasten und Fokus nach Pfeiltasten ergaenzen | [Pflichtbericht](DRILL_PRESSURE_KEYBOARD_20261102.md); 5 neue Negativtests, Build-Sicherheitsregression, CI-Syntaxcheck | Code auf PR #155, **keine Gesamtfreigabe**
- [ ] 2026-11-02 | BED-03 CI | 15 Minispiel-Vertragstests, Build-Sicherheit und echten Chromium-Bohrpfad auf endgueltigem HEAD nachweisen | GitHub Actions, getrennt PASS/FAIL/BLOCKED erfassen | fertig nur bei belegtem PASS
- [ ] 2026-11-02 | BED-03 Zoom | Bohrregler-Fokus und Verdeckung auch bei echtem 175/200-%-Chromiumzoom mit 800x600 testen | keine direkte Fokussetzung | fertig wenn beide Zoomstufen reproduzierbar PASS

**Gesamtmatrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Kein Merge, kein Release; persoenliche Endabnahme zuletzt.

## Nachtrag 02.11.2026 – BED-03 Bohrregler im echten Zoom

- [x] 2026-11-02 | BED-03 | Strengen Druckregler-Fokus-/Geometrie-Gate in den echten 175/200-%-Chromium-Bohrpfad uebernehmen; Fokus nach Home/Pfeilen nachpruefen | [Pflichtbericht](DRILL_NATIVE_ZOOM_GATE_20261102.md) | Code umgesetzt, Browser-CI noch offen
- [ ] 2026-11-02 | BED-03 CI | Drei Strukturregressionen und beide echten Zoomjobs auf finalem HEAD auswerten; FAIL beheben | GitHub Actions PR #155 | fertig wenn alle betroffenen Jobs PASS
- [ ] 2026-11-02 | BED-03 Rest | Weitere dynamische Minispielphasen und Zustand nach Speicher-/Neustart pruefen | 800x600, echte Tastatur und Zoom | fertig wenn vorgesehene Bedienwege reproduzierbar belegt

**Matrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Keine Endabnahme, kein Merge, kein Release.

## Nachtrag 02.11.2026 – nativer Zoom: undefinierter Tab-Helfer

- [x] 2026-11-02 | BED-03 / CI | Echten [Chromium-FAIL #41520201346](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41520201346) diagnostizieren: beide Zoom-Matrixjobs scheiterten an `NameError: tab_to is not defined` in `test_browser_native_zoom_drill_v194.py:36`; die uebrigen sieben Fach-Workflows waren SUCCESS, die integrierte Freigabesperre erwartungsgemaess FAIL | Ursache im fehlenden Import, nicht in einer nachgewiesenen Spielregelabweichung | Diagnose erledigt
- [x] 2026-11-02 | BED-03 / CI | Bestehenden echten Tab-Helfer importieren und AST-Regression fuer die explizite Bindung plus `#closeBtn`-Aufruf hinzufuegen | [Bericht](CI_NATIVE_ZOOM_NAMEERROR_20261102.md) | Code implementiert, Browserbeleg ausstehend
- [ ] 2026-11-02 | BED-03 / CI | Beide nativen 175/200-%-Chromium-Jobs auf neuem HEAD inklusive Druckregler, drei Bohrstufen, Dialogkopf und Export erfolgreich nachweisen | CI erst nach Abschluss PASS oder FAIL nennen | fertig wenn beide Zoom-Jobs auf demselben HEAD gruen sind
- [ ] 2026-11-02 | BED-03 / Rest | Weitere dynamische Minispielzustaende und 800x600-Tastaturpfade einschliesslich Speichern/Wiederherstellen vervollstaendigen | keine direkte Fokussetzung oder Gate-Abschwaechung | fertig wenn Matrix-Nachweise vollstaendig

**Vorrelease-Matrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Keine persoenliche Abnahme, kein Merge, kein Release.

## Nachtrag 02.11.2026 – Bohrspiel nach erstem Abschnitt wiederaufnehmen

- [x] 2026-11-02 | BED-03 / SPE-01 / VER-03 | Vorhandenen 12-Monats-Browserlauf um zweiten echten Chromium-Prozessneustart **nach** Bohrabschnitt 1 erweitern; Zwischenexport, identischen Zustand nach Import, Abschnitt 2/3, Abrechnung und Archivierung pruefen | [Pruefbericht](DRILL_MIDSTAGE_RESTART_20261102.md) | Test implementiert; PASS erst nach CI auf neuem HEAD
- [ ] 2026-11-02 | BED-03 / CI | Bohrspiel-Kampagne mit vier echten Browserprozessen und drei Sitzungsdateien auf finalem HEAD auswerten | [GitHub Actions](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) | fertig wenn alle konkreten Schritte PASS; bei FAIL Fehler beheben
- [ ] 2026-11-02 | BED-03 / Rest | Weitere Minispielphasen mit Speicherunterbrechung, Tastatur und Zoom pruefen | Spielzustand vor/nach Neustart exakt vergleichen | fertig wenn alle vorgesehenen Spielpfade technisch nachgewiesen

**Letzter belegter Ausgangsstand:** CI [#41530495777](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41530495777) 9/9 Browserjobs PASS auf `5d2722ac3c6a954ad3feab964f36cbdc9435fe2a`; die acht weiteren Fach-Workflows SUCCESS, die integrierte Vorrelease-Sperre weiterhin erwartungsgemaess FAIL. **Matrix unveraendert: 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.** Kein Merge, kein Release, persoenliche Endabnahme zuletzt.
