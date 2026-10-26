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
