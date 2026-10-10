# PILOT-01: C64-Büro → Weltkarte → Gebiet und Ölfelder

**Stand:** 10.10.2026 · **Facharbeit A** · **Evidenz:** Sekundärquellen ausgewertet, Originaltest ausstehend.  
**Abgrenzung:** Ausschließlich Commodore 64 (*Oil Imperium*, reLINE, 1989). **Nicht** das andere Online-Spiel unter oilimperium.de/oil-empire.com.

## 1. Ziel / Zweck
Die historische Büro-Navigation, Karten- und Gebietsauswahl für die anschließende technische Arbeit B so präzise dokumentieren, dass B seine Architektur **ohne eigene historische Internetrecherche** modellieren kann. Unbekanntes bleibt ausdrücklich unbekannt.

## 2. Bisherige Belege
- **SRC-001 / C64-Wiki:** https://www.c64-wiki.de/wiki/Oil_Imperium – Vom Büro aus führt die Weltkarte in die Gebietsübersicht; ein gewähltes Gebiet zeigt Claims/Ölfelder und vorhandene Besitzer. Navigation mit Joystick Port 2 und Feuerknopf; Darstellung des Bürobildes. **Status:** Sekundärquelle, kein eigener Emulatorversuch.
- **SRC-002 / Lemon64:** https://www.lemon64.com/game/oil-imperium – C64-Version und Joystick Port 2 als unabhängige Spielmetadaten. **Begrenzt:** bestätigt nicht die Kartenübergänge.
- **SRC-003 / FRGCB:** https://frgcb.blogspot.com/2025/03/oil-imperium-relinerainbow-arts-1989.html – Bildschirme und Kartenansichten unterscheiden sich zwischen Plattformen; keine Übernahme von Amiga-/DOS-Ansichten als C64-Vorlage.

## 3. Analytischer Navigationsentwurf (nicht als Originalcode ausgeben)
```text
[SCREEN-001] Büro
    └─ Kartenobjekt auswählen [REGEL-002; genauen Eingabeablauf verifizieren]
            ↓
[SCREEN-002] Weltkarte
    └─ Gebiet auswählen [REGEL-003; Details noch offen]
            ↓
[SCREEN-003] Ölfeld-/Claim-Information
    └─ Rückweg ?? [Q-003; noch zu prüfen]
```
**Achtung:** `SCREEN-003` ist zunächst nur eine logische Arbeitseinheit; ob das Original einen separaten Bildschirm oder eine Teilansicht benutzt, ist ausdrücklich offen. Belegte Informationen und Hypothesen dürfen nicht vermischt werden.

## 4. Auftragsblatt A
1. **Referenz wählen (CP-A1):** Rechtmäßig verfügbares C64-PAL-Diskettenabbild identifizieren; Herkunft, Hash, Sprache und VICE-Version dokumentieren.
2. **Büro (CP-A2):** Startzustand und Menüobjekte im Emulator erfassen; Rohbild (PNG), Screenshot-Hash, Joystick-Eingabe.
3. **Kartenwechsel (CP-A3):** Exakte Eingabe, tatsächlich erscheinende Ansicht, mögliche Ladezeit, Seiten-/Fensterzustände festhalten.
4. **Gebiet/Claims (CP-A4):** Regionenauswahl, Anzeigen für Felder und Besitzer, evtl. weitere Eingaben dokumentieren.
5. **Rückweg (CP-A5):** Vom Feld-/Gebietsblick zur Weltkarte und ins Büro zurück; Abbruchverhalten und Menü-Ende klären.
6. **Nachvalidierung (CP-A6):** Nur neu zweifelhafte oder kritische Schritte wiederholen. IDs, Fundstellen, Testbelege aktualisieren.
7. **Übergabe (CP-A7):** Zustände, Aktionen, Input/Output, Fehlerfälle und belegte Quellen an B übergeben.

**Abnahme:** Keine Freigabe als Originaltreue ohne eigenen Emulatorversuch. Originale Bilddateien nur bei geklärten Rechten veröffentlichen; zunächst Bildbeschreibungen und Quelllinks.

## 5. Minimal erforderliche Tests
| ID | Gegenstand | Ergebnis |
|---|---|---|
| TEST-001 | Büro→Weltkarte per Originalbedienung | **nicht ausgeführt** |
| TEST-002 | Weltkarte→Gebiet→Ölfeld-/Besitzinformation | **nicht ausgeführt** |
| TEST-003 | Rückweg/Abbruch bis Büro | **nicht ausgeführt** |
| TEST-004 | Technischer Zustandsentwurf ohne wirtschaftliche Nebenwirkungen | **nicht ausgeführt** |

Offen: `Q-001` exakte Karten-Hitbox; `Q-002` Screens/Teilansichten; `Q-003` Rückweg; `Q-004` Datenfelder.

## 6. Ergebnisstand
- Quellen: **3/3** als Rechercheansätze erfasst, nicht als Primärbelege.
- Regeln: **0/4** fachlich freigegeben.
- Module: **0/2** technisch freigegeben.
- Originalvergleich: **0/3** Pflichtfälle durchgeführt, bestätigte Originaltreue in diesem begrenzten Pilot **0/8 gewichteten Punkten**; **gesamtspielbezogene Originaltreue nicht messbar**.
- Referenzdatei, eigene Screenshots und praktischer C64-Test: **offen**.

## 7. Nächste Schritte
1. C64-PAL-Referenz samt Prüfsumme festlegen.
2. Komplette Testfolge Büro→Weltkarte→Gebiet→Büro einmal erfassen.
3. Erst danach Fachregeln bewerten und Architektur/Abnahmetests entsprechend aktualisieren.

**Empfehlung:** Keine HTML-Menüoptik vor dem Bild- und Ablaufnachweis implementieren; der jetzige Pilot liefert den Plan, nicht den Beweis.
