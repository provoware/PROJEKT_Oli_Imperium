# Vorrelease: Zeitgrenzen fuer Chromium-Installation (01.11.2026)

## Ziel und Ausgangslage

Pflichtgate **TES-04** bleibt **BLOCKED**. Im Browser-Gesamtworkflow gab es acht unabhaengige Jobs; nur `chromium-roundtrip` hatte bisher eine zeitliche Begrenzung des Playwright-Systempaket-Aufrufs. Sieben weitere Jobs riefen `python -m playwright install --with-deps chromium` ohne eigene Zeitgrenze auf. Bei langsamen oder haengenden Ubuntu-Paketservern konnte die Installation die gesamte Jobzeit verbrauchen, bevor ein echter Browsertest startete. Dies ist eine CI-Robustheitskorrektur, **keine Behebung** des sporadischen nativen Dateiimportfehlers.

## Umsetzung (nur Entwicklungszweig, kein Spielkern)

- Gemeinsames `quality_v194/install_chromium_ci.sh` fuer **alle acht** Browserjobs in `.github/workflows/prerelease-browser-project-c.yml`.
- Playwright 1.56.0 installieren: 120 Sekunden Obergrenze.
- Systempakete + Chromium: 180 Sekunden Obergrenze, bei Fehler/Timeout einmaliger Versuch ohne `apt`, ebenfalls maximal 180 Sekunden.
- Anschliessend **echter Chromium-Start** in maximal 60 Sekunden. Fehlt eine Systembibliothek oder startet Chromium nicht, scheitert der Job sichtbar. Keine Tests ueberspringen, keine versteckten Wiederholungen der eigentlichen Browserproben.
- Die vorhandenen acht voneinander unabhaengigen Browserjobs und alle Tests bleiben erhalten.

## Nachweise und klare Grenzen

- Vorheriger Vergleichs-Workflow: [GitHub #41257365597](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41257365597) — alle acht Jobs SUCCESS. Das beweist die Browserfunktionen nur auf dessen damaligem HEAD, nicht auf dem neuen.
- Neue Umstellung: [Commit abbe76f](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/abbe76fd63d199035f45cdcf2063ae91c5f3fa9a) (Hilfsskript) und [Commit 5b044b3](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/5b044b3637b0aac3cb66c2891402a94aaf2b06b5) (acht Aufrufstellen).
- Statische Gegenpruefung der GitHub-Datei: **8/8** Jobs verwenden das gemeinsame Skript; **0** direkte ungeschuetzte `--with-deps`-Aufrufe im Workflow.
- Lokale, isolierte Shell-Proben mit einem ersetzten Python-Befehl: `bash -n` PASS; Systeminstallation erfolgreich -> Exit 0 (3 Aufrufe); Systeminstallation fehlerhaft, Fallback erfolgreich -> Exit 0 (4 Aufrufe); beide Installationen fehlerhaft -> Exit 1 (3 Aufrufe). **Kein realer Chromium-Start im lokalen Mocktest**.
- [Neue GitHub-Browser-CI](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41261536572) zum Zeitpunkt dieser Dokumentation **PENDING**. Erst deren erfolgreich abgeschlossene Jobs auf demselben Commit belegen die tatsaechliche Wirksamkeit im Runner.
- Unabhaengiger Blocker: der native Dateiimport bei 175/200 Prozent kann weiterhin sporadisch ohne Dateiauswahldialog scheitern. Kein Workaround, kein Gruenstempeln.

## Naechste Pflichtarbeiten

1. Neue Browser-CI auf dem **endgueltigen PR-HEAD** vollstaendig auswerten; bei Installationsfehlern Logs und Jobschritte dokumentieren.
2. Sporadischen Dateiimportfehler mit echter Benutzeraktivierung, Tastatur und Dateiauswahl bei 175/200 Prozent isoliert reproduzieren und kausal beheben.
3. Alle uebrigen technischen Pflichtgates einschliesslich Endpartien, Speicherwiederherstellung, Rechte und historischer Referenz pruefen. Persoenliche Sicht-/Kubuntu-Abnahme erst nach technisch eingefrorenem Kandidaten.

**Vorrelease: BLOCKED.** Kein Merge nach `main`, kein Release, keine persoenliche Abnahme.
