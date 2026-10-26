# Vorrelease-Pflichtpaket: abgebrochener Export und Sicherungsrueckfall

**Datum:** 26.10.2026 · **Spiel:** PPPOPPI IMPERIUM (Projekt C)
**Ausgangsbasis:** gestapelter Entwurfs-PR #59, HEAD `c93990f9cf00834091250cf59a45fc1cdc8df0bd`.
**Entwicklungszweig:** `agent/prerelease-c-save-interruption-20261026-1134`.
**Hauptzweig:** `main` HEAD `d3dc371154cc1089e06f34d0dc4ff04047132360` bei Arbeitsbeginn.

## Zweck und tatsächliche Sicherheitsgrenze

Der Browser exportiert Spielstände als JSON-Dateien auf ausdrückliche Anforderung.
Die derzeitige Version besitzt **keine automatische dauerhafte Spielstandsicherung**.
Deshalb kann nach einem Stromausfall nur eine zuvor vollständig exportierte
Datei wiederhergestellt werden. Es wäre falsch, eine automatische Wiederherstellung
des letzten ungesicherten Spielzuges zu behaupten.

Der neue Browser-Test erzeugt zwei echte Wirtschaftszustände über sichtbare
Aktionen (Gutachten, Feldkauf) und exportiert sie. Er bildet aus der späteren
Exportdatei drei defekte **Kopien** (25 %, 75 %, ungültige Bytes), beendet
den Browserkontext und prüft in einer neuen Sitzung:

1. Unvollständige Dateien werden ohne Übernahme abgelehnt.
2. Eine ausdrücklich vorhandene ältere Sicherung wird exakt übernommen.
3. Defekte Importe beschädigen auch einen bereits geladenen Stand nicht.
4. Nach Wiederherstellung lässt sich der Feldkauf regulär fortsetzen.
5. Ein neuerer vollständiger Export ist separat wiederherstellbar; sein
   wiederholter Import erzeugt keine zweite Buchung.
6. 800×600, fehlende Netzanforderungen und JavaScript-Laufzeitfehler.

**Grenze des Nachweises:** Der Test simuliert einen unvollständigen Export
mit gekürzten Datenkopien und einen geschlossenen Browserkontext. Er führt
**keinen realen Stromausfall, keinen Betriebssystemabsturz und keinen
unterbrochenen Schreibvorgang auf einem echten Datenträger** herbei.
Insbesondere ist eine echte Wiederherstellung ohne vorherigen Export
weiterhin nicht möglich. Diese Grenzen bleiben für SPE-03/FEH-03/STA-03
BLOCKED; keine Umdeklaration als PASS.

## Änderungen und Reproduzierbarkeit

- `quality_v194/test_browser_save_interruption_v194.py`: neuer isolierter
  Chromium-Regressionstest, ohne Änderungen an den Original-Spielquellen.
- `.github/workflows/prerelease-browser-project-c.yml`: neuer Prüfschritt.
- Diese Dokumentation mit Abgrenzung, offenen Pflichten und Nachweisen.

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_save_interruption_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_save_interruption_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Die GitHub-Prüfumgebung verwendet Python 3.12, Node 22, Playwright 1.56.0
und Chromium. Bis zur **tatsächlich abgeschlossenen CI auf dem endgültigen
HEAD** gilt der neue Test als **NICHT NACHGEWIESEN**.

## Pflichtmatrix und nächste Umsetzung

Der bisherige formelle Matrixstand ist **6/52 PASS, 39 BLOCKED,
4 OPEN, 3 DEFERRED**. Die drei persönlichen Prüfungen bleiben bis zum
eingefrorenen technisch grünen Release-Kandidaten zurückgestellt.

**Nächste technische Arbeit:** sichere, ausdrückliche Sicherungsstrategie
mit nachvollziehbarer Wiederherstellungsanzeige entwerfen und testen;
Speicher-/Schreibunterbrechungen auf einem geeigneten isolierten Dateisystem
nachweisen; danach vollständige Partien, Browserzoom, Tastatur, Leistung,
Installation und übrige Pflicht-Gates. Automatisches Speichern darf nicht
ohne Datenverlust-/Datenschutzanalyse eingeführt werden.

**Keine Top-5-Repositories berührt. Kein Merge, kein Release.**
