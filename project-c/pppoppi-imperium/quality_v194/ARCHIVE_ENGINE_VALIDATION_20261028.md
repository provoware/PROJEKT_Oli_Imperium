# Vorrelease-Pflichtpaket: Archiv-Schnappschuss gegen den echten Spielkern pruefen

**Datum:** 28.10.2026. **Bereich:** Projekt C / PPPOPPI-Adaption. **Basis:** [PR #109](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/109), Ausgangs-HEAD `5f5d3ce5b63409fb1ddd351c468e0c74cab25bea`; `main` bei Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Nachgewiesene Luecke und Aenderung

Der bisherige Sitzungsadapter hat beim Laden aktiver Partien `engine.validate(state)` ausgefuehrt. Beim Laden **abgeschlossener** Partien wurde dagegen nur `io.importArchive` verwendet. Diese prueft Schema und innere Endabrechnung, aber nicht saemtliche Invarianten der eigentlichen V0.8.2-Engine. Ein in sich stimmiges Archiv mit ungueltigen Marktpreisdaten konnte deshalb als archivierte Sitzung angenommen werden.

In `endstate_session_v194.cjs` prueft der Adapter jetzt nach dem Archiv-Import **zusaetzlich `engine.validate(archived.snapshot)`**, bevor er eine Sitzung annimmt. Dies betrifft den direkten Archivpfad und den verschachtelten Import einer abgeschlossenen Sitzungsdatei. Der Fehler wird abgewiesen, statt die Sitzung teilweise zu uebernehmen. Die originale Engine und ihre 110 geschuetzten Quelldateien bleiben unveraendert.

## Regressionen und Abnahmekriterien

- Neue isolierte Regression: Die Test-Engine lehnt einen Archiv-Schnappschuss mit beschaedigter Integritaetsmarkierung ab, sowohl beim direkten Archiv-Import als auch beim vollstaendigen Sitzungsimport.
- Neue echte Engine-Regression: Ein formal konsistentes Freispiel-Archiv mit entferntem Marktpreisverzeichnis wird von der Archiv-Konsistenzpruefung noch angenommen, aber vom V0.8.2-Spielkern abgelehnt. Der Sitzungsadapter muss beide Importwege abweisen.
- Bestehende Sitzungs-, Kampagnen-, Rettungs-, JSON-, Browser-, Zoom- und Quelltests duerfen nicht regressieren.

**Auszufuehren:** `node --test project-c/pppoppi-imperium/quality_v194/test_endstate_session_v194.cjs`; vollstaendige CI ueber den vorhandenen Workflow `.github/workflows/prerelease-browser-project-c.yml`. Der echte Engine-Test darf auf GitHub **nicht SKIP** melden. CI-Status wird erst nach tatsaechlicher Ausfuehrung bewertet.

## Pflichtmatrix und verbleibende Arbeit

`SPE-03` und `SIC-02` bleiben **BLOCKED**, da dieser gezielte Import-Schutz weder Browserintegration noch vollstaendige Fremddaten-/Endspielpruefung ersetzt. Gesamtmatrix unveraendert: **6 PASS / 39 BLOCKED / 4 OPEN / 3 DEFERRED = 52**. Der getrennte Technikaufbau benoetigt noch den Abschlussdialog, Archivimport und -export, 800x600/Zoom/Tastatur-Tests, vollstaendige Endpartien und Neustart-Nachweise. Historische C64-Originalverifikation bleibt offen.

## Naechste drei Schritte

1. GitHub-CI und beide neuen Regressionen auf finalem Entwicklungs-HEAD pruefen; bei FAIL gezielt korrigieren.
2. Abgesicherten Sitzungsadapter nur im getrennten Technikaufbau an eine bewusst ausgeloeste Endspieloberflaeche anschliessen.
3. Browser-Endpartien einschliesslich Rettung, Gleichstand, Import, Neustart, 800x600 und nativem Zoom reproduzierbar testen.

**Keine vorgezogene persoenliche Abnahme, kein Merge und kein Release ohne ausdrueckliche Nutzerfreigabe.**
