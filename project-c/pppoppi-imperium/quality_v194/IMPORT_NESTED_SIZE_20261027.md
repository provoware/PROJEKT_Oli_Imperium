# Projekt C – verschachtelte Fremdspielstaende und Dateigroessengrenze

**Stand:** 27.10.2026, 23:29 MEZ. **Basis:** PR #95, HEAD `b8b5e11ba9feaec9ef4c1d3b94b0d047e88c877f`; `main` `d3dc371154cc1089e06f34d0dc4ff04047132360`.
**Geltung:** ausschliesslich eigenstaendige PPPOPPI-Adaption, keine historische C64-Referenz. **Pflichten:** SIC-02, FEH-01, FEH-02, SPE-01 (Teilnachweise, Gesamtstatus BLOCKED).

## Vorpruefung und Risiko

PR #95 pruefte 13 grobe Strukturfehler und HTML-Ereignisfragmente. Im Originalkern `SPIEL/src/v082_engine.js` validiert `OliV082.validate` weitere verschachtelte Werte; `SPIEL/src/neo_bridge.js` lehnt Dateien ueber 5.000.000 Bytes ab. Bisher fehlte ein ausdruecklicher Browsernachweis fuer diese Tiefe und die exakte Dateigrenze.

## Umsetzung

Der bestehende echte Offline-Chromium-Test `quality_v194/test_browser_import_input_security_v194.py` prueft zusaetzlich **17** gezielt ungueltige verschachtelte Zustaende (insgesamt **30** ungueltige JSON-Strukturen): fremde Claim-Eigentuemer, doppelte Gutachten, falsche Tankstufe, Lagerueberlauf, negative Reserve, Bohrung ohne Eigentum, falsche Firmenfelder, zu viele Spieltage, ueberzahlte Rechnung, ungueltigen Vertrag, negative Marktdaten, ungueltigen Zugindex, Aktionszaehler, Phase und Minispielart. Jeder abgewiesene Import muss den gesamten aktiven Spielstand unveraendert lassen.

Zusaetzlich wird ein sonst gueltiger Spielstand durch JSON-Leerzeichen auf **exakt 5.000.000 Bytes** aufgefuellt und muss importierbar bleiben. Dieselbe Datei mit **5.000.001 Bytes** muss abgewiesen werden, ohne den Spielstand zu veraendern. Die acht bereits vorhandenen HTML-Szenenpruefungen und die Wiederherstellung im neuen Browserkontext bleiben erhalten.

**Keine Spielkern-/Originalaenderung:** Nur Testdatei, CI-Schrittbezeichnung, Pflichtmatrix und dieser Bericht. Kein reales Nutzerprofil und keine echten Spielstaende werden beschrieben.

## Nachweise und Abnahmekriterien

- Befehl: `python3 project-c/pppoppi-imperium/quality_v194/test_browser_import_input_security_v194.py`
- CI: `.github/workflows/prerelease-browser-project-c.yml`, Job `chromium-roundtrip`
- Erwartet: 30/30 sicher abgewiesene ungueltige JSON-Strukturen, 2/2 korrekt behandelte Dateigrenzen, 8/8 HTML-Szenen, Export/Import, keine externen Anfragen oder JavaScript-Fehler.
- **Status bei Implementierung: PENDING**, bis der tatsaechliche GitHub-CI-Lauf auf dem endgueltigen Zweig-HEAD ausgewertet ist. Lokaler Browserlauf war wegen fehlender GitHub-Netzwerkverbindung nicht moeglich. Kein PASS ohne ausgefuehrten Nachweis.

## Weiterhin offen

Auch ein gruener Test prueft nicht alle beliebigen JSON-Felder, unbegrenzte Verschachtelung, Speicherverbrauch, vollstaendige Wirtschaftsfolgen oder komplette Sieg-/Niederlagenpartien. **SIC-02 und das Vorrelease-Gesamtgate bleiben BLOCKED.** Die Endabnahme des Nutzers erfolgt erst nach allen eigenstaendig moeglichen technischen Pflichten.

## Naechste drei Schritte

1. CI auf finalem HEAD auswerten und Fehler fachlich beheben; nicht Tests abschwaechen.
2. Weitere Speicher-/Sicherheitsgrenzen und gueltige verschachtelte Spielstaende mit Buchungsfolgen pruefen.
3. Eigenstaendigen Endregelvertrag praezisieren und komplette Endpartien mit Neustarts nachweisen.

**Empfehlung:** Jede Importablehnung weiterhin gegen den vollstaendigen Vorzustand pruefen, nicht allein gegen Fehlermeldungen.

## Tatsaechliche GitHub-Abnahme des Implementierungs-HEAD

**Getesteter Code-HEAD:** `27914652cc4933239b07841009b828e0f4d2f87a` (27.10.2026).

- [Chromium-CI #40595443169](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40595443169): **PASS, alle vier Browser-Jobs**. Der konkrete Schritt `Fremde Spielstaende mit 30 Struktur- und Tiefenfehlern, 5-MB-Grenze und HTML-Escaping` im Job `chromium-roundtrip` war **success**. Die vorherigen 13 und neuen 17 Ablehnungen, die gueltige 5.000.000-Byte-Datei und die abgewiesene 5.000.001-Byte-Datei sowie die acht HTML-Szenen sind im definierten Testumfang geprueft.
- [GitHub-Quellpruefung #40595443211](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40595443211): **PASS**.
- [Vorrelease-Gesamtgate #40595443230](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40595443230): **FAIL/BLOCKED erwartungsgemaess**; nur 6 von 52 Pflichten freigegeben. Die Teilpruefung hebt SIC-02 nicht auf PASS.
- Eine voruebergehend fehlerhafte YAML-Schrittbezeichnung mit ungeschuetztem Doppelpunkt verursachte vor PR #96 nicht lauffaehige Push-Workflow-Versuche. Der Doppelpunkt wurde entfernt; erst der oben verlinkte Pull-Request-Lauf beweist die erfolgreiche Korrektur.

**Hinweis:** Dieser nachfolgende Dokumentations-Commit veraendert keinen Test- oder Spielcode; sein finaler CI-Status ist separat nachzusehen. Keine pauschale Sicherheitsfreigabe.
