# Browser-Mehrgenerationen-Sanierung – technischer Teilnachweis

**28.10.2026 · PPPOPPI IMPERIUM Projekt C · Vorrelease BLOCKED**

## Ausgangsbasis und Schutz

- Gestapelt auf [PR #105](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/105), Basis-HEAD `4a8fd93efc90d675a906092deea1198aea85d046`.
- [Entwurfs-PR #106](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/106) auf eigenem Zweig; `main` bei Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Nur neuer Browser-Regressionstest, eigenstaendiger fuenfter Browser-CI-Job, dieser Bericht, Teilbeleg und Matrixverweise. **110 geschuetzte Original-Spielquellen nicht veraendert.**
- Technische PPPOPPI-Adaption, keine Aussage ueber historische C64-Spielregeln.

## Tatsächlich ausgefuehrter Test

```sh
python3 project-c/pppoppi-imperium/quality_v194/test_browser_multigeneration_rescue_v194.py
```

1. Frische Offline-Partie mit **zwei Menschen und zwei KI-Firmen**; acht sichtbare H1-Wirtschaftsaktionen verbrauchen Geld und Spieltage.
2. Erster Monatsabschluss nach beiden menschlichen Zuegen: echte H1-Insolvenz mit 80.000 Cent Rueckstand; Sanierungsneustart zu Generation 2, beide H1-Felder frei.
3. JSON-Export; Chromium-Prozess vollstaendig beenden, in neuem Prozess importieren. **167 weitere echte Folgemonate** mit H1/H2-Spielerwechsel und monatlicher Abrechnung bis zur zweiten natuerlichen H1-Insolvenz.
4. Zweiter Export in der offenen Sanierung; neuer Chromium-Prozess und exakter Import, anschliessend H1-Neustart zu Generation 3.
5. Dritter Export/Import nach erneutem Chromium-Prozessneustart; Folgemonat ohne doppelte Sanierung, Berichtsbuchung oder doppelte Befehlskennung.
6. Endkontrollen: 800×600 ohne horizontalen Ueberlauf, keine externen HTTP-Anfragen, keine JavaScript-Laufzeitfehler.

**Wichtige technische Erkenntnis:** Die Engine behaelt absichtlich nur die **letzten 120 Monatsberichte**. Der Test prueft deshalb nach Monat 120 die Anzahl der `MONATSABSCHLUSS`-Ereignisse und den aktuellen Bericht, nicht einen unbeschraenkt wachsenden Berichtsspeicher.

## Fehlerbehandlung und CI-Nachweise

- Erste Testfassung: [Browser-CI #40657565416](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40657565416) **FAIL** wegen nicht vorhandenem UI-Modus `2-0`; korrigiert auf den tatsaechlich angebotenen Modus `2-2`.
- Zweite Testfassung: [Browser-CI #40657646837](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40657646837) **FAIL** an der 120er-Ringgrenze der Berichte; kein Spielkernfehler. Korrigiert auf Ereignis- und Berichtsinvarianten.
- Korrigierter Code-HEAD `b87ce84ee3f749c53cf6737e92cca156eed650b9`: [Browser-CI #40658275568](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40658275568) **PASS in allen fuenf Jobs**, einschliesslich des neuen Mehrgenerationen-Tests. [Quell-CI #40658275532](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40658275532) **PASS**. [Gesamtgate #40658275540](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40658275540) **FAIL/BLOCKED** wie vorgesehen, weil Release-Pflichten offen sind.
- Lokale Syntaxpruefung mit `python3 -m py_compile` **PASS**. Der echte Browserlauf erfolgte in GitHub Actions, nicht lokal in Kubuntu.
- [Maschinenlesbarer Teilbeleg](../prerelease/evidence/SPE-01-BROWSER-MULTIGEN-PARTIAL-20261028.json). Finale CI auf dem nachfolgenden Dokumentations-HEAD ist gesondert zu pruefen.

## Offene Pflichten und naechste drei Schritte

**Matrix unveraendert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.** `SPE-01`, `VER-02`, `VER-03`, `LOG-04`, `GRA-03` und `SIC-03` erhalten Teilbelege, **keine Freigabe**.

1. CI auf dem finalen Dokumentations-HEAD vollstaendig auswerten; Fehlversuche korrekt einordnen und korrigieren.
2. Den Endregelvertrag fuer die eigenstaendige PPPOPPI-Adaption (Laufzeit, Wertung, Gleichstand, Ausscheiden, Schema-Version) nachvollziehbar entscheiden und technisch spezifizieren, ohne unbelegte historische C64-Werte zu erfinden.
3. Danach vollstaendige Sieg-/Niederlagenpartien, Endstand-Export/Import, Neustarts und 800×600/Zoom/Tastatur in echten Browserlaeufen absichern.

**Kein Merge, kein Release. Persoenliche Sichtpruefung und Kubuntu-Endabnahme erst nach allen technischen Pflichtgates und eingefrorenem Kandidaten.**
