# PR #27 – Abweichungen, technische Übernahme und bewusster Ersatz (30.10.2026)

**Geltung:** Nur Projekt C / PPPOPPI IMPERIUM, technischer Entwicklungszweig aus PR #137. **Kein Release, kein Merge, keine automatische Freigabematrixänderung.**

- Historischer, auseinanderentwickelter PR #27: `1f0dd36583c5588b7eff4b0e92d27a9f620d2e1d`.
- Bereits vollständig browservalidierte Nachfolge: `8797669f61493fd81ba3f7760f71b21793fcca99`; GitHub-Quellworkflow [#41136120035](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41136120035) **SUCCESS**, Chromium [#41136120005](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41136120005) **8/8 SUCCESS**.
- Zusätzliche V0.7-/Schema-Negativfälle sind im **bestehenden** `test_browser_legacy_v194.py` ergänzt; GitHub-CI auf dem **neueren** Head muss separat abgeschlossen sein, bevor dafür ein PASS behauptet wird.
- Die 110 inventarisierten Originaldateien unter `SPIEL/` bleiben geschützt. Korrekturen werden nur beim Technikaufbau angewendet.

## Entscheidung je unabhängigem historischem Commit

| PR-#27-Commit | Gegenstand | Neuere Entsprechung | Entscheidung |
|---|---|---|---|
| `6e4629f71` | WIR-01 Marktpreis/Buchungsjournal | Unverändert übernommener `test_market_ledger_v194.cjs`, 6 Prüfungen; Quell-CI | **Erhalten, geprüft** |
| `3db328d7b` | WIR-02 private/öffentliche Fracht | `test_logistics_costs_v194.cjs`, 7 Prüfungen und spätere Browser-Frachtkette | **Erhalten, geprüft** |
| `8cddef74a` | LOG-05 einmaliger Monatsabschluss | `test_monthly_idempotence_v194.cjs`, 8 Prüfungen und Mehrmonatsläufe | **Erhalten, geprüft** |
| `06374ae55` | WIR-03 Raffinerie/Vertrag/Lager | `test_refinery_contracts_v194.cjs`, 10 Prüfungen und spätere Vertrags-Browserfälle | **Erhalten, geprüft** |
| `cd7e6d96e` | WIR-04 Geldgrenzen/Zins-/Tilgungsrundung | `test_financial_limits_v194.cjs`, 10 Prüfungen; `BigInt`-Berechnung in **beiden erzeugten** V0.8.2-Engine-Modulen | **Schutz wiederhergestellt, geprüft** |
| `b6859b2fd` | SPE-01 Speichern/Import, aktives Minispiel | Reale `test_browser_roundtrip_v194.py`, `test_browser_keyboard_drill_v194.py`, `test_browser_complex_roundtrip_v194.py`; aktiver Reglerstand und Handoff durch Chromium geprüft | **Funktion erhalten; historischer DOM-Mock nicht kopieren** |
| `1edf8b79f` | SPE-02 V0.8-Migration, Gutachten, Versionen | `test_legacy_survey_allocation_v194.cjs` und `test_browser_legacy*_v194.py`; beide Engine-Pfade im erzeugten Stand repariert | **Schutz wiederhergestellt; zusätzliche V0.7-Gegenprobe im neuen CI** |
| `1374c5b8f` | SPE-03 zwei Sicherungsgenerationen, Wiederherstellung, Übergabe | `backup_v194.js`, `test_browser_autobackup_v194.py`, `test_browser_storage_faults_v194.py`; Handoff über zwei echte Chromium-Neustarts geprüft | **Bewusst anderes, geprüftes Speichermodell** |
| `1f0dd3658` | SIC-01 Import-Traversal und lokale Dateigrenzen | `test_import_filename_guard_v194.cjs` (24 Fälle), `test_browser_import_input_security_v194.py`; `assertSafeImportFile` im erzeugten Browserimport | **Schutz wiederhergestellt, geprüft** |

**Keine Änderung an der historischen `prerelease/matrix.json` von PR #27 übernehmen.** Der alte Ast erklärt dort neun zusätzliche technische Gates zu PASS und führt neun spezifische Evidenzdateien auf. Diese Behauptungen stammen von einem **anderen Commit- und Abnahmezustand**; die 52 Punkte des jüngeren Astes stehen weiterhin bei **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED**. Einzelne bestandene CI-Schritte dürfen die übergreifende Freigabesperre nicht umgehen. Die historischen Evidenzdateien bleiben auf dem bewahrten PR-#27-Ast für das spätere Gate-Audit zugänglich; sie wurden nicht gelöscht.

## Bewusst ersetzte Altmechanismen – nicht zurückportieren

1. **Altes `localStorage` mit Haupt- und Reserveschlüssel:** durch zwei IndexedDB-Generationen ersetzt. Eine IndexedDB-Transaktion schreibt den Zustand samt Vertraulichkeitskennung; das verringert das Risiko halb geschriebener Speicherstände. Die aktuelle Lösung wurde mit simulierten Transaktionsabbrüchen und realen Chromium-Neustarts geprüft. **Kein Nachweis für physische Stromausfälle oder Dateisystemdefekte.**
2. **Stilles automatisches Wiederherstellen beim Start:** ersetzt durch **ausdrückliches manuelles Wiederherstellen**. So wird ein fremder oder alter Spielstand nicht unbemerkt in eine neue Sitzung geladen. Das ist eine gewollte Verhaltensänderung, kein zu reparierender Kompatibilitätsfehler.
3. **Direktes Reparieren des Primär-Slots beim Fallback:** ersetzt durch lesendes Prüfen und Auswahl der neuesten gültigen Sicherung; die beiden vorhandenen Generationen werden beim Wiederherstellen nicht unkontrolliert umgeschrieben. Einträge bleiben bis zu einer bewusst ausgelösten erfolgreichen Speicherung erhalten.
4. **Alte `commandNo`-Kennung im Sicherungs-Wrapper:** Der neue Snapshot enthält den validierten Engine-Zustand samt `processedIds`; UI-Anforderungen benutzen `neo-<Zähler>-<Zeitstempel>` und werden gegen die Engine-Prüfung auf doppelte Befehle validiert. Die alte Wrapperstruktur soll **nicht** als drittes Speicherformat reaktiviert werden.
5. **Alte simulierte DOM-/Dateiprüfprogramme `test_save_roundtrip_v194.cjs`, `test_save_migration_v194.cjs`, `test_local_backup_v194.cjs` und `test_import_paths_v194.cjs`:** ihre Zielinvarianten werden in der aktiven Architektur über echte Browser- und zusätzliche isolierte Tests bewertet. Eine **bytegleiche** Übernahme der alten Testprogramme würde das inzwischen ersetzte `localStorage`-/Handler-Modell künstlich zurückverlangen. Die historischen Dateien bleiben unverändert in PR #27.

## Echte Schutzfälle und Beleggrenzen

- Die zuvor fehlende vertrauliche H1→H2-Übergabe wurde **reproduziert, repariert und in Chromium freigegeben**: [#41134904836](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41134904836), 8/8 Jobs SUCCESS. Kein direkter Blick auf H2 nach Restore; Anzeige und Speicherstatus bleiben bis zur Freigabe gesperrt.
- Auch *Dateilesefehler ohne Veränderung beider IndexedDB-Generationen* und *aktives Minispiel mit Reglerstand 60 nach JSON-Roundtrip* wurden im realen Browser unter [#41136120005](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41136120005) bestätigt. Beide wurden ausschließlich in **vorhandenen** Prüfscripten ergänzt.
- V0.7, fehlende Schemaversion und zukünftige Version: Der aktuelle UI-Test prüfte bisher V0.6, beschädigte V0.8 und vollständige V0.8-/V0.8.2-Migration. Die drei spezifischen Negativvarianten wurden daher im vorhandenen `test_browser_legacy_v194.py` ergänzt. Bis zum neuen CI ist **kein aktuelles PASS** belegt.
- Unabhängiger Benutzerexport als externe Sicherheitskopie ist weiterhin notwendig: Browserprofile, Cookies/Website-Daten oder das Gerät können beide lokalen Sicherungen verlieren.
- Unterschiedliche alte JSON-Byteformatierungen, abweichende Zeitstempel und der Verzicht auf stilles automatisches Restore sind **keine Datenverlustnachweise**. Entscheidend ist die exakte Gleichheit des validierten Spielzustands, seine Fortsetzbarkeit und die sichtbare Herkunft der importierten Version.

## Entscheidung und Schließkriterium

**PR #27 bleibt OPEN/DRAFT.** Aus seinen neun abweichenden Commits wurden die nachweisbar benötigten Schutzfunktionen selektiv übernommen. Noch nur dort enthaltene historische Gate-Evidenzen, Prüfberichte und DOM-/localStorage-Tests sind bewusst **nicht** ohne fachliche Zuordnung als heutige Freigaben oder Codeänderungen übertragen. Eine Schließung ist erst zulässig, wenn auch diese verbliebenen Unterschiede in einem finalen Integrationsaudit **explizit als erhalten, geprüft oder begründet ersetzt** abgezeichnet sind. Das gilt ebenso für die 110-Quellen-Rechteprüfung und alle sonstigen Freigabegates.

**Keine Freigabematrix-Änderung, keine Verminderung von Prüfpflichten, kein Merge nach `main`, keine Zweig-Löschung und kein Vorrelease.**
