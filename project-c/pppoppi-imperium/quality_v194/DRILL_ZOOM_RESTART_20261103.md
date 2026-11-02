# BED-03 / SPE-01 – Bohrspiel-Neustarts bei 175/200 % echtem Chromium-Zoom

**Datum:** 03.11.2026. **Spiel:** PPPOPPI IMPERIUM V1.9.4-Pruefschicht, getrennte technische Adaption.
**Entwicklungszweig:** `test/oli-campaign-24-60-20261101` · [Draft-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155).
**Ausgangs-HEAD:** `74fd9b7176c0bbbe5b98b7a2f2587697728d71f0`; [vorheriger Kampagnen-CI-Lauf](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41538625633) SUCCESS. **Neuer Implementierungs-HEAD und seine CI:** bis zur Ausfuehrung PENDING; keine vorweggenommene PASS-Behauptung.

## Pflicht, Umsetzung, Grenzen

Die bisherige Bohr-Kampagne pruefte einen Export bei aktivem Abschnitt 0 und einen zweiten Export nach Abschnitt 1, vier getrennte Chromium-Prozesse, exakte Wiederherstellung, Abschluss aller drei Bohrabschnitte und 12 Monate mit Archiv. Dies geschah bisher ohne echten nativen Browserzoom. Die separate Zoom-Kampagne pruefte Druckregler und Export, jedoch nicht diese zwei unterbrochenen Abschnitte ueber Prozessneustarts.

- Der bestehende Browserpruefer erhaelt `--zoom 175` bzw. `--zoom 200`; ohne Parameter bleibt der alte 100-%-Pfad erhalten.
- Jeder der vier Chromium-Prozesse verwendet bei Zoom ein **neues, isoliertes Browserprofil** und eine lokale MV3-Erweiterung fuer `chrome.tabs.setZoom`; nach jedem Neustart werden `getZoom`, `devicePixelRatio` und die reduzierte CSS-Breite geprueft. Kein CSS-Ersatzzoom.
- Der Bohrdruckregler muss vor Home/Pfeiltasten die strenge Tab-/CSS-Fokus-/Sichtbarkeitspruefung bestehen; der Fokus wird nach den Pfeiltasten erneut kontrolliert.
- Unveraendert erforderlich: exakt gleicher Spielzustand nach den beiden aktiven Abschnittsimporten, echte Tastatureingaben im Minispiel, drei Bohrabschnitte, vier Prozesse, drei Exporte, zwoelf Monatsabschluesse, Endarchiv und Buchungssperre, keine externen HTTP-Anfragen oder JavaScript-Laufzeitfehler.
- Neue unabhaengige [GitHub-Pruefung](https://github.com/provoware/PROJEKT_Oli_Imperium/blob/test/oli-campaign-24-60-20261101/.github/workflows/prerelease-campaign-drill-zoom-recovery.yml) mit zwei Matrixjobs (175/200 %), Syntax vor Browserinstallation und je 25 Minuten Zeitgrenze.
- Keine Veraenderung der 110 geschuetzten SPIEL-Quelldateien, des Speicherformats, der Spielregeln, anderer Repositories oder von `main`.

## Nachweisstatus

| Pruefung | Status vor neuer CI |
|---|---|
| Ausgangs-HEAD `74fd9b7176c0`: Bohr-Kampagne ohne Zoom | PASS (GitHub #41538625633) |
| Neuer Python-Code / Syntax auf neuem HEAD | PENDING |
| Echter Zoom 175 %, vier Prozesse, Abschnitt 0/1, Archiv | PENDING |
| Echter Zoom 200 %, vier Prozesse, Abschnitt 0/1, Archiv | PENDING |
| Gesamtfreigabe | BLOCKED (harte Pflichtsperre bleibt aktiv) |

**Gesamtmatrix unveraendert:** 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52. Diese neue Testabdeckung allein schliesst BED-03 oder SPE-01 nicht vollstaendig ab. Die persoenliche Sicht-/Kubuntu-Endabnahme bleibt bis zum eingefrorenen Kandidaten zurueckgestellt. Kein Merge, kein Release.

**Naechste drei Schritte:** (1) Beide neuen GitHub-Matrixjobs auf dem endgueltigen HEAD auswerten und echte Fehler beheben; (2) bei PASS weitere Rohr-/Feuerwehr-Zwischenphasen mit nativem Zoom und Neustart pruefen; (3) offene Performance-, Archiv-, Bewertungs-, Rechte- und C64-Pflichten getrennt abarbeiten.
