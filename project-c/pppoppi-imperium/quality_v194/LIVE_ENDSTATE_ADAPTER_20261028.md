# Projekt C – Endspiel-Laufzeit in echte Spielaktionen eingebunden (Teilpaket)

**Stand:** 28.10.2026, 14:30 Uhr MEZ. **Basis:** Entwurfs-PR #111, HEAD `82f0516f446cdd9c614bcf8acb65d15d71611129`; `main` `d3dc371154cc1089e06f34d0dc4ff04047132360`. **Bereich:** ausschliesslich abgeleitete Technikfassung der eigenstaendigen PPPOPPI-Adaption, keine C64-Originalregel.

## Ziel und Umsetzung

Das bisher nur ladbare Endspielpaket wird ueber `endstate_live_v194.js` mit den echten Wirtschaftsbefehlen verbunden. Der Adapter verwaltet einen ausdruecklichen Vertrag (`free` oder `campaign:12/24/60/120/240`), ruft den **gleichen** versionierten Sitzungsadapter auf und prueft die Synchronitaet des laufenden Spielstands vor jeder Aktion. Die abgeleitete `neo_bridge.js` leitet sowohl normale Aktionen als auch Minispiel-Einstellschritte ueber diese Schnittstelle. Der urspruengliche `SPIEL/`-Bestand mit 110 geschuetzten Dateien wird nicht geaendert.

Bei einer zeitlich begrenzten Kampagne wird der Schlussbericht vom Sitzungsadapter bewertet und danach jede weitere Spielaktion abgewiesen. Freie Partien koennen ueber den Adapter ausdruecklich beendet und archiviert werden. Die getrennte Technikfassung stellt den Adapter vorerst ueber `window.NeoEconomy.endstate` bereit; der normale Spielstart verwendet den dokumentierten freien Modus. Fuer technische Tests kann `NeoEconomy.start('2-0','campaign:12')` eine Kampagne starten. Dies ist **noch keine vollstaendige, laienfreundliche Endspieloberflaeche**.

Ein alter, unversionierter JSON-Spielstand wird nach erfolgreicher Validierung bewusst **ohne** Endspielvertrag geladen (`legacy`); ebenso eine alte Zwischensicherung. Es gibt keine stillschweigende Kampagnenmigration. Ein solcher Spielstand bleibt mit dem alten Spielkern spielbar, hat aber noch keinen versionierten Endspielabschluss. Fuer eine vollstaendige Vorrelease-Freigabe muss die Oberflaeche spaeter Spielart, Enddialog, Sitzungsimport/-export und Archivbedienung sicher bereitstellen. Ein normaler alter JSON-Export speichert keinen Kampagnenvertrag.

## Pruefplan und Nachweise

- `node --test project-c/pppoppi-imperium/quality_v194/test_endstate_live_v194.cjs`: echte Engine, freie Partie mit Abschluss und Aktionssperre, 12-Monats-Kampagne mit Rangliste, Sitzungs-Rundlauf, Ablehnung ungueltiger Daten, ausdrueckliche Altstand-Abkopplung.
- `python3 project-c/pppoppi-imperium/quality_v194/test_browser_endstate_live_v194.py`: echter Offline-Chromium-Start mit 800×600, reale `NeoEconomy`-Spielaktion, freiwilliger Abschluss und Sperre, Kampagnenvertrag, 110 Originalhashes.
- `node project-c/pppoppi-imperium/quality_v194/test_ui_integrity_v194.cjs` und `node --test project-c/pppoppi-imperium/quality_v194/test_build_safety_v194.cjs`: 23 lokale HTML-Ressourcen, drei freigegebene Zusatzelemente, geschuetzter Aufbau.
- Alle vorhandenen GitHub-CI-Jobs bleiben aktiv. **CI-Ergebnis erst nach Abschluss des Laufs auf dem tatsaechlichen finalen HEAD als PASS/FAIL eintragen.** Ein gruenes Teilpaket ist keine Release-Freigabe.

## Offene Risiken / BLOCKED

1. Noch kein sichtbarer Spielmodus-Waehler, Enddialog oder Archivimport/-export in der normalen Oberflaeche; nur technische API.
2. Alte JSON-Spielstaende und lokale Zwischensicherungen tragen keinen Endspielvertrag; Migrationsentscheidung und Bedienung sind offen.
3. Vollstaendige menschliche Sieg- und Niederlagenpartien mit nativer Tastatur, 175/200-%-Zoom, mehreren echten Chromium-Prozessneustarts und Speicherrueckfall fehlen.
4. Historische Originalreferenz, Bildrechte und persoenliche Endabnahme sind weiterhin getrennt und offen.

**Matrix:** `VER-01` und `SPE-03` erhalten Teilbelege und bleiben `BLOCKED`. Unveraendert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**.

## Naechste drei Schritte

1. Neue Node-/Chromium-Tests sowie die vollstaendige GitHub-CI auf dem PR-HEAD auswerten und Fehler korrigieren.
2. Spielart-Auswahl, bestaetigten Enddialog, Sitzungsimport/-export und schreibgeschuetzte Archivansicht im abgeleiteten Browseraufbau mit Fokus- und Tastaturpruefung anbinden.
3. Komplette Sieg-/Niederlagenpartien inklusive Neustarts, Spielstand-Rundlauf und 800×600/Zoom automatisiert nachweisen.

**Kein Merge, kein Release, keine Veraenderung der Originalquellen, keine vorgezogene persoenliche Abnahme.**
