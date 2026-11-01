# PPPOPPI IMPERIUM – verbindliche Vorab-Anleitung und Fehlergrenzen
**Dokumentationspaket DOK-01 · DOK-02 · DOK-03 | 01.11.2026 | NUR INTEGRATIONSENTWURF**

> [!WARNING]
> **Keine Spiel-, Versions- oder Veröffentlichungsfreigabe.** Der hier beschriebene Spielkern ist **V1.9.3**, die darübergelegte, technisch abgeleitete **V1.9.4-Prüfschicht** ist kein neues fertig abgenommenes Spiel. Die 52 Prüfkriterien stehen weiterhin bei **6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. Die drei Dokumentationskriterien bleiben bis zur getrennten Prüfung **OPEN**.

## DOK-01 · Starten und Spielstand sichern – Schritt für Schritt

**Voraussetzung:** Repository vollständig herunterladen/entpacken; die folgenden drei Befehle in einem Terminal **im obersten Repository-Verzeichnis** ausführen. Für die Erstellung der Technikfassung wird Node.js benötigt; für die HTML-Datei danach ein Browser.

1. **Originale prüfen** – kontrolliert die unveränderten 110 freigegebenen Dateien; Fehler nicht übergehen:
   ```bash
   python3 project-c/pppoppi-imperium/recovery/verify_sources.py
   ```
2. **Technikfassung erstellen** – legt einen **neuen** Ordner an und überschreibt weder originale Spielquellen noch vorhandene Zielordner:
   ```bash
   node project-c/pppoppi-imperium/quality_v194/build.cjs ./PPPOPPI_IMPERIUM_V194_TECH
   ```
3. **Browser öffnen** – öffnet die erzeugte Startseite im Standardbrowser:
   ```bash
   xdg-open ./PPPOPPI_IMPERIUM_V194_TECH/index.html
   ```

**Wichtig:** Die Erstellung funktioniert nur, wenn der Zielordner vorher **nicht** existiert. Bei einer Fehlermeldung zuerst die Ursache prüfen; vorhandene Ordner keinesfalls ungefragt löschen. Der Doppelklick-/`file://`-Start auf dem persönlichen Kubuntu-Rechner wurde **noch nicht** abgenommen. Wenn der Browser den lokalen Aufruf sperrt, ist dies kein bestandener Starttest.

**Bedienung:** Nach der Anzeige „Neue Partie“ auswählen; im Büro Computer, Deutschlandkarte, Tank-/Transportansichten und Monatswechsel verwenden. Die Spielvariante kennt unter anderem regionale Claims, Bohren/Fördern, Raffinerie, Lager, öffentliche Frachtwege und den Handelsplatz. Ein erfolgreicher Teiltest ersetzt keine komplette Wirtschaftspartie.

**Manuelle Sicherung:** Im Computer den Bereich **Spielstände** öffnen und **Spielstand exportieren** / **Sichern** wählen. Die dadurch gespeicherte **JSON-Datei** unabhängig vom Browser aufbewahren. Bei Wiederaufnahme **Spielstand laden** / **Laden** auswählen und die zuvor gesicherte Datei wählen. Nach dem Import Spielstand und Monatsstand kontrollieren, **bevor** die alte Datei verworfen wird. Ein ungültiger oder zu großer Import kann abgewiesen werden. Das technische Wiederherstellungsangebot für lokale Zwischensicherungen ist kein Ersatz für den externen JSON-Export; Browserdaten können verloren gehen.

**Wenn etwas nicht funktioniert:** Browser-Zugriff auf lokale Dateien, die verwendete Spielversion und die konkrete Fehlermeldung notieren. Eine fehlerhafte oder abgebrochene Dateiauswahl bei **175 % / 200 % Zoom** bleibt ein dokumentiertes Stabilitätsrisiko, selbst wenn einzelne Browserläufe erfolgreich waren.

## DOK-02 · Spielumfang und Versionsgrenzen

| Kennung | Nachgewiesene Rolle | Nicht daraus ableiten |
| --- | --- | --- |
| **V1.1 / V1.7.1** | Historische Titel und Starttexte in den geschützten Quellen; die Datei `SPIEL/README_START_V171.txt` dokumentiert öffentliche Frachtfunktionen. | Aktuell freigegebene Gesamtversion. |
| **V1.9.3** | Spielkern mit Wirtschafts-, Logistik-, Spielstand- und Minispielpfaden. | Vollständig geprüfte Endspiel- oder Bilanzberechnung. |
| **V1.9.4** | Prüfschicht und **abgeleiteter** Technikaufbau aus `quality_v194/build.cjs` mit Versions-, UI-, Import-, Sicherungs- und Testkorrekturen. | Selbstständige V1.9.4-Neufassung des Spielkerns oder C64-Originaltreue. |
| **V2.0** | Späteres Entwicklungsziel. | Vorhandener, abgenommener oder veröffentlichter Spielstand. |

