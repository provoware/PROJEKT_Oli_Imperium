# PPPOPPI IMPERIUM V1.9.4 – Wiederherstellungsnachweis (23.10.2026)

## Gegenstand und strikte Grenzen

Dieses Paket betrifft ausschließlich Projekt C und den separaten Wiederherstellungszweig.
Forschungsarbeiten A/B, Hauptzweig, bestehender Entwurfs-PR #16 und persönliche Endabnahmen bleiben unangetastet.
Die eigentlichen 110 Quelldateien werden durch diesen PR **nicht** hochgeladen. Ein erfolgreiches Struktur- oder Sicherheitstestprotokoll bedeutet **keine** Spielfreigabe.

## Originalpaket erneut lokal geprüft

- Archiv `PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel.zip`: **SHA-256 PASS** `94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca`; 187 Einträge, davon 185 unter `SPIEL/`.
- Daraus zuvor erzeugtes Quellpaket `PPPOPPI_IMPERIUM_V194_GITHUB_QUELLCODE_SICHER.zip`: **SHA-256 PASS** `54ab598afc58fdf06cb250c33dda08bb0dc4077b8e8b31c328df868a94e809f4`.
- Manifest: 110 freigegebene Text-/Code-/Testdateien; sämtliche 110 Dateigrößen und SHA-256 lokal gegen die extrahierten Dateien geprüft (**110/110 PASS**).
- Fester SHA-256-Fingerabdruck der nach Pfad sortierten `[path, sha256]`-Paare (UTF-8, JSON ohne Zwischenräume): `2514ffd8b641d8ed230ff6c9a461f309d0874c3820ad872ffcc1e5b814e39913`.
- Die 77 nicht freigegebenen Medien-/Berichtseinträge einschließlich gesonderter Vergleichsarchive bleiben außerhalb des öffentlichen Quellimports. Die Quellprüfung ersetzt keine rechtliche Prüfung.

## Umsetzung dieses Arbeitspakets

1. `recovery/verify_sources.py` verlangt **genau das zuvor geprüfte Inventar** statt nur 110 beliebiger selbst deklarierter Dateien; es vergleicht Herkunft, Pfade, Hashwerte, Dateigrößen und tatsächlichen Verzeichnisbestand.
2. Pfadmanipulation, doppelte Einträge, fremde Erweiterungen, symbolische Links, fehlende Dateien und zusätzliche Dateien werden zurückgewiesen. Fehler sind getrennt als `BLOCKED` (Quelle fehlt) oder `FAIL` (Import ungültig) sichtbar.
3. `recovery/test_verify_sources.py` enthält zwölf Negativ- und Positivprüfungen. Die GitHub-Prüfkette führt diese **auch ohne importierte Spielquellen** aus; erst danach verlangt sie die 110 Originaldateien und startet die acht Fachprogramme.

## Tatsächlich lokal ausgeführte Prüfungen

- **PASS 12/12**: `python3 -m unittest discover -s project-c/pppoppi-imperium/recovery -p 'test_verify_sources.py' -v` (isolierte Testdaten).
- **PASS 110/110**: `python3 project-c/pppoppi-imperium/recovery/verify_sources.py` auf dem unveränderten, sicher extrahierten Original-Quellpaket.
- **PASS 8/8**: `node test_fair_market_v161.cjs`, `test_human_parity_v192.cjs`, `test_logistics_ai_v193.cjs`, `test_public_network_v171.cjs`, `test_strategy_v192.cjs`, `test_transport_v17.cjs`, `evaluate_balance_v194.cjs` und `analyze_stress_v194.cjs`. Die langen Programme wurden getrennt mit ausreichendem Laufzeitlimit wiederholt; die Prüfungen betreffen technische Invarianten, keine menschliche Spielbalance.
- **PASS**: `python3 -m py_compile` für Prüfer und Regressionstests.
- **BLOCKED auf GitHub**: Quell- und Fachprüfungen bis zum Import aller 110 Dateien; die 12 Negativtests können unabhängig grün sein.
- **NICHT NACHGEWIESEN**: vollständige Browserpartien, reale 800×600-/200%-Prüfung, Datenverlust-/Speichermigration, Original-C64-Abgleich und technische Gesamtfreigabe.

## Verbleibende Release-Pflichten

**P0:** 110 freigegebene Quellen samt Originalmanifest auf einem eigenen Importzweig ohne Überschreiben veröffentlichen; Rechte und Paketidentität erneut prüfen.
**P0:** Nach Import den neuen Quell-Workflow einschließlich acht Fachprogrammen am selben GitHub-HEAD grün ausführen und vollständige Spielstände/Partien absichern.
**P1:** Browser, 800×600, Vergrößerung, Tastatur, Performance, Offline-Start und Release-Dokumentation ergänzen.

