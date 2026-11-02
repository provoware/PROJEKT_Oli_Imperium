# BAL-01 – Investitionsschranken der KI getrennt prüfen (29.10.2026)

**Status: GitHub-Testlauf auf dem unveränderten Test-HEAD PASS; nachfolgende Dokumentations-HEADs gesondert prüfen. BAL-01 bleibt BLOCKED.**

## Anlass und Abgrenzung

Die bisherigen KI-Gegenvergleiche (PR #135–137) zeigen, dass A3 bei normalen Marktpreisen nicht in freie Felder investiert. Strategietausch und Logistikreserve-Tausch erklären dies allein nicht. Vor einer Änderung der Produktions-KI wird deshalb der **tatsächliche Entscheidungsfilter für SURVEY/BUY** unabhängig nachgerechnet.

Der Test verändert **keine der 110 geschützten Quelldateien** und führt **keine neue Spielregel** ein. Die Startkasse wird nur in einer Kopie des Anfangszustands für diagnostische Gegenproben erhöht. Das ist weder ein erwirtschafteter Gewinn noch eine reale Spielaktion.

## Testvertrag

- Quelle: unveränderter KI-Planer `SPIEL/src/strategy_ai_v192.js` und unveränderter Wirtschaftskern.
- Zwei Startmärkte: normal und auf 52 % reduzierte Startpreise.
- Drei AI-Firmen: A1, A2, A3; je 0 €, +50.000 € und +150.000 € hypothetische Startkasse.
- **18 getrennte Anfangszustandsdiagnosen**, jede doppelt ausgeführt; **keine 18 vollständigen Spielpartien**.
- Für jede freie Konzession werden positive Rückflussprognose, ungelöste eigene Felder, Grenze von drei produzierenden Feldern, verbleibende Tage und Geldpuffer geprüft.
- Die aus diesen Bedingungen unabhängig berechneten möglichen SURVEY-/BUY-Aktionen müssen **exakt** mit den tatsächlichen Vorschlägen von `PPStrategicAI.rank()` übereinstimmen. Bei Abweichung: FAIL.
- Jede Diagnose muss den Zustand unverändert lassen und bei Wiederholung dasselbe Ergebnis liefern. Hypothetische Startzustände müssen die Engine-Validierung bestehen.
- Ausgabe: `ai_investment_gates.json` als zeitlich begrenztes GitHub-Actions-Artefakt.

### Reproduzieren

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_investment_gates_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_investment_gates_v194.cjs > ai_investment_gates.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

CI: `.github/workflows/prerelease-ai-strategy-metrics.yml`.

## Tatsächliche Ergebnisse des neuen Tests

| Markt / Firma (unveränderte Startkasse) | A1 | A2 | A3 |
|---|---:|---:|---:|
| Normal: freie Konzessionen / mögliche Investitionsaktionen | 9 / 9 | 9 / 9 | **9 / 9** |
| Niedrigpreis: freie Konzessionen / mögliche Investitionsaktionen | 9 / 7 | 9 / 7 | **9 / 7** |
| Startkasse | 200.000 € | 200.000 € | 200.000 € |

Bei A3 sind **im ersten Spielzug weder Liquiditätspuffer noch Tage, ungelöste eigene Felder oder die Dreifeldergrenze** ein Hindernis. Unter Niedrigpreisen scheitern zwei der neun freien Konzessionen ausschließlich an der Rückflussprognose. Hypothetische Zuschläge von **50.000 € bzw. 150.000 €** ändern die Anzahl der möglichen A3-Investitionen in keinem der beiden Märkte.

**Wesentlicher Befund:** A3 besitzt zu Beginn 9 (normal) bzw. 7 (Niedrigpreis) zulässige SURVEY-Vorschläge, während die bisherige 36-Monats-Baseline für A3 im Normalmarkt 0 tatsächlich ausgeführte strategische Aktionen zeigt. Die anfängliche Kapital- oder Rentabilitätsschranke erklärt die Untätigkeit **nicht**. Der Unterschied entsteht erst im weiteren Ablauf; **ob** vorrangige Käufe durch A1/A2, Zugreihenfolge oder abgelehnte Ausführungen verantwortlich sind, ist noch offen. Die Anfangszustandsdiagnose beweist keine Ursache im Ausführungsmodul.

**Nächster fachlich notwendiger Test:** Zustände unmittelbar vor den Zügen A1, A2 und A3 desselben Monats vergleichen: verbliebene freie Felder, gültige KI-Vorschläge, tatsächliche Aktionen und abgelehnte Befehle mit Gründen. Danach einen kontrollierten Reihenfolgetausch prüfen, ohne den geschützten Kern zu verändern.

## Nachweise und offene Grenzen

- **Vorheriger Entwicklungs-HEAD:** `d99631540ea0506f5e9610d4ac1df4d7258eae57` (PR #137). [KI-CI #40893343328](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40893343328) PASS; [Offline-Browser-Gesamtregression #40893343101](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40893343101) inzwischen ebenfalls PASS. Integriertes Freigabegate bleibt erwartungsgemäß FAIL/BLOCKED.
- **Neuer Test:** [GitHub-KI-CI #40902856451](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40902856451) auf Test-HEAD `a48307f40d7490d3786fda2aa00c0f1db1e85f07`: **PASS** (Syntax/Rechenregression, 864 Baseline-Monate, 432 Profilrotations-Monate, 576 Reservevergleichs-Monate, 18 neue Anfangszustandsdiagnosen und JSON-Artefakt). [Quellschutz #40902856752](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40902856752): PASS. Das integrierte Vorrelease-Gate #40902856446 bleibt erwartungsgemäß FAIL/BLOCKED.
- **PR-Bestand:** am 29.10.2026 wurden 98 offene PRs, darunter 97 Entwürfe, gezählt. Die P0-Schuldenbremse aus [PR #139](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/139) ist noch nicht in `main`. **Kein neuer PR**: Erweiterung des bestehenden Entwurfs #137; keine Änderung an fremden PRs.
- **Grenze:** Die Diagnosen erklären nur, *welche* Schranke im ersten Spielzug greift. Sie messen weder die langfristige Rendite noch tatsächliche Ausführung, Schulden-/Sanierungseffekte, reale Marktanteile, historische C64-Treue oder Medienrechte.

## Nächste drei Schritte

1. CI auf dem endgültigen PR-HEAD prüfen, gegebenenfalls Fehler im Test und nicht im geschützten Spielkern korrigieren.
2. Den tatsächlichen A3-Befund aus dem JSON nach Ursachen ordnen; erst danach gezielt einen 36-Monats-Gegenvergleich mit realen Wirtschaftshandlungen planen.
3. Die 97 offenen Entwürfe nach der P0-Priorität geordnet konsolidieren; unabhängige Rechte- und C64-Referenznachweise weiterführen.

**Kein Merge, kein Release, keine persönliche Abnahme.**
