# Chromium-CI: Fehlersperren und Ersatzweg automatisch pruefen (01.11.2026)

## Anlass und verifizierte Basis

- Spiel: PPPOPPI IMPERIUM, [Draft-PR #141](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/141).
- Unveraenderter Ausgangs-HEAD: `31698acab471f2b57335ce5d0a2eb5d793d0c591`.
- Auf diesem HEAD sind **25/25 GitHub-Workflows abgeschlossen: 24 SUCCESS, 1 erwartetes FAILURE** der technischen Vorrelease-Sperre. [Browser-Gesamtworkflow #41261581062](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41261581062): **8/8 Browserjobs SUCCESS**. [Matrix-Sperre #41261581177](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41261581177): FAILURE ausschliesslich im Schritt `Technische Pflichtmatrix`.
- Die vorherige Installation mit Zeitgrenzen hat damit auf diesem HEAD im echten GitHub-Runner funktioniert. Das ist **kein** Beweis, dass ein kuenftiger Ausfall korrekt abgefangen wird.

## Neues, unabhaengiges Pflichtarbeitspaket

- `quality_v194/test_install_chromium_ci.py` fuehrt das **unveraenderte echte Installationsskript** mit einem isolierten `timeout`-Testersatz aus. Kein Netz, kein apt, keine produktiven Spielstaende.
- Fuenf Szenarien: Normalinstallation mit zwingender Browser-Startprobe; fehlgeschlagener Systempaketweg mit Ersatzinstallation; Pip-Fehler; beide Installationswege defekt; fehlgeschlagener Browserstart.
- Die Testfaelle kontrollieren die tatsaechliche Befehlsreihenfolge, die Zeitgrenzen (120/180/180/60 Sekunden), den Abbruch bei Fehlern und das Vorhandensein der echten Chromium-Startprobe im Shell-Skript.
- Der bestehende Browser-Gesamtworkflow fuehrt diese Regression **vor der echten Installation** aus. Alle acht Browserjobs behalten weiterhin die echte Installation und ihre unabhaengigen Browsertests. Kein Fehler wird auf PASS umgedeutet.

## Nachweis und Grenzen

| Pruefung | Status | Beleg |
|---|---|---|
| Lokaler Python-3.13-Unittest (fuenf Szenarien) | PASS 5/5 | `python3 -m unittest discover -s /mnt/data/oli_ci_regression -p 'test_install_chromium_ci.py' -v` im isolierten Arbeitsverzeichnis; gleichlautende Datei vor Commit |
| Lokale Shell-Syntax des unveraenderten Installers | PASS | `bash -n install_chromium_ci.sh` |
| Lokale Python-Syntax des neuen Tests | PASS | `python3 -m py_compile test_install_chromium_ci.py` |
| Neuer GitHub-Workflow auf finalem Commit | PENDING | Erst GitHub-Actions-Status auf dem neuen HEAD entscheidet |
| Echte Installation und Start im GitHub-Runner auf Ausgangs-HEAD | PASS | [#41261581062](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41261581062) |
| Vollstaendige Spiel-Vorrelease-Freigabe | BLOCKED | [52er-Pflichtmatrix](../prerelease/matrix.json): 6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED |

Die Simulation prueft die **Fehlerweitergabe und Reihenfolge**, nicht die Zuverlaessigkeit des apt-Mirrors oder echte Systembibliotheken. Nur die GitHub-Browserjobs pruefen den realen Start. Die originale Spielengine, 110 geschuetzte Quelldateien, `main` und die Matrixstatus werden nicht geaendert.

## Naechste drei Pflichtschritte

1. Neue GitHub-Pruefungen auf dem **neuen** Commit komplett auswerten und unerwartete FAILs beheben.
2. Sporadisch ausbleibenden nativen Dateiimportdialog bei 175/200 % anhand der bereits eingebauten Ereignisdiagnose kausal eingrenzen; keine Retry-Heilung.
3. Unabhaengig davon wiederholte Regionalvertraege mit natuerlichen Zahlungskrisen und Sanierung bis zur Endwertung absichern.

**Status: DRAFT / BLOCKED. Kein Merge, kein Release, keine persoenliche Sicht- oder Kubuntu-Endabnahme.**
