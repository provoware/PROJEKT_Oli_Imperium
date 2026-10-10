# 25 · Getrennte A–D-Prüfung und Übergabe zur gebündelten Vorabnahme

**Prüfstand:** 10.10.2026 · **Paketversion:** `0.1.0-alpha.9` · **PR:** #7, Entwurf · **C0-Funktionsumfang:** seit alpha.8 unverändert eingefroren.

**Wichtige Unterscheidung:** Diese Akte dokumentiert einen **zusätzlich durchgeführten technischen Prüfdurchgang**. Es handelt sich weder um eine unabhängige menschliche Freigabe noch um eine rechtliche oder wissenschaftliche Abnahme. **Alle vier Felder in `release/approvals.json` bleiben `false`.** Die Einträge hier sind technische Befunde, keine Unterschriften.

## 1. Prüfgegenstand und unabhängige Wiederholung

Geprüft wurde der technische Forschungsprototyp auf dem PR-7-Entwicklungszweig, ausgehend von dem bereits grünen C0-Commit `b9dc6d1ead88794dd6052e27a929cbfad7123357` (`0.1.0-alpha.8`). Für diesen zusätzlichen Prüfdurchgang wurde das **tatsächliche GitHub-Prüfarchiv** heruntergeladen, `c0-review.zip` separat entpackt und die nachfolgend angegebenen Prüfprogramme **lokal erneut ausgeführt**.

| Konkreter Prüfpunkt | Tatsächlicher Befund zur Basis alpha.8 | Grenzen |
|---|---|---|
| `python3 tools/validate_project.py` | beendet ohne Fehler | Prüft Vertragsstruktur, keinen Emulator |
| `python3 tools/validate_c64_capture.py` | `structure_valid=true`, `complete_for_independent_review=false` | Leere Vorlage ist kein Originalnachweis |
| `python3 tools/check_review_segments.py` | `valid=true`, **49/49** Paketdateien genau einer Gruppe zugeordnet | Dateiabdeckung ist keine menschliche Abnahme |
| `python3 -m unittest discover -s tests -v` | **41/41** erfolgreich | Keine Historienprüfung |
| `node --test prototype/tests/*.test.mjs` | **52/52** erfolgreich | Nur technische Modell-/DOM-Prüfung |
| `python3 tools/check_c0_release.py --verify ../c0-review.zip` | ZIP und Datei-SHA-256 erfolgreich geprüft | Hash ist keine unabhängige Herkunftsbestätigung |
| GitHub HTML-/Browser-Prüflauf | [38083782198](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/38083782198): grün, **21** echte Chrome-Tastatur-/Fokus-/Mobilprüfungen | Kein lokaler C64-Emulatorlauf, keine manuelle Gesamtbedienung |
| GitHub Projektkonsistenz | [38083782201](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/38083782201): grün | Kein Freigabebeschluss |

Die Ergebnisse beruhen auf dem **vorigen, konkret nachgewiesenen technischen Stand**. Für die hier zusammen mit dieser Prüfakte versionierte **alpha.9** sind die GitHub-Läufe des neuen Commits wiederum gesondert zu kontrollieren. Keine Übertragung eines grünen Häkchens von einem alten auf einen ungeprüften Commit.

## 2. A – Wissenschaftliche Quellen und Originalaufnahme

**Technisch überprüft:** Datenvertrag ist strukturell gültig. Die öffentlich mitgelieferte Aufnahmeakte `data/original-session.template.json` ist ausdrücklich leer, VICE/C64/PAL ist nur die geplante Testumgebung.

**Konkret fehlende Angaben (10):** Ausgabenbeschreibung, Nutzungsgrundlage, SHA-256 und Dateigröße von **s0** und **s1**, konkrete VICE-Version, sowie Aufnahmen zu **TEST-001, TEST-002 und TEST-003**.

**Ergebnis A:** **Technische Vorbereitung bestanden; wissenschaftliche Originalabnahme gesperrt.**

