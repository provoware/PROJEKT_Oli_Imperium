# BAL-01 / WIR-04 – Insolvenz einer KI mit zuvor erworbenen Ölfeldern (30.10.2026)

## Zweck und tatsächliche Grenzen

Nach dem erfolgreichen [Dreimonatstest](AI_MULTIMONTH_RESCUE_20261030.md) wird erstmals geprüft, ob eine KI-Firma bei einem **tatsächlichen, durch ihre regulären KI-Züge erworbenen Feldbestand** nach einem künstlich erzeugten Schuldenschock korrekt neu startet. Nur der finanzielle Schock ist synthetisch. Der Test verändert keine Originaldateien, keine Nutzerdaten und keine Spielregeln.

## Prüfvertrag

1. Eine reguläre Engine-Partie mit H1, A1 und A2 wird bis zum ersten von A1 tatsächlich erworbenen Ölfeld gespielt (höchstens 18 Monate); eine fehlende Erwerbung ist ein harter Testfehler.
2. Vor dem folgenden Monatsabschluss werden ausschließlich A1-Kasse (0 Cent) und A1-Schulden (100.000.000 Cent) im gültigen Testspielstand gesetzt.
3. Der echte Engine-Monatsabschluss muss genau einen A1-Neustart auslösen, alle A1-Felder auf den vollständigen freien Ursprungszustand zurücksetzen und fremde A2-Felder unangetastet lassen.
4. Schulden, Rückstände, Generationszähler und Ereigniszahl werden geprüft. Eine doppelte Vorgangskennung darf keine zweite Buchung auslösen.
5. JSON-Wiederherstellung, Folgemonat und vollständige Wiederholbarkeit werden geprüft. Auch ein eventuell erforderlicher menschlicher Rettungsdialog wird nur im Testzustand beendet.

## Nachprüfung

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_owned_claim_insolvency_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_owned_claim_insolvency_v194.cjs
```

GitHub: [KI-Strategie-Prüfablauf](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/workflows/prerelease-ai-strategy-metrics.yml), Artefakt `ai_owned_claim_insolvency.json`.

**Status bei Einreichung: PENDING.** Erst die erfolgreiche GitHub-CI auf dem endgültigen HEAD belegt diesen Teiltest. Der vorangegangene [Dreimonatstest #40992885263](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40992885263) ist inzwischen PASS; [Browser #40992885241](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40992885241) und [Quellschutz #40992885231](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40992885231) ebenfalls PASS. [Integrierte Freigabe #40992885250](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40992885250) bleibt erwartungsgemäß FAIL/BLOCKED.

## Weiter offen

Natürliche KI-Schuldenkrisen ohne finanzielle Injektion, Bilanzgewinn und Geldwert der Ölfelder, weitere Sanierungsrandfälle, sporadischer Browser-Dateidialog, Rechteklärung der 77 Archivdateien sowie der belegte C64-Originalvergleich. BAL-01 und WIR-04 bleiben BLOCKED. Kein Merge, kein Release und keine persönliche Endabnahme vor Abschluss der technischen Pflichten.
