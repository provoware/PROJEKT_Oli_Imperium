# 19 · Verbindliches Regelwerk für die parallele HTML-Testbasis

**Stand:** 10.10.2026 · **Geltung:** Arbeit A (Forschung), B (Softwareentwurf) und vorgezogene technische HTML-Erprobung **C0**.  
**Wichtig:** C0 ist **keine** Freigabe für den vollständigen Nachbau C und **kein Originaltreue-Nachweis**. Der spätere Nachbau C braucht weiterhin den eigenen Entscheidungspunkt gemäß `AGENTS.md`, `CONTRIBUTING.md` und `docs/08_ROADMAP_CHECKPOINTS.md`.

## 1. Warum HTML schon während A und B?

Eine bedienbare Oberfläche macht Navigationsmodelle, Datenlücken, Querverweise und Barrierefreiheitsprobleme früh sichtbar. Sie darf jedoch keine nicht belegten Spielregeln erzeugen. Ziel ist **ein Forschungswerkzeug**, nicht die Behauptung „Oil Imperium läuft bereits“.

**Leitprinzip:** A liefert Originalbelege; B entwirft wartbare Modelle; C0 visualisiert *nur diesen Entwurf und seine Unsicherheiten*. Keine der Rollen darf den fachlichen Freigabestatus eigenmächtig erhöhen.

## 2. Architektur und einzige Datenquelle

```text
data/contract.json  (einziger Forschungsvertrag; Quelle/Wahrheitsstatus)
       │ lesender Zugriff
       ▼
prototype/navigation.mjs    reine Navigation / Entwurfszustände
prototype/pilot-trace.mjs   begrenzte, reproduzierbare Testprotokolle
prototype/reference-comparison.mjs   noch unbestätigte TEST-ID-Vergleichsvorlage
       │
       ▼
prototype/app.mjs           Datenladen + Klick-/Fehlersteuerung
prototype/ui/render.mjs     DOM-Darstellung, keine Fachentscheidungen
prototype/ui/texts.de.mjs   ausschließlich deutsche Oberflächentexte
       │
       ▼
prototype/index.html        semantische Grundstruktur
prototype/styles.css        Erscheinungsbild und Barrierefreiheit
```

- **Kein dupliziertes Datenmodell:** Screens, Regeln, Quellen, Fragen und Status kommen stets aus `data/contract.json`.
- **Keine Wirtschaftssimulation:** Navigation verändert keine Preise, Reserven, Besitzer oder Spielzüge.
- **Protokollierung ohne Scheingenauigkeit:** Schritte werden ausschließlich als technische Entwurfsübergänge mit fortlaufenden Nummern erfasst; höchstens 200 Schritte bleiben im Speicher. Kein Zeitstempel, keine personenbezogenen Daten oder automatische Veröffentlichung.
- **Keine angeblichen Originalsteuerungen:** Klickschaltflächen sind technische Testeingaben von B, **keine C64-Tastenbehauptungen**.
- **Kein Originalmaterial eingebaut:** Keine ROMs, Disketten, Original-Screenshots, Texte oder Musik ohne geklärte Nutzungsrechte.
- **Keine externe Laufzeitabhängigkeit:** HTML, CSS und JavaScript liegen lokal; externe Quellen öffnen sich erst beim bewussten Anklicken.
- **Keine automatische Speicherung:** Der Pilot schreibt weder Forschungsdaten noch Spielstände, Cookies oder lokale Speicherdaten. Navigationsprotokoll und offene TEST-ID-Vergleichsvorlage können durch bewussten Klick separat als JSON-Datei exportiert werden; beide sind keine historischen Originalbelege.
- **Kein Eingabe-HTML:** Dynamische Inhalte werden als Text in DOM-Knoten eingesetzt (`textContent`), nicht als `innerHTML`.
- **Kein zweites Spielsystem:** Nach Freigabe einzelner Regelpakete kann ein späteres Modul entstehen; der Pilot zeigt dieses über eine schmale Schnittstelle, statt Regeln neu zu implementieren.

## 3. Drei Freigabestufen (streng getrennt)

| Stufe | Erlaubt | Nicht behaupten |
|---|---|---|
| **A – Forschungsentwurf** | Quellverweise, Hypothesen, offene Fragen, beobachtbare Ziele | Die tatsächliche Originalimplementierung sei geprüft |
| **B/C0 – technischer Versuch** | Logische Zustandswechsel, Datenansicht, Bedienbarkeit, technische Testfälle | Diese Steuerung bzw. Optik entspreche dem C64-Original |
| **C – fachlich freigegebener Nachbau** | Einzelne bestätigte Originalregeln mit Version, Referenz und Vergleichstests | Allgemeine 1:1-Originaltreue ohne Gesamtnachweis |

**Aktueller Stand:** `reference.status = candidate`, `verified_run = false`, vier offene Regeln, keine bestandenen Originaltests. Das bleibt trotz funktionsfähiger HTML-Anzeige unverändert.

## 4. Pilot-Umfang und Unsicherheitskennzeichnung

Erste logische Zustände: `SCREEN-001` Büro, `SCREEN-002` Weltkarte, `SCREEN-003` Claim-Information. Die drei Schritte sowie Rückschritte sind ein **von B vorgeschlagener Navigationsautomat**. Besonders `SCREEN-003` könnte im Original eine Teilansicht sein (`Q-002`); die Rückbedienung ist ungeklärt (`Q-003`). Alle Schaltflächen tragen deshalb das Wort **Entwurf**.

