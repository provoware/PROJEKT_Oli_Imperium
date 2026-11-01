# OLI V1.9.4 – reproduzierbares Langzeit-Performanceprofil (01.11.2026)

**Bereich:** eigenstaendige Offline-PPPOPPI-Adaption, Browserkampagnen 120/240 Monate. **PR:** [#155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Kein Release, kein Merge.**

## Problem und Wirkung

Die bisherigen Browserpruefungen haben die langsamsten Monatsdurchlaeufe gemessen, aber keine Verteilung oder Veraenderung ueber lange Kampagnen. Auf dem zuvor nachgewiesen erfolgreichen HEAD `73828f5358609b9f253f6f0a30181f415a99782b` wurden 3,794 Sekunden (120 Monate) und 10,511 Sekunden (240 Monate) als jeweiliger langsamster Monatsdurchlauf gemeldet. Das sind Einzelbeobachtungen, **keine verbindlichen Grenzwerte**. Ohne definierte Messumgebung, Wiederholungen und fachlich vereinbarte Zielwerte bleibt die Performance-Releasepflicht **BLOCKED**.

## Neues technisches Pflichtpaket

- `performance_profile_v194.py`: reine, deterministische Auswertung aller beobachteten Monatsdauern; Anzahl, Summe, Median, P95/P99 (Nearest-Rank), Maximum, Mittelwerte der ersten und zweiten Haelfte sowie der letzten zehn Monate.
- `test_performance_profile_v194.py`: fuenf Regressionen fuer gerade/einzelne Stichproben, 120/240 Werte, Ausreisser und ungueltige Messwerte. Fehlerhafte oder leere Stichproben duerfen nicht als Messbeleg gelten.
- `test_browser_campaign_120_240_v194.py`: schreibt das Profil als `month_step_profile` und die vollstaendige gemessene Laufzeit als `end_to_end_seconds` in den bestehenden JSON-Logeintrag. Die Anzahl gemessener Monatsdurchlaeufe muss mit der gewaehlten Spieldauer uebereinstimmen.
- `.github/workflows/prerelease-campaign-duration.yml`: die fuenf Berechnungsregressionen sind ein verpflichtender Schritt vor den bestehenden Engine- und Browserkampagnen; Aenderungen an den Profildateien loesen die Pruefung aus.

**Messgrenzen:** Monatsdauer umfasst Browserbedienung, Sanierungen und gegebenenfalls den Prozessneustart in der Kampagnenmitte; der abschliessende Archivneustart und der Aufbau der Vorschau gehoeren **nicht** zur Monatsdauer. `end_to_end_seconds` umfasst dagegen auch den Vorschauaufbau und die abschliessende Archivkontrolle bis zur Ergebnisausgabe. Diese zwei Messarten duerfen nicht miteinander verwechselt werden. GitHub-Runner und Browserinstallation beeinflussen die Werte. P95/P99 sind beschreibende Kennzahlen, kein automatischer Freigabebeweis.

## Pruefstand

- **Lokale, isolierte Berechnungspruefung:** 5/5 **PASS** mit Python-Unittest; Syntaxpruefung der beiden neuen Python-Dateien **PASS** (01.11.2026).
- **Vollstaendige GitHub-Engine-/Browserpruefung fuer dieses neue Paket:** **PENDING**, bis die GitHub-Jobs auf dem endgueltigen neuen HEAD nachweislich abgeschlossen sind. Es wird kein neues Browser-PASS vorweggenommen.
- **Vorgaenger-HEAD:** [Kampagnen-CI #41311750980](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41311750980), 4/4 Jobs **SUCCESS**; [weitere GitHub-Workflows](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) auf diesem HEAD: sechs SUCCESS, eine erwartete harte Matrix-Sperre FAIL.
- **Unveraenderte 52er-Vorrelease-Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Kein Fortschritts-PASS allein durch zusaetzliche Messwerte.

## Offene Freigabe- und Folgearbeiten

1. Beide langen Browserkampagnen mit den neuen Profilfeldern auf dem finalen HEAD ausfuehren, Anzahl und Laufzeiten aus GitHub-Logs belegen; bei Fehlern korrigieren.
2. Eine wiederholbare Leistungsanforderung mit Zielhardware, Testumgebung, maximaler Monatsreaktionszeit, Messwiederholungen und Grenzwerten vereinbaren; erst danach eine echte Performance-Freigabepruefung einrichten.
3. Den 175/200-%-Langzeit-Browserpfad getrennt vom bestehenden Layout-PR #154 pruefen; offene Fragen zur 240-Monats-Archivierung, Bewertung, Rechten und Originalvergleich bleiben eigenstaendig.

**Schutz:** Keine Produktdateien, Wirtschaftsregeln, Speicherformate, Originalquellen oder `main` veraendert. Keine Benutzer-/Kubuntu-Endabnahme vor einem eingefrorenen vollstaendigen Kandidaten. Ein Release bedarf ausdruecklicher Freigabe.
