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


## Nachweise der tatsächlichen Implementierungsprüfung

**Geprüfter Implementierungs-HEAD:** `61f2965cb2314080c5666f8946390c79e6630f8e`.

- [Chromium-CI #40294773625](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40294773625): **PASS**. Alle elf Browser-Testprogramme erfolgreich, darunter **15/15 PASS** für Sonderzustände: echter offener Altvertrag und aktives Altminispiel abgelehnt, beschädigtes Minispiel abgelehnt, abgeschlossene Eigenbohrung migriert, Buchungen/Verarbeitungskennungen erhalten, Export/Wiederimport identisch, 800×600 und offline ohne Laufzeitfehler.
- [Quell-/Fach-CI #40294773442](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40294773442): **PASS**. Originalquellen- und Fachprüfungen erfolgreich.
- [Gesamtmatrix-CI #40294773455](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40294773455): **FAIL/BLOCKED** ausschließlich am noch offenen technischen Gesamt-Gate; die vorangehenden Matrix-, Quellen- und Sicherheitsprüfschritte waren erfolgreich.
- Fehlerbehebung belegt: Der erste neue Browsertest scheiterte [in CI #40294559809](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40294559809) an einer **Test-Hilfsfunktion**, die ein bereits geschlossenes Fenster erneut schließen wollte. Die Export-Hilfe prüft seitdem den sichtbaren Fensterzustand. Kein nachgewiesener Fehler der Spielstands-Migration; der korrigierte Test ist auf dem oben genannten HEAD grün.

**Diese Dokumentationsnachtragung erzeugt einen neuen Commit.** Dessen endgültige CI ist getrennt zu prüfen; obige Prüfergebnisse beziehen sich ausschließlich auf den angegebenen Implementierungs-HEAD. **Keine Änderung der 52er-Gesamtfreigabe, kein Release.**
