# Projekt C – Fremdspielstand-Import und HTML-Ausgabe absichern

**Datum:** 27.10.2026. **Ausgangsbasis:** PR #94, HEAD `953c27b87b9de9e3dc66c05bca741c119a446985`; `main` `d3dc371154cc1089e06f34d0dc4ff04047132360`.
**Geltung:** nur eigenstaendige PPPOPPI-Adaption, nicht C64-Original. **Pflichten:** SIC-02, SPE-01, FEH-01, FEH-02 (Teilnachweise, Gesamtgates bleiben BLOCKED).

## Risiko und Vorpruefung

Die Spielstand-Datei wird als JSON gelesen und durch `OliV082.validate` geprueft. Firmenbezeichnungen sind erlaubte freie Zeichenketten. Dieselbe Zeichenkette erscheint in HTML-generierten Spielszenen; deshalb muss ein **gueltiger, aber boesartig benannter** Fremdspielstand textuell angezeigt werden, ohne Ereignisattribute oder JavaScript auszufuehren. Ausserdem darf ein abgelehnter Import keine Konten, Buchungen, Firmen, Besitzverhaeltnisse oder andere Werte des laufenden Spiels ersetzen. Die bisherigen Tests pruefen bereits drei fehlerhafte Dateien und Import-Wettlaeufe, aber nicht diese kombinierte Angriffsoberflaeche.

## Neues Pflichtarbeitspaket

`python3 project-c/pppoppi-imperium/quality_v194/test_browser_import_input_security_v194.py`

- Baut eine wegwerfbare `file://`-Technikfassung aus dem fest verifizierten Quellinventar.
- Startet eine echte Partie, importiert eine **nur im Test manipulierte Kopie** mit HTML-Ereignisfragmenten im Firmennamen, verifiziert die gueltige Datenstruktur und prueft acht Spielszenen auf ausgefuehrte Skripte bzw. eingeschleuste HTML-Ereignisattribute.
- Importiert 13 bewusst ungueltige JSON-Strukturen (Primitive, falsches Schema, ungueltige Monatsgrenzen, negative Kasse, doppelte Firma und Aktion, fehlende Firmen/Claims) und verlangt nach **jeder** Ablehnung die exakte Unveraendertheit des gesamten Spielstands.
- Exportiert danach den unveraenderten Spielstand, startet einen neuen Browserkontext und prueft expliziten Reimport sowie erneut sichere Textanzeige.
- Protokolliert JavaScript-Laufzeitfehler und fremde HTTP-Anfragen. Es werden ausschliesslich fluechtige Browserdaten verwendet; **keine** 110 geschuetzten Originaldateien, echten Spielstaende oder `main`-Dateien veraendert.

## Technische Abnahme

Der neue Test ist als verbindlicher Schritt in `.github/workflows/prerelease-browser-project-c.yml` eingetragen. **Bei Erstellung noch nicht auf neuem HEAD durch GitHub-CI bestaetigt: PENDING.** Vor Freigabe tatsaechliche Browser-CI und Quellpruefung auf demselben HEAD pruefen; bei FAIL Ursache beheben, nicht Tests abschwaechen.

Weitere erforderliche Pruefungen: besonders grosse Dateien, alle anderen freien Zeichenketten, Manipulationen an weiteren verschachtelten Datenfeldern, Ressourcenrechte, Fachlogik, vollstaendige Sieg-/Niederlagenpartien. **SIC-02, SPE-01, FEH-01 und FEH-02 bleiben BLOCKED**, auch bei bestandenem Teiltest. Matrix unveraendert: 6 PASS / 39 BLOCKED / 4 OPEN / 3 persoenliche DEFERRED.

## Naechste drei Schritte

1. Neuen GitHub-Browserjob auf finalem Zweig-HEAD auswerten und moegliche Fehler beheben.
2. Weitere strukturierte Fremdeingaben und Fachgrenzen in unabhängigen Pruefungen abdecken.
3. Endregelvertrag fuer die Adaption verbindlich machen und danach vollstaendige Endpartien testen.

**Empfehlung:** Sicherheitstests weiterhin als echte Browserimporte ausfuehren und bei jedem Fehler den letzten gueltigen Zustand vergleichen, statt nur Fehlermeldungen zu zaehlen.

## Tatsaechliche CI-Nachweise auf Implementierungs-HEAD

**Code- und Matrix-HEAD:** `23edc84a193d109ac2565f1dfa6dfa72af43e8ef` (27.10.2026).

- [GitHub-Browserlauf #40588604025](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40588604025): **PASS**, alle vier Chromium-Jobs. Der neue Schritt `Fremde Spielstaende, 13 Strukturfehler und HTML-Escaping in acht Spielszenen` wurde mit **success** abgeschlossen; damit sind die 13 Ablehnungen, acht Szenen und Export/Neustart/Import im abgegrenzten Testumfang nachgewiesen.
- [Quellpruefung #40588603792](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40588603792): **PASS**.
- [Gesamtgate #40588604015](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40588604015): **FAIL/BLOCKED wie vorgeschrieben**, weil 43 Pflichten nicht technisch freigegeben sind und drei persoenliche Abnahmen zurueckgestellt bleiben.

**Evidenz:** `prerelease/evidence/SIC-02-IMPORT-INPUT-PARTIAL-20261027.json`. Diese Nachweise gelten fuer den obigen Code-HEAD; der nachfolgende reine Dokumentations-Commit wird separat durch GitHub-CI geprueft. Kein Gesamt-PASS und keine Aussage ueber alle denkbaren Angriffseingaben.
