# 05 · Tests, Fortschritt und Effizienzkontrolle

## 5.1 Prüfpyramide nur bei Bedarf
1. **Datenkonsistenz:** eindeutige IDs, existierende Quellverweise, zulässige Statusfelder, gültige Tests.
2. **Fachlicher Originalbeleg:** nur kritische/veränderte oder strittige Regeln gezielt im C64-Original prüfen.
3. **Technische Ableitung:** Regel→Modul→Test vollständig? Unbekanntes transparent?
4. **Späterer Nachbau:** gezielte Unit-/Integrations-/Bildschirmtests, wenige Risikoregressionen vor Freigabe.
5. **Stichproben-Durchlauf:** komplette Spielerhandlung nur an Schnittstellen oder bei geänderter Kernlogik.

**Wichtig:** Keine wiederholten Emulatorstarts, Downloads oder vollständigen Testläufe ohne neuen Sachgrund. Alte Belege anhand unveränderter Prüfsumme wiederverwenden.

## 5.2 Drei getrennte Originaltreue-Kennzahlen
- **Abdeckung:** Zahl definierter Pflichtfälle mit überprüftem Ergebnis / alle definierten Pflichtfälle.
- **Übereinstimmung:** erfolgreiche Originalvergleichstests / durchgeführte Originalvergleichstests.
- **Bestätigte Originaltreue:** Gewicht bestandener Originalvergleichs-Pflichtfälle / Gewicht *aller* Pflichtfälle.

**Nicht messbar**, solange kein sinnvoller Testnenner vorhanden ist. Nicht getestete Fälle erhalten nie automatisch grün. Eine grüne Quote gilt nur für die jeweilige geprüfte Testmenge.

## 5.3 Forschung/Technik-Fortschritt
Kennzahlen mit explizitem Umfang: `A: freigegebene Pflichtpakete/definierte Pflichtpakete`, `B: technisch freigegebene Module/definierte Module`, `Original: bestandene Pflichtvergleiche/definierte Pflichtvergleiche`.
**Zusatz:** Dokumentationsfortschritt, Softwarefortschritt und historische Originaltreue nie vermischen.

## 5.4 Grenzfall-Matrix
Geld exakt Grenze / 1 darunter; Feld frei/belegt; Lager leer/voll; fehlende Verträge; letzter Tag des Monats; Speicherstand beschädigt; Ereignis bei Übergang; Gleichstand/Konkurs; Minispielabbruch. Dies sind **Testkandidaten**, keine Aussagen über tatsächliches Verhalten.

## 5.5 Für Änderungen minimale Auswahl
Nur Markdown: Links, Begriffe, Querverweise prüfen.  
Regelkarte: Referenzbelege und abhängige Module/Tests prüfen.  
Validator/JSON: `python3 tools/validate_project.py` und Unittests.  
Späterer Spielkern: betroffene Fachtests, wenige kritische End-zu-End-Tests; gesamte Suite nur bei Release.

## 5.6 Frühe Fehlervermeidung
- Dopplungen: IDs und Einzelquelle der Wahrheit.
- Versionsvermischung: Referenzkennung je Befund.
- Falsches Geld: Einheit, Vorzeichen, Bereich und Rundung festlegen.
- Zeitfehler: Tag-/Monatswechsel nur zentral verwalten.
- Speicherbruch: versioniertes Dateischema und überprüfbare Imports.
- UI-Zustand: Navigationsmodell getrennt von Wirtschaftszustand.
- Zufallsfehler: Testzufallsquelle isolieren.
- Falsche Originaltreue: nur geprüfte Pflichtfälle zählen.
- Unnötige Re-Tests: Änderungsfolgen aus Verweisen bestimmen.
- Scheinfertigstellung: Abnahmebedingungen schon vor Umsetzung festschreiben.

## 5.7 Lokaler Kurzcheck
```bash
python3 tools/validate_project.py
python3 -m unittest discover -s tests -v
```
Die aktuelle Datenbasis ist absichtlich leer: Das Ergebnis muss deshalb bei Originaltreue „nicht messbar“ bleiben.

## 5.8 Abnahme bei Übergabe
Keine offene kritische Abweichung im übergebenen Scope; alle Pflicht-IDs vorhanden oder als offen markiert; Quellengrundlage und Versionsbezug angegeben; vereinbarte minimalen Prüfungen bestanden; Restunsicherheit ausdrücklich benannt.
