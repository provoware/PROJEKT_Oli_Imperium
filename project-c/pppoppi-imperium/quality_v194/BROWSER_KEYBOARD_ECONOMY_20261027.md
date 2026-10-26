# Projekt C – Tastatur-Wirtschaftskette (27.10.2026)

## Zweck und Abgrenzung
Die bisherige Wirtschaftspruefung benutzte Mausklicks, waehrend die
Tastaturpruefungen sich auf Navigation und Minispiele konzentrierten.
Dieses Paket prueft eine vollstaendige wirtschaftliche Teilkette
(Gutachten, Kauf, Bohrung, Foerderung, Transport, Angebot, Vertrag,
zwei Monatsabschluesse und Export) mit echten Tab-/Enter-Ereignissen.
Zwei abgewiesene Aktionen duerfen den Spielstand nicht veraendern.

Die Szene wird weiterhin ueber die vorhandene Navigations-API geoeffnet.
Der Dateiimport wird mit Playwright eingespeist und **nicht** als
Tastaturbedienung ausgegeben. Die CSS-Bildbereiche 800x600 und 400x300
sind **kein** Nachweis fuer nativen Browserzoom bei 200 %.

## Reproduktion
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_keyboard_economy_v194.py
```

Der Test erstellt ausschliesslich einen temporaeren Offline-Aufbau aus
den 110 unveraenderten, per SHA-256 geprueften Quellen. Er prueft
Spielkern-Validierung nach jeder Aktion, Vertragserfuellung ohne
Doppelbuchung, JSON-Roundtrip und Fortsetzung im dritten Monat sowie
fehlende externe Anfragen und JavaScript-Fehler.

## Pruefstand
**NEU / CI AUSSTEHEND** – dieser Bericht behauptet vor Ausfuehrung
keinen erfolgreichen Test. Die Gesamtsperre bleibt bestehen.
Vorpruefung: main `d3dc371154cc1089e06f34d0dc4ff04047132360`;
Ausgangsbasis PR #72 `c054b3d1835cf8bd17ec49b0a9be2a1e8bc9c472`.
Alle Aenderungen liegen ausschliesslich auf einem separaten Zweig.
Keine Originaldatei, kein main, kein Release.

## Offene technische Pflichten
- BED-02: noch nicht alle weiteren Dialogaktionen und Fehlerpfade.
- BED-03: nativer Zoom 175–200 % und dessen Funktionspruefung.
- BAR-01/BAR-02: Fokuskontrast, reale Fokusfolge und weitere Zustandswechsel.
- Vollstaendige Sieg-/Niederlagenpartien, Speicher-/Leistungs- und Releasegates.

## Naechste drei Schritte
1. Neuen Browserlauf auf dem finalen Commit auswerten und Fehler korrigieren.
2. Noch ungetestete Dialogaktionen und fehlerhafte Eingaben systematisch erfassen.
3. Nativen Zoom und Fokuskontrast mit geeigneten, getrennten Nachweisen pruefen.

**Empfehlung:** Nur nach wirklich gruener CI einen PARTIAL-Nachweis in
der Pflichtmatrix ergaenzen; BED-02 nicht vorzeitig auf PASS setzen.
