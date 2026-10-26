# Vorrelease-Pflichtpaket: lokale Zwei-Generationen-Zwischensicherung

**26.10.2026 · Spiel:** PPPOPPI IMPERIUM, Projekt C (technischer Vorschauaufbau).
**Basis:** Entwurfs-PR #60, HEAD `6db24af0ec203ee2ea52e73e6eef9a9ef0bdeb92`.
**Hauptzweig bei Beginn:** `d3dc371154cc1089e06f34d0dc4ff04047132360`.
**Arbeitszweig:** `agent/prerelease-c-autobackup-20261026-1229`.

## Nutzen und Grenzen

Bisher wurden Spielstände nur auf ausdrücklichen Klick als JSON-Datei exportiert.
Der isolierte technische Vorschauaufbau speichert nun nach Partiestart,
erfolgreicher Spielaktion und geprüftem Import zusätzlich lokale Zwischenstände
in **IndexedDB**, einem lokalen Speicher des Browsers. Jede Speicherung
verwendet eine vollständige Schreibtransaktion; zwei Generationen bleiben
erhalten. Ein Fehler beim Schreiben beschädigt eine bereits vollständig
gespeicherte Generation nicht absichtlich. Die sichtbare Statusanzeige
meldet Erfolg oder Fehlschlag und fordert bei Fehlern zum JSON-Export auf.

Eine Wiederherstellung erfolgt **niemals still beim Start**: Sie wird vom
Nutzer über einen eigenen Knopf ausgelöst. Eine laufende Partie wird nur nach
Bestätigung ersetzt. Beim vertraulichen Spielerwechsel ist die Wiederherstellung
gesperrt. Beschädigte oder fachlich ungültige Generationen werden übersprungen,
statt als gültige Spielstände übernommen zu werden. Alte Importvorgänge
dürfen eine neuere Spielaktion/Wiederherstellung nicht überschreiben.

**Wichtige Grenzen:** Browserdaten können gelöscht oder gesperrt werden;
`file://`-Speicher kann vom Pfad/Browserprofil abhängen. Die
Zwischensicherung ist keine externe Datei und ersetzt den JSON-Export nicht.
Ein sofortiger Browserabbruch vor Abschluss der angezeigten Speicherung kann
den letzten Spielzug verlieren. **Ein realer Stromausfall, Datenträgerdefekt
oder unterbrochener Dateisystem-Schreibvorgang wurde nicht geprüft.**
Ein sicherer Stromausfallbetrieb wird ausdrücklich **nicht behauptet**.

## Änderungen (ausschließlich auf Entwicklungszweig)

- `quality_v194/backup_v194.js`: lokale, asynchron geordnete Sicherung,
  atomare Transaktionen, zwei Generationen, Rückfall und Statusanzeige.
- `quality_v194/build.cjs`: ausschließlich der reproduzierbare technische
  Aufbau erhält die Zusatzdatei und kleine, exakt geprüfte Einhängepunkte.
  Die **110 geschützten Originaldateien** bleiben unverändert.
- `quality_v194/test_browser_autobackup_v194.py`: isoliertes, wegwerfbares
  Chromium-Profil mit Browser-Neustart, absichtlich beschädigten Sicherungen,
  Buchungserhalt, manueller Wiederherstellung und Offline-/800×600-Prüfung.
- `.github/workflows/prerelease-browser-project-c.yml`: neue Prüfstufe.

## Prüfungen und Pflichtmatrix

Die exakten Build-Einhängepunkte wurden gegen den tatsächlichen
Quellstand auf eindeutige Treffer und JavaScript-Syntax kontrolliert:
**PASS** (GitHub-Quelltextprüfung, kein Ersatz für Laufzeittests).
Die Browserprüfung ist erst bei einem abgeschlossenen CI-Lauf **PASS**
oder **FAIL**. Alle übrigen 13 bestehenden Chromium-Programme müssen
zusätzlich erneut erfolgreich durchlaufen.

Ausführen (aus Repository-Wurzel, mit Playwright/Chromium):
```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_autobackup_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_autobackup_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

**Pflichten:** `SPE-03`, `FEH-03` und `STA-03` erhalten nur
einen zusätzlichen Teilnachweis. Bis zu echten Unterbrechungstests,
vollständigen Spielverläufen und grünen technischen Gesamtgates bleiben
sie **BLOCKED**. Die harte Pflichtmatrix bleibt
**6/52 PASS · 39 BLOCKED · 4 OPEN · 3 DEFERRED**.
Persönliche Sichtprüfung und Kubuntu-Endabnahme erst nach allen
eigenständig möglichen technischen Prüfungen und eingefrorenem Kandidaten.

## Nächste konkrete Pflichtarbeiten

1. Tatsächliche Schreibunterbrechungen in isolierter, kontrollierter
   Dateisystem-Testumgebung und Verhalten bei Speicherverweigerung prüfen.
2. Lange vollständige Partien, Browserzoom, Tastaturdurchgängigkeit
   und Leistungsmessungen bis zu den harten Freigabegates abarbeiten.
3. Erst nach vollständiger technischer Freigabe Kandidat einfrieren
   und persönliche Endabnahme bündeln.

**Kein Merge, kein Release, keine Top-5-Änderung.**

## Tatsächlich abgeschlossene CI-Prüfung des Implementierungsstands

**Geprüfter Implementierungs-HEAD:** `d9fad38045b4ff4675a850f5a669607697a19899`.

- [Chromium-CI #40316350084](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40316350084): **PASS**, sämtliche 14 Browser-Testprogramme; neuer Sicherungstest mit **18 protokollierten PASS-Zeilen**, darunter zwei Generationen, echter Chromium-Profil-Neustart, beschädigte neueste/beide Generationen, korrekter Rückfall, Buchungserhalt, JSON-Export, 800×600, offline und keine JavaScript-Laufzeitfehler.
- [Quell-/Fach-CI #40316350154](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40316350154): **PASS**; einschließlich Build-Integrität, Originalinventar und statischer UI-Verträge.
- [Integrierte Matrix #40316350068](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40316350068): **FAIL/BLOCKED** am absichtlich harten Gesamtfreigabe-Gate wegen weiterhin offener Pflichten. Keine Vorrelease-Freigabe.

Ein früherer Zwischenstand fiel bei der statischen Build-Diagnose und dem UI-Ressourcenvertrag durch. Die Zusatzdatei wurde daraufhin im erwarteten SHA-Inventar registriert und der UI-Vertrag gezielt angepasst; **erst danach** wurden beide technischen CI-Pfade erfolgreich. Frühere Fehlschläge werden nicht als Erfolg umetikettiert.

**Sicherheitsgrenze:** Der Test beschädigt ausschließlich die zwei Sicherungen im wegwerfbaren Chromium-Testprofil. Kein realer Stromausfall und keine tatsächliche Dateisystem-Schreibunterbrechung. `SPE-03`, `FEH-03`, `STA-03` bleiben BLOCKED.
