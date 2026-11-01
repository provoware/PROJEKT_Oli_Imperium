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
