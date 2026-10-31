# Vorrelease-Teilpaket: Sitzungsschutz bei drei gleichzeitigen Insolvenzen

**29.10.2026, 01:33 MEZ.** Projekt C, PPPOPPI IMPERIUM V1.9.4-Technikfassung. Kein Merge, kein Release, keine C64-Originalfreigabe.

## Verbindliche Vorpruefung

- GitHub-`main` unveraendert: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Basis: [Entwurfs-PR #122](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/122), HEAD `2b91b5e053101157043999384b3475e33b013429`; neuer Entwicklungszweig `automation/v194-triple-rescue-import-guard-20261029-0133`.
- Vorheriger HEAD **vollstaendig PASS**: [Dreifachrettung #40789451024](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789451024), [Quellschutz #40789451071](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789451071), [Browserregression #40789451054](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789451054) **8/8 PASS**; [Gesamtgate #40789451037](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40789451037) **FAIL/BLOCKED** wegen offener Release-Pflichten.
- AGENTS.md, README.md, A/B-Quellenabgrenzung, docs/03–05, CONTRIBUTING.md, 52er-Matrix, vorhandene Sitzungs-, Speicherabbruch- und Browser-Endpartientests gelesen.
- Keine Ueberschneidung mit Top-5-Aufgabe, kein Eingriff in 110 manifestgeschuetzte Originaldateien.

## Risiko und erwartete Wirkung

Die vorhandene Endpartie beweist drei Rettungswege und drei gueltige Exporte. Noch nicht speziell nachgewiesen ist, dass **drei gleichzeitig offene Sanierungen** bei unvollstaendiger, widerspruechlicher oder zu grosser Sitzungsdatei unveraendert bleiben und ein **verspaeteter gueltiger Import** nach echtem Rettungsklick keine bereits gebuchte Sanierung zurueckrollt.

**Geplante Wirkung:** Importfehler oder asynchrone Reihenfolge duerfen weder `rescueIds`, Geld, Journal, Eigentum, Monat noch Endarchiv veraendern. Nur die fiktive Adaption wird geprueft, keine historische C64-Regel.

## Umsetzung und konkrete Abnahmekriterien

- Erweiterung `quality_v194/test_browser_campaign_triple_lastmonth_v194.py` im bestehenden isolierten Chromium-Workflow.
- Nach **12 echten Monatsabrechnungen und 24 Wirtschaftsaktionen** liegen `["H1","H2","H3"]` als offene Sanierungen vor.
- Ueber `#loadSessionFile` drei ungueltige Dateien einlesen: abgeschnittenes JSON, gleichzeitig aktiver Zustand und gefaelschtes Archiv, 5.000.001-Byte-Datei.
- Nach jeder Ablehnung: Spielstand exakt gleich, drei Sanierungen offen, Endspielstatus aktiv, Archiv leer; anschliessend Wirtschaftskernvalidierung.
- Gueltigen alten Sitzungsimport gezielt beim asynchronen `File.text()` anhalten, **H1 durch echten sichtbaren Notverkauf retten**, verspätetes Dateilesen freigeben und unveraenderten Notverkauf samt genau einer Journalbuchung pruefen.
- Danach die vorhandenen H2-Kredit-, H3-Neustart-, Export-, Browserneustart-, Archiv- und Offlinepruefungen unveraendert fortsetzen.
- Die Dateileser-Verzoegerung ist nur eine kontrollierte Browser-Testinstrumentierung, **kein echter Stromausfalltest**.
- Beim ersten CI-Lauf schlug ein bestehender Zoomtest fehl: bei 200 % wurde das native Datei-Auswahldialog-Ereignis nach starren 200 ms noch nicht beobachtet. Der Test wartet jetzt ereignisbasiert bis maximal 5 Sekunden; ein wirklich fehlender Dialog bleibt ein Fehler.

## Pruefstand beim Einreichen

| Gate | Ergebnis |
|---|---|
| Vorheriger Entwicklungs-HEAD `2b91b5e...`: 8 Browserjobs | **PASS 8/8** (Link oben) |
| Vorheriger Dreifachrettungs- und Quellschutz-Workflow | **PASS** (Links oben) |
| Neuer Importunterbrechungs- und Wettlauftest auf `39aa9118...` | **PASS** – [Dreifachrettung #40795063821](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795063821) |
| Quellschutz und Doppelsanierung auf `39aa9118...` | **PASS** – [Quellschutz #40795063768](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795063768), [Doppelsanierung #40795063707](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795063707) |
| Gesamtbrowser auf `39aa9118...` | **FAIL:** [#40795063868](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40795063868), `native-zoom-regression` bei 200 %: 200-ms-Dateidialogwartezeit verstrichen; restliche Jobs bei Diagnose noch laufend |
| Fehlerbehebung `bc78aeb8...` | **PENDING:** Dateidialog-Ereignis wird vor Enter abonniert und bis zu 5 Sekunden abgewartet; fehlender Dialog bleibt FAIL, kein Ersatz durch verstecktes Dateifeld |
| CI auf finalem Dokumentations-HEAD | **PENDING** – keine Freigabe vor vollstaendigem Gruen |
| Gesamte 52er-Vorrelease-Matrix | **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED** |
| Historische Originalreferenz und Rechtepruefung | **BLOCKED/OPEN** |
| Benutzer-Sichtpruefung / Kubuntu-Endabnahme | **DEFERRED**, erst unmittelbar vor Release |

**Betroffene Pflicht-IDs:** VER-03, SPE-03, SIC-02, TES-03. Die neuen Pruefungen sind nur Teilnachweise und bewirken **keinen vorzeitigen Gate-Statuswechsel**. Endgueltige CI-Ergebnisse, Links und finalen HEAD im PR nachtragen; fehlgeschlagene Pruefungen nicht als PASS melden.

## Naechste drei Schritte

1. Neue GitHub-CI auf dem tatsaechlichen Entwicklungs-HEAD auswerten; gegebenenfalls Fehler beheben, nachpruefen und Nachweise ergaenzen.
2. Weiterfuehrende Mehrfirmen-Import-/Exportgrenzen, Ressourcenrechte, Wirtschafts- und Minispiel-Endpartien nachweisbar pruefen.
3. Historische C64-PAL-Originalreferenz separat anhand freigegebener Quelle verifizieren; persoenliche Endabnahmen erst nach technischem Kandidaten-Freeze.

**Empfehlung:** Solange das Gesamtgate gesperrt ist, nur weitere unabhaengige Pflichtpakete auf getrennten Zweigen vorbereiten; kein Merge und kein Release ohne ausdrueckliche Nutzerfreigabe.
