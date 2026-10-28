# Vorrelease-Teilpaket: bestaetigter Spielabschluss und schreibgeschuetzte Archivansicht

**Stand:** 28.10.2026, 16:35 MEZ. **Basis:** PR #113, Entwicklungs-HEAD `755bbb49506e075154efefd2299da01249b70d0b`. **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Geltung:** ausschliesslich abgeleitete PPPOPPI-Technikfassung, keine C64-Originalregel und kein Release.

## Umsetzung und Grenzen

- Im Firmencomputer ist der Spielabschluss sichtbar. Bei einer aktiven freien Partie fuehrt er zuerst zu einer eigenstaendigen Bestaetigungsansicht mit zwei per Tastatur erreichbaren Schaltern. **Abbruch** laesst den Spielstand unveraendert. **Endgueltig abschliessen** ruft den bereits validierten Sitzungsadapter auf.
- Nach Abschluss zeigt die Oberflaeche ein **nur lesbares Archiv** mit Abschlussmonat, Grund und – bei Kampagnen – Firmenwertung. Dynamische Inhalte werden fuer HTML maskiert. Der Adapter blockiert weitere Wirtschaftsaktionen auch nach Rueckkehr in andere Szenen.
- Laufende Kampagnen zeigen ihren Zielmonat und lassen keinen vorzeitigen freiwilligen Abschluss zu. Sobald die Engine den Schlussbericht abschliesst, wechselt der Bedienpfad automatisch zur Archivansicht.
- Alte, unversionierte Spielstaende bleiben explizit `legacy` ohne Endregelvertrag; keine stillschweigende Umwandlung. Bei offener Sanierung und vertraulichem Spielerwechsel wird kein Abschluss angeboten.
- Nur `quality_v194/build.cjs` ueberlagert die abgeleitete `src/neo_bridge.js`. **Kein Eingriff in die 110 manifestgeschuetzten Originaldateien**, kein neuer Spielregel-Kern, keine externen Browserressourcen.

## Pruefvertrag

| Pruefung | Nachweis | Freigabekriterium |
|---|---|---|
| Overlay-Syntax und Patch-Eindeutigkeit | `build.cjs` / `test_ui_integrity_v194.cjs` | Keine doppelten Anker, Original unveraendert |
| Sichtbarer Dialog und Abbruch | `test_browser_endstate_live_v194.py` | Abbruch bewahrt aktive Partie |
| Tastatur | derselbe echte Offline-Chromium-Test bei 800x600 | Bestaetigung und Abbruch ueber Tab erreichbar |
| Abschlussarchiv | derselbe Browser-Test | Grund/Monat korrekt, weitere Aktion ohne Zustandsaenderung |
| 12-Monats-Kampagne | `test_endstate_live_v194.cjs` | Engine-Abschluss, Wertung und Aktionssperre |
| Regression und Originalschutz | GitHub-Quell-/Browser-CI | Nur auf finalem PR-HEAD als PASS melden |
| Vorrelease-Gesamtgate | `prerelease/matrix.json` | **BLOCKED**, solange nicht alle technischen Pflichten erfuellt |

**Bei Erstellung noch keine CI-Ergebnisse fuer diesen neuen Zweig vorwegnehmen.** Letzter gepruefter Ausgangsstand PR #113: Quell-CI [40707274315](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40707274315) PASS, Browser-CI [40707274321](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40707274321) PASS, Gesamtgate [40707274258](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40707274258) FAIL/BLOCKED wegen unvollstaendiger Pflichtmatrix.

## Offene Pflichten

Der normale JSON-Export verliert weiterhin den Kampagnenvertrag. Der **versionierte Sitzungsimport/-export** fehlt in der normalen Oberflaeche; vollstaendige menschliche Sieg- und Niederlagenpartien mit mehreren Chromium-Prozessneustarts, native Zoomstufen 175/200 %, Speicherrueckfall, Performance, historische Originalreferenz und persoenliche Endabnahme sind nicht abgeschlossen. Die neue Abschlussansicht ist deshalb nur ein **Teilnachweis** fuer `VER-01` und `BED-02`; beide bleiben BLOCKED. Gesamtmatrix weiterhin 6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED (52).

## Naechste drei Schritte

1. Auf dem finalen Entwicklungs-HEAD saemtliche GitHub-Quell- und Browserjobs pruefen und jeden Fehler vor weiteren Aenderungen korrigieren.
2. Versionierten Sitzungsimport/-export samt atomarem Zustandstausch, Groessenbegrenzung, Fehlermeldung und Chromium-Prozessneustart in der normalen Oberflaeche anschliessen.
3. Vollstaendige Endpartien einschliesslich Sanierung, Sieg/Niederlage, 800x600, Tastatur, 175/200-%-Zoom und wiederhergestellten Archivdateien testen.

**Weiterfuehrende Empfehlung:** Fuer die Sitzungsdateien einen gesonderten, klar beschrifteten Importpfad verwenden; den alten JSON-Spielstandimport aus Kompatibilitaetsgruenden nicht still umdeuten. Kein Merge, kein Release, keine vorgezogene persoenliche Abnahme.
