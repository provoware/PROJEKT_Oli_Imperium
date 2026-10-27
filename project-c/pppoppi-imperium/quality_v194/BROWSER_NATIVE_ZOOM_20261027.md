# Browserzoom 175/200 % – technische Teilprüfung (27.10.2026)

## Ausgangslage und Pflicht
Die bisherigen Prüfungen nutzten einen CSS-Bildbereich von 400×300 statt echten
Browserzooms. Damit war BED-03 (Skalierung) nicht belegt. Auch BAR-01
(Tastaturfokus) war nur teilweise nachgewiesen.

## Neuer reproduzierbarer Test
`python3 project-c/pppoppi-imperium/quality_v194/test_browser_native_zoom_v194.py`

- Unveränderte 110 Originaldateien anhand des Manifests prüfen und isolierte
  Offline-Vorschau bauen; keine Spielstände oder Originaldateien überschreiben.
- Eine temporäre Chromium-Erweiterung mit der offiziellen
  `chrome.tabs.setZoom`-Schnittstelle verwenden. Das ist **echter
  Browser-Seitenzoom**, nicht CSS-Zoom, simulierte Viewport-Verkleinerung,
  Geräte-Pixeldichte oder Pinch-Zoom.
- Browserzoom 175 % und 200 % mit `chrome.tabs.getZoom` gegenprüfen und
  Veränderung von CSS-Fensterbreite und Geräte-Pixeldichte beobachten.
- Spielstart und neue Partie per Tab/Enter, Hilfe bei beiden Zoomstufen per
  Tab/Enter öffnen, mit Escape schließen, Fokus-Rückkehr und unveränderten
  Spielstand prüfen. Keine externen Netzwerkanfragen.
- Überläufe des Dokuments und des Dialogs als Messwerte protokollieren.

## Nachweisstatus
**PASS als technische Teilprüfung:** [Chromium-CI #40433519507](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40433519507)
bestand auf Implementierungs-HEAD `bd3fc32227e544aa83778eb45df9304c67224be9`; [Quellprüfung #40433519500](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40433519500)
bestand. Die [Gesamtmatrix #40433519447](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40433519447)
bleibt wie vorgesehen **BLOCKED**.

Messwerte: 175 % → CSS-Breite 457, Pixeldichte 1,75; 200 % → CSS-Breite
400, Pixeldichte 2,00. In beiden geprüften Hilfe-Dialogpfaden kein
horizontaler Überlauf (0 px), Tab/Enter/Escape und Fokus-Rückkehr bestanden,
Wirtschaftszustand unverändert, keine externen Anfragen.

Der erste Lauf [#40433332941](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40433332941)
scheiterte an einem **Testaufbaufehler**: Der modale Unternehmenscomputer
war nach dem Partiestart noch offen und sperrte die Kopfbedienung
korrekterweise. Der Test schließt ihn jetzt vor der Fokusprüfung regulär
mit Escape. Der korrigierte vollständige Browserlauf bestand.

BED-03 bleibt **BLOCKED**, weil ein Zoom-Test für einen Hilfedialog
noch keine vollständige 39-Szenen- und Minispielabnahme beweist.
BAR-01 bleibt **BLOCKED**, weil ein sichtbarer Fokusring nicht automatisch
ausreichenden Farbkontrast beweist. Die persönliche Kubuntu-Sichtabnahme
ist ausdrücklich zurückgestellt.

## Nachfolgende Pflichtarbeiten
1. Alle 39 Spielszenen bei 175/200 % echtem Zoom auf Überläufe und Bedienbarkeit prüfen.
2. Sämtliche relevanten Szenen und Aktionen unter echtem Zoom auf
   Erreichbarkeit, Überdeckung und Fokuskontrast untersuchen.
3. Vollständige fachlich definierte Sieg-/Niederlagenpartien samt
   Wiederherstellung nachweisen, ohne historische Originalregeln zu erfinden.

Kein Merge, kein Release, keine persönliche Endabnahme.
