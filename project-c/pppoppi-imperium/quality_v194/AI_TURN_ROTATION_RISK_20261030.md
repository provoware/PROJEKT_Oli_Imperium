# BAL-01 – wirtschaftliche Risiken der KI-Zugrotation (30.10.2026)

## Ausgangspunkt und Entscheidungsfrage

Die bisherigen KI-Rotationsversuche im Entwurfs-PR [#137](https://github.com/provoware/PROJEKT_Oli_Imperium/pull/137) zeigen in zwei Märkten positive Gesamtwerte, in zwei weiteren Märkten aber auch Verschlechterungen der gemeinsamen liquiden Nettoposition. Ein Gesamtgewinn kann individuelle Verluste verdecken. **Eine automatische Änderung der Spielregeln wäre daher nicht gerechtfertigt.**

Basis: vor diesem Arbeitspaket Entwicklungs-HEAD 988bbe7baf4d0d2f9ac950956d62fa854895824a, main d3dc371154cc1089e06f34d0dc4ff04047132360. Auf dem vorherigen HEAD waren die KI-, Browser- und Quellschutz-Workflows PASS; die integrierte Vorrelease-Sperre FAIL/BLOCKED wegen offener Pflichten. Alle 110 geschützten Quelldateien und die Spielregeln bleiben unberührt.

## Neue, unabhängig nachrechnende Prüfung

- test_ai_turn_rotation_risk_v194.cjs liest **das im vorangehenden GitHub-CI-Schritt tatsächlich erzeugte** ai_turn_rotation_stress.json; es werden keine Simulationsergebnisse vorgegeben oder neu erfunden.
- Für **12 fest/rotierend gepaarte Fälle und 36 KI-Firmenvergleiche** werden die Original-Firmenzeilen erneut zugeordnet und die vier bereits protokollierten Differenzen unabhängig nachgerechnet. Fehlende, doppelte oder widersprüchliche Fälle führen zu FAIL.
- Pro festem und rotiertem Firmenstand werden Endkasse – Endschulden = liquide Endposition und Endposition – Anfangsposition = Veränderung geprüft. Das sind **72 Firmenzustandsprüfungen** (36 Paare × 2 Varianten) mit jeweils zwei Geldidentitäten, keine externe Bilanzprüfung.
- Zusätzliche Risikokennzahlen: Feldgewinn/-verlust, Liquiditätsverbesserung/-verschlechterung, höhere Endschulden, zusätzliche Sanierungen, größerer maximaler Liquiditätsrückgang, mehr Monate unter dem KI-Liquiditätspuffer sowie **Feldgewinn bei gleichzeitig schlechterer Liquidität**.
- Für beide Märkte wird separat ausgewiesen, wie viele der sechs Rotationsvergleiche die gemeinsame Liquidität verbessern oder verschlechtern. Summen der Firmen-Differenzen müssen exakt den bereits vorhandenen Gruppen-Differenzen entsprechen.
- test_ai_turn_rotation_risk_unit_v194.cjs prüft einen bewusst nachteiligen Feldgewinn, inkonsistente Geldidentitäten, ungleiche Ausgangsbedingungen und ungültige Werte.
- Der vorhandene CI-Workflow führt Syntaxprüfung, Unit-Tests, echte JSON-Gegenrechnung und Strukturkontrolle aus. ai_turn_rotation_risk.json wird als prüfbares Artefakt mitgesichert.

## Wiederholbare Befehle

~~~bash
node --check project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_risk_v194.cjs
node --test project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_risk_unit_v194.cjs
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_stress_v194.cjs > ai_turn_rotation_stress.json
node project-c/pppoppi-imperium/quality_v194/test_ai_turn_rotation_risk_v194.cjs ai_turn_rotation_stress.json > ai_turn_rotation_risk.json
node project-c/pppoppi-imperium/prerelease/check.mjs --schema
~~~

## Freigabestatus und Grenzen

**Neu hinzugefügte Prüfung: PENDING**, bis der GitHub-CI-Lauf auf dem endgültigen Entwicklungs-HEAD abgeschlossen und die tatsächlichen Zahlen ausgewertet sind. Vorher keine PASS- oder Wirtschaftlichkeitsbehauptung. Die 36 Firmenvergleiche sind deterministisch und hängen voneinander ab; sie sind keine statistisch unabhängigen Stichproben.

Die Kennzahl Kasse minus Schulden ist **kein buchhalterischer Gewinn**. Ölbestände, Anlagen, Ölfeldwerte, Forderungen und künftige Zahlungsströme werden nicht bewertet. Das neue Paket ermittelt Risiken, ersetzt keine fachliche Vermögensbewertung, keine historische C64-Referenz und keine Rechteklärung der 77 ausgeschlossenen Archivdateien. **BAL-01 bleibt BLOCKED; 6/52 PASS, 39 BLOCKED, 4 OPEN, 3 persönliche Endabnahmen DEFERRED.**

## Drei nächste Pflichtschritte

1. Den vollständigen KI-CI-Lauf, die Browserregression und den Quellschutz auf dem endgültigen HEAD auswerten; konkrete per-Firma-Verluste, Schuldenerhöhungen und Sanierungen nur aus dem echten JSON-Artefakt berichten.
2. Danach gezielte Schulden- und Sanierungs-Stressfälle mit echten Vermögens-/Gewinnbegriffen und nachvollziehbaren Bewertungsregeln ergänzen. Eine Spielregeländerung erst nach belastbarem Kosten-Nutzen-Vergleich erwägen.
3. Unabhängig die 77 ausgeschlossenen Archivdateien rechtlich prüfen und eine verifizierte C64-PAL-Referenz dokumentieren. Persönliche Sicht-/Kubuntu-Abnahme erst nach vollständig grüner Technik und eingefrorenem Vorrelease-Kandidaten.

**Kein Merge, kein Release, keine persönliche Vorab-Abnahme.**

## Nachtrag 30.10.2026 – Integritätslücke der aggregierten Prüfwerte

Der bisherige Risikoabgleich prüfte nur **Differenzen** zwischen fester und rotierender
Zugfolge. Waren die beiden Gruppen-Gesamtsummen um denselben Betrag falsch, blieb die
Differenz trotzdem korrekt und der Fehler konnte unentdeckt bleiben. Zusätzlich zählte
die JSON-Ausgabe nur 72 Geldidentitäten, obwohl **72 Firmenzustände mit je zwei
Identitäten = 144 Prüfungen** durchlaufen wurden. Die 72 waren somit eine falsche
Bezeichnung der tatsächlichen Prüfanzahl, keine neue Simulation.

Der ergänzte unabhängige Abgleich berechnet für **alle 18 Varianten** die sieben
Gruppenkennzahlen unmittelbar aus den drei Firmenzeilen neu: Feldsumme, kleinste und
größte Feldzahl, Spannweite, Firmen ohne Feld, Summe der Liquiditätsveränderungen und
kleinste Liquiditätsveränderung. Außerdem kontrolliert er die vollständige
2 × 3 × 3-Fallabdeckung, die anfängliche Firmenreihenfolge sowie die absoluten
Feld- und Nullfeldzahlen in allen zwölf Gegenvergleichen. Ein neuer Negativtest
verändert bewusst die Summen und verlangt einen Abbruch.

**Status bei Änderung: PENDING** bis zum tatsächlichen CI-Lauf auf dem endgültigen
Entwicklungs-HEAD. Dies ist eine Absicherung der Testdaten, **kein Nachweis von
Gewinn, Vermögenswert, Sanierungsqualität oder Originaltreue**. BAL-01 bleibt BLOCKED;
der Nenner der Vorrelease-Pflichtmatrix ändert sich nicht. Kein Spielkern-Eingriff.
