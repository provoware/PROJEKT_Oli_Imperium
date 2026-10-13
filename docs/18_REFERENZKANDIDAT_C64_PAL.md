# REFERENZKANDIDAT R-01 · Deutsche C64-PAL-Ausgabe 1989

**Datum:** 10.10.2026 · **Status:** ARCHIVKANDIDAT, weder Datenträgeridentität noch Emulatorverhalten selbst verifiziert.  
**Archiv:** https://preservation64.de/index.php?title=Oil_Imperium  
**Arbeit:** A historischer Originalnachweis → B bekommt erst danach verbindliche Originalparameter.

## 1. Warum gerade dieses Exemplar?
**Source 3** des Preservation64-Katalogs beschreibt:
- Titel *Oil Imperium*, Entwickler/Verleger reLINE Software, Jahr 1989.
- Land DE, Sprache Deutsch, Computer C64, TV-System PAL.
- Kopierschutz über Handbuchabfrage (Manual Lookup).
- Eintrag `Working? Yes` **laut Archiv** (nicht selbst ausgeführt).
- Archiviert am 17. April 2021 durch „parser“.
- Zwei Datenträgerseiten als G64-Abbilder: `OilImperiumDE parser s0.g64` und `OilImperiumDE parser s1.g64`.

**Quellenkritischer Unterschied:** „Source 1“ listet nur das deutsche Handbuch und **keine vorhandene Diskette**; deshalb wäre dieser Eintrag als ausführbare Referenz ungeeignet. Source 4 und Source 5 sind alternative deutsche PAL-Fundstücke; sie bleiben für einen eventuellen Variantenabgleich verfügbar.

## 2. Was noch NICHT bestätigt ist
[ ] Nutzungs- und Untersuchungsberechtigung für eine konkrete lokale Abbildkopie  
[ ] Tatsächlich erhaltene Dateien (nicht bloß Webseitenlinks)  
[ ] SHA-256-Prüfsumme **für beide Seiten**  
[ ] Dateiformat, Dateigröße, Seitenreihenfolge und Provenienzbeleg  
[ ] VICE/x64sc-Version und lokale Emulatorbedingungen  
[ ] Erfolgreicher Programmstart und dokumentierte etwaige Handbuchabfrage  
[ ] Vergleich von Büro, Weltkarte, Gebiet/Claims und Rückweg  
[ ] Unveränderte PNG-Rohbilder mit Dateihash und Aufnahmeprotokoll  
[ ] Rechteklärung vor Veröffentlichung von Originalbildern oder -programmen

**Wichtig:** Ein Dateihash weist nur eine konkrete Bytefolge aus; er allein beweist weder Originalität noch Lauffähigkeit.

## 3. Sparsames, reproduzierbares Verfahren

### A. Lokales Material, nie automatisch nach GitHub
Originalabbilder rechtmäßig beschaffen. **Nicht** ins öffentliche Repository kopieren. Im Arbeitsverzeichnis `private/` oder in einem privaten lokalen Ordner ablegen; `private/` ist laut `.gitignore` ausgeschlossen.

### B. Einmalige Identitätsbelege
```bash
sha256sum -- "/pfad/zu/OilImperiumDE parser s0.g64" "/pfad/zu/OilImperiumDE parser s1.g64"
ls -lh -- "/pfad/zu/OilImperiumDE parser s0.g64" "/pfad/zu/OilImperiumDE parser s1.g64"
command -v x64sc
```
**Belege separat notieren:** Quelle, Prüfsummen, Dateigrößen, Aufnahmedatum, VICE-Version, Region PAL und lokale Nutzungsgrundlage. Die Archiv-Version kann anhand der Hashes weiter geprüft werden, wenn unabhängige Referenzwerte vorhanden sind.

