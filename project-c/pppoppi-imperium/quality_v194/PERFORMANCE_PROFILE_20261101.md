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
- **GitHub-Engine-/Browserpruefung des ersten Profilerstands `4f63134`:** [CI #41317137253](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41317137253) **4/4 Jobs SUCCESS** (01.11.2026, 14:52 UTC), einschliesslich 120/240 Browsermonaten und 5/5 Berechnungsregressionen. **Die hier nachfolgenden Erweiterungen haben bis zu ihrem eigenen CI-Abschluss noch keinen PASS-Nachweis.**
- **Vorgaenger-HEAD:** [Kampagnen-CI #41311750980](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41311750980), 4/4 Jobs **SUCCESS**; [weitere GitHub-Workflows](https://github.com/provoware/PROJEKT_Oli_Imperium/actions) auf diesem HEAD: sechs SUCCESS, eine erwartete harte Matrix-Sperre FAIL.
- **Unveraenderte 52er-Vorrelease-Matrix:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Kein Fortschritts-PASS allein durch zusaetzliche Messwerte.

## Offene Freigabe- und Folgearbeiten

1. Beide langen Browserkampagnen mit den neuen Profilfeldern auf dem finalen HEAD ausfuehren, Anzahl und Laufzeiten aus GitHub-Logs belegen; bei Fehlern korrigieren.
2. Eine wiederholbare Leistungsanforderung mit Zielhardware, Testumgebung, maximaler Monatsreaktionszeit, Messwiederholungen und Grenzwerten vereinbaren; erst danach eine echte Performance-Freigabepruefung einrichten.
3. Den 175/200-%-Langzeit-Browserpfad getrennt vom bestehenden Layout-PR #154 pruefen; offene Fragen zur 240-Monats-Archivierung, Bewertung, Rechten und Originalvergleich bleiben eigenstaendig.

**Schutz:** Keine Produktdateien, Wirtschaftsregeln, Speicherformate, Originalquellen oder `main` veraendert. Keine Benutzer-/Kubuntu-Endabnahme vor einem eingefrorenen vollstaendigen Kandidaten. Ein Release bedarf ausdruecklicher Freigabe.

## Nachtrag 01.11.2026 – echte Laufwerte und zeitliche Drift

Die folgenden Werte stammen ausschliesslich aus dem abgeschlossenen GitHub-Lauf [#41317137253](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41317137253), HEAD `4f63134ad018da4314b5e3bcda28a669ea43e0c2`. Der Lauf hatte vier erfolgreiche Jobs und keine ausstehenden Jobs. Die beiden Browserjobs liefen auf GitHub Ubuntu 24.04/Chromium mit 800x600, Tastaturbedienung, Halbzeitimport und drei Browserprozessen. **Eine Messung pro Kampagnendauer ist noch kein reproduzierbarer Grenzwert.**

| Messung | 120 Monate | 240 Monate |
|---|---:|---:|
| Erfasste Monate | 120 | 240 |
| Summe Monatsschritte | 181,660 s | 769,069 s |
| Gesamtzeit inkl. Aufbau/Archivkontrolle | 184,885 s | 773,408 s |
| Median Monatsschritt | 1,509 s | 3,782 s |
| P95 / P99 | 2,696 / 2,775 s | 4,705 / 4,829 s |
| Langsamster Monat | 2,789 s | 12,239 s |
| Mittelwert erste Haelfte | 0,879 s | 2,030 s |
| Mittelwert zweite Haelfte | 2,149 s | 4,379 s |
| Spaet/frueh-Verhaeltnis (aus gerundeten Werten) | 2,445 | 2,157 |
| Natuerliche Sanierungen | 0 | 4 |
| Detaillierte Monatsberichte im Endstand | 120 | 120 |

**Befund:** Die spaeteren Spielmonate benoetigen in beiden Einzellaeufen im Mittel mehr als doppelt so lange. Ursache und Streuung sind nicht ermittelt. Die Halbzeit-Neustarts sind in den Monatsschritten enthalten und koennen einzelne Messwerte verzerren; ausserdem steigen die Spielzustandsdaten mit dem Fortschritt. Keine dieser Erklaerungen ist bislang kausal belegt.

**Dieses Folgepaket:** Der bestehende Profiler liefert zusaetzlich Mittelwerte des ersten/letzten Viertels und deren Quotienten sowie das Verhaeltnis zweite/erste Haelfte. Division durch null und zu kurze Zeitreihen ergeben `null`, niemals einen erfundenen Wachstumswert. Die Berechnung erfolgt vor der Rundung; die Zeitreihe wird fuer diese Vergleiche nicht sortiert. Zwei neue Regressionen ergaenzen die bisherigen fuenf. Die Browserjobs schreiben die neuen Felder automatisch in ihr bestehendes JSON-Protokoll. **Keine automatische Releasefreigabe und keine frei erfundene Leistungsschwelle.**

**Offene Pflichten (unveraendert):** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Performance bleibt BLOCKED; 175/200-%-Langzeitzoom, 240-Monats-Archivierungsumfang, Vermoegensbewertung, Medienrechte und C64-Originalvergleich bleiben offen.

**Naechste drei eigenstaendige Schritte:**
1. CI auf dem neuen Entwicklungs-HEAD einschliesslich 7/7 Profilregressionen und beider Browserjobs pruefen; Fehler korrigieren.
2. Neustart-/Importdauer getrennt von normalen Monatsaktionen messen, damit die zeitliche Drift nicht durch den Halbzeit-Neustart verdeckt wird.
3. Mehrfachmessungen in einer definierten Umgebung durchfuehren und erst danach technisch begruendete Leistungsgrenzen vorschlagen.

Keine Aenderung an Produktcode, Spielregeln, Speicherformaten, Hauptzweig oder fremden PR-Dateien. Kein Merge, kein Release und keine persoenliche Endabnahme.
