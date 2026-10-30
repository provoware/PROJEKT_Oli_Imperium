# BAL-01 / WIR-04 – Wiederholte KI-Sanierung über drei Monate (30.10.2026)

## Ziel und Abgrenzung

Die bisherige [Einmonatsprüfung](AI_DEBT_RESCUE_STRESS_20261030.md) deckt einen KI-Neustart und einen Rettungskredit ab. Dieser ergänzende Test prüft zwei aufeinanderfolgende Neustarts derselben KI-Firma mit tatsächlichen `OliV082.transition()`-Monatswechseln und einem dritten Monat ohne erneuten künstlichen Schock.

**Wichtig:** Die Schulden von A1 werden zu Beginn der Monate 1 und 2 jeweils gezielt auf 100.000.000 Cent und die Kasse auf 0 gesetzt. A2 beginnt nur in Monat 1 mit Kasse 0 und Schulden 0. Dies sind synthetische, ausdrücklich markierte Testzustände, keine natürlich entstandenen Wirtschaftskrisen oder echten Nutzer-Spielstände. Der V1.9.3-Spielkern und alle 110 geschützten Originaldateien bleiben unverändert.

## Prüfvertrag

- Ein Mensch (H1) und zwei KI-Firmen (A1, A2); drei echte Monatsabrechnungen pro Lauf, gesamtes Szenario zweimal identisch wiederholt.
- A1: Nach den künstlichen Krisen in Monat 1 und 2 jeweils automatischer Neustart; Generation 2, dann 3; Sanierungszähler und Neustartereignisse jeweils genau einmal erhöht; keine verbliebenen Rückstände oder Altschulden.
- Monat 3: Ohne neuen künstlichen Schuldenschock darf keine weitere A1-Sanierung auftreten.
- A2: In Monat 1 genau ein KI-Rettungskredit statt Neustart; Folgemonat setzt die monatliche Kreditsperre zurück. Der spätere A2-Wirtschaftsverlauf wird beobachtet, nicht als Gewinnnachweis ausgegeben.
- Nach jedem Monatsabschluss: genau ein Bericht pro Monat, keine offene menschliche Sanierungsabfrage, unveränderter Eingabezustand, gültige Engine-Zustände und JSON-Wiederherstellung.
- Wiederholte Vorgangskennung: exakt gleiche Ausgabe, keine Doppelbuchung; Folgemonat ohne zusätzlichen Monatsbericht.

## Reproduzierbare Prüfung

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_multimonth_rescue_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_multimonth_rescue_v194.cjs
```

GitHub-Ablauf: [KI-Strategie-Prüfung](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-ai-strategy-metrics.yml). JSON-Artefakt: `ai_multimonth_rescue.json`. **CI bei Erstellung: PENDING.** Nur ein erfolgreicher Lauf auf dem endgültigen HEAD belegt PASS. Das integrierte Vorrelease-Gate bleibt unabhängig davon BLOCKED.

Letzter bestätigter Vorläufer: [KI-CI #40986806834](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40986806834) PASS auf `dad3aa0104987380e235bfe8c2359d49f34dc44f`; [Browser-CI #40986806810](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40986806810) PASS; [Gesamtgate #40986806809](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40986806809) FAIL/BLOCKED.

## Weiterhin offen – drei nächste Schritte

1. Neue KI-CI einschließlich JSON-Ergebnis auf dem finalen HEAD auswerten, bei FAIL Testannahmen und Engine-Verhalten prüfen.
2. Echte, ohne Schuldeninjektion entstandene KI-Mehrmonatskrisen sowie Insolvenzen bei bereits vorhandenen Ölfeldern untersuchen.
3. Gewinn, Schulden und bewertbare Vermögenswerte sauber trennen; Urheberrechte der 77 ausgeschlossenen Archivdateien und C64-Originalreferenz weiterhin gesondert klären.

**WIR-04/BAL-01 bleiben BLOCKED. Kein Merge, kein Release, keine vorgezogene persönliche Abnahme.**
