# OLI V1.9.4 – Vergleichbare Langzeit-Wiederholungsmessung (01.11.2026)

**Arbeitszweig:** [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Kein Merge, keine Releasefreigabe, keine Benutzer-Endabnahme.** Gegenstand ist ausschliesslich die eigenstaendige PPPOPPI-Browseradaption, nicht die historische C64-Originaltreue.

## Nachgewiesener Ausgangsstand

[GitHub-Kampagnenlauf #41337596370](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41337596370) auf HEAD [84b382f8](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/84b382f8a535df2451910736f40b77df321c085e): **4/4 Jobs SUCCESS**, darunter **15/15 Profilregressionen**, reale 24-/120-/240-Monats-Chromium-Kampagnen und Projektstrukturprüfung. Die sechs weiteren Fach-Workflows auf diesem HEAD sind SUCCESS; die integrierte Vorrelease-Sperre ist weiterhin erwartungsgemaess FAIL.

Aus den echten Browserjob-Protokollen (jeweils nur **ein** Lauf pro Dauer):

| Beobachtung | 120 Monate | 240 Monate |
|---|---:|---:|
| End-to-end | 201,307 s | 633,379 s |
| P95 Monatsschritt | 3,517 s | 4,397 s |
| Verhaeltnis zweite / erste Spielhaelfte | 3,068 | 2,312 |
| Korrelation Zustandsgroesse / Monatsdauer (Niveau) | +0,976 | +0,881 |
| Korrelation der Monat-zu-Monat-Aenderungen | +0,132 | -0,621 |
| Halbzeit-Export + Neustart + Import | 0,502 s | 0,921 s |

**Einordnung:** Die starken Niveaukorrelationen werden durch die Differenzen-Korrelationen nicht bestaetigt. Im 240-Monats-Lauf ist die Aenderungskorrelation sogar negativ. Das spricht gegen die vorschnelle Behauptung, mehr JSON-Bytes seien bereits als alleinige Ursache der Verlangsamung bewiesen. Auch die Differenzen-Korrelation ist kein Kausaltest; die beiden Laeufe sind keine reproduzierbare Stichprobe.

## Dieses Pflichtarbeitspaket

- compare_campaign_repeats_v194.py liest zwei echte BROWSER-LANGKAMPAGNE-Endprotokolle. Es verlangt genau ein vollstaendiges Ergebnis je Log, gleiche Dauer, 800x600, Tastatur, vier menschliche Firmen, drei unabhaengige Chromium-Prozesse, vollstaendige Monats- und Groessenreihen sowie weiterhin BLOCKED gesetzte Release-Sperren. Ungueltige, fehlende oder unendliche Kennzahlen werden abgewiesen.
- test_compare_campaign_repeats_v194.py: sechs deterministische Tests fuer gleiche und unterschiedliche Laufzeiten, falsche Konfiguration, unvollstaendige Daten, fehlende/duplizierte Endprotokolle und unveraenderte Freigabesperre.
- .github/workflows/prerelease-campaign-duration.yml: die sechs Regressionen werden in der bestehenden Pruefkette ausgefuehrt; ein **zusaetzlicher** GitHub-Job fuehrt zwei vollstaendige 120-Monats-Chromium-Partien nacheinander auf demselben Ubuntu-24.04-Runner mit identischer Konfiguration aus und vergleicht Gesamtzeit, Monatszeit, Median, P95, P99, Maximum und spaet/frueh-Verhaeltnis. Shell pipefail verhindert, dass tee einen fehlgeschlagenen Browserlauf als Erfolg verdeckt. Die Logs verbleiben im GitHub-Pruefprotokoll, keine Spielstaende werden als Artefakte hochgeladen.
- Der Vergleich liefert ausschliesslich deskriptive Abweichungen in Prozent. **Es werden keine frei erfundenen Grenzwerte gesetzt und keine Releasepflicht automatisch freigegeben.**

**Lokale isolierte Vorpruefung:** sechs neue Regressionen **6/6 PASS** und Python-Syntax **PASS** in einer getrennten Python-Laufzeit. **GitHub-CI fuer die neuen Dateien ist erst nach Abschluss des neuen Workflow-Laufs nachgewiesen.**

## Vorrelease-Pflichtmatrix und offene Arbeit

Unveraendert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Performance bleibt **BLOCKED**, solange Zielhardware, Messwiederholungen und akzeptierte Grenzen fehlen. Weitere offene Pflichten: 175/200-%-Langzeitvergroesserung, Archivierungsumfang der 240-Monats-Partie, fachliche Vermoegensbewertung, Medienrechte, Originalquellen-/C64-Vergleich. Die persoenliche Sichtpruefung und der Kubuntu-Praxistest werden erst am eingefrorenen, technisch fertig geprueften Kandidaten durchgefuehrt.

## Die naechsten drei Schritte

1. Neuen GitHub-Workflow auf dem tatsaechlichen PR-HEAD bis zum Ende pruefen; insbesondere 6/6 neue Regressionen und **beide** wiederholten 120-Monats-Browserlaeufe.
2. Abweichungen zwischen den beiden Laeufen anhand der Vergleichsausgabe bewerten, technische Fehler beheben und die Messung anschliessend mit 240 Monaten wiederholen.
3. Erst nach reproduzierbaren Messungen, definierter Zielumgebung und begruendeten Grenzwerten ein verbindliches Performance-Freigabekriterium vorschlagen.

**Schutz:** Nur PR #155; keine Produktlogik, Speicherformate, Spielregeln, Originalmaterialien, main oder Top-5-Repositories veraendert. Kein Merge, kein Release.

## Nachtrag: 120-Monats-Wiederholung abgeschlossen; 240-Monats-Wiederholung gestartet

**Pruefquelle:** [GitHub-Actions-Lauf 41342963014](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41342963014) auf [HEAD c2a47a7d](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/c2a47a7d7bc1cd59e9c651db8b2545e0d656542c), 01.11.2026. **5/5 Kampagnenjobs SUCCESS**: 24, 120, 240 Monate, 120-Monats-Doppellauf und Regression. **15/15 Profil- und 6/6 Vergleichsregressionen PASS.** Die separate integrierte Vorrelease-Sperre bleibt erwartungsgemaess FAIL und ist **kein** freigegebenes Release-Gate.

| Echte 120-Monats-Messung auf demselben GitHub-Runner | Lauf 1 | Lauf 2 | Differenz Lauf 2 |
|---|---:|---:|---:|
| Gesamtlaufzeit | 292,437 s | 260,464 s | -10,93 % |
| Summe der Monatsschritte | 286,474 s | 254,763 s | -11,07 % |
| P95 eines Monatsschritts | 4,269 s | 3,911 s | -8,39 % |
| Median eines Monatsschritts | 2,312 s | 2,125 s | -8,09 % |
| Verhaeltnis zweite/erste Spielhaelfte | 2,577 | 2,673 | +3,73 % |

Beide Laeufe: 120 Monate, 480 menschliche Tastaturzuege, drei Chromium-Prozesse, 800x600, 120 behaltene Berichte, keine natuerlichen Sanierungen. Die Streuung ist messbar; eine einzelne Wiederholung liefert **noch keine** verlaessliche Leistungsgrenze. Die spaetere Spielhaelfte bleibt in beiden Laeufen deutlich langsamer. Die parallel bestandene 240-Monats-Partie dauerte 705,392 s und enthielt vier natuerliche Sanierungen; sie ist **noch keine** 240-Monats-Wiederholungsmessung.

**Neues zusammenhaengendes Pflichtpaket:** Zwei zusaetzliche deterministische Negativ-/Positivtests sichern bei 240 Monaten 960 Tastaturzuege, das 120-Berichte-Fenster, die aktive Freigabesperre und das Abweisen einer falsch gemischten 120-/240-Monats-Messung. Ein neuer GitHub-Job fuehrt **zwei komplette 240-Monats-Chromium-Partien nacheinander auf demselben Runner** aus, vergleicht sie mit dem vorhandenen strikten Protokollpruefer und stoppt bei einem Fehler durch `set -euo pipefail`. Der neue Job und die acht Vergleichsregressionen sind bis zum Abschluss der CI **PENDING, nicht PASS**. Keine Produktlogik und kein Speicherformat geaendert.

**Pflichtmatrix weiterhin 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.** Performance bleibt BLOCKED bis zu reproduzierbaren Ergebnissen und begruendeten Zielgrenzen; 175/200-%-Langzeitzoom, 240-Monats-Archivierungsumfang, Vermoegensbewertung, Medienrechte und C64-Abgleich offen. Keine persoenliche Endabnahme, kein Merge, kein Release.

**Naechste Schritte:** (1) neuen GitHub-HEAD mit acht Vergleichstests und beiden 240-Monats-Partien auswerten, (2) bei Abweichungen technische Ursachen eingrenzen, (3) erst nach mehrfachen Messungen ein begruendetes Leistungsziel fuer die Zielhardware definieren.


## Nachtrag 01.11.2026, 22:29 MEZ – 240-Monats-Wiederholung ausgewertet und Vergleich abgesichert

**Nachgewiesener Ausgangs-HEAD:** [166ec6c7743d79e59629abf58be9987003186690](https://github.com/provoware/PROJEKT_Oli_Imperium/commit/166ec6c7743d79e59629abf58be9987003186690). **Echter GitHub-Prueflauf:** [41347849370](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41347849370), **6/6 Kampagnenjobs SUCCESS** einschliesslich beider 240-Monats-Chromium-Laeufe und der damaligen acht Vergleichsregressionen. Quelle: Job `browser-campaign-240-repeatability`, abschliessende Zeile `REPEATABILITY-CAMPAIGN` (nicht aus synthetischen Beispielwerten abgeleitet).

| Messung auf demselben GitHub-Runner | 120 Monate, Lauf 1 / 2 | 240 Monate, Lauf 1 / 2 |
|---|---:|---:|
| Gesamtlaufzeit (s) | 249,562 / 240,956 | 691,858 / 758,424 |
| Abweichung Lauf 2 zu Lauf 1 | -3,45 % | +9,62 % |
| P95 eines Monats (s) | 3,683 / 3,641 | 4,144 / 4,961 |
| P95-Abweichung | -1,14 % | +19,72 % |
| Spaete / fruehe Spielhaelfte | 2,586 / 2,632 | 2,023 / 2,387 |
| Natuerliche Sanierungen | 0 / 0 | 4 / 4 |
| Tastatur-Zugabschluesse je Lauf | 480 | 960 |

**Interpretation:** Die spaete Spielhaelfte bleibt in beiden Laengen und Wiederholungen deutlich langsamer. Die Abweichungen zwischen den Laeufen sind nicht vernachlaessigbar, besonders bei 240 Monaten und P95. Gleich viele Sanierungen belegen allein noch keine identischen Spielzustaende. Diese Messungen stammen von GitHub-Ubuntu-Runnern, **nicht** vom spaeteren Kubuntu-Zielrechner; keine verbindlichen Leistungsgrenzen und keine Kausaldiagnose.

**Neues Pflichtpaket auf PR #155:** Der vorhandene Vergleichspruefer weist nun falsch typisierte Laufzeiten-/Zugzaehler, negative oder unplausible Sanierungszahlen, unbewiesene C64-Originaltreue und unmoegliche Perzentilreihenfolgen zurueck. Er zeigt explizit an, ob die beiden Sanierungszaehler gleich sind, ohne daraus gleiche Spielzustaende oder eine Freigabe abzuleiten. Drei neue Regressionstests wurden ergaenzt (insgesamt **11** Vergleichstests). Der GitHub-Workflow fuehrt sie weiter im bestehenden Job aus. **Status der neuen 11 Tests und aller Jobs auf dem neuen HEAD: PENDING bis zum tatsaechlichen CI-Abschluss; kein vorweggenommenes PASS.**

**Vorrelease-Pflichtmatrix:** unveraendert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Performance weiterhin BLOCKED; Langzeitzoom 175/200 %, Umfang der 240-Monats-Archivberichte, Vermoegensbewertung, Medienrechte und historische Originalquellen ebenfalls offen. Die Benutzer-Sichtpruefung und der Kubuntu-Praxistest bleiben bis zum eingefrorenen technischen Release-Kandidaten zurueckgestellt.

**Naechste drei Schritte:** (1) alle neuen CI-Jobs auf finalem HEAD auswerten und Fehler beheben; (2) echte 175/200-%-Langzeit-Browserpfade bei 800x600 mit Tastatur, Import und Archiv pruefen; (3) die Verlangsamung mit getrennten UI-/Engine-Messungen kausal eingrenzen und erst danach begruendete Zielwerte festlegen. Kein Merge, kein Release, keine Aenderung an `main` oder den fuenf ausgeschlossenen Repositories.
