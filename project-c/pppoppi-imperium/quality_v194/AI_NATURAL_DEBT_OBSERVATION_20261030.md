# BAL-01 / WIR-04 – Natürliche KI-Schuldenentwicklung über 48 Monate (30.10.2026)

## Zweck und Grenzen

Die bisherigen [Einmonats-](AI_DEBT_RESCUE_STRESS_20261030.md), [Dreimonats-](AI_MULTIMONTH_RESCUE_20261030.md) und [Ölfeld-Insolvenzprüfungen](AI_OWNED_CLAIM_INSOLVENCY_20261030.md) erzwingen Schuldenkrisen mit ausdrücklich synthetischen Geldwerten. Dieser neue, unabhängige **Beobachtungstest verändert dagegen weder Kasse noch Schulden noch Marktnachfrage**: Er startet reguläre Engine-Partien und beobachtet die wirtschaftliche Entwicklung über 48 echte Monatsabschlüsse.

## Prüfumfang

- Zwei Ausgangskonfigurationen: ein passiver Mensch mit zwei beziehungsweise drei KI-Firmen; jede Konfiguration zweimal deterministisch wiederholt.
- **Vier vollständige 48-Monats-Läufe = 192 simulierte Monate**, jeweils mit echten `OliV082.transition()`-Monatswechseln.
- Nach jedem Monatsabschluss: gültiger Engine-Zustand, Monatsbericht, sicher darstellbare Kassen-/Schuldenwerte, unbezahlte Rechnungen, KI-Generationen, Rettungszähler und Ölfeldbesitz.
- Für **tatsächlich auftretende** KI-Neustarts: höchstens einer pro Firma/Monat, übereinstimmender Generations-/Rettungszähler, keine verbliebenen Schulden, Rechnungen oder Ölfelder nach Neustart.
- Nach jedem Monatsabschluss: doppelte Vorgangskennung wird abgewiesen, JSON-Wiederherstellung bleibt identisch, nächster Monat setzt korrekt fort; Eingabezustände bleiben unverändert.
- Beobachtete KI-Neustarts, Schuldenmonate, Maximalschulden, Feldbesitz und menschliche Neustarts werden als JSON-Artefakt ausgegeben.

**Wichtige Aussagegrenze:** Falls keine KI auf natürliche Weise insolvent wird, ist der Test trotzdem als Beobachtungs-/Regressionsprüfung aussagekräftig, aber **kein bestandener natürlicher Insolvenztest**. Es wird bewusst keine Insolvenz vorgetäuscht und keine Mindestzahl erfunden. Die beiden Konfigurationen sind keine repräsentative Stichprobe; Gewinn, Feldwert und C64-Originaltreue werden nicht ermittelt.

## Reproduzierbarer Test

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_natural_debt_observation_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_natural_debt_observation_v194.cjs
```

GitHub: [KI-Strategie-Prüfung](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-ai-strategy-metrics.yml). Nachweisdatei im Workflow-Artefakt: `ai_natural_debt_observation.json`.

**Status bei Einreichung: PENDING** – Test und GitHub-CI auf endgültigem HEAD noch nicht erfolgreich nachgewiesen. Letzter bestätigter Vorläufer: [KI-CI #40998243237](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40998243237) PASS auf `dbd3910f753ddd1b5d319da56c49c5f20fc7aad3`, ebenso [Browser #40998243252](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40998243252) und [Quellschutz #40998243267](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40998243267). [Gesamtfreigabe #40998243213](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40998243213) erwartungsgemäß FAIL/BLOCKED.

## Weiter offen / nächste drei Schritte

1. Tatsächlichen neuen GitHub-CI-Lauf und JSON-Artefakt prüfen; bei Fehlern Ursache im Test oder in der Engine unterscheiden.
2. Aus real beobachteten Schuldentrends gezielt zusätzliche Krisenszenarien und lange Rettungs-/Besitzfolgen ableiten, ohne künstliche Fälle als natürliche Ereignisse auszugeben.
3. Gewinn-/Vermögensbewertung sowie sporadischen Browser-Dateidialog weiter bearbeiten; Rechte der 77 Archivdateien und historische C64-Referenz gesondert klären.

**BAL-01 und WIR-04 bleiben BLOCKED.** 110 Originaldateien und `main` unverändert. Kein Merge, kein Release und keine persönliche Endabnahme vor Abschluss der technischen Pflichten.
