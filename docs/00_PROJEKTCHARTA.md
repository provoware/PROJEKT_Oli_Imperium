# 00 · Projektcharta und Hochschulrahmen

## 0.1 Oberziel
*Oil Imperium* für den Commodore 64 wissenschaftlich so beschreiben und modellieren, dass fachfremde Zuhörer seine wichtigsten Systeme verstehen und eine zweite Abschlussarbeit daraus **ohne eigene Internetrecherche zum Originalspiel** eine technische Architektur mit nachvollziehbaren Tests entwerfen kann.

**Zusatznutzen:** Ein System bleibt nur dann reproduzierbar, wenn auch unbekannte Regeln ausdrücklich als unbekannt erfasst werden.

## 0.2 Zwei eigenständige Forschungsfragen
**A:** Wie strukturieren und steuern Benutzeroberfläche, Ökonomie, Zeitmodell, Wettbewerb und Aktionssequenzen die Handlungsmöglichkeiten im dokumentierten C64-Original?
**B:** Welche Softwarearchitektur, Datenverträge, Konsistenzprüfungen und Entwicklungsstrategie erlauben eine beobachtungsverhaltensnahe und prüfbare Rekonstruktion aus der gesicherten A-Spezifikation?

**Weiterführend:** Jede Arbeit legt eigenes Forschungsdesign, Methodik, Ergebnis, Diskussion und Grenzen vor; gemeinsam genutzte Daten und Abbildungen sind zuzuordnen.

## 0.3 Scope / Nicht-Scope
**In Scope:** deutsche C64-PAL-Fassung als Referenzkandidat; Archivierung, Menü-/Bildschirmatlas, Regelmodell, Wirtschaft, Geschicklichkeitsszenen, Spieler-/Computergegner, Tests, wissenschaftliche Dokumentation, Architekturplanung.
**Noch nicht:** tatsächliche vollständige HTML-Implementierung, Veröffentlichung von Originalsoftware, Originalgrafiken ohne Rechte, Deutschland-/PPPOPPI-Adaption als 'original'.

**Weiterführend:** PAL und NTSC sowie Amiga/DOS/Atari ST in getrennten Variantenakten führen; niemals Plattformangaben zusammenwerfen.

## 0.4 Arbeitsannahmen
Forschungsbelege und technische Anforderungen sind unterschiedliche Kategorien. Feldnamen, Module und JSON-Schemata sind **Entwurfsmodelle**, keine Behauptungen über den damaligen Quellcode. Alle Zahlen, Formeln, Ereigniswahrscheinlichkeiten und Schwellen müssen pro Referenz geprüft werden.

## 0.5 Erfolg
A gilt abgeschlossen, wenn der gewählte Scope belegt, alle Pflichtbereiche inventarisiert und offene Fragen bewertet sind; B gilt abgeschlossen, wenn sich anhand des freigegebenen A-Pakets Architektur, Datenflüsse, Grenzfälle, Tests und Entscheidungen ohne historische Internetrecherche nachvollziehen lassen.

**Abnahmeprobe:** B bearbeitet einen ausgewählten Ablauf allein anhand des A-Pakets und stellt genau dokumentierte Rückfragen, wo Belege fehlen.

## 0.6 Verbindliche akademische Fragen
Prüfungsordnung, Zulässigkeit zweier aufeinander aufbauender Arbeiten, Beteiligungs-/Urheberzuordnung, Veröffentlichung, erlaubte KI- und Codex-Nutzung, Zitier- und Reproduktionspflichten schriftlich klären.

## 0.7 Arbeitsgrundsätze
Keine globalen Sperren; keine unbegründeten Aufgaben; kleine Änderungen; Vor- und Nachprüfung; belegte IDs; wissenschaftliche Unsicherheit sichtbar; Fortschritt mit festem Nenner.

## 0.8 Original als Forschungsreferenz – nicht als Produktbestandteil
Die rechtmäßig zugängliche deutsche C64-PAL-Fassung ist ein **lokales Untersuchungsobjekt**. Weder ihre Datenträgerabbilder noch originale Grafiken, Klänge, Programme, Handbuchkopien oder Screenshots werden in Repository, HTML-Spiel, CI oder Prüfarchiven verbreitet. Die rechtliche Zulässigkeit der lokalen Nutzung ist separat zu klären.

Die Forschung erstellt eigenständige, möglichst verhaltensgenaue Spezifikationen mit eindeutiger Unterscheidung zwischen **eigener Beobachtung**, **Interpretation**, **ungeprüfter Hypothese** und **freigegebener Regel**. Arbeit B entwirft die Architektur unabhängig vom historischen Programmcode. Die spätere Umsetzung C verwendet ausschließlich eigenständig entwickelte Software und freigegebene eigene Inhalte. Prüfergebnisse des Originals ersetzen keine Rechteprüfung.

Forschung A und Planung B bearbeiten Teilpakete parallel. Das eingefrorene C0 wird dadurch nicht stillschweigend zum Gesamtspiel erweitert; spätere Gameplay-Module beginnen erst in einer gesondert genehmigten Phase C. Die ursprünglichen Qualitäts- und Freigabetore gelten weiter.
