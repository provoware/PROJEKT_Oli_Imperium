# Projekt C – natürliche Vertrags-Teillieferung im echten Browser (28.10.2026)

## Zweck und Abgrenzung
PR #102 beweist die Teilmengenabrechnung nur im isolierten Node-Spielkern. Dieses Paket führt dieselbe kritische Wirtschaftskette mit **sichtbaren Chromium-Schaltflächen** und zwei vollständigen Chromium-Prozessneustarts aus. Es verändert keine der geschützten Original-Spielquellen und keine produktiven Spielstände. Die 4-0-Aufstellung (vier Menschen, keine KI) verhindert konkurrierende Angebote und ist ausdrücklich ein reproduzierbarer Testfall, keine allgemeine Aussage über KI-Balance.

## Reproduzierbarer Prüfweg
`python3 project-c/pppoppi-imperium/quality_v194/test_browser_partial_delivery_v194.py`

1. Lokaler Offline-Build in einem Wegwerfverzeichnis; 800×600, keine Netzwerkanfragen.
2. H1: NORD-1 begutachten, kaufen, bohren, 100.000 Einheiten fördern, verladen, anbieten und 40.000er-Vertrag schließen. H2–H4 beenden ihre Züge mit sichtbarer Übergabebestätigung. Erwartet: 80.000 Marktverkauf und 20.000 Lagerrest.
3. Export des ersten Monats; Chromium **beenden**, neuen Chromium-Prozess öffnen, JSON importieren und Monat 2 beginnen. Kein erneutes Pumpen. H1–H4 beenden ihre Züge.
4. Erwartet: 20.000 Vertragslieferung, 20.000 Fehlmenge, `BREACH`, exakt ein Vertragserlös, eine Fehlmengenstrafe und eine Transportrechnung. Centwerte werden unabhängig aus den Regeln berechnet.
5. Export des Vertragsbruchs; Chromium **beenden**, dritten Chromium-Prozess öffnen, zweimal denselben Stand importieren und Monat 3 beginnen. Keine zweite Vertrags-/Monatsbuchung, kein horizontaler Seitenüberlauf.

## Nachweise und Grenzen
- Neuer Test: `quality_v194/test_browser_partial_delivery_v194.py`; eingebunden in `.github/workflows/prerelease-browser-project-c.yml`.
- Prüfung ist erst **PASS**, wenn der neue CI-Schritt auf dem konkreten Commit erfolgreich abgeschlossen wurde. Bis dahin **NOT_RUN / PENDING**.
- Dieser Fall ersetzt weder eine vollständige Partie bis Sieg/Niederlage noch C64-Originalverifikation, Raffinerie-/Transportgrenzfälle oder die Gesamtfreigabe. `WIR-03` und `SPE-01` bleiben **BLOCKED**.
- Persönliche Sicht- und Kubuntu-Abnahme erst nach allen eigenständig möglichen technischen Pflichtgates.

## Nächste drei Schritte
1. CI des neuen Browserfalls auf dem endgültigen Zweig-HEAD kontrollieren und gegebenenfalls korrigieren.
2. Einen vollständigen Browser-Notverkauf mit Spielstandneustart und wiederholter Sanierungsgeneration absichern.
3. Projekt-C-Endregelvertrag und vollständige Sieg-/Niederlagenpartien als getrennte Pflichtpakete umsetzen, sobald die fachliche Entscheidung verbindlich ist.
