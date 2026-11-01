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

---

<!-- OLI_20261101_QUEUE -->
## 📋 Aktuelle Prüfliste – 01.11.2026

**Bestehende Arbeit A/B bleibt maßgeblich.** Diese Liste ergänzt nur die dokumentierte Integrations- und Freigabeprüfung; keine neue historisch unbelegte Originalregel und keine automatische Projekt-C-Freigabe.

- [x] 2026-11-01 | Dokumentation | Forschungs-README um dreistufigen Einstieg und konkrete Kopierbefehle erweitert | prüfen: `README.md`, Commit `ff0422042d7d` | fertig wenn: bestehende Forschungshinweise unverändert erhalten.
- [ ] 2026-11-01 | P0 · Integration | 70 offene Projekt-C-Entwürfe nachvollziehbar auf Doppelungen und Abhängigkeiten prüfen | prüfen: [Backlog #138](https://github.com/provoware/PROJEKT_Oli_Imperium/issues/138), PR-HEADs, CI, Vergleich mit #141 | fertig wenn: jeder Entwurf mit Sicherheits- und Quellenbeleg eingeordnet ist.
- [ ] 2026-11-01 | P0 · Freigabe | Integrationsentwurf #141 erst nach vollständig erfüllter Pflichtmatrix bewerten | prüfen: [PR #141](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/141), Browserdateidialog und offene Medienrechte | fertig wenn: alle erforderlichen Gates am finalen HEAD erfüllt; bis dahin kein Merge nach main.
- [ ] 2026-11-01 | P1 · Originalbelege | Deutsches C64-PAL-Referenzobjekt und vollständigen Pilotablauf fixieren | prüfen: Hash, Emulatorprotokoll, Screens, Quellenverweis | fertig wenn: die überprüfte Abfolge Büro → Weltkarte → Feldinformation → Rückweg als A→B-Paket vorliegt.
- [ ] 2026-11-01 | P1 · Prüfung | Dokumentationsänderungen mit bestehender Projektvalidierung kontrollieren | prüfen: `python3 tools/validate_project.py` und `python3 -m unittest discover -s tests -v` am aktuellen main | fertig wenn: sämtliche Prüfungen auf derselben Revision erfolgreich.

> [!WARNING]
> Zahlen sind eine Momentaufnahme. Die vorliegenden 52 Vorrelease-Kriterien weisen 6 PASS, 39 BLOCKED, 4 OPEN und 3 DEFERRED aus; technische Teilerfolge sind keine Spiel- oder Veröffentlichungsfreigabe.
