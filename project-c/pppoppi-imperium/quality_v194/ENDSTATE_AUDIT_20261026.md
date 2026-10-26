# Vorrelease-Pflichtpaket: tatsächliches Spielende und Insolvenz-Endzustand

**26.10.2026 · Projekt C / PPPOPPI IMPERIUM · keine Release-Freigabe.**

## Ausgangslage und Schutz

- Basis ist [Entwurfs-PR #65](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/65), HEAD `28d8efa812876908e793f61fad591d2567bf610c`. Hauptzweig `main` stand bei der Vorprüfung auf `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- 110 verifizierte Original-Quell-/Testdateien unter `SPIEL/` bleiben unverändert. Die Forschung A/B und die anderen Spiele-Repositories werden nicht bearbeitet.
- [Chromium-CI #40360835145](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360835145) und [Quell-CI #40360835137](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360835137) waren am Basis-HEAD erfolgreich. [Gesamtfreigabe #40360835309](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360835309) war wegen offener Pflichten gesperrt.

## Fachliche Bestandsprüfung

Der V0.8.2-Spielkern `SPIEL/src/v082_strategy_engine.js` akzeptiert in `validate()` ausschließlich die Spielphasen `TURN`, `RESCUE` und `REPORT`. `transition()` kennt Monatsabschluss, Folgemonat und Rettungsaktionen, aber **keine ausgewiesene Sieg-, Niederlagen- oder Endphase**. Insolvenz führt zu Sanierungsaktionen und gegebenenfalls einem neuen Unternehmensdurchlauf. Auszeichnungen wie `MARKTFUEHRER` sind keine nachgewiesenen Spielendbedingungen.

Dies ist ein **nachvollziehbarer Funktionsbefund für den vorliegenden Spielkern**, keine Behauptung über das historische C64-Original und kein Beweis, dass jeder denkbare Spielpfad unendlich läuft. Die ursprüngliche 48-Monats-Browserprüfung konnte deshalb keine vollständige Partie bis zum regulären Ende belegen.

## Neue technische Diagnose

`quality_v194/test_endstate_audit_v194.cjs` spielt mit dem **unveränderten Kern** 240 reguläre Monate mit zwei menschlichen Firmen ohne künstlich geänderte Spielstände. Jede Firma beendet ihren Zug; bei tatsächlich eintretender Zahlungsunfähigkeit wird die vorhandene Sanierungsaktion `RESTART` verwendet. Kontrolliert werden gültige Zustände nach jeder Aktion, Monatsberichte, die 120-Einträge-Grenze der Berichtshistorie, Firmenwechsel und die beobachteten Phasen.

Ausführung:

```bash
node project-c/pppoppi-imperium/quality_v194/test_endstate_audit_v194.cjs
```

Die Chromium-CI führt die Diagnose vor den Browserprüfungen aus. Ein erfolgreicher **Diagnosetest** bestätigt nur den beobachteten Verlauf und die korrekte Erkennung der fehlenden Endphase; er darf `VER-01` oder `VER-02` **nicht** freigeben. Die persönliche Sichtprüfung und Kubuntu-Endabnahme bleiben zurückgestellt.

## Pflichtmatrix und Entscheidung

- `VER-01`: **BLOCKED**. Eine vollständige Partie bis zu einem definierten, regulären Sieg oder Spielende ist nicht nachgewiesen; eine Endregel muss fachlich festgelegt und implementiert werden.
- `VER-02`: **BLOCKED**. Insolvenz-/Rettungsabläufe sind teilweise belegt, aber ein tatsächlicher Niederlagen-Endzustand fehlt.
- `FEH-02`: **BLOCKED**. Grenzfälle einschließlich des zulässigen letzten Monats und eines definierten Endverhaltens sind gesondert zu testen.
- `PER-02`: **BLOCKED**. 48-Monats-Speicherprofil ersetzt weder eine vollständige Partie noch einen Leckfreiheitsnachweis.
- Übrige technische Pflichten unverändert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Keine künstliche Aufwertung der Matrix.

## Nächste technische Schritte

1. Diagnose im GitHub-Lauf auf dem **endgültigen** Zweig-HEAD auswerten und gegebenenfalls korrigieren.
2. Eine fachlich begründete Endbedingung für die eigenständige PPPOPPI-Adaption (Sieg, Niederlage, Dauer/Abbruch, Gleichstand) in einem getrennten Entscheidungsdokument spezifizieren; historische C64-Regeln dabei nicht erfinden.
3. Erst nach freigegebenem Regelvertrag eine sichere, versionierte Endphase implementieren, Browser-Endpfade und Spielstand-Roundtrips prüfen und danach die Zoom-/Tastaturpflichten fortsetzen.

**Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.**
