# BAL-01 / WIR-04 – KI-Schulden- und Sanierungsgrenze (30.10.2026)

## Nachweisziel

Der bestehende KI-Risikoabgleich kontrolliert Kasse minus Schulden, aber er
belegt nicht, wie die unveränderte Spiel-Engine bei akutem Geldmangel mit
automatischem Rettungskredit und Firmenneustart umgeht. Diese Lücke wird
mit einem **synthetischen, ausdrücklich markierten Testspielstand** geprüft,
ohne Spielerstände oder die 110 geschützten Originaldateien zu ändern.

## Reproduzierbare Szenarien

Ein echter Engine-Monatswechsel mit einem passiven menschlichen Spieler
und zwei KI-Firmen:

- **A1:** Startkasse 0 Cent, Schulden 100.000.000 Cent. Der
  erwartete Zahlungsrückstand übersteigt den einmaligen Rettungskredit;
  die Engine muss automatisch einen Neustart auslösen, Schulden und
  Rückstände zurücksetzen, Generation und Sanierungszähler erhöhen.
- **A2:** Startkasse 0 Cent, Schulden 0 Cent. Die fällige Lohnrechnung
  wird durch genau einen Rettungskredit bezahlt. Ein Neustart wäre falsch.
- Beide Ergebnisse müssen die interne Spielstandsprüfung bestehen.
  Dieselbe Vorgangskennung darf keine zweite Buchung auslösen.
  JSON-Speichern/Wiederherstellen und der Folgemonat müssen unverfälscht
  funktionieren. Das gesamte Szenario wird deterministisch wiederholt.

Der Test verwendet reale `OliV082.transition()`-Aufrufe und prüft
Monatsbericht, Zahlungsrückstände, Buchungsjournal, Ereignisse und
Generationen. Der Startzustand wird gezielt in gültigen Testkopien
angepasst; dies ist **kein natürlich entstandener 36-Monats-Krisenfall**.

## Ausführung und Nachweise

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_debt_rescue_stress_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_debt_rescue_stress_v194.cjs
```

GitHub-Prüfung: `.github/workflows/prerelease-ai-strategy-metrics.yml`.
Das JSON-Ergebnis `ai_debt_rescue_stress.json` wird als Prüfarbeitsprodukt
hochgeladen. **Status bei Erstellung: PENDING**, bis GitHub-CI den
finalen Entwicklungs-HEAD bestätigt. Ein späteres PASS gilt nur für
diesen begrenzten Test, nicht für die vollständige Vorrelease-Pflicht.

Vorangehender HEAD `d55964aff48aae9e12469b5002c9872ceb3763e2`:
[KI-CI #40980759635](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40980759635)
PASS, [Browser-CI #40980759564](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40980759564)
PASS, [Quellschutz #40980759613](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40980759613)
PASS; [Vorrelease-Gesamtgate #40980759648](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40980759648)
weiter FAIL/BLOCKED.

## Grenzen und nächste drei Pflichten

1. Die neue CI auf dem endgültigen HEAD auswerten und bei Fehlern
   den Test oder die zulässige Prüfschicht korrigieren.
2. Weitere unabhängige Krisenfälle: wiederholte KI-Sanierung, hohe
   Schulden über mehrere Monate, Insolvenz bei bestehenden Ölfeldern.
3. Gewinn und Vermögen getrennt von Liquidität definieren und
   überprüfen; Rechteprüfung der 77 Archivdateien und historische
   C64-Referenz bleiben eigenständige Sperren.

**BAL-01 und WIR-04 bleiben BLOCKED; keine Spielregeländerung,
kein Merge, kein Release, keine vorgezogene persönliche Abnahme.**
