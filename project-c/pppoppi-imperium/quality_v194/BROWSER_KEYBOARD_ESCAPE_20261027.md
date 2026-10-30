# Projekt C – Escape und Fokus-Rueckkehr (27.10.2026)

## Pflichtpaket und Abgrenzung
Nach dem Wirtschaftsketten-Tastaturtest (PR #73) prueft dieses Paket
die native Escape-Schliessung aller registrierten Spielszenen in zwei
CSS-Bildbereichen (800x600 und 400x300) sowie die Rueckgabe des
Tastaturfokus nach zwei tatsaechlich per Tab/Enter geoeffneten Dialogen.

Die Szenen-Inventur wird ueber `PPNavigation191.open` geoeffnet;
sie ist daher **kein** Nachweis fuer die vollstaendige Tastaturbedienung
aller Aktionen. Der verkleinerte CSS-Bildbereich ist **kein** nativer
Browserzoom. Fokuskontrast und reale Sichtabnahme bleiben unbewertet.

## Reproduzieren
```bash
python3 project-c/pppoppi-imperium/quality_v194/test_browser_keyboard_escape_v194.py
```

Das Programm erstellt ausschliesslich eine temporaere, anhand von
110 SHA-256-Pruefsummen validierte Offline-Vorschau und verwirft sie
anschliessend. Es prueft die Schliessung per echtem Escape-Ereignis,
das `close`-Ereignis, die geleerte Navigationshistorie,
die Unveraenderlichkeit des Wirtschaftszustands, die Rueckkehr des
Fokus zu Hilfe-/Uebersicht-Ausloesern sowie JavaScript-Fehler und
externe Netzwerkanfragen.

## Stand und Freigabe
- Ausgangspunkt: PR #73, HEAD `cca33c1c8ca0fe5ba6be3c72a1b04159a4930a92`.
- GitHub-Quellzweig: `agent/prerelease-c-keyboard-escape-20261027-0130`.
- Vorpruefung: Python-Syntax lokal mit `python3 -m py_compile` PASS.
- Browserpruefung auf Implementierungs-HEAD `0ee7a8e027204ccb1464da6828d8c2c671947082`: [Chromium #40427112310](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40427112310) **PASS**, [Quellpruefung #40427112286](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40427112286) **PASS**. Alle 39 Szenen in zwei CSS-Bildbereichen mit Escape geschlossen (78/78), zwei echte Tab/Enter-Dialogoeffnungen je Bildbereich mit Fokus-Rueckkehr (4/4). Kein JavaScript-Fehler, keine externen Anfragen, Spielstand unveraendert.
- [Gesamtmatrix #40427112323](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40427112323) erwartungsgemaess **BLOCKED**, da 39 technische Pflichten noch nicht vollstaendig freigegeben sind. Die Nachweise stehen als PARTIAL unter `prerelease/evidence/` und aendern keine Pflicht auf PASS.
- Nach Eintrag der Teilnachweise: erneute GitHub-CI auf dem endgueltigen Dokumentations-HEAD noch zu kontrollieren.
- BED-02 und BAR-01 bleiben **BLOCKED**; keine neue vollstaendige
  Pflichtfreigabe. Gesamtstand vor dem Paket: **6/52 PASS**.
- `main`, die 110 geschuetzten Originaldateien, vorhandene
  Spielstaende und bestehende PRs bleiben unangetastet.

## Naechste drei Schritte
1. GitHub-Chromium-Lauf auswerten und echte Fehler gezielt korrigieren.
2. Bei gruenem Lauf einen PARTIAL-Nachweis mit finalem HEAD und CI-Link
   in der Pflichtmatrix ergaenzen.
3. Nativen Browserzoom (175/200 Prozent) getrennt von CSS-Verkleinerung
   technisch nachweisen und Fokuskontrast auditieren.

**Empfehlung:** Nur einen belegten Teilfortschritt dokumentieren;
keinen Release-Status oder fachliche Endbedingungen vorwegnehmen.
