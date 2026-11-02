# Projekt C – echte Insolvenz aus normalen Spielaktionen (26.10.2026)

## Herkunft, Umfang, Trennung

- **Spiel:** PPPOPPI IMPERIUM, eigenständige satirische Spielwelt, Technikvorschau V1.9.4 auf V1.9.3; **keine** Behauptung über C64-Originalregeln.
- **Basis:** [Entwurfs-PR #52](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/52), geprüfter Ausgangs-HEAD `dd5229a9559d2bccc7cc7deaaea2a9052fe9a727`.
- **Neuer Entwurfs-PR:** [#53](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/53), Zweig `agent/prerelease-c-natural-rescue-20261026-0433`. HEAD und aktuelle CI sind in diesem PR nachzusehen.
- **Geänderte Dateien:** [neuer Browser-Test](test_browser_natural_rescue_v194.py), Chromium-Pflichtworkflow, dieser Prüfbericht. **Keine** Änderungen an den 110 Originaldateien, produktiven Spielständen, `main` oder ausgeschlossenen Top-5-Repositories.
- **Matrix:** [52 verbindliche Vorrelease-Pflichten](../prerelease/matrix.json). **6 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.** Ein erfolgreicher Teiltest schaltet `LOG-04`, `VER-02`, `SPE-01` oder `TES-04` **nicht** automatisch frei.

## Reproduzierbarer Normalspiel-Ablauf

Der Test startet mit einer neuen Partie (1 Mensch, 2 KI) im **temporär aufgebauten Offline-Chromium bei 800 × 600**. Die Spielaktionen werden über sichtbare Schaltflächen ausgeführt; nur die Szenennavigation erfolgt über die vorhandene Anzeige-Schnittstelle.

| Schritt | Normale Spielaktion | Kasse danach (Cent) |
|---|---|---:|
| Start | Neue Partie | 20.000.000 |
| 1 | Gutachten BERLIN-1 | 19.800.000 |
| 2 | Kauf BERLIN-1 | 14.800.000 |
| 3 | Bohrung BERLIN-1 | 7.800.000 |
| 4 | Gutachten NORD-1 | 7.560.000 |
| 5 | Kauf NORD-1 | 1.960.000 |
| 6 | Tankausbau BERLIN-1 | 760.000 |
| 7 | Objektschutz BERLIN-1 | 410.000 |
| 8 | Erneuter Objektschutz BERLIN-1 | 60.000 |
| 9 | Normaler Monatsabschluss | 0 |

**Wichtig:** Die zweite Sicherheitsbeauftragung ist im aktuellen Regelkern zulässig, aber wirtschaftlich redundant. Sie ist hier eine reguläre, kostenauslösende Spielhandlung, **keine** künstliche Manipulation von Bargeld, Schulden, Forderungen oder Spielphase. Die Wirtschaftlichkeit wiederholter Sicherheitsaufträge bleibt eine getrennte Balance-/Bedienungsfrage.

Bei Monatsabschluss entstehen 90.000 Cent Lohn und 50.000 Cent Wartung. Von 140.000 Cent Forderungen können nur 60.000 Cent bezahlt werden. **80.000 Cent Rückstand** führen über den regulären Übergang in die Sanierungsphase `RESCUE`. Beide KI-Firmen absolvieren ihre normalen Züge.

Aus **demselben tatsächlich erspielten und exportierten Insolvenz-Spielstand** werden drei unabhängige Wege geprüft:

1. **Rettungskredit:** 4.000.000 Cent neue Schulden, 3.920.000 Cent Restkasse, keine offenen Rückstände, beide Felder bleiben erhalten; genau eine Kreditbuchung. Anschließend Export, neuer Browserkontext, Import und Folgemonat ohne doppelte Abrechnung.
2. **Notverkauf:** BERLIN-1 wird freigegeben, NORD-1 bleibt Eigentum; 2.920.000 Cent Restkasse, keine Schulden oder offenen Rückstände; genau eine Verkaufsbuchung.
3. **Sanierungsneustart:** Generation 2, 15.000.000 Cent Startkasse, keine Schulden; beide Felder frei, Sanierungszähler +1 und ein protokolliertes Neustartereignis.

## Nachweise und Prüfgrenzen

- **Engine-Vorprüfung:** vier unveränderte Spielmodule in einer isolierten JavaScript-Ausführung geladen; acht Aktionen, Monatsabschluss, 80.000 Cent Rückstand und alle drei Rettungswege **PASS**. Dies ist kein Browsernachweis.
- **Browser-CI:** [Chromium-Pflichtworkflow](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40264860585), beim Anlegen dieses Dokuments **PENDING**; maßgeblich ist das Ergebnis auf dem **finalen** PR-HEAD.
- **Quell-/Fach-CI:** [Quellnachweis](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40264860462), **PENDING**.
- **Gesamtmatrix:** [integrierte Vorrelease-Sperre](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40264860523), **FAIL/BLOCKED** wegen noch offener Pflichtgates. Das ist keine Vorrelease-Freigabe.
- **Reproduktion:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_natural_rescue_v194.py` mit Python 3.12, Node.js 22 und Playwright/Chromium 1.56.0. Der Test nutzt ein automatisch entferntes temporäres Verzeichnis.

**Noch offen:** weitere Insolvenz- und Mehrspielerfälle, echte Strom-/Dateiunterbrechungen, beschädigte und ältere Spielstände, vollständige Partien bis zu allen Endbedingungen, 175–200-%-Browserzoom, vollständige Tastaturbedienung, messbare Leistungsgrenzen, Grafik-/Rechte-/Installationsabnahme.

## Nächste drei konkrete Pflichtpakete

1. **LOG-04 / VER-02:** Sanierungsfälle mit zwei menschlichen Firmen, Zugübergabe und mehreren gleichzeitig betroffenen Unternehmen reproduzierbar prüfen.
2. **SPE-03 / FEH-03:** Unterbrechungen vor/nach Monatsabschluss und wiederholten Import auf Doppelbuchungen untersuchen.
3. **BED-03 / BAR-01 / PER-01:** nativen Browserzoom, vollständige Tastaturwege und reproduzierbare Ladezeitmessung automatisieren.

**Kein Merge, kein Release.** Persönliche Sichtprüfung und Kubuntu-Endabnahme erst nach allen eigenständig möglichen technischen Prüfungen, grünen Pflichtgates und eingefrorenem Kandidaten.
