# Projekt C – Offline-Browser-Rundlauf (25.10.2026)

**Status vor CI:** Test implementiert, GitHub-Ausführung noch zu prüfen; keine Freigabe.
**Basiskette:** Entwurfs-PR #45, `687be1dd6ff9f517493d824814c7d2159bceaf43`.
**Entwicklungszweig:** `agent/prerelease-c-browser-roundtrip-20261025-1735`.
**Schreibgrenze:** nur dieser getrennte Zweig; unveränderte 110 Originaldateien in `SPIEL/`, keine echten Spielstände, kein Merge.

## Zweck und konkret prüfbare Fälle

Der Browser-Test `test_browser_roundtrip_v194.py` erzeugt die technische Fassung aus den verifizierten Quellen **ausschließlich in einem neuen temporären Verzeichnis**. Chromium öffnet die dortige `index.html` als echte lokale `file://`-Datei, nicht als eingebettetes HTML. Der Test prüft:

1. Start ohne vorhandenen Spielstand und korrekte Trennung von Spielkern V1.9.3 und Prüfschicht V1.9.4.
2. Startdialog über Tastatur (Fokus und Enter), neue Partie mit zwei Computergegnern.
3. Tatsächlicher Monatsabschluss und Übergang in den zweiten Monat.
4. Seitenbreite bei **800 × 600** ohne horizontalen Überlauf (nur dieser Einzelzustand, kein umfassender Skalierungstest).
5. Spielstandexport als Browser-Download; vollständiger Vergleich des JSON-Zustands.
6. **Neue Browser-Sitzung** ohne alten Arbeitsspeicher; Import des Downloads und vollständiger Zustandsvergleich.
7. Beschädigte JSON-Datei wird zurückgewiesen; der bereits geladene Spielstand bleibt unverändert.
8. Keine JavaScript-Laufzeitfehler und keine externen HTTP-Anfragen während der Spielprüfung.

Die Prüfumgebung installiert Chromium und Playwright nur auf dem GitHub-Testrechner; **das Spiel selbst bleibt offline und benötigt diese Programme nicht**. Temporäre Testdaten werden beim Verlassen gelöscht. Der Test schreibt keine Screenshots, keine Dateien in `SPIEL/` und keine persönlichen Spielstände.

## Reproduzierbarer Aufruf

```bash
python3 -m pip install playwright==1.56.0
python3 -m playwright install chromium
python3 project-c/pppoppi-imperium/quality_v194/test_browser_roundtrip_v194.py
```

GitHub führt diesen Ablauf mit den nötigen Chromium-Systempaketen über `.github/workflows/prerelease-browser-project-c.yml` aus. Die vorhandenen Quell-/Fachtests und die absichtlich sperrende Gesamtmatrix bleiben unverändert.

## Grenzen und Vorrelease-Pflichtmatrix

**Bis zum belegten erfolgreichen Browserlauf keine Status-Hochstufung.** Matrix weiterhin **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED**. Besonders `SPE-01`, `VER-03`, `BED-02` und `GRA-03` benötigen weitere unabhängige Nachweise. Ein grüner Teiltest ist keine vollständige Freigabe.

Nicht geprüft: vollständige menschliche Partie bis Sieg/Verlust, alle Speicher-Versionen, mehrfache defekte Dateien, 175–200 % Zoom, komplette Tastaturbedienung, Langzeit-Performance, C64-Originalvergleich, Rechte und physische Stromausfälle. Benutzer-Sichtprüfung und Kubuntu-Praxistest erst nach allen technischen Pflichten am eingefrorenen Kandidaten.

## Nächste konkrete Arbeit

1. Echte CI-Ergebnisse und Fehlermeldungen des Browserlaufs auf dem endgültigen Zweig-HEAD prüfen; Fehler gezielt beheben.
2. Danach 800×600 in allen Dialogen sowie 175–200 % Zoom und Tastaturpfade automatisiert messen und gegebenenfalls die **erzeugte Technikfassung** korrigieren, nicht die Originalquellen.
3. Anschließend längere reale Browserpartien mit Speichern, Neustart und fortgesetzten Monatsbuchungen prüfen.

**Kein Release, kein ungeprüfter Merge, keine persönliche Endabnahme.**
