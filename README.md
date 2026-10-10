# PROJEKT_Oli_Imperium | Wissenschaftliches Gemeinschaftsprojekt

**Repository:** https://github.com/provoware/PROJEKT_Oli_Imperium  
**Stand:** 10.10.2026 · **Dokumentationsversion:** 3.0 · **Status:** Planung / noch keine verifizierte Originalreferenz

## Zweck
Zwei eigenständige, wissenschaftliche Abschlussarbeiten mit gemeinsamer, versionierter Materialbasis:
- **Arbeit A – Spielkonzeption und C64-Forschung:** Was ist im Original *Oil Imperium* (1989) tatsächlich nachweisbar? Quellen, Bildschirmatlas, Menüwege, Wirtschaft, Minispiele, zeitliche Abläufe und Grenzfälle.
- **Arbeit B – Softwarekonzeption und Entwicklungsplanung:** Wie werden die von A freigegebenen Funktionen in eine reproduzierbare, wartbare und prüfbare Architektur übersetzt? Arbeit B enthält eigenständige technische Begründungen.
- **Nachgelagertes Projekt C – Umsetzung:** Offline-HTML-Rekonstruktion; eine Deutschland-/PPPOPPI-Adaption nur als klar getrennter Ableger.

**Verbindlicher Grundsatz:** Das Original bestimmt die Fachregeln. Eine plausible Modellierung ist keine belegte historische Implementierung. Kein behaupteter 1:1-Nachbau ohne Originalvergleich.

## Parallele HTML-Testbasis (Forschungsprototyp C0)

Ein kleiner **interaktiver Navigationsentwurf** liegt unter [`prototype/`](prototype/). Er zeigt die Forschungsstände Büro → Weltkarte → Claim-Information, ohne ungeprüfte C64-Regeln als bestätigt auszugeben. Die einzige Datenquelle ist [`data/contract.json`](data/contract.json). Das ist **keine Freigabe des späteren vollständigen Nachbaus C**.

