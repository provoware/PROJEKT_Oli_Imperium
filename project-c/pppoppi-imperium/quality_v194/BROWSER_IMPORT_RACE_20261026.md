# Projekt C – Pflichtpaket: Import-Wettlauf und Abbruch (26.10.2026, 07:30 MEZ)

## Abgrenzung und Grund

- **Basis:** Entwurfs-PR #55, HEAD `4340037de75544c7aa9d9e805c0fed06d179864f`.
- **Zweig:** `agent/prerelease-c-import-race-20261026-0730`; gestapelt auf #55, nicht auf `main`.
- **Betroffene Pflicht-IDs:** `SPE-01`, `SPE-03`, `FEH-03`, `LOG-05`, `TES-04` (nur Teilnachweise).
- **Problem:** `importGame` las eine Datei asynchron, übernahm sie aber unabhängig davon, ob inzwischen eine andere Datei gewählt, eine neue Partie begonnen oder eine Wirtschaftshandlung ausgeführt wurde. Ein verspäteter älterer Import konnte damit einen neueren gültigen Spielstand still überschreiben.
- **Risiko vor Änderung:** Verlust zwischenzeitlicher Spielaktionen oder unerwartete Rückkehr zu einer älteren Datei. Es handelt sich um einen technischen Befund aus dem Quellcode, nicht um einen bereits gemessenen Nutzerschaden.

## Kleine, getrennte Änderung

1. `quality_v194/build.cjs` ergänzt vier exakt abgegrenzte Patches für die **temporär erzeugte technische Vorschau**. Die 110 unveränderten Originalquellen werden weder bearbeitet noch überschrieben.
2. Eine monotone Importkennung sorgt dafür, dass **nur die zuletzt ausgewählte Importdatei** nach der asynchronen Lesephase übernehmen darf. Auch ein fehlerhafter letzter Import entwertet frühere, noch laufende Dateilesungen.
3. Eine neue Partie oder eine erfolgreich übernommene Wirtschaftshandlung entwertet alle noch laufenden Importe. Veraltete Fehler- und Erfolgsmeldungen werden unterdrückt. Die Validierung vor der Übernahme bleibt erhalten.
4. `quality_v194/test_browser_import_race_v194.py` erzeugt zwei unterschiedliche, gültige Spielstände über echte Browseraktionen. Es verzögert ausschließlich `File.text()` **im flüchtigen Testbrowser**, um die Reihenfolge reproduzierbar umzudrehen.
5. Der bestehende Chromium-Pflichtworkflow führt den neuen Test nach den bisherigen acht Browserprüfungen aus.

## Erwartete und nachzuweisende Prüfungen

| Fall | Erwartetes Ergebnis | Status bei Erstellung |
|---|---|---|
| Langsam gelesene ältere Datei, danach schnell gelesene neuere Datei | Neuere Auswahl bleibt vollständig erhalten | PENDING |
| Langsam gelesene gültige Datei, danach defekte Datei | Bestehender Stand bleibt erhalten; kein verzögerter Rückimport | PENDING |
| Langsam gelesene Datei, danach gültige Wirtschaftsaktion | Wirtschaftshandlung bleibt erhalten | PENDING |
| Langsam gelesene Datei, danach neue Partie | Neue Partie bleibt erhalten | PENDING |
| Browserkontext während angehaltenem Dateilesen schließen | Neuer Browserkontext beginnt ohne halbfertigen Import | PENDING |
| Vorher exportierte gültige Sicherung ausdrücklich laden | Vollständige Wiederherstellung ohne Buchungsverlust | PENDING |
| 800 × 600, Offlinebetrieb, JavaScript-Laufzeitfehler | Kein Überlauf, keine HTTP-Anfragen, keine Laufzeitfehler | PENDING |

**Wichtige Grenze:** Ein absichtlich verzögertes Dateilesen und ein geschlossener Browserkontext sind **kein** echter Stromausfall während eines Dateisystem-Schreibvorgangs. Eine automatische Sicherung existiert dadurch nicht; der Nutzer muss eine zuvor exportierte gültige Datei ausdrücklich importieren. Die ältere Datei bleibt auf dem Datenträger erhalten und kann bei bewusster Auswahl weiterhin geladen werden.

## Prüf- und Freigabeprotokoll

- Python-Syntax: `python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_import_race_v194.py`.
- JavaScript-Syntax: `node --check project-c/pppoppi-imperium/quality_v194/build.cjs`.
- Browser-Einzeltest: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_import_race_v194.py` (Python 3.12, Playwright 1.56, Chromium).
- Pflichtworkflow: `.github/workflows/prerelease-browser-project-c.yml`.
- Harte Gesamtfreigabe: `node project-c/pppoppi-imperium/prerelease/check.mjs --technical`.

**Status bei Erstellung:** Implementiert, Browserausführung/CI noch nicht nachgewiesen. Kein PASS vor tatsächlicher Ausführung. Matrix unverändert **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**; kein technischer Vorrelease-Kandidat.

## Drei nächste Pflichtarbeiten

1. Neue Chromium-CI und Quell-/Fach-CI auf dem endgültigen Commit prüfen; jeden tatsächlich gefundenen Fehler korrigieren und erneut testen.
2. Kompatible ältere Spielstandversionen mit gültigen und absichtlich defekten Varianten prüfen; Versionsmigration und Buchungserhalt getrennt belegen.
3. Unterbrechung während realer Speicherung, echter nativer Browserzoom 175–200 %, vollständige Tastaturpfade und Langzeit-Leistungstest bleiben getrennte Pflichtpakete.

**Weiterführende Empfehlung:** Automatische Wiederherstellung und echte Unterbrechungssicherheit erst dann als PASS markieren, wenn ein reproduzierbarer Test mit tatsächlich unterbrochenem Schreibvorgang und nachgewiesenem Rückfall auf eine gültige Sicherung vorliegt.

Kein Merge, kein Release, keine persönliche Sichtprüfung oder Kubuntu-Endabnahme vor vollständigen technischen Gates und eingefrorenem Kandidaten.
