# Änderungsprotokoll

## C0 0.1.0-alpha.7 – echte Tastaturprüfungen und eigenständig erneut getestetes Vorabnahme-Paket (unveröffentlicht)

- Neuer Chrome-Test ohne zusätzliche Pakete: echte Tab-, Umschalt+Tab- und Eingabetasten prüfen die Fokusreihenfolge, sichtbare Fokusmarkierungen, Navigation und Mobilansicht.
- GitHub-Prüfläufe brechen bei einem fehlgeschlagenen Tastaturtest korrekt ab; zuvor wurde der Fehler durch die Protokollweitergabe verdeckt.
- Das C0-ZIP wird separat entpackt und mit den enthaltenen Python-/JavaScript-Tests erneut geprüft, einschließlich Forschungsdaten-, Aufnahmevorlagen- und Reviewgruppenprüfung.
- Direkt aus der HTML-Testbasis verlinkte wissenschaftliche Dateien sind nun im Prüfarchiv enthalten. Ein Negativtest schützt vor fehlenden lokalen HTML-Verweisen.
- Vorabnahme-Prüfsummen werden für das gesamte ZIP zusätzlich ausgewiesen. Die SHA-256-Integrität ist kein unabhängiger Echtheits- oder Freigabenachweis.
- Originalreferenz, TEST-001 bis TEST-003 und alle vier Freigaben weiterhin offen. Kein Merge, keine Beta- oder RC-Freigabe, keine Veröffentlichung.

## C0 0.1.0-alpha.6 – Originalaufnahme-Vorlage, echtes Zoom-Review und vierfacher Qualitätscheck (unveröffentlicht)

- **Originalreferenz weiterhin offen:** `data/original-session.template.json` enthält ausschließlich leere Testkarten für TEST-001 bis TEST-003, zwei G64-Seiten, VICE/PAL-Angaben und PNG-Belege. Keine Spieldateien, erfundenen Hashes oder Eingaben hinzugefügt.
- Neues unabhängiges Werkzeug `tools/validate_c64_capture.py` mit Negativtests: private Aufnahmeakten vor späterem wissenschaftlichen Review auf Format, beide Datenträgerseiten, Hashes, Emulatorversion, lückenlose Eingaben und Bildbelege prüfen. „Strukturell vollständig“ ist **niemals „Original bestätigt“**.
- **Barrierefreiheit:** Tatsächliche HTML-/Tastaturreihenfolge nun Pilot vor Forschungslinks; CSS hält auf großen Displays trotzdem den Infobereich links. Chrome-Regressionsmatrix erweitert um 150 % und 200 % bei mehreren Fenstergrößen sowie fokussierbare, ausreichend große Schaltflächen.
- Der umfangreiche PR #7 erhält vier ausdrücklich getrennte, maschinenlesbare Prüfgruppen A–D (`release/review-segments.json`, `tools/check_review_segments.py`, Negativtests), jede Archivdatei muss genau einmal zugeordnet sein.
- Internes Review-ZIP umfasst nun alle ausführbaren Python- und JavaScript-Tests, den Source-Validator, die leere Aufnahmevorlage und Forschungshinweise. Das bereits bestehende SHA-256-Manifest und `REVIEW_STATUS.json` bleiben verbindlich; keine Freigabe.
- `docs/23_C0_REVIEW_SEGMENTIERUNG.md` beschreibt Review-Reihenfolge, offene Fachfragen und die spätere unabhängige Gesamtabnahme. **Beta-/RC-Version nicht vergeben; kein Merge und keine Veröffentlichung.**

## C0 0.1.0-alpha.5 – C64-Vergleichsvorbereitung, Mobilnavigation und Vorabnahme (unveröffentlicht)

- Technisch nachvollziehbare **Vergleichsvorlage** mit den drei Originaltest-IDs TEST-001/002/003, Quellen-/Regelverweisen und technischen Schrittkennungen; Originalbeobachtungen und fachliche Freigaben bleiben bewusst leer.
- Reines `prototype/reference-comparison.mjs` samt Negativtests; JSON-Download nur nach bewusstem Nutzerklick, unabhängig vom Navigationsprotokoll.
- Nach echter Sichtung der alpha.4-CI-Screenshots Mobilansicht verbessert: Navigationspilot erscheint auf 320/390 Pixel vor der langen Forschungsseitenleiste.
- Echte Chrome-Browsertests kontrollieren Vergleichs-JS-Export, unbestätigten Referenzstatus, Reihenfolge der Mobiloberfläche und sichtbaren ersten Navigationsknopf; zusätzliche lange Mobil-Vorschau als CI-Artefakt.
- `REVIEW_STATUS.json` ergänzt das reproduzierbare interne Prüf-ZIP: Version, offene Freigaben und unverifizierter C64-Stand; Manipulations-/Freigabenegativtests hinzugefügt.
- `docs/21_C0_ORIGINALVERGLEICH.md` und `docs/22_C0_VORABNAHMEBOGEN.md` dokumentieren technische/fachliche Abgrenzung und gebündelte Abschlusskontrolle.
- Versionsdateien auf `0.1.0-alpha.5` fortgeschrieben. **Kein Originaltest automatisch bestanden, kein Merge, kein öffentlicher Release.**

## C0 0.1.0-alpha.4 – reproduzierbare technische Navigationsprotokolle (unveröffentlicht)

