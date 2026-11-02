# OLI V1.9.4 – Bewegungsschalter, Tastatur und dauerhafte Einstellung (02.11.2026)

**Repo:** provoware/PROJEKT_Oli_Imperium · **Zweig:** `test/oli-campaign-24-60-20261101` · [Entwurfs-PR #155](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/155). Keine Freigabe.

## Ausgangslage und Ziel
Die [Kopfzeilen-CI #41438727245](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/41438727245) ist auf HEAD `8ad25061adbe425689c6b8169fbecaf4e5d104ce` **3/3 PASS** (175 %, 200 % und Unit). Die bisherige Tastaturpruefung umfasste Hotspots, Ton, Hilfe und Dialogschliessen; der vorhandene Bewegungsschalter `#motionBtn` fehlte.

## Neue Pflichtpruefung (BED-02/BED-03)
- Echte Chromium-Vergrösserung 175/200 %, Fenster 800x600.
- `#motionBtn` zweimal nur mit Tab, Shift+Tab und Enter bedienen; sichtbarer Fokus, berechneter CSS-Ring und unverdeckte Schalterposition sind Pflicht.
- Vorher/Nachher `aria-pressed` muss gueltig und geaendert sein. `localStorage['pppoppi-motion-enabled']` und sichtbarer Schaltertext muessen exakt zum Zustand passen.
- Seite neu laden; Zustand muss aus der gespeicherten Einstellung wiederhergestellt sein. Keine Partie erzeugen, keine externe HTTP-Anfrage und kein JavaScript-Fehler.
- Drei neue isolierte Negativ-/Regressionstests: gueltige Werte, fehlender/widerspruechlicher Speicher, widerspruechliche Beschriftung.

## Reproduzieren
```bash
python3 -m unittest discover -s project-c/pppoppi-imperium/quality_v194 -p 'test_header_keyboard_unit_v194.py' -v
python3 project-c/pppoppi-imperium/quality_v194/test_browser_header_keyboard_v194.py --zoom 175
python3 project-c/pppoppi-imperium/quality_v194/test_browser_header_keyboard_v194.py --zoom 200
```

**Status bei Erstellung:** Implementierung vorbereitet; neue GitHub-CI **PENDING** bis die drei Jobs auf dem neuen HEAD wirklich abgeschlossen sind. Bestehende Quelloriginale, Spielregeln und Save-Schema unveraendert. **Matrix 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED.** Keine persoenliche Sicht-/Kubuntu-Endabnahme, kein Merge, kein Release.

**Naechste Schritte:** (1) CI der drei Jobs auswerten und Fehler korrigieren; (2) fehlende Dialog-/Minispielaktionen abdecken; (3) unabhaengige Performance-, Archiv- und Rechtepflichten fortsetzen.
