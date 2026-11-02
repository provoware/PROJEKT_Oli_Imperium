# Vorrelease-Pflichtpaket: regulär erfüllte und gebrochene V0.8-Verträge

**Datum:** 26.10.2026 · **Spiel:** PPPOPPI IMPERIUM, Projekt C
**Basis:** Entwurfs-PR #58, HEAD `8418fec2e8490a98102c2cca2fe7b8afbbb8d697`.
**Zweig:** `agent/prerelease-c-legacy-contracts-20261026-1037`.

## Ziel, Risikoprüfung und Umfang

Die bisherige Browser-Regression beweist die sichere Ablehnung **offener**
V0.8-Verträge, nicht aber die korrekte Übernahme **regulär abgeschlossener**
Verträge. Fehlende Nachweise könnten bei der Migration Geld, Rechnungen,
Vertragsstrafen, Bestände oder Wiederholungsschutz übersehen.

Gezielte Änderung: **ein neuer Browser-Test, eine neue CI-Teststufe, dieser
Nachweis**. Kein Eingriff in Wirtschaftsregeln, Migration, vorhandene
Spielstände, `main` oder die 110 geschützten Originaldateien.

## Prüffälle (ohne manipulierte Buchungen)

Der Test `quality_v194/test_browser_legacy_contracts_v194.py` erstellt mit
dem unveränderten V0.8-Motor jeweils eine echte Partie:

1. **DONE:** Gutachten → Feldkauf → Bohrung → Förderung → Vertrag →
   Monatsende → Monat zwei → fristgerechte Lieferung und Abrechnung →
   Monat drei.
2. **BREACH:** Gutachten → Feldkauf → Vertrag ohne Förderung →
   Monatsende → Monat zwei → nicht erfüllter Vertrag mit Vertragsstrafe →
   Monat drei.
3. Jeweils offener Vertrag in Monat zwei: Import muss **ohne Änderung**
   des bestehenden Spielstands abgewiesen werden.
4. Nach natürlichem Abschluss: Migration auf V0.8.2 und Vergleich von
   Vertrag, Journal, Rechnungen, Geld, Schulden, Statistik, Ereignissen,
   Berichten, verarbeiteten Aktionskennungen, Besitz und Restlager.
5. Export, Wiederimport und unveränderte Buchungen; 800×600,
   Offlinebetrieb und JavaScript-Fehlerkontrolle.

**Abgrenzung:** Die Szenarien verwenden echte Spielmotor-Aktionen,
aber der Import erfolgt über die Dateiauswahl im Browser. Die
Wirtschaftsaktionen des Altstands werden über die V0.8-Motor-Schnittstelle
und nicht über historische Browserklicks ausgeführt. Kein Original-C64-Test.

## Reproduzierbare Prüfungen

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_legacy_contracts_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_legacy_contracts_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Python 3.12, Node 22, Playwright 1.56.0 und Chromium werden im
bestehenden Browser-CI bereitgestellt. Die Ergebnisse sind erst
nach dem tatsächlichen Lauf auf dem **endgültigen Commit** PASS/FAIL;
die Aufnahme in CI allein gilt **nicht** als bestandener Test.

## Vorrelease-Pflichtmatrix

Teilnachweis: **SPE-02** (Altstandsübernahme), **LOG-03** (Verträge),
**LOG-05** (Buchungsintegrität), **FEH-03** (Ablehnung),
**TES-04** (Regression). Keine vollständige Freigabe dieser Gates.

Bisheriger Matrixstand: **6/52 PASS, 39 BLOCKED, 4 OPEN,
3 DEFERRED** (persönliche Endabnahme). Erst nach Prüfung aktualisieren.
Die persönliche Sichtprüfung und der Kubuntu-Praxistest erfolgen gesammelt
nach allen eigenständig möglichen technischen Gates und eingefrorenem
Vorrelease-Kandidaten.

## Offene Pflichten und nächste Implementierung

1. Testfehler aus der echten CI auswerten, gegebenenfalls gezielt
   korrigieren; finalen HEAD und konkrete CI-Links im PR dokumentieren.
2. Sicheren Umgang mit Schreibunterbrechungen und Rückfall auf die letzte
   gültige Sicherung einschließlich klarer Fehleranzeige prüfen.
3. Vollständige Spielpartien, nativen Browserzoom, durchgehende
   Tastaturbedienung, Leistung und verbleibende Matrix-Gates prüfen.

**Kein Merge, kein Release, keine Änderungen an den fünf
ausgeschlossenen Repositories.** Veröffentlichung nur mit
ausdrücklicher Nutzerfreigabe.

## Tatsächliche erste CI auf dem Implementierungs-HEAD

**Geprüfter Implementierungs-HEAD:** `910f643344ef090e34a8d9ceb128e84e9a22a799` (3 Commits, 3 Dateien gegenüber PR #58).

- [Chromium-CI #40301249120](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40301249120): **PASS**. Alle zwölf Browser-Testprogramme, einschließlich neuem Vertrags-Test mit **22/22 PASS**. Zwei natürlich entstandene Ergebnisse (DONE/BREACH), zwei abgelehnte offene Altverträge, vollständige Buchungen, Export/Wiederimport, 800×600, Offlinebetrieb und keine JavaScript-Laufzeitfehler.
- [Quell-/Fach-CI #40301248854](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40301248854): **PASS**. Originalinventar, Forschungs- und Fachprüfungen.
- [Integrierte Pflichtmatrix #40301249059](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40301249059): **FAIL/BLOCKED** ausschließlich am harten technischen Gesamt-Gate. Vorherige Matrix-, Forschungs-, Import- und Quellenprüfschritte **PASS**.

**Hinweis:** Diese Dokumentationsnachtragung erzeugt einen weiteren Commit.
Der finale HEAD muss separat durch GitHub-CI geprüft werden; die oben
genannten Ergebnisse beziehen sich nur auf den Implementierungs-HEAD.
Die Gesamtmatrix bleibt bei **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**.
