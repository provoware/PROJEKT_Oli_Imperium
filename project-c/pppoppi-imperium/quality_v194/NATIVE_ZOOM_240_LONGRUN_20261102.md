# OLI V1.9.4 – 240-Monats-Kampagnen mit echtem 175/200-%-Browserzoom

**Datum:** 02.11.2026. **Zweig:** `test/oli-campaign-24-60-20261101`, [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Status:** Technische Erweiterung, keine Freigabe und kein Merge.

## Ausgangslage und verifizierter Nachweis

Der bisherige 120-/240-Monats-Browserpruefer `test_browser_campaign_120_240_v194.py` akzeptiert bereits `--months 240 --zoom 175|200`. Auf Ausgangs-HEAD [bc178df3eee1b14abcb6675aae4602b6bcec4744](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/bc178df3eee1b14abcb6675aae4602b6bcec4744) sind im [GitHub-Lauf #41362988561](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41362988561) alle **8 Jobs erfolgreich** abgeschlossen: 24/120/240-Monats-Kampagnen, 120-/240-Monats-Wiederholungen, Regressionen sowie 120-Monats-Zoom bei 175 % und 200 %. Dies belegt **nicht** den neuen 240-Monats-Zoompfad.

## Neues zusammenhaengendes Pflichtpaket

Der bestehende Workflow `.github/workflows/prerelease-campaign-duration.yml` enthaelt einen zusaetzlichen, unabhaengigen Matrix-Job `browser-campaign-240-native-zoom` mit **175 %** und **200 %**. Beide Jobs benutzen unveraendert denselben echten Chromium-MV3-Tab-Zoom wie die erfolgreichen 120-Monats-Laeufe; es gibt **keinen CSS-Zoom-Ersatz** und keinen geaenderten Spielkern.

Jeder Job muss 240 Monate mit vier Menschen (960 Tastaturzuege), Halbzeit-Export/Import, zwei vollstaendige Prozessneustarts (drei Chromium-Prozesse), Monats- und Sanierungspruefungen, Archiv-Snapshot und Rangfolge, maximal 120 gespeicherte Berichte, 800x600-Fenster, fehlende externe HTTP-Anfragen und fehlende JavaScript-Fehler nachweisen. Fehler schlagen den jeweiligen Job fehl; `fail-fast: false` erhaelt die Ergebnisse beider Zoomstufen. Ein Zeitlimit von 55 Minuten pro Job begrenzt haengende Browserpruefungen; ein Timeout ist **FAIL**, kein PASS.

**Reproduzierbare Befehle (Chromium/Playwright/Node vorausgesetzt):**

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 240 --zoom 175
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_120_240_v194.py --months 240 --zoom 200
```

## Pflichtmatrix und ehrlicher Status

| IDs / Bereich | Teilpruefung | Status vor neuem GitHub-CI |
|---|---|---|
| VER-01, VER-03 | 240 Monate, Zwischenstand, Neustart und Endarchiv | PENDING (neue Zoomstufen) |
| SPE-01 | Zustand und Archiv nach Export/Import unveraendert | PENDING |
| BED-02, BED-03 | 960 Tastaturzuege und echter Tab-Zoom bei 800x600 | PENDING, nicht vollstaendige Tab-Navigation |
| GRA-02, GRA-03 | Seitenueberlauf bei jedem Monat | PENDING, nicht alle Dialoge/Szenen |
| PER-01, PER-02 | 240-Monats-Leistungsprofil bei Zoom | PENDING; Grenzwerte weiterhin BLOCKED |
| QUE-04 | Medienherkunft, Lizenz und historische C64-Originaltreue | BLOCKED, nicht Teil dieser Browserpruefung |

**Gesamtmatrix `project-c/pppoppi-imperium/prerelease/matrix.json`: unveraendert 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.** Ein Teiltest darf keine ganze Pflicht als bestanden markieren. Die bestehende harte Vorrelease-Sperre bleibt bestehen. Die separat nachgewiesene Luecke des **nativen Dateiauswahldialogs bei 200 %** bleibt BLOCKED: `set_input_files()` testet den Import, aber nicht den menschlich bedienten Dialog. Ebenso offen: vollständige Szenen-/Fokusabdeckung, begruendete Leistungsgrenzwerte, Vermoegensbewertung, Medienrechte und Originalreferenz.

## Pruefprotokoll und naechste technische Umsetzung

- **PASS:** Acht bestehende Jobs auf Ausgangs-HEAD `bc178df3`, GitHub #41362988561.
- **PASS (statische Vorbereitung):** Workflow-Job mit zwei unabhaengigen Zoomwerten und explizitem 240-Monats-Befehl eingefuegt; die Ausfuehrung selbst ist damit noch nicht belegt.
- **PENDING:** Neue 240-Monats-Zoomjobs und uebrige CI auf dem abschliessenden Dokumentations-HEAD. Bis zur Auswertung **kein behaupteter PASS**.
- **BLOCKED:** Vollstaendige Vorreleasefreigabe; kein Merge, keine Veroeffentlichung, keine vorgezogene persoenliche Sicht-/Kubuntu-Endabnahme.

**Naechste drei Schritte:** (1) CI beider 240-Monats-Zoomjobs auf dem abschliessenden HEAD pruefen und reale Laufzeiten/Fehler dokumentieren; (2) bei FAIL den konkreten Monat/Zoom/Fokus-/Archivschritt reproduzieren und gezielt korrigieren; (3) anschliessend den nativen Dateiauswahldialog und vollstaendige Tab-Reihenfolge separat technisch pruefen, ohne vorhandene Schutzregeln abzuschwaechen.
