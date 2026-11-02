# Vorrelease-Pflichtpaket: Endspieladapter im echten Offline-Browser bereitstellen

**Datum:** 28.10.2026. **Bereich:** Projekt C, eigenstaendige PPPOPPI-Adaption. **Basis:** PR #110, Ausgangs-HEAD `13e417edbb39d6cb51a5039f83e05ab1358df220`; `main` bei Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Ausgangslage und technische Entscheidung

Die drei isolierten Module `endstate_candidate_v194.cjs`, `endstate_archive_io_v194.cjs` und `endstate_session_v194.cjs` konnten bisher nur in Node.js ausgefuehrt werden. Der eigentliche Offline-Browser kann kein CommonJS-`require` aufloesen. Eine separate Neuprogrammierung der Regeln im Browser wuerde zwei voneinander abweichende Endspielimplementierungen erzeugen.

`endstate_browser_bundle_v194.cjs` erstellt deshalb aus **denselben drei Moduldateien** ein geschlossenes Browserpaket, ohne Fremdbibliothek, Netzaufruf oder Aenderung der Spieloriginale. `build.cjs` prueft weiterhin alle 110 Quellhashes, prueft die Syntax des Pakets vor dem Anlegen des Zielordners und schreibt `src/endstate_browser_v194.js` nur in einen **neuen** Technik-Zielordner. Das Paket wird vor der bisherigen `neo_bridge.js` geladen und steht unter `window.PPPEndstate` bereit.

**Wichtige Grenze:** Das Paket ist noch **nicht an Spielaktionen, Enddialog, Archiv-Schaltflaechen oder bestehende Speicherbedienung angeschlossen**. Es aendert weder Wirtschaftsregeln noch das bestehende Speicherformat. Die Benutzeroberflaeche darf daraus noch keinen Vorrelease-Erfolg ableiten.

## Gezielte Pruefungen

- `node --test project-c/pppoppi-imperium/quality_v194/test_endstate_browser_bundle_v194.cjs`: drei Tests fuer Quellmodul-Identitaet, Browserkontext ohne Node-`require`, freien Abschluss, JSON-Wiederherstellung, Aktionssperre und defekte Archive.
- `python3 project-c/pppoppi-imperium/quality_v194/test_browser_endstate_bundle_v194.py`: erzeugt die separate Technikfassung mit SHA-256-Pruefung, startet echtes Offline-Chromium bei 800×600, laedt die drei Module, fuehrt mit der echten V0.8.2-Engine einen menschlichen Spielzug aus, exportiert/importiert die aktive Sitzung, beendet sie freiwillig, prueft Archiv und gesperrte Folgeaktionen.
- Die beiden Tests laufen als getrennte Schritte in der bestehenden GitHub-Browser-CI. Vorherige Browser- und Quelltests duerfen nicht regressieren.

**CI-Nachweise:** Erst nach tatsaechlichem Lauf mit exaktem HEAD eintragen. `PASS` nur fuer ausgefuehrte Schritte; `SKIP` oder `IN_PROGRESS` ist keine Freigabe.

## Vorrelease-Pflichten

`VER-01` und `SPE-03` erhalten einen Teilbeleg, bleiben jedoch **BLOCKED**. Gesamtmatrix vor neuen Pruefungen: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Die persoenlichen Endabnahmen bleiben bis zum eingefrorenen, technisch vollstaendigen Kandidaten zurueckgestellt.

## Naechste drei Schritte

1. Node- und Chromium-CI des neuen PR-HEAD pruefen; jeden echten Fehler beheben.
2. Den nun browserfaehigen Sitzungsadapter ausschliesslich im abgeleiteten Technikaufbau mit **allen** Spielaktionen, der Moduswahl und dem bestaetigten Enddialog verbinden; bestehende Savegames sicher migrieren.
3. Vollstaendige Browser-Sieg-/Niederlagenpartien mit 800×600, nativem Zoom, Tastatur, Import, echten Prozessneustarts und geschuetztem Abschlussarchiv nachweisen.

**Kein Merge, kein Release, keine historische C64-Originalbehauptung und keine vorgezogene Benutzerabnahme.**
