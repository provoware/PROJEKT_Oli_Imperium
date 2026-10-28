# Vorrelease-Pflichtpaket: isolierter Endarchiv-Import und Konsistenzpruefung

**Datum:** 28.10.2026. **Bereich:** Projekt C / eigenstaendige PPPOPPI-Adaption. **Basis:** [PR #107](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/107), Entwicklungs-HEAD `0e6fd5888731e523a883b4e7f2bc0c14a1619c81`. **main** bei Vorpruefung: `d3dc371154cc1089e06f34d0dc4ff04047132360`.

## Warum diese Arbeit vor der Oberflaechenintegration notwendig ist

Der isolierte Endregel-Prototyp aus PR #107 erzeugt ein Archiv, dessen JSON-Kopie nach dem Einlesen nicht mehr schreibgeschuetzt ist. Ohne eigene Importpruefung koennten nachtraeglich veraenderte Sieger, Rangfolgen oder Abschlussmonate als scheinbar gueltige Endabrechnung erscheinen. Dieses Paket fuegt eine kontrollierte Ein-/Ausgabe hinzu, **ohne** die 110 geschuetzten Spielquelldateien zu bearbeiten.

## Implementiert

- `quality_v194/endstate_archive_io_v194.cjs`: `importArchive(text, regions)` und `exportArchive(archive, regions)`. Nur explizites Archivschema `pppoppi.endstate.archive.proposal/1`; **keine** stille Migration aus aktiven Spielstaenden.
- Import begrenzt auf 4 MiB UTF-8, 64 Verschachtelungsebenen und 100000 JSON-Knoten; Ablehnung gefaehrlicher Objektschluessel und ungueltiger JSON-Daten.
- Endabrechnung wird aus dem enthaltenen Spielstand mit dem vorhandenen isolierten Endregel-Prototyp **neu berechnet**. Sieger, Rangfolge, Modus, Endmonat, Quelle und alle weiteren Archivfelder muessen exakt zusammenpassen; die Reihenfolge von JSON-Objektschluesseln ist dabei unerheblich.
- Eingelesene Archive werden rekursiv schreibgeschuetzt. Der bisherige `guardArchived` kann auf sie angewendet werden, ist aber weiterhin **nicht** mit der produktiven Spiel-Engine verbunden.
- Neun neue automatisierte Node-Tests und ein zusaetzlicher CI-Schritt im bestehenden Chromium-Hauptjob.

**Wichtige Grenze:** Diese Pruefung belegt nur **innere Konsistenz**, nicht Echtheit oder Unveraenderlichkeit gegen einen absichtlichen Angreifer, der Spielstand und Ergebnis gemeinsam passend faelscht. Es gibt **keine digitale Signatur**, keine Browser-Importoberflaeche und keinen belastbaren Endspielpfad. Archiv-JSON ist **nicht** automatisch ein gueltiger aktiver Spielstand.

## Pruefnachweise

Ausgefuehrt vor dem GitHub-Upload mit Node.js 22.16.0 (isolierter Prototyp und neue Dateien in einem lokalen Testordner):

```bash
node --check endstate_archive_io_v194.cjs
node --check test_endstate_archive_io_v194.cjs
node --test test_endstate_archive_io_v194.cjs
```

**PASS 9/9** (9 Tests, 0 FAIL), Syntax beider neuen Dateien PASS. Geprueft: Kampagnen- und Freispiel-Archiv, JSON-Rundlauf, Schluesselreihenfolge, Sieger-/Wertungs-/Monatsmanipulation, veraenderter Spielstand, offene Rettungsphase, falsches Schema, zusaetzliche Felder, fehlerhaftes JSON, fehlender Feldwert, 4-MiB-Grenze, Tiefenlimit, Prototyp-Schluessel, Schreibschutz und Ablehnung eines aktiven Spielstands als Archiv.

**GitHub-CI:** auf dem neuen Entwicklungszweig nach PR-Erstellung auszuwerten; vorliegende lokale Tests sind **kein** Ersatz fuer die CI. Die bestehende CI auf dem unveraenderten Ausgangs-HEAD `0e6fd588...` war: Browser-CI [#40665593887](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40665593887) PASS, Quellpruefung [#40665593738](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40665593738) PASS, Gesamtgate [#40665593823](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40665593823) FAIL/BLOCKED wegen weiterhin offener Vorrelease-Pflichten.

## Pflichtmatrix und offene Arbeit

- **SPE-03 bleibt BLOCKED**: isolierte Konsistenzpruefung vorhanden, echter Browser-Import, Neustart, Altstand, Manipulations- und Sicherungsfehler der gesamten Endpartie noch offen.
- **SPE-01/02, VER-01/02 und SIC-02 bleiben BLOCKED**: Endspielpfad nicht in Engine/UI integriert; keine durchgaengige Sieg-/Niederlagenpartie und kein Nachweis gegen gezielte, konsistente Datenfaelschung.
- **Gesamtmatrix unveraendert:** 6 PASS, 39 BLOCKED, 4 OPEN, 3 DEFERRED = 52 Pflichten. Die persoenlichen Endabnahmen sind absichtlich zurueckgestellt.
- Keine Veraenderung an den 110 geschuetzten Originaldateien, kein Merge, kein Release.

## Naechste drei Schritte

1. Neue GitHub-CI auf dem finalen PR-HEAD auswerten; fehlgeschlagene Tests gezielt beheben.
2. Getrennten, versionierten Endzustandsadapter mit gesichertem Archivimport und kontrolliertem Abschluss in die **Technikfassung**, nicht in die geschuetzten Originaldateien, einbinden.
3. Vollstaendige Browser-Endpartien mit Sieg, Gleichstand, freiwilligem Ende, Rettungsphase, Import/Neustart, 800x600, Zoom und Tastatur automatisieren; erst danach persoenliche Abnahme.

**Weiterfuehrende Empfehlung:** Bei spaeterem Schutz gegen absichtliche Datenfaelschung ist ein gesonderter Integritaets-/Authentizitaetsvertrag erforderlich; ein lokaler Hash allein reicht dafuer nicht.