### C. Genau ein vollständiger Pilotlauf
1. VICE mit dokumentierter PAL-Einstellung starten, erste Diskettenseite einlegen, ggf. im Verlauf die zweite Seite wechseln. Der Startvorgang und eventuell notwendige Handbuchprüfung sind zu protokollieren.
2. Büro als `SCREEN-001` mit sichtbarem Status aufnehmen.
3. Genaue Eingabe zum Kartenobjekt notieren → tatsächliche Weltkarte `SCREEN-002`.
4. Gebiet auswählen → tatsächliche Claim-/Feldinformation; `SCREEN-003` nur vergeben, wenn sich eine unterscheidbare Ansicht bestätigt.
5. Rückweg bis zum Büro durchführen, inklusive aller verwendeten Tasten/Joystickbewegungen und eventueller Ladebildschirme.
6. Nur bei unklarer Aufnahme oder Widerspruch denselben Schritt wiederholen.

### D. PNG-Aufnahmen (VICE-Monitor)
VICE dokumentiert den Monitorbefehl:
```text
screenshot "01_buero.png" 2
```
`2` bedeutet PNG. Die tatsächliche Erreichbarkeit des Monitors und die zu verwendenden Tasten hängen von installierter VICE-Oberfläche/-Version ab. **Dieser Befehl wurde hier nicht am Spiel ausgeführt.**  
Offizielle Anleitung: https://vice-emu.sourceforge.io/vice_12.html

### E. Archivierung und Arbeitskopie
```bash
sha256sum -- "01_buero.png"
ffmpeg -i "01_buero.png" -vf "scale=iw*4:ih*4:flags=neighbor" -frames:v 1 "01_buero_4x.png"
```
Pixelgenaue Arbeitskopie getrennt vom unveränderten Rohbild halten. Die beschriftete Version ist eine Erklärung, nicht das Rohbild. Rechte vor öffentlicher PDF-/GitHub-Verwendung prüfen.

## 4. Prüfkarte je Übergang
`Originalversion | Hash der Diskettenseiten | Emulatorversion | Ausgangsbild | genaue Eingabe | neues Bild | Joystickzustand | Lade-/Zeitfolgen | Rohbild-SHA256 | Regel-ID | Befund | offen?`

| ID | Fragestellung | Gegenprobe | Status |
|---|---|---|---|
| TEST-001 | Büro → Weltkarte? | identischer Ausgangszustand / dokumentierte Steuerung | nicht ausgeführt |
| TEST-002 | Weltkarte → Gebiet → Claims? | Besitz-/Feldinfo fotografieren | nicht ausgeführt |
| TEST-003 | Gebiet/Claims → Büro? | Rückweg/Abbruch inklusive Zwischenschritt | nicht ausgeführt |

## 5. Fachliche Freigabe
`reference.status = candidate` ist ein **reiner Archivstatus**, keine C64-Originalvalidierung. Erst nach rechtmäßiger Dateiidentifikation, zwei Dateihashes und einem nachgewiesenen Emulatorlauf darf ein fachlich Verantwortlicher prüfen, ob `verified` gerechtfertigt ist. Regeln werden **einzeln** beobachtet und abgenommen; ein Spielstart genehmigt keine unbekannten Wirtschaftsformeln.

## 6. Konsequenz für die Softwareplanung B
B darf Entwurfsmodelle für Büro, Karten- und Gebietsansicht spezifizieren. Ungeprüfte Eingabesequenzen, Sprungwege, Koordinaten und Zahlen bleiben als offene Fragen enthalten. B muss hierfür keine historische Internetrecherche durchführen, sondern bekommt die fertige Quellenakte und gezielte Rückfragen an A.

## 7. Effizienz- und Datenschutzregel
Keine unnötigen Massendownloads, kein erneutes Erfassen unveränderter Bilder, keine KI-Routine bei jedem Git-Commit. Nutzungsrechte, Originaldateien und persönliche Identitäten werden nicht ins öffentliche GitHub übernommen.

### Nächste drei Schritte
1. Rechtmäßiges Referenzexemplar mit beiden Diskettenseiten bereitstellen und Hashes protokollieren.
2. Einmalig den vollständigen Navigationsablauf in VICE aufnehmen.
3. Auf Grundlage der realen Befunde REGEL-001..004 und TEST-001..003 einzeln freigeben oder präzise als ungeklärt markieren.

