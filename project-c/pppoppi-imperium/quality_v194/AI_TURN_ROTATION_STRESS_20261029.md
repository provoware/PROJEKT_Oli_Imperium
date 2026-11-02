# BAL-01 – KI-Zugrotation: zwei zusätzliche Marktsituationen (29.10.2026)

## Zweck und verbindlicher Ausgangsstand

Im bestehenden [Entwurfs-PR #137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137) wurde die monatliche KI-Zugrotation bisher bei aktivem menschlichem Spieler und Normal-/Niedrigpreismarkt geprüft. Dort verbesserten 12/12 Varianten die gemeinsamen Feld- und Liquiditätskennzahlen gegenüber festen Zugfolgen. **Die Übertragbarkeit auf andere Marktsituationen war damit nicht nachgewiesen.**

Vor diesem Paket: Entwicklungs-HEAD `dbd31046de3a7b1748b568405e45ba358c91324b`, unveränderter main-HEAD `d3dc371154cc1089e06f34d0dc4ff04047132360`. Auf dem vorherigen Entwicklungs-HEAD waren acht Fach-/Browser-Workflows erfolgreich; die integrierte Vorrelease-Sperre war wegen offener Pflichten erwartungsgemäß nicht grün. Kein Spielkern, keine 110 geschützten Quelldateien und keine historischen C64-Regeln werden geändert.

## Neues zusammenhängendes Prüf-Paket

- `test_ai_turn_rotation_stress_v194.cjs`: dieselbe vorhandene V1.9.3-Engine und der bestehende isolierte Rotationsadapter, nun in **passive_normal** (passiver menschlicher Spieler) und **active_low_demand** (45 % der normalen Nachfrage).
- Je Markt: drei Startpositionen × feste Reihenfolge sowie zwei monatliche Drehrichtungen; alle 18 Konfigurationen werden exakt wiederholt, plus zwei uninstrumentierte Kontrollen. **38 vollständige Kampagnen × 36 Monate = 1.368 Spielmonate**.
- Strikte Gleichheit wiederholter Zustände, Kontrollparität mit Originalreihenfolge, Validierung der Engine-Zustände nach Monatswechsel und Rückbau aller temporären Adapter. 12 Gesamtvergleiche, 36 firmenbezogene Differenzen.
- Erfasst werden Feldzahl, Firmen ohne Feld, liquide Nettoposition, Schulden und Sanierungen. **Keine vorweggenommene Behauptung**, dass die Rotation auch hier besser ist.
- Der GitHub-Prüfablauf kontrolliert Syntax, vollständige Simulationszahl, Ergebnisstruktur und speichert `ai_turn_rotation_stress.json` im Artefakt `ai-strategy-baseline`.

## Reproduzierbarkeit und Status

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_stress_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_stress_v194.cjs > ai_turn_rotation_stress.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

**Status bei Erstellung: PENDING.** Erst tatsächliche GitHub-CI auf dem endgültigen HEAD und die dort erzeugten Messwerte erlauben einen PASS-Befund. `BAL-01` bleibt **BLOCKED**. Der bestehende Matrixnenner bleibt **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**.

## Interpretationsgrenzen

Die zwei zusätzlichen deterministischen Szenarien sind keine unabhängige Zufallsstichprobe. Strategische und logistische Reihenfolge werden gleichzeitig gedreht; der Mensch spielt stets zuerst. Kasse minus Schulden ist kein buchhalterischer Gewinn, da Vermögenswerte und Produktionsbestände fehlen. Ein grüner Test bedeutet ausschließlich technische Reproduzierbarkeit und Konsistenz, keine bestätigte Spielbalance, C64-Originaltreue, Rechtefreigabe oder Release-Erlaubnis.

## Drei nächste Pflichtschritte

1. Tatsächliche GitHub-CI einschließlich Browserregression und Quellschutz auf dem endgültigen HEAD prüfen; PASS/FAIL/BLOCKED und konkrete Messwerte nachtragen.
2. Bei nachgewiesener Robustheit unter weiteren Schulden-/Sanierungsfällen testen und Vermögens-/Gewinnkennzahlen mit expliziter Bewertungsgrundlage ergänzen; erst danach einen möglichen Eingriff in die KI-Zugfolge bewerten.
3. Unabhängig die 77 ausgeschlossenen Archivdateien auf Herkunft/Rechte/Notwendigkeit prüfen und eine rechtmäßig nutzbare C64-PAL-Referenz mit Prüfsumme dokumentieren. Persönliche Sicht- und Kubuntu-Abnahme erst am eingefrorenen Kandidaten.

**Empfehlung:** Gegenversuche auswerten, bevor die Spielmechanik verändert wird. Kein Merge, kein Release.
