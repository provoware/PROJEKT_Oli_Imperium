# Projekt C – Tastatur-Treffbarkeit bei echtem Browserzoom (27.10.2026)

## Ziel

Die vorherige Fokus-Kontrastpruefung (PR #79) hat 903 per Tab erreichbare Elemente bei 175/200 % und einen berechneten Mindestkontrast von 6,90:1 nachgewiesen. Das beweist nicht, dass die fokussierten Elemente auch sichtbar und mit dem Zeiger erreichbar sind. Der neue Test ergaenzt deshalb fuer jedes fokussierte Element fuenf Trefferpunkte mit `document.elementFromPoint`; nur das Ziel selbst oder ein Nachfahre zaehlt. Eine absichtlich eingebaute Vollbild-Ueberdeckung wird als Negativkontrolle erkannt. Unbekannte Kontrasthintergruende fuehren nun ebenfalls zu FAIL statt zu einer stillschweigenden Freigabe.

## Echte CI-Ergebnisse – Erstlauf

- **Implementierungs-HEAD:** `1385055ff2b9fa33a9045be6140c820ff86da16c`.
- **[Chromium #40461751589](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461751589): FAIL** – der neue Test hat bei 175 % **4 nicht treffbare Elemente unter 452** gefunden; 452/452 per Tab erreicht, 0 fehlende Fokusringe, 0 Kontraste unter 3:1 und 0 unbekannte Hintergruende. Betroffen: Szene `phone` (2 Knoepfe), `quick` (1 Knopf), `factory` (1 Knopf). 200 % wurde wegen des berechtigten Fehlers noch nicht erreicht.
- **[Quellworkflow #40461752478](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461752478):** gesondert pruefen; der Browserfehler ist kein Quellhash-Fehler.
- **[Vorrelease-Sperre #40461751530](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461751530):** bleibt gesperrt, keine Gesamtfreigabe.

Die vier Funde sind **technische Treffbarkeitsbefunde**, noch keine bewiesenen CSS-Ueberdeckungsursachen. Ein ausserhalb des Viewports liegendes Ziel oder eine klebende Dialog-Kopfzeile kann denselben Befund erzeugen. Es wurde weder die Spieloberflaeche nachgebessert noch eine Ursache behauptet.

## Nachfolgende Diagnose und naechste Arbeit

- **Diagnose-Commit:** `c59fb328e4c381646229df3e9475197c662abc8e`. Er protokolliert bei Fehlschlaegen Elementtext, Rechteck, CSS-Viewport, oberstes Element am Mittelpunkt und Dialog-Scrollposition. CI: [#40461958332](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461958332). Das Ergebnis ist erst nach abgeschlossenem Lauf zu bewerten.
- Anschliessend die vier Treffer auf echte Ueberdeckung, Tastatur-Scrollfehler oder Messartefakt untersuchen; nur nachgewiesene Ursache minimal im isolierten Technikaufbau beheben.
- Danach 175 % **und** 200 % erneut ausfuehren, die dynamischen Zwischenbilder der drei Minispiele gesondert erfassen und die restlichen Dialogaktionen testen.

**Abgrenzung:** Dieser Fuenfpunkt-Test misst nur aktive Bedienelemente der programmatisch geoeffneten 39 Szenen, nicht alle Textueberlagerungen, Animationen, Spielendzustände oder die persoenliche Sichtpruefung. **BAR-01/BED-03 bleiben BLOCKED. 6/52 technische Pflichten PASS. Kein Merge, kein Release.**

## Vertiefte Diagnose und gezielte Korrektur (gleicher Arbeitsschritt)

- [Diagnose-CI #40461958332](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40461958332) **FAIL**: Vier Bedienelemente liegen nach Tab-Fokus unter der klebenden Szenennavigation (`phone`, y=102) bzw. unter dem fixierten KI-Knopf (`quick` und `factory`, y=284–327) bei 457 × 343 CSS-Pixeln. Der Fehler betrifft die Trefferbarkeit, nicht die 110 unveraenderten Spielquellen.
- Im **isolierten V1.9.4-Aufbau** wird deshalb bei schmalem CSS-Viewport (max. 620 px) die Szenennavigation und der KI-Inspektor in den normalen Dialogfluss gesetzt. Der KI-Inspektor bleibt vorhanden; ein zusaetzlicher Tastaturtest soll Oeffnen/Schliessen pruefen.
- [Zwischenlauf #40462693887](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40462693887) **FAIL**: Die bisherige klebende Dialog-Kopfzeile verdeckte nun 19 Navigationsziele (z. B. y=16–81). Deshalb wird auch die Kopfzeile bei schmalem Zoom nicht mehr fixiert; sie bleibt per Scrollen, Tab und Escape erreichbar.
- **Korrektur-HEAD vor abschliessender Dokumentation:** `178ed9d98319533c0a9e54b96c8c687f2f19f066`. [Browser-CI #40462905790](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40462905790) wurde angestossen; **Ergebnis nicht vorweggenommen**. [Quell-CI #40462905788](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40462905788) **PASS**. [Release-Matrix #40462905824](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40462905824) weiterhin **BLOCKED**.

Die technischen Funde sind reproduzierbar. Die endgueltige Aussage ueber 175 % und 200 % sowie ueber die KI-Dialogbedienung darf erst nach erfolgreicher Browser-CI getroffen werden. BAR-01 und BED-03 bleiben gesperrt.


## Nachpruefung und dynamische Zwischenbilder (27.10.2026)

Die als PENDING dokumentierte zweite Layoutkorrektur hatte im Lauf
[Chromium #40462905790](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40462905790)
noch **FAIL**. Erst die spaetere korrigierte Fassung auf HEAD
`b4f5060103c0aea97783b604e0bf57c348a3bb1c` bestand in
[Chromium #40463849844](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40463849844)
die gesamte Browserkette: je **451/451** per Tab erreichte und an fuenf
Punkten treffbare Elemente bei echtem 175-%- und 200-%-Zoom,
**0 verdeckte**, **0 schwache Fokuskontraste**, berechnetes Minimum **6,90:1**.
Der KI-Inspektor wurde in beiden Zoomstufen mit Tab/Enter geoeffnet und
geschlossen. [Quell-CI #40463850060](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40463850060)
**PASS**; [Gesamtmatrix #40463849996](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40463849996)
**BLOCKED**, weil weitere Releasepflichten offen sind.

Die zusaetzliche Zwischenbildpruefung ruft die bestehenden echten
Tastatur-Spielpfade auf und kontrolliert nach jedem Abschnitt mit
`scrollIntoView` und fuenf `elementFromPoint`-Proben alle aktuell
bedienbaren Dialogelemente. Die optionalen Pruefpunkte in den Rohrnetz-
und Feuerwehr-Helfern aendern die Spielaktionen nicht.

- **[Chromium #40464603905](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40464603905) PASS** auf `b1872e4000f8e4da6793eb099ea7b162856b0cd5`.
- **26 dynamische Messpunkte**: 3 Rohrabschnitte + 1 Rohrnetz-Endbild,
  1 Feuerwehr-Fehlversuch + 3 Loeschabschnitte + 1 Feuerwehr-Endbild,
  4 Bohrspiel-Zustaende, jeweils bei 175 % und 200 %.
- **324 kontrollierte Bedienelement-Vorkommen**, **0 nicht treffbar**,
  **0 Pixel horizontaler Ueberlauf** an den gemessenen Stellen.
  Wiederholte Elemente werden pro Zwischenbild erneut geprueft; dies
  sind keine 324 unterschiedlichen Funktionen.
- Ein anschliessender Commit `03be39192df5bab7c58807df4dd09124bf8188de`
  erzwingt zusaetzlich die Anwesenheit aller sieben Rohrnetz-/Feuerwehr-
  Zwischenpruefpunkte je Zoomstufe. Seine abschliessende CI muss
  gesondert geprueft werden.

**Grenzen:** Nur aktuelle, technisch erkennbare Bedienelemente nach
realen Aktionen. Die Messung ersetzt weder die pixelbasierte
Text-/Animationspruefung noch vollstaendige Sieg-/Niederlagenpartien.
**BAR-01/BED-03 und die Gesamtfreigabe bleiben BLOCKED.**
Persoenliche Sicht- und Kubuntu-Abnahme erst nach allen technischen Gates.
