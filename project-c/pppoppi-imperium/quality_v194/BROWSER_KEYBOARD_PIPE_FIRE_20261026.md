# Projekt C – Rohrnetz und Feuerwehr mit echten Tastaturaktionen (26.10.2026)

## Vorprüfung
- `main`: `d3dc371154cc1089e06f34d0dc4ff04047132360` (unverändert bei Start).
- Grundlage: [Entwurfs-PR #70](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/70), HEAD `0478dd988fd70ec4381994f3b2512ac4b106fda3`; neue Änderung ausschließlich auf eigenem, gestapeltem Zweig.
- Vorherige CI auf #70: [Chromium #40397545133](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40397545133) PASS; Quellprüfung #40397545106 PASS; Gesamtmatrix #40397545196 erwartungsgemäß BLOCKED.
- Andere offene PRs, insbesondere die unabhängige Dokumentations-PR #69, bleiben unangetastet. 110 durch Hashes geschützte Originaldateien werden weder überschrieben noch verändert.

## Ziel und Risiko
**BED-02**: die bisher fehlende echte Tastaturbedienung der Rohrnetz- und Feuerwehr-Minispiele nachweisen. **BAR-01**: Fokus sichtbar, aber Kontrast noch nicht vollständig bewiesen. **VER-03**: JSON-Export als Teilnachweis. Ein automatisierter Test darf nicht fälschlich den gesamten Freigabestatus ändern.

## Reproduzierbarer Testvertrag
`python3 project-c/pppoppi-imperium/quality_v194/test_browser_keyboard_pipe_fire_v194.py`

1. Temporären, hashgeprüften Offline-Aufbau starten. Zwei unabhängige Chromium-Kontexte bei 800×600 und CSS-Viewport 400×300 (kein nativer Browserzoom).
2. Spielstart, Gutachten, Kauf, Fachbohrung und Start des Rohrnetz-Minispiels per Tab/Enter. Szenenwahl über bestehende Navigations-API; keine simulierten Klicks.
3. Alle drei Rohrabschnitte: jedes relevante Rohrstück per Tab erreichen, Fokus kontrollieren, 90-Grad-Drehungen ausschließlich mit Enter; jede Drehung darf Spielzustand, Geld und Spieltage nicht verändern. Je Abschnitt Druckprüfung mit Tab/Enter und Spielkernvalidierung.
4. Drei reguläre Monatsabschlüsse und Folgemonate per Tab/Enter. Der dokumentierte periodische Brand im vierten Monat muss auf dem eigenen erschlossenen Feld auftreten; keine künstlich manipulierten Spielstände.
5. Feuerwehreinsatz mit Tab/Enter: zunächst absichtlich falsche Maßnahme (Fehlversuch ohne zusätzliche Startkosten), danach alle drei richtigen Maßnahmen; Brand gelöscht, Rohrnetz und Wirtschaftszustand gültig.
6. Dialog schließen, JSON-Export per Tab/Enter, exakte Spielstandgleichheit; JavaScript-Fehler und externe HTTP-Anfragen untersagen.
7. Test im bestehenden Chromium-Workflow zusätzlich zu sämtlichen bisherigen Browser-Regressionen ausführen. Die Gesamtmatrix bleibt bis zur vollständigen Freigabe rot.

## Nachweisstand
**PENDING:** Test und Workflow sind implementiert; ein tatsächliches PASS ist erst nach erfolgreicher GitHub-CI auf dem entsprechenden Commit nachgewiesen. Bei FAIL werden Test und gegebenenfalls unabhängige Fehler korrigiert; keine Scheinfreigabe.

**Unverändert:** 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED. Keine Benutzer-Sichtprüfung, keine Kubuntu-Endabnahme, kein Merge und kein Release.

## Drei nächste Schritte
1. Chromium-CI für den neuen Rohrnetz-/Feuerwehrtest prüfen, eventuelle Fehler korrigieren und echten CI-Link nachtragen.
2. BED-02-Teilnachweis samt tatsächlichem HEAD/CI ergänzen, übrige Dialogaktionen per Tastatur prüfen.
3. Nativen Browserzoom 175–200 % und Fokuskontrast separat nachweisen.

**Weiterführend:** Endzustands-Logik fachlich spezifizieren; ein 240-Monats-Lauf ohne Spielende ist kein Sieg-/Niederlagennachweis.
