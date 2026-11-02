# Projekt C – Dialog-Feldauswahl bei Claim-Rundläufen stabil prüfen

**Stand:** 27.10.2026 · **Entwicklungszweig:** `automation/prerelease-claim-dialog-stability-20261027-1738` · **Basis:** PR #89, HEAD `f0efbbff1317690561b576ece2997709bc6c5d1a` · **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360` bei Vorprüfung.

## Belegter Fehler

Die zuvor ausstehende [Chromium-CI #40535544233](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40535544233) ist **FAIL**, nicht PASS. Nach erfolgreichen Export-/Import-Rundläufen bis **175 % / NORD-2** schlug die nächste frische Partie **175 % / NORD-3** vor der ersten BUY-Aktion fehl: `Page.wait_for_function: Timeout 8000ms exceeded`, `test_browser_claim_parameters_v194.py` in `activate()`, Zeile 55 auf altem HEAD. Der Test wartete auf die ausgewählte Feldkennung und genau einen passenden Aktionsknopf. Die CI belegt daher **keine 18/18 PASS** auf HEAD `f0efbbf`. [Älterer vollständiger PASS #40533304063](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40533304063) gilt ausschließlich für den dort geprüften Code-HEAD `5fb28d930a9e3771d5f84809c12a4921fa0a1656`.

## Gezielte Änderung (Test, kein Spielkern)

1. Vor der Feldwahl auf den **geöffneten Dialog, das Auswahlfeld und die tatsächlich verlangte Aktionskennung** warten – statt auf irgendeinen Wirtschaftsbutton.
2. Nach der Auswahl zwei Browser-Zeichenzyklen für die durch das `change`-Ereignis ausgelöste Neudarstellung abwarten. Danach unverändert den exakten Feld-/Aktionsknopf prüfen.
3. Vor und nach der Feldauswahl die Spielstände vergleichen: Die reine Auswahl darf keine Wirtschaftsaktion ausführen.
4. Bei erneuter Zeitüberschreitung **nicht** klicken, nicht automatisch neu auswählen und keinen Spielstand korrigieren. Stattdessen den realen Dialogzustand mit Auswahlwert, verfügbaren Optionen, Knöpfen und Spielphase im Fehlertext ausgeben.

**Datei:** `project-c/pppoppi-imperium/quality_v194/test_browser_claim_parameters_v194.py`. Die 110 manifestgeschützten Originaldateien bleiben unverändert. Das ist eine Verbesserung der Prüfsynchronisierung und Fehlersuche, **keine nachgewiesene Behebung eines Spielfehlers**.

## Reproduzierbarkeit und harte Grenzen

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_claim_parameters_v194.py
```

**Sollumfang:** 9 Felder × 175/200 % echter Browserzoom × 10 Tastaturaktionen = 180 Aktionen (108 Erfolge, 72 Ablehnungen) und 18 Export-/Import-Rundläufe. Nur ein abgeschlossener erfolgreicher Chromium-Lauf auf dem neuen HEAD kann diese Zahlen als tatsächliches Ergebnis bestätigen. Bis dahin **PENDING**; die Wiederholungs-CI des Vorläufers ist **FAIL**. Die Pflichtmatrix bleibt **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**. Kein historischer Originalvergleich, kein vollständiger Browser-Profil-Neustart und kein Sieg-/Niederlagen-Endspiel nachgewiesen.

## Nächste drei technischen Schritte

1. Chromium-, Quell- und Pflichtmatrix-CI auf dem neuen HEAD prüfen; bei FAIL die neue strukturierte Diagnose auswerten und eine konkrete Ursache statt blindem Wiederholen beheben.
2. Nach grünem Teilergebnis weitere Aktionsfamilien (Verträge, Raffinerie, Transport und Sanierung) mit Sollfolgen und unabhängigen Speicherkontrollen absichern.
3. Eigenständigen Endregelvertrag vervollständigen und natürliche vollständige Sieg-/Niederlagenpartien einschließlich Profil-Neustart testen; persönliche Sichtprüfung und Kubuntu-Endabnahme erst danach.

**Vorrelease:** BLOCKED. Kein Merge, keine Veröffentlichung, keine vorgezogene persönliche Endabnahme.
