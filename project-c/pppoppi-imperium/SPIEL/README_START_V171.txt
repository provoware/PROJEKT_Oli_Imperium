PPPOPPI IMPERIUM – NEO-RETRO PROFI V1.7.1
=========================================

START OHNE INSTALLATION
1. ZIP vollständig entpacken.
2. Ordner SPIEL öffnen.
3. Datei index.html in vorhandenem Chromium oder Firefox öffnen.
4. Neue Partie starten.
5. Computer / Deutschlandkarte / Raffinerie / Transportleitstelle aufrufen.
6. Von der regionalen Transportleitstelle zu „Öffentliche Strecken“ wechseln.
7. Voraussetzung: Regionalnetz, Raffinerie und Vertriebsweg errichten und Fertigware in das regionale Marktlager liefern.
8. Öffentlichen Zugang kaufen; 9 Barrel für den Transport anmelden; am Ende des Monats die gemeinsam verfügbare Frachtkapazität verteilen lassen.
9. Wenn eine Sendung nach 1 oder 2 Spielmonaten am Ziel ankommt, kann sie beim gesonderten überregionalen Handelsplatz verkauft werden.
10. Über „Sichern“ eine JSON-Datei exportieren; „Laden“ liest sie ein.

WICHTIG
- Persönliche Kubuntu-Endabnahme erst nach Abschluss der gesamten Entwicklung.
- Chromium-Tests liefen automatisiert mit lokal eingebettetem HTML/CSS/JS. Kein bestätigter direkter Doppelklick-Test auf dem Nutzerrechner.
- Das alte Wirtschaftssystem bleibt unverändert; neue Logistik ist eine zusätzliche Schicht.
- Das C64-Original wurde hier nicht im Emulator gespielt. V1.8 ist eine quellenbasierte Referenzprüfung, keine abgeschlossene historische Originalabnahme.
- C64-Originalgrafiken oder Diskettenabbilder befinden sich nicht im Paket.

PROFIPRÜFUNG (für Entwickler, optional)
  cd SPIEL
  node test_fair_market_v161.cjs
  node test_transport_v17.cjs
  node test_public_network_v171.cjs
  python test_browser_v171.py
Die Browserprüfung benötigt Python mit Playwright und Chromium. Zum normalen Spielstart sind diese Zusatzprogramme nicht nötig.

QUALITÄTSNACHWEIS
  python QUALITAET_V19/konsistenz_check.py

NEXT
Die konkrete C64-PAL-Referenz später mit Nutzungsnachweis bereitstellen und erst dann den Originaltest durchführen. Eine persönliche Kubuntu-Prüfung wird ausdrücklich NICHT vorgezogen.
