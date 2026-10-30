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


## Draft-PR-Schuldenbremse und Qualitätsvorrang (29.10.2026)

Die GitHub-PR-Bestandsaufnahme gehört **vor die Planung neuer optionaler Arbeiten**. Für offene Draft-PRs je Repository gilt: **0–5 = normal**, **6–10 = P1-Abarbeitung**, **ab 11 = P0-Abarbeitung**. Zielbestand: **höchstens fünf Drafts**. Maßgeblich ist die live über GitHub ermittelte Anzahl; bei API-Fehler/fehlendem Zugang lautet der Status UNBEKANNT, niemals 0.

- Bei Überschreiten der Grenze ist die **bestehende priorisierte To-do/Next Queue** maßgeblich: zuerst offene Arbeiten nach tatsächlichem Nutzen, Risiko, Alter, Blockern und Abhängigkeiten abarbeiten. Neue optionale Features zunächst nur dort vormerken, **keine zusätzlichen Drafts auf Vorrat**.
- Für jeden Draft den aktuellen HEAD, Zweck, Review, CI, Mergekonflikte, Sicherheitswirkung und Beziehungen (BLOCKS, REQUIRES, DUPLICATE, SUPERSEDES) erfassen. Klassifizieren: MERGE-BEREIT, KORREKTUR, BLOCKIERT, DUPLIKAT, ÜBERHOLT, GEPLANT.
- **Qualität vor Menge:** Fertigstellen mit minimaler Korrektur und passenden Negativ-/Regressionstests; Review, aktuelle CI, Schutzregeln und Abhängigkeiten vor Merge prüfen. Grün auf einem alten Commit ist kein Integrationsnachweis; grün auf PR-HEAD ersetzt nicht die Main-Nachkontrolle.
- **Nichts blind schließen oder mergen.** Duplikate/überholte Drafts nur mit Begründung, Quellen-/Nachfolgerverweis und gesichertem Arbeitsinhalt schließen. Unfertige Originalarbeit bleibt erhalten. Von Draft auf reviewbereit nur nach nachweislich erfüllten Projekt-Gates wechseln.
- Nach jedem Abschluss erneut zählen und in der To-do-Aufgabe dokumentieren: **vorher → nachher**, getesteter HEAD, Ergebnis, offene Blocker, nächste konkrete Handlung. Erst bei ≤5 Drafts wieder regulär optionale neue PRs priorisieren.
- **Ausnahmen:** P0-Sicherheits- und Datenintegritätsprobleme, zwingende Release-Gates und ein bereits freigegebener eingefrorener Plan haben Vorrang. Diese Regel **hebt keinen Freeze und keine Release-/Merge-Freigabe** auf. Bestehende kanonische/generierte To-do-Ansichten nicht manuell umschreiben; vorhandenen Generator bzw. Aufgaben-Workflow verwenden.

Zugehörige priorisierte GitHub-Aufgabe: https://github.com/provoware/PROJEKT_Oli_Imperium/issues/138.
