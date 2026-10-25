# Projekt C – Szenen-, Tastatur- und Layout-Audit (25.10.2026)

**Arbeitsstand:** getrenntes, gestapeltes Entwicklungspaket auf PR #46 (Basis-HEAD `de43df9b1e8112b1a92e95dd5323e00e9f1136d7`); **kein Merge und kein Release**.

## Zweck und tatsächlicher Prüfgegenstand

`quality_v194/test_browser_scenes_v194.py` baut die technische Vorschau aus den unveränderten 110 verifizierten Quell-/Testdateien **nur in einem temporären Ordner**. Ein echter Chromium-Browser lädt die lokale `file://`-Datei. Es werden keine produktiven Spielstände oder Originalquellen verändert.

Für jede der registrierten Szenen werden geprüft:
- Erreichbarkeit nach Start einer isolierten Partie, Dialogtitel, nichtleerer Inhalt, genau eine Navigationsleiste und sichtbarer Schließenknopf.
- Tastatur: Start, neue Partie, Übersicht und Schließen über echte Tab-Tastendrücke und Enter erreichen; zusätzlich Rückwärtsweg mit Umschalt+Tab. Keine programmatische Fokussetzung im Szenentest.
- JavaScript-Ausnahmen und externe HTTP-Anfragen während des Tests.
- Dokument-, Dialog- und Inhaltsbreiten in einem **echten 800×600-Browserfenster**.
- Wiederholung mit **zoom-äquivalenten CSS-Viewports** von **457×343 (175 %) und 400×300 (200 %)**. Das entspricht näherungsweise dem verfügbaren CSS-Platz bei 800×600 und erhöhter Browservergrößerung. Es ist **kein nativer Browserzoom** und ersetzt dessen spätere technische Prüfung nicht.

Die Ausgabe `LAYOUT-AUDIT` protokolliert CSS-Viewport, Grundüberlauf ohne Dialog, den Prüfstatus und die Anzahl überlaufender Szenen und bis zu acht der größten Fälle mit gemessenen Pixelwerten. Überläufe werden **nicht als PASS gewertet**: Der Diagnoselauf kann technisch PASS sein, während die Layout-Freigabe BLOCKED bleibt. Es werden keine Bilder, privaten Dateien oder Browserprofile ins Repository geschrieben.

## Ausführung

```bash
python3 -m pip install playwright==1.56.0
python3 -m playwright install chromium
python3 project-c/pppoppi-imperium/quality_v194/test_browser_scenes_v194.py
```

Der vorhandene GitHub-Workflow `.github/workflows/prerelease-browser-project-c.yml` führt den bisherigen Speicher-/Neustart-Rundlauf und anschließend diesen Szenentest aus. **Ergebnisse auf dem finalen HEAD erst nach GitHub-CI bewerten**; eine grüne CI bedeutet nicht, dass alle Layoutüberläufe beseitigt sind.

## Pflichtmatrix – unveränderte Freigabewerte

**6/52 PASS · 39 BLOCKED · 4 OPEN · 3 persönliche DEFERRED.** Betroffene technische Pflichten `GRA-03`, `BED-02`, `VER-03` und `SPE-01` bleiben ohne vollständige unabhängige Nachweise gesperrt. Kein Teiltest hebt die Vorrelease-Gesamtsperre auf.

## Nächste zusammenhängende Implementierungen

1. Neue CI-Ausgabe für jede Szene und die beiden zoom-äquivalenten CSS-Viewports auswerten; bestätigte Überläufe in der **erzeugten Technikfassung**, nicht in den 110 Quelloriginalen, korrigieren.
2. Danach echte Browserzoomstufen und vollständige Tastaturpfade einschließlich aller Dialoge und Minispiele automatisiert prüfen.
3. Anschließend mehrmonatige vollständige Browserpartien mit Export, Neustart, Reimport und Fehler-/Grenzfällen absichern.

**Persönliche Sichtprüfung, Kubuntu-Praxistest und Release-Freigabe erst nach vollständig grünen technischen Pflichten und eingefrorenem Kandidaten.**

## Folgeprüfung – Korrektur der Zoom-Messmethode (25.10.2026)

