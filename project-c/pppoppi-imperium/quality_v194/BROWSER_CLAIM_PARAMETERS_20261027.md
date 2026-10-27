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


## CI-Abschluss des Parameterpakets (geprüft am 27.10.2026)

Der vormals ausstehende Diagnose-Lauf ist **PASS**: [Chromium #40526236853](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40526236853) auf HEAD `8114ce388e3b309581f96aa14138710bf2ab8bef`. Das echte CI-Protokoll meldet **18 Feld-/Zoom-Fälle, 180 per Tastatur aktivierte Wirtschaftsaktionen, davon 108 erwartete Erfolge und 72 zustandsneutrale Ablehnungen**. Auch Brandenburg-2/3 wurden bei beiden Zoomstufen erfolgreich durchlaufen. [Quellprüfung #40526236990 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40526236990); [Gesamtgate #40526237014 – BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40526237014). Die vorherigen Fehlversuche bleiben als Diagnosehistorie nachvollziehbar; das ist kein Nachweis für historische Originaltreue.

## Folgepaket: Feldketten nach Export und Reimport absichern

Auf dem separaten Folge-Zweig `automation/prerelease-claim-save-roundtrip-20261027-1638` erweitert derselbe Browser-Test jeden der 18 Fälle um einen **echten Spielstandexport per Tab/Enter**, das Schließen des ursprünglichen Tabs, einen frischen Spiel-Tab mit echtem Zoom, einen Dateiimport und einen exakten Vergleich aller Felder, Firmen, Buchungen und Spielphasen. Der Dateiauswahldialog wird bewusst per Playwright mit JSON beliefert und **nicht** als Tastaturaktion behauptet. Vor und nach dem Import werden gültiger Zustand, externe Netzwerkanfragen und Laufzeitfehler kontrolliert.

**Sollumfang:** 18 Export-/Import-Rundläufe zusätzlich zu den 180 Wirtschaftsaktionen. **Status dieses Folgepakets: PASS auf geprüftem Code-HEAD `5fb28d930a9e3771d5f84809c12a4921fa0a1656`.** [Chromium #40533304063 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40533304063): 18 von 18 echten Export-/Import-Rundläufen, 180 Wirtschaftsaktionen (108 Erfolge, 72 korrekte Ablehnungen), keine Laufzeitfehler oder externen HTTP-Anfragen. [Quellprüfung #40533303768 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40533303768); [Vorrelease-Gesamtgate #40533303989 – BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40533303989). Die reine Dokumentationsfortschreibung muss auf ihrem eigenen neuen HEAD erneut geprüft werden. Teilnachweis: `prerelease/evidence/SPE-01-CLAIM-ROUNDTRIP-PARTIAL-20261027.json`; `SPE-01` bleibt BLOCKED, ebenso die gesamte Vorrelease-Freigabe. Ein neuer Tab ersetzt keinen vollständigen Browser-Profil-Neustart; weitere Spielphasen, historische Regeln und persönliche Endabnahme sind ausdrücklich nicht durch diesen Teiltest freigegeben.

## Grenzen und nächste Pflichtarbeiten

1. Neue CI tatsächlich ausführen und mögliche Fehler beheben; Parameterfolgen nur bei grünem Browserlauf als technischen Teilnachweis werten.
2. Weitere dynamische Aktionszustände und Regionen (Verträge, Raffinerie, Transportnetze, Sanierung, Minispiele) mit unabhängigen fachlichen Sollfolgen absichern.
3. Endregelvertrag der eigenständigen Adaption verbindlich festlegen; danach natürliche vollständige Sieg-/Niederlagenpartien mit Export, Neustart und Import prüfen.

**Weiterführende Empfehlung:** Je Aktionsfamilie eine kleine, versionierte Sollzustands-Tabelle aufbauen, damit ein gültiger Spielstand nicht mit einem fachlich richtigen Ergebnis verwechselt wird.

**Schutz:** Keine der 110 manifestgeschützten Originaldateien geändert. Kein Merge, kein Release, keine vorgezogene persönliche Abnahme.