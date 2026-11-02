# Zwischen zwei Sanierungen: Export, Browserneustart und Fortsetzung (28.10.2026)

## Luecke und Geltungsbereich

Die bisherige Zwei-Menschen-Pruefung durchlief H1-Rettungskredit und H2-Sanierungsneustart **im selben Browserkontext**. Sie belegte nicht, ob ein **offener zweiter Sanierungsfall** nach Speichern und einem neuen Browserkontext ohne Buchungsverlust oder doppelte Buchung fortgesetzt werden kann. Dieses Paket erweitert ausschliesslich die eigenstaendige PPPOPPI-Adaption (Projekt C), nicht die unbelegte historische C64-Regelbasis.

**Ausgangsbasis:** [PR #97](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/97), `4a315e4a2a62a10d0b6bf90e7807b73e59267a52`. `main` bei Vorpruefung `d3dc371154cc1089e06f34d0dc4ff04047132360`. Neuer [Entwurfs-PR #98](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/98).

## Reproduzierbarer Test

`python3 project-c/pppoppi-imperium/quality_v194/test_browser_two_humans_v194.py`

1. Offline-Browser bei 800x600; neue Partie mit H1, H2 und zwei KI-Firmen. Beide Menschen fuehren jeweils acht echte sichtbare Wirtschaftshandlungen aus und bestaetigen die Zuguebergabe.
2. Regulare Monatsabrechnung: beide Menschen mit je 80.000 Cent offenen Verpflichtungen; genau ein Monatsbericht.
3. H1 nimmt den Rettungskredit per Schaltflaeche auf. H2 bleibt als einzige Sanierung offen, H1 hat genau eine Kreditbuchung.
4. **Neu:** Vollstaendigen Spielstand in RESCUE-Phase exportieren, wegwerfbaren Browserkontext schliessen und frischen Kontext starten. Exakten JSON-Zustand, offene H2-Forderung, H1-Kreditbuchung und Modellgueltigkeit vergleichen.
5. H2 setzt per sichtbarer Schaltflaeche neu auf. H1s Eigentum und Kredit bleiben bestehen, H2s Felder werden frei und H2 beginnt Generation 2.
6. Spielstand erneut exportieren, frischen Browserkontext starten, importieren und Monat 2 ohne doppelte Kredit-/Monatsbuchung beginnen.
7. Externe HTTP-Anfragen und JavaScript-Laufzeitfehler pruefen. Keine Manipulation von Geld, Schuld, Spielphase oder produktiven Speicherdateien.

## Nachweise und Freigabe

- **Aenderung:** nur bestehender Browserregressionstest erweitert; keine Original-Spielquelle geaendert.
- **Gezielte CI:** Job `chromium-roundtrip` in `.github/workflows/prerelease-browser-project-c.yml`.
- **Basis:** `python3 tools/validate_project.py` und `python3 -m unittest discover -s tests -v`.
- **Matrix:** `node project-c/pppoppi-imperium/prerelease/check.mjs --schema`; `--technical` muss bis zur Vollabnahme **BLOCKED** bleiben.
- **Ergebnis (nach GitHub-Pruefung):** [Chromium-CI #40609519522](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40609519522) **PASS, alle vier Jobs** auf HEAD `4deb5c4e3f8f59f10012c710c23a7bd57d0a36f3`, einschliesslich des erweiterten Zwei-Menschen-Schritts. [Quellpruefung #40609519541](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40609519541) **PASS**. [Gesamtgate #40609519524](https://github.com/provoware/PROJEKT_Oli_Imperium/actions/runs/40609519524) **BLOCKED** (erwartete technische Sperre, Schema/Regression und Quellenpruefung bestanden). Ein frueherer Lauf #40609444650 hatte einen unabhaengigen **FAIL** beim Start des Zoom-Erweiterungs-Serviceworkers; Ursache nicht dauerhaft beseitigt, als Restunsicherheit erfasst.
- **Betroffene Pflichten:** VER-02, VER-03, SPE-01, FEH-03; nur **Teilabdeckung**, selbst bei gruener CI. Alle vier Pflichten und das Gesamtgate bleiben BLOCKED.

## Offen / naechste drei Schritte

1. Den sporadischen Serviceworker-Startfehler der unabhaengigen Zoom-Pruefung gezielt diagnostizieren; keine stillschweigenden Wiederholungen als Ersatz fuer Ursachenbehebung.
2. Vertragsbruch, Notverkauf und mehrere Sanierungsgenerationen mit echten Buchungen und Export/Import testen.
3. Fehlende Endregelentscheidung und vollstaendige Sieg-/Niederlagenpartien technisch absichern; erst danach Release-Kandidat einfrieren.

**Empfehlung:** Die persoenliche Sichtpruefung und den Kubuntu-Praxistest erst nach allen eigenstaendig moeglichen technischen Pflichten sammeln. Kein Merge, kein Release ohne ausdrueckliche Nutzerfreigabe.
