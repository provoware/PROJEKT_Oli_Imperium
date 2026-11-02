# Projekt C – sichtbare Spielartwahl in der abgeleiteten Technikfassung

**Stand:** 28.10.2026, 15:31 Uhr MEZ. **Basis:** Entwurfs-PR #112, HEAD `e30566a38ee3d564c324271093e5e2c21d9fdd7b`; `main` `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Bereich:** eigenstaendige PPPOPPI-Adaption, keine historische C64-Regel.

## Verbindlicher Umfang dieses Pflichtpakets

Die vorhandene Startoberflaeche bietet in der **abgeleiteten** `neo_bridge.js` jetzt eine mit `<label>` verknuepfte, per Tastatur erreichbare Auswahl: freies Spiel oder Kampagne mit 12, 24, 60, 120 bzw. 240 Monaten. Der bestehende Startknopf uebergibt die Wahl an `newPartie(..., endMode)` und den bereits integrierten `PPPEndstateLive.start`-Vertrag. Die Firmenaufstellung und lokale Zwischensicherung bleiben erhalten. Es gibt keine neue parallele Spielregel und keine stillschweigende Migration alter Spielstaende.

Die Aenderung liegt nur in den Build-Ueberlagerungen und den Tests. Alle 110 durch das Wiederherstellungsmanifest geschuetzten Originaldateien bleiben unveraendert. Der technische Aufbau verweigert weiterhin vorhandene Zielordner und gefaehrliche Schreibziele.

## Nachweise und Abnahmegrenzen

- Statischer Vertrag: `node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs` prueft sechs Werte, Uebergabe an den Adapter und unveraendertes Original.
- Echter Browser: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_endstate_live_v194.py` prueft bei 800×600 die sichtbare und beschriftete Auswahl, Tab-Reihenfolge, Klickstart einer 12-Monats-Kampagne, Rueckwechsel zu freiem Spiel, validierten Spielkern und Browserfehler.
- Vorheriger Basisstand #112: alle fuenf Chromium-Jobs im Lauf [40698158156](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40698158156) **PASS**; Quellpruefung [40698160509](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40698160509) **PASS**; Vorrelease-Gesamtgate [40698158127](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40698158127) **BLOCKED**.
- **Neuer Entwicklungs-HEAD:** neue GitHub-CI nach PR-Erstellung auswerten; ein eingereichter Test ist noch kein PASS.

## Verbleibende Blockaden

- Noch kein sichtbarer bestaetigter Enddialog, keine Archivansicht, kein Sitzungsdatei-Import/-Export in der normalen Oberflaeche.
- Bisheriger Standard-JSON-Export verliert den Kampagnenvertrag; versionierter Sitzungsimport/-export muss vor Freigabe ueber die Oberflaeche erfolgen.
- Vollstaendige Sieg-/Niederlagenpartien, 175/200-%-Zoom, Prozessneustarts und negative Randfaelle im neuen Bedienpfad fehlen.
- Historische Originalverifikation und persoenliche Endabnahme bleiben getrennt und zurueckgestellt.

**Matrix:** `VER-01` bleibt **BLOCKED**. Gesamtzaehlung unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**.

## Naechste drei technische Pflichtschritte

1. CI fuer die sichtbare Spielartwahl auf dem finalen Entwicklungs-HEAD vollstaendig pruefen, Fehler korrigieren.
2. Bestaetigten Enddialog und unveraenderbare Abschlussansicht im abgeleiteten Browser anschliessen, Tastatur/800×600/Zoom pruefen.
3. Versionierten Sitzungsimport/-export mit Prozessneustart, vollstaendigen Endpartien und Fehlerszenarien absichern.

**Kein Merge, kein Release, keine Aenderung am geschuetzten Spieloriginal und keine vorgezogene Benutzerabnahme.**