- Eigenständiges `prototype/pilot-trace.mjs`: unveränderliche, deterministische Schrittfolge für den technischen HTML-Entwurf, ohne Browserabhängigkeit oder Forschungsdatenänderung.
- Begrenzung auf 200 protokollierte Schritte, fortlaufende Schrittzählung und transparente Kennzeichnung ausgelassener älterer Schritte.
- Sichtbares Protokoll mit Bildschirm-IDs und rein technischen Aktionen sowie bewusst auslösbarer JSON-Export; weder automatische Datenspeicherung noch historische Originalbehauptung.
- Neue Positiv- und Negativtests für identische Protokolle, unzulässige Übergänge, veränderte Vorgängerzustände, Prototyp-Eigenschaften und lange Sitzungen.
- Browser-Ablauftest prüft echten JSON-Export, Sitzungsneustart und Unterdrückung veralteter Protokolle bei Ladefehlern.
- Navigation lehnt nun auch vererbte JavaScript-Objekteigenschaften als ungültige Aktionsnamen ab.
- Versions- und Abnahmedateien auf `0.1.0-alpha.4` aktualisiert; vier Freigaben bleiben ausstehend.

## C0 0.1.0-alpha.3 – Schutz beim Datenladen und vergrößerter Darstellung (unveröffentlicht)

- Inhaltssicherheitsrichtlinie im HTML-Prototyp: Seitenskripte, Formatvorlagen und Forschungsdatenzugriffe nur aus derselben Herkunft, keine eingebetteten Fremdobjekte; technisch gegen unerwartete Skriptausführung abgesichert (keine Garantie gegen alle Sicherheitsprobleme).
- Beim Nachladen ausdrücklich `aria-busy` setzen, alte Forschungsdaten und Navigationsschaltflächen entfernen sowie Versionsstatus bis zur erfolgreichen Prüfung zurückhalten.
- Netzwerkfehler sichtbar behandeln; erneuter Versuch nach Störung möglich und vollständig im echten Browser getestet.
- HTML-Browserregressionen für 320 Pixel, 390 Pixel und eine 200-%-Darstellung ohne horizontales Überlaufen; Ladezwischenzustand und sichere Seitenrichtlinie geprüft.
- Zusätzlicher Modultest für die getrennte Ladezustands-Darstellung; `release/approvals.json` bleibt trotz grüner Technikprüfungen ohne Freigaben.

## C0 0.1.0-alpha.2 – zusätzliche technische Sicherheits- und Bedienprüfungen (unveröffentlicht)

- Strenge, eigene Laufzeitprüfung des Forschungsdatenvertrags: keine erdachten Referenzfreigaben, keine defekten IDs, Statuswerte, Testnachweise oder Quelllinks. Navigationsmodell und Datenwächter getrennt.
- Zusätzliche negative Node-Tests für widersprüchliche Nachweise und schadhafte Referenzen.
- Reeller Headless-Chrome-Ablauftest: Büro/Weltkarte/Claims/Rückweg, Fokusführung, schmaler Viewport, absichtlich ausgelöster HTTP-Ladefehler und erneutes erfolgreiches Laden.
- Automatisierte AA-Kontrastkontrolle, sichtbarer Tastaturfokus und Mindestgröße von Schaltflächen.
- Alle neuen Tests und Testseiten gehören zum reproduzierbaren C0-Prüfarchiv. Keine Änderungen an Originaldaten oder fachlichen C64-Regeln.
- Eigene Versionskennung `release/c0-version.json` und Abnahmeformular `release/approvals.json` auf `0.1.0-alpha.2` fortgeschrieben; keine Freigabe erteilt.

## Unveröffentlicht – HTML-Forschungsprototyp C0 (Entwurf, Freigabe ausstehend)

- Kleiner offlinefähiger HTML/CSS/JavaScript-Forschungsviewer für den hypothetischen Büro→Weltkarte→Claim-Pilot.
- Regelstatus, Quellen und offene Fragen werden lesend aus `data/contract.json` dargestellt; keine duplizierten Forschungsdaten.
- Kein bestätigter Originalbildschirm, keine Spielsimulation, keine vorgezogene Freigabe für Projekt C.
- Acht deterministische Navigations- und Konsistenztests mit Node-Standardbibliothek; separate CI mit Python-Vertragscheck und lokalem HTTP-Smoke-Test.
- Verbindliches Vorgehens- und Freigaberegelwerk in `docs/19_HTML_TESTBASIS_REGELWERK.md`.
- C0-SemVer `0.1.0-alpha.1` getrennt von der Forschungs-Dokumentationsversion; vier zunächst gesperrte fachliche Freigaben.
- Deterministisches internes ZIP-Prüfarchiv mit SHA-256-Manifest, Manipulations-/Negativtests und automatischem GitHub-Artefakt.
- HTML-Aufteilung in Navigationsmodell, Controller, reine DOM-Darstellung und deutsche Oberflächentexte.
- Zusätzliche Browser-Sichtproben für Desktop und Mobilgerät in Headless Chrome; kein Emulator-Originalvergleich.
- Begleitender Prozess für gebündelte Vorabnahme: `docs/20_GEBUENDELTE_VORABNAHME.md`.

## 3.0 – 2026-10-10 (Projektgrundstruktur)
- Gemeinsamer Forschungs- und Architekturauftrag mit zwei eigenständigen Abschlussarbeiten.
- Quellen-, Regel-, Bildschirm-, Modul-, Test- und Fragen-Verknüpfung als ein maßgeblicher Datensatz.
- Codex-Regeln, projektgerechte Änderungsabwicklung, vordefinierte Vorlagen und Handzettel.
- Kleiner Validator mit Negativtests; keine fingierten Originaltreue-Prozentwerte.
- Dokumentierter Workflow für Bildbelege, Risiken, Recht, Heimstudie und späteren Deutschland-/PPPOPPI-Ableger.
- Noch keine formell festgelegte C64-Originaldatei und keine Programmimplementierung.

## Leitlinie
Fortschritt nur für wirklich abgeschlossene, definiert geprüfte Ergebnisse angeben. Nicht im Vorgriff historische Spielregeln freigeben.