**Ausgangsnachweis:** [Chromium-CI #40236598826](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40236598826) ist **PASS** (HEAD `2a017c746bd3f25c13dbc53c82f20ec1e7fab10e`). Der Szenentest meldete **0/39** Überläufe bei 800×600, aber **39/39** bei `document.documentElement.style.zoom = 175%` und **39/39** bei 200 %. Der globale Seitenüberlauf war jeweils bei allen Szenen identisch (**423 bzw. 606 CSS-Pixel**); einzelne Dialoge meldeten zusätzliche Überläufe bis **51 bzw. 71 Pixel**. Diese Befunde sind **keine nachgewiesenen Ergebnisse für echten Browserzoom**.

**Messproblem:** Eine Skalierung des Wurzelelements lässt die CSS-Media-Queries bei 800 Pixel Breite stehen und skaliert den Inhalt darüber hinaus. Bei echter Browservergrößerung wird dagegen normalerweise die verfügbare CSS-Viewport-Breite kleiner; responsive Regeln können dadurch anders reagieren. Die bisherige Simulation war deshalb für die Frage „passt das Layout bei 175/200 %?“ ungeeignet.

**Umsetzung:** Der Test verwendet jetzt **800×600**, **457×343** und **400×300** als getrennte echte Chromium-Viewport-Größen, ohne das Wurzelelement zu skalieren. Er überprüft die tatsächlichen CSS-Viewport-Abmessungen, protokolliert den Überlauf bereits vor dem Öffnen der Szenen und wertet alle 39 Szenen erneut aus. Für 800×600 ist Überlauffreiheit eine **harte Testbedingung**; für die beiden verengten Viewports werden Überläufe als `BLOCKED` ausgewiesen, ohne die unabhängigen Spielstands- und Funktionstests zu verdecken.

**Grenze:** Auch diese Methode ist nur eine **Annäherung an den verfügbaren Layoutplatz**, keine echte native Browserzoomprüfung. Die bereits nachgewiesenen Speicher- und Tastatur-Teilprüfungen bleiben unverändert; `GRA-03`, `BED-02` und `VER-03` bleiben ohne vollständige Nachweise **BLOCKED**. **Vorrelease-Matrix unverändert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.** Der neue Testlauf ist erst nach Abschluss der GitHub-CI auf dem neuen HEAD bewertbar.

## Folgeprüfung – reale Tab-Fokuswege (26.10.2026)

**Änderung:** Der bestehende Chromium-Szenentest fokussiert die vier zentralen Schaltflächen nicht mehr künstlich per `locator.focus()`. Die Hilfsfunktion `tab_to` benutzt ausschließlich echte `Tab`-Tastendrücke (höchstens 160 je Ziel), prüft das tatsächlich aktive Element und bricht bei fehlender Erreichbarkeit mit **FAIL** ab. Zusätzlich wird `Umschalt+Tab` vom Übersichts- zum Büroschalter und zurück getestet. Der Spielstart erfolgt ebenfalls ausschließlich über `Tab` und `Enter`.

**Prüfumfang:** Drei CSS-Viewport-Größen (800×600, 457×343, 400×300), bestehende 39-Szenen-Prüfung, Tastaturwege und vorhandene Offline-/Speicherprüfungen im unveränderten Workflow. Die Änderungen betreffen nur das Prüfskript und diese Dokumentation; die 110 Originalquellen und echte Spielstände bleiben unverändert.

**Nachweisgrenze:** Ein durchlaufender Tab-Test belegt einzelne wichtige Tastaturwege, **nicht** alle Dialoge, Minispiele oder die vollständige Barrierefreiheit. Echte native Browser-Vergrößerung bleibt offen. **Vorrelease-Matrix unverändert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.** Das Ergebnis des neuen HEAD darf erst nach tatsächlich abgeschlossener GitHub-CI als PASS gemeldet werden.

**Nächste Umsetzung:** Fehlgeschlagene Fokuswege gezielt beheben; danach echten Browserzoom und vollständige Langzeitpartien mit mehrfacher Wiederherstellung automatisiert prüfen. Kein Merge, kein Release und keine persönliche Endabnahme.

### GitHub-Nachweise für den geänderten Prüfcode (26.10.2026)

**Code- und Dokumentations-HEAD vor dieser Nachweiserweiterung:** `c909134d26a6198b9ce4ac15518ed9866824d142`.

- [Chromium-CI #40245231425](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40245231425): **PASS**. Echte Tab-/Enter-Wege für Start, Partiestart, Übersicht und Schließen sowie Umschalt+Tab bestanden in allen drei Viewports. **39/39 Szenen pro Viewport, insgesamt 117/117**, jeweils **0 horizontale Szenenüberläufe**; keine JavaScript-Laufzeitfehler oder externen HTTP-Anfragen. Offline-Export, Neustart, identischer Reimport und defekter Import ohne Zustandsverlust: **PASS**.
- [Quell-/Fach-CI #40245231428](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40245231428): **PASS**, darunter SHA-256-Inventar der 110 unveränderten Originalquellen.
- [Gesamtmatrix #40245231426](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40245231426): **FAIL/BLOCKED**, da die verbleibenden Vorrelease-Pflichten bewusst nicht freigegeben sind; keine neue Testregression.

**Einordnung:** Die drei Viewports sind kein echter Browserzoom. Die Tests belegen ausgewählte Tastaturwege, nicht die vollständige Bedienbarkeit aller Aktionen. Nach diesem Dokumentations-Commit müssen die GitHub-Prüfungen auf dem endgültigen HEAD erneut kontrolliert werden. **Matrix weiterhin 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.**
