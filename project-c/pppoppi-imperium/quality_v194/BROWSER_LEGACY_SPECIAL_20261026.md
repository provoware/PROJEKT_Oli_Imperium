# Vorrelease-Pflichtpaket: V0.8-Sonderzustände (26.10.2026)

## Geltung, Ausgangslage und Risiken

- Ausgangs-HEAD: `2330ad5a7f2e4fc2b73db3217ad492742ae62b4c` (Entwurfs-PR #57).
- Entwicklungszweig: `agent/prerelease-c-legacy-special-20261026-0943`, Basis: PR-57-Zweig; `main` bleibt unberührt.
- Pflichtmatrix: SPE-02 (Versionsmigration), FEH-03 (ungültige Importe), LOG-04 (Minispiele), LOG-05 (Buchungsintegrität), TES-04 (Regression). **Teilnachweis, keine Pflichtfreigabe.**
- Beobachtete bestehende Migrationsregel: `migrateV08` lehnt laufende V0.8-Minispiele und offene V0.8-Verträge ausdrücklich ab. Ein stilles Umdeuten dieser Zustände wäre ein Datenrisiko. Es wird **keine** ungesicherte Konvertierung eingeführt.

## Konkret implementiert

1. Neuer isolierter Chromium-Test `quality_v194/test_browser_legacy_special_v194.py`: V0.8-Szenarien durch den **historischen, unveränderten V0.8-Spielmotor** erzeugen; kein manuelles Erfinden von Vertrags-/Minispielzuständen.
2. Ein regulär unterzeichneter, noch offener Vertrag wird über die echte Dateiauswahl importiert und muss abgelehnt werden. Der zuvor gültige aktuelle Spielstand einschließlich Export bleibt byteinhaltlich gleich.
3. Eine regulär begonnene Eigenbohrung mit aktivem Minispiel muss ebenfalls abgelehnt werden. Ein absichtlich beschädigter Minispielzustand wird getrennt geprüft.
4. Nach regulärem Abschluss der drei Minispielschritte muss derselbe Altspielstand migrierbar sein. Bohrstatus, Journal, Vorgangskennungen, Sequenz, Export und Wiederimport werden verglichen.
5. Der Browser prüft 800×600 ohne horizontalen Überlauf, keine externen Anfragen und keine JavaScript-Laufzeitfehler. Der bestehende GitHub-Chromium-Workflow führt die neue Regression automatisch aus.
6. Geschützte 110 Originaldateien, Spielregeln, Migrationslogik und Originalbeispiele bleiben unverändert. Kein Merge, kein Release.

## Reproduzierbare Prüfungen

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_legacy_special_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_legacy_special_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Der Browserlauf benötigt Python, Playwright 1.56.0, Chromium und Node 22; GitHub Actions installiert die Browserumgebung. **Bei Dokumentationserstellung: neuer Test und CI-Schritt eingecheckt, tatsächlicher Browserlauf PENDING.** Ergebnisse erst nach Auswertung des endgültigen GitHub-HEAD als PASS/FAIL berichten. Das technische Gesamt-Gate bleibt wegen weiterer Pflichtarbeiten BLOCKED. Matrixstand bis zur gesonderten Gesamtfreigabe: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.

## Nächste drei technische Schritte

1. GitHub-Chromium-CI auf dem finalen HEAD auswerten, Testfehler korrigieren und den konkreten Nachweis mit Link dokumentieren.
2. V0.8-Verträge **nach** regulärer Erfüllung/Vertragsbruch einschließlich Journal und Forderungen testen; für weiterhin offene Verträge eine ausdrückliche, nutzerfreundliche Ablehnungsinformation prüfen.
3. Anschließend Speicherausfälle und sichere Wiederherstellung, vollständige Spielpartien, echten Browserzoom, Tastaturpfade und Leistungsmessungen unabhängig abarbeiten.

Persönliche Sichtprüfung und Kubuntu-Endabnahme ausschließlich gesammelt nach grünem technischem Gate und eingefrorenem Kandidaten. Veröffentlichung nur nach ausdrücklicher Freigabe.
