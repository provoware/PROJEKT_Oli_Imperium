# OLI V1.9.4 – Tastaturpflicht: Kopfzeile und Hilfedialog (02.11.2026)

**Repository:** provoware/PROJEKT_Oli_Imperium · **Entwicklungszweig:** test/oli-campaign-24-60-20261101 · [Draft-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). **Kein Merge, kein Release, keine persoenliche Endabnahme.**

## Verifizierter Ausgangsstand

[GitHub-Kampagnenlauf #41429957674](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41429957674) auf **92df415e2ab15df48e391e53079489e64cd581b6**: **18/18 Jobs SUCCESS**, darunter 175-/200-%-Tab-Pruefungen und native Dateiimporte. Diese Tests decken 14 wichtige Kampagnenkontrollen ab, aber **nicht** die Kopfzeile und den Hilfedialog.

## Neues Pflichtarbeitspaket (BED-02 / BED-03)

- Eigenstaendiger Browserpruefer: test_browser_header_keyboard_v194.py.
- Native Chromium-Vergroesserung **175 % und 200 %**, jeweils **800x600**. Kein CSS-Ersatzzoom.
- Kopfzeilen-Schalter #zonesBtn und #soundBtn je zweimal ueber echte Tab-/Shift+Tab-/Enter-Eingaben aktivieren; aria-pressed muss bei jeder Aktivierung wirklich wechseln.
- #helpBtn per Tastatur oeffnen, #closeBtn per Tastatur schliessen. Eindeutiger sichtbarer Fokus, berechneter CSS-Fokusring und unversperrte Bildschirmposition werden mit den bestehenden strengen Pruefern kontrolliert.
- Keine automatische Fokussetzung, kein direkter Mausklick, kein Spielstand-Eingriff; JS-Fehler, externe Netzwerkanfragen, horizontaler Ueberlauf und veraenderter Spielstand fuehren zu FAIL.
- Sechs isolierte Python-Tests pruefen beide Umschaltrichtungen, fehlerhafte/fehlende Attribute, ausbleibende Umschaltung, echten Tastaturpfad, Abbruch bei fehlendem Fokus und unzulaessige Zoomwerte.

## Status und Reproduzierbarkeit

| Teilpflicht | Ergebnis |
|---|---|
| Bestehende Kampagnen-CI auf Ausgangs-HEAD | **PASS 18/18** |
| Neue sechs isolierte Tests (lokal mit Testdoppeln fuer externe Helfer) | **PASS 6/6** |
| Neue Python-Syntaxpruefung | **PASS** |
| Neue Chromium-Tests 175/200 % auf neuem HEAD | **PENDING** bis GitHub-CI beendet |
| Vollstaendige Tastaturnavigation aller Szenen | **BLOCKED**, durch diesen Teilnachweis nicht erledigt |
| Gesamtmatrix | **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52** |

Aus der Repository-Wurzel:

~~~bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_header_keyboard_unit_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_header_keyboard_v194.py --zoom 175
python3 project-c/pppoppi-imperium/quality_v194/test_browser_header_keyboard_v194.py --zoom 200
~~~

**Freigabesperre:** Die persoenliche Sichtpruefung und der Kubuntu-Praxistest erfolgen erst nach allen technischen Pflichten und eingefrorenem Kandidaten. Kein automatischer Merge und kein Release.

**Naechste drei Schritte:** (1) neue drei CI-Jobs auf endgueltigem HEAD pruefen und echte Fehler korrigieren; (2) #motionBtn, weitere Kopfzeilenaktionen und Minispiel-Dialoge in echte Tastaturpfade aufnehmen; (3) Performance-, Archiv-, Bewertungs- und Rechtepflichten getrennt weiterbearbeiten.
