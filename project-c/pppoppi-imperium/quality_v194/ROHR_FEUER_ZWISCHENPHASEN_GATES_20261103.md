# Vorrelease-Pflichtpaket: Rohrnetz/Feuerwehr – Zwischenphasen-Neustarts

Stand: 2026-11-03. Ausgangs-HEAD: `c80e38d2517805f1e9b0d3c0da2e0f0681d145ba`. Grundlage: [PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Dies ist eine zusätzliche, prüfbare Testspezifikation, keine behauptete Testimplementierung.** Keine Änderung an Spielregeln, Spielständen oder Originalquellen.

## Abgrenzung und bereits belegte Basis

[CI #41553998179](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41553998179): Zoom-Kampagne für Rohrnetz/Feuerwehr SUCCESS auf dem Ausgangs-HEAD. [CI #41553998536](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41553998536): integrierte Freigabesperre FAILURE. Diese Ergebnisse beweisen **nicht** die hier neu geforderten Unterbrechungszeitpunkte. Der letzte dokumentierte Gesamtstand ist **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**; nicht erhöhen.

## Reproduzierbare Pflichtfälle

| ID | Szenario | Nachweis zum Bestehen | Status |
|---|---|---|---|
| RF-MID-01 | Rohrnetz: Abschnitt 1 abschließen, JSON exportieren, Browserprozess beenden, neu starten, JSON importieren | Phase, Geld, Material, Monatsindex, aktive Firma und Fortschritt vor/nach Import exakt gleich; Abschnitt 2 und 3 anschließend abschließbar | OPEN |
| RF-MID-02 | Rohrnetz: nach Abschnitt 2 gleicher Prozessneustart | Keine doppelte Belohnung, kein Rücksprung auf Abschnitt 1, vollständiger Abschluss möglich | OPEN |
| RF-MID-03 | Feuerwehr: nach Löschabschnitt 1 Neustart | Feuer-/Schadenszustand, Ressourcen und Phase unverändert; Fortsetzung bis Abschluss | OPEN |
| RF-MID-04 | Feuerwehr: nach Löschabschnitt 2 Neustart | Keine doppelte Kostenbuchung, kein übersprungener Abschnitt, Abschluss möglich | OPEN |
| RF-MID-05 | Jede der vier Varianten bei 800×600 und echtem Chromium-Zoom 175 % sowie 200 % | Tab/Shift+Tab, sichtbarer Fokus, Enter, keine Überdeckung, keine horizontale Pflichtnavigation | OPEN |
| RF-MID-06 | Negativfall: ungültiges/abgeschnittenes JSON je Minispiel | Fehler sichtbar, vorhandener Spielstand unverändert, keine unkontrollierte Ausnahme | OPEN |
| RF-MID-07 | Nach Neustart zwölf Spielmonate bis zum Archiv | Monatssumme, Abschlussarchiv und Spielzustand reproduzierbar; 0 unbehandelte JS-Fehler und 0 externe Anfragen | OPEN |
| RF-MID-08 | Regression gegen vorhandene 100-%- und 175/200-%-Kampagnen | Vorhandene CI bleibt grün, neue Jobs auf endgültigem HEAD grün | OPEN |

## Testdurchführung und Messdaten

Für **jede** der vier Zwischenphasen je Zoomstufe einen eigenständigen Browserprozess vor dem Export und einen neuen nach dem Export verwenden; nicht nur Seite neu laden. Vor und nach Import einen normalisierten Zustandsabzug speichern und vergleichen. Dynamische Zeitstempel, sofern vorhanden, nur mit dokumentierter Begründung ausnehmen. Den tatsächlich genutzten Importweg protokollieren: nativer Dateidialog ist nicht durch direkten Skriptimport ersetzbar. Je Fall HEAD-SHA, Workflow-Link, Testkommando, Browserauflösung, Zoom, Exportdatei-Hash, Zustandsvergleich, Fehlerkonsole und PASS/FAIL/BLOCKED aufzeichnen.

**Abbruch-/Fehlerregel:** Bei FAIL reproduzierbare Eingaben, erwartetes und tatsächliches Ergebnis sichern; nur den betroffenen Test als FAIL kennzeichnen. Andere unabhängige Pflichtfälle weiterbearbeiten. Bei BLOCKED Ursache, Abhängigkeit und nächsten konkreten Versuch dokumentieren. Kein BLOCKED als PASS, keine Freigabe allein durch grüne Teiltests.

## Nächste Umsetzung

1. Vorhandenen Rohrnetz-/Feuerwehr-Browserprüfer und Speicher-Helfer lesen; vorhandene Neustartlogik wiederverwenden, keine zweite Implementierung erfinden.
2. RF-MID-01 bis RF-MID-04 mit parametrisierten Zwischenphasen und echten Prozessneustarts implementieren; RF-MID-05 bis RF-MID-07 anschließen.
3. Isolierte Negativtests und alle betroffenen GitHub-Jobs auf dem **neuen** HEAD ausführen, Messwerte in dieser Tabelle ergänzen, Pflichtmatrix erst nach vollständigem Nachweis aktualisieren.

**Freigabe:** BLOCKED. Keine persönliche Sichtprüfung, kein Kubuntu-Endtest, kein Merge und kein Release vor abgeschlossener Technikmatrix, eingefrorenem Kandidaten und ausdrücklicher Nutzerfreigabe.

## Implementierungsstand 03.11.2026 – noch kein Test-PASS

Auf [Commit b93a66d](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/b93a66dcbc24352a03751cd63d3178c8308b12be) wurde der vorhandene Kampagnen-Browserprüfer um vier echte Chromium-Zwischenphasen-Neustarts erweitert (PIPE/FIRE jeweils nach Abschnitt 1 und 2). Die bestehende Export-/Importfunktion wird wiederverwendet, die Spielzustände werden vor Export, im JSON und nach Import vollständig verglichen. Erwartet werden acht statt vier Browserprozesse und sieben statt drei Sitzungsexporte. Spiel- und Speicherformat bleiben unverändert.

**Status RF-MID-01 bis RF-MID-04: IMPLEMENTIERT / TEST OFFEN, nicht PASS.** Der Quelltext wurde über GitHub nach dem Commit zurückgelesen. Zum Abfragezeitpunkt meldete GitHub für diesen Commit **0 PR-Workflow-Läufe**; weder Python-Syntaxprüfung noch Playwright-Browserlauf wurden in diesem Durchlauf ausgeführt. RF-MID-05 bis RF-MID-08 bleiben OPEN. Die Gesamtmatrix bleibt unverändert 6/52 PASS (historischer Stand). Nächste Prüfungen: `python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_campaign_pipe_fire_recovery_v194.py`, bestehende Kampagnen-CI bei 100/175/200 % auf dem **neuen** HEAD, dann beschädigte JSON-Importe und vollständige Release-Sperre. Kein Merge/Release.
