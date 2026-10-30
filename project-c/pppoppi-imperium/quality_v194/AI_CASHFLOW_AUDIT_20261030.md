# BAL-01 / WIR-01 / WIR-04 – Unabhängige Kassenbuch-Gegenrechnung (30.10.2026)

## Anlass: echter Befund aus dem vorherigen GitHub-Lauf

Die [KI-Gesamtprüfung #41004170176](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41004170176) auf HEAD `d25a749f5298f0cb09237f4f1a116ef819d44fc5` ist **PASS**. Ihr JSON-Protokoll enthält zwei jeweils doppelt ausgeführte natürliche 48-Monats-Kampagnen: **192 simulierte Monate**, fünf KI-Firmen pro einfacher Konfigurationsrunde, **0 Monate mit KI-Schulden und 0 natürliche KI-Neustarts**. Alle beobachteten KI-Firmen hatten in jedem der 48 Monatsberichte Ölfeldbesitz. Dies ist ein eng begrenzter Beobachtungsbefund: Die natürliche Insolvenzstrecke wurde dadurch **nicht** ausgeübt und bleibt BLOCKED. Synthetische Rettungsprüfungen bleiben gesondert belegt.

## Neues unabhängiges Pflichtarbeitspaket

`test_ai_cashflow_audit_v194.cjs` prüft die echte Engine ohne Veränderung der 110 Originaldateien oder der Spielstände. Zwei natürliche Konfigurationen (1 Mensch + 2 bzw. 3 KI), je 24 Monate und zweimal deterministisch wiederholt: **4 Kampagnen / 96 Monate**.

- Für jede Firma ohne Neustart: bisherige Buchungen bleiben unverändert, neue Buchungs-IDs sind eindeutig, Beträge und Summen sind sichere Ganzzahlen.
- Unabhängig nachgerechnete Ein- und Auszahlungen müssen exakt der Kassenänderung entsprechen. Der Monatsbericht muss mit der Engine-Kasse, den Schulden und dem gemeldeten Umsatz übereinstimmen.
- Bei einem Neustart wird **keine falsche Kassenkontinuität behauptet**: neuer Generations-/Rettungszähler, Schuldentilgung und offene Rechnungen werden getrennt geprüft.
- Zwei absichtlich verfälschte Testzustände (Kassenbetrag und Buchung) müssen den Prüfer zuverlässig zum Scheitern bringen.
- Wiederholbarkeit, unveränderte Eingabezustände, Engine-Validierung und korrekte Monatsfortsetzung sind Pflicht.

**Keine Gewinnbehauptung:** Kassenfluss und Umsatz sind nicht buchhalterischer Gewinn. Ölfelder, Vorräte, Anlagen und Forderungen haben hier keine bestätigte Vermögensbewertung. Ebenso fehlt eine verifizierte C64-Referenz.

## Reproduzierbare Prüfung

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_cashflow_audit_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_cashflow_audit_v194.cjs
```

[GitHub-Workflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-ai-strategy-metrics.yml), JSON-Artefakt `ai_cashflow_audit.json`.

**CI-Status bei Commit-Erstellung: PENDING.** Erst GitHub-CI auf dem endgültigen HEAD darf diesen neuen Teiltest als PASS bestätigen. BAL-01, WIR-01 und WIR-04 bleiben BLOCKED; 6/52 Gesamtpflichten PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.

## Nächste drei Schritte

1. Den neuen GitHub-Lauf, die zwei Negativtests und die Buchungssummen auswerten; Fehler korrigieren, nicht übergehen.
2. Einnahmen, echte Ausgaben und Investitionen fachlich abgrenzen; danach belastbare Gewinn- und Vermögensdefinition aus dokumentierten Spielregeln ableiten.
3. Aktive Konkurrenz-/Marktkrisen ohne manipulierte Kassenstände testen; Dateidialog-Flake, Medienrechte und historische C64-Referenz unabhängig weiterbearbeiten.

Kein Merge, kein Release, keine vorgezogene persönliche Endabnahme.

## Nachtrag 30.10.2026 – Buchungsarten getrennt statt Kassenstand als Gewinn auszugeben

Der vorangegangene [GitHub-KI-Lauf #41009162560](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41009162560) auf `fd250c989f5e7a3e65deba15e4432f961859b527` ist **PASS** (96 Simulationsmonate, 168 Kassenbuchabgleiche, zwei absichtlich verfälschte Buchungen). Die neue Änderung ist **noch nicht auf ihrem endgültigen HEAD als PASS bestätigt**.

Der vorhandene Test wurde ohne Änderung des Spielkerns erweitert. Er rechnet die Buchungen jetzt je Firma zusätzlich in sechs getrennten Geldkategorien nach:

1. Verkaufserlöse aus den bekannten Codes `MARKTERLÖS`, `VERTRAGSERLÖS`, `AUSSENMARKT` und `RAFFINIERT_MONATSVERKAUF`.
2. Auszahlungen für ausdrücklich bekannte Feldkäufe und Bauinvestitionen.
3. Kredit-Einzahlungen und Tilgungen, getrennt von Verkaufserlösen.
4. Sonstige Einzahlungen und Auszahlungen als **offene Restkategorien**; sämtliche vorkommenden Buchungscodes und ihre Häufigkeiten bleiben im JSON-Protokoll sichtbar.

Für jede Firma ohne Neustart müssen die **unabhängig aus Buchungscodes ermittelten Verkaufserlöse** exakt mit dem Monatsbericht übereinstimmen. Die sechs Kategorien müssen zusammen wieder exakt die Ein- und Auszahlungen sowie die Kassenänderung ergeben. Drei zusätzliche Negativproben verwerfen falsch vorzeichenbehaftete Verkaufs-, Investitions- und Kreditbuchungen: insgesamt **fünf Negativproben**. Die vorhandene Wiederholbarkeit und die getrennte Behandlung von Firmenneustarts bleiben erhalten.

**Grenze:** Ein Feldkauf ist ein Geldabfluss, aber kein automatisch bewerteter Vermögensverlust; Lager, Anlagen, Abschreibung, offene Rechnungen und die zeitliche Zuordnung von Kosten fehlen weiterhin. Die Restkategorien sind keine geprüften betrieblichen Aufwendungen. Aus diesen Zahlen darf **weder buchhalterischer Gewinn noch Gesamtvermögen** abgeleitet werden. Historische C64-Regeln sind weiterhin nicht verifiziert.

**Prüfweg:** `node --check project-c/pppoppi-imperium/quality_v194/test_ai_cashflow_audit_v194.cjs` und anschließend das Programm; die GitHub-CI fordert jetzt mindestens 120 Erlösabgleiche, fünf Negativproben und die vollständige Kategorie-Zusammenfassung. **Status auf neuem HEAD: PENDING**, bis der Lauf tatsächlich abgeschlossen ist. BAL-01, WIR-01 und WIR-04 bleiben BLOCKED; 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.

**Nächste drei Schritte:** (1) GitHub-CI und die real vorkommenden Buchungscodes prüfen, Abweichungen korrigieren; (2) Restkategorien fachlich auflösen und Forderungen, Lager sowie Anlagewerte mit nachgewiesenen Bewertungsregeln verknüpfen; (3) danach eine echte Gewinn-/Vermögensrechnung mit Grenz- und Negativtests entwickeln. Persönliche Endabnahme erst am eingefrorenen Kandidaten, kein Merge/Release.
