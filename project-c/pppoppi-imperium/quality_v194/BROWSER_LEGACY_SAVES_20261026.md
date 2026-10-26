# Projekt C – Vorrelease-Pflichtpaket: alte Spielstände (26.10.2026, 08:39 MEZ)

## Ausgangslage und Grenze

- **Ausgangs-HEAD:** `3136f59025047571ea5ed0d0f9628a04a9ecf1a9` (Entwurfs-PR #56).
- **Entwicklungszweig:** `agent/prerelease-c-legacy-saves-20261026-0839`, bewusst auf #56 gestapelt. Keine Änderung an `main` oder den fünf ausgeschlossenen Repositories.
- **Pflichten (Teilnachweis, keine Freigabe):** SPE-02 (Altstände/Versionsmigration), SPE-01 (Rundlauf), FEH-03 (defekte Importe), LOG-05 (Buchungsintegrität), TES-04 (Regression).
- **Risiko:** Alte Dateien könnten beim Einlesen Buchungen verlieren oder fehlerhafte/inkompatible Dateien könnten einen gültigen aktuellen Spielstand verdrängen. Das ist eine zu prüfende Gefährdung, kein behaupteter beobachteter Datenverlust.

## Implementiertes, eng abgegrenztes Paket

1. Neuer echter Chromium-Test `quality_v194/test_browser_legacy_v194.py`. Er erzeugt einen V0.8-Spielstand durch **reguläre Aktionen des unveränderten V0.8-Motors** (Gutachten, Kauf) und importiert ihn über die echte Dateiauswahl der technischen Vorschau.
2. Nach der Migration auf `pppoppi.berlin.save/0.8.2` werden Geld, Schulden, sämtliche Journalbuchungen, Rechnungen, Eigentum, bereits verarbeitete Aktionen und Zähler mit dem alten Zustand verglichen. Export und erneuter Import dürfen keine Buchung wiederholen.
3. Die **unveränderte Original-Beispieldatei** `SPIEL/sample_save_v11.json` (Schema 0.8.2) wird direkt eingelesen. Zustand und Export müssen dem ursprünglichen JSON vollständig entsprechen.
4. Die vorhandene **V0.6-Beispieldatei**, ein strukturell defekter V0.8-Stand und abgeschnittenes JSON müssen abgewiesen werden, ohne den zuletzt gültigen Zustand zu verändern.
5. Prüft außerdem 800 × 600, Offlinebetrieb und JavaScript-Laufzeitfehler. Der vorhandene Chromium-Pflichtworkflow führt den Test als zusätzlichen, unabhängigen Schritt aus.
6. **Keine Änderungen an den 110 geschützten Originaldateien**, keine Änderung der Spielstandsformate oder Wirtschaftsregeln, kein automatisches Speichern, kein Merge.

## Prüfen und nachweisen

```bash
python3 -m py_compile project-c/pppoppi-imperium/quality_v194/test_browser_legacy_v194.py
python3 project-c/pppoppi-imperium/quality_v194/test_browser_legacy_v194.py
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
node project-c/pppoppi-imperium/prerelease/check.mjs --technical
```

Der Chromium-Lauf benötigt Python 3.12, Playwright 1.56.0 und Chromium. Die GitHub-Actions-Umgebung installiert diese Werkzeuge; die CI-Ergebnisse müssen am **endgültigen HEAD** ausgewertet werden. **Status bei Erstellung: Test eingebunden, Browser-/CI-Ergebnis PENDING, kein PASS behauptet.** Das harte Gesamt-Gate bleibt bis zum Abschluss aller technischen Pflichten BLOCKED.

**Wichtige Abgrenzung:** V0.6 wird nur sicher **abgewiesen**, nicht migriert. V0.8 wird für einen dokumentierten regulären Zustand geprüft, nicht für sämtliche denkbaren alten Partien, insbesondere nicht laufende Minispiele, offene Verträge oder Sonderzustände. V0.8.2 wird anhand einer vorhandenen Originaldatei geprüft. Ein vollständiger Kompatibilitätsnachweis und eine automatische Rettung bei Stromausfall sind damit nicht erbracht.

## Nächste drei Arbeiten

1. CI auf dem finalen Implementierungs-HEAD einschließlich aller vorherigen Browserprüfungen kontrollieren, Fehlschläge gezielt beheben und reproduzierbar dokumentieren.
2. V0.8-Migration für offene Verträge, laufende Minispiele, beschädigte Buchungen und andere Randfälle nach fachlicher Entscheidung prüfen; unvermeidbare Inkompatibilität deutlich anzeigen, nicht still verändern.
3. Echte Speicherunterbrechung, Sicherungsrückfall und Langzeit-Integrität separat testen; anschließend nativen Zoom, vollständige Tastaturpfade und Leistungsmessungen abarbeiten.

**Matrix bleibt bis zu unabhängig geprüften Einzelnachweisen: 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED.** Persönliche Sichtprüfung und Kubuntu-Endabnahme erst nach sämtlichen technischen Freigaben und eingefrorenem Kandidaten. Kein Release ohne ausdrückliche Nutzerfreigabe.