Die Vorrelease-Matrix aus PR #16 bleibt **0/52 vollständig nachgewiesen**. PR #16 ist derzeit gegenüber dem aktualisierten Recovery-Basiszweig zurückgefallen; vor einer späteren Integration müssen die Zweige regulär synchronisiert und alle Prüfungen wiederholt werden.

**Keine Zusammenführung, kein Release.** Persönliche Sichtprüfung und Kubuntu-Praxistest ausschließlich nach vollständiger technischer Vorabprüfung und eingefrorenem Kandidaten.

## Folgelauf 23.10.2026 – Importgrenzen weiter absichern

**Änderungsumfang:** Nur der technische Prüfer, seine isolierten Tests, der Name des CI-Prüfschritts und dieser Nachweis. Keine Spielquellen, keine fremden Medien und keine persönlichen Testdaten wurden importiert.

- JSON mit doppelten Schlüsseln (auch in verschachtelten Manifestobjekten) wird jetzt ausdrücklich abgelehnt; vorher hätte die JSON-Bibliothek den letzten Wert stillschweigend verwendet.
- Vorhandene symbolische Links an Manifest oder Importwurzel werden als **FAIL** statt als fehlende Quelle bewertet.
- Nicht im festen Inventar vorgesehene leere Unterverzeichnisse und Sonderdateien (z. B. FIFO) werden als **FAIL** erkannt; vorher konnte der abschließende Dateivergleich solche Einträge übersehen.
- Sechs neue isolierte Regressionen prüfen diese Fehlerfälle. Erwarteter Testumfang: **18 Tests**; eine PASS-Aussage darf erst nach tatsächlichem CI-Lauf erfolgen.

### Release-Pflichten und Sperren (keine Ersatzmatrix)

