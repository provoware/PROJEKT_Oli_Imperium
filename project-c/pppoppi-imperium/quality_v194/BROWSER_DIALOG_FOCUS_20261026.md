# Projekt C – Dialogfokus-Vollinventar (26.10.2026)

## Ziel und Abgrenzung
Die bisher geprüften 39 Szenenschließungen sowie Bohr-, Rohrnetz- und Feuerwehraktionen decken noch nicht alle Dialogelemente ab. Dieser zusätzliche Test zählt **alle sichtbaren und aktivierten Tab-Kandidaten** jeder registrierten Szene, prüft ihre tatsächliche Erreichbarkeit mit Tab, den Browserzustand `:focus-visible`, und diagnostiziert Umrisse, Schatten sowie fehlende Beschriftungen. Szenen werden nur zum Prüfen per bestehender Navigationsschnittstelle geöffnet; die Bedienelemente werden **nicht** ausgelöst. Damit werden keine Käufe oder Buchungen verändert.

## Reproduktion
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_dialog_focus_v194.py
```

Der Test baut die Offline-Vorschau aus 110 unveränderten, hashgeprüften Quelldateien in einem temporären Ordner und untersucht 800×600 und 400×300 CSS-Viewport. Er fordert mindestens 35 eindeutige Szenen, vollständige Tab-Reichweite, `:focus-visible`, unveränderte Spielstände, keine JavaScript-Fehler und keine externen Anfragen. Fokusumrisse und unbeschriftete Elemente werden als Diagnosen gemeldet. **400×300 CSS ist kein nativer 200-%-Browserzoom.** Visueller Kontrast, tatsächliche Aktionen innerhalb aller Szenen, Spielende und persönliche Abnahme bleiben gesperrt.

## Nachweisstand
- Vorprüfung: `main` bei `d3dc371154cc1089e06f34d0dc4ff04047132360`; gestapelte Grundlage [PR #71](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/71), HEAD `014a10c5a1d639f9dd7d4d51f12cc26a3ae2f369`.
- Neuer Test und Workflow: **IMPLEMENTIERT, CI-Nachweis noch offen**. Keine unbewiesene PASS-Aussage.
- Matrix bleibt unverändert bei **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**. Kein Merge, kein Release, keine persönliche Endabnahme.

## Drei nächste Schritte
1. Den neuen Chromium-Lauf auswerten; bei echten Tab-/Fokusfehlern gezielt reparieren und erneut prüfen.
2. Nach erfolgreichem Lauf die Teilnachweise für BED-02/BAR-01 mit konkretem Commit und CI-URL ergänzen; volle Gates nicht vorzeitig freigeben.
3. Nativen Browserzoom bei 175–200 % getrennt von CSS-Viewport-Simulationen prüfen und anschließend alle noch fehlenden Pflichtaktionen abdecken.

**Empfehlung:** Die diagnostizierten fehlenden Beschriftungen nach Wirkung priorisieren, statt alle Oberflächenelemente blind umzubauen.
