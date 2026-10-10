# 20 · Autonome Entwicklung mit gebündelter Vorabnahme

**Projekt:** PROJEKT_Oli_Imperium · **Stand:** 10.10.2026 · **Regelstatus:** Vorschlag zur fachlichen Prüfung (PR #7).  
**Geltung:** ausschließlich selbstständig prüfbare technische Arbeiten A/B/C0. Keine Änderung der historischen Freigaberegeln in AGENTS.md.

## 1. Verbindliches Ziel

Technisch unabhängige Entwicklungsschritte werden **bis zu einer abnahmefähigen technischen Vorschau** bearbeitet, ohne für jeden kleinen Schritt Nutzerentscheidungen einzuholen. Die fachlich verantwortlichen Personen erhalten am Ende ein **einheitliches Prüfarchiv** mit überprüfbarer Versionskennung, Änderungsübersicht, funktionierender HTML-Testoberfläche, Testnachweisen, Prüfsummen, Restunsicherheiten und einer kurzen Liste tatsächlicher Freigabeentscheidungen.

**Wichtig:** „Ohne Nutzerabnahme vorher“ bedeutet nicht „ohne Prüfung“ oder „Sicherheitsregeln umgehen“. Technische Vorprüfungen erfolgen fortlaufend. Bestehende GitHub-Schutzregeln und AGENTS.md bleiben maßgeblich. Keine automatische Übernahme in main, keine öffentliche Veröffentlichung, keine erdachte Originaltreue.

## 2. Arbeitstrennung und Verantwortlichkeit

| Arbeitsspur | Darf autonom vorbereitet werden | Bleibt fachlich gebunden |
|---|---|---|
| **A – C64-Forschung** | Quellen erfassen, offene Fragen bündeln, Testablauf entwerfen, Quellenkritik, Referenzakte prüfen | Rechtmäßige Originalversion, Echtheit von Bildschirmfolgen, Freigabe von Originalregeln |
| **B – Softwarearchitektur** | Kleine Schnittstellen, Daten- und Fehlerverträge, Zustandsdiagramme, Tests, Vergleichsentscheidungen | Endgültige Fachwerte und wissenschaftliche Eigenleistung/Freigabe |
| **C0 – HTML-Forschungslabor** | Layout, Navigation als *Entwurf*, lesende Datenanzeige, Eingabefehler, Tastaturbedienung, automatische Tests | Nachbau originalgetreuer C64-Steuerung, Originalgrafiken, ungeprüfte Wirtschaft und spätere Spiellogik |
| **C – späterer Spielnachbau** | Noch keine automatische Freigabe. Technische Voraussetzungen dürfen als Entwurf existieren. | Separater Auftrag und geprüfte fachliche Pakete nötig |

Ein Operator darf schreiben, Forschende/Prüfer kontrollieren getrennt. Die offene Codex-Rollen-PR #3 erhält ihre eigenen Tests und Freigaben und wird nicht stillschweigend übernommen.

## 3. Versionierung: Dokumentation, Vertrag und Software getrennt

**Drei unabhängige Kennungen:**

1. **Wissenschaftliche Dokumentation**: derzeit `3.0` (kann sich ändern, ohne Softwareversion zu erhöhen).
2. **Forschungsdatenvertrag**: `data/contract.json.schema_version = 1.0` (strukturelle Inkompatibilität benötigt ausdrücklich dokumentierte Migration).
3. **HTML-Testbasis C0**: `release/c0-version.json.version = 0.1.0-alpha.10`.

C0 verwendet das Schema `HAUPT.NEBEN.KORREKTUR-STUFE.NUMMER` (SemVer für Vorabversionen).

- `0.1.0-alpha.1`: erste interne funktionsfähige Forschungsvorschau; noch keine Nutzerabnahme.
- `0.1.0-alpha.2`: stärkere Forschungsdatenprüfung, vollständiger Navigations- und Browser-Ablauftest.
- `0.1.0-alpha.3`: abgesicherte Seitenrichtlinie, barrierearmer Lade- und Fehlerzustand sowie zusätzliche 200-%-Layoutprüfung.
- `0.1.0-alpha.4`: technisch reproduzierbares Navigationsprotokoll mit bewusstem JSON-Export, begrenztem Sitzungsspeicher und eigenen Modultests; weiterhin kein historischer Beleg.
- `0.1.0-alpha.5`: TEST-ID-basierte Original-Vergleichsvorlage (ohne Originalbelege), mobiler Pilot vor Forschungsseitenleiste, erweiterte Browsernachweise und eigenständiger Prüfstatus im ZIP.
- `0.1.0-alpha.6`: geprüfte, leere C64-Aufnahmeakte und Validator, vier dateivollständige PR-Review-Gruppen, erweiterte 150–200-%-Chrome-/Fokusmatrix und vollständige Python-Prüfdateien im ZIP.
- `0.1.0-alpha.7`: Browser-Tastaturprüfung mit echten Tasten, separat erneut getestetes ZIP, vollständig mitgelieferte HTML-Verweise und verlässliche Fehlerweitergabe.
- `0.1.0-alpha.8`: technischer C0-Funktionsumfang maschinenlesbar eingefroren, vollständige Protokollintegrität für beide JSON-Ausgaben und doppelten Exportcode konsolidiert; **keine** Fachfreigabe.
- `0.1.0-alpha.9`: eigenständiger A–D-Prüfbericht anhand tatsächlich entpackter alpha.8-CI-Artefakte; alle Freigaben bleiben offen, HTML-Quellimplementierung unverändert.\n- `0.1.0-alpha.10`: ohne neue Spielfunktionen: ausfüllbare Arbeitsvorlagen für rechtmäßige Originalaufnahme, echten Browser-Zoom und getrennte A–D-Freigaben; alle Prüfungen bleiben bis zur realen Durchführung offen.
- `0.1.0-beta.1`: gewünschter Umfang ist technisch weitgehend fertig; Schwerpunkt liegt auf Fehlerbehebung und Testfällen.
- `0.1.0-rc.1`: **Kandidat zur gesammelten Abnahme**; keine ungeprüften Erweiterungen mehr, nur Fehlerbehebungen.
- `0.1.0`: nur wenn technische, rechtliche, fachliche und organisatorische Freigaben vorliegen; eine technische Forschungsvorschau ist deshalb **keine** Freigabe einer echten Spielrekonstruktion.
- `1.0.0`: **nicht** aus rein technischer Testquote ableiten; Bedarf vollständiger, gesonderter Produktdefinition für Spielnachbau C.

Nach Veröffentlichung darf derselbe Versionstag niemals auf andere Dateien umgebogen werden. Für jede Änderung neuer Commit; nach bestätigtem Fehler im Kandidaten wird `rc.2` erzeugt, nicht `rc.1` überschrieben.

## 4. Schichten: maximal wartbar, möglichst einfach

```text
data/contract.json                  ← EIN verbindlicher Forschungsstand
docs/                               ← Forschungsprotokolle, Architektur, Entscheidungen
prototype/navigation.mjs            ← reine logische Navigation
prototype/contract-guard.mjs        ← Browser-Konsistenzschutz, keine Fachfreigabe
prototype/pilot-trace.mjs            ← reines, begrenztes Testprotokoll für Entwurfsnavigation
prototype/reference-comparison.mjs  ← nur offene TEST-ID-Vergleichsvorlage, keine Originalbewertung
prototype/app.mjs                   ← Steuerung: Laden, Status und Benutzeraktionen
                                 ← beim Neuladen keine veralteten Ansichten anzeigen
prototype/ui/render.mjs             ← nur zugängliche HTML-/DOM-Darstellung
prototype/ui/texts.de.mjs           ← deutsche Oberflächentexte, keine Fachregeln
prototype/index.html                ← semantische HTML-Grundstruktur
prototype/styles.css                ← Farben, Raster, responsive Darstellung
prototype/tests/                    ← technische Tests, kein Originalbeweis
release/c0-version.json             ← eigenständige Softwareversion
release/approvals.json              ← sichtbare, zunächst NICHT erteilte Freigaben
release/c0-scope.json               ← verbindlicher technischer Funktionsumfang, keine Freigabe
tools/check_c0_release.py           ← Paket-/Version-/Integritätsprüfung
```

Ausbauregeln:
- Eine Funktion hat **eine** fachliche Verantwortung; keine zweite Geschäftslogik im HTML.
- Forschungstexte und belegte Werte bleiben im Forschungsdatenvertrag; reine Oberflächentexte dürfen künftig in ein eigenes deutsches Textmodul, nie in fachliche Daten duplizieren.
- Eingaben werden vor Zustandsänderung geprüft. Ausgabe fremder Daten grundsätzlich als Text, nicht als HTML-Code.
- Kernfunktionen haben keine Browserabhängigkeit. UI ändert keinen Forschungs- oder Wirtschaftszustand direkt.
- Dateinamen, Schnittstellen und Datenfelder sind dokumentiert und stabil; Änderungen mit Wirkung auf Verbraucher erhalten Regressionstests.
- Kein Bibliothekswechsel ohne begründete Entscheidungsvorlage. Keine zusätzlichen Pakete, wenn Standardbibliotheken ausreichen.
- Keine Attrappen-Knöpfe, leeren Menüs, erdachten Screenshots oder externen Originalbilder.
- Pro Arbeitsauftrag kleine Commits; **gebündelte Abnahme heißt nicht ein riesiger unprüfbarer Commit**.

## 5. Automatische Arbeitsschleife

**Vor jedem Paket:** bestehende Quellen und offenen PRs lesen → einzige betroffene Funktion bestimmen → Prüferwartung definieren → auf eigenem Zweig implementieren → Tests ausführen → Fehler beheben → Dokumentation aktualisieren → Nachweise am PR sammeln.

**Ohne Nutzerentscheidung fortsetzen, wenn:** nur technische Entwurfs-/Anzeigefragen betroffen sind, bestehende Verträge unverändert bleiben, keine Originalbehauptung entsteht, keine Rechte-/Datenschutzfrage offen ist und alle geforderten automatischen Prüfungen bestanden sind.

**Tatsächlich stoppen, wenn:** Originalfakten verbindlich freigegeben werden sollen, Urheberrechte ungeklärt sind, Daten zerstört/umgedeutet würden, die Prüfungsordnung Entscheidungen verlangt, Architektur- oder Produktgrenzen grundsätzlich geändert werden sollen, GitHub-Schutzregeln eine Freigabe fordern oder CI weiterhin rot bleibt.

**Fehlerblockade:** betroffenen Punkt im PR mit Ursache, Test und reproduzierbarem Fall dokumentieren; eine andere unabhängige technische Aufgabe bearbeiten. Nicht vorgreifen oder schwierige Pfade auslassen.

## 6. Automatisierte Prüfungen und Nachweiskette

Pflicht vor einer technischen C0-Vorschau:

1. Python-Vertragsvalidator `python3 tools/validate_project.py`.
2. Python-Unittests `python3 -m unittest discover -s tests -v`.
3. JavaScript-Syntax- und Navigations-/Negativtests mit Node.js; Datenwächter für Referenzen/Prüfstatus, reproduzierbare und auf 200 Schritte begrenzte Protokolle sowie automatisierte WCAG-AA-Kontraste, Fokusmarkierung und Schaltflächengrößen.
4. Lokale HTTP-Auslieferung aller HTML-, CSS-, JS- und Vertragsdateien.
   Zusätzlich einen echten Headless-Chrome-Start prüfen: Versionskennung, Regel-IDs, Frage-IDs; Desktop- und Mobilbilder als CI-Belege erfassen (das ist noch keine manuelle Sichtabnahme).
   Ein zweiter echter Chrome-Test bedient die gesamte Pilotnavigation, kontrolliert Fokus und 320-/390-Pixel-Breite sowie 200-%-Vergrößerung, prüft die Seiten-Sicherheitsrichtlinie, einen ausdrücklich angeforderten JSON-Testprotokoll-Export und simuliert einen Ladefehler einschließlich sichtbaren Ladezustands, ausgeblendeter Altansicht und erfolgreichem Wiederanlauf.
5. C0-Versions- und Konsistenzprüfung `python3 tools/check_c0_release.py`.
6. Reproduzierbare ZIP-Erzeugung `python3 tools/check_c0_release.py --package dist/c0-review.zip`.
7. SHA-256-Abgleich aller ZIP-Einträge `python3 tools/check_c0_release.py --verify dist/c0-review.zip`.
8. Separater **tatsächlicher** visueller Browser- und Tastaturtest (Desktop, schmale Ansicht, Fokusfolge, Kontrast, Fehlermeldungen) vor technischer UI-Abnahme; der reine HTTP-Test ersetzt diesen nicht.
9. Bei behaupteter Originaltreue: kontrollierter, dokumentierter VICE-Vergleich mit identifizierter C64-Datei und Originalnachweisen.
10. Die CI-Mobilbilder anhand realer Screenshots prüfen; auf schmalen Bildschirmen müssen der Pilot und sein erster Bedienknopf vor der langen Forschungsseitenleiste sichtbar sein. 
11. Der interne Vorabnahmebericht `REVIEW_STATUS.json` muss die Freigaben als offen ausweisen. Korrekte Test-IDs in der Vergleichsvorlage ersetzen keine Emulatorbeobachtungen.

**Fixierter technischer C0-Umfang:** [24_C0_TECHNISCHER_UMFANG.md](24_C0_TECHNISCHER_UMFANG.md). Erlaubt bleiben nur Fehlerbehebung, Sicherheit, Barrierefreiheit, Tests und Dokumentation.

**Verbindliche Begleitdokumente:** [21_C0_ORIGINALVERGLEICH.md](21_C0_ORIGINALVERGLEICH.md) und [22_C0_VORABNAHMEBOGEN.md](22_C0_VORABNAHMEBOGEN.md).

Die GitHub-Automatik darf erfolgreiches Paketbauen als **„technische Struktur geprüft“** melden, niemals als „historische Wahrheit bestätigt“ oder „veröffentlichungsbereit“. Das Ergebnis der menschlichen Sichtprüfung darf nicht fingiert werden.

## 7. Vorabnahme als ein einziges Paket

Das automatisch erzeugte `oli-imperium-c0-<version>.zip` enthält ausschließlich erlaubte Text-, Code-, Vertrags- und Dokumentationsdateien plus `REVIEW_MANIFEST.json` (SHA-256 je Datei). Es enthält **keine** C64-ROMs, Diskettenbilder oder ungeklärten Originalgrafiken.

Die Abnahmeunterlagen bündeln:
- **Versionsakte:** Kennung, Bezug auf geprüften Commit/PR, Komponenten, Änderungsverlauf.
- **Technik:** geprüfte Funktion und tatsächliche CI-Läufe, Ergebnis der Browserprüfung, Fehler-/Risikobericht.
- **Wissenschaft:** Quelle→Regel→Modul→Test und separate Liste unbewiesener Punkte.
- **Rechte:** Bestätigung der Zulässigkeit öffentlich verteilter Bilder/Texte und akademischer Vorgaben.
- **Entscheidungen:** wenige eindeutig formulierte Entscheidungen statt fortlaufender kleinteiliger Nachfragen.
- **Reproduzierbarkeit:** Manifest, Hashes, Startanleitung, erwartete Testausgaben und gegebenenfalls ausdrücklich exportierte C0-Navigationsprotokolle. Letztere sind technische Tests, **keine** Originalbeweise.

### Die vier manuellen Freigaben

`release/approvals.json` hält transparent `false` für: technische Gesamtprüfung, wissenschaftlichen Geltungsbereich, Rechteprüfung, verantwortliche GitHub-Übernahme. Diese Haken werden **nur nach tatsächlicher Zustimmung** geändert. **Ein grünes JSON-Flag ist allein kein Beweis der Zustimmung:** GitHub-Review, sachliche Entscheidungsprotokolle und gesetzliche Anforderungen bleiben zusätzlich erforderlich.

**Keine einzige automatisierte Funktion veröffentlicht einen Release oder umgeht Branch Protection.** Ein Vorabnahme-ZIP ist ein internes Prüfartefakt, kein öffentlicher GitHub-Release.

## 8. Minimaler manueller Gesamtprozess

Wenn das Vorabnahme-Paket fertig ist: **ein Termin, ein Prüfarchiv, eine strukturierte Entscheidung**:

1. Nutzer prüft Browseransicht und verständliche Funktionen anhand einer kurzen Checkliste.
2. Verantwortliche Forschung bestätigt, dass die Darstellung keine unbelegten C64-Fakten behauptet.
3. Rechte-/Autorenfragen und Beitrag zu den Abschlussarbeiten werden beantwortet.
4. GitHub-Review und Branch-Schutz werden unabhängig beachtet.
5. Bei Änderungswunsch: kleine Folgecommits + neue CI + neu nummerierter Kandidat.

Offene Originalfragen dürfen bei einem eindeutig bezeichneten **C0-Forschungsprototyp** bestehen bleiben. Sie verhindern aber die Bezeichnung „originalgetreu“ und bei einem späteren Spielnachbau die passende fachliche Freigabe.

## 9. Die nächsten drei Schritte

1. **Release-Werkzeug samt CI vollständig grün prüfen:** Version, ZIP-Manifest, manipulierter Inhalt und fehlende Dateifälle.
2. **HTML-Testbasis funktions- und visuell prüfen:** Browser/Tastatur/Smartphone und Fehlerzustände; Fundstellen nachführen.
3. **Erst dann einen C0-Vorabnahmekandidaten zusammenstellen:** mit einem einheitlichen Test- und Risikobericht; keine öffentliche Veröffentlichung ohne Freigaben.

**Empfehlung:** Freigaben nach **Risiko und Zuständigkeit** bündeln, nicht nach jeder einzelnen Codeänderung. So bleiben Forschung und Rechte geschützt und die technische Entwicklung läuft dennoch weitgehend unabhängig.
