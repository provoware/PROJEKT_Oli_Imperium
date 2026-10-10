# HANDZETTEL · Oil Imperium C64 · Zwei Abschlussarbeiten

**Projekt:** https://github.com/provoware/PROJEKT_Oli_Imperium  
**Kernauftrag:** Das C64-Original nachweisen (A) → Entwicklung vollständig daraus ableiten (B) → HTML-Nachbau erst im Folgeprojekt (C).

## Die wichtigsten Fakten
- *Oil Imperium* / *Black Gold*, C64-Version von 1989, reLINE Software: Literatur-/Archivbefunde, noch kein eigener Emulatorversuch.
- Bezugsquellen: Preservation64 (Originalarchive), C64-Wiki (Einführung/Community), VICE-Dokumentation (Technik).
- **Achtung:** Der Archivkatalog enthält mehrere Versionen und auch einen unvollständigen Datensatz; konkrete Referenz mit Hash wählen.
- **Achtung:** „Level“ kann Spielregion, Minispiel, Zugphase oder Menüebene meinen. Nicht erfinden!
- **Achtung:** Handbuch, Spieltest, Fanbericht, Hypothese unterscheiden.
- **Achtung:** Das öffentliche GitHub-Repository ist kein Platz für ungeklärtes Originalmaterial oder personenbezogene Daten.

## 6 Kontrollfragen vor jeder Aktion
1. **Wozu?** Welchen konkreten Erkenntnis- oder Entwicklungsbedarf löst sie?
2. **Belegt?** Welche Quelle, Version und ID sind maßgeblich?
3. **Nötig?** Ist die Antwort bereits vorhanden, könnten wir sie wiederverwenden?
4. **Klein genug?** Welche minimalen Änderungen/Tests reichen?
5. **Konsistent?** Welche Screens/Regeln/Module/Tests hängen daran?
6. **Nachweis?** Was ist vorher/nachher überprüfbar anders?

## Originaltreue: drei Werte, keine Zaubermetrik
`Abdeckung = geprüfte Pflichtfälle / definierte Pflichtfälle`  
`Übereinstimmung = bestandene Vergleiche / durchgeführte Vergleiche`  
`Bestätigte Originaltreue = bestandene gewichtete Pflichtfälle / alle gewichteten Pflichtfälle`  
**0 Pflichtfälle = NICHT MESSBAR**, nicht 100 %.

## Aufgabenverteilung
**A:** Quellennachweis, Bildatlas, Regeln, Aktionen, C64-Tests, Vortrag.  
**B:** eigenständige Architektur, Daten, Schnittstellen, Fehlerfälle, Risiken, technische Prüfungen.  
**A↔B:** jede Rückfrage als kurze ID mit 'blockiert konkret' und möglicher Parallelaufgabe.

## Kürzester Arbeitspfad
`Quelle (P/E/S/F) → A-Regelkarte → A-Freigabe → B-Modulkarte → Testkarte → Entscheidung → Dokumentationsabnahme`.

## Vorsicht vor 5 klassischen Fehlern
- Amiga-/DOS-Bild als C64 beweisen wollen.
- Foren-Cheat als verifizierte Regel übernehmen.
- Exakte Formel ohne Messprotokoll behaupten.
- UI-Farbe oder Deutschland-Ort in die historische Originalfassung mischen.
- Technische Fortschrittsquote mit echter Originaltreue verwechseln.

## Praxis / Terminal
```bash
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
sha256sum <rechtmaessig_vorliegende_datei>
```
**Screenshots:** VICE → originales PNG → SHA-256 → beschriftete Kopie → Quellenkarte. Keine originalen Daten blind in GitHub hochladen.

## Abschluss jeder Arbeitsrunde
**Fortschritt:** A x/y freigegebene Pakete | B x/y abgenommene Module | Original x/y bestandene Pflichtfälle oder 'nicht messbar'.  
**Kurzdetails:** Was ist neu belegt / verbessert / noch offen?  
**Genau drei nächste Schritte + eine weiterführende Empfehlung.**

**MERKSATZ:** Kein Test ohne Frage, keine Regel ohne Quelle, kein Modul ohne Vertrag, keine Prozentzahl ohne Nenner.
