# Natuerlicher Browser-Notverkauf mit Neustart – 28.10.2026

**Status bei Erstellung:** Implementiert und zur GitHub-CI eingereicht, **noch kein Test-PASS behauptet**. Vorrelease bleibt BLOCKED.

## Anlass und Wirkung
Der vorhandene Test `test_browser_natural_rescue_v194.py` prueft den natuerlichen Notverkauf nur bis zum Verkauf; Export, echter Chromium-Prozessneustart und weitere Monatsabrechnung waren fuer genau diesen Pfad nicht verbunden. Das neue Pruefprogramm schliesst diese konkrete Luecke.

## Reproduzierbarer Pruefpfad
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_natural_sale_restart_v194.py
```

- Frischer unveraenderter Offline-Spielstart mit 20.000.000 Cent; acht echte sichtbare Wirtschaftsaktionen aus dem bestehenden Sanierungstest.
- Monatsabschluss erzeugt 80.000 Cent offenen Rueckstand; sichtbarer Notverkauf soll BERLIN-1 freigeben und NORD-1 behalten, bei genau einer Verkaufsbuchung.
- Export nach Verkauf, **Chromium-Prozess vollstaendig beenden**, neuen Prozess starten, JSON importieren und Spielstand exakt vergleichen.
- Monat 2 durch regulare Browseraktion abschliessen, Monat 3 starten: Eigentum, Berichte, Verkaufsbuchungen und Gueltigkeit pruefen.
- 800x600 ohne horizontales Scrollen, kein externer HTTP-Verkehr, keine JavaScript-Laufzeitfehler.
- Der Test nutzt keinen synthetischen Schuldenstand und veraendert keine geschuetzten Spielquellen.

## Pflichtmatrix und Grenzen
Teilbeleg fuer `SPE-01`, `VER-03` und `LOG-04`, alle **BLOCKED**, bis die CI die Ausfuehrung bestaetigt und die weiteren Pflichtfaelle abgeschlossen sind. Kein Spielende, keine Mehrgenerationen-Sanierung, kein historischer C64-Vergleich. **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED** unveraendert.

## Naechste drei Schritte
1. Neuen Browser-CI-Schritt auf exakt diesem Commit pruefen, Fehler beheben und belegte Ergebnisse nachtragen.
2. Natuerliche Sanierung ueber mehrere Generationen mit wiederholtem Speichern/Neustarten absichern.
3. Endregelvertrag der eigenstaendigen PPPOPPI-Adaption konkretisieren und komplette Sieg-/Niederlagenpartien pruefen.

Kein Merge, kein Release; persoenliche Endabnahme erst nach allen technischen Pflichten.
