# Projekt C – nativen Dialogabschluss vor erneuter Feldauswahl synchronisieren

**Stand:** 27.10.2026. **Basis:** PR #93, HEAD `a62a29922d3f96c8765a0944dbb44b5c455377f3`; **main vor der Arbeit:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Bereich:** ausschliesslich Testschicht und Pflichtmatrix, keine Spieloriginale.

## Beleg und Ursache als Hypothese

[Chromium-CI #40571243683](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40571243683): `claim-dialog-stability` PASS mit **216/216** Feldauswahlen (vier Dialoge, neun Felder, drei Runden je 175/200 %). `native-zoom-regression` dagegen FAIL bei **175 % / BERLIN-3 / BUY / 1**: `dialogOpen=true`, `selected=null`, `buttons=[]`, Phase `TURN`. Die zwei weiteren Browserjobs PASS; Quellpruefung #40571243643 PASS. Damit ist die Gesamt-Browser-CI FAIL.

Der gemeinsame `new_page()`-Helfer wartete nach Escape bisher nur auf `dialog.open === false`. Der im Original vorhandene `close`-Ereignisbehandler setzt `active=''`. Das native `close`-Ereignis wird asynchron zugestellt: Ein sofortiges erneutes Oeffnen kann daher mit einem noch ausstehenden alten `close`-Handler kollidieren. **Dies ist eine technisch begruendete, noch nicht abschliessend bewiesene Fehlerhypothese**, kein nachgewiesener Spielfehler und keine historische C64-Aussage.

## Kleinstmoegliche technische Aenderung

- `test_browser_native_zoom_flow_v194.py`: vor Escape einen einmaligen `close`-Listener installieren; erst nach tatsaechlichem Ereignis, geschlossenem Dialog und geleertem `active` die neue Szene oeffnen. **Kein Retry, keine Manipulation des Spielstands, kein Unterdruecken eines Fehlers.**
- `test_browser_claim_parameters_v194.py`: die korrekte aktive Szene explizit pruefen; bei Fehlern aktive Szene, Titel, Inhaltslaenge und Navigationszustand protokollieren.
- `test_browser_dialog_select_stability_v194.py`: aktive Szene nach Oeffnen pruefen und Navigationszustand in Fehlerdiagnose aufnehmen.
- `prerelease/matrix.json`: nachgewiesenen PASS des isolierten Jobs und FAIL des Claim-Parameter-Jobs unterscheiden. **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED** bleiben unveraendert.

## Abnahme und Grenzen

Gezielte Befehle:
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_claim_parameters_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_dialog_select_stability_v194.py
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

**CI-Status bei Implementierung:** PENDING; erst nach Pruefung auf dem finalen neuen HEAD PASS oder FAIL eintragen. Auch bei gruenen Tests ist die Ursache nicht abschliessend bewiesen. Es fehlen fachliche Endspielregeln, vollstaendige Sieg-/Niederlagenpartien und weitere Release-Gates.

## Drei naechste Schritte

1. Neue Browser- und Quell-CI auswerten; bei FAIL aktive Szene und DOM-Protokoll gezielt untersuchen.
2. Unabhaengige Speicher-/Fehlerfaelle und den Endregelvertrag bearbeiten.
3. Vollstaendige Endpartien und technische Freigabegates belegen; persoenliche Sicht-/Kubuntu-Abnahme erst am eingefrorenen Kandidaten.

**Kein Merge, kein Release, keine Aenderung an main oder den 110 geschuetzten Originaldateien.**
