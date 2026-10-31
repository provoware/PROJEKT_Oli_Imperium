# Endspielvertrag – isolierter technischer Entwurf, keine Freigabe

**Stand:** 28.10.2026. Nur die eigenstaendige PPPOPPI-Adaption (Projekt C), keine Behauptung ueber das C64-Original. Ausgangsbasis: PR #106 (b21c2d27bf21a75b5479ba57e4c46c0ca212b391), unveraenderter main (d3dc371154cc1089e06f34d0dc4ff04047132360).

## Fachliche Standardentscheidungen als expliziter Vorschlag

- **Freies Spiel:** Keine automatische Siegwertung; bewusstes, bestaetigtes Beenden archiviert den Stand ohne Gewinner. Offene Insolvenz muss zuerst abgeschlossen werden.
- **Kampagne:** Der Spieler waehlt vor Start explizit **12 bis 240 Monate**. Der Schluss wird erst nach der Monatsabrechnung ausgeloest; kein automatischer Abschluss in TURN oder RESCUE. Der Grenzwert ist ein Vorschlag fuer die neue Adaption, keine Originalregel.
- **Wertung (Vorschlag):** Bargeld minus Schulden minus unbezahlte Nicht-Tilgungsrechnungen plus 60 % des Kaufpreises eigener Felder. Die 60 % entsprechen der vorhandenen Notverkaufsberechnung im V0.8.2-Kern. Tilgungsverpflichtungen werden nicht zusaetzlich abgezogen, da die Hauptschuld bereits erfasst ist. Negative Ergebnisse sind erlaubt; intern werden grosse Werte als Ganzzahlen ohne Ueberlauf berechnet. Gleichstand erzeugt denselben Rang und mehrere Gewinner.
- **Insolvenz:** Rettung und Unternehmensneustart sind noch keine automatische Niederlage. Die Regeln fuer ein endgueltiges Ausscheiden bleiben separat zu entscheiden.
- **Daten:** Abschlussarchiv unter pppoppi.endstate.archive.proposal/1, getrennt vom bestehenden pppoppi.berlin.save/0.8.2. Keine stillschweigende Migration. Eingabespielstand wird nicht veraendert; verschachtelte Archivkopie ist in der Laufzeit schreibgeschuetzt.

## Umgesetztes, isoliertes Technikpaket

quality_v194/endstate_candidate_v194.cjs ist eine **nicht mit der Spieloberflaeche oder der Engine verbundene** Bewertungs-/Archivierungsbibliothek. Sie setzt weder einen neuen Spielzustand noch einen automatischen Spielabschluss in der produktiven V0.8.2-Engine. Der optionale Schreibschutz wirkt nur bei Aufruf des gesonderten guardArchived-Adapters; der bestehende E.transition ist nicht umgebaut.

**Pruefbefehl:** node --test project-c/pppoppi-imperium/quality_v194/test_endstate_candidate_v194.cjs

Die Tests pruefen explizite Moduswahl, Grenzen, Rettungsphase, Geld-/Schuldenrechnung, Gleichstand, unveraenderte Originalzustandsdaten, Archivschutz, Fremddaten und JSON-Rundlauf sowie einen echten Monatsbericht des vorhandenen Spielkerns.

## Noch gesperrte Release-Pflichten

- **VER-01/02 BLOCKED:** Kein eingebundener Endspielpfad, keine vollstaendige Browser-Sieg-/Niederlagenpartie; Regeln fuer endgueltiges Ausscheiden noch nicht beschlossen.
- **SPE-01/02/03 BLOCKED:** Prototyp-Archiv ist noch kein persistenter, UI-seitig ladbarer Endspielstand; Browser-Neustart und Altspielstand-Migration fehlen.
- **FEH-02 BLOCKED:** Schlussmonat, Rettung und Doppelabschluss muessen nach Einbindung als echte Spielaktionen geprueft werden.
- **GRA/BED/BAR BLOCKED:** Abschlussansicht, 800x600, Zoom und Tastatur fuer die neue Funktion fehlen.
- **FRE-01 BLOCKED:** Keine technische Gesamtfreigabe. Persoenliche Abnahme erst nach allen technischen Gates und eingefrorenem Kandidaten.

**Naechste drei Schritte:** (1) Vorschlag gegen Spielziele und bestehende Wirtschaftsfunktionen technisch gegenpruefen und eindeutige Ausscheidensregel festlegen; (2) versionierten Abschlussadapter und UI getrennt vom Originalkern implementieren, inkl. sicherem Laden/Archivieren; (3) komplette Sieg-/Gleichstand-/Niederlagen-Browserpartien mit Neustarts, CI, 800x600, Zoom und Tastatur pruefen.

**Keine der 110 geschuetzten Originaldateien geaendert. Kein Merge, kein Release, keine vorgezogene persoenliche Abnahme.**
