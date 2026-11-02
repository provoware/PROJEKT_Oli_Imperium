# Projekt C – Tastaturaktivierung von Dialog-Wirtschaftsaktionen bei echtem Zoom

**Datum:** 27.10.2026 · **Spiel:** PPPOPPI IMPERIUM, isolierte V1.9.4-Pruefschicht auf V1.9.3-Kern. **Implementierung:** `95b393211465427c58c08a71ce35ffc2ce026573`. Gestapelt auf [PR #85](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/85); [Entwurfs-PR #86](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/86). `main` vor und nach der Implementierung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Vorpruefung und Ziel

AGENTS.md, README.md, A/B-Uebergabe, Originalquellen, Test-/Fortschrittsregeln und die bestehenden gestapelten Entwurfs-PRs wurden geprueft. Die bisherigen Szenen-/Fokus-/Animationspruefungen **aktivieren nicht systematisch Wirtschaftsaktionen in den Dialogen**. Deshalb nur eine gezielte, isolierte Erweiterung; keine historische C64-Regelbehauptung, keine Aenderung der 110 manifestgeschuetzten Originale.

## Umsetzung

`quality_v194/test_browser_dialog_actions_v194.py` baut die hashgepruefte Offline-Vorschau. Bei **echtem Chromium-Tab-Zoom 175 % und 200 %** und einem 800×600-Startfenster wird fuer jede der 39 registrierten Szenen eine **neue, unabhaengige Partie** gestartet. Die Szene wird ueber die vorhandene Navigationsschnittstelle geoeffnet; die **erste sichtbare, aktivierte Wirtschaftsaktion** wird ausschliesslich per echter Tab-Taste erreicht und mit Enter aktiviert. Geprueft werden echter Tastaturklick, sichtbarer Fokus, weiterhin gueltiger Wirtschaftszustand, JavaScript-Laufzeitfehler und externe HTTP-Anfragen. Die vollstaendige Browser-CI ruft den neuen Test auf.

## Tatsaechliche GitHub-CI der Implementierung

- [Browser-Rundlauf #40505215686 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40505215686), exakt auf `95b393211465427c58c08a71ce35ffc2ce026573`. **Je Zoomstufe 39 Szenen, 13 aktivierte Wirtschaftsknoepfe, 26 Szenen ohne geeignete Aktion.** In jeweils zwei Faellen aenderte sich der Spielzustand; 0 JavaScript-Fehler und 0 externe HTTP-Anfragen.
- [Quellnachweis #40505215652 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40505215652).
- [Vorrelease-Matrix #40505215474 – BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40505215474): erwartete Gesamtfreigabe-Sperre; keine neue Releasefreigabe.

Die 13 ausgefuehrten Aktions-Vorkommen je Zoomstufe umfassen **12 unterschiedliche Aktionskennungen**: DRILL_SELF_START (in zwei Szenen), END_TURN, SURVEY, DRILL, TANK_UPGRADE, PIPE_START, OFFER, SIGN, REFINERY_BUILD, NETWORK_ENABLE, PUBLIC_CONNECT und RESCUE_LOAN. Das sind **keine 13 vollstaendig fachlich validierten Spielaktionen**. Eine nicht zustandsaendernde Aktion kann korrekt abgelehnt worden sein; der Test kontrolliert hier die Tastaturausloesung und Zustandsintegritaet, nicht jede fachliche Sollfolge.

## Grenzen und naechste Pflichtarbeiten

**BED-02 und BED-03 bleiben BLOCKED. Matrix unveraendert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.** Es fehlen die weiteren Schaltflaechen je Szene, dynamische Zwischenzustaende, systematische Soll-Nachbedingungen fuer erlaubte und abgelehnte Aktionen, vollstaendige Sieg-/Niederlagenpartien sowie alle uebrigen technischen Release-Gates. Die 26 Szenen ohne geeigneten `data-econ`-Kandidaten sind **nicht** als vollstaendig bedient freigegeben.

1. Je Dialog alle weiteren Aktionskennungen mit Vorbedingungen, erwarteter Aenderung oder Ablehnung und Tastatur-Rueckweg testen.
2. Vollstaendige reguläre Sieg-/Niederlagenpartien samt Export, Browser-Neustart und Import abdecken.
3. Uebrige technische Gates, Installations-/Startnachweis und Release-Dokumentation abschliessen.

**Weiterfuehrend:** Die Aktionserfassung mit einer versionierten Soll-Wirkungs-Matrix koppeln, damit ein echter Tastaturklick nie versehentlich als fachlich korrekte Aktion gezaehlt wird. Kein Merge, kein Release; persoenliche Endabnahme erst nach technischem Abschluss und eingefrorenem Kandidaten.