**Weiterführende Empfehlung:** Die Referenzakte als unveränderlichen wissenschaftlichen Datensatz einfrieren, sobald Provenienz, SHA-256-Werte und erfolgreicher Lauf vorliegen.


---

## 8. Öffentlicher Quellen- und Zugriffs-Audit vom 13.10.2026 (KEIN Originaltest)

Dieser Abschnitt protokolliert **öffentlich lesbare Informationen**, nicht einen gestarteten C64 oder ausgelesene Spielbilder. Der Forschungsvertrag bleibt bei `reference.status=candidate`; `TEST-001` bis `TEST-003` bleiben `not_run`.

### Referenzkandidaten und Zugriffsprüfung

| Kandidat | Öffentlich belegte Daten | Zugriff aus der verwendeten Forschungsumgebung |
|---|---|---|
| Preservation64 Source 3 | 1989, DE, C64, PAL, Manual Lookup, laut Archiv lauffähig; `OilImperiumDE parser s0.g64` / `s1.g64` | Metadatenseiten erreichbar; Dateiabruf von Seite 0 mit HTTP 401, externer Datei-Download fehlgeschlagen. **Keine lokalen G64.** |
| Preservation64 Source 4 | Deutsches PAL-Exemplar von 2022 mit G64-Seiten, Handbuch und Codetabelle | Katalog vorhanden; tatsächlicher Emulatorlauf nicht geprüft. Nicht mit Source 3 mischen. |
| Preservation64 Source 5 | Weiteres deutsches PAL-Exemplar von 2022, eigene G64-Seiten, Codetabelle | Katalog vorhanden; tatsächlicher Emulatorlauf nicht geprüft. Nicht mit Source 3 mischen. |
| c64games.de Spiel Nr. 122 | Disketten-, Cartridge- und Handbuch-Angebot; mehrere veröffentlichte Screenshots | Webseite erreichbar; Archiv-Download nicht in lokale Arbeitsumgebung übertragbar. Variantenidentität ungeprüft. |
| CommodoreGames.net GB64-ID 14505 | Browser-Emulation wird angeboten; PAL ausgewiesen; Tastenbelegung veröffentlicht | Webseitenangaben geprüft, **kein interaktiver Emulatorlauf**. Zugehörigkeit zur deutschen Source-3-Version ungeprüft. |
| Gamebase64 ID 14505 | 1989, C64, englisch, Joystick 2, 1–4 Spieler, 2 Disketten; zwei Screenshots | Nachschlagewerk erreichbar. Dort für diese ID ausdrücklich kein Spieldownload gelistet. |
| OldGame.cz | Bezeichnet die **DOS-/PC-Version** als Freeware | Keine nachgewiesene Freeware-Lizenz für C64; diese Etikettierung ist nicht auf C64 übertragbar. |

**Dateigrößen nur laut Archivdateiseite, keine lokalen Messwerte:** Source 3 Seite 0: ungefähr 273 KB; Seite 1: ungefähr 281 KB. **Beide SHA-256-Werte unbekannt.**

### Bedienungs- und Bildinventar als Forschungs-Hypothesen

Das C64-Wiki beschreibt folgende Bereiche, für die nach einem **echten** Emulatorlauf unabhängige C64-PNGs erfasst werden sollen. Eine Aufzählung ist kein Nachweis eines getrennten Originalbildschirms.

