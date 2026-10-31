# WIR-03 – Marktallokation und Negativproben (30.10.2026)

**Status: Fachprüfung PASS auf `29c7d6daadc5a3b535020055a3d755898c06bc3e`; neuere Entwicklungs-HEADs gesondert prüfen. Vorrelease: BLOCKED.**
Entwicklungszweig: `automation/v194-ai-logistics-reserve-20261029-1530`, [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137).
`main`, Spielkern und geschützte Originaldateien werden nicht verändert.

## Ausgangslücke und Ziel
Der vorhandene unabhängige Dreimonatsprüfer bestätigte zuvor lediglich, dass die beiden Verkäufe die gemeldete Nachfrage nicht überschritten. Er erkannte deshalb nicht zuverlässig, wenn ein Marktbericht bei sonst unveränderten Beständen eine zu geringe Gesamtzuteilung oder ungültige negative beziehungsweise gebrochene Mengen enthielt.

## Konkrete Änderung
`test_multimonth_competition_v194.cjs` prüft zusätzlich für jeden der drei Monate:
- Nachfrage, zugeteilte Mengen, Reserven, Lager und vorbereitete Mengen sind nichtnegative sichere ganze Zahlen (Millibarrel).
- Die Summe der tatsächlichen Zuteilungen entspricht exakt `min(Summe der angebotenen Mengen, gemeldete Nachfrage)`.
- Je Monat vier weitere bewusst verfälschte **Kopien**: Nachfrage auf null, gebrochene Nachfrage, negative Zuteilung und gebrochene Zuteilung. Der unabhängige Prüfer muss alle vier zurückweisen.

Bestehende sechs Negativproben je Firma/Monat bleiben erhalten. Damit sind es **48 absichtliche Verfälschungen pro Dreimonatsdurchlauf** und **96 über zwei reproduzierte Durchläufe**. Weiterhin: sechs simulierte Monate, zwölf Firmen-Monatskontrollen, zwölf Duplikatkontrollen und zehn JSON-Rundläufe. Die neuen Zahlen sind **Sollwerte**, kein bestandener Test, bevor CI erfolgreich ist.

## Nachweis und Grenzen
```bash
node --check project-c/pppoppi-imperium/quality_v194/test_multimonth_competition_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_multimonth_competition_v194.cjs
```

Der bestehende GitHub-Prüfablauf `prerelease-natural-oil-export.yml` führt den Test aus. Vorheriger Stand `7cc88576a65f012ee37e5e6a7e939cf58ced9049`: [Fachprüfung PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41091340639), [Browserprüfung PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41091341041), [KI-Prüfung PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41091340867). Diese Nachweise gelten **nicht** automatisch für die neuen Änderungen.

Die Prüfung deckt ausschließlich zwei menschliche Firmen und zwei Berliner Felder über drei Monate ab. Sie ersetzt weder unabhängige historische Nachfragebelege noch die Gewinn-/Anlagenbewertung, Mehrfirmen-Raffinerie-/Frachtkette, Browser-Dateiimport, vollständige Endpartie oder Rechteklärung.

## Nächste Schritte
1. GitHub-CI auf **endgültigem** Dokumentations-HEAD kontrollieren und Fehler bei Bedarf korrigieren.
2. Unabhängige Mehrfirmen-Raffinerie-/Frachtkette über mehrere Monate prüfen.
3. Gewinn-/Vermögensbewertung getrennt und mit eindeutigen Bilanzannahmen spezifizieren.

**Keine Änderung des Freigabestatus, kein Merge, kein Release und keine vorgezogene persönliche Abnahme.**

## GitHub-Nachprüfung des 96er-Testpakets

Auf dem tatsächlichen Commit `29c7d6daadc5a3b535020055a3d755898c06bc3e` wurde die [gezielte Fachprüfung #41100643940](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41100643940) erfolgreich abgeschlossen (**PASS**). Ebenfalls PASS: [Offline-Browser #41100642984](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41100642984), [KI-Kennzahlen #41100642988](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41100642988) und [Quellschutz #41100643072](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41100643072). Die [integrierte Freigabesperre #41100643012](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41100643012) bleibt wegen offener Pflichten korrekt **FAIL/BLOCKED**.

Die anschließend ergänzten 40 Fremdaktionsprüfungen besitzen einen **neuen** Test-HEAD und erben diese erfolgreichen Ergebnisse nicht. Deren CI muss eigenständig auf dem endgültigen Commit abgeschlossen werden.
