# Deterministische Animationsphasen bei echtem Browserzoom – 27.10.2026

**Projekt:** PPPOPPI IMPERIUM V1.9.4-Pruefschicht, unveraenderter V1.9.3-Spielkern. **Teilnachweis fuer BED-03; keine technische Gesamtfreigabe, kein Merge, kein Release.**

## Ausgangslage und isolierte Aenderung

- Vorheriger Entwicklungsstand: [Entwurfs-PR #84](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/84), HEAD `845decb124a18526c6bb43f7da20a5bf392e1219`.
- Neuer gestapelter [Entwurfs-PR #85](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/85), Zweig `automation/prerelease-animation-phases-20261027-1238`.
- Gepruefter Hauptzweig: `d3dc371154cc1089e06f34d0dc4ff04047132360`; keine Aenderung an `main` oder den 110 inventarisierten Spieloriginalen.
- Neue Pruefdatei `quality_v194/test_browser_animation_phases_v194.py`; eingebunden in den bestehenden Browser-Workflow. Die Vorrelease-Pflichtmatrix und der maschinenlesbare Teilnachweis wurden aktualisiert.

## Technische Pruefmethode

Der neue Playwright-Test baut die hash-/manifestgepruefte Offline-Vorschau und startet Chromium mit **800 x 600 Pixel Ausgangsfenster**. Eine temporaere Chromium-Erweiterung stellt per `chrome.tabs.setZoom/getZoom` den **echten Browserzoom 175 % und 200 %** ein. Alle 39 registrierten Szenen werden geoeffnet.

Fuer Animationsziele innerhalb des Dialoginhalts liest der Test die Web-Animations-Zeitangaben aus. Er pausiert die gefundenen Animationen, setzt sie reproduzierbar auf **acht Zeitphasen je animierter Szene** (bei Mehrfachlaeufen auch in der zweiten Bewegungsrichtung), misst Textrechtecke und Wort-Treffpunkte und stellt den vorherigen Wiedergabezustand wieder her. Eine synthetische Animation belegt, dass das Zeitversetzen die Geometrie tatsaechlich aendert. Die bereits vorhandenen positiven und negativen Text-Ueberdeckungskontrollen laufen ebenfalls.

**Pruefbefehl:** `python3 project-c/pppoppi-imperium/quality_v194/test_browser_animation_phases_v194.py`

## Tatsaechliche GitHub-Ergebnisse auf dem getesteten Code-HEAD

**Getesteter Code-HEAD:** `120bd650cea72f8be06582b5bcdba9e28d6455e4`.

- [Chromium-Rundlauf #40497893039 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40497893039), inklusive des neuen Animationsschritts.
- [Quell- und Fachpruefung #40497893005 – PASS](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40497893005).
- [Integrierte Vorrelease-Sperre #40497892973 – Gesamtgate BLOCKED](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40497892973). Die offenen Pflichten werden nicht stillschweigend freigegeben.

| Messwert | 175 % | 200 % |
|---|---:|---:|
| Registrierte Spielszenen | 39 | 39 |
| Szenen mit geeigneten Dialoganimationen | 11 | 11 |
| Erkannte Animations-Vorkommen | 29 | 29 |
| Deterministische Phasen je animierter Szene | 8 | 8 |
| Phasenpruefungen insgesamt | 88 | 88 |
| Fliesstextmessungen | 352 | 352 |
| Wort-Treffpunkte | 7.488 | 7.536 |
| Gemessene Textfehler | 0 | 0 |

**Weitere positive Kontrollen:** synthetisches Zeitversetzen, vorhandene kuenstliche Textueberdeckungen, unveraenderter Wirtschaftszustand und keine externen HTTP-Anfragen.

## Grenzen und naechste Pflichtarbeit

Acht Phasen sind **kein lueckenloser Verlauf** und kein Pixelvergleich. Die 29 Vorkommen sind Animationsobjekte, nicht 29 getrennt vollstaendig durchgespielte Animationen. Der Test erfasst Animationsziele im gerade geoeffneten Dialog; bewegte Spieloberflaechen ausserhalb dieses Bereichs und manche Minispielzwischenzustaende fehlen. Keine Freigabe der gesamten Bedienbarkeit oder des Spielendes. **BED-03 bleibt BLOCKED. Matrix unveraendert: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persoenliche DEFERRED.**

Naechste drei Pflichtpakete:
1. Weitere dynamische Minispiel-/Dialogzustaende und Tastatur-/Fehleraktionen bei echtem Zoom abdecken.
2. Vollstaendige regulaere Sieg- und Niederlagenpartien mit Spielstand-Neustart nachweisen.
3. Restliche technische Pflichtgates und Release-Dokumentation schliessen; danach Kandidat einfrieren.

**Persoenliche Sichtpruefung, Kubuntu-Praxistest und Nutzerfreigabe ausschliesslich nach Abschluss der eigenstaendig moeglichen Technikpruefungen. Kein Release ohne ausdrueckliche Freigabe.**
