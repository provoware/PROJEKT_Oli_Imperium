# Arbeitsregeln für Codex und andere Entwicklungsassistenten

## Geltungsbereich und Ziel
Dieses Repository dient zuerst der C64-Forschung (A) und der technischen Planung (B); ein vollwertiger Nachbau ist ein **späteres, getrennt freizugebendes Projekt**.

1. **Zuerst lesen:** `README.md`, `docs/03_UEBERGABE_A_B.md`, `docs/04_ORIGINAL_QUELLEN.md`, `docs/05_TESTS_FORTSCHRITT.md`, `CONTRIBUTING.md`.
2. **Kein Faktenraten:** Nicht verifizierte C64-Regeln, Originalalgorithmen, Startwerte, Grafikdetails oder Entwicklerangaben niemals als bestätigt ausgeben.
3. **Belegpflicht:** Maßgeblich sind freigegebene ID-Datensätze in `data/contract.json`, mit Quellen und Prüfstatus. Diskussionsnotizen sind nicht verbindlich.
4. **Effizienz:** Nur die konkrete angeforderte Änderung umsetzen, nicht ganze Verzeichnisse refaktorisieren. Zuerst Risiken und Abhängigkeiten bestimmen, dann klein ändern, anschließend nur betroffene Tests; vor Freigabe vollständigen schnellen Basischeck.
5. **Kleine Änderungen:** Jede Änderung mit Zweck, betroffenen IDs, Nachweis und nötigen Tests erläutern. Dokumentation im selben Änderungsvorgang synchronisieren.
6. **Sicherheit:** Keine Original-ROMs/Disks/Scans/Musik ohne Rechte, keine personenbezogenen Teilnehmerdaten, keine Tokens, Passwörter oder Zugangsdaten einchecken.
7. **Trennung:** Historischer Originalkern und Deutschland-/PPPOPPI-Variante gehören in unterschiedliche Konfigurationen, Quellen und Freigaben. Die spätere Adaption darf Referenztests nicht ersetzen.
8. **Keine Pseudo-Erfolge:** Leerer Testkatalog ergibt 'nicht messbar', niemals 100 %. Tests nur als bestanden deklarieren, wenn sie ausgeführt wurden.
9. **Unklarheit:** Eine offene Regel als Rückfrage dokumentieren; nur abhängige Arbeiten warten. Architektur darf Schnittstellen skizzieren, jedoch keine unbelegten Werte festschreiben.
10. **Git-Arbeit:** Eigener Zweig, nachvollziehbarer Änderungsantrag, kurze begründete Änderungen; `main` nicht ungeprüft überschreiben.
11. **Berichtsstil:** kurze Fakten, Fortschritt mit Nenner, offene Blockaden, genau drei nächste Schritte plus eine weiterführende Empfehlung. Deutsch, verständlich, kein künstliches Aufblasen.
12. **Vorwärts + rückwärts planen:** Quelle→Regel→Modul→Test **und** geforderter Test→Daten→Regel→Quelle. Nur Lücken bearbeiten, die Konsequenzen haben.

## Fachlicher Freigabe-Gate
Regel nur als Originalregel verwenden, wenn Herkunft und Status dokumentiert sind; 'forum', 'Sekundärquelle' oder 'Hypothese' allein legitimieren keine Behauptung über interne Originalimplementierung.

## Technischer Gate
`python3 tools/validate_project.py` und `python3 -m unittest discover -s tests -v`. Bei Änderungen nur an Fließtext ist kein C64-Emulatortest erforderlich; bei geänderten Spielregeln schon, sobald Referenz vorhanden.

**Keine automatische Veröffentlichungs- oder Merge-Erlaubnis für künftige Änderungen.**
