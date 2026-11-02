# BED-03 / SPE-01 / VER-03 – Bohr-Minispiel: Unterbrechung nach Abschnitt 1

**Datum:** 02.11.2026 · **Repository:** provoware/PROJEKT_Oli_Imperium · **PR:** [#155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155) (Draft) · **Status:** Testimplementierung, neue CI noch ausstehend.

## Anlass und Wirkung

Der bisherige echte 12-Monats-Browserlauf pruefte das Wiederaufnehmen eines Bohrspiels nur **vor** dem ersten abgeschlossenen Abschnitt. Ein Zustand nach Abschnitt 1 konnte deshalb beim Export/Import unbemerkt zurueckspringen, doppelt Kosten buchen oder einen Abschnitt ueberspringen.

## Konkrete Umsetzung

- Den bestehenden Test `test_browser_campaign_drill_recovery_v194.py` erweitert, ohne Spielkern oder 110 Originaldateien zu aendern.
- Nach Abschluss von Abschnitt 1 den exakten Zustand mit aktivem Abschnitt 2 sichern und ueber den sichtbaren Sitzungsexport als JSON ausgeben.
- Chromium vollstaendig beenden, in einem frischen Prozess importieren, auf Abschnitt 2 warten und **gesamten Zustand exakt vergleichen**; Archiv muss weiterhin fehlen, Kampagne aktiv bleiben.
- Anschliessend Abschnitte 2 und 3 per Tab/Home/Pfeiltasten/Enter abschliessen, Wirtschaftszustand nach jedem Schritt validieren, 12 Monate beenden und Abschlussarchiv nach erneutem Neustart unveraendert pruefen.
- Erwartet: **vier** Chromium-Prozesse, **drei** Sitzungsexporte, keine externen Anfragen, keine JavaScript-Laufzeitfehler, 800×600 ohne horizontalen Ueberlauf.

## Reproduktion und Belege

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_campaign_drill_recovery_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_drill_recovery_v194.py
```

Der bestehende [GitHub-Workflow](https://github.com/provoware/PROJEKT_Oli_Imperium/blob/test/oli-campaign-24-60-20261101/.github/workflows/prerelease-campaign-drill.yml) fuehrt beide Schritte auf dem PR-Zweig aus. **Neuer Test: bis zur tatsaechlichen CI-Ausfuehrung PENDING, nicht PASS.** Ausgangs-CI auf `5d2722ac3c6a954ad3feab964f36cbdc9435fe2a`: [Browser-Rundlauf #41530495777](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41530495777) mit neun erfolgreichen Jobs; die separate integrierte Vorrelease-Sperre bleibt absichtlich rot.

**Abgrenzung:** Keine behauptete C64-Originaltreue, keine geaenderte Speicherstruktur, kein Release. Gesamtmatrix unveraendert 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED. Benutzer-Sichtpruefung und Kubuntu-Endabnahme erst nach allen technischen Gates und Kandidaten-Freeze.

## Naechste drei Schritte

1. Neuen GitHub-Job auf **dem neuen HEAD** pruefen; bei FAIL gezielt korrigieren.
2. Unterbrechung nach spaeteren Minispielphasen und nativen 175/200-%-Zoom getrennt pruefen.
3. Verbleibende technische, rechtliche und historische Freigabepflichten ohne voreilige Endabnahme abarbeiten.

## Ausgefuehrter Zwischenstand

[GitHub-CI #41538410505](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41538410505) auf `92f7424dce34e6ad567fe7fdde88b61b77e6c8ee`: **PASS** fuer Python-Syntax und vollstaendige echte Chromium-Kampagne. Log meldet `chromium_processes=4`, `session_exports=3`, `drill_stages=3`, `months=12`, `reports=12`, keine JavaScript-Fehler oder HTTP-Anfragen. Nach diesem Lauf wurde ausschliesslich die missverstaendliche Beschriftung des Archivtests von drittem auf vierten Prozess berichtigt; **erneute CI auf dem letzten HEAD erforderlich**.
