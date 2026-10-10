# 21 · C64-Vergleichsvorlage für den technischen Navigationspiloten

**Stand:** 10.10.2026 · **C0-Version:** 0.1.0-alpha.5 · **Wissenschaftlicher Status:** nicht verifiziert.

## Ziel

Die HTML-Oberfläche kann ihre **technische** Navigationsfolge als JSON exportieren. Ein zweiter, ausdrücklich beschrifteter Export erstellt aus diesem Verlauf und dem vorhandenen `data/contract.json` eine **unverifizierte Vergleichsvorlage** für künftige Originalbeobachtungen. Der Export ist keine Originalrekonstruktion, keine Testsiegmeldung und kein erfundener Emulatorbefund.

**Datenfluss:** `data/contract.json` + `prototype/pilot-trace.mjs` → `prototype/reference-comparison.mjs` → JSON-Vergleichsvorlage. Der Vertrag wird **nur gelesen**, nicht verändert. Forschende liefern eine unabhängige C64-Referenz später außerhalb dieses Prototyps.

## Vorläufige Testzuordnung (Arbeit B, Hypothese)

| Vertrags-ID | Technischer Anfang | Technische Aktion | Technisches Ende | Status des Originaltests |
|---|---|---|---|---|
| TEST-001 | SCREEN-001 Büro | to-map | SCREEN-002 Weltkarte | not_run |
| TEST-002 | SCREEN-002 Weltkarte | to-claims | SCREEN-003 Claim-Information | not_run |
| TEST-003 | SCREEN-002 Weltkarte | to-office | SCREEN-001 Büro | not_run |

Die Zuordnung ist **kein bestätigter C64-Eingabebefehl**. Bei TEST-003 umfasst der ursprüngliche Auftrag möglicherweise weitere Rückschritte; die technische Abbildung ist derzeit nur der letzte Wechsel Weltkarte → Büro. Alle vier Originalregel-IDs REGEL-001 bis REGEL-004 bleiben offen. Eine echte Bewertung erfordert eine getrennte Referenz.

### Struktur des JSON-Exports

- `kind: c0-reference-comparison-plan`, `schema_version: 1`, `preview_version`: maschinenlesbare technische Herkunft.
- `technical_trace_kind: c0-technical-navigation-draft`: nur technisches Sitzungsprotokoll.
- `original_verified: false` und `scientific_approval: false`: keine automatische Freigabe.
- `tests[]`: TEST-ID, Titel und *Originalteststatus aus Vertrag*, Regel-IDs, Quellen-IDs, angenommener technischer Übergang und gefundene lokale Schrittnummern.
- `original_observation: null`, `original_evidence_id: null`, `comparison_status: not_compared`: bewusst unbefüllt, nicht bestandene Originaltests.
- `omitted_technical_steps`: über 200 Schritte hinaus verworfene ältere UI-Schritte. Solch eine abgeschnittene Sitzung reicht allein nicht als vollständiger Navigationsbeleg.

## Erst später: echte Emulatorbeobachtung

1. **Original identifizieren:** zulässige, konkrete C64-Dateien bzw. beide G64-Seiten samt SHA-256, Herkunft, Region, Emulatorversion und Startparametern dokumentieren. Keine ROM-/Disk-Images ins öffentliche Repository hochladen.
2. **Beobachtung pro TEST-ID:** Ausgangsbildschirm, konkrete Originaleingabe, beobachtetes Ziel, ggf. Zwischenzustände und Rückweg, Screenshot-/Video-ID, Prüfperson und Dokumentationsstatus in der Forschungsakte von A protokollieren.
3. **Originaltest fachlich prüfen:** Aussagekraft des Belegs, eventuelle Plattformabweichung und Vollständigkeit prüfen; erst dann Forschungskarten gemäß A→B-Übergabevertrag ändern.
4. **Zwei getrennte Ergebnisse:** Der technische Abgleich darf „strukturell gleich“ oder „abweichend“ melden; die fachliche Aussage „originalgetreu“ erfordert weiterhin einen unabhängigen Originaltest mit Belegen.
5. **Abweichungen zuerst beheben:** Änderungen an `SCREEN-003` oder am Rückweg erst auf dokumentierte Originalbeobachtungen stützen; passende Regressionstests ergänzen.

Ein erfolgreicher Node- oder Browser-Test darf `data/contract.json.tests[].status` **niemals** automatisch von `not_run` auf `passed` setzen.

## Fehler- und Sicherheitsregeln

- Ungültige Forschungsreferenzen → Export verweigern.
- Fehlende Originaltest-ID oder falsche Testart → Export verweigern.
- Keine automatischen C64-Behauptungen aus „ähnlicher“ Bildschirmfolge.
- Kein Einlesen von unbekannten Originaldatenträgern oder Datenbeständen über die Browseroberfläche.
- Alle Ausgaben ohne Zeitstempel, Benutzerkennung oder externe Netzwerkübertragung; Download nur nach Nutzeraktion.
- Bei Änderungen der Zuordnung immer diese Datei, die reinen Zuordnungsfunktionen und die Negativtests gemeinsam aktualisieren.

**Gesamtabnahme:** Die Vergleichsvorlage ist Teil des technischen C0-Reviewpakets. Die Originalbeobachtung und alle 3 Originaltests dürfen bei C0 weiter offen bleiben, müssen aber als ausstehend ausgewiesen werden.
