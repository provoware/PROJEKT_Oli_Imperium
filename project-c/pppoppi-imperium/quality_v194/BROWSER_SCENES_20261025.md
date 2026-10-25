# Projekt C – Szenen-, Tastatur- und Layout-Audit (25.10.2026)

**Arbeitsstand:** getrenntes, gestapeltes Entwicklungspaket auf PR #46 (Basis-HEAD `de43df9b1e8112b1a92e95dd5323e00e9f1136d7`); **kein Merge und kein Release**.

## Zweck und tatsächlicher Prüfgegenstand

`quality_v194/test_browser_scenes_v194.py` baut die technische Vorschau aus den unveränderten 110 verifizierten Quell-/Testdateien **nur in einem temporären Ordner**. Ein echter Chromium-Browser lädt die lokale `file://`-Datei. Es werden keine produktiven Spielstände oder Originalquellen verändert.

Für jede der registrierten Szenen werden geprüft:
- Erreichbarkeit nach Start einer isolierten Partie, Dialogtitel, nichtleerer Inhalt, genau eine Navigationsleiste und sichtbarer Schließenknopf.
- Tastatur: Übersicht über fokussierten Knopf mit Enter öffnen; Dialog mit fokussiertem Schließenknopf und Enter schließen.
- JavaScript-Ausnahmen und externe HTTP-Anfragen während des Tests.
- Dokument-, Dialog- und Inhaltsbreiten in einem **echten 800×600-Browserfenster**.
- Wiederholung mit **CSS-Zoom-Simulationen 175 % und 200 %** bei 800×600. Diese Simulationen sind ausdrücklich **kein nativer Browserzoom** und ersetzen dessen spätere technische Prüfung nicht.

Die Ausgabe `LAYOUT-AUDIT` protokolliert die Anzahl überlaufender Szenen und bis zu acht der größten Fälle mit gemessenen Pixelwerten. Überläufe werden **nicht als PASS gewertet**: Der Diagnoselauf kann technisch PASS sein, während die Layout-Freigabe BLOCKED bleibt. Es werden keine Bilder, privaten Dateien oder Browserprofile ins Repository geschrieben.

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

1. CI-Ausgabe für jede Szene und die beiden CSS-Zoomstufen auswerten; konkrete Überläufe in der **erzeugten Technikfassung**, nicht in den 110 Quelloriginalen, korrigieren.
2. Danach echte Browserzoomstufen und vollständige Tastaturpfade einschließlich aller Dialoge und Minispiele automatisiert prüfen.
3. Anschließend mehrmonatige vollständige Browserpartien mit Export, Neustart, Reimport und Fehler-/Grenzfällen absichern.

**Persönliche Sichtprüfung, Kubuntu-Praxistest und Release-Freigabe erst nach vollständig grünen technischen Pflichten und eingefrorenem Kandidaten.**
