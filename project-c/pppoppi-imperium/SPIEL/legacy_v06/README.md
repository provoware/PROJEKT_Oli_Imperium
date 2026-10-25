# PPPOPPI-IMPERIUM – Expertenpaket V0.4–V0.6

**Drei aufeinander abgestimmte Arbeitsstände:**

- **V0.4:** verbindliches **Pilot**-Regelprofil (Einheiten, Markt, Zahlungen, Rettung, Spielstand).
- **V0.5:** gerichtetes Bildschirm- und Navigationsmodell, 32 Ansichten/62 Verbindungen, 34 für die Mini-Partie markierte Verbindungen.
- **V0.6:** echte offline spielbare **Einzelspieler-Mini-Partie** mit einer Testregion, einem Ölfeld, einem fest vorgegebenen Konkurrenzangebot und Monatsabschluss.

Es handelt sich **nicht um ein fertig rekonstruiertes Oil Imperium (C64)**. Die Berliner Spielwelt enthält eigene Figuren, Werte und Regeln. Keine Originalspiele, ROMs, geschützten Grafiken oder Tondateien sind enthalten. Das bestehende GitHub-Repository wurde durch dieses Paket **nicht verändert**.

## Spiel starten – ganz einfach (Kubuntu, Linux Mint, Windows)

1. ZIP-Datei vollständig in einen Ordner entpacken.
2. Doppelklick auf **`index.html`**.
3. „Neue Partie einrichten“ anklicken und dann „Partie jetzt beginnen“.
4. Spielroute: **Karte → Region → Feld → Gutachten → Kauf → Bohrung → zurück zur Firmenzentrale → Lager/Förderung → Logistik → Markt → Spielmonat abschließen**.
5. „Spielstand exportieren“ speichert eine **JSON-Datei** im Downloadordner. Zum Fortsetzen „Spielstand laden“ verwenden.

**Kein Terminal und kein Internet nötig.** Bei Browser-Einschränkungen für lokale Dateien die entpackte `index.html` über deinen Dateimanager mit Chromium oder Firefox öffnen. Nicht die HTML-Datei allein aus dem ZIP starten – die `src/`-Unterordner müssen daneben liegen.

## Aufbau

```text
index.html                       startet den Prototyp
src/engine.js                    gesamte Geld-, Zeit- und Mengenlogik
src/ui.js                        Bedienoberfläche (keine Buchungsregeln)
src/nav.js                       vollständig lokaler Navigationskatalog
src/style.css                    Darstellung
config/profile_v04.json         Pilotparameter, mit dem Spielkern abgleichen
config/schema_save_v04.json     Struktur eines Spielstands
config/navigation_v05.json      vollständiger Entwurfsgraph
config/schema_navigation_v05.json  Graph-Schema
reference/                      Quellenregister aus V0.3 (noch NICHT originalverifiziert)
docs/EXPERTEN_V04_V06.md         ausführliche fachliche Dokumentation
docs/test_save.json              tatsächlich erzeugter Ende-Monat-Testspielstand
docs/browser_test.png            Chromium-Abnahmebild
 tests/                          automatische Entwicklungsprüfungen
```

## Freiwillige Entwicklerprüfungen

**Normale Spieler brauchen Node.js und Python nicht.** Für die Quellcodeprüfung kann der Entwickler im entpackten Ordner Folgendes ausführen:

```bash
node tests/test_engine.cjs
node tests/test_navigation.cjs
node tests/test_profile.cjs
```

Die Browser-Prüfung `python3 tests/browser_smoke.py` benötigt eine Entwicklungsumgebung mit Python-Playwright und einem Chromium-Browser unter `/usr/bin/chromium`; sie ist kein Bestandteil des normalen Spielstarts. Sie lädt die mitgelieferten Dateien für den Test in ein isoliertes Browserdokument, weil die Testumgebung direkte lokale Seitenaufrufe blockiert.

## Nachweisstand

- 37 / 37 Fachtests erfolgreich.
- 411 Strukturprüfungen der Navigation erfolgreich.
- 13 Profilabgleiche erfolgreich.
- Chromium-Mini-Partie bis zum Monatsabschluss erfolgreich, inklusive Spielstand-Export und -Import, 0 protokollierte JavaScript-Laufzeitfehler.
- **Nicht abgeschlossen:** C64-Originaltest; vier echte Parteien, KI, Verträge, drei Minispiele, Gebiete und Gesamtbalance, praktische persönliche Kubuntu-Abnahme.

Für die wissenschaftliche Nachverfolgung steht die vollständige Dokumentation in `docs/EXPERTEN_V04_V06.md`. Die im Stamm-Repository dokumentierten historischen Beleganforderungen bleiben verbindlich.
