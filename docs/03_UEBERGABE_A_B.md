# 03 · Kreuzkooperation und bindender Übergabevertrag

## 3.1 Ein Datensatz, eindeutige IDs
Die Datei `data/contract.json` führt `sources`, `rules`, `screens`, `modules`, `tests`, `questions`. Eine wissenschaftliche Textpassage verweist auf dieselben IDs – Werte nicht nochmals als parallele Datenquelle pflegen.

**Hinweis:** Das JSON-Modell bildet eure Forschung ab, nicht die damalige C64-Programmarchitektur.

## 3.2 Übergabe A → B (Pflichtprofil)
- Regel-ID, Titel, Versionskennung und konkreter Originalbezug.
- Status und Belege: Quellen-ID, Handbuchstelle, Screenshot-ID, Originaltest.
- Geltungsbereich: C64-PAL/Version, Spielmodus, Startzustand.
- Auslöser / Eingaben / Vorbedingungen / erlaubte und unerlaubte Fälle.
- Nachbedingungen: Geld, Zeit, Besitz, Rohstoff, Nachricht, Ereignis, Siegstatus.
- Sonderfälle und dokumentierte Unsicherheit, mögliche Zufallskomponente.
- Mindestens ein beobachtbarer Prüffall und kritische Grenzfallkandidaten.
- Freigabedatum / Revisionshinweis; nur freigegebene Werte als normative Regel.

**Zusatz:** Keine erneute Internetrecherche von B nötig; bei Unvollständigkeit präzise Rückfrage an A.

## 3.3 Rückgabe B → A
- Modul-ID und verknüpfte Regel-IDs.
- Architekturvorschlag, benötigte Daten, erwartete Ein-/Ausgaben.
- Unklare Fachbegriffe und deren konkrete technische Konsequenz.
- Technische Grenzfälle, Fehlerzustände und notwendige Belege.
- Warum die Antwort für B erforderlich ist und **genau welches Modul blockiert** wird.

## 3.4 Fragenmanagement ohne Leerlauf
Prioritäten: P0 = nachgewiesene Gefahr falscher Freigabe oder Datenbeschädigung; P1 = blockiert nächstes Pflichtpaket; P2 = wichtig, unabhängige Arbeit möglich; P3 = Verbesserung ohne Abhängigkeit. Sammelantworten, sofern kein P0/P1.

## 3.5 Lokale Freigabe
**Fachlich freigegeben:** Quellenlage + Regeltext + klarer Geltungsbereich + Nachweis-/Unsicherheitsstatus + mindestens ein Prüfpfad.
**Technisch entwerfbar:** Pflicht-Ein-/Ausgaben festgelegt, auch wenn noch nicht alle historischen Zahlen bestätigt sind.
**Zur originalgetreuen Implementierung freigegeben:** kritische Originalregel mit geeigneter Validierung und Referenztest.

## 3.6 Konfliktregel
Eine einzelne strittige Zahl sperrt nur die endgültige Berechnung, nicht Navigation, Layout, Datenschema oder wissenschaftliche Diskussion. Entscheidung mit Quellenpriorität und Widerspruchsprotokoll; weder A noch B überschreibt stillschweigend den anderen Stand.

## 3.7 Exemplarischer Übergabe-Pilot
Bildschirm „Büro“ → Karte auswählen → Feldinformationen öffnen → Rückweg. A dokumentiert vier Screens/Übergänge, Quellen und Nachweise; B liefert Zustands- und Navigationsmodell, Eingabeschnittstelle und minimale Tests. Die Anzahl vier ist ein **Pilotziel**, nicht eine Behauptung über exakt vier C64-Bildschirme.

**Check:** B spezifiziert den Ablauf nur aus den übergebenen Unterlagen. Fehlende Angaben werden als einzelne Fragen erfasst; unabhängige Arbeit geht weiter.
