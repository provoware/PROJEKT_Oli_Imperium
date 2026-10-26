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
- **Chromium-Workflow [#40413530587](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40413530587): PASS** auf Implementierungs-HEAD `d4550b598ccd930beb06d7d784582d6e6949a779`. In jeder der 39 Szenen waren je **463/463** sichtbare aktivierte Dialogelemente per Tab erreichbar, mit `:focus-visible`, berechnetem Umriss/Schatten und einem nichtleeren Beschriftungshinweis (insgesamt **926 Prüfpunkte**, aber nicht 926 unterschiedliche Funktionen). Keine JavaScript-Fehler, keine externen Anfragen und keine Veränderung des Spielstands. **Quellprüfung [#40413530363](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40413530363): PASS.** Die [technische Gesamtmatrix #40413530386](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40413530386) bleibt wie vorgesehen BLOCKED.
- Matrix bleibt unverändert bei **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**. Kein Merge, kein Release, keine persönliche Endabnahme.

## Drei nächste Schritte
1. Aktionen in den Dialogen mit echten Tab-/Enter-Eingaben samt Spielstands- und Fehlerschutz prüfen.
2. Nativen Browserzoom bei 175–200 % getrennt von CSS-Viewport-Simulationen reproduzierbar prüfen.
3. Fokuskontrast gegenüber den tatsächlichen Hintergründen und Zustandswechsel nach Minispielen untersuchen.

**Empfehlung:** Da keine fehlenden Tab-Ziele oder Beschriftungshinweise im untersuchten Grundzustand gefunden wurden, nicht blind umbauen. Stattdessen die bislang ungetesteten aktiven Dialogaktionen und tatsächliche Kontrastwerte priorisieren.