Die **110 freigegebenen Quellen** in `SPIEL/` sind durch `WIEDERHERSTELLUNG_MANIFEST.json` und die Wiederherstellungsprüfung geschützt. Das ursprüngliche Quellpaket umfasste **187** Einträge; die weiteren **77** Dateien (73 PNG, 2 PDF, 1 ZIP, 1 TXT) wurden nicht öffentlich übernommen. Ihre Urheberrechte und ihre Notwendigkeit sind **nicht** abschließend geklärt. Historische Originalgrafiken oder Disketteninhalte dürfen deshalb nicht ungeprüft hinzugefügt werden.

Die öffentliche Spielwelt PPPOPPI/Deutschland und die Forschung zum historischen C64-Spiel sind **getrennte Bezugsgrößen**; belegte Teilfunktionen sind keine Originalregelprüfung.

## DOK-03 · Fehler, Prüfergebnisse, noch offene Nachweise

| Bereich | Gesicherter Befund | Freigabegrenze / nächster Test |
| --- | --- | --- |
| **Quelle/Medien** | 110 Quell-/Testdateien prüfsummengebunden; 77 Archiv-Einträge nicht übernommen. | Herkunft, Rechte und Ressourcenbedarf einzeln prüfen; **QUE-01 / QUE-04** bleiben offen/gesperrt. |
| **Browser/Zoom** | Browser-Stichproben einschließlich 175/200 % wurden ausgeführt; bei nativer Dateiauswahl traten sporadische Dialog-/Zeitfehler auf. | Fehler kausal reproduzieren und beheben; gesamter 800×600-/Tastatur-/Fokus-/Zoom-Rundlauf nachweisen. |
| **Wirtschaft/Bilanz** | Echte Rechnungen, Transport, Lager, Kredite und Verträge wurden in isolierten Szenarien geprüft. | **Keinen** bilanziellen Gewinn, Forderungsbestand oder bewertetes Gesamtvermögen aus Kassen-/Mengenwerten erfinden; **WIR-01 bis WIR-04** bleiben BLOCKED. |
| **Spielstände** | Export-/Import- und Neustartszenarien liefen in Testläufen. | Ausfall-, Sicherheits-, mehrgenerationige Speicher- und vollständige Langzeitpartie getrennt nachweisen; **SPE-01 bis SPE-03** bleiben BLOCKED. |
| **Freigabe** | Auf dem Integrations-HEAD `14460c5ae26af16ce302bc64a10da94eaee91e82` endeten **24/25** GitHub-Workflows mit SUCCESS; der Pflicht-Gate-Workflow endet korrekt mit FAILURE. | **Keine** automatische Merge-/Vorrelease-/Kubuntu-/C64-Freigabe. Der aktuelle Hauptzweig hat zwischenzeitlich zwei neue Commits, die separat berücksichtigt werden müssen. |

### Prüfbefehle (nur im Repository-Hauptverzeichnis)

```bash
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/test.mjs
```

**Absichtlich rot:** `node project-c/pppoppi-imperium/prerelease/check.mjs --technical` muss bis zur vollständigen technischen Abnahme mit **Exitcode 1** die noch fehlenden Kriterien melden; Syntax-/Schemafehler führen zu Exitcode 2. Der Prüfer darf nicht entschärft werden, um eine Freigabe vorzutäuschen.

**Quellen und weiterführende Prüfdetails:** [technischer Aufbau](README.md), [Matrix](../prerelease/matrix.json), [geschützter Quellimport](../QUELLIMPORT_20261025.md), [Integrationsnachweis](INTEGRATION_MAIN_PR140_20261031.md), [Projekteinführung](../README.md) und [Vorrelease-Vertrag](../prerelease/README.md).

### Abschlusskriterien dieser drei Dokumentationsaufgaben

**DOK-01:** Exakte Befehle für eine frische Kopie auf realem Kubuntu prüfen, Speichern/Laden und verständliche Fehlertexte am unveränderten Test-HEAD nachvollziehen.  
**DOK-02:** Versionen und Quellinventar gegen das Git-Manifest, alle tatsächlichen Funktionen und den unveränderten Technikaufbau prüfen.  
**DOK-03:** Prüfläufe samt exaktem HEAD und bekannten Risiken nachführen; echte Browser- und Endspiel-Befunde nicht nur aus historischen Dokumenten übernehmen.

**Bewusst keine Matrixstatus-Änderung:** Erst nach unabhängigen Tests, Review und einem ordnungsgemäßen JSON-Nachweis pro Gate darf `DOK-01`, `DOK-02` oder `DOK-03` auf PASS gestellt werden. Ohne solche Evidence bleiben sie **OPEN**.
