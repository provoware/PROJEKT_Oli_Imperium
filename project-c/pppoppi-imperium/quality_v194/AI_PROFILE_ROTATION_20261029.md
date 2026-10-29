# BAL-01 – Kontrollierter KI-Profiltausch (29.10.2026)

**Ziel:** Den auffälligen Baseline-Befund aus PR #135 (identische Wirtschaftsergebnisse trotz unterschiedlicher Startkennungen) weiter untersuchen, ohne die 110 geschützten Originaldateien oder die Spielregeln zu ändern.

## Methode und Abgrenzung

Der neue Test `test_ai_profile_rotation_v194.cjs` lädt die unveränderte V1.9.2-Strategie-KI ausschließlich im Arbeitsspeicher und ersetzt dort für den Versuch die Zuordnung von **drei bestehenden Strategieprofilen** zu A1/A2/A3. Die Originaldatei `SPIEL/src/strategy_ai_v192.js` bleibt unangetastet. Der Test bricht ab, falls die erwartete Quellstelle nicht mehr exakt vorhanden ist.

- **Drei Zuordnungen:** Original (A1 vorsichtig, A2 wachstumsorientiert, A3 handelsorientiert); einmal und zweimal zyklisch getauscht.
- **Zwei gleiche Ausgangsszenarien je Zuordnung:** aktiver, fest vorgegebener Mensch bei Normalmarkt und bei niedrigen Preisen.
- **36 Monate je Lauf, jeder Lauf exakt wiederholt:** sechs Kombinationen × zwei Wiederholungen = zwölf Läufe / 432 Simulationsmonate.
- **Pro fester Firmen-ID:** Veränderung Kasse minus Schulden, Schlusskasse, Höchstschulden, größter Rückgang, Feldbesitz, Sanierungen und tatsächlich ausgeführte KI-Aktionen.
- **Vergleich:** zwölf Differenzen innerhalb derselben Firmen-ID zwischen Originalprofil und zugeteiltem Gegenprofil. Der Test prüft auch, dass die Profile wirklich wechseln, die Ergebnisse wiederholbar sind und nach dem Versuch die ursprüngliche KI wieder aktiv ist.

**Wichtige Grenze:** Die Logistik-KI verwendet weiterhin eigene, **fest an Firmen-IDs gebundene Liquiditätsreserven**. Der Versuch isoliert daher nur die strategische Profilzuordnung unter ansonsten gleichen Firmen-IDs und Zugreihenfolgen. Er ist **kein vollständiger kausaler Vergleich aller KI-Eigenschaften**. Änderungen der Konkurrenzreaktionen sind mögliche Wirkungen des Profiltauschs. Die Veränderung von Kasse minus Schulden ist **kein Gewinn**, da Felder, Vorräte und weitere Vermögenswerte fehlen. Der feste Mensch ist kein repräsentativer menschlicher Spieler.

## Prüfen

```bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_profile_rotation_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_profile_rotation_v194.cjs > ai_profile_rotation.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
```

Die GitHub-Prüfung führt außerdem die bestehende KI-Baseline und deren Rechentests aus; die JSON-Dateien werden als CI-Artefakte gesichert. **Ergebnisse dürfen erst nach tatsächlichem CI-Lauf auf dem endgültigen HEAD als PASS gelten.** Der neue Profilvergleich ändert keinen Status in der Vorrelease-Pflichtmatrix; `BAL-01` bleibt **BLOCKED**.

## Abhängigkeiten und weitere Pflichtarbeit

1. Zahlen aus dem endgültigen GitHub-Lauf je Firmen-ID auswerten: Wie stark ändern sich Kasse, Felder und Risiko beim Profiltausch?
2. Danach Logistikreserven ebenfalls kontrolliert permutieren oder in einem separaten Vergleich neutralisieren; dabei die ursprüngliche Logik als unveränderte Kontrollgruppe behalten.
3. Erst nach Vermögens-/Gewinnkennzahlen und zusätzlichen Schulden-/Sanierungsfällen eine gezielte KI-Optimierung prüfen. Ressourcenrechte und historische C64-Verifikation bleiben unabhängig offen.

**Keine Änderung an `main`, kein Merge, kein Release.** Persönliche Sicht- und Kubuntu-Endabnahme erst nach vollständigen technischen Pflichtprüfungen und eingefrorenem Kandidaten.
