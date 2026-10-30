PPPOPPI IMPERIUM – V1.9.1: NAVIGATION UND SPIELABLAEUFE
===========================================================

STATUS
- 39 registrierte Ansichten, alle im Chromium-Renderer ohne Ausnahme geöffnet.
- 37 regulär über Bildschirmverbindungen erreichbar. Rettung und geheime Übergabe sind Zustandsansichten und wurden gezielt getestet.
- Neuer Zurück-Weg, Büroknopf und Bereichsübersicht; Alt+Pfeil links als Tastenkürzel.
- Bildschirmwechsel verändern keine Spielwerte; Monatsbericht bleibt Pflichtphase des Wirtschaftskerns.
- Vor vertraulicher Übergabe keine fremden Firmeninformationen und kein Export über die Benutzeroberfläche.
- Keine neuen Rohstoff-/Öl-/Marktberechnungen. Wirtschaftskern-Dateien sind byteidentisch.

START
ZIP komplett entpacken. Ordner SPIEL öffnen. index.html im vorhandenen Browser starten.
Für die Benutzung sind keine Zusatzprogramme und keine Internetverbindung erforderlich.
Direkter Kubuntu-Doppelklickstart ist NICHT persönlich getestet – gemäß Vereinbarung erst am Entwicklungsende.

BEDIENUNG
Büro: Gegenstand anklicken. In Fachansichten: Zurück (oder Alt+Pfeil links), Büro, Übersicht.
Bei vertraulichem Spielerwechsel MUSS die Übergabe zuerst bestätigt werden.
Bei Bericht und Sanierung dürfen Informationsseiten angesehen werden; die wirtschaftliche Phase wird dadurch NICHT übersprungen.

AUTOMATISCHE TESTS (nur Entwickler)
Im SPIEL-Ordner, falls Node, Python, Playwright, Chromium vorhanden sind:
  python test_navigation_v191.py
  python graph_navigation_v191.py
  python test_browser_v171.py
  node test_fair_market_v161.cjs
  node test_transport_v17.cjs
  node test_public_network_v171.cjs

BELEG / GRENZEN
Neue Prüfkette 32/32, 39 Szenen gerendert, Graph 37/39 regulär erreichbar + 2 bedingte Szenen.
Basisprüfungen: 18/18 Fertigwarenmarkt, 22/22 Transport, 28/28 öffentlicher Verkehr, 28/28 vorhandener Browserablauf.
Nicht als abgeschlossen behaupten: alle nur unter bestimmten Spielkonstellationen möglichen Aktionen, langfristiges KI-Balancing, echte Kubuntu-Endabnahme, C64-Emulatorvergleich.

ARCHITEKTUR
V1.9.1 ist bewusst ein schmaler Navigationsadapter; keine alternativen Öl/Gold/DJ-Themenprofile.
Die später mögliche Modularisierung bleibt nur als Designziel im Hintergrund.

PROVOWARE – wissenschaftliche Originaldokumentation und eigenständiges Berliner Satire-Spiel bleiben getrennt.
