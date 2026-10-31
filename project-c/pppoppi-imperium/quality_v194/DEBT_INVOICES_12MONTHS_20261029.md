# WIR-04 – Zins, Tilgung und Rechnungsrundlauf über zwölf Monate (29.10.2026)

**Projekt:** PPPOPPI IMPERIUM, eigenständige Berliner Adaption; keine Aussage über C64-Originalregeln.

## Basis und Abgrenzung

- GitHub-`main` bei Vorprüfung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Basis: [Entwurfs-PR #130](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/130), `f260bd47619626ea03eab691cc7f717bf920811c`.
- Vorheriger Stand: GitHub-CI des 42-teiligen Geldgrenzentests auf #130 PASS; [Browser-Gesamtregression](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40836498768) inzwischen erfolgreich abgeschlossen; integriertes Vorrelease-Gate bleibt wegen offener Pflichten gesperrt.
- **Kein Eingriff** in die 110 inventarisierten geschützten Originalquellen, keine Änderung von Geldregeln oder bestehenden Spielständen.

## Neu geprüfter Pflichtteil

`quality_v194/test_debt_invoice_12months_v194.cjs` nutzt die tatsächlichen Funktionen `fresh`, `validate`, `transition` und `pending` des unveränderten V0.8.2-Wirtschaftskerns.

- Zwei menschliche Firmen, 12 aufeinanderfolgende echte Monatsabschlüsse, Ausgangsschulden 400 Mio. und 200 Mio. Cent, ausreichende Liquidität.
- Mehrere Alt-Rechnungen mit Prioritäten 1/2/3, teilweise bezahlter Zins und offener Alttilgung.
- Unabhängige Ganzzahlberechnung mit `BigInt` als Rundungs-Orakel für 1 % Zins und 5 % Tilgung je Monat.
- Je Firma und Monat: neue Zins-, Tilgungs- und Lohnrechnung genau einmal; vollständig bezahlte Rechnungen; Kassenabgleich aller Buchungen; Schuldenabgleich ausschließlich gegen Tilgungsbuchungen.
- Eindeutige Befehlskennungen, Duplikatschutz, zwölf JSON-Export-/Import-Rundläufe, 12 Monatsberichte.

**Grenze:** Kein Browser-Dateidialog, kein Prozessneustart, keine aktive Förderung, kein Vertrag, keine KI und kein vollständiger wirtschaftlicher Spielverlauf. Das ist ein deterministischer Abrechnungsteilnachweis, keine Vorrelease-Freigabe.

## Reproduzierbarkeit und Prüfkriterien

```bash
node project-c/pppoppi-imperium/quality_v194/test_debt_invoice_12months_v194.cjs
```

GitHub-Workflow: `.github/workflows/prerelease-debt-invoices.yml`, Node 22 auf Ubuntu 24.04. **Tatsächlich ausgeführt:** [GitHub-Actions-Lauf #40843890616](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40843890616) auf Implementierungs-HEAD `31b9670ec67fc272b943220ea765c0c0a8838a30`: **PASS, 122/122 protokollierte Einzelprüfungen, 0 FAIL**; Job `debt-invoices`, Node 22, Ubuntu 24.04. Der abschließende Dokumentationscommit ändert weder Test noch Engine. Unabhängige Vorrelease-Sperre [#40843890341](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40843890341) **FAIL/BLOCKED erwartungsgemäß**, weil weitere Pflichtnachweise fehlen.

## Offene Arbeit und Freigabe

WIR-04 bleibt **BLOCKED**: Browser-Kampagne mit echter Wirtschaftsaktivität und Neustarts, fehlerhafte Rechnungen und sehr große Grenzbeträge, Ressourcenrechte für 77 ausgeschlossene Archivdateien, historische C64-Referenz und weitere Release-Pflichten. Matrix unverändert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**.

**Nächste Schritte:** (1) neuen Node-CI-Lauf und Quellschutz prüfen; (2) vollständige Wirtschaftspartie mit Rechnungs- und Speicherunterbrechungen testen; (3) unabhängige Rechte-/Referenznachweise nachführen. Persönliche Endabnahme erst nach allen technischen Gates und eingefrorenem Kandidaten. Kein Merge, kein Release.
