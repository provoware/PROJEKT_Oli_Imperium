# Projekt C – zwei menschliche Firmen, Spielerwechsel und getrennte Sanierung (26.10.2026)

## Auftrag und Herkunft

- **Spiel:** PPPOPPI IMPERIUM, isolierte Technikvorschau V1.9.4 über dem V1.9.3-Spielkern; keine Aussage über historische C64-Originalregeln.
- **Basis:** [PR #53](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/53), geprüfter Ausgangs-HEAD `a1ba46f56d01f1dba90d1d718fdc6a0c7e0eff99`.
- **Entwicklungszweig:** `agent/prerelease-c-two-human-rescue-20261026-0530`. Den **finalen** HEAD und aktuelle CI bitte im zugehörigen Entwurfs-PR nachlesen; ein positiver Teiltest ist keine Gesamtfreigabe.
- **Pflicht-IDs:** `LOG-04`, `VER-02`, `SPE-01`, `FEH-03`, `TES-04` (nur Teilabdeckung).
- **Änderungen:** Neuer [Chromium-Test](test_browser_two_humans_v194.py), Ergänzung des bestehenden Chromium-Workflows, dieser Bericht. Keine Veränderung an den gegen das Originalarchiv geprüften 110 Quelldateien, produktiven Spielständen, `main` oder Top-5-Repositories.

## Reproduzierbarer Browserablauf

1. Frische Partie mit **zwei menschlichen und zwei Computerfirmen** (`2-2`), Offline-Dateistart bei **800 × 600**.
2. Mensch H1 führt acht sichtbare Wirtschaftshandlungen an `BERLIN-1` und `NORD-1` aus. Ziel: 60.000 Cent Kasse, 15 verbrauchte Spieltage.
3. H1 beendet den Zug: **noch keine Monatsabrechnung**; vertrauliche Übergabe ist aktiv. H2 bestätigt den Spielerwechsel ausdrücklich.
4. Mensch H2 führt acht unabhängige Wirtschaftshandlungen an `BERLIN-2` und `NORD-2` aus. H1s Eigentum bleibt erhalten. Ziel: ebenfalls 60.000 Cent Kasse und 15 Spieltage.
5. H2 beendet den Zug; die beiden Computerfirmen handeln. **Ein** regulärer Monatsabschluss erzeugt für H1 und H2 jeweils **80.000 Cent** unbezahlte Verpflichtungen und `rescueIds = ["H1", "H2"]`. Kein künstliches Setzen von Geld, Schulden oder Spielphase.
6. H1 nimmt einen Rettungskredit auf: H1 wird aus der Sanierung entfernt, H2 bleibt sanierungspflichtig. Kredit wird genau einmal gebucht.
7. H2 wählt den Sanierungsneustart: H2 startet Generation 2 mit 15.000.000 Cent; H2-Felder werden freigegeben, H1-Felder und Kredit bleiben erhalten.
8. Export, vollständiges Schließen des Browserkontexts, Import in frischem Kontext und Folgemonat: Identität der Wirtschaftsdaten, keine zweite Kreditbuchung und kein zweiter Monatsabschluss.

**Sicherheitsgrenzen:** Test erzeugt und entfernt ein temporäres Build-Verzeichnis, benutzt keine produktiven Spielstände und prüft externe HTTP-Anfragen sowie JavaScript-Laufzeitfehler. Es werden keine C64-Originalregeln bestätigt.

## Prüfstand und Status

- **Statische Sichtprüfung:** Test- und Workflow-Dateien anhand des vorhandenen Spielkerns und des vorherigen Browser-Szenarios erstellt; dies ist **kein** PASS-Nachweis.
- **Chromium-Regression:** **PENDING** bis der Workflow auf dem endgültigen PR-HEAD tatsächlich abgeschlossen ist. Bei Fehlern `FAIL` dokumentieren und gezielt korrigieren.
- **Quell-/Fachprüfungen:** **PENDING** bis die GitHub-Prüfkette für den finalen HEAD abgeschlossen ist.
- **Vorrelease-Matrix:** unverändert **6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche DEFERRED**. Alle genannten IDs bleiben gesperrt, bis ihre vollständige Pflichtabdeckung nachgewiesen ist.

## Offene Pflichtarbeit und nächste Implementierungen

1. **LOG-04 / VER-02:** Ergebnis des Zwei-Menschen-Browsertests auswerten; anschließend weitere Kombinationen mit zwei gleichzeitig überschuldeten Firmen, Notverkauf und mehrfachem Rettungskredit testen.
2. **SPE-03 / FEH-03:** Wiederholte Imports und Unterbrechungen vor/nach Monatsabschluss auf Doppelbuchungen und Datenintegrität prüfen.
3. **BED-03 / BAR-01 / PER-01:** Nativen Browserzoom bei 175–200 %, durchgehende Tastaturbedienung und reproduzierbare Start-/Langzeitmessungen prüfen.

**Kein Merge und kein Release.** Persönliche Sichtprüfung und Kubuntu-Praxistest erst nach vollständiger technischer Freigabe und eingefrorenem Kandidaten. Veröffentlichung nur mit ausdrücklicher Nutzerfreigabe.
