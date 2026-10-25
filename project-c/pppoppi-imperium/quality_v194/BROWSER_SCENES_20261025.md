# Projekt C – Szenen-, Tastatur- und Layout-Audit (25.10.2026)

**Arbeitsstand:** getrenntes, gestapeltes Entwicklungspaket auf PR #46 (Basis-HEAD `de43df9b1e8112b1a92e95dd5323e00e9f1136d7`); **kein Merge und kein Release**.

## Zweck und tatsächlicher Prüfgegenstand

`quality_v194/test_browser_scenes_v194.py` baut die technische Vorschau aus den unveränderten 110 verifizierten Quell-/Testdateien **nur in einem temporären Ordner**. Ein echter Chromium-Browser lädt die lokale `file://`-Datei. Es werden keine produktiven Spielstände oder Originalquellen verändert.

Für jede der registrierten Szenen werden geprüft:
- Erreichbarkeit nach Start einer isolierten Partie, Dialogtitel, nichtleerer Inhalt, genau eine Navigationsleiste und sichtbarer Schließenknopf.
- Tastatur: Übersicht über fokussierten Knopf mit Enter öffnen; Dialog mit fokussiertem Schließenknopf und Enter schließen.
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