1. Start-/Ladeansichten; Spieleranzahl und gegebenenfalls Zielauswahl.
2. Büroansichten (Wiki unterscheidet vier Büros); Kalender, Firmensignet.
3. Firmensignet: Laden-/Speichern-Dialoge.
4. Weltkarte, Regionen, Gebiete, Claims und Besitzangaben.
5. Computermenü: Kaufen, Verkaufen, Bohren, Statistik, Expertise.
6. Computer-Unterdialoge: Claims/Tanks, Vermögen, Geologengutachten, beauftragte oder selbst ausgeführte Bohrung.
7. Telefon und Telegramme; Verträge und Entscheidungen.
8. Schublade: Detektei/Schutz, eigene Unternehmensübersicht, Sabotage.
9. Koffer: Brandbekämpfung durch Fachfirma oder Selbstversuch.
10. Zeitung, Ereignisse, Marktpreisänderungen und Ergebnisse.
11. Aktionssequenzen: Bohrung, Pipelinebau, Ölbrandlöschung.
12. Runden-/Monatswechsel, Spielzielerfüllung/Bankrott.

**Bereits öffentlich vorhandene Bilder:** C64-Wiki zeigt u. a. Bürovarianten und Aktionssequenzen; c64games.de bietet mehrere C64-Screenshots. Die Bilder werden **nicht** als eigene Emulator-Screenshots ausgegeben, nicht in das Repository kopiert und nicht ohne Klärung der Bildrechte erneut veröffentlicht. Achtung: Fotos zu Amiga-/DOS-Versionen dürfen nicht als C64-Nachweis verwendet werden.

### Sekundärquellen: fachliche Hinweise nur zur späteren Gegenprüfung

Das C64-Wiki nennt als mögliche, noch nicht selbst bestätigte Originalregeln: bis zu vier abwechselnde Spieler, Startkapital 5 Mio. US-Dollar, ein monatlicher Spielzug, einzelne Aktionen mit Tageskosten, vier unterschiedliche Siegbedingungen, Joystick an Port 2, Geologengutachten und Verträge. Diese Angaben dienen ausschließlich zum Aufbau eines Testplans; ihre wirtschaftlichen Werte/Formeln und genaue Navigation werden erst nach einem echten Originaltest freigegeben.

### Rechte- und Verfügbarkeitsbefund

- Die **öffentliche Verfügbarkeit** eines Downloads ist **keine Freigabe** durch Urheber oder Rechteinhaber. Eine eindeutige, für die C64-Version geltende Freeware-/Open-Source-/Gemeinfrei-Erklärung wurde im Audit **nicht gefunden**.
- CommodoreGames.net schreibt selbst: `We offer no C64 downloads due to copyright.` Gamebase64 nennt keine Download-Quelle für ID 14505.
- Das ursprüngliche reLINE-Label gilt als seit 2002 eingestellt, doch die Einstellung einer Firma lässt Urheberrechte **nicht** automatisch entfallen; die aktuelle Rechtekette ist ungeklärt.
- § 69d Abs. 3 UrhG kann dem zur Programmnutzung Berechtigten die Untersuchung von Ideen und Grundsätzen während berechtigter Programmausführung erlauben. Daraus folgt **keine pauschale Erlaubnis**, eine beliebige Kopie zu beschaffen oder Originalbilder öffentlich zu verteilen.
- Keine Umgehung von Download-Zugriffssperren, keine Originaldateien in GitHub oder dessen ZIP-Artefakten, keine gefälschten Screenshots oder Prüfsummen.

### Nachprüfbare Fundstellen

- Preservation64: https://preservation64.de/index.php?title=Oil_Imperium
- Metadatenseiten: https://preservation64.de/index.php?title=File:OilImperiumDE_parser_s0.g64 und https://preservation64.de/index.php?title=File:OilImperiumDE_parser_s1.g64
- C64-Wiki: https://www.c64-wiki.de/wiki/Oil_Imperium
- C64games.de: https://www.c64games.de/phpseiten/spieledetail.php?filnummer=122
- Gamebase64: https://gb64.com/game.php?id=14505
- Browser-Emulator: https://www.commodoregames.net/Commodore64/Oil-Imperium-14505.html
- Alte DOS-Kennzeichnung (nicht als C64-Lizenz lesen): https://www.oldgame.cz/tl/oil-imperium
- VICE: https://vice-emu.sourceforge.io/vice_2.html und https://vice-emu.sourceforge.io/vice_12.html
- Deutsches UrhG: https://www.gesetze-im-internet.de/urhg/__69d.html