Die Anzeige nennt bei jedem Zustand **Bildschirm-ID, Regel-IDs, Quellen-IDs, Status, offene Fragen**. Daneben erscheint die nachvollziehbare technische Testfolge, die als JSON exportiert werden kann; eine neue Datenladung beginnt eine neue Testsitzung. Fehlt eine erforderliche Datei oder ist der Vertrag beschädigt, stoppt der Pilot mit einer verständlichen Fehlermeldung. Keine Ersatzfakten.

## 5. Entwicklungsprozess – parallel, aber ohne gegenseitige Blockade

1. **Quelle / Befund (A):** genaues Original, Version, Hash, Screenshot-Provenienz, Eingabe und beobachtetes Ergebnis dokumentieren.
2. **Regelkarte (A):** betroffene ID, Status und Testfall im einzigen Datenvertrag prüfen; bei Unklarheit nur `open`.
3. **Modulvertrag (B):** Ein- und Ausgaben, Fehler und erlaubte Seiteneffekte klein spezifizieren.
4. **HTML-Arbeitspaket (C0):** maximal ein gut abgrenzbarer Navigations- oder Anzeigeabschnitt pro Änderungsantrag; bestehende Schnittstellen bewahren.
5. **Qualität:** Python-Projektvalidator, Python-Negativtests, JavaScript-Funktionstests; echte Browserprüfung mit Tastatur und schmalem Viewport vor sichtbarer Freigabe.
6. **Nachweis:** Welche IDs wurden berührt? Welche Prüfergebnisse wurden tatsächlich erzielt? Welche Originalfrage bleibt offen?
7. **Übernahme:** Pull Request nach Code- und Fachreview. **Keine automatische Merge- oder Veröffentlichungserlaubnis.**

**Vorrangregel:** Ein unbewiesener Originalparameter blockiert nur die davon abhängige Fachimplementierung; Lesbarkeit, Layout, Datenprüfung und Navigationsentwurf können weiterentwickelt werden.

## 6. Abnahme für jede sichtbare Funktion

- Berechtigter Nutzer kann die Funktion vollständig mit Tastatur und Maus bedienen.
- Mobile Erstansicht priorisiert bei schmalen Displays den eigentlichen Navigationspiloten; die lange Forschungsbeschreibung folgt danach.
- Schaltflächen haben eine echte Wirkung oder existieren noch nicht; kein Attrappen-Menü.
- Ausreichender Kontrast, sichtbarer Tastaturfokus, lesbarer Text, funktionale Smartphone-Darstellung, keine horizontale Überlappung.
- Keine externen Schriften/Bibliotheken nötig, Offlinebetrieb über lokalen HTTP-Server.
- Fehler bei fehlender/beschädigter Datenquelle sichtbar, keine verfälschende Rückfallanzeige.
- Änderungen am Navigationsmodell sind mit deterministischen Positiv- und Negativtests belegt.
- Keine Veränderung des Forschungsstatus oder der Originaltreue-Kennzahl durch UI-Tests.
- Verwendete historische Bildschirmgrafiken dürfen erst nach Rechteklärung und belegtem Originalvergleich hinzukommen.

**Prüfstufen:** (I) Python-Vertragsvalidator; (II) Python-Unittests; (III) JavaScript-Modultests; (IV) lokale Browser-Sicht- und Tastaturprobe; (V) bei originalbezogener Aussage der passende VICE-Vergleich mit Beleg. Stufe V ist derzeit offen. Ein grüner Techniktest ersetzt sie nicht.

## 7. Lokal starten (kein Netzwerkdienst im Internet)

Vom Repository-Hauptverzeichnis:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Anschließend im Browser **http://127.0.0.1:8000/prototype/** öffnen. Zum Beenden im Terminal **Strg+C** drücken. Die Seite liest `data/contract.json` über die lokale Serveradresse. Direktes Öffnen als `file://` ist wegen der Browser-Sicherheitsregeln ausdrücklich kein zugesicherter Betriebsweg.

Prüfen:

```bash
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
node --test prototype/tests/*.test.mjs
```

Node.js wird **nur für automatische JavaScript-Tests**, nicht zum Starten der Oberfläche benötigt.

**Vergleich und Abnahme:** [21_C0_ORIGINALVERGLEICH.md](21_C0_ORIGINALVERGLEICH.md) beschreibt die bewusst unbestätigten Originaltestverweise; [22_C0_VORABNAHMEBOGEN.md](22_C0_VORABNAHMEBOGEN.md) die komplette Vorabnahme. **Versions- und Sammelabnahme-Regelwerk:** [20_GEBUENDELTE_VORABNAHME.md](20_GEBUENDELTE_VORABNAHME.md). Die automatisierte Prüfkette ergänzt die reinen Strukturtests um reproduzierbare ZIP-Pakete und einen Headless-Chrome-Start auf Desktop- und Mobilformat; die fachliche Entscheidung bleibt gesondert.

## 8. Grenzen und nächste Entscheidung

Noch offen: echte deutsche C64-PAL-Referenz und Dateihashes, VICE-Start, Original-Screenshotserie, konkrete Navigation und Rückbedienung, fachliche Zustimmung zu C. Ohne diese Nachweise darf C0 **nicht** als Originalrekonstruktion oder „originalgetreu“ veröffentlicht werden.

**Nächste drei Schritte:** (1) HTML-Pilot im Browser und auf Smartphonebreite testen; (2) den C64-Navigationsablauf rechtmäßig im Emulator belegen; (3) Screens und Navigationsregeln anhand der Belege einzeln nachprüfen und die technische Ansicht erst danach fachlich erweitern.

**Weiterführende Empfehlung:** Vor jedem neuen Bildschirm zuerst die Kette `SCREEN-ID → REGEL-ID → Quelle → TEST-ID → Status` schließen; dadurch bleibt das HTML-Experiment wissenschaftlich sauber und langfristig wartbar.
