# Browser-CI: apt-Mirror-Haenger begrenzen (01.11.2026)

## Nachgewiesener Befund auf dem unveraenderten Integrations-HEAD

- Quelle: [GitHub-Actions-Lauf 41253167027](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41253167027), HEAD `61ebb2584a861d827b1abff363e5f5c6757db216`.
- Von 25 Workflows auf diesem HEAD: **23 SUCCESS**, **1 erwartetes FAILURE** der harten Vorrelease-Sperre und **1 CANCELLED** (Browser-Gesamtworkflow). Der Browser-Gesamtworkflow ist **nicht PASS**.
- Job `chromium-roundtrip`: elf vorgelagerte Node-Tests bestanden. Der folgende Schritt `Chromium-Testumgebung installieren` blieb nach dem Start von `playwright install --with-deps chromium` bei der apt-Paketspiegel-Abfrage stehen. Das Jobprotokoll zeigt ab 23:42:08 UTC bis zur Stornierung 00:06:50 UTC keinen weiteren Installationsfortschritt. Die eigentlichen Chromium-Pruefungen wurden **SKIPPED**. Zwei andere Jobs dieses Workflows bestanden. Kein nachgewiesener Spielfehler, aber ein unvollstaendiger Pflichtnachweis.

## Eng begrenzte Korrektur

- Nur im Job `chromium-roundtrip` den Systempaket-Installationsversuch auf **180 Sekunden** begrenzen (zusaetzlich 10 Sekunden zum Beenden), danach Chromium **ohne erneuten apt-Zugriff** installieren.
- **Kein gruenes Wegschlucken:** Die nachfolgenden echten Browserstarts und Tests bleiben unveraendert und entscheiden ueber PASS/FAIL. Fehlende Systembibliotheken verursachen dort weiterhin ein echtes FAIL. Der Job-Gesamtzeitrahmen wird von 25 auf **35 Minuten** erhoeht, um Installations- und Testzeit voneinander zu entkoppeln.
- Die sieben anderen Browserjobs bleiben unveraendert. Spielkern, Spielstaende, Medien und `main` werden nicht bearbeitet.

## Pruefmatrix / Abnahme

| Pruefung | Status zum Commitzeitpunkt | Nachweis |
|---|---|---|
| Fehlerursache im alten CI-Log eingegrenzt | PASS | Run 41253167027, Job 124690713645 |
| Node-Vortests im alten Browserjob | PASS | Run 41253167027, Schritte 5-15 |
| Chromium-Tests im alten Browserjob | BLOCKED | Ab Installationsschritt abgebrochen; Browser-Schritte uebersprungen |
| Neuer YAML-/Workflow-Lauf auf diesem Commit | PENDING | Erst auf finalem HEAD auswerten |
| Spiel-Vorrelease-Gesamtfreigabe | BLOCKED | Pflichtmatrix 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED |

## Naechste technische Schritte

1. Browser-Gesamtworkflow auf dem neuen HEAD auswerten: bei PASS die zuvor uebersprungenen Chromium-Schritte einzeln nachweisen; bei FAIL Installations- und Browserfehler unterscheiden.
2. Den weiterhin sporadischen nativen Dateiimportfehler bei 175/200 % Zoom mit reproduzierbaren Diagnosedaten kausal beheben.
3. Unabhaengig davon mehrmonatige Vertragszyklen mit natuerlichen Zahlungskrisen und Sanierung bis zur Endwertung pruefen.

**Keine Releasefreigabe, kein Merge, keine persoenliche Endabnahme.**
