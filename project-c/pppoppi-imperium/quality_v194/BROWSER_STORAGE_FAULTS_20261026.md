# Vorrelease-Pflichtpaket: Browser-Speicherfehler und Sicherungsrueckfall

**Datum:** 26.10.2026. **Spiel:** PPPOPPI IMPERIUM, Projekt C.
**Ausgangs-HEAD:** `8abc3edf29347dd77487d3ac3f1c720bacd15d1b` (Entwurfs-PR #61).
**Arbeitszweig:** `agent/prerelease-c-storage-failures-20261026-1344`, getrennt von `main` und allen Top-5-Repositories.

## Ziel und tatsächliche Änderung

Die automatische Zwei-Generationen-Sicherung aus PR #61 wird gezielt
gegen zwei Fehlerarten geprüft: eine vor dem Schreiben abgebrochene
IndexedDB-Transaktion und ein verweigerter Zugriff auf den Browserspeicher.
Beide Eingriffe finden ausschließlich in einem wegwerfbaren Chromium-Profil
statt. Die 110 geschützten Originaldateien bleiben unverändert.

- `quality_v194/backup_v194.js`: Wenn der Browser das Lesen der
  Sicherungen verweigert, zeigt die Statusanzeige jetzt ausdrücklich den
  Wiederherstellungsfehler und die Empfehlung zum JSON-Dateiimport.
  Eine fehlende Sicherung erhält ebenfalls eine sichtbare Fehlermeldung.
- `quality_v194/test_browser_storage_faults_v194.py`: automatisierte
  echte Browserklicks und absichtlich abgebrochene IndexedDB-Transaktion;
  Vergleich von Geld, Eigentum und Buchungen vor/nach Wiederherstellung;
  Speicherverweigerung bei Schreiben und Lesen; JSON-Export, Neustart,
  Offline-Betrieb und 800×600.
- `.github/workflows/prerelease-browser-project-c.yml`: zusätzliche
  eigenständige Browser-Teststufe; alle bestehenden Tests bleiben erhalten.

## Reproduzierbare Prüfungen

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_storage_faults_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_autobackup_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

**Vor CI:** Der neue Browser-Test ist erst nach tatsächlichem GitHub-Lauf
als PASS oder FAIL zu bewerten. Das harte Gesamtgate muss wegen offener
Release-Pflichten weiterhin BLOCKED melden. Nachträglich hier nur
tatsächlich ausgeführte Läufe mit Commit und Link dokumentieren.

## Abgrenzung und Pflichtmatrix

- `SPE-03`: weitere Teilprüfung, keine vollständig nachgewiesene
  Dauerhaftigkeit der Speicherung.
- `FEH-03`: Fehleranzeige und Rückfall technisch prüfbar, noch keine
  umfassende Abdeckung aller Speicherfehler.
- `STA-03`: Neustart nach fehlgeschlagenem Schreibversuch technisch
  prüfbar, noch keine vollständige Stabilitätsfreigabe.
- Gesamtmatrix bleibt **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**.
- **Nicht geprüft:** echter Stromausfall, Datenträgerausfall, Dateisystem-
  Schreibunterbrechung, Dauerhaltbarkeit auf Kubuntu, vollständige Partien,
  nativer Zoom, gesamte Tastaturführung und Leistungsgrenzen.
- Persönliche Sichtprüfung und Kubuntu-Praxistest ausschließlich nach allen
  technischen Pflichtprüfungen und eingefrorenem Vorrelease-Kandidaten.
- **Kein Merge, kein Release, keine Freigabe.**

## Nächste Pflichtarbeiten

1. CI auf dem finalen Dokumentations-HEAD prüfen und etwaige Fehler beheben.
2. Sichere Wiederherstellung bei realistischen Browser-/Datenträgerabbrüchen
   in isolierter Testumgebung, ohne Stromausfallsicherheit zu behaupten.
3. Danach vollständige Partien, Zoom, Tastatur und Leistung systematisch
   gegen die 52 Pflichtgates nachweisen.
