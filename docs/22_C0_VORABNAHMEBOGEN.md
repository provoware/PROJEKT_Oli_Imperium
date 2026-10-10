# 22 · C0-Vorabnahmebogen (technisches Forschungslabor)

**Aktueller technischer Stand:** 0.1.0-alpha.8, noch **KEIN** Beta-, RC- oder öffentlicher Release.  
**Geltungsbereich:** HTML-Technik, Testbarkeit und Forschungsdaten-Anzeige; nicht der originale Spielnachbau.

## A. Automatisch nachprüfbare technische Voraussetzungen

| Prüfpunkt | Nachweis bei jeder Version | Ausfall führt zu |
|---|---|---|
| Technischer Funktionsumfang | `release/c0-scope.json` stimmt mit der Version und allen neun Implementierungsdateien überein; neue Spielfunktionen und automatische Freigaben bleiben ausgeschlossen | Paketbau stoppen |\n| Versions- und Freigabevertrag | `release/c0-version.json` / `release/approvals.json` stimmen überein | Paketbau stoppen |
| Forschungsdatenintegrität | `tools/validate_project.py`, Datenwächter, Verknüpfungstests | Paketbau stoppen |
| Reine Navigation | Modultests, keine Veränderung von Forschungs-/Wirtschaftszuständen | Prüfung fehlgeschlagen |
| Sitzungs- und Vergleichsprotokoll | begrenztes JSON, TEST-001/002/003, Originalbelege bleiben null | Prüfung fehlgeschlagen |
| Bedienung und Sicherheit | Tastaturfokus, 320/390 Pixel, 200 %, sichere Quellen und Skripte | Prüfung fehlgeschlagen |
| Mobiler Erstkontakt | Schaltflächen vor der langen Forschungsseitenleiste, ohne horizontales Überlaufen | Prüfung fehlgeschlagen |
| Laden, Fehler und Wiederanlauf | Ladezustand, erneutes Laden, altes Protokoll gesperrt | Prüfung fehlgeschlagen |
| Browserbeleg | wirkliche HTML-Ausgabe, zwei Screenshotgrößen plus längere Mobilansicht und DOM-/Fokusprüfung bei 150/200 % | Prüfung fehlgeschlagen |
| Originalaufnahme als Vorlage | private leere Aufnahmeakte, Pflichtfelder für zwei G64-Seiten, VICE/PAL, TEST-001 bis TEST-003 | Struktur-Fehler stoppt Paketbau; offene Belege bleiben offen |
| Review-Segmentierung | jede Datei genau einmal in einer der vier Gruppen A–D | Paketbau stoppen |
| Reproduzierbarkeit | gleiches Quellpaket ergibt dasselbe ZIP; SHA-256 alle Dateien geprüft | Paketbau stoppen |
| Echte Tastaturbedienung | Chrome-Diagnoseschnittstelle sendet Tab, Umschalt+Tab und Eingabetaste; Fokusreihenfolge und Bildschirmwechsel werden geprüft | Prüfung fehlgeschlagen |
| Entpacktes Vorabnahme-Paket | Alle Python- und JavaScript-Tests laufen nochmals aus dem entpackten ZIP; lokale HTML-Verweise sind enthalten | Prüfung fehlgeschlagen |
| Abnahmebericht | `REVIEW_STATUS.json`, Manifest und konkrete offene Freigaben im ZIP | Paketbau stoppen |

**Neue verbindliche Gruppierung:** [23_C0_REVIEW_SEGMENTIERUNG.md](23_C0_REVIEW_SEGMENTIERUNG.md) und die maschinenlesbare Datei `release/review-segments.json`. Vier separate Prüfabschnitte, aber weiterhin eine gemeinsame formelle Gesamtfreigabe.

**Regel:** Jede Aufgabe wird nur dann als technisch bestanden bezeichnet, wenn der konkrete Lauf für genau denselben Commit erfolgreich war. Frühere grüne Läufe ersetzen keine Prüfung nach neuem Commit.

## B. Menschliche Sicht- und Bedienungsprüfung – vorerst offen

- [ ] Oberfläche am echten Desktop bei 100 %, 150 % und 200 % auf Lesbarkeit und Überschneidungen prüfen.
- [ ] Tastatur-Tabfolge, sichtbar markierten Fokus, Bedienung ohne Maus und verständliche Fehlertexte prüfen.
- [ ] Mobilansicht (320 und 390 Pixel) ohne versteckte Knöpfe oder horizontales Scrollen sichten.
- [ ] Kontrast und Schrift bei Vergrößerung begutachten; automatische Farbtests ersetzen keine Gesamtprüfung.
- [ ] Exportdateien wirklich herunterladen und mit der Dokumentation vergleichen.
- [ ] Prüfen, dass alle nicht belegten Originalaussagen weiterhin deutlich als Entwurf erkennbar sind.

**Wichtig:** Automatisierte Tastaturbefehle sind ein eigenständiger technischer Nachweis, aber kein vollständiger manueller Barrierefreiheitsnachweis. Automatisch erzeugte Screenshots sind *Bildbelege einer Browserausführung*, aber noch keine unterschriebene menschliche Sichtabnahme.

## C. Fachliche, rechtliche und organisatorische Freigaben – vorerst offen

- [ ] Wissenschaftlichen Geltungsbereich, Originalreferenz und Originalversuch von Arbeit A getrennt abnehmen.
- [ ] Hochschule/Urheberrecht und Verwendung von Originalmaterial rechtskonform klären.
- [ ] Ausstehende Originaltests TEST-001 bis TEST-003 fachlich behandeln; ihre offene Lage nicht kaschieren.
- [ ] Verantwortliche Person prüft PR, Herkunft, GitHub-Zweigschutz und Erlaubnis für Übernahme.
- [ ] Erst nach positivem Beschluss gilt ein bestätigter C0-Release; für einen echten Spielnachbau ist eine *weitere* separate Freigabe nötig.

## D. Offene Punkte dürfen nicht fälschlich grün werden

- Ein Originalvergleich braucht identifizierte Emulator- und Abbildversion samt Hash und dokumentiertem Eingabeverlauf. **Aktuell fehlt dieser Nachweis.**
- Ein `not_run`-Originaltest ist weder bestanden noch fehlgeschlagen, sondern **nicht durchgeführt**.
- Die Software-`version` ist nicht gleich Forschungs-`schema_version` und nicht gleich Dokumentationsversion.
- `release/approvals.json` bleibt mit vier `false`-Werten ein nicht erteiltes Freigabeprotokoll.
- Das automatisch erzeugte `REVIEW_STATUS.json` ist eine technische Momentaufnahme, **keine erteilte Zustimmung**.

## E. Geplanter gemeinsamer Abnahmezeitpunkt

Erst wenn der technische C0-Umfang stabil, alle tatsächlich geforderten automatischen Kontrollen erfolgreich, die Screenshots gesichtet und die ausstehenden Entscheidungen klar erfasst sind, einen neuen `0.1.0-beta.N`- oder `0.1.0-rc.N`-Kandidaten eröffnen. Änderungen danach nur als eigene nachvollziehbare Korrekturen mit erneuten Prüfläufen. **Kein automatisches Merge und kein öffentliches GitHub-Release.**
\n**Fixierte C0-Grenze:** [24_C0_TECHNISCHER_UMFANG.md](24_C0_TECHNISCHER_UMFANG.md). Ein grüner Prüfstatus ist keine Nutzer- oder Originalfreigabe.\n