### Weiterer Prüfstatus

**Selbst durchgeführt:** öffentliche Metadaten-/Quellenprüfung; Downloadversuche aus isolierter Arbeitsumgebung; Prüfung, ob `x64sc` installiert ist (nein). **Nicht durchgeführt:** funktionierender G64-Download; Berechnung realer Dateihashes; Emulatorstart; eigene C64-Screenshots; Handbuchabfrage; Originaltests; Lizenzfreigabe.


---

## 9. Präzisierung: Varianten, Online-Emulation, Lizenz und Ausschlüsse (13.10.2026)

### 9.1 C64-Fassungen dürfen nicht verwechselt werden

Die Gamebase64-Datenbank identifiziert **zwei unterschiedliche** Oil-Imperium-Fassungen:

| Nachweis | Sprache | Archivform laut Datenbank | Bewertung für R-01 |
|---|---|---|---|
| Gamebase64 **5359** | **Deutsch** | `o/OILIM-D0.D64`, zwei Disketten, Cracker/Cruncher **DMAgic**, drei Archiv-Screenshots | Geeignete **sekundäre** deutschsprachige Bedien-/Grafikreferenz; **kein** unbearbeiteter Originaldump |
| Gamebase64 **14505** | **Englisch** | `o/OILIM-E0.D64`, zwei Disketten, Cracker/Cruncher `(None)`, zwei Archiv-Screenshots | Nur englischer Sprach-/Versionsabgleich; **kein** Beleg für deutsches Source-3-Verhalten |
| Preservation64 **Source 3** | **Deutsch / PAL** | Source-3-G64-Seiten `parser s0/s1` und alternative `fromNib`-Seiten | **Bevorzugter** unveränderter Archivkandidat R-01 |
| Preservation64 **Source 4** | Deutsch / PAL | `OilImperium 1989 reLINE parser s0/s1.g64`, Codesheet, Handbuch | Alternative unabhängige Originaldiskette (R-02), getrennte Herkunft und Hashes |
| Preservation64 **Source 5** | Deutsch / PAL | `Oil Imperium stefan h s0/s1.g64`, Codetabelle, Handbuch | Alternative unabhängige Originaldiskette (R-03), getrennte Herkunft und Hashes |
| Preservation64 **Source 2** | Englisch / **NTSC** | `BlackGold sncboom2k s0/s1.g64` | Fremde Sprach-/Videoausgabe; **nicht** stillschweigend mit R-01 mischen |

**Korrektur zu älteren Vergleichen:** Der Online-Emulator für `14505` ist der **englischen** Gamebase64-Ausgabe zugeordnet. Für deutsche Sekundärbeobachtungen wäre die getrennte Seite `/Commodore64/Oil-Imperium-5359.html` naheliegender. Die Webseite erklärt nicht nachweisbar, ob die im Browser tatsächlich geladenen Bytes exakt zur Gamebase64-Version oder zu Preservation64 Source 3 gehören; ein Browserlauf mit Hash-Nachweis steht aus.

- Deutsch: https://gb64.com/game.php?d=18&id=5359
- Englisch: https://gb64.com/game.php?id=14505
- Online Deutsch: https://www.commodoregames.net/Commodore64/Oil-Imperium-5359.html
- Online Englisch: https://www.commodoregames.net/Commodore64/Oil-Imperium-14505.html
- Referenzarchiv: https://preservation64.de/index.php?title=Oil_Imperium

**Forschungsregel:** Auch wenn zwei Fassungen gleich aussehen: Erst Byte-Herkunft, Sprache, PAL-/NTSC-Einstellung, Manipulationskennzeichen und gegebenenfalls Kopierschutzdialog dokumentieren; Bilder niemals mit unzutreffender Versionsangabe etikettieren.

### 9.2 Zusätzliche alternative Bezugs-/Informationsstellen

