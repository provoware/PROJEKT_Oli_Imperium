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
