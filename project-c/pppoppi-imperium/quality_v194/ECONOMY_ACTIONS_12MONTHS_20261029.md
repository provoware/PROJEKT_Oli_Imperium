# WIR-04 / LOG-02 / LOG-03 – reale Wirtschaftsaktionen über zwölf Monate (29.10.2026)

**Projekt:** PPPOPPI IMPERIUM, eigenständige Berliner Spielmechanik; kein Nachweis historischer C64-Regeln.

## Ausgangsbasis und Sicherheit

- GitHub-`main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Basis: [Entwurfs-PR #131](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/131), `87ec38a9484a3bcdf60e3b56735edf90e22fff68`.
- Neuer [Entwurfs-PR #132](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/132) mit separatem Test und GitHub-Workflow.
- Die 110 geschützten Originalquellen und Spielregeln bleiben unangetastet. Keine bestehenden Spielstände überschrieben.

## Tatsächlicher Teiltest

`quality_v194/test_economy_actions_12months_v194.cjs` ruft die vorhandene V0.8.2-Engine direkt auf, statt Buchungsergebnisse zu erfinden.

- Zwei menschliche Firmen, zwölf aufeinanderfolgende echte Monatsabrechnungen mit 400 bzw. 200 Millionen Cent Anfangsschulden und zwei Alt-Rechnungen.
- 129 tatsächliche Engine-Übergänge: SURVEY, BUY, DRILL, PUMP, SHIP, OFFER, SIGN, FIRE_EXPERT, END_TURN und NEXT_MONTH.
- Reale Feldkäufe, Förderung, Transporte, Marktangebote, Vertragsabschluss, termingerechte Erfüllung und drei Behandlungen periodischer Brände.
- Je Monat: Konten- und Tilgungsabgleich anhand neuer Buchungseinträge, vollständige Rechnungsbegleichung, eindeutige Monatsberichte, doppelte Abschlussanforderung ohne Wirkung und ein JSON-Spielstand-Rundlauf.
- Auch unverkäufliche Restbestände bei schwankender Marktnachfrage werden im nächsten Angebot berücksichtigt. Die erste Testfassung hatte dafür fälschlich exakt 100.000 Mengeneinheiten erwartet; dieser **Testfehler** wurde vor der Freigabe korrigiert.

## Reproduktion

```bash
node project-c/pppoppi-imperium/quality_v194/test_economy_actions_12months_v194.cjs
```

Separater GitHub-Workflow: `.github/workflows/prerelease-economy-actions.yml`, Node 22, Ubuntu 24.04.

**Isolierter JavaScript-Vorcheck auf Implementierungs-HEAD `f6924c9965f3f7669034d4e073300a6cab9cff47`: 76/76 Prüfausgaben PASS, 129 Übergänge, 12 Monate, 12 JSON-Rundläufe, drei Brandbehandlungen.** Dieser Vorcheck verwendet eine isolierte CommonJS-Ladeumgebung mit Assertions und ersetzt nicht den echten Node-/GitHub-Lauf.

**GitHub-CI:** [Wirtschaftsaktionen #40851223794](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40851223794) auf Implementierungs-HEAD `f6924c9965f3f7669034d4e073300a6cab9cff47`: **PASS**, Job `economy-actions`, Node 22 auf Ubuntu 24.04, **76/76 protokollierte PASS-Prüfungen, 129 Engine-Übergänge, zwölf Monate, zwölf JSON-Rundläufe, drei Brandbehandlungen** (GitHub-Jobprotokoll geprüft). Der spätere Dokumentations-HEAD ändert weder Engine noch Test. Der erste Workflow-Lauf [#40851159142](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40851159142) scheiterte an der zu strengen Restbestandsannahme im Test; der Test wurde angepasst und im Vorcheck erneut bestanden.

## Nicht abgedeckt und nächster Schritt

- **Nicht getestet:** Browser-Dateidialog, echter Browserprozessneustart, Wiedereinlesen nach Prozessneustart, Wirtschaft mit KI-Firmen, vollständige Siege-/Verlustvarianten, historische C64-PAL-Originaltreue und Rechte für 77 ausgeschlossene Archivdateien.
- **Matrix:** unverändert **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**; WIR-04, LOG-02 und LOG-03 bleiben BLOCKED.
- **Nächste Implementierung:** dieselbe zwölfmonatige Wirtschaftspartie mit echten Chromium-Prozessneustarts, Browser-Export/Import und nachvollziehbarer Fortschreibung von Verträgen, Restmengen und Schulden; danach weitere Randfälle und vollständige fachliche Endpartien.
- Persönliche Sichtprüfung und Kubuntu-Endabnahme ausschließlich nach grünen technischen Pflichtgates und eingefrorenem Kandidaten. **Kein Merge, kein Release.**