| Angebot | Öffentlich feststellbar | Offene Einschränkung |
|---|---|---|
| **C64Games.de, Eintrag 122** | Vier anwählbare Screenshot-Ansichten sowie Disketten-/Cartridge- und Handbuch-Verweise | Veröffentlichungsjahr dort **1987**, im Archiv und C64-Wiki **1989**; Katalogkonflikt, kein Nachweis über Dateiversion, Einwilligung oder Lizenz |
| **Planet Emulation** | Mehrere deutsch bezeichnete **D64-Cracks/Varianten** mit getrennten Seiten A/B (1994-Bezeichnung) | Bearbeitete 1994-Variante, nicht identisch mit Original-G64 von 1989; Download ist kein Lizenzbeleg |
| **Project 64** (C64-Handbucharchiv) | Archivtexte/Handbücher und ausdrücklicher Urheberrechtshinweis | Die Webseite erklärt selbst, dass eine Veröffentlichung dort keine freie Weiterverwendung ermöglicht |
| **CommodoreGames.net** | Spielseiten 5359/14505, Joystick-2-Tastenbelegung, Speicherschnappschuss- und Screenshot-Knopf laut Bedienhilfe | Betreiber schreibt ausdrücklich, dass er aus Copyright-Gründen keine C64-Dateien zum Download anbietet; keine Quell-Dateihashes |
| **Preservation64** | Quellenabhängig Original-Diskettenabbilder und Handbücher, inkl. Handbuch-/Codeabfrage | Webseitenkatalog allein ist **keine** allgemeine Lizenz- oder Abrufberechtigung |

- https://www.c64games.de/phpseiten/spieledetail.php?filnummer=122
- https://www.planetemu.net/en/rom/commodore-c64-games-strategy-d64/oil-imperium-1994-reline-software-de-side-a-cr-oug
- https://project64.c64.org/
- https://www.commodoregames.net/Commodore64/Oil-Imperium-5359.html

### 9.3 Quellentrennung (kritischer Schutz gegen falsche Spielregeln)

**NICHT als historische C64-Quelle verwenden:** `wiki.oilimperium.de` und `forum.oilimperium.de` beziehen sich auf ein eigenständiges browserbasiertes Online-Spiel mit Gebäudeverwaltung, Forschungslabor, Aktienmarkt, Hexagon und anderen Mechaniken. Eine Namensähnlichkeit bestätigt keine Zugehörigkeit zum C64-Original von 1989. Daher **keine** dort genannten Zahlen, Regionen, Hexagonfelder, Technologien oder Oberflächen ungeprüft auf unser C64-Projekt übertragen.

**Als historisches Sekundärmaterial geeignet:** `c64-wiki.de/wiki/Oil_Imperium`; hier werden unter anderem Büros, Computer-Untermenüs, Joystick Port 2, Aktionssequenzen und zwei explizit bezeichnete C64-Büro-Screenshots beschrieben. Vor allen späteren Regelübernahmen zusätzlich eine eigene Originalbeobachtung nötig.

### 9.4 Juristische Belastbarkeit

Aktuell **kein verifizierter Rechteinhaber-Nachweis für eine generelle kostenlose Lizenz** der C64-Ausgabe; weder das Label `Freeware` auf einer DOS-Seite noch ein Download-Link, eine eingestellte Firma oder eine Internet-Emulation reichen dafür aus. § 69d Abs. 3 UrhG betrifft unter Voraussetzungen das Beobachten und Testen beim **berechtigten** Ausführen einer Programmkopie; daraus folgt **keine** allgemeine Weitergabebefugnis für Spielcode oder Bildmaterial.

Rechtsgrundlage: https://www.gesetze-im-internet.de/urhg/__69d.html

**Resultat:** Kein neuer historischer Teststatus, keine private G64-Datei, keine Originalgrafik in Git oder Review-ZIP. Entscheidung zu Berechtigung und Weiterverwendung bleibt eine gesonderte menschliche Prüfung.