Zur Originalprüfung sind ausschließlich eine rechtmäßig bereitgestellte konkrete C64-PAL-Fassung, echte Datenträgerprüfsummen, ein unabhängig reproduzierbarer VICE-Lauf mit Originaleingaben und unveränderten Bildbelegen zulässig. Screenshots oder Code des HTML-Entwurfs sind kein Ersatz. Es wurden **keine** urheberrechtlich ungeprüften Originalabbilder oder vermeintlichen Hashes ins Repository eingebracht.

**Zusätzlicher externer Archivabgleich (nur Kataloginformation):** Die öffentlich zugängliche [Preservation64-Seite zu *Oil Imperium*](https://preservation64.de/index.php?title=Oil_Imperium&oldid=66363) benennt unter **Source 3** ausdrücklich `OilImperiumDE parser s0.g64` und `OilImperiumDE parser s1.g64`, die Plattform C64, Deutschland, Deutsch, PAL, Jahr 1989 und den Archivvermerk `Working? Yes`. Es werden außerdem separate `fromNib`-Varianten angeboten, deren Byteinhalt nicht ohne Vergleich als identisch behandelt werden darf. **Dieses Ergebnis verifiziert nur die Existenz der Archiveinträge;** der dort genannte Funktionsstatus ist eine Aussage des Archivs und ersetzt **keinen** eigenen VICE-Lauf. Es wurden keine Diskettenabbilder oder Originalgrafiken abgerufen, gespeichert oder in das Repository übernommen.

**Vor Freigabe offen:** tatsächliche Provenienz, Nutzungsrechte, Emulatorbeobachtungen, Fachprüfung; **0/3** Originaltests und **0/4** Originalregeln bestätigt.

## 3. B – HTML-Architektur und wartbare Trennung

**Technisch überprüft:** `navigation.mjs` (reines Modell), `contract-guard.mjs` (Datenwächter), `pilot-trace.mjs` (vollständige Integritätsprüfung), `reference-comparison.mjs` (hypothetische Originaltestzuordnung), `app.mjs` (Datenladung/JSON-Download), `ui/render.mjs` (sichere Anzeige), `ui/texts.de.mjs` (deutsche Texte), HTML/CSS (Darstellung). Zusammen **neun** verbindlich aufgeführte Implementierungsdateien.

**Nachgewiesene Reparaturen:** gemeinsame Protokollprüfung statt zwei ungleich starker Teilprüfungen; gemeinsamer Downloadpfad statt dupliziertem Code; alter Forschungszustand wird beim erneuten Laden entfernt. Negativtests weisen manipulierte Schritte ab.

**Ergebnis B:** **Technische Modell-/Integritätsprüfung bestanden; menschliche fachliche und Gebrauchstauglichkeitsabnahme offen.** Keine Wirtschaftssimulation oder Originalspielregeln eingeführt.

## 4. C – Bedienbarkeit, Regression und Sicherheitsprüfungen

**Technisch überprüft:** 41 Python- und 52 Node-Tests bei der zusätzlichen lokalen Archivwiederholung bestanden. Der grüne GitHub-Prüflauf für alpha.8 enthält **21 echte Chrome-Tasten-/Fokus-/Mobilprüfungen**, Browser-Navigation und JSON-Exporte, Größen-/Reflow-Tests und weitere Negativprüfungen.

**Wesentliche Grenze:** Der vergrößerte Reflow wurde zum Teil durch Verringerung der nutzbaren Layoutbreite simuliert. Dies ist nicht gleichbedeutend mit einem **unabhängigen manuellen echten Browser-Zoom** bei 150 % und 200 % an einem realen Arbeitsplatz. Ein vollständiger menschlicher Tastatur-/Sicht-/Barrierefreiheitsreview ist ebenfalls **nicht protokolliert**.

**Ergebnis C:** **Automatisierte Tests bestanden; praktische Gesamtbedienungsabnahme offen.**

## 5. D – Version, Paket, Freigaben und Änderungsgrenze

**Technisch überprüft:** `release/c0-version.json`, `release/c0-scope.json` und `release/review-segments.json` definieren denselben Stand. Das alpha.8-Archiv enthielt **49 eindeutig zugeordnete Projektdateien**, 50 manifestierte Dateien einschließlich `REVIEW_STATUS.json` und eine zusätzliche Manifestdatei; sämtliche SHA-256-Prüfungen waren erfolgreich.

**Umfang fixiert:** Acht technische Fähigkeiten, neun Implementierungsdateien; neue Spielmechanik und vorgezogene Original-/Release-Freigaben ausdrücklich ausgeschlossen. Dokumentation und Prüfnachweise dürfen fortgeschrieben werden, ohne den technischen Funktionsumfang zu erweitern.

**Release-Sperren:** `technical_review=false`, `scientific_scope_review=false`, `rights_review=false`, `maintainer_approval=false`; `public_release_allowed=false`. Der GitHub-PR ist **noch Entwurf und nicht gemergt**. Die Größe des bisherigen PR (bei alpha.8 **175 Commits und 38 geänderte Dateien gegenüber main**) erfordert später einen gezielten, nachvollziehbaren menschlichen Änderungsreview – Gruppenzuordnung allein ersetzt das nicht.

**Ergebnis D:** **Technische Paket- und Änderungsgrenzen geprüft; organisatorische Gesamtfreigabe offen.**

## 6. Entscheidung: gebündelte Vorabnahme **noch NICHT eröffnet**

| Freigabetyp | Darf allein diese Akte freigeben? | Stand |
|---|---|---|
| Technische automatische Konsistenz | Ja, sofern CI des exakten Commits erfolgreich ist | alpha.8 geprüft; alpha.9 danach neu prüfen |
| Wissenschaftliche C64-Originaltreue | **Nein** | Originalversion/VICE/TEST-IDs fehlen |
| Rechtmäßige Originalmaterialnutzung | **Nein** | Nutzungsgrundlage nicht belegt |
| Menschliche Gesamtbedienung / Sicht | **Nein** | Unabhängiger Praxistest fehlt |
| Verantwortlicher GitHub-Merge | **Nein** | Entwurfs-PR #7 bleibt offen |
| Beta-, RC- oder öffentlicher Release | **Nein** | Nicht freigegeben |

Der Code der neun eingefrorenen C0-Implementierungsdateien wird mit dieser Dokumentationsrunde **nicht** verändert. Es wird **kein** neuer Spielmechanismus entwickelt, **kein** C64-Originaltest als bestanden ausgegeben und **kein** formeller Freigabestatus gesetzt. Ein **neuer, nur dokumentarischer Prüfpaket-Schnappschuss** erhält die Vorabversionskennung `0.1.0-alpha.9`. Die ursprünglich untersuchte alpha.8-Datei bleibt als separate Vergleichsbasis erhalten.

## 7. Die nächsten drei sinnvollen Schritte

1. **Verantwortliche Fachprüfung A:** Rechtmäßiges C64-Exemplar mit beiden Prüfsummen identifizieren und den vollständigen Ablauf in VICE samt Rohbildnachweisen in einer privaten Forschungsakte aufnehmen; TEST-001/002/003 einzeln bewerten.
2. **Unabhängige Bedienungs- und Codeprüfung B/C:** Review der vier PR-Gruppen, echter Browser-Zoom 100/150/200 %, Tastatur ohne Maus, Fehlerdialoge, Desktop/Mobil und Änderungsdiff mit konkreten Beobachtungen dokumentieren; nur nachgewiesene Defekte korrigieren.
3. **Verbindliche Entscheidungsakte D:** Erst nach vollständig belegten technischen und vorgeschriebenen menschlichen Freigaben einen eigenen Beta-/RC-Kandidaten und anschließend gegebenenfalls einen separaten Merge-/Release-Beschluss vorbereiten.

**Weiterführende Empfehlung:** Das C0-System bleibt funktionsseitig eingefroren. Wissenschaftliche Originalaufnahmen und menschliche Prüfergebnisse getrennt ergänzen; keinen grünen Techniklauf zur pauschalen Abnahme hochstufen.
