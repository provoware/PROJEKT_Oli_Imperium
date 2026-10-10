# PILOT-01 · Technischer Übergabevertrag A → B

**Gültig:** C64-Navigationsentwurf, Originaltreue **offen**. Keine Internetrecherche von B erforderlich.

## 1. An A belegte Originalhinweise
**SRC-001:** C64-Wiki, https://www.c64-wiki.de/wiki/Oil_Imperium : Bürofunktionen, Weltkarte, Gebiet→Claims, Joystick Port 2/Feuerknopf.  
**SRC-002:** Lemon64, https://www.lemon64.com/game/oil-imperium : C64/Joystick Port 2, **kein** Beleg für Menüpfade.  
**SRC-003:** https://frgcb.blogspot.com/2025/03/oil-imperium-relinerainbow-arts-1989.html : Plattformbilder sind unterschiedlich.  

**SRC-004 / Preservation64:** https://preservation64.de/index.php?title=Oil_Imperium – deutscher PAL-Archivkandidat Source 3, ungeprüft; Details in [Referenzkandidat](18_REFERENZKANDIDAT_C64_PAL.md).

**Regel-IDs:** REGEL-001 Büro = Zentrale, REGEL-002 Büro→Weltkarte, REGEL-003 Gebiet→Claim-Information, REGEL-004 Port-2-Eingabe. Alle Status **offen**, nur sekundär beschrieben.

## 2. Auftrag an Arbeit B (konzeptionell, noch kein Programmcode)
- **MOD-001:** Ein Navigationszustandsmodell mit den *hypothetischen* logischen Zuständen `office`, `world_map`, `claim_view`; Variante 'Claim als Unteransicht' ausdrücklich prüfen.
- **MOD-002:** Eingabeadapter Joystick/Feuerknopf → semantische Aktion, ohne originale Bildkoordinaten zu raten.
- Beispielverträge als Vorschlag: `navigate(state, action, context) -> nextState | error`; `interpretInput(input, focus) -> action | ignored`.
- Die Navigation **darf** Felddaten lesen, aber Geld, Ölbestände, Verträge und Eigentum nicht verändern.
- Quellenstatus `open` bleibt sichtbar; er darf nicht durch eine vorhandene Modulstruktur automatisch `approved` werden.

## 3. Eingaben/Ausgaben/Grenzen
**Input:** aktiver Bildschirm, Joystick-Betätigung, optional ausgewählte Region/Claim.  
**Output:** Bildschirmwechsel, gewählte Region, Menü-/Fehlerhinweis, erklärbares Navigationsereignis.  
**Offen:** exaktes Originalbedienobjekt, Navigation zurück, Screens als eigenständige Bilder, Auswahlkoordinaten, Ladeverhalten.  
**Keine Folgewirkung:** rein technische Navigation soll *nicht* die ökonomische Simulation beeinflussen – dieser Satz ist eine Architekturentscheidung und keine belegte C64-Internaussage.

## 4. Test- und Freigabevertrag
**TEST-001..003:** C64-Originalvergleich offen; bei Versionstest genaue Eingabefolge, Bild und Hash nötig.  
**TEST-004:** geplante Strukturprüfung: Zustandsänderung ausschließlich im Navigationsmodul; kein Geld-/Zeit-/Ölwert wird durch Umschalten verändert (falls historische Regeln nichts Gegenteiliges ergeben).  
**Definition of Done B:** Zustandsdiagramm, Schnittstellen, klare unbelegte Punkte, Abhängigkeiten und Tests ohne zusätzliche historische Websuche vollständig entworfen. Noch **keine Freigabe** einer originalgetreuen Implementierung.

## 5. Rückfragen und lokale Sperren
Q-001 (A) genaues Kartenobjekt → blockiert nur TEST-001/Hitbox.  
Q-002 (A) Claims eigener Screen? → blockiert finale Screenstruktur.  
Q-003 (A) welcher Rückweg? → blockiert TEST-003.  
Q-004 (B) Datenfelder Region/Claim? → B erstellt technisches Minimalmodell; bei Abhängigkeiten gezielte Rückfrage an A.  

**Weiterführender Hinweis:** Die gesamte Entwicklungsplanung kann weiterlaufen; nur unverifizierte Originalparameter bleiben ausgespart.
