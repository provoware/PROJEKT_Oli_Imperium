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
