# BED-03 / SPE-01 – Rohrnetz und Feuerwehr bei echtem Chromium-Zoom

**Datum:** 03.11.2026. **Spiel:** PPPOPPI IMPERIUM V1.9.4 (technische Adaption, keine C64-Originaltreue).  
**Entwicklungszweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155).  
**Ausgangs-HEAD:** `0eb16f9cab44437613f5450e5114f6c5adcc9e56`; [Rohrnetz-/Feuerwehr-CI auf Ausgangs-HEAD](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41547031882) SUCCESS. Die vorherigen neun positiven CI-Läufe sind keine Freigabe.

## Risiko und konkretes Pflichtpaket

Bisher bestand die 12-Monats-Rohrnetz-/Feuerwehr-Kampagne mit vier Browserprozessen, drei Datei-Exporten und Endarchiv bei normalem Browserzoom. Ein echter 175-/200-%-Zoom mit den Prozessneustarts war dort nicht integriert. Dadurch konnte die bisherige 800×600-Prüfung Zoomfehler bei Rohrdrehungen und Löschaktionen nicht nachweisen.

- Der bestehende Test erhält `--zoom 175` und `--zoom 200`; ohne Argument bleibt die 100-%-Kampagne unverändert.
- Jeder Neustart nutzt ein eigenes temporäres Chromium-Profil. Eine lokale MV3-Erweiterung setzt `chrome.tabs.setZoom`; `getZoom`, `devicePixelRatio` und CSS-Breite werden in **jedem** Prozess kontrolliert. Kein CSS-Ersatzzoom.
- Unverändert zu prüfen: 3 Rohrabschnitte, alle Tastatur-Drehaktionen, natürlicher Brand in Monat 4, absichtlicher Löschfehlversuch, 3 Löschabschnitte, exakte Wiederherstellung nach 2 aktiven Minispielzuständen, 12 Monatsberichte, Endarchiv und Buchungssperre, 4 Browserprozesse, 3 Sitzungsexporte, keine externen HTTP-Anfragen und keine JavaScript-Fehler.
- [Eigenständige GitHub-Zoomprüfung](https://github.com/provoware/PROJEKT_Oli_Imperium/blob/test/oli-campaign-24-60-20261101/.github/workflows/prerelease-campaign-pipe-fire-zoom.yml) mit 2 Jobs (175/200 %), früher Python-Syntaxprüfung und 25-Minuten-Zeitgrenze.
- Nur Prüfschicht, GitHub-Workflow und dieser Nachweis geändert; keine Spielregeln, Speicherformate, geschützten Originaldateien, andere Repositories oder `main`.

## Prüfnachweis (erst nach Ausführung aktualisieren)

| Pflichtprüfung | Status |
|---|---|
| Bisherige 100-%-Kampagne auf Ausgangs-HEAD | PASS · [CI #41547031882](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41547031882) |
| Neuer Python-Code auf endgültigem HEAD | PENDING |
| Echte 175-%-Kampagne mit Neustarts, Tastatur und Archiv | PENDING |
| Echte 200-%-Kampagne mit Neustarts, Tastatur und Archiv | PENDING |
| Gesamte Vorrelease-Freigabe | BLOCKED |

**Gesamtmatrix bleibt 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52.** Dieser zusätzliche Teilnachweis schließt BED-03 oder SPE-01 nicht vollständig. Ein weiterer Test für Export/Neustart *nach* den Rohr- und Löschabschnitten 1/2 ist separat offen. Persönliche Sichtprüfung und Kubuntu-Endabnahme bleiben bis nach allen technischen Pflichten zurückgestellt. Kein Merge, kein Release.

**Nächste drei Schritte:** (1) GitHub-Jobs auf endgültigem HEAD auswerten und Fehler beheben; (2) weitere Rohr-/Lösch-Zwischenphasen mit Export und echtem Zoom nachweisen; (3) Leistungs-, Archiv-, Bewertungs-, Rechte- und C64-Gates getrennt abarbeiten.
