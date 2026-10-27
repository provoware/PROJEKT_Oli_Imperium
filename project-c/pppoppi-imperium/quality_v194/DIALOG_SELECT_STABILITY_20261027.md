# Projekt C – dynamische Feldauswahl bei echtem Browserzoom

**Stand:** 27.10.2026. **Zweig:** automation/prerelease-dialog-select-stress-20261027-2037. **Basis:** PR #92, HEAD e132bef9a1feadc37cec2464d7294b779e2807f4. **main vor der Aenderung:** d3dc371154cc1089e06f34d0dc4ff04047132360.

## Gesicherter Befund

[Browser-CI #40561679062](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40561679062) auf PR #92: alle drei Browserjobs PASS, darunter 12 Spielmonate, drei echte Chromium-Prozessneustarts, drei Export-/Import-Vergleiche und drei sichere Ablehnungen manipulierter Spielstaende. [Quellpruefung #40561679076](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40561679076) PASS. [Pflichtmatrix #40561679057](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40561679057) weiterhin BLOCKED (6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED).

Ein frueherer Lauf [#40561072233](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40561072233) scheiterte bei 200 % / BERLIN-2 nach Feldauswahl: Dialog offen, aber weder Auswahlfeld noch Wirtschaftsbuttons im DOM. Ein spaeterer gruener Lauf beweist nicht, dass ein sporadischer Fehler dauerhaft verschwunden ist. Die Ursache ist nicht bewiesen; keine spekulative Korrektur am Spielkern.

## Neues unabhaengiges Pflichtarbeitspaket

- Neuer Test test_browser_dialog_select_stability_v194.py: vier echte Wirtschaftsszenen (claim, field, warehouse, market) mit neun Feldern, drei getrennten Browserseiten je Zoomstufe, nativer Chromium-Zoom 175/200 %. Soll: **216** dynamische Auswahlwechsel.
- Jeder Auswahlwechsel loest den HTML-Change-Handler aus. Pruefung: neu gerendertes Auswahlfeld, genau ein zur Feld-ID passender Wirtschaftsbutton, vollstaendig unveraenderter Wirtschaftszustand. Kein automatisches Wiederholen oder Reparieren bei Fehler.
- Fehlerdiagnose: Dialogstatus, Szene, Feldoptionen, Buttons, Inhaltslaenge, Spielphase und JavaScript-Fehler; externe HTTP-Anfragen werden abgewiesen.
- Eigener vierter CI-Job. Die bisherigen Browserjobs bleiben unveraendert.
- Pflichtmatrix: PR-92-Nachweis bei SPE-01 und naechste Schritte bei BED-03 und STA-03 aktualisiert. Keine Freigabe durch diesen Teiltest.

**Pruefbefehl:** python3 project-c/pppoppi-imperium/quality_v194/test_browser_dialog_select_stability_v194.py. Basispruefungen: python3 tools/validate_project.py und python3 -m unittest discover -s tests -v; Matrix-Schema und Regression.

**Status bei Implementierung:** Neue CI PENDING. Selbst ein gruener Durchlauf waere nur eine zeitlich begrenzte Stabilitaetsstichprobe, keine endgueltige Fehlerbehebung. HTML-Select wird per Playwright bedient, nicht als Tastaturtest ausgegeben.

## Drei naechste Schritte

1. CI auf finalem HEAD auswerten; bei FAIL die erste echte DOM-/Laufzeitursache eingrenzen und beheben.
2. Weitere Speicherfehler und den fachlich fehlenden Endregelvertrag in getrennter Technikfassung bearbeiten.
3. Vollstaendige Sieg-/Niederlagenpartien und technische Freigabegates abschliessen; erst danach Kandidat einfrieren und persoenliche Kubuntu-/Sichtabnahme gesammelt ansetzen.

**Kein Merge, kein Release, keine Aenderung an main oder den 110 geschuetzten Originaldateien.**
