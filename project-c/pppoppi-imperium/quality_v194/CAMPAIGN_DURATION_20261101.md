# OLI V1.9.4 – 24/60-Monats-Kampagnen: technischer Teilnachweis

**Datum:** 01.11.2026. **Bereich:** eigenstaendige PPPOPPI-Adaption, nicht historischer C64-Nachbau.  
**Ausgangsbasis:** #141, `de887729a82ba9128b1054d82847d2f173e0f50a`.  
**Entwicklungszweig:** `test/oli-campaign-24-60-20261101`. **Kein main-Merge, kein Release.**

## Ziel, Relevanz und Abgrenzung

Die sichtbare Spielartwahl bietet 12, 24, 60, 120 und 240 Monate. Der bisherige vollstaendige Browser-Endspieltest deckt 12 Monate ab. Dieses Pflichtpaket testet **24 und 60 Monate im realen V0.8.2-Enginekern**, mit zwei menschlichen Firmen, Monatswechseln, ggf. natuerlicher Sanierung, Export/Import in der Kampagnenmitte und einem unveraenderbaren Endarchiv. Es fuehrt keine erfundenen historischen Regeln ein und aendert weder Produktcode noch Spielstandschema oder geschuetzte SPIEL-Dateien.

## Konkrete Pruefungen

- Exakt 24 bzw. 60 Monate mit je zwei echten `END_TURN`-Aktionen, Monatsbericht und `NEXT_MONTH`; kein vorzeitiges Archiv.
- Sanierung bei tatsaechlichem `RESCUE` nur durch die reale `RESTART`-Aktion; Schutz gegen Endlosschleifen.
- Zur Halbzeit: versionierter Sitzungsexport, unveraenderter Enginezustand nach Import, Vertragslaufzeit erhalten.
- Manipulierter Vertrag mit falscher Laufzeit wird abgelehnt, die bisherige Sitzung bleibt byteidentisch.
- Endarchiv: Endmonat, Laufzeit, Sieger, Rangfolge, Firmenzahl und Snapshot werden abgeglichen; Export/Import des Archivs und Buchungssperre danach.
- Testdaten ausschliesslich im Speicher, keine Benutzerdateien, keine produktiven Speicherformate.

**Testdatei:** `quality_v194/test_endstate_long_campaign_v194.cjs`  
**CI:** `.github/workflows/prerelease-campaign-duration.yml`  
**Lokal reproduzierbar:** `node --test project-c/pppoppi-imperium/quality_v194/test_endstate_long_campaign_v194.cjs`

## Ergebnisstand und Freigabegrenze

- **Implementierung:** neuer Test und gesondertes CI-Gate erstellt.
- **Tatsaechlicher GitHub-CI-Abschluss auf finalem HEAD:** PENDING bis zur nachfolgenden Pruefung; vorerst **kein PASS** fuer das neue Pflichtpaket.
- **VER-01/VER-03:** weiterhin **BLOCKED**. Das Paket ist ein Teilnachweis, kein Beleg fuer alle Endspielvarianten, sichtbare Browserbedienung, 800x600, 175/200-%-Zoom, 120/240-Monats-Kampagnen, Rechte, C64-Originaltreue oder Gesamtfreigabe.
- **Gesamte Pflichtmatrix:** unveraendert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED (52)**. Keine persoenliche Sicht-/Kubuntu-Endabnahme vor einem eingefrorenen technisch vollstaendigen Kandidaten.

## Naechste drei technische Schritte

1. Den GitHub-CI-Lauf auf dem finalen HEAD auswerten, reale Testfehler beheben und auf demselben neuen HEAD erneut pruefen.
2. Nach Erfolg die 24-Monats-Kampagne im echten Offline-Chromium mit 800x600, Tastatur, Export/Import und Prozessneustart testen.
3. Anschliessend die verbleibenden 120/240-Monats-Modi und mehrfache Insolvenzen gezielt pruefen; offene Releasepflichten weiterhin getrennt bearbeiten.

**Keine Ueberschneidung:** #150 entwickelt Bewertungsregeln, #153 prueft CI-Nachweise. Dieses Paket aendert nur einen neuen Endpartietest, einen neuen Workflow und diese Dokumentation. Vor Integration in #141 Quell-/Ziel-HEAD, PR-Diff und saemtliche relevanten CI-Pruefungen erneut vergleichen.

