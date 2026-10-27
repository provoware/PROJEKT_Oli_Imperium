# Projekt C – neun Feldparameter im echten Browser durchspielen

**Stand:** 27.10.2026 · **Basis:** [Entwurfs-PR #87](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/87), HEAD `c203c176e49735a82e44290ae553912b75ce8cae`. **main:** `d3dc371154cc1089e06f34d0dc4ff04047132360` (bei Beginn). **Status:** technischer Teilnachweis, kein Vorrelease.

## Problem und konkrete Umsetzung

Die bisherige Dialog-Aktionsmatrix prüfte pro Szene nur einen Vertreter je Aktionskennung. Sie belegte nicht, dass alle **neun unterschiedlichen Claims** in den drei Regionen korrekt adressiert und abgerechnet werden. Der neue Test `quality_v194/test_browser_claim_parameters_v194.py` startet deshalb je Claim und Zoomstufe eine frische, manifestgeprüfte Offline-Partie. Die Feldwahl erfolgt über das echte HTML-Auswahlfeld, jede Wirtschaftsaktion über **Tab und Enter**.

Bei **800×600 Ausgangsfenster** und echtem Chromium-Tab-Zoom von **175 % und 200 %** werden für jedes Feld zehn Aktionen geprüft: BUY vor Gutachten (Ablehnung), SURVEY (Erfolg und Wiederholungsablehnung), BUY (Erfolg und Doppelkaufablehnung), DRILL, PUMP, SHIP, OFFER und wiederholtes OFFER (Ablehnung). Für Erfolge werden Spieltage, regionsabhängige Kosten, Buchungscode, Feldbesitz, Reserven, Fördermenge, Lager und Angebotszustand gegen die vorhandenen Kernkonstanten geprüft. Bei Ablehnungen muss der gesamte Spielstand identisch bleiben; andere Claims dürfen nie mitverändert werden. Hinzu kommen echte Fokus-/Klickprüfungen, Zustandsvalidierung, Laufzeitfehler und Offlinebetrieb.

**Sollumfang:** 9 Claims × 2 Zoomstufen = 18 isolierte Fälle; 180 Tastaturaktionen, davon 108 erwartete Erfolge und 72 erwartete Ablehnungen. **Diese Zahlen sind Testanforderungen, keine vorweggenommenen PASS-Ergebnisse.**

## Reproduzierbarer Test

```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_claim_parameters_v194.py
```

Die CI-Prüfung ist in `.github/workflows/prerelease-browser-project-c.yml` ergänzt. Tatsächliche Ergebnisse und den geprüften HEAD bitte am zugehörigen PR und den dort verlinkten GitHub-Actions-Läufen ablesen. Das harte Gesamtgate bleibt **BLOCKED**; die Pflichtmatrix bleibt **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**.

## Grenzen und nächste Pflichtarbeiten

1. Neue CI tatsächlich ausführen und mögliche Fehler beheben; Parameterfolgen nur bei grünem Browserlauf als technischen Teilnachweis werten.
2. Weitere dynamische Aktionszustände und Regionen (Verträge, Raffinerie, Transportnetze, Sanierung, Minispiele) mit unabhängigen fachlichen Sollfolgen absichern.
3. Endregelvertrag der eigenständigen Adaption verbindlich festlegen; danach natürliche vollständige Sieg-/Niederlagenpartien mit Export, Neustart und Import prüfen.

**Weiterführende Empfehlung:** Je Aktionsfamilie eine kleine, versionierte Sollzustands-Tabelle aufbauen, damit ein gültiger Spielstand nicht mit einem fachlich richtigen Ergebnis verwechselt wird.

**Schutz:** Keine der 110 manifestgeschützten Originaldateien geändert. Kein Merge, kein Release, keine vorgezogene persönliche Abnahme.