# 08 · Roadmap, Phasen und verbindliche Checkpoints

## Planlogik
Nicht „A vollständig → B beginnt“, sondern **A liefert überprüfte Teilpakete**; B entwickelt die unabhängigen Architekturteile parallel. Vorwärts: Quelle→Regel→Modul→Test. Rückwärts: Testziel→Modul→Daten→Regel→Quelle.

| Etappe | Arbeit A: Forschung | Arbeit B: Planung | Checkpoint |
|---|---|---|---|
| 0 | Forschungsfrage, Version, Hochschule | Eigenleistung, Qualitätsziele | CP-0: Scope und Kooperation |
| 1 | Referenzarchiv / Prüfsummen / Emulator | Systemgrenzen und Architekturvarianten | CP-1: Referenzakte und Entwurfsrahmen |
| 2 | Quellen, Handbuch, Bildregister | Datenvertrag und Quellenschnittstelle | CP-2: Belegbarkeit und Modellformat |
| 3 | Screens, Menüs, Ebenen | Navigations-/Zustandsentwurf | CP-3: Pilotbildschirm-Paket |
| 4 | Wirtschaft, Zeit, vier Ziele, Ereignisse | Domainmodelle, Regeln, Schnittstellen | CP-4: Pilotfachregel an B |
| 5 | Minispiele, KI, Spielstandsverhalten | Szenencontroller, Gegner-, Persistenzentwurf | CP-5: Abhängigkeitsmatrix |
| 6 | Emulator-Originaltests / Grenzfälle | gezielte Teststrategie / Risiken | CP-6: kritischer Originalvergleich |
| 7 | Hochschultext, Index, Belegmatrix | Architekturargumentation, Entscheidungen | CP-7: getrennte Rohfassungen |
| 8 | Probelauf Vortrag, Freigabe A | Rückwärtsprüfung, Übergabeplan C | CP-8: zwei eigenständige Abnahmen |

## Fünf gezielte Optimierungsschleifen
**I Zielklarheit:** Eigentümer, Ergebnis, Zweck; doppelte Arbeit streichen.  
**II Vollständigkeit:** Regel, Screen, Zustand, Sonderfall, Quelle, Test; Lücken explizit machen.  
**III Abhängigkeiten:** nur echte Blocker; Fragen zielgenau.  
**IV Effizienz:** minimaler Test/Download, Wiederverwendung von unveränderten Belegen.  
**V Konsistenz:** A-ID→B-ID→Test-ID→Quelle und beide Planungsrichtungen schließen.

**Zusatz:** Diese Schleifen sind Denkprüfungen, keine Aufforderung zu fünf identischen Testdurchläufen.

## Freigaben / Qualitätstore
- **G0:** Hochschule und rechtlich/inhaltlich klarer Scope.
- **G1:** referenzierbares Originalobjekt (Hash + Emulatorstart).
- **G2:** Pflichtfunktionen als Liste mit Quellenstatus, keine fiktiven Levels.
- **G3:** prüfbare A→B-Regelpakete, lokaler Fragekreis getestet.
- **G4:** kritische Originalregeln mit vorgesehenen Originaltests.
- **G5:** technische Module, Daten und Prüfkontrakte verknüpft.
- **G6:** akademische Eigenleistung, Quellen, Rechte, Bildnachweise.
- **G7:** Rückwärtsplanung beweist, dass B aus A ohne zusätzliche historische Websuche arbeiten kann.
- **G8:** Abschlussberichte und Handzettel korrekt; Nachbau C nur mit eigener Entscheidung.

## Definition of Done
Eine Aufgabe gilt fertig, wenn ihr Ausgangsproblem behoben oder Erkenntnisziel erreicht ist, passende Nachweise vorliegen, betroffene Querverweise aktuell sind und Restfragen transparent dokumentiert sind. Unveränderte Prüfungen nicht reflexartig wiederholen.

## Nächste drei priorisierte Schritte
1. Hochschul- und Autorenschaftsregeln klären.
2. Ein deutsches C64-PAL-Referenzobjekt mit Hash und Startprotokoll fixieren.
3. Büro→Karte→Feldinformation→Zurück als Pilotpaket erfassen und an B übergeben.

**Weiterführende Empfehlung:** Erst mit einem durchgängigen Piloten die Projektmethode validieren, dann skalieren.
