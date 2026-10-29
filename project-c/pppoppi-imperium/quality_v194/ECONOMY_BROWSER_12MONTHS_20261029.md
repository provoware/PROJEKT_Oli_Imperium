# WIR-04 / LOG-02 / LOG-03 / SPE-01 – echte 12-Monats-Wirtschaftspartie im Browser (29.10.2026)

**Geltungsbereich:** Eigenständige Berliner PPPOPPI-Adaption. Dies ist weder ein Nachweis der C64-Originaltreue noch eine Vorrelease-Freigabe.

## Verbindliche Ausgangsbasis

- GitHub-`main` vor dem Lauf: `d3dc371154cc1089e06f34d0dc4ff04047132360`.
- Gestapelte Basis: [Entwurfs-PR #132](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/132), `5123018eb56a1ea5a98ef76a5b57303f8cad2eb2`.
- Dieser Entwicklungszweig: [Entwurfs-PR #133](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/133), `automation/v194-browser-economy-12m-restarts-20261029-1131`.
- Die 110 inventarisierten Originaldateien unter `SPIEL/` bleiben unverändert; die neue Prüfung erzeugt nur temporäre Aufbauten und Sitzungsexporte.

## Testgegenstand

`quality_v194/test_browser_economy_12months_restart_v194.py` startet ein echtes Offline-Chromium-Fenster mit 800×600 und eine neue, unveränderte Kampagne (vier Menschen, zwölf Monate). Wirtschaftliche Befehle werden über sichtbare Schaltflächen ausgelöst, nicht durch direkte Änderung des Spielzustands: Gutachten, Feldkauf, Bohrung, Förderung, Transport, Marktangebot, Vertragsabschluss sowie im Bedarfsfall Brandbekämpfung und Reparatur.

Jeder Monatsabschluss prüft Berichtsanzahl, Spielstandgültigkeit, eindeutige Befehlskennungen und den Abgleich von Geldstand und Buchungsjournal. Nach den Monaten 3, 6 und 9 wird eine echte versionierte Sitzungsdatei heruntergeladen, der Chromium-Prozess geschlossen, ein neuer Prozess gestartet und der Zustand über den Dateidialog exakt wiederhergestellt. Nach Monat 12 werden Endwertung, Abschlussarchiv und Schreibsperre in einem weiteren neuen Chromium-Prozess geprüft. Ziel: fünf Prozesse, vier Importe, vier Exporte.

## Ausführung und bisheriger Befund

- Python-Syntaxprüfung: **PASS** im ersten GitHub-Lauf.
- [Erster Chromium-Lauf #40858543740](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40858543740): **FAIL** im vierten Monat. Bis dahin waren reale Markt-, Förder- und Vertragsaktionen, Monatsabschlüsse 1–3 sowie erster Sitzungsneustart erfolgreich. Ursache: Der neue Test suchte die Schaltfläche `FIRE_EXPERT` fälschlich im Bereich `security`; die echte Oberfläche bietet sie im Bereich `workshop` an. Kein belegter Spielkernfehler.
- Korrektur auf Commit `77dd6498ca8d14adede4af50ae1c33de15fdf1d3`: korrekte Szenenwahl `workshop`; Spielkern und Originaldateien unverändert.
- [Erneuter Chromium-Lauf #40858709316](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40858709316): **PENDING**, Ergebnis nach Abschluss nachtragen.
- Integrierte Vorrelease-Sperre bleibt **BLOCKED**; ein fehlgeschlagenes Gesamtgate ist bis zur Erfüllung aller technischen Pflichten vorgesehen.

## Noch offen

Der Browser-Endtest und die weiteren GitHub-Checks müssen auf dem finalen Implementierungs-HEAD vollständig erfolgreich sein. Weitere unabhängige Pflichten: KI-Firmen in 12-Monats-Endpartien, zusätzliche Wirtschaftsextremwerte, vollständige Raffinerie- und Lieferketten, Rechte für 77 ausgeschlossene Archiveinträge und historische C64-Originalverifikation. Die drei persönlichen Endabnahmen erfolgen erst nach sämtlichen eigenständig möglichen technischen Prüfungen und eingefrorenem Kandidaten.

**Nächste konkrete Implementierung:** Den vollständigen Chromium-Lauf auswerten und mögliche Test-/Spielkernfehler beheben; anschließend eine zwölfmonatige Partie mit zwei Menschen und zwei KI-Firmen samt Export/Import und Vergleich der wirtschaftlichen Endwerte prüfen. Kein Merge, kein Release.
