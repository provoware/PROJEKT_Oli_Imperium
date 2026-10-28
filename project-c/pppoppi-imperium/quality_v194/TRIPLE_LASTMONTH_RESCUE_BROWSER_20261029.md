# Vorrelease-Pflichtpaket: drei gemischte Schlussmonatsrettungen

**29.10.2026, 00:38 MEZ.** Projekt C, PPPOPPI IMPERIUM V1.9.4-Technikfassung. **Kein Release, keine Originaltreue-Freigabe.**

## Verbindliche Vorpruefung

- GitHub-`main`: `d3dc371154cc1089e06f34d0dc4ff04047132360` (nicht veraendert).
- Vorheriger [Entwurfs-PR #121](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/121), HEAD `11392dfaee01c80fcd4c7fc015daf69c68ca483a`.
- Auf diesem HEAD: [Browser-CI #40781944543](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40781944543) **8/8 PASS**, [Doppelsanierungs-CI #40781944389](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40781944389) **PASS**, [Quell-CI #40781944442](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40781944442) **PASS**; [Gesamtgate #40781944505](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40781944505) **FAIL/BLOCKED** wegen offener Pflichten.
- AGENTS.md, README, A/B-Forschungsgrenze, 52er-Matrix, Roadmap, vorhandene Browser-/Engine-Sanierungstests und Wirtschaftskern geprueft.
- Keine Ueberschneidung mit Top-5-Repositories; keine Aenderung an den 110 manifestgeschuetzten Originaldateien.

## Risiko und Soll

Der bisherige Endspieltest prueft **zwei** Insolvenzen mit Kredit und Neustart. Ungeprueft ist, ob **drei** Firmen im letzten Monat gleichzeitig insolvent werden koennen und **Notverkauf, Kredit und Neustart** mit echten Unterbrechungen korrekt verkettet werden. Kritisch sind voreilige Endwertung, doppelte Rettungsbuchung, Verlust offener Insolvenzen, Fremdverkauf und zusaetzliche Monatsabschluesse.

## Umsetzung / Abnahmekriterien

- Neuer Test: `quality_v194/test_browser_campaign_triple_lastmonth_v194.py`.
- 4 menschliche Firmen, 11 regulaere Monatswechsel, im 12. Monat jeweils acht echte UI-Wirtschaftsaktionen fuer H1/H2/H3 auf getrennten Claims (24 Klicks, keine manipulierten Spielstaende).
- Schlussmonatsabrechnung erzeugt `rescueIds = ["H1", "H2", "H3"]` und genau 12 Monatsberichte.
- H1: **Notverkauf**; H2/H3 bleiben offen. Versionierter Sitzungsexport, echter Chromium-Prozessneustart und verlustfreie Wiederherstellung.
- H2: **Rettungskredit**; H3 bleibt offen. Zweiter Export und Prozessneustart.
- H3: **Sanierungsneustart**; erst jetzt einmalige Abschlusswertung und unveraenderliches Archiv. Dritter Export und vierter Chromium-Prozess zur Archivkontrolle.
- Pruefungen auf 800x600, Offlinebetrieb, JavaScript-Laufzeitfehler, eindeutige Verkaufs-/Kredit-/Neustartbuchungen und keine 13. Monatsabrechnung.
- Neuer isolierter Workflow `.github/workflows/prerelease-triple-lastmonth.yml`. Unveraenderte Regressionen und Quell-CI laufen weiterhin.

## Pruefstatus

| Pflicht / Test | Ergebnis |
|---|---|
| Bestehende Browser-CI auf #121 | PASS 8/8 (Link oben) |
| Bestehende Quell-CI auf #121 | PASS (Link oben) |
| Neuer Dreifach-Browsertest | **PASS** – [GitHub-CI #40789090475](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789090475), 158 PASS-Zeilen, 4 Chromium-Prozesse, HEAD `a7d4f965df9ac499c2563456ffe9d63575df198d` |
| Acht bestehende Browserjobs | **6/8 PASS, 2 noch laufend** – [Browser-CI #40789090318](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789090318) auf `a7d4f965…`; finalen HEAD erneut pruefen |
| Quellschutz und vorherige Doppelsanierung | **PASS** – [Quell-CI #40789090366](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789090366), [Doppelsanierung #40789090369](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789090369) |\n| Historische C64-Referenz und Ressourcenrechte | **BLOCKED/OPEN** |
| Technisches Vorrelease-Gesamtgate | **BLOCKED** |

**Pflichtmatrix:** `6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52`. Neuer **technischer Teilnachweis** fuer `LOG-05`, `VER-01`, `VER-02`, `SPE-03`, `TES-03` durch den erfolgreichen isolierten Browsertest; **kein Statuswechsel vor Abschluss aller Gate-Anforderungen**. Nach Dokumentations-Commit muss die CI auf dem finalen HEAD erneut ausgewertet werden.

## Naechste drei Schritte

1. GitHub-CI auf dem tatsaechlichen neuen HEAD auswerten, Fehler beheben und die Nachweise mit Links und SHA ergaenzen.
2. Unterbrechungen direkt waehrend Import/Export sowie Speicherfehler bei drei offenen Sanierungen absichern.
3. Vollstaendige Wirtschafts- und Minispielpfade, Ressourcen-/Rechtepruefung und historische Originalreferenz getrennt weiter bearbeiten.

**Empfehlung:** Bei fehlgeschlagenem Teiltest keine Scheinfreigabe; unabhaengige Aufgaben bleiben bearbeitbar. Persoenliche Sichtpruefung und Kubuntu-Endabnahme erst nach gruenen technischen Pflichtgates und eingefrorenem Kandidaten. **Kein Merge und kein Release ohne ausdrueckliche Nutzerfreigabe.**