Die 52 fachlichen und technischen Einzelpflichten liegen in [PR #16](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/16) unter `project-c/pppoppi-imperium/prerelease/matrix.json`. Dieser Wiederherstellungszweig enthält die Matrix **noch nicht**; die Zweige müssen vor einer technischen Gesamtabnahme ohne Verlust der 52 Pflichten zusammengeführt und gemeinsam geprüft werden.

| Bereich | Nachweis dieses Arbeitspakets | Vorrelease-Status |
| --- | --- | --- |
| Quellherkunft, Integrität und Importsicherheit | Fester 110-Dateien-Fingerabdruck; zusätzliche Negativprüfungen | Teilprüfung; vollständiger GitHub-Import **BLOCKED** |
| Wirtschaft, Verträge, Transport, KI und Balance | Acht Fachprogramme erst nach Quellimport in GitHub ausführbar | **BLOCKED** |
| Vollständige Partien, Ereignisse, Minispiele, Grenzfälle | Keine durchgehende Spielausführung auf diesem GitHub-Stand | **OPEN** |
| Spielstände, Unterbrechung, Wiederherstellung, Migration | Kein vollständiger Datenverlust-/Migrationstest | **OPEN** |
| 800×600, Vergrößerung, Grafik, Tastatur, Bedienbarkeit | Keine echte Browser-/Oberflächenprüfung | **OPEN** |
| Offline-Start, Laufzeit, Performance, Langzeitstabilität | Kein vollständiger reproduzierbarer Lauf | **OPEN** |
| Automatische Regression, CI und Dokumentation | Isolierte Prüfungen vorhanden, Quellenprüfung absichtlich rot | **PARTIAL/BLOCKED** |
| Persönliche Sicht- und Kubuntu-Abnahme | Ausschließlich nach allen technischen Pflichtprüfungen | **DEFERRED** |

**Nächste sichere Implementierung:** (1) rechtlich freigegebene 110 Quelldateien mit geprüftem Manifest auf separatem Importzweig einbringen; (2) Quell- und acht Fachprüfungen auf demselben GitHub-HEAD ausführen; (3) PR-#16-Matrix mit den Wiederherstellungsprüfungen synchronisieren und erst danach Spiel-, Speicher- und Browserfälle abarbeiten. Keine Freigabe durch isolierte PASS-Tests.

### Tatsächliche GitHub-Prüfung des Folgepakets

- Geprüfter Code-HEAD: `7e16db725500fb8f108387bfc6666a8ef4e15f19`.
- [PR-CI #39988525433](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/39988525433): Forschungs-/Datenvertrag **PASS**, **8/8** Python-Grundtests **PASS**, **18/18** isolierte Importregressionen **PASS**.
- Vollständiger Quellencheck: **BLOCKED** (`WIEDERHERSTELLUNG_MANIFEST.json` fehlt). Acht wirtschaftliche Fachprogramme: **SKIPPED**. **Gesamt-CI FAIL**, keine technische Freigabe.
- Diese Dokumentation ist ein nachgelagerter Commit; für die Freigabe zählt ausschließlich der nach dem letzten Commit erneut ausgeführte GitHub-Workflow am endgültigen HEAD. Die Belege dazu stehen im zugehörigen Entwurfs-PR.


## Folgepaket 24.10.2026 – Offline-Nachimport ohne bestehende Daten zu ersetzen

Der neue Helfer 'recovery/import_archive.py' kann **wahlweise** das originale Paket
'PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel.zip' oder das bereits kuratierte
'PPPOPPI_IMPERIUM_V194_GITHUB_QUELLCODE_SICHER.zip' lokal in einen neuen Ordner
vorbereiten. Die ZIP-Datei muss exakt einem der zwei fest hinterlegten SHA-256-Werte
entsprechen (Original: '94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca',
kuratiert: '54ab598afc58fdf06cb250c33dda08bb0dc4077b8e8b31c328df868a94e809f4').
Beim Original werden nur die 110 freigegebenen Text-/Quell-/Testdateien uebernommen;
Medien, Archive und aeussere Berichte bleiben ausgeschlossen. Ein beliebiges ZIP
mit nur passend selbst deklarierten Manifestdaten wird abgelehnt.

Beispiel unter Linux (Zielordner darf noch nicht existieren):

    python3 project-c/pppoppi-imperium/recovery/import_archive.py \
      --archive "/pfad/PPPOPPI_IMPERIUM_V194_Pruefstand_und_Spiel.zip" \
      --destination "/pfad/PPPOPPI_V194_VERIFIZIERT"

Der Helfer prueft ZIP-Integritaet, sichere relative Pfade, Dateitypen, Duplikate,
Entpackgrenzen sowie **alle 110** Dateien gegen den festen Inventarfingerabdruck.
Er legt den Zielordner erst nach erfolgreicher Pruefung an; bestehende Ordner
werden nicht ueberschrieben. Bei einem Installationsfehler wird der neue Zielordner NICHT automatisch
geloescht: Er koennte inzwischen fremde Daten enthalten. Ein unvollstaendiger
Import ist kein Erfolg und muss separat untersucht werden. Nur ein erfolgreich
gepruefter Import enthaelt ausschliesslich 'SPIEL/' und
'WIEDERHERSTELLUNG_MANIFEST.json'.

**Wichtige Grenze:** Es erfolgt weder ein automatischer GitHub-Upload noch
eine rechtliche Freigabe. Der so vorbereitete Ordner ist erst nach gesonderter
Rechtepruefung und bewusster Uebernahme in einen getrennten Entwicklungszweig
als GitHub-Quelle nutzbar. Die echten ZIP-Bytes stehen in diesem Repository
weiterhin nicht zur Verfuegung; deshalb bleiben Quell-Gate, acht Fachprogramme
und die technische Vorrelease-Freigabe **BLOCKED**.

Reproduzierbare synthetische Tests (ohne Originalspiel):

    python3 -m unittest discover -s project-c/pppoppi-imperium/recovery -p 'test_*.py' -v

Die zwei GitHub-Workflows fuehren die Importtests mit aus. Ihr roter Gesamtstatus
bleibt bis zum echten Quellimport und den weiteren 49 technischen Freigaben
verbindlich. Kein Merge, kein Release und keine vorgezogene persoenliche Abnahme.

## Folgepaket 25.10.2026 – Zielordner-Tausch und Datenverlustschutz

Bei gleichzeitigem Umbenennen des Zielordners konnte die bisherige
Fehlerbehandlung ueber `shutil.rmtree(destination)` einen inzwischen
fremden Ordner loeschen. Zudem waren beide Installations-`rename`-Aufrufe
vom veraenderbaren Zielpfad abhaengig.

Der Installer bindet beide Umbenennungen jetzt an ein geoeffnetes,
nicht-symbolisches Zielverzeichnis (Verzeichnis-Handle) und prueft dessen
Dateiidentitaet vor und nach der Abschlusspruefung. Bei fehlender sicherer
POSIX-Unterstuetzung bricht er kontrolliert ab, statt ungeschuetzt zu
installieren. Ein Schreibfehler laesst den neu reservierten, moeglicherweise
unvollstaendigen Ordner stehen; es erfolgt **keine automatische Loeschung**
ueber den sichtbaren Zielpfad. Eine fehlende Manifestdatei bedeutet:
Import nicht abgeschlossen. Der Benutzer darf solche Teilordner nicht als
geprueften Spielstand verwenden oder unbesehen loeschen.

Drei gezielte Testfaelle decken den Schreibfehler, Zielpfadtausch nach
dem ersten Kopierschritt und den Zielpfadtausch mit nachfolgendem
Schreibfehler ab. Die Belege und CI-Grenzen stehen unter
`prerelease/RUN_20261025_0037.md`. Dies ist **kein** Nachweis gegen
alle denkbaren konkurrierenden Angreifer oder einen echten Stromausfall;
insbesondere Dateisystemdauerhaftigkeit und Windows bleiben offen.

Die Quellen fehlen weiterhin auf GitHub. Die 52 Pflichtpunkte bleiben
ohne Spiel- und Releasefreigabe; weder Merge noch persoenliche Abnahme.
