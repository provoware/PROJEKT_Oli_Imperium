# PROJEKT_Oli_Imperium | Wissenschaftliches Gemeinschaftsprojekt

**Repository:** https://github.com/provoware/PROJEKT_Oli_Imperium  
**Stand:** 10.10.2026 · **Dokumentationsversion:** 3.0 · **Status:** Planung / noch keine verifizierte Originalreferenz

## Zweck
Zwei eigenständige, wissenschaftliche Abschlussarbeiten mit gemeinsamer, versionierter Materialbasis:
- **Arbeit A – Spielkonzeption und C64-Forschung:** Was ist im Original *Oil Imperium* (1989) tatsächlich nachweisbar? Quellen, Bildschirmatlas, Menüwege, Wirtschaft, Minispiele, zeitliche Abläufe und Grenzfälle.
- **Arbeit B – Softwarekonzeption und Entwicklungsplanung:** Wie werden die von A freigegebenen Funktionen in eine reproduzierbare, wartbare und prüfbare Architektur übersetzt? Arbeit B enthält eigenständige technische Begründungen.
- **Nachgelagertes Projekt C – Umsetzung:** Offline-HTML-Rekonstruktion; eine Deutschland-/PPPOPPI-Adaption nur als klar getrennter Ableger.

**Verbindlicher Grundsatz:** Das Original bestimmt die Fachregeln. Eine plausible Modellierung ist keine belegte historische Implementierung. Kein behaupteter 1:1-Nachbau ohne Originalvergleich.

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
| Eigentliche HTML-Implementierung | nicht Teil dieser Etappe |
| Originaltreue-Prozentwert | nicht messbar ohne verifizierte Testbasis |

**Wichtig:** Das Repository ist öffentlich. Urheberrechtlich geschützte Original-Diskettenabbilder, Codesheets, Scans, Musik und unfreigegebene Hochschulunterlagen nicht einchecken.

## Erste drei Schritte
1. Hochschulvorgaben und getrennte wissenschaftliche Eigenleistungen abstimmen.
2. Konkrete deutsche C64-PAL-Referenz bestimmen, Provenienz, Hash und Emulatorprotokoll dokumentieren.
3. Einen vollständigen Ablauf `Büro → Weltkarte → Feldinformation → Rückweg` als Pilot erforschen und A→B übergeben.
