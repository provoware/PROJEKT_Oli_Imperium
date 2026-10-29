# Teilnachweis – Rohrnetz und Feuerwehr in einer 12-Monats-Kampagne (29.10.2026)

**Geltungsbereich:** Nur Projekt C, technische PPPOPPI-Adaption V1.9.4 ueber V1.9.3-Spielkern. Keine C64-Originaltreue. Kein Merge und kein Release.

## Ausgangsbasis und Abhaengigkeiten

- GitHub-`main` bei Vorpruefung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelter Basiszweig: [Entwurfs-PR #125](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/125), HEAD `32db06e39efedc963887f19060aea141cd7e0e64`.
- Neuer Entwurfs-PR: [#126](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/126).
- Nur neue Testdatei und Workflow sowie dieses Protokoll und die Matrix werden bearbeitet; die 110 manifestgeschuetzten Originaldateien bleiben unveraendert.

## Reproduzierbarer Pflichtfall

1. `node project-c/pppoppi-imperium/quality_v194/build.cjs <temporärer-zielordner>` erzeugt eine separate Offline-Vorschau und prueft das 110-Dateien-Inventar.
2. Vier menschliche Firmen, 12-Monats-Kampagne; H1 erkundet, kauft und bohrt `BERLIN-1` ueber echte Browseraktionen.
3. Rohrnetz starten, mitten in Abschnitt 1 versioniert exportieren, Chromium vollstaendig beenden und aus Datei neu starten. Alle drei Rohrabschnitte mit Tab/Enter loesen; keine doppelten Buchungen.
4. Drei echte Monatsabrechnungen; im vierten Monat natuerlichen Brand erkennen. Feuerwehreinsatz beginnen, einen falschen Versuch ausloesen, exportieren und nach erneutem Chromium-Neustart alle drei Loeschphasen per Tastatur abschliessen.
5. Die Kampagne bis Monat 12 fortsetzen, alle 12 Berichte und Endwertung pruefen, Abschlussarchiv exportieren, in viertem Chromium-Prozess wiederherstellen und die Schreibsperre testen.
6. 800×600, keine horizontalen Ueberlaeufe, keine HTTP(S)-Anfragen und keine JavaScript-Laufzeitfehler kontrollieren.

**Testbefehl (GitHub Actions / Python 3.12, Playwright 1.56.0, Chromium):**

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_campaign_pipe_fire_recovery_v194.py
```

**Eigenstaendiger Workflow:** [prerelease-campaign-pipe-fire.yml](../../../.github/workflows/prerelease-campaign-pipe-fire.yml).

## Tatsachliche Pruefbeobachtungen

- [Erster CI-Lauf #40812981714](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40812981714): **FAIL** nach erfolgreichem Rohrnetz-Export und exaktem Import. Ursache: Der Test oeffnete danach die Pipeline-Menueszene statt der Werkstatt, in der die aktive Minispieloberflaeche gerendert wird. Dies ist ein Fehler im neuen Test, kein nachgewiesener Spielkernfehler.
- Korrektur im Test: Nach Import wird die Werkstatt geoeffnet; periodische Folgebrandereignisse in spaeteren Monaten werden nicht faelschlich als unmoeglich behandelt.
- **PASS 273/273, 0 FAIL** auf dem getesteten Code-HEAD `b27cf029fb142f51c88bc9ba6c557383c5094300`: [Chromium-CI #40813079428](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40813079428). Die GitHub-Joblogs bestaetigen vier echte Chromium-Prozesse, drei Rohr- und drei Loeschabschnitte, 32 Tastatur-Rohrdrehungen, einen Fehlversuch, 12 Monatsberichte, drei versionierte Exporte, Offlinebetrieb und Archivschutz. Dies ist ein Teiltest, kein Gesamt-PASS.
- Die bereits abgeschlossene Basis-CI auf `32db06e39efedc963887f19060aea141cd7e0e64`: [Browserregression #40807968915](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40807968915) **8/8 PASS**, [Bohrtest #40807968866](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40807968866) **PASS**, [Quellschutz #40807969045](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40807969045) **PASS**.
- Vorrelease-Matrix unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Dieser neue Test ist nur ein Teilnachweis, keine vollstaendige Freigabe von LOG-04, VER-03, SPE-01, BED-02 oder TES-03.

## Offene Pflichten und naechste drei Schritte

1. Neue Chromium-CI auf finalem Code-HEAD auswerten, eventuelle Fehler korrigieren und vollstaendige bestehende Regressionen nachpruefen.
2. Weitere Wirtschafts- und Minispiel-Endpartien mit Randfaellen und Speicherunterbrechungen getrennt pruefen.
3. Rechte und Herkunft fehlender Ressourcen sowie historische C64-Referenz ohne unzulaessige Originaldateien nachweisen.

**Weiterfuehrende Empfehlung:** Erst nach einem gruenen Teiltest einen exakt commitgebundenen Nachweis eintragen; bis zur kompletten technischen Pflichtabdeckung und Kandidaten-Freeze bleiben Benutzer-Sichtpruefung und Kubuntu-Endabnahme zurueckgestellt. Release nur nach ausdruecklicher Nutzerfreigabe.
