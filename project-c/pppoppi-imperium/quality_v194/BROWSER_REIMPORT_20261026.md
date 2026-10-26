# Projekt C – Pflichtpaket: wiederholter Spielstandimport (26.10.2026, 06:33 MEZ)

## Herkunft und Abgrenzung

- **Spiel:** PPPOPPI IMPERIUM; isolierte V1.9.4-Prüfschicht über dem unveränderten V1.9.3-Spielkern.
- **Basis:** Entwurfs-PR #54, HEAD `7d4b1fffd31c3e934c444eca05b23d89be52101c`.
- **Zweig:** `agent/prerelease-c-reimport-idempotency-20261026-0633`, gestapelt auf #54; endgültigen HEAD und CI-Status im zugehörigen Entwurfs-PR prüfen.
- **Pflichtmatrix:** `SPE-01`, `SPE-03`, `FEH-03`, `LOG-05`, `TES-04` (ausschließlich Teilabdeckung). Unverändert **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**.
- **Änderungsumfang:** neuer Chromium-Test `quality_v194/test_browser_reimport_v194.py`, ein zusätzlicher Pflichtschritt im bestehenden Browser-Workflow, dieser Bericht. Keine Änderung an Spielkern, Originalinventar, produktiven Spielständen, Hauptzweig oder ausgeschlossenen Repositories.

## Nachprüfbarer Ablauf

1. Mit einem **frischen Spielstand** über acht echte Wirtschaftsschaltflächen und regulären Monatsabschluss eine Insolvenz erzeugen; ohne künstlich gesetzte Finanzwerte.
2. Einmaligen Rettungskredit im Browser buchen und den gültigen Spielstand mit der echten Export-Schaltfläche sichern.
3. Browserkontext schließen und den **identischen Spielstand sechsmal** importieren. Nach jedem Import den vollständigen Zustand einschließlich Firmenbuchungen, Forderungen, Ereignissen, verarbeiteten Aktionskennungen und Monatsberichten mit dem Export vergleichen.
4. Drei beschädigte Varianten importieren: abgeschnittenes JSON, falsches Spielstandschema, negativer Kassenwert. Jede Variante muss zurückgewiesen werden; die gültige Partie muss **unverändert** bleiben.
5. Folgemonat genau einmal starten und kontrollieren, dass nur ein Rettungskredit und ein Monatsbericht vorhanden sind.
6. Erneut exportieren, Browserkontext schließen und den **Folgemonat sechsmal** importieren; wiederum sämtliche Buchungen und Ereignisse unverändert vergleichen.
7. Offline-Dateistart, 800 × 600, fehlende externe HTTP-Anfragen und fehlende JavaScript-Laufzeitfehler prüfen.

**Isolierung:** Ein temporärer Build-Ordner wird automatisch entfernt. Browserprofile sind flüchtig. Keine produktiven Dateien werden importiert, verändert oder überschrieben.

## Prüfbefehle und Freigabegrenzen

- Syntaxprüfung: `python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_reimport_v194.py`.
- Browser-Einzeltest: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_reimport_v194.py` (Python 3.12, Playwright 1.56, Chromium, Node 22).
- Pflicht-Workflow: `.github/workflows/prerelease-browser-project-c.yml`.
- Gesamtsperre: `node project-c/pppoppi-imperium/prerelease/check.mjs --technical` bleibt **BLOCKED**, bis sämtliche technischen Pflichten vollständig freigegeben sind.

**Status bei Erstellung:** Testimplementierung und CI-Einbindung vorhanden; Browserausführung zunächst **PENDING**. Der nachfolgende Abschnitt enthält den inzwischen nachgewiesenen CI-Stand. Ein bestandener Einzeltest ist **keine** vollständige Freigabe von `SPE-01` oder `SPE-03`. Ein echtes Abschalten während eines Schreibvorgangs wird hier **nicht** simuliert.

## Drei nächste Pflichtarbeiten

1. GitHub-Chromium-Lauf auswerten; bei FAIL zunächst konkrete Ursache beheben und erneut auf dem finalen HEAD prüfen.
2. Weitere echte Unterbrechungs- und Wiederherstellungsszenarien testen, insbesondere konkurrierende Imports, fehlende Dateien und ältere Spielstandversionen.
3. Nativen Browserzoom 175–200 %, vollständige Tastaturwege und Langzeit-Leistungsmessungen nachweisen.

**Weiterführende Empfehlung:** Die Speicher-Gates erst freigeben, wenn nicht nur Wiederholbarkeit, sondern auch ein nachweisbarer Rückfall auf den letzten gültigen Stand bei einer tatsächlichen Unterbrechung belegt ist.

Kein Merge. Kein Release. Persönliche Sichtprüfung und Kubuntu-Endabnahme erst nach sämtlichen technischen Pflichtgates und eingefrorenem Kandidaten.

## Tatsächliche GitHub-Prüfungen der Implementierung

**Geprüfter Implementierungs-HEAD:** `72f48e077466cc2b0c7bc855558908eef7920154` (3 Commits gegenüber PR #54). Die nachfolgende Dokumentationskorrektur erfordert anschließend erneut eine Prüfung auf ihrem eigenen finalen HEAD.

- [Chromium-CI #40275057184](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40275057184): **PASS**. Der neue Test hat **12/12 gültige Wiederimporte, 3/3 abgewiesene beschädigte Importe, 2 Browser-Neustarts, genau einen Rettungskredit und einen Monatsbericht** nachgewiesen. Alle sieben vorherigen Browser-Testschritte ebenfalls **PASS**. Browser-Log bestätigt fehlende externe HTTP-Anfragen und keine JavaScript-Laufzeitfehler.
- [Quell-/Fach-CI #40275057179](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40275057179): **PASS**.
- [Integrierte Matrix-CI #40275057233](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40275057233): **FAIL/BLOCKED**. Alle acht vorgelagerten technischen Prüfungen **PASS**, ausschließlich die letzte vollständige Freigabesperre **FAIL** wegen noch offener Pflichten.

**Erledigt:** Reproduzierbarer Test und verpflichtende CI-Abdeckung für wiederholte Imports und drei beschädigte Dateivarianten. **Offen:** Vollständige Unterbrechungs-/Rückfallsicherheit, Versionsmigration, Gesamtspiel, Zoom, Tastatur, Performance, Freigabeunterlagen. Matrix weiterhin **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. **Kein Release-Kandidat.**
