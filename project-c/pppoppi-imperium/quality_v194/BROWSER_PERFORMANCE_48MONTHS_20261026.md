# Vorrelease-Pflichtpaket: 48 echte Browser-Spielmonate mit Speicherprofil

**Stand: 26.10.2026, Projekt C / PPPOPPI IMPERIUM.** Nur der getrennte Entwicklungszweig; `main` und die 110 Originaldateien bleiben unverändert.

## Gesicherte Ausgangslage

- Basis: [Entwurfs-PR #64](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/64), HEAD `61224621f417f5bcc276d05937f0b6718d3ffa56`.
- [Chromium-CI #40352241725](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40352241725): **PASS** für drei getrennte 12-Monats-Profile, insgesamt 36 Browser-Spielmonate.
- [Quell-/Fach-CI #40352242054](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40352242054): **PASS**.
- [Gesamtmatrix #40352242132](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40352242132): **FAIL/BLOCKED** wegen offener Vorrelease-Pflichten.

Die bisherigen drei kurzen Durchläufe ergaben jeweils rund 0,96 MB **bereinigten** JavaScript-Speicherzuwachs zwischen Monat 0 und 12. Daraus ist weder ein Speicherleck noch eine langfristige Stabilitätszusage ableitbar.

## Umsetzung und Nachweisplan

Das vorhandene Chromium-Prüfprogramm unterstützt jetzt zwei **fest begrenzte** Laufzeiten: 12 Monate (unveränderter Standardlauf) und 48 Monate (zusätzlicher Langlauf). Die neue CI-Stufe verwendet `PPPOPPI_PERF_MONTHS=48`; andere Werte werden abgelehnt.

Die 48-Monats-Prüfung startet das Spiel offline aus einer **temporär gebauten** `file://`-Vorschau bei 800 × 600, führt reguläre Klicks für jeden Monatsabschluss aus, kontrolliert jeden Monatsbericht und prüft externe HTTP-Anfragen sowie JavaScript-Laufzeitfehler. Chromium misst nach expliziter Speicherbereinigung bei Monat **0, 12, 24, 36 und 48** Speicher, DOM-Knoten und Dokumente. Zusätzlich werden die einzelnen Monatszeiten und der gesamte bereinigte Speicherunterschied ausgegeben.

**Wichtig:** Ein natürlicher Spielabbruch vor Monat 48 ist ein diagnostisch relevanter **FAIL**, nicht automatisch eine erfolgreiche 48-Monats-Partie. Kein künstliches Weiterklicken, keine manipulierten Spielstände. Ein bestandener Langlauf beweist **nicht**, dass alle Spielwege, Endzustände oder Speicherlecks ausgeschlossen sind.

## Wiederholung

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_performance_v194.py
PPPOPPI_PERF_MONTHS=48 python3 project-c/pppoppi-imperium/quality_v194/test_browser_performance_v194.py
```

Voraussetzung: Python mit Playwright und installiertem Chromium sowie Node.js für den isolierten Bau. Die CI installiert diese Testumgebung separat.

## Pflichtmatrix und Freigabe

- **PER-01 (Start-/Ladezeiten): BLOCKED** bis begründete Leistungsgrenzen und vollständige Umgebungsabdeckung dokumentiert sind.
- **PER-02 (lange Partien/Speicher): BLOCKED** bis der 48-Monats-Lauf ausgewertet, mehrere Endzustände untersucht und der Speicherverlauf fachlich eingeordnet ist.
- **VER-01 (vollständige Partie bis Sieg oder Ende): BLOCKED**; 48 Monatswechsel sind kein nachgewiesener Sieg-/Endpfad.
- Weitere offene Pflichtgates, insbesondere Browserzoom, vollständige Tastaturbedienung, technische Gesamtmatrix und abschließende Release-Unterlagen, bleiben unverändert.
- **Matrix: 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach technischem Abschluss und eingefrorenem Kandidaten.

## Nächste sachgerechte Schritte

1. Die **tatsächlichen** CI-Ergebnisse der 48-Monats-Stufe am finalen HEAD prüfen, Laufzeit- und Speicherwerte in diesem Dokument ergänzen.
2. Bei FAIL Ursache untersuchen und gezielt korrigieren; sonst 48-Monats-Verlauf und gespeicherte Historie gegen erwartbares Wachstum bewerten.
3. Anschließend einen **echten Spielendepfad** und die verbleibenden Zoom-/Tastaturfälle unabhängig prüfen.

**Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.**

## Tatsächliche GitHub-Ergebnisse des Implementierungs-HEADs

**Geprüfter Code-HEAD:** `31316cbef73309637050692d44b13ce086993ad5`.

- [Chromium #40360438778](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360438778): **PASS**. Alle 16 bisherigen Browser-Prüfprogramme sowie die neue 48-Monats-Stufe erfolgreich; keine gemeldeten Laufzeitfehler.
- [Quell-/Fach-CI #40360438881](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360438881): **PASS**.
- [Gesamtmatrix #40360438766](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40360438766): **FAIL/BLOCKED** wegen weiterhin offener Pflichten.

| Bereinigter Speicher / Messwert | Monat 0 | Monat 12 | Monat 24 | Monat 36 | Monat 48 |
| --- | ---: | ---: | ---: | ---: | ---: |
| JavaScript-Heap (Bytes) | 2.116.960 | 3.076.576 | 3.144.856 | 3.226.588 | 3.389.820 |
| DOM-Knoten | 1.032 | 1.032 | 1.032 | 1.032 | 1.032 |
| Dokumente | 1 | 1 | 1 | 1 | 1 |

**48/48 reguläre Monatswechsel und 48/48 Berichte:** PASS. Offline-Ladezeit **0,0762 s**, Monatswechsel-Median **0,3469 s**, langsamster Monat **0,5772 s** auf dem GitHub-Linux-Testrechner. Bereinigter Heap: **+1.272.860 Bytes** in 48 Monaten, davon **+313.244 Bytes** zwischen Monat 12 und 48. Der Verlauf ist mit gespeicherter Historie vereinbar, beweist aber noch keine Leckfreiheit. Die Monatswechsel werden im Verlauf messbar langsamer; Ursache und zulässige Grenzwerte sind weiter zu untersuchen.

**Freigabe unverändert:** 6/52 PASS; PER-01, PER-02 und VER-01 bleiben BLOCKED. Keine vollständige Sieg-/Endpartie nachgewiesen. Keine persönliche Abnahme, kein Merge, kein Release.