## Nachpruefung der Implementierung am 01.11.2026

**Getesteter Code-/Dokumentations-HEAD:** `073395469027db34cd4622b72189a93797b116e8`.  
**GitHub Actions:** [Kampagnen-Pflichtgate #41297867454](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41297867454) – **SUCCESS**, alle Schritte abgeschlossen.

- Syntaxpruefung **PASS**, bisherige Endspiel-Engine-Regressionen **4/4 PASS**.
- Neue 24-/60-Monats-Regressionen **2/2 PASS**, 24 + 60 = **84 echte Spielmonate** und **168 END_TURN-Aktionen**; jeweils 24 bzw. 60 Monatsberichte, zwei Firmen und ein erfolgreich importiertes Endarchiv.
- Versionierter Zwischenimport bei Monat 12 bzw. 30, manipulierte Laufzeit abgewiesen und Archiv-Buchungssperre: **PASS** innerhalb der beiden Regressionen.
- Projektstrukturpruefung **PASS**. Laut GitHub-Protokoll gab es in diesen zwei Langtests **0 natuerliche Sanierungsaktionen**. Insolvenz-/Sanierungsdeckung wird daher durch dieses Paket **nicht** behauptet.
- Diese Tests verwenden die reale Engine **ohne sichtbaren Browser**; sie belegen **keine** 24-/60-Monats-Bedienung bei 800x600, Tastatur oder Zoom. Die bestehenden 12-Monats-Browsertests sind separate Nachweise.

**Hinweis zur Nachweiskette:** Diese Dokumentation wird nach dem erfolgreich geprueften Implementierungs-HEAD ergaenzt. Der daraus entstehende neue HEAD benoetigt seine eigene CI-Nachkontrolle. VER-01/03 bleiben BLOCKED; 6/52 PASS bleibt unveraendert.

## Eigenstaendiger Browser-Pflichtpfad: 24 Monate (01.11.2026)

**Implementierungsstand:** `93cb89cd25e7e5110eac01e6f43126bfa68217ad`; neuer Test `test_browser_campaign_24months_v194.py` und zusaetzlicher, unabhaengiger Job `browser-campaign-24-months` in `.github/workflows/prerelease-campaign-duration.yml`.

**Testvertrag:** 24 Monate mit vier echten menschlichen Firmen, 96 ueber sichtbare Schaltflaechen per Enter abgeschlossene Zuege und 72 bestaetigte Spieleruebergaben; keine KI, keine Geld-/Zustandsinjektion. Nach Monat 12 versionierten Sitzungsexport, vollstaendigen Chromium-Prozess beenden, neuen Prozess starten und denselben Zustand samt Laufzeit importieren. Nach Monat 24 echte Abschlusswertung, Rangfolge, schreibgeschuetztes Archiv, Endexport ohne aktiven Zustand und zweiten echten Chromium-Prozessneustart nachweisen. Durchgehend 800x600, kein horizontaler Seitenueberlauf, keine HTTP-Anfragen oder JavaScript-Laufzeitfehler.

**Vorab-Risiko:** Bei natuerlicher Insolvenz ist ein roter Test ein fachlicher Befund, kein Grund, eine Sanierung zu simulieren oder die Sperre zu umgehen. In diesem Fall die tatsaechliche Sanierungsoberflaeche als gesonderte Erweiterung pruefen. Browserinstallation und sichtbare Bedienung werden erst durch den neuen GitHub-Job nachgewiesen.

**Pruefstand bei Dokumentation:** neuer GitHub-Lauf auf finalem HEAD noch **PENDING**; deshalb **kein PASS** fuer den 24-Monats-Browserpfad. Bisherige Engine-Nachweise 24/60 Monate bleiben auf ihrem getrennt dokumentierten Commit gueltig. Die 52er-Matrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED. Kein Release und keine persoenliche Endabnahme.

**Naechste technische Schritte:** (1) den neuen GitHub-Job und alle anderen Pflichtjobs auf dem endgueltigen Dokumentations-HEAD auswerten, (2) echte Fehler mit Negativtests beheben und erneut laufen lassen, (3) danach 120/240-Monats-Grenzfaelle oder nachgewiesene Browser-Sanierungswege erweitern. Die Entwurfszweige #150 und #154 werden nicht beruehrt.