Start im Repository-Hauptordner: `python3 -m http.server 8000 --bind 127.0.0.1`, dann [http://127.0.0.1:8000/prototype/](http://127.0.0.1:8000/prototype/) öffnen. Forschungsstatus, Quellen und offene Fragen bleiben sichtbar; die Schaltflächen sind **nur Entwurfsnavigation**.

**Neu in C0 `0.1.0-alpha.4`:** Die Schaltflächen erzeugen ein nummeriertes **technisches Navigationsprotokoll**, das sich über „Testprotokoll als JSON speichern“ bewusst als Datei exportieren lässt. Es wird nicht automatisch im Browser oder in den Forschungsdaten gespeichert. Das Protokoll ist ausdrücklich **kein Nachweis für die Bedienung des C64-Originals**; es enthält höchstens 200 Schritte, frühere Schritte werden als ausgelassen gezählt. Bei „Forschungsdaten neu laden“ beginnt ein neues Protokoll.

**Neu in C0 `0.1.0-alpha.5`:** Der zweite Knopf „Vergleichsvorlage für C64-Prüfungen als JSON speichern“ erzeugt ein vorbereitetes Dokument für **TEST-001/002/003** mit technischen Schritten und leeren Originalbeobachtungen. Das ist **keine erfolgte Emulatorprüfung**; alle Originaltests und vier Freigaben bleiben offen. Auf Mobilgeräten erscheint jetzt der bedienbare Navigationspilot **vor** dem längeren Forschungsinfobereich. Der interne ZIP-Abnahmebericht enthält zusätzlich den maschinenlesbaren Freigabestatus `REVIEW_STATUS.json`.

**Neu in C0 `0.1.0-alpha.6`:** Für die spätere Originaluntersuchung gibt es die leere Vorlage [`data/original-session.template.json`](data/original-session.template.json) und den Prüfer `python3 tools/validate_c64_capture.py`. Beide G64-Seiten, die VICE/PAL-Version, die genauen Eingaben und Rohbild-Prüfsummen werden **erst nach einer rechtmäßig dokumentierten Originalaufnahme** lokal eingetragen. Die Vorlage selbst bleibt ohne Belege. Die Prüfung darf niemals automatisch `passed` melden. Der große PR #7 ist jetzt außerdem in vier technisch überwachte Review-Gruppen aufgeteilt: [Dokumentation](docs/23_C0_REVIEW_SEGMENTIERUNG.md), [maschinelle Zuordnung](release/review-segments.json). Der Browser prüft zusätzliche 150-%-/200-%-Darstellungen und die tatsächliche Reihenfolge der Oberfläche für Tastatur und Mobilgeräte. **Keine Beta-/RC-Freigabe.**

[Vergleichsvorlage und Originalbelege](docs/21_C0_ORIGINALVERGLEICH.md) · [Gesammelter Vorabnahmebogen](docs/22_C0_VORABNAHMEBOGEN.md).

**Verbindlich:** [Regelwerk der parallelen HTML-Entwicklung](docs/19_HTML_TESTBASIS_REGELWERK.md) und [gebündelte Vorabnahme samt Versionierung](docs/20_GEBUENDELTE_VORABNAHME.md). Die HTML-Testbasis verwendet eine eigenständige Vorabversionskennung aus [`release/c0-version.json`](release/c0-version.json), getrennt von der wissenschaftlichen Dokumentationsversion 3.0.

**Technische Schnellprüfungen:** `python3 tools/validate_project.py`, `python3 -m unittest discover -s tests -v` und `node --test prototype/tests/*.test.mjs`. **Zusätzliche Vorprüfung:** `python3 tools/validate_c64_capture.py` (leer/unbestätigt), `python3 tools/check_review_segments.py`. **Interne Vorabnahme:** `python3 tools/check_c0_release.py --package dist/c0-review.zip`; anschließend `python3 tools/check_c0_release.py --verify dist/c0-review.zip`. Ein ZIP ist ausdrücklich noch **kein** freigegebener öffentlicher Release. Die GitHub-Prüfung erzeugt ergänzend Desktop-/Mobilvorschauen in Chrome; eine eigene fachliche und visuelle Prüfung bleibt erforderlich.

**Wartbare Trennung:** `prototype/navigation.mjs` enthält das reine Entwurfsmodell; `prototype/pilot-trace.mjs` erstellt prüfbare Navigationsprotokolle ohne Browserzugriff; `prototype/reference-comparison.mjs` erzeugt ausschließlich offene TEST-ID-Vergleichsvorlagen; `prototype/app.mjs` lädt Daten und verwaltet Interaktionen; `prototype/ui/render.mjs` erzeugt die HTML-Ansicht; `prototype/ui/texts.de.mjs` hält deutsche Oberflächentexte. Der vollständige Spielnachbau benötigt weiterhin eine gesonderte fachliche Entscheidung.

## Sofortiger Einstieg
1. [Projektcharta / Forschungsfragen](docs/00_PROJEKTCHARTA.md) lesen.
2. [Roadmap und Abnahmeprüfungen](docs/08_ROADMAP_CHECKPOINTS.md) ansehen.
3. Fachfragen als [Regelkarte](vorlagen/REGELKARTE.md), technische Fragen als [Modulkarte](vorlagen/MODULKARTE.md) erfassen.
4. [Übergabevertrag A→B](docs/03_UEBERGABE_A_B.md) beachten; offene Angaben nicht erfinden.
5. [Qualitäts- und Fortschrittsprüfung](docs/05_TESTS_FORTSCHRITT.md) ausführen: `python3 tools/validate_project.py`.
6. Zum Schluss [Handzettel](docs/09_HANDZETTEL.md) als Kurzüberblick verwenden.

## Projektweg
`Quelle → Beobachtung → Regel-ID → Freigabe → Modul-ID → Prüf-ID → Architekturentscheidung → Entwicklungsfreigabe`

**Parallelität:** B kann unabhängige Strukturen entwickeln, sobald A einzelne vollständige Fachpakete freigibt. Offene Punkte sperren nur betroffene Funktionen.

## Inhaltsverzeichnis
- [A: Historische Erforschung](docs/01_FORSCHUNG_A.md)
- [B: Architektur und technische Planung](docs/02_ARCHITEKTUR_B.md)
- [Gegenseitige Übergaben und Fragen](docs/03_UEBERGABE_A_B.md)
- [Quellen, Originalversion und Evidenz](docs/04_ORIGINAL_QUELLEN.md)
- [Tests, Kennzahlen und Fortschritt](docs/05_TESTS_FORTSCHRITT.md)
- [Screenshot-Verfahren und Bildrechte](docs/06_BILDER_PIPELINE.md)
- [Risiken, Recht und Datenhygiene](docs/07_RISIKEN_RECHTE.md)
- [Roadmap, Meilensteine und Definitionen von fertig](docs/08_ROADMAP_CHECKPOINTS.md)
- [Handzettel / Spickzettel](docs/09_HANDZETTEL.md)
- [Glossar und Sachindex](docs/10_GLOSSAR_INDEX.md)
- [Vortrag und Heimstudie](docs/11_VORTRAG_STUDIE.md)
- [Spätere Deutschland-/PPPOPPI-Adaption](docs/12_ADAPTION.md)
- [Maschinenlesbarer Datenbestand](data/README.md)
- [Änderungsprozess](CONTRIBUTING.md) und [Codex-Regeln](AGENTS.md)

## Aktuell verifizierbarer Stand
| Nachweis | Stand |
|---|---|
| Repository und Grundstruktur | mit dieser Änderung angelegt |
| C64-PAL-Referenz mit SHA-256 und nachgewiesenem Emulatorlauf | offen |
| Vollständiges Regelinventar | offen |
| Historische Screenshotserie aus eigener Originalausführung | offen |
| Formelle A→B-Übergabe | offen |
| HTML-Forschungsprototyp C0 | in PR #7 technisch in Entwicklung, separat zu prüfen |
| Originalgetreuer Spielnachbau C | nicht freigegeben, nicht Teil dieser Etappe |
| Originaltreue-Prozentwert | nicht messbar ohne verifizierte Testbasis |

**Wichtig:** Das Repository ist öffentlich. Urheberrechtlich geschützte Original-Diskettenabbilder, Codesheets, Scans, Musik und unfreigegebene Hochschulunterlagen nicht einchecken.

## Erste drei Schritte
1. Hochschulvorgaben und getrennte wissenschaftliche Eigenleistungen abstimmen.
2. Konkrete deutsche C64-PAL-Referenz bestimmen, Provenienz, Hash und Emulatorprotokoll dokumentieren.
3. Einen vollständigen Ablauf `Büro → Weltkarte → Feldinformation → Rückweg` als Pilot erforschen und A→B übergeben.
